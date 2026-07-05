import type { Kysely } from 'kysely';

// Landing partition (manual finish) — a round can now be explicitly FINISHED.
// `completed_at` is the wall-clock time the round was sealed, nullable because
// only a finished round carries one. `status='complete'` and `completed_at`
// move together (RoundService.finishByToken sets both; reopen clears both).
//
// Why a column and not just `status`: the "Recently finished" landing section
// is a 14-day window keyed on WHEN the round finished, which `status` alone
// can't answer. The value is a caller-supplied "now" (same shape as
// friendly_rounds.created_at), so scripts/tests stay deterministic.

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('rounds')
        .addColumn('completed_at', 'text')
        .execute();
}
