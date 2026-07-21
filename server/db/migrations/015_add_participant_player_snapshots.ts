import { type Kysely } from 'kysely';

/**
 * TOMBSTONE — no-op.
 *
 * The original `015_add_participant_player_snapshots` belonged to the legacy bridge schema
 * (participants / tee_times / round_definitions) that phase 2.7a deleted in
 * `867a5f2` on 2026-07-03. Databases created after that commit never ran it
 * and must not now — hence the empty `up`.
 *
 * The file has to exist, though: Kysely's migrator refuses to run at all if a
 * migration recorded in `kysely_migration` has no matching file ("corrupted
 * migrations: previously executed migration ... is missing"). The production
 * DB was last migrated at `031`, before the deletion, so it has all five
 * legacy names on record. This tombstone keeps that DB migratable without
 * resurrecting the dropped tables on fresh ones.
 */
export async function up(_db: Kysely<any>): Promise<void> {}
