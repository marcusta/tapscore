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
        courseName: e.courseName,
        status: e.status,
        completedAt: e.completedAt ?? null,
        // Device rows carry a real last-seen timestamp — the natural sort key.
        lastActivityAt: e.lastSeenAt,
        roleLabel: null,
        date: null,
        formats: null,
    }));
}

export const landingRows = { fromMyRounds, fromDeviceRounds };
