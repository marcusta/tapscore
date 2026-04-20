// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Leaderboard {
    byScoringType: LeaderboardByType[];
    participantResults: ParticipantResult[];
}

export interface LeaderboardByType {
    scoringType: string;
    entries: LeaderboardEntry[];
}

export interface ParticipantResult {
    participantId: string;
    slotIndex: number;
    holes: HoleResult[];
    totals: ({ scoringType: string; value: null | number })[];
    holesPlayed: number;
}

export interface LeaderboardEntry {
    participantId: string;
    position: number;
    total: null | number;
    holesPlayed: number;
}

export interface HoleResult {
    holeNumber: number;
    gross: null | number;
    net: null | number;
    points: null | number;
    note?: string;
}

export interface LeaderboardsApi {
    forRound(input: { roundId: string }): Promise<Leaderboard>;
}

export function createLeaderboardsClient(baseUrl: string): LeaderboardsApi {
    return {
        async forRound(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/leaderboards/for-round${qs ? '?' + qs : ''}` });
        },
    };
}
