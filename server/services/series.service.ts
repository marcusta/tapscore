import { sql, type Insertable, type Kysely, type Selectable } from 'kysely';
import type {
    Database,
    RoundStatus,
    SeriesPointSourcesTable,
    SeriesRoundsTable,
    SeriesTable,
    TeamMembersTable,
    TeamsTable,
} from '../db/schema';
import {
    findTeamPointsRule,
    hasTeamPointsRule,
    listTeamPointsRules,
    type TeamPointsRow,
    type TeamPointsShare,
} from '../domain/team-points/rule';
import type { GuestPlayerService } from './guest-player.service';
import type { LeaderboardService, ScoredSlot } from './leaderboard.service';
import type { PlayerService } from './player.service';

// --- Output types ---

export interface SeriesTeamMember {
    id: string;
    playerId: string | null;
    guestPlayerId: string | null;
    displayName: string;
}

export interface SeriesTeam {
    id: string;
    name: string;
    /** Colour TOKEN name; each client maps it to its own palette. */
    colour: string;
    members: SeriesTeamMember[];
}

export interface SeriesSummary {
    id: string;
    name: string;
    /** READ link for the board. Not a write credential. */
    shareToken: string;
    ownerPlayerId: string;
    createdAt: string;
}

export interface SeriesRoundBall {
    ballId: string;
    label: string;
    teamId: string | null;
}

export interface SeriesRoundSlot {
    slotDefId: string;
    formatLabel: string;
    /** The registered rule whose shape fits this slot, or null. */
    suggestedRuleId: string | null;
}

/** One attached round in the setup read. Deliberately WITHOUT the round's share
 *  token: that is the round's write credential (AGENTS.md cross-player reads). */
export interface SeriesRoundDetail {
    id: string;
    roundId: string;
    label: string;
    ordinal: number;
    roundName: string;
    date: string;
    status: RoundStatus;
    balls: SeriesRoundBall[];
    slots: SeriesRoundSlot[];
    /** Set when the round could not be scored. */
    problem?: string;
}

export interface SeriesPointSource {
    id: string;
    seriesRoundId: string | null;
    slotDefId: string | null;
    ruleId: string;
    config: unknown;
    label: string;
    ordinal: number;
}

export interface SeriesDetail extends SeriesSummary {
    teams: SeriesTeam[];
    rounds: SeriesRoundDetail[];
    sources: SeriesPointSource[];
}

export interface SeriesBoardTeam {
    teamId: string;
    name: string;
    colour: string;
    /** Decided points plus the projection from contests still in play. */
    points: number;
    /** Points from finished contests only. */
    decided: number;
}

export interface SeriesBoardSource {
    id: string;
    label: string;
    ruleLabel: string;
    rows: TeamPointsRow[];
    /** Sum of the rows, per team, in series order. */
    points: TeamPointsShare[];
    live: boolean;
}

export interface SeriesBoardSession {
    /** Null for the group of sources filed under no round. */
    seriesRoundId: string | null;
    label: string;
    roundName: string | null;
    date: string | null;
    status: RoundStatus | null;
    sources: SeriesBoardSource[];
    problem?: string;
}

export interface SeriesBoard {
    id: string;
    name: string;
    teams: SeriesBoardTeam[];
    sessions: SeriesBoardSession[];
    /** True while any row is projected; the client polls on it. */
    live: boolean;
}

// --- Refusals ---

export type SeriesRefusalCode =
    | 'series_not_found'
    | 'team_not_found'
    | 'team_not_in_series'
    | 'member_not_found'
    | 'member_exists'
    | 'invalid_player_ref'
    | 'player_not_found'
    | 'round_not_found'
    | 'round_already_attached'
    | 'series_round_not_found'
    | 'ball_not_in_round'
    | 'unknown_rule'
    | 'invalid_config'
    | 'source_not_found'
    | 'invalid_name';

export interface SeriesRefusal {
    code: SeriesRefusalCode;
    message: string;
}

export type SeriesResult<T> = { ok: true; value: T } | { ok: false; refusal: SeriesRefusal };

function refuse(code: SeriesRefusalCode, message: string): { ok: false; refusal: SeriesRefusal } {
    return { ok: false, refusal: { code, message } };
}

function ok<T>(value: T): { ok: true; value: T } {
    return { ok: true, value };
}

// --- Inputs ---

export interface CreateSeriesInput {
    name: string;
    ownerPlayerId: string;
    teams: { name: string; colour: string }[];
}

export type MemberRef =
    | { kind: 'player'; playerId: string }
    | { kind: 'guest'; displayName: string };

export interface UpsertSourceInput {
    seriesId: string;
    /** Absent = create. */
    id?: string;
    seriesRoundId?: string | null;
    slotDefId?: string | null;
    ruleId: string;
    config?: unknown;
    label: string;
}

// --- Row mapping ---

type SeriesRow = Selectable<SeriesTable>;
type TeamRow = Selectable<TeamsTable>;
type MemberRow = Selectable<TeamMembersTable>;
type SeriesRoundRow = Selectable<SeriesRoundsTable>;
type SourceRow = Selectable<SeriesPointSourcesTable>;

function toSummary(row: SeriesRow): SeriesSummary {
    return {
        id: row.id,
        name: row.name,
        shareToken: row.share_token,
        ownerPlayerId: row.owner_player_id,
        createdAt: row.created_at,
    };
}

function toMember(row: MemberRow): SeriesTeamMember {
    return {
        id: row.id,
        playerId: row.player_id,
        guestPlayerId: row.guest_player_id,
        displayName: row.display_name_snapshot,
    };
}

function toSource(row: SourceRow): SeriesPointSource {
    return {
        id: row.id,
        seriesRoundId: row.series_round_id,
        slotDefId: row.slot_def_id,
        ruleId: row.rule_id,
        config: JSON.parse(row.config_json),
        label: row.label,
        ordinal: row.ordinal,
    };
}

function norm(name: string): string {
    return name.trim().toLocaleLowerCase();
}

/**
 * The registered rule whose shape fits a scored slot, or null. Decided by the
 * rule's declared `appliesTo` against what the result carries, never by a rule
 * or format id.
 */
function suggestedRuleFor(slot: ScoredSlot): string | null {
    const shape = (slot.result.pairResults?.length ?? 0) > 0 ? 'match' : 'ranked';
    return listTeamPointsRules().find((r) => r.descriptor.appliesTo === shape)?.descriptor.id ?? null;
}

interface RoundFacts {
    name: string;
    date: string;
    status: RoundStatus;
}

/**
 * Series = teams + attached rounds + point sources (spec §6, §19; Phase 6).
 *
 * A series holds ordinary rounds directly through `series_rounds`, the same 1:1
 * wrapper shape as `friendly_rounds` and `competition_rounds`. Each point
 * source folds one slot of an attached round through a registered
 * TeamPointsRule, or carries hand-entered points. The board is computed on
 * every read from the live round; nothing is stored, so a score correction in
 * the round moves the series total with no invalidation step.
 *
 * Trust model:
 *   - the board is read by series share token (the link model);
 *   - attaching a round needs that ROUND's share token, its write credential,
 *     so only someone who could already edit the round can publish it here;
 *   - no read returns a round share token.
 *
 * Authorization is NOT enforced here. SeriesAuthz gates mutations at the API
 * edge (owner or a `series_admin` grant).
 */
export class SeriesService {
    constructor(
        private db: Kysely<Database>,
        private players: PlayerService,
        private guests: GuestPlayerService,
        private leaderboards: LeaderboardService,
    ) {}

    // --- Queries ---

    private seriesRows(db: Kysely<Database> = this.db) {
        return db.selectFrom('series').selectAll();
    }

    private seriesForMember(playerId: string) {
        return this.db
            .selectFrom('series_teams')
            .innerJoin('team_members', 'team_members.team_id', 'series_teams.team_id')
            .select('series_teams.series_id')
            .where('team_members.player_id', '=', playerId);
    }

    private insertSeries(values: Insertable<SeriesTable>, db: Kysely<Database> = this.db) {
        return db.insertInto('series').values(values);
    }

    private updateSeriesName(id: string, name: string) {
        return this.db.updateTable('series').set({ name }).where('id', '=', id);
    }

    private deleteSeriesRow(id: string, db: Kysely<Database> = this.db) {
        return db.deleteFrom('series').where('id', '=', id);
    }

    private teamRowsForSeries(seriesId: string, db: Kysely<Database> = this.db) {
        return db
            .selectFrom('series_teams')
            .innerJoin('teams', 'teams.id', 'series_teams.team_id')
            .selectAll('teams')
            .where('series_teams.series_id', '=', seriesId)
            .orderBy('series_teams.ordinal', 'asc');
    }

    private teamIdsForSeries(seriesId: string, db: Kysely<Database> = this.db) {
        return db.selectFrom('series_teams').select('team_id').where('series_id', '=', seriesId);
    }

    private insertTeam(values: Insertable<TeamsTable>, db: Kysely<Database> = this.db) {
        return db.insertInto('teams').values(values);
    }

    private insertSeriesTeam(
        seriesId: string,
        teamId: string,
        ordinal: number,
        db: Kysely<Database> = this.db,
    ) {
        return db
            .insertInto('series_teams')
            .values({ series_id: seriesId, team_id: teamId, ordinal });
    }

    private nextTeamOrdinal(seriesId: string) {
        return this.db
            .selectFrom('series_teams')
            .select(sql<number>`coalesce(max(ordinal), -1) + 1`.as('next'))
            .where('series_id', '=', seriesId);
    }

    private updateTeamRow(id: string, patch: { name?: string; colour?: string }) {
        return this.db.updateTable('teams').set(patch).where('id', '=', id);
    }

    private deleteTeamRow(id: string, db: Kysely<Database> = this.db) {
        return db.deleteFrom('teams').where('id', '=', id);
    }

    private memberRowsForTeams(teamIds: string[], db: Kysely<Database> = this.db) {
        return db
            .selectFrom('team_members')
            .selectAll()
            .where('team_id', 'in', teamIds)
            .orderBy(sql`rowid`, 'asc');
    }

    private memberById(id: string) {
        return this.db.selectFrom('team_members').selectAll().where('id', '=', id);
    }

    private insertMember(values: Insertable<TeamMembersTable>) {
        return this.db.insertInto('team_members').values(values);
    }

    private deleteMemberRow(id: string) {
        return this.db.deleteFrom('team_members').where('id', '=', id);
    }

    private seriesRoundRows(seriesId: string, db: Kysely<Database> = this.db) {
        return db
            .selectFrom('series_rounds')
            .selectAll()
            .where('series_id', '=', seriesId)
            .orderBy('ordinal', 'asc');
    }

    private seriesRoundById(id: string, db: Kysely<Database> = this.db) {
        return db.selectFrom('series_rounds').selectAll().where('id', '=', id);
    }

    private seriesRoundByRoundId(roundId: string) {
        return this.db.selectFrom('series_rounds').select('id').where('round_id', '=', roundId);
    }

    private nextRoundOrdinal(seriesId: string) {
        return this.db
            .selectFrom('series_rounds')
            .select(sql<number>`coalesce(max(ordinal), -1) + 1`.as('next'))
            .where('series_id', '=', seriesId);
    }

    private insertSeriesRound(
        values: Insertable<SeriesRoundsTable>,
        db: Kysely<Database> = this.db,
    ) {
        return db.insertInto('series_rounds').values(values);
    }

    private updateSeriesRoundLabel(id: string, label: string) {
        return this.db.updateTable('series_rounds').set({ label }).where('id', '=', id);
    }

    private deleteSeriesRoundRow(id: string) {
        return this.db.deleteFrom('series_rounds').where('id', '=', id);
    }

    private roundIdByShareToken(token: string) {
        return this.db
            .selectFrom('friendly_rounds')
            .select('round_id')
            .where('share_token', '=', token);
    }

    private roundFactRows(roundIds: string[]) {
        return this.db
            .selectFrom('rounds')
            .select(['id', 'name', 'course_name_snapshot', 'date', 'status'])
            .where('id', 'in', roundIds);
    }

    private ballIdentityRows(roundId: string) {
        return this.db
            .selectFrom('balls')
            .innerJoin('ball_players', 'ball_players.ball_id', 'balls.id')
            .select([
                'balls.id as ball_id',
                'ball_players.player_id',
                'ball_players.guest_player_id',
                'ball_players.display_name_snapshot',
            ])
            .where('balls.round_id', '=', roundId);
    }

    private ballTeamRows(seriesRoundIds: string[], db: Kysely<Database> = this.db) {
        return db
            .selectFrom('series_round_ball_teams')
            .selectAll()
            .where('series_round_id', 'in', seriesRoundIds);
    }

    private upsertBallTeam(
        seriesRoundId: string,
        ballId: string,
        teamId: string,
        db: Kysely<Database> = this.db,
    ) {
        return db
            .insertInto('series_round_ball_teams')
            .values({ series_round_id: seriesRoundId, ball_id: ballId, team_id: teamId })
            .onConflict((oc) =>
                oc.columns(['series_round_id', 'ball_id']).doUpdateSet({ team_id: teamId }),
            );
    }

    private deleteBallTeam(seriesRoundId: string, ballId: string) {
        return this.db
            .deleteFrom('series_round_ball_teams')
            .where('series_round_id', '=', seriesRoundId)
            .where('ball_id', '=', ballId);
    }

    private sourceRows(seriesId: string, db: Kysely<Database> = this.db) {
        return db
            .selectFrom('series_point_sources')
            .selectAll()
            .where('series_id', '=', seriesId)
            .orderBy('ordinal', 'asc');
    }

    private sourceById(id: string) {
        return this.db.selectFrom('series_point_sources').selectAll().where('id', '=', id);
    }

    private nextSourceOrdinal(seriesId: string, db: Kysely<Database> = this.db) {
        return db
            .selectFrom('series_point_sources')
            .select(sql<number>`coalesce(max(ordinal), -1) + 1`.as('next'))
            .where('series_id', '=', seriesId);
    }

    private insertSource(
        values: Insertable<SeriesPointSourcesTable>,
        db: Kysely<Database> = this.db,
    ) {
        return db.insertInto('series_point_sources').values(values);
    }

    private updateSourceRow(
        id: string,
        patch: { rule_id: string; config_json: string; label: string },
    ) {
        return this.db.updateTable('series_point_sources').set(patch).where('id', '=', id);
    }

    private deleteSourceRow(id: string) {
        return this.db.deleteFrom('series_point_sources').where('id', '=', id);
    }

    // --- Methods ---

    async get(id: string): Promise<SeriesSummary | null> {
        const row = await this.seriesRows().where('id', '=', id).executeTakeFirst();
        return row ? toSummary(row) : null;
    }

    async getByShareToken(token: string): Promise<SeriesSummary | null> {
        const row = await this.seriesRows().where('share_token', '=', token).executeTakeFirst();
        return row ? toSummary(row) : null;
    }

    /** Series the player owns, administers (`alsoIncludeIds`) or plays in. */
    async listForPlayer(playerId: string, alsoIncludeIds: string[] = []): Promise<SeriesSummary[]> {
        const memberOf = (await this.seriesForMember(playerId).execute()).map((r) => r.series_id);
        const ids = [...new Set([...alsoIncludeIds, ...memberOf])];
        const rows = await this.seriesRows()
            .where((eb) =>
                eb.or([
                    eb('owner_player_id', '=', playerId),
                    ...(ids.length > 0 ? [eb('id', 'in', ids)] : []),
                ]),
            )
            .orderBy(sql`rowid`, 'desc')
            .execute();
        return rows.map(toSummary);
    }

    async create(input: CreateSeriesInput): Promise<SeriesResult<SeriesSummary>> {
        const name = input.name.trim();
        if (name.length === 0) return refuse('invalid_name', 'Give the event a name.');
        if (input.teams.some((t) => t.name.trim().length === 0)) {
            return refuse('invalid_name', 'Give every team a name.');
        }
        const id = crypto.randomUUID();
        await this.db.transaction().execute(async (trx) => {
            await this.insertSeries(
                {
                    id,
                    name,
                    share_token: crypto.randomUUID(),
                    owner_player_id: input.ownerPlayerId,
                },
                trx,
            ).execute();
            for (const [ordinal, team] of input.teams.entries()) {
                const teamId = crypto.randomUUID();
                await this.insertTeam(
                    { id: teamId, name: team.name.trim(), colour: team.colour },
                    trx,
                ).execute();
                await this.insertSeriesTeam(id, teamId, ordinal, trx).execute();
            }
        });
        return ok((await this.get(id))!);
    }

    async rename(id: string, name: string): Promise<SeriesResult<SeriesSummary>> {
        if (name.trim().length === 0) return refuse('invalid_name', 'Give the event a name.');
        await this.updateSeriesName(id, name.trim()).execute();
        const found = await this.get(id);
        return found ? ok(found) : refuse('series_not_found', 'That event no longer exists.');
    }

    /** Deletes the series and its teams. Attached rounds are untouched. */
    async delete(id: string): Promise<SeriesResult<{ id: string }>> {
        await this.db.transaction().execute(async (trx) => {
            const teamIds = (await this.teamIdsForSeries(id, trx).execute()).map((r) => r.team_id);
            await this.deleteSeriesRow(id, trx).execute();
            for (const teamId of teamIds) await this.deleteTeamRow(teamId, trx).execute();
        });
        return ok({ id });
    }

    // --- Teams ---

    async teams(seriesId: string): Promise<SeriesTeam[]> {
        const teamRows: TeamRow[] = await this.teamRowsForSeries(seriesId).execute();
        if (teamRows.length === 0) return [];
        const members = await this.memberRowsForTeams(teamRows.map((t) => t.id)).execute();
        return teamRows.map((t) => ({
            id: t.id,
            name: t.name,
            colour: t.colour,
            members: members.filter((m) => m.team_id === t.id).map(toMember),
        }));
    }

    async addTeam(
        seriesId: string,
        team: { name: string; colour: string },
    ): Promise<SeriesResult<SeriesTeam[]>> {
        if (team.name.trim().length === 0) return refuse('invalid_name', 'Give the team a name.');
        const next = (await this.nextTeamOrdinal(seriesId).executeTakeFirst())?.next ?? 0;
        const teamId = crypto.randomUUID();
        await this.db.transaction().execute(async (trx) => {
            await this.insertTeam(
                { id: teamId, name: team.name.trim(), colour: team.colour },
                trx,
            ).execute();
            await this.insertSeriesTeam(seriesId, teamId, next, trx).execute();
        });
        return ok(await this.teams(seriesId));
    }

    async updateTeam(
        seriesId: string,
        teamId: string,
        patch: { name?: string; colour?: string },
    ): Promise<SeriesResult<SeriesTeam[]>> {
        if (!(await this.teamInSeries(seriesId, teamId))) {
            return refuse('team_not_in_series', 'That team is not part of this event.');
        }
        if (patch.name !== undefined && patch.name.trim().length === 0) {
            return refuse('invalid_name', 'Give the team a name.');
        }
        const set = {
            ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
            ...(patch.colour !== undefined ? { colour: patch.colour } : {}),
        };
        if (Object.keys(set).length > 0) await this.updateTeamRow(teamId, set).execute();
        return ok(await this.teams(seriesId));
    }

    /** Removes the team, its members and its ball assignments (cascade). */
    async removeTeam(seriesId: string, teamId: string): Promise<SeriesResult<SeriesTeam[]>> {
        if (!(await this.teamInSeries(seriesId, teamId))) {
            return refuse('team_not_in_series', 'That team is not part of this event.');
        }
        await this.deleteTeamRow(teamId).execute();
        return ok(await this.teams(seriesId));
    }

    async addMember(
        seriesId: string,
        teamId: string,
        ref: MemberRef,
    ): Promise<SeriesResult<SeriesTeam[]>> {
        if (!(await this.teamInSeries(seriesId, teamId))) {
            return refuse('team_not_in_series', 'That team is not part of this event.');
        }
        const current = await this.teams(seriesId);
        const everyone = current.flatMap((t) => t.members);
        if (ref.kind === 'player') {
            const player = await this.players.getById(ref.playerId);
            if (!player) return refuse('player_not_found', 'That player no longer exists.');
            if (everyone.some((m) => m.playerId === player.id)) {
                return refuse('member_exists', `${player.displayName} is already on a team.`);
            }
            await this.insertMember({
                id: crypto.randomUUID(),
                team_id: teamId,
                player_id: player.id,
                guest_player_id: null,
                display_name_snapshot: player.displayName,
            }).execute();
            return ok(await this.teams(seriesId));
        }
        const displayName = ref.displayName.trim();
        if (displayName.length === 0) return refuse('invalid_name', 'Give the player a name.');
        if (everyone.some((m) => norm(m.displayName) === norm(displayName))) {
            return refuse('member_exists', `${displayName} is already on a team.`);
        }
        // A guest member needs an identity row (the XOR check). Gender is a
        // required guest column that a team roster never reads.
        const guest = await this.guests.create({ displayName, gender: 'M' });
        await this.insertMember({
            id: crypto.randomUUID(),
            team_id: teamId,
            player_id: null,
            guest_player_id: guest.id,
            display_name_snapshot: displayName,
        }).execute();
        return ok(await this.teams(seriesId));
    }

    async removeMember(seriesId: string, memberId: string): Promise<SeriesResult<SeriesTeam[]>> {
        const member = await this.memberById(memberId).executeTakeFirst();
        if (!member || !(await this.teamInSeries(seriesId, member.team_id))) {
            return refuse('member_not_found', 'That player is not on a team here.');
        }
        await this.deleteMemberRow(memberId).execute();
        return ok(await this.teams(seriesId));
    }

    // --- Rounds ---

    /**
     * Attach the round behind `roundShareToken`. Prefills ball → team from the
     * rosters and adds one point source per slot that a registered rule fits.
     */
    async attachRound(input: {
        seriesId: string;
        roundShareToken: string;
        label: string;
    }): Promise<SeriesResult<SeriesDetail>> {
        const found = await this.roundIdByShareToken(input.roundShareToken).executeTakeFirst();
        if (!found) return refuse('round_not_found', 'No round matches that link.');
        const roundId = found.round_id;
        if (await this.seriesRoundByRoundId(roundId).executeTakeFirst()) {
            return refuse('round_already_attached', 'That round already counts toward an event.');
        }

        const teams = await this.teams(input.seriesId);
        const prefill = await this.prefillBallTeams(roundId, teams);
        let slots: ScoredSlot[] = [];
        try {
            slots = await this.leaderboards.scoredSlotsForRound(roundId);
        } catch {
            // An unscorable round still attaches; the board shows the problem.
        }
        const ordinal = (await this.nextRoundOrdinal(input.seriesId).executeTakeFirst())?.next ?? 0;
        const label = input.label.trim() || `Round ${ordinal + 1}`;
        const seriesRoundId = crypto.randomUUID();

        await this.db.transaction().execute(async (trx) => {
            await this.insertSeriesRound(
                { id: seriesRoundId, series_id: input.seriesId, round_id: roundId, ordinal, label },
                trx,
            ).execute();
            for (const [ballId, teamId] of prefill) {
                await this.upsertBallTeam(seriesRoundId, ballId, teamId, trx).execute();
            }
            let next = (await this.nextSourceOrdinal(input.seriesId, trx).executeTakeFirst())?.next ?? 0;
            // Default sources. Every match pays. A ranked game pays by default
            // only when it is the round's one game: a Stableford side game
            // next to the matches would otherwise count the same golf twice.
            // The setup view offers the rest one press away.
            for (const slot of slots) {
                const ruleId = suggestedRuleFor(slot);
                if (!ruleId) continue;
                const isMatch = (slot.result.pairResults?.length ?? 0) > 0;
                if (!isMatch && slots.length > 1) continue;
                await this.insertSource(
                    {
                        id: crypto.randomUUID(),
                        series_id: input.seriesId,
                        series_round_id: seriesRoundId,
                        slot_def_id: slot.slotDefId,
                        rule_id: ruleId,
                        config_json: JSON.stringify(findTeamPointsRule(ruleId).defaultConfig()),
                        label: slot.formatLabel,
                        ordinal: next++,
                    },
                    trx,
                ).execute();
            }
        });
        return ok((await this.detail(input.seriesId))!);
    }

    async relabelRound(
        seriesId: string,
        seriesRoundId: string,
        label: string,
    ): Promise<SeriesResult<SeriesDetail>> {
        const row = await this.seriesRoundById(seriesRoundId).executeTakeFirst();
        if (!row || row.series_id !== seriesId) {
            return refuse('series_round_not_found', 'That round is not part of this event.');
        }
        if (label.trim().length === 0) return refuse('invalid_name', 'Give the session a name.');
        await this.updateSeriesRoundLabel(seriesRoundId, label.trim()).execute();
        return ok((await this.detail(seriesId))!);
    }

    /** Detach: the wrapper, its ball teams and its sources go; the round stays. */
    async detachRound(seriesId: string, seriesRoundId: string): Promise<SeriesResult<SeriesDetail>> {
        const row = await this.seriesRoundById(seriesRoundId).executeTakeFirst();
        if (!row || row.series_id !== seriesId) {
            return refuse('series_round_not_found', 'That round is not part of this event.');
        }
        await this.deleteSeriesRoundRow(seriesRoundId).execute();
        return ok((await this.detail(seriesId))!);
    }

    async setBallTeam(input: {
        seriesId: string;
        seriesRoundId: string;
        ballId: string;
        teamId: string | null;
    }): Promise<SeriesResult<SeriesDetail>> {
        const row = await this.seriesRoundById(input.seriesRoundId).executeTakeFirst();
        if (!row || row.series_id !== input.seriesId) {
            return refuse('series_round_not_found', 'That round is not part of this event.');
        }
        const balls = await this.ballIdentityRows(row.round_id).execute();
        if (!balls.some((b) => b.ball_id === input.ballId)) {
            return refuse('ball_not_in_round', 'That player is not in this round.');
        }
        if (input.teamId === null) {
            await this.deleteBallTeam(input.seriesRoundId, input.ballId).execute();
        } else {
            if (!(await this.teamInSeries(input.seriesId, input.teamId))) {
                return refuse('team_not_in_series', 'That team is not part of this event.');
            }
            await this.upsertBallTeam(input.seriesRoundId, input.ballId, input.teamId).execute();
        }
        return ok((await this.detail(input.seriesId))!);
    }

    // --- Point sources ---

    async upsertSource(input: UpsertSourceInput): Promise<SeriesResult<SeriesDetail>> {
        if (!hasTeamPointsRule(input.ruleId)) {
            return refuse('unknown_rule', 'That way of awarding points is not available.');
        }
        const rule = findTeamPointsRule(input.ruleId);
        const config = input.config ?? rule.defaultConfig();
        const problems = rule.validateConfig(config);
        if (problems.length > 0) return refuse('invalid_config', problems[0]!.message);
        const label = input.label.trim();
        if (label.length === 0) return refuse('invalid_name', 'Say what the points are for.');

        if (input.id !== undefined) {
            const existing = await this.sourceById(input.id).executeTakeFirst();
            if (!existing || existing.series_id !== input.seriesId) {
                return refuse('source_not_found', 'Those points no longer exist.');
            }
            await this.updateSourceRow(input.id, {
                rule_id: input.ruleId,
                config_json: JSON.stringify(config),
                label,
            }).execute();
            return ok((await this.detail(input.seriesId))!);
        }

        const seriesRoundId = input.seriesRoundId ?? null;
        if (seriesRoundId !== null) {
            const row = await this.seriesRoundById(seriesRoundId).executeTakeFirst();
            if (!row || row.series_id !== input.seriesId) {
                return refuse('series_round_not_found', 'That round is not part of this event.');
            }
        }
        const slotDefId = seriesRoundId === null ? null : (input.slotDefId ?? null);
        const next = (await this.nextSourceOrdinal(input.seriesId).executeTakeFirst())?.next ?? 0;
        await this.insertSource({
            id: crypto.randomUUID(),
            series_id: input.seriesId,
            series_round_id: seriesRoundId,
            slot_def_id: slotDefId,
            rule_id: input.ruleId,
            config_json: JSON.stringify(config),
            label,
            ordinal: next,
        }).execute();
        return ok((await this.detail(input.seriesId))!);
    }

    async deleteSource(seriesId: string, sourceId: string): Promise<SeriesResult<SeriesDetail>> {
        const existing = await this.sourceById(sourceId).executeTakeFirst();
        if (!existing || existing.series_id !== seriesId) {
            return refuse('source_not_found', 'Those points no longer exist.');
        }
        await this.deleteSourceRow(sourceId).execute();
        return ok((await this.detail(seriesId))!);
    }

    // --- Reads ---

    /** The setup read: everything an organiser edits. */
    async detail(seriesId: string): Promise<SeriesDetail | null> {
        const summary = await this.get(seriesId);
        if (!summary) return null;
        const teams = await this.teams(seriesId);
        const loaded = await this.loadRounds(seriesId);
        const sources = (await this.sourceRows(seriesId).execute()).map(toSource);
        return {
            ...summary,
            teams,
            sources,
            rounds: loaded.map(({ row, facts, slots, ballTeams, problem }) => {
                const seen = new Set<string>();
                const balls: SeriesRoundBall[] = [];
                for (const slot of slots) {
                    for (const ballId of slot.realBallIds) {
                        if (seen.has(ballId)) continue;
                        seen.add(ballId);
                        balls.push({
                            ballId,
                            label: slot.ballLabels[ballId] ?? '',
                            teamId: ballTeams[ballId] ?? null,
                        });
                    }
                }
                return {
                    id: row.id,
                    roundId: row.round_id,
                    label: row.label,
                    ordinal: row.ordinal,
                    roundName: facts.name,
                    date: facts.date,
                    status: facts.status,
                    balls,
                    slots: slots.map((s) => ({
                        slotDefId: s.slotDefId,
                        formatLabel: s.formatLabel,
                        suggestedRuleId: suggestedRuleFor(s),
                    })),
                    ...(problem ? { problem } : {}),
                };
            }),
        };
    }

    /** The board: every source folded through its rule, plus team totals. */
    async board(seriesId: string): Promise<SeriesBoard | null> {
        const summary = await this.get(seriesId);
        if (!summary) return null;
        const teams = await this.teams(seriesId);
        const ruleTeams = teams.map((t) => ({ teamId: t.id, name: t.name }));
        const loaded = await this.loadRounds(seriesId);
        const sources = (await this.sourceRows(seriesId).execute()).map(toSource);

        const fold = (source: SeriesPointSource): SeriesBoardSource => {
            const rows = this.rowsFor(source, ruleTeams, loaded);
            const ruleLabel = hasTeamPointsRule(source.ruleId)
                ? findTeamPointsRule(source.ruleId).descriptor.label
                : '';
            return {
                id: source.id,
                label: source.label,
                ruleLabel,
                rows,
                points: teams.map((t) => ({
                    teamId: t.id,
                    points: rows.reduce(
                        (sum, r) => sum + (r.points.find((p) => p.teamId === t.id)?.points ?? 0),
                        0,
                    ),
                })),
                live: rows.some((r) => r.live),
            };
        };

        const sessions: SeriesBoardSession[] = loaded.map(({ row, facts, problem }) => ({
            seriesRoundId: row.id,
            label: row.label,
            roundName: facts.name,
            date: facts.date,
            status: facts.status,
            sources: sources.filter((s) => s.seriesRoundId === row.id).map(fold),
            ...(problem ? { problem } : {}),
        }));
        const loose = sources.filter((s) => s.seriesRoundId === null).map(fold);
        if (loose.length > 0) {
            sessions.push({
                seriesRoundId: null,
                label: 'Other points',
                roundName: null,
                date: null,
                status: null,
                sources: loose,
            });
        }

        const allRows = sessions.flatMap((s) => s.sources.flatMap((src) => src.rows));
        const total = (teamId: string, rows: TeamPointsRow[]): number =>
            rows.reduce((sum, r) => sum + (r.points.find((p) => p.teamId === teamId)?.points ?? 0), 0);
        return {
            id: summary.id,
            name: summary.name,
            teams: teams.map((t) => ({
                teamId: t.id,
                name: t.name,
                colour: t.colour,
                points: total(t.id, allRows),
                decided: total(
                    t.id,
                    allRows.filter((r) => !r.live),
                ),
            })),
            sessions,
            live: allRows.some((r) => r.live),
        };
    }

    // --- Internals ---

    private async teamInSeries(seriesId: string, teamId: string): Promise<boolean> {
        const ids = await this.teamIdsForSeries(seriesId).execute();
        return ids.some((r) => r.team_id === teamId);
    }

    /**
     * Ball → team by identity: a registered player by id, a guest by id and
     * then by name (a per-round guest has no cross-round id). A ball whose
     * players resolve to two teams, or to none, is left for the organiser.
     */
    private async prefillBallTeams(roundId: string, teams: SeriesTeam[]): Promise<Map<string, string>> {
        const byPlayer = new Map<string, string>();
        const byGuest = new Map<string, string>();
        const byName = new Map<string, string>();
        for (const team of teams) {
            for (const m of team.members) {
                if (m.playerId) byPlayer.set(m.playerId, team.id);
                if (m.guestPlayerId) byGuest.set(m.guestPlayerId, team.id);
                byName.set(norm(m.displayName), team.id);
            }
        }
        const perBall = new Map<string, Set<string | null>>();
        for (const row of await this.ballIdentityRows(roundId).execute()) {
            const teamId =
                (row.player_id ? byPlayer.get(row.player_id) : undefined) ??
                (row.guest_player_id ? byGuest.get(row.guest_player_id) : undefined) ??
                byName.get(norm(row.display_name_snapshot)) ??
                null;
            if (!perBall.has(row.ball_id)) perBall.set(row.ball_id, new Set());
            perBall.get(row.ball_id)!.add(teamId);
        }
        const out = new Map<string, string>();
        for (const [ballId, found] of perBall) {
            const only = found.size === 1 ? [...found][0] : null;
            if (only) out.set(ballId, only);
        }
        return out;
    }

    private async loadRounds(seriesId: string): Promise<
        {
            row: SeriesRoundRow;
            facts: RoundFacts;
            slots: ScoredSlot[];
            ballTeams: Record<string, string>;
            problem?: string;
        }[]
    > {
        const rows = await this.seriesRoundRows(seriesId).execute();
        if (rows.length === 0) return [];
        const facts = new Map(
            (await this.roundFactRows(rows.map((r) => r.round_id)).execute()).map(
                (r) =>
                    [
                        r.id,
                        { name: r.name ?? r.course_name_snapshot ?? '', date: r.date, status: r.status },
                    ] as const,
            ),
        );
        const ballTeamRows = await this.ballTeamRows(rows.map((r) => r.id)).execute();
        return Promise.all(
            rows.map(async (row) => {
                const ballTeams: Record<string, string> = {};
                for (const bt of ballTeamRows) {
                    if (bt.series_round_id === row.id) ballTeams[bt.ball_id] = bt.team_id;
                }
                const base = { row, facts: facts.get(row.round_id)!, ballTeams };
                try {
                    return { ...base, slots: await this.leaderboards.scoredSlotsForRound(row.round_id) };
                } catch {
                    return { ...base, slots: [], problem: 'This round could not be scored.' };
                }
            }),
        );
    }

    private rowsFor(
        source: SeriesPointSource,
        teams: { teamId: string; name: string }[],
        loaded: Awaited<ReturnType<SeriesService['loadRounds']>>,
    ): TeamPointsRow[] {
        const broken = (problem: string): TeamPointsRow[] => [
            { label: '', status: '', live: false, points: [], detail: '', problem },
        ];
        if (!hasTeamPointsRule(source.ruleId)) {
            return broken('This way of awarding points is no longer available.');
        }
        const rule = findTeamPointsRule(source.ruleId);
        if (source.slotDefId === null) {
            return rule.teamPoints({ teams, config: source.config });
        }
        const round = loaded.find((r) => r.row.id === source.seriesRoundId);
        const slot = round?.slots.find((s) => s.slotDefId === source.slotDefId);
        if (!round || !slot) return broken('This game is no longer in the round.');
        return rule.teamPoints({
            teams,
            config: source.config,
            slot: {
                result: slot.result,
                ballTeams: round.ballTeams,
                virtualSubjects: slot.virtualSubjects,
                ballLabels: slot.ballLabels,
                roundComplete: round.facts.status === 'complete',
            },
        });
    }
}
