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

export interface AppendStatEventsResult {
    events: AppendedStatEvent[];
}

export interface PlayerHoleStats {
    roundId: string;
    playHoleId: string;
    playerId: string;
    teeResult: null | 'fairway' | 'in_play' | 'trouble';
    gir: boolean | null;
    firstPutt: null | 'inside_2m' | '2_to_6m' | 'over_6m';
    putts: null | number;
    shortGameDifficulty: null | 'standard' | 'hard';
    penalties: null | number;
    recoveryOk: boolean | null;
}

export interface RoundPlayerStatModules {
    playerId: string;
    modules: StatModules;
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
    key: 'penalties' | 'tee_result' | 'gir' | 'first_putt' | 'putts' | 'short_game_difficulty' | 'recovery_ok';
    value: null | string;
    recordedByPlayerId: null | string;
    recordedAt: string;
    clientEventId: string;
}

export interface PlayerStatsApi {
    myConfig(): Promise<PlayerStatsConfig>;
    putMyConfig(input: { enabled: boolean; tee: boolean; approach: boolean; putting: boolean; shortGame: boolean; penalties: boolean; recovery: boolean }): Promise<PlayerStatsConfig>;
    appendEvents(input: { token: string; items: ({ playerId: string; playHoleId: string; clientEventId: string; key: 'penalties' | 'tee_result' | 'gir' | 'first_putt' | 'putts' | 'short_game_difficulty' | 'recovery_ok'; value: null | string })[] }): Promise<AppendStatEventsResult>;
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
