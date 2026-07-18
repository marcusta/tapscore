import { sql, type Insertable, type Kysely, type Selectable } from 'kysely';
import type { CompetitionRoundsTable, Database, RoundStatus } from '../db/schema';
import type { CompilerDiagnostic } from '../domain/compiler/types';
import {
    isIdentityProducer,
    type DraftFormatSelection,
    type DraftPlayingGroup,
    type DraftProducer,
    type RoundSetupDraft,
} from '../domain/round-setup/draft';
import { START_LIST_PRESETS } from '../domain/round-setup/start-list-policy';
import {
    defaultConfigProblems,
    type CompetitionDefaultConfig,
} from './competition-config';
import type {
    CompetitionParticipant,
    CompetitionRefusal,
    CompetitionService,
} from './competition.service';
import type { FriendlyRoundService } from './friendly-round.service';
import type { GuestPlayerService } from './guest-player.service';
import type { PlayerService } from './player.service';
import type { Round } from './round.service';
import type { TeeService } from './tee.service';

// --- Output types ---

export interface CompetitionRound {
    id: string;
    competitionId: string;
    roundId: string;
    roundNumber: number;
    cutEligible: boolean;
    postCut: boolean;
    createdAt: string;
}

/**
 * One row of a competition's rounds list (the client detail page's single
 * fetch). `shareToken` is the round's token front door — the API strips it
 * for non-admin readers. Nullable only in theory (LEFT JOIN); materialisation
 * always mints the wrapper.
 */
export interface CompetitionRoundSummary extends CompetitionRound {
    status: RoundStatus;
    completedAt: string | null;
    date: string;
    courseNameSnapshot: string | null;
    shareToken: string | null;
}

/**
 * Result of materialising round N. Two failure shapes, discriminated by key:
 *   - `refusal`      — competition-level gate (lifecycle, missing config,
 *                      empty roster), same humanized union as the rest of
 *                      CompetitionService;
 *   - `diagnostics`  — per-participant / draft problems in the compiler's
 *                      `{code,message,path}` shape, exactly what the create
 *                      wizard already renders (missing gender/handicap,
 *                      unresolvable tee, builder/compile failures).
 */
export type MaterialiseRoundResult =
    | {
          ok: true;
          competitionRound: CompetitionRound;
          round: Round;
          /** The round's token front door — same credential the round UI uses. */
          shareToken: string;
          /** The draft the defaults were copied into (round-owned from here on). */
          draft: RoundSetupDraft;
      }
    | { ok: false; refusal: CompetitionRefusal }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

// --- Inputs ---

export interface MaterialiseRoundInput {
    competitionId: string;
    /** The round's course — per round, NOT a competition default (Friday and
     *  Saturday may play different courses). Category→tee selectors resolve
     *  against this course. */
    courseId: string;
    playedAt: string;
    roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes';
    venueType?: 'outdoor' | 'indoor';
    /** SERVER-resolved session identity (the admin materialising) — becomes
     *  the wrapper's creator, never accepted from the request body. */
    createdByPlayerId: string | null;
}

// --- Row mapping ---

type CompetitionRoundRow = Selectable<CompetitionRoundsTable>;
type CompetitionRoundInsert = Insertable<CompetitionRoundsTable>;

function toCompetitionRound(row: CompetitionRoundRow): CompetitionRound {
    return {
        id: row.id,
        competitionId: row.competition_id,
        roundId: row.round_id,
        roundNumber: row.round_number,
        cutEligible: row.cut_eligible === 1,
        postCut: row.post_cut === 1,
        createdAt: row.created_at,
    };
}

function refuse(
    code: CompetitionRefusal['code'],
    message: string,
): { ok: false; refusal: CompetitionRefusal } {
    return { ok: false, refusal: { code, message } };
}

/**
 * CompetitionRound = a Round materialised from its Competition's defaults
 * (spec §4; PHASES.md Phase 4 design decision #1).
 *
 * Inheritance is SETUP-TIME COPYING, not runtime lookup: `materialise` copies
 * `competition.defaultConfig` (slots, category→tee map, start-list mode) into
 * a brand-new `RoundSetupDraft`, mints the round through the SAME create
 * machinery the friendly flow uses (`FriendlyRoundService.create` →
 * `RoundService.createFromDraft`), then inserts the 1:1 `competition_rounds`
 * wrapper row. From that moment the draft belongs to the ROUND: the admin
 * edits it freely through the existing token-scoped round-edit machinery
 * (Friday better-ball, Saturday singles), and corrections keep flowing
 * through the per-round `setup_correction_event` recompile path. The Round
 * engine — and the round-edit service — carry ZERO competition knowledge.
 *
 * Token front door: the friendly wrapper (share token) is deliberately minted
 * for competition rounds too. Every existing play/score/edit surface is
 * token-scoped through `friendly_rounds` (2.6e trust boundary), and Phase 4
 * keeps play paths token-scoped per round — reusing the wrapper is what lets
 * the existing round UI and endpoints open a competition round UNCHANGED.
 * The public friendly-rounds landing list excludes competition-wrapped rounds
 * (see FriendlyRoundService.list) so the token only travels via the
 * admin-gated competition detail read and the materialise response.
 *
 * Lifecycle: materialisation is allowed in `setup` AND `active` — setup so the
 * admin can stage round 1 (and its start list) before play begins, active so
 * round N+1 can be created mid-competition (Saturday's round after Friday is
 * underway). `draft` refuses (defaults + roster are still being assembled —
 * advance to setup first); `finalized` refuses like every other mutation.
 *
 * Category→tee resolution, per participant:
 *   1. participant has a category AND `categoryTees[category]` exists → that tee;
 *   2. otherwise `fallbackTee` when configured;
 *   3. otherwise a `tee_unresolved` diagnostic naming the participant — the
 *      round is NOT created (nothing half-materialises).
 * Resolved tees must exist and belong to the round's course (same
 * `unknown_tee` / `tee_wrong_course` diagnostics as the edit path).
 *
 * `post_cut` is stamped at materialise time: 1 when ANY participant already
 * carries `cut_after_round` (a cut has been applied before this round), so
 * Slice 4's cut needs no schema change here. Cut and withdrawn participants
 * are excluded from the materialised roster.
 */
export class CompetitionRoundService {
    constructor(
        private db: Kysely<Database>,
        private competitions: CompetitionService,
        private friendlyRounds: FriendlyRoundService,
        private players: PlayerService,
        private guests: GuestPlayerService,
        private tees: TeeService,
    ) {}

    // --- Queries ---

    private competitionRoundSummaries(competitionId: string) {
        return this.db
            .selectFrom('competition_rounds as cr')
            .innerJoin('rounds as r', 'r.id', 'cr.round_id')
            .leftJoin('friendly_rounds as fr', 'fr.round_id', 'cr.round_id')
            .where('cr.competition_id', '=', competitionId)
            .select([
                'cr.id',
                'cr.competition_id',
                'cr.round_id',
                'cr.round_number',
                'cr.cut_eligible',
                'cr.post_cut',
                'cr.created_at',
                'r.status',
                'r.completed_at',
                'r.date',
                'r.course_name_snapshot',
                'fr.share_token',
            ]);
    }

    private competitionRoundRows() {
        return this.db.selectFrom('competition_rounds').selectAll();
    }

    private competitionRoundById(id: string) {
        return this.competitionRoundRows().where('id', '=', id);
    }

    private competitionRoundByRoundId(roundId: string) {
        return this.competitionRoundRows().where('round_id', '=', roundId);
    }

    private insertCompetitionRound(values: CompetitionRoundInsert) {
        return this.db.insertInto('competition_rounds').values(values);
    }

    private maxRoundNumber(competitionId: string) {
        return this.db
            .selectFrom('competition_rounds')
            .select(sql<number | null>`max(round_number)`.as('max'))
            .where('competition_id', '=', competitionId);
    }

    private cutParticipant(competitionId: string) {
        return this.db
            .selectFrom('competition_participants')
            .select('id')
            .where('competition_id', '=', competitionId)
            .where('cut_after_round', 'is not', null)
            .limit(1);
    }

    // --- Methods ---

    async listForCompetition(competitionId: string): Promise<CompetitionRoundSummary[]> {
        const rows = await this.competitionRoundSummaries(competitionId)
            .orderBy('cr.round_number', 'asc')
            .execute();
        return rows.map((row) => ({
            ...toCompetitionRound(row),
            status: row.status,
            completedAt: row.completed_at,
            date: row.date,
            courseNameSnapshot: row.course_name_snapshot,
            shareToken: row.share_token,
        }));
    }

    async findByRoundId(roundId: string): Promise<CompetitionRound | null> {
        const row = await this.competitionRoundByRoundId(roundId).executeTakeFirst();
        return row ? toCompetitionRound(row) : null;
    }

    // --- Materialise round N from the competition defaults ---

    async materialise(input: MaterialiseRoundInput): Promise<MaterialiseRoundResult> {
        // --- Competition-level gates (humanized refusals) ---------------------
        const competition = await this.competitions.get(input.competitionId);
        if (!competition)
            return refuse('participant_not_found', 'Competition not found.');
        if (competition.lifecycle === 'finalized') {
            return refuse(
                'competition_finalized',
                'This competition is finalized — no more rounds can be created.',
            );
        }
        if (competition.lifecycle === 'draft') {
            return refuse(
                'lifecycle_forbids_rounds',
                'Rounds are created once the competition is in setup — finish drafting (defaults and roster) and move it to setup first.',
            );
        }

        const config = competition.defaultConfig;
        if (config === null) {
            return refuse(
                'missing_default_config',
                'Set the competition’s default round configuration (formats and tees) before creating rounds.',
            );
        }
        // Defensive re-check — update() validates, but a row could predate it.
        const problems = defaultConfigProblems(config);
        if (problems.length > 0) {
            return refuse(
                'invalid_default_config',
                `The stored default round configuration is not valid — ${problems.join('; ')}. Fix it before creating rounds.`,
            );
        }

        // --- Roster: participants minus withdrawn minus cut -------------------
        const roster = (
            await this.competitions.listParticipants(input.competitionId)
        ).filter((p) => p.withdrawnAt === null && p.cutAfterRound === null);
        if (roster.length === 0) {
            return refuse(
                'empty_roster',
                'Add at least one participant to the roster before creating a round.',
            );
        }

        // --- Producers: roster → draft producers (compiler-shaped diagnostics) -
        const built = await this.buildProducers(roster, config, input.courseId);
        if (!built.ok) return built;
        const producers = built.producers;

        // --- The copied draft — round-owned from here on -----------------------
        const draft: RoundSetupDraft = {
            courseId: input.courseId,
            playedAt: input.playedAt,
            ...(input.roundType ? { roundType: input.roundType } : {}),
            ...(input.venueType ? { venueType: input.venueType } : {}),
            producers,
            // Setup-time COPY of the default slots (already a fresh object —
            // `defaultConfig` is parsed from JSON per read). Editing this
            // round's formats later never touches the competition document.
            formats: config.slots as DraftFormatSelection[],
            ...buildStartList(config, producers),
            // Setup-time COPY of the start-list POLICY (Phase 5.5), defaulting
            // to the `organized` preset: a competition round's start list is
            // admin-built unless the competition opts into self-service. From
            // here on the policy is ROUND data — editable per round through
            // the normal setup-edit path, enforced purely from the draft
            // (never by asking "is this a competition").
            startList: config.startListPolicy ?? START_LIST_PRESETS.organized,
        };

        // --- Mint through the EXISTING create machinery ------------------------
        // Same path the friendly flow uses: compile-or-diagnose, then wrapper +
        // share token. Invalid setup mints nothing.
        const created = await this.friendlyRounds.create(
            draft,
            input.createdByPlayerId,
        );
        if (!created.ok) return { ok: false, diagnostics: created.diagnostics };

        // --- The 1:1 competition wrapper row -----------------------------------
        // Mirrors how the friendly wrapper follows its round: the round commits
        // first, the wrapper row lands right after (a racing materialise falls
        // to the (competition_id, round_number) unique constraint).
        const nextNumber = await this.nextRoundNumber(input.competitionId);
        const postCut = await this.cutHasBeenApplied(input.competitionId);
        const id = crypto.randomUUID();
        await this.insertCompetitionRound({
            id,
            competition_id: input.competitionId,
            round_id: created.round.id,
            round_number: nextNumber,
            post_cut: postCut ? 1 : 0,
            // cut_eligible defaults to 1 (counts toward the cut) per spec §4.
        }).execute();
        const row = await this.competitionRoundById(id).executeTakeFirstOrThrow();

        return {
            ok: true,
            competitionRound: toCompetitionRound(row),
            round: created.round,
            shareToken: created.friendlyRound.shareToken,
            draft,
        };
    }

    // --- Internals -------------------------------------------------------------

    /**
     * Roster rows → draft producers: player-ref/guest-ref, handicap index and
     * gender snapshotted from the CURRENT profile (same rule as self-join —
     * the draft is the snapshot-at-time-of-play), tee resolved through the
     * category→tee map. ALL problems are collected before returning so the
     * admin fixes the whole roster in one pass.
     */
    private async buildProducers(
        roster: CompetitionParticipant[],
        config: CompetitionDefaultConfig,
        courseId: string,
    ): Promise<
        { ok: true; producers: DraftProducer[] } | { ok: false; diagnostics: CompilerDiagnostic[] }
    > {
        const diags: CompilerDiagnostic[] = [];
        const producers: DraftProducer[] = [];

        for (const [i, part] of roster.entries()) {
            const path = `producers[${i}]`;
            const name = part.displayNameSnapshot;

            let profile: { gender: 'M' | 'F' | null; handicapIndex: number | null } | null;
            if (part.playerId !== null) {
                profile = await this.players.getById(part.playerId);
                if (!profile) {
                    diags.push({
                        code: 'unknown_player',
                        message: `player '${part.playerId}' not found`,
                        path,
                    });
                    continue;
                }
            } else {
                profile = await this.guests.findById(part.guestPlayerId!);
                if (!profile) {
                    diags.push({
                        code: 'unknown_guest',
                        message: `guest '${part.guestPlayerId}' not found`,
                        path,
                    });
                    continue;
                }
            }
            if (profile.gender === null) {
                diags.push({
                    code: 'missing_gender',
                    message: `${name} has no gender on their profile — set it before creating the round (tee ratings are per gender)`,
                    path,
                });
            }
            if (profile.handicapIndex === null) {
                diags.push({
                    code: 'missing_handicap_index',
                    message: `${name} has no handicap index — set it before creating the round`,
                    path,
                });
            }

            const teeId = resolveTee(part.category, config);
            if (teeId === null) {
                diags.push({
                    code: 'tee_unresolved',
                    message:
                        part.category === null
                            ? `${name} has no category — set one, or add a fallback tee to the competition defaults`
                            : `${name}'s category '${part.category}' has no tee mapped — map it, or add a fallback tee to the competition defaults`,
                    path,
                });
            }
            if (profile.gender === null || profile.handicapIndex === null || teeId === null) {
                continue;
            }

            producers.push({
                producerDefId: `p${i + 1}`,
                playerRef:
                    part.playerId !== null
                        ? { kind: 'player', id: part.playerId }
                        : { kind: 'guest', id: part.guestPlayerId! },
                handicapIndex: profile.handicapIndex,
                gender: profile.gender,
                teeId,
                ...(part.category !== null ? { category: part.category } : {}),
            });
        }

        diags.push(...(await this.teeCourseDiagnostics(producers, courseId)));
        if (diags.length > 0) return { ok: false, diagnostics: diags };
        return { ok: true, producers };
    }

    /** Every resolved tee must exist and belong to the round's course. */
    private async teeCourseDiagnostics(
        producers: DraftProducer[],
        courseId: string,
    ): Promise<CompilerDiagnostic[]> {
        const teeIds = [...new Set(producers.filter(isIdentityProducer).map((p) => p.teeId))];
        if (teeIds.length === 0) return [];
        const rows = await Promise.all(teeIds.map((teeId) => this.tees.getById(teeId)));
        const byId = new Map(rows.filter((tee) => tee !== null).map((tee) => [tee.id, tee]));
        const diags: CompilerDiagnostic[] = [];
        for (const teeId of teeIds) {
            const tee = byId.get(teeId);
            if (!tee) {
                diags.push({
                    code: 'unknown_tee',
                    message: `tee '${teeId}' (from the competition's tee mapping) not found`,
                    path: 'defaultConfig.categoryTees',
                });
            } else if (tee.courseId !== courseId) {
                diags.push({
                    code: 'tee_wrong_course',
                    message: `tee '${teeId}' (from the competition's tee mapping) belongs to a different course than this round`,
                    path: 'defaultConfig.categoryTees',
                });
            }
        }
        return diags;
    }

    private async nextRoundNumber(competitionId: string): Promise<number> {
        const row = await this.maxRoundNumber(competitionId).executeTakeFirst();
        return (row?.max ?? 0) + 1;
    }

    /** Has a cut already been applied on this competition? (Any participant —
     *  including withdrawn ones — carrying `cut_after_round`.) */
    private async cutHasBeenApplied(competitionId: string): Promise<boolean> {
        const row = await this.cutParticipant(competitionId).executeTakeFirst();
        return row !== undefined;
    }
}

// --- Helpers -------------------------------------------------------------------

/** Category→tee resolution: mapped category, else fallback, else null. */
function resolveTee(
    category: string | null,
    config: CompetitionDefaultConfig,
): string | null {
    if (category !== null) {
        const mapped = config.categoryTees?.[category];
        if (mapped) return mapped.teeId;
    }
    return config.fallbackTee?.teeId ?? null;
}

/**
 * `startList: 'foursomes'` pre-partitions the roster (in roster order) into
 * groups of at most four; `single_group`/absent leaves the draft without
 * `playingGroups` — the compiler's conventional one-group-everyone default.
 */
function buildStartList(
    config: CompetitionDefaultConfig,
    producers: DraftProducer[],
): { playingGroups?: DraftPlayingGroup[] } {
    if (config.startList !== 'foursomes') return {};
    const groups: DraftPlayingGroup[] = [];
    for (let i = 0; i < producers.length; i += 4) {
        groups.push({ members: producers.slice(i, i + 4).map((p) => p.producerDefId) });
    }
    return { playingGroups: groups };
}
