import type { Kysely } from 'kysely';

import type { Database } from '../db/schema';
import {
    effectiveStartListPolicy,
    evaluateStartListOps,
    matchingPresetId,
    type StartListOps,
    type StartListPolicy,
    type StartListPresetId,
} from '../domain/round-setup/start-list-policy';
import {
    isIdentityProducer,
    isPlaceholderProducer,
    type DraftIdentityProducer,
    type RoundSetupDraft,
} from '../domain/round-setup/draft';
import type { RoundService } from './round.service';

/**
 * Phase 5.5 Slice 1 — resolve a round's start-list policy and an actor's
 * allowed self-service ops.
 *
 * The POLICY lives on the round's draft (`round_setup_drafts.draft_json`,
 * `startList` field) — it versions with the draft chain like every other
 * setup field, and a round with no stored draft (admin/legacy
 * direct-definition rounds) resolves to the fully-open default, i.e. exactly
 * its pre-5.5 behaviour.
 *
 * The only context-derived input is what `groups:'roster'` RESOLVES AGAINST:
 * today a round's governing roster is its competition's participants (via the
 * 1:1 `competition_rounds` wrapper) — a session player is "on roster" when a
 * non-withdrawn, non-cut participant carries their `player_id`. A round with
 * no such wrapper has NO roster source (`onRoster: null`), which under
 * `'roster'` means closed to newcomers but self-service still works for the
 * round's own producers. This is deliberately NOT an "is this a competition"
 * behaviour branch — the policy decides behaviour; the roster is merely the
 * membership list the policy consults, and future roster sources (tour
 * enrollment, series teams) plug in here without touching any gate.
 */

/**
 * One UNCLAIMED placeholder seat (Phase 5.5 Slice 2) — everything the Slice 3
 * claim card needs to list open seats. `seatId` is the stable producer def-id
 * (the claim op's address); `ballId`/`groupId` locate the seat's compiled ball
 * and playing group; `teamRef`/`category` come from the draft placeholder.
 */
export interface StartListSeat {
    /** Producer def-id — the stable claim address. */
    seatId: string;
    /** The seat's label, shown wherever a name would appear. */
    label: string;
    /** The compiled ball carrying this seat. */
    ballId: string;
    /** Runtime playing-group id (RoundPlayingGroup.id); null if unassigned. */
    groupId: string | null;
    /** Draft composition-team binding (DraftRoundTeam.id); null when unbound. */
    teamRef: string | null;
    category: string | null;
}

/**
 * A CLAIMED seat (Phase 5.5 Slice 3) — a producer that originated as a
 * placeholder (its draft entry carries the seat-origin marker) and is now
 * identity-bound. Feeds the minimal rebind/release UI: the occupant sees
 * "not me — release" on their own claimed seat while it is unscored.
 */
export interface ClaimedSeat {
    /** Producer def-id — the same stable claim address the seat always had. */
    seatId: string;
    /** The ORIGINAL seat label (retained on the seat-origin marker). */
    seatLabel: string;
    /** The current occupant's display name (snapshot). */
    displayName: string;
    /** One ball carrying this producer (the own ball where one exists). */
    ballId: string | null;
    /** True when the viewer's session identity occupies this seat. */
    occupiedByViewer: boolean;
    /** True once any of the seat's balls has recorded scores. */
    hasScores: boolean;
    /**
     * May THIS viewer release the seat back to an open placeholder? Mirrors
     * the claim service's occupancy rule: unscored AND (the viewer is the
     * registered occupant, or the binding is a guest — guest bindings are
     * trust-based like every guest row, any token holder manages them).
     */
    viewerMayRelease: boolean;
}

export interface StartListView {
    policy: StartListPolicy;
    /** The named preset the policy corresponds to; null for a custom shape. */
    presetId: StartListPresetId | null;
    /** The requesting actor's allowed self-service ops (humanized refusals). */
    viewer: StartListOps;
    /** Every unclaimed placeholder seat in the round (empty when none). */
    seats: StartListSeat[];
    /** Every claimed seat-origin producer (empty when none) — rebind/release UI. */
    claimedSeats: ClaimedSeat[];
}

export class StartListService {
    constructor(
        private db: Kysely<Database>,
        private rounds: RoundService,
    ) {}

    /** The round's effective policy: latest draft's `startList`, else open. */
    async policyForRound(roundId: string): Promise<StartListPolicy> {
        const stored = await this.rounds.latestSetupDraft(roundId);
        return effectiveStartListPolicy(stored?.draft);
    }

    /**
     * The policy + the actor's allowed ops for a round. `viewerPlayerId` is
     * the SERVER-resolved optional session identity (never body-supplied);
     * null = anonymous token holder. `nowIso` is injectable for tests.
     */
    async viewForRound(
        roundId: string,
        viewerPlayerId: string | null,
        nowIso: string = new Date().toISOString(),
    ): Promise<StartListView> {
        const stored = await this.rounds.latestSetupDraft(roundId);
        const policy = effectiveStartListPolicy(stored?.draft);
        const actor = await this.actorContext(roundId, viewerPlayerId);
        return {
            policy,
            presetId: matchingPresetId(policy),
            viewer: evaluateStartListOps(policy, actor, nowIso),
            seats: await this.unclaimedSeats(roundId, stored?.draft ?? null),
            claimedSeats: await this.claimedSeats(
                roundId,
                stored?.draft ?? null,
                viewerPlayerId,
            ),
        };
    }

    /**
     * Every unclaimed placeholder seat: `ball_players` rows with BOTH identity
     * FKs null (the canonical pending signal), joined to the seat's ball +
     * playing group, enriched with the draft placeholder's teamRef/category.
     * Zero-row on every pre-5.5 round — the query is a cheap indexed miss.
     */
    private async unclaimedSeats(
        roundId: string,
        draft: RoundSetupDraft | null,
    ): Promise<StartListSeat[]> {
        const rows = await this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .leftJoin('playing_group_balls as pgb', 'pgb.ball_id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            .where('bp.player_id', 'is', null)
            .where('bp.guest_player_id', 'is', null)
            .select([
                'bp.producer_def_id',
                'bp.display_name_snapshot',
                'bp.category_snapshot',
                'bp.ball_id',
                'pgb.playing_group_id',
            ])
            .execute();
        if (rows.length === 0) return [];

        const placeholderByDefId = new Map(
            (draft?.producers ?? [])
                .filter(isPlaceholderProducer)
                .map((p) => [p.producerDefId, p] as const),
        );
        // One seat per producer def-id: a seat's producer can appear on more
        // than one ball row only via multiple strategies for the same ball id
        // (dedupe keeps one), so first-seen wins deterministically.
        const seen = new Set<string>();
        const seats: StartListSeat[] = [];
        for (const r of rows) {
            if (seen.has(r.producer_def_id)) continue;
            seen.add(r.producer_def_id);
            const ph = placeholderByDefId.get(r.producer_def_id);
            seats.push({
                seatId: r.producer_def_id,
                label: r.display_name_snapshot,
                ballId: r.ball_id,
                groupId: r.playing_group_id ?? null,
                teamRef: ph?.placeholder.teamRef ?? null,
                category: r.category_snapshot,
            });
        }
        return seats;
    }

    /**
     * Every CLAIMED seat-origin producer: identity producers in the latest
     * draft carrying the `seat` marker (set only by the claim op). Enriched
     * with the occupant's snapshot name, one carrying ball, and the viewer's
     * release affordance. Zero-cost on rounds without seat history — the
     * draft filter short-circuits before any query.
     */
    private async claimedSeats(
        roundId: string,
        draft: RoundSetupDraft | null,
        viewerPlayerId: string | null,
    ): Promise<ClaimedSeat[]> {
        const seatOrigin = (draft?.producers ?? []).filter(
            (p): p is DraftIdentityProducer & { seat: { label: string } } =>
                isIdentityProducer(p) && p.seat !== undefined,
        );
        if (seatOrigin.length === 0) return [];

        const defIds = seatOrigin.map((p) => p.producerDefId);
        const rows = await this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .where('b.round_id', '=', roundId)
            .where('bp.producer_def_id', 'in', defIds)
            .select(['bp.producer_def_id', 'bp.ball_id', 'bp.display_name_snapshot'])
            .execute();
        const ballIdsByDefId = new Map<string, string[]>();
        const nameByDefId = new Map<string, string>();
        for (const r of rows) {
            const list = ballIdsByDefId.get(r.producer_def_id) ?? [];
            list.push(r.ball_id);
            ballIdsByDefId.set(r.producer_def_id, list);
            if (!nameByDefId.has(r.producer_def_id)) {
                nameByDefId.set(r.producer_def_id, r.display_name_snapshot);
            }
        }

        const allBallIds = [...new Set(rows.map((r) => r.ball_id))];
        const scoredBallIds = new Set(
            allBallIds.length === 0
                ? []
                : (
                      await this.db
                          .selectFrom('score_events')
                          .select('ball_id')
                          .where('round_id', '=', roundId)
                          .where('ball_id', 'in', allBallIds)
                          .groupBy('ball_id')
                          .execute()
                  ).map((r) => r.ball_id),
        );

        return seatOrigin.map((p) => {
            const ballIds = ballIdsByDefId.get(p.producerDefId) ?? [];
            const hasScores = ballIds.some((id) => scoredBallIds.has(id));
            const occupiedByViewer =
                viewerPlayerId !== null &&
                p.playerRef.kind === 'player' &&
                p.playerRef.id === viewerPlayerId;
            return {
                seatId: p.producerDefId,
                seatLabel: p.seat.label,
                displayName: nameByDefId.get(p.producerDefId) ?? p.seat.label,
                ballId: ballIds[0] ?? null,
                occupiedByViewer,
                hasScores,
                viewerMayRelease:
                    !hasScores && (occupiedByViewer || p.playerRef.kind === 'guest'),
            };
        });
    }

    /**
     * Resolve the actor context the pure evaluator consumes. Cheap on the
     * fully-open default: membership lookups only run for a logged-in viewer.
     */
    async actorContext(
        roundId: string,
        viewerPlayerId: string | null,
    ): Promise<{ playerId: string | null; onRoster: boolean | null; isProducer: boolean }> {
        if (viewerPlayerId === null) {
            return { playerId: null, onRoster: null, isProducer: false };
        }
        const [onRoster, isProducer] = await Promise.all([
            this.rosterMembership(roundId, viewerPlayerId),
            this.isProducer(roundId, viewerPlayerId),
        ]);
        return { playerId: viewerPlayerId, onRoster, isProducer };
    }

    /**
     * `null` = the round has no roster source (no competition wrapper);
     * otherwise whether a live (non-withdrawn, non-cut) participant carries
     * this `player_id`. Guest participants can never match a session player —
     * a guest's identity joins the round through the claim flow, not here.
     */
    private async rosterMembership(
        roundId: string,
        playerId: string,
    ): Promise<boolean | null> {
        const wrapper = await this.db
            .selectFrom('competition_rounds')
            .select('competition_id')
            .where('round_id', '=', roundId)
            .executeTakeFirst();
        if (!wrapper) return null;
        const member = await this.db
            .selectFrom('competition_participants')
            .select('id')
            .where('competition_id', '=', wrapper.competition_id)
            .where('player_id', '=', playerId)
            .where('withdrawn_at', 'is', null)
            .where('cut_after_round', 'is', null)
            .limit(1)
            .executeTakeFirst();
        return member !== undefined;
    }

    /**
     * Already a producer? `ball_players` carries every materialised identity,
     * including a claimed guest (the claim flips `player_id` on the ball row).
     */
    private async isProducer(roundId: string, playerId: string): Promise<boolean> {
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
}
