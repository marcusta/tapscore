// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface Scorecard {
    participantId: string;
    holes: ScorecardHole[];
}

export interface ScorecardHole {
    holeNumber: number;
    strokes: null | number;
    recordedBy: null | string;
    recordedAt: string;
}

export interface ScorecardsApi {
    forParticipant(input: { participantId: string }): Promise<Scorecard>;
    forRound(input: { roundId: string }): Promise<Scorecard[]>;
}

export function createScorecardsClient(baseUrl: string): ScorecardsApi {
    return {
        async forParticipant(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/scorecards/for-participant${qs ? '?' + qs : ''}` });
        },
        async forRound(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/scorecards/for-round${qs ? '?' + qs : ''}` });
        },
    };
}
