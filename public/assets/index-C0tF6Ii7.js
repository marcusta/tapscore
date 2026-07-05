(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();const Et="modulepreload",Ct=function(r){return"/tapscore/"+r},je={},Nt=function(e,t,s){let n=Promise.resolve();if(t&&t.length>0){let u=function(c){return Promise.all(c.map(m=>Promise.resolve(m).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),d=o?.nonce||o?.getAttribute("nonce");n=u(t.map(c=>{if(c=Ct(c),c in je)return;je[c]=!0;const m=c.endsWith(".css"),p=m?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${p}`))return;const g=document.createElement("link");if(g.rel=m?"stylesheet":Et,m||(g.as="script"),g.crossOrigin="",g.href=c,d&&g.setAttribute("nonce",d),document.head.appendChild(g),m)return new Promise(($,y)=>{g.addEventListener("load",$),g.addEventListener("error",()=>y(new Error(`Unable to preload CSS for ${c}`)))})}))}function i(o){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=o,window.dispatchEvent(d),!d.defaultPrevented)throw o}return n.then(o=>{for(const d of o||[])d.status==="rejected"&&i(d.reason);return e().catch(i)})};class Pt{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])this.batching?this.pending.add(t):t.run()}runTracked(e,t){st(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.run()}}}const q=new Pt;function st(r){for(const e of r.deps)e.delete(r);r.deps.clear()}class h{constructor(e){this.subs=new Set,this.val=e}get(){return q.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,q.notify(this.subs))}update(e){this.set(e(this.val))}}class w{constructor(e){this.subs=new Set,this.val=void 0;const t=this,s={run(){q.runTracked(s,()=>{const n=e();Object.is(t.val,n)||(t.val=n,q.notify(t.subs))})},deps:new Set};s.run()}get(){return q.subscribe(this.subs),this.val}peek(){return this.val}}function k(r){const e={run(){q.runTracked(e,r)},deps:new Set};return e.run(),()=>st(e)}function re(r){q.batch(r)}function Y(r){return q.untrack(r)}class zt{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const B=new zt,te="/tapscore/".replace(/\/+$/,"");function ye(r){return te?r===te?"/":r.startsWith(te+"/")?r.slice(te.length):r:r}function jt(r){return te+r}class j{constructor(){this.route=new h(ye(location.pathname??"/")),this.search=new h(location.search??""),window.addEventListener("popstate",()=>re(()=>{this.route.set(ye(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},n=e.indexOf("#"),i=n>=0?e.slice(n):"",o=n>=0?e.slice(0,n):e,d=o.indexOf("?"),u=d>=0?o.slice(0,d):o,c=d>=0?o.slice(d+1):"",m=s.query!==void 0?Ot(s.query):c?"?"+c:"",p=jt(u)+m+i;(s.replace?history.replaceState:history.pushState).call(history,null,"",p),re(()=>{this.route.set(u),this.search.set(m)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:n=>{n.preventDefault(),this.navigate(e)},className:()=>{const n=this.route.get();return n===s||n.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new w(()=>{const s=this.route.get().split("/"),n={};for(const[i,o]of t.entries())o.startsWith(":")&&(n[o.slice(1)]=s[i]??"");return n})}query(e){return new w(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new w(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function Ot(r){const e=new URLSearchParams;for(const[s,n]of Object.entries(r))n==null||n===""||e.set(s,String(n));const t=e.toString();return t?"?"+t:""}function Rt(r){return e=>r[e]}function Ht(r,e){const t=(n,i,o)=>{const d=Object.entries(n).map(([u,c])=>`--${u}:${c}`).join(";");return`${i}{color-scheme:${o};${d}}`},s=document.createElement("style");return s.textContent=t(r,'[data-theme="light"]',"light")+t(e,'[data-theme="dark"]',"dark"),document.head.appendChild(s),n=>`var(--${n})`}const Oe="basics-js-theme";class Mt{constructor(){this.dark=new h(!1);const e=localStorage.getItem(Oe),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),k(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(Oe,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function b(r){const e=document.createElement("template");return e.innerHTML=r,e}function Lt(r,e){let t;for(const s of Object.keys(e))r.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const Re=new Set;class T{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!Re.has(t)){Re.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return B.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const n=Y(()=>{const i=new e(s[0]);return i.mount(t),i});return this.children.push(n),n}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0}wire(e,t,s){const n=s??(o=>this.track(o)),i=e.content.cloneNode(!0);for(const o of i.querySelectorAll("[bind]")){const d=t[o.getAttribute("bind")];if(d)if(typeof d=="function")n(k(()=>{const u=d();o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement?o.value=String(u):o.textContent=String(u)}));else for(const[u,c]of Object.entries(d)){const m=u.includes("-");u.startsWith("on")&&typeof c=="function"?o.addEventListener(u.slice(2),c):typeof c=="function"?n(k(()=>{const p=c();m?o.setAttribute(u,String(p)):o[u]=p})):m?o.setAttribute(u,String(c)):o[u]=c}}return i}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const n=this.ref(t,e);return n?(typeof s=="string"?n.textContent=s:typeof s=="function"&&s.prototype instanceof T?this.spawn(s,n):typeof s=="function"&&s(n,{spawn:(i,o,...d)=>this.spawn(i,o,...d),track:i=>this.track(i)}),!0):!1}$each(e,t,s,n=(i,o)=>o){const i=typeof t=="function"?t:()=>t.get(),o=new Map,d=new Map;this.track(()=>{for(const u of d.values())u.forEach(c=>c());d.clear()}),this.track(k(()=>{const u=i(),c=new Map;for(const[p,g]of u.entries()){const $=n(g,p);if(o.has($))c.set($,o.get($));else{const y=[];c.set($,Y(()=>s(g,p,v=>y.push(v)))),d.set($,y)}}for(const[p,g]of o)c.has(p)||(g.remove(),d.get(p)?.forEach($=>$()),d.delete(p));let m=e.firstChild;for(const p of c.values())p===m?m=m.nextSibling:e.insertBefore(p,m);o.clear();for(const[p,g]of c)o.set(p,g)}))}$condition(e,t,s,n){let i=null;this.track(k(()=>{i&&(i.remove(),i=null);const o=t.get();i=Y(()=>o?s():n?.()??null),i&&e.appendChild(i)}))}$swap(e,t,s,n){let i=null;this.track(k(()=>{i&&(i.destroy(),i=null),e.textContent="";const o=t.get(),d=s[o]??Lt(o,s)??n;d&&(i=Y(()=>{const u=new d;return u.mount(e),u}))})),this.track(()=>i?.destroy())}}async function Ft(r,e,t){const s=document.querySelector(e);s.textContent="";const n=B.get(j);let i=null,o=!1,d=null,u=!!t?.hot?.data.hmr;const c=async m=>{i&&(i.destroy(),i=null,s.textContent=""),m?(d||(d=(await Nt(()=>import("./obs-shell.component-Ca9vlTuj.js"),[])).ObsShellComponent),i=Y(()=>new d)):(!u&&t?.onInit&&(await t.onInit(),u=!0),i=Y(()=>new r)),Y(()=>i.mount(s)),o=m};await c(ye(location.pathname).startsWith("/_obs")),k(()=>{const m=n.route.get().startsWith("/_obs");m!==o&&c(m)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>i?.destroy()),t.hot.accept())}class L extends Error{constructor(e,t,s,n){super(t),this.status=e,this.details=s,this.traceId=n,this.name="ApiError"}}const At=10,de=[];let ce=[],se=null;function Bt(r){de.push(r),de.length>At&&de.shift()}function Dt(r,e,t){const s={code:r,message:e,url:typeof location<"u"?location.href:"",context:[...de],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),ce.push(s),Gt()}function Gt(){se||(se=setTimeout(nt,5e3))}function nt(){if(se&&(clearTimeout(se),se=null),ce.length===0)return;const r=ce;ce=[];for(const e of r){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon("/api/_obs/errors",new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch("/api/_obs/errors",{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&nt()});const qt=3e4,Kt=2,oe=new Map,rt=new WeakMap;function Ut(r){if(r instanceof L)return r.traceId;if(r!=null&&typeof r=="object")return rt.get(r)}async function f(r){if(r.method==="GET"){const e=oe.get(r.url);if(e)return e;const t=He(r,Kt);return oe.set(r.url,t),t.then(()=>oe.delete(r.url),()=>oe.delete(r.url)),t}return He(r,0)}async function He(r,e){const t=r.timeout??qt;let s;for(let n=0;n<=e;n++){const i=crypto.randomUUID();try{return await Vt(Wt(r,i),t)}catch(o){if(s=o,!(o instanceof L)&&o!=null&&typeof o=="object"&&rt.set(o,i),o instanceof L||n===e)break;await new Promise(d=>setTimeout(d,1e3*2**n))}}throw s}async function Wt(r,e){const t={"X-Trace-Id":e},s={method:r.method,headers:t};r.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(r.body));const n=await fetch(r.url,s),i=n.headers.get("x-trace-id")??e;if(Bt({type:"api",detail:`${r.method} ${r.url}`,timestamp:new Date().toISOString()}),!n.ok){const o=await n.json().catch(()=>({error:n.statusText}));throw new L(n.status,o.error??n.statusText,o.details,i)}return n.json()}function Vt(r,e){let t;const s=new Promise((n,i)=>{t=setTimeout(()=>i(new Error("Request timeout")),e)});return Promise.race([r,s]).finally(()=>clearTimeout(t))}async function E(r,e,t){re(()=>{r.set(!0),e.set(null)});try{const s=await t();return r.set(!1),s}catch(s){const n=Yt(s);re(()=>{r.set(!1),e.set(n)}),Dt(n.code,n.message,Ut(s));return}}function Yt(r){return r instanceof L?r.status===401?{code:"auth",message:"Unauthorized"}:r.status===409?{code:"conflict",message:"Data has changed — please try again"}:r.status===400?{code:"validation",message:r.message}:{code:"server",message:"Server error"}:r instanceof Error?r.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}function Qt(r){return{me:()=>f({method:"GET",url:`${r}/auth/me`}),login:e=>f({method:"POST",url:`${r}/auth/login`,body:e}),logout:()=>f({method:"POST",url:`${r}/auth/logout`,body:{}})}}class M{constructor(){this.api=Qt("/api"),this.currentUser=new h(null),this.loading=new h(!1),this.error=new h(null)}async load(){const e=await E(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await E(this.loading,this.error,()=>this.api.login({username:e,password:t}));return s?(this.currentUser.set(s),!0):!1}async logout(){await E(this.loading,this.error,()=>this.api.logout());const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const Me={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},l=Ht({...Me,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},{...Me,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"}),P=r=>`var(--${r})`,a=Rt({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem"}),S=(r=P("radius"))=>`
    border: 1px solid ${P("border")};
    border-radius: ${r};
    background: ${P("btn-bg")};
    color: ${P("text")};
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: ${P("btn-hover")}; }
`,A=()=>`
    border: 1px solid ${P("border")};
    border-radius: ${P("radius")};
    background: ${P("input-bg")};
    color: ${P("text")};
    font-family: inherit;
    &::placeholder { color: ${P("text-muted")}; }
`,z=r=>`
    background: ${P("surface")};
    border: 1px solid ${P("border")};
    border-radius: ${P("radius")};
    box-shadow: ${P("shadow")};
    ${r?.hover?`
    transition: box-shadow 0.2s, border-color 0.2s;
    &:hover { box-shadow: ${P("shadow-elevated")}; }`:""}
`;function Xt(r){return{async me(){return f({method:"GET",url:`${r}/players/me`})},async register(e){return f({method:"POST",url:`${r}/players/register`,body:e})},async updateHandicap(e){return f({method:"POST",url:`${r}/players/me/handicap`,body:e})},async myHandicapHistory(){return f({method:"GET",url:`${r}/players/me/handicap-history`})},async updateProfile(e){return f({method:"POST",url:`${r}/players/me/profile`,body:e})},async search(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/players/search${s?"?"+s:""}`})}}}function Jt(r){return{async list(){return f({method:"GET",url:`${r}/friends`})},async add(e){return f({method:"POST",url:`${r}/friends`,body:e})},async remove(e){return f({method:"DELETE",url:`${r}/friends/${e.friendId}`})}}}function Zt(r){return{async list(){return f({method:"GET",url:`${r}/clubs`})},async get(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/clubs/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${r}/clubs`,body:e})},async update(e){return f({method:"POST",url:`${r}/clubs/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${r}/clubs/${e.id}`})}}}function es(r){return{async list(){return f({method:"GET",url:`${r}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/courses/by-club${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/courses/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${r}/courses`,body:e})},async update(e){return f({method:"POST",url:`${r}/courses/update`,body:e})},async updateHole(e){return f({method:"POST",url:`${r}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/courses/validate${s?"?"+s:""}`})},async remove(e){return f({method:"DELETE",url:`${r}/courses/${e.id}`})}}}function ts(r){return{async listByCourse(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/tees/by-course${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/tees/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${r}/tees`,body:e})},async update(e){return f({method:"POST",url:`${r}/tees/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${r}/tees/${e.id}`})}}}function ss(r){return{async list(){return f({method:"GET",url:`${r}/guest-players`})},async get(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/guest-players/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${r}/guest-players`,body:e})}}}function ns(r){return{async latest(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/handicap/latest${s?"?"+s:""}`})},async history(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/handicap/history${s?"?"+s:""}`})},async record(e){return f({method:"POST",url:`${r}/handicap/record`,body:e})}}}function rs(r){return{async list(){return f({method:"GET",url:`${r}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/rounds/balls${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/rounds/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${r}/rounds`,body:e})},async createFromDraft(e){return f({method:"POST",url:`${r}/rounds/from-draft`,body:e})},async update(e){return f({method:"POST",url:`${r}/rounds/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${r}/rounds/${e.id}`})}}}function is(r){return{async listByRound(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/score-events/by-round${s?"?"+s:""}`})},async append(e){return f({method:"POST",url:`${r}/score-events`,body:e})}}}function os(r){return{async forBall(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/scorecards/for-ball${s?"?"+s:""}`})},async forRound(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/scorecards/for-round${s?"?"+s:""}`})}}}function as(r){return{async forRound(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/leaderboards/for-round${s?"?"+s:""}`})}}}function ls(r){return{async list(){return f({method:"GET",url:`${r}/friendly-rounds`})},async create(e){return f({method:"POST",url:`${r}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/friendly-rounds/by-token${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/friendly-rounds/get${s?"?"+s:""}`})},async balls(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/friendly-rounds/balls${s?"?"+s:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/friendly-rounds/scorecard${s?"?"+s:""}`})},async result(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/friendly-rounds/result${s?"?"+s:""}`})},async score(e){return f({method:"POST",url:`${r}/friendly-rounds/score`,body:e})},async setup(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/friendly-rounds/setup${s?"?"+s:""}`})},async editSetup(e){return f({method:"POST",url:`${r}/friendly-rounds/setup`,body:e})},async remove(e){return f({method:"DELETE",url:`${r}/friendly-rounds/${e.token}`})},async finish(e){return f({method:"POST",url:`${r}/friendly-rounds/finish`,body:e})},async reopen(e){return f({method:"POST",url:`${r}/friendly-rounds/reopen`,body:e})},async join(e){return f({method:"POST",url:`${r}/friendly-rounds/join`,body:e})},async leave(e){return f({method:"POST",url:`${r}/friendly-rounds/leave`,body:e})},async claimGuest(e){return f({method:"POST",url:`${r}/friendly-rounds/claim-guest`,body:e})}}}function ds(r){return{async myRounds(){return f({method:"GET",url:`${r}/dashboard/my-rounds`})}}}function cs(r){return{async courses(){return f({method:"GET",url:`${r}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return f({method:"GET",url:`${r}/setup/tees/by-course${s?"?"+s:""}`})},async formats(){return f({method:"GET",url:`${r}/setup/formats`})}}}const R="/tapscore/".replace(/\/+$/,"")+"/api",_={players:Xt(R),friends:Jt(R),clubs:Zt(R),courses:es(R),tees:ts(R),guestPlayers:ss(R),handicap:ns(R),rounds:rs(R),scoreEvents:is(R),scorecards:os(R),leaderboards:as(R),friendlyRounds:ls(R),dashboard:ds(R),setup:cs(R)};function us(r){return[...r.played?["Played"]:[],...r.created?["Created"]:[]].join(" · ")}function hs(r,e){const t=new Map;for(const s of e)t.set(s.round.id,{round:s.round,token:s.friendlyRound.shareToken,played:!1,created:!0});for(const s of r){const n=t.get(s.round.id);n?n.played=!0:t.set(s.round.id,{round:s.round,token:s.shareToken,played:!0,created:!1})}return[...t.values()].sort((s,n)=>n.round.date.localeCompare(s.round.date)||s.round.id.localeCompare(n.round.id))}function ps(r,e){return r.filter(t=>t.played&&!t.created&&!e.has(t.round.id)).slice().sort((t,s)=>s.round.date.localeCompare(t.round.date)||t.round.id.localeCompare(s.round.id))}function Le(r,e){return r.some(t=>t.round.id===e)?r.filter(t=>t.round.id!==e):r}const it="tapscore.seen-rounds.v1",ms=500;function pe(){try{return typeof localStorage<"u"?localStorage:null}catch{return null}}function we(r=pe()){if(!r)return[];let e;try{e=r.getItem(it)}catch{return[]}if(!e)return[];try{const t=JSON.parse(e);return Array.isArray(t)?t.filter(s=>typeof s=="string"):[]}catch{return[]}}function Fe(r=pe()){return new Set(we(r))}function ot(r,e){try{r.setItem(it,JSON.stringify(e))}catch{}}function fs(r,e=pe()){if(!e)return[];const t=we(e).filter(n=>n!==r),s=[r,...t].slice(0,ms);return ot(e,s),s}function at(r,e=pe()){if(!e)return[];const t=we(e),s=t.filter(n=>n!==r);return s.length!==t.length&&ot(e,s),s}const lt="tapscore.device-rounds.v1",gs=50;function xe(){try{return typeof localStorage<"u"?localStorage:null}catch{return null}}function $e(r=xe()){if(!r)return[];let e;try{e=r.getItem(lt)}catch{return[]}if(!e)return[];try{const t=JSON.parse(e);return Array.isArray(t)?t.filter(bs):[]}catch{return[]}}function bs(r){if(typeof r!="object"||r===null)return!1;const e=r;return typeof e.token=="string"&&typeof e.courseName=="string"&&(e.status==="not_started"||e.status==="active"||e.status==="complete")&&typeof e.lastSeenAt=="string"}function dt(r,e){try{r.setItem(lt,JSON.stringify(e))}catch{}}function ue(r,e=xe()){if(!e)return[];const t=$e(e).filter(n=>n.token!==r.token),s=[r,...t].slice(0,gs);return dt(e,s),s}function ct(r,e=xe()){if(!e)return[];const t=$e(e),s=t.filter(n=>n.token!==r);return s.length!==t.length&&dt(e,s),s}class ke{mine=new h(null);mineLoading=new h(!1);mineError=new h(null);myRounds=new w(()=>{const e=this.mine.get();return e?hs(e.produced,e.created):[]});deviceRounds=new h([]);seenIds=new h(Fe());newRounds=new w(()=>ps(this.myRounds.get(),this.seenIds.get()));async loadMine(){this.seenIds.set(Fe());const e=await E(this.mineLoading,this.mineError,()=>_.dashboard.myRounds());e&&this.mine.set(e)}loadDevice(){this.deviceRounds.set($e())}async remove(e,t){try{await _.friendlyRounds.remove({token:e})}catch{return!1}const s=this.mine.get();return s&&this.mine.set({produced:Le(s.produced,t),created:Le(s.created,t)}),this.deviceRounds.set(ct(e)),at(t),!0}}const ys=b(`
    <nav class="tabbar" bind="root">
        <a bind="homeLink" href="/">
            <span class="tabbar__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v10h12V10"/><path d="M10 20v-5.5h4V20"/>
                </svg>
                <span bind="badge" class="tabbar__badge"></span>
            </span>
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
`);class _s extends T{static styles=`
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

                & .tabbar__icon { position: relative; display: inline-flex; }

                /* "New — you were added" badge on the Home tab: a small accent
                   pill with the count. Hidden entirely at 0 (kept honest). */
                & .tabbar__badge {
                    position: absolute;
                    top: -4px;
                    right: -8px;
                    min-width: 16px;
                    height: 16px;
                    padding: 0 4px;
                    box-sizing: border-box;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    background: ${l("accent")};
                    color: ${l("topbar-bg")};
                    font-size: 0.62rem;
                    font-weight: 800;
                    line-height: 1;
                    border-radius: ${l("radius-pill")};

                    &.show { display: inline-flex; }
                }

                &.active { color: ${l("accent")}; }
            }
        }
    `;router=this.inject(j);auth=this.inject(M);landing=this.inject(ke);newCount=new w(()=>this.auth.currentUser.get()?this.landing.newRounds.get().length:0);render(){return this.wire(ys,{root:{className:()=>{const e=this.router.route.get();return!this.auth.currentUser.get()||e==="/login"||e==="/round"?"tabbar hidden":"tabbar"}},homeLink:this.router.link("/"),badge:{textContent:()=>{const e=this.newCount.get();return e===0?"":String(e)},className:()=>this.newCount.get()===0?"tabbar__badge":"tabbar__badge show"},friendsLink:this.router.link("/friends"),profileLink:this.router.link("/profile")})}}const Ee=class Ee extends T{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(k(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};Ee.styles=`
        .ui-overlay {
            position: fixed;
            inset: 0;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
        }
        .ui-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }
    `;let _e=Ee;const N=r=>`var(--${r})`,Ce=class Ce extends T{render(){const e=document.createElement("div");this.spawn(_e,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const t=document.createElement("h2");t.className="ui-confirm__title",t.textContent=this.props.title??"Confirm",this.dialogEl.appendChild(t);const s=document.createElement("p");if(s.className="ui-confirm__message",typeof this.props.message=="function"){const d=this.props.message;this.track(k(()=>{s.textContent=d()}))}else s.textContent=this.props.message;this.dialogEl.appendChild(s);const n=document.createElement("div");n.className="ui-confirm__actions";const i=document.createElement("button");i.className="ui-confirm__btn ui-confirm__btn--cancel",i.textContent=this.props.cancelLabel??"Cancel",i.addEventListener("click",d=>{d.stopPropagation(),this.handleCancel()}),n.appendChild(i);const o=document.createElement("button");return o.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",o.textContent=this.props.confirmLabel??"Confirm",o.addEventListener("click",d=>{d.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),n.appendChild(o),this.dialogEl.appendChild(n),this.dialogEl.addEventListener("click",d=>d.stopPropagation()),e.appendChild(this.dialogEl),this.track(k(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};Ce.styles=`
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${N("surface")};
            border: 1px solid ${N("border")};
            border-radius: ${N("radius")};
            box-shadow: ${N("shadow-elevated")};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.15s, transform 0.15s;
        }
        .ui-confirm.open {
            opacity: 1;
            pointer-events: auto;
            transform: translate(-50%, -50%) scale(1);
        }
        .ui-confirm__title {
            padding: 16px 20px 0;
            margin: 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: ${N("text")};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${N("text")};
        }
        .ui-confirm__actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 0 20px 16px;
        }
        .ui-confirm__btn {
            padding: 8px 16px;
            font-size: 0.875rem;
            font-family: inherit;
            font-weight: 500;
            border: 1px solid ${N("border")};
            border-radius: ${N("radius")};
            cursor: pointer;
            transition: background 0.15s;
        }
        .ui-confirm__btn--cancel {
            background: ${N("btn-bg")};
            color: ${N("text")};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${N("btn-hover")};
        }
        .ui-confirm__btn--confirm {
            background: ${N("primary")};
            color: #fff;
            border-color: ${N("primary")};
        }
        .ui-confirm__btn--confirm:hover {
            filter: brightness(0.9);
        }
        .ui-confirm__btn--danger {
            background: ${N("error")};
            color: #fff;
            border-color: ${N("error")};
        }
        .ui-confirm__btn--danger:hover {
            filter: brightness(0.9);
        }
    `;let Q=Ce;function vs(r){const e=typeof navigator<"u"?navigator.language:void 0;return typeof e=="string"&&e.toLowerCase().startsWith("sv")?"sv":"en"}function ws(){return vs()}class he{loading=new h(!1);error=new h(null);descriptors=new h([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await E(this.loading,this.error,()=>_.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=ws()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:s.teamSize?.min??2,max:s.teamSize?.max??2},...s.teamCount?{teamCount:s.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}acceptsSideSubjects(e){const t=this.byId(e);return!t||this.isSideFormat(e)?!1:(t.requirements.scoreEntry?.metadata?.length??0)===0}}function ut(r){const e=B.get(he);return e.load(),e.labelOf(r.formatId)??`${r.scoringMode} · ${r.teamShape}`}function xs(r){return r.map(e=>({key:e.round.id,token:e.token,roundId:e.round.id,courseName:e.round.courseNameSnapshot??"",status:e.round.status,completedAt:e.round.completedAt,lastActivityAt:e.round.date,roleLabel:us(e)||null,date:e.round.date,formats:e.round.formatSlots.map(ut).join(" · ")}))}function $s(r){return r.map(e=>({key:e.token,token:e.token,roundId:null,courseName:e.courseName,status:e.status,completedAt:e.completedAt??null,lastActivityAt:e.lastSeenAt,roleLabel:null,date:null,formats:null}))}const ne={fromMyRounds:xs,fromDeviceRounds:$s},ks=14,Ss=1440*60*1e3;function Z(r,e){return e(r)}function Is(r,e,t,s=ks){const n=e-s*Ss,i=[],o=[];for(const d of r){const u=Z(d,t);if(u.status==="complete"){const c=u.completedAt?Date.parse(u.completedAt):NaN;(Number.isNaN(c)||c>=n)&&o.push(d)}else i.push(d)}return i.sort((d,u)=>Ae(Z(d,t).lastActivityAt,Z(u,t).lastActivityAt)),o.sort((d,u)=>Ae(Z(d,t).completedAt,Z(u,t).completedAt)),{ongoing:i,finished:o}}function Ae(r,e){const t=r?Date.parse(r):NaN,s=e?Date.parse(e):NaN,n=Number.isNaN(t)?Number.NEGATIVE_INFINITY:t,i=Number.isNaN(s)?Number.NEGATIVE_INFINITY:s;return n===i?0:i-n}const Ts=b(`
    <div class="landing">
        <header class="landing__head">
            <div class="landing__flag">⛳</div>
            <h1>tapscore</h1>
            <p>Scores, settled on the green. No sign-in needed.</p>
        </header>
        <button bind="createBtn" class="landing__create" type="button">
            <span class="landing__create-plus">+</span> Create round
        </button>

        <div bind="newSection" class="landing__section-block landing__new">
            <div class="landing__section">
                <span class="landing__section-title">New — you were added</span>
                <span bind="newCount" class="landing__count landing__new-count"></span>
            </div>
            <div bind="newList" class="landing__list"></div>
        </div>

        <div bind="ongoingSection" class="landing__section-block">
            <div class="landing__section">
                <span class="landing__section-title">Ongoing</span>
                <span bind="ongoingCount" class="landing__count"></span>
            </div>
            <div bind="ongoingList" class="landing__list"></div>
        </div>

        <div bind="finishedSection" class="landing__section-block">
            <div class="landing__section">
                <span class="landing__section-title">Recently finished</span>
                <span bind="finishedCount" class="landing__count"></span>
            </div>
            <div bind="finishedList" class="landing__list"></div>
        </div>

        <div bind="empty" class="landing__empty">No rounds yet — create one to tee off.</div>

        <button bind="history" class="landing__history" type="button">See all rounds →</button>
        <button bind="signin" class="landing__signin" type="button">Sign in</button>
        <div bind="confirmHost"></div>
    </div>
`),Es='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',Cs=b(`
    <div class="round-row">
        <button bind="row" type="button" class="round-row__main">
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
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${Es}</button>
    </div>
`),ht={not_started:"Not started",active:"Live",complete:"Finished"};class Be extends T{static styles=`
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
                ${S()}
                background: ${l("primary")};
                color: ${l("primary-text")};
                border: none;
                box-shadow: ${l("shadow-elevated")};
                &:hover { background: ${l("primary")}; }

                & .landing__create-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .landing__section-block {
                margin-bottom: ${a("xl")};
                &.hidden { display: none; }
            }

            /* The "New — you were added" strip reads as a highlight: its count
               is an accent pill so a fresh add draws the eye at the top. */
            & .landing__new-count {
                background: ${l("accent-soft")};
                color: ${l("accent")};
                font-weight: 700;
                border-radius: ${l("radius-pill")};
                padding: 1px 9px;
                font-size: 0.8rem;
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

            & .round-row__role {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: ${l("accent")};
                flex-shrink: 0;

                &.hidden { display: none; }
            }

            & .landing__list {
                display: flex;
                flex-direction: column;
                gap: ${a("sm")};
            }

            & .round-row {
                display: flex;
                align-items: stretch;
                ${z({hover:!0})}

                & .round-row__main {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${a("xs")};
                    padding: ${a("md")} 0 ${a("md")} ${a("lg")};
                    text-align: left;
                    font-family: inherit;
                    background: none;
                    border: none;
                    cursor: pointer;
                    &:disabled { cursor: default; }
                }

                /* Danger stays quiet until touched: muted glyph, small icon,
                   its own 44px-wide tap column at the card's edge. */
                & .round-row__del {
                    flex: 0 0 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    color: ${l("text-muted")};
                    cursor: pointer;
                    border-radius: 0 ${l("radius")} ${l("radius")} 0;

                    & svg { width: 17px; height: 17px; }
                    &:hover, &:active { color: ${l("error")}; }
                    &:focus-visible { outline: 2px solid ${l("error")}; outline-offset: -2px; }
                    &.hidden { display: none; }
                }

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

                    &.hidden { display: none; }
                }
                & .round-row__formats {
                    text-align: right;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            & .landing__history {
                display: block;
                margin: ${a("sm")} auto 0;
                padding: ${a("sm")} ${a("lg")};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${l("accent")};
                cursor: pointer;

                &.hidden { display: none; }
            }

            & .landing__signin {
                display: block;
                &.hidden { display: none; }
                margin: ${a("lg")} auto 0;
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

        /* App-level accessibility override for the framework confirm dialog. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;svc=this.inject(ke);auth=this.inject(M);router=this.inject(j);loggedIn=new w(()=>this.auth.currentUser.get()!==null);rows=new w(()=>this.loggedIn.get()?ne.fromMyRounds(this.svc.myRounds.get()):ne.fromDeviceRounds(this.svc.deviceRounds.get()));parts=new w(()=>Is(this.rows.get(),Date.now(),e=>e));ongoing=new w(()=>this.parts.get().ongoing);finished=new w(()=>this.parts.get().finished);newRows=new w(()=>this.loggedIn.get()?ne.fromMyRounds(this.svc.newRounds.get()):[]);deleteOpen=new h(!1);deleteTarget=new h(null);askDelete(e,t,s){this.deleteTarget.set({token:e,roundId:t,name:s}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?this.svc.loadMine():this.svc.loadDevice();const e=()=>this.rows.get().length>0,t=this.wire(Ts,{createBtn:{onclick:()=>this.router.navigate("/create")},signin:{className:()=>this.loggedIn.get()?"landing__signin hidden":"landing__signin",onclick:()=>this.router.navigate("/login")},history:{className:()=>e()?"landing__history":"landing__history hidden",onclick:()=>this.router.navigate("/history")},newSection:{className:()=>this.newRows.get().length>0?"landing__section-block landing__new":"landing__section-block landing__new hidden"},newCount:()=>{const n=this.newRows.get().length;return n===0?"":String(n)},ongoingSection:{className:()=>this.ongoing.get().length>0?"landing__section-block":"landing__section-block hidden"},ongoingCount:()=>{const n=this.ongoing.get().length;return n===0?"":String(n)},finishedSection:{className:()=>this.finished.get().length>0?"landing__section-block":"landing__section-block hidden"},finishedCount:()=>{const n=this.finished.get().length;return n===0?"":String(n)},empty:{className:()=>e()?"landing__empty hidden":"landing__empty"}});this.$each(this.ref(t,"newList"),this.newRows,(n,i,o)=>this.roundRow(n,o),n=>n.key),this.$each(this.ref(t,"ongoingList"),this.ongoing,(n,i,o)=>this.roundRow(n,o),n=>n.key),this.$each(this.ref(t,"finishedList"),this.finished,(n,i,o)=>this.roundRow(n,o),n=>n.key),this.spawn(Q,this.ref(t,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const n=this.deleteTarget.get();return`Delete ${n?`“${n.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const n=this.deleteTarget.get();n&&this.svc.remove(n.token,n.roundId)}});const s=n=>{n.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",s),this.track(()=>window.removeEventListener("keydown",s)),t}roundRow(e,t){return this.wireEl(Cs,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},course:()=>e.courseName||"Round",role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>ht[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>e.date??"",formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",e.courseName||"this round")}}},t)}}function Ns(r){return[...r].sort((e,t)=>{const s=De(e),n=De(t);return n!==s?n-s:e.key.localeCompare(t.key)})}function De(r){const e=r.completedAt??r.lastActivityAt,t=e?Date.parse(e):NaN;return Number.isNaN(t)?Number.NEGATIVE_INFINITY:t}const Ps=b(`
    <div class="history">
        <button bind="back" class="history__back" type="button">← Home</button>
        <h1 class="history__title">All rounds</h1>
        <div bind="empty" class="history__empty">No rounds yet — create one to tee off.</div>
        <div bind="list" class="history__list"></div>
        <div bind="confirmHost"></div>
    </div>
`),zs='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',js=b(`
    <div class="round-row">
        <button bind="row" type="button" class="round-row__main">
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
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${zs}</button>
    </div>
`);class Os extends T{static styles=`
        .history {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .history__back {
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

            & .history__title {
                margin: 0 0 ${a("lg")};
                font-family: ${l("font-display")};
                font-weight: 600;
                font-size: 1.8rem;
                letter-spacing: -0.02em;
                color: ${l("text")};
            }

            & .history__empty {
                color: ${l("text-muted")};
                font-size: 0.9rem;
                padding: ${a("lg")} 0;
                &.hidden { display: none; }
            }

            & .history__list {
                display: flex;
                flex-direction: column;
                gap: ${a("sm")};
            }

            & .round-row {
                display: flex;
                align-items: stretch;
                ${z({hover:!0})}

                & .round-row__main {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${a("xs")};
                    padding: ${a("md")} 0 ${a("md")} ${a("lg")};
                    text-align: left;
                    font-family: inherit;
                    background: none;
                    border: none;
                    cursor: pointer;
                    &:disabled { cursor: default; }
                }

                & .round-row__del {
                    flex: 0 0 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    color: ${l("text-muted")};
                    cursor: pointer;
                    border-radius: 0 ${l("radius")} ${l("radius")} 0;

                    & svg { width: 17px; height: 17px; }
                    &:hover, &:active { color: ${l("error")}; }
                    &:focus-visible { outline: 2px solid ${l("error")}; outline-offset: -2px; }
                    &.hidden { display: none; }
                }

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
                & .round-row__role {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: ${l("accent")};
                    flex-shrink: 0;
                    &.hidden { display: none; }
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
                    &.hidden { display: none; }
                }
                & .round-row__formats {
                    text-align: right;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;svc=this.inject(ke);auth=this.inject(M);router=this.inject(j);loggedIn=new w(()=>this.auth.currentUser.get()!==null);rows=new w(()=>Ns(this.loggedIn.get()?ne.fromMyRounds(this.svc.myRounds.get()):ne.fromDeviceRounds(this.svc.deviceRounds.get())));deleteOpen=new h(!1);deleteTarget=new h(null);askDelete(e,t,s){this.deleteTarget.set({token:e,roundId:t,name:s}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?this.svc.loadMine():this.svc.loadDevice();const e=this.wire(Ps,{back:{onclick:()=>this.router.navigate("/")},empty:{className:()=>this.rows.get().length===0?"history__empty":"history__empty hidden"}});this.$each(this.ref(e,"list"),this.rows,(s,n,i)=>this.roundRow(s,i),s=>s.key),this.spawn(Q,this.ref(e,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const s=this.deleteTarget.get();return`Delete ${s?`“${s.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const s=this.deleteTarget.get();s&&this.svc.remove(s.token,s.roundId)}});const t=s=>{s.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t)),e}roundRow(e,t){return this.wireEl(js,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},course:()=>e.courseName||"Round",role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>ht[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>e.date??"",formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",e.courseName||"this round")}}},t)}}const Rs=180,Ge=4,Hs=12;function X(r,e){return e<=0?0:Math.max(0,Math.min(e-1,r))}function Ms(r){const{dragDistance:e,velocity:t,itemWidth:s}=r;if(Math.abs(e)<Hs)return 0;const n=e+t*Rs,i=Math.round(-n/s);return Math.max(-Ge,Math.min(Ge,i))}const qe="tapscore:pending-scores:v1",Ls=336*60*60*1e3,Ke=200;function Fs(){try{return globalThis.localStorage??null}catch{return null}}function As(r){if(typeof r!="object"||r===null)return!1;const e=r;return typeof e.token=="string"&&typeof e.ballId=="string"&&typeof e.playHoleId=="string"&&(typeof e.strokes=="number"||e.strokes===null)&&(e.eventType==="score_entered"||e.eventType==="score_cleared")&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class Bs{entries=[];storage;constructor(e=Fs(),t=Date.now()){this.storage=e,this.entries=this.load();const s=this.applyHygiene(t);s.length!==this.entries.length&&(this.entries=s,this.persist())}enqueue(e){const t=this.entries.findIndex(s=>s.token===e.token&&s.ballId===e.ballId&&s.playHoleId===e.playHoleId);t>=0?this.entries[t]=e:this.entries.push(e),this.entries=this.applyHygiene(e.queuedAt),this.persist()}remove(e){const t=this.entries.filter(s=>s.clientEventId!==e);t.length!==this.entries.length&&(this.entries=t,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(s=>e-s.queuedAt<=Ls);return t.length>Ke?t.slice(t.length-Ke):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(qe);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(As):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(qe,JSON.stringify(this.entries))}catch{}}}const Ds=["1st","2nd","3rd","4th","5th","6th","7th","8th"],U=(r,e)=>`${r}|${e}`;function pt(r){return r.players.map(e=>e.displayName).join(" & ")||r.label||"Ball"}function Gs(r,e,t){return r?!(r.minPar!==void 0&&e<r.minPar||r.maxPar!==void 0&&e>r.maxPar||r.pars&&!r.pars.includes(e)||r.holes&&!r.holes.includes(t)):!0}class J{constructor(e=new Bs){this.queue=e}queue;loading=new h(!1);error=new h(null);friendlyRound=new h(null);round=new h(null);balls=new h([]);scorecards=new h([]);cells=new h(new Map);result=new h(null);resultLoading=new h(!1);resultError=new h(null);resultCursor=null;holeIdx=new h(0);groupIdx=new h(0);selectedSlot=new h(null);token=null;loadSeq=0;resultSeq=0;flushing=!1;pendingSlotIndex=null;async loadByToken(e,t){const s=e!==this.token;this.token=e;const n=++this.loadSeq;s&&this.resetForNewToken(t),B.get(he).load();const i=await E(this.loading,this.error,()=>_.friendlyRounds.byToken({token:e}));if(!i||n!==this.loadSeq||e!==this.token)return;if(this.friendlyRound.set(i.friendlyRound),this.round.set(i.round),ue({token:e,courseName:i.round.courseNameSnapshot??"",status:i.round.status,completedAt:i.round.completedAt,lastSeenAt:new Date().toISOString()}),B.get(M).currentUser.get()&&fs(i.round.id),this.pendingSlotIndex!==null){const c=i.round.formatSlots[this.pendingSlotIndex]?.slotDefId??null;this.pendingSlotIndex=null,c!==null&&this.selectedSlot.set(c)}const[o,d]=await Promise.all([_.friendlyRounds.balls({token:e}).catch(()=>[]),_.friendlyRounds.scorecard({token:e}).catch(()=>[])]);n!==this.loadSeq||e!==this.token||(this.cells.set(new Map),this.scorecards.set(d),this.balls.set(o),await this.flushPending())}deleting=new h(!1);async deleteRound(){const e=this.token;if(!e||this.deleting.get())return!1;this.deleting.set(!0);try{await _.friendlyRounds.remove({token:e}),ct(e);const t=this.round.get()?.id;return t&&at(t),!0}catch{return!1}finally{this.deleting.set(!1)}}finishing=new h(!1);async finishRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await _.friendlyRounds.finish({token:e}),s=this.round.get();return e===this.token&&s&&(this.round.set({...s,status:t.status,completedAt:t.completedAt}),ue({token:e,courseName:s.courseNameSnapshot??"",status:t.status,completedAt:t.completedAt,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async reopenRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await _.friendlyRounds.reopen({token:e}),s=this.round.get();return e===this.token&&s&&(this.round.set({...s,status:t.status,completedAt:null}),ue({token:e,courseName:s.courseNameSnapshot??"",status:t.status,completedAt:null,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async loadResult(){const e=this.token;if(!e)return;const t=++this.resultSeq,s=await E(this.resultLoading,this.resultError,()=>_.friendlyRounds.result({token:e}));t!==this.resultSeq||e!==this.token||s&&(this.resultCursor=s.cursor,s.unchanged||this.result.set(s.result))}async pollResult(){const e=this.token;if(!e)return;const t=++this.resultSeq;let s;try{s=await _.friendlyRounds.result({token:e,...this.resultCursor!==null?{cursor:this.resultCursor}:{}})}catch{return}t!==this.resultSeq||e!==this.token||(this.resultCursor=s.cursor,s.unchanged||this.result.set(s.result))}ballNameById=new w(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,pt(t));for(const t of this.result.get()?.slots??[])for(const s of t.subjectLabels??[])e.set(s.ballId,s.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}groupLabelByBallId=new w(()=>{const e=new Map,t=this.groups();return t.length<2||t.forEach((s,n)=>{for(const i of s.ballIds)e.set(i,`Group ${n+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}selectedSlotDefId(){const e=this.round.get()?.formatSlots??[];if(e.length===0)return null;const t=this.selectedSlot.get();return t!==null&&e.some(s=>s.slotDefId===t)?t:e[0]?.slotDefId??null}selectSlot(e){this.selectedSlot.set(e)}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return X(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),s=t?.playHoles.find(o=>o.id===e);if(!t||!s)return"";const n=t.playHoles.filter(o=>o.courseHoleNumber===s.courseHoleNumber).sort((o,d)=>o.ordinal-d.ordinal);if(n.length===1)return`${s.courseHoleNumber}`;const i=n.findIndex(o=>o.id===e);return`${s.courseHoleNumber} (${Ds[i]??`${i+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(X(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(X(this.holeIndex()+1,this.playedOrder().length))}strokesFor(e,t){const s=this.cells.get().get(U(e,t));return s?s.strokes:this.scorecards.get().find(o=>o.ballId===e)?.holes.find(o=>o.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(U(e,t))?.status??null}metadataFor(e,t,s){const n=this.cells.get().get(U(e,t));return n&&n.metadata!==void 0?n.metadata?.[s]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[s]}metadataInputs(){const e=B.get(he),t=this.round.get()?.formatSlots??[],s=[],n=new Set;for(const i of t){const o=e.byId(i.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of o)n.has(d.key)||(n.add(d.key),s.push(d))}return s}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>Gs(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,s,n){const i=U(e,t),o=crypto.randomUUID();this.patchCell(i,{strokes:s,metadata:n,status:"saving",clientEventId:o});const d=this.token;d&&(this.enqueue(d,e,t,s,n,o),await this.post(d,e,t,s,n,o))}async retry(e,t){const s=U(e,t),n=this.cells.get().get(s);if(!n)return;this.patchCell(s,{...n,status:"saving"});const i=this.token;i&&(this.enqueue(i,e,t,n.strokes,n.metadata,n.clientEventId),await this.post(i,e,t,n.strokes,n.metadata,n.clientEventId))}async flushPending(){const e=this.token;if(!(!e||this.flushing)){this.flushing=!0;try{for(const t of this.queue.entriesFor(e)){if(e!==this.token)return;this.patchCell(U(t.ballId,t.playHoleId),{strokes:t.strokes,metadata:t.metadata,status:"saving",clientEventId:t.clientEventId}),await this.post(e,t.ballId,t.playHoleId,t.strokes,t.metadata,t.clientEventId)}}finally{this.flushing=!1}}}enqueue(e,t,s,n,i,o){this.queue.enqueue({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:o,...i!==void 0?{metadata:i}:{},queuedAt:Date.now()})}async post(e,t,s,n,i,o){const d=U(t,s);try{await _.friendlyRounds.score({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:o,...i!=null?{metadata:i}:{}}),this.queue.remove(o);const u=this.cells.get().get(d);u&&u.clientEventId===o&&this.patchCell(d,{...u,status:"saved"});const c=this.round.get();e===this.token&&c&&c.status==="not_started"&&this.round.set({...c,status:"active"})}catch{const u=this.cells.get().get(d);u&&u.clientEventId===o&&this.patchCell(d,{...u,status:"error"})}}patchCell(e,t){const s=new Map(this.cells.get());s.set(e,t),this.cells.set(s)}resetForNewToken(e){this.resultSeq++,this.resultCursor=null,this.friendlyRound.set(null),this.round.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(e?.holeIdx??0),this.groupIdx.set(e?.groupIdx??0);const t=e?.selectedSlot;this.pendingSlotIndex=null,typeof t=="string"?this.selectedSlot.set(t):typeof t=="number"?(this.pendingSlotIndex=t,this.selectedSlot.set(null)):this.selectedSlot.set(null)}}const W=60,Ue=8,ve=4,qs=Array.from({length:ve*2+1},(r,e)=>e-ve),Ks="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",Us=b(`
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
`),Ws=b(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),Vs=b(`
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
`),Ys=b(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),We=b(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),Qs=b(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`);class Xs extends T{static styles=`
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
            right: ${Ue}px;
            width: ${W*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-ve*W}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${W}px;
            width: ${W}px;
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

            & .se-row__scores { display: flex; align-items: center; padding-right: ${Ue}px; flex-shrink: 0; }
            & .se-row__slot { width: ${W}px; display: flex; align-items: center; justify-content: center; }
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
    `;svc=this.inject(J);holeIdx=this.svc.holeIdx;modalOpen=new h(!1);currentBallIdx=new h(0);extendedOpen=new h(!1);extendedScore=new h(10);statsOpen=new h(!1);pendingMeta=new h({});lastMetaKey=null;toastMsg=new h(null);dragOffset=new h(0);transitioning=new h(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new w(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[X(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(s=>[s.id,s]));return e.ballIds.map(s=>t.get(s)).filter(s=>!!s)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>pt(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);toParValue=e=>{let t=0,s=0,n=!1;for(const i of this.playedOrder()){const o=this.svc.strokesFor(e.id,i.playHoleId);o!==null&&o>0&&(t+=o,s+=this.parFor(i.playHoleId),n=!0)}return n?t-s:null};toParText=e=>{const t=this.toParValue(e);return t===null?"–":t===0?"E":t>0?`+${t}`:`${t}`};toParClass=e=>{const t=this.toParValue(e);return`se-row__topar ${t===null||t===0?"even":t<0?"under":"over"}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const s=e-t;return s<=-4||s>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(s)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer)}),this.track(k(()=>{const i=this.ballsInGroup().length;i>0&&this.currentBallIdx.get()>=i&&this.currentBallIdx.set(0)}));const e=this.wire(Us,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1)}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const i=this.currentHole();return i?`Hole ${this.occLabel(i.playHoleId)} · Par ${this.parFor(i.playHoleId)}`:""},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>this.statsOpen.set(!1)},statsHole:()=>{const i=this.currentHole();return i?`Hole ${this.occLabel(i.playHoleId)} · Par ${this.parFor(i.playHoleId)}`:""},statsTitle:()=>{const i=this.ballsInGroup()[this.currentBallIdx.get()];return i?this.ballName(i):""},statsScore:()=>{const i=this.ballsInGroup()[this.currentBallIdx.get()],o=this.currentHole();return!i||!o?"":this.displayScore(this.svc.strokesFor(i.id,o.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.advance()}}}),t=this.ref(e,"viewport"),s=this.ref(e,"track");this.bindCarouselPointer(t,s),this.track(k(()=>{s.style.transition=this.transitioning.get()?Ks:"none",s.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(s,new w(()=>qs),(i,o,d)=>this.holeItem(i,d),i=>i),this.$each(this.ref(e,"rows"),new w(()=>{const i=this.playedOrder(),o=this.holeIndex(),d=i[o];if(!d)return[];const u=o>0?i[o-1].playHoleId:null;return this.ballsInGroup().map(c=>({ball:c,ph:d.playHoleId,prevPh:u}))}),(i,o,d)=>this.playerRow(i.ball,i.ph,i.prevPh,d),i=>`${i.ball.id}|${i.ph}`),this.$each(this.ref(e,"modalList"),new w(()=>this.ballsInGroup()),(i,o,d)=>this.modalRow(i,o,d),i=>i.id);const n=this.ref(e,"keys");for(const i of[1,2,3,4,5,6,7,8,9])n.appendChild(this.numberKey(i));return n.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),n.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),n.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(e,"statsBody"),new w(()=>this.metaInputs()),(i,o,d)=>this.metaChip(i,d),i=>i.key),this.track(k(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null;return}const i=this.ballsInGroup()[this.currentBallIdx.get()],o=this.currentHole();if(!i||!o)return;const d=`${i.id}|${o.playHoleId}`;if(d===this.lastMetaKey)return;this.lastMetaKey=d;const u={};for(const c of this.metaInputs())u[c.key]=this.svc.metadataFor(i.id,o.playHoleId,c.key)===!0;this.pendingMeta.set(u)})),e}holeItem(e,t){return this.wireEl(Ws,{item:{className:()=>{const s=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${s?" gone":""}`}},hnum:{textContent:()=>{const s=this.occAtOffset(e);return s?this.occLabel(s.playHoleId):""}},hpar:{textContent:()=>{const s=this.occAtOffset(e);return s?`Par ${this.parFor(s.playHoleId)}`:""}}},t)}playerRow(e,t,s,n){return this.wireEl(Vs,{name:{textContent:this.ballName(e)},topar:{textContent:()=>this.toParText(e),className:()=>this.toParClass(e)},prev:{textContent:()=>s?this.displayScore(this.svc.strokesFor(e.id,s)):""},cval:{textContent:()=>this.displayScore(this.svc.strokesFor(e.id,t))},circle:{className:()=>this.svc.strokesFor(e.id,t)===null?"se-row__circle empty":"se-row__circle",onclick:()=>this.openModalForBall(e.id)}},n)}modalRow(e,t,s){const n=e.players.length>1?`Team · CH ${e.courseHandicap}`:`CH ${e.players[0]?.courseHandicap??e.courseHandicap}`;return this.wireEl(Ys,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.currentBallIdx.set(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:n},mval:{textContent:()=>{const i=this.currentHole();return i?this.displayScore(this.svc.strokesFor(e.id,i.playHoleId)):"–"}}},s)}numberKey(e){return this.wireEl(We,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,s,n){return this.wireEl(We,{key:{className:s,onclick:n},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(s=>s.id===e);this.currentBallIdx.set(t<0?0:t),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.modalOpen.set(!0)}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){const t=this.ballsInGroup(),s=this.currentHole(),n=t[this.currentBallIdx.get()];if(!s||!n)return;const i=e===null?void 0:this.metaSnapshot();this.svc.setScore(n.id,s.playHoleId,e,i),e!==null&&e>0&&this.metaInputs().length>0?this.statsOpen.set(!0):this.advance()}hasMoreUnscored=()=>{const e=this.ballsInGroup(),t=this.currentHole();if(!t)return!1;const s=this.currentBallIdx.get();return e.some((n,i)=>i!==s&&this.svc.strokesFor(n.id,t.playHoleId)===null)};metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),s={};for(const n of e)s[n.key]=t[n.key]===!0;return s}setMeta(e,t){const s=this.pendingMeta.get();this.pendingMeta.set({...s,[e]:t});const n=this.ballsInGroup()[this.currentBallIdx.get()],i=this.currentHole();if(!n||!i)return;const o=this.svc.strokesFor(n.id,i.playHoleId);o!==null&&this.svc.setScore(n.id,i.playHoleId,o,this.metaSnapshot())}metaChip(e,t){return this.wireEl(Qs,{glabel:{textContent:e.label},miss:{className:()=>this.pendingMeta.get()[e.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(e.key,!1)},hit:{className:()=>this.pendingMeta.get()[e.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(e.key,!0)}},t)}advance(){const e=this.ballsInGroup(),t=this.currentHole();if(!t)return;const s=u=>this.svc.strokesFor(e[u].id,t.playHoleId)!==null,n=this.currentBallIdx.get();for(let u=n+1;u<e.length;u++)if(!s(u))return this.currentBallIdx.set(u);for(let u=0;u<n;u++)if(!s(u))return this.currentBallIdx.set(u);const i=this.playedOrder();if(this.holeIndex()>=i.length-1){this.flash("Round complete"),this.modalOpen.set(!1);return}this.flash(`Hole ${this.occLabel(t.playHoleId)} done`);const d=t.playHoleId;this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===d&&(this.holeIdx.set(X(this.holeIndex()+1,this.playedOrder().length)),this.currentBallIdx.set(0))},700)}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*W),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(X(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",n=>{n.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",n=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:n.pointerId,startX:n.clientX,startY:n.clientY,lastX:n.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(n.pointerId))}),e.addEventListener("pointermove",n=>{const i=this.ptr;if(!i||i.id!==n.pointerId)return;const o=n.clientX-i.startX,d=n.clientY-i.startY;if(!i.horiz){if(Math.abs(d)>Math.abs(o)&&Math.abs(d)>8||Math.abs(o)<=8)return;i.horiz=!0}const u=Date.now(),c=Math.max(1,u-i.lastTime);i.velocity=(n.clientX-i.lastX)/c,i.lastX=n.clientX,i.lastTime=u,this.dragOffset.set(o)});const s=n=>{const i=this.ptr;if(!i||i.id!==n.pointerId)return;const o=n.clientX-i.startX,d=i.horiz;if(this.ptr=null,e.releasePointerCapture?.(n.pointerId),!d){this.dragOffset.set(0);return}this.snap(Ms({dragDistance:o,velocity:i.velocity,itemWidth:W}))};e.addEventListener("pointerup",s),e.addEventListener("pointercancel",n=>{!this.ptr||this.ptr.id!==n.pointerId||(this.ptr=null,e.releasePointerCapture?.(n.pointerId),this.snap(0))})}}const mt=()=>null;function x(r){return String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Js(r,e){const t=[...r].sort((i,o)=>i.canonicalOrdinal-o.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(i=>i.playHoleId))}];const s=[...e].sort((i,o)=>i.fromCanonicalOrdinal-o.fromCanonicalOrdinal),n=[];for(const i of s){const o=t.filter(d=>d.canonicalOrdinal>=i.fromCanonicalOrdinal&&d.canonicalOrdinal<=i.toCanonicalOrdinal);o.length!==0&&n.push({label:i.label,holes:o,playHoleIds:new Set(o.map(d=>d.playHoleId))})}return n}function Zs(r){return r.kind==="si"?"lb-c-si":r.kind==="given"?"lb-c-given":r.kind==="status"?"lb-c-status":r.kind==="category"?"lb-c-cat":""}function en(r){const e=[r.kind==="category"?"lb-r-cat":`lb-r-${r.kind}`];return(r.kind==="si"||r.kind==="given")&&e.push("lb-r-dim"),r.team&&e.push(`lb-team-${r.team}`),e.join(" ")}function tn(r){return r&&r.marker?r.marker.template:null}function sn(r){const e=r?.marker?.tone;return e==="success"||e==="warning"||e==="danger"?` lb-mark-tone--${e}`:""}function nn(r,e){const t=r.cells.filter(s=>e.has(s.playHoleId));if(r.aggregate==="sum"){const s=t.map(n=>n.value).filter(n=>n!==null);return s.length===0?"—":String(s.reduce((n,i)=>n+i,0))}if(r.aggregate==="last"){for(let s=t.length-1;s>=0;s--){const n=t[s].value;if(n!==null)return Number.isInteger(n)?String(n):n.toFixed(1)}return"—"}return"—"}function rn(r){return r.filter(e=>!(e.startsWith("slot #")||/^CH -?\d/.test(e)||/^PH -?\d/.test(e)))}function Se(r,e,t,s){const n=Js(r.holes,e),i=v=>{const H=`<tr><th class="lb-rowlabel">Hole</th>${v.holes.map(I=>`<th>${x(I.occurrenceLabel)}</th>`).join("")}<th class="lb-sum">${x(v.label)}</th></tr>`,F=r.rows.map(I=>{const O=new Map(I.cells.map(K=>[K.playHoleId,K])),D=K=>I.emphasis?`<strong>${K}</strong>`:K,xt=v.holes.map(K=>{const G=O.get(K.playHoleId),St=G?.title?` title="${x(G.title)}"`:"",me=D(x(G?.display??"")),Pe=tn(G),It=sn(G),fe=G?.marker?.label,Tt=fe?` title="${x(fe)}" aria-label="${x(fe)}"`:"";let ze=Pe?`<span class="lb-mark lb-mark--${Pe}${It}"${Tt}>${me}</span>`:me;return G?.team&&(ze=`<span class="lb-pill lb-pill--${G.team}">${me}</span>`),`<td class="${Zs(I)}"${St}>${ze}</td>`}).join(""),$t=`<td class="lb-sum">${D(nn(I,v.playHoleIds))}</td>`,kt=I.subjectBallId?x(t(I.subjectBallId))+(I.label?" "+x(I.label):""):x(I.label);return`<tr class="${en(I)}"><th class="lb-rowlabel">${kt}</th>${xt}${$t}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${H}</thead><tbody>${F}</tbody></table></div>`},o=n.map(v=>i(v)).join(""),d=r.title.groups.map(v=>v.map(H=>x(t(H))).join(" & ")).filter(Boolean).join(r.title.joiner),u=s.mode==="verification"?r.subtitleFacts:rn(r.subtitleFacts),c=u.length?`<div class="lb-card__sub">${u.map(x).join(" · ")}</div>`:"",m=s.mode==="verification"&&r.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${r.footnotes.map(v=>`<span class="lb-card__note">${x(v)}</span>`).join("")}</div>`:"",p=s.mode==="verification"&&r.caption?`<p class="lb-card__caption">${x(r.caption)}</p>`:"",g=r.totals.length?`<ul class="lb-card__totals">${r.totals.map(v=>`<li>${x(v.label)} = <strong>${v.value??"—"}</strong></li>`).join("")}</ul>`:"",$=d?`<header class="lb-card__head"><h4>${d}</h4>${c}</header>`:c;return`<article class="${s.cardModifier?`lb-card ${s.cardModifier}`:"lb-card"}">
  ${$}
  ${o}
  ${m}${p}${g}
</article>`}function on(r,e,t,s){return Se(r,e,t,s)}function an(r,e,t,s){return Se(r,e,t,{...s,cardModifier:"lb-card--compact-match"})}function ln(r,e,t,s){return Se(r,e,t,{...s,cardModifier:"lb-card--category-matrix"})}function dn(r,e){const t=new Set(r.map(e));return t.size!==1?null:[...t][0]??null}function cn(r){if(r===void 0)return"";const e=r===0?"E":r>0?`+${r}`:`−${Math.abs(r)}`;return` <span class="lb-rank__pace lb-rank__pace--${r===0?"even":r>0?"over":"under"}">${x(e)}</span>`}function un(r,e,t=mt){const s=r.entries.map(n=>{const i=dn(n.ballIds,t),o=i?` <span class="lb-rank__group">${x(i)}</span>`:"";return`<tr class="${n.position===1?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${n.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__name">${x(n.ballIds.map(e).join(" & "))}</span>${o}</td>
  <td class="lb-rank__total">${n.total??"—"}${cn(n.paceDelta)}</td>
  <td class="lb-rank__thru">${n.holesPlayed}</td>
</tr>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${x(r.metricLabel)}</h4>
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
</div>`}function hn(r,e){const t=r.matches.map(s=>{const n=x(s.sideA.ballIds.map(e).join(" & ")),i=x(s.sideB.ballIds.map(e).join(" & ")),o=s.magnitude===0?"AS":`${s.magnitude} UP`,d=s.finished?"Final":`thru ${s.thru}`,u=s.leader==="a"?" lb-mp__team--lead":"",c=s.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${u}">${n}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${x(o)}</span><span class="lb-mp__status">${x(d)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${c}">${i}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${x(r.title)}</h4>${t}
</div>`}const pn={ranked:un,match_summary:(r,e)=>hn(r,e)},mn={"default-score-grid":on,"compact-match-grid":an,"category-matrix-grid":ln};function fn(r){return r.componentId??"default-score-grid"}function gn(r){return`<div class="lb-diag">Unrenderable result section <code>${x(r)}</code> — no generic view yet. Results are not hidden.</div>`}function bn(r){return`<div class="lb-diag">Unsupported score-grid component <code>${x(r)}</code> — no generic view yet. Results are not hidden.</div>`}function yn(r,e,t){const s=pn[r.kind];return s?s(r,e,t):gn(r.kind)}function _n(r,e,t,s){const n=fn(r),i=mn[n];return i?i(r,e,t,s):bn(n)}function vn(r,e,t=mt){return r.leaderboard.length===0&&r.cards.length===0?`<div class="lb-empty">No scores entered yet for ${x(r.formatLabel)}.</div>`:r.leaderboard.map(n=>yn(n,e,t)).join("")||`<div class="lb-empty">No leaderboard metric for ${x(r.formatLabel)}.</div>`}function wn(r,e,t,s={}){if(r.cards.length===0)return"";const n=s.mode??"product";return r.cards.map(i=>_n(i,e,t,{mode:n})).join(`
`)}const xn=b(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class $n extends T{static styles=`
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
                /* Flex so a long NAME ellipsizes while the group tag stays
                   whole — before this, the cell-level ellipsis cut the tag
                   ("Gr…") on narrow screens. */
                display: flex;
                align-items: baseline;
                min-width: 0;
            }
            & .lb-rank__name {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                min-width: 0;
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
                flex: none;
                white-space: nowrap;
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
    `;svc=this.inject(J);slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots(),t=this.svc.selectedSlotDefId();return e.find(s=>s.slotDefId===t)??e[0]??null};render(){return this.wire(xn,{status:{className:()=>{const t=this.svc.resultLoading.get(),s=this.svc.result.get()===null;return t||s?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody()}})}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const s=u=>this.svc.nameOf(u),i=vn(t,s,u=>this.svc.groupLabelOf(u)),o=wn(t,e.routeSections,s),d=o?`<h3 class="lb-cards__head">Scorecard</h3>${o}`:"";return i+d}}function kn(r,e){if(!e)return[];const t=[],s=new Set;for(const n of r)for(const i of n.players){if(i.playerId===e)return[];i.guestPlayerId===null||s.has(i.guestPlayerId)||(s.add(i.guestPlayerId),t.push({guestPlayerId:i.guestPlayerId,displayName:i.displayName}))}return t}const Sn=b(`
    <div bind="root" class="claim-card hidden">
        <span class="claim-card__label">Played here as a guest?</span>
        <p class="claim-card__hint">Claim your scores — the round lands on your profile's card.</p>
        <div bind="rows" class="claim-card__rows"></div>
        <p bind="err" class="claim-card__err"></p>
    </div>
`),In=b(`
    <div class="claim-card__row">
        <span bind="name" class="claim-card__name"></span>
        <button bind="claim" class="claim-card__btn" type="button">This is me</button>
    </div>
`);class Tn extends T{static styles=`
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
                ${S()}
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
    `;svc=this.inject(J);auth=this.inject(M);router=this.inject(j);tokenQ=this.router.query("token");claiming=new h(!1);error=new h("");claimable(){return kn(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async claim(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.claiming.set(!0);try{await _.friendlyRounds.claimGuest({token:t,guestPlayerId:e}),await this.svc.loadByToken(t)}catch(s){this.error.set(s instanceof L&&s.status===409?"Already claimed — or you already play in this round under your account.":s instanceof L&&s.status===404?"That guest is no longer claimable on this round.":"Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}render(){const e=this.wire(Sn,{root:{className:()=>this.claimable().length>0?"claim-card":"claim-card hidden"},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.claimable(),(t,s,n)=>this.wireEl(In,{name:()=>t.displayName,claim:{disabled:()=>this.claiming.get(),onclick:()=>{this.claim(t.guestPlayerId)}}},n),t=>t.guestPlayerId),e}}function V(r){return typeof r=="object"&&r!==null&&typeof r.get=="function"}const C=r=>`var(--${r})`,Ne=class Ne extends T{constructor(){super(...arguments),this.open=new h(!1),this.highlightIndex=new h(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const s=document.createElement("span");s.className="ui-select__trigger-label",this.triggerEl.appendChild(s);const n=document.createElement("span");n.className="ui-select__chevron",n.textContent="▾",n.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(n),this.triggerEl.addEventListener("click",o=>{o.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",o=>{this.handleTriggerKeydown(o)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.setAttribute("role","listbox"),this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",o=>{this.handleDropdownKeydown(o)}),e.appendChild(this.dropdownEl);const i=o=>{this.optionEls=[],this.dropdownEl.textContent="";for(let d=0;d<o.length;d++){const u=o[d],c=document.createElement("button");if(c.className="ui-select__option",c.setAttribute("type","button"),c.id=`ui-select-opt-${d}`,u.disabled){c.classList.add("ui-select__option--header"),c.disabled=!0,c.setAttribute("role","presentation"),c.setAttribute("aria-disabled","true");const g=document.createElement("span");g.className="ui-select__option-label",g.textContent=u.label,c.appendChild(g),this.dropdownEl.appendChild(c),this.optionEls.push(c);continue}if(c.setAttribute("role","option"),u.icon){const g=document.createElement("span");g.className="ui-select__option-icon",g.textContent=u.icon,c.appendChild(g)}const m=document.createElement("span");m.className="ui-select__option-label",m.textContent=u.label,c.appendChild(m);const p=document.createElement("span");p.className="ui-select__check",p.setAttribute("aria-hidden","true"),c.appendChild(p),c.addEventListener("click",g=>{g.stopPropagation(),this.selectOption(u.value)}),c.addEventListener("mouseenter",()=>{this.highlightIndex.set(d)}),this.dropdownEl.appendChild(c),this.optionEls.push(c)}};return V(this.props.options)?this.track(k(()=>{const o=V(this.props.options)?this.props.options.get():this.props.options;i(o)})):i(this.props.options),this.track(k(()=>{const o=this.props.value.get(),d=V(this.props.options)?this.props.options.get():this.props.options,u=d.find(c=>c.value===o);u?(s.textContent=u.icon?`${u.icon} ${u.label}`:u.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder")):(s.textContent=this.props.placeholder??"",this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!this.props.placeholder));for(let c=0;c<d.length;c++){const m=this.optionEls[c];if(!m)continue;const p=d[c].value===o;m.setAttribute("aria-selected",String(p)),m.classList.toggle("ui-select__option--selected",p);const g=m.querySelector(".ui-select__check");g&&(g.textContent=p?"✓":"")}})),this.track(k(()=>{const o=this.open.get();if(this.dropdownEl.classList.toggle("open",o),n.classList.toggle("ui-select__chevron--open",o),this.triggerEl.setAttribute("aria-expanded",String(o)),o?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),o){const d=V(this.props.options)?this.props.options.get():this.props.options,u=this.props.value.get(),c=d.findIndex(p=>p.value===u),m=d.findIndex(p=>!p.disabled);this.highlightIndex.set(c>=0?c:m)}})),this.track(k(()=>{const o=this.highlightIndex.get();for(let d=0;d<this.optionEls.length;d++)this.optionEls[d].classList.toggle("ui-select__option--highlighted",d===o);o>=0&&this.optionEls[o]&&(this.triggerEl.setAttribute("aria-activedescendant",`ui-select-opt-${o}`),this.optionEls[o].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(V(this.props.disabled)?this.track(k(()=>{const o=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",o),this.triggerEl.disabled=o})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}selectOption(e){re(()=>{this.props.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.toggle();break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":{e.preventDefault();const t=this.highlightIndex.get(),s=V(this.props.options)?this.props.options.get():this.props.options;t>=0&&t<s.length&&!s[t].disabled&&this.selectOption(s[t].value);break}case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=V(this.props.options)?this.props.options.get():this.props.options;if(t.length===0||!t.some(n=>!n.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};Ne.styles=`
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
            border: 1px solid ${C("border")};
            border-radius: ${C("radius")};
            background: ${C("input-bg")};
            color: ${C("text")};
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
        }
        .ui-select__trigger:focus-visible {
            outline: 2px solid ${C("primary")};
            outline-offset: 1px;
        }
        .ui-select__trigger--placeholder {
            color: ${C("text-muted")};
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
            color: ${C("text-muted")};
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
            background: ${C("surface")};
            border: 1px solid ${C("border")};
            border-radius: ${C("radius")};
            box-shadow: ${C("shadow-elevated")};
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
            color: ${C("text")};
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
            background: ${C("hover-bg")};
        }
        .ui-select__option--selected {
            color: ${C("primary")};
            font-weight: 600;
        }
        .ui-select__option--header {
            cursor: default;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${C("text-muted")};
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
            color: ${C("primary")};
        }
    `;let ie=Ne;function En(r,e,t){if(!e||t!=="not_started")return!1;for(const s of r)for(const n of s.players)if(n.playerId===e)return!1;return!0}const Ve="new";function Cn(r){const e=r.map((s,n)=>{const i=s.ballIds.length,o=[`Group ${n+1}`];return s.startTime.includes(":")&&o.push(s.startTime),{value:s.id,label:`${o.join(" · ")} — ${i} of ${s.capacity}`,disabled:i>=s.capacity}}),t=e.find(s=>!s.disabled);return e.push({value:Ve,label:"Start a new group",disabled:!1}),{options:e,defaultValue:t?.value??Ve}}const Nn=b(`
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
`);class Pn extends T{static styles=`
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
                ${S()}
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
    `;svc=this.inject(J);auth=this.inject(M);router=this.inject(j);tokenQ=this.router.query("token");joining=new h(!1);error=new h("");diagnostics=new h([]);teeId=new h("");tees=new h([]);loadedForCourseId=null;groupChoice=new h("");eligible(){return En(this.svc.balls.get(),this.auth.currentUser.get()?.id??null,this.svc.round.get()?.status??null)}ensureTeesLoaded(){if(!this.eligible())return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,_.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}diagnosticMessage(e){return e.code==="missing_gender"||e.code==="missing_handicap_index"?`${e.message} — <a data-nav="/profile">update your profile</a>.`:e.message}async join(){const e=this.tokenQ.get(),t=this.teeId.get();if(!(!e||!t||this.joining.get())){this.error.set(""),this.diagnostics.set([]),this.joining.set(!0);try{const s=this.groupChoice.get(),n=await _.friendlyRounds.join({token:e,teeId:t,...s?{groupChoice:s}:{}});n.ok?await this.svc.loadByToken(e):this.diagnostics.set(n.diagnostics)}catch(s){this.error.set(s instanceof L&&s.status===409?s.message??"You already play in this round, or it has already started.":"Could not join right now. Try again.")}finally{this.joining.set(!1)}}}render(){this.track(k(()=>this.ensureTeesLoaded()));const e=new w(()=>Cn(this.svc.groups()));this.track(k(()=>{const i=e.get(),o=this.groupChoice.get();(!o||!i.options.some(d=>d.value===o&&!d.disabled))&&this.groupChoice.set(i.defaultValue)}));const t=this.wire(Nn,{root:{className:()=>this.eligible()?"join-card":"join-card hidden"},groupRow:{className:()=>this.svc.groups().length>0?"join-card__group":"join-card__group hidden"},join:{disabled:()=>this.joining.get()||!this.teeId.get(),onclick:()=>{this.join()}},diag:{innerHTML:()=>this.diagnostics.get().map(i=>this.diagnosticMessage(i)).join(" · "),onclick:i=>{const d=i.target.closest("[data-nav]")?.getAttribute("data-nav");d&&(i.preventDefault(),this.router.navigate(d))}},err:{textContent:()=>this.error.get()}}),s=new ie({value:this.teeId,options:{get:()=>this.tees.get().map(i=>({value:i.id,label:i.name}))},placeholder:"Tee"});s.mount(this.ref(t,"teeHost")),this.track(()=>s.destroy());const n=new ie({value:this.groupChoice,options:{get:()=>e.get().options},placeholder:"Group"});return n.mount(this.ref(t,"groupHost")),this.track(()=>n.destroy()),t}}const zn=b(`
    <div bind="root" class="edit-card hidden">
        <div class="edit-card__text">
            <span class="edit-card__label">Round setup</span>
            <p class="edit-card__hint">Change tees, add a format, adjust groups — scored balls are preserved.</p>
        </div>
        <button bind="edit" class="edit-card__btn" type="button">Edit round</button>
    </div>
`);class jn extends T{static styles=`
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
                ${S()}
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
    `;router=this.inject(j);tokenQ=this.router.query("token");editable=new h(!1);render(){const e=this.tokenQ.get();return e&&_.friendlyRounds.setup({token:e}).then(t=>this.editable.set(t.editable===!0)).catch(()=>this.editable.set(!1)),this.wire(zn,{root:{className:()=>this.editable.get()?"edit-card":"edit-card hidden"},edit:{onclick:()=>{const t=this.tokenQ.get();t&&this.router.navigate("/create",{query:{token:t}})}}})}}function On(r,e){if(!e)return!1;for(const t of r)for(const s of t.players)if(s.playerId===e)return!0;return!1}const Rn=b(`
    <div bind="root" class="leave-card hidden">
        <button bind="leaveBtn" class="leave-card__btn" type="button">Remove me from this round</button>
        <p bind="diag" class="leave-card__diag"></p>
        <p bind="err" class="leave-card__err"></p>
        <div bind="confirmHost"></div>
    </div>
`);class Hn extends T{static styles=`
        .leave-card {
            /* Sits at the head of the danger zone, above Finish/Delete. */
            margin-top: ${a("2xl")};

            &.hidden { display: none; }

            /* Same quiet ghost-danger treatment as Delete round — an action in
               the error tone, secondary to the primary Score/Board flow. */
            & .leave-card__btn {
                width: 100%;
                padding: ${a("md")};
                background: none;
                border: 1px solid ${l("border")};
                border-radius: ${l("radius")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${l("error")};
                cursor: pointer;

                &:hover, &:active { border-color: ${l("error")}; }
                &:focus-visible { outline: 2px solid ${l("error")}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .leave-card__diag {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${l("text-muted")};
                &:empty { display: none; }
            }
            & .leave-card__err {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${l("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(J);auth=this.inject(M);router=this.inject(j);tokenQ=this.router.query("token");open=new h(!1);leaving=new h(!1);error=new h("");diagnostics=new h([]);eligible(){return On(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async leave(){const e=this.tokenQ.get();if(!(!e||this.leaving.get())){this.error.set(""),this.diagnostics.set([]),this.leaving.set(!0);try{const t=await _.friendlyRounds.leave({token:e});t.ok?await this.svc.loadByToken(e):this.diagnostics.set(t.diagnostics)}catch{this.error.set("Could not remove you right now. Try again.")}finally{this.leaving.set(!1)}}}render(){const e=this.wire(Rn,{root:{className:()=>this.eligible()?"leave-card":"leave-card hidden"},leaveBtn:{onclick:()=>this.open.set(!0),disabled:()=>this.leaving.get()},diag:{textContent:()=>this.diagnostics.get().map(t=>t.message).join(" · ")},err:{textContent:()=>this.error.get()}});return this.spawn(Q,this.ref(e,"confirmHost"),{open:this.open,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.leave()}}),e}}function Mn(r){return!(r.tab!=="leaderboard"||!r.pageVisible||r.status==="complete")}const Ln=2e4;function Fn(r){if(!(r===null||r===""))return/^\d+$/.test(r)?Number(r):r}const An=b(`
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

                    <div bind="leave"></div>
                    <button bind="finishBtn" class="round-view__finish" type="button"></button>
                    <button bind="deleteBtn" class="round-view__delete" type="button">Delete round</button>
                    <div bind="confirmHost"></div>
                    <div bind="finishConfirmHost"></div>
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
`),Bn=b('<button bind="pill" class="round-view__fmt" type="button"></button>'),Dn=b('<button bind="pill" class="round-view__grp" type="button"></button>');class Gn extends T{static styles=`
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
                    ${A()}
                    font-size: 0.8rem;
                    color: ${l("text-muted")};
                }
                & .round-view__copy {
                    ${S()}
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

            /* Finish / reopen: a secondary action above the danger zone. A
               bordered ghost button in the neutral text tone — clearly an
               action, but never competing with the primary Score/Board flow. */
            & .round-view__finish {
                width: 100%;
                margin-top: ${a("2xl")};
                padding: ${a("md")};
                background: none;
                border: 1px solid ${l("border")};
                border-radius: ${l("radius")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${l("text")};
                cursor: pointer;

                &:hover, &:active { border-color: ${l("text-muted")}; }
                &:focus-visible { outline: 2px solid ${l("accent")}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            /* Danger zone: last thing on the score panel, visually quiet —
               a bordered ghost button in the error tone, never a filled CTA. */
            & .round-view__delete {
                width: 100%;
                /* Sits right under Finish, so a tighter gap than the 2xl that
                   used to separate it from the share card. */
                margin-top: ${a("md")};
                padding: ${a("md")};
                background: none;
                border: 1px solid ${l("border")};
                border-radius: ${l("radius")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${l("error")};
                cursor: pointer;

                &:hover, &:active { border-color: ${l("error")}; }
                &:focus-visible { outline: 2px solid ${l("error")}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }

        /* App-level accessibility override for the framework confirm dialog. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
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
    `;svc=this.inject(J);router=this.inject(j);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new h(this.initPos.tab);pageVisible=new h(!document.hidden);hasRound=new w(()=>this.svc.round.get()!==null);hasScoring=new w(()=>this.svc.balls.get().length>0);deleteOpen=new h(!1);finishOpen=new h(!1);isComplete=new w(()=>this.svc.round.get()?.status==="complete");shareUrl=new w(()=>{const e=this.tokenQ.get();return e?`${location.origin}/round?token=${e}`:""});render(){this.track(k(()=>{const d=this.tokenQ.get();d&&this.svc.loadByToken(d,this.initPos).then(()=>{this.tab.get()==="leaderboard"&&this.svc.loadResult()})}));const e=()=>{this.svc.flushPending()};window.addEventListener("online",e),this.track(()=>window.removeEventListener("online",e));const t=()=>this.pageVisible.set(!document.hidden);document.addEventListener("visibilitychange",t),this.track(()=>document.removeEventListener("visibilitychange",t));let s=null;this.track(k(()=>{const d=Mn({tab:this.tab.get(),pageVisible:this.pageVisible.get(),status:this.svc.round.get()?.status??null});d&&s===null?s=setInterval(()=>{this.svc.pollResult()},Ln):!d&&s!==null&&(clearInterval(s),s=null)})),this.track(()=>{s!==null&&clearInterval(s)}),this.track(k(()=>{const d=this.tab.get(),u=this.svc.selectedSlotDefId(),c=this.svc.holeIdx.get();if(this.router.route.get()!=="/round"||!this.hasRound.get())return;const m={token:this.tokenQ.get()};d==="leaderboard"&&(m.tab="board");const p=this.svc.round.get()?.formatSlots[0]?.slotDefId??null;u&&u!==p&&(m.slot=u),c>0&&(m.hole=c+1),this.router.navigate(this.router.route.get(),{replace:!0,query:m})}));const n={not_started:"Not started",active:"Live",complete:"Finished"},i=this.wire(An,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},course:()=>this.svc.round.get()?.courseNameSnapshot??"Round",status:()=>{const d=this.svc.round.get()?.status??"not_started";return n[d]??d},date:()=>this.svc.round.get()?.date??"",route:()=>{const d=this.svc.round.get();return d?`${d.playHoles.length} holes`:""},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},groupTabs:{className:()=>this.svc.groups().length>1?"round-view__groups":"round-view__groups hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},finishBtn:{textContent:()=>this.isComplete.get()?"Reopen round":"Finish round",onclick:()=>this.finishOpen.set(!0),disabled:()=>this.svc.finishing.get()},deleteBtn:{onclick:()=>this.deleteOpen.set(!0),disabled:()=>this.svc.deleting.get()},dock:{className:()=>this.hasRound.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const d=this.svc.currentPlayedHole();return d?this.svc.occLabel(d.playHoleId):""},holeSi:()=>{const d=this.svc.currentPlayHole()?.baseStrokeIndex;return d!=null?String(d):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});this.$each(this.ref(i,"groupTabs"),new w(()=>this.svc.groups()),(d,u,c)=>this.groupPill(u,c),d=>d.id),this.$each(this.ref(i,"formats"),new w(()=>this.svc.round.get()?.formatSlots??[]),(d,u,c)=>this.slotPill(d,u,c),d=>d.slotDefId),this.spawn(Xs,this.ref(i,"scoring")),this.spawn($n,this.ref(i,"leaderboard")),this.spawn(jn,this.ref(i,"edit")),this.spawn(Tn,this.ref(i,"claim")),this.spawn(Pn,this.ref(i,"join")),this.spawn(Hn,this.ref(i,"leave")),this.spawn(Q,this.ref(i,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:"This permanently removes the round and all its scores for everyone. This can't be undone.",confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.svc.deleteRound().then(d=>{d&&this.router.navigate("/")})}}),this.spawn(Q,this.ref(i,"finishConfirmHost"),{open:this.finishOpen,title:"Finish or reopen round",message:()=>this.isComplete.get()?"Reopen this round? It'll move back to your ongoing rounds.":"Finish this round? It'll move to your finished rounds. You can still edit or reopen it any time.",cancelLabel:"Cancel",onconfirm:()=>{this.isComplete.get()?this.svc.reopenRound():this.svc.finishRound()}});const o=d=>{d.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1),d.key==="Escape"&&this.finishOpen.get()&&this.finishOpen.set(!1)};return window.addEventListener("keydown",o),this.track(()=>window.removeEventListener("keydown",o)),i}readUrlPosition(){const e=new URLSearchParams(location.search),t=e.get("slot"),s=Number(e.get("hole"));return{tab:e.get("tab")==="board"?"leaderboard":"score",selectedSlot:Fn(t),holeIdx:Number.isFinite(s)&&s>0?s-1:0}}groupPill(e,t){return this.wireEl(Dn,{pill:{textContent:()=>{const s=this.svc.groups()[e];if(!s)return`Group ${e+1}`;const n=[`Group ${e+1}`];s.startTime.includes(":")&&n.push(s.startTime);const i=this.svc.playHoleById(s.startPlayHoleId)?.courseHoleNumber;return i!==void 0&&s.startOrdinal!==1&&n.push(`H${i}`),n.join(" · ")},className:()=>this.svc.groupIdx.get()===e?"round-view__grp active":"round-view__grp",onclick:()=>this.svc.groupIdx.set(e)}},t)}slotPill(e,t,s){return this.wireEl(Bn,{pill:{textContent:()=>ut(e),className:()=>this.tab.get()==="leaderboard"&&this.svc.selectedSlotDefId()===e.slotDefId?"round-view__fmt active":"round-view__fmt",onclick:()=>{this.svc.selectSlot(e.slotDefId),this.tab.get()!=="leaderboard"&&(this.tab.set("leaderboard"),this.svc.loadResult())}}},s)}}function ft(r){return r.handicapIndex*(r.slope/113)+(r.courseRating-r.par)}function qn(r){return Math.round(ft(r))}function Kn(r){if(!r)return null;const e=/^slots\[slot-(\d+)\]/.exec(r);return e?Number(e[1]):null}function Un(r){if(!r)return null;const e=/^formats\[(\d+)\]/.exec(r);return e?Number(e[1]):null}function gt(r){return Un(r.path)??Kn(r.path)}function Wn(r,e){return r.filter(t=>gt(t)===e)}function Vn(r){return r.filter(e=>!e.path?.startsWith("producers")&&!e.path?.startsWith("playingGroups")&&e.path!=="route"&&gt(e)===null)}function ee(r){return`${r} ${r===1?"player":"players"}`}function ae(r,e){const t=r.formatId?e(r.formatId)??r.formatId:null,s=r.teamLabel;switch(r.code){case"team_size_above_max":if(t&&s&&r.actual!==void 0&&r.allowedMax!==void 0)return`${s} has ${ee(r.actual)} — ${t} allows at most ${r.allowedMax} per team.`;break;case"team_size_below_min":if(t&&s&&r.actual!==void 0&&r.allowedMin!==void 0)return`${s} has ${ee(r.actual)} — ${t} needs at least ${r.allowedMin} per team.`;break;case"empty_team_grouping":if(t&&s)return`${s} has no players — add at least one, or remove the team.`;break;case"team_count_above_max":if(t&&r.actual!==void 0&&r.allowedMax!==void 0)return`${r.actual} teams — ${t} allows at most ${r.allowedMax}.`;break;case"team_count_below_min":if(t&&r.actual!==void 0&&r.allowedMin!==void 0)return`${r.actual} teams — ${t} needs at least ${r.allowedMin}.`;break;case"slot_ball_count_above_max":if(t&&r.actual!==void 0&&r.allowedMax!==void 0)return`${ee(r.actual)} in ${t} — it scores at most ${r.allowedMax}.`;break;case"slot_ball_count_below_min":if(t&&r.actual!==void 0&&r.allowedMin!==void 0)return`${ee(r.actual)} in ${t} — it needs at least ${r.allowedMin}.`;break;case"slot_ball_count_not_multiple":if(t&&r.actual!==void 0)return`${t} pairs its balls, so it needs an even number — ${ee(r.actual)} won't pair up.`;break;case"missing_team_grouping":if(t)return`${t} needs its players grouped into teams — tick the teams it scores.`;break;case"producer_has_scores":return r.message;case"scored_ball_orphaned":return r.message;case"edit_locked_course_route":return"Scores have already been recorded — the course and route are locked for this round.";case"round_complete":return"This round is complete — its setup can no longer be edited.";case"not_editable":return"This round can no longer be edited."}return r.message}function Yn(r){return r?r.type==="flat"?String(r.pct):r.bands.length>0?String(r.bands[0].pct):"100":"100"}function Qn(r){const e=r.roundType;if(e==="full_18"||e==="front_9"||e==="back_9")return{preset:e,startHole:Xn(r)};const t=(r.route?.playHoles??[]).map(o=>o.courseHoleNumber),s=t[0]??1,n=new Set(t);return{preset:t.length<=9&&[...n].every(o=>o<=9)?"front_9":t.length<=9&&[...n].every(o=>o>=10)?"back_9":"full_18",startHole:s}}function Xn(r){return r.roundType==="back_9"?10:1}function Jn(r,e=()=>""){let t=1,s=1,n=1,i=1;const o=new Map,d=r.producers.map(y=>{const v=t++;o.set(y.producerDefId,v);const H=y.playerRef.kind==="guest";return{key:v,name:e(y.producerDefId),handicapIndex:String(y.handicapIndex),gender:y.gender??"M",teeId:y.teeId,producerDefId:y.producerDefId,...H?{guestPlayerId:y.playerRef.id}:{playerId:y.playerRef.id,genderKnown:y.gender!=null}}}),u=new Map;(r.teams??[]).forEach(y=>{u.set(y.id,s++)});const c=(r.teams??[]).map(y=>{const v=u.get(y.id),H={},F={};for(const I of y.members)if("producerDefId"in I){const O=o.get(I.producerDefId);O!==void 0&&(H[O]=String(I.allowancePct))}else{const O=u.get(I.teamId);O!==void 0&&(F[O]=!0)}return{key:v,kind:y.kind??"single_ball",formation:y.formation??"scramble",pctByPlayer:H,memberTeams:F}}),m=(r.playingGroups??[]).map(y=>{const v={};for(const H of y.members){const F=o.get(H);F!==void 0&&(v[F]=!0)}return{key:n++,startTime:y.startTime??"",startHole:y.startHole??null,members:v}}),p=r.formats.map(y=>{const v={},H={},F=y.subjects;if(F){const I=new Set;for(const O of F)if(O.kind==="player"){const D=o.get(O.producerDefId);D!==void 0&&I.add(D)}else{const D=u.get(O.teamId);D!==void 0&&(H[D]=!0)}for(const O of d)v[O.key]=I.has(O.key)}return{key:i++,formatId:y.formatId,allowancePct:Yn(y.allowanceConfig),subjectPlayers:v,subjectTeams:H}}),{preset:g,startHole:$}=Qn(r);return{courseId:r.courseId,preset:g,startHole:$,players:d,teams:c,groups:m,formatSlots:p,nextKey:t,nextTeamKey:s,nextGroupKey:n,nextSlotKey:i}}const Zn=["scramble","greensomes","foursomes","custom"],le=2,ge=10,er="ABCDEFGH",tr={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class sr{loading=new h(!1);error=new h(null);courses=new h([]);tees=new h([]);courseId=new h("");preset=new h("full_18");startHole=new h(1);players=new h([]);teams=new h([]);groups=new h([]);formatSlots=new h([]);submitting=new h(!1);diagnostics=new h([]);submitError=new h(null);editToken=new h(null);hasScores=new h(!1);editStatus=new h(null);editBlockedReason=new h(null);editPlayedAt=null;catalog=B.get(he);nextKey=1;nextSlotKey=1;nextTeamKey=1;nextGroupKey=1;reset(){this.courses.set([]),this.tees.set([]),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.groups.set([]),this.formatSlots.set([]),this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.editToken.set(null),this.hasScores.set(!1),this.editStatus.set(null),this.editBlockedReason.set(null),this.editPlayedAt=null,this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1,this.nextGroupKey=1}async load(){this.catalog.load().then(()=>this.ensureDefaultSlot());const e=await E(this.loading,this.error,()=>_.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}async loadForEdit(e){this.reset(),this.editToken.set(e),await this.catalog.load();const t=await E(this.loading,this.error,()=>_.friendlyRounds.setup({token:e}));if(!t)return;if(this.editStatus.set(t.status),!t.editable){this.editBlockedReason.set(t.reason);return}this.hasScores.set(t.hasScores),this.editPlayedAt=t.draft.playedAt;const s=await E(this.loading,this.error,()=>_.setup.courses());s&&this.courses.set(s);const n=await E(this.loading,this.error,()=>_.setup.teesByCourse({courseId:t.draft.courseId}));this.tees.set(n??[]);const i=await E(this.loading,this.error,()=>_.friendlyRounds.balls({token:e})),o=new Map;for(const u of i??[])for(const c of u.players)o.set(c.producerDefId,c.displayName);const d=Jn(t.draft,u=>o.get(u)??"");this.courseId.set(d.courseId),this.preset.set(d.preset),this.startHole.set(d.startHole),this.players.set(d.players),this.teams.set(d.teams),this.groups.set(d.groups),this.formatSlots.set(d.formatSlots),this.nextKey=d.nextKey,this.nextTeamKey=d.nextTeamKey,this.nextGroupKey=d.nextGroupKey,this.nextSlotKey=d.nextSlotKey}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const s=await E(this.loading,this.error,()=>_.setup.teesByCourse({courseId:e}))??[];this.tees.set(s);const n=new Set(s.map(o=>o.id)),i=s[0]?.id??"";this.players.set(this.players.get().map(o=>({...o,teeId:n.has(o.teeId)?o.teeId:i}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}])}addMe(e){this.addFriend(e)}addFriend(e){if(this.hasPlayer(e.id))return;const t=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:e.displayName,handicapIndex:e.handicapIndex===null?"":String(e.handicapIndex),gender:e.gender??"M",genderKnown:e.gender!=null,teeId:t,playerId:e.id}])}hasPlayer(e){return this.players.get().some(t=>t.playerId===e)}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e)),this.groups.set(this.groups.get().map(t=>{if(t.members[e]===void 0)return t;const s={...t.members};return delete s[e],{...t,members:s}}))}patchPlayer(e,t){this.players.set(this.players.get().map(s=>s.key===e?{...s,...t}:s))}ensureDefaultSlot(){if(this.formatSlots.get().length>0)return;const e=this.catalog.byId("stableford_individual")??this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",s={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{}};this.formatSlots.set([...this.formatSlots.get(),s])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(s=>s.key===e?{...s,...t}:s))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return er[e]??`T${e+1}`}formations=Zn;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{}}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,kind:t,memberTeams:t==="single_ball"?{}:s.memberTeams}:s)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,s){const n=this.teamByKey(e);if(!n||n.kind!=="multi_ball"||t===e)return;const i={...n.memberTeams};if(s){if(this.teamMemberCount(e)>=ge)return;i[t]=!0}else delete i[t];this.teams.set(this.teams.get().map(o=>o.key===e?{...o,memberTeams:i}:o))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(s=>t.memberTeams[Number(s)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{let t=!1;const s={...e.subjectTeams};for(const n of this.teams.get())s[n.key]===!0&&!this.teamKindFitsFormat(e.formatId,n.kind)&&(delete s[n.key],t=!0);return t?{...e,subjectTeams:s}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}teamKindFitsFormat(e,t){return this.isSideFormat(e)?t==="multi_ball":t==="single_ball"||this.catalog.acceptsSideSubjects(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const s={...t.memberTeams};return delete s[e],{...t,memberTeams:s}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const s={...t.subjectTeams};return delete s[e],{...t,subjectTeams:s}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.teams.get().findIndex(s=>s.key===e.key);return`Team ${this.teamLetter(Math.max(0,t))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,formation:t}:s))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,s){const n=this.teamByKey(e);if(!n)return;const i={...n.pctByPlayer};if(s){if(i[t]!==void 0||this.teamMemberCount(e)>=ge)return;i[t]=i[t]??"100"}else delete i[t];this.teams.set(this.teams.get().map(o=>o.key===e?{...o,pctByPlayer:i}:o))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=ge}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let s=0;for(const n of this.players.get()){const i=t.pctByPlayer[n.key];if(i===void 0)continue;const o=this.derivedCH(n);if(!o)return null;s+=this.parsePct(i)*o.ch/100}return Math.round(s)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<le)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=le;let s=t;for(const n of this.teams.get())e.memberTeams[n.key]===!0&&n.kind==="single_ball"&&Object.keys(n.pctByPlayer).length>=le&&s++;return s>=le}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,s){const n=this.teamByKey(e);!n||n.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(i=>i.key===e?{...i,pctByPlayer:{...i.pctByPlayer,[t]:s}}:i))}groupsEnabled(){return this.groups.get().length>0}splitIntoGroups(){if(this.groupsEnabled())return;const e={};for(const t of this.players.get())e[t.key]=!0;this.groups.set([{key:this.nextGroupKey++,startTime:"",startHole:null,members:e},{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}clearGroups(){this.groups.set([])}addGroup(){this.groupsEnabled()&&this.groups.set([...this.groups.get(),{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}removeGroup(e){const t=this.groups.get().filter(s=>s.key!==e);this.groups.set(t.length>1?t:[])}groupByKey(e){return this.groups.get().find(t=>t.key===e)??null}groupLabel(e){const t=this.groups.get().findIndex(s=>s.key===e.key);return`Group ${Math.max(0,t)+1}`}groupMemberIn(e,t){return this.groupByKey(e)?.members[t]===!0}setGroupMember(e,t,s){this.groups.set(this.groups.get().map(n=>{const i=n.key===e,o=n.members[t]===!0;if(i&&s&&!o)return{...n,members:{...n.members,[t]:!0}};if(o&&(!i||!s)){const d={...n.members};return delete d[t],{...n,members:d}}return n}))}setGroupStartTime(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startTime:t}:s))}setGroupStartHole(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startHole:t}:s))}groupSize(e){const t=this.groupByKey(e);return t?this.players.get().filter(s=>t.members[s.key]===!0).length:0}ungroupedPlayers(){if(!this.groupsEnabled())return[];const e=new Set;for(const t of this.groups.get())for(const s of Object.keys(t.members))t.members[Number(s)]&&e.add(Number(s));return this.players.get().filter(t=>!e.has(t.key))}crossGroupTeamWarnings(){if(!this.groupsEnabled())return[];const e=new Map;this.groups.get().forEach((s,n)=>{for(const i of Object.keys(s.members))s.members[Number(i)]&&e.set(Number(i),n)});const t=[];for(const s of this.teams.get()){if(s.kind!=="single_ball"||!this.isTeamLive(s))continue;const n=new Set;for(const i of Object.keys(s.pctByPlayer)){const o=e.get(Number(i));o!==void 0&&n.add(o)}n.size>1&&t.push(`${this.teamLabel(s)} plays one combined ball, but its players are in different groups — keep them in the same group.`)}return t}buildGroups(e,t){return this.groups.get().map(s=>({members:e.filter(n=>s.members[n.key]===!0).map(n=>t.get(n.key)),...s.startTime.trim()!==""?{startTime:s.startTime.trim()}:{},...s.startHole!==null?{startHole:s.startHole}:{}})).filter(s=>s.members.length>0)}diagnosticsForGroups(){return this.diagnostics.get().filter(e=>e.path?.startsWith("playingGroups"))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectPlayers:{...n.subjectPlayers,[t]:s}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectTeams:{...n.subjectTeams,[t]:s}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return tr[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,s)=>t-s);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1),this.groups.set(this.groups.get().map(s=>s.startHole!==null&&!t.includes(s.startHole)?{...s,startHole:null}:s))}derivedCH(e){const t=Number.parseFloat(e.handicapIndex);if(!Number.isFinite(t))return null;const s=this.teeById(e.teeId);if(!s)return null;const n=s.ratings.find(o=>o.gender===e.gender);if(!n)return null;const i={handicapIndex:t,slope:n.slope,courseRating:n.courseRating,par:n.par};return{ch:qn(i),raw:ft(i),rating:n,teeName:s.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}humanizedRoster(){return this.diagnostics.get().filter(e=>e.path==="producers").map(e=>ae(e,t=>this.catalog.labelOf(t)))}humanizedRoute(){return this.diagnostics.get().filter(e=>e.path==="route").map(e=>ae(e,t=>this.catalog.labelOf(t)))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const s of this.formatSlots.get()){for(const n of e)s.subjectPlayers[n.key]!==!1&&t.add(n.key);for(const n of this.teams.get())if(s.subjectTeams[n.key]===!0)for(const i of e)n.pctByPlayer[i.key]!==void 0&&t.add(i.key)}return e.filter(s=>!t.has(s.key))}diagnosticsForFormat(e){return Wn(this.diagnostics.get(),e)}humanizedForFormat(e){return this.diagnosticsForFormat(e).map(t=>ae(t,s=>this.catalog.labelOf(s)))}generalDiagnostics(){return Vn(this.diagnostics.get())}humanizedGeneral(){return this.generalDiagnostics().map(e=>ae(e,t=>this.catalog.labelOf(t)))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const s=this.liveTeamKeySet(),n=[];for(const i of this.teams.get()){if(!s.has(i.key))continue;const o=e.filter(d=>i.pctByPlayer[d.key]!==void 0).map(d=>({producerDefId:t.get(d.key),allowancePct:this.parsePct(i.pctByPlayer[d.key])}));if(i.kind==="multi_ball")for(const d of this.teams.get())i.memberTeams[d.key]===!0&&d.key!==i.key&&d.kind==="single_ball"&&s.has(d.key)&&o.push({teamId:String(d.key)});n.push({id:String(i.key),label:this.teamLabel(i),formation:i.formation,kind:i.kind,members:o})}return n}buildFormats(e,t){const s=this.liveTeamKeySet();return this.formatSlots.get().map(n=>{const i=this.isSideFormat(n.formatId),o=[];if(!i)for(const d of e)n.subjectPlayers[d.key]!==!1&&o.push({kind:"player",producerDefId:t.get(d.key)});for(const d of this.teams.get())n.subjectTeams[d.key]===!0&&s.has(d.key)&&this.teamKindFitsFormat(n.formatId,d.kind)&&o.push({kind:"team",teamId:String(d.key)});return{formatId:n.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(n.allowancePct)},subjects:o}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),s=e.indexOf(t);return s<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(s),...e.slice(0,s)].map(i=>({courseHoleNumber:i})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];if(e.forEach((n,i)=>{n.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${i}].name`}),Number.isFinite(Number.parseFloat(n.handicapIndex))||t.push({code:"missing_index",message:"Handicap index required",path:`producers[${i}].handicapIndex`}),n.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${i}].teeId`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};const s=this.editToken.get();this.submitting.set(!0);try{const n=new Map;e.forEach((g,$)=>{n.set(g.key,g.producerDefId??(s?`p-${g.key}`:`p${$+1}`))});const i=[];for(const g of e){const $=Number.parseFloat(g.handicapIndex),y=g.playerId?{kind:"player",id:g.playerId}:g.guestPlayerId?{kind:"guest",id:g.guestPlayerId}:{kind:"guest",id:(await _.guestPlayers.create({displayName:g.name.trim(),gender:g.gender,handicapIndex:$})).id};i.push({producerDefId:n.get(g.key),playerRef:y,handicapIndex:$,gender:g.gender,teeId:g.teeId})}const{roundType:o,route:d}=this.buildRoute(),u=this.buildTeams(e,n),c=this.buildGroups(e,n),m={courseId:this.courseId.get(),playedAt:this.editPlayedAt??new Date().toISOString().slice(0,10),roundType:o,...d?{route:d}:{},producers:i,...u.length>0?{teams:u}:{},formats:this.buildFormats(e,n),...c.length>0?{playingGroups:c}:{}};if(s){const g=await _.friendlyRounds.editSetup({token:s,draft:m});return g.ok?{ok:!0,token:s}:(this.diagnostics.set(g.diagnostics),{ok:!1})}const p=await _.friendlyRounds.create({draft:m});return p.ok?(ue({token:p.friendlyRound.shareToken,courseName:p.round.courseNameSnapshot??"",status:p.round.status,completedAt:p.round.completedAt,lastSeenAt:new Date().toISOString()}),{ok:!0,token:p.friendlyRound.shareToken}):(this.diagnostics.set(p.diagnostics),{ok:!1})}catch(n){return this.submitError.set(n instanceof L?n.message:s?"Could not save the round. Try again.":"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}class bt{loading=new h(!1);error=new h(null);player=new h(null);history=new h([]);saving=new h(!1);saveError=new h(null);async load(e=!1){if(!e&&(this.player.get()!==null||this.loading.get()))return;const t=await E(this.loading,this.error,()=>Promise.all([_.players.me(),_.players.myHandicapHistory()]));if(!t)return;const[s,n]=t;this.player.set(s),this.history.set(n)}clear(){this.player.set(null),this.history.set([]),this.error.set(null),this.saveError.set(null)}async saveIndex(e){return await E(this.saving,this.saveError,()=>_.players.updateHandicap({handicapIndex:e}))?(await this.load(!0),!0):!1}async saveGender(e){const t=await E(this.saving,this.saveError,()=>_.players.updateProfile({gender:e}));return t?(this.player.set(t),!0):!1}}function be(r,e){return r.displayName.localeCompare(e.displayName,"sv",{sensitivity:"base"})}function Ie(r,e="frecency"){return e==="alpha"?[...r].sort(be):[...r].sort((t,s)=>{const n=t.frecency,i=s.frecency,o=n>0,d=i>0;if(o!==d)return o?-1:1;if(!o)return be(t,s);if(i!==n)return i-n;const u=t.lastPlayedAt?Date.parse(t.lastPlayedAt):NaN,c=s.lastPlayedAt?Date.parse(s.lastPlayedAt):NaN,m=Number.isNaN(u)?Number.NEGATIVE_INFINITY:u,p=Number.isNaN(c)?Number.NEGATIVE_INFINITY:c;return p!==m?p-m:be(t,s)})}const nr=1440*60*1e3;function rr(r,e){if(!r)return null;const t=Date.parse(r),s=Date.parse(e);if(Number.isNaN(t)||Number.isNaN(s))return null;const n=Math.floor((s-t)/nr);if(n<=0)return"today";if(n===1)return"yesterday";if(n<7)return`${n} days ago`;if(n<14)return"last week";if(n<30)return`${Math.floor(n/7)} weeks ago`;if(n<60)return"last month";if(n<365)return`${Math.floor(n/30)} months ago`;const i=Math.floor(n/365);return i===1?"last year":`${i} years ago`}function ir(r,e){if(r.sharedRoundCount<=0)return"never played";const t=rr(r.lastPlayedAt,e),s=`played ${r.sharedRoundCount}×`;return t?`${s}, ${t}`:s}const yt=2;function Ye(r){return r.trim().length>=yt}function _t(r){return Ie(r,"frecency")}function or(r,e){return _t([...r.filter(t=>t.id!==e.id),e])}function ar(r,e){return r.filter(t=>t.id!==e)}function Qe(r,e,t){return r.map(s=>s.id===e?{...s,isFriend:t}:s)}function lr(r,e,t=()=>{},s=300){let n=0,i;return o=>{const d=o.trim(),u=++n;if(i!==void 0&&clearTimeout(i),i=void 0,d.length<yt){e(d,[]);return}i=setTimeout(()=>{r(d).then(c=>{u===n&&e(d,c)},c=>{u===n&&t(d,c)})},s)}}const vt="tapscore.friends.sort.v1";function wt(){try{return typeof localStorage<"u"?localStorage:null}catch{return null}}function dr(r=wt()){if(!r)return"frecency";let e;try{e=r.getItem(vt)}catch{return"frecency"}return e==="alpha"?"alpha":"frecency"}function cr(r,e=wt()){if(e)try{e.setItem(vt,r)}catch{}}class Te{loading=new h(!1);error=new h(null);friends=new h([]);loaded=new h(!1);sortMode=new h(dr());query=new h("");searching=new h(!1);searchError=new h(null);results=new h([]);resultsFor=new h("");mutating=new h(!1);mutateError=new h(null);runSearch=lr(e=>_.players.search({q:e}),(e,t)=>{this.searching.set(!1),this.results.set(t),this.resultsFor.set(e)},(e,t)=>{this.searching.set(!1),this.results.set([]),this.resultsFor.set(e),this.searchError.set({code:"network",message:t instanceof Error?t.message:"Search failed. Try again."})});async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;const t=await E(this.loading,this.error,()=>_.friends.list());t&&(this.friends.set(_t(t)),this.loaded.set(!0))}setQuery(e){this.query.set(e),this.searchError.set(null),this.searching.set(e.trim().length>=2),this.runSearch(e)}async add(e){await E(this.mutating,this.mutateError,()=>_.friends.add({friendId:e.id}))&&(this.friends.set(or(this.friends.get(),{id:e.id,username:e.username,displayName:e.displayName,gender:e.gender,handicapIndex:e.handicapIndex,sharedRoundCount:0,lastPlayedAt:null,frecency:0})),this.results.set(Qe(this.results.get(),e.id,!0)))}setSortMode(e){this.sortMode.set(e),cr(e)}async remove(e){await E(this.mutating,this.mutateError,()=>_.friends.remove({friendId:e}))&&(this.friends.set(ar(this.friends.get(),e)),this.results.set(Qe(this.results.get(),e,!1)))}clear(){this.friends.set([]),this.loaded.set(!1),this.query.set(""),this.results.set([]),this.resultsFor.set(""),this.error.set(null),this.searchError.set(null),this.mutateError.set(null),this.searching.set(!1)}}const ur=["full_18","front_9","back_9"],hr=b(`
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
`),pr=b(`
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
`),mr=b(`
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
`),Xe=b(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),fr=b(`
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
`),gr=b(`
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
`),br=b(`
    <button bind="row" type="button" class="frow">
        <span bind="name" class="frow__name"></span>
        <span bind="username" class="frow__username"></span>
        <span bind="hcp" class="frow__hcp"></span>
    </button>
`),Je=b(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class yr extends T{static styles=`
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
                    flex: 1; padding: ${a("md")} 0; ${S()}
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
                & .player__name { flex: 1; padding: ${a("md")}; font-size: 1rem; ${A()} }
                & .player__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${S()}
                    font-size: 1rem; color: ${l("text-muted")};
                }
                & .player__fields { display: flex; gap: ${a("sm")}; align-items: stretch; }
                & .player__index { flex: 1; min-width: 0; padding: ${a("md")}; font-size: 1rem; ${A()} }
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
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")}; ${S()}
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
                    width: 38px; height: 38px; flex-shrink: 0; ${S()}
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
                        & input { width: 56px; padding: ${a("xs")} ${a("sm")}; ${A()} font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${a("xs")};
                    & button {
                        flex: 1; padding: ${a("sm")} 0; ${S()}
                        font-family: inherit; font-weight: 700; font-size: 0.82rem;
                        &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                    }
                }
                & .fslot__flat {
                    display: flex; align-items: center; gap: ${a("xs")}; font-size: 0.9rem;
                    color: ${l("text-muted")};
                    &[hidden] { display: none; }
                    & .fslot__pct { width: 70px; padding: ${a("sm")}; font-size: 1rem; ${A()} }
                }
                & .fslot__bands {
                    display: flex; flex-direction: column; gap: ${a("xs")};
                    &[hidden] { display: none; }
                }
                & .fslot__bandrows { display: flex; flex-direction: column; gap: ${a("xs")}; }
                & .brow {
                    display: flex; align-items: center; gap: ${a("xs")};
                    font-size: 0.82rem; color: ${l("text-muted")};
                    & .brow__pct, & .brow__upto { width: 56px; padding: ${a("sm")}; font-size: 0.95rem; ${A()} }
                    & .brow__del { margin-left: auto; width: 30px; height: 30px; ${S()} font-size: 0.8rem; color: ${l("text-muted")}; }
                }
                & .fslot__addband {
                    align-self: flex-start; padding: ${a("xs")} ${a("sm")}; ${S()}
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                }

                & .fslot__err {
                    font-size: 0.82rem; color: ${l("error")};
                    &:empty { display: none; }
                }

                & .grp__start {
                    display: flex; gap: ${a("sm")}; align-items: stretch;
                    & .grp__time { flex: 1; min-width: 0; padding: ${a("sm")} ${a("md")}; font-size: 1rem; font-family: inherit; ${A()} }
                    & .grp__hole { flex: 1; min-width: 0; font-size: 1rem; }
                }
            }

            & .setup__create {
                width: 100%; padding: ${a("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit; ${S()}
                background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                box-shadow: ${l("shadow-elevated")};
                &:hover { background: ${l("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            & .setup__cancel {
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")}; ${S()}
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
    `;svc=this.inject(sr);router=this.inject(j);auth=this.inject(M);profile=this.inject(bt);friends=this.inject(Te);pickerOpen=new h(!1);render(){const e=this.router.query("token").get(),t=!!e;this.pickerOpen.set(!1),t?this.svc.loadForEdit(e):(this.svc.reset(),this.svc.load()),this.auth.currentUser.get()&&(this.profile.load(),this.friends.load());const s=()=>t&&this.svc.editBlockedReason.get()!==null,n=()=>t&&this.svc.hasScores.get(),i=()=>this.profile.player.get(),o=()=>{const c=i();return this.auth.currentUser.get()!==null&&c!==null&&!this.svc.hasPlayer(c.id)},d=this.wire(hr,{root:{className:()=>s()?"setup setup--blocked":"setup"},back:{textContent:()=>t?"← Back to round":"← Home",onclick:()=>t&&e?this.router.navigate("/round",{query:{token:e}}):this.router.navigate("/")},title:{textContent:()=>t?"Edit round":"New round"},subtitle:{textContent:()=>t?"Change the setup — scored balls are preserved.":"No sign-in required."},blocked:{className:()=>s()?"setup__blocked":"setup__blocked hidden",textContent:()=>this.svc.editBlockedReason.get()==="round_complete"?"This round is complete — its setup can no longer be edited.":this.svc.editBlockedReason.get()==="no_stored_draft"?"This round didn't come from the setup wizard, so it can't be edited here.":""},lockNote:{className:()=>n()?"setup__locknote":"setup__locknote hidden"},routeErr:{textContent:()=>this.svc.humanizedRoute().join(`
`)},rosterErr:{textContent:()=>this.svc.humanizedRoster().join(`
`)},cancel:{className:()=>t?"setup__cancel":"setup__cancel hidden",onclick:()=>e&&this.router.navigate("/round",{query:{token:e}})},addPlayer:{onclick:()=>this.svc.addPlayer()},addMe:{className:()=>o()?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>`+ Add me (${i()?.displayName??""})`,onclick:()=>{const c=i();c&&this.svc.addMe({id:c.id,displayName:c.displayName,handicapIndex:c.handicapIndex,gender:c.gender})}},addFriends:{className:()=>this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>this.pickerOpen.get()?"− From friends":"+ From friends",onclick:()=>this.pickerOpen.set(!this.pickerOpen.get())},friendPicker:{className:()=>this.pickerOpen.get()&&this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__friends":"setup__friends hidden"},addTeam:{onclick:()=>this.svc.addTeam()},splitGroups:{className:()=>this.svc.groupsEnabled()?"setup__add hidden":"setup__add",onclick:()=>this.svc.splitIntoGroups()},addGroup:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.addGroup()},clearGroups:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.clearGroups()},groupNote:{textContent:()=>{const c=this.svc.ungroupedPlayers();return c.length===0?"":`${c.map(p=>p.name.trim()||"A player").join(", ")} ${c.length>1?"aren't":"isn't"} in a group yet — every player needs one.`}},groupWarn:{textContent:()=>[...this.svc.crossGroupTeamWarnings(),...this.svc.diagnosticsForGroups().map(c=>c.message)].join(`
`)},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const c=this.svc.playersInNoFormat();return c.length===0?"":`Heads up: ${c.map(p=>p.name.trim()||"A player").join(", ")} ${c.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.humanizedGeneral(),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?t?"Saving…":"Creating…":t?"Save changes":"Create round",onclick:async()=>{const c=await this.svc.submit();c.ok&&this.router.navigate("/round",{query:{token:c.token}})}}});this.$each(this.ref(d,"presets"),()=>ur,(c,m,p)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(c),className:()=>this.svc.preset.get()===c?"on":"",disabled:()=>n(),onclick:()=>{n()||this.svc.setPreset(c)}}},p),c=>c);const u=c=>this.track(c);return this.mountSelect(this.ref(d,"course"),u,{value:this.bound(u,()=>this.svc.courseId.get(),c=>{c&&c!==this.svc.courseId.get()&&this.svc.selectCourse(c)}),options:{get:()=>{const c=[];let m="";for(const p of this.svc.courses.get())p.clubName!==m&&(c.push({value:`__club:${p.clubName}`,label:p.clubName,disabled:!0}),m=p.clubName),c.push({value:p.id,label:p.name});return c}},placeholder:"Select a course",disabled:{get:()=>n()}}),this.mountSelect(this.ref(d,"startHole"),u,{value:this.bound(u,()=>String(this.svc.startHole.get()),c=>this.svc.startHole.set(Number(c))),options:{get:()=>this.svc.startHoleOptions().map(c=>({value:String(c),label:String(c)}))},disabled:{get:()=>n()}}),this.$each(this.ref(d,"friendRows"),()=>Ie(this.friends.friends.get().filter(c=>!this.svc.hasPlayer(c.id)),"frecency"),(c,m,p)=>this.wireEl(br,{row:{onclick:()=>this.svc.addFriend({id:c.id,displayName:c.displayName,handicapIndex:c.handicapIndex,gender:c.gender})},name:()=>c.displayName,username:()=>`@${c.username}`,hcp:()=>c.handicapIndex===null?"–":c.handicapIndex.toFixed(1)},p),c=>c.id),this.$each(this.ref(d,"players"),this.svc.players,(c,m,p)=>this.playerRow(c.key,p),c=>c.key),this.$each(this.ref(d,"teams"),this.svc.teams,(c,m,p)=>this.teamCard(c.key,p),c=>c.key),this.$each(this.ref(d,"groups"),this.svc.groups,(c,m,p)=>this.groupCard(c.key,p),c=>c.key),this.$each(this.ref(d,"formats"),this.svc.formatSlots,(c,m,p)=>this.formatCard(c.key,m,p),c=>c.key),d}mountSelect(e,t,s){const n=new ie(s);n.mount(e),t(()=>n.destroy())}bound(e,t,s){const n=new h(t());return e(k(()=>n.set(t()))),e(k(()=>{const i=n.get();queueMicrotask(()=>s(i))})),n}eachInto(e,t,s,n,i){const o=new Map,d=new Map;t(()=>{for(const u of d.values())u.forEach(c=>c());d.clear()}),t(k(()=>{const u=s(),c=new Map;for(const[p,g]of u.entries()){const $=i(g,p);if(o.has($))c.set($,o.get($));else{const y=[];c.set($,n(g,p,v=>y.push(v))),d.set($,y)}}for(const[p,g]of o)c.has(p)||(g.remove(),d.get(p)?.forEach($=>$()),d.delete(p));let m=e.firstChild;for(const p of c.values())p===m?m=m.nextSibling:e.insertBefore(p,m);o.clear();for(const[p,g]of c)o.set(p,g)}))}formatCard(e,t,s){const n=()=>this.svc.slotByKey(e),i=()=>n()?.formatId??"",o=this.wireEl(mr,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(i())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:u=>this.svc.setSlotAllowance(e,u.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(i())?"applied to each side member’s ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.humanizedForFormat(t).join(" · ")}},s);this.mountSelect(this.ref(o,"format"),s,{value:this.bound(s,()=>i(),u=>{u&&u!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,u)}),options:{get:()=>this.svc.catalog.descriptors.get().map(u=>({value:u.id,label:this.svc.catalog.labelOf(u)??u.label}))}});const d=()=>{const u=this.svc.isSideFormat(i()),c=[];u||c.push(...this.svc.players.get().map(m=>({kind:"player",subKey:m.key})));for(const m of this.svc.teams.get())this.svc.teamKindFitsFormat(i(),m.kind)&&c.push({kind:"team",subKey:m.key});return c};return this.eachInto(this.ref(o,"subjectRows"),s,d,(u,c,m)=>this.subjectRow(e,u.kind,u.subKey,m),u=>`${u.kind}${u.subKey}`),o}subjectRow(e,t,s,n){const i=()=>{if(t==="player")return this.svc.players.get().find(c=>c.key===s)?.name?.trim()||"Player";const u=this.svc.teamByKey(s);return u?`${this.svc.teamLabel(u)} (${u.kind==="multi_ball"?"side":"team"})`:"Team"},o=()=>t==="player"?this.svc.subjectPlayerIn(e,s):this.svc.subjectTeamIn(e,s),d=u=>t==="player"?this.svc.setSubjectPlayer(e,s,u):this.svc.setSubjectTeam(e,s,u);return this.wireEl(Xe,{chk:{checked:()=>o(),onchange:u=>d(u.target.checked)},name:{textContent:()=>i()}},n)}groupCard(e,t){const s=this.wireEl(gr,{remove:{onclick:()=>this.svc.removeGroup(e)},groupName:{textContent:()=>{const n=this.svc.groupByKey(e);return n?this.svc.groupLabel(n):"Group"}},time:{value:this.svc.groupByKey(e)?.startTime??"",oninput:n=>this.svc.setGroupStartTime(e,n.target.value)},meta:{textContent:()=>{const n=this.svc.groupSize(e);return n===0?"Tick the players who walk with this group.":`${n} player${n===1?"":"s"}`}}},t);return this.mountSelect(this.ref(s,"hole"),t,{value:this.bound(t,()=>{const n=this.svc.groupByKey(e)?.startHole;return n==null?"":String(n)},n=>this.svc.setGroupStartHole(e,n===""?null:Number(n))),options:{get:()=>[{value:"",label:"First hole"},...this.svc.startHoleOptions().map(n=>({value:String(n),label:`Hole ${n}`}))]}}),this.eachInto(this.ref(s,"memberRows"),t,()=>this.svc.players.get(),(n,i,o)=>this.groupMemberRow(e,n.key,o),n=>n.key),s}groupMemberRow(e,t,s){return this.wireEl(Xe,{chk:{checked:()=>this.svc.groupMemberIn(e,t),onchange:n=>this.svc.setGroupMember(e,t,n.target.checked)},name:{textContent:()=>this.svc.players.get().find(n=>n.key===t)?.name?.trim()||"Player"}},s)}teamCard(e,t){const s=()=>this.svc.teamKindOf(e)==="multi_ball",n=this.wireEl(fr,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const i=this.svc.teamByKey(e);return i?this.svc.teamLabel(i):"Team"}},compGroup:{hidden:()=>s()},membersLabel:{textContent:()=>s()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const i=this.svc.teamSize(e);if(i===0)return s()?"Tick at least 2 members — a side needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(i<2)return"Add one more member — a team needs at least 2.";if(s())return`${i} balls · a side (scored together by a side format)`;const o=this.svc.teamBallCh(e);return o===null?`${i} players`:`${i} players · plays off CH ${o}`}}},t);return this.mountSelect(this.ref(n,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),i=>this.svc.setTeamKind(e,i==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"One combined ball"},{value:"multi_ball",label:"Separate balls (a side)"}]}}),this.mountSelect(this.ref(n,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",i=>this.svc.setTeamFormation(e,i)),options:{get:()=>this.svc.formations.map(i=>({value:i,label:i[0].toUpperCase()+i.slice(1)}))}}),this.eachInto(this.ref(n,"memberRows"),t,()=>{const i=this.svc.players.get().map(o=>({kind:"player",mKey:o.key}));if(s())for(const o of this.svc.eligibleNestedTeams(e))i.push({kind:"team",mKey:o.key});return i},(i,o,d)=>i.kind==="player"?this.teamMemberRow(e,i.mKey,d):this.teamNestedRow(e,i.mKey,d),i=>`${i.kind}${i.mKey}`),n}teamNestedRow(e,t,s){const n=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(Je,{chk:{checked:()=>n(),disabled:()=>!n()&&this.svc.teamAtMaxSize(e),onchange:i=>this.svc.setTeamMemberTeam(e,t,i.target.checked)},name:{textContent:()=>{const i=this.svc.teamByKey(t);return i?`${this.svc.teamLabel(i)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},s)}teamMemberRow(e,t,s){const n=()=>this.svc.players.get().find(o=>o.key===t)??null,i=()=>this.svc.teamMemberIn(e,t);return this.wireEl(Je,{chk:{checked:()=>i(),disabled:()=>!i()&&this.svc.teamAtMaxSize(e),onchange:o=>this.svc.setTeamMember(e,t,o.target.checked)},name:{textContent:()=>n()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!i()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:o=>this.svc.setTeamPct(e,t,o.target.value)}},s)}playerRow(e,t){const s=()=>this.svc.players.get().find(o=>o.key===e)??null,n=()=>this.svc.players.get().findIndex(o=>o.key===e),i=this.wireEl(pr,{name:{value:s()?.name??"",readOnly:()=>!!s()?.playerId,oninput:o=>this.svc.patchPlayer(e,{name:o.target.value})},index:{value:s()?.handicapIndex??"",oninput:o=>this.svc.patchPlayer(e,{handicapIndex:o.target.value})},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const o=s();if(!o)return"";const d=this.svc.derivedCH(o);if(!d)return"";const u=d.rating;return`Course handicap ${d.ch}  ·  ${o.handicapIndex} × ${u.slope}/113 + (${u.courseRating} − ${u.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(n()).map(o=>o.message).join(" · ")}},t);return this.mountSelect(this.ref(i,"gender"),t,{value:this.bound(t,()=>s()?.gender??"M",o=>this.svc.patchPlayer(e,{gender:o})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]},disabled:{get:()=>s()?.genderKnown===!0}}),this.mountSelect(this.ref(i,"tee"),t,{value:this.bound(t,()=>s()?.teeId??"",o=>this.svc.patchPlayer(e,{teeId:o})),options:{get:()=>this.svc.tees.get().map(o=>({value:o.id,label:o.name}))},placeholder:"Tee"}),i}}const _r=b(`
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
`);class vr extends T{static styles=`
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
                    ${A()}
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
                        ${S()}
                        &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                    }
                }

                & button {
                    padding: ${a("md")} ${a("lg")};
                    font-size: 1rem;
                    font-weight: 700;
                    ${S()}
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
    `;auth=this.inject(M);router=this.inject(j);nextQ=this.router.query("next");mode=new h("login");busy=new h(!1);registerError=new h("");username="";password="";displayName="";hcp="";gender=new h(null);destination(e){const t=this.nextQ.get();return t&&t.startsWith("/")?t:e}async submit(){if(this.registerError.set(""),this.mode.get()==="login"){await this.auth.login(this.username,this.password)&&this.router.navigate(this.destination("/"),!0);return}const e=this.hcp.trim().replace(",","."),t=e===""?null:Number.parseFloat(e);if(t!==null&&!Number.isFinite(t)){this.registerError.set("Handicap index must be a number (or leave it empty).");return}if(this.password.length<8){this.registerError.set("Password must be at least 8 characters.");return}if(!this.username.trim()||!this.displayName.trim()){this.registerError.set("Username and display name are required.");return}this.busy.set(!0);try{const s=await _.players.register({username:this.username.trim(),password:this.password,displayName:this.displayName.trim(),handicapIndex:t,gender:this.gender.get()});this.auth.currentUser.set({id:s.id,username:s.username}),this.router.navigate(this.destination("/"),!0)}catch(s){this.registerError.set(s instanceof L&&s.status===409?"That username is taken.":s instanceof L?s.message:"Could not create the account. Try again.")}finally{this.busy.set(!1)}}render(){const e=()=>this.mode.get()==="register",t=()=>this.auth.loading.get()||this.busy.get(),s=this.wire(_r,{root:{inert:()=>t()},error:{className:()=>this.registerError.get()||this.auth.error.get()?"error show":"error",textContent:()=>this.registerError.get()||this.auth.error.get()?.message||""},form:{onsubmit:async i=>{i.preventDefault(),await this.submit()}},username:{oninput:i=>{this.username=i.target.value}},password:{autocomplete:()=>e()?"new-password":"current-password",oninput:i=>{this.password=i.target.value}},registerFields:{className:()=>e()?"login__register":"login__register hidden"},displayName:{oninput:i=>{this.displayName=i.target.value}},hcp:{oninput:i=>{this.hcp=i.target.value}},submit:{textContent:()=>t()?e()?"Creating account…":"Signing in…":e()?"Create account":"Sign in"},toggle:{textContent:()=>e()?"Have an account? Sign in":"New here? Create an account",onclick:()=>{this.registerError.set(""),this.auth.error.set(null),this.mode.set(e()?"login":"register")}}}),n=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];return this.$each(this.ref(s,"gender"),()=>n,(i,o,d)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>i.label,className:()=>this.gender.get()===i.value?"on":"",onclick:()=>this.gender.set(i.value)}},d),i=>i.label),s}}const wr=b(`
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
                <div class="friends__sechead">
                    <h2>My friends</h2>
                    <div bind="sortToggle" class="friends__sort" role="group" aria-label="Sort friends">
                        <button bind="sortFrecency" type="button" class="friends__sortbtn">Suggested</button>
                        <button bind="sortAlpha" type="button" class="friends__sortbtn">A–Z</button>
                    </div>
                </div>
                <div bind="friendsEmpty" class="friends__empty">No friends yet — search above to add the people you play with.</div>
                <div bind="friends" class="friends__list"></div>
            </section>
        </div>
    </div>
`),xr=b(`
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
`),$r=b(`
    <div class="friend-row">
        <span bind="initials" class="friend-row__badge"></span>
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="subtitle" class="friend-row__subtitle"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="remove" class="friend-row__remove" type="button" aria-label="Remove friend">✕</button>
    </div>
`);function Ze(r){return r.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0].toUpperCase()).join("")}class kr extends T{static styles=`
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
                    ${S()}
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

            & .friends__sechead {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${a("md")};
                & h2 { margin: 0; }
            }

            & .friends__sort {
                display: inline-flex; flex-shrink: 0;
                border: 1px solid ${l("border")}; border-radius: ${l("radius-pill")};
                overflow: hidden;
                &.hidden { display: none; }

                & .friends__sortbtn {
                    ${S()}
                    font-family: inherit; font-size: 0.78rem; font-weight: 700;
                    padding: ${a("xs")} ${a("md")};
                    background: transparent; color: ${l("text-muted")};
                    border: none; border-radius: 0;

                    &[aria-pressed='true'] {
                        background: ${l("primary")}; color: ${l("primary-text")};
                    }
                }
            }

            & .friends__search {
                width: 100%;
                padding: ${a("md")} ${a("lg")};
                font-size: 1rem;
                ${A()}
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
                & .friend-row__username,
                & .friend-row__subtitle {
                    color: ${l("text-muted")}; font-size: 0.8rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .friend-row__subtitle:empty { display: none; }
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
                    ${S()}
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
                    width: 34px; height: 34px; flex-shrink: 0; ${S()}
                    font-size: 0.9rem; color: ${l("text-muted")};
                }
            }
        }
    `;svc=this.inject(Te);auth=this.inject(M);router=this.inject(j);render(){const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.load();const t=this.wire(wr,{anon:{className:()=>e()?"friends__anon hidden":"friends__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},body:{className:()=>e()?"friends__body":"friends__body hidden"},search:{value:()=>this.svc.query.get(),oninput:n=>this.svc.setQuery(n.target.value)},searchHint:{textContent:()=>{const n=this.svc.query.get().trim();return n.length>0&&!Ye(n)?"Type at least 2 characters.":this.svc.searching.get()?"Searching…":""}},searchErr:{textContent:()=>this.svc.searchError.get()?.message??""},resultsEmpty:{className:()=>{const n=this.svc.query.get().trim();return Ye(n)&&!this.svc.searching.get()&&this.svc.searchError.get()===null&&this.svc.resultsFor.get()===n&&this.svc.results.get().length===0?"friends__empty":"friends__empty hidden"}},friendsEmpty:{className:()=>this.svc.loaded.get()&&this.svc.friends.get().length===0?"friends__empty":"friends__empty hidden"},sortToggle:{className:()=>this.svc.friends.get().length>0?"friends__sort":"friends__sort hidden"},sortFrecency:{"aria-pressed":()=>String(this.svc.sortMode.get()==="frecency"),onclick:()=>this.svc.setSortMode("frecency")},sortAlpha:{"aria-pressed":()=>String(this.svc.sortMode.get()==="alpha"),onclick:()=>this.svc.setSortMode("alpha")}});this.$each(this.ref(t,"results"),this.svc.results,(n,i,o)=>this.wireEl(xr,{initials:()=>Ze(n.displayName),name:()=>n.displayName,username:()=>`@${n.username}`,hcp:()=>n.handicapIndex===null?"–":n.handicapIndex.toFixed(1),add:{className:()=>this.isFriendNow(n.id)?"friend-row__add hidden":"friend-row__add",disabled:()=>this.svc.mutating.get(),onclick:()=>{const d=this.svc.results.get().find(u=>u.id===n.id);d&&!d.isFriend&&this.svc.add(d)}},added:{className:()=>this.isFriendNow(n.id)?"friend-row__added":"friend-row__added hidden"}},o),n=>n.id);const s=new Date().toISOString();return this.$each(this.ref(t,"friends"),()=>Ie(this.svc.friends.get(),this.svc.sortMode.get()),(n,i,o)=>this.wireEl($r,{initials:()=>Ze(n.displayName),name:()=>n.displayName,subtitle:()=>{const d=this.svc.friends.get().find(u=>u.id===n.id)??n;return ir(d,s)},hcp:()=>n.handicapIndex===null?"–":n.handicapIndex.toFixed(1),remove:{disabled:()=>this.svc.mutating.get(),onclick:()=>{this.svc.remove(n.id)}}},o),n=>n.id),t}isFriendNow(e){return this.svc.results.get().find(t=>t.id===e)?.isFriend===!0}}const Sr=b(`
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
`),Ir=b(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`);class Tr extends T{static styles=`
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
                    ${S()}
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
                    & input { width: 90px; padding: ${a("md")}; font-size: 1rem; text-align: center; ${A()} }
                    & button {
                        padding: ${a("md")} ${a("lg")}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700; ${S()}
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
                        ${S()}
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
    `;svc=this.inject(bt);friends=this.inject(Te);auth=this.inject(M);router=this.inject(j);indexDraft=new h("");localErr=new h("");render(){this.auth.currentUser.get()&&this.svc.load();const e=()=>this.auth.currentUser.get()!==null,t=this.wire(Sr,{anon:{className:()=>e()?"profile__anon hidden":"profile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/profile"}})},body:{className:()=>e()?"profile__body":"profile__body hidden"},name:()=>this.svc.player.get()?.displayName??"…",username:()=>{const n=this.svc.player.get();return n?`@${n.username}`:""},hcp:()=>{const n=this.svc.player.get()?.handicapIndex;return n==null?"–":n.toFixed(1)},index:{value:()=>this.indexDraft.get(),oninput:n=>this.indexDraft.set(n.target.value)},save:{disabled:()=>this.svc.saving.get()||this.indexDraft.get().trim()==="",textContent:()=>this.svc.saving.get()?"Saving…":"Save"},form:{onsubmit:async n=>{n.preventDefault(),this.localErr.set("");const i=this.indexDraft.get().trim().replace(",","."),o=Number.parseFloat(i);if(!Number.isFinite(o)||o<-10||o>54){this.localErr.set("Enter an index between -10 and 54.");return}await this.svc.saveIndex(o)&&this.indexDraft.set("")}},saveErr:{textContent:()=>this.localErr.get()||this.svc.saveError.get()?.message||""},genderErr:{textContent:()=>this.svc.saveError.get()?.message||""},historyEmpty:{className:()=>this.svc.history.get().length===0?"profile__empty":"profile__empty hidden"},signout:{onclick:async()=>{await this.auth.logout(),this.svc.clear(),this.friends.clear(),this.router.navigate("/")}}});this.$each(this.ref(t,"history"),this.svc.history,(n,i,o)=>this.wireEl(Ir,{index:()=>n.handicapIndex.toFixed(1),source:()=>n.source,date:()=>n.effectiveDate},o),n=>n.id);const s=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];return this.$each(this.ref(t,"gender"),()=>s,(n,i,o)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>n.label,className:()=>this.svc.player.get()?.gender===n.value?"on":"",disabled:()=>this.svc.saving.get(),onclick:()=>{this.svc.saveGender(n.value)}}},o),n=>n.label),t}}const Er=b(`
    <div class="app-shell">
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class Cr extends T{static styles=`
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
    `;router=this.inject(j);render(){const e=this.wire(Er,{});return this.spawn(_s,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":Be,"/history":Os,"/round":Gn,"/create":yr,"/login":vr,"/friends":kr,"/profile":Tr},Be),e}}B.get(Mt);const et=B.get(j),tt=B.get(M);await Ft(Cr,"#app",{hot:void 0,onInit:async()=>{await tt.load(),tt.currentUser.get()&&et.route.get()==="/login"&&et.navigate("/",!0)}});export{T as C,j as R,h as S,Mt as T,f as a,re as b,w as c,k as e,E as r,b as t};
