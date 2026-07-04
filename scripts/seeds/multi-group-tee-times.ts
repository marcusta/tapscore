// Phase 3.5 seed — multi-group tee-times round.
//
// A whole-roster stableford round on Linköpings with 6 players split into 3
// playing groups of 2, tee times 8 minutes apart (09:00 / 09:08 / 09:16), all
// starting at the route head (hole 1) — the conventional (non-shotgun) case.
// The roster mixes REGISTERED pool players (erik, sara from the dev seed's
// friend pool) with GUEST players, so the round page shows both kinds of
// producer. Scores land in at least two different groups, at DIFFERENT
// depths, so each group's thru-N genuinely differs on the leaderboard:
//   - Group 1 (erik + guest Lasse): 9 holes each (thru 9).
//   - Group 2 (sara + guest Nina): 3 holes each (thru 3).
//   - Group 3 (guest Peter + guest Ulla): unscored (thru 0).
//
// Depends on the `linkopings` seed (course + tees) and the dev seed
// (erik/sara) having run first.

import type { Scenario } from '../scenario';
import type { RoundSetupDraft } from '../../server/domain/round-setup/draft';

export const MULTI_GROUP_TEE_TIMES_DATE = '2026-07-04';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    const course = await s.findCourse(linko.name, 'Linköpings Golfklubb 1-18');

    const existingGuest = (await s.services.guestPlayerService.list()).find(
        (g) => g.displayName === 'Lasse Gäst',
    );
    if (existingGuest) {
        // eslint-disable-next-line no-console
        console.log(`seed: multi-group-tee-times already present (guest ${existingGuest.id.slice(0, 8)})`);
        return;
    }

    const gulTee = (await s.services.teeService.listByCourse(course.id)).find((t) => t.name === 'Gul');
    if (!gulTee) throw new Error('seed: multi-group-tee-times expected Gul tee on Linköpings 1-18');

    const erik = await s.findPlayer('erik');
    const sara = await s.findPlayer('sara');

    const guestLasse = await s.guest('Lasse Gäst', { gender: 'M', handicap: 11 });
    const guestNina = await s.guest('Nina Gäst', { gender: 'F', handicap: 19 });
    const guestPeter = await s.guest('Peter Gäst', { gender: 'M', handicap: 24 });
    const guestUlla = await s.guest('Ulla Gäst', { gender: 'F', handicap: 28 });

    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: MULTI_GROUP_TEE_TIMES_DATE,
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'player', id: erik.id }, handicapIndex: 5.4, gender: 'M', teeId: gulTee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: guestLasse.id }, handicapIndex: 11, gender: 'M', teeId: gulTee.id },
            { producerDefId: 'p3', playerRef: { kind: 'player', id: sara.id }, handicapIndex: 12.7, gender: 'F', teeId: gulTee.id },
            { producerDefId: 'p4', playerRef: { kind: 'guest', id: guestNina.id }, handicapIndex: 19, gender: 'F', teeId: gulTee.id },
            { producerDefId: 'p5', playerRef: { kind: 'guest', id: guestPeter.id }, handicapIndex: 24, gender: 'M', teeId: gulTee.id },
            { producerDefId: 'p6', playerRef: { kind: 'guest', id: guestUlla.id }, handicapIndex: 28, gender: 'F', teeId: gulTee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
        playingGroups: [
            { members: ['p1', 'p2'], startTime: '09:00' },
            { members: ['p3', 'p4'], startTime: '09:08' },
            { members: ['p5', 'p6'], startTime: '09:16' },
        ],
    };

    const created = await s.services.friendlyRoundService.create(draft, null);
    if (!created.ok) {
        throw new Error(`seed: multi-group-tee-times round create failed: ${JSON.stringify(created.diagnostics)}`);
    }
    const { round, friendlyRound } = created;

    const bpRows = await s.services.db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', round.id)
        .select(['bp.producer_def_id', 'bp.ball_id'])
        .execute();
    const ballByProducer = new Map(bpRows.map((r) => [r.producer_def_id, r.ball_id]));
    const playHoleByCourseHole = new Map(round.playHoles.map((p) => [p.courseHoleNumber, p.id]));

    let evt = 0;
    async function scoreHoles(producerDefId: string, holes: number[], strokesByHole: number) {
        const ballId = ballByProducer.get(producerDefId)!;
        for (const hole of holes) {
            await s.services.scoreEventService.append({
                roundId: round.id,
                ballId,
                playHoleId: playHoleByCourseHole.get(hole)!,
                strokes: strokesByHole,
                eventType: 'score_entered',
                clientEventId: `multi-group-tt-${evt++}`,
            });
        }
    }

    // Group 1 (erik/p1, Lasse/p2) — thru 9.
    const front9 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    await scoreHoles('p1', front9, 4);
    await scoreHoles('p2', front9, 5);

    // Group 2 (sara/p3, Nina/p4) — thru 3.
    const first3 = [1, 2, 3];
    await scoreHoles('p3', first3, 4);
    await scoreHoles('p4', first3, 6);

    // Group 3 (Peter/p5, Ulla/p6) — unscored (thru 0).

    // eslint-disable-next-line no-console
    console.log(
        `seed: multi-group-tee-times created (round ${round.id.slice(0, 8)}, token ${friendlyRound.shareToken.slice(0, 8)}, ` +
            `3 groups @ 8-min intervals, group1 thru9, group2 thru3, group3 thru0)`,
    );
}
