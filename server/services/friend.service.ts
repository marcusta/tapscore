import type { Kysely, Selectable } from 'kysely';
import type { Database, FriendshipsTable } from '../db/schema';
import { ConflictError, NotFoundError } from '@basics/core/server/auth';
import type { PlayerProfile } from './player.service';
import { scoreFrecency } from '../domain/frecency';

// --- Output types ---

export interface Friendship {
    playerId: string;
    friendPlayerId: string;
    createdAt: string;
}

/**
 * A friend profile enriched with the caller's shared-play signals — the
 * inputs the client sorts on to float regulars to the top (see
 * `server/domain/frecency.ts` for the scoring formula). `sharedRoundCount`
 * counts rounds where BOTH the caller and this friend produced a ball;
 * `lastPlayedAt` is the most recent such round's date (null when never);
 * `frecency` is the recency-weighted frequency (0 when never).
 */
export interface FriendProfile extends PlayerProfile {
    sharedRoundCount: number;
    lastPlayedAt: string | null;
    frecency: number;
}

// --- Row mapping ---

type FriendshipRow = Selectable<FriendshipsTable>;

function toFriendship(row: FriendshipRow): Friendship {
    return {
        playerId: row.player_id,
        friendPlayerId: row.friend_player_id,
        createdAt: row.created_at,
    };
}

/**
 * One-directional contact list (PHASES.md 2026-07-03 friends-list request,
 * migration 033). No approval flow: adding a friend is a unilateral write,
 * not a request the other player accepts. `listFor(playerId)` only ever
 * returns rows where `playerId` is the ADDER (`friendships.player_id`) — the
 * reverse direction ("who added me") is out of spec for now.
 *
 * Duplicate-add semantics: IDEMPOTENT no-op, not a 409 conflict. A friends
 * list is a contact list, not a mutual-consent relationship — re-adding an
 * existing contact is not an error condition a client needs to branch on
 * (contrast with `GuestClaimService.claimGuest`, which 409s on a re-claim
 * because a claim is a one-time identity transfer with real consequences if
 * silently repeated). The composite primary key `(player_id,
 * friend_player_id)` on `friendships` is what makes the insert naturally
 * idempotent — `add()` checks first and returns the existing row rather than
 * relying on an `INSERT OR IGNORE` so the return type is always a real row.
 */
export class FriendService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private friendships() {
        return this.db.selectFrom('friendships').selectAll();
    }

    private row(playerId: string, friendPlayerId: string) {
        return this.friendships()
            .where('player_id', '=', playerId)
            .where('friend_player_id', '=', friendPlayerId);
    }

    private byPlayer(playerId: string) {
        return this.friendships().where('player_id', '=', playerId);
    }

    private activePlayerById(id: string) {
        return this.db
            .selectFrom('players')
            .selectAll()
            .where('id', '=', id)
            .where('deleted_at', 'is', null);
    }

    // --- Queries (write) ---

    private insertFriendship(values: { player_id: string; friend_player_id: string }) {
        return this.db.insertInto('friendships').values(values);
    }

    private deleteFriendship(playerId: string, friendPlayerId: string) {
        return this.db
            .deleteFrom('friendships')
            .where('player_id', '=', playerId)
            .where('friend_player_id', '=', friendPlayerId);
    }

    // --- Methods ---

    async add(playerId: string, friendId: string): Promise<Friendship> {
        // ConflictError → 409 via mount()'s error mapping. A plain Error would
        // surface as a 500; of the mapped classes, "conflicts with the state
        // of the resource" is the closest fit for self-friending (the schema's
        // CHECK would also refuse it, but as an opaque constraint failure).
        if (friendId === playerId) {
            throw new ConflictError('cannot add yourself as a friend');
        }

        const friend = await this.activePlayerById(friendId).executeTakeFirst();
        if (!friend) throw new NotFoundError('player not found');

        const existing = await this.row(playerId, friendId).executeTakeFirst();
        if (existing) return toFriendship(existing);

        await this.insertFriendship({ player_id: playerId, friend_player_id: friendId }).execute();
        const row = await this.row(playerId, friendId).executeTakeFirstOrThrow();
        return toFriendship(row);
    }

    /** Idempotent: removing a non-friend is a no-op, not an error. */
    async remove(playerId: string, friendId: string): Promise<void> {
        await this.deleteFriendship(playerId, friendId).execute();
    }

    /**
     * The caller's friend ids only — used to stamp `isFriend` on search
     * results without materialising full profiles.
     */
    async friendIdsFor(playerId: string): Promise<Set<string>> {
        const rows = await this.byPlayer(playerId).select('friend_player_id').execute();
        return new Set(rows.map((r) => r.friend_player_id));
    }

    /**
     * Rounds the caller and each friend BOTH produced a ball in — the raw
     * material for the frecency signals. ONE query, not N: it self-joins
     * `ball_players` (caller side ⋈ friend side) through the shared `balls →
     * rounds` chain, so every (friend, round) co-production comes back in a
     * single pass. Only registered producers count — the join keys on
     * `player_id`, so guest rows (`player_id IS NULL`) never match. DISTINCT
     * on (friend, round) collapses the case where two players shared several
     * balls in one round (e.g. multiple slots) to a single shared round.
     * Soft-deleted friends are filtered by the caller (`listFor`) via the
     * `players.deleted_at` guard, so no extra guard is needed here.
     */
    private sharedRounds(playerId: string) {
        return this.db
            .selectFrom('ball_players as me')
            .innerJoin('balls as mb', 'mb.id', 'me.ball_id')
            .innerJoin('rounds as r', 'r.id', 'mb.round_id')
            // The friend's ball in the SAME round, then the friend's producer
            // row on it.
            .innerJoin('balls as fb', 'fb.round_id', 'mb.round_id')
            .innerJoin('ball_players as friend', 'friend.ball_id', 'fb.id')
            .where('me.player_id', '=', playerId)
            .where('friend.player_id', 'is not', null)
            .whereRef('friend.player_id', '!=', 'me.player_id')
            .select(['friend.player_id as friendId', 'r.id as roundId', 'r.date as playedAt'])
            .distinct()
            .execute();
    }

    /**
     * Friend profiles, joined onto `players`, enriched with per-friend
     * shared-play signals (see `FriendProfile`). A friend who was soft-deleted
     * AFTER being added is excluded — the contact list should not surface a
     * dead account (matches how `PlayerService.listActive` treats soft
     * deletes elsewhere). The `friendships` row itself is left untouched
     * (not cleaned up) so a later hard-delete's cascading FK is the only
     * thing that ever removes it.
     *
     * `now` is injected (ISO-8601) and threaded straight into the pure
     * `scoreFrecency` domain function so ordering is deterministic; the API
     * layer passes `new Date().toISOString()`.
     */
    async listFor(playerId: string, now: string): Promise<FriendProfile[]> {
        const rows = await this.db
            .selectFrom('friendships')
            .innerJoin('players', 'players.id', 'friendships.friend_player_id')
            .leftJoin('clubs', 'clubs.id', 'players.home_club_id')
            .select([
                'players.id as id',
                'players.username as username',
                'players.display_name as displayName',
                'players.gender as gender',
                'players.handicap_index as handicapIndex',
                'clubs.name as homeClubName',
            ])
            .where('friendships.player_id', '=', playerId)
            .where('players.deleted_at', 'is', null)
            .orderBy('players.display_name')
            .execute();

        // One pass over the caller's co-production map, bucketed by friend.
        const byFriend = new Map<string, { playedAt: string }[]>();
        for (const s of await this.sharedRounds(playerId)) {
            const list = byFriend.get(s.friendId!) ?? [];
            list.push({ playedAt: s.playedAt });
            byFriend.set(s.friendId!, list);
        }

        return rows.map((row) => {
            const { sharedRoundCount, lastPlayedAt, frecency } = scoreFrecency(
                byFriend.get(row.id) ?? [],
                now,
            );
            return {
                ...row,
                homeClubName: row.homeClubName ?? null,
                sharedRoundCount,
                lastPlayedAt,
                frecency,
            };
        });
    }
}
