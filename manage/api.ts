// The manage app's typed clients. Same generated clients as the player app
// (`src/api/*.gen.ts` is the single source of truth for API shapes) — only the
// base path differs, hence the local `API_BASE`. Wire further clients here as
// sections land; keep the generated files untouched.

import { createClubsClient } from '../src/api/clubs.gen';
import { createCoursesClient } from '../src/api/courses.gen';
import { createTeesClient } from '../src/api/tees.gen';
import { createAdminClient } from '../src/api/admin.gen';
import { API_BASE } from './api-base';

export { ApiError } from '@basics/core/client/api-error';

export { API_BASE } from './api-base';

export const api = {
    clubs: createClubsClient(API_BASE),
    courses: createCoursesClient(API_BASE),
    tees: createTeesClient(API_BASE),
    // Carries `GET /me/roles`, the caller-scoped roles bootstrap the shell
    // gates presentation on (T2).
    admin: createAdminClient(API_BASE),
};
