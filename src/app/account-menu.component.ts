import { Component, Computed, Router, Signal, effect, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s } from '../css';
import { ProfileService } from '../profile/profile.service';
import { FriendsService } from '../friends/friends.service';
import { AdminService } from '../admin/admin.service';
import { LandingService } from '../landing/landing.service';
import { signOutSequence } from '../auth/sign-out';
import { accountControl, accountInitials, accountMenuKinds, type AccountMenuState } from './account-menu';

// The app's top-right account surface. Signed out it is a "Sign in" button;
// signed in it is an initials avatar that opens a small popover: who you are,
// Profile, Admin (unscoped super_admin only), Sign out.
//
// It lives in the APP SHELL header, not on one screen, so it is on every main
// screen (landing / friends / comps / profile) and hidden exactly where the
// dock is: /login and the immersive /round.
//
// Everything account-shaped lives here — the dock is HOME / FRIENDS / COMPS
// and the profile screen is reached from this menu, not from a tab.
//
// Not a `role="menu"` widget: that role promises roving-focus/arrow-key
// semantics we don't implement. It is a labelled group of ordinary buttons,
// with the identity block OUTSIDE the interactive group.
const tpl = template(`
    <div class="acct" bind="root">
        <button bind="signin" class="acct__signin" type="button">Sign in</button>
        <button bind="avatar" class="acct__avatar" type="button" aria-label="Account"></button>
        <div bind="menu" class="acct__menu">
            <div class="acct__identity">
                <span class="acct__identity-label">Signed in as</span>
                <span bind="idName" class="acct__identity-name"></span>
                <span bind="idUser" class="acct__identity-user"></span>
            </div>
            <div class="acct__actions" role="group" aria-label="Account">
                <button bind="profile" class="acct__row" type="button">Profile</button>
                <button bind="admin" class="acct__row" type="button">Admin</button>
                <button bind="signout" class="acct__row acct__row--quiet" type="button">Sign out</button>
            </div>
        </div>
    </div>
`);

export class AccountMenuComponent extends Component {
    static styles = `
        .acct {
            position: relative;
            display: flex;
            justify-content: flex-end;

            & .acct__signin {
                padding: ${s('xs')} ${s('md')};
                background: none;
                border: 1px solid ${t('border')};
                border-radius: ${t('radius-pill')};
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 700;
                color: ${t('text')};
                cursor: pointer;

                &:hover { background: ${t('hover-bg')}; }
                &.hidden { display: none; }
            }

            & .acct__avatar {
                width: 38px;
                height: 38px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                background: ${t('primary')};
                color: ${t('primary-text')};
                border: none;
                border-radius: ${t('radius-pill')};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 800;
                letter-spacing: 0.02em;
                cursor: pointer;
                box-shadow: ${t('shadow')};

                &:focus-visible { outline: 2px solid ${t('accent')}; outline-offset: 2px; }
                &.hidden { display: none; }
            }

            & .acct__menu {
                position: absolute;
                top: calc(100% + ${s('xs')});
                right: 0;
                z-index: 20;
                min-width: 208px;
                padding: ${s('xs')};
                background: ${t('surface')};
                border: 1px solid ${t('border')};
                border-radius: ${t('radius')};
                box-shadow: ${t('shadow-elevated')};
                text-align: left;

                &.hidden { display: none; }

                & .acct__identity {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    padding: ${s('sm')} ${s('md')} ${s('md')};
                    border-bottom: 1px solid ${t('border')};
                    margin-bottom: ${s('xs')};

                    & .acct__identity-label {
                        font-size: 0.68rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        color: ${t('text-muted')};
                    }
                    & .acct__identity-name {
                        font-weight: 700;
                        font-size: 0.98rem;
                        color: ${t('text')};
                    }
                    & .acct__identity-user {
                        font-size: 0.82rem;
                        color: ${t('text-muted')};
                        &:empty { display: none; }
                    }
                }

                & .acct__row {
                    display: block;
                    width: 100%;
                    padding: ${s('sm')} ${s('md')};
                    background: none;
                    border: none;
                    border-radius: ${t('radius-sm')};
                    text-align: left;
                    font-family: inherit;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: ${t('text')};
                    cursor: pointer;

                    &:hover { background: ${t('hover-bg')}; }
                    &.acct__row--quiet { color: ${t('text-muted')}; }
                    &.hidden { display: none; }
                }
            }
        }
    `;

    private auth = this.inject(AuthService);
    private profile = this.inject(ProfileService);
    private friends = this.inject(FriendsService);
    // Presentation only — /api/admin/* is gated server-side on the grant.
    private admins = this.inject(AdminService);
    // Sign-out has to reset the landing too — signing out while on '/' never
    // remounts it. See `signOutSequence`.
    private landing = this.inject(LandingService);
    private router = this.inject(Router);

    private open = new Signal(false);

    private state = new Computed<AccountMenuState>(() => ({
        signedIn: this.auth.currentUser.get() !== null,
        displayName: this.profile.player.get()?.displayName ?? null,
        username: this.profile.player.get()?.username ?? this.auth.currentUser.get()?.username ?? null,
        // A failed roles fetch leaves the list empty → false → row hidden.
        isSuperAdmin: this.admins.isSuperAdmin(),
    }));

    private has(kind: 'identity' | 'profile' | 'admin' | 'signout'): boolean {
        return accountMenuKinds(this.state.get()).includes(kind);
    }

    private rowClass(kind: 'profile' | 'admin' | 'signout', extra = ''): string {
        const base = `acct__row${extra}`;
        return this.has(kind) ? base : `${base} hidden`;
    }

    render(): DocumentFragment {
        // Both are load-once per session inside their services, so a remount of
        // the landing never refetches. Anonymous callers skip them entirely.
        if (this.auth.currentUser.get()) {
            void this.profile.load();
            void this.admins.loadRoles();
        }

        const frag = this.wire(tpl, {
            signin: {
                className: () =>
                    accountControl(this.state.get()) === 'signin'
                        ? 'acct__signin'
                        : 'acct__signin hidden',
                onclick: () => {
                    this.open.set(false);
                    this.router.navigate('/login');
                },
            },
            avatar: {
                className: () =>
                    accountControl(this.state.get()) === 'avatar'
                        ? 'acct__avatar'
                        : 'acct__avatar hidden',
                textContent: () => {
                    const st = this.state.get();
                    return accountInitials(st.displayName, st.username);
                },
                'aria-expanded': () => (this.open.get() ? 'true' : 'false'),
                onclick: () => this.open.set(!this.open.get()),
            },
            menu: {
                className: () =>
                    this.open.get() && this.has('identity') ? 'acct__menu' : 'acct__menu hidden',
            },
            idName: () => {
                const rows = this.state.get();
                return (rows.displayName ?? '').trim() || (rows.username ?? '').trim() || 'Signed in';
            },
            idUser: () => {
                const user = (this.state.get().username ?? '').trim();
                return user === '' ? '' : `@${user}`;
            },
            profile: {
                className: () => this.rowClass('profile'),
                onclick: () => {
                    this.open.set(false);
                    this.router.navigate('/profile');
                },
            },
            admin: {
                className: () => this.rowClass('admin'),
                onclick: () => {
                    this.open.set(false);
                    this.router.navigate('/admin');
                },
            },
            signout: {
                className: () => this.rowClass('signout', ' acct__row--quiet'),
                onclick: async () => {
                    this.open.set(false);
                    await signOutSequence({
                        auth: this.auth,
                        profile: this.profile,
                        friends: this.friends,
                        admins: this.admins,
                        landing: this.landing,
                        navigate: (path) => this.router.navigate(path),
                    });
                },
            },
        });

        // Dismissal, self-contained (the app's Escape handling is hand-rolled
        // per component — known debt; this one owns and removes its own
        // listeners rather than reaching for a shared one that doesn't exist).
        //
        // Both elements are captured EAGERLY, while the fragment still holds
        // them: `mount()` moves the nodes out and leaves the fragment empty, so
        // a lookup from inside a handler would find nothing.
        const root = this.ref(frag, 'root');
        const avatar = frag.querySelector<HTMLElement>('[bind="avatar"]');

        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.open.get()) {
                this.open.set(false);
                avatar?.focus();
            }
        };
        const onPointerDown = (e: Event) => {
            if (!this.open.get()) return;
            const target = e.target;
            if (target instanceof Node && root.contains(target)) return;
            this.open.set(false);
        };

        // Listeners exist only while the popover is open — a closed menu on
        // every screen shouldn't sit on the document's keydown/pointerdown
        // path. `detach` is idempotent, so the disposer below is a safe net for
        // being destroyed while open.
        let attached = false;
        const attach = () => {
            if (attached) return;
            attached = true;
            window.addEventListener('keydown', onKeydown);
            document.addEventListener('pointerdown', onPointerDown, true);
        };
        const detach = () => {
            if (!attached) return;
            attached = false;
            window.removeEventListener('keydown', onKeydown);
            document.removeEventListener('pointerdown', onPointerDown, true);
        };
        this.track(
            effect(() => {
                if (this.open.get()) attach();
                else detach();
            }),
        );
        this.track(detach);

        return frag;
    }
}
