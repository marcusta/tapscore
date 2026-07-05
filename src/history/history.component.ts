import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, card } from '../css';
import { LandingService } from '../landing/landing.service';
import { landingRows, type LandingRow } from '../landing/rows';
import { sortHistory } from './sort';
import { STATUS_TEXT } from '../landing/landing.component';

const tpl = template(`
    <div class="history">
        <button bind="back" class="history__back" type="button">← Home</button>
        <h1 class="history__title">All rounds</h1>
        <div bind="empty" class="history__empty">No rounds yet — create one to tee off.</div>
        <div bind="list" class="history__list"></div>
        <div bind="confirmHost"></div>
    </div>
`);

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

export class HistoryComponent extends Component {
    static styles = `
        .history {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .history__back {
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

            & .history__title {
                margin: 0 0 ${s('lg')};
                font-family: ${t('font-display')};
                font-weight: 600;
                font-size: 1.8rem;
                letter-spacing: -0.02em;
                color: ${t('text')};
            }

            & .history__empty {
                color: ${t('text-muted')};
                font-size: 0.9rem;
                padding: ${s('lg')} 0;
                &.hidden { display: none; }
            }

            & .history__list {
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
                & .round-row__role {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: ${t('accent')};
                    flex-shrink: 0;
                    &.hidden { display: none; }
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
        }

        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;

    private svc = this.inject(LandingService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    private loggedIn = new Computed(() => this.auth.currentUser.get() !== null);

    // Full list, newest first — no partition, no 14-day window (that's the
    // landing's job; History shows everything).
    private rows = new Computed<LandingRow[]>(() =>
        sortHistory(
            this.loggedIn.get()
                ? landingRows.fromMyRounds(this.svc.myRounds.get())
                : landingRows.fromDeviceRounds(this.svc.deviceRounds.get()),
        ),
    );

    private deleteOpen = new Signal(false);
    private deleteTarget = new Signal<{ token: string; roundId: string; name: string } | null>(
        null,
    );

    private askDelete(token: string, roundId: string, name: string): void {
        this.deleteTarget.set({ token, roundId, name });
        this.deleteOpen.set(true);
    }

    render(): DocumentFragment {
        if (this.loggedIn.get()) void this.svc.loadMine();
        else this.svc.loadDevice();

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/') },
            empty: {
                className: () =>
                    this.rows.get().length === 0 ? 'history__empty' : 'history__empty hidden',
            },
        });

        this.$each(
            this.ref(frag, 'list'),
            this.rows,
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
