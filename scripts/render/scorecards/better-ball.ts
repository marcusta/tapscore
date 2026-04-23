// Better-ball scorecard: 4 rows per player (Given / Gross / Net / Points)
// plus 1 team Points row. Reads raw per-player scorecard rows from the
// team participant's scorecard, runs the same stableford primitives the
// strategy uses (`stablefordOutcome`), and emits the team row from the
// already-computed `result`.

import type { Participant } from '../../../server/services/participant.service';
import type { ScorecardHole } from '../../../server/services/scorecard.service';
import type { CourseHole } from '../../../server/domain/format';
import {
    stablefordOutcome,
    type StablefordHoleOutcome,
} from '../../../server/domain/formats/_stableford-scoring';
import type { ParticipantResult, RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc, netCell, splitHoleGroups, strokesCell, strokesGivenMap } from '../util';

export function renderBetterBallScorecard(
    ctx: RoundRenderContext,
    state: RoundRenderState,
    result: ParticipantResult,
    p: Participant,
    courseHoles: CourseHole[],
): string {
    const { round } = ctx;
    const {
        allCourseHoles,
        participantLabel,
        playerLinkLabel,
        playerPhSummary,
        scorecardByParticipant,
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

    // Per-player sub-rows. Each player's strokes-given map is based on
    // their own frozen PH on the link row, with a team-PH fallback for
    // legacy rows that predate per-link snapshots.
    const playerBlocks = p.players.map((link) => {
        const name = playerLinkLabel(link);
        const playerPh = link.playingHandicapSnapshot ?? p.playingHandicapSnapshot ?? 0;
        const strokesGiven = strokesGivenMap(playerPh, allCourseHoles);
        // Source filter: pick this player's rows from the flat list.
        const playerRows: ScorecardHole[] = allRows.filter((h) => {
            if (link.playerId) return h.sourcePlayerId === link.playerId;
            if (link.guestPlayerId) return h.sourceGuestPlayerId === link.guestPlayerId;
            return false;
        });
        const playerRowByHole = new Map<number, ScorecardHole>();
        for (const r of playerRows) playerRowByHole.set(r.holeNumber, r);

        // Per-hole stableford outcomes for this player.
        const outcomeByHole = new Map<number, StablefordHoleOutcome>();
        for (const ch of allCourseHoles) {
            const row = playerRowByHole.get(ch.holeNumber);
            const strokes = row === undefined ? undefined : row.strokes;
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
                // "pickup" shows P; "dnp" and "no_event" show dash; scored shows gross.
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
                // Tooltip: per-player arithmetic.
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

    // Team points row — uses the strategy's already-computed values.
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

    // Per-hole arithmetic line — team's chosen points + each player's share.
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
    <h3>${esc(participantLabel(p))}</h3>
    <span class="muted">
      slot #${result.slotIndex} · ${esc(slotFormat?.scoringMode ?? '')} × ${esc(slotFormat?.teamShape ?? '')} · ${playerPhSummary(p)} · holes played ${result.holesPlayed}
    </span>
  </header>
  <table class="scorecard">
    <thead>${holeHeader}</thead>
    <tbody>
      ${parRow}
      ${siRow}
      ${playerBlocks.join('')}
      ${teamRow}
    </tbody>
  </table>
  ${arithmetic}
  <ul class="totals">${totalsRow}</ul>
</article>`;
}
