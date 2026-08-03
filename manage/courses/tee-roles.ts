// What the tee-role matrix offers in a cell, and what round setup would
// actually do with the mappings as they stand (spec §3.6). Pure — no DOM, no
// signals — because both answers are rules rather than rendering, and both are
// asserted directly in tests.

import type { SelectOption } from '@basics/core/client/ui/select';
import type { CourseTeeRole, TeeRole } from '../../src/api/courses.gen';
import type { Tee } from '../../src/api/tees.gen';
import { resolveDefaultTee } from '../../src/create/tee-defaults';
import { colourWord, genderLabel, type Gender } from './tee-form';

/** The empty choice, worded. A role with no tee is a real answer, not a gap. */
export const NOT_SET = '';
export const NOT_SET_LABEL = 'Not set';

/**
 * The tees a cell may offer: only those carrying a rating for that gender.
 *
 * This MIRRORS the server rule (`CourseService.setTeeRole` refuses an unrated
 * tee with a 409) and does not replace it. The filter exists so the owner is
 * not offered a choice that is going to be refused — an empty column is a
 * legible statement that no tee is rated for those players. The server stays
 * the authority: nothing here pre-validates a write, and a refusal is repeated
 * verbatim.
 *
 * Server order is kept. The tees table directly above this matrix lists them in
 * exactly that order, and a dropdown that re-sorted them would make the reader
 * hunt for a row they had just read.
 */
export function ratedTees(tees: Tee[], gender: Gender): Tee[] {
    return tees.filter((tee) => tee.ratings.some((rating) => rating.gender === gender));
}

/**
 * A tee in a dropdown. The colour rides along when it says something the name
 * does not — "Gul" needs no "· yellow" after it, but "Championship" does.
 */
export function teeOptionLabel(tee: Tee): string {
    const colour = tee.colour?.trim() ?? '';
    if (colour === '') return tee.name;
    const word = colourWord(colour);
    return word.toLocaleLowerCase('sv-SE') === tee.name.trim().toLocaleLowerCase('sv-SE')
        ? tee.name
        : `${tee.name} · ${word}`;
}

/** One cell's options: "Not set" first, then the rated tees. */
export function teeOptions(tees: Tee[], gender: Gender): SelectOption[] {
    return [
        { value: NOT_SET, label: NOT_SET_LABEL },
        ...ratedTees(tees, gender).map((tee) => ({ value: tee.id, label: teeOptionLabel(tee) })),
    ];
}

/** The tee a mapping names, or `''` when the cell is empty. */
export function mappedTeeId(
    mappings: CourseTeeRole[],
    roleKey: string,
    gender: Gender,
): string {
    return (
        mappings.find((mapping) => mapping.roleKey === roleKey && mapping.gender === gender)
            ?.teeId ?? NOT_SET
    );
}

/**
 * WHY a round would start from the tee it starts from.
 *
 * The matrix shows what is stored; this shows what round setup would RESOLVE,
 * which is not the same question. `resolveDefaultTee` (the one implementation,
 * shared with the player app) falls back from the asked-for role to `club`, then
 * to the Swedish colour convention, then to a rated tee — so an empty cell very
 * often still produces a tee, and an owner who reads the empty cell as "nothing
 * happens" is wrong. Naming the provenance is the whole point of the popover.
 *
 * The import of it is a RUNTIME import — Manage really does execute the player
 * app's function, which is the point: two implementations of "which tee" would
 * drift and this popover would start lying. What keeps the player's component
 * graph out of the Manage bundle is that `src/create/tee-defaults.ts` imports
 * only TYPES itself, so the module pulls in no theme, no service and no DOM.
 */
export type Resolution =
    | { via: 'role' | 'club' | 'convention'; teeName: string }
    | { via: 'none' };

export function resolveRole(
    tees: Tee[],
    mappings: CourseTeeRole[],
    roleKey: string,
    gender: Gender,
): Resolution {
    const teeId = resolveDefaultTee(tees, mappings, gender, roleKey);
    const tee = tees.find((candidate) => candidate.id === teeId);
    if (!tee) return { via: 'none' };
    if (mappedTeeId(mappings, roleKey, gender) === tee.id) return { via: 'role', teeName: tee.name };
    if (mappedTeeId(mappings, 'club', gender) === tee.id) return { via: 'club', teeName: tee.name };
    return { via: 'convention', teeName: tee.name };
}

/**
 * The refusals this surface can PROVOKE, said in this surface's own words.
 *
 * `failureMessage` repeats a 4xx verbatim, and that stays the rule for anything
 * unrecognised: the server is the authority, and re-wording a rule the client
 * does not model is how a client ends up contradicting it. But two of these
 * refusals are ones this matrix itself can cause with a stale list — the tee
 * lost that gender's rating, or the tee is no longer this course's — and the
 * server's phrasing for them is schema language ("the mapped gender"), which
 * names a column rather than telling the owner what happened or what to do.
 * Those two, and only those two, are translated.
 *
 * Matching is on containment, because `failureMessage` may append field details
 * to a 400. A message that matches nothing is returned untouched.
 */
export function refusalCopy(message: string, gender: Gender): string {
    if (message.includes('no rating for the mapped gender')) {
        return `That tee has no rating for ${genderLabel(gender).toLowerCase()} any more, so it cannot be chosen here. Rate it above, or pick another tee.`;
    }
    if (message.includes('must belong to the mapped course')) {
        return 'That tee is no longer one of this course’s tees. Reload the page to see the tees as they stand.';
    }
    return message;
}

/**
 * The resolution as a sentence, in the popover's voice: present tense, "today",
 * because the answer is about rounds started NOW and will change the moment a
 * cell above it changes.
 */
export function resolutionSentence(
    role: TeeRole,
    gender: Gender,
    resolution: Resolution,
): string {
    const who = `A ${role.displayName} / ${genderLabel(gender)} round`;
    switch (resolution.via) {
        case 'role':
            return `${who} plays from ${resolution.teeName} today.`;
        case 'club':
            return `${who} plays from ${resolution.teeName} today, taken from the Club row because this row is empty.`;
        case 'convention':
            return `${who} plays from ${resolution.teeName} today, picked by tee name because no row above applies.`;
        case 'none':
            return `${who} has no tee to start from — no tee on this course is rated for ${genderLabel(gender).toLowerCase()}.`;
    }
}
