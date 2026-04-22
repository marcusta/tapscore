// Shared rendering helpers used by render-round.ts and render-all.ts.
// Pure functions + one `renderRoundHtml()` and `renderIndexHtml()` entry.
// All DB I/O happens via the passed-in services bundle (no imports of app
// composition root — keeps scripts decoupled from boot).

import type { Database } from '../server/db/schema';
import type { Kysely } from 'kysely';
import type { createServices } from '../server/services/index';
import type { Participant } from '../server/services/participant.service';
import type { ParticipantPlayerLink } from '../server/services/participant.service';
import type { Round } from '../server/services/round.service';
import type { Course } from '../server/services/course.service';
import type { Tee } from '../server/services/tee.service';
import type { Player } from '../server/services/player.service';
import type { GuestPlayer } from '../server/services/guest-player.service';
import type { Club } from '../server/services/club.service';
import type { ScoreEvent } from '../server/services/score-event.service';
import type { Scorecard, ScorecardHole } from '../server/services/scorecard.service';
import type { Leaderboard } from '../server/domain/leaderboard';
import type { ParticipantResult, CourseHole, PairResult, PairHoleResult, HoleResult } from '../server/domain/format';
import { courseHolesForRound } from '../server/domain/round-holes';
import { stablefordOutcome, type StablefordHoleOutcome } from '../server/domain/formats/_stableford-scoring';
import { normalizeMatchPlayHandicaps } from '../server/domain/formats/_match-play-handicap';

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

function numericCell(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatEventMetadata(metadata: Record<string, unknown> | null): string {
    if (metadata === null) return '<span class="muted">—</span>';
    const parts: string[] = [];
    for (const [k, v] of Object.entries(metadata)) {
        if (typeof v === 'boolean') parts.push(`${esc(k)}:${v ? '✓' : '✗'}`);
        else parts.push(`${esc(k)}:${esc(String(v))}`);
    }
    return `<code>${parts.join(' ')}</code>`;
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

type PairScorecardKind =
    | 'match_play_individual'
    | 'match_play_better_ball'
    | 'taliban_better_ball';

export function pairSideScorecardRows(
    kind: PairScorecardKind,
    link: ParticipantPlayerLink,
    allRows: ScorecardHole[],
): ScorecardHole[] {
    if (kind === 'match_play_individual') {
        // Individual match-play events are recorded against the participant
        // with null source columns, so the scorecard must read the shared
        // participant rows instead of filtering by player id.
        return allRows.filter(
            (h) => h.sourcePlayerId === null && h.sourceGuestPlayerId === null,
        );
    }
    return allRows.filter((h) => {
        if (link.playerId) return h.sourcePlayerId === link.playerId;
        if (link.guestPlayerId) return h.sourceGuestPlayerId === link.guestPlayerId;
        return h.sourcePlayerId === null && h.sourceGuestPlayerId === null;
    });
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
  .arithmetic .match { color: inherit; font-weight: 700; }
  .hint { color: var(--muted); font-size: 12px; }
  .scorecard-card { border: 1px solid var(--border); padding: 1rem; margin-bottom: 1rem; border-radius: 6px; }
  .scorecard-card header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .5rem; }
  .scorecard-card h3 { margin: 0; }
  .totals { list-style: none; padding: 0; margin: .5rem 0 0 0; display: flex; gap: 1rem; }
  .lb-row { display: flex; gap: 2rem; flex-wrap: wrap; }
  .lb-col { min-width: 320px; }
  .lb-slot { margin-bottom: 1.5rem; }
  .lb-slot h3 { font-size: 1em; margin: .25rem 0 .5rem 0; color: var(--muted); font-weight: 600; border-bottom: 1px dashed var(--border); padding-bottom: .25rem; }
  .lb-slot h4 { font-size: .9em; margin: 0 0 .25rem 0; text-transform: lowercase; }
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

function titleCaseWords(raw: string): string {
    return raw
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export function formatSlotSummary(
    slot: { scoringMode: string; teamShape: string; allowancePct: number },
): string {
    const key = `${slot.scoringMode}:${slot.teamShape}`;
    const label =
        key === 'stroke_play:individual'
            ? 'Stroke Play (Individual)'
            : key === 'stableford:individual'
              ? 'Stableford (Individual)'
              : key === 'stroke_play:foursomes'
                ? 'Stroke Play (Foursomes)'
                : key === 'stableford:better_ball'
                  ? 'Stableford (Better Ball)'
                  : key === 'match_play:individual'
                    ? 'Match Play (Individual)'
                    : key === 'match_play:better_ball'
                      ? 'Match Play (Better Ball)'
                      : key === 'taliban:better_ball'
                        ? 'Taliban (Better Ball)'
                        : key === 'kopenhamnare:individual'
                          ? 'Kopenhamnare (Individual)'
                          : key === 'umbrella:four_ball'
                            ? 'Umbrella (4-Ball)'
                            : key === 'umbrella:individual'
                              ? 'Umbrella (3-Player Individual)'
                              : `${titleCaseWords(slot.scoringMode)} x ${titleCaseWords(slot.teamShape)}`;
    return `${label} @ ${slot.allowancePct}%`;
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
                .map((s) => formatSlotSummary(s))
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

export interface RoundCourseHoleSnapshot {
    holeNumber: number;
    par: number;
    baseStrokeIndex: number;
}

export interface RoundTeeHoleSnapshot {
    teeId: string;
    holeNumber: number;
    lengthM: number;
    strokeIndexOverride: number | null;
}

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
    courseHolesSnapshot: RoundCourseHoleSnapshot[];
    teeHolesSnapshot: RoundTeeHoleSnapshot[];
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

    const courseHolesSnapshotRows = await svc.db
        .selectFrom('round_course_holes')
        .select(['hole_number', 'par', 'base_stroke_index'])
        .where('round_id', '=', roundId)
        .orderBy('hole_number')
        .execute();
    const courseHolesSnapshot: RoundCourseHoleSnapshot[] = courseHolesSnapshotRows.map((r) => ({
        holeNumber: r.hole_number,
        par: r.par,
        baseStrokeIndex: r.base_stroke_index,
    }));

    const teeHolesSnapshotRows = await svc.db
        .selectFrom('round_tee_holes')
        .select(['tee_id', 'hole_number', 'length_m', 'stroke_index_override'])
        .where('round_id', '=', roundId)
        .orderBy('tee_id')
        .orderBy('hole_number')
        .execute();
    const teeHolesSnapshot: RoundTeeHoleSnapshot[] = teeHolesSnapshotRows.map((r) => ({
        teeId: r.tee_id,
        holeNumber: r.hole_number,
        lengthM: r.length_m,
        strokeIndexOverride: r.stroke_index_override,
    }));

    return { round, course, participants, events, leaderboard, scorecards, playersById, guestsById, teesById, courseHolesSnapshot, teeHolesSnapshot, dbPath };
}

export function renderRoundHtml(ctx: RoundRenderContext): string {
    const { round, course, participants, events, leaderboard, scorecards, playersById, guestsById, teesById, courseHolesSnapshot, teeHolesSnapshot, dbPath } = ctx;
    const scorecardByParticipant = new Map(scorecards.map((sc) => [sc.participantId, sc]));

    // Per-participant slot lookup. Multi-slot rounds scope participants via
    // `scopeConfig.scope.participantIds` (same convention as
    // leaderboard.service.ts). Single-slot rounds without scope fall back
    // to "everyone in slot 0".
    const slotByParticipantId = new Map<string, typeof round.formatSlots[number]>();
    const singleSlotNoScope =
        round.formatSlots.length === 1 &&
        (round.formatSlots[0]!.scopeConfig?.scope?.participantIds ?? null) === null;
    if (singleSlotNoScope) {
        for (const p of participants) {
            slotByParticipantId.set(p.id, round.formatSlots[0]!);
        }
    } else {
        for (const p of participants) {
            const match = round.formatSlots.find((s) =>
                s.scopeConfig?.scope?.participantIds?.includes(p.id),
            );
            if (match) slotByParticipantId.set(p.id, match);
        }
    }

    // Per-participant format detection — a team-shape format in one slot must
    // not leak layout choices into another slot's participants. Each scorecard
    // variant asks its OWN slot what format it is.
    const isBetterBallSlot = (s: typeof round.formatSlots[number] | undefined): boolean =>
        s?.scoringMode === 'stableford' && s?.teamShape === 'better_ball';
    const isFoursomesSlot = (s: typeof round.formatSlots[number] | undefined): boolean =>
        s?.scoringMode === 'stroke_play' && s?.teamShape === 'foursomes';
    const isTalibanSlot = (s: typeof round.formatSlots[number] | undefined): boolean =>
        s?.scoringMode === 'taliban' && s?.teamShape === 'better_ball';
    const isUmbrellaFourBallSlot = (s: typeof round.formatSlots[number] | undefined): boolean =>
        s?.scoringMode === 'umbrella' && s?.teamShape === 'four_ball';
    const isUmbrellaIndividualSlot = (s: typeof round.formatSlots[number] | undefined): boolean =>
        s?.scoringMode === 'umbrella' && s?.teamShape === 'individual';
    const umbrellaBirdieRuleFor = (
        s: typeof round.formatSlots[number] | undefined,
    ): string | null =>
        s?.scoringMode === 'umbrella'
            ? ((s!.scopeConfig?.config?.birdieRule as string | undefined) ?? 'gross')
            : null;

    const isParticipantBetterBall = (p: Participant): boolean =>
        isBetterBallSlot(slotByParticipantId.get(p.id));
    const isParticipantFoursomes = (p: Participant): boolean =>
        isFoursomesSlot(slotByParticipantId.get(p.id));
    const isParticipantTaliban = (p: Participant): boolean =>
        isTalibanSlot(slotByParticipantId.get(p.id));
    const isParticipantUmbrellaFourBall = (p: Participant): boolean =>
        isUmbrellaFourBallSlot(slotByParticipantId.get(p.id));
    const isParticipantUmbrellaIndividual = (p: Participant): boolean =>
        isUmbrellaIndividualSlot(slotByParticipantId.get(p.id));
    const isParticipantUmbrella = (p: Participant): boolean =>
        isParticipantUmbrellaFourBall(p) || isParticipantUmbrellaIndividual(p);

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
        // mostly cosmetic when there's 2+ players. Detection is per-slot so
        // a foursomes team in slot #1 gets `&` even when slot #0 is singles.
        const teamShape =
            isParticipantBetterBall(p) ||
            isParticipantFoursomes(p) ||
            isParticipantTaliban(p) ||
            isParticipantUmbrella(p);
        const sep = teamShape ? ' & ' : ' + ';
        return names.join(sep);
    };
    const playerName = (id: string | null): string => {
        if (!id) return '—';
        return playersById.get(id)?.displayName ?? short(id);
    };

    const courseNameDiffers =
        round.courseNameSnapshot !== null && round.courseNameSnapshot !== course.name;
    const courseNameCell = round.courseNameSnapshot === null
        ? `${esc(course.name)} (${course.holeCount} holes) <span class="muted">· no snapshot yet (2.6a migration-only)</span>`
        : courseNameDiffers
          ? `${esc(course.name)} <span class="muted">(live)</span> <span class="match">· snapshot: ${esc(round.courseNameSnapshot)}</span>`
          : `${esc(course.name)} <span class="muted">· snapshot matches</span> (${course.holeCount} holes)`;

    const renderMeta = (): string => `
<section>
  <h2>Round</h2>
  <table class="kv">
    <tr><th>id</th><td><code>${esc(round.id)}</code></td></tr>
    <tr><th>course</th><td>${courseNameCell}</td></tr>
    <tr><th>date</th><td>${esc(round.date)}</td></tr>
    <tr><th>type</th><td>${esc(round.roundType)}</td></tr>
    <tr><th>venue</th><td>${esc(round.venueType)}</td></tr>
    <tr><th>start list mode</th><td>${esc(round.startListMode)}</td></tr>
    <tr><th>status</th><td>${esc(round.status)}</td></tr>
    <tr><th>latest event</th><td><code>${esc(round.latestEventId ?? '—')}</code></td></tr>
    <tr><th>format slots</th><td>${round.formatSlots.map((s) => `#${s.slotIndex} ${esc(formatSlotSummary(s))}`).join('<br>')}</td></tr>
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

    const renderSnapshotTables = (): string => {
        const courseSection = (() => {
            if (courseHolesSnapshot.length === 0) {
                return `
<section>
  <h2>Course hole snapshot <span class="muted">· round_course_holes</span></h2>
  <p class="muted">No snapshot rows yet. 2.6a is migration-only — live snapshot capture lands in 2.6b via the RoundCompiler. For now, run <code>bun scripts/backfill-round-snapshots.ts</code> on a seeded dev DB to populate snapshots for hand-verification.</p>
</section>`;
            }
            const rowsHtml = courseHolesSnapshot
                .map(
                    (h) => `<tr><td>${h.holeNumber}</td><td>${h.par}</td><td>${h.baseStrokeIndex}</td></tr>`,
                )
                .join('');
            return `
<section>
  <h2>Course hole snapshot <span class="muted">· round_course_holes (${courseHolesSnapshot.length} rows)</span></h2>
  <table class="grid">
    <thead><tr><th>hole</th><th>par</th><th>base SI</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</section>`;
        })();

        const teeSection = (() => {
            if (teeHolesSnapshot.length === 0) {
                return `
<section>
  <h2>Tee hole snapshot <span class="muted">· round_tee_holes</span></h2>
  <p class="muted">No snapshot rows yet — either no participant tees assigned yet, or this round pre-dates the 2.6a backfill. Live capture lands in 2.6b via the RoundCompiler.</p>
</section>`;
            }
            const byTee = new Map<string, RoundTeeHoleSnapshot[]>();
            for (const row of teeHolesSnapshot) {
                const bucket = byTee.get(row.teeId);
                if (bucket) bucket.push(row);
                else byTee.set(row.teeId, [row]);
            }
            const teeTables = Array.from(byTee.entries())
                .map(([teeId, rows]) => {
                    const tee = teesById.get(teeId);
                    const label = tee ? tee.name : `tee:${short(teeId)}`;
                    const body = rows
                        .map(
                            (r) =>
                                `<tr><td>${r.holeNumber}</td><td>${r.lengthM}</td><td>${r.strokeIndexOverride ?? '—'}</td></tr>`,
                        )
                        .join('');
                    return `
<h3>${esc(label)} <span class="muted">· ${rows.length} holes</span></h3>
<table class="grid">
  <thead><tr><th>hole</th><th>length (m)</th><th>SI override</th></tr></thead>
  <tbody>${body}</tbody>
</table>`;
                })
                .join('');
            return `
<section>
  <h2>Tee hole snapshot <span class="muted">· round_tee_holes (${teeHolesSnapshot.length} rows across ${byTee.size} tees)</span></h2>
  ${teeTables}
</section>`;
        })();

        return courseSection + teeSection;
    };

    const renderParticipantsTable = (): string => {
        const linkLabel = (link: Participant['players'][number]): string => {
            if (link.playerId) {
                return playersById.get(link.playerId)?.displayName ?? `player:${short(link.playerId)}`;
            }
            if (link.guestPlayerId) {
                const g = guestsById.get(link.guestPlayerId);
                return g ? `${g.displayName} (guest)` : `guest:${short(link.guestPlayerId)}`;
            }
            return '?';
        };

        const arithmeticLinesFor = (
            handicapIndexSnapshot: number | null,
            courseHandicapSnapshot: number | null,
            tee: Tee | null,
        ): { gender: string; arithmetic: string } => {
            if (handicapIndexSnapshot === null || !tee) {
                return { gender: '—', arithmetic: '—' };
            }
            const matchingGenders = new Set(
                tee.ratings
                    .filter((r) => {
                        const raw =
                            handicapIndexSnapshot * (r.slope / 113) +
                            (r.courseRating - r.par);
                        return Math.round(raw) === courseHandicapSnapshot;
                    })
                    .map((r) => r.gender),
            );
            const gender =
                matchingGenders.size === 0
                    ? '?'
                    : Array.from(matchingGenders).sort().join('/');
            const lines: string[] = [];
            for (const r of tee.ratings) {
                const raw =
                    handicapIndexSnapshot * (r.slope / 113) + (r.courseRating - r.par);
                const line =
                    `${r.gender}: ${handicapIndexSnapshot} × ${r.slope}/113 + (${r.courseRating} − ${r.par}) = ${raw.toFixed(2)} → ${Math.round(raw)}` +
                    (matchingGenders.has(r.gender)
                        ? matchingGenders.size === 1
                            ? ' ← CH'
                            : ' ← matches CH'
                        : '');
                lines.push(
                    matchingGenders.has(r.gender)
                        ? `<span class="match">${line}</span>`
                        : line,
                );
            }
            return { gender, arithmetic: lines.join('<br>') };
        };

        const rows = participants.map((p) => {
            const tee = p.teeIdSnapshot ? (teesById.get(p.teeIdSnapshot) ?? null) : null;
            const teeLabel = tee ? tee.name : '—';
            const effectivePH = effectivePHByParticipant.get(p.id);
            const linkSnapshots =
                p.players.length > 0
                    ? p.players.map((link) => ({
                          id: link.id,
                          label: linkLabel(link),
                          handicapIndexSnapshot:
                              link.handicapIndexSnapshot ??
                              (p.players.length === 1 ? p.handicapIndexSnapshot : null),
                          courseHandicapSnapshot:
                              link.courseHandicapSnapshot ??
                              (p.players.length === 1 ? p.courseHandicapSnapshot : null),
                          playingHandicapSnapshot:
                              link.playingHandicapSnapshot ??
                              (p.players.length === 1 ? p.playingHandicapSnapshot : null),
                      }))
                    : [
                          {
                              id: p.id,
                              label: participantLabel(p),
                              handicapIndexSnapshot: p.handicapIndexSnapshot,
                              courseHandicapSnapshot: p.courseHandicapSnapshot,
                              playingHandicapSnapshot: p.playingHandicapSnapshot,
                          },
                      ];
            const genderSet = new Set<string>();
            const arithmeticBlocks = linkSnapshots.map((linkSnap) => {
                const { gender, arithmetic } = arithmeticLinesFor(
                    linkSnap.handicapIndexSnapshot,
                    linkSnap.courseHandicapSnapshot,
                    tee,
                );
                if (gender !== '—') genderSet.add(gender);
                if (linkSnapshots.length === 1) return arithmetic;
                return `<strong>${esc(linkSnap.label)}</strong><br>${arithmetic}`;
            });
            const snapshotGender =
                genderSet.size === 0 ? '—' : Array.from(genderSet).sort().join('<br>');
            const hIdxCell = linkSnapshots
                .map((linkSnap) => numericCell(linkSnap.handicapIndexSnapshot))
                .join('<br>');
            const chCell = linkSnapshots
                .map((linkSnap) => numericCell(linkSnap.courseHandicapSnapshot))
                .join('<br>');
            const phCell = linkSnapshots
                .map((linkSnap) => {
                    const base = linkSnap.playingHandicapSnapshot;
                    const adjusted = p.players.length > 0
                        ? effectivePHByLinkId.get(linkSnap.id) ?? undefined
                        : undefined;
                    const effective =
                        adjusted ??
                        (linkSnapshots.length === 1 && effectivePH !== undefined
                            ? effectivePH
                            : base);
                    if (effective !== undefined && effective !== base) {
                        return `${numericCell(base)} <span class="muted">→ ${numericCell(effective)}</span>`;
                    }
                    return numericCell(base);
                })
                .join('<br>');
            return `
<tr>
  <td><code>${esc(short(p.id))}</code></td>
  <td>${esc(participantLabel(p))}</td>
  <td>${esc(p.teamLabel ?? '—')}</td>
  <td>${esc(p.categorySnapshot ?? '—')}</td>
  <td>${esc(teeLabel)}</td>
  <td>${snapshotGender}</td>
  <td class="num">${hIdxCell}</td>
  <td class="num">${chCell}</td>
  <td class="num">${phCell}</td>
  <td class="arithmetic">${arithmeticBlocks.join('<br><br>')}</td>
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
        <th>gender</th><th>H idx</th><th>CH</th><th>PH</th><th>WHS arithmetic (per rating)</th><th>flags</th>
      </tr>
    </thead>
    <tbody>${rows.join('')}</tbody>
  </table>
  <p class="hint">CH = round(index × slope/113 + (CR − par)). PH = round(CH × allowancePct/100).</p>
  <p class="hint">Match-play formats normalise PH within each match: the lowest PH plays off 0 and others receive only the difference.</p>
  <p class="hint">Gender is inferred from the tee-rating row(s) whose arithmetic matches the frozen course-handicap snapshot.</p>
  <p class="hint">In the arithmetic column, the line marked <strong>← CH</strong> is the tee-rating row that matches the frozen course-handicap snapshot.</p>
  <p class="hint">Scorecard cells: <code>–</code> = did not play, <code>P</code> = pickup (in the events log; in the Gross row it is resolved to par + 2 + strokes given per WHS net-double).</p>
</section>`;
    };

    const pairResultsByParticipant = new Map<string, PairResult>();
    for (const pr of leaderboard.pairResults) {
        pairResultsByParticipant.set(pr.participants[0], pr);
        pairResultsByParticipant.set(pr.participants[1], pr);
    }

    // Köpenhamnare: for any kopenhamnare × individual slot, derive effective
    // PH per participant for the card-header annotation. The snapshot is
    // always shown; the effective PH surfaces how delta_from_min shifts it
    // (e.g. snapshot PH=22, mode=delta_from_min → effective PH=17). Handled
    // per slot so a hypothetical multi-slot layout with two kopenhamnare
    // groups computes the min within each group.
    const isKopenhamnareSlot = (
        s: typeof round.formatSlots[number] | undefined,
    ): boolean => s?.scoringMode === 'kopenhamnare' && s?.teamShape === 'individual';
    const kopenHandicapModeFor = (
        s: typeof round.formatSlots[number] | undefined,
    ): string | null =>
        isKopenhamnareSlot(s)
            ? ((s!.scopeConfig?.config?.handicapMode as string | undefined) ??
              'standard')
            : null;
    const effectivePHByParticipant = new Map<string, number | null>();
    const effectivePHByLinkId = new Map<string, number | null>();
    for (const pr of leaderboard.pairResults) {
        const slot = round.formatSlots[pr.slotIndex];
        if (!(slot?.scoringMode === 'match_play')) continue;
        const [idA, idB] = pr.participants;
        const partA = participants.find((p) => p.id === idA);
        const partB = participants.find((p) => p.id === idB);
        if (!partA || !partB) continue;
        if (slot.teamShape === 'individual') {
            const [effectiveA, effectiveB] = normalizeMatchPlayHandicaps([
                partA.playingHandicapSnapshot,
                partB.playingHandicapSnapshot,
            ]);
            effectivePHByParticipant.set(idA, effectiveA);
            effectivePHByParticipant.set(idB, effectiveB);
            continue;
        }
        if (slot.teamShape === 'better_ball') {
            const allLinks = [
                ...partA.players.map((link) => ({
                    link,
                    ph: link.playingHandicapSnapshot ?? partA.playingHandicapSnapshot,
                })),
                ...partB.players.map((link) => ({
                    link,
                    ph: link.playingHandicapSnapshot ?? partB.playingHandicapSnapshot,
                })),
            ];
            const normalized = normalizeMatchPlayHandicaps(allLinks.map((entry) => entry.ph));
            for (let i = 0; i < allLinks.length; i++) {
                effectivePHByLinkId.set(allLinks[i]!.link.id, normalized[i] ?? null);
            }
        }
    }
    for (const slot of round.formatSlots) {
        if (!isKopenhamnareSlot(slot)) continue;
        const slotParticipants = participants.filter(
            (p) => slotByParticipantId.get(p.id) === slot,
        );
        const mode = kopenHandicapModeFor(slot);
        if (mode === 'delta_from_min') {
            const phs = slotParticipants.map((p) => p.playingHandicapSnapshot);
            const allNonNull = phs.every((v) => v !== null) && phs.length > 0;
            if (allNonNull) {
                const min = Math.min(...(phs as number[]));
                for (const p of slotParticipants) {
                    effectivePHByParticipant.set(
                        p.id,
                        (p.playingHandicapSnapshot as number) - min,
                    );
                }
            } else {
                for (const p of slotParticipants) effectivePHByParticipant.set(p.id, null);
            }
        } else {
            for (const p of slotParticipants) {
                effectivePHByParticipant.set(p.id, p.playingHandicapSnapshot);
            }
        }
    }

    // Match-style / head-to-head-ish formats benefit from a "running"
    // cumulative that is normalised to the current trailer, so the lowest
    // total is always 0 at any hole. Example:
    //   raw totals  [10, 8, 6] -> running [4, 2, 0]
    //   raw totals  [7, 4]     -> running [3, 0]
    //
    // This is rendered for:
    //   - Köpenhamnare (3-player match-style points race)
    //   - Umbrella (both 2v2 and 3-player individual variants)
    //
    // Pair formats (match-play, Taliban) compute the same idea from their
    // pair-level rows below because they don't expose participant `totals`
    // as points arrays.
    const normalizedRunningByParticipant = new Map<string, Map<number, number>>();
    const needsNormalizedRunning = (
        s: typeof round.formatSlots[number] | undefined,
    ): boolean =>
        isKopenhamnareSlot(s) ||
        s?.scoringMode === 'umbrella';
    for (const slot of round.formatSlots) {
        if (!needsNormalizedRunning(slot)) continue;
        const slotResults = leaderboard.participantResults.filter(
            (r) => r.slotIndex === slot.slotIndex,
        );
        if (slotResults.length === 0) continue;
        const rawTotals = new Map<string, number>();
        const holes = [...playedCourseHoles].sort((a, b) => a.holeNumber - b.holeNumber);
        for (const r of slotResults) {
            rawTotals.set(r.participantId, 0);
            normalizedRunningByParticipant.set(r.participantId, new Map());
        }
        for (const ch of holes) {
            for (const r of slotResults) {
                const hr = r.holes.find((h) => h.holeNumber === ch.holeNumber);
                if (hr?.points !== null && hr?.points !== undefined) {
                    rawTotals.set(
                        r.participantId,
                        (rawTotals.get(r.participantId) ?? 0) + hr.points,
                    );
                }
            }
            const min = Math.min(...slotResults.map((r) => rawTotals.get(r.participantId) ?? 0));
            for (const r of slotResults) {
                normalizedRunningByParticipant
                    .get(r.participantId)!
                    .set(ch.holeNumber, (rawTotals.get(r.participantId) ?? 0) - min);
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

    const playerPhSummary = (p: Participant): string =>
        p.players.length === 0
            ? `PH ${p.playingHandicapSnapshot ?? '—'}`
            : `player PH ${p.players
                  .map((link) => {
                      const base = link.playingHandicapSnapshot ?? p.playingHandicapSnapshot;
                      const adjusted = effectivePHByLinkId.get(link.id) ?? base;
                      if (adjusted !== base) return `${numericCell(base)} → ${numericCell(adjusted)}`;
                      return numericCell(base);
                  })
                  .join(' / ')}`;

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

        const stateRow = (
            label: string,
            cell: (h: CourseHole) => string,
            groupEnd: (holes: CourseHole[]) => string,
            totalEnd: string,
            klass = '',
        ): string => {
            const groupCells = groups
                .map((g) => g.holes.map(cell).join('') + `<td class="sum">${groupEnd(g.holes)}</td>`)
                .join('');
            return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${includeTotColumn ? `<td class="sum">${totalEnd}</td>` : ''}
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
        // their own frozen PH on the link row, with a team-PH fallback for
        // legacy rows that predate per-link snapshots.
        const playerBlocks = p.players.map((link) => {
            const name = playerLinkLabel(link);
            const playerPh = link.playingHandicapSnapshot ?? p.playingHandicapSnapshot ?? 0;
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

        const slotFormat = round.formatSlots[result.slotIndex];
        return `
<article class="scorecard-card">
  <header>
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      slot #${result.slotIndex} · ${esc(slotFormat?.scoringMode ?? '')} × ${esc(slotFormat?.teamShape ?? '')} · ${playerPhSummary(p)} · holes played ${result.holesPlayed}
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
        const participantSlot = slotByParticipantId.get(p.id);
        const isKopenhamnareParticipant = isKopenhamnareSlot(participantSlot);
        const phForStrokes = effectivePHByParticipant.has(p.id)
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

        const stateRow = (
            label: string,
            cell: (h: CourseHole) => string,
            groupEnd: (holes: CourseHole[]) => string,
            totalEnd: string,
            klass = '',
        ): string => {
            const groupCells = groups
                .map((g) => g.holes.map(cell).join('') + `<td class="sum">${groupEnd(g.holes)}</td>`)
                .join('');
            return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${includeTotColumn ? `<td class="sum">${totalEnd}</td>` : ''}
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

        const runningByHole = normalizedRunningByParticipant.get(p.id);
        const runningRow =
            pointsAny && runningByHole
                ? stateRow(
                      'Running',
                      (h) => `<td>${numericCell(runningByHole.get(h.holeNumber))}</td>`,
                      (holes) => {
                          const last = holes[holes.length - 1];
                          return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
                      },
                      (() => {
                          const last = courseHoles[courseHoles.length - 1];
                          return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
                      })(),
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
            isKopenhamnareParticipant
                ? (() => {
                      const eff = effectivePHByParticipant.get(p.id);
                      const modeLabel = esc(kopenHandicapModeFor(participantSlot) ?? 'standard');
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
            isFoursomesSlot(slotFormat) && slotFormat
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
      ${runningRow}
      ${statusRow}
    </tbody>
  </table>
  ${pointsArithmetic}
  <ul class="totals">${totalsRow}</ul>
</article>`;
    };

    const renderUmbrellaIndividualScorecard = (
        result: ParticipantResult,
        p: Participant,
        courseHoles: CourseHole[],
    ): string => {
        const byHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
        const groups = splitHoleGroups(courseHoles);
        const includeTotColumn = groups.length > 1;
        const strokesGiven = strokesGivenMap(p.playingHandicapSnapshot, allCourseHoles);
        const scorecard = scorecardByParticipant.get(p.id);
        const rawByHole = new Map(
            (scorecard?.holes ?? [])
                .filter((h) => h.sourcePlayerId === null && h.sourceGuestPlayerId === null)
                .map((h) => [h.holeNumber, h]),
        );

        const hasCat = (hr: HoleResult | undefined, cat: 'LG' | 'FWY' | 'GIR' | 'BIRD'): boolean =>
            hr?.note !== undefined ? new RegExp(`\\b${cat}\\b`).test(hr.note) : false;

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

        const stateRow = (
            label: string,
            cell: (h: CourseHole) => string,
            groupEnd: (holes: CourseHole[]) => string,
            totalEnd: string,
            klass = '',
        ): string => {
            const groupCells = groups
                .map((g) => g.holes.map(cell).join('') + `<td class="sum">${groupEnd(g.holes)}</td>`)
                .join('');
            return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${includeTotColumn ? `<td class="sum">${totalEnd}</td>` : ''}
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
            (h) => `<td>${strokesCell(byHole.get(h.holeNumber)?.gross ?? null)}</td>`,
            (holes) => {
                const total = holes.reduce((acc, h) => {
                    const gross = byHole.get(h.holeNumber)?.gross;
                    return gross != null ? acc + gross : acc;
                }, 0);
                const any = holes.some((h) => byHole.get(h.holeNumber)?.gross != null);
                return any ? String(total) : '—';
            },
        );
        const netRow = row(
            'Net',
            (h) => `<td>${netCell(byHole.get(h.holeNumber)?.net ?? null)}</td>`,
            (holes) => {
                const total = holes.reduce((acc, h) => {
                    const net = byHole.get(h.holeNumber)?.net;
                    return net != null ? acc + net : acc;
                }, 0);
                const any = holes.some((h) => byHole.get(h.holeNumber)?.net != null);
                return any ? String(total) : '—';
            },
        );
        const lgRow = row(
            'LG',
            (h) => `<td class="given">${hasCat(byHole.get(h.holeNumber), 'LG') ? '✓' : ''}</td>`,
            (holes) => {
                const total = holes.filter((h) => hasCat(byHole.get(h.holeNumber), 'LG')).length;
                return total > 0 ? String(total) : '—';
            },
            'dim',
        );
        const firRow = row(
            'FIR',
            (h) => {
                if (h.par <= 3) return '<td class="given">—</td>';
                const fir = rawByHole.get(h.holeNumber)?.metadata?.fairway === true;
                return `<td class="given">${fir ? '✓' : ''}</td>`;
            },
            (holes) => {
                const total = holes.filter(
                    (h) => h.par > 3 && rawByHole.get(h.holeNumber)?.metadata?.fairway === true,
                ).length;
                return total > 0 ? String(total) : '—';
            },
            'dim',
        );
        const girRow = row(
            'GIR',
            (h) => {
                const gir = rawByHole.get(h.holeNumber)?.metadata?.gir === true;
                return `<td class="given">${gir ? '✓' : ''}</td>`;
            },
            (holes) => {
                const total = holes.filter(
                    (h) => rawByHole.get(h.holeNumber)?.metadata?.gir === true,
                ).length;
                return total > 0 ? String(total) : '—';
            },
            'dim',
        );
        const birdRow = row(
            'BIRD',
            (h) => `<td class="given">${hasCat(byHole.get(h.holeNumber), 'BIRD') ? '✓' : ''}</td>`,
            (holes) => {
                const total = holes.filter((h) => hasCat(byHole.get(h.holeNumber), 'BIRD')).length;
                return total > 0 ? String(total) : '—';
            },
            'dim',
        );
        const pointsRow = row(
            'Points',
            (h) => {
                const hr = byHole.get(h.holeNumber);
                const note = hr?.note ? ` title="${esc(hr.note)}"` : '';
                const sweep = hr?.note?.includes('☂') ? ' ☂' : '';
                return `<td${note}>${hr?.points != null ? `<strong>${hr.points}${sweep}</strong>` : '—'}</td>`;
            },
            (holes) => {
                const total = holes.reduce((acc, h) => {
                    const points = byHole.get(h.holeNumber)?.points;
                    return points != null ? acc + points : acc;
                }, 0);
                const any = holes.some((h) => byHole.get(h.holeNumber)?.points != null);
                return any ? String(total) : '—';
            },
        );

        const runningByHole = normalizedRunningByParticipant.get(p.id);
        const runningRow =
            runningByHole
                ? stateRow(
                      'Running',
                      (h) => `<td>${numericCell(runningByHole.get(h.holeNumber))}</td>`,
                      (holes) => {
                          const last = holes[holes.length - 1];
                          return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
                      },
                      (() => {
                          const last = courseHoles[courseHoles.length - 1];
                          return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
                      })(),
                  )
                : '';

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

        const slotFormat = round.formatSlots[result.slotIndex];
        const umbrellaHeader =
            slotFormat
                ? `slot #${result.slotIndex} · ${esc(formatSlotSummary(slotFormat))} · birdieRule ${esc(umbrellaBirdieRuleFor(slotFormat) ?? 'gross')}`
                : `slot #${result.slotIndex}`;

        return `
<article class="scorecard-card">
  <header>
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      ${umbrellaHeader} · H idx ${p.handicapIndexSnapshot ?? '—'} · CH ${p.courseHandicapSnapshot ?? '—'} · PH ${p.playingHandicapSnapshot ?? '—'} · holes played ${result.holesPlayed}
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
      ${lgRow}
      ${firRow}
      ${girRow}
      ${birdRow}
      ${pointsRow}
      ${runningRow}
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
            const playerPh = link.playingHandicapSnapshot ?? p.playingHandicapSnapshot ?? 0;
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

        const slotFormat = round.formatSlots[result.slotIndex];
        return `
<article class="scorecard-card">
  <header>
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      slot #${result.slotIndex} · ${esc(slotFormat?.scoringMode ?? '')} × ${esc(slotFormat?.teamShape ?? '')} @ ${slotFormat?.allowancePct ?? 100}% · ${playerPhSummary(p)} · holes played ${result.holesPlayed}
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

    // Unified pair scorecard — one table for BOTH sides of a match-play or
    // Taliban pair. Previously each team rendered its own scorecard, so the
    // two tables often had different column widths and you couldn't compare
    // hole-by-hole vertically. This renderer stacks: shared hole header → Par
    // / SI → Side A block (Given / Gross / Net per player, + team row for
    // Taliban) → Side B block → per-hole Status row (verbatim from the
    // participant's own note) → cumulative Match row (idiom-specific:
    // match-play "1UP"/"AS"/"NDN", Taliban "+N"/"-N"/"AS").
    //
    // `kind` decides the per-player layout: individual = 1 player/side, no
    // team row; team = 2 players/side + a team row (gross/net = better-ball;
    // the "team points earned" cell uses `PairHoleResult.fromA|fromB`).
    const renderPairScorecard = (
        pair: PairResult,
        kind: PairScorecardKind,
        partA: Participant,
        partB: Participant,
        resA: ParticipantResult,
        resB: ParticipantResult,
        courseHoles: CourseHole[],
    ): string => {
        const groups = splitHoleGroups(courseHoles);
        const includeTotColumn = groups.length > 1;

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

        const stateRow = (
            label: string,
            cell: (h: CourseHole) => string,
            groupEnd: (holes: CourseHole[]) => string,
            totalEnd: string,
            klass = '',
        ): string => {
            const groupCells = groups
                .map((g) => g.holes.map(cell).join('') + `<td class="sum">${groupEnd(g.holes)}</td>`)
                .join('');
            return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${includeTotColumn ? `<td class="sum">${totalEnd}</td>` : ''}
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

        // Build one side's player rows (Given / Gross / Net per player). For
        // match-play individual the participant has 1 player link; for Taliban
        // it has 2. Gross/Net come from the raw scorecard rows (source-filtered)
        // so we get the pickup / DNP semantics right per player. Strokes-given
        // uses the link's own frozen PH, with a participant-level fallback for
        // legacy rows that predate the per-link snapshot migration.
        const sideBlock = (p: Participant): string => {
            const scorecard = scorecardByParticipant.get(p.id);
            const allRows = scorecard?.holes ?? [];
            const blocks = p.players.map((link) => {
                const name = playerLinkLabel(link);
                const playerPh =
                    effectivePHByLinkId.get(link.id) ??
                    effectivePHByParticipant.get(p.id) ??
                    link.playingHandicapSnapshot ??
                    p.playingHandicapSnapshot ??
                    0;
                const strokesGiven = strokesGivenMap(playerPh, allCourseHoles);
                const playerRows = pairSideScorecardRows(kind, link, allRows);
                const byHole = new Map<number, ScorecardHole>();
                for (const r of playerRows) byHole.set(r.holeNumber, r);

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
                const netRow = row(
                    `${esc(name)} Net`,
                    (h) => {
                        const r = byHole.get(h.holeNumber);
                        if (!r || r.strokes === null || r.strokes === 0) {
                            return `<td>${netCell(null)}</td>`;
                        }
                        const given = strokesGiven.get(h.holeNumber) ?? 0;
                        return `<td>${netCell(r.strokes - given)}</td>`;
                    },
                    (holes) => {
                        let total = 0;
                        let any = false;
                        for (const h of holes) {
                            const r = byHole.get(h.holeNumber);
                            if (r && r.strokes !== null && r.strokes !== 0) {
                                const given = strokesGiven.get(h.holeNumber) ?? 0;
                                total += r.strokes - given;
                                any = true;
                            }
                        }
                        return any ? String(total) : '—';
                    },
                );
                return [givenRow, grossRow, netRow].join('');
            });
            return blocks.join('');
        };

        const pairByHole = new Map(pair.holes.map((ph) => [ph.holeNumber, ph]));

        const sidePoints = (perspective: 'A' | 'B', ph: PairHoleResult): number | null => {
            if (ph.status === null) return null;
            if (kind === 'match_play_individual' || kind === 'match_play_better_ball') {
                if (ph.status === 'halved') return 0;
                if (perspective === 'A') return ph.status === 'won' ? 1 : 0;
                return ph.status === 'lost' ? 1 : 0;
            }
            return perspective === 'A' ? ph.fromA : ph.fromB;
        };

        const buildNormalizedRunning = (
            perspective: 'A' | 'B',
        ): Map<number, number> => {
            let rawA = 0;
            let rawB = 0;
            const out = new Map<number, number>();
            const ordered = [...pair.holes].sort((a, b) => a.holeNumber - b.holeNumber);
            for (const ph of ordered) {
                const ptsA = sidePoints('A', ph);
                const ptsB = sidePoints('B', ph);
                if (ptsA !== null) rawA += ptsA;
                if (ptsB !== null) rawB += ptsB;
                const min = Math.min(rawA, rawB);
                out.set(ph.holeNumber, (perspective === 'A' ? rawA : rawB) - min);
            }
            return out;
        };

        const runningAByHole = buildNormalizedRunning('A');
        const runningBByHole = buildNormalizedRunning('B');

        const pointsRowForSide = (perspective: 'A' | 'B', label: string): string =>
            row(
                `${label} pts`,
                (h) => {
                    const ph = pairByHole.get(h.holeNumber);
                    return `<td><strong>${numericCell(ph ? sidePoints(perspective, ph) : null)}</strong></td>`;
                },
                (holes) => {
                    let total = 0;
                    let any = false;
                    for (const h of holes) {
                        const ph = pairByHole.get(h.holeNumber);
                        const pts = ph ? sidePoints(perspective, ph) : null;
                        if (pts !== null) {
                            total += pts;
                            any = true;
                        }
                    }
                    return any ? numericCell(total) : '—';
                },
            );

        const runningRowForSide = (
            perspective: 'A' | 'B',
            label: string,
            runningByHole: Map<number, number>,
        ): string =>
            stateRow(
                `${label} run`,
                (h) => `<td>${numericCell(runningByHole.get(h.holeNumber))}</td>`,
                (holes) => {
                    const last = holes[holes.length - 1];
                    return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
                },
                (() => {
                    const last = courseHoles[courseHoles.length - 1];
                    return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
                })(),
            );

        // Status row — per-hole outcome only, from the pair-level note.
        // Match-play: "W" / "L" / "AS" (+ "(dormie)"); Taliban: "W+1" / "W+2
        // (birdie)" / "W+5 (down eagle)" / "L" / "AS". The Match row below
        // carries the running cumulative — keep them non-overlapping.
        const statusRow = row(
            'Status',
            (h) => {
                const ph = pairByHole.get(h.holeNumber);
                return `<td class="status">${esc(ph?.note ?? '—')}</td>`;
            },
            () => '—',
        );

        // Match row — cumulative from A's perspective, idiom-specific.
        // Running sum of `PairHoleResult.pointsDelta`; null holes contribute 0
        // (no change in running state). Match-play: AS / NUP / NDN. Taliban:
        // AS / +N / -N (signed integer delta).
        const formatRunning = (running: number): string => {
            if (kind === 'match_play_individual' || kind === 'match_play_better_ball') {
                if (running === 0) return 'AS';
                if (running > 0) return `${running}UP`;
                return `${-running}DN`;
            }
            // taliban
            if (running === 0) return 'AS';
            if (running > 0) return `+${running}`;
            return `−${-running}`;
        };
        // Precompute running after each hole by natural ordering (same as
        // pair.holes is built hole-by-hole in the strategy).
        const runningByHole = new Map<number, number>();
        let running = 0;
        const orderedHoles = [...pair.holes].sort((a, b) => a.holeNumber - b.holeNumber);
        for (const ph of orderedHoles) {
            if (ph.pointsDelta !== null) running += ph.pointsDelta;
            runningByHole.set(ph.holeNumber, running);
        }
        const matchRow = row(
            'Match',
            (h) => {
                const r = runningByHole.get(h.holeNumber);
                if (r === undefined) return `<td class="status">—</td>`;
                return `<td class="status">${esc(formatRunning(r))}</td>`;
            },
            () => '—',
        );

        const title = `${esc(participantLabel(partA))} vs. ${esc(participantLabel(partB))}`;
        const slotFormat = round.formatSlots[pair.slotIndex];
        const slotDescr = slotFormat
            ? `slot #${pair.slotIndex} · ${esc(slotFormat.scoringMode)} × ${esc(slotFormat.teamShape)} @ ${slotFormat.allowancePct}%`
            : `slot #${pair.slotIndex}`;

        const labelA = esc(participantLabel(partA));
        const labelB = esc(participantLabel(partB));

        return `
<article class="scorecard-card">
  <header>
    <h3>${title}</h3>
    <span class="muted">
      ${slotDescr} · ${esc(pair.summary)}
    </span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>
      ${parRow}
      ${siRow}
      ${sideBlock(partA)}
      ${pointsRowForSide('A', labelA)}
      ${runningRowForSide('A', labelA, runningAByHole)}
      ${sideBlock(partB)}
      ${pointsRowForSide('B', labelB)}
      ${runningRowForSide('B', labelB, runningBByHole)}
      ${statusRow}
      ${matchRow}
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

        const stateRow = (
            label: string,
            cell: (h: CourseHole) => string,
            groupEnd: (holes: CourseHole[]) => string,
            totalEnd: string,
            klass = '',
        ): string => {
            const groupCells = groups
                .map((g) => g.holes.map(cell).join('') + `<td class="sum">${groupEnd(g.holes)}</td>`)
                .join('');
            return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${includeTotColumn ? `<td class="sum">${totalEnd}</td>` : ''}
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

        const runningByHole = normalizedRunningByParticipant.get(p.id);
        const runningRow = runningByHole
            ? stateRow(
                  'Running',
                  (h) => `<td>${numericCell(runningByHole.get(h.holeNumber))}</td>`,
                  (holes) => {
                      const last = holes[holes.length - 1];
                      return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
                  },
                  (() => {
                      const last = courseHoles[courseHoles.length - 1];
                      return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
                  })(),
              )
            : '';

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
                ? `slot #${result.slotIndex} · ${esc(slotFormat.scoringMode)} × ${esc(slotFormat.teamShape)} @ ${slotFormat.allowancePct}% · birdieRule ${esc(umbrellaBirdieRuleFor(slotFormat) ?? 'gross')}`
                : `slot #${result.slotIndex}`;

        return `
<article class="scorecard-card">
  <header>
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      ${umbrellaHeader} · ${playerPhSummary(p)} · holes played ${result.holesPlayed}
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
      ${runningRow}
    </tbody>
  </table>
  ${arithmetic}
  <ul class="totals">${totalsRow}</ul>
</article>`;
    };

    const renderScorecards = (): string => {
        const resultByParticipant = new Map(leaderboard.participantResults.map((r) => [r.participantId, r]));
        const partById = new Map(participants.map((p) => [p.id, p]));
        // Pair-level formats (match-play individual, Taliban better-ball)
        // render ONE unified scorecard per pair instead of a separate card
        // per participant — so you can compare hole-by-hole vertically.
        // We track which participants have already been folded into a pair
        // card to avoid double-rendering; orphans (odd-count match-play)
        // still fall through to the individual renderer below.
        const foldedIntoPair = new Set<string>();
        const cards: string[] = [];
        for (const pr of leaderboard.pairResults) {
            const [idA, idB] = pr.participants;
            const partA = partById.get(idA);
            const partB = partById.get(idB);
            const resA = resultByParticipant.get(idA);
            const resB = resultByParticipant.get(idB);
            if (!partA || !partB || !resA || !resB) continue;
            // Use participant A's slot to detect the format kind — both
            // participants of a pair share a slot by construction.
            const slot = slotByParticipantId.get(idA);
            let kind:
                | 'match_play_individual'
                | 'match_play_better_ball'
                | 'taliban_better_ball'
                | null = null;
            if (isTalibanSlot(slot)) kind = 'taliban_better_ball';
            else if (slot?.scoringMode === 'match_play' && slot?.teamShape === 'individual')
                kind = 'match_play_individual';
            else if (slot?.scoringMode === 'match_play' && slot?.teamShape === 'better_ball')
                kind = 'match_play_better_ball';
            if (!kind) continue; // pair from a future pair-level format — leave as-is
            cards.push(renderPairScorecard(pr, kind, partA, partB, resA, resB, playedCourseHoles));
            foldedIntoPair.add(idA);
            foldedIntoPair.add(idB);
        }
        for (const p of participants) {
            if (foldedIntoPair.has(p.id)) continue;
            const r = resultByParticipant.get(p.id);
            if (!r) continue;
            if (isParticipantBetterBall(p)) cards.push(renderBetterBallScorecard(r, p, playedCourseHoles));
            else if (isParticipantTaliban(p)) cards.push(renderTalibanScorecard(r, p, playedCourseHoles));
            else if (isParticipantUmbrellaFourBall(p)) cards.push(renderUmbrellaScorecard(r, p, playedCourseHoles));
            else if (isParticipantUmbrellaIndividual(p)) cards.push(renderUmbrellaIndividualScorecard(r, p, playedCourseHoles));
            else cards.push(renderScorecard(r, p, playedCourseHoles));
        }
        return `
<section>
  <h2>Scorecards</h2>
  ${cards.join('\n')}
</section>`;
    };

    const renderEvents = (): string => {
        const rows = events.map((e: ScoreEvent) => {
            const participant = participants.find((p) => p.id === e.participantId);
            const sourceName =
                e.sourcePlayerId !== null
                    ? playerName(e.sourcePlayerId)
                    : e.sourceGuestPlayerId !== null
                      ? `guest ${short(e.sourceGuestPlayerId)}`
                      : '';
            const metaCell = formatEventMetadata(e.metadata);
            return `
<tr>
  <td class="muted">${esc(e.recordedAt)}</td>
  <td>${esc(participant ? participantLabel(participant) : short(e.participantId))}</td>
  <td>${esc(sourceName)}</td>
  <td class="num">${e.hole}</td>
  <td class="num">${strokesCell(e.strokes)}</td>
  <td>${esc(e.eventType)}</td>
  <td>${metaCell}</td>
  <td>${esc(playerName(e.recordedByPlayerId))}</td>
  <td><code>${esc(e.clientEventId)}</code></td>
  <td><code>${esc(short(e.id))}</code></td>
</tr>`;
        });
        return `
<section>
  <h2>Events log (${events.length})</h2>
  <table class="grid">
    <thead><tr><th>recorded at</th><th>participant</th><th>player</th><th>hole</th><th>strokes</th><th>type</th><th>metadata</th><th>recorded by</th><th>client id</th><th>event id</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>
</section>`;
    };

    const renderLeaderboard = (): string => {
        const participantName = (id: string) => {
            const p = participants.find((x) => x.id === id);
            return p ? participantLabel(p) : short(id);
        };

        // Group scoring-type buckets by slot so multi-slot rounds render as
        // one sub-section per slot (each with its own format sub-header and
        // one-or-more scoring-type columns). Single-slot rounds still get
        // the sub-header — it's cheap information, worth keeping consistent.
        const bucketsBySlot = new Map<number, typeof leaderboard.byScoringType>();
        for (const bucket of leaderboard.byScoringType) {
            const arr = bucketsBySlot.get(bucket.slotIndex) ?? [];
            arr.push(bucket);
            bucketsBySlot.set(bucket.slotIndex, arr);
        }

        const renderBucket = (b: (typeof leaderboard.byScoringType)[number]): string => {
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
  <h4>${esc(b.scoringType)}</h4>
  <table class="grid">
    <thead><tr><th>pos</th><th>participant</th><th>total</th><th>holes</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>
</div>`;
        };

        // Emit per-slot sub-sections in slotIndex order.
        const slotIndices = [...bucketsBySlot.keys()].sort((a, b) => a - b);
        const slotSections = slotIndices.map((slotIndex) => {
            const slot = round.formatSlots[slotIndex];
            const header = slot
                ? `Slot #${slot.slotIndex} · ${esc(formatSlotSummary(slot))}`
                : `Slot #${slotIndex}`;
            const cols = (bucketsBySlot.get(slotIndex) ?? []).map(renderBucket).join('');
            // Per-slot pair-results subsection — only the pairs whose
            // `slotIndex` matches. Taliban today is single-slot, so it falls
            // naturally into its slot's section.
            const slotPairs = leaderboard.pairResults.filter((pr) => pr.slotIndex === slotIndex);
            const slotIsTaliban = isTalibanSlot(slot);
            const pairSection = slotPairs.length > 0
                ? (() => {
                      const rows = slotPairs.map((pr) => {
                          const a = participantName(pr.participants[0]);
                          const b = participantName(pr.participants[1]);
                          let line: string;
                          if (slotIsTaliban) {
                              line = esc(pr.summary);
                          } else if (pr.result === 'won') {
                              const winnerName = pr.winner === pr.participants[0] ? a : b;
                              const loserName = pr.winner === pr.participants[0] ? b : a;
                              line = `${esc(winnerName)} d. ${esc(loserName)}, ${esc(pr.summary)}`;
                          } else if (pr.result === 'lost') {
                              line = `${esc(b)} d. ${esc(a)}, ${esc(pr.summary)}`;
                          } else if (pr.result === 'halved') {
                              // Golf idiom: unresolved matches use "vs." — resolved
                              // results use "d." (defeated) or "& k" shorthand.
                              line = `${esc(a)} vs. ${esc(b)} halved, ${esc(pr.summary)}`;
                          } else {
                              line = `${esc(a)} vs. ${esc(b)}, ${esc(pr.summary)} (in progress)`;
                          }
                          return `<tr><td>${line}</td></tr>`;
                      });
                      return `
<div class="lb-col" style="min-width: 420px;">
  <h4>Match results</h4>
  <table class="grid">
    <thead><tr><th>result</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>
</div>`;
                  })()
                : '';
            return `
<div class="lb-slot">
  <h3>${header}</h3>
  <div class="lb-row">${cols}${pairSection}</div>
</div>`;
        });

        // Catch-all for pair-results whose slot didn't emit any scoring-type
        // bucket (pure match-play slots emit empty `totals` arrays — they
        // appear in `pairResults` only, so their slotIndex never makes it
        // into `bucketsBySlot`). Render them under their own slot header.
        const orphanedPairSlots = [
            ...new Set(
                leaderboard.pairResults
                    .filter((pr) => !bucketsBySlot.has(pr.slotIndex))
                    .map((pr) => pr.slotIndex),
            ),
        ].sort((a, b) => a - b);
        const orphanedPairSections = orphanedPairSlots.map((slotIndex) => {
            const slot = round.formatSlots[slotIndex];
            const header = slot
                ? `Slot #${slot.slotIndex} · ${esc(formatSlotSummary(slot))}`
                : `Slot #${slotIndex}`;
            const slotPairs = leaderboard.pairResults.filter((pr) => pr.slotIndex === slotIndex);
            const slotIsTaliban = isTalibanSlot(slot);
            const rows = slotPairs.map((pr) => {
                const a = participantName(pr.participants[0]);
                const b = participantName(pr.participants[1]);
                let line: string;
                if (slotIsTaliban) {
                    line = esc(pr.summary);
                } else if (pr.result === 'won') {
                    const winnerName = pr.winner === pr.participants[0] ? a : b;
                    const loserName = pr.winner === pr.participants[0] ? b : a;
                    line = `${esc(winnerName)} d. ${esc(loserName)}, ${esc(pr.summary)}`;
                } else if (pr.result === 'lost') {
                    line = `${esc(b)} d. ${esc(a)}, ${esc(pr.summary)}`;
                } else if (pr.result === 'halved') {
                    line = `${esc(a)} vs. ${esc(b)} halved, ${esc(pr.summary)}`;
                } else {
                    line = `${esc(a)} vs. ${esc(b)}, ${esc(pr.summary)} (in progress)`;
                }
                return `<tr><td>${line}</td></tr>`;
            });
            return `
<div class="lb-slot">
  <h3>${header}</h3>
  <div class="lb-row">
    <div class="lb-col" style="min-width: 420px;">
      <h4>Match results</h4>
      <table class="grid">
        <thead><tr><th>result</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>
  </div>
</div>`;
        });

        return `
<section>
  <h2>Leaderboard</h2>
  ${slotSections.join('')}${orphanedPairSections.join('')}
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
${renderSnapshotTables()}
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
