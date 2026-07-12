// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Competition {
    id: string;
    name: string;
    lifecycle: 'draft' | 'setup' | 'active' | 'finalized';
    defaultConfig: unknown;
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
    code: 'illegal_transition' | 'finalize_reserved' | 'competition_finalized' | 'lifecycle_forbids_edit' | 'lifecycle_forbids_roster' | 'lifecycle_forbids_withdraw' | 'already_participant' | 'unknown_player' | 'unknown_guest' | 'participant_not_found';
    message: string;
}

export interface CompetitionAggregation {
    strategyId: string;
    config: unknown;
}

export interface CompetitionsApi {
    get(input: { id: string }): Promise<Competition>;
    participants(input: { competitionId: string }): Promise<CompetitionParticipant[]>;
    list(): Promise<Competition[]>;
    create(input: { name: string }): Promise<Competition>;
    update(input: { name?: string; defaultConfig?: unknown; aggregation?: null | { strategyId: string; config: unknown }; cutRules?: unknown; id: string }): Promise<{ ok: false; refusal: CompetitionRefusal } | { ok: true; value: Competition }>;
    transition(input: { id: string; to: 'draft' | 'setup' | 'active' | 'finalized' }): Promise<{ ok: false; refusal: CompetitionRefusal } | { ok: true; value: Competition }>;
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
