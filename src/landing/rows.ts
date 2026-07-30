// Pure normalisation of the two landing data sources into ONE row shape, so
// the landing + history views render identically whether the viewer is logged
// in (server dashboard) or logged out (device-recent localStorage list).
//
// The shape also satisfies `PartitionableRound` (status / completedAt /
// lastActivityAt), so the partition reads a row directly with an identity
// `get`. No DOM, no fetch — unit-testable.

import { formatLabelFromSlot } from '../round/slot-labels';
import { roleLabel, type MyRoundEntry } from './my-rounds';
import type { DeviceRound } from './device-rounds';

export interface LandingRow {
    /** Stable `$each` key (round id when known, else the token). */
    key: string;
    /** Share token for navigation + delete; null ⇒ row can't be opened/deleted
     *  (a logged-in produced round with no friendly wrapper). */
    token: string | null;
    /** Round id for the delete list-prune; null for a device row (no id known
     *  device-side — delete keys off the token instead). */
    roundId: string | null;
    /** The organizer's name for the round; null ⇒ the row is headed by its
     *  course instead (see `rowLabel`). */
    name: string | null;
    courseName: string;
    status: 'not_started' | 'active' | 'complete';
    completedAt: string | null;
    /** Ongoing-sort key — most-recently-active first. */
    lastActivityAt: string | null;
    /** "Played · Created" tag (logged-in only); null for device rows. */
    roleLabel: string | null;
    /** Round date (logged-in only); null for device rows (not stored). */
    date: string | null;
    /** Joined format labels (logged-in only); null for device rows. */
    formats: string | null;
}

function fromMyRounds(entries: readonly MyRoundEntry[]): LandingRow[] {
    return entries.map((e) => ({
        key: e.round.id,
        token: e.token,
        roundId: e.round.id,
        name: e.round.name,
        courseName: e.round.courseNameSnapshot ?? '',
        status: e.round.status,
        completedAt: e.round.completedAt,
        // No per-round activity timestamp on the round payload; the round DATE
        // is the best available recency proxy for the ongoing sort.
        lastActivityAt: e.round.date,
        roleLabel: roleLabel(e) || null,
        date: e.round.date,
        formats: e.round.formatSlots.map(formatLabelFromSlot).join(' · '),
    }));
}

function fromDeviceRounds(entries: readonly DeviceRound[]): LandingRow[] {
    return entries.map((e) => ({
        key: e.token,
        token: e.token,
        roundId: null,
        name: e.name ?? null,
        courseName: e.courseName,
        status: e.status,
        completedAt: e.completedAt ?? null,
        // Device rows carry a real last-seen timestamp — the natural sort key.
        lastActivityAt: e.lastSeenAt,
        roleLabel: null,
        date: e.date ?? null,
        formats: null,
    }));
}

/** The row's headline: the round's own name when it has one, else the course
 *  (else a bare "Round" for a device row recorded before its preview landed). */
export function rowLabel(row: Pick<LandingRow, 'name' | 'courseName'>): string {
    const name = (row.name ?? '').trim();
    if (name) return name;
    return row.courseName || 'Round';
}

/** The course as a SUB-title — present only when the headline is the round's
 *  own name. A row with no name is already headed by its course, and printing
 *  it twice is worse than not printing it at all. */
export function rowCourseSubtitle(
    row: Pick<LandingRow, 'name' | 'courseName'>,
): string | null {
    if (!row.courseName) return null;
    return rowLabel(row) === row.courseName ? null : row.courseName;
}

/** The row's date line, in the READER's locale. A round shared across a group
 *  must not show a Swedish date to an American phone, so the `yyyy-MM-dd` is
 *  formatted here rather than printed raw — parsed at UTC noon so no timezone
 *  can shift it onto the day before. Anything unparseable passes through. */
export function formatRowDate(
    date: string | null,
    locale: string = typeof navigator === 'undefined' ? 'en' : navigator.language,
): string {
    if (!date) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
        new Date(`${date}T12:00:00Z`),
    );
}

export const landingRows = { fromMyRounds, fromDeviceRounds };
