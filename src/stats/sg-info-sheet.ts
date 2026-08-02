// The "How this works" sheet, shared by every surface that draws the five
// strokes-lost rows: the dashboard's practice priorities, the per-round view and
// the round story.
//
// It exists as markup + styles rather than as a component because all three
// hosts already own a root template and a `static styles` string, and a spawned
// child would need its own service wiring for a sheet whose whole content is one
// pure function of the model (`sgInfoCards`). What is shared here is the
// ANATOMY; each host keeps its own open/closed signal, because each has its own
// trigger.
//
// The anatomy is copied from the handicap-derivation dialog in
// `src/round/score-entry.component.ts` (`.se-hcp`): dimmed backdrop, bottom
// sheet, one card per idea. The two answer the same kind of question — "where
// did this number come from?" — and a reader who has met one should recognise
// the other.
//
// Twin of `ios/TapScore/Features/Stats/StrokesGainedInfoSheet.swift`.

import { template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn } from '../css';

/**
 * The sheet itself, for interpolation into a host template.
 *
 * Binds: `infoSheet` (the backdrop — className gates it, a press on it closes),
 * `infoTitle`, `infoDone`, `infoCards` (the `$each` host).
 */
export const SG_INFO_SHEET_MARKUP = `
        <div bind="infoSheet" class="stats-info hidden">
            <div class="stats-info__panel">
                <div class="stats-info__head">
                    <span bind="infoTitle" class="stats-info__title"></span>
                    <button bind="infoDone" class="stats-info__done" type="button">Done</button>
                </div>
                <div bind="infoCards" class="stats-info__cards"></div>
            </div>
        </div>`;

/**
 * One card: a short title and one paragraph. No trailing number — unlike the
 * handicap dialog's step card, these explain coverage rather than carry an
 * arithmetic result.
 */
export const sgInfoCardTpl = template(`
    <div class="stats-info__card">
        <span bind="ctitle" class="stats-info__card-title"></span>
        <span bind="ctext" class="stats-info__card-text"></span>
    </div>
`);

/** The trigger: WORDS, never a glyph (`docs/design-guidelines.md` §4). */
export const SG_INFO_TRIGGER_MARKUP =
    '<button bind="infoTrigger" class="stats__info" type="button"></button>';

/** Styles for the trigger and the sheet. Appended to a host's `static styles`. */
export const SG_INFO_STYLES = `
        /* A ghost link, quiet enough that it never competes with the section
           title it sits beside. */
        .stats__info {
            ${btn()}
            flex: none;
            padding: 0;
            font-family: inherit; font-size: 0.78rem; font-weight: 600;
            background: transparent; border: none;
            color: ${t('text-muted')};
            text-decoration: underline;
            cursor: pointer;
        }
        /* Heading and its explainer trigger share one row: the trigger is an
           aside to the heading, not a control of its own rank.
           The h2 margin reset here is the FLOOR, at specificity (0,1,1). A host
           that styles its headings through a nested section rule — the dashboard
           and the per-round view both do — outranks it and must repeat the reset
           inside its own nesting; grep ".stats__sechead h2" to find them. */
        .stats__sechead {
            display: flex; align-items: baseline; justify-content: space-between;
            gap: ${s('md')};
            & h2 { margin-bottom: 0; }
        }
        .stats-info {
            position: fixed; inset: 0; z-index: 55;
            display: flex; align-items: flex-end; justify-content: center;
            background: rgba(0, 0, 0, 0.45);
            &.hidden { display: none; }
        }
        .stats-info__panel {
            width: 100%; max-width: 480px; max-height: 82dvh;
            overflow-y: auto;
            background: ${t('surface')};
            border-radius: ${t('radius')} ${t('radius')} 0 0;
            padding: ${s('md')} ${s('lg')} ${s('xl')};
            display: flex; flex-direction: column; gap: ${s('sm')};
        }
        .stats-info__head {
            display: flex; align-items: center; justify-content: space-between;
            gap: ${s('md')};
            & .stats-info__title {
                font-family: ${t('font-display')}; font-weight: 700; font-size: 1.15rem;
                color: ${t('text')};
            }
            & .stats-info__done {
                ${btn()}
                flex: none;
                padding: ${s('xs')} ${s('md')};
                font-family: inherit; font-size: 0.85rem; font-weight: 700;
                background: transparent; border: none;
                color: ${t('text-muted')};
                cursor: pointer;
            }
        }
        .stats-info__cards { display: flex; flex-direction: column; gap: ${s('sm')}; }
        .stats-info__card {
            display: flex; flex-direction: column; gap: 3px;
            border: 1px solid ${t('border')}; border-radius: ${t('radius')};
            padding: ${s('md')};
            & .stats-info__card-title {
                font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${t('text-muted')};
            }
            & .stats-info__card-text { font-size: 0.9rem; color: ${t('text')}; line-height: 1.45; }
        }
`;
