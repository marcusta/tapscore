import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn } from '../css';
import { ManageRolesService } from '../roles/roles.service';
import { BreadcrumbService } from './breadcrumb.service';
import { unlockedSections } from './sections';

// A route that no unlocked section owns. Reachable two ways: a stale
// bookmark, and a deep link into a section this caller cannot see — the
// router table is built from the UNLOCKED sections only, so a locked
// section's routes are absent rather than merely hidden.
//
// It deliberately does not say which of the two happened. Telling a caller
// "that section exists, you just may not see it" is a small disclosure with no
// use to the person reading it.

const tpl = template(`
    <section class="mnf">
        <h1 class="mnf__title">Nothing here</h1>
        <p class="mnf__body">That address does not match anything in Tapscore Manage.</p>
        <button bind="home" class="mnf__home" type="button"></button>
    </section>
`);

export class NotFoundComponent extends Component {
    static styles = `
        .mnf {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: ${s('md')};

            & .mnf__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.5rem;
                font-weight: 600;
                color: ${t('text')};
            }

            & .mnf__body {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.95rem;
            }

            & .mnf__home {
                ${btn()}
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('lg')};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                cursor: pointer;

                &.hidden { display: none; }
            }
        }
    `;

    private router = this.inject(Router);
    private roles = this.inject(ManageRolesService);
    private crumbs = this.inject(BreadcrumbService);

    override onMount(): void {
        // The trail belonged to the screen that was here before. A screen sets
        // its own crumbs and never has to clear them — except this one, which
        // is not IN a section and would otherwise inherit the last one's.
        this.crumbs.set([]);
    }

    render(): DocumentFragment {
        const first = unlockedSections(this.roles)[0];
        return this.wire(tpl, {
            home: {
                className: () => (first ? 'mnf__home' : 'mnf__home hidden'),
                textContent: () => (first ? `Go to ${first.label}` : ''),
                onclick: () => {
                    if (first) this.router.navigate(first.path, true);
                },
            },
        });
    }
}
