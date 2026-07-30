import { Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { HandicapEntry, Player } from '../api/players.gen';
import type { Club } from '../api/clubs.gen';
import {
    STATS_ALL_OFF,
    statsFormFromConfig,
    type StatsConfigForm,
} from './stats-config-form';

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
     * The stats configuration (spec §3). Its own signals rather than the shared
     * `saving`/`saveError` pair, because those are bound into the gender, club
     * and handicap hint slots — a stats failure showing up under three
     * unrelated controls is worse than one more signal.
     *
     * DOWNSTREAM, and deliberately not handled here: capture prompts read their
     * modules LIVE from `GET /friendly-rounds/stats-configs` on the round token,
     * never from this screen. A change mid-round takes effect on the next
     * hole's step with no cache to invalidate — and equally, nothing here can
     * make an already-open step update on the spot.
     */
    readonly statsConfig = new Signal<StatsConfigForm>(STATS_ALL_OFF);
    readonly statsSaving = new Signal(false);
    readonly statsError = new Signal<RequestError | null>(null);

    /**
     * Load `me` + the append-only history. Load-once per session unless
     * forced — mutations refresh explicitly (`saveIndex` forces, `saveGender`
     * writes the response back), so remounts never need a refetch. Also caps
     * the blast radius of any pathological remount loop at one request.
     */
    async load(force = false): Promise<void> {
        if (!force && (this.player.get() !== null || this.loading.get())) return;
        const data = await request(this.loading, this.error, () =>
            Promise.all([
                api.players.me(),
                api.players.myHandicapHistory(),
                api.clubs.list(),
                // The stats config rides along, but NOT on the same
                // all-or-nothing terms as the other three: this service is a DI
                // singleton the create flow also depends on for "Add me", so a
                // stats read that fails must cost the section its rows, never
                // the whole profile. An absent config row is not an error —
                // the server answers the all-off default — so the null branch
                // here really only covers a 4xx/5xx.
                api.playerStats.myConfig().catch(() => null),
            ]),
        );
        if (!data) return;
        const [me, history, clubs, config] = data;
        this.player.set(me);
        this.history.set(history);
        this.clubs.set(clubs);
        this.statsConfig.set(config ? statsFormFromConfig(config) : STATS_ALL_OFF);
    }

    /** Forget the loaded profile (sign-out). */
    clear(): void {
        this.player.set(null);
        this.history.set([]);
        this.error.set(null);
        this.saveError.set(null);
        this.statsConfig.set(STATS_ALL_OFF);
        this.statsError.set(null);
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
     * Record that the player looked at their index and it is still theirs.
     * Deliberately NOT a `saveIndex` with the same number: nothing changed, so
     * `handicap_history` must not gain a row. Only the "asked recently" stamp
     * moves — which is what the round check-in reads to stay rare.
     */
    async confirmHandicap(): Promise<boolean> {
        const saved = await request(this.saving, this.saveError, () =>
            api.players.confirmHandicap(),
        );
        if (!saved) return false;
        this.player.set(saved);
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

    /**
     * Save a whole stats configuration — one PUT per toggle tap, because the
     * endpoint replaces the row wholesale and there is no per-module write.
     *
     * Callers pass a form built with `statsSetting` / `statsSettingEnabled`,
     * which have already applied the dependency cascade, so a combination the
     * server would 409 never leaves this device.
     *
     * On failure `statsConfig` is left untouched, so the switch the user just
     * moved snaps back to the row the server still holds. That IS the revert —
     * there is no dirty state and no Save button to undo.
     *
     * The guard covers ANY in-flight profile save, not just a stats one (iOS
     * `ProfileStore` has the single `saving` slot and does the same). The
     * separate `statsSaving`/`statsError` signals exist only to keep a stats
     * failure out of the three unrelated hint slots — they are not a second
     * concurrency domain: `saveIndex` finishes with `load(true)`, which re-reads
     * `myConfig` and writes `statsConfig`, so a toggle accepted while that read
     * is in flight would be clobbered back to the stale row on screen.
     */
    async saveStatsConfig(next: StatsConfigForm): Promise<boolean> {
        if (this.statsSaving.get() || this.saving.get()) return false;
        const saved = await request(this.statsSaving, this.statsError, () =>
            api.playerStats.putMyConfig(statsFormFromConfig(next)),
        );
        if (!saved) return false;
        this.statsConfig.set(statsFormFromConfig(saved));
        return true;
    }

    /** The loaded club's name for the current `homeClubId`, or null. */
    homeClubName(): string | null {
        const id = this.player.get()?.homeClubId;
        if (!id) return null;
        return this.clubs.get().find((c) => c.id === id)?.name ?? null;
    }
}
