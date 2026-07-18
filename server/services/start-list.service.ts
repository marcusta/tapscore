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

export interface StartListView {
    policy: StartListPolicy;
    /** The named preset the policy corresponds to; null for a custom shape. */
    presetId: StartListPresetId | null;
    /** The requesting actor's allowed self-service ops (humanized refusals). */
    viewer: StartListOps;
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
        const policy = await this.policyForRound(roundId);
        const actor = await this.actorContext(roundId, viewerPlayerId);
        return {
            policy,
            presetId: matchingPresetId(policy),
            viewer: evaluateStartListOps(policy, actor, nowIso),
        };
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
