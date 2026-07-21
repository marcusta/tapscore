import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { SelectComponent } from '@basics/core/client/ui/select';
import { api } from '../api';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { RoundViewService } from './round.service';
import { releasableSeats, seatCardState, seatContextLine } from './seat-claim';
import type { CompilerDiagnostic, StartListSeat } from '../api/friendly-rounds.gen';
import type { Tee } from '../api/setup.gen';

// Phase 5.5 Slice 3 — the "Who's playing?" seat card. Lists every UNCLAIMED
// placeholder seat (label, group, category) with the claim affordances the
// server's policy decision grants THIS viewer (`startList.viewer.claimSeat` /
// `.claimSeatAsGuest`): a one-tap "I'm playing this seat" for a logged-in
// self claim, and a guest form (name/hcp/gender — trust-based, works
// anonymously under `claimBy:'anyone'`). Refusals render VERBATIM; the server
// re-enforces on the claim call, so this card is presentation, not
// authorization. It also shows the minimal release affordance ("Not me —
// release") on the viewer's own claimed, unscored seat.
//
// Distinct from the guest-claim card ("Played here as a guest?" — flips an
// existing guest row to the viewer's account) and the join card ("Playing
// this round?" — mints a NEW producer): this one fills a seat the organizer
// already planned. All three can coexist on one round.

const tpl = template(`
    <div bind="root" class="seat-card hidden">
        <span class="seat-card__label">Who's playing?</span>
        <p bind="hint" class="seat-card__hint">This round has open seats — claim one to score.</p>
        <p bind="blocked" class="seat-card__blocked hidden"></p>
        <div bind="rows" class="seat-card__rows"></div>
        <div bind="releaseRows" class="seat-card__rows"></div>
        <p bind="err" class="seat-card__err"></p>
    </div>
`);

const seatTpl = template(`
    <div class="seat-card__seat">
        <div class="seat-card__head">
            <div class="seat-card__who">
                <span bind="label" class="seat-card__name"></span>
                <span bind="context" class="seat-card__context"></span>
            </div>
            <button bind="toggle" class="seat-card__btn" type="button">Claim</button>
        </div>
        <div bind="form" class="seat-card__form hidden">
            <div bind="teeHost" class="seat-card__tee"></div>
            <button bind="selfBtn" class="seat-card__btn seat-card__btn--wide hidden" type="button">I'm playing this seat</button>
            <div bind="guestBox" class="seat-card__guest hidden">
                <input bind="guestName" class="seat-card__input" placeholder="Guest name" autocomplete="off">
                <div class="seat-card__guest-row">
                    <input bind="guestHcp" class="seat-card__input seat-card__input--hcp" placeholder="HCP" inputmode="decimal" autocomplete="off">
                    <div bind="genderHost" class="seat-card__gender"></div>
                </div>
                <button bind="guestBtn" class="seat-card__btn seat-card__btn--wide" type="button">Add guest to this seat</button>
            </div>
            <p bind="diag" class="seat-card__diag hidden"></p>
        </div>
    </div>
`);

const releaseTpl = template(`
    <div class="seat-card__release">
        <span class="seat-card__who">
            <span bind="name" class="seat-card__name"></span>
            <span bind="context" class="seat-card__context"></span>
        </span>
        <button bind="release" class="seat-card__btn seat-card__btn--ghost" type="button">Not me — release</button>
    </div>
`);

export class SeatCardComponent extends Component {
    static styles = `
        .seat-card {
            margin-top: ${s('lg')};
            padding: ${s('lg')};
            ${card()}
            background: ${t('surface-sunken')};

            &.hidden { display: none; }

            & .seat-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${t('text-muted')};
            }
            & .seat-card__hint {
                margin: ${s('sm')} 0 0;
                font-size: 0.8rem;
                color: ${t('text-muted')};
                &.hidden { display: none; }
            }
            & .seat-card__blocked {
                margin: ${s('md')} 0 0;
                font-size: 0.85rem;
                color: ${t('text-muted')};
                &.hidden { display: none; }
            }
            & .seat-card__rows {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                margin-top: ${s('md')};
                &:empty { display: none; }
            }
            & .seat-card__seat {
                padding: ${s('sm')} 0;
                border-bottom: 1px solid ${t('border')};
                &:last-child { border-bottom: 0; padding-bottom: 0; }
            }
            & .seat-card__head, & .seat-card__release {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
            }
            & .seat-card__who {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            & .seat-card__name { font-weight: 600; font-size: 0.95rem; }
            & .seat-card__context {
                font-size: 0.8rem;
                color: ${t('text-muted')};
                &:empty { display: none; }
            }
            & .seat-card__btn {
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
            & .seat-card__btn--wide { width: 100%; margin-top: ${s('sm')}; }
            & .seat-card__btn--ghost {
                background: transparent;
                color: ${t('accent')};
                border: 1px solid ${t('border')};
                font-weight: 600;
            }
            & .seat-card__form {
                margin-top: ${s('md')};
                &.hidden { display: none; }
            }
            & .seat-card__guest {
                margin-top: ${s('sm')};
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                &.hidden { display: none; }
            }
            & .seat-card__guest-row {
                display: flex;
                gap: ${s('sm')};
                align-items: center;
            }
            & .seat-card__input {
                width: 100%;
                padding: ${s('sm')};
                font: inherit;
                font-size: 0.9rem;
                border: 1px solid ${t('border')};
                border-radius: 8px;
                background: ${t('surface')};
                color: ${t('text')};
            }
            & .seat-card__input--hcp { width: 6rem; flex-shrink: 0; }
            & .seat-card__gender { flex: 1; }
            & .seat-card__tee { margin-bottom: ${s('sm')}; }
            & .seat-card__diag {
                margin: ${s('sm')} 0 0;
                font-size: 0.85rem;
                color: ${t('text-muted')};
                &.hidden { display: none; }
            }
            & .seat-card__err {
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
    /** Refusal diagnostics from the last claim attempt, rendered verbatim. */
    private diagnostics = new Signal<CompilerDiagnostic[]>([]);
    /** Which seat's claim form is expanded (one at a time); null = none. */
    private expandedSeat = new Signal<string | null>(null);
    private teeId = new Signal('');
    private tees = new Signal<Tee[]>([]);
    private loadedForCourseId: string | null = null;
    private guestName = new Signal('');
    private guestHcp = new Signal('');
    private guestGender = new Signal('M');

    private state() {
        return seatCardState(this.svc.startList.get());
    }

    /** Lazily fetch tees the first time the card is visible (join-card pattern). */
    private ensureTeesLoaded(): void {
        if (!this.state().visible) return;
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

    private toggleSeat(seatId: string): void {
        this.diagnostics.set([]);
        this.error.set('');
        this.expandedSeat.set(this.expandedSeat.get() === seatId ? null : seatId);
    }

    private guestHcpValue(): number | null {
        const v = Number.parseFloat(this.guestHcp.get().replace(',', '.'));
        return Number.isFinite(v) ? v : null;
    }

    private async claim(
        seatId: string,
        identity:
            | { kind: 'self' }
            | { kind: 'guest'; name: string; handicapIndex: number; gender: 'M' | 'F' },
        clientEventId: string,
    ): Promise<void> {
        const token = this.tokenQ.get();
        const teeId = this.teeId.get();
        if (!token || !teeId || this.claiming.get()) return;
        this.error.set('');
        this.diagnostics.set([]);
        this.claiming.set(true);
        try {
            const res = await api.friendlyRounds.claimSeat({
                token,
                seatId,
                identity,
                teeId,
                clientEventId,
            });
            if (res.ok) {
                this.expandedSeat.set(null);
                this.guestName.set('');
                this.guestHcp.set('');
                await this.svc.loadByToken(token);
            } else {
                this.diagnostics.set(res.diagnostics);
            }
        } catch {
            this.error.set('Could not claim right now. Try again.');
        } finally {
            this.claiming.set(false);
        }
    }

    private async claimSelf(seatId: string): Promise<void> {
        // Deterministic id per (seat, player, tee): a racing double-tap
        // dedupes server-side instead of double-appending (join's pattern).
        const playerId = this.auth.currentUser.get()?.id ?? 'anon';
        await this.claim(
            seatId,
            { kind: 'self' },
            `claim-seat:${seatId}:${playerId}:${this.teeId.get()}`,
        );
    }

    private async claimGuest(seatId: string): Promise<void> {
        const name = this.guestName.get().trim();
        const handicapIndex = this.guestHcpValue();
        if (!name || handicapIndex === null) return;
        await this.claim(
            seatId,
            {
                kind: 'guest',
                name,
                handicapIndex,
                gender: this.guestGender.get() === 'F' ? 'F' : 'M',
            },
            crypto.randomUUID(),
        );
    }

    private async release(seatId: string): Promise<void> {
        const token = this.tokenQ.get();
        if (!token || this.claiming.get()) return;
        this.error.set('');
        this.diagnostics.set([]);
        this.claiming.set(true);
        try {
            const res = await api.friendlyRounds.releaseSeat({
                token,
                seatId,
                clientEventId: crypto.randomUUID(),
            });
            if (res.ok) {
                await this.svc.loadByToken(token);
            } else {
                this.diagnostics.set(res.diagnostics);
            }
        } catch {
            this.error.set('Could not release right now. Try again.');
        } finally {
            this.claiming.set(false);
        }
    }

    private seatRow(seat: StartListSeat, track: (fn: () => void) => void): HTMLElement {
        const formActive = () =>
            this.expandedSeat.get() === seat.seatId && this.state().blockedMessage === null;
        const el = this.wireEl(
            seatTpl,
            {
                label: () => seat.label,
                context: () => seatContextLine(seat, this.svc.groups()),
                toggle: {
                    textContent: () => (this.expandedSeat.get() === seat.seatId ? 'Close' : 'Claim'),
                    disabled: () => this.state().blockedMessage !== null,
                    onclick: () => this.toggleSeat(seat.seatId),
                },
                form: {
                    className: () => (formActive() ? 'seat-card__form' : 'seat-card__form hidden'),
                },
                selfBtn: {
                    className: () =>
                        this.state().selfAllowed
                            ? 'seat-card__btn seat-card__btn--wide'
                            : 'seat-card__btn seat-card__btn--wide hidden',
                    disabled: () => this.claiming.get() || !this.teeId.get(),
                    onclick: () => void this.claimSelf(seat.seatId),
                },
                guestBox: {
                    className: () =>
                        this.state().guestAllowed ? 'seat-card__guest' : 'seat-card__guest hidden',
                },
                guestName: {
                    oninput: (e: Event) =>
                        this.guestName.set((e.target as HTMLInputElement).value),
                },
                guestHcp: {
                    oninput: (e: Event) =>
                        this.guestHcp.set((e.target as HTMLInputElement).value),
                },
                guestBtn: {
                    disabled: () =>
                        this.claiming.get() ||
                        !this.teeId.get() ||
                        this.guestName.get().trim() === '' ||
                        this.guestHcpValue() === null,
                    onclick: () => void this.claimGuest(seat.seatId),
                },
                diag: {
                    className: () =>
                        this.diagnostics.get().length > 0
                            ? 'seat-card__diag'
                            : 'seat-card__diag hidden',
                    textContent: () =>
                        this.diagnostics.get().map((d) => d.message).join(' · '),
                },
            },
            track,
        );

        const teeSelect = new SelectComponent({
            value: this.teeId,
            options: { get: () => this.tees.get().map((tee) => ({ value: tee.id, label: tee.name })) },
            placeholder: 'Tee',
        });
        teeSelect.mount(this.ref(el, 'teeHost'));
        track(() => teeSelect.destroy());

        const genderSelect = new SelectComponent({
            value: this.guestGender,
            options: {
                get: () => [
                    { value: 'M', label: 'Men’s tee rating' },
                    { value: 'F', label: 'Women’s tee rating' },
                ],
            },
            placeholder: 'Rating',
        });
        genderSelect.mount(this.ref(el, 'genderHost'));
        track(() => genderSelect.destroy());

        return el;
    }

    render(): DocumentFragment {
        // Reactive: the round + startList load AFTER mount, and the seat list
        // changes when someone claims/releases elsewhere (reload-on-mutation).
        this.track(effect(() => this.ensureTeesLoaded()));

        const frag = this.wire(tpl, {
            root: {
                className: () => (this.state().visible ? 'seat-card' : 'seat-card hidden'),
            },
            hint: {
                className: () =>
                    (this.svc.startList.get()?.seats.length ?? 0) > 0 &&
                    this.state().blockedMessage === null
                        ? 'seat-card__hint'
                        : 'seat-card__hint hidden',
            },
            // A round whose policy admits NEITHER identity kind still lists
            // its open seats (who's missing is information) with the server's
            // humanized refusal rendered verbatim instead of the forms.
            blocked: {
                className: () =>
                    this.state().blockedMessage !== null
                        ? 'seat-card__blocked'
                        : 'seat-card__blocked hidden',
                textContent: () => this.state().blockedMessage ?? '',
            },
            err: { textContent: () => this.error.get() },
        });

        this.$each(
            this.ref(frag, 'rows'),
            () => this.svc.startList.get()?.seats ?? [],
            (seat, _i, track) => this.seatRow(seat, track),
            (seat) => seat.seatId,
        );

        // "Not me — release": the viewer's own claimed, unscored seat(s).
        this.$each(
            this.ref(frag, 'releaseRows'),
            () => releasableSeats(this.svc.startList.get()),
            (cs, _i, track) =>
                this.wireEl(
                    releaseTpl,
                    {
                        name: () => cs.displayName,
                        context: () => `holds “${cs.seatLabel}”`,
                        release: {
                            disabled: () => this.claiming.get(),
                            onclick: () => void this.release(cs.seatId),
                        },
                    },
                    track,
                ),
            (cs) => cs.seatId,
        );

        return frag;
    }
}
