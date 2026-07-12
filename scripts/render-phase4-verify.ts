// Phase 4 focused visual verification — ONE self-contained page.
//
// Phase 4 adds the Competition wrapper: a roster over 1..N materialised
// CompetitionRounds, a LIVE aggregated leaderboard folded by a registered
// AggregationStrategy (per-round arithmetic — R1 + R2 = total), a between-rounds
// cut (top_n / top_percent / within_strokes), and an immutable finalized
// Results snapshot distinct from the live board. This page builds a DEDICATED
// fixture DB (own file under tmp/, migrations + dev seed + `linkopings` + the
// three Phase 4 seeds), then renders each new surface straight off the REAL
// services:
//
//   1. competition-36-stroke — meta + lifecycle, roster, both per-round
//      leaderboards (reusing the render:formats leaderboard renderer), the
//      LIVE aggregated GROSS board with arithmetic + a tie sharing position 1,
//      and the NET board (same per-round results, folded net) to prove
//      gross ≠ net.
//   2. competition-cut-after-r1 — the R1 leaderboard, the cut DECISION
//      (advanced vs cut, straight from the §12 cut audit event, tie AT the line
//      advancing), the live R2-in-progress leaderboard, and the aggregated
//      board with the cut divider + demoted cut/incomplete rows.
//   3. competition-round-points — R1 (100%) and the OVERRIDDEN Saturday R2
//      (85%) leaderboards (the allowance override is visible in the reused
//      leaderboard header), the live round-points board, and the immutable
//      OFFICIAL results board rendered distinctly beside it.
//
// Every number comes from the real services — CompetitionLeaderboardService
// (live fold), CompetitionFinalizeService (frozen results), the cut audit event
// — never recomputed here. Self-contained: no sibling-file links, real rendered
// content inlined, a green expected-value callout precedes every section.
// Regenerate:
//
//   bun scripts/render-phase4-verify.ts

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { seedDev } from '../server/db/seeds/dev';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import { registerBuiltInAggregationStrategies } from '../server/domain/aggregation';
import type {
    CompetitionRankedEntry,
    CompetitionResultView,
} from '../server/domain/aggregation/strategy';
import type { CompetitionResults } from '../server/services/competition-finalize.service';
import type { CutDecisionEntry } from '../server/services/competition-cut.service';
import { listCompetitionAuditEvents } from '../server/services/competition-audit';
import { applyNamedSeeds } from './seed-lib';
import { collectRoundContext } from './render-lib';
import { buildRoundRenderState } from './render/round-state';
import { renderLeaderboard } from './render/sections/result';
import { ROUND_CSS } from './render/css';
import { esc, short } from './render/util';

const OUT_DIR = path.join(process.cwd(), 'tmp', 'formats');
const DB_PATH = path.join(process.cwd(), 'tmp', 'phase4-verify-fixture.sqlite');

function removeDbFiles(dbPath: string): void {
    for (const candidate of [dbPath, `${dbPath}-shm`, `${dbPath}-wal`]) {
        if (fs.existsSync(candidate)) fs.rmSync(candidate, { force: true });
    }
}

// --- Build the dedicated fixture DB -----------------------------------------

registerBuiltInBallCreationStrategies();
registerBuiltInFormats();
registerBuiltInAggregationStrategies();

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
removeDbFiles(DB_PATH);

{
    const bootDb = createDb<Database>(DB_PATH);
    await runMigrations(bootDb, path.join(import.meta.dir, '../server/db/migrations'));
    const bootServices = createServices(bootDb);
    await seedDev(bootServices);
    await bootDb.destroy();
}

await applyNamedSeeds(
    ['linkopings', 'competition-36-stroke', 'competition-cut-after-r1', 'competition-round-points'],
    { dbPath: DB_PATH },
);

const db = createDb<Database>(DB_PATH);
const services = createServices(db);

// --- Small shared renderers --------------------------------------------------

const LIFECYCLE_TONE: Record<string, string> = {
    draft: 'chip--draft',
    setup: 'chip--setup',
    active: 'chip--active',
    finalized: 'chip--finalized',
};

async function competitionByName(name: string) {
    return db
        .selectFrom('competitions')
        .selectAll()
        .where('name', '=', name)
        .executeTakeFirstOrThrow();
}

function metaBlock(comp: {
    name: string;
    lifecycle: string;
    aggregation_json: string | null;
    is_results_final: number;
    results_finalized_at: string | null;
}): string {
    const agg = comp.aggregation_json
        ? (JSON.parse(comp.aggregation_json) as { strategyId: string; config: unknown })
        : null;
    const aggLabel = agg
        ? `${esc(agg.strategyId)} <span class="muted">${esc(JSON.stringify(agg.config))}</span>`
        : `<span class="muted">default (total gross, lowest wins)</span>`;
    const finalNote =
        comp.is_results_final === 1
            ? ` · <span class="muted">results finalized ${esc(comp.results_finalized_at ?? '')}</span>`
            : '';
    return `<div class="cmeta">
  <span class="chip ${LIFECYCLE_TONE[comp.lifecycle] ?? ''}">${esc(comp.lifecycle)}</span>
  <span class="cmeta__agg">aggregation: ${aggLabel}</span>${finalNote}
</div>`;
}

async function rosterTable(competitionId: string): Promise<string> {
    const parts = await services.competitionService.listParticipants(competitionId);
    const rows = parts
        .map((p) => {
            const kind = p.playerId !== null ? 'player' : 'guest';
            const status = p.withdrawnAt
                ? '<span class="cb-tag cb-tag--out">WD</span>'
                : p.cutAfterRound !== null
                  ? `<span class="cb-tag cb-tag--out">Cut R${p.cutAfterRound}</span>`
                  : '<span class="muted">—</span>';
            return `<tr>
        <td>${esc(p.displayNameSnapshot)}</td>
        <td><code>${kind}</code></td>
        <td>${p.category ? esc(p.category) : '<span class="muted">—</span>'}</td>
        <td>${status}</td>
      </tr>`;
        })
        .join('');
    return `<table class="cat">
  <thead><tr><th>participant</th><th>kind</th><th>category</th><th>roster status</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

/** Reuse the render:formats leaderboard renderer for one materialised round. */
async function roundLeaderboard(roundId: string, heading: string): Promise<string> {
    const ctx = await collectRoundContext(services, roundId, DB_PATH);
    const state = buildRoundRenderState(ctx);
    return `<div class="embedded"><h3>${esc(heading)}</h3>${renderLeaderboard(ctx, state)}</div>`;
}

// --- The competition board (server-side mirror of the client aggregated board)
// Mirrors src/competition/aggregated-board.ts semantics: per-round columns with
// a cut divider on the first post-cut round, an arithmetic line per entry
// (counted values joined by " + ", dropped struck through, " = total"), and
// demoted cut / withdrawn rows. NUMBERS ARE NOT COMPUTED HERE — `view` is the
// registered strategy's output; this only lays it out.

function entryArithmetic(entry: CompetitionRankedEntry): string {
    const parts: string[] = [];
    for (const cell of entry.rounds) {
        if (cell.value === null) continue;
        if (cell.status === 'counted') parts.push(esc(cell.value));
        else if (cell.status === 'dropped') parts.push(`<s>${esc(cell.value)}</s>`);
    }
    const total = entry.total === null ? '—' : esc(entry.total);
    if (parts.length === 0) return `<span class="cb-arith__total">${total}</span>`;
    return `${parts.join(' + ')} = <span class="cb-arith__total">${total}</span>`;
}

function competitionBoard(
    view: CompetitionResultView,
    opts: { official?: boolean; pointsOf?: (participantId: string) => number } = {},
): string {
    const cutColIndex = view.rounds.findIndex((r) => r.postCut);
    const headCells = view.rounds
        .map((r, i) => {
            const divider = i === cutColIndex ? ' cb-c--divider' : '';
            const postCut = r.postCut ? '<span class="cb-postcut">post-cut</span>' : '';
            return `<th class="cb-c${divider}">R${r.roundNumber}${postCut}</th>`;
        })
        .join('');
    const pointsHead = opts.pointsOf ? '<th class="cb-points">Pts</th>' : '';

    const body = view.entries
        .map((entry) => {
            const cellsByRound = new Map(entry.rounds.map((c) => [c.roundNumber, c]));
            const demoted = entry.withdrawn || entry.cutAfterRound !== null;
            const rowClasses = ['cb-row'];
            if (entry.withdrawn) rowClasses.push('cb-row--withdrawn');
            else if (entry.cutAfterRound !== null) rowClasses.push('cb-row--cut');
            else if (entry.position === 1) rowClasses.push('cb-row--lead');
            if (entry.incomplete) rowClasses.push('cb-row--incomplete');

            const roundCells = view.rounds
                .map((r, i) => {
                    const divider = i === cutColIndex ? ' cb-c--divider' : '';
                    const cell = cellsByRound.get(r.roundNumber);
                    if (!cell) return `<td class="cb-c cb-c--missing${divider}">—</td>`;
                    const text =
                        cell.value === null
                            ? '—'
                            : cell.status === 'dropped'
                              ? `<s>${esc(cell.value)}</s>`
                              : esc(cell.value);
                    return `<td class="cb-c cb-c--${cell.status}${divider}">${text}</td>`;
                })
                .join('');

            const statusTag = entry.withdrawn
                ? ' <span class="cb-tag cb-tag--out">WD</span>'
                : entry.cutAfterRound !== null
                  ? ` <span class="cb-tag cb-tag--out">Cut R${entry.cutAfterRound}</span>`
                  : entry.incomplete
                    ? ' <span class="cb-tag cb-tag--warn">in progress</span>'
                    : '';
            const catTag = entry.category
                ? ` <span class="cb-tag cb-cat">${esc(entry.category)}</span>`
                : '';
            const pos = demoted ? '—' : String(entry.position);
            const pts = opts.pointsOf
                ? `<td class="cb-points">${esc(opts.pointsOf(entry.participantId))}</td>`
                : '';

            return `<tr class="${rowClasses.join(' ')}">
      <td class="cb-pos">${pos}</td>
      <td class="cb-who">
        <div class="cb-who__line"><span class="cb-name">${esc(entry.displayName)}</span>${catTag}${statusTag}</div>
        <div class="cb-arith">${entryArithmetic(entry)}</div>
      </td>
      ${roundCells}
      <td class="cb-total">${entry.total === null ? '—' : esc(entry.total)}</td>
      ${pts}
    </tr>`;
        })
        .join('');

    const opLabel =
        view.operator.kind === 'best_n'
            ? `Best ${view.operator.n} of ${view.rounds.length}`
            : 'Total across rounds';
    const wrapClass = opts.official ? 'cb cb--official' : 'cb';
    return `<table class="${wrapClass}">
  <caption class="cb-cap">${esc(view.metricLabel)} · ${esc(opLabel)} · ${view.direction === 'low' ? 'lowest wins' : 'highest wins'}</caption>
  <thead><tr><th class="cb-pos">#</th><th class="cb-who">Player · arithmetic</th>${headCells}<th class="cb-total">Total</th>${pointsHead}</tr></thead>
  <tbody>${body}</tbody>
</table>`;
}

function cutDecisionTable(advanced: CutDecisionEntry[], cut: CutDecisionEntry[]): string {
    const row = (e: CutDecisionEntry, made: boolean) => `<tr class="${made ? 'cut-adv' : 'cut-out'}">
      <td class="num">${e.position}</td>
      <td>${esc(e.displayName)}</td>
      <td class="num">${e.total ?? '—'}</td>
      <td>${made ? '<b>advances</b>' : `<b>CUT</b>${e.reason ? ` <span class="muted">(${esc(e.reason)})</span>` : ''}`}</td>
    </tr>`;
    const rows = [
        ...advanced.map((e) => row(e, true)),
        ...cut.map((e) => row(e, false)),
    ].join('');
    return `<table class="cat">
  <thead><tr><th>R1 pos</th><th>player</th><th>R1 total</th><th>cut decision</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

try {
    // ======================================================================
    // 1. competition-36-stroke — live aggregate, arithmetic, tie, gross vs net
    // ======================================================================
    const strokeComp = await competitionByName('Klubbmästerskap 36-hål (stroke)');
    const strokeRounds = await services.competitionRoundService.listForCompetition(strokeComp.id);
    const strokeBoardRes = await services.competitionLeaderboardService.forCompetition(strokeComp.id);
    if (!strokeBoardRes.ok) throw new Error(`36-stroke board refused: ${strokeBoardRes.refusal.message}`);
    const strokeGross = strokeBoardRes.value.view;

    // Net = the SAME per-round results, folded through the same registered
    // strategy with metric:'net' (exactly what finalization publishes as its
    // second variant). Prepared inputs come from the service.
    const strokePrep = await services.competitionLeaderboardService.prepare(strokeComp.id);
    if (!strokePrep.ok) throw new Error(`36-stroke prepare refused: ${strokePrep.refusal.message}`);
    const strokeNet = strokePrep.value.strategy.aggregate({
        roundResults: strokePrep.value.roundResults,
        roster: strokePrep.value.roster,
        config: { metric: 'net' },
    });

    let strokeRoundLeaderboards = '';
    for (const r of strokeRounds) {
        strokeRoundLeaderboards += await roundLeaderboard(
            r.roundId,
            `Round ${r.roundNumber} · ${esc(r.date)} · leaderboard`,
        );
    }

    const section1 = `
<section class="verify-block required" id="stroke">
  <h2>1 &middot; competition-36-stroke &mdash; live aggregate, arithmetic, gross vs net</h2>
  ${metaBlock(strokeComp)}
  <div class="callout">
    <p><strong>Required check &mdash; 36-hole arithmetic, tie shares the position:</strong> the GROSS board
      folds each player's two round totals (<code>R1 + R2 = total</code>, visible on every row). Expect
      <b>Erik 82 + 78 = 160</b> and <b>Sara 80 + 80 = 160</b> TIED, both stamped <b>position 1</b> (the next
      player, Johan 164, is position <b>3</b> &mdash; the tie consumes a slot). Karin 172, Gunnar 176.</p>
    <p><strong>Required check &mdash; gross vs net boards differ per handicaps:</strong> the NET board is the
      SAME per-round results folded on the <code>net</code> metric (strokes &minus; playing handicap). Handicaps
      differ, so the order REORDERS completely: Karin (highest handicap) leads NET at <b>90</b>, while the
      gross co-leaders Erik/Sara fall to <b>5th</b> / <b>3rd</b>. Net is not a re-scoring &mdash; it is the same
      rounds read on a different metric.</p>
  </div>
  <h3 class="sub">Roster</h3>
  ${await rosterTable(strokeComp.id)}
  <h3 class="sub">Per-round leaderboards <span class="muted">(reused render:formats renderer)</span></h3>
  ${strokeRoundLeaderboards}
  <h3 class="sub">Live aggregated board &mdash; GROSS <span class="muted">(lowest wins)</span></h3>
  <div class="embedded">${competitionBoard(strokeGross)}</div>
  <h3 class="sub">Live aggregated board &mdash; NET <span class="muted">(same rounds, net metric)</span></h3>
  <div class="embedded">${competitionBoard(strokeNet)}</div>
</section>`;

    // ======================================================================
    // 2. competition-cut-after-r1 — cut line, tie at the line, demoted rows
    // ======================================================================
    const cutComp = await competitionByName('Matchcup — cut efter runda 1');
    const cutRounds = await services.competitionRoundService.listForCompetition(cutComp.id);
    const cutBoardRes = await services.competitionLeaderboardService.forCompetition(cutComp.id);
    if (!cutBoardRes.ok) throw new Error(`cut board refused: ${cutBoardRes.refusal.message}`);
    const cutView = cutBoardRes.value.view;

    const cutEvents = await listCompetitionAuditEvents(db, cutComp.id, 'cut_applied');
    const cutPayload = cutEvents[0]?.payload as
        | { rule: unknown; advanced: CutDecisionEntry[]; cut: CutDecisionEntry[] }
        | undefined;
    if (!cutPayload) throw new Error('cut: no cut_applied audit event found');

    let cutRoundLeaderboards = '';
    for (const r of cutRounds) {
        const label = r.postCut
            ? `Round ${r.roundNumber} · ${esc(r.date)} · POST-CUT · ${r.status === 'complete' ? 'complete' : 'in progress'}`
            : `Round ${r.roundNumber} · ${esc(r.date)} · leaderboard`;
        cutRoundLeaderboards += await roundLeaderboard(r.roundId, label);
    }

    const section2 = `
<section class="verify-block required" id="cut">
  <h2>2 &middot; competition-cut-after-r1 &mdash; cut line + tie at the line</h2>
  ${metaBlock(cutComp)}
  <div class="callout">
    <p><strong>Required check &mdash; a top-3 cut advances FOUR on a tie at the line:</strong> the rule is
      <code>top_n, cutValue 3, after round 1</code>. R1 standings: Erik 78 (1st), Sara 82 (2nd),
      <b>Johan 85 &amp; Karin 85 (T3)</b>, Emil 86 (5th), Fia 90 (6th). The line sits at position 3, and both
      players TIED there advance &mdash; so <b>Erik, Sara, Johan AND Karin</b> make a "top-3" cut. <b>Emil misses
      by a single stroke</b>; Fia is out. Read the decision table: 4 advance, 2 cut.</p>
    <p><strong>Required check &mdash; the aggregated board draws the cut + demotes the cut rows:</strong> R2 is a
      post-cut round (its column is marked, with a divider before it). The two cut players (Emil, Fia) render
      <b>below</b> the field with a <b>Cut R1</b> tag and an em-dash R2 cell (<code>status: cut</code>, not
      missing). Karin (survived, hasn't started R2) shows a <b>missing</b> R2 cell and an "in progress" tag.</p>
  </div>
  <h3 class="sub">Roster <span class="muted">(cut stamps visible)</span></h3>
  ${await rosterTable(cutComp.id)}
  <h3 class="sub">Cut decision <span class="muted">(from the §12 cut_applied audit event)</span></h3>
  <div class="embedded">${cutDecisionTable(cutPayload.advanced, cutPayload.cut)}</div>
  <h3 class="sub">Per-round leaderboards</h3>
  ${cutRoundLeaderboards}
  <h3 class="sub">Live aggregated board <span class="muted">(cut divider + demoted rows)</span></h3>
  <div class="embedded">${competitionBoard(cutView)}</div>
</section>`;

    // ======================================================================
    // 3. competition-round-points — Saturday override, finalized vs live
    // ======================================================================
    const rpComp = await competitionByName('Poängbogey-helg (round points)');
    const rpRounds = await services.competitionRoundService.listForCompetition(rpComp.id);
    const rpBoardRes = await services.competitionLeaderboardService.forCompetition(rpComp.id);
    if (!rpBoardRes.ok) throw new Error(`round-points board refused: ${rpBoardRes.refusal.message}`);
    const rpView = rpBoardRes.value.view;

    const rpResultsRes = await services.competitionFinalizeService.resultsForCompetition(rpComp.id);
    if (!rpResultsRes.ok) throw new Error(`round-points results refused: ${rpResultsRes.refusal.message}`);
    const rpResults: CompetitionResults = rpResultsRes.value;
    const officialSet = rpResults.resultSets[0]!;
    // The official snapshot re-renders the frozen CompetitionRankedEntry rows
    // through the same board, tagged official; points column comes from the row.
    const officialView: CompetitionResultView = {
        ...rpView,
        entries: officialSet.entries.map((e) => e.entry),
    };
    const pointsById = new Map(officialSet.entries.map((e) => [e.participantId, e.points]));

    let rpRoundLeaderboards = '';
    for (const r of rpRounds) {
        const tag = r.roundNumber === 1 ? '100% (default)' : '85% (Saturday override)';
        rpRoundLeaderboards += await roundLeaderboard(
            r.roundId,
            `Round ${r.roundNumber} · ${esc(r.date)} · allowance ${tag}`,
        );
    }

    const section3 = `
<section class="verify-block required" id="round-points">
  <h2>3 &middot; competition-round-points &mdash; Saturday override + finalized vs live</h2>
  ${metaBlock(rpComp)}
  <div class="callout">
    <p><strong>Required check &mdash; round-2 format override visible:</strong> both rounds are singles
      Stableford, but round 2 (Saturday) was materialised from the 100% default and then EDITED through the
      round-edit path to <b>85% allowance</b>. The reused leaderboard headers below read
      <b>Stableford @ 100%</b> for round 1 and <b>Stableford @ 85%</b> for round 2 &mdash; the per-round override
      the competition default was copied into, then diverged from. The live board sums the per-round
      <code>points</code> metric (<code>R1 + R2 = total</code>, highest wins).</p>
    <p><strong>Required check &mdash; finalized official results are distinct + immutable:</strong> this
      competition is <b>finalized</b>. The OFFICIAL board (right, framed + watermarked) is the immutable
      <code>competition_results</code> snapshot with a Points column; the LIVE board (left) keeps computing but
      is informational once finalized. Both agree here (nothing changed after finalize) &mdash; the distinction
      is provenance, not arithmetic: the official numbers are frozen and a late score edit would move only the
      live board.</p>
  </div>
  <h3 class="sub">Roster</h3>
  ${await rosterTable(rpComp.id)}
  <h3 class="sub">Per-round leaderboards <span class="muted">(allowance override in the header)</span></h3>
  ${rpRoundLeaderboards}
  <div class="board-pair">
    <div class="board-col">
      <h3 class="sub">Live aggregated board <span class="muted">(informational once finalized)</span></h3>
      <div class="embedded">${competitionBoard(rpView)}</div>
    </div>
    <div class="board-col">
      <h3 class="sub">Official results <span class="muted">(immutable snapshot)</span></h3>
      <div class="embedded">
        <p class="official-note">🔒 Frozen at ${esc(rpResults.finalizedAt)} · scoring type <code>${esc(officialSet.scoringType)}</code> · immutable (a late score edit changes only the live board).</p>
        ${competitionBoard(officialView, { official: true, pointsOf: (id) => pointsById.get(id) ?? 0 })}
      </div>
    </div>
  </div>
</section>`;

    // ======================================================================
    // Assemble
    // ======================================================================
    const requiredChecks = `
<div class="checks">
  <b>Required checks (verify by eye):</b>
  <ol>
    <li><b>36-stroke arithmetic + tie</b> — every row shows <code>R1 + R2 = total</code>; Erik 82+78=160 and
        Sara 80+80=160 TIE and share position 1 (Johan next at position 3).</li>
    <li><b>Cut line + tie at the line</b> — a <code>top_n=3</code> cut advances FOUR (Johan &amp; Karin tie at
        85 = T3, both advance); Emil misses by one stroke. Cut divider on R2; Emil/Fia demoted.</li>
    <li><b>Round-2 format override</b> — round 2's leaderboard header reads <b>Stableford @ 85%</b> vs round 1's
        <b>@ 100%</b> (materialised from the default, then overridden via round-edit).</li>
    <li><b>Finalized official results distinct + immutable</b> — the round-points OFFICIAL board is framed +
        watermarked, carries a Points column and a frozen-at note, and reads as a snapshot, not the live board.</li>
    <li><b>Gross vs net differ</b> — the 36-stroke GROSS and NET boards reorder completely (Karin leads net,
        the gross co-leaders drop) — same rounds, different metric.</li>
  </ol>
</div>`;

    const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Phase 4 — Competition wrapper + aggregation verification</title>
<style>
${ROUND_CSS}
body { max-width: 1180px; margin: 1.5rem auto; padding: 0 1rem; color: #16202e; }
h1 { font-size: 1.4rem; }
.verify-block { border: 2px solid #cdd3db; border-radius: 10px; margin: 2rem 0; padding: 0 1.2rem 1.2rem; scroll-margin-top: 1rem; }
.verify-block > h2 { background: #1f2a44; color: #fff; margin: 0 -1.2rem 1rem; padding: .7rem 1.2rem; border-radius: 8px 8px 0 0; font-size: 1.05rem; }
.verify-block.required { border-color: #2a7; }
.verify-block.required > h2 { background: #1f5d3a; }
.callout { background: #f3f8f4; border-left: 4px solid #2a7; padding: .6rem 1rem; border-radius: 4px; margin-bottom: 1rem; }
.callout p { margin: .4rem 0; }
.checks { background:#eef6f0; border:1px solid #b9dcc6; border-radius:8px; padding:.7rem 1rem 1rem; }
.checks ol { margin:.3rem 0 0; padding-left:1.3rem; }
.checks li { margin:.35rem 0; }
.embedded { border-top: 1px dashed #cdd3db; padding-top: .6rem; margin-top: .4rem; }
.embedded p > a[href="index.html"] { display: none; }
.sub { font-size: .98rem; margin: 1.1rem 0 .3rem; color:#33415a; border-bottom:1px solid #e4e9ef; padding-bottom:.2rem; }
.muted { color: #667; font-weight: 400; }
.intro { background:#fff8e6; border:1px solid #e8d8a0; border-radius:8px; padding:.8rem 1rem; }
.toc { background:#f6f8fa; border:1px solid #e1e6ea; border-radius:8px; padding:.6rem 1rem; }
.toc ul { margin:.3rem 0 0; padding-left: 1.2rem; font-size: 13px; }
table.cat { border-collapse: collapse; width: 100%; font-size: 13px; margin:.3rem 0; }
table.cat th, table.cat td { border: 1px solid #dde2e8; padding: .3rem .55rem; text-align: left; }
table.cat thead th { background: #eef2f6; }
table.cat td.num { text-align: right; font-variant-numeric: tabular-nums; }
tr.cut-adv { background:#eaf6ee; }
tr.cut-out { background:#fdecec; }

/* competition meta */
.cmeta { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; margin:.2rem 0 .6rem; font-size:13px; }
.chip { display:inline-block; padding:.12rem .55rem; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:#fff; }
.chip--draft { background:#8a94a6; }
.chip--setup { background:#3a72c4; }
.chip--active { background:#1f8f4e; }
.chip--finalized { background:#7a4dd0; }

/* competition board */
.cb { border-collapse: collapse; width:100%; font-size:13px; margin:.3rem 0; font-variant-numeric: tabular-nums; }
.cb caption.cb-cap { caption-side: top; text-align:left; font-weight:600; color:#33415a; padding:.2rem 0 .35rem; }
.cb th, .cb td { border:1px solid #dde2e8; padding:.3rem .5rem; text-align:right; }
.cb th.cb-who, .cb td.cb-who { text-align:left; }
.cb thead th { background:#eef2f6; }
.cb .cb-pos { width:2.2rem; text-align:center; }
.cb .cb-name { font-weight:600; }
.cb .cb-arith { font-size:11.5px; color:#5a6678; }
.cb-arith__total { font-weight:700; color:#16202e; }
.cb .cb-total { font-weight:700; }
.cb-row--lead { background:#f2f8ff; }
.cb-row--cut, .cb-row--withdrawn { color:#8a94a6; background:#f7f8fa; }
.cb-row--incomplete .cb-total { color:#b07a1a; }
.cb-c--divider { border-left:2px solid #7a4dd0 !important; }
.cb-c--missing, .cb-c--cut { color:#aab2be; }
.cb-postcut { display:block; font-size:9px; font-weight:600; color:#7a4dd0; text-transform:uppercase; }
.cb-tag { display:inline-block; padding:.02rem .35rem; border-radius:4px; font-size:10.5px; font-weight:700; vertical-align:middle; }
.cb-tag--out { background:#e3536112; color:#c0392b; border:1px solid #e5989888; }
.cb-tag--warn { background:#f0a52012; color:#b07a1a; border:1px solid #e6c88a88; }
.cb-cat { background:#eef2f6; color:#33415a; }
.cb-points { font-weight:700; }
.cb--official { outline:3px double #7a4dd0; background:
  repeating-linear-gradient(135deg, #faf7ff, #faf7ff 16px, #f3ecff 16px, #f3ecff 18px); }
.cb--official caption.cb-cap::before { content:"OFFICIAL · "; color:#7a4dd0; font-weight:800; }
.official-note { background:#f3ecff; border:1px solid #d8c6f5; border-radius:6px; padding:.35rem .6rem; font-size:12px; margin:.2rem 0 .5rem; }
.board-pair { display:flex; gap:1.2rem; flex-wrap:wrap; }
.board-col { flex:1 1 460px; min-width:0; }
</style>
</head>
<body>
<h1>Phase 4 &middot; Competition wrapper + aggregation — static verification</h1>
<div class="intro">
  <p>Phase 4 wraps 1..N materialised CompetitionRounds in a Competition with a live aggregated leaderboard
  (a pure fold through a registered <code>AggregationStrategy</code>), a between-rounds cut, and an immutable
  finalized Results snapshot. Every board below reads through the REAL services
  (<code>CompetitionLeaderboardService</code> live fold, <code>CompetitionFinalizeService</code> frozen results,
  the §12 cut audit event) against a dedicated fixture DB built fresh by this script (migrations + dev seed +
  <code>linkopings</code> + the three Phase 4 seeds). Per-round leaderboards reuse the exact
  <code>render:formats</code> leaderboard renderer; the aggregated board mirrors the client
  <code>aggregated-board</code> layout but never re-derives a number.</p>
  <p class="muted">Self-contained — no links to click. Regenerate with <code>bun scripts/render-phase4-verify.ts</code>.</p>
</div>
${requiredChecks}
<div class="toc"><b>Contents</b><ul>
  <li><a href="#stroke">1 &middot; competition-36-stroke — arithmetic, tie, gross vs net</a></li>
  <li><a href="#cut">2 &middot; competition-cut-after-r1 — cut line + tie at the line</a></li>
  <li><a href="#round-points">3 &middot; competition-round-points — Saturday override, finalized vs live</a></li>
</ul></div>
${section1}
${section2}
${section3}
</body>
</html>`;

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, 'phase4-verify.html');
    fs.writeFileSync(outPath, page);
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
} finally {
    await db.destroy();
}
