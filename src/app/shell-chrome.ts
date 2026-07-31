// What the app shell shows around the routed screen, as a pure function of the
// route (and, for the dock, the session). Two components read this — the header
// that hosts the account menu and the bottom dock — so "where is chrome hidden"
// is one list, not two drifting `if`s.

/**
 * Screens that own the whole viewport. `/login` is a focused single-purpose
 * screen (and its own sign-in affordance would collide with the menu's);
 * `/round` is immersive on-course mode with its own Score/Leaderboard dock.
 */
export const IMMERSIVE_ROUTES: readonly string[] = ['/login', '/round'];

/**
 * The account menu is app-level: present on every main screen — landing,
 * friends, competitions, profile — signed in or not (signed out it is the
 * "Sign in" button, the app's only way in).
 */
export function showsAccountMenu(route: string): boolean {
    return !IMMERSIVE_ROUTES.includes(route);
}

/** The bottom dock additionally needs a session — it is the signed-in app's
 *  navigation, and the anonymous front door is a single screen. */
export function showsDock(route: string, signedIn: boolean): boolean {
    return signedIn && showsAccountMenu(route);
}

/**
 * The dock's one raised action, "Play golf".
 *
 * Deliberately NOT a function of the session: anonymous play is core, so the
 * pill renders signed out too, where there is no tab bar under it. The one
 * screen it stands down on is `/create` itself — a door into the room you are
 * already standing in.
 */
export function showsPlayPill(route: string): boolean {
    return showsAccountMenu(route) && route !== '/create';
}
