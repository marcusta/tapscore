(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function e(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(r){if(r.ep)return;r.ep=!0;const n=e(r);fetch(r.href,n)}})();const Bt="modulepreload",Ft=function(o){return"/tapscore/"+o},mt={},At=function(t,e,s){let r=Promise.resolve();if(e&&e.length>0){let c=function(u){return Promise.all(u.map(f=>Promise.resolve(f).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),d=i?.nonce||i?.getAttribute("nonce");r=c(e.map(u=>{if(u=Ft(u),u in mt)return;mt[u]=!0;const f=u.endsWith(".css"),m=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${m}`))return;const g=document.createElement("link");if(g.rel=f?"stylesheet":Bt,f||(g.as="script"),g.crossOrigin="",g.href=u,d&&g.setAttribute("nonce",d),document.head.appendChild(g),f)return new Promise((_,N)=>{g.addEventListener("load",_),g.addEventListener("error",()=>N(new Error(`Unable to preload CSS for ${u}`)))})}))}function n(i){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=i,window.dispatchEvent(d),!d.defaultPrevented)throw i}return r.then(i=>{for(const d of i||[])d.status==="rejected"&&n(d.reason);return t().catch(n)})};class Gt{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(t){this.tracking&&(t.add(this.tracking),this.tracking.deps.add(t))}notify(t){for(const e of[...t])this.batching?this.pending.add(e):e.run()}runTracked(t,e){Tt(t);const s=this.tracking;this.tracking=t;try{e()}finally{this.tracking=s}}untrack(t){const e=this.tracking;this.tracking=null;try{return t()}finally{this.tracking=e}}batch(t){this.batching=!0;try{t()}finally{this.batching=!1;const e=[...this.pending];this.pending.clear();for(const s of e)s.run()}}}const R=new Gt;function Tt(o){for(const t of o.deps)t.delete(o);o.deps.clear()}class h{constructor(t){this.subs=new Set,this.val=t}get(){return R.subscribe(this.subs),this.val}peek(){return this.val}set(t){Object.is(this.val,t)||(this.val=t,R.notify(this.subs))}update(t){this.set(t(this.val))}}class I{constructor(t){this.subs=new Set,this.val=void 0;const e=this,s={run(){R.runTracked(s,()=>{const r=t();Object.is(e.val,r)||(e.val=r,R.notify(e.subs))})},deps:new Set};s.run()}get(){return R.subscribe(this.subs),this.val}peek(){return this.val}}function v(o){const t={run(){R.runTracked(t,o)},deps:new Set};return t.run(),()=>Tt(t)}function U(o){R.batch(o)}function A(o){return R.untrack(o)}class qt{constructor(){this.instances=new Map}get(t){let e=this.instances.get(t);return e||(e=new t,this.instances.set(t,e)),e}set(t,e){this.instances.set(t,e)}reset(){this.instances.clear()}}const O=new qt,K="/tapscore/".replace(/\/+$/,"");function nt(o){return K?o===K?"/":o.startsWith(K+"/")?o.slice(K.length):o:o}function Dt(o){return K+o}class j{constructor(){this.route=new h(nt(location.pathname??"/")),this.search=new h(location.search??""),window.addEventListener("popstate",()=>U(()=>{this.route.set(nt(location.pathname)),this.search.set(location.search)}))}navigate(t,e){const s=typeof e=="boolean"?{replace:e}:e??{},r=t.indexOf("#"),n=r>=0?t.slice(r):"",i=r>=0?t.slice(0,r):t,d=i.indexOf("?"),c=d>=0?i.slice(0,d):i,u=d>=0?i.slice(d+1):"",f=s.query!==void 0?Kt(s.query):u?"?"+u:"",m=Dt(c)+f+n;(s.replace?history.replaceState:history.pushState).call(history,null,"",m),U(()=>{this.route.set(c),this.search.set(f)})}back(){history.back()}link(t,e="active"){const s=t.split("#")[0].split("?")[0];return{onclick:r=>{r.preventDefault(),this.navigate(t)},className:()=>{const r=this.route.get();return r===s||r.startsWith(s+"/")?e:""}}}params(t){const e=t.split("/");return new I(()=>{const s=this.route.get().split("/"),r={};for(const[n,i]of e.entries())i.startsWith(":")&&(r[i.slice(1)]=s[n]??"");return r})}query(t){return new I(()=>new URLSearchParams(this.search.get()).get(t)??void 0)}queries(){return new I(()=>{const t={};for(const[e,s]of new URLSearchParams(this.search.get()))t[e]=s;return t})}}function Kt(o){const t=new URLSearchParams;for(const[s,r]of Object.entries(o))r==null||r===""||t.set(s,String(r));const e=t.toString();return e?"?"+e:""}function Wt(o){return t=>o[t]}function Ut(o,t){const e=(r,n,i)=>{const d=Object.entries(r).map(([c,u])=>`--${c}:${u}`).join(";");return`${n}{color-scheme:${i};${d}}`},s=document.createElement("style");return s.textContent=e(o,'[data-theme="light"]',"light")+e(t,'[data-theme="dark"]',"dark"),document.head.appendChild(s),r=>`var(--${r})`}const ft="basics-js-theme";class Xt{constructor(){this.dark=new h(!1);const t=localStorage.getItem(ft),e=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(t?t==="dark":e),v(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(ft,s?"dark":"light")})}toggle(){this.dark.update(t=>!t)}}function y(o){const t=document.createElement("template");return t.innerHTML=o,t}function Vt(o,t){let e;for(const s of Object.keys(t))o.startsWith(s+"/")&&(!e||s.length>e.length)&&(e=s);return e?t[e]:void 0}const gt=new Set;class E{constructor(t={}){this.props=t,this.disposers=[],this.children=[];const e=this.constructor;if(e.styles&&!gt.has(e)){gt.add(e);const s=document.createElement("style");s.textContent=e.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(t){return O.get(t)}track(t){this.disposers.push(t)}ref(t,e){return t.querySelector(`[bind="${e}"]`)}spawn(t,e,...s){const r=A(()=>{const n=new t(s[0]);return n.mount(e),n});return this.children.push(r),r}mount(t){t.appendChild(this.render()),this.onMount()}destroy(){this.onDestroy();for(const t of this.children)t.destroy();this.children.length=0;for(const t of this.disposers)t();this.disposers.length=0}wire(t,e,s){const r=s??(i=>this.track(i)),n=t.content.cloneNode(!0);for(const i of n.querySelectorAll("[bind]")){const d=e[i.getAttribute("bind")];if(d)if(typeof d=="function")r(v(()=>{const c=d();i instanceof HTMLInputElement||i instanceof HTMLTextAreaElement?i.value=String(c):i.textContent=String(c)}));else for(const[c,u]of Object.entries(d)){const f=c.includes("-");c.startsWith("on")&&typeof u=="function"?i.addEventListener(c.slice(2),u):typeof u=="function"?r(v(()=>{const m=u();f?i.setAttribute(c,String(m)):i[c]=m})):f?i.setAttribute(c,String(u)):i[c]=u}}return n}wireEl(t,e,s){return this.wire(t,e,s).firstElementChild}slot(t,e){const s=this.props[t];if(s==null)return!1;const r=this.ref(e,t);return r?(typeof s=="string"?r.textContent=s:typeof s=="function"&&s.prototype instanceof E?this.spawn(s,r):typeof s=="function"&&s(r,{spawn:(n,i,...d)=>this.spawn(n,i,...d),track:n=>this.track(n)}),!0):!1}$each(t,e,s,r=(n,i)=>i){const n=typeof e=="function"?e:()=>e.get(),i=new Map,d=new Map;this.track(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),this.track(v(()=>{const c=n(),u=new Map;for(const[m,g]of c.entries()){const _=r(g,m);if(i.has(_))u.set(_,i.get(_));else{const N=[];u.set(_,A(()=>s(g,m,x=>N.push(x)))),d.set(_,N)}}for(const[m,g]of i)u.has(m)||(g.remove(),d.get(m)?.forEach(_=>_()),d.delete(m));let f=t.firstChild;for(const m of u.values())m===f?f=f.nextSibling:t.insertBefore(m,f);i.clear();for(const[m,g]of u)i.set(m,g)}))}$condition(t,e,s,r){let n=null;this.track(v(()=>{n&&(n.remove(),n=null);const i=e.get();n=A(()=>i?s():r?.()??null),n&&t.appendChild(n)}))}$swap(t,e,s,r){let n=null;this.track(v(()=>{n&&(n.destroy(),n=null),t.textContent="";const i=e.get(),d=s[i]??Vt(i,s)??r;d&&(n=A(()=>{const c=new d;return c.mount(t),c}))})),this.track(()=>n?.destroy())}}async function Qt(o,t,e){const s=document.querySelector(t);s.textContent="";const r=O.get(j);let n=null,i=!1,d=null,c=!!e?.hot?.data.hmr;const u=async f=>{n&&(n.destroy(),n=null,s.textContent=""),f?(d||(d=(await At(()=>import("./obs-shell.component-1yhmVzwL.js"),[])).ObsShellComponent),n=A(()=>new d)):(!c&&e?.onInit&&(await e.onInit(),c=!0),n=A(()=>new o)),A(()=>n.mount(s)),i=f};await u(nt(location.pathname).startsWith("/_obs")),v(()=>{const f=r.route.get().startsWith("/_obs");f!==i&&u(f)}),e?.hot&&(e.hot.data.hmr=!0,e.hot.dispose(()=>n?.destroy()),e.hot.accept())}class D extends Error{constructor(t,e,s,r){super(e),this.status=t,this.details=s,this.traceId=r,this.name="ApiError"}}const Yt=10,Q=[];let Y=[],W=null;function Zt(o){Q.push(o),Q.length>Yt&&Q.shift()}function Jt(o,t,e){const s={code:o,message:t,url:typeof location<"u"?location.href:"",context:[...Q],timestamp:new Date().toISOString()};e!==void 0&&(s.traceId=e),Y.push(s),te()}function te(){W||(W=setTimeout(It,5e3))}function It(){if(W&&(clearTimeout(W),W=null),Y.length===0)return;const o=Y;Y=[];for(const t of o){const e=JSON.stringify(t);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon("/api/_obs/errors",new Blob([e],{type:"application/json"})):typeof fetch<"u"&&fetch("/api/_obs/errors",{method:"POST",headers:{"Content-Type":"application/json"},body:e}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&It()});const ee=3e4,se=2,X=new Map,Et=new WeakMap;function ne(o){if(o instanceof D)return o.traceId;if(o!=null&&typeof o=="object")return Et.get(o)}async function p(o){if(o.method==="GET"){const t=X.get(o.url);if(t)return t;const e=bt(o,se);return X.set(o.url,e),e.then(()=>X.delete(o.url),()=>X.delete(o.url)),e}return bt(o,0)}async function bt(o,t){const e=o.timeout??ee;let s;for(let r=0;r<=t;r++){const n=crypto.randomUUID();try{return await oe(re(o,n),e)}catch(i){if(s=i,!(i instanceof D)&&i!=null&&typeof i=="object"&&Et.set(i,n),i instanceof D||r===t)break;await new Promise(d=>setTimeout(d,1e3*2**r))}}throw s}async function re(o,t){const e={"X-Trace-Id":t},s={method:o.method,headers:e};o.body!==void 0&&(e["Content-Type"]="application/json",s.body=JSON.stringify(o.body));const r=await fetch(o.url,s),n=r.headers.get("x-trace-id")??t;if(Zt({type:"api",detail:`${o.method} ${o.url}`,timestamp:new Date().toISOString()}),!r.ok){const i=await r.json().catch(()=>({error:r.statusText}));throw new D(r.status,i.error??r.statusText,i.details,n)}return r.json()}function oe(o,t){let e;const s=new Promise((r,n)=>{e=setTimeout(()=>n(new Error("Request timeout")),t)});return Promise.race([o,s]).finally(()=>clearTimeout(e))}async function C(o,t,e){U(()=>{o.set(!0),t.set(null)});try{const s=await e();return o.set(!1),s}catch(s){const r=ie(s);U(()=>{o.set(!1),t.set(r)}),Jt(r.code,r.message,ne(s));return}}function ie(o){return o instanceof D?o.status===401?{code:"auth",message:"Unauthorized"}:o.status===409?{code:"conflict",message:"Data has changed — please try again"}:o.status===400?{code:"validation",message:o.message}:{code:"server",message:"Server error"}:o instanceof Error?o.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}function ae(o){return{me:()=>p({method:"GET",url:`${o}/auth/me`}),login:t=>p({method:"POST",url:`${o}/auth/login`,body:t}),logout:()=>p({method:"POST",url:`${o}/auth/logout`,body:{}})}}class it{constructor(){this.api=ae("/api"),this.currentUser=new h(null),this.loading=new h(!1),this.error=new h(null)}async load(){const t=await C(this.loading,this.error,()=>this.api.me());t&&this.currentUser.set(t),this.error.get()?.code==="auth"&&this.error.set(null)}async login(t,e){const s=await C(this.loading,this.error,()=>this.api.login({username:t,password:e}));return s?(this.currentUser.set(s),!0):!1}async logout(){await C(this.loading,this.error,()=>this.api.logout());const t=this.error.get();(!t||t.code==="auth")&&this.currentUser.set(null)}}const yt={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},a=Ut({...yt,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},{...yt,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"}),$=o=>`var(--${o})`,l=Wt({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem"}),T=(o=$("radius"))=>`
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
`,le=y(`
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
`);class de extends E{static styles=`
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
    `;router=this.inject(j);auth=this.inject(it);render(){return this.wire(le,{root:{className:()=>this.auth.currentUser.get()&&this.router.route.get()!=="/login"?"tabbar":"tabbar hidden"},roundsLink:this.router.link("/rounds"),playersLink:this.router.link("/players")})}}function ce(o){return{async me(){return p({method:"GET",url:`${o}/players/me`})}}}function ue(o){return{async list(){return p({method:"GET",url:`${o}/clubs`})},async get(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/clubs/get${s?"?"+s:""}`})},async create(t){return p({method:"POST",url:`${o}/clubs`,body:t})},async update(t){return p({method:"POST",url:`${o}/clubs/update`,body:t})},async remove(t){return p({method:"DELETE",url:`${o}/clubs/${t.id}`})}}}function he(o){return{async list(){return p({method:"GET",url:`${o}/courses`})},async listByClub(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/courses/by-club${s?"?"+s:""}`})},async get(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/courses/get${s?"?"+s:""}`})},async create(t){return p({method:"POST",url:`${o}/courses`,body:t})},async update(t){return p({method:"POST",url:`${o}/courses/update`,body:t})},async updateHole(t){return p({method:"POST",url:`${o}/courses/holes/update`,body:t})},async validate(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/courses/validate${s?"?"+s:""}`})},async remove(t){return p({method:"DELETE",url:`${o}/courses/${t.id}`})}}}function pe(o){return{async listByCourse(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/tees/by-course${s?"?"+s:""}`})},async get(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/tees/get${s?"?"+s:""}`})},async create(t){return p({method:"POST",url:`${o}/tees`,body:t})},async update(t){return p({method:"POST",url:`${o}/tees/update`,body:t})},async remove(t){return p({method:"DELETE",url:`${o}/tees/${t.id}`})}}}function me(o){return{async list(){return p({method:"GET",url:`${o}/guest-players`})},async get(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/guest-players/get${s?"?"+s:""}`})},async create(t){return p({method:"POST",url:`${o}/guest-players`,body:t})}}}function fe(o){return{async latest(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/handicap/latest${s?"?"+s:""}`})},async history(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/handicap/history${s?"?"+s:""}`})},async record(t){return p({method:"POST",url:`${o}/handicap/record`,body:t})}}}function ge(o){return{async list(){return p({method:"GET",url:`${o}/rounds`})},async balls(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/rounds/balls${s?"?"+s:""}`})},async get(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/rounds/get${s?"?"+s:""}`})},async create(t){return p({method:"POST",url:`${o}/rounds`,body:t})},async createFromDraft(t){return p({method:"POST",url:`${o}/rounds/from-draft`,body:t})},async update(t){return p({method:"POST",url:`${o}/rounds/update`,body:t})},async remove(t){return p({method:"DELETE",url:`${o}/rounds/${t.id}`})}}}function be(o){return{async listByRound(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/participants/by-round${s?"?"+s:""}`})},async get(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/participants/get${s?"?"+s:""}`})},async create(t){return p({method:"POST",url:`${o}/participants`,body:t})},async addPlayer(t){return p({method:"POST",url:`${o}/participants/add-player`,body:t})},async addGuest(t){return p({method:"POST",url:`${o}/participants/add-guest`,body:t})},async listFor(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/participants/players${s?"?"+s:""}`})},async remove(t){return p({method:"DELETE",url:`${o}/participants/${t.id}`})}}}function ye(o){return{async listByRound(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/score-events/by-round${s?"?"+s:""}`})},async append(t){return p({method:"POST",url:`${o}/score-events`,body:t})}}}function _e(o){return{async forBall(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/scorecards/for-ball${s?"?"+s:""}`})},async forRound(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/scorecards/for-round${s?"?"+s:""}`})}}}function ve(o){return{async forRound(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/leaderboards/for-round${s?"?"+s:""}`})}}}function xe(o){return{async list(){return p({method:"GET",url:`${o}/friendly-rounds`})},async create(t){return p({method:"POST",url:`${o}/friendly-rounds`,body:t})},async byToken(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/friendly-rounds/by-token${s?"?"+s:""}`})},async get(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/friendly-rounds/get${s?"?"+s:""}`})},async balls(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/friendly-rounds/balls${s?"?"+s:""}`})},async scorecard(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/friendly-rounds/scorecard${s?"?"+s:""}`})},async result(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/friendly-rounds/result${s?"?"+s:""}`})},async score(t){return p({method:"POST",url:`${o}/friendly-rounds/score`,body:t})}}}function we(o){return{async courses(){return p({method:"GET",url:`${o}/setup/courses`})},async teesByCourse(t){const e=new URLSearchParams;for(const[r,n]of Object.entries(t))n!==void 0&&e.set(r,String(n));const s=e.toString();return p({method:"GET",url:`${o}/setup/tees/by-course${s?"?"+s:""}`})},async formats(){return p({method:"GET",url:`${o}/setup/formats`})}}}const S="/tapscore/".replace(/\/+$/,"")+"/api",k={players:ce(S),clubs:ue(S),courses:he(S),tees:pe(S),guestPlayers:me(S),handicap:fe(S),rounds:ge(S),participants:be(S),scoreEvents:ye(S),scorecards:_e(S),leaderboards:ve(S),friendlyRounds:xe(S),setup:we(S)};class $e{loading=new h(!1);error=new h(null);rounds=new h([]);async load(){const t=await C(this.loading,this.error,()=>k.friendlyRounds.list());t&&this.rounds.set(t)}}class Z{loading=new h(!1);error=new h(null);descriptors=new h([]);started=!1;async load(){if(this.started)return;this.started=!0;const t=await C(this.loading,this.error,()=>k.setup.formats());t?this.descriptors.set(t):this.started=!1}byId(t){return this.descriptors.get().find(e=>e.id===t)??null}classify(t){const e=t.requirements.balls;if(e.ballMode==="team")return{kind:"team_ball",teamSize:{...e.producerCount}};if(e.requiresSlotTeamGrouping){const s=e.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:s.teamSize?.min??2,max:s.teamSize?.max??2},...s.teamCount?{teamCount:s.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}classifyId(t){const e=this.byId(t);return e?this.classify(e):null}needsTeams(t){const e=this.classifyId(t);return!!e&&e.kind!=="individual"}isSideFormat(t){return this.classifyId(t)?.kind==="team_grouping"}}function at(o){const t=O.get(Z);return t.load(),t.byId(o.formatId)?.label??`${o.scoringMode} · ${o.teamShape}`}const ke=y(`
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
`),Se=y(`
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
`),Te={not_started:"Not started",active:"Live",complete:"Done"};class _t extends E{static styles=`
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
                ${T()}
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
    `;svc=this.inject($e);router=this.inject(j);render(){this.svc.load();const t=this.wire(ke,{createBtn:{onclick:()=>this.router.navigate("/create")},signin:{onclick:()=>this.router.navigate("/login")},count:()=>{const e=this.svc.rounds.get().length;return e===0?"":`${e} on the card`},empty:{className:()=>this.svc.rounds.get().length===0?"landing__empty":"landing__empty hidden"}});return this.$each(this.ref(t,"list"),this.svc.rounds,(e,s,r)=>this.wireEl(Se,{row:{onclick:()=>this.router.navigate("/round",{query:{token:e.friendlyRound.shareToken}})},course:()=>e.round.courseNameSnapshot??"Round",status:{textContent:()=>Te[e.round.status]??e.round.status,className:()=>`round-row__status s-${e.round.status}`},date:()=>e.round.date,formats:()=>e.round.formatSlots.map(at).join(" · ")},r),e=>e.friendlyRound.id),t}}const Ie=180,vt=4,Ee=12;function q(o,t){return t<=0?0:Math.max(0,Math.min(t-1,o))}function Pe(o){const{dragDistance:t,velocity:e,itemWidth:s}=o;if(Math.abs(t)<Ee)return 0;const r=t+e*Ie,n=Math.round(-r/s);return Math.max(-vt,Math.min(vt,n))}const Ce=["1st","2nd","3rd","4th","5th","6th","7th","8th"],G=(o,t)=>`${o}|${t}`;function Pt(o){return o.players.map(t=>t.displayName).join(" & ")||o.label||"Ball"}function Oe(o,t,e){return o?!(o.minPar!==void 0&&t<o.minPar||o.maxPar!==void 0&&t>o.maxPar||o.pars&&!o.pars.includes(t)||o.holes&&!o.holes.includes(e)):!0}class lt{loading=new h(!1);error=new h(null);friendlyRound=new h(null);round=new h(null);balls=new h([]);scorecards=new h([]);cells=new h(new Map);result=new h(null);resultLoading=new h(!1);resultError=new h(null);holeIdx=new h(0);groupIdx=new h(0);selectedSlot=new h(0);token=null;loadSeq=0;resultSeq=0;async loadByToken(t,e){const s=t!==this.token;this.token=t;const r=++this.loadSeq;s&&this.resetForNewToken(e),O.get(Z).load();const n=await C(this.loading,this.error,()=>k.friendlyRounds.byToken({token:t}));if(!n||r!==this.loadSeq||t!==this.token)return;this.friendlyRound.set(n.friendlyRound),this.round.set(n.round);const[i,d]=await Promise.all([k.friendlyRounds.balls({token:t}).catch(()=>[]),k.friendlyRounds.scorecard({token:t}).catch(()=>[])]);r!==this.loadSeq||t!==this.token||(this.cells.set(new Map),this.scorecards.set(d),this.balls.set(i))}async loadResult(){const t=this.token;if(!t)return;const e=++this.resultSeq,s=await C(this.resultLoading,this.resultError,()=>k.friendlyRounds.result({token:t}));e!==this.resultSeq||t!==this.token||s&&this.result.set(s)}ballNameById=new I(()=>{const t=new Map;for(const e of this.balls.get())t.set(e.id,Pt(e));return t});nameOf(t){return this.ballNameById.get().get(t)??t}groups(){return this.round.get()?.playingGroups??[]}group(){const t=this.groups();return t[this.groupIdx.get()]??t[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return q(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(t){return this.round.get()?.playHoles.find(e=>e.id===t)??null}currentPlayHole(){const t=this.currentPlayedHole();return t?this.playHoleById(t.playHoleId):null}parFor(t){return(t?this.playHoleById(t)?.par:null)??4}occLabel(t){const e=this.round.get(),s=e?.playHoles.find(i=>i.id===t);if(!e||!s)return"";const r=e.playHoles.filter(i=>i.courseHoleNumber===s.courseHoleNumber).sort((i,d)=>i.ordinal-d.ordinal);if(r.length===1)return`${s.courseHoleNumber}`;const n=r.findIndex(i=>i.id===t);return`${s.courseHoleNumber} (${Ce[n]??`${n+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(q(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(q(this.holeIndex()+1,this.playedOrder().length))}strokesFor(t,e){const s=this.cells.get().get(G(t,e));return s?s.strokes:this.scorecards.get().find(i=>i.ballId===t)?.holes.find(i=>i.playHoleId===e)?.strokes??null}statusFor(t,e){return this.cells.get().get(G(t,e))?.status??null}metadataFor(t,e,s){const r=this.cells.get().get(G(t,e));return r&&r.metadata!==void 0?r.metadata?.[s]:this.scorecards.get().find(d=>d.ballId===t)?.holes.find(d=>d.playHoleId===e)?.metadata?.[s]}metadataInputs(){const t=O.get(Z),e=this.round.get()?.formatSlots??[],s=[],r=new Set;for(const n of e){const i=t.byId(n.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of i)r.has(d.key)||(r.add(d.key),s.push(d))}return s}metadataInputsForHole(t){return t?this.metadataInputs().filter(e=>Oe(e.appliesWhen,t.par,t.courseHoleNumber)):[]}async setScore(t,e,s,r){const n=G(t,e),i=crypto.randomUUID();this.patchCell(n,{strokes:s,metadata:r,status:"saving",clientEventId:i}),await this.post(t,e,s,r,i)}async retry(t,e){const s=G(t,e),r=this.cells.get().get(s);r&&(this.patchCell(s,{...r,status:"saving"}),await this.post(t,e,r.strokes,r.metadata,r.clientEventId))}async post(t,e,s,r,n){if(!this.token)return;const i=G(t,e);try{await k.friendlyRounds.score({token:this.token,ballId:t,playHoleId:e,strokes:s,eventType:s===null?"score_cleared":"score_entered",clientEventId:n,...r!=null?{metadata:r}:{}});const d=this.cells.get().get(i);d&&d.clientEventId===n&&this.patchCell(i,{...d,status:"saved"});const c=this.round.get();c&&c.status==="not_started"&&this.round.set({...c,status:"active"})}catch{const d=this.cells.get().get(i);d&&d.clientEventId===n&&this.patchCell(i,{...d,status:"error"})}}patchCell(t,e){const s=new Map(this.cells.get());s.set(t,e),this.cells.set(s)}resetForNewToken(t){this.resultSeq++,this.friendlyRound.set(null),this.round.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(t?.holeIdx??0),this.groupIdx.set(t?.groupIdx??0),this.selectedSlot.set(t?.selectedSlot??0)}}const B=60,xt=8,rt=4,ze=Array.from({length:rt*2+1},(o,t)=>t-rt),je="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",Ne=y(`
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
`),He=y(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),Me=y(`
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
`),Re=y(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),wt=y(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),Le=y(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`);class Be extends E{static styles=`
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
            right: ${xt}px;
            width: ${B*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-rt*B}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${B}px;
            width: ${B}px;
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

            & .se-row__scores { display: flex; align-items: center; padding-right: ${xt}px; flex-shrink: 0; }
            & .se-row__slot { width: ${B}px; display: flex; align-items: center; justify-content: center; }
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
    `;svc=this.inject(lt);holeIdx=this.svc.holeIdx;modalOpen=new h(!1);currentBallIdx=new h(0);extendedOpen=new h(!1);extendedScore=new h(10);statsOpen=new h(!1);pendingMeta=new h({});lastMetaKey=null;toastMsg=new h(null);dragOffset=new h(0);transitioning=new h(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new I(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=t=>{const e=this.playedOrder();return e[q(this.holeIndex()+t,e.length)]??null};ballsInGroup=()=>{const t=this.group();if(!t)return[];const e=new Map(this.svc.balls.get().map(s=>[s.id,s]));return t.ballIds.map(s=>e.get(s)).filter(s=>!!s)};parFor=t=>this.svc.parFor(t);occLabel=t=>this.svc.occLabel(t);ballName=t=>Pt(t);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(t=>t.kind==="boolean");displayScore=t=>t===null?"–":String(t);toParValue=t=>{let e=0,s=0,r=!1;for(const n of this.playedOrder()){const i=this.svc.strokesFor(t.id,n.playHoleId);i!==null&&i>0&&(e+=i,s+=this.parFor(n.playHoleId),r=!0)}return r?e-s:null};toParText=t=>{const e=this.toParValue(t);return e===null?"–":e===0?"E":e>0?`+${e}`:`${e}`};toParClass=t=>{const e=this.toParValue(t);return`se-row__topar ${e===null||e===0?"even":e<0?"under":"over"}`};scoreLabel=(t,e)=>{if(t===1)return"HIO";const s=t-e;return s<=-4||s>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(s)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer)}),this.track(v(()=>{const n=this.ballsInGroup().length;n>0&&this.currentBallIdx.get()>=n&&this.currentBallIdx.set(0)}));const t=this.wire(Ne,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1)}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const n=this.currentHole();return n?`Hole ${this.occLabel(n.playHoleId)} · Par ${this.parFor(n.playHoleId)}`:""},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>this.statsOpen.set(!1)},statsHole:()=>{const n=this.currentHole();return n?`Hole ${this.occLabel(n.playHoleId)} · Par ${this.parFor(n.playHoleId)}`:""},statsTitle:()=>{const n=this.ballsInGroup()[this.currentBallIdx.get()];return n?this.ballName(n):""},statsScore:()=>{const n=this.ballsInGroup()[this.currentBallIdx.get()],i=this.currentHole();return!n||!i?"":this.displayScore(this.svc.strokesFor(n.id,i.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.advance()}}}),e=this.ref(t,"viewport"),s=this.ref(t,"track");this.bindCarouselPointer(e,s),this.track(v(()=>{s.style.transition=this.transitioning.get()?je:"none",s.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(s,new I(()=>ze),(n,i,d)=>this.holeItem(n,d),n=>n),this.$each(this.ref(t,"rows"),new I(()=>{const n=this.playedOrder(),i=this.holeIndex(),d=n[i];if(!d)return[];const c=i>0?n[i-1].playHoleId:null;return this.ballsInGroup().map(u=>({ball:u,ph:d.playHoleId,prevPh:c}))}),(n,i,d)=>this.playerRow(n.ball,n.ph,n.prevPh,d),n=>`${n.ball.id}|${n.ph}`),this.$each(this.ref(t,"modalList"),new I(()=>this.ballsInGroup()),(n,i,d)=>this.modalRow(n,i,d),n=>n.id);const r=this.ref(t,"keys");for(const n of[1,2,3,4,5,6,7,8,9])r.appendChild(this.numberKey(n));return r.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),r.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),r.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(t,"statsBody"),new I(()=>this.metaInputs()),(n,i,d)=>this.metaChip(n,d),n=>n.key),this.track(v(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null;return}const n=this.ballsInGroup()[this.currentBallIdx.get()],i=this.currentHole();if(!n||!i)return;const d=`${n.id}|${i.playHoleId}`;if(d===this.lastMetaKey)return;this.lastMetaKey=d;const c={};for(const u of this.metaInputs())c[u.key]=this.svc.metadataFor(n.id,i.playHoleId,u.key)===!0;this.pendingMeta.set(c)})),t}holeItem(t,e){return this.wireEl(He,{item:{className:()=>{const s=t===-1&&this.holeIndex()<=0;return`se-hole${t===0?" active":""}${s?" gone":""}`}},hnum:{textContent:()=>{const s=this.occAtOffset(t);return s?this.occLabel(s.playHoleId):""}},hpar:{textContent:()=>{const s=this.occAtOffset(t);return s?`Par ${this.parFor(s.playHoleId)}`:""}}},e)}playerRow(t,e,s,r){return this.wireEl(Me,{name:{textContent:this.ballName(t)},topar:{textContent:()=>this.toParText(t),className:()=>this.toParClass(t)},prev:{textContent:()=>s?this.displayScore(this.svc.strokesFor(t.id,s)):""},cval:{textContent:()=>this.displayScore(this.svc.strokesFor(t.id,e))},circle:{className:()=>this.svc.strokesFor(t.id,e)===null?"se-row__circle empty":"se-row__circle",onclick:()=>this.openModalForBall(t.id)}},r)}modalRow(t,e,s){const r=t.players.length>1?`Team · CH ${t.courseHandicap}`:`CH ${t.players[0]?.courseHandicap??t.courseHandicap}`;return this.wireEl(Re,{mrow:{className:()=>this.currentBallIdx.get()===e?"se-mrow sel":"se-mrow",onclick:()=>this.currentBallIdx.set(e)},mname:{textContent:this.ballName(t)},mhcp:{textContent:r},mval:{textContent:()=>{const n=this.currentHole();return n?this.displayScore(this.svc.strokesFor(t.id,n.playHoleId)):"–"}}},s)}numberKey(t){return this.wireEl(wt,{key:{className:()=>{const e=this.currentHole();return(e?t===this.parFor(e.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(t)},num:{textContent:String(t)},lbl:{textContent:()=>{const e=this.currentHole();return e?this.scoreLabel(t,this.parFor(e.playHoleId)):""}}})}specialKey(t,e,s,r){return this.wireEl(wt,{key:{className:s,onclick:r},num:{textContent:t},lbl:{textContent:e}})}openModalForBall(t){const e=this.ballsInGroup().findIndex(s=>s.id===t);this.currentBallIdx.set(e<0?0:e),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.modalOpen.set(!0)}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(t){const e=this.ballsInGroup(),s=this.currentHole(),r=e[this.currentBallIdx.get()];if(!s||!r)return;const n=t===null?void 0:this.metaSnapshot();this.svc.setScore(r.id,s.playHoleId,t,n),t!==null&&t>0&&this.metaInputs().length>0?this.statsOpen.set(!0):this.advance()}hasMoreUnscored=()=>{const t=this.ballsInGroup(),e=this.currentHole();if(!e)return!1;const s=this.currentBallIdx.get();return t.some((r,n)=>n!==s&&this.svc.strokesFor(r.id,e.playHoleId)===null)};metaSnapshot(){const t=this.metaInputs();if(t.length===0)return;const e=this.pendingMeta.get(),s={};for(const r of t)s[r.key]=e[r.key]===!0;return s}setMeta(t,e){const s=this.pendingMeta.get();this.pendingMeta.set({...s,[t]:e});const r=this.ballsInGroup()[this.currentBallIdx.get()],n=this.currentHole();if(!r||!n)return;const i=this.svc.strokesFor(r.id,n.playHoleId);i!==null&&this.svc.setScore(r.id,n.playHoleId,i,this.metaSnapshot())}metaChip(t,e){return this.wireEl(Le,{glabel:{textContent:t.label},miss:{className:()=>this.pendingMeta.get()[t.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(t.key,!1)},hit:{className:()=>this.pendingMeta.get()[t.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(t.key,!0)}},e)}advance(){const t=this.ballsInGroup(),e=this.currentHole();if(!e)return;const s=c=>this.svc.strokesFor(t[c].id,e.playHoleId)!==null,r=this.currentBallIdx.get();for(let c=r+1;c<t.length;c++)if(!s(c))return this.currentBallIdx.set(c);for(let c=0;c<r;c++)if(!s(c))return this.currentBallIdx.set(c);const n=this.playedOrder();if(this.holeIndex()>=n.length-1){this.flash("Round complete"),this.modalOpen.set(!1);return}this.flash(`Hole ${this.occLabel(e.playHoleId)} done`);const d=e.playHoleId;this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===d&&(this.holeIdx.set(q(this.holeIndex()+1,this.playedOrder().length)),this.currentBallIdx.set(0))},700)}flash(t){this.toastMsg.set(t),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===t&&this.toastMsg.set(null)},1100)}snap(t){this.pendingSteps=t,this.transitioning.set(!0),this.dragOffset.set(-t*B),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const t=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),t!==0&&this.holeIdx.set(q(this.holeIndex()+t,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(t,e){e.addEventListener("transitionend",r=>{r.propertyName==="transform"&&this.finishSettle()}),t.addEventListener("pointerdown",r=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:r.pointerId,startX:r.clientX,startY:r.clientY,lastX:r.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),t.setPointerCapture?.(r.pointerId))}),t.addEventListener("pointermove",r=>{const n=this.ptr;if(!n||n.id!==r.pointerId)return;const i=r.clientX-n.startX,d=r.clientY-n.startY;if(!n.horiz){if(Math.abs(d)>Math.abs(i)&&Math.abs(d)>8||Math.abs(i)<=8)return;n.horiz=!0}const c=Date.now(),u=Math.max(1,c-n.lastTime);n.velocity=(r.clientX-n.lastX)/u,n.lastX=r.clientX,n.lastTime=c,this.dragOffset.set(i)});const s=r=>{const n=this.ptr;if(!n||n.id!==r.pointerId)return;const i=r.clientX-n.startX,d=n.horiz;if(this.ptr=null,t.releasePointerCapture?.(r.pointerId),!d){this.dragOffset.set(0);return}this.snap(Pe({dragDistance:i,velocity:n.velocity,itemWidth:B}))};t.addEventListener("pointerup",s),t.addEventListener("pointercancel",r=>{!this.ptr||this.ptr.id!==r.pointerId||(this.ptr=null,t.releasePointerCapture?.(r.pointerId),this.snap(0))})}}function b(o){return String(o).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Fe(o,t){const e=[...o].sort((n,i)=>n.canonicalOrdinal-i.canonicalOrdinal);if(t.length===0)return[{label:"TOT",holes:e,playHoleIds:new Set(e.map(n=>n.playHoleId))}];const s=[...t].sort((n,i)=>n.fromCanonicalOrdinal-i.fromCanonicalOrdinal),r=[];for(const n of s){const i=e.filter(d=>d.canonicalOrdinal>=n.fromCanonicalOrdinal&&d.canonicalOrdinal<=n.toCanonicalOrdinal);i.length!==0&&r.push({label:n.label,holes:i,playHoleIds:new Set(i.map(d=>d.playHoleId))})}return r}function Ae(o){return o.kind==="si"?"lb-c-si":o.kind==="given"?"lb-c-given":o.kind==="status"?"lb-c-status":o.kind==="category"?"lb-c-cat":""}function Ge(o){const t=[o.kind==="category"?"lb-r-cat":`lb-r-${o.kind}`];return(o.kind==="si"||o.kind==="given")&&t.push("lb-r-dim"),o.team&&t.push(`lb-team-${o.team}`),t.join(" ")}function qe(o){return o&&o.marker?o.marker.template:null}function De(o){const t=o?.marker?.tone;return t==="success"||t==="warning"||t==="danger"?` lb-mark-tone--${t}`:""}function Ke(o,t){const e=o.cells.filter(s=>t.has(s.playHoleId));if(o.aggregate==="sum"){const s=e.map(r=>r.value).filter(r=>r!==null);return s.length===0?"—":String(s.reduce((r,n)=>r+n,0))}if(o.aggregate==="last"){for(let s=e.length-1;s>=0;s--){const r=e[s].value;if(r!==null)return Number.isInteger(r)?String(r):r.toFixed(1)}return"—"}return"—"}function We(o){return o.filter(t=>!(t.startsWith("slot #")||/^CH -?\d/.test(t)||/^PH -?\d/.test(t)))}function dt(o,t,e,s){const r=Fe(o.holes,t),n=x=>{const J=`<tr><th class="lb-rowlabel">Hole</th>${x.holes.map(P=>`<th>${b(P.occurrenceLabel)}</th>`).join("")}<th class="lb-sum">${b(x.label)}</th></tr>`,Ot=o.rows.map(P=>{const zt=new Map(P.cells.map(L=>[L.playHoleId,L])),ut=L=>P.emphasis?`<strong>${L}</strong>`:L,jt=x.holes.map(L=>{const H=zt.get(L.playHoleId),Mt=H?.title?` title="${b(H.title)}"`:"",tt=ut(b(H?.display??"")),ht=qe(H),Rt=De(H),et=H?.marker?.label,Lt=et?` title="${b(et)}" aria-label="${b(et)}"`:"";let pt=ht?`<span class="lb-mark lb-mark--${ht}${Rt}"${Lt}>${tt}</span>`:tt;return H?.team&&(pt=`<span class="lb-pill lb-pill--${H.team}">${tt}</span>`),`<td class="${Ae(P)}"${Mt}>${pt}</td>`}).join(""),Nt=`<td class="lb-sum">${ut(Ke(P,x.playHoleIds))}</td>`,Ht=P.subjectBallId?b(e(P.subjectBallId))+(P.label?" "+b(P.label):""):b(P.label);return`<tr class="${Ge(P)}"><th class="lb-rowlabel">${Ht}</th>${jt}${Nt}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${J}</thead><tbody>${Ot}</tbody></table></div>`},i=r.map(x=>n(x)).join(""),d=o.title.groups.map(x=>x.map(J=>b(e(J))).join(" & ")).filter(Boolean).join(o.title.joiner),c=s.mode==="verification"?o.subtitleFacts:We(o.subtitleFacts),u=c.length?`<div class="lb-card__sub">${c.map(b).join(" · ")}</div>`:"",f=s.mode==="verification"&&o.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${o.footnotes.map(x=>`<span class="lb-card__note">${b(x)}</span>`).join("")}</div>`:"",m=s.mode==="verification"&&o.caption?`<p class="lb-card__caption">${b(o.caption)}</p>`:"",g=o.totals.length?`<ul class="lb-card__totals">${o.totals.map(x=>`<li>${b(x.label)} = <strong>${x.value??"—"}</strong></li>`).join("")}</ul>`:"",_=d?`<header class="lb-card__head"><h4>${d}</h4>${u}</header>`:u;return`<article class="${s.cardModifier?`lb-card ${s.cardModifier}`:"lb-card"}">
  ${_}
  ${i}
  ${f}${m}${g}
</article>`}function Ue(o,t,e,s){return dt(o,t,e,s)}function Xe(o,t,e,s){return dt(o,t,e,{...s,cardModifier:"lb-card--compact-match"})}function Ve(o,t,e,s){return dt(o,t,e,{...s,cardModifier:"lb-card--category-matrix"})}function Qe(o,t){const e=o.entries.map(s=>`<tr class="${s.position===1?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${s.position}</td>
  <td class="lb-rank__who">${b(s.ballIds.map(t).join(" & "))}</td>
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
    <tbody>${e}</tbody>
  </table>
</div>`}function Ye(o,t){const e=o.matches.map(s=>{const r=b(s.sideA.ballIds.map(t).join(" & ")),n=b(s.sideB.ballIds.map(t).join(" & ")),i=s.magnitude===0?"AS":`${s.magnitude} UP`,d=s.finished?"Final":`thru ${s.thru}`,c=s.leader==="a"?" lb-mp__team--lead":"",u=s.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${c}">${r}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${b(i)}</span><span class="lb-mp__status">${b(d)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${u}">${n}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${b(o.title)}</h4>${e}
</div>`}const Ze={ranked:Qe,match_summary:Ye},Je={"default-score-grid":Ue,"compact-match-grid":Xe,"category-matrix-grid":Ve};function ts(o){return o.componentId??"default-score-grid"}function es(o){return`<div class="lb-diag">Unrenderable result section <code>${b(o)}</code> — no generic view yet. Results are not hidden.</div>`}function ss(o){return`<div class="lb-diag">Unsupported score-grid component <code>${b(o)}</code> — no generic view yet. Results are not hidden.</div>`}function ns(o,t){const e=Ze[o.kind];return e?e(o,t):es(o.kind)}function rs(o,t,e,s){const r=ts(o),n=Je[r];return n?n(o,t,e,s):ss(r)}function os(o,t){return o.leaderboard.length===0&&o.cards.length===0?`<div class="lb-empty">No scores entered yet for ${b(o.formatLabel)}.</div>`:o.leaderboard.map(s=>ns(s,t)).join("")||`<div class="lb-empty">No leaderboard metric for ${b(o.formatLabel)}.</div>`}function is(o,t,e,s={}){if(o.cards.length===0)return"";const r=s.mode??"product";return o.cards.map(n=>rs(n,t,e,{mode:r})).join(`
`)}const as=y(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class ls extends E{static styles=`
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
    `;svc=this.inject(lt);slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const t=this.slots();return t[this.svc.selectedSlot.get()]??t[0]??null};render(){return this.wire(as,{status:{className:()=>{const e=this.svc.resultLoading.get(),s=this.svc.result.get()===null;return e||s?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody()}})}renderBody(){const t=this.svc.result.get();if(!t)return"";const e=this.currentSlot();if(!e)return'<div class="lb-empty">No formats in this round.</div>';const s=d=>this.svc.nameOf(d),r=os(e,s),n=is(e,t.routeSections,s),i=n?`<h3 class="lb-cards__head">Scorecard</h3>${n}`:"";return r+i}}const ds=y(`
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
`),cs=y('<button bind="pill" class="round-view__fmt" type="button"></button>');class us extends E{static styles=`
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
                    ${T()}
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
    `;svc=this.inject(lt);router=this.inject(j);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new h(this.initPos.tab);hasRound=new I(()=>this.svc.round.get()!==null);hasScoring=new I(()=>this.svc.balls.get().length>0);shareUrl=new I(()=>{const t=this.tokenQ.get();return t?`${location.origin}/round?token=${t}`:""});render(){this.track(v(()=>{const s=this.tokenQ.get();s&&this.svc.loadByToken(s,this.initPos).then(()=>{this.tab.get()==="leaderboard"&&this.svc.loadResult()})})),this.track(v(()=>{const s=this.tab.get(),r=this.svc.selectedSlot.get(),n=this.svc.holeIdx.get();if(!this.hasRound.get())return;const i={token:this.tokenQ.get()};s==="leaderboard"&&(i.tab="board"),r>0&&(i.slot=r),n>0&&(i.hole=n+1),this.router.navigate(this.router.route.get(),{replace:!0,query:i})}));const t={not_started:"Not started",active:"Live",complete:"Done"},e=this.wire(ds,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},course:()=>this.svc.round.get()?.courseNameSnapshot??"Round",status:()=>{const s=this.svc.round.get()?.status??"not_started";return t[s]??s},date:()=>this.svc.round.get()?.date??"",route:()=>{const s=this.svc.round.get();return s?`${s.playHoles.length} holes`:""},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},dock:{className:()=>this.hasRound.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const s=this.svc.currentPlayedHole();return s?this.svc.occLabel(s.playHoleId):""},holeSi:()=>{const s=this.svc.currentPlayHole()?.baseStrokeIndex;return s!=null?String(s):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});return this.$each(this.ref(e,"formats"),new I(()=>this.svc.round.get()?.formatSlots??[]),(s,r,n)=>this.slotPill(s,r,n),s=>s.slotDefId),this.spawn(Be,this.ref(e,"scoring")),this.spawn(ls,this.ref(e,"leaderboard")),e}readUrlPosition(){const t=new URLSearchParams(location.search),e=Number(t.get("slot")),s=Number(t.get("hole"));return{tab:t.get("tab")==="board"?"leaderboard":"score",selectedSlot:Number.isFinite(e)&&e>0?e:0,holeIdx:Number.isFinite(s)&&s>0?s-1:0}}slotPill(t,e,s){return this.wireEl(cs,{pill:{textContent:()=>at(t),className:()=>this.tab.get()==="leaderboard"&&this.svc.selectedSlot.get()===e?"round-view__fmt active":"round-view__fmt",onclick:()=>{this.svc.selectedSlot.set(e),this.tab.get()!=="leaderboard"&&(this.tab.set("leaderboard"),this.svc.loadResult())}}},s)}}function F(o){return typeof o=="object"&&o!==null&&typeof o.get=="function"}const w=o=>`var(--${o})`,ct=class ct extends E{constructor(){super(...arguments),this.open=new h(!1),this.highlightIndex=new h(-1),this.optionEls=[],this.onOutsidePointer=t=>{this.wrapperEl.contains(t.target)||this.open.set(!1)}}render(){const t=document.createElement("div");t.className="ui-select",this.wrapperEl=t;const e=this.props.zIndex??50;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const s=document.createElement("span");s.className="ui-select__trigger-label",this.triggerEl.appendChild(s);const r=document.createElement("span");r.className="ui-select__chevron",r.textContent="▾",r.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(r),this.triggerEl.addEventListener("click",i=>{i.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",i=>{this.handleTriggerKeydown(i)}),t.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.setAttribute("role","listbox"),this.dropdownEl.style.zIndex=String(e),this.dropdownEl.addEventListener("keydown",i=>{this.handleDropdownKeydown(i)}),t.appendChild(this.dropdownEl);const n=i=>{this.optionEls=[],this.dropdownEl.textContent="";for(let d=0;d<i.length;d++){const c=i[d],u=document.createElement("button");if(u.className="ui-select__option",u.setAttribute("type","button"),u.id=`ui-select-opt-${d}`,c.disabled){u.classList.add("ui-select__option--header"),u.disabled=!0,u.setAttribute("role","presentation"),u.setAttribute("aria-disabled","true");const g=document.createElement("span");g.className="ui-select__option-label",g.textContent=c.label,u.appendChild(g),this.dropdownEl.appendChild(u),this.optionEls.push(u);continue}if(u.setAttribute("role","option"),c.icon){const g=document.createElement("span");g.className="ui-select__option-icon",g.textContent=c.icon,u.appendChild(g)}const f=document.createElement("span");f.className="ui-select__option-label",f.textContent=c.label,u.appendChild(f);const m=document.createElement("span");m.className="ui-select__check",m.setAttribute("aria-hidden","true"),u.appendChild(m),u.addEventListener("click",g=>{g.stopPropagation(),this.selectOption(c.value)}),u.addEventListener("mouseenter",()=>{this.highlightIndex.set(d)}),this.dropdownEl.appendChild(u),this.optionEls.push(u)}};return F(this.props.options)?this.track(v(()=>{const i=F(this.props.options)?this.props.options.get():this.props.options;n(i)})):n(this.props.options),this.track(v(()=>{const i=this.props.value.get(),d=F(this.props.options)?this.props.options.get():this.props.options,c=d.find(u=>u.value===i);c?(s.textContent=c.icon?`${c.icon} ${c.label}`:c.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder")):(s.textContent=this.props.placeholder??"",this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!this.props.placeholder));for(let u=0;u<d.length;u++){const f=this.optionEls[u];if(!f)continue;const m=d[u].value===i;f.setAttribute("aria-selected",String(m)),f.classList.toggle("ui-select__option--selected",m);const g=f.querySelector(".ui-select__check");g&&(g.textContent=m?"✓":"")}})),this.track(v(()=>{const i=this.open.get();if(this.dropdownEl.classList.toggle("open",i),r.classList.toggle("ui-select__chevron--open",i),this.triggerEl.setAttribute("aria-expanded",String(i)),i?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),i){const d=F(this.props.options)?this.props.options.get():this.props.options,c=this.props.value.get(),u=d.findIndex(m=>m.value===c),f=d.findIndex(m=>!m.disabled);this.highlightIndex.set(u>=0?u:f)}})),this.track(v(()=>{const i=this.highlightIndex.get();for(let d=0;d<this.optionEls.length;d++)this.optionEls[d].classList.toggle("ui-select__option--highlighted",d===i);i>=0&&this.optionEls[i]&&(this.triggerEl.setAttribute("aria-activedescendant",`ui-select-opt-${i}`),this.optionEls[i].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(F(this.props.disabled)?this.track(v(()=>{const i=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",i),this.triggerEl.disabled=i})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),t}toggle(){this.open.update(t=>!t)}selectOption(t){U(()=>{this.props.value.set(t),this.open.set(!1)}),this.triggerEl.focus()}handleTriggerKeydown(t){switch(t.key){case"Enter":case" ":t.preventDefault(),this.toggle();break;case"ArrowDown":t.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":t.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(t.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(t){switch(t.key){case"ArrowDown":t.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":t.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":{t.preventDefault();const e=this.highlightIndex.get(),s=F(this.props.options)?this.props.options.get():this.props.options;e>=0&&e<s.length&&!s[e].disabled&&this.selectOption(s[e].value);break}case"Escape":t.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(t){const e=F(this.props.options)?this.props.options.get():this.props.options;if(e.length===0||!e.some(r=>!r.disabled))return;let s=this.highlightIndex.get();do s+=t,s<0&&(s=e.length-1),s>=e.length&&(s=0);while(e[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};ct.styles=`
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
    `;let ot=ct;function Ct(o){return o.handicapIndex*(o.slope/113)+(o.courseRating-o.par)}function hs(o){return Math.round(Ct(o))}const ps=["scramble","greensomes","foursomes","custom"],V=2,st=10,ms="ABCDEFGH",fs={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class gs{loading=new h(!1);error=new h(null);courses=new h([]);tees=new h([]);courseId=new h("");preset=new h("full_18");startHole=new h(1);players=new h([]);teams=new h([]);formatSlots=new h([]);submitting=new h(!1);diagnostics=new h([]);submitError=new h(null);catalog=O.get(Z);nextKey=1;nextSlotKey=1;nextTeamKey=1;reset(){this.courses.set([]),this.tees.set([]),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.formatSlots.set([]),this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1}async load(){this.catalog.load().then(()=>this.ensureDefaultSlot());const t=await C(this.loading,this.error,()=>k.setup.courses());t&&(this.courses.set(t),!this.courseId.get()&&t.length>0&&await this.selectCourse(t[0].id))}async selectCourse(t){this.courseId.set(t),this.preset.set("full_18"),this.startHole.set(1);const s=await C(this.loading,this.error,()=>k.setup.teesByCourse({courseId:t}))??[];this.tees.set(s);const r=new Set(s.map(i=>i.id)),n=s[0]?.id??"";this.players.set(this.players.get().map(i=>({...i,teeId:r.has(i.teeId)?i.teeId:n}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const t=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:t}])}removePlayer(t){this.players.set(this.players.get().filter(e=>e.key!==t))}patchPlayer(t,e){this.players.set(this.players.get().map(s=>s.key===t?{...s,...e}:s))}ensureDefaultSlot(){if(this.formatSlots.get().length>0)return;const t=this.catalog.byId("stableford_individual")??this.catalog.descriptors.get()[0];t&&this.addFormatSlot(t.id)}addFormatSlot(t){const e=t??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",s={key:this.nextSlotKey++,formatId:e,allowancePct:"100",subjectPlayers:{},subjectTeams:{}};this.formatSlots.set([...this.formatSlots.get(),s])}setSlotAllowance(t,e){this.patchFormatSlot(t,{allowancePct:e})}removeFormatSlot(t){this.formatSlots.set(this.formatSlots.get().filter(e=>e.key!==t))}patchFormatSlot(t,e){this.formatSlots.set(this.formatSlots.get().map(s=>s.key===t?{...s,...e}:s))}setSlotFormat(t,e){this.patchFormatSlot(t,{formatId:e})}slotByKey(t){return this.formatSlots.get().find(e=>e.key===t)??null}teamLetter(t){return ms[t]??`T${t+1}`}formations=ps;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{}}])}teamKindOf(t){return this.teamByKey(t)?.kind??"single_ball"}setTeamKind(t,e){this.teams.set(this.teams.get().map(s=>s.key===t?{...s,kind:e,memberTeams:e==="single_ball"?{}:s.memberTeams}:s)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(t){return this.teams.get().filter(e=>e.key!==t&&e.kind==="single_ball")}teamHasTeamMember(t,e){return this.teamByKey(t)?.memberTeams[e]===!0}setTeamMemberTeam(t,e,s){const r=this.teamByKey(t);if(!r||r.kind!=="multi_ball"||e===t)return;const n={...r.memberTeams};if(s){if(this.teamMemberCount(t)>=st)return;n[e]=!0}else delete n[e];this.teams.set(this.teams.get().map(i=>i.key===t?{...i,memberTeams:n}:i))}teamMemberCount(t){const e=this.teamByKey(t);return e?Object.keys(e.pctByPlayer).length+Object.keys(e.memberTeams).filter(s=>e.memberTeams[Number(s)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(t=>{const e=this.isSideFormat(t.formatId);let s=!1;const r={...t.subjectTeams};for(const n of this.teams.get())r[n.key]===!0&&n.kind==="multi_ball"!==e&&(delete r[n.key],s=!0);return s?{...t,subjectTeams:r}:t}))}isSideFormat(t){return this.catalog.isSideFormat(t)}removeTeam(t){this.teams.set(this.teams.get().filter(e=>e.key!==t).map(e=>{if(e.memberTeams[t]===void 0)return e;const s={...e.memberTeams};return delete s[t],{...e,memberTeams:s}})),this.formatSlots.set(this.formatSlots.get().map(e=>{if(e.subjectTeams[t]===void 0)return e;const s={...e.subjectTeams};return delete s[t],{...e,subjectTeams:s}}))}teamByKey(t){return this.teams.get().find(e=>e.key===t)??null}teamLabel(t){const e=this.teams.get().findIndex(s=>s.key===t.key);return`Team ${this.teamLetter(Math.max(0,e))}`}setTeamFormation(t,e){this.teams.set(this.teams.get().map(s=>s.key===t?{...s,formation:e}:s))}teamMemberIn(t,e){return this.teamByKey(t)?.pctByPlayer[e]!==void 0}setTeamMember(t,e,s){const r=this.teamByKey(t);if(!r)return;const n={...r.pctByPlayer};if(s){if(n[e]!==void 0||this.teamMemberCount(t)>=st)return;n[e]=n[e]??"100"}else delete n[e];this.teams.set(this.teams.get().map(i=>i.key===t?{...i,pctByPlayer:n}:i))}teamSize(t){return this.teamMemberCount(t)}teamAtMaxSize(t){return this.teamSize(t)>=st}teamBallCh(t){const e=this.teamByKey(t);if(!e)return null;let s=0;for(const r of this.players.get()){const n=e.pctByPlayer[r.key];if(n===void 0)continue;const i=this.derivedCH(r);if(!i)return null;s+=this.parsePct(n)*i.ch/100}return Math.round(s)}teamsBelowMin(){return this.teams.get().filter(t=>this.teamMemberCount(t.key)>0&&this.teamMemberCount(t.key)<V)}isTeamLive(t){const e=Object.keys(t.pctByPlayer).length;if(t.kind==="single_ball")return e>=V;let s=e;for(const r of this.teams.get())t.memberTeams[r.key]===!0&&r.kind==="single_ball"&&Object.keys(r.pctByPlayer).length>=V&&s++;return s>=V}liveTeamKeySet(){return new Set(this.teams.get().filter(t=>this.isTeamLive(t)).map(t=>t.key))}setTeamPct(t,e,s){const r=this.teamByKey(t);!r||r.pctByPlayer[e]===void 0||this.teams.set(this.teams.get().map(n=>n.key===t?{...n,pctByPlayer:{...n.pctByPlayer,[e]:s}}:n))}subjectPlayerIn(t,e){return this.slotByKey(t)?.subjectPlayers[e]!==!1}setSubjectPlayer(t,e,s){const r=this.slotByKey(t);r&&this.patchFormatSlot(t,{subjectPlayers:{...r.subjectPlayers,[e]:s}})}subjectTeamIn(t,e){return this.slotByKey(t)?.subjectTeams[e]===!0}setSubjectTeam(t,e,s){const r=this.slotByKey(t);r&&this.patchFormatSlot(t,{subjectTeams:{...r.subjectTeams,[e]:s}})}selectedCourse(){return this.courses.get().find(t=>t.id===this.courseId.get())??null}teeById(t){return this.tees.get().find(e=>e.id===t)??null}presetLabel(t){return fs[t]}presetHoles(){const t=(this.selectedCourse()?.holes??[]).map(e=>e.holeNumber).sort((e,s)=>e-s);switch(this.preset.get()){case"front_9":return t.filter(e=>e<=9);case"back_9":return t.filter(e=>e>=10);default:return t}}startHoleOptions(){return this.presetHoles()}setPreset(t){this.preset.set(t);const e=this.presetHoles();e.includes(this.startHole.get())||this.startHole.set(e[0]??1)}derivedCH(t){const e=Number.parseFloat(t.handicapIndex);if(!Number.isFinite(e))return null;const s=this.teeById(t.teeId);if(!s)return null;const r=s.ratings.find(i=>i.gender===t.gender);if(!r)return null;const n={handicapIndex:e,slope:r.slope,courseRating:r.courseRating,par:r.par};return{ch:hs(n),raw:Ct(n),rating:r,teeName:s.name}}diagnosticsForPlayer(t){return this.diagnostics.get().filter(e=>e.path?.startsWith(`producers[${t}]`))}playersInNoFormat(){const t=this.players.get(),e=new Set;for(const s of this.formatSlots.get()){for(const r of t)s.subjectPlayers[r.key]!==!1&&e.add(r.key);for(const r of this.teams.get())if(s.subjectTeams[r.key]===!0)for(const n of t)r.pctByPlayer[n.key]!==void 0&&e.add(n.key)}return t.filter(s=>!e.has(s.key))}diagnosticsForFormat(t){return this.diagnostics.get().filter(e=>e.path?.startsWith(`formats[${t}]`))}generalDiagnostics(){return this.diagnostics.get().filter(t=>!t.path?.startsWith("producers[")&&!t.path?.startsWith("formats["))}parsePct(t){const e=Number.parseInt(t,10);return Number.isFinite(e)?e:100}buildTeams(t,e){const s=this.liveTeamKeySet(),r=[];for(const n of this.teams.get()){if(!s.has(n.key))continue;const i=t.filter(d=>n.pctByPlayer[d.key]!==void 0).map(d=>({producerDefId:e.get(d.key),allowancePct:this.parsePct(n.pctByPlayer[d.key])}));if(n.kind==="multi_ball")for(const d of this.teams.get())n.memberTeams[d.key]===!0&&d.key!==n.key&&d.kind==="single_ball"&&s.has(d.key)&&i.push({teamId:String(d.key)});r.push({id:String(n.key),label:this.teamLabel(n),formation:n.formation,kind:n.kind,members:i})}return r}buildFormats(t,e){const s=this.liveTeamKeySet();return this.formatSlots.get().map(r=>{const n=this.isSideFormat(r.formatId),i=[];if(!n)for(const d of t)r.subjectPlayers[d.key]!==!1&&i.push({kind:"player",producerDefId:e.get(d.key)});for(const d of this.teams.get())r.subjectTeams[d.key]===!0&&s.has(d.key)&&d.kind==="multi_ball"===n&&i.push({kind:"team",teamId:String(d.key)});return{formatId:r.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(r.allowancePct)},subjects:i}})}buildRoute(){const t=this.presetHoles(),e=this.startHole.get(),s=t.indexOf(e);return s<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...t.slice(s),...t.slice(0,s)].map(n=>({courseHoleNumber:n})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}async submit(){this.diagnostics.set([]),this.submitError.set(null);const t=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(t.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const e=[];if(t.forEach((s,r)=>{s.name.trim()||e.push({code:"missing_name",message:"Name required",path:`producers[${r}].name`}),Number.isFinite(Number.parseFloat(s.handicapIndex))||e.push({code:"missing_index",message:"Handicap index required",path:`producers[${r}].handicapIndex`}),s.teeId||e.push({code:"missing_tee",message:"Pick a tee",path:`producers[${r}].teeId`})}),e.length>0)return this.diagnostics.set(e),{ok:!1};this.submitting.set(!0);try{const s=[];for(let f=0;f<t.length;f++){const m=t[f],g=Number.parseFloat(m.handicapIndex),_=await k.guestPlayers.create({displayName:m.name.trim(),gender:m.gender,handicapIndex:g});s.push({producerDefId:`p${f+1}`,playerRef:{kind:"guest",id:_.id},handicapIndex:g,gender:m.gender,teeId:m.teeId})}const{roundType:r,route:n}=this.buildRoute(),i=new Map;t.forEach((f,m)=>i.set(f.key,`p${m+1}`));const d=this.buildTeams(t,i),c={courseId:this.courseId.get(),playedAt:new Date().toISOString().slice(0,10),roundType:r,...n?{route:n}:{},producers:s,...d.length>0?{teams:d}:{},formats:this.buildFormats(t,i)},u=await k.friendlyRounds.create({draft:c});return u.ok?{ok:!0,token:u.friendlyRound.shareToken}:(this.diagnostics.set(u.diagnostics),{ok:!1})}catch(s){return this.submitError.set(s instanceof D?s.message:"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}const bs=["full_18","front_9","back_9"],ys=y(`
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
`),_s=y(`
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
`),vs=y(`
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
`),xs=y(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),ws=y(`
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
`),$t=y(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class $s extends E{static styles=`
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
                    flex: 1; padding: ${l("md")} 0; ${T()}
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
                    width: 38px; height: 38px; flex-shrink: 0; ${T()}
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
                width: 100%; margin-top: ${l("md")}; padding: ${l("md")}; ${T()}
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
                    width: 38px; height: 38px; flex-shrink: 0; ${T()}
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
                        flex: 1; padding: ${l("sm")} 0; ${T()}
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
                    & .brow__del { margin-left: auto; width: 30px; height: 30px; ${T()} font-size: 0.8rem; color: ${a("text-muted")}; }
                }
                & .fslot__addband {
                    align-self: flex-start; padding: ${l("xs")} ${l("sm")}; ${T()}
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                }

                & .fslot__err {
                    font-size: 0.82rem; color: ${a("error")};
                    &:empty { display: none; }
                }
            }

            & .setup__create {
                width: 100%; padding: ${l("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit; ${T()}
                background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                box-shadow: ${a("shadow-elevated")};
                &:hover { background: ${a("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;svc=this.inject(gs);router=this.inject(j);render(){this.svc.reset(),this.svc.load();const t=this.wire(ys,{back:{onclick:()=>this.router.navigate("/")},addPlayer:{onclick:()=>this.svc.addPlayer()},addTeam:{onclick:()=>this.svc.addTeam()},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const s=this.svc.playersInNoFormat();return s.length===0?"":`Heads up: ${s.map(n=>n.name.trim()||"A player").join(", ")} ${s.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.generalDiagnostics().map(r=>r.message),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?"Creating…":"Create round",onclick:async()=>{const s=await this.svc.submit();s.ok&&this.router.navigate("/round",{query:{token:s.token}})}}});this.$each(this.ref(t,"presets"),()=>bs,(s,r,n)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(s),className:()=>this.svc.preset.get()===s?"on":"",onclick:()=>this.svc.setPreset(s)}},n),s=>s);const e=s=>this.track(s);return this.mountSelect(this.ref(t,"course"),e,{value:this.bound(e,()=>this.svc.courseId.get(),s=>{s&&s!==this.svc.courseId.get()&&this.svc.selectCourse(s)}),options:{get:()=>{const s=[];let r="";for(const n of this.svc.courses.get())n.clubName!==r&&(s.push({value:`__club:${n.clubName}`,label:n.clubName,disabled:!0}),r=n.clubName),s.push({value:n.id,label:n.name});return s}},placeholder:"Select a course"}),this.mountSelect(this.ref(t,"startHole"),e,{value:this.bound(e,()=>String(this.svc.startHole.get()),s=>this.svc.startHole.set(Number(s))),options:{get:()=>this.svc.startHoleOptions().map(s=>({value:String(s),label:String(s)}))}}),this.$each(this.ref(t,"players"),this.svc.players,(s,r,n)=>this.playerRow(s.key,n),s=>s.key),this.$each(this.ref(t,"teams"),this.svc.teams,(s,r,n)=>this.teamCard(s.key,n),s=>s.key),this.$each(this.ref(t,"formats"),this.svc.formatSlots,(s,r,n)=>this.formatCard(s.key,r,n),s=>s.key),t}mountSelect(t,e,s){const r=new ot(s);r.mount(t),e(()=>r.destroy())}bound(t,e,s){const r=new h(e());return t(v(()=>r.set(e()))),t(v(()=>{const n=r.get();queueMicrotask(()=>s(n))})),r}eachInto(t,e,s,r,n){const i=new Map,d=new Map;e(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),e(v(()=>{const c=s(),u=new Map;for(const[m,g]of c.entries()){const _=n(g,m);if(i.has(_))u.set(_,i.get(_));else{const N=[];u.set(_,r(g,m,x=>N.push(x))),d.set(_,N)}}for(const[m,g]of i)u.has(m)||(g.remove(),d.get(m)?.forEach(_=>_()),d.delete(m));let f=t.firstChild;for(const m of u.values())m===f?f=f.nextSibling:t.insertBefore(m,f);i.clear();for(const[m,g]of u)i.set(m,g)}))}formatCard(t,e,s){const r=()=>this.svc.slotByKey(t),n=()=>r()?.formatId??"",i=this.wireEl(vs,{remove:{onclick:()=>this.svc.removeFormatSlot(t)},desc:{textContent:()=>this.svc.catalog.byId(n())?.description??""},allowance:{value:this.svc.slotByKey(t)?.allowancePct??"100",oninput:c=>this.svc.setSlotAllowance(t,c.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(n())?"applied to each side member’s ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.diagnosticsForFormat(e).map(c=>c.message).join(" · ")}},s);this.mountSelect(this.ref(i,"format"),s,{value:this.bound(s,()=>n(),c=>{c&&c!==this.svc.slotByKey(t)?.formatId&&this.svc.setSlotFormat(t,c)}),options:{get:()=>this.svc.catalog.descriptors.get().map(c=>({value:c.id,label:c.label}))}});const d=()=>{const c=this.svc.isSideFormat(n()),u=[];c||u.push(...this.svc.players.get().map(f=>({kind:"player",subKey:f.key})));for(const f of this.svc.teams.get())f.kind==="multi_ball"===c&&u.push({kind:"team",subKey:f.key});return u};return this.eachInto(this.ref(i,"subjectRows"),s,d,(c,u,f)=>this.subjectRow(t,c.kind,c.subKey,f),c=>`${c.kind}${c.subKey}`),i}subjectRow(t,e,s,r){const n=()=>{if(e==="player")return this.svc.players.get().find(u=>u.key===s)?.name?.trim()||"Player";const c=this.svc.teamByKey(s);return c?`${this.svc.teamLabel(c)} (${c.kind==="multi_ball"?"side":"team"})`:"Team"},i=()=>e==="player"?this.svc.subjectPlayerIn(t,s):this.svc.subjectTeamIn(t,s),d=c=>e==="player"?this.svc.setSubjectPlayer(t,s,c):this.svc.setSubjectTeam(t,s,c);return this.wireEl(xs,{chk:{checked:()=>i(),onchange:c=>d(c.target.checked)},name:{textContent:()=>n()}},r)}teamCard(t,e){const s=()=>this.svc.teamKindOf(t)==="multi_ball",r=this.wireEl(ws,{remove:{onclick:()=>this.svc.removeTeam(t)},teamName:{textContent:()=>{const n=this.svc.teamByKey(t);return n?this.svc.teamLabel(n):"Team"}},compGroup:{hidden:()=>s()},membersLabel:{textContent:()=>s()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const n=this.svc.teamSize(t);if(n===0)return s()?"Tick at least 2 members — a side needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(n<2)return"Add one more member — a team needs at least 2.";if(s())return`${n} balls · a side (scored together by a side format)`;const i=this.svc.teamBallCh(t);return i===null?`${n} players`:`${n} players · plays off CH ${i}`}}},e);return this.mountSelect(this.ref(r,"kindSel"),e,{value:this.bound(e,()=>this.svc.teamKindOf(t),n=>this.svc.setTeamKind(t,n==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"One combined ball"},{value:"multi_ball",label:"Separate balls (a side)"}]}}),this.mountSelect(this.ref(r,"formation"),e,{value:this.bound(e,()=>this.svc.teamByKey(t)?.formation??"scramble",n=>this.svc.setTeamFormation(t,n)),options:{get:()=>this.svc.formations.map(n=>({value:n,label:n[0].toUpperCase()+n.slice(1)}))}}),this.eachInto(this.ref(r,"memberRows"),e,()=>{const n=this.svc.players.get().map(i=>({kind:"player",mKey:i.key}));if(s())for(const i of this.svc.eligibleNestedTeams(t))n.push({kind:"team",mKey:i.key});return n},(n,i,d)=>n.kind==="player"?this.teamMemberRow(t,n.mKey,d):this.teamNestedRow(t,n.mKey,d),n=>`${n.kind}${n.mKey}`),r}teamNestedRow(t,e,s){const r=()=>this.svc.teamHasTeamMember(t,e);return this.wireEl($t,{chk:{checked:()=>r(),disabled:()=>!r()&&this.svc.teamAtMaxSize(t),onchange:n=>this.svc.setTeamMemberTeam(t,e,n.target.checked)},name:{textContent:()=>{const n=this.svc.teamByKey(e);return n?`${this.svc.teamLabel(n)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},s)}teamMemberRow(t,e,s){const r=()=>this.svc.players.get().find(i=>i.key===e)??null,n=()=>this.svc.teamMemberIn(t,e);return this.wireEl($t,{chk:{checked:()=>n(),disabled:()=>!n()&&this.svc.teamAtMaxSize(t),onchange:i=>this.svc.setTeamMember(t,e,i.target.checked)},name:{textContent:()=>r()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!n()||this.svc.teamKindOf(t)==="multi_ball"},pct:{value:this.svc.teamByKey(t)?.pctByPlayer[e]??"100",oninput:i=>this.svc.setTeamPct(t,e,i.target.value)}},s)}playerRow(t,e){const s=()=>this.svc.players.get().find(i=>i.key===t)??null,r=()=>this.svc.players.get().findIndex(i=>i.key===t),n=this.wireEl(_s,{name:{oninput:i=>this.svc.patchPlayer(t,{name:i.target.value})},index:{oninput:i=>this.svc.patchPlayer(t,{handicapIndex:i.target.value})},remove:{onclick:()=>this.svc.removePlayer(t)},ch:{textContent:()=>{const i=s();if(!i)return"";const d=this.svc.derivedCH(i);if(!d)return"";const c=d.rating;return`Course handicap ${d.ch}  ·  ${i.handicapIndex} × ${c.slope}/113 + (${c.courseRating} − ${c.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(r()).map(i=>i.message).join(" · ")}},e);return this.mountSelect(this.ref(n,"gender"),e,{value:this.bound(e,()=>s()?.gender??"M",i=>this.svc.patchPlayer(t,{gender:i})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]}}),this.mountSelect(this.ref(n,"tee"),e,{value:this.bound(e,()=>s()?.teeId??"",i=>this.svc.patchPlayer(t,{teeId:i})),options:{get:()=>this.svc.tees.get().map(i=>({value:i.id,label:i.name}))},placeholder:"Tee"}),n}}const ks=y(`
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
`);class Ss extends E{static styles=`
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
                    ${T()}
                    background: ${a("primary")};
                    color: ${a("primary-text")};
                    border: none;
                    &:hover { background: ${a("primary")}; }
                }
            }
        }
    `;auth=this.inject(it);router=this.inject(j);username="";password="";render(){return this.wire(ks,{root:{inert:()=>this.auth.loading.get()},error:{className:()=>this.auth.error.get()?"error show":"error",textContent:()=>this.auth.error.get()?.message??""},form:{onsubmit:async t=>{t.preventDefault(),await this.auth.login(this.username,this.password)&&this.router.navigate("/rounds",!0)}},username:{oninput:t=>{this.username=t.target.value}},password:{oninput:t=>{this.password=t.target.value}},submit:{textContent:()=>this.auth.loading.get()?"Signing in…":"Sign in"}})}}class Ts{loading=new h(!1);error=new h(null);guests=new h([]);async load(){const t=await C(this.loading,this.error,()=>k.guestPlayers.list());t&&this.guests.set(t)}async create(t){const e=await C(this.loading,this.error,()=>k.guestPlayers.create(t));return e&&this.guests.update(s=>[...s,e]),e??null}}const Is=y(`
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
`),Es=y(`
    <div class="player-row">
        <span bind="initials" class="player-row__badge"></span>
        <span bind="name" class="player-row__name"></span>
        <span bind="hcp" class="player-row__hcp"></span>
    </div>
`);function Ps(o){return o.split(/\s+/).filter(Boolean).slice(0,2).map(t=>t[0].toUpperCase()).join("")}class Cs extends E{static styles=`
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
                    ${T()}
                    background: ${a("primary")};
                    color: ${a("primary-text")};
                    border: none;
                    &:hover { background: ${a("primary")}; }
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
        }
    `;svc=this.inject(Ts);name=new h("");gender=new h("M");hcp=new h("");render(){this.svc.load();const t=this.wire(Is,{name:{value:()=>this.name.get(),oninput:e=>this.name.set(e.target.value)},hcp:{value:()=>this.hcp.get(),oninput:e=>this.hcp.set(e.target.value)},genderM:{className:()=>this.gender.get()==="M"?"on":"",onclick:()=>this.gender.set("M")},genderF:{className:()=>this.gender.get()==="F"?"on":"",onclick:()=>this.gender.set("F")},submit:{disabled:()=>this.name.get().trim()===""||this.svc.loading.get()},form:{onsubmit:async e=>{e.preventDefault();const s=this.hcp.get().trim().replace(",",".");await this.svc.create({displayName:this.name.get().trim(),gender:this.gender.get(),handicapIndex:s===""?null:Number(s)})&&(this.name.set(""),this.hcp.set(""))}}});return this.$each(this.ref(t,"list"),this.svc.guests,(e,s,r)=>this.wireEl(Es,{initials:()=>Ps(e.displayName),name:()=>e.displayName,hcp:()=>e.handicapIndex===null?"–":e.handicapIndex.toFixed(1)},r),e=>e.id),t}}class Os{loading=new h(!1);error=new h(null);rounds=new h([]);async load(){const t=await C(this.loading,this.error,()=>k.rounds.list());t&&this.rounds.set(t)}}const zs=y(`
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
`),js=y(`
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
`);class Ns extends E{static styles=`
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
                ${T()}
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
    `;svc=this.inject(Os);router=this.inject(j);render(){this.svc.load();const t=this.wire(zs,{subtitle:()=>{const s=this.svc.rounds.get().length;return s===0?"No rounds yet — tee one up.":`${s} round${s===1?"":"s"} on the card.`},newBtn:{onclick:()=>this.router.navigate("/create")}}),e={not_started:"Not started",active:"Live",complete:"Done"};return this.$each(this.ref(t,"list"),this.svc.rounds,(s,r,n)=>this.wireEl(js,{row:{disabled:!0},course:()=>s.courseNameSnapshot??"Round",status:{textContent:()=>e[s.status]??s.status,className:()=>`round-row__status s-${s.status}`},date:()=>s.date,formats:()=>s.formatSlots.map(at).join(" · ")},n),s=>s.id),t}}const Hs=y(`
    <div class="app-shell">
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class Ms extends E{static styles=`
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
    `;router=this.inject(j);render(){const t=this.wire(Hs,{});return this.spawn(de,this.ref(t,"nav")),this.$swap(this.ref(t,"content"),this.router.route,{"/":_t,"/round":us,"/create":$s,"/login":Ss,"/rounds":Ns,"/players":Cs},_t),t}}O.get(Xt);const kt=O.get(j),St=O.get(it);await Qt(Ms,"#app",{hot:void 0,onInit:async()=>{await St.load(),St.currentUser.get()&&kt.route.get()==="/login"&&kt.navigate("/",!0)}});export{E as C,j as R,h as S,Xt as T,p as a,U as b,I as c,v as e,C as r,y as t};
