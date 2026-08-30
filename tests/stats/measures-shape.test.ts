import { expect, test } from 'bun:test';
import { ZERO_MEASURES } from '../../src/round/stat-measures';
import {
    MEASURE_KEYS,
    missingMeasureKeys,
    statsShapeProblem,
} from '../../src/stats/measures-shape';
import type { PlayerRoundStats, StatMeasures } from '../../src/api/player-stats.gen';

// The web twin of iOS's key-list decode guards. A server with stale views
// sends measure rows missing columns; before this guard those fed `rate()`
// as `undefined` and rendered NaN%. The guard turns them into a refusal.

function row(measures: StatMeasures): PlayerRoundStats {
    return {
        roundId: 'r1',
        date: '2026-07-01',
        courseId: 'c1',
        courseName: 'Linköping',
        roundType: 'full_18',
        venueType: 'outdoor',
        name: null,
        holeCount: 18,
        measures,
        girArrivalMetres: [],
    };
}

/** `ZERO_MEASURES` minus the keys named — the stale-view payload. */
function truncated(...drop: (keyof StatMeasures)[]): StatMeasures {
    const out: Record<string, number> = { ...ZERO_MEASURES };
    for (const key of drop) delete out[key];
    return out as unknown as StatMeasures;
}

test('a complete measures row is whole', () => {
    expect(missingMeasureKeys(ZERO_MEASURES)).toEqual([]);
    expect(statsShapeProblem([row(ZERO_MEASURES)])).toBeNull();
});

test('an empty payload is whole — "no rounds" is not a shape problem', () => {
    expect(statsShapeProblem([])).toBeNull();
});

test('a truncated measures object names what is missing', () => {
    const bad = truncated('attStrokes', 'girHits');
    expect(missingMeasureKeys(bad).sort()).toEqual(['attStrokes', 'girHits']);
    const problem = statsShapeProblem([row(bad)]);
    expect(problem).toContain('attStrokes');
    expect(problem).toContain('girHits');
});

test('many missing keys are capped in the message, with a count for the rest', () => {
    const bad = truncated('attStrokes', 'girHits', 'puttsTotal', 'threePutts', 'parTotal');
    const problem = statsShapeProblem([row(bad)]);
    expect(problem).toContain('and 2 more');
});

test('a null value is as missing as an absent key — rate() cannot divide it', () => {
    const bad = { ...ZERO_MEASURES, girRecorded: null } as unknown as StatMeasures;
    expect(missingMeasureKeys(bad)).toEqual(['girRecorded']);
});

test('a measures value that is not an object at all misses every key', () => {
    expect(missingMeasureKeys(undefined)).toHaveLength(MEASURE_KEYS.length);
    expect(missingMeasureKeys(null)).toHaveLength(MEASURE_KEYS.length);
});
