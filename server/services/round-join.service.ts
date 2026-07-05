import type { Kysely } from 'kysely';

import { ConflictError } from '@basics/core/server/auth';
import type { Database } from '../db/schema';
import type { CompilerDiagnostic } from '../domain/compiler/types';
import {
    definitionInputFromResolved,
    type PlayingGroupInput,
    type ProducerDefinition,
    type ResolvedRoundDefinition,
    type SlotDefinition,
} from '../domain/round-definition';
import { hashId } from '../domain/deterministic-id';
import type { RoundSetupDraft } from '../domain/round-setup/draft';
import type { ComposedSetupCorrectionInput, CorrectionService } from './correction.service';
import type { PlayerService } from './player.service';
import type { Round, RoundService } from './round.service';

/**
 * Phase 3.5 — self-join via share link.
 *
 * A logged-in player holding a `not_started` round's share token adds
 * THEMSELVES to the round: the service composes a new `RoundDefinition`
 * version from the latest one (new producer from the caller's profile +
 * chosen tee, placed into the caller's chosen group — or, by default, the
 * first playing group with free capacity, else a new group) and persists it
 * through the established 2.6d setup-correction
 * recompile machinery (`CorrectionService.applyComposedSetupCorrection`).
 * Content-addressed ids keep every existing ball — and its append-only score
 * events — untouched across the recompile.
 *
 * Which slots gain the joiner: ONLY whole-roster own-ball slots. In
 * definition terms a slot is joinable when it has no `teamGrouping`, its
 * `ballSelector` names no explicit `producerDefIds` subset, and it selects
 * (explicitly or via auto-match) at least one COMPOSITION-LESS ball strategy
 * (a strategy without `composition` covers every producer — see
 * `collectStrategyProducers` in compile.ts — so the new producer's own ball
 * flows into such slots with NO slot mutation at all). Explicit-subset and
 * team(-composition) slots are structurally untouched. A round with no
 * joinable slot refuses with a structured diagnostic — the compiler would
 * otherwise drop the joiner's unscored ball silently.
 *
 * Refusal contract:
 *   - unknown token → `null` (API turns it into a 404);
 *   - round already active/complete, or caller already a producer → thrown
 *     `ConflictError` (409);
 *   - caller profile lacking gender / handicap index, bad tee, no joinable
 *     slot, a chosen group that is full / unknown, or compile diagnostics →
 *     `{ ok: false, diagnostics }` (200).
 *   Never a 500 for an ordinary refusal.
 */

export type JoinRoundResult =
    | { ok: true; round: Round }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

/**
 * Where the joiner wants to land:
 *   - absent → current behaviour (first group with space, else a fresh group);
 *   - `'new'` → force a brand-new group even if an existing one has space;
 *   - any other string → a specific target group, addressed by its RUNTIME
 *     group id (the `id` the round payload exposes client-side, `Round`'s
 *     `RoundPlayingGroup.id`). The service resolves it to the definition group
 *     and refuses (`unknown_group` / `group_full`) if it is missing or full.
 */
export type GroupChoice = 'new' | (string & {});

export interface JoinByTokenInput {
    token: string;
    teeId: string;
    /** SERVER-resolved from the session — never from the request body. */
    playerId: string;
    /** Optional target group. See {@link GroupChoice}. */
    groupChoice?: GroupChoice;
}

/**
 * Capacity of a playing group the join path creates when every existing group
 * is full. Four = a standard flight, so subsequent joiners fill it before yet
 * another group is added.
 */
const JOIN_GROUP_CAPACITY = 4;

export class RoundJoinService {
    constructor(
        private db: Kysely<Database>,
        private rounds: RoundService,
        private corrections: CorrectionService,
        private players: PlayerService,
    ) {}

    async joinByToken(input: JoinByTokenInput): Promise<JoinRoundResult | null> {
        // --- Token → round --------------------------------------------------
        const fr = await this.db
            .selectFrom('friendly_rounds')
            .select('round_id')
            .where('share_token', '=', input.token)
            .executeTakeFirst();
        if (!fr) return null;
        const roundId = fr.round_id;

        const roundRow = await this.db
            .selectFrom('rounds')
            .select(['status', 'course_id'])
            .where('id', '=', roundId)
            .executeTakeFirst();
        if (!roundRow) return null;
        if (roundRow.status !== 'not_started') {
            throw new ConflictError(
                'round has already started — joining is only possible before the first score',
            );
        }

        const latest = await this.rounds.latestDefinition(roundId);
        if (!latest) {
            return {
                ok: false,
                diagnostics: [
                    {
                        code: 'unknown_round',
                        message: `round '${roundId}' has no compiled definition`,
                        path: 'roundId',
                    },
                ],
            };
        }

        // --- Already a producer? ---------------------------------------------
        // Definition-level player refs catch a direct rejoin; ball_players
        // catches a claimed guest (claiming flips ball_players.player_id but the
        // definition keeps the guest ref). Unclaimed-guest ambiguity is fine —
        // the claim flow handles that path.
        const isDefProducer = latest.definition.producers.some(
            (p) => p.playerRef.kind === 'player' && p.playerRef.id === input.playerId,
        );
        const claimedRow = isDefProducer
            ? undefined
            : await this.db
                  .selectFrom('ball_players as bp')
                  .innerJoin('balls as b', 'b.id', 'bp.ball_id')
                  .where('b.round_id', '=', roundId)
                  .where('bp.player_id', '=', input.playerId)
                  .select('bp.ball_id')
                  .executeTakeFirst();
        if (isDefProducer || claimedRow) {
            throw new ConflictError('you are already a player in this round');
        }

        // --- Caller profile supplies identity, name, index, gender -----------
        const diags: CompilerDiagnostic[] = [];
        const profile = await this.players.getById(input.playerId);
        if (!profile) {
            return {
                ok: false,
                diagnostics: [
                    { code: 'unknown_player', message: `player '${input.playerId}' not found`, path: 'playerId' },
                ],
            };
        }
        if (profile.gender === null) {
            diags.push({
                code: 'missing_gender',
                message: 'your profile has no gender — set it before joining (tee ratings are per gender)',
                path: 'profile.gender',
            });
        }
        if (profile.handicapIndex === null) {
            diags.push({
                code: 'missing_handicap_index',
                message: 'your profile has no handicap index — set it before joining',
                path: 'profile.handicapIndex',
            });
        }
        if (diags.length > 0) return { ok: false, diagnostics: diags };
        const gender = profile.gender!;
        const handicapIndex = profile.handicapIndex!;

        // --- Tee: belongs to the round's course, rated for the caller --------
        const tee = await this.db
            .selectFrom('tees')
            .select(['id', 'course_id'])
            .where('id', '=', input.teeId)
            .executeTakeFirst();
        if (!tee) {
            return {
                ok: false,
                diagnostics: [
                    { code: 'unknown_tee', message: `tee '${input.teeId}' not found`, path: 'teeId' },
                ],
            };
        }
        if (tee.course_id !== roundRow.course_id) {
            return {
                ok: false,
                diagnostics: [
                    {
                        code: 'tee_wrong_course',
                        message: `tee '${input.teeId}' belongs to a different course than this round`,
                        path: 'teeId',
                    },
                ],
            };
        }
        const rating = await this.db
            .selectFrom('tee_ratings')
            .select('tee_id')
            .where('tee_id', '=', input.teeId)
            .where('gender', '=', gender)
            .executeTakeFirst();
        if (!rating) {
            return {
                ok: false,
                diagnostics: [
                    {
                        code: 'tee_missing_gender_rating',
                        message: `tee '${input.teeId}' has no '${gender}' rating row`,
                        path: 'teeId',
                    },
                ],
            };
        }

        // --- At least one whole-roster own-ball slot must absorb the joiner --
        if (!hasJoinableSlot(latest.definition)) {
            return {
                ok: false,
                diagnostics: [
                    {
                        code: 'no_joinable_slot',
                        message:
                            'this round has no whole-roster own-ball format — every slot is an explicit-subset or team slot, so a joiner would not be scored anywhere',
                        path: 'slots',
                    },
                ],
            };
        }

        // --- Compose the new definition --------------------------------------
        const def = definitionInputFromResolved(latest.definition);
        const producer: ProducerDefinition = {
            id: `join-${input.playerId}`,
            playerRef: { kind: 'player', id: input.playerId },
            handicapIndex,
            gender,
            teeId: input.teeId,
        };
        def.producers = [...def.producers, producer];

        const groups = (def.playingGroups ?? []) as PlayingGroupInput[];
        const placement = placeInGroups(groups, producer.id, def, roundId, input.groupChoice);
        if (!placement.ok) return { ok: false, diagnostics: placement.diagnostics };
        const { groupDefId, oldGroup, newGroup } = placement;
        def.playingGroups = groups;

        // --- Keep the stored RoundSetupDraft canonical (Phase 3.5 edit) ------
        // A draft-originated round carries a versioned draft document; the
        // join must land there too, or a later wizard edit would silently
        // drop the joiner. Rounds without a draft chain (admin/legacy) skip.
        const storedDraft = await this.rounds.latestSetupDraft(roundId);
        const updatedDraft = storedDraft
            ? draftWithJoin(
                  storedDraft.draft,
                  producer,
                  groups,
                  latest.definition,
                  oldGroup === null,
              )
            : null;

        // --- Persist through the established correction/recompile machinery --
        // Target `playing_group` is the closest fitting typed target: the
        // user-visible mutation is "this producer joined that group"; the added
        // producer definition rides inside `new_value` so the audit chain
        // carries the whole change.
        const correction: ComposedSetupCorrectionInput = {
            roundId,
            target: 'playing_group',
            targetRef: { playingGroupDefId: groupDefId },
            oldValue: oldGroup,
            newValue: { ...newGroup, addedProducer: producer },
            reason: 'self-join via share link',
            recordedBy: input.playerId,
            // One deterministic id per (round, player): a racing double-tap
            // dedupes instead of double-appending.
            clientEventId: `self-join:${input.playerId}`,
            definition: def,
        };
        if (updatedDraft) {
            // Draft version appended ATOMICALLY with the correction + recompile.
            correction.afterPersist = async (trx, info) => {
                await this.rounds.appendSetupDraftVersion(
                    trx,
                    roundId,
                    updatedDraft,
                    'self_join',
                    info.eventId,
                );
            };
        }
        const res = await this.corrections.applyComposedSetupCorrection(correction);
        if (!res.ok) return { ok: false, diagnostics: res.diagnostics };

        const round = await this.rounds.getById(roundId);
        if (!round) throw new Error(`round ${roundId} not found after self-join recompile`);
        return { ok: true, round };
    }
}

// --- Stored-draft composition (Phase 3.5 edit-after-create) -------------------

/**
 * The stored `RoundSetupDraft` with the joiner folded in, so the draft the
 * wizard edits later matches what actually compiled:
 *   - the joiner appended to `producers`;
 *   - `playingGroups` rebuilt from the POST-JOIN definition groups (members /
 *     start time / start hole), EXCEPT when the draft had no groups and the
 *     joiner landed in the default group — absent still means "everyone
 *     together", which now includes the joiner.
 *
 * Start holes round-trip by course hole number (`DraftPlayingGroup.startHole`),
 * resolved back through the builder as the FIRST occurrence of that number —
 * exact for every conventional route; a custom route that repeats a course
 * hole AND shotgun-starts a group on the later occurrence would re-anchor to
 * the first one on the next edit (accepted: that setup is not draft-authorable
 * today).
 */
function draftWithJoin(
    stored: RoundSetupDraft,
    producer: ProducerDefinition,
    defGroups: PlayingGroupInput[],
    definition: ResolvedRoundDefinition,
    createdNewGroup: boolean,
): RoundSetupDraft {
    const producers: RoundSetupDraft['producers'] = [
        ...stored.producers,
        {
            producerDefId: producer.id,
            playerRef: producer.playerRef,
            handicapIndex: producer.handicapIndex,
            ...(producer.gender ? { gender: producer.gender } : {}),
            teeId: producer.teeId,
        },
    ];

    if (stored.playingGroups === undefined && !createdNewGroup) {
        // Default single group absorbed the joiner — absent stays canonical.
        return { ...stored, producers };
    }

    const holeByDefId = new Map(definition.playHoles.map((p) => [p.id, p.courseHoleNumber]));
    const ordered = definition.playHoles;
    const playingGroups = defGroups.map((g) => {
        let startHole: number | undefined;
        if (g.startPlayHoleDefId !== undefined) {
            startHole = holeByDefId.get(g.startPlayHoleDefId);
        } else if (g.startOrdinal !== undefined) {
            startHole = ordered[g.startOrdinal - 1]?.courseHoleNumber;
        }
        return {
            members: [...g.producerDefIds],
            startTime: g.startTime,
            ...(startHole !== undefined ? { startHole } : {}),
        };
    });
    return { ...stored, producers, playingGroups };
}

// --- Composition helpers -----------------------------------------------------

/**
 * True when the definition has at least one whole-roster own-ball slot: no
 * team grouping, no explicit producer subset, and (explicitly or via
 * auto-match) a composition-less ball strategy whose producer coverage grows
 * with the roster.
 */
function hasJoinableSlot(definition: ResolvedRoundDefinition): boolean {
    const openStrategyIds = new Set(
        definition.ballStrategies.filter((s) => !s.composition).map((s) => s.id),
    );
    return definition.slots.some((slot) => slotIsJoinable(slot, openStrategyIds));
}

function slotIsJoinable(slot: SlotDefinition, openStrategyIds: Set<string>): boolean {
    if (slot.teamGrouping) return false;
    const sel = slot.ballSelector;
    if (sel?.producerDefIds && sel.producerDefIds.length > 0) return false;
    if (sel?.strategyDefIds && sel.strategyDefIds.length > 0) {
        return sel.strategyDefIds.some((id) => openStrategyIds.has(id));
    }
    // No selector → requirement-based auto-match; joinable iff any open
    // (composition-less) strategy exists to mint the joiner's own ball.
    return openStrategyIds.size > 0;
}

type PlaceResult =
    | {
          ok: true;
          groupDefId: string;
          oldGroup: Record<string, unknown> | null;
          newGroup: Record<string, unknown>;
      }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

/**
 * Place `producerDefId` into a playing group. Mutates `groups` in place; on
 * success returns the audit projections (`oldGroup` is `null` when a fresh
 * group was created).
 *
 * `choice` selects the target:
 *   - absent → the first group with free capacity, else a fresh group
 *     (start time + hole mirroring the LAST group, standard-flight capacity);
 *   - `'new'` → always a fresh group, even when an existing one has space;
 *   - any other string → the existing group whose RUNTIME id (`hashId` of its
 *     def id under `roundId` — the id the round payload exposes) matches. A
 *     miss is `unknown_group`; a full match is `group_full`.
 */
function placeInGroups(
    groups: PlayingGroupInput[],
    producerDefId: string,
    def: { playedAt: string },
    roundId: string,
    choice?: GroupChoice,
): PlaceResult {
    if (choice !== undefined && choice !== 'new') {
        const target = groups.find(
            (g) => g.id !== undefined && runtimeGroupId(roundId, g.id) === choice,
        );
        if (!target) {
            return {
                ok: false,
                diagnostics: [
                    {
                        code: 'unknown_group',
                        message: `no playing group '${choice}' in this round`,
                        path: 'groupChoice',
                    },
                ],
            };
        }
        if (target.producerDefIds.length >= target.capacity) {
            return {
                ok: false,
                diagnostics: [
                    {
                        code: 'group_full',
                        message: 'that group is full — pick another group or start a new one',
                        path: 'groupChoice',
                    },
                ],
            };
        }
        const oldGroup = groupProjection(target);
        target.producerDefIds = [...target.producerDefIds, producerDefId];
        return { ok: true, groupDefId: target.id!, oldGroup, newGroup: groupProjection(target) };
    }

    if (choice !== 'new') {
        const open = groups.find((g) => g.producerDefIds.length < g.capacity);
        if (open) {
            const oldGroup = groupProjection(open);
            open.producerDefIds = [...open.producerDefIds, producerDefId];
            return { ok: true, groupDefId: open.id!, oldGroup, newGroup: groupProjection(open) };
        }
    }

    const last = groups[groups.length - 1];
    const existingIds = new Set(groups.map((g) => g.id));
    let n = groups.length + 1;
    while (existingIds.has(`pg-${n}`)) n++;
    const created: PlayingGroupInput = {
        id: `pg-${n}`,
        // "Same as the last group, or now": a joiner walks out with the field.
        startTime: last?.startTime ?? def.playedAt,
        ...(last?.startPlayHoleDefId !== undefined
            ? { startPlayHoleDefId: last.startPlayHoleDefId }
            : {}),
        ...(last?.startOrdinal !== undefined && last?.startPlayHoleDefId === undefined
            ? { startOrdinal: last.startOrdinal }
            : {}),
        capacity: JOIN_GROUP_CAPACITY,
        producerDefIds: [producerDefId],
    };
    groups.push(created);
    return { ok: true, groupDefId: created.id!, oldGroup: null, newGroup: groupProjection(created) };
}

/** The runtime group id the round payload exposes for a def group. Mirrors
 *  `compile.ts`'s `hashId('tapscore:playing_group:v1', roundId, groupDefId)`. */
function runtimeGroupId(roundId: string, groupDefId: string): string {
    return hashId('tapscore:playing_group:v1', roundId, groupDefId);
}

function groupProjection(g: PlayingGroupInput): Record<string, unknown> {
    return {
        startTime: g.startTime,
        ...(g.startPlayHoleDefId !== undefined ? { startPlayHoleDefId: g.startPlayHoleDefId } : {}),
        capacity: g.capacity,
        producerDefIds: [...g.producerDefIds],
    };
}
