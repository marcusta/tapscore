// Stableford × better-ball — 2-player teams, team points per hole = max of
// the two players' individual stableford points.
//
// Phase 2.6b own-ball topology: the compiler emits ONE ball per producer.
// This strategy iterates `SlotInput.teams` — each entry groups 2 own-ball
// ids into a team. Per team, we look up each own-ball's BallInput and read
// per-hole strokes directly off its `holes` list (no source filtering;
// own-balls don't populate the source columns).
//
// Validation: team shape is `better_ball`, `SlotInput.teams` must be
// present with at least one team, and every team must have exactly 2
// own-balls. Fewer / more → throws with the slot + team label.
//
// Totals: one `points` entry per team. `points` already sorts
// high-to-low in `leaderboard.ts`. Gross/net on each team `HoleResult`
// are set to the MIN of the two players' values — "best-ball gross/net"
// is a display convenience (the scorecard Gross/Net rows want something),
// not a leaderboard ranking dimension for a stableford slot. If one
// player has no gross (pickup / DNP / no event), the team's best-ball
// gross/net is simply the other player's value. Both null → both null.

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
import { strokesGivenMap, stablefordOutcome, type StablefordHoleOutcome } from './_stableford-scoring';

interface BallCtx {
    ball: BallInput;
    label: string;
    strokesByHole: Map<number, number>;
}

function ballLabel(ball: BallInput): string {
    if (ball.teamLabel && ball.teamLabel.length > 0) return ball.teamLabel;
    const link = (ball.players ?? [])[0];
    const id = link?.playerId ?? link?.guestPlayerId ?? ball.ballId;
    return `p:${id.slice(0, 6)}`;
}

function resolveCtx(ball: BallInput, courseHoles: CourseHole[]): BallCtx {
    const link = (ball.players ?? [])[0];
    const ph = link?.playingHandicap ?? ball.playingHandicap ?? 0;
    return {
        ball,
        label: ballLabel(ball),
        strokesByHole: strokesGivenMap(ph, courseHoles),
    };
}

function outcomeFor(ctx: BallCtx, ch: CourseHole): StablefordHoleOutcome {
    const row = ctx.ball.holes.find((h) => h.holeNumber === ch.holeNumber);
    const strokes = row === undefined ? undefined : row.strokes;
    return stablefordOutcome(strokes, ch, ctx.strokesByHole.get(ch.holeNumber) ?? 0);
}

function combineBestBall(
    a: StablefordHoleOutcome,
    b: StablefordHoleOutcome,
): { points: number | null; gross: number | null; net: number | null } {
    let points: number | null = null;
    if (a.points !== null && b.points !== null) points = Math.max(a.points, b.points);
    else if (a.points !== null) points = a.points;
    else if (b.points !== null) points = b.points;

    const pickMin = (x: number | null, y: number | null): number | null => {
        if (x !== null && y !== null) return Math.min(x, y);
        return x ?? y;
    };
    return { points, gross: pickMin(a.gross, b.gross), net: pickMin(a.net, b.net) };
}

function computeTeam(
    teamLabel: string,
    ballIds: string[],
    ballsById: Map<string, BallInput>,
    courseHoles: CourseHole[],
    slot: FormatSlot,
): BallResult {
    if (ballIds.length !== 2) {
        throw new Error(
            `stableford better-ball slot #${slot.slotIndex}: team '${teamLabel}' needs exactly 2 own-balls (got ${ballIds.length})`,
        );
    }
    const ballA = ballsById.get(ballIds[0]!);
    const ballB = ballsById.get(ballIds[1]!);
    if (!ballA || !ballB) {
        throw new Error(
            `stableford better-ball slot #${slot.slotIndex}: team '${teamLabel}' references ball id(s) not present in slot: ${ballIds.join(', ')}`,
        );
    }

    const ctxA = resolveCtx(ballA, courseHoles);
    const ctxB = resolveCtx(ballB, courseHoles);

    const resultHoles: HoleResult[] = [];
    let pointsTotal = 0;
    let pointsHasValue = false;
    let holesPlayed = 0;

    for (const ch of courseHoles) {
        const outA = outcomeFor(ctxA, ch);
        const outB = outcomeFor(ctxB, ch);
        const combined = combineBestBall(outA, outB);

        if (combined.points !== null) {
            pointsTotal += combined.points;
            pointsHasValue = true;
            holesPlayed++;
        }

        const describe = (o: StablefordHoleOutcome, label: string): string => {
            if (o.kind === 'scored') return `${label} ${o.points}`;
            if (o.kind === 'pickup') return `${label} 0 pickup`;
            if (o.kind === 'dnp') return `${label} dnp`;
            return `${label} —`;
        };
        const teamStr = combined.points === null ? '—' : String(combined.points);
        const note = `team ${teamStr} (${describe(outA, ctxA.label)}, ${describe(outB, ctxB.label)})`;

        resultHoles.push({
            holeNumber: ch.holeNumber,
            gross: combined.gross,
            net: combined.net,
            points: combined.points,
            note,
        });
    }

    // Representative ball id — use the first own-ball's id so leaderboard
    // keys stay stable across reads.
    return {
        ballId: ballA.ballId,
        slotIndex: slot.slotIndex,
        holes: resultHoles,
        totals: [
            {
                scoringType: 'points',
                value: pointsHasValue ? pointsTotal : null,
            },
        ],
        holesPlayed,
    };
}

export const stablefordBetterBall: FormatStrategy = {
    scoringMode: 'stableford',
    teamShape: 'better_ball',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        const teams = input.teams ?? [];
        if (teams.length === 0) {
            throw new Error(
                `stableford better-ball slot #${slot.slotIndex}: needs at least one team grouping (SlotInput.teams) — did the compiler emit slot_ball_teams?`,
            );
        }
        const ballsById = new Map(input.balls.map((b) => [b.ballId, b]));
        const ballResults = teams.map((t) =>
            computeTeam(t.teamLabel, t.ballIds, ballsById, input.courseHoles, slot),
        );
        return { ballResults };
    },
};
