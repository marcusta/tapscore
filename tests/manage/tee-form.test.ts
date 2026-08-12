import './harness';
import { expect, test } from 'bun:test';
import type { Tee } from '../../src/api/tees.gen';
import {
    draftFrom,
    colourWord,
    emptyDraft,
    hasErrors,
    ratedGendersLabel,
    swatchColour,
    teePayload,
    totalLengthsLabel,
    validateTee,
} from '../../manage/courses/tee-form';

// The tee form's pure half (`manage/courses/tee-form.ts`) — what a draft holds,
// what makes it valid, and what goes on the wire. No DOM here; the component
// test next door drives the same rules through the controls.
//
// The load-bearing case is the UNRATED GENDER. A tee rated for men only is
// ordinary (spec §3.5), so "no women's rating" has to survive a round trip as an
// absence. A zero-filled rating is not the same fact and would resolve at round
// setup as if it were real, so several tests below exist purely to catch a
// regression that fills one in.

function tee(over: Partial<Tee> = {}): Tee {
    return {
        id: 't1',
        courseId: 'k1',
        name: 'Gul',
        colour: 'Gul',
        holeLengths: [],
        ratings: [],
        ...over,
    };
}

const lengths = (count: number, from = 300) =>
    Array.from({ length: count }, (_, i) => ({
        holeNumber: i + 1,
        lengthM: from + i,
        strokeIndexOverride: null,
    }));

// ─── The unrated gender ───

test('an absent rating seeds as NOT RATED with empty figures, never zeros', () => {
    const draft = draftFrom(
        tee({
            ratings: [{ gender: 'M', courseRating: 71.4, slope: 132, par: 72, totalLengthM: 5812 }],
        }),
        18,
    );

    expect(draft.ratings.M).toEqual({
        rated: true,
        courseRating: '71.4',
        slope: '132',
        par: '72',
        totalLengthM: '5812',
    });
    // The four empty strings are the point: seeding "0" would put four zeros in
    // front of the user and the next save would write a rating nobody asked for.
    expect(draft.ratings.F).toEqual({
        rated: false,
        courseRating: '',
        slope: '',
        par: '',
        totalLengthM: '',
    });
});

test('an unrated gender is ABSENT from the payload, not zero-filled', () => {
    const draft = draftFrom(
        tee({
            ratings: [{ gender: 'M', courseRating: 71.4, slope: 132, par: 72, totalLengthM: 5812 }],
        }),
        18,
    );

    const { ratings } = teePayload(draft);
    expect(ratings).toEqual([
        { gender: 'M', courseRating: 71.4, slope: 132, par: 72, totalLengthM: 5812 },
    ]);
    expect(ratings.some((rating) => rating.gender === 'F')).toBe(false);
});

test('a rating round-trips unchanged, and an absence stays an absence', () => {
    const stored = tee({
        ratings: [
            { gender: 'M', courseRating: 71.4, slope: 132, par: 72, totalLengthM: 5812 },
            { gender: 'F', courseRating: 73.9, slope: 128, par: 73, totalLengthM: 5104 },
        ],
    });
    expect(teePayload(draftFrom(stored, 18)).ratings).toEqual(stored.ratings);

    const half = tee({ ratings: [stored.ratings[1]!] });
    expect(teePayload(draftFrom(half, 18)).ratings).toEqual([stored.ratings[1]!]);
});

test('unticking a rated gender retires it — the array is sent whole, so absence deletes', () => {
    const draft = draftFrom(
        tee({
            ratings: [{ gender: 'M', courseRating: 71.4, slope: 132, par: 72, totalLengthM: 5812 }],
        }),
        18,
    );
    draft.ratings.M.rated = false;

    // The figures are still in the draft (unticking twice must not discard what
    // was typed) but they do not reach the wire.
    expect(draft.ratings.M.courseRating).toBe('71.4');
    expect(teePayload(draft).ratings).toEqual([]);
    // And an unrated gender is not a validation complaint — it is an answer.
    expect(hasErrors(validateTee(draft, 18))).toBe(false);
});

test('a blank tee is valid once it has a name — neither gender rated', () => {
    const draft = emptyDraft(18);
    expect(validateTee(draft, 18).name).toBeDefined();

    draft.name = 'Vit';
    expect(hasErrors(validateTee(draft, 18))).toBe(false);
    expect(teePayload(draft)).toEqual({
        name: 'Vit',
        colour: null,
        holeLengths: [],
        ratings: [],
    });
});

test('half a rating is refused — `tee_ratings` has no nullable columns', () => {
    const draft = emptyDraft(18);
    draft.name = 'Gul';
    draft.ratings.M = { rated: true, courseRating: '71.4', slope: '', par: '', totalLengthM: '' };

    const errors = validateTee(draft, 18);
    const message = errors.ratings?.M;
    expect(message).toContain('slope');
    expect(message).toContain('par');
    // And it names the way out that is not "fill in figures you do not have".
    expect(message).toContain('not rated');
    // The field the caret should land in — the first one at fault, so a refusal
    // never focuses a box that was fine.
    expect(errors.ratingFields?.M).toBe('slope');
});

test('a blank total length is a valid rating and goes out as 0', () => {
    // The catalog convention: a total length the club never recorded is stored
    // as 0 (`tee_ratings.total_length_m` is not nullable). The form must not
    // demand a number nobody has.
    const draft = emptyDraft(18);
    draft.name = 'Gul';
    draft.ratings.M = { rated: true, courseRating: '71.4', slope: '132', par: '72', totalLengthM: '' };

    expect(hasErrors(validateTee(draft, 18))).toBe(false);
    expect(teePayload(draft).ratings).toEqual([
        { gender: 'M', courseRating: 71.4, slope: 132, par: 72, totalLengthM: 0 },
    ]);
});

test('a FILLED total length is still checked — blank is the only free pass', () => {
    const draft = emptyDraft(18);
    draft.name = 'Gul';
    draft.ratings.M = { rated: true, courseRating: '71.4', slope: '132', par: '72', totalLengthM: '58l2' };

    const errors = validateTee(draft, 18);
    expect(errors.ratings?.M).toContain('total length');
    expect(errors.ratingFields?.M).toBe('totalLengthM');
});

test('a stored rating of zero round-trips — the catalog is full of them', () => {
    // `tee_ratings` has no nullable columns, so a total length nobody recorded
    // is a 0, and most of the ratings in the catalog today are exactly that.
    // Refusing it would make those tees unsavable until someone invented a
    // number; the server imposes no minimum either.
    const draft = draftFrom(
        tee({
            ratings: [{ gender: 'M', courseRating: 70.7, slope: 127, par: 71, totalLengthM: 0 }],
        }),
        18,
    );
    draft.name = 'Vit';

    expect(draft.ratings.M.totalLengthM).toBe('0');
    expect(hasErrors(validateTee(draft, 18))).toBe(false);
    expect(teePayload(draft).ratings).toEqual([
        { gender: 'M', courseRating: 70.7, slope: 127, par: 71, totalLengthM: 0 },
    ]);
});

test('a rating figure that is not a number is refused with its own shape', () => {
    const draft = emptyDraft(18);
    draft.name = 'Gul';
    draft.ratings.F = {
        rated: true,
        courseRating: '71.4',
        slope: '132.5',
        par: '73',
        totalLengthM: '5104',
    };

    expect(validateTee(draft, 18).ratings?.F).toContain('whole number');
});

// ─── Lengths ───

test('a blank hole is dropped, not sent as zero', () => {
    const draft = emptyDraft(18);
    draft.name = 'Gul';
    draft.lengths[0]!.lengthM = '342';
    draft.lengths[1]!.lengthM = '   ';

    expect(hasErrors(validateTee(draft, 18))).toBe(false);
    expect(teePayload(draft).holeLengths).toEqual([
        { holeNumber: 1, lengthM: 342, strokeIndexOverride: null },
    ]);
});

test('a stroke-index override rides with its hole; blank means the course’s own', () => {
    const draft = emptyDraft(18);
    draft.name = 'Gul';
    draft.lengths[0]!.lengthM = '342';
    draft.lengths[0]!.strokeIndexOverride = '7';
    draft.lengths[1]!.lengthM = '155';

    expect(teePayload(draft).holeLengths).toEqual([
        { holeNumber: 1, lengthM: 342, strokeIndexOverride: 7 },
        { holeNumber: 2, lengthM: 155, strokeIndexOverride: null },
    ]);
});

test('a typo in a length names the hole and marks the cell', () => {
    const draft = emptyDraft(18);
    draft.name = 'Gul';
    draft.lengths[2]!.lengthM = '34o';

    const errors = validateTee(draft, 18);
    expect(errors.lengths).toContain('Hole 3');
    expect(errors.badHoles).toEqual([3]);
});

test('a stroke-index override outside the course is refused', () => {
    const draft = emptyDraft(9);
    draft.name = 'Gul';
    draft.lengths[0]!.strokeIndexOverride = '12';

    const errors = validateTee(draft, 9);
    expect(errors.lengths).toContain('1 to 9');
    expect(errors.badHoles).toEqual([1]);
});

test('the grid has a row per COURSE hole, including the ones the tee never measured', () => {
    // Nine measured holes on an eighteen-hole course is incomplete data, and the
    // nine empty rows are what say so.
    const draft = draftFrom(tee({ holeLengths: lengths(9) }), 18);
    expect(draft.lengths.length).toBe(18);
    expect(draft.lengths[8]!.lengthM).toBe('308');
    expect(draft.lengths[9]!.lengthM).toBe('');
});

// ─── Colour ───

test('a blank colour is null on the wire, not the empty string', () => {
    const draft = emptyDraft(18);
    draft.name = 'Gul';
    draft.colour = '   ';
    expect(teePayload(draft).colour).toBeNull();

    draft.colour = ' Gul ';
    expect(teePayload(draft).colour).toBe('Gul');
});

test('the swatch paints only what it recognises — stored text never reaches the style', () => {
    expect(swatchColour('#ffd400')).toBe('#ffd400');
    expect(swatchColour('Gul')).toBe('#ffd400');
    expect(swatchColour('yellow')).toBe('#ffd400');
    // Anything else gets no swatch at all; the WORD is what carries the answer.
    expect(swatchColour('url(evil)')).toBeNull();
    expect(swatchColour('red; background-image: url(x)')).toBeNull();
    expect(swatchColour(null)).toBeNull();
});

test('a recognised hex reads as its WORD; anything else is printed exactly as stored', () => {
    // The catalog's real rows are hex, and the column exists to name a colour.
    expect(colourWord('#ffd400')).toBe('Gul');
    expect(colourWord('#2a6fd4')).toBe('Blå');
    // Case is not a difference between two colours.
    expect(colourWord('#FFD400')).toBe('Gul');
    // Shorthand is expanded before the lookup, so a palette colour that ever
    // gains a three-digit form cannot be missed. None has one today, which is
    // why this yellow-ish shorthand is nobody's `#ffd400` and prints as stored.
    expect(colourWord('#fd0')).toBe('#fd0');
    // Swedish first: `vit` and `white` share a hex, and this catalog is Swedish.
    expect(colourWord('#f5f5f5')).toBe('Vit');
    // Already a word — left alone, whatever case the club typed it in.
    expect(colourWord('Gul')).toBe('Gul');
    expect(colourWord('Kastanjebrun')).toBe('Kastanjebrun');
    // A hex outside the palette: the stored text is the only honest answer.
    expect(colourWord('#4b2e1f')).toBe('#4b2e1f');
});

// ─── Wording for the list ───

test('rated genders read as words, and an unrated tee says so', () => {
    expect(ratedGendersLabel(tee({ ratings: [] }))).toBe('Not rated');
    expect(
        ratedGendersLabel(
            tee({
                ratings: [
                    { gender: 'M', courseRating: 71.4, slope: 132, par: 72, totalLengthM: 5812 },
                ],
            }),
        ),
    ).toBe('Men');
    expect(
        ratedGendersLabel(
            tee({
                ratings: [
                    { gender: 'M', courseRating: 71.4, slope: 132, par: 72, totalLengthM: 5812 },
                    { gender: 'F', courseRating: 73.9, slope: 128, par: 73, totalLengthM: 5104 },
                ],
            }),
        ),
    ).toBe('Men, Women');
});

test('the total length column prefers the RATED figure and labels the measured one', () => {
    const rated = tee({
        holeLengths: lengths(18),
        ratings: [
            { gender: 'M', courseRating: 71.4, slope: 132, par: 72, totalLengthM: 5812 },
            { gender: 'F', courseRating: 73.9, slope: 128, par: 73, totalLengthM: 5104 },
        ],
    });
    // The rated total is what plays: it is what the scorecard prints and what a
    // handicap is computed against, and it can legitimately differ from the sum.
    expect(totalLengthsLabel(rated)).toBe('Men 5812 m, Women 5104 m');

    const unrated = tee({ holeLengths: lengths(2, 300) });
    expect(totalLengthsLabel(unrated)).toBe('601 m measured');
    expect(totalLengthsLabel(tee())).toBe('');

    // A rated total of 0 is "never recorded", not a 0-metre tee — it falls
    // through to what the holes actually measure rather than printing a false
    // figure.
    const unrecorded = tee({
        holeLengths: lengths(2, 300),
        ratings: [{ gender: 'M', courseRating: 70.7, slope: 127, par: 71, totalLengthM: 0 }],
    });
    expect(totalLengthsLabel(unrecorded)).toBe('601 m measured');
});
