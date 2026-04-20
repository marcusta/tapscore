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
import type { Leaderboard } from '../server/domain/leaderboard';
import type { ParticipantResult, CourseHole } from '../server/domain/format';
import { courseHolesForRound } from '../server/domain/round-holes';

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

    return { round, course, participants, events, leaderboard, playersById, guestsById, teesById, dbPath };
}

export function renderRoundHtml(ctx: RoundRenderContext): string {
    const { round, course, participants, events, leaderboard, playersById, guestsById, teesById, dbPath } = ctx;

    const participantLabel = (p: Participant): string => {
        const names = p.players.map((link) => {
            if (link.playerId) return playersById.get(link.playerId)?.displayName ?? `player:${short(link.playerId)}`;
            if (link.guestPlayerId) {
                const g = guestsById.get(link.guestPlayerId);
                return g ? `${g.displayName} (guest)` : `guest:${short(link.guestPlayerId)}`;
            }
            return '?';
        });
        return names.length ? names.join(' + ') : `participant:${short(p.id)}`;
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

    const playedCourseHoles: CourseHole[] = courseHolesForRound(
        round.roundType,
        course.holes.map((h) => ({ holeNumber: h.holeNumber, par: h.par, strokeIndex: h.strokeIndex })),
    );

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

    const renderScorecard = (result: ParticipantResult, p: Participant, courseHoles: CourseHole[]): string => {
        const byHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
        const groups = splitHoleGroups(courseHoles);
        const includeTotColumn = groups.length > 1;
        const strokesGiven = strokesGivenMap(p.playingHandicapSnapshot, courseHoles);

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
                      return `<td>${hr?.points ?? '—'}</td>`;
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

        const totalsRow = result.totals
            .map((t) => `<li>${esc(t.scoringType)} = <strong>${t.value ?? '—'}</strong></li>`)
            .join('');

        return `
<article class="scorecard-card">
  <header>
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      slot #${result.slotIndex} · H idx ${p.handicapIndexSnapshot ?? '—'} · CH ${p.courseHandicapSnapshot ?? '—'} · PH ${p.playingHandicapSnapshot ?? '—'} · holes played ${result.holesPlayed}
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
    </tbody>
  </table>
  <ul class="totals">${totalsRow}</ul>
</article>`;
    };

    const renderScorecards = (): string => {
        const resultByParticipant = new Map(leaderboard.participantResults.map((r) => [r.participantId, r]));
        const cards = participants.map((p) => {
            const r = resultByParticipant.get(p.id);
            if (!r) return '';
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
        return `
<section>
  <h2>Leaderboard</h2>
  <div class="lb-row">${sections.join('')}</div>
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
