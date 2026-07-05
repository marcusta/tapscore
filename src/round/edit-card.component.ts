import { Component, Router, Signal, template } from '@basics/core/client/core';
import { api } from '../api';
import { t } from '../theme';
import { s, btn, card } from '../css';

// Phase 3.5 edit-round affordance. Sits with the share card below the score
// flow (matching the round view's visual language) and self-hides unless the
// server's no-auth `setup()` says the round is editable — a not-started or
// active round that originated from a setup draft. Tapping it navigates to the
// create flow in edit mode (`/create?token=<token>`), which loads the stored
// draft and prefills every control. A complete round returns non-editable, so
// the affordance never shows there (and the server refuses the edit anyway).

const tpl = template(`
    <div bind="root" class="edit-card hidden">
        <div class="edit-card__text">
            <span class="edit-card__label">Round setup</span>
            <p class="edit-card__hint">Change tees, add a format, adjust groups — scored balls are preserved.</p>
        </div>
        <button bind="edit" class="edit-card__btn" type="button">Edit round</button>
    </div>
`);

export class EditCardComponent extends Component {
    static styles = `
        .edit-card {
            margin-top: ${s('lg')};
            padding: ${s('lg')};
            ${card()}
            background: ${t('surface-sunken')};
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${s('md')};

            &.hidden { display: none; }

            & .edit-card__text { min-width: 0; }
            & .edit-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${t('text-muted')};
            }
            & .edit-card__hint {
                margin: ${s('xs')} 0 0;
                font-size: 0.8rem;
                color: ${t('text-muted')};
            }
            & .edit-card__btn {
                ${btn()}
                flex-shrink: 0;
                padding: ${s('sm')} ${s('lg')};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${t('primary')};
                color: ${t('primary-text')};
                border: none;
            }
        }
    `;

    private router = this.inject(Router);
    private tokenQ = this.router.query('token');
    /** True once `setup()` confirms the round is editable for this token. */
    private editable = new Signal(false);

    render(): DocumentFragment {
        // Ask the server whether this round is editable. Any failure (unknown
        // token, network) simply leaves the affordance hidden — it is purely
        // additive, never blocking the round view.
        const token = this.tokenQ.get();
        if (token) {
            void api.friendlyRounds
                .setup({ token })
                .then((r) => this.editable.set(r.editable === true))
                .catch(() => this.editable.set(false));
        }

        return this.wire(tpl, {
            root: { className: () => (this.editable.get() ? 'edit-card' : 'edit-card hidden') },
            edit: {
                onclick: () => {
                    const tk = this.tokenQ.get();
                    if (tk) this.router.navigate('/create', { query: { token: tk } });
                },
            },
        });
    }
}
