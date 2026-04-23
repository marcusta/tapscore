// Events log section.

import type { RenderedEvent, RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc, formatEventMetadata, short, strokesCell } from '../util';

export function renderEvents(
    ctx: RoundRenderContext,
    state: RoundRenderState,
): string {
    const { events, participants } = ctx;
    const { participantLabel, playerName } = state;
    const rows = events.map((e: RenderedEvent) => {
        const participant = participants.find((p) => p.id === e.participantId);
        const sourceName =
            e.sourcePlayerId !== null
                ? playerName(e.sourcePlayerId)
                : e.sourceGuestPlayerId !== null
                  ? `guest ${short(e.sourceGuestPlayerId)}`
                  : '';
        const metaCell = formatEventMetadata(e.metadata);
        return `
<tr>
  <td class="muted">${esc(e.recordedAt)}</td>
  <td>${esc(participant ? participantLabel(participant) : short(e.participantId))}</td>
  <td>${esc(sourceName)}</td>
  <td class="num">${e.hole}</td>
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
    <thead><tr><th>recorded at</th><th>participant</th><th>player</th><th>hole</th><th>strokes</th><th>type</th><th>metadata</th><th>recorded by</th><th>client id</th><th>event id</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>
</section>`;
}
