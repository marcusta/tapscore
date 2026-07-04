// Phase 3.5 seed — shotgun start (multi-group, rotated itineraries).
//
// A whole-roster stableford round on Linköpings with 4 players split into 2
// groups, BOTH starting at the same time (shotgun) but on DIFFERENT holes —
// group 1 on hole 1 (the conventional route head), group 2 on hole 10. Group
// 2's played order therefore reads 10, 11, …, 18, 1, …, 9 — the itinerary
// rotated to its start occurrence, proving the rotation is visible on the
// round page. Both groups are partially scored (different depths) so the
// leaderboard's thru-N is genuinely per-group.
//
// Depends on the `linkopings` seed (course + tees) having run first.

import type { Scenario } from '../scenario';
import type { RoundSetupDraft } from '../../server/domain/round-setup/draft';

export const MULTI_GROUP_SHOTGUN_DATE = '2026-07-04';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    const course = await s.findCourse(linko.name, 'Linköpings Golfklubb 1-18');

    const existingGuest = (await s.services.guestPlayerService.list()).find(
        (g) => g.displayName === 'Anna Shotgun',
    );
    if (existingGuest) {
        // eslint-disable-next-line no-console
        console.log(`seed: multi-group-shotgun already present (guest ${existingGuest.id.slice(0, 8)})`);
        return;
    }

    const gulTee = (await s.services.teeService.listByCourse(course.id)).find((t) => t.name === 'Gul');
    if (!gulTee) throw new Error('seed: multi-group-shotgun expected Gul tee on Linköpings 1-18');

    const guestAnna = await s.guest('Anna Shotgun', { gender: 'F', handicap: 14 });
    const guestBjorn = await s.guest('Björn Shotgun', { gender: 'M', handicap: 9 });
    const guestCarin = await s.guest('Carin Shotgun', { gender: 'F', handicap: 21 });
    const guestDavid = await s.guest('David Shotgun', { gender: 'M', handicap: 17 });

    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: MULTI_GROUP_SHOTGUN_DATE,
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: guestAnna.id }, handicapIndex: 14, gender: 'F', teeId: gulTee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: guestBjorn.id }, handicapIndex: 9, gender: 'M', teeId: gulTee.id },
            { producerDefId: 'p3', playerRef: { kind: 'guest', id: guestCarin.id }, handicapIndex: 21, gender: 'F', teeId: gulTee.id },
            { producerDefId: 'p4', playerRef: { kind: 'guest', id: guestDavid.id }, handicapIndex: 17, gender: 'M', teeId: gulTee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
        // Shotgun: same start time, different start holes — group 2's
        // itinerary rotates to begin at hole 10.
        playingGroups: [
            { members: ['p1', 'p2'], startTime: '08:00', startHole: 1 },
            { members: ['p3', 'p4'], startTime: '08:00', startHole: 10 },
        ],
    };

    const created = await s.services.friendlyRoundService.create(draft, null);
    if (!created.ok) {
        throw new Error(`seed: multi-group-shotgun round create failed: ${JSON.stringify(created.diagnostics)}`);
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
                clientEventId: `multi-group-shotgun-${evt++}`,
            });
        }
    }

    // Group 1 (Anna/p1, Björn/p2) starts on hole 1 — score its first 5 holes
    // in played order (1..5) → thru 5.
    await scoreHoles('p1', [1, 2, 3, 4, 5], 4);
    await scoreHoles('p2', [1, 2, 3, 4, 5], 4);

    // Group 2 (Carin/p3, David/p4) starts on hole 10 — score its first 2
    // holes in PLAYED order (course holes 10, 11) → thru 2, a different
    // depth than group 1, on physically different holes.
    await scoreHoles('p3', [10, 11], 5);
    await scoreHoles('p4', [10, 11], 5);

    // eslint-disable-next-line no-console
    console.log(
        `seed: multi-group-shotgun created (round ${round.id.slice(0, 8)}, token ${friendlyRound.shareToken.slice(0, 8)}, ` +
            `group1 starts hole 1 (thru 5), group2 starts hole 10 (thru 2, rotated order 10..18,1..9))`,
    );
}
