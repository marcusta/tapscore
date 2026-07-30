import type { Kysely } from 'kysely';

// A round can carry a NAME — the thing the organizer calls this game ("Tisdags-
// bollen", "Bröllopsrundan"), asked first in the create flow. Nullable: every
// round created before this migration has none, and the name is optional
// forever after. The round header falls back to `course_name_snapshot` when it
// is null, which is exactly what every existing round renders today.
//
// It lives on `rounds` (not on the friendly/competition wrapper) because it is
// round-level metadata like `date` and `course_name_snapshot`, and both
// wrappers want it. It is authored in `RoundSetupDraft.name`, so it versions
// with the draft chain and a setup edit can rename the round.

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema.alterTable('rounds').addColumn('name', 'text').execute();
}
