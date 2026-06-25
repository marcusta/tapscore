import { Component, effect, template } from '../core';
import { MetricsService, type ChartPoint } from './metrics.service';

const tpl = template(`
    <div class="obs-metrics" bind="root">
        <div class="obs-metrics__controls">
            <button bind="r1h">1h</button>
            <button bind="r6h">6h</button>
            <button bind="r24h">24h</button>
            <button bind="r7d">7d</button>
        </div>
        <div class="obs-error" bind="error"></div>
        <div bind="charts" class="obs-metrics__charts"></div>
        <div bind="empty" class="obs-metrics__empty">No metrics data for this time range.</div>
    </div>
`);

const CHART_W = 600;
const CHART_H = 120;
const PAD = { top: 20, right: 10, bottom: 25, left: 50 };

function buildSvgChart(title: string, points: ChartPoint[], color: string, secondaryPoints?: ChartPoint[], secondaryColor?: string): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${CHART_W} ${CHART_H}`);
    svg.setAttribute('class', 'obs-metrics__chart');

    const plotW = CHART_W - PAD.left - PAD.right;
    const plotH = CHART_H - PAD.top - PAD.bottom;

    const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleEl.setAttribute('x', String(PAD.left));
    titleEl.setAttribute('y', '14');
    titleEl.setAttribute('class', 'chart-title');
    titleEl.textContent = title;
    svg.appendChild(titleEl);

    if (points.length === 0) return svg;

    const allPoints = secondaryPoints ? [...points, ...secondaryPoints] : points;
    const maxY = Math.max(...allPoints.map((p) => p.y), 1);

    for (let i = 0; i <= 4; i++) {
        const y = PAD.top + plotH - (plotH * i) / 4;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(PAD.left));
        line.setAttribute('y1', String(y));
        line.setAttribute('x2', String(CHART_W - PAD.right));
        line.setAttribute('y2', String(y));
        line.setAttribute('class', 'grid-line');
        svg.appendChild(line);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', String(PAD.left - 5));
        label.setAttribute('y', String(y + 4));
        label.setAttribute('class', 'axis-label');
        label.textContent = String(Math.round((maxY * i) / 4));
        svg.appendChild(label);
    }

    function toPolyline(pts: ChartPoint[], strokeColor: string): SVGPolylineElement {
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        const coords = pts.map((p) => {
            const x = PAD.left + (p.x / 100) * plotW;
            const y = PAD.top + plotH - (p.y / maxY) * plotH;
            return `${x},${y}`;
        }).join(' ');
        poly.setAttribute('points', coords);
        poly.setAttribute('fill', 'none');
        poly.setAttribute('stroke', strokeColor);
        poly.setAttribute('stroke-width', '2');
        return poly;
    }

    svg.appendChild(toPolyline(points, color));
    if (secondaryPoints && secondaryColor) {
        svg.appendChild(toPolyline(secondaryPoints, secondaryColor));
    }

    return svg;
}

export class MetricsComponent extends Component {
    static styles = `
        .obs-metrics {
            &[inert] { opacity: 0.6; }

            & .obs-metrics__controls {
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

            & .obs-metrics__charts {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            & .obs-metrics__empty {
                display: none;
                text-align: center;
                padding: 2rem;
                color: var(--text-muted);
                font-size: 0.875rem;
            }
            & .obs-metrics__empty.show { display: block; }

            & .obs-metrics__chart {
                width: 100%;
                height: auto;

                & .chart-title {
                    font-size: 11px;
                    fill: var(--text);
                    font-weight: 600;
                }

                & .grid-line {
                    stroke: var(--border);
                    stroke-width: 0.5;
                }

                & .axis-label {
                    font-size: 9px;
                    fill: var(--text-muted);
                    text-anchor: end;
                }
            }
        }
    `;

    private svc = this.inject(MetricsService);

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: { inert: () => this.svc.loading.get() },
            r1h: {
                onclick: () => { this.svc.timeRange.set('1h'); this.svc.load(); },
                className: () => this.svc.timeRange.get() === '1h' ? 'active' : '',
            },
            r6h: {
                onclick: () => { this.svc.timeRange.set('6h'); this.svc.load(); },
                className: () => this.svc.timeRange.get() === '6h' ? 'active' : '',
            },
            r24h: {
                onclick: () => { this.svc.timeRange.set('24h'); this.svc.load(); },
                className: () => this.svc.timeRange.get() === '24h' ? 'active' : '',
            },
            r7d: {
                onclick: () => { this.svc.timeRange.set('7d'); this.svc.load(); },
                className: () => this.svc.timeRange.get() === '7d' ? 'active' : '',
            },
            error: {
                className: () => this.svc.error.get() ? 'obs-error show' : 'obs-error',
                textContent: () => this.svc.error.get()?.message ?? '',
            },
            empty: {
                className: () => this.svc.metrics.get().length === 0 && !this.svc.loading.get()
                    ? 'obs-metrics__empty show'
                    : 'obs-metrics__empty',
            },
        });

        const charts = this.ref(frag, 'charts');
        this.track(effect(() => {
            charts.textContent = '';
            const data = this.svc.metrics.get();
            if (data.length === 0) return;

            charts.appendChild(buildSvgChart(
                'Requests / min',
                this.svc.requestRateData.get(),
                'var(--primary)',
            ));
            charts.appendChild(buildSvgChart(
                'Errors / min',
                this.svc.errorRateData.get(),
                'var(--error)',
            ));
            charts.appendChild(buildSvgChart(
                'Latency (ms)',
                this.svc.latencyP50Data.get(),
                'var(--primary)',
                this.svc.latencyP95Data.get(),
                'var(--accent)',
            ));
        }));

        return frag;
    }

    onMount(): void {
        this.svc.load();
    }
}
