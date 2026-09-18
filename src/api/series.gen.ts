// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface SeriesBoardView {
    canEdit: boolean;
    id: string;
    name: string;
    teams: SeriesBoardTeam[];
    sessions: SeriesBoardSession[];
    live: boolean;
}

export interface TeamPointsDescriptor {
    id: string;
    label: string;
    labels: TeamPointsLabels;
    description: string;
    appliesTo: 'match' | 'ranked' | 'none';
    configFields?: ({ kind: 'number'; key: string; label: string; default: number; min?: number; step?: number } | { kind: 'team_points'; key: string; label: string; step?: number } | { kind: 'text'; key: string; label: string })[];
}

export interface SeriesSummary {
    id: string;
    name: string;
    shareToken: string;
    ownerPlayerId: string;
    createdAt: string;
}

export interface SeriesDetail {
    id: string;
    name: string;
    shareToken: string;
    ownerPlayerId: string;
    createdAt: string;
    teams: SeriesTeam[];
    rounds: SeriesRoundDetail[];
    sources: SeriesPointSource[];
}

export interface SeriesRefusal {
    code: 'invalid_player_ref' | 'series_not_found' | 'team_not_found' | 'team_not_in_series' | 'member_not_found' | 'member_exists' | 'player_not_found' | 'round_not_found' | 'round_already_attached' | 'series_round_not_found' | 'ball_not_in_round' | 'unknown_rule' | 'invalid_config' | 'source_not_found' | 'invalid_name';
    message: string;
}

export interface SeriesTeam {
    id: string;
    name: string;
    colour: string;
    members: SeriesTeamMember[];
}

export interface SeriesBoardTeam {
    teamId: string;
    name: string;
    colour: string;
    points: number;
    decided: number;
    members: string[];
}

export interface SeriesBoardSession {
    seriesRoundId: null | string;
    label: string;
    roundName: null | string;
    date: null | string;
    status: null | 'not_started' | 'active' | 'complete';
    sources: SeriesBoardSource[];
    problem?: string;
}

export interface TeamPointsLabels {
    en: string;
    sv?: string;
}

export interface SeriesRoundDetail {
    id: string;
    roundId: string;
    label: string;
    ordinal: number;
    roundName: string;
    date: string;
    status: 'not_started' | 'active' | 'complete';
    balls: SeriesRoundBall[];
    slots: SeriesRoundSlot[];
    problem?: string;
}

export interface SeriesPointSource {
    id: string;
    seriesRoundId: null | string;
    slotDefId: null | string;
    ruleId: string;
    config: unknown;
    label: string;
    ordinal: number;
}

export interface SeriesTeamMember {
    id: string;
    playerId: null | string;
    guestPlayerId: null | string;
    displayName: string;
}

export interface SeriesBoardSource {
    id: string;
    label: string;
    ruleLabel: string;
    rows: TeamPointsRow[];
    points: TeamPointsShare[];
    live: boolean;
}

export interface SeriesRoundBall {
    ballId: string;
    label: string;
    teamId: null | string;
}

export interface SeriesRoundSlot {
    slotDefId: string;
    formatLabel: string;
    suggestedRuleId: null | string;
}

export interface TeamPointsRow {
    label: string;
    status: string;
    live: boolean;
    points: TeamPointsShare[];
    detail: string;
    versus?: TeamPointsVersus;
    problem?: string;
}

export interface TeamPointsShare {
    teamId: string;
    points: number;
}

export interface TeamPointsVersus {
    a: TeamPointsVersusSide;
    b: TeamPointsVersusSide;
    leader: null | 'a' | 'b';
    standing: string;
    finished: boolean;
}

export interface TeamPointsVersusSide {
    name: string;
    teamId: string;
    figure?: string;
}

export interface SeriesApi {
    board(input: { token: string }): Promise<SeriesBoardView>;
    rules(): Promise<TeamPointsDescriptor[]>;
    list(): Promise<SeriesSummary[]>;
    get(input: { seriesId: string }): Promise<SeriesDetail>;
    create(input: { name: string; teams: { name: string; colour: string }[] }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesSummary }>;
    rename(input: { seriesId: string; name: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesSummary }>;
    remove(input: { seriesId: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: { id: string } }>;
    addTeam(input: { seriesId: string; name: string; colour: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesTeam[] }>;
    updateTeam(input: { seriesId: string; teamId: string; name?: string; colour?: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesTeam[] }>;
    removeTeam(input: { seriesId: string; teamId: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesTeam[] }>;
    addMember(input: { seriesId: string; teamId: string; playerId?: string; guestName?: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesTeam[] }>;
    removeMember(input: { seriesId: string; memberId: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesTeam[] }>;
    attachRound(input: { seriesId: string; roundShareToken: string; label: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesDetail }>;
    relabelRound(input: { seriesId: string; seriesRoundId: string; label: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesDetail }>;
    detachRound(input: { seriesId: string; seriesRoundId: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesDetail }>;
    setBallTeam(input: { seriesId: string; seriesRoundId: string; ballId: string; teamId: null | string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesDetail }>;
    upsertSource(input: { seriesId: string; id?: string; seriesRoundId?: null | string; slotDefId?: null | string; ruleId: string; config?: unknown; label: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesDetail }>;
    deleteSource(input: { seriesId: string; sourceId: string }): Promise<{ ok: false; refusal: SeriesRefusal } | { ok: true; value: SeriesDetail }>;
}

export function createSeriesClient(baseUrl: string): SeriesApi {
    return {
        async board(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/series/board${qs ? '?' + qs : ''}` });
        },
        async rules() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/series/rules` });
        },
        async list() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/series` });
        },
        async get(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/series/get${qs ? '?' + qs : ''}` });
        },
        async create(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series`, body: input });
        },
        async rename(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/rename`, body: input });
        },
        async remove(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/delete`, body: input });
        },
        async addTeam(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/teams/add`, body: input });
        },
        async updateTeam(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/teams/update`, body: input });
        },
        async removeTeam(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/teams/remove`, body: input });
        },
        async addMember(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/members/add`, body: input });
        },
        async removeMember(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/members/remove`, body: input });
        },
        async attachRound(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/rounds/attach`, body: input });
        },
        async relabelRound(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/rounds/relabel`, body: input });
        },
        async detachRound(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/rounds/detach`, body: input });
        },
        async setBallTeam(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/rounds/ball-team`, body: input });
        },
        async upsertSource(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/sources/upsert`, body: input });
        },
        async deleteSource(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/series/sources/delete`, body: input });
        },
    };
}
