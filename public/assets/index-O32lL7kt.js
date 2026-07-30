(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function t(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=t(n);fetch(n.href,r)}})();const As="modulepreload",Ds=function(i){return"/tapscore/"+i},ft={},Ms=function(e,t,s){let n=Promise.resolve();if(t&&t.length>0){let c=function(u){return Promise.all(u.map(f=>Promise.resolve(f).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),d=a?.nonce||a?.getAttribute("nonce");n=c(t.map(u=>{if(u=Ds(u),u in ft)return;ft[u]=!0;const f=u.endsWith(".css"),m=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${m}`))return;const h=document.createElement("link");if(h.rel=f?"stylesheet":As,f||(h.as="script"),h.crossOrigin="",h.href=u,d&&h.setAttribute("nonce",d),document.head.appendChild(h),f)return new Promise((b,g)=>{h.addEventListener("load",b),h.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${u}`)))})}))}function r(a){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=a,window.dispatchEvent(d),!d.defaultPrevented)throw a}return n.then(a=>{for(const d of a||[])d.status==="rejected"&&r(d.reason);return e().catch(r)})},Xt="/tapscore/".replace(/\/+$/,""),Ye=Xt+"/api",Re={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},Hs=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function Jt(i,e){const t={};for(const[s,n]of Hs)if(s in i)for(const r of n)r in i||(t[r]=`var(--${s})`);return{...e,...t,...i}}const Zt=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],Fs={thin:"1px",medium:"3px",thick:"5px"};function es(i){const e=i.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":Fs[e.toLowerCase()]??e}function Bs(){return Zt.map(i=>{const e=es(Re[i]);return`@property --${i}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const ts={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},ss={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},Gs={...ss,"done-opacity":"0.35"},qs={...ts,...ss,...Re,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},Ks={...ts,...Gs,...Re,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class Vs{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;ns(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.disposed||s.run()}}}const Y=new Vs;function ns(i){for(const e of i.deps)e.delete(i);i.deps.clear()}class p{constructor(e){this.subs=new Set,this.val=e}get(){return Y.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,Y.notify(this.subs))}update(e){this.set(e(this.val))}}class S{constructor(e){this.subs=new Set,this.val=void 0;const t=this,s={run(){Y.runTracked(s,()=>{const n=e();Object.is(t.val,n)||(t.val=n,Y.notify(t.subs))})},deps:new Set};s.run()}get(){return Y.subscribe(this.subs),this.val}peek(){return this.val}}function N(i){const e={run(){Y.runTracked(e,i)},deps:new Set};return e.run(),()=>{e.disposed=!0,ns(e)}}function me(i){Y.batch(i)}function q(i){return Y.untrack(i)}class Us{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const B=new Us,le=Xt;function Xe(i){return le?i===le?"/":i.startsWith(le+"/")?i.slice(le.length):i:i}function Ws(i){return le+i}class M{constructor(){this.route=new p(Xe(location.pathname??"/")),this.search=new p(location.search??""),window.addEventListener("popstate",()=>me(()=>{this.route.set(Xe(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},n=e.indexOf("#"),r=n>=0?e.slice(n):"",a=n>=0?e.slice(0,n):e,d=a.indexOf("?"),c=d>=0?a.slice(0,d):a,u=d>=0?a.slice(d+1):"",f=s.query!==void 0?Qs(s.query):u?"?"+u:"",m=Ws(c)+f+r;(s.replace?history.replaceState:history.pushState).call(history,null,"",m),me(()=>{this.route.set(c),this.search.set(f)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:n=>{n.preventDefault(),this.navigate(e)},className:()=>{const n=this.route.get();return n===s||n.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new S(()=>{const s=this.route.get().split("/"),n={};for(const[r,a]of t.entries())a.startsWith(":")&&(n[a.slice(1)]=s[r]??"");return n})}query(e){return new S(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new S(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function Qs(i){const e=new URLSearchParams;for(const[s,n]of Object.entries(i))n==null||n===""||e.set(s,String(n));const t=e.toString();return t?"?"+t:""}function Ys(i){return e=>i[e]}const Xs="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",gt="data-basics-global";function Js(){if(document.head.querySelector(`style[${gt}]`))return;const i=document.createElement("style");i.setAttribute(gt,""),i.textContent=Bs()+Xs,document.head.appendChild(i)}function Zs(i,e){Js();const t=new Set(Zt),s=(r,a,d)=>{const c=Object.entries(r).map(([u,f])=>`--${u}:${t.has(u)?es(f):f}`).join(";");return`${a}{color-scheme:${d};${c}}`},n=document.createElement("style");return n.textContent=s(i,'[data-theme="light"]',"light")+s(e,'[data-theme="dark"]',"dark"),document.head.appendChild(n),r=>`var(--${r})`}const bt="basics-js-theme";class en{constructor(){this.dark=new p(!1);const e=localStorage.getItem(bt),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),N(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(bt,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function _(i){const e=document.createElement("template");return e.innerHTML=i,e}function tn(i,e){let t;for(const s of Object.keys(e))i.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const yt=new Set;class R{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!yt.has(t)){yt.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return B.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const n=q(()=>{const r=new e(s[0]);return r.mount(t),r});return this.children.push(n),n}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){q(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,s){const n=s??(a=>this.track(a)),r=e.content.cloneNode(!0);for(const a of r.querySelectorAll("[bind]")){const d=t[a.getAttribute("bind")];if(d)if(typeof d=="function")n(N(()=>{const c=d();a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement?a.value=String(c):a.textContent=String(c)}));else for(const[c,u]of Object.entries(d)){const f=c.includes("-");c.startsWith("on")&&typeof u=="function"?a.addEventListener(c.slice(2),u):typeof u=="function"?n(N(()=>{const m=u();f?a.setAttribute(c,String(m)):a[c]=m})):f?a.setAttribute(c,String(u)):a[c]=u}}return r}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const n=this.ref(t,e);return n?(typeof s=="string"?n.textContent=s:typeof s=="function"&&s.prototype instanceof R?this.spawn(s,n):typeof s=="function"&&s(n,{spawn:(r,a,...d)=>this.spawn(r,a,...d),track:r=>this.track(r)}),!0):!1}$each(e,t,s,n=(r,a)=>a){const r=typeof t=="function"?t:()=>t.get(),a=new Map,d=new Map;this.track(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),this.track(N(()=>{const c=r(),u=new Map;for(const[m,h]of c.entries()){const b=n(h,m);if(a.has(b))u.set(b,a.get(b));else{const g=[];u.set(b,q(()=>s(h,m,x=>g.push(x)))),d.set(b,g)}}for(const[m,h]of a)u.has(m)||(h.remove(),q(()=>d.get(m)?.forEach(b=>b())),d.delete(m));let f=e.firstChild;for(const m of u.values())m===f?f=f.nextSibling:e.insertBefore(m,f);a.clear();for(const[m,h]of u)a.set(m,h)}))}$condition(e,t,s,n){let r=null;this.track(N(()=>{r&&(r.remove(),r=null);const a=t.get();r=q(()=>a?s():n?.()??null),r&&e.appendChild(r)}))}$swap(e,t,s,n){let r=null;this.track(N(()=>{if(r){const c=r;r=null,q(()=>c.destroy())}e.textContent="";const a=t.get(),d=s[a]??tn(a,s)??n;d&&(r=q(()=>{const c=new d;return c.mount(e),c}))})),this.track(()=>r?.destroy())}}const Ee=new Set;function sn(i){return Ee.add(i),()=>Ee.delete(i)}function nn(){for(const i of Array.from(Ee)){Ee.delete(i);try{i()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function rn(i,e,t){const s=document.querySelector(e);s.textContent="";const n=B.get(M);let r=null,a=!1,d=null,c=!!t?.hot?.data.hmr;const u=async f=>{r&&(r.destroy(),r=null,s.textContent=""),f?(d||(d=(await Ms(()=>import("./obs-shell.component-CJSI_SZZ.js"),[])).ObsShellComponent),r=q(()=>new d)):(!c&&t?.onInit&&(await t.onInit(),c=!0),r=q(()=>new i)),q(()=>r.mount(s)),a=f};await u(Xe(location.pathname).startsWith("/_obs")),N(()=>{const f=n.route.get().startsWith("/_obs");f!==a&&u(f)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{r?.destroy()}catch(f){console.error("[startApp] the root component threw while disposing",f)}if(r=null,nn(),t.onDispose)try{t.onDispose()}catch(f){console.error("[startApp] onDispose threw",f)}}),t.hot.accept())}class K extends Error{constructor(e,t,s,n){super(t),this.status=e,this.details=s,this.traceId=n,this.name="ApiError"}}const an=10,Se=[];let Ce=[],ue=null;function on(i){Se.push(i),Se.length>an&&Se.shift()}function is(i,e,t){const s={code:i,message:e,url:typeof location<"u"?location.href:"",context:[...Se],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),Ce.push(s),ln()}function ln(){ue||(ue=setTimeout(rs,5e3))}function rs(){if(ue&&(clearTimeout(ue),ue=null),Ce.length===0)return;const i=Ce;Ce=[];for(const e of i){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${Ye}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${Ye}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&rs()});const dn=3e4,cn=2,ye=new Map,as=new WeakMap;function un(i){if(i instanceof K)return i.traceId;if(i!=null&&typeof i=="object")return as.get(i)}async function y(i){if(i.method==="GET"){const e=ye.get(i.url);if(e)return e;const t=_t(i,cn);return ye.set(i.url,t),t.then(()=>ye.delete(i.url),()=>ye.delete(i.url)),t}return _t(i,0)}async function _t(i,e){const t=i.timeout??dn;let s;for(let n=0;n<=e;n++){const r=crypto.randomUUID();try{return await pn(hn(i,r),t)}catch(a){if(s=a,!(a instanceof K)&&a!=null&&typeof a=="object"&&as.set(a,r),a instanceof K||n===e)break;await new Promise(d=>setTimeout(d,1e3*2**n))}}throw s}async function hn(i,e){const t={"X-Trace-Id":e},s={method:i.method,headers:t};i.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(i.body));const n=await fetch(i.url,s),r=n.headers.get("x-trace-id")??e;if(on({type:"api",detail:`${i.method} ${i.url}`,timestamp:new Date().toISOString()}),!n.ok){const a=await n.json().catch(()=>({error:n.statusText}));throw new K(n.status,a.error??n.statusText,a.details,r)}return n.json()}function pn(i,e){let t;const s=new Promise((n,r)=>{t=setTimeout(()=>r(new Error("Request timeout")),e)});return Promise.race([i,s]).finally(()=>clearTimeout(t))}const Je=new Set;let De=!1;function mn(i){return Je.add(i),()=>{Je.delete(i)}}function fn(){if(!De){De=!0;try{for(const i of[...Je])try{i()}catch(e){try{is("session-listener",gn(e))}catch{}}}finally{De=!1}}}function gn(i){try{if(i instanceof Error){const e=i.message;if(typeof e=="string")return e}return String(i)}catch{return"listener threw a value that could not be described"}}async function z(i,e,t,s={}){me(()=>{i.set(!0),e.set(null)});try{const n=await t();return i.set(!1),n}catch(n){const r=bn(n);me(()=>{i.set(!1),e.set(r)}),is(r.code,r.message,un(n)),r.code==="auth"&&s.sessionExpiry!==!1&&fn();return}}function bn(i){return i instanceof K?i.status===401?{code:"auth",message:"Unauthorized"}:i.status===409?{code:"conflict",message:"Data has changed — please try again"}:i.status===400?{code:"validation",message:i.message}:i.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:i instanceof Error?i.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const vt={sessionExpiry:!1};function yn(i){return{me:()=>y({method:"GET",url:`${i}/auth/me`}),login:e=>y({method:"POST",url:`${i}/auth/login`,body:e}),logout:()=>y({method:"POST",url:`${i}/auth/logout`,body:{}})}}class H{constructor(){this.api=yn(Ye),this.currentUser=new p(null),this.loading=new p(!1),this.error=new p(null),this.offSessionExpired=mn(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=sn(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await z(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await z(this.loading,this.error,()=>this.api.login({username:e,password:t}),vt);return s?(this.currentUser.set(s),!0):!1}async logout(){await z(this.loading,this.error,()=>this.api.logout(),vt);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const os={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},_n={...os,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},vn={...os,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"},wn=Jt(_n,qs),xn=Jt(vn,Ks),o=Zs(wn,xn),E=i=>`var(--${i})`,$=(i,e)=>`var(--${i}, ${e})`,k=i=>{const e=Re[i];if(e===void 0)throw new Error(`unknown control token: --${i}`);return e},l=Ys({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),_e=i=>`
    background: ${$(`btn-${i}-bg`,k(`btn-${i}-bg`))};
    color: ${$(`btn-${i}-fg`,k(`btn-${i}-fg`))};
    border-color: ${$(`btn-${i}-border`,k(`btn-${i}-border`))};
    box-shadow: ${$(`btn-${i}-shadow`,k(`btn-${i}-shadow`))};
    &:hover {
        background: ${$(`btn-${i}-bg-hover`,k(`btn-${i}-bg-hover`))};
        color: ${$(`btn-${i}-fg-hover`,k(`btn-${i}-fg-hover`))};
        border-color: ${$(`btn-${i}-border-hover`,k(`btn-${i}-border-hover`))};
    }`,ls=`
    background: ${$("btn-disabled-bg",k("btn-disabled-bg"))};
    color: ${$("btn-disabled-fg",k("btn-disabled-fg"))};
    border-color: ${$("btn-disabled-border",k("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${$("btn-disabled-opacity",k("btn-disabled-opacity"))};
    cursor: not-allowed;`,$n={primary:_e("primary"),secondary:_e("secondary"),ghost:_e("ghost"),danger:_e("danger"),disabled:ls},I=(i=$("btn-radius",k("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${$("btn-border-width",k("btn-border-width"))} solid transparent;
    border-radius: ${i};
    padding: ${$("btn-padding-y",k("btn-padding-y"))} ${$("btn-padding-x",k("btn-padding-x"))};
    font-family: ${E("font-ui")};
    font-size: ${$("btn-font-size",k("btn-font-size"))};
    line-height: ${$("btn-line-height",k("btn-line-height"))};
    font-weight: ${$("btn-font-weight",k("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${E("dur-fast")} ${E("ease-standard")},
        border-color ${E("dur-fast")} ${E("ease-standard")},
        color ${E("dur-fast")} ${E("ease-standard")},
        box-shadow ${E("dur-fast")} ${E("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${$("btn-focus-ring-width",k("btn-focus-ring-width"))} ${$("btn-focus-ring",k("btn-focus-ring"))};
    }
    ${$n[e]}
    &:disabled {${ls}}
`,kn=`max(${$("field-border-width",k("field-border-width"))}, ${$("field-rule-width",k("field-rule-width"))})`,ve=(i,e)=>`
    border-top-color: ${i};
    border-right-color: ${i};
    border-left-color: ${i};
    border-bottom-color: ${e};`,V=()=>`
    border-style: solid;
    border-top-width: ${$("field-border-width",k("field-border-width"))};
    border-right-width: ${$("field-border-width",k("field-border-width"))};
    border-left-width: ${$("field-border-width",k("field-border-width"))};
    border-bottom-width: ${kn};
    ${ve($("field-border",k("field-border")),$("field-rule",k("field-rule")))}
    border-radius: ${$("field-radius",k("field-radius"))};
    padding: ${$("field-padding-y",k("field-padding-y"))} ${$("field-padding-x",k("field-padding-x"))};
    background: ${$("field-bg",k("field-bg"))};
    color: ${E("text")};
    font-family: ${E("font-ui")};
    font-size: ${$("field-font-size",k("field-font-size"))};
    line-height: ${$("field-line-height",k("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${E("dur-fast")} ${E("ease-standard")},
        box-shadow ${E("dur-fast")} ${E("ease-standard")},
        background ${E("dur-fast")} ${E("ease-standard")};
    &::placeholder { color: ${E("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${ve($("field-focus-border",k("field-focus-border")),$("field-focus-border",k("field-focus-border")))}
        background: ${$("field-bg-focus",k("field-bg-focus"))};
        box-shadow: 0 0 0 ${$("field-focus-ring-width",k("field-focus-ring-width"))} ${$("field-focus-ring",k("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${ve($("field-invalid-border",k("field-invalid-border")),$("field-invalid-rule",k("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${ve($("field-invalid-border",k("field-invalid-border")),$("field-invalid-rule",k("field-invalid-rule")))}
        background: ${$("field-bg-focus",k("field-bg-focus"))};
        box-shadow: 0 0 0 ${$("field-focus-ring-width",k("field-focus-ring-width"))} ${$("field-invalid-ring",k("field-invalid-ring"))};
    }
`,Sn=()=>`
    display: block;
    font-family: ${E("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${E("text-muted")};
`,L=i=>`
    background: ${E("surface")};
    border: 1px solid ${E("border")};
    border-radius: ${E("radius-md")};
    box-shadow: ${E("shadow-1")};
    ${i?.hover?`
    transition:
        box-shadow ${E("dur-base")} ${E("ease-standard")},
        border-color ${E("dur-base")} ${E("ease-standard")};
    &:hover { box-shadow: ${E("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${Sn()}
        margin: 0 0 ${l("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${E("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${E("text")};
    }
    & .ui-card__meta {
        margin: ${l("xs")} 0 0 0;
        font-family: ${E("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${E("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${l("md")};
        font-family: ${E("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${E("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;function Cn(i){return{async me(){return y({method:"GET",url:`${i}/players/me`})},async register(e){return y({method:"POST",url:`${i}/players/register`,body:e})},async updateHandicap(e){return y({method:"POST",url:`${i}/players/me/handicap`,body:e})},async myHandicapHistory(){return y({method:"GET",url:`${i}/players/me/handicap-history`})},async updateProfile(e){return y({method:"POST",url:`${i}/players/me/profile`,body:e})},async search(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/players/search${s?"?"+s:""}`})}}}function In(i){return{async list(){return y({method:"GET",url:`${i}/friends`})},async add(e){return y({method:"POST",url:`${i}/friends`,body:e})},async remove(e){return y({method:"DELETE",url:`${i}/friends/${e.friendId}`})}}}function Tn(i){return{async list(){return y({method:"GET",url:`${i}/clubs`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/clubs/get${s?"?"+s:""}`})},async create(e){return y({method:"POST",url:`${i}/clubs`,body:e})},async update(e){return y({method:"POST",url:`${i}/clubs/update`,body:e})},async remove(e){return y({method:"DELETE",url:`${i}/clubs/${e.id}`})}}}function En(i){return{async list(){return y({method:"GET",url:`${i}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/courses/by-club${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/courses/get${s?"?"+s:""}`})},async create(e){return y({method:"POST",url:`${i}/courses`,body:e})},async update(e){return y({method:"POST",url:`${i}/courses/update`,body:e})},async updateHole(e){return y({method:"POST",url:`${i}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/courses/validate${s?"?"+s:""}`})},async remove(e){return y({method:"DELETE",url:`${i}/courses/${e.id}`})}}}function Nn(i){return{async listByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/tees/by-course${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/tees/get${s?"?"+s:""}`})},async create(e){return y({method:"POST",url:`${i}/tees`,body:e})},async update(e){return y({method:"POST",url:`${i}/tees/update`,body:e})},async remove(e){return y({method:"DELETE",url:`${i}/tees/${e.id}`})}}}function Pn(i){return{async create(e){return y({method:"POST",url:`${i}/guest-players`,body:e})}}}function Rn(i){return{async latest(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/handicap/latest${s?"?"+s:""}`})},async history(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/handicap/history${s?"?"+s:""}`})},async record(e){return y({method:"POST",url:`${i}/handicap/record`,body:e})}}}function On(i){return{async list(){return y({method:"GET",url:`${i}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/rounds/balls${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/rounds/get${s?"?"+s:""}`})},async create(e){return y({method:"POST",url:`${i}/rounds`,body:e})},async createFromDraft(e){return y({method:"POST",url:`${i}/rounds/from-draft`,body:e})},async update(e){return y({method:"POST",url:`${i}/rounds/update`,body:e})},async remove(e){return y({method:"DELETE",url:`${i}/rounds/${e.id}`})}}}function zn(i){return{async listByRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/score-events/by-round${s?"?"+s:""}`})},async append(e){return y({method:"POST",url:`${i}/score-events`,body:e})}}}function jn(i){return{async forBall(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/scorecards/for-ball${s?"?"+s:""}`})},async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/scorecards/for-round${s?"?"+s:""}`})}}}function Ln(i){return{async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/leaderboards/for-round${s?"?"+s:""}`})}}}function An(i){return{async create(e){return y({method:"POST",url:`${i}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/friendly-rounds/by-token${s?"?"+s:""}`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/friendly-rounds/balls${s?"?"+s:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/friendly-rounds/scorecard${s?"?"+s:""}`})},async result(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/friendly-rounds/result${s?"?"+s:""}`})},async score(e){return y({method:"POST",url:`${i}/friendly-rounds/score`,body:e})},async setup(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/friendly-rounds/setup${s?"?"+s:""}`})},async editSetup(e){return y({method:"POST",url:`${i}/friendly-rounds/setup`,body:e})},async remove(e){return y({method:"DELETE",url:`${i}/friendly-rounds/${e.token}`})},async finish(e){return y({method:"POST",url:`${i}/friendly-rounds/finish`,body:e})},async reopen(e){return y({method:"POST",url:`${i}/friendly-rounds/reopen`,body:e})},async join(e){return y({method:"POST",url:`${i}/friendly-rounds/join`,body:e})},async leave(e){return y({method:"POST",url:`${i}/friendly-rounds/leave`,body:e})},async claimGuest(e){return y({method:"POST",url:`${i}/friendly-rounds/claim-guest`,body:e})},async renameGuest(e){return y({method:"POST",url:`${i}/friendly-rounds/rename-guest`,body:e})},async claimSeat(e){return y({method:"POST",url:`${i}/friendly-rounds/claim-seat`,body:e})},async releaseSeat(e){return y({method:"POST",url:`${i}/friendly-rounds/release-seat`,body:e})}}}function Dn(i){return{async myRounds(){return y({method:"GET",url:`${i}/dashboard/my-rounds`})}}}function Mn(i){return{async clubs(){return y({method:"GET",url:`${i}/setup/clubs`})},async courses(){return y({method:"GET",url:`${i}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/setup/tees/by-course${s?"?"+s:""}`})},async formats(){return y({method:"GET",url:`${i}/setup/formats`})},async aggregations(){return y({method:"GET",url:`${i}/setup/aggregations`})}}}function Hn(i){return{async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/competitions/get${s?"?"+s:""}`})},async participants(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/competitions/participants${s?"?"+s:""}`})},async leaderboard(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,a]of Object.entries(e))!t.has(r)&&a!==void 0&&s.set(r,String(a));const n=s.toString();return y({method:"GET",url:`${i}/competitions/${e.id}/leaderboard${n?"?"+n:""}`})},async results(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,a]of Object.entries(e))!t.has(r)&&a!==void 0&&s.set(r,String(a));const n=s.toString();return y({method:"GET",url:`${i}/competitions/${e.id}/results${n?"?"+n:""}`})},async list(){return y({method:"GET",url:`${i}/competitions`})},async create(e){return y({method:"POST",url:`${i}/competitions`,body:e})},async update(e){return y({method:"POST",url:`${i}/competitions/update`,body:e})},async transition(e){return y({method:"POST",url:`${i}/competitions/transition`,body:e})},async createRound(e){const t=new Set(["id"]),s={};for(const[n,r]of Object.entries(e))t.has(n)||(s[n]=r);return y({method:"POST",url:`${i}/competitions/${e.id}/rounds`,body:s})},async applyCut(e){const t=new Set(["id"]),s={};for(const[n,r]of Object.entries(e))t.has(n)||(s[n]=r);return y({method:"POST",url:`${i}/competitions/${e.id}/cut`,body:s})},async finalize(e){const t=new Set(["id"]),s={};for(const[n,r]of Object.entries(e))t.has(n)||(s[n]=r);return y({method:"POST",url:`${i}/competitions/${e.id}/finalize`,body:s})},async addParticipant(e){return y({method:"POST",url:`${i}/competitions/participants/add`,body:e})},async removeParticipant(e){return y({method:"POST",url:`${i}/competitions/participants/remove`,body:e})},async withdrawParticipant(e){return y({method:"POST",url:`${i}/competitions/participants/withdraw`,body:e})}}}function Fn(i){return{async myRoles(){return y({method:"GET",url:`${i}/me/roles`})},async adminStats(){return y({method:"GET",url:`${i}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/admin/rounds${s?"?"+s:""}`})},async adminPlayers(){return y({method:"GET",url:`${i}/admin/players`})},async adminGrantRole(e){return y({method:"POST",url:`${i}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return y({method:"POST",url:`${i}/admin/roles/revoke`,body:e})}}}function Bn(i){return{async myConfig(){return y({method:"GET",url:`${i}/players/me/stats-config`})},async putMyConfig(e){return y({method:"PUT",url:`${i}/players/me/stats-config`,body:e})},async myStats(){return y({method:"GET",url:`${i}/players/me/stats`})},async appendEvents(e){return y({method:"POST",url:`${i}/friendly-rounds/stat-events`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/friendly-rounds/stats${s?"?"+s:""}`})},async configsByToken(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return y({method:"GET",url:`${i}/friendly-rounds/stats-configs${s?"?"+s:""}`})}}}const D="/tapscore/".replace(/\/+$/,"")+"/api",v={players:Cn(D),friends:In(D),clubs:Tn(D),courses:En(D),tees:Nn(D),guestPlayers:Pn(D),handicap:Rn(D),rounds:On(D),scoreEvents:zn(D),scorecards:jn(D),leaderboards:Ln(D),friendlyRounds:An(D),dashboard:Dn(D),setup:Mn(D),competitions:Hn(D),admin:Fn(D),playerStats:Bn(D)};function Gn(i){return[...i.played?["Played"]:[],...i.created?["Created"]:[]].join(" · ")}function qn(i,e){const t=new Map;for(const s of e)t.set(s.round.id,{round:s.round,token:s.friendlyRound.shareToken,played:!1,created:!0});for(const s of i){const n=t.get(s.round.id);n?n.played=!0:t.set(s.round.id,{round:s.round,token:s.shareToken,played:!0,created:!1})}return[...t.values()].sort((s,n)=>n.round.date.localeCompare(s.round.date)||s.round.id.localeCompare(n.round.id))}function Kn(i,e){return i.filter(t=>t.played&&!t.created&&!e.has(t.round.id)).slice().sort((t,s)=>s.round.date.localeCompare(t.round.date)||t.round.id.localeCompare(s.round.id))}function wt(i,e){return i.some(t=>t.round.id===e)?i.filter(t=>t.round.id!==e):i}function G(){try{return globalThis.localStorage??null}catch{return null}}function Oe(i,e,t){return{read(s=G()){if(!s)return e.empty;let n;try{n=s.getItem(i)}catch{return e.empty}if(!n)return e.empty;try{return e.decode(n)}catch{return e.empty}},write(s,n=G()){if(!n)return e.empty;const r=t!==void 0&&Array.isArray(s)?s.slice(0,t):s;try{n.setItem(i,e.encode(r))}catch{}return r}}}function nt(i){return{decode(e){const t=JSON.parse(e);return Array.isArray(t)?t.filter(i):[]},encode:e=>JSON.stringify(e),get empty(){return[]}}}const Vn=500,it=Oe("tapscore.seen-rounds.v1",nt(i=>typeof i=="string"),Vn);function rt(i=G()){return it.read(i)}function Me(i=G()){return new Set(rt(i))}function Un(i,e=G()){if(!e)return[];const t=rt(e).filter(s=>s!==i);return it.write([i,...t],e)}function ds(i,e=G()){if(!e)return[];const t=rt(e),s=t.filter(n=>n!==i);return s.length!==t.length&&it.write(s,e),s}const Wn=50,at=Oe("tapscore.device-rounds.v1",nt(Qn),Wn);function ot(i=G()){return at.read(i)}function Qn(i){if(typeof i!="object"||i===null)return!1;const e=i;return typeof e.token=="string"&&typeof e.courseName=="string"&&(e.status==="not_started"||e.status==="active"||e.status==="complete")&&typeof e.lastSeenAt=="string"}function de(i,e=G()){if(!e)return[];const t=ot(e).filter(s=>s.token!==i.token);return at.write([i,...t],e)}function cs(i,e=G()){if(!e)return[];const t=ot(e),s=t.filter(n=>n.token!==i);return s.length!==t.length&&at.write(s,e),s}class ze{mine=new p(null);mineLoading=new p(!1);mineError=new p(null);myRounds=new S(()=>{const e=this.mine.get();return e?qn(e.produced,e.created):[]});deviceRounds=new p([]);seenIds=new p(Me());newRounds=new S(()=>Kn(this.myRounds.get(),this.seenIds.get()));async loadMine(){this.seenIds.set(Me());const e=await z(this.mineLoading,this.mineError,()=>v.dashboard.myRounds());e&&this.mine.set(e)}loadDevice(){this.deviceRounds.set(ot())}clear(){this.mine.set(null),this.mineError.set(null),this.mineLoading.set(!1),this.seenIds.set(Me()),this.loadDevice()}async remove(e,t){try{await v.friendlyRounds.remove({token:e})}catch{return!1}const s=this.mine.get();return s&&this.mine.set({produced:wt(s.produced,t),created:wt(s.created,t)}),this.deviceRounds.set(cs(e)),ds(t),!0}}const Yn={DEV:!1};function Xn(i,e){return i===void 0||i===""?e:i!=="0"&&i.toLowerCase()!=="false"}const xt=Yn??{},us={competitions:Xn(xt.VITE_FEATURE_COMPETITIONS,!!xt.DEV)},Jn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v10h12V10"/><path d="M10 20v-5.5h4V20"/></svg>',Zn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M3.5 20c.5-3.5 2.7-5.5 5.5-5.5s5 2 5.5 5.5"/><circle cx="16.5" cy="9.5" r="2.8"/><path d="M16.8 14.6c2.2.4 3.5 2 3.9 4.9"/></svg>',ei='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v3a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5v2a3 3 0 0 0 3 3"/><path d="M16 5h3v2a3 3 0 0 1-3 3"/><path d="M10 12.5V15h4v-2.5"/><path d="M9 20h6"/><path d="M12 15v5"/></svg>';function ti(i){const e=[{key:"home",label:"Home",href:"/",icon:Jn},{key:"friends",label:"Friends",href:"/friends",icon:Zn}];return i.competitions&&e.push({key:"comps",label:"Comps",href:"/competitions",icon:ei}),e}const si=["/login","/round"];function hs(i){return!si.includes(i)}function ni(i,e){return e&&hs(i)}const ii=_(`
    <nav class="tabbar" bind="root"></nav>
`),ri=_(`
    <a bind="link">
        <span class="tabbar__icon">
            <span bind="icon" class="tabbar__glyph"></span>
            <span bind="badge" class="tabbar__badge"></span>
        </span>
        <span bind="label"></span>
    </a>
`);class ai extends R{static styles=`
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
                padding: ${l("sm")} 0 ${l("md")};
                color: rgba(247, 244, 234, 0.55);
                text-decoration: none;
                font-size: 0.7rem;
                font-weight: 600;
                letter-spacing: 0.06em;
                text-transform: uppercase;

                & svg { width: 26px; height: 26px; }

                & .tabbar__icon { position: relative; display: inline-flex; }
                & .tabbar__glyph { display: inline-flex; }

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
    `;router=this.inject(M);auth=this.inject(H);landing=this.inject(ze);newCount=new S(()=>this.auth.currentUser.get()?this.landing.newRounds.get().length:0);render(){const e=this.wire(ii,{root:{className:()=>ni(this.router.route.get(),this.auth.currentUser.get()!==null)?"tabbar":"tabbar hidden"}}),t=ti(us);return this.$each(this.ref(e,"root"),()=>t,(s,n,r)=>this.wireEl(ri,{link:{...this.router.link(s.href),href:s.href},icon:{innerHTML:()=>s.icon},label:()=>s.label,badge:{textContent:()=>{if(s.key!=="home")return"";const a=this.newCount.get();return a===0?"":String(a)},className:()=>(s.key==="home"?this.newCount.get():0)===0?"tabbar__badge":"tabbar__badge show"}},r),s=>s.key),e}}const ps=["tee","approach","putting","shortGame","penalties","recovery"],Ie={enabled:!1,tee:!1,approach:!1,putting:!1,shortGame:!1,penalties:!1,recovery:!1};function ms(i){switch(i){case"tee":return"Tee shots";case"approach":return"Greens in regulation";case"putting":return"Putting";case"shortGame":return"Short game";case"penalties":return"Penalties";case"recovery":return"Recovery"}}function oi(i){switch(i){case"tee":return"Fairway, in play or trouble — asked on par 4s and 5s.";case"approach":return"Did the ball hit the green in regulation.";case"putting":return"How long the first putt was, and how many you took.";case"shortGame":return"Standard or hard, asked only when you missed the green.";case"penalties":return"How many penalty strokes the hole cost you.";case"recovery":return"Whether the recovery shot got you back in play."}}const li="Track statistics",di="Adds a few taps per hole while you score — turn it off any time, your picks are kept.";function fs(i){switch(i){case"shortGame":return"putting";case"recovery":return"tee";default:return null}}function Ne(i,e){return i[e]}function ci(i,e){if(!i.enabled)return!0;const t=fs(e);return t===null?!1:!Ne(i,t)}function ui(i,e){if(!i.enabled)return null;const t=fs(e);return t===null||Ne(i,t)?null:`Needs ${ms(t)}`}function hi(i,e,t){return mi({...i,[e]:t})}function pi(i,e){return{...i,enabled:e}}function mi(i){const e={...i};return e.putting||(e.shortGame=!1),e.tee||(e.recovery=!1),e}function He(i){const e={...Ie,enabled:i.enabled};for(const t of ps)e[t]=i[t];return e}class je{loading=new p(!1);error=new p(null);player=new p(null);history=new p([]);clubs=new p([]);saving=new p(!1);saveError=new p(null);statsConfig=new p(Ie);statsSaving=new p(!1);statsError=new p(null);async load(e=!1){if(!e&&(this.player.get()!==null||this.loading.get()))return;const t=await z(this.loading,this.error,()=>Promise.all([v.players.me(),v.players.myHandicapHistory(),v.clubs.list(),v.playerStats.myConfig().catch(()=>null)]));if(!t)return;const[s,n,r,a]=t;this.player.set(s),this.history.set(n),this.clubs.set(r),this.statsConfig.set(a?He(a):Ie)}clear(){this.player.set(null),this.history.set([]),this.error.set(null),this.saveError.set(null),this.statsConfig.set(Ie),this.statsError.set(null)}async saveIndex(e){return await z(this.saving,this.saveError,()=>v.players.updateHandicap({handicapIndex:e}))?(await this.load(!0),!0):!1}async saveGender(e){const t=await z(this.saving,this.saveError,()=>v.players.updateProfile({gender:e}));return t?(this.player.set(t),!0):!1}async saveHomeClub(e){const t=await z(this.saving,this.saveError,()=>v.players.updateProfile({homeClubId:e}));return t?(this.player.set(t),!0):!1}async saveStatsConfig(e){if(this.statsSaving.get()||this.saving.get())return!1;const t=await z(this.statsSaving,this.statsError,()=>v.playerStats.putMyConfig(He(e)));return t?(this.statsConfig.set(He(t)),!0):!1}homeClubName(){const e=this.player.get()?.homeClubId;return e?this.clubs.get().find(t=>t.id===e)?.name??null:null}}function Fe(i,e){return i.displayName.localeCompare(e.displayName,"sv",{sensitivity:"base"})}function lt(i,e="frecency"){return e==="alpha"?[...i].sort(Fe):[...i].sort((t,s)=>{const n=t.frecency,r=s.frecency,a=n>0,d=r>0;if(a!==d)return a?-1:1;if(!a)return Fe(t,s);if(r!==n)return r-n;const c=t.lastPlayedAt?Date.parse(t.lastPlayedAt):NaN,u=s.lastPlayedAt?Date.parse(s.lastPlayedAt):NaN,f=Number.isNaN(c)?Number.NEGATIVE_INFINITY:c,m=Number.isNaN(u)?Number.NEGATIVE_INFINITY:u;return m!==f?m-f:Fe(t,s)})}const fi=1440*60*1e3;function gi(i,e){if(!i)return null;const t=Date.parse(i),s=Date.parse(e);if(Number.isNaN(t)||Number.isNaN(s))return null;const n=Math.floor((s-t)/fi);if(n<=0)return"today";if(n===1)return"yesterday";if(n<7)return`${n} days ago`;if(n<14)return"last week";if(n<30)return`${Math.floor(n/7)} weeks ago`;if(n<60)return"last month";if(n<365)return`${Math.floor(n/30)} months ago`;const r=Math.floor(n/365);return r===1?"last year":`${r} years ago`}function bi(i,e){if(i.sharedRoundCount<=0)return"never played";const t=gi(i.lastPlayedAt,e),s=`played ${i.sharedRoundCount}×`;return t?`${s}, ${t}`:s}const gs=2;function $t(i){return i.trim().length>=gs}function bs(i){return lt(i,"frecency")}function yi(i,e){return bs([...i.filter(t=>t.id!==e.id),e])}function _i(i,e){return i.filter(t=>t.id!==e)}function kt(i,e,t){return i.map(s=>s.id===e?{...s,isFriend:t}:s)}function vi(i,e,t=()=>{},s=300){let n=0,r;return a=>{const d=a.trim(),c=++n;if(r!==void 0&&clearTimeout(r),r=void 0,d.length<gs){e(d,[]);return}r=setTimeout(()=>{i(d).then(u=>{c===n&&e(d,u)},u=>{c===n&&t(d,u)})},s)}}const ys=Oe("tapscore.friends.sort.v1",{decode:i=>i==="alpha"?"alpha":"frecency",encode:i=>i,empty:"frecency"});function wi(i=G()){return ys.read(i)}function xi(i,e=G()){ys.write(i,e)}class Le{loading=new p(!1);error=new p(null);friends=new p([]);loaded=new p(!1);sortMode=new p(wi());query=new p("");searching=new p(!1);searchError=new p(null);results=new p([]);resultsFor=new p("");mutating=new p(!1);mutateError=new p(null);runSearch=vi(e=>v.players.search({q:e}),(e,t)=>{this.searching.set(!1),this.results.set(t),this.resultsFor.set(e)},(e,t)=>{this.searching.set(!1),this.results.set([]),this.resultsFor.set(e),this.searchError.set({code:"network",message:t instanceof Error?t.message:"Search failed. Try again."})});async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;const t=await z(this.loading,this.error,()=>v.friends.list());t&&(this.friends.set(bs(t)),this.loaded.set(!0))}setQuery(e){this.query.set(e),this.searchError.set(null),this.searching.set(e.trim().length>=2),this.runSearch(e)}async add(e){await z(this.mutating,this.mutateError,()=>v.friends.add({friendId:e.id}))&&(this.friends.set(yi(this.friends.get(),{id:e.id,username:e.username,displayName:e.displayName,gender:e.gender,handicapIndex:e.handicapIndex,homeClubName:e.homeClubName,sharedRoundCount:0,lastPlayedAt:null,frecency:0})),this.results.set(kt(this.results.get(),e.id,!0)))}setSortMode(e){this.sortMode.set(e),xi(e)}async remove(e){await z(this.mutating,this.mutateError,()=>v.friends.remove({friendId:e}))&&(this.friends.set(_i(this.friends.get(),e)),this.results.set(kt(this.results.get(),e,!1)))}clear(){this.friends.set([]),this.loaded.set(!1),this.query.set(""),this.results.set([]),this.resultsFor.set(""),this.error.set(null),this.searchError.set(null),this.mutateError.set(null),this.searching.set(!1)}}class _s{roles=new p([]);rolesLoaded=!1;loading=new p(!1);error=new p(null);stats=new p(null);rounds=new p([]);players=new p([]);isSuperAdmin(){return this.roles.get().some(e=>e.role==="super_admin"&&e.scopeType===null)}async loadRoles(e=!1){if(!(!e&&this.rolesLoaded)){this.rolesLoaded=!0;try{this.roles.set(await v.admin.myRoles())}catch{this.roles.set([])}}}clear(){this.roles.set([]),this.rolesLoaded=!1,this.stats.set(null),this.rounds.set([]),this.players.set([]),this.error.set(null)}async load(e=!1){if(!e&&this.stats.get()!==null)return;const t=await z(this.loading,this.error,()=>Promise.all([v.admin.adminStats(),v.admin.adminRounds({limit:100}),v.admin.adminPlayers()]));if(!t)return;const[s,n,r]=t;this.stats.set(s),this.rounds.set(n),this.players.set(r)}}async function $i(i){await i.auth.logout(),i.profile.clear(),i.friends.clear(),i.admins.clear(),i.landing.clear(),i.navigate("/")}function ki(i){if(!i.signedIn)return[];const e=[{kind:"identity",displayName:(i.displayName??"").trim()||(i.username??"").trim()||"Signed in",username:(i.username??"").trim()},{kind:"profile",label:"Profile"}];return i.isSuperAdmin&&e.push({kind:"admin",label:"Admin"}),e.push({kind:"signout",label:"Sign out"}),e}function Si(i){return ki(i).map(e=>e.kind)}function St(i){return i.signedIn?"avatar":"signin"}function Ci(i,e){const t=(i??"").trim().split(/\s+/).filter(n=>n.length>0);if(t.length>=2)return(we(t[0])+we(t[t.length-1])).toUpperCase();if(t.length===1)return we(t[0]).toUpperCase();const s=(e??"").trim();return s.length>0?we(s).toUpperCase():"•"}function we(i){return[...i][0]??""}const Ii=_(`
    <div class="acct" bind="root">
        <button bind="signin" class="acct__signin" type="button">Sign in</button>
        <button bind="avatar" class="acct__avatar" type="button" aria-label="Account"></button>
        <div bind="menu" class="acct__menu">
            <div class="acct__identity">
                <span class="acct__identity-label">Signed in as</span>
                <span bind="idName" class="acct__identity-name"></span>
                <span bind="idUser" class="acct__identity-user"></span>
            </div>
            <div class="acct__actions" role="group" aria-label="Account">
                <button bind="profile" class="acct__row" type="button">Profile</button>
                <button bind="admin" class="acct__row" type="button">Admin</button>
                <button bind="signout" class="acct__row acct__row--quiet" type="button">Sign out</button>
            </div>
        </div>
    </div>
`);class Ti extends R{static styles=`
        .acct {
            position: relative;
            display: flex;
            justify-content: flex-end;

            & .acct__signin {
                padding: ${l("xs")} ${l("md")};
                background: none;
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-pill")};
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 700;
                color: ${o("text")};
                cursor: pointer;

                &:hover { background: ${o("hover-bg")}; }
                &.hidden { display: none; }
            }

            & .acct__avatar {
                width: 38px;
                height: 38px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                background: ${o("primary")};
                color: ${o("primary-text")};
                border: none;
                border-radius: ${o("radius-pill")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 800;
                letter-spacing: 0.02em;
                cursor: pointer;
                box-shadow: ${o("shadow")};

                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
                &.hidden { display: none; }
            }

            & .acct__menu {
                position: absolute;
                top: calc(100% + ${l("xs")});
                right: 0;
                z-index: 20;
                min-width: 208px;
                padding: ${l("xs")};
                background: ${o("surface")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius")};
                box-shadow: ${o("shadow-elevated")};
                text-align: left;

                &.hidden { display: none; }

                & .acct__identity {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    padding: ${l("sm")} ${l("md")} ${l("md")};
                    border-bottom: 1px solid ${o("border")};
                    margin-bottom: ${l("xs")};

                    & .acct__identity-label {
                        font-size: 0.68rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        color: ${o("text-muted")};
                    }
                    & .acct__identity-name {
                        font-weight: 700;
                        font-size: 0.98rem;
                        color: ${o("text")};
                    }
                    & .acct__identity-user {
                        font-size: 0.82rem;
                        color: ${o("text-muted")};
                        &:empty { display: none; }
                    }
                }

                & .acct__row {
                    display: block;
                    width: 100%;
                    padding: ${l("sm")} ${l("md")};
                    background: none;
                    border: none;
                    border-radius: ${o("radius-sm")};
                    text-align: left;
                    font-family: inherit;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: ${o("text")};
                    cursor: pointer;

                    &:hover { background: ${o("hover-bg")}; }
                    &.acct__row--quiet { color: ${o("text-muted")}; }
                    &.hidden { display: none; }
                }
            }
        }
    `;auth=this.inject(H);profile=this.inject(je);friends=this.inject(Le);admins=this.inject(_s);landing=this.inject(ze);router=this.inject(M);open=new p(!1);state=new S(()=>({signedIn:this.auth.currentUser.get()!==null,displayName:this.profile.player.get()?.displayName??null,username:this.profile.player.get()?.username??this.auth.currentUser.get()?.username??null,isSuperAdmin:this.admins.isSuperAdmin()}));has(e){return Si(this.state.get()).includes(e)}rowClass(e,t=""){const s=`acct__row${t}`;return this.has(e)?s:`${s} hidden`}render(){this.auth.currentUser.get()&&(this.profile.load(),this.admins.loadRoles());const e=this.wire(Ii,{signin:{className:()=>St(this.state.get())==="signin"?"acct__signin":"acct__signin hidden",onclick:()=>{this.open.set(!1),this.router.navigate("/login")}},avatar:{className:()=>St(this.state.get())==="avatar"?"acct__avatar":"acct__avatar hidden",textContent:()=>{const u=this.state.get();return Ci(u.displayName,u.username)},"aria-expanded":()=>this.open.get()?"true":"false",onclick:()=>this.open.set(!this.open.get())},menu:{className:()=>this.open.get()&&this.has("identity")?"acct__menu":"acct__menu hidden"},idName:()=>{const u=this.state.get();return(u.displayName??"").trim()||(u.username??"").trim()||"Signed in"},idUser:()=>{const u=(this.state.get().username??"").trim();return u===""?"":`@${u}`},profile:{className:()=>this.rowClass("profile"),onclick:()=>{this.open.set(!1),this.router.navigate("/profile")}},admin:{className:()=>this.rowClass("admin"),onclick:()=>{this.open.set(!1),this.router.navigate("/admin")}},signout:{className:()=>this.rowClass("signout"," acct__row--quiet"),onclick:async()=>{this.open.set(!1),await $i({auth:this.auth,profile:this.profile,friends:this.friends,admins:this.admins,landing:this.landing,navigate:u=>this.router.navigate(u)})}}}),t=this.ref(e,"root"),s=e.querySelector('[bind="avatar"]'),n=u=>{u.key==="Escape"&&this.open.get()&&(this.open.set(!1),s?.focus())},r=u=>{if(!this.open.get())return;const f=u.target;f instanceof Node&&t.contains(f)||this.open.set(!1)};let a=!1;const d=()=>{a||(a=!0,window.addEventListener("keydown",n),document.addEventListener("pointerdown",r,!0))},c=()=>{a&&(a=!1,window.removeEventListener("keydown",n),document.removeEventListener("pointerdown",r,!0))};return this.track(N(()=>{this.open.get()?d():c()})),this.track(c),e}}const pt=class pt extends R{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(N(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};pt.styles=`
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
    `;let Ze=pt;const T=i=>`var(--${i})`,mt=class mt extends R{render(){const e=document.createElement("div"),t=(c,u)=>{typeof u=="function"?this.track(N(()=>{c.textContent=u()})):c.textContent=u};this.spawn(Ze,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const s=document.createElement("h2");s.className="ui-confirm__title",t(s,this.props.title??"Confirm"),this.dialogEl.appendChild(s);const n=document.createElement("p");n.className="ui-confirm__message",t(n,this.props.message),this.dialogEl.appendChild(n);const r=document.createElement("div");r.className="ui-confirm__actions";const a=document.createElement("button");a.className="ui-confirm__btn ui-confirm__btn--cancel",t(a,this.props.cancelLabel??"Cancel"),a.addEventListener("click",c=>{c.stopPropagation(),this.handleCancel()}),r.appendChild(a);const d=document.createElement("button");return d.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(d,this.props.confirmLabel??"Confirm"),d.addEventListener("click",c=>{c.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),r.appendChild(d),this.dialogEl.appendChild(r),this.dialogEl.addEventListener("click",c=>c.stopPropagation()),e.appendChild(this.dialogEl),this.track(N(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};mt.styles=`
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${T("surface")};
            border: 1px solid ${T("border")};
            border-radius: ${T("radius-md")};
            box-shadow: ${T("shadow-3")};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition:
                opacity ${T("dur-slow")} ${T("ease-standard")},
                transform ${T("dur-slow")} ${T("ease-standard")};
        }
        .ui-confirm.open {
            opacity: 1;
            pointer-events: auto;
            transform: translate(-50%, -50%) scale(1);
        }
        /* A dialog title is one of the places the serif is allowed (§02). */
        .ui-confirm__title {
            padding: 16px 20px 0;
            margin: 0;
            font-family: ${T("font-display")};
            font-size: 1.25rem;
            font-weight: 500;
            line-height: 1.4;
            color: ${T("text")};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-family: ${T("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${T("text")};
        }
        .ui-confirm__actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 0 20px 16px;
        }
        /*
         * Buttons are Open Sans territory — the serif is forbidden here (§02).
         *
         * TIERS, not two matching boxes. The pair used to be a --surface-2
         * bordered cancel beside a filled confirm, which is the OS-dialog
         * shape §4.12 names as the thing being fixed: two equally-weighted
         * boxes make the reader stop and compare labels. Cancel is now the
         * ghost tier — no fill, no visible border — so the dialog has exactly
         * one button that looks like a button, and it is the one that acts.
         *
         * The transparent 1px border on the base is load-bearing: it keeps all
         * three variants the same box size, so nothing shifts between them.
         */
        .ui-confirm__btn {
            padding: 9px 20px;
            font-size: 13px;
            line-height: 20px;
            font-family: ${T("font-ui")};
            font-weight: 600;
            border: 1px solid transparent;
            border-radius: ${T("radius-sm")};
            cursor: pointer;
            transition:
                background ${T("dur-fast")} ${T("ease-standard")},
                border-color ${T("dur-fast")} ${T("ease-standard")},
                color ${T("dur-fast")} ${T("ease-standard")},
                box-shadow ${T("dur-fast")} ${T("ease-standard")};
        }
        .ui-confirm__btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px ${T("accent-soft")};
        }
        .ui-confirm__btn--cancel {
            background: transparent;
            color: ${T("text-muted")};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${T("accent-soft")};
            color: ${T("accent")};
        }
        .ui-confirm__btn--confirm {
            background: ${T("accent")};
            color: ${T("on-accent")};
            border-color: ${T("accent")};
            box-shadow: ${T("shadow-1")};
        }
        .ui-confirm__btn--confirm:hover {
            background: ${T("accent-strong")};
            border-color: ${T("accent-strong")};
        }
        /* Outline, filling only on hover — same reasoning as css.ts danger. */
        .ui-confirm__btn--danger {
            background: transparent;
            color: ${T("danger")};
            border-color: ${T("danger")};
        }
        .ui-confirm__btn--danger:hover {
            background: ${T("danger")};
            color: ${T("on-danger")};
        }
    `;let U=mt;function Ei(i){const e=typeof navigator<"u"?navigator.language:void 0;return typeof e=="string"&&e.toLowerCase().startsWith("sv")?"sv":"en"}function re(){return Ei()}const Te=10;class fe{loading=new p(!1);error=new p(null);descriptors=new p([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await z(this.loading,this.error,()=>v.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=re()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:s.teamSize?.min??2,max:s.teamSize?.max??2},...s.teamCount?{teamCount:s.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}configLabelOf(e,t=re()){return e.labels?.[t]??e.labels?.en??""}presets(e=re()){return this.descriptors.get().filter(s=>s.preset).sort((s,n)=>{const r=s.preset?.rank??Number.POSITIVE_INFINITY,a=n.preset?.rank??Number.POSITIVE_INFINITY;return r!==a?r-a:(this.labelOf(s,e)??s.id).localeCompare(this.labelOf(n,e)??n.id)})}taglineOf(e,t=re()){const n=(typeof e=="string"?this.byId(e):e)?.preset?.tagline;return n?.[t]??n?.en??""}playableShape(e){const t=e.requirements.balls;if(t.ballMode==="team")return{count:this.ballCountOf(t.slotBallCount),size:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{},n=s.teamCount??{};return{count:{min:n.min??2,...n.max!==void 0?{max:n.max}:{}},size:{min:s.teamSize?.min??2,max:s.teamSize?.max??2}}}if(t.slotBallCount){const s=this.acceptsSideSubjects(e);return{count:this.ballCountOf(t.slotBallCount),size:{min:1,max:s?Te:1}}}return{count:{min:1},size:{min:1,max:1}}}ballCountOf(e){return{min:e?.min??2,...e?.max!==void 0?{max:e.max}:{}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}acceptsSideSubjects(e){const t=typeof e=="string"?this.byId(e):e;return!t||this.classify(t).kind==="team_grouping"?!1:(t.requirements.scoreEntry?.metadata?.length??0)===0}}function vs(i){const e=B.get(fe);return e.load(),e.labelOf(i.formatId)??`${i.scoringMode} · ${i.teamShape}`}function Ni(i){return i.map(e=>({key:e.round.id,token:e.token,roundId:e.round.id,courseName:e.round.courseNameSnapshot??"",status:e.round.status,completedAt:e.round.completedAt,lastActivityAt:e.round.date,roleLabel:Gn(e)||null,date:e.round.date,formats:e.round.formatSlots.map(vs).join(" · ")}))}function Pi(i){return i.map(e=>({key:e.token,token:e.token,roundId:null,courseName:e.courseName,status:e.status,completedAt:e.completedAt??null,lastActivityAt:e.lastSeenAt,roleLabel:null,date:null,formats:null}))}const he={fromMyRounds:Ni,fromDeviceRounds:Pi},Ri=14,Oi=1440*60*1e3;function oe(i,e){return e(i)}function zi(i,e,t,s=Ri){const n=e-s*Oi,r=[],a=[];for(const d of i){const c=oe(d,t);if(c.status==="complete"){const u=c.completedAt?Date.parse(c.completedAt):NaN;(Number.isNaN(u)||u>=n)&&a.push(d)}else r.push(d)}return r.sort((d,c)=>Ct(oe(d,t).lastActivityAt,oe(c,t).lastActivityAt)),a.sort((d,c)=>Ct(oe(d,t).completedAt,oe(c,t).completedAt)),{ongoing:r,finished:a}}function Ct(i,e){const t=i?Date.parse(i):NaN,s=e?Date.parse(e):NaN,n=Number.isNaN(t)?Number.NEGATIVE_INFINITY:t,r=Number.isNaN(s)?Number.NEGATIVE_INFINITY:s;return n===r?0:r-n}const ji=_(`
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
        <div bind="confirmHost"></div>
    </div>
`),Li='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',Ai=_(`
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
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${Li}</button>
    </div>
`),ws={not_started:"Not started",active:"Live",complete:"Finished"};class It extends R{static styles=`
        .landing {
            /* The account surface is in the app shell's header, above this
               screen — the landing hosts nothing account-shaped itself. */
            padding: ${l("lg")} ${l("lg")} ${l("2xl")};

            & .landing__head {
                text-align: center;
                margin-bottom: ${l("xl")};

                & .landing__flag { font-size: 2.2rem; line-height: 1; }
                & h1 {
                    margin: ${l("xs")} 0 0;
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 2.2rem;
                    letter-spacing: -0.02em;
                    color: ${o("text")};
                }
                & p {
                    margin: ${l("xs")} 0 0;
                    color: ${o("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .landing__create {
                ${I()}
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
                background: ${o("primary")};
                color: ${o("primary-text")};
                border: none;
                box-shadow: ${o("shadow-elevated")};
                &:hover { background: ${o("primary")}; }

                & .landing__create-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .landing__section-block {
                margin-bottom: ${l("xl")};
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
                gap: ${l("sm")};
                margin-bottom: ${l("sm")};

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
                padding: ${l("lg")} 0;

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
                gap: ${l("sm")};
            }

            & .round-row {
                display: flex;
                align-items: stretch;
                ${L({hover:!0})}

                & .round-row__main {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${l("xs")};
                    padding: ${l("md")} 0 ${l("md")} ${l("lg")};
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
                    gap: ${l("md")};
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
                    gap: ${l("md")};
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
                margin: ${l("sm")} auto 0;
                padding: ${l("sm")} ${l("lg")};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${o("accent")};
                cursor: pointer;

                &.hidden { display: none; }
            }

        }

        /* App-level accessibility override for the framework confirm dialog. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;svc=this.inject(ze);auth=this.inject(H);router=this.inject(M);loggedIn=new S(()=>this.auth.currentUser.get()!==null);rows=new S(()=>this.loggedIn.get()?he.fromMyRounds(this.svc.myRounds.get()):he.fromDeviceRounds(this.svc.deviceRounds.get()));parts=new S(()=>zi(this.rows.get(),Date.now(),e=>e));ongoing=new S(()=>this.parts.get().ongoing);finished=new S(()=>this.parts.get().finished);newRows=new S(()=>this.loggedIn.get()?he.fromMyRounds(this.svc.newRounds.get()):[]);deleteOpen=new p(!1);deleteTarget=new p(null);askDelete(e,t,s){this.deleteTarget.set({token:e,roundId:t,name:s}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?this.svc.loadMine():this.svc.loadDevice();const e=()=>this.rows.get().length>0,t=this.wire(ji,{createBtn:{onclick:()=>this.router.navigate("/create")},history:{className:()=>e()?"landing__history":"landing__history hidden",onclick:()=>this.router.navigate("/history")},newSection:{className:()=>this.newRows.get().length>0?"landing__section-block landing__new":"landing__section-block landing__new hidden"},newCount:()=>{const n=this.newRows.get().length;return n===0?"":String(n)},ongoingSection:{className:()=>this.ongoing.get().length>0?"landing__section-block":"landing__section-block hidden"},ongoingCount:()=>{const n=this.ongoing.get().length;return n===0?"":String(n)},finishedSection:{className:()=>this.finished.get().length>0?"landing__section-block":"landing__section-block hidden"},finishedCount:()=>{const n=this.finished.get().length;return n===0?"":String(n)},empty:{className:()=>e()?"landing__empty hidden":"landing__empty"}});this.$each(this.ref(t,"newList"),this.newRows,(n,r,a)=>this.roundRow(n,a),n=>n.key),this.$each(this.ref(t,"ongoingList"),this.ongoing,(n,r,a)=>this.roundRow(n,a),n=>n.key),this.$each(this.ref(t,"finishedList"),this.finished,(n,r,a)=>this.roundRow(n,a),n=>n.key),this.spawn(U,this.ref(t,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const n=this.deleteTarget.get();return`Delete ${n?`“${n.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const n=this.deleteTarget.get();n&&this.svc.remove(n.token,n.roundId)}});const s=n=>{n.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",s),this.track(()=>window.removeEventListener("keydown",s)),t}roundRow(e,t){return this.wireEl(Ai,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},course:()=>e.courseName||"Round",role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>ws[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>e.date??"",formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",e.courseName||"this round")}}},t)}}function Di(i){return[...i].sort((e,t)=>{const s=Tt(e),n=Tt(t);return n!==s?n-s:e.key.localeCompare(t.key)})}function Tt(i){const e=i.completedAt??i.lastActivityAt,t=e?Date.parse(e):NaN;return Number.isNaN(t)?Number.NEGATIVE_INFINITY:t}const Mi=_(`
    <div class="history">
        <button bind="back" class="history__back" type="button">← Home</button>
        <h1 class="history__title">All rounds</h1>
        <div bind="empty" class="history__empty">No rounds yet — create one to tee off.</div>
        <div bind="list" class="history__list"></div>
        <div bind="confirmHost"></div>
    </div>
`),Hi='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',Fi=_(`
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
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${Hi}</button>
    </div>
`);class Bi extends R{static styles=`
        .history {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .history__back {
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 600;
                color: ${o("text-muted")};
                cursor: pointer;
                padding: ${l("xs")} 0;
                margin-bottom: ${l("md")};
            }

            & .history__title {
                margin: 0 0 ${l("lg")};
                font-family: ${o("font-display")};
                font-weight: 600;
                font-size: 1.8rem;
                letter-spacing: -0.02em;
                color: ${o("text")};
            }

            & .history__empty {
                color: ${o("text-muted")};
                font-size: 0.9rem;
                padding: ${l("lg")} 0;
                &.hidden { display: none; }
            }

            & .history__list {
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
            }

            & .round-row {
                display: flex;
                align-items: stretch;
                ${L({hover:!0})}

                & .round-row__main {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${l("xs")};
                    padding: ${l("md")} 0 ${l("md")} ${l("lg")};
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
                    gap: ${l("md")};
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
                    gap: ${l("md")};
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
    `;svc=this.inject(ze);auth=this.inject(H);router=this.inject(M);loggedIn=new S(()=>this.auth.currentUser.get()!==null);rows=new S(()=>Di(this.loggedIn.get()?he.fromMyRounds(this.svc.myRounds.get()):he.fromDeviceRounds(this.svc.deviceRounds.get())));deleteOpen=new p(!1);deleteTarget=new p(null);askDelete(e,t,s){this.deleteTarget.set({token:e,roundId:t,name:s}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?this.svc.loadMine():this.svc.loadDevice();const e=this.wire(Mi,{back:{onclick:()=>this.router.navigate("/")},empty:{className:()=>this.rows.get().length===0?"history__empty":"history__empty hidden"}});this.$each(this.ref(e,"list"),this.rows,(s,n,r)=>this.roundRow(s,r),s=>s.key),this.spawn(U,this.ref(e,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const s=this.deleteTarget.get();return`Delete ${s?`“${s.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const s=this.deleteTarget.get();s&&this.svc.remove(s.token,s.roundId)}});const t=s=>{s.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t)),e}roundRow(e,t){return this.wireEl(Fi,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},course:()=>e.courseName||"Round",role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>ws[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>e.date??"",formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",e.courseName||"this round")}}},t)}}function xs(i){return i.handicapIndex*(i.slope/113)+(i.courseRating-i.par)}function Gi(i){return Math.round(xs(i))}function qi(i,e,t){const s=t;if(s<=0)return 0;if(i>=0){const c=Math.floor(i/s),u=i-c*s;return c+(e>=1&&e<=u?1:0)}const n=-i,r=Math.floor(n/s),a=n-r*s,d=r+(e>s-a?1:0);return d===0?0:-d}const Ki=180,Et=4,Vi=12;function ae(i,e){return e<=0?0:Math.max(0,Math.min(e-1,i))}function Ui(i){const{dragDistance:e,velocity:t,itemWidth:s}=i;if(Math.abs(e)<Vi)return 0;const n=e+t*Ki,r=Math.round(-n/s);return Math.max(-Et,Math.min(Et,r))}const Nt="tapscore:pending-scores:v1",Wi=336*60*60*1e3,Pt=200;function Qi(){try{return globalThis.localStorage??null}catch{return null}}function Yi(i){if(typeof i!="object"||i===null)return!1;const e=i;return typeof e.token=="string"&&typeof e.ballId=="string"&&typeof e.playHoleId=="string"&&(typeof e.strokes=="number"||e.strokes===null)&&(e.eventType==="score_entered"||e.eventType==="score_cleared")&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class Xi{entries=[];storage;constructor(e=Qi(),t=Date.now()){this.storage=e,this.entries=this.load();const s=this.applyHygiene(t);s.length!==this.entries.length&&(this.entries=s,this.persist())}enqueue(e){const t=this.entries.findIndex(s=>s.token===e.token&&s.ballId===e.ballId&&s.playHoleId===e.playHoleId);t>=0?this.entries[t]=e:this.entries.push(e),this.entries=this.applyHygiene(e.queuedAt),this.persist()}remove(e){const t=this.entries.filter(s=>s.clientEventId!==e);t.length!==this.entries.length&&(this.entries=t,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(s=>e-s.queuedAt<=Wi);return t.length>Pt?t.slice(t.length-Pt):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(Nt);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(Yi):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(Nt,JSON.stringify(this.entries))}catch{}}}const Q=["tee_result","recovery_ok","gir","short_game_difficulty","first_putt","putts","penalties"],Ji={minPar:4},Zi={tee_result:"Tee shot",recovery_ok:"Recovery",gir:"Green in regulation",short_game_difficulty:"Short game",first_putt:"First putt",putts:"Putts",penalties:"Penalties"},er={tee_result:{kind:"segments",options:[{value:"fairway",label:"Fairway"},{value:"in_play",label:"In play"},{value:"trouble",label:"Trouble"}]},gir:{kind:"segments",options:[{value:"0",label:"Miss"},{value:"1",label:"Hit"}]},first_putt:{kind:"segments",options:[{value:"inside_1m",label:"< 1m"},{value:"1_to_2m",label:"1–2m"},{value:"2_to_4m",label:"2–4m"},{value:"4_to_8m",label:"4–8m"},{value:"over_8m",label:"> 8m"}]},short_game_difficulty:{kind:"segments",options:[{value:"standard",label:"Standard"},{value:"hard",label:"Hard"}]},recovery_ok:{kind:"segments",options:[{value:"0",label:"No"},{value:"1",label:"Yes"}]},putts:{kind:"stepper",min:0,max:3},penalties:{kind:"stepper",min:0,max:null}};function tr(i){return Zi[i]}function Rt(i){return er[i]}function sr(i,e){return e!==null&&i>=e?`${i}+`:`${i}`}function $s(i,e,t){return i?!(i.minPar!=null&&e<i.minPar||i.maxPar!=null&&e>i.maxPar||i.pars!=null&&!i.pars.includes(e)||i.holes!=null&&!i.holes.includes(t)):!0}class nr{modules;par;holeNumber;persistedMap;draft=new Map;constructor(e,t,s,n={},r=new Map){this.modules=e,this.par=t,this.holeNumber=s,this.persistedMap=Ot(n),this.draft=new Map(r),this.prune()}refresh(e,t){const s=this.signature();return this.modules=e,this.persistedMap=Ot(t),this.prune(),this.signature()!==s}signature(){let e="";for(const t of Q)e+=`${t}:${this.visibility(t)}:${this.value(t)??""};`;return e}get prompts(){const e=[];for(const t of Q)this.isVisible(t)&&e.push({key:t,label:tr(t),control:Rt(t)});return e}get isEmpty(){return this.prompts.length===0}visibility(e){switch(e){case"tee_result":return this.modules.tee&&$s(Ji,this.par,this.holeNumber)?"visible":"unreadable";case"recovery_ok":return!this.modules.recovery||this.visibility("tee_result")!=="visible"?"unreadable":this.value("tee_result")==="trouble"?"visible":"contradicted";case"gir":return this.modules.approach?"visible":"unreadable";case"short_game_difficulty":return!this.modules.shortGame||this.visibility("gir")!=="visible"?"unreadable":this.value("gir")==="0"?"visible":"contradicted";case"first_putt":case"putts":return this.modules.putting?"visible":"unreadable";case"penalties":return this.modules.penalties?"visible":"unreadable"}}isVisible(e){return this.visibility(e)==="visible"}value(e){const t=this.draft.get(e);return t===void 0?this.persistedMap.get(e)??null:"set"in t?t.set:null}intValue(e){const t=this.value(e);if(t===null)return null;const s=Number.parseInt(t,10);return Number.isNaN(s)?null:s}isAnswered(e){return this.value(e)!==null}answer(e,t){this.isVisible(e)&&(this.record(e,t),this.prune())}step(e,t){const s=Rt(e);if(!this.isVisible(e)||s.kind!=="stepper")return;let n=(this.intValue(e)??s.min)+t;n<s.min&&(n=s.min),s.max!==null&&n>s.max&&(n=s.max),this.record(e,String(n)),this.prune()}record(e,t){if(t!==null){this.persistedMap.get(e)===t?this.draft.delete(e):this.draft.set(e,{set:t});return}this.persistedMap.get(e)===void 0?this.draft.delete(e):this.draft.set(e,{cleared:!0})}prune(){for(let e=0;e<Q.length;e++){let t=!1;for(const s of Q){const n=this.draft.get(s),r=this.visibility(s);r!=="visible"&&(r==="contradicted"?this.record(s,null):this.draft.delete(s),ir(n,this.draft.get(s))||(t=!0))}if(!t)return}}get batch(){const e=[];for(const t of Q){const s=this.draft.get(t);s!==void 0&&e.push({key:t,value:"set"in s?s.set:null})}return e}commitDraft(){for(const[e,t]of this.draft)"set"in t?this.persistedMap.set(e,t.set):this.persistedMap.delete(e);this.draft.clear()}}function ir(i,e){return i===void 0||e===void 0?i===e:"set"in i?"set"in e&&i.set===e.set:!("set"in e)}function Ot(i){if(i instanceof Map)return new Map(i);const e=new Map;for(const t of Q){const s=i[t];s!==void 0&&e.set(t,s)}return e}const zt="tapscore:pending-stat-events:v1",rr=336*60*60*1e3,jt=500;function ar(){try{return globalThis.localStorage??null}catch{return null}}function or(){try{return crypto.randomUUID()}catch{return`stat-${Date.now()}-${Math.random().toString(36).slice(2)}`}}function lr(i){if(typeof i!="object"||i===null)return!1;const e=i;return typeof e.token=="string"&&typeof e.playHoleId=="string"&&typeof e.playerId=="string"&&typeof e.key=="string"&&Q.includes(e.key)&&(typeof e.value=="string"||e.value===null)&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class dr{entries=[];storage;makeId;constructor(e=ar(),t=Date.now(),s=or){this.storage=e,this.makeId=s,this.entries=this.load();const n=this.applyHygiene(t);n.length!==this.entries.length&&(this.entries=n,this.persist())}enqueueBatch(e,t,s,n,r=Date.now()){if(n.length===0)return[];const a=[];for(const d of n){const c={token:e,playHoleId:t,playerId:s,key:d.key,value:d.value,clientEventId:this.makeId(),queuedAt:r},u=this.entries.findIndex(f=>f.token===e&&f.playHoleId===t&&f.playerId===s&&f.key===d.key);u>=0?this.entries[u]=c:this.entries.push(c),a.push(c)}return this.entries=this.applyHygiene(r),this.persist(),a}ack(e){if(e.length===0)return;const t=new Set(e),s=this.entries.filter(n=>!t.has(n.clientEventId));s.length!==this.entries.length&&(this.entries=s,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(s=>e-s.queuedAt<=rr);return t.length>jt?t.slice(t.length-jt):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(zt);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(lr):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(zt,JSON.stringify(this.entries))}catch{}}}const cr=50;function ur(i){if(typeof i!="object"||i===null)return!1;const e=i;return typeof e.token=="string"&&typeof e.cursor=="string"}const dt=Oe("tapscore.result-cursors.v1",nt(ur),cr);function ct(i=G()){return dt.read(i)}function hr(i,e=G()){return ct(e).find(t=>t.token===i)?.cursor??null}function pr(i,e,t=G()){if(!t)return[];const s=ct(t).filter(n=>n.token!==i);return dt.write([{token:i,cursor:e},...s],t)}function mr(i,e=G()){if(!e)return[];const t=ct(e),s=t.filter(n=>n.token!==i);return s.length!==t.length&&dt.write(s,e),s}const fr=["1st","2nd","3rd","4th","5th","6th","7th","8th"],Z=(i,e)=>`${i}|${e}`;function ks(i){return i.players.map(e=>e.displayName).join(" & ")||i.label||"Ball"}function gr(i,e,t){return $s(i,e,t)}function Be(i,e){return`${i.playHoleId}:${i.playerId}:${e}`}function br(i){const e=new Map;return i.teeResult!==null&&e.set("tee_result",i.teeResult),i.recoveryOk!==null&&e.set("recovery_ok",i.recoveryOk?"1":"0"),i.gir!==null&&e.set("gir",i.gir?"1":"0"),i.shortGameDifficulty!==null&&e.set("short_game_difficulty",i.shortGameDifficulty),i.firstPutt!==null&&e.set("first_putt",i.firstPutt),i.putts!==null&&e.set("putts",String(i.putts)),i.penalties!==null&&e.set("penalties",String(i.penalties)),e}function yr(i){const e=i?.status;return typeof e!="number"||e<400||e>=500?!1:e!==401&&e!==408&&e!==429}class ne{constructor(e=new Xi,t=new dr){this.queue=e,this.statQueue=t}queue;statQueue;loading=new p(!1);error=new p(null);friendlyRound=new p(null);round=new p(null);startList=new p(null);balls=new p([]);scorecards=new p([]);cells=new p(new Map);statModules=new p(new Map);statRows=new p([]);statRev=new p(0);statRevN=0;statLocal=new Map;statConfirmedAt=new Map;statStep=null;statCell=null;statPosting=!1;result=new p(null);resultLoading=new p(!1);resultError=new p(null);resultCursor=null;holeIdx=new p(0);groupIdx=new p(0);keypadOpen=new p(!1);selectedSlot=new p(null);token=null;loadSeq=0;resultSeq=0;quietSeq=0;scorecardSeq=0;flushing=!1;pendingSlotIndex=null;async loadByToken(e,t){const s=e!==this.token;this.token=e;const n=++this.loadSeq;s&&this.resetForNewToken(t),B.get(fe).load();const r=await z(this.loading,this.error,()=>v.friendlyRounds.byToken({token:e}));if(!r||n!==this.loadSeq||e!==this.token)return;if(this.friendlyRound.set(r.friendlyRound),this.round.set(r.round),this.startList.set(r.startList),de({token:e,courseName:r.round.courseNameSnapshot??"",status:r.round.status,completedAt:r.round.completedAt,lastSeenAt:new Date().toISOString()}),B.get(H).currentUser.get()&&Un(r.round.id),this.pendingSlotIndex!==null){const m=r.round.formatSlots[this.pendingSlotIndex]?.slotDefId??null;this.pendingSlotIndex=null,m!==null&&this.selectedSlot.set(m)}const[a,d,c,u]=await Promise.all([v.friendlyRounds.balls({token:e}).catch(()=>[]),v.friendlyRounds.scorecard({token:e}).catch(()=>[]),v.playerStats.configsByToken({token:e}).catch(()=>null),v.playerStats.byToken({token:e}).catch(()=>null)]);n!==this.loadSeq||e!==this.token||(this.flushStats(),c&&this.statModules.set(new Map(c.map(f=>[f.playerId,f.modules]))),u&&(this.statRows.set(u),this.dropConfirmedStatLocals(n)),this.cells.set(new Map),this.scorecards.set(d),this.balls.set(a),await this.flushPending(),await this.flushPendingStats(),this.refreshStatStep())}deleting=new p(!1);async deleteRound(){const e=this.token;if(!e||this.deleting.get())return!1;this.deleting.set(!0);try{await v.friendlyRounds.remove({token:e}),cs(e);const t=this.round.get()?.id;return t&&ds(t),mr(e),!0}catch{return!1}finally{this.deleting.set(!1)}}finishing=new p(!1);async finishRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await v.friendlyRounds.finish({token:e}),s=this.round.get();return e===this.token&&s&&(this.round.set({...s,status:t.status,completedAt:t.completedAt}),de({token:e,courseName:s.courseNameSnapshot??"",status:t.status,completedAt:t.completedAt,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async reopenRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await v.friendlyRounds.reopen({token:e}),s=this.round.get();return e===this.token&&s&&(this.round.set({...s,status:t.status,completedAt:null}),de({token:e,courseName:s.courseNameSnapshot??"",status:t.status,completedAt:null,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async loadResult(){const e=this.token;if(!e)return;const t=++this.resultSeq,s=await z(this.resultLoading,this.resultError,()=>v.friendlyRounds.result({token:e}));t!==this.resultSeq||e!==this.token||s&&(this.setResultCursor(e,s.cursor),s.unchanged||this.result.set(s.result))}async refreshScorecard(){const e=this.token;if(!e)return;const t=++this.scorecardSeq,s=this.loadSeq;let n;try{n=await v.friendlyRounds.scorecard({token:e})}catch{return}t!==this.scorecardSeq||s!==this.loadSeq||e!==this.token||this.scorecards.set(n)}async refreshRound(){const e=this.token;if(!e)return;const t=++this.quietSeq,s=this.loadSeq,n=()=>t!==this.quietSeq||s!==this.loadSeq||e!==this.token;try{const r=await v.friendlyRounds.byToken({token:e});if(n())return;this.friendlyRound.set(r.friendlyRound),this.round.set(r.round),this.startList.set(r.startList);const a=await v.friendlyRounds.balls({token:e}).catch(()=>null);if(a===null||n())return;this.balls.set(a)}catch{}}async refreshAll(e){if(this.token){if(e?.feedWillReconnect){await this.refreshRound();return}await Promise.all([this.refreshRound(),this.pollResult(),this.refreshScorecard()])}}persistedCursor(e=this.token){return e?hr(e):null}setResultCursor(e,t){const s=t!==null&&t!==this.resultCursor;this.resultCursor=t,s&&pr(e,t)}async pollResult(){const e=this.token;if(!e)return;const t=++this.resultSeq;let s;try{s=await v.friendlyRounds.result({token:e,...this.resultCursor!==null?{cursor:this.resultCursor}:{}})}catch{return}t!==this.resultSeq||e!==this.token||(this.setResultCursor(e,s.cursor),s.unchanged||this.result.set(s.result))}onLiveResultEvent(e){const t=this.token,s=this.round.get();if(t&&s&&e.status!==s.status){const n=e.status==="complete"?new Date().toISOString():null;this.round.set({...s,status:e.status,completedAt:n}),de({token:t,courseName:s.courseNameSnapshot??"",status:e.status,completedAt:n,lastSeenAt:new Date().toISOString()})}this.pollResult(),this.refreshScorecard()}ballNameById=new S(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,ks(t));for(const t of this.result.get()?.slots??[])for(const s of t.subjectLabels??[])e.set(s.ballId,s.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}isPending(e){return this.balls.get().find(t=>t.id===e)?.pending===!0}groupLabelByBallId=new S(()=>{const e=new Map,t=this.groups();return t.length<2||t.forEach((s,n)=>{for(const r of s.ballIds)e.set(r,`Group ${n+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}selectedSlotDefId(){const e=this.round.get()?.formatSlots??[];if(e.length===0)return null;const t=this.selectedSlot.get();return t!==null&&e.some(s=>s.slotDefId===t)?t:e[0]?.slotDefId??null}selectSlot(e){this.selectedSlot.set(e)}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return ae(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),s=t?.playHoles.find(a=>a.id===e);if(!t||!s)return"";const n=t.playHoles.filter(a=>a.courseHoleNumber===s.courseHoleNumber).sort((a,d)=>a.ordinal-d.ordinal);if(n.length===1)return`${s.courseHoleNumber}`;const r=n.findIndex(a=>a.id===e);return`${s.courseHoleNumber} (${fr[r]??`${r+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(ae(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(ae(this.holeIndex()+1,this.playedOrder().length))}strokesFor(e,t){const s=this.cells.get().get(Z(e,t));return s?s.strokes:this.scorecards.get().find(a=>a.ballId===e)?.holes.find(a=>a.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(Z(e,t))?.status??null}strokesHintFor(e,t){const s=this.round.get();if(!s)return null;const n=this.balls.get().find(m=>m.id===e);if(!n||n.pending)return null;const r=this.selectedSlotDefId(),d=(n.slots.find(m=>m.slotDefId===r)??n.slots[0])?.playingHandicap;if(d==null)return null;const c=this.playHoleById(t);if(!c)return null;const u=n.players[0]?.teeName??null,f=c.tees.find(m=>m.teeName===u)?.strokeIndex??c.baseStrokeIndex;return qi(d,f,s.routeSi.allocationCycleSize)}statSubject(e){if(e.pending||e.players.length!==1)return null;const t=e.players[0];return!t||t.pending||t.playerId===null?null:this.statModules.get().has(t.playerId)?t.playerId:null}statPrompts(){return this.statRev.get(),this.statStep?.prompts??[]}statValue(e){return this.statRev.get(),this.statStep?.value(e)??null}statStepperValue(e,t){return this.statRev.get(),this.statStep?.intValue(e)??t}statIsAnswered(e){return this.statRev.get(),this.statStep?.isAnswered(e)===!0}answerStat(e,t){this.statStep&&(this.statStep.answer(e,t),this.bumpStatRev())}stepStat(e,t){this.statStep&&(this.statStep.step(e,t),this.bumpStatRev())}seedStatStep(e){const t=this.statCell;if(e!==null&&t!==null&&e.playerId===t.playerId&&e.playHoleId===t.playHoleId){this.refreshStatStep();return}this.flushStats(),this.setStatCell(e,e?this.makeStatStep(e):null)}refreshStatStep(){const e=this.statCell;if(!e){this.statStep!==null&&this.setStatCell(null,null);return}const t=this.statModules.get().get(e.playerId);if(!this.statStep||!t){this.setStatCell(e,this.makeStatStep(e));return}this.statStep.refresh(t,this.persistedStats(e))&&this.bumpStatRev()}setStatCell(e,t){const s=t===null?null:e;this.statCell===s&&this.statStep===t||(this.statCell=s,this.statStep=t,this.bumpStatRev())}bumpStatRev(){this.statRev.set(++this.statRevN)}makeStatStep(e){const t=this.statModules.get().get(e.playerId),s=this.playHoleById(e.playHoleId);return!t||!s?null:new nr(t,s.par,s.courseHoleNumber,this.persistedStats(e))}persistedStats(e){const t=this.statRows.get().find(n=>n.playHoleId===e.playHoleId&&n.playerId===e.playerId),s=t?br(t):new Map;for(const n of Q){const r=Be(e,n);if(!this.statLocal.has(r))continue;const a=this.statLocal.get(r)??null;a===null?s.delete(n):s.set(n,a)}return s}flushStats(){const e=this.statCell,t=this.statStep,s=this.token;if(!e||!t||!s)return!1;const n=t.batch;if(n.length===0)return!1;t.commitDraft(),this.bumpStatRev();for(const r of n)this.writeStatLocal(e,r.key,r.value);return this.statQueue.enqueueBatch(s,e.playHoleId,e.playerId,n),this.postStats(s),!0}writeStatLocal(e,t,s){const n=Be(e,t);this.statLocal.set(n,s),this.statConfirmedAt.delete(n)}confirmStatLocals(e){for(const t of e){const s=Be({playerId:t.playerId,playHoleId:t.playHoleId},t.key);this.statConfirmedAt.set(s,this.loadSeq)}}dropConfirmedStatLocals(e){for(const[t,s]of[...this.statConfirmedAt])e<=s||(this.statLocal.delete(t),this.statConfirmedAt.delete(t))}async flushPendingStats(){const e=this.token;if(e){for(const t of this.statQueue.entriesFor(e))this.writeStatLocal({playerId:t.playerId,playHoleId:t.playHoleId},t.key,t.value);await this.postStats(e)}}async postStats(e){if(!this.statPosting){this.statPosting=!0;try{for(;;){const t=this.statQueue.entriesFor(e);if(t.length===0)return;const s=await this.sendStatEvents(e,t);if(s==="later")return;if(s==="ok"||t.length===1){this.settleStatEvents(t);continue}for(const n of t){if(await this.sendStatEvents(e,[n])==="later")return;this.settleStatEvents([n])}}}finally{this.statPosting=!1}}}async sendStatEvents(e,t){try{return await v.playerStats.appendEvents({token:e,items:t.map(s=>({playHoleId:s.playHoleId,playerId:s.playerId,key:s.key,value:s.value,clientEventId:s.clientEventId}))}),"ok"}catch(s){return yr(s)?"refused":"later"}}settleStatEvents(e){this.statQueue.ack(e.map(t=>t.clientEventId)),this.confirmStatLocals(e)}metadataFor(e,t,s){const n=this.cells.get().get(Z(e,t));return n&&n.metadata!==void 0?n.metadata?.[s]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[s]}metadataInputs(){const e=B.get(fe),t=this.round.get()?.formatSlots??[],s=[],n=new Set;for(const r of t){const a=e.byId(r.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of a)n.has(d.key)||(n.add(d.key),s.push(d))}return s}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>gr(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,s,n){const r=Z(e,t),a=crypto.randomUUID();this.patchCell(r,{strokes:s,metadata:n,status:"saving",clientEventId:a});const d=this.token;d&&(this.enqueue(d,e,t,s,n,a),await this.post(d,e,t,s,n,a))}async retry(e,t){const s=Z(e,t),n=this.cells.get().get(s);if(!n)return;this.patchCell(s,{...n,status:"saving"});const r=this.token;r&&(this.enqueue(r,e,t,n.strokes,n.metadata,n.clientEventId),await this.post(r,e,t,n.strokes,n.metadata,n.clientEventId))}async flushPending(){const e=this.token;if(!(!e||this.flushing)){this.flushing=!0;try{for(const t of this.queue.entriesFor(e)){if(e!==this.token)return;this.patchCell(Z(t.ballId,t.playHoleId),{strokes:t.strokes,metadata:t.metadata,status:"saving",clientEventId:t.clientEventId}),await this.post(e,t.ballId,t.playHoleId,t.strokes,t.metadata,t.clientEventId)}}finally{this.flushing=!1}}}enqueue(e,t,s,n,r,a){this.queue.enqueue({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:a,...r!==void 0?{metadata:r}:{},queuedAt:Date.now()})}async post(e,t,s,n,r,a){const d=Z(t,s);try{await v.friendlyRounds.score({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:a,...r!=null?{metadata:r}:{}}),this.queue.remove(a);const c=this.cells.get().get(d);c&&c.clientEventId===a&&this.patchCell(d,{...c,status:"saved"});const u=this.round.get();e===this.token&&u&&u.status==="not_started"&&this.round.set({...u,status:"active"})}catch{const c=this.cells.get().get(d);c&&c.clientEventId===a&&this.patchCell(d,{...c,status:"error"})}}patchCell(e,t){const s=new Map(this.cells.get());s.set(e,t),this.cells.set(s)}resetForNewToken(e){this.resultSeq++,this.resultCursor=null,this.friendlyRound.set(null),this.round.set(null),this.startList.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(e?.holeIdx??0),this.groupIdx.set(e?.groupIdx??0),this.keypadOpen.set(!1),this.statModules.set(new Map),this.statRows.set([]),this.statLocal.clear(),this.statConfirmedAt.clear(),this.statStep=null,this.statCell=null,this.bumpStatRev();const t=e?.selectedSlot;this.pendingSlotIndex=null,typeof t=="string"?this.selectedSlot.set(t):typeof t=="number"?(this.pendingSlotIndex=t,this.selectedSlot.set(null)):this.selectedSlot.set(null)}}const _r=700;function vr(i){if(!i.currentHole)return!1;const e=i.balls.filter(t=>!t.pending);return e.length>0&&e.every(t=>t.scored)}function wr(i){return i.currentHole?i.balls.some((e,t)=>t!==i.currentBallIndex&&!e.scored):!1}function Ge(i){const e=i.currentHole;if(!e)return{kind:"noop"};const t=i.balls,s=i.currentBallIndex;for(let n=s+1;n<t.length;n++)if(!t[n].scored)return{kind:"moveToBall",ballIndex:n};for(let n=0;n<s;n++)if(!t[n].scored)return{kind:"moveToBall",ballIndex:n};return i.holeIndex>=i.holeCount-1?{kind:"roundComplete",toast:"Round complete"}:{kind:"holeComplete",toast:`Hole ${e.label} done`,fromHoleId:e.id,toHoleIndex:i.holeIndex+1,delayMs:_r}}function xr(i,e){const t=i.currentHole;if(e.kind==="statsDone")return i.holeCompleteOnEntry?{write:null,move:{kind:"stay"}}:{write:null,move:Ge(i)};const s=i.balls[i.currentBallIndex];if(!t||!s)return{write:null,move:{kind:"noop"}};if(s.pending)return i.holeCompleteOnEntry?{write:null,move:{kind:"stay"}}:{write:null,move:Ge(i)};const n={ballIndex:i.currentBallIndex,holeId:t.id,value:e.value,withMetadata:e.value!==null};return e.value!==null&&e.value>0&&i.collectsStats?{write:n,move:{kind:"openStats"}}:i.holeCompleteOnEntry?{write:n,move:{kind:"stay"}}:{write:n,move:Ge(i)}}const ee=60,Lt=8,et=4,$r=Array.from({length:et*2+1},(i,e)=>e-et),kr="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",Sr=_(`
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
`),Cr=_(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),At=_(`
    <div class="se-row">
        <div class="se-row__who">
            <span bind="name" class="se-row__name"></span>
            <span bind="hcp" class="se-row__hcp"></span>
        </div>
        <span bind="topar" class="se-row__topar"></span>
        <div class="se-row__scores">
            <span class="se-row__slot"><span bind="prev" class="se-row__prev"></span></span>
            <span class="se-row__slot"><button bind="circle" class="se-row__circle" type="button"><span bind="cval"></span></button></span>
        </div>
    </div>
`),Ir=_(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),Dt=_(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),Tr=_(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`),Er=_(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div bind="seg" class="se-stats__seg"></div>
    </div>
`),Nr=_('<button bind="btn" class="se-seg" type="button"></button>'),Pr=_(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__step">
            <button bind="minus" class="se-stats__step-btn" type="button">−</button>
            <span bind="val" class="se-stats__step-val"></span>
            <button bind="plus" class="se-stats__step-btn" type="button">+</button>
        </div>
    </div>
`),Rr=_('<div bind="rule" class="se-stats__rule"></div>');class Or extends R{static styles=`
        .se {
            margin-top: ${l("xl")};
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
            right: ${Lt}px;
            width: ${ee*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-et*ee}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${ee}px;
            width: ${ee}px;
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
            margin-top: ${l("sm")};
            border-top: 1px solid ${o("border")};
        }
        .se-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${l("md")};
            padding: ${l("md")} 0;
            border-bottom: 1px solid ${o("border")};

            /* The name block takes the slack so the to-par sits right up
               against the fixed-width score columns; min-width:0 is what lets
               a long name ellipsis instead of pushing the numbers off-row. */
            & .se-row__who { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 auto; }
            & .se-row__name {
                font-family: ${o("font-display")};
                font-weight: 600;
                font-size: 1.05rem;
                color: ${o("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            /* What the ball plays off, quiet under the name (same chain as the
               keypad list rows). Absent — not blanked — when there is no
               handicap to state. */
            & .se-row__hcp {
                font-size: 0.75rem;
                color: ${o("text-muted")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            /* Gamebook puts the running to-par where the eye lands: its own
               column between the name and the scores, in the display face at
               score size, tinted by tone. */
            & .se-row__topar {
                flex-shrink: 0;
                text-align: right;
                font-family: ${o("font-display")};
                font-weight: 700;
                font-size: 1.35rem;
                font-variant-numeric: tabular-nums;
            }

            & .se-row__scores { display: flex; align-items: center; padding-right: ${Lt}px; flex-shrink: 0; }
            & .se-row__slot { width: ${ee}px; display: flex; align-items: center; justify-content: center; }
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
                /* Handicap hint in an unscored circle ("-1"/"0"/"+1") — smaller
                   and quieter than a real score, so it reads as a preview. */
                &.hint { font-size: 0.95rem; opacity: 0.8; }
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
            padding: ${l("md")} ${l("lg")};
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
            padding: ${l("lg")};
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
            /* Handicap hint in an unscored circle — faint, Gamebook-style. */
            & .se-mrow__val--hint { opacity: 0.55; font-size: 1rem; }
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
                & .se-stats__hole { font-family: ${o("font-display")}; font-weight: 700; font-size: 1.1rem; }
                & .se-stats__spacer { width: 40px; }
            }

            & .se-stats__who {
                display: flex; align-items: center; justify-content: center; gap: ${l("md")};
                padding: ${l("lg")} ${l("lg")} ${l("sm")};
            }
            & .se-stats__name { font-family: ${o("font-display")}; font-weight: 700; font-size: 1.4rem; }
            & .se-stats__score {
                /* content-box, so the 8px sides ADD to the 44px minimum the way
                   iOS stacks them — .frame(minWidth: 44) then .padding(.horizontal)
                   outside it (ScoreKeypadView.swift:581-583). Under the app's
                   border-box default a one-digit score collapses to 44x44 and
                   reads as a circle instead of a capsule. */
                box-sizing: content-box;
                min-width: 44px; height: 44px; padding: 0 8px; border-radius: 999px;
                display: inline-flex; align-items: center; justify-content: center;
                background: ${o("primary")}; color: #fff;
                font-family: ${o("font-display")}; font-weight: 700; font-size: 1.3rem;
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
                font-family: ${o("font-display")}; font-weight: 700; font-size: 1.05rem;
                color: rgba(255, 255, 255, 0.92);
            }
            & .se-stats__seg { display: flex; gap: ${l("sm")}; justify-content: center; }

            /* Hairline between the format's own toggles (what the round needs to
               score) and the player's own stats (what they asked to track). */
            & .se-stats__rule {
                height: 1px; background: rgba(255, 255, 255, 0.08);
                margin: 0 ${l("xl")};
            }

            /* Stepper prompts (putts, penalties): the 10+ pad's round ± at a
               slightly smaller size, sharing its palette. */
            & .se-stats__step {
                display: flex; align-items: center; justify-content: center; gap: ${l("xl")};
            }
            & .se-stats__step-btn {
                width: 52px; height: 52px; border-radius: 999px; border: none; cursor: pointer;
                background: #2a2a2a; color: #fff; font-size: 1.6rem; line-height: 1;
                font-family: inherit;
                &:active { background: #3a3a3a; }
            }
            & .se-stats__step-val {
                width: 72px; text-align: center;
                font-family: ${o("font-display")}; font-weight: 700; font-size: 2.1rem;
                font-variant-numeric: tabular-nums;
                color: #fff;
                /* Dimmed until answered — an untouched counter is not a zero. */
                &.unanswered { color: rgba(255, 255, 255, 0.55); }
            }

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
                min-width: 0;
                white-space: nowrap;
                &:active { background: rgba(255, 255, 255, 0.08); }
                &.on-hit { background: ${o("primary")}; border-color: ${o("primary")}; color: #fff; }
                &.on-miss { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.45); color: #fff; }
                /* Selected STAT segment: neutral, not green — a stat is an
                   observation, and the plate should not congratulate or scold
                   one. Same paint as on-miss, different meaning. */
                &.on-neutral { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.45); color: #fff; }
                /* Four or five options (first putt) have to fit a 375px plate. */
                &.tight { padding: 18px 4px; font-size: 0.9rem; }
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
            padding: ${l("sm")} ${l("sm")} ${l("xl")};
            &.hidden { display: none; }

            & .se-pad__ext-row { flex: 1; display: flex; align-items: center; justify-content: center; gap: ${l("xl")}; }
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
            padding: ${l("md")} ${l("xl")}; border-radius: ${o("radius")};
            box-shadow: ${o("shadow-elevated")};
            &.hidden { display: none; }
        }
    `;svc=this.inject(ne);holeIdx=this.svc.holeIdx;modalOpen=this.svc.keypadOpen;currentBallIdx=new p(0);holeCompleteOnEntry=!1;extendedOpen=new p(!1);extendedScore=new p(10);statsOpen=new p(!1);pendingMeta=new p({});lastMetaKey=null;toastMsg=new p(null);dragOffset=new p(0);transitioning=new p(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new S(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[ae(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(s=>[s.id,s]));return e.ballIds.map(s=>t.get(s)).filter(s=>!!s)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>ks(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);hintText=(e,t)=>{const s=this.svc.strokesHintFor(e,t);return s===null?null:s===0?"0":s>0?`-${s}`:`+${-s}`};toParValue=e=>{let t=0,s=0,n=!1;for(const r of this.playedOrder()){const a=this.svc.strokesFor(e.id,r.playHoleId);a!==null&&a>0&&(t+=a,s+=this.parFor(r.playHoleId),n=!0)}return n?t-s:null};hcpLine=e=>{const t=this.ballsInGroup().find(n=>n.id===e);if(!t||t.pending)return null;const s=t.players.length>1?t.courseHandicap:t.players[0]?.courseHandicap??t.courseHandicap;return s===null?null:t.players.length>1?`Team · HCP ${s}`:`HCP ${s}`};toParText=e=>{const t=this.toParValue(e);return t===null?"–":t===0?"E":t>0?`+${t}`:`${t}`};toParClass=e=>{const t=this.toParValue(e);return`se-row__topar ${t===null||t===0?"even":t<0?"under":"over"}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const s=e-t;return s<=-4||s>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(s)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer),this.modalOpen.set(!1)}),this.track(N(()=>{const d=this.ballsInGroup().length;d>0&&this.currentBallIdx.get()>=d&&this.selectBall(0)}));const e=this.wire(Sr,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1),this.svc.flushStats()}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const d=this.currentHole();return d?`Hole ${this.occLabel(d.playHoleId)} · Par ${this.parFor(d.playHoleId)}`:""},modalPrev:{onclick:()=>this.stepHole(-1),disabled:()=>!this.svc.canPrevHole()},modalNext:{onclick:()=>this.stepHole(1),disabled:()=>!this.svc.canNextHole()},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>{this.statsOpen.set(!1),this.svc.flushStats()}},statsHole:()=>{const d=this.currentHole();return d?`Hole ${this.occLabel(d.playHoleId)} · Par ${this.parFor(d.playHoleId)}`:""},statsTitle:()=>{const d=this.ballsInGroup()[this.currentBallIdx.get()];return d?this.ballName(d):""},statsScore:()=>{const d=this.ballsInGroup()[this.currentBallIdx.get()],c=this.currentHole();return!d||!c?"":this.displayScore(this.svc.strokesFor(d.id,c.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.svc.flushStats(),this.apply({kind:"statsDone"})}}}),t=this.ref(e,"viewport"),s=this.ref(e,"track");this.bindCarouselPointer(t,s),this.track(N(()=>{s.style.transition=this.transitioning.get()?kr:"none",s.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(s,new S(()=>$r),(d,c,u)=>this.holeItem(d,u),d=>d),this.$each(this.ref(e,"rows"),new S(()=>{const d=this.playedOrder(),c=this.holeIndex(),u=d[c];if(!u)return[];const f=c>0?d[c-1].playHoleId:null;return this.ballsInGroup().map(m=>({ball:m,ph:u.playHoleId,prevPh:f}))}),(d,c,u)=>this.playerRow(d.ball,d.ph,d.prevPh,u),d=>`${d.ball.id}|${d.ph}|${d.ball.pending}`),this.$each(this.ref(e,"modalList"),new S(()=>this.ballsInGroup()),(d,c,u)=>this.modalRow(d,c,u),d=>d.id);const n=this.ref(e,"keys");for(const d of[1,2,3,4,5,6,7,8,9])n.appendChild(this.numberKey(d));n.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),n.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),n.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(e,"statsBody"),new S(()=>this.statBodyRows()),(d,c,u)=>this.statBodyRow(d,u),d=>d.key),this.track(N(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null,this.svc.seedStatStep(null);return}const d=this.ballsInGroup()[this.currentBallIdx.get()],c=this.currentHole();if(!d||!c)return;this.seedStatStepForCursor();const u=`${d.id}|${c.playHoleId}`;if(u===this.lastMetaKey)return;this.lastMetaKey=u;const f={};for(const m of this.metaInputs())f[m.key]=this.svc.metadataFor(d.id,c.playHoleId,m.key)===!0;this.pendingMeta.set(f)}));const r=()=>{document.visibilityState==="hidden"&&this.svc.flushStats()},a=()=>this.svc.flushStats();return document.addEventListener("visibilitychange",r),window.addEventListener("pagehide",a),this.track(()=>{document.removeEventListener("visibilitychange",r),window.removeEventListener("pagehide",a),this.svc.flushStats()}),e}holeItem(e,t){return this.wireEl(Cr,{item:{className:()=>{const s=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${s?" gone":""}`}},hnum:{textContent:()=>{const s=this.occAtOffset(e);return s?this.occLabel(s.playHoleId):""}},hpar:{textContent:()=>{const s=this.occAtOffset(e);return s?`Par ${this.parFor(s.playHoleId)}`:""}}},t)}playerRow(e,t,s,n){return e.pending?this.wireEl(At,{name:{textContent:this.ballName(e),className:"se-row__name se-row__name--pending"},hcp:{textContent:"open seat"},topar:{textContent:"",className:"se-row__topar"},prev:{textContent:""},cval:{textContent:"–"},circle:{className:"se-row__circle empty se-row__circle--pending"}},n):this.wireEl(At,{name:{textContent:this.ballName(e)},hcp:{textContent:()=>this.hcpLine(e.id)??"",hidden:()=>this.hcpLine(e.id)===null},topar:{textContent:()=>this.toParText(e),className:()=>this.toParClass(e)},prev:{textContent:()=>s?this.displayScore(this.svc.strokesFor(e.id,s)):""},cval:{textContent:()=>{const r=this.svc.strokesFor(e.id,t);return r!==null?this.displayScore(r):this.hintText(e.id,t)??"–"}},circle:{className:()=>this.svc.strokesFor(e.id,t)!==null?"se-row__circle":this.hintText(e.id,t)!==null?"se-row__circle empty hint":"se-row__circle empty",onclick:()=>this.openModalForBall(e.id)}},n)}modalRow(e,t,s){const n=e.players.length>1?e.courseHandicap:e.players[0]?.courseHandicap??e.courseHandicap,r=n===null?"–":String(n),a=e.pending?"Open seat — claim to score":e.players.length>1?`Team · HCP ${r}`:`HCP ${r}`;return this.wireEl(Ir,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.selectBall(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:a},mval:{textContent:()=>{const d=this.currentHole();if(!d)return"–";const c=this.svc.strokesFor(e.id,d.playHoleId);return c!==null?this.displayScore(c):this.hintText(e.id,d.playHoleId)??"–"},className:()=>{const d=this.currentHole();return!!d&&this.svc.strokesFor(e.id,d.playHoleId)===null&&!!d&&this.hintText(e.id,d.playHoleId)!==null?"se-mrow__val se-mrow__val--hint":"se-mrow__val"}}},s)}numberKey(e){return this.wireEl(Dt,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,s,n){return this.wireEl(Dt,{key:{className:s,onclick:n},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(s=>s.id===e);this.selectBall(t<0?0:t),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.noteHoleEntered(),this.modalOpen.set(!0)}selectBall(e){this.currentBallIdx.set(e),this.seedStatStepForCursor()}seedStatStepForCursor(){const e=this.ballsInGroup()[this.currentBallIdx.get()],t=this.currentHole(),s=e?this.svc.statSubject(e):null;this.svc.seedStatStep(s&&t?{playerId:s,playHoleId:t.playHoleId}:null)}advanceState(){const e=this.currentHole();return{balls:this.ballsInGroup().map(t=>({pending:!!t.pending,scored:!!e&&this.svc.strokesFor(t.id,e.playHoleId)!==null})),currentBallIndex:this.currentBallIdx.get(),currentHole:e?{id:e.playHoleId,label:this.occLabel(e.playHoleId)}:null,holeIndex:this.holeIndex(),holeCount:this.playedOrder().length,holeCompleteOnEntry:this.holeCompleteOnEntry,collectsStats:this.metaInputs().length>0||this.svc.statPrompts().length>0}}noteHoleEntered(){this.holeCompleteOnEntry=vr(this.advanceState())}stepHole(e){this.advanceTimer&&(clearTimeout(this.advanceTimer),this.advanceTimer=null),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.svc.flushStats(),e<0?this.svc.prevHole():this.svc.nextHole(),this.selectBall(0),this.noteHoleEntered()}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){this.apply({kind:"score",value:e})}apply(e){this.execute(xr(this.advanceState(),e))}execute(e){const t=e.write;if(t){const n=this.ballsInGroup()[t.ballIndex];n&&this.svc.setScore(n.id,t.holeId,t.value,t.withMetadata?this.metaSnapshot():void 0)}const s=e.move;switch(s.kind){case"noop":case"stay":return;case"moveToBall":this.selectBall(s.ballIndex);return;case"openStats":this.statsOpen.set(!0);return;case"roundComplete":this.flash(s.toast),this.modalOpen.set(!1);return;case"holeComplete":{this.flash(s.toast),this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===s.fromHoleId&&(this.holeIdx.set(ae(s.toHoleIndex,this.playedOrder().length)),this.selectBall(0),this.noteHoleEntered())},s.delayMs);return}}}hasMoreUnscored=()=>{const e=this.currentHole();return wr({balls:this.ballsInGroup().map(t=>({pending:!!t.pending,scored:!!e&&this.svc.strokesFor(t.id,e.playHoleId)!==null})),currentBallIndex:this.currentBallIdx.get(),currentHole:e?{id:e.playHoleId}:null})};metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),s={};for(const n of e)s[n.key]=t[n.key]===!0;return s}setMeta(e,t){const s=this.pendingMeta.get();this.pendingMeta.set({...s,[e]:t});const n=this.ballsInGroup()[this.currentBallIdx.get()],r=this.currentHole();if(!n||!r)return;const a=this.svc.strokesFor(n.id,r.playHoleId);a!==null&&this.svc.setScore(n.id,r.playHoleId,a,this.metaSnapshot())}metaChip(e,t){return this.wireEl(Tr,{glabel:{textContent:e.label},miss:{className:()=>this.pendingMeta.get()[e.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(e.key,!1)},hit:{className:()=>this.pendingMeta.get()[e.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(e.key,!0)}},t)}metaInputsForStep=()=>{const e=new Set(this.svc.statPrompts().map(t=>t.key));return this.metaInputs().filter(t=>!e.has(t.key))};statBodyRows=()=>{const e=this.metaInputsForStep(),t=this.svc.statPrompts(),s=e.map(n=>({kind:"meta",key:`meta:${n.key}`,input:n}));e.length>0&&t.length>0&&s.push({kind:"rule",key:"rule"});for(const n of t)s.push({kind:"stat",key:`stat:${n.key}`,prompt:n});return s};statBodyRow(e,t){return e.kind==="meta"?this.metaChip(e.input,t):e.kind==="rule"?this.wireEl(Rr,{},t):e.prompt.control.kind==="segments"?this.statSegments(e.prompt,t):this.statStepper(e.prompt,t)}statSegments(e,t){const s=e.control,n=s.kind==="segments"?s.options:[],r=n.length>=4?" tight":"",a=this.wireEl(Er,{glabel:{textContent:e.label}},t),d=this.ref(a,"seg");for(const c of n){const u=this.wireEl(Nr,{btn:{textContent:c.label,className:()=>`se-seg${r}${this.svc.statValue(e.key)===c.value?" on-neutral":""}`,onclick:()=>this.answerStat(e.key,this.svc.statValue(e.key)===c.value?null:c.value)}},t);d?.appendChild(u)}return a}statStepper(e,t){const s=e.control,n=s.kind==="stepper"?s.min:0,r=s.kind==="stepper"?s.max:null;return this.wireEl(Pr,{glabel:{textContent:e.label},minus:{onclick:()=>this.stepStat(e.key,-1),"aria-label":`Fewer ${e.label}`},plus:{onclick:()=>this.stepStat(e.key,1),"aria-label":`More ${e.label}`},val:{textContent:()=>sr(this.svc.statStepperValue(e.key,n),r),className:()=>this.svc.statIsAnswered(e.key)?"se-stats__step-val":"se-stats__step-val unanswered","aria-label":()=>this.svc.statIsAnswered(e.key)?`${e.label} ${this.svc.statStepperValue(e.key,n)}`:`${e.label} not answered`}},t)}answerStat(e,t){this.svc.answerStat(e,t),this.mirrorStatToMeta(e)}stepStat(e,t){this.svc.stepStat(e,t),this.mirrorStatToMeta(e)}mirrorStatToMeta(e){if(!this.metaInputs().some(s=>s.key===e))return;const t=this.svc.statValue(e);t!==null&&this.setMeta(e,t==="1")}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*ee),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(ae(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",n=>{n.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",n=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:n.pointerId,startX:n.clientX,startY:n.clientY,lastX:n.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(n.pointerId))}),e.addEventListener("pointermove",n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const a=n.clientX-r.startX,d=n.clientY-r.startY;if(!r.horiz){if(Math.abs(d)>Math.abs(a)&&Math.abs(d)>8||Math.abs(a)<=8)return;r.horiz=!0}const c=Date.now(),u=Math.max(1,c-r.lastTime);r.velocity=(n.clientX-r.lastX)/u,r.lastX=n.clientX,r.lastTime=c,this.dragOffset.set(a)});const s=n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const a=n.clientX-r.startX,d=r.horiz;if(this.ptr=null,e.releasePointerCapture?.(n.pointerId),!d){this.dragOffset.set(0);return}this.snap(Ui({dragDistance:a,velocity:r.velocity,itemWidth:ee}))};e.addEventListener("pointerup",s),e.addEventListener("pointercancel",n=>{!this.ptr||this.ptr.id!==n.pointerId||(this.ptr=null,e.releasePointerCapture?.(n.pointerId),this.snap(0))})}}function zr(i,e){const t=[...i].sort((r,a)=>r.canonicalOrdinal-a.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(r=>r.playHoleId))}];const s=[...e].sort((r,a)=>r.fromCanonicalOrdinal-a.fromCanonicalOrdinal),n=[];for(const r of s){const a=t.filter(d=>d.canonicalOrdinal>=r.fromCanonicalOrdinal&&d.canonicalOrdinal<=r.toCanonicalOrdinal);a.length!==0&&n.push({label:r.label,holes:a,playHoleIds:new Set(a.map(d=>d.playHoleId))})}return n}function Ss(i,e){const t=i.cells.filter(s=>e.has(s.playHoleId));if(i.aggregate==="sum"){const s=t.map(n=>n.value).filter(n=>n!==null);return s.length===0?"—":String(s.reduce((n,r)=>n+r,0))}if(i.aggregate==="last"){for(let s=t.length-1;s>=0;s--){const n=t[s].value;if(n!==null)return Number.isInteger(n)?String(n):n.toFixed(1)}return"—"}return"—"}function jr(i,e){if(i.aggregate==="sum"){const t=i.cells.map(s=>s.value).filter(s=>s!==null);return t.length===0?"—":String(t.reduce((s,n)=>s+n,0))}if(i.aggregate==="last"){const t=e[e.length-1];return t?Ss(i,t.playHoleIds):"—"}return"—"}function Lr(i){const e=i?.marker;if(e){const t=e.tone;return{kind:"marker",template:e.template,tone:t==="success"||t==="warning"||t==="danger"?t:null,label:e.label?e.label:null,teamFill:i?.team??null}}return i?.team?{kind:"pill",team:i.team}:{kind:"plain"}}function Ar(i){return i.filter(e=>!(e.startsWith("slot #")||/^HCP -?\d/.test(e)||/^PH -?\d/.test(e)))}const Pe=" & ";function Cs(i){return i.componentId??"default-score-grid"}function ut(i,e,t,s={}){const n=zr(i.holes,e),r=s.mode??"product",a=i.rows.map(d=>{const c=new Map(d.cells.map(u=>[u.playHoleId,u]));return{kind:d.kind,emphasis:d.emphasis===!0,team:d.team??null,subjectName:d.subjectBallId?t(d.subjectBallId):null,labelText:d.label,groups:n.map(u=>({cells:u.holes.map(f=>{const m=c.get(f.playHoleId);return{text:m?.display??"",title:m?.title?m.title:null,decoration:Lr(m)}}),subtotal:Ss(d,u.playHoleIds)})),total:jr(d,n)}});return{componentId:Cs(i),subjectBallIds:[...i.subjectBallIds],title:{groups:i.title.groups.map(d=>d.map(c=>t(c))),joiner:i.title.joiner,nameJoiner:Pe},subtitleFacts:r==="verification"?[...i.subtitleFacts]:Ar(i.subtitleFacts),footnotes:[...i.footnotes],caption:i.caption??null,totals:i.totals.map(d=>({label:d.label,value:String(d.value??"—")})),columnGroups:n.map(d=>({label:d.label,columns:d.holes.map(c=>({label:c.occurrenceLabel}))})),hasTotalColumn:n.length>1,rows:a}}function qe(i){return[...new Set(i)].sort().join("\0")}function Dr(i,e){const t=new Map;e.forEach((n,r)=>{if(n.ballIds.length===0)return;const a=qe(n.ballIds);t.set(a,t.has(a)?null:r)});const s=new Map;for(const n of i){if(n.subjectBallIds.length===0)continue;const r=qe(n.subjectBallIds);s.set(r,(s.get(r)??0)+1)}return i.map(n=>{if(n.subjectBallIds.length===0)return{kind:"standalone"};const r=qe(n.subjectBallIds);if((s.get(r)??0)!==1)return{kind:"standalone"};const a=t.get(r);return a==null?{kind:"standalone"}:{kind:"attached",entryIndex:a}})}function Mr(i,e){const t=new Set(i.map(e));return t.size!==1?null:[...t][0]??null}function Hr(i,e){if(i===void 0)return null;const t=e==="high"?-i:i;return{text:t===0?"E":t>0?`+${t}`:`−${Math.abs(t)}`,tone:t===0?"even":t>0?"over":"under"}}const Fr=()=>null;function Br(i,e,t=Fr){return{kind:"ranked",metricLabel:i.metricLabel,hasPace:i.entries.some(s=>s.paceDelta!==void 0),entries:i.entries.map(s=>({position:s.position,lead:s.position===1,name:s.ballIds.map(e).join(Pe),group:Mr(s.ballIds,t),total:String(s.total??"—"),holesPlayed:s.holesPlayed,pace:Hr(s.paceDelta,i.direction)}))}}function Gr(i,e){return{kind:"match_summary",title:i.title,matches:i.matches.map(t=>({sideAName:t.sideA.ballIds.map(e).join(Pe),sideBName:t.sideB.ballIds.map(e).join(Pe),leader:t.leader,standing:t.magnitude===0?"AS":`${t.magnitude} UP`,status:t.finished?"Final":`thru ${t.thru}`}))}}function tt(i,e){return[i,...[...new Set(e)].sort()].join("|")}const qr=new Map;function Kr(i){const e=i.cards??[],t=(i.leaderboard??[]).find(a=>a.kind==="ranked")??null;if(!t)return{rankedSection:null,slotDefId:i.slotDefId,attached:qr,standalone:[...e]};const s=Dr(e,t.entries),n=new Map,r=[];return e.forEach((a,d)=>{const c=s[d],u=c?.kind==="attached"?t.entries[c.entryIndex]:void 0;if(!u){r.push(a);return}n.set(tt(i.slotDefId,u.ballIds),a)}),{rankedSection:t,slotDefId:i.slotDefId,attached:n,standalone:r}}class Vr{open=new Set;isOpen(e){return this.open.has(e)}toggle(e){return this.set(e,!this.open.has(e))}set(e,t){return t?this.open.add(e):this.open.delete(e),t}keys(){return[...this.open].sort()}retain(e){const t=new Set(e);for(const s of[...this.open])t.has(s)||this.open.delete(s)}}const Is={ring:{meaning:"a single-unit decided result",fill:"#d63b2f",visual:"red filled circle — the Gamebook birdie mark (score to par −1)"},double_ring:{meaning:"a two-unit decided result; more emphatic than a ring",fill:"#e0862c",teamFillBorder:"border-width: 3px; border-style: double;",visual:"orange filled circle (score to par −2); doubled white border when team-filled"},diamond:{meaning:"a rare / high-magnitude decided result — the strongest form",fill:"#e0b41f",visual:"yellow filled circle — hole-in-one / albatross territory"},dot:{meaning:"a lightweight per-hole flag where a full ring would be too heavy",visual:"the bare base shape (no fill, no border) — inherits cell colour"},badge:{meaning:"a labelled status needing short text or a number, not just a shape",rule:["width: auto; min-width: 1.8em;","padding-left: 0.45em; padding-right: 0.45em;","border: 2px solid currentColor;"],tones:{success:"#267348",warning:"#946200",danger:"#9b332a"},visual:"outline pill in the tone colour, text inside"},square:{meaning:"a one-step negative score relation",fill:"#5b9bd5",boxy:!0,visual:"light-blue filled square (score to par +1)"},double_square:{meaning:"a stronger negative score relation",fill:"#1f4e79",boxy:!0,visual:"dark-blue filled square (score to par +2)"},box_badge:{meaning:"an angular labelled state that must not read as a round marker",fill:"#1f4e79",boxy:!0,visual:"dark-blue filled square carrying its value (+3 or worse)"}};function ge(i){return`lb-mark--${i}`}const ce=()=>Object.entries(Is);function Ts(i){return i.join(`
            `)}function Ke(i,e){return i.map((t,s)=>`& .${ge(t)}${s===i.length-1?` { ${e} }`:","}`)}function Ur(){const i=[];i.push("/* Outline forms keep currentColor + tone tints. */");for(const[r,a]of ce())if(!(!a.rule&&!a.tones)){if(a.rule){i.push(`& .${ge(r)} {`);for(const d of a.rule)i.push(`    ${d}`);i.push("}")}for(const[d,c]of Object.entries(a.tones??{}))i.push(`& .${ge(r)}.lb-mark-tone--${d} { color: ${c}; }`)}i.push("/* Filled forms — declared after the tone rules so white text wins. */");const e=ce().filter(([,r])=>r.boxy).map(([r])=>r),t=[],s=new Set;for(const[r,a]of ce()){if(a.fill===void 0||s.has(r))continue;const d=ce().filter(([,c])=>c.fill===a.fill).map(([c])=>c);for(const c of d)s.add(c);t.push({fill:a.fill,ids:d})}let n=-1;if(e.length>0){const r=t.findIndex(a=>a.ids.some(d=>Is[d].boxy));n=r===-1?t.length:r}return t.forEach((r,a)=>{a===n&&i.push(...Ke(e,"border-radius: 3px;")),i.push(...Ke(r.ids,`background: ${r.fill}; color: #fff;`))}),n===t.length&&i.push(...Ke(e,"border-radius: 3px;")),Ts(i)}function Wr(){const i=[];for(const[e,t]of ce()){if(!t.teamFillBorder)continue;const s=ge(e);i.push(`& .${s}.lb-mark-fill--a,`,`& .${s}.lb-mark-fill--b { ${t.teamFillBorder} }`)}return Ts(i)}const Es=()=>null;function P(i){return String(i).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Qr(i){return i.kind==="si"?"lb-c-si":i.kind==="given"?"lb-c-given":i.kind==="status"?"lb-c-status":i.kind==="category"?"lb-c-cat":""}function Yr(i){const e=[i.kind==="category"?"lb-r-cat":`lb-r-${i.kind}`];return(i.kind==="si"||i.kind==="given")&&e.push("lb-r-dim"),i.team&&e.push(`lb-team-${i.team}`),e.join(" ")}function Xr(i,e,t){const s=i.title!==null?` title="${P(i.title)}"`:"",n=t(P(i.text)),r=i.decoration;let a;if(r.kind==="marker"){const d=r.tone?` lb-mark-tone--${r.tone}`:"",c=r.teamFill?` lb-mark-fill--${r.teamFill}`:"",u=r.label!==null?` title="${P(r.label)}" aria-label="${P(r.label)}"`:"";a=`<span class="lb-mark ${ge(r.template)}${d}${c}"${u}>${n}</span>`}else r.kind==="pill"?a=`<span class="lb-pill lb-pill--${r.team}">${n}</span>`:a=n;return`<td class="${Qr(e)}"${s}>${a}</td>`}function ht(i,e){const t=m=>{const h=i.columnGroups[m],b=`<tr><th class="lb-rowlabel">Hole</th>${h.columns.map(x=>`<th>${P(x.label)}</th>`).join("")}<th class="lb-sum">${P(h.label)}</th></tr>`,g=i.rows.map(x=>{const O=J=>x.emphasis?`<strong>${J}</strong>`:J,j=x.groups[m],C=j.cells.map(J=>Xr(J,x,O)).join(""),A=`<td class="lb-sum">${O(j.subtotal)}</td>`,F=x.subjectName!==null?P(x.subjectName)+(x.labelText?" "+P(x.labelText):""):P(x.labelText);return`<tr class="${Yr(x)}"><th class="lb-rowlabel">${F}</th>${C}${A}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${b}</thead><tbody>${g}</tbody></table></div>`},s=i.columnGroups.map((m,h)=>t(h)).join(""),n=i.title.groups.map(m=>m.map(h=>P(h)).join(i.title.nameJoiner)).filter(Boolean).join(i.title.joiner),r=i.subtitleFacts.length?`<div class="lb-card__sub">${i.subtitleFacts.map(P).join(" · ")}</div>`:"",a=e.mode==="verification"&&i.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${i.footnotes.map(m=>`<span class="lb-card__note">${P(m)}</span>`).join("")}</div>`:"",d=e.mode==="verification"&&i.caption?`<p class="lb-card__caption">${P(i.caption)}</p>`:"",c=i.totals.length?`<ul class="lb-card__totals">${i.totals.map(m=>`<li>${P(m.label)} = <strong>${m.value}</strong></li>`).join("")}</ul>`:"",u=n?`<header class="lb-card__head"><h4>${n}</h4>${r}</header>`:r;return`<article class="${e.cardModifier?`lb-card ${e.cardModifier}`:"lb-card"}">
  ${u}
  ${s}
  ${a}${d}${c}
</article>`}function Jr(i,e,t,s){return ht(ut(i,e,t,s),s)}function Zr(i,e,t,s){return ht(ut(i,e,t,s),{...s,cardModifier:"lb-card--compact-match"})}function ea(i,e,t,s){return ht(ut(i,e,t,s),{...s,cardModifier:"lb-card--category-matrix"})}function ta(i){return i.pace===null?'<td class="lb-rank__pace"></td>':`<td class="lb-rank__pace lb-rank__pace--${i.pace.tone}">${P(i.pace.text)}</td>`}function sa(i){return`lb-panel-${i.replace(/[^a-zA-Z0-9_-]+/g,"-")}`}function na(i,e,t=Es,s=null){const n=Br(i,e,t),r=n.hasPace,a=s!==null,d=(r?5:4)+(a?1:0),c=n.entries.map((b,g)=>{const x=b.group?` <span class="lb-rank__group">${P(b.group)}</span>`:"",O=`
  <td class="lb-rank__total">${b.total}</td>${r?`
  ${ta(b)}`:""}
  <td class="lb-rank__thru">${b.holesPlayed}</td>`,j=i.entries[g],C=s&&j?s.plan.attached.get(tt(s.plan.slotDefId,j.ballIds)):void 0;if(!s)return`<tr class="${b.lead?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${b.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${P(b.name)}</span>${x}</span></td>${O}
</tr>`;if(!j||!C)return`<tr class="${b.lead?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${b.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${P(b.name)}</span>${x}</span></td>${O}
  <td class="lb-rank__disclosure"></td>
</tr>`;const A=tt(s.plan.slotDefId,j.ballIds),F=s.isOpen(A),J=sa(A),Ls=Ns(C,s.routeSections,e,{mode:s.mode??"product"}),Ae=["lb-rank__row--expandable"];return b.lead&&Ae.push("lb-rank__lead"),F&&Ae.push("lb-rank__row--open"),`<tr class="${Ae.join(" ")}" data-expand-key="${P(A)}">
  <td class="lb-rank__pos">${b.position}</td>
  <td class="lb-rank__who"><button type="button" class="lb-rank__toggle" aria-expanded="${F}" aria-controls="${P(J)}"><span class="lb-rank__whobox"><span class="lb-rank__name">${P(b.name)}</span>${x}</span></button></td>${O}
  <td class="lb-rank__disclosure"><span class="lb-rank__chev" aria-hidden="true"></span></td>
</tr>
<tr class="lb-rank__panel${F?" lb-rank__panel--open":""}" data-panel-key="${P(A)}">
  <td class="lb-rank__panelcell" colspan="${d}"><div class="lb-rank__panelwrap" id="${P(J)}"><div class="lb-rank__panelbox">${Ls}</div></div></td>
</tr>`}).join(""),u=r?`
      <col class="lb-rank__col-pace">`:"",f=r?'<th class="lb-rank__pace">Pace</th>':"",m=a?`
      <col class="lb-rank__col-disclosure">`:"",h=a?'<th class="lb-rank__disclosure" aria-label="Scorecard"></th>':"";return`<div class="lb-section">
  <h4 class="lb-section__title">${P(n.metricLabel)}</h4>
  <table class="lb-rank">
    <colgroup>
      <col class="lb-rank__col-pos">
      <col class="lb-rank__col-who">
      <col class="lb-rank__col-total">${u}
      <col class="lb-rank__col-thru">${m}
    </colgroup>
    <thead><tr><th class="lb-rank__pos">#</th><th class="lb-rank__who">Player</th><th class="lb-rank__total">Total</th>${f}<th class="lb-rank__thru">Thru</th>${h}</tr></thead>
    <tbody>${c}</tbody>
  </table>
</div>`}function ia(i,e){const t=Gr(i,e),s=t.matches.map(n=>{const r=n.leader==="a"?" lb-mp__team--lead":"",a=n.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${r}">${P(n.sideAName)}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${P(n.standing)}</span><span class="lb-mp__status">${P(n.status)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${a}">${P(n.sideBName)}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${P(t.title)}</h4>${s}
</div>`}const ra={ranked:na,match_summary:(i,e)=>ia(i,e)},aa={"default-score-grid":Jr,"compact-match-grid":Zr,"category-matrix-grid":ea};function oa(i){return`<div class="lb-diag">Unrenderable result section <code>${P(i)}</code> — no generic view yet. Results are not hidden.</div>`}function la(i){return`<div class="lb-diag">Unsupported score-grid component <code>${P(i)}</code> — no generic view yet. Results are not hidden.</div>`}function da(i,e,t,s=null){const n=ra[i.kind];return n?n(i,e,t,s):oa(i.kind)}function Ns(i,e,t,s){const n=Cs(i),r=aa[n];return r?r(i,e,t,s):la(n)}function ca(i,e,t=Es,s=null){return i.leaderboard.length===0&&i.cards.length===0?`<div class="lb-empty">No scores entered yet for ${P(i.formatLabel)}.</div>`:i.leaderboard.map(r=>da(r,e,t,s&&r===s.plan.rankedSection?s:null)).join("")||`<div class="lb-empty">No leaderboard metric for ${P(i.formatLabel)}.</div>`}function ua(i,e,t,s={}){if(i.length===0)return"";const n=s.mode??"product";return i.map(r=>Ns(r,e,t,{mode:n})).join(`
`)}const ha=_(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class pa extends R{static styles=`
        .lb {
            /* Horizontal gutters come from the host panel (.round-view__main
               already pads lg) — padding here would double-indent every
               section relative to the page header and waste table width. */
            padding: ${l("lg")} 0 ${l("2xl")};

            & .lb__status {
                color: ${o("text-muted")};
                padding: ${l("xl")} 0;
                text-align: center;
                &.hidden { display: none; }
            }

            & .lb-empty {
                color: ${o("text-muted")};
                padding: ${l("xl")} 0;
                text-align: center;
            }
            & .lb-diag {
                ${L()}
                padding: ${l("md")} ${l("lg")};
                color: ${o("error")};
                font-size: 0.85rem;
                margin-bottom: ${l("md")};
                & code { font-family: ui-monospace, monospace; }
            }

            /* Ranked metric + match-summary sections. */
            & .lb-section { margin-bottom: ${l("xl")}; }
            & .lb-section__title {
                margin: 0 0 ${l("sm")};
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
            & .lb-rank__col-disclosure { width: 1.5rem; }
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
                padding: 0 ${l("sm")};
                border-bottom: 1px solid ${o("border")};
            }
            & .lb-rank tbody td {
                height: 2.25rem;
                padding: 0 ${l("sm")};
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
                margin-left: ${l("xs")};
                flex: none;
                white-space: nowrap;
            }
            & .lb-rank__thru { text-align: right; color: ${o("text-muted")}; }

            /* --- Gamebook expansion: a ranked row whose scorecard folds under it.
               The row is tappable anywhere; the button inside the name cell is
               the real control (aria-expanded / aria-controls). The chevron has
               its own final column so it aligns at the board's right edge. */
            & .lb-rank__row--expandable { cursor: pointer; }
            & .lb-rank__toggle {
                display: flex;
                align-items: baseline;
                gap: ${l("xs")};
                width: 100%;
                padding: 0;
                margin: 0;
                border: 0;
                background: none;
                font: inherit;
                color: inherit;
                text-align: left;
                cursor: pointer;
                min-width: 0;
            }
            & .lb-rank__toggle:focus-visible {
                outline: 2px solid ${o("accent")};
                outline-offset: 2px;
                border-radius: 4px;
            }
            & .lb-rank__toggle .lb-rank__whobox { flex: 1 1 auto; }
            & .lb-rank__disclosure {
                text-align: right;
                padding-left: 0;
            }
            /* Chevron drawn from borders — no icon font, no asset. */
            & .lb-rank__chev {
                display: inline-block;
                width: 0.42em;
                height: 0.42em;
                border-right: 2px solid ${o("text-muted")};
                border-bottom: 2px solid ${o("text-muted")};
                transform: rotate(-45deg);
                transition: transform 200ms ease;
            }
            & .lb-rank__row--open .lb-rank__chev {
                transform: rotate(45deg);
            }
            /* The panel row is always in the DOM; open/closed is a HEIGHT
               animation on a 0fr→1fr grid track (the one technique that animates
               to intrinsic content height without measuring it in JS). */
            /* Beats the generic .lb-rank tbody td row metrics (fixed height +
               cell padding): a COLLAPSED panel must take no vertical space at
               all, or every expandable row grows a permanent empty gap. */
            & .lb-rank tbody td.lb-rank__panelcell {
                height: auto;
                padding: 0;
                /* No rule of its own while collapsed: a zero-height cell that
                   still paints a border draws a SECOND hairline right under the
                   row's own bottom border, so every expandable row looks
                   double-ruled. The border belongs to the OPEN panel, closing it
                   off from the next row. */
                border-bottom: 0;
            }
            & .lb-rank tbody tr.lb-rank__panel--open td.lb-rank__panelcell {
                border-bottom: 1px solid ${o("border")};
            }
            & .lb-rank__panelwrap {
                display: grid;
                grid-template-rows: 0fr;
                transition: grid-template-rows 220ms ease;
            }
            & .lb-rank__panel--open .lb-rank__panelwrap { grid-template-rows: 1fr; }
            & .lb-rank__panelbox {
                overflow: hidden;
                min-height: 0;
                /* Hidden from AT and tab order only AFTER the collapse finishes,
                   so the closing animation still shows the card. */
                visibility: hidden;
                transition: visibility 0s linear 220ms;
            }
            & .lb-rank__panel--open .lb-rank__panelbox {
                visibility: visible;
                transition-delay: 0s;
            }
            /* An inline card is page chrome-free: the row above already names the
               player, and a bordered card inside a table row reads as a box in a
               box. */
            & .lb-rank__panelbox .lb-card {
                border: 0;
                box-shadow: none;
                background: ${o("surface-sunken")};
                border-radius: 0;
                margin: 0;
                padding: ${l("sm")} ${l("sm")} ${l("md")};
            }
            & .lb-rank__panelbox .lb-card__head h4 { display: none; }
            & .lb-rank__panelbox .lb-grid .lb-rowlabel { background: ${o("surface-sunken")}; }
            @media (prefers-reduced-motion: reduce) {
                & .lb-rank__panelwrap,
                & .lb-rank__chev { transition: none; }
            }
            & .lb-rank__lead td { background: ${o("accent-soft")}; }
            & .lb-rank__lead .lb-rank__pos { color: ${o("accent")}; }

            /* Structured match panel: two team blocks + a centre standing. */
            & .lb-mp {
                display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch;
                border: 1px solid ${o("border")}; border-radius: 10px; overflow: hidden;
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
            & .lb-mp__status { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.04em; color: ${o("text-muted")}; }

            /* Format-aware scorecard cards. */
            & .lb-cards__head {
                margin: ${l("xl")} 0 ${l("md")};
                font-family: ${o("font-display")};
                font-weight: 600;
                font-size: 1.1rem;
                color: ${o("text")};
            }
            & .lb-card {
                ${L()}
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
            }
            & .lb-card--compact-match {
                border-color: color-mix(in srgb, ${o("accent")} 28%, ${o("border")});
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
                font-family: ${o("font-display")};
                font-weight: 600;
                font-size: 1rem;
                color: ${o("text")};
            }
            & .lb-card__sub { font-size: 0.75rem; color: ${o("text-muted")}; margin-top: 2px; }
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
            /* Route section labels such as OUT must fit whole; the shared cell
               padding otherwise leaves too little usable width and ellipsizes it. */
            & .lb-grid .lb-sum { width: 2.8em; font-weight: 700; background: ${o("surface-sunken")}; }
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
            /* Score marker shapes. The base shape lives here; every per-form
               rule below is EMITTED from the marker token table
               (./marker-tokens.ts), which is the single home for
               marker id → meaning + class + visual. Restyle or add a marker
               there, not here — the server sends only the abstract template,
               and each marker's label carries the golf meaning. */
            & .lb-mark {
                display: inline-flex; align-items: center; justify-content: center;
                box-sizing: border-box; width: 1.7em; height: 1.7em; line-height: 1;
                /* Digits sit high in their line box, so nudge down to optically centre. */
                padding-top: 0.12em; vertical-align: middle;
                border-radius: 999px; font-weight: 700;
            }
            ${Ur()}
            /* Deciding ball whose score is decorated: the marker's own shape gets
               the team fill — white number and white outline on the team colour.
               Declared AFTER the shape fills so the team colour wins. The white
               border + outer box-shadow halo are load-bearing: without them a
               filled bonus ring is indistinguishable from the plain standing
               pill (the score-to-par shapes above carry no outline). */
            & .lb-mark-fill--a, & .lb-mark-fill--b { border: 2px solid #fff; }
            ${Wr()}
            & .lb-mark-fill--a { background: #c2452f; color: #fff; box-shadow: 0 0 0 2.5px #c2452f; }
            & .lb-mark-fill--b { background: #2c6cae; color: #fff; box-shadow: 0 0 0 2.5px #2c6cae; }
            & .lb-card__caption { margin: ${l("sm")} 0 0; font-size: 0.72rem; font-style: italic; color: ${o("text-muted")}; }
            & .lb-card__notes { margin: ${l("sm")} 0 0; font-size: 0.72rem; color: ${o("text-muted")}; }
            & .lb-card__notes-label {
                display: block; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.04em; font-size: 0.68rem; margin-bottom: 2px;
            }
            & .lb-card__note { display: block; }
            & .lb-card__totals {
                list-style: none; margin: ${l("sm")} 0 0; padding: 0;
                display: flex; flex-wrap: wrap; gap: ${l("md")};
                font-size: 0.85rem; color: ${o("text")};
            }
        }
    `;svc=this.inject(ne);expansion=new Vr;slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots(),t=this.svc.selectedSlotDefId();return e.find(s=>s.slotDefId===t)??e[0]??null};render(){return this.wire(ha,{status:{className:()=>{const t=this.svc.resultLoading.get(),s=this.svc.result.get()===null;return t||s?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody(),onclick:t=>this.onBodyClick(t),onkeydown:t=>this.onBodyKeydown(t)}})}rowFor(e){return e.target?.closest?.("tr[data-expand-key]")??null}onBodyClick(e){const t=this.rowFor(e);if(!t||(window.getSelection?.()?.toString()??"")!=="")return;const s=t.getAttribute("data-expand-key")??"";this.applyOpen(t,this.expansion.toggle(s))}onBodyKeydown(e){if(e.key!=="Escape")return;const t=this.rowFor(e);if(!t)return;const s=t.getAttribute("data-expand-key")??"";this.expansion.isOpen(s)&&(this.applyOpen(t,this.expansion.set(s,!1)),t.querySelector(".lb-rank__toggle")?.focus(),e.stopPropagation())}applyOpen(e,t){e.classList.toggle("lb-rank__row--open",t),e.querySelector(".lb-rank__toggle")?.setAttribute("aria-expanded",String(t));const s=e.nextElementSibling;s?.classList.contains("lb-rank__panel")&&s.classList.toggle("lb-rank__panel--open",t)}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const s=u=>{const f=this.svc.nameOf(u);return this.svc.isPending(u)?`${f} (open seat)`:f},n=u=>this.svc.groupLabelOf(u),r=Kr(t);this.expansion.retain(r.attached.keys());const a=ca(t,s,n,{plan:r,routeSections:e.routeSections,isOpen:u=>this.expansion.isOpen(u)}),d=ua(r.standalone,e.routeSections,s),c=d?`<h3 class="lb-cards__head">Scorecard</h3>${d}`:"";return a+c}}function ma(i,e){if(!e)return[];const t=[],s=new Set;for(const n of i)for(const r of n.players){if(r.playerId===e)return[];r.guestPlayerId===null||s.has(r.guestPlayerId)||(s.add(r.guestPlayerId),t.push({guestPlayerId:r.guestPlayerId,displayName:r.displayName}))}return t}const fa=_(`
    <div bind="root" class="claim-card hidden">
        <span class="claim-card__label">Played here as a guest?</span>
        <p class="claim-card__hint">Claim your scores — the round lands on your profile's card.</p>
        <div bind="rows" class="claim-card__rows"></div>
        <p bind="err" class="claim-card__err"></p>
    </div>
`),ga=_(`
    <div class="claim-card__row">
        <span bind="name" class="claim-card__name"></span>
        <button bind="claim" class="claim-card__btn" type="button">This is me</button>
    </div>
`);class ba extends R{static styles=`
        .claim-card {
            margin-top: ${l("lg")};
            padding: ${l("lg")};
            ${L()}
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
                margin: ${l("sm")} 0 0;
                font-size: 0.8rem;
                color: ${o("text-muted")};
            }
            & .claim-card__rows {
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
                margin-top: ${l("md")};
            }
            & .claim-card__row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${l("md")};
            }
            & .claim-card__name { font-weight: 600; font-size: 0.95rem; }
            & .claim-card__btn {
                ${I()}
                padding: ${l("sm")} ${l("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${o("primary")};
                color: ${o("primary-text")};
                border: none;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .claim-card__err {
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(ne);auth=this.inject(H);router=this.inject(M);tokenQ=this.router.query("token");claiming=new p(!1);error=new p("");claimable(){return ma(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async claim(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.claiming.set(!0);try{await v.friendlyRounds.claimGuest({token:t,guestPlayerId:e}),await this.svc.loadByToken(t)}catch(s){this.error.set(s instanceof K&&s.status===409?"Already claimed — or you already play in this round under your account.":s instanceof K&&s.status===404?"That guest is no longer claimable on this round.":"Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}render(){const e=this.wire(fa,{root:{className:()=>this.claimable().length>0?"claim-card":"claim-card hidden"},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.claimable(),(t,s,n)=>this.wireEl(ga,{name:()=>t.displayName,claim:{disabled:()=>this.claiming.get(),onclick:()=>{this.claim(t.guestPlayerId)}}},n),t=>t.guestPlayerId),e}}function Ve(i){return typeof i=="object"&&i!==null&&typeof i.get=="function"}const w=i=>`var(--${i})`,Mt="http://www.w3.org/2000/svg";function ya(){const i=document.createElementNS(Mt,"svg");i.setAttribute("width","12"),i.setAttribute("height","8"),i.setAttribute("viewBox","0 0 12 8"),i.setAttribute("fill","none"),i.setAttribute("aria-hidden","true"),i.setAttribute("focusable","false");const e=document.createElementNS(Mt,"path");return e.setAttribute("d","M1 1.5 6 6.5 11 1.5"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","1.5"),e.setAttribute("stroke-linecap","round"),e.setAttribute("stroke-linejoin","round"),e.setAttribute("fill","none"),i.appendChild(e),i}const pe=class pe extends R{constructor(){super(...arguments),this.uid=`ui-select-${pe.seq++}`,this.open=new p(!1),this.highlightIndex=new p(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}get isMulti(){return this.props.multiple===!0}get multi(){return this.props}get single(){return this.props}currentOptions(){return Ve(this.props.options)?this.props.options.get():this.props.options}selectedValues(){if(this.isMulti)return this.multi.values.get();const e=this.single.value.get();return e?[e]:[]}placeholderText(){const e=this.props.placeholder;return(typeof e=="function"?e():e)??""}formatCount(e){return this.multi.countLabel?this.multi.countLabel(e):String(e)}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50,s=this.isMulti;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const n=document.createElement("span");n.className="ui-select__trigger-label",this.triggerEl.appendChild(n);const r=document.createElement("span");r.className="ui-select__chevron",r.appendChild(ya()),r.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(r),this.triggerEl.addEventListener("click",d=>{d.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",d=>{this.handleTriggerKeydown(d)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",d=>{this.handleDropdownKeydown(d)}),this.listEl=document.createElement("div"),this.listEl.className="ui-select__list",this.listEl.setAttribute("role","listbox"),s&&this.listEl.setAttribute("aria-multiselectable","true"),this.dropdownEl.appendChild(this.listEl),s&&(this.countEl=document.createElement("div"),this.countEl.className="ui-select__count",this.countEl.setAttribute("role","status"),this.countEl.setAttribute("aria-live","polite"),this.dropdownEl.appendChild(this.countEl)),e.appendChild(this.dropdownEl);const a=d=>{this.optionEls=[],this.listEl.textContent="";for(let c=0;c<d.length;c++){const u=d[c],f=document.createElement("button");if(f.className=s?"ui-select__option ui-select__option--multi":"ui-select__option",f.setAttribute("type","button"),f.id=`${this.uid}-opt-${c}`,u.disabled){f.classList.add("ui-select__option--header"),f.disabled=!0,f.setAttribute("role","presentation"),f.setAttribute("aria-disabled","true");const h=document.createElement("span");h.className="ui-select__option-label",h.textContent=u.label,f.appendChild(h),this.listEl.appendChild(f),this.optionEls.push(f);continue}if(f.setAttribute("role","option"),s){const h=document.createElement("span");h.className="ui-select__checkbox",h.setAttribute("aria-hidden","true"),f.appendChild(h)}if(u.icon){const h=document.createElement("span");h.className="ui-select__option-icon",h.textContent=u.icon,f.appendChild(h)}const m=document.createElement("span");if(m.className="ui-select__option-label",m.textContent=u.label,f.appendChild(m),!s){const h=document.createElement("span");h.className="ui-select__check",h.setAttribute("aria-hidden","true"),f.appendChild(h)}f.addEventListener("click",h=>{h.stopPropagation(),this.chooseOption(u.value)}),f.addEventListener("mouseenter",()=>{this.highlightIndex.set(c)}),this.listEl.appendChild(f),this.optionEls.push(f)}};return Ve(this.props.options)?this.track(N(()=>{a(this.currentOptions())})):a(this.props.options),this.track(N(()=>{const d=this.currentOptions(),c=this.selectedValues();if(s){const u=c.length;if(u>0)n.textContent=this.formatCount(u),this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const f=this.placeholderText();n.textContent=f,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!f)}this.countEl&&(this.countEl.textContent=this.formatCount(u))}else{const u=this.single.value.get(),f=d.find(m=>m.value===u);if(f)n.textContent=f.icon?`${f.icon} ${f.label}`:f.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const m=this.placeholderText();n.textContent=m,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!m)}}for(let u=0;u<d.length;u++){const f=this.optionEls[u];if(!f||d[u].disabled)continue;const m=c.includes(d[u].value);f.setAttribute("aria-selected",String(m)),f.classList.toggle("ui-select__option--selected",m);const h=f.querySelector(".ui-select__check");h&&(h.textContent=m?"✓":"");const b=f.querySelector(".ui-select__checkbox");b&&(b.textContent=m?"✓":"")}})),this.track(N(()=>{const d=this.open.get();this.dropdownEl.classList.toggle("open",d),r.classList.toggle("ui-select__chevron--open",d),this.triggerEl.setAttribute("aria-expanded",String(d)),d?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),d&&q(()=>{const c=this.currentOptions(),u=this.selectedValues(),f=c.findIndex(h=>!h.disabled&&u.includes(h.value)),m=c.findIndex(h=>!h.disabled);this.highlightIndex.set(f>=0?f:m)})})),this.track(N(()=>{const d=this.highlightIndex.get();for(let c=0;c<this.optionEls.length;c++)this.optionEls[c].classList.toggle("ui-select__option--highlighted",c===d);d>=0&&this.optionEls[d]&&(this.triggerEl.setAttribute("aria-activedescendant",`${this.uid}-opt-${d}`),this.optionEls[d].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(Ve(this.props.disabled)?this.track(N(()=>{const d=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",d),this.triggerEl.disabled=d})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}chooseOption(e){if(this.isMulti){const t=this.multi.values.get();this.multi.values.set(t.includes(e)?t.filter(s=>s!==e):[...t,e]);return}me(()=>{this.single.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}commitHighlighted(){const e=this.highlightIndex.get(),t=this.currentOptions();e>=0&&e<t.length&&!t[e].disabled&&this.chooseOption(t[e].value)}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.open.get()?this.commitHighlighted():this.open.set(!0);break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":e.preventDefault(),this.commitHighlighted();break;case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=this.currentOptions();if(t.length===0||!t.some(n=>!n.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};pe.styles=`
        .ui-select {
            position: relative;
            display: inline-block;
        }
        /*
         * Same field base as css.ts input() (§4.9: "same field base", plus a
         * chevron). This is a CUSTOM widget, not a native select, so there is
         * no UA chevron and appearance:none has nothing to suppress — what
         * carries over is the recessed fill, the weighted bottom rule, and the
         * 34px of right padding that the chevron sits in.
         */
        .ui-select__trigger {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${w("space-2")};
            padding: 10px 34px 10px 12px;
            min-width: 160px;
            width: 100%;
            border: 1px solid ${w("border")};
            border-bottom: 2px solid ${w("border-strong")};
            border-radius: ${w("radius-sm")};
            background: ${w("bg")};
            color: ${w("text")};
            font-family: ${w("font-ui")};
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
            transition:
                border-color ${w("dur-fast")} ${w("ease-standard")},
                box-shadow ${w("dur-fast")} ${w("ease-standard")},
                background ${w("dur-fast")} ${w("ease-standard")};
        }
        .ui-select__trigger:focus-visible {
            outline: none;
            border-color: ${w("accent")};
            background: ${w("surface")};
            box-shadow: 0 0 0 3px ${w("accent-soft")};
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
        /*
         * Inline SVG at 1.5px stroke, not a text glyph. The old U+25BE rendered
         * at whatever weight and vertical offset the user's fallback font
         * happened to have; a stroked path matches the hairline weight of the
         * field borders exactly, in every environment.
         *
         * Absolutely positioned and out of the flex flow, so the label can use
         * the full width up to the trigger's 34px right padding. It must not
         * eat pointer events: a click on the chevron is a click on the trigger.
         */
        .ui-select__chevron {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            pointer-events: none;
            color: ${w("text-muted")};
            transition: transform ${w("dur-fast")} ${w("ease-standard")};
        }
        /* Keeps the centring translate — a bare rotate() would drop it. */
        .ui-select__chevron--open {
            transform: translateY(-50%) rotate(180deg);
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
            border-radius: ${w("radius-md")};
            box-shadow: ${w("shadow-2")};
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity ${w("dur-base")} ${w("ease-standard")},
                        transform ${w("dur-base")} ${w("ease-standard")};
        }
        .ui-select__dropdown.open {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
        }
        .ui-select__list {
            padding: 4px 0;
            overflow-y: auto;
            max-height: 240px;
        }
        .ui-select__option {
            display: flex;
            align-items: center;
            gap: ${w("space-2")};
            padding: ${w("space-2")} ${w("space-3")};
            cursor: pointer;
            color: ${w("text")};
            font-family: ${w("font-ui")};
            font-size: 0.875rem;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
        }
        .ui-select__option:focus-visible {
            outline: none;
        }
        .ui-select__option--highlighted {
            background: ${w("surface-2")};
        }
        .ui-select__option--selected {
            color: ${w("accent-strong")};
            font-weight: 600;
        }
        /* Multi-select: selection is a checkbox plus an accent-tinted fill,
           never weight and colour alone. */
        .ui-select__option--multi.ui-select__option--selected {
            background: ${w("accent-soft")};
        }
        .ui-select__option--multi.ui-select__option--selected.ui-select__option--highlighted {
            background: ${w("accent-soft")};
            box-shadow: inset 2px 0 0 ${w("accent")};
        }
        .ui-select__checkbox {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            border: 1px solid ${w("border-strong")};
            border-radius: 3px;
            background: ${w("surface")};
            font-size: 0.625rem;
            line-height: 1;
            color: ${w("on-accent")};
        }
        .ui-select__option--selected .ui-select__checkbox {
            background: ${w("accent")};
            border-color: ${w("accent")};
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
            color: ${w("accent-strong")};
        }
        .ui-select__count {
            padding: ${w("space-2")} ${w("space-3")};
            border-top: 1px solid ${w("border")};
            font-family: ${w("font-ui")};
            font-size: 0.75rem;
            font-weight: 600;
            color: ${w("text-muted")};
        }
    `,pe.seq=0;let W=pe;function _a(i){if(!i)return{visible:!1,selfAllowed:!1,guestAllowed:!1,blockedMessage:null};const e=i.seats.length>0,t=i.claimedSeats.some(r=>r.viewerMayRelease),s=i.viewer.claimSeat.allowed,n=i.viewer.claimSeatAsGuest.allowed;return{visible:e||t,selfAllowed:e&&s,guestAllowed:e&&n,blockedMessage:e&&!s&&!n?i.viewer.claimSeat.message??i.viewer.claimSeatAsGuest.message??"Claiming seats is not available on this round.":null}}function va(i,e){const t=[];if(i.groupId!==null&&e.length>0){const s=e.findIndex(n=>n.id===i.groupId);if(s>=0){t.push(`Group ${s+1}`);const n=e[s].startTime;n.includes(":")&&t.push(n)}}return i.category!==null&&t.push(i.category),t.join(" · ")}function wa(i){return(i?.claimedSeats??[]).filter(e=>e.viewerMayRelease)}const xa=_(`
    <div bind="root" class="seat-card hidden">
        <span class="seat-card__label">Who's playing?</span>
        <p bind="hint" class="seat-card__hint">This round has open seats — claim one to score.</p>
        <p bind="blocked" class="seat-card__blocked hidden"></p>
        <div bind="rows" class="seat-card__rows"></div>
        <div bind="releaseRows" class="seat-card__rows"></div>
        <p bind="err" class="seat-card__err"></p>
    </div>
`),$a=_(`
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
`),ka=_(`
    <div class="seat-card__release">
        <span class="seat-card__who">
            <span bind="name" class="seat-card__name"></span>
            <span bind="context" class="seat-card__context"></span>
        </span>
        <button bind="release" class="seat-card__btn seat-card__btn--ghost" type="button">Not me — release</button>
    </div>
`);class Sa extends R{static styles=`
        .seat-card {
            margin-top: ${l("lg")};
            padding: ${l("lg")};
            ${L()}
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
                margin: ${l("sm")} 0 0;
                font-size: 0.8rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__blocked {
                margin: ${l("md")} 0 0;
                font-size: 0.85rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__rows {
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
                margin-top: ${l("md")};
                &:empty { display: none; }
            }
            & .seat-card__seat {
                padding: ${l("sm")} 0;
                border-bottom: 1px solid ${o("border")};
                &:last-child { border-bottom: 0; padding-bottom: 0; }
            }
            & .seat-card__head, & .seat-card__release {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${l("md")};
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
                ${I()}
                padding: ${l("sm")} ${l("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${o("primary")};
                color: ${o("primary-text")};
                border: none;
                flex-shrink: 0;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .seat-card__btn--wide { width: 100%; margin-top: ${l("sm")}; }
            & .seat-card__btn--ghost {
                background: transparent;
                color: ${o("accent")};
                border: 1px solid ${o("border")};
                font-weight: 600;
            }
            & .seat-card__form {
                margin-top: ${l("md")};
                &.hidden { display: none; }
            }
            & .seat-card__guest {
                margin-top: ${l("sm")};
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
                &.hidden { display: none; }
            }
            & .seat-card__guest-row {
                display: flex;
                gap: ${l("sm")};
                align-items: center;
            }
            & .seat-card__input {
                width: 100%;
                padding: ${l("sm")};
                font: inherit;
                font-size: 0.9rem;
                border: 1px solid ${o("border")};
                border-radius: 8px;
                background: ${o("surface")};
                color: ${o("text")};
            }
            & .seat-card__input--hcp { width: 6rem; flex-shrink: 0; }
            & .seat-card__gender { flex: 1; }
            & .seat-card__tee { margin-bottom: ${l("sm")}; }
            & .seat-card__diag {
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__err {
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(ne);auth=this.inject(H);router=this.inject(M);tokenQ=this.router.query("token");claiming=new p(!1);error=new p("");diagnostics=new p([]);expandedSeat=new p(null);teeId=new p("");tees=new p([]);loadedForCourseId=null;guestName=new p("");guestHcp=new p("");guestGender=new p("M");state(){return _a(this.svc.startList.get())}ensureTeesLoaded(){if(!this.state().visible)return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,v.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}toggleSeat(e){this.diagnostics.set([]),this.error.set(""),this.expandedSeat.set(this.expandedSeat.get()===e?null:e)}guestHcpValue(){const e=Number.parseFloat(this.guestHcp.get().replace(",","."));return Number.isFinite(e)?e:null}async claim(e,t,s){const n=this.tokenQ.get(),r=this.teeId.get();if(!(!n||!r||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const a=await v.friendlyRounds.claimSeat({token:n,seatId:e,identity:t,teeId:r,clientEventId:s});a.ok?(this.expandedSeat.set(null),this.guestName.set(""),this.guestHcp.set(""),await this.svc.loadByToken(n)):this.diagnostics.set(a.diagnostics)}catch{this.error.set("Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}async claimSelf(e){const t=this.auth.currentUser.get()?.id??"anon";await this.claim(e,{kind:"self"},`claim-seat:${e}:${t}:${this.teeId.get()}`)}async claimGuest(e){const t=this.guestName.get().trim(),s=this.guestHcpValue();!t||s===null||await this.claim(e,{kind:"guest",name:t,handicapIndex:s,gender:this.guestGender.get()==="F"?"F":"M"},crypto.randomUUID())}async release(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const s=await v.friendlyRounds.releaseSeat({token:t,seatId:e,clientEventId:crypto.randomUUID()});s.ok?await this.svc.loadByToken(t):this.diagnostics.set(s.diagnostics)}catch{this.error.set("Could not release right now. Try again.")}finally{this.claiming.set(!1)}}}seatRow(e,t){const s=()=>this.expandedSeat.get()===e.seatId&&this.state().blockedMessage===null,n=this.wireEl($a,{label:()=>e.label,context:()=>va(e,this.svc.groups()),toggle:{textContent:()=>this.expandedSeat.get()===e.seatId?"Close":"Claim",disabled:()=>this.state().blockedMessage!==null,onclick:()=>this.toggleSeat(e.seatId)},form:{className:()=>s()?"seat-card__form":"seat-card__form hidden"},selfBtn:{className:()=>this.state().selfAllowed?"seat-card__btn seat-card__btn--wide":"seat-card__btn seat-card__btn--wide hidden",disabled:()=>this.claiming.get()||!this.teeId.get(),onclick:()=>{this.claimSelf(e.seatId)}},guestBox:{className:()=>this.state().guestAllowed?"seat-card__guest":"seat-card__guest hidden"},guestName:{oninput:d=>this.guestName.set(d.target.value)},guestHcp:{oninput:d=>this.guestHcp.set(d.target.value)},guestBtn:{disabled:()=>this.claiming.get()||!this.teeId.get()||this.guestName.get().trim()===""||this.guestHcpValue()===null,onclick:()=>{this.claimGuest(e.seatId)}},diag:{className:()=>this.diagnostics.get().length>0?"seat-card__diag":"seat-card__diag hidden",textContent:()=>this.diagnostics.get().map(d=>d.message).join(" · ")}},t),r=new W({value:this.teeId,options:{get:()=>this.tees.get().map(d=>({value:d.id,label:d.name}))},placeholder:"Tee"});r.mount(this.ref(n,"teeHost")),t(()=>r.destroy());const a=new W({value:this.guestGender,options:{get:()=>[{value:"M",label:"Men’s tee rating"},{value:"F",label:"Women’s tee rating"}]},placeholder:"Rating"});return a.mount(this.ref(n,"genderHost")),t(()=>a.destroy()),n}render(){this.track(N(()=>this.ensureTeesLoaded()));const e=this.wire(xa,{root:{className:()=>this.state().visible?"seat-card":"seat-card hidden"},hint:{className:()=>(this.svc.startList.get()?.seats.length??0)>0&&this.state().blockedMessage===null?"seat-card__hint":"seat-card__hint hidden"},blocked:{className:()=>this.state().blockedMessage!==null?"seat-card__blocked":"seat-card__blocked hidden",textContent:()=>this.state().blockedMessage??""},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.svc.startList.get()?.seats??[],(t,s,n)=>this.seatRow(t,n),t=>t.seatId),this.$each(this.ref(e,"releaseRows"),()=>wa(this.svc.startList.get()),(t,s,n)=>this.wireEl(ka,{name:()=>t.displayName,context:()=>`holds “${t.seatLabel}”`,release:{disabled:()=>this.claiming.get(),onclick:()=>{this.release(t.seatId)}}},n),t=>t.seatId),e}}function Ca(i,e,t){if(!e||t!=="not_started")return!1;for(const s of i)for(const n of s.players)if(n.playerId===e)return!1;return!0}function Ia(i){if(!i)return{visible:!1,blockedMessage:null};const e=i.viewer.join;return e.allowed?{visible:!0,blockedMessage:null}:e.code==="window_not_open"||e.code==="window_closed"?{visible:!0,blockedMessage:e.message??"Sign-up is closed right now."}:{visible:!1,blockedMessage:null}}const Ht="new";function Ta(i,e=!0){const t=i.map((n,r)=>{const a=n.ballIds.length,d=[`Group ${r+1}`];return n.startTime.includes(":")&&d.push(n.startTime),{value:n.id,label:`${d.join(" · ")} — ${a} of ${n.capacity}`,disabled:a>=n.capacity}}),s=t.find(n=>!n.disabled);return e&&t.push({value:Ht,label:"Start a new group",disabled:!1}),{options:t,defaultValue:s?.value??(e?Ht:"")}}const Ea=_(`
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
`);class Na extends R{static styles=`
        .join-card {
            margin-top: ${l("lg")};
            padding: ${l("lg")};
            ${L()}
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
                margin: ${l("sm")} 0 0;
                font-size: 0.8rem;
                color: ${o("text-muted")};
            }
            & .join-card__blocked {
                margin: ${l("md")} 0 0;
                font-size: 0.85rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }
            & .join-card__group {
                margin-top: ${l("md")};
                &.hidden { display: none; }
            }
            & .join-card__group-label {
                display: block;
                font-size: 0.8rem;
                color: ${o("text-muted")};
                margin-bottom: ${l("xs")};
            }
            & .join-card__row {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                margin-top: ${l("md")};
                &.hidden { display: none; }
            }
            & .join-card__tee { flex: 1; }
            & .join-card__btn {
                ${I()}
                padding: ${l("sm")} ${l("lg")};
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
                margin: ${l("sm")} 0 0;
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
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(ne);auth=this.inject(H);router=this.inject(M);tokenQ=this.router.query("token");joining=new p(!1);error=new p("");diagnostics=new p([]);teeId=new p("");tees=new p([]);loadedForCourseId=null;groupChoice=new p("");policyState(){return Ia(this.svc.startList.get())}eligible(){return this.policyState().visible&&Ca(this.svc.balls.get(),this.auth.currentUser.get()?.id??null,this.svc.round.get()?.status??null)}ensureTeesLoaded(){if(!this.eligible())return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,v.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}needsProfileUpdate(){return this.diagnostics.get().some(e=>e.code==="missing_gender"||e.code==="missing_handicap_index")}async join(){const e=this.tokenQ.get(),t=this.teeId.get();if(!(!e||!t||this.joining.get())){this.error.set(""),this.diagnostics.set([]),this.joining.set(!0);try{const s=this.groupChoice.get(),n=await v.friendlyRounds.join({token:e,teeId:t,...s?{groupChoice:s}:{}});n.ok?await this.svc.loadByToken(e):this.diagnostics.set(n.diagnostics)}catch(s){this.error.set(s instanceof K&&s.status===409?s.message??"You already play in this round, or it has already started.":"Could not join right now. Try again.")}finally{this.joining.set(!1)}}}render(){this.track(N(()=>this.ensureTeesLoaded()));const e=new S(()=>Ta(this.svc.groups(),this.svc.startList.get()?.viewer.createGroup.allowed??!0));this.track(N(()=>{const r=e.get(),a=this.groupChoice.get();(!a||!r.options.some(d=>d.value===a&&!d.disabled))&&this.groupChoice.set(r.defaultValue)}));const t=this.wire(Ea,{root:{className:()=>this.eligible()?"join-card":"join-card hidden"},blocked:{className:()=>this.policyState().blockedMessage!==null?"join-card__blocked":"join-card__blocked hidden",textContent:()=>this.policyState().blockedMessage??""},groupRow:{className:()=>this.svc.groups().length>0&&this.policyState().blockedMessage===null?"join-card__group":"join-card__group hidden"},row:{className:()=>this.policyState().blockedMessage===null?"join-card__row":"join-card__row hidden"},join:{disabled:()=>this.joining.get()||!this.teeId.get(),onclick:()=>{this.join()}},diag:{className:()=>this.diagnostics.get().length>0?"join-card__diag":"join-card__diag hidden"},diagText:{textContent:()=>this.diagnostics.get().map(r=>r.message).join(" · ")},profileLink:{className:()=>this.needsProfileUpdate()?"join-card__profile-link":"join-card__profile-link hidden",onclick:()=>this.router.navigate("/profile")},err:{textContent:()=>this.error.get()}}),s=new W({value:this.teeId,options:{get:()=>this.tees.get().map(r=>({value:r.id,label:r.name}))},placeholder:"Tee"});s.mount(this.ref(t,"teeHost")),this.track(()=>s.destroy());const n=new W({value:this.groupChoice,options:{get:()=>e.get().options},placeholder:"Group"});return n.mount(this.ref(t,"groupHost")),this.track(()=>n.destroy()),t}}function Pa(i,e){if(!e)return!1;for(const t of i)for(const s of t.players)if(s.playerId===e)return!0;return!1}const Ra=_(`
    <div bind="root" class="rmanage hidden">
        <div bind="backdrop" class="rmanage__backdrop"></div>
        <div class="rmanage__sheet" role="dialog" aria-modal="true" aria-label="Manage round">
            <div class="rmanage__head">
                <h2 class="rmanage__title">Manage round</h2>
                <button bind="close" class="rmanage__close" type="button">Done</button>
            </div>

            <button bind="editRow" class="rmanage__row hidden" type="button">
                <span class="rmanage__row-title">Edit round</span>
                <span class="rmanage__row-sub">Change the course, players or formats. Scores already taken are kept.</span>
            </button>

            <button bind="leaveRow" class="rmanage__row rmanage__row--danger hidden" type="button">
                <span class="rmanage__row-title">Remove me from this round</span>
                <span class="rmanage__row-sub">Your scores here will be deleted. Everyone else's stay.</span>
            </button>

            <button bind="finishRow" class="rmanage__row" type="button">
                <span bind="finishTitle" class="rmanage__row-title"></span>
                <span bind="finishSub" class="rmanage__row-sub"></span>
            </button>

            <button bind="deleteRow" class="rmanage__row rmanage__row--danger" type="button">
                <span class="rmanage__row-title">Delete round</span>
                <span class="rmanage__row-sub">Removes the round and every score in it, for everyone.</span>
            </button>

            <p bind="diag" class="rmanage__diag"></p>
            <p bind="err" class="rmanage__err"></p>

            <div bind="deleteConfirmHost"></div>
            <div bind="finishConfirmHost"></div>
            <div bind="leaveConfirmHost"></div>
        </div>
    </div>
`);class Oa extends R{static styles=`
        /* Bottom sheet, matching the handicap keypad's anatomy (backdrop +
           raised surface with rounded top corners) — the app's established
           mobile overlay idiom. Sits above the dock, below the framework
           confirm dialogs (z-index 199/200) it spawns. */
        .rmanage {
            position: fixed; inset: 0; z-index: 80;
            &.hidden { display: none; }

            & .rmanage__backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.35); }

            & .rmanage__sheet {
                position: absolute; left: 0; right: 0; bottom: 0;
                max-height: 85%;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                background: ${o("surface")};
                border-top-left-radius: 16px; border-top-right-radius: 16px;
                /* Clear the iOS home indicator; harmless zero elsewhere. */
                padding: ${l("sm")} ${l("lg")} calc(${l("xl")} + env(safe-area-inset-bottom));
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
            }

            & .rmanage__head {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${l("md")};
                padding: ${l("sm")} 0 ${l("md")};
            }
            & .rmanage__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 600; font-size: 1.25rem;
                color: ${o("text")};
            }
            & .rmanage__close {
                min-height: 44px;
                padding: 0 ${l("md")};
                background: none; border: none;
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                color: ${o("text-muted")};
                cursor: pointer;
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .rmanage__row {
                display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
                width: 100%;
                min-height: 44px;
                margin-top: ${l("sm")};
                padding: ${l("md")};
                text-align: left;
                background: none;
                border: 1px solid ${o("border")};
                border-radius: ${o("radius")};
                font-family: inherit;
                color: ${o("text")};
                cursor: pointer;

                &.hidden { display: none; }
                &:hover, &:active { border-color: ${o("text-muted")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }

                & .rmanage__row-title { font-size: 0.95rem; font-weight: 700; }
                & .rmanage__row-sub { font-size: 0.8rem; font-weight: 400; color: ${o("text-muted")}; }
            }

            /* Danger rows read in the terracotta family — a quiet ghost, never
               a filled CTA (same treatment the old delete/leave buttons had). */
            & .rmanage__row--danger {
                color: ${o("danger")};
                &:hover, &:active { border-color: ${o("danger")}; }
                &:focus-visible { outline-color: ${o("danger")}; }
            }

            & .rmanage__diag {
                margin: ${l("md")} 0 0;
                font-size: 0.85rem;
                color: ${o("text-muted")};
                &:empty { display: none; }
            }
            & .rmanage__err {
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${o("danger")};
                &:empty { display: none; }
            }
        }

        /* App-level accessibility override for the framework confirm dialogs
           this sheet spawns. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;svc=this.inject(ne);auth=this.inject(H);router=this.inject(M);tokenQ=this.router.query("token");editable=new p(!1);deleteOpen=new p(!1);finishOpen=new p(!1);finishAsReopen=new p(!1);leaveOpen=new p(!1);leaving=new p(!1);error=new p("");diagnostics=new p([]);isComplete(){return this.svc.round.get()?.status==="complete"}canLeave(){return Pa(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}clear(){this.error.set(""),this.diagnostics.set([])}async leave(){const e=this.tokenQ.get();if(!(!e||this.leaving.get())){this.clear(),this.leaving.set(!0);try{const t=await v.friendlyRounds.leave({token:e});t.ok?await this.svc.loadByToken(e):this.diagnostics.set(t.diagnostics)}catch{this.error.set("Could not remove you right now. Try again.")}finally{this.leaving.set(!1)}}}render(){this.track(N(()=>{const r=this.tokenQ.get();this.editable.set(!1),r&&v.friendlyRounds.setup({token:r}).then(a=>{this.tokenQ.get()===r&&this.editable.set(a.editable===!0)}).catch(()=>{})})),this.track(N(()=>{this.props.open.get()&&this.clear()}));const e=this.wire(Ra,{root:{className:()=>this.props.open.get()?"rmanage":"rmanage hidden"},backdrop:{onclick:()=>this.props.open.set(!1)},close:{onclick:()=>this.props.open.set(!1)},editRow:{className:()=>this.editable.get()?"rmanage__row":"rmanage__row hidden",onclick:()=>{const r=this.tokenQ.get();r&&(this.props.open.set(!1),this.router.navigate("/create",{query:{token:r}}))}},leaveRow:{className:()=>this.canLeave()?"rmanage__row rmanage__row--danger":"rmanage__row rmanage__row--danger hidden",onclick:()=>this.leaveOpen.set(!0),disabled:()=>this.leaving.get()},finishRow:{onclick:()=>{this.finishAsReopen.set(this.isComplete()),this.finishOpen.set(!0)},disabled:()=>this.svc.finishing.get()},finishTitle:()=>this.isComplete()?"Reopen round":"Finish round",finishSub:()=>this.isComplete()?"Move it back to your ongoing rounds.":"Move it to your finished rounds. Nothing is locked.",deleteRow:{onclick:()=>this.deleteOpen.set(!0),disabled:()=>this.svc.deleting.get()},diag:{textContent:()=>this.diagnostics.get().map(r=>r.message).join(" · ")},err:{textContent:()=>this.error.get()}});this.spawn(U,this.ref(e,"deleteConfirmHost"),{open:this.deleteOpen,title:"Delete round?",message:"This permanently removes the round and all its scores for everyone. This can't be undone.",confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.clear(),this.svc.deleteRound().then(r=>{r?this.router.navigate("/"):this.error.set("Could not delete the round. Try again.")})}}),this.spawn(U,this.ref(e,"finishConfirmHost"),{open:this.finishOpen,title:()=>this.finishAsReopen.get()?"Reopen this round?":"Finish this round?",message:()=>this.finishAsReopen.get()?"It'll move back to your ongoing rounds.":"It'll move to your finished rounds. You can still edit or reopen it any time.",confirmLabel:()=>this.finishAsReopen.get()?"Reopen round":"Finish round",cancelLabel:"Cancel",onconfirm:()=>{this.clear(),(this.finishAsReopen.get()?this.svc.reopenRound():this.svc.finishRound()).then(a=>{a||this.error.set("Could not update the round. Try again.")})}}),this.spawn(U,this.ref(e,"leaveConfirmHost"),{open:this.leaveOpen,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.leave()}});let t=null;const s=this.ref(e,"close");this.track(N(()=>{this.props.open.get()?(t=document.activeElement instanceof HTMLElement?document.activeElement:null,queueMicrotask(()=>s.focus())):t&&(t.focus(),t=null)}));const n=r=>{if(r.key==="Escape"){if(this.deleteOpen.get())return void this.deleteOpen.set(!1);if(this.finishOpen.get())return void this.finishOpen.set(!1);if(this.leaveOpen.get())return void this.leaveOpen.set(!1);this.props.open.get()&&this.props.open.set(!1)}};return window.addEventListener("keydown",n),this.track(()=>window.removeEventListener("keydown",n)),e}}function Ft(i){return!(!i.pageVisible||i.status==="complete")}function za(i,e){return e&&!i}const ja=2,Bt=3,La=75e3;function Aa(i,e=null){const t=new URLSearchParams({token:i});return e!==null&&t.set("since",e),`${D}/friendly-rounds/events?${t.toString()}`}function Da(i){if(typeof i!="object"||i===null)return!1;const e=i;return e.latestEventId!==null&&typeof e.latestEventId!="string"?!1:e.status==="not_started"||e.status==="active"||e.status==="complete"}function Ma(i){const e=i.eventSourceFactory??(C=>new EventSource(C)),t=i.setTimer??((C,A)=>setTimeout(C,A)),s=i.clearTimer??(C=>clearTimeout(C)),n=i.livenessTimeoutMs??La,r=i.isPageVisible??(()=>typeof document>"u"||!document.hidden);let a=!1,d=0,c=null,u=null,f=i.since??null;const m=()=>{u!==null&&(s(u),u=null)},h=()=>{m(),u=t(O,n)},b=()=>{c!==null&&(c.onopen=null,c.onmessage=null,c.onerror=null,c.close(),c=null)},g=()=>{a=!0,m(),b()},x=()=>{if(b(),++d>=Bt){g(),i.onDegrade();return}j()};function O(){if(!a){if(!r()){h();return}x()}}function j(){if(a)return;let C;try{C=e(Aa(i.token,f))}catch{g(),i.onDegrade();return}c=C,C.onopen=()=>{d=0},C.onmessage=A=>{if(a||c!==C)return;h();let F;try{F=JSON.parse(A.data)}catch{return}Da(F)&&(F.latestEventId!==null&&(f=F.latestEventId),i.onEvent({latestEventId:F.latestEventId,status:F.status}))},C.onerror=()=>{a||c!==C||(C.readyState===ja||++d>=Bt)&&(g(),i.onDegrade())},h()}return j(),{stop:()=>{a||g()}}}const Ha=2e4;function Fa(i){if(!(i===null||i===""))return/^\d+$/.test(i)?Number(i):i}const Ba=_(`
    <div class="round-view">
        <div bind="main" class="round-view__main">
            <button bind="back" class="round-view__back" type="button">← Home</button>
            <div bind="notfound" class="round-view__notfound">That share link didn't lead to a round.</div>
            <div bind="body" class="round-view__body">
                <header class="round-view__head">
                    <h1 bind="course"></h1>
                    <div class="round-view__chrome">
                        <span bind="status" class="round-view__status"></span>
                        <button bind="manageBtn" class="round-view__manage" type="button" aria-label="Manage round">⋯</button>
                    </div>
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
                    <div bind="claim"></div>
                    <div bind="join"></div>
                </div>

                <div bind="lbPanel" class="round-view__panel hidden">
                    <div bind="leaderboard"></div>
                </div>
            </div>
        </div>

        <div bind="manageHost"></div>

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
`),Ga=_('<button bind="pill" class="round-view__fmt" type="button"></button>'),qa=_('<button bind="pill" class="round-view__grp" type="button"></button>');class Ka extends R{static styles=`
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
                color: ${o("text-muted")};
                cursor: pointer;
                padding: ${l("xs")} 0;
                margin-bottom: ${l("md")};
            }

            & .round-view__notfound {
                color: ${o("text-muted")};
                padding: ${l("xl")} 0;

                &.hidden { display: none; }
            }

            & .round-view__body.hidden { display: none; }
            & .round-view__panel.hidden { display: none; }

            & .round-view__head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: ${l("md")};

                & h1 {
                    margin: 0;
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 1.8rem;
                    letter-spacing: -0.02em;
                    color: ${o("text")};
                }
            }

            /* Header chrome: the status badge and the "⋯" manage affordance,
               which is the single entry point to every round-level management
               action (edit / leave / finish / delete). It lives HERE, not in
               the score panel, so it is reachable from both tabs. */
            & .round-view__chrome {
                display: flex;
                align-items: center;
                gap: ${l("xs")};
                flex-shrink: 0;
            }

            & .round-view__manage {
                &.hidden { display: none; }
                width: 44px;
                height: 44px;
                flex-shrink: 0;
                background: none;
                border: none;
                border-radius: ${o("radius-pill")};
                font-family: inherit;
                font-size: 1.5rem;
                line-height: 1;
                color: ${o("text-muted")};
                cursor: pointer;

                &:hover, &:active { background: ${o("surface-sunken")}; color: ${o("text")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
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
                gap: ${l("md")};
                margin-top: ${l("xs")};
                color: ${o("text-muted")};
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
                    border: 1px solid ${o("border")};
                    border-radius: ${o("radius-pill")};
                    background: ${o("btn-bg")};
                    color: ${o("text")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    padding: ${l("sm")} ${l("lg")};
                    cursor: pointer;
                    white-space: nowrap;
                    &.active { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                }
            }

            /* Playing-group selector (Phase 3.5) — shown only when the round
               has 2+ groups; scopes the score carousel to one group's balls
               and its rotated itinerary. */
            & .round-view__groups {
                margin-top: ${l("md")};
                display: flex;
                gap: ${l("sm")};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: ${l("xs")};
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
                    padding: ${l("sm")} ${l("lg")};
                    cursor: pointer;
                    white-space: nowrap;
                    font-variant-numeric: tabular-nums;
                    &.active { background: ${o("accent")}; color: ${o("primary-text")}; border-color: ${o("accent")}; }
                }
            }

            & .round-view__share {
                margin-top: ${l("2xl")};
                padding: ${l("lg")};
                ${L()}
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
                    gap: ${l("sm")};
                    margin-top: ${l("sm")};
                }
                & .round-view__share-url {
                    ${V()}
                    flex: 1;
                    font-size: 0.8rem;
                    color: ${o("text-muted")};
                }
                & .round-view__copy {
                    ${I()}
                    padding: 0 ${l("lg")};
                    font-weight: 700;
                    background: ${o("primary")};
                    color: ${o("primary-text")};
                    border: none;
                }
                & .round-view__share-hint {
                    margin: ${l("sm")} 0 0;
                    font-size: 0.8rem;
                    color: ${o("text-muted")};
                }
            }
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
            gap: ${l("md")};
            background: ${o("hole-bar")};
            color: ${o("hole-bar-text")};
            padding: ${l("sm")} ${l("lg")};

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
                &.active { color: ${o("accent")}; }
            }
        }
    `;svc=this.inject(ne);router=this.inject(M);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new p(this.initPos.tab);pageVisible=new p(!document.hidden);hasRound=new S(()=>this.svc.round.get()!==null);hasScoring=new S(()=>this.svc.balls.get().length>0);manageOpen=new p(!1);shareUrl=new S(()=>{const e=this.tokenQ.get(),t="/tapscore/".replace(/\/+$/,"");return e?`${location.origin}${t}/round?token=${e}`:""});render(){this.track(N(()=>{const h=this.tokenQ.get();h&&this.svc.loadByToken(h,this.initPos).then(()=>{this.tab.get()==="leaderboard"&&this.svc.loadResult()})}));const e=()=>{this.svc.flushPending()};window.addEventListener("online",e),this.track(()=>window.removeEventListener("online",e));let t=null,s=null,n=null,r=!1;const a=h=>!r&&Ft({pageVisible:h,status:this.svc.round.get()?.status??null}),d=()=>{const h=!document.hidden,b=za(this.pageVisible.get(),h),g=a(h);this.pageVisible.set(h),b&&this.tokenQ.get()&&this.svc.refreshAll({feedWillReconnect:g})};document.addEventListener("visibilitychange",d),this.track(()=>document.removeEventListener("visibilitychange",d));const c=()=>{n!==null&&(clearInterval(n),n=null)},u=()=>{n===null&&(n=setInterval(()=>{this.svc.pollResult(),this.svc.refreshScorecard()},Ha))};this.track(N(()=>{const h=this.tokenQ.get()||null,b=Ft({pageVisible:this.pageVisible.get(),status:this.svc.round.get()?.status??null});if(s!==h&&(t?.stop(),t=null,s=null,c(),r=!1),!b){t?.stop(),t=null,s=null,c(),r=!1;return}if(r){u();return}if(t===null&&h){s=h;try{const g=Ma({token:h,since:this.svc.persistedCursor(h),onEvent:x=>this.svc.onLiveResultEvent(x),onDegrade:()=>{t=null,r=!0,u()}});r||(t=g)}catch{t=null,r=!0,u()}}})),this.track(()=>{t?.stop(),t=null,s=null,c()}),this.track(N(()=>{const h=this.tab.get(),b=this.svc.selectedSlotDefId(),g=this.svc.holeIdx.get();if(this.router.route.get()!=="/round"||!this.hasRound.get())return;const x=this.tokenQ.get();if(!x)return;const O={token:x};h==="leaderboard"&&(O.tab="board");const j=this.svc.round.get()?.formatSlots[0]?.slotDefId??null;b&&b!==j&&(O.slot=b),g>0&&(O.hole=g+1),this.router.navigate(this.router.route.get(),{replace:!0,query:O})}));const f={not_started:"Not started",active:"Live",complete:"Finished"},m=this.wire(Ba,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},course:()=>this.svc.round.get()?.courseNameSnapshot??"Round",status:()=>{const h=this.svc.round.get()?.status??"not_started";return f[h]??h},date:()=>this.svc.round.get()?.date??"",route:()=>{const h=this.svc.round.get();return h?`${h.playHoles.length} holes`:""},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},groupTabs:{className:()=>this.svc.groups().length>1?"round-view__groups":"round-view__groups hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},manageBtn:{className:()=>this.hasRound.get()?"round-view__manage":"round-view__manage hidden",onclick:()=>this.manageOpen.set(!0)},dock:{className:()=>this.hasRound.get()&&!this.svc.keypadOpen.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const h=this.svc.currentPlayedHole();return h?this.svc.occLabel(h.playHoleId):""},holeSi:()=>{const h=this.svc.currentPlayHole()?.baseStrokeIndex;return h!=null?String(h):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});return this.$each(this.ref(m,"groupTabs"),new S(()=>this.svc.groups()),(h,b,g)=>this.groupPill(b,g),h=>h.id),this.$each(this.ref(m,"formats"),new S(()=>this.svc.round.get()?.formatSlots??[]),(h,b,g)=>this.slotPill(h,b,g),h=>h.slotDefId),this.spawn(Or,this.ref(m,"scoring")),this.spawn(pa,this.ref(m,"leaderboard")),this.spawn(Sa,this.ref(m,"seats")),this.spawn(ba,this.ref(m,"claim")),this.spawn(Na,this.ref(m,"join")),this.spawn(Oa,this.ref(m,"manageHost"),{open:this.manageOpen}),m}readUrlPosition(){const e=new URLSearchParams(location.search),t=e.get("slot"),s=Number(e.get("hole"));return{tab:e.get("tab")==="board"?"leaderboard":"score",selectedSlot:Fa(t),holeIdx:Number.isFinite(s)&&s>0?s-1:0}}groupPill(e,t){return this.wireEl(qa,{pill:{textContent:()=>{const s=this.svc.groups()[e];if(!s)return`Group ${e+1}`;const n=[`Group ${e+1}`];s.startTime.includes(":")&&n.push(s.startTime);const r=this.svc.playHoleById(s.startPlayHoleId)?.courseHoleNumber;return r!==void 0&&s.startOrdinal!==1&&n.push(`H${r}`),n.join(" · ")},className:()=>this.svc.groupIdx.get()===e?"round-view__grp active":"round-view__grp",onclick:()=>this.svc.groupIdx.set(e)}},t)}slotPill(e,t,s){return this.wireEl(Ga,{pill:{textContent:()=>vs(e),className:()=>this.tab.get()==="leaderboard"&&this.svc.selectedSlotDefId()===e.slotDefId?"round-view__fmt active":"round-view__fmt",onclick:()=>{this.svc.selectSlot(e.slotDefId),this.tab.get()!=="leaderboard"&&(this.tab.set("leaderboard"),this.svc.loadResult())}}},s)}}function X(i){const e=i.trim().replace(",",".");if(e==="")return null;const t=e.startsWith("+"),s=Number.parseFloat(t?e.slice(1):e);return Number.isFinite(s)?t?-s:s:null}function Ps(i){return i<0?`+${String(-i)}`:String(i)}function Rs(i){return i.formatIndex??i.slotIndex??null}function Va(i,e){return i.filter(t=>Rs(t)===e)}function Ua(i){return i.filter(e=>!e.path?.startsWith("producers")&&!e.path?.startsWith("playingGroups")&&e.path!=="route"&&Rs(e)===null)}function te(i){return`${i} ${i===1?"player":"players"}`}function xe(i,e){const t=i.formatId?e(i.formatId)??i.formatId:null,s=i.teamLabel;switch(i.code){case"team_size_above_max":if(t&&s&&i.actual!==void 0&&i.allowedMax!==void 0)return`${s} has ${te(i.actual)} — ${t} allows at most ${i.allowedMax} per team.`;break;case"team_size_below_min":if(t&&s&&i.actual!==void 0&&i.allowedMin!==void 0)return`${s} has ${te(i.actual)} — ${t} needs at least ${i.allowedMin} per team.`;break;case"empty_team_grouping":if(t&&s)return`${s} has no players — add at least one, or remove the team.`;break;case"team_count_above_max":if(t&&i.actual!==void 0&&i.allowedMax!==void 0)return`${i.actual} teams — ${t} allows at most ${i.allowedMax}.`;break;case"team_count_below_min":if(t&&i.actual!==void 0&&i.allowedMin!==void 0)return`${i.actual} teams — ${t} needs at least ${i.allowedMin}.`;break;case"slot_ball_count_above_max":if(t&&i.actual!==void 0&&i.allowedMax!==void 0)return`${te(i.actual)} in ${t} — it scores at most ${i.allowedMax}.`;break;case"slot_ball_count_below_min":if(t&&i.actual!==void 0&&i.allowedMin!==void 0)return`${te(i.actual)} in ${t} — it needs at least ${i.allowedMin}.`;break;case"slot_ball_count_not_multiple":if(t&&i.actual!==void 0)return`${t} pairs its balls, so it needs an even number — ${te(i.actual)} won't pair up.`;break;case"missing_team_grouping":if(t)return`${t} compares teams — under Teams, group the players into “Separate balls (a side)” teams, then tick them under “Scores”.`;break;case"ball_mode_violation":if(t&&i.actual!==void 0)return i.actual>1?`${t} is played with everyone on their own ball — a “One combined ball” team can’t play it. Use a “Separate balls (a side)” team instead.`:`${t} is played on one shared team ball — under Teams, group the players into a “One combined ball” team, then tick that team instead of the individual players.`;break;case"producer_count_violation":if(t&&i.actual!==void 0&&i.allowedMin!==void 0&&i.allowedMax!==void 0){if(i.allowedMax===1&&i.actual>1)return`${t} is played with everyone on their own ball — a “One combined ball” team can’t play it. Use a “Separate balls (a side)” team instead.`;const n=i.allowedMin===i.allowedMax?`exactly ${te(i.allowedMin)}`:`${i.allowedMin}–${i.allowedMax} players`;return`A ball in ${t} has ${te(i.actual)} — it needs ${n} per ball.`}break;case"producer_has_scores":return i.message;case"scored_ball_orphaned":return i.message;case"edit_locked_course_route":return"Scores have already been recorded — the course and route are locked for this round.";case"round_complete":return"This round is complete — its setup can no longer be edited.";case"not_editable":return"This round can no longer be edited."}return i.message}function Wa(i){return i?i.type==="flat"?String(i.pct):i.bands.length>0?String(i.bands[0].pct):"100":"100"}function Qa(i){const e={};if(!i||typeof i!="object")return e;for(const[t,s]of Object.entries(i))typeof s=="string"&&(e[t]=s);return e}function Ya(i){const e=i.roundType;if(e==="full_18"||e==="front_9"||e==="back_9")return{preset:e,startHole:Xa(i)};const t=(i.route?.playHoles??[]).map(a=>a.courseHoleNumber),s=t[0]??1,n=new Set(t);return{preset:t.length<=9&&[...n].every(a=>a<=9)?"front_9":t.length<=9&&[...n].every(a=>a>=10)?"back_9":"full_18",startHole:s}}function Xa(i){return i.roundType==="back_9"?10:1}function Ja(i,e=()=>""){let t=1,s=1,n=1,r=1;const a=new Map,d=i.producers.map(g=>{const x=t++;a.set(g.producerDefId,x);const O=g.playerRef.kind==="guest";return{key:x,name:e(g.producerDefId),handicapIndex:Ps(g.handicapIndex),gender:g.gender??"M",teeId:g.teeId,producerDefId:g.producerDefId,...O?{guestPlayerId:g.playerRef.id,guestOriginalName:e(g.producerDefId)}:{playerId:g.playerRef.id,genderKnown:g.gender!=null}}}),c=new Map;(i.teams??[]).forEach(g=>{c.set(g.id,s++)});const u=(i.teams??[]).map(g=>{const x=c.get(g.id),O={},j={};for(const C of g.members)if("producerDefId"in C){const A=a.get(C.producerDefId);A!==void 0&&(O[A]=String(C.allowancePct))}else{const A=c.get(C.teamId);A!==void 0&&(j[A]=!0)}return{key:x,kind:g.kind??"single_ball",formation:g.formation??"scramble",pctByPlayer:O,memberTeams:j,autoCreated:!1}}),f=(i.playingGroups??[]).map(g=>{const x={};for(const O of g.members){const j=a.get(O);j!==void 0&&(x[j]=!0)}return{key:n++,startTime:g.startTime??"",startHole:g.startHole??null,members:x}}),m=i.formats.map(g=>{const x={},O={},j=g.subjects;if(j){const C=new Set;for(const A of j)if(A.kind==="player"){const F=a.get(A.producerDefId);F!==void 0&&C.add(F)}else{const F=c.get(A.teamId);F!==void 0&&(O[F]=!0)}for(const A of d)x[A.key]=C.has(A.key)}return{key:r++,formatId:g.formatId,allowancePct:Wa(g.allowanceConfig),subjectPlayers:x,subjectTeams:O,config:Qa(g.formatConfig)}}),{preset:h,startHole:b}=Ya(i);return{courseId:i.courseId,preset:h,startHole:b,players:d,teams:u,groups:f,formatSlots:m,nextKey:t,nextTeamKey:s,nextGroupKey:n,nextSlotKey:r}}const Za=["scramble","greensomes","foursomes","custom"],$e=2,eo="ABCDEFGH",to={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class so{loading=new p(!1);error=new p(null);courses=new p([]);tees=new p([]);courseId=new p("");preset=new p("full_18");startHole=new p(1);players=new p([]);teams=new p([]);groups=new p([]);formatSlots=new p([]);picked=new p([]);customOpen=new p(!1);submitting=new p(!1);diagnostics=new p([]);submitError=new p(null);editToken=new p(null);hasScores=new p(!1);editStatus=new p(null);editBlockedReason=new p(null);editPlayedAt=null;catalog=B.get(fe);nextKey=1;nextSlotKey=1;nextTeamKey=1;nextGroupKey=1;nextPickKey=1;reset(){this.courses.set([]),this.tees.set([]),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.groups.set([]),this.formatSlots.set([]),this.picked.set([]),this.customOpen.set(!1),this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.editToken.set(null),this.hasScores.set(!1),this.editStatus.set(null),this.editBlockedReason.set(null),this.editPlayedAt=null,this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1,this.nextGroupKey=1,this.nextPickKey=1}async load(){this.catalog.load().then(()=>this.ensureDefaultGame());const e=await z(this.loading,this.error,()=>v.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}async loadForEdit(e){this.reset(),this.editToken.set(e),await this.catalog.load();const t=await z(this.loading,this.error,()=>v.friendlyRounds.setup({token:e}));if(!t)return;if(this.editStatus.set(t.status),!t.editable){this.editBlockedReason.set(t.reason);return}if(t.draft.producers.some(c=>"placeholder"in c)){this.editBlockedReason.set("has_open_seats");return}this.hasScores.set(t.hasScores),this.editPlayedAt=t.draft.playedAt;const s=await z(this.loading,this.error,()=>v.setup.courses());s&&this.courses.set(s);const n=await z(this.loading,this.error,()=>v.setup.teesByCourse({courseId:t.draft.courseId}));this.tees.set(n??[]);const r=await z(this.loading,this.error,()=>v.friendlyRounds.balls({token:e})),a=new Map;for(const c of r??[])for(const u of c.players)a.set(u.producerDefId,u.displayName);const d=Ja(t.draft,c=>a.get(c)??"");this.courseId.set(d.courseId),this.preset.set(d.preset),this.startHole.set(d.startHole),this.players.set(d.players),this.teams.set(d.teams),this.groups.set(d.groups),this.formatSlots.set(d.formatSlots),this.picked.set([]),this.customOpen.set(!0),this.nextKey=d.nextKey,this.nextTeamKey=d.nextTeamKey,this.nextGroupKey=d.nextGroupKey,this.nextSlotKey=d.nextSlotKey}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const s=await z(this.loading,this.error,()=>v.setup.teesByCourse({courseId:e}))??[];this.tees.set(s);const n=new Set(s.map(a=>a.id)),r=s[0]?.id??"";this.players.set(this.players.get().map(a=>({...a,teeId:n.has(a.teeId)?a.teeId:r}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}]),this.syncGamesToRoster()}addMe(e){this.addFriend(e)}addFriend(e){if(this.hasPlayer(e.id))return;const t=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:e.displayName,handicapIndex:e.handicapIndex===null?"":Ps(e.handicapIndex),gender:e.gender??"M",genderKnown:e.gender!=null,teeId:t,playerId:e.id}]),this.syncGamesToRoster()}hasPlayer(e){return this.players.get().some(t=>t.playerId===e)}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e)),this.groups.set(this.groups.get().map(t=>{if(t.members[e]===void 0)return t;const s={...t.members};return delete s[e],{...t,members:s}})),this.syncGamesToRoster()}patchPlayer(e,t){this.players.set(this.players.get().map(s=>s.key===e?{...s,...t}:s))}ensureDefaultGame(){if(this.editToken.get()||this.formatSlots.get().length>0||this.picked.get().length>0||this.catalog.byId("stableford_individual")&&(this.pickGame("stableford_individual"),this.formatSlots.get().length>0))return;const e=this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",s={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{},config:this.defaultConfigFor(t)};this.formatSlots.set([...this.formatSlots.get(),s])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}defaultConfigFor(e){return{...this.catalog.byId(e)?.defaults.formatConfig??{}}}setSlotConfig(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{config:{...n.config,[t]:s}})}slotConfigValue(e,t){return this.slotByKey(e)?.config[t.key]??t.default}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(s=>s.key===e?{...s,...t}:s))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t,config:this.defaultConfigFor(t)})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return eo[e]??`T${e+1}`}presetGames(){return this.catalog.presets()}shapeOfGame(e){const t=this.catalog.byId(e);return t?this.catalog.playableShape(t):null}isIndividualShape(e){return e.size.max===1&&e.count.max===void 0}isIndividualGame(e){const t=this.shapeOfGame(e);return t?this.isIndividualShape(t):!1}minPlayersFor(e){const t=this.shapeOfGame(e);return!t||this.isIndividualShape(t)?0:t.count.min*t.size.min}gameFits(e){return this.players.get().length>=this.minPlayersFor(e)}gameNeedsText(e){const t=this.minPlayersFor(e),s=Math.max(0,t-this.players.get().length);return`Needs ${t} players — add ${s} more.`}gameShapeText(e){const t=this.shapeOfGame(e);if(!t)return"";if(this.isIndividualShape(t))return"Everyone plays their own ball";const s=t.count.max===t.count.min?`${t.count.min} balls`:`${t.count.min}+ balls`,n=t.size.max===1?"one player each":t.size.min===t.size.max?`${t.size.min} players each`:t.size.min===1?"each a player or a team":`${t.size.min}–${t.size.max} players each`;return`${s} · ${n}`}isGamePicked(e){return this.picked.get().some(t=>t.formatId===e)}pickedByKey(e){return this.picked.get().find(t=>t.key===e)??null}gameLabel(e){return this.catalog.labelOf(e)??e}toggleGame(e){const t=this.picked.get().find(s=>s.formatId===e);t?this.unpickGame(t.key):this.pickGame(e)}pickGame(e){const t=this.shapeOfGame(e);if(!t||this.isGamePicked(e)||!this.gameFits(e))return;const s=this.isIndividualShape(t)?null:this.adoptableTeams(t),n=s?{key:this.nextPickKey++,formatId:e,ballCount:s.length,ballByPlayer:this.assignmentFromTeams(s),ballTeams:Object.fromEntries(s.map((r,a)=>[a,r.key]))}:{key:this.nextPickKey++,formatId:e,ballCount:this.isIndividualShape(t)?0:t.count.min,ballByPlayer:this.defaultAssignment(t,this.isIndividualShape(t)?0:t.count.min),ballTeams:{}};this.picked.set([...this.picked.get(),n]),this.regenerateGame(n)}adoptableTeams(e){const t=this.teams.get().filter(n=>n.kind==="multi_ball");if(t.length===0||t.length<e.count.min||e.count.max!==void 0&&t.length>e.count.max)return null;const s=new Set;for(const n of t){const r=this.teamMemberCount(n.key);if(r<e.size.min||r>e.size.max)return null;for(const a of Object.keys(n.pctByPlayer)){if(s.has(Number(a)))return null;s.add(Number(a))}}return t}assignmentFromTeams(e){const t={};for(const s of this.players.get()){const n=e.findIndex(r=>r.pctByPlayer[s.key]!==void 0);n>=0&&(t[s.key]=n)}return t}unpickGame(e){this.picked.set(this.picked.get().filter(t=>t.key!==e)),this.formatSlots.set(this.formatSlots.get().filter(t=>t.gameKey!==e)),this.collectUnreferencedTeams()}collectUnreferencedTeams(){const e=new Set;for(const s of this.formatSlots.get())for(const[n,r]of Object.entries(s.subjectTeams))r&&e.add(Number(n));for(const s of this.picked.get())for(const n of Object.values(s.ballTeams))e.add(n);const t=this.teams.get().filter(s=>!s.autoCreated||e.has(s.key));t.length!==this.teams.get().length&&this.teams.set(t)}defaultAssignment(e,t){const s={};if(t<=0)return s;const n=this.players.get(),r=n.length%t===0?n.length/t:e.size.min,a=Math.max(1,Math.min(r,e.size.max));let d=0;for(let c=0;c<t&&d<n.length;c++)for(let u=0;u<a&&d<n.length;u++,d++)s[n[d].key]=c;return s}gameBalls(e){const t=this.pickedByKey(e);return t?Array.from({length:t.ballCount},(s,n)=>n):[]}ballOf(e,t){const s=this.pickedByKey(e)?.ballByPlayer[t];return s===void 0?null:s}assignBall(e,t,s){const n=this.pickedByKey(e);if(!n)return;const r={...n.ballByPlayer};s===null?delete r[t]:r[t]=s,this.applyGameEdit({...n,ballByPlayer:r})}applyGameEdit(e){this.picked.set(this.picked.get().map(t=>t.key===e.key?e:t)),this.regenerateGame(e),this.syncGamesFromTeams(e.key)}syncGamesFromTeams(e){const t=new Map(this.teams.get().map(r=>[r.key,r])),s=[],n=this.picked.get().map(r=>{if(r.key===e)return r;const a={...r.ballByPlayer};let d=!1;for(const[u,f]of Object.entries(r.ballTeams)){const m=t.get(f);if(!m)continue;const h=Number(u);for(const[b,g]of Object.entries(a)){const x=Number(b);g===h&&m.pctByPlayer[x]===void 0&&(delete a[x],d=!0)}for(const b of Object.keys(m.pctByPlayer)){const g=Number(b);a[g]!==h&&(a[g]=h,d=!0)}}if(!d)return r;const c={...r,ballByPlayer:a};return s.push(c),c});this.picked.set(n);for(const r of s)this.regenerateGame(r)}forkGame(e){const t=this.pickedByKey(e);if(!t)return;const s=this.teams.get(),n={},r=[];let a=-1;for(const[c,u]of Object.entries(t.ballTeams)){const f=s.findIndex(h=>h.key===u);if(f<0)continue;const m=s[f];r.push({...m,key:this.nextTeamKey++,pctByPlayer:{...m.pctByPlayer},memberTeams:{...m.memberTeams},autoCreated:!0}),n[Number(c)]=r.at(-1).key,f>a&&(a=f)}this.teams.set([...s.slice(0,a+1),...r,...s.slice(a+1)]);const d={...t,ballTeams:n};this.picked.set(this.picked.get().map(c=>c.key===e?d:c)),this.regenerateGame(d)}canAddBall(e){const t=this.pickedByKey(e);if(!t||t.ballCount===0)return!1;const s=this.shapeOfGame(t.formatId);return!!s&&(s.count.max===void 0||t.ballCount<s.count.max)}addBall(e){const t=this.pickedByKey(e);!t||!this.canAddBall(e)||this.applyGameEdit({...t,ballCount:t.ballCount+1})}slotForGame(e){return this.formatSlots.get().find(t=>t.gameKey===e)??null}ballMembers(e,t){const s=this.pickedByKey(e);return s?this.players.get().filter(n=>s.ballByPlayer[n.key]===t):[]}sittingOut(e){const t=this.pickedByKey(e);return!t||t.ballCount===0?[]:this.players.get().filter(s=>t.ballByPlayer[s.key]===void 0)}regenerateGame(e){const t=this.shapeOfGame(e.formatId);if(!t)return;const s=this.players.get(),n={},r={},a=[];let d=this.teams.get();for(let m=0;m<e.ballCount;m++){const h=s.filter(C=>e.ballByPlayer[C.key]===m),b=e.ballTeams[m];if(h.length===0){b!==void 0&&(r[m]=b);continue}if(h.length===1&&t.size.min===1){n[h[0].key]=!0,b!==void 0&&(r[m]=b);continue}const g=d.find(C=>C.key===e.ballTeams[m]),x=Object.fromEntries(h.map(C=>[C.key,g?.pctByPlayer[C.key]??"100"]));if(g){d=d.map(C=>C.key===g.key?{...C,kind:"multi_ball",pctByPlayer:x}:C),r[m]=g.key,a.push(g.key);continue}const O={key:this.nextTeamKey++,kind:"multi_ball",formation:"custom",pctByPlayer:x,memberTeams:{},autoCreated:!0},j=this.lastTeamIndexOf(d,r,e);d=[...d.slice(0,j+1),O,...d.slice(j+1)],r[m]=O.key,a.push(O.key)}if(e.ballCount>0)for(const m of s)n[m.key]===void 0&&(n[m.key]=!1);this.teams.set(d),this.picked.set(this.picked.get().map(m=>m.key===e.key?{...m,ballTeams:r}:m));const c=this.formatSlots.get(),u=c.find(m=>m.gameKey===e.key),f={key:u?.key??this.nextSlotKey++,formatId:e.formatId,allowancePct:u?.allowancePct??"100",subjectPlayers:n,subjectTeams:Object.fromEntries(a.map(m=>[m,!0])),config:u?.config??this.defaultConfigFor(e.formatId),gameKey:e.key};this.formatSlots.set(u?c.map(m=>m.key===f.key?f:m):[...c,f]),this.collectUnreferencedTeams()}lastTeamIndexOf(e,t,s){const n=new Set([...Object.values(t),...Object.values(s.ballTeams)]);let r=e.length-1;for(const[a,d]of e.entries())n.has(d.key)&&(r=a);return r}syncGamesToRoster(){const e=this.players.get(),t=new Set(e.map(n=>n.key)),s=this.picked.get().map(n=>{if(n.ballCount===0)return n;const r=this.shapeOfGame(n.formatId)?.size.min??1,a={};for(const[d,c]of Object.entries(n.ballByPlayer))t.has(Number(d))&&c<n.ballCount&&(a[Number(d)]=c);for(const d of e)if(a[d.key]===void 0){for(let c=0;c<n.ballCount;c++)if(Object.values(a).filter(f=>f===c).length<r){a[d.key]=c;break}}return{...n,ballByPlayer:a}});this.picked.set(s);for(const n of s)this.regenerateGame(n);this.syncGamesFromTeams(-1)}gameWarnings(e){const t=this.pickedByKey(e),s=t?this.shapeOfGame(t.formatId):null;if(!t||!s)return[];const n=this.gameLabel(t.formatId);if(!this.gameFits(t.formatId))return[`${n}: ${this.gameNeedsText(t.formatId)}`];const r=[];for(let a=0;a<t.ballCount;a++){const d=this.ballMembers(e,a).length,c=`${n} ball ${this.teamLetter(a)}`;if(d<s.size.min){const u=s.size.min-d;r.push(`${c} needs ${u} more player${u===1?"":"s"}.`)}else d>s.size.max&&r.push(`${c} takes at most ${s.size.max}.`)}return r}gameSummary(e){const t=this.pickedByKey(e);if(!t)return"";const s=r=>r.name.trim()||"Player",n=[];if(t.ballCount===0)n.push("everyone");else{const r=[];for(let d=0;d<t.ballCount;d++){const c=this.ballMembers(e,d);c.length>0&&r.push(c.map(s).join(" & "))}n.push(r.join(" vs "));const a=this.sittingOut(e);a.length>0&&n.push(`${a.map(s).join(", ")} sitting out`)}return n.push(`${this.slotForGame(e)?.allowancePct??"100"}% allowance`),n.filter(r=>r!=="").join(" · ")}teamsOfGame(e){const t=this.pickedByKey(e);if(!t)return[];const s=this.slotForGame(e)?.subjectTeams??{},n=[];for(let r=0;r<t.ballCount;r++){const a=this.teamByKey(t.ballTeams[r]??-1);a&&s[a.key]&&n.push(a)}return n}gameSharedWith(e){const t=new Set(this.teamsOfGame(e).map(r=>r.key));if(t.size===0)return[];const s=this.slotForGame(e)?.key,n=[];for(const r of this.formatSlots.get()){if(r.key===s)continue;Object.entries(r.subjectTeams).some(([d,c])=>c&&t.has(Number(d)))&&n.push(this.gameLabel(r.formatId))}return n}gameSharesSides(e){return this.gameSharedWith(e).length>0}gameSidesText(e){const t=this.pickedByKey(e);if(!t||this.teamsOfGame(e).length===0)return"";const s=this.slotForGame(e)?.subjectTeams??{},n=[];for(let d=0;d<t.ballCount;d++){const c=this.teamByKey(t.ballTeams[d]??-1);if(c&&s[c.key]){n.push(this.teamLabel(c));continue}const u=this.ballMembers(e,d);u.length>0&&n.push(u.map(f=>f.name.trim()||"Player").join(" & "))}const r=n.join(" vs "),a=this.gameSharedWith(e);return a.length===0?`Sides: ${r}.`:`Sides: ${r} — shared with ${this.joinLabels(a)}.`}joinLabels(e){return e.length<=1?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`}adjustGame(e){this.gameSharesSides(e)&&this.forkGame(e);const t=new Set(Object.values(this.pickedByKey(e)?.ballTeams??{}));this.teams.set(this.teams.get().map(s=>t.has(s.key)?{...s,autoCreated:!1}:s)),this.formatSlots.set(this.formatSlots.get().map(s=>s.gameKey===e?{...s,gameKey:void 0}:s)),this.picked.set(this.picked.get().filter(s=>s.key!==e)),this.customOpen.set(!0)}addCustomGame(){this.customOpen.set(!0);const e=new Set(this.formatSlots.get().map(s=>s.formatId)),t=this.catalog.descriptors.get().find(s=>!e.has(s.id));this.addFormatSlot(t?.id)}showFlexible(){return this.customOpen.get()||this.customSlots().length>0||this.customTeams().length>0}customSlots(){return this.formatSlots.get().filter(e=>e.gameKey===void 0)}customTeams(){const e=this.cardOwnedTeamKeys();return this.teams.get().filter(t=>!e.has(t.key))}cardOwnedTeamKeys(){const e=new Set;for(const t of this.picked.get())for(const s of Object.values(t.ballTeams))e.add(s);return e}slotIndex(e){return this.formatSlots.get().findIndex(t=>t.key===e)}formations=Za;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{},autoCreated:!1}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,kind:t,memberTeams:t==="single_ball"?{}:s.memberTeams}:s)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,s){const n=this.teamByKey(e);if(!n||n.kind!=="multi_ball"||t===e)return;const r={...n.memberTeams};if(s){if(this.teamMemberCount(e)>=Te)return;r[t]=!0}else delete r[t];this.teams.set(this.teams.get().map(a=>a.key===e?{...a,memberTeams:r}:a))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(s=>t.memberTeams[Number(s)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{let t=!1;const s={...e.subjectTeams};for(const n of this.teams.get())s[n.key]===!0&&!this.teamKindFitsFormat(e.formatId,n.kind)&&(delete s[n.key],t=!0);return t?{...e,subjectTeams:s}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}teamKindFitsFormat(e,t){return this.isSideFormat(e)?t==="multi_ball":t==="single_ball"||this.catalog.acceptsSideSubjects(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const s={...t.memberTeams};return delete s[e],{...t,memberTeams:s}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const s={...t.subjectTeams};return delete s[e],{...t,subjectTeams:s}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.teams.get().findIndex(s=>s.key===e.key);return`Team ${this.teamLetter(Math.max(0,t))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,formation:t}:s))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,s){const n=this.teamByKey(e);if(!n)return;const r={...n.pctByPlayer};if(s){if(r[t]!==void 0||this.teamMemberCount(e)>=Te)return;r[t]=r[t]??"100"}else delete r[t];this.teams.set(this.teams.get().map(a=>a.key===e?{...a,pctByPlayer:r}:a))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=Te}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let s=0;for(const n of this.players.get()){const r=t.pctByPlayer[n.key];if(r===void 0)continue;const a=this.derivedCH(n);if(!a)return null;s+=this.parsePct(r)*a.ch/100}return Math.round(s)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<$e)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=$e;let s=t;for(const n of this.teams.get())e.memberTeams[n.key]===!0&&n.kind==="single_ball"&&Object.keys(n.pctByPlayer).length>=$e&&s++;return s>=$e}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,s){const n=this.teamByKey(e);!n||n.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(r=>r.key===e?{...r,pctByPlayer:{...r.pctByPlayer,[t]:s}}:r))}groupsEnabled(){return this.groups.get().length>0}splitIntoGroups(){if(this.groupsEnabled())return;const e={};for(const t of this.players.get())e[t.key]=!0;this.groups.set([{key:this.nextGroupKey++,startTime:"",startHole:null,members:e},{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}clearGroups(){this.groups.set([])}addGroup(){this.groupsEnabled()&&this.groups.set([...this.groups.get(),{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}removeGroup(e){const t=this.groups.get().filter(s=>s.key!==e);this.groups.set(t.length>1?t:[])}groupByKey(e){return this.groups.get().find(t=>t.key===e)??null}groupLabel(e){const t=this.groups.get().findIndex(s=>s.key===e.key);return`Group ${Math.max(0,t)+1}`}groupMemberIn(e,t){return this.groupByKey(e)?.members[t]===!0}setGroupMember(e,t,s){this.groups.set(this.groups.get().map(n=>{const r=n.key===e,a=n.members[t]===!0;if(r&&s&&!a)return{...n,members:{...n.members,[t]:!0}};if(a&&(!r||!s)){const d={...n.members};return delete d[t],{...n,members:d}}return n}))}setGroupStartTime(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startTime:t}:s))}setGroupStartHole(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startHole:t}:s))}groupSize(e){const t=this.groupByKey(e);return t?this.players.get().filter(s=>t.members[s.key]===!0).length:0}ungroupedPlayers(){if(!this.groupsEnabled())return[];const e=new Set;for(const t of this.groups.get())for(const s of Object.keys(t.members))t.members[Number(s)]&&e.add(Number(s));return this.players.get().filter(t=>!e.has(t.key))}crossGroupTeamWarnings(){if(!this.groupsEnabled())return[];const e=new Map;this.groups.get().forEach((s,n)=>{for(const r of Object.keys(s.members))s.members[Number(r)]&&e.set(Number(r),n)});const t=[];for(const s of this.teams.get()){if(s.kind!=="single_ball"||!this.isTeamLive(s))continue;const n=new Set;for(const r of Object.keys(s.pctByPlayer)){const a=e.get(Number(r));a!==void 0&&n.add(a)}n.size>1&&t.push(`${this.teamLabel(s)} plays one combined ball, but its players are in different groups — keep them in the same group.`)}return t}buildGroups(e,t){return this.groups.get().map(s=>({members:e.filter(n=>s.members[n.key]===!0).map(n=>t.get(n.key)),...s.startTime.trim()!==""?{startTime:s.startTime.trim()}:{},...s.startHole!==null?{startHole:s.startHole}:{}})).filter(s=>s.members.length>0)}diagnosticsForGroups(){return this.diagnostics.get().filter(e=>e.path?.startsWith("playingGroups"))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectPlayers:{...n.subjectPlayers,[t]:s}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectTeams:{...n.subjectTeams,[t]:s}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return to[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,s)=>t-s);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1),this.groups.set(this.groups.get().map(s=>s.startHole!==null&&!t.includes(s.startHole)?{...s,startHole:null}:s))}derivedCH(e){const t=X(e.handicapIndex);if(t===null)return null;const s=this.teeById(e.teeId);if(!s)return null;const n=s.ratings.find(a=>a.gender===e.gender);if(!n)return null;const r={handicapIndex:t,slope:n.slope,courseRating:n.courseRating,par:n.par};return{ch:Gi(r),raw:xs(r),rating:n,teeName:s.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}humanizedRoster(){return this.diagnostics.get().filter(e=>e.path==="producers").map(e=>xe(e,t=>this.catalog.labelOf(t)))}humanizedRoute(){return this.diagnostics.get().filter(e=>e.path==="route").map(e=>xe(e,t=>this.catalog.labelOf(t)))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const s of this.formatSlots.get()){for(const n of e)s.subjectPlayers[n.key]!==!1&&t.add(n.key);for(const n of this.teams.get())if(s.subjectTeams[n.key]===!0)for(const r of e)n.pctByPlayer[r.key]!==void 0&&t.add(r.key)}return e.filter(s=>!t.has(s.key))}diagnosticsForFormat(e){return Va(this.diagnostics.get(),e)}humanizedForFormat(e){return this.diagnosticsForFormat(e).map(t=>xe(t,s=>this.catalog.labelOf(s)))}generalDiagnostics(){return Ua(this.diagnostics.get())}humanizedGeneral(){return this.generalDiagnostics().map(e=>xe(e,t=>this.catalog.labelOf(t)))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const s=this.liveTeamKeySet(),n=[];for(const r of this.teams.get()){if(!s.has(r.key))continue;const a=e.filter(d=>r.pctByPlayer[d.key]!==void 0).map(d=>({producerDefId:t.get(d.key),allowancePct:this.parsePct(r.pctByPlayer[d.key])}));if(r.kind==="multi_ball")for(const d of this.teams.get())r.memberTeams[d.key]===!0&&d.key!==r.key&&d.kind==="single_ball"&&s.has(d.key)&&a.push({teamId:String(d.key)});n.push({id:String(r.key),label:this.teamLabel(r),formation:r.formation,kind:r.kind,members:a})}return n}buildFormats(e,t){const s=this.liveTeamKeySet();return this.formatSlots.get().map(n=>{const r=this.isSideFormat(n.formatId),a=[];if(!r)for(const d of e)n.subjectPlayers[d.key]!==!1&&a.push({kind:"player",producerDefId:t.get(d.key)});for(const d of this.teams.get())n.subjectTeams[d.key]===!0&&s.has(d.key)&&this.teamKindFitsFormat(n.formatId,d.kind)&&a.push({kind:"team",teamId:String(d.key)});return{formatId:n.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(n.allowancePct)},subjects:a,...Object.keys(n.config).length>0?{formatConfig:{...n.config}}:{}}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),s=e.indexOf(t);return s<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(s),...e.slice(0,s)].map(r=>({courseHoleNumber:r})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}slotSubjectCount(e){const t=this.liveTeamKeySet(),s=this.isSideFormat(e.formatId);let n=0;if(!s)for(const r of this.players.get())e.subjectPlayers[r.key]!==!1&&n++;for(const r of this.teams.get())e.subjectTeams[r.key]===!0&&t.has(r.key)&&this.teamKindFitsFormat(e.formatId,r.kind)&&n++;return n}noSubjectsMessage(e){const t=this.catalog.labelOf(e.formatId)??e.formatId;if(e.gameKey!==void 0)return`${t} has nobody playing — put players on a ball above.`;if(!this.isSideFormat(e.formatId))return`${t} has nothing to score — tick at least one player or team under “Scores”.`;const s=this.teams.get();if(s.some(d=>d.kind==="multi_ball"&&this.isTeamLive(d)))return`${t} has no teams ticked — tick the teams it plays under “Scores”.`;if(s.some(d=>d.kind==="single_ball"&&this.isTeamLive(d)))return`${t} is played between teams whose players play their own balls — a “One combined ball” team doesn’t fit. Under Teams, switch the team to “Separate balls (a side)”, then tick it under “Scores”.`;const n=this.catalog.classifyId(e.formatId),r=n?.teamCount?.min!==void 0&&n.teamCount.min===n.teamCount.max?`${n.teamCount.min} teams`:n?.teamCount?.min!==void 0?`at least ${n.teamCount.min} teams`:"teams",a=n&&n.teamSize.min===n.teamSize.max?` of ${n.teamSize.min} players`:"";return`${t} is a team game — under Teams, create ${r}${a} with kind “Separate balls (a side)”, add the players, then tick the teams under “Scores”.`}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];if(e.forEach((n,r)=>{n.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${r}].name`}),X(n.handicapIndex)===null&&t.push({code:"missing_index",message:"Handicap index required",path:`producers[${r}].handicapIndex`}),n.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${r}].teeId`})}),this.formatSlots.get().forEach((n,r)=>{this.slotSubjectCount(n)===0&&t.push({code:"no_subjects",message:this.noSubjectsMessage(n),formatIndex:r,path:`formats[${r}]`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};const s=this.editToken.get();this.submitting.set(!0);try{const n=new Map;e.forEach((h,b)=>{n.set(h.key,h.producerDefId??(s?`p-${h.key}`:`p${b+1}`))});const r=[];for(const h of e){const b=X(h.handicapIndex),g=h.playerId?{kind:"player",id:h.playerId}:h.guestPlayerId?{kind:"guest",id:h.guestPlayerId}:{kind:"guest",id:(await v.guestPlayers.create({displayName:h.name.trim(),gender:h.gender,handicapIndex:b})).id};r.push({producerDefId:n.get(h.key),playerRef:g,handicapIndex:b,gender:h.gender,teeId:h.teeId})}const{roundType:a,route:d}=this.buildRoute(),c=this.buildTeams(e,n),u=this.buildGroups(e,n),f={courseId:this.courseId.get(),playedAt:this.editPlayedAt??new Date().toISOString().slice(0,10),roundType:a,...d?{route:d}:{},producers:r,...c.length>0?{teams:c}:{},formats:this.buildFormats(e,n),...u.length>0?{playingGroups:u}:{}};if(s){for(const b of e){const g=b.name.trim();!b.guestPlayerId||b.guestOriginalName===void 0||g!==b.guestOriginalName&&(await v.friendlyRounds.renameGuest({token:s,guestPlayerId:b.guestPlayerId,displayName:g}),this.players.set(this.players.get().map(x=>x.key===b.key?{...x,guestOriginalName:g}:x)))}const h=await v.friendlyRounds.editSetup({token:s,draft:f});return h.ok?{ok:!0,token:s}:(this.diagnostics.set(h.diagnostics),{ok:!1})}const m=await v.friendlyRounds.create({draft:f});return m.ok?(de({token:m.friendlyRound.shareToken,courseName:m.round.courseNameSnapshot??"",status:m.round.status,completedAt:m.round.completedAt,lastSeenAt:new Date().toISOString()}),{ok:!0,token:m.friendlyRound.shareToken}):(this.diagnostics.set(m.diagnostics),{ok:!1})}catch(n){return this.submitError.set(n instanceof K?n.message==="Validation failed"?["The server could not read this setup — this should not happen, please report it.",...(n.details??[]).slice(0,3).map(r=>`${r.path}: ${r.message}`)].join(`
`):n.message:s?"Could not save the round. Try again.":"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}const no=["full_18","front_9","back_9"],Ue=()=>re()==="sv"?",":".",io=_(`
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
            <h2>What are we playing?</h2>
            <p class="setup__hint">Pick every game the group is playing — each one picks its own players.</p>
            <div bind="cards" class="setup__cards"></div>
            <div bind="games" class="setup__fslots"></div>
            <p bind="formatNote" class="setup__note"></p>
        </section>

        <section bind="teamsSection" class="setup__section">
            <h2>Teams</h2>
            <p class="setup__hint">Optional. Group players into a team ball with a handicap allowance per member.</p>
            <div bind="teams" class="setup__fslots"></div>
            <button bind="addTeam" class="setup__add" type="button">+ Create team</button>
        </section>

        <section bind="formatsSection" class="setup__section">
            <h2>Formats</h2>
            <p class="setup__hint">Each format scores a set of balls — tick the players and teams it ranks.</p>
            <div bind="formats" class="setup__fslots"></div>
            <button bind="addFormat" class="setup__add" type="button">+ Add format</button>
        </section>

        <div bind="banner" class="setup__banner"></div>
        <button bind="create" class="setup__create" type="button">Create round</button>
        <button bind="cancel" class="setup__cancel hidden" type="button">Cancel</button>

        <div bind="hcpPad" class="hcp hidden">
            <div bind="hcpBackdrop" class="hcp__backdrop"></div>
            <div class="hcp__sheet">
                <div class="hcp__head">
                    <div class="hcp__who">
                        <span bind="hcpName" class="hcp__name"></span>
                        <span bind="hcpCh" class="hcp__chline"></span>
                    </div>
                    <span bind="hcpVal" class="hcp__val"></span>
                    <button bind="hcpBack" class="hcp__bs" type="button" aria-label="Delete">⌫</button>
                </div>
                <div bind="hcpKeys" class="hcp__grid"></div>
                <div class="hcp__actions">
                    <button bind="hcpCancel" class="hcp__cancel" type="button">Cancel</button>
                    <button bind="hcpOk" class="hcp__ok" type="button">Done</button>
                </div>
            </div>
        </div>
    </div>
`),Gt=_(`
    <button bind="key" class="hcp-key" type="button">
        <span bind="num" class="hcp-key__num"></span>
        <span bind="lbl" class="hcp-key__lbl"></span>
    </button>
`),ro=_(`
    <div class="player">
        <div class="player__top">
            <input bind="name" class="player__name" placeholder="Player name" />
            <button bind="remove" class="player__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <div class="player__fields">
            <input bind="index" class="player__index" readonly placeholder="HCP index" />
            <div bind="gender" class="player__gender"></div>
            <div bind="tee" class="player__tee"></div>
        </div>
        <div bind="ch" class="player__ch"></div>
        <div bind="err" class="player__err"></div>
    </div>
`),ao=_(`
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

        <div bind="configFields" class="fslot__configs"></div>

        <div class="fslot__group">
            <span class="fslot__label">Scores</span>
            <div bind="subjectRows" class="fslot__teamrows"></div>
        </div>

        <div bind="err" class="fslot__err"></div>
    </div>
`),oo=_(`
    <div class="fslot__group">
        <span bind="label" class="fslot__label"></span>
        <div bind="options" class="fslot__seg"></div>
    </div>
`),lo=_(`
    <button bind="opt" type="button"></button>
`),qt=_(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),co=_(`
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
`),uo=_(`
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
`),ho=_(`
    <button bind="row" type="button" class="frow">
        <span bind="name" class="frow__name"></span>
        <span bind="username" class="frow__username"></span>
        <span bind="hcp" class="frow__hcp"></span>
    </button>
`),Kt=_(`
    <button bind="card" class="gcard" type="button">
        <span bind="name" class="gcard__name"></span>
        <span bind="tag" class="gcard__tag"></span>
        <span bind="shape" class="gcard__shape"></span>
    </button>
`),po=_(`
    <div class="fslot">
        <div class="fslot__top">
            <span bind="title" class="fslot__teamname"></span>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <p bind="desc" class="fslot__desc"></p>

        <div class="fslot__group">
            <span class="fslot__label">Handicap allowance</span>
            <span class="mrow__pct"><input bind="allowance" inputmode="numeric" /><span>%</span></span>
        </div>

        <div bind="configFields" class="fslot__configs"></div>

        <div bind="ballGroup" class="fslot__group">
            <span class="fslot__label">Who plays which ball</span>
            <div bind="ballRows" class="fslot__teamrows"></div>
            <button bind="addBall" class="gaddball hidden" type="button">+ Add a ball</button>
        </div>

        <div bind="err" class="fslot__err"></div>
        <p bind="sides" class="gsides"></p>
        <button bind="fork" class="gadjust hidden" type="button">Use separate sides for this game</button>
        <p bind="summary" class="gsummary"></p>
        <button bind="adjust" class="gadjust" type="button">Adjust details</button>
    </div>
`),mo=_(`
    <div class="grow">
        <span bind="name" class="grow__name"></span>
        <div bind="seg" class="fslot__seg"></div>
    </div>
`),Vt=_(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class fo extends R{static styles=`
        .setup {
            padding: ${l("lg")} ${l("lg")} ${l("2xl")};

            /* Not-editable (complete / no stored draft): only the head + blocked
               note + back button remain; the form body is removed. */
            &.setup--blocked > .setup__section,
            &.setup--blocked > .setup__banner,
            &.setup--blocked > .setup__create,
            &.setup--blocked > .setup__cancel { display: none; }

            & .setup__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${o("text-muted")};
                cursor: pointer; padding: ${l("xs")} 0; margin-bottom: ${l("md")};
            }

            & .setup__head {
                margin-bottom: ${l("xl")};
                & h1 {
                    margin: 0; font-family: ${o("font-display")}; font-weight: 600;
                    font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${l("xs")} 0 0; color: ${o("text-muted")}; font-size: 0.9rem; }
            }

            & .setup__section {
                margin-bottom: ${l("xl")};
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${l("sm")}; font-family: ${o("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            /* The game cards (format-templates §4). Two per row on a phone; the
               "+ Custom game" card spans the full width as the last one. */
            & .setup__cards {
                display: grid; grid-template-columns: 1fr 1fr; gap: ${l("sm")};
                margin-bottom: ${l("md")};
            }
            & .gcard {
                ${I()}
                display: flex; flex-direction: column; gap: 2px; text-align: left;
                padding: ${l("md")}; font-family: inherit; cursor: pointer;
                /* The inset ring doubles the hairline so a picked card still
                   reads as picked next to a hovered one. */
                &.on {
                    border-color: ${o("primary")}; background: ${o("accent-soft")};
                    box-shadow: inset 0 0 0 1px ${o("primary")};
                }
                &:disabled { opacity: 0.5; cursor: default; }
                &.gcard--custom { grid-column: 1 / -1; }

                & .gcard__name { font-weight: 700; font-size: 0.95rem; }
                & .gcard__tag { font-size: 0.78rem; color: ${o("text-muted")}; line-height: 1.3; }
                & .gcard__shape {
                    font-size: 0.72rem; color: ${o("text-muted")}; line-height: 1.3;
                    &:empty { display: none; }
                }
            }

            & .setup__hint { margin: 0 0 ${l("md")}; color: ${o("text-muted")}; font-size: 0.82rem; }

            & .setup__note {
                margin: ${l("sm")} 0 0; font-size: 0.82rem; color: ${o("text-muted")};
                &:empty { display: none; }
            }

            & .setup__warn {
                margin: ${l("sm")} 0 0; font-size: 0.82rem; color: ${o("error")};
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
                display: flex; gap: ${l("sm")}; margin-bottom: ${l("md")};
                & button {
                    ${I()}
                    flex: 1; padding: ${l("md")} 0;
                    font-family: inherit; font-weight: 700; font-size: 0.9rem;
                    &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                }
            }

            & .setup__startrow {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${l("md")}; font-size: 0.9rem; color: ${o("text-muted")};
            }

            & .setup__players { display: flex; flex-direction: column; gap: ${l("md")}; }

            & .player {
                padding: ${l("md")}; ${L()}
                display: flex; flex-direction: column; gap: ${l("sm")};

                & .player__top { display: flex; gap: ${l("sm")}; align-items: center; }
                & .player__name { ${V()} flex: 1; padding: ${l("md")}; font-size: 1rem; }
                & .player__remove {
                    ${I()}
                    width: 38px; height: 38px; flex-shrink: 0;
                    font-size: 1rem; color: ${o("text-muted")};
                }
                & .player__fields { display: flex; gap: ${l("sm")}; align-items: stretch; }
                & .player__index { ${V()} flex: 1; min-width: 0; padding: ${l("md")}; font-size: 1rem; }
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
                ${I()}
                width: 100%; margin-top: ${l("md")}; padding: ${l("md")};
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }
            & .setup__add.hidden { display: none; }

            & .setup__friends {
                margin-top: ${l("sm")}; padding: ${l("sm")}; ${L()}
                &.hidden { display: none; }

                & .setup__friendrows { display: flex; flex-direction: column; }
                & .setup__hint { margin: ${l("xs")} ${l("sm")}; }
                & .setup__friendrows:not(:empty) + .setup__hint { display: none; }

                & .frow {
                    display: flex; align-items: baseline; gap: ${l("sm")};
                    width: 100%; padding: ${l("md")} ${l("sm")};
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
                color: ${o("error")}; font-size: 0.875rem; margin-bottom: ${l("md")};
                white-space: pre-line;
                &:empty { display: none; }
            }

            & .setup__fslots { display: flex; flex-direction: column; gap: ${l("md")}; }

            & .fslot {
                padding: ${l("md")}; ${L()}
                display: flex; flex-direction: column; gap: ${l("sm")};

                & .fslot__top { display: flex; gap: ${l("sm")}; align-items: center; }
                & .fslot__teamname { flex: 1; min-width: 0; font-weight: 700; font-size: 0.95rem; }
                & .fslot__teammeta {
                    margin: ${l("xs")} 0 0; font-size: 0.78rem; color: ${o("text-muted")};
                    &:empty { display: none; }
                }
                & .fslot__format { flex: 1; min-width: 0; font-size: 1rem; }
                & .fslot__remove {
                    ${I()}
                    width: 38px; height: 38px; flex-shrink: 0;
                    font-size: 1rem; color: ${o("text-muted")};
                }
                & .fslot__desc {
                    margin: 0; font-size: 0.8rem; color: ${o("text-muted")};
                    &:empty { display: none; }
                }

                & .fslot__group {
                    display: flex; flex-direction: column; gap: ${l("xs")};
                    &[hidden] { display: none; }
                }
                /* The knob host is a pass-through: its children must sit in the
                   card's own column, or an empty host (the formats declaring no
                   knobs — most of them) would still take a gap. */
                & .fslot__configs { display: contents; }
                & .fslot__label {
                    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em;
                    text-transform: uppercase; color: ${o("text-muted")};
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
                    & .irow__chk { width: 18px; height: 18px; flex-shrink: 0; accent-color: ${o("primary")}; }
                }

                & .mrow {
                    display: flex; align-items: center; justify-content: space-between; gap: ${l("sm")};
                    & .mrow__pick { display: flex; align-items: center; gap: ${l("sm")}; font-size: 0.9rem; cursor: pointer; }
                    & .mrow__pct {
                        display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
                        font-size: 0.85rem; color: ${o("text-muted")};
                        &[hidden] { display: none; }
                        & input { ${V()} width: 56px; padding: ${l("xs")} ${l("sm")}; font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${l("xs")};
                    & button {
                        ${I()}
                        flex: 1; padding: ${l("sm")} 0;
                        font-family: inherit; font-weight: 700; font-size: 0.82rem;
                        &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                    }
                }
                & .fslot__err {
                    font-size: 0.82rem; color: ${o("error")};
                    &:empty { display: none; }
                }

                /* Game-panel extras. Scoped INSIDE .fslot: the panel roots on
                   .fslot so it inherits the card chrome, and these classes are
                   only meaningful there. */
                & .grow {
                    display: flex; align-items: center; gap: ${l("sm")};
                    & .grow__name { flex: 1; min-width: 0; font-size: 0.9rem; }
                    & .fslot__seg { flex: 0 0 auto; & button { min-width: 44px; flex: 0 0 auto; padding: ${l("sm")}; } }
                }
                & .gaddball {
                    ${I()}
                    align-self: flex-start; margin-top: ${l("xs")};
                    padding: ${l("xs")} ${l("sm")};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }
                & .gsummary {
                    margin: 0; padding-top: ${l("xs")}; border-top: 1px solid ${o("border")};
                    font-size: 0.82rem; color: ${o("text-muted")};
                }
                /* Which round teams this game is contested between, and what
                   else is playing them (format-templates §3). Empty for a game
                   with no team-backed ball — and an empty <p> would otherwise
                   still eat one of the card's gaps. */
                & .gsides {
                    margin: 0; font-size: 0.82rem; color: ${o("text-muted")};
                    &:empty { display: none; }
                }
                & .gadjust {
                    ${I()}
                    align-self: flex-start; padding: ${l("xs")} ${l("sm")};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }

                & .grp__start {
                    display: flex; gap: ${l("sm")}; align-items: stretch;
                    & .grp__time { ${V()} flex: 1; min-width: 0; padding: ${l("sm")} ${l("md")}; font-size: 1rem; font-family: inherit; }
                    & .grp__hole { flex: 1; min-width: 0; font-size: 1rem; }
                }
            }

            & .setup__create {
                ${I()}
                width: 100%; padding: ${l("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit;
                background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                box-shadow: ${o("shadow-elevated")};
                &:hover { background: ${o("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            & .setup__cancel {
                ${I()}
                width: 100%; margin-top: ${l("md")}; padding: ${l("md")};
                background: none; font-family: inherit; font-weight: 600; font-size: 0.95rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }

            & .setup__blocked {
                padding: ${l("lg")}; ${L()}
                background: ${o("surface-sunken")}; color: ${o("text-muted")};
                font-size: 0.95rem; margin-bottom: ${l("xl")};
                &.hidden { display: none; }
            }

            & .setup__locknote {
                margin: ${l("sm")} 0 0; font-size: 0.8rem; color: ${o("text-muted")};
                &.hidden { display: none; }
            }
        }

        /* --- Handicap keypad: bottom sheet replacing the system keyboard.
           A phone's numeric keyboard can't type golf's "+" (plus handicap)
           and Swedish keyboards produce a decimal comma — so the field is
           readonly and this pad owns entry (hardware keys still work). */
        .hcp {
            position: fixed; inset: 0; z-index: 70;
            &.hidden { display: none; }

            & .hcp__backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.35); }
            & .hcp__sheet {
                position: absolute; left: 0; right: 0; bottom: 0;
                background: ${o("surface")};
                border-top-left-radius: 16px; border-top-right-radius: 16px;
                /* Clear the iOS home indicator; harmless zero elsewhere. */
                padding: ${l("sm")} ${l("md")} calc(${l("xl")} + env(safe-area-inset-bottom));
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
            }
            & .hcp__head { display: flex; align-items: center; gap: ${l("md")}; padding: ${l("sm")} ${l("xs")} ${l("md")}; }
            & .hcp__who { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
            & .hcp__name {
                font-family: ${o("font-display")}; font-weight: 600; color: ${o("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .hcp__chline { font-size: 0.78rem; color: ${o("text-muted")}; font-variant-numeric: tabular-nums; }
            & .hcp__val {
                min-width: 72px; text-align: right; color: ${o("text")};
                font-family: ${o("font-display")}; font-weight: 700; font-size: 1.6rem;
                font-variant-numeric: tabular-nums;
                &.empty { color: ${o("text-muted")}; font-weight: 400; font-size: 1rem; }
            }
            & .hcp__bs { ${I()} width: 44px; height: 44px; flex-shrink: 0; font-size: 1.1rem; }
            & .hcp__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
            & .hcp-key {
                ${I()}
                height: 52px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: ${o("font-display")}; font-weight: 700; font-size: 1.2rem;

                & .hcp-key__lbl { font-size: 0.62rem; font-weight: 600; color: ${o("text-muted")}; &:empty { display: none; } }
                &.on {
                    background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")};
                    & .hcp-key__lbl { color: ${o("primary-text")}; }
                }
            }
            & .hcp__actions { display: flex; gap: ${l("sm")}; margin-top: ${l("md")}; }
            & .hcp__cancel { ${I()} flex: 1; padding: ${l("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem; }
            & .hcp__ok {
                ${I()}
                flex: 2; padding: ${l("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem;
                background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")};
                &:hover { background: ${o("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;svc=this.inject(so);router=this.inject(M);auth=this.inject(H);profile=this.inject(je);friends=this.inject(Le);pickerOpen=new p(!1);hcpPadFor=new p(null);hcpDraft=new p("");render(){const e=this.router.query("token").get(),t=!!e;this.pickerOpen.set(!1),this.hcpPadFor.set(null),t?this.svc.loadForEdit(e):(this.svc.reset(),this.svc.load()),this.auth.currentUser.get()&&(this.profile.load(),this.friends.load());const s=()=>t&&this.svc.editBlockedReason.get()!==null,n=()=>t&&this.svc.hasScores.get(),r=()=>this.profile.player.get(),a=()=>{const h=r();return this.auth.currentUser.get()!==null&&h!==null&&!this.svc.hasPlayer(h.id)},d=this.wire(io,{root:{className:()=>s()?"setup setup--blocked":"setup"},back:{textContent:()=>t?"← Back to round":"← Home",onclick:()=>t&&e?this.router.navigate("/round",{query:{token:e}}):this.router.navigate("/")},title:{textContent:()=>t?"Edit round":"New round"},subtitle:{textContent:()=>t?"Change the setup — scored balls are preserved.":"No sign-in required."},blocked:{className:()=>s()?"setup__blocked":"setup__blocked hidden",textContent:()=>this.svc.editBlockedReason.get()==="round_complete"?"This round is complete — its setup can no longer be edited.":this.svc.editBlockedReason.get()==="no_stored_draft"?"This round didn't come from the setup wizard, so it can't be edited here.":this.svc.editBlockedReason.get()==="has_open_seats"?"This round has open seats waiting to be claimed — the wizard cannot edit it yet.":""},lockNote:{className:()=>n()?"setup__locknote":"setup__locknote hidden"},routeErr:{textContent:()=>this.svc.humanizedRoute().join(`
`)},rosterErr:{textContent:()=>this.svc.humanizedRoster().join(`
`)},cancel:{className:()=>t?"setup__cancel":"setup__cancel hidden",onclick:()=>e&&this.router.navigate("/round",{query:{token:e}})},addPlayer:{onclick:()=>this.svc.addPlayer()},addMe:{className:()=>a()?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>`+ Add me (${r()?.displayName??""})`,onclick:()=>{const h=r();h&&this.svc.addMe({id:h.id,displayName:h.displayName,handicapIndex:h.handicapIndex,gender:h.gender})}},addFriends:{className:()=>this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>this.pickerOpen.get()?"− From friends":"+ From friends",onclick:()=>this.pickerOpen.set(!this.pickerOpen.get())},friendPicker:{className:()=>this.pickerOpen.get()&&this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__friends":"setup__friends hidden"},teamsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},formatsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},addTeam:{onclick:()=>this.svc.addTeam()},splitGroups:{className:()=>this.svc.groupsEnabled()?"setup__add hidden":"setup__add",onclick:()=>this.svc.splitIntoGroups()},addGroup:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.addGroup()},clearGroups:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.clearGroups()},groupNote:{textContent:()=>{const h=this.svc.ungroupedPlayers();return h.length===0?"":`${h.map(g=>g.name.trim()||"A player").join(", ")} ${h.length>1?"aren't":"isn't"} in a group yet — every player needs one.`}},groupWarn:{textContent:()=>[...this.svc.crossGroupTeamWarnings(),...this.svc.diagnosticsForGroups().map(h=>h.message)].join(`
`)},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const h=this.svc.playersInNoFormat();return h.length===0?"":`Heads up: ${h.map(g=>g.name.trim()||"A player").join(", ")} ${h.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.humanizedGeneral(),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?t?"Saving…":"Creating…":t?"Save changes":"Create round",onclick:async()=>{const h=await this.svc.submit();h.ok&&this.router.navigate("/round",{query:{token:h.token}})}},hcpPad:{className:()=>this.hcpPadFor.get()!==null?"hcp":"hcp hidden"},hcpBackdrop:{onclick:()=>this.hcpPadFor.set(null)},hcpName:{textContent:()=>this.hcpPlayer()?.name?.trim()||"Player"},hcpCh:{textContent:()=>{const h=this.hcpPlayer();if(!h)return"";const b=this.svc.derivedCH({...h,handicapIndex:this.hcpDraft.get()});return b?`Course handicap ${b.ch} · ${b.teeName}`:"WHS index — “+” means a plus handicap."}},hcpVal:{className:()=>this.hcpDraft.get()?"hcp__val":"hcp__val empty",textContent:()=>this.hcpDraft.get()||"HCP index"},hcpBack:{onclick:()=>this.hcpDraft.set(this.hcpDraft.get().slice(0,-1))},hcpCancel:{onclick:()=>this.hcpPadFor.set(null)},hcpOk:{disabled:()=>this.hcpDraft.get()!==""&&X(this.hcpDraft.get())===null,onclick:()=>this.hcpCommit()}}),c=this.ref(d,"hcpKeys");for(const h of["1","2","3","4","5","6","7","8","9"])c.appendChild(this.hcpKey(h,"",()=>this.hcpAppendDigit(h)));c.appendChild(this.wireEl(Gt,{key:{className:()=>this.hcpDraft.get().startsWith("+")?"hcp-key on":"hcp-key",onclick:()=>this.hcpTogglePlus()},num:{textContent:"+"},lbl:{textContent:"plus hcp"}})),c.appendChild(this.hcpKey("0","",()=>this.hcpAppendDigit("0"))),c.appendChild(this.hcpKey(Ue(),"",()=>this.hcpAppendSep()));const u=h=>{if(this.hcpPadFor.get()!==null){if(h.key>="0"&&h.key<="9")this.hcpAppendDigit(h.key);else if(h.key===","||h.key===".")this.hcpAppendSep();else if(h.key==="+"||h.key==="-")this.hcpTogglePlus();else if(h.key==="Backspace")this.hcpDraft.set(this.hcpDraft.get().slice(0,-1));else if(h.key==="Enter")this.hcpCommit();else if(h.key==="Escape")this.hcpPadFor.set(null);else return;h.preventDefault()}};document.addEventListener("keydown",u),this.track(()=>document.removeEventListener("keydown",u));const f=this.ref(d,"hcpPad");document.body.appendChild(f),this.track(()=>f.remove()),this.$each(this.ref(d,"presets"),()=>no,(h,b,g)=>this.wireEl(_('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(h),className:()=>this.svc.preset.get()===h?"on":"",disabled:()=>n(),onclick:()=>{n()||this.svc.setPreset(h)}}},g),h=>h);const m=h=>this.track(h);return this.mountSelect(this.ref(d,"course"),m,{value:this.bound(m,()=>this.svc.courseId.get(),h=>{h&&h!==this.svc.courseId.get()&&this.svc.selectCourse(h)}),options:{get:()=>{const h=[];let b="";for(const g of this.svc.courses.get())g.clubName!==b&&(h.push({value:`__club:${g.clubName}`,label:g.clubName,disabled:!0}),b=g.clubName),h.push({value:g.id,label:g.name});return h}},placeholder:"Select a course",disabled:{get:()=>n()}}),this.mountSelect(this.ref(d,"startHole"),m,{value:this.bound(m,()=>String(this.svc.startHole.get()),h=>this.svc.startHole.set(Number(h))),options:{get:()=>this.svc.startHoleOptions().map(h=>({value:String(h),label:String(h)}))},disabled:{get:()=>n()}}),this.$each(this.ref(d,"friendRows"),()=>lt(this.friends.friends.get().filter(h=>!this.svc.hasPlayer(h.id)),"frecency"),(h,b,g)=>this.wireEl(ho,{row:{onclick:()=>this.svc.addFriend({id:h.id,displayName:h.displayName,handicapIndex:h.handicapIndex,gender:h.gender})},name:()=>h.displayName,username:()=>`@${h.username}`,hcp:()=>h.handicapIndex===null?"–":h.handicapIndex.toFixed(1)},g),h=>h.id),this.$each(this.ref(d,"players"),this.svc.players,(h,b,g)=>this.playerRow(h.key,g),h=>h.key),this.$each(this.ref(d,"cards"),()=>[...this.svc.presetGames().map(h=>h.id),"__custom"],(h,b,g)=>h==="__custom"?this.wireEl(Kt,{card:{className:()=>"gcard gcard--custom",onclick:()=>this.svc.addCustomGame()},name:{textContent:"+ Custom game"},tag:{textContent:"Anything the cards don't cover — teams and formats by hand."},shape:{textContent:""}},g):this.gameCard(h,g),h=>h),this.$each(this.ref(d,"games"),this.svc.picked,(h,b,g)=>this.gamePanel(h.key,g),h=>h.key),this.$each(this.ref(d,"teams"),()=>this.svc.customTeams(),(h,b,g)=>this.teamCard(h.key,g),h=>h.key),this.$each(this.ref(d,"groups"),this.svc.groups,(h,b,g)=>this.groupCard(h.key,g),h=>h.key),this.$each(this.ref(d,"formats"),()=>this.svc.customSlots(),(h,b,g)=>this.formatCard(h.key,g),h=>h.key),d}mountSelect(e,t,s){const n=new W(s);n.mount(e),t(()=>n.destroy())}bound(e,t,s){const n=new p(t());return e(N(()=>n.set(t()))),e(N(()=>{const r=n.get();queueMicrotask(()=>s(r))})),n}eachInto(e,t,s,n,r){const a=new Map,d=new Map;t(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),t(N(()=>{const c=s(),u=new Map;for(const[m,h]of c.entries()){const b=r(h,m);if(a.has(b))u.set(b,a.get(b));else{const g=[];u.set(b,n(h,m,x=>g.push(x))),d.set(b,g)}}for(const[m,h]of a)u.has(m)||(h.remove(),d.get(m)?.forEach(b=>b()),d.delete(m));let f=e.firstChild;for(const m of u.values())m===f?f=f.nextSibling:e.insertBefore(m,f);a.clear();for(const[m,h]of u)a.set(m,h)}))}gameCard(e,t){const s=()=>this.svc.gameFits(e);return this.wireEl(Kt,{card:{className:()=>this.svc.isGamePicked(e)?"gcard on":"gcard",disabled:()=>!s(),onclick:()=>this.svc.toggleGame(e)},name:{textContent:()=>this.svc.gameLabel(e)},tag:{textContent:()=>s()?this.svc.catalog.taglineOf(e):this.svc.gameNeedsText(e)},shape:{textContent:()=>s()?this.svc.gameShapeText(e):""}},t)}gamePanel(e,t){const s=()=>this.svc.pickedByKey(e),n=()=>this.svc.slotForGame(e),r=()=>s()?.formatId??"",a=()=>(s()?.ballCount??0)>0,d=this.wireEl(po,{title:{textContent:()=>this.svc.gameLabel(r())},remove:{onclick:()=>this.svc.unpickGame(e)},desc:{textContent:()=>this.svc.catalog.byId(r())?.description??""},allowance:{value:n()?.allowancePct??"100",oninput:c=>{const u=n();u&&this.svc.setSlotAllowance(u.key,c.target.value)}},ballGroup:{hidden:()=>!a()},addBall:{className:()=>this.svc.canAddBall(e)?"gaddball":"gaddball hidden",onclick:()=>this.svc.addBall(e)},err:{textContent:()=>{const c=n();return[...this.svc.gameWarnings(e),...c?this.svc.humanizedForFormat(this.svc.slotIndex(c.key)):[]].join(" · ")}},sides:{textContent:()=>this.svc.gameSidesText(e)},fork:{className:()=>this.svc.gameSharesSides(e)?"gadjust":"gadjust hidden",onclick:()=>this.svc.forkGame(e)},summary:{textContent:()=>this.svc.gameSummary(e)},adjust:{onclick:()=>this.svc.adjustGame(e)}},t);return this.eachInto(this.ref(d,"configFields"),t,()=>this.svc.catalog.byId(r())?.configFields??[],(c,u,f)=>{const m=n();if(m)return this.configField(m.key,c,f);const h=document.createElement("div");return h.className="fslot__configs",h},c=>`${r()}:${c.key}`),this.eachInto(this.ref(d,"ballRows"),t,()=>a()?this.svc.players.get():[],(c,u,f)=>this.ballRow(e,c.key,f),c=>c.key),d}ballRow(e,t,s){const n=this.wireEl(mo,{name:{textContent:()=>this.svc.players.get().find(r=>r.key===t)?.name?.trim()||"Player"}},s);return this.eachInto(this.ref(n,"seg"),s,()=>[...this.svc.gameBalls(e),null],(r,a,d)=>this.wireEl(_('<button bind="b" type="button"></button>'),{b:{textContent:()=>r===null?"–":this.svc.teamLetter(r),className:()=>this.svc.ballOf(e,t)===r?"on":"",onclick:()=>this.svc.assignBall(e,t,r)}},d),r=>String(r)),n}formatCard(e,t){const s=()=>this.svc.slotByKey(e),n=()=>s()?.formatId??"",r=this.wireEl(ao,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(n())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:d=>this.svc.setSlotAllowance(e,d.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(n())?"applied to each side member’s ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.humanizedForFormat(this.svc.slotIndex(e)).join(" · ")}},t);this.mountSelect(this.ref(r,"format"),t,{value:this.bound(t,()=>n(),d=>{d&&d!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,d)}),options:{get:()=>this.svc.catalog.descriptors.get().map(d=>({value:d.id,label:this.svc.catalog.labelOf(d)??d.label}))}}),this.eachInto(this.ref(r,"configFields"),t,()=>this.svc.catalog.byId(n())?.configFields??[],(d,c,u)=>this.configField(e,d,u),d=>`${n()}:${d.key}`);const a=()=>{const d=this.svc.isSideFormat(n()),c=[];d||c.push(...this.svc.players.get().map(u=>({kind:"player",subKey:u.key})));for(const u of this.svc.customTeams())this.svc.teamKindFitsFormat(n(),u.kind)&&c.push({kind:"team",subKey:u.key});return c};return this.eachInto(this.ref(r,"subjectRows"),t,a,(d,c,u)=>this.subjectRow(e,d.kind,d.subKey,u),d=>`${d.kind}${d.subKey}`),r}configField(e,t,s){const n=this.wireEl(oo,{label:{textContent:()=>this.svc.catalog.configLabelOf(t)}},s);return this.eachInto(this.ref(n,"options"),s,()=>t.options,(r,a,d)=>this.wireEl(lo,{opt:{textContent:()=>this.svc.catalog.configLabelOf(r),className:()=>this.svc.slotConfigValue(e,t)===r.value?"on":"",onclick:()=>this.svc.setSlotConfig(e,t.key,r.value)}},d),r=>r.value),n}subjectRow(e,t,s,n){const r=()=>{if(t==="player")return this.svc.players.get().find(u=>u.key===s)?.name?.trim()||"Player";const c=this.svc.teamByKey(s);return c?`${this.svc.teamLabel(c)} (${c.kind==="multi_ball"?"side":"team"})`:"Team"},a=()=>t==="player"?this.svc.subjectPlayerIn(e,s):this.svc.subjectTeamIn(e,s),d=c=>t==="player"?this.svc.setSubjectPlayer(e,s,c):this.svc.setSubjectTeam(e,s,c);return this.wireEl(qt,{chk:{checked:()=>a(),onchange:c=>d(c.target.checked)},name:{textContent:()=>r()}},n)}groupCard(e,t){const s=this.wireEl(uo,{remove:{onclick:()=>this.svc.removeGroup(e)},groupName:{textContent:()=>{const n=this.svc.groupByKey(e);return n?this.svc.groupLabel(n):"Group"}},time:{value:this.svc.groupByKey(e)?.startTime??"",oninput:n=>this.svc.setGroupStartTime(e,n.target.value)},meta:{textContent:()=>{const n=this.svc.groupSize(e);return n===0?"Tick the players who walk with this group.":`${n} player${n===1?"":"s"}`}}},t);return this.mountSelect(this.ref(s,"hole"),t,{value:this.bound(t,()=>{const n=this.svc.groupByKey(e)?.startHole;return n==null?"":String(n)},n=>this.svc.setGroupStartHole(e,n===""?null:Number(n))),options:{get:()=>[{value:"",label:"First hole"},...this.svc.startHoleOptions().map(n=>({value:String(n),label:`Hole ${n}`}))]}}),this.eachInto(this.ref(s,"memberRows"),t,()=>this.svc.players.get(),(n,r,a)=>this.groupMemberRow(e,n.key,a),n=>n.key),s}groupMemberRow(e,t,s){return this.wireEl(qt,{chk:{checked:()=>this.svc.groupMemberIn(e,t),onchange:n=>this.svc.setGroupMember(e,t,n.target.checked)},name:{textContent:()=>this.svc.players.get().find(n=>n.key===t)?.name?.trim()||"Player"}},s)}teamCard(e,t){const s=()=>this.svc.teamKindOf(e)==="multi_ball",n=this.wireEl(co,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const r=this.svc.teamByKey(e);return r?this.svc.teamLabel(r):"Team"}},compGroup:{hidden:()=>s()},membersLabel:{textContent:()=>s()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const r=this.svc.teamSize(e);if(r===0)return s()?"Tick at least 2 members — a side needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(r<2)return"Add one more member — a team needs at least 2.";if(s())return`${r} balls · a side (scored together by a side format)`;const a=this.svc.teamBallCh(e);return a===null?`${r} players`:`${r} players · plays off HCP ${a}`}}},t);return this.mountSelect(this.ref(n,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),r=>this.svc.setTeamKind(e,r==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"One combined ball"},{value:"multi_ball",label:"Separate balls (a side)"}]}}),this.mountSelect(this.ref(n,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",r=>this.svc.setTeamFormation(e,r)),options:{get:()=>this.svc.formations.map(r=>({value:r,label:r[0].toUpperCase()+r.slice(1)}))}}),this.eachInto(this.ref(n,"memberRows"),t,()=>{const r=this.svc.players.get().map(a=>({kind:"player",mKey:a.key}));if(s())for(const a of this.svc.eligibleNestedTeams(e))r.push({kind:"team",mKey:a.key});return r},(r,a,d)=>r.kind==="player"?this.teamMemberRow(e,r.mKey,d):this.teamNestedRow(e,r.mKey,d),r=>`${r.kind}${r.mKey}`),n}teamNestedRow(e,t,s){const n=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(Vt,{chk:{checked:()=>n(),disabled:()=>!n()&&this.svc.teamAtMaxSize(e),onchange:r=>this.svc.setTeamMemberTeam(e,t,r.target.checked)},name:{textContent:()=>{const r=this.svc.teamByKey(t);return r?`${this.svc.teamLabel(r)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},s)}teamMemberRow(e,t,s){const n=()=>this.svc.players.get().find(a=>a.key===t)??null,r=()=>this.svc.teamMemberIn(e,t);return this.wireEl(Vt,{chk:{checked:()=>r(),disabled:()=>!r()&&this.svc.teamAtMaxSize(e),onchange:a=>this.svc.setTeamMember(e,t,a.target.checked)},name:{textContent:()=>n()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!r()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:a=>this.svc.setTeamPct(e,t,a.target.value)}},s)}hcpPlayer(){const e=this.hcpPadFor.get();return e===null?null:this.svc.players.get().find(t=>t.key===e)??null}openHcpPad(e){this.hcpDraft.set(this.svc.players.get().find(t=>t.key===e)?.handicapIndex??""),this.hcpPadFor.set(e)}hcpAppendDigit(e){const t=this.hcpDraft.get(),[s,n]=t.replace("+","").split(/[.,]/);if(n!==void 0){if(n.length>=1)return}else if(s.length>=2)return;this.hcpDraft.set(t+e)}hcpAppendSep(){const e=this.hcpDraft.get();/[.,]/.test(e)||this.hcpDraft.set(e.replace("+","")===""?`${e}0${Ue()}`:e+Ue())}hcpTogglePlus(){const e=this.hcpDraft.get();this.hcpDraft.set(e.startsWith("+")?e.slice(1):`+${e.replace("-","")}`)}hcpCommit(){const e=this.hcpPadFor.get();e!==null&&(this.hcpDraft.get()!==""&&X(this.hcpDraft.get())===null||(this.svc.patchPlayer(e,{handicapIndex:this.hcpDraft.get()}),this.hcpPadFor.set(null)))}hcpKey(e,t,s){return this.wireEl(Gt,{key:{onclick:s},num:{textContent:e},lbl:{textContent:t}})}playerRow(e,t){const s=()=>this.svc.players.get().find(a=>a.key===e)??null,n=()=>this.svc.players.get().findIndex(a=>a.key===e),r=this.wireEl(ro,{name:{value:s()?.name??"",readOnly:()=>!!s()?.playerId,oninput:a=>this.svc.patchPlayer(e,{name:a.target.value})},index:{value:()=>s()?.handicapIndex??"",onclick:()=>this.openHcpPad(e),onfocus:a=>{a.target.blur(),this.openHcpPad(e)}},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const a=s();if(!a)return"";const d=this.svc.derivedCH(a);if(!d)return"";const c=d.rating;return`Course handicap ${d.ch}  ·  ${a.handicapIndex} × ${c.slope}/113 + (${c.courseRating} − ${c.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(n()).map(a=>a.message).join(" · ")}},t);return this.mountSelect(this.ref(r,"gender"),t,{value:this.bound(t,()=>s()?.gender??"M",a=>this.svc.patchPlayer(e,{gender:a})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]},disabled:{get:()=>s()?.genderKnown===!0}}),this.mountSelect(this.ref(r,"tee"),t,{value:this.bound(t,()=>s()?.teeId??"",a=>this.svc.patchPlayer(e,{teeId:a})),options:{get:()=>this.svc.tees.get().map(a=>({value:a.id,label:a.name}))},placeholder:"Tee"}),r}}function Os(i,e){return y({method:"POST",url:`${D}/auth/login`,body:{username:i,password:e}})}function go(){return y({method:"GET",url:`${D}/auth/me`})}function bo(){return y({method:"POST",url:`${D}/auth/logout`,body:{}})}const We="Something went wrong on our end. Try again in a moment.";function yo(i,e){const t=(i.details??[]).map(n=>n.path),s=n=>t.some(r=>r===`/${n}`);return s("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":s("username")?"Enter your username.":s("displayName")?"Enter a display name.":s("handicapIndex")?"Handicap index must be a number (or leave it empty).":s("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function Ut(i,e){if(i instanceof K)switch(i.status){case 400:return yo(i,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":We;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return i.status>=500?We:"That request could not be completed."}return i instanceof Error&&i.message==="Request timeout"?"That took too long. Check your connection and try again.":i instanceof Error?"Cannot reach the server. Check your connection and try again.":We}const _o=_(`
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
`);class vo extends R{static styles=`
        .login {
            max-width: 340px;
            margin: 0 auto;
            padding: 14vh ${l("xl")} 0;

            &[inert] { opacity: 0.6; }

            & .login__hero {
                text-align: center;
                margin-bottom: ${l("2xl")};

                & .login__flag { font-size: 2.2rem; }

                & h1 {
                    margin: ${l("sm")} 0 0;
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 2.4rem;
                    letter-spacing: -0.02em;
                    color: ${o("text")};
                }

                & p {
                    margin: ${l("xs")} 0 0;
                    color: ${o("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .error {
                display: none;
                padding: ${l("sm")} ${l("md")};
                margin-bottom: ${l("md")};
                color: ${o("error")};
                font-size: 0.875rem;
                text-align: center;
            }
            & .error.show { display: block; }

            & .login__form {
                display: flex;
                flex-direction: column;
                gap: ${l("md")};

                & input {
                    ${V()}
                    padding: ${l("md")} ${l("lg")};
                    font-size: 1rem;
                }

                & .login__register {
                    display: flex;
                    flex-direction: column;
                    gap: ${l("md")};
                    &.hidden { display: none; }
                }

                & .login__genderrow,
                & .login__clubrow {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: ${l("md")};
                    font-size: 0.85rem;
                    color: ${o("text-muted")};
                }

                /* Club names are long ("Linköpings Golfklubb") and naming the
                   club IS the point of the field, so it gets its own line
                   rather than sharing one with the label and ellipsing. */
                & .login__clubrow {
                    flex-direction: column;
                    align-items: stretch;
                    gap: ${l("xs")};
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
                    gap: ${l("xs")};

                    & button {
                        ${I()}
                        padding: ${l("sm")} ${l("lg")};
                        font-size: 0.9rem;
                        font-weight: 700;
                        &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                    }
                }

                /* Direct child only: the submit button. The gender segment and
                   the home-club select bring their own button styling, and a
                   descendant selector here would paint both solid primary. */
                & > button {
                    ${I()}
                    padding: ${l("md")} ${l("lg")};
                    font-size: 1rem;
                    font-weight: 700;
                    background: ${o("primary")};
                    color: ${o("primary-text")};
                    border: none;
                    &:hover { background: ${o("primary")}; }
                }
            }

            & .login__toggle {
                display: block;
                margin: ${l("xl")} auto 0;
                padding: ${l("sm")} ${l("lg")};
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
    `;auth=this.inject(H);router=this.inject(M);nextQ=this.router.query("next");mode=new p("login");busy=new p(!1);formError=new p("");username="";password="";displayName="";hcp="";gender=new p(null);clubs=new p([]);homeClubId=new p("");clubsRequested=!1;async loadClubs(){if(!this.clubsRequested){this.clubsRequested=!0;try{this.clubs.set(await v.setup.clubs())}catch{}}}destination(e){const t=this.nextQ.get();return t&&t.startsWith("/")?t:e}async submit(){if(this.formError.set(""),this.mode.get()==="login"){if(!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const s=await Os(this.username.trim(),this.password);this.auth.currentUser.set(s),this.auth.error.set(null),this.router.navigate(this.destination("/"),!0)}catch(s){this.formError.set(Ut(s,"login"))}finally{this.busy.set(!1)}return}const e=this.hcp.trim(),t=e===""?null:X(e);if(e!==""&&t===null){this.formError.set("Handicap index must be a number (or leave it empty).");return}if(this.password.length<8){this.formError.set("Password must be at least 8 characters.");return}if(!this.username.trim()||!this.displayName.trim()){this.formError.set("Username and display name are required.");return}this.busy.set(!0);try{const s=await v.players.register({username:this.username.trim(),password:this.password,displayName:this.displayName.trim(),handicapIndex:t,gender:this.gender.get(),homeClubId:this.homeClubId.get()||null});this.auth.currentUser.set({id:s.id,username:s.username}),this.router.navigate(this.destination("/"),!0)}catch(s){this.formError.set(Ut(s,"register"))}finally{this.busy.set(!1)}}render(){const e=()=>this.mode.get()==="register",t=()=>this.auth.loading.get()||this.busy.get(),s=this.wire(_o,{root:{inert:()=>t()},error:{className:()=>this.formError.get()?"error show":"error",textContent:()=>this.formError.get()},form:{onsubmit:async a=>{a.preventDefault(),await this.submit()}},username:{oninput:a=>{this.username=a.target.value}},password:{autocomplete:()=>e()?"new-password":"current-password",oninput:a=>{this.password=a.target.value}},registerFields:{className:()=>e()?"login__register":"login__register hidden"},displayName:{oninput:a=>{this.displayName=a.target.value}},hcp:{oninput:a=>{this.hcp=a.target.value}},submit:{textContent:()=>t()?e()?"Creating account…":"Signing in…":e()?"Create account":"Sign in"},toggle:{textContent:()=>e()?"Have an account? Sign in":"New here? Create an account",onclick:()=>{this.formError.set(""),this.auth.error.set(null);const a=!e();this.mode.set(a?"register":"login"),a&&this.loadClubs()}}}),n=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(s,"gender"),()=>n,(a,d,c)=>this.wireEl(_('<button bind="b" type="button"></button>'),{b:{textContent:()=>a.label,className:()=>this.gender.get()===a.value?"on":"",onclick:()=>this.gender.set(a.value)}},c),a=>a.label);const r=new W({value:this.homeClubId,options:{get:()=>[{value:"",label:"No home club"},...this.clubs.get().map(a=>({value:a.id,label:a.name}))]},placeholder:"No home club"});return r.mount(this.ref(s,"club")),this.track(()=>r.destroy()),s}}const wo=_(`
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
`),xo=_(`
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
`),$o=_(`
    <div class="friend-row">
        <span bind="initials" class="friend-row__badge"></span>
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="subtitle" class="friend-row__subtitle"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="remove" class="friend-row__remove" type="button" aria-label="Remove friend">✕</button>
    </div>
`);function Wt(i){return i.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0].toUpperCase()).join("")}class ko extends R{static styles=`
        .friends {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .friends__anon {
                text-align: center;
                padding: ${l("2xl")} 0;
                color: ${o("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${I()}
                    margin-top: ${l("md")};
                    padding: ${l("md")} ${l("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                }
            }

            & .friends__body.hidden { display: none; }

            & .friends__head {
                margin-bottom: ${l("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${l("xs")} 0 0; color: ${o("text-muted")}; font-size: 0.9rem; }
            }

            & .friends__section {
                margin-bottom: ${l("xl")};
                & h2 {
                    margin: 0 0 ${l("sm")};
                    font-family: ${o("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .friends__sechead {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${l("md")};
                & h2 { margin: 0; }
            }

            & .friends__sort {
                display: inline-flex; flex-shrink: 0;
                border: 1px solid ${o("border")}; border-radius: ${o("radius-pill")};
                overflow: hidden;
                &.hidden { display: none; }

                & .friends__sortbtn {
                    ${I()}
                    font-family: inherit; font-size: 0.78rem; font-weight: 700;
                    padding: ${l("xs")} ${l("md")};
                    background: transparent; color: ${o("text-muted")};
                    border: none; border-radius: 0;

                    &[aria-pressed='true'] {
                        background: ${o("primary")}; color: ${o("primary-text")};
                    }
                }
            }

            & .friends__search {
                ${V()}
                width: 100%;
                padding: ${l("md")} ${l("lg")};
                font-size: 1rem;
            }

            & .friends__hint {
                margin: ${l("sm")} 0 0; font-size: 0.82rem; color: ${o("text-muted")};
                &:empty { display: none; }
            }
            & .friends__err {
                margin: ${l("sm")} 0 0; font-size: 0.85rem; color: ${o("error")};
                &:empty { display: none; }
            }

            & .friends__empty {
                color: ${o("text-muted")}; font-size: 0.9rem; padding: ${l("md")} 0;
                &.hidden { display: none; }
            }

            & .friends__list {
                display: flex; flex-direction: column; gap: ${l("sm")};
                margin-top: ${l("md")};
                &:empty { display: none; }
            }

            & .friend-row {
                display: flex; align-items: center; gap: ${l("md")};
                padding: ${l("md")} ${l("lg")};
                ${L()}

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
                    ${I()}
                    flex-shrink: 0; padding: ${l("sm")} ${l("lg")};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
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
                    ${I()}
                    width: 34px; height: 34px; flex-shrink: 0;
                    font-size: 0.9rem; color: ${o("text-muted")};
                }
            }
        }
    `;svc=this.inject(Le);auth=this.inject(H);router=this.inject(M);render(){const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.load();const t=this.wire(wo,{anon:{className:()=>e()?"friends__anon hidden":"friends__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},body:{className:()=>e()?"friends__body":"friends__body hidden"},search:{value:()=>this.svc.query.get(),oninput:n=>this.svc.setQuery(n.target.value)},searchHint:{textContent:()=>{const n=this.svc.query.get().trim();return n.length>0&&!$t(n)?"Type at least 2 characters.":this.svc.searching.get()?"Searching…":""}},searchErr:{textContent:()=>this.svc.searchError.get()?.message??""},resultsEmpty:{className:()=>{const n=this.svc.query.get().trim();return $t(n)&&!this.svc.searching.get()&&this.svc.searchError.get()===null&&this.svc.resultsFor.get()===n&&this.svc.results.get().length===0?"friends__empty":"friends__empty hidden"}},friendsEmpty:{className:()=>this.svc.loaded.get()&&this.svc.friends.get().length===0?"friends__empty":"friends__empty hidden"},sortToggle:{className:()=>this.svc.friends.get().length>0?"friends__sort":"friends__sort hidden"},sortFrecency:{"aria-pressed":()=>String(this.svc.sortMode.get()==="frecency"),onclick:()=>this.svc.setSortMode("frecency")},sortAlpha:{"aria-pressed":()=>String(this.svc.sortMode.get()==="alpha"),onclick:()=>this.svc.setSortMode("alpha")}});this.$each(this.ref(t,"results"),this.svc.results,(n,r,a)=>this.wireEl(xo,{initials:()=>Wt(n.displayName),name:()=>n.displayName,username:()=>n.homeClubName?`@${n.username} · ${n.homeClubName}`:`@${n.username}`,hcp:()=>n.handicapIndex===null?"–":n.handicapIndex.toFixed(1),add:{className:()=>this.isFriendNow(n.id)?"friend-row__add hidden":"friend-row__add",disabled:()=>this.svc.mutating.get(),onclick:()=>{const d=this.svc.results.get().find(c=>c.id===n.id);d&&!d.isFriend&&this.svc.add(d)}},added:{className:()=>this.isFriendNow(n.id)?"friend-row__added":"friend-row__added hidden"}},a),n=>n.id);const s=new Date().toISOString();return this.$each(this.ref(t,"friends"),()=>lt(this.svc.friends.get(),this.svc.sortMode.get()),(n,r,a)=>this.wireEl($o,{initials:()=>Wt(n.displayName),name:()=>n.displayName,subtitle:()=>{const d=this.svc.friends.get().find(c=>c.id===n.id)??n;return bi(d,s)},hcp:()=>n.handicapIndex===null?"–":n.handicapIndex.toFixed(1),remove:{disabled:()=>this.svc.mutating.get(),onclick:()=>{this.svc.remove(n.id)}}},a),n=>n.id),t}isFriendNow(e){return this.svc.results.get().find(t=>t.id===e)?.isFriend===!0}}const So=_(`
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

            <!-- Last on the page, as on iOS (ProfileView.swift:157-158 orders
                 historySection then statsSection): the facts above are what the
                 profile IS, this is a preference about a different screen. -->
            <section class="profile__section profile__stats">
                <h2>Statistics</h2>
                <div class="profile__card">
                    <label class="statrow">
                        <span class="statrow__text">
                            <span class="statrow__head">
                                <span bind="masterTitle" class="statrow__title"></span>
                            </span>
                            <span bind="masterHint" class="statrow__hint"></span>
                        </span>
                        <input bind="master" type="checkbox" role="switch" class="statrow__chk" />
                    </label>
                    <div class="statrow__rule"></div>
                    <div bind="statModules" class="profile__statmods"></div>
                    <p bind="statsErr" class="profile__err"></p>
                </div>
            </section>
        </div>
    </div>
`),Co=_(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`),Io=_(`
    <label bind="row" class="statrow">
        <span class="statrow__text">
            <span class="statrow__head">
                <span bind="title" class="statrow__title"></span>
                <span bind="ann" class="statrow__ann"></span>
            </span>
            <span bind="hint" class="statrow__hint"></span>
        </span>
        <input bind="chk" type="checkbox" role="switch" class="statrow__chk" />
    </label>
`);class To extends R{static styles=`
        .profile {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .profile__anon {
                text-align: center;
                padding: ${l("2xl")} 0;
                color: ${o("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${I()}
                    margin-top: ${l("md")};
                    padding: ${l("md")} ${l("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                }
            }

            & .profile__body.hidden { display: none; }

            & .profile__head {
                margin-bottom: ${l("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${l("xs")} 0 0; color: ${o("text-muted")}; font-size: 0.9rem; }
            }

            & .profile__card {
                padding: ${l("lg")};
                margin-bottom: ${l("xl")};
                ${L()}

                & .profile__label {
                    font-weight: 700; font-size: 0.8rem;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    color: ${o("text-muted")};
                }
                & .profile__hcp-row {
                    display: flex; align-items: center; gap: ${l("md")};
                    margin-top: ${l("sm")};
                }
                & .profile__hcp {
                    font-family: ${o("font-display")};
                    font-weight: 700; font-size: 2rem;
                    font-variant-numeric: tabular-nums;
                    color: ${o("text")};
                }
                & .profile__edit {
                    display: flex; gap: ${l("sm")}; flex: 1; justify-content: flex-end;
                    & input { ${V()} width: 90px; padding: ${l("md")}; font-size: 1rem; text-align: center; }
                    & button {
                        ${I()}
                        padding: ${l("md")} ${l("lg")}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700;
                        background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
                & .profile__hint { margin: ${l("sm")} 0 0; font-size: 0.8rem; color: ${o("text-muted")}; }
                & .profile__err {
                    margin: ${l("sm")} 0 0; font-size: 0.85rem; color: ${o("error")};
                    &:empty { display: none; }
                }

                & .profile__club {
                    margin-top: ${l("sm")};
                    & .ui-select { display: block; width: 100%; }
                }

                & .profile__gender-row { margin-top: ${l("sm")}; }
                & .profile__genderseg {
                    display: flex;
                    gap: ${l("xs")};

                    & button {
                        ${I()}
                        flex: 1;
                        padding: ${l("sm")} 0;
                        font-family: inherit;
                        font-size: 0.9rem;
                        font-weight: 700;
                        &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
            }

            /* Statistics: the master switch, a hairline, then the six modules
               INDENTED under it — they are not six more profile facts, they are
               the contents of the row above and dead while it is off. */
            & .profile__statmods {
                display: flex;
                flex-direction: column;
                gap: ${l("md")};
                padding-left: ${l("md")};
            }

            & .statrow {
                display: flex;
                align-items: flex-start;
                gap: ${l("md")};
                cursor: pointer;

                &.statrow--locked { cursor: default; opacity: 0.55; }

                /* A pill switch, not a checkbox — iOS uses a SwiftUI Toggle
                   tinted accentStrong (ProfileView.swift:431), and a tick box would
                   read as "select this row" rather than "this is on". Drawn on
                   the input itself so the label stays the hit target. */
                & .statrow__chk {
                    appearance: none;
                    -webkit-appearance: none;
                    position: relative;
                    width: 51px; height: 31px;
                    flex-shrink: 0;
                    align-self: center;
                    margin: 0;
                    border-radius: ${o("radius-pill")};
                    background: ${o("border")};
                    cursor: inherit;
                    transition: background 0.2s ease;

                    &::after {
                        content: '';
                        position: absolute;
                        top: 2px; left: 2px;
                        width: 27px; height: 27px;
                        border-radius: 50%;
                        background: #fff;
                        box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
                        transition: transform 0.2s ease;
                    }

                    &:checked {
                        background: ${o("primary")};
                        &::after { transform: translateX(20px); }
                    }
                }
                /* Takes the slack so the switch sits hard against the trailing
                   edge, as the label/control split does on iOS. */
                & .statrow__text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                & .statrow__head {
                    display: flex; align-items: baseline; gap: ${l("sm")};
                    flex-wrap: wrap;
                }
                & .statrow__title { font-size: 1rem; font-weight: 600; color: ${o("text")}; }
                /* The unmet dependency, in words — "Needs Putting". The row is
                   locked either way; this is the half that says which switch to
                   move to get it back. */
                & .statrow__ann {
                    font-size: 0.8rem; color: ${o("text-muted")};
                    &:empty { display: none; }
                }
                & .statrow__hint { font-size: 0.8rem; color: ${o("text-muted")}; }
            }

            & .statrow__rule {
                height: 1px;
                margin: ${l("md")} 0;
                background: ${o("border")};
            }

            & .profile__section {
                & h2 {
                    margin: 0 0 ${l("sm")};
                    font-family: ${o("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .profile__empty {
                color: ${o("text-muted")}; font-size: 0.9rem; padding: ${l("md")} 0;
                &.hidden { display: none; }
            }

            & .profile__history { display: flex; flex-direction: column; gap: ${l("sm")}; }

            & .hcp-entry {
                display: flex; align-items: baseline; gap: ${l("md")};
                padding: ${l("md")} ${l("lg")};
                ${L()}

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
        }
    `;svc=this.inject(je);auth=this.inject(H);router=this.inject(M);indexDraft=new p("");localErr=new p("");render(){this.auth.currentUser.get()&&this.svc.load();const e=()=>this.auth.currentUser.get()!==null,t=this.wire(So,{anon:{className:()=>e()?"profile__anon hidden":"profile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/profile"}})},body:{className:()=>e()?"profile__body":"profile__body hidden"},name:()=>this.svc.player.get()?.displayName??"…",username:()=>{const a=this.svc.player.get();return a?`@${a.username}`:""},hcp:()=>{const a=this.svc.player.get()?.handicapIndex;return a==null?"–":a<0?`+${(-a).toFixed(1)}`:a.toFixed(1)},index:{value:()=>this.indexDraft.get(),oninput:a=>this.indexDraft.set(a.target.value)},save:{disabled:()=>this.svc.saving.get()||this.indexDraft.get().trim()==="",textContent:()=>this.svc.saving.get()?"Saving…":"Save"},form:{onsubmit:async a=>{a.preventDefault(),this.localErr.set("");const d=X(this.indexDraft.get());if(d===null||d<-10||d>54){this.localErr.set("Enter an index between +10 and 54 (use “+” for a plus handicap).");return}await this.svc.saveIndex(d)&&this.indexDraft.set("")}},saveErr:{textContent:()=>this.localErr.get()||this.svc.saveError.get()?.message||""},genderErr:{textContent:()=>this.svc.saveError.get()?.message||""},clubErr:{textContent:()=>this.svc.saveError.get()?.message||""},masterTitle:()=>li,masterHint:()=>di,master:{checked:()=>this.svc.statsConfig.get().enabled,disabled:()=>this.statsBusy(),onchange:a=>{this.saveStats(a,(d,c)=>pi(d,c),d=>d.enabled)}},statsErr:{textContent:()=>this.svc.statsError.get()?.message||""},historyEmpty:{className:()=>this.svc.history.get().length===0?"profile__empty":"profile__empty hidden"}});this.$each(this.ref(t,"history"),this.svc.history,(a,d,c)=>this.wireEl(Co,{index:()=>a.handicapIndex.toFixed(1),source:()=>a.source,date:()=>a.effectiveDate},c),a=>a.id),this.$each(this.ref(t,"statModules"),()=>[...ps],(a,d,c)=>{const u=()=>this.svc.statsConfig.get(),f=()=>ci(u(),a);return this.wireEl(Io,{row:{className:()=>f()?"statrow statrow--locked":"statrow"},title:()=>ms(a),ann:()=>ui(u(),a)??"",hint:()=>oi(a),chk:{checked:()=>Ne(u(),a),disabled:()=>f()||this.statsBusy(),onchange:m=>{this.saveStats(m,(h,b)=>hi(h,a,b),h=>Ne(h,a))}}},c)},a=>a);const s=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(t,"gender"),()=>s,(a,d,c)=>this.wireEl(_('<button bind="b" type="button"></button>'),{b:{textContent:()=>a.label,className:()=>this.svc.player.get()?.gender===a.value?"on":"",disabled:()=>this.svc.saving.get(),onclick:()=>{this.svc.saveGender(a.value)}}},c),a=>a.label);const n=new p(this.svc.player.get()?.homeClubId??"");this.track(N(()=>n.set(this.svc.player.get()?.homeClubId??""))),this.track(N(()=>{const a=n.get();queueMicrotask(()=>{a!==(this.svc.player.get()?.homeClubId??"")&&this.svc.saveHomeClub(a===""?null:a)})}));const r=new W({value:n,options:{get:()=>[{value:"",label:"No home club"},...this.svc.clubs.get().map(a=>({value:a.id,label:a.name}))]},placeholder:"No home club",disabled:{get:()=>this.svc.saving.get()}});return r.mount(this.ref(t,"club")),this.track(()=>r.destroy()),t}statsBusy(){return this.svc.statsSaving.get()||this.svc.saving.get()}async saveStats(e,t,s){const n=e.target;await this.svc.saveStatsConfig(t(this.svc.statsConfig.get(),n.checked)),n.checked=s(this.svc.statsConfig.get())}}const Eo=_(`
    <div class="admin">
        <button bind="back" class="admin__back" type="button">← Home</button>
        <h1 class="admin__title">Admin</h1>

        <div bind="denied" class="admin__denied">
            <p>This area needs a super admin role.</p>
            <p class="admin__denied-hint">Grant one from the server shell: <code>bun run grant:role grant &lt;username&gt; super_admin</code></p>
        </div>

        <div bind="body" class="admin__body">
            <div bind="stats" class="admin__stats"></div>

            <div class="admin__tabs">
                <button bind="tabRounds" type="button">Rounds</button>
                <button bind="tabPlayers" type="button">Players</button>
            </div>

            <div bind="loading" class="admin__loading">Loading…</div>
            <div bind="roundList" class="admin__list"></div>
            <div bind="playerList" class="admin__list"></div>
        </div>
        <div bind="confirmHost"></div>
    </div>
`),No=_(`
    <div class="stat">
        <span bind="value" class="stat__value"></span>
        <span bind="label" class="stat__label"></span>
    </div>
`),Po=_(`
    <button bind="row" type="button" class="admin-row">
        <div class="admin-row__top">
            <span bind="course" class="admin-row__title"></span>
            <span bind="status" class="admin-chip"></span>
        </div>
        <div class="admin-row__sub">
            <span bind="who"></span>
        </div>
        <div class="admin-row__sub admin-row__meta">
            <span bind="meta"></span>
        </div>
    </button>
`),Ro=_(`
    <div class="admin-row admin-row--static">
        <div class="admin-row__top">
            <span bind="name" class="admin-row__title"></span>
            <span bind="roleChip" class="admin-chip"></span>
        </div>
        <div class="admin-row__sub">
            <span bind="meta"></span>
        </div>
        <div class="admin-row__actions">
            <button bind="toggle" type="button"></button>
        </div>
    </div>
`),Oo={not_started:"Not started",active:"Playing",complete:"Done"};function zo(i){const e=[`${i.participants.length} players`,`${i.scoreEventCount} scores`];return i.lastEventAt?e.push(`last ${i.lastEventAt.replace("T"," ").slice(0,16)}`):e.push("never played"),e.join(" · ")}function jo(i){const e=[`@${i.username}`,`${i.roundCount} rounds`];return i.lastRoundDate&&e.push(`last ${i.lastRoundDate}`),i.handicapIndex!==null&&e.push(`hcp ${i.handicapIndex}`),i.deletedAt&&e.push("DELETED"),e.join(" · ")}class Lo extends R{static styles=`
        .admin {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .admin__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${o("text-muted")};
                cursor: pointer; padding: ${l("xs")} 0; margin-bottom: ${l("md")};
            }

            & .admin__title {
                margin: 0 0 ${l("lg")};
                font-family: ${o("font-display")};
                font-weight: 600; font-size: 1.8rem; letter-spacing: -0.02em;
                color: ${o("text")};
            }

            & .admin__denied {
                color: ${o("text-muted")}; font-size: 0.9rem;
                &.hidden { display: none; }
                & code {
                    display: block; margin-top: ${l("xs")};
                    font-size: 0.8rem; word-break: break-all;
                }
            }
            & .admin__denied-hint { color: ${o("text-muted")}; }
            & .admin__body.hidden { display: none; }

            & .admin__stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
                gap: ${l("sm")};
                margin-bottom: ${l("lg")};

                & .stat {
                    ${L({})}
                    display: flex; flex-direction: column; gap: 2px;
                    padding: ${l("sm")} ${l("md")};

                    & .stat__value {
                        font-family: ${o("font-display")};
                        font-size: 1.4rem; font-weight: 700; color: ${o("text")};
                    }
                    & .stat__label {
                        font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
                        text-transform: uppercase; color: ${o("text-muted")};
                    }
                }
            }

            & .admin__tabs {
                display: flex; gap: ${l("sm")}; margin-bottom: ${l("md")};

                & button {
                    ${I()}
                    flex: 1;
                    padding: ${l("sm")} ${l("md")};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
                    background: ${o("surface-sunken")}; color: ${o("text-muted")};
                    border: none; cursor: pointer;

                    &.active { background: ${o("primary")}; color: ${o("primary-text")}; }
                }
            }

            & .admin__loading {
                color: ${o("text-muted")}; font-size: 0.9rem; padding: ${l("lg")} 0;
                &.hidden { display: none; }
            }

            & .admin__list {
                display: flex; flex-direction: column; gap: ${l("sm")};
                &.hidden { display: none; }
            }

            & .admin-row {
                ${L({hover:!0})}
                display: flex; flex-direction: column; gap: ${l("xs")};
                width: 100%; text-align: left; font-family: inherit;
                padding: ${l("md")} ${l("lg")};
                cursor: pointer;

                &.admin-row--static { cursor: default; }

                & .admin-row__top {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: ${l("sm")};
                }

                & .admin-row__title {
                    font-weight: 700; font-size: 1rem; color: ${o("text")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }

                & .admin-row__sub {
                    font-size: 0.8rem; color: ${o("text-muted")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .admin-row__meta { font-variant-numeric: tabular-nums; }

                & .admin-row__actions {
                    display: flex; justify-content: flex-end; margin-top: ${l("xs")};
                    & button {
                        ${I()}
                        padding: ${l("xs")} ${l("md")};
                        font-family: inherit; font-size: 0.75rem; font-weight: 700;
                        background: ${o("surface-sunken")}; color: ${o("text-muted")};
                        border: none; cursor: pointer;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
            }

            & .admin-chip {
                flex-shrink: 0;
                font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.08em; border-radius: ${o("radius-pill")};
                padding: 2px 10px;
                background: ${o("surface-sunken")}; color: ${o("text-muted")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(_s);auth=this.inject(H);router=this.inject(M);tab=new p("rounds");grantOpen=new p(!1);grantTarget=new p(null);mutating=new p(!1);denied=new S(()=>this.auth.currentUser.get()===null||!this.svc.isSuperAdmin());render(){this.svc.loadRoles().then(()=>{this.svc.isSuperAdmin()&&this.svc.load()});const e=this.wire(Eo,{back:{onclick:()=>this.router.navigate("/")},denied:{className:()=>this.denied.get()?"admin__denied":"admin__denied hidden"},body:{className:()=>this.denied.get()?"admin__body hidden":"admin__body"},loading:{className:()=>this.svc.loading.get()?"admin__loading":"admin__loading hidden"},tabRounds:{className:()=>this.tab.get()==="rounds"?"active":"",onclick:()=>this.tab.set("rounds")},tabPlayers:{className:()=>this.tab.get()==="players"?"active":"",onclick:()=>this.tab.set("players")},roundList:{className:()=>this.tab.get()==="rounds"?"admin__list":"admin__list hidden"},playerList:{className:()=>this.tab.get()==="players"?"admin__list":"admin__list hidden"}}),t=new S(()=>{const s=this.svc.stats.get();return s?[{key:"rounds",label:"Rounds",value:s.rounds},{key:"active",label:"Playing",value:s.roundsActive},{key:"week",label:"Last 7d",value:s.roundsLast7Days},{key:"players",label:"Players",value:s.players},{key:"guests",label:"Guests",value:s.guests},{key:"scores",label:"Scores",value:s.scoreEvents}]:[]});return this.$each(this.ref(e,"stats"),t,(s,n,r)=>this.wireEl(No,{value:()=>String(s.value),label:()=>s.label},r),s=>s.key),this.$each(this.ref(e,"roundList"),this.svc.rounds,(s,n,r)=>this.wireEl(Po,{row:{disabled:()=>s.shareToken===null,onclick:()=>{s.shareToken&&this.router.navigate("/round",{query:{token:s.shareToken}})}},course:()=>s.courseName??"Unknown course",status:()=>Oo[s.status],who:()=>{const a=s.creatorName?`by ${s.creatorName}`:"by a guest",d=s.participants.join(", ");return d?`${a} — ${d}`:a},meta:()=>`${s.date} · ${zo(s)}`},r),s=>s.roundId),this.$each(this.ref(e,"playerList"),this.svc.players,(s,n,r)=>this.wireEl(Ro,{name:()=>s.displayName,roleChip:()=>s.roles.includes("super_admin")?"admin":"",meta:()=>jo(s),toggle:{textContent:()=>s.roles.includes("super_admin")?"Revoke admin":"Make admin",disabled:()=>this.mutating.get(),onclick:()=>{this.grantTarget.set(s),this.grantOpen.set(!0)}}},r),s=>s.playerId),this.spawn(U,this.ref(e,"confirmHost"),{open:this.grantOpen,title:()=>this.grantTarget.get()?.roles.includes("super_admin")?"Revoke admin?":"Make admin?",message:()=>{const s=this.grantTarget.get();return s?s.roles.includes("super_admin")?`Remove the super admin role from ${s.displayName}?`:`Give ${s.displayName} the super admin role? They will be able to see every player's rounds.`:""},confirmLabel:"Confirm",cancelLabel:"Cancel",onconfirm:()=>{const s=this.grantTarget.get();s&&this.toggleAdmin(s)}}),e}async toggleAdmin(e){this.mutating.set(!0);try{const t={playerId:e.playerId,role:"super_admin"};e.roles.includes("super_admin")?await v.admin.adminRevokeRole(t):await v.admin.adminGrantRole(t),await this.svc.load(!0)}finally{this.mutating.set(!1)}}}function Ao(i,e){return i?e!==null&&i.ownerPlayerId===e?!0:i.rounds.some(t=>typeof t.shareToken=="string"):!1}class ie{list=new p([]);listLoading=new p(!1);listError=new p(null);listLoaded=new p(!1);detail=new p(null);detailId=new p(null);detailLoading=new p(!1);detailError=new p(null);participants=new p([]);board=new p(null);boardRefusal=new p(null);boardLoading=new p(!1);results=new p(null);resultsRefusal=new p(null);mutating=new p(!1);mutateError=new p(null);async loadList(e=!1){if(!e&&(this.listLoaded.get()||this.listLoading.get()))return;const t=await z(this.listLoading,this.listError,()=>v.competitions.list());t&&(this.list.set(t),this.listLoaded.set(!0))}async loadDetail(e,t=!1){if(!t&&this.detailId.get()===e&&this.detail.get()!==null&&!this.detailLoading.get()||this.detailLoading.get()&&this.detailId.get()===e)return;this.detailId.set(e);const s=await z(this.detailLoading,this.detailError,()=>Promise.all([v.competitions.get({id:e}),v.competitions.participants({competitionId:e})]));if(!s)return;const[n,r]=s;this.detailId.get()===e&&(this.detail.set(n),this.participants.set(r),await this.loadBoard(e),n.lifecycle==="finalized"&&await this.loadResults(e))}async loadBoard(e){this.boardLoading.set(!0);try{const t=await v.competitions.leaderboard({id:e});t.ok?(this.board.set(t.value),this.boardRefusal.set(null)):(this.board.set(null),this.boardRefusal.set(t.refusal.message))}catch{this.board.set(null),this.boardRefusal.set(null)}finally{this.boardLoading.set(!1)}}async loadResults(e){try{const t=await v.competitions.results({id:e});t.ok?(this.results.set(t.value),this.resultsRefusal.set(null)):(this.results.set(null),this.resultsRefusal.set(t.refusal.message))}catch{this.results.set(null)}}async create(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.create({name:e});return this.list.set([t,...this.list.get()]),t}catch(t){return this.mutateError.set(se(t)),null}finally{this.mutating.set(!1)}}transition(e,t){return this.mutate(()=>v.competitions.transition({id:e,to:t}),()=>this.loadDetail(e,!0))}updateConfig(e){return this.mutate(()=>v.competitions.update(e),()=>this.loadDetail(e.id,!0))}async addPlayer(e,t,s){return this.rosterMutate(e,()=>v.competitions.addParticipant({competitionId:e,playerId:t,category:s}))}async addGuest(e,t,s){this.mutating.set(!0),this.mutateError.set(null);let n;try{n=(await v.guestPlayers.create(t)).id}catch(r){return this.mutating.set(!1),this.mutateError.set(se(r)),se(r)}return this.mutating.set(!1),this.rosterMutate(e,()=>v.competitions.addParticipant({competitionId:e,guestPlayerId:n,category:s}))}removeParticipant(e,t){return this.rosterMutate(e,()=>v.competitions.removeParticipant({participantId:t}))}withdrawParticipant(e,t){return this.rosterMutate(e,()=>v.competitions.withdrawParticipant({participantId:t}))}async createRound(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.createRound(e);if(t.ok)return await this.loadDetail(e.id,!0),{ok:!0,shareToken:t.shareToken};const s="refusal"in t?t.refusal.message:t.diagnostics.map(n=>n.message).join(" · ");return this.mutateError.set(s),{ok:!1,message:s}}catch(t){const s=se(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}async applyCut(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.applyCut({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const s=se(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}async finalize(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.finalize({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const s=se(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}clear(){this.list.set([]),this.listLoaded.set(!1),this.detail.set(null),this.detailId.set(null),this.participants.set([]),this.board.set(null),this.boardRefusal.set(null),this.results.set(null),this.resultsRefusal.set(null),this.listError.set(null),this.detailError.set(null),this.mutateError.set(null)}async mutate(e,t){this.mutating.set(!0),this.mutateError.set(null);try{const s=await e();return s.ok?(await t(),null):(this.mutateError.set(s.refusal.message),s.refusal.message)}catch(s){const n=se(s);return this.mutateError.set(n),n}finally{this.mutating.set(!1)}}rosterMutate(e,t){return this.mutate(t,async()=>{const s=await v.competitions.participants({competitionId:e});this.participants.set(s)})}}function se(i){return i&&typeof i=="object"&&"message"in i&&typeof i.message=="string"?i.message:"Something went wrong. Try again."}function zs(i){switch(i){case"draft":return"Draft";case"setup":return"Setup";case"active":return"Live";case"finalized":return"Finalized"}}function js(i){return`comp-chip comp-chip--${i}`}function Qe(i){switch(i){case"draft":return{to:"setup",label:"Open setup"};case"setup":return{to:"active",label:"Start competition"};default:return null}}function st(i){return i==="draft"||i==="setup"}function Do(i){return i==="setup"||i==="active"}const Mo=_(`
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
`),Ho=_(`
    <button bind="row" type="button" class="comp-row">
        <span bind="name" class="comp-row__name"></span>
        <span bind="chip"></span>
    </button>
`);class Fo extends R{static styles=`
        .comps {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .comps__head {
                margin-bottom: ${l("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${o("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${l("xs")} 0 0; color: ${o("text-muted")}; font-size: 0.9rem; }
            }

            & .comps__anon {
                text-align: center;
                padding: ${l("2xl")} 0;
                color: ${o("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${I()}
                    margin-top: ${l("md")};
                    padding: ${l("md")} ${l("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                }
            }
            & .comps__body.hidden { display: none; }

            & .comps__create {
                display: flex;
                gap: ${l("sm")};
                margin-bottom: ${l("md")};
                & input { ${V()} flex: 1; padding: ${l("md")}; font-size: 1rem; }
                & button {
                    ${I()}
                    padding: ${l("md")} ${l("lg")};
                    font-family: inherit; font-size: 0.95rem; font-weight: 700;
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
            & .comps__err {
                margin: 0 0 ${l("md")}; font-size: 0.85rem; color: ${o("error")};
                &:empty { display: none; }
            }

            & .comps__loading, & .comps__empty {
                color: ${o("text-muted")}; font-size: 0.9rem; padding: ${l("lg")} 0;
                &.hidden { display: none; }
            }

            & .comps__list { display: flex; flex-direction: column; gap: ${l("sm")}; }

            & .comp-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${l("md")};
                padding: ${l("md")} ${l("lg")};
                text-align: left;
                font-family: inherit;
                width: 100%;
                ${L({hover:!0})}
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
    `;svc=this.inject(ie);auth=this.inject(H);router=this.inject(M);loggedIn=new S(()=>this.auth.currentUser.get()!==null);nameDraft=new p("");render(){this.loggedIn.get()&&this.svc.loadList();const e=this.wire(Mo,{anon:{className:()=>this.loggedIn.get()?"comps__anon hidden":"comps__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/competitions"}})},body:{className:()=>this.loggedIn.get()?"comps__body":"comps__body hidden"},nameInput:{value:()=>this.nameDraft.get(),oninput:t=>this.nameDraft.set(t.target.value)},createBtn:{disabled:()=>this.svc.mutating.get()||this.nameDraft.get().trim()==="",textContent:()=>this.svc.mutating.get()?"Creating…":"Create"},createForm:{onsubmit:async t=>{t.preventDefault();const s=this.nameDraft.get().trim();if(s==="")return;const n=await this.svc.create(s);n&&(this.nameDraft.set(""),this.router.navigate("/competition",{query:{id:n.id}}))}},createErr:{textContent:()=>this.svc.mutateError.get()??""},loading:{className:()=>this.svc.listLoading.get()&&!this.svc.listLoaded.get()?"comps__loading":"comps__loading hidden"},empty:{className:()=>this.svc.listLoaded.get()&&this.svc.list.get().length===0?"comps__empty":"comps__empty hidden"}});return this.$each(this.ref(e,"list"),this.svc.list,(t,s,n)=>this.wireEl(Ho,{row:{onclick:()=>this.router.navigate("/competition",{query:{id:t.id}})},name:()=>t.name,chip:{textContent:()=>zs(t.lifecycle),className:()=>js(t.lifecycle)}},n),t=>t.id),e}}class Bo{loading=new p(!1);error=new p(null);descriptors=new p([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await z(this.loading,this.error,()=>v.setup.aggregations());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=re()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:typeof e=="string"?e:""}}function Go(i,e){const t={};for(const s of i){const n=e[s.key];t[s.key]=n!=null?String(n):String(s.default)}return t}function qo(i,e){const t={};for(const s of i){const n=e[s.key]??String(s.default);t[s.key]=s.kind==="integer"?Number.parseInt(n,10)||Number(s.default):n}return t}class be{competitions=B.get(ie);formats=B.get(fe);aggregations=B.get(Bo);friends=B.get(Le);profile=B.get(je);auth=B.get(H);router=B.get(M);id=this.router.query("id");admin=new S(()=>Ao(this.competitions.detail.get(),this.profile.player.get()?.id??null));lifecycle=new S(()=>this.competitions.detail.get()?.lifecycle??"draft");editingSetup=new p(!1);nameDraft=new p("");slotDraft=new p([]);aggregationStrategy=new p("");aggregationValues=new p({});startListDraft=new p("single_group");courseDraft=new p("");teeDraft=new p("");cutAfterDraft=new p("");cutTypeDraft=new p("");cutValueDraft=new p("");formatPickDraft=new p("");guestNameDraft=new p("");guestGenderDraft=new p("M");guestHcpDraft=new p("");roundCourseDraft=new p("");roundDateDraft=new p("");courses=new p([]);tees=new p([]);resultSetIndex=new p(0);cutOutcome=new p(null);cutConfirmOpen=new p(!1);finalizeConfirmOpen=new p(!1);coursesLoaded=!1;enter(){this.editingSetup.set(!1),this.nameDraft.set(""),this.slotDraft.set([]),this.aggregationStrategy.set(""),this.aggregationValues.set({}),this.startListDraft.set("single_group"),this.courseDraft.set(""),this.teeDraft.set(""),this.tees.set([]),this.cutAfterDraft.set(""),this.cutTypeDraft.set(""),this.cutValueDraft.set(""),this.formatPickDraft.set(""),this.guestNameDraft.set(""),this.guestGenderDraft.set("M"),this.guestHcpDraft.set(""),this.roundCourseDraft.set(""),this.roundDateDraft.set(""),this.resultSetIndex.set(0),this.cutOutcome.set(null),this.cutConfirmOpen.set(!1),this.finalizeConfirmOpen.set(!1)}initialize(){this.auth.currentUser.get()&&(this.profile.load(),this.friends.load()),this.formats.load(),this.aggregations.load(),this.loadCourses()}loadCourses(){this.coursesLoaded||(this.coursesLoaded=!0,v.courses.list().then(e=>this.courses.set(e)).catch(()=>{this.coursesLoaded=!1}))}async loadTees(e){if(!e){this.tees.set([]);return}try{this.tees.set(await v.tees.listByCourse({courseId:e}))}catch{this.tees.set([])}}selectAggregation(e){this.applyAggregation(e,{})}applyAggregation(e,t){this.aggregationStrategy.set(e);const s=this.aggregations.byId(e)?.configFields??[];this.aggregationValues.set(Go(s,t))}setAggregationValue(e,t){this.aggregationValues.set({...this.aggregationValues.get(),[e]:t})}seedSetupEditor(){const e=this.competitions.detail.get();if(!e)return;this.nameDraft.set(e.name);const t=e.defaultConfig;this.slotDraft.set((t?.slots??[]).map(a=>a.formatId)),this.startListDraft.set(t?.startList??"single_group"),this.teeDraft.set(t?.fallbackTee?.teeId??"");const s=e.aggregation,n=s?.strategyId??this.aggregations.descriptors.get()[0]?.id??"";this.applyAggregation(n,s?.config??{});const r=e.cutRules;this.cutAfterDraft.set(r?.afterRound!==void 0?String(r.afterRound):""),this.cutTypeDraft.set(r?.cutType??""),this.cutValueDraft.set(r?.cutValue!==void 0?String(r.cutValue):""),this.formatPickDraft.set(this.formats.descriptors.get()[0]?.id??""),this.editingSetup.set(!0)}async saveSetup(){const e=this.id.get()??"",t=this.slotDraft.get().map(b=>({formatId:b})),s=this.teeDraft.get(),n=t.length>0?{slots:t,startList:this.startListDraft.get(),...s?{fallbackTee:{teeId:s}}:{}}:void 0,r=this.aggregationStrategy.get(),a=this.aggregations.byId(r)?.configFields??[],d=r?{strategyId:r,config:qo(a,this.aggregationValues.get())}:void 0,c=Number.parseInt(this.cutAfterDraft.get(),10),u=Number.parseInt(this.cutValueDraft.get(),10),f=this.cutTypeDraft.get(),m=f&&Number.isFinite(c)&&Number.isFinite(u)?{afterRound:c,cutType:f,cutValue:u}:void 0;await this.competitions.updateConfig({id:e,name:this.nameDraft.get().trim()||void 0,...n?{defaultConfig:n}:{},...d?{aggregation:d}:{},...m?{cutRules:m}:{}})===null&&this.editingSetup.set(!1)}async addGuest(){const e=this.guestNameDraft.get().trim();if(!e)return;const t=X(this.guestHcpDraft.get());await this.competitions.addGuest(this.id.get()??"",{displayName:e,gender:this.guestGenderDraft.get(),handicapIndex:t},null)===null&&(this.guestNameDraft.set(""),this.guestHcpDraft.set(""))}async createRound(){const e=this.roundCourseDraft.get()||this.courseDraft.get(),t=this.roundDateDraft.get();if(!e||!t)return this.competitions.mutateError.set("Pick a course and a date for the round."),null;const s=await this.competitions.createRound({id:this.id.get()??"",courseId:e,playedAt:t});return s.ok?s.shareToken:null}}const Ko=_(`
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
`),Vo=_(`
    <div class="cd__slot">
        <span bind="label"></span>
        <button bind="remove" type="button" aria-label="Remove">×</button>
    </div>
`),ke=_('<option bind="option"></option>'),Uo=_(`
    <label class="cd__field">
        <span bind="label"></span>
        <select bind="select"></select>
        <input bind="integer" inputmode="numeric" />
    </label>
`);class Wo extends R{competitions=this.inject(ie);state=this.inject(be);render(){const e=()=>this.competitions.detail.get(),t=this.wire(Ko,{root:{className:()=>this.state.admin.get()&&st(this.state.lifecycle.get())?"cd__section cd__setup":"cd__section cd__setup hidden"},toggle:{textContent:()=>this.state.editingSetup.get()?"Close":"Edit",onclick:()=>{this.state.editingSetup.get()?this.state.editingSetup.set(!1):this.state.seedSetupEditor()}},summary:{className:()=>this.state.editingSetup.get()?"cd__summary hidden":"cd__summary"},summaryFormats:{textContent:()=>{const r=e()?.defaultConfig?.slots??[];return r.length?r.map(a=>this.state.formats.labelOf(a.formatId)??a.formatId).join(", "):"none set"},className:()=>(e()?.defaultConfig?.slots.length??0)===0?"cd__muted-em":""},summaryScoring:{textContent:()=>{const r=e()?.aggregation;return r?this.state.aggregations.labelOf(r.strategyId):"default (chosen automatically)"},className:()=>e()?.aggregation?"":"cd__muted-em"},form:{className:()=>this.state.editingSetup.get()?"cd__form":"cd__form hidden"},name:{value:()=>this.state.nameDraft.get(),oninput:r=>this.state.nameDraft.set(r.target.value)},formatPick:{value:()=>this.state.formatPickDraft.get(),onchange:r=>this.state.formatPickDraft.set(r.target.value)},addSlot:{onclick:()=>{const r=this.state.formatPickDraft.get()||this.state.formats.descriptors.get()[0]?.id;r&&this.state.slotDraft.set([...this.state.slotDraft.get(),r])}},aggregationPick:{value:()=>this.state.aggregationStrategy.get(),onchange:r=>this.state.selectAggregation(r.target.value)},aggregationDescription:()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.description??"",course:{value:()=>this.state.courseDraft.get(),onchange:r=>{const a=r.target.value;this.state.courseDraft.set(a),this.state.teeDraft.set(""),this.state.loadTees(a)}},tee:{value:()=>this.state.teeDraft.get(),onchange:r=>this.state.teeDraft.set(r.target.value)},startList:{value:()=>this.state.startListDraft.get(),onchange:r=>this.state.startListDraft.set(r.target.value)},cutAfter:{value:()=>this.state.cutAfterDraft.get(),oninput:r=>this.state.cutAfterDraft.set(r.target.value)},cutType:{value:()=>this.state.cutTypeDraft.get(),onchange:r=>this.state.cutTypeDraft.set(r.target.value)},cutValue:{value:()=>this.state.cutValueDraft.get(),oninput:r=>this.state.cutValueDraft.set(r.target.value)},save:{disabled:()=>this.competitions.mutating.get(),textContent:()=>this.competitions.mutating.get()?"Saving…":"Save setup",onclick:()=>{this.state.saveSetup()}},cancel:{onclick:()=>this.state.editingSetup.set(!1)}});this.$each(this.ref(t,"slots"),this.state.slotDraft,(r,a,d)=>this.wireEl(Vo,{label:()=>`Slot ${a+1}: ${this.state.formats.labelOf(r)??r}`,remove:{onclick:()=>this.state.slotDraft.set(this.state.slotDraft.get().filter((c,u)=>u!==a))}},d),(r,a)=>`${a}:${r}`),this.$each(this.ref(t,"formatPick"),this.state.formats.descriptors,(r,a,d)=>this.wireEl(ke,{option:{value:()=>r.id,textContent:()=>this.state.formats.labelOf(r)??r.id}},d),r=>r.id),this.$each(this.ref(t,"aggregationPick"),this.state.aggregations.descriptors,(r,a,d)=>this.wireEl(ke,{option:{value:()=>r.id,textContent:()=>this.state.aggregations.labelOf(r)}},d),r=>r.id);const s=new S(()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.configFields??[]);this.$each(this.ref(t,"aggregationFields"),s,(r,a,d)=>this.configField(r,d),r=>r.key);const n=(r,a)=>this.wireEl(ke,{option:{value:()=>r.id,textContent:()=>r.name}},a);return this.$each(this.ref(t,"course"),this.state.courses,(r,a,d)=>n(r,d),r=>r.id),this.$each(this.ref(t,"tee"),this.state.tees,(r,a,d)=>n(r,d),r=>r.id),t}configField(e,t){const s=this.wireEl(Uo,{label:()=>e.label,select:{className:()=>e.kind==="select"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),onchange:a=>this.state.setAggregationValue(e.key,a.target.value)},integer:{className:()=>e.kind==="integer"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),oninput:a=>this.state.setAggregationValue(e.key,a.target.value)}},t),n=s.querySelector("select"),r=new S(()=>e.kind==="select"?e.options:[]);return this.$each(n,r,(a,d,c)=>this.wireEl(ke,{option:{value:()=>a.value,textContent:()=>a.label}},c),a=>a.value),s}}const Qo=_(`
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
`),Yo=_(`
    <div class="cd__rosterrow">
        <span bind="name" class="cd__rname"></span>
        <span bind="category" class="cd__rcat"></span>
        <span bind="status" class="cd__rout"></span>
        <button bind="withdraw" class="cd__ract" type="button">Withdraw</button>
        <button bind="remove" class="cd__ract cd__ract--danger" type="button">Remove</button>
    </div>
`),Xo=_('<button bind="chip" class="cd__friendchip" type="button"></button>');class Jo extends R{competitions=this.inject(ie);state=this.inject(be);render(){const e=()=>this.state.id.get()??"",t=this.wire(Qo,{count:()=>{const s=this.competitions.participants.get().length;return s===0?"":String(s)},empty:{className:()=>this.competitions.participants.get().length===0?"cd__empty":"cd__empty hidden"},add:{className:()=>this.state.admin.get()&&st(this.state.lifecycle.get())?"cd__rosteradd":"cd__rosteradd hidden"},guestForm:{onsubmit:s=>{s.preventDefault(),this.state.addGuest()}},guestName:{value:()=>this.state.guestNameDraft.get(),oninput:s=>this.state.guestNameDraft.set(s.target.value)},guestGender:{value:()=>this.state.guestGenderDraft.get(),onchange:s=>this.state.guestGenderDraft.set(s.target.value)},guestHcp:{value:()=>this.state.guestHcpDraft.get(),oninput:s=>this.state.guestHcpDraft.set(s.target.value)},addGuest:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"roster"),this.competitions.participants,(s,n,r)=>this.wireEl(Yo,{name:()=>s.displayNameSnapshot,category:{textContent:()=>s.category??"",className:()=>s.category?"cd__rcat":"cd__rcat hidden"},status:{textContent:()=>s.withdrawnAt?"Withdrawn":s.cutAfterRound!==null?`Cut R${s.cutAfterRound}`:"",className:()=>s.withdrawnAt||s.cutAfterRound!==null?"cd__rout":"cd__rout hidden"},withdraw:{className:()=>this.state.admin.get()&&!s.withdrawnAt?"cd__ract":"cd__ract hidden",onclick:()=>{this.competitions.withdrawParticipant(e(),s.id)}},remove:{className:()=>this.state.admin.get()&&st(this.state.lifecycle.get())?"cd__ract cd__ract--danger":"cd__ract cd__ract--danger hidden",onclick:()=>{this.competitions.removeParticipant(e(),s.id)}}},r),s=>JSON.stringify({id:s.id,name:s.displayNameSnapshot,category:s.category,withdrawnAt:s.withdrawnAt,cutAfterRound:s.cutAfterRound})),this.$each(this.ref(t,"friends"),this.state.friends.friends,(s,n,r)=>this.wireEl(Xo,{chip:{textContent:()=>s.displayName,disabled:()=>this.competitions.mutating.get()||this.competitions.participants.get().some(a=>a.playerId===s.id),onclick:()=>{this.competitions.addPlayer(e(),s.id,null)}}},r),s=>s.id),t}}const Zo={not_started:"Not started",active:"Live",complete:"Finished"},el=_(`
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
`),tl=_(`
    <button bind="row" class="cd__roundrow" type="button">
        <span bind="number" class="cd__rnum"></span>
        <span bind="meta" class="cd__rmeta"></span>
        <span bind="status" class="cd__rstatus"></span>
    </button>
`),sl=_('<option bind="option"></option>');class nl extends R{competitions=this.inject(ie);state=this.inject(be);router=this.inject(M);render(){const e=new S(()=>this.competitions.detail.get()?.rounds??[]),t=this.wire(el,{empty:{className:()=>e.get().length===0?"cd__empty":"cd__empty hidden"},form:{className:()=>this.state.admin.get()&&Do(this.state.lifecycle.get())?"cd__addround":"cd__addround hidden",onsubmit:s=>{s.preventDefault(),this.createRound()}},course:{value:()=>this.state.roundCourseDraft.get(),onchange:s=>this.state.roundCourseDraft.set(s.target.value)},date:{value:()=>this.state.roundDateDraft.get(),oninput:s=>this.state.roundDateDraft.set(s.target.value)},add:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"course"),this.state.courses,(s,n,r)=>this.wireEl(sl,{option:{value:()=>s.id,textContent:()=>s.name}},r),s=>s.id),this.$each(this.ref(t,"rounds"),e,(s,n,r)=>this.wireEl(tl,{row:{disabled:()=>!s.shareToken,onclick:()=>{s.shareToken&&this.router.navigate("/round",{query:{token:s.shareToken}})}},number:()=>`Round ${s.roundNumber}`,meta:()=>[s.courseNameSnapshot,s.date].filter(Boolean).join(" · ")||(s.shareToken?"Open":"View-only"),status:{textContent:()=>Zo[s.status]??s.status,className:()=>`cd__rstatus s-${s.status}`}},r),s=>JSON.stringify({id:s.id,status:s.status,shareToken:s.shareToken,courseName:s.courseNameSnapshot,date:s.date})),t}async createRound(){const e=await this.state.createRound();e&&this.router.navigate("/round",{query:{token:e}})}}function il(i,e,t){return JSON.stringify({entry:i,points:e,columns:t})}function rl(i){return i.rounds.filter(e=>e.value!==null).map(e=>({text:String(e.value),dropped:e.status==="dropped"}))}const al=_(`
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
`),ol=_('<button bind="button" type="button"></button>'),ll=_('<th bind="cell"></th>'),dl=_('<tr bind="row"></tr>'),cl=_('<td bind="cell"><span bind="value"></span></td>'),ul=_(`
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
`),hl=_('<span bind="part"><span bind="separator"></span><span bind="value"></span></span>');class pl extends R{competitions=this.inject(ie);state=this.inject(be);render(){const e=new S(()=>{if(this.state.lifecycle.get()!=="finalized")return(this.competitions.board.get()?.view.entries??[]).map(m=>({entry:m,points:null}));const u=this.competitions.results.get()?.resultSets??[],f=Math.min(this.state.resultSetIndex.get(),u.length-1);return(u[f]?.entries??[]).map(m=>({entry:m.entry,points:m.points}))}),t=new S(()=>{const u=this.competitions.board.get()?.view.rounds??[];if(u.length>0)return u;const f=new Set;for(const m of e.get())for(const h of m.entry.rounds)f.add(h.roundNumber);return[...f].sort((m,h)=>m-h).map(m=>({roundNumber:m,postCut:!1}))}),s=()=>this.state.lifecycle.get()==="finalized",n=()=>s()?(this.competitions.results.get()?.resultSets.length??0)>0:this.competitions.board.get()!==null,r=()=>this.state.cutOutcome.get(),a=u=>u.length===0?"—":u.map(f=>f.displayName).join(", "),d=this.wire(al,{admin:{className:()=>this.state.admin.get()&&this.state.lifecycle.get()==="active"?"cd__section cd__admin":"cd__section cd__admin hidden"},cutOutcome:{className:()=>r()?"cd__cutoutcome":"cd__cutoutcome hidden"},advancedLabel:()=>`Advanced (${r()?.advanced.length??0}):`,advanced:()=>a(r()?.advanced??[]),cutLabel:()=>`Cut (${r()?.cut.length??0}):`,cut:()=>a(r()?.cut??[]),applyCut:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.cutConfirmOpen.set(!0)},finalize:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.finalizeConfirmOpen.set(!0)},title:()=>s()?"Official results":"Leaderboard",board:{className:()=>s()?"cd__board cb cb--official":"cd__board"},official:{textContent:()=>{const u=this.competitions.results.get()?.finalizedAt.slice(0,10)??"";return s()&&u?`Official results · finalized ${u}`:""},className:()=>s()?"cd__official-banner":"cd__official-banner hidden"},boardHead:{className:()=>s()?"cb-head hidden":"cb-head"},metric:()=>this.competitions.board.get()?.view.metricLabel??"",operator:()=>{const u=this.competitions.board.get();return u?u.view.operator.kind==="best_n"?`Best ${u.view.operator.n} of ${u.view.rounds.length}`:"Total across rounds":""},defaulted:{className:()=>this.competitions.board.get()?.defaulted?"cb-head__hint":"cb-head__hint hidden"},empty:{className:()=>n()&&e.get().length===0?"cb-empty":"cb-empty hidden"},table:{className:()=>n()&&e.get().length>0?"cb":"cb hidden"},refusal:{textContent:()=>s()?this.competitions.resultsRefusal.get()??"":this.competitions.board.get()===null?this.competitions.boardRefusal.get()??"":""}}),c=new S(()=>[{text:"#",className:"cb-pos"},{text:"Player",className:"cb-who"},...t.get().map((u,f,m)=>({text:`R${u.roundNumber}`,className:`cb-c${u.postCut&&!m.slice(0,f).some(h=>h.postCut)?" cb-c--divider":""}`})),{text:"Total",className:"cb-total"},...s()?[{text:"Pts",className:"cb-points"}]:[]]);return this.$each(this.ref(d,"headers"),c,(u,f,m)=>this.wireEl(ll,{cell:{textContent:()=>u.text,className:()=>u.className}},m),u=>`${u.text}:${u.className}`),this.$each(this.ref(d,"rows"),e,(u,f,m)=>this.boardRow(u,t.get(),m),u=>il(u.entry,u.points,t.get())),this.$each(this.ref(d,"switcher"),new S(()=>s()?this.competitions.results.get()?.resultSets??[]:[]),(u,f,m)=>this.wireEl(ol,{button:{textContent:()=>u.scoringType.toUpperCase(),className:()=>this.state.resultSetIndex.get()===f?"on":"",onclick:()=>this.state.resultSetIndex.set(f)}},m),u=>u.scoringType),this.spawn(U,this.ref(d,"cutConfirm"),{open:this.state.cutConfirmOpen,title:"Apply cut?",message:"This evaluates the configured cut against the current aggregate and marks who advances. Cut players are left out of later rounds.",confirmLabel:"Apply cut",cancelLabel:"Cancel",onconfirm:async()=>{const u=await this.competitions.applyCut(this.state.id.get()??"");u.ok&&this.state.cutOutcome.set(u.outcome)}}),this.spawn(U,this.ref(d,"finalizeConfirm"),{open:this.state.finalizeConfirmOpen,title:"Finalize competition?",message:"Finalizing freezes the official results and locks the competition. This cannot be undone.",confirmLabel:"Finalize",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.competitions.finalize(this.state.id.get()??"")}}),d}boardRow(e,t,s){const n=e.entry,r=n.withdrawn||n.cutAfterRound!==null,a=["cb-row"];n.withdrawn?a.push("cb-row--withdrawn"):n.cutAfterRound!==null?a.push("cb-row--cut"):n.position===1&&a.push("cb-row--lead"),n.incomplete&&a.push("cb-row--incomplete");const d=t.findIndex(m=>m.postCut),c=new Map(n.rounds.map(m=>[m.roundNumber,m])),u=[{kind:"position",text:r?"—":String(n.position)},{kind:"who",entry:n},...t.map((m,h)=>({kind:"round",cell:c.get(m.roundNumber)??null,divider:h===d})),{kind:"total",text:n.total===null?"—":String(n.total)},...e.points===null?[]:[{kind:"points",text:String(e.points)}]],f=this.wireEl(dl,{row:{className:()=>a.join(" ")}},s);return this.$each(f,new S(()=>u),(m,h,b)=>this.boardCell(m,b),(m,h)=>h),f}boardCell(e,t){if(e.kind==="who")return this.whoCell(e.entry,t);const s=e.kind==="position"?"cb-pos":e.kind==="total"?"cb-total":e.kind==="points"?"cb-points":`cb-c cb-c--${e.cell?.status??"missing"}${e.divider?" cb-c--divider":""}`,n=e.kind==="round"?e.cell?.value===null||!e.cell?"—":String(e.cell.value):e.text;return this.wireEl(cl,{cell:{className:()=>s},value:{textContent:()=>n,className:()=>e.kind==="round"&&e.cell?.status==="dropped"?"cb-struck":""}},t)}whoCell(e,t){const s=e.withdrawn?"WD":e.cutAfterRound!==null?`Cut R${e.cutAfterRound}`:"",n=rl(e),r=this.wireEl(ul,{cell:{},name:()=>e.displayName,category:{textContent:()=>e.category??"",className:()=>e.category?"cb-tag cb-cat":"cb-tag cb-cat hidden"},status:{textContent:()=>s,className:()=>s?"cb-tag cb-tag--out":"cb-tag cb-tag--out hidden"},equals:{className:()=>n.length===0?"hidden":""},total:()=>e.total===null?"—":String(e.total)},t);return this.$each(r.querySelector('[bind="parts"]'),new S(()=>n),(a,d,c)=>this.wireEl(hl,{separator:()=>d===0?"":" + ",value:{textContent:()=>a.text,className:()=>a.dropped?"cb-struck":""}},c),(a,d)=>d),r}}const ml=_(`
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
`);class fl extends R{static styles=`
        .cd {
            padding: ${l("lg")} ${l("lg")} ${l("2xl")};
            & .hidden { display: none !important; }
            & .cd__muted-em { font-style: italic; }
            & .cb-struck { text-decoration: line-through; opacity: 0.8; }

            & .cd__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 700; color: ${o("accent")};
                cursor: pointer; padding: 0 0 ${l("md")};
            }
            & .cd__loading, & .cd__loaderr {
                color: ${o("text-muted")}; padding: ${l("lg")} 0;
                &.hidden { display: none; }
            }
            & .cd__loaderr { color: ${o("error")}; }
            & .cd__body.hidden { display: none; }

            & .cd__head { margin-bottom: ${l("md")}; }
            & .cd__titlerow { display: flex; align-items: center; gap: ${l("md")}; }
            & .cd__head h1 {
                margin: 0; font-family: ${o("font-display")}; font-weight: 600;
                font-size: 1.7rem; letter-spacing: -0.02em;
            }
            & .cd__owner { margin: ${l("xs")} 0 0; color: ${o("text-muted")}; font-size: 0.85rem; }

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
                margin: 0 0 ${l("md")}; font-size: 0.85rem; color: ${o("error")};
                &:empty { display: none; }
            }

            & .cd__transition {
                margin-bottom: ${l("lg")};
                &.hidden { display: none; }
                & button {
                    ${I()}
                    padding: ${l("md")} ${l("lg")}; font-family: inherit;
                    font-size: 0.95rem; font-weight: 700;
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                    &:disabled { opacity: 0.5; }
                }
            }

            & .cd__section {
                margin-bottom: ${l("xl")};
                &.hidden { display: none; }
            }
            & .cd__section-head {
                display: flex; align-items: baseline; gap: ${l("sm")};
                margin-bottom: ${l("sm")};
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
                ${L()} padding: ${l("md")} ${l("lg")};
                font-size: 0.85rem; color: ${o("text-muted")}; line-height: 1.5;
                &.hidden { display: none; }
            }
            & .cd__empty { color: ${o("text-muted")}; font-size: 0.9rem; padding: ${l("sm")} 0;
                &.hidden { display: none; } &:empty { display: none; } }

            & .cd__form {
                ${L()} padding: ${l("lg")};
                display: flex; flex-direction: column; gap: ${l("md")};
                &.hidden { display: none; }
                & .cd__field { display: flex; flex-direction: column; gap: ${l("xs")};
                    & > span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                        letter-spacing: 0.05em; color: ${o("text-muted")}; }
                    & input, & select { ${V()} padding: ${l("sm")} ${l("md")}; font-size: 0.95rem; }
                }
                & .cd__aggdesc { margin: 0; font-size: 0.8rem; color: ${o("text-muted")}; &:empty { display: none; } }
                & .cd__aggfields { display: flex; flex-direction: column; gap: ${l("md")}; &:empty { display: none; } }
                & .cd__cutrow, & .cd__addrow { display: flex; gap: ${l("sm")}; }
                & .cd__cutrow input { width: 33%; }
                & .cd__addrow select { flex: 1; }
                & .cd__slots { display: flex; flex-direction: column; gap: ${l("xs")}; }
                & .cd__formactions { display: flex; align-items: center; gap: ${l("md")}; margin-top: ${l("sm")}; }
                & button[bind="addSlot"], & button[bind="saveSetup"] {
                    ${I()}
                    padding: ${l("sm")} ${l("md")}; font-family: inherit; font-weight: 700;
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                }
            }
            & .cd__slot {
                display: flex; align-items: center; justify-content: space-between;
                padding: ${l("xs")} ${l("sm")}; background: ${o("surface-sunken")};
                border-radius: ${o("radius-sm")}; font-size: 0.9rem; font-weight: 600;
                & button { background: none; border: none; color: ${o("error")}; cursor: pointer; font-size: 1.1rem; }
            }

            & .cd__roster { display: flex; flex-direction: column; gap: ${l("xs")}; margin-bottom: ${l("md")}; }
            & .cd__rosterrow {
                display: flex; align-items: center; gap: ${l("sm")};
                padding: ${l("sm")} ${l("md")}; ${L()}
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
                margin: ${l("md")} 0 ${l("xs")}; }
            & .cd__friendpick { display: flex; flex-wrap: wrap; gap: ${l("xs")}; }
            & .cd__friendchip {
                ${I()}
                padding: ${l("xs")} ${l("md")}; font-family: inherit;
                font-size: 0.85rem; font-weight: 600; cursor: pointer;
                &:disabled { opacity: 0.4; }
            }
            & .cd__guestrow, & .cd__addroundrow { display: flex; gap: ${l("sm")}; }
            & .cd__guestrow input, & .cd__addroundrow input, & .cd__addroundrow select {
                ${V()}
                padding: ${l("sm")} ${l("md")}; font-size: 0.9rem; min-width: 0; }
            & .cd__guestrow input[bind="guestName"] { flex: 1; }
            & .cd__guestrow input[bind="guestHcp"] { width: 4.5rem; }
            & .cd__guestrow select { width: 3.5rem; }
            & .cd__addroundrow select { flex: 1; }
            & .cd__guestrow button, & .cd__addroundrow button {
                ${I()}
                padding: ${l("sm")} ${l("md")}; font-family: inherit; font-weight: 700;
                background: ${o("primary")}; color: ${o("primary-text")}; border: none; }

            & .cd__rounds { display: flex; flex-direction: column; gap: ${l("xs")}; }
            & .cd__roundrow {
                display: flex; align-items: center; gap: ${l("md")};
                padding: ${l("md")} ${l("lg")}; ${L({hover:!0})}
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
            & .cd__adminbtns { display: flex; gap: ${l("md")}; }
            & .cd__adminbtns button {
                ${I()}
                padding: ${l("md")} ${l("lg")}; font-family: inherit; font-weight: 700;
            }
            & .cd__cutbtn { background: ${o("accent-soft")}; color: ${o("accent")}; border-color: ${o("accent")}; }
            & .cd__finalbtn { background: ${o("error")}; color: #fff; border: none; }
            & .cd__adminnote { margin: ${l("sm")} 0 0; font-size: 0.8rem; color: ${o("text-muted")}; }
            & .cd__cutoutcome { &:empty { display: none; } margin-bottom: ${l("md")}; font-size: 0.85rem;
                ${L()} padding: ${l("md")} ${l("lg")}; }
            & .cd__cutoutcome .cd__cutgrp { margin-bottom: ${l("xs")}; }
            & .cd__cutoutcome strong { color: ${o("text")}; }

            & .cd__setswitch { display: flex; gap: ${l("xs")}; margin-bottom: ${l("sm")};
                &:empty { display: none; }
                & button {
                    ${I()}
                    padding: ${l("xs")} ${l("md")}; font-family: inherit;
                    font-size: 0.85rem; font-weight: 700; cursor: pointer;
                    &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                }
            }

            /* --- aggregated / official board --- */
            & .cd__board { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            & .cd__official-banner {
                ${L()} padding: ${l("sm")} ${l("lg")}; margin-bottom: ${l("sm")};
                background: ${o("accent-soft")}; color: ${o("accent")};
                font-weight: 700; font-size: 0.85rem;
                border-color: ${o("accent")};
            }
            & .cb-head { display: flex; align-items: baseline; gap: ${l("sm")}; margin-bottom: ${l("sm")}; }
            & .cb-head__title { margin: 0; font-family: ${o("font-display")}; font-weight: 600; font-size: 1rem; }
            & .cb-head__op, & .cb-head__hint { font-size: 0.75rem; color: ${o("text-muted")}; }
            & .cb-empty { color: ${o("text-muted")}; padding: ${l("md")} 0; }
            & table.cb {
                width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums;
            }
            & .cb.cb--official { box-shadow: inset 0 0 0 2px ${o("accent")}; border-radius: ${o("radius")}; }
            & .cb thead th {
                font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em;
                color: ${o("text-muted")}; font-weight: 700; padding: ${l("xs")} ${l("sm")};
                border-bottom: 1px solid ${o("border")}; text-align: center;
            }
            & .cb th.cb-who, & .cb td.cb-who { text-align: left; }
            & .cb tbody td { padding: ${l("sm")}; border-bottom: 1px solid ${o("border")};
                text-align: center; font-size: 0.9rem; }
            & .cb .cb-pos { width: 2rem; color: ${o("text-muted")}; font-weight: 700; }
            & .cb .cb-who { min-width: 0; }
            & .cb .cb-who__line { display: flex; align-items: baseline; gap: ${l("xs")}; min-width: 0; }
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
    `;competitions=this.inject(ie);state=this.inject(be);router=this.inject(M);render(){const e=()=>this.competitions.detail.get();this.track(N(()=>{const s=this.state.id.get();s&&q(()=>{this.state.enter(),this.competitions.loadDetail(s)})})),this.state.initialize();const t=this.wire(ml,{back:{onclick:()=>this.router.navigate("/competitions")},loading:{className:()=>this.competitions.detailLoading.get()&&e()===null?"cd__loading":"cd__loading hidden"},loadErr:{textContent:()=>this.competitions.detailError.get()?.message??"",className:()=>this.competitions.detailError.get()?"cd__loaderr":"cd__loaderr hidden"},body:{className:()=>e()?"cd__body":"cd__body hidden"},name:()=>e()?.name??"",chip:{textContent:()=>zs(this.state.lifecycle.get()),className:()=>js(this.state.lifecycle.get())},ownerLine:{textContent:()=>this.state.admin.get()?"You administer this competition.":"Read-only view."},mutateErr:{textContent:()=>this.competitions.mutateError.get()??""},transitionRow:{className:()=>this.state.admin.get()&&Qe(this.state.lifecycle.get())?"cd__transition":"cd__transition hidden"},transitionBtn:{textContent:()=>Qe(this.state.lifecycle.get())?.label??"",disabled:()=>this.competitions.mutating.get(),onclick:()=>{const s=Qe(this.state.lifecycle.get()),n=this.state.id.get();s&&n&&this.competitions.transition(n,s.to)}}});return this.spawn(Wo,this.ref(t,"setup")),this.spawn(Jo,this.ref(t,"roster")),this.spawn(nl,this.ref(t,"rounds")),this.spawn(pl,this.ref(t,"results")),t}}const gl=_(`
    <div class="app-shell">
        <header bind="header" class="app-shell__header">
            <div bind="account"></div>
        </header>
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class bl extends R{static styles=`
        .app-shell {
            display: grid;
            grid-template-rows: auto 1fr auto;
            height: 100vh;
            height: 100dvh;
            max-width: 560px;
            margin: 0 auto;
            background: ${o("bg")};

            /* The account slot. Its popover is absolutely positioned inside the
               menu component, so the header must not clip or under-stack it. */
            & .app-shell__header {
                grid-row: 1;
                position: relative;
                z-index: 20;
                display: flex;
                justify-content: flex-end;
                padding: ${l("md")} ${l("lg")} 0;

                &.hidden { display: none; }
            }

            & .app-shell__content {
                grid-row: 2;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }

            /* Keep shell children in their declared tracks when route chrome is
               display:none. Without explicit placement, hiding the header makes
               grid auto-placement shift content into the auto-sized first row
               and the empty nav host into 1fr, stranding /round's dock mid-page. */
            & .app-shell__nav {
                grid-row: 3;
            }
        }
    `;router=this.inject(M);render(){const e=this.wire(gl,{header:{className:()=>hs(this.router.route.get())?"app-shell__header":"app-shell__header hidden"}});return this.spawn(Ti,this.ref(e,"account")),this.spawn(ai,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":It,"/history":Bi,"/round":Ka,"/create":fo,"/login":vo,"/friends":ko,"/profile":To,"/admin":Lo,...us.competitions?{"/competitions":Fo,"/competition":fl}:{}},It),e}}class yl extends H{async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await Os(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await go()),this.error.set(null)}catch(e){e instanceof K&&e.status===401?this.error.set(null):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await bo(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof K&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}}B.get(en);const Qt=B.get(M);B.set(H,new yl);const Yt=B.get(H);await rn(bl,"#app",{hot:void 0,onInit:async()=>{await Yt.load(),Yt.currentUser.get()&&Qt.route.get()==="/login"&&Qt.navigate("/",!0)}});export{Ye as A,R as C,M as R,p as S,en as T,y as a,me as b,S as c,Ks as d,N as e,qs as n,z as r,_ as t};
