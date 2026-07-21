import * as path from 'node:path';
import { serveStatic } from 'hono/bun';
import type { Database } from './db/schema';
import { config } from '@basics/core/server/config';
import { createApp } from '@basics/core/server/app';
import { log } from '@basics/core/server/logger';
import { createServices } from './services/index';
import { mount } from '@basics/core/server/mount';
import { createPlayersApi } from './api/players.api';
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
import { createCorrectionsApi } from './api/corrections.api';
import { createFormatActionsApi } from './api/format-actions.api';
import { createLeaderboardsApi } from './api/leaderboards.api';
import { createFormatsApi } from './api/formats.api';
import { createCourseRouteTemplatesApi } from './api/course-route-templates.api';
import { createFriendlyRoundsApi } from './api/friendly-rounds.api';
import { createDashboardApi } from './api/dashboard.api';
import { createSetupApi } from './api/setup.api';
import { createCompetitionsApi } from './api/competitions.api';
import { CompetitionAuthz } from './api/competition-authz';
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
    leaderboardService,
    friendlyRoundService,
    roundJoinService,
    seatClaimService,
    roundLeaveService,
    roundEditService,
    guestClaimService,
    dashboardService,
    correctionService,
    formatActionService,
    roleService,
    competitionService,
    competitionRoundService,
    competitionLeaderboardService,
    competitionCutService,
    competitionFinalizeService,
} = services;

// `sessions` is captured so self-serve registration can issue a session
// cookie exactly like login does (framework `issueSessionCookie`).
const { sessions } = await bootstrapAuth({
    verify: (u, p) => playerService.verify(u, p),
    findUser: (id) => playerService.findById(id),
});

mount(app, '/api', createPlayersApi(playerService, handicapService, friendService, sessions, config.sessionCookie));
mount(app, '/api', createFriendsApi(friendService));
mount(app, '/api', createClubsApi(clubService));
mount(app, '/api', createCoursesApi(courseService));
mount(app, '/api', createTeesApi(teeService));
mount(app, '/api', createGuestPlayersApi(guestPlayerService));
mount(app, '/api', createHandicapApi(handicapService));
mount(app, '/api', createRoundsApi(roundService));
mount(app, '/api', createScoreEventsApi(scoreEventService));
mount(app, '/api', createScorecardsApi(scorecardService));
mount(app, '/api', createLeaderboardsApi(leaderboardService));
mount(app, '/api', createFormatsApi());
mount(app, '/api', createCourseRouteTemplatesApi(courseRouteTemplateService));
mount(app, '/api', createFriendlyRoundsApi(friendlyRoundService, guestClaimService, roundJoinService, roundEditService, roundLeaveService, seatClaimService));
mount(app, '/api', createDashboardApi(dashboardService, friendlyRoundService));
mount(app, '/api', createSetupApi(courseService, teeService));
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

export default { port, fetch: app.fetch };

log.info({ msg: 'server started', port });
