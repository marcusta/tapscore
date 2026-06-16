// Phase 2.6d-final static verification — ONE self-contained page.
//
// Covers the four engine-integrity fixes whose numbers must be eyeball-checkable:
//   E1  Greensomes/Scramble DRAFT-derived ball handicaps (plugin-owned ball
//       plans: weighted pair / by-rank team — NOT the old alt-shot avg).
//   E2a Mixed-tee per-occurrence SI: two balls, different tees, different SI on
//       the SAME occurrences → SI row + strokes-given + net follow each own tee.
//   E2b Equal/!-monotonic recorded_at replay: the LAST appended edit wins by the
//       persisted `seq` order, not the wall clock.
//   E3  Opaque slot ids (`main-stableford`, `afternoon-match`) — results render
//       in definition order with no `slot-<N>` parsing.
//
// Self-contained: in-page content only. Regenerate with
//   bun scripts/render-slice-2.6d-final-verify.ts

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import type { RoundDefinition } from '../server/domain/round-definition';
import type { RoundSetupDraft } from '../server/domain/round-setup/draft';
import { ROUND_CSS } from './render/css';
import { collectRoundContext, renderRoundHtml } from './render-lib';

const DB_PATH = path.join(process.cwd(), 'tmp', '2.6d-final-verify.sqlite');
const RENDER_DIR = path.join(process.cwd(), 'tmp', 'formats');

function esc(s: string): string {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}
function bodyOf(html: string): string {
    const m = /<body>([\s\S]*)<\/body>/.exec(html);
    return m ? m[1] : html;
}

for (const p of [DB_PATH, `${DB_PATH}-shm`, `${DB_PATH}-wal`]) {
    if (fs.existsSync(p)) fs.rmSync(p);
}
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

registerBuiltInBallCreationStrategies();
registerBuiltInFormats();

const db = createDb<Database>(DB_PATH);
await runMigrations(db, path.join(import.meta.dir, '../server/db/migrations'));
const services = createServices(db);

async function flatCourse(name: string): Promise<{ courseId: string; tee: string }> {
    const club = await services.clubService.create({ name: `${name} GC` });
    const course = await services.courseService.create({
        clubId: club.id,
        name,
        holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const tee = await services.teeService.create({
        courseId: course.id,
        name: 'White',
        holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    });
    return { courseId: course.id, tee: tee.id };
}

let pn = 0;
async function player(): Promise<string> {
    pn += 1;
    const p = await services.playerService.register({
        username: `vp${pn}`,
        password: 'password123',
        displayName: `Player ${pn}`,
    });
    return p.id;
}

const sections: string[] = [];

// =====================================================================
// E1 — Greensomes / Scramble draft-derived ball handicaps
// =====================================================================
{
    const { courseId, tee } = await flatCourse('E1');
    const mkDraft = async (formatId: string, indices: number[]): Promise<string> => {
        const ids: string[] = [];
        for (let i = 0; i < indices.length; i++) ids.push(await player());
        const draft: RoundSetupDraft = {
            courseId,
            playedAt: '2026-06-12',
            producers: indices.map((hi, i) => ({
                producerDefId: `p${i + 1}`,
                playerRef: { kind: 'player' as const, id: ids[i]! },
                handicapIndex: hi,
                gender: 'M' as const,
                teeId: tee,
            })),
            formats: [{ formatId, teams: [{ label: 'A', producerDefIds: indices.map((_, i) => `p${i + 1}`) }] }],
        };
        const res = await services.roundService.createFromDraft(draft);
        if (!res.ok) throw new Error(`draft ${formatId} failed: ${JSON.stringify(res.diagnostics)}`);
        return res.round.id;
    };

    const cases = [
        { fmt: 'greensomes', idx: [8, 18], plan: 'greensomes_pair · weighted 60/40', expected: 'round(.6×8 + .4×18) = round(12) = 12' },
        { fmt: 'scramble', idx: [8, 12, 18, 24], plan: 'scramble_team · by_rank [25,20,15,10]', expected: 'round(.25×8+.20×12+.15×18+.10×24) = round(9.5) = 10' },
        { fmt: 'scramble', idx: [8, 18], plan: 'scramble_team · by_rank [35,15]', expected: 'round(.35×8 + .15×18) = round(5.5) = 6' },
    ];

    const rows: string[] = [];
    let firstRoundId = '';
    for (const c of cases) {
        const roundId = await mkDraft(c.fmt, c.idx);
        if (!firstRoundId) firstRoundId = roundId;
        const balls = await services.roundService.ballsForRound(roundId);
        const ballCh = balls.map((b) => b.courseHandicap).join(', ');
        rows.push(`<tr>
          <td><code>${esc(c.fmt)}</code></td>
          <td>${c.idx.join(', ')}</td>
          <td><code>${esc(c.plan)}</code></td>
          <td>${esc(c.expected)}</td>
          <td class="num"><b>${ballCh}</b></td>
        </tr>`);
    }

    // Score the greensomes pair ball par for a real rendered card.
    const gBalls = await services.roundService.ballsForRound(firstRoundId);
    const gRound = (await services.roundService.getById(firstRoundId))!;
    for (let i = 0; i < gRound.playHoles.length; i++) {
        await services.scoreEventService.append({
            roundId: firstRoundId, ballId: gBalls[0]!.id, playHoleId: gRound.playHoles[i]!.id,
            strokes: 4, eventType: 'score_entered', clientEventId: `g${i}`,
        });
    }
    const gBody = bodyOf(renderRoundHtml(await collectRoundContext(services, firstRoundId, DB_PATH)));

    sections.push(`
<section class="verify-block">
  <h2>E1 · Greensomes / Scramble draft-derived ball handicaps <span style="font-weight:400">· required check</span></h2>
  <div class="callout">
    <p>Each team format now OWNS its ball-creation plan (ADR-0001). Run through the format-agnostic draft path
    (<code>RoundSetupDraft → buildRoundDefinition → compile</code>), greensomes derives a <b>weighted pair</b> handicap and
    scramble a <b>by-rank team</b> handicap (percentages by team size) — NOT the old generic alt-shot average.</p>
  </div>
  <table class="grid">
    <thead><tr><th>format</th><th>producer indices (= CH)</th><th>plugin ball plan</th><th>expected ball CH</th><th>persisted ball CH</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>
  <div class="embedded"><h3>Real rendered greensomes card (weighted pair CH 12)</h3>${gBody}</div>
</section>`);
}

// =====================================================================
// E2a — Mixed-tee per-occurrence SI
// =====================================================================
{
    const club = await services.clubService.create({ name: 'E2a GC' });
    const course = await services.courseService.create({
        clubId: club.id, name: 'E2a', holeCount: 18,
        holes: Array.from({ length: 18 }, (_, i) => ({ holeNumber: i + 1, par: 4, strokeIndex: i + 1 })),
    });
    const white = (await services.teeService.create({
        courseId: course.id, name: 'White', holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    })).id;
    const red = (await services.teeService.create({
        courseId: course.id, name: 'Red', holeLengths: [],
        ratings: [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 6000 }],
    })).id;
    const p1 = await player();
    const p2 = await player();
    const definition: RoundDefinition = {
        courseId: course.id, playedAt: '2026-06-12', roundType: 'custom_holes',
        routeSi: { mode: 'custom', allocationCycleSize: 18 },
        routeHandicapPolicy: { type: 'explicit', postingEligible: false, postingIneligibleReason: 'mixed-tee SI verify' },
        playHoles: [
            { id: 'occ-a', courseHoleNumber: 5, baseStrokeIndexOverride: 16, teeOverrides: [{ teeId: white, lengthM: 350, strokeIndexOverride: 1 }, { teeId: red, lengthM: 320, strokeIndexOverride: 18 }] },
            { id: 'occ-b', courseHoleNumber: 6, baseStrokeIndexOverride: 17, teeOverrides: [{ teeId: white, lengthM: 350, strokeIndexOverride: 18 }, { teeId: red, lengthM: 320, strokeIndexOverride: 1 }] },
            { id: 'occ-c', courseHoleNumber: 5, baseStrokeIndexOverride: 18, teeOverrides: [{ teeId: white, lengthM: 350, strokeIndexOverride: 2 }, { teeId: red, lengthM: 320, strokeIndexOverride: 2 }] },
        ],
        producers: [
            { id: 'P1', playerRef: { kind: 'player', id: p1 }, handicapIndex: 2, gender: 'M', teeId: white },
            { id: 'P2', playerRef: { kind: 'player', id: p2 }, handicapIndex: 2, gender: 'M', teeId: red },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stroke_play_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
    };
    const round = await services.roundService.create({ definition });
    for (const p of round.playHoles) {
        const balls = await services.roundService.ballsForRound(round.id);
        for (const b of balls) {
            await services.scoreEventService.append({
                roundId: round.id, ballId: b.id, playHoleId: p.id,
                strokes: 4, eventType: 'score_entered', clientEventId: `${b.id}-${p.id}`,
            });
        }
    }
    const body = bodyOf(renderRoundHtml(await collectRoundContext(services, round.id, DB_PATH)));
    sections.push(`
<section class="verify-block">
  <h2>E2a · Mixed-tee per-occurrence stroke index <span style="font-weight:400">· required check</span></h2>
  <div class="callout">
    <p>Both players have CH 2 (identical tees-by-rating) so the ONLY difference is the per-tee SI. Each ball's card shows the
    SI <b>its own tee</b> allocates against, and the strokes-given / net follow it:</p>
    <ul>
      <li><b>White</b> (P1): occurrence SI <code>1 / 18 / 2</code> → +1 stroke on occ-a &amp; occ-c (SI ≤ PH 2).</li>
      <li><b>Red</b> (P2): occurrence SI <code>18 / 1 / 2</code> → +1 stroke on occ-b &amp; occ-c.</li>
    </ul>
    <p>Both par every hole (gross 12); each receives 2 strokes → <b>net 10</b>. The displayed SI rows differ between the two
    cards — proving the per-tee occurrence override reaches scoring (regression: the leaderboard used to drop it to base SI).</p>
  </div>
  <div class="embedded">${body}</div>
</section>`);
}

// =====================================================================
// E2b — replay by append-order seq, not wall clock
// =====================================================================
{
    const { courseId, tee } = await flatCourse('E2b');
    const pid = await player();
    const definition: RoundDefinition = {
        courseId, playedAt: '2026-06-12', roundType: 'front_9',
        producers: [{ id: 'P1', playerRef: { kind: 'player', id: pid }, handicapIndex: 0, gender: 'M', teeId: tee }],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [{ id: 'slot-0', formatId: 'stroke_play_individual', allowanceConfig: { type: 'flat', pct: 100 } }],
    };
    const round = await services.roundService.create({ definition });
    const ball = (await services.roundService.ballsForRound(round.id))[0]!.id;
    const h1 = round.playHoles[0]!.id;
    for (let h = 2; h <= 9; h++) {
        await services.scoreEventService.append({
            roundId: round.id, ballId: ball, playHoleId: round.playHoles[h - 1]!.id,
            strokes: 4, eventType: 'score_entered', clientEventId: `h${h}`,
        });
    }
    // Append 1: 8, recorded LATER. Append 2: 4, recorded EARLIER (the truth).
    await services.scoreEventService.append({ roundId: round.id, ballId: ball, playHoleId: h1, strokes: 8, eventType: 'score_entered', clientEventId: 'e-a', recordedAt: '2026-01-01T00:00:09Z' });
    await services.scoreEventService.append({ roundId: round.id, ballId: ball, playHoleId: h1, strokes: 4, eventType: 'score_entered', clientEventId: 'e-b', recordedAt: '2026-01-01T00:00:01Z' });
    const body = bodyOf(renderRoundHtml(await collectRoundContext(services, round.id, DB_PATH)));
    sections.push(`
<section class="verify-block">
  <h2>E2b · Replay order = append seq, not wall clock <span style="font-weight:400">· required check</span></h2>
  <div class="callout">
    <p>Hole 1 has two edits whose wall clocks run backwards vs append order:</p>
    <table class="grid">
      <thead><tr><th>append #</th><th>seq</th><th>recorded_at</th><th>strokes</th><th>winner?</th></tr></thead>
      <tbody>
        <tr><td>1</td><td class="num">9</td><td><code>00:00:09</code> (later)</td><td class="num">8</td><td>—</td></tr>
        <tr><td>2</td><td class="num">10</td><td><code>00:00:01</code> (earlier)</td><td class="num">4</td><td><b>✓ wins (highest seq)</b></td></tr>
      </tbody>
    </table>
    <p>Hole 1 reads <b>4</b> (the last appended), so gross = 9 holes × par 4 = <b>36</b>. Under the old wall-clock ordering the
    later-timestamp 8 would have won (gross 40). The scorecard trigger, the replay, and the latest-score reducer all key on <code>seq</code>.</p>
  </div>
  <div class="embedded">${body}</div>
</section>`);
}

// =====================================================================
// E3 — Opaque slot ids
// =====================================================================
{
    const { courseId, tee } = await flatCourse('E3');
    const p1 = await player();
    const p2 = await player();
    const definition: RoundDefinition = {
        courseId, playedAt: '2026-06-12', roundType: 'front_9',
        producers: [
            { id: 'P1', playerRef: { kind: 'player', id: p1 }, handicapIndex: 9, gender: 'M', teeId: tee },
            { id: 'P2', playerRef: { kind: 'player', id: p2 }, handicapIndex: 9, gender: 'M', teeId: tee },
        ],
        ballStrategies: [{ id: 'own', strategyId: 'own_ball_per_player', derivationConfig: { type: 'single' } }],
        slots: [
            { id: 'main-stableford', formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 100 }, ballSelector: { strategyDefIds: ['own'] } },
            { id: 'afternoon-match', formatId: 'match_play_individual', allowanceConfig: { type: 'flat', pct: 100 }, ballSelector: { strategyDefIds: ['own'] } },
        ],
    };
    const round = await services.roundService.create({ definition });
    const balls = await services.roundService.ballsForRound(round.id);
    for (let h = 1; h <= 9; h++) {
        for (const b of balls) {
            await services.scoreEventService.append({
                roundId: round.id, ballId: b.id, playHoleId: round.playHoles[h - 1]!.id,
                strokes: 4, eventType: 'score_entered', clientEventId: `${b.id}-${h}`,
            });
        }
    }
    const rr = await services.leaderboardService.resultForRound(round.id);
    const slotRows = await db.selectFrom('slots').where('round_id', '=', round.id).select(['slot_def_id', 'ordinal']).orderBy('ordinal').execute();
    const body = bodyOf(renderRoundHtml(await collectRoundContext(services, round.id, DB_PATH)));
    sections.push(`
<section class="verify-block">
  <h2>E3 · Opaque slot ids <span style="font-weight:400">· required check</span></h2>
  <div class="callout">
    <p>The two slots use human-meaningful ids — <code>main-stableford</code>, <code>afternoon-match</code> — not <code>slot-0/1</code>.
    Order comes from the persisted <code>ordinal</code> column, never by parsing the id:</p>
    <table class="grid">
      <thead><tr><th>slot_def_id (opaque)</th><th>persisted ordinal</th><th>result slotIndex</th></tr></thead>
      <tbody>
        ${slotRows.map((s, i) => `<tr><td><code>${esc(s.slot_def_id)}</code></td><td class="num">${s.ordinal}</td><td class="num">${rr.slots[i]!.slotIndex}</td></tr>`).join('')}
      </tbody>
    </table>
    <p>Both slots render below in definition order; nothing parses a <code>slot-&lt;N&gt;</code> convention.</p>
  </div>
  <div class="embedded">${body}</div>
</section>`);
}

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Phase 2.6d-final — static verification</title>
<style>
${ROUND_CSS}
body { max-width: 1120px; margin: 1.5rem auto; padding: 0 1rem; }
.verify-block { border: 2px solid #2a7; border-radius: 10px; margin: 2rem 0; padding: 0 1.2rem 1.2rem; }
.verify-block > h2 { background: #1f5d3a; color: #fff; margin: 0 -1.2rem 1rem; padding: .7rem 1.2rem; border-radius: 8px 8px 0 0; font-size: 1.05rem; }
.callout { background: #f3f8f4; border-left: 4px solid #2a7; padding: .6rem 1rem; border-radius: 4px; margin-bottom: 1rem; }
.callout ul { margin: .3rem 0; padding-left: 1.2rem; }
.embedded { border-top: 1px dashed #cdd3db; padding-top: .8rem; margin-top: 1rem; }
.embedded h1, .embedded h3 { font-size: 1.02rem; }
.embedded p > a[href="index.html"] { display: none; }
.intro { background:#fff8e6; border:1px solid #e8d8a0; border-radius:8px; padding:.8rem 1rem; }
table.grid { border-collapse: collapse; margin: .5rem 0; }
table.grid th, table.grid td { border: 1px solid #cdd3db; padding: .3rem .6rem; text-align: left; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
<h1>Phase 2.6d-final · core engine integrity — static verification</h1>
<div class="intro">
  <p>Self-contained proof of the four eyeball-checkable engine-integrity fixes: plugin-owned ball plans (E1), per-tee
  occurrence SI in scoring (E2a), append-order (<code>seq</code>) replay (E2b), and opaque slot ids (E3). Each block shows the
  expected arithmetic and the <strong>real rendered output</strong>. Regenerate with
  <code>bun scripts/render-slice-2.6d-final-verify.ts</code>.</p>
</div>
${sections.join('\n')}
</body>
</html>`;

fs.mkdirSync(RENDER_DIR, { recursive: true });
const outPath = path.join(RENDER_DIR, 'slice-2.6d-final-verify.html');
fs.writeFileSync(outPath, page);
// eslint-disable-next-line no-console
console.log(`wrote ${outPath}`);
await db.destroy();
