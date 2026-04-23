// Index page — one row per round, linking to the per-round page.

import { ROUND_CSS } from './css';
import type { IndexRow } from './types';
import { esc, short, titleCaseWords } from './util';

export function formatSlotSummary(
    slot: { scoringMode: string; teamShape: string; allowancePct: number },
): string {
    const key = `${slot.scoringMode}:${slot.teamShape}`;
    const label =
        key === 'stroke_play:individual'
            ? 'Stroke Play (Individual)'
            : key === 'stableford:individual'
              ? 'Stableford (Individual)'
              : key === 'stroke_play:foursomes'
                ? 'Stroke Play (Foursomes)'
                : key === 'stableford:better_ball'
                  ? 'Stableford (Better Ball)'
                  : key === 'match_play:individual'
                    ? 'Match Play (Individual)'
                    : key === 'match_play:better_ball'
                      ? 'Match Play (Better Ball)'
                      : key === 'taliban:better_ball'
                        ? 'Taliban (Better Ball)'
                        : key === 'kopenhamnare:individual'
                          ? 'Kopenhamnare (Individual)'
                          : key === 'umbrella:four_ball'
                            ? 'Umbrella (4-Ball)'
                            : key === 'umbrella:individual'
                              ? 'Umbrella (3-Player Individual)'
                              : `${titleCaseWords(slot.scoringMode)} x ${titleCaseWords(slot.teamShape)}`;
    return `${label} @ ${slot.allowancePct}%`;
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
