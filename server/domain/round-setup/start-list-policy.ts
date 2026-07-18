// Phase 5.5 Slice 1 — the start-list policy: ONE object deciding who may
// perform which self-service setup edit on a round.
//
// Design decision (PHASES.md Phase 5.5, user 2026-07-13): the policy is an
// ORTHOGONAL AXIS ON THE ROUND ITSELF — data on the round's draft, never
// derived from what wraps it. A friendly round can run an organized start
// list; a competition round can be fully self-organized. Wrappers only supply
// DEFAULTS (friendly create → fully open; competition materialisation copies
// `defaultConfig.startListPolicy`), and the policy is editable per round
// through the normal setup-edit path like every other draft field. NOTHING
// may branch on "is this a competition" to decide behaviour — enforcement
// reads the policy; the only context-derived things are where the default
// comes from and what `'roster'` resolves against.
//
// Three axes + two knobs:
//   - `groups`  — who may create/modify playing groups (self-service):
//        'organized' → nobody but the organizer (token-edit path);
//        'roster'    → members of the round's governing roster;
//        'open'      → anyone with the share token (the friendly default).
//   - `seats`   — producers pre-bound ('assigned') vs placeholder seats
//        ('claimable'). Slice 1 CARRIES this axis; placeholder seats and the
//        claim op land in Slices 2–3.
//   - `claimBy` — who may bind identity to a placeholder seat. Enforced from
//        Slice 3; the evaluator already computes an advisory decision so the
//        claim gate plugs into the same seam.
//   - `window`  — the self-service window; outside it, self-service ops are
//        refused with a humanized message naming the window.
//   - `maxGroupSize` — the standard flight size self-service may fill a group
//        to (default 4). Subsumes the old hardcoded `max(4, members)` builder
//        capacity and the join path's fresh-group capacity of 4.

import { Type, type Static } from '@sinclair/typebox';

// --- Schema (shared with the client via the generated protocol) ---------------

export const StartListWindow = Type.Object({
    /** ISO datetime; absent ⇒ open from the beginning of time. */
    opensAt: Type.Optional(Type.String({ minLength: 1 })),
    /** ISO datetime; absent ⇒ never closes. */
    closesAt: Type.Optional(Type.String({ minLength: 1 })),
});

export const StartListPolicy = Type.Object({
    groups: Type.Union([
        Type.Literal('organized'),
        Type.Literal('roster'),
        Type.Literal('open'),
    ]),
    seats: Type.Union([Type.Literal('assigned'), Type.Literal('claimable')]),
    claimBy: Type.Union([
        Type.Literal('roster'),
        Type.Literal('team'),
        Type.Literal('anyone'),
    ]),
    window: Type.Optional(StartListWindow),
    /** Standard flight size for self-service group fill/creation. Default 4. */
    maxGroupSize: Type.Optional(Type.Integer({ minimum: 1 })),
});

export type StartListWindow = Static<typeof StartListWindow>;
export type StartListPolicy = Static<typeof StartListPolicy>;

export const DEFAULT_MAX_GROUP_SIZE = 4;

/** A policy's effective flight size. */
export function maxGroupSizeOf(policy: StartListPolicy): number {
    return policy.maxGroupSize ?? DEFAULT_MAX_GROUP_SIZE;
}

// --- Defaults + presets -------------------------------------------------------

/**
 * The friendly default: exactly the pre-5.5 behaviour. A draft WITHOUT a
 * `startList` field resolves to this, so existing friendly rounds (and any
 * client that never mentions policies) behave byte-for-byte as before.
 */
export const OPEN_START_LIST_POLICY: StartListPolicy = {
    groups: 'open',
    seats: 'assigned',
    claimBy: 'anyone',
};

export type StartListPresetId =
    | 'organized'
    | 'organized_open_slots'
    | 'pick_your_tee_time'
    | 'self_organized';

/**
 * The four named presets — UI sugar producing a policy OBJECT. The object is
 * what gets stored on the draft (never the preset name); `matchingPresetId`
 * lets a preset picker show which preset a stored policy still corresponds to.
 */
export const START_LIST_PRESETS: Record<StartListPresetId, StartListPolicy> = {
    /** Fully pre-assigned: the organizer builds groups and seats. */
    organized: { groups: 'organized', seats: 'assigned', claimBy: 'roster' },
    /** Legacy series shape: organizer-built groups with team-claimable seats. */
    organized_open_slots: { groups: 'organized', seats: 'claimable', claimBy: 'team' },
    /** Admin-created tee times; roster players slot themselves in. */
    pick_your_tee_time: { groups: 'organized', seats: 'claimable', claimBy: 'roster' },
    /** Legacy tour open start: roster members build their own groups. */
    self_organized: { groups: 'roster', seats: 'claimable', claimBy: 'roster' },
};

/**
 * The preset a policy corresponds to, or null for a custom shape. Matches on
 * the three axes only — `window`/`maxGroupSize` are tuning knobs a preset
 * choice legitimately keeps.
 */
export function matchingPresetId(policy: StartListPolicy): StartListPresetId | null {
    for (const [id, preset] of Object.entries(START_LIST_PRESETS) as [
        StartListPresetId,
        StartListPolicy,
    ][]) {
        if (
            preset.groups === policy.groups &&
            preset.seats === policy.seats &&
            preset.claimBy === policy.claimBy
        ) {
            return id;
        }
    }
    return null;
}

/**
 * Resolve a draft's policy: the stored `startList` object, else the open
 * default. `null`/`undefined` draft (rounds that never had a stored draft —
 * admin/legacy direct-definition rounds) also resolve to open, preserving
 * their pre-5.5 behaviour.
 */
export function effectiveStartListPolicy(
    draft: { startList?: StartListPolicy } | null | undefined,
): StartListPolicy {
    return draft?.startList ?? OPEN_START_LIST_POLICY;
}

// --- Pure policy evaluation ---------------------------------------------------
//
// ONE evaluator used by every gate (join endpoint, group creation, the round
// read's affordance payload; the Slice 3 claim op plugs into `claimSeat`).
// No scattered ad-hoc checks: callers resolve the ACTOR CONTEXT (who is this,
// are they on the governing roster, are they already in the round) and this
// function turns (policy, actor, now) into allow/refuse decisions with the
// humanized message the client renders verbatim.

export interface StartListActor {
    /** Session player id; null = anonymous share-token holder. */
    playerId: string | null;
    /**
     * Is the actor a member of the round's governing roster?
     *   - true/false when a roster source exists (today: the round's
     *     competition's non-withdrawn, non-cut participants by player_id);
     *   - null when the round has NO roster source. Under `groups:'roster'`
     *     such a round is closed to newcomers — except producers already in
     *     the round, who count as their own roster (see evaluator).
     */
    onRoster: boolean | null;
    /** Is the actor already a producer in the round? */
    isProducer: boolean;
}

export interface StartListOpDecision {
    allowed: boolean;
    /** Stable refusal code; absent when allowed. */
    code?: string;
    /** Humanized refusal the client renders verbatim; absent when allowed. */
    message?: string;
}

export interface StartListOps {
    /** May the actor self-join (add themselves as a new producer)? */
    join: StartListOpDecision;
    /** May the actor create a new playing group via self-service? */
    createGroup: StartListOpDecision;
    /**
     * May the actor bind identity to a placeholder seat? ADVISORY until the
     * claim op exists (Slice 3) — computed from `claimBy` so the future gate
     * reuses this seam. `'team'` refuses here: team-bound claims need the
     * actor's team context, which arrives with Phase 6 lineups.
     */
    claimSeat: StartListOpDecision;
    /** The effective self-service flight size (new groups + group fill). */
    maxGroupSize: number;
}

const allow: StartListOpDecision = { allowed: true };

function refuse(code: string, message: string): StartListOpDecision {
    return { allowed: false, code, message };
}

/** `2026-07-18T14:00:00Z` → `2026-07-18 14:00` — readable in a refusal. */
function humanizeWhen(iso: string): string {
    return iso.replace('T', ' ').slice(0, 16);
}

/**
 * The self-service window decision, or null when inside/absent. Applies to
 * every self-service op — the window scopes self-service as a whole, not one
 * verb.
 */
function windowDecision(
    window: StartListWindow | undefined,
    nowIso: string,
): StartListOpDecision | null {
    if (!window) return null;
    const now = Date.parse(nowIso);
    if (window.opensAt !== undefined && now < Date.parse(window.opensAt)) {
        return refuse(
            'window_not_open',
            `Self-service sign-up has not opened yet — it opens ${humanizeWhen(window.opensAt)}.`,
        );
    }
    if (window.closesAt !== undefined && now > Date.parse(window.closesAt)) {
        return refuse(
            'window_closed',
            `Self-service sign-up closed ${humanizeWhen(window.closesAt)}.`,
        );
    }
    return null;
}

/**
 * The membership gate for the `groups` axis, shared by join + createGroup.
 * Returns null when the axis allows the actor.
 */
function groupsDecision(
    policy: StartListPolicy,
    actor: StartListActor,
): StartListOpDecision | null {
    switch (policy.groups) {
        case 'organized':
            return refuse(
                'self_service_closed',
                'The start list for this round is set by the organizer — ask them to add you.',
            );
        case 'roster':
            if (actor.playerId === null) {
                return refuse('login_required', 'Log in to add yourself to this round.');
            }
            // A round with no roster source is closed under 'roster' — except
            // to its own producers, who ARE its de-facto roster (they may
            // still organize their groups).
            if (actor.onRoster === null) {
                return actor.isProducer
                    ? null
                    : refuse(
                          'not_on_roster',
                          'This round is limited to its roster, and this round has no open roster to join through.',
                      );
            }
            return actor.onRoster
                ? null
                : refuse(
                      'not_on_roster',
                      'This round is limited to the competition roster — you are not on it.',
                  );
        case 'open':
            if (actor.playerId === null) {
                return refuse('login_required', 'Log in to add yourself to this round.');
            }
            return null;
    }
}

/** The `claimBy` gate — advisory until the Slice 3 claim op consumes it. */
function claimDecision(
    policy: StartListPolicy,
    actor: StartListActor,
): StartListOpDecision {
    switch (policy.claimBy) {
        case 'anyone':
            return allow;
        case 'roster':
            if (actor.onRoster === null) {
                return actor.isProducer
                    ? allow
                    : refuse(
                          'not_on_roster',
                          'Seats in this round can only be claimed by roster members.',
                      );
            }
            return actor.onRoster
                ? allow
                : refuse(
                      'not_on_roster',
                      'Seats in this round can only be claimed by roster members.',
                  );
        case 'team':
            return refuse(
                'team_claim_unavailable',
                'Seats in this round are claimed per team — team claims arrive with team lineups.',
            );
    }
}

/**
 * (policy, actor, now) → allowed self-service ops. Pure; every gate calls
 * this and nothing else decides.
 */
export function evaluateStartListOps(
    policy: StartListPolicy,
    actor: StartListActor,
    nowIso: string,
): StartListOps {
    const outsideWindow = windowDecision(policy.window, nowIso);
    const membership = groupsDecision(policy, actor);
    // Refusal precedence: a closed/rostered start list is the durable fact —
    // report it before a (transient) window refusal.
    const selfService = membership ?? outsideWindow ?? allow;
    return {
        join: selfService,
        createGroup: selfService,
        claimSeat: claimDecision(policy, actor),
        maxGroupSize: maxGroupSizeOf(policy),
    };
}
