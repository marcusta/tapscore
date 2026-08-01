import { sql, type Kysely } from 'kysely';
import type { Database, RoundVisibility } from '../db/schema';

/**
 * Operator observability — READ ONLY.
 *
 * The whole point of this service is the one thing every other read path
 * deliberately refuses to do: look ACROSS players. Ordinary reads are either
 * caller-scoped (`DashboardService.forPlayer`) or token-scoped (the friendly
 * round front door); neither can answer "what is happening in the app". These
 * queries answer that, and are gated by `AdminAuthz.assertSuperAdmin` at the
 * API edge.
 *
 * Deliberately no mutation methods. Role administration lives in
 * `RoleService`; everything else an operator might want to change goes through
 * the normal, already-authorized paths.
 */

export interface AdminRoundSummary {
    roundId: string;
    /** The round's front door. Null when the round has no friendly wrapper. */
    shareToken: string | null;
    date: string;
    status: 'not_started' | 'active' | 'complete';
    /**
     * Who can discover the round (migration 049). Display-only here — the
     * operator answer to "why isn't this round in my friend's feed" (only
     * 'friends' rounds surface there); changing it stays on the token-scoped
     * round-settings path.
     */
    visibility: RoundVisibility;
    courseName: string | null;
    createdAt: string;
    completedAt: string | null;
    creatorPlayerId: string | null;
    creatorName: string | null;
    /** Display-name snapshots of every producer — registered, guest, or seat. */
    participants: string[];
    /** How many score events the round has accumulated (0 = never played). */
    scoreEventCount: number;
    /** Wall clock of the most recent score event; null when never played. */
    lastEventAt: string | null;
}

export interface AdminPlayerSummary {
    playerId: string;
    username: string;
    displayName: string;
    handicapIndex: number | null;
    createdAt: string;
    deletedAt: string | null;
    /** Distinct rounds this player produced a ball in. */
    roundCount: number;
    /** Date of the most recent round produced; null when they never played. */
    lastRoundDate: string | null;
    /** Unscoped role names held (scoped grants are not summarised here). */
    roles: string[];
}

export interface AdminStats {
    players: number;
    guests: number;
    rounds: number;
    roundsActive: number;
    roundsComplete: number;
    /** Rounds created in the last 7 days. */
    roundsLast7Days: number;
    scoreEvents: number;
}

export class AdminService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries ---

    /** Rounds newest-first, with the friendly wrapper joined for the token. */
    private roundPage(limit: number, offset: number) {
        return this.db
            .selectFrom('rounds as r')
            .leftJoin('friendly_rounds as fr', 'fr.round_id', 'r.id')
            .leftJoin('players as p', 'p.id', 'fr.creator_player_id')
            .select([
                'r.id as id',
                'r.date as date',
                'r.status as status',
                'r.visibility as visibility',
                'r.course_name_snapshot as course_name_snapshot',
                'r.created_at as created_at',
                'r.completed_at as completed_at',
                'fr.share_token as share_token',
                'fr.creator_player_id as creator_player_id',
                'p.display_name as creator_name',
            ])
            .orderBy('r.created_at', 'desc')
            .limit(limit)
            .offset(offset);
    }

    /** Producer display names per round, for the round ids on the page. */
    private participantsFor(roundIds: readonly string[]) {
        return this.db
            .selectFrom('ball_players as bp')
            .innerJoin('balls as b', 'b.id', 'bp.ball_id')
            .select(['b.round_id as round_id', 'bp.display_name_snapshot as name'])
            .where('b.round_id', 'in', roundIds)
            .orderBy('bp.display_name_snapshot');
    }

    /** Event count + latest event time per round, for the page's round ids. */
    private eventStatsFor(roundIds: readonly string[]) {
        return this.db
            .selectFrom('score_events')
            .select(({ fn }) => [
                'round_id',
                fn.countAll<number>().as('count'),
                fn.max<string>('recorded_at').as('last_at'),
            ])
            .where('round_id', 'in', roundIds)
            .groupBy('round_id');
    }

    // --- Methods ---

    /**
     * One page of rounds across ALL players, newest-first. Three queries, not
     * N+1: the page, then participants and event stats for the page's ids.
     */
    async listRounds(limit = 50, offset = 0): Promise<AdminRoundSummary[]> {
        const rows = await this.roundPage(limit, offset).execute();
        if (rows.length === 0) return [];

        const ids = rows.map((r) => r.id);
        const [names, stats] = await Promise.all([
            this.participantsFor(ids).execute(),
            this.eventStatsFor(ids).execute(),
        ]);

        const byRound = new Map<string, string[]>();
        for (const n of names) {
            const list = byRound.get(n.round_id);
            if (list) list.push(n.name);
            else byRound.set(n.round_id, [n.name]);
        }
        const statsByRound = new Map(stats.map((s) => [s.round_id, s]));

        return rows.map((r) => {
            const s = statsByRound.get(r.id);
            return {
                roundId: r.id,
                shareToken: r.share_token,
                date: r.date,
                status: r.status,
                visibility: r.visibility,
                courseName: r.course_name_snapshot,
                createdAt: r.created_at,
                completedAt: r.completed_at,
                creatorPlayerId: r.creator_player_id,
                creatorName: r.creator_name,
                participants: byRound.get(r.id) ?? [],
                scoreEventCount: Number(s?.count ?? 0),
                lastEventAt: s?.last_at ?? null,
            };
        });
    }

    /**
     * Every registered player with their activity. Soft-deleted players are
     * INCLUDED (with `deletedAt` set) — an operator view is exactly the place
     * that needs to see them; ordinary reads filter them out.
     */
    async listPlayers(): Promise<AdminPlayerSummary[]> {
        const players = await this.db
            .selectFrom('players')
            .select([
                'id',
                'username',
                'display_name',
                'handicap_index',
                'deleted_at',
                'created_at',
            ])
            .orderBy('created_at', 'desc')
            .execute();
        if (players.length === 0) return [];

        const ids = players.map((p) => p.id);
        const [activity, grants] = await Promise.all([
            this.db
                .selectFrom('ball_players as bp')
                .innerJoin('balls as b', 'b.id', 'bp.ball_id')
                .innerJoin('rounds as r', 'r.id', 'b.round_id')
                .select(({ fn }) => [
                    'bp.player_id as player_id',
                    fn.count<number>(sql`DISTINCT b.round_id`).as('round_count'),
                    fn.max<string>('r.date').as('last_date'),
                ])
                .where('bp.player_id', 'in', ids)
                .groupBy('bp.player_id')
                .execute(),
            this.db
                .selectFrom('role_grants')
                .select(['player_id', 'role'])
                .where('player_id', 'in', ids)
                .where('scope_type', 'is', null)
                .execute(),
        ]);

        const byPlayer = new Map(activity.map((a) => [a.player_id, a]));
        const rolesByPlayer = new Map<string, string[]>();
        for (const g of grants) {
            const list = rolesByPlayer.get(g.player_id);
            if (list) list.push(g.role);
            else rolesByPlayer.set(g.player_id, [g.role]);
        }

        return players.map((p) => {
            const a = byPlayer.get(p.id);
            return {
                playerId: p.id,
                username: p.username,
                displayName: p.display_name,
                handicapIndex: p.handicap_index,
                createdAt: p.created_at,
                deletedAt: p.deleted_at,
                roundCount: Number(a?.round_count ?? 0),
                lastRoundDate: a?.last_date ?? null,
                roles: rolesByPlayer.get(p.id) ?? [],
            };
        });
    }

    /** Headline counters for the operator landing view. */
    async stats(): Promise<AdminStats> {
        const count = async (
            table: 'players' | 'guest_players' | 'rounds' | 'score_events',
            where?: (q: any) => any,
        ): Promise<number> => {
            let q = this.db
                .selectFrom(table)
                .select(({ fn }) => fn.countAll<number>().as('n'));
            if (where) q = where(q);
            const row = await q.executeTakeFirst();
            return Number(row?.n ?? 0);
        };

        // SQLite date arithmetic in SQL keeps the cutoff off the JS clock, so
        // the number matches what the DB itself considers "now".
        const cutoff = sql<string>`datetime('now', '-7 days')`;

        const [players, guests, rounds, active, complete, last7, events] = await Promise.all([
            count('players', (q) => q.where('deleted_at', 'is', null)),
            count('guest_players'),
            count('rounds'),
            count('rounds', (q) => q.where('status', '=', 'active')),
            count('rounds', (q) => q.where('status', '=', 'complete')),
            count('rounds', (q) => q.where(sql`created_at`, '>=', cutoff)),
            count('score_events'),
        ]);

        return {
            players,
            guests,
            rounds,
            roundsActive: active,
            roundsComplete: complete,
            roundsLast7Days: last7,
            scoreEvents: events,
        };
    }
}
