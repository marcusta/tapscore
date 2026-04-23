// Unified pair scorecard — one table for BOTH sides of a match-play or
// Taliban pair. Stacks: shared hole header → Par / SI → Side A block
// (Given / Gross / Net per producer) → Side A points + running → Side B
// block → Side B points + running → per-hole Status row → cumulative
// Match row (idiom-specific).
//
// `kind` decides the per-producer layout: individual = 1 producer/side,
// team = 2 producers/side.

import type { ScorecardHole } from '../../../server/services/scorecard.service';
import type {
    BallResult,
    CourseHole,
    PairHoleResult,
    PairResult,
} from '../../../server/domain/format';
import type { BallInfo, RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import {
    esc,
    netCell,
    numericCell,
    pairSideScorecardRows,
    splitHoleGroups,
    strokesCell,
    strokesGivenMap,
    type PairScorecardKind,
} from '../util';

export function renderPairScorecard(
    ctx: RoundRenderContext,
    state: RoundRenderState,
    pair: PairResult,
    kind: PairScorecardKind,
    ballA: BallInfo,
    ballB: BallInfo,
    _resA: BallResult,
    _resB: BallResult,
    courseHoles: CourseHole[],
): string {
    const { round } = ctx;
    const {
        allCourseHoles,
        ballLabel,
        ballPlayingHandicapInSlot,
        effectivePHByBall,
        effectivePHByProducer,
        producerName,
        scorecardByBall,
    } = state;

    const groups = splitHoleGroups(courseHoles);
    const includeTotColumn = groups.length > 1;

    const producerKey = (ballId: string, producerDefId: string): string =>
        `${ballId}:${producerDefId}`;

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

    const sideBlock = (b: BallInfo): string => {
        const scorecard = scorecardByBall.get(b.id);
        const allRows = scorecard?.holes ?? [];
        const teamPh = ballPlayingHandicapInSlot(b, pair.slotIndex);
        const blocks = b.producers.map((prod) => {
            const name = producerName(prod);
            const effProducer = effectivePHByProducer.get(
                producerKey(b.id, prod.producerDefId),
            );
            const effBall = effectivePHByBall.get(b.id);
            const producerPh =
                effProducer ??
                effBall ??
                prod.courseHandicapSnapshot ??
                teamPh ??
                0;
            const strokesGiven = strokesGivenMap(producerPh, allCourseHoles);
            const producerRows = pairSideScorecardRows(kind, prod, allRows);
            const byHole = new Map<number, ScorecardHole>();
            for (const r of producerRows) byHole.set(r.holeNumber, r);

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
                    const r = byHole.get(h.holeNumber);
                    if (!r) return `<td>${strokesCell(null)}</td>`;
                    return `<td>${strokesCell(r.strokes)}</td>`;
                },
                (holes) => {
                    let total = 0;
                    let any = false;
                    for (const h of holes) {
                        const r = byHole.get(h.holeNumber);
                        if (r && r.strokes !== null && r.strokes !== 0) {
                            total += r.strokes;
                            any = true;
                        }
                    }
                    return any ? String(total) : '—';
                },
            );
            const netRow = row(
                `${esc(name)} Net`,
                (h) => {
                    const r = byHole.get(h.holeNumber);
                    if (!r || r.strokes === null || r.strokes === 0) {
                        return `<td>${netCell(null)}</td>`;
                    }
                    const given = strokesGiven.get(h.holeNumber) ?? 0;
                    return `<td>${netCell(r.strokes - given)}</td>`;
                },
                (holes) => {
                    let total = 0;
                    let any = false;
                    for (const h of holes) {
                        const r = byHole.get(h.holeNumber);
                        if (r && r.strokes !== null && r.strokes !== 0) {
                            const given = strokesGiven.get(h.holeNumber) ?? 0;
                            total += r.strokes - given;
                            any = true;
                        }
                    }
                    return any ? String(total) : '—';
                },
            );
            return [givenRow, grossRow, netRow].join('');
        });
        return blocks.join('');
    };

    const pairByHole = new Map(pair.holes.map((ph) => [ph.holeNumber, ph]));

    const sidePoints = (perspective: 'A' | 'B', ph: PairHoleResult): number | null => {
        if (ph.status === null) return null;
        if (kind === 'match_play_individual' || kind === 'match_play_better_ball') {
            if (ph.status === 'halved') return 0;
            if (perspective === 'A') return ph.status === 'won' ? 1 : 0;
            return ph.status === 'lost' ? 1 : 0;
        }
        return perspective === 'A' ? ph.fromA : ph.fromB;
    };

    const buildNormalizedRunning = (
        perspective: 'A' | 'B',
    ): Map<number, number> => {
        let rawA = 0;
        let rawB = 0;
        const out = new Map<number, number>();
        const ordered = [...pair.holes].sort((a, b) => a.holeNumber - b.holeNumber);
        for (const ph of ordered) {
            const ptsA = sidePoints('A', ph);
            const ptsB = sidePoints('B', ph);
            if (ptsA !== null) rawA += ptsA;
            if (ptsB !== null) rawB += ptsB;
            const min = Math.min(rawA, rawB);
            out.set(ph.holeNumber, (perspective === 'A' ? rawA : rawB) - min);
        }
        return out;
    };

    const runningAByHole = buildNormalizedRunning('A');
    const runningBByHole = buildNormalizedRunning('B');

    const pointsRowForSide = (perspective: 'A' | 'B', label: string): string =>
        row(
            `${label} pts`,
            (h) => {
                const ph = pairByHole.get(h.holeNumber);
                return `<td><strong>${numericCell(ph ? sidePoints(perspective, ph) : null)}</strong></td>`;
            },
            (holes) => {
                let total = 0;
                let any = false;
                for (const h of holes) {
                    const ph = pairByHole.get(h.holeNumber);
                    const pts = ph ? sidePoints(perspective, ph) : null;
                    if (pts !== null) {
                        total += pts;
                        any = true;
                    }
                }
                return any ? numericCell(total) : '—';
            },
        );

    const runningRowForSide = (
        perspective: 'A' | 'B',
        label: string,
        runningByHole: Map<number, number>,
    ): string =>
        stateRow(
            `${label} run`,
            (h) => `<td>${numericCell(runningByHole.get(h.holeNumber))}</td>`,
            (holes) => {
                const last = holes[holes.length - 1];
                return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
            },
            (() => {
                const last = courseHoles[courseHoles.length - 1];
                return last ? numericCell(runningByHole.get(last.holeNumber)) : '—';
            })(),
        );

    const statusRow = row(
        'Status',
        (h) => {
            const ph = pairByHole.get(h.holeNumber);
            return `<td class="status">${esc(ph?.note ?? '—')}</td>`;
        },
        () => '—',
    );

    const formatRunning = (running: number): string => {
        if (kind === 'match_play_individual' || kind === 'match_play_better_ball') {
            if (running === 0) return 'AS';
            if (running > 0) return `${running}UP`;
            return `${-running}DN`;
        }
        if (running === 0) return 'AS';
        if (running > 0) return `+${running}`;
        return `−${-running}`;
    };
    const runningByHole = new Map<number, number>();
    let running = 0;
    const orderedHoles = [...pair.holes].sort((a, b) => a.holeNumber - b.holeNumber);
    for (const ph of orderedHoles) {
        if (ph.pointsDelta !== null) running += ph.pointsDelta;
        runningByHole.set(ph.holeNumber, running);
    }
    const matchRow = row(
        'Match',
        (h) => {
            const r = runningByHole.get(h.holeNumber);
            if (r === undefined) return `<td class="status">—</td>`;
            return `<td class="status">${esc(formatRunning(r))}</td>`;
        },
        () => '—',
    );

    const title = `${esc(ballLabel(ballA))} vs. ${esc(ballLabel(ballB))}`;
    const slotFormat = round.formatSlots[pair.slotIndex];
    const slotDescr = slotFormat
        ? `slot #${pair.slotIndex} · ${esc(slotFormat.scoringMode)} × ${esc(slotFormat.teamShape)} @ ${slotFormat.allowancePct}%`
        : `slot #${pair.slotIndex}`;

    const labelA = esc(ballLabel(ballA));
    const labelB = esc(ballLabel(ballB));

    return `
<article class="scorecard-card">
  <header>
    <h3>${title}</h3>
    <span class="muted">
      ${slotDescr} · ${esc(pair.summary)}
    </span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>
      ${parRow}
      ${siRow}
      ${sideBlock(ballA)}
      ${pointsRowForSide('A', labelA)}
      ${runningRowForSide('A', labelA, runningAByHole)}
      ${sideBlock(ballB)}
      ${pointsRowForSide('B', labelB)}
      ${runningRowForSide('B', labelB, runningBByHole)}
      ${statusRow}
      ${matchRow}
    </tbody>
  </table>
</article>`;
}
