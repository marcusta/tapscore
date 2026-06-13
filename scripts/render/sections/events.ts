// Events log section. Ball-native: the "Ball" column shows the ball
// label + short id, and the event's ballId comes straight from the
// domain ScoreEvent.

import type { ScoreEvent } from '../../../server/services/score-event.service';
import type { RoundRenderContext } from '../types';
import { buildOccurrenceLabels, type RoundRenderState } from '../round-state';
import { esc, formatEventMetadata, short, strokesCell } from '../util';

export function renderEvents(
    ctx: RoundRenderContext,
    state: RoundRenderState,
): string {
    const { events, balls, round } = ctx;
    const { ballLabel, playerName } = state;
    // playHoleId → display label, reusing the occurrence-label logic so the
    // events log matches the scorecard headers (repeated holes disambiguated).
    const holeLabelByPlayHoleId = buildOccurrenceLabels(round.playHoles);
    const holeCell = (playHoleId: string): string =>
        holeLabelByPlayHoleId.get(playHoleId) ?? short(playHoleId);
    const rows = events.map((e: ScoreEvent) => {
        const ball = balls.find((b) => b.id === e.ballId);
        const sourceName =
            e.sourcePlayerId !== null
                ? playerName(e.sourcePlayerId)
                : e.sourceGuestPlayerId !== null
                  ? `guest ${short(e.sourceGuestPlayerId)}`
                  : '';
        const metaCell = formatEventMetadata(e.metadata);
        const ballCell = ball
            ? `${esc(ballLabel(ball))} <code>${esc(short(e.ballId))}</code>`
            : `<code>${esc(short(e.ballId))}</code>`;
        return `
<tr>
  <td class="muted">${esc(e.recordedAt)}</td>
  <td>${ballCell}</td>
  <td>${esc(sourceName)}</td>
  <td class="num">${esc(holeCell(e.playHoleId))}</td>
  <td class="num">${strokesCell(e.strokes)}</td>
  <td>${esc(e.eventType)}</td>
  <td>${metaCell}</td>
  <td>${esc(playerName(e.recordedByPlayerId))}</td>
  <td><code>${esc(e.clientEventId)}</code></td>
  <td><code>${esc(short(e.id))}</code></td>
</tr>`;
    });
    return `
<section>
  <h2>Events log (${events.length})</h2>
  <table class="grid">
    <thead><tr><th>recorded at</th><th>ball</th><th>player</th><th>hole</th><th>strokes</th><th>type</th><th>metadata</th><th>recorded by</th><th>client id</th><th>event id</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>
</section>`;
}
