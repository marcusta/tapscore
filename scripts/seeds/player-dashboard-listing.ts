// Phase 2.6d seed — player dashboard listing.
//
// Nia plays TWO rounds: an own-ball stableford and a team-ball (alt-shot
// foursomes) paired with Ola. The dashboard (joined via ball_players.player_id)
// surfaces BOTH — solo and shared-team — each with the per-slot PH and finishing
// position. The verify page renders `dashboardService.forPlayer(Nia)`.

import type { Scenario } from '../scenario';
import { authorRound } from '../seed-authoring';
import { provision, playerId } from '../seed-2.6d-support';
import type { RoundDefinition } from '../../server/domain/round-definition';

export const DASHBOARD_USERNAME = 'nia-dash';

const flat = (n: number): Record<number, number> =>
    Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, n]));

export async function apply(s: Scenario): Promise<void> {
    const { courseId, gul } = await provision(s);
    const nia = await playerId(s, DASHBOARD_USERNAME, 'Nia');
    const ola = await playerId(s, 'ola-dash', 'Ola');
    const pam = await playerId(s, 'pam-dash', 'Pam');

    // Round A — own-ball stableford (Nia solo vs Pam).
    const a = await authorRound(s, {
        courseId,
        playedAt: '2026-06-08',
        roundType: 'full_18',
        producers: [
            { id: 'P-nia', playerRef: { kind: 'player', id: nia }, handicapIndex: 12, gender: 'F', teeId: gul },
            { id: 'P-pam', playerRef: { kind: 'player', id: pam }, handicapIndex: 20, gender: 'F', teeId: gul },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
    } satisfies RoundDefinition);
    await a.play(['P-nia'], flat(4));
    await a.play(['P-pam'], flat(5));

    // Round B — alt-shot foursomes team ball (Nia & Ola).
    const b = await authorRound(s, {
        courseId,
        playedAt: '2026-06-08',
        roundType: 'full_18',
        producers: [
            { id: 'P-nia', playerRef: { kind: 'player', id: nia }, handicapIndex: 12, gender: 'F', teeId: gul },
            { id: 'P-ola', playerRef: { kind: 'player', id: ola }, handicapIndex: 8, gender: 'M', teeId: gul },
        ],
        ballStrategies: [
            {
                id: 'altshot',
                strategyId: 'alt_shot_pair',
                derivationConfig: { type: 'avg' },
                composition: { teams: [{ label: 'Nia & Ola', producerDefIds: ['P-nia', 'P-ola'] }] },
            },
        ],
        slots: [{ id: 'slot-0', formatId: 'stroke_play_foursomes', allowanceConfig: { type: 'flat', pct: 100 } }],
    } satisfies RoundDefinition);
    await b.play(['P-nia', 'P-ola'], flat(5));
}
