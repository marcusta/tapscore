import type { SeriesSummary } from '../api/series.gen';
import type { DeviceSeries } from './device-series';

// Pure merge of the two team-event sources into one list: the server list
// (owned, admin-granted, or a member of a team) and the events opened on this
// device. Deduped by share token; the server's name wins over a stale device
// copy. Server rows first (newest created first, the server's order), then the
// device-only rows by last sighting.

export interface SeriesRow {
    token: string;
    name: string;
}

export function mergeSeriesLists(
    server: readonly SeriesSummary[],
    device: readonly DeviceSeries[],
): SeriesRow[] {
    const rows: SeriesRow[] = server.map((s) => ({ token: s.shareToken, name: s.name }));
    const seen = new Set(rows.map((r) => r.token));
    for (const d of device) {
        if (seen.has(d.token)) continue;
        seen.add(d.token);
        rows.push({ token: d.token, name: d.name });
    }
    return rows;
}
