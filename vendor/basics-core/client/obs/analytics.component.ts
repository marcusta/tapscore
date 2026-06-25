import { Component, template } from '../core';
import { AnalyticsService } from './analytics.service';

const tpl = template(`
    <div class="obs-analytics" bind="root">
        <div class="obs-analytics__controls">
            <button bind="r24h">24h</button>
            <button bind="r7d">7d</button>
            <button bind="r30d">30d</button>
        </div>
        <div class="obs-error" bind="error"></div>
        <table class="obs-analytics__table">
            <thead>
                <tr>
                    <th class="rank-col">#</th>
                    <th>Event</th>
                    <th class="count-col">Count</th>
                    <th class="bar-col"></th>
                </tr>
            </thead>
            <tbody bind="tbody"></tbody>
        </table>
        <div bind="empty" class="obs-analytics__empty">No analytics data for this time range.</div>
    </div>
`);

const rowTpl = template(`
    <tr>
        <td bind="rank" class="rank-col"></td>
        <td bind="event"></td>
        <td bind="count" class="count-col"></td>
        <td class="bar-col"><div bind="bar" class="obs-analytics__bar"></div></td>
    </tr>
`);

export class AnalyticsComponent extends Component {
    static styles = `
        .obs-analytics {
            &[inert] { opacity: 0.6; }

            & .obs-analytics__controls {
                display: flex;
                gap: 0.25rem;
                margin-bottom: 1rem;

                & button {
                    padding: 0.25rem 0.75rem;
                    font-size: 0.8rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    background: var(--btn-bg);
                    color: var(--text);
                    cursor: pointer;
                    transition: background 0.15s;
                    &:hover { background: var(--btn-hover); }
                }
                & button.active {
                    background: var(--active-bg);
                    color: var(--active-text);
                }
            }

            & .obs-error {
                display: none;
                padding: 0.5rem 0.75rem;
                margin-bottom: 0.75rem;
                color: var(--error);
                font-size: 0.875rem;
            }
            & .obs-error.show { display: block; }

            & .obs-analytics__table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.8rem;

                & th {
                    text-align: left;
                    padding: 0.25rem 0.5rem;
                    border-bottom: 2px solid var(--border);
                    color: var(--text-muted);
                    font-weight: 600;
                }

                & td {
                    padding: 0.25rem 0.5rem;
                    border-bottom: 1px solid var(--border);
                }

                & .rank-col { width: 40px; text-align: center; color: var(--text-muted); }
                & .count-col { width: 80px; text-align: right; font-variant-numeric: tabular-nums; }
                & .bar-col { width: 200px; }
            }

            & .obs-analytics__bar {
                height: 16px;
                background: var(--primary);
                border-radius: var(--radius-sm);
                transition: width 0.3s;
            }

            & .obs-analytics__empty {
                display: none;
                text-align: center;
                padding: 2rem;
                color: var(--text-muted);
                font-size: 0.875rem;
            }
            & .obs-analytics__empty.show { display: block; }
        }
    `;

    private svc = this.inject(AnalyticsService);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.svc.loading.get() },
            r24h: {
                onclick: () => { this.svc.timeRange.set('24h'); this.svc.load(); },
                className: () => this.svc.timeRange.get() === '24h' ? 'active' : '',
            },
            r7d: {
                onclick: () => { this.svc.timeRange.set('7d'); this.svc.load(); },
                className: () => this.svc.timeRange.get() === '7d' ? 'active' : '',
            },
            r30d: {
                onclick: () => { this.svc.timeRange.set('30d'); this.svc.load(); },
                className: () => this.svc.timeRange.get() === '30d' ? 'active' : '',
            },
            error: {
                className: () => this.svc.error.get() ? 'obs-error show' : 'obs-error',
                textContent: () => this.svc.error.get()?.message ?? '',
            },
            empty: {
                className: () => this.svc.events.get().length === 0 && !this.svc.loading.get()
                    ? 'obs-analytics__empty show'
                    : 'obs-analytics__empty',
            },
        });

        const tbody = this.ref(frag, 'tbody');
        this.$each(
            tbody,
            this.svc.events,
            (item, index, track) => {
                const maxCount = this.svc.events.get()[0]?.count ?? 1;
                return this.wireEl(rowTpl, {
                    rank: () => String(index + 1),
                    event: () => item.event,
                    count: () => String(item.count),
                    bar: {
                        style: () => `width: ${Math.round((item.count / maxCount) * 100)}%`,
                    },
                }, track);
            },
            (item) => item.event,
        );

        return frag;
    }

    onMount(): void {
        this.svc.load();
    }
}
