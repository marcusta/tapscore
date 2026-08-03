import { Component, Router, template } from '@basics/core/client/core';
import { BASE_PATH } from '@basics/core/client/base';
import { t } from '../theme';
import { s } from '../css';
import { ManageRolesService } from '../roles/roles.service';
import { unlockedSections } from './sections';

// The section list. ONE component, mounted twice — in the persistent sidebar
// and in the narrow-width drawer — because they are the same navigation shown
// in two places, and a second copy would be the thing that drifts.
//
// Labels are words (docs/design-guidelines.md §4): no icons, no glyphs, no
// emoji. A management app has few enough destinations that a word is both
// shorter to read and unambiguous, and "Courses" needs no legend.
//
// Real `<a href>`s, not buttons: a section is a page, so middle-click,
// cmd-click and "copy link" all have to work. The click handler is what keeps
// it an SPA navigation; the href is what makes it a link.

const tpl = template(`
    <nav class="mnav" aria-label="Sections">
        <ul bind="list" class="mnav__list"></ul>
    </nav>
`);

const itemTpl = template(`
    <li class="mnav__item">
        <a bind="link" class="mnav__link"><span bind="label"></span></a>
    </li>
`);

export interface NavProps {
    /**
     * Called after a section is chosen. The drawer passes its own close here;
     * the sidebar passes nothing, because nothing has to happen.
     */
    onNavigate?: () => void;
}

export class NavComponent extends Component<NavProps> {
    static styles = `
        .mnav {
            & .mnav__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            & .mnav__link {
                display: flex;
                align-items: center;
                /* The touch-target floor is a MINIMUM, not a target size: the
                   density in this app comes from spacing, never from a
                   smaller hit area (spec §2.5). */
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('md')};
                border-radius: ${t('radius-sm')};
                color: ${t('manage-chrome-fg-muted')};
                font-size: 0.95rem;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;

                &:hover {
                    background: ${t('manage-chrome-hover-bg')};
                    color: ${t('manage-chrome-fg')};
                }

                &:focus-visible {
                    outline: 2px solid ${t('manage-chrome-fg')};
                    outline-offset: -2px;
                }

                /* Elevation, not saturation — design-guidelines §2. */
                &.mnav__link--active {
                    background: ${t('manage-chrome-active-bg')};
                    color: ${t('manage-chrome-fg')};
                    font-weight: 700;
                }
            }
        }
    `;

    private router = this.inject(Router);
    private roles = this.inject(ManageRolesService);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});

        this.$each(
            this.ref(frag, 'list'),
            () => unlockedSections(this.roles),
            (section, _i, track) =>
                this.wireEl(
                    itemTpl,
                    {
                        link: {
                            href: BASE_PATH + section.path,
                            className: () => {
                                const route = this.router.route.get();
                                const active = route === section.path
                                    || route.startsWith(section.path + '/');
                                return active ? 'mnav__link mnav__link--active' : 'mnav__link';
                            },
                            'aria-current': () => {
                                const route = this.router.route.get();
                                return route === section.path
                                    || route.startsWith(section.path + '/')
                                    ? 'page'
                                    : 'false';
                            },
                            onclick: (e: Event) => {
                                // Let the browser handle the modified clicks
                                // that mean "open this somewhere else".
                                const me = e as MouseEvent;
                                if (me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
                                e.preventDefault();
                                this.router.navigate(section.path);
                                this.props.onNavigate?.();
                            },
                        },
                        label: () => section.label,
                    },
                    track,
                ),
            (section) => section.id,
        );

        return frag;
    }
}
