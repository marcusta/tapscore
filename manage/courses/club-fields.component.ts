import { Component, Signal, effect, template, type Readable } from '@basics/core/client/core';
import { field, fieldControl, fieldError, fieldHint, fieldLabel, formGrid } from '../ui/recipes';
import { emptyDraft, type ClubDraft, type ClubFieldErrors } from './club-form';

/*
 * The three club fields — name, location, logo URL — as one component, because
 * they are typed in two places (the create panel on the clubs list, the edit
 * form on the club page) and a club that can be created with a field the edit
 * form does not offer is the drift this prevents.
 *
 * It owns the DRAFT and nothing else. Validation, the submit button, the
 * request and the failure message all belong to the surrounding screen, which
 * is why this takes `errors` as a prop rather than deriving them: the create
 * panel shows them on submit, while the club page shows them through
 * `RowEditController`, and neither is this component's business.
 *
 * Values are seeded imperatively (`seed()`) rather than bound. A bound input
 * writes its value back on every emit of whatever it is bound to, which moves
 * the caret to the end of the field mid-word — the same hazard
 * `ManageTableComponent` documents at length for inline editors.
 */

export type ClubFieldsProps = {
    /** Unique per form on the page; prefixes the id that ties label to control. */
    idPrefix: string;
    errors: Readable<ClubFieldErrors>;
    /** Controls go inert while a save is in flight. */
    busy?: Readable<boolean>;
};

const tpl = template(`
    <div class="mclubfields">
        <div class="mclubfields__field">
            <label bind="nameLabel" class="mclubfields__label">Name</label>
            <!-- aria-required, NOT the required attribute: a natively required
                 field blocks the submit event entirely and replaces our worded
                 message with a browser bubble we cannot word or place. -->
            <input bind="name" class="mclubfields__control" type="text" autocomplete="off" aria-required="true">
            <p bind="nameError" class="mclubfields__error" role="alert"></p>
        </div>

        <div class="mclubfields__field">
            <label bind="locationLabel" class="mclubfields__label">Location</label>
            <input bind="location" class="mclubfields__control" type="text" autocomplete="off">
            <p bind="locationHint" class="mclubfields__hint">Town or area. Optional — it only helps people find the club in a list.</p>
        </div>

        <!-- mform__field--full is the class formGrid() publishes for a field
             that must span the row; a URL is exactly that case. -->
        <div class="mclubfields__field mform__field--full">
            <label bind="logoLabel" class="mclubfields__label">Logo URL</label>
            <!-- A text input with a url inputmode. type="url" would fail the
                 form's native validity check and swallow the submit, the same
                 way required does above; the keyboard hint is worth keeping. -->
            <input bind="logoUrl" class="mclubfields__control" type="text" autocomplete="off" inputmode="url">
            <p bind="logoHint" class="mclubfields__hint">A full web address to the club's logo image. Optional.</p>
            <p bind="logoError" class="mclubfields__error" role="alert"></p>
        </div>
    </div>
`);

export class ClubFieldsComponent extends Component<ClubFieldsProps> {
    static styles = `
        .mclubfields {
            ${formGrid()}

            & .mclubfields__field {
                ${field()}
            }

            & .mclubfields__label {
                ${fieldLabel()}
            }

            & .mclubfields__control {
                ${fieldControl()}
            }

            & .mclubfields__hint {
                ${fieldHint()}
                margin: 0;
            }

            & .mclubfields__error {
                ${fieldError()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;

    /** The live draft. The screen reads it on submit; nothing else writes it. */
    readonly draft = new Signal<ClubDraft>(emptyDraft());

    private inputs: Partial<Record<keyof ClubDraft, HTMLInputElement>> = {};

    render(): DocumentFragment {
        const ids = {
            name: `${this.props.idPrefix}-name`,
            location: `${this.props.idPrefix}-location`,
            logoUrl: `${this.props.idPrefix}-logo`,
        };
        const errorIds = {
            name: `${ids.name}-error`,
            logoUrl: `${ids.logoUrl}-error`,
        };
        const hintIds = {
            location: `${ids.location}-hint`,
            logoUrl: `${ids.logoUrl}-hint`,
        };
        const busy = (): boolean => this.props.busy?.get() ?? false;

        const frag = this.wire(tpl, {
            nameLabel: { htmlFor: ids.name },
            name: {
                id: ids.name,
                'aria-invalid': () => String(this.props.errors.get().name !== undefined),
                disabled: busy,
                oninput: (e: Event) => this.patch('name', e),
            },
            nameError: {
                id: errorIds.name,
                textContent: () => this.props.errors.get().name ?? '',
                hidden: () => this.props.errors.get().name === undefined,
            },

            locationLabel: { htmlFor: ids.location },
            location: {
                id: ids.location,
                'aria-describedby': hintIds.location,
                disabled: busy,
                oninput: (e: Event) => this.patch('location', e),
            },
            locationHint: { id: hintIds.location },

            logoLabel: { htmlFor: ids.logoUrl },
            logoUrl: {
                id: ids.logoUrl,
                'aria-invalid': () => String(this.props.errors.get().logoUrl !== undefined),
                disabled: busy,
                oninput: (e: Event) => this.patch('logoUrl', e),
            },
            logoHint: { id: hintIds.logoUrl },
            logoError: {
                id: errorIds.logoUrl,
                textContent: () => this.props.errors.get().logoUrl ?? '',
                hidden: () => this.props.errors.get().logoUrl === undefined,
            },
        });

        this.inputs = {
            name: this.ref(frag, 'name') as HTMLInputElement,
            location: this.ref(frag, 'location') as HTMLInputElement,
            logoUrl: this.ref(frag, 'logoUrl') as HTMLInputElement,
        };

        /*
         * `aria-describedby` is a LIST, and it must name only the elements that
         * actually describe the field right now. Two rules, and `wire` can
         * express neither on its own (an attribute binding there always
         * `setAttribute`s, so "no description" would become the empty string
         * rather than no attribute):
         *
         *  - the hint is permanent, so it is always in the list;
         *  - the error paragraph is only in it while an error is SHOWN. Pointing
         *    at a hidden, empty <p> describes the field as "" — some screen
         *    readers announce that as a pause where the hint used to be, and it
         *    makes the field claim a description it does not have.
         *
         * Order is the reading order: hint first, then what is wrong with what
         * was typed.
         */
        this.track(effect(() => {
            describe(this.inputs.name!, this.props.errors.get().name ? [errorIds.name] : []);
        }));
        this.track(effect(() => {
            const ids = [hintIds.logoUrl];
            if (this.props.errors.get().logoUrl) ids.push(errorIds.logoUrl);
            describe(this.inputs.logoUrl!, ids);
        }));

        return frag;
    }

    /**
     * Put a draft into the controls — opening the create panel with a blank
     * one, entering edit with the club's current values. The only writer of the
     * input elements, which is what keeps the caret where the user left it.
     */
    seed(draft: ClubDraft): void {
        this.draft.set({ ...draft });
        for (const key of ['name', 'location', 'logoUrl'] as const) {
            const input = this.inputs[key];
            if (input) input.value = draft[key];
        }
    }

    /** Move focus to the first field — the screen calls it after revealing. */
    focusFirst(): void {
        this.inputs.name?.focus();
    }

    /**
     * Put the caret in the first field the validator complained about, in DOM
     * order. A submit that is refused client-side otherwise leaves focus on the
     * button, which for a keyboard or screen-reader user means the message has
     * appeared somewhere above them with no indication of where — and for
     * anyone on a long form means scrolling to find it.
     *
     * Returns whether it found one, so a caller can tell "handled" from
     * "nothing to focus".
     */
    focusInvalid(errors: ClubFieldErrors): boolean {
        for (const key of ['name', 'logoUrl'] as const) {
            if (errors[key] === undefined) continue;
            const input = this.inputs[key];
            if (!input) return false;
            input.focus();
            return true;
        }
        return false;
    }

    private patch(key: keyof ClubDraft, event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.draft.update((draft) => ({ ...draft, [key]: value }));
    }
}

/** Set `aria-describedby` to exactly these ids — or REMOVE it when there are none. */
function describe(input: HTMLInputElement, ids: string[]): void {
    if (ids.length === 0) input.removeAttribute('aria-describedby');
    else input.setAttribute('aria-describedby', ids.join(' '));
}
