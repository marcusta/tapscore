(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=t(n);fetch(n.href,r)}})();const tt="modulepreload",st=function(i){return"/tapscore/"+i},_e={},nt=function(e,t,s){let n=Promise.resolve();if(t&&t.length>0){let u=function(c){return Promise.all(c.map(m=>Promise.resolve(m).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),d=o?.nonce||o?.getAttribute("nonce");n=u(t.map(c=>{if(c=st(c),c in _e)return;_e[c]=!0;const m=c.endsWith(".css"),p=m?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${p}`))return;const g=document.createElement("link");if(g.rel=m?"stylesheet":tt,m||(g.as="script"),g.crossOrigin="",g.href=c,d&&g.setAttribute("nonce",d),document.head.appendChild(g),m)return new Promise((w,b)=>{g.addEventListener("load",w),g.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${c}`)))})}))}function r(o){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=o,window.dispatchEvent(d),!d.defaultPrevented)throw o}return n.then(o=>{for(const d of o||[])d.status==="rejected"&&r(d.reason);return e().catch(r)})};class rt{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])this.batching?this.pending.add(t):t.run()}runTracked(e,t){Le(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.run()}}}const A=new rt;function Le(i){for(const e of i.deps)e.delete(i);i.deps.clear()}class h{constructor(e){this.subs=new Set,this.val=e}get(){return A.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,A.notify(this.subs))}update(e){this.set(e(this.val))}}class T{constructor(e){this.subs=new Set,this.val=void 0;const t=this,s={run(){A.runTracked(s,()=>{const n=e();Object.is(t.val,n)||(t.val=n,A.notify(t.subs))})},deps:new Set};s.run()}get(){return A.subscribe(this.subs),this.val}peek(){return this.val}}function $(i){const e={run(){A.runTracked(e,i)},deps:new Set};return e.run(),()=>Le(e)}function Z(i){A.batch(i)}function Q(i){return A.untrack(i)}class it{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const L=new it,Y="/tapscore/".replace(/\/+$/,"");function ue(i){return Y?i===Y?"/":i.startsWith(Y+"/")?i.slice(Y.length):i:i}function ot(i){return Y+i}class H{constructor(){this.route=new h(ue(location.pathname??"/")),this.search=new h(location.search??""),window.addEventListener("popstate",()=>Z(()=>{this.route.set(ue(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},n=e.indexOf("#"),r=n>=0?e.slice(n):"",o=n>=0?e.slice(0,n):e,d=o.indexOf("?"),u=d>=0?o.slice(0,d):o,c=d>=0?o.slice(d+1):"",m=s.query!==void 0?at(s.query):c?"?"+c:"",p=ot(u)+m+r;(s.replace?history.replaceState:history.pushState).call(history,null,"",p),Z(()=>{this.route.set(u),this.search.set(m)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:n=>{n.preventDefault(),this.navigate(e)},className:()=>{const n=this.route.get();return n===s||n.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new T(()=>{const s=this.route.get().split("/"),n={};for(const[r,o]of t.entries())o.startsWith(":")&&(n[o.slice(1)]=s[r]??"");return n})}query(e){return new T(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new T(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function at(i){const e=new URLSearchParams;for(const[s,n]of Object.entries(i))n==null||n===""||e.set(s,String(n));const t=e.toString();return t?"?"+t:""}function lt(i){return e=>i[e]}function dt(i,e){const t=(n,r,o)=>{const d=Object.entries(n).map(([u,c])=>`--${u}:${c}`).join(";");return`${r}{color-scheme:${o};${d}}`},s=document.createElement("style");return s.textContent=t(i,'[data-theme="light"]',"light")+t(e,'[data-theme="dark"]',"dark"),document.head.appendChild(s),n=>`var(--${n})`}const ve="basics-js-theme";class ct{constructor(){this.dark=new h(!1);const e=localStorage.getItem(ve),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),$(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(ve,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function y(i){const e=document.createElement("template");return e.innerHTML=i,e}function ut(i,e){let t;for(const s of Object.keys(e))i.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const xe=new Set;class C{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!xe.has(t)){xe.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return L.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const n=Q(()=>{const r=new e(s[0]);return r.mount(t),r});return this.children.push(n),n}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0}wire(e,t,s){const n=s??(o=>this.track(o)),r=e.content.cloneNode(!0);for(const o of r.querySelectorAll("[bind]")){const d=t[o.getAttribute("bind")];if(d)if(typeof d=="function")n($(()=>{const u=d();o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement?o.value=String(u):o.textContent=String(u)}));else for(const[u,c]of Object.entries(d)){const m=u.includes("-");u.startsWith("on")&&typeof c=="function"?o.addEventListener(u.slice(2),c):typeof c=="function"?n($(()=>{const p=c();m?o.setAttribute(u,String(p)):o[u]=p})):m?o.setAttribute(u,String(c)):o[u]=c}}return r}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const n=this.ref(t,e);return n?(typeof s=="string"?n.textContent=s:typeof s=="function"&&s.prototype instanceof C?this.spawn(s,n):typeof s=="function"&&s(n,{spawn:(r,o,...d)=>this.spawn(r,o,...d),track:r=>this.track(r)}),!0):!1}$each(e,t,s,n=(r,o)=>o){const r=typeof t=="function"?t:()=>t.get(),o=new Map,d=new Map;this.track(()=>{for(const u of d.values())u.forEach(c=>c());d.clear()}),this.track($(()=>{const u=r(),c=new Map;for(const[p,g]of u.entries()){const w=n(g,p);if(o.has(w))c.set(w,o.get(w));else{const b=[];c.set(w,Q(()=>s(g,p,v=>b.push(v)))),d.set(w,b)}}for(const[p,g]of o)c.has(p)||(g.remove(),d.get(p)?.forEach(w=>w()),d.delete(p));let m=e.firstChild;for(const p of c.values())p===m?m=m.nextSibling:e.insertBefore(p,m);o.clear();for(const[p,g]of c)o.set(p,g)}))}$condition(e,t,s,n){let r=null;this.track($(()=>{r&&(r.remove(),r=null);const o=t.get();r=Q(()=>o?s():n?.()??null),r&&e.appendChild(r)}))}$swap(e,t,s,n){let r=null;this.track($(()=>{r&&(r.destroy(),r=null),e.textContent="";const o=t.get(),d=s[o]??ut(o,s)??n;d&&(r=Q(()=>{const u=new d;return u.mount(e),u}))})),this.track(()=>r?.destroy())}}async function ht(i,e,t){const s=document.querySelector(e);s.textContent="";const n=L.get(H);let r=null,o=!1,d=null,u=!!t?.hot?.data.hmr;const c=async m=>{r&&(r.destroy(),r=null,s.textContent=""),m?(d||(d=(await nt(()=>import("./obs-shell.component-rc_TLmQD.js"),[])).ObsShellComponent),r=Q(()=>new d)):(!u&&t?.onInit&&(await t.onInit(),u=!0),r=Q(()=>new i)),Q(()=>r.mount(s)),o=m};await c(ue(location.pathname).startsWith("/_obs")),$(()=>{const m=n.route.get().startsWith("/_obs");m!==o&&c(m)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>r?.destroy()),t.hot.accept())}class M extends Error{constructor(e,t,s,n){super(t),this.status=e,this.details=s,this.traceId=n,this.name="ApiError"}}const pt=10,ie=[];let oe=[],J=null;function mt(i){ie.push(i),ie.length>pt&&ie.shift()}function ft(i,e,t){const s={code:i,message:e,url:typeof location<"u"?location.href:"",context:[...ie],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),oe.push(s),gt()}function gt(){J||(J=setTimeout(Be,5e3))}function Be(){if(J&&(clearTimeout(J),J=null),oe.length===0)return;const i=oe;oe=[];for(const e of i){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon("/api/_obs/errors",new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch("/api/_obs/errors",{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Be()});const bt=3e4,yt=2,se=new Map,Ge=new WeakMap;function _t(i){if(i instanceof M)return i.traceId;if(i!=null&&typeof i=="object")return Ge.get(i)}async function f(i){if(i.method==="GET"){const e=se.get(i.url);if(e)return e;const t=we(i,yt);return se.set(i.url,t),t.then(()=>se.delete(i.url),()=>se.delete(i.url)),t}return we(i,0)}async function we(i,e){const t=i.timeout??bt;let s;for(let n=0;n<=e;n++){const r=crypto.randomUUID();try{return await xt(vt(i,r),t)}catch(o){if(s=o,!(o instanceof M)&&o!=null&&typeof o=="object"&&Ge.set(o,r),o instanceof M||n===e)break;await new Promise(d=>setTimeout(d,1e3*2**n))}}throw s}async function vt(i,e){const t={"X-Trace-Id":e},s={method:i.method,headers:t};i.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(i.body));const n=await fetch(i.url,s),r=n.headers.get("x-trace-id")??e;if(mt({type:"api",detail:`${i.method} ${i.url}`,timestamp:new Date().toISOString()}),!n.ok){const o=await n.json().catch(()=>({error:n.statusText}));throw new M(n.status,o.error??n.statusText,o.details,r)}return n.json()}function xt(i,e){let t;const s=new Promise((n,r)=>{t=setTimeout(()=>r(new Error("Request timeout")),e)});return Promise.race([i,s]).finally(()=>clearTimeout(t))}async function I(i,e,t){Z(()=>{i.set(!0),e.set(null)});try{const s=await t();return i.set(!1),s}catch(s){const n=wt(s);Z(()=>{i.set(!1),e.set(n)}),ft(n.code,n.message,_t(s));return}}function wt(i){return i instanceof M?i.status===401?{code:"auth",message:"Unauthorized"}:i.status===409?{code:"conflict",message:"Data has changed — please try again"}:i.status===400?{code:"validation",message:i.message}:{code:"server",message:"Server error"}:i instanceof Error?i.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}function $t(i){return{me:()=>f({method:"GET",url:`${i}/auth/me`}),login:e=>f({method:"POST",url:`${i}/auth/login`,body:e}),logout:()=>f({method:"POST",url:`${i}/auth/logout`,body:{}})}}class B{constructor(){this.api=$t("/api"),this.currentUser=new h(null),this.loading=new h(!1),this.error=new h(null)}async load(){const e=await I(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await I(this.loading,this.error,()=>this.api.login({username:e,password:t}));return s?(this.currentUser.set(s),!0):!1}async logout(){await I(this.loading,this.error,()=>this.api.logout());const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const $e={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},l=dt({...$e,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},{...$e,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"}),P=i=>`var(--${i})`,a=lt({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem"}),k=(i=P("radius"))=>`
    border: 1px solid ${P("border")};
    border-radius: ${i};
    background: ${P("btn-bg")};
    color: ${P("text")};
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: ${P("btn-hover")}; }
`,F=()=>`
    border: 1px solid ${P("border")};
    border-radius: ${P("radius")};
    background: ${P("input-bg")};
    color: ${P("text")};
    font-family: inherit;
    &::placeholder { color: ${P("text-muted")}; }
`,z=i=>`
    background: ${P("surface")};
    border: 1px solid ${P("border")};
    border-radius: ${P("radius")};
    box-shadow: ${P("shadow")};
    ${i?.hover?`
    transition: box-shadow 0.2s, border-color 0.2s;
    &:hover { box-shadow: ${P("shadow-elevated")}; }`:""}
`,kt=y(`
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
`);class St extends C{static styles=`
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
    `;router=this.inject(H);auth=this.inject(B);render(){return this.wire(kt,{root:{className:()=>{const e=this.router.route.get();return!this.auth.currentUser.get()||e==="/login"||e==="/round"?"tabbar hidden":"tabbar"}},homeLink:this.router.link("/"),friendsLink:this.router.link("/friends"),profileLink:this.router.link("/profile")})}}function It(i){return{async me(){return f({method:"GET",url:`${i}/players/me`})},async register(e){return f({method:"POST",url:`${i}/players/register`,body:e})},async updateHandicap(e){return f({method:"POST",url:`${i}/players/me/handicap`,body:e})},async myHandicapHistory(){return f({method:"GET",url:`${i}/players/me/handicap-history`})},async updateProfile(e){return f({method:"POST",url:`${i}/players/me/profile`,body:e})},async search(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/players/search${s?"?"+s:""}`})}}}function Tt(i){return{async list(){return f({method:"GET",url:`${i}/friends`})},async add(e){return f({method:"POST",url:`${i}/friends`,body:e})},async remove(e){return f({method:"DELETE",url:`${i}/friends/${e.friendId}`})}}}function Et(i){return{async list(){return f({method:"GET",url:`${i}/clubs`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/clubs/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${i}/clubs`,body:e})},async update(e){return f({method:"POST",url:`${i}/clubs/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${i}/clubs/${e.id}`})}}}function Ct(i){return{async list(){return f({method:"GET",url:`${i}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/courses/by-club${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/courses/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${i}/courses`,body:e})},async update(e){return f({method:"POST",url:`${i}/courses/update`,body:e})},async updateHole(e){return f({method:"POST",url:`${i}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/courses/validate${s?"?"+s:""}`})},async remove(e){return f({method:"DELETE",url:`${i}/courses/${e.id}`})}}}function Pt(i){return{async listByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/tees/by-course${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/tees/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${i}/tees`,body:e})},async update(e){return f({method:"POST",url:`${i}/tees/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${i}/tees/${e.id}`})}}}function jt(i){return{async list(){return f({method:"GET",url:`${i}/guest-players`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/guest-players/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${i}/guest-players`,body:e})}}}function Nt(i){return{async latest(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/handicap/latest${s?"?"+s:""}`})},async history(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/handicap/history${s?"?"+s:""}`})},async record(e){return f({method:"POST",url:`${i}/handicap/record`,body:e})}}}function zt(i){return{async list(){return f({method:"GET",url:`${i}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/rounds/balls${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/rounds/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${i}/rounds`,body:e})},async createFromDraft(e){return f({method:"POST",url:`${i}/rounds/from-draft`,body:e})},async update(e){return f({method:"POST",url:`${i}/rounds/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${i}/rounds/${e.id}`})}}}function Ot(i){return{async listByRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/score-events/by-round${s?"?"+s:""}`})},async append(e){return f({method:"POST",url:`${i}/score-events`,body:e})}}}function Ht(i){return{async forBall(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/scorecards/for-ball${s?"?"+s:""}`})},async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/scorecards/for-round${s?"?"+s:""}`})}}}function Mt(i){return{async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/leaderboards/for-round${s?"?"+s:""}`})}}}function Rt(i){return{async list(){return f({method:"GET",url:`${i}/friendly-rounds`})},async create(e){return f({method:"POST",url:`${i}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/friendly-rounds/by-token${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/friendly-rounds/get${s?"?"+s:""}`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/friendly-rounds/balls${s?"?"+s:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/friendly-rounds/scorecard${s?"?"+s:""}`})},async result(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/friendly-rounds/result${s?"?"+s:""}`})},async score(e){return f({method:"POST",url:`${i}/friendly-rounds/score`,body:e})},async setup(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/friendly-rounds/setup${s?"?"+s:""}`})},async editSetup(e){return f({method:"POST",url:`${i}/friendly-rounds/setup`,body:e})},async join(e){return f({method:"POST",url:`${i}/friendly-rounds/join`,body:e})},async claimGuest(e){return f({method:"POST",url:`${i}/friendly-rounds/claim-guest`,body:e})}}}function Ft(i){return{async myRounds(){return f({method:"GET",url:`${i}/dashboard/my-rounds`})}}}function Lt(i){return{async courses(){return f({method:"GET",url:`${i}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/setup/tees/by-course${s?"?"+s:""}`})},async formats(){return f({method:"GET",url:`${i}/setup/formats`})}}}const N="/tapscore/".replace(/\/+$/,"")+"/api",_={players:It(N),friends:Tt(N),clubs:Et(N),courses:Ct(N),tees:Pt(N),guestPlayers:jt(N),handicap:Nt(N),rounds:zt(N),scoreEvents:Ot(N),scorecards:Ht(N),leaderboards:Mt(N),friendlyRounds:Rt(N),dashboard:Ft(N),setup:Lt(N)};function Bt(i){return[...i.played?["Played"]:[],...i.created?["Created"]:[]].join(" · ")}function Gt(i,e){const t=new Map;for(const s of e)t.set(s.round.id,{round:s.round,token:s.friendlyRound.shareToken,played:!1,created:!0});for(const s of i){const n=t.get(s.round.id);n?n.played=!0:t.set(s.round.id,{round:s.round,token:s.shareToken,played:!0,created:!1})}return[...t.values()].sort((s,n)=>n.round.date.localeCompare(s.round.date)||s.round.id.localeCompare(n.round.id))}class qt{loading=new h(!1);error=new h(null);rounds=new h([]);mine=new h(null);mineLoading=new h(!1);mineError=new h(null);myRounds=new T(()=>{const e=this.mine.get();return e?Gt(e.produced,e.created):[]});async load(){const e=await I(this.loading,this.error,()=>_.friendlyRounds.list());e&&this.rounds.set(e)}async loadMine(){const e=await I(this.mineLoading,this.mineError,()=>_.dashboard.myRounds());e&&this.mine.set(e)}}function At(i){const e=typeof navigator<"u"?navigator.language:void 0;return typeof e=="string"&&e.toLowerCase().startsWith("sv")?"sv":"en"}function Dt(){return At()}class ae{loading=new h(!1);error=new h(null);descriptors=new h([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await I(this.loading,this.error,()=>_.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=Dt()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:s.teamSize?.min??2,max:s.teamSize?.max??2},...s.teamCount?{teamCount:s.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}acceptsSideSubjects(e){const t=this.byId(e);return!t||this.isSideFormat(e)?!1:(t.requirements.scoreEntry?.metadata?.length??0)===0}}function he(i){const e=L.get(ae);return e.load(),e.labelOf(i.formatId)??`${i.scoringMode} · ${i.teamShape}`}const Kt=y(`
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
`),Ut=y(`
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
`),Wt=y(`
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
`),ke={not_started:"Not started",active:"Live",complete:"Done"};class Se extends C{static styles=`
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
                ${k()}
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
                ${z({hover:!0})}

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
    `;svc=this.inject(qt);auth=this.inject(B);router=this.inject(H);render(){this.svc.load();const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.loadMine();const t=this.wire(Kt,{createBtn:{onclick:()=>this.router.navigate("/create")},signin:{className:()=>e()?"landing__signin hidden":"landing__signin",onclick:()=>this.router.navigate("/login")},mySection:{className:()=>e()?"landing__mine":"landing__mine hidden"},myCount:()=>{const s=this.svc.myRounds.get().length;return s===0?"":`${s} on the card`},myEmpty:{className:()=>e()&&this.svc.myRounds.get().length===0&&!this.svc.mineLoading.get()?"landing__empty":"landing__empty hidden"},count:()=>{const s=this.svc.rounds.get().length;return s===0?"":`${s} on the card`},empty:{className:()=>this.svc.rounds.get().length===0?"landing__empty":"landing__empty hidden"}});return this.$each(this.ref(t,"list"),this.svc.rounds,(s,n,r)=>this.wireEl(Ut,{row:{onclick:()=>this.router.navigate("/round",{query:{token:s.friendlyRound.shareToken}})},course:()=>s.round.courseNameSnapshot??"Round",status:{textContent:()=>ke[s.round.status]??s.round.status,className:()=>`round-row__status s-${s.round.status}`},date:()=>s.round.date,formats:()=>s.round.formatSlots.map(he).join(" · ")},r),s=>s.friendlyRound.id),this.$each(this.ref(t,"myList"),this.svc.myRounds,(s,n,r)=>this.wireEl(Wt,{row:{disabled:()=>s.token===null,onclick:()=>{s.token!==null&&this.router.navigate("/round",{query:{token:s.token}})}},course:()=>s.round.courseNameSnapshot??"Round",role:()=>Bt(s),status:{textContent:()=>ke[s.round.status]??s.round.status,className:()=>`round-row__status s-${s.round.status}`},date:()=>s.round.date,formats:()=>s.round.formatSlots.map(he).join(" · ")},r),s=>s.round.id),t}}const Qt=180,Ie=4,Vt=12;function V(i,e){return e<=0?0:Math.max(0,Math.min(e-1,i))}function Xt(i){const{dragDistance:e,velocity:t,itemWidth:s}=i;if(Math.abs(e)<Vt)return 0;const n=e+t*Qt,r=Math.round(-n/s);return Math.max(-Ie,Math.min(Ie,r))}const Te="tapscore:pending-scores:v1",Yt=336*60*60*1e3,Ee=200;function Jt(){try{return globalThis.localStorage??null}catch{return null}}function Zt(i){if(typeof i!="object"||i===null)return!1;const e=i;return typeof e.token=="string"&&typeof e.ballId=="string"&&typeof e.playHoleId=="string"&&(typeof e.strokes=="number"||e.strokes===null)&&(e.eventType==="score_entered"||e.eventType==="score_cleared")&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class es{entries=[];storage;constructor(e=Jt(),t=Date.now()){this.storage=e,this.entries=this.load();const s=this.applyHygiene(t);s.length!==this.entries.length&&(this.entries=s,this.persist())}enqueue(e){const t=this.entries.findIndex(s=>s.token===e.token&&s.ballId===e.ballId&&s.playHoleId===e.playHoleId);t>=0?this.entries[t]=e:this.entries.push(e),this.entries=this.applyHygiene(e.queuedAt),this.persist()}remove(e){const t=this.entries.filter(s=>s.clientEventId!==e);t.length!==this.entries.length&&(this.entries=t,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(s=>e-s.queuedAt<=Yt);return t.length>Ee?t.slice(t.length-Ee):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(Te);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(Zt):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(Te,JSON.stringify(this.entries))}catch{}}}const ts=["1st","2nd","3rd","4th","5th","6th","7th","8th"],K=(i,e)=>`${i}|${e}`;function qe(i){return i.players.map(e=>e.displayName).join(" & ")||i.label||"Ball"}function ss(i,e,t){return i?!(i.minPar!==void 0&&e<i.minPar||i.maxPar!==void 0&&e>i.maxPar||i.pars&&!i.pars.includes(e)||i.holes&&!i.holes.includes(t)):!0}class te{constructor(e=new es){this.queue=e}queue;loading=new h(!1);error=new h(null);friendlyRound=new h(null);round=new h(null);balls=new h([]);scorecards=new h([]);cells=new h(new Map);result=new h(null);resultLoading=new h(!1);resultError=new h(null);resultCursor=null;holeIdx=new h(0);groupIdx=new h(0);selectedSlot=new h(null);token=null;loadSeq=0;resultSeq=0;flushing=!1;pendingSlotIndex=null;async loadByToken(e,t){const s=e!==this.token;this.token=e;const n=++this.loadSeq;s&&this.resetForNewToken(t),L.get(ae).load();const r=await I(this.loading,this.error,()=>_.friendlyRounds.byToken({token:e}));if(!r||n!==this.loadSeq||e!==this.token)return;if(this.friendlyRound.set(r.friendlyRound),this.round.set(r.round),this.pendingSlotIndex!==null){const c=r.round.formatSlots[this.pendingSlotIndex]?.slotDefId??null;this.pendingSlotIndex=null,c!==null&&this.selectedSlot.set(c)}const[o,d]=await Promise.all([_.friendlyRounds.balls({token:e}).catch(()=>[]),_.friendlyRounds.scorecard({token:e}).catch(()=>[])]);n!==this.loadSeq||e!==this.token||(this.cells.set(new Map),this.scorecards.set(d),this.balls.set(o),await this.flushPending())}async loadResult(){const e=this.token;if(!e)return;const t=++this.resultSeq,s=await I(this.resultLoading,this.resultError,()=>_.friendlyRounds.result({token:e}));t!==this.resultSeq||e!==this.token||s&&(this.resultCursor=s.cursor,s.unchanged||this.result.set(s.result))}async pollResult(){const e=this.token;if(!e)return;const t=++this.resultSeq;let s;try{s=await _.friendlyRounds.result({token:e,...this.resultCursor!==null?{cursor:this.resultCursor}:{}})}catch{return}t!==this.resultSeq||e!==this.token||(this.resultCursor=s.cursor,s.unchanged||this.result.set(s.result))}ballNameById=new T(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,qe(t));for(const t of this.result.get()?.slots??[])for(const s of t.subjectLabels??[])e.set(s.ballId,s.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}groupLabelByBallId=new T(()=>{const e=new Map,t=this.groups();return t.length<2||t.forEach((s,n)=>{for(const r of s.ballIds)e.set(r,`Group ${n+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}selectedSlotDefId(){const e=this.round.get()?.formatSlots??[];if(e.length===0)return null;const t=this.selectedSlot.get();return t!==null&&e.some(s=>s.slotDefId===t)?t:e[0]?.slotDefId??null}selectSlot(e){this.selectedSlot.set(e)}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return V(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),s=t?.playHoles.find(o=>o.id===e);if(!t||!s)return"";const n=t.playHoles.filter(o=>o.courseHoleNumber===s.courseHoleNumber).sort((o,d)=>o.ordinal-d.ordinal);if(n.length===1)return`${s.courseHoleNumber}`;const r=n.findIndex(o=>o.id===e);return`${s.courseHoleNumber} (${ts[r]??`${r+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(V(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(V(this.holeIndex()+1,this.playedOrder().length))}strokesFor(e,t){const s=this.cells.get().get(K(e,t));return s?s.strokes:this.scorecards.get().find(o=>o.ballId===e)?.holes.find(o=>o.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(K(e,t))?.status??null}metadataFor(e,t,s){const n=this.cells.get().get(K(e,t));return n&&n.metadata!==void 0?n.metadata?.[s]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[s]}metadataInputs(){const e=L.get(ae),t=this.round.get()?.formatSlots??[],s=[],n=new Set;for(const r of t){const o=e.byId(r.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of o)n.has(d.key)||(n.add(d.key),s.push(d))}return s}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>ss(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,s,n){const r=K(e,t),o=crypto.randomUUID();this.patchCell(r,{strokes:s,metadata:n,status:"saving",clientEventId:o});const d=this.token;d&&(this.enqueue(d,e,t,s,n,o),await this.post(d,e,t,s,n,o))}async retry(e,t){const s=K(e,t),n=this.cells.get().get(s);if(!n)return;this.patchCell(s,{...n,status:"saving"});const r=this.token;r&&(this.enqueue(r,e,t,n.strokes,n.metadata,n.clientEventId),await this.post(r,e,t,n.strokes,n.metadata,n.clientEventId))}async flushPending(){const e=this.token;if(!(!e||this.flushing)){this.flushing=!0;try{for(const t of this.queue.entriesFor(e)){if(e!==this.token)return;this.patchCell(K(t.ballId,t.playHoleId),{strokes:t.strokes,metadata:t.metadata,status:"saving",clientEventId:t.clientEventId}),await this.post(e,t.ballId,t.playHoleId,t.strokes,t.metadata,t.clientEventId)}}finally{this.flushing=!1}}}enqueue(e,t,s,n,r,o){this.queue.enqueue({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:o,...r!==void 0?{metadata:r}:{},queuedAt:Date.now()})}async post(e,t,s,n,r,o){const d=K(t,s);try{await _.friendlyRounds.score({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:o,...r!=null?{metadata:r}:{}}),this.queue.remove(o);const u=this.cells.get().get(d);u&&u.clientEventId===o&&this.patchCell(d,{...u,status:"saved"});const c=this.round.get();e===this.token&&c&&c.status==="not_started"&&this.round.set({...c,status:"active"})}catch{const u=this.cells.get().get(d);u&&u.clientEventId===o&&this.patchCell(d,{...u,status:"error"})}}patchCell(e,t){const s=new Map(this.cells.get());s.set(e,t),this.cells.set(s)}resetForNewToken(e){this.resultSeq++,this.resultCursor=null,this.friendlyRound.set(null),this.round.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(e?.holeIdx??0),this.groupIdx.set(e?.groupIdx??0);const t=e?.selectedSlot;this.pendingSlotIndex=null,typeof t=="string"?this.selectedSlot.set(t):typeof t=="number"?(this.pendingSlotIndex=t,this.selectedSlot.set(null)):this.selectedSlot.set(null)}}const U=60,Ce=8,pe=4,ns=Array.from({length:pe*2+1},(i,e)=>e-pe),rs="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",is=y(`
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
`),os=y(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),as=y(`
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
`),ls=y(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),Pe=y(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),ds=y(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`);class cs extends C{static styles=`
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
            right: ${Ce}px;
            width: ${U*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-pe*U}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${U}px;
            width: ${U}px;
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

            & .se-row__scores { display: flex; align-items: center; padding-right: ${Ce}px; flex-shrink: 0; }
            & .se-row__slot { width: ${U}px; display: flex; align-items: center; justify-content: center; }
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
    `;svc=this.inject(te);holeIdx=this.svc.holeIdx;modalOpen=new h(!1);currentBallIdx=new h(0);extendedOpen=new h(!1);extendedScore=new h(10);statsOpen=new h(!1);pendingMeta=new h({});lastMetaKey=null;toastMsg=new h(null);dragOffset=new h(0);transitioning=new h(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new T(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[V(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(s=>[s.id,s]));return e.ballIds.map(s=>t.get(s)).filter(s=>!!s)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>qe(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);toParValue=e=>{let t=0,s=0,n=!1;for(const r of this.playedOrder()){const o=this.svc.strokesFor(e.id,r.playHoleId);o!==null&&o>0&&(t+=o,s+=this.parFor(r.playHoleId),n=!0)}return n?t-s:null};toParText=e=>{const t=this.toParValue(e);return t===null?"–":t===0?"E":t>0?`+${t}`:`${t}`};toParClass=e=>{const t=this.toParValue(e);return`se-row__topar ${t===null||t===0?"even":t<0?"under":"over"}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const s=e-t;return s<=-4||s>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(s)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer)}),this.track($(()=>{const r=this.ballsInGroup().length;r>0&&this.currentBallIdx.get()>=r&&this.currentBallIdx.set(0)}));const e=this.wire(is,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1)}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const r=this.currentHole();return r?`Hole ${this.occLabel(r.playHoleId)} · Par ${this.parFor(r.playHoleId)}`:""},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>this.statsOpen.set(!1)},statsHole:()=>{const r=this.currentHole();return r?`Hole ${this.occLabel(r.playHoleId)} · Par ${this.parFor(r.playHoleId)}`:""},statsTitle:()=>{const r=this.ballsInGroup()[this.currentBallIdx.get()];return r?this.ballName(r):""},statsScore:()=>{const r=this.ballsInGroup()[this.currentBallIdx.get()],o=this.currentHole();return!r||!o?"":this.displayScore(this.svc.strokesFor(r.id,o.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.advance()}}}),t=this.ref(e,"viewport"),s=this.ref(e,"track");this.bindCarouselPointer(t,s),this.track($(()=>{s.style.transition=this.transitioning.get()?rs:"none",s.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(s,new T(()=>ns),(r,o,d)=>this.holeItem(r,d),r=>r),this.$each(this.ref(e,"rows"),new T(()=>{const r=this.playedOrder(),o=this.holeIndex(),d=r[o];if(!d)return[];const u=o>0?r[o-1].playHoleId:null;return this.ballsInGroup().map(c=>({ball:c,ph:d.playHoleId,prevPh:u}))}),(r,o,d)=>this.playerRow(r.ball,r.ph,r.prevPh,d),r=>`${r.ball.id}|${r.ph}`),this.$each(this.ref(e,"modalList"),new T(()=>this.ballsInGroup()),(r,o,d)=>this.modalRow(r,o,d),r=>r.id);const n=this.ref(e,"keys");for(const r of[1,2,3,4,5,6,7,8,9])n.appendChild(this.numberKey(r));return n.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),n.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),n.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(e,"statsBody"),new T(()=>this.metaInputs()),(r,o,d)=>this.metaChip(r,d),r=>r.key),this.track($(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null;return}const r=this.ballsInGroup()[this.currentBallIdx.get()],o=this.currentHole();if(!r||!o)return;const d=`${r.id}|${o.playHoleId}`;if(d===this.lastMetaKey)return;this.lastMetaKey=d;const u={};for(const c of this.metaInputs())u[c.key]=this.svc.metadataFor(r.id,o.playHoleId,c.key)===!0;this.pendingMeta.set(u)})),e}holeItem(e,t){return this.wireEl(os,{item:{className:()=>{const s=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${s?" gone":""}`}},hnum:{textContent:()=>{const s=this.occAtOffset(e);return s?this.occLabel(s.playHoleId):""}},hpar:{textContent:()=>{const s=this.occAtOffset(e);return s?`Par ${this.parFor(s.playHoleId)}`:""}}},t)}playerRow(e,t,s,n){return this.wireEl(as,{name:{textContent:this.ballName(e)},topar:{textContent:()=>this.toParText(e),className:()=>this.toParClass(e)},prev:{textContent:()=>s?this.displayScore(this.svc.strokesFor(e.id,s)):""},cval:{textContent:()=>this.displayScore(this.svc.strokesFor(e.id,t))},circle:{className:()=>this.svc.strokesFor(e.id,t)===null?"se-row__circle empty":"se-row__circle",onclick:()=>this.openModalForBall(e.id)}},n)}modalRow(e,t,s){const n=e.players.length>1?`Team · CH ${e.courseHandicap}`:`CH ${e.players[0]?.courseHandicap??e.courseHandicap}`;return this.wireEl(ls,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.currentBallIdx.set(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:n},mval:{textContent:()=>{const r=this.currentHole();return r?this.displayScore(this.svc.strokesFor(e.id,r.playHoleId)):"–"}}},s)}numberKey(e){return this.wireEl(Pe,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,s,n){return this.wireEl(Pe,{key:{className:s,onclick:n},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(s=>s.id===e);this.currentBallIdx.set(t<0?0:t),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.modalOpen.set(!0)}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){const t=this.ballsInGroup(),s=this.currentHole(),n=t[this.currentBallIdx.get()];if(!s||!n)return;const r=e===null?void 0:this.metaSnapshot();this.svc.setScore(n.id,s.playHoleId,e,r),e!==null&&e>0&&this.metaInputs().length>0?this.statsOpen.set(!0):this.advance()}hasMoreUnscored=()=>{const e=this.ballsInGroup(),t=this.currentHole();if(!t)return!1;const s=this.currentBallIdx.get();return e.some((n,r)=>r!==s&&this.svc.strokesFor(n.id,t.playHoleId)===null)};metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),s={};for(const n of e)s[n.key]=t[n.key]===!0;return s}setMeta(e,t){const s=this.pendingMeta.get();this.pendingMeta.set({...s,[e]:t});const n=this.ballsInGroup()[this.currentBallIdx.get()],r=this.currentHole();if(!n||!r)return;const o=this.svc.strokesFor(n.id,r.playHoleId);o!==null&&this.svc.setScore(n.id,r.playHoleId,o,this.metaSnapshot())}metaChip(e,t){return this.wireEl(ds,{glabel:{textContent:e.label},miss:{className:()=>this.pendingMeta.get()[e.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(e.key,!1)},hit:{className:()=>this.pendingMeta.get()[e.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(e.key,!0)}},t)}advance(){const e=this.ballsInGroup(),t=this.currentHole();if(!t)return;const s=u=>this.svc.strokesFor(e[u].id,t.playHoleId)!==null,n=this.currentBallIdx.get();for(let u=n+1;u<e.length;u++)if(!s(u))return this.currentBallIdx.set(u);for(let u=0;u<n;u++)if(!s(u))return this.currentBallIdx.set(u);const r=this.playedOrder();if(this.holeIndex()>=r.length-1){this.flash("Round complete"),this.modalOpen.set(!1);return}this.flash(`Hole ${this.occLabel(t.playHoleId)} done`);const d=t.playHoleId;this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===d&&(this.holeIdx.set(V(this.holeIndex()+1,this.playedOrder().length)),this.currentBallIdx.set(0))},700)}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*U),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(V(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",n=>{n.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",n=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:n.pointerId,startX:n.clientX,startY:n.clientY,lastX:n.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(n.pointerId))}),e.addEventListener("pointermove",n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const o=n.clientX-r.startX,d=n.clientY-r.startY;if(!r.horiz){if(Math.abs(d)>Math.abs(o)&&Math.abs(d)>8||Math.abs(o)<=8)return;r.horiz=!0}const u=Date.now(),c=Math.max(1,u-r.lastTime);r.velocity=(n.clientX-r.lastX)/c,r.lastX=n.clientX,r.lastTime=u,this.dragOffset.set(o)});const s=n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const o=n.clientX-r.startX,d=r.horiz;if(this.ptr=null,e.releasePointerCapture?.(n.pointerId),!d){this.dragOffset.set(0);return}this.snap(Xt({dragDistance:o,velocity:r.velocity,itemWidth:U}))};e.addEventListener("pointerup",s),e.addEventListener("pointercancel",n=>{!this.ptr||this.ptr.id!==n.pointerId||(this.ptr=null,e.releasePointerCapture?.(n.pointerId),this.snap(0))})}}const Ae=()=>null;function x(i){return String(i).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function us(i,e){const t=[...i].sort((r,o)=>r.canonicalOrdinal-o.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(r=>r.playHoleId))}];const s=[...e].sort((r,o)=>r.fromCanonicalOrdinal-o.fromCanonicalOrdinal),n=[];for(const r of s){const o=t.filter(d=>d.canonicalOrdinal>=r.fromCanonicalOrdinal&&d.canonicalOrdinal<=r.toCanonicalOrdinal);o.length!==0&&n.push({label:r.label,holes:o,playHoleIds:new Set(o.map(d=>d.playHoleId))})}return n}function hs(i){return i.kind==="si"?"lb-c-si":i.kind==="given"?"lb-c-given":i.kind==="status"?"lb-c-status":i.kind==="category"?"lb-c-cat":""}function ps(i){const e=[i.kind==="category"?"lb-r-cat":`lb-r-${i.kind}`];return(i.kind==="si"||i.kind==="given")&&e.push("lb-r-dim"),i.team&&e.push(`lb-team-${i.team}`),e.join(" ")}function ms(i){return i&&i.marker?i.marker.template:null}function fs(i){const e=i?.marker?.tone;return e==="success"||e==="warning"||e==="danger"?` lb-mark-tone--${e}`:""}function gs(i,e){const t=i.cells.filter(s=>e.has(s.playHoleId));if(i.aggregate==="sum"){const s=t.map(n=>n.value).filter(n=>n!==null);return s.length===0?"—":String(s.reduce((n,r)=>n+r,0))}if(i.aggregate==="last"){for(let s=t.length-1;s>=0;s--){const n=t[s].value;if(n!==null)return Number.isInteger(n)?String(n):n.toFixed(1)}return"—"}return"—"}function bs(i){return i.filter(e=>!(e.startsWith("slot #")||/^CH -?\d/.test(e)||/^PH -?\d/.test(e)))}function me(i,e,t,s){const n=us(i.holes,e),r=v=>{const O=`<tr><th class="lb-rowlabel">Hole</th>${v.holes.map(S=>`<th>${x(S.occurrenceLabel)}</th>`).join("")}<th class="lb-sum">${x(v.label)}</th></tr>`,R=i.rows.map(S=>{const j=new Map(S.cells.map(D=>[D.playHoleId,D])),G=D=>S.emphasis?`<strong>${D}</strong>`:D,Ve=v.holes.map(D=>{const q=j.get(D.playHoleId),Je=q?.title?` title="${x(q.title)}"`:"",le=G(x(q?.display??"")),be=ms(q),Ze=fs(q),de=q?.marker?.label,et=de?` title="${x(de)}" aria-label="${x(de)}"`:"";let ye=be?`<span class="lb-mark lb-mark--${be}${Ze}"${et}>${le}</span>`:le;return q?.team&&(ye=`<span class="lb-pill lb-pill--${q.team}">${le}</span>`),`<td class="${hs(S)}"${Je}>${ye}</td>`}).join(""),Xe=`<td class="lb-sum">${G(gs(S,v.playHoleIds))}</td>`,Ye=S.subjectBallId?x(t(S.subjectBallId))+(S.label?" "+x(S.label):""):x(S.label);return`<tr class="${ps(S)}"><th class="lb-rowlabel">${Ye}</th>${Ve}${Xe}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${O}</thead><tbody>${R}</tbody></table></div>`},o=n.map(v=>r(v)).join(""),d=i.title.groups.map(v=>v.map(O=>x(t(O))).join(" & ")).filter(Boolean).join(i.title.joiner),u=s.mode==="verification"?i.subtitleFacts:bs(i.subtitleFacts),c=u.length?`<div class="lb-card__sub">${u.map(x).join(" · ")}</div>`:"",m=s.mode==="verification"&&i.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${i.footnotes.map(v=>`<span class="lb-card__note">${x(v)}</span>`).join("")}</div>`:"",p=s.mode==="verification"&&i.caption?`<p class="lb-card__caption">${x(i.caption)}</p>`:"",g=i.totals.length?`<ul class="lb-card__totals">${i.totals.map(v=>`<li>${x(v.label)} = <strong>${v.value??"—"}</strong></li>`).join("")}</ul>`:"",w=d?`<header class="lb-card__head"><h4>${d}</h4>${c}</header>`:c;return`<article class="${s.cardModifier?`lb-card ${s.cardModifier}`:"lb-card"}">
  ${w}
  ${o}
  ${m}${p}${g}
</article>`}function ys(i,e,t,s){return me(i,e,t,s)}function _s(i,e,t,s){return me(i,e,t,{...s,cardModifier:"lb-card--compact-match"})}function vs(i,e,t,s){return me(i,e,t,{...s,cardModifier:"lb-card--category-matrix"})}function xs(i,e){const t=new Set(i.map(e));return t.size!==1?null:[...t][0]??null}function ws(i){if(i===void 0)return"";const e=i===0?"E":i>0?`+${i}`:`−${Math.abs(i)}`;return` <span class="lb-rank__pace lb-rank__pace--${i===0?"even":i>0?"over":"under"}">${x(e)}</span>`}function $s(i,e,t=Ae){const s=i.entries.map(n=>{const r=xs(n.ballIds,t),o=r?` <span class="lb-rank__group">${x(r)}</span>`:"";return`<tr class="${n.position===1?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${n.position}</td>
  <td class="lb-rank__who">${x(n.ballIds.map(e).join(" & "))}${o}</td>
  <td class="lb-rank__total">${n.total??"—"}${ws(n.paceDelta)}</td>
  <td class="lb-rank__thru">${n.holesPlayed}</td>
</tr>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${x(i.metricLabel)}</h4>
  <table class="lb-rank">
    <colgroup>
      <col class="lb-rank__col-pos">
      <col class="lb-rank__col-who">
      <col class="lb-rank__col-total">
      <col class="lb-rank__col-thru">
    </colgroup>
    <thead><tr><th class="lb-rank__pos">#</th><th class="lb-rank__who">Player</th><th class="lb-rank__total">Total</th><th class="lb-rank__thru">Thru</th></tr></thead>
    <tbody>${s}</tbody>
  </table>
</div>`}function ks(i,e){const t=i.matches.map(s=>{const n=x(s.sideA.ballIds.map(e).join(" & ")),r=x(s.sideB.ballIds.map(e).join(" & ")),o=s.magnitude===0?"AS":`${s.magnitude} UP`,d=s.finished?"Final":`thru ${s.thru}`,u=s.leader==="a"?" lb-mp__team--lead":"",c=s.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${u}">${n}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${x(o)}</span><span class="lb-mp__status">${x(d)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${c}">${r}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${x(i.title)}</h4>${t}
</div>`}const Ss={ranked:$s,match_summary:(i,e)=>ks(i,e)},Is={"default-score-grid":ys,"compact-match-grid":_s,"category-matrix-grid":vs};function Ts(i){return i.componentId??"default-score-grid"}function Es(i){return`<div class="lb-diag">Unrenderable result section <code>${x(i)}</code> — no generic view yet. Results are not hidden.</div>`}function Cs(i){return`<div class="lb-diag">Unsupported score-grid component <code>${x(i)}</code> — no generic view yet. Results are not hidden.</div>`}function Ps(i,e,t){const s=Ss[i.kind];return s?s(i,e,t):Es(i.kind)}function js(i,e,t,s){const n=Ts(i),r=Is[n];return r?r(i,e,t,s):Cs(n)}function Ns(i,e,t=Ae){return i.leaderboard.length===0&&i.cards.length===0?`<div class="lb-empty">No scores entered yet for ${x(i.formatLabel)}.</div>`:i.leaderboard.map(n=>Ps(n,e,t)).join("")||`<div class="lb-empty">No leaderboard metric for ${x(i.formatLabel)}.</div>`}function zs(i,e,t,s={}){if(i.cards.length===0)return"";const n=s.mode??"product";return i.cards.map(r=>js(r,e,t,{mode:n})).join(`
`)}const Os=y(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class Hs extends C{static styles=`
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
                ${z()}
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
            /* Phase 3.5: group tag next to a player's name — only rendered when
               the round has 2+ playing groups (single-group rounds get nothing,
               same look as before this phase). */
            & .lb-rank__group {
                font-size: 0.7rem;
                font-weight: 600;
                color: ${l("text-muted")};
                margin-left: ${a("xs")};
            }
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
                ${z()}
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
    `;svc=this.inject(te);slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots(),t=this.svc.selectedSlotDefId();return e.find(s=>s.slotDefId===t)??e[0]??null};render(){return this.wire(Os,{status:{className:()=>{const t=this.svc.resultLoading.get(),s=this.svc.result.get()===null;return t||s?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody()}})}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const s=u=>this.svc.nameOf(u),r=Ns(t,s,u=>this.svc.groupLabelOf(u)),o=zs(t,e.routeSections,s),d=o?`<h3 class="lb-cards__head">Scorecard</h3>${o}`:"";return r+d}}function Ms(i,e){if(!e)return[];const t=[],s=new Set;for(const n of i)for(const r of n.players){if(r.playerId===e)return[];r.guestPlayerId===null||s.has(r.guestPlayerId)||(s.add(r.guestPlayerId),t.push({guestPlayerId:r.guestPlayerId,displayName:r.displayName}))}return t}const Rs=y(`
    <div bind="root" class="claim-card hidden">
        <span class="claim-card__label">Played here as a guest?</span>
        <p class="claim-card__hint">Claim your scores — the round lands on your profile's card.</p>
        <div bind="rows" class="claim-card__rows"></div>
        <p bind="err" class="claim-card__err"></p>
    </div>
`),Fs=y(`
    <div class="claim-card__row">
        <span bind="name" class="claim-card__name"></span>
        <button bind="claim" class="claim-card__btn" type="button">This is me</button>
    </div>
`);class Ls extends C{static styles=`
        .claim-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${z()}
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
                ${k()}
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
    `;svc=this.inject(te);auth=this.inject(B);router=this.inject(H);tokenQ=this.router.query("token");claiming=new h(!1);error=new h("");claimable(){return Ms(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async claim(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.claiming.set(!0);try{await _.friendlyRounds.claimGuest({token:t,guestPlayerId:e}),await this.svc.loadByToken(t)}catch(s){this.error.set(s instanceof M&&s.status===409?"Already claimed — or you already play in this round under your account.":s instanceof M&&s.status===404?"That guest is no longer claimable on this round.":"Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}render(){const e=this.wire(Rs,{root:{className:()=>this.claimable().length>0?"claim-card":"claim-card hidden"},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.claimable(),(t,s,n)=>this.wireEl(Fs,{name:()=>t.displayName,claim:{disabled:()=>this.claiming.get(),onclick:()=>{this.claim(t.guestPlayerId)}}},n),t=>t.guestPlayerId),e}}function W(i){return typeof i=="object"&&i!==null&&typeof i.get=="function"}const E=i=>`var(--${i})`,ge=class ge extends C{constructor(){super(...arguments),this.open=new h(!1),this.highlightIndex=new h(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const s=document.createElement("span");s.className="ui-select__trigger-label",this.triggerEl.appendChild(s);const n=document.createElement("span");n.className="ui-select__chevron",n.textContent="▾",n.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(n),this.triggerEl.addEventListener("click",o=>{o.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",o=>{this.handleTriggerKeydown(o)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.setAttribute("role","listbox"),this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",o=>{this.handleDropdownKeydown(o)}),e.appendChild(this.dropdownEl);const r=o=>{this.optionEls=[],this.dropdownEl.textContent="";for(let d=0;d<o.length;d++){const u=o[d],c=document.createElement("button");if(c.className="ui-select__option",c.setAttribute("type","button"),c.id=`ui-select-opt-${d}`,u.disabled){c.classList.add("ui-select__option--header"),c.disabled=!0,c.setAttribute("role","presentation"),c.setAttribute("aria-disabled","true");const g=document.createElement("span");g.className="ui-select__option-label",g.textContent=u.label,c.appendChild(g),this.dropdownEl.appendChild(c),this.optionEls.push(c);continue}if(c.setAttribute("role","option"),u.icon){const g=document.createElement("span");g.className="ui-select__option-icon",g.textContent=u.icon,c.appendChild(g)}const m=document.createElement("span");m.className="ui-select__option-label",m.textContent=u.label,c.appendChild(m);const p=document.createElement("span");p.className="ui-select__check",p.setAttribute("aria-hidden","true"),c.appendChild(p),c.addEventListener("click",g=>{g.stopPropagation(),this.selectOption(u.value)}),c.addEventListener("mouseenter",()=>{this.highlightIndex.set(d)}),this.dropdownEl.appendChild(c),this.optionEls.push(c)}};return W(this.props.options)?this.track($(()=>{const o=W(this.props.options)?this.props.options.get():this.props.options;r(o)})):r(this.props.options),this.track($(()=>{const o=this.props.value.get(),d=W(this.props.options)?this.props.options.get():this.props.options,u=d.find(c=>c.value===o);u?(s.textContent=u.icon?`${u.icon} ${u.label}`:u.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder")):(s.textContent=this.props.placeholder??"",this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!this.props.placeholder));for(let c=0;c<d.length;c++){const m=this.optionEls[c];if(!m)continue;const p=d[c].value===o;m.setAttribute("aria-selected",String(p)),m.classList.toggle("ui-select__option--selected",p);const g=m.querySelector(".ui-select__check");g&&(g.textContent=p?"✓":"")}})),this.track($(()=>{const o=this.open.get();if(this.dropdownEl.classList.toggle("open",o),n.classList.toggle("ui-select__chevron--open",o),this.triggerEl.setAttribute("aria-expanded",String(o)),o?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),o){const d=W(this.props.options)?this.props.options.get():this.props.options,u=this.props.value.get(),c=d.findIndex(p=>p.value===u),m=d.findIndex(p=>!p.disabled);this.highlightIndex.set(c>=0?c:m)}})),this.track($(()=>{const o=this.highlightIndex.get();for(let d=0;d<this.optionEls.length;d++)this.optionEls[d].classList.toggle("ui-select__option--highlighted",d===o);o>=0&&this.optionEls[o]&&(this.triggerEl.setAttribute("aria-activedescendant",`ui-select-opt-${o}`),this.optionEls[o].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(W(this.props.disabled)?this.track($(()=>{const o=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",o),this.triggerEl.disabled=o})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}selectOption(e){Z(()=>{this.props.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.toggle();break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":{e.preventDefault();const t=this.highlightIndex.get(),s=W(this.props.options)?this.props.options.get():this.props.options;t>=0&&t<s.length&&!s[t].disabled&&this.selectOption(s[t].value);break}case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=W(this.props.options)?this.props.options.get():this.props.options;if(t.length===0||!t.some(n=>!n.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};ge.styles=`
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
            border: 1px solid ${E("border")};
            border-radius: ${E("radius")};
            background: ${E("input-bg")};
            color: ${E("text")};
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
        }
        .ui-select__trigger:focus-visible {
            outline: 2px solid ${E("primary")};
            outline-offset: 1px;
        }
        .ui-select__trigger--placeholder {
            color: ${E("text-muted")};
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
            color: ${E("text-muted")};
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
            background: ${E("surface")};
            border: 1px solid ${E("border")};
            border-radius: ${E("radius")};
            box-shadow: ${E("shadow-elevated")};
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
            color: ${E("text")};
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
            background: ${E("hover-bg")};
        }
        .ui-select__option--selected {
            color: ${E("primary")};
            font-weight: 600;
        }
        .ui-select__option--header {
            cursor: default;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${E("text-muted")};
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
            color: ${E("primary")};
        }
    `;let ee=ge;function Bs(i,e,t){if(!e||t!=="not_started")return!1;for(const s of i)for(const n of s.players)if(n.playerId===e)return!1;return!0}const je="new";function Gs(i){const e=i.map((s,n)=>{const r=s.ballIds.length,o=[`Group ${n+1}`];return s.startTime.includes(":")&&o.push(s.startTime),{value:s.id,label:`${o.join(" · ")} — ${r} of ${s.capacity}`,disabled:r>=s.capacity}}),t=e.find(s=>!s.disabled);return e.push({value:je,label:"Start a new group",disabled:!1}),{options:e,defaultValue:t?.value??je}}const qs=y(`
    <div bind="root" class="join-card hidden">
        <span class="join-card__label">Playing this round?</span>
        <p class="join-card__hint">Add yourself with your own tee — this creates your own scorecard.</p>
        <div bind="groupRow" class="join-card__group hidden">
            <label class="join-card__group-label">Group</label>
            <div bind="groupHost" class="join-card__group-select"></div>
        </div>
        <div class="join-card__row">
            <div bind="teeHost" class="join-card__tee"></div>
            <button bind="join" class="join-card__btn" type="button">Add me</button>
        </div>
        <p bind="diag" class="join-card__diag"></p>
        <p bind="err" class="join-card__err"></p>
    </div>
`);class As extends C{static styles=`
        .join-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${z()}
            background: ${l("surface-sunken")};

            &.hidden { display: none; }

            & .join-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${l("text-muted")};
            }
            & .join-card__hint {
                margin: ${a("sm")} 0 0;
                font-size: 0.8rem;
                color: ${l("text-muted")};
            }
            & .join-card__group {
                margin-top: ${a("md")};
                &.hidden { display: none; }
            }
            & .join-card__group-label {
                display: block;
                font-size: 0.8rem;
                color: ${l("text-muted")};
                margin-bottom: ${a("xs")};
            }
            & .join-card__row {
                display: flex;
                align-items: center;
                gap: ${a("md")};
                margin-top: ${a("md")};
            }
            & .join-card__tee { flex: 1; }
            & .join-card__btn {
                ${k()}
                padding: ${a("sm")} ${a("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${l("primary")};
                color: ${l("primary-text")};
                border: none;
                flex-shrink: 0;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .join-card__diag {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${l("text-muted")};
                &:empty { display: none; }
                & a { color: ${l("accent")}; font-weight: 600; }
            }
            & .join-card__err {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${l("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(te);auth=this.inject(B);router=this.inject(H);tokenQ=this.router.query("token");joining=new h(!1);error=new h("");diagnostics=new h([]);teeId=new h("");tees=new h([]);loadedForCourseId=null;groupChoice=new h("");eligible(){return Bs(this.svc.balls.get(),this.auth.currentUser.get()?.id??null,this.svc.round.get()?.status??null)}ensureTeesLoaded(){if(!this.eligible())return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,_.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}diagnosticMessage(e){return e.code==="missing_gender"||e.code==="missing_handicap_index"?`${e.message} — <a data-nav="/profile">update your profile</a>.`:e.message}async join(){const e=this.tokenQ.get(),t=this.teeId.get();if(!(!e||!t||this.joining.get())){this.error.set(""),this.diagnostics.set([]),this.joining.set(!0);try{const s=this.groupChoice.get(),n=await _.friendlyRounds.join({token:e,teeId:t,...s?{groupChoice:s}:{}});n.ok?await this.svc.loadByToken(e):this.diagnostics.set(n.diagnostics)}catch(s){this.error.set(s instanceof M&&s.status===409?s.message??"You already play in this round, or it has already started.":"Could not join right now. Try again.")}finally{this.joining.set(!1)}}}render(){this.track($(()=>this.ensureTeesLoaded()));const e=new T(()=>Gs(this.svc.groups()));this.track($(()=>{const r=e.get(),o=this.groupChoice.get();(!o||!r.options.some(d=>d.value===o&&!d.disabled))&&this.groupChoice.set(r.defaultValue)}));const t=this.wire(qs,{root:{className:()=>this.eligible()?"join-card":"join-card hidden"},groupRow:{className:()=>this.svc.groups().length>0?"join-card__group":"join-card__group hidden"},join:{disabled:()=>this.joining.get()||!this.teeId.get(),onclick:()=>{this.join()}},diag:{innerHTML:()=>this.diagnostics.get().map(r=>this.diagnosticMessage(r)).join(" · "),onclick:r=>{const d=r.target.closest("[data-nav]")?.getAttribute("data-nav");d&&(r.preventDefault(),this.router.navigate(d))}},err:{textContent:()=>this.error.get()}}),s=new ee({value:this.teeId,options:{get:()=>this.tees.get().map(r=>({value:r.id,label:r.name}))},placeholder:"Tee"});s.mount(this.ref(t,"teeHost")),this.track(()=>s.destroy());const n=new ee({value:this.groupChoice,options:{get:()=>e.get().options},placeholder:"Group"});return n.mount(this.ref(t,"groupHost")),this.track(()=>n.destroy()),t}}const Ds=y(`
    <div bind="root" class="edit-card hidden">
        <div class="edit-card__text">
            <span class="edit-card__label">Round setup</span>
            <p class="edit-card__hint">Change tees, add a format, adjust groups — scored balls are preserved.</p>
        </div>
        <button bind="edit" class="edit-card__btn" type="button">Edit round</button>
    </div>
`);class Ks extends C{static styles=`
        .edit-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${z()}
            background: ${l("surface-sunken")};
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${a("md")};

            &.hidden { display: none; }

            & .edit-card__text { min-width: 0; }
            & .edit-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${l("text-muted")};
            }
            & .edit-card__hint {
                margin: ${a("xs")} 0 0;
                font-size: 0.8rem;
                color: ${l("text-muted")};
            }
            & .edit-card__btn {
                ${k()}
                flex-shrink: 0;
                padding: ${a("sm")} ${a("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${l("primary")};
                color: ${l("primary-text")};
                border: none;
            }
        }
    `;router=this.inject(H);tokenQ=this.router.query("token");editable=new h(!1);render(){const e=this.tokenQ.get();return e&&_.friendlyRounds.setup({token:e}).then(t=>this.editable.set(t.editable===!0)).catch(()=>this.editable.set(!1)),this.wire(Ds,{root:{className:()=>this.editable.get()?"edit-card":"edit-card hidden"},edit:{onclick:()=>{const t=this.tokenQ.get();t&&this.router.navigate("/create",{query:{token:t}})}}})}}function Us(i){return!(i.tab!=="leaderboard"||!i.pageVisible||i.status==="complete")}const Ws=2e4;function Qs(i){if(!(i===null||i===""))return/^\d+$/.test(i)?Number(i):i}const Vs=y(`
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
                    <div bind="groupTabs" class="round-view__groups hidden"></div>
                    <div bind="scoring"></div>

                    <div class="round-view__share">
                        <span class="round-view__share-label">Share this round</span>
                        <div class="round-view__share-row">
                            <input bind="shareUrl" class="round-view__share-url" readonly />
                            <button bind="copy" class="round-view__copy" type="button">Copy</button>
                        </div>
                        <p class="round-view__share-hint">Anyone with this link can open and score — no sign-in.</p>
                    </div>

                    <div bind="edit"></div>
                    <div bind="claim"></div>
                    <div bind="join"></div>
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
`),Xs=y('<button bind="pill" class="round-view__fmt" type="button"></button>'),Ys=y('<button bind="pill" class="round-view__grp" type="button"></button>');class Js extends C{static styles=`
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

            /* Playing-group selector (Phase 3.5) — shown only when the round
               has 2+ groups; scopes the score carousel to one group's balls
               and its rotated itinerary. */
            & .round-view__groups {
                margin-top: ${a("md")};
                display: flex;
                gap: ${a("sm")};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: ${a("xs")};
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }
                &.hidden { display: none; }

                & .round-view__grp {
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
                    font-variant-numeric: tabular-nums;
                    &.active { background: ${l("accent")}; color: ${l("primary-text")}; border-color: ${l("accent")}; }
                }
            }

            & .round-view__share {
                margin-top: ${a("2xl")};
                padding: ${a("lg")};
                ${z()}
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
                    ${F()}
                    font-size: 0.8rem;
                    color: ${l("text-muted")};
                }
                & .round-view__copy {
                    ${k()}
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
    `;svc=this.inject(te);router=this.inject(H);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new h(this.initPos.tab);pageVisible=new h(!document.hidden);hasRound=new T(()=>this.svc.round.get()!==null);hasScoring=new T(()=>this.svc.balls.get().length>0);shareUrl=new T(()=>{const e=this.tokenQ.get();return e?`${location.origin}/round?token=${e}`:""});render(){this.track($(()=>{const o=this.tokenQ.get();o&&this.svc.loadByToken(o,this.initPos).then(()=>{this.tab.get()==="leaderboard"&&this.svc.loadResult()})}));const e=()=>{this.svc.flushPending()};window.addEventListener("online",e),this.track(()=>window.removeEventListener("online",e));const t=()=>this.pageVisible.set(!document.hidden);document.addEventListener("visibilitychange",t),this.track(()=>document.removeEventListener("visibilitychange",t));let s=null;this.track($(()=>{const o=Us({tab:this.tab.get(),pageVisible:this.pageVisible.get(),status:this.svc.round.get()?.status??null});o&&s===null?s=setInterval(()=>{this.svc.pollResult()},Ws):!o&&s!==null&&(clearInterval(s),s=null)})),this.track(()=>{s!==null&&clearInterval(s)}),this.track($(()=>{const o=this.tab.get(),d=this.svc.selectedSlotDefId(),u=this.svc.holeIdx.get();if(this.router.route.get()!=="/round"||!this.hasRound.get())return;const c={token:this.tokenQ.get()};o==="leaderboard"&&(c.tab="board");const m=this.svc.round.get()?.formatSlots[0]?.slotDefId??null;d&&d!==m&&(c.slot=d),u>0&&(c.hole=u+1),this.router.navigate(this.router.route.get(),{replace:!0,query:c})}));const n={not_started:"Not started",active:"Live",complete:"Done"},r=this.wire(Vs,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},course:()=>this.svc.round.get()?.courseNameSnapshot??"Round",status:()=>{const o=this.svc.round.get()?.status??"not_started";return n[o]??o},date:()=>this.svc.round.get()?.date??"",route:()=>{const o=this.svc.round.get();return o?`${o.playHoles.length} holes`:""},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},groupTabs:{className:()=>this.svc.groups().length>1?"round-view__groups":"round-view__groups hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},dock:{className:()=>this.hasRound.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const o=this.svc.currentPlayedHole();return o?this.svc.occLabel(o.playHoleId):""},holeSi:()=>{const o=this.svc.currentPlayHole()?.baseStrokeIndex;return o!=null?String(o):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});return this.$each(this.ref(r,"groupTabs"),new T(()=>this.svc.groups()),(o,d,u)=>this.groupPill(d,u),o=>o.id),this.$each(this.ref(r,"formats"),new T(()=>this.svc.round.get()?.formatSlots??[]),(o,d,u)=>this.slotPill(o,d,u),o=>o.slotDefId),this.spawn(cs,this.ref(r,"scoring")),this.spawn(Hs,this.ref(r,"leaderboard")),this.spawn(Ks,this.ref(r,"edit")),this.spawn(Ls,this.ref(r,"claim")),this.spawn(As,this.ref(r,"join")),r}readUrlPosition(){const e=new URLSearchParams(location.search),t=e.get("slot"),s=Number(e.get("hole"));return{tab:e.get("tab")==="board"?"leaderboard":"score",selectedSlot:Qs(t),holeIdx:Number.isFinite(s)&&s>0?s-1:0}}groupPill(e,t){return this.wireEl(Ys,{pill:{textContent:()=>{const s=this.svc.groups()[e];if(!s)return`Group ${e+1}`;const n=[`Group ${e+1}`];s.startTime.includes(":")&&n.push(s.startTime);const r=this.svc.playHoleById(s.startPlayHoleId)?.courseHoleNumber;return r!==void 0&&s.startOrdinal!==1&&n.push(`H${r}`),n.join(" · ")},className:()=>this.svc.groupIdx.get()===e?"round-view__grp active":"round-view__grp",onclick:()=>this.svc.groupIdx.set(e)}},t)}slotPill(e,t,s){return this.wireEl(Xs,{pill:{textContent:()=>he(e),className:()=>this.tab.get()==="leaderboard"&&this.svc.selectedSlotDefId()===e.slotDefId?"round-view__fmt active":"round-view__fmt",onclick:()=>{this.svc.selectSlot(e.slotDefId),this.tab.get()!=="leaderboard"&&(this.tab.set("leaderboard"),this.svc.loadResult())}}},s)}}function De(i){return i.handicapIndex*(i.slope/113)+(i.courseRating-i.par)}function Zs(i){return Math.round(De(i))}function en(i){if(!i)return null;const e=/^slots\[slot-(\d+)\]/.exec(i);return e?Number(e[1]):null}function tn(i){if(!i)return null;const e=/^formats\[(\d+)\]/.exec(i);return e?Number(e[1]):null}function Ke(i){return tn(i.path)??en(i.path)}function sn(i,e){return i.filter(t=>Ke(t)===e)}function nn(i){return i.filter(e=>!e.path?.startsWith("producers")&&!e.path?.startsWith("playingGroups")&&e.path!=="route"&&Ke(e)===null)}function X(i){return`${i} ${i===1?"player":"players"}`}function ne(i,e){const t=i.formatId?e(i.formatId)??i.formatId:null,s=i.teamLabel;switch(i.code){case"team_size_above_max":if(t&&s&&i.actual!==void 0&&i.allowedMax!==void 0)return`${s} has ${X(i.actual)} — ${t} allows at most ${i.allowedMax} per team.`;break;case"team_size_below_min":if(t&&s&&i.actual!==void 0&&i.allowedMin!==void 0)return`${s} has ${X(i.actual)} — ${t} needs at least ${i.allowedMin} per team.`;break;case"empty_team_grouping":if(t&&s)return`${s} has no players — add at least one, or remove the team.`;break;case"team_count_above_max":if(t&&i.actual!==void 0&&i.allowedMax!==void 0)return`${i.actual} teams — ${t} allows at most ${i.allowedMax}.`;break;case"team_count_below_min":if(t&&i.actual!==void 0&&i.allowedMin!==void 0)return`${i.actual} teams — ${t} needs at least ${i.allowedMin}.`;break;case"slot_ball_count_above_max":if(t&&i.actual!==void 0&&i.allowedMax!==void 0)return`${X(i.actual)} in ${t} — it scores at most ${i.allowedMax}.`;break;case"slot_ball_count_below_min":if(t&&i.actual!==void 0&&i.allowedMin!==void 0)return`${X(i.actual)} in ${t} — it needs at least ${i.allowedMin}.`;break;case"slot_ball_count_not_multiple":if(t&&i.actual!==void 0)return`${t} pairs its balls, so it needs an even number — ${X(i.actual)} won't pair up.`;break;case"missing_team_grouping":if(t)return`${t} needs its players grouped into teams — tick the teams it scores.`;break;case"producer_has_scores":return i.message;case"scored_ball_orphaned":return i.message;case"edit_locked_course_route":return"Scores have already been recorded — the course and route are locked for this round.";case"round_complete":return"This round is complete — its setup can no longer be edited.";case"not_editable":return"This round can no longer be edited."}return i.message}function rn(i){return i?i.type==="flat"?String(i.pct):i.bands.length>0?String(i.bands[0].pct):"100":"100"}function on(i){const e=i.roundType;if(e==="full_18"||e==="front_9"||e==="back_9")return{preset:e,startHole:an(i)};const t=(i.route?.playHoles??[]).map(o=>o.courseHoleNumber),s=t[0]??1,n=new Set(t);return{preset:t.length<=9&&[...n].every(o=>o<=9)?"front_9":t.length<=9&&[...n].every(o=>o>=10)?"back_9":"full_18",startHole:s}}function an(i){return i.roundType==="back_9"?10:1}function ln(i,e=()=>""){let t=1,s=1,n=1,r=1;const o=new Map,d=i.producers.map(b=>{const v=t++;o.set(b.producerDefId,v);const O=b.playerRef.kind==="guest";return{key:v,name:e(b.producerDefId),handicapIndex:String(b.handicapIndex),gender:b.gender??"M",teeId:b.teeId,producerDefId:b.producerDefId,...O?{guestPlayerId:b.playerRef.id}:{playerId:b.playerRef.id,genderKnown:b.gender!=null}}}),u=new Map;(i.teams??[]).forEach(b=>{u.set(b.id,s++)});const c=(i.teams??[]).map(b=>{const v=u.get(b.id),O={},R={};for(const S of b.members)if("producerDefId"in S){const j=o.get(S.producerDefId);j!==void 0&&(O[j]=String(S.allowancePct))}else{const j=u.get(S.teamId);j!==void 0&&(R[j]=!0)}return{key:v,kind:b.kind??"single_ball",formation:b.formation??"scramble",pctByPlayer:O,memberTeams:R}}),m=(i.playingGroups??[]).map(b=>{const v={};for(const O of b.members){const R=o.get(O);R!==void 0&&(v[R]=!0)}return{key:n++,startTime:b.startTime??"",startHole:b.startHole??null,members:v}}),p=i.formats.map(b=>{const v={},O={},R=b.subjects;if(R){const S=new Set;for(const j of R)if(j.kind==="player"){const G=o.get(j.producerDefId);G!==void 0&&S.add(G)}else{const G=u.get(j.teamId);G!==void 0&&(O[G]=!0)}for(const j of d)v[j.key]=S.has(j.key)}return{key:r++,formatId:b.formatId,allowancePct:rn(b.allowanceConfig),subjectPlayers:v,subjectTeams:O}}),{preset:g,startHole:w}=on(i);return{courseId:i.courseId,preset:g,startHole:w,players:d,teams:c,groups:m,formatSlots:p,nextKey:t,nextTeamKey:s,nextGroupKey:n,nextSlotKey:r}}const dn=["scramble","greensomes","foursomes","custom"],re=2,ce=10,cn="ABCDEFGH",un={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class hn{loading=new h(!1);error=new h(null);courses=new h([]);tees=new h([]);courseId=new h("");preset=new h("full_18");startHole=new h(1);players=new h([]);teams=new h([]);groups=new h([]);formatSlots=new h([]);submitting=new h(!1);diagnostics=new h([]);submitError=new h(null);editToken=new h(null);hasScores=new h(!1);editStatus=new h(null);editBlockedReason=new h(null);editPlayedAt=null;catalog=L.get(ae);nextKey=1;nextSlotKey=1;nextTeamKey=1;nextGroupKey=1;reset(){this.courses.set([]),this.tees.set([]),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.groups.set([]),this.formatSlots.set([]),this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.editToken.set(null),this.hasScores.set(!1),this.editStatus.set(null),this.editBlockedReason.set(null),this.editPlayedAt=null,this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1,this.nextGroupKey=1}async load(){this.catalog.load().then(()=>this.ensureDefaultSlot());const e=await I(this.loading,this.error,()=>_.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}async loadForEdit(e){this.reset(),this.editToken.set(e),await this.catalog.load();const t=await I(this.loading,this.error,()=>_.friendlyRounds.setup({token:e}));if(!t)return;if(this.editStatus.set(t.status),!t.editable){this.editBlockedReason.set(t.reason);return}this.hasScores.set(t.hasScores),this.editPlayedAt=t.draft.playedAt;const s=await I(this.loading,this.error,()=>_.setup.courses());s&&this.courses.set(s);const n=await I(this.loading,this.error,()=>_.setup.teesByCourse({courseId:t.draft.courseId}));this.tees.set(n??[]);const r=await I(this.loading,this.error,()=>_.friendlyRounds.balls({token:e})),o=new Map;for(const u of r??[])for(const c of u.players)o.set(c.producerDefId,c.displayName);const d=ln(t.draft,u=>o.get(u)??"");this.courseId.set(d.courseId),this.preset.set(d.preset),this.startHole.set(d.startHole),this.players.set(d.players),this.teams.set(d.teams),this.groups.set(d.groups),this.formatSlots.set(d.formatSlots),this.nextKey=d.nextKey,this.nextTeamKey=d.nextTeamKey,this.nextGroupKey=d.nextGroupKey,this.nextSlotKey=d.nextSlotKey}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const s=await I(this.loading,this.error,()=>_.setup.teesByCourse({courseId:e}))??[];this.tees.set(s);const n=new Set(s.map(o=>o.id)),r=s[0]?.id??"";this.players.set(this.players.get().map(o=>({...o,teeId:n.has(o.teeId)?o.teeId:r}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}])}addMe(e){this.addFriend(e)}addFriend(e){if(this.hasPlayer(e.id))return;const t=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:e.displayName,handicapIndex:e.handicapIndex===null?"":String(e.handicapIndex),gender:e.gender??"M",genderKnown:e.gender!=null,teeId:t,playerId:e.id}])}hasPlayer(e){return this.players.get().some(t=>t.playerId===e)}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e)),this.groups.set(this.groups.get().map(t=>{if(t.members[e]===void 0)return t;const s={...t.members};return delete s[e],{...t,members:s}}))}patchPlayer(e,t){this.players.set(this.players.get().map(s=>s.key===e?{...s,...t}:s))}ensureDefaultSlot(){if(this.formatSlots.get().length>0)return;const e=this.catalog.byId("stableford_individual")??this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",s={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{}};this.formatSlots.set([...this.formatSlots.get(),s])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(s=>s.key===e?{...s,...t}:s))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return cn[e]??`T${e+1}`}formations=dn;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{}}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,kind:t,memberTeams:t==="single_ball"?{}:s.memberTeams}:s)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,s){const n=this.teamByKey(e);if(!n||n.kind!=="multi_ball"||t===e)return;const r={...n.memberTeams};if(s){if(this.teamMemberCount(e)>=ce)return;r[t]=!0}else delete r[t];this.teams.set(this.teams.get().map(o=>o.key===e?{...o,memberTeams:r}:o))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(s=>t.memberTeams[Number(s)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{let t=!1;const s={...e.subjectTeams};for(const n of this.teams.get())s[n.key]===!0&&!this.teamKindFitsFormat(e.formatId,n.kind)&&(delete s[n.key],t=!0);return t?{...e,subjectTeams:s}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}teamKindFitsFormat(e,t){return this.isSideFormat(e)?t==="multi_ball":t==="single_ball"||this.catalog.acceptsSideSubjects(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const s={...t.memberTeams};return delete s[e],{...t,memberTeams:s}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const s={...t.subjectTeams};return delete s[e],{...t,subjectTeams:s}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.teams.get().findIndex(s=>s.key===e.key);return`Team ${this.teamLetter(Math.max(0,t))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,formation:t}:s))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,s){const n=this.teamByKey(e);if(!n)return;const r={...n.pctByPlayer};if(s){if(r[t]!==void 0||this.teamMemberCount(e)>=ce)return;r[t]=r[t]??"100"}else delete r[t];this.teams.set(this.teams.get().map(o=>o.key===e?{...o,pctByPlayer:r}:o))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=ce}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let s=0;for(const n of this.players.get()){const r=t.pctByPlayer[n.key];if(r===void 0)continue;const o=this.derivedCH(n);if(!o)return null;s+=this.parsePct(r)*o.ch/100}return Math.round(s)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<re)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=re;let s=t;for(const n of this.teams.get())e.memberTeams[n.key]===!0&&n.kind==="single_ball"&&Object.keys(n.pctByPlayer).length>=re&&s++;return s>=re}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,s){const n=this.teamByKey(e);!n||n.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(r=>r.key===e?{...r,pctByPlayer:{...r.pctByPlayer,[t]:s}}:r))}groupsEnabled(){return this.groups.get().length>0}splitIntoGroups(){if(this.groupsEnabled())return;const e={};for(const t of this.players.get())e[t.key]=!0;this.groups.set([{key:this.nextGroupKey++,startTime:"",startHole:null,members:e},{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}clearGroups(){this.groups.set([])}addGroup(){this.groupsEnabled()&&this.groups.set([...this.groups.get(),{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}removeGroup(e){const t=this.groups.get().filter(s=>s.key!==e);this.groups.set(t.length>1?t:[])}groupByKey(e){return this.groups.get().find(t=>t.key===e)??null}groupLabel(e){const t=this.groups.get().findIndex(s=>s.key===e.key);return`Group ${Math.max(0,t)+1}`}groupMemberIn(e,t){return this.groupByKey(e)?.members[t]===!0}setGroupMember(e,t,s){this.groups.set(this.groups.get().map(n=>{const r=n.key===e,o=n.members[t]===!0;if(r&&s&&!o)return{...n,members:{...n.members,[t]:!0}};if(o&&(!r||!s)){const d={...n.members};return delete d[t],{...n,members:d}}return n}))}setGroupStartTime(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startTime:t}:s))}setGroupStartHole(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startHole:t}:s))}groupSize(e){const t=this.groupByKey(e);return t?this.players.get().filter(s=>t.members[s.key]===!0).length:0}ungroupedPlayers(){if(!this.groupsEnabled())return[];const e=new Set;for(const t of this.groups.get())for(const s of Object.keys(t.members))t.members[Number(s)]&&e.add(Number(s));return this.players.get().filter(t=>!e.has(t.key))}crossGroupTeamWarnings(){if(!this.groupsEnabled())return[];const e=new Map;this.groups.get().forEach((s,n)=>{for(const r of Object.keys(s.members))s.members[Number(r)]&&e.set(Number(r),n)});const t=[];for(const s of this.teams.get()){if(s.kind!=="single_ball"||!this.isTeamLive(s))continue;const n=new Set;for(const r of Object.keys(s.pctByPlayer)){const o=e.get(Number(r));o!==void 0&&n.add(o)}n.size>1&&t.push(`${this.teamLabel(s)} plays one combined ball, but its players are in different groups — keep them in the same group.`)}return t}buildGroups(e,t){return this.groups.get().map(s=>({members:e.filter(n=>s.members[n.key]===!0).map(n=>t.get(n.key)),...s.startTime.trim()!==""?{startTime:s.startTime.trim()}:{},...s.startHole!==null?{startHole:s.startHole}:{}})).filter(s=>s.members.length>0)}diagnosticsForGroups(){return this.diagnostics.get().filter(e=>e.path?.startsWith("playingGroups"))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectPlayers:{...n.subjectPlayers,[t]:s}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectTeams:{...n.subjectTeams,[t]:s}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return un[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,s)=>t-s);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1),this.groups.set(this.groups.get().map(s=>s.startHole!==null&&!t.includes(s.startHole)?{...s,startHole:null}:s))}derivedCH(e){const t=Number.parseFloat(e.handicapIndex);if(!Number.isFinite(t))return null;const s=this.teeById(e.teeId);if(!s)return null;const n=s.ratings.find(o=>o.gender===e.gender);if(!n)return null;const r={handicapIndex:t,slope:n.slope,courseRating:n.courseRating,par:n.par};return{ch:Zs(r),raw:De(r),rating:n,teeName:s.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}humanizedRoster(){return this.diagnostics.get().filter(e=>e.path==="producers").map(e=>ne(e,t=>this.catalog.labelOf(t)))}humanizedRoute(){return this.diagnostics.get().filter(e=>e.path==="route").map(e=>ne(e,t=>this.catalog.labelOf(t)))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const s of this.formatSlots.get()){for(const n of e)s.subjectPlayers[n.key]!==!1&&t.add(n.key);for(const n of this.teams.get())if(s.subjectTeams[n.key]===!0)for(const r of e)n.pctByPlayer[r.key]!==void 0&&t.add(r.key)}return e.filter(s=>!t.has(s.key))}diagnosticsForFormat(e){return sn(this.diagnostics.get(),e)}humanizedForFormat(e){return this.diagnosticsForFormat(e).map(t=>ne(t,s=>this.catalog.labelOf(s)))}generalDiagnostics(){return nn(this.diagnostics.get())}humanizedGeneral(){return this.generalDiagnostics().map(e=>ne(e,t=>this.catalog.labelOf(t)))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const s=this.liveTeamKeySet(),n=[];for(const r of this.teams.get()){if(!s.has(r.key))continue;const o=e.filter(d=>r.pctByPlayer[d.key]!==void 0).map(d=>({producerDefId:t.get(d.key),allowancePct:this.parsePct(r.pctByPlayer[d.key])}));if(r.kind==="multi_ball")for(const d of this.teams.get())r.memberTeams[d.key]===!0&&d.key!==r.key&&d.kind==="single_ball"&&s.has(d.key)&&o.push({teamId:String(d.key)});n.push({id:String(r.key),label:this.teamLabel(r),formation:r.formation,kind:r.kind,members:o})}return n}buildFormats(e,t){const s=this.liveTeamKeySet();return this.formatSlots.get().map(n=>{const r=this.isSideFormat(n.formatId),o=[];if(!r)for(const d of e)n.subjectPlayers[d.key]!==!1&&o.push({kind:"player",producerDefId:t.get(d.key)});for(const d of this.teams.get())n.subjectTeams[d.key]===!0&&s.has(d.key)&&this.teamKindFitsFormat(n.formatId,d.kind)&&o.push({kind:"team",teamId:String(d.key)});return{formatId:n.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(n.allowancePct)},subjects:o}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),s=e.indexOf(t);return s<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(s),...e.slice(0,s)].map(r=>({courseHoleNumber:r})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];if(e.forEach((n,r)=>{n.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${r}].name`}),Number.isFinite(Number.parseFloat(n.handicapIndex))||t.push({code:"missing_index",message:"Handicap index required",path:`producers[${r}].handicapIndex`}),n.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${r}].teeId`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};const s=this.editToken.get();this.submitting.set(!0);try{const n=new Map;e.forEach((g,w)=>{n.set(g.key,g.producerDefId??(s?`p-${g.key}`:`p${w+1}`))});const r=[];for(const g of e){const w=Number.parseFloat(g.handicapIndex),b=g.playerId?{kind:"player",id:g.playerId}:g.guestPlayerId?{kind:"guest",id:g.guestPlayerId}:{kind:"guest",id:(await _.guestPlayers.create({displayName:g.name.trim(),gender:g.gender,handicapIndex:w})).id};r.push({producerDefId:n.get(g.key),playerRef:b,handicapIndex:w,gender:g.gender,teeId:g.teeId})}const{roundType:o,route:d}=this.buildRoute(),u=this.buildTeams(e,n),c=this.buildGroups(e,n),m={courseId:this.courseId.get(),playedAt:this.editPlayedAt??new Date().toISOString().slice(0,10),roundType:o,...d?{route:d}:{},producers:r,...u.length>0?{teams:u}:{},formats:this.buildFormats(e,n),...c.length>0?{playingGroups:c}:{}};if(s){const g=await _.friendlyRounds.editSetup({token:s,draft:m});return g.ok?{ok:!0,token:s}:(this.diagnostics.set(g.diagnostics),{ok:!1})}const p=await _.friendlyRounds.create({draft:m});return p.ok?{ok:!0,token:p.friendlyRound.shareToken}:(this.diagnostics.set(p.diagnostics),{ok:!1})}catch(n){return this.submitError.set(n instanceof M?n.message:s?"Could not save the round. Try again.":"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}class Ue{loading=new h(!1);error=new h(null);player=new h(null);history=new h([]);saving=new h(!1);saveError=new h(null);async load(e=!1){if(!e&&(this.player.get()!==null||this.loading.get()))return;const t=await I(this.loading,this.error,()=>Promise.all([_.players.me(),_.players.myHandicapHistory()]));if(!t)return;const[s,n]=t;this.player.set(s),this.history.set(n)}clear(){this.player.set(null),this.history.set([]),this.error.set(null),this.saveError.set(null)}async saveIndex(e){return await I(this.saving,this.saveError,()=>_.players.updateHandicap({handicapIndex:e}))?(await this.load(!0),!0):!1}async saveGender(e){const t=await I(this.saving,this.saveError,()=>_.players.updateProfile({gender:e}));return t?(this.player.set(t),!0):!1}}const We=2;function Ne(i){return i.trim().length>=We}function Qe(i){return[...i].sort((e,t)=>e.displayName.localeCompare(t.displayName,"sv",{sensitivity:"base"}))}function pn(i,e){return Qe([...i.filter(t=>t.id!==e.id),e])}function mn(i,e){return i.filter(t=>t.id!==e)}function ze(i,e,t){return i.map(s=>s.id===e?{...s,isFriend:t}:s)}function fn(i,e,t=()=>{},s=300){let n=0,r;return o=>{const d=o.trim(),u=++n;if(r!==void 0&&clearTimeout(r),r=void 0,d.length<We){e(d,[]);return}r=setTimeout(()=>{i(d).then(c=>{u===n&&e(d,c)},c=>{u===n&&t(d,c)})},s)}}class fe{loading=new h(!1);error=new h(null);friends=new h([]);loaded=new h(!1);query=new h("");searching=new h(!1);searchError=new h(null);results=new h([]);resultsFor=new h("");mutating=new h(!1);mutateError=new h(null);runSearch=fn(e=>_.players.search({q:e}),(e,t)=>{this.searching.set(!1),this.results.set(t),this.resultsFor.set(e)},(e,t)=>{this.searching.set(!1),this.results.set([]),this.resultsFor.set(e),this.searchError.set({code:"network",message:t instanceof Error?t.message:"Search failed. Try again."})});async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;const t=await I(this.loading,this.error,()=>_.friends.list());t&&(this.friends.set(Qe(t)),this.loaded.set(!0))}setQuery(e){this.query.set(e),this.searchError.set(null),this.searching.set(e.trim().length>=2),this.runSearch(e)}async add(e){await I(this.mutating,this.mutateError,()=>_.friends.add({friendId:e.id}))&&(this.friends.set(pn(this.friends.get(),{id:e.id,username:e.username,displayName:e.displayName,gender:e.gender,handicapIndex:e.handicapIndex})),this.results.set(ze(this.results.get(),e.id,!0)))}async remove(e){await I(this.mutating,this.mutateError,()=>_.friends.remove({friendId:e}))&&(this.friends.set(mn(this.friends.get(),e)),this.results.set(ze(this.results.get(),e,!1)))}clear(){this.friends.set([]),this.loaded.set(!1),this.query.set(""),this.results.set([]),this.resultsFor.set(""),this.error.set(null),this.searchError.set(null),this.mutateError.set(null),this.searching.set(!1)}}const gn=["full_18","front_9","back_9"],bn=y(`
    <div bind="root" class="setup">
        <button bind="back" class="setup__back" type="button">← Home</button>
        <header class="setup__head">
            <h1 bind="title">New round</h1>
            <p bind="subtitle">No sign-in required.</p>
        </header>

        <div bind="blocked" class="setup__blocked hidden"></div>

        <section class="setup__section">
            <h2>Course</h2>
            <div bind="course" class="setup__select"></div>
            <p bind="lockNote" class="setup__locknote hidden">Scores have been recorded — the course and route are locked for this round.</p>
            <p bind="routeErr" class="setup__warn"></p>
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
            <p bind="rosterErr" class="setup__warn"></p>
        </section>

        <section class="setup__section">
            <h2>Teams</h2>
            <p class="setup__hint">Optional. Group players into a team ball with a handicap allowance per member.</p>
            <div bind="teams" class="setup__fslots"></div>
            <button bind="addTeam" class="setup__add" type="button">+ Create team</button>
        </section>

        <section class="setup__section">
            <h2>Playing groups</h2>
            <p class="setup__hint">Optional. Split the field into groups with their own tee times or start holes (shotgun).</p>
            <div bind="groups" class="setup__fslots"></div>
            <p bind="groupNote" class="setup__note"></p>
            <p bind="groupWarn" class="setup__warn"></p>
            <button bind="splitGroups" class="setup__add" type="button">Split into groups</button>
            <button bind="addGroup" class="setup__add hidden" type="button">+ Add group</button>
            <button bind="clearGroups" class="setup__add hidden" type="button">Keep everyone together</button>
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
        <button bind="cancel" class="setup__cancel hidden" type="button">Cancel</button>
    </div>
`),yn=y(`
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
`),_n=y(`
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
`),Oe=y(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),vn=y(`
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
`),xn=y(`
    <div class="fslot">
        <div class="fslot__top">
            <span bind="groupName" class="fslot__teamname"></span>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <div class="fslot__group">
            <span class="fslot__label">Start</span>
            <div class="grp__start">
                <input bind="time" type="time" class="grp__time" />
                <div bind="hole" class="grp__hole"></div>
            </div>
        </div>
        <div class="fslot__group">
            <span class="fslot__label">Players</span>
            <div bind="memberRows" class="fslot__teamrows"></div>
            <p bind="meta" class="fslot__teammeta"></p>
        </div>
    </div>
`),wn=y(`
    <button bind="row" type="button" class="frow">
        <span bind="name" class="frow__name"></span>
        <span bind="username" class="frow__username"></span>
        <span bind="hcp" class="frow__hcp"></span>
    </button>
`),He=y(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class $n extends C{static styles=`
        .setup {
            padding: ${a("lg")} ${a("lg")} ${a("2xl")};

            /* Not-editable (complete / no stored draft): only the head + blocked
               note + back button remain; the form body is removed. */
            &.setup--blocked > .setup__section,
            &.setup--blocked > .setup__banner,
            &.setup--blocked > .setup__create,
            &.setup--blocked > .setup__cancel { display: none; }

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

            & .setup__warn {
                margin: ${a("sm")} 0 0; font-size: 0.82rem; color: ${l("error")};
                white-space: pre-line;
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
                    &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                }
            }

            & .setup__startrow {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${a("md")}; font-size: 0.9rem; color: ${l("text-muted")};
            }

            & .setup__players { display: flex; flex-direction: column; gap: ${a("md")}; }

            & .player {
                padding: ${a("md")}; ${z()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .player__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .player__name { flex: 1; padding: ${a("md")}; font-size: 1rem; ${F()} }
                & .player__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${k()}
                    font-size: 1rem; color: ${l("text-muted")};
                }
                & .player__fields { display: flex; gap: ${a("sm")}; align-items: stretch; }
                & .player__index { flex: 1; min-width: 0; padding: ${a("md")}; font-size: 1rem; ${F()} }
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
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")}; ${k()}
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }
            & .setup__add.hidden { display: none; }

            & .setup__friends {
                margin-top: ${a("sm")}; padding: ${a("sm")}; ${z()}
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
                padding: ${a("md")}; ${z()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .fslot__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .fslot__teamname { flex: 1; min-width: 0; font-weight: 700; font-size: 0.95rem; }
                & .fslot__teammeta {
                    margin: ${a("xs")} 0 0; font-size: 0.78rem; color: ${l("text-muted")};
                    &:empty { display: none; }
                }
                & .fslot__format { flex: 1; min-width: 0; font-size: 1rem; }
                & .fslot__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${k()}
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
                        & input { width: 56px; padding: ${a("xs")} ${a("sm")}; ${F()} font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${a("xs")};
                    & button {
                        flex: 1; padding: ${a("sm")} 0; ${k()}
                        font-family: inherit; font-weight: 700; font-size: 0.82rem;
                        &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                    }
                }
                & .fslot__flat {
                    display: flex; align-items: center; gap: ${a("xs")}; font-size: 0.9rem;
                    color: ${l("text-muted")};
                    &[hidden] { display: none; }
                    & .fslot__pct { width: 70px; padding: ${a("sm")}; font-size: 1rem; ${F()} }
                }
                & .fslot__bands {
                    display: flex; flex-direction: column; gap: ${a("xs")};
                    &[hidden] { display: none; }
                }
                & .fslot__bandrows { display: flex; flex-direction: column; gap: ${a("xs")}; }
                & .brow {
                    display: flex; align-items: center; gap: ${a("xs")};
                    font-size: 0.82rem; color: ${l("text-muted")};
                    & .brow__pct, & .brow__upto { width: 56px; padding: ${a("sm")}; font-size: 0.95rem; ${F()} }
                    & .brow__del { margin-left: auto; width: 30px; height: 30px; ${k()} font-size: 0.8rem; color: ${l("text-muted")}; }
                }
                & .fslot__addband {
                    align-self: flex-start; padding: ${a("xs")} ${a("sm")}; ${k()}
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                }

                & .fslot__err {
                    font-size: 0.82rem; color: ${l("error")};
                    &:empty { display: none; }
                }

                & .grp__start {
                    display: flex; gap: ${a("sm")}; align-items: stretch;
                    & .grp__time { flex: 1; min-width: 0; padding: ${a("sm")} ${a("md")}; font-size: 1rem; font-family: inherit; ${F()} }
                    & .grp__hole { flex: 1; min-width: 0; font-size: 1rem; }
                }
            }

            & .setup__create {
                width: 100%; padding: ${a("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit; ${k()}
                background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                box-shadow: ${l("shadow-elevated")};
                &:hover { background: ${l("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            & .setup__cancel {
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")}; ${k()}
                background: none; font-family: inherit; font-weight: 600; font-size: 0.95rem;
                color: ${l("text-muted")};
                &.hidden { display: none; }
            }

            & .setup__blocked {
                padding: ${a("lg")}; ${z()}
                background: ${l("surface-sunken")}; color: ${l("text-muted")};
                font-size: 0.95rem; margin-bottom: ${a("xl")};
                &.hidden { display: none; }
            }

            & .setup__locknote {
                margin: ${a("sm")} 0 0; font-size: 0.8rem; color: ${l("text-muted")};
                &.hidden { display: none; }
            }
        }
    `;svc=this.inject(hn);router=this.inject(H);auth=this.inject(B);profile=this.inject(Ue);friends=this.inject(fe);pickerOpen=new h(!1);render(){const e=this.router.query("token").get(),t=!!e;this.pickerOpen.set(!1),t?this.svc.loadForEdit(e):(this.svc.reset(),this.svc.load()),this.auth.currentUser.get()&&(this.profile.load(),this.friends.load());const s=()=>t&&this.svc.editBlockedReason.get()!==null,n=()=>t&&this.svc.hasScores.get(),r=()=>this.profile.player.get(),o=()=>{const c=r();return this.auth.currentUser.get()!==null&&c!==null&&!this.svc.hasPlayer(c.id)},d=this.wire(bn,{root:{className:()=>s()?"setup setup--blocked":"setup"},back:{textContent:()=>t?"← Back to round":"← Home",onclick:()=>t&&e?this.router.navigate("/round",{query:{token:e}}):this.router.navigate("/")},title:{textContent:()=>t?"Edit round":"New round"},subtitle:{textContent:()=>t?"Change the setup — scored balls are preserved.":"No sign-in required."},blocked:{className:()=>s()?"setup__blocked":"setup__blocked hidden",textContent:()=>this.svc.editBlockedReason.get()==="round_complete"?"This round is complete — its setup can no longer be edited.":this.svc.editBlockedReason.get()==="no_stored_draft"?"This round didn't come from the setup wizard, so it can't be edited here.":""},lockNote:{className:()=>n()?"setup__locknote":"setup__locknote hidden"},routeErr:{textContent:()=>this.svc.humanizedRoute().join(`
`)},rosterErr:{textContent:()=>this.svc.humanizedRoster().join(`
`)},cancel:{className:()=>t?"setup__cancel":"setup__cancel hidden",onclick:()=>e&&this.router.navigate("/round",{query:{token:e}})},addPlayer:{onclick:()=>this.svc.addPlayer()},addMe:{className:()=>o()?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>`+ Add me (${r()?.displayName??""})`,onclick:()=>{const c=r();c&&this.svc.addMe({id:c.id,displayName:c.displayName,handicapIndex:c.handicapIndex,gender:c.gender})}},addFriends:{className:()=>this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>this.pickerOpen.get()?"− From friends":"+ From friends",onclick:()=>this.pickerOpen.set(!this.pickerOpen.get())},friendPicker:{className:()=>this.pickerOpen.get()&&this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__friends":"setup__friends hidden"},addTeam:{onclick:()=>this.svc.addTeam()},splitGroups:{className:()=>this.svc.groupsEnabled()?"setup__add hidden":"setup__add",onclick:()=>this.svc.splitIntoGroups()},addGroup:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.addGroup()},clearGroups:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.clearGroups()},groupNote:{textContent:()=>{const c=this.svc.ungroupedPlayers();return c.length===0?"":`${c.map(p=>p.name.trim()||"A player").join(", ")} ${c.length>1?"aren't":"isn't"} in a group yet — every player needs one.`}},groupWarn:{textContent:()=>[...this.svc.crossGroupTeamWarnings(),...this.svc.diagnosticsForGroups().map(c=>c.message)].join(`
`)},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const c=this.svc.playersInNoFormat();return c.length===0?"":`Heads up: ${c.map(p=>p.name.trim()||"A player").join(", ")} ${c.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.humanizedGeneral(),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?t?"Saving…":"Creating…":t?"Save changes":"Create round",onclick:async()=>{const c=await this.svc.submit();c.ok&&this.router.navigate("/round",{query:{token:c.token}})}}});this.$each(this.ref(d,"presets"),()=>gn,(c,m,p)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(c),className:()=>this.svc.preset.get()===c?"on":"",disabled:()=>n(),onclick:()=>{n()||this.svc.setPreset(c)}}},p),c=>c);const u=c=>this.track(c);return this.mountSelect(this.ref(d,"course"),u,{value:this.bound(u,()=>this.svc.courseId.get(),c=>{c&&c!==this.svc.courseId.get()&&this.svc.selectCourse(c)}),options:{get:()=>{const c=[];let m="";for(const p of this.svc.courses.get())p.clubName!==m&&(c.push({value:`__club:${p.clubName}`,label:p.clubName,disabled:!0}),m=p.clubName),c.push({value:p.id,label:p.name});return c}},placeholder:"Select a course",disabled:{get:()=>n()}}),this.mountSelect(this.ref(d,"startHole"),u,{value:this.bound(u,()=>String(this.svc.startHole.get()),c=>this.svc.startHole.set(Number(c))),options:{get:()=>this.svc.startHoleOptions().map(c=>({value:String(c),label:String(c)}))},disabled:{get:()=>n()}}),this.$each(this.ref(d,"friendRows"),()=>this.friends.friends.get().filter(c=>!this.svc.hasPlayer(c.id)),(c,m,p)=>this.wireEl(wn,{row:{onclick:()=>this.svc.addFriend({id:c.id,displayName:c.displayName,handicapIndex:c.handicapIndex,gender:c.gender})},name:()=>c.displayName,username:()=>`@${c.username}`,hcp:()=>c.handicapIndex===null?"–":c.handicapIndex.toFixed(1)},p),c=>c.id),this.$each(this.ref(d,"players"),this.svc.players,(c,m,p)=>this.playerRow(c.key,p),c=>c.key),this.$each(this.ref(d,"teams"),this.svc.teams,(c,m,p)=>this.teamCard(c.key,p),c=>c.key),this.$each(this.ref(d,"groups"),this.svc.groups,(c,m,p)=>this.groupCard(c.key,p),c=>c.key),this.$each(this.ref(d,"formats"),this.svc.formatSlots,(c,m,p)=>this.formatCard(c.key,m,p),c=>c.key),d}mountSelect(e,t,s){const n=new ee(s);n.mount(e),t(()=>n.destroy())}bound(e,t,s){const n=new h(t());return e($(()=>n.set(t()))),e($(()=>{const r=n.get();queueMicrotask(()=>s(r))})),n}eachInto(e,t,s,n,r){const o=new Map,d=new Map;t(()=>{for(const u of d.values())u.forEach(c=>c());d.clear()}),t($(()=>{const u=s(),c=new Map;for(const[p,g]of u.entries()){const w=r(g,p);if(o.has(w))c.set(w,o.get(w));else{const b=[];c.set(w,n(g,p,v=>b.push(v))),d.set(w,b)}}for(const[p,g]of o)c.has(p)||(g.remove(),d.get(p)?.forEach(w=>w()),d.delete(p));let m=e.firstChild;for(const p of c.values())p===m?m=m.nextSibling:e.insertBefore(p,m);o.clear();for(const[p,g]of c)o.set(p,g)}))}formatCard(e,t,s){const n=()=>this.svc.slotByKey(e),r=()=>n()?.formatId??"",o=this.wireEl(_n,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(r())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:u=>this.svc.setSlotAllowance(e,u.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(r())?"applied to each side member’s ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.humanizedForFormat(t).join(" · ")}},s);this.mountSelect(this.ref(o,"format"),s,{value:this.bound(s,()=>r(),u=>{u&&u!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,u)}),options:{get:()=>this.svc.catalog.descriptors.get().map(u=>({value:u.id,label:this.svc.catalog.labelOf(u)??u.label}))}});const d=()=>{const u=this.svc.isSideFormat(r()),c=[];u||c.push(...this.svc.players.get().map(m=>({kind:"player",subKey:m.key})));for(const m of this.svc.teams.get())this.svc.teamKindFitsFormat(r(),m.kind)&&c.push({kind:"team",subKey:m.key});return c};return this.eachInto(this.ref(o,"subjectRows"),s,d,(u,c,m)=>this.subjectRow(e,u.kind,u.subKey,m),u=>`${u.kind}${u.subKey}`),o}subjectRow(e,t,s,n){const r=()=>{if(t==="player")return this.svc.players.get().find(c=>c.key===s)?.name?.trim()||"Player";const u=this.svc.teamByKey(s);return u?`${this.svc.teamLabel(u)} (${u.kind==="multi_ball"?"side":"team"})`:"Team"},o=()=>t==="player"?this.svc.subjectPlayerIn(e,s):this.svc.subjectTeamIn(e,s),d=u=>t==="player"?this.svc.setSubjectPlayer(e,s,u):this.svc.setSubjectTeam(e,s,u);return this.wireEl(Oe,{chk:{checked:()=>o(),onchange:u=>d(u.target.checked)},name:{textContent:()=>r()}},n)}groupCard(e,t){const s=this.wireEl(xn,{remove:{onclick:()=>this.svc.removeGroup(e)},groupName:{textContent:()=>{const n=this.svc.groupByKey(e);return n?this.svc.groupLabel(n):"Group"}},time:{value:this.svc.groupByKey(e)?.startTime??"",oninput:n=>this.svc.setGroupStartTime(e,n.target.value)},meta:{textContent:()=>{const n=this.svc.groupSize(e);return n===0?"Tick the players who walk with this group.":`${n} player${n===1?"":"s"}`}}},t);return this.mountSelect(this.ref(s,"hole"),t,{value:this.bound(t,()=>{const n=this.svc.groupByKey(e)?.startHole;return n==null?"":String(n)},n=>this.svc.setGroupStartHole(e,n===""?null:Number(n))),options:{get:()=>[{value:"",label:"First hole"},...this.svc.startHoleOptions().map(n=>({value:String(n),label:`Hole ${n}`}))]}}),this.eachInto(this.ref(s,"memberRows"),t,()=>this.svc.players.get(),(n,r,o)=>this.groupMemberRow(e,n.key,o),n=>n.key),s}groupMemberRow(e,t,s){return this.wireEl(Oe,{chk:{checked:()=>this.svc.groupMemberIn(e,t),onchange:n=>this.svc.setGroupMember(e,t,n.target.checked)},name:{textContent:()=>this.svc.players.get().find(n=>n.key===t)?.name?.trim()||"Player"}},s)}teamCard(e,t){const s=()=>this.svc.teamKindOf(e)==="multi_ball",n=this.wireEl(vn,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const r=this.svc.teamByKey(e);return r?this.svc.teamLabel(r):"Team"}},compGroup:{hidden:()=>s()},membersLabel:{textContent:()=>s()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const r=this.svc.teamSize(e);if(r===0)return s()?"Tick at least 2 members — a side needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(r<2)return"Add one more member — a team needs at least 2.";if(s())return`${r} balls · a side (scored together by a side format)`;const o=this.svc.teamBallCh(e);return o===null?`${r} players`:`${r} players · plays off CH ${o}`}}},t);return this.mountSelect(this.ref(n,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),r=>this.svc.setTeamKind(e,r==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"One combined ball"},{value:"multi_ball",label:"Separate balls (a side)"}]}}),this.mountSelect(this.ref(n,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",r=>this.svc.setTeamFormation(e,r)),options:{get:()=>this.svc.formations.map(r=>({value:r,label:r[0].toUpperCase()+r.slice(1)}))}}),this.eachInto(this.ref(n,"memberRows"),t,()=>{const r=this.svc.players.get().map(o=>({kind:"player",mKey:o.key}));if(s())for(const o of this.svc.eligibleNestedTeams(e))r.push({kind:"team",mKey:o.key});return r},(r,o,d)=>r.kind==="player"?this.teamMemberRow(e,r.mKey,d):this.teamNestedRow(e,r.mKey,d),r=>`${r.kind}${r.mKey}`),n}teamNestedRow(e,t,s){const n=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(He,{chk:{checked:()=>n(),disabled:()=>!n()&&this.svc.teamAtMaxSize(e),onchange:r=>this.svc.setTeamMemberTeam(e,t,r.target.checked)},name:{textContent:()=>{const r=this.svc.teamByKey(t);return r?`${this.svc.teamLabel(r)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},s)}teamMemberRow(e,t,s){const n=()=>this.svc.players.get().find(o=>o.key===t)??null,r=()=>this.svc.teamMemberIn(e,t);return this.wireEl(He,{chk:{checked:()=>r(),disabled:()=>!r()&&this.svc.teamAtMaxSize(e),onchange:o=>this.svc.setTeamMember(e,t,o.target.checked)},name:{textContent:()=>n()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!r()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:o=>this.svc.setTeamPct(e,t,o.target.value)}},s)}playerRow(e,t){const s=()=>this.svc.players.get().find(o=>o.key===e)??null,n=()=>this.svc.players.get().findIndex(o=>o.key===e),r=this.wireEl(yn,{name:{value:s()?.name??"",readOnly:()=>!!s()?.playerId,oninput:o=>this.svc.patchPlayer(e,{name:o.target.value})},index:{value:s()?.handicapIndex??"",oninput:o=>this.svc.patchPlayer(e,{handicapIndex:o.target.value})},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const o=s();if(!o)return"";const d=this.svc.derivedCH(o);if(!d)return"";const u=d.rating;return`Course handicap ${d.ch}  ·  ${o.handicapIndex} × ${u.slope}/113 + (${u.courseRating} − ${u.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(n()).map(o=>o.message).join(" · ")}},t);return this.mountSelect(this.ref(r,"gender"),t,{value:this.bound(t,()=>s()?.gender??"M",o=>this.svc.patchPlayer(e,{gender:o})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]},disabled:{get:()=>s()?.genderKnown===!0}}),this.mountSelect(this.ref(r,"tee"),t,{value:this.bound(t,()=>s()?.teeId??"",o=>this.svc.patchPlayer(e,{teeId:o})),options:{get:()=>this.svc.tees.get().map(o=>({value:o.id,label:o.name}))},placeholder:"Tee"}),r}}const kn=y(`
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
`);class Sn extends C{static styles=`
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
                    ${F()}
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
                        ${k()}
                        &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                    }
                }

                & button {
                    padding: ${a("md")} ${a("lg")};
                    font-size: 1rem;
                    font-weight: 700;
                    ${k()}
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
    `;auth=this.inject(B);router=this.inject(H);nextQ=this.router.query("next");mode=new h("login");busy=new h(!1);registerError=new h("");username="";password="";displayName="";hcp="";gender=new h(null);destination(e){const t=this.nextQ.get();return t&&t.startsWith("/")?t:e}async submit(){if(this.registerError.set(""),this.mode.get()==="login"){await this.auth.login(this.username,this.password)&&this.router.navigate(this.destination("/"),!0);return}const e=this.hcp.trim().replace(",","."),t=e===""?null:Number.parseFloat(e);if(t!==null&&!Number.isFinite(t)){this.registerError.set("Handicap index must be a number (or leave it empty).");return}if(this.password.length<8){this.registerError.set("Password must be at least 8 characters.");return}if(!this.username.trim()||!this.displayName.trim()){this.registerError.set("Username and display name are required.");return}this.busy.set(!0);try{const s=await _.players.register({username:this.username.trim(),password:this.password,displayName:this.displayName.trim(),handicapIndex:t,gender:this.gender.get()});this.auth.currentUser.set({id:s.id,username:s.username}),this.router.navigate(this.destination("/"),!0)}catch(s){this.registerError.set(s instanceof M&&s.status===409?"That username is taken.":s instanceof M?s.message:"Could not create the account. Try again.")}finally{this.busy.set(!1)}}render(){const e=()=>this.mode.get()==="register",t=()=>this.auth.loading.get()||this.busy.get(),s=this.wire(kn,{root:{inert:()=>t()},error:{className:()=>this.registerError.get()||this.auth.error.get()?"error show":"error",textContent:()=>this.registerError.get()||this.auth.error.get()?.message||""},form:{onsubmit:async r=>{r.preventDefault(),await this.submit()}},username:{oninput:r=>{this.username=r.target.value}},password:{autocomplete:()=>e()?"new-password":"current-password",oninput:r=>{this.password=r.target.value}},registerFields:{className:()=>e()?"login__register":"login__register hidden"},displayName:{oninput:r=>{this.displayName=r.target.value}},hcp:{oninput:r=>{this.hcp=r.target.value}},submit:{textContent:()=>t()?e()?"Creating account…":"Signing in…":e()?"Create account":"Sign in"},toggle:{textContent:()=>e()?"Have an account? Sign in":"New here? Create an account",onclick:()=>{this.registerError.set(""),this.auth.error.set(null),this.mode.set(e()?"login":"register")}}}),n=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];return this.$each(this.ref(s,"gender"),()=>n,(r,o,d)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>r.label,className:()=>this.gender.get()===r.value?"on":"",onclick:()=>this.gender.set(r.value)}},d),r=>r.label),s}}const In=y(`
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
`),Tn=y(`
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
`),En=y(`
    <div class="friend-row">
        <span bind="initials" class="friend-row__badge"></span>
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="username" class="friend-row__username"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="remove" class="friend-row__remove" type="button" aria-label="Remove friend">✕</button>
    </div>
`);function Me(i){return i.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0].toUpperCase()).join("")}class Cn extends C{static styles=`
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
                    ${k()}
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
                ${F()}
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
                ${z()}

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
                    ${k()}
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
                    width: 34px; height: 34px; flex-shrink: 0; ${k()}
                    font-size: 0.9rem; color: ${l("text-muted")};
                }
            }
        }
    `;svc=this.inject(fe);auth=this.inject(B);router=this.inject(H);render(){const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.load();const t=this.wire(In,{anon:{className:()=>e()?"friends__anon hidden":"friends__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},body:{className:()=>e()?"friends__body":"friends__body hidden"},search:{value:()=>this.svc.query.get(),oninput:s=>this.svc.setQuery(s.target.value)},searchHint:{textContent:()=>{const s=this.svc.query.get().trim();return s.length>0&&!Ne(s)?"Type at least 2 characters.":this.svc.searching.get()?"Searching…":""}},searchErr:{textContent:()=>this.svc.searchError.get()?.message??""},resultsEmpty:{className:()=>{const s=this.svc.query.get().trim();return Ne(s)&&!this.svc.searching.get()&&this.svc.searchError.get()===null&&this.svc.resultsFor.get()===s&&this.svc.results.get().length===0?"friends__empty":"friends__empty hidden"}},friendsEmpty:{className:()=>this.svc.loaded.get()&&this.svc.friends.get().length===0?"friends__empty":"friends__empty hidden"}});return this.$each(this.ref(t,"results"),this.svc.results,(s,n,r)=>this.wireEl(Tn,{initials:()=>Me(s.displayName),name:()=>s.displayName,username:()=>`@${s.username}`,hcp:()=>s.handicapIndex===null?"–":s.handicapIndex.toFixed(1),add:{className:()=>this.isFriendNow(s.id)?"friend-row__add hidden":"friend-row__add",disabled:()=>this.svc.mutating.get(),onclick:()=>{const o=this.svc.results.get().find(d=>d.id===s.id);o&&!o.isFriend&&this.svc.add(o)}},added:{className:()=>this.isFriendNow(s.id)?"friend-row__added":"friend-row__added hidden"}},r),s=>s.id),this.$each(this.ref(t,"friends"),this.svc.friends,(s,n,r)=>this.wireEl(En,{initials:()=>Me(s.displayName),name:()=>s.displayName,username:()=>`@${s.username}`,hcp:()=>s.handicapIndex===null?"–":s.handicapIndex.toFixed(1),remove:{disabled:()=>this.svc.mutating.get(),onclick:()=>{this.svc.remove(s.id)}}},r),s=>s.id),t}isFriendNow(e){return this.svc.results.get().find(t=>t.id===e)?.isFriend===!0}}const Pn=y(`
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
`),jn=y(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`);class Nn extends C{static styles=`
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
                    ${k()}
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
                ${z()}

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
                    & input { width: 90px; padding: ${a("md")}; font-size: 1rem; text-align: center; ${F()} }
                    & button {
                        padding: ${a("md")} ${a("lg")}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700; ${k()}
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
                        ${k()}
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
                ${z()}

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
    `;svc=this.inject(Ue);friends=this.inject(fe);auth=this.inject(B);router=this.inject(H);indexDraft=new h("");localErr=new h("");render(){this.auth.currentUser.get()&&this.svc.load();const e=()=>this.auth.currentUser.get()!==null,t=this.wire(Pn,{anon:{className:()=>e()?"profile__anon hidden":"profile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/profile"}})},body:{className:()=>e()?"profile__body":"profile__body hidden"},name:()=>this.svc.player.get()?.displayName??"…",username:()=>{const n=this.svc.player.get();return n?`@${n.username}`:""},hcp:()=>{const n=this.svc.player.get()?.handicapIndex;return n==null?"–":n.toFixed(1)},index:{value:()=>this.indexDraft.get(),oninput:n=>this.indexDraft.set(n.target.value)},save:{disabled:()=>this.svc.saving.get()||this.indexDraft.get().trim()==="",textContent:()=>this.svc.saving.get()?"Saving…":"Save"},form:{onsubmit:async n=>{n.preventDefault(),this.localErr.set("");const r=this.indexDraft.get().trim().replace(",","."),o=Number.parseFloat(r);if(!Number.isFinite(o)||o<-10||o>54){this.localErr.set("Enter an index between -10 and 54.");return}await this.svc.saveIndex(o)&&this.indexDraft.set("")}},saveErr:{textContent:()=>this.localErr.get()||this.svc.saveError.get()?.message||""},genderErr:{textContent:()=>this.svc.saveError.get()?.message||""},historyEmpty:{className:()=>this.svc.history.get().length===0?"profile__empty":"profile__empty hidden"},signout:{onclick:async()=>{await this.auth.logout(),this.svc.clear(),this.friends.clear(),this.router.navigate("/")}}});this.$each(this.ref(t,"history"),this.svc.history,(n,r,o)=>this.wireEl(jn,{index:()=>n.handicapIndex.toFixed(1),source:()=>n.source,date:()=>n.effectiveDate},o),n=>n.id);const s=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];return this.$each(this.ref(t,"gender"),()=>s,(n,r,o)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>n.label,className:()=>this.svc.player.get()?.gender===n.value?"on":"",disabled:()=>this.svc.saving.get(),onclick:()=>{this.svc.saveGender(n.value)}}},o),n=>n.label),t}}const zn=y(`
    <div class="app-shell">
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class On extends C{static styles=`
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
    `;router=this.inject(H);render(){const e=this.wire(zn,{});return this.spawn(St,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":Se,"/round":Js,"/create":$n,"/login":Sn,"/friends":Cn,"/profile":Nn},Se),e}}L.get(ct);const Re=L.get(H),Fe=L.get(B);await ht(On,"#app",{hot:void 0,onInit:async()=>{await Fe.load(),Fe.currentUser.get()&&Re.route.get()==="/login"&&Re.navigate("/",!0)}});export{C,H as R,h as S,ct as T,f as a,Z as b,T as c,$ as e,I as r,y as t};
