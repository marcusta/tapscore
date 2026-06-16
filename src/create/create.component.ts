import { Component, Router, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s } from '../css';

// M1 placeholder. The real setup flow — pick course/route, add players
// (name · index · M/F) with a per-player tee, then formats — is built in M2/M3,
// submitting a RoundSetupDraft to POST /friendly-rounds. This stub just proves
// the no-login entry point the landing's "Create round" button routes into.

const tpl = template(`
    <div class="create">
        <button bind="back" class="create__back" type="button">← Rounds</button>
        <header class="create__head">
            <h1>New round</h1>
            <p>No sign-in required.</p>
        </header>
        <div class="create__steps">
            <div class="create__step"><span class="create__step-n">1</span> Course &amp; route</div>
            <div class="create__step"><span class="create__step-n">2</span> Players · index · tee</div>
            <div class="create__step"><span class="create__step-n">3</span> Formats</div>
        </div>
        <p class="create__note">Setup steps land in the next slice (M2). Until then, a seeded round is on the landing.</p>
    </div>
`);

export class CreateComponent extends Component {
    static styles = `
        .create {
            padding: ${s('lg')} ${s('lg')} ${s('2xl')};

            & .create__back {
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 600;
                color: ${t('text-muted')};
                cursor: pointer;
                padding: ${s('xs')} 0;
                margin-bottom: ${s('md')};
            }

            & .create__head {
                margin-bottom: ${s('xl')};
                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${s('xs')} 0 0; color: ${t('text-muted')}; font-size: 0.9rem; }
            }

            & .create__steps {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
            }
            & .create__step {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                padding: ${s('md')} ${s('lg')};
                border: 1px dashed ${t('border')};
                border-radius: ${t('radius')};
                color: ${t('text-muted')};
                font-weight: 600;

                & .create__step-n {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 1.6rem;
                    height: 1.6rem;
                    border-radius: ${t('radius-pill')};
                    background: ${t('surface-sunken')};
                    font-size: 0.85rem;
                }
            }

            & .create__note {
                margin-top: ${s('xl')};
                color: ${t('text-muted')};
                font-size: 0.85rem;
            }
        }
    `;

    private router = this.inject(Router);

    render(): DocumentFragment {
        return this.wire(tpl, {
            back: { onclick: () => this.router.navigate('/') },
        });
    }
}
