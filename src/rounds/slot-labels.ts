import type { FormatSlot } from '../api/rounds.gen';
import { FORMATS } from '../formats';

/** Human label for a (scoringMode, teamShape) slot, via the format catalog. */
export function formatLabelFromSlot(slot: FormatSlot): string {
    const ID_BY_MODE_SHAPE: Record<string, string> = {
        'stroke_play individual': 'stroke_play_individual',
        'stableford individual': 'stableford_individual',
        'match_play individual': 'match_play_individual',
        'kopenhamnare individual': 'kopenhamnare_individual',
        'umbrella individual': 'umbrella_individual',
        'stableford better_ball': 'stableford_better_ball',
        'match_play better_ball': 'match_play_better_ball',
        'taliban better_ball': 'taliban_better_ball',
        'umbrella four_ball': 'umbrella_4_ball',
        'stroke_play foursomes': 'stroke_play_foursomes',
    };
    const id = ID_BY_MODE_SHAPE[`${slot.scoringMode} ${slot.teamShape}`];
    return FORMATS.find((f) => f.id === id)?.label ?? `${slot.scoringMode} · ${slot.teamShape}`;
}
