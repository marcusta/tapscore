// Client mirror of the delete-blocker payload the catalog guards attach to a
// 409 (`server/services/catalog-delete-guard.ts` — that file is the source of
// truth; a kind added there must be added here in the same change). Since
// @basics/core 1.5.0 the structured payload rides on `ApiError.detail`, so a
// manage screen can render blockers as a list instead of only repeating
// `err.message`. The message string remains the fallback contract: a screen
// that gets `null` here shows the sentence and loses nothing.

import { ApiError } from '@basics/core/client/api-error';

/** Mirrors `DeleteBlockerKind` in `server/services/catalog-delete-guard.ts`. */
export type DeleteBlockerKind =
    | 'courses'
    | 'home_club_players'
    | 'rounds'
    | 'route_templates'
    | 'tee_role_mappings';

const KINDS: ReadonlySet<string> = new Set([
    'courses',
    'home_club_players',
    'rounds',
    'route_templates',
    'tee_role_mappings',
] satisfies DeleteBlockerKind[]);

export interface DeleteBlockerItem {
    kind: DeleteBlockerKind;
    count: number;
    /** Name sample, capped server-side at 3 — "which", not a full listing. */
    items?: string[];
}

export interface DeleteBlockedDetail {
    /**
     * e.g. `club_delete_blocked`, `course_delete_blocked`, `tee_delete_blocked`
     * — and `tee_rating_removal_blocked`, which is not a delete at all but
     * refuses over the same references in the same shape (`refuseReferenced`).
     */
    code: string;
    blockers: DeleteBlockerItem[];
}

/**
 * The structured refusal behind a failed delete, or `null` when the error is
 * anything else (a transport failure, a different 409, a server too old to
 * carry `detail`). Validates the shape rather than trusting the cast — the
 * payload crosses a version boundary — and fails CLOSED on a kind this mirror
 * does not know: the fallback (the server's own sentence) already names every
 * blocker, so dropping to it loses wording, never information.
 */
export function deleteBlockedDetail(err: unknown): DeleteBlockedDetail | null {
    if (!(err instanceof ApiError) || err.status !== 409) return null;
    const detail = err.detail;
    if (typeof detail !== 'object' || detail === null) return null;
    const { code, blockers } = detail as { code?: unknown; blockers?: unknown };
    if (typeof code !== 'string' || !Array.isArray(blockers)) return null;
    if (!blockers.every(isBlockerItem)) return null;
    return { code, blockers };
}

function isBlockerItem(value: unknown): value is DeleteBlockerItem {
    if (typeof value !== 'object' || value === null) return false;
    const { kind, count, items } = value as Record<string, unknown>;
    return (
        typeof kind === 'string' &&
        KINDS.has(kind) &&
        typeof count === 'number' &&
        (items === undefined || (Array.isArray(items) && items.every((i) => typeof i === 'string')))
    );
}
