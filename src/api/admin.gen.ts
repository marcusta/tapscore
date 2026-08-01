// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface RoleGrant {
    id: string;
    playerId: string;
    role: 'super_admin' | 'series_admin' | 'tour_admin' | 'competition_admin' | 'friendly_round_owner';
    scopeType: null | string;
    scopeId: null | string;
    grantedAt: string;
}

export interface AdminStats {
    players: number;
    guests: number;
    rounds: number;
    roundsActive: number;
    roundsComplete: number;
    roundsLast7Days: number;
    scoreEvents: number;
}

export interface AdminRoundSummary {
    roundId: string;
    shareToken: null | string;
    date: string;
    status: 'active' | 'not_started' | 'complete';
    visibility: 'private' | 'friends' | 'link';
    courseName: null | string;
    createdAt: string;
    completedAt: null | string;
    creatorPlayerId: null | string;
    creatorName: null | string;
    participants: string[];
    scoreEventCount: number;
    lastEventAt: null | string;
}

export interface AdminPlayerSummary {
    playerId: string;
    username: string;
    displayName: string;
    handicapIndex: null | number;
    createdAt: string;
    deletedAt: null | string;
    roundCount: number;
    lastRoundDate: null | string;
    roles: string[];
}

export interface AdminApi {
    myRoles(): Promise<RoleGrant[]>;
    adminStats(): Promise<AdminStats>;
    adminRounds(input: { limit?: number; offset?: number }): Promise<AdminRoundSummary[]>;
    adminPlayers(): Promise<AdminPlayerSummary[]>;
    adminGrantRole(input: { playerId: string; role: 'super_admin' | 'series_admin' | 'tour_admin' | 'competition_admin' | 'friendly_round_owner'; scopeType?: null | string; scopeId?: null | string }): Promise<RoleGrant>;
    adminRevokeRole(input: { playerId: string; role: 'super_admin' | 'series_admin' | 'tour_admin' | 'competition_admin' | 'friendly_round_owner'; scopeType?: null | string; scopeId?: null | string }): Promise<{ ok: true }>;
}

export function createAdminClient(baseUrl: string): AdminApi {
    return {
        async myRoles() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/me/roles` });
        },
        async adminStats() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/admin/stats` });
        },
        async adminRounds(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/admin/rounds${qs ? '?' + qs : ''}` });
        },
        async adminPlayers() {
            return apiFetch({ method: 'GET', url: `${baseUrl}/admin/players` });
        },
        async adminGrantRole(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/admin/roles/grant`, body: input });
        },
        async adminRevokeRole(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/admin/roles/revoke`, body: input });
        },
    };
}
