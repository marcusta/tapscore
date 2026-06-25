import { Component, Signal, template } from '../core';
import { TraceListComponent } from './trace-list.component';
import { MetricsComponent } from './metrics.component';
import { AnalyticsComponent } from './analytics.component';

const tpl = template(`
    <div class="obs-dashboard">
        <div class="obs-dashboard__tabs">
            <button bind="tabTraces">Traces</button>
            <button bind="tabMetrics">Metrics</button>
            <button bind="tabAnalytics">Analytics</button>
        </div>
        <div bind="content" class="obs-dashboard__content"></div>
    </div>
`);

export class ObsDashboardComponent extends Component {
    static styles = `
        .obs-dashboard {
            & .obs-dashboard__tabs {
                display: flex;
                gap: 0.25rem;
                margin-bottom: 1.5rem;
                border-bottom: 2px solid var(--border);
                padding-bottom: 0.25rem;

                & button {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    border: none;
                    border-bottom: 2px solid transparent;
                    margin-bottom: -2px;
                    background: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: color 0.15s, border-color 0.15s;

                    &:hover { color: var(--text); }
                    &.active {
                        color: var(--text);
                        border-bottom-color: var(--primary);
                        font-weight: 600;
                    }
                }
            }

            & .obs-dashboard__content {
                min-height: 200px;
            }
        }
    `;

    private activeTab = new Signal('traces');

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            tabTraces: {
                onclick: () => this.activeTab.set('traces'),
                className: () => this.activeTab.get() === 'traces' ? 'active' : '',
            },
            tabMetrics: {
                onclick: () => this.activeTab.set('metrics'),
                className: () => this.activeTab.get() === 'metrics' ? 'active' : '',
            },
            tabAnalytics: {
                onclick: () => this.activeTab.set('analytics'),
                className: () => this.activeTab.get() === 'analytics' ? 'active' : '',
            },
        });

        this.$swap(this.ref(frag, 'content'), this.activeTab, {
            traces: TraceListComponent,
            metrics: MetricsComponent,
            analytics: AnalyticsComponent,
        });

        return frag;
    }
}
