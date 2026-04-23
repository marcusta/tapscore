// Round page orchestrator — assembles the <html> shell and delegates
// each section to its own module.

import { ROUND_CSS } from './css';
import { buildRoundRenderState } from './round-state';
import type { RoundRenderContext } from './types';
import { esc, short } from './util';
import { renderMeta } from './sections/meta';
import { renderCourseMetadata, renderSnapshotTables } from './sections/course';
import { renderParticipantsTable } from './sections/participants';
import { renderEvents } from './sections/events';
import { renderLeaderboard } from './sections/leaderboard';
import { renderScorecards } from './scorecards/index';

export function renderRoundHtml(ctx: RoundRenderContext): string {
    const { round, course, dbPath } = ctx;
    const state = buildRoundRenderState(ctx);

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Round ${short(round.id)} — ${esc(course.name)} — ${esc(round.date)}</title>
<style>${ROUND_CSS}</style>
</head>
<body>
<p><a href="index.html">← all rounds</a></p>
<h1>
  Round ${esc(course.name)} · ${esc(round.date)}
  <span class="sub">${esc(round.roundType)} · ${esc(round.venueType)} · ${esc(round.status)} · <code>${esc(short(round.id))}</code></span>
</h1>
${renderMeta(ctx)}
${renderCourseMetadata(ctx, state.playedCourseHoles)}
${renderSnapshotTables(ctx)}
${renderParticipantsTable(ctx, state)}
${renderScorecards(ctx, state)}
${renderLeaderboard(ctx, state)}
${renderEvents(ctx, state)}
<footer class="muted">
  <p>Generated ${new Date().toISOString()} from <code>${esc(dbPath)}</code></p>
</footer>
</body>
</html>`;
}
