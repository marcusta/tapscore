import { expect, test } from 'bun:test';
import { fmtPoints, renderBoard, renderSetup } from '../../src/series/series-render';
import { mergeSeriesLists } from '../../src/series/series-list';
import {
    forgetDeviceSeries,
    getDeviceSeries,
    recordDeviceSeries,
} from '../../src/series/device-series';
import type { SeriesBoardView, SeriesDetail, TeamPointsDescriptor } from '../../src/api/series.gen';
import type { DeviceStorage } from '../../src/device-store';

const board: SeriesBoardView = {
    canEdit: false,
    id: 's1',
    name: 'Red v Blue',
    live: true,
    teams: [
        { teamId: 'r', name: 'Red', colour: 'red', points: 1.5, decided: 0.5, members: ['Rolf <i>', 'Rita'] },
        { teamId: 'b', name: 'Blue <b>', colour: 'blue', points: 0.5, decided: 0.5, members: [] },
    ],
    sessions: [
        {
            seriesRoundId: 'sr1',
            label: 'Friday singles',
            roundName: 'Front 9',
            date: '2026-09-18',
            status: 'active',
            sources: [
                {
                    id: 'src1',
                    label: 'Match play',
                    ruleLabel: 'Match points',
                    live: true,
                    points: [],
                    rows: [
                        {
                            label: 'Anna v Bo',
                            status: '2 UP thru 5',
                            live: true,
                            points: [
                                { teamId: 'r', points: 1 },
                                { teamId: 'b', points: 0 },
                            ],
                            detail: 'Red leads: 1',
                        },
                        {
                            label: 'Cia v Dan',
                            status: '',
                            live: false,
                            points: [],
                            detail: '',
                            problem: 'Dan has no team',
                        },
                    ],
                },
            ],
        },
    ],
};

test('fmtPoints drops a trailing .0 and keeps halves', () => {
    expect(fmtPoints(2)).toBe('2');
    expect(fmtPoints(2.5)).toBe('2.5');
});

test('renderBoard prints totals, the live note, rows and problems, and escapes names', () => {
    const html = renderBoard(board);
    expect(html).toContain('>Red<');
    expect(html).toContain('0.5 decided');
    expect(html).toContain('Live matches count as they stand');
    expect(html).toContain('2 UP thru 5');
    expect(html).toContain('Red leads: 1');
    expect(html).toContain('Dan has no team');
    expect(html).toContain('Blue &lt;b&gt;');
    expect(html).not.toContain('Blue <b>');
    expect(html).toContain('In play');
});

test('a two-team row draws as a bar: the leader fills with its team colour', () => {
    const source = board.sessions[0]!.sources[0]!;
    const withBar: SeriesBoardView = {
        ...board,
        sessions: [
            {
                ...board.sessions[0]!,
                sources: [
                    {
                        ...source,
                        rows: [
                            {
                                ...source.rows[0]!,
                                live: false,
                                versus: {
                                    a: { name: 'Anna <i>', teamId: 'r' },
                                    b: { name: 'Bo', teamId: 'b', figure: '71' },
                                    leader: 'b',
                                    standing: '1 UP',
                                    finished: true,
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    };
    const html = renderBoard(withBar);
    expect(html).toMatch(/sb-vs__side--b sb-vs__side--lead/);
    expect(html).not.toMatch(/sb-vs__side--a sb-vs__side--lead/);
    expect(html).toContain('Anna &lt;i&gt;');
    expect(html).toContain('>71<');
    expect(html).toContain('>1 UP<');
    expect(html).toContain('>Final<');
    // The points line and the arithmetic stay under the bar.
    expect(html).toContain('sb-row__pts');
    expect(html).toContain('Red leads: 1');
    // The flat label is replaced, not repeated.
    expect(html).not.toContain('Anna v Bo');
});

test('a row without two-sided data keeps the flat layout', () => {
    const html = renderBoard(board);
    expect(html).toContain('Anna v Bo');
    expect(html).not.toContain('sb-vs__side');
});

test('a settled board carries no live note and no decided line', () => {
    const html = renderBoard({ ...board, live: false });
    expect(html).not.toContain('decided');
    expect(html).not.toContain('Live matches');
});

const rules: TeamPointsDescriptor[] = [
    {
        id: 'rule-a',
        label: 'Match points',
        labels: { en: 'Match points' },
        description: 'd',
        appliesTo: 'match',
        configFields: [{ kind: 'number', key: 'win', label: 'Win', default: 1, step: 0.5 }],
    },
    {
        id: 'rule-b',
        label: 'Entered by hand',
        labels: { en: 'Entered by hand' },
        description: 'd',
        appliesTo: 'none',
        configFields: [
            { kind: 'team_points', key: 'points', label: 'Points' },
            { kind: 'text', key: 'note', label: 'Note' },
        ],
    },
];

function detail(teamCount: number): SeriesDetail {
    const teams = ['Red', 'Blue', 'Green'].slice(0, teamCount).map((name, i) => ({
        id: `t${i}`,
        name,
        colour: name.toLowerCase(),
        members: i === 0 ? [{ id: 'm1', playerId: 'p1', guestPlayerId: null, displayName: 'Anna' }] : [],
    }));
    return {
        id: 's1',
        name: 'Trip',
        shareToken: 'series-token',
        ownerPlayerId: 'p1',
        createdAt: '2026-09-17T00:00:00.000Z',
        teams,
        rounds: [
            {
                id: 'sr1',
                roundId: 'round-1',
                label: 'Friday',
                ordinal: 0,
                roundName: 'Front 9',
                date: '2026-09-18',
                status: 'not_started',
                balls: [
                    { ballId: 'b1', label: 'Anna', teamId: 't0' },
                    { ballId: 'b2', label: 'Bo', teamId: null },
                ],
                slots: [{ slotDefId: 'slot-1', formatLabel: 'Match play', suggestedRuleId: 'rule-a' }],
            },
        ],
        sources: [
            { id: 'src-hand', seriesRoundId: null, slotDefId: null, ruleId: 'rule-b', config: { points: { t0: 1 }, note: 'Longest drive' }, label: 'Longest drive', ordinal: 0 },
        ],
    };
}

test('two teams get the track control, three get a dropdown', () => {
    const base = { rules, friends: [], rounds: [], busy: false };
    const two = renderSetup({ ...base, detail: detail(2) });
    expect(two).toContain('data-act="ball-team"');
    expect(two).not.toContain('data-change="ball-team"');
    const three = renderSetup({ ...base, detail: detail(3) });
    expect(three).toContain('data-change="ball-team"');
    expect(three).toContain('Remove team');
    expect(two).not.toContain('Remove team');
});

test('setup offers a source for an uncovered slot and renders config from field data', () => {
    const html = renderSetup({
        detail: detail(2),
        rules,
        friends: [
            { id: 'p1', displayName: 'Anna' },
            { id: 'p2', displayName: 'Bo' },
        ],
        rounds: [{ token: 'round-token', label: 'Back 9 · 2026-09-18' }],
        busy: false,
    });
    expect(html).toContain('Score Match play for points');
    expect(html).toContain('data-kind="team_points"');
    expect(html).toContain('value="Longest drive"');
    expect(html).toContain('No team');
    // A friend already on a team is not offered again.
    expect(html).toContain('<option value="p2">Bo</option>');
    expect(html).not.toContain('<option value="p1">');
    expect(html).toContain('round-token');
});

test('series lists merge by token, server name first', () => {
    const rows = mergeSeriesLists(
        [{ id: 's1', name: 'Trip 2026', shareToken: 'a', ownerPlayerId: 'p', createdAt: '' }],
        [
            { token: 'a', name: 'Old name', lastSeenAt: '' },
            { token: 'b', name: 'Followed link', lastSeenAt: '' },
        ],
    );
    expect(rows).toEqual([
        { token: 'a', name: 'Trip 2026' },
        { token: 'b', name: 'Followed link' },
    ]);
});

test('device series list dedupes by token and forgets', () => {
    const map = new Map<string, string>();
    const storage: DeviceStorage = {
        getItem: (k) => map.get(k) ?? null,
        setItem: (k, v) => void map.set(k, v),
    };
    recordDeviceSeries({ token: 'a', name: 'A', lastSeenAt: '1' }, storage);
    recordDeviceSeries({ token: 'b', name: 'B', lastSeenAt: '2' }, storage);
    recordDeviceSeries({ token: 'a', name: 'A2', lastSeenAt: '3' }, storage);
    expect(getDeviceSeries(storage).map((s) => s.name)).toEqual(['A2', 'B']);
    expect(forgetDeviceSeries('a', storage).map((s) => s.token)).toEqual(['b']);
    expect(getDeviceSeries(null)).toEqual([]);
});

test('the roster sits between the totals and the first session, names escaped', () => {
    const html = renderBoard(board);
    expect(html).toContain('<li>Rolf &lt;i&gt;</li>');
    expect(html).toContain('<li>Rita</li>');
    expect(html).toContain('No players yet.');
    const totals = html.indexOf('sb-totals');
    const roster = html.indexOf('sb-roster');
    const session = html.indexOf('sb-session');
    expect(totals).toBeLessThan(roster);
    expect(roster).toBeLessThan(session);
});

test('a board with no members anywhere prints no roster', () => {
    const html = renderBoard({ ...board, teams: board.teams.map((t) => ({ ...t, members: [] })) });
    expect(html).not.toContain('sb-roster');
});
