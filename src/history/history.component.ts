import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, card } from '../css';
import { LandingService } from '../landing/landing.service';
import {
    formatRowDate,
    landingRows,
    rowCourseSubtitle,
    rowLabel,
    type LandingRow,
} from '../landing/rows';
import { sortHistory } from './sort';
import { roundSummaryMarkup } from '../landing/landing.component';

const tpl = template(`
    <div class="history">
        <button bind="back" class="history__back" type="button">← Home</button>
        <h1 class="history__title">All rounds</h1>
        <div bind="empty" class="history__empty">No rounds yet — tap Play golf to tee off.</div>
        <div bind="sections" class="history__sections">
            <section bind="ongoingSection" class="history__section history__ongoing">
                <div class="history__section-head">
                    <span class="history__section-title">Ongoing</span>
                    <span bind="ongoingCount" class="history__count"></span>
                </div>
                <div bind="ongoingList" class="history__section-list"></div>
            </section>
            <section bind="finishedSection" class="history__section history__finished">
                <div class="history__section-head">
                    <span class="history__section-title">Finished</span>
                    <span bind="finishedCount" class="history__count"></span>
                </div>
                <div bind="finishedList" class="history__section-list"></div>
            </section>
        </div>
        <div bind="confirmHost"></div>
    </div>
`);

const trashSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

const rowTpl = template(`
    <div class="round-row">
        <button bind="row" type="button" class="round-summary round-row__main">${roundSummaryMarkup}</button>
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${trashSvg}</button>
    </div>
`);

export class HistoryComponent extends Component {
    static styles = `
        .history {
            /* Same Play-pill allowance as the landing: the docked pill hangs
               22px into this screen's bottom edge. */
            padding: ${s('xl')} ${s('lg')} calc(${s('2xl')} + 76px);

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

            & .history__sections {
                display: flex;
                flex-direction: column;
                gap: ${s('xl')};

                &.hidden { display: none; }
            }

            & .history__section {
                ${card()}
                overflow: hidden;

                &.hidden { display: none; }
            }
            & .history__section-head {
                display: flex;
                align-items: baseline;
                gap: ${s('sm')};
                padding: ${s('md')} ${s('lg')} ${s('sm')};
            }
            & .history__section-title {
                font-family: ${t('font-display')};
                font-size: 1.1rem;
                font-weight: 600;
                color: ${t('text')};
            }
            & .history__count {
                font-size: 0.85rem;
                color: ${t('text-muted')};
            }
            & .history__section-list {
                display: flex;
                flex-direction: column;
            }

            /* The same round-summary markup as the landing cards: title,
               course, then one quiet metadata line. Sections now provide the
               lifecycle context, so rows need neither a role tag nor a status
               chip. */
            & .round-summary {
                display: flex;
                flex: 1;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
                padding: ${s('md')} 0 ${s('md')} ${s('lg')};
                background: none;
                border: none;
                font-family: inherit;
                text-align: left;
                cursor: pointer;

                &:disabled { cursor: default; }

                & .round-summary__title {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: ${t('text')};
                }
                & .round-summary__course {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 0.9rem;
                    color: ${t('text-muted')};

                    &.hidden { display: none; }
                }
                & .round-summary__bottom {
                    display: flex;
                    align-items: baseline;
                    min-width: 0;
                    gap: ${s('sm')};
                    color: ${t('text-muted')};
                    font-size: 0.85rem;
                }
                & .round-summary__formats {
                    min-width: 0;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                & .round-summary__progress::before { content: '·'; margin-right: ${s('sm')}; }
                & .round-summary__progress.hidden,
                & .round-summary__formats.hidden { display: none; }
            }

            & .round-row {
                display: flex;
                align-items: stretch;
                border-top: 1px solid ${t('border')};

                & .round-row__del {
                    flex: 0 0 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    color: ${t('text-muted')};
                    cursor: pointer;
                    border-radius: 0;

                    & svg { width: 17px; height: 17px; }
                    &:hover, &:active { color: ${t('error')}; }
                    &:focus-visible { outline: 2px solid ${t('error')}; outline-offset: -2px; }
                    &.hidden { display: none; }
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

    // Full history, newest first. Unlike the landing's recent-finished
    // preview, both sections retain every round here.
    private rows = new Computed<LandingRow[]>(() =>
        sortHistory(
            this.loggedIn.get()
                ? landingRows.fromMyRounds(this.svc.myRounds.get())
                : landingRows.fromDeviceRounds(this.svc.deviceRounds.get()),
        ),
    );
    private ongoingRows = new Computed(() =>
        this.rows.get().filter((row) => row.status !== 'complete'),
    );
    private finishedRows = new Computed(() =>
        this.rows.get().filter((row) => row.status === 'complete'),
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
            sections: {
                className: () =>
                    this.rows.get().length === 0
                        ? 'history__sections hidden'
                        : 'history__sections',
            },
            ongoingSection: {
                className: () =>
                    this.ongoingRows.get().length === 0
                        ? 'history__section history__ongoing hidden'
                        : 'history__section history__ongoing',
            },
            ongoingCount: () => String(this.ongoingRows.get().length),
            finishedSection: {
                className: () =>
                    this.finishedRows.get().length === 0
                        ? 'history__section history__finished hidden'
                        : 'history__section history__finished',
            },
            finishedCount: () => String(this.finishedRows.get().length),
        });

        this.$each(
            this.ref(frag, 'ongoingList'),
            this.ongoingRows,
            (row, _i, track) => this.roundRow(row, track, true),
            (row) => row.key,
        );
        this.$each(
            this.ref(frag, 'finishedList'),
            this.finishedRows,
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

    private roundRow(
        row: LandingRow,
        track: (d: () => void) => void,
        showProgress = false,
    ): HTMLElement {
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
                title: () => rowLabel(row),
                course: {
                    textContent: () => rowCourseSubtitle(row) ?? '',
                    className: () =>
                        rowCourseSubtitle(row)
                            ? 'round-summary__course'
                            : 'round-summary__course hidden',
                },
                date: () => formatRowDate(row.date),
                progress: {
                    textContent: () =>
                        showProgress && row.holesPlayed && row.holesPlayed > 0
                            ? `Thru ${row.holesPlayed}`
                            : '',
                    className: () =>
                        showProgress && row.holesPlayed && row.holesPlayed > 0
                            ? 'round-summary__progress'
                            : 'round-summary__progress hidden',
                },
                formats: {
                    textContent: () => row.formats ?? '',
                    className: () =>
                        row.formats ? 'round-summary__formats' : 'round-summary__formats hidden',
                },
                del: {
                    className: () =>
                        row.token === null ? 'round-row__del hidden' : 'round-row__del',
                    onclick: () => {
                        if (row.token === null) return;
                        this.askDelete(row.token, row.roundId ?? '', rowLabel(row));
                    },
                },
            },
            track,
        );
    }
}
