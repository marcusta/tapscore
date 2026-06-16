// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface FriendlyRound {
    id: string;
    roundId: string;
    shareToken: string;
    creatorPlayerId: null | string;
    createdAt: string;
}

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

export interface CompilerDiagnostic {
    code: string;
    message: string;
    path?: string;
}

export interface RoundBall {
    id: string;
    label: null | string;
    courseHandicap: number;
    players: RoundBallPlayer[];
    slots: RoundBallSlot[];
}

export interface Scorecard {
    ballId: string;
    holes: ScorecardHole[];
}

export interface AppendResult {
    event: ScoreEvent;
    inserted: boolean;
}

export interface FormatSlot {
    slotIndex: number;
    slotDefId: string;
    formatId: string;
    scoringMode: 'custom' | 'stroke_play' | 'stableford' | 'match_play' | 'kopenhamnare' | 'taliban' | 'umbrella' | 'skins';
    teamShape: 'custom' | 'individual' | 'better_ball' | 'four_ball' | 'scramble' | 'foursomes' | 'greensome';
    allowancePct: number;
    allowanceConfig: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ pct: number; upToCh: null | number })[] };
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

export interface ScorecardHole {
    playHoleId: string;
    holeNumber: number;
    courseHoleNumber: number;
    canonicalOrdinal: number;
    occurrenceLabel: string;
    strokes: null | number;
    recordedBy: null | string;
    recordedAt: string;
    sourcePlayerId: null | string;
    sourceGuestPlayerId: null | string;
    metadata?: null | Record<string, unknown>;
}

export interface ScoreEvent {
    id: string;
    roundId: string;
    ballId: string;
    playHoleId: string;
    strokes: null | number;
    eventType: 'score_entered' | 'score_cleared' | 'score_confirmed' | 'manual_override';
    recordedByPlayerId: null | string;
    recordedAt: string;
    clientEventId: string;
    sourcePlayerId: null | string;
    sourceGuestPlayerId: null | string;
    metadata: null | Record<string, unknown>;
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

export interface FriendlyRoundsApi {
    list(): Promise<{ friendlyRound: FriendlyRound; round: Round }[]>;
    create(input: { draft: { route?: { playHoles?: { id?: string; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { lengthM?: number; strokeIndexOverride?: number; teeId: string }[]; courseHoleNumber: number }[]; routeSi?: { sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number; mode: 'official' | 'difficulty' | 'custom' }; routeHandicapPolicy?: { postingIneligibleReason?: string; type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; templateId?: string; playingGroups?: { id?: string; startPlayHoleDefId?: string; startOrdinal?: number; hittingBay?: string; startTime: string; capacity: number; producerDefIds: string[] }[] }; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; courseId: string; playedAt: string; producers: ({ gender?: 'M' | 'F'; category?: string; teeId: string; handicapIndex: number; producerDefId: string; playerRef: { id: string; kind: 'player' | 'guest' } })[]; formats: ({ producerDefIds?: string[]; allowanceConfig?: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ pct: number; upToCh: null | number })[] }; teams?: { label: string; producerDefIds: string[] }[]; formatConfig?: unknown; formatId: string })[] } }): Promise<{ ok: true; round: Round; friendlyRound: FriendlyRound } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    byToken(input: { token: string }): Promise<{ friendlyRound: FriendlyRound; round: Round }>;
    get(input: { roundId: string }): Promise<FriendlyRound>;
    balls(input: { token: string }): Promise<RoundBall[]>;
    scorecard(input: { token: string }): Promise<Scorecard[]>;
    score(input: { sourcePlayerId?: null | string; sourceGuestPlayerId?: null | string; metadata?: null | { [x: string]: unknown; }; token: string; ballId: string; playHoleId: string; strokes: null | number; eventType: 'score_entered' | 'score_cleared' | 'score_confirmed' | 'manual_override'; clientEventId: string }): Promise<AppendResult>;
}

export function createFriendlyRoundsClient(baseUrl: string): FriendlyRoundsApi {
    return {
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/friendly-rounds` });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds`, body: input });
        },
        async byToken(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/friendly-rounds/by-token${qs ? '?' + qs : ''}` });
        },
        async get(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/friendly-rounds/get${qs ? '?' + qs : ''}` });
        },
        async balls(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/friendly-rounds/balls${qs ? '?' + qs : ''}` });
        },
        async scorecard(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/friendly-rounds/scorecard${qs ? '?' + qs : ''}` });
        },
        async score(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/score`, body: input });
        },
    };
}
