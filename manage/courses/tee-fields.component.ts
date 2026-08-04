import { Component, Signal, effect, template, type Readable } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import {
    field,
    fieldControl,
    fieldError,
    fieldHint,
    fieldLabel,
    formGrid,
    segmented,
} from '../ui/recipes';
import { TeeLengthsComponent } from './tee-lengths.component';
import {
    COLOUR_HINT,
    COLOUR_SUGGESTIONS,
    GENDERS,
    RATING_FIELDS,
    emptyDraft,
    genderLabel,
    swatchColour,
    type Gender,
    type RatingDraft,
    type TeeDraft,
    type TeeFieldErrors,
} from './tee-form';

/*
 * The tee form — name, colour, ratings per gender, and the per-hole lengths
 * grid — as one component, for the same reason `course-fields.component.ts` is
 * one: it is filled in two places (the create panel and the edit panel) and a
 * tee that can be CREATED with a field the edit form does not offer is the drift
 * this prevents.
 *
 * ── The unrated gender is a CONTROL, not an empty form ──
 *
 * "This tee has no women's rating" is a legitimate, common answer (spec §3.5),
 * so it gets a control that states it rather than being inferred from four
 * blank boxes. Two options with one-word labels is precisely the track
 * segmented control's row in docs/design-guidelines.md §1, and selection reads
 * by elevation (§2) — a raised pill on a sunken track, never a solid fill,
 * because this records a fact and is not the Save button.
 *
 * Choosing "Not rated" HIDES the four figures instead of disabling them: a
 * disabled row of boxes still reads as something you failed to fill in, while
 * the worded line that replaces it ("No women's rating…") says what is true and
 * what follows from it. The typed figures survive in the draft until save, so
 * toggling twice by accident costs nothing.
 *
 * ── Why colour is a text field with suggestions ──
 *
 * `tees.colour` is free text and the catalog already holds both Swedish words
 * ("Gul") and hex values ("#ffd400"). A closed dropdown would refuse half the
 * existing rows on their next save, so the control offers the common answers
 * through a datalist and accepts anything. The SWATCH beside it is decoration
 * that follows the word — never a replacement for it (design-guidelines §4).
 *
 * It owns the DRAFT and nothing else — validation, the submit button, the
 * request and the failure message belong to the surrounding screen. Values are
 * seeded imperatively (`seed()`) rather than bound, because a bound input
 * rewrites itself on every emit and takes the caret with it.
 */

export type TeeFieldsProps = {
    /** Unique per form on the page; prefixes the id that ties label to control. */
    idPrefix: string;
    errors: Readable<TeeFieldErrors>;
    /** Controls go inert while a save is in flight. */
    busy?: Readable<boolean>;
    /** The COURSE's hole count, for the lengths grid. */
    holeCount: Readable<number>;
    /**
     * A server refusal that is ABOUT the ratings — today only ruling R1's
     * "a tee role still assigns this tee for women" (§3.5). It is shown here,
     * next to the tracks that caused it, rather than on the panel's general
     * error line: the message names a gender, and the control that gender
     * belongs to is on this screen.
     */
    ratingsFailure?: Readable<string | null>;
};

/** The half of the draft this component owns directly; lengths are the grid's. */
type IdentityDraft = {
    name: string;
    colour: string;
    ratings: Record<Gender, RatingDraft>;
};

const tpl = template(`
    <div class="mteefields">
        <div class="mteefields__grid">
            <div class="mteefields__field">
                <label bind="nameLabel" class="mteefields__label">Name</label>
                <!-- aria-required, NOT the required attribute: a natively required
                     field blocks the submit event and replaces our worded message
                     with a browser bubble we cannot word or place. -->
                <input bind="name" class="mteefields__control" type="text" autocomplete="off" aria-required="true">
                <p bind="nameError" class="mteefields__error" role="alert"></p>
            </div>

            <div class="mteefields__field">
                <label bind="colourLabel" class="mteefields__label">Colour</label>
                <div class="mteefields__colour">
                    <input bind="colour" class="mteefields__control" type="text" autocomplete="off" list="">
                    <span bind="swatch" class="mteefields__swatch" aria-hidden="true"></span>
                </div>
                <datalist bind="colours"></datalist>
                <p bind="colourHint" class="mteefields__hint"></p>
            </div>
        </div>

        <div bind="ratingsHost" class="mteefields__ratings"></div>
        <p bind="ratingsFailure" class="mteefields__conflict" role="alert"></p>

        <div bind="lengthsHost"></div>
    </div>
`);

export class TeeFieldsComponent extends Component<TeeFieldsProps> {
    static styles = `
        .mteefields {
            display: flex;
            flex-direction: column;
            gap: ${t('manage-stack-gap')};
            min-width: 0;

            & .mteefields__grid {
                ${formGrid()}
            }

            & .mteefields__field {
                ${field()}
            }

            & .mteefields__label {
                ${fieldLabel()}
            }

            & .mteefields__control {
                ${fieldControl()}
            }

            & .mteefields__hint {
                ${fieldHint()}
                margin: 0;
            }

            & .mteefields__error {
                ${fieldError()}
                margin: 0;

                &[hidden] { display: none; }
            }

            & .mteefields__colour {
                display: flex;
                align-items: center;
                gap: ${s('sm')};
                min-width: 0;
            }

            /* Decoration only: the word beside it is what says which colour this
               is (design-guidelines §4), and an unrecognised value simply gets
               no swatch. */
            & .mteefields__swatch {
                flex: none;
                width: 1.5rem;
                height: 1.5rem;
                border-radius: ${t('radius-pill')};
                border: 1px solid ${t('border-strong')};
                background: ${t('surface-sunken')};

                &[hidden] { display: none; }
            }

            /* The server's rating refusal, under the two tracks it is about. */
            & .mteefields__conflict {
                ${fieldError()}
                margin: 0;

                &[hidden] { display: none; }
            }

            & .mteefields__ratings {
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};
            }

            & .mtrating {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                padding: ${s('md')};
                border: 1px solid ${t('manage-table-border')};
                border-radius: ${t('manage-table-radius')};
                background: ${t('manage-table-bg')};
            }

            & .mtrating__head {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${s('sm')};
            }

            & .mtrating__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mtrating__seg {
                ${segmented()}
            }

            & .mtrating__figures {
                ${formGrid()}

                &[hidden] { display: none; }
            }

            /* The worded annotation that stands in for the figures — muted, in
               words, never a symbol (design-guidelines §4). */
            & .mtrating__absent {
                ${fieldHint()}
                margin: 0;

                &[hidden] { display: none; }
            }

            & .mtrating__error {
                ${fieldError()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;

    /**
     * The live identity half of the draft. The screen reads the WHOLE draft
     * through `current()`, which folds the grid's lengths in.
     */
    private parts = new Signal<IdentityDraft>(identityOf(emptyDraft(0)));

    private nameInput: HTMLInputElement | null = null;
    private colourInput: HTMLInputElement | null = null;
    private ratingInputs = new Map<string, HTMLInputElement>();
    private grid: TeeLengthsComponent | null = null;

    render(): DocumentFragment {
        const ids = {
            name: `${this.props.idPrefix}-name`,
            colour: `${this.props.idPrefix}-colour`,
            colours: `${this.props.idPrefix}-colour-options`,
        };
        const busy = (): boolean => this.props.busy?.get() ?? false;

        const frag = this.wire(tpl, {
            nameLabel: { htmlFor: ids.name },
            name: {
                id: ids.name,
                'aria-invalid': () => String(this.props.errors.get().name !== undefined),
                disabled: busy,
                oninput: (e: Event) =>
                    this.patch({ name: (e.target as HTMLInputElement).value }),
            },
            nameError: {
                id: `${ids.name}-error`,
                textContent: () => this.props.errors.get().name ?? '',
                hidden: () => this.props.errors.get().name === undefined,
            },

            colourLabel: { htmlFor: ids.colour },
            colour: {
                id: ids.colour,
                // `list` is set as an ATTRIBUTE below: the DOM property is
                // read-only (it returns the datalist element, not its id).
                'aria-describedby': `${ids.colour}-hint`,
                disabled: busy,
                oninput: (e: Event) =>
                    this.patch({ colour: (e.target as HTMLInputElement).value }),
            },
            colours: { id: ids.colours },
            colourHint: { id: `${ids.colour}-hint`, textContent: `${COLOUR_HINT}. Optional` },

            ratingsFailure: {
                textContent: () => this.props.ratingsFailure?.get() ?? '',
                hidden: () => (this.props.ratingsFailure?.get() ?? null) === null,
            },
        });

        this.nameInput = this.ref(frag, 'name') as HTMLInputElement;
        this.colourInput = this.ref(frag, 'colour') as HTMLInputElement;
        this.colourInput.setAttribute('list', ids.colours);

        const list = this.ref(frag, 'colours');
        for (const suggestion of COLOUR_SUGGESTIONS) {
            const option = document.createElement('option');
            option.value = suggestion;
            list.appendChild(option);
        }

        const swatch = this.ref(frag, 'swatch');
        this.track(effect(() => {
            const resolved = swatchColour(this.parts.get().colour);
            swatch.hidden = resolved === null;
            // Only ever a validated hex or a name off our own map — never the
            // raw stored string (see `swatchColour`).
            swatch.style.backgroundColor = resolved ?? '';
        }));

        const ratingsHost = this.ref(frag, 'ratingsHost');
        for (const gender of GENDERS) {
            ratingsHost.appendChild(this.ratingBlock(gender, busy));
        }

        this.grid = this.spawn(TeeLengthsComponent, this.ref(frag, 'lengthsHost'), {
            idPrefix: this.props.idPrefix,
            errors: this.props.errors,
            busy: { get: busy },
            holeCount: this.props.holeCount,
        });

        return frag;
    }

    /**
     * One gender's rating: the rated/not-rated track, the four figures, and the
     * worded line that replaces them when the tee is not rated for this gender.
     */
    private ratingBlock(gender: Gender, busy: () => boolean): HTMLElement {
        const block = document.createElement('section');
        block.className = 'mtrating';

        const head = document.createElement('div');
        head.className = 'mtrating__head';

        const title = document.createElement('h4');
        title.className = 'mtrating__title';
        title.id = `${this.props.idPrefix}-${gender}-title`;
        title.textContent = `${genderLabel(gender)}’s rating`;
        head.appendChild(title);

        // role=group + aria-pressed rather than a radiogroup: each option is an
        // ordinary button in the tab order, which is what a two-way track
        // behaves like everywhere else in this app.
        const track = document.createElement('div');
        track.className = 'mtrating__seg';
        track.setAttribute('role', 'group');
        track.setAttribute('aria-labelledby', title.id);

        const options: { label: string; rated: boolean }[] = [
            { label: 'Rated', rated: true },
            { label: 'Not rated', rated: false },
        ];
        const buttons = options.map((option) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = option.label;
            button.addEventListener('click', () => this.setRated(gender, option.rated));
            track.appendChild(button);
            return button;
        });
        head.appendChild(track);
        block.appendChild(head);

        const figures = document.createElement('div');
        figures.className = 'mtrating__figures';
        for (const spec of RATING_FIELDS) {
            const wrap = document.createElement('div');
            wrap.className = 'mteefields__field';

            const id = `${this.props.idPrefix}-${gender}-${spec.key}`;
            const label = document.createElement('label');
            label.className = 'mteefields__label';
            label.htmlFor = id;
            label.textContent = spec.label;
            wrap.appendChild(label);

            // Text, not `type="number"` — same reasoning as the lengths grid:
            // a number input reports "" for what it dislikes, so a typo would be
            // indistinguishable from a field the user left alone.
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'mteefields__control';
            input.id = id;
            input.autocomplete = 'off';
            input.inputMode = spec.whole ? 'numeric' : 'decimal';
            input.addEventListener('input', () =>
                this.patchRating(gender, { [spec.key]: input.value } as Partial<RatingDraft>),
            );
            this.ratingInputs.set(`${gender}:${spec.key}`, input);
            wrap.appendChild(input);
            figures.appendChild(wrap);
        }
        block.appendChild(figures);

        const absent = document.createElement('p');
        absent.className = 'mtrating__absent';
        // What is true AND what follows from it.
        //
        // This copy used to warn that saving DELETES any tee role assigning
        // this tee to this gender — which was accurate while migration 059's
        // trigger was the user-facing mechanism. Ruling R1 moved that decision
        // out of the trigger's hands: `TeeService.update` now REFUSES the save
        // while such an assignment exists, so nothing is destroyed behind the
        // press. The line says that instead, because a warning about a deletion
        // that can no longer happen teaches the wrong model of the catalog.
        const who = genderLabel(gender).toLowerCase();
        absent.textContent =
            `No ${who}’s rating. The tee is not offered for ${who}, and rounds cannot use it `
            + `for a ${gender === 'M' ? 'man' : 'woman'}’s handicap. If a tee role on this `
            + `course still assigns this tee to ${who}, saving is refused until you clear that `
            + `assignment under Tee roles.`;
        block.appendChild(absent);

        const error = document.createElement('p');
        error.className = 'mtrating__error';
        error.setAttribute('role', 'alert');
        block.appendChild(error);

        this.track(effect(() => {
            const rated = this.parts.get().ratings[gender].rated;
            const inert = busy();
            buttons.forEach((button, index) => {
                button.setAttribute('aria-pressed', String(options[index]!.rated === rated));
                button.disabled = inert;
            });
            figures.hidden = !rated;
            absent.hidden = rated;
            for (const spec of RATING_FIELDS) {
                const input = this.ratingInputs.get(`${gender}:${spec.key}`);
                if (input) input.disabled = inert;
            }
        }));

        this.track(effect(() => {
            const message = this.props.errors.get().ratings?.[gender];
            error.textContent = message ?? '';
            error.hidden = message === undefined;
            for (const spec of RATING_FIELDS) {
                const input = this.ratingInputs.get(`${gender}:${spec.key}`);
                if (input) input.setAttribute('aria-invalid', String(message !== undefined));
            }
        }));

        return block;
    }

    /**
     * The whole draft — identity, ratings and the grid's lengths folded
     * together, which is the shape `UpdateTeeInput` takes and the shape the
     * screen validates and sends.
     */
    current(): TeeDraft {
        const parts = this.parts.peek();
        return {
            name: parts.name,
            colour: parts.colour,
            ratings: { M: { ...parts.ratings.M }, F: { ...parts.ratings.F } },
            lengths: (this.grid?.lengths.peek() ?? []).map((row) => ({ ...row })),
        };
    }

    /**
     * Put a draft into the controls — a blank one when the create panel opens,
     * the tee's own values when an edit begins. The only writer of the input
     * elements, which is what keeps the caret where the user left it.
     */
    seed(draft: TeeDraft): void {
        this.parts.set(identityOf(draft));
        if (this.nameInput) this.nameInput.value = draft.name;
        if (this.colourInput) this.colourInput.value = draft.colour;
        for (const gender of GENDERS) {
            for (const spec of RATING_FIELDS) {
                const input = this.ratingInputs.get(`${gender}:${spec.key}`);
                if (input) input.value = draft.ratings[gender][spec.key];
            }
        }
        this.grid?.seed(draft.lengths);
    }

    /** Move focus to the first field — the screen calls it after revealing. */
    focusFirst(): void {
        this.nameInput?.focus();
    }

    /**
     * Put the caret in the first thing the validator complained about, in
     * reading order: name, then the ratings, then the grid. A refused submit
     * otherwise leaves focus on the button with the message somewhere above it.
     */
    focusInvalid(errors: TeeFieldErrors): boolean {
        if (errors.name !== undefined && this.nameInput) {
            this.nameInput.focus();
            return true;
        }
        for (const gender of GENDERS) {
            if (errors.ratings?.[gender] === undefined) continue;
            const first = RATING_FIELDS.map((spec) =>
                this.ratingInputs.get(`${gender}:${spec.key}`),
            ).find((input): input is HTMLInputElement => input !== undefined);
            if (first) {
                first.focus();
                first.select();
                return true;
            }
        }
        return this.grid?.focusInvalid(errors) ?? false;
    }

    private patch(part: Partial<IdentityDraft>): void {
        this.parts.update((parts) => ({ ...parts, ...part }));
    }

    /**
     * Flip a gender between rated and not. The typed figures are KEPT — only a
     * save makes the absence real, so an accidental double-tap costs nothing.
     */
    private setRated(gender: Gender, rated: boolean): void {
        this.parts.update((parts) => ({
            ...parts,
            ratings: { ...parts.ratings, [gender]: { ...parts.ratings[gender], rated } },
        }));
    }

    private patchRating(gender: Gender, part: Partial<RatingDraft>): void {
        this.parts.update((parts) => ({
            ...parts,
            ratings: { ...parts.ratings, [gender]: { ...parts.ratings[gender], ...part } },
        }));
    }
}

function identityOf(draft: TeeDraft): IdentityDraft {
    return {
        name: draft.name,
        colour: draft.colour,
        ratings: { M: { ...draft.ratings.M }, F: { ...draft.ratings.F } },
    };
}
