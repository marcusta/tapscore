// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface CompetitionDetail {
    rounds: CompetitionRoundListItem[];
    id: string;
    name: string;
    lifecycle: 'draft' | 'setup' | 'active' | 'finalized';
    defaultConfig: null | { startList?: 'single_group' | 'foursomes'; categoryTees?: { [x: string]: { teeId: string; }; }; fallbackTee?: { teeId: string }; startListPolicy?: { window?: { opensAt?: string; closesAt?: string }; maxGroupSize?: number; groups: 'organized' | 'roster' | 'open'; seats: 'assigned' | 'claimable'; claimBy: 'team' | 'roster' | 'anyone' }; slots: ({ id?: string; producerDefIds?: string[]; teams?: { label: string; producerDefIds: string[] }[]; allowanceConfig?: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ pct: number; upToCh: null | number })[] }; formatConfig?: unknown; ballsFrom?: { ref: string }; subjects?: ({ producerDefId: string; kind: 'player' } | { kind: 'team'; teamId: string })[]; formatId: string })[] };
    aggregation: null | CompetitionAggregation;
    pointTemplateId: null | string;
    cutRules: unknown;
    isResultsFinal: boolean;
    resultsFinalizedAt: null | string;
    ownerPlayerId: string;
    createdAt: string;
}

export interface CompetitionParticipant {
    id: string;
    competitionId: string;
    playerId: null | string;
    guestPlayerId: null | string;
    displayNameSnapshot: string;
    category: null | string;
    cutAfterRound: null | number;
    withdrawnAt: null | string;
    createdAt: string;
}

export interface CompetitionRefusal {
    code: 'illegal_transition' | 'finalize_reserved' | 'competition_finalized' | 'lifecycle_forbids_edit' | 'lifecycle_forbids_roster' | 'lifecycle_forbids_withdraw' | 'invalid_default_config' | 'invalid_aggregation' | 'lifecycle_forbids_rounds' | 'missing_default_config' | 'empty_roster' | 'lifecycle_forbids_cut' | 'missing_cut_rules' | 'invalid_cut_rules' | 'cut_already_applied' | 'lifecycle_forbids_finalize' | 'rounds_incomplete' | 'not_finalized' | 'already_participant' | 'unknown_player' | 'unknown_guest' | 'participant_not_found';
    message: string;
}

export interface CompetitionLeaderboard {
    competitionId: string;
    aggregation: CompetitionAggregation;
    defaulted: boolean;
    finalized: boolean;
    resultsFinalizedAt: null | string;
    view: CompetitionResultView;
}

export interface CompetitionResults {
    competitionId: string;
    finalizedAt: string;
    resultSets: { scoringType: string; entries: CompetitionResultEntry[] }[];
}

export interface Competition {
    id: string;
    name: string;
    lifecycle: 'draft' | 'setup' | 'active' | 'finalized';
    defaultConfig: null | { startList?: 'single_group' | 'foursomes'; categoryTees?: { [x: string]: { teeId: string; }; }; fallbackTee?: { teeId: string }; startListPolicy?: { window?: { opensAt?: string; closesAt?: string }; maxGroupSize?: number; groups: 'organized' | 'roster' | 'open'; seats: 'assigned' | 'claimable'; claimBy: 'team' | 'roster' | 'anyone' }; slots: ({ id?: string; producerDefIds?: string[]; teams?: { label: string; producerDefIds: string[] }[]; allowanceConfig?: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ pct: number; upToCh: null | number })[] }; formatConfig?: unknown; ballsFrom?: { ref: string }; subjects?: ({ producerDefId: string; kind: 'player' } | { kind: 'team'; teamId: string })[]; formatId: string })[] };
    aggregation: null | CompetitionAggregation;
    pointTemplateId: null | string;
    cutRules: unknown;
    isResultsFinal: boolean;
    resultsFinalizedAt: null | string;
    ownerPlayerId: string;
    createdAt: string;
}

export interface CompetitionRound {
    id: string;
    competitionId: string;
    roundId: string;
    roundNumber: number;
    cutEligible: boolean;
    postCut: boolean;
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
    status: 'active' | 'not_started' | 'complete';
    latestEventId: null | string;
    courseNameSnapshot: null | string;
    completedAt: null | string;
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
    formatId?: string;
    teamLabel?: string;
    actual?: number;
    allowedMin?: number;
    allowedMax?: number;
}

export interface CutOutcome {
    competitionId: string;
    rule: { afterRound: number; cutType: 'top_n' | 'top_percent' | 'within_strokes'; cutValue: number };
    metricId: string;
    advanced: CutDecisionEntry[];
    cut: CutDecisionEntry[];
}

export interface FinalizeOutcome {
    competition: Competition;
    scoringTypes: string[];
    rowCount: number;
}

export interface CompetitionRoundListItem {
    id: string;
    competitionId: string;
    roundId: string;
    roundNumber: number;
    cutEligible: boolean;
    postCut: boolean;
    createdAt: string;
    status: 'active' | 'not_started' | 'complete';
    completedAt: null | string;
    date: string;
    courseNameSnapshot: null | string;
    shareToken?: string;
}

export interface CompetitionAggregation {
    strategyId: string;
    config: unknown;
}

export interface CompetitionResultView {
    kind: 'competition_ranked';
    strategyId: string;
    metricId: string;
    metricLabel: string;
    direction: 'high' | 'low';
    operator: { kind: 'sum' } | { kind: 'best_n'; n: number };
    rounds: { roundNumber: number; postCut: boolean }[];
    entries: CompetitionRankedEntry[];
}

export interface CompetitionResultEntry {
    participantId: string;
    position: number;
    points: number;
    entry: CompetitionRankedEntry;
    tiebreak: unknown;
}

export interface FormatSlot {
    slotIndex: number;
    slotDefId: string;
    formatId: string;
    scoringMode: 'custom' | 'stroke_play' | 'stableford' | 'match_play' | 'kopenhamnare' | 'taliban' | 'umbrella' | 'skins';
    teamShape: 'custom' | 'individual' | 'better_ball' | 'four_ball';
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

export interface CutDecisionEntry {
    participantId: string;
    displayName: string;
    position: number;
    total: null | number;
    reason?: 'rank' | 'withdrawn';
}

export interface CompetitionRankedEntry {
    participantId: string;
    displayName: string;
    category: null | string;
    playerRef: IdentityRef;
    rounds: CompetitionRoundCell[];
    total: null | number;
    roundsCounted: number;
    position: number;
    withdrawn: boolean;
    cutAfterRound: null | number;
    incomplete: boolean;
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

export interface IdentityRef {
    kind: 'player' | 'guest';
    id: string;
}

export interface CompetitionRoundCell {
    roundNumber: number;
    value: null | number;
    included: boolean;
    status: 'counted' | 'dropped' | 'missing' | 'cut';
}

export interface CompetitionsApi {
    get(input: { id: string }): Promise<CompetitionDetail>;
    participants(input: { competitionId: string }): Promise<CompetitionParticipant[]>;
    leaderboard(input: { id: string }): Promise<{ ok: false; refusal: CompetitionRefusal } | { ok: true; value: CompetitionLeaderboard }>;
    results(input: { id: string }): Promise<{ ok: false; refusal: CompetitionRefusal } | { ok: true; value: CompetitionResults }>;
    list(): Promise<Competition[]>;
    create(input: { name: string }): Promise<Competition>;
    update(input: { name?: string; defaultConfig?: unknown; aggregation?: null | { strategyId: string; config: unknown }; cutRules?: unknown; id: string }): Promise<{ ok: false; refusal: CompetitionRefusal } | { ok: true; value: Competition }>;
    transition(input: { id: string; to: 'draft' | 'setup' | 'active' | 'finalized' }): Promise<{ ok: false; refusal: CompetitionRefusal } | { ok: true; value: Competition }>;
    createRound(input: { roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; id: string; courseId: string; playedAt: string }): Promise<{ ok: true; competitionRound: CompetitionRound; round: Round; shareToken: string; draft: { route?: { playHoles?: { id?: string; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { lengthM?: number; strokeIndexOverride?: number; teeId: string }[]; courseHoleNumber: number }[]; routeSi?: { sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number; mode: 'official' | 'difficulty' | 'custom' }; routeHandicapPolicy?: { postingIneligibleReason?: string; type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; templateId?: string; playingGroups?: { id?: string; startPlayHoleDefId?: string; startOrdinal?: number; hittingBay?: string; startTime: string; capacity: number; producerDefIds: string[] }[] }; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; playingGroups?: { startTime?: string; startHole?: number; members: string[] }[]; teams?: ({ label?: string; kind?: 'single_ball' | 'multi_ball'; formation?: string; id: string; members: ({ producerDefId: string; allowancePct: number } | { teamId: string })[] })[]; startList?: { window?: { opensAt?: string; closesAt?: string }; maxGroupSize?: number; groups: 'organized' | 'roster' | 'open'; seats: 'assigned' | 'claimable'; claimBy: 'team' | 'roster' | 'anyone' }; courseId: string; playedAt: string; producers: ({ gender?: 'M' | 'F'; category?: string; seat?: { teamRef?: string; label: string }; teeId: string; handicapIndex: number; producerDefId: string; playerRef: { id: string; kind: 'player' | 'guest' } } | { category?: string; producerDefId: string; placeholder: { teamRef?: string; label: string } })[]; formats: ({ id?: string; producerDefIds?: string[]; teams?: { label: string; producerDefIds: string[] }[]; allowanceConfig?: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ pct: number; upToCh: null | number })[] }; formatConfig?: unknown; ballsFrom?: { ref: string }; subjects?: ({ producerDefId: string; kind: 'player' } | { kind: 'team'; teamId: string })[]; formatId: string })[] } } | { ok: false; refusal: CompetitionRefusal } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    applyCut(input: { id: string }): Promise<{ ok: false; refusal: CompetitionRefusal } | { ok: true; value: CutOutcome }>;
    finalize(input: { id: string }): Promise<{ ok: false; refusal: CompetitionRefusal } | { ok: true; value: FinalizeOutcome }>;
    addParticipant(input: { category?: null | string; playerId?: string; guestPlayerId?: string; competitionId: string }): Promise<{ ok: true; value: CompetitionParticipant } | { ok: false; refusal: { code: string; message: string } }>;
    removeParticipant(input: { participantId: string }): Promise<{ ok: false; refusal: CompetitionRefusal } | { ok: true; value: { removed: true } }>;
    withdrawParticipant(input: { participantId: string }): Promise<{ ok: false; refusal: CompetitionRefusal } | { ok: true; value: CompetitionParticipant }>;
}

export function createCompetitionsClient(baseUrl: string): CompetitionsApi {
    return {
        async get(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/competitions/get${qs ? '?' + qs : ''}` });
        },
        async participants(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/competitions/participants${qs ? '?' + qs : ''}` });
        },
        async leaderboard(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/competitions/${input.id}/leaderboard${qs ? '?' + qs : ''}` });
        },
        async results(input) {
            const pathParams = new Set(['id']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/competitions/${input.id}/results${qs ? '?' + qs : ''}` });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/competitions` });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/competitions`, body: input });
        },
        async update(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/competitions/update`, body: input });
        },
        async transition(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/competitions/transition`, body: input });
        },
        async createRound(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/competitions/${input.id}/rounds`, body });
        },
        async applyCut(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/competitions/${input.id}/cut`, body });
        },
        async finalize(input) {
            const pathParams = new Set(['id']);
            const body: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k)) body[k] = v;
            return apiFetch({ method: 'POST', url: `${baseUrl}/competitions/${input.id}/finalize`, body });
        },
        async addParticipant(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/competitions/participants/add`, body: input });
        },
        async removeParticipant(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/competitions/participants/remove`, body: input });
        },
        async withdrawParticipant(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/competitions/participants/withdraw`, body: input });
        },
    };
}
