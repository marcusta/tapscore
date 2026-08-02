import { Computed, Signal, di } from '@basics/core/client/core';
import { api } from '../api';
// Straight from the framework, not re-exported through `../api`, exactly as
// `auth-errors.ts` and `base-path-auth.service.ts` take it: the class is only
// ever used for `instanceof`, and that comparison must not depend on which
// module object `../api` happens to be at the time.
import { ApiError } from '@basics/core/client/api-error';
import type { PlayerRoundHoleStats, PlayerRoundStats } from '../api/player-stats.gen';
import { StatsDashboardService } from './stats-dashboard.service';
import {
    buildRoundStatsModel,
    DEFAULT_ROUND_WINDOW,
    historySatisfied,
    type RoundStatsModel,
} from './round-stats-model';
import { statsShapeProblem } from './measures-shape';

/**
 * One round's stats screen (§4.2) and the round-end story's data (§4.1).
 *
 * DI singleton, but keyed on the round it currently holds: the screen and the
 * story card both ask for a round id and both get the same answer, so opening
 * the story on the leaderboard and then drilling into the screen is one fetch,
 * not two.
 *
 * Every read is session-scoped (`GET /players/me/rounds/:id/stats`), so nothing
 * here ever names a player id. Twin of
 * `ios/TapScore/Features/Stats/RoundStatsStore.swift`.
 */
export type RoundStatsPhase =
    | 'idle'
    | 'loading'
    | 'ready'
    /** No such round, or it holds nothing of the caller's — the same answer. */
    | 'notFound'
    /** Signed out, or the session expired mid-read. */
    | 'notAuthorized'
    | 'failed';

export class RoundStatsService {
    /** One page of history. Matches the dashboard's. */
    static readonly PAGE_SIZE = 50;

    /**
     * A much smaller budget than the dashboard's 40. This screen only needs
     * enough history to place ONE round against its ten predecessors, and it is
     * often reached from a leaderboard on a phone on a golf course. Eight pages
     * of 50 is four hundred rounds of walking, past which the baseline stops
     * being worth the bytes.
     */
    static readonly MAX_PAGES = 8;

    readonly phase = new Signal<RoundStatsPhase>('idle');
    readonly failure = new Signal<string | null>(null);

    /** The round currently held — the key the screen and the story share. */
    readonly roundId = new Signal<string | null>(null);
    readonly holes = new Signal<PlayerRoundHoleStats[]>([]);
    readonly round = new Signal<PlayerRoundStats | null>(null);
    /** Prior rounds, for the personal baseline. Newest first. */
    readonly history = new Signal<PlayerRoundStats[]>([]);

    private dashboard = di.get(StatsDashboardService);
    private inFlight: string | null = null;

    readonly model = new Computed<RoundStatsModel | null>(() => {
        const round = this.round.get();
        if (round === null) return null;
        return buildRoundStatsModel({
            round,
            holes: this.holes.get(),
            history: this.history.get(),
        });
    });

    /**
     * Load a round, or do nothing if it is already the one in hand.
     *
     * Idempotent per round id: the story card and the screen both call it, and
     * a remount must not refetch. `force` is for a hard reload only.
     */
    async load(roundId: string, force = false): Promise<void> {
        if (!force && (this.roundId.get() === roundId || this.inFlight === roundId)) return;
        this.inFlight = roundId;
        this.phase.set('loading');
        this.failure.set(null);
        // `roundId` is the KEY the idempotence guard above reads, and it is
        // dropped in the same breath as the data it names. Left pointing at the
        // previous round while `holes`/`round`/`history` are empty, it would
        // tell a concurrent `load(previousId)` that round is in hand — and that
        // caller would return to a screen with nothing on it. Null until a
        // round is actually held; set again at the bottom, with the rows.
        this.roundId.set(null);
        this.holes.set([]);
        this.round.set(null);
        this.history.set([]);

        let holes: PlayerRoundHoleStats[];
        try {
            holes = await api.playerStats.myRoundStats({ roundId });
        } catch (err) {
            if (this.inFlight !== roundId) return;
            this.inFlight = null;
            this.phase.set(phaseFor(err));
            this.failure.set(messageFor(err));
            return;
        }
        if (this.inFlight !== roundId) return;

        // The per-hole read answers WHAT was recorded; the summary row carries
        // the round's measures, which is what every aggregate on the screen is
        // built from. A round with holes but no summary row is not a round this
        // player has stats for.
        let history: PlayerRoundStats[];
        try {
            history = await this.walkHistory(roundId);
        } catch (err) {
            if (this.inFlight !== roundId) return;
            this.inFlight = null;
            this.phase.set(phaseFor(err));
            this.failure.set(messageFor(err));
            return;
        }
        if (this.inFlight !== roundId) return;
        this.inFlight = null;

        const round = history.find((r) => r.roundId === roundId) ?? null;
        if (round === null) {
            this.phase.set('notFound');
            return;
        }
        this.roundId.set(roundId);
        this.holes.set(holes);
        this.round.set(round);
        this.history.set(history.filter((r) => r.roundId !== roundId));
        this.phase.set('ready');
    }

    /**
     * Page `myStats` until the round is held AND has a full window of rounds
     * strictly OLDER than it behind it, or the budget runs out.
     *
     * Seeded from the dashboard's already-fetched rows, because the common path
     * into this screen is a tap on one of them: paging a career a second time to
     * learn what the previous screen already knows is a page of network for
     * nothing. Whatever the seed is short of, the walk fills in.
     */
    private async walkHistory(roundId: string): Promise<PlayerRoundStats[]> {
        const rows: PlayerRoundStats[] = [];
        const seen = new Set<string>();
        const append = (page: readonly PlayerRoundStats[]) => {
            for (const r of page) {
                if (seen.has(r.roundId)) continue;
                seen.add(r.roundId);
                rows.push(r);
            }
        };

        append(this.dashboard.loadedRounds.get());
        if (historySatisfied(rows, roundId, DEFAULT_ROUND_WINDOW)) return rows;

        let cursor: string | null = null;
        for (let page = 0; page < RoundStatsService.MAX_PAGES; page++) {
            const result = await api.playerStats.myStats({
                limit: RoundStatsService.PAGE_SIZE,
                cursor: cursor ?? undefined,
            });
            // Rows missing measure columns would surface as NaN on the
            // baseline. Throwing routes through the caller's phaseFor →
            // 'failed', with this message as the failure line. The dashboard
            // seed above needs no check: its service refused bad rows already.
            const shapeProblem = statsShapeProblem(result.rounds);
            if (shapeProblem !== null) throw new Error(shapeProblem);
            append(result.rounds);
            if (historySatisfied(rows, roundId, DEFAULT_ROUND_WINDOW)) return rows;
            // From the CURSOR, not from how many rows came back: a short page is
            // not the end of the feed.
            if (result.nextCursor === null) return rows;
            cursor = result.nextCursor;
        }
        return rows;
    }

    /** Forget everything (sign-out) — the next login starts clean. */
    clear(): void {
        this.roundId.set(null);
        this.holes.set([]);
        this.round.set(null);
        this.history.set([]);
        this.phase.set('idle');
        this.failure.set(null);
        this.inFlight = null;
    }
}

/**
 * HTTP status → phase.
 *
 * `request()` from the framework flattens everything non-2xx into
 * `{code:'server'}`, which cannot tell "not yours" from "not there" from "the
 * server fell over" — and those are three different screens here. So this reads
 * the status off `ApiError` directly, exactly as `RoundStatsStore.phase(for:)`
 * switches on the iOS error.
 *
 * 404 is deliberately the SAME answer as "you recorded nothing here": the
 * server does not distinguish a round that does not exist from one that holds
 * no stats of yours, and it should not — that difference is only interesting to
 * someone probing for round ids.
 */
function phaseFor(err: unknown): RoundStatsPhase {
    if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) return 'notAuthorized';
        if (err.status === 404) return 'notFound';
    }
    return 'failed';
}

function messageFor(err: unknown): string | null {
    if (err instanceof ApiError && (err.status === 404 || err.status === 401 || err.status === 403))
        return null;
    return err instanceof Error ? err.message : 'Something went wrong.';
}
