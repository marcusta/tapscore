// ADR-0004 canonical fixture — köpenhamnare over three 2-player SIDES.
//
// Three two-player better-ball teams ranked by the UNCHANGED
// `kopenhamnare_individual`: each side's members play their own entered ball;
// the engine synthesizes the side's per-hole best net at materialisation and
// the stock format splits 6 points/hole over the three team-best nets. There
// is no `kopenhamnare_better_ball` format — that is the point.
//
// Front 9 on Linköpings Gul (M: slope 124 / CR 69.5 / par 71). Every player
// has handicap index 1.4 → CH = round(1.4 × 124/113 − 1.5) = 0, so net ==
// gross and the per-hole splits are hand-checkable off the raw scores.
//
// Sides: S1 = Ulla & Nils · S2 = Kalle & Olof · S3 = Rut & Sten.
// Per-hole team-best nets → 6-point splits (sole best 4/1/1, distinct 4/2/0,
// all equal 2/2/2, tied best 3/3/0):
//   h1 4/3/4 → 1/4/1      h2 3/4/5 → 4/2/0      h3 4/4/4 → 2/2/2
//   h4 5/4/5 → 1/4/1  (Ulla PICKS UP, Olof DNP — both excluded from best-of)
//   h5 4/4/3 → 1/1/4      h6 4/5/5 → 4/1/1      h7 5/4/4 → 0/3/3
//   h8 3/4/4 → 4/1/1      h9 4/3/3 → 0/3/3
// Raw totals S1 17 · S2 21 · S3 16 → normalised to last: 1 / 5 / 0.
//
// Depends on the `linkopings` seed.

import type { Scenario } from '../scenario';
import type { RoundSetupDraft } from '../../server/domain/round-setup/draft';

export async function apply(s: Scenario): Promise<void> {
    const course = await s.findCourse('Linköpings Golfklubb', 'Linköpings Golfklubb 1-18');
    const tees = await s.services.teeService.listByCourse(course.id);
    const gul = tees.find((t) => t.name === 'Gul');
    if (!gul) throw new Error('kopenhamnare-sides-round: Gul tee not found');

    // Usernames prefixed `sides-` so no other seed (or the dev seed's roster)
    // collides on username → displayName lookups.
    const roster: [string, string][] = [
        ['sides-ulla', 'Ulla Sidén'],
        ['sides-nils', 'Nils Sidén'],
        ['sides-kalle', 'Kalle Sidén'],
        ['sides-olof', 'Olof Sidén'],
        ['sides-rut', 'Rut Sidén'],
        ['sides-sten', 'Sten Sidén'],
    ];
    const players = [];
    for (const [username, displayName] of roster) {
        players.push(await s.player(username, { displayName, handicap: 1.4 }));
    }

    const side = (id: string, label: string, a: string, b: string) => ({
        id,
        label,
        kind: 'multi_ball' as const,
        members: [{ producerDefId: a, allowancePct: 100 }, { producerDefId: b, allowancePct: 100 }],
    });

    const draft: RoundSetupDraft = {
        courseId: course.id,
        playedAt: new Date().toISOString().slice(0, 10),
        roundType: 'front_9',
        venueType: 'outdoor',
        producers: players.map((p, i) => ({
            producerDefId: `p${i + 1}`,
            playerRef: { kind: 'player' as const, id: p.id },
            handicapIndex: 1.4,
            gender: 'M' as const,
            teeId: gul.id,
        })),
        teams: [side('S1', 'Sida 1', 'p1', 'p2'), side('S2', 'Sida 2', 'p3', 'p4'), side('S3', 'Sida 3', 'p5', 'p6')],
        formats: [
            {
                formatId: 'kopenhamnare_individual',
                subjects: [
                    { kind: 'team', teamId: 'S1' },
                    { kind: 'team', teamId: 'S2' },
                    { kind: 'team', teamId: 'S3' },
                ],
            },
        ],
    };

    const created = await s.services.roundService.createFromDraft(draft);
    if (!created.ok) {
        throw new Error(
            `kopenhamnare-sides-round: draft rejected: ${JSON.stringify(created.diagnostics)}`,
        );
    }

    // Score entry stays per-member own ball. null = DNP, 0 = pickup.
    const perPlayer: Record<string, (number | null)[]> = {
        //               h1 h2 h3 h4    h5 h6 h7 h8 h9
        'Ulla Sidén': [4, 3, 4, 0, 5, 4, 5, 4, 4],
        'Nils Sidén': [5, 4, 5, 5, 4, 4, 6, 3, 4],
        'Kalle Sidén': [3, 5, 4, 4, 4, 5, 5, 4, 3],
        'Olof Sidén': [6, 4, 6, null, 5, 5, 4, 4, 5],
        'Rut Sidén': [4, 6, 5, 5, 3, 5, 4, 4, 4],
        'Sten Sidén': [4, 5, 4, 6, 6, 5, 5, 5, 3],
    };

    const balls = await s.services.roundService.ballsForRound(created.round.id);
    const occ = [...created.round.playHoles].sort((a, b) => a.ordinal - b.ordinal).map((p) => p.id);
    const baseMs = Date.now();
    let ev = 0;
    for (const [name, strokesPerHole] of Object.entries(perPlayer)) {
        const ball = balls.find((b) => b.players[0]?.displayName === name);
        if (!ball) throw new Error(`kopenhamnare-sides-round: no ball for ${name}`);
        for (let h = 0; h < strokesPerHole.length; h++) {
            await s.services.scoreEventService.append({
                roundId: created.round.id,
                ballId: ball.id,
                playHoleId: occ[h]!,
                strokes: strokesPerHole[h]!,
                eventType: 'score_entered',
                clientEventId: `seed-kop-sides-${ev}`,
                recordedAt: new Date(baseMs + ev * 1000).toISOString(),
            });
            ev += 1;
        }
    }

    // eslint-disable-next-line no-console
    console.log(`seed: kopenhamnare-sides-round created (round ${created.round.id.slice(0, 8)})`);
}
