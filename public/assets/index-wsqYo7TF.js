(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function t(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=t(n);fetch(n.href,r)}})();const qt="modulepreload",Kt=function(i){return"/tapscore/"+i},Ge={},Vt=function(e,t,s){let n=Promise.resolve();if(t&&t.length>0){let u=function(c){return Promise.all(c.map(m=>Promise.resolve(m).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),d=l?.nonce||l?.getAttribute("nonce");n=u(t.map(c=>{if(c=Kt(c),c in Ge)return;Ge[c]=!0;const m=c.endsWith(".css"),p=m?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${p}`))return;const g=document.createElement("link");if(g.rel=m?"stylesheet":qt,m||(g.as="script"),g.crossOrigin="",g.href=c,d&&g.setAttribute("nonce",d),document.head.appendChild(g),m)return new Promise((x,v)=>{g.addEventListener("load",x),g.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${c}`)))})}))}function r(l){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=l,window.dispatchEvent(d),!d.defaultPrevented)throw l}return n.then(l=>{for(const d of l||[])d.status==="rejected"&&r(d.reason);return e().catch(r)})};class Ut{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])this.batching?this.pending.add(t):t.run()}runTracked(e,t){ft(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.run()}}}const U=new Ut;function ft(i){for(const e of i.deps)e.delete(i);i.deps.clear()}class h{constructor(e){this.subs=new Set,this.val=e}get(){return U.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,U.notify(this.subs))}update(e){this.set(e(this.val))}}class y{constructor(e){this.subs=new Set,this.val=void 0;const t=this,s={run(){U.runTracked(s,()=>{const n=e();Object.is(t.val,n)||(t.val=n,U.notify(t.subs))})},deps:new Set};s.run()}get(){return U.subscribe(this.subs),this.val}peek(){return this.val}}function $(i){const e={run(){U.runTracked(e,i)},deps:new Set};return e.run(),()=>ft(e)}function de(i){U.batch(i)}function V(i){return U.untrack(i)}class Wt{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const z=new Wt,oe="/tapscore/".replace(/\/+$/,"");function Te(i){return oe?i===oe?"/":i.startsWith(oe+"/")?i.slice(oe.length):i:i}function Qt(i){return oe+i}class N{constructor(){this.route=new h(Te(location.pathname??"/")),this.search=new h(location.search??""),window.addEventListener("popstate",()=>de(()=>{this.route.set(Te(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},n=e.indexOf("#"),r=n>=0?e.slice(n):"",l=n>=0?e.slice(0,n):e,d=l.indexOf("?"),u=d>=0?l.slice(0,d):l,c=d>=0?l.slice(d+1):"",m=s.query!==void 0?Yt(s.query):c?"?"+c:"",p=Qt(u)+m+r;(s.replace?history.replaceState:history.pushState).call(history,null,"",p),de(()=>{this.route.set(u),this.search.set(m)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:n=>{n.preventDefault(),this.navigate(e)},className:()=>{const n=this.route.get();return n===s||n.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new y(()=>{const s=this.route.get().split("/"),n={};for(const[r,l]of t.entries())l.startsWith(":")&&(n[l.slice(1)]=s[r]??"");return n})}query(e){return new y(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new y(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function Yt(i){const e=new URLSearchParams;for(const[s,n]of Object.entries(i))n==null||n===""||e.set(s,String(n));const t=e.toString();return t?"?"+t:""}function Xt(i){return e=>i[e]}function Jt(i,e){const t=(n,r,l)=>{const d=Object.entries(n).map(([u,c])=>`--${u}:${c}`).join(";");return`${r}{color-scheme:${l};${d}}`},s=document.createElement("style");return s.textContent=t(i,'[data-theme="light"]',"light")+t(e,'[data-theme="dark"]',"dark"),document.head.appendChild(s),n=>`var(--${n})`}const qe="basics-js-theme";class Zt{constructor(){this.dark=new h(!1);const e=localStorage.getItem(qe),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),$(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(qe,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function _(i){const e=document.createElement("template");return e.innerHTML=i,e}function es(i,e){let t;for(const s of Object.keys(e))i.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const Ke=new Set;class I{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!Ke.has(t)){Ke.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return z.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const n=V(()=>{const r=new e(s[0]);return r.mount(t),r});return this.children.push(n),n}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0}wire(e,t,s){const n=s??(l=>this.track(l)),r=e.content.cloneNode(!0);for(const l of r.querySelectorAll("[bind]")){const d=t[l.getAttribute("bind")];if(d)if(typeof d=="function")n($(()=>{const u=d();l instanceof HTMLInputElement||l instanceof HTMLTextAreaElement?l.value=String(u):l.textContent=String(u)}));else for(const[u,c]of Object.entries(d)){const m=u.includes("-");u.startsWith("on")&&typeof c=="function"?l.addEventListener(u.slice(2),c):typeof c=="function"?n($(()=>{const p=c();m?l.setAttribute(u,String(p)):l[u]=p})):m?l.setAttribute(u,String(c)):l[u]=c}}return r}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const n=this.ref(t,e);return n?(typeof s=="string"?n.textContent=s:typeof s=="function"&&s.prototype instanceof I?this.spawn(s,n):typeof s=="function"&&s(n,{spawn:(r,l,...d)=>this.spawn(r,l,...d),track:r=>this.track(r)}),!0):!1}$each(e,t,s,n=(r,l)=>l){const r=typeof t=="function"?t:()=>t.get(),l=new Map,d=new Map;this.track(()=>{for(const u of d.values())u.forEach(c=>c());d.clear()}),this.track($(()=>{const u=r(),c=new Map;for(const[p,g]of u.entries()){const x=n(g,p);if(l.has(x))c.set(x,l.get(x));else{const v=[];c.set(x,V(()=>s(g,p,k=>v.push(k)))),d.set(x,v)}}for(const[p,g]of l)c.has(p)||(g.remove(),d.get(p)?.forEach(x=>x()),d.delete(p));let m=e.firstChild;for(const p of c.values())p===m?m=m.nextSibling:e.insertBefore(p,m);l.clear();for(const[p,g]of c)l.set(p,g)}))}$condition(e,t,s,n){let r=null;this.track($(()=>{r&&(r.remove(),r=null);const l=t.get();r=V(()=>l?s():n?.()??null),r&&e.appendChild(r)}))}$swap(e,t,s,n){let r=null;this.track($(()=>{r&&(r.destroy(),r=null),e.textContent="";const l=t.get(),d=s[l]??es(l,s)??n;d&&(r=V(()=>{const u=new d;return u.mount(e),u}))})),this.track(()=>r?.destroy())}}async function ts(i,e,t){const s=document.querySelector(e);s.textContent="";const n=z.get(N);let r=null,l=!1,d=null,u=!!t?.hot?.data.hmr;const c=async m=>{r&&(r.destroy(),r=null,s.textContent=""),m?(d||(d=(await Vt(()=>import("./obs-shell.component-v2iX25Jo.js"),[])).ObsShellComponent),r=V(()=>new d)):(!u&&t?.onInit&&(await t.onInit(),u=!0),r=V(()=>new i)),V(()=>r.mount(s)),l=m};await c(Te(location.pathname).startsWith("/_obs")),$(()=>{const m=n.route.get().startsWith("/_obs");m!==l&&c(m)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>r?.destroy()),t.hot.accept())}class M extends Error{constructor(e,t,s,n){super(t),this.status=e,this.details=s,this.traceId=n,this.name="ApiError"}}const ss=10,be=[];let _e=[],ae=null;function ns(i){be.push(i),be.length>ss&&be.shift()}function is(i,e,t){const s={code:i,message:e,url:typeof location<"u"?location.href:"",context:[...be],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),_e.push(s),rs()}function rs(){ae||(ae=setTimeout(gt,5e3))}function gt(){if(ae&&(clearTimeout(ae),ae=null),_e.length===0)return;const i=_e;_e=[];for(const e of i){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon("/api/_obs/errors",new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch("/api/_obs/errors",{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&gt()});const os=3e4,as=2,pe=new Map,bt=new WeakMap;function ls(i){if(i instanceof M)return i.traceId;if(i!=null&&typeof i=="object")return bt.get(i)}async function f(i){if(i.method==="GET"){const e=pe.get(i.url);if(e)return e;const t=Ve(i,as);return pe.set(i.url,t),t.then(()=>pe.delete(i.url),()=>pe.delete(i.url)),t}return Ve(i,0)}async function Ve(i,e){const t=i.timeout??os;let s;for(let n=0;n<=e;n++){const r=crypto.randomUUID();try{return await cs(ds(i,r),t)}catch(l){if(s=l,!(l instanceof M)&&l!=null&&typeof l=="object"&&bt.set(l,r),l instanceof M||n===e)break;await new Promise(d=>setTimeout(d,1e3*2**n))}}throw s}async function ds(i,e){const t={"X-Trace-Id":e},s={method:i.method,headers:t};i.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(i.body));const n=await fetch(i.url,s),r=n.headers.get("x-trace-id")??e;if(ns({type:"api",detail:`${i.method} ${i.url}`,timestamp:new Date().toISOString()}),!n.ok){const l=await n.json().catch(()=>({error:n.statusText}));throw new M(n.status,l.error??n.statusText,l.details,r)}return n.json()}function cs(i,e){let t;const s=new Promise((n,r)=>{t=setTimeout(()=>r(new Error("Request timeout")),e)});return Promise.race([i,s]).finally(()=>clearTimeout(t))}async function C(i,e,t){de(()=>{i.set(!0),e.set(null)});try{const s=await t();return i.set(!1),s}catch(s){const n=us(s);de(()=>{i.set(!1),e.set(n)}),is(n.code,n.message,ls(s));return}}function us(i){return i instanceof M?i.status===401?{code:"auth",message:"Unauthorized"}:i.status===409?{code:"conflict",message:"Data has changed — please try again"}:i.status===400?{code:"validation",message:i.message}:{code:"server",message:"Server error"}:i instanceof Error?i.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}function hs(i){return{me:()=>f({method:"GET",url:`${i}/auth/me`}),login:e=>f({method:"POST",url:`${i}/auth/login`,body:e}),logout:()=>f({method:"POST",url:`${i}/auth/logout`,body:{}})}}class R{constructor(){this.api=hs("/api"),this.currentUser=new h(null),this.loading=new h(!1),this.error=new h(null)}async load(){const e=await C(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await C(this.loading,this.error,()=>this.api.login({username:e,password:t}));return s?(this.currentUser.set(s),!0):!1}async logout(){await C(this.loading,this.error,()=>this.api.logout());const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const Ue={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},o=Jt({...Ue,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},{...Ue,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"}),L=i=>`var(--${i})`,a=Xt({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem"}),w=(i=L("radius"))=>`
    border: 1px solid ${L("border")};
    border-radius: ${i};
    background: ${L("btn-bg")};
    color: ${L("text")};
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: ${L("btn-hover")}; }
`,H=()=>`
    border: 1px solid ${L("border")};
    border-radius: ${L("radius")};
    background: ${L("input-bg")};
    color: ${L("text")};
    font-family: inherit;
    &::placeholder { color: ${L("text-muted")}; }
`,T=i=>`
    background: ${L("surface")};
    border: 1px solid ${L("border")};
    border-radius: ${L("radius")};
    box-shadow: ${L("shadow")};
    ${i?.hover?`
    transition: box-shadow 0.2s, border-color 0.2s;
    &:hover { box-shadow: ${L("shadow-elevated")}; }`:""}
`;function ps(i){return{async me(){return f({method:"GET",url:`${i}/players/me`})},async register(e){return f({method:"POST",url:`${i}/players/register`,body:e})},async updateHandicap(e){return f({method:"POST",url:`${i}/players/me/handicap`,body:e})},async myHandicapHistory(){return f({method:"GET",url:`${i}/players/me/handicap-history`})},async updateProfile(e){return f({method:"POST",url:`${i}/players/me/profile`,body:e})},async search(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/players/search${s?"?"+s:""}`})}}}function ms(i){return{async list(){return f({method:"GET",url:`${i}/friends`})},async add(e){return f({method:"POST",url:`${i}/friends`,body:e})},async remove(e){return f({method:"DELETE",url:`${i}/friends/${e.friendId}`})}}}function fs(i){return{async list(){return f({method:"GET",url:`${i}/clubs`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/clubs/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${i}/clubs`,body:e})},async update(e){return f({method:"POST",url:`${i}/clubs/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${i}/clubs/${e.id}`})}}}function gs(i){return{async list(){return f({method:"GET",url:`${i}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/courses/by-club${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/courses/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${i}/courses`,body:e})},async update(e){return f({method:"POST",url:`${i}/courses/update`,body:e})},async updateHole(e){return f({method:"POST",url:`${i}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/courses/validate${s?"?"+s:""}`})},async remove(e){return f({method:"DELETE",url:`${i}/courses/${e.id}`})}}}function bs(i){return{async listByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/tees/by-course${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/tees/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${i}/tees`,body:e})},async update(e){return f({method:"POST",url:`${i}/tees/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${i}/tees/${e.id}`})}}}function _s(i){return{async create(e){return f({method:"POST",url:`${i}/guest-players`,body:e})}}}function ys(i){return{async latest(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/handicap/latest${s?"?"+s:""}`})},async history(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/handicap/history${s?"?"+s:""}`})},async record(e){return f({method:"POST",url:`${i}/handicap/record`,body:e})}}}function vs(i){return{async list(){return f({method:"GET",url:`${i}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/rounds/balls${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/rounds/get${s?"?"+s:""}`})},async create(e){return f({method:"POST",url:`${i}/rounds`,body:e})},async createFromDraft(e){return f({method:"POST",url:`${i}/rounds/from-draft`,body:e})},async update(e){return f({method:"POST",url:`${i}/rounds/update`,body:e})},async remove(e){return f({method:"DELETE",url:`${i}/rounds/${e.id}`})}}}function ws(i){return{async listByRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/score-events/by-round${s?"?"+s:""}`})},async append(e){return f({method:"POST",url:`${i}/score-events`,body:e})}}}function xs(i){return{async forBall(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/scorecards/for-ball${s?"?"+s:""}`})},async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/scorecards/for-round${s?"?"+s:""}`})}}}function $s(i){return{async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/leaderboards/for-round${s?"?"+s:""}`})}}}function ks(i){return{async create(e){return f({method:"POST",url:`${i}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/friendly-rounds/by-token${s?"?"+s:""}`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/friendly-rounds/balls${s?"?"+s:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/friendly-rounds/scorecard${s?"?"+s:""}`})},async result(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/friendly-rounds/result${s?"?"+s:""}`})},async score(e){return f({method:"POST",url:`${i}/friendly-rounds/score`,body:e})},async setup(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/friendly-rounds/setup${s?"?"+s:""}`})},async editSetup(e){return f({method:"POST",url:`${i}/friendly-rounds/setup`,body:e})},async remove(e){return f({method:"DELETE",url:`${i}/friendly-rounds/${e.token}`})},async finish(e){return f({method:"POST",url:`${i}/friendly-rounds/finish`,body:e})},async reopen(e){return f({method:"POST",url:`${i}/friendly-rounds/reopen`,body:e})},async join(e){return f({method:"POST",url:`${i}/friendly-rounds/join`,body:e})},async leave(e){return f({method:"POST",url:`${i}/friendly-rounds/leave`,body:e})},async claimGuest(e){return f({method:"POST",url:`${i}/friendly-rounds/claim-guest`,body:e})},async claimSeat(e){return f({method:"POST",url:`${i}/friendly-rounds/claim-seat`,body:e})},async releaseSeat(e){return f({method:"POST",url:`${i}/friendly-rounds/release-seat`,body:e})}}}function Ss(i){return{async myRounds(){return f({method:"GET",url:`${i}/dashboard/my-rounds`})}}}function Is(i){return{async clubs(){return f({method:"GET",url:`${i}/setup/clubs`})},async courses(){return f({method:"GET",url:`${i}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/setup/tees/by-course${s?"?"+s:""}`})},async formats(){return f({method:"GET",url:`${i}/setup/formats`})},async aggregations(){return f({method:"GET",url:`${i}/setup/aggregations`})}}}function Cs(i){return{async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/competitions/get${s?"?"+s:""}`})},async participants(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return f({method:"GET",url:`${i}/competitions/participants${s?"?"+s:""}`})},async leaderboard(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const n=s.toString();return f({method:"GET",url:`${i}/competitions/${e.id}/leaderboard${n?"?"+n:""}`})},async results(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const n=s.toString();return f({method:"GET",url:`${i}/competitions/${e.id}/results${n?"?"+n:""}`})},async list(){return f({method:"GET",url:`${i}/competitions`})},async create(e){return f({method:"POST",url:`${i}/competitions`,body:e})},async update(e){return f({method:"POST",url:`${i}/competitions/update`,body:e})},async transition(e){return f({method:"POST",url:`${i}/competitions/transition`,body:e})},async createRound(e){const t=new Set(["id"]),s={};for(const[n,r]of Object.entries(e))t.has(n)||(s[n]=r);return f({method:"POST",url:`${i}/competitions/${e.id}/rounds`,body:s})},async applyCut(e){const t=new Set(["id"]),s={};for(const[n,r]of Object.entries(e))t.has(n)||(s[n]=r);return f({method:"POST",url:`${i}/competitions/${e.id}/cut`,body:s})},async finalize(e){const t=new Set(["id"]),s={};for(const[n,r]of Object.entries(e))t.has(n)||(s[n]=r);return f({method:"POST",url:`${i}/competitions/${e.id}/finalize`,body:s})},async addParticipant(e){return f({method:"POST",url:`${i}/competitions/participants/add`,body:e})},async removeParticipant(e){return f({method:"POST",url:`${i}/competitions/participants/remove`,body:e})},async withdrawParticipant(e){return f({method:"POST",url:`${i}/competitions/participants/withdraw`,body:e})}}}const P="/tapscore/".replace(/\/+$/,"")+"/api",b={players:ps(P),friends:ms(P),clubs:fs(P),courses:gs(P),tees:bs(P),guestPlayers:_s(P),handicap:ys(P),rounds:vs(P),scoreEvents:ws(P),scorecards:xs(P),leaderboards:$s(P),friendlyRounds:ks(P),dashboard:Ss(P),setup:Is(P),competitions:Cs(P)};function Ts(i){return[...i.played?["Played"]:[],...i.created?["Created"]:[]].join(" · ")}function Es(i,e){const t=new Map;for(const s of e)t.set(s.round.id,{round:s.round,token:s.friendlyRound.shareToken,played:!1,created:!0});for(const s of i){const n=t.get(s.round.id);n?n.played=!0:t.set(s.round.id,{round:s.round,token:s.shareToken,played:!0,created:!1})}return[...t.values()].sort((s,n)=>n.round.date.localeCompare(s.round.date)||s.round.id.localeCompare(n.round.id))}function Ns(i,e){return i.filter(t=>t.played&&!t.created&&!e.has(t.round.id)).slice().sort((t,s)=>s.round.date.localeCompare(t.round.date)||t.round.id.localeCompare(s.round.id))}function We(i,e){return i.some(t=>t.round.id===e)?i.filter(t=>t.round.id!==e):i}const _t="tapscore.seen-rounds.v1",Ps=500;function ve(){try{return typeof localStorage<"u"?localStorage:null}catch{return null}}function ze(i=ve()){if(!i)return[];let e;try{e=i.getItem(_t)}catch{return[]}if(!e)return[];try{const t=JSON.parse(e);return Array.isArray(t)?t.filter(s=>typeof s=="string"):[]}catch{return[]}}function Qe(i=ve()){return new Set(ze(i))}function yt(i,e){try{i.setItem(_t,JSON.stringify(e))}catch{}}function zs(i,e=ve()){if(!e)return[];const t=ze(e).filter(n=>n!==i),s=[i,...t].slice(0,Ps);return yt(e,s),s}function vt(i,e=ve()){if(!e)return[];const t=ze(e),s=t.filter(n=>n!==i);return s.length!==t.length&&yt(e,s),s}const wt="tapscore.device-rounds.v1",Rs=50;function Re(){try{return typeof localStorage<"u"?localStorage:null}catch{return null}}function je(i=Re()){if(!i)return[];let e;try{e=i.getItem(wt)}catch{return[]}if(!e)return[];try{const t=JSON.parse(e);return Array.isArray(t)?t.filter(js):[]}catch{return[]}}function js(i){if(typeof i!="object"||i===null)return!1;const e=i;return typeof e.token=="string"&&typeof e.courseName=="string"&&(e.status==="not_started"||e.status==="active"||e.status==="complete")&&typeof e.lastSeenAt=="string"}function xt(i,e){try{i.setItem(wt,JSON.stringify(e))}catch{}}function ye(i,e=Re()){if(!e)return[];const t=je(e).filter(n=>n.token!==i.token),s=[i,...t].slice(0,Rs);return xt(e,s),s}function $t(i,e=Re()){if(!e)return[];const t=je(e),s=t.filter(n=>n.token!==i);return s.length!==t.length&&xt(e,s),s}class Oe{mine=new h(null);mineLoading=new h(!1);mineError=new h(null);myRounds=new y(()=>{const e=this.mine.get();return e?Es(e.produced,e.created):[]});deviceRounds=new h([]);seenIds=new h(Qe());newRounds=new y(()=>Ns(this.myRounds.get(),this.seenIds.get()));async loadMine(){this.seenIds.set(Qe());const e=await C(this.mineLoading,this.mineError,()=>b.dashboard.myRounds());e&&this.mine.set(e)}loadDevice(){this.deviceRounds.set(je())}async remove(e,t){try{await b.friendlyRounds.remove({token:e})}catch{return!1}const s=this.mine.get();return s&&this.mine.set({produced:We(s.produced,t),created:We(s.created,t)}),this.deviceRounds.set($t(e)),vt(t),!0}}const Os={DEV:!1};function Ls(i,e){return i===void 0||i===""?e:i!=="0"&&i.toLowerCase()!=="false"}const Ye=Os??{},kt={competitions:Ls(Ye.VITE_FEATURE_COMPETITIONS,!!Ye.DEV)},Ds=_(`
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
        <a bind="compsLink" href="/competitions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5v2a3 3 0 0 0 3 3"/><path d="M16 5h3v2a3 3 0 0 1-3 3"/><path d="M10 12.5V15h4v-2.5"/><path d="M9 20h6"/><path d="M12 15v5"/>
            </svg>
            <span>Comps</span>
        </a>
        <a bind="profileLink" href="/profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M5 20c.7-4 3.3-6 7-6s6.3 2 7 6"/>
            </svg>
            <span>Profile</span>
        </a>
    </nav>
`);class Hs extends I{static styles=`
        .tabbar {
            display: flex;
            background: ${o("topbar-bg")};
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
                    background: ${o("accent")};
                    color: ${o("topbar-bg")};
                    font-size: 0.62rem;
                    font-weight: 800;
                    line-height: 1;
                    border-radius: ${o("radius-pill")};

                    &.show { display: inline-flex; }
                }

                &.active { color: ${o("accent")}; }
            }
        }
    `;router=this.inject(N);auth=this.inject(R);landing=this.inject(Oe);newCount=new y(()=>this.auth.currentUser.get()?this.landing.newRounds.get().length:0);render(){const e=this.wire(Ds,{root:{className:()=>{const t=this.router.route.get();return!this.auth.currentUser.get()||t==="/login"||t==="/round"?"tabbar hidden":"tabbar"}},homeLink:this.router.link("/"),badge:{textContent:()=>{const t=this.newCount.get();return t===0?"":String(t)},className:()=>this.newCount.get()===0?"tabbar__badge":"tabbar__badge show"},friendsLink:this.router.link("/friends"),compsLink:this.router.link("/competitions"),profileLink:this.router.link("/profile")});return kt.competitions||this.ref(e,"compsLink").remove(),e}}const Me=class Me extends I{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track($(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};Me.styles=`
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
    `;let Ee=Me;const O=i=>`var(--${i})`,Ae=class Ae extends I{render(){const e=document.createElement("div");this.spawn(Ee,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const t=document.createElement("h2");t.className="ui-confirm__title",t.textContent=this.props.title??"Confirm",this.dialogEl.appendChild(t);const s=document.createElement("p");if(s.className="ui-confirm__message",typeof this.props.message=="function"){const d=this.props.message;this.track($(()=>{s.textContent=d()}))}else s.textContent=this.props.message;this.dialogEl.appendChild(s);const n=document.createElement("div");n.className="ui-confirm__actions";const r=document.createElement("button");r.className="ui-confirm__btn ui-confirm__btn--cancel",r.textContent=this.props.cancelLabel??"Cancel",r.addEventListener("click",d=>{d.stopPropagation(),this.handleCancel()}),n.appendChild(r);const l=document.createElement("button");return l.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",l.textContent=this.props.confirmLabel??"Confirm",l.addEventListener("click",d=>{d.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),n.appendChild(l),this.dialogEl.appendChild(n),this.dialogEl.addEventListener("click",d=>d.stopPropagation()),e.appendChild(this.dialogEl),this.track($(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};Ae.styles=`
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${O("surface")};
            border: 1px solid ${O("border")};
            border-radius: ${O("radius")};
            box-shadow: ${O("shadow-elevated")};
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
            color: ${O("text")};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${O("text")};
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
            border: 1px solid ${O("border")};
            border-radius: ${O("radius")};
            cursor: pointer;
            transition: background 0.15s;
        }
        .ui-confirm__btn--cancel {
            background: ${O("btn-bg")};
            color: ${O("text")};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${O("btn-hover")};
        }
        .ui-confirm__btn--confirm {
            background: ${O("primary")};
            color: #fff;
            border-color: ${O("primary")};
        }
        .ui-confirm__btn--confirm:hover {
            filter: brightness(0.9);
        }
        .ui-confirm__btn--danger {
            background: ${O("error")};
            color: #fff;
            border-color: ${O("error")};
        }
        .ui-confirm__btn--danger:hover {
            filter: brightness(0.9);
        }
    `;let G=Ae;function Ms(i){const e=typeof navigator<"u"?navigator.language:void 0;return typeof e=="string"&&e.toLowerCase().startsWith("sv")?"sv":"en"}function St(){return Ms()}class ce{loading=new h(!1);error=new h(null);descriptors=new h([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await C(this.loading,this.error,()=>b.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=St()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:s.teamSize?.min??2,max:s.teamSize?.max??2},...s.teamCount?{teamCount:s.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}acceptsSideSubjects(e){const t=this.byId(e);return!t||this.isSideFormat(e)?!1:(t.requirements.scoreEntry?.metadata?.length??0)===0}}function It(i){const e=z.get(ce);return e.load(),e.labelOf(i.formatId)??`${i.scoringMode} · ${i.teamShape}`}function As(i){return i.map(e=>({key:e.round.id,token:e.token,roundId:e.round.id,courseName:e.round.courseNameSnapshot??"",status:e.round.status,completedAt:e.round.completedAt,lastActivityAt:e.round.date,roleLabel:Ts(e)||null,date:e.round.date,formats:e.round.formatSlots.map(It).join(" · ")}))}function Fs(i){return i.map(e=>({key:e.token,token:e.token,roundId:null,courseName:e.courseName,status:e.status,completedAt:e.completedAt??null,lastActivityAt:e.lastSeenAt,roleLabel:null,date:null,formats:null}))}const le={fromMyRounds:As,fromDeviceRounds:Fs},Bs=14,Gs=1440*60*1e3;function ie(i,e){return e(i)}function qs(i,e,t,s=Bs){const n=e-s*Gs,r=[],l=[];for(const d of i){const u=ie(d,t);if(u.status==="complete"){const c=u.completedAt?Date.parse(u.completedAt):NaN;(Number.isNaN(c)||c>=n)&&l.push(d)}else r.push(d)}return r.sort((d,u)=>Xe(ie(d,t).lastActivityAt,ie(u,t).lastActivityAt)),l.sort((d,u)=>Xe(ie(d,t).completedAt,ie(u,t).completedAt)),{ongoing:r,finished:l}}function Xe(i,e){const t=i?Date.parse(i):NaN,s=e?Date.parse(e):NaN,n=Number.isNaN(t)?Number.NEGATIVE_INFINITY:t,r=Number.isNaN(s)?Number.NEGATIVE_INFINITY:s;return n===r?0:r-n}const Ks=_(`
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
`),Vs='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',Us=_(`
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
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${Vs}</button>
    </div>
`),Ct={not_started:"Not started",active:"Live",complete:"Finished"};class Je extends I{static styles=`
        .landing {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .landing__head {
                text-align: center;
                margin-bottom: ${a("xl")};

                & .landing__flag { font-size: 2.2rem; line-height: 1; }
                & h1 {
                    margin: ${a("xs")} 0 0;
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 2.2rem;
                    letter-spacing: -0.02em;
                    color: ${o("text")};
                }
                & p {
                    margin: ${a("xs")} 0 0;
                    color: ${o("text-muted")};
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
                background: ${o("primary")};
                color: ${o("primary-text")};
                border: none;
                box-shadow: ${o("shadow-elevated")};
                &:hover { background: ${o("primary")}; }

                & .landing__create-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .landing__section-block {
                margin-bottom: ${a("xl")};
                &.hidden { display: none; }
            }

            /* The "New — you were added" strip reads as a highlight: its count
               is an accent pill so a fresh add draws the eye at the top. */
            & .landing__new-count {
                background: ${o("accent-soft")};
                color: ${o("accent")};
                font-weight: 700;
                border-radius: ${o("radius-pill")};
                padding: 1px 9px;
                font-size: 0.8rem;
            }

            & .landing__section {
                display: flex;
                align-items: baseline;
                gap: ${a("sm")};
                margin-bottom: ${a("sm")};

                & .landing__section-title {
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: ${o("text")};
                }
                & .landing__count {
                    color: ${o("text-muted")};
                    font-size: 0.85rem;
                }
            }

            & .landing__empty {
                color: ${o("text-muted")};
                font-size: 0.9rem;
                padding: ${a("lg")} 0;

                &.hidden { display: none; }
            }

            & .round-row__role {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: ${o("accent")};
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
                ${T({hover:!0})}

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
                    color: ${o("text-muted")};
                    cursor: pointer;
                    border-radius: 0 ${o("radius")} ${o("radius")} 0;

                    & svg { width: 17px; height: 17px; }
                    &:hover, &:active { color: ${o("error")}; }
                    &:focus-visible { outline: 2px solid ${o("error")}; outline-offset: -2px; }
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
                    color: ${o("text")};
                }
                & .round-row__status {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    border-radius: ${o("radius-pill")};
                    padding: 2px 10px;
                    flex-shrink: 0;

                    &.s-active { background: ${o("accent-soft")}; color: ${o("accent")}; }
                    &.s-complete { background: ${o("surface-sunken")}; color: ${o("text-muted")}; }
                    &.s-not_started { background: ${o("surface-sunken")}; color: ${o("text-muted")}; }
                }
                & .round-row__bottom {
                    display: flex;
                    justify-content: space-between;
                    gap: ${a("md")};
                    color: ${o("text-muted")};
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
                color: ${o("accent")};
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
                color: ${o("text-muted")};
                text-decoration: underline;
                cursor: pointer;
            }
        }

        /* App-level accessibility override for the framework confirm dialog. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;svc=this.inject(Oe);auth=this.inject(R);router=this.inject(N);loggedIn=new y(()=>this.auth.currentUser.get()!==null);rows=new y(()=>this.loggedIn.get()?le.fromMyRounds(this.svc.myRounds.get()):le.fromDeviceRounds(this.svc.deviceRounds.get()));parts=new y(()=>qs(this.rows.get(),Date.now(),e=>e));ongoing=new y(()=>this.parts.get().ongoing);finished=new y(()=>this.parts.get().finished);newRows=new y(()=>this.loggedIn.get()?le.fromMyRounds(this.svc.newRounds.get()):[]);deleteOpen=new h(!1);deleteTarget=new h(null);askDelete(e,t,s){this.deleteTarget.set({token:e,roundId:t,name:s}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?this.svc.loadMine():this.svc.loadDevice();const e=()=>this.rows.get().length>0,t=this.wire(Ks,{createBtn:{onclick:()=>this.router.navigate("/create")},signin:{className:()=>this.loggedIn.get()?"landing__signin hidden":"landing__signin",onclick:()=>this.router.navigate("/login")},history:{className:()=>e()?"landing__history":"landing__history hidden",onclick:()=>this.router.navigate("/history")},newSection:{className:()=>this.newRows.get().length>0?"landing__section-block landing__new":"landing__section-block landing__new hidden"},newCount:()=>{const n=this.newRows.get().length;return n===0?"":String(n)},ongoingSection:{className:()=>this.ongoing.get().length>0?"landing__section-block":"landing__section-block hidden"},ongoingCount:()=>{const n=this.ongoing.get().length;return n===0?"":String(n)},finishedSection:{className:()=>this.finished.get().length>0?"landing__section-block":"landing__section-block hidden"},finishedCount:()=>{const n=this.finished.get().length;return n===0?"":String(n)},empty:{className:()=>e()?"landing__empty hidden":"landing__empty"}});this.$each(this.ref(t,"newList"),this.newRows,(n,r,l)=>this.roundRow(n,l),n=>n.key),this.$each(this.ref(t,"ongoingList"),this.ongoing,(n,r,l)=>this.roundRow(n,l),n=>n.key),this.$each(this.ref(t,"finishedList"),this.finished,(n,r,l)=>this.roundRow(n,l),n=>n.key),this.spawn(G,this.ref(t,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const n=this.deleteTarget.get();return`Delete ${n?`“${n.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const n=this.deleteTarget.get();n&&this.svc.remove(n.token,n.roundId)}});const s=n=>{n.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",s),this.track(()=>window.removeEventListener("keydown",s)),t}roundRow(e,t){return this.wireEl(Us,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},course:()=>e.courseName||"Round",role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>Ct[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>e.date??"",formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",e.courseName||"this round")}}},t)}}function Ws(i){return[...i].sort((e,t)=>{const s=Ze(e),n=Ze(t);return n!==s?n-s:e.key.localeCompare(t.key)})}function Ze(i){const e=i.completedAt??i.lastActivityAt,t=e?Date.parse(e):NaN;return Number.isNaN(t)?Number.NEGATIVE_INFINITY:t}const Qs=_(`
    <div class="history">
        <button bind="back" class="history__back" type="button">← Home</button>
        <h1 class="history__title">All rounds</h1>
        <div bind="empty" class="history__empty">No rounds yet — create one to tee off.</div>
        <div bind="list" class="history__list"></div>
        <div bind="confirmHost"></div>
    </div>
`),Ys='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',Xs=_(`
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
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${Ys}</button>
    </div>
`);class Js extends I{static styles=`
        .history {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .history__back {
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 600;
                color: ${o("text-muted")};
                cursor: pointer;
                padding: ${a("xs")} 0;
                margin-bottom: ${a("md")};
            }

            & .history__title {
                margin: 0 0 ${a("lg")};
                font-family: ${o("font-display")};
                font-weight: 600;
                font-size: 1.8rem;
                letter-spacing: -0.02em;
                color: ${o("text")};
            }

            & .history__empty {
                color: ${o("text-muted")};
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
                ${T({hover:!0})}

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
                    color: ${o("text-muted")};
                    cursor: pointer;
                    border-radius: 0 ${o("radius")} ${o("radius")} 0;

                    & svg { width: 17px; height: 17px; }
                    &:hover, &:active { color: ${o("error")}; }
                    &:focus-visible { outline: 2px solid ${o("error")}; outline-offset: -2px; }
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
                    color: ${o("text")};
                }
                & .round-row__role {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: ${o("accent")};
                    flex-shrink: 0;
                    &.hidden { display: none; }
                }
                & .round-row__status {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    border-radius: ${o("radius-pill")};
                    padding: 2px 10px;
                    flex-shrink: 0;

                    &.s-active { background: ${o("accent-soft")}; color: ${o("accent")}; }
                    &.s-complete { background: ${o("surface-sunken")}; color: ${o("text-muted")}; }
                    &.s-not_started { background: ${o("surface-sunken")}; color: ${o("text-muted")}; }
                }
                & .round-row__bottom {
                    display: flex;
                    justify-content: space-between;
                    gap: ${a("md")};
                    color: ${o("text-muted")};
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
    `;svc=this.inject(Oe);auth=this.inject(R);router=this.inject(N);loggedIn=new y(()=>this.auth.currentUser.get()!==null);rows=new y(()=>Ws(this.loggedIn.get()?le.fromMyRounds(this.svc.myRounds.get()):le.fromDeviceRounds(this.svc.deviceRounds.get())));deleteOpen=new h(!1);deleteTarget=new h(null);askDelete(e,t,s){this.deleteTarget.set({token:e,roundId:t,name:s}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?this.svc.loadMine():this.svc.loadDevice();const e=this.wire(Qs,{back:{onclick:()=>this.router.navigate("/")},empty:{className:()=>this.rows.get().length===0?"history__empty":"history__empty hidden"}});this.$each(this.ref(e,"list"),this.rows,(s,n,r)=>this.roundRow(s,r),s=>s.key),this.spawn(G,this.ref(e,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const s=this.deleteTarget.get();return`Delete ${s?`“${s.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const s=this.deleteTarget.get();s&&this.svc.remove(s.token,s.roundId)}});const t=s=>{s.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t)),e}roundRow(e,t){return this.wireEl(Xs,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},course:()=>e.courseName||"Round",role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>Ct[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>e.date??"",formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",e.courseName||"this round")}}},t)}}const Zs=180,et=4,en=12;function se(i,e){return e<=0?0:Math.max(0,Math.min(e-1,i))}function tn(i){const{dragDistance:e,velocity:t,itemWidth:s}=i;if(Math.abs(e)<en)return 0;const n=e+t*Zs,r=Math.round(-n/s);return Math.max(-et,Math.min(et,r))}const tt="tapscore:pending-scores:v1",sn=336*60*60*1e3,st=200;function nn(){try{return globalThis.localStorage??null}catch{return null}}function rn(i){if(typeof i!="object"||i===null)return!1;const e=i;return typeof e.token=="string"&&typeof e.ballId=="string"&&typeof e.playHoleId=="string"&&(typeof e.strokes=="number"||e.strokes===null)&&(e.eventType==="score_entered"||e.eventType==="score_cleared")&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class on{entries=[];storage;constructor(e=nn(),t=Date.now()){this.storage=e,this.entries=this.load();const s=this.applyHygiene(t);s.length!==this.entries.length&&(this.entries=s,this.persist())}enqueue(e){const t=this.entries.findIndex(s=>s.token===e.token&&s.ballId===e.ballId&&s.playHoleId===e.playHoleId);t>=0?this.entries[t]=e:this.entries.push(e),this.entries=this.applyHygiene(e.queuedAt),this.persist()}remove(e){const t=this.entries.filter(s=>s.clientEventId!==e);t.length!==this.entries.length&&(this.entries=t,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(s=>e-s.queuedAt<=sn);return t.length>st?t.slice(t.length-st):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(tt);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(rn):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(tt,JSON.stringify(this.entries))}catch{}}}const an=["1st","2nd","3rd","4th","5th","6th","7th","8th"],Y=(i,e)=>`${i}|${e}`;function Tt(i){return i.players.map(e=>e.displayName).join(" & ")||i.label||"Ball"}function ln(i,e,t){return i?!(i.minPar!==void 0&&e<i.minPar||i.maxPar!==void 0&&e>i.maxPar||i.pars&&!i.pars.includes(e)||i.holes&&!i.holes.includes(t)):!0}class ee{constructor(e=new on){this.queue=e}queue;loading=new h(!1);error=new h(null);friendlyRound=new h(null);round=new h(null);startList=new h(null);balls=new h([]);scorecards=new h([]);cells=new h(new Map);result=new h(null);resultLoading=new h(!1);resultError=new h(null);resultCursor=null;holeIdx=new h(0);groupIdx=new h(0);keypadOpen=new h(!1);selectedSlot=new h(null);token=null;loadSeq=0;resultSeq=0;flushing=!1;pendingSlotIndex=null;async loadByToken(e,t){const s=e!==this.token;this.token=e;const n=++this.loadSeq;s&&this.resetForNewToken(t),z.get(ce).load();const r=await C(this.loading,this.error,()=>b.friendlyRounds.byToken({token:e}));if(!r||n!==this.loadSeq||e!==this.token)return;if(this.friendlyRound.set(r.friendlyRound),this.round.set(r.round),this.startList.set(r.startList),ye({token:e,courseName:r.round.courseNameSnapshot??"",status:r.round.status,completedAt:r.round.completedAt,lastSeenAt:new Date().toISOString()}),z.get(R).currentUser.get()&&zs(r.round.id),this.pendingSlotIndex!==null){const c=r.round.formatSlots[this.pendingSlotIndex]?.slotDefId??null;this.pendingSlotIndex=null,c!==null&&this.selectedSlot.set(c)}const[l,d]=await Promise.all([b.friendlyRounds.balls({token:e}).catch(()=>[]),b.friendlyRounds.scorecard({token:e}).catch(()=>[])]);n!==this.loadSeq||e!==this.token||(this.cells.set(new Map),this.scorecards.set(d),this.balls.set(l),await this.flushPending())}deleting=new h(!1);async deleteRound(){const e=this.token;if(!e||this.deleting.get())return!1;this.deleting.set(!0);try{await b.friendlyRounds.remove({token:e}),$t(e);const t=this.round.get()?.id;return t&&vt(t),!0}catch{return!1}finally{this.deleting.set(!1)}}finishing=new h(!1);async finishRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await b.friendlyRounds.finish({token:e}),s=this.round.get();return e===this.token&&s&&(this.round.set({...s,status:t.status,completedAt:t.completedAt}),ye({token:e,courseName:s.courseNameSnapshot??"",status:t.status,completedAt:t.completedAt,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async reopenRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await b.friendlyRounds.reopen({token:e}),s=this.round.get();return e===this.token&&s&&(this.round.set({...s,status:t.status,completedAt:null}),ye({token:e,courseName:s.courseNameSnapshot??"",status:t.status,completedAt:null,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async loadResult(){const e=this.token;if(!e)return;const t=++this.resultSeq,s=await C(this.resultLoading,this.resultError,()=>b.friendlyRounds.result({token:e}));t!==this.resultSeq||e!==this.token||s&&(this.resultCursor=s.cursor,s.unchanged||this.result.set(s.result))}async pollResult(){const e=this.token;if(!e)return;const t=++this.resultSeq;let s;try{s=await b.friendlyRounds.result({token:e,...this.resultCursor!==null?{cursor:this.resultCursor}:{}})}catch{return}t!==this.resultSeq||e!==this.token||(this.resultCursor=s.cursor,s.unchanged||this.result.set(s.result))}ballNameById=new y(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,Tt(t));for(const t of this.result.get()?.slots??[])for(const s of t.subjectLabels??[])e.set(s.ballId,s.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}isPending(e){return this.balls.get().find(t=>t.id===e)?.pending===!0}groupLabelByBallId=new y(()=>{const e=new Map,t=this.groups();return t.length<2||t.forEach((s,n)=>{for(const r of s.ballIds)e.set(r,`Group ${n+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}selectedSlotDefId(){const e=this.round.get()?.formatSlots??[];if(e.length===0)return null;const t=this.selectedSlot.get();return t!==null&&e.some(s=>s.slotDefId===t)?t:e[0]?.slotDefId??null}selectSlot(e){this.selectedSlot.set(e)}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return se(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),s=t?.playHoles.find(l=>l.id===e);if(!t||!s)return"";const n=t.playHoles.filter(l=>l.courseHoleNumber===s.courseHoleNumber).sort((l,d)=>l.ordinal-d.ordinal);if(n.length===1)return`${s.courseHoleNumber}`;const r=n.findIndex(l=>l.id===e);return`${s.courseHoleNumber} (${an[r]??`${r+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(se(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(se(this.holeIndex()+1,this.playedOrder().length))}strokesFor(e,t){const s=this.cells.get().get(Y(e,t));return s?s.strokes:this.scorecards.get().find(l=>l.ballId===e)?.holes.find(l=>l.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(Y(e,t))?.status??null}metadataFor(e,t,s){const n=this.cells.get().get(Y(e,t));return n&&n.metadata!==void 0?n.metadata?.[s]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[s]}metadataInputs(){const e=z.get(ce),t=this.round.get()?.formatSlots??[],s=[],n=new Set;for(const r of t){const l=e.byId(r.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of l)n.has(d.key)||(n.add(d.key),s.push(d))}return s}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>ln(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,s,n){const r=Y(e,t),l=crypto.randomUUID();this.patchCell(r,{strokes:s,metadata:n,status:"saving",clientEventId:l});const d=this.token;d&&(this.enqueue(d,e,t,s,n,l),await this.post(d,e,t,s,n,l))}async retry(e,t){const s=Y(e,t),n=this.cells.get().get(s);if(!n)return;this.patchCell(s,{...n,status:"saving"});const r=this.token;r&&(this.enqueue(r,e,t,n.strokes,n.metadata,n.clientEventId),await this.post(r,e,t,n.strokes,n.metadata,n.clientEventId))}async flushPending(){const e=this.token;if(!(!e||this.flushing)){this.flushing=!0;try{for(const t of this.queue.entriesFor(e)){if(e!==this.token)return;this.patchCell(Y(t.ballId,t.playHoleId),{strokes:t.strokes,metadata:t.metadata,status:"saving",clientEventId:t.clientEventId}),await this.post(e,t.ballId,t.playHoleId,t.strokes,t.metadata,t.clientEventId)}}finally{this.flushing=!1}}}enqueue(e,t,s,n,r,l){this.queue.enqueue({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:l,...r!==void 0?{metadata:r}:{},queuedAt:Date.now()})}async post(e,t,s,n,r,l){const d=Y(t,s);try{await b.friendlyRounds.score({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:l,...r!=null?{metadata:r}:{}}),this.queue.remove(l);const u=this.cells.get().get(d);u&&u.clientEventId===l&&this.patchCell(d,{...u,status:"saved"});const c=this.round.get();e===this.token&&c&&c.status==="not_started"&&this.round.set({...c,status:"active"})}catch{const u=this.cells.get().get(d);u&&u.clientEventId===l&&this.patchCell(d,{...u,status:"error"})}}patchCell(e,t){const s=new Map(this.cells.get());s.set(e,t),this.cells.set(s)}resetForNewToken(e){this.resultSeq++,this.resultCursor=null,this.friendlyRound.set(null),this.round.set(null),this.startList.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(e?.holeIdx??0),this.groupIdx.set(e?.groupIdx??0),this.keypadOpen.set(!1);const t=e?.selectedSlot;this.pendingSlotIndex=null,typeof t=="string"?this.selectedSlot.set(t):typeof t=="number"?(this.pendingSlotIndex=t,this.selectedSlot.set(null)):this.selectedSlot.set(null)}}const X=60,nt=8,Ne=4,dn=Array.from({length:Ne*2+1},(i,e)=>e-Ne),cn="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",un=_(`
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
                <span class="se-modal__nav">
                    <button bind="modalPrev" class="se-modal__navbtn" type="button" aria-label="Previous hole">‹</button>
                    <button bind="modalNext" class="se-modal__navbtn" type="button" aria-label="Next hole">›</button>
                </span>
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
`),hn=_(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),it=_(`
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
`),pn=_(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),rt=_(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),mn=_(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`);class fn extends I{static styles=`
        .se {
            margin-top: ${a("xl")};
            &.hidden { display: none; }
        }

        /* Clipped two-cell carousel right-aligned over the score columns. */
        .se__carousel {
            position: relative;
            height: 60px;
            overflow: hidden;
            border-radius: ${o("radius")};
            background: ${o("surface-sunken")};
            border: 1px solid ${o("border")};
            touch-action: pan-y;
            user-select: none;
        }
        .se__clip {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${nt}px;
            width: ${X*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-Ne*X}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${X}px;
            width: ${X}px;
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
                font-family: ${o("font-display")};
                font-weight: 700;
                font-size: 1.2rem;
                color: ${o("text")};
            }
            & .se-hole__par {
                font-size: 0.68rem;
                color: ${o("text-muted")};
            }
        }

        .se__rows {
            margin-top: ${a("sm")};
            border-top: 1px solid ${o("border")};
        }
        .se-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${a("md")};
            padding: ${a("md")} 0;
            border-bottom: 1px solid ${o("border")};

            & .se-row__who { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
            & .se-row__name {
                font-family: ${o("font-display")};
                font-weight: 600;
                font-size: 1.05rem;
                color: ${o("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .se-row__topar { font-size: 0.8rem; font-weight: 600; }

            & .se-row__scores { display: flex; align-items: center; padding-right: ${nt}px; flex-shrink: 0; }
            & .se-row__slot { width: ${X}px; display: flex; align-items: center; justify-content: center; }
            & .se-row__prev {
                font-family: ${o("font-display")}; font-weight: 700; font-size: 1.05rem;
                color: ${o("text-muted")};
                font-variant-numeric: tabular-nums;
            }
            & .se-row__circle {
                width: 48px; height: 48px; border-radius: 999px;
                border: none; cursor: pointer;
                background: ${o("accent-soft")};
                font-family: ${o("font-display")}; font-weight: 700; font-size: 1.25rem;
                color: ${o("primary")};
                font-variant-numeric: tabular-nums;
                transition: background 0.15s;
                &:active { background: ${o("accent")}; }
                &.empty { color: ${o("text-muted")}; background: ${o("surface-sunken")}; }
            }
            /* Phase 5.5 — unclaimed placeholder seat: muted label, inert circle. */
            & .se-row__name--pending { color: ${o("text-muted")}; font-style: italic; }
            & .se-row__circle--pending { cursor: default; opacity: 0.55; &:active { background: ${o("surface-sunken")}; } }
        }
        .se-row__topar.under { color: ${o("under-par")}; }
        .se-row__topar.over { color: ${o("over-par")}; }
        .se-row__topar.even { color: ${o("text-muted")}; }

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
            & .se-modal__title { font-family: ${o("font-display")}; font-weight: 700; font-size: 1.1rem; }
            & .se-modal__nav { display: flex; gap: 4px; }
            & .se-modal__navbtn {
                background: none; border: none; color: #fff; font-size: 1.6rem; line-height: 1;
                width: 40px; height: 40px; border-radius: 999px; cursor: pointer;
                &:active { background: rgba(255,255,255,0.1); }
                &:disabled { opacity: 0.35; cursor: default; }
            }
        }
        .se-modal__list { flex: 1; overflow-y: auto; }
        .se-mrow {
            width: 100%;
            display: flex; align-items: center; justify-content: space-between;
            padding: ${a("lg")};
            background: none; border: none; border-left: 4px solid transparent;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            color: #fff; font-family: inherit; cursor: pointer; text-align: left;

            &.sel { border-left-color: ${o("primary")}; background: rgba(93,155,117,0.14); }

            & .se-mrow__who { display: flex; flex-direction: column; gap: 2px; }
            & .se-mrow__name { font-family: ${o("font-display")}; font-weight: 600; font-size: 1rem; }
            & .se-mrow__hcp { font-size: 0.8rem; color: rgba(255,255,255,0.55); }

            & .se-mrow__circle {
                width: 52px; height: 52px; border-radius: 999px;
                display: flex; align-items: center; justify-content: center;
                background: ${o("primary")};
                font-family: ${o("font-display")}; font-weight: 700; font-size: 1.25rem;
                font-variant-numeric: tabular-nums;
            }
            &.sel .se-mrow__circle { background: #fff; color: ${o("primary")}; }
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
                & .se-stats__hole { font-family: ${o("font-display")}; font-weight: 700; font-size: 1.1rem; }
                & .se-stats__spacer { width: 40px; }
            }

            & .se-stats__who {
                display: flex; align-items: center; justify-content: center; gap: ${a("md")};
                padding: ${a("lg")} ${a("lg")} ${a("sm")};
            }
            & .se-stats__name { font-family: ${o("font-display")}; font-weight: 700; font-size: 1.4rem; }
            & .se-stats__score {
                min-width: 44px; height: 44px; padding: 0 8px; border-radius: 999px;
                display: inline-flex; align-items: center; justify-content: center;
                background: ${o("primary")}; color: #fff;
                font-family: ${o("font-display")}; font-weight: 700; font-size: 1.3rem;
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
                font-family: ${o("font-display")}; font-weight: 700; font-size: 1.05rem;
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
                &.on-hit { background: ${o("primary")}; border-color: ${o("primary")}; color: #fff; }
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
                background: ${o("primary")};
                color: #fff;
                font-family: ${o("font-display")};
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
            &.par { background: ${o("primary")}; }
            &.clear { color: ${o("error")}; }
            &.muted { color: rgba(255,255,255,0.5); }

            & .se-key__num { font-size: 1.3rem; font-weight: 700; font-family: ${o("font-display")}; }
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
            & .se-pad__ext-val { width: 72px; text-align: center; font-family: ${o("font-display")}; font-weight: 700; font-size: 2.6rem; color: #fff; }
            & .se-pad__ext-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            & .se-pad__ext-cancel { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: #2a2a2a; color: #fff; font-weight: 600; font-family: inherit; }
            & .se-pad__ext-ok { height: 52px; border-radius: 10px; border: none; cursor: pointer; background: ${o("primary")}; color: #fff; font-size: 1.3rem; }
        }

        .se-toast {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 60;
            background: ${o("primary")}; color: ${o("primary-text")};
            font-family: ${o("font-display")}; font-weight: 700;
            padding: ${a("md")} ${a("xl")}; border-radius: ${o("radius")};
            box-shadow: ${o("shadow-elevated")};
            &.hidden { display: none; }
        }
    `;svc=this.inject(ee);holeIdx=this.svc.holeIdx;modalOpen=this.svc.keypadOpen;currentBallIdx=new h(0);holeCompleteOnEntry=!1;extendedOpen=new h(!1);extendedScore=new h(10);statsOpen=new h(!1);pendingMeta=new h({});lastMetaKey=null;toastMsg=new h(null);dragOffset=new h(0);transitioning=new h(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new y(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[se(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(s=>[s.id,s]));return e.ballIds.map(s=>t.get(s)).filter(s=>!!s)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>Tt(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);toParValue=e=>{let t=0,s=0,n=!1;for(const r of this.playedOrder()){const l=this.svc.strokesFor(e.id,r.playHoleId);l!==null&&l>0&&(t+=l,s+=this.parFor(r.playHoleId),n=!0)}return n?t-s:null};toParText=e=>{const t=this.toParValue(e);return t===null?"–":t===0?"E":t>0?`+${t}`:`${t}`};toParClass=e=>{const t=this.toParValue(e);return`se-row__topar ${t===null||t===0?"even":t<0?"under":"over"}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const s=e-t;return s<=-4||s>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(s)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer),this.modalOpen.set(!1)}),this.track($(()=>{const r=this.ballsInGroup().length;r>0&&this.currentBallIdx.get()>=r&&this.currentBallIdx.set(0)}));const e=this.wire(un,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1)}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const r=this.currentHole();return r?`Hole ${this.occLabel(r.playHoleId)} · Par ${this.parFor(r.playHoleId)}`:""},modalPrev:{onclick:()=>this.stepHole(-1),disabled:()=>!this.svc.canPrevHole()},modalNext:{onclick:()=>this.stepHole(1),disabled:()=>!this.svc.canNextHole()},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>this.statsOpen.set(!1)},statsHole:()=>{const r=this.currentHole();return r?`Hole ${this.occLabel(r.playHoleId)} · Par ${this.parFor(r.playHoleId)}`:""},statsTitle:()=>{const r=this.ballsInGroup()[this.currentBallIdx.get()];return r?this.ballName(r):""},statsScore:()=>{const r=this.ballsInGroup()[this.currentBallIdx.get()],l=this.currentHole();return!r||!l?"":this.displayScore(this.svc.strokesFor(r.id,l.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.holeCompleteOnEntry||this.advance()}}}),t=this.ref(e,"viewport"),s=this.ref(e,"track");this.bindCarouselPointer(t,s),this.track($(()=>{s.style.transition=this.transitioning.get()?cn:"none",s.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(s,new y(()=>dn),(r,l,d)=>this.holeItem(r,d),r=>r),this.$each(this.ref(e,"rows"),new y(()=>{const r=this.playedOrder(),l=this.holeIndex(),d=r[l];if(!d)return[];const u=l>0?r[l-1].playHoleId:null;return this.ballsInGroup().map(c=>({ball:c,ph:d.playHoleId,prevPh:u}))}),(r,l,d)=>this.playerRow(r.ball,r.ph,r.prevPh,d),r=>`${r.ball.id}|${r.ph}`),this.$each(this.ref(e,"modalList"),new y(()=>this.ballsInGroup()),(r,l,d)=>this.modalRow(r,l,d),r=>r.id);const n=this.ref(e,"keys");for(const r of[1,2,3,4,5,6,7,8,9])n.appendChild(this.numberKey(r));return n.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),n.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),n.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(e,"statsBody"),new y(()=>this.metaInputs()),(r,l,d)=>this.metaChip(r,d),r=>r.key),this.track($(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null;return}const r=this.ballsInGroup()[this.currentBallIdx.get()],l=this.currentHole();if(!r||!l)return;const d=`${r.id}|${l.playHoleId}`;if(d===this.lastMetaKey)return;this.lastMetaKey=d;const u={};for(const c of this.metaInputs())u[c.key]=this.svc.metadataFor(r.id,l.playHoleId,c.key)===!0;this.pendingMeta.set(u)})),e}holeItem(e,t){return this.wireEl(hn,{item:{className:()=>{const s=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${s?" gone":""}`}},hnum:{textContent:()=>{const s=this.occAtOffset(e);return s?this.occLabel(s.playHoleId):""}},hpar:{textContent:()=>{const s=this.occAtOffset(e);return s?`Par ${this.parFor(s.playHoleId)}`:""}}},t)}playerRow(e,t,s,n){return e.pending?this.wireEl(it,{name:{textContent:this.ballName(e),className:"se-row__name se-row__name--pending"},topar:{textContent:"open seat",className:"se-row__topar"},prev:{textContent:""},cval:{textContent:"–"},circle:{className:"se-row__circle empty se-row__circle--pending"}},n):this.wireEl(it,{name:{textContent:this.ballName(e)},topar:{textContent:()=>this.toParText(e),className:()=>this.toParClass(e)},prev:{textContent:()=>s?this.displayScore(this.svc.strokesFor(e.id,s)):""},cval:{textContent:()=>this.displayScore(this.svc.strokesFor(e.id,t))},circle:{className:()=>this.svc.strokesFor(e.id,t)===null?"se-row__circle empty":"se-row__circle",onclick:()=>this.openModalForBall(e.id)}},n)}modalRow(e,t,s){const n=e.pending?"Open seat — claim to score":e.players.length>1?`Team · CH ${e.courseHandicap}`:`CH ${e.players[0]?.courseHandicap??e.courseHandicap}`;return this.wireEl(pn,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.currentBallIdx.set(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:n},mval:{textContent:()=>{const r=this.currentHole();return r?this.displayScore(this.svc.strokesFor(e.id,r.playHoleId)):"–"}}},s)}numberKey(e){return this.wireEl(rt,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,s,n){return this.wireEl(rt,{key:{className:s,onclick:n},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(s=>s.id===e);this.currentBallIdx.set(t<0?0:t),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.noteHoleEntered(),this.modalOpen.set(!0)}noteHoleEntered(){const e=this.currentHole(),t=this.ballsInGroup().filter(s=>!s.pending);this.holeCompleteOnEntry=!!e&&t.length>0&&t.every(s=>this.svc.strokesFor(s.id,e.playHoleId)!==null)}stepHole(e){this.advanceTimer&&(clearTimeout(this.advanceTimer),this.advanceTimer=null),this.extendedOpen.set(!1),this.statsOpen.set(!1),e<0?this.svc.prevHole():this.svc.nextHole(),this.currentBallIdx.set(0),this.noteHoleEntered()}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){const t=this.ballsInGroup(),s=this.currentHole(),n=t[this.currentBallIdx.get()];if(!s||!n)return;if(n.pending){this.holeCompleteOnEntry||this.advance();return}const r=e===null?void 0:this.metaSnapshot();this.svc.setScore(n.id,s.playHoleId,e,r),e!==null&&e>0&&this.metaInputs().length>0?this.statsOpen.set(!0):this.holeCompleteOnEntry||this.advance()}hasMoreUnscored=()=>{const e=this.ballsInGroup(),t=this.currentHole();if(!t)return!1;const s=this.currentBallIdx.get();return e.some((n,r)=>r!==s&&this.svc.strokesFor(n.id,t.playHoleId)===null)};metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),s={};for(const n of e)s[n.key]=t[n.key]===!0;return s}setMeta(e,t){const s=this.pendingMeta.get();this.pendingMeta.set({...s,[e]:t});const n=this.ballsInGroup()[this.currentBallIdx.get()],r=this.currentHole();if(!n||!r)return;const l=this.svc.strokesFor(n.id,r.playHoleId);l!==null&&this.svc.setScore(n.id,r.playHoleId,l,this.metaSnapshot())}metaChip(e,t){return this.wireEl(mn,{glabel:{textContent:e.label},miss:{className:()=>this.pendingMeta.get()[e.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(e.key,!1)},hit:{className:()=>this.pendingMeta.get()[e.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(e.key,!0)}},t)}advance(){const e=this.ballsInGroup(),t=this.currentHole();if(!t)return;const s=u=>this.svc.strokesFor(e[u].id,t.playHoleId)!==null,n=this.currentBallIdx.get();for(let u=n+1;u<e.length;u++)if(!s(u))return this.currentBallIdx.set(u);for(let u=0;u<n;u++)if(!s(u))return this.currentBallIdx.set(u);const r=this.playedOrder();if(this.holeIndex()>=r.length-1){this.flash("Round complete"),this.modalOpen.set(!1);return}this.flash(`Hole ${this.occLabel(t.playHoleId)} done`);const d=t.playHoleId;this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===d&&(this.holeIdx.set(se(this.holeIndex()+1,this.playedOrder().length)),this.currentBallIdx.set(0),this.noteHoleEntered())},700)}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*X),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(se(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",n=>{n.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",n=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:n.pointerId,startX:n.clientX,startY:n.clientY,lastX:n.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(n.pointerId))}),e.addEventListener("pointermove",n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const l=n.clientX-r.startX,d=n.clientY-r.startY;if(!r.horiz){if(Math.abs(d)>Math.abs(l)&&Math.abs(d)>8||Math.abs(l)<=8)return;r.horiz=!0}const u=Date.now(),c=Math.max(1,u-r.lastTime);r.velocity=(n.clientX-r.lastX)/c,r.lastX=n.clientX,r.lastTime=u,this.dragOffset.set(l)});const s=n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const l=n.clientX-r.startX,d=r.horiz;if(this.ptr=null,e.releasePointerCapture?.(n.pointerId),!d){this.dragOffset.set(0);return}this.snap(tn({dragDistance:l,velocity:r.velocity,itemWidth:X}))};e.addEventListener("pointerup",s),e.addEventListener("pointercancel",n=>{!this.ptr||this.ptr.id!==n.pointerId||(this.ptr=null,e.releasePointerCapture?.(n.pointerId),this.snap(0))})}}const Et=()=>null;function S(i){return String(i).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function gn(i,e){const t=[...i].sort((r,l)=>r.canonicalOrdinal-l.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(r=>r.playHoleId))}];const s=[...e].sort((r,l)=>r.fromCanonicalOrdinal-l.fromCanonicalOrdinal),n=[];for(const r of s){const l=t.filter(d=>d.canonicalOrdinal>=r.fromCanonicalOrdinal&&d.canonicalOrdinal<=r.toCanonicalOrdinal);l.length!==0&&n.push({label:r.label,holes:l,playHoleIds:new Set(l.map(d=>d.playHoleId))})}return n}function bn(i){return i.kind==="si"?"lb-c-si":i.kind==="given"?"lb-c-given":i.kind==="status"?"lb-c-status":i.kind==="category"?"lb-c-cat":""}function _n(i){const e=[i.kind==="category"?"lb-r-cat":`lb-r-${i.kind}`];return(i.kind==="si"||i.kind==="given")&&e.push("lb-r-dim"),i.team&&e.push(`lb-team-${i.team}`),e.join(" ")}function yn(i){return i&&i.marker?i.marker.template:null}function vn(i){const e=i?.marker?.tone;return e==="success"||e==="warning"||e==="danger"?` lb-mark-tone--${e}`:""}function wn(i,e){const t=i.cells.filter(s=>e.has(s.playHoleId));if(i.aggregate==="sum"){const s=t.map(n=>n.value).filter(n=>n!==null);return s.length===0?"—":String(s.reduce((n,r)=>n+r,0))}if(i.aggregate==="last"){for(let s=t.length-1;s>=0;s--){const n=t[s].value;if(n!==null)return Number.isInteger(n)?String(n):n.toFixed(1)}return"—"}return"—"}function xn(i){return i.filter(e=>!(e.startsWith("slot #")||/^CH -?\d/.test(e)||/^PH -?\d/.test(e)))}function Le(i,e,t,s){const n=gn(i.holes,e),r=k=>{const D=`<tr><th class="lb-rowlabel">Hole</th>${k.holes.map(E=>`<th>${S(E.occurrenceLabel)}</th>`).join("")}<th class="lb-sum">${S(k.label)}</th></tr>`,F=i.rows.map(E=>{const A=new Map(E.cells.map(Q=>[Q.playHoleId,Q])),ne=Q=>E.emphasis?`<strong>${Q}</strong>`:Q,K=k.holes.map(Q=>{const B=A.get(Q.playHoleId),At=B?.title?` title="${S(B.title)}"`:"",xe=ne(S(B?.display??"")),Be=yn(B),Ft=vn(B),$e=B?.marker?.label,Bt=$e?` title="${S($e)}" aria-label="${S($e)}"`:"";let he;if(Be){const Gt=B?.team?` lb-mark-fill--${B.team}`:"";he=`<span class="lb-mark lb-mark--${Be}${Ft}${Gt}"${Bt}>${xe}</span>`}else B?.team?he=`<span class="lb-pill lb-pill--${B.team}">${xe}</span>`:he=xe;return`<td class="${bn(E)}"${At}>${he}</td>`}).join(""),W=`<td class="lb-sum">${ne(wn(E,k.playHoleIds))}</td>`,Mt=E.subjectBallId?S(t(E.subjectBallId))+(E.label?" "+S(E.label):""):S(E.label);return`<tr class="${_n(E)}"><th class="lb-rowlabel">${Mt}</th>${K}${W}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${D}</thead><tbody>${F}</tbody></table></div>`},l=n.map(k=>r(k)).join(""),d=i.title.groups.map(k=>k.map(D=>S(t(D))).join(" & ")).filter(Boolean).join(i.title.joiner),u=s.mode==="verification"?i.subtitleFacts:xn(i.subtitleFacts),c=u.length?`<div class="lb-card__sub">${u.map(S).join(" · ")}</div>`:"",m=s.mode==="verification"&&i.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${i.footnotes.map(k=>`<span class="lb-card__note">${S(k)}</span>`).join("")}</div>`:"",p=s.mode==="verification"&&i.caption?`<p class="lb-card__caption">${S(i.caption)}</p>`:"",g=i.totals.length?`<ul class="lb-card__totals">${i.totals.map(k=>`<li>${S(k.label)} = <strong>${k.value??"—"}</strong></li>`).join("")}</ul>`:"",x=d?`<header class="lb-card__head"><h4>${d}</h4>${c}</header>`:c;return`<article class="${s.cardModifier?`lb-card ${s.cardModifier}`:"lb-card"}">
  ${x}
  ${l}
  ${m}${p}${g}
</article>`}function $n(i,e,t,s){return Le(i,e,t,s)}function kn(i,e,t,s){return Le(i,e,t,{...s,cardModifier:"lb-card--compact-match"})}function Sn(i,e,t,s){return Le(i,e,t,{...s,cardModifier:"lb-card--category-matrix"})}function In(i,e){const t=new Set(i.map(e));return t.size!==1?null:[...t][0]??null}function Cn(i){return i===0?"E":i>0?`+${i}`:`−${Math.abs(i)}`}function Tn(i,e){return e==="high"?-i:i}function En(i,e){if(i===void 0)return'<td class="lb-rank__pace"></td>';const t=Tn(i,e);return`<td class="lb-rank__pace lb-rank__pace--${t===0?"even":t>0?"over":"under"}">${S(Cn(t))}</td>`}function Nn(i,e,t=Et){const s=i.entries.some(d=>d.paceDelta!==void 0),n=i.entries.map(d=>{const u=In(d.ballIds,t),c=u?` <span class="lb-rank__group">${S(u)}</span>`:"";return`<tr class="${d.position===1?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${d.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${S(d.ballIds.map(e).join(" & "))}</span>${c}</span></td>
  <td class="lb-rank__total">${d.total??"—"}</td>${s?`
  ${En(d.paceDelta,i.direction)}`:""}
  <td class="lb-rank__thru">${d.holesPlayed}</td>
</tr>`}).join(""),r=s?`
      <col class="lb-rank__col-pace">`:"",l=s?'<th class="lb-rank__pace">Pace</th>':"";return`<div class="lb-section">
  <h4 class="lb-section__title">${S(i.metricLabel)}</h4>
  <table class="lb-rank">
    <colgroup>
      <col class="lb-rank__col-pos">
      <col class="lb-rank__col-who">
      <col class="lb-rank__col-total">${r}
      <col class="lb-rank__col-thru">
    </colgroup>
    <thead><tr><th class="lb-rank__pos">#</th><th class="lb-rank__who">Player</th><th class="lb-rank__total">Total</th>${l}<th class="lb-rank__thru">Thru</th></tr></thead>
    <tbody>${n}</tbody>
  </table>
</div>`}function Pn(i,e){const t=i.matches.map(s=>{const n=S(s.sideA.ballIds.map(e).join(" & ")),r=S(s.sideB.ballIds.map(e).join(" & ")),l=s.magnitude===0?"AS":`${s.magnitude} UP`,d=s.finished?"Final":`thru ${s.thru}`,u=s.leader==="a"?" lb-mp__team--lead":"",c=s.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${u}">${n}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${S(l)}</span><span class="lb-mp__status">${S(d)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${c}">${r}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${S(i.title)}</h4>${t}
</div>`}const zn={ranked:Nn,match_summary:(i,e)=>Pn(i,e)},Rn={"default-score-grid":$n,"compact-match-grid":kn,"category-matrix-grid":Sn};function jn(i){return i.componentId??"default-score-grid"}function On(i){return`<div class="lb-diag">Unrenderable result section <code>${S(i)}</code> — no generic view yet. Results are not hidden.</div>`}function Ln(i){return`<div class="lb-diag">Unsupported score-grid component <code>${S(i)}</code> — no generic view yet. Results are not hidden.</div>`}function Dn(i,e,t){const s=zn[i.kind];return s?s(i,e,t):On(i.kind)}function Hn(i,e,t,s){const n=jn(i),r=Rn[n];return r?r(i,e,t,s):Ln(n)}function Mn(i,e,t=Et){return i.leaderboard.length===0&&i.cards.length===0?`<div class="lb-empty">No scores entered yet for ${S(i.formatLabel)}.</div>`:i.leaderboard.map(n=>Dn(n,e,t)).join("")||`<div class="lb-empty">No leaderboard metric for ${S(i.formatLabel)}.</div>`}function An(i,e,t,s={}){if(i.cards.length===0)return"";const n=s.mode??"product";return i.cards.map(r=>Hn(r,e,t,{mode:n})).join(`
`)}const Fn=_(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class Bn extends I{static styles=`
        .lb {
            padding: ${a("lg")} ${a("lg")} ${a("2xl")};

            & .lb__status {
                color: ${o("text-muted")};
                padding: ${a("xl")} 0;
                text-align: center;
                &.hidden { display: none; }
            }

            & .lb-empty {
                color: ${o("text-muted")};
                padding: ${a("xl")} 0;
                text-align: center;
            }
            & .lb-diag {
                ${T()}
                padding: ${a("md")} ${a("lg")};
                color: ${o("error")};
                font-size: 0.85rem;
                margin-bottom: ${a("md")};
                & code { font-family: ui-monospace, monospace; }
            }

            /* Ranked metric + match-summary sections. */
            & .lb-section { margin-bottom: ${a("xl")}; }
            & .lb-section__title {
                margin: 0 0 ${a("sm")};
                font-family: ${o("font-display")};
                font-weight: 600;
                font-size: 1rem;
                color: ${o("text")};
            }
            & .lb-rank {
                width: 100%;
                border-collapse: collapse;
                font-variant-numeric: tabular-nums;
                table-layout: fixed;
            }
            & .lb-rank__col-pos { width: 2.25rem; }
            & .lb-rank__col-total { width: 3.25rem; }
            & .lb-rank__col-pace { width: 3.25rem; }
            & .lb-rank__col-thru { width: 3rem; }
            & .lb-rank th,
            & .lb-rank td {
                vertical-align: middle;
            }
            & .lb-rank thead th {
                height: 1.65rem;
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: ${o("text-muted")};
                font-weight: 700;
                line-height: 1;
                padding: 0 ${a("sm")};
                border-bottom: 1px solid ${o("border")};
            }
            & .lb-rank tbody td {
                height: 2.25rem;
                padding: 0 ${a("sm")};
                border-bottom: 1px solid ${o("border")};
                font-size: 0.95rem;
                line-height: 1.1;
            }
            & .lb-rank__pos { text-align: center; font-weight: 700; color: ${o("text-muted")}; }
            & .lb-rank__who {
                text-align: left;
                font-weight: 600;
                font-family: ${o("font-display")};
            }
            /* Flex INSIDE the cell, not on the <td> itself: a display:flex td
               drops out of table layout and stops centring vertically, which
               left names riding above the numbers on their own row. The inner
               box keeps the ellipsis behaviour — a long NAME truncates while
               the group tag stays whole ("Gr…" bug). */
            & .lb-rank__whobox {
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
            & .lb-rank__total { text-align: right; font-weight: 800; font-size: 1.05rem; }
            /* Pace delta lives in its own column: adjacent to the total but
               visually separate (lighter weight, muted) so "33" and "−3" can
               never read as one number. */
            & .lb-rank__pace {
                text-align: right;
                font-weight: 700;
                font-size: 0.9rem;
                color: ${o("text-muted")};
                padding-left: 0;
            }
            & .lb-rank thead th.lb-rank__pace { font-weight: 700; }
            /* Worse than pace (+N) reads like over par; better (−N) like under
               par — same two colours the scorecard already uses. */
            & .lb-rank__pace--over { color: ${o("over-par")}; }
            & .lb-rank__pace--under { color: ${o("under-par")}; }
            /* Phase 3.5: group tag next to a player's name — only rendered when
               the round has 2+ playing groups (single-group rounds get nothing,
               same look as before this phase). */
            & .lb-rank__group {
                font-size: 0.7rem;
                font-weight: 600;
                color: ${o("text-muted")};
                margin-left: ${a("xs")};
                flex: none;
                white-space: nowrap;
            }
            & .lb-rank__thru { text-align: right; color: ${o("text-muted")}; }
            & .lb-rank__lead td { background: ${o("accent-soft")}; }
            & .lb-rank__lead .lb-rank__pos { color: ${o("accent")}; }

            /* Structured match panel: two team blocks + a centre standing. */
            & .lb-mp {
                display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch;
                border: 1px solid ${o("border")}; border-radius: 10px; overflow: hidden;
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
            & .lb-mp__status { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.04em; color: ${o("text-muted")}; }

            /* Format-aware scorecard cards. */
            & .lb-cards__head {
                margin: ${a("xl")} 0 ${a("md")};
                font-family: ${o("font-display")};
                font-weight: 600;
                font-size: 1.1rem;
                color: ${o("text")};
            }
            & .lb-card {
                ${T()}
                padding: ${a("md")};
                margin-bottom: ${a("lg")};
            }
            & .lb-card--compact-match {
                border-color: color-mix(in srgb, ${o("accent")} 28%, ${o("border")});
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
                font-family: ${o("font-display")};
                font-weight: 600;
                font-size: 1rem;
                color: ${o("text")};
            }
            & .lb-card__sub { font-size: 0.75rem; color: ${o("text-muted")}; margin-top: 2px; }
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
                border-bottom: 1px solid ${o("border")};
                overflow: hidden;
                text-overflow: ellipsis;
            }
            /* Data cells hold a digit, a shape, or "AS" — all centred and at most
               a couple of px wider than the tightest mobile column. Let them
               spill symmetrically instead of clipping shapes / ellipsizing "AS".
               (Row labels keep the th ellipsis above.) */
            & .lb-grid td { overflow: visible; text-overflow: clip; }
            & .lb-grid thead th {
                font-size: 0.7rem;
                color: ${o("text-muted")};
                font-weight: 700;
            }
            & .lb-grid .lb-rowlabel {
                text-align: left;
                width: 6em;
                position: sticky;
                left: 0;
                background: ${o("surface")};
                font-weight: 600;
                color: ${o("text")};
            }
            & .lb-grid .lb-sum { width: 2.4em; font-weight: 700; background: ${o("surface-sunken")}; }
            & .lb-grid .lb-r-dim td, & .lb-grid .lb-r-dim th { color: ${o("text-muted")}; }
            & .lb-grid .lb-c-si { color: ${o("text-muted")}; font-size: 0.7rem; }
            & .lb-grid .lb-r-cat th { font-weight: 400; color: ${o("text-muted")}; }
            & .lb-grid .lb-c-cat { text-align: center; color: ${o("accent")}; }
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
            /* Deciding ball whose score is decorated: the marker's own shape gets
               the team fill — white number and white outline on the team colour.
               Declared AFTER the tone rules so the fill's white wins. */
            & .lb-mark-fill--a { background: #c2452f; color: #fff; }
            & .lb-mark-fill--b { background: #2c6cae; color: #fff; }
            & .lb-card__caption { margin: ${a("sm")} 0 0; font-size: 0.72rem; font-style: italic; color: ${o("text-muted")}; }
            & .lb-card__notes { margin: ${a("sm")} 0 0; font-size: 0.72rem; color: ${o("text-muted")}; }
            & .lb-card__notes-label {
                display: block; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.04em; font-size: 0.68rem; margin-bottom: 2px;
            }
            & .lb-card__note { display: block; }
            & .lb-card__totals {
                list-style: none; margin: ${a("sm")} 0 0; padding: 0;
                display: flex; flex-wrap: wrap; gap: ${a("md")};
                font-size: 0.85rem; color: ${o("text")};
            }
        }
    `;svc=this.inject(ee);slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots(),t=this.svc.selectedSlotDefId();return e.find(s=>s.slotDefId===t)??e[0]??null};render(){return this.wire(Fn,{status:{className:()=>{const t=this.svc.resultLoading.get(),s=this.svc.result.get()===null;return t||s?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody()}})}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const s=u=>{const c=this.svc.nameOf(u);return this.svc.isPending(u)?`${c} (open seat)`:c},r=Mn(t,s,u=>this.svc.groupLabelOf(u)),l=An(t,e.routeSections,s),d=l?`<h3 class="lb-cards__head">Scorecard</h3>${l}`:"";return r+d}}function Gn(i,e){if(!e)return[];const t=[],s=new Set;for(const n of i)for(const r of n.players){if(r.playerId===e)return[];r.guestPlayerId===null||s.has(r.guestPlayerId)||(s.add(r.guestPlayerId),t.push({guestPlayerId:r.guestPlayerId,displayName:r.displayName}))}return t}const qn=_(`
    <div bind="root" class="claim-card hidden">
        <span class="claim-card__label">Played here as a guest?</span>
        <p class="claim-card__hint">Claim your scores — the round lands on your profile's card.</p>
        <div bind="rows" class="claim-card__rows"></div>
        <p bind="err" class="claim-card__err"></p>
    </div>
`),Kn=_(`
    <div class="claim-card__row">
        <span bind="name" class="claim-card__name"></span>
        <button bind="claim" class="claim-card__btn" type="button">This is me</button>
    </div>
`);class Vn extends I{static styles=`
        .claim-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${T()}
            background: ${o("surface-sunken")};

            &.hidden { display: none; }

            & .claim-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${o("text-muted")};
            }
            & .claim-card__hint {
                margin: ${a("sm")} 0 0;
                font-size: 0.8rem;
                color: ${o("text-muted")};
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
                background: ${o("primary")};
                color: ${o("primary-text")};
                border: none;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .claim-card__err {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(ee);auth=this.inject(R);router=this.inject(N);tokenQ=this.router.query("token");claiming=new h(!1);error=new h("");claimable(){return Gn(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async claim(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.claiming.set(!0);try{await b.friendlyRounds.claimGuest({token:t,guestPlayerId:e}),await this.svc.loadByToken(t)}catch(s){this.error.set(s instanceof M&&s.status===409?"Already claimed — or you already play in this round under your account.":s instanceof M&&s.status===404?"That guest is no longer claimable on this round.":"Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}render(){const e=this.wire(qn,{root:{className:()=>this.claimable().length>0?"claim-card":"claim-card hidden"},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.claimable(),(t,s,n)=>this.wireEl(Kn,{name:()=>t.displayName,claim:{disabled:()=>this.claiming.get(),onclick:()=>{this.claim(t.guestPlayerId)}}},n),t=>t.guestPlayerId),e}}function J(i){return typeof i=="object"&&i!==null&&typeof i.get=="function"}const j=i=>`var(--${i})`,Fe=class Fe extends I{constructor(){super(...arguments),this.open=new h(!1),this.highlightIndex=new h(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const s=document.createElement("span");s.className="ui-select__trigger-label",this.triggerEl.appendChild(s);const n=document.createElement("span");n.className="ui-select__chevron",n.textContent="▾",n.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(n),this.triggerEl.addEventListener("click",l=>{l.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",l=>{this.handleTriggerKeydown(l)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.setAttribute("role","listbox"),this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",l=>{this.handleDropdownKeydown(l)}),e.appendChild(this.dropdownEl);const r=l=>{this.optionEls=[],this.dropdownEl.textContent="";for(let d=0;d<l.length;d++){const u=l[d],c=document.createElement("button");if(c.className="ui-select__option",c.setAttribute("type","button"),c.id=`ui-select-opt-${d}`,u.disabled){c.classList.add("ui-select__option--header"),c.disabled=!0,c.setAttribute("role","presentation"),c.setAttribute("aria-disabled","true");const g=document.createElement("span");g.className="ui-select__option-label",g.textContent=u.label,c.appendChild(g),this.dropdownEl.appendChild(c),this.optionEls.push(c);continue}if(c.setAttribute("role","option"),u.icon){const g=document.createElement("span");g.className="ui-select__option-icon",g.textContent=u.icon,c.appendChild(g)}const m=document.createElement("span");m.className="ui-select__option-label",m.textContent=u.label,c.appendChild(m);const p=document.createElement("span");p.className="ui-select__check",p.setAttribute("aria-hidden","true"),c.appendChild(p),c.addEventListener("click",g=>{g.stopPropagation(),this.selectOption(u.value)}),c.addEventListener("mouseenter",()=>{this.highlightIndex.set(d)}),this.dropdownEl.appendChild(c),this.optionEls.push(c)}};return J(this.props.options)?this.track($(()=>{const l=J(this.props.options)?this.props.options.get():this.props.options;r(l)})):r(this.props.options),this.track($(()=>{const l=this.props.value.get(),d=J(this.props.options)?this.props.options.get():this.props.options,u=d.find(c=>c.value===l);u?(s.textContent=u.icon?`${u.icon} ${u.label}`:u.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder")):(s.textContent=this.props.placeholder??"",this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!this.props.placeholder));for(let c=0;c<d.length;c++){const m=this.optionEls[c];if(!m)continue;const p=d[c].value===l;m.setAttribute("aria-selected",String(p)),m.classList.toggle("ui-select__option--selected",p);const g=m.querySelector(".ui-select__check");g&&(g.textContent=p?"✓":"")}})),this.track($(()=>{const l=this.open.get();if(this.dropdownEl.classList.toggle("open",l),n.classList.toggle("ui-select__chevron--open",l),this.triggerEl.setAttribute("aria-expanded",String(l)),l?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),l){const d=J(this.props.options)?this.props.options.get():this.props.options,u=this.props.value.get(),c=d.findIndex(p=>p.value===u),m=d.findIndex(p=>!p.disabled);this.highlightIndex.set(c>=0?c:m)}})),this.track($(()=>{const l=this.highlightIndex.get();for(let d=0;d<this.optionEls.length;d++)this.optionEls[d].classList.toggle("ui-select__option--highlighted",d===l);l>=0&&this.optionEls[l]&&(this.triggerEl.setAttribute("aria-activedescendant",`ui-select-opt-${l}`),this.optionEls[l].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(J(this.props.disabled)?this.track($(()=>{const l=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",l),this.triggerEl.disabled=l})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}selectOption(e){de(()=>{this.props.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.toggle();break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":{e.preventDefault();const t=this.highlightIndex.get(),s=J(this.props.options)?this.props.options.get():this.props.options;t>=0&&t<s.length&&!s[t].disabled&&this.selectOption(s[t].value);break}case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=J(this.props.options)?this.props.options.get():this.props.options;if(t.length===0||!t.some(n=>!n.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};Fe.styles=`
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
            border: 1px solid ${j("border")};
            border-radius: ${j("radius")};
            background: ${j("input-bg")};
            color: ${j("text")};
            font-family: inherit;
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
        }
        .ui-select__trigger:focus-visible {
            outline: 2px solid ${j("primary")};
            outline-offset: 1px;
        }
        .ui-select__trigger--placeholder {
            color: ${j("text-muted")};
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
            color: ${j("text-muted")};
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
            background: ${j("surface")};
            border: 1px solid ${j("border")};
            border-radius: ${j("radius")};
            box-shadow: ${j("shadow-elevated")};
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
            color: ${j("text")};
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
            background: ${j("hover-bg")};
        }
        .ui-select__option--selected {
            color: ${j("primary")};
            font-weight: 600;
        }
        .ui-select__option--header {
            cursor: default;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${j("text-muted")};
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
            color: ${j("primary")};
        }
    `;let q=Fe;function Un(i){if(!i)return{visible:!1,selfAllowed:!1,guestAllowed:!1,blockedMessage:null};const e=i.seats.length>0,t=i.claimedSeats.some(r=>r.viewerMayRelease),s=i.viewer.claimSeat.allowed,n=i.viewer.claimSeatAsGuest.allowed;return{visible:e||t,selfAllowed:e&&s,guestAllowed:e&&n,blockedMessage:e&&!s&&!n?i.viewer.claimSeat.message??i.viewer.claimSeatAsGuest.message??"Claiming seats is not available on this round.":null}}function Wn(i,e){const t=[];if(i.groupId!==null&&e.length>0){const s=e.findIndex(n=>n.id===i.groupId);if(s>=0){t.push(`Group ${s+1}`);const n=e[s].startTime;n.includes(":")&&t.push(n)}}return i.category!==null&&t.push(i.category),t.join(" · ")}function Qn(i){return(i?.claimedSeats??[]).filter(e=>e.viewerMayRelease)}const Yn=_(`
    <div bind="root" class="seat-card hidden">
        <span class="seat-card__label">Who's playing?</span>
        <p bind="hint" class="seat-card__hint">This round has open seats — claim one to score.</p>
        <p bind="blocked" class="seat-card__blocked hidden"></p>
        <div bind="rows" class="seat-card__rows"></div>
        <div bind="releaseRows" class="seat-card__rows"></div>
        <p bind="err" class="seat-card__err"></p>
    </div>
`),Xn=_(`
    <div class="seat-card__seat">
        <div class="seat-card__head">
            <div class="seat-card__who">
                <span bind="label" class="seat-card__name"></span>
                <span bind="context" class="seat-card__context"></span>
            </div>
            <button bind="toggle" class="seat-card__btn" type="button">Claim</button>
        </div>
        <div bind="form" class="seat-card__form hidden">
            <div bind="teeHost" class="seat-card__tee"></div>
            <button bind="selfBtn" class="seat-card__btn seat-card__btn--wide hidden" type="button">I'm playing this seat</button>
            <div bind="guestBox" class="seat-card__guest hidden">
                <input bind="guestName" class="seat-card__input" placeholder="Guest name" autocomplete="off">
                <div class="seat-card__guest-row">
                    <input bind="guestHcp" class="seat-card__input seat-card__input--hcp" placeholder="HCP" inputmode="decimal" autocomplete="off">
                    <div bind="genderHost" class="seat-card__gender"></div>
                </div>
                <button bind="guestBtn" class="seat-card__btn seat-card__btn--wide" type="button">Add guest to this seat</button>
            </div>
            <p bind="diag" class="seat-card__diag hidden"></p>
        </div>
    </div>
`),Jn=_(`
    <div class="seat-card__release">
        <span class="seat-card__who">
            <span bind="name" class="seat-card__name"></span>
            <span bind="context" class="seat-card__context"></span>
        </span>
        <button bind="release" class="seat-card__btn seat-card__btn--ghost" type="button">Not me — release</button>
    </div>
`);class Zn extends I{static styles=`
        .seat-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${T()}
            background: ${o("surface-sunken")};

            &.hidden { display: none; }

            & .seat-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${o("text-muted")};
            }
            & .seat-card__hint {
                margin: ${a("sm")} 0 0;
                font-size: 0.8rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__blocked {
                margin: ${a("md")} 0 0;
                font-size: 0.85rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__rows {
                display: flex;
                flex-direction: column;
                gap: ${a("sm")};
                margin-top: ${a("md")};
                &:empty { display: none; }
            }
            & .seat-card__seat {
                padding: ${a("sm")} 0;
                border-bottom: 1px solid ${o("border")};
                &:last-child { border-bottom: 0; padding-bottom: 0; }
            }
            & .seat-card__head, & .seat-card__release {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${a("md")};
            }
            & .seat-card__who {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            & .seat-card__name { font-weight: 600; font-size: 0.95rem; }
            & .seat-card__context {
                font-size: 0.8rem;
                color: ${o("text-muted")};
                &:empty { display: none; }
            }
            & .seat-card__btn {
                ${w()}
                padding: ${a("sm")} ${a("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${o("primary")};
                color: ${o("primary-text")};
                border: none;
                flex-shrink: 0;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .seat-card__btn--wide { width: 100%; margin-top: ${a("sm")}; }
            & .seat-card__btn--ghost {
                background: transparent;
                color: ${o("accent")};
                border: 1px solid ${o("border")};
                font-weight: 600;
            }
            & .seat-card__form {
                margin-top: ${a("md")};
                &.hidden { display: none; }
            }
            & .seat-card__guest {
                margin-top: ${a("sm")};
                display: flex;
                flex-direction: column;
                gap: ${a("sm")};
                &.hidden { display: none; }
            }
            & .seat-card__guest-row {
                display: flex;
                gap: ${a("sm")};
                align-items: center;
            }
            & .seat-card__input {
                width: 100%;
                padding: ${a("sm")};
                font: inherit;
                font-size: 0.9rem;
                border: 1px solid ${o("border")};
                border-radius: 8px;
                background: ${o("surface")};
                color: ${o("text")};
            }
            & .seat-card__input--hcp { width: 6rem; flex-shrink: 0; }
            & .seat-card__gender { flex: 1; }
            & .seat-card__tee { margin-bottom: ${a("sm")}; }
            & .seat-card__diag {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__err {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(ee);auth=this.inject(R);router=this.inject(N);tokenQ=this.router.query("token");claiming=new h(!1);error=new h("");diagnostics=new h([]);expandedSeat=new h(null);teeId=new h("");tees=new h([]);loadedForCourseId=null;guestName=new h("");guestHcp=new h("");guestGender=new h("M");state(){return Un(this.svc.startList.get())}ensureTeesLoaded(){if(!this.state().visible)return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,b.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}toggleSeat(e){this.diagnostics.set([]),this.error.set(""),this.expandedSeat.set(this.expandedSeat.get()===e?null:e)}guestHcpValue(){const e=Number.parseFloat(this.guestHcp.get().replace(",","."));return Number.isFinite(e)?e:null}async claim(e,t,s){const n=this.tokenQ.get(),r=this.teeId.get();if(!(!n||!r||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const l=await b.friendlyRounds.claimSeat({token:n,seatId:e,identity:t,teeId:r,clientEventId:s});l.ok?(this.expandedSeat.set(null),this.guestName.set(""),this.guestHcp.set(""),await this.svc.loadByToken(n)):this.diagnostics.set(l.diagnostics)}catch{this.error.set("Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}async claimSelf(e){const t=this.auth.currentUser.get()?.id??"anon";await this.claim(e,{kind:"self"},`claim-seat:${e}:${t}:${this.teeId.get()}`)}async claimGuest(e){const t=this.guestName.get().trim(),s=this.guestHcpValue();!t||s===null||await this.claim(e,{kind:"guest",name:t,handicapIndex:s,gender:this.guestGender.get()==="F"?"F":"M"},crypto.randomUUID())}async release(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const s=await b.friendlyRounds.releaseSeat({token:t,seatId:e,clientEventId:crypto.randomUUID()});s.ok?await this.svc.loadByToken(t):this.diagnostics.set(s.diagnostics)}catch{this.error.set("Could not release right now. Try again.")}finally{this.claiming.set(!1)}}}seatRow(e,t){const s=()=>this.expandedSeat.get()===e.seatId&&this.state().blockedMessage===null,n=this.wireEl(Xn,{label:()=>e.label,context:()=>Wn(e,this.svc.groups()),toggle:{textContent:()=>this.expandedSeat.get()===e.seatId?"Close":"Claim",disabled:()=>this.state().blockedMessage!==null,onclick:()=>this.toggleSeat(e.seatId)},form:{className:()=>s()?"seat-card__form":"seat-card__form hidden"},selfBtn:{className:()=>this.state().selfAllowed?"seat-card__btn seat-card__btn--wide":"seat-card__btn seat-card__btn--wide hidden",disabled:()=>this.claiming.get()||!this.teeId.get(),onclick:()=>{this.claimSelf(e.seatId)}},guestBox:{className:()=>this.state().guestAllowed?"seat-card__guest":"seat-card__guest hidden"},guestName:{oninput:d=>this.guestName.set(d.target.value)},guestHcp:{oninput:d=>this.guestHcp.set(d.target.value)},guestBtn:{disabled:()=>this.claiming.get()||!this.teeId.get()||this.guestName.get().trim()===""||this.guestHcpValue()===null,onclick:()=>{this.claimGuest(e.seatId)}},diag:{className:()=>this.diagnostics.get().length>0?"seat-card__diag":"seat-card__diag hidden",textContent:()=>this.diagnostics.get().map(d=>d.message).join(" · ")}},t),r=new q({value:this.teeId,options:{get:()=>this.tees.get().map(d=>({value:d.id,label:d.name}))},placeholder:"Tee"});r.mount(this.ref(n,"teeHost")),t(()=>r.destroy());const l=new q({value:this.guestGender,options:{get:()=>[{value:"M",label:"Men’s tee rating"},{value:"F",label:"Women’s tee rating"}]},placeholder:"Rating"});return l.mount(this.ref(n,"genderHost")),t(()=>l.destroy()),n}render(){this.track($(()=>this.ensureTeesLoaded()));const e=this.wire(Yn,{root:{className:()=>this.state().visible?"seat-card":"seat-card hidden"},hint:{className:()=>(this.svc.startList.get()?.seats.length??0)>0&&this.state().blockedMessage===null?"seat-card__hint":"seat-card__hint hidden"},blocked:{className:()=>this.state().blockedMessage!==null?"seat-card__blocked":"seat-card__blocked hidden",textContent:()=>this.state().blockedMessage??""},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.svc.startList.get()?.seats??[],(t,s,n)=>this.seatRow(t,n),t=>t.seatId),this.$each(this.ref(e,"releaseRows"),()=>Qn(this.svc.startList.get()),(t,s,n)=>this.wireEl(Jn,{name:()=>t.displayName,context:()=>`holds “${t.seatLabel}”`,release:{disabled:()=>this.claiming.get(),onclick:()=>{this.release(t.seatId)}}},n),t=>t.seatId),e}}function ei(i,e,t){if(!e||t!=="not_started")return!1;for(const s of i)for(const n of s.players)if(n.playerId===e)return!1;return!0}function ti(i){if(!i)return{visible:!1,blockedMessage:null};const e=i.viewer.join;return e.allowed?{visible:!0,blockedMessage:null}:e.code==="window_not_open"||e.code==="window_closed"?{visible:!0,blockedMessage:e.message??"Sign-up is closed right now."}:{visible:!1,blockedMessage:null}}const ot="new";function si(i,e=!0){const t=i.map((n,r)=>{const l=n.ballIds.length,d=[`Group ${r+1}`];return n.startTime.includes(":")&&d.push(n.startTime),{value:n.id,label:`${d.join(" · ")} — ${l} of ${n.capacity}`,disabled:l>=n.capacity}}),s=t.find(n=>!n.disabled);return e&&t.push({value:ot,label:"Start a new group",disabled:!1}),{options:t,defaultValue:s?.value??(e?ot:"")}}const ni=_(`
    <div bind="root" class="join-card hidden">
        <span class="join-card__label">Playing this round?</span>
        <p class="join-card__hint">Add yourself with your own tee — this creates your own scorecard.</p>
        <p bind="blocked" class="join-card__blocked hidden"></p>
        <div bind="groupRow" class="join-card__group hidden">
            <label class="join-card__group-label">Group</label>
            <div bind="groupHost" class="join-card__group-select"></div>
        </div>
        <div bind="row" class="join-card__row">
            <div bind="teeHost" class="join-card__tee"></div>
            <button bind="join" class="join-card__btn" type="button">Add me</button>
        </div>
        <p bind="diag" class="join-card__diag">
            <span bind="diagText"></span>
            <button bind="profileLink" class="join-card__profile-link hidden" type="button">Update your profile.</button>
        </p>
        <p bind="err" class="join-card__err"></p>
    </div>
`);class ii extends I{static styles=`
        .join-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${T()}
            background: ${o("surface-sunken")};

            &.hidden { display: none; }

            & .join-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${o("text-muted")};
            }
            & .join-card__hint {
                margin: ${a("sm")} 0 0;
                font-size: 0.8rem;
                color: ${o("text-muted")};
            }
            & .join-card__blocked {
                margin: ${a("md")} 0 0;
                font-size: 0.85rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }
            & .join-card__group {
                margin-top: ${a("md")};
                &.hidden { display: none; }
            }
            & .join-card__group-label {
                display: block;
                font-size: 0.8rem;
                color: ${o("text-muted")};
                margin-bottom: ${a("xs")};
            }
            & .join-card__row {
                display: flex;
                align-items: center;
                gap: ${a("md")};
                margin-top: ${a("md")};
                &.hidden { display: none; }
            }
            & .join-card__tee { flex: 1; }
            & .join-card__btn {
                ${w()}
                padding: ${a("sm")} ${a("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${o("primary")};
                color: ${o("primary-text")};
                border: none;
                flex-shrink: 0;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .join-card__diag {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }
            & .join-card__profile-link {
                border: 0;
                padding: 0;
                background: transparent;
                color: ${o("accent")};
                font: inherit;
                font-weight: 600;
                cursor: pointer;
                &.hidden { display: none; }
            }
            & .join-card__err {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(ee);auth=this.inject(R);router=this.inject(N);tokenQ=this.router.query("token");joining=new h(!1);error=new h("");diagnostics=new h([]);teeId=new h("");tees=new h([]);loadedForCourseId=null;groupChoice=new h("");policyState(){return ti(this.svc.startList.get())}eligible(){return this.policyState().visible&&ei(this.svc.balls.get(),this.auth.currentUser.get()?.id??null,this.svc.round.get()?.status??null)}ensureTeesLoaded(){if(!this.eligible())return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,b.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}needsProfileUpdate(){return this.diagnostics.get().some(e=>e.code==="missing_gender"||e.code==="missing_handicap_index")}async join(){const e=this.tokenQ.get(),t=this.teeId.get();if(!(!e||!t||this.joining.get())){this.error.set(""),this.diagnostics.set([]),this.joining.set(!0);try{const s=this.groupChoice.get(),n=await b.friendlyRounds.join({token:e,teeId:t,...s?{groupChoice:s}:{}});n.ok?await this.svc.loadByToken(e):this.diagnostics.set(n.diagnostics)}catch(s){this.error.set(s instanceof M&&s.status===409?s.message??"You already play in this round, or it has already started.":"Could not join right now. Try again.")}finally{this.joining.set(!1)}}}render(){this.track($(()=>this.ensureTeesLoaded()));const e=new y(()=>si(this.svc.groups(),this.svc.startList.get()?.viewer.createGroup.allowed??!0));this.track($(()=>{const r=e.get(),l=this.groupChoice.get();(!l||!r.options.some(d=>d.value===l&&!d.disabled))&&this.groupChoice.set(r.defaultValue)}));const t=this.wire(ni,{root:{className:()=>this.eligible()?"join-card":"join-card hidden"},blocked:{className:()=>this.policyState().blockedMessage!==null?"join-card__blocked":"join-card__blocked hidden",textContent:()=>this.policyState().blockedMessage??""},groupRow:{className:()=>this.svc.groups().length>0&&this.policyState().blockedMessage===null?"join-card__group":"join-card__group hidden"},row:{className:()=>this.policyState().blockedMessage===null?"join-card__row":"join-card__row hidden"},join:{disabled:()=>this.joining.get()||!this.teeId.get(),onclick:()=>{this.join()}},diag:{className:()=>this.diagnostics.get().length>0?"join-card__diag":"join-card__diag hidden"},diagText:{textContent:()=>this.diagnostics.get().map(r=>r.message).join(" · ")},profileLink:{className:()=>this.needsProfileUpdate()?"join-card__profile-link":"join-card__profile-link hidden",onclick:()=>this.router.navigate("/profile")},err:{textContent:()=>this.error.get()}}),s=new q({value:this.teeId,options:{get:()=>this.tees.get().map(r=>({value:r.id,label:r.name}))},placeholder:"Tee"});s.mount(this.ref(t,"teeHost")),this.track(()=>s.destroy());const n=new q({value:this.groupChoice,options:{get:()=>e.get().options},placeholder:"Group"});return n.mount(this.ref(t,"groupHost")),this.track(()=>n.destroy()),t}}const ri=_(`
    <div bind="root" class="edit-card hidden">
        <div class="edit-card__text">
            <span class="edit-card__label">Round setup</span>
            <p class="edit-card__hint">Change tees, add a format, adjust groups — scored balls are preserved.</p>
        </div>
        <button bind="edit" class="edit-card__btn" type="button">Edit round</button>
    </div>
`);class oi extends I{static styles=`
        .edit-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${T()}
            background: ${o("surface-sunken")};
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
                color: ${o("text-muted")};
            }
            & .edit-card__hint {
                margin: ${a("xs")} 0 0;
                font-size: 0.8rem;
                color: ${o("text-muted")};
            }
            & .edit-card__btn {
                ${w()}
                flex-shrink: 0;
                padding: ${a("sm")} ${a("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${o("primary")};
                color: ${o("primary-text")};
                border: none;
            }
        }
    `;router=this.inject(N);tokenQ=this.router.query("token");editable=new h(!1);render(){const e=this.tokenQ.get();return e&&b.friendlyRounds.setup({token:e}).then(t=>this.editable.set(t.editable===!0)).catch(()=>this.editable.set(!1)),this.wire(ri,{root:{className:()=>this.editable.get()?"edit-card":"edit-card hidden"},edit:{onclick:()=>{const t=this.tokenQ.get();t&&this.router.navigate("/create",{query:{token:t}})}}})}}function ai(i,e){if(!e)return!1;for(const t of i)for(const s of t.players)if(s.playerId===e)return!0;return!1}const li=_(`
    <div bind="root" class="leave-card hidden">
        <button bind="leaveBtn" class="leave-card__btn" type="button">Remove me from this round</button>
        <p bind="diag" class="leave-card__diag"></p>
        <p bind="err" class="leave-card__err"></p>
        <div bind="confirmHost"></div>
    </div>
`);class di extends I{static styles=`
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
                border: 1px solid ${o("border")};
                border-radius: ${o("radius")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${o("error")};
                cursor: pointer;

                &:hover, &:active { border-color: ${o("error")}; }
                &:focus-visible { outline: 2px solid ${o("error")}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .leave-card__diag {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("text-muted")};
                &:empty { display: none; }
            }
            & .leave-card__err {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(ee);auth=this.inject(R);router=this.inject(N);tokenQ=this.router.query("token");open=new h(!1);leaving=new h(!1);error=new h("");diagnostics=new h([]);eligible(){return ai(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async leave(){const e=this.tokenQ.get();if(!(!e||this.leaving.get())){this.error.set(""),this.diagnostics.set([]),this.leaving.set(!0);try{const t=await b.friendlyRounds.leave({token:e});t.ok?await this.svc.loadByToken(e):this.diagnostics.set(t.diagnostics)}catch{this.error.set("Could not remove you right now. Try again.")}finally{this.leaving.set(!1)}}}render(){const e=this.wire(li,{root:{className:()=>this.eligible()?"leave-card":"leave-card hidden"},leaveBtn:{onclick:()=>this.open.set(!0),disabled:()=>this.leaving.get()},diag:{textContent:()=>this.diagnostics.get().map(t=>t.message).join(" · ")},err:{textContent:()=>this.error.get()}});return this.spawn(G,this.ref(e,"confirmHost"),{open:this.open,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.leave()}}),e}}function ci(i){return!(i.tab!=="leaderboard"||!i.pageVisible||i.status==="complete")}const ui=2e4;function hi(i){if(!(i===null||i===""))return/^\d+$/.test(i)?Number(i):i}const pi=_(`
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

                    <div bind="seats"></div>
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
`),mi=_('<button bind="pill" class="round-view__fmt" type="button"></button>'),fi=_('<button bind="pill" class="round-view__grp" type="button"></button>');class gi extends I{static styles=`
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
                color: ${o("text-muted")};
                cursor: pointer;
                padding: ${a("xs")} 0;
                margin-bottom: ${a("md")};
            }

            & .round-view__notfound {
                color: ${o("text-muted")};
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
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 1.8rem;
                    letter-spacing: -0.02em;
                    color: ${o("text")};
                }
            }

            & .round-view__status {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                border-radius: ${o("radius-pill")};
                padding: 2px 10px;
                flex-shrink: 0;
                background: ${o("accent-soft")};
                color: ${o("accent")};
            }

            & .round-view__meta {
                display: flex;
                gap: ${a("md")};
                margin-top: ${a("xs")};
                color: ${o("text-muted")};
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
                    border: 1px solid ${o("border")};
                    border-radius: ${o("radius-pill")};
                    background: ${o("btn-bg")};
                    color: ${o("text")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    padding: ${a("sm")} ${a("lg")};
                    cursor: pointer;
                    white-space: nowrap;
                    &.active { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
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
                    border: 1px solid ${o("border")};
                    border-radius: ${o("radius-pill")};
                    background: ${o("btn-bg")};
                    color: ${o("text")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    padding: ${a("sm")} ${a("lg")};
                    cursor: pointer;
                    white-space: nowrap;
                    font-variant-numeric: tabular-nums;
                    &.active { background: ${o("accent")}; color: ${o("primary-text")}; border-color: ${o("accent")}; }
                }
            }

            & .round-view__share {
                margin-top: ${a("2xl")};
                padding: ${a("lg")};
                ${T()}
                background: ${o("surface-sunken")};

                & .round-view__share-label {
                    font-weight: 700;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: ${o("text-muted")};
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
                    color: ${o("text-muted")};
                }
                & .round-view__copy {
                    ${w()}
                    padding: 0 ${a("lg")};
                    font-weight: 700;
                    background: ${o("primary")};
                    color: ${o("primary-text")};
                    border: none;
                }
                & .round-view__share-hint {
                    margin: ${a("sm")} 0 0;
                    font-size: 0.8rem;
                    color: ${o("text-muted")};
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
                border: 1px solid ${o("border")};
                border-radius: ${o("radius")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${o("text")};
                cursor: pointer;

                &:hover, &:active { border-color: ${o("text-muted")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
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
                border: 1px solid ${o("border")};
                border-radius: ${o("radius")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${o("error")};
                cursor: pointer;

                &:hover, &:active { border-color: ${o("error")}; }
                &:focus-visible { outline: 2px solid ${o("error")}; outline-offset: 2px; }
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
            box-shadow: ${o("shadow-elevated")};
            &.hidden { display: none; }
        }

        .round-hole {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${a("md")};
            background: ${o("hole-bar")};
            color: ${o("hole-bar-text")};
            padding: ${a("sm")} ${a("lg")};

            &.hidden { display: none; }

            & .round-hole__nav {
                flex: 0 0 auto;
                width: 40px;
                height: 40px;
                border: none;
                border-radius: ${o("radius-pill")};
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
                font-family: ${o("font-display")};
                font-weight: 700;
                font-size: 1.4rem;
                font-variant-numeric: tabular-nums;
            }
        }

        .round-tabs {
            display: flex;
            background: ${o("topbar-bg")};
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
                &.active { color: ${o("accent")}; }
            }
        }
    `;svc=this.inject(ee);router=this.inject(N);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new h(this.initPos.tab);pageVisible=new h(!document.hidden);hasRound=new y(()=>this.svc.round.get()!==null);hasScoring=new y(()=>this.svc.balls.get().length>0);deleteOpen=new h(!1);finishOpen=new h(!1);isComplete=new y(()=>this.svc.round.get()?.status==="complete");shareUrl=new y(()=>{const e=this.tokenQ.get(),t="/tapscore/".replace(/\/+$/,"");return e?`${location.origin}${t}/round?token=${e}`:""});render(){this.track($(()=>{const d=this.tokenQ.get();d&&this.svc.loadByToken(d,this.initPos).then(()=>{this.tab.get()==="leaderboard"&&this.svc.loadResult()})}));const e=()=>{this.svc.flushPending()};window.addEventListener("online",e),this.track(()=>window.removeEventListener("online",e));const t=()=>this.pageVisible.set(!document.hidden);document.addEventListener("visibilitychange",t),this.track(()=>document.removeEventListener("visibilitychange",t));let s=null;this.track($(()=>{const d=ci({tab:this.tab.get(),pageVisible:this.pageVisible.get(),status:this.svc.round.get()?.status??null});d&&s===null?s=setInterval(()=>{this.svc.pollResult()},ui):!d&&s!==null&&(clearInterval(s),s=null)})),this.track(()=>{s!==null&&clearInterval(s)}),this.track($(()=>{const d=this.tab.get(),u=this.svc.selectedSlotDefId(),c=this.svc.holeIdx.get();if(this.router.route.get()!=="/round"||!this.hasRound.get())return;const m=this.tokenQ.get();if(!m)return;const p={token:m};d==="leaderboard"&&(p.tab="board");const g=this.svc.round.get()?.formatSlots[0]?.slotDefId??null;u&&u!==g&&(p.slot=u),c>0&&(p.hole=c+1),this.router.navigate(this.router.route.get(),{replace:!0,query:p})}));const n={not_started:"Not started",active:"Live",complete:"Finished"},r=this.wire(pi,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},course:()=>this.svc.round.get()?.courseNameSnapshot??"Round",status:()=>{const d=this.svc.round.get()?.status??"not_started";return n[d]??d},date:()=>this.svc.round.get()?.date??"",route:()=>{const d=this.svc.round.get();return d?`${d.playHoles.length} holes`:""},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},groupTabs:{className:()=>this.svc.groups().length>1?"round-view__groups":"round-view__groups hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},finishBtn:{textContent:()=>this.isComplete.get()?"Reopen round":"Finish round",onclick:()=>this.finishOpen.set(!0),disabled:()=>this.svc.finishing.get()},deleteBtn:{onclick:()=>this.deleteOpen.set(!0),disabled:()=>this.svc.deleting.get()},dock:{className:()=>this.hasRound.get()&&!this.svc.keypadOpen.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const d=this.svc.currentPlayedHole();return d?this.svc.occLabel(d.playHoleId):""},holeSi:()=>{const d=this.svc.currentPlayHole()?.baseStrokeIndex;return d!=null?String(d):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});this.$each(this.ref(r,"groupTabs"),new y(()=>this.svc.groups()),(d,u,c)=>this.groupPill(u,c),d=>d.id),this.$each(this.ref(r,"formats"),new y(()=>this.svc.round.get()?.formatSlots??[]),(d,u,c)=>this.slotPill(d,u,c),d=>d.slotDefId),this.spawn(fn,this.ref(r,"scoring")),this.spawn(Bn,this.ref(r,"leaderboard")),this.spawn(Zn,this.ref(r,"seats")),this.spawn(oi,this.ref(r,"edit")),this.spawn(Vn,this.ref(r,"claim")),this.spawn(ii,this.ref(r,"join")),this.spawn(di,this.ref(r,"leave")),this.spawn(G,this.ref(r,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:"This permanently removes the round and all its scores for everyone. This can't be undone.",confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.svc.deleteRound().then(d=>{d&&this.router.navigate("/")})}}),this.spawn(G,this.ref(r,"finishConfirmHost"),{open:this.finishOpen,title:"Finish or reopen round",message:()=>this.isComplete.get()?"Reopen this round? It'll move back to your ongoing rounds.":"Finish this round? It'll move to your finished rounds. You can still edit or reopen it any time.",cancelLabel:"Cancel",onconfirm:()=>{this.isComplete.get()?this.svc.reopenRound():this.svc.finishRound()}});const l=d=>{d.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1),d.key==="Escape"&&this.finishOpen.get()&&this.finishOpen.set(!1)};return window.addEventListener("keydown",l),this.track(()=>window.removeEventListener("keydown",l)),r}readUrlPosition(){const e=new URLSearchParams(location.search),t=e.get("slot"),s=Number(e.get("hole"));return{tab:e.get("tab")==="board"?"leaderboard":"score",selectedSlot:hi(t),holeIdx:Number.isFinite(s)&&s>0?s-1:0}}groupPill(e,t){return this.wireEl(fi,{pill:{textContent:()=>{const s=this.svc.groups()[e];if(!s)return`Group ${e+1}`;const n=[`Group ${e+1}`];s.startTime.includes(":")&&n.push(s.startTime);const r=this.svc.playHoleById(s.startPlayHoleId)?.courseHoleNumber;return r!==void 0&&s.startOrdinal!==1&&n.push(`H${r}`),n.join(" · ")},className:()=>this.svc.groupIdx.get()===e?"round-view__grp active":"round-view__grp",onclick:()=>this.svc.groupIdx.set(e)}},t)}slotPill(e,t,s){return this.wireEl(mi,{pill:{textContent:()=>It(e),className:()=>this.tab.get()==="leaderboard"&&this.svc.selectedSlotDefId()===e.slotDefId?"round-view__fmt active":"round-view__fmt",onclick:()=>{this.svc.selectSlot(e.slotDefId),this.tab.get()!=="leaderboard"&&(this.tab.set("leaderboard"),this.svc.loadResult())}}},s)}}function Nt(i){return i.handicapIndex*(i.slope/113)+(i.courseRating-i.par)}function bi(i){return Math.round(Nt(i))}function _i(i){if(!i)return null;const e=/^slots\[slot-(\d+)\]/.exec(i);return e?Number(e[1]):null}function yi(i){if(!i)return null;const e=/^formats\[(\d+)\]/.exec(i);return e?Number(e[1]):null}function Pt(i){return yi(i.path)??_i(i.path)}function vi(i,e){return i.filter(t=>Pt(t)===e)}function wi(i){return i.filter(e=>!e.path?.startsWith("producers")&&!e.path?.startsWith("playingGroups")&&e.path!=="route"&&Pt(e)===null)}function re(i){return`${i} ${i===1?"player":"players"}`}function me(i,e){const t=i.formatId?e(i.formatId)??i.formatId:null,s=i.teamLabel;switch(i.code){case"team_size_above_max":if(t&&s&&i.actual!==void 0&&i.allowedMax!==void 0)return`${s} has ${re(i.actual)} — ${t} allows at most ${i.allowedMax} per team.`;break;case"team_size_below_min":if(t&&s&&i.actual!==void 0&&i.allowedMin!==void 0)return`${s} has ${re(i.actual)} — ${t} needs at least ${i.allowedMin} per team.`;break;case"empty_team_grouping":if(t&&s)return`${s} has no players — add at least one, or remove the team.`;break;case"team_count_above_max":if(t&&i.actual!==void 0&&i.allowedMax!==void 0)return`${i.actual} teams — ${t} allows at most ${i.allowedMax}.`;break;case"team_count_below_min":if(t&&i.actual!==void 0&&i.allowedMin!==void 0)return`${i.actual} teams — ${t} needs at least ${i.allowedMin}.`;break;case"slot_ball_count_above_max":if(t&&i.actual!==void 0&&i.allowedMax!==void 0)return`${re(i.actual)} in ${t} — it scores at most ${i.allowedMax}.`;break;case"slot_ball_count_below_min":if(t&&i.actual!==void 0&&i.allowedMin!==void 0)return`${re(i.actual)} in ${t} — it needs at least ${i.allowedMin}.`;break;case"slot_ball_count_not_multiple":if(t&&i.actual!==void 0)return`${t} pairs its balls, so it needs an even number — ${re(i.actual)} won't pair up.`;break;case"missing_team_grouping":if(t)return`${t} needs its players grouped into teams — tick the teams it scores.`;break;case"producer_has_scores":return i.message;case"scored_ball_orphaned":return i.message;case"edit_locked_course_route":return"Scores have already been recorded — the course and route are locked for this round.";case"round_complete":return"This round is complete — its setup can no longer be edited.";case"not_editable":return"This round can no longer be edited."}return i.message}function xi(i){return i?i.type==="flat"?String(i.pct):i.bands.length>0?String(i.bands[0].pct):"100":"100"}function $i(i){const e=i.roundType;if(e==="full_18"||e==="front_9"||e==="back_9")return{preset:e,startHole:ki(i)};const t=(i.route?.playHoles??[]).map(l=>l.courseHoleNumber),s=t[0]??1,n=new Set(t);return{preset:t.length<=9&&[...n].every(l=>l<=9)?"front_9":t.length<=9&&[...n].every(l=>l>=10)?"back_9":"full_18",startHole:s}}function ki(i){return i.roundType==="back_9"?10:1}function Si(i,e=()=>""){let t=1,s=1,n=1,r=1;const l=new Map,d=i.producers.map(v=>{const k=t++;l.set(v.producerDefId,k);const D=v.playerRef.kind==="guest";return{key:k,name:e(v.producerDefId),handicapIndex:String(v.handicapIndex),gender:v.gender??"M",teeId:v.teeId,producerDefId:v.producerDefId,...D?{guestPlayerId:v.playerRef.id}:{playerId:v.playerRef.id,genderKnown:v.gender!=null}}}),u=new Map;(i.teams??[]).forEach(v=>{u.set(v.id,s++)});const c=(i.teams??[]).map(v=>{const k=u.get(v.id),D={},F={};for(const E of v.members)if("producerDefId"in E){const A=l.get(E.producerDefId);A!==void 0&&(D[A]=String(E.allowancePct))}else{const A=u.get(E.teamId);A!==void 0&&(F[A]=!0)}return{key:k,kind:v.kind??"single_ball",formation:v.formation??"scramble",pctByPlayer:D,memberTeams:F}}),m=(i.playingGroups??[]).map(v=>{const k={};for(const D of v.members){const F=l.get(D);F!==void 0&&(k[F]=!0)}return{key:n++,startTime:v.startTime??"",startHole:v.startHole??null,members:k}}),p=i.formats.map(v=>{const k={},D={},F=v.subjects;if(F){const ne=new Set;for(const K of F)if(K.kind==="player"){const W=l.get(K.producerDefId);W!==void 0&&ne.add(W)}else{const W=u.get(K.teamId);W!==void 0&&(D[W]=!0)}for(const K of d)k[K.key]=ne.has(K.key)}const E=v.formatConfig,A=E&&typeof E=="object"&&"bonusRule"in E?E.bonusRule:void 0;return{key:r++,formatId:v.formatId,allowancePct:xi(v.allowanceConfig),subjectPlayers:k,subjectTeams:D,...A==="gross"||A==="net"?{bonusRule:A}:{}}}),{preset:g,startHole:x}=$i(i);return{courseId:i.courseId,preset:g,startHole:x,players:d,teams:c,groups:m,formatSlots:p,nextKey:t,nextTeamKey:s,nextGroupKey:n,nextSlotKey:r}}const Ii=["scramble","greensomes","foursomes","custom"],fe=2,ke=10,Ci="ABCDEFGH",Ti={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class Ei{loading=new h(!1);error=new h(null);courses=new h([]);tees=new h([]);courseId=new h("");preset=new h("full_18");startHole=new h(1);players=new h([]);teams=new h([]);groups=new h([]);formatSlots=new h([]);submitting=new h(!1);diagnostics=new h([]);submitError=new h(null);editToken=new h(null);hasScores=new h(!1);editStatus=new h(null);editBlockedReason=new h(null);editPlayedAt=null;catalog=z.get(ce);nextKey=1;nextSlotKey=1;nextTeamKey=1;nextGroupKey=1;reset(){this.courses.set([]),this.tees.set([]),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.groups.set([]),this.formatSlots.set([]),this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.editToken.set(null),this.hasScores.set(!1),this.editStatus.set(null),this.editBlockedReason.set(null),this.editPlayedAt=null,this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1,this.nextGroupKey=1}async load(){this.catalog.load().then(()=>this.ensureDefaultSlot());const e=await C(this.loading,this.error,()=>b.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}async loadForEdit(e){this.reset(),this.editToken.set(e),await this.catalog.load();const t=await C(this.loading,this.error,()=>b.friendlyRounds.setup({token:e}));if(!t)return;if(this.editStatus.set(t.status),!t.editable){this.editBlockedReason.set(t.reason);return}if(t.draft.producers.some(u=>"placeholder"in u)){this.editBlockedReason.set("has_open_seats");return}this.hasScores.set(t.hasScores),this.editPlayedAt=t.draft.playedAt;const s=await C(this.loading,this.error,()=>b.setup.courses());s&&this.courses.set(s);const n=await C(this.loading,this.error,()=>b.setup.teesByCourse({courseId:t.draft.courseId}));this.tees.set(n??[]);const r=await C(this.loading,this.error,()=>b.friendlyRounds.balls({token:e})),l=new Map;for(const u of r??[])for(const c of u.players)l.set(c.producerDefId,c.displayName);const d=Si(t.draft,u=>l.get(u)??"");this.courseId.set(d.courseId),this.preset.set(d.preset),this.startHole.set(d.startHole),this.players.set(d.players),this.teams.set(d.teams),this.groups.set(d.groups),this.formatSlots.set(d.formatSlots),this.nextKey=d.nextKey,this.nextTeamKey=d.nextTeamKey,this.nextGroupKey=d.nextGroupKey,this.nextSlotKey=d.nextSlotKey}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const s=await C(this.loading,this.error,()=>b.setup.teesByCourse({courseId:e}))??[];this.tees.set(s);const n=new Set(s.map(l=>l.id)),r=s[0]?.id??"";this.players.set(this.players.get().map(l=>({...l,teeId:n.has(l.teeId)?l.teeId:r}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}])}addMe(e){this.addFriend(e)}addFriend(e){if(this.hasPlayer(e.id))return;const t=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:e.displayName,handicapIndex:e.handicapIndex===null?"":String(e.handicapIndex),gender:e.gender??"M",genderKnown:e.gender!=null,teeId:t,playerId:e.id}])}hasPlayer(e){return this.players.get().some(t=>t.playerId===e)}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e)),this.groups.set(this.groups.get().map(t=>{if(t.members[e]===void 0)return t;const s={...t.members};return delete s[e],{...t,members:s}}))}patchPlayer(e,t){this.players.set(this.players.get().map(s=>s.key===e?{...s,...t}:s))}ensureDefaultSlot(){if(this.formatSlots.get().length>0)return;const e=this.catalog.byId("stableford_individual")??this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",s={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{}};this.formatSlots.set([...this.formatSlots.get(),s])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}formatTakesBonusRule(e){return e==="taliban_better_ball"}setSlotBonusRule(e,t){this.patchFormatSlot(e,{bonusRule:t})}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(s=>s.key===e?{...s,...t}:s))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return Ci[e]??`T${e+1}`}formations=Ii;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{}}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,kind:t,memberTeams:t==="single_ball"?{}:s.memberTeams}:s)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,s){const n=this.teamByKey(e);if(!n||n.kind!=="multi_ball"||t===e)return;const r={...n.memberTeams};if(s){if(this.teamMemberCount(e)>=ke)return;r[t]=!0}else delete r[t];this.teams.set(this.teams.get().map(l=>l.key===e?{...l,memberTeams:r}:l))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(s=>t.memberTeams[Number(s)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{let t=!1;const s={...e.subjectTeams};for(const n of this.teams.get())s[n.key]===!0&&!this.teamKindFitsFormat(e.formatId,n.kind)&&(delete s[n.key],t=!0);return t?{...e,subjectTeams:s}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}teamKindFitsFormat(e,t){return this.isSideFormat(e)?t==="multi_ball":t==="single_ball"||this.catalog.acceptsSideSubjects(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const s={...t.memberTeams};return delete s[e],{...t,memberTeams:s}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const s={...t.subjectTeams};return delete s[e],{...t,subjectTeams:s}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.teams.get().findIndex(s=>s.key===e.key);return`Team ${this.teamLetter(Math.max(0,t))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,formation:t}:s))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,s){const n=this.teamByKey(e);if(!n)return;const r={...n.pctByPlayer};if(s){if(r[t]!==void 0||this.teamMemberCount(e)>=ke)return;r[t]=r[t]??"100"}else delete r[t];this.teams.set(this.teams.get().map(l=>l.key===e?{...l,pctByPlayer:r}:l))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=ke}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let s=0;for(const n of this.players.get()){const r=t.pctByPlayer[n.key];if(r===void 0)continue;const l=this.derivedCH(n);if(!l)return null;s+=this.parsePct(r)*l.ch/100}return Math.round(s)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<fe)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=fe;let s=t;for(const n of this.teams.get())e.memberTeams[n.key]===!0&&n.kind==="single_ball"&&Object.keys(n.pctByPlayer).length>=fe&&s++;return s>=fe}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,s){const n=this.teamByKey(e);!n||n.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(r=>r.key===e?{...r,pctByPlayer:{...r.pctByPlayer,[t]:s}}:r))}groupsEnabled(){return this.groups.get().length>0}splitIntoGroups(){if(this.groupsEnabled())return;const e={};for(const t of this.players.get())e[t.key]=!0;this.groups.set([{key:this.nextGroupKey++,startTime:"",startHole:null,members:e},{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}clearGroups(){this.groups.set([])}addGroup(){this.groupsEnabled()&&this.groups.set([...this.groups.get(),{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}removeGroup(e){const t=this.groups.get().filter(s=>s.key!==e);this.groups.set(t.length>1?t:[])}groupByKey(e){return this.groups.get().find(t=>t.key===e)??null}groupLabel(e){const t=this.groups.get().findIndex(s=>s.key===e.key);return`Group ${Math.max(0,t)+1}`}groupMemberIn(e,t){return this.groupByKey(e)?.members[t]===!0}setGroupMember(e,t,s){this.groups.set(this.groups.get().map(n=>{const r=n.key===e,l=n.members[t]===!0;if(r&&s&&!l)return{...n,members:{...n.members,[t]:!0}};if(l&&(!r||!s)){const d={...n.members};return delete d[t],{...n,members:d}}return n}))}setGroupStartTime(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startTime:t}:s))}setGroupStartHole(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startHole:t}:s))}groupSize(e){const t=this.groupByKey(e);return t?this.players.get().filter(s=>t.members[s.key]===!0).length:0}ungroupedPlayers(){if(!this.groupsEnabled())return[];const e=new Set;for(const t of this.groups.get())for(const s of Object.keys(t.members))t.members[Number(s)]&&e.add(Number(s));return this.players.get().filter(t=>!e.has(t.key))}crossGroupTeamWarnings(){if(!this.groupsEnabled())return[];const e=new Map;this.groups.get().forEach((s,n)=>{for(const r of Object.keys(s.members))s.members[Number(r)]&&e.set(Number(r),n)});const t=[];for(const s of this.teams.get()){if(s.kind!=="single_ball"||!this.isTeamLive(s))continue;const n=new Set;for(const r of Object.keys(s.pctByPlayer)){const l=e.get(Number(r));l!==void 0&&n.add(l)}n.size>1&&t.push(`${this.teamLabel(s)} plays one combined ball, but its players are in different groups — keep them in the same group.`)}return t}buildGroups(e,t){return this.groups.get().map(s=>({members:e.filter(n=>s.members[n.key]===!0).map(n=>t.get(n.key)),...s.startTime.trim()!==""?{startTime:s.startTime.trim()}:{},...s.startHole!==null?{startHole:s.startHole}:{}})).filter(s=>s.members.length>0)}diagnosticsForGroups(){return this.diagnostics.get().filter(e=>e.path?.startsWith("playingGroups"))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectPlayers:{...n.subjectPlayers,[t]:s}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectTeams:{...n.subjectTeams,[t]:s}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return Ti[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,s)=>t-s);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1),this.groups.set(this.groups.get().map(s=>s.startHole!==null&&!t.includes(s.startHole)?{...s,startHole:null}:s))}derivedCH(e){const t=Number.parseFloat(e.handicapIndex);if(!Number.isFinite(t))return null;const s=this.teeById(e.teeId);if(!s)return null;const n=s.ratings.find(l=>l.gender===e.gender);if(!n)return null;const r={handicapIndex:t,slope:n.slope,courseRating:n.courseRating,par:n.par};return{ch:bi(r),raw:Nt(r),rating:n,teeName:s.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}humanizedRoster(){return this.diagnostics.get().filter(e=>e.path==="producers").map(e=>me(e,t=>this.catalog.labelOf(t)))}humanizedRoute(){return this.diagnostics.get().filter(e=>e.path==="route").map(e=>me(e,t=>this.catalog.labelOf(t)))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const s of this.formatSlots.get()){for(const n of e)s.subjectPlayers[n.key]!==!1&&t.add(n.key);for(const n of this.teams.get())if(s.subjectTeams[n.key]===!0)for(const r of e)n.pctByPlayer[r.key]!==void 0&&t.add(r.key)}return e.filter(s=>!t.has(s.key))}diagnosticsForFormat(e){return vi(this.diagnostics.get(),e)}humanizedForFormat(e){return this.diagnosticsForFormat(e).map(t=>me(t,s=>this.catalog.labelOf(s)))}generalDiagnostics(){return wi(this.diagnostics.get())}humanizedGeneral(){return this.generalDiagnostics().map(e=>me(e,t=>this.catalog.labelOf(t)))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const s=this.liveTeamKeySet(),n=[];for(const r of this.teams.get()){if(!s.has(r.key))continue;const l=e.filter(d=>r.pctByPlayer[d.key]!==void 0).map(d=>({producerDefId:t.get(d.key),allowancePct:this.parsePct(r.pctByPlayer[d.key])}));if(r.kind==="multi_ball")for(const d of this.teams.get())r.memberTeams[d.key]===!0&&d.key!==r.key&&d.kind==="single_ball"&&s.has(d.key)&&l.push({teamId:String(d.key)});n.push({id:String(r.key),label:this.teamLabel(r),formation:r.formation,kind:r.kind,members:l})}return n}buildFormats(e,t){const s=this.liveTeamKeySet();return this.formatSlots.get().map(n=>{const r=this.isSideFormat(n.formatId),l=[];if(!r)for(const d of e)n.subjectPlayers[d.key]!==!1&&l.push({kind:"player",producerDefId:t.get(d.key)});for(const d of this.teams.get())n.subjectTeams[d.key]===!0&&s.has(d.key)&&this.teamKindFitsFormat(n.formatId,d.kind)&&l.push({kind:"team",teamId:String(d.key)});return{formatId:n.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(n.allowancePct)},subjects:l,...this.formatTakesBonusRule(n.formatId)?{formatConfig:{bonusRule:n.bonusRule??"gross"}}:{}}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),s=e.indexOf(t);return s<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(s),...e.slice(0,s)].map(r=>({courseHoleNumber:r})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];if(e.forEach((n,r)=>{n.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${r}].name`}),Number.isFinite(Number.parseFloat(n.handicapIndex))||t.push({code:"missing_index",message:"Handicap index required",path:`producers[${r}].handicapIndex`}),n.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${r}].teeId`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};const s=this.editToken.get();this.submitting.set(!0);try{const n=new Map;e.forEach((g,x)=>{n.set(g.key,g.producerDefId??(s?`p-${g.key}`:`p${x+1}`))});const r=[];for(const g of e){const x=Number.parseFloat(g.handicapIndex),v=g.playerId?{kind:"player",id:g.playerId}:g.guestPlayerId?{kind:"guest",id:g.guestPlayerId}:{kind:"guest",id:(await b.guestPlayers.create({displayName:g.name.trim(),gender:g.gender,handicapIndex:x})).id};r.push({producerDefId:n.get(g.key),playerRef:v,handicapIndex:x,gender:g.gender,teeId:g.teeId})}const{roundType:l,route:d}=this.buildRoute(),u=this.buildTeams(e,n),c=this.buildGroups(e,n),m={courseId:this.courseId.get(),playedAt:this.editPlayedAt??new Date().toISOString().slice(0,10),roundType:l,...d?{route:d}:{},producers:r,...u.length>0?{teams:u}:{},formats:this.buildFormats(e,n),...c.length>0?{playingGroups:c}:{}};if(s){const g=await b.friendlyRounds.editSetup({token:s,draft:m});return g.ok?{ok:!0,token:s}:(this.diagnostics.set(g.diagnostics),{ok:!1})}const p=await b.friendlyRounds.create({draft:m});return p.ok?(ye({token:p.friendlyRound.shareToken,courseName:p.round.courseNameSnapshot??"",status:p.round.status,completedAt:p.round.completedAt,lastSeenAt:new Date().toISOString()}),{ok:!0,token:p.friendlyRound.shareToken}):(this.diagnostics.set(p.diagnostics),{ok:!1})}catch(n){return this.submitError.set(n instanceof M?n.message:s?"Could not save the round. Try again.":"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}class De{loading=new h(!1);error=new h(null);player=new h(null);history=new h([]);clubs=new h([]);saving=new h(!1);saveError=new h(null);async load(e=!1){if(!e&&(this.player.get()!==null||this.loading.get()))return;const t=await C(this.loading,this.error,()=>Promise.all([b.players.me(),b.players.myHandicapHistory(),b.clubs.list()]));if(!t)return;const[s,n,r]=t;this.player.set(s),this.history.set(n),this.clubs.set(r)}clear(){this.player.set(null),this.history.set([]),this.error.set(null),this.saveError.set(null)}async saveIndex(e){return await C(this.saving,this.saveError,()=>b.players.updateHandicap({handicapIndex:e}))?(await this.load(!0),!0):!1}async saveGender(e){const t=await C(this.saving,this.saveError,()=>b.players.updateProfile({gender:e}));return t?(this.player.set(t),!0):!1}async saveHomeClub(e){const t=await C(this.saving,this.saveError,()=>b.players.updateProfile({homeClubId:e}));return t?(this.player.set(t),!0):!1}homeClubName(){const e=this.player.get()?.homeClubId;return e?this.clubs.get().find(t=>t.id===e)?.name??null:null}}function Se(i,e){return i.displayName.localeCompare(e.displayName,"sv",{sensitivity:"base"})}function He(i,e="frecency"){return e==="alpha"?[...i].sort(Se):[...i].sort((t,s)=>{const n=t.frecency,r=s.frecency,l=n>0,d=r>0;if(l!==d)return l?-1:1;if(!l)return Se(t,s);if(r!==n)return r-n;const u=t.lastPlayedAt?Date.parse(t.lastPlayedAt):NaN,c=s.lastPlayedAt?Date.parse(s.lastPlayedAt):NaN,m=Number.isNaN(u)?Number.NEGATIVE_INFINITY:u,p=Number.isNaN(c)?Number.NEGATIVE_INFINITY:c;return p!==m?p-m:Se(t,s)})}const Ni=1440*60*1e3;function Pi(i,e){if(!i)return null;const t=Date.parse(i),s=Date.parse(e);if(Number.isNaN(t)||Number.isNaN(s))return null;const n=Math.floor((s-t)/Ni);if(n<=0)return"today";if(n===1)return"yesterday";if(n<7)return`${n} days ago`;if(n<14)return"last week";if(n<30)return`${Math.floor(n/7)} weeks ago`;if(n<60)return"last month";if(n<365)return`${Math.floor(n/30)} months ago`;const r=Math.floor(n/365);return r===1?"last year":`${r} years ago`}function zi(i,e){if(i.sharedRoundCount<=0)return"never played";const t=Pi(i.lastPlayedAt,e),s=`played ${i.sharedRoundCount}×`;return t?`${s}, ${t}`:s}const zt=2;function at(i){return i.trim().length>=zt}function Rt(i){return He(i,"frecency")}function Ri(i,e){return Rt([...i.filter(t=>t.id!==e.id),e])}function ji(i,e){return i.filter(t=>t.id!==e)}function lt(i,e,t){return i.map(s=>s.id===e?{...s,isFriend:t}:s)}function Oi(i,e,t=()=>{},s=300){let n=0,r;return l=>{const d=l.trim(),u=++n;if(r!==void 0&&clearTimeout(r),r=void 0,d.length<zt){e(d,[]);return}r=setTimeout(()=>{i(d).then(c=>{u===n&&e(d,c)},c=>{u===n&&t(d,c)})},s)}}const jt="tapscore.friends.sort.v1";function Ot(){try{return typeof localStorage<"u"?localStorage:null}catch{return null}}function Li(i=Ot()){if(!i)return"frecency";let e;try{e=i.getItem(jt)}catch{return"frecency"}return e==="alpha"?"alpha":"frecency"}function Di(i,e=Ot()){if(e)try{e.setItem(jt,i)}catch{}}class we{loading=new h(!1);error=new h(null);friends=new h([]);loaded=new h(!1);sortMode=new h(Li());query=new h("");searching=new h(!1);searchError=new h(null);results=new h([]);resultsFor=new h("");mutating=new h(!1);mutateError=new h(null);runSearch=Oi(e=>b.players.search({q:e}),(e,t)=>{this.searching.set(!1),this.results.set(t),this.resultsFor.set(e)},(e,t)=>{this.searching.set(!1),this.results.set([]),this.resultsFor.set(e),this.searchError.set({code:"network",message:t instanceof Error?t.message:"Search failed. Try again."})});async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;const t=await C(this.loading,this.error,()=>b.friends.list());t&&(this.friends.set(Rt(t)),this.loaded.set(!0))}setQuery(e){this.query.set(e),this.searchError.set(null),this.searching.set(e.trim().length>=2),this.runSearch(e)}async add(e){await C(this.mutating,this.mutateError,()=>b.friends.add({friendId:e.id}))&&(this.friends.set(Ri(this.friends.get(),{id:e.id,username:e.username,displayName:e.displayName,gender:e.gender,handicapIndex:e.handicapIndex,homeClubName:e.homeClubName,sharedRoundCount:0,lastPlayedAt:null,frecency:0})),this.results.set(lt(this.results.get(),e.id,!0)))}setSortMode(e){this.sortMode.set(e),Di(e)}async remove(e){await C(this.mutating,this.mutateError,()=>b.friends.remove({friendId:e}))&&(this.friends.set(ji(this.friends.get(),e)),this.results.set(lt(this.results.get(),e,!1)))}clear(){this.friends.set([]),this.loaded.set(!1),this.query.set(""),this.results.set([]),this.resultsFor.set(""),this.error.set(null),this.searchError.set(null),this.mutateError.set(null),this.searching.set(!1)}}const Hi=["full_18","front_9","back_9"],Mi=_(`
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
`),Ai=_(`
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
`),Fi=_(`
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

        <div bind="bonusGroup" class="fslot__group">
            <span class="fslot__label">Birdie/eagle bonus on</span>
            <div class="fslot__seg">
                <button bind="bonusGross" type="button">Gross</button>
                <button bind="bonusNet" type="button">Net</button>
            </div>
        </div>

        <div class="fslot__group">
            <span class="fslot__label">Scores</span>
            <div bind="subjectRows" class="fslot__teamrows"></div>
        </div>

        <div bind="err" class="fslot__err"></div>
    </div>
`),dt=_(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),Bi=_(`
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
`),Gi=_(`
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
`),qi=_(`
    <button bind="row" type="button" class="frow">
        <span bind="name" class="frow__name"></span>
        <span bind="username" class="frow__username"></span>
        <span bind="hcp" class="frow__hcp"></span>
    </button>
`),ct=_(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class Ki extends I{static styles=`
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
                font-size: 0.9rem; font-weight: 600; color: ${o("text-muted")};
                cursor: pointer; padding: ${a("xs")} 0; margin-bottom: ${a("md")};
            }

            & .setup__head {
                margin-bottom: ${a("xl")};
                & h1 {
                    margin: 0; font-family: ${o("font-display")}; font-weight: 600;
                    font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${o("text-muted")}; font-size: 0.9rem; }
            }

            & .setup__section {
                margin-bottom: ${a("xl")};
                & h2 {
                    margin: 0 0 ${a("sm")}; font-family: ${o("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .setup__hint { margin: 0 0 ${a("md")}; color: ${o("text-muted")}; font-size: 0.82rem; }

            & .setup__note {
                margin: ${a("sm")} 0 0; font-size: 0.82rem; color: ${o("text-muted")};
                &:empty { display: none; }
            }

            & .setup__warn {
                margin: ${a("sm")} 0 0; font-size: 0.82rem; color: ${o("error")};
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
                    flex: 1; padding: ${a("md")} 0; ${w()}
                    font-family: inherit; font-weight: 700; font-size: 0.9rem;
                    &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                }
            }

            & .setup__startrow {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${a("md")}; font-size: 0.9rem; color: ${o("text-muted")};
            }

            & .setup__players { display: flex; flex-direction: column; gap: ${a("md")}; }

            & .player {
                padding: ${a("md")}; ${T()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .player__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .player__name { flex: 1; padding: ${a("md")}; font-size: 1rem; ${H()} }
                & .player__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${w()}
                    font-size: 1rem; color: ${o("text-muted")};
                }
                & .player__fields { display: flex; gap: ${a("sm")}; align-items: stretch; }
                & .player__index { flex: 1; min-width: 0; padding: ${a("md")}; font-size: 1rem; ${H()} }
                & .player__gender { width: 72px; flex-shrink: 0; font-size: 1rem; }
                & .player__tee { flex: 1; min-width: 0; font-size: 1rem; }

                & .player__ch {
                    font-size: 0.82rem; color: ${o("text-muted")}; font-variant-numeric: tabular-nums;
                    &:empty { display: none; }
                }
                & .player__err {
                    font-size: 0.82rem; color: ${o("error")};
                    &:empty { display: none; }
                }
            }

            & .setup__add {
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")}; ${w()}
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }
            & .setup__add.hidden { display: none; }

            & .setup__friends {
                margin-top: ${a("sm")}; padding: ${a("sm")}; ${T()}
                &.hidden { display: none; }

                & .setup__friendrows { display: flex; flex-direction: column; }
                & .setup__hint { margin: ${a("xs")} ${a("sm")}; }
                & .setup__friendrows:not(:empty) + .setup__hint { display: none; }

                & .frow {
                    display: flex; align-items: baseline; gap: ${a("sm")};
                    width: 100%; padding: ${a("md")} ${a("sm")};
                    background: none; border: none; border-bottom: 1px solid ${o("border")};
                    font-family: inherit; text-align: left; cursor: pointer;
                    &:last-child { border-bottom: none; }

                    & .frow__name { font-weight: 600; font-size: 0.95rem; }
                    & .frow__username {
                        flex: 1; min-width: 0; color: ${o("text-muted")}; font-size: 0.8rem;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    & .frow__hcp {
                        flex-shrink: 0; font-weight: 700; font-size: 0.85rem;
                        color: ${o("accent")}; background: ${o("accent-soft")};
                        border-radius: ${o("radius-pill")}; padding: 2px 10px;
                        font-variant-numeric: tabular-nums;
                    }
                }
            }

            & .setup__banner {
                color: ${o("error")}; font-size: 0.875rem; margin-bottom: ${a("md")};
                white-space: pre-line;
                &:empty { display: none; }
            }

            & .setup__fslots { display: flex; flex-direction: column; gap: ${a("md")}; }

            & .fslot {
                padding: ${a("md")}; ${T()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .fslot__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .fslot__teamname { flex: 1; min-width: 0; font-weight: 700; font-size: 0.95rem; }
                & .fslot__teammeta {
                    margin: ${a("xs")} 0 0; font-size: 0.78rem; color: ${o("text-muted")};
                    &:empty { display: none; }
                }
                & .fslot__format { flex: 1; min-width: 0; font-size: 1rem; }
                & .fslot__remove {
                    width: 38px; height: 38px; flex-shrink: 0; ${w()}
                    font-size: 1rem; color: ${o("text-muted")};
                }
                & .fslot__desc {
                    margin: 0; font-size: 0.8rem; color: ${o("text-muted")};
                    &:empty { display: none; }
                }

                & .fslot__group {
                    display: flex; flex-direction: column; gap: ${a("xs")};
                    &[hidden] { display: none; }
                }
                & .fslot__label {
                    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em;
                    text-transform: uppercase; color: ${o("text-muted")};
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
                    & .irow__chk { width: 18px; height: 18px; flex-shrink: 0; accent-color: ${o("primary")}; }
                }

                & .mrow {
                    display: flex; align-items: center; justify-content: space-between; gap: ${a("sm")};
                    & .mrow__pick { display: flex; align-items: center; gap: ${a("sm")}; font-size: 0.9rem; cursor: pointer; }
                    & .mrow__pct {
                        display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
                        font-size: 0.85rem; color: ${o("text-muted")};
                        &[hidden] { display: none; }
                        & input { width: 56px; padding: ${a("xs")} ${a("sm")}; ${H()} font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${a("xs")};
                    & button {
                        flex: 1; padding: ${a("sm")} 0; ${w()}
                        font-family: inherit; font-weight: 700; font-size: 0.82rem;
                        &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                    }
                }
                & .fslot__flat {
                    display: flex; align-items: center; gap: ${a("xs")}; font-size: 0.9rem;
                    color: ${o("text-muted")};
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
                    font-size: 0.82rem; color: ${o("text-muted")};
                    & .brow__pct, & .brow__upto { width: 56px; padding: ${a("sm")}; font-size: 0.95rem; ${H()} }
                    & .brow__del { margin-left: auto; width: 30px; height: 30px; ${w()} font-size: 0.8rem; color: ${o("text-muted")}; }
                }
                & .fslot__addband {
                    align-self: flex-start; padding: ${a("xs")} ${a("sm")}; ${w()}
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                }

                & .fslot__err {
                    font-size: 0.82rem; color: ${o("error")};
                    &:empty { display: none; }
                }

                & .grp__start {
                    display: flex; gap: ${a("sm")}; align-items: stretch;
                    & .grp__time { flex: 1; min-width: 0; padding: ${a("sm")} ${a("md")}; font-size: 1rem; font-family: inherit; ${H()} }
                    & .grp__hole { flex: 1; min-width: 0; font-size: 1rem; }
                }
            }

            & .setup__create {
                width: 100%; padding: ${a("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit; ${w()}
                background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                box-shadow: ${o("shadow-elevated")};
                &:hover { background: ${o("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            & .setup__cancel {
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")}; ${w()}
                background: none; font-family: inherit; font-weight: 600; font-size: 0.95rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }

            & .setup__blocked {
                padding: ${a("lg")}; ${T()}
                background: ${o("surface-sunken")}; color: ${o("text-muted")};
                font-size: 0.95rem; margin-bottom: ${a("xl")};
                &.hidden { display: none; }
            }

            & .setup__locknote {
                margin: ${a("sm")} 0 0; font-size: 0.8rem; color: ${o("text-muted")};
                &.hidden { display: none; }
            }
        }
    `;svc=this.inject(Ei);router=this.inject(N);auth=this.inject(R);profile=this.inject(De);friends=this.inject(we);pickerOpen=new h(!1);render(){const e=this.router.query("token").get(),t=!!e;this.pickerOpen.set(!1),t?this.svc.loadForEdit(e):(this.svc.reset(),this.svc.load()),this.auth.currentUser.get()&&(this.profile.load(),this.friends.load());const s=()=>t&&this.svc.editBlockedReason.get()!==null,n=()=>t&&this.svc.hasScores.get(),r=()=>this.profile.player.get(),l=()=>{const c=r();return this.auth.currentUser.get()!==null&&c!==null&&!this.svc.hasPlayer(c.id)},d=this.wire(Mi,{root:{className:()=>s()?"setup setup--blocked":"setup"},back:{textContent:()=>t?"← Back to round":"← Home",onclick:()=>t&&e?this.router.navigate("/round",{query:{token:e}}):this.router.navigate("/")},title:{textContent:()=>t?"Edit round":"New round"},subtitle:{textContent:()=>t?"Change the setup — scored balls are preserved.":"No sign-in required."},blocked:{className:()=>s()?"setup__blocked":"setup__blocked hidden",textContent:()=>this.svc.editBlockedReason.get()==="round_complete"?"This round is complete — its setup can no longer be edited.":this.svc.editBlockedReason.get()==="no_stored_draft"?"This round didn't come from the setup wizard, so it can't be edited here.":this.svc.editBlockedReason.get()==="has_open_seats"?"This round has open seats waiting to be claimed — the wizard cannot edit it yet.":""},lockNote:{className:()=>n()?"setup__locknote":"setup__locknote hidden"},routeErr:{textContent:()=>this.svc.humanizedRoute().join(`
`)},rosterErr:{textContent:()=>this.svc.humanizedRoster().join(`
`)},cancel:{className:()=>t?"setup__cancel":"setup__cancel hidden",onclick:()=>e&&this.router.navigate("/round",{query:{token:e}})},addPlayer:{onclick:()=>this.svc.addPlayer()},addMe:{className:()=>l()?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>`+ Add me (${r()?.displayName??""})`,onclick:()=>{const c=r();c&&this.svc.addMe({id:c.id,displayName:c.displayName,handicapIndex:c.handicapIndex,gender:c.gender})}},addFriends:{className:()=>this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>this.pickerOpen.get()?"− From friends":"+ From friends",onclick:()=>this.pickerOpen.set(!this.pickerOpen.get())},friendPicker:{className:()=>this.pickerOpen.get()&&this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__friends":"setup__friends hidden"},addTeam:{onclick:()=>this.svc.addTeam()},splitGroups:{className:()=>this.svc.groupsEnabled()?"setup__add hidden":"setup__add",onclick:()=>this.svc.splitIntoGroups()},addGroup:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.addGroup()},clearGroups:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.clearGroups()},groupNote:{textContent:()=>{const c=this.svc.ungroupedPlayers();return c.length===0?"":`${c.map(p=>p.name.trim()||"A player").join(", ")} ${c.length>1?"aren't":"isn't"} in a group yet — every player needs one.`}},groupWarn:{textContent:()=>[...this.svc.crossGroupTeamWarnings(),...this.svc.diagnosticsForGroups().map(c=>c.message)].join(`
`)},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const c=this.svc.playersInNoFormat();return c.length===0?"":`Heads up: ${c.map(p=>p.name.trim()||"A player").join(", ")} ${c.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.humanizedGeneral(),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?t?"Saving…":"Creating…":t?"Save changes":"Create round",onclick:async()=>{const c=await this.svc.submit();c.ok&&this.router.navigate("/round",{query:{token:c.token}})}}});this.$each(this.ref(d,"presets"),()=>Hi,(c,m,p)=>this.wireEl(_('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(c),className:()=>this.svc.preset.get()===c?"on":"",disabled:()=>n(),onclick:()=>{n()||this.svc.setPreset(c)}}},p),c=>c);const u=c=>this.track(c);return this.mountSelect(this.ref(d,"course"),u,{value:this.bound(u,()=>this.svc.courseId.get(),c=>{c&&c!==this.svc.courseId.get()&&this.svc.selectCourse(c)}),options:{get:()=>{const c=[];let m="";for(const p of this.svc.courses.get())p.clubName!==m&&(c.push({value:`__club:${p.clubName}`,label:p.clubName,disabled:!0}),m=p.clubName),c.push({value:p.id,label:p.name});return c}},placeholder:"Select a course",disabled:{get:()=>n()}}),this.mountSelect(this.ref(d,"startHole"),u,{value:this.bound(u,()=>String(this.svc.startHole.get()),c=>this.svc.startHole.set(Number(c))),options:{get:()=>this.svc.startHoleOptions().map(c=>({value:String(c),label:String(c)}))},disabled:{get:()=>n()}}),this.$each(this.ref(d,"friendRows"),()=>He(this.friends.friends.get().filter(c=>!this.svc.hasPlayer(c.id)),"frecency"),(c,m,p)=>this.wireEl(qi,{row:{onclick:()=>this.svc.addFriend({id:c.id,displayName:c.displayName,handicapIndex:c.handicapIndex,gender:c.gender})},name:()=>c.displayName,username:()=>`@${c.username}`,hcp:()=>c.handicapIndex===null?"–":c.handicapIndex.toFixed(1)},p),c=>c.id),this.$each(this.ref(d,"players"),this.svc.players,(c,m,p)=>this.playerRow(c.key,p),c=>c.key),this.$each(this.ref(d,"teams"),this.svc.teams,(c,m,p)=>this.teamCard(c.key,p),c=>c.key),this.$each(this.ref(d,"groups"),this.svc.groups,(c,m,p)=>this.groupCard(c.key,p),c=>c.key),this.$each(this.ref(d,"formats"),this.svc.formatSlots,(c,m,p)=>this.formatCard(c.key,m,p),c=>c.key),d}mountSelect(e,t,s){const n=new q(s);n.mount(e),t(()=>n.destroy())}bound(e,t,s){const n=new h(t());return e($(()=>n.set(t()))),e($(()=>{const r=n.get();queueMicrotask(()=>s(r))})),n}eachInto(e,t,s,n,r){const l=new Map,d=new Map;t(()=>{for(const u of d.values())u.forEach(c=>c());d.clear()}),t($(()=>{const u=s(),c=new Map;for(const[p,g]of u.entries()){const x=r(g,p);if(l.has(x))c.set(x,l.get(x));else{const v=[];c.set(x,n(g,p,k=>v.push(k))),d.set(x,v)}}for(const[p,g]of l)c.has(p)||(g.remove(),d.get(p)?.forEach(x=>x()),d.delete(p));let m=e.firstChild;for(const p of c.values())p===m?m=m.nextSibling:e.insertBefore(p,m);l.clear();for(const[p,g]of c)l.set(p,g)}))}formatCard(e,t,s){const n=()=>this.svc.slotByKey(e),r=()=>n()?.formatId??"",l=this.wireEl(Fi,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(r())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:u=>this.svc.setSlotAllowance(e,u.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(r())?"applied to each side member’s ball":"of each player’s course handicap"},bonusGroup:{hidden:()=>!this.svc.formatTakesBonusRule(r())},bonusGross:{className:()=>(n()?.bonusRule??"gross")==="gross"?"on":"",onclick:()=>this.svc.setSlotBonusRule(e,"gross")},bonusNet:{className:()=>n()?.bonusRule==="net"?"on":"",onclick:()=>this.svc.setSlotBonusRule(e,"net")},err:{textContent:()=>this.svc.humanizedForFormat(t).join(" · ")}},s);this.mountSelect(this.ref(l,"format"),s,{value:this.bound(s,()=>r(),u=>{u&&u!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,u)}),options:{get:()=>this.svc.catalog.descriptors.get().map(u=>({value:u.id,label:this.svc.catalog.labelOf(u)??u.label}))}});const d=()=>{const u=this.svc.isSideFormat(r()),c=[];u||c.push(...this.svc.players.get().map(m=>({kind:"player",subKey:m.key})));for(const m of this.svc.teams.get())this.svc.teamKindFitsFormat(r(),m.kind)&&c.push({kind:"team",subKey:m.key});return c};return this.eachInto(this.ref(l,"subjectRows"),s,d,(u,c,m)=>this.subjectRow(e,u.kind,u.subKey,m),u=>`${u.kind}${u.subKey}`),l}subjectRow(e,t,s,n){const r=()=>{if(t==="player")return this.svc.players.get().find(c=>c.key===s)?.name?.trim()||"Player";const u=this.svc.teamByKey(s);return u?`${this.svc.teamLabel(u)} (${u.kind==="multi_ball"?"side":"team"})`:"Team"},l=()=>t==="player"?this.svc.subjectPlayerIn(e,s):this.svc.subjectTeamIn(e,s),d=u=>t==="player"?this.svc.setSubjectPlayer(e,s,u):this.svc.setSubjectTeam(e,s,u);return this.wireEl(dt,{chk:{checked:()=>l(),onchange:u=>d(u.target.checked)},name:{textContent:()=>r()}},n)}groupCard(e,t){const s=this.wireEl(Gi,{remove:{onclick:()=>this.svc.removeGroup(e)},groupName:{textContent:()=>{const n=this.svc.groupByKey(e);return n?this.svc.groupLabel(n):"Group"}},time:{value:this.svc.groupByKey(e)?.startTime??"",oninput:n=>this.svc.setGroupStartTime(e,n.target.value)},meta:{textContent:()=>{const n=this.svc.groupSize(e);return n===0?"Tick the players who walk with this group.":`${n} player${n===1?"":"s"}`}}},t);return this.mountSelect(this.ref(s,"hole"),t,{value:this.bound(t,()=>{const n=this.svc.groupByKey(e)?.startHole;return n==null?"":String(n)},n=>this.svc.setGroupStartHole(e,n===""?null:Number(n))),options:{get:()=>[{value:"",label:"First hole"},...this.svc.startHoleOptions().map(n=>({value:String(n),label:`Hole ${n}`}))]}}),this.eachInto(this.ref(s,"memberRows"),t,()=>this.svc.players.get(),(n,r,l)=>this.groupMemberRow(e,n.key,l),n=>n.key),s}groupMemberRow(e,t,s){return this.wireEl(dt,{chk:{checked:()=>this.svc.groupMemberIn(e,t),onchange:n=>this.svc.setGroupMember(e,t,n.target.checked)},name:{textContent:()=>this.svc.players.get().find(n=>n.key===t)?.name?.trim()||"Player"}},s)}teamCard(e,t){const s=()=>this.svc.teamKindOf(e)==="multi_ball",n=this.wireEl(Bi,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const r=this.svc.teamByKey(e);return r?this.svc.teamLabel(r):"Team"}},compGroup:{hidden:()=>s()},membersLabel:{textContent:()=>s()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const r=this.svc.teamSize(e);if(r===0)return s()?"Tick at least 2 members — a side needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(r<2)return"Add one more member — a team needs at least 2.";if(s())return`${r} balls · a side (scored together by a side format)`;const l=this.svc.teamBallCh(e);return l===null?`${r} players`:`${r} players · plays off CH ${l}`}}},t);return this.mountSelect(this.ref(n,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),r=>this.svc.setTeamKind(e,r==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"One combined ball"},{value:"multi_ball",label:"Separate balls (a side)"}]}}),this.mountSelect(this.ref(n,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",r=>this.svc.setTeamFormation(e,r)),options:{get:()=>this.svc.formations.map(r=>({value:r,label:r[0].toUpperCase()+r.slice(1)}))}}),this.eachInto(this.ref(n,"memberRows"),t,()=>{const r=this.svc.players.get().map(l=>({kind:"player",mKey:l.key}));if(s())for(const l of this.svc.eligibleNestedTeams(e))r.push({kind:"team",mKey:l.key});return r},(r,l,d)=>r.kind==="player"?this.teamMemberRow(e,r.mKey,d):this.teamNestedRow(e,r.mKey,d),r=>`${r.kind}${r.mKey}`),n}teamNestedRow(e,t,s){const n=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(ct,{chk:{checked:()=>n(),disabled:()=>!n()&&this.svc.teamAtMaxSize(e),onchange:r=>this.svc.setTeamMemberTeam(e,t,r.target.checked)},name:{textContent:()=>{const r=this.svc.teamByKey(t);return r?`${this.svc.teamLabel(r)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},s)}teamMemberRow(e,t,s){const n=()=>this.svc.players.get().find(l=>l.key===t)??null,r=()=>this.svc.teamMemberIn(e,t);return this.wireEl(ct,{chk:{checked:()=>r(),disabled:()=>!r()&&this.svc.teamAtMaxSize(e),onchange:l=>this.svc.setTeamMember(e,t,l.target.checked)},name:{textContent:()=>n()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!r()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:l=>this.svc.setTeamPct(e,t,l.target.value)}},s)}playerRow(e,t){const s=()=>this.svc.players.get().find(l=>l.key===e)??null,n=()=>this.svc.players.get().findIndex(l=>l.key===e),r=this.wireEl(Ai,{name:{value:s()?.name??"",readOnly:()=>!!s()?.playerId,oninput:l=>this.svc.patchPlayer(e,{name:l.target.value})},index:{value:s()?.handicapIndex??"",oninput:l=>this.svc.patchPlayer(e,{handicapIndex:l.target.value})},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const l=s();if(!l)return"";const d=this.svc.derivedCH(l);if(!d)return"";const u=d.rating;return`Course handicap ${d.ch}  ·  ${l.handicapIndex} × ${u.slope}/113 + (${u.courseRating} − ${u.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(n()).map(l=>l.message).join(" · ")}},t);return this.mountSelect(this.ref(r,"gender"),t,{value:this.bound(t,()=>s()?.gender??"M",l=>this.svc.patchPlayer(e,{gender:l})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]},disabled:{get:()=>s()?.genderKnown===!0}}),this.mountSelect(this.ref(r,"tee"),t,{value:this.bound(t,()=>s()?.teeId??"",l=>this.svc.patchPlayer(e,{teeId:l})),options:{get:()=>this.svc.tees.get().map(l=>({value:l.id,label:l.name}))},placeholder:"Tee"}),r}}function Lt(i,e){return f({method:"POST",url:`${P}/auth/login`,body:{username:i,password:e}})}function Vi(){return f({method:"GET",url:`${P}/auth/me`})}function Ui(){return f({method:"POST",url:`${P}/auth/logout`,body:{}})}const Ie="Something went wrong on our end. Try again in a moment.";function Wi(i,e){const t=(i.details??[]).map(n=>n.path),s=n=>t.some(r=>r===`/${n}`);return s("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":s("username")?"Enter your username.":s("displayName")?"Enter a display name.":s("handicapIndex")?"Handicap index must be a number (or leave it empty).":s("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function ut(i,e){if(i instanceof M)switch(i.status){case 400:return Wi(i,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":Ie;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return i.status>=500?Ie:"That request could not be completed."}return i instanceof Error&&i.message==="Request timeout"?"That took too long. Check your connection and try again.":i instanceof Error?"Cannot reach the server. Check your connection and try again.":Ie}const Qi=_(`
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
                <div class="login__clubrow">
                    <span>Home club (optional)</span>
                    <div bind="club" class="login__club"></div>
                </div>
                <div class="login__genderrow">
                    <span>Gender (optional)</span>
                    <div bind="gender" class="login__genderseg"></div>
                </div>
            </div>
            <button type="submit" bind="submit">Sign in</button>
        </form>
        <button bind="toggle" class="login__toggle" type="button"></button>
    </div>
`);class Yi extends I{static styles=`
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
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 2.4rem;
                    letter-spacing: -0.02em;
                    color: ${o("text")};
                }

                & p {
                    margin: ${a("xs")} 0 0;
                    color: ${o("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .error {
                display: none;
                padding: ${a("sm")} ${a("md")};
                margin-bottom: ${a("md")};
                color: ${o("error")};
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

                & .login__register {
                    display: flex;
                    flex-direction: column;
                    gap: ${a("md")};
                    &.hidden { display: none; }
                }

                & .login__genderrow,
                & .login__clubrow {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: ${a("md")};
                    font-size: 0.85rem;
                    color: ${o("text-muted")};
                }

                /* Club names are long ("Linköpings Golfklubb") and naming the
                   club IS the point of the field, so it gets its own line
                   rather than sharing one with the label and ellipsing. */
                & .login__clubrow {
                    flex-direction: column;
                    align-items: stretch;
                    gap: ${a("xs")};
                }

                /* min-width:0 lets the flex child shrink instead of forcing the
                   trigger's own min-width, so long club names get the row's
                   full remaining space rather than ellipsing early. */
                & .login__club {
                    flex: 1;
                    min-width: 0;
                    & .ui-select { display: block; width: 100%; }
                    & .ui-select__trigger { min-width: 0; }
                }

                & .login__genderseg {
                    display: flex;
                    gap: ${a("xs")};

                    & button {
                        padding: ${a("sm")} ${a("lg")};
                        font-size: 0.9rem;
                        font-weight: 700;
                        ${w()}
                        &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                    }
                }

                /* Direct child only: the submit button. The gender segment and
                   the home-club select bring their own button styling, and a
                   descendant selector here would paint both solid primary. */
                & > button {
                    padding: ${a("md")} ${a("lg")};
                    font-size: 1rem;
                    font-weight: 700;
                    ${w()}
                    background: ${o("primary")};
                    color: ${o("primary-text")};
                    border: none;
                    &:hover { background: ${o("primary")}; }
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
                color: ${o("text-muted")};
                text-decoration: underline;
                cursor: pointer;
            }
        }
    `;auth=this.inject(R);router=this.inject(N);nextQ=this.router.query("next");mode=new h("login");busy=new h(!1);formError=new h("");username="";password="";displayName="";hcp="";gender=new h(null);clubs=new h([]);homeClubId=new h("");clubsRequested=!1;async loadClubs(){if(!this.clubsRequested){this.clubsRequested=!0;try{this.clubs.set(await b.setup.clubs())}catch{}}}destination(e){const t=this.nextQ.get();return t&&t.startsWith("/")?t:e}async submit(){if(this.formError.set(""),this.mode.get()==="login"){if(!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const s=await Lt(this.username.trim(),this.password);this.auth.currentUser.set(s),this.auth.error.set(null),this.router.navigate(this.destination("/"),!0)}catch(s){this.formError.set(ut(s,"login"))}finally{this.busy.set(!1)}return}const e=this.hcp.trim().replace(",","."),t=e===""?null:Number.parseFloat(e);if(t!==null&&!Number.isFinite(t)){this.formError.set("Handicap index must be a number (or leave it empty).");return}if(this.password.length<8){this.formError.set("Password must be at least 8 characters.");return}if(!this.username.trim()||!this.displayName.trim()){this.formError.set("Username and display name are required.");return}this.busy.set(!0);try{const s=await b.players.register({username:this.username.trim(),password:this.password,displayName:this.displayName.trim(),handicapIndex:t,gender:this.gender.get(),homeClubId:this.homeClubId.get()||null});this.auth.currentUser.set({id:s.id,username:s.username}),this.router.navigate(this.destination("/"),!0)}catch(s){this.formError.set(ut(s,"register"))}finally{this.busy.set(!1)}}render(){const e=()=>this.mode.get()==="register",t=()=>this.auth.loading.get()||this.busy.get(),s=this.wire(Qi,{root:{inert:()=>t()},error:{className:()=>this.formError.get()?"error show":"error",textContent:()=>this.formError.get()},form:{onsubmit:async l=>{l.preventDefault(),await this.submit()}},username:{oninput:l=>{this.username=l.target.value}},password:{autocomplete:()=>e()?"new-password":"current-password",oninput:l=>{this.password=l.target.value}},registerFields:{className:()=>e()?"login__register":"login__register hidden"},displayName:{oninput:l=>{this.displayName=l.target.value}},hcp:{oninput:l=>{this.hcp=l.target.value}},submit:{textContent:()=>t()?e()?"Creating account…":"Signing in…":e()?"Create account":"Sign in"},toggle:{textContent:()=>e()?"Have an account? Sign in":"New here? Create an account",onclick:()=>{this.formError.set(""),this.auth.error.set(null);const l=!e();this.mode.set(l?"register":"login"),l&&this.loadClubs()}}}),n=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(s,"gender"),()=>n,(l,d,u)=>this.wireEl(_('<button bind="b" type="button"></button>'),{b:{textContent:()=>l.label,className:()=>this.gender.get()===l.value?"on":"",onclick:()=>this.gender.set(l.value)}},u),l=>l.label);const r=new q({value:this.homeClubId,options:{get:()=>[{value:"",label:"No home club"},...this.clubs.get().map(l=>({value:l.id,label:l.name}))]},placeholder:"No home club"});return r.mount(this.ref(s,"club")),this.track(()=>r.destroy()),s}}const Xi=_(`
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
`),Ji=_(`
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
`),Zi=_(`
    <div class="friend-row">
        <span bind="initials" class="friend-row__badge"></span>
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="subtitle" class="friend-row__subtitle"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="remove" class="friend-row__remove" type="button" aria-label="Remove friend">✕</button>
    </div>
`);function ht(i){return i.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0].toUpperCase()).join("")}class er extends I{static styles=`
        .friends {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .friends__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${o("text-muted")};

                &.hidden { display: none; }

                & button {
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    ${w()}
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                }
            }

            & .friends__body.hidden { display: none; }

            & .friends__head {
                margin-bottom: ${a("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${o("text-muted")}; font-size: 0.9rem; }
            }

            & .friends__section {
                margin-bottom: ${a("xl")};
                & h2 {
                    margin: 0 0 ${a("sm")};
                    font-family: ${o("font-display")};
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
                border: 1px solid ${o("border")}; border-radius: ${o("radius-pill")};
                overflow: hidden;
                &.hidden { display: none; }

                & .friends__sortbtn {
                    ${w()}
                    font-family: inherit; font-size: 0.78rem; font-weight: 700;
                    padding: ${a("xs")} ${a("md")};
                    background: transparent; color: ${o("text-muted")};
                    border: none; border-radius: 0;

                    &[aria-pressed='true'] {
                        background: ${o("primary")}; color: ${o("primary-text")};
                    }
                }
            }

            & .friends__search {
                width: 100%;
                padding: ${a("md")} ${a("lg")};
                font-size: 1rem;
                ${H()}
            }

            & .friends__hint {
                margin: ${a("sm")} 0 0; font-size: 0.82rem; color: ${o("text-muted")};
                &:empty { display: none; }
            }
            & .friends__err {
                margin: ${a("sm")} 0 0; font-size: 0.85rem; color: ${o("error")};
                &:empty { display: none; }
            }

            & .friends__empty {
                color: ${o("text-muted")}; font-size: 0.9rem; padding: ${a("md")} 0;
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
                ${T()}

                & .friend-row__badge {
                    display: grid; place-items: center;
                    width: 40px; height: 40px; border-radius: 50%;
                    background: ${o("primary")}; color: ${o("primary-text")};
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
                    color: ${o("text-muted")}; font-size: 0.8rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .friend-row__subtitle:empty { display: none; }
                & .friend-row__hcp {
                    font-weight: 700; flex-shrink: 0;
                    color: ${o("accent")}; background: ${o("accent-soft")};
                    border-radius: ${o("radius-pill")};
                    padding: 2px 10px; font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                }
                & .friend-row__add {
                    flex-shrink: 0; padding: ${a("sm")} ${a("lg")};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
                    ${w()}
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                    &.hidden { display: none; }
                    &:disabled { opacity: 0.5; cursor: default; }
                }
                & .friend-row__added {
                    flex-shrink: 0; font-size: 0.8rem; font-weight: 700;
                    color: ${o("accent")};
                    &.hidden { display: none; }
                }
                & .friend-row__remove {
                    width: 34px; height: 34px; flex-shrink: 0; ${w()}
                    font-size: 0.9rem; color: ${o("text-muted")};
                }
            }
        }
    `;svc=this.inject(we);auth=this.inject(R);router=this.inject(N);render(){const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.load();const t=this.wire(Xi,{anon:{className:()=>e()?"friends__anon hidden":"friends__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},body:{className:()=>e()?"friends__body":"friends__body hidden"},search:{value:()=>this.svc.query.get(),oninput:n=>this.svc.setQuery(n.target.value)},searchHint:{textContent:()=>{const n=this.svc.query.get().trim();return n.length>0&&!at(n)?"Type at least 2 characters.":this.svc.searching.get()?"Searching…":""}},searchErr:{textContent:()=>this.svc.searchError.get()?.message??""},resultsEmpty:{className:()=>{const n=this.svc.query.get().trim();return at(n)&&!this.svc.searching.get()&&this.svc.searchError.get()===null&&this.svc.resultsFor.get()===n&&this.svc.results.get().length===0?"friends__empty":"friends__empty hidden"}},friendsEmpty:{className:()=>this.svc.loaded.get()&&this.svc.friends.get().length===0?"friends__empty":"friends__empty hidden"},sortToggle:{className:()=>this.svc.friends.get().length>0?"friends__sort":"friends__sort hidden"},sortFrecency:{"aria-pressed":()=>String(this.svc.sortMode.get()==="frecency"),onclick:()=>this.svc.setSortMode("frecency")},sortAlpha:{"aria-pressed":()=>String(this.svc.sortMode.get()==="alpha"),onclick:()=>this.svc.setSortMode("alpha")}});this.$each(this.ref(t,"results"),this.svc.results,(n,r,l)=>this.wireEl(Ji,{initials:()=>ht(n.displayName),name:()=>n.displayName,username:()=>n.homeClubName?`@${n.username} · ${n.homeClubName}`:`@${n.username}`,hcp:()=>n.handicapIndex===null?"–":n.handicapIndex.toFixed(1),add:{className:()=>this.isFriendNow(n.id)?"friend-row__add hidden":"friend-row__add",disabled:()=>this.svc.mutating.get(),onclick:()=>{const d=this.svc.results.get().find(u=>u.id===n.id);d&&!d.isFriend&&this.svc.add(d)}},added:{className:()=>this.isFriendNow(n.id)?"friend-row__added":"friend-row__added hidden"}},l),n=>n.id);const s=new Date().toISOString();return this.$each(this.ref(t,"friends"),()=>He(this.svc.friends.get(),this.svc.sortMode.get()),(n,r,l)=>this.wireEl(Zi,{initials:()=>ht(n.displayName),name:()=>n.displayName,subtitle:()=>{const d=this.svc.friends.get().find(u=>u.id===n.id)??n;return zi(d,s)},hcp:()=>n.handicapIndex===null?"–":n.handicapIndex.toFixed(1),remove:{disabled:()=>this.svc.mutating.get(),onclick:()=>{this.svc.remove(n.id)}}},l),n=>n.id),t}isFriendNow(e){return this.svc.results.get().find(t=>t.id===e)?.isFriend===!0}}const tr=_(`
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
                <span class="profile__label">Home club</span>
                <div bind="club" class="profile__club"></div>
                <p class="profile__hint">Shown next to your name when someone searches for you — how they tell you from the other John Smith.</p>
                <p bind="clubErr" class="profile__err"></p>
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
`),sr=_(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`);class nr extends I{static styles=`
        .profile {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .profile__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${o("text-muted")};

                &.hidden { display: none; }

                & button {
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    ${w()}
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                }
            }

            & .profile__body.hidden { display: none; }

            & .profile__head {
                margin-bottom: ${a("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${o("text-muted")}; font-size: 0.9rem; }
            }

            & .profile__card {
                padding: ${a("lg")};
                margin-bottom: ${a("xl")};
                ${T()}

                & .profile__label {
                    font-weight: 700; font-size: 0.8rem;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    color: ${o("text-muted")};
                }
                & .profile__hcp-row {
                    display: flex; align-items: center; gap: ${a("md")};
                    margin-top: ${a("sm")};
                }
                & .profile__hcp {
                    font-family: ${o("font-display")};
                    font-weight: 700; font-size: 2rem;
                    font-variant-numeric: tabular-nums;
                    color: ${o("text")};
                }
                & .profile__edit {
                    display: flex; gap: ${a("sm")}; flex: 1; justify-content: flex-end;
                    & input { width: 90px; padding: ${a("md")}; font-size: 1rem; text-align: center; ${H()} }
                    & button {
                        padding: ${a("md")} ${a("lg")}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700; ${w()}
                        background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
                & .profile__hint { margin: ${a("sm")} 0 0; font-size: 0.8rem; color: ${o("text-muted")}; }
                & .profile__err {
                    margin: ${a("sm")} 0 0; font-size: 0.85rem; color: ${o("error")};
                    &:empty { display: none; }
                }

                & .profile__club {
                    margin-top: ${a("sm")};
                    & .ui-select { display: block; width: 100%; }
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
                        &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
            }

            & .profile__section {
                & h2 {
                    margin: 0 0 ${a("sm")};
                    font-family: ${o("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .profile__empty {
                color: ${o("text-muted")}; font-size: 0.9rem; padding: ${a("md")} 0;
                &.hidden { display: none; }
            }

            & .profile__history { display: flex; flex-direction: column; gap: ${a("sm")}; }

            & .hcp-entry {
                display: flex; align-items: baseline; gap: ${a("md")};
                padding: ${a("md")} ${a("lg")};
                ${T()}

                & .hcp-entry__index {
                    font-weight: 700; font-size: 1.05rem;
                    font-variant-numeric: tabular-nums;
                    width: 52px;
                }
                & .hcp-entry__source {
                    font-size: 0.7rem; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    border-radius: ${o("radius-pill")};
                    padding: 2px 10px;
                    background: ${o("accent-soft")}; color: ${o("accent")};
                }
                & .hcp-entry__date {
                    margin-left: auto;
                    color: ${o("text-muted")}; font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                }
            }

            & .profile__signout {
                display: block;
                margin: ${a("2xl")} auto 0;
                padding: ${a("sm")} ${a("lg")};
                background: none; border: none; font-family: inherit;
                font-size: 0.85rem; font-weight: 600;
                color: ${o("text-muted")};
                text-decoration: underline; cursor: pointer;
            }
        }
    `;svc=this.inject(De);friends=this.inject(we);auth=this.inject(R);router=this.inject(N);indexDraft=new h("");localErr=new h("");render(){this.auth.currentUser.get()&&this.svc.load();const e=()=>this.auth.currentUser.get()!==null,t=this.wire(tr,{anon:{className:()=>e()?"profile__anon hidden":"profile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/profile"}})},body:{className:()=>e()?"profile__body":"profile__body hidden"},name:()=>this.svc.player.get()?.displayName??"…",username:()=>{const l=this.svc.player.get();return l?`@${l.username}`:""},hcp:()=>{const l=this.svc.player.get()?.handicapIndex;return l==null?"–":l.toFixed(1)},index:{value:()=>this.indexDraft.get(),oninput:l=>this.indexDraft.set(l.target.value)},save:{disabled:()=>this.svc.saving.get()||this.indexDraft.get().trim()==="",textContent:()=>this.svc.saving.get()?"Saving…":"Save"},form:{onsubmit:async l=>{l.preventDefault(),this.localErr.set("");const d=this.indexDraft.get().trim().replace(",","."),u=Number.parseFloat(d);if(!Number.isFinite(u)||u<-10||u>54){this.localErr.set("Enter an index between -10 and 54.");return}await this.svc.saveIndex(u)&&this.indexDraft.set("")}},saveErr:{textContent:()=>this.localErr.get()||this.svc.saveError.get()?.message||""},genderErr:{textContent:()=>this.svc.saveError.get()?.message||""},clubErr:{textContent:()=>this.svc.saveError.get()?.message||""},historyEmpty:{className:()=>this.svc.history.get().length===0?"profile__empty":"profile__empty hidden"},signout:{onclick:async()=>{await this.auth.logout(),this.svc.clear(),this.friends.clear(),this.router.navigate("/")}}});this.$each(this.ref(t,"history"),this.svc.history,(l,d,u)=>this.wireEl(sr,{index:()=>l.handicapIndex.toFixed(1),source:()=>l.source,date:()=>l.effectiveDate},u),l=>l.id);const s=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(t,"gender"),()=>s,(l,d,u)=>this.wireEl(_('<button bind="b" type="button"></button>'),{b:{textContent:()=>l.label,className:()=>this.svc.player.get()?.gender===l.value?"on":"",disabled:()=>this.svc.saving.get(),onclick:()=>{this.svc.saveGender(l.value)}}},u),l=>l.label);const n=new h(this.svc.player.get()?.homeClubId??"");this.track($(()=>n.set(this.svc.player.get()?.homeClubId??""))),this.track($(()=>{const l=n.get();queueMicrotask(()=>{l!==(this.svc.player.get()?.homeClubId??"")&&this.svc.saveHomeClub(l===""?null:l)})}));const r=new q({value:n,options:{get:()=>[{value:"",label:"No home club"},...this.svc.clubs.get().map(l=>({value:l.id,label:l.name}))]},placeholder:"No home club",disabled:{get:()=>this.svc.saving.get()}});return r.mount(this.ref(t,"club")),this.track(()=>r.destroy()),t}}function ir(i,e){return i?e!==null&&i.ownerPlayerId===e?!0:i.rounds.some(t=>typeof t.shareToken=="string"):!1}class te{list=new h([]);listLoading=new h(!1);listError=new h(null);listLoaded=new h(!1);detail=new h(null);detailId=new h(null);detailLoading=new h(!1);detailError=new h(null);participants=new h([]);board=new h(null);boardRefusal=new h(null);boardLoading=new h(!1);results=new h(null);resultsRefusal=new h(null);mutating=new h(!1);mutateError=new h(null);async loadList(e=!1){if(!e&&(this.listLoaded.get()||this.listLoading.get()))return;const t=await C(this.listLoading,this.listError,()=>b.competitions.list());t&&(this.list.set(t),this.listLoaded.set(!0))}async loadDetail(e,t=!1){if(!t&&this.detailId.get()===e&&this.detail.get()!==null&&!this.detailLoading.get()||this.detailLoading.get()&&this.detailId.get()===e)return;this.detailId.set(e);const s=await C(this.detailLoading,this.detailError,()=>Promise.all([b.competitions.get({id:e}),b.competitions.participants({competitionId:e})]));if(!s)return;const[n,r]=s;this.detailId.get()===e&&(this.detail.set(n),this.participants.set(r),await this.loadBoard(e),n.lifecycle==="finalized"&&await this.loadResults(e))}async loadBoard(e){this.boardLoading.set(!0);try{const t=await b.competitions.leaderboard({id:e});t.ok?(this.board.set(t.value),this.boardRefusal.set(null)):(this.board.set(null),this.boardRefusal.set(t.refusal.message))}catch{this.board.set(null),this.boardRefusal.set(null)}finally{this.boardLoading.set(!1)}}async loadResults(e){try{const t=await b.competitions.results({id:e});t.ok?(this.results.set(t.value),this.resultsRefusal.set(null)):(this.results.set(null),this.resultsRefusal.set(t.refusal.message))}catch{this.results.set(null)}}async create(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await b.competitions.create({name:e});return this.list.set([t,...this.list.get()]),t}catch(t){return this.mutateError.set(Z(t)),null}finally{this.mutating.set(!1)}}transition(e,t){return this.mutate(()=>b.competitions.transition({id:e,to:t}),()=>this.loadDetail(e,!0))}updateConfig(e){return this.mutate(()=>b.competitions.update(e),()=>this.loadDetail(e.id,!0))}async addPlayer(e,t,s){return this.rosterMutate(e,()=>b.competitions.addParticipant({competitionId:e,playerId:t,category:s}))}async addGuest(e,t,s){this.mutating.set(!0),this.mutateError.set(null);let n;try{n=(await b.guestPlayers.create(t)).id}catch(r){return this.mutating.set(!1),this.mutateError.set(Z(r)),Z(r)}return this.mutating.set(!1),this.rosterMutate(e,()=>b.competitions.addParticipant({competitionId:e,guestPlayerId:n,category:s}))}removeParticipant(e,t){return this.rosterMutate(e,()=>b.competitions.removeParticipant({participantId:t}))}withdrawParticipant(e,t){return this.rosterMutate(e,()=>b.competitions.withdrawParticipant({participantId:t}))}async createRound(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await b.competitions.createRound(e);if(t.ok)return await this.loadDetail(e.id,!0),{ok:!0,shareToken:t.shareToken};const s="refusal"in t?t.refusal.message:t.diagnostics.map(n=>n.message).join(" · ");return this.mutateError.set(s),{ok:!1,message:s}}catch(t){const s=Z(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}async applyCut(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await b.competitions.applyCut({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const s=Z(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}async finalize(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await b.competitions.finalize({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const s=Z(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}clear(){this.list.set([]),this.listLoaded.set(!1),this.detail.set(null),this.detailId.set(null),this.participants.set([]),this.board.set(null),this.boardRefusal.set(null),this.results.set(null),this.resultsRefusal.set(null),this.listError.set(null),this.detailError.set(null),this.mutateError.set(null)}async mutate(e,t){this.mutating.set(!0),this.mutateError.set(null);try{const s=await e();return s.ok?(await t(),null):(this.mutateError.set(s.refusal.message),s.refusal.message)}catch(s){const n=Z(s);return this.mutateError.set(n),n}finally{this.mutating.set(!1)}}rosterMutate(e,t){return this.mutate(t,async()=>{const s=await b.competitions.participants({competitionId:e});this.participants.set(s)})}}function Z(i){return i&&typeof i=="object"&&"message"in i&&typeof i.message=="string"?i.message:"Something went wrong. Try again."}function Dt(i){switch(i){case"draft":return"Draft";case"setup":return"Setup";case"active":return"Live";case"finalized":return"Finalized"}}function Ht(i){return`comp-chip comp-chip--${i}`}function Ce(i){switch(i){case"draft":return{to:"setup",label:"Open setup"};case"setup":return{to:"active",label:"Start competition"};default:return null}}function Pe(i){return i==="draft"||i==="setup"}function rr(i){return i==="setup"||i==="active"}const or=_(`
    <div class="comps">
        <header class="comps__head">
            <h1>Competitions</h1>
            <p>Multi-round events with an aggregated board.</p>
        </header>

        <div bind="anon" class="comps__anon">
            <p>Competitions live behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="body" class="comps__body">
            <form bind="createForm" class="comps__create">
                <input bind="nameInput" placeholder="New competition name" />
                <button bind="createBtn" type="submit">Create</button>
            </form>
            <p bind="createErr" class="comps__err"></p>

            <div bind="loading" class="comps__loading">Loading…</div>
            <div bind="empty" class="comps__empty">No competitions yet — name one above to get started.</div>
            <div bind="list" class="comps__list"></div>
        </div>
    </div>
`),ar=_(`
    <button bind="row" type="button" class="comp-row">
        <span bind="name" class="comp-row__name"></span>
        <span bind="chip"></span>
    </button>
`);class lr extends I{static styles=`
        .comps {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .comps__head {
                margin-bottom: ${a("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${o("text-muted")}; font-size: 0.9rem; }
            }

            & .comps__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${o("text-muted")};
                &.hidden { display: none; }
                & button {
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    ${w()}
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                }
            }
            & .comps__body.hidden { display: none; }

            & .comps__create {
                display: flex;
                gap: ${a("sm")};
                margin-bottom: ${a("md")};
                & input { flex: 1; padding: ${a("md")}; font-size: 1rem; ${H()} }
                & button {
                    padding: ${a("md")} ${a("lg")};
                    font-family: inherit; font-size: 0.95rem; font-weight: 700;
                    ${w()}
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
            & .comps__err {
                margin: 0 0 ${a("md")}; font-size: 0.85rem; color: ${o("error")};
                &:empty { display: none; }
            }

            & .comps__loading, & .comps__empty {
                color: ${o("text-muted")}; font-size: 0.9rem; padding: ${a("lg")} 0;
                &.hidden { display: none; }
            }

            & .comps__list { display: flex; flex-direction: column; gap: ${a("sm")}; }

            & .comp-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${a("md")};
                padding: ${a("md")} ${a("lg")};
                text-align: left;
                font-family: inherit;
                width: 100%;
                ${T({hover:!0})}
                cursor: pointer;

                & .comp-row__name {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${o("text")};
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            & .comp-chip {
                flex-shrink: 0;
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                border-radius: ${o("radius-pill")};
                padding: 2px 10px;
                background: ${o("surface-sunken")};
                color: ${o("text-muted")};

                &.comp-chip--setup { background: ${o("accent-soft")}; color: ${o("accent")}; }
                &.comp-chip--active { background: ${o("primary")}; color: ${o("primary-text")}; }
                &.comp-chip--finalized { background: ${o("accent")}; color: ${o("topbar-bg")}; }
            }
        }
    `;svc=this.inject(te);auth=this.inject(R);router=this.inject(N);loggedIn=new y(()=>this.auth.currentUser.get()!==null);nameDraft=new h("");render(){this.loggedIn.get()&&this.svc.loadList();const e=this.wire(or,{anon:{className:()=>this.loggedIn.get()?"comps__anon hidden":"comps__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/competitions"}})},body:{className:()=>this.loggedIn.get()?"comps__body":"comps__body hidden"},nameInput:{value:()=>this.nameDraft.get(),oninput:t=>this.nameDraft.set(t.target.value)},createBtn:{disabled:()=>this.svc.mutating.get()||this.nameDraft.get().trim()==="",textContent:()=>this.svc.mutating.get()?"Creating…":"Create"},createForm:{onsubmit:async t=>{t.preventDefault();const s=this.nameDraft.get().trim();if(s==="")return;const n=await this.svc.create(s);n&&(this.nameDraft.set(""),this.router.navigate("/competition",{query:{id:n.id}}))}},createErr:{textContent:()=>this.svc.mutateError.get()??""},loading:{className:()=>this.svc.listLoading.get()&&!this.svc.listLoaded.get()?"comps__loading":"comps__loading hidden"},empty:{className:()=>this.svc.listLoaded.get()&&this.svc.list.get().length===0?"comps__empty":"comps__empty hidden"}});return this.$each(this.ref(e,"list"),this.svc.list,(t,s,n)=>this.wireEl(ar,{row:{onclick:()=>this.router.navigate("/competition",{query:{id:t.id}})},name:()=>t.name,chip:{textContent:()=>Dt(t.lifecycle),className:()=>Ht(t.lifecycle)}},n),t=>t.id),e}}class dr{loading=new h(!1);error=new h(null);descriptors=new h([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await C(this.loading,this.error,()=>b.setup.aggregations());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=St()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:typeof e=="string"?e:""}}function cr(i,e){const t={};for(const s of i){const n=e[s.key];t[s.key]=n!=null?String(n):String(s.default)}return t}function ur(i,e){const t={};for(const s of i){const n=e[s.key]??String(s.default);t[s.key]=s.kind==="integer"?Number.parseInt(n,10)||Number(s.default):n}return t}class ue{competitions=z.get(te);formats=z.get(ce);aggregations=z.get(dr);friends=z.get(we);profile=z.get(De);auth=z.get(R);router=z.get(N);id=this.router.query("id");admin=new y(()=>ir(this.competitions.detail.get(),this.profile.player.get()?.id??null));lifecycle=new y(()=>this.competitions.detail.get()?.lifecycle??"draft");editingSetup=new h(!1);nameDraft=new h("");slotDraft=new h([]);aggregationStrategy=new h("");aggregationValues=new h({});startListDraft=new h("single_group");courseDraft=new h("");teeDraft=new h("");cutAfterDraft=new h("");cutTypeDraft=new h("");cutValueDraft=new h("");formatPickDraft=new h("");guestNameDraft=new h("");guestGenderDraft=new h("M");guestHcpDraft=new h("");roundCourseDraft=new h("");roundDateDraft=new h("");courses=new h([]);tees=new h([]);resultSetIndex=new h(0);cutOutcome=new h(null);cutConfirmOpen=new h(!1);finalizeConfirmOpen=new h(!1);coursesLoaded=!1;enter(){this.editingSetup.set(!1),this.nameDraft.set(""),this.slotDraft.set([]),this.aggregationStrategy.set(""),this.aggregationValues.set({}),this.startListDraft.set("single_group"),this.courseDraft.set(""),this.teeDraft.set(""),this.tees.set([]),this.cutAfterDraft.set(""),this.cutTypeDraft.set(""),this.cutValueDraft.set(""),this.formatPickDraft.set(""),this.guestNameDraft.set(""),this.guestGenderDraft.set("M"),this.guestHcpDraft.set(""),this.roundCourseDraft.set(""),this.roundDateDraft.set(""),this.resultSetIndex.set(0),this.cutOutcome.set(null),this.cutConfirmOpen.set(!1),this.finalizeConfirmOpen.set(!1)}initialize(){this.auth.currentUser.get()&&(this.profile.load(),this.friends.load()),this.formats.load(),this.aggregations.load(),this.loadCourses()}loadCourses(){this.coursesLoaded||(this.coursesLoaded=!0,b.courses.list().then(e=>this.courses.set(e)).catch(()=>{this.coursesLoaded=!1}))}async loadTees(e){if(!e){this.tees.set([]);return}try{this.tees.set(await b.tees.listByCourse({courseId:e}))}catch{this.tees.set([])}}selectAggregation(e){this.applyAggregation(e,{})}applyAggregation(e,t){this.aggregationStrategy.set(e);const s=this.aggregations.byId(e)?.configFields??[];this.aggregationValues.set(cr(s,t))}setAggregationValue(e,t){this.aggregationValues.set({...this.aggregationValues.get(),[e]:t})}seedSetupEditor(){const e=this.competitions.detail.get();if(!e)return;this.nameDraft.set(e.name);const t=e.defaultConfig;this.slotDraft.set((t?.slots??[]).map(l=>l.formatId)),this.startListDraft.set(t?.startList??"single_group"),this.teeDraft.set(t?.fallbackTee?.teeId??"");const s=e.aggregation,n=s?.strategyId??this.aggregations.descriptors.get()[0]?.id??"";this.applyAggregation(n,s?.config??{});const r=e.cutRules;this.cutAfterDraft.set(r?.afterRound!==void 0?String(r.afterRound):""),this.cutTypeDraft.set(r?.cutType??""),this.cutValueDraft.set(r?.cutValue!==void 0?String(r.cutValue):""),this.formatPickDraft.set(this.formats.descriptors.get()[0]?.id??""),this.editingSetup.set(!0)}async saveSetup(){const e=this.id.get()??"",t=this.slotDraft.get().map(x=>({formatId:x})),s=this.teeDraft.get(),n=t.length>0?{slots:t,startList:this.startListDraft.get(),...s?{fallbackTee:{teeId:s}}:{}}:void 0,r=this.aggregationStrategy.get(),l=this.aggregations.byId(r)?.configFields??[],d=r?{strategyId:r,config:ur(l,this.aggregationValues.get())}:void 0,u=Number.parseInt(this.cutAfterDraft.get(),10),c=Number.parseInt(this.cutValueDraft.get(),10),m=this.cutTypeDraft.get(),p=m&&Number.isFinite(u)&&Number.isFinite(c)?{afterRound:u,cutType:m,cutValue:c}:void 0;await this.competitions.updateConfig({id:e,name:this.nameDraft.get().trim()||void 0,...n?{defaultConfig:n}:{},...d?{aggregation:d}:{},...p?{cutRules:p}:{}})===null&&this.editingSetup.set(!1)}async addGuest(){const e=this.guestNameDraft.get().trim();if(!e)return;const t=this.guestHcpDraft.get().trim().replace(",","."),s=t===""?null:Number.parseFloat(t);await this.competitions.addGuest(this.id.get()??"",{displayName:e,gender:this.guestGenderDraft.get(),handicapIndex:Number.isFinite(s)?s:null},null)===null&&(this.guestNameDraft.set(""),this.guestHcpDraft.set(""))}async createRound(){const e=this.roundCourseDraft.get()||this.courseDraft.get(),t=this.roundDateDraft.get();if(!e||!t)return this.competitions.mutateError.set("Pick a course and a date for the round."),null;const s=await this.competitions.createRound({id:this.id.get()??"",courseId:e,playedAt:t});return s.ok?s.shareToken:null}}const hr=_(`
    <section bind="root" class="cd__section cd__setup">
        <div class="cd__section-head">
            <h2>Setup</h2>
            <button bind="toggle" class="cd__linkbtn" type="button"></button>
        </div>
        <div bind="summary" class="cd__summary">
            <div>Formats: <span bind="summaryFormats"></span></div>
            <div>Scoring: <span bind="summaryScoring"></span></div>
        </div>
        <div bind="form" class="cd__form">
            <label class="cd__field"><span>Name</span><input bind="name" /></label>
            <div class="cd__field">
                <span>Format slots</span>
                <div bind="slots" class="cd__slots"></div>
                <div class="cd__addrow">
                    <select bind="formatPick"></select>
                    <button bind="addSlot" type="button">Add slot</button>
                </div>
            </div>
            <label class="cd__field">
                <span>Scoring (aggregation)</span><select bind="aggregationPick"></select>
            </label>
            <p bind="aggregationDescription" class="cd__aggdesc"></p>
            <div bind="aggregationFields" class="cd__aggfields"></div>
            <label class="cd__field">
                <span>Course (for default tee + new rounds)</span><select bind="course"></select>
            </label>
            <label class="cd__field"><span>Default tee</span><select bind="tee"></select></label>
            <label class="cd__field">
                <span>Start list</span>
                <select bind="startList">
                    <option value="single_group">One group</option>
                    <option value="foursomes">Foursomes</option>
                </select>
            </label>
            <div class="cd__field">
                <span>Cut (optional)</span>
                <div class="cd__cutrow">
                    <input bind="cutAfter" inputmode="numeric" placeholder="after round" />
                    <select bind="cutType">
                        <option value="">no cut</option>
                        <option value="top_n">Top N</option>
                        <option value="top_percent">Top %</option>
                        <option value="within_strokes">Within strokes</option>
                    </select>
                    <input bind="cutValue" inputmode="numeric" placeholder="value" />
                </div>
            </div>
            <div class="cd__formactions">
                <button bind="save" type="button">Save setup</button>
                <button bind="cancel" class="cd__linkbtn" type="button">Cancel</button>
            </div>
        </div>
    </section>
`),pr=_(`
    <div class="cd__slot">
        <span bind="label"></span>
        <button bind="remove" type="button" aria-label="Remove">×</button>
    </div>
`),ge=_('<option bind="option"></option>'),mr=_(`
    <label class="cd__field">
        <span bind="label"></span>
        <select bind="select"></select>
        <input bind="integer" inputmode="numeric" />
    </label>
`);class fr extends I{competitions=this.inject(te);state=this.inject(ue);render(){const e=()=>this.competitions.detail.get(),t=this.wire(hr,{root:{className:()=>this.state.admin.get()&&Pe(this.state.lifecycle.get())?"cd__section cd__setup":"cd__section cd__setup hidden"},toggle:{textContent:()=>this.state.editingSetup.get()?"Close":"Edit",onclick:()=>{this.state.editingSetup.get()?this.state.editingSetup.set(!1):this.state.seedSetupEditor()}},summary:{className:()=>this.state.editingSetup.get()?"cd__summary hidden":"cd__summary"},summaryFormats:{textContent:()=>{const r=e()?.defaultConfig?.slots??[];return r.length?r.map(l=>this.state.formats.labelOf(l.formatId)??l.formatId).join(", "):"none set"},className:()=>(e()?.defaultConfig?.slots.length??0)===0?"cd__muted-em":""},summaryScoring:{textContent:()=>{const r=e()?.aggregation;return r?this.state.aggregations.labelOf(r.strategyId):"default (chosen automatically)"},className:()=>e()?.aggregation?"":"cd__muted-em"},form:{className:()=>this.state.editingSetup.get()?"cd__form":"cd__form hidden"},name:{value:()=>this.state.nameDraft.get(),oninput:r=>this.state.nameDraft.set(r.target.value)},formatPick:{value:()=>this.state.formatPickDraft.get(),onchange:r=>this.state.formatPickDraft.set(r.target.value)},addSlot:{onclick:()=>{const r=this.state.formatPickDraft.get()||this.state.formats.descriptors.get()[0]?.id;r&&this.state.slotDraft.set([...this.state.slotDraft.get(),r])}},aggregationPick:{value:()=>this.state.aggregationStrategy.get(),onchange:r=>this.state.selectAggregation(r.target.value)},aggregationDescription:()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.description??"",course:{value:()=>this.state.courseDraft.get(),onchange:r=>{const l=r.target.value;this.state.courseDraft.set(l),this.state.teeDraft.set(""),this.state.loadTees(l)}},tee:{value:()=>this.state.teeDraft.get(),onchange:r=>this.state.teeDraft.set(r.target.value)},startList:{value:()=>this.state.startListDraft.get(),onchange:r=>this.state.startListDraft.set(r.target.value)},cutAfter:{value:()=>this.state.cutAfterDraft.get(),oninput:r=>this.state.cutAfterDraft.set(r.target.value)},cutType:{value:()=>this.state.cutTypeDraft.get(),onchange:r=>this.state.cutTypeDraft.set(r.target.value)},cutValue:{value:()=>this.state.cutValueDraft.get(),oninput:r=>this.state.cutValueDraft.set(r.target.value)},save:{disabled:()=>this.competitions.mutating.get(),textContent:()=>this.competitions.mutating.get()?"Saving…":"Save setup",onclick:()=>{this.state.saveSetup()}},cancel:{onclick:()=>this.state.editingSetup.set(!1)}});this.$each(this.ref(t,"slots"),this.state.slotDraft,(r,l,d)=>this.wireEl(pr,{label:()=>`Slot ${l+1}: ${this.state.formats.labelOf(r)??r}`,remove:{onclick:()=>this.state.slotDraft.set(this.state.slotDraft.get().filter((u,c)=>c!==l))}},d),(r,l)=>`${l}:${r}`),this.$each(this.ref(t,"formatPick"),this.state.formats.descriptors,(r,l,d)=>this.wireEl(ge,{option:{value:()=>r.id,textContent:()=>this.state.formats.labelOf(r)??r.id}},d),r=>r.id),this.$each(this.ref(t,"aggregationPick"),this.state.aggregations.descriptors,(r,l,d)=>this.wireEl(ge,{option:{value:()=>r.id,textContent:()=>this.state.aggregations.labelOf(r)}},d),r=>r.id);const s=new y(()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.configFields??[]);this.$each(this.ref(t,"aggregationFields"),s,(r,l,d)=>this.configField(r,d),r=>r.key);const n=(r,l)=>this.wireEl(ge,{option:{value:()=>r.id,textContent:()=>r.name}},l);return this.$each(this.ref(t,"course"),this.state.courses,(r,l,d)=>n(r,d),r=>r.id),this.$each(this.ref(t,"tee"),this.state.tees,(r,l,d)=>n(r,d),r=>r.id),t}configField(e,t){const s=this.wireEl(mr,{label:()=>e.label,select:{className:()=>e.kind==="select"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),onchange:l=>this.state.setAggregationValue(e.key,l.target.value)},integer:{className:()=>e.kind==="integer"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),oninput:l=>this.state.setAggregationValue(e.key,l.target.value)}},t),n=s.querySelector("select"),r=new y(()=>e.kind==="select"?e.options:[]);return this.$each(n,r,(l,d,u)=>this.wireEl(ge,{option:{value:()=>l.value,textContent:()=>l.label}},u),l=>l.value),s}}const gr=_(`
    <section class="cd__section">
        <div class="cd__section-head">
            <h2>Players</h2><span bind="count" class="cd__count"></span>
        </div>
        <div bind="empty" class="cd__empty">No players yet.</div>
        <div bind="roster" class="cd__roster"></div>
        <div bind="add" class="cd__rosteradd">
            <div class="cd__addfriends">
                <span class="cd__sublabel">Add from friends</span>
                <div bind="friends" class="cd__friendpick"></div>
            </div>
            <form bind="guestForm" class="cd__guestform">
                <span class="cd__sublabel">Add a guest</span>
                <div class="cd__guestrow">
                    <input bind="guestName" placeholder="Name" />
                    <select bind="guestGender">
                        <option value="M">M</option><option value="F">F</option>
                    </select>
                    <input bind="guestHcp" inputmode="decimal" placeholder="HCP" />
                    <button bind="addGuest" type="submit">Add</button>
                </div>
            </form>
        </div>
    </section>
`),br=_(`
    <div class="cd__rosterrow">
        <span bind="name" class="cd__rname"></span>
        <span bind="category" class="cd__rcat"></span>
        <span bind="status" class="cd__rout"></span>
        <button bind="withdraw" class="cd__ract" type="button">Withdraw</button>
        <button bind="remove" class="cd__ract cd__ract--danger" type="button">Remove</button>
    </div>
`),_r=_('<button bind="chip" class="cd__friendchip" type="button"></button>');class yr extends I{competitions=this.inject(te);state=this.inject(ue);render(){const e=()=>this.state.id.get()??"",t=this.wire(gr,{count:()=>{const s=this.competitions.participants.get().length;return s===0?"":String(s)},empty:{className:()=>this.competitions.participants.get().length===0?"cd__empty":"cd__empty hidden"},add:{className:()=>this.state.admin.get()&&Pe(this.state.lifecycle.get())?"cd__rosteradd":"cd__rosteradd hidden"},guestForm:{onsubmit:s=>{s.preventDefault(),this.state.addGuest()}},guestName:{value:()=>this.state.guestNameDraft.get(),oninput:s=>this.state.guestNameDraft.set(s.target.value)},guestGender:{value:()=>this.state.guestGenderDraft.get(),onchange:s=>this.state.guestGenderDraft.set(s.target.value)},guestHcp:{value:()=>this.state.guestHcpDraft.get(),oninput:s=>this.state.guestHcpDraft.set(s.target.value)},addGuest:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"roster"),this.competitions.participants,(s,n,r)=>this.wireEl(br,{name:()=>s.displayNameSnapshot,category:{textContent:()=>s.category??"",className:()=>s.category?"cd__rcat":"cd__rcat hidden"},status:{textContent:()=>s.withdrawnAt?"Withdrawn":s.cutAfterRound!==null?`Cut R${s.cutAfterRound}`:"",className:()=>s.withdrawnAt||s.cutAfterRound!==null?"cd__rout":"cd__rout hidden"},withdraw:{className:()=>this.state.admin.get()&&!s.withdrawnAt?"cd__ract":"cd__ract hidden",onclick:()=>{this.competitions.withdrawParticipant(e(),s.id)}},remove:{className:()=>this.state.admin.get()&&Pe(this.state.lifecycle.get())?"cd__ract cd__ract--danger":"cd__ract cd__ract--danger hidden",onclick:()=>{this.competitions.removeParticipant(e(),s.id)}}},r),s=>JSON.stringify({id:s.id,name:s.displayNameSnapshot,category:s.category,withdrawnAt:s.withdrawnAt,cutAfterRound:s.cutAfterRound})),this.$each(this.ref(t,"friends"),this.state.friends.friends,(s,n,r)=>this.wireEl(_r,{chip:{textContent:()=>s.displayName,disabled:()=>this.competitions.mutating.get()||this.competitions.participants.get().some(l=>l.playerId===s.id),onclick:()=>{this.competitions.addPlayer(e(),s.id,null)}}},r),s=>s.id),t}}const vr={not_started:"Not started",active:"Live",complete:"Finished"},wr=_(`
    <section class="cd__section">
        <div class="cd__section-head"><h2>Rounds</h2></div>
        <div bind="empty" class="cd__empty">No rounds yet.</div>
        <div bind="rounds" class="cd__rounds"></div>
        <form bind="form" class="cd__addround">
            <span class="cd__sublabel">Add a round</span>
            <div class="cd__addroundrow">
                <select bind="course"></select>
                <input bind="date" type="date" />
                <button bind="add" type="submit">Add round</button>
            </div>
        </form>
    </section>
`),xr=_(`
    <button bind="row" class="cd__roundrow" type="button">
        <span bind="number" class="cd__rnum"></span>
        <span bind="meta" class="cd__rmeta"></span>
        <span bind="status" class="cd__rstatus"></span>
    </button>
`),$r=_('<option bind="option"></option>');class kr extends I{competitions=this.inject(te);state=this.inject(ue);router=this.inject(N);render(){const e=new y(()=>this.competitions.detail.get()?.rounds??[]),t=this.wire(wr,{empty:{className:()=>e.get().length===0?"cd__empty":"cd__empty hidden"},form:{className:()=>this.state.admin.get()&&rr(this.state.lifecycle.get())?"cd__addround":"cd__addround hidden",onsubmit:s=>{s.preventDefault(),this.createRound()}},course:{value:()=>this.state.roundCourseDraft.get(),onchange:s=>this.state.roundCourseDraft.set(s.target.value)},date:{value:()=>this.state.roundDateDraft.get(),oninput:s=>this.state.roundDateDraft.set(s.target.value)},add:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"course"),this.state.courses,(s,n,r)=>this.wireEl($r,{option:{value:()=>s.id,textContent:()=>s.name}},r),s=>s.id),this.$each(this.ref(t,"rounds"),e,(s,n,r)=>this.wireEl(xr,{row:{disabled:()=>!s.shareToken,onclick:()=>{s.shareToken&&this.router.navigate("/round",{query:{token:s.shareToken}})}},number:()=>`Round ${s.roundNumber}`,meta:()=>[s.courseNameSnapshot,s.date].filter(Boolean).join(" · ")||(s.shareToken?"Open":"View-only"),status:{textContent:()=>vr[s.status]??s.status,className:()=>`cd__rstatus s-${s.status}`}},r),s=>JSON.stringify({id:s.id,status:s.status,shareToken:s.shareToken,courseName:s.courseNameSnapshot,date:s.date})),t}async createRound(){const e=await this.state.createRound();e&&this.router.navigate("/round",{query:{token:e}})}}function Sr(i,e,t){return JSON.stringify({entry:i,points:e,columns:t})}function Ir(i){return i.rounds.filter(e=>e.value!==null).map(e=>({text:String(e.value),dropped:e.status==="dropped"}))}const Cr=_(`
    <div>
        <section bind="admin" class="cd__section cd__admin">
            <div class="cd__section-head"><h2>Admin</h2></div>
            <div bind="cutOutcome" class="cd__cutoutcome">
                <div class="cd__cutgrp">
                    <strong bind="advancedLabel"></strong> <span bind="advanced"></span>
                </div>
                <div class="cd__cutgrp">
                    <strong bind="cutLabel"></strong> <span bind="cut"></span>
                </div>
            </div>
            <div class="cd__adminbtns">
                <button bind="applyCut" class="cd__cutbtn" type="button">Apply cut</button>
                <button bind="finalize" class="cd__finalbtn" type="button">Finalize</button>
            </div>
            <p class="cd__adminnote">Finalizing freezes the results — it can't be undone.</p>
        </section>
        <section class="cd__section">
            <div class="cd__section-head"><h2 bind="title">Leaderboard</h2></div>
            <div bind="switcher" class="cd__setswitch"></div>
            <div bind="board" class="cd__board">
                <div bind="official" class="cd__official-banner"></div>
                <div bind="boardHead" class="cb-head">
                    <h3 bind="metric" class="cb-head__title"></h3>
                    <span bind="operator" class="cb-head__op"></span>
                    <span bind="defaulted" class="cb-head__hint">· default scoring</span>
                </div>
                <div bind="empty" class="cb-empty">No scores yet — the board fills in as rounds are played.</div>
                <table bind="table" class="cb">
                    <thead><tr bind="headers"></tr></thead>
                    <tbody bind="rows"></tbody>
                </table>
            </div>
            <div bind="refusal" class="cd__empty"></div>
        </section>
        <div bind="cutConfirm"></div>
        <div bind="finalizeConfirm"></div>
    </div>
`),Tr=_('<button bind="button" type="button"></button>'),Er=_('<th bind="cell"></th>'),Nr=_('<tr bind="row"></tr>'),Pr=_('<td bind="cell"><span bind="value"></span></td>'),zr=_(`
    <td bind="cell" class="cb-who">
        <div class="cb-who__line">
            <span bind="name" class="cb-name"></span>
            <span bind="category" class="cb-tag cb-cat"></span>
            <span bind="status" class="cb-tag cb-tag--out"></span>
        </div>
        <div class="cb-arith">
            <span bind="parts"></span><span bind="equals"> = </span><span bind="total" class="cb-arith__total"></span>
        </div>
    </td>
`),Rr=_('<span bind="part"><span bind="separator"></span><span bind="value"></span></span>');class jr extends I{competitions=this.inject(te);state=this.inject(ue);render(){const e=new y(()=>{if(this.state.lifecycle.get()!=="finalized")return(this.competitions.board.get()?.view.entries??[]).map(p=>({entry:p,points:null}));const c=this.competitions.results.get()?.resultSets??[],m=Math.min(this.state.resultSetIndex.get(),c.length-1);return(c[m]?.entries??[]).map(p=>({entry:p.entry,points:p.points}))}),t=new y(()=>{const c=this.competitions.board.get()?.view.rounds??[];if(c.length>0)return c;const m=new Set;for(const p of e.get())for(const g of p.entry.rounds)m.add(g.roundNumber);return[...m].sort((p,g)=>p-g).map(p=>({roundNumber:p,postCut:!1}))}),s=()=>this.state.lifecycle.get()==="finalized",n=()=>s()?(this.competitions.results.get()?.resultSets.length??0)>0:this.competitions.board.get()!==null,r=()=>this.state.cutOutcome.get(),l=c=>c.length===0?"—":c.map(m=>m.displayName).join(", "),d=this.wire(Cr,{admin:{className:()=>this.state.admin.get()&&this.state.lifecycle.get()==="active"?"cd__section cd__admin":"cd__section cd__admin hidden"},cutOutcome:{className:()=>r()?"cd__cutoutcome":"cd__cutoutcome hidden"},advancedLabel:()=>`Advanced (${r()?.advanced.length??0}):`,advanced:()=>l(r()?.advanced??[]),cutLabel:()=>`Cut (${r()?.cut.length??0}):`,cut:()=>l(r()?.cut??[]),applyCut:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.cutConfirmOpen.set(!0)},finalize:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.finalizeConfirmOpen.set(!0)},title:()=>s()?"Official results":"Leaderboard",board:{className:()=>s()?"cd__board cb cb--official":"cd__board"},official:{textContent:()=>{const c=this.competitions.results.get()?.finalizedAt.slice(0,10)??"";return s()&&c?`Official results · finalized ${c}`:""},className:()=>s()?"cd__official-banner":"cd__official-banner hidden"},boardHead:{className:()=>s()?"cb-head hidden":"cb-head"},metric:()=>this.competitions.board.get()?.view.metricLabel??"",operator:()=>{const c=this.competitions.board.get();return c?c.view.operator.kind==="best_n"?`Best ${c.view.operator.n} of ${c.view.rounds.length}`:"Total across rounds":""},defaulted:{className:()=>this.competitions.board.get()?.defaulted?"cb-head__hint":"cb-head__hint hidden"},empty:{className:()=>n()&&e.get().length===0?"cb-empty":"cb-empty hidden"},table:{className:()=>n()&&e.get().length>0?"cb":"cb hidden"},refusal:{textContent:()=>s()?this.competitions.resultsRefusal.get()??"":this.competitions.board.get()===null?this.competitions.boardRefusal.get()??"":""}}),u=new y(()=>[{text:"#",className:"cb-pos"},{text:"Player",className:"cb-who"},...t.get().map((c,m,p)=>({text:`R${c.roundNumber}`,className:`cb-c${c.postCut&&!p.slice(0,m).some(g=>g.postCut)?" cb-c--divider":""}`})),{text:"Total",className:"cb-total"},...s()?[{text:"Pts",className:"cb-points"}]:[]]);return this.$each(this.ref(d,"headers"),u,(c,m,p)=>this.wireEl(Er,{cell:{textContent:()=>c.text,className:()=>c.className}},p),c=>`${c.text}:${c.className}`),this.$each(this.ref(d,"rows"),e,(c,m,p)=>this.boardRow(c,t.get(),p),c=>Sr(c.entry,c.points,t.get())),this.$each(this.ref(d,"switcher"),new y(()=>s()?this.competitions.results.get()?.resultSets??[]:[]),(c,m,p)=>this.wireEl(Tr,{button:{textContent:()=>c.scoringType.toUpperCase(),className:()=>this.state.resultSetIndex.get()===m?"on":"",onclick:()=>this.state.resultSetIndex.set(m)}},p),c=>c.scoringType),this.spawn(G,this.ref(d,"cutConfirm"),{open:this.state.cutConfirmOpen,title:"Apply cut?",message:"This evaluates the configured cut against the current aggregate and marks who advances. Cut players are left out of later rounds.",confirmLabel:"Apply cut",cancelLabel:"Cancel",onconfirm:async()=>{const c=await this.competitions.applyCut(this.state.id.get()??"");c.ok&&this.state.cutOutcome.set(c.outcome)}}),this.spawn(G,this.ref(d,"finalizeConfirm"),{open:this.state.finalizeConfirmOpen,title:"Finalize competition?",message:"Finalizing freezes the official results and locks the competition. This cannot be undone.",confirmLabel:"Finalize",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.competitions.finalize(this.state.id.get()??"")}}),d}boardRow(e,t,s){const n=e.entry,r=n.withdrawn||n.cutAfterRound!==null,l=["cb-row"];n.withdrawn?l.push("cb-row--withdrawn"):n.cutAfterRound!==null?l.push("cb-row--cut"):n.position===1&&l.push("cb-row--lead"),n.incomplete&&l.push("cb-row--incomplete");const d=t.findIndex(p=>p.postCut),u=new Map(n.rounds.map(p=>[p.roundNumber,p])),c=[{kind:"position",text:r?"—":String(n.position)},{kind:"who",entry:n},...t.map((p,g)=>({kind:"round",cell:u.get(p.roundNumber)??null,divider:g===d})),{kind:"total",text:n.total===null?"—":String(n.total)},...e.points===null?[]:[{kind:"points",text:String(e.points)}]],m=this.wireEl(Nr,{row:{className:()=>l.join(" ")}},s);return this.$each(m,new y(()=>c),(p,g,x)=>this.boardCell(p,x),(p,g)=>g),m}boardCell(e,t){if(e.kind==="who")return this.whoCell(e.entry,t);const s=e.kind==="position"?"cb-pos":e.kind==="total"?"cb-total":e.kind==="points"?"cb-points":`cb-c cb-c--${e.cell?.status??"missing"}${e.divider?" cb-c--divider":""}`,n=e.kind==="round"?e.cell?.value===null||!e.cell?"—":String(e.cell.value):e.text;return this.wireEl(Pr,{cell:{className:()=>s},value:{textContent:()=>n,className:()=>e.kind==="round"&&e.cell?.status==="dropped"?"cb-struck":""}},t)}whoCell(e,t){const s=e.withdrawn?"WD":e.cutAfterRound!==null?`Cut R${e.cutAfterRound}`:"",n=Ir(e),r=this.wireEl(zr,{cell:{},name:()=>e.displayName,category:{textContent:()=>e.category??"",className:()=>e.category?"cb-tag cb-cat":"cb-tag cb-cat hidden"},status:{textContent:()=>s,className:()=>s?"cb-tag cb-tag--out":"cb-tag cb-tag--out hidden"},equals:{className:()=>n.length===0?"hidden":""},total:()=>e.total===null?"—":String(e.total)},t);return this.$each(r.querySelector('[bind="parts"]'),new y(()=>n),(l,d,u)=>this.wireEl(Rr,{separator:()=>d===0?"":" + ",value:{textContent:()=>l.text,className:()=>l.dropped?"cb-struck":""}},u),(l,d)=>d),r}}const Or=_(`
    <div class="cd">
        <button bind="back" class="cd__back" type="button">← Competitions</button>

        <div bind="loading" class="cd__loading">Loading…</div>
        <div bind="loadErr" class="cd__loaderr"></div>

        <div bind="body" class="cd__body">
            <header class="cd__head">
                <div class="cd__titlerow">
                    <h1 bind="name"></h1>
                    <span bind="chip"></span>
                </div>
                <p bind="ownerLine" class="cd__owner"></p>
            </header>

            <p bind="mutateErr" class="cd__err"></p>

            <div bind="transitionRow" class="cd__transition">
                <button bind="transitionBtn" type="button"></button>
            </div>

            <div bind="setup"></div>
            <div bind="roster"></div>
            <div bind="rounds"></div>
            <div bind="results"></div>
        </div>
    </div>
`);class Lr extends I{static styles=`
        .cd {
            padding: ${a("lg")} ${a("lg")} ${a("2xl")};
            & .hidden { display: none !important; }
            & .cd__muted-em { font-style: italic; }
            & .cb-struck { text-decoration: line-through; opacity: 0.8; }

            & .cd__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 700; color: ${o("accent")};
                cursor: pointer; padding: 0 0 ${a("md")};
            }
            & .cd__loading, & .cd__loaderr {
                color: ${o("text-muted")}; padding: ${a("lg")} 0;
                &.hidden { display: none; }
            }
            & .cd__loaderr { color: ${o("error")}; }
            & .cd__body.hidden { display: none; }

            & .cd__head { margin-bottom: ${a("md")}; }
            & .cd__titlerow { display: flex; align-items: center; gap: ${a("md")}; }
            & .cd__head h1 {
                margin: 0; font-family: ${o("font-display")}; font-weight: 600;
                font-size: 1.7rem; letter-spacing: -0.02em;
            }
            & .cd__owner { margin: ${a("xs")} 0 0; color: ${o("text-muted")}; font-size: 0.85rem; }

            & .comp-chip {
                flex-shrink: 0; font-size: 0.7rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em;
                border-radius: ${o("radius-pill")}; padding: 2px 10px;
                background: ${o("surface-sunken")}; color: ${o("text-muted")};
                &.comp-chip--setup { background: ${o("accent-soft")}; color: ${o("accent")}; }
                &.comp-chip--active { background: ${o("primary")}; color: ${o("primary-text")}; }
                &.comp-chip--finalized { background: ${o("accent")}; color: ${o("topbar-bg")}; }
            }

            & .cd__err {
                margin: 0 0 ${a("md")}; font-size: 0.85rem; color: ${o("error")};
                &:empty { display: none; }
            }

            & .cd__transition {
                margin-bottom: ${a("lg")};
                &.hidden { display: none; }
                & button {
                    padding: ${a("md")} ${a("lg")}; font-family: inherit;
                    font-size: 0.95rem; font-weight: 700; ${w()}
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                    &:disabled { opacity: 0.5; }
                }
            }

            & .cd__section {
                margin-bottom: ${a("xl")};
                &.hidden { display: none; }
            }
            & .cd__section-head {
                display: flex; align-items: baseline; gap: ${a("sm")};
                margin-bottom: ${a("sm")};
                & h2 {
                    margin: 0; font-family: ${o("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
                & .cd__count { color: ${o("text-muted")}; font-size: 0.85rem; }
            }
            & .cd__linkbtn {
                margin-left: auto; background: none; border: none; font-family: inherit;
                font-size: 0.85rem; font-weight: 700; color: ${o("accent")}; cursor: pointer;
            }
            & .cd__summary {
                ${T()} padding: ${a("md")} ${a("lg")};
                font-size: 0.85rem; color: ${o("text-muted")}; line-height: 1.5;
                &.hidden { display: none; }
            }
            & .cd__empty { color: ${o("text-muted")}; font-size: 0.9rem; padding: ${a("sm")} 0;
                &.hidden { display: none; } &:empty { display: none; } }

            & .cd__form {
                ${T()} padding: ${a("lg")};
                display: flex; flex-direction: column; gap: ${a("md")};
                &.hidden { display: none; }
                & .cd__field { display: flex; flex-direction: column; gap: ${a("xs")};
                    & > span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                        letter-spacing: 0.05em; color: ${o("text-muted")}; }
                    & input, & select { padding: ${a("sm")} ${a("md")}; font-size: 0.95rem; ${H()} }
                }
                & .cd__aggdesc { margin: 0; font-size: 0.8rem; color: ${o("text-muted")}; &:empty { display: none; } }
                & .cd__aggfields { display: flex; flex-direction: column; gap: ${a("md")}; &:empty { display: none; } }
                & .cd__cutrow, & .cd__addrow { display: flex; gap: ${a("sm")}; }
                & .cd__cutrow input { width: 33%; }
                & .cd__addrow select { flex: 1; }
                & .cd__slots { display: flex; flex-direction: column; gap: ${a("xs")}; }
                & .cd__formactions { display: flex; align-items: center; gap: ${a("md")}; margin-top: ${a("sm")}; }
                & button[bind="addSlot"], & button[bind="saveSetup"] {
                    padding: ${a("sm")} ${a("md")}; font-family: inherit; font-weight: 700;
                    ${w()} background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                }
            }
            & .cd__slot {
                display: flex; align-items: center; justify-content: space-between;
                padding: ${a("xs")} ${a("sm")}; background: ${o("surface-sunken")};
                border-radius: ${o("radius-sm")}; font-size: 0.9rem; font-weight: 600;
                & button { background: none; border: none; color: ${o("error")}; cursor: pointer; font-size: 1.1rem; }
            }

            & .cd__roster { display: flex; flex-direction: column; gap: ${a("xs")}; margin-bottom: ${a("md")}; }
            & .cd__rosterrow {
                display: flex; align-items: center; gap: ${a("sm")};
                padding: ${a("sm")} ${a("md")}; ${T()}
                & .cd__rname { font-weight: 700; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                & .cd__rcat, & .cd__rout {
                    font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
                    border-radius: ${o("radius-pill")}; padding: 1px 8px;
                }
                & .cd__rcat { background: ${o("accent-soft")}; color: ${o("accent")}; }
                & .cd__rout { background: ${o("surface-sunken")}; color: ${o("text-muted")}; }
                & .cd__ract { background: none; border: none; cursor: pointer; color: ${o("text-muted")};
                    font-size: 0.75rem; font-weight: 700; }
                & .cd__ract--danger { color: ${o("error")}; }
            }
            & .cd__rosteradd, & .cd__addround { &.hidden { display: none; } }
            & .cd__sublabel { display: block; font-size: 0.75rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.05em; color: ${o("text-muted")};
                margin: ${a("md")} 0 ${a("xs")}; }
            & .cd__friendpick { display: flex; flex-wrap: wrap; gap: ${a("xs")}; }
            & .cd__friendchip {
                padding: ${a("xs")} ${a("md")}; ${w()} font-family: inherit;
                font-size: 0.85rem; font-weight: 600; cursor: pointer;
                &:disabled { opacity: 0.4; }
            }
            & .cd__guestrow, & .cd__addroundrow { display: flex; gap: ${a("sm")}; }
            & .cd__guestrow input, & .cd__addroundrow input, & .cd__addroundrow select {
                padding: ${a("sm")} ${a("md")}; font-size: 0.9rem; ${H()} min-width: 0; }
            & .cd__guestrow input[bind="guestName"] { flex: 1; }
            & .cd__guestrow input[bind="guestHcp"] { width: 4.5rem; }
            & .cd__guestrow select { width: 3.5rem; }
            & .cd__addroundrow select { flex: 1; }
            & .cd__guestrow button, & .cd__addroundrow button {
                padding: ${a("sm")} ${a("md")}; font-family: inherit; font-weight: 700;
                ${w()} background: ${o("primary")}; color: ${o("primary-text")}; border: none; }

            & .cd__rounds { display: flex; flex-direction: column; gap: ${a("xs")}; }
            & .cd__roundrow {
                display: flex; align-items: center; gap: ${a("md")};
                padding: ${a("md")} ${a("lg")}; ${T({hover:!0})}
                text-align: left; font-family: inherit; width: 100%; cursor: pointer;
                &:disabled { cursor: default; opacity: 0.75; }
                & .cd__rnum { font-weight: 700; }
                & .cd__rmeta { color: ${o("text-muted")}; font-size: 0.85rem; flex: 1; }
                & .cd__rstatus {
                    font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.06em; border-radius: ${o("radius-pill")}; padding: 2px 10px;
                    background: ${o("surface-sunken")}; color: ${o("text-muted")};
                    &.s-active { background: ${o("accent-soft")}; color: ${o("accent")}; }
                }
            }

            & .cd__admin.hidden { display: none; }
            & .cd__adminbtns { display: flex; gap: ${a("md")}; }
            & .cd__adminbtns button {
                padding: ${a("md")} ${a("lg")}; font-family: inherit; font-weight: 700; ${w()}
            }
            & .cd__cutbtn { background: ${o("accent-soft")}; color: ${o("accent")}; border-color: ${o("accent")}; }
            & .cd__finalbtn { background: ${o("error")}; color: #fff; border: none; }
            & .cd__adminnote { margin: ${a("sm")} 0 0; font-size: 0.8rem; color: ${o("text-muted")}; }
            & .cd__cutoutcome { &:empty { display: none; } margin-bottom: ${a("md")}; font-size: 0.85rem;
                ${T()} padding: ${a("md")} ${a("lg")}; }
            & .cd__cutoutcome .cd__cutgrp { margin-bottom: ${a("xs")}; }
            & .cd__cutoutcome strong { color: ${o("text")}; }

            & .cd__setswitch { display: flex; gap: ${a("xs")}; margin-bottom: ${a("sm")};
                &:empty { display: none; }
                & button {
                    padding: ${a("xs")} ${a("md")}; ${w()} font-family: inherit;
                    font-size: 0.85rem; font-weight: 700; cursor: pointer;
                    &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                }
            }

            /* --- aggregated / official board --- */
            & .cd__board { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            & .cd__official-banner {
                ${T()} padding: ${a("sm")} ${a("lg")}; margin-bottom: ${a("sm")};
                background: ${o("accent-soft")}; color: ${o("accent")};
                font-weight: 700; font-size: 0.85rem;
                border-color: ${o("accent")};
            }
            & .cb-head { display: flex; align-items: baseline; gap: ${a("sm")}; margin-bottom: ${a("sm")}; }
            & .cb-head__title { margin: 0; font-family: ${o("font-display")}; font-weight: 600; font-size: 1rem; }
            & .cb-head__op, & .cb-head__hint { font-size: 0.75rem; color: ${o("text-muted")}; }
            & .cb-empty { color: ${o("text-muted")}; padding: ${a("md")} 0; }
            & table.cb {
                width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums;
            }
            & .cb.cb--official { box-shadow: inset 0 0 0 2px ${o("accent")}; border-radius: ${o("radius")}; }
            & .cb thead th {
                font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em;
                color: ${o("text-muted")}; font-weight: 700; padding: ${a("xs")} ${a("sm")};
                border-bottom: 1px solid ${o("border")}; text-align: center;
            }
            & .cb th.cb-who, & .cb td.cb-who { text-align: left; }
            & .cb tbody td { padding: ${a("sm")}; border-bottom: 1px solid ${o("border")};
                text-align: center; font-size: 0.9rem; }
            & .cb .cb-pos { width: 2rem; color: ${o("text-muted")}; font-weight: 700; }
            & .cb .cb-who { min-width: 0; }
            & .cb .cb-who__line { display: flex; align-items: baseline; gap: ${a("xs")}; min-width: 0; }
            & .cb .cb-name { font-weight: 700; font-family: ${o("font-display")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
            & .cb .cb-arith { font-size: 0.72rem; color: ${o("text-muted")}; margin-top: 1px;
                font-variant-numeric: tabular-nums; }
            & .cb .cb-arith s { opacity: 0.7; }
            & .cb .cb-arith__total { font-weight: 700; color: ${o("text")}; }
            & .cb .cb-tag { font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.05em; border-radius: ${o("radius-pill")}; padding: 1px 7px; flex-shrink: 0; }
            & .cb .cb-cat { background: ${o("accent-soft")}; color: ${o("accent")}; }
            & .cb .cb-tag--out { background: ${o("surface-sunken")}; color: ${o("text-muted")}; }
            & .cb .cb-c--dropped { color: ${o("text-muted")}; }
            & .cb .cb-c--dropped s { opacity: 0.8; }
            & .cb .cb-c--missing, & .cb .cb-c--cut { color: ${o("text-muted")}; }
            & .cb .cb-c--divider { border-left: 2px solid ${o("accent")}; }
            & .cb .cb-total { font-weight: 800; font-size: 1rem; }
            & .cb .cb-points { font-weight: 800; color: ${o("accent")}; }
            & .cb tr.cb-row--lead td { background: ${o("accent-soft")}; }
            & .cb tr.cb-row--cut td, & .cb tr.cb-row--withdrawn td {
                color: ${o("text-muted")}; background: ${o("surface-sunken")}; opacity: 0.85; }
        }
    `;competitions=this.inject(te);state=this.inject(ue);router=this.inject(N);render(){const e=()=>this.competitions.detail.get();this.track($(()=>{const s=this.state.id.get();s&&V(()=>{this.state.enter(),this.competitions.loadDetail(s)})})),this.state.initialize();const t=this.wire(Or,{back:{onclick:()=>this.router.navigate("/competitions")},loading:{className:()=>this.competitions.detailLoading.get()&&e()===null?"cd__loading":"cd__loading hidden"},loadErr:{textContent:()=>this.competitions.detailError.get()?.message??"",className:()=>this.competitions.detailError.get()?"cd__loaderr":"cd__loaderr hidden"},body:{className:()=>e()?"cd__body":"cd__body hidden"},name:()=>e()?.name??"",chip:{textContent:()=>Dt(this.state.lifecycle.get()),className:()=>Ht(this.state.lifecycle.get())},ownerLine:{textContent:()=>this.state.admin.get()?"You administer this competition.":"Read-only view."},mutateErr:{textContent:()=>this.competitions.mutateError.get()??""},transitionRow:{className:()=>this.state.admin.get()&&Ce(this.state.lifecycle.get())?"cd__transition":"cd__transition hidden"},transitionBtn:{textContent:()=>Ce(this.state.lifecycle.get())?.label??"",disabled:()=>this.competitions.mutating.get(),onclick:()=>{const s=Ce(this.state.lifecycle.get()),n=this.state.id.get();s&&n&&this.competitions.transition(n,s.to)}}});return this.spawn(fr,this.ref(t,"setup")),this.spawn(yr,this.ref(t,"roster")),this.spawn(kr,this.ref(t,"rounds")),this.spawn(jr,this.ref(t,"results")),t}}const Dr=_(`
    <div class="app-shell">
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class Hr extends I{static styles=`
        .app-shell {
            display: grid;
            grid-template-rows: 1fr auto;
            height: 100vh;
            height: 100dvh;
            max-width: 560px;
            margin: 0 auto;
            background: ${o("bg")};

            & .app-shell__content {
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
        }
    `;router=this.inject(N);render(){const e=this.wire(Dr,{});return this.spawn(Hs,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":Je,"/history":Js,"/round":gi,"/create":Ki,"/login":Yi,"/friends":er,"/profile":nr,...kt.competitions?{"/competitions":lr,"/competition":Lr}:{}},Je),e}}class Mr extends R{async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await Lt(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await Vi()),this.error.set(null)}catch(e){e instanceof M&&e.status===401?this.error.set(null):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await Ui(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof M&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}}z.get(Zt);const pt=z.get(N);z.set(R,new Mr);const mt=z.get(R);await ts(Hr,"#app",{hot:void 0,onInit:async()=>{await mt.load(),mt.currentUser.get()&&pt.route.get()==="/login"&&pt.navigate("/",!0)}});export{I as C,N as R,h as S,Zt as T,f as a,de as b,y as c,$ as e,C as r,_ as t};
