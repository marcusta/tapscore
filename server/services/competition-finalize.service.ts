// Phase 4 Slice 4 — finalization (spec §5 "Competition Result", §10 view
// separation, §12 finalization event log).
//
// Finalize is a COMPUTATION, not a lifecycle bump: it snapshots the aggregate
// into the immutable `competition_results` table AND flips the lifecycle in
// one transaction — the only door through the schema's finalized-consistency
// check (`is_results_final = 1 ⇔ lifecycle = 'finalized' ⇔ results_finalized_at
// set`). The generic `CompetitionService.transition` refuses `finalize_reserved`
// precisely so this door is the only one.
//
// What gets snapshotted: one result SET per publication variant from the
// strategy's own `finalizationConfigs` (stroke folds publish gross AND net —
// spec §5 "separate rows for gross and net"; points folds publish one set),
// each set produced by the SAME pure `aggregate()` fold the live board uses.
// One row per roster participant per set (withdrawn and cut participants
// included — the snapshot is the whole field as the final board showed it),
// keyed `(competition_id, participant_id, scoring_type = view.metricId)`.
//
//   - `totals_json` — the participant's full serialized CompetitionRankedEntry
//     (per-round cells + arithmetic provenance), so the frozen board re-renders
//     exactly like the live one without recomputation.
//   - `points` — 0 until Phase 5 point templates map positions → points (the
//     column is NOT NULL by design; the ledger's tie behaviours land there).
//   - `tiebreak_json` — NULL: the Phase 4 fold shares positions on ties and
//     breaks none (Phase 5 TieBehaviour writes detail here). Strategy
//     provenance lives in the §12 audit event, per that column's purpose.
//
// There is NO update path for `competition_results` — not here, not anywhere.
// Rounds themselves stay token-scoped and NEVER lock (friendly-round
// semantics): a late score edit changes the LIVE view, never the snapshot —
// that permanence is the point of snapshotting (spec §10: Results are
// "immutable once finalized" while leaderboards stay live).
//
// After finalization the live leaderboard endpoint KEEPS computing (stable
// response shape) but carries `finalized: true` — clients should present
// `/competitions/:id/results` as the official numbers (documented on
// CompetitionLeaderboard.finalized).

import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../db/schema';
import type { CompetitionRankedEntry } from '../domain/aggregation/strategy';
import { recordCompetitionAuditEvent } from './competition-audit';
import type { CompetitionLeaderboardService } from './competition-leaderboard.service';
import type { CompetitionRoundService } from './competition-round.service';
import type {
    Competition,
    CompetitionRefusal,
    CompetitionResult,
    CompetitionService,
} from './competition.service';

// --- Output types ---

export interface FinalizeOutcome {
    competition: Competition;
    /** The result sets written, in write order (e.g. ['gross', 'net']). */
    scoringTypes: string[];
    /** Total `competition_results` rows written. */
    rowCount: number;
}

export interface FinalizeInput {
    competitionId: string;
    /** SERVER-resolved session identity (the admin finalizing) — §12 "who". */
    finalizedByPlayerId: string | null;
}

/** One frozen row, parsed for the read endpoint. */
export interface CompetitionResultEntry {
    participantId: string;
    position: number;
    /** 0 until Phase 5 point templates. */
    points: number;
    /** The frozen CompetitionRankedEntry (display name, per-round cells, total). */
    entry: CompetitionRankedEntry;
    /** NULL until Phase 5 tie behaviours write detail. */
    tiebreak: unknown | null;
}

export interface CompetitionResults {
    competitionId: string;
    finalizedAt: string;
    /** One set per published scoring type, entries in frozen position order. */
    resultSets: { scoringType: string; entries: CompetitionResultEntry[] }[];
}

function refuse(
    code: CompetitionRefusal['code'],
    message: string,
): { ok: false; refusal: CompetitionRefusal } {
    return { ok: false, refusal: { code, message } };
}

export class CompetitionFinalizeService {
    constructor(
        private db: Kysely<Database>,
        private competitions: CompetitionService,
        private leaderboards: CompetitionLeaderboardService,
        private competitionRounds: CompetitionRoundService,
    ) {}

    async finalize(input: FinalizeInput): Promise<CompetitionResult<FinalizeOutcome>> {
        // --- Fold inputs + aggregation validation (`invalid_aggregation` is the
        // --- documented blocker — fix the config, then finalize) --------------
        const prepared = await this.leaderboards.prepare(input.competitionId);
        if (!prepared.ok) return prepared;
        const { competition, aggregation, strategy, roster, roundResults } =
            prepared.value;

        // --- Lifecycle: exactly once, from active ------------------------------
        if (competition.lifecycle === 'finalized') {
            return refuse(
                'competition_finalized',
                'This competition is already finalized — its results are locked and cannot change.',
            );
        }
        if (competition.lifecycle !== 'active') {
            return refuse(
                'lifecycle_forbids_finalize',
                'Only an active competition can be finalized — start the competition and play its rounds first.',
            );
        }

        // --- Every round complete (spec: finalization validates completion) ----
        const rounds = await this.competitionRounds.listForCompetition(competition.id);
        if (rounds.length === 0) {
            return refuse(
                'rounds_incomplete',
                'This competition has no rounds — there is nothing to finalize.',
            );
        }
        const unfinished = rounds
            .filter((r) => r.completedAt === null)
            .map((r) => r.roundNumber);
        if (unfinished.length > 0) {
            return refuse(
                'rounds_incomplete',
                `Round${unfinished.length === 1 ? '' : 's'} ${unfinished.join(', ')} must be finished before the competition is finalized.`,
            );
        }

        // --- Fold once per publication variant (gross+net for stroke folds) ----
        // Deduped by folded metric id — the snapshot key — in case variants
        // collapse to the same metric.
        const views = new Map<string, ReturnType<typeof strategy.aggregate>>();
        for (const config of strategy.finalizationConfigs(aggregation.config)) {
            const view = strategy.aggregate({ roundResults, roster, config });
            if (!views.has(view.metricId)) views.set(view.metricId, view);
        }

        // --- Snapshot + lifecycle flip + §12 audit event, atomically ------------
        const now = new Date().toISOString();
        let rowCount = 0;
        await this.db.transaction().execute(async (trx) => {
            for (const view of views.values()) {
                for (const entry of view.entries) {
                    await trx
                        .insertInto('competition_results')
                        .values({
                            competition_id: competition.id,
                            participant_id: entry.participantId,
                            scoring_type: view.metricId,
                            position: entry.position,
                            points: 0,
                            totals_json: JSON.stringify(entry),
                            tiebreak_json: null,
                            finalized_by_player_id: input.finalizedByPlayerId,
                            finalized_at: now,
                        })
                        .execute();
                    rowCount++;
                }
            }

            // Guarded flip: re-read INSIDE the transaction (kysely's bun-sqlite
            // dialect does not report numUpdatedRows reliably — same reasoning
            // as guest-claim) and throw if a concurrent finalize/lifecycle race
            // got here first, so the whole snapshot rolls back.
            const current = await trx
                .selectFrom('competitions')
                .select('lifecycle')
                .where('id', '=', competition.id)
                .executeTakeFirst();
            if (current?.lifecycle !== 'active') {
                throw new Error(
                    `competition ${competition.id} left 'active' during finalize — rolled back`,
                );
            }
            await trx
                .updateTable('competitions')
                .set({
                    lifecycle: 'finalized',
                    is_results_final: 1,
                    results_finalized_at: now,
                })
                .where('id', '=', competition.id)
                .where('lifecycle', '=', 'active')
                .execute();

            await recordCompetitionAuditEvent(trx, {
                competitionId: competition.id,
                action: 'finalized',
                payload: {
                    rowCount,
                    scoringTypes: [...views.keys()],
                    aggregation: {
                        strategyId: aggregation.strategyId,
                        config: aggregation.config,
                        defaulted: prepared.value.defaulted,
                    },
                    roundCount: rounds.length,
                    participantCount: roster.length,
                },
                recordedByPlayerId: input.finalizedByPlayerId,
            });
        });

        const finalized = await this.competitions.get(competition.id);
        return {
            ok: true,
            value: {
                competition: finalized!,
                scoringTypes: [...views.keys()],
                rowCount,
            },
        };
    }

    /**
     * The frozen Results view (spec §10 — distinct from the live leaderboard).
     * Open read. Refuses `not_finalized` before finalization so nothing can
     * mistake a live board for official results.
     */
    async resultsForCompetition(
        competitionId: string,
    ): Promise<CompetitionResult<CompetitionResults>> {
        const competition = await this.competitions.get(competitionId);
        if (!competition) return refuse('participant_not_found', 'Competition not found.');
        if (!competition.isResultsFinal) {
            return refuse(
                'not_finalized',
                'This competition has not been finalized yet — its official results do not exist; see the live leaderboard.',
            );
        }

        const rows = await this.db
            .selectFrom('competition_results')
            .selectAll()
            .where('competition_id', '=', competitionId)
            .orderBy('scoring_type', 'asc')
            .orderBy('position', 'asc')
            .orderBy(sql`rowid`, 'asc')
            .execute();

        const sets = new Map<string, CompetitionResultEntry[]>();
        for (const row of rows) {
            const entries = sets.get(row.scoring_type) ?? [];
            entries.push({
                participantId: row.participant_id,
                position: row.position,
                points: row.points,
                entry: JSON.parse(row.totals_json) as CompetitionRankedEntry,
                tiebreak: row.tiebreak_json === null ? null : JSON.parse(row.tiebreak_json),
            });
            sets.set(row.scoring_type, entries);
        }

        return {
            ok: true,
            value: {
                competitionId,
                // Rows always carry the flip timestamp; the competition's column
                // is the same value (one transaction).
                finalizedAt: competition.resultsFinalizedAt!,
                resultSets: [...sets.entries()].map(([scoringType, entries]) => ({
                    scoringType,
                    entries,
                })),
            },
        };
    }
}
