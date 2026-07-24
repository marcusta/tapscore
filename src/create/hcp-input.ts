// Handicap-index TEXT handling — the seam between what a user types/sees and
// the number the domain stores. Two conventions meet here:
//
//   - Golf writes a better-than-scratch index with a leading "+" ("+2.4");
//     the domain stores it as a NEGATIVE number (see server/domain/handicap.ts
//     — `PH < 0` is the plus-handicap branch). `Number.parseFloat("+2.4")`
//     would silently read it as a normal 2.4, so the "+" must be mapped to a
//     negation BEFORE numeric parsing.
//   - Swedish (and most European) keyboards produce a decimal COMMA ("18,4");
//     the parser accepts both "," and ".".
//
// Every handicap entry point (create flow, profile, signup, competition guest)
// should parse through here so the two notations work everywhere.

/**
 * Parse user-entered handicap text to the stored numeric index, or null when
 * the text is empty or not a number. "18,4" → 18.4 · "+2.4"/"+2,4" → -2.4 ·
 * "-2.4" (already-stored notation) → -2.4.
 */
export function parseHandicapIndex(raw: string): number | null {
    const text = raw.trim().replace(',', '.');
    if (text === '') return null;
    const plus = text.startsWith('+');
    const n = Number.parseFloat(plus ? text.slice(1) : text);
    if (!Number.isFinite(n)) return null;
    return plus ? -n : n;
}

/**
 * Format a stored index back into golf notation for display/editing:
 * -2.4 → "+2.4", 18.4 → "18.4". The decimal separator stays "." — inputs and
 * the keypad accept both, and toFixed-style locale formatting would round-trip
 * badly through parse.
 */
export function formatHandicapIndex(value: number): string {
    return value < 0 ? `+${String(-value)}` : String(value);
}
