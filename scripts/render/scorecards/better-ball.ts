// Better-ball scorecard: 4 rows per producer (Given / Gross / Net / Points)
// plus 1 team Points row. Reads raw per-producer scorecard rows from the
// team ball's scorecard, runs the same stableford primitives the strategy
// uses (`stablefordOutcome`), and emits the team row from the already-
// computed `result`.

import type { ScorecardHole } from '../../../server/services/scorecard.service';
import type { BallResult, CourseHole } from '../../../server/domain/format';
import {
    stablefordOutcome,
    type StablefordHoleOutcome,
} from '../../../server/domain/formats/_stableford-scoring';
import type { BallInfo, RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc, netCell, splitHoleGroups, strokesCell, strokesGivenMap } from '../util';

export function renderBetterBallScorecard(
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

    // Per-producer sub-rows. Each producer's strokes-given map uses their
    // own frozen CH (the domain uses playingHandicap per player, but the
    // per-player PH isn't stored on ball_players — use courseHandicapSnapshot
    // as the producer-level handicap fallback; legacy teamPh wins when set).
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

        const outcomeByHole = new Map<number, StablefordHoleOutcome>();
        for (const ch of allCourseHoles) {
            const rr = producerRowByHole.get(ch.holeNumber);
            const strokes = rr === undefined ? undefined : rr.strokes;
            outcomeByHole.set(
                ch.holeNumber,
                stablefordOutcome(strokes, ch, strokesGiven.get(ch.holeNumber) ?? 0),
            );
        }

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
                const o = outcomeByHole.get(h.holeNumber)!;
                if (o.kind === 'pickup') return `<td><span class="pickup">P</span></td>`;
                return `<td>${strokesCell(o.gross)}</td>`;
            },
            (holes) => {
                let total = 0;
                let any = false;
                for (const h of holes) {
                    const o = outcomeByHole.get(h.holeNumber)!;
                    if (o.gross !== null) {
                        total += o.gross;
                        any = true;
                    }
                }
                return any ? String(total) : '—';
            },
        );
        const netRow = row(
            `${esc(name)} Net`,
            (h) => {
                const o = outcomeByHole.get(h.holeNumber)!;
                return `<td>${netCell(o.net)}</td>`;
            },
            (holes) => {
                let total = 0;
                let any = false;
                for (const h of holes) {
                    const o = outcomeByHole.get(h.holeNumber)!;
                    if (o.net !== null) {
                        total += o.net;
                        any = true;
                    }
                }
                return any ? String(total) : '—';
            },
        );
        const pointsRow = row(
            `${esc(name)} Points`,
            (h) => {
                const o = outcomeByHole.get(h.holeNumber)!;
                let tip = '';
                if (o.kind === 'scored') {
                    const diff = o.netPar - (o.gross as number);
                    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
                    tip = `${o.points} pts (netPar ${o.netPar} − ${o.gross} = ${diffStr})`;
                } else if (o.kind === 'pickup') {
                    tip = `0 pts (pickup, netPar ${o.netPar})`;
                } else if (o.kind === 'dnp') {
                    tip = `DNP — null points`;
                }
                const title = tip ? ` title="${esc(tip)}"` : '';
                return `<td${title}>${o.points ?? '—'}</td>`;
            },
            (holes) => {
                let total = 0;
                let any = false;
                for (const h of holes) {
                    const o = outcomeByHole.get(h.holeNumber)!;
                    if (o.points !== null) {
                        total += o.points;
                        any = true;
                    }
                }
                return any ? String(total) : '—';
            },
        );
        return [givenRow, grossRow, netRow, pointsRow].join('');
    });

    const teamRow = row(
        'Team Points',
        (h) => {
            const hr = teamByHole.get(h.holeNumber);
            const note = hr?.note ? ` title="${esc(hr.note)}"` : '';
            return `<td${note}><strong>${hr?.points ?? '—'}</strong></td>`;
        },
        (holes) => {
            let total = 0;
            let any = false;
            for (const h of holes) {
                const hr = teamByHole.get(h.holeNumber);
                if (hr?.points != null) {
                    total += hr.points;
                    any = true;
                }
            }
            return any ? String(total) : '—';
        },
    );

    const annotatedHoles = result.holes.filter((h) => h.note && h.points !== null);
    const arithmetic =
        annotatedHoles.length > 0
            ? `<p class="arithmetic">${annotatedHoles
                  .map((h) => `h${h.holeNumber}: ${esc(h.note!)}`)
                  .join(' · ')}</p>`
            : '';

    const totalsRow = result.totals
        .map((t) => `<li>${esc(t.scoringType)} = <strong>${t.value ?? '—'}</strong></li>`)
        .join('');

    const slotFormat = round.formatSlots[result.slotIndex];
    return `
<article class="scorecard-card">
  <header>
    <h3>${esc(ballLabel(b))}</h3>
    <span class="muted">
      slot #${result.slotIndex} · ${esc(slotFormat?.scoringMode ?? '')} × ${esc(slotFormat?.teamShape ?? '')} · ${producerPhSummary(b)} · holes played ${result.holesPlayed}
    </span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>
      ${parRow}
      ${siRow}
      ${producerBlocks.join('')}
      ${teamRow}
    </tbody>
  </table>
  ${arithmetic}
  <ul class="totals">${totalsRow}</ul>
</article>`;
}
