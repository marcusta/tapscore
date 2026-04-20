// Shared rendering helpers used by render-round.ts and render-all.ts.
// Pure functions + one `renderRoundHtml()` and `renderIndexHtml()` entry.
// All DB I/O happens via the passed-in services bundle (no imports of app
// composition root — keeps scripts decoupled from boot).

import type { Database } from '../server/db/schema';
import type { Kysely } from 'kysely';
import type { createServices } from '../server/services/index';
import type { Participant } from '../server/services/participant.service';
import type { Round } from '../server/services/round.service';
import type { Course } from '../server/services/course.service';
import type { Tee } from '../server/services/tee.service';
import type { Player } from '../server/services/player.service';
import type { GuestPlayer } from '../server/services/guest-player.service';
import type { Club } from '../server/services/club.service';
import type { ScoreEvent } from '../server/services/score-event.service';
import type { Scorecard, ScorecardHole } from '../server/services/scorecard.service';
import type { Leaderboard } from '../server/domain/leaderboard';
import type { ParticipantResult, CourseHole, PairResult } from '../server/domain/format';
import { courseHolesForRound } from '../server/domain/round-holes';
import { stablefordOutcome, type StablefordHoleOutcome } from '../server/domain/formats/_stableford-scoring';

export type Services = ReturnType<typeof createServices>;

// --- low-level helpers ---

export function esc(s: unknown): string {
    return String(s ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

export function short(id: string): string {
    return id.slice(0, 8);
}

function strokesCell(strokes: number | null | undefined): string {
    if (strokes === null || strokes === undefined) return '<span class="dnp">–</span>';
    if (strokes === 0) return '<span class="pickup">P</span>';
    return String(strokes);
}

function netCell(net: number | null): string {
    if (net === null) return '<span class="dnp">–</span>';
    return String(net);
}

interface HoleGroup {
    label: string; // "OUT" | "IN" | "TOT"
    holes: CourseHole[];
}

/**
 * For an 18-hole round (holes from both halves): OUT + IN + TOT columns.
 * For a 9-hole round (only one half): a single TOT column.
 * Keeps the scorecard visually honest — no 9 empty IN cells on a front_9.
 */
function splitHoleGroups(courseHoles: CourseHole[]): HoleGroup[] {
    const front = courseHoles.filter((h) => h.holeNumber <= 9);
    const back = courseHoles.filter((h) => h.holeNumber > 9);
    if (front.length > 0 && back.length > 0) {
        return [
            { label: 'OUT', holes: front },
            { label: 'IN', holes: back },
        ];
    }
    return [{ label: 'TOT', holes: courseHoles }];
}

function strokesGivenMap(
    playingHandicap: number | null,
    courseHoles: CourseHole[],
): Map<number, number> {
    const m = new Map<number, number>();
    const ph = playingHandicap ?? 0;
    const n = courseHoles.length;
    const baseline = n > 0 ? Math.floor(ph / n) : 0;
    const extras = n > 0 ? ((ph % n) + n) % n : 0;
    for (const ch of courseHoles) {
        const extra = ch.strokeIndex <= extras ? 1 : 0;
        m.set(ch.holeNumber, baseline + extra);
    }
    return m;
}

// --- shared CSS ---

const CSS = `
  :root { color-scheme: light dark; --muted: #888; --dim: #bbb; --border: #d0d0d0; --sum-bg: #f3f3f3; --link: #0366d6; }
  @media (prefers-color-scheme: dark) { :root { --border: #333; --sum-bg: #222; --dim: #555; --link: #58a6ff; } }
  body { font: 13px/1.4 -apple-system, system-ui, sans-serif; margin: 2rem; max-width: 1400px; }
  h1 { margin: 0 0 .25rem 0; }
  h1 .sub { font-size: .6em; color: var(--muted); font-weight: normal; }
  h2 { margin-top: 2rem; border-bottom: 1px solid var(--border); padding-bottom: .25rem; }
  section { margin-bottom: 2rem; }
  table { border-collapse: collapse; }
  .scorecard, .grid, .kv { border: 1px solid var(--border); }
  .scorecard th, .scorecard td { border: 1px solid var(--border); padding: 4px 8px; text-align: center; min-width: 28px; }
  .scorecard .rowlabel { text-align: left; background: var(--sum-bg); font-weight: 600; }
  .scorecard .sum { background: var(--sum-bg); font-weight: 600; }
  .scorecard .si, .scorecard .given { color: var(--muted); font-size: 11px; }
  .scorecard .dim td { color: var(--muted); }
  .grid th, .grid td { border: 1px solid var(--border); padding: 4px 8px; text-align: left; vertical-align: top; }
  .grid th { background: var(--sum-bg); }
  .kv th, .kv td { border: 1px solid var(--border); padding: 4px 8px; text-align: left; }
  .kv th { background: var(--sum-bg); min-width: 120px; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .muted { color: var(--muted); }
  .dnp { color: var(--dim); }
  .pickup { color: #c00; font-weight: bold; }
  .arithmetic { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: var(--muted); }
  .hint { color: var(--muted); font-size: 12px; }
  .scorecard-card { border: 1px solid var(--border); padding: 1rem; margin-bottom: 1rem; border-radius: 6px; }
  .scorecard-card header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .5rem; }
  .scorecard-card h3 { margin: 0; }
  .totals { list-style: none; padding: 0; margin: .5rem 0 0 0; display: flex; gap: 1rem; }
  .lb-row { display: flex; gap: 2rem; flex-wrap: wrap; }
  .lb-col { min-width: 320px; }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: var(--muted); }
`;

// --- index page ---

export interface IndexRow {
    round: Round;
    course: Course;
    club: Club | null;
    participantCount: number;
    eventCount: number;
}

export async function collectIndexRows(svc: Services): Promise<IndexRow[]> {
    const rounds = await svc.roundService.list();
    const courseById = new Map<string, Course>();
    const clubById = new Map<string, Club>();
    const rows: IndexRow[] = [];
    for (const r of rounds) {
        let course = courseById.get(r.courseId) ?? null;
        if (!course) {
            course = await svc.courseService.getById(r.courseId);
            if (course) courseById.set(r.courseId, course);
        }
        if (!course) continue;
        let club = clubById.get(course.clubId) ?? null;
        if (!club) {
            club = (await svc.clubService.list()).find((c) => c.id === course.clubId) ?? null;
            if (club) clubById.set(course.clubId, club);
        }
        const participants = await svc.participantService.listByRound(r.id);
        const events = await svc.scoreEventService.listByRound(r.id);
        rows.push({ round: r, course, club, participantCount: participants.length, eventCount: events.length });
    }
    return rows;
}

export function renderIndexHtml(rows: IndexRow[]): string {
    const body = rows
        .map((row) => {
            const slots = row.round.formatSlots
                .map((s) => `${s.scoringMode}×${s.teamShape}@${s.allowancePct}%`)
                .join(', ');
            return `
<tr>
  <td><a href="round-${short(row.round.id)}.html"><code>${esc(short(row.round.id))}</code></a></td>
  <td>${esc(row.round.date)}</td>
  <td>${esc(row.club?.name ?? '—')}</td>
  <td>${esc(row.course.name)}</td>
  <td>${esc(row.round.roundType)}</td>
  <td>${esc(row.round.venueType)}</td>
  <td>${esc(slots)}</td>
  <td>${esc(row.round.status)}</td>
  <td class="num">${row.participantCount}</td>
  <td class="num">${row.eventCount}</td>
</tr>`;
        })
        .join('');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Rounds — tapscore dev</title>
<style>${CSS}</style>
</head>
<body>
<h1>Rounds <span class="sub">${rows.length} total</span></h1>
<table class="grid">
  <thead>
    <tr>
      <th>id</th><th>date</th><th>club</th><th>course</th>
      <th>type</th><th>venue</th><th>format</th><th>status</th>
      <th>participants</th><th>events</th>
    </tr>
  </thead>
  <tbody>${body}</tbody>
</table>
<footer class="muted"><p>Generated ${new Date().toISOString()}</p></footer>
</body>
</html>`;
}

// --- round page ---

export interface RoundRenderContext {
    round: Round;
    course: Course;
    participants: Participant[];
    events: ScoreEvent[];
    leaderboard: Leaderboard;
    /** Raw per-participant scorecards (source-tagged rows). Better-ball renders per-player sub-rows from these. */
    scorecards: Scorecard[];
    playersById: Map<string, Player>;
    guestsById: Map<string, GuestPlayer>;
    teesById: Map<string, Tee>;
    dbPath: string;
}

export async function collectRoundContext(
    svc: Services,
    roundId: string,
    dbPath: string,
): Promise<RoundRenderContext> {
    const round = await svc.roundService.getById(roundId);
    if (!round) throw new Error(`round ${roundId} not found`);
    const course = await svc.courseService.getById(round.courseId);
    if (!course) throw new Error(`course ${round.courseId} not found`);
    const participants = await svc.participantService.listByRound(roundId);
    const events = await svc.scoreEventService.listByRound(roundId);
    const leaderboard = await svc.leaderboardService.forRound(roundId);
    const scorecards = await svc.scorecardService.forRound(roundId);

    const playerIds = new Set<string>();
    const guestIds = new Set<string>();
    const teeIds = new Set<string>();
    for (const p of participants) {
        if (p.teeIdSnapshot) teeIds.add(p.teeIdSnapshot);
        for (const link of p.players) {
            if (link.playerId) playerIds.add(link.playerId);
            if (link.guestPlayerId) guestIds.add(link.guestPlayerId);
        }
    }
    for (const e of events) if (e.recordedByPlayerId) playerIds.add(e.recordedByPlayerId);

    const playersById = new Map<string, Player>();
    for (const id of playerIds) {
        const p = await svc.playerService.getById(id);
        if (p) playersById.set(id, p);
    }
    const guestsById = new Map<string, GuestPlayer>();
    for (const id of guestIds) {
        const g = await svc.guestPlayerService.findById(id);
        if (g) guestsById.set(id, g);
    }
    const teesById = new Map<string, Tee>();
    for (const id of teeIds) {
        const t = await svc.teeService.getById(id);
        if (t) teesById.set(id, t);
    }

    return { round, course, participants, events, leaderboard, scorecards, playersById, guestsById, teesById, dbPath };
}

export function renderRoundHtml(ctx: RoundRenderContext): string {
    const { round, course, participants, events, leaderboard, scorecards, playersById, guestsById, teesById, dbPath } = ctx;
    const scorecardByParticipant = new Map(scorecards.map((sc) => [sc.participantId, sc]));

    // Better-ball detection — hoisted above `participantLabel` because the
    // label uses `&` between team members for better-ball.
    const isBetterBall =
        round.formatSlots[0]?.scoringMode === 'stableford' &&
        round.formatSlots[0]?.teamShape === 'better_ball';
    // Foursomes detection — alternate-shot teams render as individual
    // stroke-play cards (one Gross / Net row) but display both names in
    // the header (`"Alice & Bob"`) and show the allowance percentage.
    const isFoursomes =
        round.formatSlots[0]?.scoringMode === 'stroke_play' &&
        round.formatSlots[0]?.teamShape === 'foursomes';
    // Taliban detection — 2v2 match-play variant. Renders per-player
    // Gross/Net sub-rows (like better-ball) plus a team-level Status row
    // (`W+2` / `L` / `AS` / `W+5` per hole). Pair summary surfaces in the
    // Match results section of the leaderboard.
    const isTaliban =
        round.formatSlots[0]?.scoringMode === 'taliban' &&
        round.formatSlots[0]?.teamShape === 'better_ball';
    // Umbrella detection — 2v2 points-per-hole format with a 5-category
    // matrix per hole and a sweep doubler. Renders per-player Gross
    // sub-rows, a GIR sub-row per player (from `metadata.gir`), and a team
    // category matrix row (LG / LT / GA / GB / B) per hole plus a team
    // Points row with the umbrella multiplier badge on sweep holes.
    const isUmbrella =
        round.formatSlots[0]?.scoringMode === 'umbrella' &&
        round.formatSlots[0]?.teamShape === 'four_ball';
    const umbrellaBirdieRule =
        isUmbrella
            ? ((round.formatSlots[0]!.scopeConfig?.config?.birdieRule as string | undefined) ??
              'gross')
            : null;

    const participantLabel = (p: Participant): string => {
        const names = p.players.map((link) => {
            if (link.playerId) return playersById.get(link.playerId)?.displayName ?? `player:${short(link.playerId)}`;
            if (link.guestPlayerId) {
                const g = guestsById.get(link.guestPlayerId);
                return g ? `${g.displayName} (guest)` : `guest:${short(link.guestPlayerId)}`;
            }
            return '?';
        });
        if (!names.length) return `participant:${short(p.id)}`;
        // Team-shape formats use " & " between members; individual-shape
        // participants only ever have one name anyway, so the separator is
        // mostly cosmetic when there's 2+ players.
        const sep = isBetterBall || isFoursomes || isTaliban || isUmbrella ? ' & ' : ' + ';
        return names.join(sep);
    };
    const playerName = (id: string | null): string => {
        if (!id) return '—';
        return playersById.get(id)?.displayName ?? short(id);
    };

    const renderMeta = (): string => `
<section>
  <h2>Round</h2>
  <table class="kv">
    <tr><th>id</th><td><code>${esc(round.id)}</code></td></tr>
    <tr><th>course</th><td>${esc(course.name)} (${course.holeCount} holes)</td></tr>
    <tr><th>date</th><td>${esc(round.date)}</td></tr>
    <tr><th>type</th><td>${esc(round.roundType)}</td></tr>
    <tr><th>venue</th><td>${esc(round.venueType)}</td></tr>
    <tr><th>start list mode</th><td>${esc(round.startListMode)}</td></tr>
    <tr><th>status</th><td>${esc(round.status)}</td></tr>
    <tr><th>latest event</th><td><code>${esc(round.latestEventId ?? '—')}</code></td></tr>
    <tr><th>format slots</th><td>${round.formatSlots.map((s) => `#${s.slotIndex} ${esc(s.scoringMode)} × ${esc(s.teamShape)} @ ${s.allowancePct}%`).join('<br>')}</td></tr>
  </table>
</section>`;

    const allCourseHoles: CourseHole[] = course.holes.map((h) => ({
        holeNumber: h.holeNumber,
        par: h.par,
        strokeIndex: h.strokeIndex,
    }));
    const playedCourseHoles: CourseHole[] = courseHolesForRound(round.roundType, allCourseHoles);

    const renderCourseMetadata = (): string => {
        const groups = splitHoleGroups(playedCourseHoles);
        const includeTotColumn = groups.length > 1;
        const parTotal = playedCourseHoles.reduce((a, b) => a + b.par, 0);

        const headerCells = groups
            .map((g) => g.holes.map((h) => `<th>${h.holeNumber}</th>`).join('') + `<th class="sum">${g.label}</th>`)
            .join('');
        const parCells = groups
            .map((g) => g.holes.map((h) => `<td>${h.par}</td>`).join('') + `<td class="sum">${g.holes.reduce((a, b) => a + b.par, 0)}</td>`)
            .join('');
        const siCells = groups
            .map((g) => g.holes.map((h) => `<td class="si">${h.strokeIndex}</td>`).join('') + `<td class="sum"></td>`)
            .join('');
        const totHead = includeTotColumn ? `<th class="sum">TOT</th>` : '';
        const totPar = includeTotColumn ? `<td class="sum">${parTotal}</td>` : '';
        const totSi = includeTotColumn ? `<td class="sum"></td>` : '';

        return `
<section>
  <h2>Course — ${esc(course.name)} <span class="muted">· ${esc(round.roundType)} (${playedCourseHoles.length} holes)</span></h2>
  <table class="scorecard">
    <thead>
      <tr><th class="rowlabel">Hole</th>${headerCells}${totHead}</tr>
    </thead>
    <tbody>
      <tr><th class="rowlabel">Par</th>${parCells}${totPar}</tr>
      <tr><th class="rowlabel">SI</th>${siCells}${totSi}</tr>
    </tbody>
  </table>
</section>`;
    };

    const renderParticipantsTable = (): string => {
        const rows = participants.map((p) => {
            const tee = p.teeIdSnapshot ? teesById.get(p.teeIdSnapshot) : null;
            const teeLabel = tee ? tee.name : '—';
            let arithmetic = '—';
            if (p.handicapIndexSnapshot !== null && tee) {
                const lines: string[] = [];
                for (const r of tee.ratings) {
                    const raw = p.handicapIndexSnapshot * (r.slope / 113) + (r.courseRating - r.par);
                    lines.push(
                        `${r.gender}: ${p.handicapIndexSnapshot} × ${r.slope}/113 + (${r.courseRating} − ${r.par}) = ${raw.toFixed(2)} → ${Math.round(raw)}`,
                    );
                }
                arithmetic = lines.join('<br>');
            }
            return `
<tr>
  <td><code>${esc(short(p.id))}</code></td>
  <td>${esc(participantLabel(p))}</td>
  <td>${esc(p.teamLabel ?? '—')}</td>
  <td>${esc(p.categorySnapshot ?? '—')}</td>
  <td>${esc(teeLabel)}</td>
  <td class="num">${p.handicapIndexSnapshot ?? '—'}</td>
  <td class="num">${p.courseHandicapSnapshot ?? '—'}</td>
  <td class="num">${p.playingHandicapSnapshot ?? '—'}</td>
  <td class="arithmetic">${arithmetic}</td>
  <td>${p.isLocked ? '🔒' : ''} ${p.isDq ? 'DQ' : ''}</td>
</tr>`;
        });
        return `
<section>
  <h2>Participants</h2>
  <table class="grid">
    <thead>
      <tr>
        <th>id</th><th>players</th><th>team</th><th>category</th><th>tee (snap)</th>
        <th>H idx</th><th>CH</th><th>PH</th><th>WHS arithmetic (per rating)</th><th>flags</th>
      </tr>
    </thead>
    <tbody>${rows.join('')}</tbody>
  </table>
  <p class="hint">CH = round(index × slope/113 + (CR − par)). PH = round(CH × allowancePct/100).</p>
  <p class="hint">Scorecard cells: <code>–</code> = did not play, <code>P</code> = pickup (in the events log; in the Gross row it is resolved to par + 2 + strokes given per WHS net-double).</p>
</section>`;
    };

    const pairResultsByParticipant = new Map<string, PairResult>();
    for (const pr of leaderboard.pairResults) {
        pairResultsByParticipant.set(pr.participants[0], pr);
        pairResultsByParticipant.set(pr.participants[1], pr);
    }

    // Köpenhamnare: if the (current-stub) slot 0 is kopenhamnare × individual,
    // derive effective PH per participant for the card-header annotation. The
    // snapshot is always shown; the effective PH surfaces how delta_from_min
    // shifts it (e.g. snapshot PH=22, mode=delta_from_min → effective PH=17).
    const firstSlot = round.formatSlots[0];
    const isKopenhamnare =
        firstSlot?.scoringMode === 'kopenhamnare' && firstSlot?.teamShape === 'individual';
    const kopenHandicapMode =
        isKopenhamnare
            ? ((firstSlot.scopeConfig?.config?.handicapMode as string | undefined) ??
              'standard')
            : null;
    const effectivePHByParticipant = new Map<string, number | null>();
    if (isKopenhamnare) {
        const phs = participants.map((p) => p.playingHandicapSnapshot);
        if (kopenHandicapMode === 'delta_from_min') {
            const allNonNull = phs.every((v) => v !== null) && phs.length > 0;
            if (allNonNull) {
                const min = Math.min(...(phs as number[]));
                for (const p of participants) {
                    effectivePHByParticipant.set(
                        p.id,
                        (p.playingHandicapSnapshot as number) - min,
                    );
                }
            } else {
                for (const p of participants) effectivePHByParticipant.set(p.id, null);
            }
        } else {
            // standard — effective = snapshot.
            for (const p of participants) {
                effectivePHByParticipant.set(p.id, p.playingHandicapSnapshot);
            }
        }
    }

    const playerLinkLabel = (link: Participant['players'][number]): string => {
        if (link.playerId) return playersById.get(link.playerId)?.displayName ?? `player:${short(link.playerId)}`;
        if (link.guestPlayerId) {
            const g = guestsById.get(link.guestPlayerId);
            return g ? `${g.displayName} (guest)` : `guest:${short(link.guestPlayerId)}`;
        }
        return '?';
    };

    // Better-ball scorecard: 4 rows per player (Given / Gross / Net / Points)
    // plus 1 team Points row. Reads raw per-player scorecard rows from the
    // team participant's scorecard, runs the same stableford primitives the
    // strategy uses (`stablefordOutcome`), and emits the team row from the
    // already-computed `result`.
    const renderBetterBallScorecard = (
        result: ParticipantResult,
        p: Participant,
        courseHoles: CourseHole[],
    ): string => {
        const groups = splitHoleGroups(courseHoles);
        const includeTotColumn = groups.length > 1;

        const teamByHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
        const scorecard = scorecardByParticipant.get(p.id);
        const allRows = scorecard?.holes ?? [];

        const row = (
            label: string,
            cell: (h: CourseHole) => string,
            sum: (holes: CourseHole[]) => string,
            klass = '',
        ): string => {
            const groupSums = groups.map((g) => sum(g.holes));
            const groupCells = groups
                .map((g, i) => g.holes.map(cell).join('') + `<td class="sum">${groupSums[i]}</td>`)
                .join('');
            let totCell = '';
            if (includeTotColumn) {
                const nums = groupSums.filter((s) => s !== '—').map(Number);
                const tot = nums.length === 0 ? '—' : String(nums.reduce((a, b) => a + b, 0));
                totCell = `<td class="sum">${tot}</td>`;
            }
            return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${totCell}
</tr>`;
        };

        const headerCells = groups
            .map((g) => g.holes.map((h) => `<th>${h.holeNumber}</th>`).join('') + `<th class="sum">${g.label}</th>`)
            .join('');
        const holeHeader = `
<tr>
  <th class="rowlabel">Hole</th>
  ${headerCells}
  ${includeTotColumn ? '<th class="sum">TOT</th>' : ''}
</tr>`;

        const parRow = row('Par', (h) => `<td>${h.par}</td>`, (holes) => String(holes.reduce((a, b) => a + b.par, 0)));
        const siRow = row('SI', (h) => `<td class="si">${h.strokeIndex}</td>`, () => '—', 'dim');

        // Per-player sub-rows. Each player's strokes-given map is based on
        // their own PH (fallback: team PH, since per-player PH snapshots
        // don't exist yet — see leaderboard.service.ts).
        const playerBlocks = p.players.map((link) => {
            const name = playerLinkLabel(link);
            const playerPh = p.playingHandicapSnapshot ?? 0;
            const strokesGiven = strokesGivenMap(playerPh, allCourseHoles);
            // Source filter: pick this player's rows from the flat list.
            const playerRows: ScorecardHole[] = allRows.filter((h) => {
                if (link.playerId) return h.sourcePlayerId === link.playerId;
                if (link.guestPlayerId) return h.sourceGuestPlayerId === link.guestPlayerId;
                return false;
            });
            const playerRowByHole = new Map<number, ScorecardHole>();
            for (const r of playerRows) playerRowByHole.set(r.holeNumber, r);

            // Per-hole stableford outcomes for this player.
            const outcomeByHole = new Map<number, StablefordHoleOutcome>();
            for (const ch of allCourseHoles) {
                const row = playerRowByHole.get(ch.holeNumber);
                const strokes = row === undefined ? undefined : row.strokes;
                outcomeByHole.set(
                    ch.holeNumber,
                    stablefordOutcome(strokes, ch, strokesGiven.get(ch.holeNumber) ?? 0),
                );
            }

            const givenRow = row(
                `${esc(name)} Given`,
                (h) => {
                    const sg = strokesGiven.get(h.holeNumber) ?? 0;
                    return `<td class="given">${sg > 0 ? `+${sg}` : ''}</td>`;
                },
                () => '—',
                'dim',
            );
            const grossRow = row(
                `${esc(name)} Gross`,
                (h) => {
                    const o = outcomeByHole.get(h.holeNumber)!;
                    // "pickup" shows P; "dnp" and "no_event" show dash; scored shows gross.
                    if (o.kind === 'pickup') return `<td><span class="pickup">P</span></td>`;
                    return `<td>${strokesCell(o.gross)}</td>`;
                },
                (holes) => {
                    let total = 0;
                    let any = false;
                    for (const h of holes) {
                        const o = outcomeByHole.get(h.holeNumber)!;
                        if (o.gross !== null) {
                            total += o.gross;
                            any = true;
                        }
                    }
                    return any ? String(total) : '—';
                },
            );
            const netRow = row(
                `${esc(name)} Net`,
                (h) => {
                    const o = outcomeByHole.get(h.holeNumber)!;
                    return `<td>${netCell(o.net)}</td>`;
                },
                (holes) => {
                    let total = 0;
                    let any = false;
                    for (const h of holes) {
                        const o = outcomeByHole.get(h.holeNumber)!;
                        if (o.net !== null) {
                            total += o.net;
                            any = true;
                        }
                    }
                    return any ? String(total) : '—';
                },
            );
            const pointsRow = row(
                `${esc(name)} Points`,
                (h) => {
                    const o = outcomeByHole.get(h.holeNumber)!;
                    // Tooltip: per-player arithmetic.
                    let tip = '';
                    if (o.kind === 'scored') {
                        const diff = o.netPar - (o.gross as number);
                        const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
                        tip = `${o.points} pts (netPar ${o.netPar} − ${o.gross} = ${diffStr})`;
                    } else if (o.kind === 'pickup') {
                        tip = `0 pts (pickup, netPar ${o.netPar})`;
                    } else if (o.kind === 'dnp') {
                        tip = `DNP — null points`;
                    }
                    const title = tip ? ` title="${esc(tip)}"` : '';
                    return `<td${title}>${o.points ?? '—'}</td>`;
                },
                (holes) => {
                    let total = 0;
                    let any = false;
                    for (const h of holes) {
                        const o = outcomeByHole.get(h.holeNumber)!;
                        if (o.points !== null) {
                            total += o.points;
                            any = true;
                        }
                    }
                    return any ? String(total) : '—';
                },
            );
            return [givenRow, grossRow, netRow, pointsRow].join('');
        });

        // Team points row — uses the strategy's already-computed values.
        const teamRow = row(
            'Team Points',
            (h) => {
                const hr = teamByHole.get(h.holeNumber);
                const note = hr?.note ? ` title="${esc(hr.note)}"` : '';
                return `<td${note}><strong>${hr?.points ?? '—'}</strong></td>`;
            },
            (holes) => {
                let total = 0;
                let any = false;
                for (const h of holes) {
                    const hr = teamByHole.get(h.holeNumber);
                    if (hr?.points != null) {
                        total += hr.points;
                        any = true;
                    }
                }
                return any ? String(total) : '—';
            },
        );

        // Per-hole arithmetic line — team's chosen points + each player's share.
        const annotatedHoles = result.holes.filter((h) => h.note && h.points !== null);
        const arithmetic =
            annotatedHoles.length > 0
                ? `<p class="arithmetic">${annotatedHoles
                      .map((h) => `h${h.holeNumber}: ${esc(h.note!)}`)
                      .join(' · ')}</p>`
                : '';

        const totalsRow = result.totals
            .map((t) => `<li>${esc(t.scoringType)} = <strong>${t.value ?? '—'}</strong></li>`)
            .join('');

        return `
<article class="scorecard-card">
  <header>
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      slot #${result.slotIndex} · ${esc(round.formatSlots[0]?.scoringMode ?? '')} × ${esc(round.formatSlots[0]?.teamShape ?? '')} · team PH ${p.playingHandicapSnapshot ?? '—'} · holes played ${result.holesPlayed}
    </span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>
      ${parRow}
      ${siRow}
      ${playerBlocks.join('')}
      ${teamRow}
    </tbody>
  </table>
  ${arithmetic}
  <ul class="totals">${totalsRow}</ul>
</article>`;
    };

    const renderScorecard = (result: ParticipantResult, p: Participant, courseHoles: CourseHole[]): string => {
        const byHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
        const groups = splitHoleGroups(courseHoles);
        const includeTotColumn = groups.length > 1;
        // Allocation always against the full 18 SI distribution — a 9-hole round
        // inherits the strokes that fall on its holes, not a fresh 9-hole allocation.
        // For Köpenhamnare under delta_from_min, the Given row shows the EFFECTIVE
        // strokes (lowest-PH player plays off 0; others get their delta).
        const phForStrokes =
            isKopenhamnare && effectivePHByParticipant.has(p.id)
                ? (effectivePHByParticipant.get(p.id) ?? p.playingHandicapSnapshot)
                : p.playingHandicapSnapshot;
        const strokesGiven = strokesGivenMap(phForStrokes, allCourseHoles);
        // A Status row is rendered for pair-level formats (match-play today,
        // Taliban later) — we signal via participation in a pair result. The
        // strategy populates each `HoleResult.note` with the running status
        // from that participant's perspective (e.g. `1UP`, `AS`, `2DN`,
        // `dormie`). Stableford etc. also populate `note`, but for arithmetic;
        // they don't appear in pairResults so the Status row is skipped.
        const isPair = pairResultsByParticipant.has(p.id);

        const row = (
            label: string,
            cell: (h: CourseHole) => string,
            sum: (holes: CourseHole[]) => string,
            klass = '',
        ): string => {
            const groupSums = groups.map((g) => sum(g.holes));
            const groupCells = groups
                .map((g, i) => g.holes.map(cell).join('') + `<td class="sum">${groupSums[i]}</td>`)
                .join('');
            let totCell = '';
            if (includeTotColumn) {
                const nums = groupSums.filter((s) => s !== '—').map(Number);
                const tot = nums.length === 0 ? '—' : String(nums.reduce((a, b) => a + b, 0));
                totCell = `<td class="sum">${tot}</td>`;
            }
            return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${totCell}
</tr>`;
        };

        const headerCells = groups
            .map((g) => g.holes.map((h) => `<th>${h.holeNumber}</th>`).join('') + `<th class="sum">${g.label}</th>`)
            .join('');
        const holeHeader = `
<tr>
  <th class="rowlabel">Hole</th>
  ${headerCells}
  ${includeTotColumn ? '<th class="sum">TOT</th>' : ''}
</tr>`;

        const parRow = row('Par', (h) => `<td>${h.par}</td>`, (holes) => String(holes.reduce((a, b) => a + b.par, 0)));
        const siRow = row('SI', (h) => `<td class="si">${h.strokeIndex}</td>`, () => '—', 'dim');
        const strokesGivenRow = row(
            'Given',
            (h) => {
                const s = strokesGiven.get(h.holeNumber) ?? 0;
                return `<td class="given">${s > 0 ? `+${s}` : ''}</td>`;
            },
            () => '—',
            'dim',
        );

        const grossRow = row(
            'Gross',
            (h) => {
                const hr = byHole.get(h.holeNumber);
                return `<td>${strokesCell(hr?.gross ?? null)}</td>`;
            },
            (holes) => {
                const total = holes.reduce((acc, h) => {
                    const hr = byHole.get(h.holeNumber);
                    return hr?.gross != null ? acc + hr.gross : acc;
                }, 0);
                const any = holes.some((h) => byHole.get(h.holeNumber)?.gross != null);
                return any ? String(total) : '—';
            },
        );

        const netRow = row(
            'Net',
            (h) => {
                const hr = byHole.get(h.holeNumber);
                return `<td>${netCell(hr?.net ?? null)}</td>`;
            },
            (holes) => {
                const total = holes.reduce((acc, h) => {
                    const hr = byHole.get(h.holeNumber);
                    return hr?.net != null ? acc + hr.net : acc;
                }, 0);
                const any = holes.some((h) => byHole.get(h.holeNumber)?.net != null);
                return any ? String(total) : '—';
            },
        );

        const pointsAny = result.holes.some((h) => h.points !== null);
        const pointsRow = pointsAny
            ? row(
                  'Points',
                  (h) => {
                      const hr = byHole.get(h.holeNumber);
                      const note = hr?.note ? ` title="${esc(hr.note)}"` : '';
                      return `<td${note}>${hr?.points ?? '—'}</td>`;
                  },
                  (holes) => {
                      const total = holes.reduce((acc, h) => {
                          const hr = byHole.get(h.holeNumber);
                          return hr?.points != null ? acc + hr.points : acc;
                      }, 0);
                      const any = holes.some((h) => byHole.get(h.holeNumber)?.points != null);
                      return any ? String(total) : '—';
                  },
              )
            : '';

        const statusRow = isPair
            ? row(
                  'Status',
                  (h) => {
                      const hr = byHole.get(h.holeNumber);
                      return `<td class="status">${esc(hr?.note ?? '—')}</td>`;
                  },
                  () => '—',
              )
            : '';

        // When any hole carries a `note` (e.g. stableford arithmetic), surface
        // the per-hole breakdown under the scorecard so the points row's
        // numbers are immediately hand-verifiable.
        const annotatedHoles = result.holes.filter((h) => h.note && h.points !== null);
        const pointsArithmetic =
            annotatedHoles.length > 0
                ? `<p class="arithmetic">${annotatedHoles
                      .map((h) => `h${h.holeNumber}: ${esc(h.note!)}`)
                      .join(' · ')}</p>`
                : '';

        const totalsRow = result.totals
            .map((t) => `<li>${esc(t.scoringType)} = <strong>${t.value ?? '—'}</strong></li>`)
            .join('');

        // Köpenhamnare header annotation: declare mode + effective PH next to
        // the snapshot so the reader can see e.g. "PH 23 → eff 19 (delta_from_min)".
        const kopenAnnotation =
            isKopenhamnare
                ? (() => {
                      const eff = effectivePHByParticipant.get(p.id);
                      const modeLabel = esc(kopenHandicapMode ?? 'standard');
                      if (eff === undefined || eff === null) return ` · mode ${modeLabel}`;
                      if (p.playingHandicapSnapshot !== null && eff !== p.playingHandicapSnapshot) {
                          return ` · eff PH ${eff} (mode ${modeLabel})`;
                      }
                      return ` · eff PH ${eff} (mode ${modeLabel})`;
                  })()
                : '';

        // Foursomes header annotation: foursomes cards re-use the individual
        // scorecard layout (one ball → one Gross row, one Net row) but the
        // header should surface that this is a team format and the typical
        // 50% allowance.
        const slotFormat = round.formatSlots[result.slotIndex];
        const foursomesAnnotation =
            isFoursomes && slotFormat
                ? ` · ${esc(slotFormat.scoringMode)} × ${esc(slotFormat.teamShape)} @ ${slotFormat.allowancePct}%`
                : '';

        return `
<article class="scorecard-card">
  <header>
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      slot #${result.slotIndex}${foursomesAnnotation} · H idx ${p.handicapIndexSnapshot ?? '—'} · CH ${p.courseHandicapSnapshot ?? '—'} · PH ${p.playingHandicapSnapshot ?? '—'}${kopenAnnotation} · holes played ${result.holesPlayed}
    </span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>
      ${parRow}
      ${siRow}
      ${strokesGivenRow}
      ${grossRow}
      ${netRow}
      ${pointsRow}
      ${statusRow}
    </tbody>
  </table>
  ${pointsArithmetic}
  <ul class="totals">${totalsRow}</ul>
</article>`;
    };

    // Taliban scorecard: like better-ball (per-player Given / Gross / Net
    // sub-rows), but replaces the team Points row with a team Status row
    // (`W+2` / `L` / `AS` / `W+5 (down eagle)` per hole). Taliban is
    // pair-level — team points totals live in the Match results section
    // of the leaderboard, not here. `result.holes[i].note` already carries
    // the per-hole team-perspective status (strategy populates it).
    const renderTalibanScorecard = (
        result: ParticipantResult,
        p: Participant,
        courseHoles: CourseHole[],
    ): string => {
        const groups = splitHoleGroups(courseHoles);
        const includeTotColumn = groups.length > 1;

        const teamByHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
        const scorecard = scorecardByParticipant.get(p.id);
        const allRows = scorecard?.holes ?? [];

        const row = (
            label: string,
            cell: (h: CourseHole) => string,
            sum: (holes: CourseHole[]) => string,
            klass = '',
        ): string => {
            const groupSums = groups.map((g) => sum(g.holes));
            const groupCells = groups
                .map((g, i) => g.holes.map(cell).join('') + `<td class="sum">${groupSums[i]}</td>`)
                .join('');
            let totCell = '';
            if (includeTotColumn) {
                const nums = groupSums.filter((s) => s !== '—').map(Number);
                const tot = nums.length === 0 ? '—' : String(nums.reduce((a, b) => a + b, 0));
                totCell = `<td class="sum">${tot}</td>`;
            }
            return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${totCell}
</tr>`;
        };

        const headerCells = groups
            .map((g) => g.holes.map((h) => `<th>${h.holeNumber}</th>`).join('') + `<th class="sum">${g.label}</th>`)
            .join('');
        const holeHeader = `
<tr>
  <th class="rowlabel">Hole</th>
  ${headerCells}
  ${includeTotColumn ? '<th class="sum">TOT</th>' : ''}
</tr>`;

        const parRow = row('Par', (h) => `<td>${h.par}</td>`, (holes) => String(holes.reduce((a, b) => a + b.par, 0)));
        const siRow = row('SI', (h) => `<td class="si">${h.strokeIndex}</td>`, () => '—', 'dim');

        // Per-player sub-rows — Given / Gross / Net. No per-player Points
        // (Taliban has no per-player stableford-style points).
        const playerBlocks = p.players.map((link) => {
            const name = playerLinkLabel(link);
            const playerPh = p.playingHandicapSnapshot ?? 0;
            const strokesGiven = strokesGivenMap(playerPh, allCourseHoles);
            const playerRows: ScorecardHole[] = allRows.filter((h) => {
                if (link.playerId) return h.sourcePlayerId === link.playerId;
                if (link.guestPlayerId) return h.sourceGuestPlayerId === link.guestPlayerId;
                return false;
            });
            const playerRowByHole = new Map<number, ScorecardHole>();
            for (const r of playerRows) playerRowByHole.set(r.holeNumber, r);

            const givenRow = row(
                `${esc(name)} Given`,
                (h) => {
                    const sg = strokesGiven.get(h.holeNumber) ?? 0;
                    return `<td class="given">${sg > 0 ? `+${sg}` : ''}</td>`;
                },
                () => '—',
                'dim',
            );
            const grossRow = row(
                `${esc(name)} Gross`,
                (h) => {
                    const row = playerRowByHole.get(h.holeNumber);
                    if (!row) return `<td>${strokesCell(null)}</td>`;
                    return `<td>${strokesCell(row.strokes)}</td>`;
                },
                (holes) => {
                    let total = 0;
                    let any = false;
                    for (const h of holes) {
                        const row = playerRowByHole.get(h.holeNumber);
                        if (row && row.strokes !== null && row.strokes !== 0) {
                            total += row.strokes;
                            any = true;
                        }
                    }
                    return any ? String(total) : '—';
                },
            );
            const netRow = row(
                `${esc(name)} Net`,
                (h) => {
                    const row = playerRowByHole.get(h.holeNumber);
                    if (!row || row.strokes === null || row.strokes === 0) {
                        return `<td>${netCell(null)}</td>`;
                    }
                    const given = strokesGiven.get(h.holeNumber) ?? 0;
                    return `<td>${netCell(row.strokes - given)}</td>`;
                },
                (holes) => {
                    let total = 0;
                    let any = false;
                    for (const h of holes) {
                        const row = playerRowByHole.get(h.holeNumber);
                        if (row && row.strokes !== null && row.strokes !== 0) {
                            const given = strokesGiven.get(h.holeNumber) ?? 0;
                            total += row.strokes - given;
                            any = true;
                        }
                    }
                    return any ? String(total) : '—';
                },
            );
            return [givenRow, grossRow, netRow].join('');
        });

        // Team Status row — per-hole team-perspective annotation. No TOT
        // (team totals live in the Match results section).
        const statusRow = row(
            'Status',
            (h) => {
                const hr = teamByHole.get(h.holeNumber);
                const note = hr?.note ?? '—';
                return `<td class="status">${esc(note)}</td>`;
            },
            () => '—',
        );

        return `
<article class="scorecard-card">
  <header>
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      slot #${result.slotIndex} · ${esc(round.formatSlots[0]?.scoringMode ?? '')} × ${esc(round.formatSlots[0]?.teamShape ?? '')} @ ${round.formatSlots[0]?.allowancePct ?? 100}% · team PH ${p.playingHandicapSnapshot ?? '—'} · holes played ${result.holesPlayed}
    </span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>
      ${parRow}
      ${siRow}
      ${playerBlocks.join('')}
      ${statusRow}
    </tbody>
  </table>
</article>`;
    };

    // Umbrella scorecard: per-player Gross + GIR sub-rows, then a team
    // category matrix row per hole (LG / LT / GA / GB / B), then a team
    // Points row with sweep badge. Category matrix cells show ✓ / ½ / —
    // for each category, compact but legible. The team LT (2-ball total)
    // lives as the team's gross column (set by the strategy).
    const renderUmbrellaScorecard = (
        result: ParticipantResult,
        p: Participant,
        courseHoles: CourseHole[],
    ): string => {
        const groups = splitHoleGroups(courseHoles);
        const includeTotColumn = groups.length > 1;

        const teamByHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
        const scorecard = scorecardByParticipant.get(p.id);
        const allRows = scorecard?.holes ?? [];

        const row = (
            label: string,
            cell: (h: CourseHole) => string,
            sum: (holes: CourseHole[]) => string,
            klass = '',
        ): string => {
            const groupSums = groups.map((g) => sum(g.holes));
            const groupCells = groups
                .map((g, i) => g.holes.map(cell).join('') + `<td class="sum">${groupSums[i]}</td>`)
                .join('');
            let totCell = '';
            if (includeTotColumn) {
                const nums = groupSums.filter((s) => s !== '—').map(Number);
                const tot = nums.length === 0 ? '—' : String(nums.reduce((a, b) => a + b, 0));
                totCell = `<td class="sum">${tot}</td>`;
            }
            return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${totCell}
</tr>`;
        };

        const headerCells = groups
            .map((g) => g.holes.map((h) => `<th>${h.holeNumber}</th>`).join('') + `<th class="sum">${g.label}</th>`)
            .join('');
        const holeHeader = `
<tr>
  <th class="rowlabel">Hole</th>
  ${headerCells}
  ${includeTotColumn ? '<th class="sum">TOT</th>' : ''}
</tr>`;

        const parRow = row('Par', (h) => `<td>${h.par}</td>`, (holes) => String(holes.reduce((a, b) => a + b.par, 0)));
        const siRow = row('SI', (h) => `<td class="si">${h.strokeIndex}</td>`, () => '—', 'dim');

        const playerBlocks = p.players.map((link) => {
            const name = playerLinkLabel(link);
            const playerRows: ScorecardHole[] = allRows.filter((hole) => {
                if (link.playerId) return hole.sourcePlayerId === link.playerId;
                if (link.guestPlayerId) return hole.sourceGuestPlayerId === link.guestPlayerId;
                return false;
            });
            const byHole = new Map<number, ScorecardHole>();
            for (const r of playerRows) byHole.set(r.holeNumber, r);

            const grossRow = row(
                `${esc(name)} Gross`,
                (h) => {
                    const r = byHole.get(h.holeNumber);
                    if (!r) return `<td>${strokesCell(null)}</td>`;
                    return `<td>${strokesCell(r.strokes)}</td>`;
                },
                (holes) => {
                    let total = 0;
                    let any = false;
                    for (const h of holes) {
                        const r = byHole.get(h.holeNumber);
                        if (r && r.strokes !== null && r.strokes !== 0) {
                            total += r.strokes;
                            any = true;
                        }
                    }
                    return any ? String(total) : '—';
                },
            );
            const girRow = row(
                `${esc(name)} GIR`,
                (h) => {
                    const r = byHole.get(h.holeNumber);
                    const gir = r?.metadata?.gir === true;
                    return `<td class="given">${gir ? '✓' : ''}</td>`;
                },
                (holes) => {
                    let count = 0;
                    for (const h of holes) {
                        const r = byHole.get(h.holeNumber);
                        if (r?.metadata?.gir === true) count++;
                    }
                    return count > 0 ? String(count) : '—';
                },
                'dim',
            );
            return [grossRow, girRow].join('');
        });

        // Team LT (gross) row — 2-ball total per hole, drawn from the
        // strategy's `HoleResult.gross` (which Umbrella sets to the LT team
        // total when computable, null otherwise).
        const teamLtRow = row(
            'Team LT',
            (h) => {
                const hr = teamByHole.get(h.holeNumber);
                return `<td>${hr?.gross ?? '—'}</td>`;
            },
            (holes) => {
                let total = 0;
                let any = false;
                for (const h of holes) {
                    const hr = teamByHole.get(h.holeNumber);
                    if (hr?.gross != null) {
                        total += hr.gross;
                        any = true;
                    }
                }
                return any ? String(total) : '—';
            },
        );

        // Category matrix row — parse the per-hole `note` which carries
        // the breakdown produced by the strategy. The note format is:
        //   "LG 1 + LT 1 + GIR-A 1 + BIRD 1 = 4 × 3 = 12 (p:abc=3, p:def=4)"
        // or "LG 0.5 + LT 0.5 = 1.0 × 5 = 5 (..)"
        // We extract each category's value; empty values render as "—".
        const catMatrixRow = row(
            'Cat (LG/LT/GA/GB/B)',
            (h) => {
                const hr = teamByHole.get(h.holeNumber);
                if (!hr) return `<td class="given">—</td>`;
                const note = hr.note ?? '';
                const cell = (key: string): string => {
                    // `LG 1` / `LT 0.5` / `GIR-A 1` / `GIR-B 1` / `BIRD 1`
                    const re = new RegExp(`${key}\\s+([0-9]*\\.?[0-9]+)`);
                    const m = note.match(re);
                    if (!m) return '—';
                    const v = Number(m[1]);
                    if (v === 0) return '—';
                    if (v === 1) return '✓';
                    if (v === 0.5) return '½';
                    return m[1];
                };
                const compact = `${cell('LG')}${cell('LT')}${cell('GIR-A')}${cell('GIR-B')}${cell('BIRD')}`;
                return `<td class="arithmetic" title="${esc(note)}">${compact}</td>`;
            },
            () => '—',
            'dim',
        );

        // Team Points row with sweep badge.
        const teamPointsRow = row(
            'Team Points',
            (h) => {
                const hr = teamByHole.get(h.holeNumber);
                if (!hr || hr.points == null) return '<td>—</td>';
                const sweep = hr.note?.includes('☂') ?? false;
                const badge = sweep ? ' ☂' : '';
                return `<td title="${esc(hr.note ?? '')}"><strong>${hr.points}${badge}</strong></td>`;
            },
            (holes) => {
                let total = 0;
                let any = false;
                for (const h of holes) {
                    const hr = teamByHole.get(h.holeNumber);
                    if (hr?.points != null) {
                        total += hr.points;
                        any = true;
                    }
                }
                return any ? String(total) : '—';
            },
        );

        // Per-hole arithmetic line under the card for hand verification.
        const annotatedHoles = result.holes.filter((h) => h.note && h.points !== null && h.points !== 0);
        const arithmetic =
            annotatedHoles.length > 0
                ? `<p class="arithmetic">${annotatedHoles
                      .map((h) => `h${h.holeNumber}: ${esc(h.note!)}`)
                      .join(' · ')}</p>`
                : '';

        const totalsRow = result.totals
            .map((t) => `<li>${esc(t.scoringType)} = <strong>${t.value ?? '—'}</strong></li>`)
            .join('');

        const slotFormat = round.formatSlots[result.slotIndex];
        const umbrellaHeader =
            slotFormat
                ? `slot #${result.slotIndex} · ${esc(slotFormat.scoringMode)} × ${esc(slotFormat.teamShape)} @ ${slotFormat.allowancePct}% · birdieRule ${esc(umbrellaBirdieRule ?? 'gross')}`
                : `slot #${result.slotIndex}`;

        return `
<article class="scorecard-card">
  <header>
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      ${umbrellaHeader} · team PH ${p.playingHandicapSnapshot ?? '—'} · holes played ${result.holesPlayed}
    </span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>
      ${parRow}
      ${siRow}
      ${playerBlocks.join('')}
      ${teamLtRow}
      ${catMatrixRow}
      ${teamPointsRow}
    </tbody>
  </table>
  ${arithmetic}
  <ul class="totals">${totalsRow}</ul>
</article>`;
    };

    const renderScorecards = (): string => {
        const resultByParticipant = new Map(leaderboard.participantResults.map((r) => [r.participantId, r]));
        const cards = participants.map((p) => {
            const r = resultByParticipant.get(p.id);
            if (!r) return '';
            if (isBetterBall) return renderBetterBallScorecard(r, p, playedCourseHoles);
            if (isTaliban) return renderTalibanScorecard(r, p, playedCourseHoles);
            if (isUmbrella) return renderUmbrellaScorecard(r, p, playedCourseHoles);
            return renderScorecard(r, p, playedCourseHoles);
        });
        return `
<section>
  <h2>Scorecards</h2>
  ${cards.join('\n')}
</section>`;
    };

    const renderEvents = (): string => {
        const rows = events.map((e: ScoreEvent) => {
            const participant = participants.find((p) => p.id === e.participantId);
            return `
<tr>
  <td class="muted">${esc(e.recordedAt)}</td>
  <td>${esc(participant ? participantLabel(participant) : short(e.participantId))}</td>
  <td class="num">${e.hole}</td>
  <td class="num">${strokesCell(e.strokes)}</td>
  <td>${esc(e.eventType)}</td>
  <td>${esc(playerName(e.recordedByPlayerId))}</td>
  <td><code>${esc(e.clientEventId)}</code></td>
  <td><code>${esc(short(e.id))}</code></td>
</tr>`;
        });
        return `
<section>
  <h2>Events log (${events.length})</h2>
  <table class="grid">
    <thead><tr><th>recorded at</th><th>participant</th><th>hole</th><th>strokes</th><th>type</th><th>recorded by</th><th>client id</th><th>event id</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>
</section>`;
    };

    const renderLeaderboard = (): string => {
        const participantName = (id: string) => {
            const p = participants.find((x) => x.id === id);
            return p ? participantLabel(p) : short(id);
        };
        const sections = leaderboard.byScoringType.map((b) => {
            const rows = b.entries.map(
                (e) => `
<tr>
  <td class="num">${e.position}</td>
  <td>${esc(participantName(e.participantId))}</td>
  <td class="num">${e.total ?? '—'}</td>
  <td class="num muted">${e.holesPlayed}</td>
</tr>`,
            );
            return `
<div class="lb-col">
  <h3>${esc(b.scoringType)}</h3>
  <table class="grid">
    <thead><tr><th>pos</th><th>participant</th><th>total</th><th>holes</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>
</div>`;
        });

        const pairSection = leaderboard.pairResults.length > 0
            ? (() => {
                  const rows = leaderboard.pairResults.map((pr) => {
                      const a = participantName(pr.participants[0]);
                      const b = participantName(pr.participants[1]);
                      let line: string;
                      if (isTaliban) {
                          // Taliban's summary already is in the
                          // `"Alice & Bob 8 − 2 Carol & Dan"` shape — don't
                          // double-name. The strategy populated it using
                          // `teamLabel` / short ids.
                          line = esc(pr.summary);
                      } else if (pr.result === 'won') {
                          const winnerName = pr.winner === pr.participants[0] ? a : b;
                          const loserName = pr.winner === pr.participants[0] ? b : a;
                          line = `${esc(winnerName)} d. ${esc(loserName)}, ${esc(pr.summary)}`;
                      } else if (pr.result === 'lost') {
                          // Result is from A's perspective; this branch means B won.
                          line = `${esc(b)} d. ${esc(a)}, ${esc(pr.summary)}`;
                      } else if (pr.result === 'halved') {
                          line = `${esc(a)} & ${esc(b)} halved, ${esc(pr.summary)}`;
                      } else {
                          line = `${esc(a)} vs ${esc(b)}, ${esc(pr.summary)} (in progress)`;
                      }
                      return `<tr><td class="num muted">#${pr.slotIndex}</td><td>${line}</td></tr>`;
                  });
                  return `
<div class="lb-col" style="min-width: 420px;">
  <h3>Match results</h3>
  <table class="grid">
    <thead><tr><th>slot</th><th>result</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>
</div>`;
              })()
            : '';

        return `
<section>
  <h2>Leaderboard</h2>
  <div class="lb-row">${sections.join('')}${pairSection}</div>
</section>`;
    };

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Round ${short(round.id)} — ${esc(course.name)} — ${esc(round.date)}</title>
<style>${CSS}</style>
</head>
<body>
<p><a href="index.html">← all rounds</a></p>
<h1>
  Round ${esc(course.name)} · ${esc(round.date)}
  <span class="sub">${esc(round.roundType)} · ${esc(round.venueType)} · ${esc(round.status)} · <code>${esc(short(round.id))}</code></span>
</h1>
${renderMeta()}
${renderCourseMetadata()}
${renderParticipantsTable()}
${renderScorecards()}
${renderLeaderboard()}
${renderEvents()}
<footer class="muted">
  <p>Generated ${new Date().toISOString()} from <code>${esc(dbPath)}</code></p>
</footer>
</body>
</html>`;
}

export function openPathInBrowser(filePath: string): void {
    const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
    Bun.spawn([cmd, filePath]);
}

// Silence unused-import warnings for type-only imports referenced via services generics.
void (null as unknown as Kysely<Database>);
