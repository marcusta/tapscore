import { Component, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { SelectComponent, type SelectOption } from '@basics/core/client/ui/select';
import type { Club } from '../api/clubs.gen';
import { api } from '../api';
import { loginRequest } from './auth-client';
import { authErrorMessage } from './auth-errors';
import { t } from '../theme';
import { s, btn, input } from '../css';

// The optional side door: sign in, or (Phase 3) create a self-serve account.
// Registration issues a session cookie server-side, so a fresh account is
// logged in from its first response — no separate login hop. `?next=` (an
// app-relative path) sends the user back to where they came from.

const tpl = template(`
    <div class="login" bind="root">
        <div class="login__hero">
            <div class="login__flag">⛳</div>
            <h1>tapscore</h1>
            <p>Scores, settled on the green.</p>
        </div>
        <div class="error" bind="error"></div>
        <form bind="form" class="login__form">
            <input bind="username" type="text" placeholder="Username" autocomplete="username" autocapitalize="none" />
            <input bind="password" type="password" placeholder="Password" autocomplete="current-password" />
            <div bind="registerFields" class="login__register">
                <input bind="displayName" type="text" placeholder="Display name" autocomplete="name" />
                <input bind="hcp" inputmode="decimal" placeholder="Handicap index (optional)" />
                <div class="login__clubrow">
                    <span>Home club (optional)</span>
                    <div bind="club" class="login__club"></div>
                </div>
                <div class="login__genderrow">
                    <span>Gender (optional)</span>
                    <div bind="gender" class="login__genderseg"></div>
                </div>
            </div>
            <button type="submit" bind="submit">Sign in</button>
        </form>
        <button bind="toggle" class="login__toggle" type="button"></button>
    </div>
`);

export class LoginComponent extends Component {
    static styles = `
        .login {
            max-width: 340px;
            margin: 0 auto;
            padding: 14vh ${s('xl')} 0;

            &[inert] { opacity: 0.6; }

            & .login__hero {
                text-align: center;
                margin-bottom: ${s('2xl')};

                & .login__flag { font-size: 2.2rem; }

                & h1 {
                    margin: ${s('sm')} 0 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 2.4rem;
                    letter-spacing: -0.02em;
                    color: ${t('text')};
                }

                & p {
                    margin: ${s('xs')} 0 0;
                    color: ${t('text-muted')};
                    font-size: 0.9rem;
                }
            }

            & .error {
                display: none;
                padding: ${s('sm')} ${s('md')};
                margin-bottom: ${s('md')};
                color: ${t('error')};
                font-size: 0.875rem;
                text-align: center;
            }
            & .error.show { display: block; }

            & .login__form {
                display: flex;
                flex-direction: column;
                gap: ${s('md')};

                & input {
                    padding: ${s('md')} ${s('lg')};
                    font-size: 1rem;
                    ${input()}
                }

                & .login__register {
                    display: flex;
                    flex-direction: column;
                    gap: ${s('md')};
                    &.hidden { display: none; }
                }

                & .login__genderrow,
                & .login__clubrow {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: ${s('md')};
                    font-size: 0.85rem;
                    color: ${t('text-muted')};
                }

                /* Club names are long ("Linköpings Golfklubb") and naming the
                   club IS the point of the field, so it gets its own line
                   rather than sharing one with the label and ellipsing. */
                & .login__clubrow {
                    flex-direction: column;
                    align-items: stretch;
                    gap: ${s('xs')};
                }

                /* min-width:0 lets the flex child shrink instead of forcing the
                   trigger's own min-width, so long club names get the row's
                   full remaining space rather than ellipsing early. */
                & .login__club {
                    flex: 1;
                    min-width: 0;
                    & .ui-select { display: block; width: 100%; }
                    & .ui-select__trigger { min-width: 0; }
                }

                & .login__genderseg {
                    display: flex;
                    gap: ${s('xs')};

                    & button {
                        padding: ${s('sm')} ${s('lg')};
                        font-size: 0.9rem;
                        font-weight: 700;
                        ${btn()}
                        &.on { background: ${t('primary')}; color: ${t('primary-text')}; border-color: ${t('primary')}; }
                    }
                }

                /* Direct child only: the submit button. The gender segment and
                   the home-club select bring their own button styling, and a
                   descendant selector here would paint both solid primary. */
                & > button {
                    padding: ${s('md')} ${s('lg')};
                    font-size: 1rem;
                    font-weight: 700;
                    ${btn()}
                    background: ${t('primary')};
                    color: ${t('primary-text')};
                    border: none;
                    &:hover { background: ${t('primary')}; }
                }
            }

            & .login__toggle {
                display: block;
                margin: ${s('xl')} auto 0;
                padding: ${s('sm')} ${s('lg')};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 600;
                color: ${t('text-muted')};
                text-decoration: underline;
                cursor: pointer;
            }
        }
    `;

    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private nextQ = this.router.query('next');
    private mode = new Signal<'login' | 'register'>('login');
    private busy = new Signal(false);
    private formError = new Signal('');
    private username = '';
    private password = '';
    private displayName = '';
    private hcp = '';
    private gender = new Signal<'M' | 'F' | null>(null);
    /** Home-club picker. `''` = not set; the list is public (`setup/clubs`)
     * because registration itself is unauthenticated. Fetched on the first
     * switch into register mode — a plain sign-in never pays for it. */
    private clubs = new Signal<Club[]>([]);
    private homeClubId = new Signal('');
    private clubsRequested = false;

    private async loadClubs(): Promise<void> {
        if (this.clubsRequested) return;
        this.clubsRequested = true;
        try {
            this.clubs.set(await api.setup.clubs());
        } catch {
            // Non-fatal: the picker just stays at "No home club", which is a
            // legal registration. It's settable later from the profile.
        }
    }

    /** Where a successful sign-in/registration lands: `?next=`, else home —
     * the logged-in app IS the no-login app, enriched (Phase 3 nav rework). */
    private destination(fallback: string): string {
        const next = this.nextQ.get();
        return next && next.startsWith('/') ? next : fallback;
    }

    private async submit(): Promise<void> {
        this.formError.set('');
        if (this.mode.get() === 'login') {
            // Client-side first, so an empty box never costs a round trip (and
            // never burns one of the five attempts the server counts).
            if (!this.username.trim() || this.password === '') {
                this.formError.set('Enter your username and password.');
                return;
            }
            this.busy.set(true);
            try {
                const user = await loginRequest(this.username.trim(), this.password);
                this.auth.currentUser.set(user);
                this.auth.error.set(null);
                this.router.navigate(this.destination('/'), true);
            } catch (e) {
                this.formError.set(authErrorMessage(e, 'login'));
            } finally {
                this.busy.set(false);
            }
            return;
        }
        // Register mode. The endpoint issues the session cookie itself; mirror
        // the identity into AuthService so the whole app flips to logged-in
        // without a second /auth/me round trip.
        const raw = this.hcp.trim().replace(',', '.');
        const handicapIndex = raw === '' ? null : Number.parseFloat(raw);
        if (handicapIndex !== null && !Number.isFinite(handicapIndex)) {
            this.formError.set('Handicap index must be a number (or leave it empty).');
            return;
        }
        if (this.password.length < 8) {
            this.formError.set('Password must be at least 8 characters.');
            return;
        }
        if (!this.username.trim() || !this.displayName.trim()) {
            this.formError.set('Username and display name are required.');
            return;
        }
        this.busy.set(true);
        try {
            const player = await api.players.register({
                username: this.username.trim(),
                password: this.password,
                displayName: this.displayName.trim(),
                handicapIndex,
                gender: this.gender.get(),
                homeClubId: this.homeClubId.get() || null,
            });
            this.auth.currentUser.set({ id: player.id, username: player.username });
            this.router.navigate(this.destination('/'), true);
        } catch (e) {
            this.formError.set(authErrorMessage(e, 'register'));
        } finally {
            this.busy.set(false);
        }
    }

    render(): DocumentFragment {
        const isRegister = () => this.mode.get() === 'register';
        const loading = () => this.auth.loading.get() || this.busy.get();

        const frag = this.wire(tpl, {
            root: { inert: () => loading() },
            // `formError` only. `AuthService.error` carries the framework's
            // flattened copy ("Server error", "Network error", "Unauthorized"),
            // which is what made a wrong password or a rate limit read as an
            // outage; both submit paths now set `formError` from
            // `authErrorMessage` instead.
            error: {
                className: () => (this.formError.get() ? 'error show' : 'error'),
                textContent: () => this.formError.get(),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    await this.submit();
                },
            },
            username: {
                oninput: (e: Event) => {
                    this.username = (e.target as HTMLInputElement).value;
                },
            },
            password: {
                autocomplete: () => (isRegister() ? 'new-password' : 'current-password'),
                oninput: (e: Event) => {
                    this.password = (e.target as HTMLInputElement).value;
                },
            },
            registerFields: {
                className: () => (isRegister() ? 'login__register' : 'login__register hidden'),
            },
            displayName: {
                oninput: (e: Event) => {
                    this.displayName = (e.target as HTMLInputElement).value;
                },
            },
            hcp: {
                oninput: (e: Event) => {
                    this.hcp = (e.target as HTMLInputElement).value;
                },
            },
            submit: {
                textContent: () =>
                    loading()
                        ? isRegister() ? 'Creating account…' : 'Signing in…'
                        : isRegister() ? 'Create account' : 'Sign in',
            },
            toggle: {
                textContent: () =>
                    isRegister()
                        ? 'Have an account? Sign in'
                        : 'New here? Create an account',
                onclick: () => {
                    this.formError.set('');
                    this.auth.error.set(null);
                    const toRegister = !isRegister();
                    this.mode.set(toRegister ? 'register' : 'login');
                    if (toRegister) void this.loadClubs();
                },
            },
        });

        // Gender segmented control: M / F / Not set. Optional — registering
        // with no selection leaves gender null server-side.
        const genderOptions: Array<{ value: 'M' | 'F' | null; label: string }> = [
            { value: 'M', label: 'M' },
            { value: 'F', label: 'F' },
            { value: null, label: 'Not set' },
        ];
        this.$each(
            this.ref(frag, 'gender'),
            () => genderOptions,
            (opt, _i, track) =>
                this.wireEl(
                    template(`<button bind="b" type="button"></button>`),
                    {
                        b: {
                            textContent: () => opt.label,
                            className: () => (this.gender.get() === opt.value ? 'on' : ''),
                            onclick: () => this.gender.set(opt.value),
                        },
                    },
                    track,
                ),
            (opt) => opt.label,
        );

        // Home club picker — optional, like gender. Held locally and sent with
        // the register payload; the account is created with it already set.
        const select = new SelectComponent({
            value: this.homeClubId,
            options: {
                get: (): SelectOption[] => [
                    { value: '', label: 'No home club' },
                    ...this.clubs.get().map((c) => ({ value: c.id, label: c.name })),
                ],
            },
            placeholder: 'No home club',
        });
        select.mount(this.ref(frag, 'club'));
        this.track(() => select.destroy());

        return frag;
    }
}
