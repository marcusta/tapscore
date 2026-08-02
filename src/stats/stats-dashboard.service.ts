import { Computed, di, Signal } from '@basics/core/client/core';
import { request, type RequestError } from '@basics/core/client/request';
import { api } from '../api';
import type { PlayerRoundStats } from '../api/player-stats.gen';
import { ProfileService } from '../profile/profile.service';
import { SG_BASELINES_V1, type SgCohort } from '../round/stat-measures';
import {
    FALLBACK_SG_CHOICE,
    loadSgChoice,
    resolveCohort,
    saveSgChoice,
    sgBaselineInfo,
    type SgBaselineChoice,
} from './sg-baseline';
import {
    applyWindow,
    courseOptions,
    EMPTY_FILTER,
    FALLBACK_PRESET,
    loadWindowPreset,
    needsMoreHistory,
    saveWindowPreset,
    type StatsRoundFilter,
    type StatsWindowPreset,
} from './stats-window';
import { buildDashboardModel, EMPTY_DASHBOARD_MODEL } from './stats-dashboard-model';
import { statsShapeProblem } from './measures-shape';

/**
 * The `/stats` screen's state. DI singleton; every read is session-scoped
 * (`GET /players/me/stats`), so nothing here ever names a player id.
 *
 * The paging is TRANSPARENT: the screen shows a window, and the service keeps
 * asking for older pages until the window can be drawn honestly (`needsMoreHistory`)
 * or the budget runs out. There is no "load more" button, because the user did
 * not ask for pages — they asked for "last 20 rounds".
 *
 * Twin of `ios/TapScore/Features/Stats/StatsDashboardStore.swift`.
 */
export class StatsDashboardService {
    /** One page. Big enough that the common windows land in the first fetch. */
    static readonly PAGE_SIZE = 50;

    /**
     * A STORE-LIFETIME budget, not a per-window one: 40 pages of 50 is 2000
     * rounds, past which something is wrong and a browser tab should stop
     * asking. Refilled only by `load()`, so flipping between windows cannot
     * mint a fresh budget each time and page a career twice.
     */
    static readonly MAX_PAGES = 40;

    readonly loading = new Signal(false);
    readonly error = new Signal<RequestError | null>(null);
    /** True once the first page has resolved — gates the "no stats yet" empty state. */
    readonly loaded = new Signal(false);

    /** Every row fetched so far, newest first. A superset of the window. */
    readonly loadedRounds = new Signal<PlayerRoundStats[]>([]);
    /**
     * The server's own count of rounds with stats, from the FIRST page only
     * (cursor pages answer null). The "10 of 87 rounds" marker's denominator.
     */
    readonly roundsWithStats = new Signal<number | null>(null);
    /** A `nextCursor` came back on the last page. */
    readonly hasMore = new Signal(false);

    readonly preset = new Signal<StatsWindowPreset>(loadWindowPreset());
    readonly filter = new Signal<StatsRoundFilter>(EMPTY_FILTER);

    /**
     * Which handicap cohort the strokes-lost rows are priced against — the
     * player's saved choice, `auto` until they say otherwise.
     *
     * This lives HERE, on the dashboard service, rather than in a store of its
     * own, because it is the one place both stats surfaces already meet:
     * `RoundStatsService` injects this service for its history seed, so the
     * round screen reads the same `sgBundle` the dashboard does and the two can
     * never be measured against different populations. There is deliberately no
     * per-screen override.
     */
    readonly sgChoice = new Signal<SgBaselineChoice>(loadSgChoice());

    private profile = di.get(ProfileService);

    /**
     * The signed-in player's handicap, or null while the profile has not
     * loaded. Null resolves to the tier the app shipped with, so a screen drawn
     * before the profile arrives shows today's baseline and then settles.
     */
    readonly handicapIndex = new Computed<number | null>(
        () => this.profile.player.get()?.handicapIndex ?? null,
    );

    /** The tier in force: the choice, or the handicap's tier under `auto`. */
    readonly sgCohort = new Computed<SgCohort>(() =>
        resolveCohort(this.sgChoice.get(), this.handicapIndex.get()),
    );

    /** That tier's whole bundle — what every model on either screen is given. */
    readonly sgBundle = new Computed(() => SG_BASELINES_V1[this.sgCohort.get()]);

    /** The same resolution, in the form the "How this works" sheet speaks it. */
    readonly sgInfo = new Computed(() =>
        sgBaselineInfo(this.sgChoice.get(), this.handicapIndex.get()),
    );

    /**
     * A background page fetch. Deliberately NOT `loading`: the screen already
     * has rows to draw, and swapping the whole dashboard for a spinner because
     * an older page is on the way is worse than a quiet line at the top.
     */
    readonly extending = new Signal(false);
    /** A failed EXTEND, kept out of `error` for the same reason. */
    readonly extendError = new Signal<RequestError | null>(null);

    private pagesFetched = 0;
    private cursor: string | null = null;

    /** The rows the current window covers, newest first. */
    readonly windowRounds = new Computed(() =>
        applyWindow(this.preset.get(), this.filter.get(), this.loadedRounds.get(), new Date()),
    );

    readonly model = new Computed(() =>
        buildDashboardModel(this.windowRounds.get(), this.sgBundle.get()),
    );

    /** Courses the FETCHED rows mention — the filter panel's list. */
    readonly courses = new Computed(() => courseOptions(this.loadedRounds.get()));

    /**
     * Rows in hand but none in the window: a filter the player can loosen,
     * which is a different sentence from "you have no stats".
     */
    readonly overFiltered = new Computed(
        () => this.loadedRounds.get().length > 0 && this.windowRounds.get().length === 0,
    );

    /**
     * Load the first page. Load-once per session unless forced — the dashboard
     * is a read-only surface, so a remount never needs a refetch, and the guard
     * caps the blast radius of any pathological remount loop at one request.
     */
    async load(force = false): Promise<void> {
        if (!force && (this.loaded.get() || this.loading.get())) return;
        this.pagesFetched = 0;
        this.cursor = null;
        this.extendError.set(null);
        const page = await request(this.loading, this.error, () =>
            api.playerStats.myStats({ limit: StatsDashboardService.PAGE_SIZE }),
        );
        if (!page) return;
        // A payload missing measure columns would not fail here — it would
        // fail later, as NaN% on the cards. Refuse it up front, the way the
        // iOS decode guards do; `loaded` stays false so a fixed server gets a
        // clean retry on the next visit.
        const shapeProblem = statsShapeProblem(page.rounds);
        if (shapeProblem !== null) {
            this.error.set({ code: 'server', message: shapeProblem });
            return;
        }
        this.pagesFetched = 1;
        this.roundsWithStats.set(page.roundsWithStats);
        this.loadedRounds.set(page.rounds);
        this.cursor = page.nextCursor;
        this.hasMore.set(page.nextCursor !== null);
        this.loaded.set(true);
        await this.extendIfNeeded();
    }

    /** Switch window; persists the choice and pages if the new window needs it. */
    select(preset: StatsWindowPreset): void {
        this.preset.set(preset);
        saveWindowPreset(preset);
        void this.extendIfNeeded();
    }

    /**
     * Switch the baseline cohort; persists the choice.
     *
     * No paging and no refetch: the tier changes what the rows already in hand
     * are PRICED against, not which rows the window holds.
     */
    selectSgBaseline(choice: SgBaselineChoice): void {
        this.sgChoice.set(choice);
        saveSgChoice(choice);
    }

    /**
     * Make sure a handicap is on hand for the `auto` tier.
     *
     * Load-once inside `ProfileService`, and its failure costs this screen
     * nothing: no profile means no index means `hcp12`, which is what an
     * un-resolved `auto` already shows.
     */
    async loadHandicap(): Promise<void> {
        await this.profile.load();
    }

    /**
     * Apply filter criteria. Always switches to `custom` — the criteria ARE the
     * custom window, and leaving the picker saying "Last 10" over a filtered
     * set of three would be a lie the screen tells itself.
     */
    applyFilter(filter: StatsRoundFilter): void {
        this.filter.set(filter);
        this.preset.set('custom');
        saveWindowPreset('custom');
        void this.extendIfNeeded();
    }

    /** Drop the criteria and go back to the default window. */
    clearFilter(): void {
        this.filter.set(EMPTY_FILTER);
        this.select(FALLBACK_PRESET);
    }

    /**
     * Fetch older pages until the window is honest or the budget is spent.
     *
     * Serialised on `extending`: two callers (a window switch racing the
     * initial load's own call) must not both append the same cursor page.
     *
     * The stale error is dropped HERE rather than only in the load-once
     * `load()`: a page that failed once is a fact about that attempt, and
     * leaving the banner up would make one flaky page a permanent claim that
     * the window is short, through every later window switch that succeeded.
     */
    async extendIfNeeded(): Promise<void> {
        if (this.extending.get() || this.loading.get()) return;
        this.extendError.set(null);
        this.extending.set(true);
        try {
            while (
                this.cursor !== null &&
                this.pagesFetched < StatsDashboardService.MAX_PAGES &&
                needsMoreHistory({
                    preset: this.preset.get(),
                    filter: this.filter.get(),
                    loaded: this.loadedRounds.get(),
                    hasMore: this.hasMore.get(),
                    now: new Date(),
                })
            ) {
                const cursor = this.cursor;
                let page;
                try {
                    page = await api.playerStats.myStats({
                        limit: StatsDashboardService.PAGE_SIZE,
                        cursor,
                    });
                } catch {
                    // The rows already in hand stay on screen; the window says
                    // it may be incomplete rather than vanishing.
                    this.extendError.set({
                        code: 'network',
                        message: 'Could not load older rounds.',
                    });
                    return;
                }
                // Same refusal as `load()`'s, surfaced on the extend path: the
                // rows already in hand are whole, so they stay on screen.
                const shapeProblem = statsShapeProblem(page.rounds);
                if (shapeProblem !== null) {
                    this.extendError.set({ code: 'server', message: shapeProblem });
                    return;
                }
                this.pagesFetched += 1;
                this.appendRounds(page.rounds);
                this.cursor = page.nextCursor;
                // From the CURSOR, not from how many rows came back: a short
                // page is not the end of the feed.
                this.hasMore.set(page.nextCursor !== null);
            }
        } finally {
            this.extending.set(false);
        }
    }

    /** True when paging stopped at the budget rather than at the end of history. */
    budgetSpent(): boolean {
        return this.pagesFetched >= StatsDashboardService.MAX_PAGES && this.hasMore.get();
    }

    /** Rows fetched so far — the "of D rounds" fallback when the server's count is absent. */
    loadedCount(): number {
        return this.loadedRounds.get().length;
    }

    /** Forget everything (sign-out) — the next login starts clean. */
    clear(): void {
        this.loadedRounds.set([]);
        this.roundsWithStats.set(null);
        this.hasMore.set(false);
        this.loaded.set(false);
        this.error.set(null);
        this.extendError.set(null);
        this.filter.set(EMPTY_FILTER);
        this.pagesFetched = 0;
        this.cursor = null;
    }

    /** Append, de-duplicating on round id — a cursor page can overlap. */
    private appendRounds(rows: readonly PlayerRoundStats[]): void {
        const seen = new Set(this.loadedRounds.get().map((r) => r.roundId));
        const fresh = rows.filter((r) => !seen.has(r.roundId));
        if (fresh.length === 0) return;
        this.loadedRounds.set([...this.loadedRounds.get(), ...fresh]);
    }
}

export { EMPTY_DASHBOARD_MODEL };
