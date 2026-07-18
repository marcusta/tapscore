import type { Kysely } from 'kysely';

import type { Database } from '../db/schema';
import type { CompilerDiagnostic } from '../domain/compiler/types';
import {
    definitionInputFromResolved,
    isIdentityProducerDef,
    type PlayingGroupInput,
    type ResolvedRoundDefinition,
} from '../domain/round-definition';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import type { CorrectionService } from './correction.service';
import type { Round, RoundService } from './round.service';

/**
 * Phase 3.5 — leave a round: a logged-in player removes THEIR OWN
 * participation (their producer, their own ball, their score events) from a
 * friendly round, leaving everyone else's data and the round itself intact.
 *
 * This is the FIRST identity-gated, self-scoped mutation in the app. Unlike
 * the trust-based token surface (scoring / delete / finish, where the share
 * token is the only credential), leaving REQUIRES a session and the caller
 * can only ever remove THEMSELVES — `playerId` is resolved from the session
 * by the API layer, never accepted from the body.
 *
 * Mechanism — self-join in reverse, through the SAME recompile machinery:
 *   1. Resolve the caller's producer(s) in the latest definition: a direct
 *      `playerRef.kind === 'player'` match, or a producer whose ball's
 *      `ball_players.player_id` is the caller (a claimed guest — the claim
 *      flips the ball row while the definition keeps the guest ref).
 *   2. Refuse entanglement: if ANY of the caller's producers is inside a
 *      ball-strategy `composition` team (a merged team ball — scramble &c.)
 *      or a slot `teamGrouping` team (a side — better-ball &c.), leaving
 *      would corrupt or reshape the TEAMMATES' data, so the whole leave is
 *      refused with a `shared_ball` diagnostic. This is deliberately the
 *      simplest safe rule: a caller who also holds individual own-ball slots
 *      is still refused — disentangle the team in edit first.
 *   3. Compose a new definition without the caller: producer dropped, their
 *      playing-group membership removed (an emptied group is dropped),
 *      explicit slot ball-selectors shrunk. Content-addressed ids keep every
 *      OTHER ball — and its append-only score events — untouched.
 *   4. Persist through `CorrectionService.applyComposedSetupCorrection`.
 *      `beforePersist` (same transaction) deletes the caller's OWN ball's
 *      `score_events` + `scorecards` rows FIRST, so the recompile's
 *      diff-delete of that ball passes the `score_events.ball_id
 *      ON DELETE RESTRICT` FK. This deliberately overrides the edit-round
 *      `producer_has_scores` guard FOR THE CALLER'S OWN PRODUCER ONLY: the
 *      guard exists to stop an editor destroying someone ELSE's recorded
 *      scores; here the scores are the caller's own, the deletion is
 *      self-scoped to their single-producer ball, and friendly rounds never
 *      lock. `afterPersist` appends the shrunk `RoundSetupDraft` version so a
 *      later wizard edit / self-join stays coherent.
 *
 * Degenerate slots are NOT special-cased: dropping the producer and
 * recompiling lets the compiler diagnose whatever breaks — e.g. leaving a
 * 2-player match leaves 1 ball, which `match_play_individual`'s
 * `slotBallCount.min: 2` refuses as `slot_ball_count_below_min`, naming the
 * slot. The one case the compiler CANNOT see is an explicit ball-selector
 * shrinking to empty (compile treats an empty producer filter as absent and
 * would silently widen the slot to the whole roster) — that is refused here
 * as `slot_would_be_empty`.
 *
 * Refusal contract:
 *   - unknown token → `null` (API turns it into a 404);
 *   - caller not in the round, sole player, entangled in a team, or any
 *     compile diagnostic → `{ ok: false, diagnostics }` (200).
 *   Never a 500 for an ordinary refusal. No status gate — friendly rounds
 *   never lock, and leaving mid-round is the whole point of the feature.
 */

export type LeaveRoundResult =
    | { ok: true; round: Round }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

export interface LeaveByTokenInput {
    token: string;
    /** SERVER-resolved from the session — never from the request body. */
    playerId: string;
}

export class RoundLeaveService {
    constructor(
        private db: Kysely<Database>,
        private rounds: RoundService,
        private corrections: CorrectionService,
    ) {}

    async leaveByToken(input: LeaveByTokenInput): Promise<LeaveRoundResult | null> {
        // --- Token → round ----------------------------------------------------
        const fr = await this.db
            .selectFrom('friendly_rounds')
            .select('round_id')
            .where('share_token', '=', input.token)
            .executeTakeFirst();
        if (!fr) return null;
        const roundId = fr.round_id;

        const latest = await this.rounds.latestDefinition(roundId);
        if (!latest) {
            return refuse(
                'unknown_round',
                `round '${roundId}' has no compiled definition`,
                'roundId',
            );
        }
        const definition = latest.definition;

        // --- Which producers are the caller? ----------------------------------
        // Definition-level player refs catch the direct case; ball_players
        // catches a claimed guest (claiming flips ball_players.player_id while
        // the definition keeps the guest ref).
        const callerIds = new Set(
            definition.producers
                .filter(
                    (p) =>
                        isIdentityProducerDef(p) &&
                        p.playerRef.kind === 'player' &&
                        p.playerRef.id === input.playerId,
                )
                .map((p) => p.id),
        );
        const claimedRows = await this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            .where('bp.player_id', '=', input.playerId)
            .select('bp.producer_def_id')
            .execute();
        for (const r of claimedRows) callerIds.add(r.producer_def_id);

        if (callerIds.size === 0) {
            return refuse(
                'not_in_round',
                'you are not a player in this round, so there is nothing to remove',
                'playerId',
            );
        }
        if (callerIds.size >= definition.producers.length) {
            return refuse(
                'last_player',
                "you are the only player in this round — there'd be nothing left. Delete the round instead.",
                'producers',
            );
        }

        // --- Entanglement: any team membership refuses the whole leave --------
        const sharedDiag = sharedBallDiagnostic(definition, callerIds);
        if (sharedDiag) return { ok: false, diagnostics: [sharedDiag] };

        // --- The caller's own balls (for the self-scoped event teardown) ------
        // Second net at the DB layer: every persisted ball carrying one of the
        // caller's producers must carry ONLY the caller's producers. With the
        // definition-level team checks above this cannot fire for a compiled
        // round, but a mismatch here must never silently delete a teammate's
        // events.
        const memberRows = await this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            .select(['bp.ball_id', 'bp.producer_def_id'])
            .execute();
        const membersByBall = new Map<string, string[]>();
        for (const r of memberRows) {
            membersByBall.set(r.ball_id, [...(membersByBall.get(r.ball_id) ?? []), r.producer_def_id]);
        }
        const callerBallIds: string[] = [];
        for (const [ballId, members] of membersByBall) {
            if (!members.some((m) => callerIds.has(m))) continue;
            if (!members.every((m) => callerIds.has(m))) {
                return refuse(
                    'shared_ball',
                    'your scores are part of a shared team ball — leaving would affect your teammates’ data. Remove the team in edit instead.',
                    'producers',
                );
            }
            callerBallIds.push(ballId);
        }

        // --- Compose the definition without the caller -------------------------
        const def = definitionInputFromResolved(definition);
        def.producers = def.producers.filter((p) => !callerIds.has(p.id));

        // Explicit slot selectors shrink; a selector emptied by the leave is
        // refused (compile would treat the empty filter as absent and silently
        // widen the slot to every remaining own ball).
        for (const slot of def.slots) {
            const sel = slot.ballSelector;
            if (!sel?.producerDefIds || sel.producerDefIds.length === 0) continue;
            if (!sel.producerDefIds.some((pid) => callerIds.has(pid))) continue;
            const kept = sel.producerDefIds.filter((pid) => !callerIds.has(pid));
            if (kept.length === 0) {
                return refuse(
                    'slot_would_be_empty',
                    `format slot '${slot.id}' scores no one but you — leaving would empty it. Edit the round (or delete it) instead.`,
                    `slots[${slot.id}].ballSelector`,
                );
            }
            slot.ballSelector = { ...sel, producerDefIds: kept };
        }

        // Playing groups: drop the caller's membership; a group emptied by the
        // leave is dropped entirely.
        const groups = (def.playingGroups ?? []) as PlayingGroupInput[];
        let leftGroupDefId: string | null = null;
        let oldGroup: Record<string, unknown> | null = null;
        let newGroup: Record<string, unknown> | null = null;
        const keptGroups: PlayingGroupInput[] = [];
        for (const g of groups) {
            if (!g.producerDefIds.some((pid) => callerIds.has(pid))) {
                keptGroups.push(g);
                continue;
            }
            if (leftGroupDefId === null) {
                leftGroupDefId = g.id ?? null;
                oldGroup = groupProjection(g);
            }
            const kept = g.producerDefIds.filter((pid) => !callerIds.has(pid));
            if (kept.length === 0) continue; // group emptied → dropped
            const shrunk = { ...g, producerDefIds: kept };
            keptGroups.push(shrunk);
            if (leftGroupDefId === (g.id ?? null)) newGroup = groupProjection(shrunk);
        }
        def.playingGroups = keptGroups;

        // --- Keep the stored RoundSetupDraft canonical -------------------------
        // Same reasoning as self-join: a draft-originated round carries a
        // versioned draft document; the leave must land there too, or a later
        // wizard edit would resurrect the leaver.
        const storedDraft = await this.rounds.latestSetupDraft(roundId);
        const updatedDraft = storedDraft ? draftWithoutLeaver(storedDraft.draft, callerIds) : null;

        // --- Persist through the established correction/recompile machinery ---
        // Target `playing_group` mirrors self-join: the user-visible mutation is
        // "this producer left that group"; the removed producer def-ids ride in
        // `new_value` so the audit chain carries the whole change. The
        // clientEventId embeds the definition version so a double-tap dedupes
        // while a later leave-after-rejoin still applies.
        const removedProducers = definition.producers.filter((p) => callerIds.has(p.id));
        const res = await this.corrections.applyComposedSetupCorrection({
            roundId,
            target: 'playing_group',
            targetRef: leftGroupDefId !== null ? { playingGroupDefId: leftGroupDefId } : {},
            oldValue: oldGroup,
            // `group: null` = the caller's group was dropped with them.
            newValue: { group: newGroup, removedProducers },
            reason: 'self-leave via share link',
            recordedBy: input.playerId,
            clientEventId: `self-leave:${input.playerId}:v${latest.version}`,
            definition: def,
            // The self-scoped teardown: the caller's OWN ball's append-only
            // rows go first, in the SAME transaction, so the recompile's
            // diff-delete of that ball passes the RESTRICT FK. Scoped to ball
            // ids proven single-producer-caller-owned above.
            beforePersist: async (trx) => {
                if (callerBallIds.length === 0) return;
                await trx
                    .deleteFrom('score_events')
                    .where('round_id', '=', roundId)
                    .where('ball_id', 'in', callerBallIds)
                    .execute();
                await trx
                    .deleteFrom('scorecards')
                    .where('ball_id', 'in', callerBallIds)
                    .execute();
            },
            ...(updatedDraft
                ? {
                      afterPersist: async (trx: Kysely<Database>, info: { eventId: string }) => {
                          await this.rounds.appendSetupDraftVersion(
                              trx,
                              roundId,
                              updatedDraft,
                              'self_leave',
                              info.eventId,
                          );
                      },
                  }
                : {}),
        });
        if (!res.ok) return { ok: false, diagnostics: res.diagnostics };

        const round = await this.rounds.getById(roundId);
        if (!round) throw new Error(`round ${roundId} not found after self-leave recompile`);
        return { ok: true, round };
    }
}

// --- Entanglement -------------------------------------------------------------

/**
 * A `shared_ball` diagnostic when any of the caller's producers is a member of
 * a ball-strategy composition team (merged team ball) or a slot teamGrouping
 * team (a side), else `null`. Refusing on EITHER is the simplest safe rule:
 * a composition member's strokes are entangled in the merged ball, and a side
 * member's own ball feeds the side's aggregate — removing it silently reshapes
 * the teammates' result either way.
 */
function sharedBallDiagnostic(
    definition: ResolvedRoundDefinition,
    callerIds: Set<string>,
): CompilerDiagnostic | null {
    for (const s of definition.ballStrategies) {
        for (const team of s.composition?.teams ?? []) {
            if (team.producerDefIds.some((pid) => callerIds.has(pid))) {
                return {
                    code: 'shared_ball',
                    message: `your scores are part of the shared team ball '${team.label}' — leaving would affect your teammates’ data. Remove the team in edit instead.`,
                    path: 'ballStrategies',
                };
            }
        }
    }
    for (const slot of definition.slots) {
        for (const team of slot.teamGrouping?.teams ?? []) {
            if (team.producerDefIds.some((pid) => callerIds.has(pid))) {
                return {
                    code: 'shared_ball',
                    message: `you are part of team '${team.label}' in this round — leaving would affect your teammates’ result. Remove the team in edit instead.`,
                    path: `slots[${slot.id}].teamGrouping`,
                };
            }
        }
    }
    return null;
}

// --- Stored-draft composition ---------------------------------------------------

/**
 * The stored `RoundSetupDraft` with the leaver removed, mirroring the
 * definition mutation:
 *   - `producers` filtered;
 *   - `playingGroups` members filtered, emptied groups dropped (an emptied
 *     LIST falls back to `undefined` = "everyone together" — unreachable
 *     behind the last-player guard, kept for safety);
 *   - each format's explicit `producerDefIds` subset filtered;
 *   - each format's `subjects` player entries filtered.
 * Round-level `teams` / per-format `teams` are untouched — a caller inside
 * one was already refused as `shared_ball`, so no draft team names them.
 */
function draftWithoutLeaver(stored: RoundSetupDraft, callerIds: Set<string>): RoundSetupDraft {
    const producers = stored.producers.filter((p) => !callerIds.has(p.producerDefId));

    let playingGroups = stored.playingGroups;
    if (playingGroups !== undefined) {
        const kept = playingGroups
            .map((g) => ({ ...g, members: g.members.filter((m) => !callerIds.has(m)) }))
            .filter((g) => g.members.length > 0);
        playingGroups = kept.length > 0 ? kept : undefined;
    }

    const formats = stored.formats.map((f) => {
        const out = { ...f };
        if (out.producerDefIds !== undefined) {
            out.producerDefIds = out.producerDefIds.filter((pid) => !callerIds.has(pid));
        }
        if (out.subjects !== undefined) {
            out.subjects = out.subjects.filter(
                (s) => !(s.kind === 'player' && callerIds.has(s.producerDefId)),
            );
        }
        return out;
    });

    return {
        ...stored,
        producers,
        formats,
        ...(playingGroups !== undefined ? { playingGroups } : {}),
    };
}

// --- Helpers --------------------------------------------------------------------

function refuse(code: string, message: string, path?: string): LeaveRoundResult {
    return { ok: false, diagnostics: [{ code, message, ...(path !== undefined ? { path } : {}) }] };
}

function groupProjection(g: PlayingGroupInput): Record<string, unknown> {
    return {
        startTime: g.startTime,
        ...(g.startPlayHoleDefId !== undefined ? { startPlayHoleDefId: g.startPlayHoleDefId } : {}),
        capacity: g.capacity,
        producerDefIds: [...g.producerDefIds],
    };
}
