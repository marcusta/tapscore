import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type {
    FriendlyRound,
    Round,
    RoundBall,
    Scorecard,
} from '../api/friendly-rounds.gen';

/** Per-cell write state, keyed by `${ballId}|${playHoleId}`. */
export interface CellState {
    /** The optimistic strokes for this cell (overrides the loaded scorecard). */
    strokes: number | null;
    status: 'saving' | 'saved' | 'error';
    /** Stable across retries so a re-send dedupes server-side instead of duplicating. */
    clientEventId: string;
}

const cellKey = (ballId: string, playHoleId: string) => `${ballId}|${playHoleId}`;

/**
 * Loads a single FriendlyRound by its share token — the no-login entry point a
 * share link lands on — and owns trust-based score entry over that round. The
 * token is the only credential; every write goes through `friendlyRounds.score`
 * with no identity attached. Entry is optimistic + idempotent: each cell carries
 * a stable `clientEventId`, so a network retry dedupes rather than double-posts.
 */
export class RoundViewService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly friendlyRound = new Signal<FriendlyRound | null>(null);
    readonly round = new Signal<Round | null>(null);
    readonly balls = new Signal<RoundBall[]>([]);
    readonly scorecards = new Signal<Scorecard[]>([]);
    /** Optimistic per-cell overlay over the loaded scorecards. */
    readonly cells = new Signal<Map<string, CellState>>(new Map());

    private token: string | null = null;

    async loadByToken(token: string): Promise<void> {
        this.token = token;
        const data = await request(this.loading, this.error, () =>
            api.friendlyRounds.byToken({ token }),
        );
        if (!data) return;
        this.friendlyRound.set(data.friendlyRound);
        this.round.set(data.round);
        // Balls + current scores feed the score-entry grid. Failures here are
        // non-fatal — the round still renders; the grid just starts empty.
        const [balls, cards] = await Promise.all([
            api.friendlyRounds.balls({ token }).catch(() => [] as RoundBall[]),
            api.friendlyRounds.scorecard({ token }).catch(() => [] as Scorecard[]),
        ]);
        // Order matters: the row inputs are uncontrolled and seed their value
        // from `strokesFor` at render time, and rendering is driven by `balls`.
        // Set the scores (and clear the optimistic overlay) FIRST so the rows
        // that `balls` triggers read the freshly-loaded scorecard, not stale [].
        this.cells.set(new Map());
        this.scorecards.set(cards);
        this.balls.set(balls);
    }

    /** The strokes to display for a cell: the optimistic overlay wins, else the loaded card. */
    strokesFor(ballId: string, playHoleId: string): number | null {
        const cell = this.cells.get().get(cellKey(ballId, playHoleId));
        if (cell) return cell.strokes;
        const card = this.scorecards.get().find((c) => c.ballId === ballId);
        const hole = card?.holes.find((h) => h.playHoleId === playHoleId);
        return hole?.strokes ?? null;
    }

    statusFor(ballId: string, playHoleId: string): CellState['status'] | null {
        return this.cells.get().get(cellKey(ballId, playHoleId))?.status ?? null;
    }

    /**
     * Optimistically set a score and post it. A fresh edit mints a new
     * `clientEventId`; a retry of a failed cell reuses the existing one so the
     * server dedupes. `strokes === null` clears the score (a `score_cleared` event).
     */
    async setScore(ballId: string, playHoleId: string, strokes: number | null): Promise<void> {
        const key = cellKey(ballId, playHoleId);
        const clientEventId = crypto.randomUUID();
        this.patchCell(key, { strokes, status: 'saving', clientEventId });
        await this.post(ballId, playHoleId, strokes, clientEventId);
    }

    /** Re-send a cell that failed, reusing its `clientEventId` (idempotent). */
    async retry(ballId: string, playHoleId: string): Promise<void> {
        const key = cellKey(ballId, playHoleId);
        const cell = this.cells.get().get(key);
        if (!cell) return;
        this.patchCell(key, { ...cell, status: 'saving' });
        await this.post(ballId, playHoleId, cell.strokes, cell.clientEventId);
    }

    private async post(
        ballId: string,
        playHoleId: string,
        strokes: number | null,
        clientEventId: string,
    ): Promise<void> {
        if (!this.token) return;
        const key = cellKey(ballId, playHoleId);
        try {
            await api.friendlyRounds.score({
                token: this.token,
                ballId,
                playHoleId,
                strokes,
                eventType: strokes === null ? 'score_cleared' : 'score_entered',
                clientEventId,
            });
            const cell = this.cells.get().get(key);
            if (cell && cell.clientEventId === clientEventId) {
                this.patchCell(key, { ...cell, status: 'saved' });
            }
        } catch {
            const cell = this.cells.get().get(key);
            if (cell && cell.clientEventId === clientEventId) {
                this.patchCell(key, { ...cell, status: 'error' });
            }
        }
    }

    private patchCell(key: string, state: CellState): void {
        const next = new Map(this.cells.get());
        next.set(key, state);
        this.cells.set(next);
    }
}
