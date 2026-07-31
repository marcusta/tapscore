// The landing's statistics card: three numbers, one instruction, and a way in
// — spec items 18–25 (+27) of `docs/proposals/home-redesign-ios.md`, item W6.
//
// It is a GLANCE, not a dashboard. Everything the card knows comes from ONE
// page of `GET /players/me/stats` reduced by the same pure functions the
// dashboard uses (`applyWindow` → `buildDashboardModel`), so the two surfaces
// cannot disagree about what a fairway percentage is. There is no paging loop
// here and there must not be one: `StatsDashboardService` exists to walk a
// career, and the landing is the last place that should spend forty requests
// before it can draw.
//
// The card also never explains itself. A failed fetch, a dead session, an empty
// window, or a window whose three tiles all lack a denominator all mean the
// same thing on this screen — no card. A home screen that says "couldn't load
// your statistics" makes a network blip look like something the player must act
// on, which is the rule the "Out now" strip already follows.
//
// Twin of `ios/TapScore/Features/Stats/HomeStatsCard.swift`'s pure fold; a
// change to one belongs in both.
//
// Pure module: no DOM, no service, no network. Rows and a `now` in, a card or
// null out.

import type { PlayerRoundStats, StatMeasures } from '../api/player-stats.gen';
import { rate, rateDisplay, type Rate } from '../round/stat-measures';
import {
    buildDashboardModel,
    type StatsDashboardModel,
} from '../stats/stats-dashboard-model';
import {
    applyWindow,
    EMPTY_FILTER,
    FALLBACK_PRESET,
    needsMoreHistory,
    presetRoundLimit,
    presetTitle,
    type StatsWindowPreset,
} from '../stats/stats-window';
import {
    averageSample,
    componentTitle,
    formatAverage,
    formatRate,
    UNIT_HOLES,
} from '../stats/stats-format';

/**
 * One tile: a reading and what it measures. The value is already formatted by
 * `stats-format` — the view does no arithmetic and no rounding, so the display
 * policy (percentage / fraction / absent) is applied in exactly one place.
 */
export interface HomeStatsTile {
    id: string;
    value: string;
    /** Worded, never a glyph — the app's standing label rule. */
    label: string;
    /**
     * The thin-sample disclosure, when the display policy demands one — the
     * average tile's equivalent of a rate degrading to "2 of 3". Null on a
     * sample the policy trusts.
     */
    note: string | null;
}

/**
 * Everything the card draws, or **null when there is nothing worth drawing**.
 *
 * Null is the card's whole error vocabulary, which is why `buildHomeStatsCard`
 * answers null rather than an "empty" model: an empty model is a thing a view
 * can render by accident.
 */
export interface HomeStatsCardModel {
    /** The muted half of the title row — the persisted window, in words. */
    windowLabel: string;
    /** Up to three tiles, in reading order: the scorecard, then tee to green. */
    tiles: HomeStatsTile[];
    /** The strokes-lost leader as a sentence, or null when nothing costs anything. */
    priorityLine: string | null;
}

/** The card's title, and the word the a11y sentence opens with. */
export const HOME_STATS_TITLE = 'Statistics';

/** The visible way in — words carry the destination, the arrow is decoration. */
export const HOME_STATS_FOOTER = 'All statistics →';

/**
 * The window the card actually applies.
 *
 * A persisted `custom` is deliberately NOT honoured: the custom FILTER is a
 * within-session refinement that `saveWindowPreset` never stores (see
 * `stats-window.ts`), so `custom` on a cold load is the empty filter — which
 * admits everything while the title row would claim "Custom". The card falls
 * back to the default window and says so truthfully instead.
 */
export function effectiveHomeStatsPreset(preset: StatsWindowPreset): StatsWindowPreset {
    return preset === 'custom' ? FALLBACK_PRESET : preset;
}

/**
 * The title row's muted half.
 *
 * `truncated` only changes the LABEL, and only for a window that is not
 * count-bounded: "This year" over the newest twenty rounds is a claim the card
 * cannot back, so it says which twenty. "Last 5 rounds" over five rows is
 * complete whatever else the server holds.
 */
export function homeStatsWindowLabel(
    preset: StatsWindowPreset,
    roundCount: number,
    truncated: boolean,
): string {
    if (presetRoundLimit(preset) !== null || !truncated) return presetTitle(preset);
    return `${presetTitle(preset)} — newest ${roundCount}`;
}

/**
 * Strokes vs par PER HOLE over the window (deviation 5).
 *
 * Per hole rather than per round because a window mixes eighteens with nines,
 * and a per-round average over that mix is a number about round lengths as much
 * as about scoring. The subtraction is the summed scorecard's own
 * (`strokesTotal − parTotal`, the waterfall's total), so it carries no
 * nominal-par approximation.
 */
export function vsParPerHole(m: StatMeasures): Rate {
    return rate(m.strokesTotal - m.parTotal, m.holesScored);
}

/**
 * The three data-conditioned readings, each omitted when its denominator is
 * zero. `formatRate` and `formatAverage` already answer null for that case, so
 * the gate is the format call rather than a second copy of the rule.
 */
export function homeStatsTiles(model: StatsDashboardModel): HomeStatsTile[] {
    const tiles: HomeStatsTile[] = [];

    const vsPar = vsParPerHole(model.totals);
    const vsParValue = formatAverage(vsPar, 2, true);
    if (vsParValue !== null) {
        // A bare average escapes the display policy (`formatAverage`'s own doc
        // says so); this tile prints no fraction to degrade into, so under the
        // floor it carries the sample as a note — the dashboard's honesty in
        // the tile's shape.
        const note = rateDisplay(vsPar) === 'fraction' ? averageSample(vsPar, UNIT_HOLES) : null;
        tiles.push({ id: 'vsPar', value: vsParValue, label: 'Vs par per hole', note });
    }

    const tee = model.tee;
    const fairway = tee === null ? null : formatRate(tee.fairway);
    if (fairway !== null) {
        tiles.push({ id: 'fairways', value: fairway, label: 'Fairways hit', note: null });
    }

    const approach = model.approach;
    const gir = approach === null ? null : formatRate(approach.gir);
    if (gir !== null) {
        tiles.push({ id: 'gir', value: gir, label: 'Greens in regulation', note: null });
    }

    return tiles;
}

/**
 * The worst component, in words. `model.priorities` is already ranked worst
 * first with the no-data components sunk to the bottom, so the leader is the
 * first row with a value.
 *
 * It must also actually COST something (deviation 4). `penalties` is the one
 * waterfall term that is never null — a round with no penalties records 0, not
 * "unknown" — so a scoring-only window always has a leader, and the card would
 * say "Costing you most: Penalties" to a player who took none. The card prints
 * no number beside the name, so a non-positive leader has nothing to say and
 * says nothing.
 */
export function homeStatsPriorityLine(model: StatsDashboardModel): string | null {
    const leader = model.priorities.find((p) => p.perRound !== null);
    if (!leader || leader.perRound === null || leader.perRound <= 0) return null;
    return `Costing you most: ${componentTitle(leader.component)}`;
}

/**
 * Reduce one page of rows to the card.
 *
 * `hasMore` = the server handed back a `nextCursor` for the page in hand.
 */
export function buildHomeStatsCard(args: {
    rows: readonly PlayerRoundStats[];
    preset: StatsWindowPreset;
    hasMore: boolean;
    now: Date;
}): HomeStatsCardModel | null {
    const preset = effectiveHomeStatsPreset(args.preset);
    const rounds = applyWindow(preset, EMPTY_FILTER, args.rows, args.now);
    if (rounds.length === 0) return null;

    const model = buildDashboardModel(rounds);
    const tiles = homeStatsTiles(model);
    // Rule 21: three empty tiles is a card with nothing in it, and rule 19 says
    // that is the same as no card. The priority line alone does not earn one —
    // a sentence with no numbers over it reads as a verdict.
    if (tiles.length === 0) return null;

    // "Truncated" is `needsMoreHistory`'s question, not `hasMore`'s: a page that
    // already reaches past January 1st has proven "This year" complete however
    // much older history the server still holds.
    const truncated = needsMoreHistory({
        preset,
        filter: EMPTY_FILTER,
        loaded: args.rows,
        hasMore: args.hasMore,
        now: args.now,
    });

    return {
        windowLabel: homeStatsWindowLabel(preset, rounds.length, truncated),
        tiles,
        priorityLine: homeStatsPriorityLine(model),
    };
}

/**
 * The card read out in one sentence, in the order it is drawn.
 *
 * Spelled out rather than left to the DOM: the whole card is one button, and a
 * screen reader announcing a button by concatenating five nested spans reads
 * the arrow and the tile order back as noise.
 */
export function homeStatsAriaLabel(card: HomeStatsCardModel): string {
    const readings = card.tiles.map((tile) =>
        tile.note === null
            ? `${tile.label} ${tile.value}`
            : `${tile.label} ${tile.value}, ${tile.note}`,
    );
    const parts = [`${HOME_STATS_TITLE}, ${card.windowLabel}`, ...readings];
    if (card.priorityLine !== null) parts.push(card.priorityLine);
    // The destination, last: an aria-label overrides the subtree, so the
    // visible "All statistics →" footer is inaudible without this.
    parts.push('Opens your statistics');
    return parts.join('. ');
}
