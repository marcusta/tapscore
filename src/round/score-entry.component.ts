import { Component, Computed, Signal, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import { RoundViewService, ballDisplayName } from './round.service';
import { clampIndex, stepsFromDrag } from './hole-carousel';
import {
    advance as decideAdvance,
    hasMoreUnscored as policyHasMoreUnscored,
    isHoleCompleteOnEntry,
    type AdvanceDecision,
    type AdvanceState,
    type EntryEvent,
} from './advance-policy';
import type { HandicapDerivation, RoundBall } from '../api/friendly-rounds.gen';
import type { MetadataInput } from '../api/setup.gen';
import { formatLabelFromSlot } from './slot-labels';
import { stepperText, type StatEventKey, type StatPrompt } from './stat-prompts';

// One score column / carousel cell is SLOT wide. The carousel is a clipped
// window that shows exactly two cells — the previous and current hole —
// right-aligned directly above the previous-score and current-score columns
// (golf-serie's HoleHeaderCarousel layout). WINDOW_RADIUS cells are rendered
// off-screen each side so a drag can slide neighbours in before the snap.
const SLOT = 60;
const RIGHT_PAD = 8;
const WINDOW_RADIUS = 4;
const OFFSETS = Array.from({ length: WINDOW_RADIUS * 2 + 1 }, (_, i) => i - WINDOW_RADIUS);
const SNAP = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)';

const tpl = template(`
    <div bind="root" class="se hidden">
        <div bind="viewport" class="se__carousel">
            <div class="se__clip">
                <div bind="track" class="se__track"></div>
            </div>
        </div>

        <div bind="rows" class="se__rows"></div>

        <div bind="modal" class="se-modal hidden">
            <div class="se-modal__head">
                <button bind="close" class="se-modal__close" type="button">✕</button>
                <span bind="modalTitle" class="se-modal__title"></span>
                <span class="se-modal__nav">
                    <button bind="modalPrev" class="se-modal__navbtn" type="button" aria-label="Previous hole">‹</button>
                    <button bind="modalNext" class="se-modal__navbtn" type="button" aria-label="Next hole">›</button>
                </span>
            </div>
            <div bind="modalList" class="se-modal__list"></div>
            <div class="se-pad">
                <div bind="extended" class="se-pad__ext hidden">
                    <div class="se-pad__ext-row">
                        <button bind="extMinus" class="se-pad__ext-step" type="button">−</button>
                        <span bind="extVal" class="se-pad__ext-val"></span>
                        <button bind="extPlus" class="se-pad__ext-step" type="button">+</button>
                    </div>
                    <div class="se-pad__ext-actions">
                        <button bind="extCancel" class="se-pad__ext-cancel" type="button">Cancel</button>
                        <button bind="extOk" class="se-pad__ext-ok" type="button">✓</button>
                    </div>
                </div>
                <div bind="keys" class="se-pad__grid"></div>
            </div>

            <div bind="stats" class="se-stats hidden">
                <div class="se-stats__head">
                    <button bind="statsBack" class="se-stats__back" type="button">‹</button>
                    <span bind="statsHole" class="se-stats__hole"></span>
                    <span class="se-stats__spacer"></span>
                </div>
                <div class="se-stats__who">
                    <span bind="statsTitle" class="se-stats__name"></span>
                    <span bind="statsScore" class="se-stats__score"></span>
                </div>
                <div bind="statsBody" class="se-stats__body"></div>
                <div class="se-stats__foot">
                    <button bind="statsNext" class="se-stats__next" type="button"></button>
                </div>
            </div>
        </div>

        <div bind="hcpModal" class="se-hcp hidden">
            <div class="se-hcp__panel">
                <div class="se-hcp__head">
                    <span bind="hcpTitle" class="se-hcp__title"></span>
                    <button bind="hcpClose" class="se-hcp__close" type="button" aria-label="Close">✕</button>
                </div>
                <span bind="hcpFormat" class="se-hcp__format"></span>
                <div bind="hcpSteps" class="se-hcp__steps"></div>
                <div class="se-hcp__foot">
                    <span class="se-hcp__foot-label">Plays off</span>
                    <span bind="hcpEff" class="se-hcp__eff"></span>
                </div>
            </div>
        </div>

        <div bind="toast" class="se-toast hidden"></div>
    </div>
`);

const holeTpl = template(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`);

const rowTpl = template(`
    <div class="se-row">
        <div class="se-row__who">
            <span bind="name" class="se-row__name"></span>
            <span class="se-row__hcpline">
                <span bind="hcp" class="se-row__hcp"></span>
                <button bind="hcpInfo" class="se-row__hcpinfo hidden" type="button" aria-label="How this handicap was calculated">i</button>
            </span>
        </div>
        <span bind="topar" class="se-row__topar"></span>
        <div class="se-row__scores">
            <span class="se-row__slot"><span bind="prev" class="se-row__prev"></span></span>
            <span class="se-row__slot"><button bind="circle" class="se-row__circle" type="button"><span bind="cval"></span></button></span>
        </div>
    </div>
`);

const mrowTpl = template(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`);

// One derivation step in the handicap ⓘ dialog: what happened in words, the
// arithmetic as small print, the step's output as the trailing number.
const hcpStepTpl = template(`
    <div class="se-hcp__card">
        <div class="se-hcp__card-body">
            <span bind="ctitle" class="se-hcp__card-title"></span>
            <span bind="ctext" class="se-hcp__card-text"></span>
            <span bind="cmath" class="se-hcp__card-math"></span>
        </div>
        <span bind="cresult" class="se-hcp__card-result"></span>
    </div>
`);

const keyTpl = template(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`);

const chipTpl = template(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`);

// One player-stats prompt: the same centred label as a format toggle, over a
// segmented row whose options come from `StatStep`. Built once per prompt (a
// key's option list is fixed), so only selection is reactive.
const statSegTpl = template(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div bind="seg" class="se-stats__seg"></div>
    </div>
`);

const segBtnTpl = template(`<button bind="btn" class="se-seg" type="button"></button>`);

// A one-tap counter. It shows its floor before anyone touches it, dimmed, so an
// untouched row cannot be mistaken for an answered zero.
const statStepTpl = template(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__step">
            <button bind="minus" class="se-stats__step-btn" type="button">−</button>
            <span bind="val" class="se-stats__step-val"></span>
            <button bind="plus" class="se-stats__step-btn" type="button">+</button>
        </div>
    </div>
`);

// Hairline between the format's own toggles and the player's stats — drawn only
// when both halves are non-empty.
const statRuleTpl = template(`<div bind="rule" class="se-stats__rule"></div>`);

/**
 * One row of the stats body. A tagged union rather than two `$each` lists so the
 * format half, the divider and the stats half keep ONE document order, and so a
 * key asked by both channels cannot render twice.
 */
type StatBodyRow =
    | { kind: 'meta'; key: string; input: MetadataInput }
    | { kind: 'rule'; key: string }
    | { kind: 'stat'; key: string; prompt: StatPrompt };

interface PointerState {
    id: number;
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    horiz: boolean;
}

/**
 * The trust-based on-course score-entry experience for `/round?token=`, ported
 * from golf-serie's custom mobile ScoreEntry: a clipped swipeable hole-header
 * carousel (previous + current hole, aligned over the score columns), tappable
 * per-player score circles with running to-par, and a fullscreen dark keypad
 * (par-aware labels, 10+ stepper, clear→no-result, pickup→0) that auto-advances
 * to the next unscored ball and then the next hole.
 */
export class ScoreEntryComponent extends Component {
    static styles = `
        .se {
            margin-top: ${s('xl')};
            &.hidden { display: none; }
        }

        /* Clipped two-cell carousel right-aligned over the score columns. */
        .se__carousel {
            position: relative;
            height: 60px;
            overflow: hidden;
            border-radius: ${t('radius')};
            background: ${t('surface-sunken')};
            border: 1px solid ${t('border')};
            touch-action: pan-y;
            user-select: none;
        }
        .se__clip {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${RIGHT_PAD}px;
            width: ${SLOT * 2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-WINDOW_RADIUS * SLOT}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${SLOT}px;
            width: ${SLOT}px;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1px;
            opacity: 0.5;
            transform: scale(0.84);
            transition: opacity 180ms ease, transform 180ms ease;

            &.active { opacity: 1; transform: scale(1); }
            &.gone { opacity: 0; }

            & .se-hole__num {
                font-family: ${t('font-display')};
                font-weight: 700;
                font-size: 1.2rem;
                color: ${t('text')};
            }
            & .se-hole__par {
                font-size: 0.68rem;
                color: ${t('text-muted')};
            }
        }

        .se__rows {
            margin-top: ${s('sm')};
            border-top: 1px solid ${t('border')};
        }
        .se-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${s('md')};
            padding: ${s('md')} 0;
            border-bottom: 1px solid ${t('border')};

            /* The name block takes the slack so the to-par sits right up
               against the fixed-width score columns; min-width:0 is what lets
               a long name ellipsis instead of pushing the numbers off-row. */
            & .se-row__who { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 auto; }
            & .se-row__name {
                font-family: ${t('font-display')};
                font-weight: 600;
                font-size: 1.05rem;
                color: ${t('text')};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            /* What the ball plays off, quiet under the name (same chain as the
               keypad list rows). Absent — not blanked — when there is no
               handicap to state. */
            & .se-row__hcpline {
                display: flex; align-items: center; gap: 2px; min-width: 0;
            }
            & .se-row__hcp {
                font-size: 0.75rem;
                color: ${t('text-muted')};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            /* The ⓘ behind the handicap: a caption-sized ringed "i" with
               thumb room — the row around it is not a control on the web
               (only the circle is), so it needs no propagation guard. */
            & .se-row__hcpinfo {
                flex: none;
                width: 22px; height: 22px; padding: 0;
                display: inline-flex; align-items: center; justify-content: center;
                background: none; cursor: pointer;
                border: 1px solid ${t('border')}; border-radius: 999px;
                color: ${t('text-muted')};
                font-size: 0.65rem; font-style: italic; font-family: serif;
                line-height: 1;
                transform: scale(0.72); transform-origin: center;
                &.hidden { display: none; }
            }
            /* Gamebook puts the standing where the eye lands: its own column
               between the name and the scores, in the display face at score
               size, tinted by tone. A match standing ("2 UP") is words, not a
               scalar — slightly smaller so four glyphs don't out-shout the
               scores. */
            & .se-row__topar {
                flex-shrink: 0;
                text-align: right;
                font-family: ${t('font-display')};
                font-weight: 700;
                font-size: 1.35rem;
                font-variant-numeric: tabular-nums;
            }
            & .se-row__topar--match { font-size: 1.05rem; }

            & .se-row__scores { display: flex; align-items: center; padding-right: ${RIGHT_PAD}px; flex-shrink: 0; }
            & .se-row__slot { width: ${SLOT}px; display: flex; align-items: center; justify-content: center; }
            & .se-row__prev {
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.05rem;
                color: ${t('text-muted')};
                font-variant-numeric: tabular-nums;
            }
            & .se-row__circle {
                width: 48px; height: 48px; border-radius: 999px;
                border: none; cursor: pointer;
                background: ${t('accent-soft')};
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.25rem;
                color: ${t('primary')};
                font-variant-numeric: tabular-nums;
                transition: background 0.15s;
                &:active { background: ${t('accent')}; }
                &.empty { color: ${t('text-muted')}; background: ${t('surface-sunken')}; }
                /* Handicap hint in an unscored circle ("-1"/"0"/"+1") — smaller
                   and quieter than a real score, so it reads as a preview. */
                &.hint { font-size: 0.95rem; opacity: 0.8; }
            }
            /* Phase 5.5 — unclaimed placeholder seat: muted label, inert circle. */
            & .se-row__name--pending { color: ${t('text-muted')}; font-style: italic; }
            & .se-row__circle--pending { cursor: default; opacity: 0.55; &:active { background: ${t('surface-sunken')}; } }
        }
        .se-row__topar.under { color: ${t('under-par')}; }
        .se-row__topar.over { color: ${t('over-par')}; }
        .se-row__topar.even { color: ${t('text-muted')}; }

        /* --- Fullscreen dark keypad modal --- */
        .se-modal {
            position: fixed; inset: 0; z-index: 50;
            display: flex; flex-direction: column;
            background: #121212; color: #fff;
            &.hidden { display: none; }
        }
        .se-modal__head {
            display: flex; align-items: center; justify-content: space-between;
            padding: ${s('md')} ${s('lg')};
            border-bottom: 1px solid rgba(255,255,255,0.1);

            & .se-modal__close {
                background: none; border: none; color: #fff; font-size: 1.3rem;
                width: 40px; height: 40px; border-radius: 999px; cursor: pointer;
                &:active { background: rgba(255,255,255,0.1); }
            }
            & .se-modal__title { font-family: ${t('font-display')}; font-weight: 700; font-size: 1.1rem; }
            & .se-modal__nav { display: flex; gap: 4px; }
            & .se-modal__navbtn {
                background: none; border: none; color: #fff; font-size: 1.6rem; line-height: 1;
                width: 40px; height: 40px; border-radius: 999px; cursor: pointer;
                &:active { background: rgba(255,255,255,0.1); }
                &:disabled { opacity: 0.35; cursor: default; }
            }
        }
        .se-modal__list { flex: 1; overflow-y: auto; }
        .se-mrow {
            width: 100%;
            display: flex; align-items: center; justify-content: space-between;
            padding: ${s('lg')};
            background: none; border: none; border-left: 4px solid transparent;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            color: #fff; font-family: inherit; cursor: pointer; text-align: left;

            &.sel { border-left-color: ${t('primary')}; background: rgba(93,155,117,0.14); }

            & .se-mrow__who { display: flex; flex-direction: column; gap: 2px; }
            & .se-mrow__name { font-family: ${t('font-display')}; font-weight: 600; font-size: 1rem; }
            & .se-mrow__hcp { font-size: 0.8rem; color: rgba(255,255,255,0.55); }

            & .se-mrow__circle {
                width: 52px; height: 52px; border-radius: 999px;
                display: flex; align-items: center; justify-content: center;
                background: ${t('primary')};
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.25rem;
                font-variant-numeric: tabular-nums;
            }
            &.sel .se-mrow__circle { background: #fff; color: ${t('primary')}; }
            /* Handicap hint in an unscored circle — faint, Gamebook-style. */
            & .se-mrow__val--hint { opacity: 0.55; font-size: 1rem; }
        }

        .se-pad { position: relative; padding: ${s('sm')} ${s('sm')} ${s('xl')}; background: #1c1c1e; }
        .se-pad__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }

        /* --- Stats step: a near-fullscreen screen shown after a real score on a
           hole that collects extra info (umbrella GIR/fairway today; numeric
           stats like bunker visits/putts later). Sits above the keypad modal;
           "Next" persists the toggles and auto-advances. The structured layout
           (header → player → grouped controls → footer) leaves room for richer
           per-category inputs without changing the score-entry flow. */
        .se-stats {
            position: fixed; inset: 0; z-index: 60;
            background: #121212; color: #fff;
            display: flex; flex-direction: column;
            &.hidden { display: none; }

            & .se-stats__head {
                display: flex; align-items: center; justify-content: space-between;
                padding: ${s('md')} ${s('lg')};
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);

                & .se-stats__back {
                    background: none; border: none; color: #fff; font-size: 1.8rem; line-height: 1;
                    width: 40px; height: 40px; border-radius: 999px; cursor: pointer;
                    &:active { background: rgba(255, 255, 255, 0.1); }
                }
                & .se-stats__hole { font-family: ${t('font-display')}; font-weight: 700; font-size: 1.1rem; }
                & .se-stats__spacer { width: 40px; }
            }

            & .se-stats__who {
                display: flex; align-items: center; justify-content: center; gap: ${s('md')};
                padding: ${s('lg')} ${s('lg')} ${s('sm')};
            }
            & .se-stats__name { font-family: ${t('font-display')}; font-weight: 700; font-size: 1.4rem; }
            & .se-stats__score {
                /* content-box, so the 8px sides ADD to the 44px minimum the way
                   iOS stacks them — .frame(minWidth: 44) then .padding(.horizontal)
                   outside it (ScoreKeypadView.swift:581-583). Under the app's
                   border-box default a one-digit score collapses to 44x44 and
                   reads as a circle instead of a capsule. */
                box-sizing: content-box;
                min-width: 44px; height: 44px; padding: 0 8px; border-radius: 999px;
                display: inline-flex; align-items: center; justify-content: center;
                background: ${t('primary')}; color: #fff;
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.3rem;
                font-variant-numeric: tabular-nums;
            }

            & .se-stats__body {
                flex: 1; overflow-y: auto;
                display: flex; flex-direction: column; gap: ${s('xl')};
                padding: ${s('lg')} ${s('lg')} ${s('xl')};
                align-content: flex-start;
            }

            /* Each metadata category is its own labeled group. */
            & .se-stats__group { display: flex; flex-direction: column; gap: ${s('sm')}; }
            & .se-stats__group-label {
                text-align: center;
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.05rem;
                color: rgba(255, 255, 255, 0.92);
            }
            & .se-stats__seg { display: flex; gap: ${s('sm')}; justify-content: center; }

            /* Hairline between the format's own toggles (what the round needs to
               score) and the player's own stats (what they asked to track). */
            & .se-stats__rule {
                height: 1px; background: rgba(255, 255, 255, 0.08);
                margin: 0 ${s('xl')};
            }

            /* Stepper prompts (putts, penalties): the 10+ pad's round ± at a
               slightly smaller size, sharing its palette. */
            & .se-stats__step {
                display: flex; align-items: center; justify-content: center; gap: ${s('xl')};
            }
            & .se-stats__step-btn {
                width: 52px; height: 52px; border-radius: 999px; border: none; cursor: pointer;
                background: #2a2a2a; color: #fff; font-size: 1.6rem; line-height: 1;
                font-family: inherit;
                &:active { background: #3a3a3a; }
            }
            & .se-stats__step-val {
                width: 72px; text-align: center;
                font-family: ${t('font-display')}; font-weight: 700; font-size: 2.1rem;
                font-variant-numeric: tabular-nums;
                color: #fff;
                /* Dimmed until answered — an untouched counter is not a zero. */
                &.unanswered { color: rgba(255, 255, 255, 0.55); }
            }

            /* Two-option segmented control: the stored value is always the
               highlighted segment, so there's no implied/hidden state. */
            & .se-seg {
                flex: 1; max-width: 180px;
                border: 1px solid rgba(255, 255, 255, 0.22);
                border-radius: 14px;
                background: #1c1c1e;
                color: rgba(255, 255, 255, 0.55);
                font-family: inherit;
                font-size: 1.05rem;
                font-weight: 700;
                padding: 18px 22px;
                cursor: pointer;
                min-width: 0;
                white-space: nowrap;
                &:active { background: rgba(255, 255, 255, 0.08); }
                &.on-hit { background: ${t('primary')}; border-color: ${t('primary')}; color: #fff; }
                &.on-miss { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.45); color: #fff; }
                /* Selected STAT segment: neutral, not green — a stat is an
                   observation, and the plate should not congratulate or scold
                   one. Same paint as on-miss, different meaning. */
                &.on-neutral { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.45); color: #fff; }
                /* Four or five options (first putt) have to fit a 375px plate. */
                &.tight { padding: 18px 4px; font-size: 0.9rem; }
            }

            & .se-stats__foot {
                padding: ${s('md')} ${s('lg')} ${s('xl')};
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            & .se-stats__next {
                width: 100%;
                height: 56px;
                border: none;
                border-radius: 12px;
                background: ${t('primary')};
                color: #fff;
                font-family: ${t('font-display')};
                font-weight: 700;
                font-size: 1.15rem;
                cursor: pointer;
                &:active { filter: brightness(1.1); }
            }
        }
        .se-key {
            height: 56px; border-radius: 10px; border: none; cursor: pointer;
            background: #2a2a2a; color: #fff; font-family: inherit;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            &:active { background: #3a3a3a; }
            &.par { background: ${t('primary')}; }
            &.clear { color: ${t('error')}; }
            &.muted { color: rgba(255,255,255,0.5); }

            & .se-key__num { font-size: 1.3rem; font-weight: 700; font-family: ${t('font-display')}; }
            & .se-key__lbl { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.75; margin-top: 1px; }
        }

        .se-pad__ext {
            position: absolute; inset: 0; z-index: 10;
            background: #1c1c1e; display: flex; flex-direction: column;
            padding: ${s('sm')} ${s('sm')} ${s('xl')};
            &.hidden { display: none; }

            & .se-pad__ext-row { flex: 1; display: flex; align-items: center; justify-content: center; gap: ${s('xl')}; }
            & .se-pad__ext-step {
                width: 60px; height: 60px; border-radius: 999px; border: none; cursor: pointer;
                background: #2a2a2a; color: #fff; font-size: 1.8rem; line-height: 1;
                &:active { background: #3a3a3a; }
            }
            & .se-pad__ext-val { width: 72px; text-align: center; font-family: ${t('font-display')}; font-weight: 700; font-size: 2.6rem; color: #fff; }
            & .se-pad__ext-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            & .se-pad__ext-cancel { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: #2a2a2a; color: #fff; font-weight: 600; font-family: inherit; }
            & .se-pad__ext-ok { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: ${t('primary')}; color: #fff; font-size: 1.3rem; }
        }

        /* The handicap-derivation dialog: a dimmed backdrop with a bottom
           sheet (mobile-first, like the keypad), one card per step, the
           effective PH as the loud closing line. */
        .se-hcp {
            position: fixed; inset: 0; z-index: 55;
            display: flex; align-items: flex-end; justify-content: center;
            background: rgba(0, 0, 0, 0.45);
            &.hidden { display: none; }
        }
        .se-hcp__panel {
            width: 100%; max-width: 480px; max-height: 82dvh;
            overflow-y: auto;
            background: ${t('surface')};
            border-radius: ${t('radius')} ${t('radius')} 0 0;
            padding: ${s('md')} ${s('lg')} ${s('xl')};
            display: flex; flex-direction: column; gap: ${s('sm')};
        }
        .se-hcp__head {
            display: flex; align-items: center; justify-content: space-between;
            & .se-hcp__title {
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.15rem;
                color: ${t('text')};
            }
            & .se-hcp__close {
                background: none; border: none; color: ${t('text-muted')};
                font-size: 1.1rem; width: 40px; height: 40px; border-radius: 999px;
                cursor: pointer; flex: none;
            }
        }
        .se-hcp__format {
            font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
            text-transform: uppercase; color: ${t('text-muted')};
        }
        .se-hcp__steps { display: flex; flex-direction: column; gap: ${s('sm')}; }
        .se-hcp__card {
            display: flex; align-items: flex-start; gap: ${s('md')};
            border: 1px solid ${t('border')}; border-radius: ${t('radius')};
            padding: ${s('md')};
            & .se-hcp__card-body {
                display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1;
            }
            & .se-hcp__card-title {
                font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${t('text-muted')};
            }
            & .se-hcp__card-text { font-size: 0.9rem; color: ${t('text')}; }
            & .se-hcp__card-math {
                font-size: 0.75rem; color: ${t('text-muted')};
                &[hidden] { display: none; }
            }
            & .se-hcp__card-result {
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.1rem;
                font-variant-numeric: tabular-nums; color: ${t('text')};
            }
        }
        .se-hcp__foot {
            display: flex; align-items: center; gap: ${s('sm')};
            padding-top: ${s('xs')};
            & .se-hcp__foot-label { font-size: 0.9rem; font-weight: 600; color: ${t('text')}; }
            & .se-hcp__eff {
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.35rem;
                font-variant-numeric: tabular-nums; color: ${t('accent')};
            }
        }

        .se-toast {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 60;
            background: ${t('primary')}; color: ${t('primary-text')};
            font-family: ${t('font-display')}; font-weight: 700;
            padding: ${s('md')} ${s('xl')}; border-radius: ${t('radius')};
            box-shadow: ${t('shadow-elevated')};
            &.hidden { display: none; }
        }
    `;

    private svc = this.inject(RoundViewService);

    // Hole/group navigation lives in RoundViewService so the orange hole-info
    // bar (rendered by RoundComponent) and this carousel stay in lock-step.
    private holeIdx = this.svc.holeIdx;
    // Shared with RoundComponent, which hides its bottom dock while the
    // fullscreen keypad is open (the dock would overlap the keypad rows).
    private modalOpen = this.svc.keypadOpen;
    private currentBallIdx = new Signal(0);
    /**
     * True when every (non-pending) ball on the hole was already scored at the
     * moment the keypad arrived on it — i.e. the player came back to correct,
     * not to enter. In that mode `commit()` saves but never auto-advances
     * (no ball hop, no hole jump), so several corrections on one hole don't
     * fight the advance logic. Re-evaluated on every keypad hole arrival:
     * open, header chevrons, and the post-completion auto-advance.
     */
    private holeCompleteOnEntry = false;
    private extendedOpen = new Signal(false);
    private extendedScore = new Signal(10);
    // After a real score on a hole that collects stats, the keypad is replaced by
    // a dedicated stats screen; "Next" persists the toggles and auto-advances.
    private statsOpen = new Signal(false);
    // Per-hole metadata toggles (umbrella GIR/fairway) for the open ball+hole,
    // committed alongside strokes. Reseeded from stored state when the selected
    // ball/hole changes (`lastMetaKey` guards against clobbering live toggles).
    private pendingMeta = new Signal<Record<string, boolean>>({});
    private lastMetaKey: string | null = null;
    private toastMsg = new Signal<string | null>(null);
    /** Ball id whose handicap-derivation dialog is open; null = closed. */
    private hcpInfoBallId = new Signal<string | null>(null);
    private dragOffset = new Signal(0);
    private transitioning = new Signal(false);
    private ptr: PointerState | null = null;
    private pendingSteps: number | null = null;
    private settleTimer: ReturnType<typeof setTimeout> | null = null;
    private advanceTimer: ReturnType<typeof setTimeout> | null = null;
    private flashTimer: ReturnType<typeof setTimeout> | null = null;

    private hasScoring = new Computed(() => this.svc.balls.get().length > 0);

    // --- Itinerary navigation — delegates to the shared RoundViewService state
    // (tracked reads) so the carousel and the orange hole bar move together. ---
    private group = () => this.svc.group();
    private playedOrder = () => this.svc.playedOrder();
    private holeIndex = () => this.svc.holeIndex();
    private currentHole = () => this.svc.currentPlayedHole();
    private occAtOffset = (offset: number) => {
        const po = this.playedOrder();
        return po[clampIndex(this.holeIndex() + offset, po.length)] ?? null;
    };
    private ballsInGroup = (): RoundBall[] => {
        const g = this.group();
        if (!g) return [];
        const byId = new Map(this.svc.balls.get().map((b) => [b.id, b]));
        return g.ballIds.map((id) => byId.get(id)).filter((b): b is RoundBall => !!b);
    };

    private parFor = (playHoleId: string | null) => this.svc.parFor(playHoleId);
    private occLabel = (playHoleId: string): string => this.svc.occLabel(playHoleId);
    private ballName = (b: RoundBall) => ballDisplayName(b);

    /** Boolean metadata toggles applicable to the current hole (umbrella GIR/fairway). */
    private metaInputs = (): MetadataInput[] =>
        this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter((m) => m.kind === 'boolean');

    /** Strokes display: no-result → "–", pickup(0) → "0", else the count. */
    private displayScore = (strokes: number | null): string =>
        strokes === null ? '–' : String(strokes);

    /**
     * Gamebook-style hint shown in an UNSCORED circle: how handicap will
     * modify the gross on this hole ("-1" = one stroke received, "+1" = a
     * plus-handicap giveback, "0" = plays off scratch here). `null` (→ the
     * plain "–" placeholder) when the round carries no playing handicap.
     */
    private hintText = (ballId: string, playHoleId: string): string | null => {
        const n = this.svc.strokesHintFor(ballId, playHoleId);
        if (n === null) return null;
        return n === 0 ? '0' : n > 0 ? `-${n}` : `+${-n}`;
    };

    /** Running to-par over scored holes (>0 strokes; pickup/no-result excluded). */
    private toParValue = (ball: RoundBall): number | null => {
        let shots = 0;
        let par = 0;
        let any = false;
        for (const occ of this.playedOrder()) {
            const st = this.svc.strokesFor(ball.id, occ.playHoleId);
            if (st !== null && st > 0) {
                shots += st;
                par += this.parFor(occ.playHoleId);
                any = true;
            }
        }
        return any ? shots - par : null;
    };

    /**
     * The quiet handicap line under a player row's name, re-read from the LIVE
     * ball every time (a claimed seat rewrites the chain in place, so a
     * snapshot taken at row-build time would go stale). `null` = no handicap to
     * state, and the row drops the line entirely rather than print a
     * placeholder — unlike the keypad's list row (`modalRow`), which is the
     * scoring surface and keeps the line with a "–".
     *
     * Since the format chips became the view's presentation context, the line
     * shows what the ball PLAYS OFF under the selected format: the raw
     * handicap when nothing changes it, and `HCP 7 → 5` when an allowance or
     * a match-play normalisation moves it — the ⓘ beside it tells the story.
     */
    private hcpLine = (ballId: string): string | null => {
        const ball = this.ballsInGroup().find((b) => b.id === ballId);
        if (!ball || ball.pending) return null;
        const ch =
            ball.players.length > 1
                ? ball.courseHandicap
                : (ball.players[0]?.courseHandicap ?? ball.courseHandicap);
        if (ch === null) return null;
        const base = ball.players.length > 1 ? `Team · HCP ${ch}` : `HCP ${ch}`;
        const eff = this.svc.effectivePlayingHandicap(ball);
        return eff !== null && eff !== ch ? `${base} → ${eff}` : base;
    };

    /** The derivation behind a row's caption, under the SELECTED format chip. */
    private rowDerivation = (ballId: string): HandicapDerivation | null => {
        const ball = this.ballsInGroup().find((b) => b.id === ballId);
        if (!ball || ball.pending) return null;
        return this.svc.presentedSlot(ball)?.handicapDerivation ?? null;
    };

    /** Catalog label of the selected slot, for the dialog's format caption. */
    private selectedFormatLabel = (): string | null => {
        const slot = this.svc.round
            .get()
            ?.formatSlots.find((sl) => sl.slotDefId === this.svc.selectedSlotDefId());
        return slot ? formatLabelFromSlot(slot) : null;
    };

    /**
     * The dialog's rendered steps. The server sends structured numbers (a
     * closed step vocabulary, `HandicapDerivation`); every sentence here is
     * client prose — same split as the result sections, so tone and the WHS
     * explanation can change without a server release. Mirrors the iOS
     * `HandicapInfoSheet` card-for-card. A 100% allowance card is dropped:
     * "× 100%" changes nothing and reads as noise.
     */
    private hcpCards = (
        d: HandicapDerivation,
    ): { title: string; text: string; math: string | null; result: number }[] => {
        const label = this.selectedFormatLabel();
        const cards: { title: string; text: string; math: string | null; result: number }[] = [];
        for (const step of d.steps) {
            switch (step.kind) {
                case 'course_handicap': {
                    const full =
                        step.handicapIndex !== null &&
                        step.slope !== null &&
                        step.courseRating !== null &&
                        step.par !== null;
                    // Name the tee whose rating did the adjusting — "these
                    // tees" alone left the reader guessing which box.
                    const tees = step.teeName ? `the ${step.teeName} tees` : 'these tees';
                    cards.push({
                        title: `Course handicap · ${step.producerLabel}`,
                        text: full
                            ? `Exact handicap ${step.handicapIndex}, adjusted for the difficulty of ${tees}.`
                            : `The handicap ${step.producerLabel} plays this course off.`,
                        math: full
                            ? `${step.handicapIndex} × ${step.slope} ÷ 113 + (${step.courseRating} − ${step.par}), rounded — the World Handicap System formula.`
                            : null,
                        result: step.result,
                    });
                    break;
                }
                case 'team_combination':
                    cards.push({
                        title: 'Team handicap',
                        text: "The team plays off a share of each member's handicap.",
                        math: `${step.parts
                            .map((p) => `${p.pct}% of ${p.producerLabel}'s ${p.ch}`)
                            .join(' + ')}, rounded.`,
                        result: step.result,
                    });
                    break;
                case 'allowance':
                    if (step.pct !== 100) {
                        cards.push({
                            title: 'Allowance',
                            text: `${label ?? 'This format'} is played at ${step.pct}% handicap.`,
                            math: null,
                            result: step.result,
                        });
                    }
                    break;
                case 'match_delta':
                    cards.push(
                        step.ownPh === step.lowestPh
                            ? {
                                  title: 'Match difference',
                                  text: 'Lowest handicap in the match — plays off scratch, and the others get the difference.',
                                  math: null,
                                  result: step.result,
                              }
                            : {
                                  title: 'Match difference',
                                  text: 'In match formats only the difference matters: the lowest ball plays off 0, this ball gets the rest.',
                                  math: `${step.ownPh} − ${step.lowestPh} = ${step.result}.`,
                                  result: step.result,
                              },
                    );
                    break;
            }
        }
        return cards;
    };

    /**
     * The row's loud figure: the ball's standing under the SELECTED format
     * (points pace, plain points, `2 UP`) joined from the result payload —
     * falling back to the locally-computed gross-to-par while the result
     * hasn't arrived or has nothing to say for this ball. The fallback is
     * also what keeps the figure instant on plain stroke-play rounds: the
     * gross pace and the local computation agree, and the local one updates
     * optimistically with every keypad tap.
     */
    private figureText = (ball: RoundBall): string => {
        const standing = this.svc.slotStandingFor(ball);
        if (standing === null) {
            const v = this.toParValue(ball);
            return v === null ? '–' : v === 0 ? 'E' : v > 0 ? `+${v}` : `${v}`;
        }
        switch (standing.kind) {
            case 'pace': {
                const d = standing.delta;
                return d === 0 ? 'E' : d > 0 ? `+${d}` : `${d}`;
            }
            case 'total':
                return String(standing.total);
            case 'match':
                return standing.text;
        }
    };
    private figureClass = (ball: RoundBall): string => {
        const standing = this.svc.slotStandingFor(ball);
        let tone: 'even' | 'under' | 'over';
        let match = false;
        if (standing === null) {
            const v = this.toParValue(ball);
            tone = v === null || v === 0 ? 'even' : v < 0 ? 'under' : 'over';
        } else if (standing.kind === 'pace') {
            tone = standing.delta === 0 ? 'even' : standing.delta < 0 ? 'under' : 'over';
        } else if (standing.kind === 'total') {
            tone = 'even';
        } else {
            tone = standing.tone;
            match = true;
        }
        return `se-row__topar ${tone}${match ? ' se-row__topar--match' : ''}`;
    };

    private scoreLabel = (score: number, par: number): string => {
        if (score === 1) return 'HIO';
        const d = score - par;
        if (d <= -4 || d >= 5) return 'OTHER';
        return (
            { '-3': 'ALBA', '-2': 'EAGLE', '-1': 'BIRDIE', '0': 'PAR', '1': 'BOGEY', '2': 'DOUBLE', '3': 'TRIPLE', '4': 'QUAD' } as Record<string, string>
        )[String(d)] ?? '';
    };

    render(): DocumentFragment {
        this.track(() => {
            if (this.advanceTimer) clearTimeout(this.advanceTimer);
            if (this.flashTimer) clearTimeout(this.flashTimer);
            if (this.settleTimer) clearTimeout(this.settleTimer);
            // keypadOpen lives in the shared service; leaving the round view
            // with the keypad up must not resurrect it (or keep the dock
            // hidden) when this same round is opened again.
            this.modalOpen.set(false);
        });
        // Keep the selected ball in range as the group (and its ball count) changes.
        this.track(
            effect(() => {
                const n = this.ballsInGroup().length;
                if (n > 0 && this.currentBallIdx.get() >= n) this.selectBall(0);
            }),
        );

        const frag = this.wire(tpl, {
            root: { className: () => (this.hasScoring.get() ? 'se' : 'se hidden') },
            close: {
                onclick: () => {
                    this.statsOpen.set(false);
                    this.modalOpen.set(false);
                    this.svc.flushStats();
                },
            },
            modal: { className: () => (this.modalOpen.get() ? 'se-modal' : 'se-modal hidden') },
            modalTitle: () => {
                const ph = this.currentHole();
                return ph ? `Hole ${this.occLabel(ph.playHoleId)} · Par ${this.parFor(ph.playHoleId)}` : '';
            },
            modalPrev: {
                onclick: () => this.stepHole(-1),
                disabled: () => !this.svc.canPrevHole(),
            },
            modalNext: {
                onclick: () => this.stepHole(1),
                disabled: () => !this.svc.canNextHole(),
            },
            extended: { className: () => (this.extendedOpen.get() ? 'se-pad__ext' : 'se-pad__ext hidden') },
            extVal: () => String(this.extendedScore.get()),
            extMinus: { onclick: () => this.extendedScore.set(Math.max(10, this.extendedScore.get() - 1)) },
            extPlus: { onclick: () => this.extendedScore.set(this.extendedScore.get() + 1) },
            extCancel: { onclick: () => this.extendedOpen.set(false) },
            extOk: {
                onclick: () => {
                    this.extendedOpen.set(false);
                    this.commit(this.extendedScore.get());
                },
            },
            toast: {
                className: () => (this.toastMsg.get() ? 'se-toast' : 'se-toast hidden'),
                textContent: () => this.toastMsg.get() ?? '',
            },
            // The handicap ⓘ dialog. Closing = clearing the ball id; a tap on
            // the dimmed backdrop closes too (the panel stops propagation via
            // its own onclick target check).
            hcpModal: {
                className: () => (this.hcpInfoBallId.get() !== null ? 'se-hcp' : 'se-hcp hidden'),
                onclick: (e: MouseEvent) => {
                    if (e.target === e.currentTarget) this.hcpInfoBallId.set(null);
                },
            },
            hcpClose: { onclick: () => this.hcpInfoBallId.set(null) },
            hcpTitle: () => {
                const id = this.hcpInfoBallId.get();
                const ball = id ? this.ballsInGroup().find((b) => b.id === id) : null;
                return ball ? this.ballName(ball) : '';
            },
            hcpFormat: () => this.selectedFormatLabel() ?? '',
            hcpEff: () => {
                const id = this.hcpInfoBallId.get();
                const d = id ? this.rowDerivation(id) : null;
                return d ? String(d.effectivePh) : '';
            },
            // The stats step (umbrella GIR/fairway today). Shown by `commit()`
            // after a real score on a stats hole; "Next" persists + advances.
            stats: { className: () => (this.statsOpen.get() ? 'se-stats' : 'se-stats hidden') },
            // The back chevron dismisses the step and NOTHING else: no
            // `statsDone`, so no write, no ball hop, no hole jump. It DOES
            // commit the captured stats — the format toggles persisted
            // themselves on every tap, and stats batch, so keeping them takes
            // an explicit flush. Without it, backing out would bin the hole.
            statsBack: {
                onclick: () => {
                    this.statsOpen.set(false);
                    this.svc.flushStats();
                },
            },
            statsHole: () => {
                const ph = this.currentHole();
                return ph ? `Hole ${this.occLabel(ph.playHoleId)} · Par ${this.parFor(ph.playHoleId)}` : '';
            },
            statsTitle: () => {
                const ball = this.ballsInGroup()[this.currentBallIdx.get()];
                return ball ? this.ballName(ball) : '';
            },
            statsScore: () => {
                const ball = this.ballsInGroup()[this.currentBallIdx.get()];
                const ph = this.currentHole();
                if (!ball || !ph) return '';
                return this.displayScore(this.svc.strokesFor(ball.id, ph.playHoleId));
            },
            statsNext: {
                textContent: () => (this.hasMoreUnscored() ? 'Next ›' : 'Done ›'),
                onclick: () => {
                    this.statsOpen.set(false);
                    // Before the event: `statsDone` can move the cursor, and the
                    // batch belongs to the ball it was answered for.
                    this.svc.flushStats();
                    this.apply({ kind: 'statsDone' });
                },
            },
        });

        // Carousel — windowed cells (one fixed slot per offset, content reactive)
        // plus a pointer-driven, momentum-snapping transform.
        const viewport = this.ref(frag, 'viewport');
        const track = this.ref(frag, 'track');
        this.bindCarouselPointer(viewport, track);
        this.track(
            effect(() => {
                track.style.transition = this.transitioning.get() ? SNAP : 'none';
                track.style.transform = `translateX(${this.dragOffset.get()}px)`;
            }),
        );
        this.$each(
            track,
            new Computed(() => OFFSETS),
            (offset, _i, t2) => this.holeItem(offset, t2),
            (offset) => offset,
        );

        // Main player rows for the current hole.
        this.$each(
            this.ref(frag, 'rows'),
            new Computed(() => {
                const po = this.playedOrder();
                const idx = this.holeIndex();
                const ph = po[idx];
                if (!ph) return [] as { ball: RoundBall; ph: string; prevPh: string | null }[];
                const prevPh = idx > 0 ? po[idx - 1]!.playHoleId : null;
                return this.ballsInGroup().map((ball) => ({ ball, ph: ph.playHoleId, prevPh }));
            }),
            (d, _i, t2) => this.playerRow(d.ball, d.ph, d.prevPh, t2),
            // `pending` rides in the key because it picks a WHOLE branch of
            // playerRow (inert seat vs scorable row) that no binding can undo:
            // claiming a seat mid-round must remount the row, not update it.
            (d) => `${d.ball.id}|${d.ph}|${d.ball.pending}`,
        );

        // The ⓘ dialog's step cards — rebuilt when the open ball or the
        // selected format chip changes.
        this.$each(
            this.ref(frag, 'hcpSteps'),
            new Computed(() => {
                const id = this.hcpInfoBallId.get();
                const d = id ? this.rowDerivation(id) : null;
                return d ? this.hcpCards(d) : [];
            }),
            (card, _i, t2) =>
                this.wireEl(
                    hcpStepTpl,
                    {
                        ctitle: { textContent: card.title },
                        ctext: { textContent: card.text },
                        cmath: { textContent: card.math ?? '', hidden: card.math === null },
                        cresult: { textContent: String(card.result) },
                    },
                    t2,
                ),
            (card, i) => `${i}|${card.title}|${card.result}`,
        );

        // Modal player list (stable per ball; reactive score + selection).
        this.$each(
            this.ref(frag, 'modalList'),
            new Computed(() => this.ballsInGroup()),
            (ball, i, t2) => this.modalRow(ball, i, t2),
            (ball) => ball.id,
        );

        // Keypad — 1..9, then 10+, clear, pickup.
        const keysHost = this.ref(frag, 'keys');
        for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) keysHost.appendChild(this.numberKey(n));
        keysHost.appendChild(this.specialKey('10+', '', 'se-key', () => this.openExtended()));
        keysHost.appendChild(this.specialKey('✕', 'clear', 'se-key clear', () => this.commit(null)));
        keysHost.appendChild(this.specialKey('0', 'pick up', 'se-key muted', () => this.commit(0)));

        // The stats body, in one list: the format's own per-hole toggles
        // (umbrella GIR/fairway, scoped to the hole's par via `appliesWhen`),
        // then a hairline, then the player's own stat prompts.
        this.$each(
            this.ref(frag, 'statsBody'),
            new Computed(() => this.statBodyRows()),
            (row, _i, track) => this.statBodyRow(row, track),
            (row) => row.key,
        );
        // Reseed the toggles from stored state whenever the open ball/hole
        // changes (never on a same-hole cell update, so live toggles survive),
        // and keep the stats step pointed at the same cell.
        this.track(
            effect(() => {
                if (!this.modalOpen.get()) {
                    this.lastMetaKey = null;
                    // Closing the keypad by any route (including a route change
                    // that clears `keypadOpen`) commits what was captured.
                    this.svc.seedStatStep(null);
                    return;
                }
                const ball = this.ballsInGroup()[this.currentBallIdx.get()];
                const ph = this.currentHole();
                if (!ball || !ph) return;
                // Unconditional: a ball hop, a hole step and an auto-jump all
                // land here, and `seedStatStep` is what flushes the cell being
                // left. A same-cell call only re-reads the durable half, so a
                // background load cannot swallow an in-progress draft.
                this.seedStatStepForCursor();
                const key = `${ball.id}|${ph.playHoleId}`;
                if (key === this.lastMetaKey) return;
                this.lastMetaKey = key;
                const seed: Record<string, boolean> = {};
                for (const mi of this.metaInputs())
                    seed[mi.key] = this.svc.metadataFor(ball.id, ph.playHoleId, mi.key) === true;
                this.pendingMeta.set(seed);
            }),
        );

        // Stats batch instead of posting per tap, so a hole captured and then
        // backgrounded (or killed from the app switcher) has to be handed over
        // on the way out. `pagehide` is the reliable one on iOS Safari;
        // `visibilitychange` catches an app switch that never unloads.
        const onHide = () => {
            if (document.visibilityState === 'hidden') this.svc.flushStats();
        };
        const onPageHide = () => this.svc.flushStats();
        document.addEventListener('visibilitychange', onHide);
        window.addEventListener('pagehide', onPageHide);
        this.track(() => {
            document.removeEventListener('visibilitychange', onHide);
            window.removeEventListener('pagehide', onPageHide);
            // Leaving the round view is an exit too.
            this.svc.flushStats();
        });

        return frag;
    }

    private holeItem(offset: number, track: (d: () => void) => void): HTMLElement {
        return this.wireEl(
            holeTpl,
            {
                item: {
                    className: () => {
                        // The previous slot is empty on the first hole (nothing before it).
                        const restingHidden = offset === -1 && this.holeIndex() <= 0;
                        return `se-hole${offset === 0 ? ' active' : ''}${restingHidden ? ' gone' : ''}`;
                    },
                },
                hnum: { textContent: () => { const o = this.occAtOffset(offset); return o ? this.occLabel(o.playHoleId) : ''; } },
                hpar: { textContent: () => { const o = this.occAtOffset(offset); return o ? `Par ${this.parFor(o.playHoleId)}` : ''; } },
            },
            track,
        );
    }

    private playerRow(
        ball: RoundBall,
        playHoleId: string,
        prevPlayHoleId: string | null,
        track: (d: () => void) => void,
    ): HTMLElement {
        // Phase 5.5: a pending ball (unclaimed placeholder seat) renders its
        // seat label muted and refuses score entry — the server would 409 the
        // write anyway (`seat_unclaimed`); the claim card (Slice 3) unlocks it.
        if (ball.pending) {
            return this.wireEl(
                rowTpl,
                {
                    name: {
                        textContent: this.ballName(ball),
                        className: 'se-row__name se-row__name--pending',
                    },
                    hcp: { textContent: 'open seat' },
                    // Nothing has been played from this seat, so there is no
                    // to-par to state — the slot stays empty rather than "E".
                    topar: { textContent: '', className: 'se-row__topar' },
                    prev: { textContent: '' },
                    cval: { textContent: '–' },
                    circle: { className: 'se-row__circle empty se-row__circle--pending' },
                },
                track,
            );
        }
        return this.wireEl(
            rowTpl,
            {
                name: { textContent: this.ballName(ball) },
                // Reactive, not snapshot: a seat claimed mid-round rewrites the
                // ball's handicap chain in place, and this row must follow.
                hcp: {
                    textContent: () => this.hcpLine(ball.id) ?? '',
                    hidden: () => this.hcpLine(ball.id) === null,
                },
                // The ⓘ exists only when there is a derivation to explain —
                // a round without handicaps keeps its clean caption.
                hcpInfo: {
                    className: () =>
                        this.rowDerivation(ball.id) !== null
                            ? 'se-row__hcpinfo'
                            : 'se-row__hcpinfo hidden',
                    onclick: () => this.hcpInfoBallId.set(ball.id),
                },
                topar: {
                    textContent: () => this.figureText(ball),
                    className: () => this.figureClass(ball),
                },
                prev: {
                    textContent: () =>
                        prevPlayHoleId ? this.displayScore(this.svc.strokesFor(ball.id, prevPlayHoleId)) : '',
                },
                cval: {
                    textContent: () => {
                        const st = this.svc.strokesFor(ball.id, playHoleId);
                        if (st !== null) return this.displayScore(st);
                        return this.hintText(ball.id, playHoleId) ?? '–';
                    },
                },
                circle: {
                    className: () => {
                        if (this.svc.strokesFor(ball.id, playHoleId) !== null) return 'se-row__circle';
                        const hinted = this.hintText(ball.id, playHoleId) !== null;
                        return hinted ? 'se-row__circle empty hint' : 'se-row__circle empty';
                    },
                    onclick: () => this.openModalForBall(ball.id),
                },
            },
            track,
        );
    }

    private modalRow(ball: RoundBall, index: number, track: (d: () => void) => void): HTMLElement {
        // Phase 5.5: a pending ball has no handicap chain until its seat is
        // claimed — say so instead of showing an invented handicap. An absent
        // handicap on a claimed ball keeps the line and prints the same "–"
        // placeholder the score circles use; this is the scoring surface, so a
        // missing number is stated rather than silently dropped.
        //
        // Reactive, not snapshot: the `HCP 7 → 5` arrow follows the selected
        // format chip, same derivation as the row caption (`hcpLine`) — the
        // two surfaces must never disagree about which number a ball plays
        // off.
        const hcp = (): string => {
            if (ball.pending) return 'Open seat — claim to score';
            const ch =
                ball.players.length > 1
                    ? ball.courseHandicap
                    : (ball.players[0]?.courseHandicap ?? ball.courseHandicap);
            const chText = ch === null ? '–' : String(ch);
            const base =
                ball.players.length > 1 ? `Team · HCP ${chText}` : `HCP ${chText}`;
            const eff = this.svc.effectivePlayingHandicap(ball);
            return ch !== null && eff !== null && eff !== ch ? `${base} → ${eff}` : base;
        };
        return this.wireEl(
            mrowTpl,
            {
                mrow: {
                    className: () => (this.currentBallIdx.get() === index ? 'se-mrow sel' : 'se-mrow'),
                    onclick: () => this.selectBall(index),
                },
                mname: { textContent: this.ballName(ball) },
                mhcp: { textContent: hcp },
                mval: {
                    textContent: () => {
                        const ph = this.currentHole();
                        if (!ph) return '–';
                        const st = this.svc.strokesFor(ball.id, ph.playHoleId);
                        if (st !== null) return this.displayScore(st);
                        return this.hintText(ball.id, ph.playHoleId) ?? '–';
                    },
                    className: () => {
                        const ph = this.currentHole();
                        const unscored =
                            !!ph && this.svc.strokesFor(ball.id, ph.playHoleId) === null;
                        const hinted =
                            unscored && !!ph && this.hintText(ball.id, ph.playHoleId) !== null;
                        return hinted ? 'se-mrow__val se-mrow__val--hint' : 'se-mrow__val';
                    },
                },
            },
            track,
        );
    }

    private numberKey(n: number): HTMLElement {
        return this.wireEl(keyTpl, {
            key: {
                className: () => {
                    const ph = this.currentHole();
                    const isPar = ph ? n === this.parFor(ph.playHoleId) : false;
                    return isPar ? 'se-key par' : 'se-key';
                },
                onclick: () => this.commit(n),
            },
            num: { textContent: String(n) },
            lbl: {
                textContent: () => {
                    const ph = this.currentHole();
                    return ph ? this.scoreLabel(n, this.parFor(ph.playHoleId)) : '';
                },
            },
        });
    }

    private specialKey(num: string, label: string, className: string, onclick: () => void): HTMLElement {
        return this.wireEl(keyTpl, {
            key: { className, onclick },
            num: { textContent: num },
            lbl: { textContent: label },
        });
    }

    private openModalForBall(ballId: string): void {
        const idx = this.ballsInGroup().findIndex((b) => b.id === ballId);
        this.selectBall(idx < 0 ? 0 : idx);
        this.extendedOpen.set(false);
        this.statsOpen.set(false);
        this.noteHoleEntered();
        this.modalOpen.set(true);
    }

    /**
     * Move the keypad cursor and synchronously point the personal-stat step at
     * the same ball. The reactive seeding effect below remains the backstop
     * for external round changes, but an interaction must not wait for an
     * effect before it can open the next player's detail sheet: Umbrella's
     * format GIR belongs to every player, while personal prompts belong only
     * to the opted-in player under the cursor.
     *
     * This is deliberately the web counterpart of iOS `selectBall`, which
     * calls `seedStats()` in the same state transition.
     */
    private selectBall(index: number): void {
        this.currentBallIdx.set(index);
        this.seedStatStepForCursor();
    }

    /** Reconcile the service-held personal-stat cell to the current cursor. */
    private seedStatStepForCursor(): void {
        const ball = this.ballsInGroup()[this.currentBallIdx.get()];
        const ph = this.currentHole();
        const playerId = ball ? this.svc.statSubject(ball) : null;
        this.svc.seedStatStep(playerId && ph ? { playerId, playHoleId: ph.playHoleId } : null);
    }

    /**
     * Snapshot of everything `advance-policy.ts` is allowed to know, read out
     * of the live signals at event time. Built here and nowhere else — the
     * policy owns the domain choice, this component only executes it.
     */
    private advanceState(): AdvanceState {
        const ph = this.currentHole();
        return {
            balls: this.ballsInGroup().map((b) => ({
                pending: !!b.pending,
                scored: !!ph && this.svc.strokesFor(b.id, ph.playHoleId) !== null,
            })),
            currentBallIndex: this.currentBallIdx.get(),
            currentHole: ph ? { id: ph.playHoleId, label: this.occLabel(ph.playHoleId) } : null,
            holeIndex: this.holeIndex(),
            holeCount: this.playedOrder().length,
            holeCompleteOnEntry: this.holeCompleteOnEntry,
            // Either channel opens the step: a format that wants GIR, or a
            // player who tracks their own stats. A round with no format metadata
            // at all still gets a stats step for a player who asked for one.
            collectsStats: this.metaInputs().length > 0 || this.svc.statPrompts().length > 0,
        };
    }

    /**
     * Snapshot whether the hole the keypad just arrived on was already fully
     * scored (pending seats excluded — they can't be scored at all). Decides
     * entry mode vs correction mode for this visit; a clear+re-enter during
     * the visit deliberately keeps correction mode.
     */
    private noteHoleEntered(): void {
        this.holeCompleteOnEntry = isHoleCompleteOnEntry(this.advanceState());
    }

    /** Header-chevron hole navigation inside the keypad modal. */
    private stepHole(dir: -1 | 1): void {
        // A pending post-completion hole jump must not fire on top of a manual
        // navigation (its stale-hole guard would pass again after we move).
        if (this.advanceTimer) {
            clearTimeout(this.advanceTimer);
            this.advanceTimer = null;
        }
        this.extendedOpen.set(false);
        this.statsOpen.set(false);
        // The cell is about to change under the step; the reseed effect flushes
        // too, but do it before the move so nothing depends on effect ordering.
        this.svc.flushStats();
        if (dir < 0) this.svc.prevHole();
        else this.svc.nextHole();
        this.selectBall(0);
        this.noteHoleEntered();
    }

    private openExtended(): void {
        this.extendedScore.set(10);
        this.extendedOpen.set(true);
    }

    /** Record `value` for the selected ball on the current hole, then advance. */
    private commit(value: number | null): void {
        this.apply({ kind: 'score', value });
    }

    /**
     * Ask `advance-policy.ts` what this interaction means, then execute the
     * answer. Every domain branch (pending seats, correction mode, the stats
     * detour, ball wrap-around, hole/round completion) lives in the policy;
     * everything below is mechanics.
     */
    private apply(entry: EntryEvent): void {
        this.execute(decideAdvance(this.advanceState(), entry));
    }

    private execute(decision: AdvanceDecision): void {
        const write = decision.write;
        if (write) {
            const ball = this.ballsInGroup()[write.ballIndex];
            if (ball)
                void this.svc.setScore(
                    ball.id,
                    write.holeId,
                    write.value,
                    write.withMetadata ? this.metaSnapshot() : undefined,
                );
        }
        const move = decision.move;
        switch (move.kind) {
            case 'noop':
            case 'stay':
                return;
            case 'moveToBall':
                this.selectBall(move.ballIndex);
                return;
            case 'openStats':
                this.statsOpen.set(true);
                return;
            case 'roundComplete':
                // The fullscreen finish prompt IS the completion confirmation
                // now — the policy's toast is deliberately not flashed under
                // it (caller contract #5's carve-out in advance-policy.ts).
                this.modalOpen.set(false);
                this.svc.finishFlowOpen.set(true);
                return;
            case 'holeComplete': {
                this.flash(move.toast);
                if (this.advanceTimer) clearTimeout(this.advanceTimer);
                this.advanceTimer = setTimeout(() => {
                    this.advanceTimer = null;
                    // Only auto-advance if still on the hole that completed — a
                    // manual swipe during the pause must not yank the user to
                    // the wrong hole.
                    if (this.currentHole()?.playHoleId !== move.fromHoleId) return;
                    // Deliberate: the target index is FROZEN at decision time
                    // and only re-clamped here against the live played order —
                    // it is not recomputed. The `fromHoleId` guard above covers
                    // the realistic case (the user moved); the only way to land
                    // somewhere unintended is the itinerary itself changing
                    // during the 700ms pause while the keypad stayed put, which
                    // the clamp keeps in range rather than tries to follow.
                    this.holeIdx.set(clampIndex(move.toHoleIndex, this.playedOrder().length));
                    this.selectBall(0);
                    // Arriving on the next hole is a fresh visit: normally
                    // unscored (entry mode), but a hole scored ahead of time
                    // flips to correction mode so the advance chain stops there.
                    this.noteHoleEntered();
                }, move.delayMs);
                return;
            }
        }
    }

    /**
     * True when at least one other ball on the current hole is still unscored.
     *
     * Built from the narrow slice the policy actually consumes rather than the
     * full `advanceState()` snapshot: this runs inside a reactive binding (the
     * stats button label), and reading the whole snapshot would subscribe it to
     * `metaInputs`/`holeIndex`/`playedOrder`/`occLabel` as well — signals the
     * label does not depend on.
     */
    private hasMoreUnscored = (): boolean => {
        const ph = this.currentHole();
        return policyHasMoreUnscored({
            balls: this.ballsInGroup().map((b) => ({
                pending: !!b.pending,
                scored: !!ph && this.svc.strokesFor(b.id, ph.playHoleId) !== null,
            })),
            currentBallIndex: this.currentBallIdx.get(),
            // The label is only used for toasts, which this predicate never
            // produces — avoid the `occLabel` read for the same reason.
            currentHole: ph ? { id: ph.playHoleId, label: '' } : null,
        });
    };

    /** Explicit booleans for every applicable toggle (so turning one OFF persists). */
    private metaSnapshot(): Record<string, unknown> | undefined {
        const inputs = this.metaInputs();
        if (inputs.length === 0) return undefined;
        const pending = this.pendingMeta.get();
        const out: Record<string, unknown> = {};
        for (const mi of inputs) out[mi.key] = pending[mi.key] === true;
        return out;
    }

    /** Set an explicit value for one toggle and persist the full snapshot. */
    private setMeta(key: string, value: boolean): void {
        const cur = this.pendingMeta.get();
        this.pendingMeta.set({ ...cur, [key]: value });
        // The score is already in by the time the stats screen shows, so re-send
        // strokes + the full snapshot to persist the choice immediately.
        const ball = this.ballsInGroup()[this.currentBallIdx.get()];
        const ph = this.currentHole();
        if (!ball || !ph) return;
        const strokes = this.svc.strokesFor(ball.id, ph.playHoleId);
        if (strokes !== null) void this.svc.setScore(ball.id, ph.playHoleId, strokes, this.metaSnapshot());
    }

    private metaChip(mi: MetadataInput, track: (d: () => void) => void): HTMLElement {
        return this.wireEl(
            chipTpl,
            {
                glabel: { textContent: mi.label },
                miss: {
                    className: () => (this.pendingMeta.get()[mi.key] ? 'se-seg' : 'se-seg on-miss'),
                    onclick: () => this.setMeta(mi.key, false),
                },
                hit: {
                    className: () => (this.pendingMeta.get()[mi.key] ? 'se-seg on-hit' : 'se-seg'),
                    onclick: () => this.setMeta(mi.key, true),
                },
            },
            track,
        );
    }

    /**
     * The FORMAT's own toggles for this hole, minus any key the stats step is
     * already asking about. One control per question: when a format wants GIR
     * and the player tracks approach, the stats row renders it and the answer is
     * written to BOTH channels (see `answerStat`).
     */
    private metaInputsForStep = (): MetadataInput[] => {
        const asked = new Set<string>(this.svc.statPrompts().map((p) => p.key));
        return this.metaInputs().filter((mi) => !asked.has(mi.key));
    };

    private statBodyRows = (): StatBodyRow[] => {
        const metas = this.metaInputsForStep();
        const prompts = this.svc.statPrompts();
        const rows: StatBodyRow[] = metas.map((input) => ({
            kind: 'meta',
            key: `meta:${input.key}`,
            input,
        }));
        if (metas.length > 0 && prompts.length > 0) rows.push({ kind: 'rule', key: 'rule' });
        for (const prompt of prompts) rows.push({ kind: 'stat', key: `stat:${prompt.key}`, prompt });
        return rows;
    };

    private statBodyRow(row: StatBodyRow, track: (d: () => void) => void): HTMLElement {
        if (row.kind === 'meta') return this.metaChip(row.input, track);
        if (row.kind === 'rule') return this.wireEl(statRuleTpl, {}, track);
        return row.prompt.control.kind === 'segments'
            ? this.statSegments(row.prompt, track)
            : this.statStepper(row.prompt, track);
    }

    private statSegments(prompt: StatPrompt, track: (d: () => void) => void): HTMLElement {
        const control = prompt.control;
        const options = control.kind === 'segments' ? control.options : [];
        // Four or five buckets (first putt) only fit a phone plate narrowed.
        const tight = options.length >= 4 ? ' tight' : '';
        const el = this.wireEl(statSegTpl, { glabel: { textContent: prompt.label } }, track);
        const host = this.ref(el, 'seg');
        for (const option of options) {
            const btn = this.wireEl(
                segBtnTpl,
                {
                    btn: {
                        textContent: option.label,
                        className: () =>
                            `se-seg${tight}${
                                this.svc.statValue(prompt.key) === option.value ? ' on-neutral' : ''
                            }`,
                        // Tapping the selected option de-selects it — the only
                        // way back to "did not answer", which is a different
                        // fact from answering the low option.
                        onclick: () =>
                            this.answerStat(
                                prompt.key,
                                this.svc.statValue(prompt.key) === option.value
                                    ? null
                                    : option.value,
                            ),
                    },
                },
                track,
            );
            host?.appendChild(btn);
        }
        return el;
    }

    private statStepper(prompt: StatPrompt, track: (d: () => void) => void): HTMLElement {
        const control = prompt.control;
        const min = control.kind === 'stepper' ? control.min : 0;
        const max = control.kind === 'stepper' ? control.max : null;
        return this.wireEl(
            statStepTpl,
            {
                glabel: { textContent: prompt.label },
                minus: {
                    onclick: () => this.stepStat(prompt.key, -1),
                    'aria-label': `Fewer ${prompt.label}`,
                },
                plus: {
                    onclick: () => this.stepStat(prompt.key, 1),
                    'aria-label': `More ${prompt.label}`,
                },
                val: {
                    textContent: () =>
                        stepperText(this.svc.statStepperValue(prompt.key, min), max),
                    className: () =>
                        this.svc.statIsAnswered(prompt.key)
                            ? 'se-stats__step-val'
                            : 'se-stats__step-val unanswered',
                    // The dimmed floor vs an answered zero is the distinction
                    // the styling carries visually; say it out loud too.
                    'aria-label': () =>
                        this.svc.statIsAnswered(prompt.key)
                            ? `${prompt.label} ${this.svc.statStepperValue(prompt.key, min)}`
                            : `${prompt.label} not answered`,
                },
            },
            track,
        );
    }

    /** Answer (or, with `null`, un-answer) one stats prompt, then mirror it. */
    private answerStat(key: StatEventKey, value: string | null): void {
        this.svc.answerStat(key, value);
        this.mirrorStatToMeta(key);
    }

    private stepStat(key: StatEventKey, delta: number): void {
        this.svc.stepStat(key, delta);
        this.mirrorStatToMeta(key);
    }

    /**
     * The dual write: when a format declares an input under the same key, the
     * stats answer also drives the format's per-ball metadata, with the format
     * channel keeping its own explicit-boolean semantics. Formats nobody tracks
     * stats for are untouched — those balls still render the plain toggle.
     *
     * Only a DEFINITE answer is mirrored. De-selecting is the stats layer's way
     * back to "did not answer" (proposal §2: an unanswered prompt stores NULL,
     * not false), but the format channel has no third state — writing `false`
     * there would turn "no statement" into a scoring-relevant miss and silently
     * revoke, say, an Umbrella GIR point. Leaving the format's last explicit
     * boolean in place is strictly safer; a real miss is one tap away.
     */
    private mirrorStatToMeta(key: StatEventKey): void {
        if (!this.metaInputs().some((mi) => mi.key === key)) return;
        const value = this.svc.statValue(key);
        if (value === null) return;
        this.setMeta(key, value === '1');
    }

    private flash(msg: string): void {
        this.toastMsg.set(msg);
        if (this.flashTimer) clearTimeout(this.flashTimer);
        this.flashTimer = setTimeout(() => {
            this.flashTimer = null;
            if (this.toastMsg.get() === msg) this.toastMsg.set(null);
        }, 1100);
    }

    // --- Carousel pointer + momentum snap (windowed: transform is just the drag
    // offset; on release we animate to the snapped offset, then recenter the
    // window by changing the hole and resetting the offset to 0). ---

    private snap(steps: number): void {
        this.pendingSteps = steps;
        this.transitioning.set(true);
        this.dragOffset.set(-steps * SLOT);
        if (this.settleTimer) clearTimeout(this.settleTimer);
        this.settleTimer = setTimeout(() => this.finishSettle(), 420);
    }

    private finishSettle(): void {
        if (this.pendingSteps === null) return;
        const steps = this.pendingSteps;
        this.pendingSteps = null;
        if (this.settleTimer) {
            clearTimeout(this.settleTimer);
            this.settleTimer = null;
        }
        // Transition OFF before recentering, so changing the hole (which slides
        // the snapped cell into the current slot) doesn't animate a jump back.
        this.transitioning.set(false);
        if (steps !== 0) {
            this.holeIdx.set(clampIndex(this.holeIndex() + steps, this.playedOrder().length));
        }
        this.dragOffset.set(0);
    }

    private bindCarouselPointer(viewport: HTMLElement, track: HTMLElement): void {
        track.addEventListener('transitionend', (e) => {
            if ((e as TransitionEvent).propertyName === 'transform') this.finishSettle();
        });
        viewport.addEventListener('pointerdown', (e: PointerEvent) => {
            if (this.ptr || this.transitioning.get() || this.playedOrder().length <= 1) return;
            this.ptr = {
                id: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                lastX: e.clientX,
                lastTime: Date.now(),
                velocity: 0,
                horiz: false,
            };
            this.dragOffset.set(0);
            viewport.setPointerCapture?.(e.pointerId);
        });
        viewport.addEventListener('pointermove', (e: PointerEvent) => {
            const p = this.ptr;
            if (!p || p.id !== e.pointerId) return;
            const dx = e.clientX - p.startX;
            const dy = e.clientY - p.startY;
            if (!p.horiz) {
                if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) return;
                if (Math.abs(dx) <= 8) return;
                p.horiz = true;
            }
            const now = Date.now();
            const elapsed = Math.max(1, now - p.lastTime);
            p.velocity = (e.clientX - p.lastX) / elapsed;
            p.lastX = e.clientX;
            p.lastTime = now;
            this.dragOffset.set(dx);
        });
        const end = (e: PointerEvent) => {
            const p = this.ptr;
            if (!p || p.id !== e.pointerId) return;
            const dragDistance = e.clientX - p.startX;
            const wasHoriz = p.horiz;
            this.ptr = null;
            viewport.releasePointerCapture?.(e.pointerId);
            if (!wasHoriz) {
                this.dragOffset.set(0);
                return;
            }
            this.snap(stepsFromDrag({ dragDistance, velocity: p.velocity, itemWidth: SLOT }));
        };
        viewport.addEventListener('pointerup', end);
        viewport.addEventListener('pointercancel', (e: PointerEvent) => {
            if (!this.ptr || this.ptr.id !== e.pointerId) return;
            this.ptr = null;
            viewport.releasePointerCapture?.(e.pointerId);
            this.snap(0);
        });
    }
}
