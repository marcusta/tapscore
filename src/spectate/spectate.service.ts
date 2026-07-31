import { Computed, Signal } from '@basics/core/client/core';
import { api } from '../api';
import type { SpectateView } from '../api/spectate.gen';
import type { RoundBall } from '../api/rounds.gen';
import { ballDisplayName } from '../round/round.service';
import { failureMessage } from '../request-failure';
import {
    unavailability,
    type FriendProfileUnavailability,
} from '../friends/friend-profile-model';

/**
 * The read-only view of someone else's round — `GET /spectate/rounds/:id`,
 * session + visibility authorized (never the share token, which the payload
 * does not carry: it is the round's WRITE credential, and handing it to a
 * spectator would silently promote them to a participant).
 *
 * STRICTLY read, like the server service it talks to: there is no mutating
 * method here and no code path to one — the affordance is absent, not
 * disabled.
 *
 * v1 is fetch-only. The session-scoped SSE stream (`GET /api/spectate/events`)
 * exists server-side and is a deliberate follow-up: wiring live updates means
 * a reconnect policy, a per-emit re-auth story on the client, and teardown on
 * route leave — worth its own slice once the static view has been looked at.
 *
 * Ball names come from `GET /rounds/balls` — id-addressed and session-authed,
 * the same shape of read as the spectate view itself and equally token-free.
 * `SlotResultView.subjectLabels` only names VIRTUAL subjects (an aggregated
 * side), so the real roster still has to be read; it is best-effort, because
 * a board with raw ids beats no board at all.
 */
export class SpectateService {
    readonly roundId = new Signal<string | null>(null);
    readonly view = new Signal<SpectateView | null>(null);
    readonly balls = new Signal<RoundBall[]>([]);
    readonly loading = new Signal(false);
    readonly error = new Signal<string | null>(null);
    /** 403/404 as a calm full-page state — same rule as the friend profile. */
    readonly unavailable = new Signal<FriendProfileUnavailability | null>(null);
    private loaded = false;

    /** Point the service at a round; a different id drops everything. */
    setRound(roundId: string): void {
        if (this.roundId.get() === roundId) return;
        this.roundId.set(roundId);
        this.reset();
    }

    async load(force = false): Promise<void> {
        const roundId = this.roundId.get();
        if (!roundId) return;
        if (!force && (this.loaded || this.loading.get())) return;
        this.loading.set(true);
        this.error.set(null);
        try {
            const view = await api.spectate.round({ roundId });
            if (this.roundId.get() !== roundId) return;
            this.view.set(view);
            this.loaded = true;
            this.unavailable.set(null);
            await this.loadBalls(roundId);
        } catch (err) {
            if (this.roundId.get() !== roundId) return;
            const refusal = unavailability(err);
            if (refusal) {
                this.unavailable.set(refusal);
                this.view.set(null);
                this.balls.set([]);
                this.loaded = false;
            } else {
                this.error.set(failureMessage(err, "Couldn't load this round."));
            }
        } finally {
            if (this.roundId.get() === roundId) this.loading.set(false);
        }
    }

    /** Best-effort roster read; a failure leaves the board naming ids via
     *  `subjectLabels` where it can, which is still a board. */
    private async loadBalls(roundId: string): Promise<void> {
        try {
            const fetched = await api.rounds.balls({ roundId });
            if (this.roundId.get() === roundId) this.balls.set(fetched);
        } catch {
            /* decoration only */
        }
    }

    /** Ball id → display name (joined producer names, else the ball's label),
     *  with each slot's `subjectLabels` folded in for virtual subjects — the
     *  same resolution rules as `RoundViewService.ballNameById`. */
    private readonly ballNameById = new Computed<Map<string, string>>(() => {
        const m = new Map<string, string>();
        for (const b of this.balls.get()) m.set(b.id, ballDisplayName(b));
        for (const slot of this.view.get()?.result.slots ?? []) {
            for (const s of slot.subjectLabels ?? []) m.set(s.ballId, s.label);
        }
        return m;
    });

    nameOf(ballId: string): string {
        return this.ballNameById.get().get(ballId) ?? ballId;
    }

    /** Ball id → "Group N", built off the round payload's `playingGroups` the
     *  same way `RoundViewService` does; null on a single-group round. */
    private readonly groupLabelByBallId = new Computed<Map<string, string>>(() => {
        const m = new Map<string, string>();
        const groups = this.view.get()?.round.playingGroups ?? [];
        if (groups.length < 2) return m;
        groups.forEach((g, i) => {
            for (const ballId of g.ballIds) m.set(ballId, `Group ${i + 1}`);
        });
        return m;
    });

    groupLabelOf(ballId: string): string | null {
        return this.groupLabelByBallId.get().get(ballId) ?? null;
    }

    /** Forget everything (sign-out) — spectate state is another player's data
     *  and must not survive into the next session. */
    clear(): void {
        this.roundId.set(null);
        this.reset();
    }

    private reset(): void {
        this.view.set(null);
        this.balls.set([]);
        this.loaded = false;
        this.loading.set(false);
        this.error.set(null);
        this.unavailable.set(null);
    }
}
