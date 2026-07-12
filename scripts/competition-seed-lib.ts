// Phase 4 Slice 6 — shared helpers for the three competition verify-seeds
// (`competition-36-stroke`, `competition-cut-after-r1`, `competition-round-points`).
//
// These seeds drive the REAL competition service stack (create → roster →
// materialise → score → finish → cut/finalize) rather than the friendly
// scenario builder, because a Competition materialises its rounds through its
// OWN machinery (CompetitionRoundService.materialise → FriendlyRoundService.create).
// The helpers here are the thin glue the seeds share: idempotent people, a
// deterministic 18-hole card generator with an exact total, token-scoped
// scoring, and the round-finish call.
//
// Like the Phase 3.5 seeds these are DEV-DB fixtures, NOT format-fixture-oracle
// seeds — they are absent from `MANUAL_FORMAT_SEEDS`, so `seed:formats` /
// `check:format-fixtures` never see them (the 15-round oracle stays untouched).

import type { Scenario } from './scenario';
import type { createServices } from '../server/services/index';

type Services = ReturnType<typeof createServices>;

/** Linköpings GK 1-18 pars (the `linkopings` seed's course) — total 71. */
export const LINKOPING_PARS = [
    4, 4, 3, 5, 3, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4,
] as const;
export const LINKOPING_PAR = LINKOPING_PARS.reduce((a, b) => a + b, 0); // 71

/**
 * An 18-hole gross scorecard whose strokes sum to EXACTLY `LINKOPING_PAR + over`.
 * `over` strokes are spread across the round (one per hole from the head, then
 * a second lap if `over > 18`), so the card reads like a real "mostly bogeys"
 * scorecard and the total is trivially `71 + over` — the number the reviewer
 * checks by eye against the aggregated board. Deterministic; no randomness.
 */
export function cardForOver(over: number): number[] {
    const base = Math.floor(over / 18);
    const remainder = over % 18;
    return LINKOPING_PARS.map((par, i) => par + base + (i < remainder ? 1 : 0));
}

/** The gross total a `cardForOver(over)` card sums to (== 71 + over). */
export function totalForOver(over: number): number {
    return LINKOPING_PAR + over;
}

/**
 * Find-or-create a guest by display name (idempotent — the seed re-run guard
 * lives in each seed, but guests are addressed by name so this stays safe).
 */
export async function ensureGuest(
    s: Scenario,
    displayName: string,
    gender: 'M' | 'F',
    handicapIndex: number,
): Promise<{ id: string; displayName: string }> {
    const ref = await s.guest(displayName, { gender, handicap: handicapIndex });
    return { id: ref.id, displayName: ref.displayName };
}

/**
 * Resolve the Gul tee id on Linköpings GK 1-18 (seeded by `linkopings`). Gul
 * carries both an M and an F rating, so a mixed-gender roster resolves off the
 * single fallback tee.
 */
export async function gulTeeId(s: Scenario): Promise<string> {
    const club = await s.findClub('Linköpings Golfklubb');
    const course = await s.findCourse(club.name, 'Linköpings Golfklubb 1-18');
    const tee = (await s.services.teeService.listByCourse(course.id)).find(
        (t) => t.name === 'Gul',
    );
    if (!tee) throw new Error('competition seed: Gul tee not found on Linköpings 1-18');
    return tee.id;
}

export async function linkopingCourseId(s: Scenario): Promise<string> {
    const club = await s.findClub('Linköpings Golfklubb');
    const course = await s.findCourse(club.name, 'Linköpings Golfklubb 1-18');
    return course.id;
}

/**
 * Score a materialised competition round through the EXISTING token-scoped
 * score path (the same door the round UI uses). `cardsByName` maps a producer's
 * snapshot display name → its per-hole gross card; a shorter card scores only
 * that many holes (a partial "thru N" round), and an omitted name stays
 * unscored (a `missing` cell on the aggregate). Holes are taken in the round's
 * played order.
 */
export async function scoreCompetitionRound(
    services: Services,
    token: string,
    cardsByName: Record<string, number[]>,
): Promise<void> {
    const found = await services.friendlyRoundService.findByToken(token);
    const balls = await services.friendlyRoundService.ballsByToken(token);
    if (!found || !balls) throw new Error(`competition seed: round not found for token ${token}`);
    const playedOrder = found.round.playingGroups[0]!.playedOrder;
    for (const ball of balls) {
        const name = ball.players[0]!.displayName;
        const card = cardsByName[name];
        if (!card) continue; // unscored participant → stays 'missing'
        for (let i = 0; i < card.length; i++) {
            const hole = playedOrder[i];
            if (!hole) break;
            const res = await services.friendlyRoundService.appendScoreByToken({
                token,
                ballId: ball.id,
                playHoleId: hole.playHoleId,
                strokes: card[i]!,
                eventType: 'score_entered',
                clientEventId: `comp-${token}-${ball.id}-${i}`,
            });
            if (!res) throw new Error('competition seed: score append failed');
        }
    }
}

/** Finish a materialised round (organizational — friendly rounds never lock). */
export async function finishCompetitionRound(
    services: Services,
    token: string,
    now: string,
): Promise<void> {
    const res = await services.friendlyRoundService.finishByToken(token, now);
    if (!res) throw new Error(`competition seed: finish failed for token ${token}`);
}
