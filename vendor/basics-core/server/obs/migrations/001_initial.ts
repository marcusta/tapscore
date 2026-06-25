import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('traces')
        .addColumn('trace_id', 'text', (col) => col.primaryKey())
        .addColumn('method', 'text', (col) => col.notNull())
        .addColumn('path', 'text', (col) => col.notNull())
        .addColumn('status', 'integer', (col) => col.notNull())
        .addColumn('duration_ms', 'real', (col) => col.notNull())
        .addColumn('user_id', 'text')
        .addColumn('timestamp', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        .execute();

    await db.schema
        .createIndex('idx_traces_timestamp')
        .on('traces')
        .column('timestamp')
        .execute();

    await db.schema
        .createTable('analytics_events')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('event', 'text', (col) => col.notNull())
        .addColumn('user_id', 'text')
        .addColumn('metadata', 'text')
        .addColumn('timestamp', 'text', (col) => col.notNull())
        .execute();

    await db.schema
        .createIndex('idx_analytics_events_event_timestamp')
        .on('analytics_events')
        .columns(['event', 'timestamp'])
        .execute();

    await db.schema
        .createTable('metrics_rollups')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('period', 'text', (col) => col.notNull())
        .addColumn('bucket', 'text', (col) => col.notNull())
        .addColumn('requests', 'integer', (col) => col.notNull())
        .addColumn('errors', 'integer', (col) => col.notNull())
        .addColumn('p50_ms', 'real', (col) => col.notNull())
        .addColumn('p95_ms', 'real', (col) => col.notNull())
        .addColumn('timestamp', 'text', (col) => col.notNull())
        .execute();

    await db.schema
        .createIndex('idx_metrics_rollups_period_timestamp')
        .on('metrics_rollups')
        .columns(['period', 'timestamp'])
        .execute();

    await db.schema
        .createTable('error_reports')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('code', 'text', (col) => col.notNull())
        .addColumn('message', 'text', (col) => col.notNull())
        .addColumn('url', 'text', (col) => col.notNull())
        .addColumn('trace_id', 'text')
        .addColumn('user_id', 'text')
        .addColumn('context', 'text')
        .addColumn('timestamp', 'text', (col) => col.notNull())
        .execute();
}
