// Placeholder entry — T2 (shell, router, roles) replaces this with the real
// app boot. It renders enough to prove the plumbing: the bundle builds, the
// server serves it under /manage/, the base-path-corrected API root resolves
// the way `api-base.ts` claims it does, and the shared Tapscore theme paints
// it in whichever colour scheme the browser — or the player app's stored
// preference — asks for.

import { di, Theme } from '@basics/core/client/core';
import { t } from './theme';
import { API_BASE } from './api-base';

// Installs `data-theme` on <html> from prefers-color-scheme + localStorage.
// Without it the token blocks sit in the document but neither selector
// matches, so not a single var() resolves.
di.get(Theme);

const style = document.createElement('style');
style.textContent = `
    .boot {
        display: flex;
        flex-direction: column;
        gap: ${t('manage-stack-gap')};
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: ${t('manage-page-pad')};
        color: ${t('text')};
        text-align: center;
    }
    .boot__title {
        margin: 0;
        font-family: ${t('font-display')};
        font-size: 2rem;
        font-weight: 600;
    }
    .boot__note {
        margin: 0;
        color: ${t('text-muted')};
        font-size: 0.875rem;
    }
`;
document.head.appendChild(style);

const app = document.querySelector('#app');
if (app) {
    app.className = 'boot';
    const heading = document.createElement('h1');
    heading.className = 'boot__title';
    heading.textContent = 'Tapscore Manage';
    const apiBase = document.createElement('p');
    apiBase.className = 'boot__note';
    apiBase.textContent = `API base: ${API_BASE}`;
    app.append(heading, apiBase);
}
