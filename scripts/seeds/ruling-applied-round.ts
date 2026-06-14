// Phase 2.6d seed — ruling_event (post-play penalty strokes).
//
// A stroke-play round. After play, Gus signs for a wrong (lower) score and the
// committee adds +2 penalty strokes to his TOTAL. The ruling is read at the
// scoring layer — NO re-derivation: the per-hole grid keeps the raw strokes; the
// leaderboard total carries the +2. Hal is untouched.

import type { Scenario } from '../scenario';
import { authorRound } from '../seed-authoring';
import { provision, playerId } from '../seed-2.6d-support';
import type { RoundDefinition } from '../../server/domain/round-definition';

const flat = (n: number): Record<number, number> =>
    Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, n]));

export async function apply(s: Scenario): Promise<void> {
    const { courseId, gul } = await provision(s);
    const gus = await playerId(s, 'gus-ruling', 'Gus');
    const hal = await playerId(s, 'hal-ruling', 'Hal');

    const definition: RoundDefinition = {
        courseId,
        playedAt: '2026-06-04',
        roundType: 'full_18',
        producers: [
            { id: 'P-gus', playerRef: { kind: 'player', id: gus }, handicapIndex: 12, gender: 'M', teeId: gul },
            { id: 'P-hal', playerRef: { kind: 'player', id: hal }, handicapIndex: 6, gender: 'M', teeId: gul },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stroke_play_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
    };

    const authored = await authorRound(s, definition);
    await authored.play(['P-gus'], flat(5)); // raw gross 90
    await authored.play(['P-hal'], flat(4)); // raw gross 72

    const gusBall = authored.ballFor(['P-gus']);
    await s.services.correctionService.applyRuling({
        roundId: authored.round.id,
        target: 'ball_total',
        targetId: gusBall,
        rulingKind: 'penalty_strokes',
        value: { strokes: 2 },
        reason: 'Two-stroke penalty: signed for a wrong score on the 14th',
        clientEventId: s.nextClientEventId(),
    });
}
