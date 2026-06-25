import { Component, Router, Theme, template } from '../core';
import { ObsDashboardComponent } from './obs-dashboard.component';
import { injectObsTheme } from './obs-theme';

injectObsTheme();

const tpl = template(`
    <div class="obs-shell">
        <header class="obs-shell__header">
            <a bind="back" href="/">&larr; Back to app</a>
            <span>Observability</span>
            <button bind="theme" class="obs-shell__theme"></button>
        </header>
        <div bind="content" class="obs-shell__content"></div>
    </div>
`);

export class ObsShellComponent extends Component {
    static styles = `
        .obs-shell {
            min-height: 100vh;
            background: var(--bg);
            color: var(--text);

            & .obs-shell__header {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.75rem 1.5rem;
                background: var(--surface);
                border-bottom: 1px solid var(--border);
                font-size: 0.875rem;

                & a {
                    color: var(--primary);
                    text-decoration: none;
                    &:hover { text-decoration: underline; }
                }

                & span {
                    flex: 1;
                    font-weight: 600;
                }

                & .obs-shell__theme {
                    margin-left: auto;
                    padding: 0.25rem 0.75rem;
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    background: var(--btn-bg);
                    color: var(--text);
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: background 0.15s;
                    &:hover { background: var(--btn-hover); }
                }
            }

            & .obs-shell__content {
                padding: 1.5rem 2rem;
            }
        }
    `;

    private router = this.inject(Router);
    private theme = this.inject(Theme);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            back: {
                onclick: (e: Event) => {
                    e.preventDefault();
                    this.router.navigate('/');
                },
            },
            theme: {
                onclick: () => this.theme.toggle(),
                textContent: () => this.theme.dark.get() ? '\u2600 Light' : '\u263E Dark',
            },
        });

        this.spawn(ObsDashboardComponent, this.ref(frag, 'content'));

        return frag;
    }
}
