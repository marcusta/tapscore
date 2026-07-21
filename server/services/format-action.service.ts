import type { Kysely } from 'kysely';

import type { Database } from '../db/schema';
import {
    findFormatPlugin,
    hasFormatPlugin,
    type ConfigDiagnostic,
    type FormatActionInput,
} from '../domain/formats/plugin';
import type { RoundService } from './round.service';

/**
 * Phase 2.6d — the ONE generic endpoint for stateful format actions (§17).
 *
 * Persistence owns only the generic `format_action_events` envelope. This
 * service is the append path; it delegates every format-specific decision to
 * the registered plugin:
 *
 *   1. The slot exists in the round's current definition.
 *   2. The slot's registered format OWNS the action type (declared in
 *      `plugin.actionTypes`). A stateless format (no `actionTypes`) rejects all
 *      actions.
 *   3. The payload passes that plugin's `validateAction`.
 *   4. The action is legal for the current round/play-hole state (the
 *      occurrence exists; `requiresPlayHole` honoured; a supersession target
 *      exists in the same slot).
 *
 * Rows are append-only — a correction is a NEW action carrying
 * `supersedesActionId`, never an update/delete. There is NO per-format column,
 * table, or switch here: deleting a format plugin removes its actions' meaning
 * with zero persistence/API change.
 */

export interface AppendFormatActionInput {
    roundId: string;
    slotDefId: string;
    playHoleId?: string | null;
    sequence?: number;
    actionType: string;
    schemaVersion?: number;
    subjectBallId?: string | null;
    subjectProducerDefId?: string | null;
    payload: unknown;
    supersedesActionId?: string | null;
    recordedBy?: string | null;
    clientEventId: string;
}

export type AppendFormatActionResult =
    | { ok: true; id: string }
    | { ok: false; diagnostics: ConfigDiagnostic[] };

export class FormatActionService {
    constructor(
        private db: Kysely<Database>,
        private roundService: RoundService,
    ) {}

    async append(input: AppendFormatActionInput): Promise<AppendFormatActionResult> {
        // Idempotent replay — same (round, client_event_id) returns the prior row.
        const existing = await this.db
            .selectFrom('format_action_events')
            .where('round_id', '=', input.roundId)
            .where('client_event_id', '=', input.clientEventId)
            .select('id')
            .executeTakeFirst();
        if (existing) return { ok: true, id: existing.id };

        const diags: ConfigDiagnostic[] = [];

        // 1) Slot exists in the current definition.
        const latest = await this.roundService.latestDefinition(input.roundId);
        if (!latest) {
            return {
                ok: false,
                diagnostics: [
                    { code: 'no_definition', message: `round ${input.roundId} has no compiled definition` },
                ],
            };
        }
        const slot = latest.definition.slots.find((s) => s.id === input.slotDefId);
        if (!slot) {
            return {
                ok: false,
                diagnostics: [
                    {
                        code: 'unknown_slot',
                        message: `no slot with def-id '${input.slotDefId}' in round ${input.roundId}`,
                        path: 'slotDefId',
                    },
                ],
            };
        }

        // 2) The slot's format owns the action type.
        if (!hasFormatPlugin(slot.formatId)) {
            return {
                ok: false,
                diagnostics: [
                    { code: 'unknown_format', message: `no format plugin '${slot.formatId}'`, path: 'slotDefId' },
                ],
            };
        }
        const plugin = findFormatPlugin(slot.formatId);
        const declared = plugin.actionTypes ?? [];
        const decl = declared.find((d) => d.type === input.actionType);
        if (!decl) {
            return {
                ok: false,
                diagnostics: [
                    {
                        code: 'action_type_not_supported',
                        message: `format '${slot.formatId}' does not declare action type '${input.actionType}'`,
                        path: 'actionType',
                    },
                ],
            };
        }

        // 4a) Occurrence legality (before the plugin payload check).
        const playHoleId = input.playHoleId ?? null;
        if (decl.requiresPlayHole && !playHoleId) {
            diags.push({
                code: 'play_hole_required',
                message: `action '${input.actionType}' requires a play-hole occurrence`,
                path: 'playHoleId',
            });
        }
        if (playHoleId) {
            const occ = await this.db
                .selectFrom('round_play_holes')
                .where('round_id', '=', input.roundId)
                .where('id', '=', playHoleId)
                .select('id')
                .executeTakeFirst();
            if (!occ) {
                diags.push({
                    code: 'unknown_play_hole',
                    message: `play-hole '${playHoleId}' is not an occurrence in round ${input.roundId}`,
                    path: 'playHoleId',
                });
            }
        }

        // 4a-bis) Claim-before-act (Phase 5.5 hard rule #1, closed in Slice 3):
        // a format action whose SUBJECT covers an unclaimed placeholder seat is
        // refused exactly like a score write (`seat_unclaimed`) — with a member
        // unknown, no in-round decision (captain, partner, call) can honestly
        // bind to that ball/producer. Subject-less (slot-level) actions proceed.
        const seatDiag = await this.unclaimedSeatDiagnostic(
            input.roundId,
            input.subjectBallId ?? null,
            input.subjectProducerDefId ?? null,
        );
        if (seatDiag) diags.push(seatDiag);

        // 4b) Supersession target must exist in the same slot.
        if (input.supersedesActionId) {
            const prior = await this.db
                .selectFrom('format_action_events')
                .where('round_id', '=', input.roundId)
                .where('slot_def_id', '=', input.slotDefId)
                .where('id', '=', input.supersedesActionId)
                .select('id')
                .executeTakeFirst();
            if (!prior) {
                diags.push({
                    code: 'unknown_supersession_target',
                    message: `supersedesActionId '${input.supersedesActionId}' is not an action in this slot`,
                    path: 'supersedesActionId',
                });
            }
        }

        // 3) Plugin payload validation.
        const actionInput: FormatActionInput = {
            slotDefId: input.slotDefId,
            playHoleId,
            sequence: input.sequence ?? 0,
            actionType: input.actionType,
            schemaVersion: input.schemaVersion ?? 1,
            subjectBallId: input.subjectBallId ?? null,
            subjectProducerDefId: input.subjectProducerDefId ?? null,
            payload: input.payload,
        };
        if (plugin.validateAction) {
            diags.push(...plugin.validateAction(actionInput));
        }

        if (diags.length > 0) return { ok: false, diagnostics: diags };

        const id = crypto.randomUUID();
        await this.db.transaction().execute(async (trx) => {
            await trx
                .insertInto('format_action_events')
                .values({
                    id,
                    round_id: input.roundId,
                    slot_def_id: input.slotDefId,
                    play_hole_id: playHoleId,
                    sequence: actionInput.sequence,
                    action_type: input.actionType,
                    schema_version: actionInput.schemaVersion,
                    subject_ball_id: actionInput.subjectBallId,
                    subject_producer_def_id: actionInput.subjectProducerDefId,
                    payload: JSON.stringify(input.payload),
                    supersedes_action_id: input.supersedesActionId ?? null,
                    recorded_by_player_id: input.recordedBy ?? null,
                    client_event_id: input.clientEventId,
                })
                .execute();
            // Format actions feed score() replay → they change results; move
            // the polling cursor in the same transaction as the append.
            await this.roundService.bumpResultCursor(input.roundId, id, trx);
        });
        return { ok: true, id };
    }

    /**
     * The Phase 5.5 pending-subject probe: a `seat_unclaimed` diagnostic when
     * the addressed ball (or the ball carrying the addressed producer) covers
     * an UNCLAIMED placeholder seat — both identity FKs NULL, the canonical
     * pending signal (never inferred from name strings). Mirrors the score
     * append's refusal, diagnostic-shaped because this service's refusal
     * contract is `{ ok:false, diagnostics }`.
     */
    private async unclaimedSeatDiagnostic(
        roundId: string,
        subjectBallId: string | null,
        subjectProducerDefId: string | null,
    ): Promise<ConfigDiagnostic | null> {
        if (subjectBallId === null && subjectProducerDefId === null) return null;
        const pending = this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            .where('bp.player_id', 'is', null)
            .where('bp.guest_player_id', 'is', null)
            .select('bp.display_name_snapshot');
        if (subjectBallId !== null) {
            const seats = await pending.where('bp.ball_id', '=', subjectBallId).execute();
            if (seats.length > 0) return seatUnclaimed(seats, 'subjectBallId');
        }
        if (subjectProducerDefId !== null) {
            // Producer subject: the seat itself, wherever its ball is.
            const seats = await pending
                .where('bp.producer_def_id', '=', subjectProducerDefId)
                .execute();
            if (seats.length > 0) return seatUnclaimed(seats, 'subjectProducerDefId');
        }
        return null;
    }
}

/** The shared `seat_unclaimed` diagnostic, mirroring the score append's wording. */
function seatUnclaimed(
    seats: { display_name_snapshot: string }[],
    path: 'subjectBallId' | 'subjectProducerDefId',
): ConfigDiagnostic {
    const labels = seats.map((s) => `"${s.display_name_snapshot}"`).join(', ');
    return {
        code: 'seat_unclaimed',
        message: `Fill in who is playing first — ${labels} ${seats.length > 1 ? 'are open seats' : 'is an open seat'} on this ball, and format actions can only target it once every seat is claimed.`,
        path,
    };
}
