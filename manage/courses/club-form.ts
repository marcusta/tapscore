// What a club form holds and what makes it valid. Pure — no DOM, no signals —
// because the same three fields are typed in two places (the create panel on
// the list, the edit form on the club page) and the two must not disagree
// about what "valid" means.

import type { Club } from '../../src/api/clubs.gen';

/** The raw strings under the three controls. Never null: an input has a value. */
export type ClubDraft = {
    name: string;
    location: string;
    logoUrl: string;
};

/** Per-field messages, keyed by the field they belong under. */
export type ClubFieldErrors = {
    name?: string;
    logoUrl?: string;
};

export function emptyDraft(): ClubDraft {
    return { name: '', location: '', logoUrl: '' };
}

export function draftFrom(club: Club): ClubDraft {
    return { name: club.name, location: club.location ?? '', logoUrl: club.logoUrl ?? '' };
}

/**
 * Client-side validation, which is a courtesy and not the authority — the
 * server validates every write regardless, and its refusal is what the screens
 * surface (see `manage/api-failure.ts`).
 *
 * Two rules, both of which catch a mistake the server would only report as a
 * blunt 400:
 *
 *  - a club needs a name (spec §3.2: name required, the other two optional);
 *  - a logo URL must be an ABSOLUTE http(s) address. `logo_url` is dropped
 *    straight into an `<img src>` by whatever consumes it, so a relative path
 *    or a bare "clubname.se" resolves against the wrong origin and silently
 *    shows nothing. Empty stays valid — the field is optional.
 *
 * Messages say what to do, not merely that something is wrong.
 */
export function validateClub(draft: ClubDraft): ClubFieldErrors {
    const errors: ClubFieldErrors = {};

    if (draft.name.trim() === '') {
        errors.name = 'A club needs a name. Enter one before saving.';
    }

    const logoUrl = draft.logoUrl.trim();
    if (logoUrl !== '' && !isAbsoluteHttpUrl(logoUrl)) {
        errors.logoUrl = 'Enter a full web address starting with https://, or leave this empty.';
    }

    return errors;
}

export function hasErrors(errors: ClubFieldErrors): boolean {
    return Object.keys(errors).length > 0;
}

/**
 * The draft as the API takes it: trimmed, and an empty optional field sent as
 * `null` rather than `''`. The distinction is real — `location: ''` would store
 * a club whose location is the empty string, which reads as "known to be
 * nothing" instead of "not recorded".
 */
export function clubPayload(draft: ClubDraft): {
    name: string;
    location: string | null;
    logoUrl: string | null;
} {
    return {
        name: draft.name.trim(),
        location: draft.location.trim() || null,
        logoUrl: draft.logoUrl.trim() || null,
    };
}

/**
 * What deleting a club makes true — the sentence the confirm dialog states
 * instead of "are you sure" (`manage/ui/confirm.ts`).
 *
 * It lives here, next to the rest of the club-form vocabulary, because the same
 * delete is offered in two places — the row action on the clubs list and the
 * button on the club page — and two verbatim copies of a consequence is exactly
 * how the two drift into telling the user different things about one action.
 *
 * The count is STATED, not acted on: whether a club with courses may go is the
 * server's call (spec §3.7), and its refusal is what the screen surfaces if it
 * says no.
 */
export function deleteConsequence(clubName: string, courseCount: number): string {
    const courses =
        courseCount === 0
            ? 'It has no courses.'
            : courseCount === 1
              ? 'It has 1 course.'
              : `It has ${courseCount} courses.`;
    return `${clubName} leaves the catalog. ${courses} Rounds already played keep their own copy of the course data, so no scorecard changes.`;
}

/** The same sentence when the club itself is no longer in hand. */
export const DELETE_CONSEQUENCE_UNKNOWN = 'The club is removed from the catalog.';

function isAbsoluteHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}
