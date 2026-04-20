// Format strategies — one per (scoring mode × team shape) combination.
//
// Designed to compose without conditional branches on either axis:
//
//   1. `FormatStrategy` sees ONE participant at a time and produces that
//      participant's contribution for the slot. It is shape-agnostic — if the
//      strategy is a team shape, the caller is responsible for passing the
//      participant that represents the team (a better-ball pair is one
//      participant with two `participant_players` links; foursomes ditto).
//      Team-shape logic lives in how scorecards feed into the strategy, not
//      in a second level of wrappers.
//
//   2. Each strategy declares its own `ScoringResult` shape. Stroke-play has
//      gross + net totals; stableford has points; match-play emits per-hole
//      status. The leaderboard consumes the generic `ScoringResult` produced
//      by a strategy — it does not inspect strokes or points directly.
//
//   3. Registration is through `registerFormat()`. New formats = new file +
//      one registration call. No schema change, no switch statements outside
//      this module.
//
// §14.6 (results row keyed by `(participant, scoring_type)`): strategies can
// emit multiple `ScoringResult` rows (typically gross + net) — the shape
// declares this per-hole, then the leaderboard aggregates across slots.

import type { FormatSlot } from '../services/round.service';
import type { ScorecardHole } from '../services/scorecard.service';

// --- Public types ---

/** Per-hole scoring output from a strategy. */
export interface HoleResult {
    holeNumber: number;
    gross: number | null; // null = hole not scored (DNP)
    net: number | null;
    /** Stableford points / match-play hole status / skins — strategy-defined. */
    points: number | null;
    /** Free-form annotation for views (e.g. match-play "1UP"). Strategy-defined. */
    note?: string;
}

/** Participant-level rollup produced by a strategy after all holes are seen. */
export interface ParticipantResult {
    participantId: string;
    slotIndex: number;
    holes: HoleResult[];
    /** Totals, one per scoring type. Must include at least 'gross'. */
    totals: { scoringType: string; value: number | null }[];
    /** Holes not scored (null strokes) and pickups (0 strokes). Kept for UIs. */
    holesPlayed: number;
}

/** Minimum participant context a strategy needs — strokes + snapshots for net. */
export interface ParticipantInput {
    participantId: string;
    /** Sparse — holes with no event have no entry. null strokes = DNP; 0 = pickup. */
    holes: ScorecardHole[];
    /** Null if the participant has no frozen playing handicap (stroke-play gross only). */
    playingHandicap: number | null;
    /** Course holes (par + stroke index). Used for net and stableford. */
    courseHoles: CourseHole[];
}

/** Hole metadata the strategy resolves from the course — cached per round. */
export interface CourseHole {
    holeNumber: number;
    par: number;
    strokeIndex: number;
}

/** A format strategy. Scoring mode × team shape = one strategy. */
export interface FormatStrategy {
    readonly scoringMode: string;
    readonly teamShape: string;
    compute(input: ParticipantInput, slot: FormatSlot): ParticipantResult;
}

// --- Registry ---

const registry = new Map<string, FormatStrategy>();

function key(scoringMode: string, teamShape: string): string {
    return `${scoringMode}:${teamShape}`;
}

export function registerFormat(strategy: FormatStrategy): void {
    registry.set(key(strategy.scoringMode, strategy.teamShape), strategy);
}

export function findFormat(scoringMode: string, teamShape: string): FormatStrategy {
    const s = registry.get(key(scoringMode, teamShape));
    if (!s) {
        throw new Error(`no format strategy registered for ${scoringMode} × ${teamShape}`);
    }
    return s;
}

export function clearFormats(): void {
    registry.clear();
}

// --- Stroke-play × individual ---

const strokePlayIndividual: FormatStrategy = {
    scoringMode: 'stroke_play',
    teamShape: 'individual',
    compute(input, slot): ParticipantResult {
        const holes: HoleResult[] = [];
        let grossTotal = 0;
        let netTotal = 0;
        let grossHasValue = false;
        let netHasValue = false;
        let holesPlayed = 0;

        // Net distribution: give strokes on holes in stroke-index order.
        // playing_handicap n means: first `n mod holeCount` holes get an extra
        // stroke; every hole gets `floor(n / holeCount)` strokes baseline.
        const ph = input.playingHandicap ?? 0;
        const holeCount = input.courseHoles.length;
        const baseline = holeCount > 0 ? Math.floor(ph / holeCount) : 0;
        const extras = holeCount > 0 ? ((ph % holeCount) + holeCount) % holeCount : 0;
        const strokeByHole = new Map<number, number>();
        for (const ch of input.courseHoles) {
            const extraFromRank = ch.strokeIndex <= extras ? 1 : 0;
            strokeByHole.set(ch.holeNumber, baseline + extraFromRank);
        }

        for (const ch of input.courseHoles) {
            const played = input.holes.find((h) => h.holeNumber === ch.holeNumber);
            const strokes = played?.strokes ?? null;
            const strokesForHole = strokeByHole.get(ch.holeNumber) ?? 0;
            if (strokes === null) {
                holes.push({ holeNumber: ch.holeNumber, gross: null, net: null, points: null });
                continue;
            }
            holesPlayed++;
            // Pickup (0) in stroke-play = max of net-double (par + 2 + strokes given) per WHS.
            const effectiveGross = strokes === 0 ? ch.par + 2 + strokesForHole : strokes;
            const net = effectiveGross - strokesForHole;
            grossTotal += effectiveGross;
            netTotal += net;
            grossHasValue = true;
            netHasValue = true;
            holes.push({
                holeNumber: ch.holeNumber,
                gross: effectiveGross,
                net,
                points: null,
            });
        }

        void slot;

        return {
            participantId: input.participantId,
            slotIndex: slot.slotIndex,
            holes,
            totals: [
                { scoringType: 'gross', value: grossHasValue ? grossTotal : null },
                {
                    scoringType: 'net',
                    value: netHasValue && input.playingHandicap !== null ? netTotal : null,
                },
            ],
            holesPlayed,
        };
    },
};

registerFormat(strokePlayIndividual);
