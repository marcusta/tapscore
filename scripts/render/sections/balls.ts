// Balls table — one row per ball, with the frozen handicap arithmetic
// (index × slope/113 + (CR − par)) broken out per tee-rating so it is
// hand-verifiable from the snapshot columns.

import type { Tee } from '../../../server/services/tee.service';
import type { BallInfo, BallProducerInfo, RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc, numericCell, short } from '../util';

export function renderBallsTable(
    ctx: RoundRenderContext,
    state: RoundRenderState,
): string {
    const {
        balls,
        teesById,
    } = ctx;
    const {
        effectivePHByBall,
        effectivePHByProducer,
        ballLabel,
        producerName,
        slotForBall,
    } = state;

    const producerKey = (ballId: string, producerDefId: string): string =>
        `${ballId}:${producerDefId}`;

    const arithmeticLinesFor = (
        handicapIndexSnapshot: number | null,
        courseHandicapSnapshot: number | null,
        tee: Tee | null,
    ): { gender: string; arithmetic: string } => {
        if (handicapIndexSnapshot === null || !tee) {
            return { gender: '—', arithmetic: '—' };
        }
        const matchingGenders = new Set(
            tee.ratings
                .filter((r) => {
                    const raw =
                        handicapIndexSnapshot * (r.slope / 113) +
                        (r.courseRating - r.par);
                    return Math.round(raw) === courseHandicapSnapshot;
                })
                .map((r) => r.gender),
        );
        const gender =
            matchingGenders.size === 0
                ? '?'
                : Array.from(matchingGenders).sort().join('/');
        const lines: string[] = [];
        for (const r of tee.ratings) {
            const raw =
                handicapIndexSnapshot * (r.slope / 113) + (r.courseRating - r.par);
            const line =
                `${r.gender}: ${handicapIndexSnapshot} × ${r.slope}/113 + (${r.courseRating} − ${r.par}) = ${raw.toFixed(2)} → ${Math.round(raw)}` +
                (matchingGenders.has(r.gender)
                    ? matchingGenders.size === 1
                        ? ' ← CH'
                        : ' ← matches CH'
                    : '');
            lines.push(
                matchingGenders.has(r.gender)
                    ? `<span class="match">${line}</span>`
                    : line,
            );
        }
        return { gender, arithmetic: lines.join('<br>') };
    };

    const rows = balls.map((b) => {
        // All producers on a ball usually share a tee, but not guaranteed —
        // still report each producer's tee individually. Header-cell tee
        // label uses the first producer's tee as representative.
        const headTee = b.producers[0]?.teeId ? teesById.get(b.producers[0].teeId) ?? null : null;
        const teeLabel = headTee ? headTee.name : (b.producers[0]?.teeNameSnapshot ?? '—');
        const effectivePH = effectivePHByBall.get(b.id);

        const producerSnaps: {
            key: string;
            label: string;
            handicapIndexSnapshot: number | null;
            courseHandicapSnapshot: number | null;
            playingHandicapSnapshot: number | null;
            tee: Tee | null;
            teeName: string | null;
        }[] = b.producers.length > 0
            ? b.producers.map((prod: BallProducerInfo) => {
                  const tee = prod.teeId ? teesById.get(prod.teeId) ?? null : null;
                  return {
                      key: producerKey(b.id, prod.producerDefId),
                      label: producerName(prod),
                      handicapIndexSnapshot: prod.handicapIndexSnapshot,
                      courseHandicapSnapshot: prod.courseHandicapSnapshot,
                      // Per-producer PH isn't frozen on ball_players — we
                      // surface the ball's per-slot PH once below as the
                      // "ball PH" summary. Show the course handicap as
                      // the producer-level snapshot.
                      playingHandicapSnapshot: prod.courseHandicapSnapshot,
                      tee,
                      teeName: prod.teeNameSnapshot,
                  };
              })
            : [
                  {
                      key: b.id,
                      label: ballLabel(b),
                      handicapIndexSnapshot: null,
                      courseHandicapSnapshot: b.courseHandicapSnapshot,
                      playingHandicapSnapshot: null,
                      tee: null,
                      teeName: null,
                  },
              ];

        const genderSet = new Set<string>();
        const arithmeticBlocks = producerSnaps.map((snap) => {
            const { gender, arithmetic } = arithmeticLinesFor(
                snap.handicapIndexSnapshot,
                snap.courseHandicapSnapshot,
                snap.tee,
            );
            if (gender !== '—') genderSet.add(gender);
            if (producerSnaps.length === 1) return arithmetic;
            return `<strong>${esc(snap.label)}</strong><br>${arithmetic}`;
        });
        const snapshotGender =
            genderSet.size === 0 ? '—' : Array.from(genderSet).sort().join('<br>');
        const hIdxCell = producerSnaps
            .map((s) => numericCell(s.handicapIndexSnapshot))
            .join('<br>');
        const chCell = producerSnaps
            .map((s) => numericCell(s.courseHandicapSnapshot))
            .join('<br>');
        const phCell = producerSnaps
            .map((s) => {
                const base = s.playingHandicapSnapshot;
                const adjusted = effectivePHByProducer.get(s.key);
                const effective =
                    adjusted !== undefined
                        ? adjusted
                        : producerSnaps.length === 1 && effectivePH !== undefined
                          ? effectivePH
                          : base;
                if (effective !== undefined && effective !== null && effective !== base) {
                    return `${numericCell(base)} <span class="muted">→ ${numericCell(effective)}</span>`;
                }
                return numericCell(base);
            })
            .join('<br>');

        const slot = slotForBall(b);
        const teamLabelCell = (() => {
            const labels: string[] = [];
            for (const [, label] of b.teamLabelBySlot) labels.push(label);
            return Array.from(new Set(labels)).join(' / ') || '—';
        })();
        const slotSummary = slot ? `#${slot.slotIndex}` : '—';
        return `
<tr>
  <td><code>${esc(short(b.id))}</code></td>
  <td>${esc(b.label ?? '—')}</td>
  <td>${esc(ballLabel(b))}</td>
  <td>${esc(teamLabelCell)}</td>
  <td>${esc(slotSummary)}</td>
  <td>${esc(teeLabel)}</td>
  <td>${snapshotGender}</td>
  <td class="num">${hIdxCell}</td>
  <td class="num">${chCell}</td>
  <td class="num">${phCell}</td>
  <td class="arithmetic">${arithmeticBlocks.join('<br><br>')}</td>
  <td><code>${esc(b.strategyId ?? '—')}</code></td>
</tr>`;
    });
    return `
<section>
  <h2>Balls</h2>
  <table class="grid">
    <thead>
      <tr>
        <th>id</th><th>label</th><th>producers</th><th>team</th><th>slot</th><th>tee (snap)</th>
        <th>gender</th><th>H idx</th><th>CH</th><th>PH</th><th>WHS arithmetic (per rating)</th><th>strategy</th>
      </tr>
    </thead>
    <tbody>${rows.join('')}</tbody>
  </table>
  <p class="hint">CH = round(index × slope/113 + (CR − par)). PH = round(CH × allowancePct/100).</p>
  <p class="hint">Match-play formats normalise PH within each match: the lowest PH plays off 0 and others receive only the difference.</p>
  <p class="hint">Gender is inferred from the tee-rating row(s) whose arithmetic matches the frozen course-handicap snapshot.</p>
  <p class="hint">In the arithmetic column, the line marked <strong>← CH</strong> is the tee-rating row that matches the frozen course-handicap snapshot.</p>
  <p class="hint">Scorecard cells: <code>–</code> = did not play, <code>P</code> = pickup (in the events log; in the Gross row it is resolved to par + 2 + strokes given per WHS net-double).</p>
</section>`;
}
