import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';
import { NavComponent } from './nav.component';
import { AccountMenuComponent } from './account-menu.component';
import { showsAccountMenu } from './shell-chrome';
import { LandingComponent } from '../landing/landing.component';
import { HistoryComponent } from '../history/history.component';
import { RoundComponent } from '../round/round.component';
import { CreateComponent } from '../create/create.component';
import { LoginComponent } from '../auth/login.component';
import { FriendsComponent } from '../friends/friends.component';
import { ProfileComponent } from '../profile/profile.component';
import { AdminComponent } from '../admin/admin.component';
import { CompetitionsComponent } from '../competition/competitions.component';
import { CompetitionDetailComponent } from '../competition/competition-detail.component';
import { features } from '../features';

// The account surface is app-level, not landing-level: one instance in the
// shell header means it is present on every main screen (landing, friends,
// comps, profile) and survives route changes without remounting.
const tpl = template(`
    <div class="app-shell">
        <header bind="header" class="app-shell__header">
            <div bind="account"></div>
        </header>
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);

export class AppComponent extends Component {
    static styles = `
        .app-shell {
            display: grid;
            grid-template-rows: auto 1fr auto;
            height: 100vh;
            height: 100dvh;
            max-width: 560px;
            margin: 0 auto;
            background: ${t('bg')};

            /* The account slot. Its popover is absolutely positioned inside the
               menu component, so the header must not clip or under-stack it. */
            & .app-shell__header {
                grid-row: 1;
                position: relative;
                z-index: 20;
                display: flex;
                justify-content: flex-end;
                padding: ${s('md')} ${s('lg')} 0;

                &.hidden { display: none; }
            }

            & .app-shell__content {
                grid-row: 2;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }

            /* Keep shell children in their declared tracks when route chrome is
               display:none. Without explicit placement, hiding the header makes
               grid auto-placement shift content into the auto-sized first row
               and the empty nav host into 1fr, stranding /round's dock mid-page. */
            & .app-shell__nav {
                grid-row: 3;
            }
        }
    `;

    private router = this.inject(Router);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            header: {
                className: () =>
                    showsAccountMenu(this.router.route.get())
                        ? 'app-shell__header'
                        : 'app-shell__header hidden',
            },
        });

        this.spawn(AccountMenuComponent, this.ref(frag, 'account'));
        this.spawn(NavComponent, this.ref(frag, 'nav'));
        this.$swap(this.ref(frag, 'content'), this.router.route, {
            '/': LandingComponent,
            '/history': HistoryComponent,
            '/round': RoundComponent,
            '/create': CreateComponent,
            '/login': LoginComponent,
            '/friends': FriendsComponent,
            '/profile': ProfileComponent,
            // Always routed — the gate is the server's super_admin check, not
            // the absence of a route. Non-admins reaching /admin see a refusal.
            '/admin': AdminComponent,
            // Toggled off in prod: the routes go away too, so a stale
            // /competitions link falls through to the landing fallback.
            ...(features.competitions
                ? {
                      '/competitions': CompetitionsComponent,
                      '/competition': CompetitionDetailComponent,
                  }
                : {}),
        }, LandingComponent);

        return frag;
    }
}
