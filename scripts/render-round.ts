// Static HTML scorecard report for a round. Reads directly from
// `data/app.sqlite` — no running server, no auth. Intended for
// hand-verification of snapshots, format math, and leaderboard output.
//
// Usage:
//   bun scripts/render-round.ts                # picks most-recent round
//   bun scripts/render-round.ts <roundId>      # specific round
//   bun scripts/render-round.ts --open         # opens the HTML in browser
//
// Writes to `tmp/round-<short-id>.html`.

import * as path from 'node:path';
import * as fs from 'node:fs';
import { createDb } from '@basics/core/server/db';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import type { Participant } from '../server/services/participant.service';
import type { Round } from '../server/services/round.service';
import type { Course } from '../server/services/course.service';
import type { Tee } from '../server/services/tee.service';
import type { Player } from '../server/services/player.service';
import type { GuestPlayer } from '../server/services/guest-player.service';
import type { ScoreEvent } from '../server/services/score-event.service';
import type { Leaderboard } from '../server/domain/leaderboard';
import type { ParticipantResult, CourseHole } from '../server/domain/format';

// --- args ---

const args = process.argv.slice(2);
const openInBrowser = args.includes('--open');
const roundIdArg = args.find((a) => !a.startsWith('--'));

const dbPath = process.env.DB_PATH ?? './data/app.sqlite';
if (!fs.existsSync(dbPath)) {
    console.error(`no database at ${dbPath} — boot the dev server once first`);
    process.exit(1);
}

const db = createDb<Database>(dbPath);
const svc = createServices(db);

// --- resolve round ---

async function resolveRoundId(): Promise<string> {
    if (roundIdArg) return roundIdArg;
    const rounds = await svc.roundService.list();
    if (rounds.length === 0) {
        console.error('no rounds found; create one first');
        process.exit(1);
    }
    return rounds[0].id; // list() orders by date desc
}

const roundId = await resolveRoundId();
const round = await svc.roundService.getById(roundId);
if (!round) {
    console.error(`round ${roundId} not found`);
    process.exit(1);
}
const course = await svc.courseService.getById(round.courseId);
if (!course) throw new Error(`course ${round.courseId} not found`);

const participants = await svc.participantService.listByRound(roundId);
const events = await svc.scoreEventService.listByRound(roundId);
const leaderboard = await svc.leaderboardService.forRound(roundId);

// Resolve player + guest names for every link on every participant, and tee
// metadata for every snapshot tee id referenced.
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

// --- helpers ---

function participantLabel(p: Participant): string {
    const names = p.players.map((link) => {
        if (link.playerId) return playersById.get(link.playerId)?.displayName ?? `player:${link.playerId.slice(0, 8)}`;
        if (link.guestPlayerId) {
            const g = guestsById.get(link.guestPlayerId);
            return g ? `${g.displayName} (guest)` : `guest:${link.guestPlayerId.slice(0, 8)}`;
        }
        return '?';
    });
    return names.length ? names.join(' + ') : `participant:${p.id.slice(0, 8)}`;
}

function playerName(id: string | null): string {
    if (!id) return '—';
    return playersById.get(id)?.displayName ?? id.slice(0, 8);
}

function esc(s: unknown): string {
    return String(s ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function short(id: string): string {
    return id.slice(0, 8);
}

// Cell value for a per-hole strokes display: "–" for DNP, "P" for pickup, number otherwise.
function strokesCell(strokes: number | null | undefined): string {
    if (strokes === null || strokes === undefined) return '<span class="dnp">–</span>';
    if (strokes === 0) return '<span class="pickup">P</span>';
    return String(strokes);
}

function netCell(net: number | null): string {
    if (net === null) return '<span class="dnp">–</span>';
    return String(net);
}

function sumOrDash(values: (number | null | undefined)[]): string {
    const nums = values.filter((v): v is number => typeof v === 'number');
    if (nums.length === 0) return '—';
    return String(nums.reduce((a, b) => a + b, 0));
}

// Sum treating pickups (0) as net-double like the stroke-play format does.
function grossSum(holes: { gross: number | null }[]): number | null {
    const nums = holes.map((h) => h.gross).filter((v): v is number => typeof v === 'number');
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0);
}

function netSum(holes: { net: number | null }[]): number | null {
    const nums = holes.map((h) => h.net).filter((v): v is number => typeof v === 'number');
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0);
}

function strokesGivenMap(playingHandicap: number | null, courseHoles: CourseHole[]): Map<number, number> {
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

// --- sections ---

function renderMeta(round: Round, course: Course): string {
    return `
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
}

function renderCourseMetadata(course: Course): string {
    const out = course.holes.slice(0, 9);
    const inn = course.holes.slice(9, 18);
    const parOut = out.reduce((a, b) => a + b.par, 0);
    const parIn = inn.reduce((a, b) => a + b.par, 0);
    const cells = (holes: typeof course.holes) =>
        holes.map((h) => `<td>${h.par}</td>`).join('');
    const si = (holes: typeof course.holes) =>
        holes.map((h) => `<td class="si">${h.strokeIndex}</td>`).join('');
    const holeHeader = (holes: typeof course.holes) =>
        holes.map((h) => `<th>${h.holeNumber}</th>`).join('');
    return `
<section>
  <h2>Course — ${esc(course.name)}</h2>
  <table class="scorecard">
    <thead>
      <tr><th class="rowlabel">Hole</th>${holeHeader(out)}<th class="sum">OUT</th>${holeHeader(inn)}<th class="sum">IN</th><th class="sum">TOT</th></tr>
    </thead>
    <tbody>
      <tr><th class="rowlabel">Par</th>${cells(out)}<td class="sum">${parOut}</td>${cells(inn)}<td class="sum">${parIn}</td><td class="sum">${parOut + parIn}</td></tr>
      <tr><th class="rowlabel">SI</th>${si(out)}<td class="sum"></td>${si(inn)}<td class="sum"></td><td class="sum"></td></tr>
    </tbody>
  </table>
</section>`;
}

function renderParticipantsTable(): string {
    const rows = participants.map((p) => {
        const tee = p.teeIdSnapshot ? teesById.get(p.teeIdSnapshot) : null;
        const teeLabel = tee ? tee.name : '—';
        // Rebuild WHS arithmetic for the row so the reader doesn't have to redo it.
        let arithmetic = '—';
        if (p.handicapIndexSnapshot !== null && tee) {
            // We don't know which gender was used at snapshot time — show both M+F so the
            // reader can cross-reference with the participant's expected gender.
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
}

function renderScorecard(result: ParticipantResult, p: Participant, courseHoles: CourseHole[]): string {
    const byHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
    const outRange = courseHoles.filter((h) => h.holeNumber <= 9);
    const inRange = courseHoles.filter((h) => h.holeNumber > 9);
    const strokesGiven = strokesGivenMap(p.playingHandicapSnapshot, courseHoles);

    const row = (
        label: string,
        cell: (h: CourseHole) => string,
        sum: (holes: CourseHole[]) => string,
        klass = '',
    ): string => {
        const outSum = sum(outRange);
        const inSum = sum(inRange);
        const tot =
            outSum === '—' && inSum === '—'
                ? '—'
                : String(
                      (outSum === '—' ? 0 : Number(outSum)) + (inSum === '—' ? 0 : Number(inSum)),
                  );
        return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${outRange.map(cell).join('')}
  <td class="sum">${outSum}</td>
  ${inRange.map(cell).join('')}
  <td class="sum">${inSum}</td>
  <td class="sum">${tot}</td>
</tr>`;
    };

    const holeHeader = `
<tr>
  <th class="rowlabel">Hole</th>
  ${outRange.map((h) => `<th>${h.holeNumber}</th>`).join('')}
  <th class="sum">OUT</th>
  ${inRange.map((h) => `<th>${h.holeNumber}</th>`).join('')}
  <th class="sum">IN</th>
  <th class="sum">TOT</th>
</tr>`;

    const parRow = row('Par', (h) => `<td>${h.par}</td>`, (holes) => String(holes.reduce((a, b) => a + b.par, 0)));
    const siRow = row(
        'SI',
        (h) => `<td class="si">${h.strokeIndex}</td>`,
        () => '—',
        'dim',
    );
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
            const total = holes.reduce(
                (acc, h) => {
                    const hr = byHole.get(h.holeNumber);
                    return hr?.gross != null ? acc + hr.gross : acc;
                },
                0,
            );
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
            const total = holes.reduce(
                (acc, h) => {
                    const hr = byHole.get(h.holeNumber);
                    return hr?.net != null ? acc + hr.net : acc;
                },
                0,
            );
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
}

function renderScorecards(): string {
    const courseHoles: CourseHole[] = course!.holes.map((h) => ({
        holeNumber: h.holeNumber,
        par: h.par,
        strokeIndex: h.strokeIndex,
    }));
    const resultByParticipant = new Map(leaderboard.participantResults.map((r) => [r.participantId, r]));
    const cards = participants.map((p) => {
        const r = resultByParticipant.get(p.id);
        if (!r) return '';
        return renderScorecard(r, p, courseHoles);
    });
    return `
<section>
  <h2>Scorecards</h2>
  ${cards.join('\n')}
</section>`;
}

function renderEvents(): string {
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
}

function renderLeaderboard(lb: Leaderboard): string {
    const participantName = (id: string) => {
        const p = participants.find((x) => x.id === id);
        return p ? participantLabel(p) : short(id);
    };
    const sections = lb.byScoringType.map((b) => {
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
}

// --- assemble ---

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Round ${short(round.id)} — ${esc(course.name)} — ${esc(round.date)}</title>
<style>
  :root { color-scheme: light dark; --muted: #888; --dim: #bbb; --border: #d0d0d0; --sum-bg: #f3f3f3; }
  @media (prefers-color-scheme: dark) { :root { --border: #333; --sum-bg: #222; --dim: #555; } }
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
  code { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: var(--muted); }
</style>
</head>
<body>
<h1>
  Round ${esc(course.name)} · ${esc(round.date)}
  <span class="sub">${esc(round.roundType)} · ${esc(round.venueType)} · ${esc(round.status)} · <code>${esc(short(round.id))}</code></span>
</h1>
${renderMeta(round, course)}
${renderCourseMetadata(course)}
${renderParticipantsTable()}
${renderScorecards()}
${renderLeaderboard(leaderboard)}
${renderEvents()}
<footer class="muted">
  <p>Generated ${new Date().toISOString()} from <code>${esc(dbPath)}</code></p>
</footer>
</body>
</html>`;

// --- write ---

const tmpDir = path.join(process.cwd(), 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });
const outPath = path.join(tmpDir, `round-${short(round.id)}.html`);
fs.writeFileSync(outPath, html);

console.log(`wrote ${outPath}`);
console.log(`  ${participants.length} participants · ${events.length} events`);

if (openInBrowser) {
    const open = process.platform === 'darwin' ? 'open' : 'xdg-open';
    Bun.spawn([open, outPath]);
}

await db.destroy();
