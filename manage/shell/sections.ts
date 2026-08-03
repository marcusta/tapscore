import type { Component } from '@basics/core/client/core';
import type { ManageRolesService } from '../roles/roles.service';
import { CoursesComponent } from '../courses/courses.component';

type ComponentCtor = new () => Component<any>;

/**
 * One top-level area of Manage.
 *
 * The registry below IS the extension point promised in spec §3.1: adding
 * Competitions, Tours or Leagues is one entry in `SECTIONS`, not an edit to
 * the shell, the nav, the router table or the gate. Each of those reads this
 * list; none of them names a section.
 */
export interface ManageSection {
    /** Stable key. Not shown to anyone. */
    id: string;
    /** Nav label — a word, per docs/design-guidelines.md §4. */
    label: string;
    /** The section's landing route, and the prefix its own routes sit under. */
    path: string;
    /**
     * Every deep-linkable route the section owns, landing page included.
     * Merged into one `$swap` map, so a route is bookmarkable by construction
     * rather than by a screen remembering to register itself.
     */
    routes: Record<string, ComponentCtor>;
    /**
     * Which grant unlocks the section. Presentation only — the API stays
     * gated server-side whatever this returns.
     */
    unlocked: (roles: ManageRolesService) => boolean;
}

export const SECTIONS: ManageSection[] = [
    {
        id: 'courses',
        label: 'Courses',
        path: '/courses',
        routes: {
            // T4/T5 add '/courses/club' and '/courses/course' here.
            '/courses': CoursesComponent,
        },
        // `CourseManagementAuthz` on the server: unscoped course_admin, with
        // super_admin as its deliberate superset.
        unlocked: (roles) => roles.canManageCourses(),
    },
];

/** The sections this caller may see. */
export function unlockedSections(roles: ManageRolesService): ManageSection[] {
    return SECTIONS.filter((section) => section.unlocked(roles));
}

/**
 * The router table, built from the unlocked sections only — a locked section's
 * routes are not merely hidden from the nav, they are absent, so a deep link
 * into one falls through to the shell's not-found rather than rendering a
 * screen that will 403 on its first fetch.
 */
export function sectionRoutes(roles: ManageRolesService): Record<string, ComponentCtor> {
    const routes: Record<string, ComponentCtor> = {};
    for (const section of unlockedSections(roles)) Object.assign(routes, section.routes);
    return routes;
}
