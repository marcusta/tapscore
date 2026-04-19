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

// --- Composition root ---

const { app, db, bootstrapAuth } = await createApp<Database>(
    path.join(import.meta.dir, 'db/migrations'),
);

const {
    playerService,
    clubService,
    courseService,
    teeService,
    guestPlayerService,
    handicapService,
} = createServices(db);

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

// --- Dev seed ---

if (process.env.NODE_ENV !== 'production') {
    try {
        await playerService.register({
            username: 'alice',
            password: 'password123',
            displayName: 'Alice Andersson',
        });
        log.info({ msg: 'dev seed: created player alice' });
    } catch {
        // Already exists (unique constraint) — ignore
    }
}

// --- Start ---

export default { port: config.port, fetch: app.fetch };

log.info({ msg: 'server started', port: config.port });
