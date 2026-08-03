import { Signal } from '@basics/core/client/core';
import type { ConfirmProps } from '@basics/core/client/ui/confirm';

/*
 * Destructive confirmation, wired once for Manage.
 *
 * The dialog itself is the framework's `ConfirmComponent` — a centred alert
 * over a scrim, which is the repo's convention for a destructive question on
 * both clients (see the round-delete flow in `src/history/history.component.ts`
 * and `src/round/manage-overlay.component.ts`). Nothing here re-draws it. What
 * this module fixes is the CONTRACT, because that is what drifted between the
 * player app's five call sites:
 *
 *  - `danger: true` always. A delete that renders a green Confirm button is the
 *    accident this exists to prevent.
 *  - The consequence is REQUIRED and is its own argument. `ConfirmProps.message`
 *    already documents the rule ("state the CONSEQUENCE, not 'are you sure'");
 *    naming the parameter `consequence` is what makes an omission visible at
 *    the call site rather than in review.
 *  - The confirm button is a VERB ON THE OBJECT — "Delete club", "Remove tee" —
 *    never "OK", never "Yes". A user reading only the buttons must still know
 *    what happens (docs/design-guidelines.md §4: words, not symbols; a label is
 *    what the thing IS).
 *
 * Usage — the helper builds props, the screen spawns the component, so `spawn`
 * stays where the component tree is:
 *
 *   this.spawn(ConfirmComponent, this.ref(frag, 'confirmHost'), destructiveConfirm({
 *       open: this.deleteOpen,
 *       title: 'Delete this club?',
 *       consequence: () => `${name()} and its courses stop being available…`,
 *       confirmLabel: 'Delete club',
 *       onconfirm: () => void this.remove(),
 *   }));
 *   this.track(closeOnEscape(this.deleteOpen));
 */

export type DestructiveConfirmSpec = {
    /** Owned by the screen: set it true to open, the dialog sets it false. */
    open: Signal<boolean>;
    /** The question, as a question. `() => …` to follow live data. */
    title: string | (() => string);
    /** What becomes true if they go ahead. Never "Are you sure?". */
    consequence: string | (() => string);
    /** Verb on the object: "Delete club". */
    confirmLabel: string | (() => string);
    onconfirm: () => void;
    oncancel?: () => void;
    /** Only override to say what is being kept, e.g. "Keep club". */
    cancelLabel?: string | (() => string);
};

/** Props for `ConfirmComponent`, with the destructive contract applied. */
export function destructiveConfirm(spec: DestructiveConfirmSpec): ConfirmProps {
    return {
        open: spec.open,
        title: spec.title,
        message: spec.consequence,
        confirmLabel: spec.confirmLabel,
        cancelLabel: spec.cancelLabel ?? 'Cancel',
        danger: true,
        onconfirm: spec.onconfirm,
        oncancel: spec.oncancel,
    };
}

/**
 * Escape closes the dialog. The framework's overlay closes on a click OUTSIDE
 * and on nothing else, so without this the keyboard has no way out of a modal
 * question — which is why every player-app call site grew its own keydown
 * listener. Returns a disposer for `this.track(...)`.
 *
 * Cancelling by Escape runs `oncancel` for the same reason the Cancel button
 * does: a screen that clears a draft on cancel must not be able to tell the two
 * exits apart.
 */
export function closeOnEscape(open: Signal<boolean>, oncancel?: () => void): () => void {
    const onKey = (e: KeyboardEvent): void => {
        if (e.key !== 'Escape' || !open.get()) return;
        open.set(false);
        oncancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
}
