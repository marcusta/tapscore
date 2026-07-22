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
import { TALIBAN_BETTER_BALL_ID, talibanBetterBall } from './taliban-better-ball';

const presenter = matchPlayPresenter();

function setup() {
    const courseHoles = make18Holes();
    const ctx = makeRoundContext(courseHoles, [
        makeProducer('P1', { courseHandicap: 0 }),
        makeProducer('P2', { courseHandicap: 0 }),
        makeProducer('P3', { courseHandicap: 0 }),
        makeProducer('P4', { courseHandicap: 0 }),
    ]);
    const bA1 = makeOwnBall('P1', 0, 0);
    const bA2 = makeOwnBall('P2', 0, 0);
    const bB1 = makeOwnBall('P3', 0, 0);
    const bB2 = makeOwnBall('P4', 0, 0);
    return {
        courseHoles,
        ctx,
        balls: [bA1, bA2, bB1, bB2],
        groupings: [
            { teamLabel: 'A', ballIds: [bA1.ballId, bA2.ballId] },
            { teamLabel: 'B', ballIds: [bB1.ballId, bB2.ballId] },
        ],
    };
}

describe('talibanBetterBall (new contract)', () => {
    test('result view emits the compact match grid component id', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        const result = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events: [
                makeScoreEvent(bA1.ballId, 1, 4),
                makeScoreEvent(bA2.ballId, 1, 4),
                makeScoreEvent(bB1.ballId, 1, 5),
                makeScoreEvent(bB2.ballId, 1, 5),
            ],
        });

        const view = presenter({
            slotIndex: 0,
            slotDefId: 'slot-taliban',
            formatId: TALIBAN_BETTER_BALL_ID,
            formatLabel: 'Taliban',
            scoringMode: 'taliban',
            teamShape: 'better_ball',
            allowanceLabel: '90%',
            metrics: [],
            runningNormalized: false,
            scoreGridComponentId: BUILTIN_FORMAT_PLUGINS.find((p) => p.descriptor.id === TALIBAN_BETTER_BALL_ID)!
                .descriptor.resultDisplay?.scoreGridComponentId,
            result,
            slotBalls: balls,
            slotTeamGroupings: groupings,
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
        // Better-ball pairing: ONE titleless card whose subjects are all four
        // balls, with one net row per member per side (2 + 2) framed by Par/Standing.
        expect(view.cards).toHaveLength(1);
        expect(view.cards[0]?.title).toEqual({ groups: [], joiner: '' });
        expect(view.cards[0]?.subjectBallIds).toEqual([bA1.ballId, bA2.ballId, bB1.ballId, bB2.ballId]);
        expect(view.cards[0]?.subtitleFacts).toEqual(['Taliban · 90%']);
        expect(view.cards[0]?.totals).toEqual([]);
        expect(view.cards[0]?.rows.map((row) => row.label)).toEqual(['Par', '', '', '', '', 'Standing']);
        // A single match-summary leaderboard section, sides resolved to members.
        expect(view.leaderboard).toHaveLength(1);
        const summary = view.leaderboard[0];
        expect(summary?.kind).toBe('match_summary');
        if (summary?.kind === 'match_summary') {
            expect(summary.matches).toHaveLength(1);
            expect(summary.matches[0]).toMatchObject({
                sideA: { ballIds: [bA1.ballId, bA2.ballId] },
                sideB: { ballIds: [bB1.ballId, bB2.ballId] },
                leader: 'a',
                finished: false,
                thru: 1,
            });
        }
    });

    test('worse-ball tiebreaker: tied better-balls → worse-ball decides', () => {
        const { ctx, balls, groupings, courseHoles } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: A = {4,5} better 4 worse 5; B = {4,6} better 4 worse 6 → A wins worse-ball.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 5),
            makeScoreEvent(bB1.ballId, 1, 4),
            makeScoreEvent(bB2.ballId, 1, 6),
            ...courseHoles.slice(1).flatMap((h) => [
                makeScoreEvent(bA1.ballId, h.holeNumber, 4),
                makeScoreEvent(bA2.ballId, h.holeNumber, 4),
                makeScoreEvent(bB1.ballId, h.holeNumber, 4),
                makeScoreEvent(bB2.ballId, h.holeNumber, 4),
            ]),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h1 = pairResults![0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.status).toBe('won');
        expect(h1.note).toContain('worse-ball');
        expect(h1.pointsDelta).toBe(1);
        // The worse ball decided it — the presenter highlights that cell.
        expect(h1.decidingBallId).toBe(bA2.ballId);
    });

    test('down-team eagle: team B down 1 makes eagle → +5', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: A wins normally (4 vs 5) → A +1, B down 1.
        // Hole 2: B scores eagle 2 (par 4) → B wins with gross eagle while down → +5.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 5),
            makeScoreEvent(bB2.ballId, 1, 5),
            makeScoreEvent(bA1.ballId, 2, 4),
            makeScoreEvent(bA2.ballId, 2, 4),
            makeScoreEvent(bB1.ballId, 2, 2),
            makeScoreEvent(bB2.ballId, 2, 4),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h2 = pairResults![0].holes.find((h) => h.holeNumber === 2)!;
        expect(h2.status).toBe('lost');
        expect(h2.pointsDelta).toBe(-5);
        expect(h2.note).toContain('down-team eagle');
    });

    test('birdie while level → +1 (the comeback bonus applies only when behind)', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: all square entering. A makes birdie 3 and wins → +1 (level, no bonus).
        const events = [
            makeScoreEvent(bA1.ballId, 1, 3),
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 4),
            makeScoreEvent(bB2.ballId, 1, 5),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h1 = pairResults![0].holes.find((h) => h.holeNumber === 1)!;
        expect(h1.status).toBe('won');
        expect(h1.pointsDelta).toBe(1);
    });

    test('down-team birdie → +2', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: A wins normally (4 vs 5) → A +1, B down 1.
        // Hole 2: B (down 1) makes birdie 3 and wins → +2.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 5),
            makeScoreEvent(bB2.ballId, 1, 5),
            makeScoreEvent(bA1.ballId, 2, 4),
            makeScoreEvent(bA2.ballId, 2, 4),
            makeScoreEvent(bB1.ballId, 2, 3),
            makeScoreEvent(bB2.ballId, 2, 4),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h2 = pairResults![0].holes.find((h) => h.holeNumber === 2)!;
        expect(h2.status).toBe('lost'); // B won the hole → A's perspective is "lost"
        expect(h2.pointsDelta).toBe(-2);
        expect(h2.note).toContain('down-team birdie');
    });

    test('matched birdie voids the down-team bonus → +1', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: A wins (4 vs 5) → B down 1.
        // Hole 2: B1 birdies 3, but A1 ALSO birdies 3 — better balls tie, B wins
        // on worse-ball (B2 4 vs A2 5). The birdie is not solo → no bonus.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 5),
            makeScoreEvent(bB2.ballId, 1, 5),
            makeScoreEvent(bA1.ballId, 2, 3),
            makeScoreEvent(bA2.ballId, 2, 5),
            makeScoreEvent(bB1.ballId, 2, 3),
            makeScoreEvent(bB2.ballId, 2, 4),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h2 = pairResults![0].holes.find((h) => h.holeNumber === 2)!;
        expect(h2.status).toBe('lost'); // B won the hole
        expect(h2.pointsDelta).toBe(-1);
        expect(h2.note).toContain('bonus void');
    });

    test('down-team eagle stands over an opposing birdie → +5 (solo at its own level)', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: A wins → B down 1.
        // Hole 2: B1 eagles 2; A1 birdies 3. No opposing eagle → the eagle is
        // solo at its own level, the opposing birdie does not void it.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 5),
            makeScoreEvent(bB2.ballId, 1, 5),
            makeScoreEvent(bA1.ballId, 2, 3),
            makeScoreEvent(bA2.ballId, 2, 4),
            makeScoreEvent(bB1.ballId, 2, 2),
            makeScoreEvent(bB2.ballId, 2, 4),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h2 = pairResults![0].holes.find((h) => h.holeNumber === 2)!;
        expect(h2.status).toBe('lost');
        expect(h2.pointsDelta).toBe(-5);
        expect(h2.note).toContain('down-team eagle');
    });

    test('matched eagle voids the eagle bonus (and the birdie tier) → +1', () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: A wins → B down 1.
        // Hole 2: both sides eagle 2; B wins on worse-ball. Nothing is solo at
        // any level (an eagle is also birdie-or-better) → plain +1.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 5),
            makeScoreEvent(bB2.ballId, 1, 5),
            makeScoreEvent(bA1.ballId, 2, 2),
            makeScoreEvent(bA2.ballId, 2, 5),
            makeScoreEvent(bB1.ballId, 2, 2),
            makeScoreEvent(bB2.ballId, 2, 4),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h2 = pairResults![0].holes.find((h) => h.holeNumber === 2)!;
        expect(h2.status).toBe('lost');
        expect(h2.pointsDelta).toBe(-1);
        expect(h2.note).toContain('bonus void');
    });

    test("teammate's matching birdie does NOT void the bonus → +2", () => {
        const { ctx, balls, groupings } = setup();
        const [bA1, bA2, bB1, bB2] = balls;
        // Hole 1: A wins → B down 1.
        // Hole 2: BOTH B members birdie 3; A makes 4/4. The feat is unmatched
        // by the opposition — two teammate birdies still earn the bonus.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 4),
            makeScoreEvent(bA2.ballId, 1, 4),
            makeScoreEvent(bB1.ballId, 1, 5),
            makeScoreEvent(bB2.ballId, 1, 5),
            makeScoreEvent(bA1.ballId, 2, 4),
            makeScoreEvent(bA2.ballId, 2, 4),
            makeScoreEvent(bB1.ballId, 2, 3),
            makeScoreEvent(bB2.ballId, 2, 3),
        ];
        const { pairResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const h2 = pairResults![0].holes.find((h) => h.holeNumber === 2)!;
        expect(h2.pointsDelta).toBe(-2);
        expect(h2.note).toContain('down-team birdie');
    });

    test("bonusRule 'net': a net birdie (gross par, with a stroke) earns the bonus", () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 18 }),
            makeProducer('P4', { courseHandicap: 0 }),
        ]);
        // P3 plays with 18 strokes → one per hole; net = gross − 1 everywhere.
        const bA1 = makeOwnBall('P1', 0, 0);
        const bA2 = makeOwnBall('P2', 0, 0);
        const bB1 = makeOwnBall('P3', 18, 18);
        const bB2 = makeOwnBall('P4', 0, 0);
        const balls = [bA1, bA2, bB1, bB2];
        const groupings = [
            { teamLabel: 'A', ballIds: [bA1.ballId, bA2.ballId] },
            { teamLabel: 'B', ballIds: [bB1.ballId, bB2.ballId] },
        ];
        // Hole 1: A 3/3 (net 3) vs B1 gross 5 net 4, B2 5 → A wins, B down 1.
        // Hole 2: A 4/4; B1 gross 4 net 3 wins — a NET birdie, gross par.
        const events = [
            makeScoreEvent(bA1.ballId, 1, 3),
            makeScoreEvent(bA2.ballId, 1, 3),
            makeScoreEvent(bB1.ballId, 1, 5),
            makeScoreEvent(bB2.ballId, 1, 5),
            makeScoreEvent(bA1.ballId, 2, 4),
            makeScoreEvent(bA2.ballId, 2, 4),
            makeScoreEvent(bB1.ballId, 2, 4),
            makeScoreEvent(bB2.ballId, 2, 5),
        ];
        const score = (formatConfig?: unknown) =>
            talibanBetterBall.score({
                roundContext: ctx,
                slotBalls: balls,
                slotTeamGroupings: groupings,
                events,
                ...(formatConfig !== undefined ? { formatConfig } : {}),
            });

        // Default (gross): gross par is no feat → plain +1.
        const gross = score().pairResults![0].holes.find((h) => h.holeNumber === 2)!;
        expect(gross.pointsDelta).toBe(-1);
        expect(gross.note).not.toContain('down-team birdie');

        // Net rule: net 3 on par 4 is a solo net birdie → +2.
        const net = score({ bonusRule: 'net' }).pairResults![0].holes.find((h) => h.holeNumber === 2)!;
        expect(net.pointsDelta).toBe(-2);
        expect(net.note).toContain('down-team birdie');
    });

    test('match play normalization: low PH plays 0, others the delta — plus player gives nothing back', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: -1 }),
            makeProducer('P2', { courseHandicap: 0 }),
            makeProducer('P3', { courseHandicap: 3 }),
            makeProducer('P4', { courseHandicap: 3 }),
        ]);
        // Raw PHs −1/0/3/3 → effective 0/1/4/4. Without normalization the plus
        // player would give a stroke back on SI 18 (net = gross + 1 there).
        const bA1 = makeOwnBall('P1', -1, -1);
        const bA2 = makeOwnBall('P2', 0, 0);
        const bB1 = makeOwnBall('P3', 3, 3);
        const bB2 = makeOwnBall('P4', 3, 3);
        const balls = [bA1, bA2, bB1, bB2];
        const groupings = [
            { teamLabel: 'A', ballIds: [bA1.ballId, bA2.ballId] },
            { teamLabel: 'B', ballIds: [bB1.ballId, bB2.ballId] },
        ];
        const events = [1, 4, 18].flatMap((h) => [
            makeScoreEvent(bA1.ballId, h, 4),
            makeScoreEvent(bA2.ballId, h, 4),
            makeScoreEvent(bB1.ballId, h, 5),
            makeScoreEvent(bB2.ballId, h, 5),
        ]);
        const { ballResults } = talibanBetterBall.score({
            roundContext: ctx,
            slotBalls: balls,
            slotTeamGroupings: groupings,
            events,
        });
        const net = (idx: number, hole: number): number | null =>
            ballResults[idx].holes.find((h) => h.holeNumber === hole)!.net;

        // P1 (eff 0): no strokes anywhere — gross 4 on SI 18 stays net 4.
        expect(net(0, 18)).toBe(4);
        expect(net(0, 1)).toBe(4);
        // P2 (eff 1): one stroke, on SI 1 only.
        expect(net(1, 1)).toBe(3);
        expect(net(1, 4)).toBe(4);
        // P3/P4 (eff 4): strokes on SI 1–4, nothing on SI 18.
        expect(net(2, 1)).toBe(4);
        expect(net(2, 4)).toBe(4);
        expect(net(2, 18)).toBe(5);
        expect(net(3, 4)).toBe(4);
    });

    test('validateConfig: rejects an unknown bonusRule, accepts gross/net/absent', () => {
        expect(talibanBetterBall.validateConfig!({ bonusRule: 'both' })).toMatchObject([
            { code: 'taliban_bonus_rule_invalid', path: 'bonusRule' },
        ]);
        expect(talibanBetterBall.validateConfig!({ bonusRule: 'gross' })).toEqual([]);
        expect(talibanBetterBall.validateConfig!({ bonusRule: 'net' })).toEqual([]);
        expect(talibanBetterBall.validateConfig!(undefined)).toEqual([]);
        expect(talibanBetterBall.validateConfig!({})).toEqual([]);
    });

    test('ballRequirement: 4 balls, 2 teams of 2', () => {
        const req = talibanBetterBall.ballRequirement();
        expect(req.slotBallCount).toEqual({ min: 4, max: 4 });
        expect(req.slotTeamGrouping).toEqual({
            teamCount: { min: 2, max: 2 },
            teamSize: { min: 2, max: 2 },
        });
    });
});
