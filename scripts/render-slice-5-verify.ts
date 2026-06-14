// Slice 5 focused visual verification — ONE self-contained page.
//
// Catalog + server-side round-setup planner. For each scenario this page shows
// the full pipeline the mobile wizard drives, with NO format/ball-strategy
// knowledge on the client:
//
//   1. CATALOG     — the registered FormatDescriptor[] the wizard chose from
//                    (GET /formats), filtered to the selected formats.
//   2. DRAFT       — the format-agnostic RoundSetupDraft submitted (producers,
//                    format selections, route choice). No selectors, no
//                    ball-strategy ids, no def-ids.
//   3. DEFINITION  — the server-built RoundDefinition: ball strategies COALESCED
//                    (one shared own-ball + non-coalescing pair strategies) and
//                    slots with server-owned ballSelectors / team groupings.
//   4. COMPILED    — the persisted round: the balls actually created (own vs
//                    pair), per-slot ball counts, and the resolved route.
//
//   bun scripts/render-slice-5-verify.ts

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import { formatCatalog } from '../server/domain/formats/plugin';
import { buildRoundDefinition } from '../server/domain/round-setup/builder';
import type { RoundSetupDraft } from '../server/domain/round-setup/draft';
import type { CourseRouteTemplateRoute } from '../server/domain/course-route-template';
import type { RoundBall } from '../server/services/round.service';

const OUT_DIR = path.join(process.cwd(), 'tmp', 'formats');
const DB_PATH = path.join(process.cwd(), 'tmp', 'slice-5-fixture.sqlite');

function esc(s: string): string {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}
function json(v: unknown): string {
    return `<pre>${esc(JSON.stringify(v, null, 2))}</pre>`;
}

interface Scenario {
    name: string;
    blurb: string;
    expect: string[];
    draft: RoundSetupDraft;
}

function descriptorTable(formatIds: string[]): string {
    const byId = new Map(formatCatalog().map((d) => [d.id, d]));
    const rows = formatIds
        .map((id) => {
            const d = byId.get(id);
            if (!d) return `<tr><td>${esc(id)}</td><td colspan="5">(not registered)</td></tr>`;
            const b = d.requirements.balls;
            return `<tr>
              <td><code>${esc(d.id)}</code></td>
              <td>${esc(d.label)}</td>
              <td>${esc(d.scoringMode)} / ${esc(d.teamShape)}</td>
              <td>${esc(b.ballMode)} · ${b.producerCount.min}–${b.producerCount.max}p</td>
              <td>${b.requiresSlotTeamGrouping ? 'yes' : '—'}</td>
              <td>${d.metrics.map((m) => `${esc(m.label)}↑↓`.replace('↑↓', m.direction === 'high' ? '↑' : '↓')).join(', ') || '—'}</td>
            </tr>`;
        })
        .join('');
    return `<table class="grid">
      <thead><tr><th>id</th><th>label</th><th>scoring / shape</th><th>ball req</th><th>slot teams</th><th>metrics</th></tr></thead>
      <tbody>${rows}</tbody></table>`;
}

function ballsTable(balls: RoundBall[]): string {
    const rows = balls
        .map(
            (b) =>
                `<tr><td>${esc(b.label ?? '—')}</td><td>${b.players.length === 1 ? 'own' : 'pair/team'}</td><td>${esc(
                    b.players.map((p) => p.displayName).join(' & '),
                )}</td><td>${b.courseHandicap}</td><td>${b.slots
                    .map((s) => `${esc(s.slotDefId)}${s.teamLabel ? `(${esc(s.teamLabel)})` : ''}`)
                    .join(', ')}</td></tr>`,
        )
        .join('');
    return `<table class="grid">
      <thead><tr><th>ball</th><th>mode</th><th>players</th><th>CH</th><th>in slots</th></tr></thead>
      <tbody>${rows}</tbody></table>`;
}

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

    const club = await services.clubService.create({ name: 'Planner GK' });
    const course = await services.courseService.create({
        clubId: club.id,
        name: 'Planner Course',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await services.teeService.create({
        courseId: course.id,
        name: 'Yellow',
        holeLengths: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, lengthM: 350, strokeIndexOverride: null })),
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });

    const NAMES = ['Ann', 'Bo', 'Cal', 'Dan'];
    const HIS = [8, 12, 18, 24];
    const players: string[] = [];
    for (let i = 0; i < NAMES.length; i++) {
        players.push(
            (await services.playerService.register({ username: `s5-${i}`, password: 'password123', displayName: NAMES[i] })).id,
        );
    }
    const roster = (n: number): RoundSetupDraft['producers'] =>
        players.slice(0, n).map((id, i) => ({
            producerDefId: `p${i + 1}`,
            playerRef: { kind: 'player' as const, id },
            handicapIndex: HIS[i],
            gender: 'M' as const,
            teeId: tee.id,
        }));
    const PAIRS = [
        { label: 'Ann & Bo', producerDefIds: ['p1', 'p2'] },
        { label: 'Cal & Dan', producerDefIds: ['p3', 'p4'] },
    ];

    // A named "10 + first 8" template owned by the course.
    const tenPlusEight: CourseRouteTemplateRoute = {
        playHoles: [
            ...Array.from({ length: 10 }, (_, i) => ({ id: `loop1-${i + 1}`, courseHoleNumber: i + 1, baseStrokeIndexOverride: i + 1 })),
            ...Array.from({ length: 8 }, (_, i) => ({ id: `loop2-${i + 1}`, courseHoleNumber: i + 1, baseStrokeIndexOverride: i + 11 })),
        ],
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: { type: 'explicit', postingEligible: false, postingIneligibleReason: 'partial-replay route — not WHS-rated' },
    };
    const tpl = await services.courseRouteTemplateService.create({
        courseId: course.id,
        name: '10 + first 8',
        route: tenPlusEight,
    });

    const scenarios: Scenario[] = [
        {
            name: 'Mixed formats — coalescing (the gate)',
            blurb: 'Stableford + better-ball + foursomes over the same four players. The wizard sends only format ids + team groupings; the server decides the ball strategies.',
            expect: [
                'Exactly TWO ball strategies in the DEFINITION: one shared own_ball_per_player (stableford + better-ball reuse it) + one alt_shot_pair (foursomes).',
                'Stableford & better-ball slots both select the SAME own-ball strategy def-id; foursomes selects the pair strategy.',
                'COMPILED: 4 own-balls + 2 pair-balls (6 total). Stableford slot has 4 balls, better-ball 4 (grouped 2v2), foursomes 2.',
            ],
            draft: {
                courseId: course.id,
                playedAt: '2026-06-13',
                producers: roster(4),
                formats: [
                    { formatId: 'stableford_individual' },
                    { formatId: 'stableford_better_ball', teams: PAIRS },
                    { formatId: 'stroke_play_foursomes', teams: PAIRS },
                ],
            },
        },
        {
            name: 'Producer subset — shared own-ball, narrowed by selector',
            blurb: 'Stableford for all four, plus a köpenhamnare between just Ann, Bo & Cal. The köpenhamnare slot reuses the one own-ball strategy but is narrowed with a producer selector — no second ball-creation pass.',
            expect: [
                'ONE own_ball_per_player strategy in the DEFINITION.',
                'The köpenhamnare slot ballSelector adds producerDefIds [p1,p2,p3]; stableford selects all.',
                'COMPILED: 4 own-balls total; köpenhamnare slot resolves to 3 balls, stableford to 4.',
            ],
            draft: {
                courseId: course.id,
                playedAt: '2026-06-13',
                producers: roster(4),
                formats: [
                    { formatId: 'stableford_individual' },
                    { formatId: 'kopenhamnare_individual', producerDefIds: ['p1', 'p2', 'p3'] },
                ],
            },
        },
        {
            name: 'Named route template — "10 + first 8"',
            blurb: 'Two players pick the course-owned "10 + first 8" template. The server resolves + FREEZES the template into the round; later template edits never rewrite this round.',
            expect: [
                'COMPILED route: 18 occurrences over 10 distinct holes (holes 1–8 played twice), custom SI cycle 18, posting INELIGIBLE.',
                'The DEFINITION carries explicit frozen play-hole ids (loop1-* / loop2-*) with per-occurrence SI overrides.',
            ],
            draft: {
                courseId: course.id,
                playedAt: '2026-06-13',
                roundType: 'custom_holes',
                route: { templateId: tpl.id },
                producers: roster(2),
                formats: [{ formatId: 'stableford_individual' }],
            },
        },
        {
            name: 'Custom difficulty-SI draft',
            blurb: 'A direct custom itinerary: full 18 with a club-difficulty stroke-index order (not the printed course SI). Route generation stays server-owned — the client only names the source + ranks.',
            expect: [
                'COMPILED route SI mode = difficulty, sourceLabel "club difficulty 2026", cycle 18, posting eligible.',
                'The DEFINITION freezes per-hole baseStrokeIndexOverride ranks; the round compiles with no client-side route logic.',
            ],
            draft: {
                courseId: course.id,
                playedAt: '2026-06-13',
                roundType: 'custom_holes',
                route: {
                    playHoles: [3, 1, 5, 7, 9, 11, 13, 15, 17, 2, 4, 6, 8, 10, 12, 14, 16, 18].map((si, i) => ({
                        id: `d${i + 1}`,
                        courseHoleNumber: i + 1,
                        baseStrokeIndexOverride: si,
                    })),
                    routeSi: { mode: 'difficulty', sourceLabel: 'club difficulty 2026', allocationCycleSize: 18 },
                    routeHandicapPolicy: { type: 'official_route', postingEligible: true },
                },
                producers: roster(2),
                formats: [{ formatId: 'stableford_individual' }],
            },
        },
    ];

    const blocks: string[] = [];
    for (const scn of scenarios) {
        const formatIds = scn.draft.formats.map((f) => f.formatId);

        // STEP 3 — the server-built definition (resolve the template first, as
        // createFromDraft does internally, so the displayed definition matches).
        let displayDraft = scn.draft;
        if (scn.draft.route?.templateId) {
            const frozen = await services.courseRouteTemplateService.resolveForRound(scn.draft.route.templateId);
            displayDraft = { ...scn.draft, route: frozen };
        }
        const built = buildRoundDefinition(displayDraft);
        const definitionBlock = built.ok
            ? `<h4>3 · Server-built RoundDefinition</h4>
               <p class="lbl">Ball strategies (coalesced):</p>${json(built.definition.ballStrategies)}
               <p class="lbl">Slots (server-owned selectors / team grouping):</p>${json(built.definition.slots)}`
            : `<h4>3 · Builder diagnostics</h4>${json(built.diagnostics)}`;

        // STEP 4 — create the round for real + read it back.
        const result = await services.roundService.createFromDraft(scn.draft);
        let compiledBlock: string;
        if (result.ok) {
            const balls = await services.roundService.ballsForRound(result.round.id);
            const r = result.round;
            const slotCounts = r.formatSlots
                .map((s) => {
                    const n = balls.filter((b) => b.slots.some((x) => x.slotDefId === s.slotDefId)).length;
                    return `<li><code>${esc(s.slotDefId)}</code> ${esc(s.formatId)} — <b>${n}</b> balls</li>`;
                })
                .join('');
            const routeLine = `${esc(r.routeSi.mode)}${r.routeSi.sourceLabel ? ` (${esc(r.routeSi.sourceLabel)})` : ''} · cycle ${r.routeSi.allocationCycleSize} · ${r.playHoles.length} occurrences · posting ${r.routeHandicapPolicy.postingEligible ? '<b>eligible</b>' : `<span class="bad">ineligible</span>`}`;
            compiledBlock = `<h4>4 · Compiled round</h4>
              <dl class="kv"><dt>Route</dt><dd>${routeLine}</dd><dt>Per-slot balls</dt><dd><ul>${slotCounts}</ul></dd></dl>
              ${ballsTable(balls)}`;
        } else {
            compiledBlock = `<h4>4 · Compile diagnostics</h4>${json(result.diagnostics)}`;
        }

        blocks.push(`
<section class="scn">
  <h2>${esc(scn.name)}</h2>
  <p class="blurb">${esc(scn.blurb)}</p>
  <div class="expect"><b>What to verify</b><ul>${scn.expect.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>
  <h4>1 · Catalog (formats the wizard chose from)</h4>
  ${descriptorTable(formatIds)}
  <h4>2 · RoundSetupDraft (client-submitted, format-agnostic)</h4>
  ${json(scn.draft)}
  ${definitionBlock}
  ${compiledBlock}
</section>`);
    }

    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Slice 5 — catalog + round-setup planner verification</title>
<style>
  body { font: 15px/1.5 system-ui, sans-serif; max-width: 1080px; margin: 1.5rem auto; padding: 0 1rem; color: #1c2433; }
  h1 { font-size: 1.35rem; }
  h2 { background: #1f2a44; color: #fff; padding: .5rem .8rem; border-radius: 6px; font-size: 1.05rem; }
  h4 { margin: 1rem 0 .3rem; font-size: .95rem; color:#1f2a44; }
  .intro { background:#fff8e6; border:1px solid #e8d8a0; border-radius:8px; padding:.7rem 1rem; }
  .scn { border: 1px solid #cdd3db; border-radius: 8px; padding: .2rem 1rem 1rem; margin: 1.2rem 0; }
  .blurb { color: #344; }
  .expect { background:#eef6ff; border:1px solid #b9d4f0; border-radius:6px; padding:.4rem .8rem; font-size:13px; }
  .expect ul { margin:.3rem 0; padding-left:1.1rem; }
  .lbl { margin:.5rem 0 .1rem; font-size:13px; font-weight:600; color:#445; }
  pre { background:#f6f8fa; border:1px solid #e1e6ea; border-radius:6px; padding:.5rem .7rem; font-size:12px; overflow:auto; margin:.2rem 0; }
  table.grid { border-collapse: collapse; width: 100%; font-size: 13px; margin:.3rem 0; }
  table.grid th, table.grid td { border: 1px solid #dde2e8; padding: .25rem .5rem; text-align: left; }
  table.grid thead th { background: #eef2f6; }
  .kv { display: grid; grid-template-columns: 120px 1fr; gap: .15rem .8rem; font-size: 13px; margin:.4rem 0; }
  .kv dt { font-weight: 600; }
  .kv ul { margin: 0; padding-left: 1.1rem; }
  .bad { color: #b00; font-weight: 600; }
  code { background:#eef2f6; padding:0 .2rem; border-radius:3px; }
</style></head>
<body>
<h1>Slice 5 — catalog + server-side round-setup planner</h1>
<div class="intro">
  <p>Each scenario runs the real pipeline: the <strong>catalog</strong> descriptors the wizard chose from, the
  format-agnostic <strong>RoundSetupDraft</strong> it submitted (no selectors / strategy ids / def-ids), the
  server-built <strong>RoundDefinition</strong> (ball strategies coalesced, slot selectors + team groupings emitted
  by the server), and the <strong>compiled round</strong> (balls created, per-slot counts, resolved route) — all via
  <code>roundService.createFromDraft</code>. Regenerate with <code>bun scripts/render-slice-5-verify.ts</code>.</p>
</div>
${blocks.join('\n')}
</body></html>`;

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, 'slice-5-verify.html');
    fs.writeFileSync(outPath, html);
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
} finally {
    await db.destroy();
}
