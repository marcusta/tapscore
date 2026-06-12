// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface ScoreEvent {
    id: string;
    roundId: string;
    ballId: string;
    hole: number;
    strokes: null | number;
    eventType: 'score_entered' | 'score_cleared' | 'score_confirmed' | 'manual_override';
    recordedByPlayerId: null | string;
    recordedAt: string;
    clientEventId: string;
    sourcePlayerId: null | string;
    sourceGuestPlayerId: null | string;
    metadata: null | Record<string, unknown>;
}

export interface AppendResult {
    event: ScoreEvent;
    inserted: boolean;
}

export interface ScoreEventsApi {
    listByRound(input: { roundId: string }): Promise<ScoreEvent[]>;
    append(input: { sourcePlayerId?: null | string; sourceGuestPlayerId?: null | string; metadata?: null | { [x: string]: unknown; }; roundId: string; ballId: string; hole: number; strokes: null | number; eventType: 'score_entered' | 'score_cleared' | 'score_confirmed' | 'manual_override'; clientEventId: string }): Promise<AppendResult>;
}

export function createScoreEventsClient(baseUrl: string): ScoreEventsApi {
    return {
        async listByRound(input) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(input as any))
                if (v !== undefined) params.set(k, String(v));
            const qs = params.toString();
            return apiFetch({ method: 'GET', url: `${baseUrl}/score-events/by-round${qs ? '?' + qs : ''}` });
        },
        async append(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/score-events`, body: input });
        },
    };
}
