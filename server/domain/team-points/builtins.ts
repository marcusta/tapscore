// Phase 6 Slice 1 — built-in team-points rules (REWRITE_DOMAIN_SPEC.md §19).
//
//   match_win_half  one row per match: win / half / loss, projected while live
//   ranked_winner   one row per slot: the team with the best total takes the
//                   points (the §19 `sum_best_k` winner-takes path)
//   manual_points   a round-less entry: the points are typed in
//
// `rank_points` waits for Phase 5 point templates.
//
// Rule ids appear ONLY in this module (architecture.test.ts).

import type { BallResult, ConfigDiagnostic, PairBallResult } from '../strategies/types';
import {
    teamOfBalls,
    type TeamPointsInput,
    type TeamPointsRow,
    type TeamPointsRule,
    type TeamPointsSlotInput,
    type TeamPointsVersus,
} from './rule';

export const MATCH_WIN_HALF = 'match_win_half';
export const RANKED_WINNER = 'ranked_winner';
export const MANUAL = 'manual_points';

// --- shared ---------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function nonNegativeNumber(
    config: Record<string, unknown>,
    key: string,
    out: ConfigDiagnostic[],
): void {
    const v = config[key];
    if (v === undefined) return;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
        out.push({ code: 'invalid_points', message: `${key} must be a number ≥ 0`, path: key });
    }
}

/** Points print without a trailing `.0`; halves print as `.5`. */
function fmt(n: number): string {
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

// --- match_win_half -----------------------------------------------------------------

interface MatchWinHalfConfig {
    win: number;
    half: number;
}

function matchConfig(config: unknown): MatchWinHalfConfig {
    const c = isRecord(config) ? config : {};
    return {
        win: typeof c.win === 'number' ? c.win : 1,
        half: typeof c.half === 'number' ? c.half : 0.5,
    };
}

function sideLabel(side: PairBallResult['sideA'], slot: TeamPointsSlotInput): string {
    if (side.teamLabel) return side.teamLabel;
    return side.ballIds.map((id) => slot.ballLabels[id] ?? '?').join(' + ');
}

/**
 * The side ahead right now: `a`, `b`, or null when level. A finished pair
 * answers from `result` (A-perspective: `lost` means side B won); a live pair
 * answers from the running sum of the signed per-hole `pointsDelta`.
 */
function leaderOf(pair: PairBallResult): 'a' | 'b' | null {
    if (pair.result === 'won') return 'a';
    if (pair.result === 'lost') return 'b';
    if (pair.result === 'halved') return null;
    const lead = pair.holes.reduce((sum, h) => sum + (h.pointsDelta ?? 0), 0);
    return lead > 0 ? 'a' : lead < 0 ? 'b' : null;
}

function matchRow(
    pair: PairBallResult,
    slot: TeamPointsSlotInput,
    cfg: MatchWinHalfConfig,
    teamName: (id: string) => string,
): TeamPointsRow {
    const label = `${sideLabel(pair.sideA, slot)} v ${sideLabel(pair.sideB, slot)}`;
    const a = teamOfBalls(pair.sideA.ballIds, slot);
    const b = teamOfBalls(pair.sideB.ballIds, slot);
    const problem = 'problem' in a ? a.problem : 'problem' in b ? b.problem : undefined;
    if (problem || 'problem' in a || 'problem' in b) {
        return { label, status: pair.summary, live: false, points: [], detail: '', problem };
    }
    if (a.teamId === b.teamId) {
        return {
            label,
            status: pair.summary,
            live: false,
            points: [],
            detail: '',
            problem: 'Both sides play for the same team',
        };
    }

    const live = pair.result === 'in_progress' && !slot.roundComplete;
    const started = pair.holes.some((h) => h.status !== null);
    const sides = {
        a: { name: sideLabel(pair.sideA, slot), teamId: a.teamId },
        b: { name: sideLabel(pair.sideB, slot), teamId: b.teamId },
    };
    if (pair.result === 'in_progress' && !started) {
        return {
            label,
            status: 'Not started',
            live: false,
            points: [],
            detail: '',
            versus: { ...sides, leader: null, standing: 'Not started', finished: false },
        };
    }

    const leader = leaderOf(pair);
    const halved = leader === null;
    const status = pair.result === 'halved' ? 'Halved' : pair.summary;
    const versus: TeamPointsVersus = { ...sides, leader, standing: status, finished: !live };
    if (halved) {
        return {
            label,
            status,
            live,
            points: [
                { teamId: a.teamId, points: cfg.half },
                { teamId: b.teamId, points: cfg.half },
            ],
            detail: `${live ? 'Level' : 'Halved'}: ${fmt(cfg.half)} each`,
            versus,
        };
    }
    const winner = leader === 'a' ? a.teamId : b.teamId;
    const loser = leader === 'a' ? b.teamId : a.teamId;
    return {
        label,
        status,
        live,
        points: [
            { teamId: winner, points: cfg.win },
            { teamId: loser, points: 0 },
        ],
        detail: `${teamName(winner)} ${live ? 'leads' : 'wins'}: ${fmt(cfg.win)}`,
        versus,
    };
}

const matchWinHalf: TeamPointsRule = {
    descriptor: {
        id: MATCH_WIN_HALF,
        label: 'Match points',
        labels: { en: 'Match points', sv: 'Matchpoäng' },
        description: 'Each match pays the winning team. A halved match splits.',
        appliesTo: 'match',
        configFields: [
            { kind: 'number', key: 'win', label: 'Win', default: 1, min: 0, step: 0.5 },
            { kind: 'number', key: 'half', label: 'Halved', default: 0.5, min: 0, step: 0.5 },
        ],
    },
    validateConfig(config) {
        const out: ConfigDiagnostic[] = [];
        if (config === null || config === undefined) return out;
        if (!isRecord(config)) {
            return [{ code: 'invalid_config', message: 'config must be an object' }];
        }
        nonNegativeNumber(config, 'win', out);
        nonNegativeNumber(config, 'half', out);
        return out;
    },
    defaultConfig: () => ({ win: 1, half: 0.5 }),
    teamPoints(input: TeamPointsInput): TeamPointsRow[] {
        const slot = input.slot;
        if (!slot) return [];
        const cfg = matchConfig(input.config);
        const names = new Map(input.teams.map((t) => [t.teamId, t.name] as const));
        const teamName = (id: string): string => names.get(id) ?? id;
        return (slot.result.pairResults ?? []).map((pair) => matchRow(pair, slot, cfg, teamName));
    },
};

// --- ranked_winner ------------------------------------------------------------------

interface RankedWinnerConfig {
    points: number;
    count: number;
}

function rankedConfig(config: unknown): RankedWinnerConfig {
    const c = isRecord(config) ? config : {};
    return {
        points: typeof c.points === 'number' ? c.points : 1,
        count: typeof c.count === 'number' && c.count >= 1 ? Math.floor(c.count) : 1,
    };
}

/**
 * The total a slot ranks on, read from what the format emitted: `points` when
 * present (higher wins), else `net` (lower wins). A virtual side subject plays
 * off 0, so its net IS its aggregated value, gross basis included.
 */
function metricOf(ball: BallResult): { value: number | null; higherWins: boolean } | null {
    const points = ball.totals.find((t) => t.scoringType === 'points');
    if (points) return { value: points.value, higherWins: true };
    const net = ball.totals.find((t) => t.scoringType === 'net');
    if (net) return { value: net.value, higherWins: false };
    return null;
}

interface TeamTally {
    teamId: string;
    /** Counted subject totals, best first. */
    values: number[];
    holesPlayed: number[];
}

function rankedRow(
    slot: TeamPointsSlotInput,
    cfg: RankedWinnerConfig,
    teams: { teamId: string; name: string }[],
): TeamPointsRow {
    const blank = (status: string, problem?: string): TeamPointsRow => ({
        label: '',
        status,
        live: false,
        points: [],
        detail: '',
        ...(problem ? { problem } : {}),
    });

    let higherWins = true;
    const tallies = new Map<string, { value: number | null; holesPlayed: number }[]>();
    for (const ball of slot.result.ballResults) {
        const metric = metricOf(ball);
        if (!metric) return blank('No total', 'This game has no total to rank');
        higherWins = metric.higherWins;
        const team = teamOfBalls([ball.ballId], slot);
        if ('problem' in team) return blank('Teams not set', team.problem);
        const list = tallies.get(team.teamId) ?? [];
        list.push({ value: metric.value, holesPlayed: ball.holesPlayed });
        tallies.set(team.teamId, list);
    }
    const playing = teams.filter((t) => tallies.has(t.teamId));
    if (playing.length < 2) return blank('Teams not set', 'Fewer than two teams play this game');

    if (![...tallies.values()].some((list) => list.some((s) => s.holesPlayed > 0))) {
        return blank('Not started');
    }

    const better = (a: number, b: number): number => (higherWins ? b - a : a - b);
    const folded: TeamTally[] = [];
    for (const t of playing) {
        const counted = tallies
            .get(t.teamId)!
            .filter((s): s is { value: number; holesPlayed: number } => s.value !== null)
            .sort((a, b) => better(a.value, b.value))
            .slice(0, cfg.count);
        if (counted.length < cfg.count) {
            // A pickup or a missing score leaves a stroke total open. Final
            // only when the round is: until then it is simply still in play.
            return slot.roundComplete
                ? blank('No result', `${t.name} has fewer than ${cfg.count} complete totals`)
                : blank('In play');
        }
        folded.push({
            teamId: t.teamId,
            values: counted.map((s) => s.value),
            holesPlayed: counted.map((s) => s.holesPlayed),
        });
    }

    // Totals over different hole counts do not compare, so nothing is
    // projected until every counted subject is through the same hole.
    const through = new Set(folded.flatMap((f) => f.holesPlayed));
    if (through.size !== 1 && !slot.roundComplete) return blank('In play');

    const name = (id: string): string => teams.find((t) => t.teamId === id)?.name ?? id;
    const sums = folded.map((f) => ({ teamId: f.teamId, sum: f.values.reduce((a, b) => a + b, 0) }));
    const best = sums.reduce((a, b) => (better(a.sum, b.sum) <= 0 ? a : b)).sum;
    const winners = sums.filter((x) => x.sum === best);
    const share = cfg.points / winners.length;
    const live = !slot.roundComplete;
    const status = sums.map((x) => `${name(x.teamId)} ${fmt(x.sum)}`).join(' · ');
    const thru = live ? ` thru ${[...through][0]}` : '';
    const who = winners.map((w) => name(w.teamId)).join(' and ');
    // A bar has two halves, so only a two-team game gets one.
    const [first, second] = sums;
    const versus: TeamPointsVersus | undefined =
        sums.length === 2 && first && second
            ? {
                  a: { name: name(first.teamId), teamId: first.teamId, figure: fmt(first.sum) },
                  b: { name: name(second.teamId), teamId: second.teamId, figure: fmt(second.sum) },
                  leader: winners.length > 1 ? null : first.sum === best ? 'a' : 'b',
                  standing: live ? `thru ${[...through][0]}` : '',
                  finished: !live,
              }
            : undefined;
    return {
        label: '',
        status: `${status}${thru}`,
        live,
        points: sums.map((x) => ({ teamId: x.teamId, points: x.sum === best ? share : 0 })),
        detail:
            winners.length > 1
                ? `${who} ${live ? 'are level' : 'tie'}: ${fmt(share)} each`
                : `${who} ${live ? 'leads' : 'wins'}: ${fmt(cfg.points)}`,
        ...(versus ? { versus } : {}),
    };
}

const rankedWinner: TeamPointsRule = {
    descriptor: {
        id: RANKED_WINNER,
        label: 'Best team total',
        labels: { en: 'Best team total', sv: 'Bästa lagresultat' },
        description: 'The team with the best total takes the points. A tie splits them.',
        appliesTo: 'ranked',
        configFields: [
            { kind: 'number', key: 'points', label: 'Points', default: 1, min: 0, step: 0.5 },
            { kind: 'number', key: 'count', label: 'Scores counted per team', default: 1, min: 1, step: 1 },
        ],
    },
    validateConfig(config) {
        const out: ConfigDiagnostic[] = [];
        if (config === null || config === undefined) return out;
        if (!isRecord(config)) {
            return [{ code: 'invalid_config', message: 'config must be an object' }];
        }
        nonNegativeNumber(config, 'points', out);
        const count = config.count;
        if (count !== undefined && (typeof count !== 'number' || !Number.isInteger(count) || count < 1)) {
            out.push({ code: 'invalid_count', message: 'count must be a whole number ≥ 1', path: 'count' });
        }
        return out;
    },
    defaultConfig: () => ({ points: 1, count: 1 }),
    teamPoints(input: TeamPointsInput): TeamPointsRow[] {
        if (!input.slot) return [];
        return [rankedRow(input.slot, rankedConfig(input.config), input.teams)];
    },
};

// --- manual -----------------------------------------------------------------------------

function manualPoints(config: unknown): Record<string, number> {
    const raw = isRecord(config) && isRecord(config.points) ? config.points : {};
    const out: Record<string, number> = {};
    for (const [teamId, v] of Object.entries(raw)) {
        if (typeof v === 'number' && Number.isFinite(v)) out[teamId] = v;
    }
    return out;
}

const manual: TeamPointsRule = {
    descriptor: {
        id: MANUAL,
        label: 'Entered by hand',
        labels: { en: 'Entered by hand', sv: 'Anges för hand' },
        description: 'Type the points each team gets. For anything scored on paper.',
        appliesTo: 'none',
        configFields: [
            { kind: 'team_points', key: 'points', label: 'Points', step: 0.5 },
            { kind: 'text', key: 'note', label: 'Note' },
        ],
    },
    validateConfig(config) {
        if (config === null || config === undefined) return [];
        if (!isRecord(config)) {
            return [{ code: 'invalid_config', message: 'config must be an object' }];
        }
        const out: ConfigDiagnostic[] = [];
        if (config.points !== undefined) {
            if (!isRecord(config.points)) {
                out.push({ code: 'invalid_points', message: 'points must be an object', path: 'points' });
            } else {
                for (const [teamId, v] of Object.entries(config.points)) {
                    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
                        out.push({
                            code: 'invalid_points',
                            message: 'points must be a number ≥ 0',
                            path: `points.${teamId}`,
                        });
                    }
                }
            }
        }
        if (config.note !== undefined && typeof config.note !== 'string') {
            out.push({ code: 'invalid_note', message: 'note must be text', path: 'note' });
        }
        return out;
    },
    defaultConfig: () => ({ points: {}, note: '' }),
    teamPoints(input: TeamPointsInput): TeamPointsRow[] {
        const byTeam = manualPoints(input.config);
        const note = isRecord(input.config) && typeof input.config.note === 'string' ? input.config.note : '';
        // Series order, and only teams still in the series — a removed team's
        // stale entry must not resurface as points for nobody.
        const points = input.teams
            .filter((t) => byTeam[t.teamId] !== undefined)
            .map((t) => ({ teamId: t.teamId, points: byTeam[t.teamId]! }));
        return [
            {
                label: '',
                status: points.length > 0 ? 'Entered' : 'No points yet',
                live: false,
                points,
                detail: note,
            },
        ];
    },
};

export const BUILTIN_TEAM_POINTS_RULES: TeamPointsRule[] = [matchWinHalf, rankedWinner, manual];
