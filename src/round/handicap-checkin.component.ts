import { Component, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, card, input } from '../css';
import { RoundViewService } from './round.service';
import { ProfileService } from '../profile/profile.service';
import { handicapCheckinState } from './handicap-checkin';
import { formatHandicapIndex, parseHandicapIndex } from '../create/hcp-input';

// The handicap check-in bar. `handicap-checkin.ts` decides WHETHER to ask; this
// renders the ask and the two ways out of it.
//
// An inline bar at the top of the round, not a modal: the player is about to
// tee off and the round behind it must stay reachable. Ignoring the bar is a
// legitimate answer — it costs one line of screen and asks again next round.
//
// Two shapes, same bar:
//   - has an index → "Handicap 18.4 — still right?" [Yes] [Update]
//   - has none     → "No handicap set — add one?"   [Not now] [Add]
//
// Both left-hand buttons stamp `handicap_confirmed_at` rather than merely
// hiding the bar, so "no, I really have no index" is remembered for a day
// instead of being re-asked on the next round of the morning.

const tpl = template(`
    <div bind="root" class="hcp-checkin hidden">
        <div bind="ask" class="hcp-checkin__ask">
            <span bind="question" class="hcp-checkin__question"></span>
            <div class="hcp-checkin__actions">
                <button bind="confirm" class="hcp-checkin__btn hcp-checkin__btn--ghost" type="button"></button>
                <button bind="edit" class="hcp-checkin__btn" type="button"></button>
            </div>
        </div>
        <div bind="editor" class="hcp-checkin__editor hidden">
            <label class="hcp-checkin__label" for="hcp-checkin-index">Handicap index</label>
            <div class="hcp-checkin__row">
                <input bind="field" id="hcp-checkin-index" class="hcp-checkin__field"
                       type="text" inputmode="decimal" autocomplete="off" placeholder="18.4">
                <button bind="save" class="hcp-checkin__btn" type="button">Save</button>
                <button bind="cancel" class="hcp-checkin__btn hcp-checkin__btn--ghost" type="button">Cancel</button>
            </div>
            <p class="hcp-checkin__hint">Plus handicaps as "+2.4".</p>
        </div>
        <p bind="err" class="hcp-checkin__err"></p>
    </div>
`);

export class HandicapCheckinComponent extends Component {
    static styles = `
        .hcp-checkin {
            margin-bottom: ${s('lg')};
            padding: ${s('md')} ${s('lg')};
            ${card()}
            background: ${t('surface-sunken')};

            &.hidden { display: none; }

            & .hcp-checkin__ask {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                flex-wrap: wrap;
                &.hidden { display: none; }
            }
            & .hcp-checkin__question {
                font-size: 0.9rem;
                color: ${t('text')};
            }
            & .hcp-checkin__actions {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                flex-shrink: 0;
            }
            & .hcp-checkin__editor {
                &.hidden { display: none; }
            }
            & .hcp-checkin__label {
                display: block;
                font-size: 0.8rem;
                color: ${t('text-muted')};
                margin-bottom: ${s('xs')};
            }
            & .hcp-checkin__row {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
            }
            & .hcp-checkin__field {
                ${input()}
                flex: 1;
                min-width: 0;
                font-family: inherit;
            }
            & .hcp-checkin__hint {
                margin: ${s('xs')} 0 0;
                font-size: 0.78rem;
                color: ${t('text-muted')};
            }
            & .hcp-checkin__btn {
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
            & .hcp-checkin__btn--ghost {
                ${btn()}
                padding: ${s('sm')} ${s('lg')};
                font-weight: 700;
                font-size: 0.85rem;
                background: transparent;
                color: ${t('text-muted')};
                border: 1px solid ${t('border')};
            }
            & .hcp-checkin__err {
                margin: ${s('sm')} 0 0;
                font-size: 0.85rem;
                color: ${t('error')};
                &:empty { display: none; }
            }
        }
    `;

    private svc = this.inject(RoundViewService);
    private auth = this.inject(AuthService);
    private profile = this.inject(ProfileService);

    /** Answered, updated or dismissed — down for the rest of this visit. */
    private settled = new Signal(false);
    private editing = new Signal(false);
    private text = new Signal('');
    private busy = new Signal(false);
    private error = new Signal('');

    private state() {
        const player = this.profile.player.get();
        return handicapCheckinState({
            playerId: this.auth.currentUser.get()?.id ?? null,
            balls: this.svc.balls.get(),
            firstOpen: this.svc.firstOpen.get(),
            handicapConfirmedAt: player?.handicapConfirmedAt ?? null,
            handicapIndex: player?.handicapIndex ?? null,
            profileLoaded: player !== null,
            settled: this.settled.get(),
            now: Date.now(),
        });
    }

    /**
     * The profile read the gate needs. Fetched only once the round says this
     * viewer plays here on a first open — a spectator on a share link never
     * triggers a request. `load()` is load-once per session, so the create
     * flow's copy is reused when there already is one.
     */
    private ensureProfileLoaded(): void {
        if (this.settled.get()) return;
        if (!this.svc.firstOpen.get()) return;
        if (!this.auth.currentUser.get()) return;
        if (!this.svc.balls.get().length) return;
        void this.profile.load();
    }

    private async confirm(): Promise<void> {
        if (this.busy.get()) return;
        this.error.set('');
        this.busy.set(true);
        const ok = await this.profile.confirmHandicap();
        this.busy.set(false);
        if (ok) this.settled.set(true);
        else this.error.set('Could not save that right now. Try again.');
    }

    private startEdit(): void {
        const index = this.profile.player.get()?.handicapIndex ?? null;
        this.text.set(index === null ? '' : formatHandicapIndex(index));
        this.error.set('');
        this.editing.set(true);
    }

    private async save(): Promise<void> {
        if (this.busy.get()) return;
        const index = parseHandicapIndex(this.text.get());
        if (index === null) {
            this.error.set('Enter a handicap index, e.g. 18.4 or +2.4.');
            return;
        }
        this.error.set('');
        this.busy.set(true);
        // `saveIndex` appends the history row server-side and re-reads `me`,
        // so the fresh `handicapConfirmedAt` lands on its own — the write
        // counts as a confirmation.
        const ok = await this.profile.saveIndex(index);
        this.busy.set(false);
        if (ok) {
            this.editing.set(false);
            this.settled.set(true);
        } else {
            this.error.set('Could not save that right now. Try again.');
        }
    }

    render(): DocumentFragment {
        // Reactive: the round, the session and the balls all resolve after this
        // component mounts, and a self-join mid-visit can make the viewer a
        // player in a round they opened as a spectator.
        this.track(effect(() => this.ensureProfileLoaded()));

        return this.wire(tpl, {
            root: {
                className: () => (this.state().visible ? 'hcp-checkin' : 'hcp-checkin hidden'),
            },
            ask: {
                className: () =>
                    this.editing.get() ? 'hcp-checkin__ask hidden' : 'hcp-checkin__ask',
            },
            question: {
                textContent: () => {
                    const index = this.state().index;
                    return index === null
                        ? 'No handicap set — add one?'
                        : `Handicap ${formatHandicapIndex(index)} — still right?`;
                },
            },
            confirm: {
                textContent: () => (this.state().index === null ? 'Not now' : 'Yes'),
                disabled: () => this.busy.get(),
                onclick: () => void this.confirm(),
            },
            edit: {
                textContent: () => (this.state().index === null ? 'Add' : 'Update'),
                disabled: () => this.busy.get(),
                onclick: () => this.startEdit(),
            },
            editor: {
                className: () =>
                    this.editing.get() ? 'hcp-checkin__editor' : 'hcp-checkin__editor hidden',
            },
            field: {
                value: () => this.text.get(),
                oninput: (e: Event) => this.text.set((e.target as HTMLInputElement).value),
            },
            save: {
                disabled: () => this.busy.get(),
                onclick: () => void this.save(),
            },
            cancel: {
                disabled: () => this.busy.get(),
                onclick: () => this.editing.set(false),
            },
            err: { textContent: () => this.error.get() },
        });
    }
}
