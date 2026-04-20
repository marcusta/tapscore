import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('score_events')
        .addColumn('id', 'text', (col) => col.primaryKey())
        .addColumn('round_id', 'text', (col) =>
            col.notNull().references('rounds.id').onDelete('cascade'),
        )
        .addColumn('participant_id', 'text', (col) =>
            col.notNull().references('participants.id').onDelete('cascade'),
        )
        .addColumn('hole', 'integer', (col) => col.notNull())
        .addColumn('strokes', 'integer')
        .addColumn('event_type', 'text', (col) => col.notNull())
        .addColumn('recorded_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('recorded_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .addColumn('client_event_id', 'text', (col) => col.notNull())
        .addCheckConstraint(
            'score_events_event_type_check',
            sql`event_type IN ('score_entered', 'score_cleared', 'score_confirmed', 'manual_override')`,
        )
        .execute();

    await db.schema
        .createIndex('score_events_round_client_event_unique')
        .on('score_events')
        .columns(['round_id', 'client_event_id'])
        .unique()
        .execute();

    await db.schema
        .createIndex('score_events_participant_hole_index')
        .on('score_events')
        .columns(['participant_id', 'hole'])
        .execute();

    await db.schema
        .createIndex('score_events_round_id_index')
        .on('score_events')
        .column('round_id')
        .execute();

    // Materialised scorecard view — (participant_id, hole) holds latest event state.
    await db.schema
        .createTable('scorecards')
        .addColumn('participant_id', 'text', (col) =>
            col.notNull().references('participants.id').onDelete('cascade'),
        )
        .addColumn('hole', 'integer', (col) => col.notNull())
        .addColumn('strokes', 'integer')
        .addColumn('recorded_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .addColumn('recorded_at', 'text', (col) => col.notNull())
        .addColumn('latest_event_id', 'text', (col) => col.notNull())
        .addPrimaryKeyConstraint('scorecards_pk', ['participant_id', 'hole'])
        .execute();

    // Trigger: on every insert into score_events, rebuild the matching scorecard row
    // IFF the new event is at-or-after the current recorded_at. This keeps replay
    // deterministic: events inserted in any order converge to the state of the
    // latest (by recorded_at) event. score_cleared wipes strokes (row stays for
    // audit). null = DNP, 0 = pickup, n = strokes for the other event types.
    await sql`
        CREATE TRIGGER scorecards_rebuild_on_event
        AFTER INSERT ON score_events
        WHEN NOT EXISTS (
            SELECT 1 FROM scorecards
            WHERE participant_id = NEW.participant_id AND hole = NEW.hole
              AND recorded_at > NEW.recorded_at
        )
        BEGIN
            INSERT INTO scorecards (participant_id, hole, strokes, recorded_by_player_id, recorded_at, latest_event_id)
            VALUES (
                NEW.participant_id,
                NEW.hole,
                CASE WHEN NEW.event_type = 'score_cleared' THEN NULL ELSE NEW.strokes END,
                NEW.recorded_by_player_id,
                NEW.recorded_at,
                NEW.id
            )
            ON CONFLICT (participant_id, hole) DO UPDATE SET
                strokes = CASE WHEN NEW.event_type = 'score_cleared' THEN NULL ELSE NEW.strokes END,
                recorded_by_player_id = NEW.recorded_by_player_id,
                recorded_at = NEW.recorded_at,
                latest_event_id = NEW.id;
        END
    `.execute(db);
}
