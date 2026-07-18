import type { Kysely } from 'kysely';

import type { Database, RoundStatus } from '../db/schema';
import type { CompilerDiagnostic } from '../domain/compiler/types';
import { buildRoundDefinition } from '../domain/round-setup/builder';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import type { CorrectionService } from './correction.service';
import type { Round, RoundService } from './round.service';

/**
 * Phase 3.5 — edit a round's setup AFTER creation, in the wizard's own
 * vocabulary.
 *
 * The originating `RoundSetupDraft` is a persisted, versioned document
 * (`round_setup_drafts`, migration 034). This service exposes the token-scoped
 * read (`setupByToken` — the stored draft plus editability) and write
 * (`editByToken` — a full replacement draft). The write path rebuilds the
 * definition with the SAME pure builder the create path uses
 * (`buildRoundDefinition`) and persists through the established 2.6d
 * composed-correction machinery (`CorrectionService.applyComposedSetupCorrection`):
 * a `setup_correction_events` audit row (target `setup_draft`, old/new = the
 * full drafts), a new `round_definitions` version, and a diff-upserted
 * recompile. Content-addressed ids keep untouched balls — and their
 * append-only score events — valid across the edit; a NEW format added
 * mid-round scores retroactively from the existing event log, because score
 * events key only (ball_id, play_hole_id), never a slot.
 *
 * Locks & guardrails (structured diagnostics, never a 500 for a refusal):
 *   - NOTE: a `complete` friendly round is NOT locked — "finish" is purely
 *     organizational; finalization locks arrive with competition rounds
 *     (Phase 4). The `round_complete` reason/diagnostic is dormant.
 *   - no stored draft (non-draft round)     → `not_editable`;
 *   - ANY score event exists → course + route changes refused
 *                                           → `edit_locked_course_route`;
 *   - removing a producer whose ball has score events
 *                                           → `producer_has_scores`.
 *     FK reality: `score_events.ball_id` is `ON DELETE RESTRICT` (migration
 *     020), so without this guard the recompile's diff-delete of the orphaned
 *     ball would abort the whole transaction with a raw SQLite FK error (a
 *     500; nothing half-written). The guard turns that into a structured
 *     refusal BEFORE persisting anything. Deleting the events instead is off
 *     the table — the event log is append-only by design.
 *   - any other edit that would delete a scored ball (e.g. reshuffling a
 *     scored team's membership, which changes the ball's content-addressed
 *     id)                                   → `scored_ball_orphaned`.
 * Everything else stays open: add/remove (unscored) players, tee / index /
 * gender / name-row changes, add/remove/change formats and allowances, teams
 * and subjects, groups and start times.
 */

export type SetupReadResult =
    | {
          editable: true;
          status: RoundStatus;
          /** True once any score event exists — the client greys course/route. */
          hasScores: boolean;
          draft: RoundSetupDraft;
          draftVersion: number;
      }
    | { editable: false; status: RoundStatus; reason: 'round_complete' | 'no_stored_draft' };

export type EditRoundResult =
    | { ok: true; round: Round }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

export interface EditByTokenInput {
    token: string;
    /** The full replacement draft (the wizard re-submits the whole document). */
    draft: RoundSetupDraft;
    /** SERVER-resolved from the optional session — never from the body. */
    recordedByPlayerId?: string | null;
    /** Idempotency key; a replay returns the original outcome. */
    clientEventId?: string;
}

export class RoundEditService {
    constructor(
        private db: Kysely<Database>,
        private rounds: RoundService,
        private corrections: CorrectionService,
    ) {}

    /** Token → round row, or null for an unknown token (API turns it into 404). */
    private async roundForToken(
        token: string,
    ): Promise<{ id: string; status: RoundStatus } | null> {
        const row = await this.db
            .selectFrom('friendly_rounds as fr')
            .innerJoin('rounds as r', 'r.id', 'fr.round_id')
            .where('fr.share_token', '=', token)
            .select(['r.id', 'r.status'])
            .executeTakeFirst();
        return row ?? null;
    }

    private async hasScores(roundId: string): Promise<boolean> {
        const row = await this.db
            .selectFrom('score_events')
            .select('id')
            .where('round_id', '=', roundId)
            .limit(1)
            .executeTakeFirst();
        return row !== undefined;
    }

    /**
     * The stored draft + editability for the round behind `token`. Null for an
     * unknown token. `status` rides along in every branch so the client can
     * apply the course/route lock UI without a second read.
     */
    async setupByToken(token: string): Promise<SetupReadResult | null> {
        const round = await this.roundForToken(token);
        if (!round) return null;
        // Friendly rounds never lock on completion; finalization locks arrive
        // with competition rounds (Phase 4). A `complete` round stays editable —
        // "finish" is purely organizational (it moves the round to the landing's
        // "Recently finished" section), so we do NOT refuse here on status.
        const stored = await this.rounds.latestSetupDraft(round.id);
        if (!stored) {
            return { editable: false, status: round.status, reason: 'no_stored_draft' };
        }
        return {
            editable: true,
            status: round.status,
            hasScores: await this.hasScores(round.id),
            draft: stored.draft,
            draftVersion: stored.version,
        };
    }

    /**
     * Replace the round's setup with `draft`. Null for an unknown token;
     * every ordinary refusal (locks, builder/compiler problems) is a
     * structured `{ ok: false, diagnostics }` — never a 500.
     */
    async editByToken(input: EditByTokenInput): Promise<EditRoundResult | null> {
        const round = await this.roundForToken(input.token);
        if (!round) return null;
        const roundId = round.id;

        // Friendly rounds never lock on completion; finalization locks arrive
        // with competition rounds (Phase 4). A `complete` round is still fully
        // editable — no status-based refusal here.

        const stored = await this.rounds.latestSetupDraft(roundId);
        if (!stored) {
            return refuse(
                'not_editable',
                'this round did not originate from a setup draft, so it cannot be edited in the wizard',
            );
        }

        // Freeze a named route template exactly like the create path — the
        // stored draft is always the resolved form.
        let resolved = await this.rounds.resolveDraftRoute(input.draft);

        // --- Start-list policy carry-forward (Phase 5.5) ----------------------
        // The policy is just another draft field riding this full-document
        // replace, so a submitted `startList` object replaces the stored one —
        // that IS the policy-edit path (token holders per the existing edit
        // rules; competition admins hold the token via the admin-gated detail
        // read). But a body that OMITS the field means "no policy change", not
        // "reset to open": the wizard reconstructs drafts from form state and
        // has no policy controls yet, and silently dropping an organized
        // policy on an unrelated edit would reopen the self-join leak. To
        // deliberately reopen a round, submit the open policy explicitly.
        if (resolved.startList === undefined && stored.draft.startList !== undefined) {
            resolved = { ...resolved, startList: stored.draft.startList };
        }

        // --- Reference pre-checks -------------------------------------------
        // `buildCompilerInput` THROWS on a missing course/tee/player (setup-
        // integrity errors on the trusted create path). An edit body is
        // client-supplied, so surface these as diagnostics instead of a 500.
        const refDiags = await this.validateReferences(resolved);
        if (refDiags.length > 0) return { ok: false, diagnostics: refDiags };

        const scored = await this.hasScores(roundId);

        // --- Lock: course + route frozen once anything is scored -------------
        if (scored && !sameCourseAndRoute(stored.draft, resolved)) {
            return refuse(
                'edit_locked_course_route',
                'scores have been recorded — the course and route can no longer change',
                'route',
            );
        }

        // --- Build + compile (pure; nothing persists yet) ---------------------
        const built = buildRoundDefinition(resolved);
        if (!built.ok) return { ok: false, diagnostics: built.diagnostics };

        // Pre-flight compile for the scored-subject guard. The correction
        // service recompiles internally; compiling twice is the price of
        // keeping `applyComposedSetupCorrection`'s surface unchanged, and the
        // compiler is pure + cheap at friendly-round scale.
        const compiled = await this.rounds.compileDefinition(roundId, built.definition);
        if (!compiled.ok) return { ok: false, diagnostics: compiled.diagnostics };

        // --- Guard: no edit may orphan a scored ball or occurrence -----------
        // score_events.ball_id / play_hole_id are ON DELETE RESTRICT — without
        // this the recompile transaction would abort with a raw FK error.
        if (scored) {
            const diags = await this.scoredSubjectDiagnostics(
                roundId,
                new Set(compiled.compiled.balls.map((b) => b.id)),
                new Set(compiled.compiled.playHoles.map((p) => p.id)),
                new Set(built.definition.producers.map((p) => p.id)),
            );
            if (diags.length > 0) return { ok: false, diagnostics: diags };
        }

        // --- Persist through the composed-correction path --------------------
        const nextDraftVersion = stored.version + 1;
        const res = await this.corrections.applyComposedSetupCorrection({
            roundId,
            target: 'setup_draft',
            targetRef: { draftVersion: String(nextDraftVersion) },
            oldValue: stored.draft,
            newValue: resolved,
            reason: 'setup edited via wizard',
            recordedBy: input.recordedByPlayerId ?? null,
            clientEventId: input.clientEventId ?? crypto.randomUUID(),
            definition: built.definition,
            afterPersist: async (trx, { eventId }) => {
                await this.rounds.appendSetupDraftVersion(
                    trx,
                    roundId,
                    resolved,
                    'setup_edit',
                    eventId,
                );
                // Round-level metadata columns mirror the definition (the
                // create path set them from the same fields).
                const courseName = await trx
                    .selectFrom('courses')
                    .select('name')
                    .where('id', '=', resolved.courseId)
                    .executeTakeFirst();
                await trx
                    .updateTable('rounds')
                    .set({
                        course_id: resolved.courseId,
                        date: resolved.playedAt,
                        round_type: resolved.roundType ?? 'full_18',
                        venue_type: resolved.venueType ?? 'outdoor',
                        course_name_snapshot: courseName?.name ?? null,
                    })
                    .where('id', '=', roundId)
                    .execute();
            },
        });
        if (!res.ok) return { ok: false, diagnostics: res.diagnostics };

        const after = await this.rounds.getById(roundId);
        if (!after) throw new Error(`round ${roundId} not found after setup edit`);
        return { ok: true, round: after };
    }

    /** Course exists (with holes) + every tee belongs to it + every player ref resolves. */
    private async validateReferences(draft: RoundSetupDraft): Promise<CompilerDiagnostic[]> {
        const diags: CompilerDiagnostic[] = [];

        const course = await this.db
            .selectFrom('courses')
            .select('id')
            .where('id', '=', draft.courseId)
            .executeTakeFirst();
        if (!course) {
            return [{ code: 'unknown_course', message: `course '${draft.courseId}' not found`, path: 'courseId' }];
        }

        const teeIds = [...new Set(draft.producers.map((p) => p.teeId))];
        const teeRows = teeIds.length
            ? await this.db
                  .selectFrom('tees')
                  .select(['id', 'course_id'])
                  .where('id', 'in', teeIds)
                  .execute()
            : [];
        const teeById = new Map(teeRows.map((t) => [t.id, t]));
        draft.producers.forEach((p, i) => {
            const tee = teeById.get(p.teeId);
            if (!tee) {
                diags.push({ code: 'unknown_tee', message: `tee '${p.teeId}' not found`, path: `producers[${i}].teeId` });
            } else if (tee.course_id !== draft.courseId) {
                diags.push({
                    code: 'tee_wrong_course',
                    message: `tee '${p.teeId}' belongs to a different course than this round`,
                    path: `producers[${i}].teeId`,
                });
            }
        });

        for (const [i, p] of draft.producers.entries()) {
            const table = p.playerRef.kind === 'player' ? 'players' : 'guest_players';
            const row = await this.db
                .selectFrom(table)
                .select('id')
                .where('id', '=', p.playerRef.id)
                .executeTakeFirst();
            if (!row) {
                diags.push({
                    code: p.playerRef.kind === 'player' ? 'unknown_player' : 'unknown_guest',
                    message: `${p.playerRef.kind} '${p.playerRef.id}' not found`,
                    path: `producers[${i}].playerRef`,
                });
            }
        }
        return diags;
    }

    /**
     * Diagnostics for every SCORED subject the edit would orphan: a scored
     * ball missing from the new compile (producer removal → `producer_has_scores`;
     * anything else, e.g. a scored team reshuffle changing the ball's
     * content-addressed id → `scored_ball_orphaned`), and a scored occurrence
     * missing from the new itinerary (`edit_locked_course_route` safety net —
     * normally unreachable behind the draft-level route lock).
     */
    private async scoredSubjectDiagnostics(
        roundId: string,
        keptBallIds: Set<string>,
        keptPlayHoleIds: Set<string>,
        newProducerDefIds: Set<string>,
    ): Promise<CompilerDiagnostic[]> {
        const diags: CompilerDiagnostic[] = [];

        const scoredRows = await this.db
            .selectFrom('score_events')
            .select(['ball_id', 'play_hole_id'])
            .where('round_id', '=', roundId)
            .groupBy(['ball_id', 'play_hole_id'])
            .execute();

        const orphanedBallIds = [...new Set(scoredRows.map((r) => r.ball_id))].filter(
            (id) => !keptBallIds.has(id),
        );
        for (const ballId of orphanedBallIds) {
            const members = await this.db
                .selectFrom('ball_players')
                .select(['producer_def_id', 'display_name_snapshot'])
                .where('ball_id', '=', ballId)
                .execute();
            const removed = members.filter((m) => !newProducerDefIds.has(m.producer_def_id));
            if (removed.length > 0) {
                diags.push({
                    code: 'producer_has_scores',
                    message: `${removed.map((m) => m.display_name_snapshot).join(', ')} has recorded scores — a scored player cannot be removed from the round`,
                    path: 'producers',
                });
            } else {
                diags.push({
                    code: 'scored_ball_orphaned',
                    message: `this edit would delete a ball (${members.map((m) => m.display_name_snapshot).join(' & ') || ballId}) that already has recorded scores`,
                    path: 'formats',
                });
            }
        }

        const orphanedHoles = new Set(
            scoredRows.map((r) => r.play_hole_id).filter((id) => !keptPlayHoleIds.has(id)),
        );
        if (orphanedHoles.size > 0) {
            diags.push({
                code: 'edit_locked_course_route',
                message: 'scores have been recorded on holes this edit would remove — the route can no longer change',
                path: 'route',
            });
        }
        return diags;
    }
}

// --- Helpers -------------------------------------------------------------------

function refuse(code: string, message: string, path?: string): EditRoundResult {
    return { ok: false, diagnostics: [{ code, message, ...(path !== undefined ? { path } : {}) }] };
}

/**
 * Draft-level course/route equality: courseId + roundType + the whole `route`
 * document (compared canonically — key order insensitive, arrays ordered).
 * Both sides are resolved drafts, so a template-created round compares its
 * frozen route, never the live template.
 */
function sameCourseAndRoute(a: RoundSetupDraft, b: RoundSetupDraft): boolean {
    const pick = (d: RoundSetupDraft) => ({
        courseId: d.courseId,
        roundType: d.roundType ?? 'full_18',
        route: d.route ?? null,
    });
    return canonicalJson(pick(a)) === canonicalJson(pick(b));
}

/** JSON with recursively sorted object keys; `undefined` values dropped. */
function canonicalJson(v: unknown): string {
    return JSON.stringify(sortKeys(v));
}

function sortKeys(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v !== null && typeof v === 'object') {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(v as Record<string, unknown>).sort()) {
            const val = (v as Record<string, unknown>)[k];
            if (val !== undefined) out[k] = sortKeys(val);
        }
        return out;
    }
    return v;
}
