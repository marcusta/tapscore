import { Component, Router, template, effect, Signal } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { SetupService, type RoutePreset } from './setup.service';
import type { FormatConfigField } from '../api/setup.gen';
import { parseHandicapIndex } from './hcp-input';
import { currentLocale } from '../locale';
import { ProfileService } from '../profile/profile.service';
import { FriendsService } from '../friends/friends.service';
import { sortFriends } from '../friends/friend-sort';

// Phase 2.6e M2 — the real no-login setup flow. Pick a course + route, add
// players (name · handicap index · gender · per-player tee) with the derived
// course handicap shown live, then submit a RoundSetupDraft to the no-auth
// friendly-rounds front door and land in the round. Formats are M3: M2 attaches
// a single default `stableford_individual` so the round is valid and openable.

const PRESETS: RoutePreset[] = ['full_18', 'front_9', 'back_9'];

/** The decimal-separator glyph the handicap keypad shows (Swedish writes ","). */
const hcpSep = () => (currentLocale() === 'sv' ? ',' : '.');

// `<string>`: this template is big enough that 1.7.0's type-level bind
// extraction hits the compiler's instantiation depth limit (TS2589). The
// explicit `string` opts this one template out — binds stay unchecked here,
// exactly as they were before 1.7.0.
const tpl = template<string>(`
    <div bind="root" class="setup">
        <button bind="back" class="setup__back" type="button">← Home</button>
        <header class="setup__head">
            <h1 bind="title">New round</h1>
            <p bind="subtitle">No sign-in required.</p>
        </header>

        <div bind="blocked" class="setup__blocked hidden"></div>

        <section class="setup__section">
            <h2>Name</h2>
            <input bind="roundName" class="setup__name" type="text" maxlength="80" placeholder="Name this round" />
            <p class="setup__hint">Just so you can tell your rounds apart — change it or leave it.</p>
        </section>

        <section class="setup__section">
            <h2>Course</h2>
            <div bind="course" class="setup__select"></div>
            <div bind="teeDefaults" class="setup__tee-defaults hidden">
                <h3>Default tees</h3>
                <p class="setup__hint">Players start on these tees. Change an individual player below if needed.</p>
                <label class="setup__teerow"><span>Men</span><div bind="maleDefaultTee"></div></label>
                <label class="setup__teerow"><span>Women</span><div bind="femaleDefaultTee"></div></label>
            </div>
            <p bind="lockNote" class="setup__locknote hidden"></p>
            <p bind="routeErr" class="setup__warn"></p>
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
            <button bind="addMe" class="setup__add setup__addme hidden" type="button"></button>
            <button bind="addFriends" class="setup__add setup__addme hidden" type="button">+ From friends</button>
            <div bind="friendPicker" class="setup__friends hidden">
                <div bind="friendRows" class="setup__friendrows"></div>
                <p class="setup__hint">Everyone on your friends list is already in the round.</p>
            </div>
            <p bind="rosterErr" class="setup__warn"></p>
        </section>

        <section bind="ballTeamsSection" class="setup__section">
            <div bind="ballPitch" class="bteams__pitch">
                <h2>Playing scramble or foursomes?</h2>
                <p class="setup__hint">Group players who share one ball. Skip this if everyone plays their own ball.</p>
                <button bind="openBallTeams" class="setup__add" type="button">Set up teams</button>
            </div>
            <div bind="ballOpen" class="bteams">
                <h2 bind="ballHeading">Sharing a ball</h2>
                <p class="setup__hint">Anyone not on a team plays their own ball.</p>
                <div bind="ballTeams" class="setup__fslots"></div>
                <button bind="addBallTeam" class="setup__add" type="button">+ Add another team</button>
            </div>
        </section>

        <section class="setup__section">
            <h2>Playing groups</h2>
            <p class="setup__hint">Optional. Split the field into groups with their own tee times or start holes (shotgun).</p>
            <div bind="groups" class="setup__fslots"></div>
            <p bind="groupNote" class="setup__note"></p>
            <p bind="groupWarn" class="setup__warn"></p>
            <button bind="splitGroups" class="setup__add" type="button">Split into groups</button>
            <button bind="addGroup" class="setup__add hidden" type="button">+ Add group</button>
            <button bind="clearGroups" class="setup__add hidden" type="button">Keep everyone together</button>
        </section>

        <section class="setup__section">
            <h2>What are we playing?</h2>
            <p class="setup__hint">Pick every game the group is playing — each one picks its own players.</p>
            <div bind="cards" class="setup__cards"></div>
            <div bind="games" class="setup__fslots"></div>
            <p bind="formatNote" class="setup__note"></p>
        </section>

        <section bind="teamsSection" class="setup__section">
            <h2>Teams</h2>
            <p class="setup__hint">Optional. Group players into a team ball with a handicap allowance per member.</p>
            <div bind="teams" class="setup__fslots"></div>
            <button bind="addTeam" class="setup__add" type="button">+ Create team</button>
        </section>

        <section bind="formatsSection" class="setup__section">
            <h2>Formats</h2>
            <p class="setup__hint">Each format scores a set of balls — tick the players and teams it ranks.</p>
            <div bind="formats" class="setup__fslots"></div>
            <button bind="addFormat" class="setup__add" type="button">+ Add format</button>
        </section>

        <div bind="banner" class="setup__banner"></div>
        <button bind="create" class="setup__create" type="button">Create round</button>
        <button bind="cancel" class="setup__cancel hidden" type="button">Cancel</button>
        <div bind="confirmHost"></div>

        <div bind="hcpPad" class="hcp hidden">
            <div bind="hcpBackdrop" class="hcp__backdrop"></div>
            <div class="hcp__sheet">
                <div class="hcp__head">
                    <div class="hcp__who">
                        <span bind="hcpName" class="hcp__name"></span>
                        <span bind="hcpCh" class="hcp__chline"></span>
                    </div>
                    <span bind="hcpVal" class="hcp__val"></span>
                    <button bind="hcpBack" class="hcp__bs" type="button" aria-label="Delete">⌫</button>
                </div>
                <div bind="hcpKeys" class="hcp__grid"></div>
                <div class="hcp__actions">
                    <button bind="hcpCancel" class="hcp__cancel" type="button">Cancel</button>
                    <button bind="hcpOk" class="hcp__ok" type="button">Done</button>
                </div>
            </div>
        </div>
    </div>
`);

// One key of the handicap keypad — a big glyph plus an optional caption
// (the "+" key explains itself as "plus hcp"). Mirrors the score-entry
// keypad's keyTpl shape.
const hcpKeyTpl = template(`
    <button bind="key" class="hcp-key" type="button">
        <span bind="num" class="hcp-key__num"></span>
        <span bind="lbl" class="hcp-key__lbl"></span>
    </button>
`);

const playerTpl = template(`
    <div class="player">
        <div class="player__top">
            <input bind="name" class="player__name" placeholder="Player name" />
            <button bind="remove" class="player__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <div class="player__fields">
            <input bind="index" class="player__index" readonly placeholder="HCP index" />
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
            <span class="fslot__label">Handicap allowance</span>
            <span class="mrow__pct"><input bind="allowance" inputmode="numeric" /><span>%</span></span>
            <span bind="allowanceHint" class="fslot__teammeta"></span>
        </div>

        <div bind="configFields" class="fslot__configs"></div>

        <div class="fslot__group">
            <span class="fslot__label">Scores</span>
            <div bind="subjectRows" class="fslot__teamrows"></div>
        </div>

        <div bind="err" class="fslot__err"></div>
    </div>
`);

// One declared format-config knob (`FormatDescriptor.configFields[]`), rendered
// as a segmented control — one button per declared option. Nothing here knows
// which format it belongs to; that is the point (format-templates §2).
//
// `--inline` (set by the renderer when every option label is short) puts the
// label and the track on ONE row; otherwise they stack and `hint` draws the
// selected option's sentence underneath (docs/design-guidelines.md §§2–3).
const configFieldTpl = template(`
    <div class="fslot__group fslot__knob">
        <span bind="label" class="fslot__label"></span>
        <div bind="options" class="fslot__seg"></div>
        <p bind="hint" class="fslot__hint"></p>
    </div>
`);

const configOptionTpl = template(`
    <button bind="opt" type="button"></button>
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

// One playing-group card: start time + start hole, then exclusive member picks.
const groupCardTpl = template(`
    <div class="fslot">
        <div class="fslot__top">
            <span bind="groupName" class="fslot__teamname"></span>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <div class="fslot__group">
            <span class="fslot__label">Start</span>
            <div class="grp__start">
                <input bind="time" type="time" class="grp__time" />
                <div bind="hole" class="grp__hole"></div>
            </div>
        </div>
        <div class="fslot__group">
            <span class="fslot__label">Players</span>
            <div bind="memberRows" class="fslot__teamrows"></div>
            <p bind="meta" class="fslot__teammeta"></p>
        </div>
    </div>
`);

// One tappable friend in the compact "From friends" picker.
const friendRowTpl = template(`
    <button bind="row" type="button" class="frow">
        <span bind="name" class="frow__name"></span>
        <span bind="username" class="frow__username"></span>
        <span bind="hcp" class="frow__hcp"></span>
    </button>
`);

// One game card (format-templates §4). A card the roster is too small for is
// offered DISABLED with the requirement as its subtitle, so the player count
// reads as discovery ("with one more we could play Taliban") rather than a
// hidden option. Multi-select: tapping toggles that game on or off.
const gameCardTpl = template(`
    <button bind="card" class="gcard" type="button">
        <span bind="name" class="gcard__name"></span>
        <span bind="tag" class="gcard__tag"></span>
        <span bind="shape" class="gcard__shape"></span>
    </button>
`);

// One picked game. Games are ADDITIVE (§5), so a round shows one panel per
// picked game, each carrying its own participants, allowance and knobs. Rooted
// on `.fslot` so it inherits the card chrome the flexible form already uses.
const gamePanelTpl = template(`
    <div class="fslot">
        <div class="fslot__top">
            <span bind="title" class="fslot__teamname"></span>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <p bind="desc" class="fslot__desc"></p>

        <div class="fslot__group">
            <span class="fslot__label">Handicap allowance</span>
            <span class="mrow__pct"><input bind="allowance" inputmode="numeric" /><span>%</span></span>
        </div>

        <div bind="configFields" class="fslot__configs"></div>

        <div bind="ballGroup" class="fslot__group">
            <span class="fslot__label">Who plays which ball</span>
            <div bind="ballRows" class="fslot__teamrows"></div>
            <button bind="addBall" class="gaddball hidden" type="button">+ Add a ball</button>
        </div>

        <div bind="err" class="fslot__err"></div>
        <p bind="sides" class="gsides"></p>
        <button bind="fork" class="gadjust hidden" type="button">Use separate teams for this game</button>
        <p bind="summary" class="gsummary"></p>
        <button bind="adjust" class="gadjust" type="button">Adjust details</button>
    </div>
`);

// The only residual decision a game leaves: which ball a player is on, or
// whether they sit THIS game out (they may still be playing the others).
const ballRowTpl = template(`
    <div class="grow">
        <span bind="name" class="grow__name"></span>
        <div bind="seg" class="fslot__seg"></div>
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

// One shared-ball team in the players step (ball-teams-composition.md). No
// "plays as" select and no team naming: the SURFACE says what this is, which is
// the whole point of splitting the two kinds of team apart.
const ballTeamTpl = template(`
    <div class="fslot">
        <div class="fslot__top">
            <span bind="teamName" class="fslot__teamname"></span>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <div class="fslot__group">
            <span class="fslot__label">Formation</span>
            <div bind="formations" class="fslot__seg"></div>
        </div>
        <div class="fslot__group">
            <span class="fslot__label">Who shares this ball</span>
            <div bind="memberRows" class="fslot__teamrows"></div>
        </div>
        <p bind="notice" class="fslot__err"></p>
        <p bind="summary" class="fslot__teammeta"></p>
    </div>
`);

// A ball-team member: the tick, and the allowance the recipe seeded. The
// annotation spells the number out — a bare "%" beside a name reads as a share
// of something, not as a slice of that player's handicap.
const ballMemberTpl = template(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="decimal" /><span>% of HCP</span></span>
    </div>
`);

export class CreateComponent extends Component {
    static styles = `
        .setup {
            padding: ${s('lg')} ${s('lg')} ${s('2xl')};

            /* Not-editable (complete / no stored draft): only the head + blocked
               note + back button remain; the form body is removed. */
            &.setup--blocked > .setup__section,
            &.setup--blocked > .setup__banner,
            &.setup--blocked > .setup__create,
            &.setup--blocked > .setup__cancel { display: none; }

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
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${s('sm')}; font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            /* The game cards (format-templates §4). Two per row on a phone; the
               "+ Custom game" card spans the full width as the last one. */
            & .setup__cards {
                display: grid; grid-template-columns: 1fr 1fr; gap: ${s('sm')};
                margin-bottom: ${s('md')};
            }
            & .gcard {
                ${btn()}
                display: flex; flex-direction: column; gap: 2px; text-align: left;
                padding: ${s('md')}; font-family: inherit; cursor: pointer;
                /* The inset ring doubles the hairline so a picked card still
                   reads as picked next to a hovered one. */
                &.on {
                    border-color: ${t('primary')}; background: ${t('accent-soft')};
                    box-shadow: inset 0 0 0 1px ${t('primary')};
                }
                &:disabled { opacity: 0.5; cursor: default; }
                &.gcard--custom { grid-column: 1 / -1; }

                & .gcard__name { font-weight: 700; font-size: 0.95rem; }
                & .gcard__tag { font-size: 0.78rem; color: ${t('text-muted')}; line-height: 1.3; }
                & .gcard__shape {
                    font-size: 0.72rem; color: ${t('text-muted')}; line-height: 1.3;
                    &:empty { display: none; }
                }
            }

            & .setup__name {
                ${input()}
                width: 100%;
                padding: ${s('md')};
                font-size: 1rem;
                font-family: inherit;
            }

            & .setup__hint { margin: 0 0 ${s('md')}; color: ${t('text-muted')}; font-size: 0.82rem; }

            & .setup__note {
                margin: ${s('sm')} 0 0; font-size: 0.82rem; color: ${t('text-muted')};
                &:empty { display: none; }
            }

            & .setup__warn {
                margin: ${s('sm')} 0 0; font-size: 0.82rem; color: ${t('error')};
                white-space: pre-line;
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

            & .setup__tee-defaults {
                margin-top: ${s('lg')};
                &.hidden { display: none; }
                & h3 {
                    margin: 0 0 ${s('xs')}; font-size: 0.95rem; font-weight: 700;
                }
                & .setup__hint { margin-bottom: ${s('sm')}; }
            }
            & .setup__teerow {
                display: grid; grid-template-columns: minmax(4rem, 0.4fr) 1fr;
                align-items: center; gap: ${s('sm')}; margin-top: ${s('sm')};
                font-size: 0.9rem; font-weight: 700;
            }

            & .setup__seg {
                display: flex; gap: ${s('sm')}; margin-bottom: ${s('md')};
                & button {
                    ${btn()}
                    flex: 1; padding: ${s('md')} 0;
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
                & .player__name { ${input()} flex: 1; padding: ${s('md')}; font-size: 1rem; }
                & .player__remove {
                    ${btn()}
                    width: 38px; height: 38px; flex-shrink: 0;
                    font-size: 1rem; color: ${t('text-muted')};
                }
                & .player__fields { display: flex; gap: ${s('sm')}; align-items: stretch; }
                & .player__index { ${input()} flex: 1; min-width: 0; padding: ${s('md')}; font-size: 1rem; }
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
                ${btn()}
                width: 100%; margin-top: ${s('md')}; padding: ${s('md')};
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }
            & .setup__add.hidden { display: none; }

            & .setup__friends {
                margin-top: ${s('sm')}; padding: ${s('sm')}; ${card()}
                &.hidden { display: none; }

                & .setup__friendrows { display: flex; flex-direction: column; }
                & .setup__hint { margin: ${s('xs')} ${s('sm')}; }
                & .setup__friendrows:not(:empty) + .setup__hint { display: none; }

                & .frow {
                    display: flex; align-items: baseline; gap: ${s('sm')};
                    width: 100%; padding: ${s('md')} ${s('sm')};
                    background: none; border: none; border-bottom: 1px solid ${t('border')};
                    font-family: inherit; text-align: left; cursor: pointer;
                    &:last-child { border-bottom: none; }

                    & .frow__name { font-weight: 600; font-size: 0.95rem; }
                    & .frow__username {
                        flex: 1; min-width: 0; color: ${t('text-muted')}; font-size: 0.8rem;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    & .frow__hcp {
                        flex-shrink: 0; font-weight: 700; font-size: 0.85rem;
                        color: ${t('accent')}; background: ${t('accent-soft')};
                        border-radius: ${t('radius-pill')}; padding: 2px 10px;
                        font-variant-numeric: tabular-nums;
                    }
                }
            }

            & .setup__banner {
                color: ${t('error')}; font-size: 0.875rem; margin-bottom: ${s('md')};
                white-space: pre-line;
                &:empty { display: none; }
            }

            /* Ball teams (the players step's shared-ball section). Collapsed it
               is a pitch; opened it is a stack of team cards reusing the .fslot
               chrome. Both halves live in one section, so exactly one is on
               screen at a time. */
            & .bteams__pitch, & .bteams {
                &.hidden { display: none; }
            }
            /* One heading rhythm across both halves — the pitch and the opened
               section are the same section, and a heading that changed size on
               open would read as a different one. */
            & .bteams__pitch > h2, & .bteams > h2 { margin: 0 0 ${s('sm')}; }

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
                    ${btn()}
                    width: 38px; height: 38px; flex-shrink: 0;
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
                /* The knob host is a pass-through: its children must sit in the
                   card's own column, or an empty host (the formats declaring no
                   knobs — most of them) would still take a gap. */
                & .fslot__configs { display: contents; }
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
                        & input { ${input()} width: 56px; padding: ${s('xs')} ${s('sm')}; font-size: 0.95rem; }
                    }
                }

                /* Track segmented control (docs/design-guidelines.md §2). The
                   selection reads from ELEVATION — a raised pill on a sunken
                   track — not from saturation. A solid primary fill is
                   reserved for primary actions; a knob that records a
                   preference must not look like a Save button. Deliberately
                   NOT the btn() recipe: btn() emits its own sizing and border,
                   which is exactly the full-bleed slab this replaces. */
                & .fslot__seg {
                    display: inline-flex; align-self: flex-start; gap: 2px;
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
                    }
                }
                /* A knob whose options are all short sits on ONE row — label
                   left, track right. The base group is the column layout, so
                   the inline variant overrides its direction rather than
                   forking the template. */
                & .fslot__knob--inline {
                    flex-direction: row; align-items: center; justify-content: space-between;
                    gap: ${s('sm')};
                    & .fslot__seg { align-self: auto; flex-shrink: 0; }
                }
                /* The sentence a short label can't carry — drawn for the
                   SELECTED option only, and empty for self-evident pairs. */
                & .fslot__hint {
                    margin: 0; font-size: 0.78rem; line-height: 1.4; color: ${t('text-muted')};
                    &:empty { display: none; }
                }
                & .fslot__err {
                    font-size: 0.82rem; color: ${t('error')};
                    &:empty { display: none; }
                }

                /* Game-panel extras. Scoped INSIDE .fslot: the panel roots on
                   .fslot so it inherits the card chrome, and these classes are
                   only meaningful there. */
                & .grow {
                    display: flex; align-items: center; gap: ${s('sm')};
                    & .grow__name { flex: 1; min-width: 0; font-size: 0.9rem; }
                    & .fslot__seg { flex: 0 0 auto; & button { min-width: 40px; padding: ${s('xs')} ${s('sm')}; } }
                }
                & .gaddball {
                    ${btn()}
                    align-self: flex-start; margin-top: ${s('xs')};
                    padding: ${s('xs')} ${s('sm')};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }
                & .gsummary {
                    margin: 0; padding-top: ${s('xs')}; border-top: 1px solid ${t('border')};
                    font-size: 0.82rem; color: ${t('text-muted')};
                }
                /* Which round teams this game is contested between, and what
                   else is playing them (format-templates §3). Empty for a game
                   with no team-backed ball — and an empty <p> would otherwise
                   still eat one of the card's gaps. */
                & .gsides {
                    margin: 0; font-size: 0.82rem; color: ${t('text-muted')};
                    &:empty { display: none; }
                }
                & .gadjust {
                    ${btn()}
                    align-self: flex-start; padding: ${s('xs')} ${s('sm')};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }

                & .grp__start {
                    display: flex; gap: ${s('sm')}; align-items: stretch;
                    & .grp__time { ${input()} flex: 1; min-width: 0; padding: ${s('sm')} ${s('md')}; font-size: 1rem; font-family: inherit; }
                    & .grp__hole { flex: 1; min-width: 0; font-size: 1rem; }
                }
            }

            & .setup__create {
                ${btn()}
                width: 100%; padding: ${s('lg')}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit;
                background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                box-shadow: ${t('shadow-elevated')};
                &:hover { background: ${t('primary')}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            & .setup__cancel {
                ${btn()}
                width: 100%; margin-top: ${s('md')}; padding: ${s('md')};
                background: none; font-family: inherit; font-weight: 600; font-size: 0.95rem;
                color: ${t('text-muted')};
                &.hidden { display: none; }
            }

            & .setup__blocked {
                padding: ${s('lg')}; ${card()}
                background: ${t('surface-sunken')}; color: ${t('text-muted')};
                font-size: 0.95rem; margin-bottom: ${s('xl')};
                &.hidden { display: none; }
            }

            & .setup__locknote {
                margin: ${s('sm')} 0 0; font-size: 0.8rem; color: ${t('text-muted')};
                &.hidden { display: none; }
            }
        }

        /* --- Handicap keypad: bottom sheet replacing the system keyboard.
           A phone's numeric keyboard can't type golf's "+" (plus handicap)
           and Swedish keyboards produce a decimal comma — so the field is
           readonly and this pad owns entry (hardware keys still work). */
        .hcp {
            position: fixed; inset: 0; z-index: 70;
            &.hidden { display: none; }

            & .hcp__backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.35); }
            & .hcp__sheet {
                position: absolute; left: 0; right: 0; bottom: 0;
                background: ${t('surface')};
                border-top-left-radius: 16px; border-top-right-radius: 16px;
                /* Clear the iOS home indicator; harmless zero elsewhere. */
                padding: ${s('sm')} ${s('md')} calc(${s('xl')} + env(safe-area-inset-bottom));
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
            }
            & .hcp__head { display: flex; align-items: center; gap: ${s('md')}; padding: ${s('sm')} ${s('xs')} ${s('md')}; }
            & .hcp__who { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
            & .hcp__name {
                font-family: ${t('font-display')}; font-weight: 600; color: ${t('text')};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .hcp__chline { font-size: 0.78rem; color: ${t('text-muted')}; font-variant-numeric: tabular-nums; }
            & .hcp__val {
                min-width: 72px; text-align: right; color: ${t('text')};
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.6rem;
                font-variant-numeric: tabular-nums;
                &.empty { color: ${t('text-muted')}; font-weight: 400; font-size: 1rem; }
            }
            & .hcp__bs { ${btn()} width: 44px; height: 44px; flex-shrink: 0; font-size: 1.1rem; }
            & .hcp__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
            & .hcp-key {
                ${btn()}
                height: 52px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.2rem;

                & .hcp-key__lbl { font-size: 0.62rem; font-weight: 600; color: ${t('text-muted')}; &:empty { display: none; } }
                &.on {
                    background: ${t('primary')}; color: ${t('primary-text')}; border-color: ${t('primary')};
                    & .hcp-key__lbl { color: ${t('primary-text')}; }
                }
            }
            & .hcp__actions { display: flex; gap: ${s('sm')}; margin-top: ${s('md')}; }
            & .hcp__cancel { ${btn()} flex: 1; padding: ${s('md')}; font-family: inherit; font-weight: 700; font-size: 0.95rem; }
            & .hcp__ok {
                ${btn()}
                flex: 2; padding: ${s('md')}; font-family: inherit; font-weight: 700; font-size: 0.95rem;
                background: ${t('primary')}; color: ${t('primary-text')}; border-color: ${t('primary')};
                &:hover { background: ${t('primary')}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;

    private svc = this.inject(SetupService);
    private router = this.inject(Router);
    private auth = this.inject(AuthService);
    private profile = this.inject(ProfileService);
    private friends = this.inject(FriendsService);
    /** The compact "From friends" picker is a disclosure under its button. */
    private pickerOpen = new Signal(false);
    /** Player key whose HCP index the keypad edits; null = pad closed. The
     * field is readonly (no system keyboard) — this pad owns handicap entry. */
    private hcpPadFor = new Signal<number | null>(null);
    /** The pad's uncommitted text, in golf notation ("18,4", "+2.4"). */
    private hcpDraft = new Signal('');
    /** Confirm before saving a course/route change onto an already-scored round. */
    private routeChangeOpen = new Signal(false);

    render(): DocumentFragment {
        // A `?token=` in the URL puts the flow in EDIT MODE — load the stored
        // draft behind that token and prefill every control (SetupService.
        // loadForEdit resets first). No token ⇒ the fresh-round path. Reading the
        // query here (in render, once per mount) — never in a field initializer,
        // which would re-run on every $swap remount ($swap-signal footgun).
        const editToken = this.router.query('token').get();
        const isEdit = !!editToken;
        this.pickerOpen.set(false);
        this.hcpPadFor.set(null);
        if (isEdit) {
            void this.svc.loadForEdit(editToken);
        } else {
            // The service is a DI singleton — clear any prior draft so a second
            // visit to New Round starts empty instead of leaking prior state.
            this.svc.reset();
            void this.svc.load();
        }
        // Logged in: fetch the profile ("Add me" prefill) + the friends list
        // (the "From friends" picker). Skipped in edit mode — the roster is
        // fixed by the stored draft; adding self/friends still works via the
        // buttons, but the prefill fetch isn't needed for the edit affordance.
        if (this.auth.currentUser.get()) {
            void this.profile.load().then(() => {
                // Signed in, fresh round: the STARTING roster is me, not an
                // empty row (iOS B5.1 parity). Guarded inside the service —
                // this resolves in a race with load()/selectCourse().
                if (isEdit) return;
                const p = this.profile.player.get();
                if (p) {
                    this.svc.seedSelf({
                        id: p.id,
                        displayName: p.displayName,
                        handicapIndex: p.handicapIndex,
                        gender: p.gender,
                    });
                    this.svc.setOrganizerPreferredTeeRole(p.gender, p.preferredTeeRoleKey);
                }
            });
            void this.friends.load();
        }

        // Edit mode where the round is no longer editable (complete / no stored
        // draft): the form is hidden and a friendly note shown instead.
        const editBlocked = () => isEdit && this.svc.editBlockedReason.get() !== null;
        // Editing a round that already has scores. NOT a lock — course, preset
        // and start hole stay usable, because "I started on the wrong course /
        // the wrong hole" is exactly the mistake this screen has to repair.
        // Scores stay on the hole POSITIONS they were entered at; the note
        // below says so, and `scoredRouteChange()` asks before saving.
        const scoredEdit = () => isEdit && this.svc.hasScores.get();
        // A competition round IS locked on course + route, scored or not: those
        // holes are the organizer's published field, shared with the whole
        // competition, not one token holder's to move. Everything else on the
        // round stays editable here.
        const competitionEdit = () => isEdit && this.svc.competitionRound.get();

        // The "Add me" row rides on the logged-in profile: shown while signed
        // in and not already on the roster.
        const me = () => this.profile.player.get();
        const canAddMe = () => {
            const p = me();
            return (
                this.auth.currentUser.get() !== null &&
                p !== null &&
                !this.svc.hasPlayer(p.id)
            );
        };

        const frag = this.wire(tpl, {
            // When the round can't be edited, hide the form body and show only
            // the blocked note + back button (the modifier greys everything else).
            root: { className: () => (editBlocked() ? 'setup setup--blocked' : 'setup') },
            back: {
                textContent: () => (isEdit ? '← Back to round' : '← Home'),
                onclick: () =>
                    isEdit && editToken
                        ? this.router.navigate('/round', { query: { token: editToken } })
                        : this.router.navigate('/'),
            },
            title: { textContent: () => (isEdit ? 'Edit round' : 'New round') },
            subtitle: {
                textContent: () =>
                    isEdit ? 'Change the setup — scored balls are preserved.' : 'No sign-in required.',
            },
            blocked: {
                className: () => (editBlocked() ? 'setup__blocked' : 'setup__blocked hidden'),
                textContent: () =>
                    this.svc.editBlockedReason.get() === 'round_complete'
                        ? 'This round is complete — its setup can no longer be edited.'
                        : this.svc.editBlockedReason.get() === 'no_stored_draft'
                          ? "This round didn't come from the setup wizard, so it can't be edited here."
                          : this.svc.editBlockedReason.get() === 'has_open_seats'
                            ? 'This round has open seats waiting to be claimed — the wizard cannot edit it yet.'
                            : '',
            },
            roundName: {
                value: () => this.svc.roundName.get(),
                oninput: (e: Event) =>
                    this.svc.roundName.set((e.target as HTMLInputElement).value),
            },
            lockNote: {
                className: () =>
                    competitionEdit() || scoredEdit()
                        ? 'setup__locknote'
                        : 'setup__locknote hidden',
                textContent: () =>
                    competitionEdit()
                        ? 'This round is part of a competition. The course and the holes are set by the organizer and cannot be changed here — everything else on the round still can be.'
                        : scoredEdit()
                          ? 'Scores are already recorded. You can still change the course, the route and the start hole — every score stays on the hole it was entered on, counting from the start. Holes you have already scored have to stay on the route.'
                          : '',
            },
            routeErr: { textContent: () => this.svc.humanizedRoute().join('\n') },
            teeDefaults: {
                className: () =>
                    !isEdit && this.svc.tees.get().length > 0
                        ? 'setup__tee-defaults'
                        : 'setup__tee-defaults hidden',
            },
            rosterErr: { textContent: () => this.svc.humanizedRoster().join('\n') },
            cancel: {
                className: () => (isEdit ? 'setup__cancel' : 'setup__cancel hidden'),
                onclick: () =>
                    editToken && this.router.navigate('/round', { query: { token: editToken } }),
            },
            addPlayer: { onclick: () => this.svc.addPlayer() },
            addMe: {
                className: () => (canAddMe() ? 'setup__add setup__addme' : 'setup__add setup__addme hidden'),
                textContent: () => `+ Add me (${me()?.displayName ?? ''})`,
                onclick: () => {
                    const p = me();
                    if (p) this.svc.addMe({ id: p.id, displayName: p.displayName, handicapIndex: p.handicapIndex, gender: p.gender });
                },
            },
            // "From friends": only a logged-in player with a non-empty friends
            // list sees it; it discloses a compact picker of friends not
            // already on the roster.
            addFriends: {
                className: () =>
                    this.auth.currentUser.get() !== null && this.friends.friends.get().length > 0
                        ? 'setup__add setup__addme'
                        : 'setup__add setup__addme hidden',
                textContent: () => (this.pickerOpen.get() ? '− From friends' : '+ From friends'),
                onclick: () => this.pickerOpen.set(!this.pickerOpen.get()),
            },
            friendPicker: {
                className: () =>
                    this.pickerOpen.get() &&
                    this.auth.currentUser.get() !== null &&
                    this.friends.friends.get().length > 0
                        ? 'setup__friends'
                        : 'setup__friends hidden',
            },
            // Ball teams — optional, collapsed to a pitch until someone is
            // actually pairing up. No formation catalog ⇒ no section at all.
            ballTeamsSection: {
                className: () =>
                    this.svc.ballTeamsAvailable() ? 'setup__section' : 'setup__section hidden',
            },
            ballPitch: {
                className: () => (this.svc.ballTeamsExpanded() ? 'bteams__pitch hidden' : 'bteams__pitch'),
            },
            ballOpen: {
                className: () => (this.svc.ballTeamsExpanded() ? 'bteams' : 'bteams hidden'),
            },
            ballHeading: {
                textContent: () => {
                    const n = this.svc.ballTeamCount();
                    return n === 0 ? 'Sharing a ball' : `Sharing a ball · ${n} team${n === 1 ? '' : 's'}`;
                },
            },
            openBallTeams: { onclick: () => this.svc.openBallTeams() },
            addBallTeam: { onclick: () => this.svc.addBallTeam() },
            // The flexible sections hold whatever no card owns, so they appear
            // once a custom game exists or a game's details were adjusted
            // (format-templates §5) — never while the round is only cards.
            teamsSection: {
                className: () => (this.svc.showFlexible() ? 'setup__section' : 'setup__section hidden'),
            },
            formatsSection: {
                className: () => (this.svc.showFlexible() ? 'setup__section' : 'setup__section hidden'),
            },
            addTeam: { onclick: () => this.svc.addTeam() },
            splitGroups: {
                className: () => (this.svc.groupsEnabled() ? 'setup__add hidden' : 'setup__add'),
                onclick: () => this.svc.splitIntoGroups(),
            },
            addGroup: {
                className: () => (this.svc.groupsEnabled() ? 'setup__add' : 'setup__add hidden'),
                onclick: () => this.svc.addGroup(),
            },
            clearGroups: {
                className: () => (this.svc.groupsEnabled() ? 'setup__add' : 'setup__add hidden'),
                onclick: () => this.svc.clearGroups(),
            },
            groupNote: {
                textContent: () => {
                    const out = this.svc.ungroupedPlayers();
                    if (out.length === 0) return '';
                    const who = out.map((p) => p.name.trim() || 'A player').join(', ');
                    return `${who} ${out.length > 1 ? "aren't" : "isn't"} in a group yet — every player needs one.`;
                },
            },
            groupWarn: {
                textContent: () =>
                    [
                        ...this.svc.crossGroupTeamWarnings(),
                        ...this.svc.diagnosticsForGroups().map((d) => d.message),
                    ].join('\n'),
            },
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
                        ...this.svc.humanizedGeneral(),
                        ...(this.svc.submitError.get() ? [this.svc.submitError.get()!] : []),
                    ];
                    return msgs.join('\n');
                },
            },
            create: {
                disabled: () => this.svc.submitting.get(),
                textContent: () =>
                    this.svc.submitting.get()
                        ? isEdit
                            ? 'Saving…'
                            : 'Creating…'
                        : isEdit
                          ? 'Save changes'
                          : 'Create round',
                onclick: () => {
                    // Re-labelling the holes of a round that already has scores
                    // is legal and often the whole point of opening this screen
                    // — but it moves every card onto a different hole, so it is
                    // asked about once rather than done silently.
                    if (this.svc.scoredRouteChange()) {
                        this.routeChangeOpen.set(true);
                        return;
                    }
                    void this.save();
                },
            },
            // --- Handicap keypad (bottom sheet) ---
            hcpPad: { className: () => (this.hcpPadFor.get() !== null ? 'hcp' : 'hcp hidden') },
            hcpBackdrop: { onclick: () => this.hcpPadFor.set(null) },
            hcpName: { textContent: () => this.hcpPlayer()?.name?.trim() || 'Player' },
            hcpCh: {
                textContent: () => {
                    const p = this.hcpPlayer();
                    if (!p) return '';
                    const d = this.svc.derivedCH({ ...p, handicapIndex: this.hcpDraft.get() });
                    return d
                        ? `Course handicap ${d.ch} · ${d.teeName}`
                        : 'WHS index — “+” means a plus handicap.';
                },
            },
            hcpVal: {
                className: () => (this.hcpDraft.get() ? 'hcp__val' : 'hcp__val empty'),
                textContent: () => this.hcpDraft.get() || 'HCP index',
            },
            hcpBack: { onclick: () => this.hcpDraft.set(this.hcpDraft.get().slice(0, -1)) },
            hcpCancel: { onclick: () => this.hcpPadFor.set(null) },
            hcpOk: {
                // Empty commits (clears the field); guarded partial input (a
                // lone "+") can't commit.
                disabled: () =>
                    this.hcpDraft.get() !== '' && parseHandicapIndex(this.hcpDraft.get()) === null,
                onclick: () => this.hcpCommit(),
            },
        });

        // Keypad grid: 1–9, then [+ plus hcp] [0] [decimal separator]. The
        // separator glyph follows the locale (Swedish writes "18,4") — the
        // parser accepts both "," and ".".
        const hcpKeys = this.ref(frag, 'hcpKeys');
        for (const n of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
            hcpKeys.appendChild(this.hcpKey(n, '', () => this.hcpAppendDigit(n)));
        }
        hcpKeys.appendChild(
            this.wireEl(hcpKeyTpl, {
                key: {
                    className: () => (this.hcpDraft.get().startsWith('+') ? 'hcp-key on' : 'hcp-key'),
                    onclick: () => this.hcpTogglePlus(),
                },
                num: { textContent: '+' },
                lbl: { textContent: 'plus hcp' },
            }),
        );
        hcpKeys.appendChild(this.hcpKey('0', '', () => this.hcpAppendDigit('0')));
        hcpKeys.appendChild(this.hcpKey(hcpSep(), '', () => this.hcpAppendSep()));

        // Hardware keyboards keep working while the pad is up (desktop, or a
        // phone with an external keyboard): digits, both decimal separators,
        // +/- for a plus handicap, Backspace, Enter commits, Escape closes.
        const onHcpKey = (e: KeyboardEvent) => {
            if (this.hcpPadFor.get() === null) return;
            if (e.key >= '0' && e.key <= '9') this.hcpAppendDigit(e.key);
            else if (e.key === ',' || e.key === '.') this.hcpAppendSep();
            else if (e.key === '+' || e.key === '-') this.hcpTogglePlus();
            else if (e.key === 'Backspace') this.hcpDraft.set(this.hcpDraft.get().slice(0, -1));
            else if (e.key === 'Enter') this.hcpCommit();
            else if (e.key === 'Escape') this.hcpPadFor.set(null);
            else return;
            e.preventDefault();
        };
        document.addEventListener('keydown', onHcpKey);
        this.track(() => document.removeEventListener('keydown', onHcpKey));

        // The keypad overlay lives on <body>, not inside the app shell: iOS
        // composites the shell's touch scroller (.app-shell__content), which
        // breaks position:fixed + z-index for descendants — the tabbar painted
        // over the pad's Done row. A direct body child stacks above everything
        // unconditionally. Moved only AFTER its keys are built (ref() searches
        // the frag); bindings survive the move, and unmount removes it
        // explicitly since it no longer tears down with the fragment's DOM.
        const hcpPadEl = this.ref(frag, 'hcpPad');
        document.body.appendChild(hcpPadEl);
        this.track(() => hcpPadEl.remove());

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
                            disabled: () => competitionEdit(),
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
            disabled: { get: () => competitionEdit() },
        });
        this.mountSelect(this.ref(frag, 'startHole'), compTrack, {
            value: this.bound(
                compTrack,
                () => String(this.svc.startHole.get()),
                (v) => this.svc.startHole.set(Number(v)),
            ),
            options: { get: () => this.svc.startHoleOptions().map((n) => ({ value: String(n), label: String(n) })) },
            disabled: { get: () => competitionEdit() },
        });
        const teeOptions = () => this.svc.tees.get().map((tee) => ({ value: tee.id, label: tee.name }));
        this.mountSelect(this.ref(frag, 'maleDefaultTee'), compTrack, {
            value: this.bound(
                compTrack,
                () => this.svc.defaultTeeId('M'),
                (value) => this.svc.setRoundDefaultTee('M', value),
            ),
            options: { get: teeOptions },
            placeholder: 'Choose tee',
        });
        this.mountSelect(this.ref(frag, 'femaleDefaultTee'), compTrack, {
            value: this.bound(
                compTrack,
                () => this.svc.defaultTeeId('F'),
                (value) => this.svc.setRoundDefaultTee('F', value),
            ),
            options: { get: teeOptions },
            placeholder: 'Choose tee',
        });

        // The picker lists friends NOT already on the roster (dedupe by player
        // id); tapping one adds a registered-player row and drops it from the
        // list. Rows track the roster reactively, so an added friend vanishes
        // and a removed one reappears.
        this.$each(
            this.ref(frag, 'friendRows'),
            // Frecency order — the on-course "who's playing today?" moment wants
            // regulars first (same sort module as the Friends tab, always
            // Suggested here — no A–Z toggle in the picker).
            () =>
                sortFriends(
                    this.friends.friends.get().filter((f) => !this.svc.hasPlayer(f.id)),
                    'frecency',
                ),
            (f, _i, track) =>
                this.wireEl(
                    friendRowTpl,
                    {
                        row: {
                            onclick: () =>
                                this.svc.addFriend({
                                    id: f.id,
                                    displayName: f.displayName,
                                    handicapIndex: f.handicapIndex,
                                    gender: f.gender,
                                }),
                        },
                        name: () => f.displayName,
                        username: () => `@${f.username}`,
                        hcp: () => (f.handicapIndex === null ? '–' : f.handicapIndex.toFixed(1)),
                    },
                    track,
                ),
            (f) => f.id,
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

        // The game cards. MULTI-SELECT: a card toggles that game on or off, so
        // a round can be several games at once. The list is the descriptors'
        // own `preset` declarations — no client-side template registry
        // (format-templates §6). "+ Custom game" is the last card and is
        // additive too: it reveals the flexible sections without unpicking
        // anything.
        this.$each(
            this.ref(frag, 'cards'),
            () => [...this.svc.presetGames().map((d) => d.id), '__custom'],
            (id, _i, track) =>
                id === '__custom'
                    ? this.wireEl(
                          gameCardTpl,
                          {
                              card: {
                                  className: () => 'gcard gcard--custom',
                                  onclick: () => this.svc.addCustomGame(),
                              },
                              name: { textContent: '+ Custom game' },
                              tag: { textContent: "Anything the cards don't cover — teams and formats by hand." },
                              shape: { textContent: '' },
                          },
                          track,
                      )
                    : this.gameCard(id, track),
            (id) => id,
        );

        // One panel per picked game, holding its participants and its knobs.
        this.$each(
            this.ref(frag, 'games'),
            this.svc.picked,
            (pick, _i, track) => this.gamePanel(pick.key, track),
            (pick) => pick.key,
        );

        // Round-level team cards (ADR-0003) — only the ones no picked game
        // owns; a game's balls are edited on its own panel.
        this.$each(
            this.ref(frag, 'teams'),
            () => this.svc.customTeams(),
            (team, _i, track) => this.teamCard(team.key, track),
            (team) => team.key,
        );

        // Ball teams — the guided section's own cards. Section-owned, so the
        // flexible Teams list above deliberately never shows them.
        this.$each(
            this.ref(frag, 'ballTeams'),
            () => this.svc.sectionTeams(),
            (team, _i, track) => this.ballTeamCard(team.key, track),
            (team) => team.key,
        );

        // Playing-group cards (Phase 3.5).
        this.$each(
            this.ref(frag, 'groups'),
            this.svc.groups,
            (group, _i, track) => this.groupCard(group.key, track),
            (group) => group.key,
        );

        // Format slots. Keyed by stable slot key; each card reads its slot by
        // key so reorder/edit never recreates the card (focus + carets intact).
        // Only the slots no picked game owns — a game's slot IS its panel.
        this.$each(
            this.ref(frag, 'formats'),
            () => this.svc.customSlots(),
            (slot, _i, track) => this.formatCard(slot.key, track),
            (slot) => slot.key,
        );

        this.spawn(ConfirmComponent, this.ref(frag, 'confirmHost'), {
            open: this.routeChangeOpen,
            title: 'Move this round to the new holes?',
            message:
                'The scores already entered stay where they are: the first hole you scored stays the first hole you played, and so on down the card. Only which hole each one is — course, number, par and stroke index — changes.',
            confirmLabel: 'Save changes',
            cancelLabel: 'Cancel',
            onconfirm: () => void this.save(),
        });

        return frag;
    }

    /** Submit the wizard, landing on the round (edit: the same one; create: the new one). */
    private async save(): Promise<void> {
        const result = await this.svc.submit();
        if (result.ok) this.router.navigate('/round', { query: { token: result.token } });
    }

    /**
     * Mount a framework `SelectComponent` into a host, disposing it through the
     * caller's `track` (so a select inside a keyed row tears down with the row —
     * `spawn` self-tracks at component scope, which would leak here).
     */
    private mountSelect(
        host: HTMLElement,
        track: (d: () => void) => void,
        props: {
            value: Signal<string>;
            options: { get: () => SelectOption[] };
            placeholder?: string;
            disabled?: { get: () => boolean };
        },
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

    /**
     * One game card. The title is the format's own catalog label (so it reads
     * "Köpenhamnare" in Swedish, "Split sixes" in English) and the subtitle
     * switches to the roster requirement when the card can't be played yet —
     * eligibility is DISCOVERY, not a gate (format-templates §4).
     */
    private gameCard(formatId: string, track: (d: () => void) => void): HTMLElement {
        const fits = () => this.svc.gameFits(formatId);
        return this.wireEl(
            gameCardTpl,
            {
                card: {
                    className: () => (this.svc.isGamePicked(formatId) ? 'gcard on' : 'gcard'),
                    disabled: () => !fits(),
                    onclick: () => this.svc.toggleGame(formatId),
                },
                name: { textContent: () => this.svc.gameLabel(formatId) },
                tag: {
                    textContent: () =>
                        fits()
                            ? this.svc.catalog.taglineOf(formatId)
                            : this.svc.gameNeedsText(formatId),
                },
                shape: { textContent: () => (fits() ? this.svc.gameShapeText(formatId) : '') },
            },
            track,
        );
    }

    /**
     * One picked game: its allowance, its declared knobs, and the only residual
     * decision it leaves — which ball each player is on, or sitting this one
     * out. An individual game (everyone their own ball) shows no ball rows.
     */
    private gamePanel(gameKey: number, track: (d: () => void) => void): HTMLElement {
        const pick = () => this.svc.pickedByKey(gameKey);
        const slot = () => this.svc.slotForGame(gameKey);
        const formatId = () => pick()?.formatId ?? '';
        const hasBalls = () => (pick()?.ballCount ?? 0) > 0;

        const el = this.wireEl(
            gamePanelTpl,
            {
                title: { textContent: () => this.svc.gameLabel(formatId()) },
                remove: { onclick: () => this.svc.unpickGame(gameKey) },
                desc: { textContent: () => this.svc.catalog.byId(formatId())?.description ?? '' },
                // Uncontrolled: static initial value, oninput-only (no caret reset).
                allowance: {
                    value: slot()?.allowancePct ?? '100',
                    oninput: (e: Event) => {
                        const s = slot();
                        if (s) this.svc.setSlotAllowance(s.key, (e.target as HTMLInputElement).value);
                    },
                },
                ballGroup: { hidden: () => !hasBalls() },
                addBall: {
                    className: () => (this.svc.canAddBall(gameKey) ? 'gaddball' : 'gaddball hidden'),
                    onclick: () => this.svc.addBall(gameKey),
                },
                err: {
                    // The slot's draft position is read LAZILY — adding or
                    // removing a game above this one shifts it.
                    textContent: () => {
                        const s = slot();
                        return [
                            ...this.svc.gameWarnings(gameKey),
                            ...(s ? this.svc.humanizedForFormat(this.svc.slotIndex(s.key)) : []),
                            // `.fslot__err` is a plain inline run — joining on
                            // a newline would collapse two warnings into one
                            // wrapped sentence. Same separator the flexible
                            // format card uses.
                        ].join(' · ');
                    },
                },
                // Teams are ROUND-level and reused (format-templates §3): say
                // which sides this game plays and what else plays them, and
                // offer the fork only while something else actually does.
                sides: { textContent: () => this.svc.gameSidesText(gameKey) },
                fork: {
                    className: () => (this.svc.gameSharesSides(gameKey) ? 'gadjust' : 'gadjust hidden'),
                    onclick: () => this.svc.forkGame(gameKey),
                },
                summary: { textContent: () => this.svc.gameSummary(gameKey) },
                adjust: { onclick: () => this.svc.adjustGame(gameKey) },
            },
            track,
        );

        // The game's declared knobs, straight off the descriptor — the same
        // rows the flexible format card renders (format-templates §2).
        this.eachInto(
            this.ref(el, 'configFields'),
            track,
            () => this.svc.catalog.byId(formatId())?.configFields ?? [],
            (field, _i, fieldTrack) =>
                this.configField(() => slot()?.key ?? null, field, fieldTrack),
            (field) => `${formatId()}:${field.key}`,
        );

        this.eachInto(
            this.ref(el, 'ballRows'),
            track,
            () => (hasBalls() ? this.svc.players.get() : []),
            (p, _i, rowTrack) => this.ballRow(gameKey, p.key, rowTrack),
            (p) => p.key,
        );
        return el;
    }

    /**
     * One player's ball pick within one game: a button per ball plus "–" to sit
     * THIS game out. The pick is per game (§4) — but a ball backed by a SHARED
     * side edits that side, so the move follows the player into every game
     * playing it (§3). "Use separate teams" is the escape hatch.
     */
    private ballRow(gameKey: number, playerKey: number, track: (d: () => void) => void): HTMLElement {
        const el = this.wireEl(
            ballRowTpl,
            {
                name: {
                    textContent: () =>
                        this.svc.players.get().find((p) => p.key === playerKey)?.name?.trim() || 'Player',
                },
            },
            track,
        );
        this.eachInto(
            this.ref(el, 'seg'),
            track,
            () => [...this.svc.gameBalls(gameKey), null] as (number | null)[],
            (ball, _i, btnTrack) =>
                this.wireEl(
                    template(`<button bind="b" type="button"></button>`),
                    {
                        b: {
                            textContent: () => (ball === null ? '–' : this.svc.teamLetter(ball)),
                            className: () => (this.svc.ballOf(gameKey, playerKey) === ball ? 'on' : ''),
                            onclick: () => this.svc.assignBall(gameKey, playerKey, ball),
                        },
                    },
                    btnTrack,
                ),
            (ball) => String(ball),
        );
        return el;
    }

    private formatCard(key: number, track: (d: () => void) => void): HTMLElement {
        const slot = () => this.svc.slotByKey(key);
        const formatId = () => slot()?.formatId ?? '';

        const el = this.wireEl(
            fslotTpl,
            {
                remove: { onclick: () => this.svc.removeFormatSlot(key) },
                desc: { textContent: () => this.svc.catalog.byId(formatId())?.description ?? '' },
                // Uncontrolled: static initial value, oninput-only (no caret reset).
                allowance: {
                    value: this.svc.slotByKey(key)?.allowancePct ?? '100',
                    oninput: (e: Event) => this.svc.setSlotAllowance(key, (e.target as HTMLInputElement).value),
                },
                allowanceHint: {
                    textContent: () =>
                        this.svc.isSideFormat(formatId())
                            ? 'applied to each member’s own ball'
                            : 'of each player’s course handicap',
                },
                err: {
                    // Read the draft position LAZILY: a slot's index shifts
                    // whenever a game above it is added or removed.
                    textContent: () =>
                        this.svc.humanizedForFormat(this.svc.slotIndex(key)).join(' · '),
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
                get: () =>
                    this.svc.catalog
                        .descriptors.get()
                        .map((d) => ({ value: d.id, label: this.svc.catalog.labelOf(d) ?? d.label })),
            },
        });

        // Format-config knobs — whatever the DESCRIPTOR declares, nothing the
        // client knows per format (format-templates §2). Re-reads the descriptor
        // through `formatId()` so switching a slot's format swaps its knobs; the
        // key carries the format id so a same-named field of a different format
        // is a different row rather than a stale closure.
        this.eachInto(
            this.ref(el, 'configFields'),
            track,
            () => this.svc.catalog.byId(formatId())?.configFields ?? [],
            (field, _i, fieldTrack) => this.configField(() => key, field, fieldTrack),
            (field) => `${formatId()}:${field.key}`,
        );

        // Subject checklist — what this format can score. A SIDE format
        // (better-ball) scores multi-ball (side) teams only; a BALL format
        // scores individual players + single-ball teams + (ADR-0004, when the
        // format supports side aggregation) multi-ball sides as one virtual
        // subject each. One keyed list (kind-prefixed) so a single eachInto
        // owns the host.
        type Subj = { kind: 'player' | 'team'; subKey: number };
        const subjects = (): Subj[] => {
            const side = this.svc.isSideFormat(formatId());
            const out: Subj[] = [];
            if (!side) {
                out.push(...this.svc.players.get().map((p) => ({ kind: 'player' as const, subKey: p.key })));
            }
            // `customTeams`, not every team: a picked game's generated sides
            // are hidden from the Teams section, so offering them here would
            // let the user score a team they cannot see, name, or edit — and
            // whose membership silently re-derives from that game's balls
            // (format-templates §5: the flexible sections list only what no
            // card owns).
            for (const tm of this.svc.customTeams()) {
                if (this.svc.teamKindFitsFormat(formatId(), tm.kind)) {
                    out.push({ kind: 'team' as const, subKey: tm.key });
                }
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

    /**
     * One declared config knob of one slot. The active option is the slot's
     * stored value falling back to the field's declared default; picking one
     * only records it — the strategy's `validateConfig` (server-side) stays the
     * authority on what is legal, and its refusal arrives as a slot diagnostic.
     */
    private configField(
        slotKey: () => number | null,
        field: FormatConfigField,
        track: (d: () => void) => void,
    ): HTMLElement {
        // The slot is read LAZILY, per binding. A game panel is built in the
        // same pass that picks the game, and `pickGame()` appends to `picked`
        // BEFORE `regenerateGame()` mints the slot — so at construction time
        // there is no slot yet. Capturing `s.key` here rendered nothing at all.
        const valueOf = (): string => {
            const key = slotKey();
            return key === null ? field.default : this.svc.slotConfigValue(key, field);
        };
        // The hint belongs to whichever option is CURRENTLY selected, so it
        // re-reads the config on every change rather than being baked per option.
        const selectedHint = (): string => {
            const value = valueOf();
            const option = field.options.find((o) => o.value === value);
            return option ? this.svc.catalog.configHintOf(option) : '';
        };
        const el = this.wireEl(
            configFieldTpl,
            {
                label: { textContent: () => this.svc.catalog.configLabelOf(field) },
                hint: { textContent: selectedHint },
            },
            track,
        );
        if (this.svc.catalog.configFieldIsInline(field)) el.classList.add('fslot__knob--inline');
        this.eachInto(
            this.ref(el, 'options'),
            track,
            () => field.options,
            (option, _i, optionTrack) =>
                this.wireEl(
                    configOptionTpl,
                    {
                        opt: {
                            textContent: () => this.svc.catalog.configLabelOf(option),
                            className: () => (valueOf() === option.value ? 'on' : ''),
                            onclick: () => {
                                const key = slotKey();
                                if (key !== null) this.svc.setSlotConfig(key, field.key, option.value);
                            },
                        },
                    },
                    optionTrack,
                ),
            (option) => option.value,
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
            return `${this.svc.teamLabel(tm)} (${tm.kind === 'multi_ball' ? 'own balls' : 'one ball'})`;
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

    /**
     * One playing-group card: a start time (HH:MM), a start hole picked from
     * the chosen route's holes (shotgun = different holes per group), and the
     * group's players. Member ticks are EXCLUSIVE — ticking a player here
     * moves them out of their previous group (see `setGroupMember`).
     */
    private groupCard(key: number, track: (d: () => void) => void): HTMLElement {
        const el = this.wireEl(
            groupCardTpl,
            {
                remove: { onclick: () => this.svc.removeGroup(key) },
                groupName: {
                    textContent: () => {
                        const g = this.svc.groupByKey(key);
                        return g ? this.svc.groupLabel(g) : 'Group';
                    },
                },
                // Uncontrolled: static initial value, oninput-only (no caret reset).
                time: {
                    value: this.svc.groupByKey(key)?.startTime ?? '',
                    oninput: (e: Event) => this.svc.setGroupStartTime(key, (e.target as HTMLInputElement).value),
                },
                meta: {
                    textContent: () => {
                        const size = this.svc.groupSize(key);
                        if (size === 0) return 'Tick the players who walk with this group.';
                        return `${size} player${size === 1 ? '' : 's'}`;
                    },
                },
            },
            track,
        );
        // Start hole: the route's holes, '' = the route's first hole.
        this.mountSelect(this.ref(el, 'hole'), track, {
            value: this.bound(
                track,
                () => {
                    const h = this.svc.groupByKey(key)?.startHole;
                    return h == null ? '' : String(h);
                },
                (v) => this.svc.setGroupStartHole(key, v === '' ? null : Number(v)),
            ),
            options: {
                get: () => [
                    { value: '', label: 'First hole' },
                    ...this.svc.startHoleOptions().map((n) => ({ value: String(n), label: `Hole ${n}` })),
                ],
            },
        });
        this.eachInto(
            this.ref(el, 'memberRows'),
            track,
            () => this.svc.players.get(),
            (p, _i, rowTrack) => this.groupMemberRow(key, p.key, rowTrack),
            (p) => p.key,
        );
        return el;
    }

    /** A group member tick: exclusive across groups (a move, not a copy). */
    private groupMemberRow(
        groupKey: number,
        playerKey: number,
        track: (d: () => void) => void,
    ): HTMLElement {
        return this.wireEl(
            subjectRowTpl,
            {
                chk: {
                    checked: () => this.svc.groupMemberIn(groupKey, playerKey),
                    onchange: (e: Event) =>
                        this.svc.setGroupMember(groupKey, playerKey, (e.target as HTMLInputElement).checked),
                },
                name: {
                    textContent: () =>
                        this.svc.players.get().find((p) => p.key === playerKey)?.name?.trim() || 'Player',
                },
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
                                ? 'Tick at least 2 members — a team scored together needs ≥2 balls.'
                                : 'Tick at least 2 players to form a team ball.';
                        }
                        if (size < 2) return 'Add one more member — a team needs at least 2.';
                        if (isSide()) return `${size} balls · own ball each, scored together as a team`;
                        const ch = this.svc.teamBallCh(key);
                        return ch === null ? `${size} players` : `${size} players · plays off HCP ${ch}`;
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
                    { value: 'single_ball', label: 'Share one ball (scramble, foursomes)' },
                    { value: 'multi_ball', label: 'Own ball each, scored together as a team' },
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

    /**
     * One ball-team card in the players step. Everything here is about ONE
     * ball: which formation it is played under, who shares it, and what slice
     * of each of their handicaps the combined ball carries.
     */
    private ballTeamCard(key: number, track: (d: () => void) => void): HTMLElement {
        const el = this.wireEl(
            ballTeamTpl,
            {
                remove: { onclick: () => this.svc.removeBallTeam(key) },
                teamName: { textContent: () => this.svc.ballTeamLabel(key) },
                notice: {
                    textContent: () => this.svc.ballTeamNotice(key),
                    hidden: () => this.svc.ballTeamNotice(key) === '',
                },
                // The summary is the whole point of the card; until the team is
                // real it says what is still missing instead.
                summary: {
                    textContent: () => this.svc.ballTeamSummary(key) || this.svc.ballTeamHint(key),
                },
            },
            track,
        );
        // Formation chips — a short, closed list, so chips beat a dropdown.
        this.eachInto(
            this.ref(el, 'formations'),
            track,
            () => this.svc.formationChips(),
            (f, _i, optTrack) =>
                this.wireEl(
                    configOptionTpl,
                    {
                        opt: {
                            textContent: () => this.svc.formationLabel(f.id),
                            className: () => (this.svc.ballTeamFormation(key) === f.id ? 'on' : ''),
                            onclick: () => this.svc.setBallTeamFormation(key, f.id),
                        },
                    },
                    optTrack,
                ),
            (f) => f.id,
        );
        // Candidates = this team's members plus everyone not on another team,
        // so overlapping two shared balls is not expressible here.
        this.eachInto(
            this.ref(el, 'memberRows'),
            track,
            () => this.svc.ballTeamCandidates(key),
            (p, _i, rowTrack) => this.ballMemberRow(key, p.key, rowTrack),
            (p) => p.key,
        );
        return el;
    }

    /** A ball-team member: the tick, and the slice of their HCP the ball carries. */
    private ballMemberRow(
        teamKey: number,
        playerKey: number,
        track: (d: () => void) => void,
    ): HTMLElement {
        const inTeam = () => this.svc.ballTeamMemberIn(teamKey, playerKey);
        return this.wireEl(
            ballMemberTpl,
            {
                chk: {
                    checked: () => inTeam(),
                    onchange: (e: Event) =>
                        this.svc.setBallTeamMember(teamKey, playerKey, (e.target as HTMLInputElement).checked),
                },
                name: {
                    textContent: () =>
                        this.svc.players.get().find((p) => p.key === playerKey)?.name?.trim() || 'Player',
                },
                pctWrap: { hidden: () => !inTeam() },
                // Controlled on purpose: re-seeding rewrites this value when the
                // membership changes, and the field has to show the new share.
                // The typed text is stored verbatim, so the caret is only reset
                // when the seed actually moves.
                pct: {
                    value: () => this.svc.ballTeamPctText(teamKey, playerKey),
                    oninput: (e: Event) =>
                        this.svc.setBallTeamPct(teamKey, playerKey, (e.target as HTMLInputElement).value),
                },
            },
            track,
        );
    }

    // --- Handicap keypad -------------------------------------------------

    private hcpPlayer() {
        const key = this.hcpPadFor.get();
        return key === null ? null : this.svc.players.get().find((p) => p.key === key) ?? null;
    }

    private openHcpPad(key: number): void {
        this.hcpDraft.set(this.svc.players.get().find((p) => p.key === key)?.handicapIndex ?? '');
        this.hcpPadFor.set(key);
    }

    private hcpAppendDigit(d: string): void {
        const cur = this.hcpDraft.get();
        const [int, dec] = cur.replace('+', '').split(/[.,]/);
        // A WHS index is at most two integer digits and one decimal (54.0).
        if (dec !== undefined) {
            if (dec.length >= 1) return;
        } else if (int!.length >= 2) return;
        this.hcpDraft.set(cur + d);
    }

    private hcpAppendSep(): void {
        const cur = this.hcpDraft.get();
        if (/[.,]/.test(cur)) return;
        // A separator with nothing before it gets a zero to sit on ("0,4").
        this.hcpDraft.set(cur.replace('+', '') === '' ? `${cur}0${hcpSep()}` : cur + hcpSep());
    }

    /** Golf's plus-handicap prefix, as a toggle. A raw "-" (the stored
     * notation) flips to the "+" spelling rather than stacking. */
    private hcpTogglePlus(): void {
        const cur = this.hcpDraft.get();
        this.hcpDraft.set(cur.startsWith('+') ? cur.slice(1) : `+${cur.replace('-', '')}`);
    }

    private hcpCommit(): void {
        const key = this.hcpPadFor.get();
        if (key === null) return;
        if (this.hcpDraft.get() !== '' && parseHandicapIndex(this.hcpDraft.get()) === null) return;
        this.svc.patchPlayer(key, { handicapIndex: this.hcpDraft.get() });
        this.hcpPadFor.set(null);
    }

    private hcpKey(glyph: string, caption: string, onclick: () => void): HTMLElement {
        return this.wireEl(hcpKeyTpl, {
            key: { onclick },
            num: { textContent: glyph },
            lbl: { textContent: caption },
        });
    }

    private playerRow(key: number, track: (d: () => void) => void): HTMLElement {
        const current = () => this.svc.players.get().find((p) => p.key === key) ?? null;
        const currentIndex = () => this.svc.players.get().findIndex((p) => p.key === key);

        const el = this.wireEl(
            playerTpl,
            {
                // Uncontrolled text input: no reactive `value` binding (would
                // reset the caret on every keystroke). Initial value comes from
                // the row (empty for a fresh guest, prefilled for "Add me").
                // A registered row's name is read-only — the server resolves
                // the display name from the players table, not from this field.
                name: {
                    value: current()?.name ?? '',
                    readOnly: () => !!current()?.playerId,
                    oninput: (e: Event) => this.svc.patchPlayer(key, { name: (e.target as HTMLInputElement).value }),
                },
                // The index field is readonly (template) — tapping it opens the
                // handicap keypad instead of the system keyboard, so "+2,4" is
                // typeable on a phone. Readonly ⇒ no caret, so the reactive
                // value binding is safe here.
                index: {
                    value: () => current()?.handicapIndex ?? '',
                    onclick: () => this.openHcpPad(key),
                    onfocus: (e: Event) => {
                        (e.target as HTMLInputElement).blur();
                        this.openHcpPad(key);
                    },
                },
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
            // A registered row whose profile carries a gender is locked to it
            // (tee ratings follow the profile); a null profile gender stays
            // editable — the rating still needs one.
            disabled: { get: () => current()?.genderKnown === true },
        });
        this.mountSelect(this.ref(el, 'tee'), track, {
            value: this.bound(
                track,
                () => current()?.teeId ?? '',
                (v) => this.svc.setPlayerTee(key, v),
            ),
            options: { get: () => this.svc.tees.get().map((tee) => ({ value: tee.id, label: tee.name })) },
            placeholder: 'Tee',
        });
        return el;
    }
}
