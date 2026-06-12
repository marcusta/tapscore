// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Leaderboard {
    byScoringType: LeaderboardByType[];
    ballResults: BallResult[];
    pairResults: PairResult[];
}

export interface LeaderboardByType {
    slotIndex: number;
    scoringType: string;
    entries: LeaderboardEntry[];
}

export interface BallResult {
    ballId: string;
    slotIndex: number;
    holes: HoleResult[];
    totals: ({ scoringType: string; value: null | number })[];
    holesPlayed: number;
}

export interface PairResult {
    slotIndex: number;
    balls: [string, string];
    holes: PairHoleResult[];
    summary: string;
    result: 'won' | 'lost' | 'halved' | 'in_progress';
    winner: null | string;
}

export interface LeaderboardEntry {
    ballId: string;
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

export interface PairHoleResult {
    holeNumber: number;
    status: null | 'won' | 'lost' | 'halved';
    fromA: null | number;
    fromB: null | number;
    pointsDelta: null | number;
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
