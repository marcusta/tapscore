import './harness';
import { afterEach, expect, test } from 'bun:test';
import { Signal } from '@basics/core/client/core';
import { mount } from './harness';
import {
    DELETE_CONSEQUENCE_UNKNOWN,
    clubPayload,
    deleteConsequence,
    draftFrom,
    emptyDraft,
    hasErrors,
    validateClub,
    type ClubFieldErrors,
} from '../../manage/courses/club-form';
import { ClubFieldsComponent } from '../../manage/courses/club-fields.component';

// The club form in two halves: the rules (pure, shared by the create panel and
// the club page) and their PRESENTATION (the message under the field it belongs
// to, and the aria wiring that says so to a screen reader).

// ── the rules ──────────────────────────────────────────────────────────

test('a club needs a name, and whitespace is not one', () => {
    expect(validateClub({ name: '', location: '', logoUrl: '' }).name).toBeDefined();
    expect(validateClub({ name: '   ', location: '', logoUrl: '' }).name).toBeDefined();
    expect(validateClub({ name: 'Bråviken GK', location: '', logoUrl: '' }).name).toBeUndefined();
});

test('a logo URL must be an absolute http(s) address, or empty', () => {
    const at = (logoUrl: string): ClubFieldErrors =>
        validateClub({ name: 'Bråviken GK', location: '', logoUrl });

    // Optional means optional.
    expect(at('').logoUrl).toBeUndefined();
    expect(at('   ').logoUrl).toBeUndefined();

    expect(at('https://braviken.se/logo.png').logoUrl).toBeUndefined();
    expect(at('http://braviken.se/logo.png').logoUrl).toBeUndefined();

    // A relative path or a bare host resolves against whatever origin renders
    // the <img>, which is never the one the typist had in mind.
    expect(at('/logo.png').logoUrl).toBeDefined();
    expect(at('braviken.se/logo.png').logoUrl).toBeDefined();
    // A parseable URL that is not fetchable by a browser image is still wrong.
    expect(at('ftp://braviken.se/logo.png').logoUrl).toBeDefined();
});

test('the messages say what to do, not merely that something is wrong', () => {
    const errors = validateClub({ name: '', location: '', logoUrl: 'nope' });
    expect(errors.name).toContain('Enter one');
    expect(errors.logoUrl).toContain('https://');
    expect(hasErrors(errors)).toBe(true);
    expect(hasErrors({})).toBe(false);
});

test('the payload trims, and sends an empty optional as null rather than an empty string', () => {
    expect(clubPayload({ name: '  Bråviken GK ', location: '  Norrköping ', logoUrl: '  ' })).toEqual(
        { name: 'Bråviken GK', location: 'Norrköping', logoUrl: null },
    );
    expect(clubPayload(emptyDraft())).toEqual({ name: '', location: null, logoUrl: null });
});

test('a draft round-trips a club, nulls becoming the empty strings an input holds', () => {
    expect(draftFrom({ id: 'c1', name: 'Linköpings GK', location: null, logoUrl: null })).toEqual({
        name: 'Linköpings GK',
        location: '',
        logoUrl: '',
    });
});

test('the delete consequence is one sentence, counted, and stated once for both screens', () => {
    // Both the list's row action and the club page's button open the same
    // question, so the wording lives here rather than in two verbatim copies.
    expect(deleteConsequence('Linköpings GK', 2)).toBe(
        'Linköpings GK leaves the catalog. It has 2 courses. Rounds already played keep their own copy of the course data, so no scorecard changes.',
    );
    expect(deleteConsequence('Bråviken GK', 1)).toContain('It has 1 course.');
    expect(deleteConsequence('Bråviken GK', 0)).toContain('It has no courses.');
    // The consequence, never "are you sure".
    expect(deleteConsequence('Bråviken GK', 0)).not.toContain('sure');
    expect(DELETE_CONSEQUENCE_UNKNOWN).not.toContain('sure');
});

// ── the presentation ───────────────────────────────────────────────────

let open: { destroy(): void } | null = null;
afterEach(() => {
    open?.destroy();
    open = null;
});

function fields(errors = new Signal<ClubFieldErrors>({}), busy = new Signal(false)) {
    const mounted = mount(
        new ClubFieldsComponent({ idPrefix: 'test-club', errors, busy }),
    );
    open = mounted;
    return { ...mounted, errors, busy };
}

const input = (host: HTMLElement, name: string): HTMLInputElement =>
    host.querySelector(`#test-club-${name}`) as HTMLInputElement;

test('every field is named by a real label, tied by id', () => {
    const { host } = fields();

    const labels = [...host.querySelectorAll('label')] as HTMLLabelElement[];
    expect(labels.map((label) => [label.htmlFor, label.textContent])).toEqual([
        ['test-club-name', 'Name'],
        ['test-club-location', 'Location'],
        ['test-club-logo', 'Logo URL'],
    ]);
    for (const label of labels) expect(host.querySelector(`#${label.htmlFor}`)).not.toBeNull();
});

test('nothing native validates, so our own wording is what the user gets', () => {
    const { host } = fields();

    // `required` and `type="url"` both make the form fail its native validity
    // check, which cancels the submit event before the screen ever sees it —
    // the user then reads a browser bubble instead of the message written for
    // this app. The requirement is still announced, through aria.
    expect(input(host, 'name').required).toBe(false);
    expect(input(host, 'name').getAttribute('aria-required')).toBe('true');
    expect(input(host, 'logo').type).toBe('text');
    expect(input(host, 'logo').getAttribute('inputmode')).toBe('url');
});

test('an error appears under its own field, announced, and marks that control invalid', () => {
    const { host, errors } = fields();
    const name = input(host, 'name');
    const error = host.querySelector('#test-club-name-error') as HTMLElement;

    // Nothing wrong yet: no message, and the control is not marked invalid.
    expect(error.hidden).toBe(true);
    expect(name.getAttribute('aria-invalid')).toBe('false');

    errors.set({ name: 'A club needs a name. Enter one before saving.' });

    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe('A club needs a name. Enter one before saving.');
    expect(error.getAttribute('role')).toBe('alert');
    expect(name.getAttribute('aria-invalid')).toBe('true');
    // The message is attached to the control, so it is read with the field
    // rather than announced into the void.
    expect(name.getAttribute('aria-describedby')).toBe('test-club-name-error');

    // A name error is not a logo error: the other field stays clean.
    const logoError = host.querySelector('#test-club-logo-error') as HTMLElement;
    expect(logoError.hidden).toBe(true);
    expect(input(host, 'logo').getAttribute('aria-invalid')).toBe('false');
});

test('the optional fields explain themselves under the label, not in it', () => {
    const { host } = fields();
    const hints = [...host.querySelectorAll('.mclubfields__hint')].map((el) => el.textContent);

    // "Location" stays the label; the explanation lives beneath it
    // (docs/design-guidelines.md §4).
    expect(host.querySelector('label[for="test-club-location"]')?.textContent).toBe('Location');
    expect(hints.some((text) => text?.includes('Optional'))).toBe(true);

    // …and each hint is ATTACHED to the control it explains, so it is read with
    // the field rather than merely sitting near it.
    expect(input(host, 'location').getAttribute('aria-describedby')).toBe(
        'test-club-location-hint',
    );
    expect(input(host, 'logo').getAttribute('aria-describedby')).toBe('test-club-logo-hint');
    for (const id of ['test-club-location-hint', 'test-club-logo-hint']) {
        expect(host.querySelector(`#${id}`)?.className).toContain('mclubfields__hint');
    }
});

test('a field describes itself with its error only while that error is shown', () => {
    const { host, errors } = fields();
    const name = input(host, 'name');
    const logo = input(host, 'logo');

    // Nothing wrong: the name field has no hint and no error, so it claims no
    // description at all rather than an empty one pointing at a hidden <p>.
    expect(name.getAttribute('aria-describedby')).toBeNull();

    errors.set({
        name: 'A club needs a name. Enter one before saving.',
        logoUrl: 'Enter a full web address starting with https://, or leave this empty.',
    });

    expect(name.getAttribute('aria-describedby')).toBe('test-club-name-error');
    // Hint first, then what is wrong with what was typed — reading order.
    expect(logo.getAttribute('aria-describedby')).toBe(
        'test-club-logo-hint test-club-logo-error',
    );

    // Cleared again: the permanent hint stays, the error reference goes.
    errors.set({});
    expect(name.getAttribute('aria-describedby')).toBeNull();
    expect(logo.getAttribute('aria-describedby')).toBe('test-club-logo-hint');
});

test('focusInvalid puts the caret in the first complained-about field, in DOM order', () => {
    const { host, component } = fields();
    input(host, 'location').focus();

    // Both wrong: the FIRST one wins, so the user starts at the top of what
    // needs fixing rather than in the middle of it.
    expect(component.focusInvalid({ name: 'nope', logoUrl: 'nope' })).toBe(true);
    expect(document.activeElement).toBe(input(host, 'name'));

    input(host, 'location').focus();
    expect(component.focusInvalid({ logoUrl: 'nope' })).toBe(true);
    expect(document.activeElement).toBe(input(host, 'logo'));

    // Nothing to focus, and nothing moved.
    input(host, 'location').focus();
    expect(component.focusInvalid({})).toBe(false);
    expect(document.activeElement).toBe(input(host, 'location'));
});

test('typing updates the draft the screen submits', () => {
    const { host, component } = fields();

    const name = input(host, 'name');
    name.value = 'Bråviken GK';
    name.dispatchEvent(new Event('input', { bubbles: true }));

    const location = input(host, 'location');
    location.value = 'Norrköping';
    location.dispatchEvent(new Event('input', { bubbles: true }));

    expect(component.draft.get()).toEqual({
        name: 'Bråviken GK',
        location: 'Norrköping',
        logoUrl: '',
    });
});

test('seeding is the only thing that writes the controls — a redraw cannot move the caret', () => {
    const { host, component, errors } = fields();

    component.seed({ name: 'Linköpings GK', location: 'Linköping', logoUrl: '' });
    expect(input(host, 'name').value).toBe('Linköpings GK');

    // Mid-word, and then something else on the form changes.
    const name = input(host, 'name');
    name.value = 'Linköpings Golfkl';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    errors.set({ logoUrl: 'Enter a full web address starting with https://, or leave this empty.' });

    // The control still holds what was typed: nothing bound rewrote it.
    expect(input(host, 'name').value).toBe('Linköpings Golfkl');
    expect(component.draft.get().name).toBe('Linköpings Golfkl');
});

test('the fields go inert while a save is in flight', () => {
    const { host, busy } = fields();

    expect(input(host, 'name').disabled).toBe(false);
    busy.set(true);
    for (const name of ['name', 'location', 'logo']) {
        expect(input(host, name).disabled).toBe(true);
    }
});
