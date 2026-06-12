import { Component, Router, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, input } from '../css';

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
            <button type="submit" bind="submit">Sign in</button>
        </form>
    </div>
`);

export class LoginComponent extends Component {
    static styles = `
        .login {
            max-width: 340px;
            margin: 0 auto;
            padding: 18vh ${s('xl')} 0;

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
        }
    `;

    private auth = this.inject(AuthService);
    private router = this.inject(Router);
    private username = '';
    private password = '';

    render(): DocumentFragment {
        return this.wire(tpl, {
            root: { inert: () => this.auth.loading.get() },
            error: {
                className: () => this.auth.error.get() ? 'error show' : 'error',
                textContent: () => this.auth.error.get()?.message ?? '',
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const ok = await this.auth.login(this.username, this.password);
                    if (ok) this.router.navigate('/rounds', true);
                },
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
                textContent: () => this.auth.loading.get() ? 'Signing in…' : 'Sign in',
            },
        });
    }
}
