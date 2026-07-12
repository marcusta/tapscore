// Phase 4 Slice 6 seed — `competition-36-stroke`.
//
// A 36-hole (2 × 18) individual stroke-play club championship on Linköpings GK,
// aggregated by the documented default (total gross across rounds, lowest
// wins). Five-player field (four registered pool players + one guest), varied
// handicaps so the NET board reorders the GROSS board. Both rounds fully scored
// and finished; the competition stays ACTIVE (not finalized) so the verify page
// exercises the LIVE aggregate arithmetic (R1 + R2 = total) and the gross/net
// split off the same per-round results.
//
// Gross round totals (hand-set via cardForOver; total = 71 + over):
//   Erik   R1 82  R2 78  → 160   ┐ tie at 160 → share position 1
//   Sara   R1 80  R2 80  → 160   ┘
//   Johan  R1 85  R2 79  → 164
//   Karin  R1 88  R2 84  → 172
//   Gunnar R1 90  R2 86  → 176
//
// Depends on `linkopings` (course + Gul tee) and the dev seed (erik/sara/johan/
// karin, each with gender + handicap on their profile).

import type { Scenario } from '../scenario';
import { registerBuiltInAggregationStrategies } from '../../server/domain/aggregation';
import {
    cardForOver,
    ensureGuest,
    gulTeeId,
    linkopingCourseId,
    scoreCompetitionRound,
    finishCompetitionRound,
} from '../competition-seed-lib';

const COMPETITION_NAME = 'Klubbmästerskap 36-hål (stroke)';

export async function apply(s: Scenario): Promise<void> {
    registerBuiltInAggregationStrategies();
    const services = s.services;

    const existing = await services.db
        .selectFrom('competitions')
        .select('id')
        .where('name', '=', COMPETITION_NAME)
        .executeTakeFirst();
    if (existing) {
        // eslint-disable-next-line no-console
        console.log(`seed: competition-36-stroke already present (${existing.id.slice(0, 8)})`);
        return;
    }

    const courseId = await linkopingCourseId(s);
    const teeId = await gulTeeId(s);

    const owner = await s.findPlayer('bob'); // owner only, not on the roster
    const erik = await s.findPlayer('erik');
    const sara = await s.findPlayer('sara');
    const johan = await s.findPlayer('johan');
    const karin = await s.findPlayer('karin');
    const gunnar = await ensureGuest(s, 'Gunnar Gäst', 'M', 15);

    // --- Competition + defaults ------------------------------------------------
    const comp = await services.competitionService.create({
        name: COMPETITION_NAME,
        ownerPlayerId: owner.id,
    });
    const updated = await services.competitionService.update({
        id: comp.id,
        defaultConfig: {
            slots: [{ formatId: 'stroke_play_individual' }],
            fallbackTee: { teeId },
        },
        // aggregation left unset → the documented default (total gross).
    });
    if (!updated.ok) throw new Error(`competition-36-stroke: config refused — ${updated.refusal.message}`);

    for (const ref of [
        { kind: 'player', id: erik.id } as const,
        { kind: 'player', id: sara.id } as const,
        { kind: 'player', id: johan.id } as const,
        { kind: 'player', id: karin.id } as const,
        { kind: 'guest', id: gunnar.id } as const,
    ]) {
        const added = await services.competitionService.addParticipant({
            competitionId: comp.id,
            playerRef: ref,
        });
        if (!added.ok) throw new Error(`competition-36-stroke: addParticipant refused — ${added.refusal.message}`);
    }

    const toSetup = await services.competitionService.transition(comp.id, 'setup');
    if (!toSetup.ok) throw new Error(`competition-36-stroke: setup transition refused — ${toSetup.refusal.message}`);

    // --- Round 1 (materialise in setup, then activate) -------------------------
    const r1 = await services.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId,
        playedAt: '2026-07-11',
        roundType: 'full_18',
        createdByPlayerId: owner.id,
    });
    if (!r1.ok) throw new Error(`competition-36-stroke: R1 materialise failed — ${JSON.stringify(r1)}`);

    const toActive = await services.competitionService.transition(comp.id, 'active');
    if (!toActive.ok) throw new Error(`competition-36-stroke: active transition refused — ${toActive.refusal.message}`);

    await scoreCompetitionRound(services, r1.shareToken, {
        'Erik Ekström': cardForOver(11), // 82
        'Sara Sjöberg': cardForOver(9), // 80
        'Johan Johansson': cardForOver(14), // 85
        'Karin Karlsson': cardForOver(17), // 88
        'Gunnar Gäst': cardForOver(19), // 90
    });
    await finishCompetitionRound(services, r1.shareToken, '2026-07-11T18:00:00Z');

    // --- Round 2 (materialise while active) ------------------------------------
    const r2 = await services.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId,
        playedAt: '2026-07-12',
        roundType: 'full_18',
        createdByPlayerId: owner.id,
    });
    if (!r2.ok) throw new Error(`competition-36-stroke: R2 materialise failed — ${JSON.stringify(r2)}`);

    await scoreCompetitionRound(services, r2.shareToken, {
        'Erik Ekström': cardForOver(7), // 78 → 160
        'Sara Sjöberg': cardForOver(9), // 80 → 160 (tie)
        'Johan Johansson': cardForOver(8), // 79 → 164
        'Karin Karlsson': cardForOver(13), // 84 → 172
        'Gunnar Gäst': cardForOver(15), // 86 → 176
    });
    await finishCompetitionRound(services, r2.shareToken, '2026-07-12T18:00:00Z');

    // Competition deliberately LEFT active (not finalized).
    // eslint-disable-next-line no-console
    console.log(`seed: competition-36-stroke created (${comp.id.slice(0, 8)}, 2 rounds, active)`);
}
