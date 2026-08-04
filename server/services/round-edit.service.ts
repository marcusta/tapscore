import type { Kysely } from 'kysely';

import type { Database, RoundStatus } from '../db/schema';
import type { CompilerDiagnostic } from '../domain/compiler/types';
import {
    isPlaceholderProducerDef,
    type RoundDefinition,
} from '../domain/round-definition';
import { buildRoundDefinition } from '../domain/round-setup/builder';
import {
    isIdentityProducer,
    type DraftIdentityProducer,
    type RoundSetupDraft,
} from '../domain/round-setup/draft';
import type { CorrectionService } from './correction.service';
import type { PlayerStatsService } from './player-stats.service';
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
 *   - COURSE + ROUTE stay editable while scored, as long as every SCORED hole
 *     occurrence survives the edit. Play-hole def-ids are POSITIONAL
 *     (`ph-{ordinal}`), so a score is glued to the position it was entered at,
 *     not to a course hole number. That is what makes the two real-world
 *     recoveries work without restarting the round:
 *       · started on the wrong COURSE — same 18 positions, new course; the
 *         scores stay on played-hole 1, 2, 3 and par/SI/CH recompute. Every
 *         tee must be re-picked for the new course (`tee_wrong_course`).
 *       · started on the wrong HOLE — the wizard's start-hole control ROTATES
 *         the itinerary, which keeps `ph-1…ph-18` on their positions, so the
 *         three cards already entered now name holes 10, 11, 12.
 *     An edit that would DROP a scored occurrence (e.g. full_18 → front_9
 *     after scoring hole 12) is still refused → `scored_hole_removed`.
 *   - COMPETITION rounds are the exception: course + itinerary are frozen there
 *     whether or not anything is scored → `competition_route_locked`. A
 *     competition round's holes are the organizer's published field (an admin
 *     holds the share token, so this path reaches them), and one participant
 *     re-labelling everybody's round is not a recovery, it is a corruption.
 *     The rest of a competition round's setup stays editable here.
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
 *   - dropping a hole occurrence that carries player STATISTICS
 *                                           → `stats_recorded_on_removed_hole`;
 *     removing a producer who has them      → `producer_has_stats`.
 *     Same FK reality one table over: `stat_events.play_hole_id` /
 *     `player_hole_stats.play_hole_id` are `ON DELETE RESTRICT` (migration
 *     042), so a route shrink over a hole with stats but NO scores used to
 *     escape every guard here and abort the recompile with a raw FK error.
 *     REFUSE, not cascade: stats are captured answers, indistinguishable in
 *     kind from a score, and silently deleting a player's round data to let
 *     someone else's edit through is the one outcome nobody can undo. The
 *     player clears their own stats (an event with `value: null`) and the edit
 *     then goes through.
 * Everything else stays open: add/remove (unscored) players, tee / index /
 * gender / name-row changes, add/remove/change formats and allowances, teams
 * and subjects, groups and start times.
 */

export type SetupReadResult =
    | {
          editable: true;
          status: RoundStatus;
          /** True once any score event exists — the client warns before moving
           *  the round to another course or start hole. */
          hasScores: boolean;
          /** True when this round belongs to a competition. Course + route are
           *  the organizer's published field, not one token holder's to move,
           *  so the client keeps those two controls locked. */
          competitionRound: boolean;
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
        private playerStats: PlayerStatsService,
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

    /** Does this round hang off a competition? (`competition_rounds.round_id`
     *  is UNIQUE — a round belongs to at most one.) */
    private async isCompetitionRound(roundId: string): Promise<boolean> {
        const row = await this.db
            .selectFrom('competition_rounds')
            .select('id')
            .where('round_id', '=', roundId)
            .limit(1)
            .executeTakeFirst();
        return row !== undefined;
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
            competitionRound: await this.isCompetitionRound(round.id),
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

        // Course + route are NOT frozen by the mere existence of scores — the
        // orphan guards below are the real rule, and they refuse exactly the
        // edits that would destroy recorded play. See the class comment.
        //
        // A COMPETITION round is the exception, scored or not. There the course
        // and the itinerary are the organizer's published field, shared with
        // every participant and with results already computed against it; a
        // token holder moving it would silently re-label somebody else's round.
        // Everything else on a competition round stays editable through this
        // path.
        if (routeIdentityChanged(stored.draft, resolved)) {
            if (await this.isCompetitionRound(roundId)) {
                return refuse(
                    'competition_route_locked',
                    'this round is part of a competition — its course and holes are set by the organizer and cannot be changed here',
                    'route',
                );
            }
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
        const keptPlayHoleIds = new Set(compiled.compiled.playHoles.map((p) => p.id));
        if (scored) {
            const diags = await this.scoredSubjectDiagnostics(
                roundId,
                new Set(compiled.compiled.balls.map((b) => b.id)),
                keptPlayHoleIds,
                new Set(built.definition.producers.map((p) => p.id)),
            );
            if (diags.length > 0) return { ok: false, diagnostics: diags };
        }

        // --- Guard: the same, for captured statistics ------------------------
        // Stats live on (play_hole, player), not on a ball, and a round can
        // carry them with ZERO score events — so this runs unconditionally,
        // outside the `scored` branch.
        const statDiags = await this.statSubjectDiagnostics(
            roundId,
            keptPlayHoleIds,
            keptPlayerIds(built.definition.producers),
        );
        if (statDiags.length > 0) return { ok: false, diagnostics: statDiags };

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
                        name: resolved.name?.trim() || null,
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

        // Placeholder seats (Phase 5.5) carry no tee and no identity ref, so
        // reference checks only apply to identity-bound producers.
        const identityProducers = draft.producers
            .map((p, i) => [p, i] as const)
            .filter((entry): entry is [DraftIdentityProducer, number] =>
                isIdentityProducer(entry[0]),
            );
        const teeIds = [...new Set(identityProducers.map(([p]) => p.teeId))];
        const teeRows = teeIds.length
            ? await this.db
                  .selectFrom('tees')
                  .select(['id', 'course_id'])
                  .where('id', 'in', teeIds)
                  .execute()
            : [];
        const teeById = new Map(teeRows.map((t) => [t.id, t]));
        identityProducers.forEach(([p, i]) => {
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

        for (const [p, i] of identityProducers) {
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
     * missing from the new itinerary (`scored_hole_removed`). That last one is
     * the ONLY route refusal now that course/route stay editable while scored —
     * it is the rule, not a safety net.
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
                code: 'scored_hole_removed',
                message:
                    'scores have been recorded on holes this edit would remove — keep those holes on the route',
                path: 'route',
            });
        }
        return diags;
    }

    /**
     * The same orphan guard for captured statistics (migration 042).
     *
     * Two distinct refusals, because they are two distinct mistakes:
     *   - the edit shrinks the route over an occurrence that carries stats
     *     (`stat_events.play_hole_id` is RESTRICT → a raw FK abort otherwise);
     *   - the edit removes a producer whose player carries stats. No FK stops
     *     that one — `player_id` points at `players`, which survives — so the
     *     rows would silently outlive the player's presence in the round:
     *     still returned by `statsForRound`, no longer appendable. Refusing
     *     keeps the round's stats and its roster describing the same thing.
     *
     * Distinct codes, not `scored_hole_removed` / `producer_has_scores`:
     * both clients rewrite those two into a "scores have been recorded"
     * sentence, which would be a lie here. An unknown code falls through to
     * this message verbatim on web and iOS alike.
     */
    private async statSubjectDiagnostics(
        roundId: string,
        keptPlayHoleIds: Set<string>,
        keptPlayerIds: Set<string>,
    ): Promise<CompilerDiagnostic[]> {
        const subjects = await this.playerStats.recordedSubjects(roundId);
        if (subjects.length === 0) return [];

        const diags: CompilerDiagnostic[] = [];

        if (subjects.some((s) => !keptPlayHoleIds.has(s.playHoleId))) {
            diags.push({
                code: 'stats_recorded_on_removed_hole',
                message:
                    'statistics have been recorded on holes this edit would remove — clear them first, or keep the route as it is',
                path: 'route',
            });
        }

        const droppedNames = [
            ...new Set(
                subjects
                    .filter((s) => !keptPlayerIds.has(s.playerId))
                    .map((s) => s.displayName),
            ),
        ];
        if (droppedNames.length > 0) {
            diags.push({
                code: 'producer_has_stats',
                message: `${droppedNames.join(', ')} has recorded statistics — clear them before removing the player from the round`,
                path: 'producers',
            });
        }
        return diags;
    }
}

// --- Helpers -------------------------------------------------------------------

/**
 * Registered players the edited definition still carries. Placeholder seats and
 * guests contribute nothing — neither can ever be a stats subject.
 */
function keptPlayerIds(producers: RoundDefinition['producers']): Set<string> {
    const ids = new Set<string>();
    for (const p of producers) {
        if (isPlaceholderProducerDef(p)) continue;
        if (p.playerRef.kind === 'player') ids.add(p.playerRef.id);
    }
    return ids;
}

/**
 * Does `next` play a different course, or a different itinerary, than `prev`?
 *
 * Only the fields that decide WHICH HOLES ARE PLAYED, IN WHICH ORDER count:
 * the course, the preset, and the explicit `playHoles` list (both start-hole
 * rotations and custom routes land there). Everything else on the route object
 * — SI mode, handicap policy, sections, playing groups — describes how the
 * round is scored or grouped, not where it is played, and stays editable on a
 * competition round like the rest of the setup.
 *
 * Both drafts are RESOLVED (template ids already frozen into `playHoles`), so
 * this compares like with like.
 */
function routeIdentityChanged(prev: RoundSetupDraft, next: RoundSetupDraft): boolean {
    if (prev.courseId !== next.courseId) return true;
    if ((prev.roundType ?? 'full_18') !== (next.roundType ?? 'full_18')) return true;
    return JSON.stringify(routeHoles(prev)) !== JSON.stringify(routeHoles(next));
}

/** The itinerary as a comparable list — hole number plus its per-hole
 *  overrides, in play order. Undefined `playHoles` ⇒ the preset says it all. */
function routeHoles(draft: RoundSetupDraft): unknown[] | null {
    const holes = draft.route?.playHoles;
    if (!holes) return null;
    return holes.map((h) => [
        h.courseHoleNumber,
        h.parOverride ?? null,
        h.baseStrokeIndexOverride ?? null,
    ]);
}

function refuse(code: string, message: string, path?: string): EditRoundResult {
    return { ok: false, diagnostics: [{ code, message, ...(path !== undefined ? { path } : {}) }] };
}
