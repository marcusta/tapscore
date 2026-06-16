import { Component, Computed, Router, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { RoundViewService } from './round.service';
import { ScoreEntryComponent } from './score-entry.component';
import { formatLabelFromSlot } from '../rounds/slot-labels';

const tpl = template(`
    <div class="round-view">
        <button bind="back" class="round-view__back" type="button">← Rounds</button>
        <div bind="notfound" class="round-view__notfound">That share link didn't lead to a round.</div>
        <div bind="body" class="round-view__body">
            <header class="round-view__head">
                <h1 bind="course"></h1>
                <span bind="status" class="round-view__status"></span>
            </header>
            <div class="round-view__meta">
                <span bind="date"></span>
                <span bind="route"></span>
            </div>
            <div class="round-view__formats" bind="formats"></div>

            <div bind="scoring"></div>

            <div class="round-view__share">
                <span class="round-view__share-label">Share this round</span>
                <div class="round-view__share-row">
                    <input bind="shareUrl" class="round-view__share-url" readonly />
                    <button bind="copy" class="round-view__copy" type="button">Copy</button>
                </div>
                <p class="round-view__share-hint">Anyone with this link can open and score — no sign-in.</p>
            </div>
        </div>
    </div>
`);

export class RoundComponent extends Component {
    static styles = `
        .round-view {
            padding: ${s('lg')} ${s('lg')} ${s('2xl')};

            & .round-view__back {
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 600;
                color: ${t('text-muted')};
                cursor: pointer;
                padding: ${s('xs')} 0;
                margin-bottom: ${s('md')};
            }

            & .round-view__notfound {
                color: ${t('text-muted')};
                padding: ${s('xl')} 0;

                &.hidden { display: none; }
            }

            & .round-view__body.hidden { display: none; }

            & .round-view__head {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                gap: ${s('md')};

                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.8rem;
                    letter-spacing: -0.02em;
                    color: ${t('text')};
                }
            }

            & .round-view__status {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                border-radius: ${t('radius-pill')};
                padding: 2px 10px;
                flex-shrink: 0;
                background: ${t('accent-soft')};
                color: ${t('accent')};
            }

            & .round-view__meta {
                display: flex;
                gap: ${s('md')};
                margin-top: ${s('xs')};
                color: ${t('text-muted')};
                font-size: 0.9rem;
            }

            & .round-view__formats {
                margin-top: ${s('lg')};
                display: flex;
                flex-wrap: wrap;
                gap: ${s('sm')};

                & .fmt {
                    ${card()}
                    padding: ${s('xs')} ${s('md')};
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: ${t('text')};
                }
            }

            & .round-view__share {
                margin-top: ${s('2xl')};
                padding: ${s('lg')};
                ${card()}
                background: ${t('surface-sunken')};

                & .round-view__share-label {
                    font-weight: 700;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: ${t('text-muted')};
                }
                & .round-view__share-row {
                    display: flex;
                    gap: ${s('sm')};
                    margin-top: ${s('sm')};
                }
                & .round-view__share-url {
                    flex: 1;
                    ${input()}
                    font-size: 0.8rem;
                    color: ${t('text-muted')};
                }
                & .round-view__copy {
                    ${btn()}
                    padding: 0 ${s('lg')};
                    font-weight: 700;
                    background: ${t('primary')};
                    color: ${t('primary-text')};
                    border: none;
                }
                & .round-view__share-hint {
                    margin: ${s('sm')} 0 0;
                    font-size: 0.8rem;
                    color: ${t('text-muted')};
                }
            }
        }
    `;

    private svc = this.inject(RoundViewService);
    private router = this.inject(Router);
    private tokenQ = this.router.query('token');

    private hasRound = new Computed(() => this.svc.round.get() !== null);

    private shareUrl = new Computed(() => {
        const token = this.tokenQ.get();
        return token ? `${location.origin}/round?token=${token}` : '';
    });

    render(): DocumentFragment {
        this.track(
            effect(() => {
                const token = this.tokenQ.get();
                if (token) void this.svc.loadByToken(token);
            }),
        );

        const statusText: Record<string, string> = {
            not_started: 'Not started',
            active: 'Live',
            complete: 'Done',
        };

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/') },
            notfound: {
                className: () =>
                    !this.hasRound.get() && !this.svc.loading.get()
                        ? 'round-view__notfound'
                        : 'round-view__notfound hidden',
            },
            body: {
                className: () =>
                    this.hasRound.get() ? 'round-view__body' : 'round-view__body hidden',
            },
            course: () => this.svc.round.get()?.courseNameSnapshot ?? 'Round',
            status: () => {
                const st = this.svc.round.get()?.status ?? 'not_started';
                return statusText[st] ?? st;
            },
            date: () => this.svc.round.get()?.date ?? '',
            route: () => {
                const r = this.svc.round.get();
                return r ? `${r.playHoles.length} holes` : '';
            },
            formats: {
                innerHTML: () =>
                    (this.svc.round.get()?.formatSlots ?? [])
                        .map((slot) => `<span class="fmt">${formatLabelFromSlot(slot)}</span>`)
                        .join(''),
            },
            shareUrl: { value: () => this.shareUrl.get() },
            copy: {
                onclick: () => void navigator.clipboard?.writeText(this.shareUrl.get()),
            },
        });

        // The trust-based score-entry experience (carousel + keypad). It hides
        // itself until the round has balls to score.
        this.spawn(ScoreEntryComponent, this.ref(frag, 'scoring'));

        return frag;
    }
}
