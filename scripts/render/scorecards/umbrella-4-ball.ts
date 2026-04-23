// Umbrella 4-ball scorecard: per-player Gross + GIR sub-rows, then a
// team category matrix row per hole (LG / LT / GA / GB / B), then a
// team Points row with sweep badge. Category matrix cells show ✓ / ½ /
// — for each category, compact but legible. The team LT (2-ball total)
// lives as the team's gross column (set by the strategy).

import type { Participant } from '../../../server/services/participant.service';
import type { ScorecardHole } from '../../../server/services/scorecard.service';
import type { CourseHole } from '../../../server/domain/format';
import type { ParticipantResult, RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc, numericCell, splitHoleGroups, strokesCell } from '../util';

export function renderUmbrellaScorecard(
    ctx: RoundRenderContext,
    state: RoundRenderState,
    result: ParticipantResult,
    p: Participant,
    courseHoles: CourseHole[],
): string {
    const { round } = ctx;
    const {
        normalizedRunningByParticipant,
        participantLabel,
        playerLinkLabel,
        playerPhSummary,
        scorecardByParticipant,
        umbrellaBirdieRuleFor,
    } = state;

    const groups = splitHoleGroups(courseHoles);
    const includeTotColumn = groups.length > 1;

    const teamByHole = new Map(result.holes.map((h) => [h.holeNumber, h]));
    const scorecard = scorecardByParticipant.get(p.id);
    const allRows = scorecard?.holes ?? [];

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

    const playerBlocks = p.players.map((link) => {
        const name = playerLinkLabel(link);
        const playerRows: ScorecardHole[] = allRows.filter((hole) => {
            if (link.playerId) return hole.sourcePlayerId === link.playerId;
            if (link.guestPlayerId) return hole.sourceGuestPlayerId === link.guestPlayerId;
            return false;
        });
        const byHole = new Map<number, ScorecardHole>();
        for (const r of playerRows) byHole.set(r.holeNumber, r);

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
        const girRow = row(
            `${esc(name)} GIR`,
            (h) => {
                const r = byHole.get(h.holeNumber);
                const gir = r?.metadata?.gir === true;
                return `<td class="given">${gir ? '✓' : ''}</td>`;
            },
            (holes) => {
                let count = 0;
                for (const h of holes) {
                    const r = byHole.get(h.holeNumber);
                    if (r?.metadata?.gir === true) count++;
                }
                return count > 0 ? String(count) : '—';
            },
            'dim',
        );
        return [grossRow, girRow].join('');
    });

    // Team LT (gross) row — 2-ball total per hole, drawn from the
    // strategy's `HoleResult.gross` (which Umbrella sets to the LT team
    // total when computable, null otherwise).
    const teamLtRow = row(
        'Team LT',
        (h) => {
            const hr = teamByHole.get(h.holeNumber);
            return `<td>${hr?.gross ?? '—'}</td>`;
        },
        (holes) => {
            let total = 0;
            let any = false;
            for (const h of holes) {
                const hr = teamByHole.get(h.holeNumber);
                if (hr?.gross != null) {
                    total += hr.gross;
                    any = true;
                }
            }
            return any ? String(total) : '—';
        },
    );

    // Category matrix row — parse the per-hole `note` which carries
    // the breakdown produced by the strategy. The note format is:
    //   "LG 1 + LT 1 + GIR-A 1 + BIRD 1 = 4 × 3 = 12 (p:abc=3, p:def=4)"
    // or "LG 0.5 + LT 0.5 = 1.0 × 5 = 5 (..)"
    // We extract each category's value; empty values render as "—".
    const catMatrixRow = row(
        'Cat (LG/LT/GA/GB/B)',
        (h) => {
            const hr = teamByHole.get(h.holeNumber);
            if (!hr) return `<td class="given">—</td>`;
            const note = hr.note ?? '';
            const cell = (key: string): string => {
                // `LG 1` / `LT 0.5` / `GIR-A 1` / `GIR-B 1` / `BIRD 1`
                const re = new RegExp(`${key}\\s+([0-9]*\\.?[0-9]+)`);
                const m = note.match(re);
                if (!m) return '—';
                const v = Number(m[1]);
                if (v === 0) return '—';
                if (v === 1) return '✓';
                if (v === 0.5) return '½';
                return m[1];
            };
            const compact = `${cell('LG')}${cell('LT')}${cell('GIR-A')}${cell('GIR-B')}${cell('BIRD')}`;
            return `<td class="arithmetic" title="${esc(note)}">${compact}</td>`;
        },
        () => '—',
        'dim',
    );

    // Team Points row with sweep badge.
    const teamPointsRow = row(
        'Team Points',
        (h) => {
            const hr = teamByHole.get(h.holeNumber);
            if (!hr || hr.points == null) return '<td>—</td>';
            const sweep = hr.note?.includes('☂') ?? false;
            const badge = sweep ? ' ☂' : '';
            return `<td title="${esc(hr.note ?? '')}"><strong>${hr.points}${badge}</strong></td>`;
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

    const runningByHole = normalizedRunningByParticipant.get(p.id);
    const runningRow = runningByHole
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

    // Per-hole arithmetic line under the card for hand verification.
    const annotatedHoles = result.holes.filter((h) => h.note && h.points !== null && h.points !== 0);
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
    const umbrellaHeader =
        slotFormat
            ? `slot #${result.slotIndex} · ${esc(slotFormat.scoringMode)} × ${esc(slotFormat.teamShape)} @ ${slotFormat.allowancePct}% · birdieRule ${esc(umbrellaBirdieRuleFor(slotFormat) ?? 'gross')}`
            : `slot #${result.slotIndex}`;

    return `
<article class="scorecard-card">
  <header>
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      ${umbrellaHeader} · ${playerPhSummary(p)} · holes played ${result.holesPlayed}
    </span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>
      ${parRow}
      ${siRow}
      ${playerBlocks.join('')}
      ${teamLtRow}
      ${catMatrixRow}
      ${teamPointsRow}
      ${runningRow}
    </tbody>
  </table>
  ${arithmetic}
  <ul class="totals">${totalsRow}</ul>
</article>`;
}
