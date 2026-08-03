import { Component, Signal, effect, template, type Readable } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import { fieldControl, fieldHint, scrollBox } from '../ui/recipes';
import { metres, type LengthDraft, type TeeFieldErrors } from './tee-form';

/*
 * The per-hole lengths grid (spec §3.5, same interaction pattern as §3.4).
 *
 * ── Why holes go ACROSS and not down ──
 *
 * Eighteen holes as eighteen rows is a form you scroll past; eighteen holes as
 * eighteen columns is a SCORECARD, which is the object every golfer and every
 * course admin already reads sideways. Two rows — length and stroke-index
 * override — put both figures for a hole under one another where they are
 * compared, and the whole tee is legible in one glance.
 *
 * That shape is exactly what `scrollBox()` exists for (spec §2.5): the grid is
 * wider than any content column at 18 holes, so it scrolls INSIDE ITS OWN BOX
 * and the page body never scrolls sideways. The row labels are sticky at the
 * left edge, because a grid you have scrolled three holes into stops saying
 * which row is which otherwise.
 *
 * ── Why the inputs are text and not `type="number"` ──
 *
 * A `type="number"` input reports the empty string for anything it considers
 * invalid, so "34x" and "" are indistinguishable to the reader — which would
 * turn a typo into a SILENTLY ERASED hole, given that a blank length means
 * "drop this hole from the payload" (`tee-form.ts`). Text plus `inputmode`
 * keeps the numeric keypad on a phone while leaving the characters, and the
 * worded validation message, ours.
 *
 * ── Why a blank cell is a real answer ──
 *
 * Not every tee is measured for every hole, and a hole left blank is dropped
 * from `holeLengths` rather than sent as zero — a zero-length hole is a broken
 * hole, an unmeasured one is just unmeasured. Same rule as the unrated gender
 * one level up.
 */

export type TeeLengthsProps = {
    /** Unique per form on the page; prefixes the ids that tie labels to cells. */
    idPrefix: string;
    errors: Readable<TeeFieldErrors>;
    /** Controls go inert while a save is in flight. */
    busy?: Readable<boolean>;
    /**
     * The COURSE's hole count — not the tee's. A tee measured for nine holes on
     * an eighteen-hole course needs to show the nine empty columns that say so.
     */
    holeCount: Readable<number>;
};

const tpl = template(`
    <div class="mtlen">
        <div class="mtlen__head">
            <span bind="label" class="mtlen__title">Hole lengths</span>
            <p bind="hint" class="mtlen__hint"></p>
        </div>
        <div bind="box" class="mtlen__box"></div>
        <p bind="summary" class="mtlen__summary" role="status" aria-live="polite"></p>
        <p bind="error" class="mtlen__error" role="alert"></p>
    </div>
`);

export class TeeLengthsComponent extends Component<TeeLengthsProps> {
    static styles = `
        .mtlen {
            display: flex;
            flex-direction: column;
            gap: ${s('xs')};
            min-width: 0;

            & .mtlen__head {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            & .mtlen__title {
                font-family: ${t('font-ui')};
                font-size: 0.8rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: ${t('text-muted')};
            }

            & .mtlen__hint {
                ${fieldHint()}
                margin: 0;
            }

            & .mtlen__box {
                ${scrollBox()}
            }

            /* max-content, never 100%: a grid that shrinks to its box never
               scrolls, and the whole point of the box is that this one does. */
            & .mtlen__grid {
                border-collapse: collapse;
                min-width: max-content;
                font-family: ${t('font-ui')};
                font-size: 0.85rem;
                color: ${t('text')};
            }

            & .mtlen__cell {
                padding: ${s('xs')};
                border-bottom: 1px solid ${t('manage-table-row-border')};
                text-align: center;
                vertical-align: middle;
            }

            & .mtlen__grid tr:last-child .mtlen__cell { border-bottom: none; }

            & .mtlen__hole {
                font-variant-numeric: tabular-nums;
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.06em;
                color: ${t('manage-table-header-fg')};
                background: ${t('manage-table-header-bg')};
                border-bottom: 1px solid ${t('manage-table-header-border')};
                padding: ${s('xs')} ${s('sm')};
                min-width: 4.5rem;
            }

            /* Sticky so a grid scrolled to hole 14 still says which row is the
               length and which is the override. Above the cells it slides over,
               and opaque — a translucent label over a passing input is unreadable. */
            & .mtlen__rowhead {
                position: sticky;
                left: 0;
                z-index: 1;
                background: ${t('manage-table-header-bg')};
                color: ${t('manage-table-header-fg')};
                border-right: 1px solid ${t('manage-table-header-border')};
                text-align: left;
                white-space: nowrap;
                font-size: 0.75rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                padding: ${s('xs')} ${s('sm')};
            }

            & .mtlen__corner {
                border-bottom: 1px solid ${t('manage-table-header-border')};
            }

            & .mtlen__input {
                ${fieldControl()}
                width: 4.25rem;
                padding: 0 ${s('xs')};
                text-align: center;
                font-variant-numeric: tabular-nums;
            }

            /* The cell the message names. Colour is the SECOND signal — the
               worded error under the grid is the first (design-guidelines §4). */
            & .mtlen__input[aria-invalid='true'] {
                border-color: ${t('danger')};
            }

            & .mtlen__summary {
                ${fieldHint()}
                margin: 0;
                font-variant-numeric: tabular-nums;
            }

            & .mtlen__error {
                margin: 0;
                color: ${t('danger')};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }
        }
    `;

    /**
     * The live lengths. The parent form reads it on submit; the INPUTS are
     * written only by `seed()` and by the user, never by an effect — an effect
     * that wrote `input.value` would take the caret with it on every keystroke.
     */
    readonly lengths = new Signal<LengthDraft[]>([]);

    private box: HTMLElement | null = null;
    /** Every live input, so `seed` and the error marking can find them. */
    private lengthInputs = new Map<number, HTMLInputElement>();
    private siInputs = new Map<number, HTMLInputElement>();

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            label: { id: `${this.props.idPrefix}-lengths-label` },
            hint: {
                textContent:
                    'Metres per hole. Leave a hole blank if this tee is not measured for it. '
                    + 'A stroke-index override replaces the course’s own index for this tee only — '
                    + 'leave it blank to use the course’s.',
            },
            summary: { textContent: () => this.summary() },
            error: {
                textContent: () => this.props.errors.get().lengths ?? '',
                hidden: () => this.props.errors.get().lengths === undefined,
            },
        });

        this.box = this.ref(frag, 'box');

        // The grid is REBUILT when the course's hole count changes — which on a
        // cold deep link is once, from 0 to 18, after the course load lands.
        // Rebuilding re-applies whatever is in `lengths`, so a draft seeded
        // before the count arrived is not lost.
        this.track(effect(() => {
            const holeCount = this.props.holeCount.get();
            this.build(holeCount);
        }));

        // Marking is a separate effect from building: it runs on every change of
        // the error set, and it only ever touches attributes, never `value`.
        this.track(effect(() => {
            const bad = new Set(this.props.errors.get().badHoles ?? []);
            for (const [hole, input] of this.lengthInputs) {
                input.setAttribute('aria-invalid', String(bad.has(hole)));
            }
            for (const [hole, input] of this.siInputs) {
                input.setAttribute('aria-invalid', String(bad.has(hole)));
            }
        }));

        this.track(effect(() => {
            const inert = this.props.busy?.get() ?? false;
            for (const input of this.lengthInputs.values()) input.disabled = inert;
            for (const input of this.siInputs.values()) input.disabled = inert;
        }));

        return frag;
    }

    /**
     * Put a draft's lengths into the grid. The only writer of the inputs
     * besides the user, which is what keeps the caret where it was left.
     *
     * Rows for holes the grid does not currently show are still KEPT in the
     * signal: on a cold deep link the seed arrives before the hole count does,
     * and dropping them here would empty the form the moment it was built.
     */
    seed(lengths: LengthDraft[]): void {
        this.lengths.set(lengths.map((row) => ({ ...row })));
        this.apply();
    }

    /** Move focus to the first hole's length — the form calls it on request. */
    focusFirst(): boolean {
        const first = this.lengthInputs.get(1) ?? [...this.lengthInputs.values()][0];
        if (!first) return false;
        first.focus();
        first.select();
        return true;
    }

    /** Put the caret in the first cell the validator complained about. */
    focusInvalid(errors: TeeFieldErrors): boolean {
        const hole = errors.badHoles?.[0];
        if (hole === undefined) return false;
        const input = this.lengthInputs.get(hole) ?? this.siInputs.get(hole);
        if (!input) return false;
        input.focus();
        input.select();
        return true;
    }

    /** Build the grid for `holeCount` holes and re-apply the current draft. */
    private build(holeCount: number): void {
        const box = this.box;
        if (!box) return;

        box.textContent = '';
        this.lengthInputs.clear();
        this.siInputs.clear();
        if (holeCount <= 0) return;

        const holes = Array.from({ length: holeCount }, (_, index) => index + 1);

        const grid = document.createElement('table');
        grid.className = 'mtlen__grid';
        grid.setAttribute('aria-labelledby', `${this.props.idPrefix}-lengths-label`);

        const head = document.createElement('thead');
        const headRow = document.createElement('tr');
        headRow.appendChild(cell('th', 'mtlen__hole mtlen__rowhead mtlen__corner', 'Hole'));
        for (const hole of holes) {
            const th = cell('th', 'mtlen__hole', String(hole));
            th.setAttribute('scope', 'col');
            th.id = this.holeHeaderId(hole);
            headRow.appendChild(th);
        }
        head.appendChild(headRow);
        grid.appendChild(head);

        const body = document.createElement('tbody');
        body.appendChild(
            this.inputRow('Length (m)', holes, 'decimal', this.lengthInputs, (hole, value) =>
                this.patch(hole, { lengthM: value }),
            ),
        );
        body.appendChild(
            this.inputRow('SI override', holes, 'numeric', this.siInputs, (hole, value) =>
                this.patch(hole, { strokeIndexOverride: value }),
            ),
        );
        grid.appendChild(body);

        box.appendChild(grid);
        this.apply();
    }

    private inputRow(
        label: string,
        holes: number[],
        mode: 'decimal' | 'numeric',
        registry: Map<number, HTMLInputElement>,
        onchange: (hole: number, value: string) => void,
    ): HTMLElement {
        const row = document.createElement('tr');
        const head = cell('th', 'mtlen__cell mtlen__rowhead', label);
        head.setAttribute('scope', 'row');
        row.appendChild(head);

        for (const hole of holes) {
            const td = document.createElement('td');
            td.className = 'mtlen__cell';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'mtlen__input';
            input.inputMode = mode;
            input.autocomplete = 'off';
            // Named by the hole number above it and the row label beside it —
            // the two together are the whole label ("Length (m), 7").
            input.setAttribute('aria-label', `${label}, hole ${hole}`);
            input.addEventListener('input', () => onchange(hole, input.value));

            registry.set(hole, input);
            td.appendChild(input);
            row.appendChild(td);
        }
        return row;
    }

    /** Write the current draft into whatever inputs exist right now. */
    private apply(): void {
        const rows = new Map(this.lengths.peek().map((row) => [row.holeNumber, row]));
        for (const [hole, input] of this.lengthInputs) {
            input.value = rows.get(hole)?.lengthM ?? '';
        }
        for (const [hole, input] of this.siInputs) {
            input.value = rows.get(hole)?.strokeIndexOverride ?? '';
        }
    }

    private patch(holeNumber: number, part: Partial<LengthDraft>): void {
        this.lengths.update((rows) => {
            const index = rows.findIndex((row) => row.holeNumber === holeNumber);
            if (index === -1) {
                return [
                    ...rows,
                    { holeNumber, lengthM: '', strokeIndexOverride: '', ...part },
                ].sort((a, b) => a.holeNumber - b.holeNumber);
            }
            const next = [...rows];
            next[index] = { ...next[index]!, ...part };
            return next;
        });
    }

    private holeHeaderId(hole: number): string {
        return `${this.props.idPrefix}-hole-${hole}`;
    }

    /**
     * The measured totals, live under the grid — out, in and total, the three
     * figures a scorecard prints. Only what actually parses is counted, and the
     * count of measured holes rides along so a total built from eleven of
     * eighteen holes cannot read as a finished tee.
     */
    private summary(): string {
        const rows = this.lengths.get();
        const holeCount = this.props.holeCount.get();
        if (holeCount <= 0) return '';

        const measured = rows.filter((row) => value(row.lengthM) !== null);
        if (measured.length === 0) return 'No holes measured yet.';

        const sum = (from: number, to: number): number =>
            measured
                .filter((row) => row.holeNumber >= from && row.holeNumber <= to)
                .reduce((total, row) => total + (value(row.lengthM) ?? 0), 0);

        const total = sum(1, holeCount);
        const parts: string[] = [];
        if (holeCount > 9) {
            parts.push(`Out ${metres(sum(1, 9))}`, `In ${metres(sum(10, holeCount))}`);
        }
        parts.push(`Total ${metres(total)}`);
        parts.push(
            measured.length === holeCount
                ? `all ${holeCount} holes measured`
                : `${measured.length} of ${holeCount} holes measured`,
        );
        return parts.join(' · ');
    }
}

function cell(tag: 'th' | 'td', className: string, text: string): HTMLElement {
    const el = document.createElement(tag);
    el.className = className;
    el.textContent = text;
    return el;
}

/** The same acceptance `tee-form.ts` uses, for the live summary only. */
function value(text: string): number | null {
    const trimmed = text.trim();
    if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
