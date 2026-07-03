// Phase 3 seed — score-event attribution.
//
// A FriendlyRound created by a logged-in player (`creator_player_id` set on
// the wrapper). Two registered players play; one of them (Hedvig) acts as
// the on-course scorer for BOTH balls for the front 9 — those score_events
// carry `recorded_by_player_id` = Hedvig's id. The back 9 is entered by
// whoever is holding the phone with no session (the anonymous token-write
// path) — those events carry `recorded_by_player_id = null`. Same round,
// same balls: the contrast is per-event, not per-player.
//
// Depends on the `linkopings` seed having run first.

import type { Scenario } from '../scenario';
import type { RoundSetupDraft } from '../../server/domain/round-setup/draft';

export const ATTRIBUTED_SCORING_CREATOR_USERNAME = 'hedvig-scorer';
export const ATTRIBUTED_SCORING_OTHER_USERNAME = 'oskar-attributed';

export async function apply(s: Scenario): Promise<void> {
    const existing = (await s.services.playerService.list()).find(
        (p) => p.username === ATTRIBUTED_SCORING_CREATOR_USERNAME,
    );
    if (existing) {
        // eslint-disable-next-line no-console
        console.log(`seed: attributed-scoring already present (player ${existing.id.slice(0, 8)})`);
        return;
    }

    const linko = await s.findClub('Linköpings Golfklubb');
    const course = await s.findCourse(linko.name, 'Linköpings Golfklubb 1-18');
    const gulTee = (await s.services.teeService.listByCourse(course.id)).find((t) => t.name === 'Gul');
    if (!gulTee) throw new Error('seed: attributed-scoring expected Gul tee on Linköpings 1-18');

    const hedvig = await s.services.playerService.selfRegister({
        username: ATTRIBUTED_SCORING_CREATOR_USERNAME,
        password: 'password123',
        displayName: 'Hedvig Bergqvist',
        handicapIndex: 11.2,
    });
    const oskar = await s.services.playerService.selfRegister({
        username: ATTRIBUTED_SCORING_OTHER_USERNAME,
        password: 'password123',
        displayName: 'Oskar Nilsson',
        handicapIndex: 9.8,
    });

    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: '2026-06-25',
        producers: [
            {
                producerDefId: 'p1',
                playerRef: { kind: 'player', id: hedvig.id },
                handicapIndex: 11.2,
                gender: 'F',
                teeId: gulTee.id,
            },
            {
                producerDefId: 'p2',
                playerRef: { kind: 'player', id: oskar.id },
                handicapIndex: 9.8,
                gender: 'M',
                teeId: gulTee.id,
            },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };

    // creator_player_id = Hedvig — she's the logged-in creator of this
    // FriendlyRound (Phase 3: `creatorPlayerId` becomes meaningful).
    const created = await s.services.friendlyRoundService.create(draft, hedvig.id);
    if (!created.ok) {
        throw new Error(`seed: attributed-scoring round create failed: ${JSON.stringify(created.diagnostics)}`);
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

    const frontNine = [4, 5, 3, 4, 3, 5, 3, 4, 4];
    const backNine = [4, 4, 5, 3, 4, 3, 5, 4, 5];

    let evt = 0;
    for (const producerDefId of ['p1', 'p2'] as const) {
        const ballId = ballByProducer.get(producerDefId)!;

        // Front 9 — Hedvig is the logged-in scorer recording for both balls.
        for (let i = 0; i < frontNine.length; i++) {
            const hole = i + 1;
            await s.services.scoreEventService.append({
                roundId: round.id,
                ballId,
                playHoleId: playHoleByCourseHole.get(hole)!,
                strokes: frontNine[i]!,
                eventType: 'score_entered',
                recordedByPlayerId: hedvig.id,
                clientEventId: `attributed-scoring-${evt++}`,
            });
        }

        // Back 9 — anonymous token write, no session: recordedByPlayerId null.
        for (let i = 0; i < backNine.length; i++) {
            const hole = i + 10;
            await s.services.scoreEventService.append({
                roundId: round.id,
                ballId,
                playHoleId: playHoleByCourseHole.get(hole)!,
                strokes: backNine[i]!,
                eventType: 'score_entered',
                recordedByPlayerId: null,
                clientEventId: `attributed-scoring-${evt++}`,
            });
        }
    }

    // eslint-disable-next-line no-console
    console.log(
        `seed: attributed-scoring created (round ${round.id.slice(0, 8)}, token ${friendlyRound.shareToken.slice(0, 8)}, ` +
            `creator ${hedvig.id.slice(0, 8)}, front-9 recorded_by=Hedvig, back-9 recorded_by=null)`,
    );
}
