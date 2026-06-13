// Phase 2.6b/3a — compiler persistence.
//
// Writes a `CompiledRound` to the tables created in migration 018, in a
// single transaction. Handles both the initial compile (v1) and recompiles
// (v2+). Recompile semantics (slice 3b.1):
//
//   1. Next `round_definitions.version` = `max(existing) + 1`. Previous
//      row's `superseded_by_version` is set to the new version.
//   2. Output tables (strategies, balls, slots, and their children) are
//      diff-upserted by deterministic id — unchanged rows no-op, changed
//      rows update, removed rows delete. Compound-keyed child tables
//      (ball_players, slot_balls, slot_ball_teams) are delete-then-insert
//      scoped to the parent ids that survive — none of them can be FK'd
//      from append-only events, so the churn is invisible.
//
// Why diff-upsert: once 3b.2 flips `score_event` to reference `ball_id`,
// `RESTRICT` on that FK will block naive delete-and-reinsert. Content-
// addressed ids (see deterministic-id.ts) keep unchanged subjects stable
// across recompiles, so existing events stay valid.
//
// Caller choice of `trx` keeps this usable both from a live service write
// path AND from a one-shot backfill migration that already holds an
// outer transaction.

import type { Kysely, Transaction } from 'kysely';

import type { Database, ScoringMode, TeamShape } from '../../db/schema';
import type { CompiledRound } from './types';

type Exec = Kysely<Database> | Transaction<Database>;

export interface PersistOptions {
    /** Present for setup_correction / allowance_override; null for `initial`. */
    sourceEventId?: string | null;
    /** `initial` (first compile) | `setup_correction` | `allowance_override`. */
    sourceKind?: 'initial' | 'setup_correction' | 'allowance_override';
    /** Admin player id for `round_definitions.compiled_by`. */
    compiledBy?: string | null;
}

export interface PersistResult {
    version: number;
    isRecompile: boolean;
}

/**
 * Persist a CompiledRound. Auto-detects initial vs recompile from the
 * presence of prior `round_definitions` rows. Mutates
 * `compiled.definitionVersion` to the version actually written so
 * callers can thread the value into any subsequent event emit.
 */
export async function persistCompiledRound(
    db: Exec,
    compiled: CompiledRound,
    opts: PersistOptions = {},
): Promise<PersistResult> {
    const run = async (trx: Exec): Promise<PersistResult> => {
        const priorMax = await maxVersion(trx, compiled.roundId);
        const isRecompile = priorMax !== null;
        const nextVersion = isRecompile ? priorMax + 1 : 1;

        const sourceKind = opts.sourceKind ?? (isRecompile ? 'setup_correction' : 'initial');
        const sourceEventId = sourceKind === 'initial' ? null : (opts.sourceEventId ?? null);

        if (!isRecompile && sourceKind !== 'initial') {
            throw new Error(
                `persistCompiledRound: first version must have source_kind='initial', got '${sourceKind}'`,
            );
        }
        if (isRecompile && sourceKind === 'initial') {
            throw new Error(
                `persistCompiledRound: round ${compiled.roundId} already has version ${priorMax}, cannot write another 'initial'`,
            );
        }
        if (sourceKind !== 'initial' && !sourceEventId) {
            throw new Error(
                `persistCompiledRound: source_kind='${sourceKind}' requires source_event_id`,
            );
        }

        compiled.definitionVersion = nextVersion;

        await trx
            .insertInto('round_definitions')
            .values({
                round_id: compiled.roundId,
                version: nextVersion,
                definition_json: compiled.definitionJson,
                compiled_by: opts.compiledBy ?? null,
                superseded_by_version: null,
                source_kind: sourceKind,
                source_event_id: sourceEventId,
            })
            .execute();

        if (isRecompile) {
            await trx
                .updateTable('round_definitions')
                .set({ superseded_by_version: nextVersion })
                .where('round_id', '=', compiled.roundId)
                .where('version', '=', priorMax)
                .execute();
        }

        await syncStrategies(trx, compiled);
        await syncBalls(trx, compiled);
        await syncSlots(trx, compiled);
        await syncBallPlayers(trx, compiled);
        await syncSlotBalls(trx, compiled);
        await syncSlotBallTeams(trx, compiled);

        return { version: nextVersion, isRecompile };
    };

    if (isTransaction(db)) {
        return run(db);
    }
    return (db as Kysely<Database>).transaction().execute(run);
}

async function maxVersion(trx: Exec, roundId: string): Promise<number | null> {
    const existing = await trx
        .selectFrom('round_definitions')
        .select('version')
        .where('round_id', '=', roundId)
        .orderBy('version', 'desc')
        .limit(1)
        .execute();
    return existing[0]?.version ?? null;
}

async function syncStrategies(trx: Exec, compiled: CompiledRound): Promise<void> {
    const keepIds = compiled.strategies.map((s) => s.id);
    // Delete strategies no longer in the compiled set first — cascades
    // through balls / ball_players / slot_balls / slot_ball_teams.
    let del = trx.deleteFrom('round_ball_strategies').where('round_id', '=', compiled.roundId);
    if (keepIds.length > 0) del = del.where('id', 'not in', keepIds);
    await del.execute();

    for (const s of compiled.strategies) {
        await trx
            .insertInto('round_ball_strategies')
            .values({
                id: s.id,
                round_id: compiled.roundId,
                strategy_id: s.strategyId,
                strategy_def_id: s.strategyDefId,
                derivation_config: s.derivationConfigJson,
                composition: s.compositionJson,
            })
            .onConflict((oc) =>
                oc.column('id').doUpdateSet({
                    strategy_id: s.strategyId,
                    strategy_def_id: s.strategyDefId,
                    derivation_config: s.derivationConfigJson,
                    composition: s.compositionJson,
                }),
            )
            .execute();
    }
}

async function syncBalls(trx: Exec, compiled: CompiledRound): Promise<void> {
    const keepIds = compiled.balls.map((b) => b.id);
    let del = trx.deleteFrom('balls').where('round_id', '=', compiled.roundId);
    if (keepIds.length > 0) del = del.where('id', 'not in', keepIds);
    await del.execute();

    for (const b of compiled.balls) {
        await trx
            .insertInto('balls')
            .values({
                id: b.id,
                round_id: compiled.roundId,
                round_ball_strategy_id: b.roundBallStrategyId,
                label: b.label,
                course_handicap_snapshot: b.courseHandicapSnapshot,
                per_producer_ch: b.perProducerChJson,
            })
            .onConflict((oc) =>
                oc.column('id').doUpdateSet({
                    round_ball_strategy_id: b.roundBallStrategyId,
                    label: b.label,
                    course_handicap_snapshot: b.courseHandicapSnapshot,
                    per_producer_ch: b.perProducerChJson,
                }),
            )
            .execute();
    }
}

async function syncSlots(trx: Exec, compiled: CompiledRound): Promise<void> {
    const keepIds = compiled.slots.map((s) => s.id);
    let del = trx.deleteFrom('slots').where('round_id', '=', compiled.roundId);
    if (keepIds.length > 0) del = del.where('id', 'not in', keepIds);
    await del.execute();

    for (const s of compiled.slots) {
        await trx
            .insertInto('slots')
            .values({
                id: s.id,
                round_id: compiled.roundId,
                slot_def_id: s.slotDefId,
                format_id: s.formatId,
                format_config: s.formatConfigJson,
                scoring_mode: s.scoringMode as ScoringMode,
                team_shape: s.teamShape as TeamShape,
                allowance_config: s.allowanceConfigJson,
                ball_mode: s.ballMode,
            })
            .onConflict((oc) =>
                oc.column('id').doUpdateSet({
                    slot_def_id: s.slotDefId,
                    format_id: s.formatId,
                    format_config: s.formatConfigJson,
                    scoring_mode: s.scoringMode as ScoringMode,
                    team_shape: s.teamShape as TeamShape,
                    allowance_config: s.allowanceConfigJson,
                    ball_mode: s.ballMode,
                }),
            )
            .execute();
    }
}

async function syncBallPlayers(trx: Exec, compiled: CompiledRound): Promise<void> {
    // Child of balls — no event-log FKs pointing here. Simplest correct
    // approach: for each surviving ball, drop its ball_players rows and
    // re-insert from the compiled set. (Rows for deleted balls are
    // already gone via cascade.)
    const ballIds = compiled.balls.map((b) => b.id);
    if (ballIds.length > 0) {
        await trx.deleteFrom('ball_players').where('ball_id', 'in', ballIds).execute();
    }
    if (compiled.ballPlayers.length === 0) return;
    await trx
        .insertInto('ball_players')
        .values(
            compiled.ballPlayers.map((bp) => ({
                ball_id: bp.ballId,
                producer_def_id: bp.producerDefId,
                player_id: bp.playerId,
                guest_player_id: bp.guestPlayerId,
                display_name_snapshot: bp.displayNameSnapshot,
                handicap_index_snapshot: bp.handicapIndexSnapshot,
                category_snapshot: bp.categorySnapshot,
                gender_snapshot: bp.genderSnapshot,
                tee_id: bp.teeId,
                tee_name_snapshot: bp.teeNameSnapshot,
                course_rating_snapshot: bp.courseRatingSnapshot,
                slope_snapshot: bp.slopeSnapshot,
                tee_par_snapshot: bp.teeParSnapshot,
                course_handicap_snapshot: bp.courseHandicapSnapshot,
            })),
        )
        .execute();
}

async function syncSlotBalls(trx: Exec, compiled: CompiledRound): Promise<void> {
    const slotIds = compiled.slots.map((s) => s.id);
    if (slotIds.length > 0) {
        await trx.deleteFrom('slot_balls').where('slot_id', 'in', slotIds).execute();
    }
    if (compiled.slotBalls.length === 0) return;
    await trx
        .insertInto('slot_balls')
        .values(
            compiled.slotBalls.map((sb) => ({
                slot_id: sb.slotId,
                ball_id: sb.ballId,
                playing_handicap_snapshot: sb.playingHandicapSnapshot,
            })),
        )
        .execute();
}

async function syncSlotBallTeams(trx: Exec, compiled: CompiledRound): Promise<void> {
    const slotIds = compiled.slots.map((s) => s.id);
    if (slotIds.length > 0) {
        await trx.deleteFrom('slot_ball_teams').where('slot_id', 'in', slotIds).execute();
    }
    if (compiled.slotBallTeams.length === 0) return;
    await trx
        .insertInto('slot_ball_teams')
        .values(
            compiled.slotBallTeams.map((t) => ({
                slot_id: t.slotId,
                team_label: t.teamLabel,
                ball_id: t.ballId,
            })),
        )
        .execute();
}

function isTransaction(db: Exec): db is Transaction<Database> {
    return 'isTransaction' in db && (db as { isTransaction?: boolean }).isTransaction === true;
}
