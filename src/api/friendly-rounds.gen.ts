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
    formatIndex?: number;
    slotIndex?: number;
    formatId?: string;
    teamLabel?: string;
    actual?: number;
    allowedMin?: number;
    allowedMax?: number;
}

export interface StartListView {
    policy: { groups: 'organized' | 'roster' | 'open'; seats: 'assigned' | 'claimable'; claimBy: 'team' | 'roster' | 'anyone'; window?: { opensAt?: string; closesAt?: string }; maxGroupSize?: number };
    presetId: null | 'organized' | 'organized_open_slots' | 'pick_your_tee_time' | 'self_organized';
    viewer: StartListOps;
    seats: StartListSeat[];
    claimedSeats: ClaimedSeat[];
}

export interface RoundBall {
    id: string;
    label: null | string;
    courseHandicap: null | number;
    players: RoundBallPlayer[];
    slots: RoundBallSlot[];
    pending: boolean;
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

export interface RenameGuestResult {
    guestPlayerId: string;
    displayName: string;
    ballPlayersUpdated: number;
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

export interface StartListOps {
    join: StartListOpDecision;
    createGroup: StartListOpDecision;
    claimSeat: StartListOpDecision;
    claimSeatAsGuest: StartListOpDecision;
    maxGroupSize: number;
}

export interface StartListSeat {
    seatId: string;
    label: string;
    ballId: string;
    groupId: null | string;
    teamRef: null | string;
    category: null | string;
}

export interface ClaimedSeat {
    seatId: string;
    seatLabel: string;
    displayName: string;
    ballId: null | string;
    occupiedByViewer: boolean;
    hasScores: boolean;
    viewerMayRelease: boolean;
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

export interface StartListOpDecision {
    allowed: boolean;
    code?: string;
    message?: string;
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
    create(input: { draft: { courseId: string; playedAt: string; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; route?: { templateId?: string; playHoles?: { id?: string; courseHoleNumber: number; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { teeId: string; lengthM?: number; strokeIndexOverride?: number }[] }[]; routeSi?: { mode: 'official' | 'difficulty' | 'custom'; sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number }; routeHandicapPolicy?: { type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean; postingIneligibleReason?: string }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; playingGroups?: { id?: string; startTime: string; startPlayHoleDefId?: string; startOrdinal?: number; capacity: number; hittingBay?: string; producerDefIds: string[] }[] }; producers: ({ producerDefId: string; playerRef: { kind: 'player' | 'guest'; id: string }; handicapIndex: number; gender?: 'M' | 'F'; teeId: string; category?: string; seat?: { label: string; teamRef?: string } } | { producerDefId: string; placeholder: { label: string; teamRef?: string }; category?: string })[]; teams?: ({ id: string; label?: string; formation?: string; kind?: 'single_ball' | 'multi_ball'; members: ({ producerDefId: string; allowancePct: number } | { teamId: string })[] })[]; formats: ({ formatId: string; id?: string; allowanceConfig?: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ upToCh: null | number; pct: number })[] }; producerDefIds?: string[]; teams?: { label: string; producerDefIds: string[] }[]; formatConfig?: unknown; ballsFrom?: { ref: string }; subjects?: ({ kind: 'player'; producerDefId: string } | { kind: 'team'; teamId: string })[] })[]; playingGroups?: { members: string[]; startTime?: string; startHole?: number }[]; startList?: { groups: 'organized' | 'roster' | 'open'; seats: 'assigned' | 'claimable'; claimBy: 'team' | 'roster' | 'anyone'; window?: { opensAt?: string; closesAt?: string }; maxGroupSize?: number } } }): Promise<{ ok: true; round: Round; friendlyRound: FriendlyRound } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    byToken(input: { token: string }): Promise<{ friendlyRound: FriendlyRound; round: Round; startList: StartListView }>;
    balls(input: { token: string }): Promise<RoundBall[]>;
    scorecard(input: { token: string }): Promise<Scorecard[]>;
    result(input: { token: string; cursor?: string }): Promise<{ unchanged: true; cursor: string } | { unchanged: false; cursor: null | string; result: RoundResult }>;
    score(input: { token: string; ballId: string; playHoleId: string; strokes: null | number; eventType: 'score_entered' | 'score_cleared' | 'score_confirmed' | 'manual_override'; clientEventId: string; sourcePlayerId?: null | string; sourceGuestPlayerId?: null | string; metadata?: null | { [x: string]: unknown; } }): Promise<AppendResult>;
    setup(input: { token: string }): Promise<{ editable: true; status: 'active' | 'not_started' | 'complete'; hasScores: boolean; draft: { courseId: string; playedAt: string; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; route?: { templateId?: string; playHoles?: { id?: string; courseHoleNumber: number; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { teeId: string; lengthM?: number; strokeIndexOverride?: number }[] }[]; routeSi?: { mode: 'official' | 'difficulty' | 'custom'; sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number }; routeHandicapPolicy?: { type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean; postingIneligibleReason?: string }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; playingGroups?: { id?: string; startTime: string; startPlayHoleDefId?: string; startOrdinal?: number; capacity: number; hittingBay?: string; producerDefIds: string[] }[] }; producers: ({ producerDefId: string; playerRef: { kind: 'player' | 'guest'; id: string }; handicapIndex: number; gender?: 'M' | 'F'; teeId: string; category?: string; seat?: { label: string; teamRef?: string } } | { producerDefId: string; placeholder: { label: string; teamRef?: string }; category?: string })[]; teams?: ({ id: string; label?: string; formation?: string; kind?: 'single_ball' | 'multi_ball'; members: ({ producerDefId: string; allowancePct: number } | { teamId: string })[] })[]; formats: ({ formatId: string; id?: string; allowanceConfig?: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ upToCh: null | number; pct: number })[] }; producerDefIds?: string[]; teams?: { label: string; producerDefIds: string[] }[]; formatConfig?: unknown; ballsFrom?: { ref: string }; subjects?: ({ kind: 'player'; producerDefId: string } | { kind: 'team'; teamId: string })[] })[]; playingGroups?: { members: string[]; startTime?: string; startHole?: number }[]; startList?: { groups: 'organized' | 'roster' | 'open'; seats: 'assigned' | 'claimable'; claimBy: 'team' | 'roster' | 'anyone'; window?: { opensAt?: string; closesAt?: string }; maxGroupSize?: number } }; draftVersion: number } | { editable: false; status: 'active' | 'not_started' | 'complete'; reason: 'round_complete' | 'no_stored_draft' }>;
    editSetup(input: { token: string; draft: { courseId: string; playedAt: string; roundType?: 'full_18' | 'front_9' | 'back_9' | 'custom_holes'; venueType?: 'outdoor' | 'indoor'; route?: { templateId?: string; playHoles?: { id?: string; courseHoleNumber: number; parOverride?: number; baseStrokeIndexOverride?: number; teeOverrides?: { teeId: string; lengthM?: number; strokeIndexOverride?: number }[] }[]; routeSi?: { mode: 'official' | 'difficulty' | 'custom'; sourceLabel?: string; sourceVersion?: string; allocationCycleSize?: number }; routeHandicapPolicy?: { type: 'official_route' | 'full_course_casual' | 'prorated_casual' | 'explicit'; postingEligible: boolean; postingIneligibleReason?: string }; routeSections?: { id: string; label: string; fromCanonicalOrdinal: number; toCanonicalOrdinal: number }[]; playingGroups?: { id?: string; startTime: string; startPlayHoleDefId?: string; startOrdinal?: number; capacity: number; hittingBay?: string; producerDefIds: string[] }[] }; producers: ({ producerDefId: string; playerRef: { kind: 'player' | 'guest'; id: string }; handicapIndex: number; gender?: 'M' | 'F'; teeId: string; category?: string; seat?: { label: string; teamRef?: string } } | { producerDefId: string; placeholder: { label: string; teamRef?: string }; category?: string })[]; teams?: ({ id: string; label?: string; formation?: string; kind?: 'single_ball' | 'multi_ball'; members: ({ producerDefId: string; allowancePct: number } | { teamId: string })[] })[]; formats: ({ formatId: string; id?: string; allowanceConfig?: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ upToCh: null | number; pct: number })[] }; producerDefIds?: string[]; teams?: { label: string; producerDefIds: string[] }[]; formatConfig?: unknown; ballsFrom?: { ref: string }; subjects?: ({ kind: 'player'; producerDefId: string } | { kind: 'team'; teamId: string })[] })[]; playingGroups?: { members: string[]; startTime?: string; startHole?: number }[]; startList?: { groups: 'organized' | 'roster' | 'open'; seats: 'assigned' | 'claimable'; claimBy: 'team' | 'roster' | 'anyone'; window?: { opensAt?: string; closesAt?: string }; maxGroupSize?: number } }; clientEventId?: string }): Promise<{ ok: true; round: Round } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    remove(input: { token: string }): Promise<{ ok: boolean }>;
    finish(input: { token: string }): Promise<{ status: 'active' | 'not_started' | 'complete'; completedAt: string }>;
    reopen(input: { token: string }): Promise<{ status: 'active' | 'not_started' | 'complete' }>;
    join(input: { token: string; teeId: string; groupChoice?: string }): Promise<{ ok: true; round: Round } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    leave(input: { token: string }): Promise<{ ok: true; round: Round } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    claimGuest(input: { token: string; guestPlayerId: string }): Promise<ClaimGuestResult>;
    renameGuest(input: { token: string; guestPlayerId: string; displayName: string }): Promise<RenameGuestResult>;
    claimSeat(input: { token: string; seatId: string; identity: { kind: 'self' } | { kind: 'guest'; name: string; handicapIndex: number; gender: 'M' | 'F' }; teeId?: string; clientEventId: string }): Promise<{ ok: true; round: Round } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    releaseSeat(input: { token: string; seatId: string; clientEventId: string }): Promise<{ ok: true; round: Round } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
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
        async renameGuest(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/rename-guest`, body: input });
        },
        async claimSeat(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/claim-seat`, body: input });
        },
        async releaseSeat(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/release-seat`, body: input });
        },
    };
}
