// The auth calls, reached through MANAGE's API root.
//
// Same implementation as the player app's instance — `createAuthClient` in
// `src/auth/auth-client.ts` is the one copy of the calls and the reasoning
// behind them — with one different constant. The framework's `AuthService`
// builds its client from `BASE_PATH + '/api'`, and `BASE_PATH` here is the
// manage bundle's own base ('/manage' in dev, '/tapscore/manage' in
// production), so the built-in client would ask for
// `/tapscore/manage/api/auth/me`. The API is one level up (see
// `manage/api-base.ts`), which is what this instance exists to say.

import { createAuthClient } from '../../src/auth/auth-client';
import { API_BASE } from '../api-base';

export const authClient = createAuthClient(API_BASE);
