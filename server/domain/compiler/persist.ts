// Phase 2.6b/3a — compiler persistence.
//
// Writes a `CompiledRound` to the tables created in migration 018, in a
// single transaction. v1 semantics only (initial version); recompile /
// diff-and-upsert lands with setup-correction events in a later slice.
//
// Caller choice of `trx` keeps this usable both from a live service write
// path AND from a one-shot backfill migration that already holds an
// outer transaction.

import type { Kysely, Transaction } from 'kysely';

import type { Database } from '../../db/schema';
import type { CompiledRound } from './types';

type Exec = Kysely<Database> | Transaction<Database>;

export interface PersistOptions {
    /** Present for setup_correction / allowance_override; null for `initial`. */
    sourceEventId?: string | null;
    /** `initial` (compiler seed) | `setup_correction` | `allowance_override`. */
    sourceKind?: 'initial' | 'setup_correction' | 'allowance_override';
    /** Admin player id for `round_definitions.compiled_by`. */
    compiledBy?: string | null;
}

/**
 * Persist a v1 CompiledRound. Assumes the round has no existing
 * round_definitions row for the same version — upserting a later version
 * is a later slice's concern.
 */
export async function persistCompiledRound(
    db: Exec,
    compiled: CompiledRound,
    opts: PersistOptions = {},
): Promise<void> {
    const sourceKind = opts.sourceKind ?? 'initial';
    const sourceEventId = sourceKind === 'initial' ? null : (opts.sourceEventId ?? null);

    const run = async (trx: Exec) => {
        await trx
            .insertInto('round_definitions')
            .values({
                round_id: compiled.roundId,
                version: compiled.definitionVersion,
                definition_json: compiled.definitionJson,
                compiled_by: opts.compiledBy ?? null,
                superseded_by_version: null,
                source_kind: sourceKind,
                source_event_id: sourceEventId,
            })
            .execute();

        if (compiled.strategies.length > 0) {
            await trx
                .insertInto('round_ball_strategies')
                .values(
                    compiled.strategies.map((s) => ({
                        id: s.id,
                        round_id: compiled.roundId,
                        strategy_id: s.strategyId,
                        strategy_def_id: s.strategyDefId,
                        derivation_config: s.derivationConfigJson,
                        composition: s.compositionJson,
                    })),
                )
                .execute();
        }

        if (compiled.balls.length > 0) {
            await trx
                .insertInto('balls')
                .values(
                    compiled.balls.map((b) => ({
                        id: b.id,
                        round_id: compiled.roundId,
                        round_ball_strategy_id: b.roundBallStrategyId,
                        label: b.label,
                        course_handicap_snapshot: b.courseHandicapSnapshot,
                        per_producer_ch: b.perProducerChJson,
                    })),
                )
                .execute();
        }

        if (compiled.ballPlayers.length > 0) {
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

        if (compiled.slots.length > 0) {
            await trx
                .insertInto('slots')
                .values(
                    compiled.slots.map((s) => ({
                        id: s.id,
                        round_id: compiled.roundId,
                        slot_def_id: s.slotDefId,
                        scoring_mode: s.scoringMode as import('../../db/schema').ScoringMode,
                        team_shape: s.teamShape as import('../../db/schema').TeamShape,
                        allowance_config: s.allowanceConfigJson,
                        ball_mode: s.ballMode,
                    })),
                )
                .execute();
        }

        if (compiled.slotBalls.length > 0) {
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

        if (compiled.slotBallTeams.length > 0) {
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
    };

    if (isTransaction(db)) {
        await run(db);
    } else {
        await (db as Kysely<Database>).transaction().execute(run);
    }
}

function isTransaction(db: Exec): db is Transaction<Database> {
    return 'isTransaction' in db && (db as { isTransaction?: boolean }).isTransaction === true;
}
