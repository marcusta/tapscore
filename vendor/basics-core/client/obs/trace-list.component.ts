import { Component, effect, template } from '../core';
import { TraceListService } from './trace-list.service';

const tpl = template(`
    <div class="obs-trace-list" bind="root">
        <div class="obs-trace-list__filters">
            <input bind="pathInput" type="text" placeholder="Filter by path..." />
            <select bind="statusSelect">
                <option value="">Any status</option>
                <option value="200">2xx</option>
                <option value="400">4xx</option>
                <option value="500">5xx</option>
            </select>
            <select bind="rangeSelect">
                <option value="1h">Last hour</option>
                <option value="6h">Last 6h</option>
                <option value="24h">Last 24h</option>
                <option value="3d">Last 3 days</option>
            </select>
            <button bind="apply">Apply</button>
        </div>
        <div class="obs-error" bind="error"></div>
        <table class="obs-trace-list__table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Method</th>
                    <th>Path</th>
                    <th>Status</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody bind="tbody"></tbody>
        </table>
        <div class="obs-trace-list__pagination">
            <button bind="prev">Prev</button>
            <span bind="pageInfo"></span>
            <button bind="next">Next</button>
        </div>
    </div>
`);

const rowTpl = template(`
    <tr class="obs-trace-list__row" bind="row">
        <td bind="time"></td>
        <td bind="method"></td>
        <td bind="path"></td>
        <td bind="status"></td>
        <td bind="duration"></td>
    </tr>
`);

const detailTpl = template(`
    <tr class="obs-trace-list__detail">
        <td colspan="5" bind="detail"></td>
    </tr>
`);

function statusClass(status: number): string {
    if (status >= 500) return 'obs-status--5xx';
    if (status >= 400) return 'obs-status--4xx';
    return 'obs-status--2xx';
}

function formatTime(ts: string): string {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export class TraceListComponent extends Component {
    static styles = `
        .obs-trace-list {
            &[inert] { opacity: 0.6; }

            & .obs-trace-list__filters {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1rem;
                flex-wrap: wrap;

                & input {
                    flex: 1;
                    min-width: 150px;
                    padding: 0.25rem 0.5rem;
                    font-size: 0.8rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    background: var(--input-bg);
                    color: var(--text);
                    font-family: inherit;
                    &::placeholder { color: var(--text-muted); }
                }

                & select {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.8rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    background: var(--input-bg);
                    color: var(--text);
                    font-family: inherit;
                }

                & button {
                    padding: 0.25rem 0.75rem;
                    font-size: 0.8rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    background: var(--btn-bg);
                    color: var(--text);
                    cursor: pointer;
                    transition: background 0.15s;
                    &:hover { background: var(--btn-hover); }
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

            & .obs-trace-list__table {
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
            }

            & .obs-trace-list__row {
                cursor: pointer;
                &:hover { background: var(--hover-bg); }
            }

            & .obs-trace-list__detail td {
                padding: 0.5rem 0.75rem;
                background: var(--surface);
                font-family: monospace;
                font-size: 0.75rem;
                white-space: pre-wrap;
            }

            & .obs-status--2xx { color: var(--primary); font-weight: 600; }
            & .obs-status--4xx { color: var(--accent); font-weight: 600; }
            & .obs-status--5xx { color: var(--error); font-weight: 600; }

            & .obs-trace-list__pagination {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                margin-top: 0.75rem;

                & button {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.75rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    background: var(--btn-bg);
                    color: var(--text);
                    cursor: pointer;
                    transition: background 0.15s;
                    &:hover { background: var(--btn-hover); }
                    &:disabled { opacity: 0.4; cursor: default; }
                }

                & span {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }
            }
        }
    `;

    private svc = this.inject(TraceListService);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.svc.loading.get() },
            pathInput: {
                oninput: (e: Event) => this.svc.pathFilter.set((e.target as HTMLInputElement).value),
            },
            statusSelect: {
                onchange: (e: Event) => {
                    const val = (e.target as HTMLSelectElement).value;
                    this.svc.statusFilter.set(val ? Number(val) : null);
                },
            },
            rangeSelect: {
                onchange: (e: Event) => {
                    this.svc.timeRange.set((e.target as HTMLSelectElement).value as any);
                },
            },
            apply: { onclick: () => this.svc.applyFilters() },
            error: {
                className: () => this.svc.error.get() ? 'obs-error show' : 'obs-error',
                textContent: () => this.svc.error.get()?.message ?? '',
            },
            prev: {
                onclick: () => this.svc.prevPage(),
                disabled: () => this.svc.page.get() === 0,
            },
            pageInfo: () => {
                const total = this.svc.total.get();
                const pageCount = Math.max(1, Math.ceil(total / this.svc.pageSize));
                return `${this.svc.page.get() + 1} / ${pageCount} (${total} traces)`;
            },
            next: {
                onclick: () => this.svc.nextPage(),
                disabled: () => this.svc.page.get() >= Math.ceil(this.svc.total.get() / this.svc.pageSize) - 1,
            },
        });

        const tbody = this.ref(frag, 'tbody');
        this.$each(
            tbody,
            this.svc.traces,
            (trace, _i, track) => {
                const container = document.createElement('tbody');
                const row = this.wireEl(rowTpl, {
                    row: {
                        onclick: () => this.svc.toggleExpanded(trace.traceId),
                    },
                    time: () => formatTime(trace.timestamp),
                    method: () => trace.method,
                    path: () => trace.path,
                    status: {
                        textContent: () => String(trace.status),
                        className: () => statusClass(trace.status),
                    },
                    duration: () => `${trace.durationMs.toFixed(1)}ms`,
                }, track);
                container.appendChild(row);

                const detail = this.wireEl(detailTpl, {
                    detail: () => `Trace ID: ${trace.traceId}\nUser: ${trace.userId ?? 'anonymous'}\nTimestamp: ${trace.timestamp}`,
                }, track);
                detail.style.display = 'none';
                container.appendChild(detail);

                track(effect(() => {
                    detail.style.display = this.svc.expandedId.get() === trace.traceId ? '' : 'none';
                }));

                return container;
            },
            (trace) => trace.traceId,
        );

        return frag;
    }

    onMount(): void {
        this.svc.load();
    }
}
