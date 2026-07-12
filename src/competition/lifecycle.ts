// Phase 4 Slice 5 (client) — pure presentation helpers for a competition's
// lifecycle machine (`draft → setup → active → finalized`). Kept out of the
// components so the chip text, the chip's CSS modifier, and the "what's the
// next forward transition" decision are all unit-testable without a DOM.
//
// The finalized state is NEVER reached through `transition` (the server
// reserves it for the finalize endpoint), so `nextTransition` stops at
// `active` — the "Finalize" action is a separate admin control.

export type Lifecycle = 'draft' | 'setup' | 'active' | 'finalized';

/** Human label for a lifecycle chip. */
export function lifecycleLabel(lifecycle: Lifecycle): string {
    switch (lifecycle) {
        case 'draft':
            return 'Draft';
        case 'setup':
            return 'Setup';
        case 'active':
            return 'Live';
        case 'finalized':
            return 'Finalized';
    }
}

/** CSS modifier suffix for a lifecycle chip (`comp-chip--<state>`). */
export function lifecycleClass(lifecycle: Lifecycle): string {
    return `comp-chip comp-chip--${lifecycle}`;
}

/**
 * The next forward transition an admin can drive, or null when there is none
 * reachable via `transition` (active → finalized is the finalize endpoint's
 * job; finalized is terminal). Returns the target lifecycle + the button label.
 */
export function nextTransition(
    lifecycle: Lifecycle,
): { to: Lifecycle; label: string } | null {
    switch (lifecycle) {
        case 'draft':
            return { to: 'setup', label: 'Open setup' };
        case 'setup':
            return { to: 'active', label: 'Start competition' };
        default:
            return null;
    }
}

/** Whether the setup editor (defaults, aggregation, cut rules, roster edits)
 *  is meaningful in this lifecycle. Draft + setup allow authoring; once active
 *  the field is playing and once finalized everything is frozen. Mirrors the
 *  server's own lifecycle guards — the server is the source of truth and
 *  returns humanized refusals, but the client hides controls that would only
 *  ever refuse. */
export function canEditSetup(lifecycle: Lifecycle): boolean {
    return lifecycle === 'draft' || lifecycle === 'setup';
}

/** Rounds can be materialised in setup or active (a round can be added
 *  mid-competition), matching the server's `lifecycle_forbids_rounds` guard. */
export function canAddRounds(lifecycle: Lifecycle): boolean {
    return lifecycle === 'setup' || lifecycle === 'active';
}
