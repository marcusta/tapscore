// Pure list derivations for round deletion (no DOM, no fetch — unit-testable).

/**
 * The list without the deleted round, keyed by `round.id`. Works across both
 * landing halves — the public list (`{ friendlyRound, round }`) and the
 * "My rounds" dashboard entries — since every shape carries `round.id`.
 * Returns the SAME array instance when nothing matched, so signal setters
 * see an unchanged value for a no-op delete.
 */
export function withoutRound<T extends { round: { id: string } }>(
    list: T[],
    roundId: string,
): T[] {
    return list.some((item) => item.round.id === roundId)
        ? list.filter((item) => item.round.id !== roundId)
        : list;
}
