// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Participant {
    id: string;
    roundId: string;
    teamLabel: null | string;
    categorySnapshot: null | string;
    teeIdSnapshot: null | string;
    handicapIndexSnapshot: null | number;
    courseHandicapSnapshot: null | number;
    playingHandicapSnapshot: null | number;
    isLocked: boolean;
    isDq: boolean;
    adminModifiedBy: null | string;
    adminModifiedAt: null | string;
    adminNotes: null | string;
    players: ParticipantPlayerLink[];
}

export interface ParticipantPlayerLink {
    id: string;
    participantId: string;
    playerId: null | string;
    guestPlayerId: null | string;
    handicapIndexSnapshot: null | number;
    courseHandicapSnapshot: null | number;
    playingHandicapSnapshot: null | number;
}

export interface ParticipantsApi {
    listByRound(input: { roundId: string }): Promise<Participant[]>;
    get(input: { id: string }): Promise<null | Participant>;
    create(input: { teamLabel?: null | string; categorySnapshot?: null | string; snapshot?: { handicapIndex?: number; allowancePct?: number; fromPlayerId?: string; teeId: string; gender: 'M' | 'F' }; players?: { playerId?: string; guestPlayerId?: string }[]; roundId: string }): Promise<Participant>;
    addPlayer(input: { playerId: string; participantId: string }): Promise<ParticipantPlayerLink>;
    addGuest(input: { guestPlayerId: string; participantId: string }): Promise<ParticipantPlayerLink>;
    listFor(input: { participantId: string }): Promise<ParticipantPlayerLink[]>;
    remove(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createParticipantsClient(baseUrl: string): ParticipantsApi {
    return {
        async listByRound(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/participants/by-round${qs ? '?' + qs : ''}` });
        },
        async get(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/participants/get${qs ? '?' + qs : ''}` });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/participants`, body: input });
        },
        async addPlayer(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/participants/add-player`, body: input });
        },
        async addGuest(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/participants/add-guest`, body: input });
        },
        async listFor(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/participants/players${qs ? '?' + qs : ''}` });
        },
        async remove(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/participants/${input.id}` });
        },
    };
}
