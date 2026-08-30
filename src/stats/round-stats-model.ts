// One round's stats, reduced: `(summary row, hole rows, history) -> a screen`.
//
// Pure — no service, no network, no DOM, no theme (importing `../theme` would
// drag `document` into every test that touches this file). The same division of
// labour as `stats-dashboard-model.ts`: the display policy and the null rules
// live in `../round/stat-measures.ts`, and a view that does arithmetic is a
// second implementation of them.
//
// Twin of `ios/TapScore/Features/Stats/RoundStatsModel.swift`.
//
// Two contracts this file exists to keep:
//
// - **Unrecorded is absent, never defaulted.** A hole with no putt answer has
//   `putts === null`, which is a different fact from `putts === 0`, and the cell
//   draws nothing rather than a zero.
// - **The baseline window is PRIOR rounds only.** `stat-measures`' window
//   contract says the caller filters; `priorRounds()` is that filter, and it
//   excludes the round under evaluation by construction rather than by
//   remembering to.

import type { RoundBall, RoundPlayingGroup } from '../api/rounds.gen';
import type {
    PlayerHoleStats,
    PlayerRoundHoleStats,
    PlayerRoundStats,
} from '../api/player-stats.gen';
import type { MarkerTemplate } from '../round/marker-tokens';
import {
    baselineDeltas,
    classifyDoubleCause,
    DEFAULT_SG_BASELINE,
    insightLines,
    strokesLostForBundle,
    type DoubleCause,
    type InsightLine,
    type SgBaselineBundle,
    type StrokesLost,
    type StrokesLostDeltas,
} from '../round/stat-measures';
import {
    arrivalMetres,
    buildDashboardModel,
    type StatsDashboardModel,
} from './stats-dashboard-model';
import { sortRows } from './stats-window';

// --- Score marker ------------------------------------------------------------

/**
 * The score-vs-par forms a hole cell can carry — the FILLED subset of the
 * client's marker vocabulary (`MARKER_TOKENS` in `../round/marker-tokens.ts`).
 *
 * Typed as a subset of `MarkerTemplate` on purpose: the strip's fills come out
 * of that same table, so a template renamed server-side stops this compiling
 * rather than silently painting nothing.
 */
export type ScoreMarkerForm = Extract<
    MarkerTemplate,
    'ring' | 'double_ring' | 'diamond' | 'square' | 'double_square' | 'box_badge'
>;

/**
 * Classify a stroke count against par, branch for branch as the server's
 * `scoreToParMarker()` (`server/domain/strategies/result-vocabulary.ts`) does.
 *
 * Reproduced rather than imported: nothing under `src/` imports `server/`, and
 * the scorecard and leaderboard get their markers as TEMPLATES the server sends
 * (`result-render.ts` → `MARKER_TOKENS`). This strip has no presenter behind it
 * — it is drawn from `GET /players/me/rounds/:roundId/stats`, which carries
 * scores and pars and no presentation at all. A birdie reads the same in both
 * places because both end at the same token table, not because they share a
 * code path. iOS reproduces the same thresholds in `ScoreMarkerForm.forScore`.
 *
 * @param isGross false for a NET score — a net 1 is not a hole in one, so it
 *   classifies by its difference to par like any other value. Matches the
 *   server's `holeInOne` flag.
 * @returns null for level par, and for anything that is not a real stroke count
 *   (null, zero — the app's pick-up — or negative). Both mean "draw no marker".
 */
export function scoreMarkerForm(
    strokes: number | null,
    par: number | null,
    isGross = true,
): ScoreMarkerForm | null {
    if (strokes === null || par === null || strokes <= 0) return null;
    const diff = strokes - par;
    if (diff === 0) return null;
    if (strokes === 1 && isGross) return 'diamond';
    if (diff <= -3) return 'diamond';
    if (diff === -2) return 'double_ring';
    if (diff === -1) return 'ring';
    if (diff === 1) return 'square';
    if (diff === 2) return 'double_square';
    return 'box_badge';
}

// --- Hole strip --------------------------------------------------------------

export type TeeResult = NonNullable<PlayerHoleStats['teeResult']>;
export type FirstPutt = NonNullable<PlayerHoleStats['firstPutt']>;
export type ShortGameDifficulty = NonNullable<PlayerHoleStats['shortGameDifficulty']>;

/**
 * One cell of the hole strip, and the source of that hole's expanded stat line.
 *
 * Every stat dimension is optional and stays optional. `strokes` is the SCORED
 * stroke count: a picked-up hole (the app writes strokes `0`) carries
 * `isPickedUp` and no number, exactly as the score-entry cells render it.
 */
export interface RoundStatsHoleCell {
    /** The play-hole id — unique within the round, so it keys the `$each`. */
    id: string;
    /**
     * Position in the round's canonical order — NOT shotgun-rotated, matching
     * how every scorecard in the app renders.
     */
    ordinal: number;
    holeNumber: number;
    par: number;
    lengthM: number | null;
    /** null when the hole was not scored, or was picked up. */
    strokes: number | null;
    isPickedUp: boolean;
    /** null whenever `strokes` is. */
    vsPar: number | null;
    /** The app's own score-vs-par decoration, classified locally. */
    marker: ScoreMarkerForm | null;

    tee: TeeResult | null;
    gir: boolean | null;
    putts: number | null;
    firstPutt: FirstPutt | null;
    shortGame: ShortGameDifficulty | null;
    penalties: number | null;
    recoveryOk: boolean | null;
    /**
     * What manufactured this hole, when it was a double bogey or worse
     * (`docs/proposals/double-cause-breakdown.md` §4.4). null on every other
     * hole, and on a double the reader recorded nothing about it reads
     * `unattributed` rather than disappearing.
     *
     * The SAME classifier the scoring card's "Where your doubles come from"
     * block counts with — the per-hole rows are already served, so naming the
     * cause on the strip costs no request.
     */
    doubleCause: DoubleCause | null;
}

/** Derive one cell from the server's per-hole row. */
export function holeCell(row: PlayerRoundHoleStats): RoundStatsHoleCell {
    const par = row.par;
    const raw = row.score;
    // Strokes `0` is the app's PICK-UP, never the digit zero.
    const isPickedUp = raw === 0;
    const strokes = isPickedUp ? null : raw;
    const stats = row.stats;
    return {
        id: row.playHoleId,
        ordinal: row.ordinal,
        holeNumber: row.courseHoleNumber,
        par,
        lengthM: row.lengthM,
        strokes,
        isPickedUp,
        vsPar: strokes === null ? null : strokes - par,
        marker: scoreMarkerForm(strokes, par),
        tee: stats.teeResult,
        gir: stats.gir,
        putts: stats.putts,
        firstPutt: stats.firstPutt,
        shortGame: stats.shortGameDifficulty,
        penalties: stats.penalties,
        recoveryOk: stats.recoveryOk,
        doubleCause: classifyDoubleCause(row),
    };
}

/**
 * A penalty flag is drawn for a RECORDED penalty above zero. A recorded zero is
 * a hole the player answered "none" on, which the flag must not claim, and an
 * unrecorded one is not a claim at all.
 */
export function cellHasPenalty(cell: RoundStatsHoleCell): boolean {
    return (cell.penalties ?? 0) > 0;
}

/**
 * True when any dimension was recorded. A cell with none still renders — it has
 * a score and a par — it just carries no glyphs.
 */
export function cellHasAnyStat(cell: RoundStatsHoleCell): boolean {
    return (
        cell.tee !== null ||
        cell.gir !== null ||
        cell.putts !== null ||
        cell.firstPutt !== null ||
        cell.shortGame !== null ||
        cell.penalties !== null ||
        cell.recoveryOk !== null
    );
}

// --- The model ---------------------------------------------------------------

/**
 * How many prior rounds the personal baseline is taken over, when that many
 * exist. Matches the dashboard's default window, which is what the story card's
 * "vs your last 10" is quoting.
 */
export const DEFAULT_ROUND_WINDOW = 10;

/** At most this many insight lines on the story card. */
export const DEFAULT_INSIGHT_LIMIT = 3;

export interface RoundStatsModel {
    roundId: string;
    date: string;
    courseName: string | null;
    name: string | null;
    holeCount: number;
    /** null for a stats-only round (answers recorded, no scorecard). */
    strokes: number | null;
    vsPar: number | null;

    /** Ordinal order, as the server sent it and as scorecards render it. */
    cells: RoundStatsHoleCell[];

    /**
     * This one round put through the dashboard's own reduction, so the §3
     * panels are the same components over the same gating — at n-of-18 sample
     * sizes the rates simply degrade to fractions.
     */
    panels: StatsDashboardModel;

    /** The fixed-baseline waterfall for this round. */
    waterfall: StrokesLost;

    /**
     * This round against the player's own prior rounds. null when there are no
     * prior rounds — the first round with stats has a fixed-baseline waterfall
     * and no personal comparison, which is a true statement rather than a
     * zeroed one.
     */
    deltas: StrokesLostDeltas | null;
    /** How many prior rounds the deltas are over. 0 when `deltas` is null. */
    windowCount: number;
    /**
     * At most `insightLimit` lines, already ranked. The module chose them; the
     * UI words them (`round-stats-copy.ts`).
     */
    insights: InsightLine[];
}

export function buildRoundStatsModel(args: {
    round: PlayerRoundStats;
    holes: readonly PlayerRoundHoleStats[];
    history: readonly PlayerRoundStats[];
    windowSize?: number;
    insightLimit?: number;
    /**
     * The handicap cohort this screen is priced against. The round's waterfall
     * AND the personal baseline it is compared with must come from the same
     * bundle: a delta between two different populations is not a delta.
     */
    bundle?: SgBaselineBundle;
}): RoundStatsModel {
    const {
        round,
        holes,
        history,
        windowSize = DEFAULT_ROUND_WINDOW,
        insightLimit = DEFAULT_INSIGHT_LIMIT,
        bundle = DEFAULT_SG_BASELINE,
    } = args;
    const panels = buildDashboardModel([round], bundle);
    const waterfall = panels.waterfall;
    const window = priorRounds(round, history, windowSize);
    // Each prior round priced with ITS OWN arrival metres, the same way the
    // dashboard prices a row. Without them the window baseline would be the
    // unrefined bucket pricing while this round's waterfall is refined, and
    // the pricing difference would surface as a delta the player never played.
    const windowLosts = window.map((r) =>
        strokesLostForBundle(r.measures, bundle, arrivalMetres(r)),
    );
    const row = panels.rounds[0];
    return {
        roundId: round.roundId,
        date: round.date,
        courseName: round.courseName,
        name: round.name,
        holeCount: round.holeCount,
        strokes: row?.strokes ?? null,
        vsPar: row?.vsPar ?? null,
        cells: [...holes].sort((a, b) => a.ordinal - b.ordinal).map(holeCell),
        panels,
        waterfall,
        deltas: windowLosts.length === 0 ? null : baselineDeltas(waterfall, windowLosts),
        windowCount: windowLosts.length,
        insights: insightLines(round.measures, waterfall, windowLosts, insightLimit),
    };
}

/**
 * The `limit` rounds immediately BEFORE this one, newest first.
 *
 * Built by sorting the round in with its history and taking what follows it, so
 * the round under evaluation cannot end up in its own baseline even if the
 * caller hands over a history that contains it. That is `stat-measures`' window
 * contract, kept in one place.
 */
export function priorRounds(
    round: PlayerRoundStats,
    history: readonly PlayerRoundStats[],
    limit: number,
): PlayerRoundStats[] {
    const rows = history.filter((r) => r.roundId !== round.roundId);
    rows.push(round);
    const sorted = sortRows(rows);
    const index = sorted.findIndex((r) => r.roundId === round.roundId);
    if (index === -1) return [];
    return sorted.slice(index + 1, index + 1 + Math.max(0, limit));
}

/**
 * True once the target round is held AND enough rounds strictly OLDER than it
 * are behind it — the stop condition for the history walk.
 *
 * The test is on the sorted position, not on the raw count: rows newer than the
 * round do nothing for its baseline, so a walk that stopped on "I have ten
 * rows" would leave the newest round in a history with no window at all.
 */
export function historySatisfied(
    rows: readonly PlayerRoundStats[],
    roundId: string,
    windowSize: number,
): boolean {
    const sorted = sortRows(rows);
    const index = sorted.findIndex((r) => r.roundId === roundId);
    if (index === -1) return false;
    return sorted.length - (index + 1) >= windowSize;
}

/**
 * The round's own name when it has one, else the course — the same
 * name-over-course fallback the round list and round header apply.
 */
export function roundStatsTitle(model: {
    name: string | null;
    courseName: string | null;
}): string {
    const named = (model.name ?? '').trim();
    if (named !== '') return named;
    const course = (model.courseName ?? '').trim();
    return course === '' ? 'Round' : course;
}

// --- Story eligibility -------------------------------------------------------

/**
 * Why the round-end story (§4.1) may or may not appear.
 *
 * The reasons are ordered from the outside in: no session, then no stats
 * configured, then none recorded, then a round still in play.
 */
export type RoundStoryReason =
    | 'eligible'
    /**
     * The round flow works logged out; the story does not, because
     * `myRoundStats` is session-scoped.
     */
    | 'notSignedIn'
    /**
     * Signed in, but this player tracks no modules in this round — the
     * scorer-for-others case.
     */
    | 'noStatsConfigured'
    /** Configured, but nothing was actually answered. */
    | 'noStatsRecorded'
    /** Not every hole on this player's card has a score yet. */
    | 'roundUnfinished';

/**
 * Whether the round-end story may appear, and why not when it may not.
 *
 * SELF ONLY. The story speaks in the second person about the reader's own
 * round, so a phone that scored for three friends and recorded nothing of its
 * own gets nothing — a scorer's device showing someone else's putting deltas
 * would be both a privacy leak and a lie about whose round it was.
 */
export interface RoundStoryEligibility {
    reason: RoundStoryReason;
    /** The player the story would be about. Present only when eligible. */
    playerId: string | null;
}

export function evaluateStoryEligibility(args: {
    signedInPlayerId: string | null;
    statConfigPlayerIds: ReadonlySet<string>;
    statRows: readonly PlayerHoleStats[];
    /** null = this player holds no ball in the round. */
    holesUnscored: number | null;
}): RoundStoryEligibility {
    const { signedInPlayerId, statConfigPlayerIds, statRows, holesUnscored } = args;
    if (signedInPlayerId === null || signedInPlayerId === '') {
        return { reason: 'notSignedIn', playerId: null };
    }
    if (!statConfigPlayerIds.has(signedInPlayerId)) {
        return { reason: 'noStatsConfigured', playerId: null };
    }
    const recorded = statRows.some((r) => r.playerId === signedInPlayerId && hasAnyAnswer(r));
    if (!recorded) return { reason: 'noStatsRecorded', playerId: null };
    // null = this player holds no ball in the round, which is not a finished
    // card either.
    if (holesUnscored !== 0) return { reason: 'roundUnfinished', playerId: null };
    return { reason: 'eligible', playerId: signedInPlayerId };
}

/**
 * True when the row carries at least one recorded answer. An all-null row is a
 * projection artefact, not a hole the player told us anything about.
 */
export function hasAnyAnswer(row: PlayerHoleStats): boolean {
    return (
        row.teeResult !== null ||
        row.gir !== null ||
        row.firstPutt !== null ||
        row.putts !== null ||
        row.shortGameDifficulty !== null ||
        row.penalties !== null ||
        row.recoveryOk !== null
    );
}

/**
 * Holes on that player's own card with no score yet, or null when they hold no
 * ball in this round.
 *
 * Zero is the DURABLE "their round is over". The round's `status` is not the
 * same question — a round is `complete` when everyone has finished, and the
 * story is about one reader's own card. `advance-policy.ts`'s
 * round-complete signal is a moment (a toast), and a surface that only existed
 * during it would be gone by the time the player looked at the board.
 *
 * Pure, and takes the pieces rather than the service, so it stays testable and
 * `RoundViewService` needs no new method.
 */
export function holesUnscoredFor(args: {
    playerId: string;
    balls: readonly RoundBall[];
    groups: readonly RoundPlayingGroup[];
    strokesFor: (ballId: string, playHoleId: string) => number | null;
}): number | null {
    const { playerId, balls, groups, strokesFor } = args;
    const ball = balls.find((b) => b.players.some((p) => p.playerId === playerId));
    if (!ball) return null;
    const group = groups.find((g) => g.ballIds.includes(ball.id));
    if (!group) return null;
    return group.playedOrder.filter((o) => strokesFor(ball.id, o.playHoleId) === null).length;
}
