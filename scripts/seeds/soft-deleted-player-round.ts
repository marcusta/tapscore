// Phase 2.6d seed — soft-deleted producer in a historical round.
//
// Ivy plays a stableford round, then later deletes her account (soft-delete).
// The historical scorecard still renders her PLAYED-AS name from
// `ball_players.display_name_snapshot` — never "Deleted player" — and she drops
// out of dashboards/active lists. Jon is unaffected.

import type { Scenario } from '../scenario';
import { authorRound } from '../seed-authoring';
import { provision, playerId } from '../seed-2.6d-support';
import type { RoundDefinition } from '../../server/domain/round-definition';

const flat = (n: number): Record<number, number> =>
    Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, n]));

export async function apply(s: Scenario): Promise<void> {
    const { courseId, gul } = await provision(s);
    const ivy = await playerId(s, 'ivy-deleted', 'Ivy');
    const jon = await playerId(s, 'jon-deleted', 'Jon');

    const definition: RoundDefinition = {
        courseId,
        playedAt: '2026-06-06',
        roundType: 'full_18',
        producers: [
            { id: 'P-ivy', playerRef: { kind: 'player', id: ivy }, handicapIndex: 14, gender: 'F', teeId: gul },
            { id: 'P-jon', playerRef: { kind: 'player', id: jon }, handicapIndex: 11, gender: 'M', teeId: gul },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
    };

    const authored = await authorRound(s, definition);
    await authored.play(['P-ivy'], flat(4));
    await authored.play(['P-jon'], flat(5));

    // Ivy deletes her account after the round.
    await s.services.playerService.softDelete(ivy);
}
