// Taliban scorecard: like better-ball (per-producer Given / Gross / Net
// sub-rows), but replaces the team Points row with a team Status row
// (`W+2` / `L` / `AS` / `W+5 (down eagle)` per hole). Taliban is
// pair-level — team points totals live in the Match results section
// of the leaderboard, not here.

import type { ScorecardHole } from '../../../server/services/scorecard.service';
import type { BallResult, CourseHole } from '../../../server/domain/format';
import type { BallInfo, RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc, netCell, splitHoleGroups, strokesCell, strokesGivenMap } from '../util';

export function renderTalibanScorecard(
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
        producerName,
        producerPhSummary,
        scorecardByBall,
    } = state;

    const groups = splitHoleGroups(courseHoles);
    const includeTotColumn = groups.length > 1;

    const teamByHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
    const scorecard = scorecardByBall.get(b.id);
    const allRows = scorecard?.holes ?? [];
    const teamPh = ballPlayingHandicapInSlot(b, result.slotIndex);

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

    const producerBlocks = b.producers.map((prod) => {
        const name = producerName(prod);
        const producerPh = prod.courseHandicapSnapshot ?? teamPh ?? 0;
        const strokesGiven = strokesGivenMap(producerPh, allCourseHoles);
        const producerRows: ScorecardHole[] = allRows.filter((h) => {
            if (prod.playerId) return h.sourcePlayerId === prod.playerId;
            if (prod.guestPlayerId) return h.sourceGuestPlayerId === prod.guestPlayerId;
            return false;
        });
        const producerRowByHole = new Map<number, ScorecardHole>();
        for (const r of producerRows) producerRowByHole.set(r.holeNumber, r);

        const givenRow = row(
            `${esc(name)} Given`,
            (h) => {
                const sg = strokesGiven.get(h.holeNumber) ?? 0;
                return `<td class="given">${sg > 0 ? `+${sg}` : ''}</td>`;
            },
            () => '—',
            'dim',
        );
        const grossRow = row(
            `${esc(name)} Gross`,
            (h) => {
                const rr = producerRowByHole.get(h.holeNumber);
                if (!rr) return `<td>${strokesCell(null)}</td>`;
                return `<td>${strokesCell(rr.strokes)}</td>`;
            },
            (holes) => {
                let total = 0;
                let any = false;
                for (const h of holes) {
                    const rr = producerRowByHole.get(h.holeNumber);
                    if (rr && rr.strokes !== null && rr.strokes !== 0) {
                        total += rr.strokes;
                        any = true;
                    }
                }
                return any ? String(total) : '—';
            },
        );
        const netRow = row(
            `${esc(name)} Net`,
            (h) => {
                const rr = producerRowByHole.get(h.holeNumber);
                if (!rr || rr.strokes === null || rr.strokes === 0) {
                    return `<td>${netCell(null)}</td>`;
                }
                const given = strokesGiven.get(h.holeNumber) ?? 0;
                return `<td>${netCell(rr.strokes - given)}</td>`;
            },
            (holes) => {
                let total = 0;
                let any = false;
                for (const h of holes) {
                    const rr = producerRowByHole.get(h.holeNumber);
                    if (rr && rr.strokes !== null && rr.strokes !== 0) {
                        const given = strokesGiven.get(h.holeNumber) ?? 0;
                        total += rr.strokes - given;
                        any = true;
                    }
                }
                return any ? String(total) : '—';
            },
        );
        return [givenRow, grossRow, netRow].join('');
    });

    const statusRow = row(
        'Status',
        (h) => {
            const hr = teamByHole.get(h.holeNumber);
            const note = hr?.note ?? '—';
            return `<td class="status">${esc(note)}</td>`;
        },
        () => '—',
    );

    const slotFormat = round.formatSlots[result.slotIndex];
    return `
<article class="scorecard-card">
  <header>
    <h3>${esc(ballLabel(b))}</h3>
    <span class="muted">
      slot #${result.slotIndex} · ${esc(slotFormat?.scoringMode ?? '')} × ${esc(slotFormat?.teamShape ?? '')} @ ${slotFormat?.allowancePct ?? 100}% · ${producerPhSummary(b)} · holes played ${result.holesPlayed}
    </span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>
      ${parRow}
      ${siRow}
      ${producerBlocks.join('')}
      ${statusRow}
    </tbody>
  </table>
</article>`;
}
