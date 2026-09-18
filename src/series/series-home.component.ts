import { Component, Computed, Router, template } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { t } from '../theme';
import { s, card } from '../css';
import { SeriesService } from './series.service';
import { mergeSeriesLists } from './series-list';

// The home screen's "Team events" section. Invisible when there is nothing to
// show, like every other landing section. Its own component so the landing
// only hosts it: the list comes from SeriesService (server list when signed
// in, plus events opened on this device).

const HOME_CAP = 3;

const tpl = template(`
    <div bind="root" class="home-series">
        <div class="home-series__head">
            <span class="home-series__title">Team events</span>
            <button bind="all" type="button" class="home-series__all">All</button>
        </div>
        <div bind="list" class="home-series__list"></div>
    </div>
`);

const rowTpl = template(`
    <button bind="row" type="button" class="home-series__row">
        <span bind="name"></span>
    </button>
`);

export class SeriesHomeComponent extends Component {
    static styles = `
        .home-series {
            margin-bottom: ${s('xl')};
            &.hidden { display: none; }

            & .home-series__head {
                display: flex; align-items: baseline; justify-content: space-between;
                gap: ${s('sm')}; margin-bottom: ${s('sm')};
            }
            & .home-series__title {
                font-family: ${t('font-display')}; font-weight: 600; font-size: 1.1rem; color: ${t('text')};
            }
            & .home-series__all {
                appearance: none; border: none; background: none; padding: 0;
                font-family: inherit; font-size: 0.85rem; color: ${t('text-muted')}; cursor: pointer;
            }
            & .home-series__list { display: flex; flex-direction: column; gap: ${s('sm')}; }
            & .home-series__row {
                padding: ${s('md')} ${s('lg')}; text-align: left; width: 100%;
                font-family: inherit; font-weight: 700; font-size: 1rem; color: ${t('text')};
                ${card({ hover: true })}
                cursor: pointer;
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
        }
    `;

    private svc = this.inject(SeriesService);
    private auth = this.inject(AuthService);
    private router = this.inject(Router);

    private rows = new Computed(() =>
        mergeSeriesLists(this.svc.list.get(), this.svc.deviceList.get()).slice(0, HOME_CAP),
    );

    render(): DocumentFragment {
        // Forced: the landing remounts on every return, and an event created
        // on another device should show without a reload.
        if (this.auth.currentUser.get() !== null) void this.svc.loadList(true);

        const frag = this.wire(tpl, {
            root: { className: () => (this.rows.get().length > 0 ? 'home-series' : 'home-series hidden') },
            all: { onclick: () => this.router.navigate('/series') },
        });
        this.$each(
            this.ref(frag, 'list'),
            this.rows,
            (row, _i, track) =>
                this.wireEl(
                    rowTpl,
                    {
                        row: {
                            onclick: () =>
                                this.router.navigate('/series-board', { query: { token: row.token } }),
                        },
                        name: () => row.name,
                    },
                    track,
                ),
            (row) => `${row.token}:${row.name}`,
        );
        return frag;
    }
}
