import { Computed, Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { Round, RoundBall } from '../api/rounds.gen';
import type { Course } from '../api/courses.gen';

export class ScoreService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);

    readonly roundId = new Signal<string | null>(null);
    readonly round = new Signal<Round | null>(null);
    readonly course = new Signal<Course | null>(null);
    readonly balls = new Signal<RoundBall[]>([]);
    /** `${ballId} ${hole}` → strokes (null = cleared). */
    readonly strokes = new Signal<Map<string, number | null>>(new Map());

    readonly holes = new Computed(() => this.course.get()?.holes ?? []);

    async load(roundId: string): Promise<void> {
        if (this.roundId.get() === roundId && this.round.get()) return;
        this.roundId.set(roundId);
        const round = await request(this.loading, this.error, () =>
            api.rounds.get({ id: roundId }));
        if (!round) return;
        this.round.set(round);

        const [course, balls, cards] = await Promise.all([
            request(this.loading, this.error, () => api.courses.get({ id: round.courseId })),
            request(this.loading, this.error, () => api.rounds.balls({ roundId })),
            request(this.loading, this.error, () => api.scorecards.forRound({ roundId })),
        ]);
        if (course) this.course.set(course);
        if (balls) this.balls.set(balls);
        if (cards) {
            const m = new Map<string, number | null>();
            for (const card of cards) {
                for (const h of card.holes) {
                    m.set(`${card.ballId} ${h.holeNumber}`, h.strokes);
                }
            }
            this.strokes.set(m);
        }
    }

    strokesFor(ballId: string, hole: number): number | null {
        return this.strokes.get().get(`${ballId} ${hole}`) ?? null;
    }

    async setStrokes(ball: RoundBall, hole: number, strokes: number | null): Promise<void> {
        const roundId = this.roundId.get();
        if (!roundId) return;
        // Optimistic — the event log is idempotent and last-write-wins.
        this.strokes.update((m) => new Map(m).set(`${ball.id} ${hole}`, strokes));
        const single = ball.players.length === 1 ? ball.players[0]! : null;
        await request(this.loading, this.error, () => api.scoreEvents.append({
            roundId,
            ballId: ball.id,
            hole,
            strokes,
            eventType: strokes === null ? 'score_cleared' : 'score_entered',
            clientEventId: crypto.randomUUID(),
            sourcePlayerId: single?.playerId ?? null,
            sourceGuestPlayerId: single?.guestPlayerId ?? null,
        }));
    }
}
