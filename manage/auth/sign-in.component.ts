import { Component, Signal, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { authClient } from './auth-client';
import { authErrorMessage } from '../../src/auth/auth-errors';
import { ManageRolesService } from '../roles/roles.service';

// Signed out. Same session cookie and same endpoint as the player app — being
// signed in there means being signed in here (spec §2.3) — so this is a way
// back IN, not a second account system.
//
// No "create an account" arm, unlike the player app's login: an account is a
// PLAYER thing, and a fresh one would land straight on the permission-denied
// screen. Registration stays where it means something.
//
// The submit calls `authClient.login` directly rather than `AuthService.login`,
// for the two reasons the player app has: the raw status is what tells a wrong
// password from a rate limit (`authErrorMessage`, reused rather than rewritten),
// and `login()` toggles `AuthService.loading`, which the boot gate watches —
// going through it would unmount this form mid-submit.

const tpl = template(`
    <div class="msignin">
        <form bind="form" class="msignin__panel">
            <div class="msignin__brand">Tapscore <b>Manage</b></div>
            <p class="msignin__lead">Sign in with your Tapscore account.</p>
            <div bind="error" class="msignin__error"></div>
            <label class="msignin__field">
                <span>Username</span>
                <input bind="username" type="text" autocomplete="username" autocapitalize="none" autofocus />
            </label>
            <label class="msignin__field">
                <span>Password</span>
                <input bind="password" type="password" autocomplete="current-password" />
            </label>
            <button bind="submit" class="msignin__submit" type="submit">Sign in</button>
        </form>
    </div>
`);

export class SignInComponent extends Component {
    static styles = `
        .msignin {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${t('manage-page-pad')};

            & .msignin__panel {
                ${card({})}
                display: flex;
                flex-direction: column;
                gap: ${s('md')};
                width: 100%;
                max-width: 22rem;
                padding: ${t('manage-page-pad-wide')};

                &[inert] { opacity: 0.6; }
            }

            & .msignin__brand {
                font-family: ${t('font-display')};
                font-size: 1.5rem;
                font-weight: 400;
                letter-spacing: -0.01em;
                color: ${t('text')};

                & b { font-weight: 700; }
            }

            & .msignin__lead {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.9rem;
            }

            & .msignin__error {
                display: none;
                color: ${t('error')};
                font-size: 0.85rem;
                line-height: 1.4;

                &.show { display: block; }
            }

            & .msignin__field {
                display: flex;
                flex-direction: column;
                gap: ${s('xs')};

                & span {
                    color: ${t('text-muted')};
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                & input {
                    ${input()}
                    min-height: ${t('manage-touch-target')};
                    padding: 0 ${s('md')};
                    font-family: inherit;
                    font-size: 1rem;
                }
            }

            & .msignin__submit {
                ${btn(undefined, 'primary')}
                min-height: ${t('manage-touch-target')};
                margin-top: ${s('xs')};
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
            }
        }
    `;

    private auth = this.inject(AuthService);
    private roles = this.inject(ManageRolesService);

    private username = '';
    private password = '';
    private busy = new Signal(false);
    private formError = new Signal('');

    render(): DocumentFragment {
        return this.wire(tpl, {
            form: {
                inert: () => this.busy.get(),
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    await this.submit();
                },
            },
            error: {
                className: () => (this.formError.get() ? 'msignin__error show' : 'msignin__error'),
                textContent: () => this.formError.get(),
            },
            username: {
                oninput: (e: Event) => {
                    this.username = (e.target as HTMLInputElement).value;
                },
            },
            password: {
                oninput: (e: Event) => {
                    this.password = (e.target as HTMLInputElement).value;
                },
            },
            submit: {
                textContent: () => (this.busy.get() ? 'Signing in…' : 'Sign in'),
            },
        });
    }

    private async submit(): Promise<void> {
        this.formError.set('');
        // Client-side first, so an empty box never costs a round trip — and
        // never burns one of the five attempts the server counts per minute.
        if (!this.username.trim() || this.password === '') {
            this.formError.set('Enter your username and password.');
            return;
        }
        this.busy.set(true);
        try {
            const user = await authClient.login(this.username.trim(), this.password);
            // A new session means a new set of grants; anything cached belongs
            // to whoever was signed in before.
            this.roles.clear();
            this.auth.error.set(null);
            // Set LAST: this is the write the boot gate reacts to, and it
            // unmounts this component.
            this.auth.currentUser.set(user);
        } catch (e) {
            this.formError.set(authErrorMessage(e, 'login'));
            this.busy.set(false);
        }
    }
}
