// Every word the per-round screen and the round-end story say.
//
// Split from `round-stats-model.ts` for the same reason `stats-format.ts` is
// split from `stat-measures.ts`: the module owns the SELECTION (which insights,
// which glyphs), the copy owns the WORDING. One file to translate, and a
// wording change cannot alter what gets shown.
//
// Pure — no DOM, no theme. Twins of `RoundStatsView.swift` and
// `RoundStoryCard.swift`, whose strings these are, phrase for phrase.
//
// House rules being kept here:
//
// - **Worded, never glyph-only.** Every mark on the strip has a legend line,
//   and every stat has a full sentence in the expanded hole. A colour or a ring
//   is a reminder of a word, never the only carrier of it.
// - **Absence is stated.** "Not recorded" is a different sentence from a zero,
//   and a hole nobody answered says so instead of rendering an empty row that
//   reads as "no".

import type { InsightLine, StrokesLostComponent } from '../round/stat-measures';
import { componentTitle, formatDay, formatNumber, vsPar } from './stats-format';
import { doubleCauseTitle } from './stats-panel-blocks';
import type {
    FirstPutt,
    RoundStatsHoleCell,
    ScoreMarkerForm,
    ShortGameDifficulty,
    TeeResult,
} from './round-stats-model';

export const ROUND_STATS_COPY = {
    loading: 'Reading the round…',
    /** The round exists but holds nothing of the reader's own. */
    noStatsInRound:
        'No statistics of your own in this round. Only the player whose card carried them can see them.',
    notFound: 'That round is not here, or it is not yours to read.',
    notSignedIn: 'Sign in to see your own statistics for a round.',
    failedPrefix: 'Could not read the round: ',
    retry: 'Try again',

    holeStripHeading: 'Hole by hole',
    waterfallHeading: 'Where the round went',
    legendHeading: 'Reading the strip',
    nothingRecordedOnHole: 'Nothing was recorded on this hole.',
    noHoleStrip: 'No hole-by-hole detail for this round.',

    waterfallHint: 'Strokes lost against a fixed baseline. Positive costs you shots.',
    legendTee: 'Dot — where the tee shot finished: green fairway, brass in play, terracotta trouble.',
    legendGir: 'Ring — green in regulation: filled hit, hollow missed.',
    legendPutts: 'Number — putts taken on the hole.',
    legendPenalty: 'Flag — a penalty stroke.',
    legendAbsence:
        'Anything you did not record is left out: an empty row is a hole nobody answered, not a hole answered no.',
} as const;

export const ROUND_STORY_COPY = {
    title: 'Your round',
    seeWholeRound: 'See the whole round',
} as const;

// --- Header ------------------------------------------------------------------

/**
 * `12 July 2026 · Linköping · 18 holes`.
 *
 * The course is dropped when it is already the title — a header reading
 * "Linköping / Linköping" says nothing twice.
 */
export function roundStatsSubtitle(model: {
    date: string;
    courseName: string | null;
    holeCount: number;
    title: string;
}): string {
    const parts = [formatDay(model.date)];
    const course = (model.courseName ?? '').trim();
    if (course !== '' && course !== model.title) parts.push(course);
    parts.push(model.holeCount === 1 ? '1 hole' : `${model.holeCount} holes`);
    return parts.join(' · ');
}

/** `80 (+8)`, `80 (E)`, or null for a round with no scorecard behind it. */
export function totalScoreLine(strokes: number | null, over: number | null): string | null {
    if (strokes === null) return null;
    if (over === null) return String(strokes);
    return `${strokes} (${vsPar(over)})`;
}

// --- Hole strip --------------------------------------------------------------

/** `Hole 7 · par 4 · 320 m` — the length only when the course carries one. */
export function holeTitle(cell: RoundStatsHoleCell): string {
    let title = `Hole ${cell.holeNumber} · par ${cell.par}`;
    if (cell.lengthM !== null) title += ` · ${cell.lengthM} m`;
    return title;
}

/**
 * The digit inside a strip cell.
 *
 * A picked-up hole shows an en dash and a hole with no score at all a middle
 * dot: both are "no number", and they are different facts — one is a hole the
 * player abandoned, the other one nobody entered.
 */
export function cellScoreText(cell: RoundStatsHoleCell): string {
    if (cell.strokes !== null) return String(cell.strokes);
    return cell.isPickedUp ? '–' : '·';
}

/** `4 (−1)`, `Picked up`, or null when the hole was never scored. */
export function scoreLine(cell: RoundStatsHoleCell): string | null {
    if (cell.isPickedUp) return 'Picked up';
    if (cell.strokes === null) return null;
    if (cell.vsPar === null) return String(cell.strokes);
    return `${cell.strokes} (${vsPar(cell.vsPar)})`;
}

export function teeTitle(tee: TeeResult): string {
    switch (tee) {
        case 'fairway':
            return 'Fairway';
        case 'in_play':
            return 'In play';
        case 'trouble':
            return 'Trouble';
    }
}

/**
 * Both bucket vocabularies, because a round carries whichever the course was
 * measured in — the five-bucket outdoor scale and the three-bucket indoor one.
 * `stats-format`'s `bucketTitle` only knows the outdoor five (it is typed to
 * `PuttBucket`, the aggregate scale), so the per-hole answer needs its own.
 */
export function firstPuttTitle(bucket: FirstPutt): string {
    switch (bucket) {
        case 'inside_1m':
            return 'Inside 1 m';
        case '1_to_2m':
            return '1–2 m';
        case '2_to_4m':
            return '2–4 m';
        case '4_to_8m':
            return '4–8 m';
        case 'over_8m':
            return 'Over 8 m';
        case 'inside_2m':
            return 'Inside 2 m';
        case '2_to_6m':
            return '2–6 m';
        case 'over_6m':
            return 'Over 6 m';
    }
}

export function shortGameTitle(difficulty: ShortGameDifficulty): string {
    return difficulty === 'hard' ? 'Hard chip or pitch' : 'Standard chip or pitch';
}

/** The golf name of a score marker, for the cell's accessible label. */
export function markerName(marker: ScoreMarkerForm): string {
    switch (marker) {
        case 'ring':
            return 'Birdie';
        case 'double_ring':
            return 'Eagle';
        case 'diamond':
            return 'Albatross or hole in one';
        case 'square':
            return 'Bogey';
        case 'double_square':
            return 'Double bogey';
        case 'box_badge':
            return 'Triple bogey or worse';
    }
}

export interface HoleLine {
    label: string;
    value: string;
}

/** A `HoleLine` carrying the key a keyed list must use for it. */
export interface HoleDetailRow extends HoleLine {
    key: string;
}

/**
 * The expanded hole, in reading order: what you scored, then the shot sequence
 * that produced it — tee, green, putts, short game, recovery, penalties.
 *
 * Only recorded dimensions appear. An unanswered one is omitted rather than
 * shown as a dash: a row saying "Putts —" invites the reader to conclude
 * something about the putting on that hole, and there is nothing to conclude.
 */
export function holeLines(cell: RoundStatsHoleCell): HoleLine[] {
    const lines: HoleLine[] = [];
    const score = scoreLine(cell);
    if (score !== null) lines.push({ label: 'Score', value: score });
    // The double's cause, in the same word the scoring card's "Where your
    // doubles come from" block uses — a WORD, never a glyph, and read directly
    // under the score it explains. Absent on every hole that is not a double
    // bogey or worse; a double with nothing recorded says "Not enough
    // recorded", which is a statement rather than a silence.
    if (cell.doubleCause !== null) {
        lines.push({ label: 'Mainly from', value: doubleCauseTitle(cell.doubleCause) });
    }
    if (cell.tee !== null) lines.push({ label: 'Tee shot', value: teeTitle(cell.tee) });
    if (cell.gir !== null) {
        lines.push({ label: 'Green in regulation', value: cell.gir ? 'Hit' : 'Missed' });
    }
    if (cell.putts !== null) {
        lines.push({ label: 'Putts', value: cell.putts === 1 ? '1 putt' : `${cell.putts} putts` });
    }
    if (cell.firstPutt !== null) {
        lines.push({ label: 'First putt', value: firstPuttTitle(cell.firstPutt) });
    }
    if (cell.shortGame !== null) {
        lines.push({ label: 'Short game', value: shortGameTitle(cell.shortGame) });
    }
    if (cell.recoveryOk !== null) {
        lines.push({
            label: 'Recovery',
            value: cell.recoveryOk ? 'Back in play' : 'Still in trouble',
        });
    }
    if (cell.penalties !== null) {
        lines.push({
            label: 'Penalties',
            value:
                cell.penalties === 0
                    ? 'None'
                    : cell.penalties === 1
                      ? '1 stroke'
                      : `${cell.penalties} strokes`,
        });
    }
    return lines;
}

/**
 * The expanded hole's lines, each carrying a key that names the HOLE as well as
 * the line.
 *
 * The labels alone are NOT keys. "Score", "Tee shot" and "Putts" are the same
 * strings on every hole, so a keyed list keyed on the label reuses the previous
 * hole's rows when the selection changes — and a reused row keeps the bindings
 * that closed over the previous hole's line, which is the old hole's numbers
 * under the new hole's title. Keying on `cell.id` too replaces every row on a
 * hole switch, which is what a hole switch is.
 */
export function holeDetailRows(cell: RoundStatsHoleCell | null): HoleDetailRow[] {
    if (cell === null) return [];
    return holeLines(cell).map((line) => ({ ...line, key: `${cell.id}:${line.label}` }));
}

/**
 * The whole cell as one sentence, for screen readers and for the tooltip — the
 * strip is glyphs, and a glyph the reader cannot see is not information.
 */
export function cellLabel(cell: RoundStatsHoleCell): string {
    const parts: string[] = [`Hole ${cell.holeNumber}`, `par ${cell.par}`];
    if (cell.isPickedUp) parts.push('picked up');
    else if (cell.strokes !== null) {
        parts.push(cell.strokes === 1 ? '1 stroke' : `${cell.strokes} strokes`);
        if (cell.marker !== null) parts.push(markerName(cell.marker).toLowerCase());
    } else parts.push('no score');
    for (const line of holeLines(cell)) {
        if (line.label === 'Score') continue;
        parts.push(`${line.label.toLowerCase()} ${line.value.toLowerCase()}`);
    }
    return `${parts.join(', ')}.`;
}

// --- Personal baseline -------------------------------------------------------

/**
 * One waterfall component against the player's own recent rounds.
 *
 * POSITIVE DELTA IS WORSE — the waterfall counts strokes LOST, so a component
 * above your normal cost you shots. The sentence says "worse" rather than
 * leaning on the sign, because a reader who reads `+0.8` as good has been
 * misled by the app.
 *
 * A window of one is worded as "your previous round": "your last 1 rounds" is
 * both wrong and a giveaway that nobody read the sentence out loud.
 */
export function baselineDeltaSentence(delta: number, windowCount: number): string {
    const rounds = windowCount === 1 ? 'round' : `last ${windowCount} rounds`;
    // Below half a tenth the number would print as "0.0"; claiming a direction
    // for it would be a difference the reader cannot see.
    if (Math.abs(delta) < 0.05) {
        return windowCount === 1
            ? 'The same as your previous round.'
            : `The same as your ${rounds}.`;
    }
    const direction = delta > 0 ? 'worse' : 'better';
    const magnitude = formatNumber(Math.abs(delta), 1);
    return windowCount === 1
        ? `${magnitude} ${direction} than your previous round.`
        : `${magnitude} ${direction} than your ${rounds}.`;
}

/** The heading over the personal-baseline block. */
export function baselineHeading(windowCount: number): string {
    return windowCount === 1
        ? 'Against your previous round'
        : `Against your last ${windowCount} rounds`;
}

// --- Insights ----------------------------------------------------------------

/**
 * The story card's noun for a waterfall component, in a sentence rather than as
 * a column head: "Your short game cost you…" reads where "Short game" would sit
 * as a label. `componentTitle` stays the label form.
 */
export function insightComponentName(component: StrokesLostComponent): string {
    switch (component) {
        case 'tee':
            return 'Your tee shots';
        case 'approach':
            return 'Your approach play';
        case 'shortGame':
            return 'Your short game';
        case 'putting':
            return 'Putting';
        case 'penalties':
            return 'Penalties';
    }
}

function num(value: unknown, decimals = 1): string {
    return typeof value === 'number' ? formatNumber(Math.abs(value), decimals) : '';
}

function count(value: unknown): string {
    return typeof value === 'number' ? String(Math.round(value)) : '';
}

// The param is typed `InsightParam`, so the non-string branch is unreachable
// from `insightLines`. It falls back to the FIRST canonical component rather
// than to a retired name: `'longGame'` no longer exists, and inventing an alias
// for it is exactly the compatibility shim the no-residual rule forbids.
function component(value: unknown): StrokesLostComponent {
    return typeof value === 'string' ? (value as StrokesLostComponent) : 'tee';
}

/**
 * Word one insight.
 *
 * EXHAUSTIVE BY CONSTRUCTION: the switch has no `default:`, so adding an
 * `InsightId` in `stat-measures.ts` fails this file's type check until it is
 * worded. That is the point — the module can select a line the UI has no
 * sentence for exactly once, at compile time, rather than shipping a blank row.
 * `tests/stats/round-stats-copy.test.ts` asserts the same thing at runtime.
 */
export function insightSentence(line: InsightLine): string {
    const p = line.params;
    switch (line.id) {
        case 'component_best_vs_baseline':
            return `${insightComponentName(component(p.component))} was ${num(p.delta)} strokes better than your recent rounds.`;
        case 'component_worst_vs_baseline':
            return `${insightComponentName(component(p.component))} cost you ${num(p.delta)} strokes more than your recent rounds.`;
        case 'penalties_spike': {
            const n = typeof p.penalties === 'number' ? Math.round(p.penalties) : 0;
            const strokes = n === 1 ? '1 penalty stroke' : `${n} penalty strokes`;
            return `${strokes}, against ${num(p.baseline)} in a normal round.`;
        }
        case 'two_way_miss':
            return `Your tee misses are split ${count(p.left)} left and ${count(p.right)} right of ${count(p.recorded)} — you are missing both ways.`;
        case 'scramble_streak':
            return `You saved par ${count(p.successes)} of the ${count(p.attempts)} times you missed the green.`;
        case 'hard_scramble_streak':
            return `You saved par from all ${count(p.attempts)} of the hard spots you were in.`;
        case 'three_putt_free':
            return `No three-putts — ${count(p.putts)} putts across the round.`;
        case 'best_putting_round': {
            const rounds = typeof p.rounds === 'number' ? Math.round(p.rounds) : 0;
            return rounds === 1
                ? 'Your best putting of the last round.'
                : `Your best putting of the last ${rounds} rounds.`;
        }
        case 'bounce_back_perfect': {
            const n = typeof p.opportunities === 'number' ? Math.round(p.opportunities) : 0;
            return n === 1
                ? 'You came straight back after your dropped shot.'
                : `You came straight back after all ${n} of your dropped shots.`;
        }
    }
}

/** Re-exported so a view can label a waterfall column without a second import. */
export { componentTitle };
