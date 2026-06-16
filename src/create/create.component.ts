import { Component, Router, template, effect } from '@basics/core/client/core';
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

        <section class="setup__section">
            <h2>Formats</h2>
            <p class="setup__hint">One or more scoring formats. Teams and allowance are set per format.</p>
            <div bind="formats" class="setup__fslots"></div>
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
            <select bind="gender" class="player__gender"></select>
            <select bind="tee" class="player__tee"></select>
        </div>
        <div bind="ch" class="player__ch"></div>
        <div bind="err" class="player__err"></div>
    </div>
`);

const fslotTpl = template(`
    <div class="fslot">
        <div class="fslot__top">
            <select bind="format" class="fslot__format"></select>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <p bind="desc" class="fslot__desc"></p>

        <div bind="teamsWrap" class="fslot__group">
            <span class="fslot__label">Teams</span>
            <div bind="teamRows" class="fslot__teamrows"></div>
        </div>

        <div bind="includeWrap" class="fslot__group">
            <span class="fslot__label">Players</span>
            <div bind="includeRows" class="fslot__teamrows"></div>
        </div>

        <div class="fslot__group">
            <span class="fslot__label">Allowance</span>
            <div class="fslot__seg">
                <button bind="flatBtn" type="button">Flat</button>
                <button bind="splitBtn" type="button">Split</button>
            </div>
            <div bind="flatWrap" class="fslot__flat">
                <input bind="flatPct" class="fslot__pct" inputmode="numeric" /><span>%</span>
            </div>
            <div bind="bandsWrap" class="fslot__bands">
                <div bind="bandRows" class="fslot__bandrows"></div>
                <button bind="addBand" type="button" class="fslot__addband">+ Band</button>
            </div>
        </div>

        <div bind="err" class="fslot__err"></div>
    </div>
`);

const teamRowTpl = template(`
    <label class="trow">
        <span bind="name" class="trow__name"></span>
        <select bind="team" class="trow__team"></select>
    </label>
`);

const includeRowTpl = template(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`);

const bandRowTpl = template(`
    <div class="brow">
        <input bind="pct" class="brow__pct" inputmode="numeric" /><span>% up to CH</span>
        <input bind="upto" class="brow__upto" inputmode="numeric" placeholder="∞" />
        <button bind="del" class="brow__del" type="button" aria-label="Remove band">✕</button>
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

            & .setup__fslots { display: flex; flex-direction: column; gap: ${s('md')}; }

            & .fslot {
                padding: ${s('md')}; ${card()}
                display: flex; flex-direction: column; gap: ${s('sm')};

                & .fslot__top { display: flex; gap: ${s('sm')}; align-items: center; }
                & .fslot__format { flex: 1; padding: ${s('md')} ${s('sm')}; font-size: 1rem; ${input()} }
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
                    & .trow__team { width: 90px; flex-shrink: 0; padding: ${s('sm')}; font-size: 0.95rem; ${input()} }
                }

                & .irow {
                    display: flex; align-items: center; gap: ${s('sm')};
                    font-size: 0.9rem; cursor: pointer;
                    & .irow__chk { width: 18px; height: 18px; flex-shrink: 0; accent-color: ${t('primary')}; }
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
            addFormat: { onclick: () => this.svc.addFormatSlot() },
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
        const mode = () => slot()?.allowanceMode ?? 'flat';

        const el = this.wireEl(
            fslotTpl,
            {
                format: {
                    innerHTML: () =>
                        this.svc.catalog
                            .descriptors.get()
                            .map((d) => `<option value="${d.id}">${d.label}</option>`)
                            .join(''),
                    value: () => formatId(),
                    onchange: (e: Event) =>
                        this.svc.setSlotFormat(key, (e.target as HTMLSelectElement).value),
                },
                remove: { onclick: () => this.svc.removeFormatSlot(key) },
                desc: {
                    textContent: () => this.svc.catalog.byId(formatId())?.description ?? '',
                },
                teamsWrap: { hidden: () => !this.svc.catalog.needsTeams(formatId()) },
                // Individual formats get a subset picker instead of a team editor.
                includeWrap: { hidden: () => this.svc.catalog.needsTeams(formatId()) },
                flatBtn: {
                    className: () => (mode() === 'flat' ? 'on' : ''),
                    onclick: () => this.svc.patchFormatSlot(key, { allowanceMode: 'flat' }),
                },
                splitBtn: {
                    className: () => (mode() === 'split' ? 'on' : ''),
                    onclick: () => this.svc.patchFormatSlot(key, { allowanceMode: 'split' }),
                },
                flatWrap: { hidden: () => mode() !== 'flat' },
                bandsWrap: { hidden: () => mode() !== 'split' },
                // Uncontrolled: static initial value, oninput-only (no caret reset).
                flatPct: {
                    value: slot()?.flatPct ?? '100',
                    oninput: (e: Event) =>
                        this.svc.patchFormatSlot(key, { flatPct: (e.target as HTMLInputElement).value }),
                },
                addBand: { onclick: () => this.svc.addBand(key) },
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

        // Per-player team assignment (team formats only).
        this.eachInto(
            this.ref(el, 'teamRows'),
            track,
            () => this.svc.players.get(),
            (p, _i, rowTrack) => this.teamRow(key, p.key, rowTrack),
            (p) => p.key,
        );

        // Per-player subset picker (individual formats only).
        this.eachInto(
            this.ref(el, 'includeRows'),
            track,
            () => this.svc.players.get(),
            (p, _i, rowTrack) => this.includeRow(key, p.key, rowTrack),
            (p) => p.key,
        );

        // Split allowance bands.
        this.eachInto(
            this.ref(el, 'bandRows'),
            track,
            () => this.svc.slotByKey(key)?.bands ?? [],
            (b, _i, rowTrack) => this.bandRow(key, b.key, rowTrack),
            (b) => b.key,
        );

        return el;
    }

    private teamRow(
        slotKey: number,
        playerKey: number,
        track: (d: () => void) => void,
    ): HTMLElement {
        const player = () => this.svc.players.get().find((p) => p.key === playerKey) ?? null;
        const assignment = () => this.svc.slotByKey(slotKey)?.teamByPlayer[playerKey] ?? -1;
        return this.wireEl(
            teamRowTpl,
            {
                name: { textContent: () => player()?.name?.trim() || 'Player' },
                team: {
                    // One effect builds the options AND marks the current pick via
                    // `selected` — a separate reactive `value` can fire before the
                    // option exists (on format switch) and silently reset to —.
                    innerHTML: () => {
                        const n = this.svc.teamBucketCount(this.svc.slotByKey(slotKey)?.formatId ?? '');
                        const cur = assignment();
                        const opt = (v: number, label: string) =>
                            `<option value="${v}"${v === cur ? ' selected' : ''}>${label}</option>`;
                        const opts = [opt(-1, '—')];
                        for (let i = 0; i < n; i++) opts.push(opt(i, this.svc.teamLetter(i)));
                        return opts.join('');
                    },
                    onchange: (e: Event) =>
                        this.svc.setPlayerTeam(
                            slotKey,
                            playerKey,
                            Number((e.target as HTMLSelectElement).value),
                        ),
                },
            },
            track,
        );
    }

    private includeRow(
        slotKey: number,
        playerKey: number,
        track: (d: () => void) => void,
    ): HTMLElement {
        const player = () => this.svc.players.get().find((p) => p.key === playerKey) ?? null;
        return this.wireEl(
            includeRowTpl,
            {
                chk: {
                    checked: () => this.svc.isPlayerIncluded(slotKey, playerKey),
                    onchange: (e: Event) =>
                        this.svc.setPlayerIncluded(
                            slotKey,
                            playerKey,
                            (e.target as HTMLInputElement).checked,
                        ),
                },
                name: { textContent: () => player()?.name?.trim() || 'Player' },
            },
            track,
        );
    }

    private bandRow(
        slotKey: number,
        bandKey: number,
        track: (d: () => void) => void,
    ): HTMLElement {
        const band = () => this.svc.slotByKey(slotKey)?.bands.find((b) => b.key === bandKey) ?? null;
        return this.wireEl(
            bandRowTpl,
            {
                // Uncontrolled inputs: static initial value, oninput-only.
                pct: {
                    value: band()?.pct ?? '',
                    oninput: (e: Event) =>
                        this.svc.patchBand(slotKey, bandKey, { pct: (e.target as HTMLInputElement).value }),
                },
                upto: {
                    value: band()?.upToCh ?? '',
                    oninput: (e: Event) =>
                        this.svc.patchBand(slotKey, bandKey, { upToCh: (e.target as HTMLInputElement).value }),
                },
                del: { onclick: () => this.svc.removeBand(slotKey, bandKey) },
            },
            track,
        );
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
