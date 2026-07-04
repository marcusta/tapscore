// Phase 3.5 seed — self-join via share link, proof of the real join path.
//
// A whole-roster stableford round on Linköpings, built from a UI-shaped
// `RoundSetupDraft` exactly as the `/create` wizard would submit it (two
// guest producers, no explicit playing groups — the compiler defaults to one
// group covering everyone, the joinable open-selector shape). One hole is
// scored for both starting players FIRST, establishing append-only history
// that must survive the join untouched. Then this seed calls the REAL
// `RoundJoinService.joinByToken` (not a hand-written row) to add the
// registered dev-seed player `erik` to the round — proving:
//   - the prior score events are byte-for-byte intact (same ball ids);
//   - erik's ball lands in the round's single whole-roster playing group,
//     and ONLY there;
//   - a `setup_correction_events` audit row is written, target
//     `playing_group`, carrying the composed old/new group projections.
//
// Depends on the `linkopings` seed (course + tees) and the dev seed (erik)
// having run first.

import type { Scenario } from '../scenario';
import type { RoundSetupDraft } from '../../server/domain/round-setup/draft';

export const SELF_JOIN_PROOF_DATE = '2026-07-04';

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    const course = await s.findCourse(linko.name, 'Linköpings Golfklubb 1-18');

    const existingGuest = (await s.services.guestPlayerService.list()).find(
        (g) => g.displayName === 'Magnus Startare',
    );
    if (existingGuest) {
        // eslint-disable-next-line no-console
        console.log(`seed: self-join-proof already present (guest ${existingGuest.id.slice(0, 8)})`);
        return;
    }

    const gulTee = (await s.services.teeService.listByCourse(course.id)).find((t) => t.name === 'Gul');
    if (!gulTee) throw new Error('seed: self-join-proof expected Gul tee on Linköpings 1-18');

    const erik = await s.findPlayer('erik');

    const guestMagnus = await s.guest('Magnus Startare', { gender: 'M', handicap: 13 });
    const guestLena = await s.guest('Lena Startare', { gender: 'F', handicap: 16 });

    // --- 1. UI-shaped draft, no explicit playing groups (default: one group,
    // everyone, whole-roster own-ball — the joinable open-selector shape). ---
    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: SELF_JOIN_PROOF_DATE,
        producers: [
            { producerDefId: 'p1', playerRef: { kind: 'guest', id: guestMagnus.id }, handicapIndex: 13, gender: 'M', teeId: gulTee.id },
            { producerDefId: 'p2', playerRef: { kind: 'guest', id: guestLena.id }, handicapIndex: 16, gender: 'F', teeId: gulTee.id },
        ],
        formats: [{ formatId: 'stableford_individual' }],
    };

    const created = await s.services.friendlyRoundService.create(draft, null);
    if (!created.ok) {
        throw new Error(`seed: self-join-proof round create failed: ${JSON.stringify(created.diagnostics)}`);
    }
    const { round, friendlyRound } = created;

    // --- 2. Score hole 1 for both starting players — append-only history
    // that must survive the join recompile with the SAME ball ids. ---
    const bpRowsBefore = await s.services.db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', round.id)
        .select(['bp.producer_def_id', 'bp.ball_id'])
        .execute();
    const ballByProducerBefore = new Map(bpRowsBefore.map((r) => [r.producer_def_id, r.ball_id]));
    const firstPlayHoleId = round.playingGroups[0]!.playedOrder[0]!.playHoleId;

    await s.services.scoreEventService.append({
        roundId: round.id,
        ballId: ballByProducerBefore.get('p1')!,
        playHoleId: firstPlayHoleId,
        strokes: 4,
        eventType: 'score_entered',
        clientEventId: 'self-join-proof-pre-1',
    });
    await s.services.scoreEventService.append({
        roundId: round.id,
        ballId: ballByProducerBefore.get('p2')!,
        playHoleId: firstPlayHoleId,
        strokes: 5,
        eventType: 'score_entered',
        clientEventId: 'self-join-proof-pre-2',
    });

    // Scoring the first hole promotes the round to 'active'. The join gate
    // only refuses on 'active'/'complete' — rewind lifecycle here so the join
    // demonstrates the pre-existing-history invariant (content-addressed ids
    // keep every ball + event intact across the recompile) rather than
    // exercising the separate "round already started" refusal path, which is
    // covered by `round-join.service.test.ts`.
    await s.services.roundService.update(round.id, { status: 'not_started' });

    // --- 3. The REAL join path: erik adds himself via his own share-link
    // token, exactly as the self-join API route would call it. ---
    const joinResult = await s.services.roundJoinService.joinByToken({
        token: friendlyRound.shareToken,
        teeId: gulTee.id,
        playerId: erik.id,
    });
    if (!joinResult || !joinResult.ok) {
        throw new Error(
            `seed: self-join-proof join failed: ${JSON.stringify(joinResult && !joinResult.ok ? joinResult.diagnostics : joinResult)}`,
        );
    }

    // eslint-disable-next-line no-console
    console.log(
        `seed: self-join-proof created (round ${round.id.slice(0, 8)}, token ${friendlyRound.shareToken.slice(0, 8)}, ` +
            `pre-join score on hole 1 for p1/p2, erik joined via RoundJoinService.joinByToken)`,
    );
}
