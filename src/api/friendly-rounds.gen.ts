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
    courseNameSnapshot: null | string;
    completedAt: null | string;
    formatSlots: FormatSlot[];
    playHoles: RoundPlayHole[];
    routeSi: RoundRouteSi;
    routeHandicapPolicy: RoundRoutePolicy;
    routeSections: RoundRouteSection[];
    playingGroups: RoundPlayingGroup[];
}

export interface FriendlyRound {
    id: string;
    roundId: string;
    shareToken: string;
    creatorPlayerId: null | string;
    createdAt: string;
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

export interface RoundResult {
    slots: SlotResultView[];
    routeSections: RouteSectionRef[];
    posting: { eligible: boolean; reason: null | string };
}

export interface AppendResult {
    event: ScoreEvent;
    inserted: boolean;
}

export interface ClaimGuestResult {
    roundId: string;
    guestPlayerId: string;
    playerId: string;
    ballPlayersFlipped: number;
    scoreEventsFlipped: number;
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

export interface FriendlyRoundsApi {
    create(input: { draft: { route?: { playHoles?: { id?: string; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { lengthM?: number; strokeIndexOverride?: number; teeId: string }[]; courseHoleNumber: number }[]; routeSi?: { sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number; mode: 'official' | 'difficulty' | 'custom' }; routeHandicapPolicy?: { postingIneligibleReason?: string; type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; templateId?: string; playingGroups?: { id?: string; startPlayHoleDefId?: string; startOrdinal?: number; hittingBay?: string; startTime: string; capacity: number; producerDefIds: string[] }[] }; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; playingGroups?: { startTime?: string; startHole?: number; members: string[] }[]; teams?: ({ label?: string; kind?: 'single_ball' | 'multi_ball'; formation?: string; id: string; members: ({ producerDefId: string; allowancePct: number } | { teamId: string })[] })[]; courseId: string; playedAt: string; producers: ({ gender?: 'M' | 'F'; category?: string; teeId: string; handicapIndex: number; producerDefId: string; playerRef: { id: string; kind: 'player' | 'guest' } })[]; formats: ({ id?: string; producerDefIds?: string[]; teams?: { label: string; producerDefIds: string[] }[]; allowanceConfig?: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ pct: number; upToCh: null | number })[] }; formatConfig?: unknown; ballsFrom?: { ref: string }; subjects?: ({ producerDefId: string; kind: 'player' } | { kind: 'team'; teamId: string })[]; formatId: string })[] } }): Promise<{ ok: true; round: Round; friendlyRound: FriendlyRound } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    byToken(input: { token: string }): Promise<{ friendlyRound: FriendlyRound; round: Round }>;
    balls(input: { token: string }): Promise<RoundBall[]>;
    scorecard(input: { token: string }): Promise<Scorecard[]>;
    result(input: { cursor?: string; token: string }): Promise<{ unchanged: true; cursor: string } | { unchanged: false; cursor: null | string; result: RoundResult }>;
    score(input: { sourcePlayerId?: null | string; sourceGuestPlayerId?: null | string; metadata?: null | { [x: string]: unknown; }; token: string; ballId: string; playHoleId: string; strokes: null | number; eventType: 'score_entered' | 'score_cleared' | 'score_confirmed' | 'manual_override'; clientEventId: string }): Promise<AppendResult>;
    setup(input: { token: string }): Promise<{ editable: true; status: 'active' | 'not_started' | 'complete'; hasScores: boolean; draft: { route?: { playHoles?: { id?: string; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { lengthM?: number; strokeIndexOverride?: number; teeId: string }[]; courseHoleNumber: number }[]; routeSi?: { sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number; mode: 'official' | 'difficulty' | 'custom' }; routeHandicapPolicy?: { postingIneligibleReason?: string; type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; templateId?: string; playingGroups?: { id?: string; startPlayHoleDefId?: string; startOrdinal?: number; hittingBay?: string; startTime: string; capacity: number; producerDefIds: string[] }[] }; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; playingGroups?: { startTime?: string; startHole?: number; members: string[] }[]; teams?: ({ label?: string; kind?: 'single_ball' | 'multi_ball'; formation?: string; id: string; members: ({ producerDefId: string; allowancePct: number } | { teamId: string })[] })[]; courseId: string; playedAt: string; producers: ({ gender?: 'M' | 'F'; category?: string; teeId: string; handicapIndex: number; producerDefId: string; playerRef: { id: string; kind: 'player' | 'guest' } })[]; formats: ({ id?: string; producerDefIds?: string[]; teams?: { label: string; producerDefIds: string[] }[]; allowanceConfig?: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ pct: number; upToCh: null | number })[] }; formatConfig?: unknown; ballsFrom?: { ref: string }; subjects?: ({ producerDefId: string; kind: 'player' } | { kind: 'team'; teamId: string })[]; formatId: string })[] }; draftVersion: number } | { editable: false; status: 'active' | 'not_started' | 'complete'; reason: 'round_complete' | 'no_stored_draft' }>;
    editSetup(input: { clientEventId?: string; draft: { route?: { playHoles?: { id?: string; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { lengthM?: number; strokeIndexOverride?: number; teeId: string }[]; courseHoleNumber: number }[]; routeSi?: { sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number; mode: 'official' | 'difficulty' | 'custom' }; routeHandicapPolicy?: { postingIneligibleReason?: string; type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; templateId?: string; playingGroups?: { id?: string; startPlayHoleDefId?: string; startOrdinal?: number; hittingBay?: string; startTime: string; capacity: number; producerDefIds: string[] }[] }; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; playingGroups?: { startTime?: string; startHole?: number; members: string[] }[]; teams?: ({ label?: string; kind?: 'single_ball' | 'multi_ball'; formation?: string; id: string; members: ({ producerDefId: string; allowancePct: number } | { teamId: string })[] })[]; courseId: string; playedAt: string; producers: ({ gender?: 'M' | 'F'; category?: string; teeId: string; handicapIndex: number; producerDefId: string; playerRef: { id: string; kind: 'player' | 'guest' } })[]; formats: ({ id?: string; producerDefIds?: string[]; teams?: { label: string; producerDefIds: string[] }[]; allowanceConfig?: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ pct: number; upToCh: null | number })[] }; formatConfig?: unknown; ballsFrom?: { ref: string }; subjects?: ({ producerDefId: string; kind: 'player' } | { kind: 'team'; teamId: string })[]; formatId: string })[] }; token: string }): Promise<{ ok: true; round: Round } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    remove(input: { token: string }): Promise<{ ok: boolean }>;
    finish(input: { token: string }): Promise<{ status: 'active' | 'not_started' | 'complete'; completedAt: string }>;
    reopen(input: { token: string }): Promise<{ status: 'active' | 'not_started' | 'complete' }>;
    join(input: { groupChoice?: string; teeId: string; token: string }): Promise<{ ok: true; round: Round } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    leave(input: { token: string }): Promise<{ ok: true; round: Round } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    claimGuest(input: { guestPlayerId: string; token: string }): Promise<ClaimGuestResult>;
}

export function createFriendlyRoundsClient(baseUrl: string): FriendlyRoundsApi {
    return {
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
        async result(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/friendly-rounds/result${qs ? '?' + qs : ''}` });
        },
        async score(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/score`, body: input });
        },
        async setup(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/friendly-rounds/setup${qs ? '?' + qs : ''}` });
        },
        async editSetup(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/setup`, body: input });
        },
        async remove(input) {
            return apiFetch({ method: 'DELETE', url: `${baseUrl}/friendly-rounds/${input.token}` });
        },
        async finish(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/finish`, body: input });
        },
        async reopen(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/reopen`, body: input });
        },
        async join(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/join`, body: input });
        },
        async leave(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/leave`, body: input });
        },
        async claimGuest(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/claim-guest`, body: input });
        },
    };
}
