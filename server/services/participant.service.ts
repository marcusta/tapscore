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
    handicapIndexSnapshot: number | null;
    courseHandicapSnapshot: number | null;
    playingHandicapSnapshot: number | null;
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
        handicapIndexSnapshot: row.handicap_index_snapshot,
        courseHandicapSnapshot: row.course_handicap_snapshot,
        playingHandicapSnapshot: row.playing_handicap_snapshot,
    };
}

interface SnapshotContext {
    teeId: string;
    gender: TeeGender;
    allowancePct: number;
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
            handicap_index_snapshot: number | null;
            course_handicap_snapshot: number | null;
            playing_handicap_snapshot: number | null;
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
        const linkSnapshotContext = await this.snapshotContextFromInput(input.snapshot);
        const linkSnapshots = await Promise.all(
            (input.players ?? []).map((p) => this.computeLinkSnapshot(p, linkSnapshotContext)),
        );
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
            for (let i = 0; i < (input.players ?? []).length; i++) {
                await this.insertLinkRow(id, input.players![i]!, linkSnapshots[i]!, trx);
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
        const context = await this.snapshotContextForParticipant(participantId);
        const snapshot = await this.computeLinkSnapshot(which, context);
        const id = await this.insertLinkRow(participantId, which, snapshot, this.db);
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
        snapshot: {
            handicapIndex: number | null;
            courseHandicap: number | null;
            playingHandicap: number | null;
        },
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
                handicap_index_snapshot: snapshot.handicapIndex,
                course_handicap_snapshot: snapshot.courseHandicap,
                playing_handicap_snapshot: snapshot.playingHandicap,
            },
            trx,
        ).execute();
        return id;
    }

    private async snapshotContextFromInput(
        input?: ParticipantSnapshotInput,
    ): Promise<SnapshotContext | null> {
        if (!input) return null;
        return {
            teeId: input.teeId,
            gender: input.gender,
            allowancePct: input.allowancePct ?? 100,
        };
    }

    private async snapshotContextForParticipant(participantId: string): Promise<SnapshotContext | null> {
        const participant = await this.byId(participantId).executeTakeFirst();
        if (!participant?.tee_id_snapshot) return null;
        const gender = await this.inferSnapshotGender(
            participant.tee_id_snapshot,
            participant.handicap_index_snapshot,
            participant.course_handicap_snapshot,
        );
        const allowancePct = await this.allowancePctForParticipant(
            participant.round_id,
            participantId,
        );
        if (gender === null || allowancePct === null) return null;
        return {
            teeId: participant.tee_id_snapshot,
            gender,
            allowancePct,
        };
    }

    private async allowancePctForParticipant(
        roundId: string,
        participantId: string,
    ): Promise<number | null> {
        const slots = await this.db
            .selectFrom('round_format_slots')
            .select(['allowance_pct', 'scope_config'])
            .where('round_id', '=', roundId)
            .orderBy('slot_index')
            .execute();
        if (slots.length === 0) return null;
        const singleSlotScopeIds =
            slots.length === 1 && slots[0]!.scope_config !== null
                ? ((JSON.parse(slots[0]!.scope_config) as {
                      scope?: { participantIds?: string[] };
                  }).scope?.participantIds ?? null)
                : null;
        if (slots.length === 1 && singleSlotScopeIds === null) {
            return slots[0]!.allowance_pct;
        }
        const matches = slots.filter((slot) => {
            if (slot.scope_config === null) return false;
            const parsed = JSON.parse(slot.scope_config) as {
                scope?: { participantIds?: string[] };
            };
            return parsed.scope?.participantIds?.includes(participantId) ?? false;
        });
        return matches.length === 1 ? matches[0]!.allowance_pct : null;
    }

    private async inferSnapshotGender(
        teeId: string,
        handicapIndexSnapshot: number | null,
        courseHandicapSnapshot: number | null,
    ): Promise<TeeGender | null> {
        const tee = await this.teeService.getById(teeId);
        if (!tee) return null;
        if (handicapIndexSnapshot === null || courseHandicapSnapshot === null) {
            return tee.ratings.length === 1 ? tee.ratings[0]!.gender : null;
        }
        const matching = tee.ratings.filter((r) => {
            const raw =
                handicapIndexSnapshot * (r.slope / 113) + (r.courseRating - r.par);
            return Math.round(raw) === courseHandicapSnapshot;
        });
        if (matching.length > 0) return matching[0]!.gender;
        return tee.ratings.length === 1 ? tee.ratings[0]!.gender : null;
    }

    private async handicapIndexForLink(which: {
        playerId?: string;
        guestPlayerId?: string;
    }): Promise<number | null> {
        if (which.playerId) {
            const latest = await this.handicapService.latestFor(which.playerId);
            if (!latest) throw new Error(`no handicap history for player ${which.playerId}`);
            return latest.handicapIndex;
        }
        if (which.guestPlayerId) {
            const guest = await this.db
                .selectFrom('guest_players')
                .select(['id', 'handicap_index'])
                .where('id', '=', which.guestPlayerId)
                .executeTakeFirst();
            if (!guest) throw new Error(`guest player ${which.guestPlayerId} not found`);
            if (guest.handicap_index === null) {
                throw new Error(`guest player ${which.guestPlayerId} has no handicap index`);
            }
            return guest.handicap_index;
        }
        return null;
    }

    private async computeLinkSnapshot(
        which: { playerId?: string; guestPlayerId?: string },
        context: SnapshotContext | null,
    ): Promise<{
        handicapIndex: number | null;
        courseHandicap: number | null;
        playingHandicap: number | null;
    }> {
        if (!context) {
            return {
                handicapIndex: null,
                courseHandicap: null,
                playingHandicap: null,
            };
        }
        const handicapIndex = await this.handicapIndexForLink(which);
        if (handicapIndex === null) {
            throw new Error(
                'participant_players link must have exactly one of playerId or guestPlayerId',
            );
        }
        return this.computeSnapshotForHandicapIndex(handicapIndex, context);
    }

    private async computeSnapshotForHandicapIndex(
        handicapIndex: number,
        context: SnapshotContext,
    ): Promise<{
        handicapIndex: number;
        courseHandicap: number;
        playingHandicap: number;
    }> {
        const tee = await this.teeService.getById(context.teeId);
        if (!tee) throw new Error(`tee ${context.teeId} not found`);
        const rating = tee.ratings.find((r) => r.gender === context.gender);
        if (!rating) {
            throw new Error(`tee ${context.teeId} has no rating for gender ${context.gender}`);
        }
        const ch = courseHandicap({
            handicapIndex,
            slope: rating.slope,
            courseRating: rating.courseRating,
            par: rating.par,
        });
        return {
            handicapIndex,
            courseHandicap: ch,
            playingHandicap: playingHandicap(ch, context.allowancePct),
        };
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

        const handicapIndex =
            input.fromPlayerId !== undefined
                ? await this.handicapIndexForLink({ playerId: input.fromPlayerId })
                : input.handicapIndex !== undefined
                  ? input.handicapIndex
                  : null;
        if (handicapIndex === null) {
            throw new Error('snapshot requires fromPlayerId or handicapIndex');
        }

        const linkSnapshot = await this.computeSnapshotForHandicapIndex(handicapIndex, {
            teeId: input.teeId,
            gender: input.gender,
            allowancePct: input.allowancePct ?? 100,
        });

        return {
            teeId: input.teeId,
            handicapIndex: linkSnapshot.handicapIndex,
            courseHandicap: linkSnapshot.courseHandicap,
            playingHandicap: linkSnapshot.playingHandicap,
        };
    }
}
