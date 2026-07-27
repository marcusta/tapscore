(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=t(n);fetch(n.href,r)}})();const ms="modulepreload",fs=function(i){return"/tapscore/"+i},ot={},gs=function(e,t,s){let n=Promise.resolve();if(t&&t.length>0){let c=function(h){return Promise.all(h.map(f=>Promise.resolve(f).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),d=o?.nonce||o?.getAttribute("nonce");n=c(t.map(h=>{if(h=fs(h),h in ot)return;ot[h]=!0;const f=h.endsWith(".css"),m=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${h}"]${m}`))return;const u=document.createElement("link");if(u.rel=f?"stylesheet":ms,f||(u.as="script"),u.crossOrigin="",u.href=h,d&&u.setAttribute("nonce",d),document.head.appendChild(u),f)return new Promise((_,b)=>{u.addEventListener("load",_),u.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${h}`)))})}))}function r(o){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=o,window.dispatchEvent(d),!d.defaultPrevented)throw o}return n.then(o=>{for(const d of o||[])d.status==="rejected"&&r(d.reason);return e().catch(r)})},At="/tapscore/".replace(/\/+$/,""),He=At+"/api",Ie={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},bs=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function at(i,e){const t={};for(const[s,n]of bs)if(s in i)for(const r of n)r in i||(t[r]=`var(--${s})`);return{...e,...t,...i}}const Ht=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],ys={thin:"1px",medium:"3px",thick:"5px"};function Mt(i){const e=i.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":ys[e.toLowerCase()]??e}function _s(){return Ht.map(i=>{const e=Mt(Ie[i]);return`@property --${i}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const Ft={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Bt={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},vs={...Bt,"done-opacity":"0.35"},ws={...Ft,...Bt,...Ie,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},xs={...Ft,...vs,...Ie,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class $s{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;Gt(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.disposed||s.run()}}}const W=new $s;function Gt(i){for(const e of i.deps)e.delete(i);i.deps.clear()}class p{constructor(e){this.subs=new Set,this.val=e}get(){return W.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,W.notify(this.subs))}update(e){this.set(e(this.val))}}class k{constructor(e){this.subs=new Set,this.val=void 0;const t=this,s={run(){W.runTracked(s,()=>{const n=e();Object.is(t.val,n)||(t.val=n,W.notify(t.subs))})},deps:new Set};s.run()}get(){return W.subscribe(this.subs),this.val}peek(){return this.val}}function E(i){const e={run(){W.runTracked(e,i)},deps:new Set};return e.run(),()=>{e.disposed=!0,Gt(e)}}function he(i){W.batch(i)}function G(i){return W.untrack(i)}class ks{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const A=new ks,oe=At;function Me(i){return oe?i===oe?"/":i.startsWith(oe+"/")?i.slice(oe.length):i:i}function Ss(i){return oe+i}class R{constructor(){this.route=new p(Me(location.pathname??"/")),this.search=new p(location.search??""),window.addEventListener("popstate",()=>he(()=>{this.route.set(Me(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},n=e.indexOf("#"),r=n>=0?e.slice(n):"",o=n>=0?e.slice(0,n):e,d=o.indexOf("?"),c=d>=0?o.slice(0,d):o,h=d>=0?o.slice(d+1):"",f=s.query!==void 0?Cs(s.query):h?"?"+h:"",m=Ss(c)+f+r;(s.replace?history.replaceState:history.pushState).call(history,null,"",m),he(()=>{this.route.set(c),this.search.set(f)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:n=>{n.preventDefault(),this.navigate(e)},className:()=>{const n=this.route.get();return n===s||n.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new k(()=>{const s=this.route.get().split("/"),n={};for(const[r,o]of t.entries())o.startsWith(":")&&(n[o.slice(1)]=s[r]??"");return n})}query(e){return new k(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new k(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function Cs(i){const e=new URLSearchParams;for(const[s,n]of Object.entries(i))n==null||n===""||e.set(s,String(n));const t=e.toString();return t?"?"+t:""}function Ts(i){return e=>i[e]}const Is="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",lt="data-basics-global";function Es(){if(document.head.querySelector(`style[${lt}]`))return;const i=document.createElement("style");i.setAttribute(lt,""),i.textContent=_s()+Is,document.head.appendChild(i)}function Ns(i,e){Es();const t=new Set(Ht),s=(r,o,d)=>{const c=Object.entries(r).map(([h,f])=>`--${h}:${t.has(h)?Mt(f):f}`).join(";");return`${o}{color-scheme:${d};${c}}`},n=document.createElement("style");return n.textContent=s(i,'[data-theme="light"]',"light")+s(e,'[data-theme="dark"]',"dark"),document.head.appendChild(n),r=>`var(--${r})`}const dt="basics-js-theme";class Ps{constructor(){this.dark=new p(!1);const e=localStorage.getItem(dt),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),E(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(dt,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function y(i){const e=document.createElement("template");return e.innerHTML=i,e}function zs(i,e){let t;for(const s of Object.keys(e))i.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const ct=new Set;class N{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!ct.has(t)){ct.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return A.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const n=G(()=>{const r=new e(s[0]);return r.mount(t),r});return this.children.push(n),n}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){G(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,s){const n=s??(o=>this.track(o)),r=e.content.cloneNode(!0);for(const o of r.querySelectorAll("[bind]")){const d=t[o.getAttribute("bind")];if(d)if(typeof d=="function")n(E(()=>{const c=d();o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement?o.value=String(c):o.textContent=String(c)}));else for(const[c,h]of Object.entries(d)){const f=c.includes("-");c.startsWith("on")&&typeof h=="function"?o.addEventListener(c.slice(2),h):typeof h=="function"?n(E(()=>{const m=h();f?o.setAttribute(c,String(m)):o[c]=m})):f?o.setAttribute(c,String(h)):o[c]=h}}return r}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const n=this.ref(t,e);return n?(typeof s=="string"?n.textContent=s:typeof s=="function"&&s.prototype instanceof N?this.spawn(s,n):typeof s=="function"&&s(n,{spawn:(r,o,...d)=>this.spawn(r,o,...d),track:r=>this.track(r)}),!0):!1}$each(e,t,s,n=(r,o)=>o){const r=typeof t=="function"?t:()=>t.get(),o=new Map,d=new Map;this.track(()=>{for(const c of d.values())c.forEach(h=>h());d.clear()}),this.track(E(()=>{const c=r(),h=new Map;for(const[m,u]of c.entries()){const _=n(u,m);if(o.has(_))h.set(_,o.get(_));else{const b=[];h.set(_,G(()=>s(u,m,T=>b.push(T)))),d.set(_,b)}}for(const[m,u]of o)h.has(m)||(u.remove(),G(()=>d.get(m)?.forEach(_=>_())),d.delete(m));let f=e.firstChild;for(const m of h.values())m===f?f=f.nextSibling:e.insertBefore(m,f);o.clear();for(const[m,u]of h)o.set(m,u)}))}$condition(e,t,s,n){let r=null;this.track(E(()=>{r&&(r.remove(),r=null);const o=t.get();r=G(()=>o?s():n?.()??null),r&&e.appendChild(r)}))}$swap(e,t,s,n){let r=null;this.track(E(()=>{if(r){const c=r;r=null,G(()=>c.destroy())}e.textContent="";const o=t.get(),d=s[o]??zs(o,s)??n;d&&(r=G(()=>{const c=new d;return c.mount(e),c}))})),this.track(()=>r?.destroy())}}const Ce=new Set;function Os(i){return Ce.add(i),()=>Ce.delete(i)}function js(){for(const i of Array.from(Ce)){Ce.delete(i);try{i()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function Rs(i,e,t){const s=document.querySelector(e);s.textContent="";const n=A.get(R);let r=null,o=!1,d=null,c=!!t?.hot?.data.hmr;const h=async f=>{r&&(r.destroy(),r=null,s.textContent=""),f?(d||(d=(await gs(()=>import("./obs-shell.component-LKgQ3oYp.js"),[])).ObsShellComponent),r=G(()=>new d)):(!c&&t?.onInit&&(await t.onInit(),c=!0),r=G(()=>new i)),G(()=>r.mount(s)),o=f};await h(Me(location.pathname).startsWith("/_obs")),E(()=>{const f=n.route.get().startsWith("/_obs");f!==o&&h(f)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{r?.destroy()}catch(f){console.error("[startApp] the root component threw while disposing",f)}if(r=null,js(),t.onDispose)try{t.onDispose()}catch(f){console.error("[startApp] onDispose threw",f)}}),t.hot.accept())}class q extends Error{constructor(e,t,s,n){super(t),this.status=e,this.details=s,this.traceId=n,this.name="ApiError"}}const Ls=10,$e=[];let ke=[],de=null;function Ds(i){$e.push(i),$e.length>Ls&&$e.shift()}function qt(i,e,t){const s={code:i,message:e,url:typeof location<"u"?location.href:"",context:[...$e],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),ke.push(s),As()}function As(){de||(de=setTimeout(Kt,5e3))}function Kt(){if(de&&(clearTimeout(de),de=null),ke.length===0)return;const i=ke;ke=[];for(const e of i){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${He}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${He}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Kt()});const Hs=3e4,Ms=2,be=new Map,Vt=new WeakMap;function Fs(i){if(i instanceof q)return i.traceId;if(i!=null&&typeof i=="object")return Vt.get(i)}async function g(i){if(i.method==="GET"){const e=be.get(i.url);if(e)return e;const t=ut(i,Ms);return be.set(i.url,t),t.then(()=>be.delete(i.url),()=>be.delete(i.url)),t}return ut(i,0)}async function ut(i,e){const t=i.timeout??Hs;let s;for(let n=0;n<=e;n++){const r=crypto.randomUUID();try{return await Gs(Bs(i,r),t)}catch(o){if(s=o,!(o instanceof q)&&o!=null&&typeof o=="object"&&Vt.set(o,r),o instanceof q||n===e)break;await new Promise(d=>setTimeout(d,1e3*2**n))}}throw s}async function Bs(i,e){const t={"X-Trace-Id":e},s={method:i.method,headers:t};i.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(i.body));const n=await fetch(i.url,s),r=n.headers.get("x-trace-id")??e;if(Ds({type:"api",detail:`${i.method} ${i.url}`,timestamp:new Date().toISOString()}),!n.ok){const o=await n.json().catch(()=>({error:n.statusText}));throw new q(n.status,o.error??n.statusText,o.details,r)}return n.json()}function Gs(i,e){let t;const s=new Promise((n,r)=>{t=setTimeout(()=>r(new Error("Request timeout")),e)});return Promise.race([i,s]).finally(()=>clearTimeout(t))}const Fe=new Set;let Pe=!1;function qs(i){return Fe.add(i),()=>{Fe.delete(i)}}function Ks(){if(!Pe){Pe=!0;try{for(const i of[...Fe])try{i()}catch(e){try{qt("session-listener",Vs(e))}catch{}}}finally{Pe=!1}}}function Vs(i){try{if(i instanceof Error){const e=i.message;if(typeof e=="string")return e}return String(i)}catch{return"listener threw a value that could not be described"}}async function O(i,e,t,s={}){he(()=>{i.set(!0),e.set(null)});try{const n=await t();return i.set(!1),n}catch(n){const r=Us(n);he(()=>{i.set(!1),e.set(r)}),qt(r.code,r.message,Fs(n)),r.code==="auth"&&s.sessionExpiry!==!1&&Ks();return}}function Us(i){return i instanceof q?i.status===401?{code:"auth",message:"Unauthorized"}:i.status===409?{code:"conflict",message:"Data has changed — please try again"}:i.status===400?{code:"validation",message:i.message}:i.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:i instanceof Error?i.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const ht={sessionExpiry:!1};function Ws(i){return{me:()=>g({method:"GET",url:`${i}/auth/me`}),login:e=>g({method:"POST",url:`${i}/auth/login`,body:e}),logout:()=>g({method:"POST",url:`${i}/auth/logout`,body:{}})}}class H{constructor(){this.api=Ws(He),this.currentUser=new p(null),this.loading=new p(!1),this.error=new p(null),this.offSessionExpired=qs(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=Os(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await O(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await O(this.loading,this.error,()=>this.api.login({username:e,password:t}),ht);return s?(this.currentUser.set(s),!0):!1}async logout(){await O(this.loading,this.error,()=>this.api.logout(),ht);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const pt={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},a=Ns(at({...pt,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},ws),at({...pt,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"},xs)),I=i=>`var(--${i})`,x=(i,e)=>`var(--${i}, ${e})`,$=i=>{const e=Ie[i];if(e===void 0)throw new Error(`unknown control token: --${i}`);return e},l=Ts({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),ye=i=>`
    background: ${x(`btn-${i}-bg`,$(`btn-${i}-bg`))};
    color: ${x(`btn-${i}-fg`,$(`btn-${i}-fg`))};
    border-color: ${x(`btn-${i}-border`,$(`btn-${i}-border`))};
    box-shadow: ${x(`btn-${i}-shadow`,$(`btn-${i}-shadow`))};
    &:hover {
        background: ${x(`btn-${i}-bg-hover`,$(`btn-${i}-bg-hover`))};
        color: ${x(`btn-${i}-fg-hover`,$(`btn-${i}-fg-hover`))};
        border-color: ${x(`btn-${i}-border-hover`,$(`btn-${i}-border-hover`))};
    }`,Ut=`
    background: ${x("btn-disabled-bg",$("btn-disabled-bg"))};
    color: ${x("btn-disabled-fg",$("btn-disabled-fg"))};
    border-color: ${x("btn-disabled-border",$("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${x("btn-disabled-opacity",$("btn-disabled-opacity"))};
    cursor: not-allowed;`,Ys={primary:ye("primary"),secondary:ye("secondary"),ghost:ye("ghost"),danger:ye("danger"),disabled:Ut},S=(i=x("btn-radius",$("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${x("btn-border-width",$("btn-border-width"))} solid transparent;
    border-radius: ${i};
    padding: ${x("btn-padding-y",$("btn-padding-y"))} ${x("btn-padding-x",$("btn-padding-x"))};
    font-family: ${I("font-ui")};
    font-size: ${x("btn-font-size",$("btn-font-size"))};
    line-height: ${x("btn-line-height",$("btn-line-height"))};
    font-weight: ${x("btn-font-weight",$("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${I("dur-fast")} ${I("ease-standard")},
        border-color ${I("dur-fast")} ${I("ease-standard")},
        color ${I("dur-fast")} ${I("ease-standard")},
        box-shadow ${I("dur-fast")} ${I("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${x("btn-focus-ring-width",$("btn-focus-ring-width"))} ${x("btn-focus-ring",$("btn-focus-ring"))};
    }
    ${Ys[e]}
    &:disabled {${Ut}}
`,Qs=`max(${x("field-border-width",$("field-border-width"))}, ${x("field-rule-width",$("field-rule-width"))})`,_e=(i,e)=>`
    border-top-color: ${i};
    border-right-color: ${i};
    border-left-color: ${i};
    border-bottom-color: ${e};`,K=()=>`
    border-style: solid;
    border-top-width: ${x("field-border-width",$("field-border-width"))};
    border-right-width: ${x("field-border-width",$("field-border-width"))};
    border-left-width: ${x("field-border-width",$("field-border-width"))};
    border-bottom-width: ${Qs};
    ${_e(x("field-border",$("field-border")),x("field-rule",$("field-rule")))}
    border-radius: ${x("field-radius",$("field-radius"))};
    padding: ${x("field-padding-y",$("field-padding-y"))} ${x("field-padding-x",$("field-padding-x"))};
    background: ${x("field-bg",$("field-bg"))};
    color: ${I("text")};
    font-family: ${I("font-ui")};
    font-size: ${x("field-font-size",$("field-font-size"))};
    line-height: ${x("field-line-height",$("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${I("dur-fast")} ${I("ease-standard")},
        box-shadow ${I("dur-fast")} ${I("ease-standard")},
        background ${I("dur-fast")} ${I("ease-standard")};
    &::placeholder { color: ${I("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${_e(x("field-focus-border",$("field-focus-border")),x("field-focus-border",$("field-focus-border")))}
        background: ${x("field-bg-focus",$("field-bg-focus"))};
        box-shadow: 0 0 0 ${x("field-focus-ring-width",$("field-focus-ring-width"))} ${x("field-focus-ring",$("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${_e(x("field-invalid-border",$("field-invalid-border")),x("field-invalid-rule",$("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${_e(x("field-invalid-border",$("field-invalid-border")),x("field-invalid-rule",$("field-invalid-rule")))}
        background: ${x("field-bg-focus",$("field-bg-focus"))};
        box-shadow: 0 0 0 ${x("field-focus-ring-width",$("field-focus-ring-width"))} ${x("field-invalid-ring",$("field-invalid-ring"))};
    }
`,Xs=()=>`
    display: block;
    font-family: ${I("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${I("text-muted")};
`,z=i=>`
    background: ${I("surface")};
    border: 1px solid ${I("border")};
    border-radius: ${I("radius-md")};
    box-shadow: ${I("shadow-1")};
    ${i?.hover?`
    transition:
        box-shadow ${I("dur-base")} ${I("ease-standard")},
        border-color ${I("dur-base")} ${I("ease-standard")};
    &:hover { box-shadow: ${I("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${Xs()}
        margin: 0 0 ${l("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${I("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${I("text")};
    }
    & .ui-card__meta {
        margin: ${l("xs")} 0 0 0;
        font-family: ${I("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${I("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${l("md")};
        font-family: ${I("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${I("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;function Js(i){return{async me(){return g({method:"GET",url:`${i}/players/me`})},async register(e){return g({method:"POST",url:`${i}/players/register`,body:e})},async updateHandicap(e){return g({method:"POST",url:`${i}/players/me/handicap`,body:e})},async myHandicapHistory(){return g({method:"GET",url:`${i}/players/me/handicap-history`})},async updateProfile(e){return g({method:"POST",url:`${i}/players/me/profile`,body:e})},async search(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/players/search${s?"?"+s:""}`})}}}function Zs(i){return{async list(){return g({method:"GET",url:`${i}/friends`})},async add(e){return g({method:"POST",url:`${i}/friends`,body:e})},async remove(e){return g({method:"DELETE",url:`${i}/friends/${e.friendId}`})}}}function en(i){return{async list(){return g({method:"GET",url:`${i}/clubs`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/clubs/get${s?"?"+s:""}`})},async create(e){return g({method:"POST",url:`${i}/clubs`,body:e})},async update(e){return g({method:"POST",url:`${i}/clubs/update`,body:e})},async remove(e){return g({method:"DELETE",url:`${i}/clubs/${e.id}`})}}}function tn(i){return{async list(){return g({method:"GET",url:`${i}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/courses/by-club${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/courses/get${s?"?"+s:""}`})},async create(e){return g({method:"POST",url:`${i}/courses`,body:e})},async update(e){return g({method:"POST",url:`${i}/courses/update`,body:e})},async updateHole(e){return g({method:"POST",url:`${i}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/courses/validate${s?"?"+s:""}`})},async remove(e){return g({method:"DELETE",url:`${i}/courses/${e.id}`})}}}function sn(i){return{async listByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/tees/by-course${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/tees/get${s?"?"+s:""}`})},async create(e){return g({method:"POST",url:`${i}/tees`,body:e})},async update(e){return g({method:"POST",url:`${i}/tees/update`,body:e})},async remove(e){return g({method:"DELETE",url:`${i}/tees/${e.id}`})}}}function nn(i){return{async create(e){return g({method:"POST",url:`${i}/guest-players`,body:e})}}}function rn(i){return{async latest(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/handicap/latest${s?"?"+s:""}`})},async history(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/handicap/history${s?"?"+s:""}`})},async record(e){return g({method:"POST",url:`${i}/handicap/record`,body:e})}}}function on(i){return{async list(){return g({method:"GET",url:`${i}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/rounds/balls${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/rounds/get${s?"?"+s:""}`})},async create(e){return g({method:"POST",url:`${i}/rounds`,body:e})},async createFromDraft(e){return g({method:"POST",url:`${i}/rounds/from-draft`,body:e})},async update(e){return g({method:"POST",url:`${i}/rounds/update`,body:e})},async remove(e){return g({method:"DELETE",url:`${i}/rounds/${e.id}`})}}}function an(i){return{async listByRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/score-events/by-round${s?"?"+s:""}`})},async append(e){return g({method:"POST",url:`${i}/score-events`,body:e})}}}function ln(i){return{async forBall(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/scorecards/for-ball${s?"?"+s:""}`})},async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/scorecards/for-round${s?"?"+s:""}`})}}}function dn(i){return{async forRound(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/leaderboards/for-round${s?"?"+s:""}`})}}}function cn(i){return{async create(e){return g({method:"POST",url:`${i}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/friendly-rounds/by-token${s?"?"+s:""}`})},async balls(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/friendly-rounds/balls${s?"?"+s:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/friendly-rounds/scorecard${s?"?"+s:""}`})},async result(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/friendly-rounds/result${s?"?"+s:""}`})},async score(e){return g({method:"POST",url:`${i}/friendly-rounds/score`,body:e})},async setup(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/friendly-rounds/setup${s?"?"+s:""}`})},async editSetup(e){return g({method:"POST",url:`${i}/friendly-rounds/setup`,body:e})},async remove(e){return g({method:"DELETE",url:`${i}/friendly-rounds/${e.token}`})},async finish(e){return g({method:"POST",url:`${i}/friendly-rounds/finish`,body:e})},async reopen(e){return g({method:"POST",url:`${i}/friendly-rounds/reopen`,body:e})},async join(e){return g({method:"POST",url:`${i}/friendly-rounds/join`,body:e})},async leave(e){return g({method:"POST",url:`${i}/friendly-rounds/leave`,body:e})},async claimGuest(e){return g({method:"POST",url:`${i}/friendly-rounds/claim-guest`,body:e})},async claimSeat(e){return g({method:"POST",url:`${i}/friendly-rounds/claim-seat`,body:e})},async releaseSeat(e){return g({method:"POST",url:`${i}/friendly-rounds/release-seat`,body:e})}}}function un(i){return{async myRounds(){return g({method:"GET",url:`${i}/dashboard/my-rounds`})}}}function hn(i){return{async clubs(){return g({method:"GET",url:`${i}/setup/clubs`})},async courses(){return g({method:"GET",url:`${i}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/setup/tees/by-course${s?"?"+s:""}`})},async formats(){return g({method:"GET",url:`${i}/setup/formats`})},async aggregations(){return g({method:"GET",url:`${i}/setup/aggregations`})}}}function pn(i){return{async get(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/competitions/get${s?"?"+s:""}`})},async participants(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/competitions/participants${s?"?"+s:""}`})},async leaderboard(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,o]of Object.entries(e))!t.has(r)&&o!==void 0&&s.set(r,String(o));const n=s.toString();return g({method:"GET",url:`${i}/competitions/${e.id}/leaderboard${n?"?"+n:""}`})},async results(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,o]of Object.entries(e))!t.has(r)&&o!==void 0&&s.set(r,String(o));const n=s.toString();return g({method:"GET",url:`${i}/competitions/${e.id}/results${n?"?"+n:""}`})},async list(){return g({method:"GET",url:`${i}/competitions`})},async create(e){return g({method:"POST",url:`${i}/competitions`,body:e})},async update(e){return g({method:"POST",url:`${i}/competitions/update`,body:e})},async transition(e){return g({method:"POST",url:`${i}/competitions/transition`,body:e})},async createRound(e){const t=new Set(["id"]),s={};for(const[n,r]of Object.entries(e))t.has(n)||(s[n]=r);return g({method:"POST",url:`${i}/competitions/${e.id}/rounds`,body:s})},async applyCut(e){const t=new Set(["id"]),s={};for(const[n,r]of Object.entries(e))t.has(n)||(s[n]=r);return g({method:"POST",url:`${i}/competitions/${e.id}/cut`,body:s})},async finalize(e){const t=new Set(["id"]),s={};for(const[n,r]of Object.entries(e))t.has(n)||(s[n]=r);return g({method:"POST",url:`${i}/competitions/${e.id}/finalize`,body:s})},async addParticipant(e){return g({method:"POST",url:`${i}/competitions/participants/add`,body:e})},async removeParticipant(e){return g({method:"POST",url:`${i}/competitions/participants/remove`,body:e})},async withdrawParticipant(e){return g({method:"POST",url:`${i}/competitions/participants/withdraw`,body:e})}}}function mn(i){return{async myRoles(){return g({method:"GET",url:`${i}/me/roles`})},async adminStats(){return g({method:"GET",url:`${i}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[n,r]of Object.entries(e))r!==void 0&&t.set(n,String(r));const s=t.toString();return g({method:"GET",url:`${i}/admin/rounds${s?"?"+s:""}`})},async adminPlayers(){return g({method:"GET",url:`${i}/admin/players`})},async adminGrantRole(e){return g({method:"POST",url:`${i}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return g({method:"POST",url:`${i}/admin/roles/revoke`,body:e})}}}const D="/tapscore/".replace(/\/+$/,"")+"/api",v={players:Js(D),friends:Zs(D),clubs:en(D),courses:tn(D),tees:sn(D),guestPlayers:nn(D),handicap:rn(D),rounds:on(D),scoreEvents:an(D),scorecards:ln(D),leaderboards:dn(D),friendlyRounds:cn(D),dashboard:un(D),setup:hn(D),competitions:pn(D),admin:mn(D)};function fn(i){return[...i.played?["Played"]:[],...i.created?["Created"]:[]].join(" · ")}function gn(i,e){const t=new Map;for(const s of e)t.set(s.round.id,{round:s.round,token:s.friendlyRound.shareToken,played:!1,created:!0});for(const s of i){const n=t.get(s.round.id);n?n.played=!0:t.set(s.round.id,{round:s.round,token:s.shareToken,played:!0,created:!1})}return[...t.values()].sort((s,n)=>n.round.date.localeCompare(s.round.date)||s.round.id.localeCompare(n.round.id))}function bn(i,e){return i.filter(t=>t.played&&!t.created&&!e.has(t.round.id)).slice().sort((t,s)=>s.round.date.localeCompare(t.round.date)||t.round.id.localeCompare(s.round.id))}function mt(i,e){return i.some(t=>t.round.id===e)?i.filter(t=>t.round.id!==e):i}function F(){try{return globalThis.localStorage??null}catch{return null}}function Ee(i,e,t){return{read(s=F()){if(!s)return e.empty;let n;try{n=s.getItem(i)}catch{return e.empty}if(!n)return e.empty;try{return e.decode(n)}catch{return e.empty}},write(s,n=F()){if(!n)return e.empty;const r=t!==void 0&&Array.isArray(s)?s.slice(0,t):s;try{n.setItem(i,e.encode(r))}catch{}return r}}}function Ke(i){return{decode(e){const t=JSON.parse(e);return Array.isArray(t)?t.filter(i):[]},encode:e=>JSON.stringify(e),get empty(){return[]}}}const yn=500,Ve=Ee("tapscore.seen-rounds.v1",Ke(i=>typeof i=="string"),yn);function Ue(i=F()){return Ve.read(i)}function ft(i=F()){return new Set(Ue(i))}function _n(i,e=F()){if(!e)return[];const t=Ue(e).filter(s=>s!==i);return Ve.write([i,...t],e)}function Wt(i,e=F()){if(!e)return[];const t=Ue(e),s=t.filter(n=>n!==i);return s.length!==t.length&&Ve.write(s,e),s}const vn=50,We=Ee("tapscore.device-rounds.v1",Ke(wn),vn);function Ye(i=F()){return We.read(i)}function wn(i){if(typeof i!="object"||i===null)return!1;const e=i;return typeof e.token=="string"&&typeof e.courseName=="string"&&(e.status==="not_started"||e.status==="active"||e.status==="complete")&&typeof e.lastSeenAt=="string"}function ae(i,e=F()){if(!e)return[];const t=Ye(e).filter(s=>s.token!==i.token);return We.write([i,...t],e)}function Yt(i,e=F()){if(!e)return[];const t=Ye(e),s=t.filter(n=>n.token!==i);return s.length!==t.length&&We.write(s,e),s}class Qe{mine=new p(null);mineLoading=new p(!1);mineError=new p(null);myRounds=new k(()=>{const e=this.mine.get();return e?gn(e.produced,e.created):[]});deviceRounds=new p([]);seenIds=new p(ft());newRounds=new k(()=>bn(this.myRounds.get(),this.seenIds.get()));async loadMine(){this.seenIds.set(ft());const e=await O(this.mineLoading,this.mineError,()=>v.dashboard.myRounds());e&&this.mine.set(e)}loadDevice(){this.deviceRounds.set(Ye())}async remove(e,t){try{await v.friendlyRounds.remove({token:e})}catch{return!1}const s=this.mine.get();return s&&this.mine.set({produced:mt(s.produced,t),created:mt(s.created,t)}),this.deviceRounds.set(Yt(e)),Wt(t),!0}}const xn={DEV:!1};function $n(i,e){return i===void 0||i===""?e:i!=="0"&&i.toLowerCase()!=="false"}const gt=xn??{},Qt={competitions:$n(gt.VITE_FEATURE_COMPETITIONS,!!gt.DEV)},kn=y(`
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
`);class Sn extends N{static styles=`
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
                    background: ${a("accent")};
                    color: ${a("topbar-bg")};
                    font-size: 0.62rem;
                    font-weight: 800;
                    line-height: 1;
                    border-radius: ${a("radius-pill")};

                    &.show { display: inline-flex; }
                }

                &.active { color: ${a("accent")}; }
            }
        }
    `;router=this.inject(R);auth=this.inject(H);landing=this.inject(Qe);newCount=new k(()=>this.auth.currentUser.get()?this.landing.newRounds.get().length:0);render(){const e=this.wire(kn,{root:{className:()=>{const t=this.router.route.get();return!this.auth.currentUser.get()||t==="/login"||t==="/round"?"tabbar hidden":"tabbar"}},homeLink:this.router.link("/"),badge:{textContent:()=>{const t=this.newCount.get();return t===0?"":String(t)},className:()=>this.newCount.get()===0?"tabbar__badge":"tabbar__badge show"},friendsLink:this.router.link("/friends"),compsLink:this.router.link("/competitions"),profileLink:this.router.link("/profile")});return Qt.competitions||this.ref(e,"compsLink").remove(),e}}const it=class it extends N{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(E(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};it.styles=`
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
    `;let Be=it;const C=i=>`var(--${i})`,rt=class rt extends N{render(){const e=document.createElement("div"),t=(c,h)=>{typeof h=="function"?this.track(E(()=>{c.textContent=h()})):c.textContent=h};this.spawn(Be,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const s=document.createElement("h2");s.className="ui-confirm__title",t(s,this.props.title??"Confirm"),this.dialogEl.appendChild(s);const n=document.createElement("p");n.className="ui-confirm__message",t(n,this.props.message),this.dialogEl.appendChild(n);const r=document.createElement("div");r.className="ui-confirm__actions";const o=document.createElement("button");o.className="ui-confirm__btn ui-confirm__btn--cancel",t(o,this.props.cancelLabel??"Cancel"),o.addEventListener("click",c=>{c.stopPropagation(),this.handleCancel()}),r.appendChild(o);const d=document.createElement("button");return d.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(d,this.props.confirmLabel??"Confirm"),d.addEventListener("click",c=>{c.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),r.appendChild(d),this.dialogEl.appendChild(r),this.dialogEl.addEventListener("click",c=>c.stopPropagation()),e.appendChild(this.dialogEl),this.track(E(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};rt.styles=`
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${C("surface")};
            border: 1px solid ${C("border")};
            border-radius: ${C("radius-md")};
            box-shadow: ${C("shadow-3")};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition:
                opacity ${C("dur-slow")} ${C("ease-standard")},
                transform ${C("dur-slow")} ${C("ease-standard")};
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
            font-family: ${C("font-display")};
            font-size: 1.25rem;
            font-weight: 500;
            line-height: 1.4;
            color: ${C("text")};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-family: ${C("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${C("text")};
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
            font-family: ${C("font-ui")};
            font-weight: 600;
            border: 1px solid transparent;
            border-radius: ${C("radius-sm")};
            cursor: pointer;
            transition:
                background ${C("dur-fast")} ${C("ease-standard")},
                border-color ${C("dur-fast")} ${C("ease-standard")},
                color ${C("dur-fast")} ${C("ease-standard")},
                box-shadow ${C("dur-fast")} ${C("ease-standard")};
        }
        .ui-confirm__btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px ${C("accent-soft")};
        }
        .ui-confirm__btn--cancel {
            background: transparent;
            color: ${C("text-muted")};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${C("accent-soft")};
            color: ${C("accent")};
        }
        .ui-confirm__btn--confirm {
            background: ${C("accent")};
            color: ${C("on-accent")};
            border-color: ${C("accent")};
            box-shadow: ${C("shadow-1")};
        }
        .ui-confirm__btn--confirm:hover {
            background: ${C("accent-strong")};
            border-color: ${C("accent-strong")};
        }
        /* Outline, filling only on hover — same reasoning as css.ts danger. */
        .ui-confirm__btn--danger {
            background: transparent;
            color: ${C("danger")};
            border-color: ${C("danger")};
        }
        .ui-confirm__btn--danger:hover {
            background: ${C("danger")};
            color: ${C("on-danger")};
        }
    `;let V=rt;class Xe{roles=new p([]);rolesLoaded=!1;loading=new p(!1);error=new p(null);stats=new p(null);rounds=new p([]);players=new p([]);isSuperAdmin(){return this.roles.get().some(e=>e.role==="super_admin"&&e.scopeType===null)}async loadRoles(e=!1){if(!(!e&&this.rolesLoaded)){this.rolesLoaded=!0;try{this.roles.set(await v.admin.myRoles())}catch{this.roles.set([])}}}clear(){this.roles.set([]),this.rolesLoaded=!1,this.stats.set(null),this.rounds.set([]),this.players.set([]),this.error.set(null)}async load(e=!1){if(!e&&this.stats.get()!==null)return;const t=await O(this.loading,this.error,()=>Promise.all([v.admin.adminStats(),v.admin.adminRounds({limit:100}),v.admin.adminPlayers()]));if(!t)return;const[s,n,r]=t;this.stats.set(s),this.rounds.set(n),this.players.set(r)}}function Cn(i){const e=typeof navigator<"u"?navigator.language:void 0;return typeof e=="string"&&e.toLowerCase().startsWith("sv")?"sv":"en"}function ne(){return Cn()}const Se=10;class pe{loading=new p(!1);error=new p(null);descriptors=new p([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await O(this.loading,this.error,()=>v.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=ne()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:s.teamSize?.min??2,max:s.teamSize?.max??2},...s.teamCount?{teamCount:s.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}configLabelOf(e,t=ne()){return e.labels?.[t]??e.labels?.en??""}presets(e=ne()){return this.descriptors.get().filter(s=>s.preset).sort((s,n)=>{const r=s.preset?.rank??Number.POSITIVE_INFINITY,o=n.preset?.rank??Number.POSITIVE_INFINITY;return r!==o?r-o:(this.labelOf(s,e)??s.id).localeCompare(this.labelOf(n,e)??n.id)})}taglineOf(e,t=ne()){const n=(typeof e=="string"?this.byId(e):e)?.preset?.tagline;return n?.[t]??n?.en??""}playableShape(e){const t=e.requirements.balls;if(t.ballMode==="team")return{count:this.ballCountOf(t.slotBallCount),size:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{},n=s.teamCount??{};return{count:{min:n.min??2,...n.max!==void 0?{max:n.max}:{}},size:{min:s.teamSize?.min??2,max:s.teamSize?.max??2}}}if(t.slotBallCount){const s=this.acceptsSideSubjects(e);return{count:this.ballCountOf(t.slotBallCount),size:{min:1,max:s?Se:1}}}return{count:{min:1},size:{min:1,max:1}}}ballCountOf(e){return{min:e?.min??2,...e?.max!==void 0?{max:e.max}:{}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}acceptsSideSubjects(e){const t=typeof e=="string"?this.byId(e):e;return!t||this.classify(t).kind==="team_grouping"?!1:(t.requirements.scoreEntry?.metadata?.length??0)===0}}function Xt(i){const e=A.get(pe);return e.load(),e.labelOf(i.formatId)??`${i.scoringMode} · ${i.teamShape}`}function Tn(i){return i.map(e=>({key:e.round.id,token:e.token,roundId:e.round.id,courseName:e.round.courseNameSnapshot??"",status:e.round.status,completedAt:e.round.completedAt,lastActivityAt:e.round.date,roleLabel:fn(e)||null,date:e.round.date,formats:e.round.formatSlots.map(Xt).join(" · ")}))}function In(i){return i.map(e=>({key:e.token,token:e.token,roundId:null,courseName:e.courseName,status:e.status,completedAt:e.completedAt??null,lastActivityAt:e.lastSeenAt,roleLabel:null,date:null,formats:null}))}const ce={fromMyRounds:Tn,fromDeviceRounds:In},En=14,Nn=1440*60*1e3;function re(i,e){return e(i)}function Pn(i,e,t,s=En){const n=e-s*Nn,r=[],o=[];for(const d of i){const c=re(d,t);if(c.status==="complete"){const h=c.completedAt?Date.parse(c.completedAt):NaN;(Number.isNaN(h)||h>=n)&&o.push(d)}else r.push(d)}return r.sort((d,c)=>bt(re(d,t).lastActivityAt,re(c,t).lastActivityAt)),o.sort((d,c)=>bt(re(d,t).completedAt,re(c,t).completedAt)),{ongoing:r,finished:o}}function bt(i,e){const t=i?Date.parse(i):NaN,s=e?Date.parse(e):NaN,n=Number.isNaN(t)?Number.NEGATIVE_INFINITY:t,r=Number.isNaN(s)?Number.NEGATIVE_INFINITY:s;return n===r?0:r-n}const zn=y(`
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
        <button bind="admin" class="landing__admin" type="button">Admin — all rounds</button>
        <button bind="signin" class="landing__signin" type="button">Sign in</button>
        <div bind="confirmHost"></div>
    </div>
`),On='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',jn=y(`
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
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${On}</button>
    </div>
`),Jt={not_started:"Not started",active:"Live",complete:"Finished"};class yt extends N{static styles=`
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
                ${S()}
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
                background: ${a("primary")};
                color: ${a("primary-text")};
                border: none;
                box-shadow: ${a("shadow-elevated")};
                &:hover { background: ${a("primary")}; }

                & .landing__create-plus { font-size: 1.4rem; line-height: 1; }
            }

            & .landing__section-block {
                margin-bottom: ${l("xl")};
                &.hidden { display: none; }
            }

            /* The "New — you were added" strip reads as a highlight: its count
               is an accent pill so a fresh add draws the eye at the top. */
            & .landing__new-count {
                background: ${a("accent-soft")};
                color: ${a("accent")};
                font-weight: 700;
                border-radius: ${a("radius-pill")};
                padding: 1px 9px;
                font-size: 0.8rem;
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

            & .round-row__role {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: ${a("accent")};
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
                ${z({hover:!0})}

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
                    color: ${a("text-muted")};
                    cursor: pointer;
                    border-radius: 0 ${a("radius")} ${a("radius")} 0;

                    & svg { width: 17px; height: 17px; }
                    &:hover, &:active { color: ${a("error")}; }
                    &:focus-visible { outline: 2px solid ${a("error")}; outline-offset: -2px; }
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
                color: ${a("accent")};
                cursor: pointer;

                &.hidden { display: none; }
            }

            /* Operator shortcut, super admins only. Sits under "See all rounds"
               as its cross-player counterpart; the gate is the server. */
            & .landing__admin {
                display: block;
                margin: ${l("xs")} auto 0;
                padding: ${l("sm")} ${l("lg")};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 700;
                color: ${a("text-muted")};
                cursor: pointer;

                &.hidden { display: none; }
            }

            & .landing__signin {
                display: block;
                &.hidden { display: none; }
                margin: ${l("lg")} auto 0;
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

        /* App-level accessibility override for the framework confirm dialog. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;svc=this.inject(Qe);auth=this.inject(H);admins=this.inject(Xe);router=this.inject(R);loggedIn=new k(()=>this.auth.currentUser.get()!==null);rows=new k(()=>this.loggedIn.get()?ce.fromMyRounds(this.svc.myRounds.get()):ce.fromDeviceRounds(this.svc.deviceRounds.get()));parts=new k(()=>Pn(this.rows.get(),Date.now(),e=>e));ongoing=new k(()=>this.parts.get().ongoing);finished=new k(()=>this.parts.get().finished);newRows=new k(()=>this.loggedIn.get()?ce.fromMyRounds(this.svc.newRounds.get()):[]);deleteOpen=new p(!1);deleteTarget=new p(null);askDelete(e,t,s){this.deleteTarget.set({token:e,roundId:t,name:s}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?(this.svc.loadMine(),this.admins.loadRoles()):this.svc.loadDevice();const e=()=>this.rows.get().length>0,t=this.wire(zn,{createBtn:{onclick:()=>this.router.navigate("/create")},signin:{className:()=>this.loggedIn.get()?"landing__signin hidden":"landing__signin",onclick:()=>this.router.navigate("/login")},history:{className:()=>e()?"landing__history":"landing__history hidden",onclick:()=>this.router.navigate("/history")},admin:{className:()=>this.admins.isSuperAdmin()?"landing__admin":"landing__admin hidden",onclick:()=>this.router.navigate("/admin")},newSection:{className:()=>this.newRows.get().length>0?"landing__section-block landing__new":"landing__section-block landing__new hidden"},newCount:()=>{const n=this.newRows.get().length;return n===0?"":String(n)},ongoingSection:{className:()=>this.ongoing.get().length>0?"landing__section-block":"landing__section-block hidden"},ongoingCount:()=>{const n=this.ongoing.get().length;return n===0?"":String(n)},finishedSection:{className:()=>this.finished.get().length>0?"landing__section-block":"landing__section-block hidden"},finishedCount:()=>{const n=this.finished.get().length;return n===0?"":String(n)},empty:{className:()=>e()?"landing__empty hidden":"landing__empty"}});this.$each(this.ref(t,"newList"),this.newRows,(n,r,o)=>this.roundRow(n,o),n=>n.key),this.$each(this.ref(t,"ongoingList"),this.ongoing,(n,r,o)=>this.roundRow(n,o),n=>n.key),this.$each(this.ref(t,"finishedList"),this.finished,(n,r,o)=>this.roundRow(n,o),n=>n.key),this.spawn(V,this.ref(t,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const n=this.deleteTarget.get();return`Delete ${n?`“${n.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const n=this.deleteTarget.get();n&&this.svc.remove(n.token,n.roundId)}});const s=n=>{n.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",s),this.track(()=>window.removeEventListener("keydown",s)),t}roundRow(e,t){return this.wireEl(jn,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},course:()=>e.courseName||"Round",role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>Jt[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>e.date??"",formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",e.courseName||"this round")}}},t)}}function Rn(i){return[...i].sort((e,t)=>{const s=_t(e),n=_t(t);return n!==s?n-s:e.key.localeCompare(t.key)})}function _t(i){const e=i.completedAt??i.lastActivityAt,t=e?Date.parse(e):NaN;return Number.isNaN(t)?Number.NEGATIVE_INFINITY:t}const Ln=y(`
    <div class="history">
        <button bind="back" class="history__back" type="button">← Home</button>
        <h1 class="history__title">All rounds</h1>
        <div bind="empty" class="history__empty">No rounds yet — create one to tee off.</div>
        <div bind="list" class="history__list"></div>
        <div bind="confirmHost"></div>
    </div>
`),Dn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',An=y(`
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
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${Dn}</button>
    </div>
`);class Hn extends N{static styles=`
        .history {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .history__back {
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

            & .history__title {
                margin: 0 0 ${l("lg")};
                font-family: ${a("font-display")};
                font-weight: 600;
                font-size: 1.8rem;
                letter-spacing: -0.02em;
                color: ${a("text")};
            }

            & .history__empty {
                color: ${a("text-muted")};
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
                ${z({hover:!0})}

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
                    color: ${a("text-muted")};
                    cursor: pointer;
                    border-radius: 0 ${a("radius")} ${a("radius")} 0;

                    & svg { width: 17px; height: 17px; }
                    &:hover, &:active { color: ${a("error")}; }
                    &:focus-visible { outline: 2px solid ${a("error")}; outline-offset: -2px; }
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
                    color: ${a("text")};
                }
                & .round-row__role {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: ${a("accent")};
                    flex-shrink: 0;
                    &.hidden { display: none; }
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
    `;svc=this.inject(Qe);auth=this.inject(H);router=this.inject(R);loggedIn=new k(()=>this.auth.currentUser.get()!==null);rows=new k(()=>Rn(this.loggedIn.get()?ce.fromMyRounds(this.svc.myRounds.get()):ce.fromDeviceRounds(this.svc.deviceRounds.get())));deleteOpen=new p(!1);deleteTarget=new p(null);askDelete(e,t,s){this.deleteTarget.set({token:e,roundId:t,name:s}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?this.svc.loadMine():this.svc.loadDevice();const e=this.wire(Ln,{back:{onclick:()=>this.router.navigate("/")},empty:{className:()=>this.rows.get().length===0?"history__empty":"history__empty hidden"}});this.$each(this.ref(e,"list"),this.rows,(s,n,r)=>this.roundRow(s,r),s=>s.key),this.spawn(V,this.ref(e,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const s=this.deleteTarget.get();return`Delete ${s?`“${s.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const s=this.deleteTarget.get();s&&this.svc.remove(s.token,s.roundId)}});const t=s=>{s.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t)),e}roundRow(e,t){return this.wireEl(An,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},course:()=>e.courseName||"Round",role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>Jt[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>e.date??"",formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",e.courseName||"this round")}}},t)}}function Zt(i){return i.handicapIndex*(i.slope/113)+(i.courseRating-i.par)}function Mn(i){return Math.round(Zt(i))}function Fn(i,e,t){const s=t;if(s<=0)return 0;if(i>=0){const c=Math.floor(i/s),h=i-c*s;return c+(e>=1&&e<=h?1:0)}const n=-i,r=Math.floor(n/s),o=n-r*s,d=r+(e>s-o?1:0);return d===0?0:-d}const Bn=180,vt=4,Gn=12;function ie(i,e){return e<=0?0:Math.max(0,Math.min(e-1,i))}function qn(i){const{dragDistance:e,velocity:t,itemWidth:s}=i;if(Math.abs(e)<Gn)return 0;const n=e+t*Bn,r=Math.round(-n/s);return Math.max(-vt,Math.min(vt,r))}const wt="tapscore:pending-scores:v1",Kn=336*60*60*1e3,xt=200;function Vn(){try{return globalThis.localStorage??null}catch{return null}}function Un(i){if(typeof i!="object"||i===null)return!1;const e=i;return typeof e.token=="string"&&typeof e.ballId=="string"&&typeof e.playHoleId=="string"&&(typeof e.strokes=="number"||e.strokes===null)&&(e.eventType==="score_entered"||e.eventType==="score_cleared")&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class Wn{entries=[];storage;constructor(e=Vn(),t=Date.now()){this.storage=e,this.entries=this.load();const s=this.applyHygiene(t);s.length!==this.entries.length&&(this.entries=s,this.persist())}enqueue(e){const t=this.entries.findIndex(s=>s.token===e.token&&s.ballId===e.ballId&&s.playHoleId===e.playHoleId);t>=0?this.entries[t]=e:this.entries.push(e),this.entries=this.applyHygiene(e.queuedAt),this.persist()}remove(e){const t=this.entries.filter(s=>s.clientEventId!==e);t.length!==this.entries.length&&(this.entries=t,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(s=>e-s.queuedAt<=Kn);return t.length>xt?t.slice(t.length-xt):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(wt);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(Un):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(wt,JSON.stringify(this.entries))}catch{}}}const Yn=50;function Qn(i){if(typeof i!="object"||i===null)return!1;const e=i;return typeof e.token=="string"&&typeof e.cursor=="string"}const Je=Ee("tapscore.result-cursors.v1",Ke(Qn),Yn);function Ze(i=F()){return Je.read(i)}function Xn(i,e=F()){return Ze(e).find(t=>t.token===i)?.cursor??null}function Jn(i,e,t=F()){if(!t)return[];const s=Ze(t).filter(n=>n.token!==i);return Je.write([{token:i,cursor:e},...s],t)}function Zn(i,e=F()){if(!e)return[];const t=Ze(e),s=t.filter(n=>n.token!==i);return s.length!==t.length&&Je.write(s,e),s}const ei=["1st","2nd","3rd","4th","5th","6th","7th","8th"],X=(i,e)=>`${i}|${e}`;function es(i){return i.players.map(e=>e.displayName).join(" & ")||i.label||"Ball"}function ti(i,e,t){return i?!(i.minPar!==void 0&&e<i.minPar||i.maxPar!==void 0&&e>i.maxPar||i.pars&&!i.pars.includes(e)||i.holes&&!i.holes.includes(t)):!0}class te{constructor(e=new Wn){this.queue=e}queue;loading=new p(!1);error=new p(null);friendlyRound=new p(null);round=new p(null);startList=new p(null);balls=new p([]);scorecards=new p([]);cells=new p(new Map);result=new p(null);resultLoading=new p(!1);resultError=new p(null);resultCursor=null;holeIdx=new p(0);groupIdx=new p(0);keypadOpen=new p(!1);selectedSlot=new p(null);token=null;loadSeq=0;resultSeq=0;flushing=!1;pendingSlotIndex=null;async loadByToken(e,t){const s=e!==this.token;this.token=e;const n=++this.loadSeq;s&&this.resetForNewToken(t),A.get(pe).load();const r=await O(this.loading,this.error,()=>v.friendlyRounds.byToken({token:e}));if(!r||n!==this.loadSeq||e!==this.token)return;if(this.friendlyRound.set(r.friendlyRound),this.round.set(r.round),this.startList.set(r.startList),ae({token:e,courseName:r.round.courseNameSnapshot??"",status:r.round.status,completedAt:r.round.completedAt,lastSeenAt:new Date().toISOString()}),A.get(H).currentUser.get()&&_n(r.round.id),this.pendingSlotIndex!==null){const h=r.round.formatSlots[this.pendingSlotIndex]?.slotDefId??null;this.pendingSlotIndex=null,h!==null&&this.selectedSlot.set(h)}const[o,d]=await Promise.all([v.friendlyRounds.balls({token:e}).catch(()=>[]),v.friendlyRounds.scorecard({token:e}).catch(()=>[])]);n!==this.loadSeq||e!==this.token||(this.cells.set(new Map),this.scorecards.set(d),this.balls.set(o),await this.flushPending())}deleting=new p(!1);async deleteRound(){const e=this.token;if(!e||this.deleting.get())return!1;this.deleting.set(!0);try{await v.friendlyRounds.remove({token:e}),Yt(e);const t=this.round.get()?.id;return t&&Wt(t),Zn(e),!0}catch{return!1}finally{this.deleting.set(!1)}}finishing=new p(!1);async finishRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await v.friendlyRounds.finish({token:e}),s=this.round.get();return e===this.token&&s&&(this.round.set({...s,status:t.status,completedAt:t.completedAt}),ae({token:e,courseName:s.courseNameSnapshot??"",status:t.status,completedAt:t.completedAt,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async reopenRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await v.friendlyRounds.reopen({token:e}),s=this.round.get();return e===this.token&&s&&(this.round.set({...s,status:t.status,completedAt:null}),ae({token:e,courseName:s.courseNameSnapshot??"",status:t.status,completedAt:null,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async loadResult(){const e=this.token;if(!e)return;const t=++this.resultSeq,s=await O(this.resultLoading,this.resultError,()=>v.friendlyRounds.result({token:e}));t!==this.resultSeq||e!==this.token||s&&(this.setResultCursor(e,s.cursor),s.unchanged||this.result.set(s.result))}persistedCursor(e=this.token){return e?Xn(e):null}setResultCursor(e,t){const s=t!==null&&t!==this.resultCursor;this.resultCursor=t,s&&Jn(e,t)}async pollResult(){const e=this.token;if(!e)return;const t=++this.resultSeq;let s;try{s=await v.friendlyRounds.result({token:e,...this.resultCursor!==null?{cursor:this.resultCursor}:{}})}catch{return}t!==this.resultSeq||e!==this.token||(this.setResultCursor(e,s.cursor),s.unchanged||this.result.set(s.result))}onLiveResultEvent(e){const t=this.token,s=this.round.get();if(t&&s&&e.status!==s.status){const n=e.status==="complete"?new Date().toISOString():null;this.round.set({...s,status:e.status,completedAt:n}),ae({token:t,courseName:s.courseNameSnapshot??"",status:e.status,completedAt:n,lastSeenAt:new Date().toISOString()})}this.pollResult()}ballNameById=new k(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,es(t));for(const t of this.result.get()?.slots??[])for(const s of t.subjectLabels??[])e.set(s.ballId,s.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}isPending(e){return this.balls.get().find(t=>t.id===e)?.pending===!0}groupLabelByBallId=new k(()=>{const e=new Map,t=this.groups();return t.length<2||t.forEach((s,n)=>{for(const r of s.ballIds)e.set(r,`Group ${n+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}selectedSlotDefId(){const e=this.round.get()?.formatSlots??[];if(e.length===0)return null;const t=this.selectedSlot.get();return t!==null&&e.some(s=>s.slotDefId===t)?t:e[0]?.slotDefId??null}selectSlot(e){this.selectedSlot.set(e)}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return ie(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),s=t?.playHoles.find(o=>o.id===e);if(!t||!s)return"";const n=t.playHoles.filter(o=>o.courseHoleNumber===s.courseHoleNumber).sort((o,d)=>o.ordinal-d.ordinal);if(n.length===1)return`${s.courseHoleNumber}`;const r=n.findIndex(o=>o.id===e);return`${s.courseHoleNumber} (${ei[r]??`${r+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(ie(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(ie(this.holeIndex()+1,this.playedOrder().length))}strokesFor(e,t){const s=this.cells.get().get(X(e,t));return s?s.strokes:this.scorecards.get().find(o=>o.ballId===e)?.holes.find(o=>o.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(X(e,t))?.status??null}strokesHintFor(e,t){const s=this.round.get();if(!s)return null;const n=this.balls.get().find(m=>m.id===e);if(!n||n.pending)return null;const r=this.selectedSlotDefId(),d=(n.slots.find(m=>m.slotDefId===r)??n.slots[0])?.playingHandicap;if(d==null)return null;const c=this.playHoleById(t);if(!c)return null;const h=n.players[0]?.teeName??null,f=c.tees.find(m=>m.teeName===h)?.strokeIndex??c.baseStrokeIndex;return Fn(d,f,s.routeSi.allocationCycleSize)}metadataFor(e,t,s){const n=this.cells.get().get(X(e,t));return n&&n.metadata!==void 0?n.metadata?.[s]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[s]}metadataInputs(){const e=A.get(pe),t=this.round.get()?.formatSlots??[],s=[],n=new Set;for(const r of t){const o=e.byId(r.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of o)n.has(d.key)||(n.add(d.key),s.push(d))}return s}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>ti(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,s,n){const r=X(e,t),o=crypto.randomUUID();this.patchCell(r,{strokes:s,metadata:n,status:"saving",clientEventId:o});const d=this.token;d&&(this.enqueue(d,e,t,s,n,o),await this.post(d,e,t,s,n,o))}async retry(e,t){const s=X(e,t),n=this.cells.get().get(s);if(!n)return;this.patchCell(s,{...n,status:"saving"});const r=this.token;r&&(this.enqueue(r,e,t,n.strokes,n.metadata,n.clientEventId),await this.post(r,e,t,n.strokes,n.metadata,n.clientEventId))}async flushPending(){const e=this.token;if(!(!e||this.flushing)){this.flushing=!0;try{for(const t of this.queue.entriesFor(e)){if(e!==this.token)return;this.patchCell(X(t.ballId,t.playHoleId),{strokes:t.strokes,metadata:t.metadata,status:"saving",clientEventId:t.clientEventId}),await this.post(e,t.ballId,t.playHoleId,t.strokes,t.metadata,t.clientEventId)}}finally{this.flushing=!1}}}enqueue(e,t,s,n,r,o){this.queue.enqueue({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:o,...r!==void 0?{metadata:r}:{},queuedAt:Date.now()})}async post(e,t,s,n,r,o){const d=X(t,s);try{await v.friendlyRounds.score({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:o,...r!=null?{metadata:r}:{}}),this.queue.remove(o);const c=this.cells.get().get(d);c&&c.clientEventId===o&&this.patchCell(d,{...c,status:"saved"});const h=this.round.get();e===this.token&&h&&h.status==="not_started"&&this.round.set({...h,status:"active"})}catch{const c=this.cells.get().get(d);c&&c.clientEventId===o&&this.patchCell(d,{...c,status:"error"})}}patchCell(e,t){const s=new Map(this.cells.get());s.set(e,t),this.cells.set(s)}resetForNewToken(e){this.resultSeq++,this.resultCursor=null,this.friendlyRound.set(null),this.round.set(null),this.startList.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(e?.holeIdx??0),this.groupIdx.set(e?.groupIdx??0),this.keypadOpen.set(!1);const t=e?.selectedSlot;this.pendingSlotIndex=null,typeof t=="string"?this.selectedSlot.set(t):typeof t=="number"?(this.pendingSlotIndex=t,this.selectedSlot.set(null)):this.selectedSlot.set(null)}}const si=700;function ni(i){if(!i.currentHole)return!1;const e=i.balls.filter(t=>!t.pending);return e.length>0&&e.every(t=>t.scored)}function ii(i){return i.currentHole?i.balls.some((e,t)=>t!==i.currentBallIndex&&!e.scored):!1}function ze(i){const e=i.currentHole;if(!e)return{kind:"noop"};const t=i.balls,s=i.currentBallIndex;for(let n=s+1;n<t.length;n++)if(!t[n].scored)return{kind:"moveToBall",ballIndex:n};for(let n=0;n<s;n++)if(!t[n].scored)return{kind:"moveToBall",ballIndex:n};return i.holeIndex>=i.holeCount-1?{kind:"roundComplete",toast:"Round complete"}:{kind:"holeComplete",toast:`Hole ${e.label} done`,fromHoleId:e.id,toHoleIndex:i.holeIndex+1,delayMs:si}}function ri(i,e){const t=i.currentHole;if(e.kind==="statsDone")return i.holeCompleteOnEntry?{write:null,move:{kind:"stay"}}:{write:null,move:ze(i)};const s=i.balls[i.currentBallIndex];if(!t||!s)return{write:null,move:{kind:"noop"}};if(s.pending)return i.holeCompleteOnEntry?{write:null,move:{kind:"stay"}}:{write:null,move:ze(i)};const n={ballIndex:i.currentBallIndex,holeId:t.id,value:e.value,withMetadata:e.value!==null};return e.value!==null&&e.value>0&&i.collectsStats?{write:n,move:{kind:"openStats"}}:i.holeCompleteOnEntry?{write:n,move:{kind:"stay"}}:{write:n,move:ze(i)}}const J=60,$t=8,Ge=4,oi=Array.from({length:Ge*2+1},(i,e)=>e-Ge),ai="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",li=y(`
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
`),di=y(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),kt=y(`
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
`),ci=y(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),St=y(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),ui=y(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`);class hi extends N{static styles=`
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
            right: ${$t}px;
            width: ${J*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-Ge*J}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${J}px;
            width: ${J}px;
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

            & .se-row__scores { display: flex; align-items: center; padding-right: ${$t}px; flex-shrink: 0; }
            & .se-row__slot { width: ${J}px; display: flex; align-items: center; justify-content: center; }
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
                /* Handicap hint in an unscored circle ("-1"/"0"/"+1") — smaller
                   and quieter than a real score, so it reads as a preview. */
                &.hint { font-size: 0.95rem; opacity: 0.8; }
            }
            /* Phase 5.5 — unclaimed placeholder seat: muted label, inert circle. */
            & .se-row__name--pending { color: ${a("text-muted")}; font-style: italic; }
            & .se-row__circle--pending { cursor: default; opacity: 0.55; &:active { background: ${a("surface-sunken")}; } }
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
    `;svc=this.inject(te);holeIdx=this.svc.holeIdx;modalOpen=this.svc.keypadOpen;currentBallIdx=new p(0);holeCompleteOnEntry=!1;extendedOpen=new p(!1);extendedScore=new p(10);statsOpen=new p(!1);pendingMeta=new p({});lastMetaKey=null;toastMsg=new p(null);dragOffset=new p(0);transitioning=new p(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new k(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[ie(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(s=>[s.id,s]));return e.ballIds.map(s=>t.get(s)).filter(s=>!!s)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>es(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);hintText=(e,t)=>{const s=this.svc.strokesHintFor(e,t);return s===null?null:s===0?"0":s>0?`-${s}`:`+${-s}`};toParValue=e=>{let t=0,s=0,n=!1;for(const r of this.playedOrder()){const o=this.svc.strokesFor(e.id,r.playHoleId);o!==null&&o>0&&(t+=o,s+=this.parFor(r.playHoleId),n=!0)}return n?t-s:null};toParText=e=>{const t=this.toParValue(e);return t===null?"–":t===0?"E":t>0?`+${t}`:`${t}`};toParClass=e=>{const t=this.toParValue(e);return`se-row__topar ${t===null||t===0?"even":t<0?"under":"over"}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const s=e-t;return s<=-4||s>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(s)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer),this.modalOpen.set(!1)}),this.track(E(()=>{const r=this.ballsInGroup().length;r>0&&this.currentBallIdx.get()>=r&&this.currentBallIdx.set(0)}));const e=this.wire(li,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1)}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const r=this.currentHole();return r?`Hole ${this.occLabel(r.playHoleId)} · Par ${this.parFor(r.playHoleId)}`:""},modalPrev:{onclick:()=>this.stepHole(-1),disabled:()=>!this.svc.canPrevHole()},modalNext:{onclick:()=>this.stepHole(1),disabled:()=>!this.svc.canNextHole()},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>this.statsOpen.set(!1)},statsHole:()=>{const r=this.currentHole();return r?`Hole ${this.occLabel(r.playHoleId)} · Par ${this.parFor(r.playHoleId)}`:""},statsTitle:()=>{const r=this.ballsInGroup()[this.currentBallIdx.get()];return r?this.ballName(r):""},statsScore:()=>{const r=this.ballsInGroup()[this.currentBallIdx.get()],o=this.currentHole();return!r||!o?"":this.displayScore(this.svc.strokesFor(r.id,o.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.apply({kind:"statsDone"})}}}),t=this.ref(e,"viewport"),s=this.ref(e,"track");this.bindCarouselPointer(t,s),this.track(E(()=>{s.style.transition=this.transitioning.get()?ai:"none",s.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(s,new k(()=>oi),(r,o,d)=>this.holeItem(r,d),r=>r),this.$each(this.ref(e,"rows"),new k(()=>{const r=this.playedOrder(),o=this.holeIndex(),d=r[o];if(!d)return[];const c=o>0?r[o-1].playHoleId:null;return this.ballsInGroup().map(h=>({ball:h,ph:d.playHoleId,prevPh:c}))}),(r,o,d)=>this.playerRow(r.ball,r.ph,r.prevPh,d),r=>`${r.ball.id}|${r.ph}`),this.$each(this.ref(e,"modalList"),new k(()=>this.ballsInGroup()),(r,o,d)=>this.modalRow(r,o,d),r=>r.id);const n=this.ref(e,"keys");for(const r of[1,2,3,4,5,6,7,8,9])n.appendChild(this.numberKey(r));return n.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),n.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),n.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(e,"statsBody"),new k(()=>this.metaInputs()),(r,o,d)=>this.metaChip(r,d),r=>r.key),this.track(E(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null;return}const r=this.ballsInGroup()[this.currentBallIdx.get()],o=this.currentHole();if(!r||!o)return;const d=`${r.id}|${o.playHoleId}`;if(d===this.lastMetaKey)return;this.lastMetaKey=d;const c={};for(const h of this.metaInputs())c[h.key]=this.svc.metadataFor(r.id,o.playHoleId,h.key)===!0;this.pendingMeta.set(c)})),e}holeItem(e,t){return this.wireEl(di,{item:{className:()=>{const s=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${s?" gone":""}`}},hnum:{textContent:()=>{const s=this.occAtOffset(e);return s?this.occLabel(s.playHoleId):""}},hpar:{textContent:()=>{const s=this.occAtOffset(e);return s?`Par ${this.parFor(s.playHoleId)}`:""}}},t)}playerRow(e,t,s,n){return e.pending?this.wireEl(kt,{name:{textContent:this.ballName(e),className:"se-row__name se-row__name--pending"},topar:{textContent:"open seat",className:"se-row__topar"},prev:{textContent:""},cval:{textContent:"–"},circle:{className:"se-row__circle empty se-row__circle--pending"}},n):this.wireEl(kt,{name:{textContent:this.ballName(e)},topar:{textContent:()=>this.toParText(e),className:()=>this.toParClass(e)},prev:{textContent:()=>s?this.displayScore(this.svc.strokesFor(e.id,s)):""},cval:{textContent:()=>{const r=this.svc.strokesFor(e.id,t);return r!==null?this.displayScore(r):this.hintText(e.id,t)??"–"}},circle:{className:()=>this.svc.strokesFor(e.id,t)!==null?"se-row__circle":this.hintText(e.id,t)!==null?"se-row__circle empty hint":"se-row__circle empty",onclick:()=>this.openModalForBall(e.id)}},n)}modalRow(e,t,s){const n=e.pending?"Open seat — claim to score":e.players.length>1?`Team · CH ${e.courseHandicap}`:`CH ${e.players[0]?.courseHandicap??e.courseHandicap}`;return this.wireEl(ci,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.currentBallIdx.set(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:n},mval:{textContent:()=>{const r=this.currentHole();if(!r)return"–";const o=this.svc.strokesFor(e.id,r.playHoleId);return o!==null?this.displayScore(o):this.hintText(e.id,r.playHoleId)??"–"},className:()=>{const r=this.currentHole();return!!r&&this.svc.strokesFor(e.id,r.playHoleId)===null&&!!r&&this.hintText(e.id,r.playHoleId)!==null?"se-mrow__val se-mrow__val--hint":"se-mrow__val"}}},s)}numberKey(e){return this.wireEl(St,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,s,n){return this.wireEl(St,{key:{className:s,onclick:n},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(s=>s.id===e);this.currentBallIdx.set(t<0?0:t),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.noteHoleEntered(),this.modalOpen.set(!0)}advanceState(){const e=this.currentHole();return{balls:this.ballsInGroup().map(t=>({pending:!!t.pending,scored:!!e&&this.svc.strokesFor(t.id,e.playHoleId)!==null})),currentBallIndex:this.currentBallIdx.get(),currentHole:e?{id:e.playHoleId,label:this.occLabel(e.playHoleId)}:null,holeIndex:this.holeIndex(),holeCount:this.playedOrder().length,holeCompleteOnEntry:this.holeCompleteOnEntry,collectsStats:this.metaInputs().length>0}}noteHoleEntered(){this.holeCompleteOnEntry=ni(this.advanceState())}stepHole(e){this.advanceTimer&&(clearTimeout(this.advanceTimer),this.advanceTimer=null),this.extendedOpen.set(!1),this.statsOpen.set(!1),e<0?this.svc.prevHole():this.svc.nextHole(),this.currentBallIdx.set(0),this.noteHoleEntered()}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){this.apply({kind:"score",value:e})}apply(e){this.execute(ri(this.advanceState(),e))}execute(e){const t=e.write;if(t){const n=this.ballsInGroup()[t.ballIndex];n&&this.svc.setScore(n.id,t.holeId,t.value,t.withMetadata?this.metaSnapshot():void 0)}const s=e.move;switch(s.kind){case"noop":case"stay":return;case"moveToBall":this.currentBallIdx.set(s.ballIndex);return;case"openStats":this.statsOpen.set(!0);return;case"roundComplete":this.flash(s.toast),this.modalOpen.set(!1);return;case"holeComplete":{this.flash(s.toast),this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===s.fromHoleId&&(this.holeIdx.set(ie(s.toHoleIndex,this.playedOrder().length)),this.currentBallIdx.set(0),this.noteHoleEntered())},s.delayMs);return}}}hasMoreUnscored=()=>{const e=this.currentHole();return ii({balls:this.ballsInGroup().map(t=>({pending:!!t.pending,scored:!!e&&this.svc.strokesFor(t.id,e.playHoleId)!==null})),currentBallIndex:this.currentBallIdx.get(),currentHole:e?{id:e.playHoleId}:null})};metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),s={};for(const n of e)s[n.key]=t[n.key]===!0;return s}setMeta(e,t){const s=this.pendingMeta.get();this.pendingMeta.set({...s,[e]:t});const n=this.ballsInGroup()[this.currentBallIdx.get()],r=this.currentHole();if(!n||!r)return;const o=this.svc.strokesFor(n.id,r.playHoleId);o!==null&&this.svc.setScore(n.id,r.playHoleId,o,this.metaSnapshot())}metaChip(e,t){return this.wireEl(ui,{glabel:{textContent:e.label},miss:{className:()=>this.pendingMeta.get()[e.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(e.key,!1)},hit:{className:()=>this.pendingMeta.get()[e.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(e.key,!0)}},t)}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*J),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(ie(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",n=>{n.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",n=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:n.pointerId,startX:n.clientX,startY:n.clientY,lastX:n.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(n.pointerId))}),e.addEventListener("pointermove",n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const o=n.clientX-r.startX,d=n.clientY-r.startY;if(!r.horiz){if(Math.abs(d)>Math.abs(o)&&Math.abs(d)>8||Math.abs(o)<=8)return;r.horiz=!0}const c=Date.now(),h=Math.max(1,c-r.lastTime);r.velocity=(n.clientX-r.lastX)/h,r.lastX=n.clientX,r.lastTime=c,this.dragOffset.set(o)});const s=n=>{const r=this.ptr;if(!r||r.id!==n.pointerId)return;const o=n.clientX-r.startX,d=r.horiz;if(this.ptr=null,e.releasePointerCapture?.(n.pointerId),!d){this.dragOffset.set(0);return}this.snap(qn({dragDistance:o,velocity:r.velocity,itemWidth:J}))};e.addEventListener("pointerup",s),e.addEventListener("pointercancel",n=>{!this.ptr||this.ptr.id!==n.pointerId||(this.ptr=null,e.releasePointerCapture?.(n.pointerId),this.snap(0))})}}function pi(i,e){const t=[...i].sort((r,o)=>r.canonicalOrdinal-o.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(r=>r.playHoleId))}];const s=[...e].sort((r,o)=>r.fromCanonicalOrdinal-o.fromCanonicalOrdinal),n=[];for(const r of s){const o=t.filter(d=>d.canonicalOrdinal>=r.fromCanonicalOrdinal&&d.canonicalOrdinal<=r.toCanonicalOrdinal);o.length!==0&&n.push({label:r.label,holes:o,playHoleIds:new Set(o.map(d=>d.playHoleId))})}return n}function ts(i,e){const t=i.cells.filter(s=>e.has(s.playHoleId));if(i.aggregate==="sum"){const s=t.map(n=>n.value).filter(n=>n!==null);return s.length===0?"—":String(s.reduce((n,r)=>n+r,0))}if(i.aggregate==="last"){for(let s=t.length-1;s>=0;s--){const n=t[s].value;if(n!==null)return Number.isInteger(n)?String(n):n.toFixed(1)}return"—"}return"—"}function mi(i,e){if(i.aggregate==="sum"){const t=i.cells.map(s=>s.value).filter(s=>s!==null);return t.length===0?"—":String(t.reduce((s,n)=>s+n,0))}if(i.aggregate==="last"){const t=e[e.length-1];return t?ts(i,t.playHoleIds):"—"}return"—"}function fi(i){const e=i?.marker;if(e){const t=e.tone;return{kind:"marker",template:e.template,tone:t==="success"||t==="warning"||t==="danger"?t:null,label:e.label?e.label:null,teamFill:i?.team??null}}return i?.team?{kind:"pill",team:i.team}:{kind:"plain"}}function gi(i){return i.filter(e=>!(e.startsWith("slot #")||/^CH -?\d/.test(e)||/^PH -?\d/.test(e)))}const Te=" & ";function ss(i){return i.componentId??"default-score-grid"}function et(i,e,t,s={}){const n=pi(i.holes,e),r=s.mode??"product",o=i.rows.map(d=>{const c=new Map(d.cells.map(h=>[h.playHoleId,h]));return{kind:d.kind,emphasis:d.emphasis===!0,team:d.team??null,subjectName:d.subjectBallId?t(d.subjectBallId):null,labelText:d.label,groups:n.map(h=>({cells:h.holes.map(f=>{const m=c.get(f.playHoleId);return{text:m?.display??"",title:m?.title?m.title:null,decoration:fi(m)}}),subtotal:ts(d,h.playHoleIds)})),total:mi(d,n)}});return{componentId:ss(i),title:{groups:i.title.groups.map(d=>d.map(c=>t(c))),joiner:i.title.joiner,nameJoiner:Te},subtitleFacts:r==="verification"?[...i.subtitleFacts]:gi(i.subtitleFacts),footnotes:[...i.footnotes],caption:i.caption??null,totals:i.totals.map(d=>({label:d.label,value:String(d.value??"—")})),columnGroups:n.map(d=>({label:d.label,columns:d.holes.map(c=>({label:c.occurrenceLabel}))})),hasTotalColumn:n.length>1,rows:o}}function bi(i,e){const t=new Set(i.map(e));return t.size!==1?null:[...t][0]??null}function yi(i,e){if(i===void 0)return null;const t=e==="high"?-i:i;return{text:t===0?"E":t>0?`+${t}`:`−${Math.abs(t)}`,tone:t===0?"even":t>0?"over":"under"}}const _i=()=>null;function vi(i,e,t=_i){return{kind:"ranked",metricLabel:i.metricLabel,hasPace:i.entries.some(s=>s.paceDelta!==void 0),entries:i.entries.map(s=>({position:s.position,lead:s.position===1,name:s.ballIds.map(e).join(Te),group:bi(s.ballIds,t),total:String(s.total??"—"),holesPlayed:s.holesPlayed,pace:yi(s.paceDelta,i.direction)}))}}function wi(i,e){return{kind:"match_summary",title:i.title,matches:i.matches.map(t=>({sideAName:t.sideA.ballIds.map(e).join(Te),sideBName:t.sideB.ballIds.map(e).join(Te),leader:t.leader,standing:t.magnitude===0?"AS":`${t.magnitude} UP`,status:t.finished?"Final":`thru ${t.thru}`}))}}const ns={ring:{meaning:"a single-unit decided result",fill:"#d63b2f",visual:"red filled circle — the Gamebook birdie mark (score to par −1)"},double_ring:{meaning:"a two-unit decided result; more emphatic than a ring",fill:"#e0862c",teamFillBorder:"border-width: 3px; border-style: double;",visual:"orange filled circle (score to par −2); doubled white border when team-filled"},diamond:{meaning:"a rare / high-magnitude decided result — the strongest form",fill:"#e0b41f",visual:"yellow filled circle — hole-in-one / albatross territory"},dot:{meaning:"a lightweight per-hole flag where a full ring would be too heavy",visual:"the bare base shape (no fill, no border) — inherits cell colour"},badge:{meaning:"a labelled status needing short text or a number, not just a shape",rule:["width: auto; min-width: 1.8em;","padding-left: 0.45em; padding-right: 0.45em;","border: 2px solid currentColor;"],tones:{success:"#267348",warning:"#946200",danger:"#9b332a"},visual:"outline pill in the tone colour, text inside"},square:{meaning:"a one-step negative score relation",fill:"#5b9bd5",boxy:!0,visual:"light-blue filled square (score to par +1)"},double_square:{meaning:"a stronger negative score relation",fill:"#1f4e79",boxy:!0,visual:"dark-blue filled square (score to par +2)"},box_badge:{meaning:"an angular labelled state that must not read as a round marker",fill:"#1f4e79",boxy:!0,visual:"dark-blue filled square carrying its value (+3 or worse)"}};function me(i){return`lb-mark--${i}`}const le=()=>Object.entries(ns);function is(i){return i.join(`
            `)}function Oe(i,e){return i.map((t,s)=>`& .${me(t)}${s===i.length-1?` { ${e} }`:","}`)}function xi(){const i=[];i.push("/* Outline forms keep currentColor + tone tints. */");for(const[r,o]of le())if(!(!o.rule&&!o.tones)){if(o.rule){i.push(`& .${me(r)} {`);for(const d of o.rule)i.push(`    ${d}`);i.push("}")}for(const[d,c]of Object.entries(o.tones??{}))i.push(`& .${me(r)}.lb-mark-tone--${d} { color: ${c}; }`)}i.push("/* Filled forms — declared after the tone rules so white text wins. */");const e=le().filter(([,r])=>r.boxy).map(([r])=>r),t=[],s=new Set;for(const[r,o]of le()){if(o.fill===void 0||s.has(r))continue;const d=le().filter(([,c])=>c.fill===o.fill).map(([c])=>c);for(const c of d)s.add(c);t.push({fill:o.fill,ids:d})}let n=-1;if(e.length>0){const r=t.findIndex(o=>o.ids.some(d=>ns[d].boxy));n=r===-1?t.length:r}return t.forEach((r,o)=>{o===n&&i.push(...Oe(e,"border-radius: 3px;")),i.push(...Oe(r.ids,`background: ${r.fill}; color: #fff;`))}),n===t.length&&i.push(...Oe(e,"border-radius: 3px;")),is(i)}function $i(){const i=[];for(const[e,t]of le()){if(!t.teamFillBorder)continue;const s=me(e);i.push(`& .${s}.lb-mark-fill--a,`,`& .${s}.lb-mark-fill--b { ${t.teamFillBorder} }`)}return is(i)}const rs=()=>null;function P(i){return String(i).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ki(i){return i.kind==="si"?"lb-c-si":i.kind==="given"?"lb-c-given":i.kind==="status"?"lb-c-status":i.kind==="category"?"lb-c-cat":""}function Si(i){const e=[i.kind==="category"?"lb-r-cat":`lb-r-${i.kind}`];return(i.kind==="si"||i.kind==="given")&&e.push("lb-r-dim"),i.team&&e.push(`lb-team-${i.team}`),e.join(" ")}function Ci(i,e,t){const s=i.title!==null?` title="${P(i.title)}"`:"",n=t(P(i.text)),r=i.decoration;let o;if(r.kind==="marker"){const d=r.tone?` lb-mark-tone--${r.tone}`:"",c=r.teamFill?` lb-mark-fill--${r.teamFill}`:"",h=r.label!==null?` title="${P(r.label)}" aria-label="${P(r.label)}"`:"";o=`<span class="lb-mark ${me(r.template)}${d}${c}"${h}>${n}</span>`}else r.kind==="pill"?o=`<span class="lb-pill lb-pill--${r.team}">${n}</span>`:o=n;return`<td class="${ki(e)}"${s}>${o}</td>`}function tt(i,e){const t=m=>{const u=i.columnGroups[m],_=`<tr><th class="lb-rowlabel">Hole</th>${u.columns.map(T=>`<th>${P(T.label)}</th>`).join("")}<th class="lb-sum">${P(u.label)}</th></tr>`,b=i.rows.map(T=>{const j=ge=>T.emphasis?`<strong>${ge}</strong>`:ge,M=T.groups[m],L=M.cells.map(ge=>Ci(ge,T,j)).join(""),B=`<td class="lb-sum">${j(M.subtotal)}</td>`,Q=T.subjectName!==null?P(T.subjectName)+(T.labelText?" "+P(T.labelText):""):P(T.labelText);return`<tr class="${Si(T)}"><th class="lb-rowlabel">${Q}</th>${L}${B}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${_}</thead><tbody>${b}</tbody></table></div>`},s=i.columnGroups.map((m,u)=>t(u)).join(""),n=i.title.groups.map(m=>m.map(u=>P(u)).join(i.title.nameJoiner)).filter(Boolean).join(i.title.joiner),r=i.subtitleFacts.length?`<div class="lb-card__sub">${i.subtitleFacts.map(P).join(" · ")}</div>`:"",o=e.mode==="verification"&&i.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${i.footnotes.map(m=>`<span class="lb-card__note">${P(m)}</span>`).join("")}</div>`:"",d=e.mode==="verification"&&i.caption?`<p class="lb-card__caption">${P(i.caption)}</p>`:"",c=i.totals.length?`<ul class="lb-card__totals">${i.totals.map(m=>`<li>${P(m.label)} = <strong>${m.value}</strong></li>`).join("")}</ul>`:"",h=n?`<header class="lb-card__head"><h4>${n}</h4>${r}</header>`:r;return`<article class="${e.cardModifier?`lb-card ${e.cardModifier}`:"lb-card"}">
  ${h}
  ${s}
  ${o}${d}${c}
</article>`}function Ti(i,e,t,s){return tt(et(i,e,t,s),s)}function Ii(i,e,t,s){return tt(et(i,e,t,s),{...s,cardModifier:"lb-card--compact-match"})}function Ei(i,e,t,s){return tt(et(i,e,t,s),{...s,cardModifier:"lb-card--category-matrix"})}function Ni(i){return i.pace===null?'<td class="lb-rank__pace"></td>':`<td class="lb-rank__pace lb-rank__pace--${i.pace.tone}">${P(i.pace.text)}</td>`}function Pi(i,e,t=rs){const s=vi(i,e,t),n=s.hasPace,r=s.entries.map(c=>{const h=c.group?` <span class="lb-rank__group">${P(c.group)}</span>`:"";return`<tr class="${c.lead?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${c.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${P(c.name)}</span>${h}</span></td>
  <td class="lb-rank__total">${c.total}</td>${n?`
  ${Ni(c)}`:""}
  <td class="lb-rank__thru">${c.holesPlayed}</td>
</tr>`}).join(""),o=n?`
      <col class="lb-rank__col-pace">`:"",d=n?'<th class="lb-rank__pace">Pace</th>':"";return`<div class="lb-section">
  <h4 class="lb-section__title">${P(s.metricLabel)}</h4>
  <table class="lb-rank">
    <colgroup>
      <col class="lb-rank__col-pos">
      <col class="lb-rank__col-who">
      <col class="lb-rank__col-total">${o}
      <col class="lb-rank__col-thru">
    </colgroup>
    <thead><tr><th class="lb-rank__pos">#</th><th class="lb-rank__who">Player</th><th class="lb-rank__total">Total</th>${d}<th class="lb-rank__thru">Thru</th></tr></thead>
    <tbody>${r}</tbody>
  </table>
</div>`}function zi(i,e){const t=wi(i,e),s=t.matches.map(n=>{const r=n.leader==="a"?" lb-mp__team--lead":"",o=n.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${r}">${P(n.sideAName)}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${P(n.standing)}</span><span class="lb-mp__status">${P(n.status)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${o}">${P(n.sideBName)}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${P(t.title)}</h4>${s}
</div>`}const Oi={ranked:Pi,match_summary:(i,e)=>zi(i,e)},ji={"default-score-grid":Ti,"compact-match-grid":Ii,"category-matrix-grid":Ei};function Ri(i){return`<div class="lb-diag">Unrenderable result section <code>${P(i)}</code> — no generic view yet. Results are not hidden.</div>`}function Li(i){return`<div class="lb-diag">Unsupported score-grid component <code>${P(i)}</code> — no generic view yet. Results are not hidden.</div>`}function Di(i,e,t){const s=Oi[i.kind];return s?s(i,e,t):Ri(i.kind)}function Ai(i,e,t,s){const n=ss(i),r=ji[n];return r?r(i,e,t,s):Li(n)}function Hi(i,e,t=rs){return i.leaderboard.length===0&&i.cards.length===0?`<div class="lb-empty">No scores entered yet for ${P(i.formatLabel)}.</div>`:i.leaderboard.map(n=>Di(n,e,t)).join("")||`<div class="lb-empty">No leaderboard metric for ${P(i.formatLabel)}.</div>`}function Mi(i,e,t,s={}){if(i.cards.length===0)return"";const n=s.mode??"product";return i.cards.map(r=>Ai(r,e,t,{mode:n})).join(`
`)}const Fi=y(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class Bi extends N{static styles=`
        .lb {
            /* Horizontal gutters come from the host panel (.round-view__main
               already pads lg) — padding here would double-indent every
               section relative to the page header and waste table width. */
            padding: ${l("lg")} 0 ${l("2xl")};

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
                color: ${a("text-muted")};
                padding-left: 0;
            }
            & .lb-rank thead th.lb-rank__pace { font-weight: 700; }
            /* Worse than pace (+N) reads like over par; better (−N) like under
               par — same two colours the scorecard already uses. */
            & .lb-rank__pace--over { color: ${a("over-par")}; }
            & .lb-rank__pace--under { color: ${a("under-par")}; }
            /* Phase 3.5: group tag next to a player's name — only rendered when
               the round has 2+ playing groups (single-group rounds get nothing,
               same look as before this phase). */
            & .lb-rank__group {
                font-size: 0.7rem;
                font-weight: 600;
                color: ${a("text-muted")};
                margin-left: ${l("xs")};
                flex: none;
                white-space: nowrap;
            }
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
            /* Data cells hold a digit, a shape, or "AS" — all centred and at most
               a couple of px wider than the tightest mobile column. Let them
               spill symmetrically instead of clipping shapes / ellipsizing "AS".
               (Row labels keep the th ellipsis above.) */
            & .lb-grid td { overflow: visible; text-overflow: clip; }
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
            ${xi()}
            /* Deciding ball whose score is decorated: the marker's own shape gets
               the team fill — white number and white outline on the team colour.
               Declared AFTER the shape fills so the team colour wins. The white
               border + outer box-shadow halo are load-bearing: without them a
               filled bonus ring is indistinguishable from the plain standing
               pill (the score-to-par shapes above carry no outline). */
            & .lb-mark-fill--a, & .lb-mark-fill--b { border: 2px solid #fff; }
            ${$i()}
            & .lb-mark-fill--a { background: #c2452f; color: #fff; box-shadow: 0 0 0 2.5px #c2452f; }
            & .lb-mark-fill--b { background: #2c6cae; color: #fff; box-shadow: 0 0 0 2.5px #2c6cae; }
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
    `;svc=this.inject(te);slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots(),t=this.svc.selectedSlotDefId();return e.find(s=>s.slotDefId===t)??e[0]??null};render(){return this.wire(Fi,{status:{className:()=>{const t=this.svc.resultLoading.get(),s=this.svc.result.get()===null;return t||s?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody()}})}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const s=c=>{const h=this.svc.nameOf(c);return this.svc.isPending(c)?`${h} (open seat)`:h},r=Hi(t,s,c=>this.svc.groupLabelOf(c)),o=Mi(t,e.routeSections,s),d=o?`<h3 class="lb-cards__head">Scorecard</h3>${o}`:"";return r+d}}function Gi(i,e){if(!e)return[];const t=[],s=new Set;for(const n of i)for(const r of n.players){if(r.playerId===e)return[];r.guestPlayerId===null||s.has(r.guestPlayerId)||(s.add(r.guestPlayerId),t.push({guestPlayerId:r.guestPlayerId,displayName:r.displayName}))}return t}const qi=y(`
    <div bind="root" class="claim-card hidden">
        <span class="claim-card__label">Played here as a guest?</span>
        <p class="claim-card__hint">Claim your scores — the round lands on your profile's card.</p>
        <div bind="rows" class="claim-card__rows"></div>
        <p bind="err" class="claim-card__err"></p>
    </div>
`),Ki=y(`
    <div class="claim-card__row">
        <span bind="name" class="claim-card__name"></span>
        <button bind="claim" class="claim-card__btn" type="button">This is me</button>
    </div>
`);class Vi extends N{static styles=`
        .claim-card {
            margin-top: ${l("lg")};
            padding: ${l("lg")};
            ${z()}
            background: ${a("surface-sunken")};

            &.hidden { display: none; }

            & .claim-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${a("text-muted")};
            }
            & .claim-card__hint {
                margin: ${l("sm")} 0 0;
                font-size: 0.8rem;
                color: ${a("text-muted")};
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
                ${S()}
                padding: ${l("sm")} ${l("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${a("primary")};
                color: ${a("primary-text")};
                border: none;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .claim-card__err {
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(te);auth=this.inject(H);router=this.inject(R);tokenQ=this.router.query("token");claiming=new p(!1);error=new p("");claimable(){return Gi(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async claim(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.claiming.set(!0);try{await v.friendlyRounds.claimGuest({token:t,guestPlayerId:e}),await this.svc.loadByToken(t)}catch(s){this.error.set(s instanceof q&&s.status===409?"Already claimed — or you already play in this round under your account.":s instanceof q&&s.status===404?"That guest is no longer claimable on this round.":"Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}render(){const e=this.wire(qi,{root:{className:()=>this.claimable().length>0?"claim-card":"claim-card hidden"},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.claimable(),(t,s,n)=>this.wireEl(Ki,{name:()=>t.displayName,claim:{disabled:()=>this.claiming.get(),onclick:()=>{this.claim(t.guestPlayerId)}}},n),t=>t.guestPlayerId),e}}function je(i){return typeof i=="object"&&i!==null&&typeof i.get=="function"}const w=i=>`var(--${i})`,Ct="http://www.w3.org/2000/svg";function Ui(){const i=document.createElementNS(Ct,"svg");i.setAttribute("width","12"),i.setAttribute("height","8"),i.setAttribute("viewBox","0 0 12 8"),i.setAttribute("fill","none"),i.setAttribute("aria-hidden","true"),i.setAttribute("focusable","false");const e=document.createElementNS(Ct,"path");return e.setAttribute("d","M1 1.5 6 6.5 11 1.5"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","1.5"),e.setAttribute("stroke-linecap","round"),e.setAttribute("stroke-linejoin","round"),e.setAttribute("fill","none"),i.appendChild(e),i}const ue=class ue extends N{constructor(){super(...arguments),this.uid=`ui-select-${ue.seq++}`,this.open=new p(!1),this.highlightIndex=new p(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}get isMulti(){return this.props.multiple===!0}get multi(){return this.props}get single(){return this.props}currentOptions(){return je(this.props.options)?this.props.options.get():this.props.options}selectedValues(){if(this.isMulti)return this.multi.values.get();const e=this.single.value.get();return e?[e]:[]}placeholderText(){const e=this.props.placeholder;return(typeof e=="function"?e():e)??""}formatCount(e){return this.multi.countLabel?this.multi.countLabel(e):String(e)}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50,s=this.isMulti;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const n=document.createElement("span");n.className="ui-select__trigger-label",this.triggerEl.appendChild(n);const r=document.createElement("span");r.className="ui-select__chevron",r.appendChild(Ui()),r.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(r),this.triggerEl.addEventListener("click",d=>{d.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",d=>{this.handleTriggerKeydown(d)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",d=>{this.handleDropdownKeydown(d)}),this.listEl=document.createElement("div"),this.listEl.className="ui-select__list",this.listEl.setAttribute("role","listbox"),s&&this.listEl.setAttribute("aria-multiselectable","true"),this.dropdownEl.appendChild(this.listEl),s&&(this.countEl=document.createElement("div"),this.countEl.className="ui-select__count",this.countEl.setAttribute("role","status"),this.countEl.setAttribute("aria-live","polite"),this.dropdownEl.appendChild(this.countEl)),e.appendChild(this.dropdownEl);const o=d=>{this.optionEls=[],this.listEl.textContent="";for(let c=0;c<d.length;c++){const h=d[c],f=document.createElement("button");if(f.className=s?"ui-select__option ui-select__option--multi":"ui-select__option",f.setAttribute("type","button"),f.id=`${this.uid}-opt-${c}`,h.disabled){f.classList.add("ui-select__option--header"),f.disabled=!0,f.setAttribute("role","presentation"),f.setAttribute("aria-disabled","true");const u=document.createElement("span");u.className="ui-select__option-label",u.textContent=h.label,f.appendChild(u),this.listEl.appendChild(f),this.optionEls.push(f);continue}if(f.setAttribute("role","option"),s){const u=document.createElement("span");u.className="ui-select__checkbox",u.setAttribute("aria-hidden","true"),f.appendChild(u)}if(h.icon){const u=document.createElement("span");u.className="ui-select__option-icon",u.textContent=h.icon,f.appendChild(u)}const m=document.createElement("span");if(m.className="ui-select__option-label",m.textContent=h.label,f.appendChild(m),!s){const u=document.createElement("span");u.className="ui-select__check",u.setAttribute("aria-hidden","true"),f.appendChild(u)}f.addEventListener("click",u=>{u.stopPropagation(),this.chooseOption(h.value)}),f.addEventListener("mouseenter",()=>{this.highlightIndex.set(c)}),this.listEl.appendChild(f),this.optionEls.push(f)}};return je(this.props.options)?this.track(E(()=>{o(this.currentOptions())})):o(this.props.options),this.track(E(()=>{const d=this.currentOptions(),c=this.selectedValues();if(s){const h=c.length;if(h>0)n.textContent=this.formatCount(h),this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const f=this.placeholderText();n.textContent=f,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!f)}this.countEl&&(this.countEl.textContent=this.formatCount(h))}else{const h=this.single.value.get(),f=d.find(m=>m.value===h);if(f)n.textContent=f.icon?`${f.icon} ${f.label}`:f.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const m=this.placeholderText();n.textContent=m,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!m)}}for(let h=0;h<d.length;h++){const f=this.optionEls[h];if(!f||d[h].disabled)continue;const m=c.includes(d[h].value);f.setAttribute("aria-selected",String(m)),f.classList.toggle("ui-select__option--selected",m);const u=f.querySelector(".ui-select__check");u&&(u.textContent=m?"✓":"");const _=f.querySelector(".ui-select__checkbox");_&&(_.textContent=m?"✓":"")}})),this.track(E(()=>{const d=this.open.get();this.dropdownEl.classList.toggle("open",d),r.classList.toggle("ui-select__chevron--open",d),this.triggerEl.setAttribute("aria-expanded",String(d)),d?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),d&&G(()=>{const c=this.currentOptions(),h=this.selectedValues(),f=c.findIndex(u=>!u.disabled&&h.includes(u.value)),m=c.findIndex(u=>!u.disabled);this.highlightIndex.set(f>=0?f:m)})})),this.track(E(()=>{const d=this.highlightIndex.get();for(let c=0;c<this.optionEls.length;c++)this.optionEls[c].classList.toggle("ui-select__option--highlighted",c===d);d>=0&&this.optionEls[d]&&(this.triggerEl.setAttribute("aria-activedescendant",`${this.uid}-opt-${d}`),this.optionEls[d].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(je(this.props.disabled)?this.track(E(()=>{const d=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",d),this.triggerEl.disabled=d})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}chooseOption(e){if(this.isMulti){const t=this.multi.values.get();this.multi.values.set(t.includes(e)?t.filter(s=>s!==e):[...t,e]);return}he(()=>{this.single.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}commitHighlighted(){const e=this.highlightIndex.get(),t=this.currentOptions();e>=0&&e<t.length&&!t[e].disabled&&this.chooseOption(t[e].value)}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.open.get()?this.commitHighlighted():this.open.set(!0);break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":e.preventDefault(),this.commitHighlighted();break;case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=this.currentOptions();if(t.length===0||!t.some(n=>!n.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};ue.styles=`
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
    `,ue.seq=0;let U=ue;function Wi(i){if(!i)return{visible:!1,selfAllowed:!1,guestAllowed:!1,blockedMessage:null};const e=i.seats.length>0,t=i.claimedSeats.some(r=>r.viewerMayRelease),s=i.viewer.claimSeat.allowed,n=i.viewer.claimSeatAsGuest.allowed;return{visible:e||t,selfAllowed:e&&s,guestAllowed:e&&n,blockedMessage:e&&!s&&!n?i.viewer.claimSeat.message??i.viewer.claimSeatAsGuest.message??"Claiming seats is not available on this round.":null}}function Yi(i,e){const t=[];if(i.groupId!==null&&e.length>0){const s=e.findIndex(n=>n.id===i.groupId);if(s>=0){t.push(`Group ${s+1}`);const n=e[s].startTime;n.includes(":")&&t.push(n)}}return i.category!==null&&t.push(i.category),t.join(" · ")}function Qi(i){return(i?.claimedSeats??[]).filter(e=>e.viewerMayRelease)}const Xi=y(`
    <div bind="root" class="seat-card hidden">
        <span class="seat-card__label">Who's playing?</span>
        <p bind="hint" class="seat-card__hint">This round has open seats — claim one to score.</p>
        <p bind="blocked" class="seat-card__blocked hidden"></p>
        <div bind="rows" class="seat-card__rows"></div>
        <div bind="releaseRows" class="seat-card__rows"></div>
        <p bind="err" class="seat-card__err"></p>
    </div>
`),Ji=y(`
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
`),Zi=y(`
    <div class="seat-card__release">
        <span class="seat-card__who">
            <span bind="name" class="seat-card__name"></span>
            <span bind="context" class="seat-card__context"></span>
        </span>
        <button bind="release" class="seat-card__btn seat-card__btn--ghost" type="button">Not me — release</button>
    </div>
`);class er extends N{static styles=`
        .seat-card {
            margin-top: ${l("lg")};
            padding: ${l("lg")};
            ${z()}
            background: ${a("surface-sunken")};

            &.hidden { display: none; }

            & .seat-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${a("text-muted")};
            }
            & .seat-card__hint {
                margin: ${l("sm")} 0 0;
                font-size: 0.8rem;
                color: ${a("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__blocked {
                margin: ${l("md")} 0 0;
                font-size: 0.85rem;
                color: ${a("text-muted")};
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
                border-bottom: 1px solid ${a("border")};
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
                color: ${a("text-muted")};
                &:empty { display: none; }
            }
            & .seat-card__btn {
                ${S()}
                padding: ${l("sm")} ${l("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${a("primary")};
                color: ${a("primary-text")};
                border: none;
                flex-shrink: 0;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .seat-card__btn--wide { width: 100%; margin-top: ${l("sm")}; }
            & .seat-card__btn--ghost {
                background: transparent;
                color: ${a("accent")};
                border: 1px solid ${a("border")};
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
                border: 1px solid ${a("border")};
                border-radius: 8px;
                background: ${a("surface")};
                color: ${a("text")};
            }
            & .seat-card__input--hcp { width: 6rem; flex-shrink: 0; }
            & .seat-card__gender { flex: 1; }
            & .seat-card__tee { margin-bottom: ${l("sm")}; }
            & .seat-card__diag {
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__err {
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(te);auth=this.inject(H);router=this.inject(R);tokenQ=this.router.query("token");claiming=new p(!1);error=new p("");diagnostics=new p([]);expandedSeat=new p(null);teeId=new p("");tees=new p([]);loadedForCourseId=null;guestName=new p("");guestHcp=new p("");guestGender=new p("M");state(){return Wi(this.svc.startList.get())}ensureTeesLoaded(){if(!this.state().visible)return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,v.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}toggleSeat(e){this.diagnostics.set([]),this.error.set(""),this.expandedSeat.set(this.expandedSeat.get()===e?null:e)}guestHcpValue(){const e=Number.parseFloat(this.guestHcp.get().replace(",","."));return Number.isFinite(e)?e:null}async claim(e,t,s){const n=this.tokenQ.get(),r=this.teeId.get();if(!(!n||!r||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const o=await v.friendlyRounds.claimSeat({token:n,seatId:e,identity:t,teeId:r,clientEventId:s});o.ok?(this.expandedSeat.set(null),this.guestName.set(""),this.guestHcp.set(""),await this.svc.loadByToken(n)):this.diagnostics.set(o.diagnostics)}catch{this.error.set("Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}async claimSelf(e){const t=this.auth.currentUser.get()?.id??"anon";await this.claim(e,{kind:"self"},`claim-seat:${e}:${t}:${this.teeId.get()}`)}async claimGuest(e){const t=this.guestName.get().trim(),s=this.guestHcpValue();!t||s===null||await this.claim(e,{kind:"guest",name:t,handicapIndex:s,gender:this.guestGender.get()==="F"?"F":"M"},crypto.randomUUID())}async release(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const s=await v.friendlyRounds.releaseSeat({token:t,seatId:e,clientEventId:crypto.randomUUID()});s.ok?await this.svc.loadByToken(t):this.diagnostics.set(s.diagnostics)}catch{this.error.set("Could not release right now. Try again.")}finally{this.claiming.set(!1)}}}seatRow(e,t){const s=()=>this.expandedSeat.get()===e.seatId&&this.state().blockedMessage===null,n=this.wireEl(Ji,{label:()=>e.label,context:()=>Yi(e,this.svc.groups()),toggle:{textContent:()=>this.expandedSeat.get()===e.seatId?"Close":"Claim",disabled:()=>this.state().blockedMessage!==null,onclick:()=>this.toggleSeat(e.seatId)},form:{className:()=>s()?"seat-card__form":"seat-card__form hidden"},selfBtn:{className:()=>this.state().selfAllowed?"seat-card__btn seat-card__btn--wide":"seat-card__btn seat-card__btn--wide hidden",disabled:()=>this.claiming.get()||!this.teeId.get(),onclick:()=>{this.claimSelf(e.seatId)}},guestBox:{className:()=>this.state().guestAllowed?"seat-card__guest":"seat-card__guest hidden"},guestName:{oninput:d=>this.guestName.set(d.target.value)},guestHcp:{oninput:d=>this.guestHcp.set(d.target.value)},guestBtn:{disabled:()=>this.claiming.get()||!this.teeId.get()||this.guestName.get().trim()===""||this.guestHcpValue()===null,onclick:()=>{this.claimGuest(e.seatId)}},diag:{className:()=>this.diagnostics.get().length>0?"seat-card__diag":"seat-card__diag hidden",textContent:()=>this.diagnostics.get().map(d=>d.message).join(" · ")}},t),r=new U({value:this.teeId,options:{get:()=>this.tees.get().map(d=>({value:d.id,label:d.name}))},placeholder:"Tee"});r.mount(this.ref(n,"teeHost")),t(()=>r.destroy());const o=new U({value:this.guestGender,options:{get:()=>[{value:"M",label:"Men’s tee rating"},{value:"F",label:"Women’s tee rating"}]},placeholder:"Rating"});return o.mount(this.ref(n,"genderHost")),t(()=>o.destroy()),n}render(){this.track(E(()=>this.ensureTeesLoaded()));const e=this.wire(Xi,{root:{className:()=>this.state().visible?"seat-card":"seat-card hidden"},hint:{className:()=>(this.svc.startList.get()?.seats.length??0)>0&&this.state().blockedMessage===null?"seat-card__hint":"seat-card__hint hidden"},blocked:{className:()=>this.state().blockedMessage!==null?"seat-card__blocked":"seat-card__blocked hidden",textContent:()=>this.state().blockedMessage??""},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.svc.startList.get()?.seats??[],(t,s,n)=>this.seatRow(t,n),t=>t.seatId),this.$each(this.ref(e,"releaseRows"),()=>Qi(this.svc.startList.get()),(t,s,n)=>this.wireEl(Zi,{name:()=>t.displayName,context:()=>`holds “${t.seatLabel}”`,release:{disabled:()=>this.claiming.get(),onclick:()=>{this.release(t.seatId)}}},n),t=>t.seatId),e}}function tr(i,e,t){if(!e||t!=="not_started")return!1;for(const s of i)for(const n of s.players)if(n.playerId===e)return!1;return!0}function sr(i){if(!i)return{visible:!1,blockedMessage:null};const e=i.viewer.join;return e.allowed?{visible:!0,blockedMessage:null}:e.code==="window_not_open"||e.code==="window_closed"?{visible:!0,blockedMessage:e.message??"Sign-up is closed right now."}:{visible:!1,blockedMessage:null}}const Tt="new";function nr(i,e=!0){const t=i.map((n,r)=>{const o=n.ballIds.length,d=[`Group ${r+1}`];return n.startTime.includes(":")&&d.push(n.startTime),{value:n.id,label:`${d.join(" · ")} — ${o} of ${n.capacity}`,disabled:o>=n.capacity}}),s=t.find(n=>!n.disabled);return e&&t.push({value:Tt,label:"Start a new group",disabled:!1}),{options:t,defaultValue:s?.value??(e?Tt:"")}}const ir=y(`
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
`);class rr extends N{static styles=`
        .join-card {
            margin-top: ${l("lg")};
            padding: ${l("lg")};
            ${z()}
            background: ${a("surface-sunken")};

            &.hidden { display: none; }

            & .join-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${a("text-muted")};
            }
            & .join-card__hint {
                margin: ${l("sm")} 0 0;
                font-size: 0.8rem;
                color: ${a("text-muted")};
            }
            & .join-card__blocked {
                margin: ${l("md")} 0 0;
                font-size: 0.85rem;
                color: ${a("text-muted")};
                &.hidden { display: none; }
            }
            & .join-card__group {
                margin-top: ${l("md")};
                &.hidden { display: none; }
            }
            & .join-card__group-label {
                display: block;
                font-size: 0.8rem;
                color: ${a("text-muted")};
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
                ${S()}
                padding: ${l("sm")} ${l("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${a("primary")};
                color: ${a("primary-text")};
                border: none;
                flex-shrink: 0;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .join-card__diag {
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("text-muted")};
                &.hidden { display: none; }
            }
            & .join-card__profile-link {
                border: 0;
                padding: 0;
                background: transparent;
                color: ${a("accent")};
                font: inherit;
                font-weight: 600;
                cursor: pointer;
                &.hidden { display: none; }
            }
            & .join-card__err {
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(te);auth=this.inject(H);router=this.inject(R);tokenQ=this.router.query("token");joining=new p(!1);error=new p("");diagnostics=new p([]);teeId=new p("");tees=new p([]);loadedForCourseId=null;groupChoice=new p("");policyState(){return sr(this.svc.startList.get())}eligible(){return this.policyState().visible&&tr(this.svc.balls.get(),this.auth.currentUser.get()?.id??null,this.svc.round.get()?.status??null)}ensureTeesLoaded(){if(!this.eligible())return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,v.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}needsProfileUpdate(){return this.diagnostics.get().some(e=>e.code==="missing_gender"||e.code==="missing_handicap_index")}async join(){const e=this.tokenQ.get(),t=this.teeId.get();if(!(!e||!t||this.joining.get())){this.error.set(""),this.diagnostics.set([]),this.joining.set(!0);try{const s=this.groupChoice.get(),n=await v.friendlyRounds.join({token:e,teeId:t,...s?{groupChoice:s}:{}});n.ok?await this.svc.loadByToken(e):this.diagnostics.set(n.diagnostics)}catch(s){this.error.set(s instanceof q&&s.status===409?s.message??"You already play in this round, or it has already started.":"Could not join right now. Try again.")}finally{this.joining.set(!1)}}}render(){this.track(E(()=>this.ensureTeesLoaded()));const e=new k(()=>nr(this.svc.groups(),this.svc.startList.get()?.viewer.createGroup.allowed??!0));this.track(E(()=>{const r=e.get(),o=this.groupChoice.get();(!o||!r.options.some(d=>d.value===o&&!d.disabled))&&this.groupChoice.set(r.defaultValue)}));const t=this.wire(ir,{root:{className:()=>this.eligible()?"join-card":"join-card hidden"},blocked:{className:()=>this.policyState().blockedMessage!==null?"join-card__blocked":"join-card__blocked hidden",textContent:()=>this.policyState().blockedMessage??""},groupRow:{className:()=>this.svc.groups().length>0&&this.policyState().blockedMessage===null?"join-card__group":"join-card__group hidden"},row:{className:()=>this.policyState().blockedMessage===null?"join-card__row":"join-card__row hidden"},join:{disabled:()=>this.joining.get()||!this.teeId.get(),onclick:()=>{this.join()}},diag:{className:()=>this.diagnostics.get().length>0?"join-card__diag":"join-card__diag hidden"},diagText:{textContent:()=>this.diagnostics.get().map(r=>r.message).join(" · ")},profileLink:{className:()=>this.needsProfileUpdate()?"join-card__profile-link":"join-card__profile-link hidden",onclick:()=>this.router.navigate("/profile")},err:{textContent:()=>this.error.get()}}),s=new U({value:this.teeId,options:{get:()=>this.tees.get().map(r=>({value:r.id,label:r.name}))},placeholder:"Tee"});s.mount(this.ref(t,"teeHost")),this.track(()=>s.destroy());const n=new U({value:this.groupChoice,options:{get:()=>e.get().options},placeholder:"Group"});return n.mount(this.ref(t,"groupHost")),this.track(()=>n.destroy()),t}}const or=y(`
    <div bind="root" class="edit-card hidden">
        <div class="edit-card__text">
            <span class="edit-card__label">Round setup</span>
            <p class="edit-card__hint">Change tees, add a format, adjust groups — scored balls are preserved.</p>
        </div>
        <button bind="edit" class="edit-card__btn" type="button">Edit round</button>
    </div>
`);class ar extends N{static styles=`
        .edit-card {
            margin-top: ${l("lg")};
            padding: ${l("lg")};
            ${z()}
            background: ${a("surface-sunken")};
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${l("md")};

            &.hidden { display: none; }

            & .edit-card__text { min-width: 0; }
            & .edit-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${a("text-muted")};
            }
            & .edit-card__hint {
                margin: ${l("xs")} 0 0;
                font-size: 0.8rem;
                color: ${a("text-muted")};
            }
            & .edit-card__btn {
                ${S()}
                flex-shrink: 0;
                padding: ${l("sm")} ${l("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${a("primary")};
                color: ${a("primary-text")};
                border: none;
            }
        }
    `;router=this.inject(R);tokenQ=this.router.query("token");editable=new p(!1);render(){const e=this.tokenQ.get();return e&&v.friendlyRounds.setup({token:e}).then(t=>this.editable.set(t.editable===!0)).catch(()=>this.editable.set(!1)),this.wire(or,{root:{className:()=>this.editable.get()?"edit-card":"edit-card hidden"},edit:{onclick:()=>{const t=this.tokenQ.get();t&&this.router.navigate("/create",{query:{token:t}})}}})}}function lr(i,e){if(!e)return!1;for(const t of i)for(const s of t.players)if(s.playerId===e)return!0;return!1}const dr=y(`
    <div bind="root" class="leave-card hidden">
        <button bind="leaveBtn" class="leave-card__btn" type="button">Remove me from this round</button>
        <p bind="diag" class="leave-card__diag"></p>
        <p bind="err" class="leave-card__err"></p>
        <div bind="confirmHost"></div>
    </div>
`);class cr extends N{static styles=`
        .leave-card {
            /* Sits at the head of the danger zone, above Finish/Delete. */
            margin-top: ${l("2xl")};

            &.hidden { display: none; }

            /* Same quiet ghost-danger treatment as Delete round — an action in
               the error tone, secondary to the primary Score/Board flow. */
            & .leave-card__btn {
                width: 100%;
                padding: ${l("md")};
                background: none;
                border: 1px solid ${a("border")};
                border-radius: ${a("radius")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${a("error")};
                cursor: pointer;

                &:hover, &:active { border-color: ${a("error")}; }
                &:focus-visible { outline: 2px solid ${a("error")}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .leave-card__diag {
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("text-muted")};
                &:empty { display: none; }
            }
            & .leave-card__err {
                margin: ${l("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(te);auth=this.inject(H);router=this.inject(R);tokenQ=this.router.query("token");open=new p(!1);leaving=new p(!1);error=new p("");diagnostics=new p([]);eligible(){return lr(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async leave(){const e=this.tokenQ.get();if(!(!e||this.leaving.get())){this.error.set(""),this.diagnostics.set([]),this.leaving.set(!0);try{const t=await v.friendlyRounds.leave({token:e});t.ok?await this.svc.loadByToken(e):this.diagnostics.set(t.diagnostics)}catch{this.error.set("Could not remove you right now. Try again.")}finally{this.leaving.set(!1)}}}render(){const e=this.wire(dr,{root:{className:()=>this.eligible()?"leave-card":"leave-card hidden"},leaveBtn:{onclick:()=>this.open.set(!0),disabled:()=>this.leaving.get()},diag:{textContent:()=>this.diagnostics.get().map(t=>t.message).join(" · ")},err:{textContent:()=>this.error.get()}});return this.spawn(V,this.ref(e,"confirmHost"),{open:this.open,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.leave()}}),e}}function ur(i){return!(i.tab!=="leaderboard"||!i.pageVisible||i.status==="complete")}const hr=2,pr=3;function mr(i,e=null){const t=new URLSearchParams({token:i});return e!==null&&t.set("since",e),`${D}/friendly-rounds/events?${t.toString()}`}function fr(i){if(typeof i!="object"||i===null)return!1;const e=i;return e.latestEventId!==null&&typeof e.latestEventId!="string"?!1:e.status==="not_started"||e.status==="active"||e.status==="complete"}function gr(i){const t=(i.eventSourceFactory??(o=>new EventSource(o)))(mr(i.token,i.since??null));let s=!1,n=0;const r=()=>{s=!0,t.onopen=null,t.onmessage=null,t.onerror=null,t.close()};return t.onopen=()=>{n=0},t.onmessage=o=>{if(s)return;let d;try{d=JSON.parse(o.data)}catch{return}fr(d)&&i.onEvent({latestEventId:d.latestEventId,status:d.status})},t.onerror=()=>{s||(t.readyState===hr||++n>=pr)&&(r(),i.onDegrade())},{stop:()=>{s||r()}}}const br=2e4;function yr(i){if(!(i===null||i===""))return/^\d+$/.test(i)?Number(i):i}const _r=y(`
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
`),vr=y('<button bind="pill" class="round-view__fmt" type="button"></button>'),wr=y('<button bind="pill" class="round-view__grp" type="button"></button>');class xr extends N{static styles=`
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
                    font-variant-numeric: tabular-nums;
                    &.active { background: ${a("accent")}; color: ${a("primary-text")}; border-color: ${a("accent")}; }
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
                    ${K()}
                    flex: 1;
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

            /* Finish / reopen: a secondary action above the danger zone. A
               bordered ghost button in the neutral text tone — clearly an
               action, but never competing with the primary Score/Board flow. */
            & .round-view__finish {
                width: 100%;
                margin-top: ${l("2xl")};
                padding: ${l("md")};
                background: none;
                border: 1px solid ${a("border")};
                border-radius: ${a("radius")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${a("text")};
                cursor: pointer;

                &:hover, &:active { border-color: ${a("text-muted")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            /* Danger zone: last thing on the score panel, visually quiet —
               a bordered ghost button in the error tone, never a filled CTA. */
            & .round-view__delete {
                width: 100%;
                /* Sits right under Finish, so a tighter gap than the 2xl that
                   used to separate it from the share card. */
                margin-top: ${l("md")};
                padding: ${l("md")};
                background: none;
                border: 1px solid ${a("border")};
                border-radius: ${a("radius")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${a("error")};
                cursor: pointer;

                &:hover, &:active { border-color: ${a("error")}; }
                &:focus-visible { outline: 2px solid ${a("error")}; outline-offset: 2px; }
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
    `;svc=this.inject(te);router=this.inject(R);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new p(this.initPos.tab);pageVisible=new p(!document.hidden);hasRound=new k(()=>this.svc.round.get()!==null);hasScoring=new k(()=>this.svc.balls.get().length>0);deleteOpen=new p(!1);finishOpen=new p(!1);isComplete=new k(()=>this.svc.round.get()?.status==="complete");shareUrl=new k(()=>{const e=this.tokenQ.get(),t="/tapscore/".replace(/\/+$/,"");return e?`${location.origin}${t}/round?token=${e}`:""});render(){this.track(E(()=>{const u=this.tokenQ.get();u&&this.svc.loadByToken(u,this.initPos).then(()=>{this.tab.get()==="leaderboard"&&this.svc.loadResult()})}));const e=()=>{this.svc.flushPending()};window.addEventListener("online",e),this.track(()=>window.removeEventListener("online",e));const t=()=>this.pageVisible.set(!document.hidden);document.addEventListener("visibilitychange",t),this.track(()=>document.removeEventListener("visibilitychange",t));let s=null,n=null,r=null,o=!1;const d=()=>{r!==null&&(clearInterval(r),r=null)},c=()=>{r===null&&(r=setInterval(()=>{this.svc.pollResult()},br))};this.track(E(()=>{const u=this.tokenQ.get()||null,_=ur({tab:this.tab.get(),pageVisible:this.pageVisible.get(),status:this.svc.round.get()?.status??null});if(n!==u&&(s?.stop(),s=null,n=null,d(),o=!1),!_){s?.stop(),s=null,n=null,d(),o=!1;return}if(o){c();return}if(s===null&&u){n=u;try{s=gr({token:u,since:this.svc.persistedCursor(u),onEvent:b=>this.svc.onLiveResultEvent(b),onDegrade:()=>{s=null,o=!0,c()}})}catch{s=null,o=!0,c()}}})),this.track(()=>{s?.stop(),s=null,n=null,d()}),this.track(E(()=>{const u=this.tab.get(),_=this.svc.selectedSlotDefId(),b=this.svc.holeIdx.get();if(this.router.route.get()!=="/round"||!this.hasRound.get())return;const T=this.tokenQ.get();if(!T)return;const j={token:T};u==="leaderboard"&&(j.tab="board");const M=this.svc.round.get()?.formatSlots[0]?.slotDefId??null;_&&_!==M&&(j.slot=_),b>0&&(j.hole=b+1),this.router.navigate(this.router.route.get(),{replace:!0,query:j})}));const h={not_started:"Not started",active:"Live",complete:"Finished"},f=this.wire(_r,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},course:()=>this.svc.round.get()?.courseNameSnapshot??"Round",status:()=>{const u=this.svc.round.get()?.status??"not_started";return h[u]??u},date:()=>this.svc.round.get()?.date??"",route:()=>{const u=this.svc.round.get();return u?`${u.playHoles.length} holes`:""},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},groupTabs:{className:()=>this.svc.groups().length>1?"round-view__groups":"round-view__groups hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},finishBtn:{textContent:()=>this.isComplete.get()?"Reopen round":"Finish round",onclick:()=>this.finishOpen.set(!0),disabled:()=>this.svc.finishing.get()},deleteBtn:{onclick:()=>this.deleteOpen.set(!0),disabled:()=>this.svc.deleting.get()},dock:{className:()=>this.hasRound.get()&&!this.svc.keypadOpen.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const u=this.svc.currentPlayedHole();return u?this.svc.occLabel(u.playHoleId):""},holeSi:()=>{const u=this.svc.currentPlayHole()?.baseStrokeIndex;return u!=null?String(u):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});this.$each(this.ref(f,"groupTabs"),new k(()=>this.svc.groups()),(u,_,b)=>this.groupPill(_,b),u=>u.id),this.$each(this.ref(f,"formats"),new k(()=>this.svc.round.get()?.formatSlots??[]),(u,_,b)=>this.slotPill(u,_,b),u=>u.slotDefId),this.spawn(hi,this.ref(f,"scoring")),this.spawn(Bi,this.ref(f,"leaderboard")),this.spawn(er,this.ref(f,"seats")),this.spawn(ar,this.ref(f,"edit")),this.spawn(Vi,this.ref(f,"claim")),this.spawn(rr,this.ref(f,"join")),this.spawn(cr,this.ref(f,"leave")),this.spawn(V,this.ref(f,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:"This permanently removes the round and all its scores for everyone. This can't be undone.",confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.svc.deleteRound().then(u=>{u&&this.router.navigate("/")})}}),this.spawn(V,this.ref(f,"finishConfirmHost"),{open:this.finishOpen,title:"Finish or reopen round",message:()=>this.isComplete.get()?"Reopen this round? It'll move back to your ongoing rounds.":"Finish this round? It'll move to your finished rounds. You can still edit or reopen it any time.",cancelLabel:"Cancel",onconfirm:()=>{this.isComplete.get()?this.svc.reopenRound():this.svc.finishRound()}});const m=u=>{u.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1),u.key==="Escape"&&this.finishOpen.get()&&this.finishOpen.set(!1)};return window.addEventListener("keydown",m),this.track(()=>window.removeEventListener("keydown",m)),f}readUrlPosition(){const e=new URLSearchParams(location.search),t=e.get("slot"),s=Number(e.get("hole"));return{tab:e.get("tab")==="board"?"leaderboard":"score",selectedSlot:yr(t),holeIdx:Number.isFinite(s)&&s>0?s-1:0}}groupPill(e,t){return this.wireEl(wr,{pill:{textContent:()=>{const s=this.svc.groups()[e];if(!s)return`Group ${e+1}`;const n=[`Group ${e+1}`];s.startTime.includes(":")&&n.push(s.startTime);const r=this.svc.playHoleById(s.startPlayHoleId)?.courseHoleNumber;return r!==void 0&&s.startOrdinal!==1&&n.push(`H${r}`),n.join(" · ")},className:()=>this.svc.groupIdx.get()===e?"round-view__grp active":"round-view__grp",onclick:()=>this.svc.groupIdx.set(e)}},t)}slotPill(e,t,s){return this.wireEl(vr,{pill:{textContent:()=>Xt(e),className:()=>this.tab.get()==="leaderboard"&&this.svc.selectedSlotDefId()===e.slotDefId?"round-view__fmt active":"round-view__fmt",onclick:()=>{this.svc.selectSlot(e.slotDefId),this.tab.get()!=="leaderboard"&&(this.tab.set("leaderboard"),this.svc.loadResult())}}},s)}}function Y(i){const e=i.trim().replace(",",".");if(e==="")return null;const t=e.startsWith("+"),s=Number.parseFloat(t?e.slice(1):e);return Number.isFinite(s)?t?-s:s:null}function os(i){return i<0?`+${String(-i)}`:String(i)}function as(i){return i.formatIndex??i.slotIndex??null}function $r(i,e){return i.filter(t=>as(t)===e)}function kr(i){return i.filter(e=>!e.path?.startsWith("producers")&&!e.path?.startsWith("playingGroups")&&e.path!=="route"&&as(e)===null)}function Z(i){return`${i} ${i===1?"player":"players"}`}function ve(i,e){const t=i.formatId?e(i.formatId)??i.formatId:null,s=i.teamLabel;switch(i.code){case"team_size_above_max":if(t&&s&&i.actual!==void 0&&i.allowedMax!==void 0)return`${s} has ${Z(i.actual)} — ${t} allows at most ${i.allowedMax} per team.`;break;case"team_size_below_min":if(t&&s&&i.actual!==void 0&&i.allowedMin!==void 0)return`${s} has ${Z(i.actual)} — ${t} needs at least ${i.allowedMin} per team.`;break;case"empty_team_grouping":if(t&&s)return`${s} has no players — add at least one, or remove the team.`;break;case"team_count_above_max":if(t&&i.actual!==void 0&&i.allowedMax!==void 0)return`${i.actual} teams — ${t} allows at most ${i.allowedMax}.`;break;case"team_count_below_min":if(t&&i.actual!==void 0&&i.allowedMin!==void 0)return`${i.actual} teams — ${t} needs at least ${i.allowedMin}.`;break;case"slot_ball_count_above_max":if(t&&i.actual!==void 0&&i.allowedMax!==void 0)return`${Z(i.actual)} in ${t} — it scores at most ${i.allowedMax}.`;break;case"slot_ball_count_below_min":if(t&&i.actual!==void 0&&i.allowedMin!==void 0)return`${Z(i.actual)} in ${t} — it needs at least ${i.allowedMin}.`;break;case"slot_ball_count_not_multiple":if(t&&i.actual!==void 0)return`${t} pairs its balls, so it needs an even number — ${Z(i.actual)} won't pair up.`;break;case"missing_team_grouping":if(t)return`${t} compares teams — under Teams, group the players into “Separate balls (a side)” teams, then tick them under “Scores”.`;break;case"ball_mode_violation":if(t&&i.actual!==void 0)return i.actual>1?`${t} is played with everyone on their own ball — a “One combined ball” team can’t play it. Use a “Separate balls (a side)” team instead.`:`${t} is played on one shared team ball — under Teams, group the players into a “One combined ball” team, then tick that team instead of the individual players.`;break;case"producer_count_violation":if(t&&i.actual!==void 0&&i.allowedMin!==void 0&&i.allowedMax!==void 0){if(i.allowedMax===1&&i.actual>1)return`${t} is played with everyone on their own ball — a “One combined ball” team can’t play it. Use a “Separate balls (a side)” team instead.`;const n=i.allowedMin===i.allowedMax?`exactly ${Z(i.allowedMin)}`:`${i.allowedMin}–${i.allowedMax} players`;return`A ball in ${t} has ${Z(i.actual)} — it needs ${n} per ball.`}break;case"producer_has_scores":return i.message;case"scored_ball_orphaned":return i.message;case"edit_locked_course_route":return"Scores have already been recorded — the course and route are locked for this round.";case"round_complete":return"This round is complete — its setup can no longer be edited.";case"not_editable":return"This round can no longer be edited."}return i.message}function Sr(i){return i?i.type==="flat"?String(i.pct):i.bands.length>0?String(i.bands[0].pct):"100":"100"}function Cr(i){const e={};if(!i||typeof i!="object")return e;for(const[t,s]of Object.entries(i))typeof s=="string"&&(e[t]=s);return e}function Tr(i){const e=i.roundType;if(e==="full_18"||e==="front_9"||e==="back_9")return{preset:e,startHole:Ir(i)};const t=(i.route?.playHoles??[]).map(o=>o.courseHoleNumber),s=t[0]??1,n=new Set(t);return{preset:t.length<=9&&[...n].every(o=>o<=9)?"front_9":t.length<=9&&[...n].every(o=>o>=10)?"back_9":"full_18",startHole:s}}function Ir(i){return i.roundType==="back_9"?10:1}function Er(i,e=()=>""){let t=1,s=1,n=1,r=1;const o=new Map,d=i.producers.map(b=>{const T=t++;o.set(b.producerDefId,T);const j=b.playerRef.kind==="guest";return{key:T,name:e(b.producerDefId),handicapIndex:os(b.handicapIndex),gender:b.gender??"M",teeId:b.teeId,producerDefId:b.producerDefId,...j?{guestPlayerId:b.playerRef.id}:{playerId:b.playerRef.id,genderKnown:b.gender!=null}}}),c=new Map;(i.teams??[]).forEach(b=>{c.set(b.id,s++)});const h=(i.teams??[]).map(b=>{const T=c.get(b.id),j={},M={};for(const L of b.members)if("producerDefId"in L){const B=o.get(L.producerDefId);B!==void 0&&(j[B]=String(L.allowancePct))}else{const B=c.get(L.teamId);B!==void 0&&(M[B]=!0)}return{key:T,kind:b.kind??"single_ball",formation:b.formation??"scramble",pctByPlayer:j,memberTeams:M,autoCreated:!1}}),f=(i.playingGroups??[]).map(b=>{const T={};for(const j of b.members){const M=o.get(j);M!==void 0&&(T[M]=!0)}return{key:n++,startTime:b.startTime??"",startHole:b.startHole??null,members:T}}),m=i.formats.map(b=>{const T={},j={},M=b.subjects;if(M){const L=new Set;for(const B of M)if(B.kind==="player"){const Q=o.get(B.producerDefId);Q!==void 0&&L.add(Q)}else{const Q=c.get(B.teamId);Q!==void 0&&(j[Q]=!0)}for(const B of d)T[B.key]=L.has(B.key)}return{key:r++,formatId:b.formatId,allowancePct:Sr(b.allowanceConfig),subjectPlayers:T,subjectTeams:j,config:Cr(b.formatConfig)}}),{preset:u,startHole:_}=Tr(i);return{courseId:i.courseId,preset:u,startHole:_,players:d,teams:h,groups:f,formatSlots:m,nextKey:t,nextTeamKey:s,nextGroupKey:n,nextSlotKey:r}}const Nr=["scramble","greensomes","foursomes","custom"],we=2,Pr="ABCDEFGH",zr={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class Or{loading=new p(!1);error=new p(null);courses=new p([]);tees=new p([]);courseId=new p("");preset=new p("full_18");startHole=new p(1);players=new p([]);teams=new p([]);groups=new p([]);formatSlots=new p([]);picked=new p([]);customOpen=new p(!1);submitting=new p(!1);diagnostics=new p([]);submitError=new p(null);editToken=new p(null);hasScores=new p(!1);editStatus=new p(null);editBlockedReason=new p(null);editPlayedAt=null;catalog=A.get(pe);nextKey=1;nextSlotKey=1;nextTeamKey=1;nextGroupKey=1;nextPickKey=1;reset(){this.courses.set([]),this.tees.set([]),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.groups.set([]),this.formatSlots.set([]),this.picked.set([]),this.customOpen.set(!1),this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.editToken.set(null),this.hasScores.set(!1),this.editStatus.set(null),this.editBlockedReason.set(null),this.editPlayedAt=null,this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1,this.nextGroupKey=1,this.nextPickKey=1}async load(){this.catalog.load().then(()=>this.ensureDefaultGame());const e=await O(this.loading,this.error,()=>v.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}async loadForEdit(e){this.reset(),this.editToken.set(e),await this.catalog.load();const t=await O(this.loading,this.error,()=>v.friendlyRounds.setup({token:e}));if(!t)return;if(this.editStatus.set(t.status),!t.editable){this.editBlockedReason.set(t.reason);return}if(t.draft.producers.some(c=>"placeholder"in c)){this.editBlockedReason.set("has_open_seats");return}this.hasScores.set(t.hasScores),this.editPlayedAt=t.draft.playedAt;const s=await O(this.loading,this.error,()=>v.setup.courses());s&&this.courses.set(s);const n=await O(this.loading,this.error,()=>v.setup.teesByCourse({courseId:t.draft.courseId}));this.tees.set(n??[]);const r=await O(this.loading,this.error,()=>v.friendlyRounds.balls({token:e})),o=new Map;for(const c of r??[])for(const h of c.players)o.set(h.producerDefId,h.displayName);const d=Er(t.draft,c=>o.get(c)??"");this.courseId.set(d.courseId),this.preset.set(d.preset),this.startHole.set(d.startHole),this.players.set(d.players),this.teams.set(d.teams),this.groups.set(d.groups),this.formatSlots.set(d.formatSlots),this.picked.set([]),this.customOpen.set(!0),this.nextKey=d.nextKey,this.nextTeamKey=d.nextTeamKey,this.nextGroupKey=d.nextGroupKey,this.nextSlotKey=d.nextSlotKey}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const s=await O(this.loading,this.error,()=>v.setup.teesByCourse({courseId:e}))??[];this.tees.set(s);const n=new Set(s.map(o=>o.id)),r=s[0]?.id??"";this.players.set(this.players.get().map(o=>({...o,teeId:n.has(o.teeId)?o.teeId:r}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}]),this.syncGamesToRoster()}addMe(e){this.addFriend(e)}addFriend(e){if(this.hasPlayer(e.id))return;const t=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:e.displayName,handicapIndex:e.handicapIndex===null?"":os(e.handicapIndex),gender:e.gender??"M",genderKnown:e.gender!=null,teeId:t,playerId:e.id}]),this.syncGamesToRoster()}hasPlayer(e){return this.players.get().some(t=>t.playerId===e)}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e)),this.groups.set(this.groups.get().map(t=>{if(t.members[e]===void 0)return t;const s={...t.members};return delete s[e],{...t,members:s}})),this.syncGamesToRoster()}patchPlayer(e,t){this.players.set(this.players.get().map(s=>s.key===e?{...s,...t}:s))}ensureDefaultGame(){if(this.editToken.get()||this.formatSlots.get().length>0||this.picked.get().length>0||this.catalog.byId("stableford_individual")&&(this.pickGame("stableford_individual"),this.formatSlots.get().length>0))return;const e=this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",s={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{},config:this.defaultConfigFor(t)};this.formatSlots.set([...this.formatSlots.get(),s])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}defaultConfigFor(e){return{...this.catalog.byId(e)?.defaults.formatConfig??{}}}setSlotConfig(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{config:{...n.config,[t]:s}})}slotConfigValue(e,t){return this.slotByKey(e)?.config[t.key]??t.default}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(s=>s.key===e?{...s,...t}:s))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t,config:this.defaultConfigFor(t)})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return Pr[e]??`T${e+1}`}presetGames(){return this.catalog.presets()}shapeOfGame(e){const t=this.catalog.byId(e);return t?this.catalog.playableShape(t):null}isIndividualShape(e){return e.size.max===1&&e.count.max===void 0}isIndividualGame(e){const t=this.shapeOfGame(e);return t?this.isIndividualShape(t):!1}minPlayersFor(e){const t=this.shapeOfGame(e);return!t||this.isIndividualShape(t)?0:t.count.min*t.size.min}gameFits(e){return this.players.get().length>=this.minPlayersFor(e)}gameNeedsText(e){const t=this.minPlayersFor(e),s=Math.max(0,t-this.players.get().length);return`Needs ${t} players — add ${s} more.`}gameShapeText(e){const t=this.shapeOfGame(e);if(!t)return"";if(this.isIndividualShape(t))return"Everyone plays their own ball";const s=t.count.max===t.count.min?`${t.count.min} balls`:`${t.count.min}+ balls`,n=t.size.max===1?"one player each":t.size.min===t.size.max?`${t.size.min} players each`:t.size.min===1?"each a player or a team":`${t.size.min}–${t.size.max} players each`;return`${s} · ${n}`}isGamePicked(e){return this.picked.get().some(t=>t.formatId===e)}pickedByKey(e){return this.picked.get().find(t=>t.key===e)??null}gameLabel(e){return this.catalog.labelOf(e)??e}toggleGame(e){const t=this.picked.get().find(s=>s.formatId===e);t?this.unpickGame(t.key):this.pickGame(e)}pickGame(e){const t=this.shapeOfGame(e);if(!t||this.isGamePicked(e)||!this.gameFits(e))return;const s=this.isIndividualShape(t)?null:this.adoptableTeams(t),n=s?{key:this.nextPickKey++,formatId:e,ballCount:s.length,ballByPlayer:this.assignmentFromTeams(s),ballTeams:Object.fromEntries(s.map((r,o)=>[o,r.key]))}:{key:this.nextPickKey++,formatId:e,ballCount:this.isIndividualShape(t)?0:t.count.min,ballByPlayer:this.defaultAssignment(t,this.isIndividualShape(t)?0:t.count.min),ballTeams:{}};this.picked.set([...this.picked.get(),n]),this.regenerateGame(n)}adoptableTeams(e){const t=this.teams.get().filter(n=>n.kind==="multi_ball");if(t.length===0||t.length<e.count.min||e.count.max!==void 0&&t.length>e.count.max)return null;const s=new Set;for(const n of t){const r=this.teamMemberCount(n.key);if(r<e.size.min||r>e.size.max)return null;for(const o of Object.keys(n.pctByPlayer)){if(s.has(Number(o)))return null;s.add(Number(o))}}return t}assignmentFromTeams(e){const t={};for(const s of this.players.get()){const n=e.findIndex(r=>r.pctByPlayer[s.key]!==void 0);n>=0&&(t[s.key]=n)}return t}unpickGame(e){this.picked.set(this.picked.get().filter(t=>t.key!==e)),this.formatSlots.set(this.formatSlots.get().filter(t=>t.gameKey!==e)),this.collectUnreferencedTeams()}collectUnreferencedTeams(){const e=new Set;for(const s of this.formatSlots.get())for(const[n,r]of Object.entries(s.subjectTeams))r&&e.add(Number(n));for(const s of this.picked.get())for(const n of Object.values(s.ballTeams))e.add(n);const t=this.teams.get().filter(s=>!s.autoCreated||e.has(s.key));t.length!==this.teams.get().length&&this.teams.set(t)}defaultAssignment(e,t){const s={};if(t<=0)return s;const n=this.players.get(),r=n.length%t===0?n.length/t:e.size.min,o=Math.max(1,Math.min(r,e.size.max));let d=0;for(let c=0;c<t&&d<n.length;c++)for(let h=0;h<o&&d<n.length;h++,d++)s[n[d].key]=c;return s}gameBalls(e){const t=this.pickedByKey(e);return t?Array.from({length:t.ballCount},(s,n)=>n):[]}ballOf(e,t){const s=this.pickedByKey(e)?.ballByPlayer[t];return s===void 0?null:s}assignBall(e,t,s){const n=this.pickedByKey(e);if(!n)return;const r={...n.ballByPlayer};s===null?delete r[t]:r[t]=s,this.applyGameEdit({...n,ballByPlayer:r})}applyGameEdit(e){this.picked.set(this.picked.get().map(t=>t.key===e.key?e:t)),this.regenerateGame(e),this.syncGamesFromTeams(e.key)}syncGamesFromTeams(e){const t=new Map(this.teams.get().map(r=>[r.key,r])),s=[],n=this.picked.get().map(r=>{if(r.key===e)return r;const o={...r.ballByPlayer};let d=!1;for(const[h,f]of Object.entries(r.ballTeams)){const m=t.get(f);if(!m)continue;const u=Number(h);for(const[_,b]of Object.entries(o)){const T=Number(_);b===u&&m.pctByPlayer[T]===void 0&&(delete o[T],d=!0)}for(const _ of Object.keys(m.pctByPlayer)){const b=Number(_);o[b]!==u&&(o[b]=u,d=!0)}}if(!d)return r;const c={...r,ballByPlayer:o};return s.push(c),c});this.picked.set(n);for(const r of s)this.regenerateGame(r)}forkGame(e){const t=this.pickedByKey(e);if(!t)return;const s=this.teams.get(),n={},r=[];let o=-1;for(const[c,h]of Object.entries(t.ballTeams)){const f=s.findIndex(u=>u.key===h);if(f<0)continue;const m=s[f];r.push({...m,key:this.nextTeamKey++,pctByPlayer:{...m.pctByPlayer},memberTeams:{...m.memberTeams},autoCreated:!0}),n[Number(c)]=r.at(-1).key,f>o&&(o=f)}this.teams.set([...s.slice(0,o+1),...r,...s.slice(o+1)]);const d={...t,ballTeams:n};this.picked.set(this.picked.get().map(c=>c.key===e?d:c)),this.regenerateGame(d)}canAddBall(e){const t=this.pickedByKey(e);if(!t||t.ballCount===0)return!1;const s=this.shapeOfGame(t.formatId);return!!s&&(s.count.max===void 0||t.ballCount<s.count.max)}addBall(e){const t=this.pickedByKey(e);!t||!this.canAddBall(e)||this.applyGameEdit({...t,ballCount:t.ballCount+1})}slotForGame(e){return this.formatSlots.get().find(t=>t.gameKey===e)??null}ballMembers(e,t){const s=this.pickedByKey(e);return s?this.players.get().filter(n=>s.ballByPlayer[n.key]===t):[]}sittingOut(e){const t=this.pickedByKey(e);return!t||t.ballCount===0?[]:this.players.get().filter(s=>t.ballByPlayer[s.key]===void 0)}regenerateGame(e){const t=this.shapeOfGame(e.formatId);if(!t)return;const s=this.players.get(),n={},r={},o=[];let d=this.teams.get();for(let m=0;m<e.ballCount;m++){const u=s.filter(L=>e.ballByPlayer[L.key]===m),_=e.ballTeams[m];if(u.length===0){_!==void 0&&(r[m]=_);continue}if(u.length===1&&t.size.min===1){n[u[0].key]=!0,_!==void 0&&(r[m]=_);continue}const b=d.find(L=>L.key===e.ballTeams[m]),T=Object.fromEntries(u.map(L=>[L.key,b?.pctByPlayer[L.key]??"100"]));if(b){d=d.map(L=>L.key===b.key?{...L,kind:"multi_ball",pctByPlayer:T}:L),r[m]=b.key,o.push(b.key);continue}const j={key:this.nextTeamKey++,kind:"multi_ball",formation:"custom",pctByPlayer:T,memberTeams:{},autoCreated:!0},M=this.lastTeamIndexOf(d,r,e);d=[...d.slice(0,M+1),j,...d.slice(M+1)],r[m]=j.key,o.push(j.key)}if(e.ballCount>0)for(const m of s)n[m.key]===void 0&&(n[m.key]=!1);this.teams.set(d),this.picked.set(this.picked.get().map(m=>m.key===e.key?{...m,ballTeams:r}:m));const c=this.formatSlots.get(),h=c.find(m=>m.gameKey===e.key),f={key:h?.key??this.nextSlotKey++,formatId:e.formatId,allowancePct:h?.allowancePct??"100",subjectPlayers:n,subjectTeams:Object.fromEntries(o.map(m=>[m,!0])),config:h?.config??this.defaultConfigFor(e.formatId),gameKey:e.key};this.formatSlots.set(h?c.map(m=>m.key===f.key?f:m):[...c,f]),this.collectUnreferencedTeams()}lastTeamIndexOf(e,t,s){const n=new Set([...Object.values(t),...Object.values(s.ballTeams)]);let r=e.length-1;for(const[o,d]of e.entries())n.has(d.key)&&(r=o);return r}syncGamesToRoster(){const e=this.players.get(),t=new Set(e.map(n=>n.key)),s=this.picked.get().map(n=>{if(n.ballCount===0)return n;const r=this.shapeOfGame(n.formatId)?.size.min??1,o={};for(const[d,c]of Object.entries(n.ballByPlayer))t.has(Number(d))&&c<n.ballCount&&(o[Number(d)]=c);for(const d of e)if(o[d.key]===void 0){for(let c=0;c<n.ballCount;c++)if(Object.values(o).filter(f=>f===c).length<r){o[d.key]=c;break}}return{...n,ballByPlayer:o}});this.picked.set(s);for(const n of s)this.regenerateGame(n);this.syncGamesFromTeams(-1)}gameWarnings(e){const t=this.pickedByKey(e),s=t?this.shapeOfGame(t.formatId):null;if(!t||!s)return[];const n=this.gameLabel(t.formatId);if(!this.gameFits(t.formatId))return[`${n}: ${this.gameNeedsText(t.formatId)}`];const r=[];for(let o=0;o<t.ballCount;o++){const d=this.ballMembers(e,o).length,c=`${n} ball ${this.teamLetter(o)}`;if(d<s.size.min){const h=s.size.min-d;r.push(`${c} needs ${h} more player${h===1?"":"s"}.`)}else d>s.size.max&&r.push(`${c} takes at most ${s.size.max}.`)}return r}gameSummary(e){const t=this.pickedByKey(e);if(!t)return"";const s=r=>r.name.trim()||"Player",n=[];if(t.ballCount===0)n.push("everyone");else{const r=[];for(let d=0;d<t.ballCount;d++){const c=this.ballMembers(e,d);c.length>0&&r.push(c.map(s).join(" & "))}n.push(r.join(" vs "));const o=this.sittingOut(e);o.length>0&&n.push(`${o.map(s).join(", ")} sitting out`)}return n.push(`${this.slotForGame(e)?.allowancePct??"100"}% allowance`),n.filter(r=>r!=="").join(" · ")}teamsOfGame(e){const t=this.pickedByKey(e);if(!t)return[];const s=this.slotForGame(e)?.subjectTeams??{},n=[];for(let r=0;r<t.ballCount;r++){const o=this.teamByKey(t.ballTeams[r]??-1);o&&s[o.key]&&n.push(o)}return n}gameSharedWith(e){const t=new Set(this.teamsOfGame(e).map(r=>r.key));if(t.size===0)return[];const s=this.slotForGame(e)?.key,n=[];for(const r of this.formatSlots.get()){if(r.key===s)continue;Object.entries(r.subjectTeams).some(([d,c])=>c&&t.has(Number(d)))&&n.push(this.gameLabel(r.formatId))}return n}gameSharesSides(e){return this.gameSharedWith(e).length>0}gameSidesText(e){const t=this.pickedByKey(e);if(!t||this.teamsOfGame(e).length===0)return"";const s=this.slotForGame(e)?.subjectTeams??{},n=[];for(let d=0;d<t.ballCount;d++){const c=this.teamByKey(t.ballTeams[d]??-1);if(c&&s[c.key]){n.push(this.teamLabel(c));continue}const h=this.ballMembers(e,d);h.length>0&&n.push(h.map(f=>f.name.trim()||"Player").join(" & "))}const r=n.join(" vs "),o=this.gameSharedWith(e);return o.length===0?`Sides: ${r}.`:`Sides: ${r} — shared with ${this.joinLabels(o)}.`}joinLabels(e){return e.length<=1?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`}adjustGame(e){this.gameSharesSides(e)&&this.forkGame(e);const t=new Set(Object.values(this.pickedByKey(e)?.ballTeams??{}));this.teams.set(this.teams.get().map(s=>t.has(s.key)?{...s,autoCreated:!1}:s)),this.formatSlots.set(this.formatSlots.get().map(s=>s.gameKey===e?{...s,gameKey:void 0}:s)),this.picked.set(this.picked.get().filter(s=>s.key!==e)),this.customOpen.set(!0)}addCustomGame(){this.customOpen.set(!0);const e=new Set(this.formatSlots.get().map(s=>s.formatId)),t=this.catalog.descriptors.get().find(s=>!e.has(s.id));this.addFormatSlot(t?.id)}showFlexible(){return this.customOpen.get()||this.customSlots().length>0||this.customTeams().length>0}customSlots(){return this.formatSlots.get().filter(e=>e.gameKey===void 0)}customTeams(){const e=this.cardOwnedTeamKeys();return this.teams.get().filter(t=>!e.has(t.key))}cardOwnedTeamKeys(){const e=new Set;for(const t of this.picked.get())for(const s of Object.values(t.ballTeams))e.add(s);return e}slotIndex(e){return this.formatSlots.get().findIndex(t=>t.key===e)}formations=Nr;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{},autoCreated:!1}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,kind:t,memberTeams:t==="single_ball"?{}:s.memberTeams}:s)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,s){const n=this.teamByKey(e);if(!n||n.kind!=="multi_ball"||t===e)return;const r={...n.memberTeams};if(s){if(this.teamMemberCount(e)>=Se)return;r[t]=!0}else delete r[t];this.teams.set(this.teams.get().map(o=>o.key===e?{...o,memberTeams:r}:o))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(s=>t.memberTeams[Number(s)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{let t=!1;const s={...e.subjectTeams};for(const n of this.teams.get())s[n.key]===!0&&!this.teamKindFitsFormat(e.formatId,n.kind)&&(delete s[n.key],t=!0);return t?{...e,subjectTeams:s}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}teamKindFitsFormat(e,t){return this.isSideFormat(e)?t==="multi_ball":t==="single_ball"||this.catalog.acceptsSideSubjects(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const s={...t.memberTeams};return delete s[e],{...t,memberTeams:s}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const s={...t.subjectTeams};return delete s[e],{...t,subjectTeams:s}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.teams.get().findIndex(s=>s.key===e.key);return`Team ${this.teamLetter(Math.max(0,t))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,formation:t}:s))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,s){const n=this.teamByKey(e);if(!n)return;const r={...n.pctByPlayer};if(s){if(r[t]!==void 0||this.teamMemberCount(e)>=Se)return;r[t]=r[t]??"100"}else delete r[t];this.teams.set(this.teams.get().map(o=>o.key===e?{...o,pctByPlayer:r}:o))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=Se}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let s=0;for(const n of this.players.get()){const r=t.pctByPlayer[n.key];if(r===void 0)continue;const o=this.derivedCH(n);if(!o)return null;s+=this.parsePct(r)*o.ch/100}return Math.round(s)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<we)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=we;let s=t;for(const n of this.teams.get())e.memberTeams[n.key]===!0&&n.kind==="single_ball"&&Object.keys(n.pctByPlayer).length>=we&&s++;return s>=we}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,s){const n=this.teamByKey(e);!n||n.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(r=>r.key===e?{...r,pctByPlayer:{...r.pctByPlayer,[t]:s}}:r))}groupsEnabled(){return this.groups.get().length>0}splitIntoGroups(){if(this.groupsEnabled())return;const e={};for(const t of this.players.get())e[t.key]=!0;this.groups.set([{key:this.nextGroupKey++,startTime:"",startHole:null,members:e},{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}clearGroups(){this.groups.set([])}addGroup(){this.groupsEnabled()&&this.groups.set([...this.groups.get(),{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}removeGroup(e){const t=this.groups.get().filter(s=>s.key!==e);this.groups.set(t.length>1?t:[])}groupByKey(e){return this.groups.get().find(t=>t.key===e)??null}groupLabel(e){const t=this.groups.get().findIndex(s=>s.key===e.key);return`Group ${Math.max(0,t)+1}`}groupMemberIn(e,t){return this.groupByKey(e)?.members[t]===!0}setGroupMember(e,t,s){this.groups.set(this.groups.get().map(n=>{const r=n.key===e,o=n.members[t]===!0;if(r&&s&&!o)return{...n,members:{...n.members,[t]:!0}};if(o&&(!r||!s)){const d={...n.members};return delete d[t],{...n,members:d}}return n}))}setGroupStartTime(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startTime:t}:s))}setGroupStartHole(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startHole:t}:s))}groupSize(e){const t=this.groupByKey(e);return t?this.players.get().filter(s=>t.members[s.key]===!0).length:0}ungroupedPlayers(){if(!this.groupsEnabled())return[];const e=new Set;for(const t of this.groups.get())for(const s of Object.keys(t.members))t.members[Number(s)]&&e.add(Number(s));return this.players.get().filter(t=>!e.has(t.key))}crossGroupTeamWarnings(){if(!this.groupsEnabled())return[];const e=new Map;this.groups.get().forEach((s,n)=>{for(const r of Object.keys(s.members))s.members[Number(r)]&&e.set(Number(r),n)});const t=[];for(const s of this.teams.get()){if(s.kind!=="single_ball"||!this.isTeamLive(s))continue;const n=new Set;for(const r of Object.keys(s.pctByPlayer)){const o=e.get(Number(r));o!==void 0&&n.add(o)}n.size>1&&t.push(`${this.teamLabel(s)} plays one combined ball, but its players are in different groups — keep them in the same group.`)}return t}buildGroups(e,t){return this.groups.get().map(s=>({members:e.filter(n=>s.members[n.key]===!0).map(n=>t.get(n.key)),...s.startTime.trim()!==""?{startTime:s.startTime.trim()}:{},...s.startHole!==null?{startHole:s.startHole}:{}})).filter(s=>s.members.length>0)}diagnosticsForGroups(){return this.diagnostics.get().filter(e=>e.path?.startsWith("playingGroups"))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectPlayers:{...n.subjectPlayers,[t]:s}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectTeams:{...n.subjectTeams,[t]:s}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return zr[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,s)=>t-s);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1),this.groups.set(this.groups.get().map(s=>s.startHole!==null&&!t.includes(s.startHole)?{...s,startHole:null}:s))}derivedCH(e){const t=Y(e.handicapIndex);if(t===null)return null;const s=this.teeById(e.teeId);if(!s)return null;const n=s.ratings.find(o=>o.gender===e.gender);if(!n)return null;const r={handicapIndex:t,slope:n.slope,courseRating:n.courseRating,par:n.par};return{ch:Mn(r),raw:Zt(r),rating:n,teeName:s.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}humanizedRoster(){return this.diagnostics.get().filter(e=>e.path==="producers").map(e=>ve(e,t=>this.catalog.labelOf(t)))}humanizedRoute(){return this.diagnostics.get().filter(e=>e.path==="route").map(e=>ve(e,t=>this.catalog.labelOf(t)))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const s of this.formatSlots.get()){for(const n of e)s.subjectPlayers[n.key]!==!1&&t.add(n.key);for(const n of this.teams.get())if(s.subjectTeams[n.key]===!0)for(const r of e)n.pctByPlayer[r.key]!==void 0&&t.add(r.key)}return e.filter(s=>!t.has(s.key))}diagnosticsForFormat(e){return $r(this.diagnostics.get(),e)}humanizedForFormat(e){return this.diagnosticsForFormat(e).map(t=>ve(t,s=>this.catalog.labelOf(s)))}generalDiagnostics(){return kr(this.diagnostics.get())}humanizedGeneral(){return this.generalDiagnostics().map(e=>ve(e,t=>this.catalog.labelOf(t)))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const s=this.liveTeamKeySet(),n=[];for(const r of this.teams.get()){if(!s.has(r.key))continue;const o=e.filter(d=>r.pctByPlayer[d.key]!==void 0).map(d=>({producerDefId:t.get(d.key),allowancePct:this.parsePct(r.pctByPlayer[d.key])}));if(r.kind==="multi_ball")for(const d of this.teams.get())r.memberTeams[d.key]===!0&&d.key!==r.key&&d.kind==="single_ball"&&s.has(d.key)&&o.push({teamId:String(d.key)});n.push({id:String(r.key),label:this.teamLabel(r),formation:r.formation,kind:r.kind,members:o})}return n}buildFormats(e,t){const s=this.liveTeamKeySet();return this.formatSlots.get().map(n=>{const r=this.isSideFormat(n.formatId),o=[];if(!r)for(const d of e)n.subjectPlayers[d.key]!==!1&&o.push({kind:"player",producerDefId:t.get(d.key)});for(const d of this.teams.get())n.subjectTeams[d.key]===!0&&s.has(d.key)&&this.teamKindFitsFormat(n.formatId,d.kind)&&o.push({kind:"team",teamId:String(d.key)});return{formatId:n.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(n.allowancePct)},subjects:o,...Object.keys(n.config).length>0?{formatConfig:{...n.config}}:{}}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),s=e.indexOf(t);return s<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(s),...e.slice(0,s)].map(r=>({courseHoleNumber:r})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}slotSubjectCount(e){const t=this.liveTeamKeySet(),s=this.isSideFormat(e.formatId);let n=0;if(!s)for(const r of this.players.get())e.subjectPlayers[r.key]!==!1&&n++;for(const r of this.teams.get())e.subjectTeams[r.key]===!0&&t.has(r.key)&&this.teamKindFitsFormat(e.formatId,r.kind)&&n++;return n}noSubjectsMessage(e){const t=this.catalog.labelOf(e.formatId)??e.formatId;if(e.gameKey!==void 0)return`${t} has nobody playing — put players on a ball above.`;if(!this.isSideFormat(e.formatId))return`${t} has nothing to score — tick at least one player or team under “Scores”.`;const s=this.teams.get();if(s.some(d=>d.kind==="multi_ball"&&this.isTeamLive(d)))return`${t} has no teams ticked — tick the teams it plays under “Scores”.`;if(s.some(d=>d.kind==="single_ball"&&this.isTeamLive(d)))return`${t} is played between teams whose players play their own balls — a “One combined ball” team doesn’t fit. Under Teams, switch the team to “Separate balls (a side)”, then tick it under “Scores”.`;const n=this.catalog.classifyId(e.formatId),r=n?.teamCount?.min!==void 0&&n.teamCount.min===n.teamCount.max?`${n.teamCount.min} teams`:n?.teamCount?.min!==void 0?`at least ${n.teamCount.min} teams`:"teams",o=n&&n.teamSize.min===n.teamSize.max?` of ${n.teamSize.min} players`:"";return`${t} is a team game — under Teams, create ${r}${o} with kind “Separate balls (a side)”, add the players, then tick the teams under “Scores”.`}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];if(e.forEach((n,r)=>{n.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${r}].name`}),Y(n.handicapIndex)===null&&t.push({code:"missing_index",message:"Handicap index required",path:`producers[${r}].handicapIndex`}),n.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${r}].teeId`})}),this.formatSlots.get().forEach((n,r)=>{this.slotSubjectCount(n)===0&&t.push({code:"no_subjects",message:this.noSubjectsMessage(n),formatIndex:r,path:`formats[${r}]`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};const s=this.editToken.get();this.submitting.set(!0);try{const n=new Map;e.forEach((u,_)=>{n.set(u.key,u.producerDefId??(s?`p-${u.key}`:`p${_+1}`))});const r=[];for(const u of e){const _=Y(u.handicapIndex),b=u.playerId?{kind:"player",id:u.playerId}:u.guestPlayerId?{kind:"guest",id:u.guestPlayerId}:{kind:"guest",id:(await v.guestPlayers.create({displayName:u.name.trim(),gender:u.gender,handicapIndex:_})).id};r.push({producerDefId:n.get(u.key),playerRef:b,handicapIndex:_,gender:u.gender,teeId:u.teeId})}const{roundType:o,route:d}=this.buildRoute(),c=this.buildTeams(e,n),h=this.buildGroups(e,n),f={courseId:this.courseId.get(),playedAt:this.editPlayedAt??new Date().toISOString().slice(0,10),roundType:o,...d?{route:d}:{},producers:r,...c.length>0?{teams:c}:{},formats:this.buildFormats(e,n),...h.length>0?{playingGroups:h}:{}};if(s){const u=await v.friendlyRounds.editSetup({token:s,draft:f});return u.ok?{ok:!0,token:s}:(this.diagnostics.set(u.diagnostics),{ok:!1})}const m=await v.friendlyRounds.create({draft:f});return m.ok?(ae({token:m.friendlyRound.shareToken,courseName:m.round.courseNameSnapshot??"",status:m.round.status,completedAt:m.round.completedAt,lastSeenAt:new Date().toISOString()}),{ok:!0,token:m.friendlyRound.shareToken}):(this.diagnostics.set(m.diagnostics),{ok:!1})}catch(n){return this.submitError.set(n instanceof q?n.message==="Validation failed"?["The server could not read this setup — this should not happen, please report it.",...(n.details??[]).slice(0,3).map(r=>`${r.path}: ${r.message}`)].join(`
`):n.message:s?"Could not save the round. Try again.":"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}class st{loading=new p(!1);error=new p(null);player=new p(null);history=new p([]);clubs=new p([]);saving=new p(!1);saveError=new p(null);async load(e=!1){if(!e&&(this.player.get()!==null||this.loading.get()))return;const t=await O(this.loading,this.error,()=>Promise.all([v.players.me(),v.players.myHandicapHistory(),v.clubs.list()]));if(!t)return;const[s,n,r]=t;this.player.set(s),this.history.set(n),this.clubs.set(r)}clear(){this.player.set(null),this.history.set([]),this.error.set(null),this.saveError.set(null)}async saveIndex(e){return await O(this.saving,this.saveError,()=>v.players.updateHandicap({handicapIndex:e}))?(await this.load(!0),!0):!1}async saveGender(e){const t=await O(this.saving,this.saveError,()=>v.players.updateProfile({gender:e}));return t?(this.player.set(t),!0):!1}async saveHomeClub(e){const t=await O(this.saving,this.saveError,()=>v.players.updateProfile({homeClubId:e}));return t?(this.player.set(t),!0):!1}homeClubName(){const e=this.player.get()?.homeClubId;return e?this.clubs.get().find(t=>t.id===e)?.name??null:null}}function Re(i,e){return i.displayName.localeCompare(e.displayName,"sv",{sensitivity:"base"})}function nt(i,e="frecency"){return e==="alpha"?[...i].sort(Re):[...i].sort((t,s)=>{const n=t.frecency,r=s.frecency,o=n>0,d=r>0;if(o!==d)return o?-1:1;if(!o)return Re(t,s);if(r!==n)return r-n;const c=t.lastPlayedAt?Date.parse(t.lastPlayedAt):NaN,h=s.lastPlayedAt?Date.parse(s.lastPlayedAt):NaN,f=Number.isNaN(c)?Number.NEGATIVE_INFINITY:c,m=Number.isNaN(h)?Number.NEGATIVE_INFINITY:h;return m!==f?m-f:Re(t,s)})}const jr=1440*60*1e3;function Rr(i,e){if(!i)return null;const t=Date.parse(i),s=Date.parse(e);if(Number.isNaN(t)||Number.isNaN(s))return null;const n=Math.floor((s-t)/jr);if(n<=0)return"today";if(n===1)return"yesterday";if(n<7)return`${n} days ago`;if(n<14)return"last week";if(n<30)return`${Math.floor(n/7)} weeks ago`;if(n<60)return"last month";if(n<365)return`${Math.floor(n/30)} months ago`;const r=Math.floor(n/365);return r===1?"last year":`${r} years ago`}function Lr(i,e){if(i.sharedRoundCount<=0)return"never played";const t=Rr(i.lastPlayedAt,e),s=`played ${i.sharedRoundCount}×`;return t?`${s}, ${t}`:s}const ls=2;function It(i){return i.trim().length>=ls}function ds(i){return nt(i,"frecency")}function Dr(i,e){return ds([...i.filter(t=>t.id!==e.id),e])}function Ar(i,e){return i.filter(t=>t.id!==e)}function Et(i,e,t){return i.map(s=>s.id===e?{...s,isFriend:t}:s)}function Hr(i,e,t=()=>{},s=300){let n=0,r;return o=>{const d=o.trim(),c=++n;if(r!==void 0&&clearTimeout(r),r=void 0,d.length<ls){e(d,[]);return}r=setTimeout(()=>{i(d).then(h=>{c===n&&e(d,h)},h=>{c===n&&t(d,h)})},s)}}const cs=Ee("tapscore.friends.sort.v1",{decode:i=>i==="alpha"?"alpha":"frecency",encode:i=>i,empty:"frecency"});function Mr(i=F()){return cs.read(i)}function Fr(i,e=F()){cs.write(i,e)}class Ne{loading=new p(!1);error=new p(null);friends=new p([]);loaded=new p(!1);sortMode=new p(Mr());query=new p("");searching=new p(!1);searchError=new p(null);results=new p([]);resultsFor=new p("");mutating=new p(!1);mutateError=new p(null);runSearch=Hr(e=>v.players.search({q:e}),(e,t)=>{this.searching.set(!1),this.results.set(t),this.resultsFor.set(e)},(e,t)=>{this.searching.set(!1),this.results.set([]),this.resultsFor.set(e),this.searchError.set({code:"network",message:t instanceof Error?t.message:"Search failed. Try again."})});async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;const t=await O(this.loading,this.error,()=>v.friends.list());t&&(this.friends.set(ds(t)),this.loaded.set(!0))}setQuery(e){this.query.set(e),this.searchError.set(null),this.searching.set(e.trim().length>=2),this.runSearch(e)}async add(e){await O(this.mutating,this.mutateError,()=>v.friends.add({friendId:e.id}))&&(this.friends.set(Dr(this.friends.get(),{id:e.id,username:e.username,displayName:e.displayName,gender:e.gender,handicapIndex:e.handicapIndex,homeClubName:e.homeClubName,sharedRoundCount:0,lastPlayedAt:null,frecency:0})),this.results.set(Et(this.results.get(),e.id,!0)))}setSortMode(e){this.sortMode.set(e),Fr(e)}async remove(e){await O(this.mutating,this.mutateError,()=>v.friends.remove({friendId:e}))&&(this.friends.set(Ar(this.friends.get(),e)),this.results.set(Et(this.results.get(),e,!1)))}clear(){this.friends.set([]),this.loaded.set(!1),this.query.set(""),this.results.set([]),this.resultsFor.set(""),this.error.set(null),this.searchError.set(null),this.mutateError.set(null),this.searching.set(!1)}}const Br=["full_18","front_9","back_9"],Le=()=>ne()==="sv"?",":".",Gr=y(`
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
`),Nt=y(`
    <button bind="key" class="hcp-key" type="button">
        <span bind="num" class="hcp-key__num"></span>
        <span bind="lbl" class="hcp-key__lbl"></span>
    </button>
`),qr=y(`
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
`),Kr=y(`
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
`),Vr=y(`
    <div class="fslot__group">
        <span bind="label" class="fslot__label"></span>
        <div bind="options" class="fslot__seg"></div>
    </div>
`),Ur=y(`
    <button bind="opt" type="button"></button>
`),Pt=y(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),Wr=y(`
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
`),Yr=y(`
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
`),Qr=y(`
    <button bind="row" type="button" class="frow">
        <span bind="name" class="frow__name"></span>
        <span bind="username" class="frow__username"></span>
        <span bind="hcp" class="frow__hcp"></span>
    </button>
`),zt=y(`
    <button bind="card" class="gcard" type="button">
        <span bind="name" class="gcard__name"></span>
        <span bind="tag" class="gcard__tag"></span>
        <span bind="shape" class="gcard__shape"></span>
    </button>
`),Xr=y(`
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
`),Jr=y(`
    <div class="grow">
        <span bind="name" class="grow__name"></span>
        <div bind="seg" class="fslot__seg"></div>
    </div>
`),Ot=y(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class Zr extends N{static styles=`
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
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${l("sm")}; font-family: ${a("font-display")};
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
                ${S()}
                display: flex; flex-direction: column; gap: 2px; text-align: left;
                padding: ${l("md")}; font-family: inherit; cursor: pointer;
                /* The inset ring doubles the hairline so a picked card still
                   reads as picked next to a hovered one. */
                &.on {
                    border-color: ${a("primary")}; background: ${a("accent-soft")};
                    box-shadow: inset 0 0 0 1px ${a("primary")};
                }
                &:disabled { opacity: 0.5; cursor: default; }
                &.gcard--custom { grid-column: 1 / -1; }

                & .gcard__name { font-weight: 700; font-size: 0.95rem; }
                & .gcard__tag { font-size: 0.78rem; color: ${a("text-muted")}; line-height: 1.3; }
                & .gcard__shape {
                    font-size: 0.72rem; color: ${a("text-muted")}; line-height: 1.3;
                    &:empty { display: none; }
                }
            }

            & .setup__hint { margin: 0 0 ${l("md")}; color: ${a("text-muted")}; font-size: 0.82rem; }

            & .setup__note {
                margin: ${l("sm")} 0 0; font-size: 0.82rem; color: ${a("text-muted")};
                &:empty { display: none; }
            }

            & .setup__warn {
                margin: ${l("sm")} 0 0; font-size: 0.82rem; color: ${a("error")};
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
                    ${S()}
                    flex: 1; padding: ${l("md")} 0;
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
                & .player__name { ${K()} flex: 1; padding: ${l("md")}; font-size: 1rem; }
                & .player__remove {
                    ${S()}
                    width: 38px; height: 38px; flex-shrink: 0;
                    font-size: 1rem; color: ${a("text-muted")};
                }
                & .player__fields { display: flex; gap: ${l("sm")}; align-items: stretch; }
                & .player__index { ${K()} flex: 1; min-width: 0; padding: ${l("md")}; font-size: 1rem; }
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
                ${S()}
                width: 100%; margin-top: ${l("md")}; padding: ${l("md")};
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }
            & .setup__add.hidden { display: none; }

            & .setup__friends {
                margin-top: ${l("sm")}; padding: ${l("sm")}; ${z()}
                &.hidden { display: none; }

                & .setup__friendrows { display: flex; flex-direction: column; }
                & .setup__hint { margin: ${l("xs")} ${l("sm")}; }
                & .setup__friendrows:not(:empty) + .setup__hint { display: none; }

                & .frow {
                    display: flex; align-items: baseline; gap: ${l("sm")};
                    width: 100%; padding: ${l("md")} ${l("sm")};
                    background: none; border: none; border-bottom: 1px solid ${a("border")};
                    font-family: inherit; text-align: left; cursor: pointer;
                    &:last-child { border-bottom: none; }

                    & .frow__name { font-weight: 600; font-size: 0.95rem; }
                    & .frow__username {
                        flex: 1; min-width: 0; color: ${a("text-muted")}; font-size: 0.8rem;
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }
                    & .frow__hcp {
                        flex-shrink: 0; font-weight: 700; font-size: 0.85rem;
                        color: ${a("accent")}; background: ${a("accent-soft")};
                        border-radius: ${a("radius-pill")}; padding: 2px 10px;
                        font-variant-numeric: tabular-nums;
                    }
                }
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
                    ${S()}
                    width: 38px; height: 38px; flex-shrink: 0;
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
                /* The knob host is a pass-through: its children must sit in the
                   card's own column, or an empty host (the formats declaring no
                   knobs — most of them) would still take a gap. */
                & .fslot__configs { display: contents; }
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
                        & input { ${K()} width: 56px; padding: ${l("xs")} ${l("sm")}; font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${l("xs")};
                    & button {
                        ${S()}
                        flex: 1; padding: ${l("sm")} 0;
                        font-family: inherit; font-weight: 700; font-size: 0.82rem;
                        &.on { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                    }
                }
                & .fslot__err {
                    font-size: 0.82rem; color: ${a("error")};
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
                    ${S()}
                    align-self: flex-start; margin-top: ${l("xs")};
                    padding: ${l("xs")} ${l("sm")};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }
                & .gsummary {
                    margin: 0; padding-top: ${l("xs")}; border-top: 1px solid ${a("border")};
                    font-size: 0.82rem; color: ${a("text-muted")};
                }
                /* Which round teams this game is contested between, and what
                   else is playing them (format-templates §3). Empty for a game
                   with no team-backed ball — and an empty <p> would otherwise
                   still eat one of the card's gaps. */
                & .gsides {
                    margin: 0; font-size: 0.82rem; color: ${a("text-muted")};
                    &:empty { display: none; }
                }
                & .gadjust {
                    ${S()}
                    align-self: flex-start; padding: ${l("xs")} ${l("sm")};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }

                & .grp__start {
                    display: flex; gap: ${l("sm")}; align-items: stretch;
                    & .grp__time { ${K()} flex: 1; min-width: 0; padding: ${l("sm")} ${l("md")}; font-size: 1rem; font-family: inherit; }
                    & .grp__hole { flex: 1; min-width: 0; font-size: 1rem; }
                }
            }

            & .setup__create {
                ${S()}
                width: 100%; padding: ${l("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit;
                background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                box-shadow: ${a("shadow-elevated")};
                &:hover { background: ${a("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            & .setup__cancel {
                ${S()}
                width: 100%; margin-top: ${l("md")}; padding: ${l("md")};
                background: none; font-family: inherit; font-weight: 600; font-size: 0.95rem;
                color: ${a("text-muted")};
                &.hidden { display: none; }
            }

            & .setup__blocked {
                padding: ${l("lg")}; ${z()}
                background: ${a("surface-sunken")}; color: ${a("text-muted")};
                font-size: 0.95rem; margin-bottom: ${l("xl")};
                &.hidden { display: none; }
            }

            & .setup__locknote {
                margin: ${l("sm")} 0 0; font-size: 0.8rem; color: ${a("text-muted")};
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
                background: ${a("surface")};
                border-top-left-radius: 16px; border-top-right-radius: 16px;
                /* Clear the iOS home indicator; harmless zero elsewhere. */
                padding: ${l("sm")} ${l("md")} calc(${l("xl")} + env(safe-area-inset-bottom));
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
            }
            & .hcp__head { display: flex; align-items: center; gap: ${l("md")}; padding: ${l("sm")} ${l("xs")} ${l("md")}; }
            & .hcp__who { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
            & .hcp__name {
                font-family: ${a("font-display")}; font-weight: 600; color: ${a("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .hcp__chline { font-size: 0.78rem; color: ${a("text-muted")}; font-variant-numeric: tabular-nums; }
            & .hcp__val {
                min-width: 72px; text-align: right; color: ${a("text")};
                font-family: ${a("font-display")}; font-weight: 700; font-size: 1.6rem;
                font-variant-numeric: tabular-nums;
                &.empty { color: ${a("text-muted")}; font-weight: 400; font-size: 1rem; }
            }
            & .hcp__bs { ${S()} width: 44px; height: 44px; flex-shrink: 0; font-size: 1.1rem; }
            & .hcp__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
            & .hcp-key {
                ${S()}
                height: 52px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: ${a("font-display")}; font-weight: 700; font-size: 1.2rem;

                & .hcp-key__lbl { font-size: 0.62rem; font-weight: 600; color: ${a("text-muted")}; &:empty { display: none; } }
                &.on {
                    background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")};
                    & .hcp-key__lbl { color: ${a("primary-text")}; }
                }
            }
            & .hcp__actions { display: flex; gap: ${l("sm")}; margin-top: ${l("md")}; }
            & .hcp__cancel { ${S()} flex: 1; padding: ${l("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem; }
            & .hcp__ok {
                ${S()}
                flex: 2; padding: ${l("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem;
                background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")};
                &:hover { background: ${a("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;svc=this.inject(Or);router=this.inject(R);auth=this.inject(H);profile=this.inject(st);friends=this.inject(Ne);pickerOpen=new p(!1);hcpPadFor=new p(null);hcpDraft=new p("");render(){const e=this.router.query("token").get(),t=!!e;this.pickerOpen.set(!1),this.hcpPadFor.set(null),t?this.svc.loadForEdit(e):(this.svc.reset(),this.svc.load()),this.auth.currentUser.get()&&(this.profile.load(),this.friends.load());const s=()=>t&&this.svc.editBlockedReason.get()!==null,n=()=>t&&this.svc.hasScores.get(),r=()=>this.profile.player.get(),o=()=>{const u=r();return this.auth.currentUser.get()!==null&&u!==null&&!this.svc.hasPlayer(u.id)},d=this.wire(Gr,{root:{className:()=>s()?"setup setup--blocked":"setup"},back:{textContent:()=>t?"← Back to round":"← Home",onclick:()=>t&&e?this.router.navigate("/round",{query:{token:e}}):this.router.navigate("/")},title:{textContent:()=>t?"Edit round":"New round"},subtitle:{textContent:()=>t?"Change the setup — scored balls are preserved.":"No sign-in required."},blocked:{className:()=>s()?"setup__blocked":"setup__blocked hidden",textContent:()=>this.svc.editBlockedReason.get()==="round_complete"?"This round is complete — its setup can no longer be edited.":this.svc.editBlockedReason.get()==="no_stored_draft"?"This round didn't come from the setup wizard, so it can't be edited here.":this.svc.editBlockedReason.get()==="has_open_seats"?"This round has open seats waiting to be claimed — the wizard cannot edit it yet.":""},lockNote:{className:()=>n()?"setup__locknote":"setup__locknote hidden"},routeErr:{textContent:()=>this.svc.humanizedRoute().join(`
`)},rosterErr:{textContent:()=>this.svc.humanizedRoster().join(`
`)},cancel:{className:()=>t?"setup__cancel":"setup__cancel hidden",onclick:()=>e&&this.router.navigate("/round",{query:{token:e}})},addPlayer:{onclick:()=>this.svc.addPlayer()},addMe:{className:()=>o()?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>`+ Add me (${r()?.displayName??""})`,onclick:()=>{const u=r();u&&this.svc.addMe({id:u.id,displayName:u.displayName,handicapIndex:u.handicapIndex,gender:u.gender})}},addFriends:{className:()=>this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>this.pickerOpen.get()?"− From friends":"+ From friends",onclick:()=>this.pickerOpen.set(!this.pickerOpen.get())},friendPicker:{className:()=>this.pickerOpen.get()&&this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__friends":"setup__friends hidden"},teamsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},formatsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},addTeam:{onclick:()=>this.svc.addTeam()},splitGroups:{className:()=>this.svc.groupsEnabled()?"setup__add hidden":"setup__add",onclick:()=>this.svc.splitIntoGroups()},addGroup:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.addGroup()},clearGroups:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.clearGroups()},groupNote:{textContent:()=>{const u=this.svc.ungroupedPlayers();return u.length===0?"":`${u.map(b=>b.name.trim()||"A player").join(", ")} ${u.length>1?"aren't":"isn't"} in a group yet — every player needs one.`}},groupWarn:{textContent:()=>[...this.svc.crossGroupTeamWarnings(),...this.svc.diagnosticsForGroups().map(u=>u.message)].join(`
`)},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const u=this.svc.playersInNoFormat();return u.length===0?"":`Heads up: ${u.map(b=>b.name.trim()||"A player").join(", ")} ${u.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.humanizedGeneral(),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?t?"Saving…":"Creating…":t?"Save changes":"Create round",onclick:async()=>{const u=await this.svc.submit();u.ok&&this.router.navigate("/round",{query:{token:u.token}})}},hcpPad:{className:()=>this.hcpPadFor.get()!==null?"hcp":"hcp hidden"},hcpBackdrop:{onclick:()=>this.hcpPadFor.set(null)},hcpName:{textContent:()=>this.hcpPlayer()?.name?.trim()||"Player"},hcpCh:{textContent:()=>{const u=this.hcpPlayer();if(!u)return"";const _=this.svc.derivedCH({...u,handicapIndex:this.hcpDraft.get()});return _?`Course handicap ${_.ch} · ${_.teeName}`:"WHS index — “+” means a plus handicap."}},hcpVal:{className:()=>this.hcpDraft.get()?"hcp__val":"hcp__val empty",textContent:()=>this.hcpDraft.get()||"HCP index"},hcpBack:{onclick:()=>this.hcpDraft.set(this.hcpDraft.get().slice(0,-1))},hcpCancel:{onclick:()=>this.hcpPadFor.set(null)},hcpOk:{disabled:()=>this.hcpDraft.get()!==""&&Y(this.hcpDraft.get())===null,onclick:()=>this.hcpCommit()}}),c=this.ref(d,"hcpKeys");for(const u of["1","2","3","4","5","6","7","8","9"])c.appendChild(this.hcpKey(u,"",()=>this.hcpAppendDigit(u)));c.appendChild(this.wireEl(Nt,{key:{className:()=>this.hcpDraft.get().startsWith("+")?"hcp-key on":"hcp-key",onclick:()=>this.hcpTogglePlus()},num:{textContent:"+"},lbl:{textContent:"plus hcp"}})),c.appendChild(this.hcpKey("0","",()=>this.hcpAppendDigit("0"))),c.appendChild(this.hcpKey(Le(),"",()=>this.hcpAppendSep()));const h=u=>{if(this.hcpPadFor.get()!==null){if(u.key>="0"&&u.key<="9")this.hcpAppendDigit(u.key);else if(u.key===","||u.key===".")this.hcpAppendSep();else if(u.key==="+"||u.key==="-")this.hcpTogglePlus();else if(u.key==="Backspace")this.hcpDraft.set(this.hcpDraft.get().slice(0,-1));else if(u.key==="Enter")this.hcpCommit();else if(u.key==="Escape")this.hcpPadFor.set(null);else return;u.preventDefault()}};document.addEventListener("keydown",h),this.track(()=>document.removeEventListener("keydown",h));const f=this.ref(d,"hcpPad");document.body.appendChild(f),this.track(()=>f.remove()),this.$each(this.ref(d,"presets"),()=>Br,(u,_,b)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(u),className:()=>this.svc.preset.get()===u?"on":"",disabled:()=>n(),onclick:()=>{n()||this.svc.setPreset(u)}}},b),u=>u);const m=u=>this.track(u);return this.mountSelect(this.ref(d,"course"),m,{value:this.bound(m,()=>this.svc.courseId.get(),u=>{u&&u!==this.svc.courseId.get()&&this.svc.selectCourse(u)}),options:{get:()=>{const u=[];let _="";for(const b of this.svc.courses.get())b.clubName!==_&&(u.push({value:`__club:${b.clubName}`,label:b.clubName,disabled:!0}),_=b.clubName),u.push({value:b.id,label:b.name});return u}},placeholder:"Select a course",disabled:{get:()=>n()}}),this.mountSelect(this.ref(d,"startHole"),m,{value:this.bound(m,()=>String(this.svc.startHole.get()),u=>this.svc.startHole.set(Number(u))),options:{get:()=>this.svc.startHoleOptions().map(u=>({value:String(u),label:String(u)}))},disabled:{get:()=>n()}}),this.$each(this.ref(d,"friendRows"),()=>nt(this.friends.friends.get().filter(u=>!this.svc.hasPlayer(u.id)),"frecency"),(u,_,b)=>this.wireEl(Qr,{row:{onclick:()=>this.svc.addFriend({id:u.id,displayName:u.displayName,handicapIndex:u.handicapIndex,gender:u.gender})},name:()=>u.displayName,username:()=>`@${u.username}`,hcp:()=>u.handicapIndex===null?"–":u.handicapIndex.toFixed(1)},b),u=>u.id),this.$each(this.ref(d,"players"),this.svc.players,(u,_,b)=>this.playerRow(u.key,b),u=>u.key),this.$each(this.ref(d,"cards"),()=>[...this.svc.presetGames().map(u=>u.id),"__custom"],(u,_,b)=>u==="__custom"?this.wireEl(zt,{card:{className:()=>"gcard gcard--custom",onclick:()=>this.svc.addCustomGame()},name:{textContent:"+ Custom game"},tag:{textContent:"Anything the cards don't cover — teams and formats by hand."},shape:{textContent:""}},b):this.gameCard(u,b),u=>u),this.$each(this.ref(d,"games"),this.svc.picked,(u,_,b)=>this.gamePanel(u.key,b),u=>u.key),this.$each(this.ref(d,"teams"),()=>this.svc.customTeams(),(u,_,b)=>this.teamCard(u.key,b),u=>u.key),this.$each(this.ref(d,"groups"),this.svc.groups,(u,_,b)=>this.groupCard(u.key,b),u=>u.key),this.$each(this.ref(d,"formats"),()=>this.svc.customSlots(),(u,_,b)=>this.formatCard(u.key,b),u=>u.key),d}mountSelect(e,t,s){const n=new U(s);n.mount(e),t(()=>n.destroy())}bound(e,t,s){const n=new p(t());return e(E(()=>n.set(t()))),e(E(()=>{const r=n.get();queueMicrotask(()=>s(r))})),n}eachInto(e,t,s,n,r){const o=new Map,d=new Map;t(()=>{for(const c of d.values())c.forEach(h=>h());d.clear()}),t(E(()=>{const c=s(),h=new Map;for(const[m,u]of c.entries()){const _=r(u,m);if(o.has(_))h.set(_,o.get(_));else{const b=[];h.set(_,n(u,m,T=>b.push(T))),d.set(_,b)}}for(const[m,u]of o)h.has(m)||(u.remove(),d.get(m)?.forEach(_=>_()),d.delete(m));let f=e.firstChild;for(const m of h.values())m===f?f=f.nextSibling:e.insertBefore(m,f);o.clear();for(const[m,u]of h)o.set(m,u)}))}gameCard(e,t){const s=()=>this.svc.gameFits(e);return this.wireEl(zt,{card:{className:()=>this.svc.isGamePicked(e)?"gcard on":"gcard",disabled:()=>!s(),onclick:()=>this.svc.toggleGame(e)},name:{textContent:()=>this.svc.gameLabel(e)},tag:{textContent:()=>s()?this.svc.catalog.taglineOf(e):this.svc.gameNeedsText(e)},shape:{textContent:()=>s()?this.svc.gameShapeText(e):""}},t)}gamePanel(e,t){const s=()=>this.svc.pickedByKey(e),n=()=>this.svc.slotForGame(e),r=()=>s()?.formatId??"",o=()=>(s()?.ballCount??0)>0,d=this.wireEl(Xr,{title:{textContent:()=>this.svc.gameLabel(r())},remove:{onclick:()=>this.svc.unpickGame(e)},desc:{textContent:()=>this.svc.catalog.byId(r())?.description??""},allowance:{value:n()?.allowancePct??"100",oninput:c=>{const h=n();h&&this.svc.setSlotAllowance(h.key,c.target.value)}},ballGroup:{hidden:()=>!o()},addBall:{className:()=>this.svc.canAddBall(e)?"gaddball":"gaddball hidden",onclick:()=>this.svc.addBall(e)},err:{textContent:()=>{const c=n();return[...this.svc.gameWarnings(e),...c?this.svc.humanizedForFormat(this.svc.slotIndex(c.key)):[]].join(" · ")}},sides:{textContent:()=>this.svc.gameSidesText(e)},fork:{className:()=>this.svc.gameSharesSides(e)?"gadjust":"gadjust hidden",onclick:()=>this.svc.forkGame(e)},summary:{textContent:()=>this.svc.gameSummary(e)},adjust:{onclick:()=>this.svc.adjustGame(e)}},t);return this.eachInto(this.ref(d,"configFields"),t,()=>this.svc.catalog.byId(r())?.configFields??[],(c,h,f)=>{const m=n();if(m)return this.configField(m.key,c,f);const u=document.createElement("div");return u.className="fslot__configs",u},c=>`${r()}:${c.key}`),this.eachInto(this.ref(d,"ballRows"),t,()=>o()?this.svc.players.get():[],(c,h,f)=>this.ballRow(e,c.key,f),c=>c.key),d}ballRow(e,t,s){const n=this.wireEl(Jr,{name:{textContent:()=>this.svc.players.get().find(r=>r.key===t)?.name?.trim()||"Player"}},s);return this.eachInto(this.ref(n,"seg"),s,()=>[...this.svc.gameBalls(e),null],(r,o,d)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>r===null?"–":this.svc.teamLetter(r),className:()=>this.svc.ballOf(e,t)===r?"on":"",onclick:()=>this.svc.assignBall(e,t,r)}},d),r=>String(r)),n}formatCard(e,t){const s=()=>this.svc.slotByKey(e),n=()=>s()?.formatId??"",r=this.wireEl(Kr,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(n())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:d=>this.svc.setSlotAllowance(e,d.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(n())?"applied to each side member’s ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.humanizedForFormat(this.svc.slotIndex(e)).join(" · ")}},t);this.mountSelect(this.ref(r,"format"),t,{value:this.bound(t,()=>n(),d=>{d&&d!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,d)}),options:{get:()=>this.svc.catalog.descriptors.get().map(d=>({value:d.id,label:this.svc.catalog.labelOf(d)??d.label}))}}),this.eachInto(this.ref(r,"configFields"),t,()=>this.svc.catalog.byId(n())?.configFields??[],(d,c,h)=>this.configField(e,d,h),d=>`${n()}:${d.key}`);const o=()=>{const d=this.svc.isSideFormat(n()),c=[];d||c.push(...this.svc.players.get().map(h=>({kind:"player",subKey:h.key})));for(const h of this.svc.customTeams())this.svc.teamKindFitsFormat(n(),h.kind)&&c.push({kind:"team",subKey:h.key});return c};return this.eachInto(this.ref(r,"subjectRows"),t,o,(d,c,h)=>this.subjectRow(e,d.kind,d.subKey,h),d=>`${d.kind}${d.subKey}`),r}configField(e,t,s){const n=this.wireEl(Vr,{label:{textContent:()=>this.svc.catalog.configLabelOf(t)}},s);return this.eachInto(this.ref(n,"options"),s,()=>t.options,(r,o,d)=>this.wireEl(Ur,{opt:{textContent:()=>this.svc.catalog.configLabelOf(r),className:()=>this.svc.slotConfigValue(e,t)===r.value?"on":"",onclick:()=>this.svc.setSlotConfig(e,t.key,r.value)}},d),r=>r.value),n}subjectRow(e,t,s,n){const r=()=>{if(t==="player")return this.svc.players.get().find(h=>h.key===s)?.name?.trim()||"Player";const c=this.svc.teamByKey(s);return c?`${this.svc.teamLabel(c)} (${c.kind==="multi_ball"?"side":"team"})`:"Team"},o=()=>t==="player"?this.svc.subjectPlayerIn(e,s):this.svc.subjectTeamIn(e,s),d=c=>t==="player"?this.svc.setSubjectPlayer(e,s,c):this.svc.setSubjectTeam(e,s,c);return this.wireEl(Pt,{chk:{checked:()=>o(),onchange:c=>d(c.target.checked)},name:{textContent:()=>r()}},n)}groupCard(e,t){const s=this.wireEl(Yr,{remove:{onclick:()=>this.svc.removeGroup(e)},groupName:{textContent:()=>{const n=this.svc.groupByKey(e);return n?this.svc.groupLabel(n):"Group"}},time:{value:this.svc.groupByKey(e)?.startTime??"",oninput:n=>this.svc.setGroupStartTime(e,n.target.value)},meta:{textContent:()=>{const n=this.svc.groupSize(e);return n===0?"Tick the players who walk with this group.":`${n} player${n===1?"":"s"}`}}},t);return this.mountSelect(this.ref(s,"hole"),t,{value:this.bound(t,()=>{const n=this.svc.groupByKey(e)?.startHole;return n==null?"":String(n)},n=>this.svc.setGroupStartHole(e,n===""?null:Number(n))),options:{get:()=>[{value:"",label:"First hole"},...this.svc.startHoleOptions().map(n=>({value:String(n),label:`Hole ${n}`}))]}}),this.eachInto(this.ref(s,"memberRows"),t,()=>this.svc.players.get(),(n,r,o)=>this.groupMemberRow(e,n.key,o),n=>n.key),s}groupMemberRow(e,t,s){return this.wireEl(Pt,{chk:{checked:()=>this.svc.groupMemberIn(e,t),onchange:n=>this.svc.setGroupMember(e,t,n.target.checked)},name:{textContent:()=>this.svc.players.get().find(n=>n.key===t)?.name?.trim()||"Player"}},s)}teamCard(e,t){const s=()=>this.svc.teamKindOf(e)==="multi_ball",n=this.wireEl(Wr,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const r=this.svc.teamByKey(e);return r?this.svc.teamLabel(r):"Team"}},compGroup:{hidden:()=>s()},membersLabel:{textContent:()=>s()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const r=this.svc.teamSize(e);if(r===0)return s()?"Tick at least 2 members — a side needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(r<2)return"Add one more member — a team needs at least 2.";if(s())return`${r} balls · a side (scored together by a side format)`;const o=this.svc.teamBallCh(e);return o===null?`${r} players`:`${r} players · plays off CH ${o}`}}},t);return this.mountSelect(this.ref(n,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),r=>this.svc.setTeamKind(e,r==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"One combined ball"},{value:"multi_ball",label:"Separate balls (a side)"}]}}),this.mountSelect(this.ref(n,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",r=>this.svc.setTeamFormation(e,r)),options:{get:()=>this.svc.formations.map(r=>({value:r,label:r[0].toUpperCase()+r.slice(1)}))}}),this.eachInto(this.ref(n,"memberRows"),t,()=>{const r=this.svc.players.get().map(o=>({kind:"player",mKey:o.key}));if(s())for(const o of this.svc.eligibleNestedTeams(e))r.push({kind:"team",mKey:o.key});return r},(r,o,d)=>r.kind==="player"?this.teamMemberRow(e,r.mKey,d):this.teamNestedRow(e,r.mKey,d),r=>`${r.kind}${r.mKey}`),n}teamNestedRow(e,t,s){const n=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(Ot,{chk:{checked:()=>n(),disabled:()=>!n()&&this.svc.teamAtMaxSize(e),onchange:r=>this.svc.setTeamMemberTeam(e,t,r.target.checked)},name:{textContent:()=>{const r=this.svc.teamByKey(t);return r?`${this.svc.teamLabel(r)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},s)}teamMemberRow(e,t,s){const n=()=>this.svc.players.get().find(o=>o.key===t)??null,r=()=>this.svc.teamMemberIn(e,t);return this.wireEl(Ot,{chk:{checked:()=>r(),disabled:()=>!r()&&this.svc.teamAtMaxSize(e),onchange:o=>this.svc.setTeamMember(e,t,o.target.checked)},name:{textContent:()=>n()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!r()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:o=>this.svc.setTeamPct(e,t,o.target.value)}},s)}hcpPlayer(){const e=this.hcpPadFor.get();return e===null?null:this.svc.players.get().find(t=>t.key===e)??null}openHcpPad(e){this.hcpDraft.set(this.svc.players.get().find(t=>t.key===e)?.handicapIndex??""),this.hcpPadFor.set(e)}hcpAppendDigit(e){const t=this.hcpDraft.get(),[s,n]=t.replace("+","").split(/[.,]/);if(n!==void 0){if(n.length>=1)return}else if(s.length>=2)return;this.hcpDraft.set(t+e)}hcpAppendSep(){const e=this.hcpDraft.get();/[.,]/.test(e)||this.hcpDraft.set(e.replace("+","")===""?`${e}0${Le()}`:e+Le())}hcpTogglePlus(){const e=this.hcpDraft.get();this.hcpDraft.set(e.startsWith("+")?e.slice(1):`+${e.replace("-","")}`)}hcpCommit(){const e=this.hcpPadFor.get();e!==null&&(this.hcpDraft.get()!==""&&Y(this.hcpDraft.get())===null||(this.svc.patchPlayer(e,{handicapIndex:this.hcpDraft.get()}),this.hcpPadFor.set(null)))}hcpKey(e,t,s){return this.wireEl(Nt,{key:{onclick:s},num:{textContent:e},lbl:{textContent:t}})}playerRow(e,t){const s=()=>this.svc.players.get().find(o=>o.key===e)??null,n=()=>this.svc.players.get().findIndex(o=>o.key===e),r=this.wireEl(qr,{name:{value:s()?.name??"",readOnly:()=>!!s()?.playerId,oninput:o=>this.svc.patchPlayer(e,{name:o.target.value})},index:{value:()=>s()?.handicapIndex??"",onclick:()=>this.openHcpPad(e),onfocus:o=>{o.target.blur(),this.openHcpPad(e)}},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const o=s();if(!o)return"";const d=this.svc.derivedCH(o);if(!d)return"";const c=d.rating;return`Course handicap ${d.ch}  ·  ${o.handicapIndex} × ${c.slope}/113 + (${c.courseRating} − ${c.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(n()).map(o=>o.message).join(" · ")}},t);return this.mountSelect(this.ref(r,"gender"),t,{value:this.bound(t,()=>s()?.gender??"M",o=>this.svc.patchPlayer(e,{gender:o})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]},disabled:{get:()=>s()?.genderKnown===!0}}),this.mountSelect(this.ref(r,"tee"),t,{value:this.bound(t,()=>s()?.teeId??"",o=>this.svc.patchPlayer(e,{teeId:o})),options:{get:()=>this.svc.tees.get().map(o=>({value:o.id,label:o.name}))},placeholder:"Tee"}),r}}function us(i,e){return g({method:"POST",url:`${D}/auth/login`,body:{username:i,password:e}})}function eo(){return g({method:"GET",url:`${D}/auth/me`})}function to(){return g({method:"POST",url:`${D}/auth/logout`,body:{}})}const De="Something went wrong on our end. Try again in a moment.";function so(i,e){const t=(i.details??[]).map(n=>n.path),s=n=>t.some(r=>r===`/${n}`);return s("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":s("username")?"Enter your username.":s("displayName")?"Enter a display name.":s("handicapIndex")?"Handicap index must be a number (or leave it empty).":s("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function jt(i,e){if(i instanceof q)switch(i.status){case 400:return so(i,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":De;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return i.status>=500?De:"That request could not be completed."}return i instanceof Error&&i.message==="Request timeout"?"That took too long. Check your connection and try again.":i instanceof Error?"Cannot reach the server. Check your connection and try again.":De}const no=y(`
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
`);class io extends N{static styles=`
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
                    ${K()}
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
                    color: ${a("text-muted")};
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
                        ${S()}
                        padding: ${l("sm")} ${l("lg")};
                        font-size: 0.9rem;
                        font-weight: 700;
                        &.on { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                    }
                }

                /* Direct child only: the submit button. The gender segment and
                   the home-club select bring their own button styling, and a
                   descendant selector here would paint both solid primary. */
                & > button {
                    ${S()}
                    padding: ${l("md")} ${l("lg")};
                    font-size: 1rem;
                    font-weight: 700;
                    background: ${a("primary")};
                    color: ${a("primary-text")};
                    border: none;
                    &:hover { background: ${a("primary")}; }
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
                color: ${a("text-muted")};
                text-decoration: underline;
                cursor: pointer;
            }
        }
    `;auth=this.inject(H);router=this.inject(R);nextQ=this.router.query("next");mode=new p("login");busy=new p(!1);formError=new p("");username="";password="";displayName="";hcp="";gender=new p(null);clubs=new p([]);homeClubId=new p("");clubsRequested=!1;async loadClubs(){if(!this.clubsRequested){this.clubsRequested=!0;try{this.clubs.set(await v.setup.clubs())}catch{}}}destination(e){const t=this.nextQ.get();return t&&t.startsWith("/")?t:e}async submit(){if(this.formError.set(""),this.mode.get()==="login"){if(!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const s=await us(this.username.trim(),this.password);this.auth.currentUser.set(s),this.auth.error.set(null),this.router.navigate(this.destination("/"),!0)}catch(s){this.formError.set(jt(s,"login"))}finally{this.busy.set(!1)}return}const e=this.hcp.trim(),t=e===""?null:Y(e);if(e!==""&&t===null){this.formError.set("Handicap index must be a number (or leave it empty).");return}if(this.password.length<8){this.formError.set("Password must be at least 8 characters.");return}if(!this.username.trim()||!this.displayName.trim()){this.formError.set("Username and display name are required.");return}this.busy.set(!0);try{const s=await v.players.register({username:this.username.trim(),password:this.password,displayName:this.displayName.trim(),handicapIndex:t,gender:this.gender.get(),homeClubId:this.homeClubId.get()||null});this.auth.currentUser.set({id:s.id,username:s.username}),this.router.navigate(this.destination("/"),!0)}catch(s){this.formError.set(jt(s,"register"))}finally{this.busy.set(!1)}}render(){const e=()=>this.mode.get()==="register",t=()=>this.auth.loading.get()||this.busy.get(),s=this.wire(no,{root:{inert:()=>t()},error:{className:()=>this.formError.get()?"error show":"error",textContent:()=>this.formError.get()},form:{onsubmit:async o=>{o.preventDefault(),await this.submit()}},username:{oninput:o=>{this.username=o.target.value}},password:{autocomplete:()=>e()?"new-password":"current-password",oninput:o=>{this.password=o.target.value}},registerFields:{className:()=>e()?"login__register":"login__register hidden"},displayName:{oninput:o=>{this.displayName=o.target.value}},hcp:{oninput:o=>{this.hcp=o.target.value}},submit:{textContent:()=>t()?e()?"Creating account…":"Signing in…":e()?"Create account":"Sign in"},toggle:{textContent:()=>e()?"Have an account? Sign in":"New here? Create an account",onclick:()=>{this.formError.set(""),this.auth.error.set(null);const o=!e();this.mode.set(o?"register":"login"),o&&this.loadClubs()}}}),n=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(s,"gender"),()=>n,(o,d,c)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>o.label,className:()=>this.gender.get()===o.value?"on":"",onclick:()=>this.gender.set(o.value)}},c),o=>o.label);const r=new U({value:this.homeClubId,options:{get:()=>[{value:"",label:"No home club"},...this.clubs.get().map(o=>({value:o.id,label:o.name}))]},placeholder:"No home club"});return r.mount(this.ref(s,"club")),this.track(()=>r.destroy()),s}}const ro=y(`
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
`),oo=y(`
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
`),ao=y(`
    <div class="friend-row">
        <span bind="initials" class="friend-row__badge"></span>
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="subtitle" class="friend-row__subtitle"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="remove" class="friend-row__remove" type="button" aria-label="Remove friend">✕</button>
    </div>
`);function Rt(i){return i.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0].toUpperCase()).join("")}class lo extends N{static styles=`
        .friends {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .friends__anon {
                text-align: center;
                padding: ${l("2xl")} 0;
                color: ${a("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${S()}
                    margin-top: ${l("md")};
                    padding: ${l("md")} ${l("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }

            & .friends__body.hidden { display: none; }

            & .friends__head {
                margin-bottom: ${l("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${l("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
            }

            & .friends__section {
                margin-bottom: ${l("xl")};
                & h2 {
                    margin: 0 0 ${l("sm")};
                    font-family: ${a("font-display")};
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
                border: 1px solid ${a("border")}; border-radius: ${a("radius-pill")};
                overflow: hidden;
                &.hidden { display: none; }

                & .friends__sortbtn {
                    ${S()}
                    font-family: inherit; font-size: 0.78rem; font-weight: 700;
                    padding: ${l("xs")} ${l("md")};
                    background: transparent; color: ${a("text-muted")};
                    border: none; border-radius: 0;

                    &[aria-pressed='true'] {
                        background: ${a("primary")}; color: ${a("primary-text")};
                    }
                }
            }

            & .friends__search {
                ${K()}
                width: 100%;
                padding: ${l("md")} ${l("lg")};
                font-size: 1rem;
            }

            & .friends__hint {
                margin: ${l("sm")} 0 0; font-size: 0.82rem; color: ${a("text-muted")};
                &:empty { display: none; }
            }
            & .friends__err {
                margin: ${l("sm")} 0 0; font-size: 0.85rem; color: ${a("error")};
                &:empty { display: none; }
            }

            & .friends__empty {
                color: ${a("text-muted")}; font-size: 0.9rem; padding: ${l("md")} 0;
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
                ${z()}

                & .friend-row__badge {
                    display: grid; place-items: center;
                    width: 40px; height: 40px; border-radius: 50%;
                    background: ${a("primary")}; color: ${a("primary-text")};
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
                    color: ${a("text-muted")}; font-size: 0.8rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .friend-row__subtitle:empty { display: none; }
                & .friend-row__hcp {
                    font-weight: 700; flex-shrink: 0;
                    color: ${a("accent")}; background: ${a("accent-soft")};
                    border-radius: ${a("radius-pill")};
                    padding: 2px 10px; font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                }
                & .friend-row__add {
                    ${S()}
                    flex-shrink: 0; padding: ${l("sm")} ${l("lg")};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                    &.hidden { display: none; }
                    &:disabled { opacity: 0.5; cursor: default; }
                }
                & .friend-row__added {
                    flex-shrink: 0; font-size: 0.8rem; font-weight: 700;
                    color: ${a("accent")};
                    &.hidden { display: none; }
                }
                & .friend-row__remove {
                    ${S()}
                    width: 34px; height: 34px; flex-shrink: 0;
                    font-size: 0.9rem; color: ${a("text-muted")};
                }
            }
        }
    `;svc=this.inject(Ne);auth=this.inject(H);router=this.inject(R);render(){const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.load();const t=this.wire(ro,{anon:{className:()=>e()?"friends__anon hidden":"friends__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},body:{className:()=>e()?"friends__body":"friends__body hidden"},search:{value:()=>this.svc.query.get(),oninput:n=>this.svc.setQuery(n.target.value)},searchHint:{textContent:()=>{const n=this.svc.query.get().trim();return n.length>0&&!It(n)?"Type at least 2 characters.":this.svc.searching.get()?"Searching…":""}},searchErr:{textContent:()=>this.svc.searchError.get()?.message??""},resultsEmpty:{className:()=>{const n=this.svc.query.get().trim();return It(n)&&!this.svc.searching.get()&&this.svc.searchError.get()===null&&this.svc.resultsFor.get()===n&&this.svc.results.get().length===0?"friends__empty":"friends__empty hidden"}},friendsEmpty:{className:()=>this.svc.loaded.get()&&this.svc.friends.get().length===0?"friends__empty":"friends__empty hidden"},sortToggle:{className:()=>this.svc.friends.get().length>0?"friends__sort":"friends__sort hidden"},sortFrecency:{"aria-pressed":()=>String(this.svc.sortMode.get()==="frecency"),onclick:()=>this.svc.setSortMode("frecency")},sortAlpha:{"aria-pressed":()=>String(this.svc.sortMode.get()==="alpha"),onclick:()=>this.svc.setSortMode("alpha")}});this.$each(this.ref(t,"results"),this.svc.results,(n,r,o)=>this.wireEl(oo,{initials:()=>Rt(n.displayName),name:()=>n.displayName,username:()=>n.homeClubName?`@${n.username} · ${n.homeClubName}`:`@${n.username}`,hcp:()=>n.handicapIndex===null?"–":n.handicapIndex.toFixed(1),add:{className:()=>this.isFriendNow(n.id)?"friend-row__add hidden":"friend-row__add",disabled:()=>this.svc.mutating.get(),onclick:()=>{const d=this.svc.results.get().find(c=>c.id===n.id);d&&!d.isFriend&&this.svc.add(d)}},added:{className:()=>this.isFriendNow(n.id)?"friend-row__added":"friend-row__added hidden"}},o),n=>n.id);const s=new Date().toISOString();return this.$each(this.ref(t,"friends"),()=>nt(this.svc.friends.get(),this.svc.sortMode.get()),(n,r,o)=>this.wireEl(ao,{initials:()=>Rt(n.displayName),name:()=>n.displayName,subtitle:()=>{const d=this.svc.friends.get().find(c=>c.id===n.id)??n;return Lr(d,s)},hcp:()=>n.handicapIndex===null?"–":n.handicapIndex.toFixed(1),remove:{disabled:()=>this.svc.mutating.get(),onclick:()=>{this.svc.remove(n.id)}}},o),n=>n.id),t}isFriendNow(e){return this.svc.results.get().find(t=>t.id===e)?.isFriend===!0}}const co=y(`
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

            <button bind="admin" class="profile__admin" type="button">Admin</button>
            <button bind="signout" class="profile__signout" type="button">Sign out</button>
        </div>
    </div>
`),uo=y(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`);class ho extends N{static styles=`
        .profile {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .profile__anon {
                text-align: center;
                padding: ${l("2xl")} 0;
                color: ${a("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${S()}
                    margin-top: ${l("md")};
                    padding: ${l("md")} ${l("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }

            & .profile__body.hidden { display: none; }

            & .profile__head {
                margin-bottom: ${l("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${l("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
            }

            & .profile__card {
                padding: ${l("lg")};
                margin-bottom: ${l("xl")};
                ${z()}

                & .profile__label {
                    font-weight: 700; font-size: 0.8rem;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    color: ${a("text-muted")};
                }
                & .profile__hcp-row {
                    display: flex; align-items: center; gap: ${l("md")};
                    margin-top: ${l("sm")};
                }
                & .profile__hcp {
                    font-family: ${a("font-display")};
                    font-weight: 700; font-size: 2rem;
                    font-variant-numeric: tabular-nums;
                    color: ${a("text")};
                }
                & .profile__edit {
                    display: flex; gap: ${l("sm")}; flex: 1; justify-content: flex-end;
                    & input { ${K()} width: 90px; padding: ${l("md")}; font-size: 1rem; text-align: center; }
                    & button {
                        ${S()}
                        padding: ${l("md")} ${l("lg")}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700;
                        background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
                & .profile__hint { margin: ${l("sm")} 0 0; font-size: 0.8rem; color: ${a("text-muted")}; }
                & .profile__err {
                    margin: ${l("sm")} 0 0; font-size: 0.85rem; color: ${a("error")};
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
                        ${S()}
                        flex: 1;
                        padding: ${l("sm")} 0;
                        font-family: inherit;
                        font-size: 0.9rem;
                        font-weight: 700;
                        &.on { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
            }

            & .profile__section {
                & h2 {
                    margin: 0 0 ${l("sm")};
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .profile__empty {
                color: ${a("text-muted")}; font-size: 0.9rem; padding: ${l("md")} 0;
                &.hidden { display: none; }
            }

            & .profile__history { display: flex; flex-direction: column; gap: ${l("sm")}; }

            & .hcp-entry {
                display: flex; align-items: baseline; gap: ${l("md")};
                padding: ${l("md")} ${l("lg")};
                ${z()}

                & .hcp-entry__index {
                    font-weight: 700; font-size: 1.05rem;
                    font-variant-numeric: tabular-nums;
                    width: 52px;
                }
                & .hcp-entry__source {
                    font-size: 0.7rem; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    border-radius: ${a("radius-pill")};
                    padding: 2px 10px;
                    background: ${a("accent-soft")}; color: ${a("accent")};
                }
                & .hcp-entry__date {
                    margin-left: auto;
                    color: ${a("text-muted")}; font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                }
            }

            /* Only rendered for a super admin — the entry point to /admin. */
            & .profile__admin {
                display: block;
                width: 100%;
                margin-top: ${l("xl")};
                padding: ${l("md")} ${l("lg")};
                background: ${a("surface-sunken")};
                border: none; border-radius: ${a("radius")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                color: ${a("text")};
                cursor: pointer;

                &.hidden { display: none; }
            }

            & .profile__signout {
                display: block;
                margin: ${l("2xl")} auto 0;
                padding: ${l("sm")} ${l("lg")};
                background: none; border: none; font-family: inherit;
                font-size: 0.85rem; font-weight: 600;
                color: ${a("text-muted")};
                text-decoration: underline; cursor: pointer;
            }
        }
    `;svc=this.inject(st);friends=this.inject(Ne);admins=this.inject(Xe);auth=this.inject(H);router=this.inject(R);indexDraft=new p("");localErr=new p("");render(){this.auth.currentUser.get()&&(this.svc.load(),this.admins.loadRoles());const e=()=>this.auth.currentUser.get()!==null,t=this.wire(co,{anon:{className:()=>e()?"profile__anon hidden":"profile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/profile"}})},body:{className:()=>e()?"profile__body":"profile__body hidden"},name:()=>this.svc.player.get()?.displayName??"…",username:()=>{const o=this.svc.player.get();return o?`@${o.username}`:""},hcp:()=>{const o=this.svc.player.get()?.handicapIndex;return o==null?"–":o<0?`+${(-o).toFixed(1)}`:o.toFixed(1)},index:{value:()=>this.indexDraft.get(),oninput:o=>this.indexDraft.set(o.target.value)},save:{disabled:()=>this.svc.saving.get()||this.indexDraft.get().trim()==="",textContent:()=>this.svc.saving.get()?"Saving…":"Save"},form:{onsubmit:async o=>{o.preventDefault(),this.localErr.set("");const d=Y(this.indexDraft.get());if(d===null||d<-10||d>54){this.localErr.set("Enter an index between +10 and 54 (use “+” for a plus handicap).");return}await this.svc.saveIndex(d)&&this.indexDraft.set("")}},saveErr:{textContent:()=>this.localErr.get()||this.svc.saveError.get()?.message||""},genderErr:{textContent:()=>this.svc.saveError.get()?.message||""},clubErr:{textContent:()=>this.svc.saveError.get()?.message||""},historyEmpty:{className:()=>this.svc.history.get().length===0?"profile__empty":"profile__empty hidden"},admin:{className:()=>this.admins.isSuperAdmin()?"profile__admin":"profile__admin hidden",onclick:()=>this.router.navigate("/admin")},signout:{onclick:async()=>{await this.auth.logout(),this.svc.clear(),this.friends.clear(),this.admins.clear(),this.router.navigate("/")}}});this.$each(this.ref(t,"history"),this.svc.history,(o,d,c)=>this.wireEl(uo,{index:()=>o.handicapIndex.toFixed(1),source:()=>o.source,date:()=>o.effectiveDate},c),o=>o.id);const s=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(t,"gender"),()=>s,(o,d,c)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>o.label,className:()=>this.svc.player.get()?.gender===o.value?"on":"",disabled:()=>this.svc.saving.get(),onclick:()=>{this.svc.saveGender(o.value)}}},c),o=>o.label);const n=new p(this.svc.player.get()?.homeClubId??"");this.track(E(()=>n.set(this.svc.player.get()?.homeClubId??""))),this.track(E(()=>{const o=n.get();queueMicrotask(()=>{o!==(this.svc.player.get()?.homeClubId??"")&&this.svc.saveHomeClub(o===""?null:o)})}));const r=new U({value:n,options:{get:()=>[{value:"",label:"No home club"},...this.svc.clubs.get().map(o=>({value:o.id,label:o.name}))]},placeholder:"No home club",disabled:{get:()=>this.svc.saving.get()}});return r.mount(this.ref(t,"club")),this.track(()=>r.destroy()),t}}const po=y(`
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
`),mo=y(`
    <div class="stat">
        <span bind="value" class="stat__value"></span>
        <span bind="label" class="stat__label"></span>
    </div>
`),fo=y(`
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
`),go=y(`
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
`),bo={not_started:"Not started",active:"Playing",complete:"Done"};function yo(i){const e=[`${i.participants.length} players`,`${i.scoreEventCount} scores`];return i.lastEventAt?e.push(`last ${i.lastEventAt.replace("T"," ").slice(0,16)}`):e.push("never played"),e.join(" · ")}function _o(i){const e=[`@${i.username}`,`${i.roundCount} rounds`];return i.lastRoundDate&&e.push(`last ${i.lastRoundDate}`),i.handicapIndex!==null&&e.push(`hcp ${i.handicapIndex}`),i.deletedAt&&e.push("DELETED"),e.join(" · ")}class vo extends N{static styles=`
        .admin {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .admin__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${a("text-muted")};
                cursor: pointer; padding: ${l("xs")} 0; margin-bottom: ${l("md")};
            }

            & .admin__title {
                margin: 0 0 ${l("lg")};
                font-family: ${a("font-display")};
                font-weight: 600; font-size: 1.8rem; letter-spacing: -0.02em;
                color: ${a("text")};
            }

            & .admin__denied {
                color: ${a("text-muted")}; font-size: 0.9rem;
                &.hidden { display: none; }
                & code {
                    display: block; margin-top: ${l("xs")};
                    font-size: 0.8rem; word-break: break-all;
                }
            }
            & .admin__denied-hint { color: ${a("text-muted")}; }
            & .admin__body.hidden { display: none; }

            & .admin__stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
                gap: ${l("sm")};
                margin-bottom: ${l("lg")};

                & .stat {
                    ${z({})}
                    display: flex; flex-direction: column; gap: 2px;
                    padding: ${l("sm")} ${l("md")};

                    & .stat__value {
                        font-family: ${a("font-display")};
                        font-size: 1.4rem; font-weight: 700; color: ${a("text")};
                    }
                    & .stat__label {
                        font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
                        text-transform: uppercase; color: ${a("text-muted")};
                    }
                }
            }

            & .admin__tabs {
                display: flex; gap: ${l("sm")}; margin-bottom: ${l("md")};

                & button {
                    ${S()}
                    flex: 1;
                    padding: ${l("sm")} ${l("md")};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
                    background: ${a("surface-sunken")}; color: ${a("text-muted")};
                    border: none; cursor: pointer;

                    &.active { background: ${a("primary")}; color: ${a("primary-text")}; }
                }
            }

            & .admin__loading {
                color: ${a("text-muted")}; font-size: 0.9rem; padding: ${l("lg")} 0;
                &.hidden { display: none; }
            }

            & .admin__list {
                display: flex; flex-direction: column; gap: ${l("sm")};
                &.hidden { display: none; }
            }

            & .admin-row {
                ${z({hover:!0})}
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
                    font-weight: 700; font-size: 1rem; color: ${a("text")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }

                & .admin-row__sub {
                    font-size: 0.8rem; color: ${a("text-muted")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .admin-row__meta { font-variant-numeric: tabular-nums; }

                & .admin-row__actions {
                    display: flex; justify-content: flex-end; margin-top: ${l("xs")};
                    & button {
                        ${S()}
                        padding: ${l("xs")} ${l("md")};
                        font-family: inherit; font-size: 0.75rem; font-weight: 700;
                        background: ${a("surface-sunken")}; color: ${a("text-muted")};
                        border: none; cursor: pointer;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
            }

            & .admin-chip {
                flex-shrink: 0;
                font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.08em; border-radius: ${a("radius-pill")};
                padding: 2px 10px;
                background: ${a("surface-sunken")}; color: ${a("text-muted")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(Xe);auth=this.inject(H);router=this.inject(R);tab=new p("rounds");grantOpen=new p(!1);grantTarget=new p(null);mutating=new p(!1);denied=new k(()=>this.auth.currentUser.get()===null||!this.svc.isSuperAdmin());render(){this.svc.loadRoles().then(()=>{this.svc.isSuperAdmin()&&this.svc.load()});const e=this.wire(po,{back:{onclick:()=>this.router.navigate("/")},denied:{className:()=>this.denied.get()?"admin__denied":"admin__denied hidden"},body:{className:()=>this.denied.get()?"admin__body hidden":"admin__body"},loading:{className:()=>this.svc.loading.get()?"admin__loading":"admin__loading hidden"},tabRounds:{className:()=>this.tab.get()==="rounds"?"active":"",onclick:()=>this.tab.set("rounds")},tabPlayers:{className:()=>this.tab.get()==="players"?"active":"",onclick:()=>this.tab.set("players")},roundList:{className:()=>this.tab.get()==="rounds"?"admin__list":"admin__list hidden"},playerList:{className:()=>this.tab.get()==="players"?"admin__list":"admin__list hidden"}}),t=new k(()=>{const s=this.svc.stats.get();return s?[{key:"rounds",label:"Rounds",value:s.rounds},{key:"active",label:"Playing",value:s.roundsActive},{key:"week",label:"Last 7d",value:s.roundsLast7Days},{key:"players",label:"Players",value:s.players},{key:"guests",label:"Guests",value:s.guests},{key:"scores",label:"Scores",value:s.scoreEvents}]:[]});return this.$each(this.ref(e,"stats"),t,(s,n,r)=>this.wireEl(mo,{value:()=>String(s.value),label:()=>s.label},r),s=>s.key),this.$each(this.ref(e,"roundList"),this.svc.rounds,(s,n,r)=>this.wireEl(fo,{row:{disabled:()=>s.shareToken===null,onclick:()=>{s.shareToken&&this.router.navigate("/round",{query:{token:s.shareToken}})}},course:()=>s.courseName??"Unknown course",status:()=>bo[s.status],who:()=>{const o=s.creatorName?`by ${s.creatorName}`:"by a guest",d=s.participants.join(", ");return d?`${o} — ${d}`:o},meta:()=>`${s.date} · ${yo(s)}`},r),s=>s.roundId),this.$each(this.ref(e,"playerList"),this.svc.players,(s,n,r)=>this.wireEl(go,{name:()=>s.displayName,roleChip:()=>s.roles.includes("super_admin")?"admin":"",meta:()=>_o(s),toggle:{textContent:()=>s.roles.includes("super_admin")?"Revoke admin":"Make admin",disabled:()=>this.mutating.get(),onclick:()=>{this.grantTarget.set(s),this.grantOpen.set(!0)}}},r),s=>s.playerId),this.spawn(V,this.ref(e,"confirmHost"),{open:this.grantOpen,title:()=>this.grantTarget.get()?.roles.includes("super_admin")?"Revoke admin?":"Make admin?",message:()=>{const s=this.grantTarget.get();return s?s.roles.includes("super_admin")?`Remove the super admin role from ${s.displayName}?`:`Give ${s.displayName} the super admin role? They will be able to see every player's rounds.`:""},confirmLabel:"Confirm",cancelLabel:"Cancel",onconfirm:()=>{const s=this.grantTarget.get();s&&this.toggleAdmin(s)}}),e}async toggleAdmin(e){this.mutating.set(!0);try{const t={playerId:e.playerId,role:"super_admin"};e.roles.includes("super_admin")?await v.admin.adminRevokeRole(t):await v.admin.adminGrantRole(t),await this.svc.load(!0)}finally{this.mutating.set(!1)}}}function wo(i,e){return i?e!==null&&i.ownerPlayerId===e?!0:i.rounds.some(t=>typeof t.shareToken=="string"):!1}class se{list=new p([]);listLoading=new p(!1);listError=new p(null);listLoaded=new p(!1);detail=new p(null);detailId=new p(null);detailLoading=new p(!1);detailError=new p(null);participants=new p([]);board=new p(null);boardRefusal=new p(null);boardLoading=new p(!1);results=new p(null);resultsRefusal=new p(null);mutating=new p(!1);mutateError=new p(null);async loadList(e=!1){if(!e&&(this.listLoaded.get()||this.listLoading.get()))return;const t=await O(this.listLoading,this.listError,()=>v.competitions.list());t&&(this.list.set(t),this.listLoaded.set(!0))}async loadDetail(e,t=!1){if(!t&&this.detailId.get()===e&&this.detail.get()!==null&&!this.detailLoading.get()||this.detailLoading.get()&&this.detailId.get()===e)return;this.detailId.set(e);const s=await O(this.detailLoading,this.detailError,()=>Promise.all([v.competitions.get({id:e}),v.competitions.participants({competitionId:e})]));if(!s)return;const[n,r]=s;this.detailId.get()===e&&(this.detail.set(n),this.participants.set(r),await this.loadBoard(e),n.lifecycle==="finalized"&&await this.loadResults(e))}async loadBoard(e){this.boardLoading.set(!0);try{const t=await v.competitions.leaderboard({id:e});t.ok?(this.board.set(t.value),this.boardRefusal.set(null)):(this.board.set(null),this.boardRefusal.set(t.refusal.message))}catch{this.board.set(null),this.boardRefusal.set(null)}finally{this.boardLoading.set(!1)}}async loadResults(e){try{const t=await v.competitions.results({id:e});t.ok?(this.results.set(t.value),this.resultsRefusal.set(null)):(this.results.set(null),this.resultsRefusal.set(t.refusal.message))}catch{this.results.set(null)}}async create(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.create({name:e});return this.list.set([t,...this.list.get()]),t}catch(t){return this.mutateError.set(ee(t)),null}finally{this.mutating.set(!1)}}transition(e,t){return this.mutate(()=>v.competitions.transition({id:e,to:t}),()=>this.loadDetail(e,!0))}updateConfig(e){return this.mutate(()=>v.competitions.update(e),()=>this.loadDetail(e.id,!0))}async addPlayer(e,t,s){return this.rosterMutate(e,()=>v.competitions.addParticipant({competitionId:e,playerId:t,category:s}))}async addGuest(e,t,s){this.mutating.set(!0),this.mutateError.set(null);let n;try{n=(await v.guestPlayers.create(t)).id}catch(r){return this.mutating.set(!1),this.mutateError.set(ee(r)),ee(r)}return this.mutating.set(!1),this.rosterMutate(e,()=>v.competitions.addParticipant({competitionId:e,guestPlayerId:n,category:s}))}removeParticipant(e,t){return this.rosterMutate(e,()=>v.competitions.removeParticipant({participantId:t}))}withdrawParticipant(e,t){return this.rosterMutate(e,()=>v.competitions.withdrawParticipant({participantId:t}))}async createRound(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.createRound(e);if(t.ok)return await this.loadDetail(e.id,!0),{ok:!0,shareToken:t.shareToken};const s="refusal"in t?t.refusal.message:t.diagnostics.map(n=>n.message).join(" · ");return this.mutateError.set(s),{ok:!1,message:s}}catch(t){const s=ee(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}async applyCut(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.applyCut({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const s=ee(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}async finalize(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.finalize({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const s=ee(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}clear(){this.list.set([]),this.listLoaded.set(!1),this.detail.set(null),this.detailId.set(null),this.participants.set([]),this.board.set(null),this.boardRefusal.set(null),this.results.set(null),this.resultsRefusal.set(null),this.listError.set(null),this.detailError.set(null),this.mutateError.set(null)}async mutate(e,t){this.mutating.set(!0),this.mutateError.set(null);try{const s=await e();return s.ok?(await t(),null):(this.mutateError.set(s.refusal.message),s.refusal.message)}catch(s){const n=ee(s);return this.mutateError.set(n),n}finally{this.mutating.set(!1)}}rosterMutate(e,t){return this.mutate(t,async()=>{const s=await v.competitions.participants({competitionId:e});this.participants.set(s)})}}function ee(i){return i&&typeof i=="object"&&"message"in i&&typeof i.message=="string"?i.message:"Something went wrong. Try again."}function hs(i){switch(i){case"draft":return"Draft";case"setup":return"Setup";case"active":return"Live";case"finalized":return"Finalized"}}function ps(i){return`comp-chip comp-chip--${i}`}function Ae(i){switch(i){case"draft":return{to:"setup",label:"Open setup"};case"setup":return{to:"active",label:"Start competition"};default:return null}}function qe(i){return i==="draft"||i==="setup"}function xo(i){return i==="setup"||i==="active"}const $o=y(`
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
`),ko=y(`
    <button bind="row" type="button" class="comp-row">
        <span bind="name" class="comp-row__name"></span>
        <span bind="chip"></span>
    </button>
`);class So extends N{static styles=`
        .comps {
            padding: ${l("xl")} ${l("lg")} ${l("2xl")};

            & .comps__head {
                margin-bottom: ${l("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${l("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
            }

            & .comps__anon {
                text-align: center;
                padding: ${l("2xl")} 0;
                color: ${a("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${S()}
                    margin-top: ${l("md")};
                    padding: ${l("md")} ${l("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }
            & .comps__body.hidden { display: none; }

            & .comps__create {
                display: flex;
                gap: ${l("sm")};
                margin-bottom: ${l("md")};
                & input { ${K()} flex: 1; padding: ${l("md")}; font-size: 1rem; }
                & button {
                    ${S()}
                    padding: ${l("md")} ${l("lg")};
                    font-family: inherit; font-size: 0.95rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
            & .comps__err {
                margin: 0 0 ${l("md")}; font-size: 0.85rem; color: ${a("error")};
                &:empty { display: none; }
            }

            & .comps__loading, & .comps__empty {
                color: ${a("text-muted")}; font-size: 0.9rem; padding: ${l("lg")} 0;
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
                ${z({hover:!0})}
                cursor: pointer;

                & .comp-row__name {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${a("text")};
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
                border-radius: ${a("radius-pill")};
                padding: 2px 10px;
                background: ${a("surface-sunken")};
                color: ${a("text-muted")};

                &.comp-chip--setup { background: ${a("accent-soft")}; color: ${a("accent")}; }
                &.comp-chip--active { background: ${a("primary")}; color: ${a("primary-text")}; }
                &.comp-chip--finalized { background: ${a("accent")}; color: ${a("topbar-bg")}; }
            }
        }
    `;svc=this.inject(se);auth=this.inject(H);router=this.inject(R);loggedIn=new k(()=>this.auth.currentUser.get()!==null);nameDraft=new p("");render(){this.loggedIn.get()&&this.svc.loadList();const e=this.wire($o,{anon:{className:()=>this.loggedIn.get()?"comps__anon hidden":"comps__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/competitions"}})},body:{className:()=>this.loggedIn.get()?"comps__body":"comps__body hidden"},nameInput:{value:()=>this.nameDraft.get(),oninput:t=>this.nameDraft.set(t.target.value)},createBtn:{disabled:()=>this.svc.mutating.get()||this.nameDraft.get().trim()==="",textContent:()=>this.svc.mutating.get()?"Creating…":"Create"},createForm:{onsubmit:async t=>{t.preventDefault();const s=this.nameDraft.get().trim();if(s==="")return;const n=await this.svc.create(s);n&&(this.nameDraft.set(""),this.router.navigate("/competition",{query:{id:n.id}}))}},createErr:{textContent:()=>this.svc.mutateError.get()??""},loading:{className:()=>this.svc.listLoading.get()&&!this.svc.listLoaded.get()?"comps__loading":"comps__loading hidden"},empty:{className:()=>this.svc.listLoaded.get()&&this.svc.list.get().length===0?"comps__empty":"comps__empty hidden"}});return this.$each(this.ref(e,"list"),this.svc.list,(t,s,n)=>this.wireEl(ko,{row:{onclick:()=>this.router.navigate("/competition",{query:{id:t.id}})},name:()=>t.name,chip:{textContent:()=>hs(t.lifecycle),className:()=>ps(t.lifecycle)}},n),t=>t.id),e}}class Co{loading=new p(!1);error=new p(null);descriptors=new p([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await O(this.loading,this.error,()=>v.setup.aggregations());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=ne()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:typeof e=="string"?e:""}}function To(i,e){const t={};for(const s of i){const n=e[s.key];t[s.key]=n!=null?String(n):String(s.default)}return t}function Io(i,e){const t={};for(const s of i){const n=e[s.key]??String(s.default);t[s.key]=s.kind==="integer"?Number.parseInt(n,10)||Number(s.default):n}return t}class fe{competitions=A.get(se);formats=A.get(pe);aggregations=A.get(Co);friends=A.get(Ne);profile=A.get(st);auth=A.get(H);router=A.get(R);id=this.router.query("id");admin=new k(()=>wo(this.competitions.detail.get(),this.profile.player.get()?.id??null));lifecycle=new k(()=>this.competitions.detail.get()?.lifecycle??"draft");editingSetup=new p(!1);nameDraft=new p("");slotDraft=new p([]);aggregationStrategy=new p("");aggregationValues=new p({});startListDraft=new p("single_group");courseDraft=new p("");teeDraft=new p("");cutAfterDraft=new p("");cutTypeDraft=new p("");cutValueDraft=new p("");formatPickDraft=new p("");guestNameDraft=new p("");guestGenderDraft=new p("M");guestHcpDraft=new p("");roundCourseDraft=new p("");roundDateDraft=new p("");courses=new p([]);tees=new p([]);resultSetIndex=new p(0);cutOutcome=new p(null);cutConfirmOpen=new p(!1);finalizeConfirmOpen=new p(!1);coursesLoaded=!1;enter(){this.editingSetup.set(!1),this.nameDraft.set(""),this.slotDraft.set([]),this.aggregationStrategy.set(""),this.aggregationValues.set({}),this.startListDraft.set("single_group"),this.courseDraft.set(""),this.teeDraft.set(""),this.tees.set([]),this.cutAfterDraft.set(""),this.cutTypeDraft.set(""),this.cutValueDraft.set(""),this.formatPickDraft.set(""),this.guestNameDraft.set(""),this.guestGenderDraft.set("M"),this.guestHcpDraft.set(""),this.roundCourseDraft.set(""),this.roundDateDraft.set(""),this.resultSetIndex.set(0),this.cutOutcome.set(null),this.cutConfirmOpen.set(!1),this.finalizeConfirmOpen.set(!1)}initialize(){this.auth.currentUser.get()&&(this.profile.load(),this.friends.load()),this.formats.load(),this.aggregations.load(),this.loadCourses()}loadCourses(){this.coursesLoaded||(this.coursesLoaded=!0,v.courses.list().then(e=>this.courses.set(e)).catch(()=>{this.coursesLoaded=!1}))}async loadTees(e){if(!e){this.tees.set([]);return}try{this.tees.set(await v.tees.listByCourse({courseId:e}))}catch{this.tees.set([])}}selectAggregation(e){this.applyAggregation(e,{})}applyAggregation(e,t){this.aggregationStrategy.set(e);const s=this.aggregations.byId(e)?.configFields??[];this.aggregationValues.set(To(s,t))}setAggregationValue(e,t){this.aggregationValues.set({...this.aggregationValues.get(),[e]:t})}seedSetupEditor(){const e=this.competitions.detail.get();if(!e)return;this.nameDraft.set(e.name);const t=e.defaultConfig;this.slotDraft.set((t?.slots??[]).map(o=>o.formatId)),this.startListDraft.set(t?.startList??"single_group"),this.teeDraft.set(t?.fallbackTee?.teeId??"");const s=e.aggregation,n=s?.strategyId??this.aggregations.descriptors.get()[0]?.id??"";this.applyAggregation(n,s?.config??{});const r=e.cutRules;this.cutAfterDraft.set(r?.afterRound!==void 0?String(r.afterRound):""),this.cutTypeDraft.set(r?.cutType??""),this.cutValueDraft.set(r?.cutValue!==void 0?String(r.cutValue):""),this.formatPickDraft.set(this.formats.descriptors.get()[0]?.id??""),this.editingSetup.set(!0)}async saveSetup(){const e=this.id.get()??"",t=this.slotDraft.get().map(_=>({formatId:_})),s=this.teeDraft.get(),n=t.length>0?{slots:t,startList:this.startListDraft.get(),...s?{fallbackTee:{teeId:s}}:{}}:void 0,r=this.aggregationStrategy.get(),o=this.aggregations.byId(r)?.configFields??[],d=r?{strategyId:r,config:Io(o,this.aggregationValues.get())}:void 0,c=Number.parseInt(this.cutAfterDraft.get(),10),h=Number.parseInt(this.cutValueDraft.get(),10),f=this.cutTypeDraft.get(),m=f&&Number.isFinite(c)&&Number.isFinite(h)?{afterRound:c,cutType:f,cutValue:h}:void 0;await this.competitions.updateConfig({id:e,name:this.nameDraft.get().trim()||void 0,...n?{defaultConfig:n}:{},...d?{aggregation:d}:{},...m?{cutRules:m}:{}})===null&&this.editingSetup.set(!1)}async addGuest(){const e=this.guestNameDraft.get().trim();if(!e)return;const t=Y(this.guestHcpDraft.get());await this.competitions.addGuest(this.id.get()??"",{displayName:e,gender:this.guestGenderDraft.get(),handicapIndex:t},null)===null&&(this.guestNameDraft.set(""),this.guestHcpDraft.set(""))}async createRound(){const e=this.roundCourseDraft.get()||this.courseDraft.get(),t=this.roundDateDraft.get();if(!e||!t)return this.competitions.mutateError.set("Pick a course and a date for the round."),null;const s=await this.competitions.createRound({id:this.id.get()??"",courseId:e,playedAt:t});return s.ok?s.shareToken:null}}const Eo=y(`
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
`),No=y(`
    <div class="cd__slot">
        <span bind="label"></span>
        <button bind="remove" type="button" aria-label="Remove">×</button>
    </div>
`),xe=y('<option bind="option"></option>'),Po=y(`
    <label class="cd__field">
        <span bind="label"></span>
        <select bind="select"></select>
        <input bind="integer" inputmode="numeric" />
    </label>
`);class zo extends N{competitions=this.inject(se);state=this.inject(fe);render(){const e=()=>this.competitions.detail.get(),t=this.wire(Eo,{root:{className:()=>this.state.admin.get()&&qe(this.state.lifecycle.get())?"cd__section cd__setup":"cd__section cd__setup hidden"},toggle:{textContent:()=>this.state.editingSetup.get()?"Close":"Edit",onclick:()=>{this.state.editingSetup.get()?this.state.editingSetup.set(!1):this.state.seedSetupEditor()}},summary:{className:()=>this.state.editingSetup.get()?"cd__summary hidden":"cd__summary"},summaryFormats:{textContent:()=>{const r=e()?.defaultConfig?.slots??[];return r.length?r.map(o=>this.state.formats.labelOf(o.formatId)??o.formatId).join(", "):"none set"},className:()=>(e()?.defaultConfig?.slots.length??0)===0?"cd__muted-em":""},summaryScoring:{textContent:()=>{const r=e()?.aggregation;return r?this.state.aggregations.labelOf(r.strategyId):"default (chosen automatically)"},className:()=>e()?.aggregation?"":"cd__muted-em"},form:{className:()=>this.state.editingSetup.get()?"cd__form":"cd__form hidden"},name:{value:()=>this.state.nameDraft.get(),oninput:r=>this.state.nameDraft.set(r.target.value)},formatPick:{value:()=>this.state.formatPickDraft.get(),onchange:r=>this.state.formatPickDraft.set(r.target.value)},addSlot:{onclick:()=>{const r=this.state.formatPickDraft.get()||this.state.formats.descriptors.get()[0]?.id;r&&this.state.slotDraft.set([...this.state.slotDraft.get(),r])}},aggregationPick:{value:()=>this.state.aggregationStrategy.get(),onchange:r=>this.state.selectAggregation(r.target.value)},aggregationDescription:()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.description??"",course:{value:()=>this.state.courseDraft.get(),onchange:r=>{const o=r.target.value;this.state.courseDraft.set(o),this.state.teeDraft.set(""),this.state.loadTees(o)}},tee:{value:()=>this.state.teeDraft.get(),onchange:r=>this.state.teeDraft.set(r.target.value)},startList:{value:()=>this.state.startListDraft.get(),onchange:r=>this.state.startListDraft.set(r.target.value)},cutAfter:{value:()=>this.state.cutAfterDraft.get(),oninput:r=>this.state.cutAfterDraft.set(r.target.value)},cutType:{value:()=>this.state.cutTypeDraft.get(),onchange:r=>this.state.cutTypeDraft.set(r.target.value)},cutValue:{value:()=>this.state.cutValueDraft.get(),oninput:r=>this.state.cutValueDraft.set(r.target.value)},save:{disabled:()=>this.competitions.mutating.get(),textContent:()=>this.competitions.mutating.get()?"Saving…":"Save setup",onclick:()=>{this.state.saveSetup()}},cancel:{onclick:()=>this.state.editingSetup.set(!1)}});this.$each(this.ref(t,"slots"),this.state.slotDraft,(r,o,d)=>this.wireEl(No,{label:()=>`Slot ${o+1}: ${this.state.formats.labelOf(r)??r}`,remove:{onclick:()=>this.state.slotDraft.set(this.state.slotDraft.get().filter((c,h)=>h!==o))}},d),(r,o)=>`${o}:${r}`),this.$each(this.ref(t,"formatPick"),this.state.formats.descriptors,(r,o,d)=>this.wireEl(xe,{option:{value:()=>r.id,textContent:()=>this.state.formats.labelOf(r)??r.id}},d),r=>r.id),this.$each(this.ref(t,"aggregationPick"),this.state.aggregations.descriptors,(r,o,d)=>this.wireEl(xe,{option:{value:()=>r.id,textContent:()=>this.state.aggregations.labelOf(r)}},d),r=>r.id);const s=new k(()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.configFields??[]);this.$each(this.ref(t,"aggregationFields"),s,(r,o,d)=>this.configField(r,d),r=>r.key);const n=(r,o)=>this.wireEl(xe,{option:{value:()=>r.id,textContent:()=>r.name}},o);return this.$each(this.ref(t,"course"),this.state.courses,(r,o,d)=>n(r,d),r=>r.id),this.$each(this.ref(t,"tee"),this.state.tees,(r,o,d)=>n(r,d),r=>r.id),t}configField(e,t){const s=this.wireEl(Po,{label:()=>e.label,select:{className:()=>e.kind==="select"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),onchange:o=>this.state.setAggregationValue(e.key,o.target.value)},integer:{className:()=>e.kind==="integer"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),oninput:o=>this.state.setAggregationValue(e.key,o.target.value)}},t),n=s.querySelector("select"),r=new k(()=>e.kind==="select"?e.options:[]);return this.$each(n,r,(o,d,c)=>this.wireEl(xe,{option:{value:()=>o.value,textContent:()=>o.label}},c),o=>o.value),s}}const Oo=y(`
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
`),jo=y(`
    <div class="cd__rosterrow">
        <span bind="name" class="cd__rname"></span>
        <span bind="category" class="cd__rcat"></span>
        <span bind="status" class="cd__rout"></span>
        <button bind="withdraw" class="cd__ract" type="button">Withdraw</button>
        <button bind="remove" class="cd__ract cd__ract--danger" type="button">Remove</button>
    </div>
`),Ro=y('<button bind="chip" class="cd__friendchip" type="button"></button>');class Lo extends N{competitions=this.inject(se);state=this.inject(fe);render(){const e=()=>this.state.id.get()??"",t=this.wire(Oo,{count:()=>{const s=this.competitions.participants.get().length;return s===0?"":String(s)},empty:{className:()=>this.competitions.participants.get().length===0?"cd__empty":"cd__empty hidden"},add:{className:()=>this.state.admin.get()&&qe(this.state.lifecycle.get())?"cd__rosteradd":"cd__rosteradd hidden"},guestForm:{onsubmit:s=>{s.preventDefault(),this.state.addGuest()}},guestName:{value:()=>this.state.guestNameDraft.get(),oninput:s=>this.state.guestNameDraft.set(s.target.value)},guestGender:{value:()=>this.state.guestGenderDraft.get(),onchange:s=>this.state.guestGenderDraft.set(s.target.value)},guestHcp:{value:()=>this.state.guestHcpDraft.get(),oninput:s=>this.state.guestHcpDraft.set(s.target.value)},addGuest:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"roster"),this.competitions.participants,(s,n,r)=>this.wireEl(jo,{name:()=>s.displayNameSnapshot,category:{textContent:()=>s.category??"",className:()=>s.category?"cd__rcat":"cd__rcat hidden"},status:{textContent:()=>s.withdrawnAt?"Withdrawn":s.cutAfterRound!==null?`Cut R${s.cutAfterRound}`:"",className:()=>s.withdrawnAt||s.cutAfterRound!==null?"cd__rout":"cd__rout hidden"},withdraw:{className:()=>this.state.admin.get()&&!s.withdrawnAt?"cd__ract":"cd__ract hidden",onclick:()=>{this.competitions.withdrawParticipant(e(),s.id)}},remove:{className:()=>this.state.admin.get()&&qe(this.state.lifecycle.get())?"cd__ract cd__ract--danger":"cd__ract cd__ract--danger hidden",onclick:()=>{this.competitions.removeParticipant(e(),s.id)}}},r),s=>JSON.stringify({id:s.id,name:s.displayNameSnapshot,category:s.category,withdrawnAt:s.withdrawnAt,cutAfterRound:s.cutAfterRound})),this.$each(this.ref(t,"friends"),this.state.friends.friends,(s,n,r)=>this.wireEl(Ro,{chip:{textContent:()=>s.displayName,disabled:()=>this.competitions.mutating.get()||this.competitions.participants.get().some(o=>o.playerId===s.id),onclick:()=>{this.competitions.addPlayer(e(),s.id,null)}}},r),s=>s.id),t}}const Do={not_started:"Not started",active:"Live",complete:"Finished"},Ao=y(`
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
`),Ho=y(`
    <button bind="row" class="cd__roundrow" type="button">
        <span bind="number" class="cd__rnum"></span>
        <span bind="meta" class="cd__rmeta"></span>
        <span bind="status" class="cd__rstatus"></span>
    </button>
`),Mo=y('<option bind="option"></option>');class Fo extends N{competitions=this.inject(se);state=this.inject(fe);router=this.inject(R);render(){const e=new k(()=>this.competitions.detail.get()?.rounds??[]),t=this.wire(Ao,{empty:{className:()=>e.get().length===0?"cd__empty":"cd__empty hidden"},form:{className:()=>this.state.admin.get()&&xo(this.state.lifecycle.get())?"cd__addround":"cd__addround hidden",onsubmit:s=>{s.preventDefault(),this.createRound()}},course:{value:()=>this.state.roundCourseDraft.get(),onchange:s=>this.state.roundCourseDraft.set(s.target.value)},date:{value:()=>this.state.roundDateDraft.get(),oninput:s=>this.state.roundDateDraft.set(s.target.value)},add:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"course"),this.state.courses,(s,n,r)=>this.wireEl(Mo,{option:{value:()=>s.id,textContent:()=>s.name}},r),s=>s.id),this.$each(this.ref(t,"rounds"),e,(s,n,r)=>this.wireEl(Ho,{row:{disabled:()=>!s.shareToken,onclick:()=>{s.shareToken&&this.router.navigate("/round",{query:{token:s.shareToken}})}},number:()=>`Round ${s.roundNumber}`,meta:()=>[s.courseNameSnapshot,s.date].filter(Boolean).join(" · ")||(s.shareToken?"Open":"View-only"),status:{textContent:()=>Do[s.status]??s.status,className:()=>`cd__rstatus s-${s.status}`}},r),s=>JSON.stringify({id:s.id,status:s.status,shareToken:s.shareToken,courseName:s.courseNameSnapshot,date:s.date})),t}async createRound(){const e=await this.state.createRound();e&&this.router.navigate("/round",{query:{token:e}})}}function Bo(i,e,t){return JSON.stringify({entry:i,points:e,columns:t})}function Go(i){return i.rounds.filter(e=>e.value!==null).map(e=>({text:String(e.value),dropped:e.status==="dropped"}))}const qo=y(`
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
`),Ko=y('<button bind="button" type="button"></button>'),Vo=y('<th bind="cell"></th>'),Uo=y('<tr bind="row"></tr>'),Wo=y('<td bind="cell"><span bind="value"></span></td>'),Yo=y(`
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
`),Qo=y('<span bind="part"><span bind="separator"></span><span bind="value"></span></span>');class Xo extends N{competitions=this.inject(se);state=this.inject(fe);render(){const e=new k(()=>{if(this.state.lifecycle.get()!=="finalized")return(this.competitions.board.get()?.view.entries??[]).map(m=>({entry:m,points:null}));const h=this.competitions.results.get()?.resultSets??[],f=Math.min(this.state.resultSetIndex.get(),h.length-1);return(h[f]?.entries??[]).map(m=>({entry:m.entry,points:m.points}))}),t=new k(()=>{const h=this.competitions.board.get()?.view.rounds??[];if(h.length>0)return h;const f=new Set;for(const m of e.get())for(const u of m.entry.rounds)f.add(u.roundNumber);return[...f].sort((m,u)=>m-u).map(m=>({roundNumber:m,postCut:!1}))}),s=()=>this.state.lifecycle.get()==="finalized",n=()=>s()?(this.competitions.results.get()?.resultSets.length??0)>0:this.competitions.board.get()!==null,r=()=>this.state.cutOutcome.get(),o=h=>h.length===0?"—":h.map(f=>f.displayName).join(", "),d=this.wire(qo,{admin:{className:()=>this.state.admin.get()&&this.state.lifecycle.get()==="active"?"cd__section cd__admin":"cd__section cd__admin hidden"},cutOutcome:{className:()=>r()?"cd__cutoutcome":"cd__cutoutcome hidden"},advancedLabel:()=>`Advanced (${r()?.advanced.length??0}):`,advanced:()=>o(r()?.advanced??[]),cutLabel:()=>`Cut (${r()?.cut.length??0}):`,cut:()=>o(r()?.cut??[]),applyCut:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.cutConfirmOpen.set(!0)},finalize:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.finalizeConfirmOpen.set(!0)},title:()=>s()?"Official results":"Leaderboard",board:{className:()=>s()?"cd__board cb cb--official":"cd__board"},official:{textContent:()=>{const h=this.competitions.results.get()?.finalizedAt.slice(0,10)??"";return s()&&h?`Official results · finalized ${h}`:""},className:()=>s()?"cd__official-banner":"cd__official-banner hidden"},boardHead:{className:()=>s()?"cb-head hidden":"cb-head"},metric:()=>this.competitions.board.get()?.view.metricLabel??"",operator:()=>{const h=this.competitions.board.get();return h?h.view.operator.kind==="best_n"?`Best ${h.view.operator.n} of ${h.view.rounds.length}`:"Total across rounds":""},defaulted:{className:()=>this.competitions.board.get()?.defaulted?"cb-head__hint":"cb-head__hint hidden"},empty:{className:()=>n()&&e.get().length===0?"cb-empty":"cb-empty hidden"},table:{className:()=>n()&&e.get().length>0?"cb":"cb hidden"},refusal:{textContent:()=>s()?this.competitions.resultsRefusal.get()??"":this.competitions.board.get()===null?this.competitions.boardRefusal.get()??"":""}}),c=new k(()=>[{text:"#",className:"cb-pos"},{text:"Player",className:"cb-who"},...t.get().map((h,f,m)=>({text:`R${h.roundNumber}`,className:`cb-c${h.postCut&&!m.slice(0,f).some(u=>u.postCut)?" cb-c--divider":""}`})),{text:"Total",className:"cb-total"},...s()?[{text:"Pts",className:"cb-points"}]:[]]);return this.$each(this.ref(d,"headers"),c,(h,f,m)=>this.wireEl(Vo,{cell:{textContent:()=>h.text,className:()=>h.className}},m),h=>`${h.text}:${h.className}`),this.$each(this.ref(d,"rows"),e,(h,f,m)=>this.boardRow(h,t.get(),m),h=>Bo(h.entry,h.points,t.get())),this.$each(this.ref(d,"switcher"),new k(()=>s()?this.competitions.results.get()?.resultSets??[]:[]),(h,f,m)=>this.wireEl(Ko,{button:{textContent:()=>h.scoringType.toUpperCase(),className:()=>this.state.resultSetIndex.get()===f?"on":"",onclick:()=>this.state.resultSetIndex.set(f)}},m),h=>h.scoringType),this.spawn(V,this.ref(d,"cutConfirm"),{open:this.state.cutConfirmOpen,title:"Apply cut?",message:"This evaluates the configured cut against the current aggregate and marks who advances. Cut players are left out of later rounds.",confirmLabel:"Apply cut",cancelLabel:"Cancel",onconfirm:async()=>{const h=await this.competitions.applyCut(this.state.id.get()??"");h.ok&&this.state.cutOutcome.set(h.outcome)}}),this.spawn(V,this.ref(d,"finalizeConfirm"),{open:this.state.finalizeConfirmOpen,title:"Finalize competition?",message:"Finalizing freezes the official results and locks the competition. This cannot be undone.",confirmLabel:"Finalize",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.competitions.finalize(this.state.id.get()??"")}}),d}boardRow(e,t,s){const n=e.entry,r=n.withdrawn||n.cutAfterRound!==null,o=["cb-row"];n.withdrawn?o.push("cb-row--withdrawn"):n.cutAfterRound!==null?o.push("cb-row--cut"):n.position===1&&o.push("cb-row--lead"),n.incomplete&&o.push("cb-row--incomplete");const d=t.findIndex(m=>m.postCut),c=new Map(n.rounds.map(m=>[m.roundNumber,m])),h=[{kind:"position",text:r?"—":String(n.position)},{kind:"who",entry:n},...t.map((m,u)=>({kind:"round",cell:c.get(m.roundNumber)??null,divider:u===d})),{kind:"total",text:n.total===null?"—":String(n.total)},...e.points===null?[]:[{kind:"points",text:String(e.points)}]],f=this.wireEl(Uo,{row:{className:()=>o.join(" ")}},s);return this.$each(f,new k(()=>h),(m,u,_)=>this.boardCell(m,_),(m,u)=>u),f}boardCell(e,t){if(e.kind==="who")return this.whoCell(e.entry,t);const s=e.kind==="position"?"cb-pos":e.kind==="total"?"cb-total":e.kind==="points"?"cb-points":`cb-c cb-c--${e.cell?.status??"missing"}${e.divider?" cb-c--divider":""}`,n=e.kind==="round"?e.cell?.value===null||!e.cell?"—":String(e.cell.value):e.text;return this.wireEl(Wo,{cell:{className:()=>s},value:{textContent:()=>n,className:()=>e.kind==="round"&&e.cell?.status==="dropped"?"cb-struck":""}},t)}whoCell(e,t){const s=e.withdrawn?"WD":e.cutAfterRound!==null?`Cut R${e.cutAfterRound}`:"",n=Go(e),r=this.wireEl(Yo,{cell:{},name:()=>e.displayName,category:{textContent:()=>e.category??"",className:()=>e.category?"cb-tag cb-cat":"cb-tag cb-cat hidden"},status:{textContent:()=>s,className:()=>s?"cb-tag cb-tag--out":"cb-tag cb-tag--out hidden"},equals:{className:()=>n.length===0?"hidden":""},total:()=>e.total===null?"—":String(e.total)},t);return this.$each(r.querySelector('[bind="parts"]'),new k(()=>n),(o,d,c)=>this.wireEl(Qo,{separator:()=>d===0?"":" + ",value:{textContent:()=>o.text,className:()=>o.dropped?"cb-struck":""}},c),(o,d)=>d),r}}const Jo=y(`
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
`);class Zo extends N{static styles=`
        .cd {
            padding: ${l("lg")} ${l("lg")} ${l("2xl")};
            & .hidden { display: none !important; }
            & .cd__muted-em { font-style: italic; }
            & .cb-struck { text-decoration: line-through; opacity: 0.8; }

            & .cd__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 700; color: ${a("accent")};
                cursor: pointer; padding: 0 0 ${l("md")};
            }
            & .cd__loading, & .cd__loaderr {
                color: ${a("text-muted")}; padding: ${l("lg")} 0;
                &.hidden { display: none; }
            }
            & .cd__loaderr { color: ${a("error")}; }
            & .cd__body.hidden { display: none; }

            & .cd__head { margin-bottom: ${l("md")}; }
            & .cd__titlerow { display: flex; align-items: center; gap: ${l("md")}; }
            & .cd__head h1 {
                margin: 0; font-family: ${a("font-display")}; font-weight: 600;
                font-size: 1.7rem; letter-spacing: -0.02em;
            }
            & .cd__owner { margin: ${l("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.85rem; }

            & .comp-chip {
                flex-shrink: 0; font-size: 0.7rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em;
                border-radius: ${a("radius-pill")}; padding: 2px 10px;
                background: ${a("surface-sunken")}; color: ${a("text-muted")};
                &.comp-chip--setup { background: ${a("accent-soft")}; color: ${a("accent")}; }
                &.comp-chip--active { background: ${a("primary")}; color: ${a("primary-text")}; }
                &.comp-chip--finalized { background: ${a("accent")}; color: ${a("topbar-bg")}; }
            }

            & .cd__err {
                margin: 0 0 ${l("md")}; font-size: 0.85rem; color: ${a("error")};
                &:empty { display: none; }
            }

            & .cd__transition {
                margin-bottom: ${l("lg")};
                &.hidden { display: none; }
                & button {
                    ${S()}
                    padding: ${l("md")} ${l("lg")}; font-family: inherit;
                    font-size: 0.95rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
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
                    margin: 0; font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
                & .cd__count { color: ${a("text-muted")}; font-size: 0.85rem; }
            }
            & .cd__linkbtn {
                margin-left: auto; background: none; border: none; font-family: inherit;
                font-size: 0.85rem; font-weight: 700; color: ${a("accent")}; cursor: pointer;
            }
            & .cd__summary {
                ${z()} padding: ${l("md")} ${l("lg")};
                font-size: 0.85rem; color: ${a("text-muted")}; line-height: 1.5;
                &.hidden { display: none; }
            }
            & .cd__empty { color: ${a("text-muted")}; font-size: 0.9rem; padding: ${l("sm")} 0;
                &.hidden { display: none; } &:empty { display: none; } }

            & .cd__form {
                ${z()} padding: ${l("lg")};
                display: flex; flex-direction: column; gap: ${l("md")};
                &.hidden { display: none; }
                & .cd__field { display: flex; flex-direction: column; gap: ${l("xs")};
                    & > span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                        letter-spacing: 0.05em; color: ${a("text-muted")}; }
                    & input, & select { ${K()} padding: ${l("sm")} ${l("md")}; font-size: 0.95rem; }
                }
                & .cd__aggdesc { margin: 0; font-size: 0.8rem; color: ${a("text-muted")}; &:empty { display: none; } }
                & .cd__aggfields { display: flex; flex-direction: column; gap: ${l("md")}; &:empty { display: none; } }
                & .cd__cutrow, & .cd__addrow { display: flex; gap: ${l("sm")}; }
                & .cd__cutrow input { width: 33%; }
                & .cd__addrow select { flex: 1; }
                & .cd__slots { display: flex; flex-direction: column; gap: ${l("xs")}; }
                & .cd__formactions { display: flex; align-items: center; gap: ${l("md")}; margin-top: ${l("sm")}; }
                & button[bind="addSlot"], & button[bind="saveSetup"] {
                    ${S()}
                    padding: ${l("sm")} ${l("md")}; font-family: inherit; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }
            & .cd__slot {
                display: flex; align-items: center; justify-content: space-between;
                padding: ${l("xs")} ${l("sm")}; background: ${a("surface-sunken")};
                border-radius: ${a("radius-sm")}; font-size: 0.9rem; font-weight: 600;
                & button { background: none; border: none; color: ${a("error")}; cursor: pointer; font-size: 1.1rem; }
            }

            & .cd__roster { display: flex; flex-direction: column; gap: ${l("xs")}; margin-bottom: ${l("md")}; }
            & .cd__rosterrow {
                display: flex; align-items: center; gap: ${l("sm")};
                padding: ${l("sm")} ${l("md")}; ${z()}
                & .cd__rname { font-weight: 700; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                & .cd__rcat, & .cd__rout {
                    font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
                    border-radius: ${a("radius-pill")}; padding: 1px 8px;
                }
                & .cd__rcat { background: ${a("accent-soft")}; color: ${a("accent")}; }
                & .cd__rout { background: ${a("surface-sunken")}; color: ${a("text-muted")}; }
                & .cd__ract { background: none; border: none; cursor: pointer; color: ${a("text-muted")};
                    font-size: 0.75rem; font-weight: 700; }
                & .cd__ract--danger { color: ${a("error")}; }
            }
            & .cd__rosteradd, & .cd__addround { &.hidden { display: none; } }
            & .cd__sublabel { display: block; font-size: 0.75rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.05em; color: ${a("text-muted")};
                margin: ${l("md")} 0 ${l("xs")}; }
            & .cd__friendpick { display: flex; flex-wrap: wrap; gap: ${l("xs")}; }
            & .cd__friendchip {
                ${S()}
                padding: ${l("xs")} ${l("md")}; font-family: inherit;
                font-size: 0.85rem; font-weight: 600; cursor: pointer;
                &:disabled { opacity: 0.4; }
            }
            & .cd__guestrow, & .cd__addroundrow { display: flex; gap: ${l("sm")}; }
            & .cd__guestrow input, & .cd__addroundrow input, & .cd__addroundrow select {
                ${K()}
                padding: ${l("sm")} ${l("md")}; font-size: 0.9rem; min-width: 0; }
            & .cd__guestrow input[bind="guestName"] { flex: 1; }
            & .cd__guestrow input[bind="guestHcp"] { width: 4.5rem; }
            & .cd__guestrow select { width: 3.5rem; }
            & .cd__addroundrow select { flex: 1; }
            & .cd__guestrow button, & .cd__addroundrow button {
                ${S()}
                padding: ${l("sm")} ${l("md")}; font-family: inherit; font-weight: 700;
                background: ${a("primary")}; color: ${a("primary-text")}; border: none; }

            & .cd__rounds { display: flex; flex-direction: column; gap: ${l("xs")}; }
            & .cd__roundrow {
                display: flex; align-items: center; gap: ${l("md")};
                padding: ${l("md")} ${l("lg")}; ${z({hover:!0})}
                text-align: left; font-family: inherit; width: 100%; cursor: pointer;
                &:disabled { cursor: default; opacity: 0.75; }
                & .cd__rnum { font-weight: 700; }
                & .cd__rmeta { color: ${a("text-muted")}; font-size: 0.85rem; flex: 1; }
                & .cd__rstatus {
                    font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.06em; border-radius: ${a("radius-pill")}; padding: 2px 10px;
                    background: ${a("surface-sunken")}; color: ${a("text-muted")};
                    &.s-active { background: ${a("accent-soft")}; color: ${a("accent")}; }
                }
            }

            & .cd__admin.hidden { display: none; }
            & .cd__adminbtns { display: flex; gap: ${l("md")}; }
            & .cd__adminbtns button {
                ${S()}
                padding: ${l("md")} ${l("lg")}; font-family: inherit; font-weight: 700;
            }
            & .cd__cutbtn { background: ${a("accent-soft")}; color: ${a("accent")}; border-color: ${a("accent")}; }
            & .cd__finalbtn { background: ${a("error")}; color: #fff; border: none; }
            & .cd__adminnote { margin: ${l("sm")} 0 0; font-size: 0.8rem; color: ${a("text-muted")}; }
            & .cd__cutoutcome { &:empty { display: none; } margin-bottom: ${l("md")}; font-size: 0.85rem;
                ${z()} padding: ${l("md")} ${l("lg")}; }
            & .cd__cutoutcome .cd__cutgrp { margin-bottom: ${l("xs")}; }
            & .cd__cutoutcome strong { color: ${a("text")}; }

            & .cd__setswitch { display: flex; gap: ${l("xs")}; margin-bottom: ${l("sm")};
                &:empty { display: none; }
                & button {
                    ${S()}
                    padding: ${l("xs")} ${l("md")}; font-family: inherit;
                    font-size: 0.85rem; font-weight: 700; cursor: pointer;
                    &.on { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                }
            }

            /* --- aggregated / official board --- */
            & .cd__board { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            & .cd__official-banner {
                ${z()} padding: ${l("sm")} ${l("lg")}; margin-bottom: ${l("sm")};
                background: ${a("accent-soft")}; color: ${a("accent")};
                font-weight: 700; font-size: 0.85rem;
                border-color: ${a("accent")};
            }
            & .cb-head { display: flex; align-items: baseline; gap: ${l("sm")}; margin-bottom: ${l("sm")}; }
            & .cb-head__title { margin: 0; font-family: ${a("font-display")}; font-weight: 600; font-size: 1rem; }
            & .cb-head__op, & .cb-head__hint { font-size: 0.75rem; color: ${a("text-muted")}; }
            & .cb-empty { color: ${a("text-muted")}; padding: ${l("md")} 0; }
            & table.cb {
                width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums;
            }
            & .cb.cb--official { box-shadow: inset 0 0 0 2px ${a("accent")}; border-radius: ${a("radius")}; }
            & .cb thead th {
                font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em;
                color: ${a("text-muted")}; font-weight: 700; padding: ${l("xs")} ${l("sm")};
                border-bottom: 1px solid ${a("border")}; text-align: center;
            }
            & .cb th.cb-who, & .cb td.cb-who { text-align: left; }
            & .cb tbody td { padding: ${l("sm")}; border-bottom: 1px solid ${a("border")};
                text-align: center; font-size: 0.9rem; }
            & .cb .cb-pos { width: 2rem; color: ${a("text-muted")}; font-weight: 700; }
            & .cb .cb-who { min-width: 0; }
            & .cb .cb-who__line { display: flex; align-items: baseline; gap: ${l("xs")}; min-width: 0; }
            & .cb .cb-name { font-weight: 700; font-family: ${a("font-display")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
            & .cb .cb-arith { font-size: 0.72rem; color: ${a("text-muted")}; margin-top: 1px;
                font-variant-numeric: tabular-nums; }
            & .cb .cb-arith s { opacity: 0.7; }
            & .cb .cb-arith__total { font-weight: 700; color: ${a("text")}; }
            & .cb .cb-tag { font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.05em; border-radius: ${a("radius-pill")}; padding: 1px 7px; flex-shrink: 0; }
            & .cb .cb-cat { background: ${a("accent-soft")}; color: ${a("accent")}; }
            & .cb .cb-tag--out { background: ${a("surface-sunken")}; color: ${a("text-muted")}; }
            & .cb .cb-c--dropped { color: ${a("text-muted")}; }
            & .cb .cb-c--dropped s { opacity: 0.8; }
            & .cb .cb-c--missing, & .cb .cb-c--cut { color: ${a("text-muted")}; }
            & .cb .cb-c--divider { border-left: 2px solid ${a("accent")}; }
            & .cb .cb-total { font-weight: 800; font-size: 1rem; }
            & .cb .cb-points { font-weight: 800; color: ${a("accent")}; }
            & .cb tr.cb-row--lead td { background: ${a("accent-soft")}; }
            & .cb tr.cb-row--cut td, & .cb tr.cb-row--withdrawn td {
                color: ${a("text-muted")}; background: ${a("surface-sunken")}; opacity: 0.85; }
        }
    `;competitions=this.inject(se);state=this.inject(fe);router=this.inject(R);render(){const e=()=>this.competitions.detail.get();this.track(E(()=>{const s=this.state.id.get();s&&G(()=>{this.state.enter(),this.competitions.loadDetail(s)})})),this.state.initialize();const t=this.wire(Jo,{back:{onclick:()=>this.router.navigate("/competitions")},loading:{className:()=>this.competitions.detailLoading.get()&&e()===null?"cd__loading":"cd__loading hidden"},loadErr:{textContent:()=>this.competitions.detailError.get()?.message??"",className:()=>this.competitions.detailError.get()?"cd__loaderr":"cd__loaderr hidden"},body:{className:()=>e()?"cd__body":"cd__body hidden"},name:()=>e()?.name??"",chip:{textContent:()=>hs(this.state.lifecycle.get()),className:()=>ps(this.state.lifecycle.get())},ownerLine:{textContent:()=>this.state.admin.get()?"You administer this competition.":"Read-only view."},mutateErr:{textContent:()=>this.competitions.mutateError.get()??""},transitionRow:{className:()=>this.state.admin.get()&&Ae(this.state.lifecycle.get())?"cd__transition":"cd__transition hidden"},transitionBtn:{textContent:()=>Ae(this.state.lifecycle.get())?.label??"",disabled:()=>this.competitions.mutating.get(),onclick:()=>{const s=Ae(this.state.lifecycle.get()),n=this.state.id.get();s&&n&&this.competitions.transition(n,s.to)}}});return this.spawn(zo,this.ref(t,"setup")),this.spawn(Lo,this.ref(t,"roster")),this.spawn(Fo,this.ref(t,"rounds")),this.spawn(Xo,this.ref(t,"results")),t}}const ea=y(`
    <div class="app-shell">
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class ta extends N{static styles=`
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
    `;router=this.inject(R);render(){const e=this.wire(ea,{});return this.spawn(Sn,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":yt,"/history":Hn,"/round":xr,"/create":Zr,"/login":io,"/friends":lo,"/profile":ho,"/admin":vo,...Qt.competitions?{"/competitions":So,"/competition":Zo}:{}},yt),e}}class sa extends H{async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await us(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await eo()),this.error.set(null)}catch(e){e instanceof q&&e.status===401?this.error.set(null):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await to(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof q&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}}A.get(Ps);const Lt=A.get(R);A.set(H,new sa);const Dt=A.get(H);await Rs(ta,"#app",{hot:void 0,onInit:async()=>{await Dt.load(),Dt.currentUser.get()&&Lt.route.get()==="/login"&&Lt.navigate("/",!0)}});export{He as A,N as C,R,p as S,Ps as T,g as a,he as b,k as c,xs as d,E as e,ws as n,O as r,y as t};
