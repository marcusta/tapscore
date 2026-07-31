// One round on a friend's profile — the row shared by the profile card's
// short list and the see-all page, so the two cannot drift in what a round
// row says about someone else's score. Markup + bindings + a CSS snippet, the
// same non-Component shape as `avatar-badge.ts` and for the same reason: the
// rows live inside `$each` lists.

import { template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import type { FriendProfileRoundEntry } from '../api/friend-profile.gen';
import { formatRowDate } from '../landing/rows';
import { roundProgress, roundSubtitle, roundTitle } from './friend-profile-model';

export const friendRoundRowTpl = template(`
    <button bind="row" type="button" class="fr-row">
        <span class="fr-row__text">
            <span bind="title" class="fr-row__title"></span>
            <span bind="subtitle" class="fr-row__subtitle"></span>
        </span>
        <span bind="progress" class="fr-row__progress"></span>
    </button>
`);

/** Bindings for one row. `onOpen` gets the round id — navigation goes by id
 *  through the session-scoped spectate path; no share token exists to pass. */
export function friendRoundRowBindings(entry: FriendProfileRoundEntry, onOpen: (roundId: string) => void) {
    return {
        row: { onclick: () => onOpen(entry.roundId) },
        title: () => roundTitle(entry),
        subtitle: () => roundSubtitle(entry, formatRowDate),
        progress: () => roundProgress(entry),
    };
}

/** The row's styling, interpolated into a component's styles under its own
 *  scope (the row itself is a full-width borderless button; the CARD around a
 *  list of rows belongs to the host). */
export function friendRoundRowCss(): string {
    return `
        & .fr-row {
            display: flex; align-items: center; gap: ${s('md')};
            width: 100%;
            padding: ${s('md')} ${s('lg')};
            background: none; border: none; border-bottom: 1px solid ${t('border')};
            font-family: inherit; text-align: left; cursor: pointer;

            &:hover { background: ${t('hover-bg')}; }

            & .fr-row__text {
                flex: 1; min-width: 0;
                display: flex; flex-direction: column; gap: 1px;
            }
            & .fr-row__title {
                font-weight: 600; font-size: 1rem; color: ${t('text')};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .fr-row__subtitle {
                color: ${t('text-muted')}; font-size: 0.8rem;
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .fr-row__progress {
                flex-shrink: 0; font-size: 0.85rem; font-weight: 700;
                color: ${t('accent')};
            }
        }
    `;
}
