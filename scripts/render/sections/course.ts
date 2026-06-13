// Course metadata + snapshot tables sections. The live-course table and
// the two snapshot tables (course holes + tee holes) sit close together
// on the page and share DOM structure, so they live in one module.

import type { CourseHole, RoundRenderContext, RoundTeeHoleSnapshot } from '../types';
import { esc, splitHoleGroups } from '../util';

export function renderCourseMetadata(
    ctx: RoundRenderContext,
    playedCourseHoles: CourseHole[],
): string {
    const { round, course } = ctx;
    const groups = splitHoleGroups(playedCourseHoles);
    const includeTotColumn = groups.length > 1;
    const parTotal = playedCourseHoles.reduce((a, b) => a + b.par, 0);

    const headerCells = groups
        .map((g) => g.holes.map((h) => `<th>${h.holeNumber}</th>`).join('') + `<th class="sum">${g.label}</th>`)
        .join('');
    const parCells = groups
        .map((g) => g.holes.map((h) => `<td>${h.par}</td>`).join('') + `<td class="sum">${g.holes.reduce((a, b) => a + b.par, 0)}</td>`)
        .join('');
    const siCells = groups
        .map((g) => g.holes.map((h) => `<td class="si">${h.strokeIndex}</td>`).join('') + `<td class="sum"></td>`)
        .join('');
    const totHead = includeTotColumn ? `<th class="sum">TOT</th>` : '';
    const totPar = includeTotColumn ? `<td class="sum">${parTotal}</td>` : '';
    const totSi = includeTotColumn ? `<td class="sum"></td>` : '';

    return `
<section>
  <h2>Course — ${esc(course.name)} <span class="muted">· ${esc(round.roundType)} (${playedCourseHoles.length} holes)</span></h2>
  <table class="scorecard">
    <thead>
      <tr><th class="rowlabel">Hole</th>${headerCells}${totHead}</tr>
    </thead>
    <tbody>
      <tr><th class="rowlabel">Par</th>${parCells}${totPar}</tr>
      <tr><th class="rowlabel">SI</th>${siCells}${totSi}</tr>
    </tbody>
  </table>
</section>`;
}

export function renderSnapshotTables(ctx: RoundRenderContext): string {
    const { courseHolesSnapshot, teeHolesSnapshot, teesById } = ctx;

    const courseSection = (() => {
        if (courseHolesSnapshot.length === 0) {
            return `
<section>
  <h2>Course hole snapshot <span class="muted">· round_course_holes</span></h2>
  <p class="muted">No snapshot rows yet. 2.6a is migration-only — live snapshot capture lands in 2.6b via the RoundCompiler. For now, run <code>bun scripts/backfill-round-snapshots.ts</code> on a seeded dev DB to populate snapshots for hand-verification.</p>
</section>`;
        }
        const rowsHtml = courseHolesSnapshot
            .map(
                (h) => `<tr><td>${h.holeNumber}</td><td>${h.par}</td><td>${h.baseStrokeIndex}</td></tr>`,
            )
            .join('');
        return `
<section>
  <h2>Course hole snapshot <span class="muted">· round_course_holes (${courseHolesSnapshot.length} rows)</span></h2>
  <table class="grid">
    <thead><tr><th>hole</th><th>par</th><th>base SI</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</section>`;
    })();

    const teeSection = (() => {
        if (teeHolesSnapshot.length === 0) {
            return `
<section>
  <h2>Tee hole snapshot <span class="muted">· round_tee_holes</span></h2>
  <p class="muted">No snapshot rows yet — either no participant tees assigned yet, or this round pre-dates the 2.6a backfill. Live capture lands in 2.6b via the RoundCompiler.</p>
</section>`;
        }
        // Group by frozen tee name — FK can be null after tee deletion,
        // but tee_name_snapshot is always present (migration 017
        // guarantee). Use the live name when the FK still resolves so
        // the render diffs live-vs-snapshot when they drift.
        const byTeeName = new Map<string, RoundTeeHoleSnapshot[]>();
        for (const row of teeHolesSnapshot) {
            const bucket = byTeeName.get(row.teeNameSnapshot);
            if (bucket) bucket.push(row);
            else byTeeName.set(row.teeNameSnapshot, [row]);
        }
        const teeTables = Array.from(byTeeName.entries())
            .map(([snapshotName, rows]) => {
                const teeId = rows[0]!.teeId;
                const liveTee = teeId !== null ? teesById.get(teeId) : undefined;
                const liveName = liveTee?.name;
                const label =
                    liveName === undefined
                        ? `${esc(snapshotName)} <span class="muted">· tee deleted (snapshot frozen)</span>`
                        : liveName === snapshotName
                          ? esc(snapshotName)
                          : `${esc(liveName)} <span class="muted">(live)</span> <span class="match">· snapshot: ${esc(snapshotName)}</span>`;
                const body = rows
                    .map(
                        (r) =>
                            `<tr><td>${r.holeNumber}</td><td>${r.lengthM}</td><td>${r.strokeIndexOverride ?? '—'}</td></tr>`,
                    )
                    .join('');
                return `
<h3>${label} <span class="muted">· ${rows.length} holes</span></h3>
<table class="grid">
  <thead><tr><th>hole</th><th>length (m)</th><th>SI override</th></tr></thead>
  <tbody>${body}</tbody>
</table>`;
            })
            .join('');
        return `
<section>
  <h2>Tee hole snapshot <span class="muted">· round_tee_holes (${teeHolesSnapshot.length} rows across ${byTeeName.size} tees)</span></h2>
  ${teeTables}
</section>`;
    })();

    return courseSection + teeSection;
}
