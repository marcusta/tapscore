// Placeholder entry — T1 (theme) and T2 (shell, router, roles) replace this
// with the real app boot. It renders enough to prove the plumbing: the bundle
// builds, the server serves it under /manage/, and the base-path-corrected
// API root resolves the way `api-base.ts` claims it does.

import { API_BASE } from './api-base';

const app = document.querySelector('#app');
if (app) {
    const heading = document.createElement('h1');
    heading.textContent = 'Tapscore Manage';
    const apiBase = document.createElement('p');
    apiBase.textContent = `API base: ${API_BASE}`;
    app.append(heading, apiBase);
}
