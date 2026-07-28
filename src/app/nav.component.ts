import { Component, Computed, Router, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s } from '../css';
import { LandingService } from '../landing/landing.service';
import { features } from '../features';
import { dockItems } from './dock-items';
import { showsDock } from './shell-chrome';

const tpl = template(`
    <nav class="tabbar" bind="root"></nav>
`);

const itemTpl = template(`
    <a bind="link">
        <span class="tabbar__icon">
            <span bind="icon" class="tabbar__glyph"></span>
            <span bind="badge" class="tabbar__badge"></span>
        </span>
        <span bind="label"></span>
    </a>
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

                & .tabbar__icon { position: relative; display: inline-flex; }
                & .tabbar__glyph { display: inline-flex; }

                /* "New — you were added" badge on the Home tab: a small accent
                   pill with the count. Hidden entirely at 0 (kept honest). */
                & .tabbar__badge {
                    position: absolute;
                    top: -4px;
                    right: -8px;
                    min-width: 16px;
                    height: 16px;
                    padding: 0 4px;
                    box-sizing: border-box;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    background: ${t('accent')};
                    color: ${t('topbar-bg')};
                    font-size: 0.62rem;
                    font-weight: 800;
                    line-height: 1;
                    border-radius: ${t('radius-pill')};

                    &.show { display: inline-flex; }
                }

                &.active { color: ${t('accent')}; }
            }
        }
    `;

    private router = this.inject(Router);
    private auth = this.inject(AuthService);
    private landing = this.inject(LandingService);

    // The new-to-you count for the Home-tab badge. Only honest when logged in;
    // `newRounds` is empty otherwise. Reads the same shared LandingService the
    // landing populates via `loadMine`.
    private newCount = new Computed(() =>
        this.auth.currentUser.get() ? this.landing.newRounds.get().length : 0,
    );

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: {
                // Same chrome rule as the shell header (see `shell-chrome`),
                // plus a session: /round is immersive on-course mode with its
                // own Score/Leaderboard dock.
                className: () =>
                    showsDock(this.router.route.get(), this.auth.currentUser.get() !== null)
                        ? 'tabbar'
                        : 'tabbar hidden',
            },
        });

        // Feature-toggled items simply aren't in the list, so the remaining
        // tabs share the bar evenly (each `a` is flex: 1).
        const items = dockItems(features);
        this.$each(
            this.ref(frag, 'root'),
            () => items,
            (item, _i, track) =>
                this.wireEl(
                    itemTpl,
                    {
                        link: { ...this.router.link(item.href), href: item.href },
                        icon: { innerHTML: () => item.icon },
                        label: () => item.label,
                        badge: {
                            textContent: () => {
                                if (item.key !== 'home') return '';
                                const n = this.newCount.get();
                                return n === 0 ? '' : String(n);
                            },
                            className: () => {
                                const n = item.key === 'home' ? this.newCount.get() : 0;
                                return n === 0 ? 'tabbar__badge' : 'tabbar__badge show';
                            },
                        },
                    },
                    track,
                ),
            (item) => item.key,
        );

        return frag;
    }
}
