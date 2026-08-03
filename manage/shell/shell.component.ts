import { Component, effect, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { BASE_PATH } from '@basics/core/client/base';
import { t } from '../theme';
import { s, btn } from '../css';
import { SHELL_MEDIA_WIDE } from '../breakpoint';
import { ManageRolesService } from '../roles/roles.service';
import { NavComponent } from './nav.component';
import { BreadcrumbService, crumbKey, type Crumb } from './breadcrumb.service';
import { NotFoundComponent } from './not-found.component';
import { sectionRoutes, unlockedSections } from './sections';

/*
 * The Manage chrome: navigation, breadcrumb, identity, and the outlet the
 * sections render into (spec §3.1).
 *
 * ONE responsive rule, stated once in `breakpoint.ts` (spec §2.5): above
 * `SHELL_MEDIA_WIDE` the sidebar is persistent and there is no top bar; below
 * it the sidebar is gone and the same nav lives in a drawer behind a worded
 * "Menu" button. Not two designs — one layout with the navigation in the two
 * places navigation can go.
 *
 * The chrome is dark ink in both colour schemes, like the player app's tab
 * bar. That is the deliberate through-line: someone who uses both apps should
 * recognise the second one as the same product, and the chrome tokens
 * (`manage-chrome-*`) exist so the ink can carry a cream foreground without a
 * literal anywhere in this file.
 *
 * This component only mounts once the gate has resolved to `ready`, so it may
 * read `ManageRolesService` synchronously: the roles are loaded and, for the
 * lifetime of this mount, settled.
 */

const tpl = template(`
    <div class="mshell">
        <header class="mshell__topbar">
            <button bind="menu" class="mshell__menu" type="button" aria-controls="manage-drawer">Menu</button>
            <span class="mshell__wordmark">Tapscore <b>Manage</b></span>
        </header>

        <aside class="mshell__sidebar">
            <div class="mshell__brand">
                <span class="mshell__wordmark">Tapscore <b>Manage</b></span>
            </div>
            <div bind="sidebarNav" class="mshell__navhost"></div>
            <div bind="sidebarIdentity" class="mshell__identity"></div>
        </aside>

        <div bind="scrim" class="mshell__scrim"></div>

        <aside bind="drawer" id="manage-drawer" class="mshell__drawer" aria-label="Sections">
            <div class="mshell__brand">
                <span class="mshell__wordmark">Tapscore <b>Manage</b></span>
                <button bind="close" class="mshell__close" type="button">Close</button>
            </div>
            <div bind="drawerNav" class="mshell__navhost"></div>
            <div bind="drawerIdentity" class="mshell__identity"></div>
        </aside>

        <main class="mshell__main">
            <nav bind="crumbs" class="mshell__crumbs" aria-label="Breadcrumb"></nav>
            <div bind="outlet" class="mshell__outlet"></div>
        </main>
    </div>
`);

const crumbTpl = template(`
    <li class="mshell__crumb">
        <span bind="sep" class="mshell__crumb-sep">/</span>
        <a bind="link" class="mshell__crumb-link"></a>
        <span bind="current" class="mshell__crumb-current" aria-current="page"></span>
    </li>
`);

const identityTpl = template(`
    <div class="mshell__identity-inner">
        <span bind="who" class="mshell__who"></span>
        <button bind="signout" class="mshell__signout" type="button">Sign out</button>
    </div>
`);

export class ShellComponent extends Component {
    static styles = `
        .mshell {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            min-height: 100vh;
            min-height: 100dvh;
            background: ${t('bg')};

            /* ─── Chrome, shared by top bar, sidebar and drawer ─── */

            & .mshell__wordmark {
                font-family: ${t('font-display')};
                font-size: 1.05rem;
                font-weight: 400;
                letter-spacing: -0.01em;
                color: ${t('manage-chrome-fg')};
                white-space: nowrap;

                & b { font-weight: 700; }
            }

            & .mshell__brand {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${s('sm')};
                min-height: ${t('manage-touch-target')};
                padding: 0 ${s('md')};
                margin-bottom: ${t('manage-stack-gap')};
            }

            /* Inset from the chrome's edges so the active item's pill reads as
               a raised shape sitting ON the sidebar, rather than as a band
               bleeding off both sides of it. */
            & .mshell__navhost {
                flex: 1;
                padding: 0 ${s('sm')};
            }

            & .mshell__identity {
                border-top: 1px solid ${t('manage-chrome-border')};
                padding-top: ${t('manage-stack-gap')};
                margin-top: ${t('manage-stack-gap')};

                & .mshell__identity-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: ${s('sm')};
                    padding: 0 ${s('md')};
                }

                & .mshell__who {
                    color: ${t('manage-chrome-fg-muted')};
                    font-size: 0.8rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }

                & .mshell__signout {
                    ${btn(undefined, 'ghost')}
                    min-height: ${t('manage-touch-target')};
                    padding: 0 ${s('md')};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    /* The recipe's tiers are drawn for the PAGE surface; on the
                       ink chrome they would paint a cream slab. Shape, sizing
                       and states come from the recipe, the skin from the chrome
                       tokens — overrides after the recipe, per ADR-005. */
                    background: transparent;
                    color: ${t('manage-chrome-fg')};
                    border-color: ${t('manage-chrome-border')};
                    cursor: pointer;

                    &:hover {
                        background: ${t('manage-chrome-hover-bg')};
                        color: ${t('manage-chrome-fg')};
                        border-color: ${t('manage-chrome-border')};
                    }
                    &:focus-visible {
                        outline: 2px solid ${t('manage-chrome-fg')};
                        outline-offset: 2px;
                    }
                }
            }

            /* ─── Narrow: top bar + drawer ─── */

            & .mshell__topbar {
                grid-row: 1;
                display: flex;
                align-items: center;
                gap: ${s('md')};
                padding: 0 ${t('manage-page-pad')};
                padding-top: env(safe-area-inset-top);
                min-height: calc(${t('manage-touch-target')} + ${s('md')});
                background: ${t('manage-chrome-bg')};

                & .mshell__menu {
                    ${btn(undefined, 'ghost')}
                    min-height: ${t('manage-touch-target')};
                    min-width: ${t('manage-touch-target')};
                    padding: 0 ${s('md')};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    /* Same reasoning as the sign-out button above: recipe for
                       shape, chrome tokens for skin. The label is the word
                       "Menu" and not a hamburger glyph on purpose — a glyph has
                       no accessible name and this control opens the app's whole
                       navigation (docs/design-guidelines.md §4). */
                    background: transparent;
                    color: ${t('manage-chrome-fg')};
                    border-color: ${t('manage-chrome-border')};
                    cursor: pointer;

                    &:hover {
                        background: ${t('manage-chrome-hover-bg')};
                        color: ${t('manage-chrome-fg')};
                        border-color: ${t('manage-chrome-border')};
                    }
                    &:focus-visible {
                        outline: 2px solid ${t('manage-chrome-fg')};
                        outline-offset: 2px;
                    }
                }
            }

            & .mshell__scrim {
                position: fixed;
                inset: 0;
                z-index: 30;
                background: ${t('manage-scrim')};
                opacity: 0;
                pointer-events: none;
                transition: opacity 160ms ease;

                &.open { opacity: 1; pointer-events: auto; }
            }

            & .mshell__drawer {
                position: fixed;
                top: 0;
                left: 0;
                bottom: 0;
                z-index: 40;
                display: flex;
                flex-direction: column;
                width: min(84vw, calc(${t('manage-sidebar-width')} + ${s('2xl')}));
                padding: ${t('manage-page-pad')} 0;
                padding-top: calc(${t('manage-page-pad')} + env(safe-area-inset-top));
                background: ${t('manage-chrome-bg')};
                /* The shadow disappears against a near-black page in dark
                   scheme, so a hairline carries the drawer's edge there. */
                border-right: 1px solid ${t('manage-chrome-border')};
                box-shadow: ${t('shadow-elevated')};
                transform: translateX(-100%);
                transition: transform 180ms ease;

                &.open { transform: translateX(0); }

                & .mshell__close {
                    ${btn(undefined, 'ghost')}
                    min-height: ${t('manage-touch-target')};
                    padding: 0 ${s('md')};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    background: transparent;
                    color: ${t('manage-chrome-fg')};
                    border-color: ${t('manage-chrome-border')};
                    cursor: pointer;

                    &:hover {
                        background: ${t('manage-chrome-hover-bg')};
                        color: ${t('manage-chrome-fg')};
                        border-color: ${t('manage-chrome-border')};
                    }
                    &:focus-visible {
                        outline: 2px solid ${t('manage-chrome-fg')};
                        outline-offset: 2px;
                    }
                }
            }

            /* The sidebar does not exist below the breakpoint — hidden rather
               than reflowed, because the drawer holds the same nav and two
               copies in the tab order is a bug you only find with a keyboard. */
            & .mshell__sidebar { display: none; }

            /* ─── Content ─── */

            & .mshell__main {
                grid-row: 2;
                min-width: 0;
                padding: ${t('manage-page-pad')};
                padding-bottom: calc(${t('manage-section-gap')} + env(safe-area-inset-bottom));
            }

            & .mshell__crumbs {
                min-height: 1.25rem;
                margin-bottom: ${t('manage-stack-gap')};

                & ol {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: ${s('xs')};
                    font-size: 0.8rem;
                }

                & .mshell__crumb {
                    display: flex;
                    align-items: center;
                    gap: ${s('xs')};
                }

                & .mshell__crumb-sep {
                    color: ${t('text-muted')};
                    &.hidden { display: none; }
                }

                & .mshell__crumb-link {
                    color: ${t('text-muted')};
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;

                    &:hover { color: ${t('text')}; text-decoration: underline; }
                    &.hidden { display: none; }
                }

                & .mshell__crumb-current {
                    color: ${t('text')};
                    font-weight: 700;
                    &.hidden { display: none; }
                }
            }

            & .mshell__outlet {
                max-width: ${t('manage-content-max')};
            }

            /* ─── Wide: persistent sidebar, no top bar, no drawer ─── */

            @media ${SHELL_MEDIA_WIDE} {
                grid-template-columns: ${t('manage-sidebar-width')} 1fr;
                grid-template-rows: 1fr;

                & .mshell__topbar { display: none; }
                & .mshell__drawer,
                & .mshell__scrim { display: none; }

                & .mshell__sidebar {
                    grid-column: 1;
                    grid-row: 1;
                    display: flex;
                    flex-direction: column;
                    position: sticky;
                    top: 0;
                    align-self: start;
                    height: 100vh;
                    height: 100dvh;
                    overflow-y: auto;
                    padding: ${t('manage-page-pad-wide')} 0;
                    background: ${t('manage-chrome-bg')};
                }

                & .mshell__main {
                    grid-column: 2;
                    grid-row: 1;
                    padding: ${t('manage-page-pad-wide')};
                }
            }

            @media (prefers-reduced-motion: reduce) {
                & .mshell__scrim,
                & .mshell__drawer { transition: none; }
            }
        }
    `;

    private router = this.inject(Router);
    private auth = this.inject(AuthService);
    private roles = this.inject(ManageRolesService);
    private breadcrumbs = this.inject(BreadcrumbService);

    private drawerOpen = new Signal(false);

    render(): DocumentFragment {
        // Canonicalise the root before the outlet resolves, so '/' never
        // flashes the not-found screen on the way to the first section. Safe
        // to read the route here: render runs untracked, so this is a one-shot
        // decision and not a subscription.
        const first = unlockedSections(this.roles)[0];
        if (first && this.router.route.get() === '/') this.router.navigate(first.path, true);

        const frag = this.wire(tpl, {
            menu: {
                onclick: () => this.drawerOpen.set(true),
                'aria-expanded': () => String(this.drawerOpen.get()),
            },
            close: { onclick: () => this.drawerOpen.set(false) },
            scrim: {
                className: () => (this.drawerOpen.get() ? 'mshell__scrim open' : 'mshell__scrim'),
                onclick: () => this.drawerOpen.set(false),
            },
            drawer: {
                className: () => (this.drawerOpen.get() ? 'mshell__drawer open' : 'mshell__drawer'),
                // A closed drawer is off-screen but still in the DOM; `inert`
                // is what keeps it out of the tab order and out of the
                // accessibility tree while it is.
                inert: () => !this.drawerOpen.get(),
            },
        });

        this.spawn(NavComponent, this.ref(frag, 'sidebarNav'));
        this.spawn(NavComponent, this.ref(frag, 'drawerNav'), {
            onNavigate: () => this.drawerOpen.set(false),
        });

        this.identity(this.ref(frag, 'sidebarIdentity'));
        this.identity(this.ref(frag, 'drawerIdentity'));
        this.crumbs(this.ref(frag, 'crumbs'));

        this.$swap(
            this.ref(frag, 'outlet'),
            this.router.route,
            sectionRoutes(this.roles),
            NotFoundComponent,
        );

        return frag;
    }

    override onMount(): void {
        // A route change means the drawer's job is done — including a browser
        // Back, which no click handler would have seen. Cheap to run on the
        // first pass too: closing an already-closed drawer is a no-op.
        this.track(
            effect(() => {
                this.router.route.get();
                this.drawerOpen.set(false);
            }),
        );

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.drawerOpen.get()) this.drawerOpen.set(false);
        };
        document.addEventListener('keydown', onKey);
        this.track(() => document.removeEventListener('keydown', onKey));
    }

    /** Who you are, and the way out. Same block in the sidebar and the drawer. */
    private identity(host: HTMLElement): void {
        host.appendChild(
            this.wire(identityTpl, {
                who: () => {
                    const user = this.auth.currentUser.get();
                    return user ? `Signed in as ${user.username}` : '';
                },
                signout: {
                    onclick: () => {
                        this.drawerOpen.set(false);
                        void this.auth.logout();
                    },
                },
            }),
        );
    }

    /** The breadcrumb slot — whatever the mounted screen last published. */
    private crumbs(host: HTMLElement): void {
        const list = document.createElement('ol');
        host.appendChild(list);

        this.$each(
            list,
            () => this.breadcrumbs.crumbs.get(),
            (crumb: Crumb, index, track) =>
                this.wireEl(
                    crumbTpl,
                    {
                        sep: {
                            className: () =>
                                index === 0 ? 'mshell__crumb-sep hidden' : 'mshell__crumb-sep',
                        },
                        link: {
                            className: () =>
                                crumb.path ? 'mshell__crumb-link' : 'mshell__crumb-link hidden',
                            href: crumb.path ? BASE_PATH + crumb.path : '',
                            textContent: () => (crumb.path ? crumb.label : ''),
                            onclick: (e: Event) => {
                                const me = e as MouseEvent;
                                if (me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
                                e.preventDefault();
                                if (crumb.path) this.router.navigate(crumb.path);
                            },
                        },
                        current: {
                            className: () =>
                                crumb.path
                                    ? 'mshell__crumb-current hidden'
                                    : 'mshell__crumb-current',
                            textContent: () => (crumb.path ? '' : crumb.label),
                        },
                    },
                    track,
                ),
            crumbKey,
        );
    }
}
