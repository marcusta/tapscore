import type { LandingRow } from './rows';

/**
 * The single destructive action a personal-round list may offer.
 *
 * Delete is for the authenticated creator only. A participant in somebody
 * else's round gets the self-scoped alternative instead. Device-local and
 * wrapper-less rows deliberately expose neither: the server cannot safely
 * identify "me" or a round to act on.
 */
export type RoundListAction = 'delete' | 'leave' | null;

export function roundListAction(
    row: Pick<LandingRow, 'token' | 'created' | 'played'>,
): RoundListAction {
    if (row.token === null) return null;
    if (row.created) return 'delete';
    return row.played ? 'leave' : null;
}

export function roundListActionLabel(action: Exclude<RoundListAction, null>): string {
    return action === 'delete' ? 'Delete round' : 'Remove me from this round';
}
