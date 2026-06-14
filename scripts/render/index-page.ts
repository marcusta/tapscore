// Index page — one row per round, linking to the per-round page.

import { ROUND_CSS } from './css';
import { formatCatalog } from '../../server/domain/formats/plugin';
import {
    formatAllowanceLabel,
    type FormatAllowanceConfig,
} from '../../server/domain/round-definition';
import type { IndexRow } from './types';
import { esc, short, titleCaseWords } from './util';

/**
 * Slot label from the canonical descriptor registry — NOT a hardcoded
 * format switch. The static renderer is a first-class consumer of the plugin
 * contract: it reads each format's serializable `label` keyed by
 * `(scoringMode, teamShape)`. Falls back to a humanised key only when the
 * registry has not been populated (e.g. a unit test that skips registration).
 */
export function formatSlotSummary(
    slot: { scoringMode: string; teamShape: string; allowanceConfig: FormatAllowanceConfig },
): string {
    const descriptor = formatCatalog().find(
        (d) => d.scoringMode === slot.scoringMode && d.teamShape === slot.teamShape,
    );
    const label =
        descriptor?.label ??
        `${titleCaseWords(slot.scoringMode)} × ${titleCaseWords(slot.teamShape)}`;
    return `${label} @ ${formatAllowanceLabel(slot.allowanceConfig)}`;
}

export function renderIndexHtml(rows: IndexRow[]): string {
    const body = rows
        .map((row) => {
            const slots = row.round.formatSlots
                .map((s) => formatSlotSummary(s))
                .join(', ');
            return `
<tr>
  <td><a href="round-${short(row.round.id)}.html"><code>${esc(short(row.round.id))}</code></a></td>
  <td>${esc(row.round.date)}</td>
  <td>${esc(row.club?.name ?? '—')}</td>
  <td>${esc(row.course.name)}</td>
  <td>${esc(row.round.roundType)}</td>
  <td>${esc(row.round.venueType)}</td>
  <td>${esc(slots)}</td>
  <td>${esc(row.round.status)}</td>
  <td class="num">${row.ballCount}</td>
  <td class="num">${row.eventCount}</td>
</tr>`;
        })
        .join('');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Rounds — tapscore dev</title>
<style>${ROUND_CSS}</style>
</head>
<body>
<h1>Rounds <span class="sub">${rows.length} total</span></h1>
<table class="grid">
  <thead>
    <tr>
      <th>id</th><th>date</th><th>club</th><th>course</th>
      <th>type</th><th>venue</th><th>format</th><th>status</th>
      <th>balls</th><th>events</th>
    </tr>
  </thead>
  <tbody>${body}</tbody>
</table>
<footer class="muted"><p>Generated ${new Date().toISOString()}</p></footer>
</body>
</html>`;
}
