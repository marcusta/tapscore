import { expect, test } from 'bun:test';
import {
    aggregationConfig,
    aggregationFormValues,
    type AggregationField,
} from '../../src/competition/competition-detail.service';
import {
    arithmeticParts,
    competitionBoardRowKey,
} from '../../src/competition/competition-board-model';
import type { CompetitionRankedEntry } from '../../src/api/competitions.gen';

const fields: AggregationField[] = [
    {
        key: 'metric',
        label: 'Metric',
        kind: 'select',
        options: [
            { value: 'gross', label: 'Gross' },
            { value: 'net', label: 'Net' },
        ],
        default: 'net',
    },
    {
        key: 'rounds',
        label: 'Rounds',
        kind: 'integer',
        min: 1,
        default: 2,
    },
];

test('aggregation form values use stored values and descriptor defaults', () => {
    expect(aggregationFormValues(fields, { metric: 'gross' })).toEqual({
        metric: 'gross',
        rounds: '2',
    });
});

test('aggregation config restores select and integer field types', () => {
    expect(aggregationConfig(fields, { metric: 'net', rounds: '3' })).toEqual({
        metric: 'net',
        rounds: 3,
    });
    expect(aggregationConfig(fields, { metric: 'gross', rounds: 'bad' })).toEqual({
        metric: 'gross',
        rounds: 2,
    });
});

test('competition arithmetic marks dropped rounds without changing their value', () => {
    const entry = {
        rounds: [
            { roundNumber: 1, value: 74, status: 'counted' },
            { roundNumber: 2, value: 81, status: 'dropped' },
            { roundNumber: 3, value: null, status: 'missing' },
        ],
    } as CompetitionRankedEntry;
    expect(arithmeticParts(entry)).toEqual([
        { text: '74', dropped: false },
        { text: '81', dropped: true },
    ]);
});

test('board row keys change when a result set or its round columns change', () => {
    const entry = {
        participantId: 'participant-1',
        rounds: [{ roundNumber: 1, value: 74, status: 'counted' }],
    } as CompetitionRankedEntry;
    const columns = [{ roundNumber: 1, postCut: false }];
    const live = competitionBoardRowKey(entry, null, columns);

    expect(competitionBoardRowKey(entry, 10, columns)).not.toBe(live);
    expect(
        competitionBoardRowKey(entry, null, [{ roundNumber: 1, postCut: true }]),
    ).not.toBe(live);
    expect(
        competitionBoardRowKey(
            { ...entry, total: 75 } as CompetitionRankedEntry,
            null,
            columns,
        ),
    ).not.toBe(live);
});
