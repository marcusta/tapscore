// Stroke-play × individual — the canonical reference strategy.
//
// Iterates the slot's participants independently. Gross total = sum of
// recorded strokes (with pickups resolved to WHS net-double: par + 2 +
// strokes given). Net total = gross − strokes given, distributed by stroke
// index on a playing-handicap basis.
//
// Completeness rule: a pickup (0 strokes) or a DNP (null strokes) on any hole
// voids the stroke-play totals — the participant does not have a completed
// card. Per-hole values are still reported so scorecard UI and the
// handicap-posting path can use them; the leaderboard sees null and sorts the
// participant last.
//
// "No event at all" on a hole is mid-round, not incomplete — the player hasn't
// reached that hole yet and their partial total is still valid.
//
// Per-hole arithmetic is factored into `_stroke-play-scoring.ts` so
// `stroke-play-foursomes` can delegate the same math — a team playing one
// alternate-shot ball scores identically at the per-hole level, it just has
// 2 player links on the participant.

import type { FormatStrategy, SlotResult } from '../format';
import { scoreOneBall } from './_stroke-play-scoring';

export const strokePlayIndividual: FormatStrategy = {
    scoringMode: 'stroke_play',
    teamShape: 'individual',
    compute(input, slot): SlotResult {
        const ballResults = input.balls.map((p) =>
            scoreOneBall(p, input.courseHoles, slot),
        );
        return { ballResults };
    },
};
