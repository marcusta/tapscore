import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { SelectComponent } from '@basics/core/client/ui/select';
import { api, ApiError } from '../api';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { RoundViewService } from './round.service';
import { canShowJoinCard } from './join';
import type { CompilerDiagnostic } from '../api/friendly-rounds.gen';
import type { Tee } from '../api/setup.gen';

// Phase 3.5 self-join affordance. Renders only for a logged-in viewer on a
// `not_started` round they don't already play in (see `canShowJoinCard`).
// Distinct from the claim card above it: claiming flips an EXISTING guest
// row to this viewer's identity ("I was pre-entered"); joining mints a BRAND
// NEW producer from the viewer's own profile ("add me fresh"). Both can show
// at once — a round can have an unclaimed guest AND room for a genuinely new
// player.
//
// Tee choice reuses the no-auth setup tees lookup (`setup.teesByCourse`) —
// the round payload's `courseId` is exactly what that endpoint keys on, so no
// new server surface is needed for the picker itself.

const tpl = template(`
    <div bind="root" class="join-card hidden">
        <span class="join-card__label">Playing this round?</span>
        <p class="join-card__hint">Add yourself with your own tee — this creates your own scorecard.</p>
        <div class="join-card__row">
            <div bind="teeHost" class="join-card__tee"></div>
            <button bind="join" class="join-card__btn" type="button">Add me</button>
        </div>
        <p bind="diag" class="join-card__diag"></p>
        <p bind="err" class="join-card__err"></p>
    </div>
`);

export class JoinCardComponent extends Component {
    static styles = `
        .join-card {
            margin-top: ${s('lg')};
            padding: ${s('lg')};
            ${card()}
            background: ${t('surface-sunken')};

            &.hidden { display: none; }

            & .join-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${t('text-muted')};
            }
            & .join-card__hint {
                margin: ${s('sm')} 0 0;
                font-size: 0.8rem;
                color: ${t('text-muted')};
            }
            & .join-card__row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                margin-top: ${s('md')};
            }
            & .join-card__tee { flex: 1; }
            & .join-card__btn {
                ${btn()}
                padding: ${s('sm')} ${s('lg')};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${t('primary')};
                color: ${t('primary-text')};
                border: none;
                flex-shrink: 0;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .join-card__diag {
                margin: ${s('sm')} 0 0;
                font-size: 0.85rem;
                color: ${t('text-muted')};
                &:empty { display: none; }
                & a { color: ${t('accent')}; font-weight: 600; }
            }
            & .join-card__err {
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
    private joining = new Signal(false);
    private error = new Signal('');
    private diagnostics = new Signal<CompilerDiagnostic[]>([]);
    private teeId = new Signal('');
    private tees = new Signal<Tee[]>([]);
    private loadedForCourseId: string | null = null;

    private eligible(): boolean {
        return canShowJoinCard(
            this.svc.balls.get(),
            this.auth.currentUser.get()?.id ?? null,
            this.svc.round.get()?.status ?? null,
        );
    }

    /**
     * Lazily fetch tees for the round's course the first time the card is
     * eligible. Best-effort: a fetch failure just leaves the tee list (and
     * hence the disabled "Add me" button) empty rather than surfacing a
     * separate error state for a card the viewer hasn't interacted with yet.
     */
    private ensureTeesLoaded(): void {
        if (!this.eligible()) return;
        const courseId = this.svc.round.get()?.courseId;
        if (!courseId || courseId === this.loadedForCourseId) return;
        this.loadedForCourseId = courseId;
        void api.setup
            .teesByCourse({ courseId })
            .then((tees) => {
                this.tees.set(tees);
                if (!this.teeId.get() && tees[0]) this.teeId.set(tees[0].id);
            })
            .catch(() => {
                this.loadedForCourseId = null;
            });
    }

    private diagnosticMessage(d: CompilerDiagnostic): string {
        if (d.code === 'missing_gender' || d.code === 'missing_handicap_index') {
            return `${d.message} — <a data-nav="/profile">update your profile</a>.`;
        }
        return d.message;
    }

    private async join(): Promise<void> {
        const token = this.tokenQ.get();
        const teeId = this.teeId.get();
        if (!token || !teeId || this.joining.get()) return;
        this.error.set('');
        this.diagnostics.set([]);
        this.joining.set(true);
        try {
            const res = await api.friendlyRounds.join({ token, teeId });
            if (res.ok) {
                await this.svc.loadByToken(token);
            } else {
                this.diagnostics.set(res.diagnostics);
            }
        } catch (e) {
            this.error.set(
                e instanceof ApiError && e.status === 409
                    ? (e.message ?? 'You already play in this round, or it has already started.')
                    : 'Could not join right now. Try again.',
            );
        } finally {
            this.joining.set(false);
        }
    }

    render(): DocumentFragment {
        // Re-checked reactively: the round (and its courseId) loads
        // asynchronously AFTER this component mounts, and eligibility itself
        // depends on `svc.balls`/`svc.round`/`auth.currentUser` — all of which
        // can change post-mount (auth resolves, balls refetch after a claim
        // or a join elsewhere).
        this.track(effect(() => this.ensureTeesLoaded()));

        const frag = this.wire(tpl, {
            root: {
                className: () => (this.eligible() ? 'join-card' : 'join-card hidden'),
            },
            join: {
                disabled: () => this.joining.get() || !this.teeId.get(),
                onclick: () => void this.join(),
            },
            diag: {
                innerHTML: () =>
                    this.diagnostics
                        .get()
                        .map((d) => this.diagnosticMessage(d))
                        .join(' · '),
                onclick: (e: Event) => {
                    const a = (e.target as HTMLElement).closest('[data-nav]');
                    const href = a?.getAttribute('data-nav');
                    if (href) {
                        e.preventDefault();
                        this.router.navigate(href);
                    }
                },
            },
            err: { textContent: () => this.error.get() },
        });

        const teeSelect = new SelectComponent({
            value: this.teeId,
            options: { get: () => this.tees.get().map((tee) => ({ value: tee.id, label: tee.name })) },
            placeholder: 'Tee',
        });
        teeSelect.mount(this.ref(frag, 'teeHost'));
        this.track(() => teeSelect.destroy());

        return frag;
    }
}
