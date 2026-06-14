import type { Kysely } from 'kysely';

import type { Database } from '../db/schema';
import type { Round, RoundService } from './round.service';
import type { LeaderboardService } from './leaderboard.service';
import type { PlayerService } from './player.service';

/**
 * Phase 2.6d — the player dashboard (§17 "Player dashboard (guest-aware)").
 *
 * A registered player's round history, joined via `ball_players.player_id`.
 * Works for solo AND team rounds (a shared team-ball surfaces for each
 * producer). Guests never appear in a registered player's dashboard. Soft-
 * deleted players are filtered out — querying a deleted player's dashboard
 * returns nothing (the §17 `NOT EXISTS … deleted_at IS NOT NULL` clause).
 *
 * Each round lists, per slot the player's ball(s) play in: the per-slot playing
 * handicap and the finishing POSITION (resolved from the same canonical
 * leaderboard the static render + mobile client consume — no parallel ranking).
 */

export interface DashboardSlotEntry {
    slotDefId: string;
    slotIndex: number | null;
    formatId: string;
    formatLabel: string;
    scoringMode: string;
    teamShape: string;
    /** The player's ball in this slot. */
    ballId: string;
    playingHandicap: number;
    teamLabel: string | null;
    /** Finishing position (1-based) in the slot's primary ranked metric; null
     *  for pair/state-only formats (match-play) that rank nothing scalar. */
    position: number | null;
    total: number | null;
    metricLabel: string | null;
}

export interface DashboardRoundEntry {
    round: Round;
    /** The player's ball ids in this round (1 own-ball + any team balls). */
    ballIds: string[];
    slots: DashboardSlotEntry[];
}

export class DashboardService {
    constructor(
        private db: Kysely<Database>,
        private roundService: RoundService,
        private leaderboardService: LeaderboardService,
        private playerService: PlayerService,
    ) {}

    async forPlayer(playerId: string): Promise<DashboardRoundEntry[]> {
        // §17: a soft/hard-deleted player has no dashboard.
        if (!(await this.playerService.isActive(playerId))) return [];

        // §17 dashboard query — rounds the player produced a ball in, newest
        // first. The NOT EXISTS soft-delete guard is already covered by the
        // isActive() short-circuit above; kept explicit in SQL for parity.
        const rows = await this.db
            .selectFrom('rounds as r')
            .innerJoin('balls as b', 'b.round_id', 'r.id')
            .innerJoin('ball_players as bp', 'bp.ball_id', 'b.id')
            .where('bp.player_id', '=', playerId)
            .where((eb) =>
                eb.not(
                    eb.exists(
                        eb
                            .selectFrom('players as x')
                            .select('x.id')
                            .whereRef('x.id', '=', 'bp.player_id')
                            .where('x.deleted_at', 'is not', null),
                    ),
                ),
            )
            .select(['r.id as round_id', 'b.id as ball_id'])
            .orderBy('r.date', 'desc')
            .execute();

        // Group the player's ball ids per round, preserving newest-first order.
        const ballsByRound = new Map<string, string[]>();
        const order: string[] = [];
        for (const row of rows) {
            if (!ballsByRound.has(row.round_id)) {
                ballsByRound.set(row.round_id, []);
                order.push(row.round_id);
            }
            const list = ballsByRound.get(row.round_id)!;
            if (!list.includes(row.ball_id)) list.push(row.ball_id);
        }

        const out: DashboardRoundEntry[] = [];
        for (const roundId of order) {
            const round = await this.roundService.getById(roundId);
            if (!round) continue;
            const ballIds = ballsByRound.get(roundId)!;
            const ballIdSet = new Set(ballIds);

            const balls = await this.roundService.ballsForRound(roundId);
            const result = await this.leaderboardService.resultForRound(roundId);

            const slots: DashboardSlotEntry[] = [];
            for (const ball of balls) {
                if (!ballIdSet.has(ball.id)) continue;
                for (const slot of ball.slots) {
                    const view = result.slots.find((s) => s.slotDefId === slot.slotDefId);
                    const ranked = view?.leaderboard.find((s) => s.kind === 'ranked');
                    const entry =
                        ranked && ranked.kind === 'ranked'
                            ? ranked.entries.find((e) => e.ballIds.includes(ball.id))
                            : undefined;
                    slots.push({
                        slotDefId: slot.slotDefId,
                        slotIndex: slot.slotIndex,
                        formatId: view?.formatId ?? '',
                        formatLabel: view?.formatLabel ?? '',
                        scoringMode: view?.scoringMode ?? '',
                        teamShape: view?.teamShape ?? '',
                        ballId: ball.id,
                        playingHandicap: slot.playingHandicap,
                        teamLabel: slot.teamLabel,
                        position: entry?.position ?? null,
                        total: entry?.total ?? null,
                        metricLabel:
                            ranked && ranked.kind === 'ranked' ? ranked.metricLabel : null,
                    });
                }
            }
            slots.sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
            out.push({ round, ballIds, slots });
        }
        return out;
    }
}
