import { type Kysely, sql } from 'kysely';

/**
 * A course-role assignment may only name one of that course's tees, and the
 * tee must be rated for the assignment's gender. These are cross-table
 * invariants, so SQLite needs triggers rather than ordinary FKs.
 *
 * If a tee rating is later removed, remove only the now-unresolvable mapping.
 * TeeService upserts retained ratings before deleting retired ones, so editing
 * a rating does not clear a valid assignment as an incidental side effect.
 */
export async function up(db: Kysely<any>): Promise<void> {
    for (const event of ['INSERT', 'UPDATE'] as const) {
        await sql.raw(`
            CREATE TRIGGER course_tee_roles_valid_${event.toLowerCase()}
            BEFORE ${event} ON course_tee_roles
            WHEN NOT EXISTS (
                SELECT 1
                FROM tees
                JOIN tee_ratings ON tee_ratings.tee_id = tees.id
                WHERE tees.id = NEW.tee_id
                  AND tees.course_id = NEW.course_id
                  AND tee_ratings.gender = NEW.gender
            )
            BEGIN
                SELECT RAISE(ABORT, 'course tee role requires a rated tee on its course');
            END
        `).execute(db);
    }

    await sql`
        CREATE TRIGGER course_tee_roles_clear_removed_rating
        AFTER DELETE ON tee_ratings
        BEGIN
            DELETE FROM course_tee_roles
            WHERE tee_id = OLD.tee_id AND gender = OLD.gender;
        END
    `.execute(db);
}
