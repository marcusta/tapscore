import type { Kysely, Selectable } from 'kysely';
import { sql } from 'kysely';
import type {
    CompetitionLifecycle,
    CompetitionParticipantsTable,
    CompetitionsTable,
    Database,
} from '../db/schema';
import type { PlayerService } from './player.service';
import type { GuestPlayerService } from './guest-player.service';
import {
    defaultConfigProblems,
    type CompetitionDefaultConfig,
} from './competition-config';

// --- Output types ---

/** `{ strategyId, config }` — the leaderboard fold descriptor (Slice 3 registry
 *  validates it; here it is opaque, round-tripped as-is). */
export interface CompetitionAggregation {
    strategyId: string;
    config: unknown;
}

export interface Competition {
    id: string;
    name: string;
    lifecycle: CompetitionLifecycle;
    /**
     * Parsed `default_config_json` (Slice 2 shape — see competition-config.ts).
     * The update path validates before persisting, so a stored config is
     * structurally valid; materialisation still re-checks defensively.
     */
    defaultConfig: CompetitionDefaultConfig | null;
    aggregation: CompetitionAggregation | null;
    pointTemplateId: string | null;
    /** Parsed `cut_rules_json` (opaque until Slice 4). */
    cutRules: unknown | null;
    isResultsFinal: boolean;
    resultsFinalizedAt: string | null;
    ownerPlayerId: string;
    createdAt: string;
}

export interface CompetitionParticipant {
    id: string;
    competitionId: string;
    playerId: string | null;
    guestPlayerId: string | null;
    displayNameSnapshot: string;
    category: string | null;
    cutAfterRound: number | null;
    withdrawnAt: string | null;
    createdAt: string;
}

/** A player XOR guest reference — the roster subject (spec §17 PlayerRef shape). */
export type PlayerRef =
    | { kind: 'player'; id: string }
    | { kind: 'guest'; id: string };

// --- Refusals ---
//
// Lifecycle + roster refusals are DOMAIN outcomes, not exceptions: they return
// a discriminated union with a HUMANIZED message (mirroring the compiler's
// `{ ok: false, diagnostics }` and round-edit locks), never a thrown 500. The
// API serializes them at 200 so the client can render the reason inline.
// Authorization (owner / competition_admin) is the ONE thing that throws
// (ForbiddenError → 403), enforced at the API boundary — see competition-authz.

export type CompetitionRefusalCode =
    // Lifecycle machine
    | 'illegal_transition'
    | 'finalize_reserved'
    | 'competition_finalized'
    // Config / roster gates
    | 'lifecycle_forbids_edit'
    | 'lifecycle_forbids_roster'
    | 'lifecycle_forbids_withdraw'
    // Config validation (Slice 2)
    | 'invalid_default_config'
    // Round materialisation gates (Slice 2)
    | 'lifecycle_forbids_rounds'
    | 'missing_default_config'
    | 'empty_roster'
    // Roster integrity
    | 'already_participant'
    | 'unknown_player'
    | 'unknown_guest'
    | 'participant_not_found';

export interface CompetitionRefusal {
    code: CompetitionRefusalCode;
    message: string;
}

export type CompetitionResult<T> =
    | { ok: true; value: T }
    | { ok: false; refusal: CompetitionRefusal };

function refuse(
    code: CompetitionRefusalCode,
    message: string,
): { ok: false; refusal: CompetitionRefusal } {
    return { ok: false, refusal: { code, message } };
}

// --- Inputs ---

export interface CreateCompetitionInput {
    name: string;
    ownerPlayerId: string;
}

/** Partial config edit — only the provided fields change. `null` clears a field. */
export interface UpdateCompetitionInput {
    id: string;
    name?: string;
    defaultConfig?: unknown | null;
    aggregation?: CompetitionAggregation | null;
    cutRules?: unknown | null;
}

export interface AddParticipantInput {
    competitionId: string;
    playerRef: PlayerRef;
    category?: string | null;
}

// --- Row mapping ---

type CompetitionRow = Selectable<CompetitionsTable>;
type ParticipantRow = Selectable<CompetitionParticipantsTable>;

function parseJson(value: string | null): unknown | null {
    return value === null ? null : JSON.parse(value);
}

function toCompetition(row: CompetitionRow): Competition {
    return {
        id: row.id,
        name: row.name,
        lifecycle: row.lifecycle,
        defaultConfig: parseJson(
            row.default_config_json,
        ) as CompetitionDefaultConfig | null,
        aggregation: row.aggregation_json
            ? (JSON.parse(row.aggregation_json) as CompetitionAggregation)
            : null,
        pointTemplateId: row.point_template_id,
        cutRules: parseJson(row.cut_rules_json),
        isResultsFinal: row.is_results_final === 1,
        resultsFinalizedAt: row.results_finalized_at,
        ownerPlayerId: row.owner_player_id,
        createdAt: row.created_at,
    };
}

function toParticipant(row: ParticipantRow): CompetitionParticipant {
    return {
        id: row.id,
        competitionId: row.competition_id,
        playerId: row.player_id,
        guestPlayerId: row.guest_player_id,
        displayNameSnapshot: row.display_name_snapshot,
        category: row.category,
        cutAfterRound: row.cut_after_round,
        withdrawnAt: row.withdrawn_at,
        createdAt: row.created_at,
    };
}

/**
 * Competition = the aggregator wrapping 1..N CompetitionRounds (spec §5).
 *
 * Lifecycle machine (the enforced rules — Phase 4 Slice 1):
 *
 *   draft ──▶ setup ──▶ active ──▶ finalized
 *
 *   - `transition(id, to)` walks FORWARD one adjacent step only
 *     (draft→setup, setup→active). Non-adjacent / backward steps refuse
 *     `illegal_transition`.
 *   - active→finalized is RESERVED: `transition(id, 'finalized')` always
 *     refuses `finalize_reserved`. Finalization is a computation (Slice 4)
 *     that must ALSO write the immutable `competition_results` snapshot and
 *     flip `is_results_final`; the generic transition path is deliberately not
 *     that door, so the schema's finalized-consistency invariant can't be
 *     violated by a bare lifecycle bump.
 *   - Once `finalized`, ALL mutation refuses (`competition_finalized`) — the
 *     first real lock in the app (friendly rounds never lock; competition
 *     results do, per spec §9 / §10).
 *
 * Config + roster rules where the spec left latitude (chosen here, and the ONLY
 * source of truth for them):
 *
 *   - Config edits (name / default config / aggregation / cut rules): allowed
 *     in `draft` + `setup` only. Once `active`, config is frozen (rounds are
 *     being played off the copied defaults); refuse `lifecycle_forbids_edit`.
 *   - Roster ADD / REMOVE: `draft` + `setup` only (build the field before play);
 *     refuse `lifecycle_forbids_roster` once active/finalized.
 *   - Roster WITHDRAW: `setup` + `active` (a player pulls out mid-competition);
 *     stamps `withdrawn_at`, KEEPS the row for audit + aggregation exclusion;
 *     refuse `lifecycle_forbids_withdraw` when finalized (nothing more to change).
 *
 * Authorization is NOT enforced here — it is an API-boundary concern
 * (CompetitionAuthz: owner_player_id or a competition_admin grant). Read paths
 * stay open per app convention.
 */
export class CompetitionService {
    constructor(
        private db: Kysely<Database>,
        private players: PlayerService,
        private guests: GuestPlayerService,
    ) {}

    // Forward-only adjacency (excludes the reserved active→finalized edge).
    private static readonly FORWARD: Partial<
        Record<CompetitionLifecycle, CompetitionLifecycle>
    > = { draft: 'setup', setup: 'active' };

    // Config + add/remove roster edits are allowed in these phases only.
    private static readonly EDITABLE: ReadonlySet<CompetitionLifecycle> = new Set<
        CompetitionLifecycle
    >(['draft', 'setup']);

    // --- Queries ---

    async get(id: string): Promise<Competition | null> {
        const row = await this.db
            .selectFrom('competitions')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        return row ? toCompetition(row) : null;
    }

    /**
     * Competitions the player can administer: those they own, UNION those in
     * `alsoIncludeIds` (the API passes the ids of the player's
     * competition_admin grants). Newest first, deduped.
     */
    async listForPlayer(
        playerId: string,
        alsoIncludeIds: string[] = [],
    ): Promise<Competition[]> {
        let q = this.db.selectFrom('competitions').selectAll();
        if (alsoIncludeIds.length > 0) {
            q = q.where((eb) =>
                eb.or([
                    eb('owner_player_id', '=', playerId),
                    eb('id', 'in', alsoIncludeIds),
                ]),
            );
        } else {
            q = q.where('owner_player_id', '=', playerId);
        }
        const rows = await q.orderBy(sql`rowid`, 'desc').execute();
        return rows.map(toCompetition);
    }

    async listParticipants(competitionId: string): Promise<CompetitionParticipant[]> {
        const rows = await this.db
            .selectFrom('competition_participants')
            .selectAll()
            .where('competition_id', '=', competitionId)
            .orderBy(sql`rowid`, 'asc')
            .execute();
        return rows.map(toParticipant);
    }

    async findParticipant(participantId: string): Promise<CompetitionParticipant | null> {
        const row = await this.db
            .selectFrom('competition_participants')
            .selectAll()
            .where('id', '=', participantId)
            .executeTakeFirst();
        return row ? toParticipant(row) : null;
    }

    // --- Create ---

    /** The creator becomes `owner_player_id`; initial lifecycle is `draft`. */
    async create(input: CreateCompetitionInput): Promise<Competition> {
        const id = crypto.randomUUID();
        await this.db
            .insertInto('competitions')
            .values({
                id,
                name: input.name,
                lifecycle: 'draft',
                owner_player_id: input.ownerPlayerId,
                // JSON/config columns default to NULL; is_results_final defaults 0.
            })
            .execute();
        const row = await this.db
            .selectFrom('competitions')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirstOrThrow();
        return toCompetition(row);
    }

    // --- Update (config while lifecycle allows) ---

    async update(
        input: UpdateCompetitionInput,
    ): Promise<CompetitionResult<Competition>> {
        const current = await this.get(input.id);
        if (!current) return refuse('participant_not_found', 'Competition not found.');
        const gate = this.gateConfigEdit(current.lifecycle);
        if (gate) return gate;

        // Slice 2 — a provided (non-null) default config must be structurally
        // valid BEFORE it persists, so round materialisation always copies from
        // a well-formed document. `null` still clears the field.
        if (input.defaultConfig !== undefined && input.defaultConfig !== null) {
            const problems = defaultConfigProblems(input.defaultConfig);
            if (problems.length > 0) {
                return refuse(
                    'invalid_default_config',
                    `The default round configuration is not valid — ${problems.join('; ')}.`,
                );
            }
        }

        const patch: Partial<{
            name: string;
            default_config_json: string | null;
            aggregation_json: string | null;
            cut_rules_json: string | null;
        }> = {};
        if (input.name !== undefined) patch.name = input.name;
        if (input.defaultConfig !== undefined)
            patch.default_config_json =
                input.defaultConfig === null ? null : JSON.stringify(input.defaultConfig);
        if (input.aggregation !== undefined)
            patch.aggregation_json =
                input.aggregation === null ? null : JSON.stringify(input.aggregation);
        if (input.cutRules !== undefined)
            patch.cut_rules_json =
                input.cutRules === null ? null : JSON.stringify(input.cutRules);

        if (Object.keys(patch).length > 0) {
            await this.db
                .updateTable('competitions')
                .set(patch)
                .where('id', '=', input.id)
                .execute();
        }
        const row = await this.db
            .selectFrom('competitions')
            .selectAll()
            .where('id', '=', input.id)
            .executeTakeFirstOrThrow();
        return { ok: true, value: toCompetition(row) };
    }

    // --- Lifecycle transition ---

    async transition(
        id: string,
        to: CompetitionLifecycle,
    ): Promise<CompetitionResult<Competition>> {
        const current = await this.get(id);
        if (!current) return refuse('participant_not_found', 'Competition not found.');
        const from = current.lifecycle;

        if (from === 'finalized') {
            return refuse(
                'competition_finalized',
                'This competition is finalized — its results are locked and cannot change.',
            );
        }
        if (to === 'finalized') {
            return refuse(
                'finalize_reserved',
                'Finalizing a competition freezes its results and is done through the finalize action, not a lifecycle change.',
            );
        }
        if (CompetitionService.FORWARD[from] !== to) {
            return refuse(
                'illegal_transition',
                `A competition cannot move from ${from} to ${to}. It advances one step at a time: draft → setup → active.`,
            );
        }

        await this.db
            .updateTable('competitions')
            .set({ lifecycle: to })
            .where('id', '=', id)
            // Guard against a concurrent transition racing past `from`.
            .where('lifecycle', '=', from)
            .execute();
        const row = await this.db
            .selectFrom('competitions')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirstOrThrow();
        return { ok: true, value: toCompetition(row) };
    }

    // --- Roster ---

    async addParticipant(
        input: AddParticipantInput,
    ): Promise<CompetitionResult<CompetitionParticipant>> {
        const competition = await this.get(input.competitionId);
        if (!competition)
            return refuse('participant_not_found', 'Competition not found.');
        const gate = this.gateRosterEdit(competition.lifecycle);
        if (gate) return gate;

        // Resolve + snapshot the display name at add time (spec §9).
        let displayName: string;
        if (input.playerRef.kind === 'player') {
            const player = await this.players.getById(input.playerRef.id);
            if (!player)
                return refuse('unknown_player', 'That player does not exist.');
            displayName = player.displayName;
        } else {
            const guest = await this.guests.findById(input.playerRef.id);
            if (!guest)
                return refuse('unknown_guest', 'That guest does not exist.');
            displayName = guest.displayName;
        }

        // Refuse a duplicate up-front with a humanized message (the DB unique
        // constraint is the backstop for a race).
        const existing = await this.db
            .selectFrom('competition_participants')
            .select('id')
            .where('competition_id', '=', input.competitionId)
            .where(
                input.playerRef.kind === 'player' ? 'player_id' : 'guest_player_id',
                '=',
                input.playerRef.id,
            )
            .executeTakeFirst();
        if (existing)
            return refuse(
                'already_participant',
                `${displayName} is already in this competition.`,
            );

        const id = crypto.randomUUID();
        await this.db
            .insertInto('competition_participants')
            .values({
                id,
                competition_id: input.competitionId,
                player_id: input.playerRef.kind === 'player' ? input.playerRef.id : null,
                guest_player_id:
                    input.playerRef.kind === 'guest' ? input.playerRef.id : null,
                display_name_snapshot: displayName,
                category: input.category ?? null,
            })
            .execute();
        const row = await this.db
            .selectFrom('competition_participants')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirstOrThrow();
        return { ok: true, value: toParticipant(row) };
    }

    /** Hard-remove a roster row (draft/setup only). */
    async removeParticipant(
        participantId: string,
    ): Promise<CompetitionResult<{ removed: true }>> {
        const participant = await this.findParticipant(participantId);
        if (!participant)
            return refuse('participant_not_found', 'That participant is not in this competition.');
        const competition = await this.get(participant.competitionId);
        // A participant always has a competition (FK); the read is for the gate.
        const gate = this.gateRosterEdit(competition!.lifecycle);
        if (gate) return gate;

        await this.db
            .deleteFrom('competition_participants')
            .where('id', '=', participantId)
            .execute();
        return { ok: true, value: { removed: true } };
    }

    /**
     * Withdraw a participant: stamp `withdrawn_at`, KEEP the row. Allowed while
     * `setup`/`active` (refused only when finalized). Idempotent — re-withdrawing
     * preserves the original `withdrawn_at`.
     */
    async withdrawParticipant(
        participantId: string,
        now: string,
    ): Promise<CompetitionResult<CompetitionParticipant>> {
        const participant = await this.findParticipant(participantId);
        if (!participant)
            return refuse('participant_not_found', 'That participant is not in this competition.');
        const competition = await this.get(participant.competitionId);
        if (competition!.lifecycle === 'finalized') {
            return refuse(
                'lifecycle_forbids_withdraw',
                'This competition is finalized — the roster is locked.',
            );
        }

        await this.db
            .updateTable('competition_participants')
            .set({ withdrawn_at: now })
            .where('id', '=', participantId)
            .where('withdrawn_at', 'is', null)
            .execute();
        const row = await this.db
            .selectFrom('competition_participants')
            .selectAll()
            .where('id', '=', participantId)
            .executeTakeFirstOrThrow();
        return { ok: true, value: toParticipant(row) };
    }

    // --- Lifecycle gates (shared) ---

    private gateConfigEdit(
        lifecycle: CompetitionLifecycle,
    ): { ok: false; refusal: CompetitionRefusal } | null {
        if (lifecycle === 'finalized')
            return refuse(
                'competition_finalized',
                'This competition is finalized — its configuration is locked.',
            );
        if (!CompetitionService.EDITABLE.has(lifecycle))
            return refuse(
                'lifecycle_forbids_edit',
                'A competition can only be reconfigured while it is a draft or in setup — once it is active its settings are frozen.',
            );
        return null;
    }

    private gateRosterEdit(
        lifecycle: CompetitionLifecycle,
    ): { ok: false; refusal: CompetitionRefusal } | null {
        if (lifecycle === 'finalized')
            return refuse(
                'competition_finalized',
                'This competition is finalized — the roster is locked.',
            );
        if (!CompetitionService.EDITABLE.has(lifecycle))
            return refuse(
                'lifecycle_forbids_roster',
                'Players can only be added or removed while the competition is a draft or in setup. Once it is active, withdraw a player instead.',
            );
        return null;
    }
}
