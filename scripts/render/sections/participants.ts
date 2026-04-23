// Participants table — one row per participant, with the frozen handicap
// arithmetic (index × slope/113 + (CR − par)) broken out per tee-rating
// so it is hand-verifiable from the snapshot columns.

import type { Participant } from '../../../server/services/participant.service';
import type { Tee } from '../../../server/services/tee.service';
import type { RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc, numericCell, short } from '../util';

export function renderParticipantsTable(
    ctx: RoundRenderContext,
    state: RoundRenderState,
): string {
    const { participants, teesById, playersById, guestsById } = ctx;
    const { effectivePHByParticipant, effectivePHByLinkId, participantLabel } = state;

    const linkLabel = (link: Participant['players'][number]): string => {
        if (link.playerId) {
            return playersById.get(link.playerId)?.displayName ?? `player:${short(link.playerId)}`;
        }
        if (link.guestPlayerId) {
            const g = guestsById.get(link.guestPlayerId);
            return g ? `${g.displayName} (guest)` : `guest:${short(link.guestPlayerId)}`;
        }
        return '?';
    };

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

    const rows = participants.map((p) => {
        const tee = p.teeIdSnapshot ? (teesById.get(p.teeIdSnapshot) ?? null) : null;
        const teeLabel = tee ? tee.name : '—';
        const effectivePH = effectivePHByParticipant.get(p.id);
        const linkSnapshots =
            p.players.length > 0
                ? p.players.map((link) => ({
                      id: link.id,
                      label: linkLabel(link),
                      handicapIndexSnapshot:
                          link.handicapIndexSnapshot ??
                          (p.players.length === 1 ? p.handicapIndexSnapshot : null),
                      courseHandicapSnapshot:
                          link.courseHandicapSnapshot ??
                          (p.players.length === 1 ? p.courseHandicapSnapshot : null),
                      playingHandicapSnapshot:
                          link.playingHandicapSnapshot ??
                          (p.players.length === 1 ? p.playingHandicapSnapshot : null),
                  }))
                : [
                      {
                          id: p.id,
                          label: participantLabel(p),
                          handicapIndexSnapshot: p.handicapIndexSnapshot,
                          courseHandicapSnapshot: p.courseHandicapSnapshot,
                          playingHandicapSnapshot: p.playingHandicapSnapshot,
                      },
                  ];
        const genderSet = new Set<string>();
        const arithmeticBlocks = linkSnapshots.map((linkSnap) => {
            const { gender, arithmetic } = arithmeticLinesFor(
                linkSnap.handicapIndexSnapshot,
                linkSnap.courseHandicapSnapshot,
                tee,
            );
            if (gender !== '—') genderSet.add(gender);
            if (linkSnapshots.length === 1) return arithmetic;
            return `<strong>${esc(linkSnap.label)}</strong><br>${arithmetic}`;
        });
        const snapshotGender =
            genderSet.size === 0 ? '—' : Array.from(genderSet).sort().join('<br>');
        const hIdxCell = linkSnapshots
            .map((linkSnap) => numericCell(linkSnap.handicapIndexSnapshot))
            .join('<br>');
        const chCell = linkSnapshots
            .map((linkSnap) => numericCell(linkSnap.courseHandicapSnapshot))
            .join('<br>');
        const phCell = linkSnapshots
            .map((linkSnap) => {
                const base = linkSnap.playingHandicapSnapshot;
                const adjusted = p.players.length > 0
                    ? effectivePHByLinkId.get(linkSnap.id) ?? undefined
                    : undefined;
                const effective =
                    adjusted ??
                    (linkSnapshots.length === 1 && effectivePH !== undefined
                        ? effectivePH
                        : base);
                if (effective !== undefined && effective !== base) {
                    return `${numericCell(base)} <span class="muted">→ ${numericCell(effective)}</span>`;
                }
                return numericCell(base);
            })
            .join('<br>');
        return `
<tr>
  <td><code>${esc(short(p.id))}</code></td>
  <td>${esc(participantLabel(p))}</td>
  <td>${esc(p.teamLabel ?? '—')}</td>
  <td>${esc(p.categorySnapshot ?? '—')}</td>
  <td>${esc(teeLabel)}</td>
  <td>${snapshotGender}</td>
  <td class="num">${hIdxCell}</td>
  <td class="num">${chCell}</td>
  <td class="num">${phCell}</td>
  <td class="arithmetic">${arithmeticBlocks.join('<br><br>')}</td>
  <td>${p.isLocked ? '🔒' : ''} ${p.isDq ? 'DQ' : ''}</td>
</tr>`;
    });
    return `
<section>
  <h2>Participants</h2>
  <table class="grid">
    <thead>
      <tr>
        <th>id</th><th>players</th><th>team</th><th>category</th><th>tee (snap)</th>
        <th>gender</th><th>H idx</th><th>CH</th><th>PH</th><th>WHS arithmetic (per rating)</th><th>flags</th>
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
