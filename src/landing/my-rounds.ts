import type { DashboardRoundEntry } from '../api/dashboard.gen';
import type { FriendlyRound, Round } from '../api/friendly-rounds.gen';

// Phase 3 "My rounds" — pure merge of the two dashboard halves into one
// deduped landing list. `produced` (rounds the player holds a ball in) and
// `created` (friendly rounds the player minted) overlap when the creator also
// plays; the landing shows each round ONCE with its combined role.

export interface MyRoundEntry {
    round: Round;
    /** Share token for navigation. Produced entries don't carry the friendly
     * wrapper, so the token is joined from `created` or the public rounds
     * list; null when the round has no reachable friendly wrapper (the row
     * renders but can't navigate). */
    token: string | null;
    played: boolean;
    created: boolean;
}

/** Human role tag for a merged entry ("Played", "Created", "Played · Created"). */
export function roleLabel(e: Pick<MyRoundEntry, 'played' | 'created'>): string {
    const parts = [...(e.played ? ['Played'] : []), ...(e.created ? ['Created'] : [])];
    return parts.join(' · ');
}

/**
 * Merge `dashboard.myRounds` into one list, newest first.
 *
 * - Deduped by `round.id`; a round both created and played keeps both flags.
 * - Tokens come from `created` entries directly; produced-only rounds join
 *   against `allRounds` (the landing's public friendly-round list) by round id.
 * - Order: date descending, then round id for a stable tie-break.
 */
export function buildMyRounds(
    produced: readonly Pick<DashboardRoundEntry, 'round'>[],
    created: readonly { friendlyRound: FriendlyRound; round: Round }[],
    allRounds: readonly { friendlyRound: FriendlyRound; round: Round }[] = [],
): MyRoundEntry[] {
    const tokenByRoundId = new Map<string, string>();
    for (const item of allRounds) {
        tokenByRoundId.set(item.round.id, item.friendlyRound.shareToken);
    }
    const byId = new Map<string, MyRoundEntry>();
    for (const item of created) {
        byId.set(item.round.id, {
            round: item.round,
            token: item.friendlyRound.shareToken,
            played: false,
            created: true,
        });
    }
    for (const item of produced) {
        const existing = byId.get(item.round.id);
        if (existing) {
            existing.played = true;
        } else {
            byId.set(item.round.id, {
                round: item.round,
                token: tokenByRoundId.get(item.round.id) ?? null,
                played: true,
                created: false,
            });
        }
    }
    return [...byId.values()].sort(
        (a, b) =>
            b.round.date.localeCompare(a.round.date) || a.round.id.localeCompare(b.round.id),
    );
}
