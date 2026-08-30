import { Component, Router, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn } from '../css';
import { BreadcrumbService } from '../shell/breadcrumb.service';
import { ClubsService } from './clubs.service';
import { CoursesService } from './courses.service';
import { HolesComponent } from './holes.component';
import { TeesComponent } from './tees.component';
import { TeeRolesComponent } from './tee-roles.component';
import { RouteTemplatesComponent } from './route-templates.component';
import type { Course } from '../../src/api/courses.gen';
import { CLUBS_PATH, COURSE_ROUTE, clubPath } from './routes';

/*
 * One course. Deep-linkable at `/courses/course/<club>/<course>`; see
 * `routes.ts` for why the URL is not nested under the club's.
 *
 * What this page owns is the FRAME: the breadcrumb trail (spec §3.1: Clubs →
 * {Club} → {Course}), the deep-link load, the not-found state for a course
 * deleted since the link was made, and the order the course's editors appear
 * in. The editors themselves are components mounted into hosts — holes (§3.4),
 * tees (§3.5) and the tee-role matrix (§3.6), plus the read-only route list
 * (§3.8) — because each is a heading with its own grid, its own writes and its
 * own failure states, and a page that inlined all four would be one file nobody
 * could review.
 *
 * STACKED SECTIONS rather than tabs, deliberately: they are read together
 * (a tee's per-hole lengths only make sense beside the holes; a tee role points
 * at a tee), and tabs would hide two thirds of a course behind a click while
 * adding a second thing the URL has to remember.
 *
 * Data comes from the club's course list rather than a by-id read: the club
 * page has usually loaded it already, the service is load-once, and one list
 * fetch on a cold deep link is the same cost as one get. That list carries each
 * course's holes, so the holes editor needs no fetch of its own.
 */

const tpl = template(`
    <section class="mcourse">
        <p bind="loadingNote" class="mcourse__note" role="status" aria-live="polite"></p>

        <p bind="loadError" class="mcourse__error" role="alert"></p>
        <button bind="retry" class="mcourse__secondary" type="button">Try again</button>

        <div bind="missing" class="mcourse__body">
            <h1 class="mcourse__title">Course not found</h1>
            <p class="mcourse__lead">This course is not in the catalog. It may have been deleted since the link was made.</p>
            <button bind="backMissing" class="mcourse__secondary" type="button">Back to the club</button>
        </div>

        <div bind="body" class="mcourse__body">
            <header class="mcourse__heading">
                <h1 bind="title" class="mcourse__title"></h1>
                <p bind="subtitle" class="mcourse__lead"></p>
            </header>

            <!-- The course's holes (spec §3.4). A component taking the course
                 id as a prop, spawned below; it publishes no breadcrumb of its
                 own, because the trail this page sets is already its. -->
            <div bind="holesHost" class="mcourse__section"></div>

            <!-- The course's tees (spec §3.5). -->
            <div bind="teesHost" class="mcourse__section"></div>

            <!-- The tee-role matrix (spec §3.6). Below the tees deliberately:
                 a role points AT a tee, so the list it points into has to have
                 been read first. -->
            <div bind="teeRolesHost" class="mcourse__section"></div>

            <!-- The course's saved routes (spec §3.8), read-only. Last of the
                 four because it is the most derived: a route is written in
                 terms of the holes above it and can override a tee's lengths,
                 so it is read after both. -->
            <div bind="routesHost" class="mcourse__section"></div>

            <p class="mcourse__lead">The course’s name, hole count and position are edited on the club page.</p>
            <button bind="back" class="mcourse__secondary" type="button">Back to the club</button>
        </div>
    </section>
`);

export class CourseDetailComponent extends Component {
    static styles = `
        .mcourse {
            display: flex;
            flex-direction: column;
            gap: ${t('manage-stack-gap')};

            & .mcourse__heading {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }

            & .mcourse__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${t('text')};
            }

            & .mcourse__lead {
                margin: 0;
                max-width: 60ch;
                color: ${t('text-muted')};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mcourse__note {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.8rem;

                &[hidden] { display: none; }
            }

            & .mcourse__error {
                margin: 0;
                color: ${t('danger')};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            /* Stacked sections — holes, then tees, then tee roles — with the
               wider section gap between them, because each one is a heading
               with its own grid under it and not another paragraph. */
            & .mcourse__body {
                display: flex;
                flex-direction: column;
                gap: ${t('manage-section-gap')};

                &[hidden] { display: none; }
            }

            /* An unfilled mount host must not spend a gap: the flex gap applies
               to empty children too, so T7's and T8's hosts would push the page
               apart before either exists. */
            & .mcourse__section {
                min-width: 0;

                &:empty { display: none; }
            }

            & .mcourse__secondary {
                ${btn()}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }
        }
    `;

    private router = this.inject(Router);
    private crumbs = this.inject(BreadcrumbService);
    private clubs = this.inject(ClubsService);
    private courses = this.inject(CoursesService);

    private params = this.router.params(COURSE_ROUTE);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            loadingNote: {
                textContent: 'Loading course…',
                hidden: () => this.settled(),
            },
            loadError: {
                textContent: () => this.courses.error.get() ?? '',
                hidden: () => this.courses.error.get() === null,
            },
            retry: {
                hidden: () => this.courses.error.get() === null,
                onclick: () => void this.courses.load(this.clubId(), true),
            },

            missing: {
                // Only once a load has actually finished and said so — before
                // that, "not found" would be a lie about a pending request.
                hidden: () =>
                    !this.settled() || this.courses.error.get() !== null || this.course() !== null,
            },
            backMissing: { onclick: () => this.backToClub() },

            body: { hidden: () => this.course() === null },
            title: () => this.course()?.name ?? '',
            subtitle: () => this.summary(),
            back: { onclick: () => this.backToClub() },
        });

        // The holes editor, spawned with the id read from the URL rather than
        // with a signal: `$swap` tears this page down and rebuilds it on every
        // route change, so the id is fixed for the life of the component. A
        // truncated URL carries none and gets no editor — `onMount` sends it
        // back to the club list instead.
        const courseId = this.courseId();
        if (courseId !== '') {
            this.spawn(HolesComponent, this.ref(frag, 'holesHost'), { courseId });
            // clubId rides along because tee create/delete must invalidate the
            // club page's tee count, and the service's clubId is not
            // trustworthy on a deep link.
            this.spawn(TeesComponent, this.ref(frag, 'teesHost'), {
                clubId: this.clubId(),
                courseId,
            });
            this.spawn(TeeRolesComponent, this.ref(frag, 'teeRolesHost'), { courseId });
            this.spawn(RouteTemplatesComponent, this.ref(frag, 'routesHost'), { courseId });
        }

        return frag;
    }

    override onMount(): void {
        const clubId = this.clubId();
        // A URL missing either id can only have been typed or truncated; send
        // it somewhere real rather than paint "not found".
        if (clubId === '' || this.courseId() === '') {
            this.router.navigate(CLUBS_PATH, true);
            return;
        }

        // Both are load-once and shared, so arriving from the club page costs
        // no second request; a cold deep link pays for one of each.
        void this.clubs.load();
        void this.courses.load(clubId);

        // The trail is DATA, so it is published as it is learned rather than
        // once — neither name is derivable from the URL. The middle crumb keeps
        // its link even before the club's name arrives, so the way back exists
        // from the first paint.
        this.track(
            effect(() => {
                this.crumbs.set([
                    { label: 'Clubs', path: CLUBS_PATH },
                    { label: this.clubs.byId(clubId)?.name ?? 'Club', path: clubPath(clubId) },
                    { label: this.course()?.name ?? 'Course' },
                ]);
            }),
        );
    }

    private clubId(): string {
        return this.params.get().clubId;
    }

    private courseId(): string {
        return this.params.get().courseId;
    }

    private course(): Course | null {
        const id = this.courseId();
        return id === '' ? null : this.courses.byId(id);
    }

    private settled(): boolean {
        return this.courses.loaded.get();
    }

    /** The line under the course's name — what it is, in words. */
    private summary(): string {
        const course = this.course();
        if (!course) return '';
        const club = this.clubs.byId(this.clubId());
        const holes = `${course.holeCount} holes`;
        return club ? `${holes} at ${club.name}.` : `${holes}.`;
    }

    private backToClub(): void {
        this.router.navigate(clubPath(this.clubId()));
    }
}
