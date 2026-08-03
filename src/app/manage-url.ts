// Where the Manage app lives, as seen from the player app.
//
// The two are separate bundles under one deployment: the player app is served
// at BASE_URL ('/tapscore/' in production, '/' in dev) and Manage is served one
// segment beneath it ('/tapscore/manage/'). So the link out of the account menu
// is a real navigation between apps — a full document load, not a route — and
// it has to be derived from the same BASE_URL the player bundle was built with
// rather than hard-coded, or a build under a different sub-path would send the
// owner to a 404.
//
// In DEV the two apps run on different vite ports (5173 and 5273), and this
// path resolves against the player's own origin — so it only reaches Manage
// when both are served from one root, which is what `bun run build` produces
// and what production runs. That is the deliberate trade: the built artifact is
// what ships, and a dev-only override would be a second URL rule to keep true.
//
// Observed on the player dev server (:5183): following the link does not 404.
// Vite's root is the repo root, so '/manage/' resolves to `manage/index.html`
// and the MANAGE app itself boots — one segment below the root its dev build
// was configured for (BASE_URL '/'), which lands the visitor on its own gate
// (sign-in, or not-found once signed in) rather than on a dead end. So the
// dev-mode caveat is "wrong footing, recoverable", not "broken link"; the
// single-root build is still the only arrangement this URL is written for.

const DEFAULT_BASE = import.meta.env?.BASE_URL ?? '/';

/**
 * The Manage app's root, absolute from the server root and with a trailing
 * slash — `/tapscore/manage/` in production, `/manage/` in dev.
 *
 * `base` is a parameter only so the rule can be asserted for both deployments
 * without a build; nothing passes it.
 */
export function manageUrl(base: string = DEFAULT_BASE): string {
    const root = base.trim().replace(/\/+$/, '');
    return `${root === '' ? '' : root}/manage/`;
}
