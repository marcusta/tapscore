import { sql, type Kysely } from 'kysely';

import type { Database, RoundStatus, RoundVisibility } from '../db/schema';
import { toIsoUtc } from '../domain/time';
import type { FriendService } from './friend.service';

// --- Output types ---

/**
 * One mutual friend inside a visible round, with their own progress. Progress
 * is per-FRIEND rather than per-round because a round can hold several of the
 * caller's friends and "Thru 7 · +3" is a statement about a person, not about
 * a scorecard. The home strip renders the leading friend; the rest are there so
 * a chip can say "Anna + 2".
 */
export interface FriendsActivityFriend {
    playerId: string;
    displayName: string;
    /** Content hash of their photo, null when they have none (migration 050).
     *  The feed's chips draw a face where there is one, initials otherwise. */
    avatarVersion: string | null;
    /** Holes with a recorded score on this friend's ball. */
    holesPlayed: number;
    /** Strokes minus par over exactly those holes; null before the first one. */
    scoreToPar: number | null;
}

/**
 * A round the caller may see because a mutual friend is in it. Deliberately
 * NOT carrying the round's share token — see `SpectateView` in
 * `spectate.service.ts` for why the token never travels a discovery path.
 * Navigation goes through the round id and the session-scoped spectate path.
 */
export interface FriendsActivityEntry {
    roundId: string;
    /** Organizer-supplied name; null ⇒ the client falls back to `courseName`. */
    name: string | null;
    courseName: string | null;
    date: string;
    status: RoundStatus;
    /** Length of the round's itinerary — the denominator behind "Thru 7". */
    holeCount: number;
    /** Most recent score event, ISO-8601 UTC; null when nothing is scored yet. */
    lastActivityAt: string | null;
    /** The caller's mutual friends in this round, by display name. */
    friends: FriendsActivityFriend[];
}

export interface FriendsActivity {
    live: FriendsActivityEntry[];
    recent: FriendsActivityEntry[];
}

/**
 * "On the course right now" — a round counts as live while its most recent
 * score event is under three hours old. Friendly rounds never lock, so
 * `status` is not a liveness signal (the standing rule: scores and setup stay
 * editable forever); activity recency is the only honest one. Three hours is
 * roughly a round plus a stop at the turn, and a round that goes stale drops
 * out of the strip silently — no "abandoned round" wording anywhere.
 */
export const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

/** Enough to scroll, small enough that no client needs paging in v1. */
const RECENT_LIMIT = 20;

/**
 * How many discoverable rounds the feed may aggregate over — the bound, and it
 * is applied BEFORE the expensive part. Everything downstream (five `IN (…)`
 * round-fact queries plus the scorecard aggregate) costs per candidate round,
 * and this is the home screen's request; unbounded it would grow with a
 * player's entire social history for a list that shows at most a handful of
 * chips and twenty rows.
 *
 * It is applied ON the same recency ordering the output sorts by (last score
 * event, falling back to the round date), so it keeps the NEWEST candidates:
 * `live` is by definition the most recently active set — a score inside
 * `LIVE_WINDOW_MS` — so it sorts above everything else, and `recent` still
 * fills its cap of 20 many times over.
 *
 * The one ordering the fallback gets wrong: `rounds.date` is caller-supplied
 * and unrestricted, so a never-scored round dated in the FUTURE sorts above a
 * genuinely live one. Pushing presence out would take more than
 * `CANDIDATE_LIMIT` such rounds among a caller's friends, so it is theoretical
 * — but the guarantee is "live sorts high", not "live is untruncatable".
 *
 * What it CAN hide: for a caller with more than this many discoverable friend
 * rounds, the least-recently-active ones beyond the cap — rounds that could
 * never have reached either list anyway, unless more than 200 of a player's
 * friends' rounds are live at the same instant.
 */
const CANDIDATE_LIMIT = 200;

export interface FriendsActivityOptions {
    /** Presence window override. Injected by tests so presence never depends on
     *  the wall clock; production takes the constant. */
    liveWindowMs?: number;
    recentLimit?: number;
    /** Pre-aggregation candidate bound override — see `CANDIDATE_LIMIT`.
     *  Injected by tests so the bound is asserted at a size a fixture can
     *  reach; production takes the constant. */
    candidateLimit?: number;
}

// --- Internals ---

interface RoundFacts {
    roundId: string;
    name: string | null;
    courseName: string | null;
    date: string;
    status: RoundStatus;
    holeCount: number;
    lastActivityAt: string | null;
    /** True while ANY ball still has an unscored hole in the itinerary. */
    hasUnplayedHoles: boolean;
}

/**
 * Discovery for the friends-on-the-course feature
 * (docs/proposals/friends-activity.md). Two jobs, one visibility rule:
 *
 *  - `activityFor` — the caller's feed of friends' rounds, split live/recent.
 *  - `canView` — the same rule, asked about one round, for the spectate path.
 *
 * The rule: a round is discoverable when it is not a competition round, its
 * `visibility` is 'friends' AND at least one PARTICIPANT is on the caller's
 * MUTUAL edge. Participation means
 * produced a ball (`ball_players.player_id`) or created the round
 * (`friendly_rounds.creator_player_id`) — you see a round because your friend
 * is in it, not only because your friend organised it. Mutual, never
 * unilateral: adding a contact is a one-way convenience for the roster picker,
 * and letting it grant visibility would make silent watching possible. If A can
 * see B's rounds, B has A in their own friends list.
 *
 * The caller's own rounds are excluded — this is the outward-facing counterpart
 * to `DashboardService`, not a superset of it.
 *
 * COMPETITION rounds are excluded from both, whatever their `visibility`:
 * they ride the same friendly wrapper, whose creator is whichever admin
 * materialised them, so a round of a competition still in `setup` would
 * otherwise surface in that admin's friends' feeds before the competition is
 * public. Competition discovery stays admin-gated. Same reason
 * `FriendlyRoundService.list` excludes them from the public landing.
 */
export class FriendsActivityService {
    constructor(
        private db: Kysely<Database>,
        private friends: FriendService,
    ) {}

    // --- Queries (participation) ---

    /**
     * Producer-side participation, restricted to a player set. Guests never
     * match: the column is null for them, so a guest can neither see nor be
     * seen through this path.
     */
    private producerParticipation(playerIds: string[]) {
        return this.db
            .selectFrom('balls as b')
            .innerJoin('ball_players as bp', 'bp.ball_id', 'b.id')
            .where('bp.player_id', 'in', playerIds)
            .select(['b.round_id as roundId', 'bp.player_id as playerId'])
            .distinct();
    }

    /** Creator-side participation — a creator need not have played. */
    private creatorParticipation(playerIds: string[]) {
        return this.db
            .selectFrom('friendly_rounds as fr')
            .where('fr.creator_player_id', 'in', playerIds)
            .select(['fr.round_id as roundId', 'fr.creator_player_id as playerId'])
            .distinct();
    }

    /**
     * Both participation sides, folded into `round → participants`. Two queries
     * rather than a UNION so the row types stay plain: the union of two
     * `(round, player)` streams is a set operation JS does as well as SQL, and
     * the inputs are already bounded by a small player set.
     */
    private async participationByRound(playerIds: string[]): Promise<Map<string, Set<string>>> {
        const byRound = new Map<string, Set<string>>();
        if (playerIds.length === 0) return byRound;
        const rows = [
            ...(await this.producerParticipation(playerIds).execute()),
            ...(await this.creatorParticipation(playerIds).execute()),
        ];
        for (const row of rows) {
            if (row.playerId === null) continue;
            const set = byRound.get(row.roundId) ?? new Set<string>();
            set.add(row.playerId);
            byRound.set(row.roundId, set);
        }
        return byRound;
    }

    /** Every participant of ONE round — the spectate gate's input. */
    private async participantsOf(roundId: string): Promise<Set<string>> {
        const producers = await this.db
            .selectFrom('balls as b')
            .innerJoin('ball_players as bp', 'bp.ball_id', 'b.id')
            .where('b.round_id', '=', roundId)
            .where('bp.player_id', 'is not', null)
            .select('bp.player_id as playerId')
            .distinct()
            .execute();
        const creators = await this.db
            .selectFrom('friendly_rounds')
            .where('round_id', '=', roundId)
            .where('creator_player_id', 'is not', null)
            .select('creator_player_id as playerId')
            .execute();
        const out = new Set<string>();
        for (const row of [...producers, ...creators]) {
            if (row.playerId !== null) out.add(row.playerId);
        }
        return out;
    }

    // --- Queries (discoverability) ---

    /**
     * The discoverable subset of a candidate round set — THE feed's
     * authorization predicate and its bound in one query:
     *
     *  - `visibility = 'friends'`: `private` is the opt-out and `link` is a
     *    spectate widening, never a discovery channel;
     *  - not a competition round (the anti-join on `competition_rounds` — see
     *    the class doc for why, and `FriendlyRoundService.list` for the
     *    precedent);
     *  - not one of the caller's own rounds (those are the dashboard's job);
     *  - newest-activity first, capped at `CANDIDATE_LIMIT` BEFORE any
     *    aggregation runs over the result.
     *
     * The recency expression mirrors `factsForRounds`: `score_events.recorded_at`
     * is either SQLite's `YYYY-MM-DD HH:MM:SS` default or a caller-supplied ISO
     * string, so it is normalised to the space form before MAX(), and a round
     * with no scores at all falls back to its date — the only signal it has.
     */
    private discoverableRounds(candidateIds: string[], excludeIds: string[], limit: number) {
        let q = this.db
            .selectFrom('rounds as r')
            .leftJoin('competition_rounds as cr', 'cr.round_id', 'r.id')
            .where('cr.id', 'is', null)
            .where('r.id', 'in', candidateIds)
            .where('r.visibility', '=', 'friends' satisfies RoundVisibility)
            .select([
                'r.id as id',
                sql<string>`COALESCE((SELECT MAX(REPLACE(REPLACE(se.recorded_at, 'T', ' '), 'Z', '')) FROM score_events se WHERE se.round_id = r.id), r.date)`.as(
                    'recency',
                ),
            ])
            .orderBy('recency', 'desc')
            .limit(limit);
        // `not in ()` is not valid SQL — only constrain when there is something
        // to exclude.
        if (excludeIds.length > 0) q = q.where('r.id', 'not in', excludeIds);
        return q;
    }

    /**
     * The spectate gate's round read: the visibility value plus whether the
     * round is a competition round. ONE row, because the two facts are one
     * decision — a competition round is undiscoverable whatever its
     * `visibility`, and reading them apart would invite a caller to branch on
     * only half the predicate.
     */
    private discoverabilityOf(roundId: string) {
        return this.db
            .selectFrom('rounds as r')
            .leftJoin('competition_rounds as cr', 'cr.round_id', 'r.id')
            .where('r.id', '=', roundId)
            .select(['r.visibility as visibility', 'cr.id as competitionRoundId']);
    }

    /**
     * How a known player set is DRAWN — the feed's only display read. Name and
     * photo version travel together because they are the same question asked
     * once: what does this chip render? The BLOB is not selected; `version` is
     * all a chip needs to decide between a face and initials.
     */
    private identitiesFor(playerIds: string[]) {
        return this.db
            .selectFrom('players')
            .leftJoin('player_avatars', 'player_avatars.player_id', 'players.id')
            .select([
                'players.id as id',
                'players.display_name as display_name',
                'player_avatars.version as avatarVersion',
            ])
            .where('players.id', 'in', playerIds);
    }

    // --- Queries (round facts) ---

    private async factsForRounds(roundIds: string[]): Promise<Map<string, RoundFacts>> {
        const facts = new Map<string, RoundFacts>();
        if (roundIds.length === 0) return facts;

        const rounds = await this.db
            .selectFrom('rounds')
            .select(['id', 'name', 'course_name_snapshot', 'date', 'status'])
            .where('id', 'in', roundIds)
            .execute();

        const holes = await this.db
            .selectFrom('round_play_holes')
            .select(['round_id', (eb) => eb.fn.countAll<number>().as('holeCount')])
            .where('round_id', 'in', roundIds)
            .groupBy('round_id')
            .execute();
        const holeCounts = new Map(holes.map((h) => [h.round_id, Number(h.holeCount)]));

        const ballCountRows = await this.db
            .selectFrom('balls')
            .select(['round_id', (eb) => eb.fn.countAll<number>().as('ballCount')])
            .where('round_id', 'in', roundIds)
            .groupBy('round_id')
            .execute();
        const ballCounts = new Map(ballCountRows.map((b) => [b.round_id, Number(b.ballCount)]));

        // Filled cells across every ball in the round. Compared against
        // `balls × holes` below: cheaper than asking "is there a hole nobody
        // scored" per ball, and equivalent — `scorecards` only ever holds a row
        // for a hole that was scored at least once.
        const filledRows = await this.db
            .selectFrom('scorecards as sc')
            .innerJoin('balls as b', 'b.id', 'sc.ball_id')
            .select(['b.round_id as roundId', (eb) => eb.fn.countAll<number>().as('filled')])
            .where('b.round_id', 'in', roundIds)
            .where('sc.strokes', 'is not', null)
            .groupBy('b.round_id')
            .execute();
        const filled = new Map(filledRows.map((f) => [f.roundId, Number(f.filled)]));

        // `score_events.recorded_at` is EITHER SQLite's `YYYY-MM-DD HH:MM:SS`
        // default or a caller-supplied ISO string, so a raw MAX() would order
        // the two formats against each other by the accident that ' ' < 'T'.
        // Normalising to the space form inside the aggregate makes the
        // comparison textual-safe; `toIsoUtc` puts it back on the way out.
        const activity = await this.db
            .selectFrom('score_events')
            .select([
                'round_id',
                sql<
                    string | null
                >`MAX(REPLACE(REPLACE(recorded_at, 'T', ' '), 'Z', ''))`.as('lastActivityAt'),
            ])
            .where('round_id', 'in', roundIds)
            .groupBy('round_id')
            .execute();
        const lastActivity = new Map(activity.map((a) => [a.round_id, a.lastActivityAt]));

        for (const round of rounds) {
            const holeCount = holeCounts.get(round.id) ?? 0;
            const cells = (ballCounts.get(round.id) ?? 0) * holeCount;
            const raw = lastActivity.get(round.id) ?? null;
            facts.set(round.id, {
                roundId: round.id,
                name: round.name,
                courseName: round.course_name_snapshot,
                date: round.date,
                status: round.status,
                holeCount,
                lastActivityAt: raw === null ? null : toIsoUtc(raw),
                hasUnplayedHoles: (filled.get(round.id) ?? 0) < cells,
            });
        }
        return facts;
    }

    /**
     * Per-friend progress: holes scored and strokes-to-par, per BALL, so the
     * caller below can pick one. A friend can produce several balls in a round
     * (their own plus a shared team ball); those balls carry different scores,
     * and summing them would report a nonsense "Thru 36". The ball with the
     * most scored holes is the one they are actually playing.
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
     *    in this friend's own score-to-par.
     *
     * So: keep only rows attributable to the friend the row is ABOUT — a
     * correlated comparison against `bp.player_id`, not a constant, because
     * this query answers for a whole player set at once — or to nobody in
     * particular (the untagged row an individual/foursomes slot writes). Then
     * reduce to ONE row per (ball, play_hole) before counting or summing.
     * `MIN(sc.strokes)` is that reduction: after the source filter, several
     * surviving rows for one hole mean the same entry recorded through more
     * than one format slot, so they carry the same strokes and any pick returns
     * the same number; MIN is chosen because it is deterministic, so repeated
     * reads agree, and because where they ever DID disagree it reports the
     * better score rather than inventing a worse one.
     *
     * Note the GUEST half of the untagged arm. `source_key` coalesces BOTH
     * source columns, so a guest sharing the friend's ball writes rows with
     * `source_player_id IS NULL` and their identity in `source_guest_player_id`
     * — the foursomes failure mode again, wearing the untagged row's clothes.
     * Requiring both columns null is what makes "untagged" mean "nobody's in
     * particular, therefore the ball's". A guest who later claims their account
     * keeps their holes: `GuestClaimService.claimGuest` rewrites
     * `source_guest_player_id` into `source_player_id`, which the first arm
     * then matches.
     */
    private async progressRows(roundIds: string[], playerIds: string[]) {
        if (roundIds.length === 0 || playerIds.length === 0) return [];
        return this.db
            .selectFrom((eb) =>
                eb
                    .selectFrom('scorecards as sc')
                    .innerJoin('balls as b', 'b.id', 'sc.ball_id')
                    .innerJoin('ball_players as bp', 'bp.ball_id', 'sc.ball_id')
                    .where('b.round_id', 'in', roundIds)
                    .where('bp.player_id', 'in', playerIds)
                    .where('sc.strokes', 'is not', null)
                    .where((w) =>
                        w.or([
                            w('sc.source_player_id', '=', w.ref('bp.player_id')),
                            w.and([
                                w('sc.source_player_id', 'is', null),
                                w('sc.source_guest_player_id', 'is', null),
                            ]),
                        ]),
                    )
                    .select([
                        'b.round_id as roundId',
                        'bp.player_id as playerId',
                        'sc.ball_id as ballId',
                        'sc.play_hole_id as playHoleId',
                        sql<number>`MIN(sc.strokes)`.as('strokes'),
                    ])
                    .groupBy([
                        'b.round_id',
                        'bp.player_id',
                        'sc.ball_id',
                        'sc.play_hole_id',
                    ])
                    .as('hole'),
            )
            .innerJoin('round_play_holes as ph', 'ph.id', 'hole.playHoleId')
            .select([
                'hole.roundId as roundId',
                'hole.playerId as playerId',
                'hole.ballId as ballId',
                (eb) => eb.fn.countAll<number>().as('holesPlayed'),
                sql<number | null>`SUM(hole.strokes - ph.par)`.as('scoreToPar'),
            ])
            .groupBy(['hole.roundId', 'hole.playerId', 'hole.ballId'])
            .execute();
    }

    // --- Methods ---

    /**
     * The caller's friends feed. `now` is injected (ISO-8601) rather than read
     * from the clock, matching `FriendService.listFor` — the presence window is
     * a comparison against it, so tests pin both ends and never race the wall
     * clock. The API layer passes `new Date().toISOString()`.
     */
    async activityFor(
        playerId: string,
        now: string,
        options: FriendsActivityOptions = {},
    ): Promise<FriendsActivity> {
        const liveWindowMs = options.liveWindowMs ?? LIVE_WINDOW_MS;
        const recentLimit = options.recentLimit ?? RECENT_LIMIT;
        const candidateLimit = options.candidateLimit ?? CANDIDATE_LIMIT;

        const mutualIds = [...(await this.friends.mutualFriendIdsFor(playerId))];
        if (mutualIds.length === 0) return { live: [], recent: [] };

        // Friends' participation, then the visibility filter. Filtering rounds
        // AFTER collecting participation (rather than joining `rounds` into
        // both participation queries) keeps the two queries reusable for the
        // spectate gate, where the visibility branch is different.
        const byRound = await this.participationByRound(mutualIds);
        if (byRound.size === 0) return { live: [], recent: [] };

        // The caller's OWN rounds are the dashboard's job, not this feed's —
        // subtracted INSIDE the candidate query so they cannot eat cap slots.
        const mine = await this.participationByRound([playerId]);
        const candidates = await this.discoverableRounds(
            [...byRound.keys()],
            [...mine.keys()],
            candidateLimit,
        ).execute();
        const roundIds = candidates.map((r) => r.id);
        if (roundIds.length === 0) return { live: [], recent: [] };

        // Everything below aggregates PER ROUND over `roundIds`, which is why
        // the bound is above it and not at the end (see `CANDIDATE_LIMIT`).
        const facts = await this.factsForRounds(roundIds);
        const identities = new Map(
            (await this.identitiesFor(mutualIds).execute()).map((p) => [
                p.id,
                { displayName: p.display_name, avatarVersion: p.avatarVersion ?? null },
            ]),
        );

        // Best ball per (round, friend) — see `progressRows`. Ties break on
        // ball id so repeated reads agree with each other.
        const best = new Map<string, { ballId: string; holesPlayed: number; scoreToPar: number }>();
        for (const row of await this.progressRows(roundIds, mutualIds)) {
            if (row.playerId === null) continue;
            const key = `${row.roundId}|${row.playerId}`;
            const holesPlayed = Number(row.holesPlayed);
            const current = best.get(key);
            const better =
                current === undefined ||
                holesPlayed > current.holesPlayed ||
                (holesPlayed === current.holesPlayed && row.ballId < current.ballId);
            if (better) {
                best.set(key, {
                    ballId: row.ballId,
                    holesPlayed,
                    scoreToPar: Number(row.scoreToPar ?? 0),
                });
            }
        }

        const entries: FriendsActivityEntry[] = [];
        for (const roundId of roundIds) {
            const fact = facts.get(roundId);
            if (fact === undefined) continue;
            const friends: FriendsActivityFriend[] = [];
            for (const friendId of byRound.get(roundId) ?? []) {
                const progress = best.get(`${roundId}|${friendId}`);
                const identity = identities.get(friendId);
                friends.push({
                    playerId: friendId,
                    displayName: identity?.displayName ?? '',
                    avatarVersion: identity?.avatarVersion ?? null,
                    holesPlayed: progress?.holesPlayed ?? 0,
                    scoreToPar: progress === undefined ? null : progress.scoreToPar,
                });
            }
            friends.sort((a, b) => a.displayName.localeCompare(b.displayName));
            entries.push({
                roundId,
                name: fact.name,
                courseName: fact.courseName,
                date: fact.date,
                status: fact.status,
                holeCount: fact.holeCount,
                lastActivityAt: fact.lastActivityAt,
                friends,
            });
        }

        const nowMs = Date.parse(now);
        const isLive = (entry: FriendsActivityEntry): boolean => {
            const fact = facts.get(entry.roundId)!;
            if (fact.lastActivityAt === null) return false;
            if (entry.status === 'complete') return false;
            if (!fact.hasUnplayedHoles) return false;
            return nowMs - Date.parse(fact.lastActivityAt) <= liveWindowMs;
        };

        // Newest activity first in both lists; a round with no scores at all
        // sorts on its date, which is the only signal it has.
        const byRecency = (a: FriendsActivityEntry, b: FriendsActivityEntry): number =>
            (b.lastActivityAt ?? b.date).localeCompare(a.lastActivityAt ?? a.date);

        const live = entries.filter(isLive).sort(byRecency);
        const liveIds = new Set(live.map((e) => e.roundId));
        const recent = entries
            .filter((e) => !liveIds.has(e.roundId))
            .sort(byRecency)
            .slice(0, recentLimit);
        return { live, recent };
    }

    /**
     * May `viewerPlayerId` open this round's read-only spectate view? The one
     * authorization seam for the session-scoped read path and its SSE sibling
     * — both call it, and the SSE re-asks on every emit so that removing a
     * friend or flipping a round to `private` closes an already-open stream.
     *
     * `null` means the round does not exist, which the API turns into a 404;
     * `false` is a 403. The two are kept apart deliberately: a spectator who
     * mistypes a round id deserves a different answer from one who is refused.
     */
    async canView(roundId: string, viewerPlayerId: string): Promise<boolean | null> {
        const round = await this.discoverabilityOf(roundId).executeTakeFirst();
        if (!round) return null;

        // Participants first, and independent of visibility: `private` means
        // "nobody else", never "not even me". A competition round's own
        // players still reach it this way — what the exclusion below closes is
        // the outsider path, not the participant one.
        const participants = await this.participantsOf(roundId);
        if (participants.has(viewerPlayerId)) return true;

        // Competition rounds are not spectatable from the outside, whatever
        // their `visibility` — see the class doc. Their audience is the
        // admin-gated competition read, not a friend's home screen.
        if (round.competitionRoundId !== null) return false;

        switch (round.visibility) {
            case 'link':
                // Holding the round id IS the credential — the same bargain the
                // share token makes, minus the write half, plus a session.
                return true;
            case 'private':
                return false;
            case 'friends': {
                const mutual = await this.friends.mutualFriendIdsFor(viewerPlayerId);
                for (const participant of participants) {
                    if (mutual.has(participant)) return true;
                }
                return false;
            }
        }
    }
}
