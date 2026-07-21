import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { HandicapEntry, Player } from '../api/players.gen';
import type { Club } from '../api/clubs.gen';

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
    /** Home-club picker options; loaded lazily alongside the profile. */
    readonly clubs = new Signal<Club[]>([]);

    readonly saving = new Signal(false);
    readonly saveError = new Signal<RequestError | null>(null);

    /**
     * Load `me` + the append-only history. Load-once per session unless
     * forced — mutations refresh explicitly (`saveIndex` forces, `saveGender`
     * writes the response back), so remounts never need a refetch. Also caps
     * the blast radius of any pathological remount loop at one request.
     */
    async load(force = false): Promise<void> {
        if (!force && (this.player.get() !== null || this.loading.get())) return;
        const data = await request(this.loading, this.error, () =>
            Promise.all([api.players.me(), api.players.myHandicapHistory(), api.clubs.list()]),
        );
        if (!data) return;
        const [me, history, clubs] = data;
        this.player.set(me);
        this.history.set(history);
        this.clubs.set(clubs);
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
        await this.load(true);
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

    /**
     * Save the home club (club id, or null to clear). The club NAME rides
     * along on friend/search rows so people can tell two same-named players
     * apart — that's the reason this field is self-service at all.
     */
    async saveHomeClub(homeClubId: string | null): Promise<boolean> {
        const saved = await request(this.saving, this.saveError, () =>
            api.players.updateProfile({ homeClubId }),
        );
        if (!saved) return false;
        this.player.set(saved);
        return true;
    }

    /** The loaded club's name for the current `homeClubId`, or null. */
    homeClubName(): string | null {
        const id = this.player.get()?.homeClubId;
        if (!id) return null;
        return this.clubs.get().find((c) => c.id === id)?.name ?? null;
    }
}
