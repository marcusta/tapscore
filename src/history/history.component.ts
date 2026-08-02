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
import { roundListAction, roundListActionLabel, type RoundListAction } from '../landing/round-actions';
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
        <p bind="actionError" class="history__action-error" role="status"></p>
        <div bind="confirmHost"></div>
    </div>
`);

const moreSvg = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>`;

const rowTpl = template(`
    <div class="round-row">
        <button bind="row" type="button" class="round-summary round-row__main">${roundSummaryMarkup}</button>
        <div bind="actions" class="round-row__actions">
            <button bind="menuButton" type="button" class="round-row__menu-button" aria-label="Round actions" aria-haspopup="true" aria-expanded="false">${moreSvg}</button>
            <div bind="menu" class="round-row__menu" role="group" aria-label="Round actions">
                <button bind="action" type="button" class="round-row__menu-action"></button>
            </div>
        </div>
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
            & .history__action-error {
                margin: ${s('sm')} 0 0;
                color: ${t('danger')};
                font-size: 0.85rem;
                &:empty { display: none; }
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

                & .round-row__actions {
                    position: relative;
                    flex: 0 0 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    &.hidden { display: none; }
                }
                & .round-row__menu-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
                    padding: 0;
                    background: none;
                    border: none;
                    border-radius: ${t('radius-sm')};
                    color: ${t('text-muted')};
                    cursor: pointer;

                    & svg { width: 18px; height: 18px; }
                    &:hover, &[aria-expanded='true'] { background: ${t('hover-bg')}; color: ${t('text')}; }
                    &:focus-visible { outline: 2px solid ${t('accent')}; outline-offset: -2px; }
                }
                & .round-row__menu {
                    position: absolute;
                    top: 50%;
                    right: 0;
                    z-index: 3;
                    width: max-content;
                    max-width: min(220px, calc(100vw - ${s('lg')}));
                    padding: ${s('xs')};
                    transform: translateY(-50%);
                    background: ${t('surface')};
                    border: 1px solid ${t('border')};
                    border-radius: ${t('radius')};
                    box-shadow: ${t('shadow-elevated')};
                    &.hidden { display: none; }
                }
                & .round-row__menu-action {
                    display: block;
                    min-width: 174px;
                    max-width: 100%;
                    padding: ${s('sm')} ${s('md')};
                    background: none;
                    border: none;
                    border-radius: ${t('radius-sm')};
                    font-family: inherit;
                    font-size: 0.9rem;
                    font-weight: 600;
                    text-align: left;
                    color: ${t('danger')};
                    cursor: pointer;

                    &:hover { background: ${t('hover-bg')}; }
                    &:focus-visible { outline: 2px solid ${t('danger')}; outline-offset: -2px; }
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
    private leaveOpen = new Signal(false);
    private actionTarget = new Signal<{
        token: string;
        roundId: string;
        name: string;
        action: Exclude<RoundListAction, null>;
    } | null>(
        null,
    );
    private actionError = new Signal('');
    private openRoundMenu = new Signal<string | null>(null);

    private askAction(
        action: Exclude<RoundListAction, null>,
        token: string,
        roundId: string,
        name: string,
    ): void {
        this.openRoundMenu.set(null);
        this.actionError.set('');
        this.actionTarget.set({ token, roundId, name, action });
        if (action === 'delete') this.deleteOpen.set(true);
        else this.leaveOpen.set(true);
    }

    render(): DocumentFragment {
        if (this.loggedIn.get()) void this.svc.loadMine();
        else this.svc.loadDevice();

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/') },
            actionError: { textContent: () => this.actionError.get() },
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
                const target = this.actionTarget.get();
                const name = target ? `“${target.name}”` : 'this round';
                return `Delete ${name}? This permanently removes it and all its scores for everyone. This can't be undone.`;
            },
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            danger: true,
            onconfirm: () => {
                const target = this.actionTarget.get();
                if (!target) return;
                void this.svc.remove(target.token, target.roundId).then((ok) => {
                    if (!ok) this.actionError.set('Could not delete the round. Try again.');
                });
            },
        });

        this.spawn(ConfirmComponent, this.ref(frag, 'confirmHost'), {
            open: this.leaveOpen,
            title: 'Remove yourself from this round?',
            message:
                "Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",
            confirmLabel: 'Remove me',
            cancelLabel: 'Cancel',
            danger: true,
            onconfirm: () => {
                const target = this.actionTarget.get();
                if (!target) return;
                void this.svc.leave(target.token, target.roundId).then((res) => {
                    if (!res.ok) this.actionError.set(res.message);
                });
            },
        });

        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.deleteOpen.get()) this.deleteOpen.set(false);
            if (e.key === 'Escape' && this.leaveOpen.get()) this.leaveOpen.set(false);
            if (e.key === 'Escape' && this.openRoundMenu.get() !== null) this.openRoundMenu.set(null);
        };
        window.addEventListener('keydown', onKeydown);
        this.track(() => window.removeEventListener('keydown', onKeydown));

        const root = this.ref(frag, 'root');
        const onPointerDown = (e: Event) => {
            if (this.openRoundMenu.get() === null) return;
            const target = e.target;
            if (target instanceof Node && root.contains(target)) return;
            this.openRoundMenu.set(null);
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        this.track(() => document.removeEventListener('pointerdown', onPointerDown, true));

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
                actions: {
                    className: () =>
                        roundListAction(row) === null
                            ? 'round-row__actions hidden'
                            : 'round-row__actions',
                },
                menuButton: {
                    'aria-expanded': () =>
                        this.openRoundMenu.get() === row.key ? 'true' : 'false',
                    onclick: () =>
                        this.openRoundMenu.set(
                            this.openRoundMenu.get() === row.key ? null : row.key,
                        ),
                },
                menu: {
                    className: () =>
                        this.openRoundMenu.get() === row.key
                            ? 'round-row__menu'
                            : 'round-row__menu hidden',
                },
                action: {
                    textContent: () => {
                        const action = roundListAction(row);
                        return action ? roundListActionLabel(action) : '';
                    },
                    onclick: () => {
                        const action = roundListAction(row);
                        if (!action || row.token === null) return;
                        this.askAction(action, row.token, row.roundId ?? '', rowLabel(row));
                    },
                },
            },
            track,
        );
    }
}
