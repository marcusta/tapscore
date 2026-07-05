import { Component, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { api } from '../api';
import { t } from '../theme';
import { s } from '../css';
import { RoundViewService } from './round.service';
import { canShowLeaveCard } from './leave';
import type { CompilerDiagnostic } from '../api/friendly-rounds.gen';

// Phase 3.5 — the "Remove me from this round" affordance: the FIRST
// identity-gated, self-scoped mutation. Self-hiding unless the viewer is
// logged in AND appears as a producer in the round (see `canShowLeaveCard`).
// Distinct from the round-wide "Delete round" below it: delete destroys the
// whole round for everyone (token-trust); leave removes ONLY the caller's own
// producer + ball + scores and leaves everyone else's data intact
// (session-identity). Refusals — a shared team ball, a 2-player match that
// would degenerate — come back as structured diagnostics and render inline;
// the server's message is the canonical explanation.

const tpl = template(`
    <div bind="root" class="leave-card hidden">
        <button bind="leaveBtn" class="leave-card__btn" type="button">Remove me from this round</button>
        <p bind="diag" class="leave-card__diag"></p>
        <p bind="err" class="leave-card__err"></p>
        <div bind="confirmHost"></div>
    </div>
`);

export class LeaveCardComponent extends Component {
    static styles = `
        .leave-card {
            /* Sits at the head of the danger zone, above Finish/Delete. */
            margin-top: ${s('2xl')};

            &.hidden { display: none; }

            /* Same quiet ghost-danger treatment as Delete round — an action in
               the error tone, secondary to the primary Score/Board flow. */
            & .leave-card__btn {
                width: 100%;
                padding: ${s('md')};
                background: none;
                border: 1px solid ${t('border')};
                border-radius: ${t('radius')};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${t('error')};
                cursor: pointer;

                &:hover, &:active { border-color: ${t('error')}; }
                &:focus-visible { outline: 2px solid ${t('error')}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .leave-card__diag {
                margin: ${s('sm')} 0 0;
                font-size: 0.85rem;
                color: ${t('text-muted')};
                &:empty { display: none; }
            }
            & .leave-card__err {
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
    private open = new Signal(false);
    private leaving = new Signal(false);
    private error = new Signal('');
    private diagnostics = new Signal<CompilerDiagnostic[]>([]);

    private eligible(): boolean {
        return canShowLeaveCard(this.svc.balls.get(), this.auth.currentUser.get()?.id ?? null);
    }

    private async leave(): Promise<void> {
        const token = this.tokenQ.get();
        if (!token || this.leaving.get()) return;
        this.error.set('');
        this.diagnostics.set([]);
        this.leaving.set(true);
        try {
            const res = await api.friendlyRounds.leave({ token });
            if (res.ok) {
                // Reload the round — the caller is now absent from balls,
                // groups and the leaderboard; the view re-renders without them.
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
        const frag = this.wire(tpl, {
            root: {
                className: () => (this.eligible() ? 'leave-card' : 'leave-card hidden'),
            },
            leaveBtn: {
                onclick: () => this.open.set(true),
                disabled: () => this.leaving.get(),
            },
            diag: {
                // Server diagnostics are already humanized (shared team ball,
                // degenerate match, not-in-round) — render them verbatim.
                textContent: () =>
                    this.diagnostics
                        .get()
                        .map((d) => d.message)
                        .join(' · '),
            },
            err: { textContent: () => this.error.get() },
        });

        this.spawn(ConfirmComponent, this.ref(frag, 'confirmHost'), {
            open: this.open,
            title: 'Remove yourself from this round?',
            message:
                "Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",
            confirmLabel: 'Remove me',
            cancelLabel: 'Cancel',
            danger: true,
            onconfirm: () => void this.leave(),
        });

        return frag;
    }
}
