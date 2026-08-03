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

/**
 * A club as the catalog LIST states it: the club, plus how many courses sit
 * under it.
 *
 * The count rides on the row rather than living behind its own endpoint
 * (manage-ui.md §3.2). It is what tells a course admin whether a club is worth
 * opening, and it is the figure the delete consequence states — so it must come
 * from the same moment as the row it annotates. A separate count call, or the
 * client-side join over `GET /courses` that preceded this, could disagree with
 * the list by a write.
 */
export interface ClubListItem extends Club {
    courseCount: number;
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

    /**
     * Every club with the number of courses under it, in one statement.
     *
     * A LEFT join — an inner one would drop a club that has no courses yet,
     * which is exactly the club a course admin has just created and is looking
     * for. `count(courses.id)` rather than `count(*)`: on the unmatched side of
     * a left join `courses.id` is null and counts as zero, while `count(*)`
     * would count the padding row and report 1.
     */
    private clubsWithCourseCounts() {
        return this.db
            .selectFrom('clubs')
            .leftJoin('courses', 'courses.club_id', 'clubs.id')
            .select(({ fn }) => [
                'clubs.id as id',
                'clubs.name as name',
                'clubs.location as location',
                'clubs.logo_url as logo_url',
                fn.count<number>('courses.id').as('course_count'),
            ])
            .groupBy(['clubs.id', 'clubs.name', 'clubs.location', 'clubs.logo_url'])
            .orderBy('clubs.name');
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

    async list(): Promise<ClubListItem[]> {
        const rows = await this.clubsWithCourseCounts().execute();
        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            location: row.location,
            logoUrl: row.logo_url,
            // SQLite hands `count()` back as an integer, but the driver's type
            // is wide enough to be a string on other dialects; normalise once
            // here rather than in every consumer.
            courseCount: Number(row.course_count),
        }));
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
