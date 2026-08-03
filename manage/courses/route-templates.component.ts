import { Component, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, card } from '../css';
import { api } from '../api';
import { failureMessage } from '../api-failure';
import type { CourseRouteTemplate } from '../../src/api/course-route-templates.gen';

/*
 * A course's saved route templates, READ-ONLY (spec §3.8).
 *
 * §3.8 defers route-template AUTHORING — `definition_json` is a compiler input
 * with per-hole par and stroke-index overrides, tee overrides and section
 * ranges, and an editor for it is its own project. What §3.8 does NOT defer is
 * knowing what exists: a route already changes how a round is played, so an
 * admin looking at a course must be able to see the ones it carries. Hence a
 * list and nothing else — no create, no edit, no delete, and a muted line
 * saying where they come from, so the absence of controls reads as a decision
 * rather than a missing feature.
 *
 * ── Why no service ──
 *
 * The other sections keep a service because they WRITE: a write has to refetch,
 * invalidate a count on another page, or be re-read after a server-side
 * cascade, and that shared state needs one owner. This section only reads, one
 * course at a time, and nothing else on any page consumes it. A service here
 * would be an indirection with a single caller and a single call.
 *
 * ── What a row says ──
 *
 * The name, how many holes the route plays, and when it was last changed. All
 * three are carried by the payload; nothing is derived beyond counting
 * `playHoles`. What the route DOES — which hole is played in which order, with
 * which overrides — is deliberately not summarised, because a half-summary of a
 * compiled route is the kind of near-truth `docs/design-guidelines.md` rules
 * out. The name is what admins gave it; the editor, when it lands, is what
 * explains the rest.
 */

export type RouteTemplatesProps = {
    courseId: string;
};

const tpl = template(`
    <section class="mroutes">
        <header class="mroutes__heading">
            <h2 class="mroutes__title">Routes</h2>
            <p class="mroutes__lead">Saved ways of playing this course — which holes, in which order. Rounds pick one of these instead of the whole course.</p>
        </header>

        <p bind="loadError" class="mroutes__error" role="alert"></p>
        <button bind="retry" class="mroutes__secondary" type="button">Try again</button>
        <p bind="loadingNote" class="mroutes__note" role="status" aria-live="polite"></p>
        <p bind="empty" class="mroutes__note"></p>

        <ul bind="list" class="mroutes__list"></ul>

        <p bind="deferred" class="mroutes__note"></p>
    </section>
`);

const rowTpl = template(`
    <li class="mroute">
        <span bind="name" class="mroute__name"></span>
        <span bind="meta" class="mroute__meta"></span>
    </li>
`);

export class RouteTemplatesComponent extends Component<RouteTemplatesProps> {
    static styles = `
        .mroutes {
            display: flex;
            flex-direction: column;
            gap: ${t('manage-stack-gap')};
            min-width: 0;

            & .mroutes__heading {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};
                min-width: 0;
            }

            & .mroutes__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.25rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mroutes__lead {
                margin: 0;
                max-width: 60ch;
                color: ${t('text-muted')};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mroutes__note {
                margin: 0;
                max-width: 60ch;
                color: ${t('text-muted')};
                font-size: 0.85rem;
                line-height: 1.5;

                &[hidden] { display: none; }
            }

            & .mroutes__error {
                margin: 0;
                color: ${t('danger')};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mroutes__list {
                ${card()}
                display: flex;
                flex-direction: column;
                gap: 0;
                margin: 0;
                padding: 0;
                list-style: none;

                &[hidden] { display: none; }
            }

            & .mroute {
                display: flex;
                flex-wrap: wrap;
                align-items: baseline;
                justify-content: space-between;
                gap: ${s('xs')} ${s('md')};
                padding: ${s('sm')} ${s('md')};
                min-width: 0;

                & + .mroute {
                    border-top: 1px solid ${t('border')};
                }
            }

            & .mroute__name {
                color: ${t('text')};
                font-size: 0.95rem;
                font-weight: 700;
                min-width: 0;
                overflow-wrap: anywhere;
            }

            & .mroute__meta {
                color: ${t('text-muted')};
                font-size: 0.85rem;
            }

            & .mroutes__secondary {
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

    /** This course's templates, newest change first. */
    private templates = new Signal<CourseRouteTemplate[]>([]);

    /** A failed READ. There are no writes on this surface. */
    private error = new Signal<string | null>(null);

    /** True once a load has finished, success or failure — "empty" vs "not asked". */
    private loaded = new Signal(false);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            loadError: {
                textContent: () => this.error.get() ?? '',
                hidden: () => this.error.get() === null,
            },
            retry: {
                hidden: () => this.error.get() === null,
                onclick: () => void this.load(),
            },
            loadingNote: {
                textContent: 'Loading routes…',
                hidden: () => this.loaded.get(),
            },
            empty: {
                textContent: 'No routes saved for this course yet. Rounds play all of its holes.',
                // Only after a settled, successful load: before that it would be
                // a claim about a request still out.
                hidden: () =>
                    !this.loaded.get() || this.error.get() !== null || this.rows().length > 0,
            },
            list: { hidden: () => this.rows().length === 0 },
            deferred: {
                textContent:
                    'Routes are authored elsewhere for now — this list is read-only, and a route cannot be added or changed here.',
                // The line explains an absence of controls, so it belongs with
                // the list it explains, not over a failed read.
                hidden: () => !this.loaded.get() || this.error.get() !== null,
            },
        });

        this.$each(
            this.ref(frag, 'list'),
            () => this.rows(),
            (row: CourseRouteTemplate, _index, track) =>
                this.wireEl(
                    rowTpl,
                    {
                        name: { textContent: () => row.name },
                        meta: { textContent: () => meta(row) },
                    },
                    track,
                ),
            (row: CourseRouteTemplate) => row.id,
        );

        return frag;
    }

    override onMount(): void {
        void this.load();
    }

    private rows(): CourseRouteTemplate[] {
        return this.templates.get();
    }

    private async load(): Promise<void> {
        const courseId = this.props.courseId;
        this.error.set(null);
        this.loaded.set(false);
        try {
            const templates = await api.courseRouteTemplates.listByCourse({ courseId });
            this.templates.set(sorted(templates));
        } catch (err) {
            this.error.set(
                failureMessage(
                    err,
                    'Could not load the routes. Check your connection and try again.',
                ),
            );
        } finally {
            this.loaded.set(true);
        }
    }
}

/** Newest change first — the order an admin scans a short list in. */
function sorted(templates: CourseRouteTemplate[]): CourseRouteTemplate[] {
    return [...templates].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * A row's second line: how many holes the route plays, and when it last
 * changed. Both are carried; neither is guessed.
 */
export function meta(template: CourseRouteTemplate): string {
    const holes = template.route.playHoles.length;
    const changed = formatStamp(template.updatedAt);
    const played = `${holes} ${holes === 1 ? 'hole' : 'holes'}`;
    return changed === '' ? played : `${played} · Updated ${changed}`;
}

/**
 * An ISO timestamp in the READER's locale, date only. Anything unparseable is
 * dropped rather than printed raw: a row is about the route, and a broken
 * timestamp beside its name reads as data corruption in the route itself.
 */
export function formatStamp(
    stamp: string,
    locale: string = typeof navigator === 'undefined' ? 'en' : navigator.language,
): string {
    const at = new Date(stamp);
    if (Number.isNaN(at.getTime())) return '';
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(at);
}
