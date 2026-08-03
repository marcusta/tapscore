// The manage app's API root — deliberately NOT `src/api-base.ts`.
//
// That one derives the root from Vite BASE_URL, which is correct for the
// player app ('/tapscore/' -> '/tapscore/api') but wrong here: the manage
// bundle is served under '/tapscore/manage/', so the same rule would compute
// '/tapscore/manage/api'. The API lives one level up, next to the manage app
// rather than under it, so the trailing 'manage' segment is stripped first:
// prod '/tapscore/manage/' -> '/tapscore/api', dev '/manage/' -> '/api'.

export const API_BASE = (import.meta.env?.BASE_URL ?? '/')
    .replace(/\/+$/, '')
    .replace(/\/manage$/, '') + '/api';
