import{a as x,A as G,S as i,r as R,b as H,C as p,e as L,t as m,c as v,n as B,d as U,R as W,T as Y}from"./index-CCMzd1oK.js";function V(o){return{async listTraces(e){const s=new URLSearchParams;for(const[a,r]of Object.entries(e))r!==void 0&&s.set(a,String(r));const t=s.toString();return x({method:"GET",url:`${o}/traces${t?"?"+t:""}`})},async metrics(e){const s=new URLSearchParams;for(const[a,r]of Object.entries(e))r!==void 0&&s.set(a,String(r));const t=s.toString();return x({method:"GET",url:`${o}/metrics${t?"?"+t:""}`})},async analytics(e){const s=new URLSearchParams;for(const[a,r]of Object.entries(e))r!==void 0&&s.set(a,String(r));const t=s.toString();return x({method:"GET",url:`${o}/analytics${t?"?"+t:""}`})}}}const T=V(`${G}/_obs`),J={"1h":3600*1e3,"6h":360*60*1e3,"24h":1440*60*1e3,"3d":4320*60*1e3};class K{constructor(){this.traces=new i([]),this.loading=new i(!1),this.error=new i(null),this.page=new i(0),this.total=new i(0),this.pageSize=50,this.pathFilter=new i(""),this.statusFilter=new i(null),this.timeRange=new i("1h"),this.expandedId=new i(null)}async load(){const e=new Date(Date.now()-J[this.timeRange.get()]).toISOString(),s={offset:this.page.get()*this.pageSize,limit:this.pageSize,since:e},t=this.pathFilter.get();t&&(s.path=t);const a=this.statusFilter.get();a!=null&&(s.status=a);const r=await R(this.loading,this.error,()=>T.listTraces(s));r&&H(()=>{this.traces.set(r.items),this.total.set(r.total)})}applyFilters(){this.page.set(0),this.load()}nextPage(){const e=Math.ceil(this.total.get()/this.pageSize)-1;this.page.get()<e&&(this.page.update(s=>s+1),this.load())}prevPage(){this.page.get()>0&&(this.page.update(e=>e-1),this.load())}toggleExpanded(e){this.expandedId.set(this.expandedId.get()===e?null:e)}}const Q=m(`
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
`),X=m(`
    <tr class="obs-trace-list__row" bind="row">
        <td bind="time"></td>
        <td bind="method"></td>
        <td bind="path"></td>
        <td bind="status"></td>
        <td bind="duration"></td>
    </tr>
`),Z=m(`
    <tr class="obs-trace-list__detail">
        <td colspan="5" bind="detail"></td>
    </tr>
`);function tt(o){return o>=500?"obs-status--5xx":o>=400?"obs-status--4xx":"obs-status--2xx"}function et(o){return new Date(o).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}const A=class A extends p{constructor(){super(...arguments),this.svc=this.inject(K)}render(){const e=this.wire(Q,{root:{inert:()=>this.svc.loading.get()},pathInput:{oninput:t=>this.svc.pathFilter.set(t.target.value)},statusSelect:{onchange:t=>{const a=t.target.value;this.svc.statusFilter.set(a?Number(a):null)}},rangeSelect:{onchange:t=>{this.svc.timeRange.set(t.target.value)}},apply:{onclick:()=>this.svc.applyFilters()},error:{className:()=>this.svc.error.get()?"obs-error show":"obs-error",textContent:()=>this.svc.error.get()?.message??""},prev:{onclick:()=>this.svc.prevPage(),disabled:()=>this.svc.page.get()===0},pageInfo:()=>{const t=this.svc.total.get(),a=Math.max(1,Math.ceil(t/this.svc.pageSize));return`${this.svc.page.get()+1} / ${a} (${t} traces)`},next:{onclick:()=>this.svc.nextPage(),disabled:()=>this.svc.page.get()>=Math.ceil(this.svc.total.get()/this.svc.pageSize)-1}}),s=this.ref(e,"tbody");return this.$each(s,this.svc.traces,(t,a,r)=>{const n=document.createElement("tbody"),h=this.wireEl(X,{row:{onclick:()=>this.svc.toggleExpanded(t.traceId)},time:()=>et(t.timestamp),method:()=>t.method,path:()=>t.path,status:{textContent:()=>String(t.status),className:()=>tt(t.status)},duration:()=>`${t.durationMs.toFixed(1)}ms`},r);n.appendChild(h);const d=this.wireEl(Z,{detail:()=>`Trace ID: ${t.traceId}
User: ${t.userId??"anonymous"}
Timestamp: ${t.timestamp}`},r);return d.style.display="none",n.appendChild(d),r(L(()=>{d.style.display=this.svc.expandedId.get()===t.traceId?"":"none"})),n},t=>t.traceId),e}onMount(){this.svc.load()}};A.styles=`
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

            /*
             * One semantic tone per status class. These used to be --primary
             * (2xx) and --accent (4xx), which rendered IDENTICALLY: obs supplies
             * its own tokens from default-theme's neutral palette, where the two
             * names have always resolved to the same blue — first because both
             * were literally #4263eb, and now because the compat alias defines
             * primary as var(--accent). A 4xx was therefore indistinguishable
             * from a 2xx at a glance, which is the one thing this column exists
             * to show.
             */
            & .obs-status--2xx { color: var(--success); font-weight: 600; }
            & .obs-status--4xx { color: var(--warning); font-weight: 600; }
            & .obs-status--5xx { color: var(--danger); font-weight: 600; }

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
    `;let y=A;const st={"1h":3600*1e3,"6h":360*60*1e3,"24h":1440*60*1e3,"7d":10080*60*1e3};class rt{constructor(){this.metrics=new i([]),this.loading=new i(!1),this.error=new i(null),this.timeRange=new i("1h"),this.requestRateData=new v(()=>this.toPoints(e=>e.requests)),this.errorRateData=new v(()=>this.toPoints(e=>e.errors)),this.latencyP50Data=new v(()=>this.toPoints(e=>e.p50Ms)),this.latencyP95Data=new v(()=>this.toPoints(e=>e.p95Ms))}async load(){const e=Date.now(),s=new Date(e-st[this.timeRange.get()]).toISOString(),t=new Date(e).toISOString(),a=await R(this.loading,this.error,()=>T.metrics({since:s,until:t}));a&&this.metrics.set(a)}toPoints(e){const s=this.metrics.get();if(s.length===0)return[];const t=new Date(s[0].timestamp).getTime(),r=new Date(s[s.length-1].timestamp).getTime()-t||1;return s.map(n=>({x:(new Date(n.timestamp).getTime()-t)/r*100,y:e(n),label:n.timestamp}))}}const at=m(`
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
`),f=600,P=120,l={top:20,right:10,bottom:25,left:50};function w(o,e,s,t,a){const r=document.createElementNS("http://www.w3.org/2000/svg","svg");r.setAttribute("viewBox",`0 0 ${f} ${P}`),r.setAttribute("class","obs-metrics__chart");const n=f-l.left-l.right,h=P-l.top-l.bottom,d=document.createElementNS("http://www.w3.org/2000/svg","text");if(d.setAttribute("x",String(l.left)),d.setAttribute("y","14"),d.setAttribute("class","chart-title"),d.textContent=o,r.appendChild(d),e.length===0)return r;const F=t?[...e,...t]:e,E=Math.max(...F.map(b=>b.y),1);for(let b=0;b<=4;b++){const u=l.top+h-h*b/4,c=document.createElementNS("http://www.w3.org/2000/svg","line");c.setAttribute("x1",String(l.left)),c.setAttribute("y1",String(u)),c.setAttribute("x2",String(f-l.right)),c.setAttribute("y2",String(u)),c.setAttribute("class","grid-line"),r.appendChild(c);const g=document.createElementNS("http://www.w3.org/2000/svg","text");g.setAttribute("x",String(l.left-5)),g.setAttribute("y",String(u+4)),g.setAttribute("class","axis-label"),g.textContent=String(Math.round(E*b/4)),r.appendChild(g)}function C(b,u){const c=document.createElementNS("http://www.w3.org/2000/svg","polyline"),g=b.map(I=>{const q=l.left+I.x/100*n,O=l.top+h-I.y/E*h;return`${q},${O}`}).join(" ");return c.setAttribute("points",g),c.setAttribute("fill","none"),c.setAttribute("stroke",u),c.setAttribute("stroke-width","2"),c}return r.appendChild(C(e,s)),t&&a&&r.appendChild(C(t,a)),r}const $=class $ extends p{constructor(){super(...arguments),this.svc=this.inject(rt)}render(){const e=this.wire(at,{root:{inert:()=>this.svc.loading.get()},r1h:{onclick:()=>{this.svc.timeRange.set("1h"),this.svc.load()},className:()=>this.svc.timeRange.get()==="1h"?"active":""},r6h:{onclick:()=>{this.svc.timeRange.set("6h"),this.svc.load()},className:()=>this.svc.timeRange.get()==="6h"?"active":""},r24h:{onclick:()=>{this.svc.timeRange.set("24h"),this.svc.load()},className:()=>this.svc.timeRange.get()==="24h"?"active":""},r7d:{onclick:()=>{this.svc.timeRange.set("7d"),this.svc.load()},className:()=>this.svc.timeRange.get()==="7d"?"active":""},error:{className:()=>this.svc.error.get()?"obs-error show":"obs-error",textContent:()=>this.svc.error.get()?.message??""},empty:{className:()=>this.svc.metrics.get().length===0&&!this.svc.loading.get()?"obs-metrics__empty show":"obs-metrics__empty"}}),s=this.ref(e,"charts");return this.track(L(()=>{s.textContent="",this.svc.metrics.get().length!==0&&(s.appendChild(w("Requests / min",this.svc.requestRateData.get(),"var(--primary)")),s.appendChild(w("Errors / min",this.svc.errorRateData.get(),"var(--error)")),s.appendChild(w("Latency (ms)",this.svc.latencyP50Data.get(),"var(--primary)",this.svc.latencyP95Data.get(),"var(--warning)")))})),e}onMount(){this.svc.load()}};$.styles=`
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
    `;let _=$;const it={"24h":1440*60*1e3,"7d":10080*60*1e3,"30d":720*60*60*1e3};class ot{constructor(){this.events=new i([]),this.loading=new i(!1),this.error=new i(null),this.timeRange=new i("24h")}async load(){const e=new Date(Date.now()-it[this.timeRange.get()]).toISOString(),s=await R(this.loading,this.error,()=>T.analytics({since:e,topN:50}));s&&this.events.set(s)}}const nt=m(`
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
`),ct=m(`
    <tr>
        <td bind="rank" class="rank-col"></td>
        <td bind="event"></td>
        <td bind="count" class="count-col"></td>
        <td class="bar-col"><div bind="bar" class="obs-analytics__bar"></div></td>
    </tr>
`),N=class N extends p{constructor(){super(...arguments),this.svc=this.inject(ot)}render(){const e=this.wire(nt,{root:{inert:()=>this.svc.loading.get()},r24h:{onclick:()=>{this.svc.timeRange.set("24h"),this.svc.load()},className:()=>this.svc.timeRange.get()==="24h"?"active":""},r7d:{onclick:()=>{this.svc.timeRange.set("7d"),this.svc.load()},className:()=>this.svc.timeRange.get()==="7d"?"active":""},r30d:{onclick:()=>{this.svc.timeRange.set("30d"),this.svc.load()},className:()=>this.svc.timeRange.get()==="30d"?"active":""},error:{className:()=>this.svc.error.get()?"obs-error show":"obs-error",textContent:()=>this.svc.error.get()?.message??""},empty:{className:()=>this.svc.events.get().length===0&&!this.svc.loading.get()?"obs-analytics__empty show":"obs-analytics__empty"}}),s=this.ref(e,"tbody");return this.$each(s,this.svc.events,(t,a,r)=>{const n=this.svc.events.get()[0]?.count??1;return this.wireEl(ct,{rank:()=>String(a+1),event:()=>t.event,count:()=>String(t.count),bar:{style:()=>`width: ${Math.round(t.count/n*100)}%`}},r)},t=>t.event),e}onMount(){this.svc.load()}};N.styles=`
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
    `;let k=N;const dt=m(`
    <div class="obs-dashboard">
        <div class="obs-dashboard__tabs">
            <button bind="tabTraces">Traces</button>
            <button bind="tabMetrics">Metrics</button>
            <button bind="tabAnalytics">Analytics</button>
        </div>
        <div bind="content" class="obs-dashboard__content"></div>
    </div>
`),z=class z extends p{constructor(){super(...arguments),this.activeTab=new i("traces")}render(){const e=this.wire(dt,{tabTraces:{onclick:()=>this.activeTab.set("traces"),className:()=>this.activeTab.get()==="traces"?"active":""},tabMetrics:{onclick:()=>this.activeTab.set("metrics"),className:()=>this.activeTab.get()==="metrics"?"active":""},tabAnalytics:{onclick:()=>this.activeTab.set("analytics"),className:()=>this.activeTab.get()==="analytics"?"active":""}});return this.$swap(this.ref(e,"content"),this.activeTab,{traces:y,metrics:_,analytics:k}),e}};z.styles=`
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
    `;let S=z,M=!1;function lt(o,e){if(M)return;M=!0;const s={...B,...o},t={...U,...e},a=n=>Object.entries(n).map(([h,d])=>`--${h}:${d}`).join(";"),r=document.createElement("style");r.textContent=`@scope ([data-theme="light"] .obs-shell) { :scope { ${a(s)} } }@scope ([data-theme="dark"] .obs-shell) { :scope { ${a(t)} } }`,document.head.appendChild(r)}lt();const ht=m(`
    <div class="obs-shell">
        <header class="obs-shell__header">
            <a bind="back" href="/">&larr; Back to app</a>
            <span>Observability</span>
            <button bind="theme" class="obs-shell__theme"></button>
        </header>
        <div bind="content" class="obs-shell__content"></div>
    </div>
`),D=class D extends p{constructor(){super(...arguments),this.router=this.inject(W),this.theme=this.inject(Y)}render(){const e=this.wire(ht,{back:{onclick:s=>{s.preventDefault(),this.router.navigate("/")}},theme:{onclick:()=>this.theme.toggle(),textContent:()=>this.theme.dark.get()?"☀ Light":"☾ Dark"}});return this.spawn(S,this.ref(e,"content")),e}};D.styles=`
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
    `;let j=D;export{j as ObsShellComponent};
