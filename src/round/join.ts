import type { RoundBall, RoundPlayingGroup } from '../api/friendly-rounds.gen';

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
 */
export function deriveGroupPicker(groups: readonly RoundPlayingGroup[]): GroupPicker {
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
    options.push({ value: NEW_GROUP_CHOICE, label: 'Start a new group', disabled: false });

    return { options, defaultValue: firstOpen?.value ?? NEW_GROUP_CHOICE };
}
