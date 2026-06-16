// GENERATED — DO NOT EDIT
import { apiFetch } from '@basics/core/client/fetch';

export interface ConfigDiagnostic {
    code: string;
    message: string;
    path?: string;
}

export interface FormatActionsApi {
    append(input: { playHoleId?: null | string; sequence?: number; schemaVersion?: number; subjectBallId?: null | string; subjectProducerDefId?: null | string; supersedesActionId?: null | string; roundId: string; clientEventId: string; slotDefId: string; actionType: string; payload: unknown }): Promise<{ ok: true; id: string } | { ok: false; diagnostics: ConfigDiagnostic[] }>;
}

export function createFormatActionsClient(baseUrl: string): FormatActionsApi {
    return {
        async append(input) {
            return apiFetch({ method: 'POST', url: `${baseUrl}/format-actions`, body: input });
        },
    };
}
