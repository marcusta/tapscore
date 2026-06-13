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
    playHoles: RoundPlayHole[];
    routeSi: RoundRouteSi;
    routeHandicapPolicy: RoundRoutePolicy;
    routeSections: RoundRouteSection[];
    playingGroups: RoundPlayingGroup[];
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
    slotDefId: string;
    formatId: string;
    scoringMode: 'custom' | 'stroke_play' | 'stableford' | 'match_play' | 'kopenhamnare' | 'skins' | 'taliban' | 'umbrella';
    teamShape: 'custom' | 'individual' | 'better_ball' | 'scramble' | 'foursomes' | 'greensome' | 'four_ball';
    allowancePct: number;
    allowanceConfig: { type: 'flat'; pct: number };
    formatConfig: unknown;
    ballMode: 'own' | 'team';
}

export interface RoundPlayHole {
    id: string;
    playHoleDefId: string;
    ordinal: number;
    courseHoleNumber: number;
    par: number;
    baseStrokeIndex: number;
    tees: RoundPlayHoleTee[];
}

export interface RoundRouteSi {
    mode: 'official' | 'difficulty' | 'custom';
    sourceLabel: null | string;
    sourceVersion: null | string;
    allocationCycleSize: number;
}

export interface RoundRoutePolicy {
    type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit';
    postingEligible: boolean;
    postingIneligibleReason: null | string;
}

export interface RoundRouteSection {
    id: string;
    label: string;
    fromCanonicalOrdinal: number;
    toCanonicalOrdinal: number;
}

export interface RoundPlayingGroup {
    id: string;
    startTime: string;
    capacity: number;
    hittingBay: null | string;
    startPlayHoleId: string;
    startOrdinal: number;
    endPlayHoleId: string;
    endOrdinal: number;
    ballIds: string[];
    playedOrder: RoundGroupPlayedHole[];
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

export interface RoundPlayHoleTee {
    teeRef: string;
    teeName: string;
    lengthM: number;
    strokeIndex: number;
}

export interface RoundGroupPlayedHole {
    playHoleId: string;
    ordinal: number;
    courseHoleNumber: number;
    groupRelativeOrder: number;
}

export interface RoundsApi {
    list(): Promise<Round[]>;
    balls(input: { roundId: string }): Promise<RoundBall[]>;
    get(input: { id: string }): Promise<null | Round>;
    create(input: { definition: { roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; startListMode?: 'structured' | 'fixed_slots' | 'open_window'; windowStart?: null | string; windowEnd?: null | string; selfOrganize?: boolean; routeSi?: { sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number; mode: 'official' | 'difficulty' | 'custom' }; routeHandicapPolicy?: { postingIneligibleReason?: string; type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; playHoles?: { id?: string; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { lengthM?: number; strokeIndexOverride?: number; teeId: string }[]; courseHoleNumber: number }[]; playingGroups?: { id?: string; startPlayHoleDefId?: string; startOrdinal?: number; hittingBay?: string; producerDefIds: string[]; startTime: string; capacity: number }[]; courseId: string; playedAt: string; producers: ({ gender?: 'M' | 'F'; category?: string; id: string; handicapIndex: number; teeId: string; playerRef: { id: string; kind: 'player' | 'guest' } })[]; ballStrategies: ({ composition?: { teams: { label: string; producerDefIds: string[] }[] }; id: string; strategyId: string; derivationConfig: { type: 'single' } | { type: 'avg' } | { type: 'sum_of_ch' } | { type: 'weighted'; lowPct: number; highPct: number } | { type: 'by_rank'; chPcts: number[] } })[]; slots: { ballSelector?: { producerDefIds?: string[]; strategyDefIds?: string[] }; teamGrouping?: { teams: { label: string; producerDefIds: string[] }[] }; formatConfig?: unknown; id: string; formatId: string; allowanceConfig: { type: 'flat'; pct: number } }[] } }): Promise<Round>;
    update(input: { status?: 'not_started' | 'active' | 'complete'; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; startListMode?: 'structured' | 'fixed_slots' | 'open_window'; windowStart?: null | string; windowEnd?: null | string; selfOrganize?: boolean; date?: string; formatSlots?: ({ allowancePct: number; slotIndex: number; scoringMode: 'custom' | 'stroke_play' | 'stableford' | 'match_play' | 'kopenhamnare' | 'skins'; teamShape: 'custom' | 'individual' | 'better_ball' | 'scramble' | 'foursomes' | 'greensome'; scopeConfig: null | { scope?: { participantIds: string[] }; config?: { [x: string]: unknown; } } })[]; id: string }): Promise<Round>;
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
