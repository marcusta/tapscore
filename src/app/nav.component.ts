import { Component, Router, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s } from '../css';

const tpl = template(`
    <nav class="tabbar" bind="root">
        <a bind="homeLink" href="/">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v10h12V10"/><path d="M10 20v-5.5h4V20"/>
            </svg>
            <span>Home</span>
        </a>
        <a bind="friendsLink" href="/friends">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="8" r="3.5"/><path d="M3.5 20c.5-3.5 2.7-5.5 5.5-5.5s5 2 5.5 5.5"/><circle cx="16.5" cy="9.5" r="2.8"/><path d="M16.8 14.6c2.2.4 3.5 2 3.9 4.9"/>
            </svg>
            <span>Friends</span>
        </a>
        <a bind="profileLink" href="/profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M5 20c.7-4 3.3-6 7-6s6.3 2 7 6"/>
            </svg>
            <span>Profile</span>
        </a>
    </nav>
`);

export class NavComponent extends Component {
    static styles = `
        .tabbar {
            display: flex;
            background: ${t('topbar-bg')};
            padding-bottom: env(safe-area-inset-bottom);

            &.hidden { display: none; }

            & a {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                padding: ${s('sm')} 0 ${s('md')};
                color: rgba(247, 244, 234, 0.55);
                text-decoration: none;
                font-size: 0.7rem;
                font-weight: 600;
                letter-spacing: 0.06em;
                text-transform: uppercase;

                & svg { width: 26px; height: 26px; }

                &.active { color: ${t('accent')}; }
            }
        }
    `;

    private router = this.inject(Router);
    private auth = this.inject(AuthService);

    render(): DocumentFragment {
        return this.wire(tpl, {
            root: {
                className: () => {
                    const route = this.router.route.get();
                    // /round is immersive on-course mode: it has its own
                    // Score/Leaderboard dock, and its ← back link exits to the
                    // landing. Stacking the global tabbar under it wastes
                    // on-course screen space.
                    const hidden =
                        !this.auth.currentUser.get() || route === '/login' || route === '/round';
                    return hidden ? 'tabbar hidden' : 'tabbar';
                },
            },
            homeLink: this.router.link('/'),
            friendsLink: this.router.link('/friends'),
            profileLink: this.router.link('/profile'),
        });
    }
}
