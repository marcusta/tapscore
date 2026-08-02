import { Component, Computed, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { ConfirmComponent } from '@basics/core/client/ui/confirm';
import { t } from '../theme';
import { s, card } from '../css';
import { LandingService } from './landing.service';
import { ProfileService } from '../profile/profile.service';
import {
    formatRowDate,
    landingRows,
    rowCourseSubtitle,
    rowLabel,
    type LandingRow,
} from './rows';
import { partitionRounds, type Partitioned } from './partition';
import {
    FINISHED_PREVIEW_LIMIT,
    ONGOING_PREVIEW_LIMIT,
    handicapPill,
    showsAllRoundsLink,
    showsEmptyNotice,
    showsOngoingShowAll,
    type HomeCounts,
} from './home-view';
import { FriendsActivityService } from '../friends/friends-activity.service';
import { HomeStatsService } from './home-stats.service';
import {
    HOME_STATS_FOOTER,
    HOME_STATS_TITLE,
    homeStatsAriaLabel,
    type HomeStatsCardModel,
    type HomeStatsTile,
} from './home-stats';
import {
    chipLabel,
    outNowChips,
    outNowContext,
    recentRows,
    type OutNowChip,
    type RecentRow,
} from '../friends/friends-activity-model';
import {
    avatarBadgeBindings,
    avatarBadgeCss,
    avatarBadgeMarkup,
} from '../app/avatar-badge';
import { formatLabelFromId } from '../round/slot-labels';

// Order (home redesign, spec item 12 / W4): who you are, what was handed to
// you, what you are playing, who else is out, what you just played, what your
// friends played. Every section is invisible when empty, so the page shortens
// rather than explaining itself.
const tpl = template(`
    <div bind="root" class="landing">
        <header bind="head" class="landing__head">
            <div class="landing__flag">⛳</div>
            <h1>tapscore</h1>
            <p>Scores, settled on the green. No sign-in needed.</p>
        </header>

        <!-- Signed in the wordmark has done its job — the app has been opened
             and signed into, and the top of the screen is better spent saying
             who it thinks you are. The whole strip is the button: the target
             people aim at is the face, and a full row beats a 44px circle. -->
        <button bind="identity" class="landing__identity" type="button">
            ${avatarBadgeMarkup('landing__identity-badge')}
            <span class="landing__identity-text">
                <span bind="identityName" class="landing__identity-name"></span>
                <span bind="identityHcp" class="landing__identity-hcp"></span>
            </span>
        </button>

        <div bind="newSection" class="landing__section-block landing__new">
            <div class="landing__section">
                <span class="landing__section-title">New — you were added</span>
                <span bind="newCount" class="landing__count landing__new-count"></span>
            </div>
            <div bind="newList" class="landing__list"></div>
        </div>

        <div bind="ongoingSection" class="landing__section-block landing__ongoing">
            <div class="landing__section landing__ongoing-head">
                <span class="landing__section-title">Ongoing</span>
                <span bind="ongoingCount" class="landing__count"></span>
            </div>
            <div bind="ongoingList" class="landing__ongoing-list"></div>
            <button bind="ongoingMore" class="landing__ongoing-foot" type="button">Show all →</button>
        </div>

        <div bind="outNowSection" class="landing__section-block landing__outnow">
            <div class="landing__section">
                <span class="landing__live-dot" aria-hidden="true"></span>
                <!-- Deliberately NOT landing__section-title: this is a quiet
                     muted context line, and the section-title rule's higher
                     specificity would repaint it as a display-face heading. -->
                <span bind="outNowContext" class="landing__outnow-title"></span>
            </div>
            <div bind="outNowList" class="landing__outnow-chips"></div>
        </div>

        <!-- Recently finished is ONE card, not a card per round: home is about
             the round you are playing, and the ones you have played are a
             glance and a door. Compact rows, no trash (removing a round is a
             deliberate act and belongs on the screen that lists them all), and
             the footer that opens the rest. -->
        <div bind="finishedSection" class="landing__section-block landing__finished">
            <div class="landing__section landing__finished-head">
                <span class="landing__section-title">Recently finished</span>
                <span bind="finishedCount" class="landing__count"></span>
            </div>
            <div bind="finishedList" class="landing__finished-list"></div>
            <button bind="finishedAll" class="landing__finished-foot" type="button">All rounds →</button>
        </div>

        <button bind="history" class="landing__history" type="button">All rounds →</button>

        <!-- "From your friends", not "Recently": the screen already has a
             "Recently finished" section for YOUR rounds, and two headings one
             word apart with nothing saying whose is a coin-flip. -->
        <div bind="recentlySection" class="landing__section-block landing__recently">
            <div class="landing__section landing__recently-head">
                <span class="landing__section-title">From your friends</span>
            </div>
            <div bind="recentlyList" class="landing__recently-list"></div>
        </div>

        <!-- The statistics card, last: it is the screen's slowest read and the
             one thing here that is about the past rather than about today.
             The WHOLE card is the button (there is nothing else on it to tap),
             so every child is phrasing content — a <div> inside a <button> is
             not. Absent entirely when there is nothing to show. -->
        <button bind="stats" class="landing__stats" type="button">
            <span class="landing__section landing__stats-head">
                <span bind="statsTitle" class="landing__section-title"></span>
                <span bind="statsWindow" class="landing__count"></span>
            </span>
            <span bind="statsTiles" class="landing__stats-tiles"></span>
            <span bind="statsPriority" class="landing__stats-priority"></span>
            <span class="landing__stats-rule" aria-hidden="true"></span>
            <span bind="statsFoot" class="landing__stats-foot"></span>
        </button>

        <div bind="empty" class="landing__empty">No rounds yet — tap Play golf to tee off.</div>

        <div bind="confirmHost"></div>
    </div>
`);

// The round action menu stays outside the row's main tap target (buttons
// can't nest), keeping destructive actions available without permanent
// visual weight in every row.
const moreSvg = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>`;

const rowTpl = template(`
    <div class="round-row">
        <button bind="row" type="button" class="round-row__main">
            <div class="round-row__top">
                <span bind="title" class="round-row__title"></span>
            </div>
            <span bind="course" class="round-row__course"></span>
            <div class="round-row__bottom">
                <span bind="date"></span>
                <span bind="progress" class="round-row__progress"></span>
                <span bind="formats" class="round-row__formats"></span>
            </div>
        </button>
        <div bind="actions" class="round-row__actions">
            <button bind="menuButton" type="button" class="round-row__menu-button" aria-label="Round actions" aria-haspopup="true" aria-expanded="false">${moreSvg}</button>
            <div bind="menu" class="round-row__menu" role="group" aria-label="Round actions">
                <button bind="delete" type="button" class="round-row__menu-action">Delete</button>
            </div>
        </div>
    </div>
`);

// A finished round inside the "Recently finished" card: what it was called,
// where, when, and how it ended. No role label and no trash — the compact row
// is a glance, and both of those belong on the full list at /history.
const finishedRowTpl = template(`
    <button bind="row" type="button" class="finished-row">
        <span class="finished-row__text">
            <span bind="title" class="finished-row__title"></span>
            <span bind="course" class="finished-row__course"></span>
            <span class="finished-row__bottom">
                <span bind="date" class="finished-row__date"></span>
                <span bind="formats" class="finished-row__formats"></span>
            </span>
        </span>
    </button>
`);

// One "Out now" chip: a friend's live round. Holes played and score to par,
// nothing finer — a friend's individual bad hole is never legible from the
// landing (docs/proposals/friends-activity.md, "Surfaces"). The whole chip is
// the tap target; it opens the read-only spectate view by round id.
const chipTpl = template(`
    <button bind="chip" type="button" class="outnow-chip">
        <span class="outnow-chip__badge-wrap">
            ${avatarBadgeMarkup('outnow-chip__badge')}
            <span class="outnow-chip__dot" aria-hidden="true"></span>
        </span>
        <span class="outnow-chip__text">
            <span bind="who" class="outnow-chip__who"></span>
            <span bind="line" class="outnow-chip__line"></span>
        </span>
    </button>
`);

// One statistics tile: the reading in the display face, what it measures under
// it, and — only under the display policy's floor — the sample it rests on.
const statTileTpl = template(`
    <span class="stat-tile">
        <span bind="value" class="stat-tile__value"></span>
        <span bind="label" class="stat-tile__label"></span>
        <span bind="note" class="stat-tile__note"></span>
    </span>
`);

// A quiet "Recently" row — who, what the round was, when. Deliberately no
// score: the feed's recent half is retrospective browsing, and the round's
// own screen is one tap away.
const recentTpl = template(`
    <button bind="row" type="button" class="recent-row">
        <span class="recent-row__text">
            <span bind="who" class="recent-row__who"></span>
            <span class="recent-row__what-line">
                <span bind="what" class="recent-row__what"></span>
                <span bind="formats" class="recent-row__formats"></span>
            </span>
        </span>
        <span bind="when" class="recent-row__when"></span>
    </button>
`);

// History still presents lifecycle states as plain text. Ongoing deliberately
// does not: the section itself says all the state its rows need to repeat.
export const STATUS_TEXT: Record<string, string> = {
    not_started: 'Not started',
    active: 'Live',
    complete: 'Finished',
};

export class LandingComponent extends Component {
    static styles = `
        .landing {
            /* The account surface is in the app shell's header, above this
               screen — the landing hosts nothing account-shaped itself.
               The extra 76px under the usual 2xl is the Play pill's room:
               floating (signed out) it occupies the viewport's bottom ~60px,
               and docked it still hangs 22px into this screen — without the
               allowance the last row scrolls to a stop underneath it. */
            padding: ${s('lg')} ${s('lg')} calc(${s('2xl')} + 76px);

            & .landing__head {
                text-align: center;
                margin-bottom: ${s('xl')};

                &.hidden { display: none; }

                & .landing__flag { font-size: 2.2rem; line-height: 1; }
                & h1 {
                    margin: ${s('xs')} 0 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 2.2rem;
                    letter-spacing: -0.02em;
                    color: ${t('text')};
                }
                & p {
                    margin: ${s('xs')} 0 0;
                    color: ${t('text-muted')};
                    font-size: 0.9rem;
                }
            }

            /* The signed-in header. A row-shaped button, so the whole strip —
               face, name and pill — is one target for the profile. */
            & .landing__identity {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                width: 100%;
                margin-bottom: ${s('xl')};
                padding: 0;
                background: none;
                border: none;
                font-family: inherit;
                text-align: left;
                cursor: pointer;

                &.hidden { display: none; }
                &:focus-visible { outline: 2px solid ${t('accent')}; outline-offset: 4px; }

                & .landing__identity-badge {
                    ${avatarBadgeCss(48, '1.1rem')}
                    background: ${t('accent-soft')};
                    color: ${t('accent')};
                }
                & .landing__identity-text {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: ${s('xs')};
                    min-width: 0;
                }
                & .landing__identity-name {
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.4rem;
                    color: ${t('text')};
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 100%;
                }
                /* No index ⇒ no pill, never "HCP –" (see handicapPill). */
                & .landing__identity-hcp {
                    background: ${t('accent-soft')};
                    color: ${t('accent')};
                    font-size: 0.8rem;
                    font-weight: 700;
                    border-radius: ${t('radius-pill')};
                    padding: 2px 9px;

                    &.hidden { display: none; }
                }
            }

            & .landing__section-block {
                margin-bottom: ${s('xl')};
                &.hidden { display: none; }
            }

            /* "Out now" — friends on the course right now. Renders only when
               non-empty ("empty means invisible"): it must never occupy the
               opening screen to say nothing is happening. A horizontal chip
               row rather than a list, so however sociable the viewer's
               friends are they cannot push the viewer's own rounds off
               screen. */
            & .landing__live-dot {
                width: 8px; height: 8px; border-radius: 50%;
                background: ${t('accent')};
                flex-shrink: 0; align-self: center;
            }
            & .landing__outnow-title { font-size: 0.9rem; color: ${t('text-muted')}; }
            & .landing__outnow-chips {
                display: flex; gap: ${s('sm')};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                /* Chips scroll to the screen edge instead of stopping short
                   of it and looking clipped. */
                margin: 0 -${s('lg')};
                padding: 2px ${s('lg')};
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }
            }
            & .outnow-chip {
                ${card({ hover: true })}
                display: flex; align-items: center; gap: ${s('sm')};
                flex-shrink: 0; max-width: 85%;
                padding: ${s('sm')} ${s('md')};
                font-family: inherit; text-align: left; cursor: pointer;

                & .outnow-chip__badge-wrap { position: relative; flex-shrink: 0; }
                & .outnow-chip__badge {
                    ${avatarBadgeCss(36, '0.8rem')}
                    background: ${t('primary')}; color: ${t('primary-text')};
                }
                /* The live marker rides the avatar: the chip is already
                   "who + how far", and a third text fragment is a wall of
                   words at four chips wide. No animation — motion in the
                   corner of the eye on every app open is worse than none. */
                & .outnow-chip__dot {
                    position: absolute; right: -1px; bottom: -1px;
                    width: 10px; height: 10px; border-radius: 50%;
                    background: ${t('accent')};
                    border: 2px solid ${t('surface')};
                }
                & .outnow-chip__text {
                    display: flex; flex-direction: column; gap: 1px; min-width: 0;
                }
                & .outnow-chip__who {
                    font-weight: 600; font-size: 0.95rem; color: ${t('text')};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .outnow-chip__line {
                    font-weight: 600; font-size: 0.8rem; color: ${t('accent')};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
            }

            /* "From your friends" is one grouped activity panel. The heading
               and rows share the same outer card treatment as the two own-round
               panels above it. */
            & .landing__recently {
                ${card()}
                overflow: hidden;

                & .landing__recently-head {
                    margin-bottom: 0;
                    padding: ${s('md')} ${s('lg')} ${s('sm')};
                }
                & .landing__recently-list {
                    display: flex;
                    flex-direction: column;
                }
            }

            & .recent-row {
                display: flex; align-items: center; gap: ${s('md')};
                width: 100%;
                padding: ${s('sm')} ${s('lg')};
                background: none;
                border: none;
                border-top: 1px solid ${t('border')};
                font-family: inherit; text-align: left; cursor: pointer;

                &:hover { background: ${t('hover-bg')}; }

                & .recent-row__text {
                    flex: 1; min-width: 0;
                    display: flex; flex-direction: column; gap: 1px;
                }
                & .recent-row__who { font-weight: 600; font-size: 0.9rem; color: ${t('text')}; }
                & .recent-row__what {
                    color: ${t('text-muted')}; font-size: 0.8rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .recent-row__what-line {
                    display: flex; min-width: 0; gap: 0.25rem;
                    overflow: hidden; white-space: nowrap;
                }
                & .recent-row__formats {
                    color: ${t('text-muted')}; font-size: 0.8rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .recent-row__when {
                    flex-shrink: 0; color: ${t('text-muted')}; font-size: 0.8rem;
                }
            }

            /* The "New — you were added" strip reads as a highlight: its count
               is an accent pill so a fresh add draws the eye at the top. */
            & .landing__new-count {
                background: ${t('accent-soft')};
                color: ${t('accent')};
                font-weight: 700;
                border-radius: ${t('radius-pill')};
                padding: 1px 9px;
                font-size: 0.8rem;
            }

            & .landing__section {
                display: flex;
                align-items: baseline;
                gap: ${s('sm')};
                margin-bottom: ${s('sm')};

                & .landing__section-title {
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: ${t('text')};
                }
                & .landing__count {
                    color: ${t('text-muted')};
                    font-size: 0.85rem;
                }
            }

            & .landing__empty {
                color: ${t('text-muted')};
                font-size: 0.9rem;
                padding: ${s('lg')} 0;

                &.hidden { display: none; }
            }

            & .landing__list {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }

            & .round-row {
                display: flex;
                align-items: stretch;
                ${card({ hover: true })}

                & .round-row__main {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};
                    padding: ${s('md')} 0 ${s('md')} ${s('lg')};
                    text-align: left;
                    font-family: inherit;
                    background: none;
                    border: none;
                    cursor: pointer;
                    &:disabled { cursor: default; }
                }

                & .round-row__actions {
                    position: relative;
                    flex: 0 0 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    &.hidden { display: none; }
                }

                & .round-row__top {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    gap: ${s('md')};
                }
                /* Three sizes, one hierarchy: what the round is CALLED, then
                   where it was played, then when. An unnamed round is headed
                   by its course and the sub-title hides. */
                & .round-row__title {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${t('text')};
                }
                & .round-row__course {
                    color: ${t('text-muted')};
                    font-size: 0.9rem;

                    &.hidden { display: none; }
                }
                & .round-row__bottom {
                    display: flex;
                    align-items: baseline;
                    gap: ${s('sm')};
                    color: ${t('text-muted')};
                    font-size: 0.85rem;

                    &.hidden { display: none; }
                }
                & .round-row__formats {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                & .round-row__progress::before,
                & .round-row__formats::before { content: '·'; margin-right: ${s('sm')}; }
                & .round-row__progress.hidden,
                & .round-row__formats.hidden { display: none; }
            }

            /* Ongoing and Recently finished are both grouped panels. Ongoing
               expresses its only useful changing fact inline: scored progress. */
            & .landing__ongoing {
                ${card()}
                overflow: hidden;

                & .landing__ongoing-head {
                    margin-bottom: 0;
                    padding: ${s('md')} ${s('lg')} ${s('sm')};
                }
                & .landing__ongoing-list {
                    display: flex;
                    flex-direction: column;
                }
                & .round-row {
                    border: 0;
                    border-top: 1px solid ${t('border')};
                    border-radius: 0;
                    box-shadow: none;
                }
                & .landing__ongoing-foot {
                    display: block;
                    width: 100%;
                    padding: ${s('md')} ${s('lg')};
                    background: none;
                    border: none;
                    border-top: 1px solid ${t('border')};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-align: left;
                    color: ${t('accent')};
                    cursor: pointer;

                    &:hover { background: ${t('hover-bg')}; }
                    &.hidden { display: none; }
                }
            }

            /* Round actions are a compact overflow menu rather than a
               permanently visible trash button. The menu opens beside the
               row so it remains inside the grouped panel's clipping boundary. */
            & .round-row__menu-button {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                padding: 0;
                background: none;
                border: none;
                border-radius: ${t('radius-sm')};
                color: ${t('text-muted')};
                cursor: pointer;

                & svg { width: 18px; height: 18px; }
                &:hover { background: ${t('hover-bg')}; color: ${t('text')}; }
                &:focus-visible { outline: 2px solid ${t('accent')}; outline-offset: -2px; }
            }
            & .round-row__menu {
                position: absolute;
                top: 50%;
                right: 0;
                z-index: 3;
                min-width: 132px;
                padding: ${s('xs')};
                transform: translateY(-50%);
                background: ${t('surface')};
                border: 1px solid ${t('border')};
                border-radius: ${t('radius')};
                box-shadow: ${t('shadow-elevated')};

                &.hidden { display: none; }
            }
            & .round-row__menu-action {
                display: block;
                width: 100%;
                padding: ${s('sm')} ${s('md')};
                background: none;
                border: none;
                border-radius: ${t('radius-sm')};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 600;
                text-align: left;
                color: ${t('error')};
                cursor: pointer;

                &:hover { background: ${t('hover-bg')}; }
                &:focus-visible { outline: 2px solid ${t('error')}; outline-offset: -2px; }
            }

            /* Recently finished: one card, its rows separated by the card's own
               border continued inwards so they read as one object. */
            & .landing__finished {
                ${card()}
                overflow: hidden;

                & .landing__finished-head {
                    margin-bottom: 0;
                    padding: ${s('md')} ${s('lg')} ${s('sm')};
                }
                & .landing__finished-list {
                    display: flex;
                    flex-direction: column;
                }
                & .landing__finished-foot {
                    display: block;
                    width: 100%;
                    padding: ${s('md')} ${s('lg')};
                    background: none;
                    border: none;
                    border-top: 1px solid ${t('border')};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-align: left;
                    color: ${t('accent')};
                    cursor: pointer;

                    &:hover { background: ${t('hover-bg')}; }
                }
            }

            & .finished-row {
                display: flex;
                align-items: flex-start;
                gap: ${s('md')};
                width: 100%;
                padding: ${s('md')} ${s('lg')};
                background: none;
                border: none;
                border-top: 1px solid ${t('border')};
                font-family: inherit;
                text-align: left;
                cursor: pointer;

                &:disabled { cursor: default; }
                &:hover:not(:disabled) { background: ${t('hover-bg')}; }

                & .finished-row__text {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                & .finished-row__title {
                    font-weight: 700;
                    font-size: 0.95rem;
                    color: ${t('text')};
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                & .finished-row__course {
                    color: ${t('text-muted')};
                    font-size: 0.8rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;

                    &.hidden { display: none; }
                }
                & .finished-row__date {
                    color: ${t('text-muted')};
                    font-size: 0.75rem;
                }
                & .finished-row__bottom {
                    display: flex;
                    justify-content: space-between;
                    gap: ${s('md')};
                    min-width: 0;
                }
                & .finished-row__formats {
                    color: ${t('text-muted')};
                    font-size: 0.75rem;
                    text-align: right;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            /* The statistics card. One card, one button: the tiles, the
               priority line and the footer are all the same target, so the
               whole thing reads as one object and taps as one. The footer is
               the affordance — a card that only reveals its destination on a
               tap is invisibly clickable. */
            & .landing__stats {
                ${card({ hover: true })}
                display: block;
                width: 100%;
                margin-bottom: ${s('xl')};
                padding: ${s('md')} 0 0;
                font-family: inherit;
                text-align: left;
                cursor: pointer;

                &.hidden { display: none; }

                & .landing__stats-head {
                    display: flex;
                    align-items: baseline;
                    gap: ${s('sm')};
                    margin-bottom: ${s('md')};
                    padding: 0 ${s('lg')};
                }

                & .landing__stats-tiles {
                    display: flex;
                    align-items: flex-start;
                    gap: ${s('md')};
                    padding: 0 ${s('lg')};
                }

                /* The instruction, in the muted tier: it ranks what to work on,
                   it does not shout it. */
                & .landing__stats-priority {
                    display: block;
                    margin-top: ${s('md')};
                    padding: 0 ${s('lg')};
                    color: ${t('text-muted')};
                    font-size: 0.85rem;

                    &.hidden { display: none; }
                }

                & .landing__stats-rule {
                    display: block;
                    margin-top: ${s('md')};
                    border-top: 1px solid ${t('border')};
                }

                /* Accent, not accent-strong: the landing's doors are the
                   decorative brass, and this is one of them. */
                & .landing__stats-foot {
                    display: block;
                    padding: ${s('md')} ${s('lg')};
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: ${t('accent')};
                }
            }

            & .stat-tile {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;

                & .stat-tile__value {
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.4rem;
                    color: ${t('text')};
                    white-space: nowrap;
                }
                & .stat-tile__label {
                    color: ${t('text-muted')};
                    font-size: 0.75rem;
                }
                /* Only under the display policy's floor — see homeStatsTiles. */
                & .stat-tile__note {
                    color: ${t('text-muted')};
                    font-size: 0.65rem;

                    &.hidden { display: none; }
                }
            }

            /* The same door standing on its own, when there is no card to put
               it in — see showsAllRoundsLink. */
            & .landing__history {
                display: block;
                margin: ${s('sm')} auto 0;
                padding: ${s('sm')} ${s('lg')};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${t('accent')};
                cursor: pointer;

                &.hidden { display: none; }
            }

        }

        /* App-level accessibility override for the framework confirm dialog. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;

    private svc = this.inject(LandingService);
    private profile = this.inject(ProfileService);
    private activity = this.inject(FriendsActivityService);
    private homeStats = this.inject(HomeStatsService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    private loggedIn = new Computed(() => this.auth.currentUser.get() !== null);

    // The unified row list (both states normalise to `LandingRow`), then the
    // pure partition. `now` is read once per (re)compute from the wall clock —
    // the ONLY Date use here, kept out of the pure `partition`/`rows` modules.
    private rows = new Computed<LandingRow[]>(() =>
        this.loggedIn.get()
            ? landingRows.fromMyRounds(this.svc.myRounds.get())
            : landingRows.fromDeviceRounds(this.svc.deviceRounds.get()),
    );
    private parts = new Computed<Partitioned<LandingRow>>(() =>
        partitionRounds(this.rows.get(), Date.now(), (r) => r),
    );
    private ongoing = new Computed(() => this.parts.get().ongoing);
    private finished = new Computed(() => this.parts.get().finished);

    // What actually renders: both sections are capped, and their headers keep
    // counting the full number, so "3 of 7" is legible without a sentence
    // saying so. The rest is one tap away at /history.
    private ongoingShown = new Computed(() => this.ongoing.get().slice(0, ONGOING_PREVIEW_LIMIT));
    private finishedShown = new Computed(() =>
        this.finished.get().slice(0, FINISHED_PREVIEW_LIMIT),
    );

    /** The three counts every home gate reads (see `home-view.ts`). */
    private counts = new Computed<HomeCounts>(() => ({
        rows: this.rows.get().length,
        ongoing: this.ongoing.get().length,
        finished: this.finished.get().length,
    }));

    // The "New — you were added" strip: friend-added, unseen produced rounds
    // (logged-in only — `svc.newRounds` is empty when logged out). Reuses the
    // shared `LandingRow` shape + row renderer.
    private newRows = new Computed<LandingRow[]>(() =>
        this.loggedIn.get() ? landingRows.fromMyRounds(this.svc.newRounds.get()) : [],
    );

    // The friends-activity halves — chips and recent rows. Both are [] when
    // signed out or when the feed failed/never landed (feed null), so the
    // sections are absent entirely rather than an empty shell.
    private chips = new Computed<OutNowChip[]>(() =>
        this.loggedIn.get() ? outNowChips(this.activity.feed.get()?.live ?? []) : [],
    );
    private recents = new Computed<RecentRow[]>(() =>
        this.loggedIn.get() ? recentRows(this.activity.feed.get()?.recent ?? []) : [],
    );

    // The statistics card, or null for every reason it has (signed out, the
    // fetch failed, an empty window, no tile with a denominator). Signed out
    // the service holds nothing, but the gate is stated here too so the card
    // cannot outlive a sign-out that happened without a remount.
    private statsCard = new Computed<HomeStatsCardModel | null>(() =>
        this.loggedIn.get() ? this.homeStats.card.get() : null,
    );
    private statsTiles = new Computed<HomeStatsTile[]>(() => this.statsCard.get()?.tiles ?? []);

    // Delete confirmation: one shared dialog; the tapped row parks its target
    // here and opens it.
    private deleteOpen = new Signal(false);
    private deleteTarget = new Signal<{ token: string; roundId: string; name: string } | null>(
        null,
    );
    private openRoundMenu = new Signal<string | null>(null);

    private askDelete(token: string, roundId: string, name: string): void {
        this.openRoundMenu.set(null);
        this.deleteTarget.set({ token, roundId, name });
        this.deleteOpen.set(true);
    }

    render(): DocumentFragment {
        // Logged in: fetch the dashboard halves. Logged out: read the device
        // recent list from localStorage. Either way the partition is reactive.
        if (this.loggedIn.get()) {
            void this.svc.loadMine();
            // The identity strip reads `ProfileService.player` — the ONE
            // signed-in-player copy the whole shell shares. The account menu
            // already loads it on every non-immersive route and every profile
            // mutation refreshes it, so binding here means a handicap save or
            // a new photo shows on the strip the moment the viewer comes back.
            // The load is deduped inside the service; this call only covers a
            // landing mounted before the menu got there.
            void this.profile.load();
            // Best-effort: a failed feed read leaves both sections absent.
            void this.activity.load();
            // The window is persisted by /stats and re-read HERE, on the way
            // back: the router's $swap remounts the landing on every return, so
            // a window switched on the dashboard is the window the card names.
            // (Read in render, never in a field initializer — see the $swap
            // footgun note in the framework docs.)
            this.homeStats.refreshPreset();
            // Forced: `loadMine()` above refetches on every landing mount, and
            // a statistics card folding yesterday's page under a freshly
            // refetched "Recently finished" list is the screen disagreeing
            // with itself. Same cost profile — one request per landing visit.
            void this.homeStats.load(true);
        } else {
            this.svc.loadDevice();
        }

        const frag = this.wire(tpl, {
            head: {
                className: () => (this.loggedIn.get() ? 'landing__head hidden' : 'landing__head'),
            },
            identity: {
                className: () =>
                    this.loggedIn.get() ? 'landing__identity' : 'landing__identity hidden',
                // The pill's words, not a second reading of the number: what a
                // screen reader says is exactly what is on screen.
                'aria-label': () => {
                    const name = this.identityName();
                    const pill = handicapPill(this.profile.player.get()?.handicapIndex);
                    return pill ? `${name}, ${pill}` : name;
                },
                onclick: () => this.router.navigate('/profile'),
            },
            ...avatarBadgeBindings(() => {
                const me = this.profile.player.get();
                return {
                    id: me?.id ?? '',
                    avatarVersion: me?.avatarVersion ?? null,
                    displayName: me?.displayName ?? null,
                    username: me?.username ?? this.auth.currentUser.get()?.username ?? null,
                };
            }),
            identityName: () => this.identityName(),
            identityHcp: {
                textContent: () => handicapPill(this.profile.player.get()?.handicapIndex) ?? '',
                className: () =>
                    handicapPill(this.profile.player.get()?.handicapIndex) === null
                        ? 'landing__identity-hcp hidden'
                        : 'landing__identity-hcp',
            },
            history: {
                className: () =>
                    showsAllRoundsLink(this.counts.get())
                        ? 'landing__history'
                        : 'landing__history hidden',
                onclick: () => this.router.navigate('/history'),
            },
            outNowSection: {
                className: () =>
                    this.chips.get().length > 0
                        ? 'landing__section-block landing__outnow'
                        : 'landing__section-block landing__outnow hidden',
            },
            outNowContext: () => outNowContext(this.activity.feed.get()?.live ?? []) ?? '',
            recentlySection: {
                className: () =>
                    this.recents.get().length > 0
                        ? 'landing__section-block landing__recently'
                        : 'landing__section-block landing__recently hidden',
            },
            newSection: {
                className: () =>
                    this.newRows.get().length > 0
                        ? 'landing__section-block landing__new'
                        : 'landing__section-block landing__new hidden',
            },
            newCount: () => {
                const n = this.newRows.get().length;
                return n === 0 ? '' : String(n);
            },
            ongoingSection: {
                className: () =>
                    this.ongoing.get().length > 0
                        ? 'landing__section-block landing__ongoing'
                        : 'landing__section-block landing__ongoing hidden',
            },
            ongoingCount: () => {
                const n = this.ongoing.get().length;
                return n === 0 ? '' : String(n);
            },
            ongoingMore: {
                className: () =>
                    showsOngoingShowAll(this.counts.get().ongoing)
                        ? 'landing__ongoing-foot'
                        : 'landing__ongoing-foot hidden',
                'aria-label': () => 'Show all ongoing rounds',
                onclick: () => this.router.navigate('/history'),
            },
            finishedSection: {
                className: () =>
                    this.finished.get().length > 0
                        ? 'landing__section-block landing__finished'
                        : 'landing__section-block landing__finished hidden',
            },
            finishedCount: () => {
                const n = this.finished.get().length;
                return n === 0 ? '' : String(n);
            },
            finishedAll: {
                // The arrow is decoration; the words carry the destination.
                'aria-label': () => 'All rounds',
                onclick: () => this.router.navigate('/history'),
            },
            stats: {
                className: () =>
                    this.statsCard.get() === null ? 'landing__stats hidden' : 'landing__stats',
                // The card in one sentence, in the order it is drawn — a button
                // announced by concatenating five nested spans reads the arrow
                // and the tile order back as noise.
                'aria-label': () => {
                    const card = this.statsCard.get();
                    return card === null ? '' : homeStatsAriaLabel(card);
                },
                onclick: () => this.router.navigate('/stats'),
            },
            statsWindow: () => this.statsCard.get()?.windowLabel ?? '',
            statsPriority: {
                textContent: () => this.statsCard.get()?.priorityLine ?? '',
                className: () =>
                    this.statsCard.get()?.priorityLine
                        ? 'landing__stats-priority'
                        : 'landing__stats-priority hidden',
            },
            // Both halves of the card's voice come from the same constants as
            // the aria sentence, so the printed and the spoken card can't drift.
            statsTitle: () => HOME_STATS_TITLE,
            statsFoot: () => HOME_STATS_FOOTER,
            empty: {
                className: () =>
                    showsEmptyNotice(this.counts.get())
                        ? 'landing__empty'
                        : 'landing__empty hidden',
            },
        });

        // Chip/row taps go by round id to the read-only spectate view — the
        // feed payload carries no share token, by design.
        this.$each(
            this.ref(frag, 'outNowList'),
            this.chips,
            (chip, _i, track) =>
                this.wireEl(
                    chipTpl,
                    {
                        chip: {
                            // One utterance, and the only place the course is
                            // named — the visible chip is person + progress.
                            'aria-label': () => chipLabel(chip),
                            onclick: () =>
                                this.router.navigate('/spectate', {
                                    query: { id: chip.roundId, name: chip.displayName },
                                }),
                        },
                        // The LIVE chip, not the closed-over one — see the
                        // getter note in `avatarBadgeBindings`.
                        ...avatarBadgeBindings(() => {
                            const live =
                                this.chips.get().find((c) => c.roundId === chip.roundId) ?? chip;
                            return {
                                id: live.playerId,
                                avatarVersion: live.avatarVersion,
                                displayName: live.displayName,
                            };
                        }),
                        who: () => chip.title,
                        // Progress only — the round's name is the organizer's
                        // private label and the course lives in the a11y
                        // label, matching the iOS chip.
                        line: () => chip.progress,
                    },
                    track,
                ),
            (chip) => chip.roundId,
        );
        this.$each(
            this.ref(frag, 'recentlyList'),
            this.recents,
            (row, _i, track) =>
                this.wireEl(
                    recentTpl,
                    {
                        row: {
                            // The LEAD name, not the "Anna + 1" label — the
                            // spectate header hangs a possessive on this.
                            onclick: () =>
                                this.router.navigate('/spectate', {
                                    query: { id: row.roundId, name: row.displayName },
                                }),
                        },
                        who: () => row.friendLabel,
                        what: () => row.title,
                        formats: () => {
                            const labels = (row.formatIds ?? []).map(formatLabelFromId);
                            return labels.length > 0 ? ` · ${labels.join(' · ')}` : '';
                        },
                        when: () => formatRowDate(row.date),
                    },
                    track,
                ),
            (row) => row.roundId,
        );

        this.$each(
            this.ref(frag, 'newList'),
            this.newRows,
            (row, _i, track) => this.roundRow(row, track),
            (row) => row.key,
        );
        this.$each(
            this.ref(frag, 'ongoingList'),
            this.ongoingShown,
            (row, _i, track) => this.roundRow(row, track, true),
            (row) => row.key,
        );
        this.$each(
            this.ref(frag, 'finishedList'),
            this.finishedShown,
            (row, _i, track) => this.finishedRow(row, track),
            (row) => row.key,
        );

        // Tiles are already formatted by the pure fold — the view does no
        // arithmetic and no rounding.
        this.$each(
            this.ref(frag, 'statsTiles'),
            this.statsTiles,
            (tile, _i, track) =>
                this.wireEl(
                    statTileTpl,
                    {
                        value: () => tile.value,
                        label: () => tile.label,
                        note: {
                            textContent: () => tile.note ?? '',
                            className: () =>
                                tile.note === null ? 'stat-tile__note hidden' : 'stat-tile__note',
                        },
                    },
                    track,
                ),
            // Keyed by CONTENT, not id alone: `$each` reuses a node when the
            // key matches without re-invoking the renderer, and the bindings
            // close over a plain (non-signal) tile object — an id-keyed list
            // would keep last fold's numbers on screen after a refresh.
            (tile) => `${tile.id}:${tile.value}:${tile.note ?? ''}`,
        );

        this.spawn(ConfirmComponent, this.ref(frag, 'confirmHost'), {
            open: this.deleteOpen,
            title: 'Delete round?',
            message: () => {
                const target = this.deleteTarget.get();
                const name = target ? `“${target.name}”` : 'this round';
                return `Delete ${name}? This permanently removes it and all its scores for everyone. This can't be undone.`;
            },
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            danger: true,
            onconfirm: () => {
                const target = this.deleteTarget.get();
                if (target) void this.svc.remove(target.token, target.roundId);
            },
        });

        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.deleteOpen.get()) this.deleteOpen.set(false);
            if (e.key === 'Escape' && this.openRoundMenu.get() !== null) {
                this.openRoundMenu.set(null);
            }
        };
        window.addEventListener('keydown', onKeydown);
        this.track(() => window.removeEventListener('keydown', onKeydown));

        const root = this.ref(frag, 'root');
        const onPointerDown = (e: Event) => {
            if (this.openRoundMenu.get() === null) return;
            const target = e.target;
            if (target instanceof Node && root.contains(target)) return;
            this.openRoundMenu.set(null);
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        this.track(() => document.removeEventListener('pointerdown', onPointerDown, true));

        return frag;
    }

    /** The name the identity strip shows. `ProfileService.player` is the
     *  source; until it lands (or if it never does) the username the session
     *  already holds stands in, so the strip never renders as an empty row. */
    private identityName(): string {
        const me = this.profile.player.get();
        const name = (me?.displayName ?? '').trim();
        if (name !== '') return name;
        const username = (me?.username ?? this.auth.currentUser.get()?.username ?? '').trim();
        return username === '' ? 'Signed in' : username;
    }

    /** One compact finished row inside the card: no role label, no trash. */
    private finishedRow(row: LandingRow, track: (d: () => void) => void): HTMLElement {
        return this.wireEl(
            finishedRowTpl,
            {
                row: {
                    // A produced round with no friendly wrapper has no token,
                    // so it renders but cannot be opened — same rule as the
                    // full row.
                    disabled: () => row.token === null,
                    onclick: () => {
                        if (row.token === null) return;
                        this.router.navigate('/round', { query: { token: row.token } });
                    },
                },
                title: () => rowLabel(row),
                course: {
                    textContent: () => rowCourseSubtitle(row) ?? '',
                    className: () =>
                        rowCourseSubtitle(row)
                            ? 'finished-row__course'
                            : 'finished-row__course hidden',
                },
                date: () => formatRowDate(row.date),
                formats: () => row.formats ?? '',
            },
            track,
        );
    }

    /** One round row (shared by both sections + both auth states). A row with
     *  no token can't navigate or be deleted (logged-in produced round without
     *  a friendly wrapper); everything else taps through. */
    private roundRow(
        row: LandingRow,
        track: (d: () => void) => void,
        showProgress: boolean = false,
    ): HTMLElement {
        return this.wireEl(
            rowTpl,
            {
                row: {
                    disabled: () => row.token === null,
                    onclick: () => {
                        if (row.token === null) return;
                        this.router.navigate('/round', { query: { token: row.token } });
                    },
                },
                title: () => rowLabel(row),
                course: {
                    textContent: () => rowCourseSubtitle(row) ?? '',
                    className: () =>
                        rowCourseSubtitle(row) ? 'round-row__course' : 'round-row__course hidden',
                },
                date: () => formatRowDate(row.date),
                progress: {
                    textContent: () =>
                        showProgress && row.holesPlayed && row.holesPlayed > 0
                            ? `Thru ${row.holesPlayed}`
                            : '',
                    className: () =>
                        showProgress && row.holesPlayed && row.holesPlayed > 0
                            ? 'round-row__progress'
                            : 'round-row__progress hidden',
                },
                formats: {
                    textContent: () => row.formats ?? '',
                    className: () =>
                        row.formats ? 'round-row__formats' : 'round-row__formats hidden',
                },
                actions: {
                    className: () =>
                        row.token === null ? 'round-row__actions hidden' : 'round-row__actions',
                },
                menuButton: {
                    'aria-expanded': () =>
                        this.openRoundMenu.get() === row.key ? 'true' : 'false',
                    onclick: () =>
                        this.openRoundMenu.set(
                            this.openRoundMenu.get() === row.key ? null : row.key,
                        ),
                },
                menu: {
                    className: () =>
                        this.openRoundMenu.get() === row.key
                            ? 'round-row__menu'
                            : 'round-row__menu hidden',
                },
                delete: {
                    onclick: () => {
                        if (row.token === null) return;
                        this.askDelete(row.token, row.roundId ?? '', rowLabel(row));
                    },
                },
            },
            track,
        );
    }
}
