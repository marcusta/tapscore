(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function t(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(r){if(r.ep)return;r.ep=!0;const n=t(r);fetch(r.href,n)}})();const Ae="modulepreload",De=function(o){return"/tapscore/"+o},me={},qe=function(e,t,s){let r=Promise.resolve();if(t&&t.length>0){let c=function(u){return Promise.all(u.map(m=>Promise.resolve(m).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),d=i?.nonce||i?.getAttribute("nonce");r=c(t.map(u=>{if(u=De(u),u in me)return;me[u]=!0;const m=u.endsWith(".css"),p=m?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${p}`))return;const g=document.createElement("link");if(g.rel=m?"stylesheet":Ae,m||(g.as="script"),g.crossOrigin="",g.href=u,d&&g.setAttribute("nonce",d),document.head.appendChild(g),m)return new Promise((_,H)=>{g.addEventListener("load",_),g.addEventListener("error",()=>H(new Error(`Unable to preload CSS for ${u}`)))})}))}function n(i){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=i,window.dispatchEvent(d),!d.defaultPrevented)throw i}return r.then(i=>{for(const d of i||[])d.status==="rejected"&&n(d.reason);return e().catch(n)})};class Ge{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])this.batching?this.pending.add(t):t.run()}runTracked(e,t){Ee(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.run()}}}const R=new Ge;function Ee(o){for(const e of o.deps)e.delete(o);o.deps.clear()}class h{constructor(e){this.subs=new Set,this.val=e}get(){return R.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,R.notify(this.subs))}update(e){this.set(e(this.val))}}class I{constructor(e){this.subs=new Set,this.val=void 0;const t=this,s={run(){R.runTracked(s,()=>{const r=e();Object.is(t.val,r)||(t.val=r,R.notify(t.subs))})},deps:new Set};s.run()}get(){return R.subscribe(this.subs),this.val}peek(){return this.val}}function v(o){const e={run(){R.runTracked(e,o)},deps:new Set};return e.run(),()=>Ee(e)}function W(o){R.batch(o)}function D(o){return R.untrack(o)}class Ke{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const O=new Ke,K="/tapscore/".replace(/\/+$/,"");function ne(o){return K?o===K?"/":o.startsWith(K+"/")?o.slice(K.length):o:o}function Ue(o){return K+o}class j{constructor(){this.route=new h(ne(location.pathname??"/")),this.search=new h(location.search??""),window.addEventListener("popstate",()=>W(()=>{this.route.set(ne(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},r=e.indexOf("#"),n=r>=0?e.slice(r):"",i=r>=0?e.slice(0,r):e,d=i.indexOf("?"),c=d>=0?i.slice(0,d):i,u=d>=0?i.slice(d+1):"",m=s.query!==void 0?We(s.query):u?"?"+u:"",p=Ue(c)+m+n;(s.replace?history.replaceState:history.pushState).call(history,null,"",p),W(()=>{this.route.set(c),this.search.set(m)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:r=>{r.preventDefault(),this.navigate(e)},className:()=>{const r=this.route.get();return r===s||r.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new I(()=>{const s=this.route.get().split("/"),r={};for(const[n,i]of t.entries())i.startsWith(":")&&(r[i.slice(1)]=s[n]??"");return r})}query(e){return new I(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new I(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function We(o){const e=new URLSearchParams;for(const[s,r]of Object.entries(o))r==null||r===""||e.set(s,String(r));const t=e.toString();return t?"?"+t:""}function Xe(o){return e=>o[e]}function Qe(o,e){const t=(r,n,i)=>{const d=Object.entries(r).map(([c,u])=>`--${c}:${u}`).join(";");return`${n}{color-scheme:${i};${d}}`},s=document.createElement("style");return s.textContent=t(o,'[data-theme="light"]',"light")+t(e,'[data-theme="dark"]',"dark"),document.head.appendChild(s),r=>`var(--${r})`}const fe="basics-js-theme";class Ve{constructor(){this.dark=new h(!1);const e=localStorage.getItem(fe),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),v(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(fe,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function y(o){const e=document.createElement("template");return e.innerHTML=o,e}function Ye(o,e){let t;for(const s of Object.keys(e))o.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const ge=new Set;class T{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!ge.has(t)){ge.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return O.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const r=D(()=>{const n=new e(s[0]);return n.mount(t),n});return this.children.push(r),r}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0}wire(e,t,s){const r=s??(i=>this.track(i)),n=e.content.cloneNode(!0);for(const i of n.querySelectorAll("[bind]")){const d=t[i.getAttribute("bind")];if(d)if(typeof d=="function")r(v(()=>{const c=d();i instanceof HTMLInputElement||i instanceof HTMLTextAreaElement?i.value=String(c):i.textContent=String(c)}));else for(const[c,u]of Object.entries(d)){const m=c.includes("-");c.startsWith("on")&&typeof u=="function"?i.addEventListener(c.slice(2),u):typeof u=="function"?r(v(()=>{const p=u();m?i.setAttribute(c,String(p)):i[c]=p})):m?i.setAttribute(c,String(u)):i[c]=u}}return n}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const r=this.ref(t,e);return r?(typeof s=="string"?r.textContent=s:typeof s=="function"&&s.prototype instanceof T?this.spawn(s,r):typeof s=="function"&&s(r,{spawn:(n,i,...d)=>this.spawn(n,i,...d),track:n=>this.track(n)}),!0):!1}$each(e,t,s,r=(n,i)=>i){const n=typeof t=="function"?t:()=>t.get(),i=new Map,d=new Map;this.track(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),this.track(v(()=>{const c=n(),u=new Map;for(const[p,g]of c.entries()){const _=r(g,p);if(i.has(_))u.set(_,i.get(_));else{const H=[];u.set(_,D(()=>s(g,p,x=>H.push(x)))),d.set(_,H)}}for(const[p,g]of i)u.has(p)||(g.remove(),d.get(p)?.forEach(_=>_()),d.delete(p));let m=e.firstChild;for(const p of u.values())p===m?m=m.nextSibling:e.insertBefore(p,m);i.clear();for(const[p,g]of u)i.set(p,g)}))}$condition(e,t,s,r){let n=null;this.track(v(()=>{n&&(n.remove(),n=null);const i=t.get();n=D(()=>i?s():r?.()??null),n&&e.appendChild(n)}))}$swap(e,t,s,r){let n=null;this.track(v(()=>{n&&(n.destroy(),n=null),e.textContent="";const i=t.get(),d=s[i]??Ye(i,s)??r;d&&(n=D(()=>{const c=new d;return c.mount(e),c}))})),this.track(()=>n?.destroy())}}async function Je(o,e,t){const s=document.querySelector(e);s.textContent="";const r=O.get(j);let n=null,i=!1,d=null,c=!!t?.hot?.data.hmr;const u=async m=>{n&&(n.destroy(),n=null,s.textContent=""),m?(d||(d=(await qe(()=>import("./obs-shell.component-CtZ9Cbvg.js"),[])).ObsShellComponent),n=D(()=>new d)):(!c&&t?.onInit&&(await t.onInit(),c=!0),n=D(()=>new o)),D(()=>n.mount(s)),i=m};await u(ne(location.pathname).startsWith("/_obs")),v(()=>{const m=r.route.get().startsWith("/_obs");m!==i&&u(m)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>n?.destroy()),t.hot.accept())}class G extends Error{constructor(e,t,s,r){super(t),this.status=e,this.details=s,this.traceId=r,this.name="ApiError"}}const Ze=10,V=[];let Y=[],U=null;function et(o){V.push(o),V.length>Ze&&V.shift()}function tt(o,e,t){const s={code:o,message:e,url:typeof location<"u"?location.href:"",context:[...V],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),Y.push(s),st()}function st(){U||(U=setTimeout(Pe,5e3))}function Pe(){if(U&&(clearTimeout(U),U=null),Y.length===0)return;const o=Y;Y=[];for(const e of o){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon("/api/_obs/errors",new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch("/api/_obs/errors",{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Pe()});const nt=3e4,rt=2,X=new Map,Ce=new WeakMap;function ot(o){if(o instanceof G)return o.traceId;if(o!=null&&typeof o=="object")return Ce.get(o)}async function f(o){if(o.method==="GET"){const e=X.get(o.url);if(e)return e;const t=be(o,rt);return X.set(o.url,t),t.then(()=>X.delete(o.url),()=>X.delete(o.url)),t}return be(o,0)}async function be(o,e){const t=o.timeout??nt;let s;for(let r=0;r<=e;r++){const n=crypto.randomUUID();try{return await at(it(o,n),t)}catch(i){if(s=i,!(i instanceof G)&&i!=null&&typeof i=="object"&&Ce.set(i,n),i instanceof G||r===e)break;await new Promise(d=>setTimeout(d,1e3*2**r))}}throw s}async function it(o,e){const t={"X-Trace-Id":e},s={method:o.method,headers:t};o.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(o.body));const r=await fetch(o.url,s),n=r.headers.get("x-trace-id")??e;if(et({type:"api",detail:`${o.method} ${o.url}`,timestamp:new Date().toISOString()}),!r.ok){const i=await r.json().catch(()=>({error:r.statusText}));throw new G(r.status,i.error??r.statusText,i.details,n)}return r.json()}function at(o,e){let t;const s=new Promise((r,n)=>{t=setTimeout(()=>n(new Error("Request timeout")),e)});return Promise.race([o,s]).finally(()=>clearTimeout(t))}async function C(o,e,t){W(()=>{o.set(!0),e.set(null)});try{const s=await t();return o.set(!1),s}catch(s){const r=lt(s);W(()=>{o.set(!1),e.set(r)}),tt(r.code,r.message,ot(s));return}}function lt(o){return o instanceof G?o.status===401?{code:"auth",message:"Unauthorized"}:o.status===409?{code:"conflict",message:"Data has changed — please try again"}:o.status===400?{code:"validation",message:o.message}:{code:"server",message:"Server error"}:o instanceof Error?o.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}function dt(o){return{me:()=>f({method:"GET",url:`${o}/auth/me`}),login:e=>f({method:"POST",url:`${o}/auth/login`,body:e}),logout:()=>f({method:"POST",url:`${o}/auth/logout`,body:{}})}}class ie{constructor(){this.api=dt("/api"),this.currentUser=new h(null),this.loading=new h(!1),this.error=new h(null)}async load(){const e=await C(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await C(this.loading,this.error,()=>this.api.login({username:e,password:t}));return s?(this.currentUser.set(s),!0):!1}async logout(){await C(this.loading,this.error,()=>this.api.logout());const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const ye={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},a=Qe({...ye,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},{...ye,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"}),$=o=>`var(--${o})`,l=Xe({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem"}),S=(o=$("radius"))=>`
    border: 1px solid ${$("border")};
    border-radius: ${o};
    background: ${$("btn-bg")};
    color: ${$("text")};
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: ${$("btn-hover")}; }
`,M=()=>`
    border: 1px solid ${$("border")};
    border-radius: ${$("radius")};
    background: ${$("input-bg")};
    color: ${$("text")};
    font-family: inherit;
    &::placeholder { color: ${$("text-muted")}; }
`,z=o=>`
    background: ${$("surface")};
    border: 1px solid ${$("border")};
    border-radius: ${$("radius")};
    box-shadow: ${$("shadow")};
    ${o?.hover?`
    transition: box-shadow 0.2s, border-color 0.2s;
    &:hover { box-shadow: ${$("shadow-elevated")}; }`:""}
`,ct=y(`
    <nav class="tabbar" bind="root">
        <a bind="roundsLink" href="/rounds">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 21V4l9 3.5L8 11"/><circle cx="8" cy="21" r="0.5" fill="currentColor"/>
            </svg>
            <span>Rounds</span>
        </a>
        <a bind="playersLink" href="/players">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="8" r="3.5"/><path d="M3.5 20c.5-3.5 2.7-5.5 5.5-5.5s5 2 5.5 5.5"/><circle cx="16.5" cy="9.5" r="2.8"/><path d="M16.8 14.6c2.2.4 3.5 2 3.9 4.9"/>
            </svg>
            <span>Players</span>
        </a>
    </nav>
`);class ut extends T{static styles=`
        .tabbar {
            display: flex;
            background: ${a("topbar-bg")};
            padding-bottom: env(safe-area-inset-bottom);

            &.hidden { display: none; }

            & a {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                padding: ${l("sm")} 0 ${l("md")};
                color: rgba(247, 244, 234, 0.55);
                text-decoration: none;
                font-size: 0.7rem;
                font-weight: 600;
                letter-spacing: 0.06em;
                text-transform: uppercase;

                & svg { width: 26px; height: 26px; }

                &.active { color: ${a("accent")}; }
            }
        }
    `;router=this.inject(j);auth=this.inject(ie);render(){return this.wire(ct,{root:{className:()=>this.auth.currentUser.get()&&this.router.route.get()!=="/login"?"tabbar":"tabbar hidden"},roundsLink:this.router.link("/rounds"),playersLink:this.router.link("/players")})}}function ht(o){return{async me(){return f({method:"GET",url:`${o}/players/me`})}}}function pt(o){return{async list(){return f({method:"GET",url:`${o}/clubs`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/clubs/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${o}/clubs`,body:e})},async update(e){return f({method:"POST",url:`${o}/clubs/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${o}/clubs/${e.id}`})}}}function mt(o){return{async list(){return f({method:"GET",url:`${o}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/courses/by-club${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/courses/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${o}/courses`,body:e})},async update(e){return f({method:"POST",url:`${o}/courses/update`,body:e})},async updateHole(e){return f({method:"POST",url:`${o}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/courses/validate${s?"?"+s:""}`})},async remove(e){return f({method:"DELETE",url:`${o}/courses/${e.id}`})}}}function ft(o){return{async listByCourse(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/tees/by-course${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/tees/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${o}/tees`,body:e})},async update(e){return f({method:"POST",url:`${o}/tees/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${o}/tees/${e.id}`})}}}function gt(o){return{async list(){return f({method:"GET",url:`${o}/guest-players`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/guest-players/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${o}/guest-players`,body:e})}}}function bt(o){return{async latest(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/handicap/latest${s?"?"+s:""}`})},async history(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/handicap/history${s?"?"+s:""}`})},async record(e){return f({method:"POST",url:`${o}/handicap/record`,body:e})}}}function yt(o){return{async list(){return f({method:"GET",url:`${o}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/rounds/balls${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/rounds/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${o}/rounds`,body:e})},async createFromDraft(e){return f({method:"POST",url:`${o}/rounds/from-draft`,body:e})},async update(e){return f({method:"POST",url:`${o}/rounds/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${o}/rounds/${e.id}`})}}}function _t(o){return{async listByRound(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/score-events/by-round${s?"?"+s:""}`})},async append(e){return f({method:"POST",url:`${o}/score-events`,body:e})}}}function vt(o){return{async forBall(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/scorecards/for-ball${s?"?"+s:""}`})},async forRound(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/scorecards/for-round${s?"?"+s:""}`})}}}function xt(o){return{async forRound(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/leaderboards/for-round${s?"?"+s:""}`})}}}function wt(o){return{async list(){return f({method:"GET",url:`${o}/friendly-rounds`})},async create(e){return f({method:"POST",url:`${o}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/friendly-rounds/by-token${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/friendly-rounds/get${s?"?"+s:""}`})},async balls(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/friendly-rounds/balls${s?"?"+s:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/friendly-rounds/scorecard${s?"?"+s:""}`})},async result(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/friendly-rounds/result${s?"?"+s:""}`})},async score(e){return f({method:"POST",url:`${o}/friendly-rounds/score`,body:e})}}}function $t(o){return{async courses(){return f({method:"GET",url:`${o}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return f({method:"GET",url:`${o}/setup/tees/by-course${s?"?"+s:""}`})},async formats(){return f({method:"GET",url:`${o}/setup/formats`})}}}const P="/tapscore/".replace(/\/+$/,"")+"/api",k={players:ht(P),clubs:pt(P),courses:mt(P),tees:ft(P),guestPlayers:gt(P),handicap:bt(P),rounds:yt(P),scoreEvents:_t(P),scorecards:vt(P),leaderboards:xt(P),friendlyRounds:wt(P),setup:$t(P)};class kt{loading=new h(!1);error=new h(null);rounds=new h([]);async load(){const e=await C(this.loading,this.error,()=>k.friendlyRounds.list());e&&this.rounds.set(e)}}function St(o){const e=typeof navigator<"u"?navigator.language:void 0;return typeof e=="string"&&e.toLowerCase().startsWith("sv")?"sv":"en"}function It(){return St()}class J{loading=new h(!1);error=new h(null);descriptors=new h([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await C(this.loading,this.error,()=>k.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=It()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:s.teamSize?.min??2,max:s.teamSize?.max??2},...s.teamCount?{teamCount:s.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}}function ae(o){const e=O.get(J);return e.load(),e.labelOf(o.formatId)??`${o.scoringMode} · ${o.teamShape}`}const Tt=y(`
    <div class="landing">
        <header class="landing__head">
            <div class="landing__flag">⛳</div>
            <h1>tapscore</h1>
            <p>Scores, settled on the green. No sign-in needed.</p>
        </header>
        <button bind="createBtn" class="landing__create" type="button">
            <span class="landing__create-plus">+</span> Create round
        </button>
        <div class="landing__section">
            <span class="landing__section-title">Rounds</span>
            <span bind="count" class="landing__count"></span>
        </div>
        <div bind="empty" class="landing__empty">No rounds yet — create one to tee off.</div>
        <div bind="list" class="landing__list"></div>
        <button bind="signin" class="landing__signin" type="button">Sign in</button>
    </div>
`),Et=y(`
    <button bind="row" type="button" class="round-row">
        <div class="round-row__top">
            <span bind="course" class="round-row__course"></span>
            <span bind="status" class="round-row__status"></span>
        </div>
        <div class="round-row__bottom">
            <span bind="date"></span>
            <span bind="formats" class="round-row__formats"></span>
        </div>
    </button>
`),Pt={not_started:"Not started",active:"Live",complete:"Done"};class _e extends T{static styles=`
        .landing {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .landing__head {
                text-align: center;
                margin-bottom: ${l("xl")};

                & .landing__flag { font-size: 2.2rem; line-height: 1; }
                & h1 {
                    margin: ${l("xs")} 0 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2.2rem;
                    letter-spacing: -0.02em;
                    color: ${a("text")};
                }
                & p {
                    margin: ${l("xs")} 0 0;
                    color: ${a("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .landing__create {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: ${l("sm")};
                padding: ${l("lg")};
                margin-bottom: ${l("xl")};
                font-size: 1.1rem;
                font-weight: 700;
                font-family: inherit;
                ${S()}
                background: ${a("primary")};
                color: ${a("primary-text")};
                border: none;
                box-shadow: ${a("shadow-elevated")};
                &:hover { background: ${a("primary")}; }

                & .landing__create-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .landing__section {
                display: flex;
                align-items: baseline;
                gap: ${l("sm")};
                margin-bottom: ${l("sm")};

                & .landing__section-title {
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: ${a("text")};
                }
                & .landing__count {
                    color: ${a("text-muted")};
                    font-size: 0.85rem;
                }
            }

            & .landing__empty {
                color: ${a("text-muted")};
                font-size: 0.9rem;
                padding: ${l("lg")} 0;

                &.hidden { display: none; }
            }

            & .landing__list {
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
            }

            & .round-row {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                padding: ${l("md")} ${l("lg")};
                text-align: left;
                font-family: inherit;
                cursor: pointer;
                ${z({hover:!0})}

                & .round-row__top {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    gap: ${l("md")};
                }
                & .round-row__course {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${a("text")};
                }
                & .round-row__status {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    border-radius: ${a("radius-pill")};
                    padding: 2px 10px;
                    flex-shrink: 0;

                    &.s-active { background: ${a("accent-soft")}; color: ${a("accent")}; }
                    &.s-complete { background: ${a("surface-sunken")}; color: ${a("text-muted")}; }
                    &.s-not_started { background: ${a("surface-sunken")}; color: ${a("text-muted")}; }
                }
                & .round-row__bottom {
                    display: flex;
                    justify-content: space-between;
                    gap: ${l("md")};
                    color: ${a("text-muted")};
                    font-size: 0.85rem;
                }
                & .round-row__formats {
                    text-align: right;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            & .landing__signin {
                display: block;
                margin: ${l("2xl")} auto 0;
                padding: ${l("sm")} ${l("lg")};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 600;
                color: ${a("text-muted")};
                text-decoration: underline;
                cursor: pointer;
            }
        }
    `;svc=this.inject(kt);router=this.inject(j);render(){this.svc.load();const e=this.wire(Tt,{createBtn:{onclick:()=>this.router.navigate("/create")},signin:{onclick:()=>this.router.navigate("/login")},count:()=>{const t=this.svc.rounds.get().length;return t===0?"":`${t} on the card`},empty:{className:()=>this.svc.rounds.get().length===0?"landing__empty":"landing__empty hidden"}});return this.$each(this.ref(e,"list"),this.svc.rounds,(t,s,r)=>this.wireEl(Et,{row:{onclick:()=>this.router.navigate("/round",{query:{token:t.friendlyRound.shareToken}})},course:()=>t.round.courseNameSnapshot??"Round",status:{textContent:()=>Pt[t.round.status]??t.round.status,className:()=>`round-row__status s-${t.round.status}`},date:()=>t.round.date,formats:()=>t.round.formatSlots.map(ae).join(" · ")},r),t=>t.friendlyRound.id),e}}const Ct=180,ve=4,Ot=12;function q(o,e){return e<=0?0:Math.max(0,Math.min(e-1,o))}function zt(o){const{dragDistance:e,velocity:t,itemWidth:s}=o;if(Math.abs(e)<Ot)return 0;const r=e+t*Ct,n=Math.round(-r/s);return Math.max(-ve,Math.min(ve,n))}const xe="tapscore:pending-scores:v1",jt=336*60*60*1e3,we=200;function Ht(){try{return globalThis.localStorage??null}catch{return null}}function Nt(o){if(typeof o!="object"||o===null)return!1;const e=o;return typeof e.token=="string"&&typeof e.ballId=="string"&&typeof e.playHoleId=="string"&&(typeof e.strokes=="number"||e.strokes===null)&&(e.eventType==="score_entered"||e.eventType==="score_cleared")&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class Mt{entries=[];storage;constructor(e=Ht(),t=Date.now()){this.storage=e,this.entries=this.load();const s=this.applyHygiene(t);s.length!==this.entries.length&&(this.entries=s,this.persist())}enqueue(e){const t=this.entries.findIndex(s=>s.token===e.token&&s.ballId===e.ballId&&s.playHoleId===e.playHoleId);t>=0?this.entries[t]=e:this.entries.push(e),this.entries=this.applyHygiene(e.queuedAt),this.persist()}remove(e){const t=this.entries.filter(s=>s.clientEventId!==e);t.length!==this.entries.length&&(this.entries=t,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(s=>e-s.queuedAt<=jt);return t.length>we?t.slice(t.length-we):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(xe);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(Nt):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(xe,JSON.stringify(this.entries))}catch{}}}const Rt=["1st","2nd","3rd","4th","5th","6th","7th","8th"],B=(o,e)=>`${o}|${e}`;function Oe(o){return o.players.map(e=>e.displayName).join(" & ")||o.label||"Ball"}function Lt(o,e,t){return o?!(o.minPar!==void 0&&e<o.minPar||o.maxPar!==void 0&&e>o.maxPar||o.pars&&!o.pars.includes(e)||o.holes&&!o.holes.includes(t)):!0}class le{constructor(e=new Mt){this.queue=e}queue;loading=new h(!1);error=new h(null);friendlyRound=new h(null);round=new h(null);balls=new h([]);scorecards=new h([]);cells=new h(new Map);result=new h(null);resultLoading=new h(!1);resultError=new h(null);holeIdx=new h(0);groupIdx=new h(0);selectedSlot=new h(null);token=null;loadSeq=0;resultSeq=0;flushing=!1;pendingSlotIndex=null;async loadByToken(e,t){const s=e!==this.token;this.token=e;const r=++this.loadSeq;s&&this.resetForNewToken(t),O.get(J).load();const n=await C(this.loading,this.error,()=>k.friendlyRounds.byToken({token:e}));if(!n||r!==this.loadSeq||e!==this.token)return;if(this.friendlyRound.set(n.friendlyRound),this.round.set(n.round),this.pendingSlotIndex!==null){const u=n.round.formatSlots[this.pendingSlotIndex]?.slotDefId??null;this.pendingSlotIndex=null,u!==null&&this.selectedSlot.set(u)}const[i,d]=await Promise.all([k.friendlyRounds.balls({token:e}).catch(()=>[]),k.friendlyRounds.scorecard({token:e}).catch(()=>[])]);r!==this.loadSeq||e!==this.token||(this.cells.set(new Map),this.scorecards.set(d),this.balls.set(i),await this.flushPending())}async loadResult(){const e=this.token;if(!e)return;const t=++this.resultSeq,s=await C(this.resultLoading,this.resultError,()=>k.friendlyRounds.result({token:e}));t!==this.resultSeq||e!==this.token||s&&this.result.set(s)}ballNameById=new I(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,Oe(t));return e});nameOf(e){return this.ballNameById.get().get(e)??e}selectedSlotDefId(){const e=this.round.get()?.formatSlots??[];if(e.length===0)return null;const t=this.selectedSlot.get();return t!==null&&e.some(s=>s.slotDefId===t)?t:e[0]?.slotDefId??null}selectSlot(e){this.selectedSlot.set(e)}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return q(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),s=t?.playHoles.find(i=>i.id===e);if(!t||!s)return"";const r=t.playHoles.filter(i=>i.courseHoleNumber===s.courseHoleNumber).sort((i,d)=>i.ordinal-d.ordinal);if(r.length===1)return`${s.courseHoleNumber}`;const n=r.findIndex(i=>i.id===e);return`${s.courseHoleNumber} (${Rt[n]??`${n+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(q(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(q(this.holeIndex()+1,this.playedOrder().length))}strokesFor(e,t){const s=this.cells.get().get(B(e,t));return s?s.strokes:this.scorecards.get().find(i=>i.ballId===e)?.holes.find(i=>i.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(B(e,t))?.status??null}metadataFor(e,t,s){const r=this.cells.get().get(B(e,t));return r&&r.metadata!==void 0?r.metadata?.[s]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[s]}metadataInputs(){const e=O.get(J),t=this.round.get()?.formatSlots??[],s=[],r=new Set;for(const n of t){const i=e.byId(n.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of i)r.has(d.key)||(r.add(d.key),s.push(d))}return s}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>Lt(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,s,r){const n=B(e,t),i=crypto.randomUUID();this.patchCell(n,{strokes:s,metadata:r,status:"saving",clientEventId:i});const d=this.token;d&&(this.enqueue(d,e,t,s,r,i),await this.post(d,e,t,s,r,i))}async retry(e,t){const s=B(e,t),r=this.cells.get().get(s);if(!r)return;this.patchCell(s,{...r,status:"saving"});const n=this.token;n&&(this.enqueue(n,e,t,r.strokes,r.metadata,r.clientEventId),await this.post(n,e,t,r.strokes,r.metadata,r.clientEventId))}async flushPending(){const e=this.token;if(!(!e||this.flushing)){this.flushing=!0;try{for(const t of this.queue.entriesFor(e)){if(e!==this.token)return;this.patchCell(B(t.ballId,t.playHoleId),{strokes:t.strokes,metadata:t.metadata,status:"saving",clientEventId:t.clientEventId}),await this.post(e,t.ballId,t.playHoleId,t.strokes,t.metadata,t.clientEventId)}}finally{this.flushing=!1}}}enqueue(e,t,s,r,n,i){this.queue.enqueue({token:e,ballId:t,playHoleId:s,strokes:r,eventType:r===null?"score_cleared":"score_entered",clientEventId:i,...n!==void 0?{metadata:n}:{},queuedAt:Date.now()})}async post(e,t,s,r,n,i){const d=B(t,s);try{await k.friendlyRounds.score({token:e,ballId:t,playHoleId:s,strokes:r,eventType:r===null?"score_cleared":"score_entered",clientEventId:i,...n!=null?{metadata:n}:{}}),this.queue.remove(i);const c=this.cells.get().get(d);c&&c.clientEventId===i&&this.patchCell(d,{...c,status:"saved"});const u=this.round.get();e===this.token&&u&&u.status==="not_started"&&this.round.set({...u,status:"active"})}catch{const c=this.cells.get().get(d);c&&c.clientEventId===i&&this.patchCell(d,{...c,status:"error"})}}patchCell(e,t){const s=new Map(this.cells.get());s.set(e,t),this.cells.set(s)}resetForNewToken(e){this.resultSeq++,this.friendlyRound.set(null),this.round.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(e?.holeIdx??0),this.groupIdx.set(e?.groupIdx??0);const t=e?.selectedSlot;this.pendingSlotIndex=null,typeof t=="string"?this.selectedSlot.set(t):typeof t=="number"?(this.pendingSlotIndex=t,this.selectedSlot.set(null)):this.selectedSlot.set(null)}}const F=60,$e=8,re=4,Bt=Array.from({length:re*2+1},(o,e)=>e-re),Ft="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",At=y(`
    <div bind="root" class="se hidden">
        <div bind="viewport" class="se__carousel">
            <div class="se__clip">
                <div bind="track" class="se__track"></div>
            </div>
        </div>

        <div bind="rows" class="se__rows"></div>

        <div bind="modal" class="se-modal hidden">
            <div class="se-modal__head">
                <button bind="close" class="se-modal__close" type="button">✕</button>
                <span bind="modalTitle" class="se-modal__title"></span>
                <span class="se-modal__spacer"></span>
            </div>
            <div bind="modalList" class="se-modal__list"></div>
            <div class="se-pad">
                <div bind="extended" class="se-pad__ext hidden">
                    <div class="se-pad__ext-row">
                        <button bind="extMinus" class="se-pad__ext-step" type="button">−</button>
                        <span bind="extVal" class="se-pad__ext-val"></span>
                        <button bind="extPlus" class="se-pad__ext-step" type="button">+</button>
                    </div>
                    <div class="se-pad__ext-actions">
                        <button bind="extCancel" class="se-pad__ext-cancel" type="button">Cancel</button>
                        <button bind="extOk" class="se-pad__ext-ok" type="button">✓</button>
                    </div>
                </div>
                <div bind="keys" class="se-pad__grid"></div>
            </div>

            <div bind="stats" class="se-stats hidden">
                <div class="se-stats__head">
                    <button bind="statsBack" class="se-stats__back" type="button">‹</button>
                    <span bind="statsHole" class="se-stats__hole"></span>
                    <span class="se-stats__spacer"></span>
                </div>
                <div class="se-stats__who">
                    <span bind="statsTitle" class="se-stats__name"></span>
                    <span bind="statsScore" class="se-stats__score"></span>
                </div>
                <div bind="statsBody" class="se-stats__body"></div>
                <div class="se-stats__foot">
                    <button bind="statsNext" class="se-stats__next" type="button"></button>
                </div>
            </div>
        </div>

        <div bind="toast" class="se-toast hidden"></div>
    </div>
`),Dt=y(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),qt=y(`
    <div class="se-row">
        <div class="se-row__who">
            <span bind="name" class="se-row__name"></span>
            <span bind="topar" class="se-row__topar"></span>
        </div>
        <div class="se-row__scores">
            <span class="se-row__slot"><span bind="prev" class="se-row__prev"></span></span>
            <span class="se-row__slot"><button bind="circle" class="se-row__circle" type="button"><span bind="cval"></span></button></span>
        </div>
    </div>
`),Gt=y(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),ke=y(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),Kt=y(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`);class Ut extends T{static styles=`
        .se {
            margin-top: ${l("xl")};
            &.hidden { display: none; }
        }

        /* Clipped two-cell carousel right-aligned over the score columns. */
        .se__carousel {
            position: relative;
            height: 60px;
            overflow: hidden;
            border-radius: ${a("radius")};
            background: ${a("surface-sunken")};
            border: 1px solid ${a("border")};
            touch-action: pan-y;
            user-select: none;
        }
        .se__clip {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${$e}px;
            width: ${F*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-re*F}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${F}px;
            width: ${F}px;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1px;
            opacity: 0.5;
            transform: scale(0.84);
            transition: opacity 180ms ease, transform 180ms ease;

            &.active { opacity: 1; transform: scale(1); }
            &.gone { opacity: 0; }

            & .se-hole__num {
                font-family: ${a("font-display")};
                font-weight: 700;
                font-size: 1.2rem;
                color: ${a("text")};
            }
            & .se-hole__par {
                font-size: 0.68rem;
                color: ${a("text-muted")};
            }
        }

        .se__rows {
            margin-top: ${l("sm")};
            border-top: 1px solid ${a("border")};
        }
        .se-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${l("md")};
            padding: ${l("md")} 0;
            border-bottom: 1px solid ${a("border")};

            & .se-row__who { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
            & .se-row__name {
                font-family: ${a("font-display")};
                font-weight: 600;
                font-size: 1.05rem;
                color: ${a("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .se-row__topar { font-size: 0.8rem; font-weight: 600; }

            & .se-row__scores { display: flex; align-items: center; padding-right: ${$e}px; flex-shrink: 0; }
            & .se-row__slot { width: ${F}px; display: flex; align-items: center; justify-content: center; }
            & .se-row__prev {
                font-family: ${a("font-display")}; font-weight: 700; font-size: 1.05rem;
                color: ${a("text-muted")};
                font-variant-numeric: tabular-nums;
            }
            & .se-row__circle {
                width: 48px; height: 48px; border-radius: 999px;
                border: none; cursor: pointer;
                background: ${a("accent-soft")};
                font-family: ${a("font-display")}; font-weight: 700; font-size: 1.25rem;
                color: ${a("primary")};
                font-variant-numeric: tabular-nums;
                transition: background 0.15s;
                &:active { background: ${a("accent")}; }
                &.empty { color: ${a("text-muted")}; background: ${a("surface-sunken")}; }
            }
        }
        .se-row__topar.under { color: ${a("under-par")}; }
        .se-row__topar.over { color: ${a("over-par")}; }
        .se-row__topar.even { color: ${a("text-muted")}; }

        /* --- Fullscreen dark keypad modal --- */
        .se-modal {
            position: fixed; inset: 0; z-index: 50;
            display: flex; flex-direction: column;
            background: #121212; color: #fff;
            &.hidden { display: none; }
        }
        .se-modal__head {
            display: flex; align-items: center; justify-content: space-between;
            padding: ${l("md")} ${l("lg")};
            border-bottom: 1px solid rgba(255,255,255,0.1);

            & .se-modal__close {
                background: none; border: none; color: #fff; font-size: 1.3rem;
                width: 40px; height: 40px; border-radius: 999px; cursor: pointer;
                &:active { background: rgba(255,255,255,0.1); }
            }
            & .se-modal__title { font-family: ${a("font-display")}; font-weight: 700; font-size: 1.1rem; }
            & .se-modal__spacer { width: 40px; }
        }
        .se-modal__list { flex: 1; overflow-y: auto; }
        .se-mrow {
            width: 100%;
            display: flex; align-items: center; justify-content: space-between;
            padding: ${l("lg")};
            background: none; border: none; border-left: 4px solid transparent;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            color: #fff; font-family: inherit; cursor: pointer; text-align: left;

            &.sel { border-left-color: ${a("primary")}; background: rgba(93,155,117,0.14); }

            & .se-mrow__who { display: flex; flex-direction: column; gap: 2px; }
            & .se-mrow__name { font-family: ${a("font-display")}; font-weight: 600; font-size: 1rem; }
            & .se-mrow__hcp { font-size: 0.8rem; color: rgba(255,255,255,0.55); }

            & .se-mrow__circle {
                width: 52px; height: 52px; border-radius: 999px;
                display: flex; align-items: center; justify-content: center;
                background: ${a("primary")};
                font-family: ${a("font-display")}; font-weight: 700; font-size: 1.25rem;
                font-variant-numeric: tabular-nums;
            }
            &.sel .se-mrow__circle { background: #fff; color: ${a("primary")}; }
        }

        .se-pad { position: relative; padding: ${l("sm")} ${l("sm")} ${l("xl")}; background: #1c1c1e; }
        .se-pad__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }

        /* --- Stats step: a near-fullscreen screen shown after a real score on a
           hole that collects extra info (umbrella GIR/fairway today; numeric
           stats like bunker visits/putts later). Sits above the keypad modal;
           "Next" persists the toggles and auto-advances. The structured layout
           (header → player → grouped controls → footer) leaves room for richer
           per-category inputs without changing the score-entry flow. */
        .se-stats {
            position: fixed; inset: 0; z-index: 60;
            background: #121212; color: #fff;
            display: flex; flex-direction: column;
            &.hidden { display: none; }

            & .se-stats__head {
                display: flex; align-items: center; justify-content: space-between;
                padding: ${l("md")} ${l("lg")};
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);

                & .se-stats__back {
                    background: none; border: none; color: #fff; font-size: 1.8rem; line-height: 1;
                    width: 40px; height: 40px; border-radius: 999px; cursor: pointer;
                    &:active { background: rgba(255, 255, 255, 0.1); }
                }
                & .se-stats__hole { font-family: ${a("font-display")}; font-weight: 700; font-size: 1.1rem; }
                & .se-stats__spacer { width: 40px; }
            }

            & .se-stats__who {
                display: flex; align-items: center; justify-content: center; gap: ${l("md")};
                padding: ${l("lg")} ${l("lg")} ${l("sm")};
            }
            & .se-stats__name { font-family: ${a("font-display")}; font-weight: 700; font-size: 1.4rem; }
            & .se-stats__score {
                min-width: 44px; height: 44px; padding: 0 8px; border-radius: 999px;
                display: inline-flex; align-items: center; justify-content: center;
                background: ${a("primary")}; color: #fff;
                font-family: ${a("font-display")}; font-weight: 700; font-size: 1.3rem;
                font-variant-numeric: tabular-nums;
            }

            & .se-stats__body {
                flex: 1; overflow-y: auto;
                display: flex; flex-direction: column; gap: ${l("xl")};
                padding: ${l("lg")} ${l("lg")} ${l("xl")};
                align-content: flex-start;
            }

            /* Each metadata category is its own labeled group. */
            & .se-stats__group { display: flex; flex-direction: column; gap: ${l("sm")}; }
            & .se-stats__group-label {
                text-align: center;
                font-family: ${a("font-display")}; font-weight: 700; font-size: 1.05rem;
                color: rgba(255, 255, 255, 0.92);
            }
            & .se-stats__seg { display: flex; gap: ${l("sm")}; justify-content: center; }

            /* Two-option segmented control: the stored value is always the
               highlighted segment, so there's no implied/hidden state. */
            & .se-seg {
                flex: 1; max-width: 180px;
                border: 1px solid rgba(255, 255, 255, 0.22);
                border-radius: 14px;
                background: #1c1c1e;
                color: rgba(255, 255, 255, 0.55);
                font-family: inherit;
                font-size: 1.05rem;
                font-weight: 700;
                padding: 18px 22px;
                cursor: pointer;
                &:active { background: rgba(255, 255, 255, 0.08); }
                &.on-hit { background: ${a("primary")}; border-color: ${a("primary")}; color: #fff; }
                &.on-miss { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.45); color: #fff; }
            }

            & .se-stats__foot {
                padding: ${l("md")} ${l("lg")} ${l("xl")};
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            & .se-stats__next {
                width: 100%;
                height: 56px;
                border: none;
                border-radius: 12px;
                background: ${a("primary")};
                color: #fff;
                font-family: ${a("font-display")};
                font-weight: 700;
                font-size: 1.15rem;
                cursor: pointer;
                &:active { filter: brightness(1.1); }
            }
        }
        .se-key {
            height: 56px; border-radius: 10px; border: none; cursor: pointer;
            background: #2a2a2a; color: #fff; font-family: inherit;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            &:active { background: #3a3a3a; }
            &.par { background: ${a("primary")}; }
            &.clear { color: ${a("error")}; }
            &.muted { color: rgba(255,255,255,0.5); }

            & .se-key__num { font-size: 1.3rem; font-weight: 700; font-family: ${a("font-display")}; }
            & .se-key__lbl { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.75; margin-top: 1px; }
        }

        .se-pad__ext {
            position: absolute; inset: 0; z-index: 10;
            background: #1c1c1e; display: flex; flex-direction: column;
            padding: ${l("sm")} ${l("sm")} ${l("xl")};
            &.hidden { display: none; }

            & .se-pad__ext-row { flex: 1; display: flex; align-items: center; justify-content: center; gap: ${l("xl")}; }
            & .se-pad__ext-step {
                width: 60px; height: 60px; border-radius: 999px; border: none; cursor: pointer;
                background: #2a2a2a; color: #fff; font-size: 1.8rem; line-height: 1;
                &:active { background: #3a3a3a; }
            }
            & .se-pad__ext-val { width: 72px; text-align: center; font-family: ${a("font-display")}; font-weight: 700; font-size: 2.6rem; color: #fff; }
            & .se-pad__ext-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            & .se-pad__ext-cancel { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: #2a2a2a; color: #fff; font-weight: 600; font-family: inherit; }
            & .se-pad__ext-ok { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: ${a("primary")}; color: #fff; font-size: 1.3rem; }
        }

        .se-toast {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 60;
            background: ${a("primary")}; color: ${a("primary-text")};
            font-family: ${a("font-display")}; font-weight: 700;
            padding: ${l("md")} ${l("xl")}; border-radius: ${a("radius")};
            box-shadow: ${a("shadow-elevated")};
            &.hidden { display: none; }
        }
    `;svc=this.inject(le);holeIdx=this.svc.holeIdx;modalOpen=new h(!1);currentBallIdx=new h(0);extendedOpen=new h(!1);extendedScore=new h(10);statsOpen=new h(!1);pendingMeta=new h({});lastMetaKey=null;toastMsg=new h(null);dragOffset=new h(0);transitioning=new h(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new I(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[q(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(s=>[s.id,s]));return e.ballIds.map(s=>t.get(s)).filter(s=>!!s)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>Oe(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);toParValue=e=>{let t=0,s=0,r=!1;for(const n of this.playedOrder()){const i=this.svc.strokesFor(e.id,n.playHoleId);i!==null&&i>0&&(t+=i,s+=this.parFor(n.playHoleId),r=!0)}return r?t-s:null};toParText=e=>{const t=this.toParValue(e);return t===null?"–":t===0?"E":t>0?`+${t}`:`${t}`};toParClass=e=>{const t=this.toParValue(e);return`se-row__topar ${t===null||t===0?"even":t<0?"under":"over"}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const s=e-t;return s<=-4||s>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(s)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer)}),this.track(v(()=>{const n=this.ballsInGroup().length;n>0&&this.currentBallIdx.get()>=n&&this.currentBallIdx.set(0)}));const e=this.wire(At,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1)}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const n=this.currentHole();return n?`Hole ${this.occLabel(n.playHoleId)} · Par ${this.parFor(n.playHoleId)}`:""},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>this.statsOpen.set(!1)},statsHole:()=>{const n=this.currentHole();return n?`Hole ${this.occLabel(n.playHoleId)} · Par ${this.parFor(n.playHoleId)}`:""},statsTitle:()=>{const n=this.ballsInGroup()[this.currentBallIdx.get()];return n?this.ballName(n):""},statsScore:()=>{const n=this.ballsInGroup()[this.currentBallIdx.get()],i=this.currentHole();return!n||!i?"":this.displayScore(this.svc.strokesFor(n.id,i.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.advance()}}}),t=this.ref(e,"viewport"),s=this.ref(e,"track");this.bindCarouselPointer(t,s),this.track(v(()=>{s.style.transition=this.transitioning.get()?Ft:"none",s.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(s,new I(()=>Bt),(n,i,d)=>this.holeItem(n,d),n=>n),this.$each(this.ref(e,"rows"),new I(()=>{const n=this.playedOrder(),i=this.holeIndex(),d=n[i];if(!d)return[];const c=i>0?n[i-1].playHoleId:null;return this.ballsInGroup().map(u=>({ball:u,ph:d.playHoleId,prevPh:c}))}),(n,i,d)=>this.playerRow(n.ball,n.ph,n.prevPh,d),n=>`${n.ball.id}|${n.ph}`),this.$each(this.ref(e,"modalList"),new I(()=>this.ballsInGroup()),(n,i,d)=>this.modalRow(n,i,d),n=>n.id);const r=this.ref(e,"keys");for(const n of[1,2,3,4,5,6,7,8,9])r.appendChild(this.numberKey(n));return r.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),r.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),r.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(e,"statsBody"),new I(()=>this.metaInputs()),(n,i,d)=>this.metaChip(n,d),n=>n.key),this.track(v(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null;return}const n=this.ballsInGroup()[this.currentBallIdx.get()],i=this.currentHole();if(!n||!i)return;const d=`${n.id}|${i.playHoleId}`;if(d===this.lastMetaKey)return;this.lastMetaKey=d;const c={};for(const u of this.metaInputs())c[u.key]=this.svc.metadataFor(n.id,i.playHoleId,u.key)===!0;this.pendingMeta.set(c)})),e}holeItem(e,t){return this.wireEl(Dt,{item:{className:()=>{const s=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${s?" gone":""}`}},hnum:{textContent:()=>{const s=this.occAtOffset(e);return s?this.occLabel(s.playHoleId):""}},hpar:{textContent:()=>{const s=this.occAtOffset(e);return s?`Par ${this.parFor(s.playHoleId)}`:""}}},t)}playerRow(e,t,s,r){return this.wireEl(qt,{name:{textContent:this.ballName(e)},topar:{textContent:()=>this.toParText(e),className:()=>this.toParClass(e)},prev:{textContent:()=>s?this.displayScore(this.svc.strokesFor(e.id,s)):""},cval:{textContent:()=>this.displayScore(this.svc.strokesFor(e.id,t))},circle:{className:()=>this.svc.strokesFor(e.id,t)===null?"se-row__circle empty":"se-row__circle",onclick:()=>this.openModalForBall(e.id)}},r)}modalRow(e,t,s){const r=e.players.length>1?`Team · CH ${e.courseHandicap}`:`CH ${e.players[0]?.courseHandicap??e.courseHandicap}`;return this.wireEl(Gt,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.currentBallIdx.set(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:r},mval:{textContent:()=>{const n=this.currentHole();return n?this.displayScore(this.svc.strokesFor(e.id,n.playHoleId)):"–"}}},s)}numberKey(e){return this.wireEl(ke,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,s,r){return this.wireEl(ke,{key:{className:s,onclick:r},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(s=>s.id===e);this.currentBallIdx.set(t<0?0:t),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.modalOpen.set(!0)}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){const t=this.ballsInGroup(),s=this.currentHole(),r=t[this.currentBallIdx.get()];if(!s||!r)return;const n=e===null?void 0:this.metaSnapshot();this.svc.setScore(r.id,s.playHoleId,e,n),e!==null&&e>0&&this.metaInputs().length>0?this.statsOpen.set(!0):this.advance()}hasMoreUnscored=()=>{const e=this.ballsInGroup(),t=this.currentHole();if(!t)return!1;const s=this.currentBallIdx.get();return e.some((r,n)=>n!==s&&this.svc.strokesFor(r.id,t.playHoleId)===null)};metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),s={};for(const r of e)s[r.key]=t[r.key]===!0;return s}setMeta(e,t){const s=this.pendingMeta.get();this.pendingMeta.set({...s,[e]:t});const r=this.ballsInGroup()[this.currentBallIdx.get()],n=this.currentHole();if(!r||!n)return;const i=this.svc.strokesFor(r.id,n.playHoleId);i!==null&&this.svc.setScore(r.id,n.playHoleId,i,this.metaSnapshot())}metaChip(e,t){return this.wireEl(Kt,{glabel:{textContent:e.label},miss:{className:()=>this.pendingMeta.get()[e.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(e.key,!1)},hit:{className:()=>this.pendingMeta.get()[e.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(e.key,!0)}},t)}advance(){const e=this.ballsInGroup(),t=this.currentHole();if(!t)return;const s=c=>this.svc.strokesFor(e[c].id,t.playHoleId)!==null,r=this.currentBallIdx.get();for(let c=r+1;c<e.length;c++)if(!s(c))return this.currentBallIdx.set(c);for(let c=0;c<r;c++)if(!s(c))return this.currentBallIdx.set(c);const n=this.playedOrder();if(this.holeIndex()>=n.length-1){this.flash("Round complete"),this.modalOpen.set(!1);return}this.flash(`Hole ${this.occLabel(t.playHoleId)} done`);const d=t.playHoleId;this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===d&&(this.holeIdx.set(q(this.holeIndex()+1,this.playedOrder().length)),this.currentBallIdx.set(0))},700)}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*F),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(q(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",r=>{r.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",r=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:r.pointerId,startX:r.clientX,startY:r.clientY,lastX:r.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(r.pointerId))}),e.addEventListener("pointermove",r=>{const n=this.ptr;if(!n||n.id!==r.pointerId)return;const i=r.clientX-n.startX,d=r.clientY-n.startY;if(!n.horiz){if(Math.abs(d)>Math.abs(i)&&Math.abs(d)>8||Math.abs(i)<=8)return;n.horiz=!0}const c=Date.now(),u=Math.max(1,c-n.lastTime);n.velocity=(r.clientX-n.lastX)/u,n.lastX=r.clientX,n.lastTime=c,this.dragOffset.set(i)});const s=r=>{const n=this.ptr;if(!n||n.id!==r.pointerId)return;const i=r.clientX-n.startX,d=n.horiz;if(this.ptr=null,e.releasePointerCapture?.(r.pointerId),!d){this.dragOffset.set(0);return}this.snap(zt({dragDistance:i,velocity:n.velocity,itemWidth:F}))};e.addEventListener("pointerup",s),e.addEventListener("pointercancel",r=>{!this.ptr||this.ptr.id!==r.pointerId||(this.ptr=null,e.releasePointerCapture?.(r.pointerId),this.snap(0))})}}function b(o){return String(o).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Wt(o,e){const t=[...o].sort((n,i)=>n.canonicalOrdinal-i.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(n=>n.playHoleId))}];const s=[...e].sort((n,i)=>n.fromCanonicalOrdinal-i.fromCanonicalOrdinal),r=[];for(const n of s){const i=t.filter(d=>d.canonicalOrdinal>=n.fromCanonicalOrdinal&&d.canonicalOrdinal<=n.toCanonicalOrdinal);i.length!==0&&r.push({label:n.label,holes:i,playHoleIds:new Set(i.map(d=>d.playHoleId))})}return r}function Xt(o){return o.kind==="si"?"lb-c-si":o.kind==="given"?"lb-c-given":o.kind==="status"?"lb-c-status":o.kind==="category"?"lb-c-cat":""}function Qt(o){const e=[o.kind==="category"?"lb-r-cat":`lb-r-${o.kind}`];return(o.kind==="si"||o.kind==="given")&&e.push("lb-r-dim"),o.team&&e.push(`lb-team-${o.team}`),e.join(" ")}function Vt(o){return o&&o.marker?o.marker.template:null}function Yt(o){const e=o?.marker?.tone;return e==="success"||e==="warning"||e==="danger"?` lb-mark-tone--${e}`:""}function Jt(o,e){const t=o.cells.filter(s=>e.has(s.playHoleId));if(o.aggregate==="sum"){const s=t.map(r=>r.value).filter(r=>r!==null);return s.length===0?"—":String(s.reduce((r,n)=>r+n,0))}if(o.aggregate==="last"){for(let s=t.length-1;s>=0;s--){const r=t[s].value;if(r!==null)return Number.isInteger(r)?String(r):r.toFixed(1)}return"—"}return"—"}function Zt(o){return o.filter(e=>!(e.startsWith("slot #")||/^CH -?\d/.test(e)||/^PH -?\d/.test(e)))}function de(o,e,t,s){const r=Wt(o.holes,e),n=x=>{const Z=`<tr><th class="lb-rowlabel">Hole</th>${x.holes.map(E=>`<th>${b(E.occurrenceLabel)}</th>`).join("")}<th class="lb-sum">${b(x.label)}</th></tr>`,je=o.rows.map(E=>{const He=new Map(E.cells.map(L=>[L.playHoleId,L])),ue=L=>E.emphasis?`<strong>${L}</strong>`:L,Ne=x.holes.map(L=>{const N=He.get(L.playHoleId),Le=N?.title?` title="${b(N.title)}"`:"",ee=ue(b(N?.display??"")),he=Vt(N),Be=Yt(N),te=N?.marker?.label,Fe=te?` title="${b(te)}" aria-label="${b(te)}"`:"";let pe=he?`<span class="lb-mark lb-mark--${he}${Be}"${Fe}>${ee}</span>`:ee;return N?.team&&(pe=`<span class="lb-pill lb-pill--${N.team}">${ee}</span>`),`<td class="${Xt(E)}"${Le}>${pe}</td>`}).join(""),Me=`<td class="lb-sum">${ue(Jt(E,x.playHoleIds))}</td>`,Re=E.subjectBallId?b(t(E.subjectBallId))+(E.label?" "+b(E.label):""):b(E.label);return`<tr class="${Qt(E)}"><th class="lb-rowlabel">${Re}</th>${Ne}${Me}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${Z}</thead><tbody>${je}</tbody></table></div>`},i=r.map(x=>n(x)).join(""),d=o.title.groups.map(x=>x.map(Z=>b(t(Z))).join(" & ")).filter(Boolean).join(o.title.joiner),c=s.mode==="verification"?o.subtitleFacts:Zt(o.subtitleFacts),u=c.length?`<div class="lb-card__sub">${c.map(b).join(" · ")}</div>`:"",m=s.mode==="verification"&&o.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${o.footnotes.map(x=>`<span class="lb-card__note">${b(x)}</span>`).join("")}</div>`:"",p=s.mode==="verification"&&o.caption?`<p class="lb-card__caption">${b(o.caption)}</p>`:"",g=o.totals.length?`<ul class="lb-card__totals">${o.totals.map(x=>`<li>${b(x.label)} = <strong>${x.value??"—"}</strong></li>`).join("")}</ul>`:"",_=d?`<header class="lb-card__head"><h4>${d}</h4>${u}</header>`:u;return`<article class="${s.cardModifier?`lb-card ${s.cardModifier}`:"lb-card"}">
  ${_}
  ${i}
  ${m}${p}${g}
</article>`}function es(o,e,t,s){return de(o,e,t,s)}function ts(o,e,t,s){return de(o,e,t,{...s,cardModifier:"lb-card--compact-match"})}function ss(o,e,t,s){return de(o,e,t,{...s,cardModifier:"lb-card--category-matrix"})}function ns(o,e){const t=o.entries.map(s=>`<tr class="${s.position===1?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${s.position}</td>
  <td class="lb-rank__who">${b(s.ballIds.map(e).join(" & "))}</td>
  <td class="lb-rank__total">${s.total??"—"}</td>
  <td class="lb-rank__thru">${s.holesPlayed}</td>
</tr>`).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${b(o.metricLabel)}</h4>
  <table class="lb-rank">
    <colgroup>
      <col class="lb-rank__col-pos">
      <col class="lb-rank__col-who">
      <col class="lb-rank__col-total">
      <col class="lb-rank__col-thru">
    </colgroup>
    <thead><tr><th class="lb-rank__pos">#</th><th class="lb-rank__who">Player</th><th class="lb-rank__total">Total</th><th class="lb-rank__thru">Thru</th></tr></thead>
    <tbody>${t}</tbody>
  </table>
</div>`}function rs(o,e){const t=o.matches.map(s=>{const r=b(s.sideA.ballIds.map(e).join(" & ")),n=b(s.sideB.ballIds.map(e).join(" & ")),i=s.magnitude===0?"AS":`${s.magnitude} UP`,d=s.finished?"Final":`thru ${s.thru}`,c=s.leader==="a"?" lb-mp__team--lead":"",u=s.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${c}">${r}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${b(i)}</span><span class="lb-mp__status">${b(d)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${u}">${n}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${b(o.title)}</h4>${t}
</div>`}const os={ranked:ns,match_summary:rs},is={"default-score-grid":es,"compact-match-grid":ts,"category-matrix-grid":ss};function as(o){return o.componentId??"default-score-grid"}function ls(o){return`<div class="lb-diag">Unrenderable result section <code>${b(o)}</code> — no generic view yet. Results are not hidden.</div>`}function ds(o){return`<div class="lb-diag">Unsupported score-grid component <code>${b(o)}</code> — no generic view yet. Results are not hidden.</div>`}function cs(o,e){const t=os[o.kind];return t?t(o,e):ls(o.kind)}function us(o,e,t,s){const r=as(o),n=is[r];return n?n(o,e,t,s):ds(r)}function hs(o,e){return o.leaderboard.length===0&&o.cards.length===0?`<div class="lb-empty">No scores entered yet for ${b(o.formatLabel)}.</div>`:o.leaderboard.map(s=>cs(s,e)).join("")||`<div class="lb-empty">No leaderboard metric for ${b(o.formatLabel)}.</div>`}function ps(o,e,t,s={}){if(o.cards.length===0)return"";const r=s.mode??"product";return o.cards.map(n=>us(n,e,t,{mode:r})).join(`
`)}const ms=y(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class fs extends T{static styles=`
        .lb {
            padding: ${l("lg")} ${l("lg")} ${l("2xl")};

            & .lb__status {
                color: ${a("text-muted")};
                padding: ${l("xl")} 0;
                text-align: center;
                &.hidden { display: none; }
            }

            & .lb-empty {
                color: ${a("text-muted")};
                padding: ${l("xl")} 0;
                text-align: center;
            }
            & .lb-diag {
                ${z()}
                padding: ${l("md")} ${l("lg")};
                color: ${a("error")};
                font-size: 0.85rem;
                margin-bottom: ${l("md")};
                & code { font-family: ui-monospace, monospace; }
            }

            /* Ranked metric + match-summary sections. */
            & .lb-section { margin-bottom: ${l("xl")}; }
            & .lb-section__title {
                margin: 0 0 ${l("sm")};
                font-family: ${a("font-display")};
                font-weight: 600;
                font-size: 1rem;
                color: ${a("text")};
            }
            & .lb-rank {
                width: 100%;
                border-collapse: collapse;
                font-variant-numeric: tabular-nums;
                table-layout: fixed;
            }
            & .lb-rank__col-pos { width: 2.25rem; }
            & .lb-rank__col-total { width: 4.5rem; }
            & .lb-rank__col-thru { width: 3.25rem; }
            & .lb-rank th,
            & .lb-rank td {
                vertical-align: middle;
            }
            & .lb-rank thead th {
                height: 1.65rem;
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: ${a("text-muted")};
                font-weight: 700;
                line-height: 1;
                padding: 0 ${l("sm")};
                border-bottom: 1px solid ${a("border")};
            }
            & .lb-rank tbody td {
                height: 2.25rem;
                padding: 0 ${l("sm")};
                border-bottom: 1px solid ${a("border")};
                font-size: 0.95rem;
                line-height: 1.1;
            }
            & .lb-rank__pos { text-align: center; font-weight: 700; color: ${a("text-muted")}; }
            & .lb-rank__who {
                text-align: left;
                font-weight: 600;
                font-family: ${a("font-display")};
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            & .lb-rank__total { text-align: right; font-weight: 700; }
            & .lb-rank__thru { text-align: right; color: ${a("text-muted")}; }
            & .lb-rank__lead td { background: ${a("accent-soft")}; }
            & .lb-rank__lead .lb-rank__pos { color: ${a("accent")}; }

            /* Structured match panel: two team blocks + a centre standing. */
            & .lb-mp {
                display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch;
                border: 1px solid ${a("border")}; border-radius: 10px; overflow: hidden;
                margin-top: ${l("sm")};
            }
            & .lb-mp__team {
                padding: ${l("sm")} ${l("md")}; font-weight: 700; font-size: 0.9rem;
                display: flex; align-items: center;
            }
            & .lb-mp__team--a { color: #c2452f; }
            & .lb-mp__team--b { color: #2c6cae; justify-content: flex-end; text-align: right; }
            & .lb-mp__team--a.lb-mp__team--lead { background: #c2452f; color: #fff; }
            & .lb-mp__team--b.lb-mp__team--lead { background: #2c6cae; color: #fff; }
            & .lb-mp__center {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                padding: ${l("xs")} ${l("md")}; gap: 1px;
            }
            & .lb-mp__standing { font-size: 1.25rem; font-weight: 800; line-height: 1; }
            & .lb-mp__status { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.04em; color: ${a("text-muted")}; }

            /* Format-aware scorecard cards. */
            & .lb-cards__head {
                margin: ${l("xl")} 0 ${l("md")};
                font-family: ${a("font-display")};
                font-weight: 600;
                font-size: 1.1rem;
                color: ${a("text")};
            }
            & .lb-card {
                ${z()}
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
            }
            & .lb-card--compact-match {
                border-color: color-mix(in srgb, ${a("accent")} 28%, ${a("border")});
                padding-top: ${l("sm")};
            }
            & .lb-card--category-matrix .lb-grid {
                font-size: 0.72rem;
                table-layout: auto;
                width: max-content;
                min-width: 100%;
            }
            & .lb-card--category-matrix .lb-grid th,
            & .lb-card--category-matrix .lb-grid td {
                padding: 2px 1px;
            }
            & .lb-card--category-matrix .lb-grid .lb-rowlabel {
                width: 5.8em;
                min-width: 5.8em;
                text-overflow: clip;
            }
            & .lb-card--category-matrix .lb-grid .lb-sum {
                width: 2.8em;
                min-width: 2.8em;
            }
            & .lb-card--category-matrix .lb-grid .lb-r-cat td {
                line-height: 1.1;
            }
            & .lb-card--category-matrix .lb-grid .lb-r-cat th {
                max-width: none;
            }
            & .lb-card--category-matrix .lb-grid .lb-r-points td,
            & .lb-card--category-matrix .lb-grid .lb-r-running td {
                font-size: 0.68rem;
                min-width: 3.25em;
                text-overflow: clip;
            }
            & .lb-card__head { margin-bottom: ${l("sm")}; }
            & .lb-card__head h4 {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 600;
                font-size: 1rem;
                color: ${a("text")};
            }
            & .lb-card__sub { font-size: 0.75rem; color: ${a("text-muted")}; margin-top: 2px; }
            & .lb-card__scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            /* Stacked 9-hole blocks (front 9 / back 9) get a little breathing room. */
            & .lb-card__scroll + .lb-card__scroll { margin-top: ${l("sm")}; }
            & .lb-grid {
                border-collapse: collapse;
                font-variant-numeric: tabular-nums;
                font-size: 0.8rem;
                white-space: nowrap;
                /* Fixed layout → every hole column is the same width (content no
                   longer stretches a column), and front-9 / back-9 blocks align. */
                table-layout: fixed;
                width: 100%;
            }
            & .lb-grid th, & .lb-grid td {
                padding: 3px 2px;
                text-align: center;
                border-bottom: 1px solid ${a("border")};
                overflow: hidden;
                text-overflow: ellipsis;
            }
            & .lb-grid thead th {
                font-size: 0.7rem;
                color: ${a("text-muted")};
                font-weight: 700;
            }
            & .lb-grid .lb-rowlabel {
                text-align: left;
                width: 6em;
                position: sticky;
                left: 0;
                background: ${a("surface")};
                font-weight: 600;
                color: ${a("text")};
            }
            & .lb-grid .lb-sum { width: 2.4em; font-weight: 700; background: ${a("surface-sunken")}; }
            & .lb-grid .lb-r-dim td, & .lb-grid .lb-r-dim th { color: ${a("text-muted")}; }
            & .lb-grid .lb-c-si { color: ${a("text-muted")}; font-size: 0.7rem; }
            & .lb-grid .lb-r-cat th { font-weight: 400; color: ${a("text-muted")}; }
            & .lb-grid .lb-c-cat { text-align: center; color: ${a("accent")}; }
            /* Match-card team tints (the player rows + their deciding-ball marks). */
            & .lb-grid .lb-team-a, & .lb-grid .lb-team-a th { color: #c2452f; }
            & .lb-grid .lb-team-b, & .lb-grid .lb-team-b th { color: #2c6cae; }
            /* Standing pill — team-colour background, white text (high contrast). */
            & .lb-pill {
                display: inline-block; min-width: 1.4em; padding: 0.05em 0.45em;
                border-radius: 999px; color: #fff; font-weight: 700;
            }
            & .lb-pill--a { background: #c2452f; }
            & .lb-pill--b { background: #2c6cae; }
            /* Deciding-ball marker shapes (presentation vocabulary): ring (base
               ○), double_ring (◎), diamond (◇). The marker's label carries the
               golf meaning; these class names stay presentation-only. */
            & .lb-mark {
                display: inline-flex; align-items: center; justify-content: center;
                box-sizing: border-box; width: 1.7em; height: 1.7em; line-height: 1;
                /* Digits sit high in their line box, so nudge down to optically centre. */
                padding-top: 0.12em; vertical-align: middle;
                border: 2px solid currentColor; border-radius: 999px;
            }
            & .lb-mark--double_ring { border-width: 3px; border-style: double; }
            & .lb-mark--diamond { border: none; position: relative; }
            & .lb-mark--diamond::before {
                content: ''; position: absolute; left: 50%; top: 50%;
                width: 1.2em; height: 1.2em; transform: translate(-50%, -50%) rotate(45deg);
                border: 2px solid currentColor;
            }
            & .lb-mark--square {
                border-radius: 3px;
            }
            & .lb-mark--double_square {
                border-radius: 3px;
                border-width: 3px;
                border-style: double;
            }
            & .lb-mark--badge {
                width: auto;
                min-width: 1.8em;
                padding-left: 0.45em;
                padding-right: 0.45em;
                border-radius: 999px;
            }
            & .lb-mark--box_badge {
                width: auto;
                min-width: 1.8em;
                padding-left: 0.45em;
                padding-right: 0.45em;
                border-radius: 3px;
            }
            & .lb-mark-tone--success { color: #267348; }
            & .lb-mark-tone--warning { color: #946200; }
            & .lb-mark-tone--danger { color: #9b332a; }
            & .lb-card__caption { margin: ${l("sm")} 0 0; font-size: 0.72rem; font-style: italic; color: ${a("text-muted")}; }
            & .lb-card__notes { margin: ${l("sm")} 0 0; font-size: 0.72rem; color: ${a("text-muted")}; }
            & .lb-card__notes-label {
                display: block; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.04em; font-size: 0.68rem; margin-bottom: 2px;
            }
            & .lb-card__note { display: block; }
            & .lb-card__totals {
                list-style: none; margin: ${l("sm")} 0 0; padding: 0;
                display: flex; flex-wrap: wrap; gap: ${l("md")};
                font-size: 0.85rem; color: ${a("text")};
            }
        }
    `;svc=this.inject(le);slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots(),t=this.svc.selectedSlotDefId();return e.find(s=>s.slotDefId===t)??e[0]??null};render(){return this.wire(ms,{status:{className:()=>{const t=this.svc.resultLoading.get(),s=this.svc.result.get()===null;return t||s?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody()}})}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const s=d=>this.svc.nameOf(d),r=hs(t,s),n=ps(t,e.routeSections,s),i=n?`<h3 class="lb-cards__head">Scorecard</h3>${n}`:"";return r+i}}function gs(o){if(!(o===null||o===""))return/^\d+$/.test(o)?Number(o):o}const bs=y(`
    <div class="round-view">
        <div bind="main" class="round-view__main">
            <button bind="back" class="round-view__back" type="button">← Rounds</button>
            <div bind="notfound" class="round-view__notfound">That share link didn't lead to a round.</div>
            <div bind="body" class="round-view__body">
                <header class="round-view__head">
                    <h1 bind="course"></h1>
                    <span bind="status" class="round-view__status"></span>
                </header>
                <div class="round-view__meta">
                    <span bind="date"></span>
                    <span bind="route"></span>
                </div>
                <div class="round-view__formats" bind="formats"></div>

                <div bind="scorePanel" class="round-view__panel">
                    <div bind="scoring"></div>

                    <div class="round-view__share">
                        <span class="round-view__share-label">Share this round</span>
                        <div class="round-view__share-row">
                            <input bind="shareUrl" class="round-view__share-url" readonly />
                            <button bind="copy" class="round-view__copy" type="button">Copy</button>
                        </div>
                        <p class="round-view__share-hint">Anyone with this link can open and score — no sign-in.</p>
                    </div>
                </div>

                <div bind="lbPanel" class="round-view__panel hidden">
                    <div bind="leaderboard"></div>
                </div>
            </div>
        </div>

        <div bind="dock" class="round-view__dock hidden">
            <div bind="holebar" class="round-hole hidden">
                <button bind="holePrev" class="round-hole__nav" type="button" aria-label="Previous hole">‹</button>
                <div class="round-hole__stats">
                    <div class="round-hole__stat"><span class="round-hole__lbl">Par</span><span bind="holePar" class="round-hole__val"></span></div>
                    <div class="round-hole__stat"><span class="round-hole__lbl">Hole</span><span bind="holeNum" class="round-hole__val"></span></div>
                    <div class="round-hole__stat"><span class="round-hole__lbl">SI</span><span bind="holeSi" class="round-hole__val"></span></div>
                </div>
                <button bind="holeNext" class="round-hole__nav" type="button" aria-label="Next hole">›</button>
            </div>
            <div class="round-tabs">
                <button bind="tabScore" class="round-tabs__tab" type="button">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    <span>Score</span>
                </button>
                <button bind="tabBoard" class="round-tabs__tab" type="button">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M6 4h12v5a6 6 0 0 1-12 0Z"/><path d="M9 19h6M10 22h4M12 15v4"/></svg>
                    <span>Leaderboard</span>
                </button>
            </div>
        </div>
    </div>
`),ys=y('<button bind="pill" class="round-view__fmt" type="button"></button>');class _s extends T{static styles=`
        .round-view {
            height: 100%;
            display: flex;
            flex-direction: column;

            & .round-view__main {
                flex: 1;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                padding: ${l("lg")} ${l("lg")} ${l("2xl")};
            }

            & .round-view__back {
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 600;
                color: ${a("text-muted")};
                cursor: pointer;
                padding: ${l("xs")} 0;
                margin-bottom: ${l("md")};
            }

            & .round-view__notfound {
                color: ${a("text-muted")};
                padding: ${l("xl")} 0;

                &.hidden { display: none; }
            }

            & .round-view__body.hidden { display: none; }
            & .round-view__panel.hidden { display: none; }

            & .round-view__head {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                gap: ${l("md")};

                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 1.8rem;
                    letter-spacing: -0.02em;
                    color: ${a("text")};
                }
            }

            & .round-view__status {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                border-radius: ${a("radius-pill")};
                padding: 2px 10px;
                flex-shrink: 0;
                background: ${a("accent-soft")};
                color: ${a("accent")};
            }

            & .round-view__meta {
                display: flex;
                gap: ${l("md")};
                margin-top: ${l("xs")};
                color: ${a("text-muted")};
                font-size: 0.9rem;
            }

            & .round-view__formats {
                margin-top: ${l("lg")};
                display: flex;
                gap: ${l("sm")};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: ${l("xs")};
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }

                & .round-view__fmt {
                    flex: 0 0 auto;
                    border: 1px solid ${a("border")};
                    border-radius: ${a("radius-pill")};
                    background: ${a("btn-bg")};
                    color: ${a("text")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    padding: ${l("sm")} ${l("lg")};
                    cursor: pointer;
                    white-space: nowrap;
                    &.active { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                }
            }

            & .round-view__share {
                margin-top: ${l("2xl")};
                padding: ${l("lg")};
                ${z()}
                background: ${a("surface-sunken")};

                & .round-view__share-label {
                    font-weight: 700;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: ${a("text-muted")};
                }
                & .round-view__share-row {
                    display: flex;
                    gap: ${l("sm")};
                    margin-top: ${l("sm")};
                }
                & .round-view__share-url {
                    flex: 1;
                    ${M()}
                    font-size: 0.8rem;
                    color: ${a("text-muted")};
                }
                & .round-view__copy {
                    ${S()}
                    padding: 0 ${l("lg")};
                    font-weight: 700;
                    background: ${a("primary")};
                    color: ${a("primary-text")};
                    border: none;
                }
                & .round-view__share-hint {
                    margin: ${l("sm")} 0 0;
                    font-size: 0.8rem;
                    color: ${a("text-muted")};
                }
            }
        }

        /* --- Pinned bottom dock: orange hole bar + Score/Leaderboard tabs --- */
        .round-view__dock {
            flex: 0 0 auto;
            box-shadow: ${a("shadow-elevated")};
            &.hidden { display: none; }
        }

        .round-hole {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${l("md")};
            background: ${a("hole-bar")};
            color: ${a("hole-bar-text")};
            padding: ${l("sm")} ${l("lg")};

            &.hidden { display: none; }

            & .round-hole__nav {
                flex: 0 0 auto;
                width: 40px;
                height: 40px;
                border: none;
                border-radius: ${a("radius-pill")};
                background: rgba(0, 0, 0, 0.1);
                color: inherit;
                font-size: 1.5rem;
                line-height: 1;
                cursor: pointer;
                &:active { background: rgba(0, 0, 0, 0.2); }
                &:disabled { opacity: 0.35; cursor: default; }
            }

            & .round-hole__stats { display: flex; gap: ${l("2xl")}; }
            & .round-hole__stat { display: flex; flex-direction: column; align-items: center; }
            & .round-hole__lbl {
                font-size: 0.62rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                opacity: 0.8;
            }
            & .round-hole__val {
                font-family: ${a("font-display")};
                font-weight: 700;
                font-size: 1.4rem;
                font-variant-numeric: tabular-nums;
            }
        }

        .round-tabs {
            display: flex;
            background: ${a("topbar-bg")};
            padding-bottom: env(safe-area-inset-bottom);

            & .round-tabs__tab {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 3px;
                padding: ${l("sm")} 0 ${l("md")};
                background: none;
                border: none;
                cursor: pointer;
                font-family: inherit;
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: rgba(247, 244, 234, 0.55);

                & svg { width: 24px; height: 24px; }
                &.active { color: ${a("accent")}; }
            }
        }
    `;svc=this.inject(le);router=this.inject(j);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new h(this.initPos.tab);hasRound=new I(()=>this.svc.round.get()!==null);hasScoring=new I(()=>this.svc.balls.get().length>0);shareUrl=new I(()=>{const e=this.tokenQ.get();return e?`${location.origin}/round?token=${e}`:""});render(){this.track(v(()=>{const r=this.tokenQ.get();r&&this.svc.loadByToken(r,this.initPos).then(()=>{this.tab.get()==="leaderboard"&&this.svc.loadResult()})}));const e=()=>{this.svc.flushPending()};window.addEventListener("online",e),this.track(()=>window.removeEventListener("online",e)),this.track(v(()=>{const r=this.tab.get(),n=this.svc.selectedSlotDefId(),i=this.svc.holeIdx.get();if(!this.hasRound.get())return;const d={token:this.tokenQ.get()};r==="leaderboard"&&(d.tab="board");const c=this.svc.round.get()?.formatSlots[0]?.slotDefId??null;n&&n!==c&&(d.slot=n),i>0&&(d.hole=i+1),this.router.navigate(this.router.route.get(),{replace:!0,query:d})}));const t={not_started:"Not started",active:"Live",complete:"Done"},s=this.wire(bs,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},course:()=>this.svc.round.get()?.courseNameSnapshot??"Round",status:()=>{const r=this.svc.round.get()?.status??"not_started";return t[r]??r},date:()=>this.svc.round.get()?.date??"",route:()=>{const r=this.svc.round.get();return r?`${r.playHoles.length} holes`:""},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},dock:{className:()=>this.hasRound.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const r=this.svc.currentPlayedHole();return r?this.svc.occLabel(r.playHoleId):""},holeSi:()=>{const r=this.svc.currentPlayHole()?.baseStrokeIndex;return r!=null?String(r):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});return this.$each(this.ref(s,"formats"),new I(()=>this.svc.round.get()?.formatSlots??[]),(r,n,i)=>this.slotPill(r,n,i),r=>r.slotDefId),this.spawn(Ut,this.ref(s,"scoring")),this.spawn(fs,this.ref(s,"leaderboard")),s}readUrlPosition(){const e=new URLSearchParams(location.search),t=e.get("slot"),s=Number(e.get("hole"));return{tab:e.get("tab")==="board"?"leaderboard":"score",selectedSlot:gs(t),holeIdx:Number.isFinite(s)&&s>0?s-1:0}}slotPill(e,t,s){return this.wireEl(ys,{pill:{textContent:()=>ae(e),className:()=>this.tab.get()==="leaderboard"&&this.svc.selectedSlotDefId()===e.slotDefId?"round-view__fmt active":"round-view__fmt",onclick:()=>{this.svc.selectSlot(e.slotDefId),this.tab.get()!=="leaderboard"&&(this.tab.set("leaderboard"),this.svc.loadResult())}}},s)}}function A(o){return typeof o=="object"&&o!==null&&typeof o.get=="function"}const w=o=>`var(--${o})`,ce=class ce extends T{constructor(){super(...arguments),this.open=new h(!1),this.highlightIndex=new h(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const s=document.createElement("span");s.className="ui-select__trigger-label",this.triggerEl.appendChild(s);const r=document.createElement("span");r.className="ui-select__chevron",r.textContent="▾",r.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(r),this.triggerEl.addEventListener("click",i=>{i.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",i=>{this.handleTriggerKeydown(i)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.setAttribute("role","listbox"),this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",i=>{this.handleDropdownKeydown(i)}),e.appendChild(this.dropdownEl);const n=i=>{this.optionEls=[],this.dropdownEl.textContent="";for(let d=0;d<i.length;d++){const c=i[d],u=document.createElement("button");if(u.className="ui-select__option",u.setAttribute("type","button"),u.id=`ui-select-opt-${d}`,c.disabled){u.classList.add("ui-select__option--header"),u.disabled=!0,u.setAttribute("role","presentation"),u.setAttribute("aria-disabled","true");const g=document.createElement("span");g.className="ui-select__option-label",g.textContent=c.label,u.appendChild(g),this.dropdownEl.appendChild(u),this.optionEls.push(u);continue}if(u.setAttribute("role","option"),c.icon){const g=document.createElement("span");g.className="ui-select__option-icon",g.textContent=c.icon,u.appendChild(g)}const m=document.createElement("span");m.className="ui-select__option-label",m.textContent=c.label,u.appendChild(m);const p=document.createElement("span");p.className="ui-select__check",p.setAttribute("aria-hidden","true"),u.appendChild(p),u.addEventListener("click",g=>{g.stopPropagation(),this.selectOption(c.value)}),u.addEventListener("mouseenter",()=>{this.highlightIndex.set(d)}),this.dropdownEl.appendChild(u),this.optionEls.push(u)}};return A(this.props.options)?this.track(v(()=>{const i=A(this.props.options)?this.props.options.get():this.props.options;n(i)})):n(this.props.options),this.track(v(()=>{const i=this.props.value.get(),d=A(this.props.options)?this.props.options.get():this.props.options,c=d.find(u=>u.value===i);c?(s.textContent=c.icon?`${c.icon} ${c.label}`:c.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder")):(s.textContent=this.props.placeholder??"",this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!this.props.placeholder));for(let u=0;u<d.length;u++){const m=this.optionEls[u];if(!m)continue;const p=d[u].value===i;m.setAttribute("aria-selected",String(p)),m.classList.toggle("ui-select__option--selected",p);const g=m.querySelector(".ui-select__check");g&&(g.textContent=p?"✓":"")}})),this.track(v(()=>{const i=this.open.get();if(this.dropdownEl.classList.toggle("open",i),r.classList.toggle("ui-select__chevron--open",i),this.triggerEl.setAttribute("aria-expanded",String(i)),i?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),i){const d=A(this.props.options)?this.props.options.get():this.props.options,c=this.props.value.get(),u=d.findIndex(p=>p.value===c),m=d.findIndex(p=>!p.disabled);this.highlightIndex.set(u>=0?u:m)}})),this.track(v(()=>{const i=this.highlightIndex.get();for(let d=0;d<this.optionEls.length;d++)this.optionEls[d].classList.toggle("ui-select__option--highlighted",d===i);i>=0&&this.optionEls[i]&&(this.triggerEl.setAttribute("aria-activedescendant",`ui-select-opt-${i}`),this.optionEls[i].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(A(this.props.disabled)?this.track(v(()=>{const i=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",i),this.triggerEl.disabled=i})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}selectOption(e){W(()=>{this.props.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.toggle();break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":{e.preventDefault();const t=this.highlightIndex.get(),s=A(this.props.options)?this.props.options.get():this.props.options;t>=0&&t<s.length&&!s[t].disabled&&this.selectOption(s[t].value);break}case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=A(this.props.options)?this.props.options.get():this.props.options;if(t.length===0||!t.some(r=>!r.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};ce.styles=`
        .ui-select {
            position: relative;
            display: inline-block;
        }
        .ui-select__trigger {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 6px 10px;
            min-width: 160px;
            width: 100%;
            border: 1px solid ${w("border")};
            border-radius: ${w("radius")};
            background: ${w("input-bg")};
            color: ${w("text")};
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
        }
        .ui-select__trigger:focus-visible {
            outline: 2px solid ${w("primary")};
            outline-offset: 1px;
        }
        .ui-select__trigger--placeholder {
            color: ${w("text-muted")};
        }
        .ui-select__trigger--disabled {
            opacity: 0.5;
            pointer-events: none;
        }
        .ui-select__trigger-label {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
        }
        .ui-select__chevron {
            color: ${w("text-muted")};
            font-size: 0.85rem;
            transition: transform 0.15s;
            flex-shrink: 0;
        }
        .ui-select__chevron--open {
            transform: rotate(180deg);
        }
        .ui-select__dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 4px;
            min-width: 100%;
            background: ${w("surface")};
            border: 1px solid ${w("border")};
            border-radius: ${w("radius")};
            box-shadow: ${w("shadow-elevated")};
            padding: 4px 0;
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity 0.15s, transform 0.15s;
            overflow-y: auto;
            max-height: 240px;
        }
        .ui-select__dropdown.open {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
        }
        .ui-select__option {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            cursor: pointer;
            color: ${w("text")};
            font-size: 0.875rem;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            font-family: inherit;
        }
        .ui-select__option:focus-visible {
            outline: none;
        }
        .ui-select__option--highlighted {
            background: ${w("hover-bg")};
        }
        .ui-select__option--selected {
            color: ${w("primary")};
            font-weight: 600;
        }
        .ui-select__option--header {
            cursor: default;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${w("text-muted")};
            padding-top: 10px;
            padding-bottom: 4px;
        }
        .ui-select__option--header:hover {
            background: none;
        }
        .ui-select__option-icon {
            flex-shrink: 0;
        }
        .ui-select__option-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .ui-select__check {
            flex-shrink: 0;
            font-size: 0.75rem;
            color: ${w("primary")};
        }
    `;let oe=ce;function ze(o){return o.handicapIndex*(o.slope/113)+(o.courseRating-o.par)}function vs(o){return Math.round(ze(o))}const xs=["scramble","greensomes","foursomes","custom"],Q=2,se=10,ws="ABCDEFGH",$s={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class ks{loading=new h(!1);error=new h(null);courses=new h([]);tees=new h([]);courseId=new h("");preset=new h("full_18");startHole=new h(1);players=new h([]);teams=new h([]);formatSlots=new h([]);submitting=new h(!1);diagnostics=new h([]);submitError=new h(null);catalog=O.get(J);nextKey=1;nextSlotKey=1;nextTeamKey=1;reset(){this.courses.set([]),this.tees.set([]),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.formatSlots.set([]),this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1}async load(){this.catalog.load().then(()=>this.ensureDefaultSlot());const e=await C(this.loading,this.error,()=>k.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const s=await C(this.loading,this.error,()=>k.setup.teesByCourse({courseId:e}))??[];this.tees.set(s);const r=new Set(s.map(i=>i.id)),n=s[0]?.id??"";this.players.set(this.players.get().map(i=>({...i,teeId:r.has(i.teeId)?i.teeId:n}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}])}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e))}patchPlayer(e,t){this.players.set(this.players.get().map(s=>s.key===e?{...s,...t}:s))}ensureDefaultSlot(){if(this.formatSlots.get().length>0)return;const e=this.catalog.byId("stableford_individual")??this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",s={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{}};this.formatSlots.set([...this.formatSlots.get(),s])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(s=>s.key===e?{...s,...t}:s))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return ws[e]??`T${e+1}`}formations=xs;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{}}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,kind:t,memberTeams:t==="single_ball"?{}:s.memberTeams}:s)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,s){const r=this.teamByKey(e);if(!r||r.kind!=="multi_ball"||t===e)return;const n={...r.memberTeams};if(s){if(this.teamMemberCount(e)>=se)return;n[t]=!0}else delete n[t];this.teams.set(this.teams.get().map(i=>i.key===e?{...i,memberTeams:n}:i))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(s=>t.memberTeams[Number(s)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{const t=this.isSideFormat(e.formatId);let s=!1;const r={...e.subjectTeams};for(const n of this.teams.get())r[n.key]===!0&&n.kind==="multi_ball"!==t&&(delete r[n.key],s=!0);return s?{...e,subjectTeams:r}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const s={...t.memberTeams};return delete s[e],{...t,memberTeams:s}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const s={...t.subjectTeams};return delete s[e],{...t,subjectTeams:s}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.teams.get().findIndex(s=>s.key===e.key);return`Team ${this.teamLetter(Math.max(0,t))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,formation:t}:s))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,s){const r=this.teamByKey(e);if(!r)return;const n={...r.pctByPlayer};if(s){if(n[t]!==void 0||this.teamMemberCount(e)>=se)return;n[t]=n[t]??"100"}else delete n[t];this.teams.set(this.teams.get().map(i=>i.key===e?{...i,pctByPlayer:n}:i))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=se}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let s=0;for(const r of this.players.get()){const n=t.pctByPlayer[r.key];if(n===void 0)continue;const i=this.derivedCH(r);if(!i)return null;s+=this.parsePct(n)*i.ch/100}return Math.round(s)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<Q)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=Q;let s=t;for(const r of this.teams.get())e.memberTeams[r.key]===!0&&r.kind==="single_ball"&&Object.keys(r.pctByPlayer).length>=Q&&s++;return s>=Q}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,s){const r=this.teamByKey(e);!r||r.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(n=>n.key===e?{...n,pctByPlayer:{...n.pctByPlayer,[t]:s}}:n))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,s){const r=this.slotByKey(e);r&&this.patchFormatSlot(e,{subjectPlayers:{...r.subjectPlayers,[t]:s}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,s){const r=this.slotByKey(e);r&&this.patchFormatSlot(e,{subjectTeams:{...r.subjectTeams,[t]:s}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return $s[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,s)=>t-s);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1)}derivedCH(e){const t=Number.parseFloat(e.handicapIndex);if(!Number.isFinite(t))return null;const s=this.teeById(e.teeId);if(!s)return null;const r=s.ratings.find(i=>i.gender===e.gender);if(!r)return null;const n={handicapIndex:t,slope:r.slope,courseRating:r.courseRating,par:r.par};return{ch:vs(n),raw:ze(n),rating:r,teeName:s.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const s of this.formatSlots.get()){for(const r of e)s.subjectPlayers[r.key]!==!1&&t.add(r.key);for(const r of this.teams.get())if(s.subjectTeams[r.key]===!0)for(const n of e)r.pctByPlayer[n.key]!==void 0&&t.add(n.key)}return e.filter(s=>!t.has(s.key))}diagnosticsForFormat(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`formats[${e}]`))}generalDiagnostics(){return this.diagnostics.get().filter(e=>!e.path?.startsWith("producers[")&&!e.path?.startsWith("formats["))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const s=this.liveTeamKeySet(),r=[];for(const n of this.teams.get()){if(!s.has(n.key))continue;const i=e.filter(d=>n.pctByPlayer[d.key]!==void 0).map(d=>({producerDefId:t.get(d.key),allowancePct:this.parsePct(n.pctByPlayer[d.key])}));if(n.kind==="multi_ball")for(const d of this.teams.get())n.memberTeams[d.key]===!0&&d.key!==n.key&&d.kind==="single_ball"&&s.has(d.key)&&i.push({teamId:String(d.key)});r.push({id:String(n.key),label:this.teamLabel(n),formation:n.formation,kind:n.kind,members:i})}return r}buildFormats(e,t){const s=this.liveTeamKeySet();return this.formatSlots.get().map(r=>{const n=this.isSideFormat(r.formatId),i=[];if(!n)for(const d of e)r.subjectPlayers[d.key]!==!1&&i.push({kind:"player",producerDefId:t.get(d.key)});for(const d of this.teams.get())r.subjectTeams[d.key]===!0&&s.has(d.key)&&d.kind==="multi_ball"===n&&i.push({kind:"team",teamId:String(d.key)});return{formatId:r.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(r.allowancePct)},subjects:i}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),s=e.indexOf(t);return s<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(s),...e.slice(0,s)].map(n=>({courseHoleNumber:n})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];if(e.forEach((s,r)=>{s.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${r}].name`}),Number.isFinite(Number.parseFloat(s.handicapIndex))||t.push({code:"missing_index",message:"Handicap index required",path:`producers[${r}].handicapIndex`}),s.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${r}].teeId`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};this.submitting.set(!0);try{const s=[];for(let m=0;m<e.length;m++){const p=e[m],g=Number.parseFloat(p.handicapIndex),_=await k.guestPlayers.create({displayName:p.name.trim(),gender:p.gender,handicapIndex:g});s.push({producerDefId:`p${m+1}`,playerRef:{kind:"guest",id:_.id},handicapIndex:g,gender:p.gender,teeId:p.teeId})}const{roundType:r,route:n}=this.buildRoute(),i=new Map;e.forEach((m,p)=>i.set(m.key,`p${p+1}`));const d=this.buildTeams(e,i),c={courseId:this.courseId.get(),playedAt:new Date().toISOString().slice(0,10),roundType:r,...n?{route:n}:{},producers:s,...d.length>0?{teams:d}:{},formats:this.buildFormats(e,i)},u=await k.friendlyRounds.create({draft:c});return u.ok?{ok:!0,token:u.friendlyRound.shareToken}:(this.diagnostics.set(u.diagnostics),{ok:!1})}catch(s){return this.submitError.set(s instanceof G?s.message:"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}const Ss=["full_18","front_9","back_9"],Is=y(`
    <div class="setup">
        <button bind="back" class="setup__back" type="button">← Rounds</button>
        <header class="setup__head">
            <h1>New round</h1>
            <p>No sign-in required.</p>
        </header>

        <section class="setup__section">
            <h2>Course</h2>
            <div bind="course" class="setup__select"></div>
        </section>

        <section class="setup__section">
            <h2>Route</h2>
            <div bind="presets" class="setup__seg"></div>
            <label class="setup__startrow">
                <span>Start hole</span>
                <div bind="startHole" class="setup__startsel"></div>
            </label>
        </section>

        <section class="setup__section">
            <h2>Players</h2>
            <p class="setup__hint">Name, handicap index, gender and tee. The course handicap is derived from the tee.</p>
            <div bind="players" class="setup__players"></div>
            <button bind="addPlayer" class="setup__add" type="button">+ Add player</button>
        </section>

        <section class="setup__section">
            <h2>Teams</h2>
            <p class="setup__hint">Optional. Group players into a team ball with a handicap allowance per member.</p>
            <div bind="teams" class="setup__fslots"></div>
            <button bind="addTeam" class="setup__add" type="button">+ Create team</button>
        </section>

        <section class="setup__section">
            <h2>Formats</h2>
            <p class="setup__hint">Each format scores a set of balls — tick the players and teams it ranks.</p>
            <div bind="formats" class="setup__fslots"></div>
            <p bind="formatNote" class="setup__note"></p>
            <button bind="addFormat" class="setup__add" type="button">+ Add format</button>
        </section>

        <div bind="banner" class="setup__banner"></div>
        <button bind="create" class="setup__create" type="button">Create round</button>
    </div>
`),Ts=y(`
    <div class="player">
        <div class="player__top">
            <input bind="name" class="player__name" placeholder="Player name" />
            <button bind="remove" class="player__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <div class="player__fields">
            <input bind="index" class="player__index" inputmode="decimal" placeholder="HCP index" />
            <div bind="gender" class="player__gender"></div>
            <div bind="tee" class="player__tee"></div>
        </div>
        <div bind="ch" class="player__ch"></div>
        <div bind="err" class="player__err"></div>
    </div>
`),Es=y(`
    <div class="fslot">
        <div class="fslot__top">
            <div bind="format" class="fslot__format"></div>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <p bind="desc" class="fslot__desc"></p>

        <div class="fslot__group">
            <span class="fslot__label">Handicap allowance</span>
            <span class="mrow__pct"><input bind="allowance" inputmode="numeric" /><span>%</span></span>
            <span bind="allowanceHint" class="fslot__teammeta"></span>
        </div>

        <div class="fslot__group">
            <span class="fslot__label">Scores</span>
            <div bind="subjectRows" class="fslot__teamrows"></div>
        </div>

        <div bind="err" class="fslot__err"></div>
    </div>
`),Ps=y(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),Cs=y(`
    <div class="fslot">
        <div class="fslot__top">
            <span bind="teamName" class="fslot__teamname"></span>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <div class="fslot__group">
            <span class="fslot__label">Plays as</span>
            <div bind="kindSel" class="fslot__format"></div>
        </div>
        <div bind="compGroup" class="fslot__group">
            <span class="fslot__label">Composition</span>
            <div bind="formation" class="fslot__format"></div>
        </div>
        <div class="fslot__group">
            <span bind="membersLabel" class="fslot__label">Members</span>
            <div bind="memberRows" class="fslot__teamrows"></div>
            <p bind="teamMeta" class="fslot__teammeta"></p>
        </div>
    </div>
`),Se=y(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class Os extends T{static styles=`
        .setup {
            padding: ${l("lg")} ${l("lg")} ${l("2xl")};

            & .setup__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${a("text-muted")};
                cursor: pointer; padding: ${l("xs")} 0; margin-bottom: ${l("md")};
            }

            & .setup__head {
                margin-bottom: ${l("xl")};
                & h1 {
                    margin: 0; font-family: ${a("font-display")}; font-weight: 600;
                    font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${l("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
            }

            & .setup__section {
                margin-bottom: ${l("xl")};
                & h2 {
                    margin: 0 0 ${l("sm")}; font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .setup__hint { margin: 0 0 ${l("md")}; color: ${a("text-muted")}; font-size: 0.82rem; }

            & .setup__note {
                margin: ${l("sm")} 0 0; font-size: 0.82rem; color: ${a("text-muted")};
                &:empty { display: none; }
            }

            /* SelectComponent hosts: the framework styles the trigger, so the
               host just controls width/font. The wrapper fills the host (it is
               inline-block by default, which shrinks to the trigger's content),
               and the trigger's 160px min-width is relaxed so narrow controls
               (gender, team, start hole) fit instead of overflowing. */
            & .ui-select { display: block; width: 100%; }
            & .ui-select__trigger { min-width: 0; }

            & .setup__select { width: 100%; font-size: 1rem; }
            & .setup__startsel { width: 110px; font-size: 0.95rem; }

            & .setup__seg {
                display: flex; gap: ${l("sm")}; margin-bottom: ${l("md")};
                & button {
                    flex: 1; padding: ${l("md")} 0; ${S()}
                    font-family: inherit; font-weight: 700; font-size: 0.9rem;
                    &.on { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                }
            }

            & .setup__startrow {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${l("md")}; font-size: 0.9rem; color: ${a("text-muted")};
            }

            & .setup__players { display: flex; flex-direction: column; gap: ${l("md")}; }

            & .player {
                padding: ${l("md")}; ${z()}
                display: flex; flex-direction: column; gap: ${l("sm")};

                & .player__top { display: flex; gap: ${l("sm")}; align-items: center; }
                & .player__name { flex: 1; padding: ${l("md")}; font-size: 1rem; ${M()} }
                & .player__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${S()}
                    font-size: 1rem; color: ${a("text-muted")};
                }
                & .player__fields { display: flex; gap: ${l("sm")}; align-items: stretch; }
                & .player__index { flex: 1; min-width: 0; padding: ${l("md")}; font-size: 1rem; ${M()} }
                & .player__gender { width: 72px; flex-shrink: 0; font-size: 1rem; }
                & .player__tee { flex: 1; min-width: 0; font-size: 1rem; }

                & .player__ch {
                    font-size: 0.82rem; color: ${a("text-muted")}; font-variant-numeric: tabular-nums;
                    &:empty { display: none; }
                }
                & .player__err {
                    font-size: 0.82rem; color: ${a("error")};
                    &:empty { display: none; }
                }
            }

            & .setup__add {
                width: 100%; margin-top: ${l("md")}; padding: ${l("md")}; ${S()}
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }

            & .setup__banner {
                color: ${a("error")}; font-size: 0.875rem; margin-bottom: ${l("md")};
                white-space: pre-line;
                &:empty { display: none; }
            }

            & .setup__fslots { display: flex; flex-direction: column; gap: ${l("md")}; }

            & .fslot {
                padding: ${l("md")}; ${z()}
                display: flex; flex-direction: column; gap: ${l("sm")};

                & .fslot__top { display: flex; gap: ${l("sm")}; align-items: center; }
                & .fslot__teamname { flex: 1; min-width: 0; font-weight: 700; font-size: 0.95rem; }
                & .fslot__teammeta {
                    margin: ${l("xs")} 0 0; font-size: 0.78rem; color: ${a("text-muted")};
                    &:empty { display: none; }
                }
                & .fslot__format { flex: 1; min-width: 0; font-size: 1rem; }
                & .fslot__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${S()}
                    font-size: 1rem; color: ${a("text-muted")};
                }
                & .fslot__desc {
                    margin: 0; font-size: 0.8rem; color: ${a("text-muted")};
                    &:empty { display: none; }
                }

                & .fslot__group {
                    display: flex; flex-direction: column; gap: ${l("xs")};
                    &[hidden] { display: none; }
                }
                & .fslot__label {
                    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em;
                    text-transform: uppercase; color: ${a("text-muted")};
                }

                & .fslot__teamrows { display: flex; flex-direction: column; gap: ${l("xs")}; }
                & .trow {
                    display: flex; align-items: center; justify-content: space-between; gap: ${l("sm")};
                    & .trow__name { font-size: 0.9rem; }
                    & .trow__team { width: 96px; flex-shrink: 0; font-size: 0.95rem; }
                }

                & .irow {
                    display: flex; align-items: center; gap: ${l("sm")};
                    font-size: 0.9rem; cursor: pointer;
                    & .irow__chk { width: 18px; height: 18px; flex-shrink: 0; accent-color: ${a("primary")}; }
                }

                & .mrow {
                    display: flex; align-items: center; justify-content: space-between; gap: ${l("sm")};
                    & .mrow__pick { display: flex; align-items: center; gap: ${l("sm")}; font-size: 0.9rem; cursor: pointer; }
                    & .mrow__pct {
                        display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
                        font-size: 0.85rem; color: ${a("text-muted")};
                        &[hidden] { display: none; }
                        & input { width: 56px; padding: ${l("xs")} ${l("sm")}; ${M()} font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${l("xs")};
                    & button {
                        flex: 1; padding: ${l("sm")} 0; ${S()}
                        font-family: inherit; font-weight: 700; font-size: 0.82rem;
                        &.on { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                    }
                }
                & .fslot__flat {
                    display: flex; align-items: center; gap: ${l("xs")}; font-size: 0.9rem;
                    color: ${a("text-muted")};
                    &[hidden] { display: none; }
                    & .fslot__pct { width: 70px; padding: ${l("sm")}; font-size: 1rem; ${M()} }
                }
                & .fslot__bands {
                    display: flex; flex-direction: column; gap: ${l("xs")};
                    &[hidden] { display: none; }
                }
                & .fslot__bandrows { display: flex; flex-direction: column; gap: ${l("xs")}; }
                & .brow {
                    display: flex; align-items: center; gap: ${l("xs")};
                    font-size: 0.82rem; color: ${a("text-muted")};
                    & .brow__pct, & .brow__upto { width: 56px; padding: ${l("sm")}; font-size: 0.95rem; ${M()} }
                    & .brow__del { margin-left: auto; width: 30px; height: 30px; ${S()} font-size: 0.8rem; color: ${a("text-muted")}; }
                }
                & .fslot__addband {
                    align-self: flex-start; padding: ${l("xs")} ${l("sm")}; ${S()}
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                }

                & .fslot__err {
                    font-size: 0.82rem; color: ${a("error")};
                    &:empty { display: none; }
                }
            }

            & .setup__create {
                width: 100%; padding: ${l("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit; ${S()}
                background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                box-shadow: ${a("shadow-elevated")};
                &:hover { background: ${a("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;svc=this.inject(ks);router=this.inject(j);render(){this.svc.reset(),this.svc.load();const e=this.wire(Is,{back:{onclick:()=>this.router.navigate("/")},addPlayer:{onclick:()=>this.svc.addPlayer()},addTeam:{onclick:()=>this.svc.addTeam()},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const s=this.svc.playersInNoFormat();return s.length===0?"":`Heads up: ${s.map(n=>n.name.trim()||"A player").join(", ")} ${s.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.generalDiagnostics().map(r=>r.message),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?"Creating…":"Create round",onclick:async()=>{const s=await this.svc.submit();s.ok&&this.router.navigate("/round",{query:{token:s.token}})}}});this.$each(this.ref(e,"presets"),()=>Ss,(s,r,n)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(s),className:()=>this.svc.preset.get()===s?"on":"",onclick:()=>this.svc.setPreset(s)}},n),s=>s);const t=s=>this.track(s);return this.mountSelect(this.ref(e,"course"),t,{value:this.bound(t,()=>this.svc.courseId.get(),s=>{s&&s!==this.svc.courseId.get()&&this.svc.selectCourse(s)}),options:{get:()=>{const s=[];let r="";for(const n of this.svc.courses.get())n.clubName!==r&&(s.push({value:`__club:${n.clubName}`,label:n.clubName,disabled:!0}),r=n.clubName),s.push({value:n.id,label:n.name});return s}},placeholder:"Select a course"}),this.mountSelect(this.ref(e,"startHole"),t,{value:this.bound(t,()=>String(this.svc.startHole.get()),s=>this.svc.startHole.set(Number(s))),options:{get:()=>this.svc.startHoleOptions().map(s=>({value:String(s),label:String(s)}))}}),this.$each(this.ref(e,"players"),this.svc.players,(s,r,n)=>this.playerRow(s.key,n),s=>s.key),this.$each(this.ref(e,"teams"),this.svc.teams,(s,r,n)=>this.teamCard(s.key,n),s=>s.key),this.$each(this.ref(e,"formats"),this.svc.formatSlots,(s,r,n)=>this.formatCard(s.key,r,n),s=>s.key),e}mountSelect(e,t,s){const r=new oe(s);r.mount(e),t(()=>r.destroy())}bound(e,t,s){const r=new h(t());return e(v(()=>r.set(t()))),e(v(()=>{const n=r.get();queueMicrotask(()=>s(n))})),r}eachInto(e,t,s,r,n){const i=new Map,d=new Map;t(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),t(v(()=>{const c=s(),u=new Map;for(const[p,g]of c.entries()){const _=n(g,p);if(i.has(_))u.set(_,i.get(_));else{const H=[];u.set(_,r(g,p,x=>H.push(x))),d.set(_,H)}}for(const[p,g]of i)u.has(p)||(g.remove(),d.get(p)?.forEach(_=>_()),d.delete(p));let m=e.firstChild;for(const p of u.values())p===m?m=m.nextSibling:e.insertBefore(p,m);i.clear();for(const[p,g]of u)i.set(p,g)}))}formatCard(e,t,s){const r=()=>this.svc.slotByKey(e),n=()=>r()?.formatId??"",i=this.wireEl(Es,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(n())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:c=>this.svc.setSlotAllowance(e,c.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(n())?"applied to each side member’s ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.diagnosticsForFormat(t).map(c=>c.message).join(" · ")}},s);this.mountSelect(this.ref(i,"format"),s,{value:this.bound(s,()=>n(),c=>{c&&c!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,c)}),options:{get:()=>this.svc.catalog.descriptors.get().map(c=>({value:c.id,label:this.svc.catalog.labelOf(c)??c.label}))}});const d=()=>{const c=this.svc.isSideFormat(n()),u=[];c||u.push(...this.svc.players.get().map(m=>({kind:"player",subKey:m.key})));for(const m of this.svc.teams.get())m.kind==="multi_ball"===c&&u.push({kind:"team",subKey:m.key});return u};return this.eachInto(this.ref(i,"subjectRows"),s,d,(c,u,m)=>this.subjectRow(e,c.kind,c.subKey,m),c=>`${c.kind}${c.subKey}`),i}subjectRow(e,t,s,r){const n=()=>{if(t==="player")return this.svc.players.get().find(u=>u.key===s)?.name?.trim()||"Player";const c=this.svc.teamByKey(s);return c?`${this.svc.teamLabel(c)} (${c.kind==="multi_ball"?"side":"team"})`:"Team"},i=()=>t==="player"?this.svc.subjectPlayerIn(e,s):this.svc.subjectTeamIn(e,s),d=c=>t==="player"?this.svc.setSubjectPlayer(e,s,c):this.svc.setSubjectTeam(e,s,c);return this.wireEl(Ps,{chk:{checked:()=>i(),onchange:c=>d(c.target.checked)},name:{textContent:()=>n()}},r)}teamCard(e,t){const s=()=>this.svc.teamKindOf(e)==="multi_ball",r=this.wireEl(Cs,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const n=this.svc.teamByKey(e);return n?this.svc.teamLabel(n):"Team"}},compGroup:{hidden:()=>s()},membersLabel:{textContent:()=>s()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const n=this.svc.teamSize(e);if(n===0)return s()?"Tick at least 2 members — a side needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(n<2)return"Add one more member — a team needs at least 2.";if(s())return`${n} balls · a side (scored together by a side format)`;const i=this.svc.teamBallCh(e);return i===null?`${n} players`:`${n} players · plays off CH ${i}`}}},t);return this.mountSelect(this.ref(r,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),n=>this.svc.setTeamKind(e,n==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"One combined ball"},{value:"multi_ball",label:"Separate balls (a side)"}]}}),this.mountSelect(this.ref(r,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",n=>this.svc.setTeamFormation(e,n)),options:{get:()=>this.svc.formations.map(n=>({value:n,label:n[0].toUpperCase()+n.slice(1)}))}}),this.eachInto(this.ref(r,"memberRows"),t,()=>{const n=this.svc.players.get().map(i=>({kind:"player",mKey:i.key}));if(s())for(const i of this.svc.eligibleNestedTeams(e))n.push({kind:"team",mKey:i.key});return n},(n,i,d)=>n.kind==="player"?this.teamMemberRow(e,n.mKey,d):this.teamNestedRow(e,n.mKey,d),n=>`${n.kind}${n.mKey}`),r}teamNestedRow(e,t,s){const r=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(Se,{chk:{checked:()=>r(),disabled:()=>!r()&&this.svc.teamAtMaxSize(e),onchange:n=>this.svc.setTeamMemberTeam(e,t,n.target.checked)},name:{textContent:()=>{const n=this.svc.teamByKey(t);return n?`${this.svc.teamLabel(n)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},s)}teamMemberRow(e,t,s){const r=()=>this.svc.players.get().find(i=>i.key===t)??null,n=()=>this.svc.teamMemberIn(e,t);return this.wireEl(Se,{chk:{checked:()=>n(),disabled:()=>!n()&&this.svc.teamAtMaxSize(e),onchange:i=>this.svc.setTeamMember(e,t,i.target.checked)},name:{textContent:()=>r()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!n()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:i=>this.svc.setTeamPct(e,t,i.target.value)}},s)}playerRow(e,t){const s=()=>this.svc.players.get().find(i=>i.key===e)??null,r=()=>this.svc.players.get().findIndex(i=>i.key===e),n=this.wireEl(Ts,{name:{oninput:i=>this.svc.patchPlayer(e,{name:i.target.value})},index:{oninput:i=>this.svc.patchPlayer(e,{handicapIndex:i.target.value})},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const i=s();if(!i)return"";const d=this.svc.derivedCH(i);if(!d)return"";const c=d.rating;return`Course handicap ${d.ch}  ·  ${i.handicapIndex} × ${c.slope}/113 + (${c.courseRating} − ${c.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(r()).map(i=>i.message).join(" · ")}},t);return this.mountSelect(this.ref(n,"gender"),t,{value:this.bound(t,()=>s()?.gender??"M",i=>this.svc.patchPlayer(e,{gender:i})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]}}),this.mountSelect(this.ref(n,"tee"),t,{value:this.bound(t,()=>s()?.teeId??"",i=>this.svc.patchPlayer(e,{teeId:i})),options:{get:()=>this.svc.tees.get().map(i=>({value:i.id,label:i.name}))},placeholder:"Tee"}),n}}const zs=y(`
    <div class="login" bind="root">
        <div class="login__hero">
            <div class="login__flag">⛳</div>
            <h1>tapscore</h1>
            <p>Scores, settled on the green.</p>
        </div>
        <div class="error" bind="error"></div>
        <form bind="form" class="login__form">
            <input bind="username" type="text" placeholder="Username" autocomplete="username" autocapitalize="none" />
            <input bind="password" type="password" placeholder="Password" autocomplete="current-password" />
            <button type="submit" bind="submit">Sign in</button>
        </form>
    </div>
`);class js extends T{static styles=`
        .login {
            max-width: 340px;
            margin: 0 auto;
            padding: 18vh ${l("xl")} 0;

            &[inert] { opacity: 0.6; }

            & .login__hero {
                text-align: center;
                margin-bottom: ${l("2xl")};

                & .login__flag { font-size: 2.2rem; }

                & h1 {
                    margin: ${l("sm")} 0 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2.4rem;
                    letter-spacing: -0.02em;
                    color: ${a("text")};
                }

                & p {
                    margin: ${l("xs")} 0 0;
                    color: ${a("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .error {
                display: none;
                padding: ${l("sm")} ${l("md")};
                margin-bottom: ${l("md")};
                color: ${a("error")};
                font-size: 0.875rem;
                text-align: center;
            }
            & .error.show { display: block; }

            & .login__form {
                display: flex;
                flex-direction: column;
                gap: ${l("md")};

                & input {
                    padding: ${l("md")} ${l("lg")};
                    font-size: 1rem;
                    ${M()}
                }

                & button {
                    padding: ${l("md")} ${l("lg")};
                    font-size: 1rem;
                    font-weight: 700;
                    ${S()}
                    background: ${a("primary")};
                    color: ${a("primary-text")};
                    border: none;
                    &:hover { background: ${a("primary")}; }
                }
            }
        }
    `;auth=this.inject(ie);router=this.inject(j);username="";password="";render(){return this.wire(zs,{root:{inert:()=>this.auth.loading.get()},error:{className:()=>this.auth.error.get()?"error show":"error",textContent:()=>this.auth.error.get()?.message??""},form:{onsubmit:async e=>{e.preventDefault(),await this.auth.login(this.username,this.password)&&this.router.navigate("/rounds",!0)}},username:{oninput:e=>{this.username=e.target.value}},password:{oninput:e=>{this.password=e.target.value}},submit:{textContent:()=>this.auth.loading.get()?"Signing in…":"Sign in"}})}}class Hs{loading=new h(!1);error=new h(null);guests=new h([]);async load(){const e=await C(this.loading,this.error,()=>k.guestPlayers.list());e&&this.guests.set(e)}async create(e){const t=await C(this.loading,this.error,()=>k.guestPlayers.create(e));return t&&this.guests.update(s=>[...s,t]),t??null}}const Ns=y(`
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
`),Ms=y(`
    <div class="player-row">
        <span bind="initials" class="player-row__badge"></span>
        <span bind="name" class="player-row__name"></span>
        <span bind="hcp" class="player-row__hcp"></span>
    </div>
`);function Rs(o){return o.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0].toUpperCase()).join("")}class Ls extends T{static styles=`
        .players {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .players__head {
                margin-bottom: ${l("xl")};

                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p {
                    margin: ${l("xs")} 0 0;
                    color: ${a("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .players__list {
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
                margin-bottom: ${l("2xl")};
            }

            & .player-row {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                padding: ${l("md")} ${l("lg")};
                ${z()}

                & .player-row__badge {
                    display: grid;
                    place-items: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: ${a("primary")};
                    color: ${a("primary-text")};
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
                    color: ${a("accent")};
                    background: ${a("accent-soft")};
                    border-radius: ${a("radius-pill")};
                    padding: 2px 10px;
                    font-size: 0.85rem;
                }
            }

            & .players__form {
                display: flex;
                flex-direction: column;
                gap: ${l("md")};
                padding: ${l("lg")};
                ${z()}

                & h2 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 1.2rem;
                }

                & input {
                    padding: ${l("md")} ${l("lg")};
                    font-size: 1rem;
                    ${M()}
                }

                & .players__row {
                    display: flex;
                    gap: ${l("sm")};

                    & input { width: 90px; text-align: center; }
                }

                & .players__seg {
                    flex: 1;
                    display: flex;
                    border: 1px solid ${a("border")};
                    border-radius: ${a("radius")};
                    overflow: hidden;

                    & button {
                        flex: 1;
                        padding: ${l("md")} 0;
                        border: none;
                        background: ${a("btn-bg")};
                        color: ${a("text-muted")};
                        font-family: inherit;
                        font-size: 0.85rem;
                        font-weight: 600;
                        cursor: pointer;

                        &.on {
                            background: ${a("primary")};
                            color: ${a("primary-text")};
                        }
                    }
                }

                & button[type=submit] {
                    padding: ${l("md")} ${l("lg")};
                    font-size: 1rem;
                    font-weight: 700;
                    ${S()}
                    background: ${a("primary")};
                    color: ${a("primary-text")};
                    border: none;
                    &:hover { background: ${a("primary")}; }
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
        }
    `;svc=this.inject(Hs);name=new h("");gender=new h("M");hcp=new h("");render(){this.svc.load();const e=this.wire(Ns,{name:{value:()=>this.name.get(),oninput:t=>this.name.set(t.target.value)},hcp:{value:()=>this.hcp.get(),oninput:t=>this.hcp.set(t.target.value)},genderM:{className:()=>this.gender.get()==="M"?"on":"",onclick:()=>this.gender.set("M")},genderF:{className:()=>this.gender.get()==="F"?"on":"",onclick:()=>this.gender.set("F")},submit:{disabled:()=>this.name.get().trim()===""||this.svc.loading.get()},form:{onsubmit:async t=>{t.preventDefault();const s=this.hcp.get().trim().replace(",",".");await this.svc.create({displayName:this.name.get().trim(),gender:this.gender.get(),handicapIndex:s===""?null:Number(s)})&&(this.name.set(""),this.hcp.set(""))}}});return this.$each(this.ref(e,"list"),this.svc.guests,(t,s,r)=>this.wireEl(Ms,{initials:()=>Rs(t.displayName),name:()=>t.displayName,hcp:()=>t.handicapIndex===null?"–":t.handicapIndex.toFixed(1)},r),t=>t.id),e}}class Bs{loading=new h(!1);error=new h(null);rounds=new h([]);async load(){const e=await C(this.loading,this.error,()=>k.rounds.list());e&&this.rounds.set(e)}}const Fs=y(`
    <div class="rounds">
        <header class="rounds__head">
            <h1>Rounds</h1>
            <p bind="subtitle"></p>
        </header>
        <button bind="newBtn" class="rounds__new" type="button">
            <span class="rounds__new-plus">+</span> New round
        </button>
        <div bind="list" class="rounds__list"></div>
    </div>
`),As=y(`
    <button bind="row" type="button" class="round-row">
        <div class="round-row__top">
            <span bind="course" class="round-row__course"></span>
            <span bind="status" class="round-row__status"></span>
        </div>
        <div class="round-row__bottom">
            <span bind="date"></span>
            <span bind="formats" class="round-row__formats"></span>
        </div>
    </button>
`);class Ds extends T{static styles=`
        .rounds {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .rounds__head {
                margin-bottom: ${l("xl")};

                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p {
                    margin: ${l("xs")} 0 0;
                    color: ${a("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .rounds__new {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: ${l("sm")};
                padding: ${l("lg")};
                margin-bottom: ${l("xl")};
                font-size: 1.1rem;
                font-weight: 700;
                font-family: inherit;
                ${S()}
                background: ${a("primary")};
                color: ${a("primary-text")};
                border: none;
                box-shadow: ${a("shadow-elevated")};
                &:hover { background: ${a("primary")}; }

                & .rounds__new-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .rounds__list {
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
            }

            & .round-row {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                padding: ${l("md")} ${l("lg")};
                text-align: left;
                font-family: inherit;
                cursor: pointer;
                ${z({hover:!0})}

                & .round-row__top {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    gap: ${l("md")};
                }

                & .round-row__course {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${a("text")};
                }

                & .round-row__status {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    border-radius: ${a("radius-pill")};
                    padding: 2px 10px;
                    flex-shrink: 0;

                    &.s-active { background: ${a("accent-soft")}; color: ${a("accent")}; }
                    &.s-complete { background: ${a("surface-sunken")}; color: ${a("text-muted")}; }
                    &.s-not_started { background: ${a("surface-sunken")}; color: ${a("text-muted")}; }
                }

                & .round-row__bottom {
                    display: flex;
                    justify-content: space-between;
                    gap: ${l("md")};
                    color: ${a("text-muted")};
                    font-size: 0.85rem;
                }

                & .round-row__formats {
                    text-align: right;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
        }
    `;svc=this.inject(Bs);router=this.inject(j);render(){this.svc.load();const e=this.wire(Fs,{subtitle:()=>{const s=this.svc.rounds.get().length;return s===0?"No rounds yet — tee one up.":`${s} round${s===1?"":"s"} on the card.`},newBtn:{onclick:()=>this.router.navigate("/create")}}),t={not_started:"Not started",active:"Live",complete:"Done"};return this.$each(this.ref(e,"list"),this.svc.rounds,(s,r,n)=>this.wireEl(As,{row:{disabled:!0},course:()=>s.courseNameSnapshot??"Round",status:{textContent:()=>t[s.status]??s.status,className:()=>`round-row__status s-${s.status}`},date:()=>s.date,formats:()=>s.formatSlots.map(ae).join(" · ")},n),s=>s.id),e}}const qs=y(`
    <div class="app-shell">
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class Gs extends T{static styles=`
        .app-shell {
            display: grid;
            grid-template-rows: 1fr auto;
            height: 100vh;
            height: 100dvh;
            max-width: 560px;
            margin: 0 auto;
            background: ${a("bg")};

            & .app-shell__content {
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
        }
    `;router=this.inject(j);render(){const e=this.wire(qs,{});return this.spawn(ut,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":_e,"/round":_s,"/create":Os,"/login":js,"/rounds":Ds,"/players":Ls},_e),e}}O.get(Ve);const Ie=O.get(j),Te=O.get(ie);await Je(Gs,"#app",{hot:void 0,onInit:async()=>{await Te.load(),Te.currentUser.get()&&Ie.route.get()==="/login"&&Ie.navigate("/",!0)}});export{T as C,j as R,h as S,Ve as T,f as a,W as b,I as c,v as e,C as r,y as t};
