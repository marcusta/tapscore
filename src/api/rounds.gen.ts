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
    status: 'active' | 'not_started' | 'complete';
    latestEventId: null | string;
    name: null | string;
    visibility: 'private' | 'friends' | 'link';
    courseNameSnapshot: null | string;
    completedAt: null | string;
    lastActivityAt?: null | string;
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
    courseHandicap: null | number;
    players: RoundBallPlayer[];
    slots: RoundBallSlot[];
    pending: boolean;
}

export interface CompilerDiagnostic {
    code: string;
    message: string;
    path?: string;
    formatIndex?: number;
    slotIndex?: number;
    formatId?: string;
    teamLabel?: string;
    actual?: number;
    allowedMin?: number;
    allowedMax?: number;
}

export interface FormatSlot {
    slotIndex: number;
    slotDefId: string;
    formatId: string;
    scoringMode: 'custom' | 'stroke_play' | 'stableford' | 'match_play' | 'kopenhamnare' | 'taliban' | 'umbrella' | 'skins';
    teamShape: 'custom' | 'individual' | 'better_ball' | 'four_ball';
    allowancePct: number;
    allowanceConfig: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ upToCh: null | number; pct: number })[] };
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
    handicapIndex: null | number;
    teeName: null | string;
    courseHandicap: null | number;
    pending: boolean;
}

export interface RoundBallSlot {
    slotDefId: string;
    slotIndex: null | number;
    playingHandicap: null | number;
    teamLabel: null | string;
    handicapDerivation: null | HandicapDerivation;
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

export interface HandicapDerivation {
    effectivePh: number;
    steps: ({ kind: 'course_handicap'; producerLabel: string; teeName: null | string; handicapIndex: null | number; slope: null | number; courseRating: null | number; par: null | number; result: number } | { kind: 'team_combination'; parts: { producerLabel: string; ch: number; pct: number }[]; result: number } | { kind: 'allowance'; pct: number; source: 'flat' | 'split'; result: number } | { kind: 'match_delta'; lowestPh: number; ownPh: number; result: number })[];
}

export interface RoundsApi {
    list(): Promise<Round[]>;
    balls(input: { roundId: string }): Promise<RoundBall[]>;
    get(input: { id: string }): Promise<null | Round>;
    create(input: { definition: { courseId: string; playedAt: string; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; startListMode?: 'structured' | 'fixed_slots' | 'open_window'; windowStart?: null | string; windowEnd?: null | string; selfOrganize?: boolean; routeSi?: { mode: 'official' | 'difficulty' | 'custom'; sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number }; routeHandicapPolicy?: { type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean; postingIneligibleReason?: string }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; playHoles?: { id?: string; courseHoleNumber: number; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { teeId: string; lengthM?: number; strokeIndexOverride?: number }[] }[]; producers: ({ id: string; playerRef: { kind: 'player' | 'guest'; id: string }; handicapIndex: number; gender?: 'M' | 'F'; teeId: string; category?: string } | { id: string; placeholder: { label: string; teamRef?: string }; category?: string })[]; ballStrategies: ({ id: string; strategyId: string; derivationConfig: { type: 'single' } | { type: 'avg' } | { type: 'sum_of_ch' } | { type: 'weighted'; lowPct: number; highPct: number } | { type: 'by_rank'; chPcts: number[] } | { type: 'per_producer_pct'; pcts: { [x: string]: number; } }; composition?: { teams: { label: string; producerDefIds: string[] }[] } })[]; playingGroups?: { id?: string; startTime: string; startPlayHoleDefId?: string; startOrdinal?: number; capacity: number; hittingBay?: string; producerDefIds: string[] }[]; slots: ({ id: string; formatId: string; allowanceConfig: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ upToCh: null | number; pct: number })[] }; ballSelector?: { strategyDefIds?: string[]; producerDefIds?: string[] }; teamGrouping?: { teams: { label: string; producerDefIds: string[] }[] }; sideAggregation?: { type: 'best_net' }; formatConfig?: unknown })[] } }): Promise<Round>;
    createFromDraft(input: { draft: { courseId: string; playedAt: string; name?: string; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; route?: { templateId?: string; playHoles?: { id?: string; courseHoleNumber: number; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { teeId: string; lengthM?: number; strokeIndexOverride?: number }[] }[]; routeSi?: { mode: 'official' | 'difficulty' | 'custom'; sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number }; routeHandicapPolicy?: { type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean; postingIneligibleReason?: string }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; playingGroups?: { id?: string; startTime: string; startPlayHoleDefId?: string; startOrdinal?: number; capacity: number; hittingBay?: string; producerDefIds: string[] }[] }; producers: ({ producerDefId: string; playerRef: { kind: 'player' | 'guest'; id: string }; handicapIndex: number; gender?: 'M' | 'F'; teeId: string; category?: string; seat?: { label: string; teamRef?: string } } | { producerDefId: string; placeholder: { label: string; teamRef?: string }; category?: string })[]; teams?: ({ id: string; label?: string; formation?: string; kind?: 'single_ball' | 'multi_ball'; members: ({ producerDefId: string; allowancePct: number } | { teamId: string })[] })[]; formats: ({ formatId: string; id?: string; allowanceConfig?: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ upToCh: null | number; pct: number })[] }; producerDefIds?: string[]; teams?: { label: string; producerDefIds: string[] }[]; formatConfig?: unknown; ballsFrom?: { ref: string }; subjects?: ({ kind: 'player'; producerDefId: string } | { kind: 'team'; teamId: string })[] })[]; playingGroups?: { members: string[]; startTime?: string; startHole?: number }[]; startList?: { groups: 'organized' | 'roster' | 'open'; seats: 'assigned' | 'claimable'; claimBy: 'team' | 'roster' | 'anyone'; window?: { opensAt?: string; closesAt?: string }; maxGroupSize?: number } } }): Promise<{ ok: true; round: Round } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    update(input: { id: string; date?: string; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; startListMode?: 'structured' | 'fixed_slots' | 'open_window'; windowStart?: null | string; windowEnd?: null | string; selfOrganize?: boolean; status?: 'active' | 'not_started' | 'complete' }): Promise<Round>;
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
        async createFromDraft(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/rounds/from-draft`, body: input });
        },
        async update(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/rounds/update`, body: input });
        },
        async remove(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/rounds/${input.id}` });
        },
    };
}
