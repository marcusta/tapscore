import { sql, type Kysely, type Selectable } from 'kysely';
import type { CredentialProvider, Database, PlayersTable } from '../db/schema';
import { ConflictError, NotFoundError, type AuthUser } from '@basics/core/server/auth';
import { parseUniqueViolation } from '@basics/core/server/unique-violation';
import type { HandicapEntry, HandicapService } from './handicap.service';
import type { Gender } from '../domain/compiler/types';

// --- Output types ---

export interface Player {
    id: string;
    username: string;
    displayName: string;
    nickname: string | null;
    avatarUrl: string | null;
    homeClubId: string | null;
    handicapIndex: number | null;
    /**
     * Nullable registration/profile field (migration 033, friends-list
     * roster-drop feature). Missing gender stays editable on a roster row.
     */
    gender: Gender | null;
    /** Soft-delete tombstone (§17). Null = active. */
    deletedAt: string | null;
}

/**
 * Slim profile shape shared by friend-list entries and search results
 * (see friend.service.ts `listFor`). `handicapIndex` is the LIVE
 * `players.handicap_index` column — "current value" per the same convention
 * `updateHandicapIndex` already treats it under, not a `handicap_history`
 * join.
 */
export interface PlayerProfile {
    id: string;
    username: string;
    displayName: string;
    gender: Gender | null;
    handicapIndex: number | null;
    /**
     * `clubs.name` for `players.home_club_id`, resolved by a LEFT JOIN — null
     * when the player set no home club. Carried on the profile (not just the
     * id) so a search result can disambiguate same-named players without the
     * client doing a second lookup per row.
     */
    homeClubName: string | null;
}

export interface PlayerSearchResult extends PlayerProfile {
    isFriend: boolean;
}

/**
 * What `findOrCreateByApple` did, not just what it resolved to.
 *
 * The route needs the distinction because the native client's FIRST screen
 * after Sign in with Apple differs: a brand-new human gets onboarding (name,
 * home club, handicap), a returning one goes straight to their rounds. The
 * player row alone cannot answer that — a returning player and a just-minted
 * one are the same shape — so the fact is reported, never inferred.
 *
 * `created` is true ONLY when this call inserted a new `players` row. A known
 * `sub`, and a race lost to a concurrent request for the same `sub`, are both
 * false: no player was minted by *this* call.
 */
export interface AppleSignInResult {
    player: Player;
    created: boolean;
}

export interface RegisterInput {
    username: string;
    password: string;
    displayName: string;
    nickname?: string | null;
    avatarUrl?: string | null;
    homeClubId?: string | null;
    handicapIndex?: number | null;
    gender?: Gender | null;
}

// --- Row mapping ---

type PlayerRow = Selectable<PlayersTable>;

function toPlayer(row: PlayerRow): Player {
    return {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        nickname: row.nickname,
        avatarUrl: row.avatar_url,
        homeClubId: row.home_club_id,
        handicapIndex: row.handicap_index,
        gender: row.gender,
        deletedAt: row.deleted_at,
    };
}

/**
 * The Apple `sub` in this request already belongs to a DIFFERENT player
 * (ADR-0005: `UNIQUE(provider, subject)` is the linking guard). Distinct from
 * a plain unique violation because the API layer must answer 409 with a
 * meaning — "that Apple account is someone else's" — and never merge two
 * player rows: merging is explicitly deferred by the ADR.
 */
export class AppleSubjectTakenError extends ConflictError {
    constructor(message = 'apple_subject_taken') {
        super(message);
        this.name = 'AppleSubjectTakenError';
    }
}

/**
 * Canonical order for a player's credential providers (`credentialProviders`).
 * Password first because it is the door every pre-ADR-0005 player already had
 * and the web's only one; Apple second because it is the one that gets ADDED.
 * A provider missing from this list sorts last, alphabetically among its peers,
 * so a new provider APPENDS rather than reshuffling the array.
 *
 * That appending property is worth exactly one client, and it is worth saying
 * which: the **TS client** reads `providers` as `string[]` and an unrecognised
 * trailing entry costs it nothing. The **native client does not get that
 * grace** — `TapScore/API/Generated` emits `CredentialProvider` as a CLOSED
 * Swift enum, so an unknown member does not merely fail to match a case, it
 * fails the WHOLE-BODY decode; `probeCredentialsIfNeeded()` then lands on
 * `CredentialProbe.unknown` and the account sheet offers nothing. Ordering is
 * not what saves it, and nothing in this file can.
 *
 * Recorded rather than fixed, deliberately: the fix is generator-level (lenient
 * enums with an unknown case) and belongs to `scripts/generate-swift.ts`, and
 * ADR-0005 rules out new providers in the near term — so the cost of shipping
 * one today is a stale native binary showing no connect offer until it updates.
 * Anyone adding a third provider should change the generator FIRST.
 */
const PROVIDER_ORDER: readonly CredentialProvider[] = ['password', 'apple'];

function providerRank(provider: CredentialProvider): number {
    const i = PROVIDER_ORDER.indexOf(provider);
    return i === -1 ? PROVIDER_ORDER.length : i;
}

/** Today as a plain `YYYY-MM-DD` — the `handicap_history.effective_date` grain. */
function todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Handle generation for players created by Sign in with Apple (ADR-0005).
 *
 * `username` is a public handle, not a credential — friend search returns it
 * (`PlayerSearchResult.username`) — but SIWA gives us no handle at all, and
 * `players.username` is NOT NULL UNIQUE. So one is minted.
 *
 * Scheme: `<slug>-<6 hex>`, where `<slug>` is the human's name lowercased and
 * reduced to `[a-z0-9-]` (max 20 chars), falling back to `golfer` when there
 * is no name or nothing survives the reduction. Constraints mirror the ones
 * `register()` actually enforces — the register schema requires only a
 * non-empty string and the DB requires uniqueness — so a generated handle is
 * always a legal hand-registered one.
 *
 * The random suffix is NOT a collision fallback, it is always present, for
 * two reasons: a bare `anna` would hand a newcomer a handle that reads like a
 * long-standing member's, and always-suffixed handles keep the whole scheme
 * one shape instead of two. Uniqueness is still re-checked and retried, since
 * 24 bits collide eventually and the column will happily reject it.
 *
 * The email is deliberately NOT used as a name or handle source: Apple's
 * private relay hands out `a1b2c3d4e5@privaterelay.appleid.com`, which makes a
 * hostile display name and a meaningless handle.
 */
export function appleUsernameCandidate(name?: string | null): string {
    const slug = (name ?? '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 20)
        .replace(/-+$/g, '');
    const base = slug.length > 0 ? slug : 'golfer';
    const suffix = Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) =>
        b.toString(16).padStart(2, '0'),
    ).join('');
    return `${base}-${suffix}`;
}

/**
 * True when `err` is SQLite's UNIQUE failure for exactly this key. Note the
 * framework's parser keeps the FIRST column of a composite key, so
 * `UNIQUE(provider, subject)` on `player_credentials` reports `provider`.
 */
function isUniqueViolation(err: unknown, table: string, column: string): boolean {
    const uv = parseUniqueViolation(err);
    return uv !== null && uv.table === table && uv.column === column;
}

/** Placeholder display name when Apple's first callback carried no name. */
const APPLE_PLACEHOLDER_DISPLAY_NAME = 'New golfer';

/** Attempts to find a free generated handle before giving up on the sign-in. */
const USERNAME_ATTEMPTS = 5;

export class PlayerService {
    constructor(
        private db: Kysely<Database>,
        private handicaps: HandicapService,
    ) {}

    // --- Queries (read) ---

    private players() {
        return this.db.selectFrom('players').selectAll();
    }

    private byId(id: string) {
        return this.players().where('id', '=', id);
    }

    private byUsername(username: string) {
        return this.players().where('username', '=', username);
    }

    // --- Queries (write) ---

    private insertPlayer(
        values: {
            id: string;
            username: string;
            display_name: string;
            nickname: string | null;
            avatar_url: string | null;
            home_club_id: string | null;
            handicap_index: number | null;
            gender: Gender | null;
        },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('players').values(values);
    }

    /**
     * The password credential for a player (ADR-0005 / migration 041): the
     * hash lives here, never on `players`, and `subject` mirrors the username.
     */
    private insertPasswordCredential(
        values: { player_id: string; subject: string; password_hash: string },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('player_credentials').values({
            id: crypto.randomUUID(),
            provider: 'password',
            ...values,
        });
    }

    /**
     * A non-password credential (today: `provider='apple'`). `password_hash`
     * stays NULL — migration 041's CHECK constraint enforces exactly that, so
     * no fabricated hash can ever be written for an Apple user (the "AI trap"
     * shape ADR-0005 exists to prevent).
     */
    private insertProviderCredential(
        values: { player_id: string; provider: Exclude<CredentialProvider, 'password'>; subject: string },
        trx: Kysely<Database> = this.db,
    ) {
        return trx.insertInto('player_credentials').values({
            id: crypto.randomUUID(),
            password_hash: null,
            ...values,
        });
    }

    private credentialBySubject(
        provider: CredentialProvider,
        subject: string,
        trx: Kysely<Database> = this.db,
    ) {
        return trx
            .selectFrom('player_credentials')
            .select(['id', 'player_id'])
            .where('provider', '=', provider)
            .where('subject', '=', subject);
    }

    private updatePlayerById(id: string, trx: Kysely<Database> = this.db) {
        return trx.updateTable('players').where('id', '=', id);
    }

    // --- Methods ---

    async register(input: RegisterInput): Promise<Player> {
        const id = crypto.randomUUID();
        const passwordHash = await Bun.password.hash(input.password);

        const values = {
            id,
            username: input.username,
            display_name: input.displayName,
            nickname: input.nickname ?? null,
            avatar_url: input.avatarUrl ?? null,
            home_club_id: input.homeClubId ?? null,
            handicap_index: input.handicapIndex ?? null,
            gender: input.gender ?? null,
        };

        // Identity row + its password credential land together: a player
        // created "with a password" who ends up without the credential row
        // could never log in (ADR-0005 — backfill/creation are total).
        await this.db.transaction().execute(async (trx) => {
            await this.insertPlayer(values, trx).execute();
            await this.insertPasswordCredential(
                { player_id: id, subject: input.username, password_hash: passwordHash },
                trx,
            ).execute();
        });

        return {
            id,
            username: input.username,
            displayName: input.displayName,
            nickname: values.nickname,
            avatarUrl: values.avatar_url,
            homeClubId: values.home_club_id,
            handicapIndex: values.handicap_index,
            gender: values.gender,
            deletedAt: null,
        };
    }

    /**
     * Phase 3 self-serve registration. Same as `register`, plus: when the new
     * account arrives WITH a handicap index, the initial `handicap_history`
     * row is appended through `HandicapService.record` (source `'manual'`,
     * effective today, entered by the new player themself) — the index is
     * manually maintained in-app (no WHS/federation posting, PHASES.md
     * 2026-07-03 scope decision), so every index the system ever holds must
     * be traceable to a manual history entry.
     */
    async selfRegister(input: RegisterInput): Promise<Player> {
        // Checked before the insert so an unknown club is a 404, not a raw FK
        // violation — same treatment as `updateProfile`.
        await this.assertClubExists(input.homeClubId);
        const player = await this.register(input);
        if (player.handicapIndex !== null) {
            await this.handicaps.record({
                playerId: player.id,
                handicapIndex: player.handicapIndex,
                source: 'manual',
                effectiveDate: todayIsoDate(),
                enteredByPlayerId: player.id,
            });
        }
        return player;
    }

    /**
     * Manual handicap maintenance (Phase 3): set the player's live
     * `handicap_index` AND append the change to `handicap_history` via
     * `HandicapService.record` (source `'manual'`, entered by the player,
     * effective today unless a date is provided). Per-round snapshots are
     * untouched — history is append-only and the live column is only a
     * convenience "current value".
     */
    async updateHandicapIndex(
        playerId: string,
        handicapIndex: number,
        effectiveDate?: string,
    ): Promise<HandicapEntry> {
        const row = await this.byId(playerId).executeTakeFirst();
        if (!row || row.deleted_at !== null) throw new NotFoundError('player not found');

        await this.updatePlayerById(playerId).set({ handicap_index: handicapIndex }).execute();
        return this.handicaps.record({
            playerId,
            handicapIndex,
            source: 'manual',
            effectiveDate: effectiveDate ?? todayIsoDate(),
            enteredByPlayerId: playerId,
        });
    }

    /**
     * Profile self-update (Phase 3 friends-list feature): `gender` and
     * `homeClubId`. POST (not PATCH) to match this codebase's existing
     * partial-update convention — `updateHandicapIndex` is exposed as `POST
     * /players/me/handicap`, not PATCH; no PATCH endpoint exists anywhere in
     * server/api/*.api.ts, so introducing one here would be a one-off rather
     * than a followed convention.
     *
     * An unknown `homeClubId` is a 404, not a raw FK violation — the club is
     * picked from `GET /clubs`, so a miss means a stale client list.
     */
    async updateProfile(
        playerId: string,
        input: { gender?: Gender | null; homeClubId?: string | null },
    ): Promise<Player> {
        const row = await this.byId(playerId).executeTakeFirst();
        if (!row || row.deleted_at !== null) throw new NotFoundError('player not found');

        if (input.gender !== undefined) {
            await this.updatePlayerById(playerId).set({ gender: input.gender }).execute();
        }

        if (input.homeClubId !== undefined) {
            await this.assertClubExists(input.homeClubId);
            await this.updatePlayerById(playerId)
                .set({ home_club_id: input.homeClubId })
                .execute();
        }

        const updated = await this.byId(playerId).executeTakeFirstOrThrow();
        return toPlayer(updated);
    }

    /** 404 on an unknown home club id; null/undefined (clear / not given) passes. */
    private async assertClubExists(clubId: string | null | undefined): Promise<void> {
        if (clubId == null) return;
        const club = await this.db
            .selectFrom('clubs')
            .select('id')
            .where('id', '=', clubId)
            .executeTakeFirst();
        if (!club) throw new NotFoundError('club not found');
    }

    /**
     * Password login (ADR-0005): the player is still resolved by
     * `players.username` — the public handle — but the hash now comes from the
     * `('password', username)` credential row. A player with no password
     * credential (Apple-only, or GDPR-tombstoned) simply cannot log in this
     * way; that is the whole point of 0..n credentials.
     *
     * The framework's `createAuthApi({ verify, sessions })` contract is
     * unchanged, as is the per-username rate limiting in front of it.
     *
     * SOFT-DELETE, the rule for every login path (stated here once; the Apple
     * path cross-references it): `deleted_at` is NOT consulted. Soft-delete
     * blocks DISCOVERY — `search`, `listActive`, `isActive` all filter on it —
     * not AUTHENTICATION. Whether a soft-deleted player should also be locked
     * out is a product decision, not a bug to fix in passing; it is tracked
     * for the user and deliberately unchanged here. Hard-delete (GDPR) needs
     * no such check: it DELETES the credential rows, so there is nothing left
     * to authenticate with either way.
     *
     * Writes are stricter than logins: `linkAppleCredential`, `updateProfile`
     * and `updateHandicapIndex` do 404 on a tombstoned player.
     */
    async verify(username: string, password: string): Promise<AuthUser | null> {
        const row = await this.byUsername(username).executeTakeFirst();
        if (!row) return null;

        const credential = await this.db
            .selectFrom('player_credentials')
            .select('password_hash')
            .where('provider', '=', 'password')
            .where('subject', '=', username)
            .where('player_id', '=', row.id)
            .executeTakeFirst();
        // Falsy check is deliberate, not a routine null-guard: a legacy
        // empty-string hash (migration 041 backfilled `''` for pre-split GDPR
        // tombstones) must fail closed HERE, before Bun.password.verify ever
        // sees it. Do not narrow this to `credential === undefined`.
        if (!credential?.password_hash) return null;

        const valid = await Bun.password.verify(password, credential.password_hash);
        if (!valid) return null;

        return { id: row.id, username: row.username };
    }

    /**
     * Sign in with Apple (ADR-0005 / N2). `sub` is Apple's stable, app-scoped
     * subject and is the ONLY identity input — `profile` is advisory.
     *
     * Known `sub` → return that player, touching NOTHING. Apple sends the
     * human's name and email only on the FIRST authorization, so a later
     * callback carrying no name must not blank `display_name` — and a later
     * callback carrying a name must not overwrite it either, because by then
     * the name in the database may be one the player edited themself. First
     * write wins, permanently. (Pinned by the replay tests.)
     *
     * Unknown `sub` → identity row + its Apple credential land in ONE
     * transaction, for the same reason `register()` does it: a player created
     * "with Apple" who ends up without the credential row could never sign in
     * again, and would silently become a duplicate human on the next attempt.
     *
     * Soft-delete is not consulted, exactly as in `verify` — see the rule
     * stated there. A tombstoned player signing in with Apple lands back on
     * their own row rather than becoming a second human.
     */
    async findOrCreateByApple(
        sub: string,
        profile?: { name?: string | null; email?: string | null },
    ): Promise<AppleSignInResult> {
        const existing = await this.credentialBySubject('apple', sub).executeTakeFirst();
        if (existing) {
            // FK + ON DELETE CASCADE guarantee the player is there.
            const row = await this.byId(existing.player_id).executeTakeFirstOrThrow();
            return { player: toPlayer(row), created: false };
        }

        const displayName = profile?.name?.trim() || APPLE_PLACEHOLDER_DISPLAY_NAME;

        for (let attempt = 0; attempt < USERNAME_ATTEMPTS; attempt++) {
            const id = crypto.randomUUID();
            const username = appleUsernameCandidate(profile?.name);
            try {
                await this.db.transaction().execute(async (trx) => {
                    await this.insertPlayer(
                        {
                            id,
                            username,
                            display_name: displayName,
                            nickname: null,
                            avatar_url: null,
                            home_club_id: null,
                            handicap_index: null,
                            gender: null,
                        },
                        trx,
                    ).execute();
                    await this.insertProviderCredential(
                        { player_id: id, provider: 'apple', subject: sub },
                        trx,
                    ).execute();
                });
            } catch (err) {
                // A username collision is retryable (new random suffix); a
                // collision on (apple, sub) means a concurrent request for the
                // SAME human won the race — resolve to that player rather than
                // creating a second one.
                if (
                    isUniqueViolation(err, 'players', 'username') &&
                    attempt < USERNAME_ATTEMPTS - 1
                ) {
                    continue;
                }
                const raced = await this.credentialBySubject('apple', sub).executeTakeFirst();
                if (raced) {
                    // The concurrent request minted the row, not this one —
                    // `created` belongs to exactly one of the two callers.
                    const row = await this.byId(raced.player_id).executeTakeFirstOrThrow();
                    return { player: toPlayer(row), created: false };
                }
                throw err;
            }

            return {
                player: {
                    id,
                    username,
                    displayName,
                    nickname: null,
                    avatarUrl: null,
                    homeClubId: null,
                    handicapIndex: null,
                    gender: null,
                    deletedAt: null,
                },
                created: true,
            };
        }

        throw new ConflictError('could not allocate a username for the new player');
    }

    /**
     * Account linking (ADR-0005): an AUTHENTICATED player adds an Apple
     * credential to their OWN identity row — one human, one `players` row, two
     * `player_credentials` rows. It is an insert, never a merge: joining two
     * already-separate player rows is explicitly deferred by the ADR.
     *
     * Idempotent when the `sub` is already this player's. Guarded by
     * `UNIQUE(provider, subject)`: a `sub` owned by someone else raises
     * `AppleSubjectTakenError` (→ 409) and changes nothing.
     *
     * Stricter about soft-delete than the login paths, deliberately: this is a
     * WRITE onto a player's identity, so a tombstoned player 404s. The rule
     * the login paths follow instead is stated at `verify`.
     */
    async linkAppleCredential(playerId: string, sub: string): Promise<Player> {
        const row = await this.byId(playerId).executeTakeFirst();
        if (!row || row.deleted_at !== null) throw new NotFoundError('player not found');

        const existing = await this.credentialBySubject('apple', sub).executeTakeFirst();
        if (existing) {
            if (existing.player_id !== playerId) throw new AppleSubjectTakenError();
            return toPlayer(row);
        }

        try {
            await this.insertProviderCredential(
                { player_id: playerId, provider: 'apple', subject: sub },
                // Nothing else writes here, so the single insert IS the
                // transaction; the UNIQUE index is the real guard against the
                // concurrent case the check above cannot cover.
            ).execute();
        } catch (err) {
            if (isUniqueViolation(err, 'player_credentials', 'provider')) {
                throw new AppleSubjectTakenError();
            }
            throw err;
        }
        return toPlayer(row);
    }

    /**
     * Which KINDS of credential this player holds — provider names only, never
     * `subject` and never `password_hash` (ADR-0005: a credential row is the
     * secret; the provider name is the only part that is not).
     *
     * Exists because nothing else could answer "is Apple already linked?": the
     * native client re-offered "Connect Sign in with Apple" to an account that
     * already had it, because linking is an insert with no read side. This is
     * that read side, and it is deliberately the WEAKEST one that answers the
     * question — a caller learns the shape of their own sign-in menu and
     * nothing that identifies them anywhere else.
     *
     * DISTINCT: a player has 0..n rows per provider in principle (nothing in
     * the schema forbids two `apple` rows for one human — `UNIQUE(provider,
     * subject)` bounds subjects, not players), so the caller must never see
     * `['apple', 'apple']`.
     *
     * STABLE ORDER, and why it is not the row order: credentials arrive in
     * whatever sequence a human happened to link them, so insertion order
     * would answer `['password','apple']` for a web user who added iOS and
     * `['apple','password']` for the same shape reached the other way — two
     * spellings of one set. `PROVIDER_ORDER` is the canonical one, so a client
     * can compare two responses for equality and a test can assert an exact
     * array. The SQL `ORDER BY` underneath keeps even an unrecognised future
     * provider deterministic rather than left to the query planner.
     *
     * Says nothing about soft-delete, on purpose: this mirrors the login paths
     * (`verify`), which do not consult `deleted_at` either. A caller holding a
     * session is by definition able to sign in.
     */
    async credentialProviders(playerId: string): Promise<CredentialProvider[]> {
        const rows = await this.db
            .selectFrom('player_credentials')
            .select('provider')
            .distinct()
            .where('player_id', '=', playerId)
            // Alphabetical here is only the tiebreak for anything
            // `PROVIDER_ORDER` does not know about; the canonical order is
            // applied below. Sort stability (ES2019) preserves it.
            .orderBy('provider', 'asc')
            .execute();
        return rows
            .map((r) => r.provider)
            .sort((a, b) => providerRank(a) - providerRank(b));
    }

    async findById(id: string): Promise<AuthUser | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return { id: row.id, username: row.username };
    }

    async getById(id: string): Promise<Player | null> {
        const row = await this.byId(id).executeTakeFirst();
        if (!row) return null;
        return toPlayer(row);
    }

    async list(): Promise<Player[]> {
        const rows = await this.players().execute();
        return rows.map(toPlayer);
    }

    /** Active players only (soft-delete tombstones excluded). */
    async listActive(): Promise<Player[]> {
        const rows = await this.players().where('deleted_at', 'is', null).execute();
        return rows.map(toPlayer);
    }

    /**
     * Player search (friends-list feature): case-insensitive substring match
     * on `username` OR `display_name`, excluding the caller and soft-deleted
     * players, capped at 20 results. `q.length < 2` short-circuits to `[]`
     * without hitting the DB — avoids a full unindexed LIKE scan on every
     * keystroke of a 0-1 char query. `friendIds`, if given, is used to stamp
     * `isFriend` on each result — kept as a plain Set param rather than this
     * service reaching into FriendService, so PlayerService stays free of
     * sibling-service imports (composition root wires the two together, same
     * pattern as `buildRoundServiceDeps` in services/index.ts).
     */
    async search(callerId: string, q: string, friendIds?: Set<string>): Promise<PlayerSearchResult[]> {
        const query = q.trim();
        if (query.length < 2) return [];

        // Escape LIKE metacharacters so a literal '%' or '_' in the query
        // matches itself instead of acting as a wildcard.
        const escaped = query.toLowerCase().replace(/[\\%_]/g, '\\$&');
        const needle = `%${escaped}%`;
        // Spelled out rather than going through `this.players()` (selectAll):
        // the clubs LEFT JOIN would collide on `id`/`name`.
        const rows = await this.db
            .selectFrom('players')
            .leftJoin('clubs', 'clubs.id', 'players.home_club_id')
            .select([
                'players.id as id',
                'players.username as username',
                'players.display_name as displayName',
                'players.gender as gender',
                'players.handicap_index as handicapIndex',
                'clubs.name as homeClubName',
            ])
            .where('players.deleted_at', 'is', null)
            .where('players.id', '!=', callerId)
            .where((eb) =>
                eb.or([
                    sql<boolean>`lower(players.username) LIKE ${needle} ESCAPE '\\'`,
                    sql<boolean>`lower(players.display_name) LIKE ${needle} ESCAPE '\\'`,
                ]),
            )
            .orderBy('players.display_name')
            .limit(20)
            .execute();

        return rows.map((row) => ({
            ...row,
            homeClubName: row.homeClubName ?? null,
            isFriend: friendIds?.has(row.id) ?? false,
        }));
    }

    /** True when the player exists AND is not soft/hard-deleted. Drives live
     *  navigation links — a deleted player renders by snapshot, with no link. */
    async isActive(id: string): Promise<boolean> {
        const row = await this.byId(id).select(['deleted_at']).executeTakeFirst();
        return !!row && row.deleted_at === null;
    }

    /**
     * Soft-delete: stamp `deleted_at`, preserving the row + all PII. The player
     * drops out of dashboards/active lists; historical scorecards keep rendering
     * by `ball_players.display_name_snapshot`. Idempotent — re-deleting keeps
     * the original timestamp.
     */
    async softDelete(id: string): Promise<void> {
        await this.db
            .updateTable('players')
            .set({ deleted_at: sql`(datetime('now'))` })
            .where('id', '=', id)
            .where('deleted_at', 'is', null)
            .execute();
    }

    /**
     * Hard-delete (GDPR): null every PII field, keep an `id` + `deleted_at`
     * tombstone so FK integrity (ball_players.player_id RESTRICT) survives.
     * `username` is NOT NULL UNIQUE, so it becomes an opaque `deleted:<id>`
     * sentinel rather than null; login is disabled. Snapshots on
     * `ball_players` are untouched — the round still renders the played-as name.
     *
     * Login is disabled by DELETING the player's credentials (ADR-0005 /
     * migration 041), where this used to write `password_hash: ''`. Post-split
     * a credential row with an empty hash would be a lie — it asserts "this
     * human has a password" — and zero credentials is legal and exactly
     * truthful: nothing left to prove identity with. Observable behaviour is
     * unchanged (`verify` returned null for the `''` hash and returns null for
     * a missing credential), and it now also erases the Apple `sub`, which is
     * itself PII the GDPR path must not keep. The credential rows would
     * cascade on a row delete too, but this path deliberately keeps the
     * `players` tombstone for FK integrity, so the delete is explicit.
     */
    async hardDelete(id: string): Promise<void> {
        const now = new Date().toISOString();
        // One transaction: the erasure is credential-delete + PII-scrub, and a
        // crash between them must not leave a half-erased player with no
        // marker that erasure was requested.
        await this.db.transaction().execute(async (trx) => {
            await trx.deleteFrom('player_credentials').where('player_id', '=', id).execute();
            await trx
                .updateTable('players')
                .set({
                    username: `deleted:${id}`,
                    display_name: 'Deleted player',
                    nickname: null,
                    avatar_url: null,
                    home_club_id: null,
                    handicap_index: null,
                    deleted_at: sql`COALESCE(deleted_at, ${now})`,
                })
                .where('id', '=', id)
                .execute();
        });
    }
}
