import { Component, Router, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { formatRowDate } from '../landing/rows';
import { FriendProfileService } from './friend-profile.service';
import { UNAVAILABILITY_COPY, courseLine } from './friend-profile-model';

// A friend's courses (`/friend-courses?id=…&name=…`) — one read, no cursor:
// the server caps the list and reports the cap with `hasMore`. When it is
// set, one quiet WORDED line says the list is truncated. The profile card's
// `coursesTotal` is deliberately never used as this list's arithmetic —
// private and link rounds count there and their courses may be absent here —
// so no header or terminal row restates a count.

const tpl = template(`
    <div class="fcourses">
        <button bind="back" class="fcourses__back" type="button">Back to profile</button>

        <header class="fcourses__head">
            <h1>Courses</h1>
            <p bind="subtitle"></p>
        </header>

        <div bind="anon" class="fcourses__anon">
            <p>This list lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="refusal" class="fcourses__refusal">
            <p bind="refusalTitle" class="fcourses__refusaltitle"></p>
            <p bind="refusalMsg" class="fcourses__state"></p>
        </div>

        <p bind="state" class="fcourses__state"></p>
        <button bind="retry" class="fcourses__retry" type="button">Try again</button>
        <p bind="empty" class="fcourses__state">No courses to show — no rounds are shared with you.</p>

        <div bind="listCard" class="fcourses__listcard">
            <div bind="list"></div>
        </div>
        <p bind="truncated" class="fcourses__state">Showing the courses played most recently — the full list is longer.</p>
    </div>
`);

const rowTpl = template(`
    <div class="fcourse-row">
        <span bind="name" class="fcourse-row__name"></span>
        <span bind="facts" class="fcourse-row__facts"></span>
    </div>
`);

export class FriendCoursesComponent extends Component {
    static styles = `
        .fcourses {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .fcourses__back {
                ${btn()}
                margin-bottom: ${s('lg')};
                padding: ${s('xs')} ${s('md')};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .fcourses__head {
                margin-bottom: ${s('xl')};
                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600; font-size: 1.7rem; letter-spacing: -0.02em;
                }
                & p { margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem; }
            }

            & .fcourses__anon {
                text-align: center;
                padding: ${s('2xl')} 0;
                color: ${t('text-muted')};
                &.hidden { display: none; }
                & button {
                    ${btn()}
                    margin-top: ${s('md')};
                    padding: ${s('md')} ${s('xl')};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${t('primary')}; color: ${t('primary-text')}; border: none;
                }
            }
            & .fcourses__refusal.hidden { display: none; }
            & .fcourses__refusaltitle { margin: 0; font-weight: 700; }
            & .fcourses__state {
                margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem;
                &:empty { display: none; }
                &.hidden { display: none; }
            }
            & .fcourses__retry {
                ${btn()}
                margin-top: ${s('md')};
                padding: ${s('sm')} ${s('lg')};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .fcourses__listcard {
                ${card()}
                overflow: hidden;
                margin-bottom: ${s('sm')};
                &.hidden { display: none; }
            }
            & .fcourse-row {
                display: flex; flex-direction: column; gap: 1px;
                padding: ${s('md')} ${s('lg')};
                border-bottom: 1px solid ${t('border')};
                &:last-child { border-bottom: none; }

                & .fcourse-row__name { font-weight: 600; font-size: 1rem; }
                & .fcourse-row__facts { color: ${t('text-muted')}; font-size: 0.8rem; }
            }
        }
    `;

    private svc = this.inject(FriendProfileService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    render(): DocumentFragment {
        const idQ = this.router.query('id');
        const nameQ = this.router.query('name');
        const loggedIn = () => this.auth.currentUser.get() !== null;

        // Same effect/untrack seam as the profile page — see the note there.
        this.track(
            effect(() => {
                const id = idQ.get();
                untrack(() => {
                    if (!id || !loggedIn()) return;
                    this.svc.setPlayer(id);
                    void this.svc.loadCourses();
                });
            }),
        );

        const refusal = () => this.svc.unavailable.get();
        const courses = () => (refusal() === null ? this.svc.courses.get() : []);
        const friendName = () => (nameQ.get() ?? '').trim();

        const frag = this.wire(tpl, {
            back: {
                onclick: () =>
                    this.router.navigate('/friend', {
                        query: { id: idQ.get() ?? '', name: friendName() },
                    }),
            },
            subtitle: {
                textContent: () => {
                    const name = friendName();
                    return name
                        ? `Where ${name} has played the rounds they share.`
                        : 'Where the rounds they share were played.';
                },
            },
            refusal: {
                className: () => (refusal() !== null ? 'fcourses__refusal' : 'fcourses__refusal hidden'),
            },
            refusalTitle: {
                textContent: () => {
                    const r = refusal();
                    return r ? UNAVAILABILITY_COPY[r].title : '';
                },
            },
            refusalMsg: {
                textContent: () => {
                    const r = refusal();
                    return r ? UNAVAILABILITY_COPY[r].message : '';
                },
            },
            anon: { className: () => (loggedIn() ? 'fcourses__anon hidden' : 'fcourses__anon') },
            toLogin: {
                onclick: () =>
                    this.router.navigate('/login', {
                        query: {
                            next: `/friend-courses?id=${idQ.get() ?? ''}&name=${encodeURIComponent(friendName())}`,
                        },
                    }),
            },
            state: {
                textContent: () => {
                    if (refusal() !== null || !loggedIn()) return '';
                    if (this.svc.coursesLoading.get()) return 'Loading…';
                    return this.svc.coursesError.get() ?? '';
                },
            },
            retry: {
                className: () =>
                    refusal() === null &&
                    this.svc.coursesError.get() !== null &&
                    !this.svc.coursesLoading.get()
                        ? 'fcourses__retry'
                        : 'fcourses__retry hidden',
                onclick: () => void this.svc.loadCourses(true),
            },
            empty: {
                className: () =>
                    refusal() === null &&
                    this.svc.coursesLoaded.get() &&
                    courses().length === 0 &&
                    this.svc.coursesError.get() === null
                        ? 'fcourses__state'
                        : 'fcourses__state hidden',
            },
            listCard: {
                className: () =>
                    courses().length > 0 ? 'fcourses__listcard' : 'fcourses__listcard hidden',
            },
            truncated: {
                className: () =>
                    refusal() === null && this.svc.coursesHasMore.get() && courses().length > 0
                        ? 'fcourses__state'
                        : 'fcourses__state hidden',
            },
        });

        this.$each(
            this.ref(frag, 'list'),
            courses,
            (course, _i, track) =>
                this.wireEl(
                    rowTpl,
                    {
                        name: () => course.courseName ?? 'Course',
                        facts: () => courseLine(course, formatRowDate),
                    },
                    track,
                ),
            (course) => course.courseId,
        );

        return frag;
    }
}
