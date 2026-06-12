import * as path from 'node:path';
import type { Database } from './db/schema';
import { config } from '@basics/core/server/config';
import { createApp } from '@basics/core/server/app';
import { log } from '@basics/core/server/logger';
import { createServices } from './services/index';
import { mount } from '@basics/core/server/mount';
import { createPlayersApi } from './api/players.api';
import { createClubsApi } from './api/clubs.api';
import { createCoursesApi } from './api/courses.api';
import { createTeesApi } from './api/tees.api';
import { createGuestPlayersApi } from './api/guest-players.api';
import { createHandicapApi } from './api/handicap.api';
import { createRoundsApi } from './api/rounds.api';
// Phase 2.6b/3b.3.3 — participants API unmounted. RoundCompiler is the
// single live write boundary for round setup; the `participants` /
// `participant_players` tables stay for legacy fixture paths + the
// render-lib bridge, but no HTTP routes target them.
import { createTeeTimesApi } from './api/tee-times.api';
import { createScoreEventsApi } from './api/score-events.api';
import { createScorecardsApi } from './api/scorecards.api';
import { createLeaderboardsApi } from './api/leaderboards.api';
import { seedDev } from './db/seeds/dev';
import { registerBuiltInBallCreationStrategies } from './domain/strategies/ball-creation';
import { registerBuiltInFormatStrategies } from './domain/strategies/formats';

// --- Composition root ---

registerBuiltInBallCreationStrategies();
registerBuiltInFormatStrategies();

const { app, db, bootstrapAuth } = await createApp<Database>(
    path.join(import.meta.dir, 'db/migrations'),
);

const services = createServices(db);
const {
    playerService,
    clubService,
    courseService,
    teeService,
    guestPlayerService,
    handicapService,
    roundService,
    teeTimeService,
    scoreEventService,
    scorecardService,
    leaderboardService,
} = services;

await bootstrapAuth({
    verify: (u, p) => playerService.verify(u, p),
    findUser: (id) => playerService.findById(id),
});

mount(app, '/api', createPlayersApi(playerService));
mount(app, '/api', createClubsApi(clubService));
mount(app, '/api', createCoursesApi(courseService));
mount(app, '/api', createTeesApi(teeService));
mount(app, '/api', createGuestPlayersApi(guestPlayerService));
mount(app, '/api', createHandicapApi(handicapService));
mount(app, '/api', createRoundsApi(roundService));
mount(app, '/api', createTeeTimesApi(teeTimeService));
mount(app, '/api', createScoreEventsApi(scoreEventService));
mount(app, '/api', createScorecardsApi(scorecardService));
mount(app, '/api', createLeaderboardsApi(leaderboardService));

// --- Dev seed ---

if (process.env.NODE_ENV !== 'production') {
    await seedDev(services);
    log.info({ msg: 'dev seed applied (alice, bob, halmstad/north/yellow)' });
}

// --- Start ---

export default { port: config.port, fetch: app.fetch };

log.info({ msg: 'server started', port: config.port });
