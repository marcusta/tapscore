// Low-level render helpers: HTML escaping, cell formatters, hole grouping,
// strokes-given allocation, pair-side scorecard row filtering.

import type { CourseHole } from './types';

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

export function titleCaseWords(raw: string): string {
    return raw
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
