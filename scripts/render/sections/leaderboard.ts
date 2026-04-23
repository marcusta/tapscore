// Leaderboard section — per-slot scoring-type buckets + per-slot pair
// result tables. Handles the orphan case where a pair-only slot (pure
// match-play) has no scoring-type bucket to attach to.

import type { RoundRenderContext } from '../types';
import type { RoundRenderState } from '../round-state';
import { esc, short } from '../util';
import { formatSlotSummary } from '../index-page';

export function renderLeaderboard(
    ctx: RoundRenderContext,
    state: RoundRenderState,
): string {
    const { round, participants, leaderboard } = ctx;
    const { participantLabel, isTalibanSlot } = state;

    const participantName = (id: string) => {
        const p = participants.find((x) => x.id === id);
        return p ? participantLabel(p) : short(id);
    };

    // Group scoring-type buckets by slot so multi-slot rounds render as
    // one sub-section per slot (each with its own format sub-header and
    // one-or-more scoring-type columns). Single-slot rounds still get
    // the sub-header — it's cheap information, worth keeping consistent.
    const bucketsBySlot = new Map<number, typeof leaderboard.byScoringType>();
    for (const bucket of leaderboard.byScoringType) {
        const arr = bucketsBySlot.get(bucket.slotIndex) ?? [];
        arr.push(bucket);
        bucketsBySlot.set(bucket.slotIndex, arr);
    }

    const renderBucket = (b: (typeof leaderboard.byScoringType)[number]): string => {
        const rows = b.entries.map(
            (e) => `
<tr>
  <td class="num">${e.position}</td>
  <td>${esc(participantName(e.participantId))}</td>
  <td class="num">${e.total ?? '—'}</td>
  <td class="num muted">${e.holesPlayed}</td>
</tr>`,
        );
        return `
<div class="lb-col">
  <h4>${esc(b.scoringType)}</h4>
  <table class="grid">
    <thead><tr><th>pos</th><th>participant</th><th>total</th><th>holes</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>
</div>`;
    };

    // Emit per-slot sub-sections in slotIndex order.
    const slotIndices = [...bucketsBySlot.keys()].sort((a, b) => a - b);
    const slotSections = slotIndices.map((slotIndex) => {
        const slot = round.formatSlots[slotIndex];
        const header = slot
            ? `Slot #${slot.slotIndex} · ${esc(formatSlotSummary(slot))}`
            : `Slot #${slotIndex}`;
        const cols = (bucketsBySlot.get(slotIndex) ?? []).map(renderBucket).join('');
        // Per-slot pair-results subsection — only the pairs whose
        // `slotIndex` matches. Taliban today is single-slot, so it falls
        // naturally into its slot's section.
        const slotPairs = leaderboard.pairResults.filter((pr) => pr.slotIndex === slotIndex);
        const slotIsTaliban = isTalibanSlot(slot);
        const pairSection = slotPairs.length > 0
            ? (() => {
                  const rows = slotPairs.map((pr) => {
                      const a = participantName(pr.participants[0]);
                      const b = participantName(pr.participants[1]);
                      let line: string;
                      if (slotIsTaliban) {
                          line = esc(pr.summary);
                      } else if (pr.result === 'won') {
                          const winnerName = pr.winner === pr.participants[0] ? a : b;
                          const loserName = pr.winner === pr.participants[0] ? b : a;
                          line = `${esc(winnerName)} d. ${esc(loserName)}, ${esc(pr.summary)}`;
                      } else if (pr.result === 'lost') {
                          line = `${esc(b)} d. ${esc(a)}, ${esc(pr.summary)}`;
                      } else if (pr.result === 'halved') {
                          // Golf idiom: unresolved matches use "vs." — resolved
                          // results use "d." (defeated) or "& k" shorthand.
                          line = `${esc(a)} vs. ${esc(b)} halved, ${esc(pr.summary)}`;
                      } else {
                          line = `${esc(a)} vs. ${esc(b)}, ${esc(pr.summary)} (in progress)`;
                      }
                      return `<tr><td>${line}</td></tr>`;
                  });
                  return `
<div class="lb-col" style="min-width: 420px;">
  <h4>Match results</h4>
  <table class="grid">
    <thead><tr><th>result</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>
</div>`;
              })()
            : '';
        return `
<div class="lb-slot">
  <h3>${header}</h3>
  <div class="lb-row">${cols}${pairSection}</div>
</div>`;
    });

    // Catch-all for pair-results whose slot didn't emit any scoring-type
    // bucket (pure match-play slots emit empty `totals` arrays — they
    // appear in `pairResults` only, so their slotIndex never makes it
    // into `bucketsBySlot`). Render them under their own slot header.
    const orphanedPairSlots = [
        ...new Set(
            leaderboard.pairResults
                .filter((pr) => !bucketsBySlot.has(pr.slotIndex))
                .map((pr) => pr.slotIndex),
        ),
    ].sort((a, b) => a - b);
    const orphanedPairSections = orphanedPairSlots.map((slotIndex) => {
        const slot = round.formatSlots[slotIndex];
        const header = slot
            ? `Slot #${slot.slotIndex} · ${esc(formatSlotSummary(slot))}`
            : `Slot #${slotIndex}`;
        const slotPairs = leaderboard.pairResults.filter((pr) => pr.slotIndex === slotIndex);
        const slotIsTaliban = isTalibanSlot(slot);
        const rows = slotPairs.map((pr) => {
            const a = participantName(pr.participants[0]);
            const b = participantName(pr.participants[1]);
            let line: string;
            if (slotIsTaliban) {
                line = esc(pr.summary);
            } else if (pr.result === 'won') {
                const winnerName = pr.winner === pr.participants[0] ? a : b;
                const loserName = pr.winner === pr.participants[0] ? b : a;
                line = `${esc(winnerName)} d. ${esc(loserName)}, ${esc(pr.summary)}`;
            } else if (pr.result === 'lost') {
                line = `${esc(b)} d. ${esc(a)}, ${esc(pr.summary)}`;
            } else if (pr.result === 'halved') {
                line = `${esc(a)} vs. ${esc(b)} halved, ${esc(pr.summary)}`;
            } else {
                line = `${esc(a)} vs. ${esc(b)}, ${esc(pr.summary)} (in progress)`;
            }
            return `<tr><td>${line}</td></tr>`;
        });
        return `
<div class="lb-slot">
  <h3>${header}</h3>
  <div class="lb-row">
    <div class="lb-col" style="min-width: 420px;">
      <h4>Match results</h4>
      <table class="grid">
        <thead><tr><th>result</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>
  </div>
</div>`;
    });

    return `
<section>
  <h2>Leaderboard</h2>
  ${slotSections.join('')}${orphanedPairSections.join('')}
</section>`;
}
