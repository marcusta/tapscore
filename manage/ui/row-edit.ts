import { Signal } from '@basics/core/client/core';

/*
 * The inline-edit state machine, shared by every Manage screen that edits a row
 * in place (spec §2.5, §3.2, §3.4, §3.5).
 *
 * It is a plain object rather than part of `ManageTableComponent` on purpose:
 * the same four states describe an editable row in a table, in a hole grid and
 * in a tee-rating panel, none of which are the same DOM. The table CONSUMES a
 * controller (`ManageTableProps.edit`) and knows how to present it; a screen
 * that draws its own grid can reuse the states without the table.
 *
 * One row at a time, app-wide-per-controller. That is a deliberate constraint,
 * not a simplification: two half-saved rows on one screen is a state nobody can
 * describe in an error message, and "commit before you move on" is how every
 * catalog editor worth copying behaves. A screen that genuinely needs two
 * concurrent editors uses two controllers.
 *
 * The DRAFT is not here. What the user has typed belongs to the screen, in
 * whatever shape its API takes — this holds only which row is open, whether a
 * save is in flight, and what went wrong. Keeping the draft out is what makes
 * one controller serve a club row (two fields) and a hole row (three numbers).
 */

/**
 * `failed` is a distinct state from `editing`, not `editing` plus a message:
 * the row is still open and the draft is still the user's, but the last attempt
 * did not land, and the difference is what a screen needs to decide whether to
 * re-enable a Save button or nag.
 */
export type RowEditPhase = 'idle' | 'editing' | 'saving' | 'failed';

/**
 * What a save reports back. `message` is required on failure and is the copy
 * shown on the row — server text where the server said something useful,
 * app copy where it did not. Per the framework's field-error rule the copy says
 * what is wrong AND what to do about it.
 */
export type CommitOutcome = { ok: true } | { ok: false; message: string };

/** The fallback when a save throws rather than returning an outcome. */
export const COMMIT_FAILED = 'Could not save. Check your connection and try again.';

export class RowEditController {
    /** The row being edited, by the same key the table identifies rows with. */
    readonly key = new Signal<string | null>(null);
    readonly phase = new Signal<RowEditPhase>('idle');
    /** Set only in `failed`. Cleared by any transition out of it. */
    readonly error = new Signal<string | null>(null);

    /**
     * Open a row for editing. Ignored while a save is in flight — a request is
     * out for the current row and moving the editor off it would leave the user
     * unable to see the outcome.
     */
    begin(key: string): void {
        if (this.phase.get() === 'saving') return;
        this.key.set(key);
        this.phase.set('editing');
        this.error.set(null);
    }

    /** Close the editor, discarding whatever draft the screen holds. */
    cancel(): void {
        if (this.phase.get() === 'saving') return;
        this.key.set(null);
        this.phase.set('idle');
        this.error.set(null);
    }

    /**
     * Run `save`, holding the row in `saving` until it settles.
     *
     * Success closes the editor. FAILURE DOES NOT: the row stays open with the
     * draft intact and the message on it, because the one thing a user must
     * never lose to a failed request is what they typed.
     *
     * Returns whether it landed, so a caller can chain (refetch the list, move
     * focus) without duplicating the phase read.
     */
    async commit(save: () => Promise<CommitOutcome>): Promise<boolean> {
        if (this.key.get() === null || this.phase.get() === 'saving') return false;

        this.phase.set('saving');
        this.error.set(null);

        let outcome: CommitOutcome;
        try {
            outcome = await save();
        } catch {
            // A thrown error is a bug or a dead network, and neither has copy
            // worth showing. The generic line at least says what to try.
            outcome = { ok: false, message: COMMIT_FAILED };
        }

        if (!outcome.ok) {
            this.phase.set('failed');
            this.error.set(outcome.message);
            return false;
        }

        this.key.set(null);
        this.phase.set('idle');
        this.error.set(null);
        return true;
    }

    /**
     * Fail the open row without a request — client-side validation, in other
     * words. Same state as a rejected save, so the row presents identically.
     */
    fail(message: string): void {
        if (this.key.get() === null) return;
        this.phase.set('failed');
        this.error.set(message);
    }

    isEditing(key: string): boolean {
        return this.key.get() === key;
    }

    isSaving(key: string): boolean {
        return this.key.get() === key && this.phase.get() === 'saving';
    }

    /** The message to show ON `key`, or null. Never leaks onto another row. */
    errorFor(key: string): string | null {
        return this.key.get() === key && this.phase.get() === 'failed' ? this.error.get() : null;
    }
}
