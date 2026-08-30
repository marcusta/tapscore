// One paragraph per capture prompt, for the "What these mean" sheet on the
// stats step.
//
// Split out of `stat-prompts.ts` because it is COPY, not rule: the prompt model
// decides what is asked, this decides how it is explained, and the two change
// for different reasons. Like its sibling it has ZERO imports beyond the key
// union, so `ios/TapScore/Domain/StatExplainers.swift` is a line-for-line port
// and `tests/round/stat-explainers.test.ts` is the spec both are written
// against.
//
// House ruling: the cards on the capture step stay wordless. Explanation lives
// behind one worded trigger, never as always-visible paragraphs and never as a
// glyph per row.

import type { StatEventKey } from './stat-prompts';

/**
 * Pinned copy. Written for a golfer standing on the next tee: what counts,
 * what does not, and one sentence of edge case. No jargon, no strokes-gained
 * vocabulary, no instruction to be diligent.
 */
export const STAT_EXPLAINERS: Record<StatEventKey, string> = {
    tee_result:
        'Fairway means the ball finished on the short grass. In play is anywhere you can still play a normal shot. Trouble is anywhere you have to recover from: deep rough, trees, sand, a lost ball.',
    tee_miss_dir:
        'Which side the ball finished, looking down the hole from the tee. Only asked when the drive left the fairway. Over a few rounds this is what separates a one-way miss from a two-way one.',
    recovery_ok:
        'Did the very next shot get you back to a normal position: fairway, green, or a clear approach? Say yes even if the hole still ended badly. This is about the recovery shot, not the score.',
    gir: 'Hit means the ball was on the putting surface with at least two shots left for par: the first shot on a par 3, the second on a par 4, the third on a par 5. The fringe is a miss.',
    green_miss_dir:
        'Which way you missed, seen from where you played the approach. Long is past the flag, short is in front of it. Left and right are exactly that. On green means the ball reached the green, just one shot too late to count as hit.',
    short_game_difficulty:
        'Standard is a clean lie with green to work with. Hard is anything that takes the shot away from you: long grass, short-sided, downhill, an awkward stance. Bunker is sand, whatever the lie.',
    short_game_strokes:
        'How many shots it took to get from off the green onto it. One is the normal answer and is already filled in — only change it if you needed more.',
    first_putt:
        'How far the first putt was, in metres. If you holed out from off the green there was no first putt, so leave this alone and set putts to 0.',
    first_putt_m:
        'The exact distance, if you want it. Pick the closest number inside the range you chose above. Optional — the range alone is a full answer.',
    putts: 'Putts taken on the green, counting the one that went in. 0 means you were never on the green with a putter.',
    penalties:
        'Penalty strokes added on this hole: out of bounds, a lost ball, an unplayable lie, water. Count strokes, not incidents.',
    penalty_source:
        'Which shot cost you the stroke. If a hole cost you more than one, pick the shot that did the most damage.',
};

export function statExplainer(key: StatEventKey): string {
    return STAT_EXPLAINERS[key];
}

/**
 * The rest of the capture step's dynamic words: the explainer sheet's chrome,
 * and the derived-GIR lines of §3.4b.
 *
 * These live here rather than in `stats-panel-blocks.ts`'s `STATS_COPY` on
 * purpose — the score-entry component must not import the statistics bundle to
 * read three sentences, and this module is already the capture-side copy table
 * both platforms port.
 */
export const STAT_CAPTURE_COPY = {
    explainerTrigger: 'What these mean',
    explainerTitle: 'What these mean',
    girPending: 'Will be filled in from your score when you close this.',
    girDisagreeMiss: 'Your score says this green was missed. Tap to change it, or leave it.',
    girDisagreeHit: 'Your score says this green was hit. Tap to change it, or leave it.',
    girPendingAria: 'Green in regulation, not answered, will be filled in from your score',
} as const;
