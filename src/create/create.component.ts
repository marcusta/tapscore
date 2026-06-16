import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { SetupService, type PlayerForm, type RoutePreset } from './setup.service';

// Phase 2.6e M2 — the real no-login setup flow. Pick a course + route, add
// players (name · handicap index · gender · per-player tee) with the derived
// course handicap shown live, then submit a RoundSetupDraft to the no-auth
// friendly-rounds front door and land in the round. Formats are M3: M2 attaches
// a single default `stableford_individual` so the round is valid and openable.

const PRESETS: RoutePreset[] = ['full_18', 'front_9', 'back_9'];

const tpl = template(`
    <div class="setup">
        <button bind="back" class="setup__back" type="button">← Rounds</button>
        <header class="setup__head">
            <h1>New round</h1>
            <p>No sign-in required.</p>
        </header>

        <section class="setup__section">
            <h2>Course</h2>
            <select bind="course" class="setup__select"></select>
        </section>

        <section class="setup__section">
            <h2>Route</h2>
            <div bind="presets" class="setup__seg"></div>
            <label class="setup__startrow">
                <span>Start hole</span>
                <select bind="startHole" class="setup__startsel"></select>
            </label>
        </section>

        <section class="setup__section">
            <h2>Players</h2>
            <p class="setup__hint">Name, handicap index, gender and tee. The course handicap is derived from the tee.</p>
            <div bind="players" class="setup__players"></div>
            <button bind="addPlayer" class="setup__add" type="button">+ Add player</button>
        </section>

        <div bind="banner" class="setup__banner"></div>
        <button bind="create" class="setup__create" type="button">Create round</button>
    </div>
`);

const playerTpl = template(`
    <div class="player">
        <div class="player__top">
            <input bind="name" class="player__name" placeholder="Player name" />
            <button bind="remove" class="player__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <div class="player__fields">
            <input bind="index" class="player__index" inputmode="decimal" placeholder="HCP index" />
            <select bind="gender" class="player__gender"></select>
            <select bind="tee" class="player__tee"></select>
        </div>
        <div bind="ch" class="player__ch"></div>
        <div bind="err" class="player__err"></div>
    </div>
`);

export class CreateComponent extends Component {
    static styles = `
        .setup {
            padding: ${s('lg')} ${s('lg')} ${s('2xl')};

            & .setup__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${t('text-muted')};
                cursor: pointer; padding: ${s('xs')} 0; margin-bottom: ${s('md')};
            }

            & .setup__head {
                margin-bottom: ${s('xl')};
                & h1 {
                    margin: 0; font-family: ${t('font-display')}; font-weight: 600;
                    font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem; }
            }

            & .setup__section {
                margin-bottom: ${s('xl')};
                & h2 {
                    margin: 0 0 ${s('sm')}; font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .setup__hint { margin: 0 0 ${s('md')}; color: ${t('text-muted')}; font-size: 0.82rem; }

            & .setup__select, & .setup__startsel {
                width: 100%; padding: ${s('md')}; font-size: 1rem;
                ${input()}
            }

            & .setup__seg {
                display: flex; gap: ${s('sm')}; margin-bottom: ${s('md')};
                & button {
                    flex: 1; padding: ${s('md')} 0; ${btn()}
                    font-family: inherit; font-weight: 700; font-size: 0.9rem;
                    &.on { background: ${t('primary')}; color: ${t('primary-text')}; border-color: ${t('primary')}; }
                }
            }

            & .setup__startrow {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${s('md')}; font-size: 0.9rem; color: ${t('text-muted')};
                & .setup__startsel { width: 100px; padding: ${s('sm')}; font-size: 0.95rem; }
            }

            & .setup__players { display: flex; flex-direction: column; gap: ${s('md')}; }

            & .player {
                padding: ${s('md')}; ${card()}
                display: flex; flex-direction: column; gap: ${s('sm')};

                & .player__top { display: flex; gap: ${s('sm')}; align-items: center; }
                & .player__name { flex: 1; padding: ${s('md')}; font-size: 1rem; ${input()} }
                & .player__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${btn()}
                    font-size: 1rem; color: ${t('text-muted')};
                }
                & .player__fields { display: flex; gap: ${s('sm')}; }
                & .player__index { flex: 1; min-width: 0; padding: ${s('md')}; font-size: 1rem; ${input()} }
                & .player__gender { width: 64px; flex-shrink: 0; padding: ${s('md')} ${s('sm')}; font-size: 1rem; ${input()} }
                & .player__tee { flex: 1; min-width: 0; padding: ${s('md')} ${s('sm')}; font-size: 1rem; ${input()} }

                & .player__ch {
                    font-size: 0.82rem; color: ${t('text-muted')}; font-variant-numeric: tabular-nums;
                    &:empty { display: none; }
                }
                & .player__err {
                    font-size: 0.82rem; color: ${t('error')};
                    &:empty { display: none; }
                }
            }

            & .setup__add {
                width: 100%; margin-top: ${s('md')}; padding: ${s('md')}; ${btn()}
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }

            & .setup__banner {
                color: ${t('error')}; font-size: 0.875rem; margin-bottom: ${s('md')};
                white-space: pre-line;
                &:empty { display: none; }
            }

            & .setup__create {
                width: 100%; padding: ${s('lg')}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit; ${btn()}
                background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                box-shadow: ${t('shadow-elevated')};
                &:hover { background: ${t('primary')}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;

    private svc = this.inject(SetupService);
    private router = this.inject(Router);

    render(): DocumentFragment {
        void this.svc.load();

        const frag = this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/') },
            course: {
                innerHTML: () =>
                    this.svc.courses
                        .get()
                        .map((c) => `<option value="${c.id}">${c.name}</option>`)
                        .join(''),
                value: () => this.svc.courseId.get(),
                onchange: (e: Event) =>
                    void this.svc.selectCourse((e.target as HTMLSelectElement).value),
            },
            startHole: {
                innerHTML: () =>
                    this.svc
                        .startHoleOptions()
                        .map((n) => `<option value="${n}">${n}</option>`)
                        .join(''),
                value: () => String(this.svc.startHole.get()),
                onchange: (e: Event) =>
                    this.svc.startHole.set(Number((e.target as HTMLSelectElement).value)),
            },
            addPlayer: { onclick: () => this.svc.addPlayer() },
            banner: {
                textContent: () => {
                    const msgs = [
                        ...this.svc.generalDiagnostics().map((d) => d.message),
                        ...(this.svc.submitError.get() ? [this.svc.submitError.get()!] : []),
                    ];
                    return msgs.join('\n');
                },
            },
            create: {
                disabled: () => this.svc.submitting.get(),
                textContent: () => (this.svc.submitting.get() ? 'Creating…' : 'Create round'),
                onclick: async () => {
                    const result = await this.svc.submit();
                    if (result.ok) {
                        this.router.navigate('/round', { query: { token: result.token } });
                    }
                },
            },
        });

        // Route preset segmented control.
        this.$each(
            this.ref(frag, 'presets'),
            () => PRESETS,
            (p, _i, track) =>
                this.wireEl(
                    template(`<button bind="b" type="button"></button>`),
                    {
                        b: {
                            textContent: () => this.svc.presetLabel(p),
                            className: () => (this.svc.preset.get() === p ? 'on' : ''),
                            onclick: () => this.svc.setPreset(p),
                        },
                    },
                    track,
                ),
            (p) => p,
        );

        // Editable player rows. Keyed by stable `key` so a field edit never
        // recreates the row (keeps input focus). Reactive reads look the player
        // up by key — never the closed-over snapshot, which goes stale on patch.
        this.$each(
            this.ref(frag, 'players'),
            this.svc.players,
            (p, _i, track) => this.playerRow(p.key, track),
            (p) => p.key,
        );

        return frag;
    }

    private playerRow(key: number, track: (d: () => void) => void): HTMLElement {
        const current = () => this.svc.players.get().find((p) => p.key === key) ?? null;
        const currentIndex = () => this.svc.players.get().findIndex((p) => p.key === key);

        return this.wireEl(
            playerTpl,
            {
                // Uncontrolled text inputs: no reactive `value` binding (would
                // reset the caret on every keystroke). Initial value is empty.
                name: { oninput: (e: Event) => this.svc.patchPlayer(key, { name: (e.target as HTMLInputElement).value }) },
                index: { oninput: (e: Event) => this.svc.patchPlayer(key, { handicapIndex: (e.target as HTMLInputElement).value }) },
                remove: { onclick: () => this.svc.removePlayer(key) },
                gender: {
                    innerHTML: () => `<option value="M">M</option><option value="F">F</option>`,
                    value: () => current()?.gender ?? 'M',
                    onchange: (e: Event) =>
                        this.svc.patchPlayer(key, { gender: (e.target as HTMLSelectElement).value as 'M' | 'F' }),
                },
                tee: {
                    innerHTML: () =>
                        this.svc.tees
                            .get()
                            .map((tee) => `<option value="${tee.id}">${tee.name}</option>`)
                            .join(''),
                    value: () => current()?.teeId ?? '',
                    onchange: (e: Event) =>
                        this.svc.patchPlayer(key, { teeId: (e.target as HTMLSelectElement).value }),
                },
                ch: {
                    textContent: () => {
                        const p = current();
                        if (!p) return '';
                        const d = this.svc.derivedCH(p);
                        if (!d) return '';
                        const r = d.rating;
                        // Arithmetic visible: index × slope/113 + (CR − par).
                        return `Course handicap ${d.ch}  ·  ${p.handicapIndex} × ${r.slope}/113 + (${r.courseRating} − ${r.par}) = ${d.raw.toFixed(1)}`;
                    },
                },
                err: {
                    textContent: () =>
                        this.svc
                            .diagnosticsForPlayer(currentIndex())
                            .map((d) => d.message)
                            .join(' · '),
                },
            },
            track,
        );
    }
}
