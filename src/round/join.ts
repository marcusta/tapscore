import type { RoundBall, RoundPlayingGroup, StartListView } from '../api/friendly-rounds.gen';

// Phase 3.5 self-join — pure derivation of WHETHER the join card should show
// on a round view. The server (`RoundJoinService.joinByToken`) owns the real
// refusal rules (profile completeness, tee validity, joinable-slot shape,
// active/already-in 409s) and re-checks everything on the actual join call;
// this mirrors only the cheap, always-knowable-client-side conditions so the
// card doesn't flash on a round that could never accept this viewer:
//
//   - logged in (there is no "join as a guest" — that's the share-token flow)
//   - the round hasn't started yet (the server 409s otherwise)
//   - the viewer isn't already a producer here (own-ball OR any team ball —
//     the server 409s a double identity)
//
// Everything else (missing gender/handicap index, no joinable slot, tee
// mismatches) can only be known by calling `join()`, so those surface as
// diagnostics AFTER a submit attempt, not as a reason to hide the card.

export type JoinRoundStatus = 'not_started' | 'active' | 'complete';

/**
 * True when the join card should render for this viewer on this round.
 *
 * - Not logged in (`playerId` null) ⇒ never (no-auth is the share-token score
 *   path, not self-join).
 * - Round not `not_started` ⇒ never (the server refuses with 409 once the
 *   round has begun).
 * - The viewer already appears as a producer on ANY ball (own-ball or team,
 *   player-ref or an already-claimed guest) ⇒ never (server 409s the double
 *   identity; claiming an unclaimed guest is the claim-card's job, not this
 *   one's — a claim and a fresh join are different actions and can coexist
 *   when the round has BOTH an unclaimed guest and room for the viewer to
 *   join separately, but once the viewer is IN, joining again is moot).
 */
export function canShowJoinCard(
    balls: readonly RoundBall[],
    playerId: string | null,
    status: JoinRoundStatus | null | undefined,
): boolean {
    if (!playerId) return false;
    if (status !== 'not_started') return false;
    for (const ball of balls) {
        for (const p of ball.players) {
            if (p.playerId === playerId) return false;
        }
    }
    return true;
}

// --- Start-list policy affordance (Phase 5.5) ---------------------------------
//
// The byToken read carries the round's start-list policy plus THIS viewer's
// allowed self-service ops (`StartListView.viewer`), computed server-side from
// the optional session. The card renders strictly from that decision — the
// server re-enforces on the actual join call, so this is presentation, not
// authorization.

export interface JoinCardPolicyState {
    /** Render the card at all? False = no affordance (organized/roster-refused). */
    visible: boolean;
    /**
     * A humanized, render-verbatim refusal shown INSTEAD of an active form —
     * only for window refusals, where "you could join, just not right now" is
     * information the viewer should see. Null when the form is active.
     */
    blockedMessage: string | null;
}

/**
 * How the join card should treat the viewer's policy decision:
 *   - policy allows joining → normal active card;
 *   - outside the self-service window → card visible, form replaced by the
 *     server's humanized message (`window_not_open` / `window_closed`);
 *   - anything else (`self_service_closed`, `not_on_roster`,
 *     `login_required`, …) → NO card. This is what closes the pre-5.5 leak:
 *     an organized competition round shows no self-join affordance at all.
 *   - `view` null (round still loading) → hidden until the read lands.
 */
export function joinCardPolicyState(view: StartListView | null): JoinCardPolicyState {
    if (!view) return { visible: false, blockedMessage: null };
    const join = view.viewer.join;
    if (join.allowed) return { visible: true, blockedMessage: null };
    if (join.code === 'window_not_open' || join.code === 'window_closed') {
        return { visible: true, blockedMessage: join.message ?? 'Sign-up is closed right now.' };
    }
    return { visible: false, blockedMessage: null };
}

// --- Group picker derivation --------------------------------------------------
//
// When a round already has ≥1 playing group, the join card lets the viewer
// choose WHERE they land instead of silently overflowing into a fresh group.
// This is the pure occupancy/label/default derivation the card renders; the
// server (`RoundJoinService.placeInGroups`) re-validates the choice, so a
// stale option is refused with a `group_full` / `unknown_group` diagnostic
// rather than mis-seating anyone.

/** The literal option meaning "put me in a brand-new group". */
export const NEW_GROUP_CHOICE = 'new';

export interface GroupPickerOption {
    /** The `groupChoice` value to send to the join API: a group's runtime id,
     *  or {@link NEW_GROUP_CHOICE}. */
    value: string;
    /** Compact human label, e.g. `Group 1 · 09:00 — 2 of 4`. */
    label: string;
    /** True when the group is full — the option renders disabled. */
    disabled: boolean;
}

export interface GroupPicker {
    options: GroupPickerOption[];
    /** The option to pre-select: the first group with space, else "new group". */
    defaultValue: string;
}

/**
 * Build the join card's group picker from the round's playing groups. Each
 * existing group becomes an option "Group N · <time> — <n> of <cap>" (disabled
 * when full), followed by a "Start a new group" option. A group's `startTime`
 * is only shown when it carries a real clock time (it defaults to the round
 * DATE when the draft set none — see round.component's group pills).
 *
 * The default is the first group with free capacity; if every group is full,
 * the default is the "new group" option.
 *
 * With no groups at all (`groups` empty), returns just the "new group" option,
 * default-selected — the caller decides whether to render the picker (a round
 * with zero groups has nothing to choose between).
 *
 * `allowNewGroup` (Phase 5.5) mirrors the viewer's `createGroup` policy op:
 * when false, the "Start a new group" option is omitted — the viewer may only
 * slot into an existing group with space. Defaults to true (the open policy).
 */
export function deriveGroupPicker(
    groups: readonly RoundPlayingGroup[],
    allowNewGroup = true,
): GroupPicker {
    const options: GroupPickerOption[] = groups.map((g, i) => {
        const occupancy = g.ballIds.length;
        const parts = [`Group ${i + 1}`];
        if (g.startTime.includes(':')) parts.push(g.startTime);
        return {
            value: g.id,
            label: `${parts.join(' · ')} — ${occupancy} of ${g.capacity}`,
            disabled: occupancy >= g.capacity,
        };
    });

    const firstOpen = options.find((o) => !o.disabled);
    if (allowNewGroup) {
        options.push({ value: NEW_GROUP_CHOICE, label: 'Start a new group', disabled: false });
    }

    return {
        options,
        defaultValue: firstOpen?.value ?? (allowNewGroup ? NEW_GROUP_CHOICE : ''),
    };
}
