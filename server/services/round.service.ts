import type { Kysely, Selectable } from 'kysely';
import type {
    Database,
    RoundsTable,
    RoundFormatSlotsTable,
    RoundType,
    VenueType,
    StartListMode,
    RoundStatus,
    ScoringMode,
    TeamShape,
} from '../db/schema';

// --- Output types ---

export interface FormatSlot {
    slotIndex: number;
    scoringMode: ScoringMode;
    teamShape: TeamShape;
    allowancePct: number;
    scopeConfig: unknown;
}

export interface Round {
    id: string;
    courseId: string;
    date: string;
    roundType: RoundType;
    venueType: VenueType;
    startListMode: StartListMode;
    windowStart: string | null;
    windowEnd: string | null;
    selfOrganize: boolean;
    status: RoundStatus;
    latestEventId: string | null;
    formatSlots: FormatSlot[];
}

export interface CreateRoundInput {
    courseId: string;
    date: string;
    roundType: RoundType;
    venueType: VenueType;
    startListMode: StartListMode;
    windowStart?: string | null;
    windowEnd?: string | null;
    selfOrganize?: boolean;
    formatSlots: FormatSlot[];
}

export interface UpdateRoundInput {
    date?: string;
    roundType?: RoundType;
    venueType?: VenueType;
    startListMode?: StartListMode;
    windowStart?: string | null;
    windowEnd?: string | null;
    selfOrganize?: boolean;
    status?: RoundStatus;
    formatSlots?: FormatSlot[];
}

// --- Row mapping ---

type RoundRow = Selectable<RoundsTable>;
type FormatSlotRow = Selectable<RoundFormatSlotsTable>;

function toFormatSlot(row: FormatSlotRow): FormatSlot {
    return {
        slotIndex: row.slot_index,
        scoringMode: row.scoring_mode,
        teamShape: row.team_shape,
        allowancePct: row.allowance_pct,
        scopeConfig: row.scope_config === null ? null : JSON.parse(row.scope_config),
    };
}

function toRound(row: RoundRow, formatSlots: FormatSlot[]): Round {
    return {
        id: row.id,
        courseId: row.course_id,
        date: row.date,
        roundType: row.round_type,
        venueType: row.venue_type,
        startListMode: row.start_list_mode,
        windowStart: row.window_start,
        windowEnd: row.window_end,
        selfOrganize: row.self_organize === 1,
        status: row.status,
        latestEventId: row.latest_event_id,
        formatSlots,
    };
}

export class RoundService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private rounds() {
        return this.db.selectFrom('rounds').selectAll();
    }

    private byId(id: string) {
        return this.rounds().where('id', '=', id);
    }

    private slotsFor(roundId: string) {
        return this.db
            .selectFrom('round_format_slots')
            .selectAll()
            .where('round_id', '=', roundId)
            .orderBy('slot_index');
    }

    // --- Queries (write) ---

    private insertRound(
        values: {
            id: string;
            course_id: string;
            date: string;
            round_type: RoundType;
            venue_type: VenueType;
            start_list_mode: StartListMode;
            window_start: string | null;
            window_end: string | null;
            self_organize: number;
            status: RoundStatus;
        },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('rounds').values(values);
    }

    private updateById(id: string, trx: Kysely<Database> = this.db) {
        return trx.updateTable('rounds').where('id', '=', id);
    }

    private deleteById(id: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('rounds').where('id', '=', id);
    }

    private insertSlots(
        rows: {
            round_id: string;
            slot_index: number;
            scoring_mode: ScoringMode;
            team_shape: TeamShape;
            allowance_pct: number;
            scope_config: string | null;
        }[],
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('round_format_slots').values(rows);
    }

    private deleteSlotsFor(roundId: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('round_format_slots').where('round_id', '=', roundId);
    }

    // --- Methods ---

    async list(): Promise<Round[]> {
        const rows = await this.rounds().orderBy('date', 'desc').execute();
        const result: Round[] = [];
        for (const row of rows) {
            const slots = await this.slotsFor(row.id).execute();
            result.push(toRound(row, slots.map(toFormatSlot)));
        }
        return result;
    }

    async getById(id: string): Promise<Round | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        const slots = await this.slotsFor(id).execute();
        return toRound(row, slots.map(toFormatSlot));
    }

    async create(input: CreateRoundInput): Promise<Round> {
        this.validateSlots(input.formatSlots);
        const id = crypto.randomUUID();

        await this.db.transaction().execute(async (trx) => {
            await this.insertRound(
                {
                    id,
                    course_id: input.courseId,
                    date: input.date,
                    round_type: input.roundType,
                    venue_type: input.venueType,
                    start_list_mode: input.startListMode,
                    window_start: input.windowStart ?? null,
                    window_end: input.windowEnd ?? null,
                    self_organize: input.selfOrganize ? 1 : 0,
                    status: 'not_started',
                },
                trx,
            ).execute();
            await this.insertSlots(
                input.formatSlots.map((s) => ({
                    round_id: id,
                    slot_index: s.slotIndex,
                    scoring_mode: s.scoringMode,
                    team_shape: s.teamShape,
                    allowance_pct: s.allowancePct,
                    scope_config:
                        s.scopeConfig === null || s.scopeConfig === undefined
                            ? null
                            : JSON.stringify(s.scopeConfig),
                })),
                trx,
            ).execute();
        });

        const result = await this.getById(id);
        if (!result) throw new Error(`Round ${id} not found after create`);
        return result;
    }

    async update(id: string, input: UpdateRoundInput): Promise<Round> {
        if (input.formatSlots !== undefined) this.validateSlots(input.formatSlots);

        await this.db.transaction().execute(async (trx) => {
            const patch: Record<string, unknown> = {};
            if (input.date !== undefined) patch.date = input.date;
            if (input.roundType !== undefined) patch.round_type = input.roundType;
            if (input.venueType !== undefined) patch.venue_type = input.venueType;
            if (input.startListMode !== undefined) patch.start_list_mode = input.startListMode;
            if (input.windowStart !== undefined) patch.window_start = input.windowStart;
            if (input.windowEnd !== undefined) patch.window_end = input.windowEnd;
            if (input.selfOrganize !== undefined)
                patch.self_organize = input.selfOrganize ? 1 : 0;
            if (input.status !== undefined) patch.status = input.status;
            if (Object.keys(patch).length > 0) {
                await this.updateById(id, trx).set(patch).execute();
            }
            if (input.formatSlots !== undefined) {
                await this.deleteSlotsFor(id, trx).execute();
                if (input.formatSlots.length > 0) {
                    await this.insertSlots(
                        input.formatSlots.map((s) => ({
                            round_id: id,
                            slot_index: s.slotIndex,
                            scoring_mode: s.scoringMode,
                            team_shape: s.teamShape,
                            allowance_pct: s.allowancePct,
                            scope_config:
                                s.scopeConfig === null || s.scopeConfig === undefined
                                    ? null
                                    : JSON.stringify(s.scopeConfig),
                        })),
                        trx,
                    ).execute();
                }
            }
        });

        const result = await this.getById(id);
        if (!result) throw new Error(`Round ${id} not found after update`);
        return result;
    }

    async remove(id: string): Promise<void> {
        await this.deleteById(id).execute();
    }

    /**
     * Called by score-event.service after a successful append. Not exposed via
     * the descriptor; score events are the only path that moves the cursor.
     */
    async recordLatestEvent(
        id: string,
        eventId: string,
        trx: Kysely<Database> = this.db,
    ): Promise<void> {
        await this.updateById(id, trx).set({ latest_event_id: eventId }).execute();
    }

    private validateSlots(slots: FormatSlot[]): void {
        if (slots.length === 0) throw new Error('Round needs at least one format slot');
        const indices = slots.map((s) => s.slotIndex).sort((a, b) => a - b);
        for (let i = 0; i < indices.length; i++) {
            if (indices[i] !== i) {
                throw new Error('Slot indices must be 0..N-1, contiguous and unique');
            }
        }
        for (const s of slots) {
            if (s.allowancePct < 0 || s.allowancePct > 100) {
                throw new Error(`allowancePct must be 0..100 (got ${s.allowancePct})`);
            }
        }
    }
}
