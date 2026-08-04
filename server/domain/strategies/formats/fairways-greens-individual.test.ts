import { describe, expect, test } from 'bun:test';

import { make18Holes, makeOwnBall, makeProducer, makeRoundContext, makeScoreEvent } from './_testkit';
import type { MetadataEvent, StrategyEvent } from '../types';
import { BUILTIN_FORMAT_PLUGINS } from '../../formats/builtins';
import {
    FAIRWAYS_GREENS_INDIVIDUAL_ID,
    fairwaysGreensIndividual,
    readScoreBasis,
} from './fairways-greens-individual';
import { fairwaysGreensIndividualPresenter } from './fairways-greens-individual.presenter';

function metaEvent(ballId: string, hole: number, type: string, value: unknown): MetadataEvent {
    return {
        kind: 'metadata',
        roundId: 'r',
        ballId,
        playHoleId: `ph-${hole}`,
        type,
        value,
        clientEventId: `m-${ballId}-${hole}-${type}`,
        recordedBy: 'tester',
        recordedAt: new Date(2025, 0, 1, 0, 0, 30 + hole).toISOString(),
    };
}

/**
 * One hole in isolation: a single-hole itinerary so a case reads as the golf it
 * describes. `par` defaults to 4; `ch`/`ph` drive the net basis.
 */
function scoreOneHole(opts: {
    par?: number;
    strokes: number | null;
    putts?: number | null;
    fairway?: boolean;
    ph?: number;
    scoreBasis?: 'gross' | 'net';
    noScoreEvent?: boolean;
}) {
    const par = opts.par ?? 4;
    const ph = opts.ph ?? 0;
    const courseHoles = [{ holeNumber: 1, par, baseStrokeIndex: 1 }];
    const ctx = makeRoundContext(courseHoles, [makeProducer('P1', { courseHandicap: ph })], new Map(), {
        allocationCycleSize: 18,
    });
    const ball = makeOwnBall('P1', ph, ph);
    const events: StrategyEvent[] = [];
    if (!opts.noScoreEvent) events.push(makeScoreEvent(ball.ballId, 1, opts.strokes));
    if (opts.putts !== undefined && opts.putts !== null)
        events.push(metaEvent(ball.ballId, 1, 'putts', opts.putts));
    if (opts.fairway) events.push(metaEvent(ball.ballId, 1, 'fairway', true));

    const result = fairwaysGreensIndividual.score({
        roundContext: ctx,
        slotBalls: [ball],
        events,
        ...(opts.scoreBasis ? { formatConfig: { scoreBasis: opts.scoreBasis } } : {}),
    });
    const r = result.ballResults[0]!;
    return { hole: r.holes[0]!, total: r.totals[0]!.value, holesPlayed: r.holesPlayed };
}

describe('fairwaysGreensIndividual — derived categories', () => {
    test('GIR derives from strokes − putts ≤ par − 2', () => {
        // Par 4 in 4 with 2 putts: on in 2 → GIR.
        expect(scoreOneHole({ strokes: 4, putts: 2 }).hole.categories).toEqual(['GIR']);
        // Par 4 in 4 with 1 putt: on in 3 → missed the green, got up and down.
        expect(scoreOneHole({ strokes: 4, putts: 1 }).hole.categories).toEqual(['Up & down']);
        // Par 4 in 5 with 2 putts: on in 3, two putts → nothing.
        expect(scoreOneHole({ strokes: 5, putts: 2 }).hole.categories).toEqual([]);
    });

    test('a chip-in is a missed green AND an up-and-down', () => {
        const h = scoreOneHole({ par: 4, strokes: 3, putts: 0 });
        expect(h.hole.categories).toEqual(['Up & down', 'Birdie']);
        expect(h.hole.points).toBe(6);
    });

    test('up and down is only paid when the green was missed', () => {
        // On in regulation and a single putt is a birdie with GIR, not an
        // up-and-down — there was nothing to get up from.
        expect(scoreOneHole({ strokes: 3, putts: 1 }).hole.categories).toEqual(['GIR', 'Birdie']);
    });

    test('three putts cost a point, and stack with whatever else the hole paid', () => {
        // Par 5, on in 2 (GIR), three putts for a par.
        const h = scoreOneHole({ par: 5, strokes: 5, putts: 3 });
        expect(h.hole.categories).toEqual(['GIR', '3-putt']);
        expect(h.hole.points).toBe(0);
    });

    test('unanswered putts derive nothing — never a free GIR, never a 3-putt', () => {
        const h = scoreOneHole({ strokes: 4 });
        expect(h.hole.categories).toEqual([]);
        expect(h.hole.points).toBe(0);
    });
});

describe('fairwaysGreensIndividual — score against par', () => {
    test('eagle pays 10 INSTEAD of the birdie 5', () => {
        const h = scoreOneHole({ par: 5, strokes: 3, putts: 1 });
        expect(h.hole.categories).toEqual(['GIR', 'Eagle']);
        expect(h.hole.points).toBe(11);
    });

    test('an albatross reads as an eagle, not as nothing', () => {
        expect(scoreOneHole({ par: 5, strokes: 2, putts: 1 }).hole.categories).toContain('Eagle');
    });

    test('double bogey or worse costs 2', () => {
        expect(scoreOneHole({ strokes: 6, putts: 2 }).hole.points).toBe(-2);
        expect(scoreOneHole({ strokes: 8, putts: 2 }).hole.categories).toEqual(['Double+']);
        // Bogey is neutral.
        expect(scoreOneHole({ strokes: 5, putts: 2 }).hole.points).toBe(0);
    });

    test('scoreBasis net reads birdie/eagle/double off the net score', () => {
        // 18 PH on an 18-hole cycle = one stroke a hole. A gross par is a net
        // birdie; the same hole pays nothing on the gross basis.
        const net = scoreOneHole({ strokes: 4, putts: 2, ph: 18, scoreBasis: 'net' });
        expect(net.hole.categories).toEqual(['GIR', 'Birdie']);
        const gross = scoreOneHole({ strokes: 4, putts: 2, ph: 18, scoreBasis: 'gross' });
        expect(gross.hole.categories).toEqual(['GIR']);
    });

    test('the net basis moves the double-bogey penalty too — one knob, all three', () => {
        // Gross 6 on a par 4 with a stroke = net 5 = bogey, no penalty.
        const net = scoreOneHole({ strokes: 6, putts: 2, ph: 18, scoreBasis: 'net' });
        expect(net.hole.categories).toEqual([]);
        expect(net.hole.points).toBe(0);
    });
});

describe('fairwaysGreensIndividual — fairway input', () => {
    test('a fairway on a par 4 pays; the same flag on a par 3 does not', () => {
        expect(scoreOneHole({ par: 4, strokes: 4, putts: 2, fairway: true }).hole.categories).toEqual([
            'Fairway',
            'GIR',
        ]);
        expect(scoreOneHole({ par: 3, strokes: 3, putts: 2, fairway: true }).hole.categories).toEqual(['GIR']);
    });

    test('the format declares the same par scope it scores', () => {
        const d = BUILTIN_FORMAT_PLUGINS.find((p) => p.descriptor.id === FAIRWAYS_GREENS_INDIVIDUAL_ID)!
            .descriptor;
        const fairway = d.requirements.scoreEntry?.metadata?.find((m) => m.key === 'fairway');
        expect(fairway?.appliesWhen).toEqual({ minPar: 4 });
        expect(d.requirements.scoreEntry?.metadata?.find((m) => m.key === 'putts')?.kind).toBe('number');
    });
});

describe('fairwaysGreensIndividual — unscored holes', () => {
    test('a pickup scores nothing and is not inferred to be a double', () => {
        const h = scoreOneHole({ strokes: 0, putts: 2 });
        expect(h.hole.points).toBeNull();
        expect(h.hole.note).toBe('pickup — no points');
        expect(h.holesPlayed).toBe(1);
    });

    test('a hole with no event contributes nothing and is not played', () => {
        const h = scoreOneHole({ strokes: null, noScoreEvent: true });
        expect(h.hole.points).toBeNull();
        expect(h.hole.note).toBeUndefined();
        expect(h.holesPlayed).toBe(0);
        expect(h.total).toBeNull();
    });
});

describe('fairwaysGreensIndividual — totals and config', () => {
    test('totals sum the per-hole points across a round', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [makeProducer('P1', { courseHandicap: 0 })]);
        const ball = makeOwnBall('P1', 0, 0);
        const events: StrategyEvent[] = [];
        // h1: fairway + GIR + birdie = 7. h2: GIR + 3-putt = 0. h3: double = −2.
        events.push(makeScoreEvent(ball.ballId, 1, 3), metaEvent(ball.ballId, 1, 'putts', 1));
        events.push(metaEvent(ball.ballId, 1, 'fairway', true));
        events.push(makeScoreEvent(ball.ballId, 2, 5), metaEvent(ball.ballId, 2, 'putts', 3));
        events.push(makeScoreEvent(ball.ballId, 3, 6), metaEvent(ball.ballId, 3, 'putts', 2));
        const r = fairwaysGreensIndividual.score({ roundContext: ctx, slotBalls: [ball], events })
            .ballResults[0]!;
        expect(r.totals).toEqual([{ scoringType: 'points', value: 5 }]);
        expect(r.holesPlayed).toBe(3);
        expect(r.holes[0]!.note).toBe('Fairway +1, GIR +1, Birdie +5 = +7');
    });

    test('scoreBasis defaults to gross and rejects anything else', () => {
        expect(readScoreBasis(undefined, 'x')).toBe('gross');
        expect(readScoreBasis({}, 'x')).toBe('gross');
        expect(readScoreBasis({ scoreBasis: 'net' }, 'x')).toBe('net');
        expect(fairwaysGreensIndividual.validateConfig!({ scoreBasis: 'stableford' })).toHaveLength(1);
        expect(fairwaysGreensIndividual.validateConfig!({ scoreBasis: 'net' })).toEqual([]);
    });
});

describe('fairwaysGreensIndividual — presentation', () => {
    test('the plugin registers its own presenter', () => {
        const plugin = BUILTIN_FORMAT_PLUGINS.find((p) => p.descriptor.id === FAIRWAYS_GREENS_INDIVIDUAL_ID)!;
        expect(plugin.renderResult).toBe(fairwaysGreensIndividualPresenter);
    });

    test('running totals are ABSOLUTE — a lone player keeps their points', () => {
        const courseHoles = make18Holes();
        const ctx = makeRoundContext(courseHoles, [
            makeProducer('P1', { courseHandicap: 0 }),
            makeProducer('P2', { courseHandicap: 0 }),
        ]);
        const b1 = makeOwnBall('P1', 0, 0);
        const b2 = makeOwnBall('P2', 0, 0);
        const result = fairwaysGreensIndividual.score({
            roundContext: ctx,
            slotBalls: [b1, b2],
            events: [
                makeScoreEvent(b1.ballId, 1, 4),
                metaEvent(b1.ballId, 1, 'putts', 2),
                makeScoreEvent(b2.ballId, 1, 6),
                metaEvent(b2.ballId, 1, 'putts', 2),
            ],
        });
        const view = fairwaysGreensIndividualPresenter({
            slotIndex: 0,
            slotDefId: 'slot-fg',
            formatId: FAIRWAYS_GREENS_INDIVIDUAL_ID,
            formatLabel: 'Fairways and greens',
            scoringMode: 'fairways_greens',
            teamShape: 'individual',
            allowanceLabel: '100%',
            metrics: [{ id: 'points', label: 'Points', direction: 'high' }],
            runningNormalized: false,
            scoreGridComponentId: 'category-matrix-grid',
            result,
            slotBalls: [b1, b2],
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

        expect(view.cards[0]?.rows.map((r) => r.label)).toEqual([
            'Par',
            'Fairway',
            'GIR',
            'Up & down',
            'Birdie',
            'Eagle',
            '3-putt',
            'Double+',
            'Points',
            'Running',
        ]);
        // P1's +1 is shown as +1, not as a lead over P2 — and the negative
        // total survives the trip to the card.
        expect(view.cards[0]?.totals).toEqual([{ label: 'points', value: 1 }]);
        expect(view.cards[1]?.totals).toEqual([{ label: 'points', value: -2 }]);
    });
});
