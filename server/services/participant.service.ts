import type { Kysely, Selectable } from 'kysely';
import type {
    Database,
    ParticipantsTable,
    ParticipantPlayersTable,
    TeeGender,
} from '../db/schema';
import type { HandicapService } from './handicap.service';
import type { TeeService } from './tee.service';
import { courseHandicap, playingHandicap } from '../domain/handicap';

// --- Output types ---

export interface ParticipantPlayerLink {
    id: string;
    participantId: string;
    playerId: string | null;
    guestPlayerId: string | null;
}

export interface Participant {
    id: string;
    roundId: string;
    teamLabel: string | null;
    categorySnapshot: string | null;
    teeIdSnapshot: string | null;
    handicapIndexSnapshot: number | null;
    courseHandicapSnapshot: number | null;
    playingHandicapSnapshot: number | null;
    isLocked: boolean;
    isDq: boolean;
    adminModifiedBy: string | null;
    adminModifiedAt: string | null;
    adminNotes: string | null;
    players: ParticipantPlayerLink[];
}

/**
 * Snapshot inputs. Provide a tee + gender to freeze course/playing handicap
 * at time of play. Either `fromPlayerId` (pulls latest via handicap.service)
 * or `handicapIndex` (explicit override — required for guests) supplies the
 * index. Omit `snapshot` entirely for bare participants (admin-filled later).
 */
export interface ParticipantSnapshotInput {
    teeId: string;
    gender: TeeGender;
    fromPlayerId?: string;
    handicapIndex?: number;
    allowancePct?: number;
}

export interface CreateParticipantInput {
    roundId: string;
    teamLabel?: string | null;
    categorySnapshot?: string | null;
    snapshot?: ParticipantSnapshotInput;
    players?: { playerId?: string; guestPlayerId?: string }[];
}

// --- Row mapping ---

type ParticipantRow = Selectable<ParticipantsTable>;
type ParticipantPlayerRow = Selectable<ParticipantPlayersTable>;

function toLink(row: ParticipantPlayerRow): ParticipantPlayerLink {
    return {
        id: row.id,
        participantId: row.participant_id,
        playerId: row.player_id,
        guestPlayerId: row.guest_player_id,
    };
}

function toParticipant(row: ParticipantRow, players: ParticipantPlayerLink[]): Participant {
    return {
        id: row.id,
        roundId: row.round_id,
        teamLabel: row.team_label,
        categorySnapshot: row.category_snapshot,
        teeIdSnapshot: row.tee_id_snapshot,
        handicapIndexSnapshot: row.handicap_index_snapshot,
        courseHandicapSnapshot: row.course_handicap_snapshot,
        playingHandicapSnapshot: row.playing_handicap_snapshot,
        isLocked: row.is_locked === 1,
        isDq: row.is_dq === 1,
        adminModifiedBy: row.admin_modified_by,
        adminModifiedAt: row.admin_modified_at,
        adminNotes: row.admin_notes,
        players,
    };
}

export class ParticipantService {
    constructor(
        private db: Kysely<Database>,
        private handicapService: HandicapService,
        private teeService: TeeService,
    ) {}

    // --- Queries (read) ---

    private participants() {
        return this.db.selectFrom('participants').selectAll();
    }

    private byId(id: string) {
        return this.participants().where('id', '=', id);
    }

    private byRound(roundId: string) {
        return this.participants().where('round_id', '=', roundId);
    }

    private linksFor(participantId: string) {
        return this.db
            .selectFrom('participant_players')
            .selectAll()
            .where('participant_id', '=', participantId)
            .orderBy('created_at');
    }

    // --- Queries (write) ---

    private insertParticipant(
        values: {
            id: string;
            round_id: string;
            team_label: string | null;
            category_snapshot: string | null;
            tee_id_snapshot: string | null;
            handicap_index_snapshot: number | null;
            course_handicap_snapshot: number | null;
            playing_handicap_snapshot: number | null;
            is_locked: number;
            is_dq: number;
        },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('participants').values(values);
    }

    private deleteById(id: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('participants').where('id', '=', id);
    }

    private insertLink(
        values: {
            id: string;
            participant_id: string;
            player_id: string | null;
            guest_player_id: string | null;
        },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('participant_players').values(values);
    }

    private deleteLinkById(id: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('participant_players').where('id', '=', id);
    }

    // --- Methods ---

    async create(input: CreateParticipantInput): Promise<Participant> {
        const snap = await this.computeSnapshot(input.snapshot);
        const id = crypto.randomUUID();

        await this.db.transaction().execute(async (trx) => {
            await this.insertParticipant(
                {
                    id,
                    round_id: input.roundId,
                    team_label: input.teamLabel ?? null,
                    category_snapshot: input.categorySnapshot ?? null,
                    tee_id_snapshot: snap.teeId,
                    handicap_index_snapshot: snap.handicapIndex,
                    course_handicap_snapshot: snap.courseHandicap,
                    playing_handicap_snapshot: snap.playingHandicap,
                    is_locked: 0,
                    is_dq: 0,
                },
                trx,
            ).execute();
            for (const p of input.players ?? []) {
                await this.insertLinkRow(id, p, trx);
            }
        });

        const result = await this.getById(id);
        if (!result) throw new Error(`Participant ${id} not found after create`);
        return result;
    }

    async getById(id: string): Promise<Participant | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        const links = await this.linksFor(id).execute();
        return toParticipant(row, links.map(toLink));
    }

    async listByRound(roundId: string): Promise<Participant[]> {
        const rows = await this.byRound(roundId).orderBy('created_at').execute();
        const result: Participant[] = [];
        for (const row of rows) {
            const links = await this.linksFor(row.id).execute();
            result.push(toParticipant(row, links.map(toLink)));
        }
        return result;
    }

    async remove(id: string): Promise<void> {
        await this.deleteById(id).execute();
    }

    async addPlayer(participantId: string, playerId: string): Promise<ParticipantPlayerLink> {
        return this.addLink(participantId, { playerId });
    }

    async addGuest(
        participantId: string,
        guestPlayerId: string,
    ): Promise<ParticipantPlayerLink> {
        return this.addLink(participantId, { guestPlayerId });
    }

    async listFor(participantId: string): Promise<ParticipantPlayerLink[]> {
        const rows = await this.linksFor(participantId).execute();
        return rows.map(toLink);
    }

    async removeLink(linkId: string): Promise<void> {
        await this.deleteLinkById(linkId).execute();
    }

    // --- Helpers ---

    private async addLink(
        participantId: string,
        which: { playerId?: string; guestPlayerId?: string },
    ): Promise<ParticipantPlayerLink> {
        const id = await this.insertLinkRow(participantId, which, this.db);
        const row = await this.db
            .selectFrom('participant_players')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirstOrThrow();
        return toLink(row);
    }

    private async insertLinkRow(
        participantId: string,
        which: { playerId?: string; guestPlayerId?: string },
        trx: Kysely<Database>,
    ): Promise<string> {
        const hasPlayer = which.playerId !== undefined && which.playerId !== null;
        const hasGuest = which.guestPlayerId !== undefined && which.guestPlayerId !== null;
        if (hasPlayer === hasGuest) {
            throw new Error(
                'participant_players link must have exactly one of playerId or guestPlayerId',
            );
        }
        const id = crypto.randomUUID();
        await this.insertLink(
            {
                id,
                participant_id: participantId,
                player_id: which.playerId ?? null,
                guest_player_id: which.guestPlayerId ?? null,
            },
            trx,
        ).execute();
        return id;
    }

    private async computeSnapshot(input?: ParticipantSnapshotInput): Promise<{
        teeId: string | null;
        handicapIndex: number | null;
        courseHandicap: number | null;
        playingHandicap: number | null;
    }> {
        if (!input) {
            return {
                teeId: null,
                handicapIndex: null,
                courseHandicap: null,
                playingHandicap: null,
            };
        }

        // Resolve handicap index.
        let handicapIndex: number | null;
        if (input.fromPlayerId !== undefined) {
            const latest = await this.handicapService.latestFor(input.fromPlayerId);
            if (!latest) throw new Error(`no handicap history for player ${input.fromPlayerId}`);
            handicapIndex = latest.handicapIndex;
        } else if (input.handicapIndex !== undefined) {
            handicapIndex = input.handicapIndex;
        } else {
            throw new Error('snapshot requires fromPlayerId or handicapIndex');
        }

        // Look up the tee rating for this gender.
        const tee = await this.teeService.getById(input.teeId);
        if (!tee) throw new Error(`tee ${input.teeId} not found`);
        const rating = tee.ratings.find((r) => r.gender === input.gender);
        if (!rating) {
            throw new Error(`tee ${input.teeId} has no rating for gender ${input.gender}`);
        }

        const ch = courseHandicap({
            handicapIndex,
            slope: rating.slope,
            courseRating: rating.courseRating,
            par: rating.par,
        });
        const allowance = input.allowancePct ?? 100;
        const ph = playingHandicap(ch, allowance);

        return {
            teeId: input.teeId,
            handicapIndex,
            courseHandicap: ch,
            playingHandicap: ph,
        };
    }
}
