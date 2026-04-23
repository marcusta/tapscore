// Umbrella × 4-ball — 2v2 points-per-hole game with 5 categories and a
// "umbrella" (sweep) doubling rule.
//
// Phase 2.6b own-ball topology: ONE ball per producer; `SlotInput.teams`
// groups 2 own-balls per team and the slot must have exactly 2 teams.
// Per-hole supplemental data (GIR flag) rides on each ball's own scorecard
// `metadata.gir: boolean`.
//
// See module docstring in previous revisions for the full scoring
// semantics (categories, sweep, LG/LT tie handling). Only the input
// topology has changed: per-ball strokes are read directly from each
// own-ball's `holes` list (no source filtering on a shared team ball).

import type {
    CourseHole,
    FormatStrategy,
    HoleResult,
    BallInput,
    BallResult,
    SlotInput,
    SlotResult,
} from '../format';
import type { FormatSlot } from '../../services/round.service';
import { strokesGivenMap } from './_stableford-scoring';

export type UmbrellaBirdieRule = 'gross' | 'net';

function readBirdieRule(slot: FormatSlot): UmbrellaBirdieRule {
    const raw = slot.scopeConfig?.config?.birdieRule;
    if (raw === 'gross' || raw === 'net') return raw;
    if (raw === undefined) return 'gross';
    throw new Error(
        `umbrella slot #${slot.slotIndex}: unknown birdieRule ${JSON.stringify(raw)} — expected 'gross' or 'net'`,
    );
}

interface BallCtx {
    ball: BallInput;
    label: string;
    team: 'A' | 'B';
    teamSlot: 0 | 1;
    strokesByHole: Map<number, number>;
}

interface PlayerHoleScore {
    gross: number | null;
    net: number | null;
    contributed: boolean;
    gir: boolean;
}

function ballLabel(ball: BallInput): string {
    const link = (ball.players ?? [])[0];
    const id = link?.playerId ?? link?.guestPlayerId ?? ball.ballId;
    return `p:${id.slice(0, 6)}`;
}

function resolveBallCtx(
    ball: BallInput,
    courseHoles: CourseHole[],
    team: 'A' | 'B',
    teamSlot: 0 | 1,
): BallCtx {
    const link = (ball.players ?? [])[0];
    const ph = link?.playingHandicap ?? ball.playingHandicap ?? 0;
    return {
        ball,
        label: ballLabel(ball),
        team,
        teamSlot,
        strokesByHole: strokesGivenMap(ph, courseHoles),
    };
}

function playerHoleScore(ctx: BallCtx, ch: CourseHole): PlayerHoleScore {
    const row = ctx.ball.holes.find((h) => h.holeNumber === ch.holeNumber);
    const gir = row?.metadata?.gir === true;
    if (row === undefined) return { gross: null, net: null, contributed: false, gir };
    const strokes = row.strokes;
    if (strokes === null) return { gross: null, net: null, contributed: false, gir };
    if (strokes === 0) return { gross: null, net: null, contributed: false, gir };
    const given = ctx.strokesByHole.get(ch.holeNumber) ?? 0;
    return { gross: strokes, net: strokes - given, contributed: true, gir };
}

interface HoleCats {
    lg: number;
    lt: number;
    girA: number;
    girB: number;
    bird: number;
}

function zeroCats(): HoleCats {
    return { lg: 0, lt: 0, girA: 0, girB: 0, bird: 0 };
}

function sumCats(c: HoleCats): number {
    return c.lg + c.lt + c.girA + c.girB + c.bird;
}

interface PlayerNoteBits {
    label: string;
    gross: number | null;
    gir: boolean;
}

function formatBreakdown(
    teamPoints: number,
    holeNumber: number,
    sweep: boolean,
    cats: HoleCats,
    playerBits: PlayerNoteBits[],
): string {
    const parts: string[] = [];
    const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
    if (cats.lg > 0) parts.push(`LG ${fmt(cats.lg)}`);
    if (cats.lt > 0) parts.push(`LT ${fmt(cats.lt)}`);
    if (cats.girA > 0) parts.push(`GIR-A ${fmt(cats.girA)}`);
    if (cats.girB > 0) parts.push(`GIR-B ${fmt(cats.girB)}`);
    if (cats.bird > 0) parts.push(`BIRD ${fmt(cats.bird)}`);
    const catTotal = sumCats(cats);
    const catStr = parts.length === 0 ? '0' : parts.join(' + ');
    const playersStr = playerBits
        .map((p) => `${p.label}=${p.gross ?? '—'}${p.gir ? ' GIR' : ''}`)
        .join(', ');
    if (sweep) {
        return `${catStr} = ${fmt(catTotal)} × ${holeNumber} × 2 = ${fmt(teamPoints)} ☂ (${playersStr})`;
    }
    return `${catStr} = ${fmt(catTotal)} × ${holeNumber} = ${fmt(teamPoints)} (${playersStr})`;
}

interface ResolvedTeam {
    label: string;
    representativeBallId: string;
    ctx1: BallCtx;
    ctx2: BallCtx;
}

function resolveTeam(
    label: string,
    ballIds: string[],
    ballsById: Map<string, BallInput>,
    courseHoles: CourseHole[],
    team: 'A' | 'B',
    slot: FormatSlot,
): ResolvedTeam {
    if (ballIds.length !== 2) {
        throw new Error(
            `umbrella four-ball slot #${slot.slotIndex}: team '${label}' needs exactly 2 own-balls (got ${ballIds.length})`,
        );
    }
    const b1 = ballsById.get(ballIds[0]!);
    const b2 = ballsById.get(ballIds[1]!);
    if (!b1 || !b2) {
        throw new Error(
            `umbrella four-ball slot #${slot.slotIndex}: team '${label}' references ball id(s) not present in slot: ${ballIds.join(', ')}`,
        );
    }
    return {
        label,
        representativeBallId: b1.ballId,
        ctx1: resolveBallCtx(b1, courseHoles, team, 0),
        ctx2: resolveBallCtx(b2, courseHoles, team, 1),
    };
}

function hasAnyEvent(ctx: BallCtx, ch: CourseHole): boolean {
    return ctx.ball.holes.some((h) => h.holeNumber === ch.holeNumber);
}

export const umbrellaFourBall: FormatStrategy = {
    scoringMode: 'umbrella',
    teamShape: 'four_ball',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        const teams = input.teams ?? [];
        if (teams.length !== 2) {
            throw new Error(
                `umbrella four-ball slot #${slot.slotIndex}: needs exactly 2 team participants (got ${teams.length})`,
            );
        }
        const birdieRule = readBirdieRule(slot);
        const ballsById = new Map(input.balls.map((b) => [b.ballId, b]));
        const teamA = resolveTeam(teams[0]!.teamLabel, teams[0]!.ballIds, ballsById, input.courseHoles, 'A', slot);
        const teamB = resolveTeam(teams[1]!.teamLabel, teams[1]!.ballIds, ballsById, input.courseHoles, 'B', slot);

        const ordered = [...input.courseHoles].sort((x, y) => x.holeNumber - y.holeNumber);

        const holesA: HoleResult[] = [];
        const holesB: HoleResult[] = [];

        let totalA = 0;
        let totalB = 0;
        let holesPlayedA = 0;
        let holesPlayedB = 0;

        for (const ch of ordered) {
            const a1 = playerHoleScore(teamA.ctx1, ch);
            const a2 = playerHoleScore(teamA.ctx2, ch);
            const b1 = playerHoleScore(teamB.ctx1, ch);
            const b2 = playerHoleScore(teamB.ctx2, ch);

            const teamAPlayed = hasAnyEvent(teamA.ctx1, ch) || hasAnyEvent(teamA.ctx2, ch);
            const teamBPlayed = hasAnyEvent(teamB.ctx1, ch) || hasAnyEvent(teamB.ctx2, ch);
            if (teamAPlayed) holesPlayedA++;
            if (teamBPlayed) holesPlayedB++;

            const contribs: { team: 'A' | 'B'; gross: number }[] = [];
            if (a1.contributed && a1.gross !== null) contribs.push({ team: 'A', gross: a1.gross });
            if (a2.contributed && a2.gross !== null) contribs.push({ team: 'A', gross: a2.gross });
            if (b1.contributed && b1.gross !== null) contribs.push({ team: 'B', gross: b1.gross });
            if (b2.contributed && b2.gross !== null) contribs.push({ team: 'B', gross: b2.gross });

            const catsA = zeroCats();
            const catsB = zeroCats();

            if (contribs.length > 0) {
                const minGross = Math.min(...contribs.map((c) => c.gross));
                const winners = contribs.filter((c) => c.gross === minGross);
                const winnersA = winners.filter((w) => w.team === 'A').length;
                const winnersB = winners.filter((w) => w.team === 'B').length;
                catsA.lg = winnersA > 0 ? 1 : 0;
                catsB.lg = winnersB > 0 ? 1 : 0;
            }

            const teamATotal =
                a1.contributed && a2.contributed && a1.gross !== null && a2.gross !== null
                    ? a1.gross + a2.gross
                    : null;
            const teamBTotal =
                b1.contributed && b2.contributed && b1.gross !== null && b2.gross !== null
                    ? b1.gross + b2.gross
                    : null;
            if (teamATotal !== null && teamBTotal !== null) {
                if (teamATotal < teamBTotal) catsA.lt = 1;
                else if (teamATotal > teamBTotal) catsB.lt = 1;
                else {
                    catsA.lt = 1;
                    catsB.lt = 1;
                }
            } else if (teamATotal !== null) {
                catsA.lt = 1;
            } else if (teamBTotal !== null) {
                catsB.lt = 1;
            }

            catsA.girA = a1.gir ? 1 : 0;
            catsA.girB = a2.gir ? 1 : 0;
            catsB.girA = b1.gir ? 1 : 0;
            catsB.girB = b2.gir ? 1 : 0;

            const isBirdie = (s: PlayerHoleScore): boolean => {
                if (!s.contributed || s.gross === null) return false;
                if (birdieRule === 'gross') return s.gross <= ch.par - 1;
                return s.net !== null && s.net <= ch.par - 1;
            };
            catsA.bird = isBirdie(a1) || isBirdie(a2) ? 1 : 0;
            catsB.bird = isBirdie(b1) || isBirdie(b2) ? 1 : 0;

            const sumA = sumCats(catsA);
            const sumB = sumCats(catsB);
            const sweepA = sumA === 5;
            const sweepB = sumB === 5;
            const pointsA = sumA * ch.holeNumber * (sweepA ? 2 : 1);
            const pointsB = sumB * ch.holeNumber * (sweepB ? 2 : 1);

            totalA += pointsA;
            totalB += pointsB;

            const noteA = formatBreakdown(pointsA, ch.holeNumber, sweepA, catsA, [
                { label: teamA.ctx1.label, gross: a1.gross, gir: a1.gir },
                { label: teamA.ctx2.label, gross: a2.gross, gir: a2.gir },
            ]);
            const noteB = formatBreakdown(pointsB, ch.holeNumber, sweepB, catsB, [
                { label: teamB.ctx1.label, gross: b1.gross, gir: b1.gir },
                { label: teamB.ctx2.label, gross: b2.gross, gir: b2.gir },
            ]);

            holesA.push({
                holeNumber: ch.holeNumber,
                gross: teamATotal,
                net: null,
                points: pointsA,
                note: noteA,
            });
            holesB.push({
                holeNumber: ch.holeNumber,
                gross: teamBTotal,
                net: null,
                points: pointsB,
                note: noteB,
            });
        }

        const normalizedA = Math.max(0, totalA - totalB);
        const normalizedB = Math.max(0, totalB - totalA);

        const resultA: BallResult = {
            ballId: teamA.representativeBallId,
            slotIndex: slot.slotIndex,
            holes: holesA,
            totals: [{ scoringType: 'points', value: normalizedA }],
            holesPlayed: holesPlayedA,
        };
        const resultB: BallResult = {
            ballId: teamB.representativeBallId,
            slotIndex: slot.slotIndex,
            holes: holesB,
            totals: [{ scoringType: 'points', value: normalizedB }],
            holesPlayed: holesPlayedB,
        };
        return { ballResults: [resultA, resultB] };
    },
};
