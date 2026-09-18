// Canonical fixture: stroke play over two 3-player teams, two scores counted
// per hole (`best_n_sum`, count 2).
//
// Each member plays and enters their own ball. At materialisation the engine
// sums the team's two lowest scores on every hole into one virtual subject,
// and the unchanged `stroke_play_individual` ranks the two subjects. A team
// with fewer than two scores on a hole has no score there.
//
// Front 9 on Linköpings Gul. The slot's allowance is 0%, so every playing
// handicap is 0, net equals gross, and the net basis counts gross scores. The
// indexes differ on purpose: a stroke leaking into the sum would change it.
//
// Teams: Röd = Rolf, Rita, Rune · Blå = Bo, Britt, Bengt.
// Per-hole team score (the two lowest of three; pickups and DNPs drop out):
//   Röd  h1 4+5  h2 3+4  h3 4+4  h4 5+5  h5 4+6  h6 3+3  h7 4+5  h8 5+5  h9 4+4
//        =  9     7     8     10    10     6     9     10     8      total 77
//   Blå  every hole 4+4 = 8                                          total 72
// h6: Rune PICKS UP, Röd still has two scores. h8: Bengt DNP, Blå still has two.
//
// Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';
import type { RoundSetupDraft } from '../../server/domain/round-setup/draft';

export async function apply(s: Scenario): Promise<void> {
    const course = await s.findCourse('Linköpings Golfklubb', 'Linköpings Golfklubb 1-18');
    const tees = await s.services.teeService.listByCourse(course.id);
    const gul = tees.find((t) => t.name === 'Gul');
    if (!gul) throw new Error('best-two-of-three-round: Gul tee not found');

    // Usernames prefixed `b2-` so no other seed collides on the lookups.
    const roster: [string, string, number][] = [
        ['b2-rolf', 'Rolf Tvåa', 18],
        ['b2-rita', 'Rita Tvåa', 24],
        ['b2-rune', 'Rune Tvåa', 9],
        ['b2-bo', 'Bo Tvåa', 2],
        ['b2-britt', 'Britt Tvåa', 12],
        ['b2-bengt', 'Bengt Tvåa', 30],
    ];
    const players = [];
    for (const [username, displayName, handicap] of roster) {
        players.push(await s.player(username, { displayName, handicap }));
    }

    const team = (id: string, label: string, members: string[]) => ({
        id,
        label,
        kind: 'multi_ball' as const,
        members: members.map((producerDefId) => ({ producerDefId, allowancePct: 100 })),
    });

    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: new Date().toISOString().slice(0, 10),
        roundType: 'front_9',
        venueType: 'outdoor',
        producers: players.map((p, i) => ({
            producerDefId: `p${i + 1}`,
            playerRef: { kind: 'player' as const, id: p.id },
            handicapIndex: roster[i]![2],
            gender: 'M' as const,
            teeId: gul.id,
        })),
        teams: [team('R', 'Röd', ['p1', 'p2', 'p3']), team('B', 'Blå', ['p4', 'p5', 'p6'])],
        formats: [
            {
                formatId: 'stroke_play_individual',
                allowanceConfig: { type: 'flat', pct: 0 },
                subjects: [
                    { kind: 'team', teamId: 'R' },
                    { kind: 'team', teamId: 'B' },
                ],
                sideAggregation: { type: 'best_n_sum', count: 2, basis: 'net' },
            },
        ],
    };

    const created = await s.services.roundService.createFromDraft(draft);
    if (!created.ok) {
        throw new Error(
            `best-two-of-three-round: draft rejected: ${JSON.stringify(created.diagnostics)}`,
        );
    }

    // Score entry stays per-member own ball. null = DNP, 0 = pickup.
    const perPlayer: Record<string, (number | null)[]> = {
        //             h1 h2 h3 h4 h5 h6 h7 h8    h9
        'Rolf Tvåa': [4, 3, 4, 5, 4, 3, 4, 5, 4],
        'Rita Tvåa': [5, 4, 7, 5, 7, 3, 5, 7, 4],
        'Rune Tvåa': [7, 7, 4, 7, 6, 0, 7, 5, 7],
        'Bo Tvåa': [4, 4, 4, 4, 4, 4, 4, 4, 4],
        'Britt Tvåa': [4, 4, 4, 4, 4, 4, 4, 4, 4],
        'Bengt Tvåa': [6, 6, 6, 6, 6, 6, 6, null, 6],
    };

    const balls = await s.services.roundService.ballsForRound(created.round.id);
    const occ = [...created.round.playHoles].sort((a, b) => a.ordinal - b.ordinal).map((p) => p.id);
    const baseMs = Date.now();
    let ev = 0;
    for (const [name, strokesPerHole] of Object.entries(perPlayer)) {
        const ball = balls.find((b) => b.players[0]?.displayName === name);
        if (!ball) throw new Error(`best-two-of-three-round: no ball for ${name}`);
        for (let h = 0; h < strokesPerHole.length; h++) {
            await s.services.scoreEventService.append({
                roundId: created.round.id,
                ballId: ball.id,
                playHoleId: occ[h]!,
                strokes: strokesPerHole[h]!,
                eventType: 'score_entered',
                clientEventId: `seed-best2-${ev}`,
                recordedAt: new Date(baseMs + ev * 1000).toISOString(),
            });
            ev += 1;
        }
    }

    // eslint-disable-next-line no-console
    console.log(`seed: best-two-of-three-round created (round ${created.round.id.slice(0, 8)})`);
}
