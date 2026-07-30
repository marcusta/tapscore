import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { NotFoundError, requireAuth, requireUser } from '@basics/core/server/auth';
import type { PlayerStatsService } from '../services/player-stats.service';
import type { FriendlyRoundService } from '../services/friendly-round.service';

// --- Input schemas ---

/**
 * The whole configuration, always. There is no partial write: the profile
 * screen holds all seven switches, and a partial PUT would make the two module
 * dependencies (short game → putting, recovery → tee) un-checkable in one pass.
 */
const StatsConfigInput = Type.Object({
    enabled: Type.Boolean(),
    tee: Type.Boolean(),
    approach: Type.Boolean(),
    putting: Type.Boolean(),
    shortGame: Type.Boolean(),
    penalties: Type.Boolean(),
    recovery: Type.Boolean(),
});

const StatKeySchema = Type.Union([
    Type.Literal('tee_result'),
    Type.Literal('gir'),
    Type.Literal('first_putt'),
    Type.Literal('putts'),
    Type.Literal('short_game_difficulty'),
    Type.Literal('penalties'),
    Type.Literal('recovery_ok'),
]);

/**
 * `value` is TEXT for every key — enum text, `'0'`/`'1'` for the two booleans,
 * `'0'`..`'3'` for putts, decimal digits for penalties. One column serves
 * seven keys in `stat_events`; the projection does the typing. `null` CLEARS
 * the key (spec §4.1), which is not the same as omitting the item.
 */
const StatEventItem = Type.Object({
    playHoleId: Type.String({ minLength: 1 }),
    playerId: Type.String({ minLength: 1 }),
    key: StatKeySchema,
    value: Type.Union([Type.String(), Type.Null()]),
    clientEventId: Type.String({ minLength: 1 }),
});

// Batched per hole commit (spec §6): one request carries every answer the
// score-entry step collected for that hole, across ball members.
const StatEventsInput = Type.Object({
    token: Type.String({ minLength: 1 }),
    items: Type.Array(StatEventItem),
});

const ByTokenInput = Type.Object({ token: Type.String({ minLength: 1 }) });

/**
 * A page over the ROUND LIST only (presentation §5.1). Both params are
 * optional and omitting them keeps the pre-pagination shape — the whole
 * history in one response.
 *
 * `cursor` is opaque: it is `nextCursor` from the previous page, fed straight
 * back. Clients must not construct or parse it.
 */
const MyStatsInput = Type.Object({
    // INTEGER, not Number. A fractional `limit` passes a Number bound untouched
    // and then reaches SQLite as `LIMIT 2.5` — a datatype mismatch, i.e. a 500
    // for what is a client's malformed request. `Value.Convert` truncates a
    // query string to a whole number for an Integer schema, so the value that
    // reaches the query is an integer by construction.
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 200 })),
    cursor: Type.Optional(Type.String({ minLength: 1 })),
});

const RoundStatsInput = Type.Object({ roundId: Type.String({ minLength: 1 }) });

// --- API descriptor ---
//
// Two authorization models, deliberately different, because the two surfaces
// answer different questions:
//
//   /players/me/stats-config — `requireAuth()`. Configuration is PROFILE data;
//     the caller is the subject, resolved from the session and never from the
//     body (the `/players/me/*` convention).
//
//   /friendly-rounds/stat* — NO `requireAuth()`. The share token IS the write
//     credential, exactly as it is for scores: whoever can score the ball can
//     record how the score happened. What protects the SUBJECT (registered, in
//     the round, per-player ball, module on) is the service, not the edge.
//     `stats-configs` reads the same way, and discloses only which modules the
//     round's own players track — see the note on `PlayerStatsService`.
//
// The framework collapses a null return into `{ ok: true }`, so an unknown
// token must throw `NotFoundError` to stay distinguishable from a hit — the
// same `...Or404` helper shape friendly-rounds.api.ts uses.

async function appendStatsOr404(
    rounds: FriendlyRoundService,
    input: Static<typeof StatEventsInput>,
    recordedByPlayerId: string | null,
) {
    const res = await rounds.appendStatsByToken(input, recordedByPlayerId);
    if (res === null) throw new NotFoundError('friendly round not found');
    return res;
}

async function statsOr404(rounds: FriendlyRoundService, token: string) {
    const res = await rounds.statsByToken(token);
    if (res === null) throw new NotFoundError('friendly round not found');
    return res;
}

async function statsConfigsOr404(rounds: FriendlyRoundService, token: string) {
    const res = await rounds.statsConfigsByToken(token);
    if (res === null) throw new NotFoundError('friendly round not found');
    return res;
}

async function roundHoleStatsOr404(
    svc: PlayerStatsService,
    roundId: string,
    playerId: string,
) {
    const res = await svc.roundHoleStatsForPlayer(roundId, playerId);
    if (res === null) throw new NotFoundError('no stats in that round');
    return res;
}

export function createPlayerStatsApi(svc: PlayerStatsService, rounds: FriendlyRoundService) {
    const mw = [requireAuth()];
    return {
        myConfig: {
            method: 'GET' as const,
            path: '/players/me/stats-config',
            fn: (c: Context) => svc.getConfig(requireUser(c).id),
            middleware: mw,
        },
        putMyConfig: {
            method: 'PUT' as const,
            path: '/players/me/stats-config',
            fn: (input: Static<typeof StatsConfigInput>, c: Context) =>
                svc.putConfig(requireUser(c).id, input),
            schema: StatsConfigInput,
            middleware: mw,
        },
        // SELF-ONLY, v1 (spec §8 q1). There is deliberately no
        // `/players/:id/stats`: performance data is personal, nothing else in
        // the app needs to read it, and a self-scoped path cannot leak by
        // accident — the subject comes from the session, never from the URL.
        // Widening it later is additive; narrowing it would not be.
        //
        // `limit`/`cursor` page the ROUND LIST. TOTALS COVER THE WHOLE HISTORY
        // AND ARE ONLY COMPUTED ON THE FIRST PAGE: `totals` and
        // `roundsWithStats` come back populated when no `cursor` is supplied,
        // and `null` on every cursored page. They were never page subtotals to
        // begin with — recomputing the whole totals view once per page bought
        // the client nothing but latency. Read them off page one and keep them.
        myStats: {
            method: 'GET' as const,
            path: '/players/me/stats',
            fn: (input: Static<typeof MyStatsInput>, c: Context) =>
                svc.summaryForPlayer(requireUser(c).id, input),
            schema: MyStatsInput,
            middleware: mw,
        },
        // Same self-only rule one level down: the round is named in the path,
        // the PLAYER never is. A 404 covers both "no such round" and "you
        // recorded nothing there" — the caller can tell neither apart, which is
        // the point.
        myRoundStats: {
            method: 'GET' as const,
            path: '/players/me/rounds/:roundId/stats',
            fn: (input: Static<typeof RoundStatsInput>, c: Context) =>
                roundHoleStatsOr404(svc, input.roundId, requireUser(c).id),
            schema: RoundStatsInput,
            middleware: mw,
        },
        // An OPTIONAL session only ATTRIBUTES the capture (`recorded_by`) — it
        // never gates it, and it never names the SUBJECT: the subject is
        // `items[].playerId`, checked against the round's ball membership.
        appendEvents: {
            method: 'POST' as const,
            path: '/friendly-rounds/stat-events',
            fn: (input: Static<typeof StatEventsInput>, c: Context) =>
                appendStatsOr404(rounds, input, c.get('user')?.id ?? null),
            schema: StatEventsInput,
        },
        byToken: {
            method: 'GET' as const,
            path: '/friendly-rounds/stats',
            fn: (input: Static<typeof ByTokenInput>) => statsOr404(rounds, input.token),
            schema: ByTokenInput,
        },
        // The prompt set. `/players/me/stats-config` cannot serve capture: the
        // scorer is usually not the player, and a hole's prompts are the union
        // over the ball's members (spec §2). Absent from the list = do not
        // prompt, which is also exactly what `appendEvents` would refuse.
        configsByToken: {
            method: 'GET' as const,
            path: '/friendly-rounds/stats-configs',
            fn: (input: Static<typeof ByTokenInput>) => statsConfigsOr404(rounds, input.token),
            schema: ByTokenInput,
        },
    };
}
