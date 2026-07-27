// The API root, split out of `src/api.ts` so a module can take the base path
// without dragging in the 18 generated clients — which matters for tests: a
// suite that mocks `src/api` wholesale would otherwise blank this const for
// every other importer.
//
// Carries the deploy base path (Vite BASE_URL) so API calls resolve under the
// sub-path in production ('/tapscore/api') and at the root in dev ('/api').

export const API_BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/+$/, '') + '/api';
