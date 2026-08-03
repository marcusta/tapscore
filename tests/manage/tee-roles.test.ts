import './harness';
import { expect, test } from 'bun:test';
import type { CourseTeeRole, TeeRole } from '../../src/api/courses.gen';
import type { Tee } from '../../src/api/tees.gen';
import {
    ratedTees,
    refusalCopy,
    resolutionSentence,
    resolveRole,
    teeOptionLabel,
    teeOptions,
} from '../../manage/courses/tee-roles';

// The rules behind the tee-role matrix (spec §3.6), asserted without a DOM:
// which tees a cell may offer, what round setup would ACTUALLY do with the
// mappings as they stand — which is not the same question as what the cell says,
// because an empty cell still resolves through the fallback chain — and which
// server refusals this surface words for itself rather than repeating.

const MEN = { gender: 'M' as const, courseRating: 71.4, slope: 132, par: 72, totalLengthM: 5812 };
const WOMEN = { gender: 'F' as const, courseRating: 73.9, slope: 128, par: 73, totalLengthM: 5104 };

function tee(over: Partial<Tee> = {}): Tee {
    return {
        id: 't1',
        courseId: 'k1',
        name: 'Gul',
        colour: null,
        holeLengths: [],
        ratings: [MEN, WOMEN],
        ...over,
    };
}

const role = (roleKey: string, displayName: string, sortOrder = 0): TeeRole => ({
    roleKey,
    displayName,
    sortOrder,
});

const map = (roleKey: string, gender: 'M' | 'F', teeId: string): CourseTeeRole => ({
    courseId: 'k1',
    roleKey,
    gender,
    teeId,
});

const COURSE: Tee[] = [
    tee({ id: 'vit', name: 'Vit', colour: '#f5f5f5', ratings: [MEN] }),
    tee({ id: 'gul', name: 'Gul', colour: '#ffd400', ratings: [MEN, WOMEN] }),
    tee({ id: 'rod', name: 'Röd', colour: '#d4332a', ratings: [WOMEN] }),
    tee({ id: 'orange', name: 'Orange', colour: '#e8830c', ratings: [WOMEN] }),
];

// ─── What a cell may offer ───

test('only tees rated for that gender are offered, and the two genders differ', () => {
    expect(ratedTees(COURSE, 'M').map((t) => t.id)).toEqual(['vit', 'gul']);
    expect(ratedTees(COURSE, 'F').map((t) => t.id)).toEqual(['gul', 'rod', 'orange']);
});

test('"Not set" leads every cell — an unmapped role is an answer, not a gap', () => {
    const options = teeOptions(COURSE, 'M');
    expect(options[0]).toEqual({ value: '', label: 'Not set' });
    expect(options.map((option) => option.label)).toEqual(['Not set', 'Vit', 'Gul']);
});

test('a column with no rated tee offers "Not set" alone rather than an unusable list', () => {
    expect(teeOptions([tee({ id: 'vit', name: 'Vit', ratings: [MEN] })], 'F')).toEqual([
        { value: '', label: 'Not set' },
    ]);
});

test('server order is kept, so the dropdown reads like the tees table above it', () => {
    const reversed = [...COURSE].reverse();
    expect(teeOptions(reversed, 'F').map((option) => option.label)).toEqual([
        'Not set',
        'Orange',
        'Röd',
        'Gul',
    ]);
});

test('a stored hex reads as its word, and a colour the name already says is not repeated', () => {
    expect(teeOptionLabel(tee({ name: 'Championship', colour: '#1c1c1c' }))).toBe(
        'Championship · Svart',
    );
    expect(teeOptionLabel(tee({ name: 'Gul', colour: '#ffd400' }))).toBe('Gul');
    expect(teeOptionLabel(tee({ name: 'Gul', colour: null }))).toBe('Gul');
});

// ─── What round setup would do ───

test('a mapped row resolves to its own tee', () => {
    const mappings = [map('club', 'M', 'vit')];
    expect(resolveRole(COURSE, mappings, 'club', 'M')).toEqual({ via: 'role', teeName: 'Vit' });
});

test('an empty row falls back to the Club row, and says so', () => {
    const mappings = [map('club', 'M', 'vit')];
    expect(resolveRole(COURSE, mappings, 'tournament', 'M')).toEqual({
        via: 'club',
        teeName: 'Vit',
    });
});

test('with nothing mapped at all the tee is picked by name convention', () => {
    // Swedish convention: Gul for men, Röd for women.
    expect(resolveRole(COURSE, [], 'club', 'M')).toEqual({ via: 'convention', teeName: 'Gul' });
    expect(resolveRole(COURSE, [], 'club', 'F')).toEqual({ via: 'convention', teeName: 'Röd' });
});

test('a gender with no rated tee anywhere resolves to nothing', () => {
    const menOnly = [tee({ id: 'vit', name: 'Vit', ratings: [MEN] })];
    expect(resolveRole(menOnly, [], 'club', 'F')).toEqual({ via: 'none' });
});

test('every provenance is a sentence naming the role, the players and the tee', () => {
    const club = role('club', 'Club');
    expect(resolutionSentence(club, 'M', { via: 'role', teeName: 'Gul' })).toBe(
        'A Club / Men round plays from Gul today.',
    );
    expect(
        resolutionSentence(role('tournament', 'Tournament'), 'F', { via: 'club', teeName: 'Röd' }),
    ).toBe(
        'A Tournament / Women round plays from Röd today, taken from the Club row because this row is empty.',
    );
    expect(resolutionSentence(club, 'F', { via: 'convention', teeName: 'Röd' })).toBe(
        'A Club / Women round plays from Röd today, picked by tee name because no row above applies.',
    );
    expect(resolutionSentence(club, 'F', { via: 'none' })).toBe(
        'A Club / Women round has no tee to start from — no tee on this course is rated for women.',
    );
});

test('a role the client has never heard of is worded from the catalog, not a lookup table', () => {
    const junior = role('junior', 'Junior');
    expect(resolutionSentence(junior, 'M', resolveRole(COURSE, [map('junior', 'M', 'gul')], 'junior', 'M'))).toBe(
        'A Junior / Men round plays from Gul today.',
    );
});

// ─── Refusals this surface can provoke ───

test('the two refusals this matrix can cause are said in its own words', () => {
    expect(refusalCopy('tee has no rating for the mapped gender', 'F')).toBe(
        'That tee has no rating for women any more, so it cannot be chosen here. Rate it above, or pick another tee.',
    );
    // Same rule, said to the column it happened in.
    expect(refusalCopy('tee has no rating for the mapped gender', 'M')).toContain(
        'no rating for men',
    );
    expect(refusalCopy('tee must belong to the mapped course', 'M')).toBe(
        'That tee is no longer one of this course’s tees. Reload the page to see the tees as they stand.',
    );
});

test('a sentence carrying field details still matches — the match is on containment', () => {
    expect(
        refusalCopy('tee has no rating for the mapped gender: teeId — not rated', 'F'),
    ).toContain('Rate it above');
});

test('anything else is the server’s to word, and comes back untouched', () => {
    expect(refusalCopy('A course with this name already exists in the club.', 'M')).toBe(
        'A course with this name already exists in the club.',
    );
    expect(refusalCopy('Your session expired. Sign in again to continue.', 'F')).toBe(
        'Your session expired. Sign in again to continue.',
    );
});
