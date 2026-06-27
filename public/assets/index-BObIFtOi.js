(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function t(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=t(n);fetch(n.href,r)}})();const Ce="modulepreload",ze=function(o){return"/tapscore/"+o},le={},je=function(e,t,s){let n=Promise.resolve();if(t&&t.length>0){let c=function(u){return Promise.all(u.map(p=>Promise.resolve(p).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),d=i?.nonce||i?.getAttribute("nonce");n=c(t.map(u=>{if(u=ze(u),u in le)return;le[u]=!0;const p=u.endsWith(".css"),f=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${f}`))return;const g=document.createElement("link");if(g.rel=p?"stylesheet":Ce,p||(g.as="script"),g.crossOrigin="",g.href=u,d&&g.setAttribute("nonce",d),document.head.appendChild(g),p)return new Promise((y,j)=>{g.addEventListener("load",y),g.addEventListener("error",()=>j(new Error(`Unable to preload CSS for ${u}`)))})}))}function r(i){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=i,window.dispatchEvent(d),!d.defaultPrevented)throw i}return n.then(i=>{for(const d of i||[])d.status==="rejected"&&r(d.reason);return e().catch(r)})};class Oe{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])this.batching?this.pending.add(t):t.run()}runTracked(e,t){ve(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.run()}}}const B=new Oe;function ve(o){for(const e of o.deps)e.delete(o);o.deps.clear()}class h{constructor(e){this.subs=new Set,this.val=e}get(){return B.subscribe(this.subs),this.val}set(e){Object.is(this.val,e)||(this.val=e,B.notify(this.subs))}update(e){this.set(e(this.val))}}class ${constructor(e){this.subs=new Set,this.val=void 0;const t=this,s={run(){B.runTracked(s,()=>{const n=e();Object.is(t.val,n)||(t.val=n,B.notify(t.subs))})},deps:new Set};s.run()}get(){return B.subscribe(this.subs),this.val}}function v(o){const e={run(){B.runTracked(e,o)},deps:new Set};return e.run(),()=>ve(e)}function K(o){B.batch(o)}class Ne{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const O=new Ne,q="/tapscore/".replace(/\/+$/,"");function J(o){return q?o===q?"/":o.startsWith(q+"/")?o.slice(q.length):o:o}function He(o){return q+o}class z{constructor(){this.route=new h(J(location.pathname??"/")),this.search=new h(location.search??""),window.addEventListener("popstate",()=>K(()=>{this.route.set(J(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},n=e.indexOf("#"),r=n>=0?e.slice(n):"",i=n>=0?e.slice(0,n):e,d=i.indexOf("?"),c=d>=0?i.slice(0,d):i,u=d>=0?i.slice(d+1):"",p=s.query!==void 0?Re(s.query):u?"?"+u:"",f=He(c)+p+r;(s.replace?history.replaceState:history.pushState).call(history,null,"",f),K(()=>{this.route.set(c),this.search.set(p)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:n=>{n.preventDefault(),this.navigate(e)},className:()=>{const n=this.route.get();return n===s||n.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new $(()=>{const s=this.route.get().split("/"),n={};for(const[r,i]of t.entries())i.startsWith(":")&&(n[i.slice(1)]=s[r]??"");return n})}query(e){return new $(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new $(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function Re(o){const e=new URLSearchParams;for(const[s,n]of Object.entries(o))n==null||n===""||e.set(s,String(n));const t=e.toString();return t?"?"+t:""}function Le(o){return e=>o[e]}function Me(o,e){const t=(n,r,i)=>{const d=Object.entries(n).map(([c,u])=>`--${c}:${u}`).join(";");return`${r}{color-scheme:${i};${d}}`},s=document.createElement("style");return s.textContent=t(o,'[data-theme="light"]',"light")+t(e,'[data-theme="dark"]',"dark"),document.head.appendChild(s),n=>`var(--${n})`}const de="basics-js-theme";class Be{constructor(){this.dark=new h(!1);const e=localStorage.getItem(de),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),v(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(de,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function b(o){const e=document.createElement("template");return e.innerHTML=o,e}function Fe(o,e){let t;for(const s of Object.keys(e))o.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const ce=new Set;class E{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!ce.has(t)){ce.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return O.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const n=new e(s[0]);return n.mount(t),this.children.push(n),n}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0}wire(e,t,s){const n=s??(i=>this.track(i)),r=e.content.cloneNode(!0);for(const i of r.querySelectorAll("[bind]")){const d=t[i.getAttribute("bind")];if(d)if(typeof d=="function")n(v(()=>{const c=d();i instanceof HTMLInputElement||i instanceof HTMLTextAreaElement?i.value=String(c):i.textContent=String(c)}));else for(const[c,u]of Object.entries(d)){const p=c.includes("-");c.startsWith("on")&&typeof u=="function"?i.addEventListener(c.slice(2),u):typeof u=="function"?n(v(()=>{const f=u();p?i.setAttribute(c,String(f)):i[c]=f})):p?i.setAttribute(c,String(u)):i[c]=u}}return r}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const n=this.ref(t,e);return n?(typeof s=="string"?n.textContent=s:typeof s=="function"&&s.prototype instanceof E?this.spawn(s,n):typeof s=="function"&&s(n,{spawn:(r,i,...d)=>this.spawn(r,i,...d),track:r=>this.track(r)}),!0):!1}$each(e,t,s,n=(r,i)=>i){const r=typeof t=="function"?t:()=>t.get(),i=new Map,d=new Map;this.track(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),this.track(v(()=>{const c=r(),u=new Map;for(const[f,g]of c.entries()){const y=n(g,f);if(i.has(y))u.set(y,i.get(y));else{const j=[];u.set(y,s(g,f,S=>j.push(S))),d.set(y,j)}}for(const[f,g]of i)u.has(f)||(g.remove(),d.get(f)?.forEach(y=>y()),d.delete(f));let p=e.firstChild;for(const f of u.values())f===p?p=p.nextSibling:e.insertBefore(f,p);i.clear();for(const[f,g]of u)i.set(f,g)}))}$condition(e,t,s,n){let r=null;this.track(v(()=>{r&&(r.remove(),r=null),r=t.get()?s():n?.()??null,r&&e.appendChild(r)}))}$swap(e,t,s,n){let r=null;this.track(v(()=>{r&&(r.destroy(),r=null),e.textContent="";const i=t.get(),d=s[i]??Fe(i,s)??n;d&&(r=new d,r.mount(e))})),this.track(()=>r?.destroy())}}async function Ae(o,e,t){const s=document.querySelector(e);s.textContent="";const n=O.get(z);let r=null,i=!1,d=null,c=!!t?.hot?.data.hmr;const u=async p=>{r&&(r.destroy(),r=null,s.textContent=""),p?(d||(d=(await je(()=>import("./obs-shell.component-QSNfyx8v.js"),[])).ObsShellComponent),r=new d):(!c&&t?.onInit&&(await t.onInit(),c=!0),r=new o),r.mount(s),i=p};await u(J(location.pathname).startsWith("/_obs")),v(()=>{const p=n.route.get().startsWith("/_obs");p!==i&&u(p)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>r?.destroy()),t.hot.accept())}class D extends Error{constructor(e,t,s,n){super(t),this.status=e,this.details=s,this.traceId=n,this.name="ApiError"}}const De=10,Q=[];let X=[],G=null;function qe(o){Q.push(o),Q.length>De&&Q.shift()}function Ge(o,e,t){const s={code:o,message:e,url:typeof location<"u"?location.href:"",context:[...Q],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),X.push(s),Ke()}function Ke(){G||(G=setTimeout(we,5e3))}function we(){if(G&&(clearTimeout(G),G=null),X.length===0)return;const o=X;X=[];for(const e of o){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon("/api/_obs/errors",new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch("/api/_obs/errors",{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&we()});const We=3e4,Ue=2,W=new Map,xe=new WeakMap;function Qe(o){if(o instanceof D)return o.traceId;if(o!=null&&typeof o=="object")return xe.get(o)}async function m(o){if(o.method==="GET"){const e=W.get(o.url);if(e)return e;const t=ue(o,Ue);return W.set(o.url,t),t.then(()=>W.delete(o.url),()=>W.delete(o.url)),t}return ue(o,0)}async function ue(o,e){const t=o.timeout??We;let s;for(let n=0;n<=e;n++){const r=crypto.randomUUID();try{return await Ve(Xe(o,r),t)}catch(i){if(s=i,!(i instanceof D)&&i!=null&&typeof i=="object"&&xe.set(i,r),i instanceof D||n===e)break;await new Promise(d=>setTimeout(d,1e3*2**n))}}throw s}async function Xe(o,e){const t={"X-Trace-Id":e},s={method:o.method,headers:t};o.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(o.body));const n=await fetch(o.url,s),r=n.headers.get("x-trace-id")??e;if(qe({type:"api",detail:`${o.method} ${o.url}`,timestamp:new Date().toISOString()}),!n.ok){const i=await n.json().catch(()=>({error:n.statusText}));throw new D(n.status,i.error??n.statusText,i.details,r)}return n.json()}function Ve(o,e){let t;const s=new Promise((n,r)=>{t=setTimeout(()=>r(new Error("Request timeout")),e)});return Promise.race([o,s]).finally(()=>clearTimeout(t))}async function x(o,e,t){K(()=>{o.set(!0),e.set(null)});try{const s=await t();return o.set(!1),s}catch(s){const n=Ye(s);K(()=>{o.set(!1),e.set(n)}),Ge(n.code,n.message,Qe(s));return}}function Ye(o){return o instanceof D?o.status===401?{code:"auth",message:"Unauthorized"}:o.status===409?{code:"conflict",message:"Data has changed — please try again"}:o.status===400?{code:"validation",message:o.message}:{code:"server",message:"Server error"}:o instanceof Error?o.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}function Ze(o){return{me:()=>m({method:"GET",url:`${o}/auth/me`}),login:e=>m({method:"POST",url:`${o}/auth/login`,body:e}),logout:()=>m({method:"POST",url:`${o}/auth/logout`,body:{}})}}class se{constructor(){this.api=Ze("/api"),this.currentUser=new h(null),this.loading=new h(!1),this.error=new h(null)}async load(){const e=await x(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await x(this.loading,this.error,()=>this.api.login({username:e,password:t}));return s?(this.currentUser.set(s),!0):!1}async logout(){await x(this.loading,this.error,()=>this.api.logout());const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const he={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},a=Me({...he,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},{...he,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"}),T=o=>`var(--${o})`,l=Le({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem"}),k=(o=T("radius"))=>`
    border: 1px solid ${T("border")};
    border-radius: ${o};
    background: ${T("btn-bg")};
    color: ${T("text")};
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: ${T("btn-hover")}; }
`,N=()=>`
    border: 1px solid ${T("border")};
    border-radius: ${T("radius")};
    background: ${T("input-bg")};
    color: ${T("text")};
    font-family: inherit;
    &::placeholder { color: ${T("text-muted")}; }
`,C=o=>`
    background: ${T("surface")};
    border: 1px solid ${T("border")};
    border-radius: ${T("radius")};
    box-shadow: ${T("shadow")};
    ${o?.hover?`
    transition: box-shadow 0.2s, border-color 0.2s;
    &:hover { box-shadow: ${T("shadow-elevated")}; }`:""}
`,Je=b(`
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
`);class et extends E{static styles=`
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
    `;router=this.inject(z);auth=this.inject(se);render(){return this.wire(Je,{root:{className:()=>this.auth.currentUser.get()&&this.router.route.get()!=="/login"?"tabbar":"tabbar hidden"},roundsLink:this.router.link("/rounds"),playersLink:this.router.link("/players")})}}function tt(o){return{async me(){return m({method:"GET",url:`${o}/players/me`})}}}function st(o){return{async list(){return m({method:"GET",url:`${o}/clubs`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/clubs/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/clubs`,body:e})},async update(e){return m({method:"POST",url:`${o}/clubs/update`,body:e})},async remove(e){return m({method:"DELETE",url:`${o}/clubs/${e.id}`})}}}function nt(o){return{async list(){return m({method:"GET",url:`${o}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/courses/by-club${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/courses/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/courses`,body:e})},async update(e){return m({method:"POST",url:`${o}/courses/update`,body:e})},async updateHole(e){return m({method:"POST",url:`${o}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/courses/validate${s?"?"+s:""}`})},async remove(e){return m({method:"DELETE",url:`${o}/courses/${e.id}`})}}}function rt(o){return{async listByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/tees/by-course${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/tees/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/tees`,body:e})},async update(e){return m({method:"POST",url:`${o}/tees/update`,body:e})},async remove(e){return m({method:"DELETE",url:`${o}/tees/${e.id}`})}}}function ot(o){return{async list(){return m({method:"GET",url:`${o}/guest-players`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/guest-players/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/guest-players`,body:e})}}}function it(o){return{async latest(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/handicap/latest${s?"?"+s:""}`})},async history(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/handicap/history${s?"?"+s:""}`})},async record(e){return m({method:"POST",url:`${o}/handicap/record`,body:e})}}}function at(o){return{async list(){return m({method:"GET",url:`${o}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/rounds/balls${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/rounds/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/rounds`,body:e})},async createFromDraft(e){return m({method:"POST",url:`${o}/rounds/from-draft`,body:e})},async update(e){return m({method:"POST",url:`${o}/rounds/update`,body:e})},async remove(e){return m({method:"DELETE",url:`${o}/rounds/${e.id}`})}}}function lt(o){return{async listByRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/participants/by-round${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/participants/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/participants`,body:e})},async addPlayer(e){return m({method:"POST",url:`${o}/participants/add-player`,body:e})},async addGuest(e){return m({method:"POST",url:`${o}/participants/add-guest`,body:e})},async listFor(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/participants/players${s?"?"+s:""}`})},async remove(e){return m({method:"DELETE",url:`${o}/participants/${e.id}`})}}}function dt(o){return{async listByRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/score-events/by-round${s?"?"+s:""}`})},async append(e){return m({method:"POST",url:`${o}/score-events`,body:e})}}}function ct(o){return{async forBall(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/scorecards/for-ball${s?"?"+s:""}`})},async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/scorecards/for-round${s?"?"+s:""}`})}}}function ut(o){return{async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/leaderboards/for-round${s?"?"+s:""}`})}}}function ht(o){return{async list(){return m({method:"GET",url:`${o}/friendly-rounds`})},async create(e){return m({method:"POST",url:`${o}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/friendly-rounds/by-token${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/friendly-rounds/get${s?"?"+s:""}`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/friendly-rounds/balls${s?"?"+s:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/friendly-rounds/scorecard${s?"?"+s:""}`})},async result(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/friendly-rounds/result${s?"?"+s:""}`})},async score(e){return m({method:"POST",url:`${o}/friendly-rounds/score`,body:e})}}}function pt(o){return{async courses(){return m({method:"GET",url:`${o}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/setup/tees/by-course${s?"?"+s:""}`})},async formats(){return m({method:"GET",url:`${o}/setup/formats`})}}}const P="/tapscore/".replace(/\/+$/,"")+"/api",w={players:tt(P),clubs:st(P),courses:nt(P),tees:rt(P),guestPlayers:ot(P),handicap:it(P),rounds:at(P),participants:lt(P),scoreEvents:dt(P),scorecards:ct(P),leaderboards:ut(P),friendlyRounds:ht(P),setup:pt(P)};class mt{loading=new h(!1);error=new h(null);rounds=new h([]);async load(){const e=await x(this.loading,this.error,()=>w.friendlyRounds.list());e&&this.rounds.set(e)}}class V{loading=new h(!1);error=new h(null);descriptors=new h([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await x(this.loading,this.error,()=>w.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:s.teamSize?.min??2,max:s.teamSize?.max??2},...s.teamCount?{teamCount:s.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}}function ne(o){const e=O.get(V);return e.load(),e.byId(o.formatId)?.label??`${o.scoringMode} · ${o.teamShape}`}const ft=b(`
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
`),gt=b(`
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
`),bt={not_started:"Not started",active:"Live",complete:"Done"};class pe extends E{static styles=`
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
                ${k()}
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
                ${C({hover:!0})}

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
    `;svc=this.inject(mt);router=this.inject(z);render(){this.svc.load();const e=this.wire(ft,{createBtn:{onclick:()=>this.router.navigate("/create")},signin:{onclick:()=>this.router.navigate("/login")},count:()=>{const t=this.svc.rounds.get().length;return t===0?"":`${t} on the card`},empty:{className:()=>this.svc.rounds.get().length===0?"landing__empty":"landing__empty hidden"}});return this.$each(this.ref(e,"list"),this.svc.rounds,(t,s,n)=>this.wireEl(gt,{row:{onclick:()=>this.router.navigate("/round",{query:{token:t.friendlyRound.shareToken}})},course:()=>t.round.courseNameSnapshot??"Round",status:{textContent:()=>bt[t.round.status]??t.round.status,className:()=>`round-row__status s-${t.round.status}`},date:()=>t.round.date,formats:()=>t.round.formatSlots.map(ne).join(" · ")},n),t=>t.friendlyRound.id),e}}const yt=180,me=4,_t=12;function A(o,e){return e<=0?0:Math.max(0,Math.min(e-1,o))}function vt(o){const{dragDistance:e,velocity:t,itemWidth:s}=o;if(Math.abs(e)<_t)return 0;const n=e+t*yt,r=Math.round(-n/s);return Math.max(-me,Math.min(me,r))}const wt=["1st","2nd","3rd","4th","5th","6th","7th","8th"],F=(o,e)=>`${o}|${e}`;function $e(o){return o.players.map(e=>e.displayName).join(" & ")||o.label||"Ball"}function xt(o,e,t){return o?!(o.minPar!==void 0&&e<o.minPar||o.maxPar!==void 0&&e>o.maxPar||o.pars&&!o.pars.includes(e)||o.holes&&!o.holes.includes(t)):!0}class re{loading=new h(!1);error=new h(null);friendlyRound=new h(null);round=new h(null);balls=new h([]);scorecards=new h([]);cells=new h(new Map);result=new h(null);resultLoading=new h(!1);resultError=new h(null);holeIdx=new h(0);groupIdx=new h(0);selectedSlot=new h(0);token=null;async loadByToken(e){const t=e!==this.token;this.token=e,O.get(V).load();const s=await x(this.loading,this.error,()=>w.friendlyRounds.byToken({token:e}));if(!s)return;this.friendlyRound.set(s.friendlyRound),this.round.set(s.round);const[n,r]=await Promise.all([w.friendlyRounds.balls({token:e}).catch(()=>[]),w.friendlyRounds.scorecard({token:e}).catch(()=>[])]);this.cells.set(new Map),this.scorecards.set(r),this.balls.set(n),t&&(this.holeIdx.set(0),this.groupIdx.set(0),this.selectedSlot.set(0),this.result.set(null))}async loadResult(){if(!this.token)return;const e=await x(this.resultLoading,this.resultError,()=>w.friendlyRounds.result({token:this.token}));e&&this.result.set(e)}ballNameById=new $(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,$e(t));return e});nameOf(e){return this.ballNameById.get().get(e)??e}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return A(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),s=t?.playHoles.find(i=>i.id===e);if(!t||!s)return"";const n=t.playHoles.filter(i=>i.courseHoleNumber===s.courseHoleNumber).sort((i,d)=>i.ordinal-d.ordinal);if(n.length===1)return`${s.courseHoleNumber}`;const r=n.findIndex(i=>i.id===e);return`${s.courseHoleNumber} (${wt[r]??`${r+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(A(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(A(this.holeIndex()+1,this.playedOrder().length))}strokesFor(e,t){const s=this.cells.get().get(F(e,t));return s?s.strokes:this.scorecards.get().find(i=>i.ballId===e)?.holes.find(i=>i.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(F(e,t))?.status??null}metadataFor(e,t,s){const n=this.cells.get().get(F(e,t));return n&&n.metadata!==void 0?n.metadata?.[s]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[s]}metadataInputs(){const e=O.get(V),t=this.round.get()?.formatSlots??[],s=[],n=new Set;for(const r of t){const i=e.byId(r.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of i)n.has(d.key)||(n.add(d.key),s.push(d))}return s}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>xt(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,s,n){const r=F(e,t),i=crypto.randomUUID();this.patchCell(r,{strokes:s,metadata:n,status:"saving",clientEventId:i}),await this.post(e,t,s,n,i)}async retry(e,t){const s=F(e,t),n=this.cells.get().get(s);n&&(this.patchCell(s,{...n,status:"saving"}),await this.post(e,t,n.strokes,n.metadata,n.clientEventId))}async post(e,t,s,n,r){if(!this.token)return;const i=F(e,t);try{await w.friendlyRounds.score({token:this.token,ballId:e,playHoleId:t,strokes:s,eventType:s===null?"score_cleared":"score_entered",clientEventId:r,...n!=null?{metadata:n}:{}});const d=this.cells.get().get(i);d&&d.clientEventId===r&&this.patchCell(i,{...d,status:"saved"})}catch{const d=this.cells.get().get(i);d&&d.clientEventId===r&&this.patchCell(i,{...d,status:"error"})}}patchCell(e,t){const s=new Map(this.cells.get());s.set(e,t),this.cells.set(s)}}const L=60,fe=8,ee=4,$t=Array.from({length:ee*2+1},(o,e)=>e-ee),kt="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",St=b(`
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
                <div bind="metaRow" class="se-meta hidden"></div>
                <div bind="keys" class="se-pad__grid"></div>
                <button bind="metaDone" class="se-done hidden" type="button">Done ›</button>
            </div>
        </div>

        <div bind="toast" class="se-toast hidden"></div>
    </div>
`),It=b(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),Tt=b(`
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
`),Et=b(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),ge=b(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),Pt=b('<button bind="chip" class="se-chip" type="button"></button>');class Ct extends E{static styles=`
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
            right: ${fe}px;
            width: ${L*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-ee*L}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${L}px;
            width: ${L}px;
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

            & .se-row__scores { display: flex; align-items: center; padding-right: ${fe}px; flex-shrink: 0; }
            & .se-row__slot { width: ${L}px; display: flex; align-items: center; justify-content: center; }
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
        .se-meta {
            display: flex; gap: ${l("sm")}; flex-wrap: wrap;
            padding: 0 2px ${l("sm")};
            &.hidden { display: none; }

            & .se-chip {
                border: 1px solid rgba(255, 255, 255, 0.25);
                border-radius: 999px;
                background: transparent;
                color: rgba(255, 255, 255, 0.82);
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 700;
                padding: 8px 16px;
                cursor: pointer;
                &:active { background: rgba(255, 255, 255, 0.08); }
                &.on { background: ${a("primary")}; border-color: ${a("primary")}; color: #fff; }
            }
        }
        .se-pad__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .se-done {
            margin-top: 6px;
            width: 100%;
            height: 52px;
            border: none;
            border-radius: 10px;
            background: ${a("primary")};
            color: #fff;
            font-family: ${a("font-display")};
            font-weight: 700;
            font-size: 1.05rem;
            cursor: pointer;
            &:active { filter: brightness(1.1); }
            &.hidden { display: none; }
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
    `;svc=this.inject(re);holeIdx=this.svc.holeIdx;modalOpen=new h(!1);currentBallIdx=new h(0);extendedOpen=new h(!1);extendedScore=new h(10);pendingMeta=new h({});lastMetaKey=null;toastMsg=new h(null);dragOffset=new h(0);transitioning=new h(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new $(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[A(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(s=>[s.id,s]));return e.ballIds.map(s=>t.get(s)).filter(s=>!!s)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>$e(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);toParValue=e=>{let t=0,s=0,n=!1;for(const r of this.playedOrder()){const i=this.svc.strokesFor(e.id,r.playHoleId);i!==null&&i>0&&(t+=i,s+=this.parFor(r.playHoleId),n=!0)}return n?t-s:null};toParText=e=>{const t=this.toParValue(e);return t===null?"–":t===0?"E":t>0?`+${t}`:`${t}`};toParClass=e=>{const t=this.toParValue(e);return`se-row__topar ${t===null||t===0?"even":t<0?"under":"over"}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const s=e-t;return s<=-4||s>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(s)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer)}),this.track(v(()=>{const i=this.ballsInGroup().length;i>0&&this.currentBallIdx.get()>=i&&this.currentBallIdx.set(0)}));const e=this.wire(St,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>this.modalOpen.set(!1)},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const i=this.currentHole();return i?`Hole ${this.occLabel(i.playHoleId)} · Par ${this.parFor(i.playHoleId)}`:""},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},metaDone:{className:()=>this.metaInputs().length>0?"se-done":"se-done hidden",onclick:()=>this.advance()}}),t=this.ref(e,"viewport"),s=this.ref(e,"track");this.bindCarouselPointer(t,s),this.track(v(()=>{s.style.transition=this.transitioning.get()?kt:"none",s.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(s,new $(()=>$t),(i,d,c)=>this.holeItem(i,c),i=>i),this.$each(this.ref(e,"rows"),new $(()=>{const i=this.playedOrder(),d=this.holeIndex(),c=i[d];if(!c)return[];const u=d>0?i[d-1].playHoleId:null;return this.ballsInGroup().map(p=>({ball:p,ph:c.playHoleId,prevPh:u}))}),(i,d,c)=>this.playerRow(i.ball,i.ph,i.prevPh,c),i=>`${i.ball.id}|${i.ph}`),this.$each(this.ref(e,"modalList"),new $(()=>this.ballsInGroup()),(i,d,c)=>this.modalRow(i,d,c),i=>i.id);const n=this.ref(e,"keys");for(const i of[1,2,3,4,5,6,7,8,9])n.appendChild(this.numberKey(i));n.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),n.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),n.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0)));const r=this.ref(e,"metaRow");return this.track(v(()=>{r.className=this.metaInputs().length>0?"se-meta":"se-meta hidden"})),this.$each(r,new $(()=>this.metaInputs()),(i,d,c)=>this.metaChip(i,c),i=>i.key),this.track(v(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null;return}const i=this.ballsInGroup()[this.currentBallIdx.get()],d=this.currentHole();if(!i||!d)return;const c=`${i.id}|${d.playHoleId}`;if(c===this.lastMetaKey)return;this.lastMetaKey=c;const u={};for(const p of this.metaInputs())u[p.key]=this.svc.metadataFor(i.id,d.playHoleId,p.key)===!0;this.pendingMeta.set(u)})),e}holeItem(e,t){return this.wireEl(It,{item:{className:()=>{const s=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${s?" gone":""}`}},hnum:{textContent:()=>{const s=this.occAtOffset(e);return s?this.occLabel(s.playHoleId):""}},hpar:{textContent:()=>{const s=this.occAtOffset(e);return s?`Par ${this.parFor(s.playHoleId)}`:""}}},t)}playerRow(e,t,s,n){return this.wireEl(Tt,{name:{textContent:this.ballName(e)},topar:{textContent:()=>this.toParText(e),className:()=>this.toParClass(e)},prev:{textContent:()=>s?this.displayScore(this.svc.strokesFor(e.id,s)):""},cval:{textContent:()=>this.displayScore(this.svc.strokesFor(e.id,t))},circle:{className:()=>this.svc.strokesFor(e.id,t)===null?"se-row__circle empty":"se-row__circle",onclick:()=>this.openModalForBall(e.id)}},n)}modalRow(e,t,s){const n=e.players.length>1?`Team · CH ${e.courseHandicap}`:`CH ${e.players[0]?.courseHandicap??e.courseHandicap}`;return this.wireEl(Et,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.currentBallIdx.set(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:n},mval:{textContent:()=>{const r=this.currentHole();return r?this.displayScore(this.svc.strokesFor(e.id,r.playHoleId)):"–"}}},s)}numberKey(e){return this.wireEl(ge,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,s,n){return this.wireEl(ge,{key:{className:s,onclick:n},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(s=>s.id===e);this.currentBallIdx.set(t<0?0:t),this.extendedOpen.set(!1),this.modalOpen.set(!0)}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){const t=this.ballsInGroup(),s=this.currentHole(),n=t[this.currentBallIdx.get()];if(!s||!n)return;const r=e===null?void 0:this.metaSnapshot();this.svc.setScore(n.id,s.playHoleId,e,r),this.metaInputs().length===0&&this.advance()}metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),s={};for(const n of e)s[n.key]=t[n.key]===!0;return s}toggleMeta(e){const t=this.pendingMeta.get();this.pendingMeta.set({...t,[e]:t[e]!==!0});const s=this.ballsInGroup()[this.currentBallIdx.get()],n=this.currentHole();if(!s||!n)return;const r=this.svc.strokesFor(s.id,n.playHoleId);r!==null&&this.svc.setScore(s.id,n.playHoleId,r,this.metaSnapshot())}metaChip(e,t){return this.wireEl(Pt,{chip:{textContent:e.label,className:()=>this.pendingMeta.get()[e.key]?"se-chip on":"se-chip",onclick:()=>this.toggleMeta(e.key)}},t)}advance(){const e=this.ballsInGroup(),t=this.currentHole();if(!t)return;const s=c=>this.svc.strokesFor(e[c].id,t.playHoleId)!==null,n=this.currentBallIdx.get();for(let c=n+1;c<e.length;c++)if(!s(c))return this.currentBallIdx.set(c);for(let c=0;c<n;c++)if(!s(c))return this.currentBallIdx.set(c);const r=this.playedOrder();if(this.holeIndex()>=r.length-1){this.flash("Round complete"),this.modalOpen.set(!1);return}this.flash(`Hole ${this.occLabel(t.playHoleId)} done`);const d=t.playHoleId;this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===d&&(this.holeIdx.set(A(this.holeIndex()+1,this.playedOrder().length)),this.currentBallIdx.set(0))},700)}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*L),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(A(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",n=>{n.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",n=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:n.pointerId,startX:n.clientX,startY:n.clientY,lastX:n.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(n.pointerId))}),e.addEventListener("pointermove",n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const i=n.clientX-r.startX,d=n.clientY-r.startY;if(!r.horiz){if(Math.abs(d)>Math.abs(i)&&Math.abs(d)>8||Math.abs(i)<=8)return;r.horiz=!0}const c=Date.now(),u=Math.max(1,c-r.lastTime);r.velocity=(n.clientX-r.lastX)/u,r.lastX=n.clientX,r.lastTime=c,this.dragOffset.set(i)});const s=n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const i=n.clientX-r.startX,d=r.horiz;if(this.ptr=null,e.releasePointerCapture?.(n.pointerId),!d){this.dragOffset.set(0);return}this.snap(vt({dragDistance:i,velocity:r.velocity,itemWidth:L}))};e.addEventListener("pointerup",s),e.addEventListener("pointercancel",n=>{!this.ptr||this.ptr.id!==n.pointerId||(this.ptr=null,e.releasePointerCapture?.(n.pointerId),this.snap(0))})}}function _(o){return String(o).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function zt(o,e){const t=[...o].sort((r,i)=>r.canonicalOrdinal-i.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(r=>r.playHoleId))}];const s=[...e].sort((r,i)=>r.fromCanonicalOrdinal-i.fromCanonicalOrdinal),n=[];for(const r of s){const i=t.filter(d=>d.canonicalOrdinal>=r.fromCanonicalOrdinal&&d.canonicalOrdinal<=r.toCanonicalOrdinal);i.length!==0&&n.push({label:r.label,holes:i,playHoleIds:new Set(i.map(d=>d.playHoleId))})}return n}function jt(o){return o.kind==="si"?"lb-c-si":o.kind==="given"?"lb-c-given":o.kind==="status"?"lb-c-status":o.kind==="category"?"lb-c-cat":""}function Ot(o){const e=o.team?` lb-team-${o.team}`:"";return o.kind==="category"?"lb-r-cat"+e:o.kind==="si"||o.kind==="given"?"lb-r-dim"+e:e.trim()}function Nt(o,e){const t=o.cells.filter(s=>e.has(s.playHoleId));if(o.aggregate==="sum"){const s=t.map(n=>n.value).filter(n=>n!==null);return s.length===0?"—":String(s.reduce((n,r)=>n+r,0))}if(o.aggregate==="last"){for(let s=t.length-1;s>=0;s--){const n=t[s].value;if(n!==null)return Number.isInteger(n)?String(n):n.toFixed(1)}return"—"}return"—"}function Ht(o,e,t){const s=zt(o.holes,e),n=g=>{const y=`<tr><th class="lb-rowlabel">Hole</th>${g.holes.map(S=>`<th>${_(S.occurrenceLabel)}</th>`).join("")}<th class="lb-sum">${_(g.label)}</th></tr>`,j=o.rows.map(S=>{const Se=new Map(S.cells.map(H=>[H.playHoleId,H])),ie=H=>S.emphasis?`<strong>${H}</strong>`:H,Ie=g.holes.map(H=>{const R=Se.get(H.playHoleId),Pe=R?.title?` title="${_(R.title)}"`:"",Y=ie(_(R?.display??""));let ae=R?.mark?`<span class="lb-mark lb-mark--${R.mark}">${Y}</span>`:Y;return R?.team&&(ae=`<span class="lb-pill lb-pill--${R.team}">${Y}</span>`),`<td class="${jt(S)}"${Pe}>${ae}</td>`}).join(""),Te=`<td class="lb-sum">${ie(Nt(S,g.playHoleIds))}</td>`,Ee=S.subjectBallId?_(t(S.subjectBallId))+(S.label?" "+_(S.label):""):_(S.label);return`<tr class="${Ot(S)}"><th class="lb-rowlabel">${Ee}</th>${Ie}${Te}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${y}</thead><tbody>${j}</tbody></table></div>`},r=s.map(g=>n(g)).join(""),i=o.title.groups.map(g=>g.map(y=>_(t(y))).join(" & ")).filter(Boolean).join(o.title.joiner),d=o.subtitleFacts.length?`<div class="lb-card__sub">${o.subtitleFacts.map(_).join(" · ")}</div>`:"",c=o.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${o.footnotes.map(g=>`<span class="lb-card__note">${_(g)}</span>`).join("")}</div>`:"",u=o.caption?`<p class="lb-card__caption">${_(o.caption)}</p>`:"",p=o.totals.length?`<ul class="lb-card__totals">${o.totals.map(g=>`<li>${_(g.label)} = <strong>${g.value??"—"}</strong></li>`).join("")}</ul>`:"";return`<article class="lb-card">
  ${i?`<header class="lb-card__head"><h4>${i}</h4>${d}</header>`:d}
  ${r}
  ${c}${u}${p}
</article>`}function Rt(o,e){const t=o.entries.map(s=>`<tr class="${s.position===1?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${s.position}</td>
  <td class="lb-rank__who">${_(s.ballIds.map(e).join(" & "))}</td>
  <td class="lb-rank__total">${s.total??"—"}</td>
  <td class="lb-rank__thru">${s.holesPlayed}</td>
</tr>`).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${_(o.metricLabel)}</h4>
  <table class="lb-rank">
    <thead><tr><th>#</th><th>Player</th><th>Total</th><th>Thru</th></tr></thead>
    <tbody>${t}</tbody>
  </table>
</div>`}function Lt(o,e){const t=o.matches.map(s=>{const n=_(s.sideA.ballIds.map(e).join(" & ")),r=_(s.sideB.ballIds.map(e).join(" & ")),i=s.magnitude===0?"AS":`${s.magnitude} UP`,d=s.finished?"Final":`thru ${s.thru}`,c=s.leader==="a"?" lb-mp__team--lead":"",u=s.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${c}">${n}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${_(i)}</span><span class="lb-mp__status">${_(d)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${u}">${r}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${_(o.title)}</h4>${t}
</div>`}function Mt(o){return`<div class="lb-diag">Unrenderable result section <code>${_(o)}</code> — no generic view yet. Results are not hidden.</div>`}function Bt(o,e){return o.leaderboard.length===0&&o.cards.length===0?`<div class="lb-empty">No scores entered yet for ${_(o.formatLabel)}.</div>`:o.leaderboard.map(s=>s.kind==="ranked"?Rt(s,e):s.kind==="match_summary"?Lt(s,e):Mt(s.kind)).join("")||`<div class="lb-empty">No leaderboard metric for ${_(o.formatLabel)}.</div>`}function Ft(o,e,t){return o.cards.length===0?"":o.cards.map(s=>Ht(s,e,t)).join(`
`)}const At=b(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class Dt extends E{static styles=`
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
                ${C()}
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
            }
            & .lb-rank thead th {
                text-align: left;
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: ${a("text-muted")};
                font-weight: 700;
                padding: ${l("xs")} ${l("sm")};
                border-bottom: 1px solid ${a("border")};
            }
            & .lb-rank tbody td {
                padding: ${l("sm")};
                border-bottom: 1px solid ${a("border")};
                font-size: 0.95rem;
            }
            & .lb-rank__pos { width: 2rem; font-weight: 700; color: ${a("text-muted")}; }
            & .lb-rank__who { font-weight: 600; font-family: ${a("font-display")}; }
            & .lb-rank__total { text-align: right; font-weight: 700; }
            & .lb-rank__thru { text-align: right; width: 3rem; color: ${a("text-muted")}; }
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
                ${C()}
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
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
            /* Deciding-ball shapes: ○ win, ◎ +2 (double ring), ◇ +5 (diamond). */
            & .lb-mark {
                display: inline-flex; align-items: center; justify-content: center;
                box-sizing: border-box; width: 1.7em; height: 1.7em; line-height: 1;
                /* Digits sit high in their line box, so nudge down to optically centre. */
                padding-top: 0.12em; vertical-align: middle;
                border: 2px solid currentColor; border-radius: 999px;
            }
            & .lb-mark--win2 { border-width: 3px; border-style: double; }
            & .lb-mark--win5 { border: none; position: relative; }
            & .lb-mark--win5::before {
                content: ''; position: absolute; left: 50%; top: 50%;
                width: 1.2em; height: 1.2em; transform: translate(-50%, -50%) rotate(45deg);
                border: 2px solid currentColor;
            }
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
    `;svc=this.inject(re);slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots();return e[this.svc.selectedSlot.get()]??e[0]??null};render(){return this.wire(At,{status:{className:()=>{const t=this.svc.resultLoading.get(),s=this.svc.result.get()===null;return t||s?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody()}})}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const s=d=>this.svc.nameOf(d),n=Bt(t,s),r=Ft(t,e.routeSections,s),i=r?`<h3 class="lb-cards__head">Scorecard</h3>${r}`:"";return n+i}}const qt=b(`
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
`),Gt=b('<button bind="pill" class="round-view__fmt" type="button"></button>');class Kt extends E{static styles=`
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
                ${C()}
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
                    ${N()}
                    font-size: 0.8rem;
                    color: ${a("text-muted")};
                }
                & .round-view__copy {
                    ${k()}
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
    `;svc=this.inject(re);router=this.inject(z);tokenQ=this.router.query("token");tab=new h("score");hasRound=new $(()=>this.svc.round.get()!==null);hasScoring=new $(()=>this.svc.balls.get().length>0);shareUrl=new $(()=>{const e=this.tokenQ.get();return e?`${location.origin}/round?token=${e}`:""});render(){this.track(v(()=>{const s=this.tokenQ.get();s&&this.svc.loadByToken(s)}));const e={not_started:"Not started",active:"Live",complete:"Done"},t=this.wire(qt,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},course:()=>this.svc.round.get()?.courseNameSnapshot??"Round",status:()=>{const s=this.svc.round.get()?.status??"not_started";return e[s]??s},date:()=>this.svc.round.get()?.date??"",route:()=>{const s=this.svc.round.get();return s?`${s.playHoles.length} holes`:""},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},dock:{className:()=>this.hasRound.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const s=this.svc.currentPlayedHole();return s?this.svc.occLabel(s.playHoleId):""},holeSi:()=>{const s=this.svc.currentPlayHole()?.baseStrokeIndex;return s!=null?String(s):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});return this.$each(this.ref(t,"formats"),new $(()=>this.svc.round.get()?.formatSlots??[]),(s,n,r)=>this.slotPill(s,n,r),s=>s.slotDefId),this.spawn(Ct,this.ref(t,"scoring")),this.spawn(Dt,this.ref(t,"leaderboard")),t}slotPill(e,t,s){return this.wireEl(Gt,{pill:{textContent:()=>ne(e),className:()=>this.tab.get()==="leaderboard"&&this.svc.selectedSlot.get()===t?"round-view__fmt active":"round-view__fmt",onclick:()=>{this.svc.selectedSlot.set(t),this.tab.get()!=="leaderboard"&&(this.tab.set("leaderboard"),this.svc.loadResult())}}},s)}}function M(o){return typeof o=="object"&&o!==null&&typeof o.get=="function"}const I=o=>`var(--${o})`,oe=class oe extends E{constructor(){super(...arguments),this.open=new h(!1),this.highlightIndex=new h(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const s=document.createElement("span");s.className="ui-select__trigger-label",this.triggerEl.appendChild(s);const n=document.createElement("span");n.className="ui-select__chevron",n.textContent="▾",n.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(n),this.triggerEl.addEventListener("click",i=>{i.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",i=>{this.handleTriggerKeydown(i)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.setAttribute("role","listbox"),this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",i=>{this.handleDropdownKeydown(i)}),e.appendChild(this.dropdownEl);const r=i=>{this.optionEls=[],this.dropdownEl.textContent="";for(let d=0;d<i.length;d++){const c=i[d],u=document.createElement("button");if(u.className="ui-select__option",u.setAttribute("type","button"),u.id=`ui-select-opt-${d}`,c.disabled){u.classList.add("ui-select__option--header"),u.disabled=!0,u.setAttribute("role","presentation"),u.setAttribute("aria-disabled","true");const g=document.createElement("span");g.className="ui-select__option-label",g.textContent=c.label,u.appendChild(g),this.dropdownEl.appendChild(u),this.optionEls.push(u);continue}if(u.setAttribute("role","option"),c.icon){const g=document.createElement("span");g.className="ui-select__option-icon",g.textContent=c.icon,u.appendChild(g)}const p=document.createElement("span");p.className="ui-select__option-label",p.textContent=c.label,u.appendChild(p);const f=document.createElement("span");f.className="ui-select__check",f.setAttribute("aria-hidden","true"),u.appendChild(f),u.addEventListener("click",g=>{g.stopPropagation(),this.selectOption(c.value)}),u.addEventListener("mouseenter",()=>{this.highlightIndex.set(d)}),this.dropdownEl.appendChild(u),this.optionEls.push(u)}};return M(this.props.options)?this.track(v(()=>{const i=M(this.props.options)?this.props.options.get():this.props.options;r(i)})):r(this.props.options),this.track(v(()=>{const i=this.props.value.get(),d=M(this.props.options)?this.props.options.get():this.props.options,c=d.find(u=>u.value===i);c?(s.textContent=c.icon?`${c.icon} ${c.label}`:c.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder")):(s.textContent=this.props.placeholder??"",this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!this.props.placeholder));for(let u=0;u<d.length;u++){const p=this.optionEls[u];if(!p)continue;const f=d[u].value===i;p.setAttribute("aria-selected",String(f)),p.classList.toggle("ui-select__option--selected",f);const g=p.querySelector(".ui-select__check");g&&(g.textContent=f?"✓":"")}})),this.track(v(()=>{const i=this.open.get();if(this.dropdownEl.classList.toggle("open",i),n.classList.toggle("ui-select__chevron--open",i),this.triggerEl.setAttribute("aria-expanded",String(i)),i?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),i){const d=M(this.props.options)?this.props.options.get():this.props.options,c=this.props.value.get(),u=d.findIndex(f=>f.value===c),p=d.findIndex(f=>!f.disabled);this.highlightIndex.set(u>=0?u:p)}})),this.track(v(()=>{const i=this.highlightIndex.get();for(let d=0;d<this.optionEls.length;d++)this.optionEls[d].classList.toggle("ui-select__option--highlighted",d===i);i>=0&&this.optionEls[i]&&(this.triggerEl.setAttribute("aria-activedescendant",`ui-select-opt-${i}`),this.optionEls[i].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(M(this.props.disabled)?this.track(v(()=>{const i=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",i),this.triggerEl.disabled=i})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}selectOption(e){K(()=>{this.props.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.toggle();break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":{e.preventDefault();const t=this.highlightIndex.get(),s=M(this.props.options)?this.props.options.get():this.props.options;t>=0&&t<s.length&&!s[t].disabled&&this.selectOption(s[t].value);break}case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=M(this.props.options)?this.props.options.get():this.props.options;if(t.length===0||!t.some(n=>!n.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};oe.styles=`
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
            border: 1px solid ${I("border")};
            border-radius: ${I("radius")};
            background: ${I("input-bg")};
            color: ${I("text")};
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
        }
        .ui-select__trigger:focus-visible {
            outline: 2px solid ${I("primary")};
            outline-offset: 1px;
        }
        .ui-select__trigger--placeholder {
            color: ${I("text-muted")};
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
            color: ${I("text-muted")};
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
            background: ${I("surface")};
            border: 1px solid ${I("border")};
            border-radius: ${I("radius")};
            box-shadow: ${I("shadow-elevated")};
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
            color: ${I("text")};
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
            background: ${I("hover-bg")};
        }
        .ui-select__option--selected {
            color: ${I("primary")};
            font-weight: 600;
        }
        .ui-select__option--header {
            cursor: default;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${I("text-muted")};
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
            color: ${I("primary")};
        }
    `;let te=oe;function ke(o){return o.handicapIndex*(o.slope/113)+(o.courseRating-o.par)}function Wt(o){return Math.round(ke(o))}const Ut=["scramble","greensomes","foursomes","custom"],U=2,Z=10,Qt="ABCDEFGH",Xt={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class Vt{loading=new h(!1);error=new h(null);courses=new h([]);tees=new h([]);courseId=new h("");preset=new h("full_18");startHole=new h(1);players=new h([]);teams=new h([]);formatSlots=new h([]);submitting=new h(!1);diagnostics=new h([]);submitError=new h(null);catalog=O.get(V);nextKey=1;nextSlotKey=1;nextTeamKey=1;async load(){this.catalog.load().then(()=>this.ensureDefaultSlot());const e=await x(this.loading,this.error,()=>w.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const s=await x(this.loading,this.error,()=>w.setup.teesByCourse({courseId:e}))??[];this.tees.set(s);const n=new Set(s.map(i=>i.id)),r=s[0]?.id??"";this.players.set(this.players.get().map(i=>({...i,teeId:n.has(i.teeId)?i.teeId:r}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}])}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e))}patchPlayer(e,t){this.players.set(this.players.get().map(s=>s.key===e?{...s,...t}:s))}ensureDefaultSlot(){if(this.formatSlots.get().length>0)return;const e=this.catalog.byId("stableford_individual")??this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",s={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{}};this.formatSlots.set([...this.formatSlots.get(),s])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(s=>s.key===e?{...s,...t}:s))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return Qt[e]??`T${e+1}`}formations=Ut;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{}}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,kind:t,memberTeams:t==="single_ball"?{}:s.memberTeams}:s)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,s){const n=this.teamByKey(e);if(!n||n.kind!=="multi_ball"||t===e)return;const r={...n.memberTeams};if(s){if(this.teamMemberCount(e)>=Z)return;r[t]=!0}else delete r[t];this.teams.set(this.teams.get().map(i=>i.key===e?{...i,memberTeams:r}:i))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(s=>t.memberTeams[Number(s)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{const t=this.isSideFormat(e.formatId);let s=!1;const n={...e.subjectTeams};for(const r of this.teams.get())n[r.key]===!0&&r.kind==="multi_ball"!==t&&(delete n[r.key],s=!0);return s?{...e,subjectTeams:n}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const s={...t.memberTeams};return delete s[e],{...t,memberTeams:s}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const s={...t.subjectTeams};return delete s[e],{...t,subjectTeams:s}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.teams.get().findIndex(s=>s.key===e.key);return`Team ${this.teamLetter(Math.max(0,t))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,formation:t}:s))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,s){const n=this.teamByKey(e);if(!n)return;const r={...n.pctByPlayer};if(s){if(r[t]!==void 0||this.teamMemberCount(e)>=Z)return;r[t]=r[t]??"100"}else delete r[t];this.teams.set(this.teams.get().map(i=>i.key===e?{...i,pctByPlayer:r}:i))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=Z}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let s=0;for(const n of this.players.get()){const r=t.pctByPlayer[n.key];if(r===void 0)continue;const i=this.derivedCH(n);if(!i)return null;s+=this.parsePct(r)*i.ch/100}return Math.round(s)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<U)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=U;let s=t;for(const n of this.teams.get())e.memberTeams[n.key]===!0&&n.kind==="single_ball"&&Object.keys(n.pctByPlayer).length>=U&&s++;return s>=U}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,s){const n=this.teamByKey(e);!n||n.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(r=>r.key===e?{...r,pctByPlayer:{...r.pctByPlayer,[t]:s}}:r))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectPlayers:{...n.subjectPlayers,[t]:s}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectTeams:{...n.subjectTeams,[t]:s}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return Xt[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,s)=>t-s);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1)}derivedCH(e){const t=Number.parseFloat(e.handicapIndex);if(!Number.isFinite(t))return null;const s=this.teeById(e.teeId);if(!s)return null;const n=s.ratings.find(i=>i.gender===e.gender);if(!n)return null;const r={handicapIndex:t,slope:n.slope,courseRating:n.courseRating,par:n.par};return{ch:Wt(r),raw:ke(r),rating:n,teeName:s.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const s of this.formatSlots.get()){for(const n of e)s.subjectPlayers[n.key]!==!1&&t.add(n.key);for(const n of this.teams.get())if(s.subjectTeams[n.key]===!0)for(const r of e)n.pctByPlayer[r.key]!==void 0&&t.add(r.key)}return e.filter(s=>!t.has(s.key))}diagnosticsForFormat(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`formats[${e}]`))}generalDiagnostics(){return this.diagnostics.get().filter(e=>!e.path?.startsWith("producers[")&&!e.path?.startsWith("formats["))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const s=this.liveTeamKeySet(),n=[];for(const r of this.teams.get()){if(!s.has(r.key))continue;const i=e.filter(d=>r.pctByPlayer[d.key]!==void 0).map(d=>({producerDefId:t.get(d.key),allowancePct:this.parsePct(r.pctByPlayer[d.key])}));if(r.kind==="multi_ball")for(const d of this.teams.get())r.memberTeams[d.key]===!0&&d.key!==r.key&&d.kind==="single_ball"&&s.has(d.key)&&i.push({teamId:String(d.key)});n.push({id:String(r.key),label:this.teamLabel(r),formation:r.formation,kind:r.kind,members:i})}return n}buildFormats(e,t){const s=this.liveTeamKeySet();return this.formatSlots.get().map(n=>{const r=this.isSideFormat(n.formatId),i=[];if(!r)for(const d of e)n.subjectPlayers[d.key]!==!1&&i.push({kind:"player",producerDefId:t.get(d.key)});for(const d of this.teams.get())n.subjectTeams[d.key]===!0&&s.has(d.key)&&d.kind==="multi_ball"===r&&i.push({kind:"team",teamId:String(d.key)});return{formatId:n.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(n.allowancePct)},subjects:i}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),s=e.indexOf(t);return s<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(s),...e.slice(0,s)].map(r=>({courseHoleNumber:r})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];if(e.forEach((s,n)=>{s.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${n}].name`}),Number.isFinite(Number.parseFloat(s.handicapIndex))||t.push({code:"missing_index",message:"Handicap index required",path:`producers[${n}].handicapIndex`}),s.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${n}].teeId`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};this.submitting.set(!0);try{const s=[];for(let p=0;p<e.length;p++){const f=e[p],g=Number.parseFloat(f.handicapIndex),y=await w.guestPlayers.create({displayName:f.name.trim(),gender:f.gender,handicapIndex:g});s.push({producerDefId:`p${p+1}`,playerRef:{kind:"guest",id:y.id},handicapIndex:g,gender:f.gender,teeId:f.teeId})}const{roundType:n,route:r}=this.buildRoute(),i=new Map;e.forEach((p,f)=>i.set(p.key,`p${f+1}`));const d=this.buildTeams(e,i),c={courseId:this.courseId.get(),playedAt:new Date().toISOString().slice(0,10),roundType:n,...r?{route:r}:{},producers:s,...d.length>0?{teams:d}:{},formats:this.buildFormats(e,i)},u=await w.friendlyRounds.create({draft:c});return u.ok?{ok:!0,token:u.friendlyRound.shareToken}:(this.diagnostics.set(u.diagnostics),{ok:!1})}catch(s){return this.submitError.set(s instanceof D?s.message:"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}const Yt=["full_18","front_9","back_9"],Zt=b(`
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
`),Jt=b(`
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
`),es=b(`
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
`),ts=b(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),ss=b(`
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
`),be=b(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class ns extends E{static styles=`
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
                    flex: 1; padding: ${l("md")} 0; ${k()}
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
                padding: ${l("md")}; ${C()}
                display: flex; flex-direction: column; gap: ${l("sm")};

                & .player__top { display: flex; gap: ${l("sm")}; align-items: center; }
                & .player__name { flex: 1; padding: ${l("md")}; font-size: 1rem; ${N()} }
                & .player__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${k()}
                    font-size: 1rem; color: ${a("text-muted")};
                }
                & .player__fields { display: flex; gap: ${l("sm")}; align-items: stretch; }
                & .player__index { flex: 1; min-width: 0; padding: ${l("md")}; font-size: 1rem; ${N()} }
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
                width: 100%; margin-top: ${l("md")}; padding: ${l("md")}; ${k()}
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }

            & .setup__banner {
                color: ${a("error")}; font-size: 0.875rem; margin-bottom: ${l("md")};
                white-space: pre-line;
                &:empty { display: none; }
            }

            & .setup__fslots { display: flex; flex-direction: column; gap: ${l("md")}; }

            & .fslot {
                padding: ${l("md")}; ${C()}
                display: flex; flex-direction: column; gap: ${l("sm")};

                & .fslot__top { display: flex; gap: ${l("sm")}; align-items: center; }
                & .fslot__teamname { flex: 1; min-width: 0; font-weight: 700; font-size: 0.95rem; }
                & .fslot__teammeta {
                    margin: ${l("xs")} 0 0; font-size: 0.78rem; color: ${a("text-muted")};
                    &:empty { display: none; }
                }
                & .fslot__format { flex: 1; min-width: 0; font-size: 1rem; }
                & .fslot__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${k()}
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
                        & input { width: 56px; padding: ${l("xs")} ${l("sm")}; ${N()} font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${l("xs")};
                    & button {
                        flex: 1; padding: ${l("sm")} 0; ${k()}
                        font-family: inherit; font-weight: 700; font-size: 0.82rem;
                        &.on { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                    }
                }
                & .fslot__flat {
                    display: flex; align-items: center; gap: ${l("xs")}; font-size: 0.9rem;
                    color: ${a("text-muted")};
                    &[hidden] { display: none; }
                    & .fslot__pct { width: 70px; padding: ${l("sm")}; font-size: 1rem; ${N()} }
                }
                & .fslot__bands {
                    display: flex; flex-direction: column; gap: ${l("xs")};
                    &[hidden] { display: none; }
                }
                & .fslot__bandrows { display: flex; flex-direction: column; gap: ${l("xs")}; }
                & .brow {
                    display: flex; align-items: center; gap: ${l("xs")};
                    font-size: 0.82rem; color: ${a("text-muted")};
                    & .brow__pct, & .brow__upto { width: 56px; padding: ${l("sm")}; font-size: 0.95rem; ${N()} }
                    & .brow__del { margin-left: auto; width: 30px; height: 30px; ${k()} font-size: 0.8rem; color: ${a("text-muted")}; }
                }
                & .fslot__addband {
                    align-self: flex-start; padding: ${l("xs")} ${l("sm")}; ${k()}
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                }

                & .fslot__err {
                    font-size: 0.82rem; color: ${a("error")};
                    &:empty { display: none; }
                }
            }

            & .setup__create {
                width: 100%; padding: ${l("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit; ${k()}
                background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                box-shadow: ${a("shadow-elevated")};
                &:hover { background: ${a("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;svc=this.inject(Vt);router=this.inject(z);render(){this.svc.load();const e=this.wire(Zt,{back:{onclick:()=>this.router.navigate("/")},addPlayer:{onclick:()=>this.svc.addPlayer()},addTeam:{onclick:()=>this.svc.addTeam()},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const s=this.svc.playersInNoFormat();return s.length===0?"":`Heads up: ${s.map(r=>r.name.trim()||"A player").join(", ")} ${s.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.generalDiagnostics().map(n=>n.message),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?"Creating…":"Create round",onclick:async()=>{const s=await this.svc.submit();s.ok&&this.router.navigate("/round",{query:{token:s.token}})}}});this.$each(this.ref(e,"presets"),()=>Yt,(s,n,r)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(s),className:()=>this.svc.preset.get()===s?"on":"",onclick:()=>this.svc.setPreset(s)}},r),s=>s);const t=s=>this.track(s);return this.mountSelect(this.ref(e,"course"),t,{value:this.bound(t,()=>this.svc.courseId.get(),s=>{s&&s!==this.svc.courseId.get()&&this.svc.selectCourse(s)}),options:{get:()=>{const s=[];let n="";for(const r of this.svc.courses.get())r.clubName!==n&&(s.push({value:`__club:${r.clubName}`,label:r.clubName,disabled:!0}),n=r.clubName),s.push({value:r.id,label:r.name});return s}},placeholder:"Select a course"}),this.mountSelect(this.ref(e,"startHole"),t,{value:this.bound(t,()=>String(this.svc.startHole.get()),s=>this.svc.startHole.set(Number(s))),options:{get:()=>this.svc.startHoleOptions().map(s=>({value:String(s),label:String(s)}))}}),this.$each(this.ref(e,"players"),this.svc.players,(s,n,r)=>this.playerRow(s.key,r),s=>s.key),this.$each(this.ref(e,"teams"),this.svc.teams,(s,n,r)=>this.teamCard(s.key,r),s=>s.key),this.$each(this.ref(e,"formats"),this.svc.formatSlots,(s,n,r)=>this.formatCard(s.key,n,r),s=>s.key),e}mountSelect(e,t,s){const n=new te(s);n.mount(e),t(()=>n.destroy())}bound(e,t,s){const n=new h(t());return e(v(()=>n.set(t()))),e(v(()=>{const r=n.get();queueMicrotask(()=>s(r))})),n}eachInto(e,t,s,n,r){const i=new Map,d=new Map;t(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),t(v(()=>{const c=s(),u=new Map;for(const[f,g]of c.entries()){const y=r(g,f);if(i.has(y))u.set(y,i.get(y));else{const j=[];u.set(y,n(g,f,S=>j.push(S))),d.set(y,j)}}for(const[f,g]of i)u.has(f)||(g.remove(),d.get(f)?.forEach(y=>y()),d.delete(f));let p=e.firstChild;for(const f of u.values())f===p?p=p.nextSibling:e.insertBefore(f,p);i.clear();for(const[f,g]of u)i.set(f,g)}))}formatCard(e,t,s){const n=()=>this.svc.slotByKey(e),r=()=>n()?.formatId??"",i=this.wireEl(es,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(r())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:c=>this.svc.setSlotAllowance(e,c.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(r())?"applied to each side member’s ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.diagnosticsForFormat(t).map(c=>c.message).join(" · ")}},s);this.mountSelect(this.ref(i,"format"),s,{value:this.bound(s,()=>r(),c=>{c&&c!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,c)}),options:{get:()=>this.svc.catalog.descriptors.get().map(c=>({value:c.id,label:c.label}))}});const d=()=>{const c=this.svc.isSideFormat(r()),u=[];c||u.push(...this.svc.players.get().map(p=>({kind:"player",subKey:p.key})));for(const p of this.svc.teams.get())p.kind==="multi_ball"===c&&u.push({kind:"team",subKey:p.key});return u};return this.eachInto(this.ref(i,"subjectRows"),s,d,(c,u,p)=>this.subjectRow(e,c.kind,c.subKey,p),c=>`${c.kind}${c.subKey}`),i}subjectRow(e,t,s,n){const r=()=>{if(t==="player")return this.svc.players.get().find(u=>u.key===s)?.name?.trim()||"Player";const c=this.svc.teamByKey(s);return c?`${this.svc.teamLabel(c)} (${c.kind==="multi_ball"?"side":"team"})`:"Team"},i=()=>t==="player"?this.svc.subjectPlayerIn(e,s):this.svc.subjectTeamIn(e,s),d=c=>t==="player"?this.svc.setSubjectPlayer(e,s,c):this.svc.setSubjectTeam(e,s,c);return this.wireEl(ts,{chk:{checked:()=>i(),onchange:c=>d(c.target.checked)},name:{textContent:()=>r()}},n)}teamCard(e,t){const s=()=>this.svc.teamKindOf(e)==="multi_ball",n=this.wireEl(ss,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const r=this.svc.teamByKey(e);return r?this.svc.teamLabel(r):"Team"}},compGroup:{hidden:()=>s()},membersLabel:{textContent:()=>s()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const r=this.svc.teamSize(e);if(r===0)return s()?"Tick at least 2 members — a side needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(r<2)return"Add one more member — a team needs at least 2.";if(s())return`${r} balls · a side (scored together by a side format)`;const i=this.svc.teamBallCh(e);return i===null?`${r} players`:`${r} players · plays off CH ${i}`}}},t);return this.mountSelect(this.ref(n,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),r=>this.svc.setTeamKind(e,r==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"One combined ball"},{value:"multi_ball",label:"Separate balls (a side)"}]}}),this.mountSelect(this.ref(n,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",r=>this.svc.setTeamFormation(e,r)),options:{get:()=>this.svc.formations.map(r=>({value:r,label:r[0].toUpperCase()+r.slice(1)}))}}),this.eachInto(this.ref(n,"memberRows"),t,()=>{const r=this.svc.players.get().map(i=>({kind:"player",mKey:i.key}));if(s())for(const i of this.svc.eligibleNestedTeams(e))r.push({kind:"team",mKey:i.key});return r},(r,i,d)=>r.kind==="player"?this.teamMemberRow(e,r.mKey,d):this.teamNestedRow(e,r.mKey,d),r=>`${r.kind}${r.mKey}`),n}teamNestedRow(e,t,s){const n=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(be,{chk:{checked:()=>n(),disabled:()=>!n()&&this.svc.teamAtMaxSize(e),onchange:r=>this.svc.setTeamMemberTeam(e,t,r.target.checked)},name:{textContent:()=>{const r=this.svc.teamByKey(t);return r?`${this.svc.teamLabel(r)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},s)}teamMemberRow(e,t,s){const n=()=>this.svc.players.get().find(i=>i.key===t)??null,r=()=>this.svc.teamMemberIn(e,t);return this.wireEl(be,{chk:{checked:()=>r(),disabled:()=>!r()&&this.svc.teamAtMaxSize(e),onchange:i=>this.svc.setTeamMember(e,t,i.target.checked)},name:{textContent:()=>n()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!r()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:i=>this.svc.setTeamPct(e,t,i.target.value)}},s)}playerRow(e,t){const s=()=>this.svc.players.get().find(i=>i.key===e)??null,n=()=>this.svc.players.get().findIndex(i=>i.key===e),r=this.wireEl(Jt,{name:{oninput:i=>this.svc.patchPlayer(e,{name:i.target.value})},index:{oninput:i=>this.svc.patchPlayer(e,{handicapIndex:i.target.value})},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const i=s();if(!i)return"";const d=this.svc.derivedCH(i);if(!d)return"";const c=d.rating;return`Course handicap ${d.ch}  ·  ${i.handicapIndex} × ${c.slope}/113 + (${c.courseRating} − ${c.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(n()).map(i=>i.message).join(" · ")}},t);return this.mountSelect(this.ref(r,"gender"),t,{value:this.bound(t,()=>s()?.gender??"M",i=>this.svc.patchPlayer(e,{gender:i})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]}}),this.mountSelect(this.ref(r,"tee"),t,{value:this.bound(t,()=>s()?.teeId??"",i=>this.svc.patchPlayer(e,{teeId:i})),options:{get:()=>this.svc.tees.get().map(i=>({value:i.id,label:i.name}))},placeholder:"Tee"}),r}}const rs=b(`
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
`);class os extends E{static styles=`
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
                    ${N()}
                }

                & button {
                    padding: ${l("md")} ${l("lg")};
                    font-size: 1rem;
                    font-weight: 700;
                    ${k()}
                    background: ${a("primary")};
                    color: ${a("primary-text")};
                    border: none;
                    &:hover { background: ${a("primary")}; }
                }
            }
        }
    `;auth=this.inject(se);router=this.inject(z);username="";password="";render(){return this.wire(rs,{root:{inert:()=>this.auth.loading.get()},error:{className:()=>this.auth.error.get()?"error show":"error",textContent:()=>this.auth.error.get()?.message??""},form:{onsubmit:async e=>{e.preventDefault(),await this.auth.login(this.username,this.password)&&this.router.navigate("/rounds",!0)}},username:{oninput:e=>{this.username=e.target.value}},password:{oninput:e=>{this.password=e.target.value}},submit:{textContent:()=>this.auth.loading.get()?"Signing in…":"Sign in"}})}}class is{loading=new h(!1);error=new h(null);guests=new h([]);async load(){const e=await x(this.loading,this.error,()=>w.guestPlayers.list());e&&this.guests.set(e)}async create(e){const t=await x(this.loading,this.error,()=>w.guestPlayers.create(e));return t&&this.guests.update(s=>[...s,t]),t??null}}const as=b(`
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
`),ls=b(`
    <div class="player-row">
        <span bind="initials" class="player-row__badge"></span>
        <span bind="name" class="player-row__name"></span>
        <span bind="hcp" class="player-row__hcp"></span>
    </div>
`);function ds(o){return o.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0].toUpperCase()).join("")}class cs extends E{static styles=`
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
                ${C()}

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
                ${C()}

                & h2 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 1.2rem;
                }

                & input {
                    padding: ${l("md")} ${l("lg")};
                    font-size: 1rem;
                    ${N()}
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
                    ${k()}
                    background: ${a("primary")};
                    color: ${a("primary-text")};
                    border: none;
                    &:hover { background: ${a("primary")}; }
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
        }
    `;svc=this.inject(is);name=new h("");gender=new h("M");hcp=new h("");render(){this.svc.load();const e=this.wire(as,{name:{value:()=>this.name.get(),oninput:t=>this.name.set(t.target.value)},hcp:{value:()=>this.hcp.get(),oninput:t=>this.hcp.set(t.target.value)},genderM:{className:()=>this.gender.get()==="M"?"on":"",onclick:()=>this.gender.set("M")},genderF:{className:()=>this.gender.get()==="F"?"on":"",onclick:()=>this.gender.set("F")},submit:{disabled:()=>this.name.get().trim()===""||this.svc.loading.get()},form:{onsubmit:async t=>{t.preventDefault();const s=this.hcp.get().trim().replace(",",".");await this.svc.create({displayName:this.name.get().trim(),gender:this.gender.get(),handicapIndex:s===""?null:Number(s)})&&(this.name.set(""),this.hcp.set(""))}}});return this.$each(this.ref(e,"list"),this.svc.guests,(t,s,n)=>this.wireEl(ls,{initials:()=>ds(t.displayName),name:()=>t.displayName,hcp:()=>t.handicapIndex===null?"–":t.handicapIndex.toFixed(1)},n),t=>t.id),e}}class us{loading=new h(!1);error=new h(null);rounds=new h([]);async load(){const e=await x(this.loading,this.error,()=>w.rounds.list());e&&this.rounds.set(e)}}const hs=b(`
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
`),ps=b(`
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
`);class ms extends E{static styles=`
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
                ${k()}
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
                ${C({hover:!0})}

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
    `;svc=this.inject(us);router=this.inject(z);render(){this.svc.load();const e=this.wire(hs,{subtitle:()=>{const s=this.svc.rounds.get().length;return s===0?"No rounds yet — tee one up.":`${s} round${s===1?"":"s"} on the card.`},newBtn:{onclick:()=>this.router.navigate("/create")}}),t={not_started:"Not started",active:"Live",complete:"Done"};return this.$each(this.ref(e,"list"),this.svc.rounds,(s,n,r)=>this.wireEl(ps,{row:{onclick:()=>this.router.navigate("/score",{query:{roundId:s.id}})},course:()=>s.courseNameSnapshot??"Round",status:{textContent:()=>t[s.status]??s.status,className:()=>`round-row__status s-${s.status}`},date:()=>s.date,formats:()=>s.formatSlots.map(ne).join(" · ")},r),s=>s.id),e}}class fs{loading=new h(!1);error=new h(null);roundId=new h(null);round=new h(null);course=new h(null);balls=new h([]);strokes=new h(new Map);holes=new $(()=>this.course.get()?.holes??[]);playHoleIdByCourseHole=new $(()=>{const e=new Map;for(const t of this.round.get()?.playHoles??[])e.has(t.courseHoleNumber)||e.set(t.courseHoleNumber,t.id);return e});async load(e){if(this.roundId.get()===e&&this.round.get())return;this.roundId.set(e);const t=await x(this.loading,this.error,()=>w.rounds.get({id:e}));if(!t)return;this.round.set(t);const[s,n,r]=await Promise.all([x(this.loading,this.error,()=>w.courses.get({id:t.courseId})),x(this.loading,this.error,()=>w.rounds.balls({roundId:e})),x(this.loading,this.error,()=>w.scorecards.forRound({roundId:e}))]);if(s&&this.course.set(s),n&&this.balls.set(n),r){const i=new Map;for(const d of r)for(const c of d.holes)i.set(`${d.ballId} ${c.holeNumber}`,c.strokes);this.strokes.set(i)}}strokesFor(e,t){return this.strokes.get().get(`${e} ${t}`)??null}async setStrokes(e,t,s){const n=this.roundId.get();if(!n)return;const r=this.playHoleIdByCourseHole.get().get(t);if(!r)return;this.strokes.update(d=>new Map(d).set(`${e.id} ${t}`,s));const i=e.players.length===1?e.players[0]:null;await x(this.loading,this.error,()=>w.scoreEvents.append({roundId:n,ballId:e.id,playHoleId:r,strokes:s,eventType:s===null?"score_cleared":"score_entered",clientEventId:crypto.randomUUID(),sourcePlayerId:i?.playerId??null,sourceGuestPlayerId:i?.guestPlayerId??null}))}}const gs=b(`
    <div class="score">
        <header class="score__head">
            <button bind="back" type="button" class="score__chip">‹ Rounds</button>
            <span bind="course" class="score__course"></span>
            <button bind="results" type="button" class="score__chip score__chip--gold">Results</button>
        </header>

        <div class="score__hole">
            <button bind="prev" type="button" class="score__holenav">‹</button>
            <div class="score__holecard">
                <span class="score__holeword">Hole</span>
                <span bind="holeNo" class="score__holeno"></span>
                <span bind="holemeta" class="score__holemeta"></span>
            </div>
            <button bind="next" type="button" class="score__holenav">›</button>
        </div>

        <div bind="dots" class="score__dots"></div>

        <div bind="balls" class="score__balls"></div>
    </div>
`),bs=b('<button bind="dot" type="button" class="score-dot"></button>'),ys=b(`
    <div class="ball-row">
        <div class="ball-row__who">
            <span bind="label" class="ball-row__label"></span>
            <span bind="meta" class="ball-row__meta"></span>
        </div>
        <div class="ball-row__stepper">
            <button bind="minus" type="button">−</button>
            <span bind="value" class="ball-row__value"></span>
            <button bind="plus" type="button">+</button>
        </div>
    </div>
`);class _s extends E{static styles=`
        .score {
            padding: ${l("lg")} ${l("lg")} ${l("2xl")};

            & .score__head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${l("sm")};
                margin-bottom: ${l("lg")};
            }

            & .score__chip {
                padding: ${l("sm")} ${l("md")};
                font-size: 0.85rem;
                font-weight: 600;
                font-family: inherit;
                ${k(a("radius-pill"))}
            }

            & .score__chip--gold {
                background: ${a("accent-soft")};
                color: ${a("accent")};
                border-color: ${a("accent")};
                &:hover { background: ${a("accent-soft")}; }
            }

            & .score__course {
                font-family: ${a("font-display")};
                font-weight: 600;
                font-size: 0.95rem;
                text-align: center;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            & .score__hole {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                margin-bottom: ${l("md")};
            }

            & .score__holenav {
                width: 56px;
                align-self: stretch;
                font-size: 2rem;
                font-family: inherit;
                ${k()}
                &:disabled { opacity: 0.3; cursor: default; }
            }

            & .score__holecard {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: ${l("md")} 0 ${l("lg")};
                background: ${a("topbar-bg")};
                color: ${a("primary-text")};
                border-radius: ${a("radius")};
                box-shadow: ${a("shadow-elevated")};

                & .score__holeword {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.25em;
                    opacity: 0.6;
                }

                & .score__holeno {
                    font-family: ${a("font-display")};
                    font-size: 3.2rem;
                    font-weight: 600;
                    line-height: 1.05;
                }

                & .score__holemeta {
                    font-size: 0.8rem;
                    opacity: 0.75;
                    letter-spacing: 0.04em;
                }
            }

            & .score__dots {
                display: flex;
                justify-content: center;
                gap: 5px;
                flex-wrap: wrap;
                margin-bottom: ${l("xl")};

                & .score-dot {
                    width: 12px;
                    height: 12px;
                    padding: 0;
                    border-radius: 50%;
                    border: 1px solid ${a("border")};
                    background: ${a("surface")};
                    cursor: pointer;

                    &.done { background: ${a("primary")}; border-color: ${a("primary")}; }
                    &.now {
                        outline: 2px solid ${a("accent")};
                        outline-offset: 1px;
                    }
                }
            }

            & .score__balls {
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
            }

            & .ball-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${l("md")};
                padding: ${l("md")} ${l("md")} ${l("md")} ${l("lg")};
                ${C()}

                & .ball-row__who {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                & .ball-row__label {
                    font-weight: 600;
                    font-size: 1.05rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                & .ball-row__meta { color: ${a("text-muted")}; font-size: 0.75rem; }

                & .ball-row__stepper {
                    display: flex;
                    align-items: center;
                    gap: ${l("xs")};
                    flex-shrink: 0;

                    & button {
                        width: 52px;
                        height: 52px;
                        font-size: 1.6rem;
                        font-family: inherit;
                        ${k()}
                    }

                    & .ball-row__value {
                        width: 52px;
                        text-align: center;
                        font-family: ${a("font-display")};
                        font-size: 1.9rem;
                        font-weight: 600;

                        &.unset { color: ${a("text-muted")}; font-size: 1.4rem; }
                        &.under { color: ${a("under-par")}; }
                        &.over { color: ${a("over-par")}; }
                    }
                }
            }
        }
    `;svc=this.inject(fs);router=this.inject(z);holeQ=this.router.query("hole");roundIdQ=this.router.query("roundId");hole=new $(()=>{const e=Number(this.holeQ.get()??"1");return Number.isFinite(e)&&e>=1?e:1});currentHole=new $(()=>this.svc.holes.get().find(e=>e.holeNumber===this.hole.get())??null);goHole(e){this.router.navigate("/score",{query:{roundId:this.roundIdQ.get(),hole:String(e)}})}render(){this.track(v(()=>{const t=this.roundIdQ.get();t&&this.svc.load(t)}));const e=this.wire(gs,{back:{onclick:()=>this.router.navigate("/rounds")},results:{onclick:()=>this.router.navigate("/results",{query:{roundId:this.roundIdQ.get()}})},course:()=>this.svc.round.get()?.courseNameSnapshot??"",holeNo:()=>String(this.hole.get()),holemeta:()=>{const t=this.currentHole.get();return t?`Par ${t.par} · Index ${t.strokeIndex}`:""},prev:{disabled:()=>this.hole.get()<=1,onclick:()=>this.goHole(this.hole.get()-1)},next:{disabled:()=>this.hole.get()>=(this.svc.holes.get().length||18),onclick:()=>this.goHole(this.hole.get()+1)}});return this.$each(this.ref(e,"dots"),this.svc.holes,(t,s,n)=>this.wireEl(bs,{dot:{className:()=>{const r=this.svc.balls.get().length>0&&this.svc.balls.get().every(d=>this.svc.strokesFor(d.id,t.holeNumber)!==null),i=this.hole.get()===t.holeNumber;return`score-dot${r?" done":""}${i?" now":""}`},onclick:()=>this.goHole(t.holeNumber)}},n),t=>String(t.holeNumber)),this.$each(this.ref(e,"balls"),this.svc.balls,(t,s,n)=>this.ballRow(t,n),t=>t.id),e}ballRow(e,t){const s=()=>this.svc.strokesFor(e.id,this.hole.get()),n=()=>this.currentHole.get()?.par??4;return this.wireEl(ys,{label:()=>e.label??e.players.map(r=>r.displayName).join(" / "),meta:()=>e.players.map(r=>`${r.teeName} · CH ${r.courseHandicap}`).join("  ·  "),minus:{onclick:()=>{const r=s();r===null?this.svc.setStrokes(e,this.hole.get(),n()):r<=1?this.svc.setStrokes(e,this.hole.get(),null):this.svc.setStrokes(e,this.hole.get(),r-1)}},plus:{onclick:()=>{const r=s();this.svc.setStrokes(e,this.hole.get(),r===null?n():r+1)}},value:{textContent:()=>{const r=s();return r===null?"–":String(r)},className:()=>{const r=s();return r===null?"ball-row__value unset":r<n()?"ball-row__value under":r>n()?"ball-row__value over":"ball-row__value"}}},t)}}class vs{loading=new h(!1);error=new h(null);roundId=new h(null);round=new h(null);result=new h(null);balls=new h([]);labelByBall=new $(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,t.label??t.players.map(s=>s.displayName).join(" / "));return e});async load(e){this.roundId.set(e);const[t,s]=await Promise.all([x(this.loading,this.error,()=>w.rounds.get({id:e})),x(this.loading,this.error,()=>w.rounds.balls({roundId:e}))]);t&&this.round.set(t),s&&this.balls.set(s);const n=await x(this.loading,this.error,()=>w.leaderboards.forRound({roundId:e}));n&&this.result.set(n)}}const ws=b(`
    <div class="results">
        <header class="results__head">
            <button bind="back" type="button" class="results__chip">‹ Scores</button>
            <span bind="course" class="results__course"></span>
        </header>

        <div bind="notice" class="results__notice"></div>

        <div bind="slots" class="results__slots"></div>
    </div>
`),xs=b('<div bind="row" class="results-slot"></div>');class $s extends E{static styles=`
        .results {
            padding: ${l("lg")} ${l("lg")} ${l("2xl")};

            & .results__head {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                margin-bottom: ${l("lg")};
            }

            & .results__chip {
                padding: ${l("sm")} ${l("md")};
                font-size: 0.85rem;
                font-weight: 600;
                font-family: inherit;
                flex-shrink: 0;
                ${k(a("radius-pill"))}
            }

            & .results__course {
                font-family: ${a("font-display")};
                font-weight: 600;
                font-size: 1.1rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            & .results__notice {
                color: ${a("text-muted")};
                font-size: 0.9rem;
                margin-bottom: ${l("lg")};
            }

            & .results__slots {
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
            }

            & .results-slot {
                padding: ${l("md")} ${l("lg")};
                font-weight: 600;
                ${C()}
            }
        }
    `;svc=this.inject(vs);router=this.inject(z);roundIdQ=this.router.query("roundId");render(){this.track(v(()=>{const s=this.roundIdQ.get();s&&this.svc.load(s)}));const e=()=>this.svc.result.get()?.slots??[],t=this.wire(ws,{back:{onclick:()=>this.router.navigate("/score",{query:{roundId:this.roundIdQ.get()}})},course:()=>this.svc.round.get()?.courseNameSnapshot??"Results",notice:()=>e().length===0?"No scores yet — go play some golf.":"Detailed results render in the static fixtures; the mobile view returns in a later step."});return this.$each(this.ref(t,"slots"),()=>e(),(s,n,r)=>this.wireEl(xs,{row:()=>`slot #${s.slotIndex} · ${s.formatLabel} · ${s.allowanceLabel}`},r),s=>s.slotDefId),t}}const ks=b(`
    <div class="app-shell">
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class Ss extends E{static styles=`
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
    `;router=this.inject(z);render(){const e=this.wire(ks,{});return this.spawn(et,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":pe,"/round":Kt,"/create":ns,"/login":os,"/rounds":ms,"/players":cs,"/score":_s,"/results":$s},pe),e}}O.get(Be);const ye=O.get(z),_e=O.get(se);await Ae(Ss,"#app",{hot:void 0,onInit:async()=>{await _e.load(),_e.currentUser.get()&&ye.route.get()==="/login"&&ye.navigate("/",!0)}});export{E as C,z as R,h as S,Be as T,m as a,K as b,$ as c,v as e,x as r,b as t};
