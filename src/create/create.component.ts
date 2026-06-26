import { Component, Router, template, effect, Signal } from '@basics/core/client/core';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
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
            <div bind="course" class="setup__select"></div>
        </section>

        <section class="setup__section">
            <h2>Route</h2>
            <div bind="presets" class="setup__seg"></div>
            <label class="setup__startrow">
                <span>Start hole</span>
                <div bind="startHole" class="setup__startsel"></div>
            </label>
        </section>

        <section class="setup__section">
            <h2>Players</h2>
            <p class="setup__hint">Name, handicap index, gender and tee. The course handicap is derived from the tee.</p>
            <div bind="players" class="setup__players"></div>
            <button bind="addPlayer" class="setup__add" type="button">+ Add player</button>
        </section>

        <section class="setup__section">
            <h2>Teams</h2>
            <p class="setup__hint">Optional. Group players into a team ball with a handicap allowance per member.</p>
            <div bind="teams" class="setup__fslots"></div>
            <button bind="addTeam" class="setup__add" type="button">+ Create team</button>
        </section>

        <section class="setup__section">
            <h2>Formats</h2>
            <p class="setup__hint">Each format scores a set of balls — tick the players and teams it ranks.</p>
            <div bind="formats" class="setup__fslots"></div>
            <p bind="formatNote" class="setup__note"></p>
            <button bind="addFormat" class="setup__add" type="button">+ Add format</button>
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
            <div bind="gender" class="player__gender"></div>
            <div bind="tee" class="player__tee"></div>
        </div>
        <div bind="ch" class="player__ch"></div>
        <div bind="err" class="player__err"></div>
    </div>
`);

const fslotTpl = template(`
    <div class="fslot">
        <div class="fslot__top">
            <div bind="format" class="fslot__format"></div>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <p bind="desc" class="fslot__desc"></p>

        <div class="fslot__group">
            <span class="fslot__label">Scores</span>
            <div bind="subjectRows" class="fslot__teamrows"></div>
        </div>

        <div bind="err" class="fslot__err"></div>
    </div>
`);

// A subject checkbox row (an individual player or a team), reused for both.
const subjectRowTpl = template(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`);

const teamCardTpl = template(`
    <div class="fslot">
        <div class="fslot__top">
            <span bind="teamName" class="fslot__teamname"></span>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <div class="fslot__group">
            <span class="fslot__label">Plays as</span>
            <div bind="kindSel" class="fslot__format"></div>
        </div>
        <div bind="compGroup" class="fslot__group">
            <span class="fslot__label">Composition</span>
            <div bind="formation" class="fslot__format"></div>
        </div>
        <div class="fslot__group">
            <span bind="membersLabel" class="fslot__label">Members</span>
            <div bind="memberRows" class="fslot__teamrows"></div>
            <p bind="teamMeta" class="fslot__teammeta"></p>
        </div>
    </div>
`);

const memberRowTpl = template(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
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

            & .setup__note {
                margin: ${s('sm')} 0 0; font-size: 0.82rem; color: ${t('text-muted')};
                &:empty { display: none; }
            }

            /* SelectComponent hosts: the framework styles the trigger, so the
               host just controls width/font. The wrapper fills the host (it is
               inline-block by default, which shrinks to the trigger's content),
               and the trigger's 160px min-width is relaxed so narrow controls
               (gender, team, start hole) fit instead of overflowing. */
            & .ui-select { display: block; width: 100%; }
            & .ui-select__trigger { min-width: 0; }

            & .setup__select { width: 100%; font-size: 1rem; }
            & .setup__startsel { width: 110px; font-size: 0.95rem; }

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
                & .player__fields { display: flex; gap: ${s('sm')}; align-items: stretch; }
                & .player__index { flex: 1; min-width: 0; padding: ${s('md')}; font-size: 1rem; ${input()} }
                & .player__gender { width: 72px; flex-shrink: 0; font-size: 1rem; }
                & .player__tee { flex: 1; min-width: 0; font-size: 1rem; }

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

            & .setup__fslots { display: flex; flex-direction: column; gap: ${s('md')}; }

            & .fslot {
                padding: ${s('md')}; ${card()}
                display: flex; flex-direction: column; gap: ${s('sm')};

                & .fslot__top { display: flex; gap: ${s('sm')}; align-items: center; }
                & .fslot__teamname { flex: 1; min-width: 0; font-weight: 700; font-size: 0.95rem; }
                & .fslot__teammeta {
                    margin: ${s('xs')} 0 0; font-size: 0.78rem; color: ${t('text-muted')};
                    &:empty { display: none; }
                }
                & .fslot__format { flex: 1; min-width: 0; font-size: 1rem; }
                & .fslot__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${btn()}
                    font-size: 1rem; color: ${t('text-muted')};
                }
                & .fslot__desc {
                    margin: 0; font-size: 0.8rem; color: ${t('text-muted')};
                    &:empty { display: none; }
                }

                & .fslot__group {
                    display: flex; flex-direction: column; gap: ${s('xs')};
                    &[hidden] { display: none; }
                }
                & .fslot__label {
                    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em;
                    text-transform: uppercase; color: ${t('text-muted')};
                }

                & .fslot__teamrows { display: flex; flex-direction: column; gap: ${s('xs')}; }
                & .trow {
                    display: flex; align-items: center; justify-content: space-between; gap: ${s('sm')};
                    & .trow__name { font-size: 0.9rem; }
                    & .trow__team { width: 96px; flex-shrink: 0; font-size: 0.95rem; }
                }

                & .irow {
                    display: flex; align-items: center; gap: ${s('sm')};
                    font-size: 0.9rem; cursor: pointer;
                    & .irow__chk { width: 18px; height: 18px; flex-shrink: 0; accent-color: ${t('primary')}; }
                }

                & .mrow {
                    display: flex; align-items: center; justify-content: space-between; gap: ${s('sm')};
                    & .mrow__pick { display: flex; align-items: center; gap: ${s('sm')}; font-size: 0.9rem; cursor: pointer; }
                    & .mrow__pct {
                        display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
                        font-size: 0.85rem; color: ${t('text-muted')};
                        &[hidden] { display: none; }
                        & input { width: 56px; padding: ${s('xs')} ${s('sm')}; ${input()} font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${s('xs')};
                    & button {
                        flex: 1; padding: ${s('sm')} 0; ${btn()}
                        font-family: inherit; font-weight: 700; font-size: 0.82rem;
                        &.on { background: ${t('primary')}; color: ${t('primary-text')}; border-color: ${t('primary')}; }
                    }
                }
                & .fslot__flat {
                    display: flex; align-items: center; gap: ${s('xs')}; font-size: 0.9rem;
                    color: ${t('text-muted')};
                    &[hidden] { display: none; }
                    & .fslot__pct { width: 70px; padding: ${s('sm')}; font-size: 1rem; ${input()} }
                }
                & .fslot__bands {
                    display: flex; flex-direction: column; gap: ${s('xs')};
                    &[hidden] { display: none; }
                }
                & .fslot__bandrows { display: flex; flex-direction: column; gap: ${s('xs')}; }
                & .brow {
                    display: flex; align-items: center; gap: ${s('xs')};
                    font-size: 0.82rem; color: ${t('text-muted')};
                    & .brow__pct, & .brow__upto { width: 56px; padding: ${s('sm')}; font-size: 0.95rem; ${input()} }
                    & .brow__del { margin-left: auto; width: 30px; height: 30px; ${btn()} font-size: 0.8rem; color: ${t('text-muted')}; }
                }
                & .fslot__addband {
                    align-self: flex-start; padding: ${s('xs')} ${s('sm')}; ${btn()}
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                }

                & .fslot__err {
                    font-size: 0.82rem; color: ${t('error')};
                    &:empty { display: none; }
                }
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
            addPlayer: { onclick: () => this.svc.addPlayer() },
            addTeam: { onclick: () => this.svc.addTeam() },
            addFormat: { onclick: () => this.svc.addFormatSlot() },
            formatNote: {
                textContent: () => {
                    const out = this.svc.playersInNoFormat();
                    if (out.length === 0) return '';
                    const who = out.map((p) => p.name.trim() || 'A player').join(', ');
                    return `Heads up: ${who} ${out.length > 1 ? "aren't" : "isn't"} in any format yet — they won't be scored.`;
                },
            },
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

        // Course + start-hole pickers (framework SelectComponent — a styled
        // overlay dropdown that renders consistently on mobile, unlike native
        // <select>). Top-level, so they track at component scope.
        const compTrack = (d: () => void) => this.track(d);
        this.mountSelect(this.ref(frag, 'course'), compTrack, {
            value: this.bound(
                compTrack,
                () => this.svc.courseId.get(),
                (v) => {
                    // selectCourse loads tees + resets route; skip the no-op init write.
                    if (v && v !== this.svc.courseId.get()) void this.svc.selectCourse(v);
                },
            ),
            // Grouped by club: a non-selectable club header before each club's
            // courses. svc.courses arrives ordered by club then course name
            // (setup API), so headers drop in wherever the club changes.
            options: {
                get: () => {
                    const opts: SelectOption[] = [];
                    let lastClub = '';
                    for (const c of this.svc.courses.get()) {
                        if (c.clubName !== lastClub) {
                            opts.push({ value: `__club:${c.clubName}`, label: c.clubName, disabled: true });
                            lastClub = c.clubName;
                        }
                        opts.push({ value: c.id, label: c.name });
                    }
                    return opts;
                },
            },
            placeholder: 'Select a course',
        });
        this.mountSelect(this.ref(frag, 'startHole'), compTrack, {
            value: this.bound(
                compTrack,
                () => String(this.svc.startHole.get()),
                (v) => this.svc.startHole.set(Number(v)),
            ),
            options: { get: () => this.svc.startHoleOptions().map((n) => ({ value: String(n), label: String(n) })) },
        });

        // Editable player rows. Keyed by stable `key` so a field edit never
        // recreates the row (keeps input focus). Reactive reads look the player
        // up by key — never the closed-over snapshot, which goes stale on patch.
        this.$each(
            this.ref(frag, 'players'),
            this.svc.players,
            (p, _i, track) => this.playerRow(p.key, track),
            (p) => p.key,
        );

        // Round-level team cards (ADR-0003).
        this.$each(
            this.ref(frag, 'teams'),
            this.svc.teams,
            (team, _i, track) => this.teamCard(team.key, track),
            (team) => team.key,
        );

        // Format slots. Keyed by stable slot key; each card reads its slot by
        // key so reorder/edit never recreates the card (focus + carets intact).
        this.$each(
            this.ref(frag, 'formats'),
            this.svc.formatSlots,
            (slot, i, track) => this.formatCard(slot.key, i, track),
            (slot) => slot.key,
        );

        return frag;
    }

    /**
     * Mount a framework `SelectComponent` into a host, disposing it through the
     * caller's `track` (so a select inside a keyed row tears down with the row —
     * `spawn` self-tracks at component scope, which would leak here).
     */
    private mountSelect(
        host: HTMLElement,
        track: (d: () => void) => void,
        props: { value: Signal<string>; options: { get: () => SelectOption[] }; placeholder?: string },
    ): void {
        const child = new SelectComponent(props);
        child.mount(host);
        track(() => child.destroy());
    }

    /**
     * A `Signal<string>` two-way bridged to service state, for `SelectComponent`
     * (which owns a value signal, not a change callback). `read` is tracked so
     * service→signal stays reactive; the signal→service `write` is deferred to a
     * microtask so its own service reads aren't tracked — otherwise the effect
     * would re-subscribe to those signals and loop. `Signal.set`'s Object.is
     * dedupe keeps both directions from ping-ponging.
     */
    private bound(
        track: (d: () => void) => void,
        read: () => string,
        write: (v: string) => void,
    ): Signal<string> {
        const sig = new Signal(read());
        track(effect(() => sig.set(read())));
        track(
            effect(() => {
                const v = sig.get();
                queueMicrotask(() => write(v));
            }),
        );
        return sig;
    }

    /**
     * Like `$each` but disposes its effect through the caller's `track`, so a
     * nested list inside a keyed row is torn down with that row (the built-in
     * `$each` self-tracks at component scope — fine at the top level, a leak
     * when nested). Used for the per-slot team + band lists.
     */
    private eachInto<T>(
        host: HTMLElement,
        track: (d: () => void) => void,
        read: () => T[],
        renderer: (item: T, index: number, track: (d: () => void) => void) => HTMLElement,
        key: (item: T, index: number) => string | number,
    ): void {
        const nodes = new Map<string | number, HTMLElement>();
        const scopes = new Map<string | number, (() => void)[]>();
        track(() => {
            for (const fns of scopes.values()) fns.forEach((d) => d());
            scopes.clear();
        });
        track(
            effect(() => {
                const list = read();
                const next = new Map<string | number, HTMLElement>();
                for (const [i, item] of list.entries()) {
                    const k = key(item, i);
                    if (nodes.has(k)) {
                        next.set(k, nodes.get(k)!);
                    } else {
                        const disp: (() => void)[] = [];
                        next.set(k, renderer(item, i, (d) => disp.push(d)));
                        scopes.set(k, disp);
                    }
                }
                for (const [k, node] of nodes) {
                    if (!next.has(k)) {
                        node.remove();
                        scopes.get(k)?.forEach((d) => d());
                        scopes.delete(k);
                    }
                }
                let cursor = host.firstChild;
                for (const node of next.values()) {
                    if (node === cursor) cursor = cursor.nextSibling;
                    else host.insertBefore(node, cursor);
                }
                nodes.clear();
                for (const [k, v] of next) nodes.set(k, v);
            }),
        );
    }

    private formatCard(key: number, index: number, track: (d: () => void) => void): HTMLElement {
        const slot = () => this.svc.slotByKey(key);
        const formatId = () => slot()?.formatId ?? '';

        const el = this.wireEl(
            fslotTpl,
            {
                remove: { onclick: () => this.svc.removeFormatSlot(key) },
                desc: { textContent: () => this.svc.catalog.byId(formatId())?.description ?? '' },
                err: {
                    textContent: () =>
                        this.svc
                            .diagnosticsForFormat(index)
                            .map((d) => d.message)
                            .join(' · '),
                },
            },
            track,
        );

        this.mountSelect(this.ref(el, 'format'), track, {
            value: this.bound(
                track,
                () => formatId(),
                (v) => {
                    if (v && v !== this.svc.slotByKey(key)?.formatId) this.svc.setSlotFormat(key, v);
                },
            ),
            options: {
                get: () => this.svc.catalog.descriptors.get().map((d) => ({ value: d.id, label: d.label })),
            },
        });

        // Subject checklist — what this format can score. A SIDE format
        // (better-ball) scores multi-ball (side) teams only; a BALL format scores
        // individual players + single-ball teams. One keyed list (kind-prefixed)
        // so a single eachInto owns the host.
        type Subj = { kind: 'player' | 'team'; subKey: number };
        const subjects = (): Subj[] => {
            const side = this.svc.isSideFormat(formatId());
            const out: Subj[] = [];
            if (!side) {
                out.push(...this.svc.players.get().map((p) => ({ kind: 'player' as const, subKey: p.key })));
            }
            for (const tm of this.svc.teams.get()) {
                if ((tm.kind === 'multi_ball') === side) out.push({ kind: 'team' as const, subKey: tm.key });
            }
            return out;
        };
        this.eachInto(
            this.ref(el, 'subjectRows'),
            track,
            subjects,
            (sj, _i, rowTrack) => this.subjectRow(key, sj.kind, sj.subKey, rowTrack),
            (sj) => `${sj.kind}${sj.subKey}`,
        );

        return el;
    }

    private subjectRow(
        slotKey: number,
        kind: 'player' | 'team',
        subKey: number,
        track: (d: () => void) => void,
    ): HTMLElement {
        const label = (): string => {
            if (kind === 'player') return this.svc.players.get().find((p) => p.key === subKey)?.name?.trim() || 'Player';
            const tm = this.svc.teamByKey(subKey);
            if (!tm) return 'Team';
            return `${this.svc.teamLabel(tm)} (${tm.kind === 'multi_ball' ? 'side' : 'team'})`;
        };
        const checked = () =>
            kind === 'player' ? this.svc.subjectPlayerIn(slotKey, subKey) : this.svc.subjectTeamIn(slotKey, subKey);
        const setIn = (v: boolean) =>
            kind === 'player'
                ? this.svc.setSubjectPlayer(slotKey, subKey, v)
                : this.svc.setSubjectTeam(slotKey, subKey, v);
        return this.wireEl(
            subjectRowTpl,
            {
                chk: { checked: () => checked(), onchange: (e: Event) => setIn((e.target as HTMLInputElement).checked) },
                name: { textContent: () => label() },
            },
            track,
        );
    }

    private teamCard(key: number, track: (d: () => void) => void): HTMLElement {
        const isSide = () => this.svc.teamKindOf(key) === 'multi_ball';
        const el = this.wireEl(
            teamCardTpl,
            {
                remove: { onclick: () => this.svc.removeTeam(key) },
                teamName: {
                    textContent: () => {
                        const tm = this.svc.teamByKey(key);
                        return tm ? this.svc.teamLabel(tm) : 'Team';
                    },
                },
                // Composition + per-member allowance only apply to a single-ball
                // (merged) team; a side just lists its member balls.
                compGroup: { hidden: () => isSide() },
                membersLabel: { textContent: () => (isSide() ? 'Members (each a ball)' : 'Members & allowance') },
                teamMeta: {
                    textContent: () => {
                        const size = this.svc.teamSize(key);
                        if (size === 0) {
                            return isSide()
                                ? 'Tick at least 2 members — a side needs ≥2 balls.'
                                : 'Tick at least 2 players to form a team ball.';
                        }
                        if (size < 2) return 'Add one more member — a team needs at least 2.';
                        if (isSide()) return `${size} balls · a side (best ball per hole)`;
                        const ch = this.svc.teamBallCh(key);
                        return ch === null ? `${size} players` : `${size} players · plays off CH ${ch}`;
                    },
                },
            },
            track,
        );
        // "Plays as" — single combined ball (composition) vs separate balls (side).
        this.mountSelect(this.ref(el, 'kindSel'), track, {
            value: this.bound(
                track,
                () => this.svc.teamKindOf(key),
                (v) => this.svc.setTeamKind(key, v === 'multi_ball' ? 'multi_ball' : 'single_ball'),
            ),
            options: {
                get: () => [
                    { value: 'single_ball', label: 'One combined ball' },
                    { value: 'multi_ball', label: 'Separate balls (a side)' },
                ],
            },
        });
        this.mountSelect(this.ref(el, 'formation'), track, {
            value: this.bound(
                track,
                () => this.svc.teamByKey(key)?.formation ?? 'scramble',
                (v) => this.svc.setTeamFormation(key, v),
            ),
            options: {
                get: () => this.svc.formations.map((f) => ({ value: f, label: f[0]!.toUpperCase() + f.slice(1) })),
            },
        });
        // Members: every player, plus (for a side) every eligible single-ball
        // team — a side can nest combined-ball teams as its balls (ADR-0003).
        type MRow = { kind: 'player' | 'team'; mKey: number };
        this.eachInto(
            this.ref(el, 'memberRows'),
            track,
            () => {
                const rows: MRow[] = this.svc.players.get().map((p) => ({ kind: 'player' as const, mKey: p.key }));
                if (isSide()) {
                    for (const t of this.svc.eligibleNestedTeams(key)) rows.push({ kind: 'team' as const, mKey: t.key });
                }
                return rows;
            },
            (r, _i, rowTrack) =>
                r.kind === 'player'
                    ? this.teamMemberRow(key, r.mKey, rowTrack)
                    : this.teamNestedRow(key, r.mKey, rowTrack),
            (r) => `${r.kind}${r.mKey}`,
        );
        return el;
    }

    /** A side member that is itself a single-ball team (nested). Checkbox + the
     * team's label; no allowance (the nested team carries its own merge %s). */
    private teamNestedRow(
        sideKey: number,
        memberTeamKey: number,
        track: (d: () => void) => void,
    ): HTMLElement {
        const inSide = () => this.svc.teamHasTeamMember(sideKey, memberTeamKey);
        return this.wireEl(
            memberRowTpl,
            {
                chk: {
                    checked: () => inSide(),
                    disabled: () => !inSide() && this.svc.teamAtMaxSize(sideKey),
                    onchange: (e: Event) =>
                        this.svc.setTeamMemberTeam(sideKey, memberTeamKey, (e.target as HTMLInputElement).checked),
                },
                name: {
                    textContent: () => {
                        const t = this.svc.teamByKey(memberTeamKey);
                        return t ? `${this.svc.teamLabel(t)} (combined ball)` : 'Team';
                    },
                },
                pctWrap: { hidden: () => true },
                pct: { value: '100', oninput: () => {} },
            },
            track,
        );
    }

    private teamMemberRow(
        teamKey: number,
        playerKey: number,
        track: (d: () => void) => void,
    ): HTMLElement {
        const player = () => this.svc.players.get().find((p) => p.key === playerKey) ?? null;
        const inTeam = () => this.svc.teamMemberIn(teamKey, playerKey);
        return this.wireEl(
            memberRowTpl,
            {
                chk: {
                    checked: () => inTeam(),
                    // At the 10-player cap, only already-ticked members stay toggleable.
                    disabled: () => !inTeam() && this.svc.teamAtMaxSize(teamKey),
                    onchange: (e: Event) =>
                        this.svc.setTeamMember(teamKey, playerKey, (e.target as HTMLInputElement).checked),
                },
                name: { textContent: () => player()?.name?.trim() || 'Player' },
                // A side member has no merge allowance — only single-ball teams do.
                pctWrap: { hidden: () => !inTeam() || this.svc.teamKindOf(teamKey) === 'multi_ball' },
                // Uncontrolled: static initial value, oninput-only (no caret reset).
                pct: {
                    value: this.svc.teamByKey(teamKey)?.pctByPlayer[playerKey] ?? '100',
                    oninput: (e: Event) => this.svc.setTeamPct(teamKey, playerKey, (e.target as HTMLInputElement).value),
                },
            },
            track,
        );
    }

    private playerRow(key: number, track: (d: () => void) => void): HTMLElement {
        const current = () => this.svc.players.get().find((p) => p.key === key) ?? null;
        const currentIndex = () => this.svc.players.get().findIndex((p) => p.key === key);

        const el = this.wireEl(
            playerTpl,
            {
                // Uncontrolled text inputs: no reactive `value` binding (would
                // reset the caret on every keystroke). Initial value is empty.
                name: { oninput: (e: Event) => this.svc.patchPlayer(key, { name: (e.target as HTMLInputElement).value }) },
                index: { oninput: (e: Event) => this.svc.patchPlayer(key, { handicapIndex: (e.target as HTMLInputElement).value }) },
                remove: { onclick: () => this.svc.removePlayer(key) },
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

        this.mountSelect(this.ref(el, 'gender'), track, {
            value: this.bound(
                track,
                () => current()?.gender ?? 'M',
                (v) => this.svc.patchPlayer(key, { gender: v as 'M' | 'F' }),
            ),
            options: { get: () => [{ value: 'M', label: 'M' }, { value: 'F', label: 'F' }] },
        });
        this.mountSelect(this.ref(el, 'tee'), track, {
            value: this.bound(
                track,
                () => current()?.teeId ?? '',
                (v) => this.svc.patchPlayer(key, { teeId: v }),
            ),
            options: { get: () => this.svc.tees.get().map((tee) => ({ value: tee.id, label: tee.name })) },
            placeholder: 'Tee',
        });
        return el;
    }
}
