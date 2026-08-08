// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface PlayerStatsConfig {
    playerId: string;
    enabled: boolean;
    tee: boolean;
    approach: boolean;
    putting: boolean;
    shortGame: boolean;
    penalties: boolean;
    recovery: boolean;
    updatedAt: null | string;
}

export interface PlayerStatsSummary {
    playerId: string;
    roundsWithStats: null | number;
    totals: null | StatMeasures;
    rounds: PlayerRoundStats[];
    nextCursor: null | string;
}

export interface PlayerRoundHoleStats {
    playHoleId: string;
    ordinal: number;
    courseHoleNumber: number;
    par: number;
    lengthM: null | number;
    score: null | number;
    stats: PlayerHoleStats;
}

export interface AppendStatEventsResult {
    events: AppendedStatEvent[];
}

export interface PlayerHoleStats {
    roundId: string;
    playHoleId: string;
    playerId: string;
    teeResult: null | 'fairway' | 'in_play' | 'trouble';
    teeMissDir: null | 'left' | 'right';
    gir: boolean | null;
    greenMissDir: null | 'left' | 'right' | 'long' | 'short';
    firstPutt: null | 'inside_1m' | '1_to_2m' | '2_to_4m' | '4_to_8m' | 'over_8m' | 'inside_2m' | '2_to_6m' | 'over_6m';
    putts: null | number;
    shortGameDifficulty: null | 'standard' | 'hard' | 'bunker';
    shortGameStrokes: null | number;
    penalties: null | number;
    penaltySource: null | 'tee' | 'approach' | 'short_or_green';
    recoveryOk: boolean | null;
}

export interface RoundPlayerStatModules {
    playerId: string;
    modules: StatModules;
}

export interface StatMeasures {
    teeRecorded: number;
    fairwayHits: number;
    inPlayHits: number;
    troubleCount: number;
    teeMissRecorded: number;
    teeMissLeft: number;
    teeMissRight: number;
    teeTroubleLeft: number;
    teeTroubleRight: number;
    girRecorded: number;
    girHits: number;
    greenMissRecorded: number;
    greenMissLong: number;
    greenMissShort: number;
    greenMissLeft: number;
    greenMissRight: number;
    firstPuttRecorded: number;
    firstPuttInside1m: number;
    firstPutt1To2m: number;
    firstPutt2To4m: number;
    firstPutt4To8m: number;
    firstPuttOver8m: number;
    firstPuttInside1mResolved: number;
    firstPutt1To2mResolved: number;
    firstPutt2To4mResolved: number;
    firstPutt4To8mResolved: number;
    firstPuttOver8mResolved: number;
    onePuttInside1m: number;
    onePutt1To2m: number;
    onePutt2To4m: number;
    onePutt4To8m: number;
    onePuttOver8m: number;
    puttsRecorded: number;
    puttsTotal: number;
    threePutts: number;
    threePuttsFromOver8m: number;
    scrambleAttemptsStandard: number;
    scrambleSuccessesStandard: number;
    scrambleAttemptsHard: number;
    scrambleSuccessesHard: number;
    scrambleFirstPuttStandard: number;
    scrambleInside2mStandard: number;
    scrambleFirstPuttHard: number;
    scrambleInside2mHard: number;
    scrambleHoledStandard: number;
    scrambleHoledHard: number;
    scrambleAttemptsBunker: number;
    scrambleSuccessesBunker: number;
    scrambleFirstPuttBunker: number;
    scrambleInside2mBunker: number;
    scrambleHoledBunker: number;
    shortGameStrokesRecorded: number;
    shortGameStrokesEffective: number;
    shortGameStrokesEffectiveStandard: number;
    shortGameStrokesEffectiveHard: number;
    shortGameStrokesEffectiveBunker: number;
    holesMultiChip: number;
    holesMultiChipBunker: number;
    penaltiesRecorded: number;
    penaltiesTotal: number;
    recoveryAttempts: number;
    recoverySuccesses: number;
    penaltySourceRecorded: number;
    penaltiesTee: number;
    penaltiesApproach: number;
    penaltiesShort: number;
    holesScored: number;
    strokesTotal: number;
    parTotal: number;
    holesScoredPar3: number;
    strokesPar3: number;
    holesScoredPar4: number;
    strokesPar4: number;
    holesScoredPar5: number;
    strokesPar5: number;
    holesEagleOrBetter: number;
    holesBirdie: number;
    holesPar: number;
    holesBogey: number;
    doubleBogeyPlus: number;
    girHolesScored: number;
    birdiesOnGir: number;
    bounceBackOpportunities: number;
    bounceBackSuccesses: number;
    holesScoredFairway: number;
    strokesVsParFairway: number;
    holesScoredInPlay: number;
    strokesVsParInPlay: number;
    holesScoredTrouble: number;
    strokesVsParTrouble: number;
    girRecordedFairway: number;
    girHitsFairway: number;
    girRecordedInPlay: number;
    girHitsInPlay: number;
    girRecordedTrouble: number;
    girHitsTrouble: number;
    girFirstPuttRecorded: number;
    girFirstPuttInside1m: number;
    girFirstPutt1To2m: number;
    girFirstPutt2To4m: number;
    girFirstPutt4To8m: number;
    girFirstPuttOver8m: number;
    puttsRecordedGir: number;
    puttsTotalGir: number;
    puttsTotalInside1mResolved: number;
    puttsTotal1To2mResolved: number;
    puttsTotal2To4mResolved: number;
    puttsTotal4To8mResolved: number;
    puttsTotalOver8mResolved: number;
    strokesVsParGirHit: number;
    holesScoredGirMiss: number;
    strokesVsParGirMiss: number;
    girRecordedPar3: number;
    girHitsPar3: number;
    girRecordedPar4: number;
    girHitsPar4: number;
    girRecordedPar5: number;
    girHitsPar5: number;
    holesZeroPutt: number;
    holesOnePutt: number;
    holesTwoPutt: number;
    puttsRecordedPar3: number;
    puttsTotalPar3: number;
    puttsRecordedPar4: number;
    puttsTotalPar4: number;
    puttsRecordedPar5: number;
    puttsTotalPar5: number;
    holesWithPenalty: number;
    holesScoredPenalty: number;
    strokesVsParPenalty: number;
    holesScoredPenaltyFree: number;
    strokesVsParPenaltyFree: number;
    teeRecordedPar4: number;
    fairwayHitsPar4: number;
    inPlayHitsPar4: number;
    troubleCountPar4: number;
    teeRecordedPar5: number;
    fairwayHitsPar5: number;
    inPlayHitsPar5: number;
    troubleCountPar5: number;
    attHolesPar3Gir: number;
    attHolesPar3Miss: number;
    attHolesPar45Gir: number;
    attHolesPar45Miss: number;
    attStrokes: number;
    attPutts: number;
    attPenalties: number;
    attFairwayPar4: number;
    attInPlayPar4: number;
    attTroublePar4: number;
    attFairwayPar5: number;
    attInPlayPar5: number;
    attTroublePar5: number;
    attGirFirstPuttInside1m: number;
    attGirFirstPutt1To2m: number;
    attGirFirstPutt2To4m: number;
    attGirFirstPutt4To8m: number;
    attGirFirstPuttOver8m: number;
    attGirHoled: number;
    attMissStandard: number;
    attMissHard: number;
    attChipInside2mStandard: number;
    attChipOutside2mStandard: number;
    attChipHoledStandard: number;
    attChipInside2mHard: number;
    attChipOutside2mHard: number;
    attChipHoledHard: number;
    attMissBunker: number;
    attChipInside2mBunker: number;
    attChipOutside2mBunker: number;
    attChipHoledBunker: number;
    attSgStrokesEffectiveStandard: number;
    attSgStrokesEffectiveHard: number;
    attSgStrokesEffectiveBunker: number;
    scrambleSingleChipStandard: number;
    scrambleChipInStandard: number;
    scrambleChipOnePuttStandard: number;
    scrambleChipTwoPuttStandard: number;
    scrambleChipThreePuttStandard: number;
    scrambleSingleChipHard: number;
    scrambleChipInHard: number;
    scrambleChipOnePuttHard: number;
    scrambleChipTwoPuttHard: number;
    scrambleChipThreePuttHard: number;
    scrambleSingleChipBunker: number;
    scrambleChipInBunker: number;
    scrambleChipOnePuttBunker: number;
    scrambleChipTwoPuttBunker: number;
    scrambleChipThreePuttBunker: number;
    holesMultiChipStandard: number;
    holesMultiChipHard: number;
    scrambleInside2mResolvedStandard: number;
    scrambleInside2mSavedStandard: number;
    scrambleInside2mResolvedHard: number;
    scrambleInside2mSavedHard: number;
    scrambleInside2mResolvedBunker: number;
    scrambleInside2mSavedBunker: number;
    holesScoredMissStandard: number;
    strokesVsParMissStandard: number;
    holesScoredMissHard: number;
    strokesVsParMissHard: number;
    holesScoredMissBunker: number;
    strokesVsParMissBunker: number;
}

export interface PlayerRoundStats {
    roundId: string;
    date: string;
    courseName: null | string;
    courseId: string;
    roundType: 'full_18' | 'front_9' | 'back_9' | 'custom_holes';
    venueType: 'outdoor' | 'indoor';
    name: null | string;
    holeCount: number;
    measures: StatMeasures;
}

export interface AppendedStatEvent {
    event: StatEvent;
    inserted: boolean;
}

export interface StatModules {
    tee: boolean;
    approach: boolean;
    putting: boolean;
    shortGame: boolean;
    penalties: boolean;
    recovery: boolean;
}

export interface StatEvent {
    id: string;
    roundId: string;
    playHoleId: string;
    playerId: string;
    seq: number;
    key: 'penalties' | 'tee_result' | 'tee_miss_dir' | 'gir' | 'green_miss_dir' | 'first_putt' | 'putts' | 'short_game_difficulty' | 'short_game_strokes' | 'penalty_source' | 'recovery_ok';
    value: null | string;
    recordedByPlayerId: null | string;
    recordedAt: string;
    clientEventId: string;
}

export interface PlayerStatsApi {
    myConfig(): Promise<PlayerStatsConfig>;
    putMyConfig(input: { enabled: boolean; tee: boolean; approach: boolean; putting: boolean; shortGame: boolean; penalties: boolean; recovery: boolean }): Promise<PlayerStatsConfig>;
    myStats(input: { limit?: number; cursor?: string }): Promise<PlayerStatsSummary>;
    myRoundStats(input: { roundId: string }): Promise<PlayerRoundHoleStats[]>;
    appendEvents(input: { token: string; items: ({ playHoleId: string; playerId: string; key: 'penalties' | 'tee_result' | 'tee_miss_dir' | 'gir' | 'green_miss_dir' | 'first_putt' | 'putts' | 'short_game_difficulty' | 'short_game_strokes' | 'penalty_source' | 'recovery_ok'; value: null | string; clientEventId: string })[] }): Promise<AppendStatEventsResult>;
    byToken(input: { token: string }): Promise<PlayerHoleStats[]>;
    configsByToken(input: { token: string }): Promise<RoundPlayerStatModules[]>;
}

export function createPlayerStatsClient(baseUrl: string): PlayerStatsApi {
    return {
        async myConfig() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/players/me/stats-config` });
        },
        async putMyConfig(input) {
            return apiFetch({ method: 'PUT', url: `${baseUrl}/players/me/stats-config`, body: input });
        },
        async myStats(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/players/me/stats${qs ? '?' + qs : ''}` });
        },
        async myRoundStats(input) {
            const pathParams = new Set(['roundId']);
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (!pathParams.has(k) && v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/players/me/rounds/${input.roundId}/stats${qs ? '?' + qs : ''}` });
        },
        async appendEvents(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/friendly-rounds/stat-events`, body: input });
        },
        async byToken(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/friendly-rounds/stats${qs ? '?' + qs : ''}` });
        },
        async configsByToken(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/friendly-rounds/stats-configs${qs ? '?' + qs : ''}` });
        },
    };
}
