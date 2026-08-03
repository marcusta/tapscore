import { di, effect, Theme } from '@basics/core/client/core';
import { resolvedDark, resolvedLight } from './theme';

/**
 * Keep `<meta name="theme-color">` on the token the chrome actually uses.
 *
 * The tag itself lives in `index.html` (a meta the browser reads at parse time
 * cannot be created by a module that has not run yet), and its literal there
 * is the light-scheme value. This function is what stops that literal from
 * being a second copy of the palette: both values are read straight off the
 * resolved token maps, so the browser UI colour is `--topbar-bg` by
 * construction — the same ink the top bar, sidebar and drawer are painted in.
 *
 * It is a signal effect rather than a `media="(prefers-color-scheme: dark)"`
 * pair on two tags, because the app's scheme is not always the system's: both
 * clients honour a stored preference (`Theme`, same localStorage key), and a
 * media query cannot see that choice.
 */
export function syncThemeColor(): void {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const theme = di.get(Theme);
    effect(() => {
        const tokens = theme.dark.get() ? resolvedDark : resolvedLight;
        const ink = tokens['topbar-bg'];
        if (ink) meta.setAttribute('content', ink);
    });
}
