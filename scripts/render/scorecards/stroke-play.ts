// Stroke-play / stableford-individual / foursomes scorecard — "one card
// per ball" layout. Emits Par / SI / Given / Gross / Net / Points rows
// (+ optional Running + Status). For foursomes the ball represents the
// pair; the header label shows both producer names joined by " & ".

import type { CourseHole } from '../../../server/domain/format';
import type { BallResult } from '../../../server/domain/format';
import type { BallInfo, RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc, netCell, numericCell, splitHoleGroups, strokesCell, strokesGivenMap } from '../util';

export function renderScorecard(
    ctx: RoundRenderContext,
    state: RoundRenderState,
    result: BallResult,
    b: BallInfo,
    courseHoles: CourseHole[],
): string {
    const { round } = ctx;
    const {
        allCourseHoles,
        ballLabel,
        ballPlayingHandicapInSlot,
        effectivePHByBall,
        isFoursomesSlot,
        isKopenhamnareSlot,
        kopenHandicapModeFor,
        normalizedRunningByBall,
        pairResultByBall,
        slotForBall,
    } = state;

    const byHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
    const groups = splitHoleGroups(courseHoles);
    const includeTotColumn = groups.length > 1;

    const slot = slotForBall(b);
    const isKopenhamnareBall = isKopenhamnareSlot(slot);
    const snapshotPh = ballPlayingHandicapInSlot(b, result.slotIndex);
    const phForStrokes = effectivePHByBall.has(b.id)
        ? (effectivePHByBall.get(b.id) ?? snapshotPh)
        : snapshotPh;
    const strokesGiven = strokesGivenMap(phForStrokes, allCourseHoles);
    const isPair = pairResultByBall.has(b.id);

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

    const runningByHole = normalizedRunningByBall.get(b.id);
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

    const kopenAnnotation =
        isKopenhamnareBall
            ? (() => {
                  const eff = effectivePHByBall.get(b.id);
                  const modeLabel = esc(kopenHandicapModeFor(slot) ?? 'standard');
                  if (eff === undefined || eff === null) return ` · mode ${modeLabel}`;
                  return ` · eff PH ${eff} (mode ${modeLabel})`;
              })()
            : '';

    const slotFormat = round.formatSlots[result.slotIndex];
    const foursomesAnnotation =
        isFoursomesSlot(slotFormat) && slotFormat
            ? ` · ${esc(slotFormat.scoringMode)} × ${esc(slotFormat.teamShape)} @ ${slotFormat.allowancePct}%`
            : '';

    // Header handicap summary — use the ball's frozen CH/PH.
    const phCell = snapshotPh ?? '—';
    const chCell = b.courseHandicapSnapshot ?? '—';
    const hIdxCell = b.producers[0]?.handicapIndexSnapshot ?? '—';

    return `
<article class="scorecard-card">
  <header>
    <h3>${esc(ballLabel(b))}</h3>
    <span class="muted">
      slot #${result.slotIndex}${foursomesAnnotation} · H idx ${hIdxCell} · CH ${chCell} · PH ${phCell}${kopenAnnotation} · holes played ${result.holesPlayed}
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
