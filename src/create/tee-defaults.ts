import type { CourseTeeRole, Tee } from '../api/setup.gen';
import type { Gender } from './setup.service';

type TeeClass =
    | { kind: 'numeric'; length: number }
    | { kind: 'colour'; rank: number }
    | { kind: 'other' };

const COLOUR_RANK: Record<string, number> = {
    svart: 0,
    black: 0,
    vit: 1,
    white: 1,
    gul: 2,
    yellow: 2,
    'blå': 3,
    bla: 3,
    blue: 3,
    'röd': 4,
    rod: 4,
    red: 4,
    orange: 5,
};

function classify(tee: Tee): TeeClass {
    const name = tee.name.trim().toLocaleLowerCase('sv-SE');
    const colour = tee.colour?.trim().toLocaleLowerCase('sv-SE') ?? '';
    const word = name.split(/\s+/)[0] ?? '';
    const rank = COLOUR_RANK[name] ?? COLOUR_RANK[word] ?? COLOUR_RANK[colour];
    if (rank !== undefined) return { kind: 'colour', rank };

    const numeric = /^(\d+(?:[.,]\d+)?)\s*(?:m)?$/i.exec(name);
    if (numeric) return { kind: 'numeric', length: Number(numeric[1]!.replace(',', '.')) };
    return { kind: 'other' };
}

/** Swedish/numeric tee ordering, shared by the round defaults and row pickers. */
export function sortTees(tees: Tee[]): Tee[] {
    return tees
        .map((tee, index) => ({ tee, index, classification: classify(tee) }))
        .sort((a, b) => {
            const kindOrder = { numeric: 0, colour: 1, other: 2 } as const;
            if (a.classification.kind !== b.classification.kind)
                return kindOrder[a.classification.kind] - kindOrder[b.classification.kind];
            if (a.classification.kind === 'numeric' && b.classification.kind === 'numeric')
                return b.classification.length - a.classification.length || a.index - b.index;
            if (a.classification.kind === 'colour' && b.classification.kind === 'colour')
                return a.classification.rank - b.classification.rank || a.index - b.index;
            return (
                a.tee.name.localeCompare(b.tee.name, 'sv-SE', { sensitivity: 'base' }) ||
                a.index - b.index
            );
        })
        .map(({ tee }) => tee);
}

function hasRating(tee: Tee, gender: Gender): boolean {
    return tee.ratings.some((rating) => rating.gender === gender);
}

function mappedTee(
    tees: Tee[],
    mappings: CourseTeeRole[],
    roleKey: string,
    gender: Gender,
): Tee | null {
    const teeId = mappings.find((mapping) => mapping.roleKey === roleKey && mapping.gender === gender)?.teeId;
    const tee = tees.find((candidate) => candidate.id === teeId);
    return tee && hasRating(tee, gender) ? tee : null;
}

/**
 * The documented resolution chain for one round default.  A course role is
 * authoritative when present; Swedish colours only fill incomplete course
 * data, and the final rated tee keeps the flow usable for unfamiliar naming.
 */
export function resolveDefaultTee(
    tees: Tee[],
    mappings: CourseTeeRole[],
    gender: Gender,
    preferredRoleKey: string | null = null,
): string {
    const roles = [preferredRoleKey, 'club'].filter(
        (role, index, all): role is string => !!role && all.indexOf(role) === index,
    );
    for (const role of roles) {
        const tee = mappedTee(tees, mappings, role, gender);
        if (tee) return tee.id;
    }

    const targetRank = gender === 'M' ? 2 : 4;
    const orderedRated = sortTees(tees.filter((tee) => hasRating(tee, gender)));
    const convention = orderedRated.find((tee) => {
        const c = classify(tee);
        return c.kind === 'colour' && c.rank === targetRank;
    });
    if (convention) return convention.id;

    // Numeric-only courses follow the familiar long-to-short convention.
    if (orderedRated.length === 0) return '';
    if (orderedRated.every((tee) => classify(tee).kind === 'numeric'))
        return gender === 'M' ? orderedRated[0]!.id : orderedRated.at(-1)!.id;
    return orderedRated.at(-1)!.id;
}
