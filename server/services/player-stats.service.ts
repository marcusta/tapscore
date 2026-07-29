import { sql, type Kysely, type Selectable } from 'kysely';
import { ConflictError } from '@basics/core/server/auth';
import type {
    Database,
    FirstPuttBucket,
    PlayerHoleStatsTable,
    PlayerStatsConfigTable,
    ShortGameDifficulty,
    StatEventsTable,
    StatKey,
    TeeResult,
} from '../db/schema';
import { toIsoUtc } from '../domain/time';

// --- Output types ---

/**
 * A player's stat-module selection (spec §3). Absent row = stats off; the
 * service materialises that absence as an all-false config rather than making
 * every caller handle `null`.
 */
export interface PlayerStatsConfig {
    playerId: string;
    /** Master switch. False preserves the module choices below. */
    enabled: boolean;
    tee: boolean;
    approach: boolean;
    putting: boolean;
    /** Requires `putting`. */
    shortGame: boolean;
    penalties: boolean;
    /** Requires `tee`. */
    recovery: boolean;
    /** Null until the player has ever saved a config. */
    updatedAt: string | null;
}

/** The whole config, replaced wholesale — there are no partial writes. */
export interface PlayerStatsConfigInput {
    enabled: boolean;
    tee: boolean;
    approach: boolean;
    putting: boolean;
    shortGame: boolean;
    penalties: boolean;
    recovery: boolean;
}

export interface StatEvent {
    id: string;
    roundId: string;
    playHoleId: string;
    playerId: string;
    seq: number;
    key: StatKey;
    /** Enum text / `'0'`..`'3'` / decimal digits / `'0'`|`'1'`. Null = cleared. */
    value: string | null;
    recordedByPlayerId: string | null;
    recordedAt: string;
    clientEventId: string;
}

/** One captured answer. `value: null` CLEARS that key for the subject. */
export interface StatEventInput {
    playHoleId: string;
    playerId: string;
    key: StatKey;
    value: string | null;
    clientEventId: string;
}

export interface AppendStatEventsInput {
    roundId: string;
    items: StatEventInput[];
    recordedByPlayerId?: string | null;
}

export interface AppendedStatEvent {
    event: StatEvent;
    /** False when `clientEventId` was already seen — a dedup hit, not a write. */
    inserted: boolean;
}

/** One entry per input item, in input order. */
export interface AppendStatEventsResult {
    events: AppendedStatEvent[];
}

/**
 * One sparse projection row. Every field is nullable and null means
 * "not recorded" — never "no".
 */
export interface PlayerHoleStats {
    roundId: string;
    playHoleId: string;
    playerId: string;
    teeResult: TeeResult | null;
    gir: boolean | null;
    firstPutt: FirstPuttBucket | null;
    /** 0..3, where 3 means "3 or more". */
    putts: number | null;
    shortGameDifficulty: ShortGameDifficulty | null;
    penalties: number | null;
    recoveryOk: boolean | null;
}

/** The six capture modules, without the master switch or the player id. */
export interface StatModules {
    tee: boolean;
    approach: boolean;
    putting: boolean;
    shortGame: boolean;
    penalties: boolean;
    recovery: boolean;
}

/**
 * What the capture client must prompt for, for ONE player in a round.
 *
 * The prompt set for a hole is the UNION over the ball's members (spec §2), so
 * the scorer — usually not the player — needs every promptable member's
 * modules, not just their own. Absence is the whole vocabulary of "no": a
 * player with stats off, with no config row, without per-player stroke
 * identity, or who is a guest / an unclaimed seat simply is not in the list.
 */
export interface RoundPlayerStatModules {
    playerId: string;
    modules: StatModules;
}

/** One (occurrence, player) pair the round holds statistics for. */
export interface StatSubject {
    playHoleId: string;
    playerId: string;
    /** The player's current display name — for a human-readable refusal. */
    displayName: string;
}

// --- Row mapping ---

type ConfigRow = Selectable<PlayerStatsConfigTable>;
type StatEventRow = Selectable<StatEventsTable>;
type HoleStatsRow = Selectable<PlayerHoleStatsTable>;

function toConfig(row: ConfigRow): PlayerStatsConfig {
    return {
        playerId: row.player_id,
        enabled: row.enabled === 1,
        tee: row.tee === 1,
        approach: row.approach === 1,
        putting: row.putting === 1,
        shortGame: row.short_game === 1,
        penalties: row.penalties === 1,
        recovery: row.recovery === 1,
        updatedAt: toIsoUtc(row.updated_at),
    };
}

/** No row = stats off, with no module choices remembered yet (spec §3). */
function absentConfig(playerId: string): PlayerStatsConfig {
    return {
        playerId,
        enabled: false,
        tee: false,
        approach: false,
        putting: false,
        shortGame: false,
        penalties: false,
        recovery: false,
        updatedAt: null,
    };
}

function toStatEvent(row: StatEventRow): StatEvent {
    return {
        id: row.id,
        roundId: row.round_id,
        playHoleId: row.play_hole_id,
        playerId: row.player_id,
        seq: row.seq,
        key: row.key,
        value: row.value,
        recordedByPlayerId: row.recorded_by_player_id,
        recordedAt: toIsoUtc(row.recorded_at),
        clientEventId: row.client_event_id,
    };
}

function toHoleStats(row: HoleStatsRow): PlayerHoleStats {
    return {
        roundId: row.round_id,
        playHoleId: row.play_hole_id,
        playerId: row.player_id,
        teeResult: row.tee_result,
        gir: row.gir === null ? null : row.gir === 1,
        firstPutt: row.first_putt,
        putts: row.putts,
        shortGameDifficulty: row.short_game_difficulty,
        penalties: row.penalties,
        recoveryOk: row.recovery_ok === null ? null : row.recovery_ok === 1,
    };
}

// --- Vocabulary (spec §1) ---
//
// Closed by construction: the DB pins the same sets in CHECK constraints
// (migration 042). These exist so a refusal reads as a structured diagnostic
// instead of a raw SQLite ABORT.

/** Which config module has to be on for a key to be accepted. */
const MODULE_FOR_KEY = {
    tee_result: 'tee',
    gir: 'approach',
    first_putt: 'putting',
    putts: 'putting',
    short_game_difficulty: 'shortGame',
    penalties: 'penalties',
    recovery_ok: 'recovery',
} as const satisfies Record<StatKey, keyof PlayerStatsConfigInput>;

const STAT_KEYS = Object.keys(MODULE_FOR_KEY) as StatKey[];

const BOOLEAN_VALUES = ['0', '1'];
const ENUM_VALUES: Partial<Record<StatKey, readonly string[]>> = {
    tee_result: ['fairway', 'in_play', 'trouble'],
    gir: BOOLEAN_VALUES,
    first_putt: ['inside_2m', '2_to_6m', 'over_6m'],
    putts: ['0', '1', '2', '3'],
    short_game_difficulty: ['standard', 'hard'],
    recovery_ok: BOOLEAN_VALUES,
};

/** Non-negative integer, as decimal text. */
const PENALTIES_PATTERN = /^\d+$/;

function refuse(code: string, message: string, extra: Record<string, unknown> = {}): never {
    const err = new ConflictError(message);
    (err as ConflictError & { detail?: unknown }).detail = { code, ...extra };
    throw err;
}

/**
 * Player statistics — configuration, capture, and the typed projection read
 * (docs/proposals/player-stats.md).
 *
 * Owns three tables that form one aggregate rooted on the player's stat
 * record: `player_stats_config` (the profile-level module selection),
 * `stat_events` (append-only capture) and `player_hole_stats` (the
 * trigger-maintained projection). Nothing outside this service reads or writes
 * them, and the projection has no independent writer — migration 042's trigger
 * is its only one.
 *
 * Trust model: capture rides the ROUND's write credential, exactly like
 * scores. Whoever can score can enter stats for the ball. What the service
 * enforces instead is that the SUBJECT is legitimate — a registered player,
 * present in this round, on a ball whose strokes have per-player identity,
 * with the relevant module switched on in their own profile.
 *
 * One deliberate consequence of that model: `promptableModules` lets a token
 * holder see WHICH modules their co-participants track. A scorer who cannot
 * see the other players' module selections cannot build the hole's prompt set
 * (spec §2 — the union over the ball's members) and would have to guess, so
 * this is the minimum disclosure that makes capture work at all. It stays
 * bounded to the round, exposes no stat VALUES that `statsForRound` does not
 * already give the same caller, and never reaches a player outside the round.
 *
 * Deliberately absent: `recordLatestEvent` / result-cursor bumps. A stat event
 * changes no leaderboard, so it must not invalidate any client's result poll
 * (spec §6, last bullet).
 */
export class PlayerStatsService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private configs() {
        return this.db.selectFrom('player_stats_config').selectAll();
    }

    private configByPlayer(playerId: string) {
        return this.configs().where('player_id', '=', playerId);
    }

    private configsByPlayers(playerIds: string[]) {
        return this.configs().where('player_id', 'in', playerIds);
    }

    private statEvents() {
        return this.db.selectFrom('stat_events').selectAll();
    }

    private statEventsByClientIds(roundId: string, clientEventIds: string[]) {
        return this.statEvents()
            .where('round_id', '=', roundId)
            .where('client_event_id', 'in', clientEventIds);
    }

    private statEventsByIds(ids: string[]) {
        return this.statEvents().where('id', 'in', ids);
    }

    /** Aggregate — does not compose from `statEvents()` (needs its own select). */
    private maxStatEventSeq(trx: Kysely<Database> = this.db) {
        return trx.selectFrom('stat_events').select(sql<number | null>`MAX(seq)`.as('m'));
    }

    private holeStats() {
        return this.db.selectFrom('player_hole_stats').selectAll();
    }

    /**
     * Joined to the itinerary so the read can order by PLAYED order. The
     * `play_hole_id` is a content hash, so ordering by it is arbitrary.
     */
    private holeStatsByRound(roundId: string) {
        return this.db
            .selectFrom('player_hole_stats as phs')
            .innerJoin('round_play_holes as rph', 'rph.id', 'phs.play_hole_id')
            .where('phs.round_id', '=', roundId)
            .selectAll('phs')
            .select('rph.ordinal as ordinal');
    }

    /**
     * Every (occurrence, player) the round has stats for, with the player's
     * name for a refusal message. `stat_events` is the authoritative set: a
     * cleared-only key leaves no projection row but still holds the RESTRICT
     * reference to the occurrence.
     */
    private statSubjectsByRound(roundId: string) {
        return this.db
            .selectFrom('stat_events as se')
            .innerJoin('players as p', 'p.id', 'se.player_id')
            .where('se.round_id', '=', roundId)
            .groupBy(['se.play_hole_id', 'se.player_id'])
            .select([
                'se.play_hole_id as play_hole_id',
                'se.player_id as player_id',
                'p.display_name as display_name',
            ]);
    }

    /**
     * Every (ball, registered member) pair in the round. The ball composition
     * IS the per-player-stroke-identity discriminator — see
     * `perPlayerIdentityPlayers`.
     */
    private roundBallMembers(roundId: string) {
        return this.db
            .selectFrom('ball_players')
            .innerJoin('balls', 'balls.id', 'ball_players.ball_id')
            .where('balls.round_id', '=', roundId)
            .select([
                'ball_players.ball_id as ball_id',
                'ball_players.player_id as player_id',
            ]);
    }

    private playHoleIdsInRound(roundId: string, playHoleIds: string[]) {
        return this.db
            .selectFrom('round_play_holes')
            .select('id')
            .where('round_id', '=', roundId)
            .where('id', 'in', playHoleIds);
    }

    // --- Queries (write) ---

    private upsertConfig(
        values: Omit<Selectable<PlayerStatsConfigTable>, 'updated_at'>,
        updatedAt: string,
        trx: Kysely<Database> = this.db,
    ) {
        const row = { ...values, updated_at: updatedAt };
        return trx
            .insertInto('player_stats_config')
            .values(row)
            .onConflict((oc) =>
                oc.column('player_id').doUpdateSet({
                    enabled: row.enabled,
                    tee: row.tee,
                    approach: row.approach,
                    putting: row.putting,
                    short_game: row.short_game,
                    penalties: row.penalties,
                    recovery: row.recovery,
                    updated_at: row.updated_at,
                }),
            );
    }

    private insertStatEvents(
        values: {
            id: string;
            round_id: string;
            play_hole_id: string;
            player_id: string;
            seq: number;
            key: StatKey;
            value: string | null;
            recorded_by_player_id: string | null;
            client_event_id: string;
        }[],
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('stat_events').values(values);
    }

    // --- Methods ---

    /**
     * The caller's own stat configuration. An absent row is not an error: it
     * is the default "stats off, nothing chosen yet" state.
     */
    async getConfig(playerId: string): Promise<PlayerStatsConfig> {
        const row = await this.configByPlayer(playerId).executeTakeFirst();
        return row ? toConfig(row) : absentConfig(playerId);
    }

    /**
     * Replace the caller's configuration wholesale.
     *
     * Dependencies (spec §1.3 / §1.5) are refused, never silently repaired:
     * `shortGame` without `putting` and `recovery` without `tee` are both
     * incoherent selections, and quietly flipping the missing module on would
     * enable prompts the player did not ask for. `enabled: false` is legal in
     * every combination — the master switch preserves module choices by design.
     */
    async putConfig(
        playerId: string,
        input: PlayerStatsConfigInput,
    ): Promise<PlayerStatsConfig> {
        if (input.shortGame && !input.putting) {
            refuse(
                'stats_module_dependency',
                'Short game needs putting: its outcome IS the following first-putt bucket, so it records nothing on its own.',
                { module: 'shortGame', requires: 'putting' },
            );
        }
        if (input.recovery && !input.tee) {
            refuse(
                'stats_module_dependency',
                'Recovery needs the tee module: the recovery question is only ever asked after a trouble tee shot.',
                { module: 'recovery', requires: 'tee' },
            );
        }

        const updatedAt = new Date().toISOString();
        await this.upsertConfig(
            {
                player_id: playerId,
                enabled: input.enabled ? 1 : 0,
                tee: input.tee ? 1 : 0,
                approach: input.approach ? 1 : 0,
                putting: input.putting ? 1 : 0,
                short_game: input.shortGame ? 1 : 0,
                penalties: input.penalties ? 1 : 0,
                recovery: input.recovery ? 1 : 0,
            },
            updatedAt,
        ).execute();

        return this.getConfig(playerId);
    }

    /**
     * Append a batch of captured answers to one round — a hole commit's worth.
     *
     * Idempotent on `(roundId, clientEventId)`: a replayed item returns the
     * ORIGINAL event with `inserted: false` and is not re-validated. That
     * ordering is deliberate — a retry must never start failing because the
     * player toggled a module off in the meantime.
     *
     * Everything else is validated before anything is written, and the whole
     * batch is refused if any item is bad. A partially-accepted hole commit
     * would leave the client unable to say what landed.
     *
     * The four refusals, all `ConflictError` with a `detail.code`:
     *   - `stat_play_hole_not_in_round` — occurrence from another round.
     *   - `stat_subject_not_in_round` — the player is not a registered member
     *     of any ball here. This is the guest / unclaimed-seat answer too:
     *     neither has a `players` row bound, so neither can ever match.
     *   - `stat_shared_stroke_ball` — the player is here, but only on a
     *     shared-stroke ball (see `perPlayerIdentityPlayers`).
     *   - `stat_module_disabled` / `stats_disabled` — the subject's own profile
     *     does not have that module (or stats at all) switched on. Config is
     *     read LIVE, so a mid-round change takes effect on the next hole.
     *   - `stat_invalid_value` — outside the closed vocabulary for that key.
     *   - `stat_duplicate_client_event_id` — the same id twice in one batch.
     */
    async appendEvents(input: AppendStatEventsInput): Promise<AppendStatEventsResult> {
        const { roundId, items } = input;
        if (items.length === 0) return { events: [] };

        // --- Idempotency preflight (mirrors ScoreEventService.append) --------
        const clientEventIds = [...new Set(items.map((i) => i.clientEventId))];
        const existingRows = await this.statEventsByClientIds(
            roundId,
            clientEventIds,
        ).execute();
        const existing = new Map<string, StatEvent>(
            existingRows.map((row) => [row.client_event_id, toStatEvent(row)]),
        );

        const fresh = items.filter((item) => !existing.has(item.clientEventId));
        if (fresh.length > 0) {
            await this.validate(roundId, fresh);
        }

        // --- Append ----------------------------------------------------------
        const ids = new Map<string, string>();
        for (const item of fresh) ids.set(item.clientEventId, crypto.randomUUID());

        if (fresh.length > 0) {
            await this.db.transaction().execute(async (trx) => {
                // seq = THE total order, computed inside the txn so concurrent
                // appends (serialized on the single Bun-SQLite connection)
                // never collide. Same discipline as score_events.seq.
                const maxRow = await this.maxStatEventSeq(trx).executeTakeFirst();
                let seq = (maxRow?.m ?? 0) + 1;
                const values = fresh.map((item) => ({
                    id: ids.get(item.clientEventId)!,
                    round_id: roundId,
                    play_hole_id: item.playHoleId,
                    player_id: item.playerId,
                    seq: seq++,
                    key: item.key,
                    value: item.value,
                    recorded_by_player_id: input.recordedByPlayerId ?? null,
                    client_event_id: item.clientEventId,
                }));
                await this.insertStatEvents(values, trx).execute();
                // NO recordLatestEvent / bumpResultCursor: stats change no
                // leaderboard, so they must not invalidate result polls.
            });
        }

        const insertedRows =
            ids.size > 0 ? await this.statEventsByIds([...ids.values()]).execute() : [];
        const inserted = new Map<string, StatEvent>(
            insertedRows.map((row) => [row.client_event_id, toStatEvent(row)]),
        );

        return {
            events: items.map((item) => {
                const replay = existing.get(item.clientEventId);
                if (replay) return { event: replay, inserted: false };
                const event = inserted.get(item.clientEventId);
                if (!event) {
                    throw new Error(
                        `player-stats append: event ${item.clientEventId} vanished after insert`,
                    );
                }
                return { event, inserted: true };
            }),
        };
    }

    /**
     * The flat projection for a round — what the score-entry step prefills
     * from and corrects against. A separate read from `ScorecardHole` on
     * purpose: this is keyed by PLAYER, the scorecard by ball + source.
     */
    async statsForRound(roundId: string): Promise<PlayerHoleStats[]> {
        // Played order, then a stable tiebreak within the hole. `play_hole_id`
        // is a content hash — ordering by it would be deterministic but
        // meaningless to read.
        const rows = await this.holeStatsByRound(roundId)
            .orderBy('ordinal')
            .orderBy('phs.player_id')
            .execute();
        return rows.map(toHoleStats);
    }

    /**
     * Who this round can be prompted for, and about what.
     *
     * The capture client cannot derive this: the prompt set for a hole is the
     * union over the ball's members (spec §2), and the scorer is usually not
     * the player, so a self-scoped config read leaves the client guessing and
     * its appends failing module validation blind.
     *
     * Every exclusion is an ABSENCE, never a flag to interpret: stats off, no
     * config row, a guest, an unclaimed seat, or a shared-stroke ball all mean
     * the player is not in the list. A client that prompts for exactly what it
     * finds here can never build a prompt `appendEvents` would refuse.
     *
     * PRIVACY, accepted deliberately: a token holder learns WHICH modules a
     * co-participant tracks. That is the minimum needed to prompt, it is
     * bounded to the players sharing this round, and the stat VALUES those
     * modules produce are already readable by the same token holders through
     * `statsForRound`. No config is exposed for anyone outside the round.
     */
    async promptableModules(roundId: string): Promise<RoundPlayerStatModules[]> {
        const members = await this.roundBallMembers(roundId).execute();
        const { perPlayer } = perPlayerIdentityPlayers(members);
        if (perPlayer.size === 0) return [];

        // A player on two balls is one entry: `perPlayer` is a Set, and the
        // config read is keyed by player.
        const rows = await this.configsByPlayers([...perPlayer]).execute();
        return rows
            .map(toConfig)
            .filter((config) => config.enabled)
            .map((config) => ({
                playerId: config.playerId,
                modules: {
                    tee: config.tee,
                    approach: config.approach,
                    putting: config.putting,
                    shortGame: config.shortGame,
                    penalties: config.penalties,
                    recovery: config.recovery,
                },
            }))
            .sort((a, b) => a.playerId.localeCompare(b.playerId));
    }

    /**
     * Which (occurrence, player) pairs this round has stats for — the input to
     * `RoundEditService`'s orphan guard. Both stat tables reference
     * `round_play_holes` with ON DELETE RESTRICT, so an edit that drops a
     * carrying occurrence must be refused BEFORE the recompile transaction
     * turns it into a raw FK error.
     */
    async recordedSubjects(roundId: string): Promise<StatSubject[]> {
        const rows = await this.statSubjectsByRound(roundId).execute();
        return rows.map((row) => ({
            playHoleId: row.play_hole_id,
            playerId: row.player_id,
            displayName: row.display_name,
        }));
    }

    // --- Validation (pure-ish helpers; no table access) ---

    private async validate(roundId: string, items: StatEventInput[]): Promise<void> {
        for (const item of items) this.validateVocabulary(item);

        // Two items in ONE batch sharing a client event id is a malformed
        // request, not a replay: the id is what dedup keys on, so the batch has
        // no answer for which of the two it means. Caught here rather than at
        // the UNIQUE index, which would surface as a raw 500.
        const batchIds = new Set<string>();
        for (const item of items) {
            if (batchIds.has(item.clientEventId)) {
                refuse(
                    'stat_duplicate_client_event_id',
                    `clientEventId '${item.clientEventId}' appears twice in one batch.`,
                    { clientEventId: item.clientEventId },
                );
            }
            batchIds.add(item.clientEventId);
        }

        const playHoleIds = [...new Set(items.map((i) => i.playHoleId))];
        const known = new Set(
            (await this.playHoleIdsInRound(roundId, playHoleIds).execute()).map((r) => r.id),
        );
        for (const id of playHoleIds) {
            if (!known.has(id)) {
                refuse(
                    'stat_play_hole_not_in_round',
                    `Hole occurrence ${id} does not belong to this round.`,
                    { playHoleId: id },
                );
            }
        }

        const members = await this.roundBallMembers(roundId).execute();
        const { present, perPlayer } = perPlayerIdentityPlayers(members);
        const playerIds = [...new Set(items.map((i) => i.playerId))];
        for (const playerId of playerIds) {
            if (!present.has(playerId)) {
                refuse(
                    'stat_subject_not_in_round',
                    'Stats can only be recorded for a registered player taking part in this round.',
                    { playerId },
                );
            }
            if (!perPlayer.has(playerId)) {
                refuse(
                    'stat_shared_stroke_ball',
                    'This player only plays a shared-stroke ball here, so no shot belongs to them individually — stats are not captured (spec §2).',
                    { playerId },
                );
            }
        }

        const configRows = await this.configsByPlayers(playerIds).execute();
        const configs = new Map(configRows.map((row) => [row.player_id, toConfig(row)]));
        for (const item of items) {
            const config = configs.get(item.playerId) ?? absentConfig(item.playerId);
            if (!config.enabled) {
                refuse('stats_disabled', 'This player has statistics turned off.', {
                    playerId: item.playerId,
                });
            }
            const module = MODULE_FOR_KEY[item.key];
            if (!config[module]) {
                refuse(
                    'stat_module_disabled',
                    `This player does not have the '${module}' stat module enabled.`,
                    { playerId: item.playerId, key: item.key, module },
                );
            }
        }
    }

    private validateVocabulary(item: StatEventInput): void {
        if (!STAT_KEYS.includes(item.key)) {
            refuse('stat_invalid_key', `Unknown stat key '${item.key}'.`, { key: item.key });
        }
        // Null is always legal — it CLEARS the key.
        if (item.value === null) return;
        if (item.key === 'penalties') {
            if (!PENALTIES_PATTERN.test(item.value)) {
                refuse(
                    'stat_invalid_value',
                    'Penalties must be a whole number of strokes, zero or more.',
                    { key: item.key, value: item.value },
                );
            }
            return;
        }
        const allowed = ENUM_VALUES[item.key];
        if (!allowed || !allowed.includes(item.value)) {
            refuse('stat_invalid_value', `'${item.value}' is not a legal ${item.key} value.`, {
                key: item.key,
                value: item.value,
                allowed,
            });
        }
    }
}

/**
 * Split the round's ball membership into "is here at all" and "has per-player
 * stroke identity" (spec §2).
 *
 * The discriminator is the BALL's composition, and it is exact rather than a
 * heuristic: every scoring format plans its balls through
 * `own_ball_per_player` — including the per-player team formats (better-ball,
 * Taliban, Umbrella), which group OWN balls at slot level via
 * `slot_ball_teams`. Multi-member balls only ever come from a round-level team
 * COMPOSITION (`team_ball`, `modified_alt_shot_pair`: scramble, greensomes,
 * foursomes), and those are precisely the shared-stroke balls where no shot
 * belongs to one player. So: a ball with exactly one registered member carries
 * per-player identity; a ball with more than one does not.
 *
 * A player may hold both (a scramble slot alongside an individual slot); one
 * qualifying ball is enough, because their own strokes then exist somewhere in
 * the round.
 *
 * Rows with a null `player_id` are guests or unclaimed seats. They are counted
 * toward a ball's size — a two-seat ball is shared-stroke whether or not the
 * seats are filled — but never yield a subject, which is exactly the
 * "no stats for guests" rule falling out as an absence.
 */
function perPlayerIdentityPlayers(
    members: { ball_id: string; player_id: string | null }[],
): { present: Set<string>; perPlayer: Set<string> } {
    const sizes = new Map<string, number>();
    for (const m of members) sizes.set(m.ball_id, (sizes.get(m.ball_id) ?? 0) + 1);

    const present = new Set<string>();
    const perPlayer = new Set<string>();
    for (const m of members) {
        if (m.player_id === null) continue;
        present.add(m.player_id);
        if (sizes.get(m.ball_id) === 1) perPlayer.add(m.player_id);
    }
    return { present, perPlayer };
}
