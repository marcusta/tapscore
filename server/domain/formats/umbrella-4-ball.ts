// Umbrella × 4-ball — 2v2 points-per-hole game with 5 categories and a
// "umbrella" (sweep) doubling rule.
//
// Two teams of 2 players each (each team is one participant with exactly
// 2 player links — same shape as better-ball / Taliban). Per-player event
// sourcing drives every players' per-hole score via `sourcePlayerId` /
// `sourceGuestPlayerId`. Per-hole supplemental data (GIR flag) rides on
// the migration-014 `metadata` channel: `metadata.gir: boolean` per
// per-player event.
//
// --- Interpretation: 5 categories PER TEAM ---
//
// Each team has its own 5-category tally per hole:
//   (1) LG   — did a player on THIS team have the low individual gross
//              in the foursome? If tied, split proportional to team shares.
//   (2) LT   — was THIS team's 2-ball total (sum of both players' gross
//              on the hole) the low among the two teams? If tied, 0.5 each.
//              A team forfeits LT if either player has no contribution
//              (DNP / pickup / no event) — they can't form a 2-ball total.
//   (3) GIR-A — did THIS team's player A reach the green in regulation?
//              Read from `holeRow.metadata?.gir === true`. Missing → 0.
//   (4) GIR-B — did THIS team's player B reach the green in regulation?
//              Same rule.
//   (5) BIRD — did any player on THIS team score a (gross | net) birdie?
//              Controlled by `config.birdieRule: 'gross' | 'net'` (default
//              `'gross'`).
//
// Each category value is in [0, 1] and may be fractional (ties split).
// Hole points for a team = sum of its 5 category values × hole number.
//
// SWEEP (umbrella): when a team's category sum equals 5 — i.e. it wins
// all 5 of its own categories on a hole — the team's hole points double.
// The other team's categories are unrelated; they compute their own per-
// team sum and points independently.
//
// Running cumulative per-team total across 18 holes. Leaderboard = team
// points ranked high-to-low via `byScoringType: 'points'`.
//
// --- Edge cases ---
//
// Ties within LG:
//   - LG tied between players across teams → split proportional to how
//     many of the tied winners are on each team (Alice (A) + Carol (B)
//     tied → A: 0.5, B: 0.5). Alice + Bob (same team A) tied → A: 1.0,
//     B: 0.0 (team won; the category measures "a player on this team had
//     the low gross").
//   - All four players tied for low gross → A: 1.0, B: 1.0 (each team
//     has winners among its own players; the whole category goes to
//     both teams — arithmetic: winners-on-team-A / total-winners = 2/4
//     but conceptually this IS "a player on A had low gross" AND "a
//     player on B had low gross". Keep the same proportional rule:
//     2/4 = 0.5 each. Documented here; the point total is dull because
//     both teams get half a point on LG.)
//   NOTE: re-reading — the spec says "If tied across teams, split." For
//   "within team A tied", team A gets the full point. The general rule
//   that works: LG's award to team X = (winners on X) / (total winners).
//   This yields:
//     Alice ties Bob (both A): A gets 2/2 = 1.0, B gets 0/2 = 0.
//     Alice ties Carol (across): A = 1/2, B = 1/2.
//     All 4 tied: A = 2/4 = 0.5, B = 2/4 = 0.5.
//   Chosen for arithmetic consistency; documented in the per-hole note.
//
// Ties within LT (one team 2-ball total vs the other):
//   - A's sum < B's sum → A: 1, B: 0.
//   - A's sum == B's sum → 0.5 / 0.5.
//   - A's sum > B's sum → A: 0, B: 1.
//   - One team missing a player's gross → that team forfeits LT (other
//     team wins outright if that team has both players; else neither).
//
// GIR (per-player, per-team):
//   - Each of a team's two players has their OWN GIR category. Missing
//     metadata → `metadata?.gir === true` false → 0. Present + true → 1.
//   - No tie semantics — GIR is a per-player boolean.
//
// BIRD:
//   - Per team: "did any player on this team make a (gross | net) birdie
//     on this hole?" `gross` mode compares gross strokes ≤ par − 1.
//     `net` mode compares (gross − strokesGivenOnHole) ≤ par − 1.
//   - Missing contribution from a player → that player cannot trigger
//     BIRD (no stroke to compare).
//
// Pickup (strokes = 0) and DNP (strokes = null, or no event) both exclude
// the player from LG, LT contribution, and BIRD. GIR is independent of
// strokes — an event with metadata.gir=true but null strokes still gives
// the GIR point (though normally a player DNP-ing doesn't have a GIR
// row).
//
// --- Registration ---
//
// scoring mode: 'umbrella'. Team shape: 'four_ball' (underscored to match
// the rest of the codebase's kebab-to-snake convention). Registered in
// `../format.ts`.
//
// Add `umbrella` to `ScoringMode` and `four_ball` to `TeamShape` in
// `server/db/schema.ts` before using. Done as part of 2.5h.

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

interface PlayerCtx {
    label: string;
    link: ParticipantPlayerInput;
    team: 'A' | 'B';
    /** Slot within the team: index 0 = "player A of this team", 1 = "player B". */
    teamSlot: 0 | 1;
    strokesByHole: Map<number, number>;
    /** Pre-filtered to this player's own scorecard rows. */
    holes: ScorecardHole[];
}

interface PlayerHoleScore {
    gross: number | null;
    net: number | null;
    /** True when the player posted a playable gross (not DNP / pickup / no event). */
    contributed: boolean;
    /** metadata.gir === true (absent or not-true → false). */
    gir: boolean;
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
    team: 'A' | 'B',
    teamSlot: 0 | 1,
): PlayerCtx {
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
        team,
        teamSlot,
        strokesByHole: strokesGivenMap(ph, courseHoles),
        holes: playerHoles,
    };
}

/**
 * Per-hole read for one player. Contribution semantics:
 *   undefined → no event → no contribution
 *   null      → explicit DNP → no contribution
 *   0         → pickup → no contribution
 *   n > 0     → scored gross → contributed
 * GIR is read from the row's metadata regardless of the strokes value.
 */
function playerHoleScore(ctx: PlayerCtx, ch: CourseHole): PlayerHoleScore {
    const row = ctx.holes.find((h) => h.holeNumber === ch.holeNumber);
    const gir = row?.metadata?.gir === true;
    if (row === undefined) return { gross: null, net: null, contributed: false, gir };
    const strokes = row.strokes;
    if (strokes === null) return { gross: null, net: null, contributed: false, gir };
    if (strokes === 0) return { gross: null, net: null, contributed: false, gir };
    const given = ctx.strokesByHole.get(ch.holeNumber) ?? 0;
    return { gross: strokes, net: strokes - given, contributed: true, gir };
}

interface HoleCats {
    lg: number; // 0..1, possibly fractional
    lt: number;
    girA: number; // 0 or 1
    girB: number;
    bird: number; // 0 or 1
}

function zeroCats(): HoleCats {
    return { lg: 0, lt: 0, girA: 0, girB: 0, bird: 0 };
}

function sumCats(c: HoleCats): number {
    return c.lg + c.lt + c.girA + c.girB + c.bird;
}

function resolveParticipants(
    input: SlotInput,
    slot: FormatSlot,
): { teamA: ParticipantInput; teamB: ParticipantInput } {
    if (input.participants.length !== 2) {
        throw new Error(
            `umbrella four-ball slot #${slot.slotIndex}: needs exactly 2 team participants (got ${input.participants.length})`,
        );
    }
    const [teamA, teamB] = input.participants;
    const validate = (p: ParticipantInput) => {
        const links = p.players ?? [];
        if (links.length !== 2) {
            throw new Error(
                `umbrella four-ball slot #${slot.slotIndex}: participant ${p.participantId} needs exactly 2 player links (got ${links.length})`,
            );
        }
    };
    validate(teamA);
    validate(teamB);
    return { teamA, teamB };
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

export const umbrellaFourBall: FormatStrategy = {
    scoringMode: 'umbrella',
    teamShape: 'four_ball',
    compute(input: SlotInput, slot: FormatSlot): SlotResult {
        const { teamA, teamB } = resolveParticipants(input, slot);
        const birdieRule = readBirdieRule(slot);

        const linksA = teamA.players as ParticipantPlayerInput[];
        const linksB = teamB.players as ParticipantPlayerInput[];

        const ctxA1 = resolvePlayerCtx(linksA[0], teamA.playingHandicap, teamA.holes, input.courseHoles, 'A', 0);
        const ctxA2 = resolvePlayerCtx(linksA[1], teamA.playingHandicap, teamA.holes, input.courseHoles, 'A', 1);
        const ctxB1 = resolvePlayerCtx(linksB[0], teamB.playingHandicap, teamB.holes, input.courseHoles, 'B', 0);
        const ctxB2 = resolvePlayerCtx(linksB[1], teamB.playingHandicap, teamB.holes, input.courseHoles, 'B', 1);

        const ordered = [...input.courseHoles].sort((x, y) => x.holeNumber - y.holeNumber);

        const holesA: HoleResult[] = [];
        const holesB: HoleResult[] = [];

        let totalA = 0;
        let totalB = 0;
        let holesPlayedA = 0;
        let holesPlayedB = 0;

        for (const ch of ordered) {
            const a1 = playerHoleScore(ctxA1, ch);
            const a2 = playerHoleScore(ctxA2, ch);
            const b1 = playerHoleScore(ctxB1, ch);
            const b2 = playerHoleScore(ctxB2, ch);

            // "Played this hole" flag (for holesPlayed counter): at least
            // one player on the team posted an event for this hole (any
            // strokes value — DNP and pickup both count as played).
            const teamAPlayed = hasAnyEvent(ctxA1, ch) || hasAnyEvent(ctxA2, ch);
            const teamBPlayed = hasAnyEvent(ctxB1, ch) || hasAnyEvent(ctxB2, ch);
            if (teamAPlayed) holesPlayedA++;
            if (teamBPlayed) holesPlayedB++;

            // --- LG — low individual gross in the foursome ---
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
                const total = winners.length;
                const winnersA = winners.filter((w) => w.team === 'A').length;
                const winnersB = winners.filter((w) => w.team === 'B').length;
                catsA.lg = winnersA / total;
                catsB.lg = winnersB / total;
            }

            // --- LT — low 2-ball team total ---
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
                    catsA.lt = 0.5;
                    catsB.lt = 0.5;
                }
            } else if (teamATotal !== null) {
                catsA.lt = 1;
            } else if (teamBTotal !== null) {
                catsB.lt = 1;
            } // else both forfeit — LT stays 0 for both

            // --- GIR-A / GIR-B (per team) ---
            catsA.girA = a1.gir ? 1 : 0;
            catsA.girB = a2.gir ? 1 : 0;
            catsB.girA = b1.gir ? 1 : 0;
            catsB.girB = b2.gir ? 1 : 0;

            // --- BIRD — any player on team scored a (gross|net) birdie ---
            const isBirdie = (s: PlayerHoleScore): boolean => {
                if (!s.contributed || s.gross === null) return false;
                if (birdieRule === 'gross') return s.gross <= ch.par - 1;
                // net: compare net to par
                return s.net !== null && s.net <= ch.par - 1;
            };
            catsA.bird = isBirdie(a1) || isBirdie(a2) ? 1 : 0;
            catsB.bird = isBirdie(b1) || isBirdie(b2) ? 1 : 0;

            // --- Points (per team) ---
            const sumA = sumCats(catsA);
            const sumB = sumCats(catsB);
            const sweepA = sumA === 5;
            const sweepB = sumB === 5;
            const pointsA = sumA * ch.holeNumber * (sweepA ? 2 : 1);
            const pointsB = sumB * ch.holeNumber * (sweepB ? 2 : 1);

            totalA += pointsA;
            totalB += pointsB;

            const noteA = formatBreakdown(pointsA, ch.holeNumber, sweepA, catsA, [
                { label: ctxA1.label, gross: a1.gross, gir: a1.gir },
                { label: ctxA2.label, gross: a2.gross, gir: a2.gir },
            ]);
            const noteB = formatBreakdown(pointsB, ch.holeNumber, sweepB, catsB, [
                { label: ctxB1.label, gross: b1.gross, gir: b1.gir },
                { label: ctxB2.label, gross: b2.gross, gir: b2.gir },
            ]);

            holesA.push({
                holeNumber: ch.holeNumber,
                gross: teamATotal, // team LT (2-ball total) — for display; null if incomplete
                net: null, // umbrella's team total isn't expressed in net
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

        const resultA: ParticipantResult = {
            participantId: teamA.participantId,
            slotIndex: slot.slotIndex,
            holes: holesA,
            totals: [{ scoringType: 'points', value: totalA }],
            holesPlayed: holesPlayedA,
        };
        const resultB: ParticipantResult = {
            participantId: teamB.participantId,
            slotIndex: slot.slotIndex,
            holes: holesB,
            totals: [{ scoringType: 'points', value: totalB }],
            holesPlayed: holesPlayedB,
        };
        return { participantResults: [resultA, resultB] };
    },
};

function hasAnyEvent(ctx: PlayerCtx, ch: CourseHole): boolean {
    return ctx.holes.some((h) => h.holeNumber === ch.holeNumber);
}
