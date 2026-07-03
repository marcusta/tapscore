import { type Kysely } from 'kysely';

/**
 * Phase 3 — guest-claim tombstone (§17 open item 5).
 *
 * When a registered player claims a guest's rounds, the `ball_players` rows
 * flip from `guest_player_id` to `player_id` and the guest row loses every
 * live reference. The row is KEPT as a tombstone (never deleted) and stamped
 * with who claimed it and when, so:
 *
 *   - "already claimed" is a real, checkable state (a second claim gets a
 *     structured 409 instead of a confusing "guest is not in this round");
 *   - the audit chain survives — `display_name_snapshot` on `ball_players`
 *     stays frozen, and the tombstone records where that identity went.
 *
 * `claimed_by_player_id` deliberately has NO ON DELETE action beyond SET NULL:
 * deleting the claiming player must not resurrect the guest.
 */
export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('guest_players')
        .addColumn('claimed_by_player_id', 'text', (col) =>
            col.references('players.id').onDelete('set null'),
        )
        .execute();

    await db.schema
        .alterTable('guest_players')
        .addColumn('claimed_at', 'text')
        .execute();
}
