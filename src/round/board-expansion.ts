// Gamebook-style board expansion — the pure model behind "tap a leaderboard row
// to see that player's scorecard in place".
//
// Two responsibilities, both DOM-free and framework-free so they are testable on
// their own (same shape as `src/app/shell-chrome.ts`):
//
//   1. PLAN — which cards fold into which ranked row, and which cards keep
//      rendering standalone below the board. The classification itself is NOT
//      decided here: it is the structural rule in `result-layout.attachmentFor`
//      (subject ball ids ≡ an entry's ball ids as a set, unambiguous both ways).
//      This module only picks the board the cards are classified AGAINST and
//      turns the verdicts into a lookup the renderer can use.
//
//   2. OPEN STATE — which rows are currently expanded, keyed by the entry's
//      SLOT-SCOPED BALL-ID SIGNATURE rather than its index. A live (SSE) refetch
//      replaces the whole result and can reorder every row; keying by signature
//      is what makes an open card stay open under the same player after the swap.
//
// Nothing here interprets a format id or a scoring rule.

import type { RankedSection, ScoreGridSection, SlotResultView } from '../api/friendly-rounds.gen';
import { attachmentFor } from './result-layout';

/**
 * THE EXPANSION KEY FORMAT — one definition, two clients.
 *
 *     slotDefId + '|' + ballIds.deduped().sorted().join('|')
 *
 * Three properties, each load-bearing:
 *
 *   - ORDER-INSENSITIVE: the same key for `['a','b']` and `['b','a']`, because a
 *     pairing is a SET of balls. Mirrors the normalisation `attachmentFor` uses
 *     internally, so a card the fold called `attached` always finds its row here.
 *   - ATTRIBUTE-SAFE: every character survives a `data-expand-key` round-trip
 *     through the DOM. A control character (NUL, tab, newline) does NOT — the
 *     HTML parser normalises or drops it, and the key read back off the element
 *     no longer equals the key that was written, so every toggle misses.
 *     `tests/round/board-expansion.test.ts` pins that round-trip against a real
 *     element; do not "simplify" the separator back to one.
 *   - SLOT-SCOPED: two boards over the SAME balls (two format slots in one
 *     round) are independent, so expanding a row on one does not expand the twin
 *     row on the other.
 *
 * The native client implements this byte-for-byte in
 * `ios/TapScore/Features/Round/LeaderboardView.swift` (`ScorecardExpansion.key`),
 * where a test pins the literal string. Change one, change both.
 */
export function entryKey(slotDefId: string, ballIds: readonly string[]): string {
    return [slotDefId, ...[...new Set(ballIds)].sort()].join('|');
}

export interface BoardPlan {
    /**
     * The board expansion is classified against — a slot's FIRST ranked section.
     * `null` when the slot has no ranked section (nothing is expandable; every
     * card stays standalone). Renderers compare by IDENTITY: only this exact
     * section gets expandable rows, other ranked sections render as before.
     */
    rankedSection: RankedSection | null;
    /**
     * The slot this plan was built for. Carried so renderers can rebuild an
     * entry's key without threading the slot separately — the key is
     * slot-scoped, so a plan and a slot id are inseparable.
     */
    slotDefId: string;
    /** Slot-scoped entry signature (see `entryKey`) → the one card that folds into that row. */
    attached: ReadonlyMap<string, ScoreGridSection>;
    /** Cards that keep rendering in the card list below, exactly as today. */
    standalone: ScoreGridSection[];
}

const EMPTY_PLAN_CARDS: ReadonlyMap<string, ScoreGridSection> = new Map();

/**
 * Split a slot's cards into "folds into a ranked row" and "stays below".
 *
 * Cards are classified against the slot's first ranked section — the board a
 * reader is looking at. Shared/team/match cards whose subject spans more than
 * one ranked entry (a match card covers BOTH sides) fail the structural rule and
 * stay standalone, which is the intended Gamebook behaviour.
 */
export function planBoard(slot: SlotResultView): BoardPlan {
    const cards = slot.cards ?? [];
    const ranked = (slot.leaderboard ?? []).find((s): s is RankedSection => s.kind === 'ranked') ?? null;
    if (!ranked) {
        return {
            rankedSection: null,
            slotDefId: slot.slotDefId,
            attached: EMPTY_PLAN_CARDS,
            standalone: [...cards],
        };
    }

    const verdicts = attachmentFor(cards, ranked.entries);
    const attached = new Map<string, ScoreGridSection>();
    const standalone: ScoreGridSection[] = [];
    cards.forEach((card, index) => {
        const verdict = verdicts[index];
        const entry = verdict?.kind === 'attached' ? ranked.entries[verdict.entryIndex] : undefined;
        if (!entry) {
            standalone.push(card);
            return;
        }
        attached.set(entryKey(slot.slotDefId, entry.ballIds), card);
    });
    return { rankedSection: ranked, slotDefId: slot.slotDefId, attached, standalone };
}

/**
 * Which rows are expanded. Deliberately NOT a signal: the component mutates the
 * DOM directly on a toggle (so the height transition plays instead of the board
 * being re-rendered from scratch), and re-reads this state on the next real
 * re-render — an SSE refetch — to restore what was open. A signal here would
 * re-render the board on every tap and kill both the animation and the scroll
 * position.
 */
export class ExpansionState {
    private readonly open = new Set<string>();

    isOpen(key: string): boolean {
        return this.open.has(key);
    }

    /** Flip one row. Returns the NEW open state so a caller can drive the DOM. */
    toggle(key: string): boolean {
        return this.set(key, !this.open.has(key));
    }

    set(key: string, open: boolean): boolean {
        if (open) this.open.add(key);
        else this.open.delete(key);
        return open;
    }

    /** Snapshot, for tests and diagnostics. */
    keys(): string[] {
        return [...this.open].sort();
    }

    /**
     * Drop remembered keys that no longer exist on the board (a ball left the
     * round). Optional hygiene — a stale key is inert, it simply matches nothing.
     */
    retain(live: Iterable<string>): void {
        const keep = new Set(live);
        for (const key of [...this.open]) if (!keep.has(key)) this.open.delete(key);
    }
}
