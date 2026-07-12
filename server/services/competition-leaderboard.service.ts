// Phase 4 Slice 3 — the competition leaderboard: a LIVE aggregated view over
// the competition's rounds (spec §10 — distinct from the finalized Results
// snapshot Slice 4 writes into `competition_results`).
//
// PHASES.md Phase 4 design decision #2: this service does NO golf arithmetic.
// It loads the roster, the materialised rounds, each round's canonical
// `RoundResult` (through the existing per-round LeaderboardService — the same
// engine output the round page renders), and the ball→identity join from
// `ball_players`; then it hands everything to the registered
// AggregationStrategy's PURE `aggregate()` fold. Balls join the roster via
// identity refs (player XOR guest), never producer def-ids.

import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import { DEFAULT_AGGREGATION } from '../domain/aggregation/builtins';
import {
    findAggregationStrategy,
    hasAggregationStrategy,
    type AggregationParticipant,
    type AggregationRoundInput,
    type CompetitionResultView,
    type IdentityRef,
} from '../domain/aggregation/strategy';
import type { CompetitionRoundService } from './competition-round.service';
import type {
    CompetitionAggregation,
    CompetitionRefusal,
    CompetitionResult,
    CompetitionService,
} from './competition.service';
import type { LeaderboardService } from './leaderboard.service';

export interface CompetitionLeaderboard {
    competitionId: string;
    /** The aggregation that produced the view — stored, or the module default. */
    aggregation: CompetitionAggregation;
    /** True when `aggregation_json` was null and the documented default
     * (total gross strokes, lowest wins) applied. */
    defaulted: boolean;
    view: CompetitionResultView;
}

function refuse(
    code: CompetitionRefusal['code'],
    message: string,
): { ok: false; refusal: CompetitionRefusal } {
    return { ok: false, refusal: { code, message } };
}

export class CompetitionLeaderboardService {
    constructor(
        private db: Kysely<Database>,
        private competitions: CompetitionService,
        private competitionRounds: CompetitionRoundService,
        private leaderboards: LeaderboardService,
    ) {}

    /**
     * The live aggregated board. Open-read semantics match the rest of the
     * competition reads. Refusals (not exceptions) for domain outcomes:
     *   - unknown competition (same code the sibling paths use);
     *   - a STORED aggregation that no longer validates (rows can predate the
     *     Slice 3 write-path validation) — humanized, so the admin fixes the
     *     config instead of reading a 500.
     */
    async forCompetition(
        competitionId: string,
    ): Promise<CompetitionResult<CompetitionLeaderboard>> {
        const competition = await this.competitions.get(competitionId);
        if (!competition) return refuse('participant_not_found', 'Competition not found.');

        // --- Aggregation: stored, or the documented module default -----------
        const stored = competition.aggregation;
        const aggregation = stored ?? DEFAULT_AGGREGATION;
        if (!hasAggregationStrategy(aggregation.strategyId)) {
            return refuse(
                'invalid_aggregation',
                `This competition's aggregation strategy '${aggregation.strategyId}' is not registered — update the competition's aggregation settings.`,
            );
        }
        const strategy = findAggregationStrategy(aggregation.strategyId);
        const diagnostics = strategy.validateConfig(aggregation.config);
        if (diagnostics.length > 0) {
            const problems = diagnostics
                .map((d) => (d.path ? `${d.path}: ${d.message}` : d.message))
                .join('; ');
            return refuse(
                'invalid_aggregation',
                `This competition's aggregation configuration is not valid — ${problems}. Update the competition's aggregation settings.`,
            );
        }

        // --- Roster (ALL rows — withdrawn stay visible, marked) --------------
        const participants = await this.competitions.listParticipants(competitionId);
        const roster: AggregationParticipant[] = participants.map((p) => ({
            participantId: p.id,
            playerRef:
                p.playerId !== null
                    ? { kind: 'player', id: p.playerId }
                    : { kind: 'guest', id: p.guestPlayerId! },
            displayName: p.displayNameSnapshot,
            category: p.category,
            withdrawn: p.withdrawnAt !== null,
            cutAfterRound: p.cutAfterRound,
        }));

        // --- Rounds: canonical per-round results + ball→identity join --------
        const rounds = await this.competitionRounds.listForCompetition(competitionId);
        const roundResults: AggregationRoundInput[] = [];
        for (const round of rounds) {
            roundResults.push({
                roundNumber: round.roundNumber,
                cutEligible: round.cutEligible,
                postCut: round.postCut,
                result: await this.leaderboards.resultForRound(round.roundId),
                ballRefs: await this.ballRefs(round.roundId),
            });
        }

        // --- The pure fold ----------------------------------------------------
        const view = strategy.aggregate({
            roundResults,
            roster,
            config: aggregation.config,
        });
        return {
            ok: true,
            value: {
                competitionId,
                aggregation,
                defaulted: stored === null,
                view,
            },
        };
    }

    /** ballId → identity refs of the producers on that ball. The identity
     * columns on `ball_players` match `competition_participants` exactly —
     * this is the roster join (never producer def-ids). */
    private async ballRefs(roundId: string): Promise<Record<string, IdentityRef[]>> {
        const rows = await this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            .select(['bp.ball_id', 'bp.player_id', 'bp.guest_player_id'])
            .execute();
        const out: Record<string, IdentityRef[]> = {};
        for (const row of rows) {
            const ref: IdentityRef | null =
                row.player_id !== null
                    ? { kind: 'player', id: row.player_id }
                    : row.guest_player_id !== null
                      ? { kind: 'guest', id: row.guest_player_id }
                      : null;
            if (!ref) continue;
            (out[row.ball_id] ??= []).push(ref);
        }
        return out;
    }
}
