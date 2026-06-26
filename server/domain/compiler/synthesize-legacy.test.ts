import { describe, expect, test } from 'bun:test';

import { synthesizeRoundDefinition, type LegacyRoundInput } from './synthesize-legacy';

const baseInput = (): LegacyRoundInput => ({
    roundId: 'r1',
    courseId: 'c1',
    playedAt: '2026-01-01',
    participants: [],
    participantPlayers: [],
    formatSlots: [],
    handicapFallback: () => null,
});

describe('synthesizeRoundDefinition', () => {
    test('individual stableford: one producer per player, own_ball strategy', () => {
        const input: LegacyRoundInput = {
            ...baseInput(),
            participants: ['pa', 'pb'].map((id) => ({
                id,
                teamLabel: null,
                teeIdSnapshot: 'tee-y',
                handicapIndexSnapshot: 10,
                categorySnapshot: null,
            })),
            participantPlayers: [
                { id: 'pp-a', participantId: 'pa', playerId: 'player-a', guestPlayerId: null, handicapIndexSnapshot: 10 },
                { id: 'pp-b', participantId: 'pb', playerId: 'player-b', guestPlayerId: null, handicapIndexSnapshot: 12 },
            ],
            formatSlots: [
                { slotIndex: 0, scoringMode: 'stableford', teamShape: 'individual', allowancePct: 95, scopeConfig: null },
            ],
        };
        const { definition, diagnostics } = synthesizeRoundDefinition(input);
        expect(diagnostics).toHaveLength(0);
        expect(definition.producers).toHaveLength(2);
        expect(definition.ballStrategies).toHaveLength(1);
        expect(definition.ballStrategies[0].strategyId).toBe('own_ball_per_player');
        expect(definition.slots[0].formatId).toBe('stableford_individual');
        expect(definition.slots[0].allowanceConfig).toEqual({ type: 'flat', pct: 95 });
        expect(definition.slots[0].teamGrouping).toBeUndefined();
    });

    test('better-ball: own_ball + slot.teamGrouping', () => {
        const input: LegacyRoundInput = {
            ...baseInput(),
            participants: [
                { id: 'team-a', teamLabel: 'A', teeIdSnapshot: 'tee-y', handicapIndexSnapshot: 10, categorySnapshot: null },
                { id: 'team-b', teamLabel: 'B', teeIdSnapshot: 'tee-y', handicapIndexSnapshot: 10, categorySnapshot: null },
            ],
            participantPlayers: [
                { id: 'pp-1', participantId: 'team-a', playerId: 'p1', guestPlayerId: null, handicapIndexSnapshot: 10 },
                { id: 'pp-2', participantId: 'team-a', playerId: 'p2', guestPlayerId: null, handicapIndexSnapshot: 12 },
                { id: 'pp-3', participantId: 'team-b', playerId: 'p3', guestPlayerId: null, handicapIndexSnapshot: 14 },
                { id: 'pp-4', participantId: 'team-b', playerId: 'p4', guestPlayerId: null, handicapIndexSnapshot: 16 },
            ],
            formatSlots: [
                { slotIndex: 0, scoringMode: 'stableford', teamShape: 'better_ball', allowancePct: 100, scopeConfig: null },
            ],
        };
        const { definition, diagnostics } = synthesizeRoundDefinition(input);
        expect(diagnostics).toHaveLength(0);
        expect(definition.ballStrategies).toHaveLength(1);
        expect(definition.ballStrategies[0].strategyId).toBe('own_ball_per_player');
        expect(definition.slots[0].teamGrouping?.teams).toHaveLength(2);
        expect(definition.slots[0].teamGrouping?.teams[0].producerDefIds).toHaveLength(2);
    });

    test('scope_config.config flows to formatConfig', () => {
        const input: LegacyRoundInput = {
            ...baseInput(),
            participants: ['pa', 'pb', 'pc'].map((id) => ({
                id,
                teamLabel: null,
                teeIdSnapshot: 'tee-y',
                handicapIndexSnapshot: 10,
                categorySnapshot: null,
            })),
            participantPlayers: ['a', 'b', 'c'].map((x, i) => ({
                id: `pp-${x}`,
                participantId: ['pa', 'pb', 'pc'][i],
                playerId: `player-${x}`,
                guestPlayerId: null,
                handicapIndexSnapshot: 10,
            })),
            formatSlots: [
                {
                    slotIndex: 0,
                    scoringMode: 'kopenhamnare',
                    teamShape: 'individual',
                    allowancePct: 100,
                    scopeConfig: { config: { handicapMode: 'delta_from_min' } },
                },
            ],
        };
        const { definition, diagnostics } = synthesizeRoundDefinition(input);
        expect(diagnostics).toHaveLength(0);
        expect(definition.slots[0].formatConfig).toEqual({ handicapMode: 'delta_from_min' });
    });

    test('multi-slot with scope: each slot filters producers', () => {
        const input: LegacyRoundInput = {
            ...baseInput(),
            participants: [
                { id: 'p-alice', teamLabel: null, teeIdSnapshot: 'tee-y', handicapIndexSnapshot: 10, categorySnapshot: null },
                { id: 'p-bob', teamLabel: null, teeIdSnapshot: 'tee-y', handicapIndexSnapshot: 10, categorySnapshot: null },
                { id: 'team-cd', teamLabel: 'C&D', teeIdSnapshot: 'tee-y', handicapIndexSnapshot: 10, categorySnapshot: null },
            ],
            participantPlayers: [
                { id: 'pp-alice', participantId: 'p-alice', playerId: 'alice', guestPlayerId: null, handicapIndexSnapshot: 10 },
                { id: 'pp-bob', participantId: 'p-bob', playerId: 'bob', guestPlayerId: null, handicapIndexSnapshot: 12 },
                { id: 'pp-c', participantId: 'team-cd', playerId: 'carol', guestPlayerId: null, handicapIndexSnapshot: 14 },
                { id: 'pp-d', participantId: 'team-cd', playerId: 'dan', guestPlayerId: null, handicapIndexSnapshot: 16 },
            ],
            formatSlots: [
                {
                    slotIndex: 0,
                    scoringMode: 'stableford',
                    teamShape: 'individual',
                    allowancePct: 95,
                    scopeConfig: { scope: { participantIds: ['p-alice', 'p-bob'] } },
                },
                {
                    slotIndex: 1,
                    scoringMode: 'stroke_play',
                    teamShape: 'individual',
                    allowancePct: 50,
                    scopeConfig: { scope: { participantIds: ['team-cd'] } },
                },
            ],
        };
        const { definition, diagnostics } = synthesizeRoundDefinition(input);
        expect(diagnostics).toHaveLength(0);
        expect(definition.slots).toHaveLength(2);
        const slot0 = definition.slots[0];
        expect(slot0.ballSelector?.producerDefIds).toEqual(['pp-alice', 'pp-bob']);
        // Every legacy slot now scores own balls (foursomes path removed); the
        // second slot filters to the C&D participant's two producers.
        const slot1 = definition.slots[1];
        expect(slot1.ballSelector?.producerDefIds).toEqual(['pp-c', 'pp-d']);
    });

    test('handicap fallback used when snapshot is null', () => {
        const input: LegacyRoundInput = {
            ...baseInput(),
            participants: [
                { id: 'pa', teamLabel: null, teeIdSnapshot: 'tee-y', handicapIndexSnapshot: null, categorySnapshot: null },
            ],
            participantPlayers: [
                { id: 'pp', participantId: 'pa', playerId: 'player-a', guestPlayerId: null, handicapIndexSnapshot: null },
            ],
            formatSlots: [
                { slotIndex: 0, scoringMode: 'stableford', teamShape: 'individual', allowancePct: 100, scopeConfig: null },
            ],
            handicapFallback: () => 7.5,
        };
        const { definition, diagnostics } = synthesizeRoundDefinition(input);
        expect(diagnostics).toHaveLength(0);
        expect(definition.producers[0].handicapIndex).toBe(7.5);
    });
});
