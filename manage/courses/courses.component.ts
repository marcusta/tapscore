import { Component, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, card } from '../css';
import { BreadcrumbService } from '../shell/breadcrumb.service';
import { PrimitivesDemoComponent } from './primitives-demo.component';

// The Courses section's landing page — a placeholder until T4/T5 replace it
// with the club list. It exists in T2 so the shell has something real to
// route to, and so the breadcrumb slot, the nav's active state and the
// section registry are all exercised by an actual screen rather than by a
// comment claiming they work.
//
// The "Primitives preview" spawned below is TEMPORARY (T3): a fixture that
// shows the shared table, the inline-edit row and the destructive confirm at
// both widths. T4/T5 delete `primitives-demo.component.ts` and the one line
// that spawns it. If you are reading this in a T4 diff, that is the change.

const tpl = template(`
    <section class="mcourses">
        <h1 class="mcourses__title">Courses</h1>
        <p class="mcourses__lead">Clubs, courses, holes, tees and tee roles — the shared golf catalog every round is built from.</p>
        <div class="mcourses__panel">
            <p class="mcourses__panel-title">Coming in M1</p>
            <ul class="mcourses__list">
                <li>Clubs — list, search, create, edit, delete</li>
                <li>Courses — per club, with a readiness badge</li>
                <li>Holes — par and stroke index per hole</li>
                <li>Tees — lengths and ratings per gender</li>
                <li>Tee roles — which tee a Club or Tournament round plays from</li>
            </ul>
        </div>
        <div bind="demoHost"></div>
    </section>
`);

export class CoursesComponent extends Component {
    static styles = `
        .mcourses {
            display: flex;
            flex-direction: column;
            gap: ${s('md')};

            & .mcourses__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${t('text')};
            }

            & .mcourses__lead {
                margin: 0;
                max-width: 60ch;
                color: ${t('text-muted')};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mcourses__panel {
                ${card({})}
                margin-top: ${t('manage-stack-gap')};
                padding: ${t('manage-page-pad')};

                & .mcourses__panel-title {
                    margin: 0 0 ${s('sm')};
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: ${t('text-muted')};
                }

                & .mcourses__list {
                    margin: 0;
                    padding-left: ${s('lg')};
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};
                    color: ${t('text')};
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
            }
        }
    `;

    private crumbs = this.inject(BreadcrumbService);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        // TEMPORARY (T3) — deleted by T4/T5 along with the demo file.
        this.spawn(PrimitivesDemoComponent, this.ref(frag, 'demoHost'), {});
        return frag;
    }

    override onMount(): void {
        this.crumbs.set([{ label: 'Courses' }]);
    }
}
