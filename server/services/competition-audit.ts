// Phase 4 Slice 4 — the spec §12 competition audit log (who / when / with
// what values) over `competition_audit_events` (migration 038).
//
// Same append-only typed-event discipline as the 2.6d correction tables:
// events are RECORDED, never updated or deleted. Plain functions (not a
// service class) because the writers must join their caller's TRANSACTION —
// a cut stamp or a finalize snapshot and its audit event commit atomically or
// not at all, so the writer takes whichever `Kysely` handle (connection or
// trx) the caller is inside.

import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { CompetitionAuditAction, Database } from '../db/schema';

export interface CompetitionAuditEvent {
    id: string;
    competitionId: string;
    action: CompetitionAuditAction;
    /** Parsed `payload_json` — shape per action (see the writers' call sites). */
    payload: unknown;
    recordedByPlayerId: string | null;
    recordedAt: string;
}

/** Append one audit event. `db` may be a transaction handle. */
export async function recordCompetitionAuditEvent(
    db: Kysely<Database>,
    input: {
        competitionId: string;
        action: CompetitionAuditAction;
        payload: unknown;
        recordedByPlayerId: string | null;
    },
): Promise<string> {
    const id = crypto.randomUUID();
    await db
        .insertInto('competition_audit_events')
        .values({
            id,
            competition_id: input.competitionId,
            action: input.action,
            payload_json: JSON.stringify(input.payload),
            recorded_by_player_id: input.recordedByPlayerId,
        })
        .execute();
    return id;
}

/** All audit events for a competition, oldest first (Phase 10 surfaces these). */
export async function listCompetitionAuditEvents(
    db: Kysely<Database>,
    competitionId: string,
    action?: CompetitionAuditAction,
): Promise<CompetitionAuditEvent[]> {
    let q = db
        .selectFrom('competition_audit_events')
        .selectAll()
        .where('competition_id', '=', competitionId);
    if (action !== undefined) q = q.where('action', '=', action);
    const rows = await q.orderBy(sql`rowid`, 'asc').execute();
    return rows.map((row) => ({
        id: row.id,
        competitionId: row.competition_id,
        action: row.action,
        payload: JSON.parse(row.payload_json),
        recordedByPlayerId: row.recorded_by_player_id,
        recordedAt: row.recorded_at,
    }));
}

/** Has an event of this action already been recorded? (`applyCut` uses this —
 *  ONE cut per competition, even a cut that trimmed nobody.) */
export async function hasCompetitionAuditEvent(
    db: Kysely<Database>,
    competitionId: string,
    action: CompetitionAuditAction,
): Promise<boolean> {
    const row = await db
        .selectFrom('competition_audit_events')
        .select('id')
        .where('competition_id', '=', competitionId)
        .where('action', '=', action)
        .limit(1)
        .executeTakeFirst();
    return row !== undefined;
}
