/**
 * Match-play handicap normalisation: the lowest playing handicap in the
 * match plays off 0, and everyone else receives only the difference to that
 * lowest marker.
 *
 * Examples:
 *   [2, 14]   -> [0, 12]
 *   [-1, -1]  -> [0, 0]
 *   [5, null] -> [5, 0]  (null currently behaves like scratch)
 */
export function normalizeMatchPlayHandicaps(
    playingHandicaps: Array<number | null>,
): number[] {
    if (playingHandicaps.length === 0) return [];
    const resolved = playingHandicaps.map((ph) => ph ?? 0);
    const min = Math.min(...resolved);
    return resolved.map((ph) => ph - min);
}
