// Slice 3c focused visual verification — ONE self-contained page.
//
// Scoring slice: events + scorecards + strategies + handicap allocation now run
// on stable play-hole OCCURRENCE ids. This page builds a fixture DB of the gate
// routes, SCORES each through the real compile → event → result path, and
// renders every scenario's scorecard with occurrence-labelled columns plus its
// route/SI/handicap provenance — straight off `roundService.getById` and
// `leaderboardService.resultForRound`, nothing narrated.
//
//   bun scripts/render-slice-3c-verify.ts

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import type { RoundDefinition } from '../server/domain/round-definition';
import type { Round } from '../server/services/round.service';
import type { GridRow, RoundResult, ScoreGridSection } from '../server/domain/strategies/result-sections';

const OUT_DIR = path.join(process.cwd(), 'tmp', 'formats');
const DB_PATH = path.join(process.cwd(), 'tmp', 'slice-3c-fixture.sqlite');

function esc(s: string): string {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}

const EXPLICIT_CASUAL = {
    type: 'explicit' as const,
    postingEligible: false,
    postingIneligibleReason: 'custom route — not WHS-rated',
};

interface Scenario {
    name: string;
    blurb: string;
    def: RoundDefinition;
    /** producerDefId → { canonical ordinal → strokes }. */
    scores: Record<string, Record<number, number>>;
}

// --- Render one scenario card ----------------------------------------------

function gridRowOf(card: ScoreGridSection, kind: GridRow['kind'], label?: string): GridRow | undefined {
    return card.rows.find((r) => r.kind === kind && !r.subjectBallId && (label ? r.label === label : true));
}

function rowCells(card: ScoreGridSection, row: GridRow | undefined): string {
    const byPlayHole = new Map((row?.cells ?? []).map((c) => [c.playHoleId, c]));
    return card.holes
        .map((h) => `<td>${esc(byPlayHole.get(h.playHoleId)?.display ?? '')}</td>`)
        .join('');
}

function scenarioCard(scn: Scenario, round: Round, result: RoundResult): string {
    const card = result.slots[0]?.cards[0];
    const si = round.routeSi;
    const policy = round.routeHandicapPolicy;

    const header = card
        ? `<tr><th>Occurrence →</th>${card.holes
              .map((h) => {
                  const repeat = h.occurrenceLabel.includes('(');
                  return `<th class="${repeat ? 'repeat' : ''}">${esc(h.occurrenceLabel)}</th>`;
              })
              .join('')}</tr>`
        : '';
    const ordinalRow = card
        ? `<tr class="dim"><th>Ordinal</th>${card.holes.map((h) => `<td>${h.canonicalOrdinal}</td>`).join('')}</tr>`
        : '';
    // "Played #" row — only meaningful when the displayed ball's group starts
    // off occurrence #1 (a shotgun / split start), where canonical order and
    // played order diverge. This is the visible proof of the rotation.
    const shownBallId = card?.subjectBallIds[0];
    const group = shownBallId
        ? round.playingGroups.find((g) => g.ballIds.includes(shownBallId))
        : undefined;
    const playedByPlayHole = new Map((group?.playedOrder ?? []).map((o) => [o.playHoleId, o.groupRelativeOrder]));
    const playedRow =
        card && group && group.startOrdinal !== 1
            ? `<tr class="dim"><th>Played #</th>${card.holes
                  .map((h) => `<td>${playedByPlayHole.get(h.playHoleId) ?? ''}</td>`)
                  .join('')}</tr>`
            : '';
    const par = gridRowOf(card!, 'par');
    const sidx = gridRowOf(card!, 'si');
    const given = gridRowOf(card!, 'given');
    const gross = gridRowOf(card!, 'gross');
    const net = gridRowOf(card!, 'net');
    const points = gridRowOf(card!, 'points');

    const bodyRows = card
        ? [
              `<tr class="dim"><th>Par</th>${rowCells(card, par)}</tr>`,
              `<tr class="dim"><th>SI</th>${rowCells(card, sidx)}</tr>`,
              given ? `<tr class="dim"><th>Given</th>${rowCells(card, given)}</tr>` : '',
              gross ? `<tr><th>Gross</th>${rowCells(card, gross)}</tr>` : '',
              net ? `<tr><th>Net</th>${rowCells(card, net)}</tr>` : '',
              points ? `<tr><th>Points</th>${rowCells(card, points)}</tr>` : '',
          ].join('')
        : '<tr><td>(no scorecard)</td></tr>';

    const totals = (result.slots[0]?.leaderboard ?? [])
        .filter((l) => l.kind === 'ranked')
        .map((l) =>
            l.kind === 'ranked'
                ? `<li><b>${esc(l.metricLabel)}</b>: ${l.entries.map((e) => e.total ?? '—').join(', ')}</li>`
                : '',
        )
        .join('');

    const sections = result.routeSections
        .map((s) => `${esc(s.label)} [${s.fromCanonicalOrdinal}–${s.toCanonicalOrdinal}]`)
        .join(' · ');

    const groups = round.playingGroups
        .map(
            (g) =>
                `${esc(g.id)}: starts ord #${g.startOrdinal} (hole ${
                    round.playHoles.find((p) => p.id === g.startPlayHoleId)?.courseHoleNumber ?? '?'
                }) → ord #${g.endOrdinal}`,
        )
        .join('<br>');

    return `
<section class="scn">
  <h2>${esc(scn.name)}</h2>
  <p class="blurb">${scn.blurb}</p>
  <dl class="kv">
    <dt>SI provenance</dt><dd>${esc(si.mode)}${si.sourceLabel ? ` — ${esc(si.sourceLabel)}` : ''} · cycle ${si.allocationCycleSize}</dd>
    <dt>Handicap policy</dt><dd>${esc(policy.type)} · WHS posting ${policy.postingEligible ? '<b>eligible</b>' : `<span class="bad">ineligible</span> (${esc(policy.postingIneligibleReason ?? '')})`}</dd>
    <dt>Route sections</dt><dd>${sections || '—'}</dd>
    <dt>Playing groups</dt><dd>${groups || '—'}</dd>
    <dt>Totals</dt><dd><ul>${totals}</ul></dd>
  </dl>
  <table class="card">
    <thead>${header}${ordinalRow}${playedRow}</thead>
    <tbody>${bodyRows}</tbody>
  </table>
</section>`;
}

// --- Build fixture + scenarios ---------------------------------------------

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

    const club = await services.clubService.create({ name: 'Occurrence GK' });
    const course = await services.courseService.create({
        clubId: club.id,
        name: 'Proving Ground',
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await services.teeService.create({
        courseId: course.id,
        name: 'White',
        colour: '#ffffff',
        holeLengths: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, lengthM: 350, strokeIndexOverride: null })),
        // slope 113, CR 72, par 72 → CH == handicapIndex (incl. plus indices).
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });

    let pc = 0;
    const player = async (name: string) =>
        (await services.playerService.register({ username: `p3c-${pc++}`, password: 'password123', displayName: name })).id;
    const alice = await player('Alice');

    const ownStroke = (producers: RoundDefinition['producers']): Pick<RoundDefinition, 'producers' | 'ballStrategies' | 'slots'> => ({
        producers,
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 }, ballSelector: { strategyDefIds: ['own'] } }],
    });
    const oneProducer = (idx = 9) => [{ id: 'prod-a', playerRef: { kind: 'player' as const, id: alice }, handicapIndex: idx, gender: 'M' as const, teeId: tee.id }];

    const par4Scores = (ords: number[], strokes: number): Record<number, number> =>
        Object.fromEntries(ords.map((o) => [o, strokes]));

    const scenarios: Scenario[] = [
        {
            name: 'Hole-5 shotgun start',
            blurb: 'A standard full 18 (occurrence ids and columns stay canonical, holes 1–18), but the playing group TEES OFF ON HOLE 5. All 18 holes are played; only the order changes — the "Played #" row shows the rotation: hole 5 is played 1st, wrapping round to hole 4 played 18th. Scoring totals are order-independent, so the card is otherwise an ordinary round.',
            def: {
                courseId: course.id,
                playedAt: '2026-06-13',
                roundType: 'full_18',
                ...ownStroke(oneProducer(9)),
                playingGroups: [
                    { id: 'shotgun-grp', startTime: '08:00', startOrdinal: 5, capacity: 1, producerDefIds: ['prod-a'] },
                ],
            },
            scores: { 'prod-a': par4Scores(Array.from({ length: 18 }, (_, i) => i + 1), 4) },
        },
        {
            name: 'Wrapped route 5..18,1..4',
            blurb: 'Here the ITINERARY ITSELF is defined wrapped — the round tees off on hole 5 and wraps through hole 4, so the occurrence columns run 5,6,…,18,1,…,4 (the Ordinal row is the canonical 1–18). All 18 holes played once.',
            def: {
                courseId: course.id,
                playedAt: '2026-06-13',
                roundType: 'custom_holes',
                ...ownStroke(oneProducer(9)),
                playHoles: [...Array.from({ length: 14 }, (_, i) => ({ courseHoleNumber: i + 5, baseStrokeIndexOverride: i + 1 })),
                    ...Array.from({ length: 4 }, (_, i) => ({ courseHoleNumber: i + 1, baseStrokeIndexOverride: i + 15 }))],
                routeSi: { mode: 'custom', allocationCycleSize: 18 },
                routeHandicapPolicy: EXPLICIT_CASUAL,
            },
            scores: { 'prod-a': par4Scores(Array.from({ length: 18 }, (_, i) => i + 1), 4) },
        },
        {
            name: 'Repeated hole — distinct 2nd-occurrence SI',
            blurb: 'Two loops of holes 1–3 (six occurrences). Each visit carries its own stroke index, scores independently, and renders as a distinct column (3 (1st) / 3 (2nd)) — no collision.',
            def: {
                courseId: course.id,
                playedAt: '2026-06-13',
                roundType: 'custom_holes',
                ...ownStroke(oneProducer(0)),
                playHoles: [
                    { courseHoleNumber: 1, baseStrokeIndexOverride: 1 },
                    { courseHoleNumber: 2, baseStrokeIndexOverride: 3 },
                    { courseHoleNumber: 3, baseStrokeIndexOverride: 5 },
                    { courseHoleNumber: 1, baseStrokeIndexOverride: 2 },
                    { courseHoleNumber: 2, baseStrokeIndexOverride: 4 },
                    { courseHoleNumber: 3, baseStrokeIndexOverride: 6 },
                ],
                routeSi: { mode: 'custom', allocationCycleSize: 6 },
                routeHandicapPolicy: EXPLICIT_CASUAL,
            },
            scores: { 'prod-a': { 1: 4, 2: 4, 3: 4, 4: 6, 5: 5, 6: 5 } },
        },
        {
            name: '10 distinct holes routed 1..10,1..8',
            blurb: '18 occurrences over 10 distinct holes (holes 1–8 played twice). Cycle 18; every occurrence par for a clean 36-point stableford.',
            def: {
                courseId: course.id,
                playedAt: '2026-06-13',
                roundType: 'custom_holes',
                ...ownStroke(oneProducer(0)),
                playHoles: [...Array.from({ length: 10 }, (_, i) => ({ courseHoleNumber: i + 1, baseStrokeIndexOverride: i + 1 })),
                    ...Array.from({ length: 8 }, (_, i) => ({ courseHoleNumber: i + 1, baseStrokeIndexOverride: i + 11 }))],
                routeSi: { mode: 'custom', allocationCycleSize: 18 },
                routeHandicapPolicy: EXPLICIT_CASUAL,
            },
            scores: { 'prod-a': par4Scores(Array.from({ length: 18 }, (_, i) => i + 1), 4) },
        },
        {
            name: 'Arbitrary subset (1,3,5,7,9), sparse cycle-18 SI',
            blurb: 'An official 5-hole subset keeping the physical SI ranks (2,7,13,5,9) sparse within cycle 18. PH 9 → strokes land only on occurrences with SI ≤ 9 (not the SI-13 hole).',
            def: {
                courseId: course.id,
                playedAt: '2026-06-13',
                roundType: 'custom_holes',
                ...ownStroke(oneProducer(9)),
                playHoles: [
                    { courseHoleNumber: 1, baseStrokeIndexOverride: 2 },
                    { courseHoleNumber: 3, baseStrokeIndexOverride: 7 },
                    { courseHoleNumber: 5, baseStrokeIndexOverride: 13 },
                    { courseHoleNumber: 7, baseStrokeIndexOverride: 5 },
                    { courseHoleNumber: 9, baseStrokeIndexOverride: 9 },
                ],
                routeSi: { mode: 'custom', allocationCycleSize: 18 },
                routeHandicapPolicy: EXPLICIT_CASUAL,
            },
            scores: { 'prod-a': par4Scores([1, 2, 3, 4, 5], 5) },
        },
        {
            name: 'Plus handicap (index −2)',
            blurb: 'Full 18, plus-2 player playing every hole at par. Strokes are GIVEN BACK on the two highest-SI holes (17, 18): Given shows −1 there, so net is 5 (worse than gross) on those holes only.',
            def: {
                courseId: course.id,
                playedAt: '2026-06-13',
                roundType: 'full_18',
                ...ownStroke(oneProducer(-2)),
            },
            scores: { 'prod-a': par4Scores(Array.from({ length: 18 }, (_, i) => i + 1), 4) },
        },
        {
            name: 'PH greater than one cycle (index 20)',
            blurb: 'Full 18, PH 20 over cycle 18: every occurrence gets one stroke; the two lowest-SI holes (1, 2) get a second. Given shows +1 everywhere, +2 on SI 1 & 2.',
            def: {
                courseId: course.id,
                playedAt: '2026-06-13',
                roundType: 'full_18',
                ...ownStroke(oneProducer(20)),
            },
            scores: { 'prod-a': par4Scores(Array.from({ length: 18 }, (_, i) => i + 1), 4) },
        },
    ];

    const blocks: string[] = [];
    for (const scn of scenarios) {
        const round = await services.roundService.create({ definition: scn.def });
        const hydrated = await services.roundService.getById(round.id);
        if (!hydrated) throw new Error(`round ${scn.name} not found`);
        const ordinalToPlayHole = new Map(hydrated.playHoles.map((p) => [p.ordinal, p.id]));

        // Resolve a ballId per producer.
        const bpRows = await db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', round.id)
            .select(['bp.producer_def_id', 'bp.ball_id'])
            .execute();
        const ballByProducer = new Map(bpRows.map((r) => [r.producer_def_id, r.ball_id]));

        let evt = 0;
        for (const [producerDefId, ordinalScores] of Object.entries(scn.scores)) {
            const ballId = ballByProducer.get(producerDefId)!;
            for (const [ord, strokes] of Object.entries(ordinalScores)) {
                await services.scoreEventService.append({
                    roundId: round.id,
                    ballId,
                    playHoleId: ordinalToPlayHole.get(Number(ord))!,
                    strokes,
                    eventType: 'score_entered',
                    clientEventId: `${round.id}-${evt++}`,
                });
            }
        }

        const result = await services.leaderboardService.resultForRound(round.id);
        blocks.push(scenarioCard(scn, hydrated, result));
    }

    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Slice 3c — itinerary scoring verification</title>
<style>
  body { font: 15px/1.5 system-ui, sans-serif; max-width: 1080px; margin: 1.5rem auto; padding: 0 1rem; color: #1c2433; }
  h1 { font-size: 1.35rem; }
  h2 { background: #1f2a44; color: #fff; padding: .5rem .8rem; border-radius: 6px; font-size: 1.05rem; }
  .intro { background:#fff8e6; border:1px solid #e8d8a0; border-radius:8px; padding:.7rem 1rem; }
  .scn { border: 1px solid #cdd3db; border-radius: 8px; padding: .2rem 1rem 1rem; margin: 1.2rem 0; }
  .blurb { color: #344; }
  table.card { border-collapse: collapse; width: 100%; font-size: 13px; margin-top: .6rem; }
  table.card th, table.card td { border: 1px solid #dde2e8; padding: .25rem .4rem; text-align: center; }
  table.card thead th { background: #eef2f6; }
  table.card tbody th, table.card thead tr:first-child th:first-child { text-align: left; background:#f5f8fb; }
  th.repeat { background: #fbe7ff; }
  tr.dim td, tr.dim th { color: #667; }
  .kv { display: grid; grid-template-columns: 160px 1fr; gap: .15rem .8rem; font-size: 13px; margin:.4rem 0; }
  .kv dt { font-weight: 600; }
  .kv ul { margin: 0; padding-left: 1.1rem; }
  .bad { color: #b00; font-weight: 600; }
</style></head>
<body>
<h1>Slice 3c — event, scoring &amp; scorecard itinerary migration</h1>
<div class="intro">
  <p>Each scenario below is <strong>scored through the real path</strong> — compile → <code>score_event</code>
  (keyed on <code>play_hole_id</code>) → trigger-materialised <code>scorecards</code> → format strategy →
  <code>leaderboardService.resultForRound</code>. The columns are itinerary <strong>occurrences</strong>
  (repeated holes shown as <code>3 (1st)</code> / <code>3 (2nd)</code>, highlighted), not raw hole numbers.
  Regenerate with <code>bun scripts/render-slice-3c-verify.ts</code>.</p>
</div>
${blocks.join('\n')}
</body></html>`;

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, 'slice-3c-verify.html');
    fs.writeFileSync(outPath, html);
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
} finally {
    await db.destroy();
}
