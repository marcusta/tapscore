import { Component, Signal, effect, template, type Readable } from '@basics/core/client/core';
import {
    field,
    fieldControl,
    fieldError,
    fieldHint,
    fieldLabel,
    formGrid,
    segmented,
} from '../ui/recipes';
import {
    COORDINATE_HINT,
    HOLE_COUNTS,
    emptyDraft,
    type CourseDraft,
    type CourseFieldErrors,
} from './course-form';

/*
 * The course fields — name, hole count, coordinates — as one component, for the
 * same reason `club-fields.component.ts` is one: they are typed in two places
 * (the create panel and the edit panel on the club page) and a course that can
 * be CREATED with a field the edit form does not offer is the drift this
 * prevents.
 *
 * ── Why Coordinates is on the create form too ──
 *
 * Spec §3.3 lists create as "name + hole count", and §3.3a puts Coordinates on
 * "the course form" without splitting it. One shared component is the point of
 * this file, and `CreateCourseInput` accepts the pair, so offering it only on
 * edit would mean two field sets, a second seed path and a course you have to
 * save twice to finish. It is optional in both, and a blank field creates
 * exactly the course §3.3 describes.
 *
 * ── Why the hole count is a segmented track and not a number box ──
 *
 * The API type is the literal union `9 | 18`, so the choice is bounded at two
 * with one-word labels — the exact row of the control table in
 * docs/design-guidelines.md §1. A free numeric entry would offer 12 and let the
 * server refuse it, which is a worse form of the same answer. Selection reads
 * by elevation (§2): a raised pill on a sunken track, never a solid fill.
 *
 * It owns the DRAFT and nothing else — validation, the submit button, the
 * request and the failure message belong to the surrounding screen. Values are
 * seeded imperatively (`seed()`) rather than bound, because a bound input
 * rewrites itself on every emit and takes the caret with it.
 */

export type CourseFieldsProps = {
    /** Unique per form on the page; prefixes the id that ties label to control. */
    idPrefix: string;
    errors: Readable<CourseFieldErrors>;
    /** Controls go inert while a save is in flight. */
    busy?: Readable<boolean>;
    /**
     * True when the form edits a course that already exists. Shows the
     * hole-count warning, which is meaningless on the create panel — a new
     * course gets its holes from the service defaults.
     */
    existing?: Readable<boolean>;
};

const tpl = template(`
    <div class="mcoursefields">
        <div class="mcoursefields__field">
            <label bind="nameLabel" class="mcoursefields__label">Name</label>
            <!-- aria-required, NOT the required attribute: a natively required
                 field blocks the submit event and replaces our worded message
                 with a browser bubble we cannot word or place. -->
            <input bind="name" class="mcoursefields__control" type="text" autocomplete="off" aria-required="true">
            <p bind="nameError" class="mcoursefields__error" role="alert"></p>
        </div>

        <div class="mcoursefields__field">
            <span bind="holesLabel" class="mcoursefields__label">Holes</span>
            <!-- role=group + aria-pressed rather than a radiogroup: each option
                 is an ordinary button in the tab order, which is what a two-way
                 track behaves like everywhere else in this app. -->
            <div bind="holes" class="mcoursefields__seg" role="group"></div>
            <!-- The truth, not a promise: the server changes only the stored
                 count (CourseService.update touches course_holes solely when a
                 holes payload rides along), so hole data has to be finished in
                 the holes editor and readiness flags the mismatch until then. -->
            <p bind="holesHint" class="mcoursefields__hint"></p>
        </div>

        <div class="mcoursefields__field mform__field--full">
            <label bind="coordsLabel" class="mcoursefields__label">Coordinates</label>
            <input bind="coordinates" class="mcoursefields__control" type="text" autocomplete="off" inputmode="text">
            <p bind="coordsHint" class="mcoursefields__hint"></p>
            <p bind="coordsError" class="mcoursefields__error" role="alert"></p>
        </div>
    </div>
`);

export class CourseFieldsComponent extends Component<CourseFieldsProps> {
    static styles = `
        .mcoursefields {
            ${formGrid()}

            & .mcoursefields__field {
                ${field()}
            }

            & .mcoursefields__label {
                ${fieldLabel()}
            }

            & .mcoursefields__control {
                ${fieldControl()}
            }

            & .mcoursefields__seg {
                ${segmented()}
            }

            & .mcoursefields__hint {
                ${fieldHint()}
                margin: 0;
            }

            & .mcoursefields__error {
                ${fieldError()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;

    /** The live draft. The screen reads it on submit; nothing else writes it. */
    readonly draft = new Signal<CourseDraft>(emptyDraft());

    private nameInput: HTMLInputElement | null = null;
    private coordsInput: HTMLInputElement | null = null;
    private holeButtons: HTMLButtonElement[] = [];

    render(): DocumentFragment {
        const ids = {
            name: `${this.props.idPrefix}-name`,
            holes: `${this.props.idPrefix}-holes`,
            coordinates: `${this.props.idPrefix}-coords`,
        };
        const errorIds = {
            name: `${ids.name}-error`,
            coordinates: `${ids.coordinates}-error`,
        };
        const hintIds = {
            holes: `${ids.holes}-hint`,
            coordinates: `${ids.coordinates}-hint`,
        };
        const busy = (): boolean => this.props.busy?.get() ?? false;

        const frag = this.wire(tpl, {
            nameLabel: { htmlFor: ids.name },
            name: {
                id: ids.name,
                'aria-invalid': () => String(this.props.errors.get().name !== undefined),
                disabled: busy,
                oninput: (e: Event) => this.patch({ name: (e.target as HTMLInputElement).value }),
            },
            nameError: {
                id: errorIds.name,
                textContent: () => this.props.errors.get().name ?? '',
                hidden: () => this.props.errors.get().name === undefined,
            },

            // A <span>, not a <label>: a label points at ONE control and the
            // track is a group of buttons. The group is named by it through
            // aria-labelledby instead.
            holesLabel: { id: `${ids.holes}-label` },
            holes: {
                id: ids.holes,
                'aria-labelledby': `${ids.holes}-label`,
                'aria-describedby': hintIds.holes,
            },
            holesHint: {
                id: hintIds.holes,
                textContent:
                    'Changing this only changes the count — finish the new holes '
                    + 'in the holes editor; readiness flags the gap until then.',
                hidden: () => !(this.props.existing?.get() ?? false),
            },

            coordsLabel: { htmlFor: ids.coordinates },
            coordinates: {
                id: ids.coordinates,
                'aria-invalid': () => String(this.props.errors.get().coordinates !== undefined),
                disabled: busy,
                oninput: (e: Event) =>
                    this.patch({ coordinates: (e.target as HTMLInputElement).value }),
            },
            // The hint IS the format example, so it is the same sentence the
            // error uses — one shape stated once, before and after the mistake.
            coordsHint: {
                id: hintIds.coordinates,
                textContent: `${COORDINATE_HINT}. Optional; clear the field to remove the position.`,
            },
            coordsError: {
                id: errorIds.coordinates,
                textContent: () => this.props.errors.get().coordinates ?? '',
                hidden: () => this.props.errors.get().coordinates === undefined,
            },
        });

        this.nameInput = this.ref(frag, 'name') as HTMLInputElement;
        this.coordsInput = this.ref(frag, 'coordinates') as HTMLInputElement;

        const track = this.ref(frag, 'holes');
        this.holeButtons = HOLE_COUNTS.map((count) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = String(count);
            button.addEventListener('click', () => this.patch({ holeCount: count }));
            track.appendChild(button);
            return button;
        });
        this.track(effect(() => {
            const selected = this.draft.get().holeCount;
            const inert = busy();
            this.holeButtons.forEach((button, index) => {
                button.setAttribute('aria-pressed', String(HOLE_COUNTS[index] === selected));
                button.disabled = inert;
            });
        }));

        /*
         * `aria-describedby` is a LIST and must name only what describes the
         * field right now: the format hint always, the error only while it is
         * SHOWN. Pointing at a hidden, empty <p> describes the field as "",
         * which some screen readers announce as a pause where the hint was.
         * Order is reading order — the shape first, then what went wrong.
         * `wire` cannot express the removal (an attribute binding always
         * `setAttribute`s, so "none" would become the empty string).
         */
        this.track(effect(() => {
            describe(this.nameInput!, this.props.errors.get().name ? [errorIds.name] : []);
        }));
        this.track(effect(() => {
            const described = [hintIds.coordinates];
            if (this.props.errors.get().coordinates) described.push(errorIds.coordinates);
            describe(this.coordsInput!, described);
        }));

        return frag;
    }

    /**
     * Put a draft into the controls — a blank one when the create panel opens,
     * the course's own values when an edit begins. The only writer of the input
     * elements, which is what keeps the caret where the user left it.
     */
    seed(draft: CourseDraft): void {
        this.draft.set({ ...draft });
        if (this.nameInput) this.nameInput.value = draft.name;
        if (this.coordsInput) this.coordsInput.value = draft.coordinates;
    }

    /** Move focus to the first field — the screen calls it after revealing. */
    focusFirst(): void {
        this.nameInput?.focus();
    }

    /**
     * Put the caret in the first field the validator complained about, in DOM
     * order. A refused submit otherwise leaves focus on the button with the
     * message somewhere above it. Returns whether it found one.
     */
    focusInvalid(errors: CourseFieldErrors): boolean {
        if (errors.name !== undefined && this.nameInput) {
            this.nameInput.focus();
            return true;
        }
        if (errors.coordinates !== undefined && this.coordsInput) {
            this.coordsInput.focus();
            return true;
        }
        return false;
    }

    private patch(part: Partial<CourseDraft>): void {
        this.draft.update((draft) => ({ ...draft, ...part }));
    }
}

/** Set `aria-describedby` to exactly these ids — or REMOVE it when there are none. */
function describe(input: HTMLInputElement, ids: string[]): void {
    if (ids.length === 0) input.removeAttribute('aria-describedby');
    else input.setAttribute('aria-describedby', ids.join(' '));
}
