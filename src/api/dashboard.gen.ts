// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface DashboardRoundEntry {
    round: Round;
    ballIds: string[];
    slots: DashboardSlotEntry[];
    shareToken: null | string;
}

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
    status: 'active' | 'not_started' | 'complete';
    latestEventId: null | string;
    name: null | string;
    visibility: 'private' | 'friends' | 'link';
    courseNameSnapshot: null | string;
    completedAt: null | string;
    formatSlots: FormatSlot[];
    playHoles: RoundPlayHole[];
    routeSi: RoundRouteSi;
    routeHandicapPolicy: RoundRoutePolicy;
    routeSections: RoundRouteSection[];
    playingGroups: RoundPlayingGroup[];
}

export interface FriendsActivity {
    live: FriendsActivityEntry[];
    recent: FriendsActivityEntry[];
}

export interface DashboardSlotEntry {
    slotDefId: string;
    slotIndex: null | number;
    formatId: string;
    formatLabel: string;
    scoringMode: string;
    teamShape: string;
    ballId: string;
    playingHandicap: null | number;
    teamLabel: null | string;
    position: null | number;
    total: null | number;
    metricLabel: null | string;
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

export interface FriendsActivityEntry {
    roundId: string;
    name: null | string;
    courseName: null | string;
    date: string;
    status: 'active' | 'not_started' | 'complete';
    holeCount: number;
    lastActivityAt: null | string;
    friends: FriendsActivityFriend[];
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

export interface FriendsActivityFriend {
    playerId: string;
    displayName: string;
    avatarVersion: null | string;
    holesPlayed: number;
    scoreToPar: null | number;
}

export interface DashboardApi {
    myRounds(): Promise<{ produced: DashboardRoundEntry[]; created: { friendlyRound: FriendlyRound; round: Round }[] }>;
    friendsActivity(): Promise<FriendsActivity>;
}

export function createDashboardClient(baseUrl: string): DashboardApi {
    return {
        async myRounds() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/dashboard/my-rounds` });
        },
        async friendsActivity() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/dashboard/friends-activity` });
        },
    };
}
