import { sql, type Kysely } from 'kysely';

import type { Database, RoundStatus, RoundVisibility } from '../db/schema';
import type { FriendService } from './friend.service';
import type { PlayerService } from './player.service';

// --- Output types ---

/**
 * Who the profile is about. A deliberately SMALL identity: the four fields the
 * card renders plus the id. `handicapIndex` is the LIVE `players.handicap_index`
 * column — the same "current value" convention `PlayerProfile` documents, not a
 * `handicap_history` join.
 *
 * There is no stats field, and that is not an oversight: it was explicitly
 * deferred by the owner. A nullable placeholder would be worse than nothing —
 * a client would bind to it and the shape would ship.
 *
 * `avatarVersion` was deferred on the same grounds and is no longer: photos
 * exist now (migration 050), so the field carries a real value or a real null.
 */
export interface FriendProfileIdentity {
    id: string;
    username: string;
    displayName: string;
    handicapIndex: number | null;
    homeClubName: string | null;
    /** Content hash of the subject's photo, null when they have none. The
     *  client builds `/api/players/<id>/avatar?v=<version>` from it. */
    avatarVersion: string | null;
}

/**
 * One round on a friend's profile. Carries NO share token — the reason a
 * discovery path must never hand one out is stated once, on `SpectateView` in
 * spectate.service.ts. Navigation goes by round id through the session-scoped
 * spectate path, exactly as the feed's entries do.
 *
 * `holesPlayed` / `scoreToPar` describe the SUBJECT's own ball, not the round:
 * a round row on someone's profile is a statement about what they shot.
 */
export interface FriendProfileRoundEntry {
    roundId: string;
    /** Organizer-supplied name; null ⇒ the client falls back to `courseName`. */
    name: string | null;
    courseName: string | null;
    /** Caller-supplied 'YYYY-MM-DD' (see `roundsFor` on why it needs a tiebreak). */
    date: string;
    status: RoundStatus;
    /** Length of the round's itinerary — the denominator behind "Thru 7". */
    holeCount: number;
    /** Holes with a recorded score on the subject's ball. */
    holesPlayed: number;
    /** Strokes minus par over exactly those holes; null before the first one. */
    scoreToPar: number | null;
}

/** A course the subject has played, with how often and how recently. */
export interface FriendProfileCourseEntry {
    courseId: string;
    /** Live `courses.name`, falling back to the round's frozen snapshot. */
    courseName: string | null;
    /** Distinct VISIBLE rounds on this course — see the class doc's asymmetry. */
    roundsPlayed: number;
    /** Most recent visible round date on this course, 'YYYY-MM-DD'. */
    lastPlayedAt: string;
}

export interface FriendProfileView {
    player: FriendProfileIdentity;
    /** Every non-competition round played, INCLUDING private ones. */
    roundsTotal: number;
    /** …of those, the ones dated in the current calendar year. */
    roundsThisYear: number;
    /** Distinct courses across those same rounds, private included. */
    coursesTotal: number;
    /** The newest visible rounds — private ones are absent by design. */
    recentRounds: FriendProfileRoundEntry[];
}

export interface FriendProfileRoundPage {
    rounds: FriendProfileRoundEntry[];
    /**
     * Opaque marker to pass back as `cursor` for the next page; null on the
     * terminal page. Do not parse it, and do not construct one — the service
     * resolves it against its own rows (`cursorAnchor`) and an unrecognised
     * value simply yields the first page.
     */
    nextCursor: string | null;
    hasMore: boolean;
}

/**
 * The courses list is CAPPED (`COURSES_LIMIT`) and therefore has to say so:
 * without `hasMore` a client cannot tell a complete history from a truncated
 * one, and `coursesTotal > courses.length` would carry TWO meanings at once —
 * the documented private/`link` asymmetry, and a silent truncation. There is
 * deliberately no cursor: this is a browsing aid, and the honest signal that a
 * player has more courses than fit is a boolean, not a second paging protocol.
 */
export interface FriendProfileCoursePage {
    courses: FriendProfileCourseEntry[];
    hasMore: boolean;
}

/**
 * Discriminated rather than thrown, so the API layer maps refusal to 403 and
 * absence to 404 without an error crossing the service boundary. Same shape
 * `SpectateService` uses, and for the same reason: the two refusals are
 * genuinely different answers.
 */
export type FriendProfileResult<T> =
    | { ok: true; value: T }
    | { ok: false; reason: 'not_found' | 'forbidden' };

// --- Bounds ---

/** The profile card's short list. Everything longer is `roundsFor`'s job. */
const RECENT_LIMIT = 5;

/** Default page size for `roundsFor` when the caller names none. */
const DEFAULT_PAGE_LIMIT = 20;

/**
 * Hard ceiling on a `roundsFor` page. Every entry costs a per-round scorecard
 * aggregate, so the page size is what bounds the expensive part.
 *
 * Exported because the HTTP schema uses it as its `maximum` — the bound is
 * written ONCE. Over HTTP an over-large `limit` is refused at the edge with a
 * 400; this constant clamps any in-process caller, which has no schema in
 * front of it.
 */
export const MAX_PAGE_LIMIT = 50;

/**
 * How many courses `coursesFor` may return by default. The query is a GROUP BY
 * that SQLite evaluates in one pass, but the RESULT is what travels to a phone,
 * and a courses list is a browsing aid rather than an archive. Ordered by
 * most-recently-played, so the cap drops the courses a player last saw longest
 * ago — and `FriendProfileCoursePage.hasMore` says when it did.
 */
const COURSES_LIMIT = 100;

// --- Internals ---

/**
 * Clamp an in-process caller's `limit` into `[1, ceiling]`.
 *
 * `Number.isFinite` is the load-bearing half: `NaN` and `Infinity` survive
 * `Math.trunc`/`Math.max`/`Math.min` unchanged and reach SQLite as a literal
 * `limit NaN`, which throws a raw `SQLiteError: datatype mismatch` — an
 * internal error for what is really "no limit given". Unreachable over HTTP
 * (the schema is `Type.Integer`), reachable from any server-side caller.
 */
function clampLimit(raw: number | undefined, fallback: number, ceiling: number): number {
    if (raw === undefined || !Number.isFinite(raw)) return fallback;
    return Math.min(Math.max(1, Math.trunc(raw)), ceiling);
}

/**
 * A friend's profile — the dashboard for someone else
 * (docs/proposals/friends-activity.md called this the "friend detail page" and
 * deferred it past v1). Three reads, one gate, one visibility rule.
 *
 * ## The gate
 *
 * Every method takes `(viewerPlayerId, subjectPlayerId)` and answers only on the
 * DERIVED MUTUAL EDGE — both `friendships` rows. A one-way contact is refused
 * outright rather than served an empty profile: adding someone is a unilateral
 * convenience for the roster picker, and if it granted a view of their golf
 * history, silent watching would be possible. Mutuality comes from
 * `FriendService.mutualFriendIdsFor` — THE implementation (AGENTS.md
 * "Cross-player reads"); there is deliberately no `EXISTS` check inlined here,
 * because two implementations of an authorization predicate drift apart without
 * a test noticing.
 *
 * The caller is never their own friend (`friendships` forbids the self-row), so
 * asking for your own profile is refused. That is correct rather than awkward:
 * your own history is `DashboardService`'s job, and it shows you things — your
 * private rounds, your share tokens — this shape must never carry.
 *
 * ## The visibility rule, and why it is asymmetric
 *
 * > **Private rounds COUNT in aggregates. They NEVER appear in lists.**
 *
 * `roundsTotal`, `roundsThisYear` and `coursesTotal` include rounds whose
 * `visibility` is 'private'. `recentRounds`, `roundsFor` and `coursesFor`
 * exclude them.
 *
 * This is intentional and must not be "fixed" into consistency: a COUNT is not
 * a disclosure, a ROW is. "Anna has played 84 rounds" reveals that she plays
 * golf, which her being on your mutual edge already told you. A row carrying
 * course + date + score is the thing she opted out of when she marked a round
 * private on the day she shot 112 — the semi-hidden opt-out the proposal
 * describes. Consequence, stated so nobody reads it as a bug:
 * `roundsTotal >= ` the length of everything `roundsFor` will ever page
 * through, and `coursesTotal >= coursesFor().courses.length`.
 *
 * ### 'link' is excluded from the lists too
 *
 * The proposal's table says `link` never appears in feeds ("not a discovery
 * channel"), and a profile round-list IS a discovery channel by exactly that
 * definition: it hands the viewer round IDS THEY DID NOT HAVE. `link` means
 * "anyone signed in *who holds the round id*" — holding the id is the whole
 * credential — so publishing the id on a page every mutual friend can open
 * would silently convert "I sent this link to one person" into "all my friends
 * see it". Listing only `visibility = 'friends'` also keeps ONE discoverability
 * predicate in the codebase, identical to the feed's.
 *
 * `link` rounds still COUNT, like private ones: the aggregates are about a
 * player's golf, not about their sharing settings.
 *
 * ## Everything else
 *
 * - **Competition rounds are excluded everywhere** — lists AND aggregates —
 *   whatever their `visibility`. They ride a friendly wrapper whose creator is
 *   whichever admin materialised them, and competition discovery stays
 *   admin-gated. Precedent: `FriendlyRoundService.list` and
 *   `FriendsActivityService`.
 * - **"Rounds" means rounds PLAYED**, i.e. the subject produced a ball
 *   (`ball_players.player_id`). A round they merely organised is not part of
 *   their playing history — the same split `DashboardService.forPlayer`
 *   ("produced") and `FriendlyRoundService.listByCreator` ("created") already
 *   make for the caller's own rounds. The feed's wider participation rule
 *   ("your friend is IN it") answers a different question.
 * - **No share token in any payload**, by construction: `friendly_rounds` is
 *   never read in this service.
 */
export class FriendProfileService {
    constructor(
        private db: Kysely<Database>,
        private friends: FriendService,
        private players: PlayerService,
    ) {}

    // --- Queries (the spine) ---

    /**
     * THE round set this service is about: non-competition rounds the subject
     * produced a ball in. Every other query composes from it, so the two
     * exclusions that hold *everywhere* — competition rounds, and
     * non-producers — are stated once.
     *
     * A player can produce several balls in one round (own ball plus a shared
     * team ball), so this join multiplies rows; every consumer is either a
     * `COUNT(DISTINCT …)` or a `.distinct()` projection over `rounds` columns
     * only.
     */
    private producedRounds(subjectPlayerId: string) {
        return this.db
            .selectFrom('rounds as r')
            .innerJoin('balls as b', 'b.round_id', 'r.id')
            .innerJoin('ball_players as bp', 'bp.ball_id', 'b.id')
            .leftJoin('competition_rounds as cr', 'cr.round_id', 'r.id')
            .where('bp.player_id', '=', subjectPlayerId)
            .where('cr.id', 'is', null);
    }

    /**
     * The listable subset — the ONE place the list-side visibility narrowing
     * lives, so `recentRounds`, `roundsFor` and `coursesFor` cannot disagree
     * with each other about what a friend may see.
     */
    private visibleRounds(subjectPlayerId: string) {
        return this.producedRounds(subjectPlayerId).where(
            'r.visibility',
            '=',
            'friends' satisfies RoundVisibility,
        );
    }

    // --- Queries (aggregates) ---

    /**
     * All three aggregates in ONE pass, and as SQL aggregates rather than by
     * materialising rows — that is the bound. `FriendsActivityService` took a
     * review finding for aggregating over every visible round ever; counting in
     * the database costs a scan of an indexed join and returns three integers
     * however long a career is.
     *
     * `visibility` is deliberately NOT filtered here — see the class doc's
     * asymmetry. `yearPrefix` is a four-character 'YYYY' compared against the
     * first four characters of `rounds.date`, which is a caller-supplied
     * 'YYYY-MM-DD' calendar date (not a timestamp): a prefix comparison is the
     * honest way to ask "same calendar year" of a value with no timezone.
     */
    private aggregates(subjectPlayerId: string, yearPrefix: string) {
        return this.producedRounds(subjectPlayerId).select([
            sql<number>`COUNT(DISTINCT r.id)`.as('roundsTotal'),
            sql<number>`COUNT(DISTINCT CASE WHEN substr(r.date, 1, 4) = ${yearPrefix} THEN r.id END)`.as(
                'roundsThisYear',
            ),
            sql<number>`COUNT(DISTINCT r.course_id)`.as('coursesTotal'),
        ]);
    }

    // --- Queries (lists) ---

    /**
     * One page of visible rounds, newest first, keyset-paginated.
     *
     * The total order is `(date DESC, id DESC)`. `rounds.date` ALONE is not a
     * stable order: it is a caller-supplied 'YYYY-MM-DD' string, ties are the
     * normal case (a society day puts four rounds on one date), and SQLite is
     * free to return tied rows in any order — a cursor over an unstable order
     * duplicates and skips rows across pages. The round id breaks the tie
     * deterministically.
     *
     * The cursor is the anchor round's ID, and its DATE is fetched by a
     * correlated subquery so the value never leaves SQLite — see `cursorAnchor`
     * for why carrying it, or even reading it back into JS, loses rows.
     *
     * `limit` is fetched +1 by the caller to detect a further page.
     */
    private visibleRoundsPage(subjectPlayerId: string, cursorRoundId: string | null, limit: number) {
        let q = this.visibleRounds(subjectPlayerId)
            .select([
                'r.id as roundId',
                'r.name as name',
                'r.course_name_snapshot as courseName',
                'r.date as date',
                'r.status as status',
            ])
            .distinct()
            .orderBy('r.date', 'desc')
            .orderBy('r.id', 'desc')
            .limit(limit);
        if (cursorRoundId) {
            // Strictly AFTER the anchor position in the same total order. The
            // anchor's date is a correlated subquery, never a bound value.
            q = q.where((eb) => {
                const anchorDate = eb
                    .selectFrom('rounds as anchor')
                    .select('anchor.date')
                    .where('anchor.id', '=', cursorRoundId);
                return eb.or([
                    eb('r.date', '<', anchorDate),
                    eb.and([eb('r.date', '=', anchorDate), eb('r.id', '<', cursorRoundId)]),
                ]);
            });
        }
        return q;
    }

    /**
     * Does this cursor name a round the viewer may page from? Existence only —
     * the anchor DATE is never read into JS.
     *
     * The cursor carries the round ID ALONE, and that is the whole design. A
     * cursor that carries the DATE assumes the value round-trips: encode
     * `rounds.date`, send it to a phone, take it back, and have SQL compare it
     * equal to the stored one. `rounds.date` is caller-supplied and validated
     * only as `Type.String({ minLength: 1 })`
     * (server/domain/round-setup/draft.ts), so that assumption is false twice
     * over — a date can contain any delimiter you pick, and a lone surrogate
     * does not survive SQLite at all (stored as one ill-formed byte, read back
     * as ''). Either way the re-encoded predicate matches nothing: the page
     * silently skips rounds `hasMore` had already promised, or stalls on the
     * same cursor forever. Note that reading the date back into JS and re-binding
     * it does NOT fix this — it is the same round trip, one hop shorter. Only
     * comparing the stored value against itself inside SQL does, which is why
     * `visibleRoundsPage` reaches for the anchor with a correlated subquery.
     *
     * Scoped to `visibleRounds`, not to `rounds`: an unknown or non-visible id
     * resolves to nothing, the caller falls back to the first page, and a forged
     * cursor cannot be used to probe where a private round sits in the order.
     */
    private cursorAnchor(subjectPlayerId: string, roundId: string) {
        return this.visibleRounds(subjectPlayerId)
            .where('r.id', '=', roundId)
            .select('r.id as id')
            .limit(1);
    }

    /**
     * Courses behind the VISIBLE rounds, most recently played first.
     *
     * Grouped on `r.course_id` (the identity), not on the name: a club renaming
     * a course must not split its history in two. `courses.name` is the live
     * name and `r.course_name_snapshot` the frozen one; the COALESCE prefers
     * live, and falls back to a snapshot when the course row is gone. `MAX()`
     * over the snapshots is arbitrary only in the case where the course was
     * deleted AND its name changed mid-history — a label, never an identity.
     *
     * Consequence, and deliberate: the ROUND list renders
     * `r.course_name_snapshot` (frozen at setup) while this list prefers the
     * LIVE `courses.name`, so a course renamed since a round was played shows
     * two different names on one profile. That is the same split the feed
     * already makes (`FriendsActivityService.factsForRounds` also renders the
     * snapshot) and it is the honest one: a round is a historical record and
     * should say what the course was called that day, a courses list is a
     * pointer at a course that exists now.
     *
     * `limit` is fetched +1 by the caller to detect truncation.
     */
    private coursesPlayed(subjectPlayerId: string, limit: number) {
        return this.visibleRounds(subjectPlayerId)
            .leftJoin('courses as c', 'c.id', 'r.course_id')
            .select([
                'r.course_id as courseId',
                sql<string | null>`COALESCE(c.name, MAX(r.course_name_snapshot))`.as('courseName'),
                sql<number>`COUNT(DISTINCT r.id)`.as('roundsPlayed'),
                sql<string>`MAX(r.date)`.as('lastPlayedAt'),
            ])
            .groupBy(['r.course_id', 'c.name'])
            .orderBy('lastPlayedAt', 'desc')
            .orderBy('courseId', 'desc')
            .limit(limit);
    }

    // --- Queries (per-round facts) ---

    /** Itinerary length per round — the denominator behind "Thru 7". */
    private holeCounts(roundIds: string[]) {
        return this.db
            .selectFrom('round_play_holes')
            .select(['round_id', (eb) => eb.fn.countAll<number>().as('holeCount')])
            .where('round_id', 'in', roundIds)
            .groupBy('round_id');
    }

    /**
     * The subject's progress per (round, ball). Per BALL rather than per round
     * because a player can produce several balls in one round (their own plus a
     * shared team ball) and summing them would report a nonsense "Thru 36" —
     * the same reasoning, and the same fix, as
     * `FriendsActivityService.progressRows`. The caller picks the ball with the
     * most scored holes.
     *
     * ## Why the inner subquery, and why the source filter
     *
     * `scorecards` is uniquely keyed on `(ball_id, play_hole_id, source_key)`
     * where `source_key = COALESCE(source_player_id, source_guest_player_id,
     * '')` — SEVERAL rows per (ball, hole) is a designed shape, not an anomaly
     * (see the class doc on `ScorecardService`). Counting ROWS and summing over
     * all of them is therefore wrong twice over:
     *
     *  - one ball serving both an individual slot (untagged row) and a
     *    better-ball slot (row tagged with `source_player_id`) DOUBLES both
     *    numbers — three holes scored render as "Thru 6";
     *  - on a single-ball foursomes team, the OTHER player's tagged rows land
     *    in the subject's own score-to-par.
     *
     * So: keep only rows attributable to the subject (their own tag, or the
     * untagged row an individual/foursomes slot writes), then reduce to ONE row
     * per (ball, play_hole) before counting or summing. `MIN(sc.strokes)` is
     * that reduction — after the source filter, several surviving rows for one
     * hole mean the same entry recorded through more than one format slot, so
     * they carry the same strokes and any pick returns the same number; MIN is
     * chosen because it is deterministic, so repeated reads agree, and because
     * where they ever DID disagree it reports the better score rather than
     * inventing a worse one.
     *
     * Note the GUEST half of the untagged arm. `source_key` coalesces BOTH
     * source columns, so a guest sharing the subject's ball writes rows with
     * `source_player_id IS NULL` and their identity in `source_guest_player_id`
     * — which is the foursomes failure mode again, wearing the untagged row's
     * clothes. Requiring both columns null is what makes "untagged" mean
     * "nobody's in particular, therefore the ball's, therefore the subject's".
     * A guest who later claims their account keeps their holes:
     * `GuestClaimService.claimGuest` rewrites `source_guest_player_id` into
     * `source_player_id`, which the first arm then matches.
     */
    private progressRows(roundIds: string[], subjectPlayerId: string) {
        return this.db
            .selectFrom((eb) =>
                eb
                    .selectFrom('scorecards as sc')
                    .innerJoin('balls as b', 'b.id', 'sc.ball_id')
                    .innerJoin('ball_players as bp', 'bp.ball_id', 'sc.ball_id')
                    .where('b.round_id', 'in', roundIds)
                    .where('bp.player_id', '=', subjectPlayerId)
                    .where('sc.strokes', 'is not', null)
                    .where((w) =>
                        w.or([
                            w('sc.source_player_id', '=', subjectPlayerId),
                            w.and([
                                w('sc.source_player_id', 'is', null),
                                w('sc.source_guest_player_id', 'is', null),
                            ]),
                        ]),
                    )
                    .select([
                        'b.round_id as roundId',
                        'sc.ball_id as ballId',
                        'sc.play_hole_id as playHoleId',
                        sql<number>`MIN(sc.strokes)`.as('strokes'),
                    ])
                    .groupBy(['b.round_id', 'sc.ball_id', 'sc.play_hole_id'])
                    .as('hole'),
            )
            .innerJoin('round_play_holes as ph', 'ph.id', 'hole.playHoleId')
            .select([
                'hole.roundId as roundId',
                'hole.ballId as ballId',
                (eb) => eb.fn.countAll<number>().as('holesPlayed'),
                sql<number | null>`SUM(hole.strokes - ph.par)`.as('scoreToPar'),
            ])
            .groupBy(['hole.roundId', 'hole.ballId']);
    }

    // --- Queries (identity) ---

    /** The profile card's identity read. `clubs` and `player_avatars` are both
     *  LEFT-joined: a player need not have a home club, or a photo. */
    private identity(playerId: string) {
        return this.db
            .selectFrom('players')
            .leftJoin('clubs', 'clubs.id', 'players.home_club_id')
            .leftJoin('player_avatars', 'player_avatars.player_id', 'players.id')
            .where('players.id', '=', playerId)
            .select([
                'players.id as id',
                'players.username as username',
                'players.display_name as displayName',
                'players.handicap_index as handicapIndex',
                'clubs.name as homeClubName',
                'player_avatars.version as avatarVersion',
            ]);
    }

    // --- Methods ---

    /**
     * The one authorization seam. `not_found` when the subject does not exist or
     * was soft-deleted (mirroring `DashboardService.forPlayer`'s `isActive`
     * short-circuit — a tombstoned player has no profile), `forbidden` when the
     * edge is not mutual.
     *
     * Order matters: existence is checked first so a live one-way contact and a
     * deleted account give different answers, which is what lets a client tell a
     * stale link from a withdrawn friendship. It does tell a signed-in caller
     * whether a player id exists — the same thing `/players` search already
     * tells them.
     */
    private async gate(
        viewerPlayerId: string,
        subjectPlayerId: string,
    ): Promise<{ ok: false; reason: 'not_found' | 'forbidden' } | null> {
        if (!(await this.players.isActive(subjectPlayerId))) {
            return { ok: false, reason: 'not_found' };
        }
        const mutual = await this.friends.mutualFriendIdsFor(viewerPlayerId);
        if (!mutual.has(subjectPlayerId)) return { ok: false, reason: 'forbidden' };
        return null;
    }

    /**
     * Decorate bare round rows with the subject's progress. Bounded by
     * construction: it only ever runs over the ids of one already-limited page.
     */
    private async decorate(
        rows: {
            roundId: string;
            name: string | null;
            courseName: string | null;
            date: string;
            status: RoundStatus;
        }[],
        subjectPlayerId: string,
    ): Promise<FriendProfileRoundEntry[]> {
        if (rows.length === 0) return [];
        const roundIds = rows.map((r) => r.roundId);

        const holes = new Map(
            (await this.holeCounts(roundIds).execute()).map((h) => [
                h.round_id,
                Number(h.holeCount),
            ]),
        );

        // Best ball per round — see `progressRows`. Ties break on ball id so
        // repeated reads agree with each other.
        const best = new Map<string, { ballId: string; holesPlayed: number; scoreToPar: number }>();
        for (const row of await this.progressRows(roundIds, subjectPlayerId).execute()) {
            const holesPlayed = Number(row.holesPlayed);
            const current = best.get(row.roundId);
            const better =
                current === undefined ||
                holesPlayed > current.holesPlayed ||
                (holesPlayed === current.holesPlayed && row.ballId < current.ballId);
            if (better) {
                best.set(row.roundId, {
                    ballId: row.ballId,
                    holesPlayed,
                    scoreToPar: Number(row.scoreToPar ?? 0),
                });
            }
        }

        return rows.map((row) => {
            const progress = best.get(row.roundId);
            return {
                roundId: row.roundId,
                name: row.name,
                courseName: row.courseName,
                date: row.date,
                status: row.status,
                holeCount: holes.get(row.roundId) ?? 0,
                holesPlayed: progress?.holesPlayed ?? 0,
                scoreToPar: progress === undefined ? null : progress.scoreToPar,
            };
        });
    }

    /**
     * The profile card: identity, the three aggregates, and the newest five
     * visible rounds. Read the class doc before changing what each half
     * includes — the difference between them is the feature.
     *
     * "Newest" means highest `rounds.date`, which is caller-supplied and
     * unrestricted: a round dated in the FUTURE dominates `recentRounds` until
     * that date passes. `FriendsActivityService` carries the same caveat about
     * its own ordering (see `CANDIDATE_LIMIT` there). Not worth defending
     * against — the only person who can mis-date a round this way is the
     * subject themselves, on their own profile.
     *
     * `now` is injected (ISO-8601) rather than read from the clock, matching
     * `FriendService.listFor` and `FriendsActivityService.activityFor`, so no
     * assertion about "this year" races midnight. Its UTC year is compared
     * against `rounds.date`, a timezone-free calendar date — the two can differ
     * for a few hours around New Year, which is the honest cost of a date column
     * with no zone and not worth a per-player timezone to fix.
     */
    async profileFor(
        viewerPlayerId: string,
        subjectPlayerId: string,
        now: string,
    ): Promise<FriendProfileResult<FriendProfileView>> {
        const refused = await this.gate(viewerPlayerId, subjectPlayerId);
        if (refused) return refused;

        const player = await this.identity(subjectPlayerId).executeTakeFirst();
        // The gate proved the row exists; a null here means it went away between
        // the two reads, which is a 404 like any other.
        if (!player) return { ok: false, reason: 'not_found' };

        const totals = await this.aggregates(subjectPlayerId, now.slice(0, 4)).executeTakeFirst();
        const rows = await this.visibleRoundsPage(subjectPlayerId, null, RECENT_LIMIT).execute();

        return {
            ok: true,
            value: {
                player: {
                    id: player.id,
                    username: player.username,
                    displayName: player.displayName,
                    handicapIndex: player.handicapIndex,
                    homeClubName: player.homeClubName ?? null,
                    avatarVersion: player.avatarVersion ?? null,
                },
                roundsTotal: Number(totals?.roundsTotal ?? 0),
                roundsThisYear: Number(totals?.roundsThisYear ?? 0),
                coursesTotal: Number(totals?.coursesTotal ?? 0),
                recentRounds: await this.decorate(rows, subjectPlayerId),
            },
        };
    }

    /**
     * The full round list, newest first, one page at a time. Keyset rather than
     * offset: the order is `(date DESC, id DESC)` (see `visibleRoundsPage` for
     * why the id is not optional), and a keyset cursor cannot duplicate or skip
     * a row when a round is added between two page reads.
     *
     * `options.cursor` is a round id, opaque to the caller, resolved back to an
     * anchor row by `cursorAnchor` — an unknown one yields the first page
     * rather than a 400, because it is a hint we minted ourselves.
     */
    async roundsFor(
        viewerPlayerId: string,
        subjectPlayerId: string,
        options: { cursor?: string; limit?: number } = {},
    ): Promise<FriendProfileResult<FriendProfileRoundPage>> {
        const refused = await this.gate(viewerPlayerId, subjectPlayerId);
        if (refused) return refused;

        const limit = clampLimit(options.limit, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
        const anchor = options.cursor
            ? await this.cursorAnchor(subjectPlayerId, options.cursor).executeTakeFirst()
            : undefined;
        const cursorRoundId = anchor?.id ?? null;

        // +1 row answers "is there more" without a second COUNT query, and is
        // dropped before anything expensive runs over the page.
        const rows = await this.visibleRoundsPage(
            subjectPlayerId,
            cursorRoundId,
            limit + 1,
        ).execute();
        const hasMore = rows.length > limit;
        const page = hasMore ? rows.slice(0, limit) : rows;
        const last = page[page.length - 1];

        return {
            ok: true,
            value: {
                rounds: await this.decorate(page, subjectPlayerId),
                nextCursor: hasMore && last ? last.roundId : null,
                hasMore,
            },
        };
    }

    /**
     * Courses the subject has played, most recently played first. Counts here
     * are over VISIBLE rounds only, so they are the list's own arithmetic —
     * `coursesTotal` on the profile card counts private rounds too and is
     * therefore the larger number. See the class doc.
     *
     * `options.limit` exists so the cap is assertable at a size a fixture can
     * reach, exactly like `FriendsActivityOptions.candidateLimit`; production
     * takes `COURSES_LIMIT`. `hasMore` reports truncation, so the ONE remaining
     * reason `coursesTotal` exceeds this list's length is the documented
     * private/`link` asymmetry.
     */
    async coursesFor(
        viewerPlayerId: string,
        subjectPlayerId: string,
        options: { limit?: number } = {},
    ): Promise<FriendProfileResult<FriendProfileCoursePage>> {
        const refused = await this.gate(viewerPlayerId, subjectPlayerId);
        if (refused) return refused;

        const limit = clampLimit(options.limit, COURSES_LIMIT, COURSES_LIMIT);
        // +1 row answers "was this truncated" without a second COUNT query.
        const rows = await this.coursesPlayed(subjectPlayerId, limit + 1).execute();
        const hasMore = rows.length > limit;
        const page = hasMore ? rows.slice(0, limit) : rows;

        return {
            ok: true,
            value: {
                courses: page.map((row) => ({
                    courseId: row.courseId,
                    courseName: row.courseName,
                    roundsPlayed: Number(row.roundsPlayed),
                    lastPlayedAt: row.lastPlayedAt,
                })),
                hasMore,
            },
        };
    }
}
