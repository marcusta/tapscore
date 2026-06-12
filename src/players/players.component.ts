import { Component, Signal, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input, card } from '../css';
import { PlayersService } from './players.service';

const tpl = template(`
    <div class="players">
        <header class="players__head">
            <h1>Players</h1>
            <p>Friends you keep score for.</p>
        </header>
        <div bind="list" class="players__list"></div>
        <form bind="form" class="players__form">
            <h2>Add a player</h2>
            <input bind="name" type="text" placeholder="Name" autocomplete="off" />
            <div class="players__row">
                <div bind="genderSeg" class="players__seg">
                    <button type="button" bind="genderM">Men's tees</button>
                    <button type="button" bind="genderF">Women's tees</button>
                </div>
                <input bind="hcp" type="number" inputmode="decimal" step="0.1" min="-10" max="54" placeholder="HCP" />
            </div>
            <button type="submit" bind="submit">Add player</button>
        </form>
    </div>
`);

const rowTpl = template(`
    <div class="player-row">
        <span bind="initials" class="player-row__badge"></span>
        <span bind="name" class="player-row__name"></span>
        <span bind="hcp" class="player-row__hcp"></span>
    </div>
`);

function initialsOf(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join('');
}

export class PlayersComponent extends Component {
    static styles = `
        .players {
            padding: ${s('xl')} ${s('lg')} ${s('2xl')};

            & .players__head {
                margin-bottom: ${s('xl')};

                & h1 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p {
                    margin: ${s('xs')} 0 0;
                    color: ${t('text-muted')};
                    font-size: 0.9rem;
                }
            }

            & .players__list {
                display: flex;
                flex-direction: column;
                gap: ${s('sm')};
                margin-bottom: ${s('2xl')};
            }

            & .player-row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                padding: ${s('md')} ${s('lg')};
                ${card()}

                & .player-row__badge {
                    display: grid;
                    place-items: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: ${t('primary')};
                    color: ${t('primary-text')};
                    font-weight: 700;
                    font-size: 0.85rem;
                    flex-shrink: 0;
                }

                & .player-row__name {
                    flex: 1;
                    font-weight: 600;
                    font-size: 1.05rem;
                }

                & .player-row__hcp {
                    font-weight: 700;
                    color: ${t('accent')};
                    background: ${t('accent-soft')};
                    border-radius: ${t('radius-pill')};
                    padding: 2px 10px;
                    font-size: 0.85rem;
                }
            }

            & .players__form {
                display: flex;
                flex-direction: column;
                gap: ${s('md')};
                padding: ${s('lg')};
                ${card()}

                & h2 {
                    margin: 0;
                    font-family: ${t('font-display')};
                    font-weight: 600;
                    font-size: 1.2rem;
                }

                & input {
                    padding: ${s('md')} ${s('lg')};
                    font-size: 1rem;
                    ${input()}
                }

                & .players__row {
                    display: flex;
                    gap: ${s('sm')};

                    & input { width: 90px; text-align: center; }
                }

                & .players__seg {
                    flex: 1;
                    display: flex;
                    border: 1px solid ${t('border')};
                    border-radius: ${t('radius')};
                    overflow: hidden;

                    & button {
                        flex: 1;
                        padding: ${s('md')} 0;
                        border: none;
                        background: ${t('btn-bg')};
                        color: ${t('text-muted')};
                        font-family: inherit;
                        font-size: 0.85rem;
                        font-weight: 600;
                        cursor: pointer;

                        &.on {
                            background: ${t('primary')};
                            color: ${t('primary-text')};
                        }
                    }
                }

                & button[type=submit] {
                    padding: ${s('md')} ${s('lg')};
                    font-size: 1rem;
                    font-weight: 700;
                    ${btn()}
                    background: ${t('primary')};
                    color: ${t('primary-text')};
                    border: none;
                    &:hover { background: ${t('primary')}; }
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
        }
    `;

    private svc = this.inject(PlayersService);
    private name = new Signal('');
    private gender = new Signal<'M' | 'F'>('M');
    private hcp = new Signal('');

    render(): DocumentFragment {
        void this.svc.load();

        const frag = this.wire(tpl, {
            name: {
                value: () => this.name.get(),
                oninput: (e: Event) => this.name.set((e.target as HTMLInputElement).value),
            },
            hcp: {
                value: () => this.hcp.get(),
                oninput: (e: Event) => this.hcp.set((e.target as HTMLInputElement).value),
            },
            genderM: {
                className: () => (this.gender.get() === 'M' ? 'on' : ''),
                onclick: () => this.gender.set('M'),
            },
            genderF: {
                className: () => (this.gender.get() === 'F' ? 'on' : ''),
                onclick: () => this.gender.set('F'),
            },
            submit: {
                disabled: () => this.name.get().trim() === '' || this.svc.loading.get(),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const hcpRaw = this.hcp.get().trim().replace(',', '.');
                    const created = await this.svc.create({
                        displayName: this.name.get().trim(),
                        gender: this.gender.get(),
                        handicapIndex: hcpRaw === '' ? null : Number(hcpRaw),
                    });
                    if (created) {
                        this.name.set('');
                        this.hcp.set('');
                    }
                },
            },
        });

        this.$each(this.ref(frag, 'list'), this.svc.guests, (g, _i, track) => this.wireEl(rowTpl, {
            initials: () => initialsOf(g.displayName),
            name: () => g.displayName,
            hcp: () => (g.handicapIndex === null ? '–' : g.handicapIndex.toFixed(1)),
        }, track), (g) => g.id);

        return frag;
    }
}
