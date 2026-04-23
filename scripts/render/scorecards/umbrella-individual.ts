// Umbrella 3-player individual scorecard — per-ball card with Par / SI /
// Given / Gross / Net / LG / FIR / GIR / BIRD / Points (+ Running) rows.
// FIR / GIR read the raw scorecard metadata (set by the scorer); LG /
// BIRD come from the strategy-written note.

import type { BallResult, CourseHole, HoleResult } from '../../../server/domain/format';
import type { BallInfo, RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc, netCell, numericCell, splitHoleGroups, strokesCell, strokesGivenMap } from '../util';
import { formatSlotSummary } from '../index-page';

export function renderUmbrellaIndividualScorecard(
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
        normalizedRunningByBall,
        scorecardByBall,
        umbrellaBirdieRuleFor,
    } = state;

    const byHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
    const groups = splitHoleGroups(courseHoles);
    const includeTotColumn = groups.length > 1;
    const ballPh = ballPlayingHandicapInSlot(b, result.slotIndex);
    const strokesGiven = strokesGivenMap(ballPh, allCourseHoles);
    const scorecard = scorecardByBall.get(b.id);
    const rawByHole = new Map(
        (scorecard?.holes ?? [])
            .filter((h) => h.sourcePlayerId === null && h.sourceGuestPlayerId === null)
            .map((h) => [h.holeNumber, h]),
    );

    const hasCat = (hr: HoleResult | undefined, cat: 'LG' | 'FWY' | 'GIR' | 'BIRD'): boolean =>
        hr?.note !== undefined ? new RegExp(`\\b${cat}\\b`).test(hr.note) : false;

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
        (h) => `<td>${strokesCell(byHole.get(h.holeNumber)?.gross ?? null)}</td>`,
        (holes) => {
            const total = holes.reduce((acc, h) => {
                const gross = byHole.get(h.holeNumber)?.gross;
                return gross != null ? acc + gross : acc;
            }, 0);
            const any = holes.some((h) => byHole.get(h.holeNumber)?.gross != null);
            return any ? String(total) : '—';
        },
    );
    const netRow = row(
        'Net',
        (h) => `<td>${netCell(byHole.get(h.holeNumber)?.net ?? null)}</td>`,
        (holes) => {
            const total = holes.reduce((acc, h) => {
                const net = byHole.get(h.holeNumber)?.net;
                return net != null ? acc + net : acc;
            }, 0);
            const any = holes.some((h) => byHole.get(h.holeNumber)?.net != null);
            return any ? String(total) : '—';
        },
    );
    const lgRow = row(
        'LG',
        (h) => `<td class="given">${hasCat(byHole.get(h.holeNumber), 'LG') ? '✓' : ''}</td>`,
        (holes) => {
            const total = holes.filter((h) => hasCat(byHole.get(h.holeNumber), 'LG')).length;
            return total > 0 ? String(total) : '—';
        },
        'dim',
    );
    const firRow = row(
        'FIR',
        (h) => {
            if (h.par <= 3) return '<td class="given">—</td>';
            const fir = rawByHole.get(h.holeNumber)?.metadata?.fairway === true;
            return `<td class="given">${fir ? '✓' : ''}</td>`;
        },
        (holes) => {
            const total = holes.filter(
                (h) => h.par > 3 && rawByHole.get(h.holeNumber)?.metadata?.fairway === true,
            ).length;
            return total > 0 ? String(total) : '—';
        },
        'dim',
    );
    const girRow = row(
        'GIR',
        (h) => {
            const gir = rawByHole.get(h.holeNumber)?.metadata?.gir === true;
            return `<td class="given">${gir ? '✓' : ''}</td>`;
        },
        (holes) => {
            const total = holes.filter(
                (h) => rawByHole.get(h.holeNumber)?.metadata?.gir === true,
            ).length;
            return total > 0 ? String(total) : '—';
        },
        'dim',
    );
    const birdRow = row(
        'BIRD',
        (h) => `<td class="given">${hasCat(byHole.get(h.holeNumber), 'BIRD') ? '✓' : ''}</td>`,
        (holes) => {
            const total = holes.filter((h) => hasCat(byHole.get(h.holeNumber), 'BIRD')).length;
            return total > 0 ? String(total) : '—';
        },
        'dim',
    );
    const pointsRow = row(
        'Points',
        (h) => {
            const hr = byHole.get(h.holeNumber);
            const note = hr?.note ? ` title="${esc(hr.note)}"` : '';
            const sweep = hr?.note?.includes('☂') ? ' ☂' : '';
            return `<td${note}>${hr?.points != null ? `<strong>${hr.points}${sweep}</strong>` : '—'}</td>`;
        },
        (holes) => {
            const total = holes.reduce((acc, h) => {
                const points = byHole.get(h.holeNumber)?.points;
                return points != null ? acc + points : acc;
            }, 0);
            const any = holes.some((h) => byHole.get(h.holeNumber)?.points != null);
            return any ? String(total) : '—';
        },
    );

    const runningByHole = normalizedRunningByBall.get(b.id);
    const runningRow =
        runningByHole
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

    const slotFormat = round.formatSlots[result.slotIndex];
    const umbrellaHeader =
        slotFormat
            ? `slot #${result.slotIndex} · ${esc(formatSlotSummary(slotFormat))} · birdieRule ${esc(umbrellaBirdieRuleFor(slotFormat) ?? 'gross')}`
            : `slot #${result.slotIndex}`;

    const hIdxCell = b.producers[0]?.handicapIndexSnapshot ?? '—';
    const chCell = b.courseHandicapSnapshot ?? '—';

    return `
<article class="scorecard-card">
  <header>
    <h3>${esc(ballLabel(b))}</h3>
    <span class="muted">
      ${umbrellaHeader} · H idx ${hIdxCell} · CH ${chCell} · PH ${ballPh ?? '—'} · holes played ${result.holesPlayed}
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
      ${lgRow}
      ${firRow}
      ${girRow}
      ${birdRow}
      ${pointsRow}
      ${runningRow}
    </tbody>
  </table>
  ${pointsArithmetic}
  <ul class="totals">${totalsRow}</ul>
</article>`;
}
