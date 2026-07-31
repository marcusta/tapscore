// Verification seed for "friends on the course" (docs/proposals/friends-activity.md).
//
// Builds a signed-in player plus a friend graph shaped to exercise every
// state of the Out-now strip, the spectate view, the friends list and the
// visibility toggle in one look — including the states that must NOT appear,
// which are the ones a screenshot can otherwise never prove.
//
//   Sign in as:  marcus / password123
//
// The graph:
//   Anna     mutual   — live round NAMED "Tisdagsgolfen", thru 7, over par
//                       (the chip's lead friend; header must lead with the name)
//   Björn    mutual   — live round, unnamed, thru 12, under par, and Cecilia
//                       is in it too (chip reads "Björn + 1", course-name fallback)
//   Cecilia  mutual   — also a finished round three days ago (the `recent` list)
//   Elin     mutual   — no rounds at all (a plain friend row, no live dot)
//   David    ONE-WAY  — marcus added him, he never added back ("hasn't added
//                       you back"), AND he has a live round that must be
//                       ABSENT from the strip
//   Anna     also has a second live round set to `private` — also ABSENT
//   marcus   has his own live round — his own rounds are excluded from his
//                       feed, and it is where the visibility toggle lives
//                       (Manage → Show in friends' feeds)
//
// Depends on the `linkopings` seed for the course and tees:
//
//   bun run seed linkopings friends-on-course
//
// Re-running is safe: every person is get-or-create, and the seed bails out
// early if its rounds already exist.

import type { Scenario } from '../scenario';
import type { RoundSetupDraft } from '../../server/domain/round-setup/draft';
import type { RoundVisibility } from '../../server/db/schema';

export const LOGIN_USERNAME = 'marcus';
export const LOGIN_PASSWORD = 'password123';

const COURSE_NAME = 'Linköpings Golfklubb 1-18';

/** Marker used to detect a prior run — the one round with a stable name. */
const MARKER_ROUND_NAME = 'Tisdagsgolfen';

interface Person {
    id: string;
    displayName: string;
}

interface LiveRoundSpec {
    /** Round name, or null to exercise the course-name fallback. */
    name: string | null;
    /** Friends producing a ball, in roster order. */
    players: Person[];
    /** Strokes per hole, per player, in `players` order. Length = holes played. */
    scores: number[][];
    visibility?: RoundVisibility;
    /** Days back; 0 = today. Anything scored today is inside the presence window. */
    daysAgo?: number;
    /** Who created it (the `friendly_rounds` creator). Defaults to the first player. */
    creator?: Person;
}

export async function apply(s: Scenario): Promise<void> {
    const linko = await s.findClub('Linköpings Golfklubb');
    const course = await s.findCourse(linko.name, COURSE_NAME);
    const tees = await s.services.teeService.listByCourse(course.id);
    const gul = tees.find((t) => t.name === 'Gul');
    if (!gul) throw new Error('seed: friends-on-course expected a "Gul" tee on Linköpings 1-18');

    const existing = await s.services.db
        .selectFrom('rounds')
        .select('id')
        .where('name', '=', MARKER_ROUND_NAME)
        .executeTakeFirst();
    if (existing) {
        // eslint-disable-next-line no-console
        console.log('seed: friends-on-course already present — nothing to do');
        return;
    }

    // --- People ---

    const marcus = await person(s, LOGIN_USERNAME, 'Marcus', 14);
    const anna = await person(s, 'anna-fc', 'Anna Lindqvist', 9);
    const bjorn = await person(s, 'bjorn-fc', 'Björn Ek', 18);
    const cecilia = await person(s, 'cecilia-fc', 'Cecilia Ohlsson', 22);
    const elin = await person(s, 'elin-fc', 'Elin Persson', 6);
    const david = await person(s, 'david-fc', 'David Nyström', 11);

    // Mutual edges — visibility flows only along these. Both directions,
    // because a one-directional row is a contact, not a friend.
    for (const friend of [anna, bjorn, cecilia, elin]) {
        await s.services.friendService.add(marcus.id, friend.id);
        await s.services.friendService.add(friend.id, marcus.id);
    }
    // One-way: marcus added David, David never added back. David's rounds stay
    // invisible to marcus, and his row carries the quiet subtitle.
    await s.services.friendService.add(marcus.id, david.id);

    // --- Rounds ---

    const teeId = gul.id;
    const mk = (spec: LiveRoundSpec) => seedRound(s, course.id, teeId, spec);

    // Score arrays are tuned against the real Linköping pars
    // (4 4 3 5 3 5 3 4 4 5 3 4 4 5 4 3 4 4) so the chips read as intended —
    // one friend over par, one under. See PARS in `seeds/linkopings.ts`.

    // Visible: named round, one friend, thru 7 at +3.
    await mk({
        name: MARKER_ROUND_NAME,
        players: [anna],
        scores: [[5, 4, 4, 5, 3, 5, 4]],
    });

    // Visible: unnamed (course-name fallback), TWO friends in one round — the
    // chip collapses to "Björn + 1". Björn thru 12 at −1, Cecilia at +5.
    await mk({
        name: null,
        players: [bjorn, cecilia],
        scores: [
            [4, 4, 3, 4, 3, 5, 3, 4, 4, 5, 3, 4],
            [5, 4, 3, 6, 4, 5, 4, 4, 4, 6, 3, 4],
        ],
    });

    // Invisible: David is a contact, not a friend. Live, but must not appear.
    await mk({
        name: 'Davids runda',
        players: [david],
        scores: [[4, 5, 4, 4]],
    });

    // Invisible: Anna opted this one out. Live, mutual friend, still hidden.
    await mk({
        name: 'Anna privat',
        players: [anna],
        scores: [[5, 5, 4]],
        visibility: 'private',
    });

    // The `recent` list: dated three days back and scored out to 18, so no
    // holes remain and presence does not claim it.
    await mk({
        name: null,
        players: [cecilia],
        scores: [[5, 4, 4, 5, 4, 5, 4, 4, 4, 6, 3, 5, 4, 5, 4, 4, 4, 4]],
        daysAgo: 3,
    });

    // marcus's own live round. Excluded from his own feed by design; this is
    // where Manage → "Show in friends' feeds" is reachable.
    await mk({
        name: 'Fredagsrundan',
        players: [marcus],
        scores: [[4, 5, 4, 5, 4]],
    });

    // eslint-disable-next-line no-console
    console.log(
        `seed: friends-on-course ready — sign in as ${LOGIN_USERNAME}/${LOGIN_PASSWORD}. ` +
            `Expect 2 friends on the course (Anna, Björn +1); David and Anna's private round must NOT appear.`,
    );
}

/** Register (get-or-create) and record a handicap index. */
async function person(
    s: Scenario,
    username: string,
    displayName: string,
    handicap: number,
): Promise<Person> {
    const p = await s.player(username, { displayName, handicap, password: LOGIN_PASSWORD });
    return { id: p.id, displayName: p.displayName };
}

function isoDaysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Create a friendly round through the REAL service (so it gets a genuine
 * share token and a compiled roster), then append scores through the real
 * event path — which stamps `recorded_at` at wall-clock now. That is what
 * makes presence work: a round is live because it was *just scored*, not
 * because a status column says so.
 */
async function seedRound(
    s: Scenario,
    courseId: string,
    teeId: string,
    spec: LiveRoundSpec,
): Promise<void> {
    const draft: RoundSetupDraft = {
        courseId,
        playedAt: isoDaysAgo(spec.daysAgo ?? 0),
        ...(spec.name === null ? {} : { name: spec.name }),
        producers: spec.players.map((p, i) => ({
            producerDefId: `p${i + 1}`,
            playerRef: { kind: 'player' as const, id: p.id },
            handicapIndex: 10 + i * 4,
            gender: 'M' as const,
            teeId,
        })),
        formats: [{ formatId: 'stroke_play_individual' }],
    };

    const creator = spec.creator ?? spec.players[0]!;
    const created = await s.services.friendlyRoundService.create(draft, creator.id);
    if (!created.ok) {
        throw new Error(
            `seed: friends-on-course round create failed: ${JSON.stringify(created.diagnostics)}`,
        );
    }
    const { round, friendlyRound } = created;

    const ballRows = await s.services.db
        .selectFrom('ball_players as bp')
        .innerJoin('balls as b', 'b.id', 'bp.ball_id')
        .where('b.round_id', '=', round.id)
        .select(['bp.producer_def_id', 'bp.ball_id'])
        .execute();
    const ballOf = new Map(ballRows.map((r) => [r.producer_def_id, r.ball_id]));
    const playedOrder = round.playingGroups[0]!.playedOrder;

    for (const [playerIndex, strokes] of spec.scores.entries()) {
        const ballId = ballOf.get(`p${playerIndex + 1}`);
        if (!ballId) throw new Error(`seed: friends-on-course missing ball for p${playerIndex + 1}`);
        for (const [holeIndex, value] of strokes.entries()) {
            const playHole = playedOrder[holeIndex];
            if (!playHole) break;
            await s.services.scoreEventService.append({
                roundId: round.id,
                ballId,
                playHoleId: playHole.playHoleId,
                strokes: value,
                eventType: 'score_entered',
                clientEventId: `fc-${round.id.slice(0, 8)}-${playerIndex}-${holeIndex}`,
            });
        }
    }

    if (spec.visibility && spec.visibility !== 'friends') {
        await s.services.friendlyRoundService.setVisibilityByToken(
            friendlyRound.shareToken,
            spec.visibility,
        );
    }

    // eslint-disable-next-line no-console
    console.log(
        `seed:   ${spec.name ?? '(unnamed)'} — round ${round.id.slice(0, 8)}, ` +
            `token ${friendlyRound.shareToken.slice(0, 8)}, ${spec.visibility ?? 'friends'}`,
    );
}
