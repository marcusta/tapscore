import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { HandicapEntry, Player } from '../api/players.gen';

/**
 * The logged-in player's own profile: identity + manual handicap maintenance
 * (Phase 3 — no WHS posting; the index is edited in-app and every change is
 * appended to `handicap_history` server-side).
 *
 * DI singleton shared by the profile page AND the create flow's "Add me"
 * button (which pre-fills the roster row from `player`). All endpoints are
 * session-scoped (`players/me…`) — nothing here ever names a player id.
 */
export class ProfileService {
    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    readonly player = new Signal<Player | null>(null);
    readonly history = new Signal<HandicapEntry[]>([]);

    readonly saving = new Signal(false);
    readonly saveError = new Signal<RequestError | null>(null);

    /** Load `me` + the append-only history. Safe to call repeatedly. */
    async load(): Promise<void> {
        const data = await request(this.loading, this.error, () =>
            Promise.all([api.players.me(), api.players.myHandicapHistory()]),
        );
        if (!data) return;
        const [me, history] = data;
        this.player.set(me);
        this.history.set(history);
    }

    /** Forget the loaded profile (sign-out). */
    clear(): void {
        this.player.set(null);
        this.history.set([]);
        this.error.set(null);
        this.saveError.set(null);
    }

    /**
     * Save a manually edited handicap index. On success the server has already
     * appended the history row, so re-pull `me` + history rather than guessing
     * at the shape locally. Returns true on success.
     */
    async saveIndex(handicapIndex: number): Promise<boolean> {
        const saved = await request(this.saving, this.saveError, () =>
            api.players.updateHandicap({ handicapIndex }),
        );
        if (!saved) return false;
        await this.load();
        return true;
    }

    /**
     * Save gender (M / F / null-to-clear) via the profile endpoint. The
     * create flow's "Add me"/friends rows read `player.gender` to prefill +
     * lock their gender control, so refresh `player` from the response
     * rather than guessing locally.
     */
    async saveGender(gender: 'M' | 'F' | null): Promise<boolean> {
        const saved = await request(this.saving, this.saveError, () =>
            api.players.updateProfile({ gender }),
        );
        if (!saved) return false;
        this.player.set(saved);
        return true;
    }
}
