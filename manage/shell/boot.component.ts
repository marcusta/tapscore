import { Component, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn } from '../css';
import { ManageRolesService } from '../roles/roles.service';

// The two states Manage can be in before it knows whether to show anything:
// still asking, and unable to ask.
//
// They are full-screen rather than a spinner inside the shell because the
// question they are waiting on is which shell to draw — there is no chrome yet
// to put a spinner in.

const loadingTpl = template(`
    <div class="mboot">
        <p class="mboot__line">Loading…</p>
    </div>
`);

const failureTpl = template(`
    <div class="mboot">
        <h1 class="mboot__title">Cannot reach the server</h1>
        <p class="mboot__line">Tapscore Manage could not check what you are allowed to manage.</p>
        <button bind="retry" class="mboot__retry" type="button">Try again</button>
    </div>
`);

/** The shared full-screen frame both states sit in. */
const bootStyles = `
    .mboot {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: ${s('md')};
        min-height: 100vh;
        min-height: 100dvh;
        padding: ${t('manage-page-pad')};
        text-align: center;

        & .mboot__title {
            margin: 0;
            font-family: ${t('font-display')};
            font-size: 1.5rem;
            font-weight: 600;
            color: ${t('text')};
        }

        & .mboot__line {
            margin: 0;
            max-width: 44ch;
            color: ${t('text-muted')};
            font-size: 0.95rem;
            line-height: 1.5;
        }

        & .mboot__retry {
            ${btn()}
            min-height: ${t('manage-touch-target')};
            padding: 0 ${s('lg')};
            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
        }
    }
`;

export class BootLoadingComponent extends Component {
    static styles = bootStyles;

    render(): DocumentFragment {
        return this.wire(loadingTpl, {});
    }
}

export class BootFailureComponent extends Component {
    // Same rules, injected once per class — the framework keys its style guard
    // on the constructor, so the shared string is emitted twice at most and
    // only when both states have actually been reached.
    static styles = bootStyles;

    private roles = this.inject(ManageRolesService);
    private auth = this.inject(AuthService);

    render(): DocumentFragment {
        return this.wire(failureTpl, {
            retry: {
                onclick: () => {
                    // Both halves, because either could be the one that failed:
                    // a session probe that never answered leaves the app just as
                    // stuck as a roles call that did not.
                    void this.auth.load();
                    void this.roles.load(true);
                },
            },
        });
    }
}
