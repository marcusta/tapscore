// Round meta section — top-of-page key/value table.

import type { RoundRenderContext } from '../types';
import { esc } from '../util';
import { formatSlotSummary } from '../index-page';

export function renderMeta(ctx: RoundRenderContext): string {
    const { round, course } = ctx;
    const courseNameDiffers =
        round.courseNameSnapshot !== null && round.courseNameSnapshot !== course.name;
    const courseNameCell = round.courseNameSnapshot === null
        ? `${esc(course.name)} (${course.holeCount} holes) <span class="muted">· no snapshot yet (2.6a migration-only)</span>`
        : courseNameDiffers
          ? `${esc(course.name)} <span class="muted">(live)</span> <span class="match">· snapshot: ${esc(round.courseNameSnapshot)}</span>`
          : `${esc(course.name)} <span class="muted">· snapshot matches</span> (${course.holeCount} holes)`;

    return `
<section>
  <h2>Round</h2>
  <table class="kv">
    <tr><th>id</th><td><code>${esc(round.id)}</code></td></tr>
    <tr><th>course</th><td>${courseNameCell}</td></tr>
    <tr><th>date</th><td>${esc(round.date)}</td></tr>
    <tr><th>type</th><td>${esc(round.roundType)}</td></tr>
    <tr><th>venue</th><td>${esc(round.venueType)}</td></tr>
    <tr><th>start list mode</th><td>${esc(round.startListMode)}</td></tr>
    <tr><th>status</th><td>${esc(round.status)}</td></tr>
    <tr><th>latest event</th><td><code>${esc(round.latestEventId ?? '—')}</code></td></tr>
    <tr><th>format slots</th><td>${round.formatSlots.map((s) => `#${s.slotIndex} ${esc(formatSlotSummary(s))}`).join('<br>')}</td></tr>
  </table>
</section>`;
}
