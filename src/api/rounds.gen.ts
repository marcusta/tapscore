// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Round {
    id: string;
    courseId: string;
    date: string;
    roundType: 'full_18' | 'front_9' | 'back_9' | 'custom_holes';
    venueType: 'outdoor' | 'indoor';
    startListMode: 'structured' | 'fixed_slots' | 'open_window';
    windowStart: null | string;
    windowEnd: null | string;
    selfOrganize: boolean;
    status: 'not_started' | 'active' | 'complete';
    latestEventId: null | string;
    formatSlots: FormatSlot[];
}

export interface FormatSlot {
    slotIndex: number;
    scoringMode: 'stroke_play' | 'stableford' | 'match_play' | 'skins' | 'custom';
    teamShape: 'custom' | 'individual' | 'better_ball' | 'scramble' | 'foursomes' | 'greensome';
    allowancePct: number;
    scopeConfig: unknown;
}

export interface RoundsApi {
    list(): Promise<Round[]>;
    get(input: { id: string }): Promise<null | Round>;
    create(input: { windowStart?: null | string; windowEnd?: null | string; selfOrganize?: boolean; courseId: string; date: string; roundType: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType: 'outdoor' | 'indoor'; startListMode: 'structured' | 'fixed_slots' | 'open_window'; formatSlots: ({ allowancePct: number; slotIndex: number; scoringMode: 'stroke_play' | 'stableford' | 'match_play' | 'skins' | 'custom'; teamShape: 'custom' | 'individual' | 'better_ball' | 'scramble' | 'foursomes' | 'greensome'; scopeConfig: unknown })[] }): Promise<Round>;
    update(input: { date?: string; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; startListMode?: 'structured' | 'fixed_slots' | 'open_window'; windowStart?: null | string; windowEnd?: null | string; selfOrganize?: boolean; formatSlots?: ({ allowancePct: number; slotIndex: number; scoringMode: 'stroke_play' | 'stableford' | 'match_play' | 'skins' | 'custom'; teamShape: 'custom' | 'individual' | 'better_ball' | 'scramble' | 'foursomes' | 'greensome'; scopeConfig: unknown })[]; status?: 'not_started' | 'active' | 'complete'; id: string }): Promise<Round>;
    remove(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createRoundsClient(baseUrl: string): RoundsApi {
    return {
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/rounds` });
        },
        async get(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/rounds/get${qs ? '?' + qs : ''}` });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/rounds`, body: input });
        },
        async update(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/rounds/update`, body: input });
        },
        async remove(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/rounds/${input.id}` });
        },
    };
}
