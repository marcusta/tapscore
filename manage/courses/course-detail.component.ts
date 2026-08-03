import { Component, Router, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { BreadcrumbService } from '../shell/breadcrumb.service';
import { ClubsService } from './clubs.service';
import { CoursesService } from './courses.service';
import type { Course } from '../../src/api/courses.gen';
import { CLUBS_PATH, COURSE_ROUTE, clubPath } from './routes';

/*
 * One course — the STUB that T6 (holes), T7 (tees) and T8 (the tee-role matrix)
 * fill in. Deep-linkable at `/courses/course/<club>/<course>`; see `routes.ts`
 * for why the URL is not nested under the club's.
 *
 * It exists now rather than with its first tab because the course list links
 * here: a name that is a link to nothing is worse than no link, and a page that
 * states what is coming is an honest answer to the click. What it does carry is
 * real and is not throwaway — the breadcrumb trail (spec §3.1: Clubs → {Club} →
 * {Course}), the deep-link load, and the not-found state for a course that has
 * been deleted since the link was made.
 *
 * Data comes from the club's course list rather than a by-id read: the club
 * page has usually loaded it already, the service is load-once, and one list
 * fetch on a cold deep link is the same cost as one get.
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

            <section class="mcourse__panel">
                <h2 class="mcourse__panel-title">Holes, tees and tee roles</h2>
                <p class="mcourse__lead">Holes, tees and tee roles arrive in the next slice. Until then, the course’s name, hole count and position are edited on the club page.</p>
                <button bind="back" class="mcourse__secondary" type="button">Back to the club</button>
            </section>
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

            & .mcourse__body {
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};

                &[hidden] { display: none; }
            }

            & .mcourse__panel {
                ${card({})}
                display: flex;
                flex-direction: column;
                gap: ${t('manage-stack-gap')};
                padding: ${t('manage-page-pad')};
                align-items: flex-start;
            }

            & .mcourse__panel-title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.15rem;
                font-weight: 600;
                color: ${t('text')};
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

    private params = this.router.params<{ clubId: string; courseId: string }>(COURSE_ROUTE);

    render(): DocumentFragment {
        return this.wire(tpl, {
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
