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
    courseNameSnapshot: null | string;
    formatSlots: FormatSlot[];
}

export interface RoundBall {
    id: string;
    label: null | string;
    courseHandicap: number;
    players: RoundBallPlayer[];
    slots: RoundBallSlot[];
}

export interface FormatSlot {
    slotIndex: number;
    scoringMode: 'stroke_play' | 'stableford' | 'match_play' | 'kopenhamnare' | 'skins' | 'custom' | 'taliban' | 'umbrella';
    teamShape: 'custom' | 'individual' | 'better_ball' | 'scramble' | 'foursomes' | 'greensome' | 'four_ball';
    allowancePct: number;
    scopeConfig: null | FormatSlotConfig;
}

export interface RoundBallPlayer {
    producerDefId: string;
    playerId: null | string;
    guestPlayerId: null | string;
    displayName: string;
    handicapIndex: number;
    teeName: string;
    courseHandicap: number;
}

export interface RoundBallSlot {
    slotDefId: string;
    slotIndex: null | number;
    playingHandicap: number;
    teamLabel: null | string;
}

export interface FormatSlotConfig {
    scope?: { participantIds: string[] };
    config?: Record<string, unknown>;
}

export interface RoundsApi {
    list(): Promise<Round[]>;
    balls(input: { roundId: string }): Promise<RoundBall[]>;
    get(input: { id: string }): Promise<null | Round>;
    create(input: { definition: { roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; startListMode?: 'structured' | 'fixed_slots' | 'open_window'; windowStart?: null | string; windowEnd?: null | string; selfOrganize?: boolean; courseId: string; playedAt: string; producers: ({ gender?: 'M' | 'F'; category?: string; id: string; handicapIndex: number; teeId: string; playerRef: { id: string; kind: 'player' | 'guest' } })[]; ballStrategies: ({ composition?: { teams: { label: string; producerDefIds: string[] }[] }; id: string; strategyId: string; derivationConfig: { type: 'single' } | { type: 'avg' } | { type: 'sum_of_ch' } | { type: 'weighted'; lowPct: number; highPct: number } | { type: 'by_rank'; chPcts: number[] } })[]; slots: { ballSelector?: { producerDefIds?: string[]; strategyDefIds?: string[] }; teamGrouping?: { teams: { label: string; producerDefIds: string[] }[] }; formatConfig?: unknown; id: string; formatId: string; allowanceConfig: { type: 'flat'; pct: number } }[] } }): Promise<Round>;
    update(input: { roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; startListMode?: 'structured' | 'fixed_slots' | 'open_window'; windowStart?: null | string; windowEnd?: null | string; selfOrganize?: boolean; date?: string; status?: 'not_started' | 'active' | 'complete'; formatSlots?: ({ allowancePct: number; slotIndex: number; scoringMode: 'stroke_play' | 'stableford' | 'match_play' | 'kopenhamnare' | 'skins' | 'custom'; teamShape: 'custom' | 'individual' | 'better_ball' | 'scramble' | 'foursomes' | 'greensome'; scopeConfig: null | { scope?: { participantIds: string[] }; config?: { [x: string]: unknown; } } })[]; id: string }): Promise<Round>;
    remove(input: { id: string }): Promise<{ ok: boolean }>;
}

export function createRoundsClient(baseUrl: string): RoundsApi {
    return {
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/rounds` });
        },
        async balls(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/rounds/balls${qs ? '?' + qs : ''}` });
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
