import { ConflictError } from '@basics/core/server/auth';

/**
 * Delete-reference guards for the authoring catalog — clubs, courses, tees
 * (docs/proposals/manage-ui.md §3.7).
 *
 * The catalog's foreign keys are written for DATABASE integrity, not for a
 * human pressing Delete in a management UI. Two failure modes follow from
 * that, and this module exists to turn both into one readable refusal:
 *
 *  - `ON DELETE cascade` quietly destroys authored rows (a club's courses, a
 *    course's route templates) with no warning and no undo;
 *  - `ON DELETE restrict` (`rounds.course_id`) raises a raw SQLite error that
 *    `mount()` can only render as a 500.
 *
 * A guard therefore refuses BEFORE the delete, with a message that names the
 * actual blocking rows, so the client can show it verbatim and the admin knows
 * exactly what to retire first. The refusal is the repo's standard domain
 * error — `ConflictError` with a `detail.code` (HTTP 409, same shape
 * `PlayerStatsService.refuse` and `ScoreEventService` use) — so a client can
 * branch on the code and still fall back to the message.
 *
 * Which references block and which cascade is a per-entity ruling; each
 * service documents its own on the `remove` method.
 */

/** One kind of reference that stands in the way of a delete. */
export interface DeleteBlocker {
    /** Machine-readable reference kind, e.g. `courses`, `rounds`. */
    kind: string;
    count: number;
    /** Human phrase naming the blocker, e.g. `2 courses (North, South)`. */
    phrase: string;
    /** Optional identifiers behind the phrase, for a client that renders them. */
    items?: string[];
}

/** `a`, `a and b`, `a, b and c` — an English list, not a comma soup. */
function joinPhrases(phrases: string[]): string {
    if (phrases.length <= 1) return phrases[0] ?? '';
    return `${phrases.slice(0, -1).join(', ')} and ${phrases[phrases.length - 1]}`;
}

/**
 * `2 courses (North, South)` — a count, plus up to `limit` names so the admin
 * recognises what they are about to lose. Names are elided rather than
 * truncated to a single one: a bare count answers "how many", the sample
 * answers "which".
 */
export function countWithNames(
    count: number,
    singular: string,
    plural: string,
    names: string[],
    limit = 3,
): string {
    const noun = count === 1 ? singular : plural;
    if (names.length === 0) return `${count} ${noun}`;
    const shown = names.slice(0, limit);
    const suffix = names.length > limit ? ', …' : '';
    return `${count} ${noun} (${shown.join(', ')}${suffix})`;
}

/**
 * Refuse a delete, naming every blocker. `subject` is the thing being deleted
 * ("club", "course", "tee") and appears in the message as written.
 */
export function refuseDelete(
    code: string,
    subject: string,
    blockers: DeleteBlocker[],
): never {
    const err = new ConflictError(
        `Cannot delete this ${subject} — it is still referenced by ` +
            `${joinPhrases(blockers.map((b) => b.phrase))}.`,
    );
    (err as ConflictError & { detail?: unknown }).detail = {
        code,
        // `items` is capped like the phrase's name sample: `count` answers
        // "how many", a few names answer "which" — a full listing would turn
        // a refusal into a data dump.
        blockers: blockers.map(({ kind, count, items }) =>
            items ? { kind, count, items: items.slice(0, 3) } : { kind, count },
        ),
    };
    throw err;
}
