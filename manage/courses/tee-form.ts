// What a tee form holds, what makes it valid, and how a tee is worded in the
// list. Pure — no DOM, no signals — for the same reason `course-form.ts` is: the
// same fields are typed in two places (the create panel and the edit panel) and
// the two must not disagree about what "valid" means.

import type { Tee, TeeHoleLength, TeeRating } from '../../src/api/tees.gen';

export type Gender = 'M' | 'F';

/** Men first — the order the ratings block and every summary reads in. */
export const GENDERS: Gender[] = ['M', 'F'];

export function genderLabel(gender: Gender): string {
    return gender === 'M' ? 'Men' : 'Women';
}

/**
 * One hole's row in the lengths grid. Strings, not numbers: what the user has
 * typed is a string until it parses, and a half-typed "12" on the way to "125"
 * must not round-trip through a number and lose the caret.
 *
 * A BLANK length is a real answer — "this hole is not measured from this tee" —
 * and is dropped from the payload rather than sent as zero. Same rule as the
 * unrated gender below, one level down.
 */
export type LengthDraft = {
    holeNumber: number;
    lengthM: string;
    strokeIndexOverride: string;
};

/**
 * A gender's rating, or the explicit ABSENCE of one.
 *
 * `rated` is the whole point of this type and is why the four figures are not
 * simply nullable numbers. A tee rated for men only is legitimate and common
 * (spec §3.5), so "no women's rating" has to be a state the form can hold, show
 * and round-trip — distinct from "a women's rating whose numbers are all zero",
 * which is a broken rating and would resolve at round setup as if it were real.
 *
 * The invariant, enforced by `teePayload` and asserted in the tests: when
 * `rated` is false the gender is ABSENT from the payload's `ratings` array, and
 * `TeeService.update` deletes any stored row for it (`deleteRatingsExcept`).
 * Nothing ever writes a zero-filled rating.
 *
 * That delete REACHES FURTHER than this tee: migration 059's
 * `course_tee_roles_clear_removed_rating` trigger removes every course tee-role
 * mapping naming this tee for that gender. Unticking is destructive, which is
 * why the panel's absent-state copy states it in the past tense of the save
 * rather than as "will not be offered".
 *
 * The typed figures are kept while `rated` is false so that unticking and
 * re-ticking within one edit does not silently discard what was there; only a
 * SAVE makes the absence real.
 */
export type RatingDraft = {
    rated: boolean;
    courseRating: string;
    slope: string;
    par: string;
    totalLengthM: string;
};

export type TeeDraft = {
    name: string;
    colour: string;
    lengths: LengthDraft[];
    ratings: Record<Gender, RatingDraft>;
};

/**
 * Per-field messages. `lengths` is ONE message for the whole grid naming the
 * first hole at fault, with `badHoles` marking every offending cell: eighteen
 * separate error lines under a horizontally scrolling grid would put the
 * complaint off-screen from the cell it belongs to.
 */
export type TeeFieldErrors = {
    name?: string;
    lengths?: string;
    badHoles?: number[];
    ratings?: Partial<Record<Gender, string>>;
};

/**
 * The tee colours this catalog actually uses, offered as SUGGESTIONS and never
 * as a closed list.
 *
 * `tees.colour` is free text and today holds both Swedish colour words ("Gul")
 * and hex values ("#ffd400") — a dropdown would refuse half the existing rows
 * on their next save. So the control is a text field with a datalist: the common
 * answers are one tap away, and anything already stored stays editable.
 */
export const COLOUR_SUGGESTIONS = [
    'Vit',
    'Gul',
    'Blå',
    'Röd',
    'Orange',
    'Svart',
    'White',
    'Yellow',
    'Blue',
    'Red',
    'Black',
];

export const COLOUR_HINT =
    'The colour this tee is known by — Gul, Blå, Röd. A hex value like #ffd400 also works';

/** A blank tee for a course of `holeCount` holes: no lengths, neither gender rated. */
export function emptyDraft(holeCount: number): TeeDraft {
    return {
        name: '',
        colour: '',
        lengths: blankLengths(holeCount),
        ratings: { M: emptyRating(), F: emptyRating() },
    };
}

/**
 * An existing tee as the form holds it.
 *
 * `holeCount` comes from the COURSE, not from the tee: a tee measured for nine
 * holes on an eighteen-hole course is incomplete data, and the grid has to show
 * the nine empty rows that say so rather than silently offer only what exists.
 */
export function draftFrom(tee: Tee, holeCount: number): TeeDraft {
    const byHole = new Map(tee.holeLengths.map((length) => [length.holeNumber, length]));
    return {
        name: tee.name,
        colour: tee.colour ?? '',
        lengths: blankLengths(holeCount).map((row) => {
            const stored = byHole.get(row.holeNumber);
            if (!stored) return row;
            return {
                holeNumber: row.holeNumber,
                lengthM: numberText(stored.lengthM),
                strokeIndexOverride:
                    stored.strokeIndexOverride === null
                        ? ''
                        : numberText(stored.strokeIndexOverride),
            };
        }),
        ratings: {
            M: ratingDraftFor(tee, 'M'),
            F: ratingDraftFor(tee, 'F'),
        },
    };
}

/**
 * A stored rating as the form holds it — or the unrated state, with EMPTY
 * fields.
 *
 * The empty strings are the load-bearing half: seeding an absent rating with
 * "0" would put four zeros in front of the user, and the first save would then
 * write a rating of 0/0/0/0 that nobody asked for. Absence in, absence out.
 */
function ratingDraftFor(tee: Tee, gender: Gender): RatingDraft {
    const stored = tee.ratings.find((rating) => rating.gender === gender);
    if (!stored) return emptyRating();
    return {
        rated: true,
        courseRating: numberText(stored.courseRating),
        slope: numberText(stored.slope),
        par: numberText(stored.par),
        totalLengthM: numberText(stored.totalLengthM),
    };
}

function emptyRating(): RatingDraft {
    return { rated: false, courseRating: '', slope: '', par: '', totalLengthM: '' };
}

function blankLengths(holeCount: number): LengthDraft[] {
    return Array.from({ length: Math.max(holeCount, 0) }, (_, index) => ({
        holeNumber: index + 1,
        lengthM: '',
        strokeIndexOverride: '',
    }));
}

/**
 * Client-side validation — a courtesy, not the authority. The server validates
 * every write regardless and its refusal is what the screen surfaces
 * (`manage/api-failure.ts`).
 *
 * What is checked here is SHAPE ONLY: a name, and numbers where numbers go. The
 * golf ranges (a slope of 55–155, a course rating near par) are deliberately
 * NOT enforced — the server imposes none, and inventing them here would refuse
 * data the catalog is happy to hold and would drift the moment the server grew
 * a rule of its own.
 *
 * A blank length and an unrated gender are VALID, and that is the point: both
 * are real states, not omissions to nag about.
 */
export function validateTee(draft: TeeDraft, holeCount: number): TeeFieldErrors {
    const errors: TeeFieldErrors = {};

    if (draft.name.trim() === '') {
        errors.name = 'A tee needs a name. Enter one before saving.';
    }

    const badHoles: number[] = [];
    let lengthMessage: string | null = null;
    for (const row of draft.lengths) {
        const length = row.lengthM.trim();
        if (length !== '' && positiveNumber(length) === null) {
            badHoles.push(row.holeNumber);
            lengthMessage ??= `Hole ${row.holeNumber}: a length is metres as a number, e.g. 342. Leave it blank if the hole is not measured from this tee.`;
            continue;
        }
        const si = row.strokeIndexOverride.trim();
        if (si !== '' && !withinIndex(si, holeCount)) {
            badHoles.push(row.holeNumber);
            lengthMessage ??= `Hole ${row.holeNumber}: a stroke-index override is a whole number from 1 to ${holeCount}. Leave it blank to use the course's own stroke index.`;
        }
    }
    if (lengthMessage !== null) {
        errors.lengths = lengthMessage;
        errors.badHoles = badHoles;
    }

    const ratings: Partial<Record<Gender, string>> = {};
    for (const gender of GENDERS) {
        const message = validateRating(draft.ratings[gender], gender);
        if (message !== null) ratings[gender] = message;
    }
    if (Object.keys(ratings).length > 0) errors.ratings = ratings;

    return errors;
}

/**
 * A rating is all four figures or none of them. Half a rating cannot be stored
 * — `tee_ratings` has no nullable columns — so a partly filled block is a
 * question the form has to ask rather than a payload it can send.
 */
function validateRating(rating: RatingDraft, gender: Gender): string | null {
    if (!rating.rated) return null;

    const missing = RATING_FIELDS.filter((f) => rating[f.key].trim() === '').map((f) => f.label);
    if (missing.length > 0) {
        return `${genderLabel(gender)}: fill in ${listWords(missing)}, or set this tee to not rated for ${genderLabel(gender).toLowerCase()}.`;
    }

    // Zero is ACCEPTED, deliberately. `tee_ratings` has no nullable columns, so
    // a figure the club never recorded is stored as 0 — and most of the ratings
    // in the catalog today have a total length of exactly that. Refusing 0 here
    // would make those tees unsavable until the user invented a number, which is
    // the opposite of what a catalog editor is for. The server imposes no
    // minimum either (`tees.api.ts`: a plain `Type.Number()`).
    const bad = RATING_FIELDS.filter((f) =>
        f.whole
            ? !isWholeNumber(rating[f.key].trim())
            : nonNegativeNumber(rating[f.key].trim()) === null,
    );
    if (bad.length > 0) {
        const field = bad[0]!;
        return field.whole
            ? `${genderLabel(gender)}: ${field.label.toLowerCase()} is a whole number, e.g. ${field.example}.`
            : `${genderLabel(gender)}: ${field.label.toLowerCase()} is a number, e.g. ${field.example}. Use a dot for decimals.`;
    }

    return null;
}

/** The four figures a rating is made of, in the order the block presents them. */
export const RATING_FIELDS: {
    key: 'courseRating' | 'slope' | 'par' | 'totalLengthM';
    label: string;
    /** Whole numbers reject "72.5" rather than quietly truncating it. */
    whole: boolean;
    example: string;
}[] = [
    { key: 'courseRating', label: 'Course rating', whole: false, example: '71.4' },
    { key: 'slope', label: 'Slope', whole: true, example: '132' },
    { key: 'par', label: 'Par', whole: true, example: '72' },
    { key: 'totalLengthM', label: 'Total length (m)', whole: true, example: '5812' },
];

export function hasErrors(errors: TeeFieldErrors): boolean {
    return Object.keys(errors).length > 0;
}

/**
 * The draft as the API takes it — lengths and ratings TOGETHER, which is what
 * `UpdateTeeInput` accepts and what makes one save one transaction.
 *
 * Two absences are carried deliberately:
 *
 *  - a blank hole is DROPPED from `holeLengths`. The server replaces the whole
 *    set on update, so a dropped hole is an erased hole — which is exactly what
 *    clearing the box means.
 *  - an unrated gender is DROPPED from `ratings`, and `TeeService.update`
 *    deletes any stored row for it. This is the one path by which a rating is
 *    retired, and it is why the array is always sent whole rather than patched.
 *
 * `colour` goes out as null when blank: the column is nullable and "no colour"
 * is not the empty string.
 *
 * Callers must have validated first — an unparseable figure arrives here as
 * `NaN`, which `validateTee` is what stops from being saved.
 */
export function teePayload(draft: TeeDraft): {
    name: string;
    colour: string | null;
    holeLengths: TeeHoleLength[];
    ratings: TeeRating[];
} {
    const holeLengths: TeeHoleLength[] = [];
    for (const row of draft.lengths) {
        const length = positiveNumber(row.lengthM.trim());
        if (length === null) continue;
        const si = row.strokeIndexOverride.trim();
        holeLengths.push({
            holeNumber: row.holeNumber,
            lengthM: length,
            strokeIndexOverride: si === '' ? null : Number(si),
        });
    }

    const ratings: TeeRating[] = [];
    for (const gender of GENDERS) {
        const rating = draft.ratings[gender];
        if (!rating.rated) continue;
        ratings.push({
            gender,
            courseRating: Number(rating.courseRating.trim()),
            slope: Number(rating.slope.trim()),
            par: Number(rating.par.trim()),
            totalLengthM: Number(rating.totalLengthM.trim()),
        });
    }

    const colour = draft.colour.trim();
    return { name: draft.name.trim(), colour: colour === '' ? null : colour, holeLengths, ratings };
}

// ─── Wording for the list (docs/design-guidelines.md §4: words, not symbols) ───

/** Which genders this tee is rated for, in words. Never a pair of icons. */
export function ratedGendersLabel(tee: Tee): string {
    const rated = GENDERS.filter((gender) =>
        tee.ratings.some((rating) => rating.gender === gender),
    );
    if (rated.length === 0) return 'Not rated';
    return rated.map(genderLabel).join(', ');
}

/**
 * The tee's total lengths, per rating.
 *
 * The RATED total is preferred over the sum of the hole lengths because it is
 * the figure that plays: it is what the scorecard prints and what a handicap is
 * computed against, and the two can legitimately differ (a rating is measured
 * to the centre of the green, hole lengths are often rounded).
 *
 * With no rating at all there is still something true to say — the measured sum
 * — and it is LABELLED as measured so the column never passes one figure off as
 * the other.
 *
 * A rated total of ZERO is not a length, it is the column's way of saying the
 * figure was never recorded (`tee_ratings.total_length_m` is not nullable, and
 * most of the catalog's ratings sit at 0 today). It falls through to the
 * measured sum rather than printing "0 m", which would be a false statement
 * about a course.
 */
export function totalLengthsLabel(tee: Tee): string {
    const rated = GENDERS.map((gender) => ({
        gender,
        rating: tee.ratings.find((r) => r.gender === gender),
    })).filter(
        (entry): entry is { gender: Gender; rating: TeeRating } =>
            entry.rating !== undefined && entry.rating.totalLengthM > 0,
    );

    if (rated.length > 0) {
        return rated
            .map((entry) => `${genderLabel(entry.gender)} ${metres(entry.rating.totalLengthM)}`)
            .join(', ');
    }

    const measured = tee.holeLengths.reduce((sum, hole) => sum + hole.lengthM, 0);
    if (measured > 0) return `${metres(measured)} measured`;
    return '';
}

/** How many of the course's holes this tee is measured for. */
export function measuredHoles(tee: Tee): number {
    return tee.holeLengths.length;
}

export function metres(value: number): string {
    return `${Math.round(value)} m`;
}

/**
 * A CSS colour for the swatch beside the WORD, or null when the stored value is
 * not one this can paint.
 *
 * Strict on purpose. The value is free text out of the database, and handing an
 * arbitrary string to `style.backgroundColor` is how a stored value gets to
 * decide what a page looks like; anything that is not a hex literal or a name
 * on this list simply gets no swatch, and the word alone carries the answer —
 * which the design guidelines require it to do regardless.
 */
export function swatchColour(colour: string | null): string | null {
    if (colour === null) return null;
    const value = colour.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return value;
    return NAMED_COLOURS[value.toLocaleLowerCase('sv-SE')] ?? null;
}

/**
 * The colour a stored value is KNOWN BY, in words — which is what a list column
 * is for.
 *
 * Almost every row in the catalog stores a hex value, and "#ffd400" beside a
 * tee already named "Gul" is the swatch's information twice over and the word's
 * not at all. So a hex this file recognises renders as its word; the hex is
 * still the truth and rides along as the cell's `title`, and anything
 * unrecognised — a colour word this map has never heard of, a hex outside the
 * palette — is printed verbatim, because the stored text is then the only
 * honest answer.
 *
 * Case and shorthand are normalised first: `#FFD400` and `#fd0` are the same
 * yellow as `#ffd400`, and a table that says "Gul" for one and "#FFD400" for
 * the next is describing a difference that does not exist.
 */
export function colourWord(colour: string): string {
    const value = colour.trim();
    const hex = normaliseHex(value);
    return (hex === null ? null : WORD_BY_HEX.get(hex)) ?? value;
}

/** `#fd0` → `#ffd400`, `#FFD400` → `#ffd400`, anything else → null. */
function normaliseHex(value: string): string | null {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return null;
    const body = value.slice(1).toLowerCase();
    return `#${body.length === 3 ? [...body].map((c) => c + c).join('') : body}`;
}

/**
 * Hex back to the word to print for it. Built from `NAMED_COLOURS` rather than
 * written out, so the two directions cannot drift: adding a colour to the map
 * below is the only edit either needs.
 *
 * The map is many-to-one — `vit` and `white` are both `#f5f5f5` — so the FIRST
 * word wins, which is why `NAMED_COLOURS` lists the Swedish word first. This
 * catalog's tees are Swedish, and the club that named a tee "Gul" is the one
 * reading the column.
 */
const WORD_BY_HEX = new Map<string, string>();

/** The colour words this catalog uses, Swedish and English, as hex. */
const NAMED_COLOURS: Record<string, string> = {
    vit: '#f5f5f5',
    white: '#f5f5f5',
    gul: '#ffd400',
    yellow: '#ffd400',
    'blå': '#2a6fd4',
    bla: '#2a6fd4',
    blue: '#2a6fd4',
    'röd': '#d4332a',
    rod: '#d4332a',
    red: '#d4332a',
    orange: '#e8830c',
    svart: '#1c1c1c',
    black: '#1c1c1c',
    'grön': '#2f8f4e',
    green: '#2f8f4e',
    guld: '#c8a44a',
    gold: '#c8a44a',
};

for (const [word, hex] of Object.entries(NAMED_COLOURS)) {
    // Title case for the printed word: the column is a name, and "gul" beside
    // "Gul" in the tee's own Name column looks like two different answers.
    if (!WORD_BY_HEX.has(hex)) WORD_BY_HEX.set(hex, word.charAt(0).toUpperCase() + word.slice(1));
}

/**
 * What deleting a tee makes true — the sentence the confirm dialog states
 * instead of "are you sure" (`manage/ui/confirm.ts`).
 *
 * It names what goes (the tee's lengths and ratings) and what does NOT: rounds
 * already played keep a frozen copy of the tee's name and rating, so no
 * scorecard changes. Whether the delete may happen at all is the server's call
 * — a tee named by a tee-role mapping is refused — and that refusal is repeated
 * verbatim rather than predicted here.
 */
export function deleteConsequence(teeName: string): string {
    return `${teeName} leaves this course, and its hole lengths and ratings go with it. Rounds already played keep their own copy of the tee, so no scorecard changes.`;
}

/** The same sentence when the tee itself is no longer in hand. */
export const DELETE_CONSEQUENCE_UNKNOWN =
    'The tee is removed from this course, along with its hole lengths and ratings.';

// ─── Parsing helpers ───

/** A finite number greater than zero, or null. Rejects what `Number()` allows. */
function positiveNumber(text: string): number | null {
    if (!/^\d+(\.\d+)?$/.test(text)) return null;
    const value = Number(text);
    return Number.isFinite(value) && value > 0 ? value : null;
}

/** A finite number, zero or above. Same acceptance, minus the `> 0`. */
function nonNegativeNumber(text: string): number | null {
    if (!/^\d+(\.\d+)?$/.test(text)) return null;
    const value = Number(text);
    return Number.isFinite(value) ? value : null;
}

/** A whole number, zero included — see the note in `validateRating`. */
function isWholeNumber(text: string): boolean {
    return /^\d+$/.test(text);
}

function withinIndex(text: string, holeCount: number): boolean {
    if (!/^\d+$/.test(text)) return false;
    const value = Number(text);
    return value >= 1 && value <= holeCount;
}

/** A stored number back into a field: no trailing zeros, no exponent. */
function numberText(value: number): string {
    return String(Number(value.toFixed(3)));
}

function listWords(words: string[]): string {
    const lower = words.map((word) => word.toLowerCase());
    if (lower.length === 1) return lower[0]!;
    return `${lower.slice(0, -1).join(', ')} and ${lower[lower.length - 1]}`;
}
