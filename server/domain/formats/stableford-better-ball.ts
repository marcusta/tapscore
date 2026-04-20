// Stableford × better-ball — 2-player teams, team points per hole = max of
// the two players' individual stableford points.
//
// Each player has their own ball, their own strokes given (from their own
// PH and the hole's SI), their own per-hole stableford outcome. The team
// takes the better score — one non-null contribution wins the hole; both
// null makes the team-hole null.
//
// This is the first strategy that reads per-player rows from a
// participant's scorecard. Since 2.5d the `scorecards` table is keyed by
// `(participant_id, hole, source_key)` — a better-ball team has two rows
// per hole, one per player source. This strategy groups them by source,
// runs a full stableford calculation per player with that player's own
// PH and strokes-given map, then picks the team's best points per hole.
//
// Validation: team shape is `better_ball` and we require exactly 2 player
// links on each participant. Fewer or more → throws with the slot + the
// participant id.
//
// Totals: one `points` entry per participant. `points` already sorts
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
    ParticipantInput,
    ParticipantPlayerInput,
    ParticipantResult,
    SlotInput,
    SlotResult,
} from '../format';
import type { FormatSlot } from '../../services/round.service';
import type { ScorecardHole } from '../../services/scorecard.service';
import { pickForSource } from '../../services/scorecard.service';
import { strokesGivenMap, stablefordOutcome, type StablefordHoleOutcome } from './_stableford-scoring';

interface PlayerCtx {
    /** Stable short display label for the note (first 8 of player id if nothing better). */
    label: string;
    link: ParticipantPlayerInput;
    strokesByHole: Map<number, number>;
    holes: ScorecardHole[]; // only this player's rows
}

function playerLabel(link: ParticipantPlayerInput): string {
    const id = link.playerId ?? link.guestPlayerId ?? 'unknown';
    return `p:${id.slice(0, 6)}`;
}

function resolvePlayerCtx(
    link: ParticipantPlayerInput,
    allHoles: ScorecardHole[],
    courseHoles: CourseHole[],
): PlayerCtx {
    const ph = link.playingHandicap ?? 0;
    // Filter the participant's scorecard rows down to this player's source.
    // `pickForSource` is row-level; we iterate it per hole below via the
    // holes it matches. For efficiency we pre-filter the flat list once.
    const playerHoles: ScorecardHole[] = [];
    for (const h of allHoles) {
        if (
            h.sourcePlayerId === link.playerId &&
            h.sourceGuestPlayerId === link.guestPlayerId
        ) {
            playerHoles.push(h);
        }
    }
    return {
        label: playerLabel(link),
        link,
        strokesByHole: strokesGivenMap(ph, courseHoles),
        holes: playerHoles,
    };
}

function outcomeFor(ctx: PlayerCtx, ch: CourseHole): StablefordHoleOutcome {
    // `pickForSource` would do a linear scan of the unfiltered list; we
    // already filtered in resolvePlayerCtx, so scan the short list here.
    const matching = ctx.holes.find((h) => h.holeNumber === ch.holeNumber);
    const strokes = matching === undefined ? undefined : matching.strokes;
    return stablefordOutcome(strokes, ch, ctx.strokesByHole.get(ch.holeNumber) ?? 0);
}

function combineBestBall(
    a: StablefordHoleOutcome,
    b: StablefordHoleOutcome,
): { points: number | null; gross: number | null; net: number | null } {
    // Points: max of the two non-null values; null if both null.
    let points: number | null = null;
    if (a.points !== null && b.points !== null) points = Math.max(a.points, b.points);
    else if (a.points !== null) points = a.points;
    else if (b.points !== null) points = b.points;

    // Best-ball gross/net: min of the two non-null strokes values (lower is
    // better); null if both null. Note: a scored hole has a gross; pickup,
    // DNP, and no_event all have null gross — so the team's "best-ball
    // gross" is the other player's gross when one of them didn't finish.
    const pickMin = (x: number | null, y: number | null): number | null => {
        if (x !== null && y !== null) return Math.min(x, y);
        return x ?? y;
    };
    return { points, gross: pickMin(a.gross, b.gross), net: pickMin(a.net, b.net) };
}

function computeTeam(
    input: ParticipantInput,
    courseHoles: CourseHole[],
    slot: FormatSlot,
): ParticipantResult {
    const links = input.players ?? [];
    if (links.length !== 2) {
        throw new Error(
            `stableford better-ball slot #${slot.slotIndex}: participant ${input.participantId} needs exactly 2 player links (got ${links.length})`,
        );
    }

    const [ctxA, ctxB] = [
        resolvePlayerCtx(links[0], input.holes, courseHoles),
        resolvePlayerCtx(links[1], input.holes, courseHoles),
    ];

    const resultHoles: HoleResult[] = [];
    let pointsTotal = 0;
    let pointsHasValue = false;
    // "holes played" from the team's perspective — any hole where at least
    // one player contributed a non-null points value (either a scored hole
    // or a pickup). A hole where both are DNP / no-event doesn't count.
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

        // Per-hole note: show the team's chosen points + each player's
        // individual contribution. Hand-verifiable at a glance.
        //   "team 3 (p:abc 3, p:def 1)"
        //   "team 2 (p:abc 0 pickup, p:def 2)"
        //   "team 3 (p:abc dnp, p:def 3)"
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

    return {
        participantId: input.participantId,
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

// Unused import guard — we document `pickForSource` as the alternative
// slicing API in the module comment. Strategies that don't pre-filter
// can call it row-by-row.
void pickForSource;

export const stablefordBetterBall: FormatStrategy = {
    scoringMode: 'stableford',
    teamShape: 'better_ball',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        const participantResults = input.participants.map((p) =>
            computeTeam(p, input.courseHoles, slot),
        );
        return { participantResults };
    },
};
