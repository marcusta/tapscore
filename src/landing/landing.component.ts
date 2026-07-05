import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { LandingService } from './landing.service';
import { landingRows, type LandingRow } from './rows';
import { partitionRounds, type Partitioned } from './partition';

const tpl = template(`
    <div class="landing">
        <header class="landing__head">
            <div class="landing__flag">⛳</div>
            <h1>tapscore</h1>
            <p>Scores, settled on the green. No sign-in needed.</p>
        </header>
        <button bind="createBtn" class="landing__create" type="button">
            <span class="landing__create-plus">+</span> Create round
        </button>

        <div bind="ongoingSection" class="landing__section-block">
            <div class="landing__section">
                <span class="landing__section-title">Ongoing</span>
                <span bind="ongoingCount" class="landing__count"></span>
            </div>
            <div bind="ongoingList" class="landing__list"></div>
        </div>

        <div bind="finishedSection" class="landing__section-block">
            <div class="landing__section">
                <span class="landing__section-title">Recently finished</span>
                <span bind="finishedCount" class="landing__count"></span>
            </div>
            <div bind="finishedList" class="landing__list"></div>
        </div>

        <div bind="empty" class="landing__empty">No rounds yet — create one to tee off.</div>

        <button bind="history" class="landing__history" type="button">See all rounds →</button>
        <button bind="signin" class="landing__signin" type="button">Sign in</button>
        <div bind="confirmHost"></div>
    </div>
`);

// A small trash control OUTSIDE the row's main tap target (buttons can't
// nest), separated at the card's right edge so a scroll-tap can't hit it.
const trashSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

const rowTpl = template(`
    <div class="round-row">
        <button bind="row" type="button" class="round-row__main">
            <div class="round-row__top">
                <span bind="course" class="round-row__course"></span>
                <span bind="role" class="round-row__role"></span>
                <span bind="status" class="round-row__status"></span>
            </div>
            <div class="round-row__bottom">
                <span bind="date"></span>
                <span bind="formats" class="round-row__formats"></span>
            </div>
        </button>
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${trashSvg}</button>
    </div>
`);

export const STATUS_TEXT: Record<string, string> = {
    not_started: 'Not started',
    active: 'Live',
    complete: 'Finished',
};

export class LandingComponent extends Component {
    static styles = `
        .landing {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .landing__head {
                text-align: center;
                margin-bottom: ${s('xl')};

                & .landing__flag { font-size: 2.2rem; line-height: 1; }
                & h1 {
                    margin: ${s('xs')} 0 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 2.2rem;
                    letter-spacing: -0.02em;
                    color: ${t('text')};
                }
                & p {
                    margin: ${s('xs')} 0 0;
                    color: ${t('text-muted')};
                    font-size: 0.9rem;
                }
            }

            & .landing__create {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: ${s('sm')};
                padding: ${s('lg')};
                margin-bottom: ${s('xl')};
                font-size: 1.1rem;
                font-weight: 700;
                font-family: inherit;
                ${btn()}
                background: ${t('primary')};
                color: ${t('primary-text')};
                border: none;
                box-shadow: ${t('shadow-elevated')};
                &:hover { background: ${t('primary')}; }

                & .landing__create-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .landing__section-block {
                margin-bottom: ${s('xl')};
                &.hidden { display: none; }
            }

            & .landing__section {
                display: flex;
                align-items: baseline;
                gap: ${s('sm')};
                margin-bottom: ${s('sm')};

                & .landing__section-title {
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: ${t('text')};
                }
                & .landing__count {
                    color: ${t('text-muted')};
                    font-size: 0.85rem;
                }
            }

            & .landing__empty {
                color: ${t('text-muted')};
                font-size: 0.9rem;
                padding: ${s('lg')} 0;

                &.hidden { display: none; }
            }

            & .round-row__role {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: ${t('accent')};
                flex-shrink: 0;

                &.hidden { display: none; }
            }

            & .landing__list {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .round-row {
                display: flex;
                align-items: stretch;
                ${card({ hover: true })}

                & .round-row__main {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};
                    padding: ${s('md')} 0 ${s('md')} ${s('lg')};
                    text-align: left;
                    font-family: inherit;
                    background: none;
                    border: none;
                    cursor: pointer;
                    &:disabled { cursor: default; }
                }

                /* Danger stays quiet until touched: muted glyph, small icon,
                   its own 44px-wide tap column at the card's edge. */
                & .round-row__del {
                    flex: 0 0 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    color: ${t('text-muted')};
                    cursor: pointer;
                    border-radius: 0 ${t('radius')} ${t('radius')} 0;

                    & svg { width: 17px; height: 17px; }
                    &:hover, &:active { color: ${t('error')}; }
                    &:focus-visible { outline: 2px solid ${t('error')}; outline-offset: -2px; }
                    &.hidden { display: none; }
                }

                & .round-row__top {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    gap: ${s('md')};
                }
                & .round-row__course {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${t('text')};
                }
                & .round-row__status {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    border-radius: ${t('radius-pill')};
                    padding: 2px 10px;
                    flex-shrink: 0;

                    &.s-active { background: ${t('accent-soft')}; color: ${t('accent')}; }
                    &.s-complete { background: ${t('surface-sunken')}; color: ${t('text-muted')}; }
                    &.s-not_started { background: ${t('surface-sunken')}; color: ${t('text-muted')}; }
                }
                & .round-row__bottom {
                    display: flex;
                    justify-content: space-between;
                    gap: ${s('md')};
                    color: ${t('text-muted')};
                    font-size: 0.85rem;

                    &.hidden { display: none; }
                }
                & .round-row__formats {
                    text-align: right;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            & .landing__history {
                display: block;
                margin: ${s('sm')} auto 0;
                padding: ${s('sm')} ${s('lg')};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${t('accent')};
                cursor: pointer;

                &.hidden { display: none; }
            }

            & .landing__signin {
                display: block;
                &.hidden { display: none; }
                margin: ${s('lg')} auto 0;
                padding: ${s('sm')} ${s('lg')};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 600;
                color: ${t('text-muted')};
                text-decoration: underline;
                cursor: pointer;
            }
        }

        /* App-level accessibility override for the framework confirm dialog. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;

    private svc = this.inject(LandingService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    private loggedIn = new Computed(() => this.auth.currentUser.get() !== null);

    // The unified row list (both states normalise to `LandingRow`), then the
    // pure partition. `now` is read once per (re)compute from the wall clock —
    // the ONLY Date use here, kept out of the pure `partition`/`rows` modules.
    private rows = new Computed<LandingRow[]>(() =>
        this.loggedIn.get()
            ? landingRows.fromMyRounds(this.svc.myRounds.get())
            : landingRows.fromDeviceRounds(this.svc.deviceRounds.get()),
    );
    private parts = new Computed<Partitioned<LandingRow>>(() =>
        partitionRounds(this.rows.get(), Date.now(), (r) => r),
    );
    private ongoing = new Computed(() => this.parts.get().ongoing);
    private finished = new Computed(() => this.parts.get().finished);

    // Delete confirmation: one shared dialog; the tapped row parks its target
    // here and opens it.
    private deleteOpen = new Signal(false);
    private deleteTarget = new Signal<{ token: string; roundId: string; name: string } | null>(
        null,
    );

    private askDelete(token: string, roundId: string, name: string): void {
        this.deleteTarget.set({ token, roundId, name });
        this.deleteOpen.set(true);
    }

    render(): DocumentFragment {
        // Logged in: fetch the dashboard halves. Logged out: read the device
        // recent list from localStorage. Either way the partition is reactive.
        if (this.loggedIn.get()) void this.svc.loadMine();
        else this.svc.loadDevice();

        const anyRows = () => this.rows.get().length > 0;

        const frag = this.wire(tpl, {
            createBtn: { onclick: () => this.router.navigate('/create') },
            signin: {
                className: () => (this.loggedIn.get() ? 'landing__signin hidden' : 'landing__signin'),
                onclick: () => this.router.navigate('/login'),
            },
            history: {
                className: () => (anyRows() ? 'landing__history' : 'landing__history hidden'),
                onclick: () => this.router.navigate('/history'),
            },
            ongoingSection: {
                className: () =>
                    this.ongoing.get().length > 0
                        ? 'landing__section-block'
                        : 'landing__section-block hidden',
            },
            ongoingCount: () => {
                const n = this.ongoing.get().length;
                return n === 0 ? '' : String(n);
            },
            finishedSection: {
                className: () =>
                    this.finished.get().length > 0
                        ? 'landing__section-block'
                        : 'landing__section-block hidden',
            },
            finishedCount: () => {
                const n = this.finished.get().length;
                return n === 0 ? '' : String(n);
            },
            empty: {
                className: () => (anyRows() ? 'landing__empty hidden' : 'landing__empty'),
            },
        });

        this.$each(
            this.ref(frag, 'ongoingList'),
            this.ongoing,
            (row, _i, track) => this.roundRow(row, track),
            (row) => row.key,
        );
        this.$each(
            this.ref(frag, 'finishedList'),
            this.finished,
            (row, _i, track) => this.roundRow(row, track),
            (row) => row.key,
        );

        this.spawn(ConfirmComponent, this.ref(frag, 'confirmHost'), {
            open: this.deleteOpen,
            title: 'Delete round?',
            message: () => {
                const target = this.deleteTarget.get();
                const name = target ? `“${target.name}”` : 'this round';
                return `Delete ${name}? This permanently removes it and all its scores for everyone. This can't be undone.`;
            },
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            danger: true,
            onconfirm: () => {
                const target = this.deleteTarget.get();
                if (target) void this.svc.remove(target.token, target.roundId);
            },
        });

        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.deleteOpen.get()) this.deleteOpen.set(false);
        };
        window.addEventListener('keydown', onKeydown);
        this.track(() => window.removeEventListener('keydown', onKeydown));

        return frag;
    }

    /** One round row (shared by both sections + both auth states). A row with
     *  no token can't navigate or be deleted (logged-in produced round without
     *  a friendly wrapper); everything else taps through. */
    private roundRow(row: LandingRow, track: (d: () => void) => void): HTMLElement {
        return this.wireEl(
            rowTpl,
            {
                row: {
                    disabled: () => row.token === null,
                    onclick: () => {
                        if (row.token === null) return;
                        this.router.navigate('/round', { query: { token: row.token } });
                    },
                },
                course: () => row.courseName || 'Round',
                role: {
                    textContent: () => row.roleLabel ?? '',
                    className: () =>
                        row.roleLabel ? 'round-row__role' : 'round-row__role hidden',
                },
                status: {
                    textContent: () => STATUS_TEXT[row.status] ?? row.status,
                    className: () => `round-row__status s-${row.status}`,
                },
                date: () => row.date ?? '',
                formats: () => row.formats ?? '',
                del: {
                    className: () =>
                        row.token === null ? 'round-row__del hidden' : 'round-row__del',
                    onclick: () => {
                        if (row.token === null) return;
                        this.askDelete(row.token, row.roundId ?? '', row.courseName || 'this round');
                    },
                },
            },
            track,
        );
    }
}
