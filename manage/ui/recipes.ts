import { t } from '../theme';
import { s, input, label, errorText } from '../css';
import { TABLE_MEDIA_WIDE } from '../breakpoint';

/*
 * Manage's own CSS recipes: the shapes that repeat across management screens
 * and that the framework has no opinion about (spec §2.5 — forms, editing
 * grids).
 *
 * They are recipes rather than components for the same reason `btn()` is: what
 * repeats here is the SHAPE, while the markup differs per screen — a club form
 * and a tee-rating form share a field's geometry and share nothing else. A
 * component would have to swallow arbitrary controls through slots to give back
 * the same six declarations.
 *
 * ADR-005 ordering applies at every CALL SITE of these, exactly as it does for
 * the framework recipes: the interpolation comes FIRST in a block, screen
 * overrides after. Inside this file the same rule holds against the framework
 * recipes these compose from.
 */

/**
 * A form's outer grid: ONE column by default, pairing up only above the table
 * breakpoint (spec §2.5, "mobile needs no special casing").
 *
 * The breakpoint is the TABLE one, not the shell one, because this asks the
 * same question a table asks — is the CONTENT COLUMN wide enough — and the
 * content column is not the viewport (see `breakpoint.ts`). Two fields want
 * ~540px between them, and 604px is the floor above `TABLE_WIDE_MIN`.
 *
 * A field that must not pair — a URL, a long name, anything with a wide
 * control — carries `.mform__field--full` and spans the row.
 */
export const formGrid = (): string => `
    display: grid;
    grid-template-columns: 1fr;
    gap: ${t('manage-stack-gap')} ${s('lg')};
    align-items: start;

    & .mform__field--full {
        grid-column: 1 / -1;
    }

    @media ${TABLE_MEDIA_WIDE} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
`;

/**
 * One field row: label above, control, then hint or error below. Always in that
 * order and always visible — the framework's `label()` note is explicit that
 * floating labels and placeholder-as-label are rejected, and an error that
 * displaces the control makes the form jump as you type.
 */
export const field = (): string => `
    display: flex;
    flex-direction: column;
    gap: ${s('xs')};
    min-width: 0;
`;

/** The label above a control. */
export const fieldLabel = (): string => `
    ${label()}
`;

/**
 * The control itself. The framework field recipe supplies the skin; the two
 * additions are the ones a management form needs and a player form does not:
 * full width of its grid cell, and a floor of `--manage-touch-target`, because
 * density in Manage comes from spacing and never from smaller hit areas.
 */
export const fieldControl = (): string => `
    ${input()}
    width: 100%;
    min-height: ${t('manage-touch-target')};
`;

/**
 * The muted line under a control that explains the selected option or the
 * expected format (docs/design-guidelines.md §3 — explanation goes underneath,
 * never inside the label).
 */
export const fieldHint = (): string => `
    color: ${t('text-muted')};
    font-size: 0.8rem;
    line-height: 1.4;
`;

/** Validation text. Says what is wrong and what to do — never just "invalid". */
export const fieldError = (): string => `
    ${errorText()}
`;

/**
 * A TRACK SEGMENTED CONTROL: the control a bounded two-way choice gets
 * (docs/design-guidelines.md §1 — "2 options, short labels"), and the shape a
 * course's 9-or-18 hole count is picked with.
 *
 * The anatomy is the player app's, deliberately identical to `.pfield__seg` in
 * `src/profile/profile.component.ts` and `.fslot__seg` in the create flow: one
 * SUNKEN track with a hairline border and a pill radius, transparent muted
 * options inside it, and the live option raised — `surface` fill, hairline
 * border, `text` colour, heavier weight. Selection reads by ELEVATION, never by
 * saturation: a solid fill is the primary action's treatment, and a knob that
 * records a preference must not look like the Save button next to it
 * (design-guidelines §2).
 *
 * Deliberately NOT built on `btn()` — that recipe emits the full-bleed slab
 * sizing this replaces. The track sizes to its labels, so a field whose options
 * are all short puts the label and the track on one row.
 *
 * The Manage addition is the touch floor: options are still 44px tall, because
 * density here comes from spacing and never from smaller hit areas (spec §2.5).
 */
export const segmented = (): string => `
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    border: 1px solid ${t('border')};
    border-radius: ${t('radius-pill')};
    background: ${t('surface-sunken')};
    align-self: flex-start;

    & button {
        appearance: none;
        border: 1px solid transparent;
        background: none;
        min-height: ${t('manage-touch-target')};
        padding: 0 ${s('lg')};
        border-radius: ${t('radius-pill')};
        font-family: inherit;
        font-size: 0.9rem;
        font-weight: 500;
        color: ${t('text-muted')};
        cursor: pointer;
        white-space: nowrap;

        &:hover { color: ${t('text')}; }
        &:focus-visible { outline: 2px solid ${t('accent-strong')}; outline-offset: 2px; }

        /* The live option. \`aria-pressed\` is the state an assistive
           technology reads; this class is the same fact for the eye. */
        &[aria-pressed='true'] {
            background: ${t('surface')};
            border-color: ${t('border')};
            color: ${t('text')};
            font-weight: 700;
        }

        &:disabled { opacity: 0.5; cursor: default; }
    }
`;

/**
 * The editing-grid container (spec §2.5): a wide grid — 18 holes across, tee
 * lengths per hole — scrolls INSIDE ITS OWN BOX, so the page body never scrolls
 * sideways and the shell chrome never moves.
 *
 * `overflow-x: auto` is the whole mechanism; the rest is making the box read as
 * a surface rather than as a clipped accident. Note that `overflow-x: auto`
 * computes `overflow-y` to `auto` as well, which is what clips the corners
 * against the radius.
 *
 * The content inside must be allowed to exceed the box — a grid with
 * `min-width: max-content` or fixed column widths. A child at `width: 100%`
 * shrinks to fit and nothing ever scrolls.
 */
export const scrollBox = (): string => `
    overflow-x: auto;
    background: ${t('manage-table-bg')};
    border: 1px solid ${t('manage-table-border')};
    border-radius: ${t('manage-table-radius')};
    /* Momentum scrolling on touch, and a scrollbar that does not eat a row. */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
`;
