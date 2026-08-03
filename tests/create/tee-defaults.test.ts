import { expect, test } from 'bun:test';
import type { CourseTeeRole, Tee } from '../../src/api/setup.gen';
import { resolveDefaultTee, sortTees } from '../../src/create/tee-defaults';

function tee(name: string, ratings: Tee['ratings'] = [{ gender: 'M', courseRating: 72, slope: 113, par: 72, totalLengthM: 5700 }]): Tee {
    return { id: name, courseId: 'course-1', name, colour: null, holeLengths: [], ratings };
}

test('sorts Swedish colours and numeric tees from long to short', () => {
    expect(sortTees(['Blå', 'Gul', 'Orange', 'Röd', 'Vit'].map((name) => tee(name))).map((item) => item.name)).toEqual([
        'Vit', 'Gul', 'Blå', 'Röd', 'Orange',
    ]);
    expect(sortTees(['53', 'Gul', '58', 'Röd'].map((name) => tee(name))).map((item) => item.name)).toEqual([
        '58', '53', 'Gul', 'Röd',
    ]);
});

test('resolves preferred role, then club role, then Gul/Röd convention', () => {
    const black = tee('Svart');
    const yellow = tee('Gul');
    const red = tee('Röd', [{ gender: 'F', courseRating: 72, slope: 113, par: 72, totalLengthM: 5000 }]);
    const tees = [black, yellow, red];
    const mappings: CourseTeeRole[] = [
        { courseId: 'course-1', roleKey: 'tournament', gender: 'M', teeId: black.id },
        { courseId: 'course-1', roleKey: 'club', gender: 'M', teeId: yellow.id },
    ];

    expect(resolveDefaultTee(tees, mappings, 'M', 'tournament')).toBe(black.id);
    expect(resolveDefaultTee(tees, mappings, 'M', 'beginner')).toBe(yellow.id);
    expect(resolveDefaultTee(tees, [], 'M')).toBe(yellow.id);
    expect(resolveDefaultTee(tees, [], 'F')).toBe(red.id);
});
