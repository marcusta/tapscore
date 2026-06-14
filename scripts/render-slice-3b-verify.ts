// Slice 3b focused visual verification — ONE self-contained page.
//
// Persistence-only slice: the itinerary, SI provenance, route handicap policy,
// and playing groups are read straight off the new tables / resolved
// definition. The existing render pipeline shows SCORING, not the route, so
// this page renders the Slice 3b read model directly from
// `roundService.getById`.
//
// It builds a self-contained fixture DB (no dependency on the seed pipeline):
// an 18-hole course routed as TWO LOOPS of the front nine (1..9,1..9) with a
// distinct stroke index on each visit, difficulty-labelled SI provenance, an
// explicitly-casual (posting-ineligible) handicap policy, and TWO playing
// groups starting at different occurrences (a split / shotgun start).
//
//   bun scripts/render-slice-3b-verify.ts

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import type { RoundDefinition } from '../server/domain/round-definition';
import type { Round, RoundPlayHole } from '../server/services/round.service';

const OUT_DIR = path.join(process.cwd(), 'tmp', 'formats');
const DB_PATH = path.join(process.cwd(), 'tmp', 'slice-3b-fixture.sqlite');

function esc(s: string): string {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}

/** "3 (1st)" / "3 (2nd)" occurrence labels by counting prior visits. */
function occurrenceLabels(playHoles: RoundPlayHole[]): Map<string, string> {
    const seen = new Map<number, number>();
    const out = new Map<string, string>();
    const ordinalSuffix = (n: number) =>
        n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
    for (const ph of [...playHoles].sort((a, b) => a.ordinal - b.ordinal)) {
        const visit = (seen.get(ph.courseHoleNumber) ?? 0) + 1;
        seen.set(ph.courseHoleNumber, visit);
        out.set(ph.id, `${ph.courseHoleNumber} (${ordinalSuffix(visit)})`);
    }
    return out;
}

function renderPage(round: Round): string {
    const labels = occurrenceLabels(round.playHoles);
    const ordered = [...round.playHoles].sort((a, b) => a.ordinal - b.ordinal);

    const itineraryRows = ordered
        .map((ph) => {
            const tee = ph.tees[0];
            const repeated = labels.get(ph.id)!.includes('2nd') || labels.get(ph.id)!.includes('3rd');
            return `<tr class="${repeated ? 'repeat' : ''}">
        <td>${ph.ordinal}</td>
        <td><b>${esc(labels.get(ph.id)!)}</b></td>
        <td>${ph.par}</td>
        <td>${ph.baseStrokeIndex}</td>
        <td>${tee ? `${tee.lengthM} m (SI ${tee.strokeIndex})` : '—'}</td>
        <td class="mono">${esc(ph.playHoleDefId)}</td>
      </tr>`;
        })
        .join('\n');

    const sectionRows = round.routeSections
        .map((s) => `<li><b>${esc(s.label)}</b> — occurrences ${s.fromCanonicalOrdinal}–${s.toCanonicalOrdinal}</li>`)
        .join('');

    const groupCards = round.playingGroups
        .map((g) => {
            const startLabel = labels.get(g.startPlayHoleId) ?? `ordinal ${g.startOrdinal}`;
            const endLabel = labels.get(g.endPlayHoleId) ?? `ordinal ${g.endOrdinal}`;
            const playedPreview = g.playedOrder
                .slice(0, 6)
                .map((o) => labels.get(o.playHoleId) ?? String(o.ordinal))
                .join(' → ');
            return `<div class="group">
        <h3>${esc(g.id)} · starts ${esc(g.startTime)}</h3>
        <ul>
          <li><b>Start:</b> occurrence #${g.startOrdinal} — hole ${esc(startLabel)}</li>
          <li><b>End:</b> occurrence #${g.endOrdinal} — hole ${esc(endLabel)}</li>
          <li><b>Capacity:</b> ${g.capacity}; <b>balls:</b> ${g.ballIds.length}</li>
          <li><b>Played order (first 6):</b> ${esc(playedPreview)} → … (${g.playedOrder.length} total)</li>
        </ul>
      </div>`;
        })
        .join('\n');

    const si = round.routeSi;
    const policy = round.routeHandicapPolicy;

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Slice 3b — itinerary &amp; playing-group verification</title>
<style>
  body { font: 15px/1.5 system-ui, sans-serif; max-width: 980px; margin: 1.5rem auto; padding: 0 1rem; color: #1c2433; }
  h1 { font-size: 1.3rem; }
  h2 { background: #1f2a44; color: #fff; padding: .5rem .8rem; border-radius: 6px; font-size: 1.05rem; }
  .intro { background:#fff8e6; border:1px solid #e8d8a0; border-radius:8px; padding:.7rem 1rem; }
  .card { border: 1px solid #cdd3db; border-radius: 8px; padding: .3rem 1rem 1rem; margin: 1rem 0; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { border: 1px solid #dde2e8; padding: .3rem .5rem; text-align: left; }
  th { background: #eef2f6; }
  tr.repeat { background: #fbf0ff; }
  .mono { font-family: ui-monospace, monospace; color: #667; font-size: 12px; }
  .kv { display: grid; grid-template-columns: 220px 1fr; gap: .2rem .8rem; }
  .kv dt { font-weight: 600; }
  .group { border: 1px solid #cfe3d2; background: #f4faf5; border-radius: 6px; padding: .3rem 1rem; margin: .6rem 0; }
  .group h3 { margin: .5rem 0; font-size: 1rem; }
  .bad { color: #b00; font-weight: 600; }
  ul { margin: .3rem 0; }
</style></head>
<body>
<h1>Slice 3b — hole itinerary &amp; playing-group persistence</h1>
<div class="intro">
  <p>Everything below is read straight from <code>roundService.getById</code> off the new
  <code>round_play_holes</code> / <code>round_play_tee_holes</code> / <code>playing_groups</code> tables and the
  resolved (<code>schemaVersion: resolved-v1</code>) definition — nothing is narrated.</p>
  <p>Fixture: an 18-hole course <strong>routed as two loops of the front nine</strong>
  (<code>1..9, 1..9</code>) so every physical hole is played twice, each visit carrying its own
  stroke index. Two playing groups start at <strong>different</strong> occurrences. Regenerate with
  <code>bun scripts/render-slice-3b-verify.ts</code>.</p>
</div>

<h2>Route summary — SI provenance &amp; handicap policy</h2>
<div class="card">
  <dl class="kv">
    <dt>SI provenance</dt><dd><b>${esc(si.mode)}</b>${si.sourceLabel ? ` — ${esc(si.sourceLabel)}` : ''}${si.sourceVersion ? ` (v${esc(si.sourceVersion)})` : ''}</dd>
    <dt>Allocation cycle</dt><dd>${si.allocationCycleSize}</dd>
    <dt>Handicap policy</dt><dd><b>${esc(policy.type)}</b></dd>
    <dt>WHS posting</dt><dd>${policy.postingEligible ? '<b>eligible</b>' : `<span class="bad">ineligible</span> — ${esc(policy.postingIneligibleReason ?? '')}`}</dd>
    <dt>Route sections</dt><dd><ul>${sectionRows}</ul></dd>
  </dl>
</div>

<h2>Itinerary — ${ordered.length} occurrences (repeated holes highlighted)</h2>
<div class="card">
  <table>
    <thead><tr><th>Ordinal</th><th>Hole (visit)</th><th>Par</th><th>Base SI</th><th>Tee length / SI</th><th>play_hole_def_id</th></tr></thead>
    <tbody>${itineraryRows}</tbody>
  </table>
  <p class="mono">Note hole 1 (and every hole) appears twice with a <b>distinct base SI</b> per visit, and a
  stable, occurrence-distinct <code>play_hole_def_id</code> — the recompile-stable identity that score events key on in 3c.</p>
</div>

<h2>Playing groups — split starts &amp; rotated played order</h2>
<div class="card">
  ${groupCards}
  <p class="mono">Each group's played order is the single shared itinerary rotated to its own start
  occurrence; start/end occurrences are derived from that rotation, never stored independently.</p>
</div>
</body></html>`;
}

// --- Build the fixture ------------------------------------------------------

registerBuiltInBallCreationStrategies();
registerBuiltInFormats();

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
for (const f of [DB_PATH, `${DB_PATH}-shm`, `${DB_PATH}-wal`]) {
    if (fs.existsSync(f)) fs.rmSync(f, { force: true });
}

const db = createDb<Database>(DB_PATH);
try {
    await runMigrations(db, path.join(import.meta.dir, '../server/db/migrations'));
    const services = createServices(db);

    const club = await services.clubService.create({ name: 'Loop GK' });
    const course = await services.courseService.create({
        clubId: club.id,
        name: 'Front-Nine Loop',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: [4, 5, 3, 4, 4, 3, 5, 4, 4][i % 9],
            strokeIndex: i + 1,
        })),
    });
    const tee = await services.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        colour: '#ffd400',
        holeLengths: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            lengthM: 300 + (i % 9) * 12,
            strokeIndexOverride: null,
        })),
        ratings: [{ gender: 'M', courseRating: 71.2, slope: 132, par: 72, totalLengthM: 6200 }],
    });
    const alice = await services.playerService.register({
        username: 'alice-3b',
        password: 'password123',
        displayName: 'Alice',
    });
    const bob = await services.playerService.register({
        username: 'bob-3b',
        password: 'password123',
        displayName: 'Bob',
    });

    // Two loops of the front nine; distinct SI per visit. Mirrors the real
    // WHS convention — odd indexes on the first loop (1,3,…,17), even on the
    // second (2,4,…,18). Difficulty-labelled provenance + explicit casual policy.
    const playHoles = [
        ...Array.from({ length: 9 }, (_, i) => ({
            id: `ph-${i + 1}`,
            courseHoleNumber: i + 1,
            baseStrokeIndexOverride: 2 * i + 1,
        })),
        ...Array.from({ length: 9 }, (_, i) => ({
            id: `ph-${i + 10}`,
            courseHoleNumber: i + 1,
            baseStrokeIndexOverride: 2 * i + 2,
        })),
    ];

    const def: RoundDefinition = {
        courseId: course.id,
        playedAt: '2026-06-13',
        roundType: 'custom_holes',
        producers: [
            { id: 'prod-a', playerRef: { kind: 'player', id: alice.id }, handicapIndex: 8, gender: 'M', teeId: tee.id },
            { id: 'prod-b', playerRef: { kind: 'player', id: bob.id }, handicapIndex: 14, gender: 'M', teeId: tee.id },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 95 }, ballSelector: { strategyDefIds: ['own'] } }],
        routeSi: { mode: 'difficulty', sourceLabel: 'Club difficulty index', sourceVersion: '2026.1', allocationCycleSize: 18 },
        routeHandicapPolicy: {
            type: 'full_course_casual',
            postingEligible: false,
            postingIneligibleReason: 'two-loop route is not WHS-rated',
        },
        playHoles,
        playingGroups: [
            { id: 'group-A', startTime: '08:00', startOrdinal: 1, capacity: 2, producerDefIds: ['prod-a'] },
            { id: 'group-B', startTime: '08:00', startOrdinal: 10, capacity: 2, producerDefIds: ['prod-b'] },
        ],
    };

    const round = await services.roundService.create({ definition: def });
    const hydrated = await services.roundService.getById(round.id);
    if (!hydrated) throw new Error('round not found after create');

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, 'slice-3b-verify.html');
    fs.writeFileSync(outPath, renderPage(hydrated));
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
} finally {
    await db.destroy();
}
