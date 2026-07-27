import { type Kysely, sql } from 'kysely';

/**
 * Native track N1 — the credentials split (ADR-0005).
 *
 * `players` welded a credential onto the identity row (`password_hash NOT
 * NULL`). One human is one `players` row; how that human proves who they are
 * is 0..n `player_credentials` rows. Sign in with Apple (N2) then costs a row
 * type and a handler — never a nullable column bolted onto `players`.
 *
 *   player_credentials(id, player_id, provider, subject, password_hash?, created_at)
 *   UNIQUE(provider, subject)
 *
 * `username` STAYS on `players`: it is a public handle (friend search returns
 * `PlayerSearchResult.username`), not a credential. For `provider='password'`
 * the credential's `subject` MIRRORS that username — renaming a player must
 * carry the subject with it (`PlayerService` owns that invariant; no rename
 * path exists today).
 *
 * Backfill is TOTAL and asserted here, not merely tested: every existing
 * player gets exactly one `provider='password'` row carrying its current hash
 * before the column is dropped, and the migration throws if the counts
 * disagree. A partial backfill would silently lock people out.
 *
 * One knowingly-inherited wart: `hardDelete` (GDPR tombstone) used to blank
 * `players.password_hash` to `''`, so pre-existing tombstones backfill a
 * credential with an empty hash. `Bun.password.verify(x, '')` is `false` (not a
 * throw), and their username is the opaque `deleted:<id>` sentinel, so login
 * stays impossible — identical to before. Post-split `hardDelete` DELETES the
 * credential rows instead, which is the honest representation (zero
 * credentials is legal); an empty hash would be a lie about a usable password.
 *
 * Column drop: plain `ALTER TABLE ... DROP COLUMN` (SQLite ≥ 3.35, Bun ships
 * 3.51). No 12-step rebuild here — unlike migration 039 there is no NOT
 * NULL/CHECK to relax, and `players` is the target of many inbound FKs
 * (`ball_players` RESTRICT et al.) that a rebuild would have to dodge. The
 * dropped column carries no index, trigger or view, which is the condition
 * SQLite imposes on DROP COLUMN.
 *
 * Migration-tombstone hazard (PHASES.md): this is a NEW migration, so no
 * `kysely_migration` ledger patching is needed for it.
 *
 * No `down` — the house style (001-040) is forward-only.
 */
export async function up(db: Kysely<any>): Promise<void> {
    // ifNotExists on the DDL: SQLite has no transactional DDL, so if the
    // backfill assertion below ever aborts this migration, the table and
    // index already exist with no ledger row — a re-run must self-heal
    // instead of failing on "table already exists".
    await db.schema
        .createTable('player_credentials')
        .ifNotExists()
        .addColumn('id', 'text', (col) => col.primaryKey())
        /** Cascade: a credential is meaningless without its human. Unlike the
         *  RESTRICT identity FKs (`ball_players`), nothing references a
         *  credential and nothing renders from one. */
        .addColumn('player_id', 'text', (col) =>
            col.notNull().references('players.id').onDelete('cascade'),
        )
        .addColumn('provider', 'text', (col) => col.notNull())
        /** password: the username; apple: the Apple `sub`. */
        .addColumn('subject', 'text', (col) => col.notNull())
        /** Password provider only; NULL for every other provider. */
        .addColumn('password_hash', 'text')
        .addColumn('created_at', 'text', (col) =>
            col.notNull().defaultTo(sql`(datetime('now'))`),
        )
        // The linking guard (ADR-0005): one subject per provider, so a second
        // player cannot claim an Apple `sub` or a password username.
        .addUniqueConstraint('player_credentials_provider_subject_unique', [
            'provider',
            'subject',
        ])
        .addCheckConstraint(
            'player_credentials_provider_check',
            sql`provider IN ('password', 'apple')`,
        )
        // The hash belongs to the password provider and nowhere else — the
        // "fabricated hash for an Apple user" shape this ADR exists to prevent.
        .addCheckConstraint(
            'player_credentials_password_hash_check',
            sql`(provider = 'password') = (password_hash IS NOT NULL)`,
        )
        .execute();

    await db.schema
        .createIndex('player_credentials_player_id_index')
        .ifNotExists()
        .on('player_credentials')
        .column('player_id')
        .execute();

    // --- Backfill: one 'password' credential per existing player -------------
    // Skips players that already hold a password credential for the same
    // reason the DDL uses ifNotExists: a re-run after an aborted first run
    // must not trip UNIQUE(provider, subject) on rows it already inserted.
    const players = await db
        .selectFrom('players')
        .select(['id', 'username', 'password_hash'])
        .where(({ not, exists, selectFrom }: any) =>
            not(
                exists(
                    selectFrom('player_credentials')
                        .select('id')
                        .whereRef('player_credentials.player_id', '=', 'players.id')
                        .where('player_credentials.provider', '=', 'password'),
                ),
            ),
        )
        .execute();

    if (players.length > 0) {
        const rows = players.map((p: { id: string; username: string; password_hash: string }) => ({
            id: crypto.randomUUID(),
            player_id: p.id,
            provider: 'password',
            // subject IS the username for the password provider (ADR-0005).
            subject: p.username,
            password_hash: p.password_hash,
        }));
        // Chunked: SQLite caps bound parameters per statement.
        for (let i = 0; i < rows.length; i += 200) {
            await db.insertInto('player_credentials').values(rows.slice(i, i + 200)).execute();
        }
    }

    // --- Assert the backfill is total ---------------------------------------
    const [{ n: playerCount }] = await db
        .selectFrom('players')
        .select(db.fn.countAll<number>().as('n'))
        .execute();
    const [{ n: credentialCount }] = await db
        .selectFrom('player_credentials')
        .select(db.fn.countAll<number>().as('n'))
        .where('provider', '=', 'password')
        .execute();

    if (Number(playerCount) !== Number(credentialCount)) {
        throw new Error(
            `migration 041: credential backfill is not total — ${playerCount} player(s) but ` +
                `${credentialCount} password credential(s); refusing to drop players.password_hash`,
        );
    }

    // --- Drop the welded column ---------------------------------------------
    await sql`ALTER TABLE players DROP COLUMN password_hash`.execute(db);
}
