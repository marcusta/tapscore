import type { Kysely, Selectable } from 'kysely';
import type { Database, ClubsTable } from '../db/schema';
import {
    countWithNames,
    refuseDelete,
    type DeleteBlocker,
} from './catalog-delete-guard';

// --- Output types ---

export interface Club {
    id: string;
    name: string;
    location: string | null;
    logoUrl: string | null;
}

export interface CreateClubInput {
    name: string;
    location?: string | null;
    logoUrl?: string | null;
}

export interface UpdateClubInput {
    name?: string;
    location?: string | null;
    logoUrl?: string | null;
}

// --- Row mapping ---

type ClubRow = Selectable<ClubsTable>;

function toClub(row: ClubRow): Club {
    return {
        id: row.id,
        name: row.name,
        location: row.location,
        logoUrl: row.logo_url,
    };
}

export class ClubService {
    constructor(private db: Kysely<Database>) {}

    // --- Queries (read) ---

    private clubs() {
        return this.db.selectFrom('clubs').selectAll();
    }

    private byId(id: string) {
        return this.clubs().where('id', '=', id);
    }

    // --- Queries (write) ---

    private insertClub(
        values: { id: string; name: string; location: string | null; logo_url: string | null },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('clubs').values(values);
    }

    private updateById(id: string, trx: Kysely<Database> = this.db) {
        return trx.updateTable('clubs').where('id', '=', id);
    }

    private deleteById(id: string, trx: Kysely<Database> = this.db) {
        return trx.deleteFrom('clubs').where('id', '=', id);
    }

    private coursesOf(clubId: string) {
        return this.db
            .selectFrom('courses')
            .select(['id', 'name'])
            .where('club_id', '=', clubId)
            .orderBy('name');
    }

    private homeClubPlayers(clubId: string) {
        return this.db
            .selectFrom('players')
            .select(['id', 'display_name'])
            .where('home_club_id', '=', clubId)
            .orderBy('display_name');
    }

    // --- Methods ---

    async list(): Promise<Club[]> {
        const rows = await this.clubs().orderBy('name').execute();
        return rows.map(toClub);
    }

    async getById(id: string): Promise<Club | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return toClub(row);
    }

    async create(input: CreateClubInput): Promise<Club> {
        const id = crypto.randomUUID();
        const values = {
            id,
            name: input.name,
            location: input.location ?? null,
            logo_url: input.logoUrl ?? null,
        };
        await this.insertClub(values).execute();
        return { id, name: values.name, location: values.location, logoUrl: values.logo_url };
    }

    async update(id: string, input: UpdateClubInput): Promise<Club> {
        const patch: Record<string, unknown> = {};
        if (input.name !== undefined) patch.name = input.name;
        if (input.location !== undefined) patch.location = input.location;
        if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;

        if (Object.keys(patch).length > 0) {
            await this.updateById(id).set(patch).execute();
        }

        const row = await this.byId(id).executeTakeFirstOrThrow();
        return toClub(row);
    }

    /**
     * Delete a club, refusing while anything still points at it.
     *
     * Ruling (docs/proposals/manage-ui.md §3.2/§3.7):
     *
     *  - **Courses block.** `courses.club_id` is `ON DELETE cascade`, and that
     *    cascade reaches on through `course_holes`, `tees`, `tee_hole_lengths`,
     *    `tee_ratings`, `course_tee_roles` and `course_route_templates`. One
     *    click on a club would therefore erase every course the club ever had
     *    — the single most destructive silent action in the catalog. Delete
     *    the courses deliberately, one at a time, then the club.
     *  - **Home-club players block.** `players.home_club_id` (migration 003)
     *    has no `ON DELETE` clause, so SQLite defaults it to NO ACTION and the
     *    delete would fail with a raw FK error the API could only render as a
     *    500. Naming the players turns that into an answerable refusal. The
     *    erasure path scrubs `home_club_id` to null, so a deleted player never
     *    holds a club hostage.
     *
     * Nothing cascades from a club except through its courses, so there is no
     * third category here. A club with no courses and no members still deletes
     * exactly as before.
     */
    async remove(id: string): Promise<void> {
        const [courses, players] = await Promise.all([
            this.coursesOf(id).execute(),
            this.homeClubPlayers(id).execute(),
        ]);

        const blockers: DeleteBlocker[] = [];
        if (courses.length > 0) {
            blockers.push({
                kind: 'courses',
                count: courses.length,
                phrase: countWithNames(
                    courses.length,
                    'course',
                    'courses',
                    courses.map((c) => c.name),
                ),
                items: courses.map((c) => c.name),
            });
        }
        if (players.length > 0) {
            blockers.push({
                kind: 'home_club_players',
                count: players.length,
                phrase: `${countWithNames(
                    players.length,
                    'player',
                    'players',
                    players.map((p) => p.display_name),
                )} ${players.length === 1 ? 'who has' : 'who have'} it as their home club`,
                // No `items` here on purpose: the phrase already samples up to
                // three names, and a full member roster is more than a
                // course_admin needs to answer "why is this blocked".
            });
        }
        if (blockers.length > 0) refuseDelete('club_delete_blocked', 'club', blockers);

        await this.deleteById(id).execute();
    }
}
