// Stroke-play × foursomes (alternate-shot) — 2-player teams share one ball.
//
// Structurally identical to `stroke-play × individual` at the per-hole
// scoring layer: one gross per hole, one net per hole, one total card for
// the team. Traditionally one player tees off on odd holes, the other on
// even, but the strategy doesn't care which player struck which shot — only
// the ball matters.
//
// Per-player PH is irrelevant for foursomes: there is only ONE ball, so
// there's only one strokes-given map. The TEAM's `playingHandicap`
// (`BallInput.playingHandicap`) is the allowance-adjusted team PH —
// traditionally 50% of the sum of both players' course handicaps, but the
// allowance lives on `round_format_slots.allowance_pct` and the snapshotter
// bakes it into `participant.playing_handicap_snapshot`. The strategy
// consumes the snapshot verbatim.
//
// Validation: team shape is `foursomes` and we require exactly 2 player
// links on each participant. Fewer or more → throws with the slot + the
// participant id. After that, delegates entirely to the shared stroke-play
// per-hole scorer — the same helper `stroke-play × individual` uses.
//
// Events on a foursomes round have `sourcePlayerId` / `sourceGuestPlayerId`
// null (same shape as individual). There is no per-player attribution need
// — the team takes one stroke count per hole regardless of who struck the
// ball. Seeds therefore use `play()` with no options (matching the
// individual-format convention).

import type { FormatStrategy, SlotInput, SlotResult } from '../format';
import type { FormatSlot } from '../../services/round.service';
import { scoreOneBall } from './_stroke-play-scoring';

export const strokePlayFoursomes: FormatStrategy = {
    scoringMode: 'stroke_play',
    teamShape: 'foursomes',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        const ballResults = input.balls.map((p) => {
            const links = p.players ?? [];
            if (links.length !== 2) {
                throw new Error(
                    `stroke-play foursomes slot #${slot.slotIndex}: participant ${p.ballId} needs exactly 2 player links (got ${links.length})`,
                );
            }
            return scoreOneBall(p, input.courseHoles, slot);
        });
        return { ballResults };
    },
};
