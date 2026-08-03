import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { ProfileService } from './profile.service';
import { avatarBadgeBindings, avatarBadgeCss, avatarBadgeMarkup } from '../app/avatar-badge';
import { parseHandicapIndex, formatHandicapIndex } from '../create/hcp-input';
import {
    STATS_MASTER_HINT,
    STATS_MASTER_TITLE,
    STATS_MODULES,
    statsAnnotation,
    statsIsLocked,
    statsIsOn,
    statsModuleHint,
    statsModuleTitle,
    statsSetting,
    statsSettingEnabled,
    type StatsConfigForm,
} from './stats-config-form';

// Phase 3 profile — the logged-in side door's home: display name, the
// manually maintained handicap index (edit → `players/me/handicap`), and the
// append-only history chain (index · source · effective date).
//
// It carries NO account controls: Admin and Sign out live in the app shell's
// account menu, which is on this screen too (and on every other one).

const tpl = template(`
    <div class="profile">
        <div bind="anon" class="profile__anon">
            <p>Your profile lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>
        <div bind="body" class="profile__body">
            <header class="profile__head">
                <div class="profile__ident">
                    ${avatarBadgeMarkup('profile__badge')}
                    <div class="profile__names">
                        <div bind="nameDisplay" class="profile__name-display">
                            <h1 bind="name"></h1>
                            <button bind="editName" class="profile__edit-name" type="button"
                                aria-label="Edit display name" title="Edit display name"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                        </div>
                        <form bind="nameForm" class="profile__name-form">
                            <input bind="nameInput" autocomplete="name" aria-label="Display name" />
                            <button bind="cancelName" type="button">Cancel</button>
                            <button bind="saveName" type="submit">Save</button>
                        </form>
                        <p bind="nameErr" class="profile__err"></p>
                        <p bind="username"></p>
                    </div>
                </div>
                <div class="profile__photo-actions">
                    <!-- The real control. Kept in the DOM (not display:none) so
                         the picker it opens has a live element to return to. -->
                    <input bind="photoFile" type="file" class="profile__file"
                           accept="image/jpeg,image/png,image/webp" />
                    <button bind="photoPick" type="button"></button>
                    <button bind="photoRemove" type="button" class="profile__photo-remove"></button>
                </div>
                <p bind="photoErr" class="profile__err"></p>
            </header>

            <section class="profile__card">
                <span class="profile__label">Gender</span>
                <div class="profile__gender-row">
                    <div bind="gender" class="profile__genderseg"></div>
                </div>
                <p class="profile__hint">Used for tee ratings — set once and it locks in "Add me" during round setup.</p>
                <p bind="genderErr" class="profile__err"></p>
            </section>

            <section class="profile__card">
                <span class="profile__label">Home club</span>
                <div bind="club" class="profile__club"></div>
                <p class="profile__hint">Shown next to your name when someone searches for you — how they tell you from the other John Smith.</p>
                <p bind="clubErr" class="profile__err"></p>
            </section>

            <section class="profile__card">
                <span class="profile__label">Handicap index</span>
                <div class="profile__hcp-row">
                    <span bind="hcp" class="profile__hcp"></span>
                    <form bind="form" class="profile__edit">
                        <input bind="index" inputmode="decimal" placeholder="e.g. 18.4" />
                        <button type="submit" bind="save">Save</button>
                    </form>
                </div>
                <p class="profile__hint">Maintained by you — each save is recorded below with its effective date.</p>
                <p bind="saveErr" class="profile__err"></p>
            </section>

            <section class="profile__section">
                <h2>Handicap history</h2>
                <div bind="historyEmpty" class="profile__empty">No entries yet — save an index to start the chain.</div>
                <div bind="history" class="profile__history"></div>
            </section>

            <!-- Last on the page, as on iOS (ProfileView.swift:157-158 orders
                 historySection then statsSection): the facts above are what the
                 profile IS, this is a preference about a different screen. -->
            <section class="profile__section profile__stats">
                <h2>Statistics</h2>
                <div class="profile__card">
                    <!-- The way in to /stats. Above the switches because it is
                         what the section is FOR — the toggles below decide what
                         the dashboard will have to show next time. -->
                    <button bind="toStats" class="statlink" type="button">
                        <span class="statlink__text">
                            <span class="statlink__title">Your statistics</span>
                            <span class="statlink__hint">Fairways, greens, putting and scoring over a window of rounds.</span>
                        </span>
                        <span class="statlink__chev" aria-hidden="true"></span>
                    </button>
                    <div bind="statlinkRule" class="statrow__rule"></div>
                    <label class="statrow">
                        <span class="statrow__text">
                            <span class="statrow__head">
                                <span bind="masterTitle" class="statrow__title"></span>
                            </span>
                            <span bind="masterHint" class="statrow__hint"></span>
                        </span>
                        <input bind="master" type="checkbox" role="switch" class="statrow__chk" />
                    </label>
                    <div class="statrow__rule"></div>
                    <div bind="statModules" class="profile__statmods"></div>
                    <p bind="statsErr" class="profile__err"></p>
                </div>
            </section>
        </div>
    </div>
`);

const entryTpl = template(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`);

// One module switch. Same markup as the master row above it, so the two read as
// one control and its contents rather than as two unrelated profile facts.
const statRowTpl = template(`
    <label bind="row" class="statrow">
        <span class="statrow__text">
            <span class="statrow__head">
                <span bind="title" class="statrow__title"></span>
                <span bind="ann" class="statrow__ann"></span>
            </span>
            <span bind="hint" class="statrow__hint"></span>
        </span>
        <input bind="chk" type="checkbox" role="switch" class="statrow__chk" />
    </label>
`);

export class ProfileComponent extends Component {
    static styles = `
        .profile {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .profile__anon {
                text-align: center;
                padding: ${s('2xl')} 0;
                color: ${t('text-muted')};

                &.hidden { display: none; }

                & button {
                    ${btn()}
                    margin-top: ${s('md')};
                    padding: ${s('md')} ${s('xl')};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                }
            }

            & .profile__body.hidden { display: none; }

            & .profile__head {
                margin-bottom: ${s('xl')};

                & .profile__ident { display: flex; align-items: center; gap: ${s('lg')}; }
                & .profile__names { min-width: 0; }

                & .profile__name-display {
                    display: flex; align-items: flex-start;
                }
                & .profile__name-display.hidden, & .profile__name-form.hidden { display: none; }
                & .profile__edit-name {
                    ${btn()}
                    display: grid; place-items: center;
                    flex: 0 0 28px;
                    width: 28px; height: 28px; margin: 0 0 0 2px; padding: 0;
                    color: ${t('text-muted')}; background: transparent;
                    border-color: transparent;
                    &:hover { color: ${t('text')}; background: ${t('hover-bg')}; }
                    &:disabled { opacity: 0.5; cursor: default; }
                    & svg { width: 18px; height: 18px; }
                }
                & .profile__name-form {
                    display: flex; align-items: center; gap: ${s('xs')};
                    max-width: 100%;
                    & input {
                        ${input()}
                        width: min(100%, 250px);
                        padding: ${s('sm')} ${s('md')};
                        font: 600 1rem ${t('font-display')};
                    }
                    & button {
                        ${btn()}
                        padding: ${s('sm')} ${s('md')};
                        font-family: inherit; font-size: 0.85rem; font-weight: 700;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                    & button[type='submit'] {
                        background: ${t('primary')}; color: ${t('primary-text')}; border-color: ${t('primary')};
                    }
                }

                & .profile__badge {
                    ${avatarBadgeCss(72, '1.5rem')}
                    background: ${t('accent-soft')};
                    color: ${t('accent')};
                }

                & .profile__photo-actions {
                    display: flex; align-items: center; gap: ${s('sm')};
                    margin-top: ${s('md')};

                    /* Off-screen rather than hidden: display:none makes the
                       element unfocusable, and Safari will not open a file
                       picker for a scripted click on one. */
                    & .profile__file {
                        position: absolute;
                        width: 1px; height: 1px;
                        opacity: 0; pointer-events: none;
                    }

                    & button {
                        ${btn()}
                        padding: ${s('sm')} ${s('md')};
                        font-family: inherit; font-size: 0.85rem; font-weight: 700;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                    /* Destructive, so it does not get the same weight as
                       Change — a mis-tap here costs the photo. */
                    & .profile__photo-remove {
                        background: none;
                        color: ${t('error')};
                        border-color: ${t('border')};
                        &.hidden { display: none; }
                    }
                }

                & .profile__err {
                    margin: ${s('sm')} 0 0; font-size: 0.85rem; color: ${t('error')};
                    &:empty { display: none; }
                }

                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem; }
            }

            & .profile__card {
                padding: ${s('lg')};
                margin-bottom: ${s('xl')};
                ${card()}

                & .profile__label {
                    font-weight: 700; font-size: 0.8rem;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    color: ${t('text-muted')};
                }
                & .profile__hcp-row {
                    display: flex; align-items: center; gap: ${s('md')};
                    margin-top: ${s('sm')};
                }
                & .profile__hcp {
                    font-family: ${t('font-display')};
                    font-weight: 700; font-size: 2rem;
                    font-variant-numeric: tabular-nums;
                    color: ${t('text')};
                }
                & .profile__edit {
                    display: flex; gap: ${s('sm')}; flex: 1; justify-content: flex-end;
                    & input { ${input()} width: 90px; padding: ${s('md')}; font-size: 1rem; text-align: center; }
                    & button {
                        ${btn()}
                        padding: ${s('md')} ${s('lg')}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700;
                        background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
                & .profile__hint { margin: ${s('sm')} 0 0; font-size: 0.8rem; color: ${t('text-muted')}; }
                & .profile__err {
                    margin: ${s('sm')} 0 0; font-size: 0.85rem; color: ${t('error')};
                    &:empty { display: none; }
                }

                & .profile__club {
                    margin-top: ${s('sm')};
                    & .ui-select { display: block; width: 100%; }
                }

                & .profile__gender-row { margin-top: ${s('sm')}; }
                & .profile__genderseg {
                    display: flex;
                    gap: ${s('xs')};

                    & button {
                        ${btn()}
                        flex: 1;
                        padding: ${s('sm')} 0;
                        font-family: inherit;
                        font-size: 0.9rem;
                        font-weight: 700;
                        &.on { background: ${t('primary')}; color: ${t('primary-text')}; border-color: ${t('primary')}; }
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
            }

            /* Statistics: the master switch, a hairline, then the six modules
               INDENTED under it — they are not six more profile facts, they are
               the contents of the row above and dead while it is off. */
            & .profile__statmods {
                display: flex;
                flex-direction: column;
                gap: ${s('md')};
                padding-left: ${s('md')};
            }

            & .statrow {
                display: flex;
                align-items: flex-start;
                gap: ${s('md')};
                cursor: pointer;

                &.statrow--locked { cursor: default; opacity: 0.55; }

                /* A pill switch, not a checkbox — iOS uses a SwiftUI Toggle
                   tinted accentStrong (ProfileView.swift:431), and a tick box would
                   read as "select this row" rather than "this is on". Drawn on
                   the input itself so the label stays the hit target. */
                & .statrow__chk {
                    appearance: none;
                    -webkit-appearance: none;
                    position: relative;
                    width: 51px; height: 31px;
                    flex-shrink: 0;
                    align-self: center;
                    margin: 0;
                    border-radius: ${t('radius-pill')};
                    background: ${t('border')};
                    cursor: inherit;
                    transition: background 0.2s ease;

                    &::after {
                        content: '';
                        position: absolute;
                        top: 2px; left: 2px;
                        width: 27px; height: 27px;
                        border-radius: 50%;
                        background: #fff;
                        box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
                        transition: transform 0.2s ease;
                    }

                    &:checked {
                        background: ${t('primary')};
                        &::after { transform: translateX(20px); }
                    }
                }
                /* Takes the slack so the switch sits hard against the trailing
                   edge, as the label/control split does on iOS. */
                & .statrow__text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                & .statrow__head {
                    display: flex; align-items: baseline; gap: ${s('sm')};
                    flex-wrap: wrap;
                }
                & .statrow__title { font-size: 1rem; font-weight: 600; color: ${t('text')}; }
                /* The unmet dependency, in words — "Needs Putting". The row is
                   locked either way; this is the half that says which switch to
                   move to get it back. */
                & .statrow__ann {
                    font-size: 0.8rem; color: ${t('text-muted')};
                    &:empty { display: none; }
                }
                & .statrow__hint { font-size: 0.8rem; color: ${t('text-muted')}; }
            }

            & .statrow__rule {
                height: 1px;
                margin: ${s('md')} 0;
                background: ${t('border')};
                &.hidden { display: none; }
            }

            /* The dashboard link. A row, not a button-looking control: it goes
               somewhere, and the chevron is the only affordance it needs. */
            & .statlink {
                ${btn()}
                display: flex;
                align-items: center;
                gap: ${s('md')};
                width: 100%;
                padding: 0;
                font-family: inherit;
                text-align: left;
                background: transparent;
                border: none;
                border-radius: 0;

                &.hidden { display: none; }

                & .statlink__text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                & .statlink__title { font-size: 1rem; font-weight: 600; color: ${t('text')}; }
                & .statlink__hint { font-size: 0.8rem; color: ${t('text-muted')}; }
                & .statlink__chev {
                    flex-shrink: 0;
                    width: 0; height: 0;
                    border-top: 5px solid transparent;
                    border-bottom: 5px solid transparent;
                    border-left: 6px solid ${t('text-muted')};
                }
            }

            & .profile__section {
                & h2 {
                    margin: 0 0 ${s('sm')};
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .profile__empty {
                color: ${t('text-muted')}; font-size: 0.9rem; padding: ${s('md')} 0;
                &.hidden { display: none; }
            }

            & .profile__history { display: flex; flex-direction: column; gap: ${s('sm')}; }

            & .hcp-entry {
                display: flex; align-items: baseline; gap: ${s('md')};
                padding: ${s('md')} ${s('lg')};
                ${card()}

                & .hcp-entry__index {
                    font-weight: 700; font-size: 1.05rem;
                    font-variant-numeric: tabular-nums;
                    width: 52px;
                }
                & .hcp-entry__source {
                    font-size: 0.7rem; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    border-radius: ${t('radius-pill')};
                    padding: 2px 10px;
                    background: ${t('accent-soft')}; color: ${t('accent')};
                }
                & .hcp-entry__date {
                    margin-left: auto;
                    color: ${t('text-muted')}; font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                }
            }
        }
    `;

    private svc = this.inject(ProfileService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private indexDraft = new Signal('');
    private localErr = new Signal('');
    private nameDraft = new Signal('');
    private nameEditing = new Signal(false);
    private nameErr = new Signal('');

    render(): DocumentFragment {
        if (this.auth.currentUser.get()) void this.svc.load();

        const loggedIn = () => this.auth.currentUser.get() !== null;

        // Resolved once, below, and closed over by the pick button's handler.
        // `this.ref(frag, …)` only works while the fragment still owns its
        // nodes: mounting MOVES them into the document and leaves `frag`
        // empty, so the same lookup at click time finds nothing.
        let photoFileEl: HTMLInputElement | null = null;
        let nameInputEl: HTMLInputElement | null = null;

        const frag = this.wire(tpl, {
            anon: { className: () => (loggedIn() ? 'profile__anon hidden' : 'profile__anon') },
            toLogin: { onclick: () => this.router.navigate('/login', { query: { next: '/profile' } }) },
            body: { className: () => (loggedIn() ? 'profile__body' : 'profile__body hidden') },
            ...avatarBadgeBindings(() => {
                const p = this.svc.player.get();
                return {
                    id: p?.id ?? '',
                    avatarVersion: p?.avatarVersion ?? null,
                    displayName: p?.displayName,
                    username: p?.username,
                };
            }),
            photoFile: {
                onchange: (e: Event) => {
                    const el = e.target as HTMLInputElement;
                    const file = el.files?.[0];
                    // Cleared before the await: picking the SAME file twice
                    // (after a failed upload, say) fires no `change` at all if
                    // the input still holds it.
                    el.value = '';
                    if (file) void this.svc.saveAvatar(file);
                },
            },
            photoPick: {
                textContent: () =>
                    this.svc.avatarSaving.get()
                        ? 'Saving…'
                        : this.svc.player.get()?.avatarVersion
                          ? 'Change photo'
                          : 'Add photo',
                disabled: () => this.svc.avatarSaving.get(),
                onclick: () => photoFileEl?.click(),
            },
            photoRemove: {
                textContent: () => 'Remove',
                className: () =>
                    this.svc.player.get()?.avatarVersion
                        ? 'profile__photo-remove'
                        : 'profile__photo-remove hidden',
                disabled: () => this.svc.avatarSaving.get(),
                onclick: () => void this.svc.removeAvatar(),
            },
            photoErr: {
                textContent: () => this.svc.avatarError.get()?.message ?? '',
            },
            nameDisplay: {
                className: () =>
                    this.nameEditing.get() ? 'profile__name-display hidden' : 'profile__name-display',
            },
            name: () => this.svc.player.get()?.displayName ?? '…',
            editName: {
                disabled: () => this.svc.saving.get(),
                onclick: () => {
                    this.nameDraft.set(this.svc.player.get()?.displayName ?? '');
                    this.nameErr.set('');
                    this.nameEditing.set(true);
                    queueMicrotask(() => nameInputEl?.focus());
                },
            },
            nameForm: {
                className: () =>
                    this.nameEditing.get() ? 'profile__name-form' : 'profile__name-form hidden',
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const displayName = this.nameDraft.get().trim();
                    if (!displayName) {
                        this.nameErr.set('Enter a display name.');
                        return;
                    }
                    this.nameErr.set('');
                    if (await this.svc.saveDisplayName(displayName)) this.nameEditing.set(false);
                },
            },
            nameInput: {
                value: () => this.nameDraft.get(),
                disabled: () => this.svc.saving.get(),
                oninput: (e: Event) => this.nameDraft.set((e.target as HTMLInputElement).value),
            },
            cancelName: {
                disabled: () => this.svc.saving.get(),
                onclick: () => {
                    this.nameEditing.set(false);
                    this.nameErr.set('');
                },
            },
            saveName: {
                disabled: () => this.svc.saving.get() || this.nameDraft.get().trim() === '',
                textContent: () => (this.svc.saving.get() ? 'Saving…' : 'Save'),
            },
            nameErr: {
                textContent: () => this.nameErr.get() || this.svc.saveError.get()?.message || '',
            },
            username: () => {
                const p = this.svc.player.get();
                return p ? `@${p.username}` : '';
            },
            hcp: () => {
                const idx = this.svc.player.get()?.handicapIndex;
                // Golf notation: a stored negative index is a plus handicap.
                return idx == null ? '–' : idx < 0 ? `+${(-idx).toFixed(1)}` : idx.toFixed(1);
            },
            index: {
                value: () => this.indexDraft.get(),
                oninput: (e: Event) => this.indexDraft.set((e.target as HTMLInputElement).value),
            },
            save: {
                disabled: () =>
                    this.svc.saving.get() || this.indexDraft.get().trim() === '',
                textContent: () => (this.svc.saving.get() ? 'Saving…' : 'Save'),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    this.localErr.set('');
                    const idx = parseHandicapIndex(this.indexDraft.get());
                    if (idx === null || idx < -10 || idx > 54) {
                        this.localErr.set('Enter an index between +10 and 54 (use “+” for a plus handicap).');
                        return;
                    }
                    if (await this.svc.saveIndex(idx)) this.indexDraft.set('');
                },
            },
            saveErr: {
                textContent: () =>
                    this.localErr.get() || this.svc.saveError.get()?.message || '',
            },
            genderErr: {
                textContent: () => this.svc.saveError.get()?.message || '',
            },
            clubErr: {
                textContent: () => this.svc.saveError.get()?.message || '',
            },
            // Offered only once a round has stats on it — a link into a screen
            // that can only say "nothing yet" is a dead end, and the switches
            // below already explain how to start filling it.
            toStats: {
                className: () =>
                    this.svc.hasRecordedStats.get() ? 'statlink' : 'statlink hidden',
                onclick: () => this.router.navigate('/stats'),
            },
            statlinkRule: {
                className: () =>
                    this.svc.hasRecordedStats.get() ? 'statrow__rule' : 'statrow__rule hidden',
            },
            masterTitle: () => STATS_MASTER_TITLE,
            masterHint: () => STATS_MASTER_HINT,
            master: {
                checked: () => this.svc.statsConfig.get().enabled,
                // Any in-flight profile save, matching `saveStatsConfig`'s guard.
                disabled: () => this.statsBusy(),
                onchange: (e: Event) =>
                    void this.saveStats(
                        e,
                        (f, on) => statsSettingEnabled(f, on),
                        (f) => f.enabled,
                    ),
            },
            statsErr: {
                textContent: () => this.svc.statsError.get()?.message || '',
            },
            historyEmpty: {
                className: () =>
                    this.svc.history.get().length === 0
                        ? 'profile__empty'
                        : 'profile__empty hidden',
            },
        });

        this.$each(
            this.ref(frag, 'history'),
            this.svc.history,
            (h, _i, track) =>
                this.wireEl(entryTpl, {
                    index: () => h.handicapIndex.toFixed(1),
                    source: () => h.source,
                    date: () => h.effectiveDate,
                }, track),
            (h) => h.id,
        );

        // The six module switches. Every tap is a save — the endpoint is
        // whole-config, so each toggle PUTs the complete snapshot, exactly like
        // the gender chips POST on tap. There is no Save button to add: a switch
        // that needs confirming is a switch that answered its own question
        // twice. The row list is static, so only the switch state is reactive.
        this.$each(
            this.ref(frag, 'statModules'),
            () => [...STATS_MODULES],
            (module, _i, track) => {
                // `change` hands the pure module the WHOLE next configuration
                // to build, so the dependency cascade (turning putting off takes
                // short game with it) is decided there and never here.
                const form = () => this.svc.statsConfig.get();
                const locked = () => statsIsLocked(form(), module);
                return this.wireEl(
                    statRowTpl,
                    {
                        row: { className: () => (locked() ? 'statrow statrow--locked' : 'statrow') },
                        title: () => statsModuleTitle(module),
                        ann: () => statsAnnotation(form(), module) ?? '',
                        hint: () => statsModuleHint(module),
                        chk: {
                            // A locked row keeps SHOWING its stored value — the
                            // value is still what the server holds, only the tap
                            // is unavailable.
                            checked: () => statsIsOn(form(), module),
                            disabled: () => locked() || this.statsBusy(),
                            onchange: (e: Event) =>
                                void this.saveStats(
                                    e,
                                    (f, on) => statsSetting(f, module, on),
                                    (f) => statsIsOn(f, module),
                                ),
                        },
                    },
                    track,
                );
            },
            (module) => module,
        );

        // Gender segmented control: M / F / Not set. Saves immediately on
        // tap (no separate save step, unlike the handicap index field).
        const genderOptions: Array<{ value: 'M' | 'F' | null; label: string }> = [
            { value: 'M', label: 'M' },
            { value: 'F', label: 'F' },
            { value: null, label: 'Not set' },
        ];
        this.$each(
            this.ref(frag, 'gender'),
            () => genderOptions,
            (opt, _i, track) =>
                this.wireEl(
                    template(`<button bind="b" type="button"></button>`),
                    {
                        b: {
                            textContent: () => opt.label,
                            className: () => (this.svc.player.get()?.gender === opt.value ? 'on' : ''),
                            disabled: () => this.svc.saving.get(),
                            onclick: () => void this.svc.saveGender(opt.value),
                        },
                    },
                    track,
                ),
            (opt) => opt.label,
        );

        // Home club picker. Like gender, it saves on pick — no separate Save.
        // `''` is the cleared state (SelectComponent values are strings), and
        // the signal is two-way: server→signal keeps it honest after a load or
        // a failed save, signal→server fires only on a real change. The write
        // is deferred to a microtask so the save's own signal reads aren't
        // tracked by this effect (same reason as create.component's `bound`).
        const clubValue = new Signal(this.svc.player.get()?.homeClubId ?? '');
        this.track(effect(() => clubValue.set(this.svc.player.get()?.homeClubId ?? '')));
        this.track(
            effect(() => {
                const v = clubValue.get();
                queueMicrotask(() => {
                    if (v === (this.svc.player.get()?.homeClubId ?? '')) return;
                    void this.svc.saveHomeClub(v === '' ? null : v);
                });
            }),
        );
        const select = new SelectComponent({
            value: clubValue,
            options: {
                get: (): SelectOption[] => [
                    { value: '', label: 'No home club' },
                    ...this.svc.clubs.get().map((c) => ({ value: c.id, label: c.name })),
                ],
            },
            placeholder: 'No home club',
            disabled: { get: () => this.svc.saving.get() },
        });
        select.mount(this.ref(frag, 'club'));
        this.track(() => select.destroy());

        photoFileEl = this.ref(frag, 'photoFile') as HTMLInputElement;
        nameInputEl = this.ref(frag, 'nameInput') as HTMLInputElement;

        return frag;
    }

    /**
     * Whether a stats switch is currently unavailable. Mirrors
     * `saveStatsConfig`'s guard, which covers any in-flight profile save (a
     * handicap save ends in a reload that rewrites `statsConfig`), so a switch
     * is never tappable while the service would silently refuse it.
     */
    private statsBusy(): boolean {
        return this.svc.statsSaving.get() || this.svc.saving.get();
    }

    /**
     * One stats switch tap: build the next whole configuration from the box's
     * new state, PUT it, then reconcile the box with what the server holds.
     *
     * The reconcile is the revert. On success the signal changed and the
     * `checked` binding already re-ran, but a REFUSED save leaves `statsConfig`
     * untouched — and an unchanged signal re-runs nothing, so without this the
     * box would sit in a state the server never accepted.
     */
    private async saveStats(
        e: Event,
        change: (form: StatsConfigForm, on: boolean) => StatsConfigForm,
        read: (form: StatsConfigForm) => boolean,
    ): Promise<void> {
        const box = e.target as HTMLInputElement;
        await this.svc.saveStatsConfig(change(this.svc.statsConfig.get(), box.checked));
        box.checked = read(this.svc.statsConfig.get());
    }
}
