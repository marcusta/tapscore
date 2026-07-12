// Phase 4 Slice 6 seed — `competition-round-points`.
//
// A two-round Stableford competition on Linköpings GK aggregated by
// `round_points_sum` (sum the per-round `points` metric; highest total wins).
// Round 1 is materialised straight from the defaults (singles Stableford,
// 100% allowance). Round 2 is materialised and then EDITED through the
// round-edit path to a DIFFERENT Saturday setup — singles Stableford at a
// reduced 85% allowance — the concrete "different round settings per round"
// override (PHASES.md Phase 4 design decision #1): the competition default is
// copied into the round, then the admin overrides that round's own draft
// without touching the competition document. Both rounds are scored and
// finished, then the competition is FINALIZED so the verify page can show the
// immutable official results next to the still-live aggregate.
//
// The 85% override is visible in the reused round-leaderboard header
// (`Stableford @ 85%` vs round 1's `@ 100%`) and provably rode the edit path
// (a `setup_edit` draft version bump on round 2).
//
// Depends on `linkopings` and the dev seed (erik/sara/johan).

import type { Scenario } from '../scenario';
import type { RoundSetupDraft } from '../../server/domain/round-setup/draft';
import { registerBuiltInAggregationStrategies } from '../../server/domain/aggregation';
import {
    cardForOver,
    ensureGuest,
    gulTeeId,
    linkopingCourseId,
    scoreCompetitionRound,
    finishCompetitionRound,
} from '../competition-seed-lib';

const COMPETITION_NAME = 'Poängbogey-helg (round points)';

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
        console.log(`seed: competition-round-points already present (${existing.id.slice(0, 8)})`);
        return;
    }

    const courseId = await linkopingCourseId(s);
    const teeId = await gulTeeId(s);

    const owner = await s.findPlayer('bob');
    const erik = await s.findPlayer('erik');
    const sara = await s.findPlayer('sara');
    const johan = await s.findPlayer('johan');
    const greta = await ensureGuest(s, 'Greta Gäst', 'F', 16);

    // --- Competition + defaults + aggregation ----------------------------------
    const comp = await services.competitionService.create({
        name: COMPETITION_NAME,
        ownerPlayerId: owner.id,
    });
    const updated = await services.competitionService.update({
        id: comp.id,
        defaultConfig: {
            slots: [{ formatId: 'stableford_individual' }], // 100% default
            fallbackTee: { teeId },
        },
        aggregation: { strategyId: 'round_points_sum', config: {} }, // metric 'points'
    });
    if (!updated.ok) throw new Error(`competition-round-points: config refused — ${updated.refusal.message}`);

    for (const ref of [
        { kind: 'player', id: erik.id } as const,
        { kind: 'player', id: sara.id } as const,
        { kind: 'player', id: johan.id } as const,
        { kind: 'guest', id: greta.id } as const,
    ]) {
        const added = await services.competitionService.addParticipant({
            competitionId: comp.id,
            playerRef: ref,
        });
        if (!added.ok) throw new Error(`competition-round-points: addParticipant refused — ${added.refusal.message}`);
    }

    const toSetup = await services.competitionService.transition(comp.id, 'setup');
    if (!toSetup.ok) throw new Error(`competition-round-points: setup transition refused — ${toSetup.refusal.message}`);

    // --- Round 1 (Friday — straight from the defaults, 100%) -------------------
    const r1 = await services.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId,
        playedAt: '2026-07-11',
        roundType: 'full_18',
        createdByPlayerId: owner.id,
    });
    if (!r1.ok) throw new Error(`competition-round-points: R1 materialise failed — ${JSON.stringify(r1)}`);

    const toActive = await services.competitionService.transition(comp.id, 'active');
    if (!toActive.ok) throw new Error(`competition-round-points: active transition refused — ${toActive.refusal.message}`);

    await scoreCompetitionRound(services, r1.shareToken, {
        'Erik Ekström': cardForOver(8), // 79
        'Sara Sjöberg': cardForOver(12), // 83
        'Johan Johansson': cardForOver(18), // 89
        'Greta Gäst': cardForOver(15), // 86
    });
    await finishCompetitionRound(services, r1.shareToken, '2026-07-11T18:00:00Z');

    // --- Round 2 (Saturday — materialise, then override to 85% via round-edit) -
    const r2 = await services.competitionRoundService.materialise({
        competitionId: comp.id,
        courseId,
        playedAt: '2026-07-12',
        roundType: 'full_18',
        createdByPlayerId: owner.id,
    });
    if (!r2.ok) throw new Error(`competition-round-points: R2 materialise failed — ${JSON.stringify(r2)}`);

    // The override: copy the round's OWN draft and reduce the Stableford
    // allowance to 85% for Saturday. Edited BEFORE any score lands, through the
    // exact same wizard path a competition admin would use.
    const editedDraft: RoundSetupDraft = {
        ...r2.draft,
        formats: [
            { formatId: 'stableford_individual', allowanceConfig: { type: 'flat', pct: 85 } },
        ],
    };
    const edit = await services.roundEditService.editByToken({
        token: r2.shareToken,
        draft: editedDraft,
        recordedByPlayerId: owner.id,
        clientEventId: `comp-round-points-r2-override-${comp.id}`,
    });
    if (!edit) throw new Error('competition-round-points: R2 edit token not found');
    if (!edit.ok) {
        throw new Error(
            `competition-round-points: R2 override refused — ${edit.diagnostics.map((d) => d.message).join('; ')}`,
        );
    }

    await scoreCompetitionRound(services, r2.shareToken, {
        'Erik Ekström': cardForOver(9), // 80
        'Sara Sjöberg': cardForOver(11), // 82
        'Johan Johansson': cardForOver(16), // 87
        'Greta Gäst': cardForOver(14), // 85
    });
    await finishCompetitionRound(services, r2.shareToken, '2026-07-12T18:00:00Z');

    // --- Finalize — freezes competition_results ---------------------------------
    const finalized = await services.competitionFinalizeService.finalize({
        competitionId: comp.id,
        finalizedByPlayerId: owner.id,
    });
    if (!finalized.ok) throw new Error(`competition-round-points: finalize refused — ${finalized.refusal.message}`);

    // eslint-disable-next-line no-console
    console.log(
        `seed: competition-round-points created (${comp.id.slice(0, 8)}, finalized, ${finalized.value.rowCount} result rows)`,
    );
}
