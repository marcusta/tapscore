// Phase 4 Slice 6 seed — `competition-cut-after-r1`.
//
// A six-player individual stroke-play competition on Linköpings GK with a
// `top_n` cut (best 3 + ties) applied after round 1. Round 1 is fully scored
// and finished, the cut is APPLIED, and round 2 is materialised POST-CUT (only
// the survivors are on its roster; the wrapper is stamped `post_cut = true`)
// and PARTIALLY scored — so the verify page shows the cut line, the tie-at-the-
// line advancing, the demoted cut entries, and a live post-cut round.
//
// Round-1 gross (total = 71 + over), aggregation default (total gross):
//   Erik   78  (1st)
//   Sara   82  (2nd)
//   Johan  85  (T3) ┐ tie AT the line — both advance (golf tie rule)
//   Karin  85  (T3) ┘
//   Emil   86  (5th) ← notable miss: cut by a single stroke
//   Fia    90  (6th)
//
// top_n cutValue 3 → the line sits at position 3 (85). Everyone with position
// ≤ 3 advances, so FOUR players make a "top-3" cut (Erik, Sara, Johan, Karin);
// Emil and Fia are cut.
//
// Depends on `linkopings` and the dev seed (erik/sara/johan/karin).

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

const COMPETITION_NAME = 'Matchcup — cut efter runda 1';

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
        console.log(`seed: competition-cut-after-r1 already present (${existing.id.slice(0, 8)})`);
        return;
    }

    const courseId = await linkopingCourseId(s);
    const teeId = await gulTeeId(s);

    const owner = await s.findPlayer('bob');
    const erik = await s.findPlayer('erik');
    const sara = await s.findPlayer('sara');
    const johan = await s.findPlayer('johan');
    const karin = await s.findPlayer('karin');
    const emil = await ensureGuest(s, 'Emil Gäst', 'M', 9);
    const fia = await ensureGuest(s, 'Fia Gäst', 'F', 21);

    // --- Competition + defaults + cut rule -------------------------------------
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
        cutRules: { afterRound: 1, cutType: 'top_n', cutValue: 3 },
    });
    if (!updated.ok) throw new Error(`competition-cut-after-r1: config refused — ${updated.refusal.message}`);

    for (const ref of [
        { kind: 'player', id: erik.id } as const,
        { kind: 'player', id: sara.id } as const,
        { kind: 'player', id: johan.id } as const,
        { kind: 'player', id: karin.id } as const,
        { kind: 'guest', id: emil.id } as const,
        { kind: 'guest', id: fia.id } as const,
    ]) {
        const added = await services.competitionService.addParticipant({
            competitionId: comp.id,
            playerRef: ref,
        });
        if (!added.ok) throw new Error(`competition-cut-after-r1: addParticipant refused — ${added.refusal.message}`);
    }

    const toSetup = await services.competitionService.transition(comp.id, 'setup');
    if (!toSetup.ok) throw new Error(`competition-cut-after-r1: setup transition refused — ${toSetup.refusal.message}`);

    // --- Round 1 ---------------------------------------------------------------
    const r1 = await services.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId,
        playedAt: '2026-07-11',
        roundType: 'full_18',
        createdByPlayerId: owner.id,
    });
    if (!r1.ok) throw new Error(`competition-cut-after-r1: R1 materialise failed — ${JSON.stringify(r1)}`);

    const toActive = await services.competitionService.transition(comp.id, 'active');
    if (!toActive.ok) throw new Error(`competition-cut-after-r1: active transition refused — ${toActive.refusal.message}`);

    await scoreCompetitionRound(services, r1.shareToken, {
        'Erik Ekström': cardForOver(7), // 78
        'Sara Sjöberg': cardForOver(11), // 82
        'Johan Johansson': cardForOver(14), // 85 (T3)
        'Karin Karlsson': cardForOver(14), // 85 (T3)
        'Emil Gäst': cardForOver(15), // 86 (cut by one)
        'Fia Gäst': cardForOver(19), // 90
    });
    await finishCompetitionRound(services, r1.shareToken, '2026-07-11T18:00:00Z');

    // --- Apply the cut ---------------------------------------------------------
    const cut = await services.competitionCutService.applyCut({
        competitionId: comp.id,
        appliedByPlayerId: owner.id,
    });
    if (!cut.ok) throw new Error(`competition-cut-after-r1: applyCut refused — ${cut.refusal.message}`);

    // --- Round 2 (materialises POST-CUT — roster = survivors only) -------------
    const r2 = await services.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId,
        playedAt: '2026-07-12',
        roundType: 'full_18',
        createdByPlayerId: owner.id,
    });
    if (!r2.ok) throw new Error(`competition-cut-after-r1: R2 materialise failed — ${JSON.stringify(r2)}`);

    // Round 2 in progress: the three survivors playing are all thru 9 (an
    // apples-to-apples live board at 27 holes), Karin has not teed off yet.
    // Front-9 partial gross: Erik 38, Sara 41, Johan 44 — the R1 order holds.
    await scoreCompetitionRound(services, r2.shareToken, {
        'Erik Ekström': cardForOver(3).slice(0, 9), // thru 9 → 38
        'Sara Sjöberg': cardForOver(6).slice(0, 9), // thru 9 → 41
        'Johan Johansson': cardForOver(9).slice(0, 9), // thru 9 → 44
        // Karin left unscored → a 'missing' R2 cell (survivor yet to start R2).
    });
    // R2 deliberately NOT finished — it is live/in-progress.

    // eslint-disable-next-line no-console
    console.log(
        `seed: competition-cut-after-r1 created (${comp.id.slice(0, 8)}, cut applied, R2 post_cut=${r2.competitionRound.postCut})`,
    );
}
