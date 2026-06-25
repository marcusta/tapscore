(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function t(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=t(n);fetch(n.href,r)}})();const ke="modulepreload",Se=function(o){return"/tapscore/"+o},ne={},Ie=function(e,t,s){let n=Promise.resolve();if(t&&t.length>0){let c=function(u){return Promise.all(u.map(f=>Promise.resolve(f).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),d=l?.nonce||l?.getAttribute("nonce");n=c(t.map(u=>{if(u=Se(u),u in ne)return;ne[u]=!0;const f=u.endsWith(".css"),p=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${p}`))return;const g=document.createElement("link");if(g.rel=f?"stylesheet":ke,f||(g.as="script"),g.crossOrigin="",g.href=u,d&&g.setAttribute("nonce",d),document.head.appendChild(g),f)return new Promise((_,C)=>{g.addEventListener("load",_),g.addEventListener("error",()=>C(new Error(`Unable to preload CSS for ${u}`)))})}))}function r(l){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=l,window.dispatchEvent(d),!d.defaultPrevented)throw l}return n.then(l=>{for(const d of l||[])d.status==="rejected"&&r(d.reason);return e().catch(r)})};class Te{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])this.batching?this.pending.add(t):t.run()}runTracked(e,t){me(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.run()}}}const L=new Te;function me(o){for(const e of o.deps)e.delete(o);o.deps.clear()}class h{constructor(e){this.subs=new Set,this.val=e}get(){return L.subscribe(this.subs),this.val}set(e){Object.is(this.val,e)||(this.val=e,L.notify(this.subs))}update(e){this.set(e(this.val))}}class ${constructor(e){this.subs=new Set,this.val=void 0;const t=this,s={run(){L.runTracked(s,()=>{const n=e();Object.is(t.val,n)||(t.val=n,L.notify(t.subs))})},deps:new Set};s.run()}get(){return L.subscribe(this.subs),this.val}}function y(o){const e={run(){L.runTracked(e,o)},deps:new Set};return e.run(),()=>me(e)}function G(o){L.batch(o)}class Ee{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const j=new Ee,A="/tapscore/".replace(/\/+$/,"");function V(o){return A?o===A?"/":o.startsWith(A+"/")?o.slice(A.length):o:o}function Pe(o){return A+o}class z{constructor(){this.route=new h(V(location.pathname??"/")),this.search=new h(location.search??""),window.addEventListener("popstate",()=>G(()=>{this.route.set(V(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},n=e.indexOf("#"),r=n>=0?e.slice(n):"",l=n>=0?e.slice(0,n):e,d=l.indexOf("?"),c=d>=0?l.slice(0,d):l,u=d>=0?l.slice(d+1):"",f=s.query!==void 0?Ce(s.query):u?"?"+u:"",p=Pe(c)+f+r;(s.replace?history.replaceState:history.pushState).call(history,null,"",p),G(()=>{this.route.set(c),this.search.set(f)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:n=>{n.preventDefault(),this.navigate(e)},className:()=>{const n=this.route.get();return n===s||n.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new $(()=>{const s=this.route.get().split("/"),n={};for(const[r,l]of t.entries())l.startsWith(":")&&(n[l.slice(1)]=s[r]??"");return n})}query(e){return new $(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new $(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function Ce(o){const e=new URLSearchParams;for(const[s,n]of Object.entries(o))n==null||n===""||e.set(s,String(n));const t=e.toString();return t?"?"+t:""}function ze(o){return e=>o[e]}function je(o,e){const t=(n,r,l)=>{const d=Object.entries(n).map(([c,u])=>`--${c}:${u}`).join(";");return`${r}{color-scheme:${l};${d}}`},s=document.createElement("style");return s.textContent=t(o,'[data-theme="light"]',"light")+t(e,'[data-theme="dark"]',"dark"),document.head.appendChild(s),n=>`var(--${n})`}const re="basics-js-theme";class Oe{constructor(){this.dark=new h(!1);const e=localStorage.getItem(re),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),y(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(re,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function b(o){const e=document.createElement("template");return e.innerHTML=o,e}function He(o,e){let t;for(const s of Object.keys(e))o.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const oe=new Set;class T{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!oe.has(t)){oe.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return j.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const n=new e(s[0]);return n.mount(t),this.children.push(n),n}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0}wire(e,t,s){const n=s??(l=>this.track(l)),r=e.content.cloneNode(!0);for(const l of r.querySelectorAll("[bind]")){const d=t[l.getAttribute("bind")];if(d)if(typeof d=="function")n(y(()=>{const c=d();l instanceof HTMLInputElement||l instanceof HTMLTextAreaElement?l.value=String(c):l.textContent=String(c)}));else for(const[c,u]of Object.entries(d)){const f=c.includes("-");c.startsWith("on")&&typeof u=="function"?l.addEventListener(c.slice(2),u):typeof u=="function"?n(y(()=>{const p=u();f?l.setAttribute(c,String(p)):l[c]=p})):f?l.setAttribute(c,String(u)):l[c]=u}}return r}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const n=this.ref(t,e);return n?(typeof s=="string"?n.textContent=s:typeof s=="function"&&s.prototype instanceof T?this.spawn(s,n):typeof s=="function"&&s(n,{spawn:(r,l,...d)=>this.spawn(r,l,...d),track:r=>this.track(r)}),!0):!1}$each(e,t,s,n=(r,l)=>l){const r=typeof t=="function"?t:()=>t.get(),l=new Map,d=new Map;this.track(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),this.track(y(()=>{const c=r(),u=new Map;for(const[p,g]of c.entries()){const _=n(g,p);if(l.has(_))u.set(_,l.get(_));else{const C=[];u.set(_,s(g,p,D=>C.push(D))),d.set(_,C)}}for(const[p,g]of l)u.has(p)||(g.remove(),d.get(p)?.forEach(_=>_()),d.delete(p));let f=e.firstChild;for(const p of u.values())p===f?f=f.nextSibling:e.insertBefore(p,f);l.clear();for(const[p,g]of u)l.set(p,g)}))}$condition(e,t,s,n){let r=null;this.track(y(()=>{r&&(r.remove(),r=null),r=t.get()?s():n?.()??null,r&&e.appendChild(r)}))}$swap(e,t,s,n){let r=null;this.track(y(()=>{r&&(r.destroy(),r=null),e.textContent="";const l=t.get(),d=s[l]??He(l,s)??n;d&&(r=new d,r.mount(e))})),this.track(()=>r?.destroy())}}async function Re(o,e,t){const s=document.querySelector(e);s.textContent="";const n=j.get(z);let r=null,l=!1,d=null,c=!!t?.hot?.data.hmr;const u=async f=>{r&&(r.destroy(),r=null,s.textContent=""),f?(d||(d=(await Ie(()=>import("./obs-shell.component-DRY7jbWH.js"),[])).ObsShellComponent),r=new d):(!c&&t?.onInit&&(await t.onInit(),c=!0),r=new o),r.mount(s),l=f};await u(V(location.pathname).startsWith("/_obs")),y(()=>{const f=n.route.get().startsWith("/_obs");f!==l&&u(f)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>r?.destroy()),t.hot.accept())}class F extends Error{constructor(e,t,s,n){super(t),this.status=e,this.details=s,this.traceId=n,this.name="ApiError"}}const Ne=10,K=[];let U=[],q=null;function Le(o){K.push(o),K.length>Ne&&K.shift()}function Me(o,e,t){const s={code:o,message:e,url:typeof location<"u"?location.href:"",context:[...K],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),U.push(s),Be()}function Be(){q||(q=setTimeout(fe,5e3))}function fe(){if(q&&(clearTimeout(q),q=null),U.length===0)return;const o=U;U=[];for(const e of o){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon("/api/_obs/errors",new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch("/api/_obs/errors",{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&fe()});const Fe=3e4,De=2,W=new Map,ge=new WeakMap;function Ae(o){if(o instanceof F)return o.traceId;if(o!=null&&typeof o=="object")return ge.get(o)}async function m(o){if(o.method==="GET"){const e=W.get(o.url);if(e)return e;const t=ie(o,De);return W.set(o.url,t),t.then(()=>W.delete(o.url),()=>W.delete(o.url)),t}return ie(o,0)}async function ie(o,e){const t=o.timeout??Fe;let s;for(let n=0;n<=e;n++){const r=crypto.randomUUID();try{return await Ge(qe(o,r),t)}catch(l){if(s=l,!(l instanceof F)&&l!=null&&typeof l=="object"&&ge.set(l,r),l instanceof F||n===e)break;await new Promise(d=>setTimeout(d,1e3*2**n))}}throw s}async function qe(o,e){const t={"X-Trace-Id":e},s={method:o.method,headers:t};o.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(o.body));const n=await fetch(o.url,s),r=n.headers.get("x-trace-id")??e;if(Le({type:"api",detail:`${o.method} ${o.url}`,timestamp:new Date().toISOString()}),!n.ok){const l=await n.json().catch(()=>({error:n.statusText}));throw new F(n.status,l.error??n.statusText,l.details,r)}return n.json()}function Ge(o,e){let t;const s=new Promise((n,r)=>{t=setTimeout(()=>r(new Error("Request timeout")),e)});return Promise.race([o,s]).finally(()=>clearTimeout(t))}async function x(o,e,t){G(()=>{o.set(!0),e.set(null)});try{const s=await t();return o.set(!1),s}catch(s){const n=We(s);G(()=>{o.set(!1),e.set(n)}),Me(n.code,n.message,Ae(s));return}}function We(o){return o instanceof F?o.status===401?{code:"auth",message:"Unauthorized"}:o.status===409?{code:"conflict",message:"Data has changed — please try again"}:o.status===400?{code:"validation",message:o.message}:{code:"server",message:"Server error"}:o instanceof Error?o.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}function Ke(o){return{me:()=>m({method:"GET",url:`${o}/auth/me`}),login:e=>m({method:"POST",url:`${o}/auth/login`,body:e}),logout:()=>m({method:"POST",url:`${o}/auth/logout`,body:{}})}}class Z{constructor(){this.api=Ke("/api"),this.currentUser=new h(null),this.loading=new h(!1),this.error=new h(null)}async load(){const e=await x(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await x(this.loading,this.error,()=>this.api.login({username:e,password:t}));return s?(this.currentUser.set(s),!0):!1}async logout(){await x(this.loading,this.error,()=>this.api.logout());const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const ae={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},i=je({...ae,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},{...ae,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"}),I=o=>`var(--${o})`,a=ze({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem"}),k=(o=I("radius"))=>`
    border: 1px solid ${I("border")};
    border-radius: ${o};
    background: ${I("btn-bg")};
    color: ${I("text")};
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: ${I("btn-hover")}; }
`,H=()=>`
    border: 1px solid ${I("border")};
    border-radius: ${I("radius")};
    background: ${I("input-bg")};
    color: ${I("text")};
    font-family: inherit;
    &::placeholder { color: ${I("text-muted")}; }
`,P=o=>`
    background: ${I("surface")};
    border: 1px solid ${I("border")};
    border-radius: ${I("radius")};
    box-shadow: ${I("shadow")};
    ${o?.hover?`
    transition: box-shadow 0.2s, border-color 0.2s;
    &:hover { box-shadow: ${I("shadow-elevated")}; }`:""}
`,Ue=b(`
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
`);class Qe extends T{static styles=`
        .tabbar {
            display: flex;
            background: ${i("topbar-bg")};
            padding-bottom: env(safe-area-inset-bottom);

            &.hidden { display: none; }

            & a {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                padding: ${a("sm")} 0 ${a("md")};
                color: rgba(247, 244, 234, 0.55);
                text-decoration: none;
                font-size: 0.7rem;
                font-weight: 600;
                letter-spacing: 0.06em;
                text-transform: uppercase;

                & svg { width: 26px; height: 26px; }

                &.active { color: ${i("accent")}; }
            }
        }
    `;router=this.inject(z);auth=this.inject(Z);render(){return this.wire(Ue,{root:{className:()=>this.auth.currentUser.get()&&this.router.route.get()!=="/login"?"tabbar":"tabbar hidden"},roundsLink:this.router.link("/rounds"),playersLink:this.router.link("/players")})}}function Xe(o){return{async me(){return m({method:"GET",url:`${o}/players/me`})}}}function Ve(o){return{async list(){return m({method:"GET",url:`${o}/clubs`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/clubs/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/clubs`,body:e})},async update(e){return m({method:"POST",url:`${o}/clubs/update`,body:e})},async remove(e){return m({method:"DELETE",url:`${o}/clubs/${e.id}`})}}}function Ye(o){return{async list(){return m({method:"GET",url:`${o}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/courses/by-club${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/courses/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/courses`,body:e})},async update(e){return m({method:"POST",url:`${o}/courses/update`,body:e})},async updateHole(e){return m({method:"POST",url:`${o}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/courses/validate${s?"?"+s:""}`})},async remove(e){return m({method:"DELETE",url:`${o}/courses/${e.id}`})}}}function Je(o){return{async listByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/tees/by-course${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/tees/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/tees`,body:e})},async update(e){return m({method:"POST",url:`${o}/tees/update`,body:e})},async remove(e){return m({method:"DELETE",url:`${o}/tees/${e.id}`})}}}function Ze(o){return{async list(){return m({method:"GET",url:`${o}/guest-players`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/guest-players/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/guest-players`,body:e})}}}function et(o){return{async latest(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/handicap/latest${s?"?"+s:""}`})},async history(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/handicap/history${s?"?"+s:""}`})},async record(e){return m({method:"POST",url:`${o}/handicap/record`,body:e})}}}function tt(o){return{async list(){return m({method:"GET",url:`${o}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/rounds/balls${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/rounds/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/rounds`,body:e})},async createFromDraft(e){return m({method:"POST",url:`${o}/rounds/from-draft`,body:e})},async update(e){return m({method:"POST",url:`${o}/rounds/update`,body:e})},async remove(e){return m({method:"DELETE",url:`${o}/rounds/${e.id}`})}}}function st(o){return{async listByRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/participants/by-round${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/participants/get${s?"?"+s:""}`})},async create(e){return m({method:"POST",url:`${o}/participants`,body:e})},async addPlayer(e){return m({method:"POST",url:`${o}/participants/add-player`,body:e})},async addGuest(e){return m({method:"POST",url:`${o}/participants/add-guest`,body:e})},async listFor(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/participants/players${s?"?"+s:""}`})},async remove(e){return m({method:"DELETE",url:`${o}/participants/${e.id}`})}}}function nt(o){return{async listByRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/score-events/by-round${s?"?"+s:""}`})},async append(e){return m({method:"POST",url:`${o}/score-events`,body:e})}}}function rt(o){return{async forBall(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/scorecards/for-ball${s?"?"+s:""}`})},async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/scorecards/for-round${s?"?"+s:""}`})}}}function ot(o){return{async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/leaderboards/for-round${s?"?"+s:""}`})}}}function it(o){return{async list(){return m({method:"GET",url:`${o}/friendly-rounds`})},async create(e){return m({method:"POST",url:`${o}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/friendly-rounds/by-token${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/friendly-rounds/get${s?"?"+s:""}`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/friendly-rounds/balls${s?"?"+s:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/friendly-rounds/scorecard${s?"?"+s:""}`})},async result(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/friendly-rounds/result${s?"?"+s:""}`})},async score(e){return m({method:"POST",url:`${o}/friendly-rounds/score`,body:e})}}}function at(o){return{async courses(){return m({method:"GET",url:`${o}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return m({method:"GET",url:`${o}/setup/tees/by-course${s?"?"+s:""}`})},async formats(){return m({method:"GET",url:`${o}/setup/formats`})}}}const E="/tapscore/".replace(/\/+$/,"")+"/api",v={players:Xe(E),clubs:Ve(E),courses:Ye(E),tees:Je(E),guestPlayers:Ze(E),handicap:et(E),rounds:tt(E),participants:st(E),scoreEvents:nt(E),scorecards:rt(E),leaderboards:ot(E),friendlyRounds:it(E),setup:at(E)};class lt{loading=new h(!1);error=new h(null);rounds=new h([]);async load(){const e=await x(this.loading,this.error,()=>v.friendlyRounds.list());e&&this.rounds.set(e)}}class Q{loading=new h(!1);error=new h(null);descriptors=new h([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await x(this.loading,this.error,()=>v.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:s.teamSize?.min??2,max:s.teamSize?.max??2},...s.teamCount?{teamCount:s.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}}function ee(o){const e=j.get(Q);return e.load(),e.byId(o.formatId)?.label??`${o.scoringMode} · ${o.teamShape}`}const dt=b(`
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
`),ct=b(`
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
`),ut={not_started:"Not started",active:"Live",complete:"Done"};class le extends T{static styles=`
        .landing {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .landing__head {
                text-align: center;
                margin-bottom: ${a("xl")};

                & .landing__flag { font-size: 2.2rem; line-height: 1; }
                & h1 {
                    margin: ${a("xs")} 0 0;
                    font-family: ${i("font-display")};
                    font-weight: 600;
                    font-size: 2.2rem;
                    letter-spacing: -0.02em;
                    color: ${i("text")};
                }
                & p {
                    margin: ${a("xs")} 0 0;
                    color: ${i("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .landing__create {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: ${a("sm")};
                padding: ${a("lg")};
                margin-bottom: ${a("xl")};
                font-size: 1.1rem;
                font-weight: 700;
                font-family: inherit;
                ${k()}
                background: ${i("primary")};
                color: ${i("primary-text")};
                border: none;
                box-shadow: ${i("shadow-elevated")};
                &:hover { background: ${i("primary")}; }

                & .landing__create-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .landing__section {
                display: flex;
                align-items: baseline;
                gap: ${a("sm")};
                margin-bottom: ${a("sm")};

                & .landing__section-title {
                    font-family: ${i("font-display")};
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: ${i("text")};
                }
                & .landing__count {
                    color: ${i("text-muted")};
                    font-size: 0.85rem;
                }
            }

            & .landing__empty {
                color: ${i("text-muted")};
                font-size: 0.9rem;
                padding: ${a("lg")} 0;

                &.hidden { display: none; }
            }

            & .landing__list {
                display: flex;
                flex-direction: column;
                gap: ${a("sm")};
            }

            & .round-row {
                display: flex;
                flex-direction: column;
                gap: ${a("xs")};
                padding: ${a("md")} ${a("lg")};
                text-align: left;
                font-family: inherit;
                cursor: pointer;
                ${P({hover:!0})}

                & .round-row__top {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    gap: ${a("md")};
                }
                & .round-row__course {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${i("text")};
                }
                & .round-row__status {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    border-radius: ${i("radius-pill")};
                    padding: 2px 10px;
                    flex-shrink: 0;

                    &.s-active { background: ${i("accent-soft")}; color: ${i("accent")}; }
                    &.s-complete { background: ${i("surface-sunken")}; color: ${i("text-muted")}; }
                    &.s-not_started { background: ${i("surface-sunken")}; color: ${i("text-muted")}; }
                }
                & .round-row__bottom {
                    display: flex;
                    justify-content: space-between;
                    gap: ${a("md")};
                    color: ${i("text-muted")};
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
                margin: ${a("2xl")} auto 0;
                padding: ${a("sm")} ${a("lg")};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 600;
                color: ${i("text-muted")};
                text-decoration: underline;
                cursor: pointer;
            }
        }
    `;svc=this.inject(lt);router=this.inject(z);render(){this.svc.load();const e=this.wire(dt,{createBtn:{onclick:()=>this.router.navigate("/create")},signin:{onclick:()=>this.router.navigate("/login")},count:()=>{const t=this.svc.rounds.get().length;return t===0?"":`${t} on the card`},empty:{className:()=>this.svc.rounds.get().length===0?"landing__empty":"landing__empty hidden"}});return this.$each(this.ref(e,"list"),this.svc.rounds,(t,s,n)=>this.wireEl(ct,{row:{onclick:()=>this.router.navigate("/round",{query:{token:t.friendlyRound.shareToken}})},course:()=>t.round.courseNameSnapshot??"Round",status:{textContent:()=>ut[t.round.status]??t.round.status,className:()=>`round-row__status s-${t.round.status}`},date:()=>t.round.date,formats:()=>t.round.formatSlots.map(ee).join(" · ")},n),t=>t.friendlyRound.id),e}}const ht=180,de=4,pt=12;function B(o,e){return e<=0?0:Math.max(0,Math.min(e-1,o))}function mt(o){const{dragDistance:e,velocity:t,itemWidth:s}=o;if(Math.abs(e)<pt)return 0;const n=e+t*ht,r=Math.round(-n/s);return Math.max(-de,Math.min(de,r))}const ft=["1st","2nd","3rd","4th","5th","6th","7th","8th"],M=(o,e)=>`${o}|${e}`;function be(o){return o.players.map(e=>e.displayName).join(" & ")||o.label||"Ball"}function gt(o,e,t){return o?!(o.minPar!==void 0&&e<o.minPar||o.maxPar!==void 0&&e>o.maxPar||o.pars&&!o.pars.includes(e)||o.holes&&!o.holes.includes(t)):!0}class te{loading=new h(!1);error=new h(null);friendlyRound=new h(null);round=new h(null);balls=new h([]);scorecards=new h([]);cells=new h(new Map);result=new h(null);resultLoading=new h(!1);resultError=new h(null);holeIdx=new h(0);groupIdx=new h(0);token=null;async loadByToken(e){const t=e!==this.token;this.token=e,j.get(Q).load();const s=await x(this.loading,this.error,()=>v.friendlyRounds.byToken({token:e}));if(!s)return;this.friendlyRound.set(s.friendlyRound),this.round.set(s.round);const[n,r]=await Promise.all([v.friendlyRounds.balls({token:e}).catch(()=>[]),v.friendlyRounds.scorecard({token:e}).catch(()=>[])]);this.cells.set(new Map),this.scorecards.set(r),this.balls.set(n),t&&(this.holeIdx.set(0),this.groupIdx.set(0),this.result.set(null))}async loadResult(){if(!this.token)return;const e=await x(this.resultLoading,this.resultError,()=>v.friendlyRounds.result({token:this.token}));e&&this.result.set(e)}ballNameById=new $(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,be(t));return e});nameOf(e){return this.ballNameById.get().get(e)??e}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return B(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),s=t?.playHoles.find(l=>l.id===e);if(!t||!s)return"";const n=t.playHoles.filter(l=>l.courseHoleNumber===s.courseHoleNumber).sort((l,d)=>l.ordinal-d.ordinal);if(n.length===1)return`${s.courseHoleNumber}`;const r=n.findIndex(l=>l.id===e);return`${s.courseHoleNumber} (${ft[r]??`${r+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(B(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(B(this.holeIndex()+1,this.playedOrder().length))}strokesFor(e,t){const s=this.cells.get().get(M(e,t));return s?s.strokes:this.scorecards.get().find(l=>l.ballId===e)?.holes.find(l=>l.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(M(e,t))?.status??null}metadataFor(e,t,s){const n=this.cells.get().get(M(e,t));return n&&n.metadata!==void 0?n.metadata?.[s]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[s]}metadataInputs(){const e=j.get(Q),t=this.round.get()?.formatSlots??[],s=[],n=new Set;for(const r of t){const l=e.byId(r.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of l)n.has(d.key)||(n.add(d.key),s.push(d))}return s}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>gt(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,s,n){const r=M(e,t),l=crypto.randomUUID();this.patchCell(r,{strokes:s,metadata:n,status:"saving",clientEventId:l}),await this.post(e,t,s,n,l)}async retry(e,t){const s=M(e,t),n=this.cells.get().get(s);n&&(this.patchCell(s,{...n,status:"saving"}),await this.post(e,t,n.strokes,n.metadata,n.clientEventId))}async post(e,t,s,n,r){if(!this.token)return;const l=M(e,t);try{await v.friendlyRounds.score({token:this.token,ballId:e,playHoleId:t,strokes:s,eventType:s===null?"score_cleared":"score_entered",clientEventId:r,...n!=null?{metadata:n}:{}});const d=this.cells.get().get(l);d&&d.clientEventId===r&&this.patchCell(l,{...d,status:"saved"})}catch{const d=this.cells.get().get(l);d&&d.clientEventId===r&&this.patchCell(l,{...d,status:"error"})}}patchCell(e,t){const s=new Map(this.cells.get());s.set(e,t),this.cells.set(s)}}const R=60,ce=8,Y=4,bt=Array.from({length:Y*2+1},(o,e)=>e-Y),yt="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",_t=b(`
    <div bind="root" class="se hidden">
        <div bind="groupPills" class="se__groups"></div>

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
`),vt=b(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),xt=b(`
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
`),wt=b(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),ue=b(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),$t=b('<button bind="chip" class="se-chip" type="button"></button>');class kt extends T{static styles=`
        .se {
            margin-top: ${a("xl")};
            &.hidden { display: none; }
        }

        .se__groups {
            display: flex;
            gap: ${a("sm")};
            margin-bottom: ${a("md")};
            &.hidden { display: none; }

            & .se__pill {
                border: 1px solid ${i("border")};
                border-radius: ${i("radius-pill")};
                background: ${i("btn-bg")};
                color: ${i("text")};
                font-family: inherit;
                font-size: 0.8rem;
                font-weight: 600;
                padding: ${a("xs")} ${a("md")};
                cursor: pointer;
                &.active { background: ${i("primary")}; color: ${i("primary-text")}; border-color: ${i("primary")}; }
            }
        }

        /* Clipped two-cell carousel right-aligned over the score columns. */
        .se__carousel {
            position: relative;
            height: 60px;
            overflow: hidden;
            border-radius: ${i("radius")};
            background: ${i("surface-sunken")};
            border: 1px solid ${i("border")};
            touch-action: pan-y;
            user-select: none;
        }
        .se__clip {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${ce}px;
            width: ${R*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-Y*R}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${R}px;
            width: ${R}px;
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
                font-family: ${i("font-display")};
                font-weight: 700;
                font-size: 1.2rem;
                color: ${i("text")};
            }
            & .se-hole__par {
                font-size: 0.68rem;
                color: ${i("text-muted")};
            }
        }

        .se__rows {
            margin-top: ${a("sm")};
            border-top: 1px solid ${i("border")};
        }
        .se-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${a("md")};
            padding: ${a("md")} 0;
            border-bottom: 1px solid ${i("border")};

            & .se-row__who { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
            & .se-row__name {
                font-family: ${i("font-display")};
                font-weight: 600;
                font-size: 1.05rem;
                color: ${i("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .se-row__topar { font-size: 0.8rem; font-weight: 600; }

            & .se-row__scores { display: flex; align-items: center; padding-right: ${ce}px; flex-shrink: 0; }
            & .se-row__slot { width: ${R}px; display: flex; align-items: center; justify-content: center; }
            & .se-row__prev {
                font-family: ${i("font-display")}; font-weight: 700; font-size: 1.05rem;
                color: ${i("text-muted")};
                font-variant-numeric: tabular-nums;
            }
            & .se-row__circle {
                width: 48px; height: 48px; border-radius: 999px;
                border: none; cursor: pointer;
                background: ${i("accent-soft")};
                font-family: ${i("font-display")}; font-weight: 700; font-size: 1.25rem;
                color: ${i("primary")};
                font-variant-numeric: tabular-nums;
                transition: background 0.15s;
                &:active { background: ${i("accent")}; }
                &.empty { color: ${i("text-muted")}; background: ${i("surface-sunken")}; }
            }
        }
        .se-row__topar.under { color: ${i("under-par")}; }
        .se-row__topar.over { color: ${i("over-par")}; }
        .se-row__topar.even { color: ${i("text-muted")}; }

        /* --- Fullscreen dark keypad modal --- */
        .se-modal {
            position: fixed; inset: 0; z-index: 50;
            display: flex; flex-direction: column;
            background: #121212; color: #fff;
            &.hidden { display: none; }
        }
        .se-modal__head {
            display: flex; align-items: center; justify-content: space-between;
            padding: ${a("md")} ${a("lg")};
            border-bottom: 1px solid rgba(255,255,255,0.1);

            & .se-modal__close {
                background: none; border: none; color: #fff; font-size: 1.3rem;
                width: 40px; height: 40px; border-radius: 999px; cursor: pointer;
                &:active { background: rgba(255,255,255,0.1); }
            }
            & .se-modal__title { font-family: ${i("font-display")}; font-weight: 700; font-size: 1.1rem; }
            & .se-modal__spacer { width: 40px; }
        }
        .se-modal__list { flex: 1; overflow-y: auto; }
        .se-mrow {
            width: 100%;
            display: flex; align-items: center; justify-content: space-between;
            padding: ${a("lg")};
            background: none; border: none; border-left: 4px solid transparent;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            color: #fff; font-family: inherit; cursor: pointer; text-align: left;

            &.sel { border-left-color: ${i("primary")}; background: rgba(93,155,117,0.14); }

            & .se-mrow__who { display: flex; flex-direction: column; gap: 2px; }
            & .se-mrow__name { font-family: ${i("font-display")}; font-weight: 600; font-size: 1rem; }
            & .se-mrow__hcp { font-size: 0.8rem; color: rgba(255,255,255,0.55); }

            & .se-mrow__circle {
                width: 52px; height: 52px; border-radius: 999px;
                display: flex; align-items: center; justify-content: center;
                background: ${i("primary")};
                font-family: ${i("font-display")}; font-weight: 700; font-size: 1.25rem;
                font-variant-numeric: tabular-nums;
            }
            &.sel .se-mrow__circle { background: #fff; color: ${i("primary")}; }
        }

        .se-pad { position: relative; padding: ${a("sm")} ${a("sm")} ${a("xl")}; background: #1c1c1e; }
        .se-meta {
            display: flex; gap: ${a("sm")}; flex-wrap: wrap;
            padding: 0 2px ${a("sm")};
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
                &.on { background: ${i("primary")}; border-color: ${i("primary")}; color: #fff; }
            }
        }
        .se-pad__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .se-done {
            margin-top: 6px;
            width: 100%;
            height: 52px;
            border: none;
            border-radius: 10px;
            background: ${i("primary")};
            color: #fff;
            font-family: ${i("font-display")};
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
            &.par { background: ${i("primary")}; }
            &.clear { color: ${i("error")}; }
            &.muted { color: rgba(255,255,255,0.5); }

            & .se-key__num { font-size: 1.3rem; font-weight: 700; font-family: ${i("font-display")}; }
            & .se-key__lbl { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.75; margin-top: 1px; }
        }

        .se-pad__ext {
            position: absolute; inset: 0; z-index: 10;
            background: #1c1c1e; display: flex; flex-direction: column;
            padding: ${a("sm")} ${a("sm")} ${a("xl")};
            &.hidden { display: none; }

            & .se-pad__ext-row { flex: 1; display: flex; align-items: center; justify-content: center; gap: ${a("xl")}; }
            & .se-pad__ext-step {
                width: 60px; height: 60px; border-radius: 999px; border: none; cursor: pointer;
                background: #2a2a2a; color: #fff; font-size: 1.8rem; line-height: 1;
                &:active { background: #3a3a3a; }
            }
            & .se-pad__ext-val { width: 72px; text-align: center; font-family: ${i("font-display")}; font-weight: 700; font-size: 2.6rem; color: #fff; }
            & .se-pad__ext-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            & .se-pad__ext-cancel { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: #2a2a2a; color: #fff; font-weight: 600; font-family: inherit; }
            & .se-pad__ext-ok { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: ${i("primary")}; color: #fff; font-size: 1.3rem; }
        }

        .se-toast {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 60;
            background: ${i("primary")}; color: ${i("primary-text")};
            font-family: ${i("font-display")}; font-weight: 700;
            padding: ${a("md")} ${a("xl")}; border-radius: ${i("radius")};
            box-shadow: ${i("shadow-elevated")};
            &.hidden { display: none; }
        }
    `;svc=this.inject(te);holeIdx=this.svc.holeIdx;groupIdx=this.svc.groupIdx;modalOpen=new h(!1);currentBallIdx=new h(0);extendedOpen=new h(!1);extendedScore=new h(10);pendingMeta=new h({});lastMetaKey=null;toastMsg=new h(null);dragOffset=new h(0);transitioning=new h(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new $(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[B(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(s=>[s.id,s]));return e.ballIds.map(s=>t.get(s)).filter(s=>!!s)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>be(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);toParValue=e=>{let t=0,s=0,n=!1;for(const r of this.playedOrder()){const l=this.svc.strokesFor(e.id,r.playHoleId);l!==null&&l>0&&(t+=l,s+=this.parFor(r.playHoleId),n=!0)}return n?t-s:null};toParText=e=>{const t=this.toParValue(e);return t===null?"–":t===0?"E":t>0?`+${t}`:`${t}`};toParClass=e=>{const t=this.toParValue(e);return`se-row__topar ${t===null||t===0?"even":t<0?"under":"over"}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const s=e-t;return s<=-4||s>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(s)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer)}),this.track(y(()=>{const d=this.ballsInGroup().length;d>0&&this.currentBallIdx.get()>=d&&this.currentBallIdx.set(0)}));const e=this.wire(_t,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>this.modalOpen.set(!1)},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const d=this.currentHole();return d?`Hole ${this.occLabel(d.playHoleId)} · Par ${this.parFor(d.playHoleId)}`:""},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},metaDone:{className:()=>this.metaInputs().length>0?"se-done":"se-done hidden",onclick:()=>this.advance()}}),t=this.ref(e,"groupPills");this.track(y(()=>{t.className=this.svc.groups().length>1?"se__groups":"se__groups hidden"})),this.$each(t,new $(()=>this.svc.groups().length>1?this.svc.groups():[]),(d,c,u)=>this.groupPill(c,u),(d,c)=>c);const s=this.ref(e,"viewport"),n=this.ref(e,"track");this.bindCarouselPointer(s,n),this.track(y(()=>{n.style.transition=this.transitioning.get()?yt:"none",n.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(n,new $(()=>bt),(d,c,u)=>this.holeItem(d,u),d=>d),this.$each(this.ref(e,"rows"),new $(()=>{const d=this.playedOrder(),c=this.holeIndex(),u=d[c];if(!u)return[];const f=c>0?d[c-1].playHoleId:null;return this.ballsInGroup().map(p=>({ball:p,ph:u.playHoleId,prevPh:f}))}),(d,c,u)=>this.playerRow(d.ball,d.ph,d.prevPh,u),d=>`${d.ball.id}|${d.ph}`),this.$each(this.ref(e,"modalList"),new $(()=>this.ballsInGroup()),(d,c,u)=>this.modalRow(d,c,u),d=>d.id);const r=this.ref(e,"keys");for(const d of[1,2,3,4,5,6,7,8,9])r.appendChild(this.numberKey(d));r.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),r.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),r.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0)));const l=this.ref(e,"metaRow");return this.track(y(()=>{l.className=this.metaInputs().length>0?"se-meta":"se-meta hidden"})),this.$each(l,new $(()=>this.metaInputs()),(d,c,u)=>this.metaChip(d,u),d=>d.key),this.track(y(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null;return}const d=this.ballsInGroup()[this.currentBallIdx.get()],c=this.currentHole();if(!d||!c)return;const u=`${d.id}|${c.playHoleId}`;if(u===this.lastMetaKey)return;this.lastMetaKey=u;const f={};for(const p of this.metaInputs())f[p.key]=this.svc.metadataFor(d.id,c.playHoleId,p.key)===!0;this.pendingMeta.set(f)})),e}groupPill(e,t){const s=document.createElement("button");return s.type="button",s.textContent=`Group ${e+1}`,s.onclick=()=>{this.groupIdx.set(e),this.holeIdx.set(0),this.currentBallIdx.set(0)},t(y(()=>{s.className=this.groupIdx.get()===e?"se__pill active":"se__pill"})),s}holeItem(e,t){return this.wireEl(vt,{item:{className:()=>{const s=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${s?" gone":""}`}},hnum:{textContent:()=>{const s=this.occAtOffset(e);return s?this.occLabel(s.playHoleId):""}},hpar:{textContent:()=>{const s=this.occAtOffset(e);return s?`Par ${this.parFor(s.playHoleId)}`:""}}},t)}playerRow(e,t,s,n){return this.wireEl(xt,{name:{textContent:this.ballName(e)},topar:{textContent:()=>this.toParText(e),className:()=>this.toParClass(e)},prev:{textContent:()=>s?this.displayScore(this.svc.strokesFor(e.id,s)):""},cval:{textContent:()=>this.displayScore(this.svc.strokesFor(e.id,t))},circle:{className:()=>this.svc.strokesFor(e.id,t)===null?"se-row__circle empty":"se-row__circle",onclick:()=>this.openModalForBall(e.id)}},n)}modalRow(e,t,s){const n=e.players.length>1?`Team · CH ${e.courseHandicap}`:`CH ${e.players[0]?.courseHandicap??e.courseHandicap}`;return this.wireEl(wt,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.currentBallIdx.set(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:n},mval:{textContent:()=>{const r=this.currentHole();return r?this.displayScore(this.svc.strokesFor(e.id,r.playHoleId)):"–"}}},s)}numberKey(e){return this.wireEl(ue,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,s,n){return this.wireEl(ue,{key:{className:s,onclick:n},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(s=>s.id===e);this.currentBallIdx.set(t<0?0:t),this.extendedOpen.set(!1),this.modalOpen.set(!0)}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){const t=this.ballsInGroup(),s=this.currentHole(),n=t[this.currentBallIdx.get()];if(!s||!n)return;const r=e===null?void 0:this.metaSnapshot();this.svc.setScore(n.id,s.playHoleId,e,r),this.metaInputs().length===0&&this.advance()}metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),s={};for(const n of e)s[n.key]=t[n.key]===!0;return s}toggleMeta(e){const t=this.pendingMeta.get();this.pendingMeta.set({...t,[e]:t[e]!==!0});const s=this.ballsInGroup()[this.currentBallIdx.get()],n=this.currentHole();if(!s||!n)return;const r=this.svc.strokesFor(s.id,n.playHoleId);r!==null&&this.svc.setScore(s.id,n.playHoleId,r,this.metaSnapshot())}metaChip(e,t){return this.wireEl($t,{chip:{textContent:e.label,className:()=>this.pendingMeta.get()[e.key]?"se-chip on":"se-chip",onclick:()=>this.toggleMeta(e.key)}},t)}advance(){const e=this.ballsInGroup(),t=this.currentHole();if(!t)return;const s=c=>this.svc.strokesFor(e[c].id,t.playHoleId)!==null,n=this.currentBallIdx.get();for(let c=n+1;c<e.length;c++)if(!s(c))return this.currentBallIdx.set(c);for(let c=0;c<n;c++)if(!s(c))return this.currentBallIdx.set(c);const r=this.playedOrder();if(this.holeIndex()>=r.length-1){this.flash("Round complete"),this.modalOpen.set(!1);return}this.flash(`Hole ${this.occLabel(t.playHoleId)} done`);const d=t.playHoleId;this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===d&&(this.holeIdx.set(B(this.holeIndex()+1,this.playedOrder().length)),this.currentBallIdx.set(0))},700)}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*R),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(B(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",n=>{n.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",n=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:n.pointerId,startX:n.clientX,startY:n.clientY,lastX:n.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(n.pointerId))}),e.addEventListener("pointermove",n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const l=n.clientX-r.startX,d=n.clientY-r.startY;if(!r.horiz){if(Math.abs(d)>Math.abs(l)&&Math.abs(d)>8||Math.abs(l)<=8)return;r.horiz=!0}const c=Date.now(),u=Math.max(1,c-r.lastTime);r.velocity=(n.clientX-r.lastX)/u,r.lastX=n.clientX,r.lastTime=c,this.dragOffset.set(l)});const s=n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const l=n.clientX-r.startX,d=r.horiz;if(this.ptr=null,e.releasePointerCapture?.(n.pointerId),!d){this.dragOffset.set(0);return}this.snap(mt({dragDistance:l,velocity:r.velocity,itemWidth:R}))};e.addEventListener("pointerup",s),e.addEventListener("pointercancel",n=>{!this.ptr||this.ptr.id!==n.pointerId||(this.ptr=null,e.releasePointerCapture?.(n.pointerId),this.snap(0))})}}function w(o){return String(o).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function St(o,e){const t=[...o].sort((r,l)=>r.canonicalOrdinal-l.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(r=>r.playHoleId))}];const s=[...e].sort((r,l)=>r.fromCanonicalOrdinal-l.fromCanonicalOrdinal),n=[];for(const r of s){const l=t.filter(d=>d.canonicalOrdinal>=r.fromCanonicalOrdinal&&d.canonicalOrdinal<=r.toCanonicalOrdinal);l.length!==0&&n.push({label:r.label,holes:l,playHoleIds:new Set(l.map(d=>d.playHoleId))})}return n}function It(o){return o.kind==="si"?"lb-c-si":o.kind==="given"?"lb-c-given":o.kind==="status"?"lb-c-status":""}function Tt(o){return o.kind==="si"||o.kind==="given"?"lb-r-dim":""}function ye(o,e){const t=o.cells.filter(s=>e.has(s.playHoleId));if(o.aggregate==="sum"){const s=t.map(n=>n.value).filter(n=>n!==null);return s.length===0?"—":String(s.reduce((n,r)=>n+r,0))}if(o.aggregate==="last"){for(let s=t.length-1;s>=0;s--){const n=t[s].value;if(n!==null)return Number.isInteger(n)?String(n):n.toFixed(1)}return"—"}return"—"}function Et(o,e){if(o.aggregate==="sum"){const t=o.cells.map(s=>s.value).filter(s=>s!==null);return t.length===0?"—":String(t.reduce((s,n)=>s+n,0))}return o.aggregate==="last"?ye(o,e[e.length-1].playHoleIds):"—"}function Pt(o,e,t){const s=St(o.holes,e),n=s.length>1,l=`<tr><th class="lb-rowlabel">Hole</th>${s.map(g=>g.holes.map(_=>`<th>${w(_.occurrenceLabel)}</th>`).join("")+`<th class="lb-sum">${w(g.label)}</th>`).join("")}${n?'<th class="lb-sum">TOT</th>':""}</tr>`,d=g=>{const _=new Map(g.cells.map(O=>[O.playHoleId,O])),C=O=>g.emphasis?`<strong>${O}</strong>`:O,D=s.map(O=>O.holes.map(we=>{const X=_.get(we.playHoleId),$e=X?.title?` title="${w(X.title)}"`:"";return`<td class="${It(g)}"${$e}>${C(w(X?.display??""))}</td>`}).join("")+`<td class="lb-sum">${C(ye(g,O.playHoleIds))}</td>`).join(""),ve=n?`<td class="lb-sum">${C(Et(g,s))}</td>`:"",xe=g.subjectBallId?`${w(t(g.subjectBallId))} ${w(g.label)}`:w(g.label);return`<tr class="${Tt(g)}"><th class="lb-rowlabel">${xe}</th>${D}${ve}</tr>`},c=o.title.groups.map(g=>g.map(_=>w(t(_))).join(" & ")).join(o.title.joiner),u=o.subtitleFacts.length?`<div class="lb-card__sub">${o.subtitleFacts.map(w).join(" · ")}</div>`:"",f=o.footnotes.length?`<p class="lb-card__notes">${o.footnotes.map(w).join(" · ")}</p>`:"",p=o.totals.length?`<ul class="lb-card__totals">${o.totals.map(g=>`<li>${w(g.label)} = <strong>${g.value??"—"}</strong></li>`).join("")}</ul>`:"";return`<article class="lb-card">
  <header class="lb-card__head"><h4>${c}</h4>${u}</header>
  <div class="lb-card__scroll"><table class="lb-grid">
    <thead>${l}</thead>
    <tbody>${o.rows.map(d).join("")}</tbody>
  </table></div>
  ${f}${p}
</article>`}function Ct(o,e){const t=o.entries.map(s=>`<tr class="${s.position===1?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${s.position}</td>
  <td class="lb-rank__who">${w(s.ballIds.map(e).join(" & "))}</td>
  <td class="lb-rank__total">${s.total??"—"}</td>
  <td class="lb-rank__thru">${s.holesPlayed}</td>
</tr>`).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${w(o.metricLabel)}</h4>
  <table class="lb-rank">
    <thead><tr><th>#</th><th>Player</th><th>Total</th><th>Thru</th></tr></thead>
    <tbody>${t}</tbody>
  </table>
</div>`}function zt(o,e){const t=o.lines.map(s=>{const n=s.segments.map(r=>"text"in r?w(r.text):w(r.ballIds.map(e).join(" & "))).join("");return`<li class="lb-match__line lb-match__line--${s.result}">${n}</li>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${w(o.title)}</h4>
  <ul class="lb-match">${t}</ul>
</div>`}function jt(o){return`<div class="lb-diag">Unrenderable result section <code>${w(o)}</code> — no generic view yet. Results are not hidden.</div>`}function Ot(o,e){return o.leaderboard.length===0&&o.cards.length===0?`<div class="lb-empty">No scores entered yet for ${w(o.formatLabel)}.</div>`:o.leaderboard.map(s=>s.kind==="ranked"?Ct(s,e):s.kind==="match_summary"?zt(s,e):jt(s.kind)).join("")||`<div class="lb-empty">No leaderboard metric for ${w(o.formatLabel)}.</div>`}function Ht(o,e,t){return o.cards.length===0?"":o.cards.map(s=>Pt(s,e,t)).join(`
`)}const Rt=b(`
    <div bind="root" class="lb">
        <div bind="selector" class="lb__selector"></div>
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`),Nt=b('<button bind="pill" class="lb__pill" type="button"></button>');class Lt extends T{static styles=`
        .lb {
            padding: ${a("lg")} ${a("lg")} ${a("2xl")};

            & .lb__selector {
                display: flex;
                gap: ${a("sm")};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: ${a("xs")};
                margin-bottom: ${a("lg")};
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }
                &.hidden { display: none; }
            }
            & .lb__pill {
                flex: 0 0 auto;
                border: 1px solid ${i("border")};
                border-radius: ${i("radius-pill")};
                background: ${i("btn-bg")};
                color: ${i("text")};
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 700;
                padding: ${a("sm")} ${a("lg")};
                cursor: pointer;
                white-space: nowrap;
                &.active { background: ${i("primary")}; color: ${i("primary-text")}; border-color: ${i("primary")}; }
            }

            & .lb__status {
                color: ${i("text-muted")};
                padding: ${a("xl")} 0;
                text-align: center;
                &.hidden { display: none; }
            }

            & .lb-empty {
                color: ${i("text-muted")};
                padding: ${a("xl")} 0;
                text-align: center;
            }
            & .lb-diag {
                ${P()}
                padding: ${a("md")} ${a("lg")};
                color: ${i("error")};
                font-size: 0.85rem;
                margin-bottom: ${a("md")};
                & code { font-family: ui-monospace, monospace; }
            }

            /* Ranked metric + match-summary sections. */
            & .lb-section { margin-bottom: ${a("xl")}; }
            & .lb-section__title {
                margin: 0 0 ${a("sm")};
                font-family: ${i("font-display")};
                font-weight: 600;
                font-size: 1rem;
                color: ${i("text")};
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
                color: ${i("text-muted")};
                font-weight: 700;
                padding: ${a("xs")} ${a("sm")};
                border-bottom: 1px solid ${i("border")};
            }
            & .lb-rank tbody td {
                padding: ${a("sm")};
                border-bottom: 1px solid ${i("border")};
                font-size: 0.95rem;
            }
            & .lb-rank__pos { width: 2rem; font-weight: 700; color: ${i("text-muted")}; }
            & .lb-rank__who { font-weight: 600; font-family: ${i("font-display")}; }
            & .lb-rank__total { text-align: right; font-weight: 700; }
            & .lb-rank__thru { text-align: right; width: 3rem; color: ${i("text-muted")}; }
            & .lb-rank__lead td { background: ${i("accent-soft")}; }
            & .lb-rank__lead .lb-rank__pos { color: ${i("accent")}; }

            & .lb-match { list-style: none; margin: 0; padding: 0; }
            & .lb-match__line {
                padding: ${a("sm")} ${a("md")};
                border-bottom: 1px solid ${i("border")};
                font-size: 0.95rem;
            }
            & .lb-match__line--won { font-weight: 700; color: ${i("primary")}; }
            & .lb-match__line--lost { color: ${i("text-muted")}; }
            & .lb-match__line--halved { color: ${i("text")}; }

            /* Format-aware scorecard cards. */
            & .lb-cards__head {
                margin: ${a("xl")} 0 ${a("md")};
                font-family: ${i("font-display")};
                font-weight: 600;
                font-size: 1.1rem;
                color: ${i("text")};
            }
            & .lb-card {
                ${P()}
                padding: ${a("md")};
                margin-bottom: ${a("lg")};
            }
            & .lb-card__head { margin-bottom: ${a("sm")}; }
            & .lb-card__head h4 {
                margin: 0;
                font-family: ${i("font-display")};
                font-weight: 600;
                font-size: 1rem;
                color: ${i("text")};
            }
            & .lb-card__sub { font-size: 0.75rem; color: ${i("text-muted")}; margin-top: 2px; }
            & .lb-card__scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            & .lb-grid {
                border-collapse: collapse;
                font-variant-numeric: tabular-nums;
                font-size: 0.8rem;
                white-space: nowrap;
            }
            & .lb-grid th, & .lb-grid td {
                padding: 3px 6px;
                text-align: center;
                border-bottom: 1px solid ${i("border")};
            }
            & .lb-grid thead th {
                font-size: 0.7rem;
                color: ${i("text-muted")};
                font-weight: 700;
            }
            & .lb-grid .lb-rowlabel {
                text-align: left;
                position: sticky;
                left: 0;
                background: ${i("surface")};
                font-weight: 600;
                color: ${i("text")};
            }
            & .lb-grid .lb-sum { font-weight: 700; background: ${i("surface-sunken")}; }
            & .lb-grid .lb-r-dim td, & .lb-grid .lb-r-dim th { color: ${i("text-muted")}; }
            & .lb-grid .lb-c-si { color: ${i("text-muted")}; font-size: 0.7rem; }
            & .lb-card__notes { margin: ${a("sm")} 0 0; font-size: 0.72rem; color: ${i("text-muted")}; }
            & .lb-card__totals {
                list-style: none; margin: ${a("sm")} 0 0; padding: 0;
                display: flex; flex-wrap: wrap; gap: ${a("md")};
                font-size: 0.85rem; color: ${i("text")};
            }
        }
    `;svc=this.inject(te);selected=new h(0);slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots();return e[this.selected.get()]??e[0]??null};render(){this.track(y(()=>{const s=this.slots().length;s>0&&this.selected.get()>=s&&this.selected.set(0)}));const e=this.wire(Rt,{status:{className:()=>{const s=this.svc.resultLoading.get(),n=this.svc.result.get()===null;return s||n?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody()}}),t=this.ref(e,"selector");return this.track(y(()=>{t.className=this.slots().length>1?"lb__selector":"lb__selector hidden"})),this.$each(t,new $(()=>this.slots().length>1?this.slots():[]),(s,n,r)=>this.slotPill(s,n,r),s=>s.slotDefId),e}slotPill(e,t,s){return this.wireEl(Nt,{pill:{textContent:e.formatLabel,className:()=>this.selected.get()===t?"lb__pill active":"lb__pill",onclick:()=>this.selected.set(t)}},s)}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const s=d=>this.svc.nameOf(d),n=Ot(t,s),r=Ht(t,e.routeSections,s),l=r?`<h3 class="lb-cards__head">Scorecard</h3>${r}`:"";return n+l}}const Mt=b(`
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
`);class Bt extends T{static styles=`
        .round-view {
            height: 100%;
            display: flex;
            flex-direction: column;

            & .round-view__main {
                flex: 1;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                padding: ${a("lg")} ${a("lg")} ${a("2xl")};
            }

            & .round-view__back {
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 600;
                color: ${i("text-muted")};
                cursor: pointer;
                padding: ${a("xs")} 0;
                margin-bottom: ${a("md")};
            }

            & .round-view__notfound {
                color: ${i("text-muted")};
                padding: ${a("xl")} 0;

                &.hidden { display: none; }
            }

            & .round-view__body.hidden { display: none; }
            & .round-view__panel.hidden { display: none; }

            & .round-view__head {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                gap: ${a("md")};

                & h1 {
                    margin: 0;
                    font-family: ${i("font-display")};
                    font-weight: 600;
                    font-size: 1.8rem;
                    letter-spacing: -0.02em;
                    color: ${i("text")};
                }
            }

            & .round-view__status {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                border-radius: ${i("radius-pill")};
                padding: 2px 10px;
                flex-shrink: 0;
                background: ${i("accent-soft")};
                color: ${i("accent")};
            }

            & .round-view__meta {
                display: flex;
                gap: ${a("md")};
                margin-top: ${a("xs")};
                color: ${i("text-muted")};
                font-size: 0.9rem;
            }

            & .round-view__formats {
                margin-top: ${a("lg")};
                display: flex;
                flex-wrap: wrap;
                gap: ${a("sm")};

                & .fmt {
                    ${P()}
                    padding: ${a("xs")} ${a("md")};
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: ${i("text")};
                }
            }

            & .round-view__share {
                margin-top: ${a("2xl")};
                padding: ${a("lg")};
                ${P()}
                background: ${i("surface-sunken")};

                & .round-view__share-label {
                    font-weight: 700;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: ${i("text-muted")};
                }
                & .round-view__share-row {
                    display: flex;
                    gap: ${a("sm")};
                    margin-top: ${a("sm")};
                }
                & .round-view__share-url {
                    flex: 1;
                    ${H()}
                    font-size: 0.8rem;
                    color: ${i("text-muted")};
                }
                & .round-view__copy {
                    ${k()}
                    padding: 0 ${a("lg")};
                    font-weight: 700;
                    background: ${i("primary")};
                    color: ${i("primary-text")};
                    border: none;
                }
                & .round-view__share-hint {
                    margin: ${a("sm")} 0 0;
                    font-size: 0.8rem;
                    color: ${i("text-muted")};
                }
            }
        }

        /* --- Pinned bottom dock: orange hole bar + Score/Leaderboard tabs --- */
        .round-view__dock {
            flex: 0 0 auto;
            box-shadow: ${i("shadow-elevated")};
            &.hidden { display: none; }
        }

        .round-hole {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${a("md")};
            background: ${i("hole-bar")};
            color: ${i("hole-bar-text")};
            padding: ${a("sm")} ${a("lg")};

            &.hidden { display: none; }

            & .round-hole__nav {
                flex: 0 0 auto;
                width: 40px;
                height: 40px;
                border: none;
                border-radius: ${i("radius-pill")};
                background: rgba(0, 0, 0, 0.1);
                color: inherit;
                font-size: 1.5rem;
                line-height: 1;
                cursor: pointer;
                &:active { background: rgba(0, 0, 0, 0.2); }
                &:disabled { opacity: 0.35; cursor: default; }
            }

            & .round-hole__stats { display: flex; gap: ${a("2xl")}; }
            & .round-hole__stat { display: flex; flex-direction: column; align-items: center; }
            & .round-hole__lbl {
                font-size: 0.62rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                opacity: 0.8;
            }
            & .round-hole__val {
                font-family: ${i("font-display")};
                font-weight: 700;
                font-size: 1.4rem;
                font-variant-numeric: tabular-nums;
            }
        }

        .round-tabs {
            display: flex;
            background: ${i("topbar-bg")};
            padding-bottom: env(safe-area-inset-bottom);

            & .round-tabs__tab {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 3px;
                padding: ${a("sm")} 0 ${a("md")};
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
                &.active { color: ${i("accent")}; }
            }
        }
    `;svc=this.inject(te);router=this.inject(z);tokenQ=this.router.query("token");tab=new h("score");hasRound=new $(()=>this.svc.round.get()!==null);hasScoring=new $(()=>this.svc.balls.get().length>0);shareUrl=new $(()=>{const e=this.tokenQ.get();return e?`${location.origin}/round?token=${e}`:""});render(){this.track(y(()=>{const s=this.tokenQ.get();s&&this.svc.loadByToken(s)}));const e={not_started:"Not started",active:"Live",complete:"Done"},t=this.wire(Mt,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},course:()=>this.svc.round.get()?.courseNameSnapshot??"Round",status:()=>{const s=this.svc.round.get()?.status??"not_started";return e[s]??s},date:()=>this.svc.round.get()?.date??"",route:()=>{const s=this.svc.round.get();return s?`${s.playHoles.length} holes`:""},formats:{innerHTML:()=>(this.svc.round.get()?.formatSlots??[]).map(s=>`<span class="fmt">${ee(s)}</span>`).join("")},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},dock:{className:()=>this.hasRound.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const s=this.svc.currentPlayedHole();return s?this.svc.occLabel(s.playHoleId):""},holeSi:()=>{const s=this.svc.currentPlayHole()?.baseStrokeIndex;return s!=null?String(s):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});return this.spawn(kt,this.ref(t,"scoring")),this.spawn(Lt,this.ref(t,"leaderboard")),t}}function N(o){return typeof o=="object"&&o!==null&&typeof o.get=="function"}const S=o=>`var(--${o})`,se=class se extends T{constructor(){super(...arguments),this.open=new h(!1),this.highlightIndex=new h(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const s=document.createElement("span");s.className="ui-select__trigger-label",this.triggerEl.appendChild(s);const n=document.createElement("span");n.className="ui-select__chevron",n.textContent="▾",n.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(n),this.triggerEl.addEventListener("click",l=>{l.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",l=>{this.handleTriggerKeydown(l)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.setAttribute("role","listbox"),this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",l=>{this.handleDropdownKeydown(l)}),e.appendChild(this.dropdownEl);const r=l=>{this.optionEls=[],this.dropdownEl.textContent="";for(let d=0;d<l.length;d++){const c=l[d],u=document.createElement("button");if(u.className="ui-select__option",u.setAttribute("type","button"),u.setAttribute("role","option"),u.id=`ui-select-opt-${d}`,c.icon){const g=document.createElement("span");g.className="ui-select__option-icon",g.textContent=c.icon,u.appendChild(g)}const f=document.createElement("span");f.className="ui-select__option-label",f.textContent=c.label,u.appendChild(f);const p=document.createElement("span");p.className="ui-select__check",p.setAttribute("aria-hidden","true"),u.appendChild(p),u.addEventListener("click",g=>{g.stopPropagation(),this.selectOption(c.value)}),u.addEventListener("mouseenter",()=>{this.highlightIndex.set(d)}),this.dropdownEl.appendChild(u),this.optionEls.push(u)}};return N(this.props.options)?this.track(y(()=>{const l=N(this.props.options)?this.props.options.get():this.props.options;r(l)})):r(this.props.options),this.track(y(()=>{const l=this.props.value.get(),d=N(this.props.options)?this.props.options.get():this.props.options,c=d.find(u=>u.value===l);c?(s.textContent=c.icon?`${c.icon} ${c.label}`:c.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder")):(s.textContent=this.props.placeholder??"",this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!this.props.placeholder));for(let u=0;u<d.length;u++){const f=this.optionEls[u];if(!f)continue;const p=d[u].value===l;f.setAttribute("aria-selected",String(p)),f.classList.toggle("ui-select__option--selected",p);const g=f.querySelector(".ui-select__check");g&&(g.textContent=p?"✓":"")}})),this.track(y(()=>{const l=this.open.get();if(this.dropdownEl.classList.toggle("open",l),n.classList.toggle("ui-select__chevron--open",l),this.triggerEl.setAttribute("aria-expanded",String(l)),l?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),l){const d=N(this.props.options)?this.props.options.get():this.props.options,c=this.props.value.get(),u=d.findIndex(f=>f.value===c);this.highlightIndex.set(u>=0?u:0)}})),this.track(y(()=>{const l=this.highlightIndex.get();for(let d=0;d<this.optionEls.length;d++)this.optionEls[d].classList.toggle("ui-select__option--highlighted",d===l);l>=0&&this.optionEls[l]&&(this.triggerEl.setAttribute("aria-activedescendant",`ui-select-opt-${l}`),this.optionEls[l].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(N(this.props.disabled)?this.track(y(()=>{const l=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",l),this.triggerEl.disabled=l})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}selectOption(e){G(()=>{this.props.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.toggle();break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":{e.preventDefault();const t=this.highlightIndex.get(),s=N(this.props.options)?this.props.options.get():this.props.options;t>=0&&t<s.length&&this.selectOption(s[t].value);break}case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=N(this.props.options)?this.props.options.get():this.props.options;if(t.length===0)return;let n=this.highlightIndex.get()+e;n<0&&(n=t.length-1),n>=t.length&&(n=0),this.highlightIndex.set(n)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};se.styles=`
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
            border: 1px solid ${S("border")};
            border-radius: ${S("radius")};
            background: ${S("input-bg")};
            color: ${S("text")};
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
        }
        .ui-select__trigger:focus-visible {
            outline: 2px solid ${S("primary")};
            outline-offset: 1px;
        }
        .ui-select__trigger--placeholder {
            color: ${S("text-muted")};
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
            color: ${S("text-muted")};
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
            background: ${S("surface")};
            border: 1px solid ${S("border")};
            border-radius: ${S("radius")};
            box-shadow: ${S("shadow-elevated")};
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
            color: ${S("text")};
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
            background: ${S("hover-bg")};
        }
        .ui-select__option--selected {
            color: ${S("primary")};
            font-weight: 600;
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
            color: ${S("primary")};
        }
    `;let J=se;function _e(o){return o.handicapIndex*(o.slope/113)+(o.courseRating-o.par)}function Ft(o){return Math.round(_e(o))}const Dt=["scramble","greensomes","foursomes"],At="ABCDEFGH",qt={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class Gt{loading=new h(!1);error=new h(null);courses=new h([]);tees=new h([]);courseId=new h("");preset=new h("full_18");startHole=new h(1);players=new h([]);teams=new h([]);formatSlots=new h([]);submitting=new h(!1);diagnostics=new h([]);submitError=new h(null);catalog=j.get(Q);nextKey=1;nextSlotKey=1;nextTeamKey=1;async load(){this.catalog.load().then(()=>this.ensureDefaultSlot());const e=await x(this.loading,this.error,()=>v.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const s=await x(this.loading,this.error,()=>v.setup.teesByCourse({courseId:e}))??[];this.tees.set(s);const n=new Set(s.map(l=>l.id)),r=s[0]?.id??"";this.players.set(this.players.get().map(l=>({...l,teeId:n.has(l.teeId)?l.teeId:r}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}])}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e))}patchPlayer(e,t){this.players.set(this.players.get().map(s=>s.key===e?{...s,...t}:s))}ensureDefaultSlot(){if(this.formatSlots.get().length>0)return;const e=this.catalog.byId("stableford_individual")??this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",s={key:this.nextSlotKey++,formatId:t,subjectPlayers:{},subjectTeams:{}};this.formatSlots.set([...this.formatSlots.get(),s])}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(s=>s.key===e?{...s,...t}:s))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return At[e]??`T${e+1}`}formations=Dt;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,formation:"scramble",pctByPlayer:{}}])}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e)),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const s={...t.subjectTeams};return delete s[e],{...t,subjectTeams:s}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.teams.get().findIndex(s=>s.key===e.key);return`Team ${this.teamLetter(Math.max(0,t))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,formation:t}:s))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,s){const n=this.teamByKey(e);if(!n)return;const r={...n.pctByPlayer};s?r[t]=r[t]??"100":delete r[t],this.teams.set(this.teams.get().map(l=>l.key===e?{...l,pctByPlayer:r}:l))}setTeamPct(e,t,s){const n=this.teamByKey(e);!n||n.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(r=>r.key===e?{...r,pctByPlayer:{...r.pctByPlayer,[t]:s}}:r))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectPlayers:{...n.subjectPlayers,[t]:s}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectTeams:{...n.subjectTeams,[t]:s}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return qt[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,s)=>t-s);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1)}derivedCH(e){const t=Number.parseFloat(e.handicapIndex);if(!Number.isFinite(t))return null;const s=this.teeById(e.teeId);if(!s)return null;const n=s.ratings.find(l=>l.gender===e.gender);if(!n)return null;const r={handicapIndex:t,slope:n.slope,courseRating:n.courseRating,par:n.par};return{ch:Ft(r),raw:_e(r),rating:n,teeName:s.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const s of this.formatSlots.get()){for(const n of e)s.subjectPlayers[n.key]!==!1&&t.add(n.key);for(const n of this.teams.get())if(s.subjectTeams[n.key]===!0)for(const r of e)n.pctByPlayer[r.key]!==void 0&&t.add(r.key)}return e.filter(s=>!t.has(s.key))}diagnosticsForFormat(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`formats[${e}]`))}generalDiagnostics(){return this.diagnostics.get().filter(e=>!e.path?.startsWith("producers[")&&!e.path?.startsWith("formats["))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const s=[];for(const n of this.teams.get()){const r=e.filter(l=>n.pctByPlayer[l.key]!==void 0).map(l=>({producerDefId:t.get(l.key),allowancePct:this.parsePct(n.pctByPlayer[l.key])}));r.length>0&&s.push({id:String(n.key),label:this.teamLabel(n),formation:n.formation,members:r})}return s}buildFormats(e,t){const s=new Set(this.teams.get().filter(n=>Object.keys(n.pctByPlayer).length>0).map(n=>n.key));return this.formatSlots.get().map(n=>{const r=[];for(const l of e)n.subjectPlayers[l.key]!==!1&&r.push({kind:"player",producerDefId:t.get(l.key)});for(const l of this.teams.get())n.subjectTeams[l.key]===!0&&s.has(l.key)&&r.push({kind:"team",teamId:String(l.key)});return{formatId:n.formatId,subjects:r}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),s=e.indexOf(t);return s<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(s),...e.slice(0,s)].map(r=>({courseHoleNumber:r})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];if(e.forEach((s,n)=>{s.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${n}].name`}),Number.isFinite(Number.parseFloat(s.handicapIndex))||t.push({code:"missing_index",message:"Handicap index required",path:`producers[${n}].handicapIndex`}),s.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${n}].teeId`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};this.submitting.set(!0);try{const s=[];for(let f=0;f<e.length;f++){const p=e[f],g=Number.parseFloat(p.handicapIndex),_=await v.guestPlayers.create({displayName:p.name.trim(),gender:p.gender,handicapIndex:g});s.push({producerDefId:`p${f+1}`,playerRef:{kind:"guest",id:_.id},handicapIndex:g,gender:p.gender,teeId:p.teeId})}const{roundType:n,route:r}=this.buildRoute(),l=new Map;e.forEach((f,p)=>l.set(f.key,`p${p+1}`));const d=this.buildTeams(e,l),c={courseId:this.courseId.get(),playedAt:new Date().toISOString().slice(0,10),roundType:n,...r?{route:r}:{},producers:s,...d.length>0?{teams:d}:{},formats:this.buildFormats(e,l)},u=await v.friendlyRounds.create({draft:c});return u.ok?{ok:!0,token:u.friendlyRound.shareToken}:(this.diagnostics.set(u.diagnostics),{ok:!1})}catch(s){return this.submitError.set(s instanceof F?s.message:"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}const Wt=["full_18","front_9","back_9"],Kt=b(`
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
`),Ut=b(`
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
`),Qt=b(`
    <div class="fslot">
        <div class="fslot__top">
            <div bind="format" class="fslot__format"></div>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <p bind="desc" class="fslot__desc"></p>

        <div class="fslot__group">
            <span class="fslot__label">Scores</span>
            <div bind="subjectRows" class="fslot__teamrows"></div>
        </div>

        <div bind="err" class="fslot__err"></div>
    </div>
`),Xt=b(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),Vt=b(`
    <div class="fslot">
        <div class="fslot__top">
            <div bind="formation" class="fslot__format"></div>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <div class="fslot__group">
            <span class="fslot__label">Members &amp; allowance</span>
            <div bind="memberRows" class="fslot__teamrows"></div>
        </div>
    </div>
`),Yt=b(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class Jt extends T{static styles=`
        .setup {
            padding: ${a("lg")} ${a("lg")} ${a("2xl")};

            & .setup__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${i("text-muted")};
                cursor: pointer; padding: ${a("xs")} 0; margin-bottom: ${a("md")};
            }

            & .setup__head {
                margin-bottom: ${a("xl")};
                & h1 {
                    margin: 0; font-family: ${i("font-display")}; font-weight: 600;
                    font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${i("text-muted")}; font-size: 0.9rem; }
            }

            & .setup__section {
                margin-bottom: ${a("xl")};
                & h2 {
                    margin: 0 0 ${a("sm")}; font-family: ${i("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .setup__hint { margin: 0 0 ${a("md")}; color: ${i("text-muted")}; font-size: 0.82rem; }

            & .setup__note {
                margin: ${a("sm")} 0 0; font-size: 0.82rem; color: ${i("text-muted")};
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
                display: flex; gap: ${a("sm")}; margin-bottom: ${a("md")};
                & button {
                    flex: 1; padding: ${a("md")} 0; ${k()}
                    font-family: inherit; font-weight: 700; font-size: 0.9rem;
                    &.on { background: ${i("primary")}; color: ${i("primary-text")}; border-color: ${i("primary")}; }
                }
            }

            & .setup__startrow {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${a("md")}; font-size: 0.9rem; color: ${i("text-muted")};
            }

            & .setup__players { display: flex; flex-direction: column; gap: ${a("md")}; }

            & .player {
                padding: ${a("md")}; ${P()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .player__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .player__name { flex: 1; padding: ${a("md")}; font-size: 1rem; ${H()} }
                & .player__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${k()}
                    font-size: 1rem; color: ${i("text-muted")};
                }
                & .player__fields { display: flex; gap: ${a("sm")}; align-items: stretch; }
                & .player__index { flex: 1; min-width: 0; padding: ${a("md")}; font-size: 1rem; ${H()} }
                & .player__gender { width: 72px; flex-shrink: 0; font-size: 1rem; }
                & .player__tee { flex: 1; min-width: 0; font-size: 1rem; }

                & .player__ch {
                    font-size: 0.82rem; color: ${i("text-muted")}; font-variant-numeric: tabular-nums;
                    &:empty { display: none; }
                }
                & .player__err {
                    font-size: 0.82rem; color: ${i("error")};
                    &:empty { display: none; }
                }
            }

            & .setup__add {
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")}; ${k()}
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }

            & .setup__banner {
                color: ${i("error")}; font-size: 0.875rem; margin-bottom: ${a("md")};
                white-space: pre-line;
                &:empty { display: none; }
            }

            & .setup__fslots { display: flex; flex-direction: column; gap: ${a("md")}; }

            & .fslot {
                padding: ${a("md")}; ${P()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .fslot__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .fslot__format { flex: 1; min-width: 0; font-size: 1rem; }
                & .fslot__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${k()}
                    font-size: 1rem; color: ${i("text-muted")};
                }
                & .fslot__desc {
                    margin: 0; font-size: 0.8rem; color: ${i("text-muted")};
                    &:empty { display: none; }
                }

                & .fslot__group {
                    display: flex; flex-direction: column; gap: ${a("xs")};
                    &[hidden] { display: none; }
                }
                & .fslot__label {
                    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em;
                    text-transform: uppercase; color: ${i("text-muted")};
                }

                & .fslot__teamrows { display: flex; flex-direction: column; gap: ${a("xs")}; }
                & .trow {
                    display: flex; align-items: center; justify-content: space-between; gap: ${a("sm")};
                    & .trow__name { font-size: 0.9rem; }
                    & .trow__team { width: 96px; flex-shrink: 0; font-size: 0.95rem; }
                }

                & .irow {
                    display: flex; align-items: center; gap: ${a("sm")};
                    font-size: 0.9rem; cursor: pointer;
                    & .irow__chk { width: 18px; height: 18px; flex-shrink: 0; accent-color: ${i("primary")}; }
                }

                & .mrow {
                    display: flex; align-items: center; justify-content: space-between; gap: ${a("sm")};
                    & .mrow__pick { display: flex; align-items: center; gap: ${a("sm")}; font-size: 0.9rem; cursor: pointer; }
                    & .mrow__pct {
                        display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
                        font-size: 0.85rem; color: ${i("text-muted")};
                        &[hidden] { display: none; }
                        & input { width: 56px; padding: ${a("xs")} ${a("sm")}; ${H()} font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${a("xs")};
                    & button {
                        flex: 1; padding: ${a("sm")} 0; ${k()}
                        font-family: inherit; font-weight: 700; font-size: 0.82rem;
                        &.on { background: ${i("primary")}; color: ${i("primary-text")}; border-color: ${i("primary")}; }
                    }
                }
                & .fslot__flat {
                    display: flex; align-items: center; gap: ${a("xs")}; font-size: 0.9rem;
                    color: ${i("text-muted")};
                    &[hidden] { display: none; }
                    & .fslot__pct { width: 70px; padding: ${a("sm")}; font-size: 1rem; ${H()} }
                }
                & .fslot__bands {
                    display: flex; flex-direction: column; gap: ${a("xs")};
                    &[hidden] { display: none; }
                }
                & .fslot__bandrows { display: flex; flex-direction: column; gap: ${a("xs")}; }
                & .brow {
                    display: flex; align-items: center; gap: ${a("xs")};
                    font-size: 0.82rem; color: ${i("text-muted")};
                    & .brow__pct, & .brow__upto { width: 56px; padding: ${a("sm")}; font-size: 0.95rem; ${H()} }
                    & .brow__del { margin-left: auto; width: 30px; height: 30px; ${k()} font-size: 0.8rem; color: ${i("text-muted")}; }
                }
                & .fslot__addband {
                    align-self: flex-start; padding: ${a("xs")} ${a("sm")}; ${k()}
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                }

                & .fslot__err {
                    font-size: 0.82rem; color: ${i("error")};
                    &:empty { display: none; }
                }
            }

            & .setup__create {
                width: 100%; padding: ${a("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit; ${k()}
                background: ${i("primary")}; color: ${i("primary-text")}; border: none;
                box-shadow: ${i("shadow-elevated")};
                &:hover { background: ${i("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;svc=this.inject(Gt);router=this.inject(z);render(){this.svc.load();const e=this.wire(Kt,{back:{onclick:()=>this.router.navigate("/")},addPlayer:{onclick:()=>this.svc.addPlayer()},addTeam:{onclick:()=>this.svc.addTeam()},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const s=this.svc.playersInNoFormat();return s.length===0?"":`Heads up: ${s.map(r=>r.name.trim()||"A player").join(", ")} ${s.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.generalDiagnostics().map(n=>n.message),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?"Creating…":"Create round",onclick:async()=>{const s=await this.svc.submit();s.ok&&this.router.navigate("/round",{query:{token:s.token}})}}});this.$each(this.ref(e,"presets"),()=>Wt,(s,n,r)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(s),className:()=>this.svc.preset.get()===s?"on":"",onclick:()=>this.svc.setPreset(s)}},r),s=>s);const t=s=>this.track(s);return this.mountSelect(this.ref(e,"course"),t,{value:this.bound(t,()=>this.svc.courseId.get(),s=>{s&&s!==this.svc.courseId.get()&&this.svc.selectCourse(s)}),options:{get:()=>this.svc.courses.get().map(s=>({value:s.id,label:s.name}))},placeholder:"Select a course"}),this.mountSelect(this.ref(e,"startHole"),t,{value:this.bound(t,()=>String(this.svc.startHole.get()),s=>this.svc.startHole.set(Number(s))),options:{get:()=>this.svc.startHoleOptions().map(s=>({value:String(s),label:String(s)}))}}),this.$each(this.ref(e,"players"),this.svc.players,(s,n,r)=>this.playerRow(s.key,r),s=>s.key),this.$each(this.ref(e,"teams"),this.svc.teams,(s,n,r)=>this.teamCard(s.key,r),s=>s.key),this.$each(this.ref(e,"formats"),this.svc.formatSlots,(s,n,r)=>this.formatCard(s.key,n,r),s=>s.key),e}mountSelect(e,t,s){const n=new J(s);n.mount(e),t(()=>n.destroy())}bound(e,t,s){const n=new h(t());return e(y(()=>n.set(t()))),e(y(()=>{const r=n.get();queueMicrotask(()=>s(r))})),n}eachInto(e,t,s,n,r){const l=new Map,d=new Map;t(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),t(y(()=>{const c=s(),u=new Map;for(const[p,g]of c.entries()){const _=r(g,p);if(l.has(_))u.set(_,l.get(_));else{const C=[];u.set(_,n(g,p,D=>C.push(D))),d.set(_,C)}}for(const[p,g]of l)u.has(p)||(g.remove(),d.get(p)?.forEach(_=>_()),d.delete(p));let f=e.firstChild;for(const p of u.values())p===f?f=f.nextSibling:e.insertBefore(p,f);l.clear();for(const[p,g]of u)l.set(p,g)}))}formatCard(e,t,s){const n=()=>this.svc.slotByKey(e),r=()=>n()?.formatId??"",l=this.wireEl(Qt,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(r())?.description??""},err:{textContent:()=>this.svc.diagnosticsForFormat(t).map(c=>c.message).join(" · ")}},s);this.mountSelect(this.ref(l,"format"),s,{value:this.bound(s,()=>r(),c=>{c&&c!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,c)}),options:{get:()=>this.svc.catalog.descriptors.get().map(c=>({value:c.id,label:c.label}))}});const d=()=>[...this.svc.players.get().map(c=>({kind:"player",subKey:c.key})),...this.svc.teams.get().map(c=>({kind:"team",subKey:c.key}))];return this.eachInto(this.ref(l,"subjectRows"),s,d,(c,u,f)=>this.subjectRow(e,c.kind,c.subKey,f),c=>`${c.kind}${c.subKey}`),l}subjectRow(e,t,s,n){const r=()=>{if(t==="player")return this.svc.players.get().find(u=>u.key===s)?.name?.trim()||"Player";const c=this.svc.teamByKey(s);return c?`${this.svc.teamLabel(c)} (team)`:"Team"},l=()=>t==="player"?this.svc.subjectPlayerIn(e,s):this.svc.subjectTeamIn(e,s),d=c=>t==="player"?this.svc.setSubjectPlayer(e,s,c):this.svc.setSubjectTeam(e,s,c);return this.wireEl(Xt,{chk:{checked:()=>l(),onchange:c=>d(c.target.checked)},name:{textContent:()=>r()}},n)}teamCard(e,t){const s=this.wireEl(Vt,{remove:{onclick:()=>this.svc.removeTeam(e)}},t);return this.mountSelect(this.ref(s,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",n=>this.svc.setTeamFormation(e,n)),options:{get:()=>this.svc.formations.map(n=>({value:n,label:n[0].toUpperCase()+n.slice(1)}))}}),this.eachInto(this.ref(s,"memberRows"),t,()=>this.svc.players.get(),(n,r,l)=>this.teamMemberRow(e,n.key,l),n=>n.key),s}teamMemberRow(e,t,s){const n=()=>this.svc.players.get().find(l=>l.key===t)??null,r=()=>this.svc.teamMemberIn(e,t);return this.wireEl(Yt,{chk:{checked:()=>r(),onchange:l=>this.svc.setTeamMember(e,t,l.target.checked)},name:{textContent:()=>n()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!r()},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:l=>this.svc.setTeamPct(e,t,l.target.value)}},s)}playerRow(e,t){const s=()=>this.svc.players.get().find(l=>l.key===e)??null,n=()=>this.svc.players.get().findIndex(l=>l.key===e),r=this.wireEl(Ut,{name:{oninput:l=>this.svc.patchPlayer(e,{name:l.target.value})},index:{oninput:l=>this.svc.patchPlayer(e,{handicapIndex:l.target.value})},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const l=s();if(!l)return"";const d=this.svc.derivedCH(l);if(!d)return"";const c=d.rating;return`Course handicap ${d.ch}  ·  ${l.handicapIndex} × ${c.slope}/113 + (${c.courseRating} − ${c.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(n()).map(l=>l.message).join(" · ")}},t);return this.mountSelect(this.ref(r,"gender"),t,{value:this.bound(t,()=>s()?.gender??"M",l=>this.svc.patchPlayer(e,{gender:l})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]}}),this.mountSelect(this.ref(r,"tee"),t,{value:this.bound(t,()=>s()?.teeId??"",l=>this.svc.patchPlayer(e,{teeId:l})),options:{get:()=>this.svc.tees.get().map(l=>({value:l.id,label:l.name}))},placeholder:"Tee"}),r}}const Zt=b(`
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
`);class es extends T{static styles=`
        .login {
            max-width: 340px;
            margin: 0 auto;
            padding: 18vh ${a("xl")} 0;

            &[inert] { opacity: 0.6; }

            & .login__hero {
                text-align: center;
                margin-bottom: ${a("2xl")};

                & .login__flag { font-size: 2.2rem; }

                & h1 {
                    margin: ${a("sm")} 0 0;
                    font-family: ${i("font-display")};
                    font-weight: 600;
                    font-size: 2.4rem;
                    letter-spacing: -0.02em;
                    color: ${i("text")};
                }

                & p {
                    margin: ${a("xs")} 0 0;
                    color: ${i("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .error {
                display: none;
                padding: ${a("sm")} ${a("md")};
                margin-bottom: ${a("md")};
                color: ${i("error")};
                font-size: 0.875rem;
                text-align: center;
            }
            & .error.show { display: block; }

            & .login__form {
                display: flex;
                flex-direction: column;
                gap: ${a("md")};

                & input {
                    padding: ${a("md")} ${a("lg")};
                    font-size: 1rem;
                    ${H()}
                }

                & button {
                    padding: ${a("md")} ${a("lg")};
                    font-size: 1rem;
                    font-weight: 700;
                    ${k()}
                    background: ${i("primary")};
                    color: ${i("primary-text")};
                    border: none;
                    &:hover { background: ${i("primary")}; }
                }
            }
        }
    `;auth=this.inject(Z);router=this.inject(z);username="";password="";render(){return this.wire(Zt,{root:{inert:()=>this.auth.loading.get()},error:{className:()=>this.auth.error.get()?"error show":"error",textContent:()=>this.auth.error.get()?.message??""},form:{onsubmit:async e=>{e.preventDefault(),await this.auth.login(this.username,this.password)&&this.router.navigate("/rounds",!0)}},username:{oninput:e=>{this.username=e.target.value}},password:{oninput:e=>{this.password=e.target.value}},submit:{textContent:()=>this.auth.loading.get()?"Signing in…":"Sign in"}})}}class ts{loading=new h(!1);error=new h(null);guests=new h([]);async load(){const e=await x(this.loading,this.error,()=>v.guestPlayers.list());e&&this.guests.set(e)}async create(e){const t=await x(this.loading,this.error,()=>v.guestPlayers.create(e));return t&&this.guests.update(s=>[...s,t]),t??null}}const ss=b(`
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
`),ns=b(`
    <div class="player-row">
        <span bind="initials" class="player-row__badge"></span>
        <span bind="name" class="player-row__name"></span>
        <span bind="hcp" class="player-row__hcp"></span>
    </div>
`);function rs(o){return o.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0].toUpperCase()).join("")}class os extends T{static styles=`
        .players {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .players__head {
                margin-bottom: ${a("xl")};

                & h1 {
                    margin: 0;
                    font-family: ${i("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p {
                    margin: ${a("xs")} 0 0;
                    color: ${i("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .players__list {
                display: flex;
                flex-direction: column;
                gap: ${a("sm")};
                margin-bottom: ${a("2xl")};
            }

            & .player-row {
                display: flex;
                align-items: center;
                gap: ${a("md")};
                padding: ${a("md")} ${a("lg")};
                ${P()}

                & .player-row__badge {
                    display: grid;
                    place-items: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: ${i("primary")};
                    color: ${i("primary-text")};
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
                    color: ${i("accent")};
                    background: ${i("accent-soft")};
                    border-radius: ${i("radius-pill")};
                    padding: 2px 10px;
                    font-size: 0.85rem;
                }
            }

            & .players__form {
                display: flex;
                flex-direction: column;
                gap: ${a("md")};
                padding: ${a("lg")};
                ${P()}

                & h2 {
                    margin: 0;
                    font-family: ${i("font-display")};
                    font-weight: 600;
                    font-size: 1.2rem;
                }

                & input {
                    padding: ${a("md")} ${a("lg")};
                    font-size: 1rem;
                    ${H()}
                }

                & .players__row {
                    display: flex;
                    gap: ${a("sm")};

                    & input { width: 90px; text-align: center; }
                }

                & .players__seg {
                    flex: 1;
                    display: flex;
                    border: 1px solid ${i("border")};
                    border-radius: ${i("radius")};
                    overflow: hidden;

                    & button {
                        flex: 1;
                        padding: ${a("md")} 0;
                        border: none;
                        background: ${i("btn-bg")};
                        color: ${i("text-muted")};
                        font-family: inherit;
                        font-size: 0.85rem;
                        font-weight: 600;
                        cursor: pointer;

                        &.on {
                            background: ${i("primary")};
                            color: ${i("primary-text")};
                        }
                    }
                }

                & button[type=submit] {
                    padding: ${a("md")} ${a("lg")};
                    font-size: 1rem;
                    font-weight: 700;
                    ${k()}
                    background: ${i("primary")};
                    color: ${i("primary-text")};
                    border: none;
                    &:hover { background: ${i("primary")}; }
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
        }
    `;svc=this.inject(ts);name=new h("");gender=new h("M");hcp=new h("");render(){this.svc.load();const e=this.wire(ss,{name:{value:()=>this.name.get(),oninput:t=>this.name.set(t.target.value)},hcp:{value:()=>this.hcp.get(),oninput:t=>this.hcp.set(t.target.value)},genderM:{className:()=>this.gender.get()==="M"?"on":"",onclick:()=>this.gender.set("M")},genderF:{className:()=>this.gender.get()==="F"?"on":"",onclick:()=>this.gender.set("F")},submit:{disabled:()=>this.name.get().trim()===""||this.svc.loading.get()},form:{onsubmit:async t=>{t.preventDefault();const s=this.hcp.get().trim().replace(",",".");await this.svc.create({displayName:this.name.get().trim(),gender:this.gender.get(),handicapIndex:s===""?null:Number(s)})&&(this.name.set(""),this.hcp.set(""))}}});return this.$each(this.ref(e,"list"),this.svc.guests,(t,s,n)=>this.wireEl(ns,{initials:()=>rs(t.displayName),name:()=>t.displayName,hcp:()=>t.handicapIndex===null?"–":t.handicapIndex.toFixed(1)},n),t=>t.id),e}}class is{loading=new h(!1);error=new h(null);rounds=new h([]);async load(){const e=await x(this.loading,this.error,()=>v.rounds.list());e&&this.rounds.set(e)}}const as=b(`
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
`),ls=b(`
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
`);class ds extends T{static styles=`
        .rounds {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .rounds__head {
                margin-bottom: ${a("xl")};

                & h1 {
                    margin: 0;
                    font-family: ${i("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p {
                    margin: ${a("xs")} 0 0;
                    color: ${i("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .rounds__new {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: ${a("sm")};
                padding: ${a("lg")};
                margin-bottom: ${a("xl")};
                font-size: 1.1rem;
                font-weight: 700;
                font-family: inherit;
                ${k()}
                background: ${i("primary")};
                color: ${i("primary-text")};
                border: none;
                box-shadow: ${i("shadow-elevated")};
                &:hover { background: ${i("primary")}; }

                & .rounds__new-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .rounds__list {
                display: flex;
                flex-direction: column;
                gap: ${a("sm")};
            }

            & .round-row {
                display: flex;
                flex-direction: column;
                gap: ${a("xs")};
                padding: ${a("md")} ${a("lg")};
                text-align: left;
                font-family: inherit;
                cursor: pointer;
                ${P({hover:!0})}

                & .round-row__top {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    gap: ${a("md")};
                }

                & .round-row__course {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${i("text")};
                }

                & .round-row__status {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    border-radius: ${i("radius-pill")};
                    padding: 2px 10px;
                    flex-shrink: 0;

                    &.s-active { background: ${i("accent-soft")}; color: ${i("accent")}; }
                    &.s-complete { background: ${i("surface-sunken")}; color: ${i("text-muted")}; }
                    &.s-not_started { background: ${i("surface-sunken")}; color: ${i("text-muted")}; }
                }

                & .round-row__bottom {
                    display: flex;
                    justify-content: space-between;
                    gap: ${a("md")};
                    color: ${i("text-muted")};
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
    `;svc=this.inject(is);router=this.inject(z);render(){this.svc.load();const e=this.wire(as,{subtitle:()=>{const s=this.svc.rounds.get().length;return s===0?"No rounds yet — tee one up.":`${s} round${s===1?"":"s"} on the card.`},newBtn:{onclick:()=>this.router.navigate("/create")}}),t={not_started:"Not started",active:"Live",complete:"Done"};return this.$each(this.ref(e,"list"),this.svc.rounds,(s,n,r)=>this.wireEl(ls,{row:{onclick:()=>this.router.navigate("/score",{query:{roundId:s.id}})},course:()=>s.courseNameSnapshot??"Round",status:{textContent:()=>t[s.status]??s.status,className:()=>`round-row__status s-${s.status}`},date:()=>s.date,formats:()=>s.formatSlots.map(ee).join(" · ")},r),s=>s.id),e}}class cs{loading=new h(!1);error=new h(null);roundId=new h(null);round=new h(null);course=new h(null);balls=new h([]);strokes=new h(new Map);holes=new $(()=>this.course.get()?.holes??[]);playHoleIdByCourseHole=new $(()=>{const e=new Map;for(const t of this.round.get()?.playHoles??[])e.has(t.courseHoleNumber)||e.set(t.courseHoleNumber,t.id);return e});async load(e){if(this.roundId.get()===e&&this.round.get())return;this.roundId.set(e);const t=await x(this.loading,this.error,()=>v.rounds.get({id:e}));if(!t)return;this.round.set(t);const[s,n,r]=await Promise.all([x(this.loading,this.error,()=>v.courses.get({id:t.courseId})),x(this.loading,this.error,()=>v.rounds.balls({roundId:e})),x(this.loading,this.error,()=>v.scorecards.forRound({roundId:e}))]);if(s&&this.course.set(s),n&&this.balls.set(n),r){const l=new Map;for(const d of r)for(const c of d.holes)l.set(`${d.ballId} ${c.holeNumber}`,c.strokes);this.strokes.set(l)}}strokesFor(e,t){return this.strokes.get().get(`${e} ${t}`)??null}async setStrokes(e,t,s){const n=this.roundId.get();if(!n)return;const r=this.playHoleIdByCourseHole.get().get(t);if(!r)return;this.strokes.update(d=>new Map(d).set(`${e.id} ${t}`,s));const l=e.players.length===1?e.players[0]:null;await x(this.loading,this.error,()=>v.scoreEvents.append({roundId:n,ballId:e.id,playHoleId:r,strokes:s,eventType:s===null?"score_cleared":"score_entered",clientEventId:crypto.randomUUID(),sourcePlayerId:l?.playerId??null,sourceGuestPlayerId:l?.guestPlayerId??null}))}}const us=b(`
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
`),hs=b('<button bind="dot" type="button" class="score-dot"></button>'),ps=b(`
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
`);class ms extends T{static styles=`
        .score {
            padding: ${a("lg")} ${a("lg")} ${a("2xl")};

            & .score__head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${a("sm")};
                margin-bottom: ${a("lg")};
            }

            & .score__chip {
                padding: ${a("sm")} ${a("md")};
                font-size: 0.85rem;
                font-weight: 600;
                font-family: inherit;
                ${k(i("radius-pill"))}
            }

            & .score__chip--gold {
                background: ${i("accent-soft")};
                color: ${i("accent")};
                border-color: ${i("accent")};
                &:hover { background: ${i("accent-soft")}; }
            }

            & .score__course {
                font-family: ${i("font-display")};
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
                gap: ${a("md")};
                margin-bottom: ${a("md")};
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
                padding: ${a("md")} 0 ${a("lg")};
                background: ${i("topbar-bg")};
                color: ${i("primary-text")};
                border-radius: ${i("radius")};
                box-shadow: ${i("shadow-elevated")};

                & .score__holeword {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.25em;
                    opacity: 0.6;
                }

                & .score__holeno {
                    font-family: ${i("font-display")};
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
                margin-bottom: ${a("xl")};

                & .score-dot {
                    width: 12px;
                    height: 12px;
                    padding: 0;
                    border-radius: 50%;
                    border: 1px solid ${i("border")};
                    background: ${i("surface")};
                    cursor: pointer;

                    &.done { background: ${i("primary")}; border-color: ${i("primary")}; }
                    &.now {
                        outline: 2px solid ${i("accent")};
                        outline-offset: 1px;
                    }
                }
            }

            & .score__balls {
                display: flex;
                flex-direction: column;
                gap: ${a("sm")};
            }

            & .ball-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${a("md")};
                padding: ${a("md")} ${a("md")} ${a("md")} ${a("lg")};
                ${P()}

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

                & .ball-row__meta { color: ${i("text-muted")}; font-size: 0.75rem; }

                & .ball-row__stepper {
                    display: flex;
                    align-items: center;
                    gap: ${a("xs")};
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
                        font-family: ${i("font-display")};
                        font-size: 1.9rem;
                        font-weight: 600;

                        &.unset { color: ${i("text-muted")}; font-size: 1.4rem; }
                        &.under { color: ${i("under-par")}; }
                        &.over { color: ${i("over-par")}; }
                    }
                }
            }
        }
    `;svc=this.inject(cs);router=this.inject(z);holeQ=this.router.query("hole");roundIdQ=this.router.query("roundId");hole=new $(()=>{const e=Number(this.holeQ.get()??"1");return Number.isFinite(e)&&e>=1?e:1});currentHole=new $(()=>this.svc.holes.get().find(e=>e.holeNumber===this.hole.get())??null);goHole(e){this.router.navigate("/score",{query:{roundId:this.roundIdQ.get(),hole:String(e)}})}render(){this.track(y(()=>{const t=this.roundIdQ.get();t&&this.svc.load(t)}));const e=this.wire(us,{back:{onclick:()=>this.router.navigate("/rounds")},results:{onclick:()=>this.router.navigate("/results",{query:{roundId:this.roundIdQ.get()}})},course:()=>this.svc.round.get()?.courseNameSnapshot??"",holeNo:()=>String(this.hole.get()),holemeta:()=>{const t=this.currentHole.get();return t?`Par ${t.par} · Index ${t.strokeIndex}`:""},prev:{disabled:()=>this.hole.get()<=1,onclick:()=>this.goHole(this.hole.get()-1)},next:{disabled:()=>this.hole.get()>=(this.svc.holes.get().length||18),onclick:()=>this.goHole(this.hole.get()+1)}});return this.$each(this.ref(e,"dots"),this.svc.holes,(t,s,n)=>this.wireEl(hs,{dot:{className:()=>{const r=this.svc.balls.get().length>0&&this.svc.balls.get().every(d=>this.svc.strokesFor(d.id,t.holeNumber)!==null),l=this.hole.get()===t.holeNumber;return`score-dot${r?" done":""}${l?" now":""}`},onclick:()=>this.goHole(t.holeNumber)}},n),t=>String(t.holeNumber)),this.$each(this.ref(e,"balls"),this.svc.balls,(t,s,n)=>this.ballRow(t,n),t=>t.id),e}ballRow(e,t){const s=()=>this.svc.strokesFor(e.id,this.hole.get()),n=()=>this.currentHole.get()?.par??4;return this.wireEl(ps,{label:()=>e.label??e.players.map(r=>r.displayName).join(" / "),meta:()=>e.players.map(r=>`${r.teeName} · CH ${r.courseHandicap}`).join("  ·  "),minus:{onclick:()=>{const r=s();r===null?this.svc.setStrokes(e,this.hole.get(),n()):r<=1?this.svc.setStrokes(e,this.hole.get(),null):this.svc.setStrokes(e,this.hole.get(),r-1)}},plus:{onclick:()=>{const r=s();this.svc.setStrokes(e,this.hole.get(),r===null?n():r+1)}},value:{textContent:()=>{const r=s();return r===null?"–":String(r)},className:()=>{const r=s();return r===null?"ball-row__value unset":r<n()?"ball-row__value under":r>n()?"ball-row__value over":"ball-row__value"}}},t)}}class fs{loading=new h(!1);error=new h(null);roundId=new h(null);round=new h(null);result=new h(null);balls=new h([]);labelByBall=new $(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,t.label??t.players.map(s=>s.displayName).join(" / "));return e});async load(e){this.roundId.set(e);const[t,s]=await Promise.all([x(this.loading,this.error,()=>v.rounds.get({id:e})),x(this.loading,this.error,()=>v.rounds.balls({roundId:e}))]);t&&this.round.set(t),s&&this.balls.set(s);const n=await x(this.loading,this.error,()=>v.leaderboards.forRound({roundId:e}));n&&this.result.set(n)}}const gs=b(`
    <div class="results">
        <header class="results__head">
            <button bind="back" type="button" class="results__chip">‹ Scores</button>
            <span bind="course" class="results__course"></span>
        </header>

        <div bind="notice" class="results__notice"></div>

        <div bind="slots" class="results__slots"></div>
    </div>
`),bs=b('<div bind="row" class="results-slot"></div>');class ys extends T{static styles=`
        .results {
            padding: ${a("lg")} ${a("lg")} ${a("2xl")};

            & .results__head {
                display: flex;
                align-items: center;
                gap: ${a("md")};
                margin-bottom: ${a("lg")};
            }

            & .results__chip {
                padding: ${a("sm")} ${a("md")};
                font-size: 0.85rem;
                font-weight: 600;
                font-family: inherit;
                flex-shrink: 0;
                ${k(i("radius-pill"))}
            }

            & .results__course {
                font-family: ${i("font-display")};
                font-weight: 600;
                font-size: 1.1rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            & .results__notice {
                color: ${i("text-muted")};
                font-size: 0.9rem;
                margin-bottom: ${a("lg")};
            }

            & .results__slots {
                display: flex;
                flex-direction: column;
                gap: ${a("sm")};
            }

            & .results-slot {
                padding: ${a("md")} ${a("lg")};
                font-weight: 600;
                ${P()}
            }
        }
    `;svc=this.inject(fs);router=this.inject(z);roundIdQ=this.router.query("roundId");render(){this.track(y(()=>{const s=this.roundIdQ.get();s&&this.svc.load(s)}));const e=()=>this.svc.result.get()?.slots??[],t=this.wire(gs,{back:{onclick:()=>this.router.navigate("/score",{query:{roundId:this.roundIdQ.get()}})},course:()=>this.svc.round.get()?.courseNameSnapshot??"Results",notice:()=>e().length===0?"No scores yet — go play some golf.":"Detailed results render in the static fixtures; the mobile view returns in a later step."});return this.$each(this.ref(t,"slots"),()=>e(),(s,n,r)=>this.wireEl(bs,{row:()=>`slot #${s.slotIndex} · ${s.formatLabel} · ${s.allowanceLabel}`},r),s=>s.slotDefId),t}}const _s=b(`
    <div class="app-shell">
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class vs extends T{static styles=`
        .app-shell {
            display: grid;
            grid-template-rows: 1fr auto;
            height: 100vh;
            height: 100dvh;
            max-width: 560px;
            margin: 0 auto;
            background: ${i("bg")};

            & .app-shell__content {
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
        }
    `;router=this.inject(z);render(){const e=this.wire(_s,{});return this.spawn(Qe,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":le,"/round":Bt,"/create":Jt,"/login":es,"/rounds":ds,"/players":os,"/score":ms,"/results":ys},le),e}}j.get(Oe);const he=j.get(z),pe=j.get(Z);await Re(vs,"#app",{hot:void 0,onInit:async()=>{await pe.load(),pe.currentUser.get()&&he.route.get()==="/login"&&he.navigate("/",!0)}});export{T as C,z as R,h as S,Oe as T,m as a,G as b,$ as c,y as e,x as r,b as t};
