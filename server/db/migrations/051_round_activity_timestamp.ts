import { sql, type Kysely } from 'kysely';

// A round's calendar date answers "when was it scheduled?", not "what did I
// last work on?". The dashboard and both clients need the latter. Keeping the
// timestamp on `rounds` means every reader sees the same ordering without
// rebuilding a cross-event aggregate on every list read.
//
// SQLite's clock is deliberately the source for every touch. Event payloads
// may carry caller-authored timestamps, which describe the score rather than
// when the round changed on this system. `%f` keeps enough precision to order
// several operations in the same second.
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('rounds')
        .addColumn('last_activity_at', 'text')
        .execute();

    // Backfill existing rounds from every persisted action that changes their
    // setup, result, lifecycle, or captured scoring context. `datetime()`
    // normalises the old SQLite and ISO timestamp spellings before MAX sees
    // them, so a `T` versus a space cannot accidentally decide recency.
    await sql`
        UPDATE rounds AS r
        SET last_activity_at = (
            SELECT MAX(activity_at)
            FROM (
                SELECT datetime(r.created_at) AS activity_at
                UNION ALL SELECT datetime(r.completed_at)
                UNION ALL SELECT datetime(recorded_at) FROM score_events WHERE round_id = r.id
                UNION ALL SELECT datetime(recorded_at) FROM stat_events WHERE round_id = r.id
                UNION ALL SELECT datetime(recorded_at) FROM setup_correction_events WHERE round_id = r.id
                UNION ALL SELECT datetime(recorded_at) FROM allowance_override_events WHERE round_id = r.id
                UNION ALL SELECT datetime(recorded_at) FROM ruling_events WHERE round_id = r.id
                UNION ALL SELECT datetime(recorded_at) FROM format_action_events WHERE round_id = r.id
                UNION ALL SELECT datetime(created_at) FROM round_setup_drafts WHERE round_id = r.id
                UNION ALL SELECT datetime(compiled_at) FROM round_definitions WHERE round_id = r.id
            ) AS activity
        )
    `.execute(db);

    await db.schema
        .createIndex('rounds_last_activity_at_index')
        .on('rounds')
        .column('last_activity_at')
        .execute();

    const touch = "strftime('%Y-%m-%d %H:%M:%f', 'now')";
    const eventTables = [
        'score_events',
        'stat_events',
        'setup_correction_events',
        'allowance_override_events',
        'ruling_events',
        'format_action_events',
        'round_setup_drafts',
        'round_definitions',
    ];

    await sql`
        CREATE TRIGGER rounds_activity_after_insert
        AFTER INSERT ON rounds
        BEGIN
            UPDATE rounds SET last_activity_at = ${sql.raw(touch)} WHERE id = NEW.id;
        END
    `.execute(db);

    for (const table of eventTables) {
        await sql.raw(`
            CREATE TRIGGER ${table}_touches_round_activity
            AFTER INSERT ON ${table}
            BEGIN
                UPDATE rounds
                SET last_activity_at = ${touch}
                WHERE id = NEW.round_id;
            END
        `).execute(db);
    }

    // Lifecycle and the small direct metadata updates do not append an event,
    // but they are still real edits from the owner's point of view.
    await sql`
        CREATE TRIGGER rounds_metadata_touches_activity
        AFTER UPDATE OF
            course_id, date, round_type, venue_type, start_list_mode,
            window_start, window_end, self_organize, status, name,
            visibility, course_name_snapshot, completed_at
        ON rounds
        BEGIN
            UPDATE rounds SET last_activity_at = ${sql.raw(touch)} WHERE id = NEW.id;
        END
    `.execute(db);
}
