// Phase 3 seed — guest-claim contrast.
//
// A FriendlyRound on Linköpings with two GUEST producers. One guest (Frida)
// later registers an account and claims her own participation — the seed
// runs the REAL `GuestClaimService.claimGuest` (token-scoped), not a
// hand-written row flip, so `ball_players` is genuinely re-keyed to
// `player_id`, `display_name_snapshot` stays frozen at "Frida Gäst", and the
// `guest_players` tombstone gets `claimed_by_player_id` / `claimed_at`
// stamped. The other guest (Örjan) is left UNCLAIMED for contrast — his
// `ball_players` row still points at `guest_player_id` and his tombstone
// fields stay null.
//
// Depends on the `linkopings` seed having run first.

import type { Scenario } from '../scenario';
import type { RoundSetupDraft } from '../../server/domain/round-setup/draft';

export const GUEST_CLAIM_CLAIMED_USERNAME = 'frida-claimed';
export const GUEST_CLAIM_UNCLAIMED_GUEST_NAME = 'Örjan Gäst';

export async function apply(s: Scenario): Promise<void> {
    const existingPlayer = (await s.services.playerService.list()).find(
        (p) => p.username === GUEST_CLAIM_CLAIMED_USERNAME,
    );
    if (existingPlayer) {
        // eslint-disable-next-line no-console
        console.log(`seed: guest-claim already present (player ${existingPlayer.id.slice(0, 8)})`);
        return;
    }

    const linko = await s.findClub('Linköpings Golfklubb');
    const course = await s.findCourse(linko.name, 'Linköpings Golfklubb 1-18');
    const gulTee = (await s.services.teeService.listByCourse(course.id)).find((t) => t.name === 'Gul');
    if (!gulTee) throw new Error('seed: guest-claim expected Gul tee on Linköpings 1-18');

    // Two guest producers — both play the FriendlyRound as guests.
    const guestFrida = await s.services.guestPlayerService.create({
        displayName: 'Frida Gäst',
        gender: 'F',
        handicapIndex: 15,
    });
    const guestOrjan = await s.services.guestPlayerService.create({
        displayName: GUEST_CLAIM_UNCLAIMED_GUEST_NAME,
        gender: 'M',
        handicapIndex: 22,
    });

    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: '2026-06-20',
        producers: [
            {
                producerDefId: 'p1',
                playerRef: { kind: 'guest', id: guestFrida.id },
                handicapIndex: 15,
                gender: 'F',
                teeId: gulTee.id,
            },
            {
                producerDefId: 'p2',
                playerRef: { kind: 'guest', id: guestOrjan.id },
                handicapIndex: 22,
                gender: 'M',
                teeId: gulTee.id,
            },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };

    const created = await s.services.friendlyRoundService.create(draft, null);
    if (!created.ok) {
        throw new Error(`seed: guest-claim round create failed: ${JSON.stringify(created.diagnostics)}`);
    }
    const { round, friendlyRound } = created;

    // Score both guests' balls (front 9) as anonymous token writes — the
    // trust-based path, no recordedByPlayerId, matching real on-course usage
    // before either guest ever creates an account.
    const bpRows = await s.services.db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', round.id)
        .select(['bp.producer_def_id', 'bp.ball_id'])
        .execute();
    const ballByProducer = new Map(bpRows.map((r) => [r.producer_def_id, r.ball_id]));
    const playHoleByCourseHole = new Map(round.playHoles.map((p) => [p.courseHoleNumber, p.id]));

    let evt = 0;
    for (const [producerDefId, strokes] of [
        ['p1', [5, 4, 4, 6, 3, 6, 3, 5, 5]],
        ['p2', [6, 6, 5, 7, 4, 7, 4, 6, 6]],
    ] as const) {
        const ballId = ballByProducer.get(producerDefId)!;
        for (let i = 0; i < strokes.length; i++) {
            const hole = i + 1;
            await s.services.scoreEventService.append({
                roundId: round.id,
                ballId,
                playHoleId: playHoleByCourseHole.get(hole)!,
                strokes: strokes[i]!,
                eventType: 'score_entered',
                clientEventId: `guest-claim-${evt++}`,
            });
        }
    }

    // Frida registers an account (with her own current index) and claims her
    // own guest participation — the real one-time flip.
    const fridaPlayer = await s.services.playerService.selfRegister({
        username: GUEST_CLAIM_CLAIMED_USERNAME,
        password: 'password123',
        displayName: 'Frida Andersson',
        handicapIndex: 15,
    });

    await s.services.guestClaimService.claimGuest({
        token: friendlyRound.shareToken,
        guestPlayerId: guestFrida.id,
        playerId: fridaPlayer.id,
    });

    // eslint-disable-next-line no-console
    console.log(
        `seed: guest-claim created (round ${round.id.slice(0, 8)}, token ${friendlyRound.shareToken.slice(0, 8)}, ` +
            `claimed player ${fridaPlayer.id.slice(0, 8)}, unclaimed guest ${guestOrjan.id.slice(0, 8)})`,
    );
}
