import { Component, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, btn, card } from '../css';

// Signed in, no management role (spec §2.3). Full-screen, because there is
// nothing else in this app for this caller to see — not a banner over an empty
// shell, which would suggest the rest is one click away.
//
// Same tone as the player app's `/admin` refusal: state the fact, then name
// the exact command that fixes it. The grant is deliberately a shell action on
// the box holding the DB and has no network path (AGENTS.md "Authorization"),
// so the person reading this generally cannot act on it themselves — which is
// precisely why the copy has to be specific enough to forward verbatim.

const tpl = template(`
    <div class="mdenied">
        <div class="mdenied__panel">
            <h1 class="mdenied__title">No access to Manage</h1>
            <p class="mdenied__body">Tapscore Manage administers the shared golf catalog — clubs, courses, tees and tee roles. Your account holds no management role, so there is nothing here for it yet.</p>
            <p class="mdenied__hint">An operator with shell access to the server grants one:</p>
            <code bind="command" class="mdenied__command"></code>
            <div class="mdenied__foot">
                <span bind="who" class="mdenied__who"></span>
                <button bind="signout" class="mdenied__signout" type="button">Sign out</button>
            </div>
        </div>
    </div>
`);

export class DeniedComponent extends Component {
    static styles = `
        .mdenied {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${t('manage-page-pad')};

            & .mdenied__panel {
                ${card({})}
                display: flex;
                flex-direction: column;
                gap: ${s('md')};
                width: 100%;
                max-width: 30rem;
                padding: ${t('manage-page-pad-wide')};
            }

            & .mdenied__title {
                margin: 0;
                font-family: ${t('font-display')};
                font-size: 1.5rem;
                font-weight: 600;
                letter-spacing: -0.01em;
                color: ${t('text')};
            }

            & .mdenied__body {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mdenied__hint {
                margin: 0;
                color: ${t('text-muted')};
                font-size: 0.85rem;
            }

            & .mdenied__command {
                display: block;
                padding: ${s('sm')} ${s('md')};
                border-radius: ${t('radius-sm')};
                background: ${t('surface-sunken')};
                border: 1px solid ${t('border')};
                color: ${t('text')};
                font-size: 0.8rem;
                line-height: 1.5;
                word-break: break-all;
            }

            & .mdenied__foot {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${s('md')};
                border-top: 1px solid ${t('border')};
                padding-top: ${s('md')};

                & .mdenied__who {
                    color: ${t('text-muted')};
                    font-size: 0.8rem;
                }

                & .mdenied__signout {
                    ${btn()}
                    min-height: ${t('manage-touch-target')};
                    padding: 0 ${s('lg')};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                }
            }
        }
    `;

    private auth = this.inject(AuthService);

    render(): DocumentFragment {
        return this.wire(tpl, {
            // The caller's own username, so the command can be forwarded as
            // written. `<username>` is the fallback and not the default —
            // a placeholder someone has to fill in is one more chance to get
            // it wrong.
            command: () => {
                const user = this.auth.currentUser.get();
                return `bun run grant:role grant ${user?.username ?? '<username>'} super_admin`;
            },
            who: () => {
                const user = this.auth.currentUser.get();
                return user ? `Signed in as ${user.username}` : '';
            },
            signout: { onclick: () => void this.auth.logout() },
        });
    }
}
