// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface HandicapEntry {
    id: string;
    playerId: string;
    handicapIndex: number;
    source: 'manual' | 'calculated' | 'import';
    effectiveDate: string;
    enteredByPlayerId: null | string;
    createdAt: string;
}

export interface HandicapApi {
    latest(input: { playerId: string }): Promise<null | HandicapEntry>;
    history(input: { playerId: string }): Promise<HandicapEntry[]>;
    record(input: { handicapIndex: number; playerId: string; source: 'manual' | 'calculated' | 'import'; effectiveDate: string }): Promise<HandicapEntry>;
}

export function createHandicapClient(baseUrl: string): HandicapApi {
    return {
        async latest(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/handicap/latest${qs ? '?' + qs : ''}` });
        },
        async history(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/handicap/history${qs ? '?' + qs : ''}` });
        },
        async record(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/handicap/record`, body: input });
        },
    };
}
