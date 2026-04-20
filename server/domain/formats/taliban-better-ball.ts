// Taliban × better-ball — 2v2 match-play variant with running point state,
// gross-birdie / eagle bonuses, and a "down team" eagle multiplier.
//
// The slot must contain EXACTLY TWO team participants (pairs). Each team
// is one participant with exactly two player links. Team shape is
// `better_ball` — same event-sourcing shape as stableford-better-ball —
// so per-hole rows carry `sourcePlayerId` / `sourceGuestPlayerId` and we
// slice by source.
//
// --- Per-hole comparison ---
//
// For each hole we compute each player's per-hole GROSS and NET scores.
// "Net" = gross − strokes-given (strokes-given allocated by SI from each
// player's own playing handicap; fallback to team PH — see
// leaderboard.service.ts on per-player PH snapshots not existing yet).
//
// For each team we then compute:
//   - better-ball net  = min of the two players' net scores on the hole
//   - worse-ball net   = max of the two players' net scores on the hole
// A player who did not contribute (DNP / pickup / no event) is skipped —
// the team's better/worse are computed over only the players who DID play.
// If both players on a team did not play → that team has no ball this hole.
//
// Hole-winner decision:
//   1. If exactly ONE team has a ball, that team wins. (+1 point, no birdie/
//      eagle detection from the no-ball side — the winner's own gross-birdie/
//      eagle rule still applies to its own players.)
//   2. If both teams have a ball, compare better-ball nets. Lower net wins.
//   3. On a better-ball tie, compare worse-ball nets. Lower net wins.
//   4. On both-ball tie, hole is halved (0 points).
//
// --- Point values ---
//
// The winning team's points on a decided hole are:
//   - 1  — normal win (no gross birdie or eagle from any winning-team player)
//   - 2  — gross BIRDIE win: any player on the winning team (irrespective of
//          whether their score was the deciding ball) scored a gross value
//          ≤ par − 1 on this hole. NET birdies do not count.
//   - 2  — gross EAGLE win (any player gross ≤ par − 2) when the winning team
//          was UP or LEVEL going into this hole. A "level" eagle does NOT
//          get the 5-point bonus — the bonus is explicitly the comeback
//          trigger for the team that is STRICTLY down entering the hole.
//   - 5  — gross EAGLE win by the team strictly DOWN entering this hole.
//          This is the single "special" multiplier — a comeback eagle.
// Halved holes award 0 points to each side.
//
// Running state: point differential resets every hole based on the
// accumulated totals BEFORE applying this hole's points. So if team A is
// 1 down entering hole N and makes a gross eagle to win: A scores 5 here,
// A's new total = previous (−1) + 5 = +4 → A is now 4 up entering hole N+1.
//
// --- ParticipantResult shape ---
//
// Per-player `HoleResult.gross` / `.net` / `.points` are THAT PLAYER's own
// per-hole numbers — not the team's. (`.points` is null on Taliban — points
// accrue to the team, not the player.) `HoleResult.note` is the per-hole
// status from that participant's team perspective: `W+1` / `W+2` / `W+5
// (down eagle)` / `L` / `AS`. The per-participant `totals` array is
// empty (`[]`) — Taliban has no scalar per-participant scoring type; the
// team-level running total lives in `PairResult`.
//
// --- PairResult shape ---
//
// `participants` = [teamAId, teamBId] in the order they appear in the slot.
// `holes[i]` carries `status` from A's perspective (`won` / `lost` / `halved` /
// null), plus `fromA` / `fromB` = the points THIS HOLE awarded to each team
// (loser and halved both get 0; winner gets 1/2/5). `summary` is the golf-
// idiom running result `"{labelA} {ptsA} − {ptsB} {labelB}"` (e.g. `"Alice &
// Bob 7 − 3 Carol & Dan"`, `"Team-A 4 − 4 Team-B"`). `result` = `won` / `lost`
// from A's perspective when totals differ, `halved` when equal at the last
// hole, `in_progress` when any hole remains undecided. `winner` = the
// leading team's participantId (null on halved / in-progress).

import type {
    CourseHole,
    FormatStrategy,
    HoleResult,
    PairHoleResult,
    PairResult,
    ParticipantInput,
    ParticipantPlayerInput,
    ParticipantResult,
    SlotInput,
    SlotResult,
} from '../format';
import type { FormatSlot } from '../../services/round.service';
import type { ScorecardHole } from '../../services/scorecard.service';
import { strokesGivenMap } from './_stableford-scoring';

interface PlayerCtx {
    label: string;
    link: ParticipantPlayerInput;
    strokesByHole: Map<number, number>;
    /** Only this player's scorecard rows (pre-filtered by source). */
    holes: ScorecardHole[];
}

interface PlayerHoleScore {
    gross: number | null;
    net: number | null;
    /** True when the player posted a playable gross (not DNP / pickup / no event). */
    contributed: boolean;
}

interface TeamBall {
    better: number | null; // min of contributed nets, null when no contribution
    worse: number | null; // max of contributed nets
    /** Any winning-team player's gross on this hole (used for birdie/eagle detection). */
    minGross: number | null;
    /** A short label describing which player's gross triggered a birdie/eagle (for notes). */
    birdieBy: string | null;
    eagleBy: string | null;
}

function playerLabel(link: ParticipantPlayerInput): string {
    const id = link.playerId ?? link.guestPlayerId ?? 'unknown';
    return `p:${id.slice(0, 6)}`;
}

function resolvePlayerCtx(
    link: ParticipantPlayerInput,
    teamPH: number | null,
    allHoles: ScorecardHole[],
    courseHoles: CourseHole[],
): PlayerCtx {
    // Per-player PH fallback: if the link carries its own PH use it, else
    // inherit the team PH — same documented fallback as stableford-better-ball.
    const ph = link.playingHandicap ?? teamPH ?? 0;
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

/**
 * Per-hole gross/net for one player on one hole. Duplicates the net-calc
 * intentionally (see module comment — sharing with stableford's full
 * outcome type leaks points concerns into a non-stableford strategy).
 * Contribution semantics:
 *   undefined → no event → no contribution
 *   null      → explicit DNP → no contribution
 *   0         → pickup → no contribution (cannot win the hole for the team)
 *   n > 0     → scored gross → contribution = true
 */
function playerHoleScore(ctx: PlayerCtx, ch: CourseHole): PlayerHoleScore {
    const row = ctx.holes.find((h) => h.holeNumber === ch.holeNumber);
    if (row === undefined) return { gross: null, net: null, contributed: false };
    const strokes = row.strokes;
    if (strokes === null) return { gross: null, net: null, contributed: false };
    if (strokes === 0) return { gross: null, net: null, contributed: false };
    const given = ctx.strokesByHole.get(ch.holeNumber) ?? 0;
    return { gross: strokes, net: strokes - given, contributed: true };
}

function teamBall(
    scoreA: PlayerHoleScore,
    ctxA: PlayerCtx,
    scoreB: PlayerHoleScore,
    ctxB: PlayerCtx,
    ch: CourseHole,
): TeamBall {
    const contribs: { net: number; gross: number; label: string }[] = [];
    if (scoreA.contributed && scoreA.net !== null && scoreA.gross !== null) {
        contribs.push({ net: scoreA.net, gross: scoreA.gross, label: ctxA.label });
    }
    if (scoreB.contributed && scoreB.net !== null && scoreB.gross !== null) {
        contribs.push({ net: scoreB.net, gross: scoreB.gross, label: ctxB.label });
    }
    if (contribs.length === 0) {
        return { better: null, worse: null, minGross: null, birdieBy: null, eagleBy: null };
    }
    const nets = contribs.map((c) => c.net);
    const grosses = contribs.map((c) => c.gross);
    const better = Math.min(...nets);
    const worse = Math.max(...nets);
    const minGross = Math.min(...grosses);
    // Track which player's gross qualifies for birdie/eagle on this hole.
    // Prefer the eagle candidate's label; fall back to birdie candidate.
    let birdieBy: string | null = null;
    let eagleBy: string | null = null;
    for (const c of contribs) {
        if (c.gross <= ch.par - 2) {
            eagleBy = eagleBy ?? c.label;
        } else if (c.gross <= ch.par - 1) {
            birdieBy = birdieBy ?? c.label;
        }
    }
    return { better, worse, minGross, birdieBy, eagleBy };
}

function statusShort(s: 'won' | 'lost' | 'halved'): string {
    return s === 'won' ? 'W' : s === 'lost' ? 'L' : 'AS';
}

/** Drop " by <player>" attribution from noteDetail for the pair-cell view. */
function stripAttribution(detail: string): string {
    return detail.replaceAll(/ by p:[0-9a-f]+/g, '');
}

/**
 * Pair summary string. Format depends on state:
 *   - A leading, final:       "{labelA} +{delta} ({ptsA}-{ptsB}) {labelB}"
 *   - B leading, final:       "{labelA} ({ptsA}-{ptsB}) +{delta} {labelB}"
 *   - Tied, final:            "{labelA} AS {labelB}"
 *   - In progress (A up):     "{labelA} +{delta} thru {N} ({ptsA}-{ptsB}) {labelB}"
 *   - In progress (B up):     "{labelA} ({ptsA}-{ptsB}) thru {N} +{delta} {labelB}"
 *   - In progress tied:       "{labelA} AS thru {N} {labelB}"
 * The raw parenthesised score communicates HOW the delta was earned
 * (eagle-heavy = big spread) — delta alone hides that detail.
 */
function pairSummary(
    labelA: string,
    totalA: number,
    labelB: string,
    totalB: number,
    inProgress: boolean,
    holesDecided: number,
): string {
    const delta = Math.abs(totalA - totalB);
    const progressTag = inProgress ? ` thru ${holesDecided}` : '';
    if (totalA === totalB) {
        return `${labelA} AS${progressTag} ${labelB}`;
    }
    const raw = `(${totalA}-${totalB})`;
    if (totalA > totalB) {
        return `${labelA} +${delta}${progressTag} ${raw} ${labelB}`;
    }
    return `${labelA} ${raw}${progressTag} +${delta} ${labelB}`;
}

function participantLabel(p: ParticipantInput): string {
    // Short id for a readable default when no team label is available.
    return p.participantId.slice(0, 8);
}

function computePair(
    teamA: ParticipantInput,
    teamB: ParticipantInput,
    courseHoles: CourseHole[],
    slot: FormatSlot,
): { pair: PairResult; resultA: ParticipantResult; resultB: ParticipantResult } {
    const linksA = teamA.players ?? [];
    const linksB = teamB.players ?? [];
    if (linksA.length !== 2) {
        throw new Error(
            `taliban better-ball slot #${slot.slotIndex}: participant ${teamA.participantId} needs exactly 2 player links (got ${linksA.length})`,
        );
    }
    if (linksB.length !== 2) {
        throw new Error(
            `taliban better-ball slot #${slot.slotIndex}: participant ${teamB.participantId} needs exactly 2 player links (got ${linksB.length})`,
        );
    }

    const ctxA1 = resolvePlayerCtx(linksA[0], teamA.playingHandicap, teamA.holes, courseHoles);
    const ctxA2 = resolvePlayerCtx(linksA[1], teamA.playingHandicap, teamA.holes, courseHoles);
    const ctxB1 = resolvePlayerCtx(linksB[0], teamB.playingHandicap, teamB.holes, courseHoles);
    const ctxB2 = resolvePlayerCtx(linksB[1], teamB.playingHandicap, teamB.holes, courseHoles);

    const ordered = [...courseHoles].sort((x, y) => x.holeNumber - y.holeNumber);

    const pairHoles: PairHoleResult[] = [];
    // Per-player hole arrays — 2 players per team × 2 teams.
    const perPlayerHoles = new Map<string, HoleResult[]>();
    for (const l of [...linksA, ...linksB]) {
        perPlayerHoles.set(playerLabel(l), []);
    }

    let totalA = 0;
    let totalB = 0;

    let holesPlayedA1 = 0;
    let holesPlayedA2 = 0;
    let holesPlayedB1 = 0;
    let holesPlayedB2 = 0;

    for (const ch of ordered) {
        // Players' individual scores for this hole.
        const a1 = playerHoleScore(ctxA1, ch);
        const a2 = playerHoleScore(ctxA2, ch);
        const b1 = playerHoleScore(ctxB1, ch);
        const b2 = playerHoleScore(ctxB2, ch);
        if (a1.contributed || hasEvent(ctxA1, ch)) holesPlayedA1++;
        if (a2.contributed || hasEvent(ctxA2, ch)) holesPlayedA2++;
        if (b1.contributed || hasEvent(ctxB1, ch)) holesPlayedB1++;
        if (b2.contributed || hasEvent(ctxB2, ch)) holesPlayedB2++;

        const ballA = teamBall(a1, ctxA1, a2, ctxA2, ch);
        const ballB = teamBall(b1, ctxB1, b2, ctxB2, ch);

        // Running state BEFORE applying this hole — who is "down".
        const leadBefore = totalA - totalB; // +ve = A up entering hole
        const aDownBefore = leadBefore < 0;
        const bDownBefore = leadBefore > 0;

        // Decide winner.
        let status: 'won' | 'lost' | 'halved' | null = null;
        let pointsThisHole = 0;
        let awardTo: 'A' | 'B' | null = null;
        let noteDetail = '';

        const aHasBall = ballA.better !== null;
        const bHasBall = ballB.better !== null;

        if (!aHasBall && !bHasBall) {
            // Neither team played → undecided (running state unchanged).
            status = null;
            noteDetail = 'no ball (both teams)';
        } else if (aHasBall && !bHasBall) {
            awardTo = 'A';
            status = 'won';
            pointsThisHole = 1;
            noteDetail = 'no ball by B';
        } else if (!aHasBall && bHasBall) {
            awardTo = 'B';
            status = 'lost';
            pointsThisHole = 1;
            noteDetail = 'no ball by A';
        } else {
            // Both teams have a ball — compare.
            const bestA = ballA.better as number;
            const bestB = ballB.better as number;
            if (bestA < bestB) {
                awardTo = 'A';
                status = 'won';
            } else if (bestA > bestB) {
                awardTo = 'B';
                status = 'lost';
            } else {
                // Better-balls tied → compare worse-balls (if either team is
                // missing a worse-ball because only one player contributed,
                // the single contribution serves as both better and worse).
                const worseA = ballA.worse as number;
                const worseB = ballB.worse as number;
                if (worseA < worseB) {
                    awardTo = 'A';
                    status = 'won';
                    noteDetail = 'decided on worse-ball';
                } else if (worseA > worseB) {
                    awardTo = 'B';
                    status = 'lost';
                    noteDetail = 'decided on worse-ball';
                } else {
                    status = 'halved';
                }
            }

            if (awardTo !== null) {
                // Determine multiplier from winner's own team.
                const winnerBall = awardTo === 'A' ? ballA : ballB;
                const winnerIsDown =
                    (awardTo === 'A' && aDownBefore) || (awardTo === 'B' && bDownBefore);
                if (winnerBall.eagleBy !== null && winnerIsDown) {
                    pointsThisHole = 5;
                    noteDetail = noteDetail
                        ? `${noteDetail}, down-team eagle by ${winnerBall.eagleBy}`
                        : `down-team eagle by ${winnerBall.eagleBy}`;
                } else if (winnerBall.eagleBy !== null) {
                    // Up- or level-eagle → 2 points (same as birdie bucket).
                    pointsThisHole = 2;
                    noteDetail = noteDetail
                        ? `${noteDetail}, gross eagle by ${winnerBall.eagleBy}`
                        : `gross eagle by ${winnerBall.eagleBy}`;
                } else if (winnerBall.birdieBy !== null) {
                    pointsThisHole = 2;
                    noteDetail = noteDetail
                        ? `${noteDetail}, gross birdie by ${winnerBall.birdieBy}`
                        : `gross birdie by ${winnerBall.birdieBy}`;
                } else {
                    pointsThisHole = 1;
                }
            }
        }

        // Apply running state.
        let fromA = 0;
        let fromB = 0;
        if (awardTo === 'A') {
            fromA = pointsThisHole;
            totalA += pointsThisHole;
        } else if (awardTo === 'B') {
            fromB = pointsThisHole;
            totalB += pointsThisHole;
        }

        // Per-hole pair note: team-level delta + qualitative detail (bonus
        // trigger / tiebreaker). Running cumulative is rendered separately
        // as the "Match" row — don't duplicate here. Attribution-by-id is
        // stripped from `noteDetail` for the pair cell (the per-participant
        // notes keep it for the individual scorecards).
        const pairStatusStr =
            status === null
                ? 'pending'
                : status === 'halved'
                  ? 'halved'
                  : awardTo === 'A'
                    ? `A +${pointsThisHole}`
                    : `B +${pointsThisHole}`;
        const pairDetail = stripAttribution(noteDetail);
        const pairNote =
            status === null
                ? 'pending'
                : pairDetail
                  ? `${pairStatusStr} (${pairDetail})`
                  : pairStatusStr;

        // Signed A-perspective points for this hole — sum = running Match
        // row in the unified pair scorecard. null when the hole is undecided
        // (status === null); 0 on halved; ±1/±2/±5 otherwise.
        const pointsDelta: number | null =
            status === null ? null : awardTo === 'A' ? pointsThisHole : awardTo === 'B' ? -pointsThisHole : 0;
        pairHoles.push({
            holeNumber: ch.holeNumber,
            status,
            fromA,
            fromB,
            pointsDelta,
            note: pairNote,
        });

        // Per-participant per-hole notes.
        //   W+2 / W+5 / W+1 on winners, L on losers, AS on halved, pending on undecided.
        const aParticipantNote = formatParticipantNote('A', awardTo, pointsThisHole, status, noteDetail);
        const bParticipantNote = formatParticipantNote('B', awardTo, pointsThisHole, status, noteDetail);

        // Push per-player HoleResult rows — each player's own gross/net + the
        // team-perspective note. `points` is always null (team-level only).
        pushPlayerHole(perPlayerHoles, ctxA1, ch, a1, aParticipantNote);
        pushPlayerHole(perPlayerHoles, ctxA2, ch, a2, aParticipantNote);
        pushPlayerHole(perPlayerHoles, ctxB1, ch, b1, bParticipantNote);
        pushPlayerHole(perPlayerHoles, ctxB2, ch, b2, bParticipantNote);
    }

    // Team-level participant result: one row per hole carrying the TEAM's
    // perspective note (so the scorecard's Status row can render per-team).
    // Per-player gross/net on these rows isn't meaningful (team is per-player
    // on better-ball); we render the per-player rows in the render separately.
    // Use best-ball gross/net for display here (same pattern as stableford-
    // better-ball — a convenience for a TOT column).
    const holesA: HoleResult[] = teamHoleResults(pairHoles, 'A', courseHoles);
    const holesB: HoleResult[] = teamHoleResults(pairHoles, 'B', courseHoles);

    const allDecided = pairHoles.every((h) => h.status !== null);
    const inProgress = !allDecided;

    let result: 'won' | 'lost' | 'halved' | 'in_progress';
    let winner: string | null;
    if (inProgress) {
        result = 'in_progress';
        winner = null;
    } else if (totalA > totalB) {
        result = 'won';
        winner = teamA.participantId;
    } else if (totalA < totalB) {
        result = 'lost';
        winner = teamB.participantId;
    } else {
        result = 'halved';
        winner = null;
    }

    const labelA = teamA.teamLabel ?? undefined;
    const labelB = teamB.teamLabel ?? undefined;
    const displayA = labelA && labelA.length > 0 ? labelA : `Team-${participantLabel(teamA)}`;
    const displayB = labelB && labelB.length > 0 ? labelB : `Team-${participantLabel(teamB)}`;
    // Count holes actually decided (status !== null) — "thru N" tag for in-progress.
    const holesDecided = pairHoles.filter((h) => h.status !== null).length;
    const summary = pairSummary(displayA, totalA, displayB, totalB, inProgress, holesDecided);

    const pair: PairResult = {
        slotIndex: slot.slotIndex,
        participants: [teamA.participantId, teamB.participantId],
        holes: pairHoles,
        summary,
        result,
        winner,
    };

    const resultA: ParticipantResult = {
        participantId: teamA.participantId,
        slotIndex: slot.slotIndex,
        holes: holesA,
        totals: [],
        holesPlayed: Math.max(holesPlayedA1, holesPlayedA2),
    };
    const resultB: ParticipantResult = {
        participantId: teamB.participantId,
        slotIndex: slot.slotIndex,
        holes: holesB,
        totals: [],
        holesPlayed: Math.max(holesPlayedB1, holesPlayedB2),
    };

    // Unused: perPlayerHoles accumulates per-player detail for potential
    // future rendering. The render-side walks the scorecard directly (like
    // better-ball) so we don't need to surface per-player `HoleResult`s on
    // the team participant's result. Kept local to document the invariant.
    void perPlayerHoles;

    return { pair, resultA, resultB };
}

function pushPlayerHole(
    perPlayer: Map<string, HoleResult[]>,
    ctx: PlayerCtx,
    ch: CourseHole,
    score: PlayerHoleScore,
    note: string,
): void {
    const list = perPlayer.get(ctx.label);
    if (!list) return;
    list.push({
        holeNumber: ch.holeNumber,
        gross: score.gross,
        net: score.net,
        points: null,
        note,
    });
}

function formatParticipantNote(
    perspective: 'A' | 'B',
    awardTo: 'A' | 'B' | null,
    pointsThisHole: number,
    status: 'won' | 'lost' | 'halved' | null,
    detail: string,
): string {
    if (status === null) return 'pending';
    if (status === 'halved') return 'AS';
    const wonIt = awardTo === perspective;
    if (wonIt) {
        // Annotate the reason when the bonus fired.
        if (pointsThisHole === 5) return `W+5 (down eagle)`;
        if (pointsThisHole === 2 && detail.startsWith('gross eagle')) return `W+2 (eagle)`;
        if (pointsThisHole === 2) return `W+2 (birdie)`;
        return `W+${pointsThisHole}`;
    }
    return 'L';
}

function hasEvent(ctx: PlayerCtx, ch: CourseHole): boolean {
    return ctx.holes.some((h) => h.holeNumber === ch.holeNumber);
}

/**
 * Team-level HoleResults from the pair's per-hole output. Used for the
 * participant's own `holes` list so `render-lib` can read per-hole team
 * notes off `ParticipantResult.holes[].note`.
 *
 * `gross` / `net` on these rows are intentionally null — team-level gross/
 * net aren't a meaningful Taliban summary (we show per-player rows in the
 * render instead). `points` = team points earned THIS HOLE (for potential
 * future display; not used by any leaderboard totals since `totals` is []).
 */
function teamHoleResults(
    pairHoles: PairHoleResult[],
    perspective: 'A' | 'B',
    courseHoles: CourseHole[],
): HoleResult[] {
    const byHole = new Map(pairHoles.map((ph) => [ph.holeNumber, ph]));
    return courseHoles.map((ch) => {
        const ph = byHole.get(ch.holeNumber);
        if (!ph) {
            return { holeNumber: ch.holeNumber, gross: null, net: null, points: null };
        }
        const pts = perspective === 'A' ? ph.fromA : ph.fromB;
        // Perspective-aware note: for team A we take pair.note verbatim
        // (pair totals in note are `A-B`, so A's perspective matches);
        // for team B we reuse the same note — it carries both totals and
        // the reader can tell which side they are from the card header.
        // Use per-participant note via formatParticipantNote derived from
        // the pair's status — encode the simpler per-team status directly
        // here to avoid recomputing the detail.
        const status = ph.status;
        let note: string;
        if (status === null) note = 'pending';
        else if (status === 'halved') note = 'AS';
        else {
            const wonIt =
                (perspective === 'A' && status === 'won') ||
                (perspective === 'B' && status === 'lost');
            if (wonIt) {
                // Reconstruct the participant note from points-this-hole.
                const ptsWon = perspective === 'A' ? ph.fromA : ph.fromB;
                if (ptsWon === 5) note = 'W+5 (down eagle)';
                else if (ptsWon === 2) note = 'W+2';
                else note = `W+${ptsWon}`;
            } else {
                note = 'L';
            }
        }
        return {
            holeNumber: ch.holeNumber,
            gross: null,
            net: null,
            points: pts,
            note,
        };
    });
}

export const talibanBetterBall: FormatStrategy = {
    scoringMode: 'taliban',
    teamShape: 'better_ball',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        if (input.participants.length !== 2) {
            throw new Error(
                `taliban better-ball slot #${slot.slotIndex}: needs exactly 2 team participants (got ${input.participants.length})`,
            );
        }
        const [teamA, teamB] = input.participants;
        const { pair, resultA, resultB } = computePair(teamA, teamB, input.courseHoles, slot);
        return {
            participantResults: [resultA, resultB],
            pairResults: [pair],
        };
    },
};
