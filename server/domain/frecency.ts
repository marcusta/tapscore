// Frecency — recency-weighted frequency of shared play, used to float the
// people you actually play with to the top of the friends list (and the
// create-flow "From friends" picker). Pure and deterministic: `now` is
// injected (calling into wall-clock time from a domain function throws), so
// the same inputs always score the same in tests and in the sandbox.
//
// FORMULA — exponential decay with a 60-day half-life:
//
//     frecency = Σ over shared rounds of  2 ^ (-ageDays / 60)
//
// where ageDays is the whole-day gap between the round's date and `now`.
// Each shared round contributes 1.0 the day it's played and halves every 60
// days: ~0.79 at one month, 0.5 at two months, 0.25 at four months, ~0.06 at
// a year. WHY this shape over fixed buckets:
//   - It is smooth — no cliff where a round silently drops from weight 2 to 1
//     as it crosses a bucket edge, so ordering never flips on a day boundary.
//   - It is monotone in both axes the feature cares about: MORE shared rounds
//     always score higher (frequency), and a MORE RECENT round always scores
//     higher than the same round staged later (recency). That gives the
//     intended tie-breaks for free — a weekly regular outranks both a single
//     recent one-off and an old-but-once-frequent partner.
//   - The half-life is a single tunable knob with an obvious meaning.
// A friend you have never shared a round with contributes nothing → score 0.

/** Milliseconds in a day. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Half-life of a single shared round's contribution, in days. */
export const FRECENCY_HALF_LIFE_DAYS = 60;

/** One shared round: the ISO date/timestamp it was played on. */
export interface SharedRound {
    /** The round's `date` (or any parseable ISO date/timestamp). */
    playedAt: string;
}

export interface FrecencyResult {
    /** How many shared rounds were counted. */
    sharedRoundCount: number;
    /** Most recent shared round's `playedAt`, or null when never played. */
    lastPlayedAt: string | null;
    /** Recency-weighted frequency score; 0 when never played. */
    frecency: number;
}

/**
 * Whole days between two instants, floored at 0. A round played later than
 * `now` (clock skew, a date typed in the future) is treated as age 0 rather
 * than a negative age that would inflate the score above 1 per round.
 */
function ageDays(playedAt: string, now: string): number {
    const then = Date.parse(playedAt);
    const nowMs = Date.parse(now);
    if (Number.isNaN(then) || Number.isNaN(nowMs)) return Number.POSITIVE_INFINITY;
    const days = (nowMs - then) / MS_PER_DAY;
    return days > 0 ? days : 0;
}

/**
 * Score one friend's shared-round history. `now` MUST be provided by the
 * caller (the API layer passes `new Date().toISOString()`); this function
 * never reads the clock itself. An empty history scores 0 with a null
 * `lastPlayedAt`.
 */
export function scoreFrecency(rounds: readonly SharedRound[], now: string): FrecencyResult {
    if (rounds.length === 0) {
        return { sharedRoundCount: 0, lastPlayedAt: null, frecency: 0 };
    }

    let frecency = 0;
    let lastPlayedAt: string | null = null;
    let lastMs = Number.NEGATIVE_INFINITY;

    for (const r of rounds) {
        const age = ageDays(r.playedAt, now);
        if (Number.isFinite(age)) {
            frecency += Math.pow(2, -age / FRECENCY_HALF_LIFE_DAYS);
        }
        const ms = Date.parse(r.playedAt);
        if (!Number.isNaN(ms) && ms > lastMs) {
            lastMs = ms;
            lastPlayedAt = r.playedAt;
        }
    }

    return { sharedRoundCount: rounds.length, lastPlayedAt, frecency };
}
