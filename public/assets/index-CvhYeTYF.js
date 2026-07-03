(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(r){if(r.ep)return;r.ep=!0;const n=t(r);fetch(r.href,n)}})();const Qe="modulepreload",Ve=function(i){return"/tapscore/"+i},fe={},Ye=function(e,t,s){let r=Promise.resolve();if(t&&t.length>0){let c=function(u){return Promise.all(u.map(f=>Promise.resolve(f).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),d=o?.nonce||o?.getAttribute("nonce");r=c(t.map(u=>{if(u=Ve(u),u in fe)return;fe[u]=!0;const f=u.endsWith(".css"),m=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${m}`))return;const g=document.createElement("link");if(g.rel=f?"stylesheet":Qe,f||(g.as="script"),g.crossOrigin="",g.href=u,d&&g.setAttribute("nonce",d),document.head.appendChild(g),f)return new Promise((v,M)=>{g.addEventListener("load",v),g.addEventListener("error",()=>M(new Error(`Unable to preload CSS for ${u}`)))})}))}function n(o){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=o,window.dispatchEvent(d),!d.defaultPrevented)throw o}return r.then(o=>{for(const d of o||[])d.status==="rejected"&&n(d.reason);return e().catch(n)})};class Je{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])this.batching?this.pending.add(t):t.run()}runTracked(e,t){Oe(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.run()}}}const R=new Je;function Oe(i){for(const e of i.deps)e.delete(i);i.deps.clear()}class h{constructor(e){this.subs=new Set,this.val=e}get(){return R.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,R.notify(this.subs))}update(e){this.set(e(this.val))}}class T{constructor(e){this.subs=new Set,this.val=void 0;const t=this,s={run(){R.runTracked(s,()=>{const r=e();Object.is(t.val,r)||(t.val=r,R.notify(t.subs))})},deps:new Set};s.run()}get(){return R.subscribe(this.subs),this.val}peek(){return this.val}}function x(i){const e={run(){R.runTracked(e,i)},deps:new Set};return e.run(),()=>Oe(e)}function X(i){R.batch(i)}function G(i){return R.untrack(i)}class Ze{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const H=new Ze,U="/tapscore/".replace(/\/+$/,"");function ie(i){return U?i===U?"/":i.startsWith(U+"/")?i.slice(U.length):i:i}function et(i){return U+i}class z{constructor(){this.route=new h(ie(location.pathname??"/")),this.search=new h(location.search??""),window.addEventListener("popstate",()=>X(()=>{this.route.set(ie(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},r=e.indexOf("#"),n=r>=0?e.slice(r):"",o=r>=0?e.slice(0,r):e,d=o.indexOf("?"),c=d>=0?o.slice(0,d):o,u=d>=0?o.slice(d+1):"",f=s.query!==void 0?tt(s.query):u?"?"+u:"",m=et(c)+f+n;(s.replace?history.replaceState:history.pushState).call(history,null,"",m),X(()=>{this.route.set(c),this.search.set(f)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:r=>{r.preventDefault(),this.navigate(e)},className:()=>{const r=this.route.get();return r===s||r.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new T(()=>{const s=this.route.get().split("/"),r={};for(const[n,o]of t.entries())o.startsWith(":")&&(r[o.slice(1)]=s[n]??"");return r})}query(e){return new T(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new T(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function tt(i){const e=new URLSearchParams;for(const[s,r]of Object.entries(i))r==null||r===""||e.set(s,String(r));const t=e.toString();return t?"?"+t:""}function st(i){return e=>i[e]}function nt(i,e){const t=(r,n,o)=>{const d=Object.entries(r).map(([c,u])=>`--${c}:${u}`).join(";");return`${n}{color-scheme:${o};${d}}`},s=document.createElement("style");return s.textContent=t(i,'[data-theme="light"]',"light")+t(e,'[data-theme="dark"]',"dark"),document.head.appendChild(s),r=>`var(--${r})`}const ge="basics-js-theme";class rt{constructor(){this.dark=new h(!1);const e=localStorage.getItem(ge),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),x(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(ge,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function b(i){const e=document.createElement("template");return e.innerHTML=i,e}function it(i,e){let t;for(const s of Object.keys(e))i.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const be=new Set;class P{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!be.has(t)){be.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return H.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const r=G(()=>{const n=new e(s[0]);return n.mount(t),n});return this.children.push(r),r}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0}wire(e,t,s){const r=s??(o=>this.track(o)),n=e.content.cloneNode(!0);for(const o of n.querySelectorAll("[bind]")){const d=t[o.getAttribute("bind")];if(d)if(typeof d=="function")r(x(()=>{const c=d();o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement?o.value=String(c):o.textContent=String(c)}));else for(const[c,u]of Object.entries(d)){const f=c.includes("-");c.startsWith("on")&&typeof u=="function"?o.addEventListener(c.slice(2),u):typeof u=="function"?r(x(()=>{const m=u();f?o.setAttribute(c,String(m)):o[c]=m})):f?o.setAttribute(c,String(u)):o[c]=u}}return n}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const r=this.ref(t,e);return r?(typeof s=="string"?r.textContent=s:typeof s=="function"&&s.prototype instanceof P?this.spawn(s,r):typeof s=="function"&&s(r,{spawn:(n,o,...d)=>this.spawn(n,o,...d),track:n=>this.track(n)}),!0):!1}$each(e,t,s,r=(n,o)=>o){const n=typeof t=="function"?t:()=>t.get(),o=new Map,d=new Map;this.track(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),this.track(x(()=>{const c=n(),u=new Map;for(const[m,g]of c.entries()){const v=r(g,m);if(o.has(v))u.set(v,o.get(v));else{const M=[];u.set(v,G(()=>s(g,m,$=>M.push($)))),d.set(v,M)}}for(const[m,g]of o)u.has(m)||(g.remove(),d.get(m)?.forEach(v=>v()),d.delete(m));let f=e.firstChild;for(const m of u.values())m===f?f=f.nextSibling:e.insertBefore(m,f);o.clear();for(const[m,g]of u)o.set(m,g)}))}$condition(e,t,s,r){let n=null;this.track(x(()=>{n&&(n.remove(),n=null);const o=t.get();n=G(()=>o?s():r?.()??null),n&&e.appendChild(n)}))}$swap(e,t,s,r){let n=null;this.track(x(()=>{n&&(n.destroy(),n=null),e.textContent="";const o=t.get(),d=s[o]??it(o,s)??r;d&&(n=G(()=>{const c=new d;return c.mount(e),c}))})),this.track(()=>n?.destroy())}}async function ot(i,e,t){const s=document.querySelector(e);s.textContent="";const r=H.get(z);let n=null,o=!1,d=null,c=!!t?.hot?.data.hmr;const u=async f=>{n&&(n.destroy(),n=null,s.textContent=""),f?(d||(d=(await Ye(()=>import("./obs-shell.component-BdU4oxev.js"),[])).ObsShellComponent),n=G(()=>new d)):(!c&&t?.onInit&&(await t.onInit(),c=!0),n=G(()=>new i)),G(()=>n.mount(s)),o=f};await u(ie(location.pathname).startsWith("/_obs")),x(()=>{const f=r.route.get().startsWith("/_obs");f!==o&&u(f)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>n?.destroy()),t.hot.accept())}class O extends Error{constructor(e,t,s,r){super(t),this.status=e,this.details=s,this.traceId=r,this.name="ApiError"}}const at=10,Y=[];let J=[],W=null;function lt(i){Y.push(i),Y.length>at&&Y.shift()}function dt(i,e,t){const s={code:i,message:e,url:typeof location<"u"?location.href:"",context:[...Y],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),J.push(s),ct()}function ct(){W||(W=setTimeout(je,5e3))}function je(){if(W&&(clearTimeout(W),W=null),J.length===0)return;const i=J;J=[];for(const e of i){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon("/api/_obs/errors",new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch("/api/_obs/errors",{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&je()});const ut=3e4,ht=2,Q=new Map,He=new WeakMap;function pt(i){if(i instanceof O)return i.traceId;if(i!=null&&typeof i=="object")return He.get(i)}async function p(i){if(i.method==="GET"){const e=Q.get(i.url);if(e)return e;const t=ye(i,ht);return Q.set(i.url,t),t.then(()=>Q.delete(i.url),()=>Q.delete(i.url)),t}return ye(i,0)}async function ye(i,e){const t=i.timeout??ut;let s;for(let r=0;r<=e;r++){const n=crypto.randomUUID();try{return await ft(mt(i,n),t)}catch(o){if(s=o,!(o instanceof O)&&o!=null&&typeof o=="object"&&He.set(o,n),o instanceof O||r===e)break;await new Promise(d=>setTimeout(d,1e3*2**r))}}throw s}async function mt(i,e){const t={"X-Trace-Id":e},s={method:i.method,headers:t};i.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(i.body));const r=await fetch(i.url,s),n=r.headers.get("x-trace-id")??e;if(lt({type:"api",detail:`${i.method} ${i.url}`,timestamp:new Date().toISOString()}),!r.ok){const o=await r.json().catch(()=>({error:r.statusText}));throw new O(r.status,o.error??r.statusText,o.details,n)}return r.json()}function ft(i,e){let t;const s=new Promise((r,n)=>{t=setTimeout(()=>n(new Error("Request timeout")),e)});return Promise.race([i,s]).finally(()=>clearTimeout(t))}async function S(i,e,t){X(()=>{i.set(!0),e.set(null)});try{const s=await t();return i.set(!1),s}catch(s){const r=gt(s);X(()=>{i.set(!1),e.set(r)}),dt(r.code,r.message,pt(s));return}}function gt(i){return i instanceof O?i.status===401?{code:"auth",message:"Unauthorized"}:i.status===409?{code:"conflict",message:"Data has changed — please try again"}:i.status===400?{code:"validation",message:i.message}:{code:"server",message:"Server error"}:i instanceof Error?i.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}function bt(i){return{me:()=>p({method:"GET",url:`${i}/auth/me`}),login:e=>p({method:"POST",url:`${i}/auth/login`,body:e}),logout:()=>p({method:"POST",url:`${i}/auth/logout`,body:{}})}}class F{constructor(){this.api=bt("/api"),this.currentUser=new h(null),this.loading=new h(!1),this.error=new h(null)}async load(){const e=await S(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await S(this.loading,this.error,()=>this.api.login({username:e,password:t}));return s?(this.currentUser.set(s),!0):!1}async logout(){await S(this.loading,this.error,()=>this.api.logout());const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const _e={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},l=nt({..._e,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},{..._e,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"}),I=i=>`var(--${i})`,a=st({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem"}),w=(i=I("radius"))=>`
    border: 1px solid ${I("border")};
    border-radius: ${i};
    background: ${I("btn-bg")};
    color: ${I("text")};
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: ${I("btn-hover")}; }
`,j=()=>`
    border: 1px solid ${I("border")};
    border-radius: ${I("radius")};
    background: ${I("input-bg")};
    color: ${I("text")};
    font-family: inherit;
    &::placeholder { color: ${I("text-muted")}; }
`,N=i=>`
    background: ${I("surface")};
    border: 1px solid ${I("border")};
    border-radius: ${I("radius")};
    box-shadow: ${I("shadow")};
    ${i?.hover?`
    transition: box-shadow 0.2s, border-color 0.2s;
    &:hover { box-shadow: ${I("shadow-elevated")}; }`:""}
`,yt=b(`
    <nav class="tabbar" bind="root">
        <a bind="homeLink" href="/">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v10h12V10"/><path d="M10 20v-5.5h4V20"/>
            </svg>
            <span>Home</span>
        </a>
        <a bind="friendsLink" href="/friends">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="8" r="3.5"/><path d="M3.5 20c.5-3.5 2.7-5.5 5.5-5.5s5 2 5.5 5.5"/><circle cx="16.5" cy="9.5" r="2.8"/><path d="M16.8 14.6c2.2.4 3.5 2 3.9 4.9"/>
            </svg>
            <span>Friends</span>
        </a>
        <a bind="profileLink" href="/profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M5 20c.7-4 3.3-6 7-6s6.3 2 7 6"/>
            </svg>
            <span>Profile</span>
        </a>
    </nav>
`);class _t extends P{static styles=`
        .tabbar {
            display: flex;
            background: ${l("topbar-bg")};
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

                &.active { color: ${l("accent")}; }
            }
        }
    `;router=this.inject(z);auth=this.inject(F);render(){return this.wire(yt,{root:{className:()=>{const e=this.router.route.get();return!this.auth.currentUser.get()||e==="/login"||e==="/round"?"tabbar hidden":"tabbar"}},homeLink:this.router.link("/"),friendsLink:this.router.link("/friends"),profileLink:this.router.link("/profile")})}}function vt(i){return{async me(){return p({method:"GET",url:`${i}/players/me`})},async register(e){return p({method:"POST",url:`${i}/players/register`,body:e})},async updateHandicap(e){return p({method:"POST",url:`${i}/players/me/handicap`,body:e})},async myHandicapHistory(){return p({method:"GET",url:`${i}/players/me/handicap-history`})},async updateProfile(e){return p({method:"POST",url:`${i}/players/me/profile`,body:e})},async search(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/players/search${s?"?"+s:""}`})}}}function xt(i){return{async list(){return p({method:"GET",url:`${i}/friends`})},async add(e){return p({method:"POST",url:`${i}/friends`,body:e})},async remove(e){return p({method:"DELETE",url:`${i}/friends/${e.friendId}`})}}}function wt(i){return{async list(){return p({method:"GET",url:`${i}/clubs`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/clubs/get${s?"?"+s:""}`})},async create(e){return p({method:"POST",url:`${i}/clubs`,body:e})},async update(e){return p({method:"POST",url:`${i}/clubs/update`,body:e})},async remove(e){return p({method:"DELETE",url:`${i}/clubs/${e.id}`})}}}function $t(i){return{async list(){return p({method:"GET",url:`${i}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/courses/by-club${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/courses/get${s?"?"+s:""}`})},async create(e){return p({method:"POST",url:`${i}/courses`,body:e})},async update(e){return p({method:"POST",url:`${i}/courses/update`,body:e})},async updateHole(e){return p({method:"POST",url:`${i}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/courses/validate${s?"?"+s:""}`})},async remove(e){return p({method:"DELETE",url:`${i}/courses/${e.id}`})}}}function kt(i){return{async listByCourse(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/tees/by-course${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/tees/get${s?"?"+s:""}`})},async create(e){return p({method:"POST",url:`${i}/tees`,body:e})},async update(e){return p({method:"POST",url:`${i}/tees/update`,body:e})},async remove(e){return p({method:"DELETE",url:`${i}/tees/${e.id}`})}}}function St(i){return{async list(){return p({method:"GET",url:`${i}/guest-players`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/guest-players/get${s?"?"+s:""}`})},async create(e){return p({method:"POST",url:`${i}/guest-players`,body:e})}}}function It(i){return{async latest(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/handicap/latest${s?"?"+s:""}`})},async history(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/handicap/history${s?"?"+s:""}`})},async record(e){return p({method:"POST",url:`${i}/handicap/record`,body:e})}}}function Et(i){return{async list(){return p({method:"GET",url:`${i}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/rounds/balls${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/rounds/get${s?"?"+s:""}`})},async create(e){return p({method:"POST",url:`${i}/rounds`,body:e})},async createFromDraft(e){return p({method:"POST",url:`${i}/rounds/from-draft`,body:e})},async update(e){return p({method:"POST",url:`${i}/rounds/update`,body:e})},async remove(e){return p({method:"DELETE",url:`${i}/rounds/${e.id}`})}}}function Tt(i){return{async listByRound(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/score-events/by-round${s?"?"+s:""}`})},async append(e){return p({method:"POST",url:`${i}/score-events`,body:e})}}}function Pt(i){return{async forBall(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/scorecards/for-ball${s?"?"+s:""}`})},async forRound(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/scorecards/for-round${s?"?"+s:""}`})}}}function Ct(i){return{async forRound(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/leaderboards/for-round${s?"?"+s:""}`})}}}function Nt(i){return{async list(){return p({method:"GET",url:`${i}/friendly-rounds`})},async create(e){return p({method:"POST",url:`${i}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/friendly-rounds/by-token${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/friendly-rounds/get${s?"?"+s:""}`})},async balls(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/friendly-rounds/balls${s?"?"+s:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/friendly-rounds/scorecard${s?"?"+s:""}`})},async result(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/friendly-rounds/result${s?"?"+s:""}`})},async score(e){return p({method:"POST",url:`${i}/friendly-rounds/score`,body:e})},async claimGuest(e){return p({method:"POST",url:`${i}/friendly-rounds/claim-guest`,body:e})}}}function zt(i){return{async myRounds(){return p({method:"GET",url:`${i}/dashboard/my-rounds`})}}}function Ot(i){return{async courses(){return p({method:"GET",url:`${i}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[r,n]of Object.entries(e))n!==void 0&&t.set(r,String(n));const s=t.toString();return p({method:"GET",url:`${i}/setup/tees/by-course${s?"?"+s:""}`})},async formats(){return p({method:"GET",url:`${i}/setup/formats`})}}}const E="/tapscore/".replace(/\/+$/,"")+"/api",_={players:vt(E),friends:xt(E),clubs:wt(E),courses:$t(E),tees:kt(E),guestPlayers:St(E),handicap:It(E),rounds:Et(E),scoreEvents:Tt(E),scorecards:Pt(E),leaderboards:Ct(E),friendlyRounds:Nt(E),dashboard:zt(E),setup:Ot(E)};function jt(i){return[...i.played?["Played"]:[],...i.created?["Created"]:[]].join(" · ")}function Ht(i,e){const t=new Map;for(const s of e)t.set(s.round.id,{round:s.round,token:s.friendlyRound.shareToken,played:!1,created:!0});for(const s of i){const r=t.get(s.round.id);r?r.played=!0:t.set(s.round.id,{round:s.round,token:s.shareToken,played:!0,created:!1})}return[...t.values()].sort((s,r)=>r.round.date.localeCompare(s.round.date)||s.round.id.localeCompare(r.round.id))}class Mt{loading=new h(!1);error=new h(null);rounds=new h([]);mine=new h(null);mineLoading=new h(!1);mineError=new h(null);myRounds=new T(()=>{const e=this.mine.get();return e?Ht(e.produced,e.created):[]});async load(){const e=await S(this.loading,this.error,()=>_.friendlyRounds.list());e&&this.rounds.set(e)}async loadMine(){const e=await S(this.mineLoading,this.mineError,()=>_.dashboard.myRounds());e&&this.mine.set(e)}}function Lt(i){const e=typeof navigator<"u"?navigator.language:void 0;return typeof e=="string"&&e.toLowerCase().startsWith("sv")?"sv":"en"}function Rt(){return Lt()}class Z{loading=new h(!1);error=new h(null);descriptors=new h([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await S(this.loading,this.error,()=>_.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=Rt()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:s.teamSize?.min??2,max:s.teamSize?.max??2},...s.teamCount?{teamCount:s.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}}function oe(i){const e=H.get(Z);return e.load(),e.labelOf(i.formatId)??`${i.scoringMode} · ${i.teamShape}`}const Ft=b(`
    <div class="landing">
        <header class="landing__head">
            <div class="landing__flag">⛳</div>
            <h1>tapscore</h1>
            <p>Scores, settled on the green. No sign-in needed.</p>
        </header>
        <button bind="createBtn" class="landing__create" type="button">
            <span class="landing__create-plus">+</span> Create round
        </button>
        <div bind="mySection" class="landing__mine">
            <div class="landing__section">
                <span class="landing__section-title">My rounds</span>
                <span bind="myCount" class="landing__count"></span>
            </div>
            <div bind="myEmpty" class="landing__empty">Nothing on your card yet — rounds you create or play in land here.</div>
            <div bind="myList" class="landing__list"></div>
        </div>
        <div class="landing__section">
            <span class="landing__section-title">Rounds</span>
            <span bind="count" class="landing__count"></span>
        </div>
        <div bind="empty" class="landing__empty">No rounds yet — create one to tee off.</div>
        <div bind="list" class="landing__list"></div>
        <button bind="signin" class="landing__signin" type="button">Sign in</button>
    </div>
`),Bt=b(`
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
`),qt=b(`
    <button bind="row" type="button" class="round-row">
        <div class="round-row__top">
            <span bind="course" class="round-row__course"></span>
            <span bind="role" class="round-row__role"></span>
            <span bind="status" class="round-row__status"></span>
        </div>
        <div class="round-row__bottom">
            <span bind="date"></span>
            <span bind="formats" class="round-row__formats"></span>
        </div>
    </button>
`),ve={not_started:"Not started",active:"Live",complete:"Done"};class xe extends P{static styles=`
        .landing {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .landing__head {
                text-align: center;
                margin-bottom: ${a("xl")};

                & .landing__flag { font-size: 2.2rem; line-height: 1; }
                & h1 {
                    margin: ${a("xs")} 0 0;
                    font-family: ${l("font-display")};
                    font-weight: 600;
                    font-size: 2.2rem;
                    letter-spacing: -0.02em;
                    color: ${l("text")};
                }
                & p {
                    margin: ${a("xs")} 0 0;
                    color: ${l("text-muted")};
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
                ${w()}
                background: ${l("primary")};
                color: ${l("primary-text")};
                border: none;
                box-shadow: ${l("shadow-elevated")};
                &:hover { background: ${l("primary")}; }

                & .landing__create-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .landing__section {
                display: flex;
                align-items: baseline;
                gap: ${a("sm")};
                margin-bottom: ${a("sm")};

                & .landing__section-title {
                    font-family: ${l("font-display")};
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: ${l("text")};
                }
                & .landing__count {
                    color: ${l("text-muted")};
                    font-size: 0.85rem;
                }
            }

            & .landing__empty {
                color: ${l("text-muted")};
                font-size: 0.9rem;
                padding: ${a("lg")} 0;

                &.hidden { display: none; }
            }

            & .landing__mine {
                margin-bottom: ${a("xl")};
                &.hidden { display: none; }
            }

            & .round-row__role {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: ${l("accent")};
                flex-shrink: 0;
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
                ${N({hover:!0})}

                & .round-row__top {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    gap: ${a("md")};
                }
                & .round-row__course {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${l("text")};
                }
                & .round-row__status {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    border-radius: ${l("radius-pill")};
                    padding: 2px 10px;
                    flex-shrink: 0;

                    &.s-active { background: ${l("accent-soft")}; color: ${l("accent")}; }
                    &.s-complete { background: ${l("surface-sunken")}; color: ${l("text-muted")}; }
                    &.s-not_started { background: ${l("surface-sunken")}; color: ${l("text-muted")}; }
                }
                & .round-row__bottom {
                    display: flex;
                    justify-content: space-between;
                    gap: ${a("md")};
                    color: ${l("text-muted")};
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
                &.hidden { display: none; }
                margin: ${a("2xl")} auto 0;
                padding: ${a("sm")} ${a("lg")};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 600;
                color: ${l("text-muted")};
                text-decoration: underline;
                cursor: pointer;
            }
        }
    `;svc=this.inject(Mt);auth=this.inject(F);router=this.inject(z);render(){this.svc.load();const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.loadMine();const t=this.wire(Ft,{createBtn:{onclick:()=>this.router.navigate("/create")},signin:{className:()=>e()?"landing__signin hidden":"landing__signin",onclick:()=>this.router.navigate("/login")},mySection:{className:()=>e()?"landing__mine":"landing__mine hidden"},myCount:()=>{const s=this.svc.myRounds.get().length;return s===0?"":`${s} on the card`},myEmpty:{className:()=>e()&&this.svc.myRounds.get().length===0&&!this.svc.mineLoading.get()?"landing__empty":"landing__empty hidden"},count:()=>{const s=this.svc.rounds.get().length;return s===0?"":`${s} on the card`},empty:{className:()=>this.svc.rounds.get().length===0?"landing__empty":"landing__empty hidden"}});return this.$each(this.ref(t,"list"),this.svc.rounds,(s,r,n)=>this.wireEl(Bt,{row:{onclick:()=>this.router.navigate("/round",{query:{token:s.friendlyRound.shareToken}})},course:()=>s.round.courseNameSnapshot??"Round",status:{textContent:()=>ve[s.round.status]??s.round.status,className:()=>`round-row__status s-${s.round.status}`},date:()=>s.round.date,formats:()=>s.round.formatSlots.map(oe).join(" · ")},n),s=>s.friendlyRound.id),this.$each(this.ref(t,"myList"),this.svc.myRounds,(s,r,n)=>this.wireEl(qt,{row:{disabled:()=>s.token===null,onclick:()=>{s.token!==null&&this.router.navigate("/round",{query:{token:s.token}})}},course:()=>s.round.courseNameSnapshot??"Round",role:()=>jt(s),status:{textContent:()=>ve[s.round.status]??s.round.status,className:()=>`round-row__status s-${s.round.status}`},date:()=>s.round.date,formats:()=>s.round.formatSlots.map(oe).join(" · ")},n),s=>s.round.id),t}}const At=180,we=4,Dt=12;function K(i,e){return e<=0?0:Math.max(0,Math.min(e-1,i))}function Gt(i){const{dragDistance:e,velocity:t,itemWidth:s}=i;if(Math.abs(e)<Dt)return 0;const r=e+t*At,n=Math.round(-r/s);return Math.max(-we,Math.min(we,n))}const $e="tapscore:pending-scores:v1",Kt=336*60*60*1e3,ke=200;function Ut(){try{return globalThis.localStorage??null}catch{return null}}function Wt(i){if(typeof i!="object"||i===null)return!1;const e=i;return typeof e.token=="string"&&typeof e.ballId=="string"&&typeof e.playHoleId=="string"&&(typeof e.strokes=="number"||e.strokes===null)&&(e.eventType==="score_entered"||e.eventType==="score_cleared")&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class Xt{entries=[];storage;constructor(e=Ut(),t=Date.now()){this.storage=e,this.entries=this.load();const s=this.applyHygiene(t);s.length!==this.entries.length&&(this.entries=s,this.persist())}enqueue(e){const t=this.entries.findIndex(s=>s.token===e.token&&s.ballId===e.ballId&&s.playHoleId===e.playHoleId);t>=0?this.entries[t]=e:this.entries.push(e),this.entries=this.applyHygiene(e.queuedAt),this.persist()}remove(e){const t=this.entries.filter(s=>s.clientEventId!==e);t.length!==this.entries.length&&(this.entries=t,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(s=>e-s.queuedAt<=Kt);return t.length>ke?t.slice(t.length-ke):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem($e);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(Wt):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem($e,JSON.stringify(this.entries))}catch{}}}const Qt=["1st","2nd","3rd","4th","5th","6th","7th","8th"],q=(i,e)=>`${i}|${e}`;function Me(i){return i.players.map(e=>e.displayName).join(" & ")||i.label||"Ball"}function Vt(i,e,t){return i?!(i.minPar!==void 0&&e<i.minPar||i.maxPar!==void 0&&e>i.maxPar||i.pars&&!i.pars.includes(e)||i.holes&&!i.holes.includes(t)):!0}class ee{constructor(e=new Xt){this.queue=e}queue;loading=new h(!1);error=new h(null);friendlyRound=new h(null);round=new h(null);balls=new h([]);scorecards=new h([]);cells=new h(new Map);result=new h(null);resultLoading=new h(!1);resultError=new h(null);holeIdx=new h(0);groupIdx=new h(0);selectedSlot=new h(null);token=null;loadSeq=0;resultSeq=0;flushing=!1;pendingSlotIndex=null;async loadByToken(e,t){const s=e!==this.token;this.token=e;const r=++this.loadSeq;s&&this.resetForNewToken(t),H.get(Z).load();const n=await S(this.loading,this.error,()=>_.friendlyRounds.byToken({token:e}));if(!n||r!==this.loadSeq||e!==this.token)return;if(this.friendlyRound.set(n.friendlyRound),this.round.set(n.round),this.pendingSlotIndex!==null){const u=n.round.formatSlots[this.pendingSlotIndex]?.slotDefId??null;this.pendingSlotIndex=null,u!==null&&this.selectedSlot.set(u)}const[o,d]=await Promise.all([_.friendlyRounds.balls({token:e}).catch(()=>[]),_.friendlyRounds.scorecard({token:e}).catch(()=>[])]);r!==this.loadSeq||e!==this.token||(this.cells.set(new Map),this.scorecards.set(d),this.balls.set(o),await this.flushPending())}async loadResult(){const e=this.token;if(!e)return;const t=++this.resultSeq,s=await S(this.resultLoading,this.resultError,()=>_.friendlyRounds.result({token:e}));t!==this.resultSeq||e!==this.token||s&&this.result.set(s)}ballNameById=new T(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,Me(t));return e});nameOf(e){return this.ballNameById.get().get(e)??e}selectedSlotDefId(){const e=this.round.get()?.formatSlots??[];if(e.length===0)return null;const t=this.selectedSlot.get();return t!==null&&e.some(s=>s.slotDefId===t)?t:e[0]?.slotDefId??null}selectSlot(e){this.selectedSlot.set(e)}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return K(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),s=t?.playHoles.find(o=>o.id===e);if(!t||!s)return"";const r=t.playHoles.filter(o=>o.courseHoleNumber===s.courseHoleNumber).sort((o,d)=>o.ordinal-d.ordinal);if(r.length===1)return`${s.courseHoleNumber}`;const n=r.findIndex(o=>o.id===e);return`${s.courseHoleNumber} (${Qt[n]??`${n+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(K(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(K(this.holeIndex()+1,this.playedOrder().length))}strokesFor(e,t){const s=this.cells.get().get(q(e,t));return s?s.strokes:this.scorecards.get().find(o=>o.ballId===e)?.holes.find(o=>o.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(q(e,t))?.status??null}metadataFor(e,t,s){const r=this.cells.get().get(q(e,t));return r&&r.metadata!==void 0?r.metadata?.[s]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[s]}metadataInputs(){const e=H.get(Z),t=this.round.get()?.formatSlots??[],s=[],r=new Set;for(const n of t){const o=e.byId(n.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of o)r.has(d.key)||(r.add(d.key),s.push(d))}return s}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>Vt(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,s,r){const n=q(e,t),o=crypto.randomUUID();this.patchCell(n,{strokes:s,metadata:r,status:"saving",clientEventId:o});const d=this.token;d&&(this.enqueue(d,e,t,s,r,o),await this.post(d,e,t,s,r,o))}async retry(e,t){const s=q(e,t),r=this.cells.get().get(s);if(!r)return;this.patchCell(s,{...r,status:"saving"});const n=this.token;n&&(this.enqueue(n,e,t,r.strokes,r.metadata,r.clientEventId),await this.post(n,e,t,r.strokes,r.metadata,r.clientEventId))}async flushPending(){const e=this.token;if(!(!e||this.flushing)){this.flushing=!0;try{for(const t of this.queue.entriesFor(e)){if(e!==this.token)return;this.patchCell(q(t.ballId,t.playHoleId),{strokes:t.strokes,metadata:t.metadata,status:"saving",clientEventId:t.clientEventId}),await this.post(e,t.ballId,t.playHoleId,t.strokes,t.metadata,t.clientEventId)}}finally{this.flushing=!1}}}enqueue(e,t,s,r,n,o){this.queue.enqueue({token:e,ballId:t,playHoleId:s,strokes:r,eventType:r===null?"score_cleared":"score_entered",clientEventId:o,...n!==void 0?{metadata:n}:{},queuedAt:Date.now()})}async post(e,t,s,r,n,o){const d=q(t,s);try{await _.friendlyRounds.score({token:e,ballId:t,playHoleId:s,strokes:r,eventType:r===null?"score_cleared":"score_entered",clientEventId:o,...n!=null?{metadata:n}:{}}),this.queue.remove(o);const c=this.cells.get().get(d);c&&c.clientEventId===o&&this.patchCell(d,{...c,status:"saved"});const u=this.round.get();e===this.token&&u&&u.status==="not_started"&&this.round.set({...u,status:"active"})}catch{const c=this.cells.get().get(d);c&&c.clientEventId===o&&this.patchCell(d,{...c,status:"error"})}}patchCell(e,t){const s=new Map(this.cells.get());s.set(e,t),this.cells.set(s)}resetForNewToken(e){this.resultSeq++,this.friendlyRound.set(null),this.round.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(e?.holeIdx??0),this.groupIdx.set(e?.groupIdx??0);const t=e?.selectedSlot;this.pendingSlotIndex=null,typeof t=="string"?this.selectedSlot.set(t):typeof t=="number"?(this.pendingSlotIndex=t,this.selectedSlot.set(null)):this.selectedSlot.set(null)}}const A=60,Se=8,ae=4,Yt=Array.from({length:ae*2+1},(i,e)=>e-ae),Jt="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",Zt=b(`
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
`),es=b(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),ts=b(`
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
`),ss=b(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),Ie=b(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),ns=b(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`);class rs extends P{static styles=`
        .se {
            margin-top: ${a("xl")};
            &.hidden { display: none; }
        }

        /* Clipped two-cell carousel right-aligned over the score columns. */
        .se__carousel {
            position: relative;
            height: 60px;
            overflow: hidden;
            border-radius: ${l("radius")};
            background: ${l("surface-sunken")};
            border: 1px solid ${l("border")};
            touch-action: pan-y;
            user-select: none;
        }
        .se__clip {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${Se}px;
            width: ${A*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-ae*A}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${A}px;
            width: ${A}px;
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
                font-family: ${l("font-display")};
                font-weight: 700;
                font-size: 1.2rem;
                color: ${l("text")};
            }
            & .se-hole__par {
                font-size: 0.68rem;
                color: ${l("text-muted")};
            }
        }

        .se__rows {
            margin-top: ${a("sm")};
            border-top: 1px solid ${l("border")};
        }
        .se-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${a("md")};
            padding: ${a("md")} 0;
            border-bottom: 1px solid ${l("border")};

            & .se-row__who { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
            & .se-row__name {
                font-family: ${l("font-display")};
                font-weight: 600;
                font-size: 1.05rem;
                color: ${l("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .se-row__topar { font-size: 0.8rem; font-weight: 600; }

            & .se-row__scores { display: flex; align-items: center; padding-right: ${Se}px; flex-shrink: 0; }
            & .se-row__slot { width: ${A}px; display: flex; align-items: center; justify-content: center; }
            & .se-row__prev {
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.05rem;
                color: ${l("text-muted")};
                font-variant-numeric: tabular-nums;
            }
            & .se-row__circle {
                width: 48px; height: 48px; border-radius: 999px;
                border: none; cursor: pointer;
                background: ${l("accent-soft")};
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.25rem;
                color: ${l("primary")};
                font-variant-numeric: tabular-nums;
                transition: background 0.15s;
                &:active { background: ${l("accent")}; }
                &.empty { color: ${l("text-muted")}; background: ${l("surface-sunken")}; }
            }
        }
        .se-row__topar.under { color: ${l("under-par")}; }
        .se-row__topar.over { color: ${l("over-par")}; }
        .se-row__topar.even { color: ${l("text-muted")}; }

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
            & .se-modal__title { font-family: ${l("font-display")}; font-weight: 700; font-size: 1.1rem; }
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

            &.sel { border-left-color: ${l("primary")}; background: rgba(93,155,117,0.14); }

            & .se-mrow__who { display: flex; flex-direction: column; gap: 2px; }
            & .se-mrow__name { font-family: ${l("font-display")}; font-weight: 600; font-size: 1rem; }
            & .se-mrow__hcp { font-size: 0.8rem; color: rgba(255,255,255,0.55); }

            & .se-mrow__circle {
                width: 52px; height: 52px; border-radius: 999px;
                display: flex; align-items: center; justify-content: center;
                background: ${l("primary")};
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.25rem;
                font-variant-numeric: tabular-nums;
            }
            &.sel .se-mrow__circle { background: #fff; color: ${l("primary")}; }
        }

        .se-pad { position: relative; padding: ${a("sm")} ${a("sm")} ${a("xl")}; background: #1c1c1e; }
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
                padding: ${a("md")} ${a("lg")};
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);

                & .se-stats__back {
                    background: none; border: none; color: #fff; font-size: 1.8rem; line-height: 1;
                    width: 40px; height: 40px; border-radius: 999px; cursor: pointer;
                    &:active { background: rgba(255, 255, 255, 0.1); }
                }
                & .se-stats__hole { font-family: ${l("font-display")}; font-weight: 700; font-size: 1.1rem; }
                & .se-stats__spacer { width: 40px; }
            }

            & .se-stats__who {
                display: flex; align-items: center; justify-content: center; gap: ${a("md")};
                padding: ${a("lg")} ${a("lg")} ${a("sm")};
            }
            & .se-stats__name { font-family: ${l("font-display")}; font-weight: 700; font-size: 1.4rem; }
            & .se-stats__score {
                min-width: 44px; height: 44px; padding: 0 8px; border-radius: 999px;
                display: inline-flex; align-items: center; justify-content: center;
                background: ${l("primary")}; color: #fff;
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.3rem;
                font-variant-numeric: tabular-nums;
            }

            & .se-stats__body {
                flex: 1; overflow-y: auto;
                display: flex; flex-direction: column; gap: ${a("xl")};
                padding: ${a("lg")} ${a("lg")} ${a("xl")};
                align-content: flex-start;
            }

            /* Each metadata category is its own labeled group. */
            & .se-stats__group { display: flex; flex-direction: column; gap: ${a("sm")}; }
            & .se-stats__group-label {
                text-align: center;
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.05rem;
                color: rgba(255, 255, 255, 0.92);
            }
            & .se-stats__seg { display: flex; gap: ${a("sm")}; justify-content: center; }

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
                &.on-hit { background: ${l("primary")}; border-color: ${l("primary")}; color: #fff; }
                &.on-miss { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.45); color: #fff; }
            }

            & .se-stats__foot {
                padding: ${a("md")} ${a("lg")} ${a("xl")};
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            & .se-stats__next {
                width: 100%;
                height: 56px;
                border: none;
                border-radius: 12px;
                background: ${l("primary")};
                color: #fff;
                font-family: ${l("font-display")};
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
            &.par { background: ${l("primary")}; }
            &.clear { color: ${l("error")}; }
            &.muted { color: rgba(255,255,255,0.5); }

            & .se-key__num { font-size: 1.3rem; font-weight: 700; font-family: ${l("font-display")}; }
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
            & .se-pad__ext-val { width: 72px; text-align: center; font-family: ${l("font-display")}; font-weight: 700; font-size: 2.6rem; color: #fff; }
            & .se-pad__ext-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            & .se-pad__ext-cancel { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: #2a2a2a; color: #fff; font-weight: 600; font-family: inherit; }
            & .se-pad__ext-ok { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: ${l("primary")}; color: #fff; font-size: 1.3rem; }
        }

        .se-toast {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 60;
            background: ${l("primary")}; color: ${l("primary-text")};
            font-family: ${l("font-display")}; font-weight: 700;
            padding: ${a("md")} ${a("xl")}; border-radius: ${l("radius")};
            box-shadow: ${l("shadow-elevated")};
            &.hidden { display: none; }
        }
    `;svc=this.inject(ee);holeIdx=this.svc.holeIdx;modalOpen=new h(!1);currentBallIdx=new h(0);extendedOpen=new h(!1);extendedScore=new h(10);statsOpen=new h(!1);pendingMeta=new h({});lastMetaKey=null;toastMsg=new h(null);dragOffset=new h(0);transitioning=new h(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new T(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[K(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(s=>[s.id,s]));return e.ballIds.map(s=>t.get(s)).filter(s=>!!s)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>Me(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);toParValue=e=>{let t=0,s=0,r=!1;for(const n of this.playedOrder()){const o=this.svc.strokesFor(e.id,n.playHoleId);o!==null&&o>0&&(t+=o,s+=this.parFor(n.playHoleId),r=!0)}return r?t-s:null};toParText=e=>{const t=this.toParValue(e);return t===null?"–":t===0?"E":t>0?`+${t}`:`${t}`};toParClass=e=>{const t=this.toParValue(e);return`se-row__topar ${t===null||t===0?"even":t<0?"under":"over"}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const s=e-t;return s<=-4||s>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(s)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer)}),this.track(x(()=>{const n=this.ballsInGroup().length;n>0&&this.currentBallIdx.get()>=n&&this.currentBallIdx.set(0)}));const e=this.wire(Zt,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1)}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const n=this.currentHole();return n?`Hole ${this.occLabel(n.playHoleId)} · Par ${this.parFor(n.playHoleId)}`:""},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>this.statsOpen.set(!1)},statsHole:()=>{const n=this.currentHole();return n?`Hole ${this.occLabel(n.playHoleId)} · Par ${this.parFor(n.playHoleId)}`:""},statsTitle:()=>{const n=this.ballsInGroup()[this.currentBallIdx.get()];return n?this.ballName(n):""},statsScore:()=>{const n=this.ballsInGroup()[this.currentBallIdx.get()],o=this.currentHole();return!n||!o?"":this.displayScore(this.svc.strokesFor(n.id,o.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.advance()}}}),t=this.ref(e,"viewport"),s=this.ref(e,"track");this.bindCarouselPointer(t,s),this.track(x(()=>{s.style.transition=this.transitioning.get()?Jt:"none",s.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(s,new T(()=>Yt),(n,o,d)=>this.holeItem(n,d),n=>n),this.$each(this.ref(e,"rows"),new T(()=>{const n=this.playedOrder(),o=this.holeIndex(),d=n[o];if(!d)return[];const c=o>0?n[o-1].playHoleId:null;return this.ballsInGroup().map(u=>({ball:u,ph:d.playHoleId,prevPh:c}))}),(n,o,d)=>this.playerRow(n.ball,n.ph,n.prevPh,d),n=>`${n.ball.id}|${n.ph}`),this.$each(this.ref(e,"modalList"),new T(()=>this.ballsInGroup()),(n,o,d)=>this.modalRow(n,o,d),n=>n.id);const r=this.ref(e,"keys");for(const n of[1,2,3,4,5,6,7,8,9])r.appendChild(this.numberKey(n));return r.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),r.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),r.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(e,"statsBody"),new T(()=>this.metaInputs()),(n,o,d)=>this.metaChip(n,d),n=>n.key),this.track(x(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null;return}const n=this.ballsInGroup()[this.currentBallIdx.get()],o=this.currentHole();if(!n||!o)return;const d=`${n.id}|${o.playHoleId}`;if(d===this.lastMetaKey)return;this.lastMetaKey=d;const c={};for(const u of this.metaInputs())c[u.key]=this.svc.metadataFor(n.id,o.playHoleId,u.key)===!0;this.pendingMeta.set(c)})),e}holeItem(e,t){return this.wireEl(es,{item:{className:()=>{const s=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${s?" gone":""}`}},hnum:{textContent:()=>{const s=this.occAtOffset(e);return s?this.occLabel(s.playHoleId):""}},hpar:{textContent:()=>{const s=this.occAtOffset(e);return s?`Par ${this.parFor(s.playHoleId)}`:""}}},t)}playerRow(e,t,s,r){return this.wireEl(ts,{name:{textContent:this.ballName(e)},topar:{textContent:()=>this.toParText(e),className:()=>this.toParClass(e)},prev:{textContent:()=>s?this.displayScore(this.svc.strokesFor(e.id,s)):""},cval:{textContent:()=>this.displayScore(this.svc.strokesFor(e.id,t))},circle:{className:()=>this.svc.strokesFor(e.id,t)===null?"se-row__circle empty":"se-row__circle",onclick:()=>this.openModalForBall(e.id)}},r)}modalRow(e,t,s){const r=e.players.length>1?`Team · CH ${e.courseHandicap}`:`CH ${e.players[0]?.courseHandicap??e.courseHandicap}`;return this.wireEl(ss,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.currentBallIdx.set(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:r},mval:{textContent:()=>{const n=this.currentHole();return n?this.displayScore(this.svc.strokesFor(e.id,n.playHoleId)):"–"}}},s)}numberKey(e){return this.wireEl(Ie,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,s,r){return this.wireEl(Ie,{key:{className:s,onclick:r},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(s=>s.id===e);this.currentBallIdx.set(t<0?0:t),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.modalOpen.set(!0)}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){const t=this.ballsInGroup(),s=this.currentHole(),r=t[this.currentBallIdx.get()];if(!s||!r)return;const n=e===null?void 0:this.metaSnapshot();this.svc.setScore(r.id,s.playHoleId,e,n),e!==null&&e>0&&this.metaInputs().length>0?this.statsOpen.set(!0):this.advance()}hasMoreUnscored=()=>{const e=this.ballsInGroup(),t=this.currentHole();if(!t)return!1;const s=this.currentBallIdx.get();return e.some((r,n)=>n!==s&&this.svc.strokesFor(r.id,t.playHoleId)===null)};metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),s={};for(const r of e)s[r.key]=t[r.key]===!0;return s}setMeta(e,t){const s=this.pendingMeta.get();this.pendingMeta.set({...s,[e]:t});const r=this.ballsInGroup()[this.currentBallIdx.get()],n=this.currentHole();if(!r||!n)return;const o=this.svc.strokesFor(r.id,n.playHoleId);o!==null&&this.svc.setScore(r.id,n.playHoleId,o,this.metaSnapshot())}metaChip(e,t){return this.wireEl(ns,{glabel:{textContent:e.label},miss:{className:()=>this.pendingMeta.get()[e.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(e.key,!1)},hit:{className:()=>this.pendingMeta.get()[e.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(e.key,!0)}},t)}advance(){const e=this.ballsInGroup(),t=this.currentHole();if(!t)return;const s=c=>this.svc.strokesFor(e[c].id,t.playHoleId)!==null,r=this.currentBallIdx.get();for(let c=r+1;c<e.length;c++)if(!s(c))return this.currentBallIdx.set(c);for(let c=0;c<r;c++)if(!s(c))return this.currentBallIdx.set(c);const n=this.playedOrder();if(this.holeIndex()>=n.length-1){this.flash("Round complete"),this.modalOpen.set(!1);return}this.flash(`Hole ${this.occLabel(t.playHoleId)} done`);const d=t.playHoleId;this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===d&&(this.holeIdx.set(K(this.holeIndex()+1,this.playedOrder().length)),this.currentBallIdx.set(0))},700)}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*A),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(K(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",r=>{r.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",r=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:r.pointerId,startX:r.clientX,startY:r.clientY,lastX:r.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(r.pointerId))}),e.addEventListener("pointermove",r=>{const n=this.ptr;if(!n||n.id!==r.pointerId)return;const o=r.clientX-n.startX,d=r.clientY-n.startY;if(!n.horiz){if(Math.abs(d)>Math.abs(o)&&Math.abs(d)>8||Math.abs(o)<=8)return;n.horiz=!0}const c=Date.now(),u=Math.max(1,c-n.lastTime);n.velocity=(r.clientX-n.lastX)/u,n.lastX=r.clientX,n.lastTime=c,this.dragOffset.set(o)});const s=r=>{const n=this.ptr;if(!n||n.id!==r.pointerId)return;const o=r.clientX-n.startX,d=n.horiz;if(this.ptr=null,e.releasePointerCapture?.(r.pointerId),!d){this.dragOffset.set(0);return}this.snap(Gt({dragDistance:o,velocity:n.velocity,itemWidth:A}))};e.addEventListener("pointerup",s),e.addEventListener("pointercancel",r=>{!this.ptr||this.ptr.id!==r.pointerId||(this.ptr=null,e.releasePointerCapture?.(r.pointerId),this.snap(0))})}}function y(i){return String(i).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function is(i,e){const t=[...i].sort((n,o)=>n.canonicalOrdinal-o.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(n=>n.playHoleId))}];const s=[...e].sort((n,o)=>n.fromCanonicalOrdinal-o.fromCanonicalOrdinal),r=[];for(const n of s){const o=t.filter(d=>d.canonicalOrdinal>=n.fromCanonicalOrdinal&&d.canonicalOrdinal<=n.toCanonicalOrdinal);o.length!==0&&r.push({label:n.label,holes:o,playHoleIds:new Set(o.map(d=>d.playHoleId))})}return r}function os(i){return i.kind==="si"?"lb-c-si":i.kind==="given"?"lb-c-given":i.kind==="status"?"lb-c-status":i.kind==="category"?"lb-c-cat":""}function as(i){const e=[i.kind==="category"?"lb-r-cat":`lb-r-${i.kind}`];return(i.kind==="si"||i.kind==="given")&&e.push("lb-r-dim"),i.team&&e.push(`lb-team-${i.team}`),e.join(" ")}function ls(i){return i&&i.marker?i.marker.template:null}function ds(i){const e=i?.marker?.tone;return e==="success"||e==="warning"||e==="danger"?` lb-mark-tone--${e}`:""}function cs(i,e){const t=i.cells.filter(s=>e.has(s.playHoleId));if(i.aggregate==="sum"){const s=t.map(r=>r.value).filter(r=>r!==null);return s.length===0?"—":String(s.reduce((r,n)=>r+n,0))}if(i.aggregate==="last"){for(let s=t.length-1;s>=0;s--){const r=t[s].value;if(r!==null)return Number.isInteger(r)?String(r):r.toFixed(1)}return"—"}return"—"}function us(i){return i.filter(e=>!(e.startsWith("slot #")||/^CH -?\d/.test(e)||/^PH -?\d/.test(e)))}function de(i,e,t,s){const r=is(i.holes,e),n=$=>{const te=`<tr><th class="lb-rowlabel">Hole</th>${$.holes.map(C=>`<th>${y(C.occurrenceLabel)}</th>`).join("")}<th class="lb-sum">${y($.label)}</th></tr>`,qe=i.rows.map(C=>{const Ae=new Map(C.cells.map(B=>[B.playHoleId,B])),he=B=>C.emphasis?`<strong>${B}</strong>`:B,De=$.holes.map(B=>{const L=Ae.get(B.playHoleId),Ue=L?.title?` title="${y(L.title)}"`:"",se=he(y(L?.display??"")),pe=ls(L),We=ds(L),ne=L?.marker?.label,Xe=ne?` title="${y(ne)}" aria-label="${y(ne)}"`:"";let me=pe?`<span class="lb-mark lb-mark--${pe}${We}"${Xe}>${se}</span>`:se;return L?.team&&(me=`<span class="lb-pill lb-pill--${L.team}">${se}</span>`),`<td class="${os(C)}"${Ue}>${me}</td>`}).join(""),Ge=`<td class="lb-sum">${he(cs(C,$.playHoleIds))}</td>`,Ke=C.subjectBallId?y(t(C.subjectBallId))+(C.label?" "+y(C.label):""):y(C.label);return`<tr class="${as(C)}"><th class="lb-rowlabel">${Ke}</th>${De}${Ge}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${te}</thead><tbody>${qe}</tbody></table></div>`},o=r.map($=>n($)).join(""),d=i.title.groups.map($=>$.map(te=>y(t(te))).join(" & ")).filter(Boolean).join(i.title.joiner),c=s.mode==="verification"?i.subtitleFacts:us(i.subtitleFacts),u=c.length?`<div class="lb-card__sub">${c.map(y).join(" · ")}</div>`:"",f=s.mode==="verification"&&i.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${i.footnotes.map($=>`<span class="lb-card__note">${y($)}</span>`).join("")}</div>`:"",m=s.mode==="verification"&&i.caption?`<p class="lb-card__caption">${y(i.caption)}</p>`:"",g=i.totals.length?`<ul class="lb-card__totals">${i.totals.map($=>`<li>${y($.label)} = <strong>${$.value??"—"}</strong></li>`).join("")}</ul>`:"",v=d?`<header class="lb-card__head"><h4>${d}</h4>${u}</header>`:u;return`<article class="${s.cardModifier?`lb-card ${s.cardModifier}`:"lb-card"}">
  ${v}
  ${o}
  ${f}${m}${g}
</article>`}function hs(i,e,t,s){return de(i,e,t,s)}function ps(i,e,t,s){return de(i,e,t,{...s,cardModifier:"lb-card--compact-match"})}function ms(i,e,t,s){return de(i,e,t,{...s,cardModifier:"lb-card--category-matrix"})}function fs(i,e){const t=i.entries.map(s=>`<tr class="${s.position===1?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${s.position}</td>
  <td class="lb-rank__who">${y(s.ballIds.map(e).join(" & "))}</td>
  <td class="lb-rank__total">${s.total??"—"}</td>
  <td class="lb-rank__thru">${s.holesPlayed}</td>
</tr>`).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${y(i.metricLabel)}</h4>
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
</div>`}function gs(i,e){const t=i.matches.map(s=>{const r=y(s.sideA.ballIds.map(e).join(" & ")),n=y(s.sideB.ballIds.map(e).join(" & ")),o=s.magnitude===0?"AS":`${s.magnitude} UP`,d=s.finished?"Final":`thru ${s.thru}`,c=s.leader==="a"?" lb-mp__team--lead":"",u=s.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${c}">${r}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${y(o)}</span><span class="lb-mp__status">${y(d)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${u}">${n}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${y(i.title)}</h4>${t}
</div>`}const bs={ranked:fs,match_summary:gs},ys={"default-score-grid":hs,"compact-match-grid":ps,"category-matrix-grid":ms};function _s(i){return i.componentId??"default-score-grid"}function vs(i){return`<div class="lb-diag">Unrenderable result section <code>${y(i)}</code> — no generic view yet. Results are not hidden.</div>`}function xs(i){return`<div class="lb-diag">Unsupported score-grid component <code>${y(i)}</code> — no generic view yet. Results are not hidden.</div>`}function ws(i,e){const t=bs[i.kind];return t?t(i,e):vs(i.kind)}function $s(i,e,t,s){const r=_s(i),n=ys[r];return n?n(i,e,t,s):xs(r)}function ks(i,e){return i.leaderboard.length===0&&i.cards.length===0?`<div class="lb-empty">No scores entered yet for ${y(i.formatLabel)}.</div>`:i.leaderboard.map(s=>ws(s,e)).join("")||`<div class="lb-empty">No leaderboard metric for ${y(i.formatLabel)}.</div>`}function Ss(i,e,t,s={}){if(i.cards.length===0)return"";const r=s.mode??"product";return i.cards.map(n=>$s(n,e,t,{mode:r})).join(`
`)}const Is=b(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class Es extends P{static styles=`
        .lb {
            padding: ${a("lg")} ${a("lg")} ${a("2xl")};

            & .lb__status {
                color: ${l("text-muted")};
                padding: ${a("xl")} 0;
                text-align: center;
                &.hidden { display: none; }
            }

            & .lb-empty {
                color: ${l("text-muted")};
                padding: ${a("xl")} 0;
                text-align: center;
            }
            & .lb-diag {
                ${N()}
                padding: ${a("md")} ${a("lg")};
                color: ${l("error")};
                font-size: 0.85rem;
                margin-bottom: ${a("md")};
                & code { font-family: ui-monospace, monospace; }
            }

            /* Ranked metric + match-summary sections. */
            & .lb-section { margin-bottom: ${a("xl")}; }
            & .lb-section__title {
                margin: 0 0 ${a("sm")};
                font-family: ${l("font-display")};
                font-weight: 600;
                font-size: 1rem;
                color: ${l("text")};
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
                color: ${l("text-muted")};
                font-weight: 700;
                line-height: 1;
                padding: 0 ${a("sm")};
                border-bottom: 1px solid ${l("border")};
            }
            & .lb-rank tbody td {
                height: 2.25rem;
                padding: 0 ${a("sm")};
                border-bottom: 1px solid ${l("border")};
                font-size: 0.95rem;
                line-height: 1.1;
            }
            & .lb-rank__pos { text-align: center; font-weight: 700; color: ${l("text-muted")}; }
            & .lb-rank__who {
                text-align: left;
                font-weight: 600;
                font-family: ${l("font-display")};
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            & .lb-rank__total { text-align: right; font-weight: 700; }
            & .lb-rank__thru { text-align: right; color: ${l("text-muted")}; }
            & .lb-rank__lead td { background: ${l("accent-soft")}; }
            & .lb-rank__lead .lb-rank__pos { color: ${l("accent")}; }

            /* Structured match panel: two team blocks + a centre standing. */
            & .lb-mp {
                display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch;
                border: 1px solid ${l("border")}; border-radius: 10px; overflow: hidden;
                margin-top: ${a("sm")};
            }
            & .lb-mp__team {
                padding: ${a("sm")} ${a("md")}; font-weight: 700; font-size: 0.9rem;
                display: flex; align-items: center;
            }
            & .lb-mp__team--a { color: #c2452f; }
            & .lb-mp__team--b { color: #2c6cae; justify-content: flex-end; text-align: right; }
            & .lb-mp__team--a.lb-mp__team--lead { background: #c2452f; color: #fff; }
            & .lb-mp__team--b.lb-mp__team--lead { background: #2c6cae; color: #fff; }
            & .lb-mp__center {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                padding: ${a("xs")} ${a("md")}; gap: 1px;
            }
            & .lb-mp__standing { font-size: 1.25rem; font-weight: 800; line-height: 1; }
            & .lb-mp__status { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.04em; color: ${l("text-muted")}; }

            /* Format-aware scorecard cards. */
            & .lb-cards__head {
                margin: ${a("xl")} 0 ${a("md")};
                font-family: ${l("font-display")};
                font-weight: 600;
                font-size: 1.1rem;
                color: ${l("text")};
            }
            & .lb-card {
                ${N()}
                padding: ${a("md")};
                margin-bottom: ${a("lg")};
            }
            & .lb-card--compact-match {
                border-color: color-mix(in srgb, ${l("accent")} 28%, ${l("border")});
                padding-top: ${a("sm")};
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
            & .lb-card__head { margin-bottom: ${a("sm")}; }
            & .lb-card__head h4 {
                margin: 0;
                font-family: ${l("font-display")};
                font-weight: 600;
                font-size: 1rem;
                color: ${l("text")};
            }
            & .lb-card__sub { font-size: 0.75rem; color: ${l("text-muted")}; margin-top: 2px; }
            & .lb-card__scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            /* Stacked 9-hole blocks (front 9 / back 9) get a little breathing room. */
            & .lb-card__scroll + .lb-card__scroll { margin-top: ${a("sm")}; }
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
                border-bottom: 1px solid ${l("border")};
                overflow: hidden;
                text-overflow: ellipsis;
            }
            & .lb-grid thead th {
                font-size: 0.7rem;
                color: ${l("text-muted")};
                font-weight: 700;
            }
            & .lb-grid .lb-rowlabel {
                text-align: left;
                width: 6em;
                position: sticky;
                left: 0;
                background: ${l("surface")};
                font-weight: 600;
                color: ${l("text")};
            }
            & .lb-grid .lb-sum { width: 2.4em; font-weight: 700; background: ${l("surface-sunken")}; }
            & .lb-grid .lb-r-dim td, & .lb-grid .lb-r-dim th { color: ${l("text-muted")}; }
            & .lb-grid .lb-c-si { color: ${l("text-muted")}; font-size: 0.7rem; }
            & .lb-grid .lb-r-cat th { font-weight: 400; color: ${l("text-muted")}; }
            & .lb-grid .lb-c-cat { text-align: center; color: ${l("accent")}; }
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
            & .lb-card__caption { margin: ${a("sm")} 0 0; font-size: 0.72rem; font-style: italic; color: ${l("text-muted")}; }
            & .lb-card__notes { margin: ${a("sm")} 0 0; font-size: 0.72rem; color: ${l("text-muted")}; }
            & .lb-card__notes-label {
                display: block; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.04em; font-size: 0.68rem; margin-bottom: 2px;
            }
            & .lb-card__note { display: block; }
            & .lb-card__totals {
                list-style: none; margin: ${a("sm")} 0 0; padding: 0;
                display: flex; flex-wrap: wrap; gap: ${a("md")};
                font-size: 0.85rem; color: ${l("text")};
            }
        }
    `;svc=this.inject(ee);slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots(),t=this.svc.selectedSlotDefId();return e.find(s=>s.slotDefId===t)??e[0]??null};render(){return this.wire(Is,{status:{className:()=>{const t=this.svc.resultLoading.get(),s=this.svc.result.get()===null;return t||s?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody()}})}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const s=d=>this.svc.nameOf(d),r=ks(t,s),n=Ss(t,e.routeSections,s),o=n?`<h3 class="lb-cards__head">Scorecard</h3>${n}`:"";return r+o}}function Ts(i,e){if(!e)return[];const t=[],s=new Set;for(const r of i)for(const n of r.players){if(n.playerId===e)return[];n.guestPlayerId===null||s.has(n.guestPlayerId)||(s.add(n.guestPlayerId),t.push({guestPlayerId:n.guestPlayerId,displayName:n.displayName}))}return t}const Ps=b(`
    <div bind="root" class="claim-card hidden">
        <span class="claim-card__label">Played here as a guest?</span>
        <p class="claim-card__hint">Claim your scores — the round lands on your profile's card.</p>
        <div bind="rows" class="claim-card__rows"></div>
        <p bind="err" class="claim-card__err"></p>
    </div>
`),Cs=b(`
    <div class="claim-card__row">
        <span bind="name" class="claim-card__name"></span>
        <button bind="claim" class="claim-card__btn" type="button">This is me</button>
    </div>
`);class Ns extends P{static styles=`
        .claim-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${N()}
            background: ${l("surface-sunken")};

            &.hidden { display: none; }

            & .claim-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${l("text-muted")};
            }
            & .claim-card__hint {
                margin: ${a("sm")} 0 0;
                font-size: 0.8rem;
                color: ${l("text-muted")};
            }
            & .claim-card__rows {
                display: flex;
                flex-direction: column;
                gap: ${a("sm")};
                margin-top: ${a("md")};
            }
            & .claim-card__row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${a("md")};
            }
            & .claim-card__name { font-weight: 600; font-size: 0.95rem; }
            & .claim-card__btn {
                ${w()}
                padding: ${a("sm")} ${a("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${l("primary")};
                color: ${l("primary-text")};
                border: none;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .claim-card__err {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${l("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(ee);auth=this.inject(F);router=this.inject(z);tokenQ=this.router.query("token");claiming=new h(!1);error=new h("");claimable(){return Ts(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async claim(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.claiming.set(!0);try{await _.friendlyRounds.claimGuest({token:t,guestPlayerId:e}),await this.svc.loadByToken(t)}catch(s){this.error.set(s instanceof O&&s.status===409?"Already claimed — or you already play in this round under your account.":s instanceof O&&s.status===404?"That guest is no longer claimable on this round.":"Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}render(){const e=this.wire(Ps,{root:{className:()=>this.claimable().length>0?"claim-card":"claim-card hidden"},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.claimable(),(t,s,r)=>this.wireEl(Cs,{name:()=>t.displayName,claim:{disabled:()=>this.claiming.get(),onclick:()=>{this.claim(t.guestPlayerId)}}},r),t=>t.guestPlayerId),e}}function zs(i){if(!(i===null||i===""))return/^\d+$/.test(i)?Number(i):i}const Os=b(`
    <div class="round-view">
        <div bind="main" class="round-view__main">
            <button bind="back" class="round-view__back" type="button">← Home</button>
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

                    <div bind="claim"></div>
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
`),js=b('<button bind="pill" class="round-view__fmt" type="button"></button>');class Hs extends P{static styles=`
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
                color: ${l("text-muted")};
                cursor: pointer;
                padding: ${a("xs")} 0;
                margin-bottom: ${a("md")};
            }

            & .round-view__notfound {
                color: ${l("text-muted")};
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
                    font-family: ${l("font-display")};
                    font-weight: 600;
                    font-size: 1.8rem;
                    letter-spacing: -0.02em;
                    color: ${l("text")};
                }
            }

            & .round-view__status {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                border-radius: ${l("radius-pill")};
                padding: 2px 10px;
                flex-shrink: 0;
                background: ${l("accent-soft")};
                color: ${l("accent")};
            }

            & .round-view__meta {
                display: flex;
                gap: ${a("md")};
                margin-top: ${a("xs")};
                color: ${l("text-muted")};
                font-size: 0.9rem;
            }

            & .round-view__formats {
                margin-top: ${a("lg")};
                display: flex;
                gap: ${a("sm")};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: ${a("xs")};
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }

                & .round-view__fmt {
                    flex: 0 0 auto;
                    border: 1px solid ${l("border")};
                    border-radius: ${l("radius-pill")};
                    background: ${l("btn-bg")};
                    color: ${l("text")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    padding: ${a("sm")} ${a("lg")};
                    cursor: pointer;
                    white-space: nowrap;
                    &.active { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                }
            }

            & .round-view__share {
                margin-top: ${a("2xl")};
                padding: ${a("lg")};
                ${N()}
                background: ${l("surface-sunken")};

                & .round-view__share-label {
                    font-weight: 700;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: ${l("text-muted")};
                }
                & .round-view__share-row {
                    display: flex;
                    gap: ${a("sm")};
                    margin-top: ${a("sm")};
                }
                & .round-view__share-url {
                    flex: 1;
                    ${j()}
                    font-size: 0.8rem;
                    color: ${l("text-muted")};
                }
                & .round-view__copy {
                    ${w()}
                    padding: 0 ${a("lg")};
                    font-weight: 700;
                    background: ${l("primary")};
                    color: ${l("primary-text")};
                    border: none;
                }
                & .round-view__share-hint {
                    margin: ${a("sm")} 0 0;
                    font-size: 0.8rem;
                    color: ${l("text-muted")};
                }
            }
        }

        /* --- Pinned bottom dock: orange hole bar + Score/Leaderboard tabs --- */
        .round-view__dock {
            flex: 0 0 auto;
            box-shadow: ${l("shadow-elevated")};
            &.hidden { display: none; }
        }

        .round-hole {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${a("md")};
            background: ${l("hole-bar")};
            color: ${l("hole-bar-text")};
            padding: ${a("sm")} ${a("lg")};

            &.hidden { display: none; }

            & .round-hole__nav {
                flex: 0 0 auto;
                width: 40px;
                height: 40px;
                border: none;
                border-radius: ${l("radius-pill")};
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
                font-family: ${l("font-display")};
                font-weight: 700;
                font-size: 1.4rem;
                font-variant-numeric: tabular-nums;
            }
        }

        .round-tabs {
            display: flex;
            background: ${l("topbar-bg")};
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
                &.active { color: ${l("accent")}; }
            }
        }
    `;svc=this.inject(ee);router=this.inject(z);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new h(this.initPos.tab);hasRound=new T(()=>this.svc.round.get()!==null);hasScoring=new T(()=>this.svc.balls.get().length>0);shareUrl=new T(()=>{const e=this.tokenQ.get();return e?`${location.origin}/round?token=${e}`:""});render(){this.track(x(()=>{const r=this.tokenQ.get();r&&this.svc.loadByToken(r,this.initPos).then(()=>{this.tab.get()==="leaderboard"&&this.svc.loadResult()})}));const e=()=>{this.svc.flushPending()};window.addEventListener("online",e),this.track(()=>window.removeEventListener("online",e)),this.track(x(()=>{const r=this.tab.get(),n=this.svc.selectedSlotDefId(),o=this.svc.holeIdx.get();if(this.router.route.get()!=="/round"||!this.hasRound.get())return;const d={token:this.tokenQ.get()};r==="leaderboard"&&(d.tab="board");const c=this.svc.round.get()?.formatSlots[0]?.slotDefId??null;n&&n!==c&&(d.slot=n),o>0&&(d.hole=o+1),this.router.navigate(this.router.route.get(),{replace:!0,query:d})}));const t={not_started:"Not started",active:"Live",complete:"Done"},s=this.wire(Os,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},course:()=>this.svc.round.get()?.courseNameSnapshot??"Round",status:()=>{const r=this.svc.round.get()?.status??"not_started";return t[r]??r},date:()=>this.svc.round.get()?.date??"",route:()=>{const r=this.svc.round.get();return r?`${r.playHoles.length} holes`:""},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},dock:{className:()=>this.hasRound.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const r=this.svc.currentPlayedHole();return r?this.svc.occLabel(r.playHoleId):""},holeSi:()=>{const r=this.svc.currentPlayHole()?.baseStrokeIndex;return r!=null?String(r):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});return this.$each(this.ref(s,"formats"),new T(()=>this.svc.round.get()?.formatSlots??[]),(r,n,o)=>this.slotPill(r,n,o),r=>r.slotDefId),this.spawn(rs,this.ref(s,"scoring")),this.spawn(Es,this.ref(s,"leaderboard")),this.spawn(Ns,this.ref(s,"claim")),s}readUrlPosition(){const e=new URLSearchParams(location.search),t=e.get("slot"),s=Number(e.get("hole"));return{tab:e.get("tab")==="board"?"leaderboard":"score",selectedSlot:zs(t),holeIdx:Number.isFinite(s)&&s>0?s-1:0}}slotPill(e,t,s){return this.wireEl(js,{pill:{textContent:()=>oe(e),className:()=>this.tab.get()==="leaderboard"&&this.svc.selectedSlotDefId()===e.slotDefId?"round-view__fmt active":"round-view__fmt",onclick:()=>{this.svc.selectSlot(e.slotDefId),this.tab.get()!=="leaderboard"&&(this.tab.set("leaderboard"),this.svc.loadResult())}}},s)}}function D(i){return typeof i=="object"&&i!==null&&typeof i.get=="function"}const k=i=>`var(--${i})`,ue=class ue extends P{constructor(){super(...arguments),this.open=new h(!1),this.highlightIndex=new h(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const s=document.createElement("span");s.className="ui-select__trigger-label",this.triggerEl.appendChild(s);const r=document.createElement("span");r.className="ui-select__chevron",r.textContent="▾",r.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(r),this.triggerEl.addEventListener("click",o=>{o.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",o=>{this.handleTriggerKeydown(o)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.setAttribute("role","listbox"),this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",o=>{this.handleDropdownKeydown(o)}),e.appendChild(this.dropdownEl);const n=o=>{this.optionEls=[],this.dropdownEl.textContent="";for(let d=0;d<o.length;d++){const c=o[d],u=document.createElement("button");if(u.className="ui-select__option",u.setAttribute("type","button"),u.id=`ui-select-opt-${d}`,c.disabled){u.classList.add("ui-select__option--header"),u.disabled=!0,u.setAttribute("role","presentation"),u.setAttribute("aria-disabled","true");const g=document.createElement("span");g.className="ui-select__option-label",g.textContent=c.label,u.appendChild(g),this.dropdownEl.appendChild(u),this.optionEls.push(u);continue}if(u.setAttribute("role","option"),c.icon){const g=document.createElement("span");g.className="ui-select__option-icon",g.textContent=c.icon,u.appendChild(g)}const f=document.createElement("span");f.className="ui-select__option-label",f.textContent=c.label,u.appendChild(f);const m=document.createElement("span");m.className="ui-select__check",m.setAttribute("aria-hidden","true"),u.appendChild(m),u.addEventListener("click",g=>{g.stopPropagation(),this.selectOption(c.value)}),u.addEventListener("mouseenter",()=>{this.highlightIndex.set(d)}),this.dropdownEl.appendChild(u),this.optionEls.push(u)}};return D(this.props.options)?this.track(x(()=>{const o=D(this.props.options)?this.props.options.get():this.props.options;n(o)})):n(this.props.options),this.track(x(()=>{const o=this.props.value.get(),d=D(this.props.options)?this.props.options.get():this.props.options,c=d.find(u=>u.value===o);c?(s.textContent=c.icon?`${c.icon} ${c.label}`:c.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder")):(s.textContent=this.props.placeholder??"",this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!this.props.placeholder));for(let u=0;u<d.length;u++){const f=this.optionEls[u];if(!f)continue;const m=d[u].value===o;f.setAttribute("aria-selected",String(m)),f.classList.toggle("ui-select__option--selected",m);const g=f.querySelector(".ui-select__check");g&&(g.textContent=m?"✓":"")}})),this.track(x(()=>{const o=this.open.get();if(this.dropdownEl.classList.toggle("open",o),r.classList.toggle("ui-select__chevron--open",o),this.triggerEl.setAttribute("aria-expanded",String(o)),o?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),o){const d=D(this.props.options)?this.props.options.get():this.props.options,c=this.props.value.get(),u=d.findIndex(m=>m.value===c),f=d.findIndex(m=>!m.disabled);this.highlightIndex.set(u>=0?u:f)}})),this.track(x(()=>{const o=this.highlightIndex.get();for(let d=0;d<this.optionEls.length;d++)this.optionEls[d].classList.toggle("ui-select__option--highlighted",d===o);o>=0&&this.optionEls[o]&&(this.triggerEl.setAttribute("aria-activedescendant",`ui-select-opt-${o}`),this.optionEls[o].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(D(this.props.disabled)?this.track(x(()=>{const o=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",o),this.triggerEl.disabled=o})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}selectOption(e){X(()=>{this.props.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.toggle();break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":{e.preventDefault();const t=this.highlightIndex.get(),s=D(this.props.options)?this.props.options.get():this.props.options;t>=0&&t<s.length&&!s[t].disabled&&this.selectOption(s[t].value);break}case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=D(this.props.options)?this.props.options.get():this.props.options;if(t.length===0||!t.some(r=>!r.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};ue.styles=`
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
            border: 1px solid ${k("border")};
            border-radius: ${k("radius")};
            background: ${k("input-bg")};
            color: ${k("text")};
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
        }
        .ui-select__trigger:focus-visible {
            outline: 2px solid ${k("primary")};
            outline-offset: 1px;
        }
        .ui-select__trigger--placeholder {
            color: ${k("text-muted")};
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
            color: ${k("text-muted")};
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
            background: ${k("surface")};
            border: 1px solid ${k("border")};
            border-radius: ${k("radius")};
            box-shadow: ${k("shadow-elevated")};
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
            color: ${k("text")};
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
            background: ${k("hover-bg")};
        }
        .ui-select__option--selected {
            color: ${k("primary")};
            font-weight: 600;
        }
        .ui-select__option--header {
            cursor: default;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${k("text-muted")};
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
            color: ${k("primary")};
        }
    `;let le=ue;function Le(i){return i.handicapIndex*(i.slope/113)+(i.courseRating-i.par)}function Ms(i){return Math.round(Le(i))}const Ls=["scramble","greensomes","foursomes","custom"],V=2,re=10,Rs="ABCDEFGH",Fs={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class Bs{loading=new h(!1);error=new h(null);courses=new h([]);tees=new h([]);courseId=new h("");preset=new h("full_18");startHole=new h(1);players=new h([]);teams=new h([]);formatSlots=new h([]);submitting=new h(!1);diagnostics=new h([]);submitError=new h(null);catalog=H.get(Z);nextKey=1;nextSlotKey=1;nextTeamKey=1;reset(){this.courses.set([]),this.tees.set([]),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.formatSlots.set([]),this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1}async load(){this.catalog.load().then(()=>this.ensureDefaultSlot());const e=await S(this.loading,this.error,()=>_.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const s=await S(this.loading,this.error,()=>_.setup.teesByCourse({courseId:e}))??[];this.tees.set(s);const r=new Set(s.map(o=>o.id)),n=s[0]?.id??"";this.players.set(this.players.get().map(o=>({...o,teeId:r.has(o.teeId)?o.teeId:n}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}])}addMe(e){this.addFriend(e)}addFriend(e){if(this.hasPlayer(e.id))return;const t=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:e.displayName,handicapIndex:e.handicapIndex===null?"":String(e.handicapIndex),gender:e.gender??"M",genderKnown:e.gender!=null,teeId:t,playerId:e.id}])}hasPlayer(e){return this.players.get().some(t=>t.playerId===e)}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e))}patchPlayer(e,t){this.players.set(this.players.get().map(s=>s.key===e?{...s,...t}:s))}ensureDefaultSlot(){if(this.formatSlots.get().length>0)return;const e=this.catalog.byId("stableford_individual")??this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",s={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{}};this.formatSlots.set([...this.formatSlots.get(),s])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(s=>s.key===e?{...s,...t}:s))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return Rs[e]??`T${e+1}`}formations=Ls;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{}}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,kind:t,memberTeams:t==="single_ball"?{}:s.memberTeams}:s)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,s){const r=this.teamByKey(e);if(!r||r.kind!=="multi_ball"||t===e)return;const n={...r.memberTeams};if(s){if(this.teamMemberCount(e)>=re)return;n[t]=!0}else delete n[t];this.teams.set(this.teams.get().map(o=>o.key===e?{...o,memberTeams:n}:o))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(s=>t.memberTeams[Number(s)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{const t=this.isSideFormat(e.formatId);let s=!1;const r={...e.subjectTeams};for(const n of this.teams.get())r[n.key]===!0&&n.kind==="multi_ball"!==t&&(delete r[n.key],s=!0);return s?{...e,subjectTeams:r}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const s={...t.memberTeams};return delete s[e],{...t,memberTeams:s}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const s={...t.subjectTeams};return delete s[e],{...t,subjectTeams:s}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.teams.get().findIndex(s=>s.key===e.key);return`Team ${this.teamLetter(Math.max(0,t))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,formation:t}:s))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,s){const r=this.teamByKey(e);if(!r)return;const n={...r.pctByPlayer};if(s){if(n[t]!==void 0||this.teamMemberCount(e)>=re)return;n[t]=n[t]??"100"}else delete n[t];this.teams.set(this.teams.get().map(o=>o.key===e?{...o,pctByPlayer:n}:o))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=re}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let s=0;for(const r of this.players.get()){const n=t.pctByPlayer[r.key];if(n===void 0)continue;const o=this.derivedCH(r);if(!o)return null;s+=this.parsePct(n)*o.ch/100}return Math.round(s)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<V)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=V;let s=t;for(const r of this.teams.get())e.memberTeams[r.key]===!0&&r.kind==="single_ball"&&Object.keys(r.pctByPlayer).length>=V&&s++;return s>=V}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,s){const r=this.teamByKey(e);!r||r.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(n=>n.key===e?{...n,pctByPlayer:{...n.pctByPlayer,[t]:s}}:n))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,s){const r=this.slotByKey(e);r&&this.patchFormatSlot(e,{subjectPlayers:{...r.subjectPlayers,[t]:s}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,s){const r=this.slotByKey(e);r&&this.patchFormatSlot(e,{subjectTeams:{...r.subjectTeams,[t]:s}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return Fs[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,s)=>t-s);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1)}derivedCH(e){const t=Number.parseFloat(e.handicapIndex);if(!Number.isFinite(t))return null;const s=this.teeById(e.teeId);if(!s)return null;const r=s.ratings.find(o=>o.gender===e.gender);if(!r)return null;const n={handicapIndex:t,slope:r.slope,courseRating:r.courseRating,par:r.par};return{ch:Ms(n),raw:Le(n),rating:r,teeName:s.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const s of this.formatSlots.get()){for(const r of e)s.subjectPlayers[r.key]!==!1&&t.add(r.key);for(const r of this.teams.get())if(s.subjectTeams[r.key]===!0)for(const n of e)r.pctByPlayer[n.key]!==void 0&&t.add(n.key)}return e.filter(s=>!t.has(s.key))}diagnosticsForFormat(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`formats[${e}]`))}generalDiagnostics(){return this.diagnostics.get().filter(e=>!e.path?.startsWith("producers[")&&!e.path?.startsWith("formats["))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const s=this.liveTeamKeySet(),r=[];for(const n of this.teams.get()){if(!s.has(n.key))continue;const o=e.filter(d=>n.pctByPlayer[d.key]!==void 0).map(d=>({producerDefId:t.get(d.key),allowancePct:this.parsePct(n.pctByPlayer[d.key])}));if(n.kind==="multi_ball")for(const d of this.teams.get())n.memberTeams[d.key]===!0&&d.key!==n.key&&d.kind==="single_ball"&&s.has(d.key)&&o.push({teamId:String(d.key)});r.push({id:String(n.key),label:this.teamLabel(n),formation:n.formation,kind:n.kind,members:o})}return r}buildFormats(e,t){const s=this.liveTeamKeySet();return this.formatSlots.get().map(r=>{const n=this.isSideFormat(r.formatId),o=[];if(!n)for(const d of e)r.subjectPlayers[d.key]!==!1&&o.push({kind:"player",producerDefId:t.get(d.key)});for(const d of this.teams.get())r.subjectTeams[d.key]===!0&&s.has(d.key)&&d.kind==="multi_ball"===n&&o.push({kind:"team",teamId:String(d.key)});return{formatId:r.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(r.allowancePct)},subjects:o}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),s=e.indexOf(t);return s<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(s),...e.slice(0,s)].map(n=>({courseHoleNumber:n})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];if(e.forEach((s,r)=>{s.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${r}].name`}),Number.isFinite(Number.parseFloat(s.handicapIndex))||t.push({code:"missing_index",message:"Handicap index required",path:`producers[${r}].handicapIndex`}),s.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${r}].teeId`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};this.submitting.set(!0);try{const s=[];for(let f=0;f<e.length;f++){const m=e[f],g=Number.parseFloat(m.handicapIndex),v=m.playerId?{kind:"player",id:m.playerId}:{kind:"guest",id:(await _.guestPlayers.create({displayName:m.name.trim(),gender:m.gender,handicapIndex:g})).id};s.push({producerDefId:`p${f+1}`,playerRef:v,handicapIndex:g,gender:m.gender,teeId:m.teeId})}const{roundType:r,route:n}=this.buildRoute(),o=new Map;e.forEach((f,m)=>o.set(f.key,`p${m+1}`));const d=this.buildTeams(e,o),c={courseId:this.courseId.get(),playedAt:new Date().toISOString().slice(0,10),roundType:r,...n?{route:n}:{},producers:s,...d.length>0?{teams:d}:{},formats:this.buildFormats(e,o)},u=await _.friendlyRounds.create({draft:c});return u.ok?{ok:!0,token:u.friendlyRound.shareToken}:(this.diagnostics.set(u.diagnostics),{ok:!1})}catch(s){return this.submitError.set(s instanceof O?s.message:"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}class Re{loading=new h(!1);error=new h(null);player=new h(null);history=new h([]);saving=new h(!1);saveError=new h(null);async load(){const e=await S(this.loading,this.error,()=>Promise.all([_.players.me(),_.players.myHandicapHistory()]));if(!e)return;const[t,s]=e;this.player.set(t),this.history.set(s)}clear(){this.player.set(null),this.history.set([]),this.error.set(null),this.saveError.set(null)}async saveIndex(e){return await S(this.saving,this.saveError,()=>_.players.updateHandicap({handicapIndex:e}))?(await this.load(),!0):!1}async saveGender(e){const t=await S(this.saving,this.saveError,()=>_.players.updateProfile({gender:e}));return t?(this.player.set(t),!0):!1}}const Fe=2;function Ee(i){return i.trim().length>=Fe}function Be(i){return[...i].sort((e,t)=>e.displayName.localeCompare(t.displayName,"sv",{sensitivity:"base"}))}function qs(i,e){return Be([...i.filter(t=>t.id!==e.id),e])}function As(i,e){return i.filter(t=>t.id!==e)}function Te(i,e,t){return i.map(s=>s.id===e?{...s,isFriend:t}:s)}function Ds(i,e,t=()=>{},s=300){let r=0,n;return o=>{const d=o.trim(),c=++r;if(n!==void 0&&clearTimeout(n),n=void 0,d.length<Fe){e(d,[]);return}n=setTimeout(()=>{i(d).then(u=>{c===r&&e(d,u)},u=>{c===r&&t(d,u)})},s)}}class ce{loading=new h(!1);error=new h(null);friends=new h([]);loaded=new h(!1);query=new h("");searching=new h(!1);searchError=new h(null);results=new h([]);resultsFor=new h("");mutating=new h(!1);mutateError=new h(null);runSearch=Ds(e=>_.players.search({q:e}),(e,t)=>{this.searching.set(!1),this.results.set(t),this.resultsFor.set(e)},(e,t)=>{this.searching.set(!1),this.results.set([]),this.resultsFor.set(e),this.searchError.set({code:"network",message:t instanceof Error?t.message:"Search failed. Try again."})});async load(){const e=await S(this.loading,this.error,()=>_.friends.list());e&&(this.friends.set(Be(e)),this.loaded.set(!0))}setQuery(e){this.query.set(e),this.searchError.set(null),this.searching.set(e.trim().length>=2),this.runSearch(e)}async add(e){await S(this.mutating,this.mutateError,()=>_.friends.add({friendId:e.id}))&&(this.friends.set(qs(this.friends.get(),{id:e.id,username:e.username,displayName:e.displayName,gender:e.gender,handicapIndex:e.handicapIndex})),this.results.set(Te(this.results.get(),e.id,!0)))}async remove(e){await S(this.mutating,this.mutateError,()=>_.friends.remove({friendId:e}))&&(this.friends.set(As(this.friends.get(),e)),this.results.set(Te(this.results.get(),e,!1)))}clear(){this.friends.set([]),this.loaded.set(!1),this.query.set(""),this.results.set([]),this.resultsFor.set(""),this.error.set(null),this.searchError.set(null),this.mutateError.set(null),this.searching.set(!1)}}const Gs=["full_18","front_9","back_9"],Ks=b(`
    <div class="setup">
        <button bind="back" class="setup__back" type="button">← Home</button>
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
            <button bind="addMe" class="setup__add setup__addme hidden" type="button"></button>
            <button bind="addFriends" class="setup__add setup__addme hidden" type="button">+ From friends</button>
            <div bind="friendPicker" class="setup__friends hidden">
                <div bind="friendRows" class="setup__friendrows"></div>
                <p class="setup__hint">Everyone on your friends list is already in the round.</p>
            </div>
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
`),Us=b(`
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
`),Ws=b(`
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
`),Xs=b(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),Qs=b(`
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
`),Vs=b(`
    <button bind="row" type="button" class="frow">
        <span bind="name" class="frow__name"></span>
        <span bind="username" class="frow__username"></span>
        <span bind="hcp" class="frow__hcp"></span>
    </button>
`),Pe=b(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class Ys extends P{static styles=`
        .setup {
            padding: ${a("lg")} ${a("lg")} ${a("2xl")};

            & .setup__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${l("text-muted")};
                cursor: pointer; padding: ${a("xs")} 0; margin-bottom: ${a("md")};
            }

            & .setup__head {
                margin-bottom: ${a("xl")};
                & h1 {
                    margin: 0; font-family: ${l("font-display")}; font-weight: 600;
                    font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem; }
            }

            & .setup__section {
                margin-bottom: ${a("xl")};
                & h2 {
                    margin: 0 0 ${a("sm")}; font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .setup__hint { margin: 0 0 ${a("md")}; color: ${l("text-muted")}; font-size: 0.82rem; }

            & .setup__note {
                margin: ${a("sm")} 0 0; font-size: 0.82rem; color: ${l("text-muted")};
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
                    flex: 1; padding: ${a("md")} 0; ${w()}
                    font-family: inherit; font-weight: 700; font-size: 0.9rem;
                    &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                }
            }

            & .setup__startrow {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${a("md")}; font-size: 0.9rem; color: ${l("text-muted")};
            }

            & .setup__players { display: flex; flex-direction: column; gap: ${a("md")}; }

            & .player {
                padding: ${a("md")}; ${N()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .player__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .player__name { flex: 1; padding: ${a("md")}; font-size: 1rem; ${j()} }
                & .player__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${w()}
                    font-size: 1rem; color: ${l("text-muted")};
                }
                & .player__fields { display: flex; gap: ${a("sm")}; align-items: stretch; }
                & .player__index { flex: 1; min-width: 0; padding: ${a("md")}; font-size: 1rem; ${j()} }
                & .player__gender { width: 72px; flex-shrink: 0; font-size: 1rem; }
                & .player__tee { flex: 1; min-width: 0; font-size: 1rem; }

                & .player__ch {
                    font-size: 0.82rem; color: ${l("text-muted")}; font-variant-numeric: tabular-nums;
                    &:empty { display: none; }
                }
                & .player__err {
                    font-size: 0.82rem; color: ${l("error")};
                    &:empty { display: none; }
                }
            }

            & .setup__add {
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")}; ${w()}
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }
            & .setup__addme.hidden { display: none; }

            & .setup__friends {
                margin-top: ${a("sm")}; padding: ${a("sm")}; ${N()}
                &.hidden { display: none; }

                & .setup__friendrows { display: flex; flex-direction: column; }
                & .setup__hint { margin: ${a("xs")} ${a("sm")}; }
                & .setup__friendrows:not(:empty) + .setup__hint { display: none; }

                & .frow {
                    display: flex; align-items: baseline; gap: ${a("sm")};
                    width: 100%; padding: ${a("md")} ${a("sm")};
                    background: none; border: none; border-bottom: 1px solid ${l("border")};
                    font-family: inherit; text-align: left; cursor: pointer;
                    &:last-child { border-bottom: none; }

                    & .frow__name { font-weight: 600; font-size: 0.95rem; }
                    & .frow__username {
                        flex: 1; min-width: 0; color: ${l("text-muted")}; font-size: 0.8rem;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    & .frow__hcp {
                        flex-shrink: 0; font-weight: 700; font-size: 0.85rem;
                        color: ${l("accent")}; background: ${l("accent-soft")};
                        border-radius: ${l("radius-pill")}; padding: 2px 10px;
                        font-variant-numeric: tabular-nums;
                    }
                }
            }

            & .setup__banner {
                color: ${l("error")}; font-size: 0.875rem; margin-bottom: ${a("md")};
                white-space: pre-line;
                &:empty { display: none; }
            }

            & .setup__fslots { display: flex; flex-direction: column; gap: ${a("md")}; }

            & .fslot {
                padding: ${a("md")}; ${N()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .fslot__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .fslot__teamname { flex: 1; min-width: 0; font-weight: 700; font-size: 0.95rem; }
                & .fslot__teammeta {
                    margin: ${a("xs")} 0 0; font-size: 0.78rem; color: ${l("text-muted")};
                    &:empty { display: none; }
                }
                & .fslot__format { flex: 1; min-width: 0; font-size: 1rem; }
                & .fslot__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${w()}
                    font-size: 1rem; color: ${l("text-muted")};
                }
                & .fslot__desc {
                    margin: 0; font-size: 0.8rem; color: ${l("text-muted")};
                    &:empty { display: none; }
                }

                & .fslot__group {
                    display: flex; flex-direction: column; gap: ${a("xs")};
                    &[hidden] { display: none; }
                }
                & .fslot__label {
                    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em;
                    text-transform: uppercase; color: ${l("text-muted")};
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
                    & .irow__chk { width: 18px; height: 18px; flex-shrink: 0; accent-color: ${l("primary")}; }
                }

                & .mrow {
                    display: flex; align-items: center; justify-content: space-between; gap: ${a("sm")};
                    & .mrow__pick { display: flex; align-items: center; gap: ${a("sm")}; font-size: 0.9rem; cursor: pointer; }
                    & .mrow__pct {
                        display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
                        font-size: 0.85rem; color: ${l("text-muted")};
                        &[hidden] { display: none; }
                        & input { width: 56px; padding: ${a("xs")} ${a("sm")}; ${j()} font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${a("xs")};
                    & button {
                        flex: 1; padding: ${a("sm")} 0; ${w()}
                        font-family: inherit; font-weight: 700; font-size: 0.82rem;
                        &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                    }
                }
                & .fslot__flat {
                    display: flex; align-items: center; gap: ${a("xs")}; font-size: 0.9rem;
                    color: ${l("text-muted")};
                    &[hidden] { display: none; }
                    & .fslot__pct { width: 70px; padding: ${a("sm")}; font-size: 1rem; ${j()} }
                }
                & .fslot__bands {
                    display: flex; flex-direction: column; gap: ${a("xs")};
                    &[hidden] { display: none; }
                }
                & .fslot__bandrows { display: flex; flex-direction: column; gap: ${a("xs")}; }
                & .brow {
                    display: flex; align-items: center; gap: ${a("xs")};
                    font-size: 0.82rem; color: ${l("text-muted")};
                    & .brow__pct, & .brow__upto { width: 56px; padding: ${a("sm")}; font-size: 0.95rem; ${j()} }
                    & .brow__del { margin-left: auto; width: 30px; height: 30px; ${w()} font-size: 0.8rem; color: ${l("text-muted")}; }
                }
                & .fslot__addband {
                    align-self: flex-start; padding: ${a("xs")} ${a("sm")}; ${w()}
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                }

                & .fslot__err {
                    font-size: 0.82rem; color: ${l("error")};
                    &:empty { display: none; }
                }
            }

            & .setup__create {
                width: 100%; padding: ${a("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit; ${w()}
                background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                box-shadow: ${l("shadow-elevated")};
                &:hover { background: ${l("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;svc=this.inject(Bs);router=this.inject(z);auth=this.inject(F);profile=this.inject(Re);friends=this.inject(ce);pickerOpen=new h(!1);render(){this.svc.reset(),this.pickerOpen.set(!1),this.svc.load(),this.auth.currentUser.get()&&(this.profile.load(),this.friends.load());const e=()=>this.profile.player.get(),t=()=>{const n=e();return this.auth.currentUser.get()!==null&&n!==null&&!this.svc.hasPlayer(n.id)},s=this.wire(Ks,{back:{onclick:()=>this.router.navigate("/")},addPlayer:{onclick:()=>this.svc.addPlayer()},addMe:{className:()=>t()?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>`+ Add me (${e()?.displayName??""})`,onclick:()=>{const n=e();n&&this.svc.addMe({id:n.id,displayName:n.displayName,handicapIndex:n.handicapIndex,gender:n.gender})}},addFriends:{className:()=>this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>this.pickerOpen.get()?"− From friends":"+ From friends",onclick:()=>this.pickerOpen.set(!this.pickerOpen.get())},friendPicker:{className:()=>this.pickerOpen.get()&&this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__friends":"setup__friends hidden"},addTeam:{onclick:()=>this.svc.addTeam()},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const n=this.svc.playersInNoFormat();return n.length===0?"":`Heads up: ${n.map(d=>d.name.trim()||"A player").join(", ")} ${n.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.generalDiagnostics().map(o=>o.message),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?"Creating…":"Create round",onclick:async()=>{const n=await this.svc.submit();n.ok&&this.router.navigate("/round",{query:{token:n.token}})}}});this.$each(this.ref(s,"presets"),()=>Gs,(n,o,d)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(n),className:()=>this.svc.preset.get()===n?"on":"",onclick:()=>this.svc.setPreset(n)}},d),n=>n);const r=n=>this.track(n);return this.mountSelect(this.ref(s,"course"),r,{value:this.bound(r,()=>this.svc.courseId.get(),n=>{n&&n!==this.svc.courseId.get()&&this.svc.selectCourse(n)}),options:{get:()=>{const n=[];let o="";for(const d of this.svc.courses.get())d.clubName!==o&&(n.push({value:`__club:${d.clubName}`,label:d.clubName,disabled:!0}),o=d.clubName),n.push({value:d.id,label:d.name});return n}},placeholder:"Select a course"}),this.mountSelect(this.ref(s,"startHole"),r,{value:this.bound(r,()=>String(this.svc.startHole.get()),n=>this.svc.startHole.set(Number(n))),options:{get:()=>this.svc.startHoleOptions().map(n=>({value:String(n),label:String(n)}))}}),this.$each(this.ref(s,"friendRows"),()=>this.friends.friends.get().filter(n=>!this.svc.hasPlayer(n.id)),(n,o,d)=>this.wireEl(Vs,{row:{onclick:()=>this.svc.addFriend({id:n.id,displayName:n.displayName,handicapIndex:n.handicapIndex,gender:n.gender})},name:()=>n.displayName,username:()=>`@${n.username}`,hcp:()=>n.handicapIndex===null?"–":n.handicapIndex.toFixed(1)},d),n=>n.id),this.$each(this.ref(s,"players"),this.svc.players,(n,o,d)=>this.playerRow(n.key,d),n=>n.key),this.$each(this.ref(s,"teams"),this.svc.teams,(n,o,d)=>this.teamCard(n.key,d),n=>n.key),this.$each(this.ref(s,"formats"),this.svc.formatSlots,(n,o,d)=>this.formatCard(n.key,o,d),n=>n.key),s}mountSelect(e,t,s){const r=new le(s);r.mount(e),t(()=>r.destroy())}bound(e,t,s){const r=new h(t());return e(x(()=>r.set(t()))),e(x(()=>{const n=r.get();queueMicrotask(()=>s(n))})),r}eachInto(e,t,s,r,n){const o=new Map,d=new Map;t(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),t(x(()=>{const c=s(),u=new Map;for(const[m,g]of c.entries()){const v=n(g,m);if(o.has(v))u.set(v,o.get(v));else{const M=[];u.set(v,r(g,m,$=>M.push($))),d.set(v,M)}}for(const[m,g]of o)u.has(m)||(g.remove(),d.get(m)?.forEach(v=>v()),d.delete(m));let f=e.firstChild;for(const m of u.values())m===f?f=f.nextSibling:e.insertBefore(m,f);o.clear();for(const[m,g]of u)o.set(m,g)}))}formatCard(e,t,s){const r=()=>this.svc.slotByKey(e),n=()=>r()?.formatId??"",o=this.wireEl(Ws,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(n())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:c=>this.svc.setSlotAllowance(e,c.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(n())?"applied to each side member’s ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.diagnosticsForFormat(t).map(c=>c.message).join(" · ")}},s);this.mountSelect(this.ref(o,"format"),s,{value:this.bound(s,()=>n(),c=>{c&&c!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,c)}),options:{get:()=>this.svc.catalog.descriptors.get().map(c=>({value:c.id,label:this.svc.catalog.labelOf(c)??c.label}))}});const d=()=>{const c=this.svc.isSideFormat(n()),u=[];c||u.push(...this.svc.players.get().map(f=>({kind:"player",subKey:f.key})));for(const f of this.svc.teams.get())f.kind==="multi_ball"===c&&u.push({kind:"team",subKey:f.key});return u};return this.eachInto(this.ref(o,"subjectRows"),s,d,(c,u,f)=>this.subjectRow(e,c.kind,c.subKey,f),c=>`${c.kind}${c.subKey}`),o}subjectRow(e,t,s,r){const n=()=>{if(t==="player")return this.svc.players.get().find(u=>u.key===s)?.name?.trim()||"Player";const c=this.svc.teamByKey(s);return c?`${this.svc.teamLabel(c)} (${c.kind==="multi_ball"?"side":"team"})`:"Team"},o=()=>t==="player"?this.svc.subjectPlayerIn(e,s):this.svc.subjectTeamIn(e,s),d=c=>t==="player"?this.svc.setSubjectPlayer(e,s,c):this.svc.setSubjectTeam(e,s,c);return this.wireEl(Xs,{chk:{checked:()=>o(),onchange:c=>d(c.target.checked)},name:{textContent:()=>n()}},r)}teamCard(e,t){const s=()=>this.svc.teamKindOf(e)==="multi_ball",r=this.wireEl(Qs,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const n=this.svc.teamByKey(e);return n?this.svc.teamLabel(n):"Team"}},compGroup:{hidden:()=>s()},membersLabel:{textContent:()=>s()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const n=this.svc.teamSize(e);if(n===0)return s()?"Tick at least 2 members — a side needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(n<2)return"Add one more member — a team needs at least 2.";if(s())return`${n} balls · a side (scored together by a side format)`;const o=this.svc.teamBallCh(e);return o===null?`${n} players`:`${n} players · plays off CH ${o}`}}},t);return this.mountSelect(this.ref(r,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),n=>this.svc.setTeamKind(e,n==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"One combined ball"},{value:"multi_ball",label:"Separate balls (a side)"}]}}),this.mountSelect(this.ref(r,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",n=>this.svc.setTeamFormation(e,n)),options:{get:()=>this.svc.formations.map(n=>({value:n,label:n[0].toUpperCase()+n.slice(1)}))}}),this.eachInto(this.ref(r,"memberRows"),t,()=>{const n=this.svc.players.get().map(o=>({kind:"player",mKey:o.key}));if(s())for(const o of this.svc.eligibleNestedTeams(e))n.push({kind:"team",mKey:o.key});return n},(n,o,d)=>n.kind==="player"?this.teamMemberRow(e,n.mKey,d):this.teamNestedRow(e,n.mKey,d),n=>`${n.kind}${n.mKey}`),r}teamNestedRow(e,t,s){const r=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(Pe,{chk:{checked:()=>r(),disabled:()=>!r()&&this.svc.teamAtMaxSize(e),onchange:n=>this.svc.setTeamMemberTeam(e,t,n.target.checked)},name:{textContent:()=>{const n=this.svc.teamByKey(t);return n?`${this.svc.teamLabel(n)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},s)}teamMemberRow(e,t,s){const r=()=>this.svc.players.get().find(o=>o.key===t)??null,n=()=>this.svc.teamMemberIn(e,t);return this.wireEl(Pe,{chk:{checked:()=>n(),disabled:()=>!n()&&this.svc.teamAtMaxSize(e),onchange:o=>this.svc.setTeamMember(e,t,o.target.checked)},name:{textContent:()=>r()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!n()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:o=>this.svc.setTeamPct(e,t,o.target.value)}},s)}playerRow(e,t){const s=()=>this.svc.players.get().find(o=>o.key===e)??null,r=()=>this.svc.players.get().findIndex(o=>o.key===e),n=this.wireEl(Us,{name:{value:s()?.name??"",readOnly:()=>!!s()?.playerId,oninput:o=>this.svc.patchPlayer(e,{name:o.target.value})},index:{value:s()?.handicapIndex??"",oninput:o=>this.svc.patchPlayer(e,{handicapIndex:o.target.value})},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const o=s();if(!o)return"";const d=this.svc.derivedCH(o);if(!d)return"";const c=d.rating;return`Course handicap ${d.ch}  ·  ${o.handicapIndex} × ${c.slope}/113 + (${c.courseRating} − ${c.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(r()).map(o=>o.message).join(" · ")}},t);return this.mountSelect(this.ref(n,"gender"),t,{value:this.bound(t,()=>s()?.gender??"M",o=>this.svc.patchPlayer(e,{gender:o})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]},disabled:{get:()=>s()?.genderKnown===!0}}),this.mountSelect(this.ref(n,"tee"),t,{value:this.bound(t,()=>s()?.teeId??"",o=>this.svc.patchPlayer(e,{teeId:o})),options:{get:()=>this.svc.tees.get().map(o=>({value:o.id,label:o.name}))},placeholder:"Tee"}),n}}const Js=b(`
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
            <div bind="registerFields" class="login__register">
                <input bind="displayName" type="text" placeholder="Display name" autocomplete="name" />
                <input bind="hcp" inputmode="decimal" placeholder="Handicap index (optional)" />
                <div class="login__genderrow">
                    <span>Gender (optional)</span>
                    <div bind="gender" class="login__genderseg"></div>
                </div>
            </div>
            <button type="submit" bind="submit">Sign in</button>
        </form>
        <button bind="toggle" class="login__toggle" type="button"></button>
    </div>
`);class Zs extends P{static styles=`
        .login {
            max-width: 340px;
            margin: 0 auto;
            padding: 14vh ${a("xl")} 0;

            &[inert] { opacity: 0.6; }

            & .login__hero {
                text-align: center;
                margin-bottom: ${a("2xl")};

                & .login__flag { font-size: 2.2rem; }

                & h1 {
                    margin: ${a("sm")} 0 0;
                    font-family: ${l("font-display")};
                    font-weight: 600;
                    font-size: 2.4rem;
                    letter-spacing: -0.02em;
                    color: ${l("text")};
                }

                & p {
                    margin: ${a("xs")} 0 0;
                    color: ${l("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .error {
                display: none;
                padding: ${a("sm")} ${a("md")};
                margin-bottom: ${a("md")};
                color: ${l("error")};
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
                    ${j()}
                }

                & .login__register {
                    display: flex;
                    flex-direction: column;
                    gap: ${a("md")};
                    &.hidden { display: none; }
                }

                & .login__genderrow {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: ${a("md")};
                    font-size: 0.85rem;
                    color: ${l("text-muted")};
                }

                & .login__genderseg {
                    display: flex;
                    gap: ${a("xs")};

                    & button {
                        padding: ${a("sm")} ${a("lg")};
                        font-size: 0.9rem;
                        font-weight: 700;
                        ${w()}
                        &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                    }
                }

                & button {
                    padding: ${a("md")} ${a("lg")};
                    font-size: 1rem;
                    font-weight: 700;
                    ${w()}
                    background: ${l("primary")};
                    color: ${l("primary-text")};
                    border: none;
                    &:hover { background: ${l("primary")}; }
                }
            }

            & .login__toggle {
                display: block;
                margin: ${a("xl")} auto 0;
                padding: ${a("sm")} ${a("lg")};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 600;
                color: ${l("text-muted")};
                text-decoration: underline;
                cursor: pointer;
            }
        }
    `;auth=this.inject(F);router=this.inject(z);nextQ=this.router.query("next");mode=new h("login");busy=new h(!1);registerError=new h("");username="";password="";displayName="";hcp="";gender=new h(null);destination(e){const t=this.nextQ.get();return t&&t.startsWith("/")?t:e}async submit(){if(this.registerError.set(""),this.mode.get()==="login"){await this.auth.login(this.username,this.password)&&this.router.navigate(this.destination("/"),!0);return}const e=this.hcp.trim().replace(",","."),t=e===""?null:Number.parseFloat(e);if(t!==null&&!Number.isFinite(t)){this.registerError.set("Handicap index must be a number (or leave it empty).");return}if(this.password.length<8){this.registerError.set("Password must be at least 8 characters.");return}if(!this.username.trim()||!this.displayName.trim()){this.registerError.set("Username and display name are required.");return}this.busy.set(!0);try{const s=await _.players.register({username:this.username.trim(),password:this.password,displayName:this.displayName.trim(),handicapIndex:t,gender:this.gender.get()});this.auth.currentUser.set({id:s.id,username:s.username}),this.router.navigate(this.destination("/"),!0)}catch(s){this.registerError.set(s instanceof O&&s.status===409?"That username is taken.":s instanceof O?s.message:"Could not create the account. Try again.")}finally{this.busy.set(!1)}}render(){const e=()=>this.mode.get()==="register",t=()=>this.auth.loading.get()||this.busy.get(),s=this.wire(Js,{root:{inert:()=>t()},error:{className:()=>this.registerError.get()||this.auth.error.get()?"error show":"error",textContent:()=>this.registerError.get()||this.auth.error.get()?.message||""},form:{onsubmit:async n=>{n.preventDefault(),await this.submit()}},username:{oninput:n=>{this.username=n.target.value}},password:{autocomplete:()=>e()?"new-password":"current-password",oninput:n=>{this.password=n.target.value}},registerFields:{className:()=>e()?"login__register":"login__register hidden"},displayName:{oninput:n=>{this.displayName=n.target.value}},hcp:{oninput:n=>{this.hcp=n.target.value}},submit:{textContent:()=>t()?e()?"Creating account…":"Signing in…":e()?"Create account":"Sign in"},toggle:{textContent:()=>e()?"Have an account? Sign in":"New here? Create an account",onclick:()=>{this.registerError.set(""),this.auth.error.set(null),this.mode.set(e()?"login":"register")}}}),r=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];return this.$each(this.ref(s,"gender"),()=>r,(n,o,d)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>n.label,className:()=>this.gender.get()===n.value?"on":"",onclick:()=>this.gender.set(n.value)}},d),n=>n.label),s}}const en=b(`
    <div class="friends">
        <div bind="anon" class="friends__anon">
            <p>Your friends list lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>
        <div bind="body" class="friends__body">
            <header class="friends__head">
                <h1>Friends</h1>
                <p>Players you often tee up with — one tap adds them to a round.</p>
            </header>

            <section class="friends__section">
                <input bind="search" class="friends__search" type="search"
                    placeholder="Search players by name or @username"
                    autocomplete="off" autocapitalize="none" />
                <p bind="searchHint" class="friends__hint"></p>
                <p bind="searchErr" class="friends__err"></p>
                <div bind="results" class="friends__list"></div>
                <div bind="resultsEmpty" class="friends__empty">No players match that search.</div>
            </section>

            <section class="friends__section">
                <h2>My friends</h2>
                <div bind="friendsEmpty" class="friends__empty">No friends yet — search above to add the people you play with.</div>
                <div bind="friends" class="friends__list"></div>
            </section>
        </div>
    </div>
`),tn=b(`
    <div class="friend-row">
        <span bind="initials" class="friend-row__badge"></span>
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="username" class="friend-row__username"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="add" class="friend-row__add" type="button">Add</button>
        <span bind="added" class="friend-row__added">✓ Friend</span>
    </div>
`),sn=b(`
    <div class="friend-row">
        <span bind="initials" class="friend-row__badge"></span>
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="username" class="friend-row__username"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="remove" class="friend-row__remove" type="button" aria-label="Remove friend">✕</button>
    </div>
`);function Ce(i){return i.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0].toUpperCase()).join("")}class nn extends P{static styles=`
        .friends {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .friends__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};

                &.hidden { display: none; }

                & button {
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    ${w()}
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                }
            }

            & .friends__body.hidden { display: none; }

            & .friends__head {
                margin-bottom: ${a("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${l("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem; }
            }

            & .friends__section {
                margin-bottom: ${a("xl")};
                & h2 {
                    margin: 0 0 ${a("sm")};
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .friends__search {
                width: 100%;
                padding: ${a("md")} ${a("lg")};
                font-size: 1rem;
                ${j()}
            }

            & .friends__hint {
                margin: ${a("sm")} 0 0; font-size: 0.82rem; color: ${l("text-muted")};
                &:empty { display: none; }
            }
            & .friends__err {
                margin: ${a("sm")} 0 0; font-size: 0.85rem; color: ${l("error")};
                &:empty { display: none; }
            }

            & .friends__empty {
                color: ${l("text-muted")}; font-size: 0.9rem; padding: ${a("md")} 0;
                &.hidden { display: none; }
            }

            & .friends__list {
                display: flex; flex-direction: column; gap: ${a("sm")};
                margin-top: ${a("md")};
                &:empty { display: none; }
            }

            & .friend-row {
                display: flex; align-items: center; gap: ${a("md")};
                padding: ${a("md")} ${a("lg")};
                ${N()}

                & .friend-row__badge {
                    display: grid; place-items: center;
                    width: 40px; height: 40px; border-radius: 50%;
                    background: ${l("primary")}; color: ${l("primary-text")};
                    font-weight: 700; font-size: 0.85rem; flex-shrink: 0;
                }
                & .friend-row__who {
                    flex: 1; min-width: 0;
                    display: flex; flex-direction: column; gap: 1px;
                }
                & .friend-row__name {
                    font-weight: 600; font-size: 1rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .friend-row__username {
                    color: ${l("text-muted")}; font-size: 0.8rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .friend-row__hcp {
                    font-weight: 700; flex-shrink: 0;
                    color: ${l("accent")}; background: ${l("accent-soft")};
                    border-radius: ${l("radius-pill")};
                    padding: 2px 10px; font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                }
                & .friend-row__add {
                    flex-shrink: 0; padding: ${a("sm")} ${a("lg")};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
                    ${w()}
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                    &.hidden { display: none; }
                    &:disabled { opacity: 0.5; cursor: default; }
                }
                & .friend-row__added {
                    flex-shrink: 0; font-size: 0.8rem; font-weight: 700;
                    color: ${l("accent")};
                    &.hidden { display: none; }
                }
                & .friend-row__remove {
                    width: 34px; height: 34px; flex-shrink: 0; ${w()}
                    font-size: 0.9rem; color: ${l("text-muted")};
                }
            }
        }
    `;svc=this.inject(ce);auth=this.inject(F);router=this.inject(z);render(){const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.load();const t=this.wire(en,{anon:{className:()=>e()?"friends__anon hidden":"friends__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},body:{className:()=>e()?"friends__body":"friends__body hidden"},search:{value:()=>this.svc.query.get(),oninput:s=>this.svc.setQuery(s.target.value)},searchHint:{textContent:()=>{const s=this.svc.query.get().trim();return s.length>0&&!Ee(s)?"Type at least 2 characters.":this.svc.searching.get()?"Searching…":""}},searchErr:{textContent:()=>this.svc.searchError.get()?.message??""},resultsEmpty:{className:()=>{const s=this.svc.query.get().trim();return Ee(s)&&!this.svc.searching.get()&&this.svc.searchError.get()===null&&this.svc.resultsFor.get()===s&&this.svc.results.get().length===0?"friends__empty":"friends__empty hidden"}},friendsEmpty:{className:()=>this.svc.loaded.get()&&this.svc.friends.get().length===0?"friends__empty":"friends__empty hidden"}});return this.$each(this.ref(t,"results"),this.svc.results,(s,r,n)=>this.wireEl(tn,{initials:()=>Ce(s.displayName),name:()=>s.displayName,username:()=>`@${s.username}`,hcp:()=>s.handicapIndex===null?"–":s.handicapIndex.toFixed(1),add:{className:()=>this.isFriendNow(s.id)?"friend-row__add hidden":"friend-row__add",disabled:()=>this.svc.mutating.get(),onclick:()=>{const o=this.svc.results.get().find(d=>d.id===s.id);o&&!o.isFriend&&this.svc.add(o)}},added:{className:()=>this.isFriendNow(s.id)?"friend-row__added":"friend-row__added hidden"}},n),s=>s.id),this.$each(this.ref(t,"friends"),this.svc.friends,(s,r,n)=>this.wireEl(sn,{initials:()=>Ce(s.displayName),name:()=>s.displayName,username:()=>`@${s.username}`,hcp:()=>s.handicapIndex===null?"–":s.handicapIndex.toFixed(1),remove:{disabled:()=>this.svc.mutating.get(),onclick:()=>{this.svc.remove(s.id)}}},n),s=>s.id),t}isFriendNow(e){return this.svc.results.get().find(t=>t.id===e)?.isFriend===!0}}const rn=b(`
    <div class="profile">
        <div bind="anon" class="profile__anon">
            <p>Your profile lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>
        <div bind="body" class="profile__body">
            <header class="profile__head">
                <h1 bind="name"></h1>
                <p bind="username"></p>
            </header>

            <section class="profile__card">
                <span class="profile__label">Gender</span>
                <div class="profile__gender-row">
                    <div bind="gender" class="profile__genderseg"></div>
                </div>
                <p class="profile__hint">Used for tee ratings — set once and it locks in "Add me" during round setup.</p>
                <p bind="genderErr" class="profile__err"></p>
            </section>

            <section class="profile__card">
                <span class="profile__label">Handicap index</span>
                <div class="profile__hcp-row">
                    <span bind="hcp" class="profile__hcp"></span>
                    <form bind="form" class="profile__edit">
                        <input bind="index" inputmode="decimal" placeholder="e.g. 18.4" />
                        <button type="submit" bind="save">Save</button>
                    </form>
                </div>
                <p class="profile__hint">Maintained by you — each save is recorded below with its effective date.</p>
                <p bind="saveErr" class="profile__err"></p>
            </section>

            <section class="profile__section">
                <h2>Handicap history</h2>
                <div bind="historyEmpty" class="profile__empty">No entries yet — save an index to start the chain.</div>
                <div bind="history" class="profile__history"></div>
            </section>

            <button bind="signout" class="profile__signout" type="button">Sign out</button>
        </div>
    </div>
`),on=b(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`);class an extends P{static styles=`
        .profile {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .profile__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};

                &.hidden { display: none; }

                & button {
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    ${w()}
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                }
            }

            & .profile__body.hidden { display: none; }

            & .profile__head {
                margin-bottom: ${a("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${l("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem; }
            }

            & .profile__card {
                padding: ${a("lg")};
                margin-bottom: ${a("xl")};
                ${N()}

                & .profile__label {
                    font-weight: 700; font-size: 0.8rem;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    color: ${l("text-muted")};
                }
                & .profile__hcp-row {
                    display: flex; align-items: center; gap: ${a("md")};
                    margin-top: ${a("sm")};
                }
                & .profile__hcp {
                    font-family: ${l("font-display")};
                    font-weight: 700; font-size: 2rem;
                    font-variant-numeric: tabular-nums;
                    color: ${l("text")};
                }
                & .profile__edit {
                    display: flex; gap: ${a("sm")}; flex: 1; justify-content: flex-end;
                    & input { width: 90px; padding: ${a("md")}; font-size: 1rem; text-align: center; ${j()} }
                    & button {
                        padding: ${a("md")} ${a("lg")}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700; ${w()}
                        background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
                & .profile__hint { margin: ${a("sm")} 0 0; font-size: 0.8rem; color: ${l("text-muted")}; }
                & .profile__err {
                    margin: ${a("sm")} 0 0; font-size: 0.85rem; color: ${l("error")};
                    &:empty { display: none; }
                }

                & .profile__gender-row { margin-top: ${a("sm")}; }
                & .profile__genderseg {
                    display: flex;
                    gap: ${a("xs")};

                    & button {
                        flex: 1;
                        padding: ${a("sm")} 0;
                        font-family: inherit;
                        font-size: 0.9rem;
                        font-weight: 700;
                        ${w()}
                        &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
            }

            & .profile__section {
                & h2 {
                    margin: 0 0 ${a("sm")};
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .profile__empty {
                color: ${l("text-muted")}; font-size: 0.9rem; padding: ${a("md")} 0;
                &.hidden { display: none; }
            }

            & .profile__history { display: flex; flex-direction: column; gap: ${a("sm")}; }

            & .hcp-entry {
                display: flex; align-items: baseline; gap: ${a("md")};
                padding: ${a("md")} ${a("lg")};
                ${N()}

                & .hcp-entry__index {
                    font-weight: 700; font-size: 1.05rem;
                    font-variant-numeric: tabular-nums;
                    width: 52px;
                }
                & .hcp-entry__source {
                    font-size: 0.7rem; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    border-radius: ${l("radius-pill")};
                    padding: 2px 10px;
                    background: ${l("accent-soft")}; color: ${l("accent")};
                }
                & .hcp-entry__date {
                    margin-left: auto;
                    color: ${l("text-muted")}; font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                }
            }

            & .profile__signout {
                display: block;
                margin: ${a("2xl")} auto 0;
                padding: ${a("sm")} ${a("lg")};
                background: none; border: none; font-family: inherit;
                font-size: 0.85rem; font-weight: 600;
                color: ${l("text-muted")};
                text-decoration: underline; cursor: pointer;
            }
        }
    `;svc=this.inject(Re);friends=this.inject(ce);auth=this.inject(F);router=this.inject(z);indexDraft=new h("");localErr=new h("");render(){this.auth.currentUser.get()&&this.svc.load();const e=()=>this.auth.currentUser.get()!==null,t=this.wire(rn,{anon:{className:()=>e()?"profile__anon hidden":"profile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/profile"}})},body:{className:()=>e()?"profile__body":"profile__body hidden"},name:()=>this.svc.player.get()?.displayName??"…",username:()=>{const r=this.svc.player.get();return r?`@${r.username}`:""},hcp:()=>{const r=this.svc.player.get()?.handicapIndex;return r==null?"–":r.toFixed(1)},index:{value:()=>this.indexDraft.get(),oninput:r=>this.indexDraft.set(r.target.value)},save:{disabled:()=>this.svc.saving.get()||this.indexDraft.get().trim()==="",textContent:()=>this.svc.saving.get()?"Saving…":"Save"},form:{onsubmit:async r=>{r.preventDefault(),this.localErr.set("");const n=this.indexDraft.get().trim().replace(",","."),o=Number.parseFloat(n);if(!Number.isFinite(o)||o<-10||o>54){this.localErr.set("Enter an index between -10 and 54.");return}await this.svc.saveIndex(o)&&this.indexDraft.set("")}},saveErr:{textContent:()=>this.localErr.get()||this.svc.saveError.get()?.message||""},genderErr:{textContent:()=>this.svc.saveError.get()?.message||""},historyEmpty:{className:()=>this.svc.history.get().length===0?"profile__empty":"profile__empty hidden"},signout:{onclick:async()=>{await this.auth.logout(),this.svc.clear(),this.friends.clear(),this.router.navigate("/")}}});this.$each(this.ref(t,"history"),this.svc.history,(r,n,o)=>this.wireEl(on,{index:()=>r.handicapIndex.toFixed(1),source:()=>r.source,date:()=>r.effectiveDate},o),r=>r.id);const s=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];return this.$each(this.ref(t,"gender"),()=>s,(r,n,o)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>r.label,className:()=>this.svc.player.get()?.gender===r.value?"on":"",disabled:()=>this.svc.saving.get(),onclick:()=>{this.svc.saveGender(r.value)}}},o),r=>r.label),t}}const ln=b(`
    <div class="app-shell">
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class dn extends P{static styles=`
        .app-shell {
            display: grid;
            grid-template-rows: 1fr auto;
            height: 100vh;
            height: 100dvh;
            max-width: 560px;
            margin: 0 auto;
            background: ${l("bg")};

            & .app-shell__content {
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
        }
    `;router=this.inject(z);render(){const e=this.wire(ln,{});return this.spawn(_t,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":xe,"/round":Hs,"/create":Ys,"/login":Zs,"/friends":nn,"/profile":an},xe),e}}H.get(rt);const Ne=H.get(z),ze=H.get(F);await ot(dn,"#app",{hot:void 0,onInit:async()=>{await ze.load(),ze.currentUser.get()&&Ne.route.get()==="/login"&&Ne.navigate("/",!0)}});export{P as C,z as R,h as S,rt as T,p as a,X as b,T as c,x as e,S as r,b as t};
