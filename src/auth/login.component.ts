import { Component, Router, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { api, ApiError } from '../api';
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

                & button {
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
    private registerError = new Signal('');
    private username = '';
    private password = '';
    private displayName = '';
    private hcp = '';

    /** Where a successful sign-in/registration lands: `?next=`, else the
     * fallback (login keeps its historical `/rounds`; register goes home). */
    private destination(fallback: string): string {
        const next = this.nextQ.get();
        return next && next.startsWith('/') ? next : fallback;
    }

    private async submit(): Promise<void> {
        this.registerError.set('');
        if (this.mode.get() === 'login') {
            const ok = await this.auth.login(this.username, this.password);
            if (ok) this.router.navigate(this.destination('/rounds'), true);
            return;
        }
        // Register mode. The endpoint issues the session cookie itself; mirror
        // the identity into AuthService so the whole app flips to logged-in
        // without a second /auth/me round trip.
        const raw = this.hcp.trim().replace(',', '.');
        const handicapIndex = raw === '' ? null : Number.parseFloat(raw);
        if (handicapIndex !== null && !Number.isFinite(handicapIndex)) {
            this.registerError.set('Handicap index must be a number (or leave it empty).');
            return;
        }
        if (this.password.length < 8) {
            this.registerError.set('Password must be at least 8 characters.');
            return;
        }
        if (!this.username.trim() || !this.displayName.trim()) {
            this.registerError.set('Username and display name are required.');
            return;
        }
        this.busy.set(true);
        try {
            const player = await api.players.register({
                username: this.username.trim(),
                password: this.password,
                displayName: this.displayName.trim(),
                handicapIndex,
            });
            this.auth.currentUser.set({ id: player.id, username: player.username });
            this.router.navigate(this.destination('/'), true);
        } catch (e) {
            this.registerError.set(
                e instanceof ApiError && e.status === 409
                    ? 'That username is taken.'
                    : e instanceof ApiError
                        ? e.message
                        : 'Could not create the account. Try again.',
            );
        } finally {
            this.busy.set(false);
        }
    }

    render(): DocumentFragment {
        const isRegister = () => this.mode.get() === 'register';
        const loading = () => this.auth.loading.get() || this.busy.get();

        return this.wire(tpl, {
            root: { inert: () => loading() },
            error: {
                className: () =>
                    this.registerError.get() || this.auth.error.get()
                        ? 'error show'
                        : 'error',
                textContent: () =>
                    this.registerError.get() || this.auth.error.get()?.message || '',
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
                    this.registerError.set('');
                    this.auth.error.set(null);
                    this.mode.set(isRegister() ? 'login' : 'register');
                },
            },
        });
    }
}
