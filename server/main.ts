import * as path from 'node:path';
import { serveStatic } from 'hono/bun';
import type { Database } from './db/schema';
import { config } from '@basics/core/server/config';
import { createApp } from '@basics/core/server/app';
import { log } from '@basics/core/server/logger';
import { createServices } from './services/index';
import { mount } from '@basics/core/server/mount';
import { createPlayersApi } from './api/players.api';
import { createAuthNativeApi } from './api/auth-native.api';
import {
    AppleJwksCache,
    createAppleTokenVerifier,
    resolveAppleAudience,
} from './services/apple-identity';
import { createFriendsApi } from './api/friends.api';
import { createClubsApi } from './api/clubs.api';
import { createCoursesApi } from './api/courses.api';
import { createTeesApi } from './api/tees.api';
import { createGuestPlayersApi } from './api/guest-players.api';
import { createHandicapApi } from './api/handicap.api';
import { createRoundsApi } from './api/rounds.api';
// RoundCompiler is the single live write boundary for round setup; the
// legacy participants bridge (API + tables) was deleted in Phase 2.7a.
import { createScoreEventsApi } from './api/score-events.api';
import { createScorecardsApi } from './api/scorecards.api';
import { createPlayerStatsApi } from './api/player-stats.api';
import { createCorrectionsApi } from './api/corrections.api';
import { createFormatActionsApi } from './api/format-actions.api';
import { createLeaderboardsApi } from './api/leaderboards.api';
import { createFormatsApi } from './api/formats.api';
import { createCourseRouteTemplatesApi } from './api/course-route-templates.api';
import { createFriendlyRoundsApi } from './api/friendly-rounds.api';
import { createDashboardApi } from './api/dashboard.api';
import { createSpectateApi } from './api/spectate.api';
import { createFriendProfileApi } from './api/friend-profile.api';
import { registerSpectateEvents } from './api/spectate-events';
import { createSetupApi } from './api/setup.api';
import { createCompetitionsApi } from './api/competitions.api';
import { CompetitionAuthz } from './api/competition-authz';
import { createAdminApi } from './api/admin.api';
import { registerFriendlyRoundEvents } from './api/friendly-rounds-events';
import { AdminAuthz } from './api/admin-authz';
import { fetchWithSseIdleTimeout } from './sse-timeout';
import { seedDev } from './db/seeds/dev';
import { registerBuiltInBallCreationStrategies } from './domain/strategies/ball-creation';
import { registerBuiltInFormats } from './domain/formats';
import { registerBuiltInAggregationStrategies } from './domain/aggregation';

// --- Composition root ---

registerBuiltInBallCreationStrategies();
registerBuiltInFormats();
registerBuiltInAggregationStrategies();

const { app, db, bootstrapAuth } = await createApp<Database>(
    path.join(import.meta.dir, 'db/migrations'),
);

const services = createServices(db);
const {
    playerService,
    friendService,
    clubService,
    courseService,
    courseRouteTemplateService,
    teeService,
    guestPlayerService,
    handicapService,
    roundService,
    scoreEventService,
    scorecardService,
    playerStatsService,
    leaderboardService,
    friendlyRoundService,
    roundJoinService,
    seatClaimService,
    roundLeaveService,
    roundEditService,
    guestClaimService,
    dashboardService,
    friendsActivityService,
    friendProfileService,
    spectateService,
    correctionService,
    formatActionService,
    roleService,
    adminService,
    competitionService,
    competitionRoundService,
    competitionLeaderboardService,
    competitionCutService,
    competitionFinalizeService,
    roundEventsHub,
} = services;

// `sessions` is captured so self-serve registration can issue a session
// cookie exactly like login does (framework `issueSessionCookie`).
/**
 * Four weeks, sliding. A player's session has to survive the gap between
 * rounds: the 24h default signed people out every time they came back to the
 * course, and a re-login before a round is the one moment the app can least
 * afford friction. Set here rather than left to `SESSION_TTL` because it is a
 * product decision about how golf gets played, not a deployment knob — the
 * deployed box should not be able to shorten it by forgetting an env var.
 *
 * Sliding, not fixed: `@basics/core` >= 1.3.0 pushes the expiry forward past
 * the halfway mark AND re-sets the cookie when it does, so an active player is
 * never signed out. Only four full weeks away from the app ends the session.
 */
const SESSION_TTL_MS = 28 * 24 * 60 * 60 * 1000;

const { sessions } = await bootstrapAuth({
    verify: (u, p) => playerService.verify(u, p),
    findUser: (id) => playerService.findById(id),
    sessionTtl: SESSION_TTL_MS,
});

mount(app, '/api', createPlayersApi(playerService, handicapService, friendService, sessions, config.sessionCookie));

// Native track N2 — Sign in with Apple + bearer sessions (ADR-0005).
//
// The audience is the iOS bundle id Apple stamps into `aud`, read straight
// from the environment the same way `port` is below. `resolveAppleAudience`
// owns the rule (and its unit tests): a dev fallback off production, a THROWN
// boot failure on production when APPLE_AUDIENCE is unset — the audience is
// the only thing confining an Apple token to this app, so it must never fail
// open. Set APPLE_AUDIENCE in the systemd unit before the native client ships.
const appleAudience = resolveAppleAudience(process.env);
mount(
    app,
    '/api',
    createAuthNativeApi(
        playerService,
        sessions,
        createAppleTokenVerifier({ audience: appleAudience, keys: new AppleJwksCache() }),
    ),
);
mount(app, '/api', createFriendsApi(friendService));
// A friend's detail page, gated on the same derived mutual edge as the feed
// (docs/proposals/friends-activity.md). Session-scoped: the viewer is the
// session, the subject is the path param.
mount(app, '/api', createFriendProfileApi(friendProfileService));
mount(app, '/api', createClubsApi(clubService));
mount(app, '/api', createCoursesApi(courseService));
mount(app, '/api', createTeesApi(teeService));
mount(app, '/api', createGuestPlayersApi(guestPlayerService));
mount(app, '/api', createHandicapApi(handicapService));
mount(app, '/api', createRoundsApi(roundService));
mount(app, '/api', createScoreEventsApi(scoreEventService));
mount(app, '/api', createScorecardsApi(scorecardService));
// Player statistics (docs/proposals/player-stats.md): profile config under
// `/players/me/*` (session-gated) + the token-scoped capture/read pair that
// rides the same share-token credential as scoring.
mount(app, '/api', createPlayerStatsApi(playerStatsService, friendlyRoundService));
mount(app, '/api', createLeaderboardsApi(leaderboardService));
mount(app, '/api', createFormatsApi());
mount(app, '/api', createCourseRouteTemplatesApi(courseRouteTemplateService));
mount(app, '/api', createFriendlyRoundsApi(friendlyRoundService, guestClaimService, roundJoinService, roundEditService, roundLeaveService, seatClaimService));
mount(app, '/api', createDashboardApi(dashboardService, friendlyRoundService, friendsActivityService));
// Watching a friend's round: session + visibility scoped, read-only, and
// deliberately token-free (docs/proposals/friends-activity.md).
mount(app, '/api', createSpectateApi(spectateService));
mount(app, '/api', createSetupApi(courseService, teeService, clubService));
mount(app, '/api', createCorrectionsApi(correctionService));
mount(app, '/api', createFormatActionsApi(formatActionService));
mount(
    app,
    '/api',
    createCompetitionsApi(
        competitionService,
        competitionRoundService,
        competitionLeaderboardService,
        competitionCutService,
        competitionFinalizeService,
        roleService,
        new CompetitionAuthz(roleService, competitionService),
    ),
);
mount(app, '/api', createAdminApi(adminService, roleService, new AdminAuthz(roleService)));

// Streaming has no descriptor shape (Phase 9a) — a raw Hono route, registered
// with the other /api routes so it precedes the static fallthrough.
registerFriendlyRoundEvents(app, friendlyRoundService, roundEventsHub);
// The same stream for a spectator, authorized by session + visibility instead
// of by share token.
registerSpectateEvents(app, spectateService, roundEventsHub);

// --- Static client ---

// Serve the Vite-built SPA from ./public (committed to git, no build step on
// the server). Registered after the /api routes so they take precedence; any
// other path falls through to index.html for client-side routing.
app.use('/*', serveStatic({ root: './public' }));
app.get('/*', serveStatic({ path: './public/index.html' }));

// --- Dev seed ---

if (process.env.NODE_ENV !== 'production') {
    await seedDev(services);
    log.info({ msg: 'dev seed applied (alice, bob, halmstad/north/yellow)' });
}

// --- Start ---

// Default to 3737 (this service's assigned sig-infra port) when PORT is
// unset, instead of the framework's shared 3000 default. The systemd unit
// sets only NODE_ENV, so prod relies on this fallback. `bun run dev:server`
// still overrides via PORT=3030.
const port = Number(process.env.PORT ?? 3737);

export default {
    port,
    fetch(request: Request, server: Bun.Server<undefined>) {
        return fetchWithSseIdleTimeout(request, server, (nextRequest) => app.fetch(nextRequest));
    },
};

log.info({ msg: 'server started', port });
