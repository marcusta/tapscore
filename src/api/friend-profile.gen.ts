// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface FriendProfileView {
    player: FriendProfileIdentity;
    roundsTotal: number;
    roundsThisYear: number;
    coursesTotal: number;
    recentRounds: FriendProfileRoundEntry[];
}

export interface FriendProfileRoundPage {
    rounds: FriendProfileRoundEntry[];
    nextCursor: null | string;
    hasMore: boolean;
}

export interface FriendProfileCoursePage {
    courses: FriendProfileCourseEntry[];
    hasMore: boolean;
}

export interface FriendProfileIdentity {
    id: string;
    username: string;
    displayName: string;
    handicapIndex: null | number;
    homeClubName: null | string;
}

export interface FriendProfileRoundEntry {
    roundId: string;
    name: null | string;
    courseName: null | string;
    date: string;
    status: 'active' | 'not_started' | 'complete';
    holeCount: number;
    holesPlayed: number;
    scoreToPar: null | number;
}

export interface FriendProfileCourseEntry {
    courseId: string;
    courseName: null | string;
    roundsPlayed: number;
    lastPlayedAt: string;
}

export interface FriendProfileApi {
    profile(input: { playerId: string }): Promise<FriendProfileView>;
    rounds(input: { playerId: string; cursor?: string; limit?: number }): Promise<FriendProfileRoundPage>;
    courses(input: { playerId: string }): Promise<FriendProfileCoursePage>;
}

export function createFriendProfileClient(baseUrl: string): FriendProfileApi {
    return {
        async profile(input) {
            const pathParams = new Set(['playerId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/friends/${input.playerId}/profile${qs ? '?' + qs : ''}` });
        },
        async rounds(input) {
            const pathParams = new Set(['playerId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/friends/${input.playerId}/rounds${qs ? '?' + qs : ''}` });
        },
        async courses(input) {
            const pathParams = new Set(['playerId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/friends/${input.playerId}/courses${qs ? '?' + qs : ''}` });
        },
    };
}
