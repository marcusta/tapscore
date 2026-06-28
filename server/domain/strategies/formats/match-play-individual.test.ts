import { describe, expect, test } from 'bun:test';

import {
    make18Holes,
    makeOwnBall,
    makeProducer,
    makeRoundContext,
    makeScoreEvent,
} from './_testkit';
import { BUILTIN_FORMAT_PLUGINS } from '../../formats/builtins';
import { matchPlayPresenter } from './match-play.presenter';
import { MATCH_PLAY_INDIVIDUAL_ID, matchPlayIndividual } from './match-play-individual';

const presenter = matchPlayPresenter();

describe('matchPlayIndividual (new contract)', () => {
    test('result view emits the compact match grid component id', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const result = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB],
            events: [
                makeScoreEvent(bA.ballId, 1, 4),
                makeScoreEvent(bB.ballId, 1, 5),
            ],
        });

        const view = presenter({
            slotIndex: 0,
            slotDefId: 'slot-match',
            formatId: MATCH_PLAY_INDIVIDUAL_ID,
            formatLabel: 'Match play',
            scoringMode: 'match_play',
            teamShape: 'individual',
            allowanceLabel: '100%',
            metrics: [],
            runningNormalized: false,
            scoreGridComponentId: BUILTIN_FORMAT_PLUGINS.find((p) => p.descriptor.id === MATCH_PLAY_INDIVIDUAL_ID)!
                .descriptor.resultDisplay?.scoreGridComponentId,
            result,
            slotBalls: [bA, bB],
            slotTeamGroupings: [],
            columns: ctx.playHoles.map((p) => ({
                playHoleId: p.playHoleId,
                courseHoleNumber: p.courseHoleNumber,
                canonicalOrdinal: p.ordinal,
                occurrenceLabel: ctx.occurrenceLabel(p.playHoleId),
                par: p.par,
                baseStrokeIndex: p.baseStrokeIndex,
            })),
        });

        expect(view.cards[0]?.componentId).toBe('compact-match-grid');
    });

    test('halved match: scratch vs scratch, all pars → AS', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const events = courseHoles.flatMap((h) => [
            makeScoreEvent(bA.ballId, h.holeNumber, 4),
            makeScoreEvent(bB.ballId, h.holeNumber, 4),
        ]);
        const { pairResults } = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB],
            events,
        });
        expect(pairResults).toHaveLength(1);
        expect(pairResults![0].summary).toBe('AS');
        expect(pairResults![0].result).toBe('halved');
        expect(pairResults![0].winner).toBeNull();
    });

    test('early closeout: A wins holes 1..10 → 10&8 after hole 10', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const events = courseHoles.flatMap((h) => [
            makeScoreEvent(bA.ballId, h.holeNumber, 4),
            makeScoreEvent(bB.ballId, h.holeNumber, 5),
        ]);
        const { pairResults } = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB],
            events,
        });
        expect(pairResults![0].summary).toBe('10 & 8');
        expect(pairResults![0].result).toBe('won');
        expect(pairResults![0].winner).toBe(bA.ballId);
    });

    test('match-play handicap differential: PH 2 vs PH 14 → 0 vs 12 effective', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 2 }),
            makeProducer('P2', { courseHandicap: 14 }),
        ]);
        // Both make par everywhere. B gets strokes on SI 1..12 (baseline 0, extras 12).
        // With strokes, B wins SI1..12, halves SI13..18. leadA = 0 − 12 = −12. Closeout when |lead|>remaining: after hole 12 lead=−12, remaining=6 → closeout.
        const bA = makeOwnBall('P1', 2, 2);
        const bB = makeOwnBall('P2', 14, 14);
        const events = courseHoles.flatMap((h) => [
            makeScoreEvent(bA.ballId, h.holeNumber, 4),
            makeScoreEvent(bB.ballId, h.holeNumber, 4),
        ]);
        const { pairResults } = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB],
            events,
        });
        expect(pairResults![0].result).toBe('lost');
        expect(pairResults![0].winner).toBe(bB.ballId);
        // At hole 7: B up 7, remaining 11. Not closeout. Keep going... B wins holes 1..7 (+1 each), SI 1..7 all give stroke. After hole 7 lead=-7, remaining=11, no closeout. After hole 9 lead=-9, rem=9, dormie for B. Continue: hole 10-12 B still wins. At hole 10 lead=-10, rem=8 → closeout.
        expect(pairResults![0].summary).toBe('10 & 8');
    });

    test('pickup: side produces null net; hole stays undecided (legacy semantics)', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const events = [
            makeScoreEvent(bA.ballId, 1, 0),
            makeScoreEvent(bB.ballId, 1, 5),
        ];
        const { pairResults } = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB],
            events,
        });
        const h1 = pairResults![0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.status).toBeNull();
        expect(h1.fromA).toBeNull();
        expect(h1.fromB).toBe(5);
    });

    test('odd singleton: 3 balls → 1 pair + 1 stranded', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 0 }),
        ]);
        const bA = makeOwnBall('P1', 0, 0);
        const bB = makeOwnBall('P2', 0, 0);
        const bC = makeOwnBall('P3', 0, 0);
        const result = matchPlayIndividual.score({
            roundContext: ctx,
            slotBalls: [bA, bB, bC],
            events: [],
        });
        expect(result.pairResults).toHaveLength(1);
        expect(result.ballResults).toHaveLength(3);
        const stranded = result.ballResults.find((r) => r.ballId === bC.ballId)!;
        expect(stranded.holes.every((h) => h.note === 'no opponent')).toBe(true);

        // The presenter builds cards by iterating pairs, so the stranded ball
        // gets NO card — only the single pair card exists.
        const view = presenter({
            slotIndex: 0,
            slotDefId: 'slot-match',
            formatId: MATCH_PLAY_INDIVIDUAL_ID,
            formatLabel: 'Match play',
            scoringMode: 'match_play',
            teamShape: 'individual',
            allowanceLabel: '100%',
            metrics: [],
            runningNormalized: false,
            scoreGridComponentId: 'compact-match-grid',
            result,
            slotBalls: [bA, bB, bC],
            slotTeamGroupings: [],
            columns: ctx.playHoles.map((p) => ({
                playHoleId: p.playHoleId,
                courseHoleNumber: p.courseHoleNumber,
                canonicalOrdinal: p.ordinal,
                occurrenceLabel: ctx.occurrenceLabel(p.playHoleId),
                par: p.par,
                baseStrokeIndex: p.baseStrokeIndex,
            })),
        });
        expect(view.cards).toHaveLength(1);
        expect(view.cards[0]?.subjectBallIds).toEqual([bA.ballId, bB.ballId]);
        // Leaderboard panel also omits the stranded ball.
        const summary = view.leaderboard.find((s) => s.kind === 'match_summary');
        expect(summary?.matches).toHaveLength(1);
    });
});
