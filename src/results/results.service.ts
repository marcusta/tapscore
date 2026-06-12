import { Computed, Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { Leaderboard } from '../api/leaderboards.gen';
import type { Round, RoundBall } from '../api/rounds.gen';

export class ResultsService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    readonly roundId = new Signal<string | null>(null);
    readonly round = new Signal<Round | null>(null);
    readonly leaderboard = new Signal<Leaderboard | null>(null);
    readonly balls = new Signal<RoundBall[]>([]);

    readonly labelByBall = new Computed(() => {
        const m = new Map<string, string>();
        for (const b of this.balls.get()) {
            m.set(b.id, b.label ?? b.players.map((p) => p.displayName).join(' / '));
        }
        return m;
    });

    readonly buckets = new Computed(() => this.leaderboard.get()?.byScoringType ?? []);

    async load(roundId: string): Promise<void> {
        this.roundId.set(roundId);
        const [round, balls] = await Promise.all([
            request(this.loading, this.error, () => api.rounds.get({ id: roundId })),
            request(this.loading, this.error, () => api.rounds.balls({ roundId })),
        ]);
        if (round) this.round.set(round);
        if (balls) this.balls.set(balls);
        const lb = await request(this.loading, this.error, () =>
            api.leaderboards.forRound({ roundId }));
        if (lb) this.leaderboard.set(lb);
    }
}
