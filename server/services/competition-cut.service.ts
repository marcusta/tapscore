// Phase 4 Slice 4 — the cut (spec §5 "Cut", §12 cut event log).
//
// Between rounds, ONE cut per competition can trim the field. `applyCut` reads
// the STORED rule (`competitions.cut_rules_json` — afterRound / cutType /
// cutValue): the rule is competition configuration frozen at `active` like the
// rest of the setup, so the who/when audit shows an admin APPLYING the
// configured cut, never inventing parameters at apply time. The API therefore
// takes only the competition id.
//
// Decision semantics (this file is their single source of truth):
//
//   - The standings the rule evaluates are the SAME pure fold the live board
//     uses (`strategy.aggregate`), fed only the rounds with `roundNumber ≤
//     afterRound` AND `cut_eligible = 1` — no parallel cut arithmetic exists.
//   - `top_n` — the best `cutValue` ranked entries advance, and everyone TIED
//     AT the line advances with them (golf convention: ties at nth place all
//     make the cut). "Ranked" = non-withdrawn; the fold's own ranking key
//     (which demotes partial totals below complete ones) is the line's order.
//   - `top_percent` — `n = ceil(rankedField × cutValue / 100)`, then exactly
//     the `top_n` rule with that n (same tie-at-the-line behaviour).
//   - `within_strokes` — entries within `cutValue` of the LEADER advance
//     (direction-aware: ≤ leader+value for lowest-wins metrics, ≥ leader−value
//     for highest-wins). The spec left leader-vs-nth open; LEADER is the
//     documented choice (the PGA "10-shot rule" shape). Entries with a missing
//     round in the window (`incomplete`) or no total at all are cut — a
//     partial total is not comparable to the leader's and must not sneak
//     through by looking small.
//   - Withdrawn participants are not ranked and are always cut (they were
//     already excluded from future rounds; the stamp makes their post-cut
//     cells render `cut` rather than `missing`).
//
// The stamp (`cut_after_round = afterRound` on every non-advancing roster row)
// and the §12 audit event commit in ONE transaction. Slice 2's materialise
// already excludes stamped participants from later rounds and marks those
// rounds `post_cut` — no further wiring needed here.

import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import type { CompetitionRankedEntry } from '../domain/aggregation/strategy';
import {
    hasCompetitionAuditEvent,
    recordCompetitionAuditEvent,
} from './competition-audit';
import { cutRuleProblems, type CompetitionCutRule } from './competition-cut-rules';
import type {
    CompetitionLeaderboardService,
    PreparedAggregation,
} from './competition-leaderboard.service';
import type { CompetitionRoundService } from './competition-round.service';
import type { CompetitionRefusal, CompetitionResult } from './competition.service';

// --- Output types ---

/** One participant in the cut decision — serializable, audit-grade (snapshot
 *  display name, the position/total the decision saw). */
export interface CutDecisionEntry {
    participantId: string;
    displayName: string;
    position: number;
    total: number | null;
    /** Why a participant was cut. Absent on advancing entries. */
    reason?: 'rank' | 'withdrawn';
}

export interface CutOutcome {
    competitionId: string;
    /** The stored rule the decision applied. */
    rule: CompetitionCutRule;
    /** The ranked metric the cut standings folded ('gross' | 'net' | 'points' …). */
    metricId: string;
    advanced: CutDecisionEntry[];
    cut: CutDecisionEntry[];
}

export interface ApplyCutInput {
    competitionId: string;
    /** SERVER-resolved session identity (the admin applying) — §12 "who". */
    appliedByPlayerId: string | null;
}

function refuse(
    code: CompetitionRefusal['code'],
    message: string,
): { ok: false; refusal: CompetitionRefusal } {
    return { ok: false, refusal: { code, message } };
}

export class CompetitionCutService {
    constructor(
        private db: Kysely<Database>,
        private leaderboards: CompetitionLeaderboardService,
        private competitionRounds: CompetitionRoundService,
    ) {}

    async applyCut(input: ApplyCutInput): Promise<CompetitionResult<CutOutcome>> {
        // --- Fold inputs + aggregation validation (shared with the live board;
        // --- `invalid_aggregation` here is the documented blocker) -----------
        const prepared = await this.leaderboards.prepare(input.competitionId);
        if (!prepared.ok) return prepared;
        const { competition, aggregation, strategy, roster, roundResults } =
            prepared.value;

        // --- Lifecycle: cuts happen mid-play only ------------------------------
        if (competition.lifecycle === 'finalized') {
            return refuse(
                'competition_finalized',
                'This competition is finalized — its results are locked and cannot change.',
            );
        }
        if (competition.lifecycle !== 'active') {
            return refuse(
                'lifecycle_forbids_cut',
                'A cut is applied between rounds of an active competition — start the competition first.',
            );
        }

        // --- The stored rule (write-validated; re-checked defensively) --------
        if (competition.cutRules === null) {
            return refuse(
                'missing_cut_rules',
                'This competition has no cut rule configured — nothing to apply.',
            );
        }
        const problems = cutRuleProblems(competition.cutRules);
        if (problems.length > 0) {
            return refuse(
                'invalid_cut_rules',
                `The stored cut rule is not valid — ${problems.join('; ')}.`,
            );
        }
        const rule = competition.cutRules as CompetitionCutRule;

        // --- One cut per competition (spec §5 rule shape) ----------------------
        // Detected via the §12 event log, not the participant stamps — a cut
        // that trimmed nobody still happened and still blocks a second one.
        if (await hasCompetitionAuditEvent(this.db, competition.id, 'cut_applied')) {
            return refuse(
                'cut_already_applied',
                'The cut has already been applied to this competition.',
            );
        }

        // --- Rounds 1..afterRound must all exist and be complete ---------------
        const incomplete = await this.incompleteCutWindow(competition.id, rule.afterRound);
        if (incomplete) return incomplete;

        // --- The standings the rule evaluates: the SAME pure fold, windowed ----
        const window = roundResults.filter(
            (r) => r.cutEligible && r.roundNumber <= rule.afterRound,
        );
        const view = strategy.aggregate({
            roundResults: window,
            roster,
            config: aggregation.config,
        });

        // --- Decide -------------------------------------------------------------
        const ranked = view.entries.filter((e) => !e.withdrawn);
        const withdrawn = view.entries.filter((e) => e.withdrawn);
        const advancing = selectAdvancing(ranked, rule, view.direction);
        const advancingIds = new Set(advancing.map((e) => e.participantId));

        const advanced: CutDecisionEntry[] = advancing.map((e) => decisionEntry(e));
        const cut: CutDecisionEntry[] = [
            ...ranked
                .filter((e) => !advancingIds.has(e.participantId))
                .map((e) => decisionEntry(e, 'rank')),
            ...withdrawn.map((e) => decisionEntry(e, 'withdrawn')),
        ];

        // --- Stamp + §12 audit event, atomically --------------------------------
        const cutIds = cut.map((e) => e.participantId);
        await this.db.transaction().execute(async (trx) => {
            if (cutIds.length > 0) {
                await trx
                    .updateTable('competition_participants')
                    .set({ cut_after_round: rule.afterRound })
                    .where('competition_id', '=', competition.id)
                    .where('id', 'in', cutIds)
                    .where('cut_after_round', 'is', null)
                    .execute();
            }
            await recordCompetitionAuditEvent(trx, {
                competitionId: competition.id,
                action: 'cut_applied',
                payload: {
                    rule,
                    aggregation: {
                        strategyId: aggregation.strategyId,
                        config: aggregation.config,
                        defaulted: prepared.value.defaulted,
                    },
                    metricId: view.metricId,
                    advanced,
                    cut,
                },
                recordedByPlayerId: input.appliedByPlayerId,
            });
        });

        return {
            ok: true,
            value: {
                competitionId: competition.id,
                rule,
                metricId: view.metricId,
                advanced,
                cut,
            },
        };
    }

    /** Refusal when rounds 1..afterRound are not all materialised and complete;
     *  null when the window is ready. Round numbers are dense 1..N (materialise
     *  assigns max+1), so `max < afterRound` means missing rounds. */
    private async incompleteCutWindow(
        competitionId: string,
        afterRound: number,
    ): Promise<{ ok: false; refusal: CompetitionRefusal } | null> {
        const rounds = await this.competitionRounds.listForCompetition(competitionId);
        const maxNumber = rounds.reduce((max, r) => Math.max(max, r.roundNumber), 0);
        if (maxNumber < afterRound) {
            return refuse(
                'rounds_incomplete',
                `The cut comes after round ${afterRound}, but only ${maxNumber} round${maxNumber === 1 ? ' has' : 's have'} been created.`,
            );
        }
        const unfinished = rounds
            .filter((r) => r.roundNumber <= afterRound && r.completedAt === null)
            .map((r) => r.roundNumber);
        if (unfinished.length > 0) {
            return refuse(
                'rounds_incomplete',
                `Round${unfinished.length === 1 ? '' : 's'} ${unfinished.join(', ')} must be finished before the cut is applied.`,
            );
        }
        return null;
    }
}

// --- Rule evaluation (pure over the fold's entries) ----------------------------

function decisionEntry(
    entry: CompetitionRankedEntry,
    reason?: 'rank' | 'withdrawn',
): CutDecisionEntry {
    return {
        participantId: entry.participantId,
        displayName: entry.displayName,
        position: entry.position,
        total: entry.total,
        ...(reason !== undefined ? { reason } : {}),
    };
}

/** The advancing subset of the RANKED (non-withdrawn) entries, per the rule.
 *  Entries arrive in fold order (best first, ties sharing a position). */
function selectAdvancing(
    ranked: CompetitionRankedEntry[],
    rule: CompetitionCutRule,
    direction: 'high' | 'low',
): CompetitionRankedEntry[] {
    if (rule.cutType === 'within_strokes') {
        const leader = ranked.find((e) => e.total !== null && !e.incomplete);
        if (!leader) return []; // no comparable total anywhere — nobody advances
        const limit =
            direction === 'low'
                ? (t: number) => t <= leader.total! + rule.cutValue
                : (t: number) => t >= leader.total! - rule.cutValue;
        return ranked.filter((e) => e.total !== null && !e.incomplete && limit(e.total));
    }

    // top_n / top_percent: the best n advance, plus everyone tied AT the line.
    const n =
        rule.cutType === 'top_n'
            ? rule.cutValue
            : Math.ceil((ranked.length * rule.cutValue) / 100);
    if (n >= ranked.length) return [...ranked];
    const linePosition = ranked[n - 1]!.position;
    return ranked.filter((e) => e.position <= linePosition);
}
