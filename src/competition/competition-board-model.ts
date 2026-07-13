import type { CompetitionRankedEntry } from '../api/competitions.gen';

export interface CompetitionRoundColumn {
    roundNumber: number;
    postCut: boolean;
}

/**
 * The framework's keyed list retains an existing node when its key is stable.
 * Include all rendered inputs so refreshed results replace stale row closures.
 */
export function competitionBoardRowKey(
    entry: CompetitionRankedEntry,
    points: number | null,
    columns: CompetitionRoundColumn[],
): string {
    return JSON.stringify({ entry, points, columns });
}

/** Values in one participant's auditable round arithmetic line. */
export function arithmeticParts(entry: CompetitionRankedEntry): Array<{
    text: string;
    dropped: boolean;
}> {
    return entry.rounds
        .filter((cell) => cell.value !== null)
        .map((cell) => ({
            text: String(cell.value),
            dropped: cell.status === 'dropped',
        }));
}
