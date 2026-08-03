import { di, startApp, Theme } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import './theme';
import { syncThemeColor } from './theme-color';
import { ManageAuthService } from './auth/manage-auth.service';
import { AppComponent } from './app.component';

// Tapscore Manage — entry point. Same shape as `src/main.ts`, and the two
// deliberate differences are the ones the second app forced:
//
//  1. `ManageAuthService` instead of `BasePathAuthService`. Both exist to move
//     the auth endpoints off the framework's own base; Manage's base points a
//     level deeper than the API (see `manage/api-base.ts`).
//  2. No route bounce after `load()`. The player app's login is an optional
//     side door with its own route; here the signed-out state is a GATE the
//     root component swaps in, not a page you can be on — so there is no
//     "already signed in, get off the login page" case to handle.

// Installs `data-theme` on <html> from prefers-color-scheme + localStorage.
// Without it the token blocks sit in the document but neither selector
// matches, so not a single var() resolves.
di.get(Theme);
syncThemeColor();

// Bind the manage-base subclass under the AuthService key BEFORE anything
// injects it. Every `inject(AuthService)` in this app resolves to this
// instance.
di.set(AuthService, new ManageAuthService());
const auth = di.get(AuthService);

await startApp(AppComponent, '#app', {
    hot: import.meta.hot,
    onInit: async () => {
        // Answer "is there a session" before the first paint, so the gate does
        // not flash the sign-in form at someone who is already signed in. The
        // roles call that follows is NOT awaited here — it is driven by the
        // session inside `AppComponent`, and its wait is an honest loading
        // state rather than a blank page.
        await auth.load();
    },
});
