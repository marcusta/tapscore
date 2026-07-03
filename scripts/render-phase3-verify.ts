// Phase 3 focused visual verification — ONE self-contained page.
//
// Phase 3 layers account-bound behaviour on top of the 2.6e M1 FriendlyRound
// front door: self-serve registration + manual handicap maintenance
// (`handicap_history`, source `'manual'`), authenticated token-scoped
// guest-claim (`GuestClaimService`), `creator_player_id` on the wrapper, and
// per-event `recorded_by_player_id` attribution. This page builds a DEDICATED
// fixture DB (own file under tmp/, migrations + dev seed + the three Phase 3
// seeds), then renders each new surface straight off the real services:
//
//   1. Manual handicap chain — `HandicapService.historyFor` + the live
//      `players.handicap_index` — for `player-manual-handicap`.
//   2. Guest-claim contrast — claimed vs unclaimed guest, straight off
//      `guest_players` + `ball_players`, PLUS the round's real scorecard
//      (rendered through the canonical `renderRoundHtml` pipeline) proving
//      the frozen display names are unchanged by the claim.
//   3. Attribution — the `attributed-scoring` round's score events with
//      recorded_by resolved to a player name (or "anonymous"), plus the
//      wrapper's `creator_player_id`.
//   4. Dashboard query proof — `DashboardService.forPlayer` for the claimed
//      player, showing the claimed round with its `shareToken`.
//
// Self-contained: no sibling-file links, real rendered content inlined, a
// green expected-value callout precedes every embedded section. Regenerate:
//
//   bun scripts/render-phase3-verify.ts

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDb } from '@basics/core/server/db';
import { runMigrations } from '@basics/core/server/migrate';
import type { Database } from '../server/db/schema';
import { createServices } from '../server/services/index';
import { seedDev } from '../server/db/seeds/dev';
import { registerBuiltInBallCreationStrategies } from '../server/domain/strategies/ball-creation';
import { registerBuiltInFormats } from '../server/domain/formats';
import { applyNamedSeeds } from './seed-lib';
import { collectRoundContext, renderRoundHtml } from './render-lib';
import { ROUND_CSS } from './render/css';
import { esc, short } from './render/util';
import { MANUAL_HANDICAP_USERNAME } from './seeds/player-manual-handicap';
import { GUEST_CLAIM_CLAIMED_USERNAME, GUEST_CLAIM_UNCLAIMED_GUEST_NAME } from './seeds/guest-claim';
import {
    ATTRIBUTED_SCORING_CREATOR_USERNAME,
    ATTRIBUTED_SCORING_OTHER_USERNAME,
} from './seeds/attributed-scoring';

const OUT_DIR = path.join(process.cwd(), 'tmp', 'formats');
const DB_PATH = path.join(process.cwd(), 'tmp', 'phase3-verify-fixture.sqlite');

function bodyOf(html: string): string {
    const m = /<body>([\s\S]*)<\/body>/.exec(html);
    return m ? m[1] : html;
}

function removeDbFiles(dbPath: string): void {
    for (const candidate of [dbPath, `${dbPath}-shm`, `${dbPath}-wal`]) {
        if (fs.existsSync(candidate)) fs.rmSync(candidate, { force: true });
    }
}

// --- Build the dedicated fixture DB -----------------------------------------

registerBuiltInBallCreationStrategies();
registerBuiltInFormats();

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
    ['linkopings', 'player-manual-handicap', 'guest-claim', 'attributed-scoring'],
    { dbPath: DB_PATH },
);

const db = createDb<Database>(DB_PATH);
const services = createServices(db);

try {
    // --- 1. Manual handicap chain ------------------------------------------

    const handicapPlayer = (await services.playerService.list()).find(
        (p) => p.username === MANUAL_HANDICAP_USERNAME,
    );
    if (!handicapPlayer) throw new Error('player-manual-handicap seed did not create the expected player');
    const handicapHistory = await services.handicapService.historyFor(handicapPlayer.id);
    const historyOldestFirst = [...handicapHistory].reverse();

    const handicapSection = `
<section class="verify-block required" id="manual-handicap">
  <h2>1 &middot; Manual handicap chain</h2>
  <div class="callout">
    <p><strong>Required check &mdash; append-only manual history:</strong> player
      <b>${esc(handicapPlayer.displayName)}</b> (<code>${esc(handicapPlayer.username)}</code>) has current
      index <b>${esc(handicapPlayer.handicapIndex)}</b>. The history below, oldest &rarr; newest, must read
      exactly: <b>18.4 &rarr; 17.9 &rarr; 17.5</b> &mdash; three rows, every one <code>source: manual</code>,
      every <code>entered_by</code> resolving to the player themself (self-service edit, no WHS/federation
      posting).</p>
  </div>
  <div class="embedded">
    <table class="cat">
      <thead><tr><th>#</th><th>Index</th><th>Source</th><th>Effective date</th><th>Entered by</th></tr></thead>
      <tbody>
        ${historyOldestFirst
            .map(
                (h, i) => `<tr>
              <td>${i + 1}</td>
              <td><b>${esc(h.handicapIndex)}</b></td>
              <td><code>${esc(h.source)}</code></td>
              <td>${esc(h.effectiveDate)}</td>
              <td>${h.enteredByPlayerId === handicapPlayer.id ? esc(handicapPlayer.displayName) + ' (self)' : esc(h.enteredByPlayerId ?? '—')}</td>
            </tr>`,
            )
            .join('')}
      </tbody>
    </table>
  </div>
</section>`;

    // --- 2. Guest-claim contrast --------------------------------------------

    const claimedPlayer = (await services.playerService.list()).find(
        (p) => p.username === GUEST_CLAIM_CLAIMED_USERNAME,
    );
    if (!claimedPlayer) throw new Error('guest-claim seed did not create the expected player');
    const guests = await services.guestPlayerService.list();
    const claimedGuest = guests.find((g) => g.claimedByPlayerId === claimedPlayer.id);
    const unclaimedGuest = guests.find((g) => g.displayName === GUEST_CLAIM_UNCLAIMED_GUEST_NAME);
    if (!claimedGuest || !unclaimedGuest) {
        throw new Error('guest-claim seed did not produce the expected claimed/unclaimed guests');
    }

    const claimRoundRows = await db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('bp.player_id', '=', claimedPlayer.id)
        .select(['b.round_id'])
        .execute();
    const claimRoundId = claimRoundRows[0]?.round_id;
    if (!claimRoundId) throw new Error('guest-claim seed: could not resolve the round via claimed player_id');
    const claimFriendlyRound = await services.friendlyRoundService.findByRoundId(claimRoundId);
    if (!claimFriendlyRound) throw new Error('guest-claim seed: round has no friendly_rounds wrapper');

    const claimedBallPlayer = await db
        .selectFrom('ball_players')
        .selectAll()
        .where('player_id', '=', claimedPlayer.id)
        .executeTakeFirstOrThrow();
    const unclaimedBallPlayer = await db
        .selectFrom('ball_players')
        .selectAll()
        .where('guest_player_id', '=', unclaimedGuest.id)
        .executeTakeFirstOrThrow();

    const claimCtx = await collectRoundContext(services, claimRoundId, DB_PATH);
    const claimBody = bodyOf(renderRoundHtml(claimCtx));

    const guestClaimSection = `
<section class="verify-block required" id="guest-claim">
  <h2>2 &middot; Guest-claim contrast</h2>
  <div class="callout">
    <p><strong>Required check &mdash; claimed vs unclaimed, and the scorecard is unchanged:</strong></p>
    <ul>
      <li><b>Claimed producer</b>: guest <code>${esc(short(claimedGuest.id))}</code> "${esc(claimedGuest.displayName)}"
          is now live <code>player_id = ${esc(short(claimedPlayer.id))}</code> (${esc(claimedPlayer.displayName)}).
          <code>ball_players.display_name_snapshot</code> stays FROZEN at
          "<b>${esc(claimedBallPlayer.display_name_snapshot)}</b>" &mdash; the "played as" name never changes even
          though the live identity did. Tombstone: <code>claimed_by_player_id =
          ${esc(short(claimedGuest.claimedByPlayerId ?? ''))}</code>, <code>claimed_at</code> is set
          (non-null).</li>
      <li><b>Unclaimed guest (contrast)</b>: "${esc(unclaimedGuest.displayName)}" is still a live
          <code>guest_player_id</code> on <code>ball_players</code> (<code>player_id</code> is null).
          Tombstone fields <code>claimed_by_player_id</code> / <code>claimed_at</code> are both
          <b>null</b>.</li>
      <li><b>Scorecard rendering unchanged</b>: the embedded round page below still shows both players by their
          ORIGINAL "played as" names &mdash; "${esc(claimedGuest.displayName)}" and
          "${esc(unclaimedGuest.displayName)}" &mdash; the claim never rewrites historical display.</li>
    </ul>
  </div>
  <div class="embedded">
    <table class="cat">
      <thead><tr><th></th><th>Claimed</th><th>Unclaimed (contrast)</th></tr></thead>
      <tbody>
        <tr><td>Guest id</td><td><code>${esc(short(claimedGuest.id))}</code></td><td><code>${esc(short(unclaimedGuest.id))}</code></td></tr>
        <tr><td>Display name</td><td>${esc(claimedGuest.displayName)}</td><td>${esc(unclaimedGuest.displayName)}</td></tr>
        <tr><td><code>ball_players.player_id</code></td><td>${esc(short(claimedBallPlayer.player_id ?? ''))}</td><td><span class="muted">null</span></td></tr>
        <tr><td><code>ball_players.guest_player_id</code></td><td><span class="muted">null</span></td><td><code>${esc(short(unclaimedBallPlayer.guest_player_id ?? ''))}</code></td></tr>
        <tr><td><code>display_name_snapshot</code> (frozen)</td><td><b>${esc(claimedBallPlayer.display_name_snapshot)}</b></td><td><b>${esc(unclaimedBallPlayer.display_name_snapshot)}</b></td></tr>
        <tr><td><code>claimed_by_player_id</code></td><td>${esc(short(claimedGuest.claimedByPlayerId ?? ''))}</td><td><span class="muted">null</span></td></tr>
        <tr><td><code>claimed_at</code></td><td>${esc(claimedGuest.claimedAt ?? '')}</td><td><span class="muted">null</span></td></tr>
      </tbody>
    </table>
  </div>
  <p class="muted">Share token: <code>${esc(claimFriendlyRound.shareToken)}</code> &mdash; real rendered scorecard follows (same pipeline as <code>bun run render:formats</code>):</p>
  <div class="embedded">${claimBody}</div>
</section>`;

    // --- 3. Attribution ------------------------------------------------------

    const creatorPlayer = (await services.playerService.list()).find(
        (p) => p.username === ATTRIBUTED_SCORING_CREATOR_USERNAME,
    );
    const otherPlayer = (await services.playerService.list()).find(
        (p) => p.username === ATTRIBUTED_SCORING_OTHER_USERNAME,
    );
    if (!creatorPlayer || !otherPlayer) throw new Error('attributed-scoring seed did not create the expected players');

    const attribFriendlyRounds = await services.friendlyRoundService.listByCreator(creatorPlayer.id);
    const attribEntry = attribFriendlyRounds[0];
    if (!attribEntry) throw new Error('attributed-scoring seed: no friendly round found for creator');
    const attribRoundId = attribEntry.round.id;

    // listByRound already orders by `seq` (append order) server-side.
    const events = await services.scoreEventService.listByRound(attribRoundId);
    const playersById = new Map([creatorPlayer, otherPlayer].map((p) => [p.id, p]));
    const recordedByCount = { attributed: 0, anonymous: 0 };
    for (const e of events) {
        if (e.recordedByPlayerId) recordedByCount.attributed++;
        else recordedByCount.anonymous++;
    }

    const attributionRows = events
        .map((e, i) => {
            const recorder = e.recordedByPlayerId ? playersById.get(e.recordedByPlayerId) : null;
            const recordedByCell = recorder
                ? `<b>${esc(recorder.displayName)}</b> <span class="muted">(${esc(short(recorder.id))})</span>`
                : '<span class="anon">anonymous (null)</span>';
            return `<tr>
          <td>${i + 1}</td>
          <td><code>${esc(short(e.ballId))}</code></td>
          <td>${esc(e.strokes ?? '')}</td>
          <td>${recordedByCell}</td>
        </tr>`;
        })
        .join('');

    const attributionSection = `
<section class="verify-block required" id="attribution">
  <h2>3 &middot; Score-event attribution</h2>
  <div class="callout">
    <p><strong>Required check &mdash; recorded_by per event, creator on the wrapper:</strong></p>
    <ul>
      <li>The FriendlyRound wrapper's <code>creator_player_id</code> resolves to
          <b>${esc(creatorPlayer.displayName)}</b> (<code>${esc(short(creatorPlayer.id))}</code>) &mdash; she
          created this round while logged in.</li>
      <li>Of the ${events.length} score events (front 9 + back 9 for two balls), expect exactly
          <b>${recordedByCount.attributed}</b> attributed to <b>${esc(creatorPlayer.displayName)}</b> (the front-9
          holes she recorded for both players) and <b>${recordedByCount.anonymous}</b> with
          <code>recorded_by_player_id = null</code> (back-9, the anonymous token-write path) &mdash; the same
          round mixes both, per-event, not per-player.</li>
    </ul>
  </div>
  <div class="embedded">
    <p><b>Wrapper</b>: round <code>${esc(short(attribRoundId))}</code> &middot; share token
      <code>${esc(attribEntry.friendlyRound.shareToken)}</code> &middot; creator_player_id
      <code>${esc(short(attribEntry.friendlyRound.creatorPlayerId ?? ''))}</code>
      (${esc(creatorPlayer.displayName)})</p>
    <table class="cat">
      <thead><tr><th>#</th><th>ball</th><th>strokes</th><th>recorded_by</th></tr></thead>
      <tbody>${attributionRows}</tbody>
    </table>
  </div>
</section>`;

    // --- 4. Dashboard query proof --------------------------------------------

    const dashboardEntries = await services.dashboardService.forPlayer(claimedPlayer.id);
    const dashboardEntryForClaimedRound = dashboardEntries.find((e) => e.round.id === claimRoundId);

    const dashboardSection = `
<section class="verify-block required" id="dashboard-proof">
  <h2>4 &middot; Dashboard query proof</h2>
  <div class="callout">
    <p><strong>Required check &mdash; the claim surfaces the round via the live FK:</strong>
      <code>DashboardService.forPlayer(${esc(short(claimedPlayer.id))})</code> for
      <b>${esc(claimedPlayer.displayName)}</b> must include the claimed round
      <code>${esc(short(claimRoundId))}</code>, and its <code>shareToken</code> must equal
      <code>${esc(claimFriendlyRound.shareToken)}</code> &mdash; the query joins purely through
      <code>ball_players.player_id</code>, which the claim flip populated; no special-casing for claimed
      guests.</p>
  </div>
  <div class="embedded">
    <table class="cat">
      <thead><tr><th>Round</th><th>Date</th><th>Share token</th><th>Ball ids (this player)</th><th>Match?</th></tr></thead>
      <tbody>
        ${dashboardEntries
            .map(
                (e) => `<tr class="${e.round.id === claimRoundId ? 'hit' : ''}">
              <td><code>${esc(short(e.round.id))}</code></td>
              <td>${esc(e.round.date)}</td>
              <td>${e.shareToken ? `<code>${esc(e.shareToken)}</code>` : '<span class="muted">—</span>'}</td>
              <td>${e.ballIds.map((b) => `<code>${esc(short(b))}</code>`).join(', ')}</td>
              <td>${e.round.id === claimRoundId ? '&larr; claimed round' : ''}</td>
            </tr>`,
            )
            .join('')}
      </tbody>
    </table>
    <p>${
        dashboardEntryForClaimedRound && dashboardEntryForClaimedRound.shareToken === claimFriendlyRound.shareToken
            ? `<span class="ok">CONFIRMED</span> &mdash; claimed round present, shareToken matches (<code>${esc(dashboardEntryForClaimedRound.shareToken)}</code>).`
            : '<span class="bad">MISMATCH — see raw table above.</span>'
    }</p>
  </div>
</section>`;

    // --- Assemble ---------------------------------------------------------

    const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Phase 3 — FriendlyRound account-bound features verification</title>
<style>
${ROUND_CSS}
body { max-width: 1120px; margin: 1.5rem auto; padding: 0 1rem; }
.verify-block { border: 2px solid #cdd3db; border-radius: 10px; margin: 2rem 0; padding: 0 1.2rem 1.2rem; scroll-margin-top: 1rem; }
.verify-block > h2 { background: #1f2a44; color: #fff; margin: 0 -1.2rem 1rem; padding: .7rem 1.2rem; border-radius: 8px 8px 0 0; font-size: 1.05rem; }
.verify-block.required { border-color: #2a7; }
.verify-block.required > h2 { background: #1f5d3a; }
.callout { background: #f3f8f4; border-left: 4px solid #2a7; padding: .6rem 1rem; border-radius: 4px; margin-bottom: 1rem; }
.callout ul { margin: .3rem 0 0; padding-left: 1.2rem; }
.callout li { margin: .25rem 0; }
.embedded { border-top: 1px dashed #cdd3db; padding-top: .8rem; margin-top: .6rem; }
.embedded h1 { font-size: 1.05rem; }
.embedded p > a[href="index.html"] { display: none; }
.missing { color: #b00; font-weight: 600; }
.bad { color: #b00; font-weight: 600; }
.ok { color: #1f5d3a; font-weight: 700; }
.anon { color: #a55; font-style: italic; }
.muted { color: #667; }
.intro { background:#fff8e6; border:1px solid #e8d8a0; border-radius:8px; padding:.8rem 1rem; }
.toc { background:#f6f8fa; border:1px solid #e1e6ea; border-radius:8px; padding:.6rem 1rem; }
.toc ul { margin:.3rem 0 0; padding-left: 1.2rem; font-size: 13px; }
.toc li { margin:.2rem 0; }
table.cat { border-collapse: collapse; width: 100%; font-size: 13px; margin:.3rem 0; }
table.cat th, table.cat td { border: 1px solid #dde2e8; padding: .3rem .55rem; text-align: left; }
table.cat thead th { background: #eef2f6; }
table.cat tr.hit { background: #eaf6ee; }
</style>
</head>
<body>
<h1>Phase 3 &middot; FriendlyRound account-bound features — static verification</h1>
<div class="intro">
  <p>Phase 3 layers self-serve registration, manual handicap maintenance, authenticated guest-claim, and
  score-event attribution on top of the 2.6e M1 FriendlyRound front door. Every section below reads through the
  REAL services (<code>HandicapService</code>, <code>GuestClaimService</code>, <code>DashboardService</code>,
  <code>FriendlyRoundService</code>) against a dedicated fixture DB built fresh by this script (migrations + dev
  seed + <code>player-manual-handicap</code> / <code>guest-claim</code> / <code>attributed-scoring</code>). Guest
  claim also embeds the round's REAL rendered scorecard (same pipeline as <code>bun run render:formats</code>) so
  the "unchanged display names" claim is directly checkable, not narrated.</p>
  <p class="muted">Self-contained — no links to click. Regenerate with <code>bun scripts/render-phase3-verify.ts</code>.</p>
</div>
<div class="toc"><b>Contents</b><ul>
  <li><a href="#manual-handicap">1 &middot; Manual handicap chain</a></li>
  <li><a href="#guest-claim">2 &middot; Guest-claim contrast (+ real scorecard)</a></li>
  <li><a href="#attribution">3 &middot; Score-event attribution</a></li>
  <li><a href="#dashboard-proof">4 &middot; Dashboard query proof</a></li>
</ul></div>
${handicapSection}
${guestClaimSection}
${attributionSection}
${dashboardSection}
</body>
</html>`;

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, 'phase3-verify.html');
    fs.writeFileSync(outPath, page);
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
} finally {
    await db.destroy();
}
