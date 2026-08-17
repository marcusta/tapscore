// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface SpectateView {
    round: Round;
    result: RoundResult;
    cursor: null | string;
    status: 'active' | 'not_started' | 'complete';
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

export interface RoundResult {
    slots: SlotResultView[];
    routeSections: RouteSectionRef[];
    posting: { eligible: boolean; reason: null | string };
}

export interface FormatSlot {
    slotIndex: number;
    slotDefId: string;
    formatId: string;
    scoringMode: 'custom' | 'stroke_play' | 'stableford' | 'match_play' | 'kopenhamnare' | 'taliban' | 'umbrella' | 'skins' | 'fairways_greens';
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

export interface SlotResultView {
    slotIndex: number;
    slotDefId: string;
    formatId: string;
    formatLabel: string;
    scoringMode: string;
    teamShape: string;
    allowanceLabel: string;
    cards: ScoreGridSection[];
    leaderboard: (RankedSection | MatchSummarySection)[];
    subjectLabels?: { ballId: string; label: string; memberBallIds: string[] }[];
}

export interface RouteSectionRef {
    id: string;
    label: string;
    fromCanonicalOrdinal: number;
    toCanonicalOrdinal: number;
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

export interface ScoreGridSection {
    kind: 'score_grid';
    componentId?: 'default-score-grid' | 'compact-match-grid' | 'category-matrix-grid';
    title: { groups: string[][]; joiner: string };
    subjectBallIds: string[];
    holes: HoleRef[];
    subtitleFacts: string[];
    rows: GridRow[];
    footnotes: string[];
    caption?: string;
    totals: ({ label: string; value: null | number })[];
}

export interface RankedSection {
    kind: 'ranked';
    metricId: string;
    metricLabel: string;
    direction?: 'high' | 'low';
    entries: RankedEntry[];
}

export interface MatchSummarySection {
    kind: 'match_summary';
    title: string;
    matches: MatchPanel[];
}

export interface HoleRef {
    holeNumber: number;
    playHoleId: string;
    courseHoleNumber: number;
    canonicalOrdinal: number;
    occurrenceLabel: string;
}

export interface GridRow {
    label: string;
    subjectBallId?: string;
    kind: 'par' | 'si' | 'given' | 'gross' | 'net' | 'points' | 'running' | 'status' | 'category' | 'free';
    cells: GridCell[];
    aggregate: 'sum' | 'last' | 'none';
    emphasis?: boolean;
    team?: 'a' | 'b';
}

export interface RankedEntry {
    ballIds: string[];
    total: null | number;
    holesPlayed: number;
    paceDelta?: number;
    position: number;
}

export interface MatchPanel {
    sideA: { ballIds: string[] };
    sideB: { ballIds: string[] };
    leader: null | 'a' | 'b';
    magnitude: number;
    finished: boolean;
    thru: number;
    closeOutRemaining: null | number;
}

export interface GridCell {
    playHoleId: string;
    holeNumber: number;
    value: null | number;
    display?: string;
    title?: string;
    tone?: 'neutral' | 'side_a' | 'side_b' | 'success' | 'warning' | 'danger';
    marker?: { tone?: 'neutral' | 'side_a' | 'side_b' | 'success' | 'warning' | 'danger'; label?: string; value?: string; template: 'ring' | 'double_ring' | 'diamond' | 'dot' | 'badge' | 'box_badge' | 'square' | 'double_square' } | { tone?: 'neutral' | 'side_a' | 'side_b' | 'success' | 'warning' | 'danger'; label?: string; value?: string; template: 'custom'; customId: string };
    team?: 'a' | 'b';
}

export interface SpectateApi {
    round(input: { roundId: string }): Promise<SpectateView>;
}

export function createSpectateClient(baseUrl: string): SpectateApi {
    return {
        async round(input) {
            const pathParams = new Set(['roundId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/spectate/rounds/${input.roundId}${qs ? '?' + qs : ''}` });
        },
    };
}
