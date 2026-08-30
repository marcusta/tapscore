import { expect, test } from 'bun:test';
import {
    clubDistanceKm,
    distanceLabel,
    haversineKm,
    nearestCourse,
    orderByClubDistance,
} from '../../src/create/course-distance';

// Pure distance logic for the course picker: club-grouped ordering, nearest
// course, and the worded distance labels. No DOM, no geolocation.

const stockholm = { latitude: 59.3293, longitude: 18.0686 };

function course(clubName: string, name: string, latitude: number | null, longitude: number | null) {
    return { clubName, name, latitude, longitude };
}

test('haversineKm: Stockholm to Göteborg is ~397 km', () => {
    const km = haversineKm(stockholm, { latitude: 57.7089, longitude: 11.9746 });
    expect(km).toBeGreaterThan(390);
    expect(km).toBeLessThan(405);
});

test('orderByClubDistance: null position returns the input untouched', () => {
    const courses = [course('B klubb', 'B1', 59, 18), course('A klubb', 'A1', 57, 12)];
    expect(orderByClubDistance(courses, null)).toEqual(courses);
});

test('orderByClubDistance: clubs sort by their nearest course, courses within a club keep order', () => {
    const courses = [
        course('Fjärran GK', 'Norra', 57.7, 11.97),
        course('Fjärran GK', 'Södra', 57.71, 11.98),
        course('Nära GK', 'Banan', 59.33, 18.07),
    ];
    const ordered = orderByClubDistance(courses, stockholm);
    expect(ordered.map((c) => c.name)).toEqual(['Banan', 'Norra', 'Södra']);
});

test('orderByClubDistance: clubs without any position go last, in incoming order', () => {
    const courses = [
        course('A okänd', 'A1', null, null),
        course('B okänd', 'B1', null, null),
        course('Nära GK', 'Banan', 59.33, 18.07),
    ];
    const ordered = orderByClubDistance(courses, stockholm);
    expect(ordered.map((c) => c.clubName)).toEqual(['Nära GK', 'A okänd', 'B okänd']);
});

test('clubDistanceKm: the club distance is its nearest course; null when unpositioned', () => {
    const courses = [
        course('Klubben', 'Långt', 57.7, 11.97),
        course('Klubben', 'Nära', 59.33, 18.07),
        course('Okänd', 'X', null, null),
    ];
    const km = clubDistanceKm(courses, 'Klubben', stockholm);
    expect(km).not.toBeNull();
    expect(km!).toBeLessThan(1);
    expect(clubDistanceKm(courses, 'Okänd', stockholm)).toBeNull();
});

test('nearestCourse: closest positioned course wins; all-unpositioned is null', () => {
    const far = course('Fjärran GK', 'Norra', 57.7, 11.97);
    const near = course('Nära GK', 'Banan', 59.33, 18.07);
    expect(nearestCourse([far, near, course('Okänd', 'X', null, null)], stockholm)).toBe(near);
    expect(nearestCourse([course('Okänd', 'X', null, null)], stockholm)).toBeNull();
});

test('distanceLabel: metres under 1 km, one decimal to 10 km, whole km beyond', () => {
    expect(distanceLabel(0.54)).toBe('540 m');
    expect(distanceLabel(0.049)).toBe('50 m');
    expect(distanceLabel(2.34)).toBe('2.3 km');
    expect(distanceLabel(9.96)).toBe('10.0 km');
    expect(distanceLabel(23.4)).toBe('23 km');
});
