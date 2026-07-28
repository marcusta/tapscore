// The bottom dock's item list — pure, so the composition is testable without a
// DOM. Account affordances are NOT here: Profile moved to the landing's
// top-right account menu (its screen still exists at /profile), leaving the
// dock to the three places you go, not the one you are.

export type DockKey = 'home' | 'friends' | 'comps';

export interface DockItem {
    key: DockKey;
    label: string;
    href: string;
    /** Inline SVG glyph. */
    icon: string;
}

const HOME_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v10h12V10"/><path d="M10 20v-5.5h4V20"/></svg>`;
const FRIENDS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M3.5 20c.5-3.5 2.7-5.5 5.5-5.5s5 2 5.5 5.5"/><circle cx="16.5" cy="9.5" r="2.8"/><path d="M16.8 14.6c2.2.4 3.5 2 3.9 4.9"/></svg>`;
const COMPS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v3a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5v2a3 3 0 0 0 3 3"/><path d="M16 5h3v2a3 3 0 0 1-3 3"/><path d="M10 12.5V15h4v-2.5"/><path d="M9 20h6"/><path d="M12 15v5"/></svg>`;

/**
 * Dock items in display order. `competitions` is the same build-time flag the
 * routes use — off, and the tab is absent so the remaining two share the bar.
 */
export function dockItems(flags: { competitions: boolean }): DockItem[] {
    const items: DockItem[] = [
        { key: 'home', label: 'Home', href: '/', icon: HOME_ICON },
        { key: 'friends', label: 'Friends', href: '/friends', icon: FRIENDS_ICON },
    ];
    if (flags.competitions) {
        items.push({ key: 'comps', label: 'Comps', href: '/competitions', icon: COMPS_ICON });
    }
    return items;
}
