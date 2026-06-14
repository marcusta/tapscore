// Phase 2.6d seed — the STATEFUL format-action canary.
//
// A test-only registered format (`stateful_canary`) proving the generic
// format-action seam: rotating captain + per-hole partner + an ordered in-hole
// call, persisted through the ONE generic endpoint, replayed deterministically,
// CORRECTED by supersession, and scored — with no infrastructure edits.
//
// Hole 1: captain Kim, partner Lo → SUPERSEDED to Mai, call 'low'.
// Hole 2: captain Lo, partner Mai, call 'low' then 'high' (last by sequence binds).

import type { Scenario } from '../scenario';
import { authorRound } from '../seed-authoring';
import { provision, playerId } from '../seed-2.6d-support';
import {
    registerStatefulCanary,
    STATEFUL_CANARY_FORMAT_ID,
} from '../../server/domain/formats/_stateful_canary.testkit';
import type { RoundDefinition } from '../../server/domain/round-definition';

export async function apply(s: Scenario): Promise<void> {
    registerStatefulCanary();
    const { courseId, gul } = await provision(s);
    const kim = await playerId(s, 'kim-canary', 'Kim');
    const lo = await playerId(s, 'lo-canary', 'Lo');
    const mai = await playerId(s, 'mai-canary', 'Mai');

    const definition: RoundDefinition = {
        courseId,
        playedAt: '2026-06-07',
        roundType: 'full_18',
        producers: [
            { id: 'P1', playerRef: { kind: 'player', id: kim }, handicapIndex: 10, gender: 'M', teeId: gul },
            { id: 'P2', playerRef: { kind: 'player', id: lo }, handicapIndex: 10, gender: 'M', teeId: gul },
            { id: 'P3', playerRef: { kind: 'player', id: mai }, handicapIndex: 10, gender: 'M', teeId: gul },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: STATEFUL_CANARY_FORMAT_ID, allowanceConfig: { type: 'flat', pct: 100 } }],
    };

    const authored = await authorRound(s, definition);
    // Hole 1: Kim 4, Lo 5, Mai 3.  Hole 2: all 4.  (par 4 → 2×par = 8)
    await authored.play(['P1'], { 1: 4, 2: 4 });
    await authored.play(['P2'], { 1: 5, 2: 4 });
    await authored.play(['P3'], { 1: 3, 2: 4 });

    const roundId = authored.round.id;
    const h1 = authored.round.playHoles[0].id;
    const h2 = authored.round.playHoles[1].id;
    const fa = s.services.formatActionService;

    // --- Hole 1: captain Kim, partner Lo → superseded to Mai, call low. ---
    await fa.append({ roundId, slotDefId: 'slot-0', playHoleId: h1, sequence: 0, actionType: 'set_captain', payload: { producerDefId: 'P1' }, clientEventId: s.nextClientEventId() });
    const wrongPartner = await fa.append({ roundId, slotDefId: 'slot-0', playHoleId: h1, sequence: 1, actionType: 'choose_partner', payload: { producerDefId: 'P2' }, clientEventId: s.nextClientEventId() });
    if (!wrongPartner.ok) throw new Error('canary seed: partner append failed');
    await fa.append({ roundId, slotDefId: 'slot-0', playHoleId: h1, sequence: 1, actionType: 'choose_partner', payload: { producerDefId: 'P3' }, supersedesActionId: wrongPartner.id, clientEventId: s.nextClientEventId() });
    await fa.append({ roundId, slotDefId: 'slot-0', playHoleId: h1, sequence: 2, actionType: 'call_it', payload: { call: 'low' }, clientEventId: s.nextClientEventId() });

    // --- Hole 2: captain Lo, partner Mai, ordered call low then high. ---
    await fa.append({ roundId, slotDefId: 'slot-0', playHoleId: h2, sequence: 0, actionType: 'set_captain', payload: { producerDefId: 'P2' }, clientEventId: s.nextClientEventId() });
    await fa.append({ roundId, slotDefId: 'slot-0', playHoleId: h2, sequence: 1, actionType: 'choose_partner', payload: { producerDefId: 'P3' }, clientEventId: s.nextClientEventId() });
    await fa.append({ roundId, slotDefId: 'slot-0', playHoleId: h2, sequence: 2, actionType: 'call_it', payload: { call: 'low' }, clientEventId: s.nextClientEventId() });
    await fa.append({ roundId, slotDefId: 'slot-0', playHoleId: h2, sequence: 3, actionType: 'call_it', payload: { call: 'high' }, clientEventId: s.nextClientEventId() });
}
