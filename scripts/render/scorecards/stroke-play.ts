// Stroke-play / stableford / foursomes individual scorecard — "one card
// per participant" layout. Emits Par / SI / Given / Gross / Net / Points
// (+ optional Running + Status) rows.

import type { Participant } from '../../../server/services/participant.service';
import type { CourseHole } from '../../../server/domain/format';
import type { ParticipantResult, RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc, netCell, numericCell, splitHoleGroups, strokesCell, strokesGivenMap } from '../util';

export function renderScorecard(
    ctx: RoundRenderContext,
    state: RoundRenderState,
    result: ParticipantResult,
    p: Participant,
    courseHoles: CourseHole[],
): string {
    const { round } = ctx;
    const {
        allCourseHoles,
        effectivePHByParticipant,
        isFoursomesSlot,
        isKopenhamnareSlot,
        kopenHandicapModeFor,
        normalizedRunningByParticipant,
        pairResultsByParticipant,
        participantLabel,
        slotByParticipantId,
    } = state;

    const byHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
    const groups = splitHoleGroups(courseHoles);
    const includeTotColumn = groups.length > 1;
    // Allocation always against the full 18 SI distribution — a 9-hole round
    // inherits the strokes that fall on its holes, not a fresh 9-hole allocation.
    // For Köpenhamnare under delta_from_min, the Given row shows the EFFECTIVE
    // strokes (lowest-PH player plays off 0; others get their delta).
    const participantSlot = slotByParticipantId.get(p.id);
    const isKopenhamnareParticipant = isKopenhamnareSlot(participantSlot);
    const phForStrokes = effectivePHByParticipant.has(p.id)
        ? (effectivePHByParticipant.get(p.id) ?? p.playingHandicapSnapshot)
        : p.playingHandicapSnapshot;
    const strokesGiven = strokesGivenMap(phForStrokes, allCourseHoles);
    // A Status row is rendered for pair-level formats (match-play today,
    // Taliban later) — we signal via participation in a pair result. The
    // strategy populates each `HoleResult.note` with the running status
    // from that participant's perspective (e.g. `1UP`, `AS`, `2DN`,
    // `dormie`). Stableford etc. also populate `note`, but for arithmetic;
    // they don't appear in pairResults so the Status row is skipped.
    const isPair = pairResultsByParticipant.has(p.id);

    const row = (
        label: string,
        cell: (h: CourseHole) => string,
        sum: (holes: CourseHole[]) => string,
        klass = '',
    ): string => {
        const groupSums = groups.map((g) => sum(g.holes));
        const groupCells = groups
            .map((g, i) => g.holes.map(cell).join('') + `<td class="sum">${groupSums[i]}</td>`)
            .join('');
        let totCell = '';
        if (includeTotColumn) {
            const nums = groupSums.filter((s) => s !== '—').map(Number);
            const tot = nums.length === 0 ? '—' : String(nums.reduce((a, b) => a + b, 0));
            totCell = `<td class="sum">${tot}</td>`;
        }
        return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${totCell}
</tr>`;
    };

    const stateRow = (
        label: string,
        cell: (h: CourseHole) => string,
        groupEnd: (holes: CourseHole[]) => string,
        totalEnd: string,
        klass = '',
    ): string => {
        const groupCells = groups
            .map((g) => g.holes.map(cell).join('') + `<td class="sum">${groupEnd(g.holes)}</td>`)
            .join('');
        return `
<tr class="${klass}">
  <th class="rowlabel">${label}</th>
  ${groupCells}
  ${includeTotColumn ? `<td class="sum">${totalEnd}</td>` : ''}
</tr>`;
    };

    const headerCells = groups
        .map((g) => g.holes.map((h) => `<th>${h.holeNumber}</th>`).join('') + `<th class="sum">${g.label}</th>`)
        .join('');
    const holeHeader = `
<tr>
  <th class="rowlabel">Hole</th>
  ${headerCells}
  ${includeTotColumn ? '<th class="sum">TOT</th>' : ''}
</tr>`;

    const parRow = row('Par', (h) => `<td>${h.par}</td>`, (holes) => String(holes.reduce((a, b) => a + b.par, 0)));
    const siRow = row('SI', (h) => `<td class="si">${h.strokeIndex}</td>`, () => '—', 'dim');
    const strokesGivenRow = row(
        'Given',
        (h) => {
            const s = strokesGiven.get(h.holeNumber) ?? 0;
            return `<td class="given">${s > 0 ? `+${s}` : ''}</td>`;
        },
        () => '—',
        'dim',
    );

    const grossRow = row(
        'Gross',
        (h) => {
            const hr = byHole.get(h.holeNumber);
            return `<td>${strokesCell(hr?.gross ?? null)}</td>`;
        },
        (holes) => {
            const total = holes.reduce((acc, h) => {
                const hr = byHole.get(h.holeNumber);
                return hr?.gross != null ? acc + hr.gross : acc;
            }, 0);
            const any = holes.some((h) => byHole.get(h.holeNumber)?.gross != null);
            return any ? String(total) : '—';
        },
    );

    const netRow = row(
        'Net',
        (h) => {
            const hr = byHole.get(h.holeNumber);
            return `<td>${netCell(hr?.net ?? null)}</td>`;
        },
        (holes) => {
            const total = holes.reduce((acc, h) => {
                const hr = byHole.get(h.holeNumber);
                return hr?.net != null ? acc + hr.net : acc;
            }, 0);
            const any = holes.some((h) => byHole.get(h.holeNumber)?.net != null);
            return any ? String(total) : '—';
        },
    );

    const pointsAny = result.holes.some((h) => h.points !== null);
    const pointsRow = pointsAny
        ? row(
              'Points',
              (h) => {
                  const hr = byHole.get(h.holeNumber);
                  const note = hr?.note ? ` title="${esc(hr.note)}"` : '';
                  return `<td${note}>${hr?.points ?? '—'}</td>`;
              },
              (holes) => {
                  const total = holes.reduce((acc, h) => {
                      const hr = byHole.get(h.holeNumber);
                      return hr?.points != null ? acc + hr.points : acc;
                  }, 0);
                  const any = holes.some((h) => byHole.get(h.holeNumber)?.points != null);
                  return any ? String(total) : '—';
              },
          )
        : '';

    const runningByHole = normalizedRunningByParticipant.get(p.id);
    const runningRow =
        pointsAny && runningByHole
            ? stateRow(
                  'Running',
                  (h) => `<td>${numericCell(runningByHole.get(h.holeNumber))}</td>`,
                  (holes) => {
                      const last = holes[holes.length - 1];
                      return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
                  },
                  (() => {
                      const last = courseHoles[courseHoles.length - 1];
                      return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
                  })(),
              )
            : '';

    const statusRow = isPair
        ? row(
              'Status',
              (h) => {
                  const hr = byHole.get(h.holeNumber);
                  return `<td class="status">${esc(hr?.note ?? '—')}</td>`;
              },
              () => '—',
          )
        : '';

    // When any hole carries a `note` (e.g. stableford arithmetic), surface
    // the per-hole breakdown under the scorecard so the points row's
    // numbers are immediately hand-verifiable.
    const annotatedHoles = result.holes.filter((h) => h.note && h.points !== null);
    const pointsArithmetic =
        annotatedHoles.length > 0
            ? `<p class="arithmetic">${annotatedHoles
                  .map((h) => `h${h.holeNumber}: ${esc(h.note!)}`)
                  .join(' · ')}</p>`
            : '';

    const totalsRow = result.totals
        .map((t) => `<li>${esc(t.scoringType)} = <strong>${t.value ?? '—'}</strong></li>`)
        .join('');

    // Köpenhamnare header annotation: declare mode + effective PH next to
    // the snapshot so the reader can see e.g. "PH 23 → eff 19 (delta_from_min)".
    const kopenAnnotation =
        isKopenhamnareParticipant
            ? (() => {
                  const eff = effectivePHByParticipant.get(p.id);
                  const modeLabel = esc(kopenHandicapModeFor(participantSlot) ?? 'standard');
                  if (eff === undefined || eff === null) return ` · mode ${modeLabel}`;
                  if (p.playingHandicapSnapshot !== null && eff !== p.playingHandicapSnapshot) {
                      return ` · eff PH ${eff} (mode ${modeLabel})`;
                  }
                  return ` · eff PH ${eff} (mode ${modeLabel})`;
              })()
            : '';

    // Foursomes header annotation: foursomes cards re-use the individual
    // scorecard layout (one ball → one Gross row, one Net row) but the
    // header should surface that this is a team format and the typical
    // 50% allowance.
    const slotFormat = round.formatSlots[result.slotIndex];
    const foursomesAnnotation =
        isFoursomesSlot(slotFormat) && slotFormat
            ? ` · ${esc(slotFormat.scoringMode)} × ${esc(slotFormat.teamShape)} @ ${slotFormat.allowancePct}%`
            : '';

    return `
<article class="scorecard-card">
  <header>
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      slot #${result.slotIndex}${foursomesAnnotation} · H idx ${p.handicapIndexSnapshot ?? '—'} · CH ${p.courseHandicapSnapshot ?? '—'} · PH ${p.playingHandicapSnapshot ?? '—'}${kopenAnnotation} · holes played ${result.holesPlayed}
    </span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>
      ${parRow}
      ${siRow}
      ${strokesGivenRow}
      ${grossRow}
      ${netRow}
      ${pointsRow}
      ${runningRow}
      ${statusRow}
    </tbody>
  </table>
  ${pointsArithmetic}
  <ul class="totals">${totalsRow}</ul>
</article>`;
}
