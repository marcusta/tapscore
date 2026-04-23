// Low-level render helpers: HTML escaping, cell formatters, hole grouping,
// strokes-given allocation, pair-side scorecard row filtering.

import type { ScorecardHole } from '../../server/services/scorecard.service';
import type { CourseHole } from '../../server/domain/format';
import type { BallProducerInfo } from './types';

export function esc(s: unknown): string {
    return String(s ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

export function short(id: string): string {
    return id.slice(0, 8);
}

export function strokesCell(strokes: number | null | undefined): string {
    if (strokes === null || strokes === undefined) return '<span class="dnp">–</span>';
    if (strokes === 0) return '<span class="pickup">P</span>';
    return String(strokes);
}

export function netCell(net: number | null): string {
    if (net === null) return '<span class="dnp">–</span>';
    return String(net);
}

export function numericCell(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatEventMetadata(metadata: Record<string, unknown> | null): string {
    if (metadata === null) return '<span class="muted">—</span>';
    const parts: string[] = [];
    for (const [k, v] of Object.entries(metadata)) {
        if (typeof v === 'boolean') parts.push(`${esc(k)}:${v ? '✓' : '✗'}`);
        else parts.push(`${esc(k)}:${esc(String(v))}`);
    }
    return `<code>${parts.join(' ')}</code>`;
}

export interface HoleGroup {
    label: string; // "OUT" | "IN" | "TOT"
    holes: CourseHole[];
}

/**
 * For an 18-hole round (holes from both halves): OUT + IN + TOT columns.
 * For a 9-hole round (only one half): a single TOT column.
 * Keeps the scorecard visually honest — no 9 empty IN cells on a front_9.
 */
export function splitHoleGroups(courseHoles: CourseHole[]): HoleGroup[] {
    const front = courseHoles.filter((h) => h.holeNumber <= 9);
    const back = courseHoles.filter((h) => h.holeNumber > 9);
    if (front.length > 0 && back.length > 0) {
        return [
            { label: 'OUT', holes: front },
            { label: 'IN', holes: back },
        ];
    }
    return [{ label: 'TOT', holes: courseHoles }];
}

export function strokesGivenMap(
    playingHandicap: number | null,
    courseHoles: CourseHole[],
): Map<number, number> {
    const m = new Map<number, number>();
    const ph = playingHandicap ?? 0;
    const n = courseHoles.length;
    const baseline = n > 0 ? Math.floor(ph / n) : 0;
    const extras = n > 0 ? ((ph % n) + n) % n : 0;
    for (const ch of courseHoles) {
        const extra = ch.strokeIndex <= extras ? 1 : 0;
        m.set(ch.holeNumber, baseline + extra);
    }
    return m;
}

export type PairScorecardKind =
    | 'match_play_individual'
    | 'match_play_better_ball'
    | 'taliban_better_ball';

export function pairSideScorecardRows(
    kind: PairScorecardKind,
    producer: BallProducerInfo,
    allRows: ScorecardHole[],
): ScorecardHole[] {
    if (kind === 'match_play_individual') {
        // Individual match-play events are recorded against the ball
        // with null source columns, so the scorecard must read the shared
        // ball rows instead of filtering by player id.
        return allRows.filter(
            (h) => h.sourcePlayerId === null && h.sourceGuestPlayerId === null,
        );
    }
    return allRows.filter((h) => {
        if (producer.playerId) return h.sourcePlayerId === producer.playerId;
        if (producer.guestPlayerId) return h.sourceGuestPlayerId === producer.guestPlayerId;
        return h.sourcePlayerId === null && h.sourceGuestPlayerId === null;
    });
}

export function titleCaseWords(raw: string): string {
    return raw
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
