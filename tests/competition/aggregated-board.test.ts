import { expect, test } from 'bun:test';
import {
    entryArithmetic,
    renderAggregatedBoard,
    renderResultsBoard,
    type RoundColumn,
} from '../../src/competition/aggregated-board';
import type {
    CompetitionRankedEntry,
    CompetitionResultEntry,
    CompetitionResultView,
    CompetitionRoundCell,
} from '../../src/api/competitions.gen';

// Pure fold → HTML renderer. Every value/status/position is server-computed;
// these fixtures exercise the layout (arithmetic, dropped strikethrough, cut
// divider, missing dashes, muted demotion, finalized points column).

function cell(
    roundNumber: number,
    value: number | null,
    status: CompetitionRoundCell['status'],
): CompetitionRoundCell {
    return { roundNumber, value, included: status === 'counted', status };
}

function entry(over: Partial<CompetitionRankedEntry>): CompetitionRankedEntry {
    return {
        participantId: over.participantId ?? 'p1',
        displayName: over.displayName ?? 'Player',
        category: over.category ?? null,
        playerRef: over.playerRef ?? { kind: 'player', id: 'x' },
        rounds: over.rounds ?? [],
        total: over.total ?? null,
        roundsCounted: over.roundsCounted ?? 0,
        position: over.position ?? 1,
        withdrawn: over.withdrawn ?? false,
        cutAfterRound: over.cutAfterRound ?? null,
        incomplete: over.incomplete ?? false,
    };
}

function view(over: Partial<CompetitionResultView>): CompetitionResultView {
    return {
        kind: 'competition_ranked',
        strategyId: over.strategyId ?? 'stroke_total',
        metricId: over.metricId ?? 'gross',
        metricLabel: over.metricLabel ?? 'Gross strokes',
        direction: over.direction ?? 'low',
        operator: over.operator ?? { kind: 'sum' },
        rounds: over.rounds ?? [
            { roundNumber: 1, postCut: false },
            { roundNumber: 2, postCut: false },
        ],
        entries: over.entries ?? [],
    };
}

test('entryArithmetic sums counted rounds with a bold total', () => {
    const e = entry({
        rounds: [cell(1, 74, 'counted'), cell(2, 70, 'counted')],
        total: 144,
    });
    const html = entryArithmetic(e);
    expect(html).toContain('74 + 70 = ');
    expect(html).toContain('cb-arith__total">144<');
});

test('entryArithmetic strikes through dropped rounds (best-n)', () => {
    const e = entry({
        rounds: [cell(1, 72, 'counted'), cell(2, 70, 'counted'), cell(3, 81, 'dropped')],
        total: 142,
    });
    const html = entryArithmetic(e);
    expect(html).toContain('72 + 70 + <s>81</s> = ');
    expect(html).toContain('142');
});

test('entryArithmetic renders an em dash when nothing is posted', () => {
    const e = entry({ rounds: [cell(1, null, 'missing')], total: null });
    expect(entryArithmetic(e)).toContain('—');
});

test('renderAggregatedBoard draws per-round cells, dropped strike, and missing dash', () => {
    const v = view({
        operator: { kind: 'best_n', n: 2 },
        strategyId: 'best_n_of_m',
        rounds: [
            { roundNumber: 1, postCut: false },
            { roundNumber: 2, postCut: false },
            { roundNumber: 3, postCut: false },
        ],
        entries: [
            entry({
                displayName: 'Ann',
                rounds: [cell(1, 72, 'counted'), cell(2, 70, 'counted'), cell(3, 81, 'dropped')],
                total: 142,
                position: 1,
            }),
            entry({
                participantId: 'p2',
                displayName: 'Bob',
                rounds: [cell(1, 75, 'counted'), cell(2, null, 'missing'), cell(3, 73, 'counted')],
                total: 148,
                position: 2,
            }),
        ],
    });
    const html = renderAggregatedBoard(v);
    expect(html).toContain('Best 2 of 3');
    expect(html).toContain('cb-c--dropped');
    expect(html).toContain('cb-c--missing');
    // Leader row highlighted, arithmetic visible.
    expect(html).toContain('cb-row--lead');
    expect(html).toContain('Ann');
});

test('renderAggregatedBoard draws the cut divider on the first post-cut round', () => {
    const v = view({
        rounds: [
            { roundNumber: 1, postCut: false },
            { roundNumber: 2, postCut: true },
        ],
        entries: [entry({ rounds: [cell(1, 70, 'counted'), cell(2, 71, 'counted')], total: 141 })],
    });
    const html = renderAggregatedBoard(v);
    expect(html).toContain('cb-c--divider');
});

test('renderAggregatedBoard demotes + mutes cut and withdrawn entries', () => {
    const v = view({
        entries: [
            entry({ displayName: 'Lead', rounds: [cell(1, 70, 'counted')], total: 70, position: 1 }),
            entry({
                participantId: 'p2',
                displayName: 'CutGuy',
                rounds: [cell(1, 90, 'counted'), cell(2, null, 'cut')],
                total: 90,
                position: 2,
                cutAfterRound: 1,
            }),
            entry({
                participantId: 'p3',
                displayName: 'Gone',
                rounds: [cell(1, 80, 'counted')],
                total: 80,
                position: 3,
                withdrawn: true,
            }),
        ],
    });
    const html = renderAggregatedBoard(v);
    expect(html).toContain('cb-row--cut');
    expect(html).toContain('cb-row--withdrawn');
    expect(html).toContain('Cut R1');
    expect(html).toContain('>WD<');
});

test('renderAggregatedBoard shows the defaulted hint only when defaulted', () => {
    const v = view({ entries: [entry({ rounds: [cell(1, 70, 'counted')], total: 70 })] });
    expect(renderAggregatedBoard(v, { defaulted: true })).toContain('default scoring');
    expect(renderAggregatedBoard(v, { defaulted: false })).not.toContain('default scoring');
});

test('renderAggregatedBoard renders an empty-state when no entries', () => {
    expect(renderAggregatedBoard(view({ entries: [] }))).toContain('No scores yet');
});

test('renderResultsBoard adds a bold points column', () => {
    const rankedEntries = [
        entry({ displayName: 'Ann', rounds: [cell(1, 74, 'counted'), cell(2, 70, 'counted')], total: 144, position: 1 }),
    ];
    const resultEntries: CompetitionResultEntry[] = [
        { participantId: 'p1', position: 1, points: 25, entry: rankedEntries[0]!, tiebreak: null },
    ];
    const roundsMeta: RoundColumn[] = [
        { roundNumber: 1, postCut: false },
        { roundNumber: 2, postCut: false },
    ];
    const html = renderResultsBoard(resultEntries, roundsMeta);
    expect(html).toContain('cb-points');
    expect(html).toContain('>25<');
    expect(html).toContain('>Pts<');
});
