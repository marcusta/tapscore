// Course metadata + snapshot tables sections. The live-course table and
// the two snapshot tables (course holes + tee holes) sit close together
// on the page and share DOM structure, so they live in one module.

import type { RouteSectionRef } from '../../../server/domain/strategies/result-sections';
import type { PlayedOccurrence, RoundRenderContext, RoundTeeHoleSnapshot } from '../types';
import { esc } from '../util';

/** A column group of itinerary occurrences owned by one route section. */
interface OccurrenceGroup {
    label: string;
    holes: PlayedOccurrence[];
}

/**
 * Group itinerary occurrences by the round's frozen route sections: an
 * occurrence belongs to the section whose
 * `[fromCanonicalOrdinal, toCanonicalOrdinal]` contains its `ordinal`
 * (canonical ordinal). Falls back to a single TOT group when there are no
 * sections.
 */
function groupOccurrences(
    occurrences: PlayedOccurrence[],
    routeSections: RouteSectionRef[],
): OccurrenceGroup[] {
    const ordered = [...occurrences].sort((a, b) => a.ordinal - b.ordinal);
    if (routeSections.length === 0) {
        return [{ label: 'TOT', holes: ordered }];
    }
    const sections = [...routeSections].sort(
        (a, b) => a.fromCanonicalOrdinal - b.fromCanonicalOrdinal,
    );
    const groups: OccurrenceGroup[] = [];
    for (const section of sections) {
        const members = ordered.filter(
            (h) =>
                h.ordinal >= section.fromCanonicalOrdinal &&
                h.ordinal <= section.toCanonicalOrdinal,
        );
        if (members.length === 0) continue;
        groups.push({ label: section.label, holes: members });
    }
    return groups;
}

export function renderCourseMetadata(
    ctx: RoundRenderContext,
    playedOccurrences: PlayedOccurrence[],
): string {
    const { round, course, roundResult } = ctx;
    const groups = groupOccurrences(playedOccurrences, roundResult.routeSections);
    const includeTotColumn = groups.length > 1;
    const parTotal = playedOccurrences.reduce((a, b) => a + b.par, 0);

    const headerCells = groups
        .map((g) => g.holes.map((h) => `<th>${esc(h.occurrenceLabel)}</th>`).join('') + `<th class="sum">${esc(g.label)}</th>`)
        .join('');
    const parCells = groups
        .map((g) => g.holes.map((h) => `<td>${h.par}</td>`).join('') + `<td class="sum">${g.holes.reduce((a, b) => a + b.par, 0)}</td>`)
        .join('');
    const siCells = groups
        .map((g) => g.holes.map((h) => `<td class="si">${h.baseStrokeIndex}</td>`).join('') + `<td class="sum"></td>`)
        .join('');
    const totHead = includeTotColumn ? `<th class="sum">TOT</th>` : '';
    const totPar = includeTotColumn ? `<td class="sum">${parTotal}</td>` : '';
    const totSi = includeTotColumn ? `<td class="sum"></td>` : '';

    const routeKind = roundResult.routeSections.length > 1 ? 'sectioned' : 'single';
    const subtitle = `${routeKind} route · ${playedOccurrences.length} holes · cycle ${round.routeSi.allocationCycleSize}`;

    return `
<section>
  <h2>Course — ${esc(course.name)} <span class="muted">· ${esc(subtitle)}</span></h2>
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

/**
 * Route summary — itinerary-level provenance the OUT/IN scorecard can't
 * show: SI provenance, allocation cycle, route handicap policy, WHS posting
 * eligibility, the route-section list, and a playing-groups table (each
 * group's start → end occurrence, ball count, and rotated played order).
 */
export function renderRouteSummary(ctx: RoundRenderContext): string {
    const { round, roundResult } = ctx;
    const { routeSi, routeHandicapPolicy, routeSections, playingGroups } = round;

    const labelByPlayHoleId = new Map<string, string>();
    for (const ph of round.playHoles) labelByPlayHoleId.set(ph.id, String(ph.courseHoleNumber));
    const occLabel = (playHoleId: string): string => labelByPlayHoleId.get(playHoleId) ?? '?';

    const siSource =
        routeSi.sourceLabel === null
            ? '—'
            : routeSi.sourceVersion === null
              ? esc(routeSi.sourceLabel)
              : `${esc(routeSi.sourceLabel)} <span class="muted">v${esc(routeSi.sourceVersion)}</span>`;

    const posting = roundResult.posting.eligible
        ? '<span class="match">eligible</span>'
        : `ineligible <span class="muted">· ${esc(roundResult.posting.reason ?? 'no reason given')}</span>`;

    const facts = `
  <table class="kv">
    <tr><th>SI mode</th><td>${esc(routeSi.mode)} <span class="muted">· ${siSource}</span></td></tr>
    <tr><th>allocation cycle</th><td>${routeSi.allocationCycleSize}</td></tr>
    <tr><th>handicap policy</th><td>${esc(routeHandicapPolicy.type)}</td></tr>
    <tr><th>WHS posting</th><td>${posting}</td></tr>
  </table>`;

    const sectionsList =
        routeSections.length === 0
            ? '<p class="muted">No route sections — single TOT segment.</p>'
            : `<ul class="totals">${routeSections
                  .map(
                      (s) =>
                          `<li>${esc(s.label)} <span class="muted">· ordinals ${s.fromCanonicalOrdinal}–${s.toCanonicalOrdinal}</span></li>`,
                  )
                  .join('')}</ul>`;

    const groupRows = playingGroups
        .map((g) => {
            const played = g.playedOrder
                .map((p) => occLabel(p.playHoleId))
                .join(' → ');
            return `
<tr>
  <td><code>${esc(g.id.slice(0, 8))}</code></td>
  <td>${esc(g.startTime)}</td>
  <td class="num">${occLabel(g.startPlayHoleId)} <span class="muted">(#${g.startOrdinal})</span> → ${occLabel(g.endPlayHoleId)} <span class="muted">(#${g.endOrdinal})</span></td>
  <td class="num">${g.ballIds.length}</td>
  <td class="muted">${esc(played)}</td>
</tr>`;
        })
        .join('');
    const groupsTable =
        playingGroups.length === 0
            ? '<p class="muted">No playing groups.</p>'
            : `
<table class="grid">
  <thead><tr><th>group</th><th>start time</th><th>start → end</th><th>balls</th><th>played order</th></tr></thead>
  <tbody>${groupRows}</tbody>
</table>`;

    return `
<section>
  <h2>Route <span class="muted">· itinerary provenance</span></h2>
  ${facts}
  <h3>Route sections</h3>
  ${sectionsList}
  <h3>Playing groups (${playingGroups.length})</h3>
  ${groupsTable}
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
