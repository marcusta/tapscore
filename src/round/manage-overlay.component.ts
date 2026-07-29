import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { api } from '../api';
import { t } from '../theme';
import { s } from '../css';
import { RoundViewService } from './round.service';
import { canShowLeaveCard } from './leave';
import type { CompilerDiagnostic } from '../api/friendly-rounds.gen';

// "Manage round" — the single home for every round-level management action
// (2026-07-29 owner ruling; docs/proposals/ios-round-manage.md Part C). The web
// used to scatter these across the bottom of the score panel: an edit card, a
// leave card, a finish button and a delete button, all invisible from the
// leaderboard tab. The iOS design won — one "⋯" affordance in the header chrome
// opens this sheet, which is reachable from both tabs.
//
// Rows are ABSENT, never disabled-but-visible: "Edit round" only when the
// server's no-auth `setup()` probe says the round is editable, "Remove me" only
// when the viewer is signed in and actually plays here (`canShowLeaveCard`).
// Finish/reopen and delete are unconditional — the share token IS the
// credential, the same trust boundary as scoring.
//
// Behaviour is unchanged from the cards it replaces, with one deliberate
// improvement carried over from iOS: a failed finish/reopen/delete used to be
// swallowed silently; now every failure lands on the inline error line.

export type ManageOverlayProps = {
    /** Owned by the round view (the header "⋯" button opens it). */
    open: Signal<boolean>;
};

const tpl = template(`
    <div bind="root" class="rmanage hidden">
        <div bind="backdrop" class="rmanage__backdrop"></div>
        <div class="rmanage__sheet" role="dialog" aria-modal="true" aria-label="Manage round">
            <div class="rmanage__head">
                <h2 class="rmanage__title">Manage round</h2>
                <button bind="close" class="rmanage__close" type="button">Done</button>
            </div>

            <button bind="editRow" class="rmanage__row hidden" type="button">
                <span class="rmanage__row-title">Edit round</span>
                <span class="rmanage__row-sub">Change the course, players or formats. Scores already taken are kept.</span>
            </button>

            <button bind="leaveRow" class="rmanage__row rmanage__row--danger hidden" type="button">
                <span class="rmanage__row-title">Remove me from this round</span>
                <span class="rmanage__row-sub">Your scores here will be deleted. Everyone else's stay.</span>
            </button>

            <button bind="finishRow" class="rmanage__row" type="button">
                <span bind="finishTitle" class="rmanage__row-title"></span>
                <span bind="finishSub" class="rmanage__row-sub"></span>
            </button>

            <button bind="deleteRow" class="rmanage__row rmanage__row--danger" type="button">
                <span class="rmanage__row-title">Delete round</span>
                <span class="rmanage__row-sub">Removes the round and every score in it, for everyone.</span>
            </button>

            <p bind="diag" class="rmanage__diag"></p>
            <p bind="err" class="rmanage__err"></p>

            <div bind="deleteConfirmHost"></div>
            <div bind="finishConfirmHost"></div>
            <div bind="leaveConfirmHost"></div>
        </div>
    </div>
`);

export class ManageOverlayComponent extends Component<ManageOverlayProps> {
    static styles = `
        /* Bottom sheet, matching the handicap keypad's anatomy (backdrop +
           raised surface with rounded top corners) — the app's established
           mobile overlay idiom. Sits above the dock, below the framework
           confirm dialogs (z-index 199/200) it spawns. */
        .rmanage {
            position: fixed; inset: 0; z-index: 80;
            &.hidden { display: none; }

            & .rmanage__backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.35); }

            & .rmanage__sheet {
                position: absolute; left: 0; right: 0; bottom: 0;
                max-height: 85%;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                background: ${t('surface')};
                border-top-left-radius: 16px; border-top-right-radius: 16px;
                /* Clear the iOS home indicator; harmless zero elsewhere. */
                padding: ${s('sm')} ${s('lg')} calc(${s('xl')} + env(safe-area-inset-bottom));
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
            }

            & .rmanage__head {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${s('md')};
                padding: ${s('sm')} 0 ${s('md')};
            }
            & .rmanage__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-weight: 600; font-size: 1.25rem;
                color: ${t('text')};
            }
            & .rmanage__close {
                min-height: 44px;
                padding: 0 ${s('md')};
                background: none; border: none;
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                color: ${t('text-muted')};
                cursor: pointer;
                &:focus-visible { outline: 2px solid ${t('accent')}; outline-offset: 2px; }
            }

            & .rmanage__row {
                display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
                width: 100%;
                min-height: 44px;
                margin-top: ${s('sm')};
                padding: ${s('md')};
                text-align: left;
                background: none;
                border: 1px solid ${t('border')};
                border-radius: ${t('radius')};
                font-family: inherit;
                color: ${t('text')};
                cursor: pointer;

                &.hidden { display: none; }
                &:hover, &:active { border-color: ${t('text-muted')}; }
                &:focus-visible { outline: 2px solid ${t('accent')}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }

                & .rmanage__row-title { font-size: 0.95rem; font-weight: 700; }
                & .rmanage__row-sub { font-size: 0.8rem; font-weight: 400; color: ${t('text-muted')}; }
            }

            /* Danger rows read in the terracotta family — a quiet ghost, never
               a filled CTA (same treatment the old delete/leave buttons had). */
            & .rmanage__row--danger {
                color: ${t('danger')};
                &:hover, &:active { border-color: ${t('danger')}; }
                &:focus-visible { outline-color: ${t('danger')}; }
            }

            & .rmanage__diag {
                margin: ${s('md')} 0 0;
                font-size: 0.85rem;
                color: ${t('text-muted')};
                &:empty { display: none; }
            }
            & .rmanage__err {
                margin: ${s('sm')} 0 0;
                font-size: 0.85rem;
                color: ${t('danger')};
                &:empty { display: none; }
            }
        }

        /* App-level accessibility override for the framework confirm dialogs
           this sheet spawns. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;

    private svc = this.inject(RoundViewService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private tokenQ = this.router.query('token');

    /** True once `setup()` confirms this round's stored draft is editable. */
    private editable = new Signal(false);
    private deleteOpen = new Signal(false);
    private finishOpen = new Signal(false);
    /**
     * Which action the finish/reopen dialog was opened FOR. Snapshotted on the
     * row tap: the dialog fades out after confirm, and by then the round's
     * status has already flipped — live `isComplete()` thunks would repaint
     * "Finish this round?" into "Reopen this round?" mid-fade.
     */
    private finishAsReopen = new Signal(false);
    private leaveOpen = new Signal(false);
    private leaving = new Signal(false);
    /** Inline failure line — cleared at the start of every attempt. */
    private error = new Signal('');
    /** Server refusals from `leave`, rendered verbatim (they explain best). */
    private diagnostics = new Signal<CompilerDiagnostic[]>([]);

    private isComplete(): boolean {
        return this.svc.round.get()?.status === 'complete';
    }

    private canLeave(): boolean {
        return canShowLeaveCard(this.svc.balls.get(), this.auth.currentUser.get()?.id ?? null);
    }

    private clear(): void {
        this.error.set('');
        this.diagnostics.set([]);
    }

    private async leave(): Promise<void> {
        const token = this.tokenQ.get();
        if (!token || this.leaving.get()) return;
        this.clear();
        this.leaving.set(true);
        try {
            const res = await api.friendlyRounds.leave({ token });
            if (res.ok) {
                // Reload the round — the caller is now absent from balls,
                // groups and the leaderboard; the view re-renders without them,
                // and this sheet's leave row self-hides. No navigation: the
                // token is still valid and the round goes on without you.
                await this.svc.loadByToken(token);
            } else {
                this.diagnostics.set(res.diagnostics);
            }
        } catch {
            this.error.set('Could not remove you right now. Try again.');
        } finally {
            this.leaving.set(false);
        }
    }

    render(): DocumentFragment {
        // Editability probe. Any failure (unknown token, offline) simply leaves
        // the row absent — it is additive, never blocking. Re-runs when the
        // token changes so a ?token= swap (which does not remount the round
        // view) can't leave a stale verdict behind.
        this.track(
            effect(() => {
                const token = this.tokenQ.get();
                this.editable.set(false);
                if (!token) return;
                void api.friendlyRounds
                    .setup({ token })
                    .then((r) => {
                        if (this.tokenQ.get() === token) this.editable.set(r.editable === true);
                    })
                    .catch(() => {});
            }),
        );

        // A fresh open starts with a clean slate — an error from a previous
        // visit to the sheet is stale by then.
        this.track(
            effect(() => {
                if (this.props.open.get()) this.clear();
            }),
        );

        const frag = this.wire(tpl, {
            root: { className: () => (this.props.open.get() ? 'rmanage' : 'rmanage hidden') },
            backdrop: { onclick: () => this.props.open.set(false) },
            close: { onclick: () => this.props.open.set(false) },

            editRow: {
                className: () =>
                    this.editable.get() ? 'rmanage__row' : 'rmanage__row hidden',
                onclick: () => {
                    const tk = this.tokenQ.get();
                    if (!tk) return;
                    this.props.open.set(false);
                    this.router.navigate('/create', { query: { token: tk } });
                },
            },
            leaveRow: {
                className: () =>
                    this.canLeave()
                        ? 'rmanage__row rmanage__row--danger'
                        : 'rmanage__row rmanage__row--danger hidden',
                onclick: () => this.leaveOpen.set(true),
                disabled: () => this.leaving.get(),
            },
            finishRow: {
                onclick: () => {
                    this.finishAsReopen.set(this.isComplete());
                    this.finishOpen.set(true);
                },
                disabled: () => this.svc.finishing.get(),
            },
            finishTitle: () => (this.isComplete() ? 'Reopen round' : 'Finish round'),
            finishSub: () =>
                this.isComplete()
                    ? 'Move it back to your ongoing rounds.'
                    : 'Move it to your finished rounds. Nothing is locked.',
            deleteRow: {
                onclick: () => this.deleteOpen.set(true),
                disabled: () => this.svc.deleting.get(),
            },

            diag: {
                // Server diagnostics are already humanized (shared team ball,
                // degenerate match, last player) — render them verbatim.
                textContent: () =>
                    this.diagnostics
                        .get()
                        .map((d) => d.message)
                        .join(' · '),
            },
            err: { textContent: () => this.error.get() },
        });

        // Delete-round confirmation. Same trust boundary as scoring — the token
        // is the credential, so no identity gate. On success the round is gone
        // for everyone; navigate home.
        this.spawn(ConfirmComponent, this.ref(frag, 'deleteConfirmHost'), {
            open: this.deleteOpen,
            title: 'Delete round?',
            message:
                "This permanently removes the round and all its scores for everyone. This can't be undone.",
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            danger: true,
            onconfirm: () => {
                this.clear();
                void this.svc.deleteRound().then((ok) => {
                    if (ok) this.router.navigate('/');
                    else this.error.set('Could not delete the round. Try again.');
                });
            },
        });

        // Finish / reopen confirmation. Finish is PURELY ORGANIZATIONAL — the
        // round stays editable + scorable; it just moves to "Recently finished".
        // On a complete round the same row offers Reopen instead, and the
        // dialog's question/confirm label follow it.
        this.spawn(ConfirmComponent, this.ref(frag, 'finishConfirmHost'), {
            open: this.finishOpen,
            title: () => (this.finishAsReopen.get() ? 'Reopen this round?' : 'Finish this round?'),
            message: () =>
                this.finishAsReopen.get()
                    ? "It'll move back to your ongoing rounds."
                    : "It'll move to your finished rounds. You can still edit or reopen it any time.",
            confirmLabel: () => (this.finishAsReopen.get() ? 'Reopen round' : 'Finish round'),
            cancelLabel: 'Cancel',
            onconfirm: () => {
                this.clear();
                const undo = this.finishAsReopen.get();
                void (undo ? this.svc.reopenRound() : this.svc.finishRound()).then((res) => {
                    if (!res) this.error.set('Could not update the round. Try again.');
                });
            },
        });

        // Leave: the only identity-gated, self-scoped mutation here. Removes
        // ONLY the caller's producer + ball + scores; everyone else's data and
        // the round itself stay.
        this.spawn(ConfirmComponent, this.ref(frag, 'leaveConfirmHost'), {
            open: this.leaveOpen,
            title: 'Remove yourself from this round?',
            message:
                "Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",
            confirmLabel: 'Remove me',
            cancelLabel: 'Cancel',
            danger: true,
            onconfirm: () => void this.leave(),
        });

        // aria-modal promises focus management, so deliver it: entering the
        // sheet moves focus to "Done", leaving it hands focus back to whatever
        // opened it (the header "⋯" button). No trap — the sheet is short and
        // Escape/backdrop always exit.
        let lastFocus: HTMLElement | null = null;
        const closeBtn = this.ref(frag, 'close') as HTMLButtonElement;
        this.track(
            effect(() => {
                if (this.props.open.get()) {
                    lastFocus =
                        document.activeElement instanceof HTMLElement ? document.activeElement : null;
                    queueMicrotask(() => closeBtn.focus());
                } else if (lastFocus) {
                    lastFocus.focus();
                    lastFocus = null;
                }
            }),
        );

        // Escape unwinds one layer at a time: an open confirm first, then the
        // sheet (backdrop click closes the sheet; the framework overlay already
        // cancels its own confirm on a backdrop click).
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (this.deleteOpen.get()) return void this.deleteOpen.set(false);
            if (this.finishOpen.get()) return void this.finishOpen.set(false);
            if (this.leaveOpen.get()) return void this.leaveOpen.set(false);
            if (this.props.open.get()) this.props.open.set(false);
        };
        window.addEventListener('keydown', onKeydown);
        this.track(() => window.removeEventListener('keydown', onKeydown));

        return frag;
    }
}
