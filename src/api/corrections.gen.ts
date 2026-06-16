// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface CompilerDiagnostic {
    code: string;
    message: string;
    path?: string;
}

export interface CorrectionsApi {
    setupCorrection(input: { roundId: string; target: 'producer_tee' | 'producer_handicap_index' | 'producer_category' | 'ball_composition' | 'slot_declaration' | 'ball_strategy_config' | 'play_hole' | 'playing_group'; targetRef: { [x: string]: string; }; newValue: unknown; reason: string; clientEventId: string }): Promise<{ ok: true; eventId: string; version: number } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    allowanceOverride(input: { roundId: string; reason: string; clientEventId: string; slotDefId: string; newConfig: { type: 'flat'; pct: number } | { type: 'split'; bands: ({ pct: number; upToCh: null | number })[] } }): Promise<{ ok: true; eventId: string; version: number } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
    ruling(input: { roundId: string; target: 'ball_hole' | 'ball_total' | 'slot_ball_result'; reason: string; clientEventId: string; targetId: string; rulingKind: 'dq' | 'penalty_strokes' | 'hole_adjudication' | 'wd'; value: unknown }): Promise<{ ok: true; id: string } | { ok: false; diagnostics: CompilerDiagnostic[] }>;
}

export function createCorrectionsClient(baseUrl: string): CorrectionsApi {
    return {
        async setupCorrection(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/corrections/setup`, body: input });
        },
        async allowanceOverride(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/corrections/allowance`, body: input });
        },
        async ruling(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/corrections/ruling`, body: input });
        },
    };
}
