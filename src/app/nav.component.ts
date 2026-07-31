import { Component, Computed, Router, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn } from '../css';
import { LandingService } from '../landing/landing.service';
import { features } from '../features';
import { dockItems } from './dock-items';
import { showsDock, showsPlayPill } from './shell-chrome';

// The dock is the tab bar PLUS the one raised action that rides it. They are
// wired together because the pill's position is stated relative to the bar's
// top edge — and because signed out the bar goes away and the pill does not.
//
// Words, not a symbol: the obvious spelling of a floating action button is a
// circle with a plus in it, and it is the wrong one here — a glyph has to be
// learned, and this control is what tells a first-time viewer what the app is
// for. So it carries no icon, glyph or emoji at all.
// The bar's items flank a reserved centre gap instead of sharing the full
// width: the pill is pinned at 50%, and a middle tab (Comps is in the bar in
// dev) or the Home badge on a narrow viewport would otherwise sit under it.
const tpl = template(`
    <div class="dock" bind="root">
        <button bind="play" class="dock__play" type="button">Play golf</button>
        <nav class="tabbar" bind="bar">
            <div bind="left" class="tabbar__side"></div>
            <span class="tabbar__gap" aria-hidden="true"></span>
            <div bind="right" class="tabbar__side"></div>
        </nav>
    </div>
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
        .dock {
            /* The pill is positioned against this box, so it can hang over the
               bar's top edge without either side guessing the other's height. */
            position: relative;

            & .dock__play {
                ${btn(t('radius-pill'))}
                position: absolute;
                left: 50%;
                /* Half the pill's height above the bar's top edge — that
                   overlap is what makes it read as floating rather than as a
                   third tab. */
                bottom: calc(100% - 22px);
                transform: translateX(-50%);
                z-index: 10;
                min-height: 44px;
                padding: ${s('sm')} ${s('xl')};
                font-family: ${t('font-display')};
                font-size: 1.1rem;
                font-weight: 600;
                background: ${t('primary')};
                color: ${t('primary-text')};
                border: none;
                box-shadow: ${t('shadow-elevated')};
                white-space: nowrap;

                &:hover { background: ${t('primary')}; color: ${t('primary-text')}; }
                &:focus-visible { outline: 2px solid ${t('accent')}; outline-offset: 3px; }
                &.hidden { display: none; }

                /* Signed out there is no bar under the pill, so there is
                   nothing to hang off: it sits on the viewport's own bottom
                   edge, clear of the home indicator. */
                &.dock__play--floating {
                    position: fixed;
                    bottom: calc(env(safe-area-inset-bottom) + ${s('lg')});
                }
            }
        }

        .tabbar {
            display: flex;
            background: ${t('topbar-bg')};
            padding-bottom: env(safe-area-inset-bottom);

            &.hidden { display: none; }

            & .tabbar__side { flex: 1; display: flex; }
            /* The pill's landing zone. Fixed even on routes where the pill is
               hidden (/create), so the tabs never jump between screens. */
            & .tabbar__gap { flex: 0 0 9.5rem; }

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
            bar: {
                // Same chrome rule as the shell header (see `shell-chrome`),
                // plus a session: /round is immersive on-course mode with its
                // own Score/Leaderboard dock.
                className: () =>
                    showsDock(this.router.route.get(), this.auth.currentUser.get() !== null)
                        ? 'tabbar'
                        : 'tabbar hidden',
            },
            play: {
                className: () => {
                    const route = this.router.route.get();
                    if (!showsPlayPill(route)) return 'dock__play hidden';
                    // No bar under it ⇒ it floats on the viewport instead.
                    return showsDock(route, this.auth.currentUser.get() !== null)
                        ? 'dock__play'
                        : 'dock__play dock__play--floating';
                },
                onclick: () => this.router.navigate('/create'),
            },
        });

        // Feature-toggled items simply aren't in the list; what remains is
        // split around the centre gap — first half left of the pill, rest
        // right — and the tabs inside each side share it evenly (flex: 1).
        const items = dockItems(features);
        const split = Math.ceil(items.length / 2);
        const renderItem = (item: (typeof items)[number], track: (d: () => void) => void) =>
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
            );
        this.$each(
            this.ref(frag, 'left'),
            () => items.slice(0, split),
            (item, _i, track) => renderItem(item, track),
            (item) => item.key,
        );
        this.$each(
            this.ref(frag, 'right'),
            () => items.slice(split),
            (item, _i, track) => renderItem(item, track),
            (item) => item.key,
        );

        return frag;
    }
}
