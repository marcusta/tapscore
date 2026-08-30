/**
 * Distance ordering for the course picker (pure — no DOM, no geolocation).
 *
 * The catalog stays grouped by club in the picker, so ordering works on CLUBS:
 * a club sorts by its nearest course, clubs without any positioned course keep
 * the server's club-name order and go last. Within a club the server's course
 * order is kept — a club's courses share a site, so ranking them by metres
 * would only shuffle names the golfer knows by heart.
 */

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

/** What distance logic needs from a `SetupCourse`. */
export interface LocatableCourse {
    clubName: string;
    latitude: number | null;
    longitude: number | null;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = rad(b.latitude - a.latitude);
    const dLon = rad(b.longitude - a.longitude);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function courseKm(course: LocatableCourse, pos: GeoPoint): number | null {
    if (course.latitude === null || course.longitude === null) return null;
    return haversineKm(pos, { latitude: course.latitude, longitude: course.longitude });
}

/**
 * The distance shown next to a club header: the club's nearest course. Null
 * when no course of the club has a position.
 */
export function clubDistanceKm(
    courses: LocatableCourse[],
    clubName: string,
    pos: GeoPoint,
): number | null {
    let min: number | null = null;
    for (const c of courses) {
        if (c.clubName !== clubName) continue;
        const km = courseKm(c, pos);
        if (km !== null && (min === null || km < min)) min = km;
    }
    return min;
}

/**
 * The catalog re-ordered for a known position: clubs by their nearest course,
 * position-less clubs after them in their incoming (club-name) order, courses
 * within a club untouched. A null position returns the input untouched.
 */
export function orderByClubDistance<T extends LocatableCourse>(
    courses: T[],
    pos: GeoPoint | null,
): T[] {
    if (pos === null) return courses;
    const clubs: string[] = [];
    for (const c of courses) if (!clubs.includes(c.clubName)) clubs.push(c.clubName);
    const rank = new Map<string, { km: number | null; incoming: number }>();
    clubs.forEach((club, i) => rank.set(club, { km: clubDistanceKm(courses, club, pos), incoming: i }));
    const ordered = [...clubs].sort((a, b) => {
        const ra = rank.get(a)!;
        const rb = rank.get(b)!;
        if (ra.km !== null && rb.km !== null) return ra.km - rb.km;
        if (ra.km !== null) return -1;
        if (rb.km !== null) return 1;
        return ra.incoming - rb.incoming;
    });
    const out: T[] = [];
    for (const club of ordered) for (const c of courses) if (c.clubName === club) out.push(c);
    return out;
}

/** The positioned course closest to `pos`; null when none has a position. */
export function nearestCourse<T extends LocatableCourse>(courses: T[], pos: GeoPoint): T | null {
    let best: T | null = null;
    let bestKm = Infinity;
    for (const c of courses) {
        const km = courseKm(c, pos);
        if (km !== null && km < bestKm) {
            best = c;
            bestKm = km;
        }
    }
    return best;
}

/**
 * A distance as the picker words it: metres under a kilometre, one decimal up
 * to ten, whole kilometres beyond ("540 m", "2.3 km", "23 km").
 */
export function distanceLabel(km: number): string {
    if (km < 1) return `${Math.round(km * 100) * 10} m`;
    if (km < 10) return `${(Math.round(km * 10) / 10).toFixed(1)} km`;
    return `${Math.round(km)} km`;
}
