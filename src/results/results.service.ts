import { Computed, Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { RoundResult } from '../api/leaderboards.gen';
import type { Round, RoundBall } from '../api/rounds.gen';

export class ResultsService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    readonly roundId = new Signal<string | null>(null);
    readonly round = new Signal<Round | null>(null);
    // Slice 2c: the leaderboard API now returns the canonical `RoundResult`
    // (per-slot serializable result sections). The mobile results view is
    // rebuilt against these sections in 2.6e (M4 — section-driven results);
    // until then the service holds the payload and the component renders a
    // placeholder. The authoritative result surface is the static fixtures.
    readonly result = new Signal<RoundResult | null>(null);
    readonly balls = new Signal<RoundBall[]>([]);

    readonly labelByBall = new Computed(() => {
        const m = new Map<string, string>();
        for (const b of this.balls.get()) {
            m.set(b.id, b.label ?? b.players.map((p) => p.displayName).join(' / '));
        }
        return m;
    });

    async load(roundId: string): Promise<void> {
        this.roundId.set(roundId);
        const [round, balls] = await Promise.all([
            request(this.loading, this.error, () => api.rounds.get({ id: roundId })),
            request(this.loading, this.error, () => api.rounds.balls({ roundId })),
        ]);
        if (round) this.round.set(round);
        if (balls) this.balls.set(balls);
        const rr = await request(this.loading, this.error, () =>
            api.leaderboards.forRound({ roundId }));
        if (rr) this.result.set(rr);
    }
}
