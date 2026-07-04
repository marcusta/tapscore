// Phase 3.5 focused visual verification — ONE self-contained page.
//
// Phase 3.5 adds multi-group rounds (independent tee times, shotgun starts
// with rotated itineraries), an interim result-polling cursor
// (`rounds.latest_event_id`), and self-join via share link
// (`RoundJoinService.joinByToken`) on top of the round-compiler pipeline.
// This page builds a DEDICATED fixture DB (own file under tmp/, migrations +
// dev seed + the three Phase 3.5 seeds), then renders each new surface
// straight off the real services:
//
//   1. Groups + start times + rotated played order — embeds the REAL
//      route-summary render (`renderRouteSummary`, same table as
//      `bun run render:formats`) for `multi-group-tee-times` (conventional,
//      8-min intervals, all start hole 1) and `multi-group-shotgun`
//      (true shotgun — group 2 starts hole 10, itinerary rotates).
//   2. Leaderboard with per-group thru-N — a custom table cross-referencing
//      each `RankedEntry.ballIds` against `round.playingGroups[].ballIds`
//      (the generic `renderRanked` doesn't carry a group column).
//   3. Self-join proof — before/after producer lists, the joiner's ball
//      landing in exactly one (new) group while group 1 is untouched (the
//      default group's capacity equals the roster size at compile time, so
//      it's full by construction — join opens a fresh group), the pre-join
//      score events intact (same
//      ball ids), and the `setup_correction_events` audit row
//      (target `playing_group`) written by `joinByToken`.
//   4. Cursor semantics — three `resultWithCursorByToken` calls rendered as
//      a table: initial fetch (cursor advances off null), an unchanged
//      re-fetch (`{unchanged:true}`), then a fresh score append bumping the
//      cursor again.
//
// Self-contained: no sibling-file links, real rendered content inlined, a
// green expected-value callout precedes every embedded section. Regenerate:
//
//   bun scripts/render-phase3.5-verify.ts

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
import { collectRoundContext } from './render-lib';
import { renderRouteSummary } from './render/sections/course';
import { ROUND_CSS } from './render/css';
import { esc, short } from './render/util';
import type { RankedEntry } from '../server/domain/strategies/result-sections';
import type { Round } from '../server/services/round.service';

const OUT_DIR = path.join(process.cwd(), 'tmp', 'formats');
const DB_PATH = path.join(process.cwd(), 'tmp', 'phase35-verify-fixture.sqlite');

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
    ['linkopings', 'multi-group-tee-times', 'multi-group-shotgun', 'self-join-proof'],
    { dbPath: DB_PATH },
);

const db = createDb<Database>(DB_PATH);
const services = createServices(db);

try {
    // --- 1. Groups + start times + rotated played order ---------------------

    const guests = await services.guestPlayerService.list();
    const players = await services.playerService.list();
    const guestByName = new Map(guests.map((g) => [g.displayName, g]));
    const playerByUsername = new Map(players.map((p) => [p.username, p]));

    const lasse = guestByName.get('Lasse Gäst');
    if (!lasse) throw new Error('multi-group-tee-times seed did not create the expected guest');
    const teeTimesBallPlayer = await db
        .selectFrom('ball_players')
        .selectAll()
        .where('guest_player_id', '=', lasse.id)
        .executeTakeFirstOrThrow();
    const teeTimesBallRow = await db
        .selectFrom('balls')
        .select(['round_id'])
        .where('id', '=', teeTimesBallPlayer.ball_id)
        .executeTakeFirstOrThrow();
    const teeTimesRoundId = teeTimesBallRow.round_id;
    const teeTimesFriendlyRound = await services.friendlyRoundService.findByRoundId(teeTimesRoundId);
    if (!teeTimesFriendlyRound) throw new Error('multi-group-tee-times: round has no friendly_rounds wrapper');
    const teeTimesRound = await services.roundService.getById(teeTimesRoundId);
    if (!teeTimesRound) throw new Error('multi-group-tee-times: round not found');

    const anna = guestByName.get('Anna Shotgun');
    if (!anna) throw new Error('multi-group-shotgun seed did not create the expected guest');
    const shotgunBallPlayer = await db
        .selectFrom('ball_players')
        .selectAll()
        .where('guest_player_id', '=', anna.id)
        .executeTakeFirstOrThrow();
    const shotgunBallRow = await db
        .selectFrom('balls')
        .select(['round_id'])
        .where('id', '=', shotgunBallPlayer.ball_id)
        .executeTakeFirstOrThrow();
    const shotgunRoundId = shotgunBallRow.round_id;
    const shotgunFriendlyRound = await services.friendlyRoundService.findByRoundId(shotgunRoundId);
    if (!shotgunFriendlyRound) throw new Error('multi-group-shotgun: round has no friendly_rounds wrapper');
    const shotgunRound = await services.roundService.getById(shotgunRoundId);
    if (!shotgunRound) throw new Error('multi-group-shotgun: round not found');

    const teeTimesCtx = await collectRoundContext(services, teeTimesRoundId, DB_PATH);
    const shotgunCtx = await collectRoundContext(services, shotgunRoundId, DB_PATH);
    const teeTimesRouteHtml = renderRouteSummary(teeTimesCtx);
    const shotgunRouteHtml = renderRouteSummary(shotgunCtx);

    const shotgunG2 = shotgunRound.playingGroups.find((g) => g.startOrdinal === 10);
    const shotgunG2Order = shotgunG2
        ? shotgunG2.playedOrder.map((o) => o.courseHoleNumber).join(', ')
        : '(not found)';

    const groupsSection = `
<section class="verify-block required" id="groups">
  <h2>1 &middot; Playing groups &mdash; start times + rotated played order</h2>
  <div class="callout">
    <p><strong>Required check &mdash; conventional tee-times round (<code>multi-group-tee-times</code>):</strong>
      3 groups of 2, 8-minute intervals, all starting at the route head (hole 1). Expect start times
      exactly <b>09:00 / 09:08 / 09:16</b>, each group's played order reading
      <b>1 &rarr; 2 &rarr; &hellip; &rarr; 18</b> (no rotation &mdash; conventional case), and ball counts of
      <b>2</b> per group.</p>
    <p><strong>Required check &mdash; shotgun round (<code>multi-group-shotgun</code>):</strong> 2 groups, BOTH
      starting <b>08:00</b> but on different holes &mdash; group 1 at hole 1, group 2 at hole 10
      (<code>startOrdinal = 10</code>). Group 2's played order must read exactly:
      <b>${esc(shotgunG2Order)}</b> &mdash; the itinerary rotated to its start occurrence, not physical order.</p>
  </div>
  <div class="embedded">
    <h3>multi-group-tee-times <span class="muted">&middot; round <code>${esc(short(teeTimesRoundId))}</code> &middot; token <code>${esc(teeTimesFriendlyRound.shareToken)}</code></span></h3>
    ${teeTimesRouteHtml}
  </div>
  <div class="embedded">
    <h3>multi-group-shotgun <span class="muted">&middot; round <code>${esc(short(shotgunRoundId))}</code> &middot; token <code>${esc(shotgunFriendlyRound.shareToken)}</code></span></h3>
    ${shotgunRouteHtml}
  </div>
</section>`;

    // --- 2. Leaderboard with per-group thru-N --------------------------------

    function groupLabelFor(round: Round, ballId: string): string {
        const idx = round.playingGroups.findIndex((g) => g.ballIds.includes(ballId));
        return idx === -1 ? '—' : `Group ${idx + 1}`;
    }

    function rankedEntriesFor(result: Awaited<ReturnType<typeof services.friendlyRoundService.resultByToken>>): RankedEntry[] {
        if (!result) return [];
        const entries: RankedEntry[] = [];
        for (const slot of result.slots) {
            for (const sec of slot.leaderboard) {
                if (sec.kind === 'ranked') entries.push(...sec.entries);
            }
        }
        return entries;
    }

    function nameOfFor(ctx: Awaited<ReturnType<typeof collectRoundContext>>): (id: string) => string {
        const ballById = new Map(ctx.balls.map((b) => [b.id, b] as const));
        return (id: string) => {
            const b = ballById.get(id);
            if (!b || b.producers.length === 0) return short(id);
            return b.producers.map((p) => p.displayName).join(' & ');
        };
    }

    const teeTimesResult = await services.friendlyRoundService.resultByToken(teeTimesFriendlyRound.shareToken);
    const shotgunResult = await services.friendlyRoundService.resultByToken(shotgunFriendlyRound.shareToken);
    const teeTimesEntries = rankedEntriesFor(teeTimesResult);
    const shotgunEntries = rankedEntriesFor(shotgunResult);
    const teeTimesNameOf = nameOfFor(teeTimesCtx);
    const shotgunNameOf = nameOfFor(shotgunCtx);

    function leaderboardTable(
        entries: RankedEntry[],
        round: Round,
        nameOf: (id: string) => string,
    ): string {
        const rows = entries
            .map(
                (e) => `<tr>
              <td class="num">${e.position}</td>
              <td>${esc(e.ballIds.map(nameOf).join(' & '))}</td>
              <td><b>${esc(groupLabelFor(round, e.ballIds[0]!))}</b></td>
              <td class="num">${e.total ?? '—'}</td>
              <td class="num muted">${e.holesPlayed}</td>
            </tr>`,
            )
            .join('');
        return `
<table class="cat">
  <thead><tr><th>pos</th><th>ball</th><th>group</th><th>total</th><th>thru</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
    }

    const leaderboardSection = `
<section class="verify-block required" id="leaderboard">
  <h2>2 &middot; Leaderboard &mdash; per-group thru-N</h2>
  <div class="callout">
    <p><strong>Required check &mdash; thru-N differs per group, group labels visible:</strong></p>
    <ul>
      <li><b>multi-group-tee-times</b>: Group 1 (erik &amp; Lasse Gäst) is <b>thru 9</b>; Group 2 (sara &amp; Nina
          Gäst) is <b>thru 3</b>; Group 3 (Peter Gäst &amp; Ulla Gäst) is <b>thru 0</b> (unscored) &mdash; three
          different depths on the same leaderboard.</li>
      <li><b>multi-group-shotgun</b>: Group 1 (Anna Shotgun &amp; Björn Shotgun, started hole 1) is <b>thru 5</b>;
          Group 2 (Carin Shotgun &amp; David Shotgun, started hole 10) is <b>thru 2</b> &mdash; scored on physically
          different holes (10, 11), proving the rotated itinerary is what's actually being played.</li>
    </ul>
  </div>
  <div class="embedded">
    <h3>multi-group-tee-times</h3>
    ${leaderboardTable(teeTimesEntries, teeTimesRound, teeTimesNameOf)}
  </div>
  <div class="embedded">
    <h3>multi-group-shotgun</h3>
    ${leaderboardTable(shotgunEntries, shotgunRound, shotgunNameOf)}
  </div>
</section>`;

    // --- 3. Self-join proof ---------------------------------------------------

    const magnus = guestByName.get('Magnus Startare');
    if (!magnus) throw new Error('self-join-proof seed did not create the expected guest');
    const erik = playerByUsername.get('erik');
    if (!erik) throw new Error('dev seed did not create expected player erik');

    const selfJoinBallPlayerRows = await db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('bp.guest_player_id', '=', magnus.id)
        .select(['b.round_id'])
        .execute();
    const selfJoinRoundId = selfJoinBallPlayerRows[0]?.round_id;
    if (!selfJoinRoundId) throw new Error('self-join-proof: could not resolve round via guest Magnus');
    const selfJoinFriendlyRound = await services.friendlyRoundService.findByRoundId(selfJoinRoundId);
    if (!selfJoinFriendlyRound) throw new Error('self-join-proof: round has no friendly_rounds wrapper');
    const selfJoinRound = await services.roundService.getById(selfJoinRoundId);
    if (!selfJoinRound) throw new Error('self-join-proof: round not found');

    // "Before" producer list — every producer_def_id except erik's (the join
    // added exactly one new producer/ball to the single whole-roster group).
    const allBallPlayers = await db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', selfJoinRoundId)
        .select(['bp.producer_def_id', 'bp.ball_id', 'bp.display_name_snapshot', 'bp.player_id', 'bp.guest_player_id'])
        .execute();
    const erikBallPlayer = allBallPlayers.find((r) => r.player_id === erik.id);
    if (!erikBallPlayer) throw new Error('self-join-proof: erik was not joined onto the round');
    const beforeBallPlayers = allBallPlayers.filter((r) => r.player_id !== erik.id);

    // Group membership after the join. The pre-join draft had no explicit
    // `playingGroups`, so the compiler's default group's capacity equals the
    // roster size at compile time (2) — full by construction. `joinByToken`
    // therefore can't append erik into group 1 (no free capacity) and opens
    // a NEW group for him instead. Assert: erik's ball is in EXACTLY ONE
    // group, it is NOT group 1, and group 1's membership is unchanged.
    const groupsAfter = selfJoinRound.playingGroups;
    const groupsContainingErik = groupsAfter
        .map((g, i) => ({ i, has: g.ballIds.includes(erikBallPlayer.ball_id) }))
        .filter((g) => g.has);
    const erikGroupIdx = groupsContainingErik[0]?.i ?? -1;
    const originalGroup = groupsAfter[0]!;
    const originalGroupUnchanged =
        originalGroup.ballIds.length === beforeBallPlayers.length &&
        beforeBallPlayers.every((r) => originalGroup.ballIds.includes(r.ball_id));

    // Pre-join score events — same ball ids as `beforeBallPlayers`, intact.
    const scoreEvents = await services.scoreEventService.listByRound(selfJoinRoundId);
    const preJoinBallIds = new Set(beforeBallPlayers.map((r) => r.ball_id));
    const preJoinEvents = scoreEvents.filter((e) => preJoinBallIds.has(e.ballId));

    // setup_correction_events audit row — target 'playing_group'.
    const correctionRows = await db
        .selectFrom('setup_correction_events')
        .selectAll()
        .where('round_id', '=', selfJoinRoundId)
        .where('target', '=', 'playing_group')
        .orderBy('recorded_at', 'asc')
        .execute();
    const joinCorrection = correctionRows[correctionRows.length - 1];
    if (!joinCorrection) throw new Error('self-join-proof: no setup_correction_events row for the join');

    function groupIdxOf(ballId: string): number {
        return groupsAfter.findIndex((g) => g.ballIds.includes(ballId));
    }

    const beforeRows = beforeBallPlayers
        .map(
            (r) => `<tr>
          <td><code>${esc(r.producer_def_id)}</code></td>
          <td>${esc(r.display_name_snapshot)}</td>
          <td><code>${esc(short(r.ball_id))}</code></td>
        </tr>`,
        )
        .join('');
    const afterRows = allBallPlayers
        .map(
            (r) => `<tr class="${r.player_id === erik.id ? 'hit' : ''}">
          <td><code>${esc(r.producer_def_id)}</code></td>
          <td>${esc(r.display_name_snapshot)}</td>
          <td><code>${esc(short(r.ball_id))}</code></td>
          <td>Group ${groupIdxOf(r.ball_id) + 1}</td>
          <td>${r.player_id === erik.id ? '&larr; joined via joinByToken' : ''}</td>
        </tr>`,
        )
        .join('');
    const preJoinEventRows = preJoinEvents
        .map(
            (e, i) => `<tr>
          <td>${i + 1}</td>
          <td><code>${esc(short(e.ballId))}</code></td>
          <td>${esc(e.strokes ?? '')}</td>
          <td><code>${esc(e.eventType)}</code></td>
        </tr>`,
        )
        .join('');

    const selfJoinSection = `
<section class="verify-block required" id="self-join">
  <h2>3 &middot; Self-join proof &mdash; real <code>RoundJoinService.joinByToken</code></h2>
  <div class="callout">
    <p><strong>Required check &mdash; prior history survives, joiner lands in exactly one group, group 1 is untouched:</strong></p>
    <ul>
      <li><b>Before</b>: ${beforeBallPlayers.length} producers on the round (Magnus Startare, Lena Startare).
          <b>After</b>: ${allBallPlayers.length} producers &mdash; erik added, everyone else's
          <code>ball_players.ball_id</code> UNCHANGED (content-addressed ids survive the recompile).</li>
      <li>The draft had NO explicit <code>playingGroups</code>, so the compiler's default group's capacity equals
          the roster size at compile time (2) &mdash; full by construction. <code>joinByToken</code> therefore
          cannot append erik into group 1 (no free capacity) and opens a NEW group for him instead: the round now
          has <b>${groupsAfter.length}</b> playing groups. Erik's ball is a member of
          <b>${groupsContainingErik.length === 1 ? 'exactly one group' : `${groupsContainingErik.length} groups — FAIL`}</b>
          (group index <b>${erikGroupIdx === -1 ? 'NOT FOUND — FAIL' : erikGroupIdx}</b>), and group 1's original
          membership is <b>${originalGroupUnchanged ? 'unchanged' : 'CHANGED — FAIL'}</b> (still just Magnus +
          Lena).</li>
      <li>Pre-join score events: <b>${preJoinEvents.length}</b> events on the two original balls (hole 1, one each
          for Magnus and Lena) &mdash; same ball ids as the "before" producer list, byte-for-byte intact after the
          join's recompile.</li>
      <li><code>setup_correction_events</code> audit row: target <code>"${esc(joinCorrection.target)}"</code>
          (expect <b>playing_group</b>), <code>reason = "${esc(joinCorrection.reason)}"</code>,
          <code>recorded_by_player_id = ${esc(short(joinCorrection.recorded_by_player_id ?? ''))}</code>
          (erik &mdash; he joined himself).</li>
    </ul>
  </div>
  <div class="embedded">
    <h3>Before (pre-join producers)</h3>
    <table class="cat">
      <thead><tr><th>producer_def_id</th><th>display name</th><th>ball id</th></tr></thead>
      <tbody>${beforeRows}</tbody>
    </table>
    <h3>After (post-join producers)</h3>
    <table class="cat">
      <thead><tr><th>producer_def_id</th><th>display name</th><th>ball id</th><th>group</th><th></th></tr></thead>
      <tbody>${afterRows}</tbody>
    </table>
    <h3>Pre-join score events (must be intact, same ball ids)</h3>
    <table class="cat">
      <thead><tr><th>#</th><th>ball</th><th>strokes</th><th>event type</th></tr></thead>
      <tbody>${preJoinEventRows}</tbody>
    </table>
    <h3><code>setup_correction_events</code> audit row</h3>
    <table class="cat">
      <tbody>
        <tr><th>id</th><td><code>${esc(short(joinCorrection.id))}</code></td></tr>
        <tr><th>target</th><td><code>${esc(joinCorrection.target)}</code></td></tr>
        <tr><th>target_ref</th><td><code>${esc(joinCorrection.target_ref)}</code></td></tr>
        <tr><th>reason</th><td>${esc(joinCorrection.reason)}</td></tr>
        <tr><th>recorded_by_player_id</th><td><code>${esc(short(joinCorrection.recorded_by_player_id ?? ''))}</code> (erik)</td></tr>
        <tr><th>result_version</th><td>${esc(joinCorrection.result_version ?? '')}</td></tr>
        <tr><th>client_event_id</th><td><code>${esc(joinCorrection.client_event_id)}</code></td></tr>
      </tbody>
    </table>
  </div>
</section>`;

    // --- 4. Cursor semantics ---------------------------------------------------

    // Use the tee-times round (already has scored balls) so a fresh append is
    // meaningful — score one more hole for group 3 (previously unscored).
    const cursorToken = teeTimesFriendlyRound.shareToken;
    const call1 = await services.friendlyRoundService.resultWithCursorByToken(cursorToken);
    if (!call1) throw new Error('cursor demo: call 1 resolved to null');
    const cursorAfterCall1 = call1.cursor;

    const call2 = await services.friendlyRoundService.resultWithCursorByToken(cursorToken, cursorAfterCall1 ?? undefined);
    if (!call2) throw new Error('cursor demo: call 2 resolved to null');

    // Append a fresh score for group 3 (Peter Gäst), previously unscored.
    const g3BallPlayer = await db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', teeTimesRoundId)
        .where('bp.display_name_snapshot', '=', 'Peter Gäst')
        .select(['bp.ball_id'])
        .executeTakeFirstOrThrow();
    const firstPlayHoleId = teeTimesRound.playingGroups[2]!.playedOrder[0]!.playHoleId;
    const appendResult = await services.friendlyRoundService.appendScoreByToken({
        token: cursorToken,
        ballId: g3BallPlayer.ball_id,
        playHoleId: firstPlayHoleId,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'phase35-verify-cursor-bump',
    });
    if (!appendResult) throw new Error('cursor demo: score append failed');

    const call3 = await services.friendlyRoundService.resultWithCursorByToken(cursorToken, cursorAfterCall1 ?? undefined);
    if (!call3) throw new Error('cursor demo: call 3 resolved to null');

    function cursorRow(label: string, sentCursor: string | null | undefined, r: NonNullable<typeof call1>): string {
        const unchanged = r.unchanged;
        return `<tr class="${unchanged ? '' : 'hit'}">
      <td>${esc(label)}</td>
      <td>${sentCursor ? `<code>${esc(short(sentCursor))}</code>` : '<span class="muted">(none)</span>'}</td>
      <td>${unchanged ? '<b>true</b>' : '<b>false</b>'}</td>
      <td><code>${esc(short(r.cursor ?? ''))}</code></td>
      <td>${unchanged ? '<span class="muted">— (no result computed)</span>' : `${r.result.slots.length} slot(s)`}</td>
    </tr>`;
    }

    const cursorSection = `
<section class="verify-block required" id="cursor">
  <h2>4 &middot; Cursor semantics &mdash; <code>resultWithCursorByToken</code></h2>
  <div class="callout">
    <p><strong>Required check &mdash; three calls on the SAME token, cursor rides <code>rounds.latest_event_id</code>:</strong></p>
    <ul>
      <li><b>Call 1</b> (no cursor sent, round already has prior score events from the seed): returns
          <code>unchanged: false</code> with a full result and the CURRENT cursor
          (<code>${esc(short(cursorAfterCall1 ?? ''))}</code>).</li>
      <li><b>Call 2</b> (re-fetch with that exact cursor, nothing changed in between): short-circuits to
          <code>{ unchanged: true, cursor }</code> &mdash; SAME cursor value, no result computed.</li>
      <li><b>Call 3</b> (same stale cursor as call 1/2, but a score was appended for Peter Gäst / Group 3 in
          between): returns <code>unchanged: false</code> again, with an ADVANCED cursor (different from calls
          1 &amp; 2) and the full recomputed result.</li>
    </ul>
  </div>
  <div class="embedded">
    <table class="cat">
      <thead><tr><th>call</th><th>cursor sent</th><th>unchanged?</th><th>cursor returned</th><th>result</th></tr></thead>
      <tbody>
        ${cursorRow('1 · initial fetch (no cursor)', null, call1)}
        ${cursorRow('2 · re-fetch with call 1&rsquo;s cursor', cursorAfterCall1, call2)}
        ${cursorRow('3 · re-fetch after a score append (Peter Gäst, hole 1)', cursorAfterCall1, call3)}
      </tbody>
    </table>
    <p class="${call2.unchanged && !call3.unchanged && call3.cursor !== call1.cursor ? 'ok' : 'bad'}">
      ${
          call2.unchanged && !call3.unchanged && call3.cursor !== call1.cursor
              ? 'CONFIRMED — call 2 short-circuited, call 3 advanced the cursor after the append.'
              : 'MISMATCH — see raw table above.'
      }
    </p>
  </div>
</section>`;

    // --- Assemble ---------------------------------------------------------

    const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Phase 3.5 — Multi-group rounds + interim live leaderboard verification</title>
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
<h1>Phase 3.5 &middot; Multi-group rounds + interim live leaderboard — static verification</h1>
<div class="intro">
  <p>Phase 3.5 adds multi-group rounds (independent tee times AND shotgun starts with rotated itineraries), an
  interim result-polling cursor riding <code>rounds.latest_event_id</code>, and self-join via share link
  (<code>RoundJoinService.joinByToken</code>) on top of the round-compiler pipeline. Every section below reads
  through the REAL services (<code>RoundService</code>, <code>FriendlyRoundService</code>,
  <code>RoundJoinService</code>) against a dedicated fixture DB built fresh by this script (migrations + dev seed +
  <code>multi-group-tee-times</code> / <code>multi-group-shotgun</code> / <code>self-join-proof</code>). Groups
  embed the REAL rendered route-summary table (same pipeline as <code>bun run render:formats</code>); the
  leaderboard and self-join sections are bespoke tables built from the same services since the generic renderer
  doesn't carry a group-label column.</p>
  <p class="muted">Self-contained — no links to click. Regenerate with <code>bun scripts/render-phase3.5-verify.ts</code>.</p>
</div>
<div class="toc"><b>Contents</b><ul>
  <li><a href="#groups">1 &middot; Playing groups &mdash; start times + rotated played order</a></li>
  <li><a href="#leaderboard">2 &middot; Leaderboard &mdash; per-group thru-N</a></li>
  <li><a href="#self-join">3 &middot; Self-join proof (real joinByToken)</a></li>
  <li><a href="#cursor">4 &middot; Cursor semantics</a></li>
</ul></div>
${groupsSection}
${leaderboardSection}
${selfJoinSection}
${cursorSection}
</body>
</html>`;

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, 'phase35-verify.html');
    fs.writeFileSync(outPath, page);
    // eslint-disable-next-line no-console
    console.log(`wrote ${outPath}`);
} finally {
    await db.destroy();
}
