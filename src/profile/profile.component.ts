import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { ProfileService, type SaveTarget } from './profile.service';
import { avatarBadgeBindings, avatarBadgeCss, avatarBadgeMarkup } from '../app/avatar-badge';
import { INFO_DOT_CSS, infoDotMarkup } from '../app/info-dot';
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

            <!-- One card, three field rows. Home club leads: it is the fact
                 other players see next to your name, where gender and tee are
                 plumbing for which tee a round starts you on. -->
            <section class="profile__card">
                <div class="pfield">
                    <span class="pfield__label">Home club</span>
                    <div bind="club" class="pfield__control"></div>
                    <p class="pfield__hint">Shown next to your name when someone searches for you — how they tell you from the other John Smith.</p>
                    <p bind="clubErr" class="profile__err"></p>
                </div>
                <div class="profile__rule"></div>
                <!-- Every option is one or two characters, so label and track
                     share a row (design-guidelines §2 "size to content"). -->
                <div class="pfield pfield--inline">
                    <span class="pfield__label">Gender</span>
                    <div bind="gender" class="pfield__seg"></div>
                    <p class="pfield__hint">Used for tee ratings — set once and it locks in "Add me" during round setup.</p>
                    <p bind="genderErr" class="profile__err"></p>
                </div>
                <div class="profile__rule"></div>
                <div class="pfield">
                    <span class="pfield__label">Preferred tee
                        ${infoDotMarkup('teeRoleInfo', 'How preferred tee works')}</span>
                    <div bind="teeRole" class="pfield__control"></div>
                    <p bind="teeRoleHint" class="pfield__hint"></p>
                    <p bind="teeRoleExplain" class="pfield__hint profile__tee-explain"></p>
                    <p bind="teeRoleErr" class="profile__err"></p>
                </div>
            </section>

            <!-- Index and history are one subject: the number, then the chain
                 of saves that produced it. A separate "Handicap history"
                 heading said nothing the rows do not. -->
            <section class="profile__card">
                <div class="pfield">
                    <span class="pfield__label">Handicap index</span>
                    <div class="profile__hcp-row">
                        <span bind="hcp" class="profile__hcp"></span>
                        <form bind="form" class="profile__edit">
                            <input bind="index" inputmode="decimal" placeholder="e.g. 18.4" />
                            <button type="submit" bind="save">Save</button>
                        </form>
                    </div>
                    <p class="pfield__hint">Maintained by you — each save is recorded below with its effective date.</p>
                </div>
                <p bind="saveErr" class="profile__err"></p>
                <div class="profile__rule"></div>
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

                /* One fact per row: label, control, then the muted line that
                   explains the CURRENT selection (design-guidelines §3).
                   Sentence case, not the old uppercase micro-caps: three of
                   those stacked in one card read as three card headers. */
                & .pfield {
                    display: flex; flex-direction: column; gap: ${s('sm')};

                    & .pfield__label {
                        display: inline-flex; align-items: center; gap: ${s('xs')};
                        font-size: 0.95rem; font-weight: 600; color: ${t('text')};
                    }
                    & .pfield__control { & .ui-select { display: block; width: 100%; } }
                    & .pfield__hint {
                        margin: 0; font-size: 0.8rem; line-height: 1.4; color: ${t('text-muted')};
                        &:empty { display: none; }
                    }
                }
                /* Short options only: label left, track right, hint spanning
                   underneath both. */
                & .pfield--inline {
                    flex-direction: row; align-items: center; flex-wrap: wrap;
                    justify-content: space-between;
                    & .pfield__hint { flex-basis: 100%; }
                }

                /* Track segmented control — the same anatomy as
                   .fslot__seg in create.component.ts, and the same reason:
                   the selection reads from ELEVATION (a raised pill on a
                   sunken track), never from a solid primary fill, which is
                   reserved for primary actions (design-guidelines §2).
                   Deliberately NOT btn() — btn() emits the full-bleed slab
                   sizing this replaces. */
                & .pfield__seg {
                    display: inline-flex; gap: 2px;
                    padding: 3px; border: 1px solid ${t('border')};
                    border-radius: ${t('radius-pill')}; background: ${t('surface-sunken')};
                    & button {
                        appearance: none; border: 1px solid transparent; background: none;
                        padding: ${s('xs')} ${s('md')}; border-radius: ${t('radius-pill')};
                        font-family: inherit; font-weight: 500; font-size: 0.85rem;
                        color: ${t('text-muted')}; cursor: pointer; white-space: nowrap;
                        &:hover { color: ${t('text')}; }
                        &.on {
                            background: ${t('surface')}; border-color: ${t('border')};
                            color: ${t('text')}; font-weight: 700;
                        }
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }

                /* Hairline between rows of the same card. */
                & .profile__rule {
                    height: 1px; margin: ${s('lg')} 0;
                    background: ${t('border')};
                }

                & .profile__hcp-row {
                    display: flex; align-items: center; gap: ${s('md')};
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
                & .profile__err {
                    margin: ${s('sm')} 0 0; font-size: 0.85rem; color: ${t('error')};
                    &:empty { display: none; }
                }

                /* The long-form answer behind the ⓘ. Closed by default: the
                   hint line above it already names the live selection. */
                & .profile__tee-explain.hidden { display: none; }
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

            /* A section is a heading plus its card; without this the card's own
               bottom margin was the only thing separating one section from the
               next heading, and the last one had nothing at all under it. */
            & .profile__section {
                margin-bottom: ${s('xl')};

                & h2 {
                    margin: 0 0 ${s('sm')};
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .profile__empty {
                color: ${t('text-muted')}; font-size: 0.9rem;
                &.hidden { display: none; }
            }

            /* The chain is ONE card — the card is the handicap card the rows
               belong to, so the rows carry no chrome of their own and are
               separated by a hairline instead. */
            & .profile__history { display: flex; flex-direction: column; }

            & .hcp-entry {
                display: flex; align-items: baseline; gap: ${s('md')};
                padding: ${s('sm')} 0;

                & + & { border-top: 1px solid ${t('border')}; }

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
        ${INFO_DOT_CSS}
    `;

    private svc = this.inject(ProfileService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private indexDraft = new Signal('');
    private localErr = new Signal('');
    private nameDraft = new Signal('');
    private nameEditing = new Signal(false);
    private nameErr = new Signal('');
    private teeRoleInfoOpen = new Signal(false);

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
                textContent: () => this.nameErr.get() || this.saveErrFor('name'),
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
                textContent: () => this.localErr.get() || this.saveErrFor('index'),
            },
            teeRoleInfo: {
                'aria-expanded': () => String(this.teeRoleInfoOpen.get()),
                onclick: () => this.teeRoleInfoOpen.set(!this.teeRoleInfoOpen.get()),
            },
            // The short line under the field: what the LIVE selection does, in
            // one sentence (design-guidelines §3). The four-sentence version
            // sits behind the ⓘ.
            teeRoleHint: {
                textContent: () => {
                    const key = this.svc.player.get()?.preferredTeeRoleKey ?? null;
                    if (key === null) return 'Rounds start you on the course default tee.';
                    const role = this.svc.teeRoles.get().find((r) => r.roleKey === key);
                    return `Rounds start you on the course’s ${role?.displayName ?? key} tee when it has one.`;
                },
            },
            teeRoleExplain: {
                textContent: () =>
                    'Pick the tee type you normally play. It pre-fills your own gender’s round tee only when the selected course has a matching tee. Otherwise the course default applies. The organiser can change the round defaults, and any player’s tee can still be overridden.',
                className: () => this.teeRoleInfoOpen.get()
                    ? 'pfield__hint profile__tee-explain'
                    : 'pfield__hint profile__tee-explain hidden',
            },
            // Each row reports only its OWN failure. Before `saveTarget` these
            // three read the shared `saveError` unconditionally, so one failed
            // club save printed the same sentence under gender and tee as well
            // — the bug the iOS store deliberately never ported.
            clubErr: { textContent: () => this.saveErrFor('club') },
            genderErr: { textContent: () => this.saveErrFor('gender') },
            teeRoleErr: { textContent: () => this.saveErrFor('tee') },
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

        // Preferred tee is a collapsed field, not a chip row: the role
        // catalogue is data-backed and unbounded (design-guidelines §1 sends
        // 5+/long/unbounded to a dropdown), and every OTHER tee field in the
        // app — round defaults, per-player overrides — is already one. Same
        // two-way signal shape as the club picker below.
        const teeValue = new Signal(this.svc.player.get()?.preferredTeeRoleKey ?? '');
        this.track(effect(() => teeValue.set(this.svc.player.get()?.preferredTeeRoleKey ?? '')));
        this.track(
            effect(() => {
                const v = teeValue.get();
                queueMicrotask(() => {
                    if (v === (this.svc.player.get()?.preferredTeeRoleKey ?? '')) return;
                    void this.svc.savePreferredTeeRole(v === '' ? null : v);
                });
            }),
        );
        const teeSelect = new SelectComponent({
            value: teeValue,
            options: {
                get: (): SelectOption[] => [
                    { value: '', label: 'No preference' },
                    ...this.svc.teeRoles
                        .get()
                        .map((role) => ({ value: role.roleKey, label: role.displayName })),
                ],
            },
            placeholder: 'No preference',
            disabled: { get: () => this.svc.saving.get() },
        });
        teeSelect.mount(this.ref(frag, 'teeRole'));
        this.track(() => teeSelect.destroy());

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
     * The shared `saveError`, but only for the row that caused it.
     */
    private saveErrFor(target: SaveTarget): string {
        if (this.svc.saveTarget.get() !== target) return '';
        return this.svc.saveError.get()?.message || '';
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
