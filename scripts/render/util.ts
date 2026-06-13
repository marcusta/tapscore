// Low-level render helpers: HTML escaping, cell formatters, occurrence
// labelling, strokes-given allocation, pair-side scorecard row filtering.

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

/**
 * English ordinal word for a 1-based occurrence index: 1 → "1st",
 * 2 → "2nd", 3 → "3rd", 4 → "4th", … (handles the 11th/12th/13th
 * exceptions). Used to disambiguate repeated-hole occurrence labels.
 */
export function ordinalWord(n: number): string {
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
    switch (n % 10) {
        case 1:
            return `${n}st`;
        case 2:
            return `${n}nd`;
        case 3:
            return `${n}rd`;
        default:
            return `${n}th`;
    }
}

export function titleCaseWords(raw: string): string {
    return raw
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
