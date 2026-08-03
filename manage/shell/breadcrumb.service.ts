import { Signal } from '@basics/core/client/core';

/** One step of the trail. The last crumb is the current page and has no path. */
export interface Crumb {
    label: string;
    /** App-relative route. Omitted on the current page. */
    path?: string;
}

/**
 * The shell's breadcrumb slot, filled by whichever screen is mounted
 * (spec §3.1: Clubs → {Club} → {Course} → tab).
 *
 * A signal rather than a route-to-crumbs table, because most of the trail is
 * DATA the screen has already fetched — a club's name is not derivable from
 * `/courses/club?id=…`, and a second table mapping ids to names would be a
 * copy of the payload the page is already holding. So the page publishes its
 * own trail as it learns it, and the shell renders whatever is current.
 *
 * `set` from `onMount`, and let the next screen overwrite it — a screen does
 * not need to clear on destroy, and clearing would flicker an empty bar during
 * the swap.
 */
export class BreadcrumbService {
    readonly crumbs = new Signal<Crumb[]>([]);

    set(crumbs: Crumb[]): void {
        this.crumbs.set(crumbs);
    }
}
