import { Computed, Signal } from '@basics/core/client/core';
import { ApiError } from '@basics/core/client/api-error';
import { api } from '../api';
import type { PlayerRoundStats } from '../api/player-stats.gen';
import { loadWindowPreset, type StatsWindowPreset } from '../stats/stats-window';
import { statsShapeProblem } from '../stats/measures-shape';
import { buildHomeStatsCard, type HomeStatsCardModel } from './home-stats';

/**
 * ONE page of `GET /players/me/stats`, and nothing else — the landing's
 * statistics card (spec item W6).
 *
 * Shaped like `FriendsActivityService` — a small session-scoped store whose
 * failure mode is silence — rather than like `StatsDashboardService`, whose
 * cursor walking, page budget and window switching all exist to serve a screen
 * the player asked for. Reusing that machinery here would put a forty-request
 * worst case behind a card nobody opened.
 *
 * DI singleton; `clear()` is called by `signOutSequence`, because the previous
 * account's numbers must not survive on the landing of a device nobody is
 * signed into.
 *
 * Twin of `HomeStatsStore` in `ios/TapScore/Features/Stats/HomeStatsCard.swift`.
 */
export class HomeStatsService {
    /**
     * Twenty rows covers every count-based window the card can be asked for
     * (the widest is `last20`) in a single request.
     */
    static readonly PAGE_SIZE = 20;

    /** The page in hand, or null before one lands (and after a 401). */
    readonly rows = new Signal<PlayerRoundStats[] | null>(null);
    /** A `nextCursor` came back — the server holds older history. */
    readonly hasMore = new Signal(false);

    /**
     * The persisted window, as a signal so the card re-folds when it changes.
     *
     * `/stats` writes the preference on every window switch, so the landing has
     * to RE-READ it rather than cache it once: `refreshPreset()` is called from
     * the landing's render, which the router's `$swap` re-runs on every return
     * to '/'. A value read once at construction would show last week's window
     * forever.
     */
    readonly preset = new Signal<StatsWindowPreset>(loadWindowPreset());

    /**
     * Plain fields, not signals: nothing renders them, and the card's whole
     * error vocabulary is its own absence.
     */
    private loaded = false;
    private loading = false;

    /** The card, or null for every reason the card has. */
    readonly card = new Computed<HomeStatsCardModel | null>(() => {
        const rows = this.rows.get();
        if (rows === null) return null;
        return buildHomeStatsCard({
            rows,
            preset: this.preset.get(),
            hasMore: this.hasMore.get(),
            now: new Date(),
        });
    });

    /** Re-read the window the dashboard persisted. Cheap and idempotent. */
    refreshPreset(): void {
        this.preset.set(loadWindowPreset());
    }

    /**
     * Fetch the one page. Load-once per session unless forced — a remount must
     * not refetch, and the guard caps any pathological remount loop at one
     * request.
     *
     * Failure is quiet and has two shapes:
     *
     * - **401**: the session is dead. The rows go, and they stay gone — a dead
     *   bearer is not something a retry fixes.
     * - **anything else**: keep whatever is on screen. A failed REFRESH must
     *   not blank a card that was accurate thirty seconds ago; leaving `loaded`
     *   false lets the next natural trigger (a return to the landing) retry a
     *   first load that failed.
     */
    async load(force = false): Promise<void> {
        if (!force && (this.loaded || this.loading)) return;
        this.loading = true;
        try {
            const page = await api.playerStats.myStats({ limit: HomeStatsService.PAGE_SIZE });
            // Rows missing measure columns would render as NaN on the card.
            // This card's whole error vocabulary is its own absence, so a bad
            // shape is treated like any other non-401 failure: keep what is on
            // screen, leave `loaded` false for a natural retry.
            if (statsShapeProblem(page.rounds) !== null) return;
            this.rows.set(page.rounds);
            this.hasMore.set(page.nextCursor !== null);
            this.loaded = true;
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                this.rows.set(null);
                this.hasMore.set(false);
                // `loaded` stays true: a dead bearer is asked ONCE, not once
                // per return to the landing (matches the iOS twin, which
                // leaves `loadedKey` set in `catch APIError.unauthorized`).
                this.loaded = true;
            }
        } finally {
            this.loading = false;
        }
    }

    /** Forget everything (sign-out) — the next login starts clean. */
    clear(): void {
        this.rows.set(null);
        this.hasMore.set(false);
        this.loaded = false;
        this.loading = false;
    }
}
