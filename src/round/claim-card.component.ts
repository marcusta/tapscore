import { Component, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { api, ApiError } from '../api';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { RoundViewService } from './round.service';
import { claimableGuests } from './claim';

// Phase 3 guest-claim affordance. Renders only for a logged-in viewer when
// the round still has unclaimed guest producers (and the viewer isn't already
// a player in it — the server would 409 that double identity). Sits with the
// share card below the score flow, so scoring stays uncluttered.

const tpl = template(`
    <div bind="root" class="claim-card hidden">
        <span class="claim-card__label">Played here as a guest?</span>
        <p class="claim-card__hint">Claim your scores — the round lands on your profile's card.</p>
        <div bind="rows" class="claim-card__rows"></div>
        <p bind="err" class="claim-card__err"></p>
    </div>
`);

const rowTpl = template(`
    <div class="claim-card__row">
        <span bind="name" class="claim-card__name"></span>
        <button bind="claim" class="claim-card__btn" type="button">This is me</button>
    </div>
`);

export class ClaimCardComponent extends Component {
    static styles = `
        .claim-card {
            margin-top: ${s('lg')};
            padding: ${s('lg')};
            ${card()}
            background: ${t('surface-sunken')};

            &.hidden { display: none; }

            & .claim-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${t('text-muted')};
            }
            & .claim-card__hint {
                margin: ${s('sm')} 0 0;
                font-size: 0.8rem;
                color: ${t('text-muted')};
            }
            & .claim-card__rows {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                margin-top: ${s('md')};
            }
            & .claim-card__row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
            }
            & .claim-card__name { font-weight: 600; font-size: 0.95rem; }
            & .claim-card__btn {
                ${btn()}
                padding: ${s('sm')} ${s('lg')};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${t('primary')};
                color: ${t('primary-text')};
                border: none;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .claim-card__err {
                margin: ${s('sm')} 0 0;
                font-size: 0.85rem;
                color: ${t('error')};
                &:empty { display: none; }
            }
        }
    `;

    private svc = this.inject(RoundViewService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private tokenQ = this.router.query('token');
    private claiming = new Signal(false);
    private error = new Signal('');

    private claimable() {
        return claimableGuests(this.svc.balls.get(), this.auth.currentUser.get()?.id ?? null);
    }

    private async claim(guestPlayerId: string): Promise<void> {
        const token = this.tokenQ.get();
        if (!token || this.claiming.get()) return;
        this.error.set('');
        this.claiming.set(true);
        try {
            await api.friendlyRounds.claimGuest({ token, guestPlayerId });
            // Reload the same token: balls refetch with the flipped identity,
            // so the claimed guest drops out of the list (position preserved).
            await this.svc.loadByToken(token);
        } catch (e) {
            this.error.set(
                e instanceof ApiError && e.status === 409
                    ? 'Already claimed — or you already play in this round under your account.'
                    : e instanceof ApiError && e.status === 404
                        ? 'That guest is no longer claimable on this round.'
                        : 'Could not claim right now. Try again.',
            );
        } finally {
            this.claiming.set(false);
        }
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: {
                className: () =>
                    this.claimable().length > 0 ? 'claim-card' : 'claim-card hidden',
            },
            err: { textContent: () => this.error.get() },
        });

        this.$each(
            this.ref(frag, 'rows'),
            () => this.claimable(),
            (g, _i, track) =>
                this.wireEl(
                    rowTpl,
                    {
                        name: () => g.displayName,
                        claim: {
                            disabled: () => this.claiming.get(),
                            onclick: () => void this.claim(g.guestPlayerId),
                        },
                    },
                    track,
                ),
            (g) => g.guestPlayerId,
        );

        return frag;
    }
}
