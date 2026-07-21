import type { Kysely } from 'kysely';

import type { Database } from '../db/schema';
import type { CompilerDiagnostic } from '../domain/compiler/types';
import { buildRoundDefinition } from '../domain/round-setup/builder';
import {
    isIdentityProducer,
    isPlaceholderProducer,
    type DraftIdentityProducer,
    type DraftPlaceholderProducer,
    type DraftProducer,
    type RoundSetupDraft,
} from '../domain/round-setup/draft';
import type { CorrectionService } from './correction.service';
import type { GuestPlayerService } from './guest-player.service';
import type { PlayerService } from './player.service';
import type { Round, RoundService } from './round.service';
import type { StartListService } from './start-list.service';

/**
 * Phase 5.5 Slice 3 — claim/rebind/release a placeholder SEAT.
 *
 * A claim is a SETUP CORRECTION: the seat's `DraftPlaceholderProducer` is
 * replaced by a `DraftIdentityProducer` with the SAME `producerDefId`, the
 * draft is rebuilt through the SAME pure builder the create/edit paths use,
 * and the new definition version rides the established composed-correction
 * recompile tail (`CorrectionService.applyComposedSetupCorrection`). The
 * COMPILER captures the full snapshot chain (display name, HCP index → CH →
 * PH) from the bound identity + tee — nothing is conjured here, and nothing
 * is captured at first score entry (the legacy trap).
 *
 * Identity resolution mirrors self-join:
 *   - `kind:'self'` — the SERVER-resolved session player brings their profile
 *     handicap index + gender (missing → the same profile-gap diagnostics as
 *     join); the claim is refused when that player already holds a producer
 *     seat in the round (`already_in_round` — one person, one seat).
 *   - `kind:'guest'` — a brand-new `guest_players` row is minted from the
 *     typed name/hcp/gender, exactly like guest add at create time. Under
 *     `claimBy:'anyone'` this works ANONYMOUSLY: the share token is the
 *     credential (the 2.6e trust boundary), matching trust-based scoring.
 *
 * Tee: the draft carries NO category→tee mapping (a competition's
 * `categoryTees` is resolved into concrete producer tees at materialise time,
 * and placeholder seats deliberately carry no tee), so `teeId` always comes
 * from the request — same select + validation chain as join
 * (`tee_required` / `unknown_tee` / `tee_wrong_course` /
 * `tee_missing_gender_rating`).
 *
 * Policy is the SOLE gate authority: `evaluateStartListOps(...).claimSeat`
 * (self) / `.claimSeatAsGuest` (guest), which enforce the seats axis, the
 * claim audience, and the self-service window. The service adds only
 * occupancy truths the evaluator cannot know (already-in-round, seat taken,
 * seat scored).
 *
 * REBIND: the claim op may also target an ALREADY-claimed seat — but only a
 * producer whose draft entry carries the seat-origin marker (`seat`, set by
 * this service at claim time; the organizer's fixed lineup never has it and
 * refuses `not_a_seat` — that's the round-edit path's job). A rebind is
 * allowed while the seat's ball(s) have ZERO score events
 * (`producer_has_scores` otherwise — the explicit form of the legacy
 * "locked once scored" rule) AND the actor passes the same policy gate AND
 * the occupancy rule holds:
 *   - a REGISTERED occupant can only be displaced by themselves (the session
 *     player) — anyone else gets `seat_occupied`;
 *   - a GUEST occupant is trust-based like every guest row: any actor the
 *     policy admits may correct it ("that's not Bob, it's Carol").
 *
 * RELEASE ("I clicked the wrong seat"): identity → back to the ORIGINAL
 * placeholder (label + teamRef retained on the seat-origin marker). Same
 * occupancy + unscored rules; deliberately NO policy-window gate — release
 * is an undo, not a sign-up, and closing the window must not trap someone in
 * a wrong seat. A guest row minted by a guest claim is NOT deleted on
 * release (guest rows are identities, not bookings; it may be referenced
 * elsewhere and simply goes unused here).
 *
 * The seat-origin marker is retained across rebinds so the seat can change
 * hands and still release to its original label. A wizard full-draft edit
 * that re-submits producers without the marker demotes them to ordinary
 * lineup members — accepted: the organizer took manual control.
 *
 * Refusal contract (mirrors join): unknown token → `null` (API → 404);
 * everything else is a structured `{ ok:false, diagnostics }` with humanized
 * messages the client renders verbatim — never a 500 for an ordinary refusal.
 * Idempotency: `clientEventId` dedupes through the correction event log; a
 * replay returns `ok` without re-writing (and without minting a second
 * guest).
 */

export type ClaimSeatIdentity =
    | { kind: 'self' }
    | { kind: 'guest'; name: string; handicapIndex: number; gender: 'M' | 'F' };

export interface ClaimSeatInput {
    token: string;
    /** The seat's stable claim address — its producer def-id. */
    seatId: string;
    identity: ClaimSeatIdentity;
    teeId?: string;
    /** SERVER-resolved from the OPTIONAL session — never from the body. */
    playerId: string | null;
    clientEventId: string;
    /** Injectable clock for tests; defaults to the server clock. */
    nowIso?: string;
}

export interface ReleaseSeatInput {
    token: string;
    seatId: string;
    /** SERVER-resolved from the OPTIONAL session — never from the body. */
    playerId: string | null;
    clientEventId: string;
}

export type SeatClaimResult =
    | { ok: true; round: Round }
    | { ok: false; diagnostics: CompilerDiagnostic[] };

type Refusal = { ok: false; diagnostics: CompilerDiagnostic[] };

function refuse(code: string, message: string, path?: string): Refusal {
    return { ok: false, diagnostics: [{ code, message, ...(path !== undefined ? { path } : {}) }] };
}

export class SeatClaimService {
    constructor(
        private db: Kysely<Database>,
        private rounds: RoundService,
        private corrections: CorrectionService,
        private players: PlayerService,
        private guests: GuestPlayerService,
        private startLists: StartListService,
    ) {}

    // --- Queries ---------------------------------------------------------------

    private roundIdByToken(token: string) {
        return this.db
            .selectFrom('friendly_rounds')
            .select('round_id')
            .where('share_token', '=', token);
    }

    private priorCorrection(roundId: string, clientEventId: string) {
        return this.db
            .selectFrom('setup_correction_events')
            .select('id')
            .where('round_id', '=', roundId)
            .where('client_event_id', '=', clientEventId);
    }

    /** Balls carrying this producer that already have score events. */
    private scoredBallsOf(roundId: string, producerDefId: string) {
        return this.db
            .selectFrom('score_events as se')
            .select('se.ball_id')
            .where('se.round_id', '=', roundId)
            .where('se.ball_id', 'in', (qb) =>
                qb
                    .selectFrom('ball_players as bp')
                    .innerJoin('balls as b', 'b.id', 'bp.ball_id')
                    .select('bp.ball_id')
                    .where('b.round_id', '=', roundId)
                    .where('bp.producer_def_id', '=', producerDefId),
            )
            .limit(1);
    }

    /** Is `playerId` already a producer here? Draft refs catch registered
     *  players; `ball_players` additionally catches a claimed guest. */
    private async isProducerInRound(
        roundId: string,
        draft: RoundSetupDraft,
        playerId: string,
    ): Promise<boolean> {
        const inDraft = draft.producers.some(
            (p) =>
                isIdentityProducer(p) &&
                p.playerRef.kind === 'player' &&
                p.playerRef.id === playerId,
        );
        if (inDraft) return true;
        const row = await this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            .where('bp.player_id', '=', playerId)
            .select('bp.ball_id')
            .limit(1)
            .executeTakeFirst();
        return row !== undefined;
    }

    // --- Claim / rebind --------------------------------------------------------

    async claimByToken(input: ClaimSeatInput): Promise<SeatClaimResult | null> {
        const fr = await this.roundIdByToken(input.token).executeTakeFirst();
        if (!fr) return null;
        const roundId = fr.round_id;

        // Idempotent replay FIRST — before any side effect (a retried claim
        // must not mint a second guest row or trip the occupancy guards its
        // own first attempt created).
        if (await this.priorCorrection(roundId, input.clientEventId).executeTakeFirst()) {
            return this.okWithRound(roundId);
        }

        const stored = await this.rounds.latestSetupDraft(roundId);
        if (!stored) {
            return refuse(
                'not_claimable',
                'this round did not originate from a setup draft, so its seats cannot be claimed here',
            );
        }
        const target = stored.draft.producers.find((p) => p.producerDefId === input.seatId);
        if (!target) {
            return refuse(
                'unknown_seat',
                'That seat is not part of this round any more — the setup may have changed. Reload and try again.',
                'seatId',
            );
        }

        // Rebind targets must be seat-origin; the organizer's fixed lineup is
        // the round-edit path's territory.
        const isRebind = isIdentityProducer(target);
        if (isRebind && target.seat === undefined) {
            return refuse(
                'not_a_seat',
                'That spot is part of the round’s set lineup, not a claimable seat — change it via Edit round.',
                'seatId',
            );
        }

        // --- Policy gate (the sole authority on WHO may claim) ----------------
        const view = await this.startLists.viewForRound(
            roundId,
            input.playerId,
            input.nowIso ?? new Date().toISOString(),
        );
        const decision =
            input.identity.kind === 'self'
                ? view.viewer.claimSeat
                : view.viewer.claimSeatAsGuest;
        if (!decision.allowed) {
            return refuse(
                decision.code ?? 'claim_not_allowed',
                decision.message ??
                    'claiming this seat is not allowed under the round’s start-list policy',
                'startList',
            );
        }

        // --- Occupancy truths the evaluator cannot know -----------------------
        if (isRebind) {
            const scoredRefusal = await this.refuseWhenScored(roundId, target);
            if (scoredRefusal) return scoredRefusal;
            const occupancyRefusal = this.refuseWrongOccupant(target, input.playerId);
            if (occupancyRefusal) return occupancyRefusal;
        }

        // One person, one seat: a self claim by someone already in the round is
        // refused — UNLESS they are rebinding the very seat they occupy.
        if (input.identity.kind === 'self') {
            const rebindingOwnSeat =
                isRebind &&
                target.playerRef.kind === 'player' &&
                target.playerRef.id === input.playerId;
            if (
                !rebindingOwnSeat &&
                input.playerId !== null &&
                (await this.isProducerInRound(roundId, stored.draft, input.playerId))
            ) {
                return refuse(
                    'already_in_round',
                    'You already play in this round — a player can only hold one seat.',
                );
            }
        }

        // --- Identity: profile chain (self) or typed guest fields -------------
        let playerRef: DraftIdentityProducer['playerRef'];
        let handicapIndex: number;
        let gender: 'M' | 'F';
        let createdGuestId: string | null = null;
        if (input.identity.kind === 'self') {
            // The evaluator already required a session for a self claim.
            const profile = input.playerId ? await this.players.getById(input.playerId) : null;
            if (!profile) {
                return refuse('unknown_player', `player '${input.playerId}' not found`, 'playerId');
            }
            const diags: CompilerDiagnostic[] = [];
            if (profile.gender === null) {
                diags.push({
                    code: 'missing_gender',
                    message:
                        'your profile has no gender — set it before claiming a seat (tee ratings are per gender)',
                    path: 'profile.gender',
                });
            }
            if (profile.handicapIndex === null) {
                diags.push({
                    code: 'missing_handicap_index',
                    message: 'your profile has no handicap index — set it before claiming a seat',
                    path: 'profile.handicapIndex',
                });
            }
            if (diags.length > 0) return { ok: false, diagnostics: diags };
            playerRef = { kind: 'player', id: input.playerId! };
            handicapIndex = profile.handicapIndex!;
            gender = profile.gender!;
        } else {
            handicapIndex = input.identity.handicapIndex;
            gender = input.identity.gender;
            // The guest row is minted AFTER all other validation below (tee),
            // so a refusal never leaves an orphan; see the cleanup on failure.
            playerRef = { kind: 'guest', id: '' }; // filled in below
        }

        // --- Tee: required, on this course, rated for the claimer's gender ---
        const teeRefusal = await this.validateTee(roundId, input.teeId, gender);
        if (teeRefusal) return teeRefusal;
        const teeId = input.teeId!;

        if (input.identity.kind === 'guest') {
            const guest = await this.guests.create({
                displayName: input.identity.name,
                gender,
                handicapIndex,
            });
            createdGuestId = guest.id;
            playerRef = { kind: 'guest', id: guest.id };
        }

        // --- Compose: same producerDefId, identity bound, seat origin kept ---
        const seatOrigin = isPlaceholderProducer(target)
            ? { label: target.placeholder.label, ...(target.placeholder.teamRef !== undefined ? { teamRef: target.placeholder.teamRef } : {}) }
            : target.seat!;
        const replacement: DraftIdentityProducer = {
            producerDefId: input.seatId,
            playerRef,
            handicapIndex,
            gender,
            teeId,
            ...(target.category !== undefined ? { category: target.category } : {}),
            seat: seatOrigin,
        };
        const res = await this.applySeatCorrection({
            roundId,
            stored: { draft: stored.draft, version: stored.version },
            seatId: input.seatId,
            oldProducer: target,
            newProducer: replacement,
            reason: isRebind ? 'seat rebound via claim' : 'seat claimed',
            sourceKind: 'seat_claim',
            recordedBy: input.playerId,
            clientEventId: input.clientEventId,
        });
        if (!res.ok && createdGuestId !== null) {
            // The refused claim minted no references to the guest — remove it
            // so a failed attempt leaves nothing behind.
            await this.db.deleteFrom('guest_players').where('id', '=', createdGuestId).execute();
        }
        return res;
    }

    // --- Release ---------------------------------------------------------------

    async releaseByToken(input: ReleaseSeatInput): Promise<SeatClaimResult | null> {
        const fr = await this.roundIdByToken(input.token).executeTakeFirst();
        if (!fr) return null;
        const roundId = fr.round_id;

        if (await this.priorCorrection(roundId, input.clientEventId).executeTakeFirst()) {
            return this.okWithRound(roundId);
        }

        const stored = await this.rounds.latestSetupDraft(roundId);
        if (!stored) {
            return refuse(
                'not_claimable',
                'this round did not originate from a setup draft, so its seats cannot be released here',
            );
        }
        const target = stored.draft.producers.find((p) => p.producerDefId === input.seatId);
        if (!target) {
            return refuse(
                'unknown_seat',
                'That seat is not part of this round any more — the setup may have changed. Reload and try again.',
                'seatId',
            );
        }
        if (isPlaceholderProducer(target)) {
            return refuse('seat_not_claimed', 'That seat is already open.', 'seatId');
        }
        if (target.seat === undefined) {
            return refuse(
                'not_a_seat',
                'That spot is part of the round’s set lineup, not a claimable seat — change it via Edit round.',
                'seatId',
            );
        }

        // Occupancy + unscored — release deliberately has NO policy/window
        // gate (it is an undo, not a sign-up).
        const scoredRefusal = await this.refuseWhenScored(roundId, target);
        if (scoredRefusal) return scoredRefusal;
        const occupancyRefusal = this.refuseWrongOccupant(target, input.playerId);
        if (occupancyRefusal) return occupancyRefusal;

        const restored: DraftPlaceholderProducer = {
            producerDefId: input.seatId,
            placeholder: {
                label: target.seat.label,
                ...(target.seat.teamRef !== undefined ? { teamRef: target.seat.teamRef } : {}),
            },
            ...(target.category !== undefined ? { category: target.category } : {}),
        };
        return this.applySeatCorrection({
            roundId,
            stored: { draft: stored.draft, version: stored.version },
            seatId: input.seatId,
            oldProducer: target,
            newProducer: restored,
            reason: 'seat released',
            sourceKind: 'seat_release',
            recordedBy: input.playerId,
            clientEventId: input.clientEventId,
        });
    }

    // --- Shared tail -----------------------------------------------------------

    /**
     * Replace ONE producer entry, rebuild the definition with the same pure
     * builder the create/edit paths use, and persist through the composed-
     * correction recompile tail. Playing groups, teams, and format selections
     * all reference the seat by its STABLE producer def-id, so they survive
     * untouched; only the seat's ball id changes (content-addressed over the
     * identity refs), which is safe because every path here requires the
     * seat's balls to be scoreless.
     */
    private async applySeatCorrection(args: {
        roundId: string;
        stored: { draft: RoundSetupDraft; version: number };
        seatId: string;
        oldProducer: DraftProducer;
        newProducer: DraftProducer;
        reason: string;
        sourceKind: 'seat_claim' | 'seat_release';
        recordedBy: string | null;
        clientEventId: string;
    }): Promise<SeatClaimResult> {
        const newDraft: RoundSetupDraft = {
            ...args.stored.draft,
            producers: args.stored.draft.producers.map((p) =>
                p.producerDefId === args.seatId ? args.newProducer : p,
            ),
        };
        const built = buildRoundDefinition(newDraft);
        if (!built.ok) return { ok: false, diagnostics: built.diagnostics };

        const res = await this.corrections.applyComposedSetupCorrection({
            roundId: args.roundId,
            target: 'producer_identity',
            targetRef: { producerDefId: args.seatId },
            oldValue: args.oldProducer,
            newValue: args.newProducer,
            reason: args.reason,
            recordedBy: args.recordedBy,
            clientEventId: args.clientEventId,
            definition: built.definition,
            afterPersist: async (trx, { eventId }) => {
                await this.rounds.appendSetupDraftVersion(
                    trx,
                    args.roundId,
                    newDraft,
                    args.sourceKind,
                    eventId,
                );
            },
        });
        if (!res.ok) return { ok: false, diagnostics: res.diagnostics };
        return this.okWithRound(args.roundId);
    }

    /** `producer_has_scores` once any of the seat's balls has events. */
    private async refuseWhenScored(
        roundId: string,
        target: DraftIdentityProducer,
    ): Promise<Refusal | null> {
        const scored = await this.scoredBallsOf(roundId, target.producerDefId).executeTakeFirst();
        if (!scored) return null;
        return refuse(
            'producer_has_scores',
            `this seat already has recorded scores — it can no longer change hands`,
            'seatId',
        );
    }

    /**
     * The occupancy rule for rebind/release: a REGISTERED occupant may only be
     * displaced by themselves; a GUEST occupant is trust-based (any actor the
     * policy admitted may correct it).
     */
    private refuseWrongOccupant(
        target: DraftIdentityProducer,
        actorPlayerId: string | null,
    ): Refusal | null {
        if (target.playerRef.kind !== 'player') return null;
        if (actorPlayerId !== null && actorPlayerId === target.playerRef.id) return null;
        return refuse(
            'seat_occupied',
            'That seat is already taken by a registered player — only they can release or change it (or the organizer via Edit round).',
            'seatId',
        );
    }

    /** Join's tee chain, claim-shaped: required + course + gender rating. */
    private async validateTee(
        roundId: string,
        teeId: string | undefined,
        gender: 'M' | 'F',
    ): Promise<Refusal | null> {
        if (!teeId) {
            return refuse('tee_required', 'Choose a tee for this seat.', 'teeId');
        }
        const roundRow = await this.db
            .selectFrom('rounds')
            .select('course_id')
            .where('id', '=', roundId)
            .executeTakeFirst();
        const tee = await this.db
            .selectFrom('tees')
            .select(['id', 'course_id'])
            .where('id', '=', teeId)
            .executeTakeFirst();
        if (!tee) {
            return refuse('unknown_tee', `tee '${teeId}' not found`, 'teeId');
        }
        if (roundRow && tee.course_id !== roundRow.course_id) {
            return refuse(
                'tee_wrong_course',
                `tee '${teeId}' belongs to a different course than this round`,
                'teeId',
            );
        }
        const rating = await this.db
            .selectFrom('tee_ratings')
            .select('tee_id')
            .where('tee_id', '=', teeId)
            .where('gender', '=', gender)
            .executeTakeFirst();
        if (!rating) {
            return refuse(
                'tee_missing_gender_rating',
                `tee '${teeId}' has no '${gender}' rating row`,
                'teeId',
            );
        }
        return null;
    }

    private async okWithRound(roundId: string): Promise<SeatClaimResult> {
        const round = await this.rounds.getById(roundId);
        if (!round) throw new Error(`round ${roundId} not found after seat correction`);
        return { ok: true, round };
    }
}
