(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const ka="modulepreload",$a=function(s){return"/tapscore/"+s},kn={},Sa=function(e,t,n){let i=Promise.resolve();if(t&&t.length>0){let c=function(u){return Promise.all(u.map(h=>Promise.resolve(h).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),d=o?.nonce||o?.getAttribute("nonce");i=c(t.map(u=>{if(u=$a(u),u in kn)return;kn[u]=!0;const h=u.endsWith(".css"),f=h?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${f}`))return;const m=document.createElement("link");if(m.rel=h?"stylesheet":ka,h||(m.as="script"),m.crossOrigin="",m.href=u,d&&m.setAttribute("nonce",d),document.head.appendChild(m),h)return new Promise((_,g)=>{m.addEventListener("load",_),m.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${u}`)))})}))}function r(o){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=o,window.dispatchEvent(d),!d.defaultPrevented)throw o}return i.then(o=>{for(const d of o||[])d.status==="rejected"&&r(d.reason);return e().catch(r)})},Gi="/tapscore/".replace(/\/+$/,""),As=Gi+"/api",Xt={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","confirm-btn-min-height":"44px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},Ta=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function Pa(s,e){const t={};for(const[n,i]of Ta)if(n in s)for(const r of i)r in s||(t[r]=`var(--${n})`);return{...e,...t,...s}}const ji=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],Ca={thin:"1px",medium:"3px",thick:"5px"};function Di(s){const e=s.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":Ca[e.toLowerCase()]??e}function Ia(){return ji.map(s=>{const e=Di(Xt[s]);return`@property --${s}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const qi={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Vi={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},Ea={...Vi,"done-opacity":"0.35"},Ra={...qi,...Vi,...Xt,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},Na={...qi,...Ea,...Xt,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class Oa{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;Ui(e);const n=this.tracking;this.tracking=e;try{t()}finally{this.tracking=n}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const n of t)n.disposed||n.run()}}}const Se=new Oa;function Ui(s){for(const e of s.deps)e.delete(s);s.deps.clear()}class p{constructor(e){this.subs=new Set,this.val=e}get(){return Se.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,Se.notify(this.subs))}update(e){this.set(e(this.val))}}class T{constructor(e){this.subs=new Set,this.val=void 0;const t=this,n={run(){Se.runTracked(n,()=>{const i=e();Object.is(t.val,i)||(t.val=i,Se.notify(t.subs))})},deps:new Set};n.run()}get(){return Se.subscribe(this.subs),this.val}peek(){return this.val}}function C(s){const e={run(){Se.runTracked(e,s)},deps:new Set};return e.run(),()=>{e.disposed=!0,Ui(e)}}function dt(s){Se.batch(s)}function se(s){return Se.untrack(s)}class Ha{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const Y=new Ha,Ze=Gi;function Bs(s){return Ze?s===Ze?"/":s.startsWith(Ze+"/")?s.slice(Ze.length):s:s}function Ma(s){return Ze+s}class q{constructor(){this.route=new p(Bs(location.pathname??"/")),this.search=new p(location.search??""),window.addEventListener("popstate",()=>dt(()=>{this.route.set(Bs(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const n=typeof t=="boolean"?{replace:t}:t??{},i=e.indexOf("#"),r=i>=0?e.slice(i):"",o=i>=0?e.slice(0,i):e,d=o.indexOf("?"),c=d>=0?o.slice(0,d):o,u=d>=0?o.slice(d+1):"",h=n.query!==void 0?Aa(n.query):u?"?"+u:"",f=Ma(c)+h+r;(n.replace?history.replaceState:history.pushState).call(history,null,"",f),dt(()=>{this.route.set(c),this.search.set(h)})}back(){history.back()}link(e,t="active"){const n=e.split("#")[0].split("?")[0];return{onclick:i=>{i.preventDefault(),this.navigate(e)},className:()=>{const i=this.route.get();return i===n||i.startsWith(n+"/")?t:""}}}params(e){const t=e.split("/");return new T(()=>{const n=this.route.get().split("/"),i={};for(const[r,o]of t.entries())o.startsWith(":")&&(i[o.slice(1)]=n[r]??"");return i})}query(e){return new T(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new T(()=>{const e={};for(const[t,n]of new URLSearchParams(this.search.get()))e[t]=n;return e})}}function Aa(s){const e=new URLSearchParams;for(const[n,i]of Object.entries(s))i==null||i===""||e.set(n,String(i));const t=e.toString();return t?"?"+t:""}function Ba(s){return e=>s[e]}const za="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",$n="data-basics-global";function La(){if(document.head.querySelector(`style[${$n}]`))return;const s=document.createElement("style");s.setAttribute($n,""),s.textContent=Ia()+za,document.head.appendChild(s)}function Fa(s,e){La();const t=new Set(ji),n=(r,o,d)=>{const c=Object.entries(r).map(([u,h])=>`--${u}:${t.has(u)?Di(h):h}`).join(";");return`${o}{color-scheme:${d};${c}}`},i=document.createElement("style");return i.textContent=n(s,'[data-theme="light"]',"light")+n(e,'[data-theme="dark"]',"dark"),document.head.appendChild(i),r=>`var(--${r})`}const Sn="basics-js-theme";class Ga{constructor(){this.dark=new p(!1);const e=localStorage.getItem(Sn),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),C(()=>{const n=this.dark.get();document.documentElement.setAttribute("data-theme",n?"dark":"light"),localStorage.setItem(Sn,n?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function b(s){const e=document.createElement("template");return e.innerHTML=s,e}function ja(s,e){let t;for(const n of Object.keys(e))s.startsWith(n+"/")&&(!t||n.length>t.length)&&(t=n);return t?e[t]:void 0}const Tn=new Set;class M{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!Tn.has(t)){Tn.add(t);const n=document.createElement("style");n.textContent=t.styles,document.head.appendChild(n)}}onMount(){}onDestroy(){}inject(e){return Y.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...n){const i=se(()=>{const r=new e(n[0]);return r.mount(t),r});return this.children.push(i),i}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){se(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,n){const i=n??(o=>this.track(o)),r=e.content.cloneNode(!0);for(const o of r.querySelectorAll("[bind]")){const d=t[o.getAttribute("bind")];if(d)if(typeof d=="function")i(C(()=>{const c=d();o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement?o.value=String(c):o.textContent=String(c)}));else for(const[c,u]of Object.entries(d)){const h=c.includes("-");c.startsWith("on")&&typeof u=="function"?o.addEventListener(c.slice(2),u):typeof u=="function"?i(C(()=>{const f=u();h?o.setAttribute(c,String(f)):o[c]=f})):h?o.setAttribute(c,String(u)):o[c]=u}}return r}wireEl(e,t,n){return this.wire(e,t,n).firstElementChild}slot(e,t){const n=this.props[e];if(n==null)return!1;const i=this.ref(t,e);return i?(typeof n=="string"?i.textContent=n:typeof n=="function"&&n.prototype instanceof M?this.spawn(n,i):typeof n=="function"&&n(i,{spawn:(r,o,...d)=>this.spawn(r,o,...d),track:r=>this.track(r)}),!0):!1}$each(e,t,n,i=(r,o)=>o){const r=typeof t=="function"?t:()=>t.get(),o=new Map,d=new Map;this.track(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),this.track(C(()=>{const c=r(),u=new Map;for(const[f,m]of c.entries()){const _=i(m,f);if(o.has(_))u.set(_,o.get(_));else{const g=[];u.set(_,se(()=>n(m,f,v=>g.push(v)))),d.set(_,g)}}for(const[f,m]of o)u.has(f)||(m.remove(),se(()=>d.get(f)?.forEach(_=>_())),d.delete(f));let h=e.firstChild;for(const f of u.values())f===h?h=h.nextSibling:e.insertBefore(f,h);o.clear();for(const[f,m]of u)o.set(f,m)}))}$condition(e,t,n,i){let r=null;this.track(C(()=>{r&&(r.remove(),r=null);const o=t.get();r=se(()=>o?n():i?.()??null),r&&e.appendChild(r)}))}$swap(e,t,n,i){let r=null;this.track(C(()=>{if(r){const c=r;r=null,se(()=>c.destroy())}e.textContent="";const o=t.get(),d=n[o]??ja(o,n)??i;d&&(r=se(()=>{const c=new d;return c.mount(e),c}))})),this.track(()=>r?.destroy())}}const Ht=new Set;function Da(s){return Ht.add(s),()=>Ht.delete(s)}function qa(){for(const s of Array.from(Ht)){Ht.delete(s);try{s()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function Va(s,e,t){const n=document.querySelector(e);n.textContent="";const i=Y.get(q);let r=null,o=!1,d=null,c=!!t?.hot?.data.hmr;const u=async h=>{r&&(r.destroy(),r=null,n.textContent=""),h?(d||(d=(await Sa(()=>import("./obs-shell.component-vCLXpU7s.js"),[])).ObsShellComponent),r=se(()=>new d)):(!c&&t?.onInit&&(await t.onInit(),c=!0),r=se(()=>new s)),se(()=>r.mount(n)),o=h};await u(Bs(location.pathname).startsWith("/_obs")),C(()=>{const h=i.route.get().startsWith("/_obs");h!==o&&u(h)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{r?.destroy()}catch(h){console.error("[startApp] the root component threw while disposing",h)}if(r=null,qa(),t.onDispose)try{t.onDispose()}catch(h){console.error("[startApp] onDispose threw",h)}}),t.hot.accept())}class Q extends Error{constructor(e,t,n,i,r){super(t),this.status=e,this.details=n,this.traceId=i,this.detail=r,this.name="ApiError"}}const Ua=10,Rt=[];let Nt=[],rt=null;function Ka(s){Rt.push(s),Rt.length>Ua&&Rt.shift()}function Ki(s,e,t){const n={code:s,message:e,url:typeof location<"u"?location.href:"",context:[...Rt],timestamp:new Date().toISOString()};t!==void 0&&(n.traceId=t),Nt.push(n),Wa()}function Wa(){rt||(rt=setTimeout(Wi,5e3))}function Wi(){if(rt&&(clearTimeout(rt),rt=null),Nt.length===0)return;const s=Nt;Nt=[];for(const e of s){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${As}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${As}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Wi()});const Ya=3e4,Xa=2,vt=new Map,Yi=new WeakMap;function Qa(s){if(s instanceof Q)return s.traceId;if(s!=null&&typeof s=="object")return Yi.get(s)}async function y(s){if(s.method==="GET"){const e=vt.get(s.url);if(e)return e;const t=Pn(s,Xa);return vt.set(s.url,t),t.then(()=>vt.delete(s.url),()=>vt.delete(s.url)),t}return Pn(s,0)}async function Pn(s,e){const t=s.timeout??Ya;let n;for(let i=0;i<=e;i++){const r=crypto.randomUUID();try{return await Za(Ja(s,r),t)}catch(o){if(n=o,!(o instanceof Q)&&o!=null&&typeof o=="object"&&Yi.set(o,r),o instanceof Q||i===e)break;await new Promise(d=>setTimeout(d,1e3*2**i))}}throw n}async function Ja(s,e){const t={"X-Trace-Id":e},n={method:s.method,headers:t};s.body!==void 0&&(t["Content-Type"]="application/json",n.body=JSON.stringify(s.body));const i=await fetch(s.url,n),r=i.headers.get("x-trace-id")??e;if(Ka({type:"api",detail:`${s.method} ${s.url}`,timestamp:new Date().toISOString()}),!i.ok){const o=await i.json().catch(()=>({error:i.statusText}));throw new Q(i.status,o.error??i.statusText,o.details,r,o.detail)}return i.json()}function Za(s,e){let t;const n=new Promise((i,r)=>{t=setTimeout(()=>r(new Error("Request timeout")),e)});return Promise.race([s,n]).finally(()=>clearTimeout(t))}const zs=new Set;let ps=!1;function eo(s){return zs.add(s),()=>{zs.delete(s)}}function Xi(){if(!ps){ps=!0;try{for(const s of[...zs])try{s()}catch(e){try{Ki("session-listener",to(e))}catch{}}}finally{ps=!1}}}function to(s){try{if(s instanceof Error){const e=s.message;if(typeof e=="string")return e}return String(s)}catch{return"listener threw a value that could not be described"}}async function F(s,e,t,n={}){dt(()=>{s.set(!0),e.set(null)});try{const i=await t();return s.set(!1),i}catch(i){const r=so(i);dt(()=>{s.set(!1),e.set(r)}),Ki(r.code,r.message,Qa(i)),r.code==="auth"&&n.sessionExpiry!==!1&&Xi();return}}function so(s){return s instanceof Q?s.status===401?{code:"auth",message:"Unauthorized"}:s.status===409?{code:"conflict",message:"Data has changed — please try again"}:s.status===400?{code:"validation",message:s.message}:s.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:s instanceof Error?s.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const fs={sessionExpiry:!1};function no(s){return{me:()=>y({method:"GET",url:`${s}/auth/me`}),login:e=>y({method:"POST",url:`${s}/auth/login`,body:e}),logout:()=>y({method:"POST",url:`${s}/auth/logout`,body:{}}),logoutAll:()=>y({method:"POST",url:`${s}/auth/logout-all`,body:{}})}}class V{constructor(){this.api=no(As),this.currentUser=new p(null),this.loading=new p(!1),this.error=new p(null),this.offSessionExpired=eo(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=Da(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await F(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const n=await F(this.loading,this.error,()=>this.api.login({username:e,password:t}),fs);return n?(this.currentUser.set(n),!0):!1}async logout(){await F(this.loading,this.error,()=>this.api.logout(),fs);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}async logoutEverywhere(){const e=await F(this.loading,this.error,()=>this.api.logoutAll(),fs),t=this.error.get();return(!t||t.code==="auth")&&this.currentUser.set(null),e?.revoked??null}}const Qi={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},io={...Qi,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},ro={...Qi,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"};function Ji(s,e={}){const t=s==="light"?io:ro,n=s==="light"?Ra:Na;return Pa({...t,...e},n)}const ao=Ji("light"),oo=Ji("dark"),l=Fa(ao,oo),z=s=>`var(--${s})`,I=(s,e)=>`var(--${s}, ${e})`,E=s=>{const e=Xt[s];if(e===void 0)throw new Error(`unknown control token: --${s}`);return e},lo=s=>I(s,E(s)),a=Ba({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),wt=s=>`
    background: ${I(`btn-${s}-bg`,E(`btn-${s}-bg`))};
    color: ${I(`btn-${s}-fg`,E(`btn-${s}-fg`))};
    border-color: ${I(`btn-${s}-border`,E(`btn-${s}-border`))};
    box-shadow: ${I(`btn-${s}-shadow`,E(`btn-${s}-shadow`))};
    &:hover {
        background: ${I(`btn-${s}-bg-hover`,E(`btn-${s}-bg-hover`))};
        color: ${I(`btn-${s}-fg-hover`,E(`btn-${s}-fg-hover`))};
        border-color: ${I(`btn-${s}-border-hover`,E(`btn-${s}-border-hover`))};
    }`,Zi=`
    background: ${I("btn-disabled-bg",E("btn-disabled-bg"))};
    color: ${I("btn-disabled-fg",E("btn-disabled-fg"))};
    border-color: ${I("btn-disabled-border",E("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${I("btn-disabled-opacity",E("btn-disabled-opacity"))};
    cursor: not-allowed;`,co={primary:wt("primary"),secondary:wt("secondary"),ghost:wt("ghost"),danger:wt("danger"),disabled:Zi},S=(s=I("btn-radius",E("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${I("btn-border-width",E("btn-border-width"))} solid transparent;
    border-radius: ${s};
    padding: ${I("btn-padding-y",E("btn-padding-y"))} ${I("btn-padding-x",E("btn-padding-x"))};
    font-family: ${z("font-ui")};
    font-size: ${I("btn-font-size",E("btn-font-size"))};
    line-height: ${I("btn-line-height",E("btn-line-height"))};
    font-weight: ${I("btn-font-weight",E("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${z("dur-fast")} ${z("ease-standard")},
        border-color ${z("dur-fast")} ${z("ease-standard")},
        color ${z("dur-fast")} ${z("ease-standard")},
        box-shadow ${z("dur-fast")} ${z("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${I("btn-focus-ring-width",E("btn-focus-ring-width"))} ${I("btn-focus-ring",E("btn-focus-ring"))};
    }
    ${co[e]}
    &:disabled {${Zi}}
`,uo=`max(${I("field-border-width",E("field-border-width"))}, ${I("field-rule-width",E("field-rule-width"))})`,xt=(s,e)=>`
    border-top-color: ${s};
    border-right-color: ${s};
    border-left-color: ${s};
    border-bottom-color: ${e};`,re=()=>`
    border-style: solid;
    border-top-width: ${I("field-border-width",E("field-border-width"))};
    border-right-width: ${I("field-border-width",E("field-border-width"))};
    border-left-width: ${I("field-border-width",E("field-border-width"))};
    border-bottom-width: ${uo};
    ${xt(I("field-border",E("field-border")),I("field-rule",E("field-rule")))}
    border-radius: ${I("field-radius",E("field-radius"))};
    padding: ${I("field-padding-y",E("field-padding-y"))} ${I("field-padding-x",E("field-padding-x"))};
    background: ${I("field-bg",E("field-bg"))};
    color: ${z("text")};
    font-family: ${z("font-ui")};
    font-size: ${I("field-font-size",E("field-font-size"))};
    line-height: ${I("field-line-height",E("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${z("dur-fast")} ${z("ease-standard")},
        box-shadow ${z("dur-fast")} ${z("ease-standard")},
        background ${z("dur-fast")} ${z("ease-standard")};
    &::placeholder { color: ${z("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${xt(I("field-focus-border",E("field-focus-border")),I("field-focus-border",E("field-focus-border")))}
        background: ${I("field-bg-focus",E("field-bg-focus"))};
        box-shadow: 0 0 0 ${I("field-focus-ring-width",E("field-focus-ring-width"))} ${I("field-focus-ring",E("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${xt(I("field-invalid-border",E("field-invalid-border")),I("field-invalid-rule",E("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${xt(I("field-invalid-border",E("field-invalid-border")),I("field-invalid-rule",E("field-invalid-rule")))}
        background: ${I("field-bg-focus",E("field-bg-focus"))};
        box-shadow: 0 0 0 ${I("field-focus-ring-width",E("field-focus-ring-width"))} ${I("field-invalid-ring",E("field-invalid-ring"))};
    }
`,ho=()=>`
    display: block;
    font-family: ${z("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${z("text-muted")};
`,R=s=>`
    background: ${z("surface")};
    border: 1px solid ${z("border")};
    border-radius: ${z("radius-md")};
    box-shadow: ${z("shadow-1")};
    ${s?.hover?`
    transition:
        box-shadow ${z("dur-base")} ${z("ease-standard")},
        border-color ${z("dur-base")} ${z("ease-standard")};
    &:hover { box-shadow: ${z("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${ho()}
        margin: 0 0 ${a("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${z("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${z("text")};
    }
    & .ui-card__meta {
        margin: ${a("xs")} 0 0 0;
        font-family: ${z("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${z("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${a("md")};
        font-family: ${z("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${z("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;function po(s){return{async me(){return y({method:"GET",url:`${s}/players/me`})},async register(e){return y({method:"POST",url:`${s}/players/register`,body:e})},async updateHandicap(e){return y({method:"POST",url:`${s}/players/me/handicap`,body:e})},async confirmHandicap(){return y({method:"POST",url:`${s}/players/me/handicap/confirm`,body:{}})},async myHandicapHistory(){return y({method:"GET",url:`${s}/players/me/handicap-history`})},async updateProfile(e){return y({method:"POST",url:`${s}/players/me/profile`,body:e})},async search(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/players/search${n?"?"+n:""}`})}}}function fo(s){return{async list(){return y({method:"GET",url:`${s}/friends`})},async add(e){return y({method:"POST",url:`${s}/friends`,body:e})},async remove(e){return y({method:"DELETE",url:`${s}/friends/${e.friendId}`})}}}function mo(s){return{async list(){return y({method:"GET",url:`${s}/clubs`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/clubs/get${n?"?"+n:""}`})},async create(e){return y({method:"POST",url:`${s}/clubs`,body:e})},async update(e){return y({method:"POST",url:`${s}/clubs/update`,body:e})},async remove(e){return y({method:"DELETE",url:`${s}/clubs/${e.id}`})}}}function go(s){return{async list(){return y({method:"GET",url:`${s}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/courses/by-club${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/courses/get${n?"?"+n:""}`})},async teeRoleCatalog(){return y({method:"GET",url:`${s}/courses/tee-roles/catalog`})},async teeRoles(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/courses/tee-roles${n?"?"+n:""}`})},async create(e){return y({method:"POST",url:`${s}/courses`,body:e})},async update(e){return y({method:"POST",url:`${s}/courses/update`,body:e})},async updateHole(e){return y({method:"POST",url:`${s}/courses/holes/update`,body:e})},async setTeeRole(e){return y({method:"POST",url:`${s}/courses/tee-roles`,body:e})},async clearTeeRole(e){return y({method:"DELETE",url:`${s}/courses/tee-roles/${e.courseId}/${e.roleKey}/${e.gender}`})},async validate(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/courses/validate${n?"?"+n:""}`})},async remove(e){return y({method:"DELETE",url:`${s}/courses/${e.id}`})}}}function bo(s){return{async listByCourse(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/tees/by-course${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/tees/get${n?"?"+n:""}`})},async create(e){return y({method:"POST",url:`${s}/tees`,body:e})},async update(e){return y({method:"POST",url:`${s}/tees/update`,body:e})},async remove(e){return y({method:"DELETE",url:`${s}/tees/${e.id}`})}}}function yo(s){return{async create(e){return y({method:"POST",url:`${s}/guest-players`,body:e})}}}function _o(s){return{async latest(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/handicap/latest${n?"?"+n:""}`})},async history(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/handicap/history${n?"?"+n:""}`})},async record(e){return y({method:"POST",url:`${s}/handicap/record`,body:e})}}}function vo(s){return{async list(){return y({method:"GET",url:`${s}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/rounds/balls${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/rounds/get${n?"?"+n:""}`})},async create(e){return y({method:"POST",url:`${s}/rounds`,body:e})},async createFromDraft(e){return y({method:"POST",url:`${s}/rounds/from-draft`,body:e})},async update(e){return y({method:"POST",url:`${s}/rounds/update`,body:e})},async remove(e){return y({method:"DELETE",url:`${s}/rounds/${e.id}`})}}}function wo(s){return{async listByRound(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/score-events/by-round${n?"?"+n:""}`})},async append(e){return y({method:"POST",url:`${s}/score-events`,body:e})}}}function xo(s){return{async forBall(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/scorecards/for-ball${n?"?"+n:""}`})},async forRound(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/scorecards/for-round${n?"?"+n:""}`})}}}function ko(s){return{async forRound(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/leaderboards/for-round${n?"?"+n:""}`})}}}function $o(s){return{async create(e){return y({method:"POST",url:`${s}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/by-token${n?"?"+n:""}`})},async balls(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/balls${n?"?"+n:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/scorecard${n?"?"+n:""}`})},async result(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/result${n?"?"+n:""}`})},async score(e){return y({method:"POST",url:`${s}/friendly-rounds/score`,body:e})},async setup(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/setup${n?"?"+n:""}`})},async editSetup(e){return y({method:"POST",url:`${s}/friendly-rounds/setup`,body:e})},async remove(e){return y({method:"DELETE",url:`${s}/friendly-rounds/${e.token}`})},async finish(e){return y({method:"POST",url:`${s}/friendly-rounds/finish`,body:e})},async reopen(e){return y({method:"POST",url:`${s}/friendly-rounds/reopen`,body:e})},async setVisibility(e){return y({method:"POST",url:`${s}/friendly-rounds/visibility`,body:e})},async join(e){return y({method:"POST",url:`${s}/friendly-rounds/join`,body:e})},async leave(e){return y({method:"POST",url:`${s}/friendly-rounds/leave`,body:e})},async claimGuest(e){return y({method:"POST",url:`${s}/friendly-rounds/claim-guest`,body:e})},async renameGuest(e){return y({method:"POST",url:`${s}/friendly-rounds/rename-guest`,body:e})},async claimSeat(e){return y({method:"POST",url:`${s}/friendly-rounds/claim-seat`,body:e})},async releaseSeat(e){return y({method:"POST",url:`${s}/friendly-rounds/release-seat`,body:e})}}}function So(s){return{async myRounds(){return y({method:"GET",url:`${s}/dashboard/my-rounds`})},async friendsActivity(){return y({method:"GET",url:`${s}/dashboard/friends-activity`})}}}function To(s){return{async clubs(){return y({method:"GET",url:`${s}/setup/clubs`})},async courses(){return y({method:"GET",url:`${s}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/setup/tees/by-course${n?"?"+n:""}`})},async teeRoleCatalog(){return y({method:"GET",url:`${s}/setup/tee-roles/catalog`})},async teeRolesByCourse(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/setup/tee-roles/by-course${n?"?"+n:""}`})},async formats(){return y({method:"GET",url:`${s}/setup/formats`})},async aggregations(){return y({method:"GET",url:`${s}/setup/aggregations`})},async formations(){return y({method:"GET",url:`${s}/setup/formations`})}}}function Po(s){return{async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/competitions/get${n?"?"+n:""}`})},async participants(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/competitions/participants${n?"?"+n:""}`})},async leaderboard(e){const t=new Set(["id"]),n=new URLSearchParams;for(const[r,o]of Object.entries(e))!t.has(r)&&o!==void 0&&n.set(r,String(o));const i=n.toString();return y({method:"GET",url:`${s}/competitions/${e.id}/leaderboard${i?"?"+i:""}`})},async results(e){const t=new Set(["id"]),n=new URLSearchParams;for(const[r,o]of Object.entries(e))!t.has(r)&&o!==void 0&&n.set(r,String(o));const i=n.toString();return y({method:"GET",url:`${s}/competitions/${e.id}/results${i?"?"+i:""}`})},async list(){return y({method:"GET",url:`${s}/competitions`})},async create(e){return y({method:"POST",url:`${s}/competitions`,body:e})},async update(e){return y({method:"POST",url:`${s}/competitions/update`,body:e})},async transition(e){return y({method:"POST",url:`${s}/competitions/transition`,body:e})},async createRound(e){const t=new Set(["id"]),n={};for(const[i,r]of Object.entries(e))t.has(i)||(n[i]=r);return y({method:"POST",url:`${s}/competitions/${e.id}/rounds`,body:n})},async applyCut(e){const t=new Set(["id"]),n={};for(const[i,r]of Object.entries(e))t.has(i)||(n[i]=r);return y({method:"POST",url:`${s}/competitions/${e.id}/cut`,body:n})},async finalize(e){const t=new Set(["id"]),n={};for(const[i,r]of Object.entries(e))t.has(i)||(n[i]=r);return y({method:"POST",url:`${s}/competitions/${e.id}/finalize`,body:n})},async addParticipant(e){return y({method:"POST",url:`${s}/competitions/participants/add`,body:e})},async removeParticipant(e){return y({method:"POST",url:`${s}/competitions/participants/remove`,body:e})},async withdrawParticipant(e){return y({method:"POST",url:`${s}/competitions/participants/withdraw`,body:e})}}}function Co(s){return{async myRoles(){return y({method:"GET",url:`${s}/me/roles`})},async adminStats(){return y({method:"GET",url:`${s}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/admin/rounds${n?"?"+n:""}`})},async adminPlayers(){return y({method:"GET",url:`${s}/admin/players`})},async adminGrantRole(e){return y({method:"POST",url:`${s}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return y({method:"POST",url:`${s}/admin/roles/revoke`,body:e})}}}function Io(s){return{async myConfig(){return y({method:"GET",url:`${s}/players/me/stats-config`})},async putMyConfig(e){return y({method:"PUT",url:`${s}/players/me/stats-config`,body:e})},async myStats(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/players/me/stats${n?"?"+n:""}`})},async myRoundStats(e){const t=new Set(["roundId"]),n=new URLSearchParams;for(const[r,o]of Object.entries(e))!t.has(r)&&o!==void 0&&n.set(r,String(o));const i=n.toString();return y({method:"GET",url:`${s}/players/me/rounds/${e.roundId}/stats${i?"?"+i:""}`})},async appendEvents(e){return y({method:"POST",url:`${s}/friendly-rounds/stat-events`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/stats${n?"?"+n:""}`})},async configsByToken(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/stats-configs${n?"?"+n:""}`})}}}function Eo(s){return{async profile(e){const t=new Set(["playerId"]),n=new URLSearchParams;for(const[r,o]of Object.entries(e))!t.has(r)&&o!==void 0&&n.set(r,String(o));const i=n.toString();return y({method:"GET",url:`${s}/friends/${e.playerId}/profile${i?"?"+i:""}`})},async rounds(e){const t=new Set(["playerId"]),n=new URLSearchParams;for(const[r,o]of Object.entries(e))!t.has(r)&&o!==void 0&&n.set(r,String(o));const i=n.toString();return y({method:"GET",url:`${s}/friends/${e.playerId}/rounds${i?"?"+i:""}`})},async courses(e){const t=new Set(["playerId"]),n=new URLSearchParams;for(const[r,o]of Object.entries(e))!t.has(r)&&o!==void 0&&n.set(r,String(o));const i=n.toString();return y({method:"GET",url:`${s}/friends/${e.playerId}/courses${i?"?"+i:""}`})}}}function Ro(s){return{async round(e){const t=new Set(["roundId"]),n=new URLSearchParams;for(const[r,o]of Object.entries(e))!t.has(r)&&o!==void 0&&n.set(r,String(o));const i=n.toString();return y({method:"GET",url:`${s}/spectate/rounds/${e.roundId}${i?"?"+i:""}`})}}}const W="/tapscore/".replace(/\/+$/,"")+"/api",w={players:po(W),friends:fo(W),clubs:mo(W),courses:go(W),tees:bo(W),guestPlayers:yo(W),handicap:_o(W),rounds:vo(W),scoreEvents:wo(W),scorecards:xo(W),leaderboards:ko(W),friendlyRounds:$o(W),dashboard:So(W),setup:To(W),competitions:Po(W),admin:Co(W),playerStats:Io(W),friendProfile:Eo(W),spectate:Ro(W)};function No(s){return[...s.played?["Played"]:[],...s.created?["Created"]:[]].join(" · ")}function Oo(s,e){const t=new Map;for(const n of e)t.set(n.round.id,{round:n.round,token:n.friendlyRound.shareToken,holesPlayed:null,played:!1,created:!0});for(const n of s){const i=t.get(n.round.id);i?(i.played=!0,i.holesPlayed=n.progress?.holesPlayed??null):t.set(n.round.id,{round:n.round,token:n.shareToken,holesPlayed:n.progress?.holesPlayed??null,played:!0,created:!1})}return[...t.values()].sort((n,i)=>(i.round.lastActivityAt??"").localeCompare(n.round.lastActivityAt??"")||i.round.date.localeCompare(n.round.date)||n.round.id.localeCompare(i.round.id))}function Ho(s,e){return s.filter(t=>t.played&&!t.created&&!e.has(t.round.id)).slice().sort((t,n)=>n.round.date.localeCompare(t.round.date)||t.round.id.localeCompare(n.round.id))}function kt(s,e){return s.some(t=>t.round.id===e)?s.filter(t=>t.round.id!==e):s}function J(){try{return globalThis.localStorage??null}catch{return null}}function Xe(s,e,t){return{read(n=J()){if(!n)return e.empty;let i;try{i=n.getItem(s)}catch{return e.empty}if(!i)return e.empty;try{return e.decode(i)}catch{return e.empty}},write(n,i=J()){if(!i)return e.empty;const r=t!==void 0&&Array.isArray(n)?n.slice(0,t):n;try{i.setItem(s,e.encode(r))}catch{}return r}}}function Qs(s){return{decode(e){const t=JSON.parse(e);return Array.isArray(t)?t.filter(s):[]},encode:e=>JSON.stringify(e),get empty(){return[]}}}const Mo=500,Js=Xe("tapscore.seen-rounds.v1",Qs(s=>typeof s=="string"),Mo);function Qt(s=J()){return Js.read(s)}function ms(s=J()){return new Set(Qt(s))}function Ao(s,e=J()){return Qt(e).includes(s)}function Bo(s,e=J()){if(!e)return[];const t=Qt(e).filter(n=>n!==s);return Js.write([s,...t],e)}function er(s,e=J()){if(!e)return[];const t=Qt(e),n=t.filter(i=>i!==s);return n.length!==t.length&&Js.write(n,e),n}const zo=50,Zs=Xe("tapscore.device-rounds.v1",Qs(Lo),zo);function Jt(s=J()){return Zs.read(s)}function Lo(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.courseName=="string"&&(e.status==="not_started"||e.status==="active"||e.status==="complete")&&typeof e.lastSeenAt=="string"}function et(s,e=J()){if(!e)return[];const t=Jt(e).filter(n=>n.token!==s.token);return Zs.write([s,...t],e)}function tr(s,e=J()){if(!e)return[];const t=Jt(e),n=t.filter(i=>i.token!==s);return n.length!==t.length&&Zs.write(n,e),n}class Zt{mine=new p(null);mineLoading=new p(!1);mineError=new p(null);myRounds=new T(()=>{const e=this.mine.get();return e?Oo(e.produced,e.created):[]});deviceRounds=new p([]);seenIds=new p(ms());newRounds=new T(()=>Ho(this.myRounds.get(),this.seenIds.get()));async loadMine(){this.seenIds.set(ms());const e=await F(this.mineLoading,this.mineError,()=>w.dashboard.myRounds());e&&this.mine.set(e)}loadDevice(){this.deviceRounds.set(Jt())}clear(){this.mine.set(null),this.mineError.set(null),this.mineLoading.set(!1),this.seenIds.set(ms()),this.loadDevice()}async remove(e,t){try{await w.friendlyRounds.remove({token:e})}catch(i){if(!(i instanceof Q)||i.status!==404)return!1}const n=this.mine.get();return n&&this.mine.set({produced:kt(n.produced,t),created:kt(n.created,t)}),this.deviceRounds.set(tr(e)),er(t),!0}async leave(e,t){try{const i=await w.friendlyRounds.leave({token:e});if(!i.ok)return{ok:!1,message:i.diagnostics.map(r=>r.message).join(" · ")}}catch{return{ok:!1,message:"Could not remove you right now. Try again."}}const n=this.mine.get();return n&&this.mine.set({produced:kt(n.produced,t),created:kt(n.created,t)}),{ok:!0}}}const Fo={DEV:!1};function Go(s,e){return s===void 0||s===""?e:s!=="0"&&s.toLowerCase()!=="false"}const Cn=Fo??{},sr={competitions:Go(Cn.VITE_FEATURE_COMPETITIONS,!!Cn.DEV)},jo='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v10h12V10"/><path d="M10 20v-5.5h4V20"/></svg>',Do='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M3.5 20c.5-3.5 2.7-5.5 5.5-5.5s5 2 5.5 5.5"/><circle cx="16.5" cy="9.5" r="2.8"/><path d="M16.8 14.6c2.2.4 3.5 2 3.9 4.9"/></svg>',qo='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v3a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5v2a3 3 0 0 0 3 3"/><path d="M16 5h3v2a3 3 0 0 1-3 3"/><path d="M10 12.5V15h4v-2.5"/><path d="M9 20h6"/><path d="M12 15v5"/></svg>';function Vo(s){const e=[{key:"home",label:"Home",href:"/",icon:jo},{key:"friends",label:"Friends",href:"/friends",icon:Do}];return s.competitions&&e.push({key:"comps",label:"Comps",href:"/competitions",icon:qo}),e}const Uo=["/login","/round"];function en(s){return!Uo.includes(s)}function In(s,e){return e&&en(s)}function Ko(s){return en(s)&&s!=="/create"}const Wo=b(`
    <div class="dock" bind="root">
        <button bind="play" class="dock__play" type="button">Play golf</button>
        <nav class="tabbar" bind="bar">
            <div bind="left" class="tabbar__side"></div>
            <span class="tabbar__gap" aria-hidden="true"></span>
            <div bind="right" class="tabbar__side"></div>
        </nav>
    </div>
`),Yo=b(`
    <a bind="link">
        <span class="tabbar__icon">
            <span bind="icon" class="tabbar__glyph"></span>
            <span bind="badge" class="tabbar__badge"></span>
        </span>
        <span bind="label"></span>
    </a>
`);class Xo extends M{static styles=`
        .dock {
            /* The pill is positioned against this box, so it can hang over the
               bar's top edge without either side guessing the other's height. */
            position: relative;

            & .dock__play {
                ${S(l("radius-pill"))}
                position: absolute;
                left: 50%;
                /* Half the pill's height above the bar's top edge — that
                   overlap is what makes it read as floating rather than as a
                   third tab. */
                bottom: calc(100% - 22px);
                transform: translateX(-50%);
                z-index: 10;
                min-height: 44px;
                padding: ${a("sm")} ${a("xl")};
                font-family: ${l("font-display")};
                font-size: 1.1rem;
                font-weight: 600;
                background: ${l("primary")};
                color: ${l("primary-text")};
                border: none;
                box-shadow: ${l("shadow-elevated")};
                white-space: nowrap;

                &:hover { background: ${l("primary")}; color: ${l("primary-text")}; }
                &:focus-visible { outline: 2px solid ${l("accent")}; outline-offset: 3px; }
                &.hidden { display: none; }

                /* Signed out there is no bar under the pill, so there is
                   nothing to hang off: it sits on the viewport's own bottom
                   edge, clear of the home indicator. */
                &.dock__play--floating {
                    position: fixed;
                    bottom: calc(env(safe-area-inset-bottom) + ${a("lg")});
                }
            }
        }

        .tabbar {
            display: flex;
            background: ${l("topbar-bg")};
            padding-bottom: env(safe-area-inset-bottom);

            &.hidden { display: none; }

            & .tabbar__side { flex: 1; display: flex; }
            /* The pill's landing zone. Fixed even on routes where the pill is
               hidden (/create), so the tabs never jump between screens. */
            & .tabbar__gap { flex: 0 0 9.5rem; }

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
    `;router=this.inject(q);auth=this.inject(V);landing=this.inject(Zt);newCount=new T(()=>this.auth.currentUser.get()?this.landing.newRounds.get().length:0);render(){const e=this.wire(Wo,{bar:{className:()=>In(this.router.route.get(),this.auth.currentUser.get()!==null)?"tabbar":"tabbar hidden"},play:{className:()=>{const r=this.router.route.get();return Ko(r)?In(r,this.auth.currentUser.get()!==null)?"dock__play":"dock__play dock__play--floating":"dock__play hidden"},onclick:()=>this.router.navigate("/create")}}),t=Vo(sr),n=Math.ceil(t.length/2),i=(r,o)=>this.wireEl(Yo,{link:{...this.router.link(r.href),href:r.href},icon:{innerHTML:()=>r.icon},label:()=>r.label,badge:{textContent:()=>{if(r.key!=="home")return"";const d=this.newCount.get();return d===0?"":String(d)},className:()=>(r.key==="home"?this.newCount.get():0)===0?"tabbar__badge":"tabbar__badge show"}},o);return this.$each(this.ref(e,"left"),()=>t.slice(0,n),(r,o,d)=>i(r,d),r=>r.key),this.$each(this.ref(e,"right"),()=>t.slice(n),(r,o,d)=>i(r,d),r=>r.key),e}}const nr=["tee","approach","putting","shortGame","penalties","recovery"],Ot={enabled:!1,tee:!1,approach:!1,putting:!1,shortGame:!1,penalties:!1,recovery:!1};function ir(s){switch(s){case"tee":return"Tee shots";case"approach":return"Greens in regulation";case"putting":return"Putting";case"shortGame":return"Short game";case"penalties":return"Penalties";case"recovery":return"Recovery"}}function Qo(s){switch(s){case"tee":return"Fairway, in play or trouble — asked on par 4s and 5s.";case"approach":return"Did the ball hit the green in regulation.";case"putting":return"How long the first putt was, and how many you took.";case"shortGame":return"Standard or hard, asked only when you missed the green.";case"penalties":return"How many penalty strokes the hole cost you.";case"recovery":return"Whether the recovery shot got you back in play."}}const Jo="Track statistics",Zo="Adds a few taps per hole while you score — turn it off any time, your picks are kept.";function rr(s){switch(s){case"shortGame":return"putting";case"recovery":return"tee";default:return null}}function Mt(s,e){return s[e]}function el(s,e){if(!s.enabled)return!0;const t=rr(e);return t===null?!1:!Mt(s,t)}function tl(s,e){if(!s.enabled)return null;const t=rr(e);return t===null||Mt(s,t)?null:`Needs ${ir(t)}`}function sl(s,e,t){return il({...s,[e]:t})}function nl(s,e){return{...s,enabled:e}}function il(s){const e={...s};return e.putting||(e.shortGame=!1),e.tee||(e.recovery=!1),e}function gs(s){const e={...Ot,enabled:s.enabled};for(const t of nr)e[t]=s[t];return e}function rl(s){return s.avatarVersion?`${W}/players/${encodeURIComponent(s.id)}/avatar?v=${s.avatarVersion}`:null}function al(s,e){const t=(s??"").trim().split(/\s+/).filter(i=>i.length>0);if(t.length>=2)return($t(t[0])+$t(t[t.length-1])).toUpperCase();if(t.length===1)return $t(t[0]).toUpperCase();const n=(e??"").trim();return n.length>0?$t(n).toUpperCase():"•"}function $t(s){return[...s][0]??""}const St=512,ol=2*1024*1024;function ll(s,e){const t=Math.min(s,e);return{sx:Math.round((s-t)/2),sy:Math.round((e-t)/2),size:t}}const dl=.85;class tt extends Error{}async function cl(s){let e;try{e=await createImageBitmap(s)}catch{throw new tt("That image could not be read. Try a JPEG or PNG.")}try{const{sx:t,sy:n,size:i}=ll(e.width,e.height),r=document.createElement("canvas");r.width=St,r.height=St;const o=r.getContext("2d");if(!o)throw new tt("This browser cannot process images.");o.drawImage(e,t,n,i,i,0,0,St,St);const d=await new Promise(c=>r.toBlob(c,"image/jpeg",dl));if(!d)throw new tt("That image could not be processed.");if(d.size>ol)throw new tt("That image is too large.");return d}finally{e.close()}}async function ul(s){const e=await fetch(`${W}/players/me/avatar`,{method:"PUT",headers:{"Content-Type":s.type||"application/octet-stream"},body:s});if(!e.ok)throw await ar(e);return await e.json()}async function hl(){const s=await fetch(`${W}/players/me/avatar`,{method:"DELETE"});if(!s.ok)throw await ar(s)}async function ar(s){const e=await s.json().catch(()=>({})),t=s.status===413?400:s.status;return new Q(t,pl(e.error,s.status))}function pl(s,e){return s==="too_large"||e===413?"That image is too large.":s==="unsupported_type"?"That file is not a JPEG, PNG or WebP image.":s==="empty"?"That image was empty.":s??"Photo upload failed."}class Ie{loading=new p(!1);error=new p(null);player=new p(null);history=new p([]);clubs=new p([]);teeRoles=new p([]);saving=new p(!1);saveError=new p(null);saveTarget=new p(null);statsConfig=new p(Ot);statsSaving=new p(!1);statsError=new p(null);hasRecordedStats=new p(!1);avatarSaving=new p(!1);avatarError=new p(null);async load(e=!1){if(!e&&(this.player.get()!==null||this.loading.get()))return;const t=await F(this.loading,this.error,()=>Promise.all([w.players.me(),w.players.myHandicapHistory(),w.clubs.list(),w.setup.teeRoleCatalog().catch(()=>[]),w.playerStats.myConfig().catch(()=>null),w.playerStats.myStats({limit:1}).catch(()=>null)]));if(!t)return;const[n,i,r,o,d,c]=t;this.player.set(n),this.history.set(i),this.clubs.set(r),this.teeRoles.set(o),this.statsConfig.set(d?gs(d):Ot),this.hasRecordedStats.set((c?.rounds.length??0)>0)}clear(){this.player.set(null),this.history.set([]),this.teeRoles.set([]),this.error.set(null),this.saveError.set(null),this.statsConfig.set(Ot),this.statsError.set(null),this.hasRecordedStats.set(!1),this.avatarError.set(null)}async saveIndex(e){return this.saveTarget.set("index"),await F(this.saving,this.saveError,()=>w.players.updateHandicap({handicapIndex:e}))?(await this.load(!0),!0):!1}async saveDisplayName(e){this.saveTarget.set("name");const t=await F(this.saving,this.saveError,()=>w.players.updateProfile({displayName:e}));return t?(this.player.set(t),!0):!1}async confirmHandicap(){this.saveTarget.set("index");const e=await F(this.saving,this.saveError,()=>w.players.confirmHandicap());return e?(this.player.set(e),!0):!1}async saveGender(e){this.saveTarget.set("gender");const t=await F(this.saving,this.saveError,()=>w.players.updateProfile({gender:e}));return t?(this.player.set(t),!0):!1}async saveHomeClub(e){this.saveTarget.set("club");const t=await F(this.saving,this.saveError,()=>w.players.updateProfile({homeClubId:e}));return t?(this.player.set(t),!0):!1}async savePreferredTeeRole(e){this.saveTarget.set("tee");const t=await F(this.saving,this.saveError,()=>w.players.updateProfile({preferredTeeRoleKey:e}));return t?(this.player.set(t),!0):!1}async saveStatsConfig(e){if(this.statsSaving.get()||this.saving.get())return!1;const t=await F(this.statsSaving,this.statsError,()=>w.playerStats.putMyConfig(gs(e)));return t?(this.statsConfig.set(gs(t)),!0):!1}async saveAvatar(e){this.avatarError.set(null);let t;try{t=await cl(e)}catch(i){return this.avatarError.set({code:"validation",message:i instanceof tt?i.message:"That image could not be prepared."}),!1}const n=await F(this.avatarSaving,this.avatarError,()=>ul(t));return n?(this.patchAvatarVersion(n.avatarVersion),!0):!1}async removeAvatar(){return await F(this.avatarSaving,this.avatarError,()=>hl().then(()=>!0))?(this.patchAvatarVersion(null),!0):!1}patchAvatarVersion(e){const t=this.player.get();t&&this.player.set({...t,avatarVersion:e})}homeClubName(){const e=this.player.get()?.homeClubId;return e?this.clubs.get().find(t=>t.id===e)?.name??null:null}}function Tt(s){const e=[],t=[];for(const n of s)(n.isMutual?e:t).push(n);return{mutual:e,addedByMe:t}}function bs(s,e){return s.displayName.localeCompare(e.displayName,"sv",{sensitivity:"base"})}function At(s,e="frecency"){return e==="alpha"?[...s].sort(bs):[...s].sort((t,n)=>{const i=t.frecency,r=n.frecency,o=i>0,d=r>0;if(o!==d)return o?-1:1;if(!o)return bs(t,n);if(r!==i)return r-i;const c=t.lastPlayedAt?Date.parse(t.lastPlayedAt):NaN,u=n.lastPlayedAt?Date.parse(n.lastPlayedAt):NaN,h=Number.isNaN(c)?Number.NEGATIVE_INFINITY:c,f=Number.isNaN(u)?Number.NEGATIVE_INFINITY:u;return f!==h?f-h:bs(t,n)})}const fl=1440*60*1e3;function ml(s,e){if(!s)return null;const t=Date.parse(s),n=Date.parse(e);if(Number.isNaN(t)||Number.isNaN(n))return null;const i=Math.floor((n-t)/fl);if(i<=0)return"today";if(i===1)return"yesterday";if(i<7)return`${i} days ago`;if(i<14)return"last week";if(i<30)return`${Math.floor(i/7)} weeks ago`;if(i<60)return"last month";if(i<365)return`${Math.floor(i/30)} months ago`;const r=Math.floor(i/365);return r===1?"last year":`${r} years ago`}function gl(s,e){if(s.sharedRoundCount<=0)return"never played";const t=ml(s.lastPlayedAt,e),n=`played ${s.sharedRoundCount}×`;return t?`${n}, ${t}`:n}function bl(s){return`@${s.username}`}function yl(s){return s.homeClubName?.trim()??""}const or=2;function En(s){return s.trim().length>=or}function lr(s){return At(s,"frecency")}function _l(s,e){return lr([...s.filter(t=>t.id!==e.id),e])}function vl(s,e){return s.filter(t=>t.id!==e)}function Rn(s,e,t){return s.map(n=>n.id===e?{...n,isFriend:t}:n)}function wl(s,e,t=()=>{},n=300){let i=0,r;return o=>{const d=o.trim(),c=++i;if(r!==void 0&&clearTimeout(r),r=void 0,d.length<or){e(d,[]);return}r=setTimeout(()=>{s(d).then(u=>{c===i&&e(d,u)},u=>{c===i&&t(d,u)})},n)}}const dr=Xe("tapscore.friends.sort.v1",{decode:s=>s==="alpha"?"alpha":"frecency",encode:s=>s,empty:"frecency"});function xl(s=J()){return dr.read(s)}function kl(s,e=J()){dr.write(s,e)}class es{loading=new p(!1);error=new p(null);friends=new p([]);loaded=new p(!1);sortMode=new p(xl());query=new p("");searching=new p(!1);searchError=new p(null);results=new p([]);resultsFor=new p("");mutating=new p(!1);mutateError=new p(null);runSearch=wl(e=>w.players.search({q:e}),(e,t)=>{this.searching.set(!1),this.results.set(t),this.resultsFor.set(e)},(e,t)=>{this.searching.set(!1),this.results.set([]),this.resultsFor.set(e),this.searchError.set({code:"network",message:t instanceof Error?t.message:"Search failed. Try again."})});async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;const t=await F(this.loading,this.error,()=>w.friends.list());t&&(this.friends.set(lr(t)),this.loaded.set(!0))}setQuery(e){this.query.set(e),this.searchError.set(null),this.searching.set(e.trim().length>=2),this.runSearch(e)}async add(e){await F(this.mutating,this.mutateError,()=>w.friends.add({friendId:e.id}))&&(this.friends.set(_l(this.friends.get(),{id:e.id,username:e.username,displayName:e.displayName,gender:e.gender,handicapIndex:e.handicapIndex,homeClubName:e.homeClubName,avatarVersion:e.avatarVersion,sharedRoundCount:0,lastPlayedAt:null,frecency:0,isMutual:!1})),this.results.set(Rn(this.results.get(),e.id,!0)))}setSortMode(e){this.sortMode.set(e),kl(e)}async remove(e){await F(this.mutating,this.mutateError,()=>w.friends.remove({friendId:e}))&&(this.friends.set(vl(this.friends.get(),e)),this.results.set(Rn(this.results.get(),e,!1)))}clear(){this.friends.set([]),this.loaded.set(!1),this.query.set(""),this.results.set([]),this.resultsFor.set(""),this.error.set(null),this.searchError.set(null),this.mutateError.set(null),this.searching.set(!1)}}class tn{feed=new p(null);loading=new p(!1);loaded=!1;async load(e=!1){if(!(!e&&(this.loaded||this.loading.get()))){this.loading.set(!0);try{this.feed.set(await w.dashboard.friendsActivity()),this.loaded=!0}catch{this.feed.set(null)}finally{this.loading.set(!1)}}}clear(){this.feed.set(null),this.loaded=!1,this.loading.set(!1)}}function st(s,e){return s instanceof Q&&s.status===401?(Xi(),"Your session expired — sign in again."):e}function Bt(s){return s===0?"E":s>0?`+${s}`:`${s}`}function $l(s){return s.holesPlayed<=0?"Teeing off":s.scoreToPar===null?`Thru ${s.holesPlayed}`:`Thru ${s.holesPlayed} · ${Bt(s.scoreToPar)}`}function cr(s){const e=s[0];if(!e)return null;const t=s.length-1;return t>0?`${e.displayName} + ${t}`:e.displayName}function ur(s){return(s.courseName??"").trim()||null}function Sl(s){const e=[];for(const t of s){const n=t.friends[0],i=cr(t.friends);!n||!i||e.push({roundId:t.roundId,playerId:n.playerId,avatarVersion:n.avatarVersion,displayName:n.displayName,title:i,courseName:ur(t),progress:$l(n)})}return e}function Tl(s){const e=s.courseName?` at ${s.courseName}`:"";return`${s.title}${e}, live, ${s.progress}. Watch.`}function Pl(s){const e=new Set;for(const t of s)for(const n of t.friends)e.add(n.playerId);return e.size===0?null:e.size===1?"1 friend on the course":`${e.size} friends on the course`}function Cl(s,e){if(!s)return null;for(const t of s.live){const n=t.friends.find(i=>i.playerId===e);if(n)return{roundId:t.roundId,holesPlayed:n.holesPlayed,scoreToPar:n.scoreToPar}}return null}function Il(s){return s.holesPlayed<=0?"On the course now · Teeing off":s.scoreToPar===null?`On the course now · Thru ${s.holesPlayed}`:`On the course now · Thru ${s.holesPlayed} · ${Bt(s.scoreToPar)}`}function El(s){const e=[];for(const t of s){const n=t.friends[0],i=cr(t.friends);!n||!i||e.push({roundId:t.roundId,friendLabel:i,playerId:n.playerId,avatarVersion:n.avatarVersion,displayName:n.displayName,title:ur(t)??"A round",date:t.date,formatIds:t.formatIds??[]})}return e}function hr(s){if(s instanceof Q){if(s.status===403)return"forbidden";if(s.status===404)return"not_found"}return null}const Ke={forbidden:{title:"Profile not available",message:"This profile is no longer shared with you."},not_found:{title:"Player not found",message:"This player doesn't exist anymore."}};function Rl(s){const e=(s.name??"").trim();return e||(s.courseName??"").trim()||"Round"}function Nl(s,e){const t=e(s.date),n=(s.name??"").trim(),i=(s.courseName??"").trim();return n&&i?`${t} · ${i}`:t}function Ol(s){const e=s.holesPlayed;switch(s.status){case"not_started":return"Not started";case"active":return e<=0?"Teeing off":s.scoreToPar===null?`Thru ${e}`:`Thru ${e} · ${Bt(s.scoreToPar)}`;case"complete":{if(e<=0)return"Finished";const t=e<s.holeCount?`Thru ${e}`:"Finished";return s.scoreToPar===null?t:`${t} · ${Bt(s.scoreToPar)}`}}}function Hl(s,e){const t=[];s!==null&&t.push(`Hcp ${s.toFixed(1)}`);const n=(e??"").trim();return n&&t.push(n),t.length>0?t.join(" · "):null}function Ml(s,e){return`${s.roundsPlayed===1?"1 round":`${s.roundsPlayed} rounds`} · last played ${e(s.lastPlayedAt)}`}function Al(s){return s===1?"1 course played":`${s} courses played`}const ys={rounds:[],nextCursor:null,hasMore:!1};function Nn(s,e){const t=new Set(s.rounds.map(n=>n.roundId));return{rounds:[...s.rounds,...e.rounds.filter(n=>!t.has(n.roundId))],nextCursor:e.nextCursor,hasMore:e.hasMore}}function pr(s){return s.hasMore&&s.nextCursor!==null}class ts{playerId=new p(null);unavailable=new p(null);profile=new p(null);profileLoading=new p(!1);profileError=new p(null);profileLoaded=!1;rounds=new p(ys);roundsLoaded=new p(!1);roundsLoading=new p(!1);loadingMore=new p(!1);roundsError=new p(null);roundsGeneration=0;courses=new p([]);coursesHasMore=new p(!1);coursesLoaded=new p(!1);coursesLoading=new p(!1);coursesError=new p(null);setPlayer(e){this.playerId.get()!==e&&(this.playerId.set(e),this.resetData())}async loadProfile(e=!1){const t=this.playerId.get();if(t&&!(!e&&(this.profileLoaded||this.profileLoading.get()))){this.profileLoading.set(!0),this.profileError.set(null);try{const n=await w.friendProfile.profile({playerId:t});if(this.playerId.get()!==t)return;this.profile.set(n),this.profileLoaded=!0,this.unavailable.set(null)}catch(n){if(this.playerId.get()!==t)return;this.refuseOr(n,()=>this.profileError.set(st(n,"Couldn't load this profile.")))}finally{this.playerId.get()===t&&this.profileLoading.set(!1)}}}async loadRounds(e=!1){const t=this.playerId.get();if(!t||!e&&(this.roundsLoaded.get()||this.roundsLoading.get()))return;this.roundsGeneration+=1;const n=this.roundsGeneration;this.roundsLoading.set(!0),this.roundsError.set(null);try{const i=await w.friendProfile.rounds({playerId:t});if(n!==this.roundsGeneration)return;this.rounds.set(Nn(ys,i)),this.roundsLoaded.set(!0),this.unavailable.set(null)}catch(i){if(n!==this.roundsGeneration)return;this.refuseOr(i,()=>this.roundsError.set(st(i,"Couldn't load these rounds.")))}finally{n===this.roundsGeneration&&this.roundsLoading.set(!1)}}async loadMoreRounds(){const e=this.playerId.get(),t=this.rounds.get();if(!e||!this.roundsLoaded.get()||!pr(t)||this.loadingMore.get()||this.roundsLoading.get())return;const n=this.roundsGeneration;this.loadingMore.set(!0),this.roundsError.set(null);try{const i=await w.friendProfile.rounds({playerId:e,cursor:t.nextCursor??void 0});if(n!==this.roundsGeneration)return;this.rounds.set(Nn(this.rounds.get(),i))}catch(i){if(n!==this.roundsGeneration)return;this.refuseOr(i,()=>this.roundsError.set(st(i,"Couldn't load more rounds.")))}finally{n===this.roundsGeneration&&this.loadingMore.set(!1)}}async loadCourses(e=!1){const t=this.playerId.get();if(t&&!(!e&&(this.coursesLoaded.get()||this.coursesLoading.get()))){this.coursesLoading.set(!0),this.coursesError.set(null);try{const n=await w.friendProfile.courses({playerId:t});if(this.playerId.get()!==t)return;this.courses.set(n.courses),this.coursesHasMore.set(n.hasMore),this.coursesLoaded.set(!0),this.unavailable.set(null)}catch(n){if(this.playerId.get()!==t)return;this.refuseOr(n,()=>this.coursesError.set(st(n,"Couldn't load these courses.")))}finally{this.playerId.get()===t&&this.coursesLoading.set(!1)}}}clear(){this.playerId.set(null),this.resetData()}refuseOr(e,t){const n=hr(e);if(n){this.unavailable.set(n),this.resetData(!0);return}t()}resetData(e=!1){e||this.unavailable.set(null),this.profile.set(null),this.profileLoaded=!1,this.profileLoading.set(!1),this.profileError.set(null),this.rounds.set(ys),this.roundsGeneration+=1,this.roundsLoaded.set(!1),this.roundsLoading.set(!1),this.loadingMore.set(!1),this.roundsError.set(null),this.courses.set([]),this.coursesHasMore.set(!1),this.coursesLoaded.set(!1),this.coursesLoading.set(!1),this.coursesError.set(null)}}function fr(s){return s.handicapIndex*(s.slope/113)+(s.courseRating-s.par)}function Bl(s){return Math.round(fr(s))}function zl(s,e,t){const n=t;if(n<=0)return 0;if(s>=0){const c=Math.floor(s/n),u=s-c*n;return c+(e>=1&&e<=u?1:0)}const i=-s,r=Math.floor(i/n),o=i-r*n,d=r+(e>n-o?1:0);return d===0?0:-d}function Ll(s){const e=typeof navigator<"u"?navigator.language:void 0;return typeof e=="string"&&e.toLowerCase().startsWith("sv")?"sv":"en"}function be(){return Ll()}const Ae=10;class We{loading=new p(!1);error=new p(null);descriptors=new p([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await F(this.loading,this.error,()=>w.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=be()){const n=typeof e=="string"?this.byId(e):e;return n?n.labels?.[t]??n.labels?.en??n.label:null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const n=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:n.teamSize?.min??2,max:n.teamSize?.max??2},...n.teamCount?{teamCount:n.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}configLabelOf(e,t=be()){return e.labels?.[t]??e.labels?.en??""}configHintOf(e,t=be()){return e.hint?.[t]??e.hint?.en??""}configFieldIsInline(e,t=be()){return e.options.length>2||e.options.some(n=>this.configHintOf(n,t))?!1:e.options.every(n=>this.configLabelOf(n,t).length<=12)}presets(e=be()){return this.descriptors.get().filter(n=>n.preset).sort((n,i)=>{const r=n.preset?.rank??Number.POSITIVE_INFINITY,o=i.preset?.rank??Number.POSITIVE_INFINITY;return r!==o?r-o:(this.labelOf(n,e)??n.id).localeCompare(this.labelOf(i,e)??i.id)})}taglineOf(e,t=be()){const i=(typeof e=="string"?this.byId(e):e)?.preset?.tagline;return i?.[t]??i?.en??""}playableShape(e){const t=e.requirements.balls;if(t.ballMode==="team")return{count:this.ballCountOf(t.slotBallCount),size:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const n=t.slotTeamGrouping??{},i=n.teamCount??{};return{count:{min:i.min??2,...i.max!==void 0?{max:i.max}:{}},size:{min:n.teamSize?.min??2,max:n.teamSize?.max??2}}}if(t.slotBallCount){const n=this.acceptsSideSubjects(e);return{count:this.ballCountOf(t.slotBallCount),size:{min:1,max:n?Ae:1}}}return{count:{min:1},size:{min:1,max:1}}}ballCountOf(e){return{min:e?.min??2,...e?.max!==void 0?{max:e.max}:{}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}acceptsSideSubjects(e){const t=typeof e=="string"?this.byId(e):e;return!t||this.classify(t).kind==="team_grouping"?!1:(t.requirements.scoreEntry?.metadata?.length??0)===0}}const On=["scramble","foursomes","greensomes"];class Fl{loading=new p(!1);error=new p(null);descriptors=new p([]);inFlight=null;loaded=!1;async load(){if(!this.loaded){if(this.inFlight)return this.inFlight;if(typeof w.setup?.formations=="function")return this.inFlight=(async()=>{const e=await F(this.loading,this.error,()=>w.setup.formations());e&&(this.descriptors.set(e),this.loaded=!0)})().finally(()=>{this.inFlight=null}),this.inFlight}}available(){return this.descriptors.get().length>0}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}ids(){return new Set(this.descriptors.get().map(e=>e.id))}chips(){const e=this.descriptors.get(),t=n=>{const i=On.indexOf(n);return i===-1?On.length:i};return[...e].sort((n,i)=>t(n.id)-t(i.id))}labelOf(e,t=be()){const n=this.byId(e);return n?n.labels?.[t]??n.labels?.en??n.id:e}sizeOf(e){return this.byId(e)?.size??null}fits(e,t){const n=this.sizeOf(e);return n?t>=n.min&&t<=n.max:!0}allowances(e,t){const n=this.byId(e)?.allowancesBySize?.[String(t)];return n&&n.length===t?n:null}}const Gl=180,Hn=4,jl=12;function Ve(s,e){return e<=0?0:Math.max(0,Math.min(e-1,s))}function Dl(s){const{dragDistance:e,velocity:t,itemWidth:n}=s;if(Math.abs(e)<jl)return 0;const i=e+t*Gl,r=Math.round(-i/n);return Math.max(-Hn,Math.min(Hn,r))}const Mn="tapscore:pending-scores:v1",ql=336*60*60*1e3,An=200;function Vl(){try{return globalThis.localStorage??null}catch{return null}}function Ul(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.ballId=="string"&&typeof e.playHoleId=="string"&&(typeof e.strokes=="number"||e.strokes===null)&&(e.eventType==="score_entered"||e.eventType==="score_cleared")&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class Kl{entries=[];storage;constructor(e=Vl(),t=Date.now()){this.storage=e,this.entries=this.load();const n=this.applyHygiene(t);n.length!==this.entries.length&&(this.entries=n,this.persist())}enqueue(e){const t=this.entries.findIndex(n=>n.token===e.token&&n.ballId===e.ballId&&n.playHoleId===e.playHoleId);t>=0?this.entries[t]=e:this.entries.push(e),this.entries=this.applyHygiene(e.queuedAt),this.persist()}remove(e){const t=this.entries.filter(n=>n.clientEventId!==e);t.length!==this.entries.length&&(this.entries=t,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(n=>e-n.queuedAt<=ql);return t.length>An?t.slice(t.length-An):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(Mn);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(Ul):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(Mn,JSON.stringify(this.entries))}catch{}}}const ke=["tee_result","tee_miss_dir","recovery_ok","gir","green_miss_dir","short_game_difficulty","short_game_strokes","first_putt","putts","penalties","penalty_source"],Wl={minPar:4},Yl={tee_result:"Tee shot",tee_miss_dir:"Which side",recovery_ok:"Recovery",gir:"Green in regulation",green_miss_dir:"Missed where",short_game_difficulty:"Short game",short_game_strokes:"Shots to the green",first_putt:"First putt",putts:"Putts",penalties:"Penalties",penalty_source:"Penalty on"},Xl={tee_result:{kind:"segments",options:[{value:"fairway",label:"Fairway"},{value:"in_play",label:"In play"},{value:"trouble",label:"Trouble"}]},tee_miss_dir:{kind:"segments",options:[{value:"left",label:"Left"},{value:"right",label:"Right"}]},gir:{kind:"segments",options:[{value:"0",label:"Miss"},{value:"1",label:"Hit"}]},green_miss_dir:{kind:"segments",options:[{value:"long",label:"Long"},{value:"short",label:"Short"},{value:"left",label:"Left"},{value:"right",label:"Right"}]},first_putt:{kind:"segments",options:[{value:"inside_1m",label:"< 1m"},{value:"1_to_2m",label:"1–2m"},{value:"2_to_4m",label:"2–4m"},{value:"4_to_8m",label:"4–8m"},{value:"over_8m",label:"> 8m"}]},short_game_difficulty:{kind:"segments",options:[{value:"standard",label:"Standard"},{value:"hard",label:"Hard"},{value:"bunker",label:"Bunker"}]},short_game_strokes:{kind:"stepper",min:1,max:5},recovery_ok:{kind:"segments",options:[{value:"0",label:"No"},{value:"1",label:"Yes"}]},putts:{kind:"stepper",min:0,max:3},penalties:{kind:"stepper",min:0,max:null},penalty_source:{kind:"segments",options:[{value:"tee",label:"Tee shot"},{value:"approach",label:"Approach"},{value:"short_or_green",label:"Around the green"}]}};function Ls(s){return Yl[s]}function Bn(s){return Xl[s]}function zn(s,e){return e!==null&&s>=e?`${s}+`:`${s}`}function mr(s,e,t){return s?!(s.minPar!=null&&e<s.minPar||s.maxPar!=null&&e>s.maxPar||s.pars!=null&&!s.pars.includes(e)||s.holes!=null&&!s.holes.includes(t)):!0}function Ql(s,e,t){return e!==null&&e>0&&t!==null&&t>=0&&s>0}function Jl(s,e,t){return e-t<=s-2?"1":"0"}function Fs(s){if(s.girIsLocked)return{state:"manual"};const e=s.isAnswered("gir");if(s.visibility("gir")!=="visible")return e?{state:"persisted"}:{state:"idle"};const t=s.derivedGir();if(t===null)return e?{state:"persisted"}:{state:"idle"};if(!e)return{state:"pending",derived:t};const n=s.value("gir");return n===t?{state:"persisted"}:{state:"disagree",derived:t,stored:n}}class Zl{modules;par;holeNumber;persistedMap;draft=new Map;girLocked=!1;strokes=null;constructor(e,t,n,i={},r=new Map){this.modules=e,this.par=t,this.holeNumber=n,this.persistedMap=Ln(i),this.draft=new Map(r),this.prune()}refresh(e,t,n){const i=this.signature();return this.modules=e,this.persistedMap=Ln(t),this.strokes=n,this.prune(),this.signature()!==i}setScore(e){this.strokes=e}get girIsLocked(){return this.girLocked}derivedGir(){const e=this.intValue("putts");return e===0&&this.value("first_putt")!==null||!Ql(this.par,this.strokes,e)?null:Jl(this.par,this.strokes,e)}materialiseDerivedGir(){const e=Fs(this);return e.state!=="pending"?!1:(this.record("gir",e.derived),this.prune(),!0)}signature(){let e="";for(const t of ke)e+=`${t}:${this.visibility(t)}:${this.value(t)??""};`;return e+=`gir-derived:${Fs(this).state};`,e}get prompts(){const e=[];for(const t of ke)this.isVisible(t)&&e.push({key:t,label:Ls(t),control:Bn(t)});return e}get isEmpty(){return this.prompts.length===0}visibility(e){switch(e){case"tee_result":return this.modules.tee&&mr(Wl,this.par,this.holeNumber)?"visible":"unreadable";case"tee_miss_dir":return!this.modules.tee||this.visibility("tee_result")!=="visible"?"unreadable":this.value("tee_result")==="in_play"||this.value("tee_result")==="trouble"?"visible":"contradicted";case"recovery_ok":return!this.modules.recovery||this.visibility("tee_result")!=="visible"?"unreadable":this.value("tee_result")==="trouble"?"visible":"contradicted";case"gir":return this.modules.approach?"visible":"unreadable";case"green_miss_dir":return!this.modules.approach||this.visibility("gir")!=="visible"?"unreadable":this.value("gir")==="0"?"visible":"contradicted";case"short_game_difficulty":return!this.modules.shortGame||this.visibility("gir")!=="visible"?"unreadable":this.value("gir")==="0"?"visible":"contradicted";case"short_game_strokes":return!this.modules.shortGame||this.visibility("gir")!=="visible"?"unreadable":this.value("gir")==="0"?"visible":"contradicted";case"first_putt":case"putts":return this.modules.putting?"visible":"unreadable";case"penalties":return this.modules.penalties?"visible":"unreadable";case"penalty_source":return!this.modules.penalties||this.visibility("penalties")!=="visible"?"unreadable":(this.intValue("penalties")??0)>=1?"visible":"contradicted"}}isVisible(e){return this.visibility(e)==="visible"}value(e){const t=this.draft.get(e);return t===void 0?this.persistedMap.get(e)??null:"set"in t?t.set:null}intValue(e){const t=this.value(e);if(t===null)return null;const n=Number.parseInt(t,10);return Number.isNaN(n)?null:n}isAnswered(e){return this.value(e)!==null}answer(e,t){this.isVisible(e)&&(e==="gir"&&(this.girLocked=!0),this.record(e,t),this.prune())}step(e,t){const n=Bn(e);if(!this.isVisible(e)||n.kind!=="stepper")return;let i=(this.intValue(e)??n.min)+t;i<n.min&&(i=n.min),n.max!==null&&i>n.max&&(i=n.max),this.record(e,String(i)),this.prune()}record(e,t){if(t!==null){this.persistedMap.get(e)===t?this.draft.delete(e):this.draft.set(e,{set:t});return}this.persistedMap.get(e)===void 0?this.draft.delete(e):this.draft.set(e,{cleared:!0})}prune(){for(let e=0;e<ke.length;e++){let t=!1;for(const n of ke){const i=this.draft.get(n),r=this.visibility(n);r!=="visible"&&(r==="contradicted"?this.record(n,null):this.draft.delete(n),ed(i,this.draft.get(n))||(t=!0))}if(!t)return}}get batch(){const e=[];for(const t of ke){const n=this.draft.get(t);n!==void 0&&e.push({key:t,value:"set"in n?n.set:null})}return e}commitDraft(){for(const[e,t]of this.draft)"set"in t?this.persistedMap.set(e,t.set):this.persistedMap.delete(e);this.draft.clear()}}function ed(s,e){return s===void 0||e===void 0?s===e:"set"in s?"set"in e&&s.set===e.set:!("set"in e)}function Ln(s){if(s instanceof Map)return new Map(s);const e=new Map;for(const t of ke){const n=s[t];n!==void 0&&e.set(t,n)}return e}const Fn="tapscore:pending-stat-events:v1",td=336*60*60*1e3,Gn=500;function sd(){try{return globalThis.localStorage??null}catch{return null}}function nd(){try{return crypto.randomUUID()}catch{return`stat-${Date.now()}-${Math.random().toString(36).slice(2)}`}}function id(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.playHoleId=="string"&&typeof e.playerId=="string"&&typeof e.key=="string"&&ke.includes(e.key)&&(typeof e.value=="string"||e.value===null)&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class rd{entries=[];storage;makeId;constructor(e=sd(),t=Date.now(),n=nd){this.storage=e,this.makeId=n,this.entries=this.load();const i=this.applyHygiene(t);i.length!==this.entries.length&&(this.entries=i,this.persist())}enqueueBatch(e,t,n,i,r=Date.now()){if(i.length===0)return[];const o=[];for(const d of i){const c={token:e,playHoleId:t,playerId:n,key:d.key,value:d.value,clientEventId:this.makeId(),queuedAt:r},u=this.entries.findIndex(h=>h.token===e&&h.playHoleId===t&&h.playerId===n&&h.key===d.key);u>=0?this.entries[u]=c:this.entries.push(c),o.push(c)}return this.entries=this.applyHygiene(r),this.persist(),o}ack(e){if(e.length===0)return;const t=new Set(e),n=this.entries.filter(i=>!t.has(i.clientEventId));n.length!==this.entries.length&&(this.entries=n,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(n=>e-n.queuedAt<=td);return t.length>Gn?t.slice(t.length-Gn):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(Fn);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(id):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(Fn,JSON.stringify(this.entries))}catch{}}}const ad=50;function od(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.cursor=="string"}const sn=Xe("tapscore.result-cursors.v1",Qs(od),ad);function nn(s=J()){return sn.read(s)}function ld(s,e=J()){return nn(e).find(t=>t.token===s)?.cursor??null}function dd(s,e,t=J()){if(!t)return[];const n=nn(t).filter(i=>i.token!==s);return sn.write([{token:s,cursor:e},...n],t)}function cd(s,e=J()){if(!e)return[];const t=nn(e),n=t.filter(i=>i.token!==s);return n.length!==t.length&&sn.write(n,e),n}const ud=["1st","2nd","3rd","4th","5th","6th","7th","8th"],Re=(s,e)=>`${s}|${e}`;function rn(s){return s.players.map(e=>e.displayName).join(" & ")||s.label||"Ball"}function hd(s,e,t){return mr(s,e,t)}function _s(s,e){return`${s.playHoleId}:${s.playerId}:${e}`}function pd(s){const e=new Map;return s.teeResult!==null&&e.set("tee_result",s.teeResult),s.teeMissDir!==null&&e.set("tee_miss_dir",s.teeMissDir),s.recoveryOk!==null&&e.set("recovery_ok",s.recoveryOk?"1":"0"),s.gir!==null&&e.set("gir",s.gir?"1":"0"),s.greenMissDir!==null&&e.set("green_miss_dir",s.greenMissDir),s.shortGameDifficulty!==null&&e.set("short_game_difficulty",s.shortGameDifficulty),s.shortGameStrokes!==null&&e.set("short_game_strokes",String(s.shortGameStrokes)),s.firstPutt!==null&&e.set("first_putt",s.firstPutt),s.putts!==null&&e.set("putts",String(s.putts)),s.penalties!==null&&e.set("penalties",String(s.penalties)),s.penaltySource!==null&&e.set("penalty_source",s.penaltySource),e}function fd(s){const e=s?.status;return typeof e!="number"||e<400||e>=500?!1:e!==401&&e!==408&&e!==429}class ge{constructor(e=new Kl,t=new rd){this.queue=e,this.statQueue=t}queue;statQueue;loading=new p(!1);error=new p(null);friendlyRound=new p(null);round=new p(null);startList=new p(null);balls=new p([]);firstOpen=new p(!1);firstOpenRoundId=null;scorecards=new p([]);cells=new p(new Map);statModules=new p(new Map);statRows=new p([]);statRev=new p(0);statRevN=0;statLocal=new Map;statConfirmedAt=new Map;statStep=null;statCell=null;statPosting=!1;result=new p(null);resultLoading=new p(!1);resultError=new p(null);resultCursor=null;holeIdx=new p(0);groupIdx=new p(0);keypadOpen=new p(!1);finishFlowOpen=new p(!1);selectedSlot=new p(null);token=null;loadSeq=0;resultSeq=0;quietSeq=0;scorecardSeq=0;flushing=!1;pendingSlotIndex=null;async loadByToken(e,t){const n=e!==this.token;this.token=e;const i=++this.loadSeq;n&&this.resetForNewToken(t),Y.get(We).load();const r=await F(this.loading,this.error,()=>w.friendlyRounds.byToken({token:e}));if(!r||i!==this.loadSeq||e!==this.token)return;if(this.friendlyRound.set(r.friendlyRound),this.round.set(r.round),this.startList.set(r.startList),et({token:e,courseName:r.round.courseNameSnapshot??"",name:r.round.name,date:r.round.date,status:r.round.status,completedAt:r.round.completedAt,lastSeenAt:new Date().toISOString()}),this.firstOpenRoundId!==r.round.id&&(this.firstOpenRoundId=r.round.id,this.firstOpen.set(!Ao(r.round.id))),Y.get(V).currentUser.get()&&Bo(r.round.id),this.pendingSlotIndex!==null){const f=r.round.formatSlots[this.pendingSlotIndex]?.slotDefId??null;this.pendingSlotIndex=null,f!==null&&this.selectedSlot.set(f)}const[o,d,c,u]=await Promise.all([w.friendlyRounds.balls({token:e}).catch(()=>[]),w.friendlyRounds.scorecard({token:e}).catch(()=>[]),w.playerStats.configsByToken({token:e}).catch(()=>null),w.playerStats.byToken({token:e}).catch(()=>null)]);i!==this.loadSeq||e!==this.token||(this.flushStats(),c&&this.statModules.set(new Map(c.map(h=>[h.playerId,h.modules]))),u&&(this.statRows.set(u),this.dropConfirmedStatLocals(i)),this.cells.set(new Map),this.scorecards.set(d),this.balls.set(o),n&&t?.holeIdx===void 0&&r.round.status==="active"&&this.holeIdx.set(this.firstIncompleteHoleIndex()),await this.flushPending(),await this.flushPendingStats(),this.refreshStatStep())}deleting=new p(!1);async deleteRound(){const e=this.token;if(!e||this.deleting.get())return!1;this.deleting.set(!0);try{await w.friendlyRounds.remove({token:e}),tr(e);const t=this.round.get()?.id;return t&&er(t),cd(e),!0}catch{return!1}finally{this.deleting.set(!1)}}finishing=new p(!1);async finishRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await w.friendlyRounds.finish({token:e}),n=this.round.get();return e===this.token&&n&&(this.round.set({...n,status:t.status,completedAt:t.completedAt}),et({token:e,courseName:n.courseNameSnapshot??"",name:n.name,date:n.date,status:t.status,completedAt:t.completedAt,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async reopenRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await w.friendlyRounds.reopen({token:e}),n=this.round.get();return e===this.token&&n&&(this.round.set({...n,status:t.status,completedAt:null}),et({token:e,courseName:n.courseNameSnapshot??"",name:n.name,date:n.date,status:t.status,completedAt:null,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async loadResult(){const e=this.token;if(!e)return;const t=++this.resultSeq,n=await F(this.resultLoading,this.resultError,()=>w.friendlyRounds.result({token:e}));t!==this.resultSeq||e!==this.token||n&&(this.setResultCursor(e,n.cursor),n.unchanged||this.result.set(n.result))}async refreshScorecard(){const e=this.token;if(!e)return;const t=++this.scorecardSeq,n=this.loadSeq;let i;try{i=await w.friendlyRounds.scorecard({token:e})}catch{return}t!==this.scorecardSeq||n!==this.loadSeq||e!==this.token||this.scorecards.set(i)}async refreshRound(){const e=this.token;if(!e)return;const t=++this.quietSeq,n=this.loadSeq,i=()=>t!==this.quietSeq||n!==this.loadSeq||e!==this.token;try{const r=await w.friendlyRounds.byToken({token:e});if(i())return;this.friendlyRound.set(r.friendlyRound),this.round.set(r.round),this.startList.set(r.startList);const o=await w.friendlyRounds.balls({token:e}).catch(()=>null);if(o===null||i())return;this.balls.set(o)}catch{}}async refreshAll(e){if(this.token){if(e?.feedWillReconnect){await this.refreshRound();return}await Promise.all([this.refreshRound(),this.pollResult(),this.refreshScorecard()])}}persistedCursor(e=this.token){return e?ld(e):null}setResultCursor(e,t){const n=t!==null&&t!==this.resultCursor;this.resultCursor=t,n&&dd(e,t)}async pollResult(){const e=this.token;if(!e)return;const t=++this.resultSeq;let n;try{n=await w.friendlyRounds.result({token:e,...this.resultCursor!==null?{cursor:this.resultCursor}:{}})}catch{return}t!==this.resultSeq||e!==this.token||(this.setResultCursor(e,n.cursor),n.unchanged||this.result.set(n.result))}onLiveResultEvent(e){const t=this.token,n=this.round.get();if(t&&n&&e.status!==n.status){const i=e.status==="complete"?new Date().toISOString():null;this.round.set({...n,status:e.status,completedAt:i}),et({token:t,courseName:n.courseNameSnapshot??"",name:n.name,date:n.date,status:e.status,completedAt:i,lastSeenAt:new Date().toISOString()})}this.pollResult(),this.refreshScorecard()}ballNameById=new T(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,rn(t));for(const t of this.result.get()?.slots??[])for(const n of t.subjectLabels??[])e.set(n.ballId,n.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}isPending(e){return this.balls.get().find(t=>t.id===e)?.pending===!0}groupLabelByBallId=new T(()=>{const e=new Map,t=this.groups();return t.length<2||t.forEach((n,i)=>{for(const r of n.ballIds)e.set(r,`Group ${i+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}selectedSlotDefId(){const e=this.round.get()?.formatSlots??[];if(e.length===0)return null;const t=this.selectedSlot.get();return t!==null&&e.some(n=>n.slotDefId===t)?t:e[0]?.slotDefId??null}selectSlot(e){this.selectedSlot.set(e)}presentedSlot(e){const t=this.selectedSlotDefId();return e.slots.find(n=>n.slotDefId===t)??e.slots[0]}effectivePlayingHandicap(e){const t=this.presentedSlot(e);return t?.handicapDerivation?.effectivePh??t?.playingHandicap??null}slotStandingFor(e){const t=this.selectedSlotDefId(),n=this.result.get()?.slots.find(r=>r.slotDefId===t);if(!n)return null;const i=r=>r.includes(e.id)||r.some(o=>n.subjectLabels?.some(d=>d.ballId===o&&d.memberBallIds.includes(e.id))??!1);for(const r of n.leaderboard){if(r.kind==="ranked"){const o=r.entries.find(d=>i(d.ballIds));if(!o)continue;return o.total===null?null:o.paceDelta!==void 0?{kind:"pace",delta:r.direction==="high"?-o.paceDelta:o.paceDelta}:{kind:"total",total:o.total}}if(r.kind==="match_summary"){const o=r.matches.find(u=>i(u.sideA.ballIds)||i(u.sideB.ballIds));if(!o)continue;if(o.thru===0&&!o.finished)return null;const d=i(o.sideA.ballIds)?"a":"b";if(o.leader===null||o.magnitude===0)return{kind:"match",text:"AS",tone:"even"};if(o.finished&&o.closeOutRemaining!==null)return{kind:"match",text:`${o.magnitude}&${o.closeOutRemaining}`,tone:o.leader===d?"under":"over"};const c=o.leader===d;return{kind:"match",text:`${o.magnitude} ${c?"UP":"DN"}`,tone:c?"under":"over"}}}return null}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return Ve(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),n=t?.playHoles.find(o=>o.id===e);if(!t||!n)return"";const i=t.playHoles.filter(o=>o.courseHoleNumber===n.courseHoleNumber).sort((o,d)=>o.ordinal-d.ordinal);if(i.length===1)return`${n.courseHoleNumber}`;const r=i.findIndex(o=>o.id===e);return`${n.courseHoleNumber} (${ud[r]??`${r+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(Ve(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(Ve(this.holeIndex()+1,this.playedOrder().length))}firstIncompleteHoleIndex(){const e=this.group();if(!e)return 0;const t=this.balls.get().filter(r=>e.ballIds.includes(r.id)&&!r.pending);if(t.length===0)return 0;const n=new Map(this.scorecards.get().map(r=>[r.ballId,r])),i=e.playedOrder.findIndex(r=>t.some(o=>{const d=n.get(o.id)?.holes.find(c=>c.playHoleId===r.playHoleId);return d?.strokes===null||d===void 0}));return i===-1?0:i}strokesFor(e,t){const n=this.cells.get().get(Re(e,t));return n?n.strokes:this.scorecards.get().find(o=>o.ballId===e)?.holes.find(o=>o.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(Re(e,t))?.status??null}strokesHintFor(e,t){const n=this.round.get();if(!n)return null;const i=this.balls.get().find(u=>u.id===e);if(!i||i.pending)return null;const r=this.effectivePlayingHandicap(i);if(r==null)return null;const o=this.playHoleById(t);if(!o)return null;const d=i.players[0]?.teeName??null,c=o.tees.find(u=>u.teeName===d)?.strokeIndex??o.baseStrokeIndex;return zl(r,c,n.routeSi.allocationCycleSize)}statSubject(e){if(e.pending||e.players.length!==1)return null;const t=e.players[0];return!t||t.pending||t.playerId===null?null:this.statModules.get().has(t.playerId)?t.playerId:null}statPrompts(){return this.statRev.get(),this.statStep?.prompts??[]}statValue(e){return this.statRev.get(),this.statStep?.value(e)??null}statStepperValue(e,t){return this.statRev.get(),this.statStep?.intValue(e)??t}statIsAnswered(e){return this.statRev.get(),this.statStep?.isAnswered(e)===!0}answerStat(e,t){this.statStep&&(this.statStep.answer(e,t),this.bumpStatRev())}stepStat(e,t){this.statStep&&(this.statStep.step(e,t),this.bumpStatRev())}seedStatStep(e){const t=this.statCell;if(e!==null&&t!==null&&e.playerId===t.playerId&&e.playHoleId===t.playHoleId){this.refreshStatStep();return}this.closeStatStep(),this.setStatCell(e,e?this.makeStatStep(e):null)}refreshStatStep(){const e=this.statCell;if(!e){this.statStep!==null&&this.setStatCell(null,null);return}const t=this.statModules.get().get(e.playerId);if(!this.statStep||!t){this.setStatCell(e,this.makeStatStep(e));return}this.statStep.refresh(t,this.persistedStats(e),this.strokesForCell(e))&&this.bumpStatRev()}strokesForCell(e){const t=this.balls.get().find(n=>this.statSubject(n)===e.playerId);return t?this.strokesFor(t.id,e.playHoleId):null}statGirState(){return this.statRev.get(),this.statStep?Fs(this.statStep):{state:"idle"}}setStatCell(e,t){const n=t===null?null:e;this.statCell===n&&this.statStep===t||(this.statCell=n,this.statStep=t,this.bumpStatRev())}bumpStatRev(){this.statRev.set(++this.statRevN)}makeStatStep(e){const t=this.statModules.get().get(e.playerId),n=this.playHoleById(e.playHoleId);if(!t||!n)return null;const i=new Zl(t,n.par,n.courseHoleNumber,this.persistedStats(e));return i.setScore(this.strokesForCell(e)),i}persistedStats(e){const t=this.statRows.get().find(i=>i.playHoleId===e.playHoleId&&i.playerId===e.playerId),n=t?pd(t):new Map;for(const i of ke){const r=_s(e,i);if(!this.statLocal.has(r))continue;const o=this.statLocal.get(r)??null;o===null?n.delete(i):n.set(i,o)}return n}closeStatStep(){return this.statStep?.materialiseDerivedGir()&&this.bumpStatRev(),this.flushStats()}flushStats(){const e=this.statCell,t=this.statStep,n=this.token;if(!e||!t||!n)return!1;const i=t.batch;if(i.length===0)return!1;t.commitDraft(),this.bumpStatRev();for(const r of i)this.writeStatLocal(e,r.key,r.value);return this.statQueue.enqueueBatch(n,e.playHoleId,e.playerId,i),this.postStats(n),!0}writeStatLocal(e,t,n){const i=_s(e,t);this.statLocal.set(i,n),this.statConfirmedAt.delete(i)}confirmStatLocals(e){for(const t of e){const n=_s({playerId:t.playerId,playHoleId:t.playHoleId},t.key);this.statConfirmedAt.set(n,this.loadSeq)}}dropConfirmedStatLocals(e){for(const[t,n]of[...this.statConfirmedAt])e<=n||(this.statLocal.delete(t),this.statConfirmedAt.delete(t))}async flushPendingStats(){const e=this.token;if(e){for(const t of this.statQueue.entriesFor(e))this.writeStatLocal({playerId:t.playerId,playHoleId:t.playHoleId},t.key,t.value);await this.postStats(e)}}async postStats(e){if(!this.statPosting){this.statPosting=!0;try{for(;;){const t=this.statQueue.entriesFor(e);if(t.length===0)return;const n=await this.sendStatEvents(e,t);if(n==="later")return;if(n==="ok"||t.length===1){this.settleStatEvents(t);continue}for(const i of t){if(await this.sendStatEvents(e,[i])==="later")return;this.settleStatEvents([i])}}}finally{this.statPosting=!1}}}async sendStatEvents(e,t){try{return await w.playerStats.appendEvents({token:e,items:t.map(n=>({playHoleId:n.playHoleId,playerId:n.playerId,key:n.key,value:n.value,clientEventId:n.clientEventId}))}),"ok"}catch(n){return fd(n)?"refused":"later"}}settleStatEvents(e){this.statQueue.ack(e.map(t=>t.clientEventId)),this.confirmStatLocals(e)}metadataFor(e,t,n){const i=this.cells.get().get(Re(e,t));return i&&i.metadata!==void 0?i.metadata?.[n]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[n]}metadataInputs(){const e=Y.get(We),t=this.round.get()?.formatSlots??[],n=[],i=new Set;for(const r of t){const o=e.byId(r.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of o)i.has(d.key)||(i.add(d.key),n.push(d))}return n}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>hd(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,n,i){const r=Re(e,t),o=crypto.randomUUID();this.patchCell(r,{strokes:n,metadata:i,status:"saving",clientEventId:o});const d=this.token;d&&(this.enqueue(d,e,t,n,i,o),await this.post(d,e,t,n,i,o))}async retry(e,t){const n=Re(e,t),i=this.cells.get().get(n);if(!i)return;this.patchCell(n,{...i,status:"saving"});const r=this.token;r&&(this.enqueue(r,e,t,i.strokes,i.metadata,i.clientEventId),await this.post(r,e,t,i.strokes,i.metadata,i.clientEventId))}async flushPending(){const e=this.token;if(!(!e||this.flushing)){this.flushing=!0;try{for(const t of this.queue.entriesFor(e)){if(e!==this.token)return;this.patchCell(Re(t.ballId,t.playHoleId),{strokes:t.strokes,metadata:t.metadata,status:"saving",clientEventId:t.clientEventId}),await this.post(e,t.ballId,t.playHoleId,t.strokes,t.metadata,t.clientEventId)}}finally{this.flushing=!1}}}enqueue(e,t,n,i,r,o){this.queue.enqueue({token:e,ballId:t,playHoleId:n,strokes:i,eventType:i===null?"score_cleared":"score_entered",clientEventId:o,...r!==void 0?{metadata:r}:{},queuedAt:Date.now()})}async post(e,t,n,i,r,o){const d=Re(t,n);try{await w.friendlyRounds.score({token:e,ballId:t,playHoleId:n,strokes:i,eventType:i===null?"score_cleared":"score_entered",clientEventId:o,...r!=null?{metadata:r}:{}}),this.queue.remove(o);const c=this.cells.get().get(d);c&&c.clientEventId===o&&this.patchCell(d,{...c,status:"saved"});const u=this.round.get();e===this.token&&u&&u.status==="not_started"&&this.round.set({...u,status:"active"})}catch{const c=this.cells.get().get(d);c&&c.clientEventId===o&&this.patchCell(d,{...c,status:"error"})}}patchCell(e,t){const n=new Map(this.cells.get());n.set(e,t),this.cells.set(n)}resetForNewToken(e){this.resultSeq++,this.resultCursor=null,this.friendlyRound.set(null),this.round.set(null),this.startList.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(e?.holeIdx??0),this.groupIdx.set(e?.groupIdx??0),this.keypadOpen.set(!1),this.finishFlowOpen.set(!1),this.statModules.set(new Map),this.statRows.set([]),this.statLocal.clear(),this.statConfirmedAt.clear(),this.statStep=null,this.statCell=null,this.bumpStatRev();const t=e?.selectedSlot;this.pendingSlotIndex=null,typeof t=="string"?this.selectedSlot.set(t):typeof t=="number"?(this.pendingSlotIndex=t,this.selectedSlot.set(null)):this.selectedSlot.set(null)}}class gr{roundId=new p(null);view=new p(null);balls=new p([]);loading=new p(!1);error=new p(null);unavailable=new p(null);loaded=!1;setRound(e){this.roundId.get()!==e&&(this.roundId.set(e),this.reset())}async load(e=!1){const t=this.roundId.get();if(t&&!(!e&&(this.loaded||this.loading.get()))){this.loading.set(!0),this.error.set(null);try{const n=await w.spectate.round({roundId:t});if(this.roundId.get()!==t)return;this.view.set(n),this.loaded=!0,this.unavailable.set(null),await this.loadBalls(t)}catch(n){if(this.roundId.get()!==t)return;const i=hr(n);i?(this.unavailable.set(i),this.view.set(null),this.balls.set([]),this.loaded=!1):this.error.set(st(n,"Couldn't load this round."))}finally{this.roundId.get()===t&&this.loading.set(!1)}}}async loadBalls(e){try{const t=await w.rounds.balls({roundId:e});this.roundId.get()===e&&this.balls.set(t)}catch{}}ballNameById=new T(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,rn(t));for(const t of this.view.get()?.result.slots??[])for(const n of t.subjectLabels??[])e.set(n.ballId,n.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}groupLabelByBallId=new T(()=>{const e=new Map,t=this.view.get()?.round.playingGroups??[];return t.length<2||t.forEach((n,i)=>{for(const r of n.ballIds)e.set(r,`Group ${i+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}clear(){this.roundId.set(null),this.reset()}reset(){this.view.set(null),this.balls.set([]),this.loaded=!1,this.loading.set(!1),this.error.set(null),this.unavailable.set(null)}}class br{roles=new p([]);rolesPromise=null;loading=new p(!1);error=new p(null);stats=new p(null);rounds=new p([]);players=new p([]);isSuperAdmin(){return this.roles.get().some(e=>e.role==="super_admin"&&e.scopeType===null)}canManageCourses(){return this.isSuperAdmin()||this.roles.get().some(e=>e.role==="course_admin"&&e.scopeType===null)}loadRoles(e=!1){return!e&&this.rolesPromise?this.rolesPromise:(this.rolesPromise=(async()=>{try{this.roles.set(await w.admin.myRoles())}catch{this.roles.set([])}})(),this.rolesPromise)}clear(){this.roles.set([]),this.rolesPromise=null,this.stats.set(null),this.rounds.set([]),this.players.set([]),this.error.set(null)}async load(e=!1){if(!e&&this.stats.get()!==null)return;const t=await F(this.loading,this.error,()=>Promise.all([w.admin.adminStats(),w.admin.adminRounds({limit:100}),w.admin.adminPlayers()]));if(!t)return;const[n,i,r]=t;this.stats.set(n),this.rounds.set(i),this.players.set(r)}}const md=["last5","last10","last20","thisYear","all","custom"];function zt(s){switch(s){case"last5":return"Last 5 rounds";case"last10":return"Last 10 rounds";case"last20":return"Last 20 rounds";case"thisYear":return"This year";case"all":return"All rounds";case"custom":return"Custom"}}function gd(s){switch(s){case"last5":return"Your five most recent rounds with stats";case"last10":return"Enough rounds for percentages to settle";case"last20":return"A season's worth of form";case"thisYear":return"Every round dated this calendar year";case"all":return"Everything you have ever recorded";case"custom":return"Pick dates, courses and rounds by hand"}}function an(s){switch(s){case"last5":return 5;case"last10":return 10;case"last20":return 20;default:return null}}const at={from:null,to:null,courseIds:[],venueTypes:[],roundTypes:[],excludedRoundIds:[]};function bd(s){return s.from===null&&s.to===null&&s.courseIds.length===0&&s.venueTypes.length===0&&s.roundTypes.length===0&&s.excludedRoundIds.length===0}function yd(s,e){return!(s.from!==null&&e.date<s.from||s.to!==null&&e.date>s.to||s.courseIds.length>0&&!s.courseIds.includes(e.courseId)||s.venueTypes.length>0&&!s.venueTypes.includes(e.venueType)||s.roundTypes.length>0&&!s.roundTypes.includes(e.roundType)||s.excludedRoundIds.includes(e.roundId))}function vs(s,e,t){const n=s[e],i=n.includes(t)?n.filter(r=>r!==t):[...n,t];return{...s,[e]:i}}function _d(s,e,t){const n=s.excludedRoundIds.includes(e);return t===!n?s:{...s,excludedRoundIds:t?s.excludedRoundIds.filter(i=>i!==e):[...s.excludedRoundIds,e]}}function ss(s){return[...s].sort((e,t)=>e.date===t.date?e.roundId>t.roundId?-1:e.roundId<t.roundId?1:0:e.date>t.date?-1:1)}function yr(s){return`${s.getFullYear()}-`}function _r(s,e,t,n){const i=ss(t);switch(s){case"last5":case"last10":case"last20":{const r=an(s);return r===null?i:i.slice(0,r)}case"thisYear":{const r=yr(n);return i.filter(o=>o.date.startsWith(r))}case"all":return i;case"custom":return i.filter(r=>yd(e,r))}}function vr(s){const{preset:e,filter:t,loaded:n,hasMore:i,now:r}=s;if(!i)return!1;switch(e){case"last5":case"last10":case"last20":{const o=an(e);return o===null?!1:n.length<o}case"thisYear":{const o=`${yr(r)}01-01`;return!n.some(d=>d.date<o)}case"all":return!0;case"custom":{if(bd(t))return!1;if(t.from===null)return!0;const o=t.from;return!n.some(d=>d.date<o)}}}const vd="Unnamed course";function wd(s){const e=new Map,t=new Map;for(const n of s)e.set(n.courseId,(e.get(n.courseId)??0)+1),!t.has(n.courseId)&&n.courseName&&t.set(n.courseId,n.courseName);return[...e.keys()].map(n=>({id:n,name:t.get(n)??vd,roundCount:e.get(n)??0})).sort((n,i)=>{const r=n.name.localeCompare(i.name,void 0,{sensitivity:"base"});return r!==0?r:n.id<i.id?-1:n.id>i.id?1:0})}const Lt="last10";function xd(s){return md.includes(s)}const wr=Xe("tapscore.stats.window.v1",{decode:s=>xd(s)?s:Lt,encode:s=>s,empty:Lt});function Gs(s=J()){return wr.read(s)}function jn(s,e=J()){wr.write(s,e)}function x(s,e){return{value:e===0?null:s/e,n:s,d:e}}const kd=5;function $d(s,e=kd){return s.d===0?"absent":s.d>=e?"percentage":"fraction"}const Ft=Object.freeze({teeRecorded:0,fairwayHits:0,inPlayHits:0,troubleCount:0,teeMissRecorded:0,teeMissLeft:0,teeMissRight:0,teeTroubleLeft:0,teeTroubleRight:0,girRecorded:0,girHits:0,greenMissRecorded:0,greenMissLong:0,greenMissShort:0,greenMissLeft:0,greenMissRight:0,firstPuttRecorded:0,firstPuttInside1m:0,firstPutt1To2m:0,firstPutt2To4m:0,firstPutt4To8m:0,firstPuttOver8m:0,firstPuttInside1mResolved:0,firstPutt1To2mResolved:0,firstPutt2To4mResolved:0,firstPutt4To8mResolved:0,firstPuttOver8mResolved:0,onePuttInside1m:0,onePutt1To2m:0,onePutt2To4m:0,onePutt4To8m:0,onePuttOver8m:0,puttsRecorded:0,puttsTotal:0,threePutts:0,threePuttsFromOver8m:0,scrambleAttemptsStandard:0,scrambleSuccessesStandard:0,scrambleAttemptsHard:0,scrambleSuccessesHard:0,scrambleFirstPuttStandard:0,scrambleInside2mStandard:0,scrambleFirstPuttHard:0,scrambleInside2mHard:0,scrambleHoledStandard:0,scrambleHoledHard:0,scrambleAttemptsBunker:0,scrambleSuccessesBunker:0,scrambleFirstPuttBunker:0,scrambleInside2mBunker:0,scrambleHoledBunker:0,shortGameStrokesRecorded:0,shortGameStrokesEffective:0,shortGameStrokesEffectiveStandard:0,shortGameStrokesEffectiveHard:0,shortGameStrokesEffectiveBunker:0,holesMultiChip:0,holesMultiChipBunker:0,scrambleSingleChipStandard:0,scrambleChipInStandard:0,scrambleChipOnePuttStandard:0,scrambleChipTwoPuttStandard:0,scrambleChipThreePuttStandard:0,scrambleSingleChipHard:0,scrambleChipInHard:0,scrambleChipOnePuttHard:0,scrambleChipTwoPuttHard:0,scrambleChipThreePuttHard:0,scrambleSingleChipBunker:0,scrambleChipInBunker:0,scrambleChipOnePuttBunker:0,scrambleChipTwoPuttBunker:0,scrambleChipThreePuttBunker:0,holesMultiChipStandard:0,holesMultiChipHard:0,scrambleInside2mResolvedStandard:0,scrambleInside2mSavedStandard:0,scrambleInside2mResolvedHard:0,scrambleInside2mSavedHard:0,scrambleInside2mResolvedBunker:0,scrambleInside2mSavedBunker:0,holesScoredMissStandard:0,strokesVsParMissStandard:0,holesScoredMissHard:0,strokesVsParMissHard:0,holesScoredMissBunker:0,strokesVsParMissBunker:0,penaltiesRecorded:0,penaltiesTotal:0,recoveryAttempts:0,recoverySuccesses:0,penaltySourceRecorded:0,penaltiesTee:0,penaltiesApproach:0,penaltiesShort:0,holesScored:0,strokesTotal:0,parTotal:0,holesScoredPar3:0,strokesPar3:0,holesScoredPar4:0,strokesPar4:0,holesScoredPar5:0,strokesPar5:0,holesEagleOrBetter:0,holesBirdie:0,holesPar:0,holesBogey:0,doubleBogeyPlus:0,girHolesScored:0,birdiesOnGir:0,bounceBackOpportunities:0,bounceBackSuccesses:0,holesScoredFairway:0,strokesVsParFairway:0,holesScoredInPlay:0,strokesVsParInPlay:0,holesScoredTrouble:0,strokesVsParTrouble:0,girRecordedFairway:0,girHitsFairway:0,girRecordedInPlay:0,girHitsInPlay:0,girRecordedTrouble:0,girHitsTrouble:0,girFirstPuttRecorded:0,girFirstPuttInside1m:0,girFirstPutt1To2m:0,girFirstPutt2To4m:0,girFirstPutt4To8m:0,girFirstPuttOver8m:0,puttsRecordedGir:0,puttsTotalGir:0,puttsTotalInside1mResolved:0,puttsTotal1To2mResolved:0,puttsTotal2To4mResolved:0,puttsTotal4To8mResolved:0,puttsTotalOver8mResolved:0,strokesVsParGirHit:0,holesScoredGirMiss:0,strokesVsParGirMiss:0,girRecordedPar3:0,girHitsPar3:0,girRecordedPar4:0,girHitsPar4:0,girRecordedPar5:0,girHitsPar5:0,holesZeroPutt:0,holesOnePutt:0,holesTwoPutt:0,puttsRecordedPar3:0,puttsTotalPar3:0,puttsRecordedPar4:0,puttsTotalPar4:0,puttsRecordedPar5:0,puttsTotalPar5:0,holesWithPenalty:0,holesScoredPenalty:0,strokesVsParPenalty:0,holesScoredPenaltyFree:0,strokesVsParPenaltyFree:0,teeRecordedPar4:0,fairwayHitsPar4:0,inPlayHitsPar4:0,troubleCountPar4:0,teeRecordedPar5:0,fairwayHitsPar5:0,inPlayHitsPar5:0,troubleCountPar5:0,attHolesPar3Gir:0,attHolesPar3Miss:0,attHolesPar45Gir:0,attHolesPar45Miss:0,attStrokes:0,attPutts:0,attPenalties:0,attFairwayPar4:0,attInPlayPar4:0,attTroublePar4:0,attFairwayPar5:0,attInPlayPar5:0,attTroublePar5:0,attGirFirstPuttInside1m:0,attGirFirstPutt1To2m:0,attGirFirstPutt2To4m:0,attGirFirstPutt4To8m:0,attGirFirstPuttOver8m:0,attGirHoled:0,attMissStandard:0,attMissHard:0,attChipInside2mStandard:0,attChipOutside2mStandard:0,attChipHoledStandard:0,attChipInside2mHard:0,attChipOutside2mHard:0,attChipHoledHard:0,attMissBunker:0,attChipInside2mBunker:0,attChipOutside2mBunker:0,attChipHoledBunker:0,attSgStrokesEffectiveStandard:0,attSgStrokesEffectiveHard:0,attSgStrokesEffectiveBunker:0,dblPenalty:0,dblFailedRecovery:0,dblMultiChip:0,dblThreePutt:0,dblTroubleTee:0,dblFullSwing:0,dblUnattributed:0,dblPenaltyTee:0,dblPenaltyApproach:0,dblPenaltyShort:0,dblPenaltyUnknown:0});function Sd(s,e){return{teeRecorded:s.teeRecorded+e.teeRecorded,fairwayHits:s.fairwayHits+e.fairwayHits,inPlayHits:s.inPlayHits+e.inPlayHits,troubleCount:s.troubleCount+e.troubleCount,teeMissRecorded:s.teeMissRecorded+e.teeMissRecorded,teeMissLeft:s.teeMissLeft+e.teeMissLeft,teeMissRight:s.teeMissRight+e.teeMissRight,teeTroubleLeft:s.teeTroubleLeft+e.teeTroubleLeft,teeTroubleRight:s.teeTroubleRight+e.teeTroubleRight,girRecorded:s.girRecorded+e.girRecorded,girHits:s.girHits+e.girHits,greenMissRecorded:s.greenMissRecorded+e.greenMissRecorded,greenMissLong:s.greenMissLong+e.greenMissLong,greenMissShort:s.greenMissShort+e.greenMissShort,greenMissLeft:s.greenMissLeft+e.greenMissLeft,greenMissRight:s.greenMissRight+e.greenMissRight,firstPuttRecorded:s.firstPuttRecorded+e.firstPuttRecorded,firstPuttInside1m:s.firstPuttInside1m+e.firstPuttInside1m,firstPutt1To2m:s.firstPutt1To2m+e.firstPutt1To2m,firstPutt2To4m:s.firstPutt2To4m+e.firstPutt2To4m,firstPutt4To8m:s.firstPutt4To8m+e.firstPutt4To8m,firstPuttOver8m:s.firstPuttOver8m+e.firstPuttOver8m,firstPuttInside1mResolved:s.firstPuttInside1mResolved+e.firstPuttInside1mResolved,firstPutt1To2mResolved:s.firstPutt1To2mResolved+e.firstPutt1To2mResolved,firstPutt2To4mResolved:s.firstPutt2To4mResolved+e.firstPutt2To4mResolved,firstPutt4To8mResolved:s.firstPutt4To8mResolved+e.firstPutt4To8mResolved,firstPuttOver8mResolved:s.firstPuttOver8mResolved+e.firstPuttOver8mResolved,onePuttInside1m:s.onePuttInside1m+e.onePuttInside1m,onePutt1To2m:s.onePutt1To2m+e.onePutt1To2m,onePutt2To4m:s.onePutt2To4m+e.onePutt2To4m,onePutt4To8m:s.onePutt4To8m+e.onePutt4To8m,onePuttOver8m:s.onePuttOver8m+e.onePuttOver8m,puttsRecorded:s.puttsRecorded+e.puttsRecorded,puttsTotal:s.puttsTotal+e.puttsTotal,threePutts:s.threePutts+e.threePutts,threePuttsFromOver8m:s.threePuttsFromOver8m+e.threePuttsFromOver8m,scrambleAttemptsStandard:s.scrambleAttemptsStandard+e.scrambleAttemptsStandard,scrambleSuccessesStandard:s.scrambleSuccessesStandard+e.scrambleSuccessesStandard,scrambleAttemptsHard:s.scrambleAttemptsHard+e.scrambleAttemptsHard,scrambleSuccessesHard:s.scrambleSuccessesHard+e.scrambleSuccessesHard,scrambleFirstPuttStandard:s.scrambleFirstPuttStandard+e.scrambleFirstPuttStandard,scrambleInside2mStandard:s.scrambleInside2mStandard+e.scrambleInside2mStandard,scrambleFirstPuttHard:s.scrambleFirstPuttHard+e.scrambleFirstPuttHard,scrambleInside2mHard:s.scrambleInside2mHard+e.scrambleInside2mHard,scrambleHoledStandard:s.scrambleHoledStandard+e.scrambleHoledStandard,scrambleHoledHard:s.scrambleHoledHard+e.scrambleHoledHard,scrambleAttemptsBunker:s.scrambleAttemptsBunker+e.scrambleAttemptsBunker,scrambleSuccessesBunker:s.scrambleSuccessesBunker+e.scrambleSuccessesBunker,scrambleFirstPuttBunker:s.scrambleFirstPuttBunker+e.scrambleFirstPuttBunker,scrambleInside2mBunker:s.scrambleInside2mBunker+e.scrambleInside2mBunker,scrambleHoledBunker:s.scrambleHoledBunker+e.scrambleHoledBunker,shortGameStrokesRecorded:s.shortGameStrokesRecorded+e.shortGameStrokesRecorded,shortGameStrokesEffective:s.shortGameStrokesEffective+e.shortGameStrokesEffective,shortGameStrokesEffectiveStandard:s.shortGameStrokesEffectiveStandard+e.shortGameStrokesEffectiveStandard,shortGameStrokesEffectiveHard:s.shortGameStrokesEffectiveHard+e.shortGameStrokesEffectiveHard,shortGameStrokesEffectiveBunker:s.shortGameStrokesEffectiveBunker+e.shortGameStrokesEffectiveBunker,holesMultiChip:s.holesMultiChip+e.holesMultiChip,holesMultiChipBunker:s.holesMultiChipBunker+e.holesMultiChipBunker,scrambleSingleChipStandard:s.scrambleSingleChipStandard+e.scrambleSingleChipStandard,scrambleChipInStandard:s.scrambleChipInStandard+e.scrambleChipInStandard,scrambleChipOnePuttStandard:s.scrambleChipOnePuttStandard+e.scrambleChipOnePuttStandard,scrambleChipTwoPuttStandard:s.scrambleChipTwoPuttStandard+e.scrambleChipTwoPuttStandard,scrambleChipThreePuttStandard:s.scrambleChipThreePuttStandard+e.scrambleChipThreePuttStandard,scrambleSingleChipHard:s.scrambleSingleChipHard+e.scrambleSingleChipHard,scrambleChipInHard:s.scrambleChipInHard+e.scrambleChipInHard,scrambleChipOnePuttHard:s.scrambleChipOnePuttHard+e.scrambleChipOnePuttHard,scrambleChipTwoPuttHard:s.scrambleChipTwoPuttHard+e.scrambleChipTwoPuttHard,scrambleChipThreePuttHard:s.scrambleChipThreePuttHard+e.scrambleChipThreePuttHard,scrambleSingleChipBunker:s.scrambleSingleChipBunker+e.scrambleSingleChipBunker,scrambleChipInBunker:s.scrambleChipInBunker+e.scrambleChipInBunker,scrambleChipOnePuttBunker:s.scrambleChipOnePuttBunker+e.scrambleChipOnePuttBunker,scrambleChipTwoPuttBunker:s.scrambleChipTwoPuttBunker+e.scrambleChipTwoPuttBunker,scrambleChipThreePuttBunker:s.scrambleChipThreePuttBunker+e.scrambleChipThreePuttBunker,holesMultiChipStandard:s.holesMultiChipStandard+e.holesMultiChipStandard,holesMultiChipHard:s.holesMultiChipHard+e.holesMultiChipHard,scrambleInside2mResolvedStandard:s.scrambleInside2mResolvedStandard+e.scrambleInside2mResolvedStandard,scrambleInside2mSavedStandard:s.scrambleInside2mSavedStandard+e.scrambleInside2mSavedStandard,scrambleInside2mResolvedHard:s.scrambleInside2mResolvedHard+e.scrambleInside2mResolvedHard,scrambleInside2mSavedHard:s.scrambleInside2mSavedHard+e.scrambleInside2mSavedHard,scrambleInside2mResolvedBunker:s.scrambleInside2mResolvedBunker+e.scrambleInside2mResolvedBunker,scrambleInside2mSavedBunker:s.scrambleInside2mSavedBunker+e.scrambleInside2mSavedBunker,holesScoredMissStandard:s.holesScoredMissStandard+e.holesScoredMissStandard,strokesVsParMissStandard:s.strokesVsParMissStandard+e.strokesVsParMissStandard,holesScoredMissHard:s.holesScoredMissHard+e.holesScoredMissHard,strokesVsParMissHard:s.strokesVsParMissHard+e.strokesVsParMissHard,holesScoredMissBunker:s.holesScoredMissBunker+e.holesScoredMissBunker,strokesVsParMissBunker:s.strokesVsParMissBunker+e.strokesVsParMissBunker,penaltiesRecorded:s.penaltiesRecorded+e.penaltiesRecorded,penaltiesTotal:s.penaltiesTotal+e.penaltiesTotal,recoveryAttempts:s.recoveryAttempts+e.recoveryAttempts,recoverySuccesses:s.recoverySuccesses+e.recoverySuccesses,penaltySourceRecorded:s.penaltySourceRecorded+e.penaltySourceRecorded,penaltiesTee:s.penaltiesTee+e.penaltiesTee,penaltiesApproach:s.penaltiesApproach+e.penaltiesApproach,penaltiesShort:s.penaltiesShort+e.penaltiesShort,holesScored:s.holesScored+e.holesScored,strokesTotal:s.strokesTotal+e.strokesTotal,parTotal:s.parTotal+e.parTotal,holesScoredPar3:s.holesScoredPar3+e.holesScoredPar3,strokesPar3:s.strokesPar3+e.strokesPar3,holesScoredPar4:s.holesScoredPar4+e.holesScoredPar4,strokesPar4:s.strokesPar4+e.strokesPar4,holesScoredPar5:s.holesScoredPar5+e.holesScoredPar5,strokesPar5:s.strokesPar5+e.strokesPar5,holesEagleOrBetter:s.holesEagleOrBetter+e.holesEagleOrBetter,holesBirdie:s.holesBirdie+e.holesBirdie,holesPar:s.holesPar+e.holesPar,holesBogey:s.holesBogey+e.holesBogey,doubleBogeyPlus:s.doubleBogeyPlus+e.doubleBogeyPlus,girHolesScored:s.girHolesScored+e.girHolesScored,birdiesOnGir:s.birdiesOnGir+e.birdiesOnGir,bounceBackOpportunities:s.bounceBackOpportunities+e.bounceBackOpportunities,bounceBackSuccesses:s.bounceBackSuccesses+e.bounceBackSuccesses,holesScoredFairway:s.holesScoredFairway+e.holesScoredFairway,strokesVsParFairway:s.strokesVsParFairway+e.strokesVsParFairway,holesScoredInPlay:s.holesScoredInPlay+e.holesScoredInPlay,strokesVsParInPlay:s.strokesVsParInPlay+e.strokesVsParInPlay,holesScoredTrouble:s.holesScoredTrouble+e.holesScoredTrouble,strokesVsParTrouble:s.strokesVsParTrouble+e.strokesVsParTrouble,girRecordedFairway:s.girRecordedFairway+e.girRecordedFairway,girHitsFairway:s.girHitsFairway+e.girHitsFairway,girRecordedInPlay:s.girRecordedInPlay+e.girRecordedInPlay,girHitsInPlay:s.girHitsInPlay+e.girHitsInPlay,girRecordedTrouble:s.girRecordedTrouble+e.girRecordedTrouble,girHitsTrouble:s.girHitsTrouble+e.girHitsTrouble,girFirstPuttRecorded:s.girFirstPuttRecorded+e.girFirstPuttRecorded,girFirstPuttInside1m:s.girFirstPuttInside1m+e.girFirstPuttInside1m,girFirstPutt1To2m:s.girFirstPutt1To2m+e.girFirstPutt1To2m,girFirstPutt2To4m:s.girFirstPutt2To4m+e.girFirstPutt2To4m,girFirstPutt4To8m:s.girFirstPutt4To8m+e.girFirstPutt4To8m,girFirstPuttOver8m:s.girFirstPuttOver8m+e.girFirstPuttOver8m,puttsRecordedGir:s.puttsRecordedGir+e.puttsRecordedGir,puttsTotalGir:s.puttsTotalGir+e.puttsTotalGir,puttsTotalInside1mResolved:s.puttsTotalInside1mResolved+e.puttsTotalInside1mResolved,puttsTotal1To2mResolved:s.puttsTotal1To2mResolved+e.puttsTotal1To2mResolved,puttsTotal2To4mResolved:s.puttsTotal2To4mResolved+e.puttsTotal2To4mResolved,puttsTotal4To8mResolved:s.puttsTotal4To8mResolved+e.puttsTotal4To8mResolved,puttsTotalOver8mResolved:s.puttsTotalOver8mResolved+e.puttsTotalOver8mResolved,strokesVsParGirHit:s.strokesVsParGirHit+e.strokesVsParGirHit,holesScoredGirMiss:s.holesScoredGirMiss+e.holesScoredGirMiss,strokesVsParGirMiss:s.strokesVsParGirMiss+e.strokesVsParGirMiss,girRecordedPar3:s.girRecordedPar3+e.girRecordedPar3,girHitsPar3:s.girHitsPar3+e.girHitsPar3,girRecordedPar4:s.girRecordedPar4+e.girRecordedPar4,girHitsPar4:s.girHitsPar4+e.girHitsPar4,girRecordedPar5:s.girRecordedPar5+e.girRecordedPar5,girHitsPar5:s.girHitsPar5+e.girHitsPar5,holesZeroPutt:s.holesZeroPutt+e.holesZeroPutt,holesOnePutt:s.holesOnePutt+e.holesOnePutt,holesTwoPutt:s.holesTwoPutt+e.holesTwoPutt,puttsRecordedPar3:s.puttsRecordedPar3+e.puttsRecordedPar3,puttsTotalPar3:s.puttsTotalPar3+e.puttsTotalPar3,puttsRecordedPar4:s.puttsRecordedPar4+e.puttsRecordedPar4,puttsTotalPar4:s.puttsTotalPar4+e.puttsTotalPar4,puttsRecordedPar5:s.puttsRecordedPar5+e.puttsRecordedPar5,puttsTotalPar5:s.puttsTotalPar5+e.puttsTotalPar5,holesWithPenalty:s.holesWithPenalty+e.holesWithPenalty,holesScoredPenalty:s.holesScoredPenalty+e.holesScoredPenalty,strokesVsParPenalty:s.strokesVsParPenalty+e.strokesVsParPenalty,holesScoredPenaltyFree:s.holesScoredPenaltyFree+e.holesScoredPenaltyFree,strokesVsParPenaltyFree:s.strokesVsParPenaltyFree+e.strokesVsParPenaltyFree,teeRecordedPar4:s.teeRecordedPar4+e.teeRecordedPar4,fairwayHitsPar4:s.fairwayHitsPar4+e.fairwayHitsPar4,inPlayHitsPar4:s.inPlayHitsPar4+e.inPlayHitsPar4,troubleCountPar4:s.troubleCountPar4+e.troubleCountPar4,teeRecordedPar5:s.teeRecordedPar5+e.teeRecordedPar5,fairwayHitsPar5:s.fairwayHitsPar5+e.fairwayHitsPar5,inPlayHitsPar5:s.inPlayHitsPar5+e.inPlayHitsPar5,troubleCountPar5:s.troubleCountPar5+e.troubleCountPar5,attHolesPar3Gir:s.attHolesPar3Gir+e.attHolesPar3Gir,attHolesPar3Miss:s.attHolesPar3Miss+e.attHolesPar3Miss,attHolesPar45Gir:s.attHolesPar45Gir+e.attHolesPar45Gir,attHolesPar45Miss:s.attHolesPar45Miss+e.attHolesPar45Miss,attStrokes:s.attStrokes+e.attStrokes,attPutts:s.attPutts+e.attPutts,attPenalties:s.attPenalties+e.attPenalties,attFairwayPar4:s.attFairwayPar4+e.attFairwayPar4,attInPlayPar4:s.attInPlayPar4+e.attInPlayPar4,attTroublePar4:s.attTroublePar4+e.attTroublePar4,attFairwayPar5:s.attFairwayPar5+e.attFairwayPar5,attInPlayPar5:s.attInPlayPar5+e.attInPlayPar5,attTroublePar5:s.attTroublePar5+e.attTroublePar5,attGirFirstPuttInside1m:s.attGirFirstPuttInside1m+e.attGirFirstPuttInside1m,attGirFirstPutt1To2m:s.attGirFirstPutt1To2m+e.attGirFirstPutt1To2m,attGirFirstPutt2To4m:s.attGirFirstPutt2To4m+e.attGirFirstPutt2To4m,attGirFirstPutt4To8m:s.attGirFirstPutt4To8m+e.attGirFirstPutt4To8m,attGirFirstPuttOver8m:s.attGirFirstPuttOver8m+e.attGirFirstPuttOver8m,attGirHoled:s.attGirHoled+e.attGirHoled,attMissStandard:s.attMissStandard+e.attMissStandard,attMissHard:s.attMissHard+e.attMissHard,attChipInside2mStandard:s.attChipInside2mStandard+e.attChipInside2mStandard,attChipOutside2mStandard:s.attChipOutside2mStandard+e.attChipOutside2mStandard,attChipHoledStandard:s.attChipHoledStandard+e.attChipHoledStandard,attChipInside2mHard:s.attChipInside2mHard+e.attChipInside2mHard,attChipOutside2mHard:s.attChipOutside2mHard+e.attChipOutside2mHard,attChipHoledHard:s.attChipHoledHard+e.attChipHoledHard,attMissBunker:s.attMissBunker+e.attMissBunker,attChipInside2mBunker:s.attChipInside2mBunker+e.attChipInside2mBunker,attChipOutside2mBunker:s.attChipOutside2mBunker+e.attChipOutside2mBunker,attChipHoledBunker:s.attChipHoledBunker+e.attChipHoledBunker,attSgStrokesEffectiveStandard:s.attSgStrokesEffectiveStandard+e.attSgStrokesEffectiveStandard,attSgStrokesEffectiveHard:s.attSgStrokesEffectiveHard+e.attSgStrokesEffectiveHard,attSgStrokesEffectiveBunker:s.attSgStrokesEffectiveBunker+e.attSgStrokesEffectiveBunker,dblPenalty:s.dblPenalty+e.dblPenalty,dblFailedRecovery:s.dblFailedRecovery+e.dblFailedRecovery,dblMultiChip:s.dblMultiChip+e.dblMultiChip,dblThreePutt:s.dblThreePutt+e.dblThreePutt,dblTroubleTee:s.dblTroubleTee+e.dblTroubleTee,dblFullSwing:s.dblFullSwing+e.dblFullSwing,dblUnattributed:s.dblUnattributed+e.dblUnattributed,dblPenaltyTee:s.dblPenaltyTee+e.dblPenaltyTee,dblPenaltyApproach:s.dblPenaltyApproach+e.dblPenaltyApproach,dblPenaltyShort:s.dblPenaltyShort+e.dblPenaltyShort,dblPenaltyUnknown:s.dblPenaltyUnknown+e.dblPenaltyUnknown}}function Dn(s){let e=Ft;for(const t of s)e=Sd(e,t);return e}function Td(s){return s.teeRecorded>0||s.girRecorded>0||s.puttsRecorded>0||s.firstPuttRecorded>0||s.penaltiesRecorded>0||s.greenMissRecorded>0||s.shortGameStrokesRecorded>0}const ze=["inside_1m","1_to_2m","2_to_4m","4_to_8m","over_8m"];function ns(s,e){switch(e){case"inside_1m":return s.firstPuttInside1mResolved;case"1_to_2m":return s.firstPutt1To2mResolved;case"2_to_4m":return s.firstPutt2To4mResolved;case"4_to_8m":return s.firstPutt4To8mResolved;case"over_8m":return s.firstPuttOver8mResolved}}function Pd(s,e){switch(e){case"inside_1m":return s.puttsTotalInside1mResolved;case"1_to_2m":return s.puttsTotal1To2mResolved;case"2_to_4m":return s.puttsTotal2To4mResolved;case"4_to_8m":return s.puttsTotal4To8mResolved;case"over_8m":return s.puttsTotalOver8mResolved}}function Cd(s,e){switch(e){case"inside_1m":return s.onePuttInside1m;case"1_to_2m":return s.onePutt1To2m;case"2_to_4m":return s.onePutt2To4m;case"4_to_8m":return s.onePutt4To8m;case"over_8m":return s.onePuttOver8m}}function Id(s,e){switch(e){case"inside_1m":return s.girFirstPuttInside1m;case"1_to_2m":return s.girFirstPutt1To2m;case"2_to_4m":return s.girFirstPutt2To4m;case"4_to_8m":return s.girFirstPutt4To8m;case"over_8m":return s.girFirstPuttOver8m}}function xr(s){return x(s.fairwayHits,s.teeRecorded)}function Ed(s){return x(s.troubleCount,s.teeRecorded)}function Rd(s){return x(s.holesScoredPenalty,s.holesScored)}function Nd(s){return{penalty:x(s.strokesVsParPenalty,s.holesScoredPenalty),clean:x(s.strokesVsParPenaltyFree,s.holesScoredPenaltyFree)}}function Od(s){const e=s.strokesVsParPenalty*s.holesScoredPenaltyFree-s.strokesVsParPenaltyFree*s.holesScoredPenalty;return x(e,s.holesScoredPenalty*s.holesScoredPenaltyFree)}function Hd(s){return x(s.recoverySuccesses,s.recoveryAttempts)}function Md(s,e){return x(s.penaltiesTotal,e)}function Ad(s){return{fairway:x(s.strokesVsParFairway,s.holesScoredFairway),inPlay:x(s.strokesVsParInPlay,s.holesScoredInPlay),trouble:x(s.strokesVsParTrouble,s.holesScoredTrouble)}}function Bd(s){const e=s.strokesVsParTrouble*s.holesScoredFairway-s.strokesVsParFairway*s.holesScoredTrouble;return x(e,s.holesScoredTrouble*s.holesScoredFairway)}function kr(s){return x(s.girHits,s.girRecorded)}function zd(s){return{fairway:x(s.girHitsFairway,s.girRecordedFairway),inPlay:x(s.girHitsInPlay,s.girRecordedInPlay),trouble:x(s.girHitsTrouble,s.girRecordedTrouble)}}function Ld(s){return{par3:x(s.girHitsPar3,s.girRecordedPar3),par4:x(s.girHitsPar4,s.girRecordedPar4),par5:x(s.girHitsPar5,s.girRecordedPar5)}}function Fd(s){const e=x(s.strokesVsParGirHit,s.girHolesScored),t=x(s.strokesVsParGirMiss,s.holesScoredGirMiss),n=s.strokesVsParGirMiss*s.girHolesScored-s.strokesVsParGirHit*s.holesScoredGirMiss;return{hit:e,miss:t,delta:x(n,s.holesScoredGirMiss*s.girHolesScored)}}function Gd(s,e){return x(Id(s,e),s.girFirstPuttRecorded)}function jd(s){let e=0;for(const t of ze)e+=ns(s,t);return e}function Dd(s,e){return x(ns(s,e),jd(s))}function qd(s){return x(s.birdiesOnGir,s.girHolesScored)}function Vd(s){return x(s.scrambleAttemptsHard,s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker)}function Ud(s){const e=s.greenMissRecorded;return{long:x(s.greenMissLong,e),short:x(s.greenMissShort,e),left:x(s.greenMissLeft,e),right:x(s.greenMissRight,e)}}function Kd(s){return{left:x(s.teeMissLeft,s.teeMissRecorded),right:x(s.teeMissRight,s.teeMissRecorded),troubleLeft:x(s.teeTroubleLeft,s.teeMissLeft),troubleRight:x(s.teeTroubleRight,s.teeMissRight)}}function Wd(s){const e=s.penaltySourceRecorded;return{tee:x(s.penaltiesTee,e),approach:x(s.penaltiesApproach,e),short:x(s.penaltiesShort,e)}}function Yd(s,e){return x(Cd(s,e),ns(s,e))}function Xd(s){return x(s.threePutts,s.puttsRecorded)}function Qd(s){const e=s.puttsRecorded;return{zero:x(s.holesZeroPutt,e),one:x(s.holesOnePutt,e),two:x(s.holesTwoPutt,e),threePlus:x(s.threePutts,e)}}function Jd(s){return{par3:x(s.puttsTotalPar3,s.puttsRecordedPar3),par4:x(s.puttsTotalPar4,s.puttsRecordedPar4),par5:x(s.puttsTotalPar5,s.puttsRecordedPar5)}}function Zd(s){return x(s.threePuttsFromOver8m,s.firstPuttOver8mResolved)}function ec(s){return x(s.puttsTotalGir,s.puttsRecordedGir)}function tc(s){const e=Math.max(0,s.puttsTotal-s.puttsTotalGir),t=Math.max(0,s.puttsRecorded-s.puttsRecordedGir);return x(e,t)}function $r(s){return{standard:x(s.scrambleSuccessesStandard,s.scrambleAttemptsStandard),hard:x(s.scrambleSuccessesHard,s.scrambleAttemptsHard),bunker:x(s.scrambleSuccessesBunker,s.scrambleAttemptsBunker),overall:x(s.scrambleSuccessesStandard+s.scrambleSuccessesHard+s.scrambleSuccessesBunker,s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker)}}function sc(s){return x(s.scrambleSuccessesBunker,s.scrambleAttemptsBunker)}function nc(s){return s.shortGameStrokesEffective-(s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker)}function ic(s){return{standard:x(s.scrambleInside2mStandard,s.scrambleFirstPuttStandard),hard:x(s.scrambleInside2mHard,s.scrambleFirstPuttHard),bunker:x(s.scrambleInside2mBunker,s.scrambleFirstPuttBunker),overall:x(s.scrambleInside2mStandard+s.scrambleInside2mHard+s.scrambleInside2mBunker,s.scrambleFirstPuttStandard+s.scrambleFirstPuttHard+s.scrambleFirstPuttBunker)}}function rc(s){const e=(t,n,i,r,o,d)=>({chipIn:x(t,d),onePutt:x(n,d),twoPutt:x(i,d),threePlus:x(r,d),multiChip:x(o,d)});return{standard:e(s.scrambleChipInStandard,s.scrambleChipOnePuttStandard,s.scrambleChipTwoPuttStandard,s.scrambleChipThreePuttStandard,s.holesMultiChipStandard,s.scrambleAttemptsStandard),hard:e(s.scrambleChipInHard,s.scrambleChipOnePuttHard,s.scrambleChipTwoPuttHard,s.scrambleChipThreePuttHard,s.holesMultiChipHard,s.scrambleAttemptsHard),bunker:e(s.scrambleChipInBunker,s.scrambleChipOnePuttBunker,s.scrambleChipTwoPuttBunker,s.scrambleChipThreePuttBunker,s.holesMultiChipBunker,s.scrambleAttemptsBunker),overall:e(s.scrambleChipInStandard+s.scrambleChipInHard+s.scrambleChipInBunker,s.scrambleChipOnePuttStandard+s.scrambleChipOnePuttHard+s.scrambleChipOnePuttBunker,s.scrambleChipTwoPuttStandard+s.scrambleChipTwoPuttHard+s.scrambleChipTwoPuttBunker,s.scrambleChipThreePuttStandard+s.scrambleChipThreePuttHard+s.scrambleChipThreePuttBunker,s.holesMultiChip,s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker)}}function ac(s){return{standard:x(s.scrambleInside2mSavedStandard,s.scrambleInside2mResolvedStandard),hard:x(s.scrambleInside2mSavedHard,s.scrambleInside2mResolvedHard),bunker:x(s.scrambleInside2mSavedBunker,s.scrambleInside2mResolvedBunker),overall:x(s.scrambleInside2mSavedStandard+s.scrambleInside2mSavedHard+s.scrambleInside2mSavedBunker,s.scrambleInside2mResolvedStandard+s.scrambleInside2mResolvedHard+s.scrambleInside2mResolvedBunker)}}function oc(s){return{standard:x(s.strokesVsParMissStandard,s.holesScoredMissStandard),hard:x(s.strokesVsParMissHard,s.holesScoredMissHard),bunker:x(s.strokesVsParMissBunker,s.holesScoredMissBunker),overall:x(s.strokesVsParMissStandard+s.strokesVsParMissHard+s.strokesVsParMissBunker,s.holesScoredMissStandard+s.holesScoredMissHard+s.holesScoredMissBunker)}}function lc(s){const e=s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker;return{standard:x(s.scrambleAttemptsStandard,e),hard:x(s.scrambleAttemptsHard,e),bunker:x(s.scrambleAttemptsBunker,e),overall:x(e,e)}}function dc(s){return{par3:x(s.strokesPar3-3*s.holesScoredPar3,s.holesScoredPar3),par4:x(s.strokesPar4-4*s.holesScoredPar4,s.holesScoredPar4),par5:x(s.strokesPar5-5*s.holesScoredPar5,s.holesScoredPar5)}}function cc(s,e){return x(s.doubleBogeyPlus,e)}function uc(s){return x(s.bounceBackSuccesses,s.bounceBackOpportunities)}function hc(s){const e=s.doubleBogeyPlus,t=(n,i)=>({id:n,share:x(i,e)});return[{id:"offTee",share:x(s.dblTroubleTee+s.dblFailedRecovery+s.dblPenaltyTee,e),subs:[t("troubleTee",s.dblTroubleTee),t("failedRecovery",s.dblFailedRecovery),t("penaltyTee",s.dblPenaltyTee)]},{id:"longGame",share:x(s.dblFullSwing+s.dblPenaltyApproach,e),subs:[t("fullSwing",s.dblFullSwing),t("penaltyApproach",s.dblPenaltyApproach)]},{id:"shortGame",share:x(s.dblMultiChip+s.dblPenaltyShort,e),subs:[t("multiChip",s.dblMultiChip),t("penaltyShort",s.dblPenaltyShort)]},{id:"threePutt",share:x(s.dblThreePutt,e),subs:[]},{id:"unattributed",share:x(s.dblUnattributed+s.dblPenaltyUnknown,e),subs:[]}]}function pc(s){const e=s.score===null||s.score===0?null:s.score;if(e===null||e<s.par+2)return null;const t=s.stats,n=!(t.putts===0&&t.firstPutt!==null);return(t.penalties??0)>=1?"penalty":t.recoveryOk===!1?"failedRecovery":t.gir===!1&&(t.shortGameStrokes??1)>1?"multiChip":n&&t.putts!==null&&t.putts>=3?"threePutt":t.teeResult==="trouble"?"troubleTee":t.gir!==null&&n&&t.putts!==null&&(s.par<=3||t.teeResult!==null)&&(t.gir===!0||t.shortGameDifficulty!==null)?"fullSwing":"unattributed"}const fc=["eagleOrBetter","birdie","par","bogey","doubleBogeyPlus"],mc=18;function gc(s){let e=0,t=0,n=0;const i={eagleOrBetter:0,birdie:0,par:0,bogey:0,doubleBogeyPlus:0},r=new Map;for(const c of s){const u=c.measures;t+=u.holesScored,i.eagleOrBetter+=u.holesEagleOrBetter,i.birdie+=u.holesBirdie,i.par+=u.holesPar,i.bogey+=u.holesBogey,i.doubleBogeyPlus+=u.doubleBogeyPlus,u.holesScored>0&&(e+=1,n+=u.strokesTotal-u.parTotal);let h=r.get(c.holeCount);if(h||(h={holeCount:c.holeCount,rounds:0,completeRounds:0,best:null},r.set(c.holeCount,h)),h.rounds+=1,!(c.holeCount>0&&u.holesScored===c.holeCount))continue;h.completeRounds+=1;const m=u.strokesTotal-u.parTotal;(h.best===null||m<h.best.vsPar)&&(h.best={vsPar:m,strokes:u.strokesTotal})}const o=[...r.values()].sort((c,u)=>u.holeCount-c.holeCount);let d=0;for(const c of o)d+=c.rounds*c.holeCount;return{rounds:s.length,scoredRounds:e,holesScored:t,holesExpected:d,lengths:o,avgVsParPer18:x(n*mc,t),scoreTypeCounts:i}}const Sr=Object.freeze({inside_1m:1.05,"1_to_2m":1.45,"2_to_4m":1.85,"4_to_8m":2.1,over_8m:2.4}),Tr=Object.freeze({inside2m:1.25,outside2m:2.12}),Pr=Object.freeze({standard:1.7,hard:2.1,bunker:1.95}),Cr=Object.freeze({version:"v1-provisional",calibratedAt:null,eHole:Object.freeze({3:3.6,4:4.7,5:5.5}),eAfterTee:Object.freeze({4:Object.freeze({fairway:3.45,in_play:3.8,trouble:4.35}),5:Object.freeze({fairway:4.25,in_play:4.6,trouble:5.15})}),rowCounts:Object.freeze({eHole:Object.freeze({3:0,4:0,5:0}),eAfterTee:Object.freeze({4:Object.freeze({fairway:0,in_play:0,trouble:0}),5:Object.freeze({fairway:0,in_play:0,trouble:0})})})}),bc=["scratch","hcp5","hcp12","hcp20"];function on(s){return s===null?"hcp12":s<2.5?"scratch":s<8.5?"hcp5":s<16?"hcp12":"hcp20"}function yc(s){return Math.round(4*s.eHole[3]+10*s.eHole[4]+4*s.eHole[5])}const _c=Object.freeze({version:"v1-provisional-scratch",calibratedAt:null,eHole:Object.freeze({3:3.25,4:4.15,5:4.85}),eAfterTee:Object.freeze({4:Object.freeze({fairway:2.95,in_play:3.25,trouble:3.7}),5:Object.freeze({fairway:3.65,in_play:3.95,trouble:4.4})}),rowCounts:Object.freeze({eHole:Object.freeze({3:0,4:0,5:0}),eAfterTee:Object.freeze({4:Object.freeze({fairway:0,in_play:0,trouble:0}),5:Object.freeze({fairway:0,in_play:0,trouble:0})})})}),vc=Object.freeze({version:"v1-provisional-hcp5",calibratedAt:null,eHole:Object.freeze({3:3.4,4:4.45,5:5.1}),eAfterTee:Object.freeze({4:Object.freeze({fairway:3.2,in_play:3.6,trouble:4.05}),5:Object.freeze({fairway:3.9,in_play:4.25,trouble:4.55})}),rowCounts:Object.freeze({eHole:Object.freeze({3:0,4:0,5:0}),eAfterTee:Object.freeze({4:Object.freeze({fairway:0,in_play:0,trouble:0}),5:Object.freeze({fairway:0,in_play:0,trouble:0})})})}),wc=Object.freeze({version:"v1-provisional-hcp20",calibratedAt:null,eHole:Object.freeze({3:3.9,4:5.1,5:5.9}),eAfterTee:Object.freeze({4:Object.freeze({fairway:3.85,in_play:4.2,trouble:4.85}),5:Object.freeze({fairway:4.65,in_play:5,trouble:5.65})}),rowCounts:Object.freeze({eHole:Object.freeze({3:0,4:0,5:0}),eAfterTee:Object.freeze({4:Object.freeze({fairway:0,in_play:0,trouble:0}),5:Object.freeze({fairway:0,in_play:0,trouble:0})})})}),xc=Object.freeze({inside_1m:1.02,"1_to_2m":1.35,"2_to_4m":1.72,"4_to_8m":1.95,over_8m:2.2}),kc=Object.freeze({inside_1m:1.03,"1_to_2m":1.4,"2_to_4m":1.78,"4_to_8m":2.02,over_8m:2.3}),$c=Object.freeze({inside_1m:1.08,"1_to_2m":1.5,"2_to_4m":1.92,"4_to_8m":2.2,over_8m:2.55}),Sc=Object.freeze({inside2m:1.19,outside2m:1.96}),Tc=Object.freeze({inside2m:1.22,outside2m:2.03}),Pc=Object.freeze({inside2m:1.29,outside2m:2.22}),Cc=Object.freeze({standard:1.55,hard:1.9,bunker:1.75}),Ic=Object.freeze({standard:1.62,hard:2,bunker:1.85}),Ec=Object.freeze({standard:1.8,hard:2.25,bunker:2.08}),mt=Object.freeze({scratch:Object.freeze({tables:_c,expected:xc,chipOutcome:Sc,chipBaseline:Cc}),hcp5:Object.freeze({tables:vc,expected:kc,chipOutcome:Tc,chipBaseline:Ic}),hcp12:Object.freeze({tables:Cr,expected:Sr,chipOutcome:Tr,chipBaseline:Pr}),hcp20:Object.freeze({tables:wc,expected:$c,chipOutcome:Pc,chipBaseline:Ec})}),gt=mt.hcp12,he=["tee","approach","shortGame","putting","penalties"];function Ir(s,e=Cr,t=Sr,n=Tr,i=Pr){const r=s.attHolesPar3Gir+s.attHolesPar3Miss,o=s.attFairwayPar4+s.attInPlayPar4+s.attTroublePar4,d=s.attFairwayPar5+s.attInPlayPar5+s.attTroublePar5,c=r+o+d,u={attributed:c,holesScored:s.holesScored};if(c===0)return{tee:null,approach:null,shortGame:null,putting:null,penalties:null,total:null,coverage:u};const h=o+d,f=s.attSgStrokesEffectiveStandard+s.attSgStrokesEffectiveHard+s.attSgStrokesEffectiveBunker,m=s.attMissStandard+s.attMissHard+s.attMissBunker,_=r*e.eHole[3]+o*e.eHole[4]+d*e.eHole[5],v=s.attFairwayPar4*e.eAfterTee[4].fairway+s.attInPlayPar4*e.eAfterTee[4].in_play+s.attTroublePar4*e.eAfterTee[4].trouble+s.attFairwayPar5*e.eAfterTee[5].fairway+s.attInPlayPar5*e.eAfterTee[5].in_play+s.attTroublePar5*e.eAfterTee[5].trouble+r*e.eHole[3],k=s.attGirFirstPuttInside1m*t.inside_1m+s.attGirFirstPutt1To2m*t["1_to_2m"]+s.attGirFirstPutt2To4m*t["2_to_4m"]+s.attGirFirstPutt4To8m*t["4_to_8m"]+s.attGirFirstPuttOver8m*t.over_8m,N=(s.attChipInside2mStandard+s.attChipInside2mHard+s.attChipInside2mBunker)*n.inside2m+(s.attChipOutside2mStandard+s.attChipOutside2mHard+s.attChipOutside2mBunker)*n.outside2m,B=s.attMissStandard*i.standard+s.attMissHard*i.hard+s.attMissBunker*i.bunker,U=s.attMissStandard*(1+i.standard)+s.attMissHard*(1+i.hard)+s.attMissBunker*(1+i.bunker),O=s.attFairwayPar4*(1+e.eAfterTee[4].fairway-e.eHole[4])+s.attInPlayPar4*(1+e.eAfterTee[4].in_play-e.eHole[4])+s.attTroublePar4*(1+e.eAfterTee[4].trouble-e.eHole[4])+s.attFairwayPar5*(1+e.eAfterTee[5].fairway-e.eHole[5])+s.attInPlayPar5*(1+e.eAfterTee[5].in_play-e.eHole[5])+s.attTroublePar5*(1+e.eAfterTee[5].trouble-e.eHole[5]),ee=s.attStrokes-s.attPutts-s.attPenalties-h-f+k+U-v,ce=f-m+N-B,ue=s.attPutts-(k+N),wa=s.attPenalties,xa=s.attStrokes-_;return{tee:O,approach:ee,shortGame:ce,putting:ue,penalties:wa,total:xa,coverage:u}}function Gt(s,e=gt){return Ir(s,e.tables,e.expected,e.chipOutcome,e.chipBaseline)}const Er=9;function Pe(s,e){return Rr(s,Ye(s,e))}function qn(s){return Rr(s,s.total)}function Rr(s,e){return e===null||s.coverage.attributed<Er?null:e*18/s.coverage.attributed}function Ye(s,e){switch(e){case"tee":return s.tee;case"approach":return s.approach;case"shortGame":return s.shortGame;case"putting":return s.putting;case"penalties":return s.penalties}}function Nr(s,e){const t=n=>Vn(Pe(s,n),e.map(i=>Pe(i,n)));return{tee:t("tee"),approach:t("approach"),shortGame:t("shortGame"),putting:t("putting"),penalties:t("penalties"),total:Vn(qn(s),e.map(qn))}}function ln(s,e){switch(e){case"tee":return s.tee;case"approach":return s.approach;case"shortGame":return s.shortGame;case"putting":return s.putting;case"penalties":return s.penalties}}function dn(s){let e=0,t=0;for(const n of s)n!==null&&(e+=n,t+=1);return t===0?null:e/t}function Vn(s,e){if(s===null)return null;const t=dn(e);return t===null?null:s-t}function Rc(s){return s.penalties}const Un=1,Nc=2,Oc=.75,Hc=4,Mc=3,Ac=12,Bc=5,zc=2,Lc=10,Kn=.35;function Fc(s,e,t,n){const i=Nr(e,t),r=[];let o=0;const d=(k,N)=>{r.push({line:k,magnitude:N,order:o++})};let c=null,u=null;for(const k of he){const N=ln(i,k);N!==null&&((c===null||N<c.delta)&&(c={component:k,delta:N}),(u===null||N>u.delta)&&(u={component:k,delta:N}))}c!==null&&c.delta<=-Un&&d({id:"component_best_vs_baseline",params:{component:c.component,delta:c.delta}},Math.abs(c.delta)),u!==null&&u.delta>=Un&&d({id:"component_worst_vs_baseline",params:{component:u.component,delta:u.delta}},Math.abs(u.delta));const h=dn(t.map(Rc)),f=e.penalties;h!==null&&f!==null&&f>=h+Nc&&d({id:"penalties_spike",params:{penalties:f,baseline:h}},0),s.teeMissRecorded>=Lc&&s.teeMissLeft>=Kn*s.teeMissRecorded&&s.teeMissRight>=Kn*s.teeMissRecorded&&d({id:"two_way_miss",params:{left:s.teeMissLeft,right:s.teeMissRight,recorded:s.teeMissRecorded}},0),s.scrambleAttemptsHard>=Mc&&s.scrambleSuccessesHard===s.scrambleAttemptsHard&&d({id:"hard_scramble_streak",params:{successes:s.scrambleSuccessesHard,attempts:s.scrambleAttemptsHard}},0);const m=s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker,_=s.scrambleSuccessesStandard+s.scrambleSuccessesHard+s.scrambleSuccessesBunker;m>=Hc&&_>=Oc*m&&d({id:"scramble_streak",params:{successes:_,attempts:m}},0),s.threePutts===0&&s.puttsTotal>=Ac&&d({id:"three_putt_free",params:{putts:s.puttsTotal,holes:s.puttsRecorded}},0);const g=Pe(e,"putting"),v=t.map(k=>Pe(k,"putting")).filter(k=>k!==null);return g!==null&&v.length>=Bc&&v.every(k=>g<k)&&d({id:"best_putting_round",params:{putting:g,rounds:v.length}},0),s.bounceBackOpportunities>=zc&&s.bounceBackSuccesses===s.bounceBackOpportunities&&d({id:"bounce_back_perfect",params:{opportunities:s.bounceBackOpportunities,successes:s.bounceBackSuccesses}},0),r.sort((k,N)=>N.magnitude-k.magnitude||k.order-N.order),r.slice(0,Math.max(0,n)).map(k=>k.line)}const Or=["auto",...bc],js="auto";function ct(s){switch(s){case"scratch":return"Scratch";case"hcp5":return"5 handicap";case"hcp12":return"12 handicap";case"hcp20":return"20+ handicap"}}function Wn(s){return s==="auto"?"Match my handicap":ct(s)}function Gc(s,e){return s!=="auto"?`About ${yc(mt[s].tables)} shots on a par 72.`:e===null?`No handicap on your profile yet, so this uses the ${ct("hcp12")} reference.`:`Your ${cn(e)} handicap puts you on the ${ct(on(e))} reference.`}function cn(s){return s<0?`+${(-s).toFixed(1)}`:s.toFixed(1)}function un(s,e){return s==="auto"?on(e):s}const jc=Object.freeze({cohort:on(null),choice:js,handicapIndex:null});function Dc(s,e){return{cohort:un(s,e),choice:s,handicapIndex:e}}function qc(s){return Or.includes(s)}const Hr=Xe("tapscore.stats.sgBaseline.v1",{decode:s=>qc(s)?s:js,encode:s=>s,empty:js});function Ds(s=J()){return Hr.read(s)}function Vc(s,e=J()){Hr.write(s,e)}const Yn=Object.freeze(Object.keys(Ft));function Uc(s){if(typeof s!="object"||s===null)return[...Yn];const e=s;return Yn.filter(t=>typeof e[t]!="number")}function jt(s){if(s.length===0)return null;const e=Uc(s[0].measures);if(e.length===0)return null;const t=e.slice(0,3).join(", "),n=e.length>3?` and ${e.length-3} more`:"";return`The server sent stats this app does not understand (missing ${t}${n}).`}const Kc=["tee","approach","putting","shortGame","scoring"];function ws(s){switch(s){case"tee":return"Off the tee";case"approach":return"Approach";case"putting":return"Putting";case"shortGame":return"Short game";case"scoring":return"Scoring"}}const Wc=3,Mr={rounds:[],statCaptureRounds:0,totals:Ft,waterfall:Ir(Ft),priorities:[],trends:[],tee:null,approach:null,putting:null,shortGame:null,scoring:null,results:null};function hn(s,e=gt){const t=ss(s);if(t.length===0)return Mr;const n=Dn(t.map(c=>c.measures)),i=t.map(c=>Gt(c.measures,e)),r=t.length,o=t.filter(c=>Td(c.measures)),d=Dn(o.map(c=>c.measures));return{rounds:t.map((c,u)=>{const h=i[u];return{id:c.roundId,date:c.date,courseName:c.courseName,name:c.name,holeCount:c.holeCount,strokes:c.measures.holesScored===0?null:c.measures.strokesTotal,vsPar:c.measures.holesScored===0?null:c.measures.strokesTotal-c.measures.parTotal,waterfall:h}}),statCaptureRounds:o.length,totals:n,waterfall:Gt(n,e),priorities:Yc(i),trends:Xc(t,e),tee:Qc(n,r),approach:Jc(n),putting:Zc(n,e),shortGame:eu(n),scoring:tu(n,r,d),results:gc(t)}}function Yc(s){const e=he.map(n=>{const i=s.map(r=>Pe(r,n));return{component:n,per18:dn(i),roundsCovered:i.filter(r=>r!==null).length,roundsInWindow:s.length}}),t=n=>he.indexOf(n);return e.sort((n,i)=>n.per18!==null&&i.per18!==null?n.per18===i.per18?t(n.component)-t(i.component):i.per18-n.per18:n.per18!==null?-1:i.per18!==null?1:t(n.component)-t(i.component))}function xs(s){return $d(s)==="percentage"?s.value:null}function Xc(s,e=gt){const t=[...s].reverse(),n=(i,r,o,d)=>{const c=[];for(const u of t){const h=d(u.measures);h!==null&&c.push(h)}return c.length>=Wc?{id:i,title:r,kind:o,points:c}:null};return[n("fairway","Fairways","percentage",i=>xs(xr(i))),n("gir","Greens","percentage",i=>xs(kr(i))),n("putting","Putting","strokesLost",i=>Pe(Gt(i,e),"putting")),n("scramble","Scrambling","percentage",i=>xs($r(i).overall))].filter(i=>i!==null)}function Qc(s,e){return s.teeRecorded<=0?null:{fairway:xr(s),inPlayOnly:x(s.inPlayHits-s.fairwayHits,s.teeRecorded),trouble:Ed(s),troubleTax:Bd(s),vsParByTee:Ad(s),recovery:Hd(s),teeMiss:Kd(s),teeMissRecorded:s.teeMissRecorded,teeFan:{leftInPlay:Math.max(0,s.teeMissLeft-s.teeTroubleLeft),leftTrouble:s.teeTroubleLeft,fairway:s.fairwayHits,rightInPlay:Math.max(0,s.teeMissRight-s.teeTroubleRight),rightTrouble:s.teeTroubleRight},teeRecorded:s.teeRecorded,penaltiesPerRound:Md(s,e),penaltiesRecordedHoles:s.penaltiesRecorded,penaltyHoleShare:Rd(s),penaltyTax:Od(s),vsParByPenalty:Nd(s),penaltySource:Wd(s),penaltySourceRecorded:s.penaltySourceRecorded,penaltiesTee:s.penaltiesTee,penaltiesApproach:s.penaltiesApproach,penaltiesShort:s.penaltiesShort}}function Jc(s){if(s.girRecorded<=0)return null;const e={};for(const t of ze)e[t]=Gd(s,t);return{gir:kr(s),girByTee:zd(s),girFirstPuttMix:e,birdieConversion:qd(s),hardChipShare:Vd(s),girByPar:Ld(s),greenMiss:Ud(s),greenMissRecorded:s.greenMissRecorded,greenMissCounts:{long:s.greenMissLong,short:s.greenMissShort,left:s.greenMissLeft,right:s.greenMissRight},costOfMissedGreen:Fd(s)}}function Zc(s,e){if(s.puttsRecorded<=0&&s.firstPuttRecorded<=0)return null;const t={};for(const n of ze)t[n]=Dd(s,n);return{ladder:ze.map(n=>{const i=ns(s,n),r=e.expected[n];return{bucket:n,made:Yd(s,n),baseline:Math.max(0,2-r),cost:i>0?Pd(s,n)-i*r:null}}),firstPuttSpread:t,threePutt:Xd(s),threePuttsFromOver8m:Zd(s),puttsPerGirHole:ec(s),puttsAfterMissedGreen:tc(s),puttDistribution:Qd(s),puttsPerHoleByPar:Jd(s)}}function eu(s){if(s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker<=0)return null;const t=s.onePuttInside1m+s.onePutt1To2m,n=s.firstPuttInside1mResolved+s.firstPutt1To2mResolved;return{scramble:$r(s),mix:lc(s),outcomes:rc(s),savedInside2m:ac(s),missCost:oc(s),chipInside2m:ic(s),conversionInside2m:x(t,n),chipIns:{standard:s.scrambleHoledStandard,hard:s.scrambleHoledHard,bunker:s.scrambleHoledBunker,overall:s.scrambleHoledStandard+s.scrambleHoledHard+s.scrambleHoledBunker},sandSave:sc(s),scrambleAttemptsBunker:s.scrambleAttemptsBunker,extraShortGameStrokes:nc(s),shortGameStrokesRecorded:s.shortGameStrokesRecorded}}function tu(s,e,t){return s.holesScored<=0?null:{avgVsParByParGroup:dc(s),doubleBogeyPlusPerRound:cc(s,e),doubleCauseGroups:hc(t),doubleBogeyPlusHoles:t.doubleBogeyPlus,penaltyDoubleSources:{tee:t.dblPenaltyTee,approach:t.dblPenaltyApproach,short:t.dblPenaltyShort,unknown:t.dblPenaltyUnknown},bounceBack:uc(s)}}function Ar(s){let e=0;for(const t of s)for(const n of he){const i=Ye(t,n);i!==null&&(e=Math.max(e,Math.abs(i)))}return e}function su(s){let e=0;for(const t of s)t.per18!==null&&(e=Math.max(e,Math.abs(t.per18)));return e}function pn(s){const e=Y.get(We);return e.load(),e.labelOf(s.formatId)??`${s.scoringMode} · ${s.teamShape}`}function nu(s){const e=Y.get(We);return e.load(),e.labelOf(s)??s}function iu(s){return s.map(e=>({key:e.round.id,token:e.token,roundId:e.round.id,name:e.round.name,courseName:e.round.courseNameSnapshot??"",status:e.round.status,completedAt:e.round.completedAt,lastActivityAt:e.round.lastActivityAt??e.round.date,holesPlayed:e.holesPlayed,roleLabel:No(e)||null,created:e.created,played:e.played,date:e.round.date,formats:e.round.formatSlots.map(pn).join(" · ")}))}function ru(s){return s.map(e=>({key:e.token,token:e.token,roundId:null,name:e.name??null,courseName:e.courseName,status:e.status,completedAt:e.completedAt??null,lastActivityAt:e.lastSeenAt,holesPlayed:null,roleLabel:null,created:!1,played:!1,date:e.date??null,formats:null}))}function ut(s){const e=(s.name??"").trim();return e||s.courseName||"Round"}function Dt(s){return s.courseName?ut(s)===s.courseName?null:s.courseName:null}function Fe(s,e=typeof navigator>"u"?"en":navigator.language){return s?/^\d{4}-\d{2}-\d{2}$/.test(s)?new Intl.DateTimeFormat(e,{dateStyle:"medium",timeZone:"UTC"}).format(new Date(`${s}T12:00:00Z`)):s:""}const ot={fromMyRounds:iu,fromDeviceRounds:ru},Br="—";function ie(s){return s.d<=0||s.value===null?null:`${Math.round(s.value*100)}%`}function ne(s,e=2,t=!1){return s.d<=0||s.value===null?null:t?we(s.value,e):ve(s.value,e)}function Ge(s){return{one:s,many:`${s}s`}}const $e=Ge("round"),Z=Ge("hole"),ks=Ge("green");function au(s,e){return s.d<=0?null:`over ${ae(s.d,e)}`}function ou(s,e){const t=ne(s,e.decimals??2,e.signed??!1);if(t===null)return null;const n=e.label?`${t} ${e.label}`:t,i=au(s,e.unit);return i===null?n:`${n} (${i})`}const zr={one:"hole from trouble",many:"holes from trouble"},lu={one:"from the fairway",many:"from the fairway"};function du(s){const e=s.trouble.d,t=s.fairway.d;return e<=0||t<=0?null:`over ${ae(e,zr)} vs ${ae(t,lu)}`}function Lr(s,e,t,n){return s.d<=0||t.d<=0?null:`over ${ae(s.d,e)} vs ${ae(t.d,n)}`}const Fr={one:"hole with the green missed",many:"holes with the green missed"},Gr={one:"green hit",many:"greens hit"},cu={one:"hole with a penalty",many:"holes with a penalty"},uu={one:"without",many:"without"},hu=Ge("penalty hole");function pu(s){return Lr(s.miss,Fr,s.hit,Gr)}function fu(s){return Lr(s.penalty,cu,s.clean,uu)}function is(s){const e=s.filter(n=>n.d>0).map(n=>ae(n.d,n.unit)),t=e.pop();return t===void 0?null:e.length===0?`over ${t}`:`over ${e.join(", ")} and ${t}`}const mu={one:"hole from the fairway",many:"holes from the fairway"},gu={one:"hole in play",many:"holes in play"},bu=Ge("par 3"),yu=Ge("par 4"),_u=Ge("par 5");function vu(s){return is([{d:s.fairway.d,unit:mu},{d:s.inPlay.d,unit:gu},{d:s.trouble.d,unit:zr}])}function Xn(s){return is([{d:s.par3.d,unit:bu},{d:s.par4.d,unit:yu},{d:s.par5.d,unit:_u}])}function wu(s){return is([{d:s.hit.d,unit:Gr},{d:s.miss.d,unit:Fr}])}const xu={one:"off the tee",many:"off the tee"},ku={one:"on the approach",many:"on the approach"},$u={one:"around the green",many:"around the green"},Su={one:"with no source recorded",many:"with no source recorded"};function Tu(s){const e=[{d:s.tee,unit:xu},{d:s.approach,unit:ku},{d:s.short,unit:$u},{d:s.unknown,unit:Su}].filter(n=>n.d>0).map(n=>ae(n.d,n.unit)),t=e.pop();return t===void 0?null:e.length===0?t:`${e.join(", ")} and ${t}`}function de(s){return s===Math.round(s)?String(Math.round(s)):ve(s,1)}function ae(s,e){return`${de(s)} ${s===1?e.one:e.many}`}function ve(s,e=1){return s.toFixed(e)}function we(s,e=1){const t=10**e,n=Math.round(s*t)/t;if(n===0)return ve(0,e);const i=ve(Math.abs(n),e);return n>0?`+${i}`:`−${i}`}function Pu(s){return s===null?Br:we(s,1)}function rs(s){return s===0?"E":we(s,s===Math.round(s)?0:1)}function as(s){switch(s){case"tee":return"Tee";case"approach":return"Approach";case"shortGame":return"Short game";case"putting":return"Putting";case"penalties":return"Penalties"}}function $s(s){switch(s){case"inside_1m":return"Inside 1 m";case"1_to_2m":return"1–2 m";case"2_to_4m":return"2–4 m";case"4_to_8m":return"4–8 m";case"over_8m":return"Over 8 m"}}function Cu(s){return s==="indoor"?"Indoor":"Outdoor"}function Iu(s){switch(s){case"full_18":return"18 holes";case"front_9":return"Front 9";case"back_9":return"Back 9";case"custom_holes":return"Custom holes"}}function jr(s){return Fe(s)}const Dr="Statistics",Eu="All statistics →";function Ru(s){return s==="custom"?Lt:s}function Nu(s,e,t){return an(s)!==null||!t?zt(s):`${zt(s)} — newest ${e}`}function Ou(s){return x(s.strokesTotal-s.parTotal,s.holesScored)}function Hu(s){const e=[],t=Ou(s.totals),n=ne(t,2,!0);n!==null&&e.push({id:"vsPar",value:n,label:"Vs par per hole"});const i=s.tee,r=i===null?null:ie(i.fairway);r!==null&&e.push({id:"fairways",value:r,label:"Fairways hit"});const o=s.approach,d=o===null?null:ie(o.gir);return d!==null&&e.push({id:"gir",value:d,label:"Greens in regulation"}),e}function Mu(s){const e=s.priorities.find(t=>t.per18!==null);return!e||e.per18===null||e.per18<=0?null:`Costing you most: ${as(e.component)}`}function Au(s){const e=Ru(s.preset),t=_r(e,at,s.rows,s.now);if(t.length===0)return null;const n=hn(t,s.bundle??gt),i=Hu(n);if(i.length===0)return null;const r=vr({preset:e,filter:at,loaded:s.rows,hasMore:s.hasMore,now:s.now});return{windowLabel:Nu(e,t.length,r),tiles:i,priorityLine:Mu(n)}}function Bu(s){const e=s.tiles.map(n=>`${n.label} ${n.value}`),t=[`${Dr}, ${s.windowLabel}`,...e];return s.priorityLine!==null&&t.push(s.priorityLine),t.push("Opens your statistics"),t.join(". ")}class os{static PAGE_SIZE=20;rows=new p(null);hasMore=new p(!1);preset=new p(Gs());sgChoice=new p(Ds());profile=Y.get(Ie);loaded=!1;loading=!1;card=new T(()=>{const e=this.rows.get();if(e===null)return null;const t=un(this.sgChoice.get(),this.profile.player.get()?.handicapIndex??null);return Au({rows:e,preset:this.preset.get(),hasMore:this.hasMore.get(),now:new Date,bundle:mt[t]})});refreshPreset(){this.preset.set(Gs()),this.sgChoice.set(Ds())}async load(e=!1){if(!(!e&&(this.loaded||this.loading))){this.loading=!0;try{const t=await w.playerStats.myStats({limit:os.PAGE_SIZE});if(jt(t.rounds)!==null)return;this.rows.set(t.rounds),this.hasMore.set(t.nextCursor!==null),this.loaded=!0}catch(t){t instanceof Q&&t.status===401&&(this.rows.set(null),this.hasMore.set(!1),this.loaded=!0)}finally{this.loading=!1}}}clear(){this.rows.set(null),this.hasMore.set(!1),this.loaded=!1,this.loading=!1}}const wn=class wn extends M{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(C(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};wn.styles=`
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
    `;let qs=wn;const A=s=>`var(--${s})`;let zu=0;const xn=class xn extends M{constructor(){super(...arguments),this.returnFocusTo=null,this.wasOpen=!1}render(){const e=document.createElement("div"),t=(u,h)=>{typeof h=="function"?this.track(C(()=>{u.textContent=h()})):u.textContent=h};this.spawn(qs,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200",this.dialogEl.setAttribute("role","dialog"),this.dialogEl.setAttribute("aria-modal","true"),this.dialogEl.setAttribute("tabindex","-1");const n=`ui-confirm-${++zu}`,i=document.createElement("h2");i.className="ui-confirm__title",i.id=`${n}-title`,t(i,this.props.title??"Confirm"),this.dialogEl.setAttribute("aria-labelledby",i.id),this.dialogEl.appendChild(i);const r=document.createElement("p");r.className="ui-confirm__message",r.id=`${n}-message`,t(r,this.props.message),this.dialogEl.setAttribute("aria-describedby",r.id),this.dialogEl.appendChild(r);const o=document.createElement("div");o.className="ui-confirm__actions";const d=document.createElement("button");d.className="ui-confirm__btn ui-confirm__btn--cancel",t(d,this.props.cancelLabel??"Cancel"),d.addEventListener("click",u=>{u.stopPropagation(),this.handleCancel()}),o.appendChild(d),this.cancelEl=d;const c=document.createElement("button");return c.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(c,this.props.confirmLabel??"Confirm"),c.addEventListener("click",u=>{u.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),o.appendChild(c),this.confirmEl=c,this.dialogEl.appendChild(o),this.dialogEl.addEventListener("click",u=>u.stopPropagation()),this.dialogEl.addEventListener("keydown",u=>this.onKeydown(u)),e.appendChild(this.dialogEl),this.track(C(()=>{const u=this.props.open.get();u&&this.dialogEl.removeAttribute("inert"),this.dialogEl.classList.toggle("open",u),u||this.dialogEl.setAttribute("inert",""),u!==this.wasOpen&&(this.wasOpen=u,u?this.captureFocus():this.restoreFocus())})),e}onMount(){this.props.open.get()&&!this.dialogEl.contains(document.activeElement)&&this.captureFocus()}captureFocus(){const e=document.activeElement;this.returnFocusTo=e instanceof HTMLElement?e:null,this.cancelEl.focus()}restoreFocus(){const e=this.returnFocusTo;this.returnFocusTo=null,e&&e.isConnected&&e.focus()}onKeydown(e){if(!this.props.open.get())return;if(e.key==="Escape"){e.preventDefault(),e.stopPropagation(),this.handleCancel();return}if(e.key!=="Tab")return;const t=this.cancelEl,n=this.confirmEl,i=document.activeElement;e.shiftKey&&(i===t||i===this.dialogEl)?(e.preventDefault(),n.focus()):!e.shiftKey&&i===n&&(e.preventDefault(),t.focus())}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}onDestroy(){this.wasOpen&&this.restoreFocus()}};xn.styles=`
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${A("surface")};
            border: 1px solid ${A("border")};
            border-radius: ${A("radius-md")};
            box-shadow: ${A("shadow-3")};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition:
                opacity ${A("dur-slow")} ${A("ease-standard")},
                transform ${A("dur-slow")} ${A("ease-standard")};
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
            font-family: ${A("font-display")};
            font-size: 1.25rem;
            font-weight: 500;
            line-height: 1.4;
            color: ${A("text")};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-family: ${A("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${A("text")};
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
         *
         * The box is a centring flex container with a token-driven floor
         * (--confirm-btn-min-height, 44px) rather than a height implied by
         * padding. Padding alone put the pair at 40px, under the WCAG 2.5.5
         * touch target, and the only way for an app to fix that was to override
         * .ui-confirm__btn — a framework-internal BEM class no consumer should
         * have to know exists. The floor is a minimum, so a longer label still
         * wraps the button taller.
         */
        .ui-confirm__btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: ${lo("confirm-btn-min-height")};
            padding: 9px 20px;
            font-size: 13px;
            line-height: 20px;
            font-family: ${A("font-ui")};
            font-weight: 600;
            border: 1px solid transparent;
            border-radius: ${A("radius-sm")};
            cursor: pointer;
            transition:
                background ${A("dur-fast")} ${A("ease-standard")},
                border-color ${A("dur-fast")} ${A("ease-standard")},
                color ${A("dur-fast")} ${A("ease-standard")},
                box-shadow ${A("dur-fast")} ${A("ease-standard")};
        }
        .ui-confirm__btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px ${A("accent-soft")};
        }
        .ui-confirm__btn--cancel {
            background: transparent;
            color: ${A("text-muted")};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${A("accent-soft")};
            color: ${A("accent")};
        }
        .ui-confirm__btn--confirm {
            background: ${A("accent")};
            color: ${A("on-accent")};
            border-color: ${A("accent")};
            box-shadow: ${A("shadow-1")};
        }
        .ui-confirm__btn--confirm:hover {
            background: ${A("accent-strong")};
            border-color: ${A("accent-strong")};
        }
        /* Outline, filling only on hover — same reasoning as css.ts danger. */
        .ui-confirm__btn--danger {
            background: transparent;
            color: ${A("danger")};
            border-color: ${A("danger")};
        }
        .ui-confirm__btn--danger:hover {
            background: ${A("danger")};
            color: ${A("on-danger")};
        }
    `;let oe=xn;async function Lu(s,e={}){e.everywhere?await s.auth.logoutEverywhere():await s.auth.logout(),s.profile.clear(),s.friends.clear(),s.activity.clear(),s.friendProfile.clear(),s.spectate.clear(),s.admins.clear(),s.homeStats.clear(),s.landing.clear(),s.navigate("/")}const Fu="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";function Ee(s="avatar"){return`<span class="${s}">
            <img bind="avatarPhoto" class="avatar__photo" alt="" />
            <span bind="avatarInitials" class="avatar__initials"></span>
        </span>`}function Te(s){const e=()=>rl(s());return{avatarPhoto:{src:()=>e()??Fu,className:()=>e()?"avatar__photo":"avatar__photo hidden"},avatarInitials:{textContent:()=>{const t=s();return al(t.displayName,t.username)},className:()=>e()?"avatar__initials hidden":"avatar__initials"}}}function Le(s,e="0.85rem"){return`
        position: relative;
        display: grid; place-items: center;
        width: ${s}px; height: ${s}px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        font-weight: 700; font-size: ${e};

        & .avatar__photo {
            position: absolute; inset: 0;
            width: 100%; height: 100%;
            object-fit: cover;
            &.hidden { display: none; }
        }
        & .avatar__initials {
            &.hidden { display: none; }
        }
    `}const Gu="/tapscore/";function ju(s=Gu){const e=s.trim().replace(/\/+$/,"");return`${e===""?"":e}/manage/`}function Du(s){if(!s.signedIn)return[];const e=[{kind:"identity",displayName:(s.displayName??"").trim()||(s.username??"").trim()||"Signed in",username:(s.username??"").trim()},{kind:"profile",label:"Profile"}];return s.canManageCourses&&e.push({kind:"course-setup",label:"Course setup"}),s.isSuperAdmin&&e.push({kind:"admin",label:"Admin"}),e.push({kind:"signout",label:"Sign out"}),e.push({kind:"signout-all",label:"Sign out everywhere"}),e}function qu(s){return Du(s).map(e=>e.kind)}function Qn(s){return s.signedIn?"avatar":"signin"}const Vu=b(`
    <div class="acct" bind="root">
        <button bind="signin" class="acct__signin" type="button">Sign in</button>
        <button bind="avatar" class="acct__avatar" type="button" aria-label="Account">
            ${Ee("acct__badge")}
        </button>
        <div bind="menu" class="acct__menu">
            <div class="acct__identity">
                <span class="acct__identity-label">Signed in as</span>
                <span bind="idName" class="acct__identity-name"></span>
                <span bind="idUser" class="acct__identity-user"></span>
            </div>
            <div class="acct__actions" role="group" aria-label="Account">
                <button bind="profile" class="acct__row" type="button">Profile</button>
                <a bind="courseSetup" class="acct__row">Course setup</a>
                <button bind="admin" class="acct__row" type="button">Admin</button>
                <button bind="signout" class="acct__row acct__row--quiet" type="button">Sign out</button>
                <button bind="signoutAll" class="acct__row acct__row--quiet" type="button">Sign out everywhere</button>
            </div>
        </div>
        <div bind="confirmHost"></div>
    </div>
`);class Uu extends M{static styles=`
        .acct {
            position: relative;
            display: flex;
            justify-content: flex-end;

            & .acct__signin {
                padding: ${a("xs")} ${a("md")};
                background: none;
                border: 1px solid ${l("border")};
                border-radius: ${l("radius-pill")};
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 700;
                color: ${l("text")};
                cursor: pointer;

                &:hover { background: ${l("hover-bg")}; }
                &.hidden { display: none; }
            }

            & .acct__avatar {
                display: flex;
                padding: 0;
                background: none;
                border: none;
                border-radius: ${l("radius-pill")};
                cursor: pointer;
                box-shadow: ${l("shadow")};

                &:focus-visible { outline: 2px solid ${l("accent")}; outline-offset: 2px; }
                &.hidden { display: none; }

                & .acct__badge {
                    ${Le(38,"0.9rem")}
                    background: ${l("primary")};
                    color: ${l("primary-text")};
                    font-family: inherit;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                }
            }

            & .acct__menu {
                position: absolute;
                top: calc(100% + ${a("xs")});
                right: 0;
                z-index: 20;
                min-width: 208px;
                padding: ${a("xs")};
                background: ${l("surface")};
                border: 1px solid ${l("border")};
                border-radius: ${l("radius")};
                box-shadow: ${l("shadow-elevated")};
                text-align: left;

                &.hidden { display: none; }

                & .acct__identity {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    padding: ${a("sm")} ${a("md")} ${a("md")};
                    border-bottom: 1px solid ${l("border")};
                    margin-bottom: ${a("xs")};

                    & .acct__identity-label {
                        font-size: 0.68rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        color: ${l("text-muted")};
                    }
                    & .acct__identity-name {
                        font-weight: 700;
                        font-size: 0.98rem;
                        color: ${l("text")};
                    }
                    & .acct__identity-user {
                        font-size: 0.82rem;
                        color: ${l("text-muted")};
                        &:empty { display: none; }
                    }
                }

                & .acct__row {
                    display: block;
                    width: 100%;
                    padding: ${a("sm")} ${a("md")};
                    background: none;
                    border: none;
                    border-radius: ${l("radius-sm")};
                    text-align: left;
                    /* The Course setup row is an anchor (it leaves this app),
                       and the rest are buttons; these two declarations are what
                       make the anchor read as the same row. */
                    text-decoration: none;
                    box-sizing: border-box;
                    font-family: inherit;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: ${l("text")};
                    cursor: pointer;

                    &:hover { background: ${l("hover-bg")}; }
                    &.acct__row--quiet { color: ${l("text-muted")}; }
                    &.hidden { display: none; }
                }
            }
        }
    `;auth=this.inject(V);profile=this.inject(Ie);friends=this.inject(es);activity=this.inject(tn);friendProfile=this.inject(ts);spectate=this.inject(gr);admins=this.inject(br);homeStats=this.inject(os);landing=this.inject(Zt);router=this.inject(q);open=new p(!1);state=new T(()=>({signedIn:this.auth.currentUser.get()!==null,displayName:this.profile.player.get()?.displayName??null,username:this.profile.player.get()?.username??this.auth.currentUser.get()?.username??null,isSuperAdmin:this.admins.isSuperAdmin(),canManageCourses:this.admins.canManageCourses()}));signOutAllOpen=new p(!1);has(e){return qu(this.state.get()).includes(e)}rowClass(e,t=""){const n=`acct__row${t}`;return this.has(e)?n:`${n} hidden`}async signOut(e={}){await Lu({auth:this.auth,profile:this.profile,friends:this.friends,activity:this.activity,friendProfile:this.friendProfile,spectate:this.spectate,admins:this.admins,homeStats:this.homeStats,landing:this.landing,navigate:t=>this.router.navigate(t)},e)}render(){this.auth.currentUser.get()&&(this.profile.load(),this.admins.loadRoles());const e=this.wire(Vu,{signin:{className:()=>Qn(this.state.get())==="signin"?"acct__signin":"acct__signin hidden",onclick:()=>{this.open.set(!1),this.router.navigate("/login")}},...Te(()=>{const u=this.profile.player.get();return{id:u?.id??"",avatarVersion:u?.avatarVersion??null,displayName:this.state.get().displayName,username:this.state.get().username}}),avatar:{className:()=>Qn(this.state.get())==="avatar"?"acct__avatar":"acct__avatar hidden","aria-expanded":()=>this.open.get()?"true":"false",onclick:()=>this.open.set(!this.open.get())},menu:{className:()=>this.open.get()&&this.has("identity")?"acct__menu":"acct__menu hidden"},idName:()=>{const u=this.state.get();return(u.displayName??"").trim()||(u.username??"").trim()||"Signed in"},idUser:()=>{const u=(this.state.get().username??"").trim();return u===""?"":`@${u}`},profile:{className:()=>this.rowClass("profile"),onclick:()=>{this.open.set(!1),this.router.navigate("/profile")}},courseSetup:{className:()=>this.rowClass("course-setup"),href:ju(),onclick:()=>this.open.set(!1)},admin:{className:()=>this.rowClass("admin"),onclick:()=>{this.open.set(!1),this.router.navigate("/admin")}},signout:{className:()=>this.rowClass("signout"," acct__row--quiet"),onclick:()=>{this.open.set(!1),this.signOut()}},signoutAll:{className:()=>this.rowClass("signout-all"," acct__row--quiet"),onclick:()=>{this.open.set(!1),this.signOutAllOpen.set(!0)}}});this.spawn(oe,this.ref(e,"confirmHost"),{open:this.signOutAllOpen,title:"Sign out everywhere?",message:"Every device signed in to this account is signed out, including this one. Rounds and scores are untouched — you can sign back in with your password.",confirmLabel:"Sign out everywhere",cancelLabel:"Cancel",onconfirm:()=>{this.signOut({everywhere:!0})}});const t=this.ref(e,"root"),n=e.querySelector('[bind="avatar"]'),i=u=>{u.key==="Escape"&&this.open.get()&&(this.open.set(!1),n?.focus())},r=u=>{if(!this.open.get())return;const h=u.target;h instanceof Node&&t.contains(h)||this.open.set(!1)};let o=!1;const d=()=>{o||(o=!0,window.addEventListener("keydown",i),document.addEventListener("pointerdown",r,!0))},c=()=>{o&&(o=!1,window.removeEventListener("keydown",i),document.removeEventListener("pointerdown",r,!0))};return this.track(C(()=>{this.open.get()?d():c()})),this.track(c),e}}function Ue(s){return s.token===null?null:s.created?"delete":s.played?"leave":null}function qr(s){return s==="delete"?"Delete round":"Remove me from this round"}const Ku=14,Wu=1440*60*1e3;function Je(s,e){return e(s)}function Yu(s,e,t,n=Ku){const i=e-n*Wu,r=[],o=[];for(const d of s){const c=Je(d,t);if(c.status==="complete"){const u=c.completedAt?Date.parse(c.completedAt):NaN;(Number.isNaN(u)||u>=i)&&o.push(d)}else r.push(d)}return r.sort((d,c)=>Jn(Je(d,t).lastActivityAt,Je(c,t).lastActivityAt)),o.sort((d,c)=>Jn(Je(d,t).completedAt,Je(c,t).completedAt)),{ongoing:r,finished:o}}function Jn(s,e){const t=s?Date.parse(s):NaN,n=e?Date.parse(e):NaN,i=Number.isNaN(t)?Number.NEGATIVE_INFINITY:t,r=Number.isNaN(n)?Number.NEGATIVE_INFINITY:n;return i===r?0:r-i}const Xu=3,Vr=4;function Ss(s){return s==null||!Number.isFinite(s)?null:`HCP ${cn(s)}`}function Ur(s){return s>Vr}function Qu(s){return s.rows===0||s.finished>0?!1:!Ur(s.ongoing)}function Ju(s){return s.rows===0}const Zu=b(`
    <div bind="root" class="landing">
        <header bind="head" class="landing__head">
            <div class="landing__flag">⛳</div>
            <h1>tapscore</h1>
            <p>Scores, settled on the green. No sign-in needed.</p>
        </header>

        <!-- Signed in the wordmark has done its job — the app has been opened
             and signed into, and the top of the screen is better spent saying
             who it thinks you are. The whole strip is the button: the target
             people aim at is the face, and a full row beats a 44px circle. -->
        <button bind="identity" class="landing__identity" type="button">
            ${Ee("landing__identity-badge")}
            <span class="landing__identity-text">
                <span bind="identityName" class="landing__identity-name"></span>
                <span bind="identityHcp" class="landing__identity-hcp"></span>
            </span>
        </button>

        <div bind="newSection" class="landing__section-block landing__new">
            <div class="landing__section">
                <span class="landing__section-title">New — you were added</span>
                <span bind="newCount" class="landing__count landing__new-count"></span>
            </div>
            <div bind="newList" class="landing__list"></div>
        </div>

        <div bind="ongoingSection" class="landing__section-block landing__ongoing">
            <div class="landing__section landing__ongoing-head">
                <span class="landing__section-title">Ongoing</span>
                <span bind="ongoingCount" class="landing__count"></span>
            </div>
            <div bind="ongoingList" class="landing__ongoing-list"></div>
            <button bind="ongoingMore" class="landing__ongoing-foot" type="button">Show all →</button>
        </div>

        <div bind="outNowSection" class="landing__section-block landing__outnow">
            <div class="landing__section">
                <span class="landing__live-dot" aria-hidden="true"></span>
                <!-- Deliberately NOT landing__section-title: this is a quiet
                     muted context line, and the section-title rule's higher
                     specificity would repaint it as a display-face heading. -->
                <span bind="outNowContext" class="landing__outnow-title"></span>
            </div>
            <div bind="outNowList" class="landing__outnow-chips"></div>
        </div>

        <!-- Recently finished is ONE card, not a card per round: home is about
             the round you are playing, and the ones you have played are a
             glance and a door. Its compact rows use the same overflow action
             as every other personal round row. -->
        <div bind="finishedSection" class="landing__section-block landing__finished">
            <div class="landing__section landing__finished-head">
                <span class="landing__section-title">Recently finished</span>
                <span bind="finishedCount" class="landing__count"></span>
            </div>
            <div bind="finishedList" class="landing__finished-list"></div>
            <button bind="finishedAll" class="landing__finished-foot" type="button">All rounds →</button>
        </div>

        <button bind="history" class="landing__history" type="button">All rounds →</button>

        <!-- "From your friends", not "Recently": the screen already has a
             "Recently finished" section for YOUR rounds, and two headings one
             word apart with nothing saying whose is a coin-flip. -->
        <div bind="recentlySection" class="landing__section-block landing__recently">
            <div class="landing__section landing__recently-head">
                <span class="landing__section-title">From your friends</span>
            </div>
            <div bind="recentlyList" class="landing__recently-list"></div>
        </div>

        <!-- The statistics card, last: it is the screen's slowest read and the
             one thing here that is about the past rather than about today.
             The WHOLE card is the button (there is nothing else on it to tap),
             so every child is phrasing content — a <div> inside a <button> is
             not. Absent entirely when there is nothing to show. -->
        <button bind="stats" class="landing__stats" type="button">
            <span class="landing__section landing__stats-head">
                <span bind="statsTitle" class="landing__section-title"></span>
                <span bind="statsWindow" class="landing__count"></span>
            </span>
            <span bind="statsTiles" class="landing__stats-tiles"></span>
            <span bind="statsPriority" class="landing__stats-priority"></span>
            <span class="landing__stats-rule" aria-hidden="true"></span>
            <span bind="statsFoot" class="landing__stats-foot"></span>
        </button>

        <div bind="empty" class="landing__empty">No rounds yet — tap Play golf to tee off.</div>
        <p bind="actionError" class="landing__action-error" role="status"></p>

        <div bind="confirmHost"></div>
    </div>
`),eh='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',fn=`
    <span bind="title" class="round-summary__title"></span>
    <span bind="course" class="round-summary__course"></span>
    <span class="round-summary__bottom">
        <span bind="date"></span>
        <span bind="progress" class="round-summary__progress"></span>
    </span>
    <span bind="formats" class="round-summary__formats"></span>
`,th=b(`
    <div class="round-row">
        <button bind="row" type="button" class="round-summary round-row__main">${fn}</button>
        <div bind="actions" class="round-row__actions">
            <button bind="menuButton" type="button" class="round-row__menu-button" aria-label="Round actions" aria-haspopup="true" aria-expanded="false">${eh}</button>
            <div bind="menu" class="round-row__menu" role="group" aria-label="Round actions">
                <button bind="action" type="button" class="round-row__menu-action"></button>
            </div>
        </div>
    </div>
`),sh=b(`
    <button bind="chip" type="button" class="outnow-chip">
        <span class="outnow-chip__badge-wrap">
            ${Ee("outnow-chip__badge")}
            <span class="outnow-chip__dot" aria-hidden="true"></span>
        </span>
        <span class="outnow-chip__text">
            <span bind="who" class="outnow-chip__who"></span>
            <span bind="line" class="outnow-chip__line"></span>
        </span>
    </button>
`),nh=b(`
    <span class="stat-tile">
        <span bind="value" class="stat-tile__value"></span>
        <span bind="label" class="stat-tile__label"></span>
    </span>
`),ih=b(`
    <button bind="row" type="button" class="round-summary recent-row">
        ${Ee("recent-row__avatar")}
        <span class="recent-row__content">${fn}</span>
    </button>
`);class Zn extends M{static styles=`
        .landing {
            /* The account surface is in the app shell's header, above this
               screen — the landing hosts nothing account-shaped itself.
               The extra 76px under the usual 2xl is the Play pill's room:
               floating (signed out) it occupies the viewport's bottom ~60px,
               and docked it still hangs 22px into this screen — without the
               allowance the last row scrolls to a stop underneath it. */
            padding: ${a("lg")} ${a("lg")} calc(${a("2xl")} + 76px);

            & .landing__head {
                text-align: center;
                margin-bottom: ${a("xl")};

                &.hidden { display: none; }

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

            /* The signed-in header. A row-shaped button, so the whole strip —
               face, name and pill — is one target for the profile. */
            & .landing__identity {
                display: flex;
                align-items: center;
                gap: ${a("md")};
                width: 100%;
                margin-bottom: ${a("xl")};
                padding: 0;
                background: none;
                border: none;
                font-family: inherit;
                text-align: left;
                cursor: pointer;

                &.hidden { display: none; }
                &:focus-visible { outline: 2px solid ${l("accent")}; outline-offset: 4px; }

                & .landing__identity-badge {
                    ${Le(48,"1.1rem")}
                    background: ${l("accent-soft")};
                    color: ${l("accent")};
                }
                & .landing__identity-text {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: ${a("xs")};
                    min-width: 0;
                }
                & .landing__identity-name {
                    font-family: ${l("font-display")};
                    font-weight: 600;
                    font-size: 1.4rem;
                    color: ${l("text")};
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 100%;
                }
                /* No index ⇒ no pill, never "HCP –" (see handicapPill). */
                & .landing__identity-hcp {
                    background: ${l("accent-soft")};
                    color: ${l("accent")};
                    font-size: 0.8rem;
                    font-weight: 700;
                    border-radius: ${l("radius-pill")};
                    padding: 2px 9px;

                    &.hidden { display: none; }
                }
            }

            & .landing__section-block {
                margin-bottom: ${a("xl")};
                &.hidden { display: none; }
            }

            /* "Out now" — friends on the course right now. Renders only when
               non-empty ("empty means invisible"): it must never occupy the
               opening screen to say nothing is happening. A horizontal chip
               row rather than a list, so however sociable the viewer's
               friends are they cannot push the viewer's own rounds off
               screen. */
            & .landing__live-dot {
                width: 8px; height: 8px; border-radius: 50%;
                background: ${l("accent")};
                flex-shrink: 0; align-self: center;
            }
            & .landing__outnow-title { font-size: 0.9rem; color: ${l("text-muted")}; }
            & .landing__outnow-chips {
                display: flex; gap: ${a("sm")};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                /* Chips scroll to the screen edge instead of stopping short
                   of it and looking clipped. */
                margin: 0 -${a("lg")};
                padding: 2px ${a("lg")};
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }
            }
            & .outnow-chip {
                ${R({hover:!0})}
                display: flex; align-items: center; gap: ${a("sm")};
                flex-shrink: 0; max-width: 85%;
                padding: ${a("sm")} ${a("md")};
                font-family: inherit; text-align: left; cursor: pointer;

                & .outnow-chip__badge-wrap { position: relative; flex-shrink: 0; }
                & .outnow-chip__badge {
                    ${Le(36,"0.8rem")}
                    background: ${l("primary")}; color: ${l("primary-text")};
                }
                /* The live marker rides the avatar: the chip is already
                   "who + how far", and a third text fragment is a wall of
                   words at four chips wide. No animation — motion in the
                   corner of the eye on every app open is worse than none. */
                & .outnow-chip__dot {
                    position: absolute; right: -1px; bottom: -1px;
                    width: 10px; height: 10px; border-radius: 50%;
                    background: ${l("accent")};
                    border: 2px solid ${l("surface")};
                }
                & .outnow-chip__text {
                    display: flex; flex-direction: column; gap: 1px; min-width: 0;
                }
                & .outnow-chip__who {
                    font-weight: 600; font-size: 0.95rem; color: ${l("text")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .outnow-chip__line {
                    font-weight: 600; font-size: 0.8rem; color: ${l("accent")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
            }

            /* "From your friends" is one grouped activity panel. The heading
               and rows share the same outer card treatment as the two own-round
               panels above it. */
            & .landing__recently {
                ${R()}
                overflow: hidden;

                & .landing__recently-head {
                    margin-bottom: 0;
                    padding: ${a("md")} ${a("lg")} ${a("sm")};
                }
                & .landing__recently-list {
                    display: flex;
                    flex-direction: column;
                }
            }

            /* The same reading hierarchy is reused for every own or friends
               round card. Only the surrounding container changes: standalone
               rows keep their action affordance; grouped rows grow edge to
               edge inside a panel. */
            & .round-summary {
                display: flex;
                flex-direction: column;
                gap: ${a("xs")};
                width: 100%;
                min-width: 0;
                padding: ${a("md")} ${a("lg")};
                background: none;
                border: none;
                font-family: inherit;
                text-align: left;
                cursor: pointer;

                &:disabled { cursor: default; }
                &:hover:not(:disabled) { background: ${l("hover-bg")}; }

                & .round-summary__title {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: ${l("text")};
                }
                & .round-summary__course {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 0.9rem;
                    color: ${l("text-muted")};

                    &.hidden { display: none; }
                }
                & .round-summary__bottom {
                    display: flex;
                    align-items: baseline;
                    min-width: 0;
                    gap: ${a("sm")};
                    color: ${l("text-muted")};
                    font-size: 0.85rem;
                }
                & .round-summary__formats {
                    min-width: 0;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                & .round-summary__progress::before { content: '·'; margin-right: ${a("sm")}; }
                & .round-summary__progress.hidden,
                & .round-summary__formats.hidden { display: none; }
            }

            & .recent-row {
                flex-direction: row;
                align-items: center;
                gap: ${a("md")};
                width: 100%;
                border-top: 1px solid ${l("border")};

                & .recent-row__avatar {
                    ${Le(36,"0.8rem")}
                    background: ${l("primary")};
                    color: ${l("primary-text")};
                }
                & .recent-row__content {
                    display: flex;
                    flex: 1;
                    flex-direction: column;
                    gap: ${a("xs")};
                    min-width: 0;
                }
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
            & .landing__action-error {
                margin: ${a("sm")} 0 0;
                color: ${l("danger")};
                font-size: 0.85rem;
                &:empty { display: none; }
            }

            & .landing__list {
                display: flex;
                flex-direction: column;
                gap: ${a("sm")};
            }

            & .round-row {
                display: flex;
                align-items: stretch;
                ${R({hover:!0})}

                & .round-row__main {
                    flex: 1;
                    padding-right: 0;
                }

                & .round-row__actions {
                    position: relative;
                    flex: 0 0 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    &.hidden { display: none; }
                }

            }

            /* Ongoing and Recently finished are both grouped panels. Ongoing
               expresses its only useful changing fact inline: scored progress. */
            & .landing__ongoing {
                ${R()}
                overflow: hidden;

                & .landing__ongoing-head {
                    margin-bottom: 0;
                    padding: ${a("md")} ${a("lg")} ${a("sm")};
                }
                & .landing__ongoing-list {
                    display: flex;
                    flex-direction: column;
                }
                & .round-row {
                    border: 0;
                    border-top: 1px solid ${l("border")};
                    border-radius: 0;
                    box-shadow: none;
                }
                & .landing__ongoing-foot {
                    display: block;
                    width: 100%;
                    padding: ${a("md")} ${a("lg")};
                    background: none;
                    border: none;
                    border-top: 1px solid ${l("border")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-align: left;
                    color: ${l("accent")};
                    cursor: pointer;

                    &:hover { background: ${l("hover-bg")}; }
                    &.hidden { display: none; }
                }
            }

            /* Round actions are a compact overflow menu rather than a
               permanently visible trash button. The menu opens beside the
               row so it remains inside the grouped panel's clipping boundary. */
            & .round-row__menu-button {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                padding: 0;
                background: none;
                border: none;
                border-radius: ${l("radius-sm")};
                color: ${l("text-muted")};
                cursor: pointer;

                & svg { width: 18px; height: 18px; }
                &:hover { background: ${l("hover-bg")}; color: ${l("text")}; }
                &:focus-visible { outline: 2px solid ${l("accent")}; outline-offset: -2px; }
            }
            & .round-row__menu {
                position: absolute;
                top: 50%;
                right: 0;
                z-index: 3;
                width: max-content;
                max-width: min(220px, calc(100vw - ${a("lg")}));
                padding: ${a("xs")};
                transform: translateY(-50%);
                background: ${l("surface")};
                border: 1px solid ${l("border")};
                border-radius: ${l("radius")};
                box-shadow: ${l("shadow-elevated")};

                &.hidden { display: none; }
            }
            & .round-row__menu-action {
                display: block;
                min-width: 174px;
                max-width: 100%;
                padding: ${a("sm")} ${a("md")};
                background: none;
                border: none;
                border-radius: ${l("radius-sm")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 600;
                text-align: left;
                color: ${l("danger")};
                cursor: pointer;

                &:hover { background: ${l("hover-bg")}; }
                &:focus-visible { outline: 2px solid ${l("danger")}; outline-offset: -2px; }
            }

            /* Recently finished: one card, its rows separated by the card's own
               border continued inwards so they read as one object. */
            & .landing__finished {
                ${R()}
                overflow: hidden;

                & .landing__finished-head {
                    margin-bottom: 0;
                    padding: ${a("md")} ${a("lg")} ${a("sm")};
                }
                & .landing__finished-list {
                    display: flex;
                    flex-direction: column;
                }
                & .round-row {
                    border: 0;
                    border-top: 1px solid ${l("border")};
                    border-radius: 0;
                    box-shadow: none;
                }
                & .landing__finished-foot {
                    display: block;
                    width: 100%;
                    padding: ${a("md")} ${a("lg")};
                    background: none;
                    border: none;
                    border-top: 1px solid ${l("border")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-align: left;
                    color: ${l("accent")};
                    cursor: pointer;

                    &:hover { background: ${l("hover-bg")}; }
                }
            }

            & .finished-row {
                width: 100%;
                border-top: 1px solid ${l("border")};
            }

            /* The statistics card. One card, one button: the tiles, the
               priority line and the footer are all the same target, so the
               whole thing reads as one object and taps as one. The footer is
               the affordance — a card that only reveals its destination on a
               tap is invisibly clickable. */
            & .landing__stats {
                ${R({hover:!0})}
                display: block;
                width: 100%;
                margin-bottom: ${a("xl")};
                padding: ${a("md")} 0 0;
                font-family: inherit;
                text-align: left;
                cursor: pointer;

                &.hidden { display: none; }

                & .landing__stats-head {
                    display: flex;
                    align-items: baseline;
                    gap: ${a("sm")};
                    margin-bottom: ${a("md")};
                    padding: 0 ${a("lg")};
                }

                & .landing__stats-tiles {
                    display: flex;
                    align-items: flex-start;
                    gap: ${a("md")};
                    padding: 0 ${a("lg")};
                }

                /* The instruction, in the muted tier: it ranks what to work on,
                   it does not shout it. */
                & .landing__stats-priority {
                    display: block;
                    margin-top: ${a("md")};
                    padding: 0 ${a("lg")};
                    color: ${l("text-muted")};
                    font-size: 0.85rem;

                    &.hidden { display: none; }
                }

                & .landing__stats-rule {
                    display: block;
                    margin-top: ${a("md")};
                    border-top: 1px solid ${l("border")};
                }

                /* Accent, not accent-strong: the landing's doors are the
                   decorative brass, and this is one of them. */
                & .landing__stats-foot {
                    display: block;
                    padding: ${a("md")} ${a("lg")};
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: ${l("accent")};
                }
            }

            & .stat-tile {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;

                & .stat-tile__value {
                    font-family: ${l("font-display")};
                    font-weight: 600;
                    font-size: 1.4rem;
                    color: ${l("text")};
                    white-space: nowrap;
                }
                & .stat-tile__label {
                    color: ${l("text-muted")};
                    font-size: 0.75rem;
                }
            }

            /* The same door standing on its own, when there is no card to put
               it in — see showsAllRoundsLink. */
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

        }

        /* App-level accessibility override for the framework confirm dialog. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;svc=this.inject(Zt);profile=this.inject(Ie);activity=this.inject(tn);homeStats=this.inject(os);auth=this.inject(V);router=this.inject(q);loggedIn=new T(()=>this.auth.currentUser.get()!==null);rows=new T(()=>this.loggedIn.get()?ot.fromMyRounds(this.svc.myRounds.get()):ot.fromDeviceRounds(this.svc.deviceRounds.get()));parts=new T(()=>Yu(this.rows.get(),Date.now(),e=>e));ongoing=new T(()=>this.parts.get().ongoing);finished=new T(()=>this.parts.get().finished);ongoingShown=new T(()=>this.ongoing.get().slice(0,Vr));finishedShown=new T(()=>this.finished.get().slice(0,Xu));counts=new T(()=>({rows:this.rows.get().length,ongoing:this.ongoing.get().length,finished:this.finished.get().length}));newRows=new T(()=>this.loggedIn.get()?ot.fromMyRounds(this.svc.newRounds.get()):[]);chips=new T(()=>this.loggedIn.get()?Sl(this.activity.feed.get()?.live??[]):[]);recents=new T(()=>this.loggedIn.get()?El(this.activity.feed.get()?.recent??[]):[]);statsCard=new T(()=>this.loggedIn.get()?this.homeStats.card.get():null);statsTiles=new T(()=>this.statsCard.get()?.tiles??[]);deleteOpen=new p(!1);leaveOpen=new p(!1);actionTarget=new p(null);actionError=new p("");openRoundMenu=new p(null);askAction(e,t,n,i){this.openRoundMenu.set(null),this.actionError.set(""),this.actionTarget.set({token:t,roundId:n,name:i,action:e}),e==="delete"?this.deleteOpen.set(!0):this.leaveOpen.set(!0)}render(){this.loggedIn.get()?(this.svc.loadMine(),this.profile.load(),this.activity.load(),this.homeStats.refreshPreset(),this.homeStats.load(!0)):this.svc.loadDevice();const e=this.wire(Zu,{head:{className:()=>this.loggedIn.get()?"landing__head hidden":"landing__head"},identity:{className:()=>this.loggedIn.get()?"landing__identity":"landing__identity hidden","aria-label":()=>{const r=this.identityName(),o=Ss(this.profile.player.get()?.handicapIndex);return o?`${r}, ${o}`:r},onclick:()=>this.router.navigate("/profile")},...Te(()=>{const r=this.profile.player.get();return{id:r?.id??"",avatarVersion:r?.avatarVersion??null,displayName:r?.displayName??null,username:r?.username??this.auth.currentUser.get()?.username??null}}),identityName:()=>this.identityName(),identityHcp:{textContent:()=>Ss(this.profile.player.get()?.handicapIndex)??"",className:()=>Ss(this.profile.player.get()?.handicapIndex)===null?"landing__identity-hcp hidden":"landing__identity-hcp"},history:{className:()=>Qu(this.counts.get())?"landing__history":"landing__history hidden",onclick:()=>this.router.navigate("/history")},outNowSection:{className:()=>this.chips.get().length>0?"landing__section-block landing__outnow":"landing__section-block landing__outnow hidden"},outNowContext:()=>Pl(this.activity.feed.get()?.live??[])??"",recentlySection:{className:()=>this.recents.get().length>0?"landing__section-block landing__recently":"landing__section-block landing__recently hidden"},newSection:{className:()=>this.newRows.get().length>0?"landing__section-block landing__new":"landing__section-block landing__new hidden"},newCount:()=>{const r=this.newRows.get().length;return r===0?"":String(r)},ongoingSection:{className:()=>this.ongoing.get().length>0?"landing__section-block landing__ongoing":"landing__section-block landing__ongoing hidden"},ongoingCount:()=>{const r=this.ongoing.get().length;return r===0?"":String(r)},ongoingMore:{className:()=>Ur(this.counts.get().ongoing)?"landing__ongoing-foot":"landing__ongoing-foot hidden","aria-label":()=>"Show all ongoing rounds",onclick:()=>this.router.navigate("/history")},finishedSection:{className:()=>this.finished.get().length>0?"landing__section-block landing__finished":"landing__section-block landing__finished hidden"},finishedCount:()=>{const r=this.finished.get().length;return r===0?"":String(r)},finishedAll:{"aria-label":()=>"All rounds",onclick:()=>this.router.navigate("/history")},stats:{className:()=>this.statsCard.get()===null?"landing__stats hidden":"landing__stats","aria-label":()=>{const r=this.statsCard.get();return r===null?"":Bu(r)},onclick:()=>this.router.navigate("/stats")},statsWindow:()=>this.statsCard.get()?.windowLabel??"",statsPriority:{textContent:()=>this.statsCard.get()?.priorityLine??"",className:()=>this.statsCard.get()?.priorityLine?"landing__stats-priority":"landing__stats-priority hidden"},statsTitle:()=>Dr,statsFoot:()=>Eu,empty:{className:()=>Ju(this.counts.get())?"landing__empty":"landing__empty hidden"},actionError:{textContent:()=>this.actionError.get()}});this.$each(this.ref(e,"outNowList"),this.chips,(r,o,d)=>this.wireEl(sh,{chip:{"aria-label":()=>Tl(r),onclick:()=>this.router.navigate("/spectate",{query:{id:r.roundId,name:r.displayName}})},...Te(()=>{const c=this.chips.get().find(u=>u.roundId===r.roundId)??r;return{id:c.playerId,avatarVersion:c.avatarVersion,displayName:c.displayName}}),who:()=>r.title,line:()=>r.progress},d),r=>r.roundId),this.$each(this.ref(e,"recentlyList"),this.recents,(r,o,d)=>this.wireEl(ih,{row:{onclick:()=>this.router.navigate("/spectate",{query:{id:r.roundId,name:r.displayName}})},...Te(()=>({id:r.playerId,avatarVersion:r.avatarVersion,displayName:r.displayName})),title:()=>r.friendLabel,course:{textContent:()=>r.title,className:()=>r.title?"round-summary__course":"round-summary__course hidden"},date:()=>Fe(r.date),progress:{textContent:"",className:"round-summary__progress hidden"},formats:{textContent:()=>(r.formatIds??[]).map(nu).join(" · "),className:()=>(r.formatIds??[]).length>0?"round-summary__formats":"round-summary__formats hidden"}},d),r=>r.roundId),this.$each(this.ref(e,"newList"),this.newRows,(r,o,d)=>this.roundRow(r,d),r=>r.key),this.$each(this.ref(e,"ongoingList"),this.ongoingShown,(r,o,d)=>this.roundRow(r,d,!0),r=>r.key),this.$each(this.ref(e,"finishedList"),this.finishedShown,(r,o,d)=>this.roundRow(r,d),r=>r.key),this.$each(this.ref(e,"statsTiles"),this.statsTiles,(r,o,d)=>this.wireEl(nh,{value:()=>r.value,label:()=>r.label},d),r=>`${r.id}:${r.value}`),this.spawn(oe,this.ref(e,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const r=this.actionTarget.get();return`Delete ${r?`“${r.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const r=this.actionTarget.get();r&&this.svc.remove(r.token,r.roundId).then(o=>{o||this.actionError.set("Could not delete the round. Try again.")})}}),this.spawn(oe,this.ref(e,"confirmHost"),{open:this.leaveOpen,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const r=this.actionTarget.get();r&&this.svc.leave(r.token,r.roundId).then(o=>{o.ok||this.actionError.set(o.message)})}});const t=r=>{r.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1),r.key==="Escape"&&this.leaveOpen.get()&&this.leaveOpen.set(!1),r.key==="Escape"&&this.openRoundMenu.get()!==null&&this.openRoundMenu.set(null)};window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t));const n=this.ref(e,"root"),i=r=>{if(this.openRoundMenu.get()===null)return;const o=r.target;o instanceof Node&&n.contains(o)||this.openRoundMenu.set(null)};return document.addEventListener("pointerdown",i,!0),this.track(()=>document.removeEventListener("pointerdown",i,!0)),e}identityName(){const e=this.profile.player.get(),t=(e?.displayName??"").trim();if(t!=="")return t;const n=(e?.username??this.auth.currentUser.get()?.username??"").trim();return n===""?"Signed in":n}roundRow(e,t,n=!1){return this.wireEl(th,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},title:()=>ut(e),course:{textContent:()=>Dt(e)??"",className:()=>Dt(e)?"round-summary__course":"round-summary__course hidden"},date:()=>Fe(e.date),progress:{textContent:()=>n&&e.holesPlayed&&e.holesPlayed>0?`Thru ${e.holesPlayed}`:"",className:()=>n&&e.holesPlayed&&e.holesPlayed>0?"round-summary__progress":"round-summary__progress hidden"},formats:{textContent:()=>e.formats??"",className:()=>e.formats?"round-summary__formats":"round-summary__formats hidden"},actions:{className:()=>Ue(e)===null?"round-row__actions hidden":"round-row__actions"},menuButton:{"aria-expanded":()=>this.openRoundMenu.get()===e.key?"true":"false",onclick:()=>this.openRoundMenu.set(this.openRoundMenu.get()===e.key?null:e.key)},menu:{className:()=>this.openRoundMenu.get()===e.key?"round-row__menu":"round-row__menu hidden"},action:{textContent:()=>{const i=Ue(e);return i?qr(i):""},onclick:()=>{const i=Ue(e);!i||e.token===null||this.askAction(i,e.token,e.roundId??"",ut(e))}}},t)}}function rh(s){return[...s].sort((e,t)=>{const n=ei(e),i=ei(t);return i!==n?i-n:e.key.localeCompare(t.key)})}function ei(s){const e=s.completedAt??s.lastActivityAt,t=e?Date.parse(e):NaN;return Number.isNaN(t)?Number.NEGATIVE_INFINITY:t}const ah=b(`
    <div class="history">
        <button bind="back" class="history__back" type="button">← Home</button>
        <h1 class="history__title">All rounds</h1>
        <div bind="empty" class="history__empty">No rounds yet — tap Play golf to tee off.</div>
        <div bind="sections" class="history__sections">
            <section bind="ongoingSection" class="history__section history__ongoing">
                <div class="history__section-head">
                    <span class="history__section-title">Ongoing</span>
                    <span bind="ongoingCount" class="history__count"></span>
                </div>
                <div bind="ongoingList" class="history__section-list"></div>
            </section>
            <section bind="finishedSection" class="history__section history__finished">
                <div class="history__section-head">
                    <span class="history__section-title">Finished</span>
                    <span bind="finishedCount" class="history__count"></span>
                </div>
                <div bind="finishedList" class="history__section-list"></div>
            </section>
        </div>
        <p bind="actionError" class="history__action-error" role="status"></p>
        <div bind="confirmHost"></div>
    </div>
`),oh='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',lh=b(`
    <div class="round-row">
        <button bind="row" type="button" class="round-summary round-row__main">${fn}</button>
        <div bind="actions" class="round-row__actions">
            <button bind="menuButton" type="button" class="round-row__menu-button" aria-label="Round actions" aria-haspopup="true" aria-expanded="false">${oh}</button>
            <div bind="menu" class="round-row__menu" role="group" aria-label="Round actions">
                <button bind="action" type="button" class="round-row__menu-action"></button>
            </div>
        </div>
    </div>
`);class dh extends M{static styles=`
        .history {
            /* Same Play-pill allowance as the landing: the docked pill hangs
               22px into this screen's bottom edge. */
            padding: ${a("xl")} ${a("lg")} calc(${a("2xl")} + 76px);

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
            & .history__action-error {
                margin: ${a("sm")} 0 0;
                color: ${l("danger")};
                font-size: 0.85rem;
                &:empty { display: none; }
            }

            & .history__sections {
                display: flex;
                flex-direction: column;
                gap: ${a("xl")};

                &.hidden { display: none; }
            }

            & .history__section {
                ${R()}
                overflow: hidden;

                &.hidden { display: none; }
            }
            & .history__section-head {
                display: flex;
                align-items: baseline;
                gap: ${a("sm")};
                padding: ${a("md")} ${a("lg")} ${a("sm")};
            }
            & .history__section-title {
                font-family: ${l("font-display")};
                font-size: 1.1rem;
                font-weight: 600;
                color: ${l("text")};
            }
            & .history__count {
                font-size: 0.85rem;
                color: ${l("text-muted")};
            }
            & .history__section-list {
                display: flex;
                flex-direction: column;
            }

            /* The same round-summary markup as the landing cards: title,
               course, then one quiet metadata line. Sections now provide the
               lifecycle context, so rows need neither a role tag nor a status
               chip. */
            & .round-summary {
                display: flex;
                flex: 1;
                flex-direction: column;
                gap: ${a("xs")};
                min-width: 0;
                padding: ${a("md")} 0 ${a("md")} ${a("lg")};
                background: none;
                border: none;
                font-family: inherit;
                text-align: left;
                cursor: pointer;

                &:disabled { cursor: default; }

                & .round-summary__title {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: ${l("text")};
                }
                & .round-summary__course {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 0.9rem;
                    color: ${l("text-muted")};

                    &.hidden { display: none; }
                }
                & .round-summary__bottom {
                    display: flex;
                    align-items: baseline;
                    min-width: 0;
                    gap: ${a("sm")};
                    color: ${l("text-muted")};
                    font-size: 0.85rem;
                }
                & .round-summary__formats {
                    min-width: 0;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                & .round-summary__progress::before { content: '·'; margin-right: ${a("sm")}; }
                & .round-summary__progress.hidden,
                & .round-summary__formats.hidden { display: none; }
            }

            & .round-row {
                display: flex;
                align-items: stretch;
                border-top: 1px solid ${l("border")};

                & .round-row__actions {
                    position: relative;
                    flex: 0 0 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    &.hidden { display: none; }
                }
                & .round-row__menu-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
                    padding: 0;
                    background: none;
                    border: none;
                    border-radius: ${l("radius-sm")};
                    color: ${l("text-muted")};
                    cursor: pointer;

                    & svg { width: 18px; height: 18px; }
                    &:hover, &[aria-expanded='true'] { background: ${l("hover-bg")}; color: ${l("text")}; }
                    &:focus-visible { outline: 2px solid ${l("accent")}; outline-offset: -2px; }
                }
                & .round-row__menu {
                    position: absolute;
                    top: 50%;
                    right: 0;
                    z-index: 3;
                    width: max-content;
                    max-width: min(220px, calc(100vw - ${a("lg")}));
                    padding: ${a("xs")};
                    transform: translateY(-50%);
                    background: ${l("surface")};
                    border: 1px solid ${l("border")};
                    border-radius: ${l("radius")};
                    box-shadow: ${l("shadow-elevated")};
                    &.hidden { display: none; }
                }
                & .round-row__menu-action {
                    display: block;
                    min-width: 174px;
                    max-width: 100%;
                    padding: ${a("sm")} ${a("md")};
                    background: none;
                    border: none;
                    border-radius: ${l("radius-sm")};
                    font-family: inherit;
                    font-size: 0.9rem;
                    font-weight: 600;
                    text-align: left;
                    color: ${l("danger")};
                    cursor: pointer;

                    &:hover { background: ${l("hover-bg")}; }
                    &:focus-visible { outline: 2px solid ${l("danger")}; outline-offset: -2px; }
                }
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;svc=this.inject(Zt);auth=this.inject(V);router=this.inject(q);loggedIn=new T(()=>this.auth.currentUser.get()!==null);rows=new T(()=>rh(this.loggedIn.get()?ot.fromMyRounds(this.svc.myRounds.get()):ot.fromDeviceRounds(this.svc.deviceRounds.get())));ongoingRows=new T(()=>this.rows.get().filter(e=>e.status!=="complete"));finishedRows=new T(()=>this.rows.get().filter(e=>e.status==="complete"));deleteOpen=new p(!1);leaveOpen=new p(!1);actionTarget=new p(null);actionError=new p("");openRoundMenu=new p(null);askAction(e,t,n,i){this.openRoundMenu.set(null),this.actionError.set(""),this.actionTarget.set({token:t,roundId:n,name:i,action:e}),e==="delete"?this.deleteOpen.set(!0):this.leaveOpen.set(!0)}render(){this.loggedIn.get()?this.svc.loadMine():this.svc.loadDevice();const e=this.wire(ah,{back:{onclick:()=>this.router.navigate("/")},actionError:{textContent:()=>this.actionError.get()},empty:{className:()=>this.rows.get().length===0?"history__empty":"history__empty hidden"},sections:{className:()=>this.rows.get().length===0?"history__sections hidden":"history__sections"},ongoingSection:{className:()=>this.ongoingRows.get().length===0?"history__section history__ongoing hidden":"history__section history__ongoing"},ongoingCount:()=>String(this.ongoingRows.get().length),finishedSection:{className:()=>this.finishedRows.get().length===0?"history__section history__finished hidden":"history__section history__finished"},finishedCount:()=>String(this.finishedRows.get().length)});this.$each(this.ref(e,"ongoingList"),this.ongoingRows,(r,o,d)=>this.roundRow(r,d,!0),r=>r.key),this.$each(this.ref(e,"finishedList"),this.finishedRows,(r,o,d)=>this.roundRow(r,d),r=>r.key),this.spawn(oe,this.ref(e,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const r=this.actionTarget.get();return`Delete ${r?`“${r.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const r=this.actionTarget.get();r&&this.svc.remove(r.token,r.roundId).then(o=>{o||this.actionError.set("Could not delete the round. Try again.")})}}),this.spawn(oe,this.ref(e,"confirmHost"),{open:this.leaveOpen,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const r=this.actionTarget.get();r&&this.svc.leave(r.token,r.roundId).then(o=>{o.ok||this.actionError.set(o.message)})}});const t=r=>{r.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1),r.key==="Escape"&&this.leaveOpen.get()&&this.leaveOpen.set(!1),r.key==="Escape"&&this.openRoundMenu.get()!==null&&this.openRoundMenu.set(null)};window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t));const n=this.ref(e,"root"),i=r=>{if(this.openRoundMenu.get()===null)return;const o=r.target;o instanceof Node&&n.contains(o)||this.openRoundMenu.set(null)};return document.addEventListener("pointerdown",i,!0),this.track(()=>document.removeEventListener("pointerdown",i,!0)),e}roundRow(e,t,n=!1){return this.wireEl(lh,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},title:()=>ut(e),course:{textContent:()=>Dt(e)??"",className:()=>Dt(e)?"round-summary__course":"round-summary__course hidden"},date:()=>Fe(e.date),progress:{textContent:()=>n&&e.holesPlayed&&e.holesPlayed>0?`Thru ${e.holesPlayed}`:"",className:()=>n&&e.holesPlayed&&e.holesPlayed>0?"round-summary__progress":"round-summary__progress hidden"},formats:{textContent:()=>e.formats??"",className:()=>e.formats?"round-summary__formats":"round-summary__formats hidden"},actions:{className:()=>Ue(e)===null?"round-row__actions hidden":"round-row__actions"},menuButton:{"aria-expanded":()=>this.openRoundMenu.get()===e.key?"true":"false",onclick:()=>this.openRoundMenu.set(this.openRoundMenu.get()===e.key?null:e.key)},menu:{className:()=>this.openRoundMenu.get()===e.key?"round-row__menu":"round-row__menu hidden"},action:{textContent:()=>{const i=Ue(e);return i?qr(i):""},onclick:()=>{const i=Ue(e);!i||e.token===null||this.askAction(i,e.token,e.roundId??"",ut(e))}}},t)}}const ch=700;function uh(s){if(!s.currentHole)return!1;const e=s.balls.filter(t=>!t.pending);return e.length>0&&e.every(t=>t.scored)}function hh(s){return s.currentHole?s.balls.some((e,t)=>t!==s.currentBallIndex&&!e.scored):!1}function Ts(s){const e=s.currentHole;if(!e)return{kind:"noop"};const t=s.balls,n=s.currentBallIndex;for(let i=n+1;i<t.length;i++)if(!t[i].scored)return{kind:"moveToBall",ballIndex:i};for(let i=0;i<n;i++)if(!t[i].scored)return{kind:"moveToBall",ballIndex:i};return s.holeIndex>=s.holeCount-1?{kind:"roundComplete",toast:"Round complete"}:{kind:"holeComplete",toast:`Hole ${e.label} done`,fromHoleId:e.id,toHoleIndex:s.holeIndex+1,delayMs:ch}}function ph(s,e){const t=s.currentHole;if(e.kind==="statsDone")return s.holeCompleteOnEntry?{write:null,move:{kind:"stay"}}:{write:null,move:Ts(s)};const n=s.balls[s.currentBallIndex];if(!t||!n)return{write:null,move:{kind:"noop"}};if(n.pending)return s.holeCompleteOnEntry?{write:null,move:{kind:"stay"}}:{write:null,move:Ts(s)};const i={ballIndex:s.currentBallIndex,holeId:t.id,value:e.value,withMetadata:e.value!==null};return e.value!==null&&e.value>0&&s.collectsStats?{write:i,move:{kind:"openStats"}}:s.holeCompleteOnEntry?{write:i,move:{kind:"stay"}}:{write:i,move:Ts(s)}}const fh={tee_result:"Fairway means the ball finished on the short grass. In play is anywhere you can still play a normal shot. Trouble is anywhere you have to recover from: deep rough, trees, sand, a lost ball.",tee_miss_dir:"Which side the ball finished, looking down the hole from the tee. Only asked when the drive left the fairway. Over a few rounds this is what separates a one-way miss from a two-way one.",recovery_ok:"Did the very next shot get you back to a normal position: fairway, green, or a clear approach? Say yes even if the hole still ended badly. This is about the recovery shot, not the score.",gir:"Hit means the ball was on the putting surface with at least two shots left for par: the first shot on a par 3, the second on a par 4, the third on a par 5. The fringe is a miss.",green_miss_dir:"Which way you missed, seen from where you played the approach. Long is past the flag, short is in front of it. Left and right are exactly that.",short_game_difficulty:"Standard is a clean lie with green to work with. Hard is anything that takes the shot away from you: long grass, short-sided, downhill, an awkward stance. Bunker is sand, whatever the lie.",short_game_strokes:"How many shots it took to get from off the green onto it. One is the normal answer and is already filled in — only change it if you needed more.",first_putt:"How far the first putt was, in metres. If you holed out from off the green there was no first putt, so leave this alone and set putts to 0.",putts:"Putts taken on the green, counting the one that went in. 0 means you were never on the green with a putter.",penalties:"Penalty strokes added on this hole: out of bounds, a lost ball, an unplayable lie, water. Count strokes, not incidents.",penalty_source:"Which shot cost you the stroke. If a hole cost you more than one, pick the shot that did the most damage."};function mh(s){return fh[s]}const De={explainerTrigger:"What these mean",explainerTitle:"What these mean",girPending:"Will be filled in from your score when you close this.",girDisagreeMiss:"Your score says this green was missed. Tap to change it, or leave it.",girDisagreeHit:"Your score says this green was hit. Tap to change it, or leave it.",girPendingAria:"Green in regulation, not answered, will be filled in from your score"},bt=`
        <div bind="infoSheet" class="stats-info hidden">
            <div class="stats-info__panel">
                <div class="stats-info__head">
                    <span bind="infoTitle" class="stats-info__title"></span>
                    <button bind="infoDone" class="stats-info__done" type="button">Done</button>
                </div>
                <div bind="infoCards" class="stats-info__cards"></div>
            </div>
        </div>`,yt=b(`
    <div class="stats-info__card">
        <span bind="ctitle" class="stats-info__card-title"></span>
        <span bind="ctext" class="stats-info__card-text"></span>
    </div>
`),ls='<button bind="infoTrigger" class="stats__info" type="button"></button>',ds=`
        /* A ghost link, quiet enough that it never competes with the section
           title it sits beside. */
        .stats__info {
            ${S()}
            flex: none;
            padding: 0;
            font-family: inherit; font-size: 0.78rem; font-weight: 600;
            background: transparent; border: none;
            color: ${l("text-muted")};
            text-decoration: underline;
            cursor: pointer;
        }
        /* Heading and its explainer trigger share one row: the trigger is an
           aside to the heading, not a control of its own rank.
           The h2 margin reset here is the FLOOR, at specificity (0,1,1). A host
           that styles its headings through a nested section rule — the dashboard
           and the per-round view both do — outranks it and must repeat the reset
           inside its own nesting; grep ".stats__sechead h2" to find them. */
        .stats__sechead {
            display: flex; align-items: baseline; justify-content: space-between;
            gap: ${a("md")};
            & h2 { margin-bottom: 0; }
        }
        .stats-info {
            position: fixed; inset: 0; z-index: 55;
            display: flex; align-items: flex-end; justify-content: center;
            background: rgba(0, 0, 0, 0.45);
            &.hidden { display: none; }
        }
        .stats-info__panel {
            width: 100%; max-width: 480px; max-height: 82dvh;
            overflow-y: auto;
            background: ${l("surface")};
            border-radius: ${l("radius")} ${l("radius")} 0 0;
            padding: ${a("md")} ${a("lg")} ${a("xl")};
            display: flex; flex-direction: column; gap: ${a("sm")};
        }
        .stats-info__head {
            display: flex; align-items: center; justify-content: space-between;
            gap: ${a("md")};
            & .stats-info__title {
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.15rem;
                color: ${l("text")};
            }
            & .stats-info__done {
                ${S()}
                flex: none;
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.85rem; font-weight: 700;
                background: transparent; border: none;
                color: ${l("text-muted")};
                cursor: pointer;
            }
        }
        .stats-info__cards { display: flex; flex-direction: column; gap: ${a("sm")}; }
        .stats-info__card {
            display: flex; flex-direction: column; gap: 3px;
            border: 1px solid ${l("border")}; border-radius: ${l("radius")};
            padding: ${a("md")};
            & .stats-info__card-title {
                font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${l("text-muted")};
            }
            & .stats-info__card-text { font-size: 0.9rem; color: ${l("text")}; line-height: 1.45; }
        }
`;function Kr(s,e,t=""){const n=t?`info-dot ${t}`:"info-dot";return`<button bind="${s}" class="${n}" type="button" aria-label="${e}"><span aria-hidden="true">i</span></button>`}const Wr=`
        .info-dot {
            flex: none;
            appearance: none;
            width: 22px; height: 22px; padding: 0;
            display: inline-flex; align-items: center; justify-content: center;
            background: none; cursor: pointer;
            border: 1px solid ${l("border")}; border-radius: ${l("radius-pill")};
            color: ${l("text-muted")};
            font-size: 0.8rem; font-style: italic; font-family: serif;
            line-height: 1;
            &:hover { color: ${l("text")}; }
            &.hidden { display: none; }
        }`,Ne=60,ti=8,Vs=4,gh=Array.from({length:Vs*2+1},(s,e)=>e-Vs),bh="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",yh=b(`
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
                <div class="se-stats__explain">
                    <button bind="statExplain" class="se-stats__explain-btn" type="button"></button>
                </div>
                <div bind="statsBody" class="se-stats__body"></div>
                <div class="se-stats__foot">
                    <button bind="statsNext" class="se-stats__next" type="button"></button>
                </div>
                ${bt}
            </div>
        </div>

        <div bind="hcpModal" class="se-hcp hidden">
            <div class="se-hcp__panel">
                <div class="se-hcp__head">
                    <span bind="hcpTitle" class="se-hcp__title"></span>
                    <button bind="hcpClose" class="se-hcp__close" type="button" aria-label="Close">✕</button>
                </div>
                <span bind="hcpFormat" class="se-hcp__format"></span>
                <div bind="hcpSteps" class="se-hcp__steps"></div>
                <div class="se-hcp__foot">
                    <span class="se-hcp__foot-label">Plays off</span>
                    <span bind="hcpEff" class="se-hcp__eff"></span>
                </div>
            </div>
        </div>

        <div bind="toast" class="se-toast hidden"></div>
    </div>
`),_h=b(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),si=b(`
    <div class="se-row">
        <div class="se-row__who">
            <span bind="name" class="se-row__name"></span>
            <span class="se-row__hcpline">
                <span bind="hcp" class="se-row__hcp"></span>
                ${Kr("hcpInfo","How this handicap was calculated","hidden")}
            </span>
        </div>
        <span bind="topar" class="se-row__topar"></span>
        <div class="se-row__scores">
            <span class="se-row__slot"><span bind="prev" class="se-row__prev"></span></span>
            <span class="se-row__slot"><button bind="circle" class="se-row__circle" type="button"><span bind="cval"></span></button></span>
        </div>
    </div>
`),vh=b(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),wh=b(`
    <div class="se-hcp__card">
        <div class="se-hcp__card-body">
            <span bind="ctitle" class="se-hcp__card-title"></span>
            <span bind="ctext" class="se-hcp__card-text"></span>
            <span bind="cmath" class="se-hcp__card-math"></span>
        </div>
        <span bind="cresult" class="se-hcp__card-result"></span>
    </div>
`),ni=b(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),xh=b(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`),kh=b(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div bind="seg" class="se-stats__seg"></div>
        <span bind="gnote" class="se-stats__note hidden"></span>
    </div>
`),$h=b('<button bind="btn" class="se-seg" type="button"></button>'),ii=b(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__step">
            <button bind="minus" class="se-stats__step-btn" type="button">−</button>
            <span bind="val" class="se-stats__step-val"></span>
            <button bind="plus" class="se-stats__step-btn" type="button">+</button>
        </div>
    </div>
`),Sh=b('<div bind="rule" class="se-stats__rule"></div>');class Th extends M{static styles=`
        .se {
            margin-top: ${a("xl")};
            &.hidden { display: none; }

            /* Score entry is tapped fast and repeatedly: the circle in a row,
               then keys on the pad. Two taps inside the double-tap window are
               scoring, never a zoom request, so drop double-tap-to-zoom for
               this subtree (descendants intersect with their ancestors'
               touch-action, so the fixed-position keypad and stats screens
               inherit it too). Pinch-to-zoom is untouched here and everywhere
               else — the leaderboard still zooms, which some players want. */
            touch-action: manipulation;
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
            right: ${ti}px;
            width: ${Ne*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-Vs*Ne}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${Ne}px;
            width: ${Ne}px;
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

            /* The name block takes the slack so the to-par sits right up
               against the fixed-width score columns; min-width:0 is what lets
               a long name ellipsis instead of pushing the numbers off-row. */
            & .se-row__who { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 auto; }
            & .se-row__name {
                font-family: ${l("font-display")};
                font-weight: 600;
                font-size: 1.05rem;
                color: ${l("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            /* What the ball plays off, quiet under the name (same chain as the
               keypad list rows). Absent — not blanked — when there is no
               handicap to state. */
            & .se-row__hcpline {
                display: flex; align-items: center; gap: 2px; min-width: 0;
            }
            & .se-row__hcp {
                font-size: 0.75rem;
                color: ${l("text-muted")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            /* The ⓘ behind the handicap: the shared dot (app/info-dot.ts),
               scaled down to caption size but keeping the 22px box for thumb
               room — the row around it is not a control on the web (only the
               circle is), so it needs no propagation guard. */
            & .info-dot {
                font-size: 0.65rem;
                transform: scale(0.72); transform-origin: center;
            }
            /* Gamebook puts the standing where the eye lands: its own column
               between the name and the scores, in the display face at score
               size, tinted by tone. A match standing ("2 UP") is words, not a
               scalar — slightly smaller so four glyphs don't out-shout the
               scores. */
            & .se-row__topar {
                flex-shrink: 0;
                text-align: right;
                font-family: ${l("font-display")};
                font-weight: 700;
                font-size: 1.35rem;
                font-variant-numeric: tabular-nums;
            }
            & .se-row__topar--match { font-size: 1.05rem; }

            & .se-row__scores { display: flex; align-items: center; padding-right: ${ti}px; flex-shrink: 0; }
            & .se-row__slot { width: ${Ne}px; display: flex; align-items: center; justify-content: center; }
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
                /* Handicap hint in an unscored circle ("-1"/"0"/"+1") — smaller
                   and quieter than a real score, so it reads as a preview. */
                &.hint { font-size: 0.95rem; opacity: 0.8; }
            }
            /* Phase 5.5 — unclaimed placeholder seat: muted label, inert circle. */
            & .se-row__name--pending { color: ${l("text-muted")}; font-style: italic; }
            & .se-row__circle--pending { cursor: default; opacity: 0.55; &:active { background: ${l("surface-sunken")}; } }
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
            /* Handicap hint in an unscored circle — faint, Gamebook-style. */
            & .se-mrow__val--hint { opacity: 0.55; font-size: 1rem; }
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
                /* content-box, so the 8px sides ADD to the 44px minimum the way
                   iOS stacks them — .frame(minWidth: 44) then .padding(.horizontal)
                   outside it (ScoreKeypadView.swift:581-583). Under the app's
                   border-box default a one-digit score collapses to 44x44 and
                   reads as a circle instead of a capsule. */
                box-sizing: content-box;
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

            /* The one line of dynamic text on the card: what the scorecard is
               about to fill in, or that it disagrees with what is stored. Never
               a nudge, never a validation message (§3.5). */
            & .se-stats__note {
                text-align: center; font-size: 0.8rem; line-height: 1.35;
                color: rgba(255, 255, 255, 0.55);
                &.warn { color: ${l("danger")}; }
                &.hidden { display: none; }
            }

            /* One worded trigger for the whole step, quiet enough that it reads
               as an aside to the player's name above it. */
            & .se-stats__explain { display: flex; justify-content: center; padding: 0 ${a("lg")}; }
            & .se-stats__explain-btn {
                padding: 0; border: none; background: transparent; cursor: pointer;
                font-family: inherit; font-size: 0.78rem; font-weight: 600;
                color: rgba(255, 255, 255, 0.55);
                text-decoration: underline;
            }

            /* Hairline between the format's own toggles (what the round needs to
               score) and the player's own stats (what they asked to track). */
            & .se-stats__rule {
                height: 1px; background: rgba(255, 255, 255, 0.08);
                margin: 0 ${a("xl")};
            }

            /* Stepper prompts (putts, penalties): the 10+ pad's round ± at a
               slightly smaller size, sharing its palette. */
            & .se-stats__step {
                display: flex; align-items: center; justify-content: center; gap: ${a("xl")};
            }
            & .se-stats__step-btn {
                width: 52px; height: 52px; border-radius: 999px; border: none; cursor: pointer;
                background: #2a2a2a; color: #fff; font-size: 1.6rem; line-height: 1;
                font-family: inherit;
                &:active { background: #3a3a3a; }
            }
            & .se-stats__step-val {
                width: 72px; text-align: center;
                font-family: ${l("font-display")}; font-weight: 700; font-size: 2.1rem;
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
                &.on-hit { background: ${l("primary")}; border-color: ${l("primary")}; color: #fff; }
                &.on-miss { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.45); color: #fff; }
                /* Selected STAT segment: neutral, not green — a stat is an
                   observation, and the plate should not congratulate or scold
                   one. Same paint as on-miss, different meaning. */
                &.on-neutral { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.45); color: #fff; }
                /* Four or five options (first putt) have to fit a 375px plate. */
                &.tight { padding: 18px 4px; font-size: 0.9rem; }
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

        /* The handicap-derivation dialog: a dimmed backdrop with a bottom
           sheet (mobile-first, like the keypad), one card per step, the
           effective PH as the loud closing line. */
        .se-hcp {
            position: fixed; inset: 0; z-index: 55;
            display: flex; align-items: flex-end; justify-content: center;
            background: rgba(0, 0, 0, 0.45);
            &.hidden { display: none; }
        }
        .se-hcp__panel {
            width: 100%; max-width: 480px; max-height: 82dvh;
            overflow-y: auto;
            background: ${l("surface")};
            border-radius: ${l("radius")} ${l("radius")} 0 0;
            padding: ${a("md")} ${a("lg")} ${a("xl")};
            display: flex; flex-direction: column; gap: ${a("sm")};
        }
        .se-hcp__head {
            display: flex; align-items: center; justify-content: space-between;
            & .se-hcp__title {
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.15rem;
                color: ${l("text")};
            }
            & .se-hcp__close {
                background: none; border: none; color: ${l("text-muted")};
                font-size: 1.1rem; width: 40px; height: 40px; border-radius: 999px;
                cursor: pointer; flex: none;
            }
        }
        .se-hcp__format {
            font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
            text-transform: uppercase; color: ${l("text-muted")};
        }
        .se-hcp__steps { display: flex; flex-direction: column; gap: ${a("sm")}; }
        .se-hcp__card {
            display: flex; align-items: flex-start; gap: ${a("md")};
            border: 1px solid ${l("border")}; border-radius: ${l("radius")};
            padding: ${a("md")};
            & .se-hcp__card-body {
                display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1;
            }
            & .se-hcp__card-title {
                font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${l("text-muted")};
            }
            & .se-hcp__card-text { font-size: 0.9rem; color: ${l("text")}; }
            & .se-hcp__card-math {
                font-size: 0.75rem; color: ${l("text-muted")};
                &[hidden] { display: none; }
            }
            & .se-hcp__card-result {
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.1rem;
                font-variant-numeric: tabular-nums; color: ${l("text")};
            }
        }
        .se-hcp__foot {
            display: flex; align-items: center; gap: ${a("sm")};
            padding-top: ${a("xs")};
            & .se-hcp__foot-label { font-size: 0.9rem; font-weight: 600; color: ${l("text")}; }
            & .se-hcp__eff {
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.35rem;
                font-variant-numeric: tabular-nums; color: ${l("accent")};
            }
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

        /* The capture explainer sheet.
           It reuses the SG sheet's ANATOMY (SG_INFO_SHEET_MARKUP and its class
           names) but not SG_INFO_STYLES, which is written for a themed
           dashboard: that block's t('surface') panel would sit as a pale slab
           on this screen, which is hardcoded dark (#121212) and stays dark in
           both themes because a phone held up in sunlight is what it is
           designed for. It also carries .stats__info and .stats__sechead, a
           trigger and a heading row this screen does not have — the capture
           card's trigger is .se-stats__explain-btn.
           NESTED UNDER .se-stats ON PURPOSE: these styles are injected
           globally, and an unscoped .stats-info here would repaint the
           dashboard's sheet, which must keep the themed look. */
        .se-stats {
            & .stats-info {
                position: fixed; inset: 0; z-index: 61;
                display: flex; align-items: flex-end; justify-content: center;
                background: rgba(0, 0, 0, 0.6);
                &.hidden { display: none; }
            }
            & .stats-info__panel {
                width: 100%; max-width: 480px; max-height: 82dvh;
                overflow-y: auto;
                background: #1c1c1c; color: #fff;
                border-radius: ${l("radius")} ${l("radius")} 0 0;
                padding: ${a("md")} ${a("lg")} ${a("xl")};
                display: flex; flex-direction: column; gap: ${a("sm")};
            }
            & .stats-info__head {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${a("md")};
            }
            & .stats-info__title {
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.15rem;
                color: #fff;
            }
            & .stats-info__done {
                flex: none;
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.85rem; font-weight: 700;
                background: transparent; border: none;
                color: rgba(255, 255, 255, 0.75);
                cursor: pointer;
                &:active { background: rgba(255, 255, 255, 0.1); border-radius: ${l("radius")}; }
            }
            & .stats-info__cards { display: flex; flex-direction: column; gap: ${a("sm")}; }
            & .stats-info__card {
                display: flex; flex-direction: column; gap: 3px;
                border: 1px solid rgba(255, 255, 255, 0.12); border-radius: ${l("radius")};
                padding: ${a("md")};
            }
            & .stats-info__card-title {
                font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
                text-transform: uppercase; color: rgba(255, 255, 255, 0.55);
            }
            & .stats-info__card-text {
                font-size: 0.9rem; color: rgba(255, 255, 255, 0.92); line-height: 1.45;
            }
        }
        ${Wr}
    `;svc=this.inject(ge);holeIdx=this.svc.holeIdx;modalOpen=this.svc.keypadOpen;currentBallIdx=new p(0);holeCompleteOnEntry=!1;extendedOpen=new p(!1);extendedScore=new p(10);statsOpen=new p(!1);explainOpen=new p(!1);pendingMeta=new p({});lastMetaKey=null;toastMsg=new p(null);hcpInfoBallId=new p(null);dragOffset=new p(0);transitioning=new p(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new T(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[Ve(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(n=>[n.id,n]));return e.ballIds.map(n=>t.get(n)).filter(n=>!!n)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>rn(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole());displayScore=e=>e===null?"–":String(e);hintText=(e,t)=>{const n=this.svc.strokesHintFor(e,t);return n===null?null:n===0?"0":n>0?`-${n}`:`+${-n}`};toParValue=e=>{let t=0,n=0,i=!1;for(const r of this.playedOrder()){const o=this.svc.strokesFor(e.id,r.playHoleId);o!==null&&o>0&&(t+=o,n+=this.parFor(r.playHoleId),i=!0)}return i?t-n:null};hcpLine=e=>{const t=this.ballsInGroup().find(o=>o.id===e);if(!t||t.pending)return null;const n=t.players.length>1?t.courseHandicap:t.players[0]?.courseHandicap??t.courseHandicap;if(n===null)return null;const i=t.players.length>1?`Team · HCP ${n}`:`HCP ${n}`,r=this.svc.effectivePlayingHandicap(t);return r!==null&&r!==n?`${i} → ${r}`:i};rowDerivation=e=>{const t=this.ballsInGroup().find(n=>n.id===e);return!t||t.pending?null:this.svc.presentedSlot(t)?.handicapDerivation??null};selectedFormatLabel=()=>{const e=this.svc.round.get()?.formatSlots.find(t=>t.slotDefId===this.svc.selectedSlotDefId());return e?pn(e):null};hcpCards=e=>{const t=this.selectedFormatLabel(),n=[];for(const i of e.steps)switch(i.kind){case"course_handicap":{const r=i.handicapIndex!==null&&i.slope!==null&&i.courseRating!==null&&i.par!==null,o=i.teeName?`the ${i.teeName} tees`:"these tees";n.push({title:`Course handicap · ${i.producerLabel}`,text:r?`Exact handicap ${i.handicapIndex}, adjusted for the difficulty of ${o}.`:`The handicap ${i.producerLabel} plays this course off.`,math:r?`${i.handicapIndex} × ${i.slope} ÷ 113 + (${i.courseRating} − ${i.par}), rounded — the World Handicap System formula.`:null,result:i.result});break}case"team_combination":n.push({title:"Team handicap",text:"The team plays off a share of each member's handicap.",math:`${i.parts.map(r=>`${r.pct}% of ${r.producerLabel}'s ${r.ch}`).join(" + ")}, rounded.`,result:i.result});break;case"allowance":i.pct!==100&&n.push({title:"Allowance",text:`${t??"This format"} is played at ${i.pct}% handicap.`,math:null,result:i.result});break;case"match_delta":n.push(i.ownPh===i.lowestPh?{title:"Match difference",text:"Lowest handicap in the match — plays off scratch, and the others get the difference.",math:null,result:i.result}:{title:"Match difference",text:"In match formats only the difference matters: the lowest ball plays off 0, this ball gets the rest.",math:`${i.ownPh} − ${i.lowestPh} = ${i.result}.`,result:i.result});break}return n};figureText=e=>{const t=this.svc.slotStandingFor(e);if(t===null){const n=this.toParValue(e);return n===null?"–":n===0?"E":n>0?`+${n}`:`${n}`}switch(t.kind){case"pace":{const n=t.delta;return n===0?"E":n>0?`+${n}`:`${n}`}case"total":return String(t.total);case"match":return t.text}};figureClass=e=>{const t=this.svc.slotStandingFor(e);let n,i=!1;if(t===null){const r=this.toParValue(e);n=r===null||r===0?"even":r<0?"under":"over"}else t.kind==="pace"?n=t.delta===0?"even":t.delta<0?"under":"over":t.kind==="total"?n="even":(n=t.tone,i=!0);return`se-row__topar ${n}${i?" se-row__topar--match":""}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const n=e-t;return n<=-4||n>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(n)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer),this.modalOpen.set(!1)}),this.track(C(()=>{const d=this.ballsInGroup().length;d>0&&this.currentBallIdx.get()>=d&&this.selectBall(0)}));const e=this.wire(yh,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1),this.svc.closeStatStep()}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const d=this.currentHole();return d?`Hole ${this.occLabel(d.playHoleId)} · Par ${this.parFor(d.playHoleId)}`:""},modalPrev:{onclick:()=>this.stepHole(-1),disabled:()=>!this.svc.canPrevHole()},modalNext:{onclick:()=>this.stepHole(1),disabled:()=>!this.svc.canNextHole()},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},hcpModal:{className:()=>this.hcpInfoBallId.get()!==null?"se-hcp":"se-hcp hidden",onclick:d=>{d.target===d.currentTarget&&this.hcpInfoBallId.set(null)}},hcpClose:{onclick:()=>this.hcpInfoBallId.set(null)},hcpTitle:()=>{const d=this.hcpInfoBallId.get(),c=d?this.ballsInGroup().find(u=>u.id===d):null;return c?this.ballName(c):""},hcpFormat:()=>this.selectedFormatLabel()??"",hcpEff:()=>{const d=this.hcpInfoBallId.get(),c=d?this.rowDerivation(d):null;return c?String(c.effectivePh):""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>{this.statsOpen.set(!1),this.explainOpen.set(!1),this.svc.closeStatStep()}},statExplain:{textContent:De.explainerTrigger,onclick:()=>this.explainOpen.set(!0)},infoSheet:{className:()=>this.explainOpen.get()?"stats-info":"stats-info hidden",onclick:d=>{d.target===d.currentTarget&&this.explainOpen.set(!1)}},infoTitle:{textContent:De.explainerTitle},infoDone:{onclick:()=>this.explainOpen.set(!1)},statsHole:()=>{const d=this.currentHole();return d?`Hole ${this.occLabel(d.playHoleId)} · Par ${this.parFor(d.playHoleId)}`:""},statsTitle:()=>{const d=this.ballsInGroup()[this.currentBallIdx.get()];return d?this.ballName(d):""},statsScore:()=>{const d=this.ballsInGroup()[this.currentBallIdx.get()],c=this.currentHole();return!d||!c?"":this.displayScore(this.svc.strokesFor(d.id,c.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.explainOpen.set(!1),this.svc.closeStatStep(),this.apply({kind:"statsDone"})}}}),t=this.ref(e,"viewport"),n=this.ref(e,"track");this.bindCarouselPointer(t,n),this.track(C(()=>{n.style.transition=this.transitioning.get()?bh:"none",n.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(n,new T(()=>gh),(d,c,u)=>this.holeItem(d,u),d=>d),this.$each(this.ref(e,"rows"),new T(()=>{const d=this.playedOrder(),c=this.holeIndex(),u=d[c];if(!u)return[];const h=c>0?d[c-1].playHoleId:null;return this.ballsInGroup().map(f=>({ball:f,ph:u.playHoleId,prevPh:h}))}),(d,c,u)=>this.playerRow(d.ball,d.ph,d.prevPh,u),d=>`${d.ball.id}|${d.ph}|${d.ball.pending}`),this.$each(this.ref(e,"hcpSteps"),new T(()=>{const d=this.hcpInfoBallId.get(),c=d?this.rowDerivation(d):null;return c?this.hcpCards(c):[]}),(d,c,u)=>this.wireEl(wh,{ctitle:{textContent:d.title},ctext:{textContent:d.text},cmath:{textContent:d.math??"",hidden:d.math===null},cresult:{textContent:String(d.result)}},u),(d,c)=>`${c}|${d.title}|${d.result}`),this.$each(this.ref(e,"modalList"),new T(()=>this.ballsInGroup()),(d,c,u)=>this.modalRow(d,c,u),d=>d.id);const i=this.ref(e,"keys");for(const d of[1,2,3,4,5,6,7,8,9])i.appendChild(this.numberKey(d));i.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),i.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),i.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(e,"statsBody"),new T(()=>this.statBodyRows()),(d,c,u)=>this.statBodyRow(d,u),d=>d.key),this.$each(this.ref(e,"infoCards"),new T(()=>this.statExplainerCards()),(d,c,u)=>this.wireEl(yt,{ctitle:{textContent:d.title},ctext:{textContent:d.text}},u),d=>d.key),this.track(C(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null,this.svc.seedStatStep(null);return}const d=this.ballsInGroup()[this.currentBallIdx.get()],c=this.currentHole();if(!d||!c)return;this.seedStatStepForCursor();const u=`${d.id}|${c.playHoleId}`;if(u===this.lastMetaKey)return;this.lastMetaKey=u;const h={};for(const f of this.metaInputs()){const m=this.svc.metadataFor(d.id,c.playHoleId,f.key);f.kind==="number"?typeof m=="number"&&(h[f.key]=m):h[f.key]=m===!0}this.pendingMeta.set(h)}));const r=()=>{document.visibilityState==="hidden"&&this.svc.flushStats()},o=()=>this.svc.flushStats();return document.addEventListener("visibilitychange",r),window.addEventListener("pagehide",o),this.track(()=>{document.removeEventListener("visibilitychange",r),window.removeEventListener("pagehide",o),this.svc.closeStatStep()}),e}holeItem(e,t){return this.wireEl(_h,{item:{className:()=>{const n=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${n?" gone":""}`}},hnum:{textContent:()=>{const n=this.occAtOffset(e);return n?this.occLabel(n.playHoleId):""}},hpar:{textContent:()=>{const n=this.occAtOffset(e);return n?`Par ${this.parFor(n.playHoleId)}`:""}}},t)}playerRow(e,t,n,i){return e.pending?this.wireEl(si,{name:{textContent:this.ballName(e),className:"se-row__name se-row__name--pending"},hcp:{textContent:"open seat"},topar:{textContent:"",className:"se-row__topar"},prev:{textContent:""},cval:{textContent:"–"},circle:{className:"se-row__circle empty se-row__circle--pending"}},i):this.wireEl(si,{name:{textContent:this.ballName(e)},hcp:{textContent:()=>this.hcpLine(e.id)??"",hidden:()=>this.hcpLine(e.id)===null},hcpInfo:{className:()=>this.rowDerivation(e.id)!==null?"info-dot":"info-dot hidden",onclick:()=>this.hcpInfoBallId.set(e.id)},topar:{textContent:()=>this.figureText(e),className:()=>this.figureClass(e)},prev:{textContent:()=>n?this.displayScore(this.svc.strokesFor(e.id,n)):""},cval:{textContent:()=>{const r=this.svc.strokesFor(e.id,t);return r!==null?this.displayScore(r):this.hintText(e.id,t)??"–"}},circle:{className:()=>this.svc.strokesFor(e.id,t)!==null?"se-row__circle":this.hintText(e.id,t)!==null?"se-row__circle empty hint":"se-row__circle empty",onclick:()=>this.openModalForBall(e.id)}},i)}modalRow(e,t,n){const i=()=>{if(e.pending)return"Open seat — claim to score";const r=e.players.length>1?e.courseHandicap:e.players[0]?.courseHandicap??e.courseHandicap,o=r===null?"–":String(r),d=e.players.length>1?`Team · HCP ${o}`:`HCP ${o}`,c=this.svc.effectivePlayingHandicap(e);return r!==null&&c!==null&&c!==r?`${d} → ${c}`:d};return this.wireEl(vh,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.selectBall(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:i},mval:{textContent:()=>{const r=this.currentHole();if(!r)return"–";const o=this.svc.strokesFor(e.id,r.playHoleId);return o!==null?this.displayScore(o):this.hintText(e.id,r.playHoleId)??"–"},className:()=>{const r=this.currentHole();return!!r&&this.svc.strokesFor(e.id,r.playHoleId)===null&&!!r&&this.hintText(e.id,r.playHoleId)!==null?"se-mrow__val se-mrow__val--hint":"se-mrow__val"}}},n)}numberKey(e){return this.wireEl(ni,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,n,i){return this.wireEl(ni,{key:{className:n,onclick:i},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(n=>n.id===e);this.selectBall(t<0?0:t),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.noteHoleEntered(),this.modalOpen.set(!0)}selectBall(e){this.currentBallIdx.set(e),this.seedStatStepForCursor()}seedStatStepForCursor(){const e=this.ballsInGroup()[this.currentBallIdx.get()],t=this.currentHole(),n=e?this.svc.statSubject(e):null;this.svc.seedStatStep(n&&t?{playerId:n,playHoleId:t.playHoleId}:null)}advanceState(){const e=this.currentHole();return{balls:this.ballsInGroup().map(t=>({pending:!!t.pending,scored:!!e&&this.svc.strokesFor(t.id,e.playHoleId)!==null})),currentBallIndex:this.currentBallIdx.get(),currentHole:e?{id:e.playHoleId,label:this.occLabel(e.playHoleId)}:null,holeIndex:this.holeIndex(),holeCount:this.playedOrder().length,holeCompleteOnEntry:this.holeCompleteOnEntry,collectsStats:this.metaInputs().length>0||this.svc.statPrompts().length>0}}noteHoleEntered(){this.holeCompleteOnEntry=uh(this.advanceState())}stepHole(e){this.advanceTimer&&(clearTimeout(this.advanceTimer),this.advanceTimer=null),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.svc.closeStatStep(),e<0?this.svc.prevHole():this.svc.nextHole(),this.selectBall(0),this.noteHoleEntered()}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){this.apply({kind:"score",value:e})}apply(e){this.execute(ph(this.advanceState(),e))}execute(e){const t=e.write;if(t){const i=this.ballsInGroup()[t.ballIndex];i&&this.svc.setScore(i.id,t.holeId,t.value,t.withMetadata?this.metaSnapshot():void 0)}const n=e.move;switch(n.kind){case"noop":case"stay":return;case"moveToBall":this.selectBall(n.ballIndex);return;case"openStats":this.statsOpen.set(!0);return;case"roundComplete":this.modalOpen.set(!1),this.svc.finishFlowOpen.set(!0);return;case"holeComplete":{this.flash(n.toast),this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===n.fromHoleId&&(this.holeIdx.set(Ve(n.toHoleIndex,this.playedOrder().length)),this.selectBall(0),this.noteHoleEntered(),this.modalOpen.set(!1))},n.delayMs);return}}}hasMoreUnscored=()=>{const e=this.currentHole();return hh({balls:this.ballsInGroup().map(t=>({pending:!!t.pending,scored:!!e&&this.svc.strokesFor(t.id,e.playHoleId)!==null})),currentBallIndex:this.currentBallIdx.get(),currentHole:e?{id:e.playHoleId}:null})};metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),n={};for(const i of e)if(i.kind==="number"){const r=t[i.key];n[i.key]=typeof r=="number"?r:null}else n[i.key]=t[i.key]===!0;return n}setMeta(e,t){const n=this.pendingMeta.get();this.pendingMeta.set({...n,[e]:t});const i=this.ballsInGroup()[this.currentBallIdx.get()],r=this.currentHole();if(!i||!r)return;const o=this.svc.strokesFor(i.id,r.playHoleId);o!==null&&this.svc.setScore(i.id,r.playHoleId,o,this.metaSnapshot())}metaChip(e,t){return e.kind==="number"?this.metaStepper(e,t):this.wireEl(xh,{glabel:{textContent:e.label},miss:{className:()=>this.pendingMeta.get()[e.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(e.key,!1)},hit:{className:()=>this.pendingMeta.get()[e.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(e.key,!0)}},t)}metaStepper(e,t){const n=e.min??0,i=e.max??null,r=()=>{const d=this.pendingMeta.get()[e.key];return typeof d=="number"?d:null},o=d=>{const c=Math.min(i??1/0,Math.max(n,(r()??n)+d));this.setMeta(e.key,c)};return this.wireEl(ii,{glabel:{textContent:e.label},minus:{onclick:()=>o(-1),"aria-label":`Fewer ${e.label}`},plus:{onclick:()=>o(1),"aria-label":`More ${e.label}`},val:{textContent:()=>zn(r()??n,i),className:()=>r()===null?"se-stats__step-val unanswered":"se-stats__step-val","aria-label":()=>r()===null?`${e.label} not answered`:`${e.label} ${r()}`}},t)}metaInputsForStep=()=>{const e=new Set(this.svc.statPrompts().map(t=>t.key));return this.metaInputs().filter(t=>!e.has(t.key))};statBodyRows=()=>{const e=this.metaInputsForStep(),t=this.svc.statPrompts(),n=e.map(i=>({kind:"meta",key:`meta:${i.key}`,input:i}));e.length>0&&t.length>0&&n.push({kind:"rule",key:"rule"});for(const i of t)n.push({kind:"stat",key:`stat:${i.key}`,prompt:i});return n};statBodyRow(e,t){return e.kind==="meta"?this.metaChip(e.input,t):e.kind==="rule"?this.wireEl(Sh,{},t):e.prompt.control.kind==="segments"?this.statSegments(e.prompt,t):this.statStepper(e.prompt,t)}statSegments(e,t){const n=e.control,i=n.kind==="segments"?n.options:[],r=i.length>=4?" tight":"",o=this.wireEl(kh,{glabel:{textContent:e.label},gnote:{textContent:()=>e.key==="gir"?this.girNote():"",className:()=>e.key==="gir"&&this.girNote()!==""?`se-stats__note${this.svc.statGirState().state==="disagree"?" warn":""}`:"se-stats__note hidden"},seg:{role:"group","aria-label":()=>e.key==="gir"?this.girAria():e.label}},t),d=this.ref(o,"seg");for(const c of i){const u=this.wireEl($h,{btn:{textContent:c.label,className:()=>`se-seg${r}${this.svc.statValue(e.key)===c.value?" on-neutral":""}`,onclick:()=>this.answerStat(e.key,this.svc.statValue(e.key)===c.value?null:c.value)}},t);d?.appendChild(u)}return o}statStepper(e,t){const n=e.control,i=n.kind==="stepper"?n.min:0,r=n.kind==="stepper"?n.max:null;return this.wireEl(ii,{glabel:{textContent:e.label},minus:{onclick:()=>this.stepStat(e.key,-1),"aria-label":`Fewer ${e.label}`},plus:{onclick:()=>this.stepStat(e.key,1),"aria-label":`More ${e.label}`},val:{textContent:()=>zn(this.svc.statStepperValue(e.key,i),r),className:()=>this.svc.statIsAnswered(e.key)?"se-stats__step-val":"se-stats__step-val unanswered","aria-label":()=>this.svc.statIsAnswered(e.key)?`${e.label} ${this.svc.statStepperValue(e.key,i)}`:`${e.label} not answered`}},t)}girNote(){const e=this.svc.statGirState();return e.state==="pending"?De.girPending:e.state==="disagree"?e.derived==="1"?De.girDisagreeHit:De.girDisagreeMiss:""}girAria(){const e=this.svc.statGirState();return e.state==="pending"?De.girPendingAria:e.state==="disagree"?`${Ls("gir")}, ${e.stored==="1"?"Hit":"Miss"}, your score disagrees`:Ls("gir")}statExplainerCards(){return this.svc.statPrompts().map(e=>({key:e.key,title:e.label,text:mh(e.key)}))}answerStat(e,t){this.svc.answerStat(e,t),this.mirrorStatToMeta(e)}stepStat(e,t){this.svc.stepStat(e,t),this.mirrorStatToMeta(e)}mirrorStatToMeta(e){const t=this.metaInputs().find(i=>i.key===e);if(!t)return;const n=this.svc.statValue(e);if(n!==null){if(t.kind==="number"){const i=Number(n);Number.isInteger(i)&&this.setMeta(e,i);return}this.setMeta(e,n==="1")}}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*Ne),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(Ve(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",i=>{i.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",i=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:i.pointerId,startX:i.clientX,startY:i.clientY,lastX:i.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(i.pointerId))}),e.addEventListener("pointermove",i=>{const r=this.ptr;if(!r||r.id!==i.pointerId)return;const o=i.clientX-r.startX,d=i.clientY-r.startY;if(!r.horiz){if(Math.abs(d)>Math.abs(o)&&Math.abs(d)>8||Math.abs(o)<=8)return;r.horiz=!0}const c=Date.now(),u=Math.max(1,c-r.lastTime);r.velocity=(i.clientX-r.lastX)/u,r.lastX=i.clientX,r.lastTime=c,this.dragOffset.set(o)});const n=i=>{const r=this.ptr;if(!r||r.id!==i.pointerId)return;const o=i.clientX-r.startX,d=r.horiz;if(this.ptr=null,e.releasePointerCapture?.(i.pointerId),!d){this.dragOffset.set(0);return}this.snap(Dl({dragDistance:o,velocity:r.velocity,itemWidth:Ne}))};e.addEventListener("pointerup",n),e.addEventListener("pointercancel",i=>{!this.ptr||this.ptr.id!==i.pointerId||(this.ptr=null,e.releasePointerCapture?.(i.pointerId),this.snap(0))})}}function Ph(s,e){const t=[...s].sort((r,o)=>r.canonicalOrdinal-o.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(r=>r.playHoleId))}];const n=[...e].sort((r,o)=>r.fromCanonicalOrdinal-o.fromCanonicalOrdinal),i=[];for(const r of n){const o=t.filter(d=>d.canonicalOrdinal>=r.fromCanonicalOrdinal&&d.canonicalOrdinal<=r.toCanonicalOrdinal);o.length!==0&&i.push({label:r.label,holes:o,playHoleIds:new Set(o.map(d=>d.playHoleId))})}return i}function Yr(s,e){const t=s.cells.filter(n=>e.has(n.playHoleId));if(s.aggregate==="sum"){const n=t.map(i=>i.value).filter(i=>i!==null);return n.length===0?"—":String(n.reduce((i,r)=>i+r,0))}if(s.aggregate==="last"){for(let n=t.length-1;n>=0;n--){const i=t[n].value;if(i!==null)return Number.isInteger(i)?String(i):i.toFixed(1)}return"—"}return"—"}function Ch(s,e){if(s.aggregate==="sum"){const t=s.cells.map(n=>n.value).filter(n=>n!==null);return t.length===0?"—":String(t.reduce((n,i)=>n+i,0))}if(s.aggregate==="last"){const t=e[e.length-1];return t?Yr(s,t.playHoleIds):"—"}return"—"}function Ih(s){const e=s?.marker;if(e){const t=e.tone;return{kind:"marker",template:e.template,tone:t==="success"||t==="warning"||t==="danger"?t:null,label:e.label?e.label:null,teamFill:s?.team??null}}return s?.team?{kind:"pill",team:s.team}:{kind:"plain"}}function Eh(s){return s.filter(e=>!(e.startsWith("slot #")||/^HCP -?\d/.test(e)||/^PH -?\d/.test(e)))}const qt=" & ";function Xr(s){return s.componentId??"default-score-grid"}function mn(s,e,t,n={}){const i=Ph(s.holes,e),r=n.mode??"product",o=s.rows.map(d=>{const c=new Map(d.cells.map(u=>[u.playHoleId,u]));return{kind:d.kind,emphasis:d.emphasis===!0,team:d.team??null,subjectName:d.subjectBallId?t(d.subjectBallId):null,labelText:d.label,groups:i.map(u=>({cells:u.holes.map(h=>{const f=c.get(h.playHoleId);return{text:f?.display??"",title:f?.title?f.title:null,decoration:Ih(f)}}),subtotal:Yr(d,u.playHoleIds)})),total:Ch(d,i)}});return{componentId:Xr(s),subjectBallIds:[...s.subjectBallIds],title:{groups:s.title.groups.map(d=>d.map(c=>t(c))),joiner:s.title.joiner,nameJoiner:qt},subtitleFacts:r==="verification"?[...s.subtitleFacts]:Eh(s.subtitleFacts),footnotes:[...s.footnotes],caption:s.caption??null,totals:s.totals.map(d=>({label:d.label,value:String(d.value??"—")})),columnGroups:i.map(d=>({label:d.label,columns:d.holes.map(c=>({label:c.occurrenceLabel}))})),hasTotalColumn:i.length>1,rows:o}}function Ps(s){return[...new Set(s)].sort().join("\0")}function Rh(s,e){const t=new Map;e.forEach((i,r)=>{if(i.ballIds.length===0)return;const o=Ps(i.ballIds);t.set(o,t.has(o)?null:r)});const n=new Map;for(const i of s){if(i.subjectBallIds.length===0)continue;const r=Ps(i.subjectBallIds);n.set(r,(n.get(r)??0)+1)}return s.map(i=>{if(i.subjectBallIds.length===0)return{kind:"standalone"};const r=Ps(i.subjectBallIds);if((n.get(r)??0)!==1)return{kind:"standalone"};const o=t.get(r);return o==null?{kind:"standalone"}:{kind:"attached",entryIndex:o}})}function Nh(s,e){const t=new Set(s.map(e));return t.size!==1?null:[...t][0]??null}function Oh(s,e){if(s===void 0)return null;const t=e==="high"?-s:s;return{text:t===0?"E":t>0?`+${t}`:`−${Math.abs(t)}`,tone:t===0?"even":t>0?"over":"under"}}const Hh=()=>null;function Mh(s,e,t=Hh){return{kind:"ranked",metricLabel:s.metricLabel,hasPace:s.entries.some(n=>n.paceDelta!==void 0),entries:s.entries.map(n=>({position:n.position,lead:n.position===1,name:n.ballIds.map(e).join(qt),group:Nh(n.ballIds,t),total:String(n.total??"—"),holesPlayed:n.holesPlayed,pace:Oh(n.paceDelta,s.direction)}))}}function Ah(s,e){return{kind:"match_summary",title:s.title,matches:s.matches.map(t=>({sideAName:t.sideA.ballIds.map(e).join(qt),sideBName:t.sideB.ballIds.map(e).join(qt),leader:t.leader,standing:t.magnitude===0?"AS":t.finished&&t.closeOutRemaining!=null?`${t.magnitude} & ${t.closeOutRemaining}`:`${t.magnitude} UP`,status:t.finished?"Final":`thru ${t.thru}`}))}}function Us(s,e){return[s,...[...new Set(e)].sort()].join("|")}const Bh=new Map;function zh(s){const e=s.cards??[],t=(s.leaderboard??[]).find(o=>o.kind==="ranked")??null;if(!t)return{rankedSection:null,slotDefId:s.slotDefId,attached:Bh,standalone:[...e]};const n=Rh(e,t.entries),i=new Map,r=[];return e.forEach((o,d)=>{const c=n[d],u=c?.kind==="attached"?t.entries[c.entryIndex]:void 0;if(!u){r.push(o);return}i.set(Us(s.slotDefId,u.ballIds),o)}),{rankedSection:t,slotDefId:s.slotDefId,attached:i,standalone:r}}class Lh{open=new Set;isOpen(e){return this.open.has(e)}toggle(e){return this.set(e,!this.open.has(e))}set(e,t){return t?this.open.add(e):this.open.delete(e),t}keys(){return[...this.open].sort()}retain(e){const t=new Set(e);for(const n of[...this.open])t.has(n)||this.open.delete(n)}}const gn={ring:{meaning:"a single-unit decided result",fill:"#d63b2f",visual:"red filled circle — the Gamebook birdie mark (score to par −1)"},double_ring:{meaning:"a two-unit decided result; more emphatic than a ring",fill:"#e0862c",teamFillBorder:"border-width: 3px; border-style: double;",visual:"orange filled circle (score to par −2); doubled white border when team-filled"},diamond:{meaning:"a rare / high-magnitude decided result — the strongest form",fill:"#e0b41f",visual:"yellow filled circle — hole-in-one / albatross territory"},dot:{meaning:"a lightweight per-hole flag where a full ring would be too heavy",visual:"the bare base shape (no fill, no border) — inherits cell colour"},badge:{meaning:"a labelled status needing short text or a number, not just a shape",rule:["width: auto; min-width: 1.8em;","padding-left: 0.45em; padding-right: 0.45em;","border: 2px solid currentColor;"],tones:{success:"#267348",warning:"#946200",danger:"#9b332a"},visual:"outline pill in the tone colour, text inside"},square:{meaning:"a one-step negative score relation",fill:"#5b9bd5",boxy:!0,visual:"light-blue filled square (score to par +1)"},double_square:{meaning:"a stronger negative score relation",fill:"#1f4e79",boxy:!0,visual:"dark-blue filled square (score to par +2)"},box_badge:{meaning:"an angular labelled state that must not read as a round marker",fill:"#1f4e79",boxy:!0,visual:"dark-blue filled square carrying its value (+3 or worse)"}};function ht(s){return`lb-mark--${s}`}const nt=()=>Object.entries(gn);function Qr(s){return s.join(`
            `)}function Cs(s,e){return s.map((t,n)=>`& .${ht(t)}${n===s.length-1?` { ${e} }`:","}`)}function Fh(){const s=[];s.push("/* Outline forms keep currentColor + tone tints. */");for(const[r,o]of nt())if(!(!o.rule&&!o.tones)){if(o.rule){s.push(`& .${ht(r)} {`);for(const d of o.rule)s.push(`    ${d}`);s.push("}")}for(const[d,c]of Object.entries(o.tones??{}))s.push(`& .${ht(r)}.lb-mark-tone--${d} { color: ${c}; }`)}s.push("/* Filled forms — declared after the tone rules so white text wins. */");const e=nt().filter(([,r])=>r.boxy).map(([r])=>r),t=[],n=new Set;for(const[r,o]of nt()){if(o.fill===void 0||n.has(r))continue;const d=nt().filter(([,c])=>c.fill===o.fill).map(([c])=>c);for(const c of d)n.add(c);t.push({fill:o.fill,ids:d})}let i=-1;if(e.length>0){const r=t.findIndex(o=>o.ids.some(d=>gn[d].boxy));i=r===-1?t.length:r}return t.forEach((r,o)=>{o===i&&s.push(...Cs(e,"border-radius: 3px;")),s.push(...Cs(r.ids,`background: ${r.fill}; color: #fff;`))}),i===t.length&&s.push(...Cs(e,"border-radius: 3px;")),Qr(s)}function Gh(){const s=[];for(const[e,t]of nt()){if(!t.teamFillBorder)continue;const n=ht(e);s.push(`& .${n}.lb-mark-fill--a,`,`& .${n}.lb-mark-fill--b { ${t.teamFillBorder} }`)}return Qr(s)}const Jr=()=>null;function G(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function jh(s){return s.kind==="si"?"lb-c-si":s.kind==="given"?"lb-c-given":s.kind==="status"?"lb-c-status":s.kind==="category"?"lb-c-cat":""}function Dh(s){const e=[s.kind==="category"?"lb-r-cat":`lb-r-${s.kind}`];return(s.kind==="si"||s.kind==="given")&&e.push("lb-r-dim"),s.team&&e.push(`lb-team-${s.team}`),e.join(" ")}function qh(s,e,t){const n=s.title!==null?` title="${G(s.title)}"`:"",i=t(G(s.text)),r=s.decoration;let o;if(r.kind==="marker"){const d=r.tone?` lb-mark-tone--${r.tone}`:"",c=r.teamFill?` lb-mark-fill--${r.teamFill}`:"",u=r.label!==null?` title="${G(r.label)}" aria-label="${G(r.label)}"`:"";o=`<span class="lb-mark ${ht(r.template)}${d}${c}"${u}>${i}</span>`}else r.kind==="pill"?o=`<span class="lb-pill lb-pill--${r.team}">${i}</span>`:o=i;return`<td class="${jh(e)}"${n}>${o}</td>`}function bn(s,e){const t=f=>{const m=s.columnGroups[f],_=`<tr><th class="lb-rowlabel">Hole</th>${m.columns.map(v=>`<th>${G(v.label)}</th>`).join("")}<th class="lb-sum">${G(m.label)}</th></tr>`,g=s.rows.map(v=>{const k=ee=>v.emphasis?`<strong>${ee}</strong>`:ee,N=v.groups[f],B=N.cells.map(ee=>qh(ee,v,k)).join(""),U=`<td class="lb-sum">${k(N.subtotal)}</td>`,O=v.subjectName!==null?G(v.subjectName)+(v.labelText?" "+G(v.labelText):""):G(v.labelText);return`<tr class="${Dh(v)}"><th class="lb-rowlabel">${O}</th>${B}${U}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${_}</thead><tbody>${g}</tbody></table></div>`},n=s.columnGroups.map((f,m)=>t(m)).join(""),i=s.title.groups.map(f=>f.map(m=>G(m)).join(s.title.nameJoiner)).filter(Boolean).join(s.title.joiner),r=s.subtitleFacts.length?`<div class="lb-card__sub">${s.subtitleFacts.map(G).join(" · ")}</div>`:"",o=e.mode==="verification"&&s.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${s.footnotes.map(f=>`<span class="lb-card__note">${G(f)}</span>`).join("")}</div>`:"",d=e.mode==="verification"&&s.caption?`<p class="lb-card__caption">${G(s.caption)}</p>`:"",c=s.totals.length?`<ul class="lb-card__totals">${s.totals.map(f=>`<li>${G(f.label)} = <strong>${f.value}</strong></li>`).join("")}</ul>`:"",u=i?`<header class="lb-card__head"><h4>${i}</h4>${r}</header>`:r;return`<article class="${e.cardModifier?`lb-card ${e.cardModifier}`:"lb-card"}">
  ${u}
  ${n}
  ${o}${d}${c}
</article>`}function Vh(s,e,t,n){return bn(mn(s,e,t,n),n)}function Uh(s,e,t,n){return bn(mn(s,e,t,n),{...n,cardModifier:"lb-card--compact-match"})}function Kh(s,e,t,n){return bn(mn(s,e,t,n),{...n,cardModifier:"lb-card--category-matrix"})}function Wh(s){return s.pace===null?'<td class="lb-rank__pace"></td>':`<td class="lb-rank__pace lb-rank__pace--${s.pace.tone}">${G(s.pace.text)}</td>`}function Yh(s){return`lb-panel-${s.replace(/[^a-zA-Z0-9_-]+/g,"-")}`}function Xh(s,e,t=Jr,n=null){const i=Mh(s,e,t),r=i.hasPace,o=n!==null,d=(r?5:4)+(o?1:0),c=i.entries.map((_,g)=>{const v=_.group?` <span class="lb-rank__group">${G(_.group)}</span>`:"",k=`
  <td class="lb-rank__total">${_.total}</td>${r?`
  ${Wh(_)}`:""}
  <td class="lb-rank__thru">${_.holesPlayed}</td>`,N=s.entries[g],B=n&&N?n.plan.attached.get(Us(n.plan.slotDefId,N.ballIds)):void 0;if(!n)return`<tr class="${_.lead?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${_.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${G(_.name)}</span>${v}</span></td>${k}
</tr>`;if(!N||!B)return`<tr class="${_.lead?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${_.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${G(_.name)}</span>${v}</span></td>${k}
  <td class="lb-rank__disclosure"></td>
</tr>`;const U=Us(n.plan.slotDefId,N.ballIds),O=n.isOpen(U),ee=Yh(U),ce=Zr(B,n.routeSections,e,{mode:n.mode??"product"}),ue=["lb-rank__row--expandable"];return _.lead&&ue.push("lb-rank__lead"),O&&ue.push("lb-rank__row--open"),`<tr class="${ue.join(" ")}" data-expand-key="${G(U)}">
  <td class="lb-rank__pos">${_.position}</td>
  <td class="lb-rank__who"><button type="button" class="lb-rank__toggle" aria-expanded="${O}" aria-controls="${G(ee)}"><span class="lb-rank__whobox"><span class="lb-rank__name">${G(_.name)}</span>${v}</span></button></td>${k}
  <td class="lb-rank__disclosure"><span class="lb-rank__chev" aria-hidden="true"></span></td>
</tr>
<tr class="lb-rank__panel${O?" lb-rank__panel--open":""}" data-panel-key="${G(U)}">
  <td class="lb-rank__panelcell" colspan="${d}"><div class="lb-rank__panelwrap" id="${G(ee)}"><div class="lb-rank__panelbox">${ce}</div></div></td>
</tr>`}).join(""),u=r?`
      <col class="lb-rank__col-pace">`:"",h=r?'<th class="lb-rank__pace">Pace</th>':"",f=o?`
      <col class="lb-rank__col-disclosure">`:"",m=o?'<th class="lb-rank__disclosure" aria-label="Scorecard"></th>':"";return`<div class="lb-section">
  <h4 class="lb-section__title">${G(i.metricLabel)}</h4>
  <table class="lb-rank">
    <colgroup>
      <col class="lb-rank__col-pos">
      <col class="lb-rank__col-who">
      <col class="lb-rank__col-total">${u}
      <col class="lb-rank__col-thru">${f}
    </colgroup>
    <thead><tr><th class="lb-rank__pos">#</th><th class="lb-rank__who">Player</th><th class="lb-rank__total">Total</th>${h}<th class="lb-rank__thru">Thru</th>${m}</tr></thead>
    <tbody>${c}</tbody>
  </table>
</div>`}function Qh(s,e){const t=Ah(s,e),n=t.matches.map(i=>{const r=i.leader==="a"?" lb-mp__team--lead":"",o=i.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${r}">${G(i.sideAName)}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${G(i.standing)}</span><span class="lb-mp__status">${G(i.status)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${o}">${G(i.sideBName)}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${G(t.title)}</h4>${n}
</div>`}const Jh={ranked:Xh,match_summary:(s,e)=>Qh(s,e)},Zh={"default-score-grid":Vh,"compact-match-grid":Uh,"category-matrix-grid":Kh};function ep(s){return`<div class="lb-diag">Unrenderable result section <code>${G(s)}</code> — no generic view yet. Results are not hidden.</div>`}function tp(s){return`<div class="lb-diag">Unsupported score-grid component <code>${G(s)}</code> — no generic view yet. Results are not hidden.</div>`}function sp(s,e,t,n=null){const i=Jh[s.kind];return i?i(s,e,t,n):ep(s.kind)}function Zr(s,e,t,n){const i=Xr(s),r=Zh[i];return r?r(s,e,t,n):tp(i)}function ea(s,e,t=Jr,n=null){return s.leaderboard.length===0&&s.cards.length===0?`<div class="lb-empty">No scores entered yet for ${G(s.formatLabel)}.</div>`:s.leaderboard.map(r=>sp(r,e,t,n&&r===n.plan.rankedSection?n:null)).join("")||`<div class="lb-empty">No leaderboard metric for ${G(s.formatLabel)}.</div>`}function ta(s,e,t,n={}){if(s.length===0)return"";const i=n.mode??"product";return s.map(r=>Zr(r,e,t,{mode:i})).join(`
`)}const np=b(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class yn extends M{static styles=`
        .lb {
            /* Horizontal gutters come from the host panel (.round-view__main
               already pads lg) — padding here would double-indent every
               section relative to the page header and waste table width. */
            padding: ${a("lg")} 0 ${a("2xl")};

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
                ${R()}
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
                color: ${l("text-muted")};
                padding-left: 0;
            }
            & .lb-rank thead th.lb-rank__pace { font-weight: 700; }
            /* Worse than pace (+N) reads like over par; better (−N) like under
               par — same two colours the scorecard already uses. */
            & .lb-rank__pace--over { color: ${l("over-par")}; }
            & .lb-rank__pace--under { color: ${l("under-par")}; }
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

            /* --- Gamebook expansion: a ranked row whose scorecard folds under it.
               The row is tappable anywhere; the button inside the name cell is
               the real control (aria-expanded / aria-controls). The chevron has
               its own final column so it aligns at the board's right edge. */
            & .lb-rank__row--expandable { cursor: pointer; }
            & .lb-rank__toggle {
                display: flex;
                align-items: baseline;
                gap: ${a("xs")};
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
                outline: 2px solid ${l("accent")};
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
                border-right: 2px solid ${l("text-muted")};
                border-bottom: 2px solid ${l("text-muted")};
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
                border-bottom: 1px solid ${l("border")};
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
                background: ${l("surface-sunken")};
                border-radius: 0;
                margin: 0;
                padding: ${a("sm")} ${a("sm")} ${a("md")};
            }
            & .lb-rank__panelbox .lb-card__head h4 { display: none; }
            & .lb-rank__panelbox .lb-grid .lb-rowlabel { background: ${l("surface-sunken")}; }
            @media (prefers-reduced-motion: reduce) {
                & .lb-rank__panelwrap,
                & .lb-rank__chev { transition: none; }
            }
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
                ${R()}
                padding: ${a("md")};
                margin-bottom: ${a("lg")};
            }
            & .lb-card--compact-match {
                border-color: color-mix(in srgb, ${l("accent")} 28%, ${l("border")});
                padding-top: ${a("sm")};
            }
            & .lb-card--category-matrix .lb-grid {
                font-size: 0.72rem;
                /* Umbrella has the same nine-hole blocks as every other
                   scorecard. Keep those blocks inside the card on a phone;
                   intrinsic sizing here used the widest points cell to push
                   the final holes beyond the viewport. */
                table-layout: fixed;
                width: 100%;
            }
            & .lb-card--category-matrix .lb-grid th,
            & .lb-card--category-matrix .lb-grid td {
                padding: 2px 1px;
            }
            & .lb-card--category-matrix .lb-grid .lb-rowlabel {
                width: 5.8em;
                text-overflow: clip;
            }
            & .lb-card--category-matrix .lb-grid .lb-sum {
                width: 2.8em;
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
            /* Data cells hold a digit, a shape, or "AS" — all centred and at most
               a couple of px wider than the tightest mobile column. Let them
               spill symmetrically instead of clipping shapes / ellipsizing "AS".
               (Row labels keep the th ellipsis above.) */
            & .lb-grid td { overflow: visible; text-overflow: clip; }
            & .lb-grid thead th {
                font-size: 0.7rem;
                color: ${l("text-muted")};
                font-weight: 700;
            }
            /* The final cell carries a short route-section label (OUT / IN / TOT),
               not arbitrary content. It may safely paint beyond its tight cell
               instead of inheriting the generic header ellipsis. */
            & .lb-grid thead .lb-sum { overflow: visible; text-overflow: clip; }
            & .lb-grid .lb-rowlabel {
                text-align: left;
                width: 6em;
                position: sticky;
                left: 0;
                background: ${l("surface")};
                font-weight: 600;
                color: ${l("text")};
            }
            /* Route section labels such as OUT must fit whole; the shared cell
               padding otherwise leaves too little usable width and ellipsizes it. */
            & .lb-grid .lb-sum { width: 3em; font-weight: 700; background: ${l("surface-sunken")}; }
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
            ${Fh()}
            /* Deciding ball whose score is decorated: the marker's own shape gets
               the team fill — white number and white outline on the team colour.
               Declared AFTER the shape fills so the team colour wins. The white
               border + outer box-shadow halo are load-bearing: without them a
               filled bonus ring is indistinguishable from the plain standing
               pill (the score-to-par shapes above carry no outline). */
            & .lb-mark-fill--a, & .lb-mark-fill--b { border: 2px solid #fff; }
            ${Gh()}
            & .lb-mark-fill--a { background: #c2452f; color: #fff; box-shadow: 0 0 0 2.5px #c2452f; }
            & .lb-mark-fill--b { background: #2c6cae; color: #fff; box-shadow: 0 0 0 2.5px #2c6cae; }
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
    `;svc=this.inject(ge);expansion=new Lh;slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots(),t=this.svc.selectedSlotDefId();return e.find(n=>n.slotDefId===t)??e[0]??null};render(){return this.wire(np,{status:{className:()=>{const t=this.svc.resultLoading.get(),n=this.svc.result.get()===null;return t||n?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody(),onclick:t=>this.onBodyClick(t),onkeydown:t=>this.onBodyKeydown(t)}})}rowFor(e){return e.target?.closest?.("tr[data-expand-key]")??null}onBodyClick(e){const t=this.rowFor(e);if(!t||(window.getSelection?.()?.toString()??"")!=="")return;const n=t.getAttribute("data-expand-key")??"";this.applyOpen(t,this.expansion.toggle(n))}onBodyKeydown(e){if(e.key!=="Escape")return;const t=this.rowFor(e);if(!t)return;const n=t.getAttribute("data-expand-key")??"";this.expansion.isOpen(n)&&(this.applyOpen(t,this.expansion.set(n,!1)),t.querySelector(".lb-rank__toggle")?.focus(),e.stopPropagation())}applyOpen(e,t){e.classList.toggle("lb-rank__row--open",t),e.querySelector(".lb-rank__toggle")?.setAttribute("aria-expanded",String(t));const n=e.nextElementSibling;n?.classList.contains("lb-rank__panel")&&n.classList.toggle("lb-rank__panel--open",t)}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const n=u=>{const h=this.svc.nameOf(u);return this.svc.isPending(u)?`${h} (open seat)`:h},i=u=>this.svc.groupLabelOf(u),r=zh(t);this.expansion.retain(r.attached.keys());const o=ea(t,n,i,{plan:r,routeSections:e.routeSections,isOpen:u=>this.expansion.isOpen(u)}),d=ta(r.standalone,e.routeSections,n),c=d?`<h3 class="lb-cards__head">Scorecard</h3>${d}`:"";return o+c}}function ip(s,e){if(!e)return[];const t=[],n=new Set;for(const i of s)for(const r of i.players){if(r.playerId===e)return[];r.guestPlayerId===null||n.has(r.guestPlayerId)||(n.add(r.guestPlayerId),t.push({guestPlayerId:r.guestPlayerId,displayName:r.displayName}))}return t}const rp=b(`
    <div bind="root" class="claim-card hidden">
        <span class="claim-card__label">Played here as a guest?</span>
        <p class="claim-card__hint">Claim your scores — the round lands on your profile's card.</p>
        <div bind="rows" class="claim-card__rows"></div>
        <p bind="err" class="claim-card__err"></p>
    </div>
`),ap=b(`
    <div class="claim-card__row">
        <span bind="name" class="claim-card__name"></span>
        <button bind="claim" class="claim-card__btn" type="button">This is me</button>
    </div>
`);class op extends M{static styles=`
        .claim-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${R()}
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
    `;svc=this.inject(ge);auth=this.inject(V);router=this.inject(q);tokenQ=this.router.query("token");claiming=new p(!1);error=new p("");claimable(){return ip(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async claim(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.claiming.set(!0);try{await w.friendlyRounds.claimGuest({token:t,guestPlayerId:e}),await this.svc.loadByToken(t)}catch(n){this.error.set(n instanceof Q&&n.status===409?"Already claimed — or you already play in this round under your account.":n instanceof Q&&n.status===404?"That guest is no longer claimable on this round.":"Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}render(){const e=this.wire(rp,{root:{className:()=>this.claimable().length>0?"claim-card":"claim-card hidden"},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.claimable(),(t,n,i)=>this.wireEl(ap,{name:()=>t.displayName,claim:{disabled:()=>this.claiming.get(),onclick:()=>{this.claim(t.guestPlayerId)}}},i),t=>t.guestPlayerId),e}}function Is(s){return typeof s=="object"&&s!==null&&typeof s.get=="function"}const P=s=>`var(--${s})`,ri="http://www.w3.org/2000/svg";function lp(){const s=document.createElementNS(ri,"svg");s.setAttribute("width","12"),s.setAttribute("height","8"),s.setAttribute("viewBox","0 0 12 8"),s.setAttribute("fill","none"),s.setAttribute("aria-hidden","true"),s.setAttribute("focusable","false");const e=document.createElementNS(ri,"path");return e.setAttribute("d","M1 1.5 6 6.5 11 1.5"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","1.5"),e.setAttribute("stroke-linecap","round"),e.setAttribute("stroke-linejoin","round"),e.setAttribute("fill","none"),s.appendChild(e),s}const lt=class lt extends M{constructor(){super(...arguments),this.uid=`ui-select-${lt.seq++}`,this.open=new p(!1),this.highlightIndex=new p(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}get isMulti(){return this.props.multiple===!0}get multi(){return this.props}get single(){return this.props}currentOptions(){return Is(this.props.options)?this.props.options.get():this.props.options}selectedValues(){if(this.isMulti)return this.multi.values.get();const e=this.single.value.get();return e?[e]:[]}placeholderText(){const e=this.props.placeholder;return(typeof e=="function"?e():e)??""}formatCount(e){return this.multi.countLabel?this.multi.countLabel(e):String(e)}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50,n=this.isMulti;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const i=document.createElement("span");i.className="ui-select__trigger-label",this.triggerEl.appendChild(i);const r=document.createElement("span");r.className="ui-select__chevron",r.appendChild(lp()),r.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(r),this.triggerEl.addEventListener("click",d=>{d.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",d=>{this.handleTriggerKeydown(d)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",d=>{this.handleDropdownKeydown(d)}),this.listEl=document.createElement("div"),this.listEl.className="ui-select__list",this.listEl.setAttribute("role","listbox"),n&&this.listEl.setAttribute("aria-multiselectable","true"),this.dropdownEl.appendChild(this.listEl),n&&(this.countEl=document.createElement("div"),this.countEl.className="ui-select__count",this.countEl.setAttribute("role","status"),this.countEl.setAttribute("aria-live","polite"),this.dropdownEl.appendChild(this.countEl)),e.appendChild(this.dropdownEl);const o=d=>{this.optionEls=[],this.listEl.textContent="";for(let c=0;c<d.length;c++){const u=d[c],h=document.createElement("button");if(h.className=n?"ui-select__option ui-select__option--multi":"ui-select__option",h.setAttribute("type","button"),h.id=`${this.uid}-opt-${c}`,u.disabled){h.classList.add("ui-select__option--header"),h.disabled=!0,h.setAttribute("role","presentation"),h.setAttribute("aria-disabled","true");const m=document.createElement("span");m.className="ui-select__option-label",m.textContent=u.label,h.appendChild(m),this.listEl.appendChild(h),this.optionEls.push(h);continue}if(h.setAttribute("role","option"),n){const m=document.createElement("span");m.className="ui-select__checkbox",m.setAttribute("aria-hidden","true"),h.appendChild(m)}if(u.icon){const m=document.createElement("span");m.className="ui-select__option-icon",m.textContent=u.icon,h.appendChild(m)}const f=document.createElement("span");if(f.className="ui-select__option-label",f.textContent=u.label,h.appendChild(f),!n){const m=document.createElement("span");m.className="ui-select__check",m.setAttribute("aria-hidden","true"),h.appendChild(m)}h.addEventListener("click",m=>{m.stopPropagation(),this.chooseOption(u.value)}),h.addEventListener("mouseenter",()=>{this.highlightIndex.set(c)}),this.listEl.appendChild(h),this.optionEls.push(h)}};return Is(this.props.options)?this.track(C(()=>{o(this.currentOptions())})):o(this.props.options),this.track(C(()=>{const d=this.currentOptions(),c=this.selectedValues();if(n){const u=c.length;if(u>0)i.textContent=this.formatCount(u),this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const h=this.placeholderText();i.textContent=h,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!h)}this.countEl&&(this.countEl.textContent=this.formatCount(u))}else{const u=this.single.value.get(),h=d.find(f=>f.value===u);if(h)i.textContent=h.icon?`${h.icon} ${h.label}`:h.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const f=this.placeholderText();i.textContent=f,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!f)}}for(let u=0;u<d.length;u++){const h=this.optionEls[u];if(!h||d[u].disabled)continue;const f=c.includes(d[u].value);h.setAttribute("aria-selected",String(f)),h.classList.toggle("ui-select__option--selected",f);const m=h.querySelector(".ui-select__check");m&&(m.textContent=f?"✓":"");const _=h.querySelector(".ui-select__checkbox");_&&(_.textContent=f?"✓":"")}})),this.track(C(()=>{const d=this.open.get();this.dropdownEl.classList.toggle("open",d),r.classList.toggle("ui-select__chevron--open",d),this.triggerEl.setAttribute("aria-expanded",String(d)),d?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),d&&se(()=>{const c=this.currentOptions(),u=this.selectedValues(),h=c.findIndex(m=>!m.disabled&&u.includes(m.value)),f=c.findIndex(m=>!m.disabled);this.highlightIndex.set(h>=0?h:f)})})),this.track(C(()=>{const d=this.highlightIndex.get();for(let c=0;c<this.optionEls.length;c++)this.optionEls[c].classList.toggle("ui-select__option--highlighted",c===d);d>=0&&this.optionEls[d]&&(this.triggerEl.setAttribute("aria-activedescendant",`${this.uid}-opt-${d}`),this.optionEls[d].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(Is(this.props.disabled)?this.track(C(()=>{const d=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",d),this.triggerEl.disabled=d})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}chooseOption(e){if(this.isMulti){const t=this.multi.values.get();this.multi.values.set(t.includes(e)?t.filter(n=>n!==e):[...t,e]);return}dt(()=>{this.single.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}commitHighlighted(){const e=this.highlightIndex.get(),t=this.currentOptions();e>=0&&e<t.length&&!t[e].disabled&&this.chooseOption(t[e].value)}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.open.get()?this.commitHighlighted():this.open.set(!0);break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":e.preventDefault(),this.commitHighlighted();break;case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=this.currentOptions();if(t.length===0||!t.some(i=>!i.disabled))return;let n=this.highlightIndex.get();do n+=e,n<0&&(n=t.length-1),n>=t.length&&(n=0);while(t[n].disabled);this.highlightIndex.set(n)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};lt.styles=`
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
            gap: ${P("space-2")};
            padding: 10px 34px 10px 12px;
            min-width: 160px;
            width: 100%;
            border: 1px solid ${P("border")};
            border-bottom: 2px solid ${P("border-strong")};
            border-radius: ${P("radius-sm")};
            background: ${P("bg")};
            color: ${P("text")};
            font-family: ${P("font-ui")};
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
            transition:
                border-color ${P("dur-fast")} ${P("ease-standard")},
                box-shadow ${P("dur-fast")} ${P("ease-standard")},
                background ${P("dur-fast")} ${P("ease-standard")};
        }
        .ui-select__trigger:focus-visible {
            outline: none;
            border-color: ${P("accent")};
            background: ${P("surface")};
            box-shadow: 0 0 0 3px ${P("accent-soft")};
        }
        .ui-select__trigger--placeholder {
            color: ${P("text-muted")};
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
            color: ${P("text-muted")};
            transition: transform ${P("dur-fast")} ${P("ease-standard")};
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
            background: ${P("surface")};
            border: 1px solid ${P("border")};
            border-radius: ${P("radius-md")};
            box-shadow: ${P("shadow-2")};
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity ${P("dur-base")} ${P("ease-standard")},
                        transform ${P("dur-base")} ${P("ease-standard")};
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
            gap: ${P("space-2")};
            padding: ${P("space-2")} ${P("space-3")};
            cursor: pointer;
            color: ${P("text")};
            font-family: ${P("font-ui")};
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
            background: ${P("surface-2")};
        }
        .ui-select__option--selected {
            color: ${P("accent-strong")};
            font-weight: 600;
        }
        /* Multi-select: selection is a checkbox plus an accent-tinted fill,
           never weight and colour alone. */
        .ui-select__option--multi.ui-select__option--selected {
            background: ${P("accent-soft")};
        }
        .ui-select__option--multi.ui-select__option--selected.ui-select__option--highlighted {
            background: ${P("accent-soft")};
            box-shadow: inset 2px 0 0 ${P("accent")};
        }
        .ui-select__checkbox {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            border: 1px solid ${P("border-strong")};
            border-radius: 3px;
            background: ${P("surface")};
            font-size: 0.625rem;
            line-height: 1;
            color: ${P("on-accent")};
        }
        .ui-select__option--selected .ui-select__checkbox {
            background: ${P("accent")};
            border-color: ${P("accent")};
        }
        .ui-select__option--header {
            cursor: default;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${P("text-muted")};
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
            color: ${P("accent-strong")};
        }
        .ui-select__count {
            padding: ${P("space-2")} ${P("space-3")};
            border-top: 1px solid ${P("border")};
            font-family: ${P("font-ui")};
            font-size: 0.75rem;
            font-weight: 600;
            color: ${P("text-muted")};
        }
    `,lt.seq=0;let pe=lt;function dp(s){if(!s)return{visible:!1,selfAllowed:!1,guestAllowed:!1,blockedMessage:null};const e=s.seats.length>0,t=s.claimedSeats.some(r=>r.viewerMayRelease),n=s.viewer.claimSeat.allowed,i=s.viewer.claimSeatAsGuest.allowed;return{visible:e||t,selfAllowed:e&&n,guestAllowed:e&&i,blockedMessage:e&&!n&&!i?s.viewer.claimSeat.message??s.viewer.claimSeatAsGuest.message??"Claiming seats is not available on this round.":null}}function cp(s,e){const t=[];if(s.groupId!==null&&e.length>0){const n=e.findIndex(i=>i.id===s.groupId);if(n>=0){t.push(`Group ${n+1}`);const i=e[n].startTime;i.includes(":")&&t.push(i)}}return s.category!==null&&t.push(s.category),t.join(" · ")}function up(s){return(s?.claimedSeats??[]).filter(e=>e.viewerMayRelease)}const hp=b(`
    <div bind="root" class="seat-card hidden">
        <span class="seat-card__label">Who's playing?</span>
        <p bind="hint" class="seat-card__hint">This round has open seats — claim one to score.</p>
        <p bind="blocked" class="seat-card__blocked hidden"></p>
        <div bind="rows" class="seat-card__rows"></div>
        <div bind="releaseRows" class="seat-card__rows"></div>
        <p bind="err" class="seat-card__err"></p>
    </div>
`),pp=b(`
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
`),fp=b(`
    <div class="seat-card__release">
        <span class="seat-card__who">
            <span bind="name" class="seat-card__name"></span>
            <span bind="context" class="seat-card__context"></span>
        </span>
        <button bind="release" class="seat-card__btn seat-card__btn--ghost" type="button">Not me — release</button>
    </div>
`);class mp extends M{static styles=`
        .seat-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${R()}
            background: ${l("surface-sunken")};

            &.hidden { display: none; }

            & .seat-card__label {
                font-weight: 700;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: ${l("text-muted")};
            }
            & .seat-card__hint {
                margin: ${a("sm")} 0 0;
                font-size: 0.8rem;
                color: ${l("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__blocked {
                margin: ${a("md")} 0 0;
                font-size: 0.85rem;
                color: ${l("text-muted")};
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
                border-bottom: 1px solid ${l("border")};
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
                color: ${l("text-muted")};
                &:empty { display: none; }
            }
            & .seat-card__btn {
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
            & .seat-card__btn--wide { width: 100%; margin-top: ${a("sm")}; }
            & .seat-card__btn--ghost {
                background: transparent;
                color: ${l("accent")};
                border: 1px solid ${l("border")};
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
                border: 1px solid ${l("border")};
                border-radius: 8px;
                background: ${l("surface")};
                color: ${l("text")};
            }
            & .seat-card__input--hcp { width: 6rem; flex-shrink: 0; }
            & .seat-card__gender { flex: 1; }
            & .seat-card__tee { margin-bottom: ${a("sm")}; }
            & .seat-card__diag {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${l("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__err {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${l("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(ge);auth=this.inject(V);router=this.inject(q);tokenQ=this.router.query("token");claiming=new p(!1);error=new p("");diagnostics=new p([]);expandedSeat=new p(null);teeId=new p("");tees=new p([]);loadedForCourseId=null;guestName=new p("");guestHcp=new p("");guestGender=new p("M");state(){return dp(this.svc.startList.get())}ensureTeesLoaded(){if(!this.state().visible)return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,w.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}toggleSeat(e){this.diagnostics.set([]),this.error.set(""),this.expandedSeat.set(this.expandedSeat.get()===e?null:e)}guestHcpValue(){const e=Number.parseFloat(this.guestHcp.get().replace(",","."));return Number.isFinite(e)?e:null}async claim(e,t,n){const i=this.tokenQ.get(),r=this.teeId.get();if(!(!i||!r||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const o=await w.friendlyRounds.claimSeat({token:i,seatId:e,identity:t,teeId:r,clientEventId:n});o.ok?(this.expandedSeat.set(null),this.guestName.set(""),this.guestHcp.set(""),await this.svc.loadByToken(i)):this.diagnostics.set(o.diagnostics)}catch{this.error.set("Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}async claimSelf(e){const t=this.auth.currentUser.get()?.id??"anon";await this.claim(e,{kind:"self"},`claim-seat:${e}:${t}:${this.teeId.get()}`)}async claimGuest(e){const t=this.guestName.get().trim(),n=this.guestHcpValue();!t||n===null||await this.claim(e,{kind:"guest",name:t,handicapIndex:n,gender:this.guestGender.get()==="F"?"F":"M"},crypto.randomUUID())}async release(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const n=await w.friendlyRounds.releaseSeat({token:t,seatId:e,clientEventId:crypto.randomUUID()});n.ok?await this.svc.loadByToken(t):this.diagnostics.set(n.diagnostics)}catch{this.error.set("Could not release right now. Try again.")}finally{this.claiming.set(!1)}}}seatRow(e,t){const n=()=>this.expandedSeat.get()===e.seatId&&this.state().blockedMessage===null,i=this.wireEl(pp,{label:()=>e.label,context:()=>cp(e,this.svc.groups()),toggle:{textContent:()=>this.expandedSeat.get()===e.seatId?"Close":"Claim",disabled:()=>this.state().blockedMessage!==null,onclick:()=>this.toggleSeat(e.seatId)},form:{className:()=>n()?"seat-card__form":"seat-card__form hidden"},selfBtn:{className:()=>this.state().selfAllowed?"seat-card__btn seat-card__btn--wide":"seat-card__btn seat-card__btn--wide hidden",disabled:()=>this.claiming.get()||!this.teeId.get(),onclick:()=>{this.claimSelf(e.seatId)}},guestBox:{className:()=>this.state().guestAllowed?"seat-card__guest":"seat-card__guest hidden"},guestName:{oninput:d=>this.guestName.set(d.target.value)},guestHcp:{oninput:d=>this.guestHcp.set(d.target.value)},guestBtn:{disabled:()=>this.claiming.get()||!this.teeId.get()||this.guestName.get().trim()===""||this.guestHcpValue()===null,onclick:()=>{this.claimGuest(e.seatId)}},diag:{className:()=>this.diagnostics.get().length>0?"seat-card__diag":"seat-card__diag hidden",textContent:()=>this.diagnostics.get().map(d=>d.message).join(" · ")}},t),r=new pe({value:this.teeId,options:{get:()=>this.tees.get().map(d=>({value:d.id,label:d.name}))},placeholder:"Tee"});r.mount(this.ref(i,"teeHost")),t(()=>r.destroy());const o=new pe({value:this.guestGender,options:{get:()=>[{value:"M",label:"Men’s tee rating"},{value:"F",label:"Women’s tee rating"}]},placeholder:"Rating"});return o.mount(this.ref(i,"genderHost")),t(()=>o.destroy()),i}render(){this.track(C(()=>this.ensureTeesLoaded()));const e=this.wire(hp,{root:{className:()=>this.state().visible?"seat-card":"seat-card hidden"},hint:{className:()=>(this.svc.startList.get()?.seats.length??0)>0&&this.state().blockedMessage===null?"seat-card__hint":"seat-card__hint hidden"},blocked:{className:()=>this.state().blockedMessage!==null?"seat-card__blocked":"seat-card__blocked hidden",textContent:()=>this.state().blockedMessage??""},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.svc.startList.get()?.seats??[],(t,n,i)=>this.seatRow(t,i),t=>t.seatId),this.$each(this.ref(e,"releaseRows"),()=>up(this.svc.startList.get()),(t,n,i)=>this.wireEl(fp,{name:()=>t.displayName,context:()=>`holds “${t.seatLabel}”`,release:{disabled:()=>this.claiming.get(),onclick:()=>{this.release(t.seatId)}}},i),t=>t.seatId),e}}function gp(s,e,t){if(!e||t!=="not_started")return!1;for(const n of s)for(const i of n.players)if(i.playerId===e)return!1;return!0}function bp(s){if(!s)return{visible:!1,blockedMessage:null};const e=s.viewer.join;return e.allowed?{visible:!0,blockedMessage:null}:e.code==="window_not_open"||e.code==="window_closed"?{visible:!0,blockedMessage:e.message??"Sign-up is closed right now."}:{visible:!1,blockedMessage:null}}const ai="new";function yp(s,e=!0){const t=s.map((i,r)=>{const o=i.ballIds.length,d=[`Group ${r+1}`];return i.startTime.includes(":")&&d.push(i.startTime),{value:i.id,label:`${d.join(" · ")} — ${o} of ${i.capacity}`,disabled:o>=i.capacity}}),n=t.find(i=>!i.disabled);return e&&t.push({value:ai,label:"Start a new group",disabled:!1}),{options:t,defaultValue:n?.value??(e?ai:"")}}const _p=b(`
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
`);class vp extends M{static styles=`
        .join-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${R()}
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
            & .join-card__blocked {
                margin: ${a("md")} 0 0;
                font-size: 0.85rem;
                color: ${l("text-muted")};
                &.hidden { display: none; }
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
                &.hidden { display: none; }
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
                &.hidden { display: none; }
            }
            & .join-card__profile-link {
                border: 0;
                padding: 0;
                background: transparent;
                color: ${l("accent")};
                font: inherit;
                font-weight: 600;
                cursor: pointer;
                &.hidden { display: none; }
            }
            & .join-card__err {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${l("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(ge);auth=this.inject(V);router=this.inject(q);tokenQ=this.router.query("token");joining=new p(!1);error=new p("");diagnostics=new p([]);teeId=new p("");tees=new p([]);loadedForCourseId=null;groupChoice=new p("");policyState(){return bp(this.svc.startList.get())}eligible(){return this.policyState().visible&&gp(this.svc.balls.get(),this.auth.currentUser.get()?.id??null,this.svc.round.get()?.status??null)}ensureTeesLoaded(){if(!this.eligible())return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,w.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}needsProfileUpdate(){return this.diagnostics.get().some(e=>e.code==="missing_gender"||e.code==="missing_handicap_index")}async join(){const e=this.tokenQ.get(),t=this.teeId.get();if(!(!e||!t||this.joining.get())){this.error.set(""),this.diagnostics.set([]),this.joining.set(!0);try{const n=this.groupChoice.get(),i=await w.friendlyRounds.join({token:e,teeId:t,...n?{groupChoice:n}:{}});i.ok?await this.svc.loadByToken(e):this.diagnostics.set(i.diagnostics)}catch(n){this.error.set(n instanceof Q&&n.status===409?n.message??"You already play in this round, or it has already started.":"Could not join right now. Try again.")}finally{this.joining.set(!1)}}}render(){this.track(C(()=>this.ensureTeesLoaded()));const e=new T(()=>yp(this.svc.groups(),this.svc.startList.get()?.viewer.createGroup.allowed??!0));this.track(C(()=>{const r=e.get(),o=this.groupChoice.get();(!o||!r.options.some(d=>d.value===o&&!d.disabled))&&this.groupChoice.set(r.defaultValue)}));const t=this.wire(_p,{root:{className:()=>this.eligible()?"join-card":"join-card hidden"},blocked:{className:()=>this.policyState().blockedMessage!==null?"join-card__blocked":"join-card__blocked hidden",textContent:()=>this.policyState().blockedMessage??""},groupRow:{className:()=>this.svc.groups().length>0&&this.policyState().blockedMessage===null?"join-card__group":"join-card__group hidden"},row:{className:()=>this.policyState().blockedMessage===null?"join-card__row":"join-card__row hidden"},join:{disabled:()=>this.joining.get()||!this.teeId.get(),onclick:()=>{this.join()}},diag:{className:()=>this.diagnostics.get().length>0?"join-card__diag":"join-card__diag hidden"},diagText:{textContent:()=>this.diagnostics.get().map(r=>r.message).join(" · ")},profileLink:{className:()=>this.needsProfileUpdate()?"join-card__profile-link":"join-card__profile-link hidden",onclick:()=>this.router.navigate("/profile")},err:{textContent:()=>this.error.get()}}),n=new pe({value:this.teeId,options:{get:()=>this.tees.get().map(r=>({value:r.id,label:r.name}))},placeholder:"Tee"});n.mount(this.ref(t,"teeHost")),this.track(()=>n.destroy());const i=new pe({value:this.groupChoice,options:{get:()=>e.get().options},placeholder:"Group"});return i.mount(this.ref(t,"groupHost")),this.track(()=>i.destroy()),t}}const oi=1440*60*1e3;function wp(s,e){if(s===null)return!0;const t=new Date(s).getTime();return!Number.isFinite(t)||t-e>oi?!0:e-t>=oi}function xp(s,e){if(!e)return!1;for(const t of s)for(const n of t.players)if(n.playerId===e)return!0;return!1}function kp(s){const e={visible:!1,index:null};return s.settled||!s.profileLoaded||!s.firstOpen||!xp(s.balls,s.playerId)||!wp(s.handicapConfirmedAt,s.now)?e:{visible:!0,index:s.handicapIndex}}function _e(s){const e=s.trim().replace(",",".");if(e==="")return null;const t=e.startsWith("+"),n=Number.parseFloat(t?e.slice(1):e);return Number.isFinite(n)?t?-n:n:null}function Vt(s){return s<0?`+${String(-s)}`:String(s)}const $p=b(`
    <div bind="root" class="hcp-checkin hidden">
        <div bind="ask" class="hcp-checkin__ask">
            <span bind="question" class="hcp-checkin__question"></span>
            <div class="hcp-checkin__actions">
                <button bind="confirm" class="hcp-checkin__btn hcp-checkin__btn--ghost" type="button"></button>
                <button bind="edit" class="hcp-checkin__btn" type="button"></button>
            </div>
        </div>
        <div bind="editor" class="hcp-checkin__editor hidden">
            <label class="hcp-checkin__label" for="hcp-checkin-index">Handicap index</label>
            <div class="hcp-checkin__row">
                <input bind="field" id="hcp-checkin-index" class="hcp-checkin__field"
                       type="text" inputmode="decimal" autocomplete="off" placeholder="18.4">
                <button bind="save" class="hcp-checkin__btn" type="button">Save</button>
                <button bind="cancel" class="hcp-checkin__btn hcp-checkin__btn--ghost" type="button">Cancel</button>
            </div>
            <p class="hcp-checkin__hint">Plus handicaps as "+2.4".</p>
        </div>
        <p bind="err" class="hcp-checkin__err"></p>
    </div>
`);class Sp extends M{static styles=`
        .hcp-checkin {
            margin-bottom: ${a("lg")};
            padding: ${a("md")} ${a("lg")};
            ${R()}
            background: ${l("surface-sunken")};

            &.hidden { display: none; }

            & .hcp-checkin__ask {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${a("md")};
                flex-wrap: wrap;
                &.hidden { display: none; }
            }
            & .hcp-checkin__question {
                font-size: 0.9rem;
                color: ${l("text")};
            }
            & .hcp-checkin__actions {
                display: flex;
                align-items: center;
                gap: ${a("sm")};
                flex-shrink: 0;
            }
            & .hcp-checkin__editor {
                &.hidden { display: none; }
            }
            & .hcp-checkin__label {
                display: block;
                font-size: 0.8rem;
                color: ${l("text-muted")};
                margin-bottom: ${a("xs")};
            }
            & .hcp-checkin__row {
                display: flex;
                align-items: center;
                gap: ${a("sm")};
            }
            & .hcp-checkin__field {
                ${re()}
                flex: 1;
                min-width: 0;
                font-family: inherit;
            }
            & .hcp-checkin__hint {
                margin: ${a("xs")} 0 0;
                font-size: 0.78rem;
                color: ${l("text-muted")};
            }
            & .hcp-checkin__btn {
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
            & .hcp-checkin__btn--ghost {
                ${S()}
                padding: ${a("sm")} ${a("lg")};
                font-weight: 700;
                font-size: 0.85rem;
                background: transparent;
                color: ${l("text-muted")};
                border: 1px solid ${l("border")};
            }
            & .hcp-checkin__err {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${l("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(ge);auth=this.inject(V);profile=this.inject(Ie);settled=new p(!1);editing=new p(!1);text=new p("");busy=new p(!1);error=new p("");state(){const e=this.profile.player.get();return kp({playerId:this.auth.currentUser.get()?.id??null,balls:this.svc.balls.get(),firstOpen:this.svc.firstOpen.get(),handicapConfirmedAt:e?.handicapConfirmedAt??null,handicapIndex:e?.handicapIndex??null,profileLoaded:e!==null,settled:this.settled.get(),now:Date.now()})}ensureProfileLoaded(){this.settled.get()||this.svc.firstOpen.get()&&this.auth.currentUser.get()&&this.svc.balls.get().length&&this.profile.load()}async confirm(){if(this.busy.get())return;this.error.set(""),this.busy.set(!0);const e=await this.profile.confirmHandicap();this.busy.set(!1),e?this.settled.set(!0):this.error.set("Could not save that right now. Try again.")}startEdit(){const e=this.profile.player.get()?.handicapIndex??null;this.text.set(e===null?"":Vt(e)),this.error.set(""),this.editing.set(!0)}async save(){if(this.busy.get())return;const e=_e(this.text.get());if(e===null){this.error.set("Enter a handicap index, e.g. 18.4 or +2.4.");return}this.error.set(""),this.busy.set(!0);const t=await this.profile.saveIndex(e);this.busy.set(!1),t?(this.editing.set(!1),this.settled.set(!0)):this.error.set("Could not save that right now. Try again.")}render(){return this.track(C(()=>this.ensureProfileLoaded())),this.wire($p,{root:{className:()=>this.state().visible?"hcp-checkin":"hcp-checkin hidden"},ask:{className:()=>this.editing.get()?"hcp-checkin__ask hidden":"hcp-checkin__ask"},question:{textContent:()=>{const e=this.state().index;return e===null?"No handicap set — add one?":`Handicap ${Vt(e)} — still right?`}},confirm:{textContent:()=>this.state().index===null?"Not now":"Yes",disabled:()=>this.busy.get(),onclick:()=>{this.confirm()}},edit:{textContent:()=>this.state().index===null?"Add":"Update",disabled:()=>this.busy.get(),onclick:()=>this.startEdit()},editor:{className:()=>this.editing.get()?"hcp-checkin__editor":"hcp-checkin__editor hidden"},field:{value:()=>this.text.get(),oninput:e=>this.text.set(e.target.value)},save:{disabled:()=>this.busy.get(),onclick:()=>{this.save()}},cancel:{disabled:()=>this.busy.get(),onclick:()=>this.editing.set(!1)},err:{textContent:()=>this.error.get()}})}}function Tp(s,e){if(!e)return!1;for(const t of s)for(const n of t.players)if(n.playerId===e)return!0;return!1}const Pp=b(`
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
`);class Cp extends M{static styles=`
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
                background: ${l("surface")};
                border-top-left-radius: 16px; border-top-right-radius: 16px;
                /* Clear the iOS home indicator; harmless zero elsewhere. */
                padding: ${a("sm")} ${a("lg")} calc(${a("xl")} + env(safe-area-inset-bottom));
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
            }

            & .rmanage__head {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${a("md")};
                padding: ${a("sm")} 0 ${a("md")};
            }
            & .rmanage__title {
                margin: 0;
                font-family: ${l("font-display")};
                font-weight: 600; font-size: 1.25rem;
                color: ${l("text")};
            }
            & .rmanage__close {
                min-height: 44px;
                padding: 0 ${a("md")};
                background: none; border: none;
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                color: ${l("text-muted")};
                cursor: pointer;
                &:focus-visible { outline: 2px solid ${l("accent")}; outline-offset: 2px; }
            }

            & .rmanage__row {
                display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
                width: 100%;
                min-height: 44px;
                margin-top: ${a("sm")};
                padding: ${a("md")};
                text-align: left;
                background: none;
                border: 1px solid ${l("border")};
                border-radius: ${l("radius")};
                font-family: inherit;
                color: ${l("text")};
                cursor: pointer;

                &.hidden { display: none; }
                &:hover, &:active { border-color: ${l("text-muted")}; }
                &:focus-visible { outline: 2px solid ${l("accent")}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }

                & .rmanage__row-title { font-size: 0.95rem; font-weight: 700; }
                & .rmanage__row-sub { font-size: 0.8rem; font-weight: 400; color: ${l("text-muted")}; }
            }

            /* Danger rows read in the terracotta family — a quiet ghost, never
               a filled CTA (same treatment the old delete/leave buttons had). */
            & .rmanage__row--danger {
                color: ${l("danger")};
                &:hover, &:active { border-color: ${l("danger")}; }
                &:focus-visible { outline-color: ${l("danger")}; }
            }

            & .rmanage__diag {
                margin: ${a("md")} 0 0;
                font-size: 0.85rem;
                color: ${l("text-muted")};
                &:empty { display: none; }
            }
            & .rmanage__err {
                margin: ${a("sm")} 0 0;
                font-size: 0.85rem;
                color: ${l("danger")};
                &:empty { display: none; }
            }
        }

        /* App-level accessibility override for the framework confirm dialogs
           this sheet spawns. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;svc=this.inject(ge);auth=this.inject(V);router=this.inject(q);tokenQ=this.router.query("token");editable=new p(!1);deleteOpen=new p(!1);finishOpen=new p(!1);finishAsReopen=new p(!1);leaveOpen=new p(!1);leaving=new p(!1);error=new p("");diagnostics=new p([]);isComplete(){return this.svc.round.get()?.status==="complete"}canLeave(){return Tp(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}canDelete(){const e=this.auth.currentUser.get()?.id??null;return e!==null&&this.svc.friendlyRound.get()?.creatorPlayerId===e}clear(){this.error.set(""),this.diagnostics.set([])}async leave(){const e=this.tokenQ.get();if(!(!e||this.leaving.get())){this.clear(),this.leaving.set(!0);try{const t=await w.friendlyRounds.leave({token:e});t.ok?await this.svc.loadByToken(e):this.diagnostics.set(t.diagnostics)}catch{this.error.set("Could not remove you right now. Try again.")}finally{this.leaving.set(!1)}}}render(){this.track(C(()=>{const r=this.tokenQ.get();this.editable.set(!1),r&&w.friendlyRounds.setup({token:r}).then(o=>{this.tokenQ.get()===r&&this.editable.set(o.editable===!0)}).catch(()=>{})})),this.track(C(()=>{this.props.open.get()&&this.clear()}));const e=this.wire(Pp,{root:{className:()=>this.props.open.get()?"rmanage":"rmanage hidden"},backdrop:{onclick:()=>this.props.open.set(!1)},close:{onclick:()=>this.props.open.set(!1)},editRow:{className:()=>this.editable.get()?"rmanage__row":"rmanage__row hidden",onclick:()=>{const r=this.tokenQ.get();r&&(this.props.open.set(!1),this.router.navigate("/create",{query:{token:r}}))}},leaveRow:{className:()=>this.canLeave()?"rmanage__row rmanage__row--danger":"rmanage__row rmanage__row--danger hidden",onclick:()=>this.leaveOpen.set(!0),disabled:()=>this.leaving.get()},finishRow:{onclick:()=>{this.finishAsReopen.set(this.isComplete()),this.finishOpen.set(!0)},disabled:()=>this.svc.finishing.get()},finishTitle:()=>this.isComplete()?"Reopen round":"Finish round",finishSub:()=>this.isComplete()?"Move it back to your ongoing rounds.":"Move it to your finished rounds. Nothing is locked.",deleteRow:{className:()=>this.canDelete()?"rmanage__row rmanage__row--danger":"rmanage__row rmanage__row--danger hidden",onclick:()=>this.deleteOpen.set(!0),disabled:()=>this.svc.deleting.get()},diag:{textContent:()=>this.diagnostics.get().map(r=>r.message).join(" · ")},err:{textContent:()=>this.error.get()}});this.spawn(oe,this.ref(e,"deleteConfirmHost"),{open:this.deleteOpen,title:"Delete round?",message:"This permanently removes the round and all its scores for everyone. This can't be undone.",confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.clear(),this.svc.deleteRound().then(r=>{r?this.router.navigate("/"):this.error.set("Could not delete the round. Try again.")})}}),this.spawn(oe,this.ref(e,"finishConfirmHost"),{open:this.finishOpen,title:()=>this.finishAsReopen.get()?"Reopen this round?":"Finish this round?",message:()=>this.finishAsReopen.get()?"It'll move back to your ongoing rounds.":"It'll move to your finished rounds. You can still edit or reopen it any time.",confirmLabel:()=>this.finishAsReopen.get()?"Reopen round":"Finish round",cancelLabel:"Cancel",onconfirm:()=>{this.clear(),(this.finishAsReopen.get()?this.svc.reopenRound():this.svc.finishRound()).then(o=>{o||this.error.set("Could not update the round. Try again.")})}}),this.spawn(oe,this.ref(e,"leaveConfirmHost"),{open:this.leaveOpen,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.leave()}});let t=null;const n=this.ref(e,"close");this.track(C(()=>{this.props.open.get()?(t=document.activeElement instanceof HTMLElement?document.activeElement:null,queueMicrotask(()=>n.focus())):t&&(t.focus(),t=null)}));const i=r=>{if(r.key==="Escape"){if(this.deleteOpen.get())return void this.deleteOpen.set(!1);if(this.finishOpen.get())return void this.finishOpen.set(!1);if(this.leaveOpen.get())return void this.leaveOpen.set(!1);this.props.open.get()&&this.props.open.set(!1)}};return window.addEventListener("keydown",i),this.track(()=>window.removeEventListener("keydown",i)),e}}function Ip(s){const{balls:e,groups:t,strokesFor:n}=s,i=new Set(e.filter(o=>!o.pending).map(o=>o.id));let r=0;for(const o of t)for(const d of o.ballIds)if(i.has(d))for(const c of o.playedOrder)n(d,c.playHoleId)===null&&r++;return r}function Ep(s){return s<=0?null:s===1?"1 score is still missing.":`${s} scores are still missing.`}function Rp(s,e,t=!0){if(s===null||e===null||s<=0)return null;const n=s-e;return n===0?null:s===1&&t||n<=-3?"diamond":n===-2?"double_ring":n===-1?"ring":n===1?"square":n===2?"double_square":"box_badge"}function Np(s){const e=s.par,t=s.score,n=t===0,i=n?null:t,r=s.stats;return{id:s.playHoleId,ordinal:s.ordinal,holeNumber:s.courseHoleNumber,par:e,lengthM:s.lengthM,strokes:i,isPickedUp:n,vsPar:i===null?null:i-e,marker:Rp(i,e),tee:r.teeResult,gir:r.gir,putts:r.putts,firstPutt:r.firstPutt,shortGame:r.shortGameDifficulty,penalties:r.penalties,recoveryOk:r.recoveryOk,doubleCause:pc(s)}}function Op(s){return(s.penalties??0)>0}const Ks=10,Hp=3;function Mp(s){const{round:e,holes:t,history:n,windowSize:i=Ks,insightLimit:r=Hp,bundle:o=gt}=s,d=hn([e],o),c=d.waterfall,h=Ap(e,n,i).map(m=>Gt(m.measures,o)),f=d.rounds[0];return{roundId:e.roundId,date:e.date,courseName:e.courseName,name:e.name,holeCount:e.holeCount,strokes:f?.strokes??null,vsPar:f?.vsPar??null,cells:[...t].sort((m,_)=>m.ordinal-_.ordinal).map(Np),panels:d,waterfall:c,deltas:h.length===0?null:Nr(c,h),windowCount:h.length,insights:Fc(e.measures,c,h,r)}}function Ap(s,e,t){const n=e.filter(o=>o.roundId!==s.roundId);n.push(s);const i=ss(n),r=i.findIndex(o=>o.roundId===s.roundId);return r===-1?[]:i.slice(r+1,r+1+Math.max(0,t))}function li(s,e,t){const n=ss(s),i=n.findIndex(r=>r.roundId===e);return i===-1?!1:n.length-(i+1)>=t}function di(s){const e=(s.name??"").trim();if(e!=="")return e;const t=(s.courseName??"").trim();return t===""?"Round":t}function sa(s){const{signedInPlayerId:e,statConfigPlayerIds:t,statRows:n,holesUnscored:i}=s;return e===null||e===""?{reason:"notSignedIn",playerId:null}:t.has(e)?n.some(o=>o.playerId===e&&Bp(o))?i!==0?{reason:"roundUnfinished",playerId:null}:{reason:"eligible",playerId:e}:{reason:"noStatsRecorded",playerId:null}:{reason:"noStatsConfigured",playerId:null}}function Bp(s){return s.teeResult!==null||s.gir!==null||s.firstPutt!==null||s.putts!==null||s.shortGameDifficulty!==null||s.penalties!==null||s.recoveryOk!==null}function na(s){const{playerId:e,balls:t,groups:n,strokesFor:i}=s,r=t.find(d=>d.players.some(c=>c.playerId===e));if(!r)return null;const o=n.find(d=>d.ballIds.includes(r.id));return o?o.playedOrder.filter(d=>i(r.id,d.playHoleId)===null).length:null}function ia(s,e=typeof navigator>"u"?"en":navigator.language){const t=(s?.name??"").trim();if(t)return t;const n=s?.date??"";return/^\d{4}-\d{2}-\d{2}$/.test(n)?new Intl.DateTimeFormat(e,{dateStyle:"medium",timeZone:"UTC"}).format(new Date(`${n}T12:00:00Z`)):n||"Round"}const zp=b(`
    <div bind="root" class="ffl hidden" role="dialog" aria-modal="true" aria-label="Finish round">
        <div bind="prompt" class="ffl__prompt">
            <div class="ffl__prompt-body">
                <p class="ffl__kicker">That was the last hole</p>
                <h1 class="ffl__title">Round complete</h1>
                <p bind="roundName" class="ffl__round"></p>
                <p bind="missing" class="ffl__missing"></p>
                <p bind="err" class="ffl__err"></p>
            </div>
            <div class="ffl__actions">
                <button bind="finishBtn" class="ffl__finish" type="button">Finish round</button>
                <button bind="backBtn" class="ffl__back" type="button">Go back</button>
            </div>
        </div>

        <div bind="board" class="ffl__board hidden">
            <div class="ffl__board-scroll">
                <header class="ffl__board-head">
                    <p class="ffl__kicker">Round finished</p>
                    <h1 class="ffl__title">Final results</h1>
                    <p bind="boardRound" class="ffl__round"></p>
                </header>
                <div bind="leaderboard"></div>
            </div>
            <div class="ffl__bottom">
                <button bind="nextBtn" class="ffl__finish" type="button"></button>
            </div>
        </div>
    </div>
`);class Lp extends M{static styles=`
        /* Fullscreen takeover. Above the keypad layers (50–60), below the
           manage sheet (80) and the framework confirms (199/200) — nothing
           else is reachable while it is up anyway. */
        .ffl {
            position: fixed; inset: 0; z-index: 70;
            background: ${l("bg")};
            &.hidden { display: none; }

            & .ffl__kicker {
                margin: 0;
                font-size: 0.78rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em;
                color: ${l("accent")};
            }
            & .ffl__title {
                margin: ${a("xs")} 0 0;
                font-family: ${l("font-display")};
                font-weight: 600; font-size: 2rem; letter-spacing: -0.02em;
                color: ${l("text")};
            }
            & .ffl__round {
                margin: ${a("sm")} 0 0;
                color: ${l("text-muted")}; font-size: 0.95rem;
                &:empty { display: none; }
            }
            & .ffl__missing {
                margin: ${a("lg")} 0 0;
                color: ${l("danger")}; font-size: 0.9rem; font-weight: 600;
                &:empty { display: none; }
            }
            & .ffl__err {
                margin: ${a("md")} 0 0;
                color: ${l("danger")}; font-size: 0.85rem;
                &:empty { display: none; }
            }

            & .ffl__finish {
                ${S()}
                width: 100%;
                min-height: 52px;
                font-family: inherit; font-size: 1rem; font-weight: 700;
                background: ${l("primary")};
                color: ${l("primary-text")};
                border: none;
            }
            & .ffl__back {
                ${S()}
                width: 100%;
                min-height: 48px;
                font-family: inherit; font-size: 0.95rem; font-weight: 700;
            }

            & .ffl__prompt {
                height: 100%;
                display: flex; flex-direction: column;
                &.hidden { display: none; }
                justify-content: center;
                padding: ${a("2xl")} ${a("xl")} calc(${a("xl")} + env(safe-area-inset-bottom));
                text-align: center;

                & .ffl__prompt-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
                & .ffl__actions {
                    flex: 0 0 auto;
                    display: flex; flex-direction: column; gap: ${a("sm")};
                }
            }

            & .ffl__board {
                height: 100%;
                display: flex; flex-direction: column;
                &.hidden { display: none; }

                & .ffl__board-scroll {
                    flex: 1; overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    padding: ${a("xl")} ${a("lg")} ${a("lg")};
                }
                & .ffl__board-head { margin-bottom: ${a("sm")}; }
                & .ffl__bottom {
                    flex: 0 0 auto;
                    padding: ${a("md")} ${a("lg")} calc(${a("md")} + env(safe-area-inset-bottom));
                    background: ${l("surface")};
                    box-shadow: ${l("shadow-elevated")};
                }
            }
        }
    `;svc=this.inject(ge);auth=this.inject(V);router=this.inject(q);stage=new p("prompt");error=new p("");render(){this.track(C(()=>{this.svc.finishFlowOpen.get()&&(this.stage.set("prompt"),this.error.set(""))}));const e=this.wire(zp,{root:{className:()=>this.svc.finishFlowOpen.get()?"ffl":"ffl hidden"},prompt:{className:()=>this.stage.get()==="prompt"?"ffl__prompt":"ffl__prompt hidden"},board:{className:()=>this.stage.get()==="board"?"ffl__board":"ffl__board hidden"},roundName:()=>this.roundLine(),boardRound:()=>this.roundLine(),missing:()=>Ep(this.missingCount())??"",err:()=>this.error.get(),finishBtn:{onclick:()=>{this.finish()},disabled:()=>this.svc.finishing.get()},backBtn:{onclick:()=>this.svc.finishFlowOpen.set(!1)},nextBtn:{textContent:()=>this.statsEligible()?"View stats":"Close",onclick:()=>this.leave()}});this.spawn(yn,this.ref(e,"leaderboard"));const t=n=>{n.key==="Escape"&&this.svc.finishFlowOpen.get()&&this.stage.get()==="prompt"&&this.svc.finishFlowOpen.set(!1)};return window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t)),e}roundLine(){const e=this.svc.round.get();if(e===null)return"";const t=ia(e),n=(e.courseNameSnapshot??"").trim();return n!==""&&n!==t?`${t} · ${n}`:t}missingCount(){return Ip({balls:this.svc.balls.get(),groups:this.svc.groups(),strokesFor:(e,t)=>this.svc.strokesFor(e,t)})}async finish(){if(this.error.set(""),await this.svc.finishRound()===null){this.error.set("Could not finish the round. Try again.");return}this.stage.set("board"),this.svc.loadResult()}statsEligible(){return sa({signedInPlayerId:this.auth.currentUser.get()?.id??null,statConfigPlayerIds:new Set(this.svc.statModules.get().keys()),statRows:this.svc.statRows.get(),holesUnscored:na({playerId:this.auth.currentUser.get()?.id??"",balls:this.svc.balls.get(),groups:this.svc.groups(),strokesFor:(e,t)=>this.svc.strokesFor(e,t)})}).reason==="eligible"}leave(){const e=this.svc.round.get()?.id??null,t=this.statsEligible();this.svc.finishFlowOpen.set(!1),t&&e!==null?this.router.navigate("/round-stats",{query:{id:e,finish:"1"}}):this.router.navigate("/")}}class Be{static PAGE_SIZE=50;static MAX_PAGES=40;loading=new p(!1);error=new p(null);loaded=new p(!1);loadedRounds=new p([]);roundsWithStats=new p(null);hasMore=new p(!1);preset=new p(Gs());filter=new p(at);sgChoice=new p(Ds());profile=Y.get(Ie);handicapIndex=new T(()=>this.profile.player.get()?.handicapIndex??null);sgCohort=new T(()=>un(this.sgChoice.get(),this.handicapIndex.get()));sgBundle=new T(()=>mt[this.sgCohort.get()]);sgInfo=new T(()=>Dc(this.sgChoice.get(),this.handicapIndex.get()));extending=new p(!1);extendError=new p(null);pagesFetched=0;cursor=null;windowRounds=new T(()=>_r(this.preset.get(),this.filter.get(),this.loadedRounds.get(),new Date));model=new T(()=>hn(this.windowRounds.get(),this.sgBundle.get()));courses=new T(()=>wd(this.loadedRounds.get()));overFiltered=new T(()=>this.loadedRounds.get().length>0&&this.windowRounds.get().length===0);async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;this.pagesFetched=0,this.cursor=null,this.extendError.set(null);const t=await F(this.loading,this.error,()=>w.playerStats.myStats({limit:Be.PAGE_SIZE}));if(!t)return;const n=jt(t.rounds);if(n!==null){this.error.set({code:"server",message:n});return}this.pagesFetched=1,this.roundsWithStats.set(t.roundsWithStats),this.loadedRounds.set(t.rounds),this.cursor=t.nextCursor,this.hasMore.set(t.nextCursor!==null),this.loaded.set(!0),await this.extendIfNeeded()}select(e){this.preset.set(e),jn(e),this.extendIfNeeded()}selectSgBaseline(e){this.sgChoice.set(e),Vc(e)}async loadHandicap(){await this.profile.load()}applyFilter(e){this.filter.set(e),this.preset.set("custom"),jn("custom"),this.extendIfNeeded()}clearFilter(){this.filter.set(at),this.select(Lt)}async extendIfNeeded(){if(!(this.extending.get()||this.loading.get())){this.extendError.set(null),this.extending.set(!0);try{for(;this.cursor!==null&&this.pagesFetched<Be.MAX_PAGES&&vr({preset:this.preset.get(),filter:this.filter.get(),loaded:this.loadedRounds.get(),hasMore:this.hasMore.get(),now:new Date});){const e=this.cursor;let t;try{t=await w.playerStats.myStats({limit:Be.PAGE_SIZE,cursor:e})}catch{this.extendError.set({code:"network",message:"Could not load older rounds."});return}const n=jt(t.rounds);if(n!==null){this.extendError.set({code:"server",message:n});return}this.pagesFetched+=1,this.appendRounds(t.rounds),this.cursor=t.nextCursor,this.hasMore.set(t.nextCursor!==null)}}finally{this.extending.set(!1)}}}budgetSpent(){return this.pagesFetched>=Be.MAX_PAGES&&this.hasMore.get()}loadedCount(){return this.loadedRounds.get().length}clear(){this.loadedRounds.set([]),this.roundsWithStats.set(null),this.hasMore.set(!1),this.loaded.set(!1),this.error.set(null),this.extendError.set(null),this.filter.set(at),this.pagesFetched=0,this.cursor=null}appendRounds(e){const t=new Set(this.loadedRounds.get().map(i=>i.roundId)),n=e.filter(i=>!t.has(i.roundId));n.length!==0&&this.loadedRounds.set([...this.loadedRounds.get(),...n])}}class pt{static PAGE_SIZE=50;static MAX_PAGES=8;phase=new p("idle");failure=new p(null);roundId=new p(null);holes=new p([]);round=new p(null);history=new p([]);dashboard=Y.get(Be);inFlight=null;sgInfo=this.dashboard.sgInfo;model=new T(()=>{const e=this.round.get();return e===null?null:Mp({round:e,holes:this.holes.get(),history:this.history.get(),bundle:this.dashboard.sgBundle.get()})});async load(e,t=!1){if(!t&&(this.roundId.get()===e||this.inFlight===e))return;this.dashboard.loadHandicap(),this.inFlight=e,this.phase.set("loading"),this.failure.set(null),this.roundId.set(null),this.holes.set([]),this.round.set(null),this.history.set([]);let n;try{n=await w.playerStats.myRoundStats({roundId:e})}catch(o){if(this.inFlight!==e)return;this.inFlight=null,this.phase.set(ci(o)),this.failure.set(ui(o));return}if(this.inFlight!==e)return;let i;try{i=await this.walkHistory(e)}catch(o){if(this.inFlight!==e)return;this.inFlight=null,this.phase.set(ci(o)),this.failure.set(ui(o));return}if(this.inFlight!==e)return;this.inFlight=null;const r=i.find(o=>o.roundId===e)??null;if(r===null){this.phase.set("notFound");return}this.roundId.set(e),this.holes.set(n),this.round.set(r),this.history.set(i.filter(o=>o.roundId!==e)),this.phase.set("ready")}async walkHistory(e){const t=[],n=new Set,i=o=>{for(const d of o)n.has(d.roundId)||(n.add(d.roundId),t.push(d))};if(i(this.dashboard.loadedRounds.get()),li(t,e,Ks))return t;let r=null;for(let o=0;o<pt.MAX_PAGES;o++){const d=await w.playerStats.myStats({limit:pt.PAGE_SIZE,cursor:r??void 0}),c=jt(d.rounds);if(c!==null)throw new Error(c);if(i(d.rounds),li(t,e,Ks)||d.nextCursor===null)return t;r=d.nextCursor}return t}clear(){this.roundId.set(null),this.holes.set([]),this.round.set(null),this.history.set([]),this.phase.set("idle"),this.failure.set(null),this.inFlight=null}}function ci(s){if(s instanceof Q){if(s.status===401||s.status===403)return"notAuthorized";if(s.status===404)return"notFound"}return"failed"}function ui(s){return s instanceof Q&&(s.status===404||s.status===401||s.status===403)?null:s instanceof Error?s.message:"Something went wrong."}const le=100,ra=88,Ws=56,hi=56;function cs(s){return s>0?"loss":s<0?"gain":"zero"}function Qe(s,e){switch(s){case"gain":return e.gain;case"loss":return e.loss;case"zero":return e.zero;case"neutral":return e.neutral}}function H(s){return String(Math.round(s*1e3)/1e3)}function us(s){return s<0?0:s>1?1:s}function Ce(s,e){return`<svg class="chart" viewBox="0 0 ${le} ${H(s)}" preserveAspectRatio="none" style="height:${H(s)}px" aria-hidden="true" focusable="false">${e}</svg>`}function _n(s,e,t,n=1){return`<path d="M${H(s)} 0 L${H(s)} ${H(e)}" stroke="${t}" stroke-width="${H(n)}" vector-effect="non-scaling-stroke" fill="none"/>`}function me(s,e,t,n,i){return`<rect x="${H(s)}" y="${H(e)}" width="${H(t)}" height="${H(n)}" fill="${i}"/>`}const Fp=1;function Gp(s,e){const t=le/2,n=cs(s);if(!(e>0))return{zeroX:t,bar:null,tone:n};const i=Math.min(1,Math.abs(s)/e),r=Math.max(s===0?0:Fp,t*i);return{zeroX:t,bar:{x:s>=0?t:t-r,width:r},tone:n}}function aa(s,e,t,n=10){const i=Gp(s,e),r=i.bar&&i.bar.width>0?me(i.bar.x,0,i.bar.width,n,Qe(i.tone,t)):"";return Ce(n,[me(0,0,le,n,t.track),r,_n(i.zeroX,n,t.rule)].join(""))}function jp(s){const e=[];let t=0;for(const n of s){const i=le*us(n.share);e.push({id:n.id,x:t,width:i,color:n.color}),t+=i}return e}function Dp(s,e,t=12){const n=jp(s).filter(i=>i.width>0).map(i=>me(i.x,0,i.width,t,i.color)).join("");return Ce(t,me(0,0,le,t,e.track)+n)}const pi=2,qp=1e-4;function Vp(s,e=34){if(s.length===0)return[];const t=Math.min(...s),i=Math.max(...s)-t,r=pi,o=Math.max(0,e-pi*2);return s.map((d,c)=>({x:s.length===1?le/2:c/(s.length-1)*le,y:i===0?e/2:r+o-(d-t)/i*o}))}function Up(s){return s.map((e,t)=>`${t===0?"M":"L"}${H(e.x)} ${H(e.y)}`).join(" ")}function Kp(s,e){const t=s[0],n=s[s.length-1];if(t===void 0||n===void 0)return"neutral";const i=n-t;return Math.abs(i)<=qp?"neutral":(e==="percentage"?i>0:i<0)?"gain":"loss"}function Wp(s,e,t,n=34){const i=Vp(s,n);if(i.length===0)return Ce(n,"");const r=Qe(Kp(s,e),t),o=`<path d="${Up(i)}" fill="none" stroke="${r}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`,d=i[i.length-1],c=`<path d="M${H(d.x)} ${H(d.y)} L${H(d.x)} ${H(d.y)}" stroke="${r}" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke" fill="none"/>`;return Ce(n,o+c)}const Yp=.5;function Xp(s,e,t=12){const n=le/2,i=he.length-1,r=Math.max(1,(t-i)/he.length),o=[];return he.forEach((d,c)=>{const u=Ye(s,d);if(u===null||!(e>0))return;const h=Math.max(u===0?0:Yp,n*Math.min(1,Math.abs(u)/e));o.push({component:d,x:u>=0?n:n-h,y:c*(r+1),width:h,height:r,tone:cs(u)})}),o}function Qp(s,e,t,n=12){const i=Xp(s,e,n).filter(r=>r.width>0).map(r=>me(r.x,r.y,r.width,r.height,Qe(r.tone,t))).join("");return Ce(n,_n(le/2,n,t.rule)+i)}const oa=1,fi=.02;function Jp(s,e){const t=e>0?le*Math.min(1,e):null;if(s===null)return{bar:null,tickX:t};const n=us(s),i=e<=0?"neutral":s>e+fi?"gain":s<e-fi?"loss":"neutral";return{bar:{width:Math.max(oa,le*n),tone:i},tickX:t}}function Zp(s,e,t,n=10){const i=Jp(s,e),r=i.bar?me(0,0,i.bar.width,n,Qe(i.bar.tone,t)):"",o=i.tickX===null?"":_n(i.tickX,n,t.rule,2);return Ce(n,me(0,0,le,n,t.track)+r+o)}function ef(s){return s===null?null:Math.max(oa,le*us(s))}function la(s,e,t=e.neutral,n=8){const i=ef(s),r=i===null?"":me(0,0,i,n,t);return Ce(n,me(0,0,le,n,e.track)+r)}const mi=100,Ut=50,tf=16,Pt=22,gi=44,sf=3,nf=33,rf={long:{from:315,to:405},right:{from:45,to:135},short:{from:135,to:225},left:{from:225,to:315}};function it(s,e){const t=(s-90)*Math.PI/180;return{x:Ut+e*Math.cos(t),y:Ut+e*Math.sin(t)}}function bi(s,e,t,n){const i=e-s>180?1:0,r=it(s,n),o=it(e,n),d=it(e,t),c=it(s,t);return`M${H(r.x)} ${H(r.y)} A${H(n)} ${H(n)} 0 ${i} 1 ${H(o.x)} ${H(o.y)} L${H(d.x)} ${H(d.y)} A${H(t)} ${H(t)} 0 ${i} 0 ${H(c.x)} ${H(c.y)} Z`}function af(s){const e=Math.max(s.long,s.short,s.left,s.right),t=sf/2,n=[];for(const i of["long","right","short","left"]){const r=rf[i],o=r.from+t,d=r.to-t,c=e>0?us(s[i]/e):0,u=Pt+(gi-Pt)*c,h=it((r.from+r.to)/2,nf);n.push({id:i,trackPath:bi(o,d,Pt,gi),valuePath:bi(o,d,Pt,u),labelX:h.x,labelY:h.y})}return n}function of(s,e,t,n=132){const i=s.map(r=>`<path d="${r.trackPath}" fill="${t.track}"/>`).join("")+s.map(r=>`<path d="${r.valuePath}" fill="${t.neutral}"/>`).join("")+`<circle cx="${H(Ut)}" cy="${H(Ut)}" r="${H(tf)}" fill="${t.track}"/>`+s.map(r=>`<text x="${H(r.labelX)}" y="${H(r.labelY)}" fill="${t.rule}" font-size="7" text-anchor="middle" dominant-baseline="middle">${e[r.id]}</text>`).join("");return`<svg class="chart chart--compass" viewBox="0 0 ${mi} ${mi}" preserveAspectRatio="xMidYMid meet" style="width:${H(n)}px;height:${H(n)}px" aria-hidden="true" focusable="false">${i}</svg>`}const lf=60,Kt=58,df=2,cf={left:{x:6,width:24},centre:{x:38,width:24},right:{x:70,width:24}};function uf(s,e){const t=Kt-df,n=o=>e>0?o/e*t:0,i=[],r=(o,d)=>{const c=cf[o];let u=Kt;for(const h of d){const f=n(h.count);u-=f,i.push({id:h.id,column:o,tone:h.tone,x:c.x,y:u,width:c.width,height:f})}};return r("left",[{id:"left-inplay",tone:"inplay",count:s.leftInPlay},{id:"left-trouble",tone:"trouble",count:s.leftTrouble}]),r("centre",[{id:"fairway",tone:"fairway",count:s.fairway}]),r("right",[{id:"right-inplay",tone:"inplay",count:s.rightInPlay},{id:"right-trouble",tone:"trouble",count:s.rightTrouble}]),i}function hf(s,e,t){const n=s.filter(i=>i.height>0).map(i=>me(i.x,i.y,i.width,i.height,e[i.tone])).join("")+`<path d="M0 ${H(Kt)} L${H(le)} ${H(Kt)}" stroke="${t.rule}" stroke-width="1" vector-effect="non-scaling-stroke" fill="none"/>`;return Ce(lf,n)}const hs={gain:l("accent-strong"),loss:l("danger"),zero:l("border-strong"),neutral:l("accent"),track:l("surface-sunken"),rule:l("border")},$={intro:"Every window is added up on this device from the rounds you have recorded.",loading:"Adding up your rounds…",noStats:"No rounds with statistics yet. Turn statistics on in your profile and they start filling in as you score.",windowEmpty:"No rounds match this window. Widen the filter, or clear it to go back to your last 10 rounds.",extending:"Loading more history…",extendProblemPrefix:"Showing the rounds loaded so far — fetching older ones failed: ",budgetSpent:"Showing the most recent rounds — this window stops short of your whole history.",notEnoughData:"Not enough data",notRecorded:"Not recorded",priorities:"Practice priorities",prioritiesHint:"Where your shots go, worst first, in strokes per 18 holes. Positive costs you shots.",prioritiesInfo:"How this works",trends:"Trends",trendsHint:"Oldest round on the left. A round with no reading is skipped, never plotted as zero.",roundsHeading:"Rounds in this window",roundsHint:"Each strip is that round’s five terms, on one shared scale.",filterClear:"Clear filter",filterRoundsHint:"Uncheck a round below to leave it out of a custom window.",filterBaseline:"Compared to",filterBaselineHint:"Which player the strokes-gained rows measure you against. It does not change which rounds are in the window.",troubleTax:"Extra strokes per hole when the tee shot finds trouble, against your own fairway holes.",penaltyTax:"Extra strokes per hole on the holes where you took a penalty, against your own penalty-free holes.",recovery:"Holes where the shot after trouble got you back in play.",penalties:"Penalty strokes per round.",noValue:Br,proximityProxy:"How far the first putt was on greens you hit — a stand-in for approach proximity, which the app does not measure directly.",birdieConversion:"Greens hit that became a birdie or better.",ladderBaseline:"The tick is the make rate your reference expects from that distance. For the two longest bands it sits at zero: the reference expects two putts from there, so any make is ahead of it.",ladderCost:"Cost is how many strokes this distance has cost you across the window, against the reference you picked. Plus means it cost you shots; minus means you gained them.",costOfMissedGreen:"What a hole costs you against par on average with the green hit, and with it missed.",missedGreenTax:"The difference between what a hole costs you with the green hit and with it missed.",threePutt:"Holes with three putts or more.",longThreePutt:"Three-putts that started from over 8 m.",puttsPerGir:"Putts taken on holes where you hit the green.",conversionInside2m:"First putts from inside 2 m that went in — across every hole, not only chipped ones. The app records no chip-and-hole cross-tab.",chipIns:"Short-game shots that went in without a putt.",vsParByTee:"What each kind of tee shot actually cost you, per hole. The trouble tax below is the difference between the last row and the first.",firstPuttSpread:"Where the first putt was on every hole you recorded one — not only the greens you hit.",puttsAfterMissedGreen:"Putts taken on holes where you missed the green.",puttsByPar:"Putts per hole on each kind of hole — every hole you recorded putts on, green hit or not.",hardChipShare:"How often a missed green left a hard chip or pitch rather than a standard one.",greenMissHead:"Where you miss the green",greenMiss:"Recorded misses only. Long is past the flag, short is in front of it.",teeFanHead:"Where your tee shots finish",teeFan:"Side is recorded whenever the drive left the fairway. The darker block is trouble.",scrambling:"Missed greens where you still got up and down for par or better.",sandSave:"Missed greens from a bunker where you still got up and down.",missMixHead:"What your missed greens leave you",missMix:"How your missed greens split between standard, hard and bunker lies. It describes the trouble your approaches leave behind, not how you play from it.",chipOutcomes:"What each missed green turned into. The rows share the same denominator — that difficulty’s attempts — so they add up to 100%. Holes where you did not count chips are treated as one chip.",multiChip:"Missed greens that took more than one shot to reach the green. Holes where you did not count are treated as one.",extraShortGameStrokes:"Short-game shots beyond one per missed green, across this window.",savedInside2m:"Chips that finished inside 2 m where the next putt went in. Beside “Chipped to inside 2 m” it splits a failed scramble into its two causes: a chip left too far out, or a makeable putt missed.",missCost:"Your average score against par on the holes where you missed the green, split by how hard the recovery was. The gap between the rows is what a hard miss actually costs over a standard one.",penaltySourceInfoTitle:"Where the penalties came from",resultsHeading:"Results",scoreTypesHead:"Holes by score",avgVsParByPar:"Your average score against par on each kind of hole.",doubleBogeyPlus:"Holes at double bogey or worse, per round.",doubleCausesHead:"Where your doubles come from",doubleCauses:"What manufactured each hole at double bogey or worse, grouped by where on the course the damage happened. One cause per hole, so the groups add up to 100%, and the indented rows split a group by mechanism.",doubleCausesOrder:"A hole gets one cause, checked strongest evidence first: penalty, then failed recovery, then more than one chip, then three putts, then trouble off the tee, then the long-game residual. A trouble tee shot you recovered from, followed by three putts, is a three-putt double — the tee shot was already paid for.",doubleCausesPenalty:"A penalty double is filed under the phase where the penalty happened: off the tee, on the approach, or around the green. One source is recorded per hole, so a hole with two penalties counts under its main one — and a penalty with no source recorded counts under “Not enough recorded”, because the phase is exactly what was not recorded.",doubleCausesLongGame:"“Full swing” is the long-game residual — strokes lost to full swings between tee and green. It is only claimed on a hole that recorded enough to rule everything else out: whether you hit the green, how many putts you took, where the tee shot finished on a par 4 or 5, and how hard the chip was when you missed.",doubleCausesUnattributed:"“Not enough recorded” is a double you did not record enough about to name. Those holes are counted, never dropped, and the row shrinks as you record more.",bounceBack:"Holes after a bogey or worse that came back at par or better."};function L(s,e,t){return{kind:"bar",id:s,title:e,share:t.value,value:ie(t)}}function pf(s,e,t){return{kind:"bar",id:s,title:e,share:t.value,value:ie(t),sub:!0}}function K(s,e,t,n=null){return{kind:"figure",id:s,title:e,value:t,hint:n}}const ff=["Holed","Cost"];function mf(s){const e=s.value===null?$.notRecorded:`${s.value} holed`;if(s.cost===$.noValue)return`${s.title}, ${e}, ${$.notRecorded}`;const t=s.cost.replace(/^[+\u2212]/,"");return s.cost.startsWith("+")?`${s.title}, ${e}, ${t} strokes lost`:s.cost.startsWith("−")?`${s.title}, ${e}, ${t} strokes gained`:`${s.title}, ${e}, level`}function gf(s,e){switch(s){case"tee":{const t=e.tee&&ie(e.tee.fairway);return t?`Fairways ${t}`:null}case"approach":{const t=e.approach&&ie(e.approach.gir);return t?`Greens in regulation ${t}`:null}case"putting":{const t=e.putting&&ne(e.putting.puttsPerGirHole);return t?`${t} putts per green hit`:null}case"shortGame":{const t=e.shortGame&&ie(e.shortGame.scramble.overall);return t?`Scrambling ${t}`:null}case"scoring":return e.scoring?ou(e.scoring.doubleBogeyPlusPerRound,{unit:$e,label:"doubles or worse per round"}):null}}function bf(s){return K("troubleTax","Trouble tax",ne(s.troubleTax,2,!0),null)}function qe(s){return ne(s,2,!0)}function yf(s){const e={long:s.greenMiss.long.value??0,short:s.greenMiss.short.value??0,left:s.greenMiss.left.value??0,right:s.greenMiss.right.value??0},t=i=>ie(i)??"",n=(i,r)=>`${i} ${ie(r)??$.notRecorded}`;return{kind:"compass",id:"greenMiss",sectors:af(e),labels:{long:t(s.greenMiss.long),short:t(s.greenMiss.short),left:t(s.greenMiss.left),right:t(s.greenMiss.right)},text:[n("Long",s.greenMiss.long),n("Short",s.greenMiss.short),n("Left",s.greenMiss.left),n("Right",s.greenMiss.right)].join(" · "),recorded:s.greenMissRecorded}}function _f(s){const e=s.teeFan;return{kind:"fan",id:"teeFan",columns:uf(e,s.teeRecorded),text:[`Left ${de(e.leftInPlay+e.leftTrouble)}`,`Fairway ${de(e.fairway)}`,`Right ${de(e.rightInPlay+e.rightTrouble)}`].join(" · "),recorded:s.teeRecorded}}function vf(s){return s.vsParByTee.fairway.d>0||s.vsParByTee.inPlay.d>0||s.vsParByTee.trouble.d>0}function wf(s){switch(s){case"penalty":return"Penalty";case"failedRecovery":return"Failed recovery";case"multiChip":return"More than one chip";case"threePutt":return"Three putts";case"troubleTee":return"Trouble off the tee";case"fullSwing":return"Long game";case"unattributed":return"Not enough recorded"}}function xf(s){switch(s){case"offTee":return"Off the tee";case"longGame":return"Long game";case"shortGame":return"Short game";case"threePutt":return"Three putts";case"unattributed":return"Not enough recorded"}}function kf(s){switch(s){case"troubleTee":return"Trouble off the tee";case"failedRecovery":return"Failed recovery";case"fullSwing":return"Full swing";case"multiChip":return"More than one chip";case"penaltyTee":case"penaltyApproach":case"penaltyShort":return"Penalty"}}function yi(s,e){switch(s){case"tee":{const t=e.tee;return t?[{kind:"split",id:"teeSplit",segments:[{id:"fairway",title:"Fairway",tone:"fairway",share:t.fairway.value,value:ie(t.fairway)},{id:"inPlay",title:"In play",tone:"inplay",share:t.inPlayOnly.value,value:ie(t.inPlayOnly)},{id:"trouble",title:"Trouble",tone:"trouble",share:t.trouble.value,value:ie(t.trouble)}]},...t.teeMissRecorded>0?[{kind:"subhead",id:"teeFanHead",text:$.teeFanHead},_f(t)]:[],...vf(t)?[{kind:"subhead",id:"vsParByTeeHead",text:"Average vs par, by where the tee shot finished"},K("vsParFairway","From the fairway",qe(t.vsParByTee.fairway)),K("vsParInPlay","From in play",qe(t.vsParByTee.inPlay)),K("vsParTrouble","From trouble",qe(t.vsParByTee.trouble))]:[],bf(t),L("recovery","Recovery",t.recovery),...t.penaltiesRecordedHoles>0?[K("penalties","Penalties",ne(t.penaltiesPerRound,2)),L("penaltyHoleShare","Holes with a penalty",t.penaltyHoleShare),K("penaltyTax","Penalty tax",ne(t.penaltyTax,2,!0))]:[]]:[]}case"approach":{const t=e.approach;return t?[...t.greenMissRecorded>0?[{kind:"subhead",id:"greenMissHead",text:$.greenMissHead},yf(t)]:[],{kind:"subhead",id:"girByTee",text:"Greens hit, by where the tee shot finished"},L("girFairway","From the fairway",t.girByTee.fairway),L("girInPlay","From in play",t.girByTee.inPlay),L("girTrouble","From trouble",t.girByTee.trouble),{kind:"subhead",id:"girByParHead",text:"Greens hit, by par"},L("girPar3","Par 3",t.girByPar.par3),L("girPar4","Par 4",t.girByPar.par4),L("girPar5","Par 5",t.girByPar.par5),{kind:"subhead",id:"mixHead",text:"Proximity with GIR"},...ze.map(n=>L(`mix-${n}`,$s(n),t.girFirstPuttMix[n])),L("birdieConversion","Birdie conversion",t.birdieConversion),...t.hardChipShare.d>0?[L("hardChipShare","Hard misses",t.hardChipShare)]:[],...t.costOfMissedGreen.hit.d>0||t.costOfMissedGreen.miss.d>0?[{kind:"subhead",id:"missedGreenHead",text:"Cost of a missed green"},K("vsParGreenHit","Green hit",ne(t.costOfMissedGreen.hit,2,!0)),K("vsParGreenMissed","Green missed",ne(t.costOfMissedGreen.miss,2,!0)),K("missedGreenTax","Missed-green tax",ne(t.costOfMissedGreen.delta,2,!0))]:[]]:[]}case"putting":{const t=e.putting;return t?[...t.firstPuttSpread[ze[0]].d>0?[{kind:"subhead",id:"firstPuttHead",text:"First putt, all holes"},...ze.map(n=>L(`spread-${n}`,$s(n),t.firstPuttSpread[n]))]:[],{kind:"subhead",id:"ladderHead",text:"Holed on the first putt"},{kind:"columns",id:"ladderCols",cells:[...ff]},...t.ladder.map(n=>({kind:"rung",id:`rung-${n.bucket}`,title:$s(n.bucket),made:n.made.value,baseline:n.baseline,value:ie(n.made),cost:Pu(n.cost)})),...t.puttDistribution.zero.d>0?[{kind:"subhead",id:"puttCountHead",text:"Holes by putts"},L("putts-zero","No putts",t.puttDistribution.zero),L("putts-one","One putt",t.puttDistribution.one),L("putts-two","Two putts",t.puttDistribution.two),L("putts-threePlus","Three or more",t.puttDistribution.threePlus)]:[],L("longThreePutt","Three-putts from over 8 m",t.threePuttsFromOver8m),K("puttsPerGir","Putts per green hit",ne(t.puttsPerGirHole,2)),...t.puttsAfterMissedGreen.d>0?[K("puttsAfterMissedGreen","Putts after a missed green",ne(t.puttsAfterMissedGreen,2))]:[],...t.puttDistribution.zero.d>0?[{kind:"subhead",id:"puttsByParHead",text:"Putts per hole, by par"},K("puttsPar3","Par 3",ne(t.puttsPerHoleByPar.par3,2)),K("puttsPar4","Par 4",ne(t.puttsPerHoleByPar.par4,2)),K("puttsPar5","Par 5",ne(t.puttsPerHoleByPar.par5,2))]:[]]:[]}case"shortGame":{const t=e.shortGame;if(!t)return[];const n=(i,r,o,d)=>d>0?[{kind:"subhead",id:`${i}Head`,text:r},L(`${i}ChipIn`,"Holed the chip",o.chipIn),L(`${i}OnePutt`,"One putt",o.onePutt),L(`${i}TwoPutt`,"Two putts",o.twoPutt),L(`${i}ThreePutt`,"Three or more putts",o.threePlus),...t.shortGameStrokesRecorded>0?[L(`${i}MultiChip`,"More than one chip",o.multiChip)]:[]]:[];return[{kind:"subhead",id:"missMixHead",text:$.missMixHead},{kind:"split",id:"difficultyMix",segments:[{id:"standard",title:"Standard",tone:"fairway",share:t.mix.standard.value,value:ie(t.mix.standard)},{id:"hard",title:"Hard",tone:"inplay",share:t.mix.hard.value,value:ie(t.mix.hard)},...t.scrambleAttemptsBunker>0?[{id:"bunker",title:"Bunker",tone:"trouble",share:t.mix.bunker.value,value:ie(t.mix.bunker)}]:[]]},{kind:"subhead",id:"scrambleHead",text:"Scrambling"},L("scrambleStandard","Standard",t.scramble.standard),L("scrambleHard","Hard",t.scramble.hard),...t.scrambleAttemptsBunker>0?[L("scrambleBunker","Bunker",t.scramble.bunker)]:[],...t.scrambleAttemptsBunker>0?[L("sandSave","Sand save",t.sandSave)]:[],...t.shortGameStrokesRecorded>0?[K("extraShortGameStrokes","Extra short-game shots",String(t.extraShortGameStrokes))]:[],...n("afterStandard","After a standard chip",t.outcomes.standard,t.scramble.standard.d),...n("afterHard","After a hard chip",t.outcomes.hard,t.scramble.hard.d),...n("afterBunker","After a bunker shot",t.outcomes.bunker,t.scrambleAttemptsBunker),...t.missCost.standard.d>0||t.missCost.hard.d>0||t.missCost.bunker.d>0?[{kind:"subhead",id:"missCostHead",text:"Average vs par, by how hard the miss was"},K("missCostStandard","Standard",qe(t.missCost.standard)),K("missCostHard","Hard",qe(t.missCost.hard)),...t.scrambleAttemptsBunker>0||t.missCost.bunker.d>0?[K("missCostBunker","Bunker",qe(t.missCost.bunker))]:[]]:[],{kind:"subhead",id:"chipHead",text:"Chipped to inside 2 m"},L("chipStandard","Standard",t.chipInside2m.standard),L("chipHard","Hard",t.chipInside2m.hard),...t.scrambleAttemptsBunker>0?[L("chipBunker","Bunker",t.chipInside2m.bunker)]:[],L("savedInside2m","Saved when inside 2 m",t.savedInside2m.overall),L("conversionInside2m","Holed from inside 2 m",t.conversionInside2m),{kind:"subhead",id:"chipInsHead",text:"Chip-ins"},K("chipInsStandard","Standard",de(t.chipIns.standard)),K("chipInsHard","Hard",de(t.chipIns.hard)),...t.scrambleAttemptsBunker>0?[K("chipInsBunker","Bunker",de(t.chipIns.bunker))]:[]]}case"scoring":{const t=e.scoring;if(!t)return[];const n=i=>ne(i,2,!0);return[{kind:"subhead",id:"vsParHead",text:"Average vs par"},K("par3","Par 3",n(t.avgVsParByParGroup.par3)),K("par4","Par 4",n(t.avgVsParByParGroup.par4)),K("par5","Par 5",n(t.avgVsParByParGroup.par5)),K("doubles","Doubles or worse",ne(t.doubleBogeyPlusPerRound,2)),...t.doubleBogeyPlusHoles>0?[{kind:"subhead",id:"doubleCausesHead",text:$.doubleCausesHead},...t.doubleCauseGroups.flatMap(i=>[L(`dblGroup-${i.id}`,xf(i.id),i.share),...i.subs.map(r=>pf(`dblCause-${r.id}`,kf(r.id),r.share))])]:[],L("bounceBack","Bounce-back",t.bounceBack)]}}}function $f(s){if(!s||s.rounds===0)return"";const e=ae(s.rounds,$e);if(s.lengths.length<=1)return e;const t=s.lengths.map(n=>`${de(n.rounds)} × ${ae(n.holeCount,Z)}`).join(", ");return`${e} — ${t}`}function Sf(s){return s===18?"Best 18":s===9?"Best 9":`Best ${de(s)} holes`}const Tf=18;function Pf(s){return s.lengths.some(t=>t.holeCount!==Tf)?"scaled to 18":null}function Es(s){if(!s)return[];const e=[];s.avgVsParPer18.value!==null&&e.push({id:"avgVsPar",label:"Average vs par",value:we(s.avgVsParPer18.value,1),qualifier:Pf(s),hero:!0});for(const t of s.lengths){const n=t.best;n&&e.push({id:`best-${t.holeCount}`,label:Sf(t.holeCount),value:rs(n.vsPar),qualifier:`${de(n.strokes)} strokes`,hero:!1})}return e}function Cf(s){switch(s){case"eagleOrBetter":return"Eagle or better";case"birdie":return"Birdie";case"par":return"Par";case"bogey":return"Bogey";case"doubleBogeyPlus":return"Doubles or worse"}}function Ct(s){if(!s||s.holesScored===0)return[];const e=s.holesScored;return fc.map(t=>{const n=s.scoreTypeCounts[t];return{id:t,title:Cf(t),share:x(n,e).value,value:ie(x(n,e))??$.noValue}})}function If(s){return s===1?"This round has no data for it.":`None of these ${s} rounds has data for it.`}function _i(s){const e=(s.name??"").trim();return e||(s.courseName??"").trim()||"Round"}const ye={title:"How practice priorities work",holesCounted(s){const{attributed:e,holesScored:t,windowRounds:n}=s,i=n===0?"this round’s ":"your ";return e===0?`None of ${n===0?"this round’s":"your"} ${t} holes has the full set of answers yet, so there is nothing to show. A hole counts once it has a tee answer, a green answer and a putt answer.`:e===t?`All ${t} of ${n===0?"this round’s":"your"} holes could be fully attributed.`:`${e} of ${i}${t} holes could be fully attributed — the others are missing a tee, green or putt answer, so they are left out of every row rather than guessed at.`},fiveRows(){return"Each row is what that part of your game cost you against the Tapscore reference baseline v1 — a strokes gained-style method, worked out from the answers you tap rather than from shot distances. The five rows add up to your score against the baseline exactly; there is no leftover row."},baseline(s,e){const t=s?.baseline??jc,n=e===void 0?mt[t.cohort].tables.calibratedAt:e,i=`under “${$.filterBaseline}” in Filters`,r=ct(t.cohort),o=t.choice!=="auto"?`Measured against the ${r} reference — you picked this ${i}.`:t.handicapIndex===null?`Measured against the ${r} reference — no handicap on your profile yet. Change it ${i}.`:`Measured against the ${r} reference — matched to your ${cn(t.handicapIndex)} handicap. Change it ${i}.`,d="Each tier is one set of expected scores per hole and per lie.";return n===null?`${o} ${d} The tiers are still provisional, so treat the order of the rows as the reading and the sizes as rough.`:`${o} ${d} This tier was frozen on ${n}. Everyone on this reference is measured against the same table, so your rows can be compared with each other and with your own earlier rounds.`},per18(){return`Rows are scaled to 18 attributed holes, so a nine and an eighteen sit on the same scale. A round with fewer than ${Er} attributed holes is left out of the comparison entirely.`},total(s){const e=Ef(s.rowsPer18);if(e===null)return null;const t=we(e);return s.windowRounds===0?`The five rows add up to ${t} strokes against the baseline.`:s.windowRounds===1?`Over this round the five rows add up to ${t} strokes against the baseline.`:`Over these ${s.windowRounds} rounds the five rows add up to ${t} strokes against the baseline.`},penaltySource(s){const e=s.penaltySource;return e===void 0||e.recorded<=0?null:`Of ${ae(e.recorded,hu)} you labelled, ${de(e.tee)} came off the tee, ${de(e.approach)} on the approach and ${de(e.short)} around the green.`}};function Ef(s){if(s.length===0)return null;let e=0;for(const t of s){if(t===null)return null;e+=t}return e}function Wt(s){return{recorded:s.penaltySourceRecorded,tee:s.penaltiesTee,approach:s.penaltiesApproach,short:s.penaltiesShort}}function Yt(s){const e=[{id:"holes",title:"Holes counted",body:ye.holesCounted(s)},{id:"rows",title:"The five rows",body:ye.fiveRows()},{id:"baseline",title:"The baseline",body:ye.baseline(s)},{id:"per18",title:"Per 18 holes",body:ye.per18()}],t=ye.total(s);t!==null&&e.push({id:"total",title:"The total",body:t});const n=ye.penaltySource(s);return n!==null&&e.push({id:"penaltySource",title:$.penaltySourceInfoTitle,body:n}),e}const te={loading:"Reading the round…",noStatsInRound:"No statistics of your own in this round. Only the player whose card carried them can see them.",notSignedIn:"Sign in to see your own statistics for a round.",failedPrefix:"Could not read the round: ",holeStripHeading:"Hole by hole",waterfallHeading:"Where the round went",legendHeading:"Reading the strip",nothingRecordedOnHole:"Nothing was recorded on this hole.",noHoleStrip:"No hole-by-hole detail for this round.",waterfallHint:"Strokes lost against a fixed baseline. Positive costs you shots.",legendTee:"Dot — where the tee shot finished: green fairway, brass in play, terracotta trouble.",legendGir:"Ring — green in regulation: filled hit, hollow missed.",legendPutts:"Number — putts taken on the hole.",legendPenalty:"Flag — a penalty stroke.",legendAbsence:"Anything you did not record is left out: an empty row is a hole nobody answered, not a hole answered no."},vi={title:"Your round",seeWholeRound:"See the whole round"};function Rf(s){const e=[jr(s.date)],t=(s.courseName??"").trim();return t!==""&&t!==s.title&&e.push(t),e.push(s.holeCount===1?"1 hole":`${s.holeCount} holes`),e.join(" · ")}function da(s,e){return s===null?null:e===null?String(s):`${s} (${rs(e)})`}function Nf(s){let e=`Hole ${s.holeNumber} · par ${s.par}`;return s.lengthM!==null&&(e+=` · ${s.lengthM} m`),e}function Of(s){return s.strokes!==null?String(s.strokes):s.isPickedUp?"–":"·"}function Hf(s){return s.isPickedUp?"Picked up":s.strokes===null?null:s.vsPar===null?String(s.strokes):`${s.strokes} (${rs(s.vsPar)})`}function Mf(s){switch(s){case"fairway":return"Fairway";case"in_play":return"In play";case"trouble":return"Trouble"}}function Af(s){switch(s){case"inside_1m":return"Inside 1 m";case"1_to_2m":return"1–2 m";case"2_to_4m":return"2–4 m";case"4_to_8m":return"4–8 m";case"over_8m":return"Over 8 m";case"inside_2m":return"Inside 2 m";case"2_to_6m":return"2–6 m";case"over_6m":return"Over 6 m"}}function Bf(s){return s==="hard"?"Hard chip or pitch":"Standard chip or pitch"}function zf(s){switch(s){case"ring":return"Birdie";case"double_ring":return"Eagle";case"diamond":return"Albatross or hole in one";case"square":return"Bogey";case"double_square":return"Double bogey";case"box_badge":return"Triple bogey or worse"}}function vn(s){const e=[],t=Hf(s);return t!==null&&e.push({label:"Score",value:t}),s.doubleCause!==null&&e.push({label:"Mainly from",value:wf(s.doubleCause)}),s.tee!==null&&e.push({label:"Tee shot",value:Mf(s.tee)}),s.gir!==null&&e.push({label:"Green in regulation",value:s.gir?"Hit":"Missed"}),s.putts!==null&&e.push({label:"Putts",value:s.putts===1?"1 putt":`${s.putts} putts`}),s.firstPutt!==null&&e.push({label:"First putt",value:Af(s.firstPutt)}),s.shortGame!==null&&e.push({label:"Short game",value:Bf(s.shortGame)}),s.recoveryOk!==null&&e.push({label:"Recovery",value:s.recoveryOk?"Back in play":"Still in trouble"}),s.penalties!==null&&e.push({label:"Penalties",value:s.penalties===0?"None":s.penalties===1?"1 stroke":`${s.penalties} strokes`}),e}function Lf(s){return s===null?[]:vn(s).map(e=>({...e,key:`${s.id}:${e.label}`}))}function wi(s){const e=[`Hole ${s.holeNumber}`,`par ${s.par}`];s.isPickedUp?e.push("picked up"):s.strokes!==null?(e.push(s.strokes===1?"1 stroke":`${s.strokes} strokes`),s.marker!==null&&e.push(zf(s.marker).toLowerCase())):e.push("no score");for(const t of vn(s))t.label!=="Score"&&e.push(`${t.label.toLowerCase()} ${t.value.toLowerCase()}`);return`${e.join(", ")}.`}function ca(s,e){const t=e===1?"round":`last ${e} rounds`;if(Math.abs(s)<.05)return e===1?"The same as your previous round.":`The same as your ${t}.`;const n=s>0?"worse":"better",i=ve(Math.abs(s),1);return e===1?`${i} ${n} than your previous round.`:`${i} ${n} than your ${t}.`}function xi(s){switch(s){case"tee":return"Your tee shots";case"approach":return"Your approach play";case"shortGame":return"Your short game";case"putting":return"Putting";case"penalties":return"Penalties"}}function Rs(s,e=1){return typeof s=="number"?ve(Math.abs(s),e):""}function Oe(s){return typeof s=="number"?String(Math.round(s)):""}function ki(s){return typeof s=="string"?s:"tee"}function Ff(s){const e=s.params;switch(s.id){case"component_best_vs_baseline":return`${xi(ki(e.component))} was ${Rs(e.delta)} strokes better than your recent rounds.`;case"component_worst_vs_baseline":return`${xi(ki(e.component))} cost you ${Rs(e.delta)} strokes more than your recent rounds.`;case"penalties_spike":{const t=typeof e.penalties=="number"?Math.round(e.penalties):0;return`${t===1?"1 penalty stroke":`${t} penalty strokes`}, against ${Rs(e.baseline)} in a normal round.`}case"two_way_miss":return`Your tee misses are split ${Oe(e.left)} left and ${Oe(e.right)} right of ${Oe(e.recorded)} — you are missing both ways.`;case"scramble_streak":return`You saved par ${Oe(e.successes)} of the ${Oe(e.attempts)} times you missed the green.`;case"hard_scramble_streak":return`You saved par from all ${Oe(e.attempts)} of the hard spots you were in.`;case"three_putt_free":return`No three-putts — ${Oe(e.putts)} putts across the round.`;case"best_putting_round":{const t=typeof e.rounds=="number"?Math.round(e.rounds):0;return t===1?"Your best putting of the last round.":`Your best putting of the last ${t} rounds.`}case"bounce_back_perfect":{const t=typeof e.opportunities=="number"?Math.round(e.opportunities):0;return t===1?"You came straight back after your dropped shot.":`You came straight back after all ${t} of your dropped shots.`}}}const Gf=b(`
    <section bind="story" class="story hidden">
        <div class="story__head">
            <span bind="title" class="story__title"></span>
            <span bind="score" class="story__score"></span>
        </div>
        <ul bind="values" class="story__values"></ul>
        <div class="story__hintrow">
            <p bind="hint" class="story__hint"></p>
            ${ls}
        </div>
        <ul bind="lines" class="story__lines"></ul>
        <button bind="open" class="story__open" type="button"></button>
${bt}
    </section>
`),jf=b('<li bind="text" class="story__line"></li>'),Df=b(`
    <li class="story__value">
        <span bind="label" class="story__valuelabel"></span>
        <span bind="amount" class="story__valueamount"></span>
    </li>
`);class qf extends M{static styles=`
        .story {
            ${R()}
            display: flex; flex-direction: column; gap: ${a("sm")};
            padding: ${a("lg")};
            margin-bottom: ${a("lg")};

            &.hidden { display: none; }

            & .story__head {
                display: flex; align-items: baseline; justify-content: space-between;
                gap: ${a("md")};
            }
            & .story__title {
                font-family: ${l("font-display")};
                font-weight: 600; font-size: 1.1rem;
            }
            & .story__score {
                font-weight: 700; font-size: 1.1rem;
                font-variant-numeric: tabular-nums;
                &:empty { display: none; }
            }
            /* The five terms, stated in text. Two-up on a phone, tabular
               numerals so the signs line up. (There used to be an aria-hidden
               waterfall strip above — stretched to card width it read as a
               broken divider, and the rows already say everything it drew.) */
            & .story__values {
                margin: 0; padding: 0; list-style: none;
                display: grid; grid-template-columns: repeat(2, 1fr);
                gap: 2px ${a("md")};
                &:empty { display: none; }
            }
            & .story__value {
                display: flex; align-items: baseline; justify-content: space-between;
                gap: ${a("sm")};
            }
            & .story__valuelabel { font-size: 0.8rem; color: ${l("text-muted")}; }
            & .story__valueamount {
                font-size: 0.85rem; font-weight: 700;
                font-variant-numeric: tabular-nums;
                &.story__valueamount--absent {
                    font-weight: 400; font-size: 0.78rem; color: ${l("text-muted")};
                }
            }
            & .story__hintrow {
                display: flex; align-items: baseline; justify-content: space-between;
                gap: ${a("md")};
            }
            & .story__hint { margin: 0; font-size: 0.78rem; color: ${l("text-muted")}; }
            & .story__lines {
                margin: 0; padding: 0; list-style: none;
                display: flex; flex-direction: column; gap: ${a("xs")};
                &:empty { display: none; }
            }
            & .story__line { font-size: 0.9rem; }
            & .story__open {
                ${S()}
                align-self: flex-start;
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }
        }

${ds}
    `;round=this.inject(ge);stats=this.inject(pt);auth=this.inject(V);router=this.inject(q);colors=hs;infoOpen=new p(!1);render(){this.track(C(()=>{const i=this.eligibleRoundId();se(()=>{i!==null&&this.stats.load(i).catch(()=>{})})}));const e=()=>this.shows()?this.stats.model.get():null,t=this.wire(Gf,{story:{className:()=>this.shows()?"story":"story hidden"},title:()=>vi.title,score:()=>{const i=e();return i===null?"":da(i.strokes,i.vsPar)??""},hint:()=>e()===null?"":this.hint(),infoTrigger:{textContent:()=>$.prioritiesInfo,onclick:()=>this.infoOpen.set(!0)},infoSheet:{className:()=>this.infoOpen.get()?"stats-info":"stats-info hidden",onclick:i=>{i.target===i.currentTarget&&this.infoOpen.set(!1)}},infoTitle:()=>ye.title,infoDone:{onclick:()=>this.infoOpen.set(!1)},open:{textContent:()=>vi.seeWholeRound,onclick:()=>{const i=this.stats.roundId.get();i!==null&&this.router.navigate("/round-stats",{query:{id:i}})}}}),n=i=>{const r=e();return r===null?null:Ye(r.waterfall,i)};return this.$each(this.ref(t,"values"),()=>e()===null?[]:[...he],(i,r,o)=>this.wireEl(Df,{label:()=>as(i),amount:{textContent:()=>{const d=n(i);return d===null?$.notRecorded:we(d)},className:()=>n(i)===null?"story__valueamount story__valueamount--absent":"story__valueamount",style:()=>{const d=n(i);return d===null?"":`color:${Qe(cs(d),this.colors)}`}}},o),i=>i),this.$each(this.ref(t,"infoCards"),()=>{const i=e();return i===null?[]:Yt({attributed:i.waterfall.coverage.attributed,holesScored:i.waterfall.coverage.holesScored,windowRounds:0,rowsPer18:he.map(r=>Pe(i.waterfall,r)),penaltySource:Wt(i.panels.totals),baseline:this.stats.sgInfo.get()})},(i,r,o)=>this.wireEl(yt,{ctitle:()=>i.title,ctext:()=>i.body},o),i=>i.id),this.$each(this.ref(t,"lines"),()=>e()?.insights??[],(i,r,o)=>this.wireEl(jf,{text:()=>Ff(i)},o),i=>i.id),t}eligibleRoundId(){const e=this.round.round.get();return e===null?null:sa({signedInPlayerId:this.auth.currentUser.get()?.id??null,statConfigPlayerIds:new Set(this.round.statModules.get().keys()),statRows:this.round.statRows.get(),holesUnscored:na({playerId:this.auth.currentUser.get()?.id??"",balls:this.round.balls.get(),groups:this.round.groups(),strokesFor:(n,i)=>this.round.strokesFor(n,i)})}).reason==="eligible"?e.id:null}shows(){const e=this.eligibleRoundId();return e===null?!1:this.stats.phase.get()==="ready"&&this.stats.roundId.get()===e}hint(){const e=this.stats.model.get();if(e===null)return"";if(e.deltas===null)return te.waterfallHint;let t=null;for(const n of he){const i=ln(e.deltas,n);i!==null&&(t===null||Math.abs(i)>Math.abs(t))&&(t=i)}return t===null?te.waterfallHint:ca(t,e.windowCount)}}function $i(s){return!(!s.pageVisible||s.status==="complete")}function Vf(s,e){return e&&!s}const Uf=2,Si=3,Kf=75e3;function Wf(s,e=null){const t=new URLSearchParams({token:s});return e!==null&&t.set("since",e),`${W}/friendly-rounds/events?${t.toString()}`}function Yf(s){if(typeof s!="object"||s===null)return!1;const e=s;return e.latestEventId!==null&&typeof e.latestEventId!="string"?!1:e.status==="not_started"||e.status==="active"||e.status==="complete"}function Xf(s){const e=s.eventSourceFactory??(B=>new EventSource(B)),t=s.setTimer??((B,U)=>setTimeout(B,U)),n=s.clearTimer??(B=>clearTimeout(B)),i=s.livenessTimeoutMs??Kf,r=s.isPageVisible??(()=>typeof document>"u"||!document.hidden);let o=!1,d=0,c=null,u=null,h=s.since??null;const f=()=>{u!==null&&(n(u),u=null)},m=()=>{f(),u=t(k,i)},_=()=>{c!==null&&(c.onopen=null,c.onmessage=null,c.onerror=null,c.close(),c=null)},g=()=>{o=!0,f(),_()},v=()=>{if(_(),++d>=Si){g(),s.onDegrade();return}N()};function k(){if(!o){if(!r()){m();return}v()}}function N(){if(o)return;let B;try{B=e(Wf(s.token,h))}catch{g(),s.onDegrade();return}c=B,B.onopen=()=>{d=0},B.onmessage=U=>{if(o||c!==B)return;m();let O;try{O=JSON.parse(U.data)}catch{return}Yf(O)&&(O.latestEventId!==null&&(h=O.latestEventId),s.onEvent({latestEventId:O.latestEventId,status:O.status}))},B.onerror=()=>{o||c!==B||(B.readyState===Uf||++d>=Si)&&(g(),s.onDegrade())},m()}return N(),{stop:()=>{o||g()}}}const Qf=2e4;function Jf(s){if(!(s===null||s===""))return/^\d+$/.test(s)?Number(s):s}const Zf=b(`
    <div class="round-view">
        <div bind="main" class="round-view__main">
            <button bind="back" class="round-view__back" type="button">← Home</button>
            <div bind="notfound" class="round-view__notfound">That share link didn't lead to a round.</div>
            <div bind="body" class="round-view__body">
                <header class="round-view__head">
                    <div class="round-view__titles">
                        <h1 bind="title"></h1>
                        <span bind="course" class="round-view__course"></span>
                    </div>
                    <div class="round-view__chrome">
                        <button bind="manageBtn" class="round-view__manage" type="button" aria-label="Manage round">⋯</button>
                    </div>
                </header>
                <div class="round-view__formats" bind="formats"></div>

                <div bind="scorePanel" class="round-view__panel">
                    <div bind="hcpCheckin"></div>
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
                    <div bind="story"></div>
                    <div bind="leaderboard"></div>
                </div>
            </div>
        </div>

        <div bind="manageHost"></div>
        <div bind="finishHost"></div>

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
`),em=b('<button bind="pill" class="round-view__fmt" type="button"></button>'),tm=b('<button bind="pill" class="round-view__grp" type="button"></button>');class sm extends M{static styles=`
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

            /* ONE band, not three. The title, the status and the manage
               affordance used to stack over a separate meta row, which spent a
               third of a phone screen on chrome before the first score. They
               are one row now, and the title itself is small (Golf GameBook's
               header, the owner's reference): the round's NAME with the course
               under it, rather than a 1.8rem course name and nothing else. */
            & .round-view__head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: ${a("md")};

                & .round-view__titles {
                    min-width: 0;
                }

                & h1 {
                    margin: 0;
                    font-family: ${l("font-display")};
                    font-weight: 600;
                    font-size: 1.2rem;
                    letter-spacing: -0.02em;
                    color: ${l("text")};
                }

                /* The COURSE, and nothing else. The date is in the round list
                   (and, for a round that kept its default name, in the title
                   itself); the hole count is in the dock at the bottom of this
                   very screen. */
                & .round-view__course {
                    display: block;
                    color: ${l("text-muted")};
                    font-size: 0.8rem;
                }
            }

            /* Header chrome: the "⋯" manage affordance, which is the single
               entry point to every round-level management action (edit / leave
               / finish / delete). It lives HERE, not in the score panel, so it
               is reachable from both tabs. */
            & .round-view__chrome {
                display: flex;
                align-items: center;
                gap: ${a("xs")};
                flex-shrink: 0;
            }

            & .round-view__manage {
                &.hidden { display: none; }
                width: 44px;
                height: 44px;
                flex-shrink: 0;
                background: none;
                border: none;
                border-radius: ${l("radius-pill")};
                font-family: inherit;
                font-size: 1.5rem;
                line-height: 1;
                color: ${l("text-muted")};
                cursor: pointer;

                &:hover, &:active { background: ${l("surface-sunken")}; color: ${l("text")}; }
                &:focus-visible { outline: 2px solid ${l("accent")}; outline-offset: 2px; }
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
                ${R()}
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
                    ${re()}
                    flex: 1;
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
    `;svc=this.inject(ge);router=this.inject(q);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new p(this.initPos.tab);pageVisible=new p(!document.hidden);hasRound=new T(()=>this.svc.round.get()!==null);hasScoring=new T(()=>this.svc.balls.get().length>0);manageOpen=new p(!1);shareUrl=new T(()=>{const e=this.tokenQ.get(),t="/tapscore/".replace(/\/+$/,"");return e?`${location.origin}${t}/round?token=${e}`:""});render(){this.track(C(()=>{const f=this.tokenQ.get();f&&this.svc.loadByToken(f,this.initPos).then(()=>{this.svc.loadResult()})}));const e=()=>{this.svc.flushPending()};window.addEventListener("online",e),this.track(()=>window.removeEventListener("online",e));let t=null,n=null,i=null,r=!1;const o=f=>!r&&$i({pageVisible:f,status:this.svc.round.get()?.status??null}),d=()=>{const f=!document.hidden,m=Vf(this.pageVisible.get(),f),_=o(f);this.pageVisible.set(f),m&&this.tokenQ.get()&&this.svc.refreshAll({feedWillReconnect:_})};document.addEventListener("visibilitychange",d),this.track(()=>document.removeEventListener("visibilitychange",d));const c=()=>{i!==null&&(clearInterval(i),i=null)},u=()=>{i===null&&(i=setInterval(()=>{this.svc.pollResult(),this.svc.refreshScorecard()},Qf))};this.track(C(()=>{const f=this.tokenQ.get()||null,m=$i({pageVisible:this.pageVisible.get(),status:this.svc.round.get()?.status??null});if(n!==f&&(t?.stop(),t=null,n=null,c(),r=!1),!m){t?.stop(),t=null,n=null,c(),r=!1;return}if(r){u();return}if(t===null&&f){n=f;try{const _=Xf({token:f,since:this.svc.persistedCursor(f),onEvent:g=>this.svc.onLiveResultEvent(g),onDegrade:()=>{t=null,r=!0,u()}});r||(t=_)}catch{t=null,r=!0,u()}}})),this.track(()=>{t?.stop(),t=null,n=null,c()}),this.track(C(()=>{const f=this.tab.get(),m=this.svc.selectedSlotDefId(),_=this.svc.holeIdx.get();if(this.router.route.get()!=="/round"||!this.hasRound.get())return;const g=this.tokenQ.get();if(!g)return;const v={token:g};f==="leaderboard"&&(v.tab="board");const k=this.svc.round.get()?.formatSlots[0]?.slotDefId??null;m&&m!==k&&(v.slot=m),_>0&&(v.hole=_+1),this.router.navigate(this.router.route.get(),{replace:!0,query:v})}));const h=this.wire(Zf,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},title:()=>ia(this.svc.round.get()),course:()=>this.svc.round.get()?.courseNameSnapshot??"",scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},groupTabs:{className:()=>this.svc.groups().length>1?"round-view__groups":"round-view__groups hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},manageBtn:{className:()=>this.hasRound.get()?"round-view__manage":"round-view__manage hidden",onclick:()=>this.manageOpen.set(!0)},dock:{className:()=>this.hasRound.get()&&!this.svc.keypadOpen.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const f=this.svc.currentPlayedHole();return f?this.svc.occLabel(f.playHoleId):""},holeSi:()=>{const f=this.svc.currentPlayHole()?.baseStrokeIndex;return f!=null?String(f):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});return this.$each(this.ref(h,"groupTabs"),new T(()=>this.svc.groups()),(f,m,_)=>this.groupPill(m,_),f=>f.id),this.$each(this.ref(h,"formats"),new T(()=>this.svc.round.get()?.formatSlots??[]),(f,m,_)=>this.slotPill(f,m,_),f=>f.slotDefId),this.spawn(Sp,this.ref(h,"hcpCheckin")),this.spawn(Th,this.ref(h,"scoring")),this.spawn(qf,this.ref(h,"story")),this.spawn(yn,this.ref(h,"leaderboard")),this.spawn(mp,this.ref(h,"seats")),this.spawn(op,this.ref(h,"claim")),this.spawn(vp,this.ref(h,"join")),this.spawn(Cp,this.ref(h,"manageHost"),{open:this.manageOpen}),this.spawn(Lp,this.ref(h,"finishHost")),h}readUrlPosition(){const e=new URLSearchParams(location.search),t=e.get("slot"),n=Number(e.get("hole"));return{tab:e.get("tab")==="board"?"leaderboard":"score",selectedSlot:Jf(t),holeIdx:Number.isFinite(n)&&n>0?n-1:void 0}}groupPill(e,t){return this.wireEl(tm,{pill:{textContent:()=>{const n=this.svc.groups()[e];if(!n)return`Group ${e+1}`;const i=[`Group ${e+1}`];n.startTime.includes(":")&&i.push(n.startTime);const r=this.svc.playHoleById(n.startPlayHoleId)?.courseHoleNumber;return r!==void 0&&n.startOrdinal!==1&&i.push(`H${r}`),i.join(" · ")},className:()=>this.svc.groupIdx.get()===e?"round-view__grp active":"round-view__grp",onclick:()=>this.svc.groupIdx.set(e)}},t)}slotPill(e,t,n){return this.wireEl(em,{pill:{textContent:()=>pn(e),className:()=>this.svc.selectedSlotDefId()===e.slotDefId?"round-view__fmt active":"round-view__fmt",onclick:()=>this.svc.selectSlot(e.slotDefId)}},n)}}function ua(s){return s.formatIndex??s.slotIndex??null}function nm(s,e){return s.filter(t=>ua(t)===e)}function im(s){return s.filter(e=>!e.path?.startsWith("producers")&&!e.path?.startsWith("playingGroups")&&e.path!=="route"&&ua(e)===null)}function He(s){return`${s} ${s===1?"player":"players"}`}function It(s,e){const t=s.formatId?e(s.formatId)??s.formatId:null,n=s.teamLabel;switch(s.code){case"team_size_above_max":if(t&&n&&s.actual!==void 0&&s.allowedMax!==void 0)return`${n} has ${He(s.actual)} — ${t} allows at most ${s.allowedMax} per team.`;break;case"team_size_below_min":if(t&&n&&s.actual!==void 0&&s.allowedMin!==void 0)return`${n} has ${He(s.actual)} — ${t} needs at least ${s.allowedMin} per team.`;break;case"empty_team_grouping":if(t&&n)return`${n} has no players — add at least one, or remove the team.`;break;case"team_count_above_max":if(t&&s.actual!==void 0&&s.allowedMax!==void 0)return`${s.actual} teams — ${t} allows at most ${s.allowedMax}.`;break;case"team_count_below_min":if(t&&s.actual!==void 0&&s.allowedMin!==void 0)return`${s.actual} teams — ${t} needs at least ${s.allowedMin}.`;break;case"slot_ball_count_above_max":if(t&&s.actual!==void 0&&s.allowedMax!==void 0)return`${He(s.actual)} in ${t} — it scores at most ${s.allowedMax}.`;break;case"slot_ball_count_below_min":if(t&&s.actual!==void 0&&s.allowedMin!==void 0)return`${He(s.actual)} in ${t} — it needs at least ${s.allowedMin}.`;break;case"slot_ball_count_not_multiple":if(t&&s.actual!==void 0)return`${t} pairs its balls, so it needs an even number — ${He(s.actual)} won't pair up.`;break;case"missing_team_grouping":if(t)return`${t} compares teams — under Teams, group the players into “Own ball each, scored together as a team” teams, then tick them under “Scores”.`;break;case"ball_mode_violation":if(t&&s.actual!==void 0)return s.actual>1?`${t} is played with everyone on their own ball — a team sharing one ball can’t play it. Use an “Own ball each, scored together as a team” team instead.`:`${t} is played on one shared team ball — under Teams, group the players into a “Share one ball” team, then tick that team instead of the individual players.`;break;case"producer_count_violation":if(t&&s.actual!==void 0&&s.allowedMin!==void 0&&s.allowedMax!==void 0){if(s.allowedMax===1&&s.actual>1)return`${t} is played with everyone on their own ball — a team sharing one ball can’t play it. Use an “Own ball each, scored together as a team” team instead.`;const i=s.allowedMin===s.allowedMax?`exactly ${He(s.allowedMin)}`:`${s.allowedMin}–${s.allowedMax} players`;return`A ball in ${t} has ${He(s.actual)} — it needs ${i} per ball.`}break;case"producer_has_scores":return s.message;case"scored_ball_orphaned":return s.message;case"scored_hole_removed":return"This route drops holes that already have scores on them. Keep those holes on the route — the course and the start hole can still change.";case"competition_route_locked":return"This round is part of a competition — its course and holes are set by the organizer and cannot be changed here.";case"round_complete":return"This round is complete — its setup can no longer be edited.";case"not_editable":return"This round can no longer be edited."}return s.message}function rm(s){return s?s.type==="flat"?String(s.pct):s.bands.length>0?String(s.bands[0].pct):"100":"100"}function am(s){const e={};if(!s||typeof s!="object")return e;for(const[t,n]of Object.entries(s))typeof n=="string"&&(e[t]=n);return e}function om(s){const e=s.roundType;if(e==="full_18"||e==="front_9"||e==="back_9")return{preset:e,startHole:lm(s)};const t=(s.route?.playHoles??[]).map(o=>o.courseHoleNumber),n=t[0]??1,i=new Set(t);return{preset:t.length<=9&&[...i].every(o=>o<=9)?"front_9":t.length<=9&&[...i].every(o=>o>=10)?"back_9":"full_18",startHole:n}}function lm(s){return s.roundType==="back_9"?10:1}function dm(s,e=()=>"",t=new Set){let n=1,i=1,r=1,o=1;const d=new Map,c=s.producers.map(v=>{const k=n++;d.set(v.producerDefId,k);const N=v.playerRef.kind==="guest";return{key:k,name:e(v.producerDefId),handicapIndex:Vt(v.handicapIndex),gender:v.gender??"M",teeId:v.teeId,producerDefId:v.producerDefId,...N?{guestPlayerId:v.playerRef.id,guestOriginalName:e(v.producerDefId)}:{playerId:v.playerRef.id,genderKnown:v.gender!=null}}}),u=new Map;(s.teams??[]).forEach(v=>{u.set(v.id,i++)});const h=(s.teams??[]).map(v=>{const k=u.get(v.id),N={},B={},U=[];for(const ce of v.members)if("producerDefId"in ce){const ue=d.get(ce.producerDefId);ue!==void 0&&(N[ue]=String(ce.allowancePct),U.push(ue))}else{const ue=u.get(ce.teamId);ue!==void 0&&(B[ue]=!0)}const O=v.kind??"single_ball",ee=O==="single_ball"&&v.formation!==void 0&&t.has(v.formation)&&Object.keys(B).length===0&&U.length>=2;return{key:k,kind:O,formation:v.formation??"scramble",pctByPlayer:N,memberTeams:B,autoCreated:!1,...ee?{section:!0,customized:!0,memberOrder:U,pctTextByPlayer:{}}:{}}}),f=(s.playingGroups??[]).map(v=>{const k={};for(const N of v.members){const B=d.get(N);B!==void 0&&(k[B]=!0)}return{key:r++,startTime:v.startTime??"",startHole:v.startHole??null,members:k}}),m=s.formats.map(v=>{const k={},N={},B=v.subjects;if(B){const U=new Set;for(const O of B)if(O.kind==="player"){const ee=d.get(O.producerDefId);ee!==void 0&&U.add(ee)}else{const ee=u.get(O.teamId);ee!==void 0&&(N[ee]=!0)}for(const O of c)k[O.key]=U.has(O.key)}for(const U of u.values())N[U]===void 0&&(N[U]=!1);return{key:o++,formatId:v.formatId,allowancePct:rm(v.allowanceConfig),subjectPlayers:k,subjectTeams:N,config:am(v.formatConfig)}}),{preset:_,startHole:g}=om(s);return{courseId:s.courseId,preset:_,startHole:g,players:c,teams:h,groups:f,formatSlots:m,nextKey:n,nextTeamKey:i,nextGroupKey:r,nextSlotKey:o}}function cm(s){return s.toLowerCase().startsWith("sv")?"Spel":"Game"}function um(s,e){return new Intl.DateTimeFormat(e,{dateStyle:"medium"}).format(s)}function hm(s=new Date,e=typeof navigator>"u"?"en":navigator.language,t=[]){const n=`${cm(e)} ${um(s,e)}`,i=new Set(t.map(r=>r.trim().toLowerCase()).filter(r=>r.length>0));if(!i.has(n.toLowerCase()))return n;for(let r=2;r<=99;r++){const o=`${n} (${r})`;if(!i.has(o.toLowerCase()))return o}return n}const Ns={svart:0,black:0,vit:1,white:1,gul:2,yellow:2,blå:3,bla:3,blue:3,röd:4,rod:4,red:4,orange:5};function Ys(s){const e=s.name.trim().toLocaleLowerCase("sv-SE"),t=s.colour?.trim().toLocaleLowerCase("sv-SE")??"",n=e.split(/\s+/)[0]??"",i=Ns[e]??Ns[n]??Ns[t];if(i!==void 0)return{kind:"colour",rank:i};const r=/^(\d+(?:[.,]\d+)?)\s*(?:m)?$/i.exec(e);return r?{kind:"numeric",length:Number(r[1].replace(",","."))}:{kind:"other"}}function ha(s){return s.map((e,t)=>({tee:e,index:t,classification:Ys(e)})).sort((e,t)=>{const n={numeric:0,colour:1,other:2};return e.classification.kind!==t.classification.kind?n[e.classification.kind]-n[t.classification.kind]:e.classification.kind==="numeric"&&t.classification.kind==="numeric"?t.classification.length-e.classification.length||e.index-t.index:e.classification.kind==="colour"&&t.classification.kind==="colour"?e.classification.rank-t.classification.rank||e.index-t.index:e.tee.name.localeCompare(t.tee.name,"sv-SE",{sensitivity:"base"})||e.index-t.index}).map(({tee:e})=>e)}function pa(s,e){return s.ratings.some(t=>t.gender===e)}function pm(s,e,t,n){const i=e.find(o=>o.roleKey===t&&o.gender===n)?.teeId,r=s.find(o=>o.id===i);return r&&pa(r,n)?r:null}function Ti(s,e,t,n=null){const i=[n,"club"].filter((c,u,h)=>!!c&&h.indexOf(c)===u);for(const c of i){const u=pm(s,e,c,t);if(u)return u.id}const r=t==="M"?2:4,o=ha(s.filter(c=>pa(c,t))),d=o.find(c=>{const u=Ys(c);return u.kind==="colour"&&u.rank===r});return d?d.id:o.length===0?"":o.every(c=>Ys(c).kind==="numeric")&&t==="M"?o[0].id:o.at(-1).id}const fm=["scramble","greensomes","foursomes","custom"],fe=2,mm="ABCDEFGH";function Pi(s){if(s===void 0)return null;const e=s.trim().replace(",",".");if(e==="")return null;const t=Number(e);return Number.isFinite(t)?Math.min(100,Math.max(0,t)):null}function gm(s,e){return s.length===e.length&&s.every((t,n)=>t===e[n])}function Ci(s,e){const t=Object.keys(s),n=Object.keys(e);return t.length===n.length&&t.every(i=>s[Number(i)]===e[Number(i)])}const bm={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class ym{loading=new p(!1);error=new p(null);courses=new p([]);tees=new p([]);courseTeeRoles=new p([]);maleDefaultTeeId=new p("");femaleDefaultTeeId=new p("");organizerPreferredRole={};defaultTouched={M:!1,F:!1};roundName=new p("");courseId=new p("");preset=new p("full_18");startHole=new p(1);players=new p([]);teams=new p([]);groups=new p([]);formatSlots=new p([]);picked=new p([]);customOpen=new p(!1);submitting=new p(!1);diagnostics=new p([]);submitError=new p(null);editToken=new p(null);hasScores=new p(!1);competitionRound=new p(!1);editBaseline=null;editStatus=new p(null);editBlockedReason=new p(null);editPlayedAt=null;catalog=Y.get(We);formationCatalog=Y.get(Fl);ballTeamsOpen=new p(!1);ballTeamNotices=new p({});lastFormation=null;nextKey=1;nextSlotKey=1;nextTeamKey=1;nextGroupKey=1;nextPickKey=1;reset(){this.courses.set([]),this.tees.set([]),this.courseTeeRoles.set([]),this.maleDefaultTeeId.set(""),this.femaleDefaultTeeId.set(""),this.organizerPreferredRole={},this.defaultTouched={M:!1,F:!1},this.roundName.set(""),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.groups.set([]),this.formatSlots.set([]),this.picked.set([]),this.customOpen.set(!1),this.ballTeamsOpen.set(!1),this.ballTeamNotices.set({}),this.lastFormation=null,this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.editToken.set(null),this.hasScores.set(!1),this.competitionRound.set(!1),this.editBaseline=null,this.editStatus.set(null),this.editBlockedReason.set(null),this.editPlayedAt=null,this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1,this.nextGroupKey=1,this.nextPickKey=1}async load(){this.seedDefaultName(),this.catalog.load().then(()=>this.ensureDefaultGame()),this.formationCatalog.load();const e=await F(this.loading,this.error,()=>w.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}seedDefaultName(e=new Date){if(this.roundName.get()!=="")return;const t=Jt().map(n=>n.name??"").filter(n=>n!=="");this.roundName.set(hm(e,void 0,t))}async loadForEdit(e){this.reset(),this.editToken.set(e),await this.catalog.load(),await this.formationCatalog.load();const t=await F(this.loading,this.error,()=>w.friendlyRounds.setup({token:e}));if(!t)return;if(this.editStatus.set(t.status),!t.editable){this.editBlockedReason.set(t.reason);return}if(t.draft.producers.some(c=>"placeholder"in c)){this.editBlockedReason.set("has_open_seats");return}this.hasScores.set(t.hasScores),this.competitionRound.set(t.competitionRound===!0),this.editPlayedAt=t.draft.playedAt,this.roundName.set(t.draft.name??"");const n=await F(this.loading,this.error,()=>w.setup.courses());n&&this.courses.set(n);const i=await F(this.loading,this.error,()=>w.setup.teesByCourse({courseId:t.draft.courseId}));this.tees.set(i??[]);const r=await F(this.loading,this.error,()=>w.friendlyRounds.balls({token:e})),o=new Map;for(const c of r??[])for(const u of c.players)o.set(u.producerDefId,u.displayName);const d=dm(t.draft,c=>o.get(c)??"",this.formationCatalog.ids());this.courseId.set(d.courseId),this.preset.set(d.preset),this.startHole.set(d.startHole),this.players.set(d.players.map(c=>({...c,teeOverridden:!0}))),this.teams.set(d.teams),this.groups.set(d.groups),this.formatSlots.set(d.formatSlots),this.picked.set([]),this.customOpen.set(!0),this.nextKey=d.nextKey,this.nextTeamKey=d.nextTeamKey,this.nextGroupKey=d.nextGroupKey,this.nextSlotKey=d.nextSlotKey,this.editBaseline={courseId:d.courseId,preset:d.preset,startHole:d.startHole}}scoredRouteChange(){const e=this.editBaseline;return e===null||!this.hasScores.get()?!1:e.courseId!==this.courseId.get()||e.preset!==this.preset.get()||e.startHole!==this.startHole.get()}async selectCourse(e){this.courseId.set(e),this.editToken.get()===null&&(this.preset.set("full_18"),this.startHole.set(1));const[t,n]=await Promise.all([F(this.loading,this.error,()=>w.setup.teesByCourse({courseId:e})),w.setup.teeRolesByCourse?.({courseId:e}).catch(()=>[])??Promise.resolve([])]),i=ha(t??[]);this.tees.set(i),this.courseTeeRoles.set(n),this.defaultTouched={M:!1,F:!1},this.recomputeRoundDefaults();const r=new Set(i.map(o=>o.id));this.players.set(this.players.get().map(o=>({...o,teeId:o.teeOverridden&&r.has(o.teeId)?o.teeId:this.defaultTeeId(o.gender),teeOverridden:o.teeOverridden&&r.has(o.teeId)}))),this.players.get().length===0&&this.addPlayer(),this.reseedBallTeams()}addPlayer(){const e=this.defaultTeeId("M");this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e,teeOverridden:!1}]),this.syncGamesToRoster()}addMe(e){this.addFriend(e)}addFriend(e){if(this.hasPlayer(e.id))return;const t=e.gender??"M";this.players.set([...this.players.get(),{key:this.nextKey++,name:e.displayName,handicapIndex:e.handicapIndex===null?"":Vt(e.handicapIndex),gender:t,genderKnown:e.gender!=null,teeId:this.defaultTeeId(t),teeOverridden:!1,playerId:e.id}]),this.syncGamesToRoster()}seedSelf(e){if(this.editToken.get()!==null)return;const t=this.players.get();if(!(t.length>1)){if(t.length===1){const n=t[0];if(n.playerId!=null||n.name.trim()!=="")return;this.players.set([])}this.addFriend(e)}}hasPlayer(e){return this.players.get().some(t=>t.playerId===e)}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e)),this.groups.set(this.groups.get().map(t=>{if(t.members[e]===void 0)return t;const n={...t.members};return delete n[e],{...t,members:n}})),this.reseedBallTeams(),this.syncGamesToRoster(),this.syncGamesToBallUnits()}patchPlayer(e,t){this.players.set(this.players.get().map(n=>{if(n.key!==e)return n;const i={...n,...t};return t.gender&&t.gender!==n.gender&&!n.teeOverridden&&(i.teeId=this.defaultTeeId(t.gender)),i})),this.reseedBallTeams()}setOrganizerPreferredTeeRole(e,t){e&&(this.organizerPreferredRole[e]=t,this.defaultTouched[e]||this.applyRoundDefault(e))}defaultTeeId(e){return(e==="M"?this.maleDefaultTeeId.get():this.femaleDefaultTeeId.get())||Ti(this.tees.get(),this.courseTeeRoles.get(),e)}setRoundDefaultTee(e,t){t!==this.defaultTeeId(e)&&(this.defaultTouched[e]=!0,e==="M"?this.maleDefaultTeeId.set(t):this.femaleDefaultTeeId.set(t),this.players.set(this.players.get().map(n=>n.gender===e&&!n.teeOverridden?{...n,teeId:t}:n)),this.reseedBallTeams())}setPlayerTee(e,t){this.patchPlayer(e,{teeId:t,teeOverridden:!0})}recomputeRoundDefaults(){this.applyRoundDefault("M"),this.applyRoundDefault("F")}applyRoundDefault(e){const t=Ti(this.tees.get(),this.courseTeeRoles.get(),e,this.organizerPreferredRole[e]??null);e==="M"?this.maleDefaultTeeId.set(t):this.femaleDefaultTeeId.set(t),this.players.set(this.players.get().map(n=>n.gender===e&&!n.teeOverridden?{...n,teeId:t}:n))}ensureDefaultGame(){if(this.editToken.get()||this.formatSlots.get().length>0||this.picked.get().length>0||this.catalog.byId("stableford_individual")&&(this.pickGame("stableford_individual"),this.formatSlots.get().length>0))return;const e=this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",n={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{},config:this.defaultConfigFor(t)};this.formatSlots.set([...this.formatSlots.get(),n])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}defaultConfigFor(e){return{...this.catalog.byId(e)?.defaults.formatConfig??{}}}setSlotConfig(e,t,n){const i=this.slotByKey(e);i&&this.patchFormatSlot(e,{config:{...i.config,[t]:n}})}slotConfigValue(e,t){return this.slotByKey(e)?.config[t.key]??t.default}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(n=>n.key===e?{...n,...t}:n))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t,config:this.defaultConfigFor(t)})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return mm[e]??`T${e+1}`}presetGames(){return this.catalog.presets()}shapeOfGame(e){const t=this.catalog.byId(e);return t?this.catalog.playableShape(t):null}isIndividualShape(e){return e.size.max===1&&e.count.max===void 0}isIndividualGame(e){const t=this.shapeOfGame(e);return t?this.isIndividualShape(t):!1}minPlayersFor(e){const t=this.shapeOfGame(e);return!t||this.isIndividualShape(t)?0:t.count.min*t.size.min}fitOf(e){const t=this.shapeOfGame(e),n=this.players.get().length;return!t||this.isIndividualShape(t)||this.liveSectionTeams().length===0?{unitJudged:!1,available:n,min:this.minPlayersFor(e),noun:"players",sharing:0}:this.isSideFormat(e)?{unitJudged:!0,available:this.soloPlayers().length,min:t.count.min*t.size.min,noun:"players on their own balls",sharing:this.sharedBallPlayerCount()}:{unitJudged:!0,available:this.ballUnits().length,min:t.count.min,noun:"balls",sharing:0}}gameFits(e){const t=this.fitOf(e);return t.available>=t.min}gameNeedsText(e){const t=this.fitOf(e);if(!t.unitJudged){const i=Math.max(0,t.min-t.available);return`Needs ${t.min} players — add ${i} more.`}const n=t.sharing>0?` — ${t.sharing} ${t.sharing===1?"is":"are"} sharing balls`:"";return`Needs at least ${t.min} ${t.noun}${n}.`}gameShapeText(e){const t=this.shapeOfGame(e);if(!t)return"";if(this.isIndividualShape(t))return"Everyone plays their own ball";const n=t.count.max===t.count.min?`${t.count.min} balls`:`${t.count.min}+ balls`,i=t.size.max===1?"one player each":t.size.min===t.size.max?`${t.size.min} players each`:t.size.min===1?"each a player or a team":`${t.size.min}–${t.size.max} players each`;return`${n} · ${i}`}isGamePicked(e){return this.picked.get().some(t=>t.formatId===e)}pickedByKey(e){return this.picked.get().find(t=>t.key===e)??null}gameLabel(e){return this.catalog.labelOf(e)??e}toggleGame(e){const t=this.picked.get().find(n=>n.formatId===e);t?this.unpickGame(t.key):this.pickGame(e)}pickGame(e){const t=this.shapeOfGame(e);if(!t||this.isGamePicked(e)||!this.gameFits(e))return;const n=this.unitAssignment(e,t);if(n){const o={key:this.nextPickKey++,formatId:e,...n};this.picked.set([...this.picked.get(),o]),this.regenerateGame(o);return}const i=this.isIndividualShape(t)?null:this.adoptableTeams(t),r=i?{key:this.nextPickKey++,formatId:e,ballCount:i.length,ballByPlayer:this.assignmentFromTeams(i),ballTeams:Object.fromEntries(i.map((o,d)=>[d,o.key]))}:{key:this.nextPickKey++,formatId:e,ballCount:this.isIndividualShape(t)?0:t.count.min,ballByPlayer:this.defaultAssignment(t,this.isIndividualShape(t)?0:t.count.min),ballTeams:{}};this.picked.set([...this.picked.get(),r]),this.regenerateGame(r)}adoptableTeams(e){const t=this.teams.get().filter(i=>i.kind==="multi_ball");if(t.length===0||t.length<e.count.min||e.count.max!==void 0&&t.length>e.count.max)return null;const n=new Set;for(const i of t){const r=this.teamMemberCount(i.key);if(r<e.size.min||r>e.size.max)return null;for(const o of Object.keys(i.pctByPlayer)){if(n.has(Number(o)))return null;n.add(Number(o))}}return t}assignmentFromTeams(e){const t={};for(const n of this.players.get()){const i=e.findIndex(r=>r.pctByPlayer[n.key]!==void 0);i>=0&&(t[n.key]=i)}return t}unpickGame(e){this.picked.set(this.picked.get().filter(t=>t.key!==e)),this.formatSlots.set(this.formatSlots.get().filter(t=>t.gameKey!==e)),this.collectUnreferencedTeams()}collectUnreferencedTeams(){const e=new Set;for(const n of this.formatSlots.get())for(const[i,r]of Object.entries(n.subjectTeams))r&&e.add(Number(i));for(const n of this.picked.get())for(const i of Object.values(n.ballTeams))e.add(i);const t=this.teams.get().filter(n=>!n.autoCreated||e.has(n.key));t.length!==this.teams.get().length&&this.teams.set(t)}defaultAssignment(e,t,n=this.players.get()){const i={};if(t<=0)return i;const r=n.length%t===0?n.length/t:e.size.min,o=Math.max(1,Math.min(r,e.size.max));let d=0;for(let c=0;c<t&&d<n.length;c++)for(let u=0;u<o&&d<n.length;u++,d++)i[n[d].key]=c;return i}gameBalls(e){const t=this.pickedByKey(e);return t?Array.from({length:t.ballCount},(n,i)=>i):[]}ballOf(e,t){const n=this.pickedByKey(e)?.ballByPlayer[t];return n===void 0?null:n}assignBall(e,t,n){const i=this.pickedByKey(e);if(!i)return;const r={...i.ballByPlayer},o=this.liveSectionTeams().find(c=>c.pctByPlayer[t]!==void 0),d=o?this.ballTeamMemberKeys(o):[t];for(const c of d)n===null?delete r[c]:r[c]=n;this.applyGameEdit({...i,ballByPlayer:r})}applyGameEdit(e){this.picked.set(this.picked.get().map(t=>t.key===e.key?e:t)),this.regenerateGame(e),this.syncGamesFromTeams(e.key)}syncGamesFromTeams(e){const t=new Map(this.teams.get().map(r=>[r.key,r])),n=[],i=this.picked.get().map(r=>{if(r.key===e)return r;const o={...r.ballByPlayer};let d=!1;for(const[u,h]of Object.entries(r.ballTeams)){const f=t.get(h);if(!f)continue;const m=Number(u);for(const[_,g]of Object.entries(o)){const v=Number(_);g===m&&f.pctByPlayer[v]===void 0&&(delete o[v],d=!0)}for(const _ of Object.keys(f.pctByPlayer)){const g=Number(_);o[g]!==m&&(o[g]=m,d=!0)}}if(!d)return r;const c={...r,ballByPlayer:o};return n.push(c),c});this.picked.set(i);for(const r of n)this.regenerateGame(r)}forkGame(e){const t=this.pickedByKey(e);if(!t)return;const n=this.teams.get(),i={},r=[];let o=-1;for(const[c,u]of Object.entries(t.ballTeams)){const h=n.findIndex(m=>m.key===u);if(h<0)continue;const f=n[h];if(this.isSectionTeam(f)){i[Number(c)]=f.key;continue}r.push({...f,key:this.nextTeamKey++,pctByPlayer:{...f.pctByPlayer},memberTeams:{...f.memberTeams},autoCreated:!0}),i[Number(c)]=r.at(-1).key,h>o&&(o=h)}this.teams.set([...n.slice(0,o+1),...r,...n.slice(o+1)]);const d={...t,ballTeams:i};this.picked.set(this.picked.get().map(c=>c.key===e?d:c)),this.regenerateGame(d)}canAddBall(e){const t=this.pickedByKey(e);if(!t||t.ballCount===0)return!1;const n=this.shapeOfGame(t.formatId);return!!n&&(n.count.max===void 0||t.ballCount<n.count.max)}addBall(e){const t=this.pickedByKey(e);!t||!this.canAddBall(e)||this.applyGameEdit({...t,ballCount:t.ballCount+1})}slotForGame(e){return this.formatSlots.get().find(t=>t.gameKey===e)??null}ballMembers(e,t){const n=this.pickedByKey(e);return n?this.players.get().filter(i=>n.ballByPlayer[i.key]===t):[]}sittingOut(e){const t=this.pickedByKey(e);return!t||t.ballCount===0?[]:this.players.get().filter(n=>t.ballByPlayer[n.key]===void 0)}regenerateGame(e){const t=this.shapeOfGame(e.formatId);if(!t)return;const n=this.players.get(),i={},r={},o=[];let d=this.teams.get();for(let m=0;m<e.ballCount;m++){const _=n.filter(O=>e.ballByPlayer[O.key]===m),g=e.ballTeams[m];if(_.length===0){g!==void 0&&(r[m]=g);continue}if(_.length===1&&t.size.min===1){i[_[0].key]=!0,g!==void 0&&(r[m]=g);continue}const v=d.find(O=>O.key===e.ballTeams[m]);if(v&&this.isSectionTeam(v)){const O=this.ballTeamMemberKeys(v);if(O.length===_.length&&_.every(ce=>O.includes(ce.key))){r[m]=v.key,o.push(v.key);for(const ce of O)i[ce]=!1;continue}}const k=v&&!this.isSectionTeam(v)?v:void 0,N=Object.fromEntries(_.map(O=>[O.key,k?.pctByPlayer[O.key]??"100"]));if(k){d=d.map(O=>O.key===k.key?{...O,kind:"multi_ball",pctByPlayer:N}:O),r[m]=k.key,o.push(k.key);continue}const B={key:this.nextTeamKey++,kind:"multi_ball",formation:"custom",pctByPlayer:N,memberTeams:{},autoCreated:!0},U=this.lastTeamIndexOf(d,r,e);d=[...d.slice(0,U+1),B,...d.slice(U+1)],r[m]=B.key,o.push(B.key)}if(e.ballCount>0)for(const m of n)i[m.key]===void 0&&(i[m.key]=!1);else if(!this.isSideFormat(e.formatId))for(const m of d){if(!this.isSectionTeam(m))continue;const _=this.ballTeamMemberKeys(m);if(!(_.length<fe)&&this.teamKindFitsFormat(e.formatId,m.kind)){o.push(m.key);for(const g of _)i[g]=!1}}this.teams.set(d),this.picked.set(this.picked.get().map(m=>m.key===e.key?{...m,ballTeams:r}:m));const c=Object.fromEntries(o.map(m=>[m,!0]));for(const m of this.liveSectionTeams())c[m.key]===void 0&&(c[m.key]=!1);const u=this.formatSlots.get(),h=u.find(m=>m.gameKey===e.key),f={key:h?.key??this.nextSlotKey++,formatId:e.formatId,allowancePct:h?.allowancePct??"100",subjectPlayers:i,subjectTeams:c,config:h?.config??this.defaultConfigFor(e.formatId),gameKey:e.key};this.formatSlots.set(h?u.map(m=>m.key===f.key?f:m):[...u,f]),this.collectUnreferencedTeams()}lastTeamIndexOf(e,t,n){const i=new Set([...Object.values(t),...Object.values(n.ballTeams)]);let r=e.length-1;for(const[o,d]of e.entries())i.has(d.key)&&(r=o);return r}syncGamesToRoster(){const e=this.players.get(),t=new Set(e.map(i=>i.key)),n=this.picked.get().map(i=>{if(i.ballCount===0)return i;const r=this.shapeOfGame(i.formatId)?.size.min??1,o={};for(const[d,c]of Object.entries(i.ballByPlayer))t.has(Number(d))&&c<i.ballCount&&(o[Number(d)]=c);for(const d of e)if(o[d.key]===void 0){for(let c=0;c<i.ballCount;c++)if(Object.values(o).filter(h=>h===c).length<r){o[d.key]=c;break}}return{...i,ballByPlayer:o}});this.picked.set(n);for(const i of n)this.regenerateGame(i);this.syncGamesFromTeams(-1)}gameWarnings(e){const t=this.pickedByKey(e),n=t?this.shapeOfGame(t.formatId):null;if(!t||!n)return[];const i=this.gameLabel(t.formatId);if(!this.gameFits(t.formatId))return[`${i}: ${this.gameNeedsText(t.formatId)}`];const r=[];for(let o=0;o<t.ballCount;o++){const d=this.ballMembers(e,o).length,c=`${i} ball ${this.teamLetter(o)}`;if(d<n.size.min){const u=n.size.min-d;r.push(`${c} needs ${u} more player${u===1?"":"s"}.`)}else d>n.size.max&&r.push(`${c} takes at most ${n.size.max}.`)}return r}gameSummary(e){const t=this.pickedByKey(e);if(!t)return"";const n=r=>r.name.trim()||"Player",i=[];if(t.ballCount===0)i.push("everyone");else{const r=[];for(let d=0;d<t.ballCount;d++){const c=this.ballMembers(e,d);c.length>0&&r.push(c.map(n).join(" & "))}i.push(r.join(" vs "));const o=this.sittingOut(e);o.length>0&&i.push(`${o.map(n).join(", ")} sitting out`)}return i.push(`${this.slotForGame(e)?.allowancePct??"100"}% allowance`),i.filter(r=>r!=="").join(" · ")}teamsOfGame(e){const t=this.pickedByKey(e);if(!t)return[];const n=this.slotForGame(e)?.subjectTeams??{},i=[];for(let r=0;r<t.ballCount;r++){const o=this.teamByKey(t.ballTeams[r]??-1);o&&n[o.key]&&i.push(o)}return i}gameSharedWith(e){const t=new Set(this.teamsOfGame(e).filter(r=>!this.isSectionTeam(r)).map(r=>r.key));if(t.size===0)return[];const n=this.slotForGame(e)?.key,i=[];for(const r of this.formatSlots.get()){if(r.key===n)continue;Object.entries(r.subjectTeams).some(([d,c])=>c&&t.has(Number(d)))&&i.push(this.gameLabel(r.formatId))}return i}gameSharesSides(e){return this.gameSharedWith(e).length>0}gameSidesText(e){const t=this.pickedByKey(e);if(!t||this.teamsOfGame(e).length===0)return"";const n=this.slotForGame(e)?.subjectTeams??{},i=[];for(let d=0;d<t.ballCount;d++){const c=this.teamByKey(t.ballTeams[d]??-1);if(c&&n[c.key]){i.push(this.teamLabel(c));continue}const u=this.ballMembers(e,d);u.length>0&&i.push(u.map(h=>h.name.trim()||"Player").join(" & "))}const r=i.join(" vs "),o=this.gameSharedWith(e);return o.length===0?`Sides: ${r}.`:`Sides: ${r} — shared with ${this.joinLabels(o)}.`}joinLabels(e){return e.length<=1?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`}adjustGame(e){this.gameSharesSides(e)&&this.forkGame(e);const t=new Set(Object.values(this.pickedByKey(e)?.ballTeams??{}));this.teams.set(this.teams.get().map(n=>t.has(n.key)?{...n,autoCreated:!1}:n)),this.formatSlots.set(this.formatSlots.get().map(n=>n.gameKey===e?{...n,gameKey:void 0}:n)),this.picked.set(this.picked.get().filter(n=>n.key!==e)),this.customOpen.set(!0)}addCustomGame(){this.customOpen.set(!0);const e=new Set(this.formatSlots.get().map(n=>n.formatId)),t=this.catalog.descriptors.get().find(n=>!e.has(n.id));this.addFormatSlot(t?.id)}showFlexible(){return this.customOpen.get()||this.customSlots().length>0||this.customTeams().length>0}customSlots(){return this.formatSlots.get().filter(e=>e.gameKey===void 0)}customTeams(){const e=this.cardOwnedTeamKeys();return this.teams.get().filter(t=>!e.has(t.key)&&!this.isSectionTeam(t))}cardOwnedTeamKeys(){const e=new Set;for(const t of this.picked.get())for(const n of Object.values(t.ballTeams))e.add(n);return e}slotIndex(e){return this.formatSlots.get().findIndex(t=>t.key===e)}ballTeamsAvailable(){return this.formationCatalog.available()}ballTeamsExpanded(){return this.ballTeamsOpen.get()||this.sectionTeams().length>0}openBallTeams(){this.ballTeamsOpen.set(!0),this.sectionTeams().length===0&&this.addBallTeam()}isSectionTeam(e){return e.section===!0}sectionTeams(){return this.teams.get().filter(e=>this.isSectionTeam(e))}liveSectionTeams(){return this.sectionTeams().filter(e=>this.ballTeamMemberKeys(e).length>=fe)}ballTeamMemberKeys(e){return(e.memberOrder??Object.keys(e.pctByPlayer).map(Number)).filter(n=>e.pctByPlayer[n]!==void 0)}ballTeamMembers(e){const t=this.teamByKey(e);if(!t)return[];const n=new Map(this.players.get().map(i=>[i.key,i]));return this.ballTeamMemberKeys(t).map(i=>n.get(i)).filter(i=>i!==void 0)}formationChips(){return this.formationCatalog.chips()}formationLabel(e){return this.formationCatalog.labelOf(e)}addBallTeam(){const e=this.formationChips()[0]?.id??"scramble";this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:this.lastFormation??e,pctByPlayer:{},memberTeams:{},autoCreated:!1,section:!0,memberOrder:[],pctTextByPlayer:{}}]),this.ballTeamsOpen.set(!0)}removeBallTeam(e){const t=this.teamByKey(e);!t||!this.isSectionTeam(t)||(this.removeTeam(e),this.clearBallTeamNotice(e),this.sectionTeams().length===0&&this.ballTeamsOpen.set(!1),this.syncGamesToBallUnits())}ballTeamFormation(e){return this.teamByKey(e)?.formation??"scramble"}setBallTeamFormation(e,t){const n=this.teamByKey(e);if(!n||!this.isSectionTeam(n))return;const i=this.ballTeamMemberKeys(n).length;if(i>0&&!this.formationCatalog.fits(t,i)){this.setBallTeamNotice(e,`${this.formationLabel(t)} ${this.formationBoundsText(t)} — this team has ${i}.`);return}this.lastFormation=t,this.clearBallTeamNotice(e),this.teams.set(this.teams.get().map(r=>r.key===e?{...r,formation:t}:r)),this.reseedBallTeams()}ballTeamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}ballTeamCandidates(e){const t=new Set;for(const n of this.sectionTeams())if(n.key!==e)for(const i of this.ballTeamMemberKeys(n))t.add(i);return this.players.get().filter(n=>!t.has(n.key))}setBallTeamMember(e,t,n){const i=this.teamByKey(e);if(!i||!this.isSectionTeam(i))return;const r=this.ballTeamMemberKeys(i);if(n){if(r.includes(t))return;const u=Math.min(this.formationCatalog.sizeOf(i.formation)?.max??Ae,Ae);if(r.length>=u){this.setBallTeamNotice(e,`${this.formationLabel(i.formation)} ${this.formationBoundsText(i.formation)} — remove someone first.`);return}}const o={...i.pctByPlayer},d={...i.pctTextByPlayer??{}};let c;n?(o[t]=this.tailAllowance(i.formation,r.length+1),c=[...r,t]):(delete o[t],delete d[t],c=r.filter(u=>u!==t)),this.clearBallTeamNotice(e),this.teams.set(this.teams.get().map(u=>u.key===e?{...u,pctByPlayer:o,pctTextByPlayer:d,memberOrder:c}:u)),this.reseedBallTeams(),this.syncGamesToBallUnits()}tailAllowance(e,t){const n=this.formationCatalog.allowances(e,t);if(n)return String(n[t-1]??n.at(-1)??0);const i=Object.values(this.formationCatalog.byId(e)?.allowancesBySize??{}).map(r=>r.at(-1)).filter(r=>r!==void 0);return i.length>0?String(Math.min(...i)):"100"}ballTeamPctText(e,t){const n=this.teamByKey(e);return n?n.pctTextByPlayer?.[t]??n.pctByPlayer[t]??"":""}setBallTeamPct(e,t,n){const i=this.teamByKey(e);!i||!this.isSectionTeam(i)||i.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(r=>r.key===e?{...r,customized:!0,pctTextByPlayer:{...r.pctTextByPlayer??{},[t]:n}}:r))}ballTeamLabel(e){const t=this.teamByKey(e);return t&&this.ballTeamMemberKeys(t).length>=fe?this.teamLabel(t):"New team"}ballTeamCount(){return this.liveSectionTeams().length}sharedBallPlayerCount(){return this.liveSectionTeams().reduce((e,t)=>e+this.ballTeamMemberKeys(t).length,0)}ballTeamSummary(e){const t=this.ballTeamMembers(e);if(t.length<fe)return"";const i=[t.map(o=>o.name.trim()||"Player").join(" + "),this.formationLabel(this.ballTeamFormation(e)),"plays one ball"],r=this.teamBallCh(e);return r!==null&&i.push(`HCP ${r}`),i.join(" · ")}ballTeamHint(e){const t=this.teamByKey(e);if(!t)return"";const n=fe-this.ballTeamMemberKeys(t).length;return n<=0?"":`Pick ${n} more player${n===1?"":"s"} — a shared ball needs at least ${fe}.`}ballTeamNotice(e){return this.ballTeamNotices.get()[e]??""}setBallTeamNotice(e,t){this.ballTeamNotices.set({...this.ballTeamNotices.get(),[e]:t})}clearBallTeamNotice(e){if(this.ballTeamNotices.get()[e]===void 0)return;const t={...this.ballTeamNotices.get()};delete t[e],this.ballTeamNotices.set(t)}formationBoundsText(e){const t=this.formationCatalog.sizeOf(e);return t?t.min===t.max?`is played by exactly ${t.min}`:`takes ${t.min}–${t.max} players`:`takes up to ${Ae} players`}reseedBallTeams(){const e=this.teams.get();if(!e.some(r=>this.isSectionTeam(r)))return;const t=new Set(this.players.get().map(r=>r.key));let n=!1;const i=e.map(r=>{if(!this.isSectionTeam(r))return r;const o=this.ballTeamMemberKeys(r).filter(f=>t.has(f)),d=r.customized?o:this.sortBySeeding(o),c=this.formationCatalog.allowances(r.formation,d.length),u={},h={};return d.forEach((f,m)=>{const _=String(c?.[m]??100);u[f]=r.customized?r.pctByPlayer[f]??_:_;const g=r.pctTextByPlayer?.[f];r.customized&&g!==void 0&&(h[f]=g)}),gm(d,this.ballTeamMemberKeys(r))&&Ci(u,r.pctByPlayer)&&Ci(h,r.pctTextByPlayer??{})?r:(n=!0,{...r,memberOrder:d,pctByPlayer:u,pctTextByPlayer:h})});n&&this.teams.set(i)}sortBySeeding(e){const t=this.players.get(),n=i=>{const r=t.findIndex(c=>c.key===i),o=r>=0?t[r]:null,d=o?this.derivedCH(o):null;return d?[0,d.ch,r]:[1,0,r]};return[...e].sort((i,r)=>{const o=n(i),d=n(r);return o[0]-d[0]||o[1]-d[1]||o[2]-d[2]})}ballUnits(){const e=new Map;for(const i of this.liveSectionTeams())for(const r of this.ballTeamMemberKeys(i))e.set(r,i);const t=[],n=new Set;for(const i of this.players.get()){const r=e.get(i.key);if(!r){t.push({teamKey:null,members:[i.key]});continue}n.has(r.key)||(n.add(r.key),t.push({teamKey:r.key,members:this.ballTeamMemberKeys(r)}))}return t}soloPlayers(){const e=new Set;for(const t of this.liveSectionTeams())for(const n of this.ballTeamMemberKeys(t))e.add(n);return this.players.get().filter(t=>!e.has(t.key))}unitAssignment(e,t){if(this.liveSectionTeams().length===0||this.isIndividualShape(t))return null;if(this.isSideFormat(e)){if(this.adoptableTeams(t))return null;const c=this.soloPlayers();return{ballCount:t.count.min,ballByPlayer:this.defaultAssignment(t,t.count.min,c),ballTeams:{}}}const n=this.ballUnits(),i=t.count.max??n.length;let r=n;if(n.length>i){const c=n.filter(h=>h.teamKey!==null);let u=Math.max(0,i-c.length);r=n.filter(h=>h.teamKey!==null?!0:u===0?!1:(u--,!0)),r.length>i&&(r=r.slice(0,i))}const o={},d={};return r.forEach((c,u)=>{for(const h of c.members)o[h]=u;c.teamKey!==null&&(d[u]=c.teamKey)}),{ballCount:r.length,ballByPlayer:o,ballTeams:d}}syncGamesToBallUnits(){const e=this.picked.get();if(e.length===0)return;const t=e.map(n=>{const i=this.shapeOfGame(n.formatId);if(!i||n.ballCount===0)return n;const r=this.unitAssignment(n.formatId,i);if(!r){const o={};for(const[d,c]of Object.entries(n.ballTeams))this.teamByKey(c)&&(o[Number(d)]=c);return{...n,ballTeams:o}}return{...n,...r}});this.picked.set(t);for(const n of t)this.regenerateGame(n)}allowanceOf(e,t){if(!this.isSectionTeam(e))return this.parsePct(e.pctByPlayer[t]??"");const n=Pi(e.pctTextByPlayer?.[t]);return n!==null?n:Pi(e.pctByPlayer[t])??100}formations=fm;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{},autoCreated:!1}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(n=>n.key===e?{...n,kind:t,memberTeams:t==="single_ball"?{}:n.memberTeams}:n)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,n){const i=this.teamByKey(e);if(!i||i.kind!=="multi_ball"||t===e)return;const r={...i.memberTeams};if(n){if(this.teamMemberCount(e)>=Ae)return;r[t]=!0}else delete r[t];this.teams.set(this.teams.get().map(o=>o.key===e?{...o,memberTeams:r}:o))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(n=>t.memberTeams[Number(n)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{let t=!1;const n={...e.subjectTeams};for(const i of this.teams.get())n[i.key]===!0&&!this.teamKindFitsFormat(e.formatId,i.kind)&&(delete n[i.key],t=!0);return t?{...e,subjectTeams:n}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}teamKindFitsFormat(e,t){return this.isSideFormat(e)?t==="multi_ball":t==="single_ball"||this.catalog.acceptsSideSubjects(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const n={...t.memberTeams};return delete n[e],{...t,memberTeams:n}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const n={...t.subjectTeams};return delete n[e],{...t,subjectTeams:n}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.liveTeamKeySet(),i=this.teams.get().filter(r=>r.key===e.key||t.has(r.key)).findIndex(r=>r.key===e.key);return`Team ${this.teamLetter(Math.max(0,i))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(n=>n.key===e?{...n,formation:t}:n))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,n){const i=this.teamByKey(e);if(!i)return;const r={...i.pctByPlayer};if(n){if(r[t]!==void 0||this.teamMemberCount(e)>=Ae)return;r[t]=r[t]??"100"}else delete r[t];this.teams.set(this.teams.get().map(o=>o.key===e?{...o,pctByPlayer:r}:o))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=Ae}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let n=0;for(const i of this.players.get()){if(t.pctByPlayer[i.key]===void 0)continue;const r=this.derivedCH(i);if(!r)return null;n+=this.allowanceOf(t,i.key)*r.ch/100}return Math.round(n)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<fe)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=fe;let n=t;for(const i of this.teams.get())e.memberTeams[i.key]===!0&&i.kind==="single_ball"&&Object.keys(i.pctByPlayer).length>=fe&&n++;return n>=fe}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,n){const i=this.teamByKey(e);!i||i.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(r=>r.key===e?{...r,pctByPlayer:{...r.pctByPlayer,[t]:n}}:r))}groupsEnabled(){return this.groups.get().length>0}splitIntoGroups(){if(this.groupsEnabled())return;const e={};for(const t of this.players.get())e[t.key]=!0;this.groups.set([{key:this.nextGroupKey++,startTime:"",startHole:null,members:e},{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}clearGroups(){this.groups.set([])}addGroup(){this.groupsEnabled()&&this.groups.set([...this.groups.get(),{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}removeGroup(e){const t=this.groups.get().filter(n=>n.key!==e);this.groups.set(t.length>1?t:[])}groupByKey(e){return this.groups.get().find(t=>t.key===e)??null}groupLabel(e){const t=this.groups.get().findIndex(n=>n.key===e.key);return`Group ${Math.max(0,t)+1}`}groupMemberIn(e,t){return this.groupByKey(e)?.members[t]===!0}setGroupMember(e,t,n){this.groups.set(this.groups.get().map(i=>{const r=i.key===e,o=i.members[t]===!0;if(r&&n&&!o)return{...i,members:{...i.members,[t]:!0}};if(o&&(!r||!n)){const d={...i.members};return delete d[t],{...i,members:d}}return i}))}setGroupStartTime(e,t){this.groups.set(this.groups.get().map(n=>n.key===e?{...n,startTime:t}:n))}setGroupStartHole(e,t){this.groups.set(this.groups.get().map(n=>n.key===e?{...n,startHole:t}:n))}groupSize(e){const t=this.groupByKey(e);return t?this.players.get().filter(n=>t.members[n.key]===!0).length:0}ungroupedPlayers(){if(!this.groupsEnabled())return[];const e=new Set;for(const t of this.groups.get())for(const n of Object.keys(t.members))t.members[Number(n)]&&e.add(Number(n));return this.players.get().filter(t=>!e.has(t.key))}crossGroupTeamWarnings(){if(!this.groupsEnabled())return[];const e=new Map;this.groups.get().forEach((n,i)=>{for(const r of Object.keys(n.members))n.members[Number(r)]&&e.set(Number(r),i)});const t=[];for(const n of this.teams.get()){if(n.kind!=="single_ball"||!this.isTeamLive(n))continue;const i=new Set;for(const r of Object.keys(n.pctByPlayer)){const o=e.get(Number(r));o!==void 0&&i.add(o)}i.size>1&&t.push(`${this.teamLabel(n)} plays one combined ball, but its players are in different groups — keep them in the same group.`)}return t}buildGroups(e,t){return this.groups.get().map(n=>({members:e.filter(i=>n.members[i.key]===!0).map(i=>t.get(i.key)),...n.startTime.trim()!==""?{startTime:n.startTime.trim()}:{},...n.startHole!==null?{startHole:n.startHole}:{}})).filter(n=>n.members.length>0)}diagnosticsForGroups(){return this.diagnostics.get().filter(e=>e.path?.startsWith("playingGroups"))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,n){const i=this.slotByKey(e);i&&this.patchFormatSlot(e,{subjectPlayers:{...i.subjectPlayers,[t]:n}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,n){const i=this.slotByKey(e);i&&this.patchFormatSlot(e,{subjectTeams:{...i.subjectTeams,[t]:n}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return bm[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,n)=>t-n);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1),this.groups.set(this.groups.get().map(n=>n.startHole!==null&&!t.includes(n.startHole)?{...n,startHole:null}:n))}derivedCH(e){const t=_e(e.handicapIndex);if(t===null)return null;const n=this.teeById(e.teeId);if(!n)return null;const i=n.ratings.find(o=>o.gender===e.gender);if(!i)return null;const r={handicapIndex:t,slope:i.slope,courseRating:i.courseRating,par:i.par};return{ch:Bl(r),raw:fr(r),rating:i,teeName:n.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}humanizedRoster(){return this.diagnostics.get().filter(e=>e.path==="producers").map(e=>It(e,t=>this.catalog.labelOf(t)))}humanizedRoute(){return this.diagnostics.get().filter(e=>e.path==="route").map(e=>It(e,t=>this.catalog.labelOf(t)))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const n of this.formatSlots.get()){const i=this.slotTeamSubjectKeys(n),r=this.slotSuppressedPlayerKeys(n);for(const o of e)n.subjectPlayers[o.key]!==!1&&!r.has(o.key)&&t.add(o.key);for(const o of this.teams.get())if(i.has(o.key))for(const d of e)o.pctByPlayer[d.key]!==void 0&&t.add(d.key)}return e.filter(n=>!t.has(n.key))}diagnosticsForFormat(e){return nm(this.diagnostics.get(),e)}humanizedForFormat(e){return this.diagnosticsForFormat(e).map(t=>It(t,n=>this.catalog.labelOf(n)))}generalDiagnostics(){return im(this.diagnostics.get())}humanizedGeneral(){return this.generalDiagnostics().map(e=>It(e,t=>this.catalog.labelOf(t)))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const n=this.liveTeamKeySet(),i=[];for(const r of this.teams.get()){if(!n.has(r.key))continue;const d=(this.isSectionTeam(r)?this.ballTeamMembers(r.key):e.filter(c=>r.pctByPlayer[c.key]!==void 0)).map(c=>({producerDefId:t.get(c.key),allowancePct:this.allowanceOf(r,c.key)}));if(r.kind==="multi_ball")for(const c of this.teams.get())r.memberTeams[c.key]===!0&&c.key!==r.key&&c.kind==="single_ball"&&n.has(c.key)&&d.push({teamId:String(c.key)});i.push({id:String(r.key),label:this.teamLabel(r),formation:r.formation,kind:r.kind,members:d})}return i}buildFormats(e,t){return this.formatSlots.get().map(n=>{const i=this.isSideFormat(n.formatId),r=this.slotTeamSubjectKeys(n),o=this.slotSuppressedPlayerKeys(n),d=[];if(!i)for(const c of e)n.subjectPlayers[c.key]!==!1&&!o.has(c.key)&&d.push({kind:"player",producerDefId:t.get(c.key)});for(const c of this.teams.get())r.has(c.key)&&d.push({kind:"team",teamId:String(c.key)});return{formatId:n.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(n.allowancePct)},subjects:d,...Object.keys(n.config).length>0?{formatConfig:{...n.config}}:{}}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),n=e.indexOf(t);return n<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(n),...e.slice(0,n)].map(r=>({courseHoleNumber:r})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}slotSubjectCount(e){const t=this.isSideFormat(e.formatId),n=this.slotSuppressedPlayerKeys(e);let i=this.slotTeamSubjectKeys(e).size;if(!t)for(const r of this.players.get())e.subjectPlayers[r.key]!==!1&&!n.has(r.key)&&i++;return i}slotTeamSubjectKeys(e){const t=this.liveTeamKeySet(),n=new Set;for(const i of this.teams.get()){if(!t.has(i.key)||!this.teamKindFitsFormat(e.formatId,i.kind))continue;const r=e.subjectTeams[i.key];if(r===!0){n.add(i.key);continue}r===void 0&&this.isSectionTeam(i)&&!this.isSideFormat(e.formatId)&&n.add(i.key)}return n}slotSuppressedPlayerKeys(e){const t=new Set;for(const n of this.slotTeamSubjectKeys(e)){const i=this.teamByKey(n);if(!(!i||!this.isSectionTeam(i)))for(const r of this.ballTeamMemberKeys(i))t.add(r)}return t}noSubjectsMessage(e){const t=this.catalog.labelOf(e.formatId)??e.formatId;if(e.gameKey!==void 0)return`${t} has nobody playing — put players on a ball above.`;if(!this.isSideFormat(e.formatId))return`${t} has nothing to score — tick at least one player or team under “Scores”.`;const n=this.teams.get();if(n.some(d=>d.kind==="multi_ball"&&this.isTeamLive(d)))return`${t} has no teams ticked — tick the teams it plays under “Scores”.`;if(n.some(d=>d.kind==="single_ball"&&this.isTeamLive(d)))return`${t} is played between teams whose players play their own balls — a team that shares one ball doesn’t fit. Under Teams, switch the team to “Own ball each, scored together as a team”, then tick it under “Scores”.`;const i=this.catalog.classifyId(e.formatId),r=i?.teamCount?.min!==void 0&&i.teamCount.min===i.teamCount.max?`${i.teamCount.min} teams`:i?.teamCount?.min!==void 0?`at least ${i.teamCount.min} teams`:"teams",o=i&&i.teamSize.min===i.teamSize.max?` of ${i.teamSize.min} players`:"";return`${t} is a team game — under Teams, create ${r}${o} with kind “Own ball each, scored together as a team”, add the players, then tick the teams under “Scores”.`}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];e.forEach((i,r)=>{i.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${r}].name`}),_e(i.handicapIndex)===null&&t.push({code:"missing_index",message:"Handicap index required",path:`producers[${r}].handicapIndex`}),i.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${r}].teeId`})});for(const i of this.liveSectionTeams()){const r=this.ballTeamMemberKeys(i).length,o=this.formationLabel(i.formation),d=this.ballTeamLabel(i.key);if(this.formationCatalog.byId(i.formation)){if(!this.formationCatalog.fits(i.formation,r)){t.push({code:"ball_team_size",message:`${d} has ${r} players sharing a ball, but ${o} ${this.formationBoundsText(i.formation)}. Change the formation or the team.`,path:"teams"});continue}!i.customized&&this.formationCatalog.allowances(i.formation,r)===null&&t.push({code:"ball_team_no_recipe",message:`${d} is a ${r}-player ${o}, and there is no standard handicap allowance for that. Type a % for each player, or put them on their own balls.`,path:"teams"})}}if(this.formatSlots.get().forEach((i,r)=>{this.slotSubjectCount(i)===0&&t.push({code:"no_subjects",message:this.noSubjectsMessage(i),formatIndex:r,path:`formats[${r}]`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};const n=this.editToken.get();this.submitting.set(!0);try{const i=new Map;e.forEach((_,g)=>{i.set(_.key,_.producerDefId??(n?`p-${_.key}`:`p${g+1}`))});const r=[];for(const _ of e){const g=_e(_.handicapIndex),v=_.playerId?{kind:"player",id:_.playerId}:_.guestPlayerId?{kind:"guest",id:_.guestPlayerId}:{kind:"guest",id:(await w.guestPlayers.create({displayName:_.name.trim(),gender:_.gender,handicapIndex:g})).id};r.push({producerDefId:i.get(_.key),playerRef:v,handicapIndex:g,gender:_.gender,teeId:_.teeId})}const{roundType:o,route:d}=this.buildRoute(),c=this.buildTeams(e,i),u=this.buildGroups(e,i),h=this.roundName.get().trim(),f={courseId:this.courseId.get(),playedAt:this.editPlayedAt??new Date().toISOString().slice(0,10),...h?{name:h}:{},roundType:o,...d?{route:d}:{},producers:r,...c.length>0?{teams:c}:{},formats:this.buildFormats(e,i),...u.length>0?{playingGroups:u}:{}};if(n){for(const g of e){const v=g.name.trim();!g.guestPlayerId||g.guestOriginalName===void 0||v!==g.guestOriginalName&&(await w.friendlyRounds.renameGuest({token:n,guestPlayerId:g.guestPlayerId,displayName:v}),this.players.set(this.players.get().map(k=>k.key===g.key?{...k,guestOriginalName:v}:k)))}const _=await w.friendlyRounds.editSetup({token:n,draft:f});return _.ok?{ok:!0,token:n}:(this.diagnostics.set(_.diagnostics),{ok:!1})}const m=await w.friendlyRounds.create({draft:f});return m.ok?(et({token:m.friendlyRound.shareToken,courseName:m.round.courseNameSnapshot??"",name:m.round.name,date:m.round.date,status:m.round.status,completedAt:m.round.completedAt,lastSeenAt:new Date().toISOString()}),{ok:!0,token:m.friendlyRound.shareToken}):(this.diagnostics.set(m.diagnostics),{ok:!1})}catch(i){return this.submitError.set(i instanceof Q?i.message==="Validation failed"?["The server could not read this setup — this should not happen, please report it.",...(i.details??[]).slice(0,3).map(r=>`${r.path}: ${r.message}`)].join(`
`):i.message:n?"Could not save the round. Try again.":"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}const _m=["full_18","front_9","back_9"],Os=()=>be()==="sv"?",":".",vm=b(`
    <div bind="root" class="setup">
        <button bind="back" class="setup__back" type="button">← Home</button>
        <header class="setup__head">
            <h1 bind="title">New round</h1>
            <p bind="subtitle">No sign-in required.</p>
        </header>

        <div bind="blocked" class="setup__blocked hidden"></div>

        <section class="setup__section">
            <h2>Name</h2>
            <input bind="roundName" class="setup__name" type="text" maxlength="80" placeholder="Name this round" />
            <p class="setup__hint">Just so you can tell your rounds apart — change it or leave it.</p>
        </section>

        <section class="setup__section">
            <h2>Course</h2>
            <div bind="course" class="setup__select"></div>
            <div bind="teeDefaults" class="setup__tee-defaults hidden">
                <h3>Default tees</h3>
                <p class="setup__hint">Players start on these tees. Change an individual player below if needed.</p>
                <label class="setup__teerow"><span>Men</span><div bind="maleDefaultTee"></div></label>
                <label class="setup__teerow"><span>Women</span><div bind="femaleDefaultTee"></div></label>
            </div>
            <p bind="lockNote" class="setup__locknote hidden"></p>
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

        <section bind="ballTeamsSection" class="setup__section">
            <div bind="ballPitch" class="bteams__pitch">
                <h2>Playing scramble or foursomes?</h2>
                <p class="setup__hint">Group players who share one ball. Skip this if everyone plays their own ball.</p>
                <button bind="openBallTeams" class="setup__add" type="button">Set up teams</button>
            </div>
            <div bind="ballOpen" class="bteams">
                <h2 bind="ballHeading">Sharing a ball</h2>
                <p class="setup__hint">Anyone not on a team plays their own ball.</p>
                <div bind="ballTeams" class="setup__fslots"></div>
                <button bind="addBallTeam" class="setup__add" type="button">+ Add another team</button>
            </div>
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
        <div bind="confirmHost"></div>

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
`),Ii=b(`
    <button bind="key" class="hcp-key" type="button">
        <span bind="num" class="hcp-key__num"></span>
        <span bind="lbl" class="hcp-key__lbl"></span>
    </button>
`),wm=b(`
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
`),xm=b(`
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
`),km=b(`
    <div class="fslot__group fslot__knob">
        <span bind="label" class="fslot__label"></span>
        <div bind="options" class="fslot__seg"></div>
        <p bind="hint" class="fslot__hint"></p>
    </div>
`),Ei=b(`
    <button bind="opt" type="button"></button>
`),Ri=b(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),$m=b(`
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
`),Sm=b(`
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
`),Tm=b(`
    <button bind="row" type="button" class="frow">
        <span bind="name" class="frow__name"></span>
        <span bind="username" class="frow__username"></span>
        <span bind="hcp" class="frow__hcp"></span>
    </button>
`),Ni=b(`
    <button bind="card" class="gcard" type="button">
        <span bind="name" class="gcard__name"></span>
        <span bind="tag" class="gcard__tag"></span>
        <span bind="shape" class="gcard__shape"></span>
    </button>
`),Pm=b(`
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
        <button bind="fork" class="gadjust hidden" type="button">Use separate teams for this game</button>
        <p bind="summary" class="gsummary"></p>
        <button bind="adjust" class="gadjust" type="button">Adjust details</button>
    </div>
`),Cm=b(`
    <div class="grow">
        <span bind="name" class="grow__name"></span>
        <div bind="seg" class="fslot__seg"></div>
    </div>
`),Oi=b(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`),Im=b(`
    <div class="fslot">
        <div class="fslot__top">
            <span bind="teamName" class="fslot__teamname"></span>
            <button bind="remove" class="fslot__remove" type="button" aria-label="Remove">✕</button>
        </div>
        <div class="fslot__group">
            <span class="fslot__label">Formation</span>
            <div bind="formations" class="fslot__seg"></div>
        </div>
        <div class="fslot__group">
            <span class="fslot__label">Who shares this ball</span>
            <div bind="memberRows" class="fslot__teamrows"></div>
        </div>
        <p bind="notice" class="fslot__err"></p>
        <p bind="summary" class="fslot__teammeta"></p>
    </div>
`),Em=b(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="decimal" /><span>% of HCP</span></span>
    </div>
`);class Rm extends M{static styles=`
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
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${a("sm")}; font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            /* The game cards (format-templates §4). Two per row on a phone; the
               "+ Custom game" card spans the full width as the last one. */
            & .setup__cards {
                display: grid; grid-template-columns: 1fr 1fr; gap: ${a("sm")};
                margin-bottom: ${a("md")};
            }
            & .gcard {
                ${S()}
                display: flex; flex-direction: column; gap: 2px; text-align: left;
                padding: ${a("md")}; font-family: inherit; cursor: pointer;
                /* The inset ring doubles the hairline so a picked card still
                   reads as picked next to a hovered one. */
                &.on {
                    border-color: ${l("primary")}; background: ${l("accent-soft")};
                    box-shadow: inset 0 0 0 1px ${l("primary")};
                }
                &:disabled { opacity: 0.5; cursor: default; }
                &.gcard--custom { grid-column: 1 / -1; }

                & .gcard__name { font-weight: 700; font-size: 0.95rem; }
                & .gcard__tag { font-size: 0.78rem; color: ${l("text-muted")}; line-height: 1.3; }
                & .gcard__shape {
                    font-size: 0.72rem; color: ${l("text-muted")}; line-height: 1.3;
                    &:empty { display: none; }
                }
            }

            & .setup__name {
                ${re()}
                width: 100%;
                padding: ${a("md")};
                font-size: 1rem;
                font-family: inherit;
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

            & .setup__tee-defaults {
                margin-top: ${a("lg")};
                &.hidden { display: none; }
                & h3 {
                    margin: 0 0 ${a("xs")}; font-size: 0.95rem; font-weight: 700;
                }
                & .setup__hint { margin-bottom: ${a("sm")}; }
            }
            & .setup__teerow {
                display: grid; grid-template-columns: minmax(4rem, 0.4fr) 1fr;
                align-items: center; gap: ${a("sm")}; margin-top: ${a("sm")};
                font-size: 0.9rem; font-weight: 700;
            }

            & .setup__seg {
                display: flex; gap: ${a("sm")}; margin-bottom: ${a("md")};
                & button {
                    ${S()}
                    flex: 1; padding: ${a("md")} 0;
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
                padding: ${a("md")}; ${R()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .player__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .player__name { ${re()} flex: 1; padding: ${a("md")}; font-size: 1rem; }
                & .player__remove {
                    ${S()}
                    width: 38px; height: 38px; flex-shrink: 0;
                    font-size: 1rem; color: ${l("text-muted")};
                }
                & .player__fields { display: flex; gap: ${a("sm")}; align-items: stretch; }
                & .player__index { ${re()} flex: 1; min-width: 0; padding: ${a("md")}; font-size: 1rem; }
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
                ${S()}
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")};
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }
            & .setup__add.hidden { display: none; }

            & .setup__friends {
                margin-top: ${a("sm")}; padding: ${a("sm")}; ${R()}
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

            /* Ball teams (the players step's shared-ball section). Collapsed it
               is a pitch; opened it is a stack of team cards reusing the .fslot
               chrome. Both halves live in one section, so exactly one is on
               screen at a time. */
            & .bteams__pitch, & .bteams {
                &.hidden { display: none; }
            }
            /* One heading rhythm across both halves — the pitch and the opened
               section are the same section, and a heading that changed size on
               open would read as a different one. */
            & .bteams__pitch > h2, & .bteams > h2 { margin: 0 0 ${a("sm")}; }

            & .setup__fslots { display: flex; flex-direction: column; gap: ${a("md")}; }

            & .fslot {
                padding: ${a("md")}; ${R()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .fslot__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .fslot__teamname { flex: 1; min-width: 0; font-weight: 700; font-size: 0.95rem; }
                & .fslot__teammeta {
                    margin: ${a("xs")} 0 0; font-size: 0.78rem; color: ${l("text-muted")};
                    &:empty { display: none; }
                }
                & .fslot__format { flex: 1; min-width: 0; font-size: 1rem; }
                & .fslot__remove {
                    ${S()}
                    width: 38px; height: 38px; flex-shrink: 0;
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
                /* The knob host is a pass-through: its children must sit in the
                   card's own column, or an empty host (the formats declaring no
                   knobs — most of them) would still take a gap. */
                & .fslot__configs { display: contents; }
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
                        & input { ${re()} width: 56px; padding: ${a("xs")} ${a("sm")}; font-size: 0.95rem; }
                    }
                }

                /* Track segmented control (docs/design-guidelines.md §2). The
                   selection reads from ELEVATION — a raised pill on a sunken
                   track — not from saturation. A solid primary fill is
                   reserved for primary actions; a knob that records a
                   preference must not look like a Save button. Deliberately
                   NOT the btn() recipe: btn() emits its own sizing and border,
                   which is exactly the full-bleed slab this replaces. */
                & .fslot__seg {
                    display: inline-flex; align-self: flex-start; gap: 2px;
                    padding: 3px; border: 1px solid ${l("border")};
                    border-radius: ${l("radius-pill")}; background: ${l("surface-sunken")};
                    & button {
                        appearance: none; border: 1px solid transparent; background: none;
                        padding: ${a("xs")} ${a("md")}; border-radius: ${l("radius-pill")};
                        font-family: inherit; font-weight: 500; font-size: 0.85rem;
                        color: ${l("text-muted")}; cursor: pointer; white-space: nowrap;
                        &:hover { color: ${l("text")}; }
                        &.on {
                            background: ${l("surface")}; border-color: ${l("border")};
                            color: ${l("text")}; font-weight: 700;
                        }
                    }
                }
                /* A knob whose options are all short sits on ONE row — label
                   left, track right. The base group is the column layout, so
                   the inline variant overrides its direction rather than
                   forking the template. */
                & .fslot__knob--inline {
                    flex-direction: row; align-items: center; justify-content: space-between;
                    gap: ${a("sm")};
                    & .fslot__seg { align-self: auto; flex-shrink: 0; }
                }
                /* The sentence a short label can't carry — drawn for the
                   SELECTED option only, and empty for self-evident pairs. */
                & .fslot__hint {
                    margin: 0; font-size: 0.78rem; line-height: 1.4; color: ${l("text-muted")};
                    &:empty { display: none; }
                }
                & .fslot__err {
                    font-size: 0.82rem; color: ${l("error")};
                    &:empty { display: none; }
                }

                /* Game-panel extras. Scoped INSIDE .fslot: the panel roots on
                   .fslot so it inherits the card chrome, and these classes are
                   only meaningful there. */
                & .grow {
                    display: flex; align-items: center; gap: ${a("sm")};
                    & .grow__name { flex: 1; min-width: 0; font-size: 0.9rem; }
                    & .fslot__seg { flex: 0 0 auto; & button { min-width: 40px; padding: ${a("xs")} ${a("sm")}; } }
                }
                & .gaddball {
                    ${S()}
                    align-self: flex-start; margin-top: ${a("xs")};
                    padding: ${a("xs")} ${a("sm")};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }
                & .gsummary {
                    margin: 0; padding-top: ${a("xs")}; border-top: 1px solid ${l("border")};
                    font-size: 0.82rem; color: ${l("text-muted")};
                }
                /* Which round teams this game is contested between, and what
                   else is playing them (format-templates §3). Empty for a game
                   with no team-backed ball — and an empty <p> would otherwise
                   still eat one of the card's gaps. */
                & .gsides {
                    margin: 0; font-size: 0.82rem; color: ${l("text-muted")};
                    &:empty { display: none; }
                }
                & .gadjust {
                    ${S()}
                    align-self: flex-start; padding: ${a("xs")} ${a("sm")};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }

                & .grp__start {
                    display: flex; gap: ${a("sm")}; align-items: stretch;
                    & .grp__time { ${re()} flex: 1; min-width: 0; padding: ${a("sm")} ${a("md")}; font-size: 1rem; font-family: inherit; }
                    & .grp__hole { flex: 1; min-width: 0; font-size: 1rem; }
                }
            }

            & .setup__create {
                ${S()}
                width: 100%; padding: ${a("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit;
                background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                box-shadow: ${l("shadow-elevated")};
                &:hover { background: ${l("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            & .setup__cancel {
                ${S()}
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")};
                background: none; font-family: inherit; font-weight: 600; font-size: 0.95rem;
                color: ${l("text-muted")};
                &.hidden { display: none; }
            }

            & .setup__blocked {
                padding: ${a("lg")}; ${R()}
                background: ${l("surface-sunken")}; color: ${l("text-muted")};
                font-size: 0.95rem; margin-bottom: ${a("xl")};
                &.hidden { display: none; }
            }

            & .setup__locknote {
                margin: ${a("sm")} 0 0; font-size: 0.8rem; color: ${l("text-muted")};
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
                background: ${l("surface")};
                border-top-left-radius: 16px; border-top-right-radius: 16px;
                /* Clear the iOS home indicator; harmless zero elsewhere. */
                padding: ${a("sm")} ${a("md")} calc(${a("xl")} + env(safe-area-inset-bottom));
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
            }
            & .hcp__head { display: flex; align-items: center; gap: ${a("md")}; padding: ${a("sm")} ${a("xs")} ${a("md")}; }
            & .hcp__who { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
            & .hcp__name {
                font-family: ${l("font-display")}; font-weight: 600; color: ${l("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .hcp__chline { font-size: 0.78rem; color: ${l("text-muted")}; font-variant-numeric: tabular-nums; }
            & .hcp__val {
                min-width: 72px; text-align: right; color: ${l("text")};
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.6rem;
                font-variant-numeric: tabular-nums;
                &.empty { color: ${l("text-muted")}; font-weight: 400; font-size: 1rem; }
            }
            & .hcp__bs { ${S()} width: 44px; height: 44px; flex-shrink: 0; font-size: 1.1rem; }
            & .hcp__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
            & .hcp-key {
                ${S()}
                height: 52px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: ${l("font-display")}; font-weight: 700; font-size: 1.2rem;

                & .hcp-key__lbl { font-size: 0.62rem; font-weight: 600; color: ${l("text-muted")}; &:empty { display: none; } }
                &.on {
                    background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")};
                    & .hcp-key__lbl { color: ${l("primary-text")}; }
                }
            }
            & .hcp__actions { display: flex; gap: ${a("sm")}; margin-top: ${a("md")}; }
            & .hcp__cancel { ${S()} flex: 1; padding: ${a("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem; }
            & .hcp__ok {
                ${S()}
                flex: 2; padding: ${a("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem;
                background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")};
                &:hover { background: ${l("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;svc=this.inject(ym);router=this.inject(q);auth=this.inject(V);profile=this.inject(Ie);friends=this.inject(es);pickerOpen=new p(!1);hcpPadFor=new p(null);hcpDraft=new p("");routeChangeOpen=new p(!1);render(){const e=this.router.query("token").get(),t=!!e;this.pickerOpen.set(!1),this.hcpPadFor.set(null),t?this.svc.loadForEdit(e):(this.svc.reset(),this.svc.load()),this.auth.currentUser.get()&&(this.profile.load().then(()=>{if(t)return;const g=this.profile.player.get();g&&(this.svc.seedSelf({id:g.id,displayName:g.displayName,handicapIndex:g.handicapIndex,gender:g.gender}),this.svc.setOrganizerPreferredTeeRole(g.gender,g.preferredTeeRoleKey))}),this.friends.load());const n=()=>t&&this.svc.editBlockedReason.get()!==null,i=()=>t&&this.svc.hasScores.get(),r=()=>t&&this.svc.competitionRound.get(),o=()=>this.profile.player.get(),d=()=>{const g=o();return this.auth.currentUser.get()!==null&&g!==null&&!this.svc.hasPlayer(g.id)},c=this.wire(vm,{root:{className:()=>n()?"setup setup--blocked":"setup"},back:{textContent:()=>t?"← Back to round":"← Home",onclick:()=>t&&e?this.router.navigate("/round",{query:{token:e}}):this.router.navigate("/")},title:{textContent:()=>t?"Edit round":"New round"},subtitle:{textContent:()=>t?"Change the setup — scored balls are preserved.":"No sign-in required."},blocked:{className:()=>n()?"setup__blocked":"setup__blocked hidden",textContent:()=>this.svc.editBlockedReason.get()==="round_complete"?"This round is complete — its setup can no longer be edited.":this.svc.editBlockedReason.get()==="no_stored_draft"?"This round didn't come from the setup wizard, so it can't be edited here.":this.svc.editBlockedReason.get()==="has_open_seats"?"This round has open seats waiting to be claimed — the wizard cannot edit it yet.":""},roundName:{value:()=>this.svc.roundName.get(),oninput:g=>this.svc.roundName.set(g.target.value)},lockNote:{className:()=>r()||i()?"setup__locknote":"setup__locknote hidden",textContent:()=>r()?"This round is part of a competition. The course and the holes are set by the organizer and cannot be changed here — everything else on the round still can be.":i()?"Scores are already recorded. You can still change the course, the route and the start hole — every score stays on the hole it was entered on, counting from the start. Holes you have already scored have to stay on the route.":""},routeErr:{textContent:()=>this.svc.humanizedRoute().join(`
`)},teeDefaults:{className:()=>!t&&this.svc.tees.get().length>0?"setup__tee-defaults":"setup__tee-defaults hidden"},rosterErr:{textContent:()=>this.svc.humanizedRoster().join(`
`)},cancel:{className:()=>t?"setup__cancel":"setup__cancel hidden",onclick:()=>e&&this.router.navigate("/round",{query:{token:e}})},addPlayer:{onclick:()=>this.svc.addPlayer()},addMe:{className:()=>d()?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>`+ Add me (${o()?.displayName??""})`,onclick:()=>{const g=o();g&&this.svc.addMe({id:g.id,displayName:g.displayName,handicapIndex:g.handicapIndex,gender:g.gender})}},addFriends:{className:()=>this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>this.pickerOpen.get()?"− From friends":"+ From friends",onclick:()=>this.pickerOpen.set(!this.pickerOpen.get())},friendPicker:{className:()=>this.pickerOpen.get()&&this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__friends":"setup__friends hidden"},ballTeamsSection:{className:()=>this.svc.ballTeamsAvailable()?"setup__section":"setup__section hidden"},ballPitch:{className:()=>this.svc.ballTeamsExpanded()?"bteams__pitch hidden":"bteams__pitch"},ballOpen:{className:()=>this.svc.ballTeamsExpanded()?"bteams":"bteams hidden"},ballHeading:{textContent:()=>{const g=this.svc.ballTeamCount();return g===0?"Sharing a ball":`Sharing a ball · ${g} team${g===1?"":"s"}`}},openBallTeams:{onclick:()=>this.svc.openBallTeams()},addBallTeam:{onclick:()=>this.svc.addBallTeam()},teamsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},formatsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},addTeam:{onclick:()=>this.svc.addTeam()},splitGroups:{className:()=>this.svc.groupsEnabled()?"setup__add hidden":"setup__add",onclick:()=>this.svc.splitIntoGroups()},addGroup:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.addGroup()},clearGroups:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.clearGroups()},groupNote:{textContent:()=>{const g=this.svc.ungroupedPlayers();return g.length===0?"":`${g.map(k=>k.name.trim()||"A player").join(", ")} ${g.length>1?"aren't":"isn't"} in a group yet — every player needs one.`}},groupWarn:{textContent:()=>[...this.svc.crossGroupTeamWarnings(),...this.svc.diagnosticsForGroups().map(g=>g.message)].join(`
`)},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const g=this.svc.playersInNoFormat();return g.length===0?"":`Heads up: ${g.map(k=>k.name.trim()||"A player").join(", ")} ${g.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.humanizedGeneral(),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?t?"Saving…":"Creating…":t?"Save changes":"Create round",onclick:()=>{if(this.svc.scoredRouteChange()){this.routeChangeOpen.set(!0);return}this.save()}},hcpPad:{className:()=>this.hcpPadFor.get()!==null?"hcp":"hcp hidden"},hcpBackdrop:{onclick:()=>this.hcpPadFor.set(null)},hcpName:{textContent:()=>this.hcpPlayer()?.name?.trim()||"Player"},hcpCh:{textContent:()=>{const g=this.hcpPlayer();if(!g)return"";const v=this.svc.derivedCH({...g,handicapIndex:this.hcpDraft.get()});return v?`Course handicap ${v.ch} · ${v.teeName}`:"WHS index — “+” means a plus handicap."}},hcpVal:{className:()=>this.hcpDraft.get()?"hcp__val":"hcp__val empty",textContent:()=>this.hcpDraft.get()||"HCP index"},hcpBack:{onclick:()=>this.hcpDraft.set(this.hcpDraft.get().slice(0,-1))},hcpCancel:{onclick:()=>this.hcpPadFor.set(null)},hcpOk:{disabled:()=>this.hcpDraft.get()!==""&&_e(this.hcpDraft.get())===null,onclick:()=>this.hcpCommit()}}),u=this.ref(c,"hcpKeys");for(const g of["1","2","3","4","5","6","7","8","9"])u.appendChild(this.hcpKey(g,"",()=>this.hcpAppendDigit(g)));u.appendChild(this.wireEl(Ii,{key:{className:()=>this.hcpDraft.get().startsWith("+")?"hcp-key on":"hcp-key",onclick:()=>this.hcpTogglePlus()},num:{textContent:"+"},lbl:{textContent:"plus hcp"}})),u.appendChild(this.hcpKey("0","",()=>this.hcpAppendDigit("0"))),u.appendChild(this.hcpKey(Os(),"",()=>this.hcpAppendSep()));const h=g=>{if(this.hcpPadFor.get()!==null){if(g.key>="0"&&g.key<="9")this.hcpAppendDigit(g.key);else if(g.key===","||g.key===".")this.hcpAppendSep();else if(g.key==="+"||g.key==="-")this.hcpTogglePlus();else if(g.key==="Backspace")this.hcpDraft.set(this.hcpDraft.get().slice(0,-1));else if(g.key==="Enter")this.hcpCommit();else if(g.key==="Escape")this.hcpPadFor.set(null);else return;g.preventDefault()}};document.addEventListener("keydown",h),this.track(()=>document.removeEventListener("keydown",h));const f=this.ref(c,"hcpPad");document.body.appendChild(f),this.track(()=>f.remove()),this.$each(this.ref(c,"presets"),()=>_m,(g,v,k)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(g),className:()=>this.svc.preset.get()===g?"on":"",disabled:()=>r(),onclick:()=>this.svc.setPreset(g)}},k),g=>g);const m=g=>this.track(g);this.mountSelect(this.ref(c,"course"),m,{value:this.bound(m,()=>this.svc.courseId.get(),g=>{g&&g!==this.svc.courseId.get()&&this.svc.selectCourse(g)}),options:{get:()=>{const g=[];let v="";for(const k of this.svc.courses.get())k.clubName!==v&&(g.push({value:`__club:${k.clubName}`,label:k.clubName,disabled:!0}),v=k.clubName),g.push({value:k.id,label:k.name});return g}},placeholder:"Select a course",disabled:{get:()=>r()}}),this.mountSelect(this.ref(c,"startHole"),m,{value:this.bound(m,()=>String(this.svc.startHole.get()),g=>this.svc.startHole.set(Number(g))),options:{get:()=>this.svc.startHoleOptions().map(g=>({value:String(g),label:String(g)}))},disabled:{get:()=>r()}});const _=()=>this.svc.tees.get().map(g=>({value:g.id,label:g.name}));return this.mountSelect(this.ref(c,"maleDefaultTee"),m,{value:this.bound(m,()=>this.svc.defaultTeeId("M"),g=>this.svc.setRoundDefaultTee("M",g)),options:{get:_},placeholder:"Choose tee"}),this.mountSelect(this.ref(c,"femaleDefaultTee"),m,{value:this.bound(m,()=>this.svc.defaultTeeId("F"),g=>this.svc.setRoundDefaultTee("F",g)),options:{get:_},placeholder:"Choose tee"}),this.$each(this.ref(c,"friendRows"),()=>At(this.friends.friends.get().filter(g=>!this.svc.hasPlayer(g.id)),"frecency"),(g,v,k)=>this.wireEl(Tm,{row:{onclick:()=>this.svc.addFriend({id:g.id,displayName:g.displayName,handicapIndex:g.handicapIndex,gender:g.gender})},name:()=>g.displayName,username:()=>`@${g.username}`,hcp:()=>g.handicapIndex===null?"–":g.handicapIndex.toFixed(1)},k),g=>g.id),this.$each(this.ref(c,"players"),this.svc.players,(g,v,k)=>this.playerRow(g.key,k),g=>g.key),this.$each(this.ref(c,"cards"),()=>[...this.svc.presetGames().map(g=>g.id),"__custom"],(g,v,k)=>g==="__custom"?this.wireEl(Ni,{card:{className:()=>"gcard gcard--custom",onclick:()=>this.svc.addCustomGame()},name:{textContent:"+ Custom game"},tag:{textContent:"Anything the cards don't cover — teams and formats by hand."},shape:{textContent:""}},k):this.gameCard(g,k),g=>g),this.$each(this.ref(c,"games"),this.svc.picked,(g,v,k)=>this.gamePanel(g.key,k),g=>g.key),this.$each(this.ref(c,"teams"),()=>this.svc.customTeams(),(g,v,k)=>this.teamCard(g.key,k),g=>g.key),this.$each(this.ref(c,"ballTeams"),()=>this.svc.sectionTeams(),(g,v,k)=>this.ballTeamCard(g.key,k),g=>g.key),this.$each(this.ref(c,"groups"),this.svc.groups,(g,v,k)=>this.groupCard(g.key,k),g=>g.key),this.$each(this.ref(c,"formats"),()=>this.svc.customSlots(),(g,v,k)=>this.formatCard(g.key,k),g=>g.key),this.spawn(oe,this.ref(c,"confirmHost"),{open:this.routeChangeOpen,title:"Move this round to the new holes?",message:"The scores already entered stay where they are: the first hole you scored stays the first hole you played, and so on down the card. Only which hole each one is — course, number, par and stroke index — changes.",confirmLabel:"Save changes",cancelLabel:"Cancel",onconfirm:()=>{this.save()}}),c}async save(){const e=await this.svc.submit();e.ok&&this.router.navigate("/round",{query:{token:e.token}})}mountSelect(e,t,n){const i=new pe(n);i.mount(e),t(()=>i.destroy())}bound(e,t,n){const i=new p(t());return e(C(()=>i.set(t()))),e(C(()=>{const r=i.get();queueMicrotask(()=>n(r))})),i}eachInto(e,t,n,i,r){const o=new Map,d=new Map;t(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),t(C(()=>{const c=n(),u=new Map;for(const[f,m]of c.entries()){const _=r(m,f);if(o.has(_))u.set(_,o.get(_));else{const g=[];u.set(_,i(m,f,v=>g.push(v))),d.set(_,g)}}for(const[f,m]of o)u.has(f)||(m.remove(),d.get(f)?.forEach(_=>_()),d.delete(f));let h=e.firstChild;for(const f of u.values())f===h?h=h.nextSibling:e.insertBefore(f,h);o.clear();for(const[f,m]of u)o.set(f,m)}))}gameCard(e,t){const n=()=>this.svc.gameFits(e);return this.wireEl(Ni,{card:{className:()=>this.svc.isGamePicked(e)?"gcard on":"gcard",disabled:()=>!n(),onclick:()=>this.svc.toggleGame(e)},name:{textContent:()=>this.svc.gameLabel(e)},tag:{textContent:()=>n()?this.svc.catalog.taglineOf(e):this.svc.gameNeedsText(e)},shape:{textContent:()=>n()?this.svc.gameShapeText(e):""}},t)}gamePanel(e,t){const n=()=>this.svc.pickedByKey(e),i=()=>this.svc.slotForGame(e),r=()=>n()?.formatId??"",o=()=>(n()?.ballCount??0)>0,d=this.wireEl(Pm,{title:{textContent:()=>this.svc.gameLabel(r())},remove:{onclick:()=>this.svc.unpickGame(e)},desc:{textContent:()=>this.svc.catalog.byId(r())?.description??""},allowance:{value:i()?.allowancePct??"100",oninput:c=>{const u=i();u&&this.svc.setSlotAllowance(u.key,c.target.value)}},ballGroup:{hidden:()=>!o()},addBall:{className:()=>this.svc.canAddBall(e)?"gaddball":"gaddball hidden",onclick:()=>this.svc.addBall(e)},err:{textContent:()=>{const c=i();return[...this.svc.gameWarnings(e),...c?this.svc.humanizedForFormat(this.svc.slotIndex(c.key)):[]].join(" · ")}},sides:{textContent:()=>this.svc.gameSidesText(e)},fork:{className:()=>this.svc.gameSharesSides(e)?"gadjust":"gadjust hidden",onclick:()=>this.svc.forkGame(e)},summary:{textContent:()=>this.svc.gameSummary(e)},adjust:{onclick:()=>this.svc.adjustGame(e)}},t);return this.eachInto(this.ref(d,"configFields"),t,()=>this.svc.catalog.byId(r())?.configFields??[],(c,u,h)=>this.configField(()=>i()?.key??null,c,h),c=>`${r()}:${c.key}`),this.eachInto(this.ref(d,"ballRows"),t,()=>o()?this.svc.players.get():[],(c,u,h)=>this.ballRow(e,c.key,h),c=>c.key),d}ballRow(e,t,n){const i=this.wireEl(Cm,{name:{textContent:()=>this.svc.players.get().find(r=>r.key===t)?.name?.trim()||"Player"}},n);return this.eachInto(this.ref(i,"seg"),n,()=>[...this.svc.gameBalls(e),null],(r,o,d)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>r===null?"–":this.svc.teamLetter(r),className:()=>this.svc.ballOf(e,t)===r?"on":"",onclick:()=>this.svc.assignBall(e,t,r)}},d),r=>String(r)),i}formatCard(e,t){const n=()=>this.svc.slotByKey(e),i=()=>n()?.formatId??"",r=this.wireEl(xm,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(i())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:d=>this.svc.setSlotAllowance(e,d.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(i())?"applied to each member’s own ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.humanizedForFormat(this.svc.slotIndex(e)).join(" · ")}},t);this.mountSelect(this.ref(r,"format"),t,{value:this.bound(t,()=>i(),d=>{d&&d!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,d)}),options:{get:()=>this.svc.catalog.descriptors.get().map(d=>({value:d.id,label:this.svc.catalog.labelOf(d)??d.label}))}}),this.eachInto(this.ref(r,"configFields"),t,()=>this.svc.catalog.byId(i())?.configFields??[],(d,c,u)=>this.configField(()=>e,d,u),d=>`${i()}:${d.key}`);const o=()=>{const d=this.svc.isSideFormat(i()),c=[];d||c.push(...this.svc.players.get().map(u=>({kind:"player",subKey:u.key})));for(const u of this.svc.customTeams())this.svc.teamKindFitsFormat(i(),u.kind)&&c.push({kind:"team",subKey:u.key});return c};return this.eachInto(this.ref(r,"subjectRows"),t,o,(d,c,u)=>this.subjectRow(e,d.kind,d.subKey,u),d=>`${d.kind}${d.subKey}`),r}configField(e,t,n){const i=()=>{const d=e();return d===null?t.default:this.svc.slotConfigValue(d,t)},r=()=>{const d=i(),c=t.options.find(u=>u.value===d);return c?this.svc.catalog.configHintOf(c):""},o=this.wireEl(km,{label:{textContent:()=>this.svc.catalog.configLabelOf(t)},hint:{textContent:r}},n);return this.svc.catalog.configFieldIsInline(t)&&o.classList.add("fslot__knob--inline"),this.eachInto(this.ref(o,"options"),n,()=>t.options,(d,c,u)=>this.wireEl(Ei,{opt:{textContent:()=>this.svc.catalog.configLabelOf(d),className:()=>i()===d.value?"on":"",onclick:()=>{const h=e();h!==null&&this.svc.setSlotConfig(h,t.key,d.value)}}},u),d=>d.value),o}subjectRow(e,t,n,i){const r=()=>{if(t==="player")return this.svc.players.get().find(u=>u.key===n)?.name?.trim()||"Player";const c=this.svc.teamByKey(n);return c?`${this.svc.teamLabel(c)} (${c.kind==="multi_ball"?"own balls":"one ball"})`:"Team"},o=()=>t==="player"?this.svc.subjectPlayerIn(e,n):this.svc.subjectTeamIn(e,n),d=c=>t==="player"?this.svc.setSubjectPlayer(e,n,c):this.svc.setSubjectTeam(e,n,c);return this.wireEl(Ri,{chk:{checked:()=>o(),onchange:c=>d(c.target.checked)},name:{textContent:()=>r()}},i)}groupCard(e,t){const n=this.wireEl(Sm,{remove:{onclick:()=>this.svc.removeGroup(e)},groupName:{textContent:()=>{const i=this.svc.groupByKey(e);return i?this.svc.groupLabel(i):"Group"}},time:{value:this.svc.groupByKey(e)?.startTime??"",oninput:i=>this.svc.setGroupStartTime(e,i.target.value)},meta:{textContent:()=>{const i=this.svc.groupSize(e);return i===0?"Tick the players who walk with this group.":`${i} player${i===1?"":"s"}`}}},t);return this.mountSelect(this.ref(n,"hole"),t,{value:this.bound(t,()=>{const i=this.svc.groupByKey(e)?.startHole;return i==null?"":String(i)},i=>this.svc.setGroupStartHole(e,i===""?null:Number(i))),options:{get:()=>[{value:"",label:"First hole"},...this.svc.startHoleOptions().map(i=>({value:String(i),label:`Hole ${i}`}))]}}),this.eachInto(this.ref(n,"memberRows"),t,()=>this.svc.players.get(),(i,r,o)=>this.groupMemberRow(e,i.key,o),i=>i.key),n}groupMemberRow(e,t,n){return this.wireEl(Ri,{chk:{checked:()=>this.svc.groupMemberIn(e,t),onchange:i=>this.svc.setGroupMember(e,t,i.target.checked)},name:{textContent:()=>this.svc.players.get().find(i=>i.key===t)?.name?.trim()||"Player"}},n)}teamCard(e,t){const n=()=>this.svc.teamKindOf(e)==="multi_ball",i=this.wireEl($m,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const r=this.svc.teamByKey(e);return r?this.svc.teamLabel(r):"Team"}},compGroup:{hidden:()=>n()},membersLabel:{textContent:()=>n()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const r=this.svc.teamSize(e);if(r===0)return n()?"Tick at least 2 members — a team scored together needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(r<2)return"Add one more member — a team needs at least 2.";if(n())return`${r} balls · own ball each, scored together as a team`;const o=this.svc.teamBallCh(e);return o===null?`${r} players`:`${r} players · plays off HCP ${o}`}}},t);return this.mountSelect(this.ref(i,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),r=>this.svc.setTeamKind(e,r==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"Share one ball (scramble, foursomes)"},{value:"multi_ball",label:"Own ball each, scored together as a team"}]}}),this.mountSelect(this.ref(i,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",r=>this.svc.setTeamFormation(e,r)),options:{get:()=>this.svc.formations.map(r=>({value:r,label:r[0].toUpperCase()+r.slice(1)}))}}),this.eachInto(this.ref(i,"memberRows"),t,()=>{const r=this.svc.players.get().map(o=>({kind:"player",mKey:o.key}));if(n())for(const o of this.svc.eligibleNestedTeams(e))r.push({kind:"team",mKey:o.key});return r},(r,o,d)=>r.kind==="player"?this.teamMemberRow(e,r.mKey,d):this.teamNestedRow(e,r.mKey,d),r=>`${r.kind}${r.mKey}`),i}teamNestedRow(e,t,n){const i=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(Oi,{chk:{checked:()=>i(),disabled:()=>!i()&&this.svc.teamAtMaxSize(e),onchange:r=>this.svc.setTeamMemberTeam(e,t,r.target.checked)},name:{textContent:()=>{const r=this.svc.teamByKey(t);return r?`${this.svc.teamLabel(r)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},n)}teamMemberRow(e,t,n){const i=()=>this.svc.players.get().find(o=>o.key===t)??null,r=()=>this.svc.teamMemberIn(e,t);return this.wireEl(Oi,{chk:{checked:()=>r(),disabled:()=>!r()&&this.svc.teamAtMaxSize(e),onchange:o=>this.svc.setTeamMember(e,t,o.target.checked)},name:{textContent:()=>i()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!r()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:o=>this.svc.setTeamPct(e,t,o.target.value)}},n)}ballTeamCard(e,t){const n=this.wireEl(Im,{remove:{onclick:()=>this.svc.removeBallTeam(e)},teamName:{textContent:()=>this.svc.ballTeamLabel(e)},notice:{textContent:()=>this.svc.ballTeamNotice(e),hidden:()=>this.svc.ballTeamNotice(e)===""},summary:{textContent:()=>this.svc.ballTeamSummary(e)||this.svc.ballTeamHint(e)}},t);return this.eachInto(this.ref(n,"formations"),t,()=>this.svc.formationChips(),(i,r,o)=>this.wireEl(Ei,{opt:{textContent:()=>this.svc.formationLabel(i.id),className:()=>this.svc.ballTeamFormation(e)===i.id?"on":"",onclick:()=>this.svc.setBallTeamFormation(e,i.id)}},o),i=>i.id),this.eachInto(this.ref(n,"memberRows"),t,()=>this.svc.ballTeamCandidates(e),(i,r,o)=>this.ballMemberRow(e,i.key,o),i=>i.key),n}ballMemberRow(e,t,n){const i=()=>this.svc.ballTeamMemberIn(e,t);return this.wireEl(Em,{chk:{checked:()=>i(),onchange:r=>this.svc.setBallTeamMember(e,t,r.target.checked)},name:{textContent:()=>this.svc.players.get().find(r=>r.key===t)?.name?.trim()||"Player"},pctWrap:{hidden:()=>!i()},pct:{value:()=>this.svc.ballTeamPctText(e,t),oninput:r=>this.svc.setBallTeamPct(e,t,r.target.value)}},n)}hcpPlayer(){const e=this.hcpPadFor.get();return e===null?null:this.svc.players.get().find(t=>t.key===e)??null}openHcpPad(e){this.hcpDraft.set(this.svc.players.get().find(t=>t.key===e)?.handicapIndex??""),this.hcpPadFor.set(e)}hcpAppendDigit(e){const t=this.hcpDraft.get(),[n,i]=t.replace("+","").split(/[.,]/);if(i!==void 0){if(i.length>=1)return}else if(n.length>=2)return;this.hcpDraft.set(t+e)}hcpAppendSep(){const e=this.hcpDraft.get();/[.,]/.test(e)||this.hcpDraft.set(e.replace("+","")===""?`${e}0${Os()}`:e+Os())}hcpTogglePlus(){const e=this.hcpDraft.get();this.hcpDraft.set(e.startsWith("+")?e.slice(1):`+${e.replace("-","")}`)}hcpCommit(){const e=this.hcpPadFor.get();e!==null&&(this.hcpDraft.get()!==""&&_e(this.hcpDraft.get())===null||(this.svc.patchPlayer(e,{handicapIndex:this.hcpDraft.get()}),this.hcpPadFor.set(null)))}hcpKey(e,t,n){return this.wireEl(Ii,{key:{onclick:n},num:{textContent:e},lbl:{textContent:t}})}playerRow(e,t){const n=()=>this.svc.players.get().find(o=>o.key===e)??null,i=()=>this.svc.players.get().findIndex(o=>o.key===e),r=this.wireEl(wm,{name:{value:n()?.name??"",readOnly:()=>!!n()?.playerId,oninput:o=>this.svc.patchPlayer(e,{name:o.target.value})},index:{value:()=>n()?.handicapIndex??"",onclick:()=>this.openHcpPad(e),onfocus:o=>{o.target.blur(),this.openHcpPad(e)}},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const o=n();if(!o)return"";const d=this.svc.derivedCH(o);if(!d)return"";const c=d.rating;return`Course handicap ${d.ch}  ·  ${o.handicapIndex} × ${c.slope}/113 + (${c.courseRating} − ${c.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(i()).map(o=>o.message).join(" · ")}},t);return this.mountSelect(this.ref(r,"gender"),t,{value:this.bound(t,()=>n()?.gender??"M",o=>this.svc.patchPlayer(e,{gender:o})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]},disabled:{get:()=>n()?.genderKnown===!0}}),this.mountSelect(this.ref(r,"tee"),t,{value:this.bound(t,()=>n()?.teeId??"",o=>this.svc.setPlayerTee(e,o)),options:{get:()=>this.svc.tees.get().map(o=>({value:o.id,label:o.name}))},placeholder:"Tee"}),r}}function Nm(s){return{login:(e,t)=>y({method:"POST",url:`${s}/auth/login`,body:{username:e,password:t}}),me:()=>y({method:"GET",url:`${s}/auth/me`}),logout:()=>y({method:"POST",url:`${s}/auth/logout`,body:{}}),logoutAll:()=>y({method:"POST",url:`${s}/auth/logout-all`,body:{}})}}const fa=Nm(W),Hs="Something went wrong on our end. Try again in a moment.";function Om(s,e){const t=(s.details??[]).map(i=>i.path),n=i=>t.some(r=>r===`/${i}`);return n("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":n("username")?"Enter your username.":n("displayName")?"Enter a display name.":n("handicapIndex")?"Handicap index must be a number (or leave it empty).":n("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function Hi(s,e){if(s instanceof Q)switch(s.status){case 400:return Om(s,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":Hs;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return s.status>=500?Hs:"That request could not be completed."}return s instanceof Error&&s.message==="Request timeout"?"That took too long. Check your connection and try again.":s instanceof Error?"Cannot reach the server. Check your connection and try again.":Hs}const Hm=b(`
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
`);class Mm extends M{static styles=`
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
                    ${re()}
                    padding: ${a("md")} ${a("lg")};
                    font-size: 1rem;
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
                    color: ${l("text-muted")};
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
                        ${S()}
                        padding: ${a("sm")} ${a("lg")};
                        font-size: 0.9rem;
                        font-weight: 700;
                        &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                    }
                }

                /* Direct child only: the submit button. The gender segment and
                   the home-club select bring their own button styling, and a
                   descendant selector here would paint both solid primary. */
                & > button {
                    ${S()}
                    padding: ${a("md")} ${a("lg")};
                    font-size: 1rem;
                    font-weight: 700;
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
    `;auth=this.inject(V);router=this.inject(q);nextQ=this.router.query("next");mode=new p("login");busy=new p(!1);formError=new p("");username="";password="";displayName="";hcp="";gender=new p(null);clubs=new p([]);homeClubId=new p("");clubsRequested=!1;async loadClubs(){if(!this.clubsRequested){this.clubsRequested=!0;try{this.clubs.set(await w.setup.clubs())}catch{}}}destination(e){const t=this.nextQ.get();return t&&t.startsWith("/")?t:e}async submit(){if(this.formError.set(""),this.mode.get()==="login"){if(!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const n=await fa.login(this.username.trim(),this.password);this.auth.currentUser.set(n),this.auth.error.set(null),this.router.navigate(this.destination("/"),!0)}catch(n){this.formError.set(Hi(n,"login"))}finally{this.busy.set(!1)}return}const e=this.hcp.trim(),t=e===""?null:_e(e);if(e!==""&&t===null){this.formError.set("Handicap index must be a number (or leave it empty).");return}if(this.password.length<8){this.formError.set("Password must be at least 8 characters.");return}if(!this.username.trim()||!this.displayName.trim()){this.formError.set("Username and display name are required.");return}this.busy.set(!0);try{const n=await w.players.register({username:this.username.trim(),password:this.password,displayName:this.displayName.trim(),handicapIndex:t,gender:this.gender.get(),homeClubId:this.homeClubId.get()||null});this.auth.currentUser.set({id:n.id,username:n.username}),this.router.navigate(this.destination("/"),!0)}catch(n){this.formError.set(Hi(n,"register"))}finally{this.busy.set(!1)}}render(){const e=()=>this.mode.get()==="register",t=()=>this.auth.loading.get()||this.busy.get(),n=this.wire(Hm,{root:{inert:()=>t()},error:{className:()=>this.formError.get()?"error show":"error",textContent:()=>this.formError.get()},form:{onsubmit:async o=>{o.preventDefault(),await this.submit()}},username:{oninput:o=>{this.username=o.target.value}},password:{autocomplete:()=>e()?"new-password":"current-password",oninput:o=>{this.password=o.target.value}},registerFields:{className:()=>e()?"login__register":"login__register hidden"},displayName:{oninput:o=>{this.displayName=o.target.value}},hcp:{oninput:o=>{this.hcp=o.target.value}},submit:{textContent:()=>t()?e()?"Creating account…":"Signing in…":e()?"Create account":"Sign in"},toggle:{textContent:()=>e()?"Have an account? Sign in":"New here? Create an account",onclick:()=>{this.formError.set(""),this.auth.error.set(null);const o=!e();this.mode.set(o?"register":"login"),o&&this.loadClubs()}}}),i=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(n,"gender"),()=>i,(o,d,c)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>o.label,className:()=>this.gender.get()===o.value?"on":"",onclick:()=>this.gender.set(o.value)}},c),o=>o.label);const r=new pe({value:this.homeClubId,options:{get:()=>[{value:"",label:"No home club"},...this.clubs.get().map(o=>({value:o.id,label:o.name}))]},placeholder:"No home club"});return r.mount(this.ref(n,"club")),this.track(()=>r.destroy()),n}}const Am=b(`
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
                    <h2>Friends</h2>
                    <div bind="sortToggle" class="friends__sort" role="group" aria-label="Sort friends">
                        <button bind="sortFrecency" type="button" class="friends__sortbtn">Suggested</button>
                        <button bind="sortAlpha" type="button" class="friends__sortbtn">A–Z</button>
                    </div>
                </div>
                <div bind="friendsEmpty" class="friends__empty">No mutual friends yet — search above to add the people you play with.</div>
                <div bind="friends" class="friends__list"></div>
            </section>

            <section bind="connectionsSection" class="friends__section">
                <div class="friends__sechead">
                    <h2>Added by me</h2>
                </div>
                <p class="friends__sectionhint">These players haven’t added you back yet.</p>
                <div bind="connections" class="friends__list"></div>
            </section>
        </div>
        <div bind="removeConfirmHost"></div>
    </div>
`),Bm='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8.5" cy="7.5" r="3.25"/><path d="M2.5 20c.5-3.5 2.7-5.5 6-5.5 2.7 0 5.1 1.8 5.8 4.5"/><circle cx="17.5" cy="16.5" r="4.25"/><path d="M15.5 16.5h4"/></svg>',zm=b(`
    <div class="friend-row">
        ${Ee("friend-row__badge")}
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="username" class="friend-row__username"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="add" class="friend-row__add" type="button">Add</button>
        <span bind="added" class="friend-row__added">✓ Added</span>
    </div>
`),Mi=b(`
    <div class="friend-row">
        <button bind="open" type="button" class="friend-row__main">
            ${Ee("friend-row__badge")}
            <span class="friend-row__who">
                <span bind="name" class="friend-row__name"></span>
                <span bind="username" class="friend-row__username"></span>
                <span bind="club" class="friend-row__club"></span>
                <span bind="subtitle" class="friend-row__subtitle"></span>
            </span>
        </button>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="remove" class="friend-row__remove" type="button" aria-label="Remove friend">${Bm}</button>
    </div>
`);class Lm extends M{static styles=`
        .friends {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .friends__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${S()}
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
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
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${a("sm")};
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .friends__sectionhint {
                margin: 0 0 ${a("sm")};
                color: ${l("text-muted")};
                font-size: 0.85rem;
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
                ${re()}
                width: 100%;
                padding: ${a("md")} ${a("lg")};
                font-size: 1rem;
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
                ${R()}

                /* Pointer affordance for the tappable (mutual) rows — the
                   disabled one-way rows keep the flat card. */
                &:has(.friend-row__main:not(:disabled):hover) {
                    background: ${l("hover-bg")};
                }

                & .friend-row__main {
                    flex: 1; min-width: 0;
                    display: flex; align-items: center; gap: ${a("md")};
                    padding: 0; margin: 0;
                    background: none; border: none;
                    font-family: inherit; font-size: inherit; color: inherit;
                    text-align: left; cursor: pointer;
                    &:disabled { cursor: default; }
                }
                & .friend-row__badge {
                    ${Le(40)}
                    background: ${l("primary")}; color: ${l("primary-text")};
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
                & .friend-row__club,
                & .friend-row__subtitle {
                    color: ${l("text-muted")}; font-size: 0.8rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .friend-row__subtitle:empty,
                & .friend-row__club:empty { display: none; }
                & .friend-row__hcp {
                    font-weight: 700; flex-shrink: 0;
                    color: ${l("accent")}; background: ${l("accent-soft")};
                    border-radius: ${l("radius-pill")};
                    padding: 2px 10px; font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                }
                & .friend-row__add {
                    ${S()}
                    flex-shrink: 0; padding: ${a("sm")} ${a("lg")};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
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
                    ${S()}
                    width: 40px; height: 40px; flex-shrink: 0;
                    box-sizing: border-box;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: transparent;
                    border-color: transparent;
                    box-shadow: none;
                    color: ${l("text-muted")};
                    transition: background ${l("dur-fast")} ${l("ease-standard")}, color ${l("dur-fast")} ${l("ease-standard")};

                    & svg { display: block; width: 19px; height: 19px; }
                    &:hover, &:active {
                        background: ${l("surface-sunken")};
                        border-color: transparent;
                        box-shadow: none;
                        color: ${l("error")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${l("error")};
                        outline-offset: 2px;
                        box-shadow: none;
                    }
                    &:disabled { cursor: default; }
                }
            }
        }
    `;svc=this.inject(es);auth=this.inject(V);router=this.inject(q);removeOpen=new p(!1);removeTarget=new p(null);render(){const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.load();const t=this.wire(Am,{anon:{className:()=>e()?"friends__anon hidden":"friends__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},body:{className:()=>e()?"friends__body":"friends__body hidden"},search:{value:()=>this.svc.query.get(),oninput:r=>this.svc.setQuery(r.target.value)},searchHint:{textContent:()=>{const r=this.svc.query.get().trim();return r.length>0&&!En(r)?"Type at least 2 characters.":this.svc.searching.get()?"Searching…":""}},searchErr:{textContent:()=>this.svc.searchError.get()?.message??""},resultsEmpty:{className:()=>{const r=this.svc.query.get().trim();return En(r)&&!this.svc.searching.get()&&this.svc.searchError.get()===null&&this.svc.resultsFor.get()===r&&this.svc.results.get().length===0?"friends__empty":"friends__empty hidden"}},friendsEmpty:{className:()=>this.svc.loaded.get()&&Tt(this.svc.friends.get()).mutual.length===0?"friends__empty":"friends__empty hidden"},connectionsSection:{className:()=>Tt(this.svc.friends.get()).addedByMe.length>0?"friends__section":"friends__section hidden"},sortToggle:{className:()=>this.svc.friends.get().length>0?"friends__sort":"friends__sort hidden"},sortFrecency:{"aria-pressed":()=>String(this.svc.sortMode.get()==="frecency"),onclick:()=>this.svc.setSortMode("frecency")},sortAlpha:{"aria-pressed":()=>String(this.svc.sortMode.get()==="alpha"),onclick:()=>this.svc.setSortMode("alpha")}});this.$each(this.ref(t,"results"),this.svc.results,(r,o,d)=>this.wireEl(zm,{...Te(()=>this.svc.results.get().find(c=>c.id===r.id)??r),name:()=>r.displayName,username:()=>r.homeClubName?`@${r.username} · ${r.homeClubName}`:`@${r.username}`,hcp:()=>r.handicapIndex===null?"–":r.handicapIndex.toFixed(1),add:{className:()=>this.isFriendNow(r.id)?"friend-row__add hidden":"friend-row__add",disabled:()=>this.svc.mutating.get(),onclick:()=>{const c=this.svc.results.get().find(u=>u.id===r.id);c&&!c.isFriend&&this.svc.add(c)}},added:{className:()=>this.isFriendNow(r.id)?"friend-row__added":"friend-row__added hidden"}},d),r=>r.id);const n=new Date().toISOString();this.$each(this.ref(t,"friends"),()=>At(Tt(this.svc.friends.get()).mutual,this.svc.sortMode.get()),(r,o,d)=>this.wireEl(Mi,this.friendRowBindings(r,n),d),r=>r.id),this.$each(this.ref(t,"connections"),()=>At(Tt(this.svc.friends.get()).addedByMe,this.svc.sortMode.get()),(r,o,d)=>this.wireEl(Mi,this.friendRowBindings(r,n),d),r=>r.id),this.spawn(oe,this.ref(t,"removeConfirmHost"),{open:this.removeOpen,title:()=>{const r=this.removeTarget.get();return r?`Remove ${r.displayName} from friends?`:"Remove friend?"},message:()=>{const r=this.removeTarget.get();return r?`${r.displayName} will disappear from your friends list. You can add them again later.`:"They will disappear from your friends list. You can add them again later."},confirmLabel:"Remove friend",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const r=this.removeTarget.get();r&&this.svc.remove(r.id)}});const i=r=>{r.key==="Escape"&&this.removeOpen.get()&&this.removeOpen.set(!1)};return window.addEventListener("keydown",i),this.track(()=>window.removeEventListener("keydown",i)),t}liveFriend(e){return this.svc.friends.get().find(t=>t.id===e.id)??e}askRemove(e){const t=this.liveFriend(e);this.removeTarget.set({id:t.id,displayName:t.displayName}),this.removeOpen.set(!0)}friendRowBindings(e,t){return{...Te(()=>this.svc.friends.get().find(n=>n.id===e.id)??e),open:{disabled:()=>!this.liveFriend(e).isMutual,onclick:()=>{const n=this.liveFriend(e);n.isMutual&&this.router.navigate("/friend",{query:{id:e.id,name:n.displayName}})}},name:()=>e.displayName,username:()=>bl(this.liveFriend(e)),club:()=>yl(this.liveFriend(e)),subtitle:()=>gl(this.liveFriend(e),t),hcp:()=>e.handicapIndex===null?"–":e.handicapIndex.toFixed(1),remove:{"aria-label":()=>`Remove ${this.liveFriend(e).displayName} from friends`,title:()=>`Remove ${this.liveFriend(e).displayName} from friends`,disabled:()=>this.svc.mutating.get()||this.removeOpen.get(),onclick:()=>this.askRemove(e)}}}isFriendNow(e){return this.svc.results.get().find(t=>t.id===e)?.isFriend===!0}}const ma=b(`
    <button bind="row" type="button" class="fr-row">
        <span class="fr-row__text">
            <span bind="title" class="fr-row__title"></span>
            <span bind="subtitle" class="fr-row__subtitle"></span>
        </span>
        <span bind="progress" class="fr-row__progress"></span>
    </button>
`);function ga(s,e){return{row:{onclick:()=>e(s.roundId)},title:()=>Rl(s),subtitle:()=>Nl(s,Fe),progress:()=>Ol(s)}}function ba(){return`
        & .fr-row {
            display: flex; align-items: center; gap: ${a("md")};
            width: 100%;
            padding: ${a("md")} ${a("lg")};
            background: none; border: none; border-bottom: 1px solid ${l("border")};
            font-family: inherit; text-align: left; cursor: pointer;

            &:hover { background: ${l("hover-bg")}; }

            & .fr-row__text {
                flex: 1; min-width: 0;
                display: flex; flex-direction: column; gap: 1px;
            }
            & .fr-row__title {
                font-weight: 600; font-size: 1rem; color: ${l("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .fr-row__subtitle {
                color: ${l("text-muted")}; font-size: 0.8rem;
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .fr-row__progress {
                flex-shrink: 0; font-size: 0.85rem; font-weight: 700;
                color: ${l("accent")};
            }
        }
    `}const Fm=b(`
    <div class="fprofile">
        <button bind="back" class="fprofile__back" type="button">Back to friends</button>

        <div bind="anon" class="fprofile__anon">
            <p>Friend profiles live behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="pending" class="fprofile__pending">
            <h1 bind="pendingName" class="fprofile__pendingname"></h1>
            <p bind="state" class="fprofile__state"></p>
            <button bind="retry" class="fprofile__retry" type="button">Try again</button>
        </div>

        <div bind="refusal" class="fprofile__refusal">
            <h1 bind="refusalName" class="fprofile__pendingname"></h1>
            <p bind="refusalTitle" class="fprofile__refusaltitle"></p>
            <p bind="refusalMsg" class="fprofile__state"></p>
        </div>

        <div bind="body" class="fprofile__body">
            <div class="fprofile__card">
                <div class="fprofile__band"></div>
                ${Ee("fprofile__avatar")}
                <div class="fprofile__who">
                    <h1 bind="name"></h1>
                    <p bind="username" class="fprofile__username"></p>
                    <p bind="identity" class="fprofile__identity"></p>
                    <button bind="live" class="fprofile__live" type="button"></button>
                </div>
                <div class="fprofile__stats">
                    <span class="fprofile__stat">
                        <span bind="statRounds" class="fprofile__statnum"></span>
                        <span class="fprofile__statlabel">Rounds</span>
                    </span>
                    <span class="fprofile__stat">
                        <span bind="statYear" class="fprofile__statnum"></span>
                        <span class="fprofile__statlabel">This year</span>
                    </span>
                    <span class="fprofile__stat">
                        <span bind="statCourses" class="fprofile__statnum"></span>
                        <span class="fprofile__statlabel">Courses</span>
                    </span>
                </div>
            </div>

            <section class="fprofile__section">
                <h2>Recent rounds</h2>
                <p bind="recentEmpty" class="fprofile__hint">No rounds are shared with you.</p>
                <div bind="recentCard" class="fprofile__listcard">
                    <div bind="recentList"></div>
                    <button bind="seeAll" class="fprofile__more" type="button">
                        <span>See all rounds</span>
                        <span class="fprofile__chev" aria-hidden="true"></span>
                    </button>
                </div>
            </section>

            <section class="fprofile__section">
                <h2>Courses</h2>
                <div class="fprofile__listcard">
                    <button bind="coursesRow" class="fprofile__more" type="button">
                        <span class="fprofile__morecol">
                            <span bind="coursesLine"></span>
                            <span class="fprofile__moresub">See where they play</span>
                        </span>
                        <span class="fprofile__chev" aria-hidden="true"></span>
                    </button>
                </div>
            </section>
        </div>
    </div>
`);class Gm extends M{static styles=`
        .fprofile {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .fprofile__back {
                ${S()}
                margin-bottom: ${a("lg")};
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .fprofile__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${S()}
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                }
            }

            & .fprofile__pending.hidden, & .fprofile__refusal.hidden { display: none; }
            & .fprofile__pendingname {
                margin: 0 0 ${a("sm")};
                font-family: ${l("font-display")};
                font-weight: 600; font-size: 1.7rem; letter-spacing: -0.02em;
            }
            & .fprofile__refusaltitle { margin: 0; font-weight: 700; }
            & .fprofile__state {
                margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
            }
            & .fprofile__retry {
                ${S()}
                margin-top: ${a("md")};
                padding: ${a("sm")} ${a("lg")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .fprofile__body.hidden { display: none; }

            /* The header is the screen's one moment of ceremony: a soft accent
               band behind a large centered avatar — the portrait straddles the
               band the way a clubhouse portrait hangs over the wainscot. */
            & .fprofile__card {
                ${R()}
                overflow: hidden;
                text-align: center;
                margin-bottom: ${a("xl")};

                & .fprofile__band {
                    height: 72px;
                    background: ${l("accent-soft")};
                }
                & .fprofile__avatar {
                    ${Le(96,"2rem")}
                    margin: -48px auto 0;
                    background: ${l("primary")}; color: ${l("primary-text")};
                    border: 3px solid ${l("surface")};
                }
                & .fprofile__who {
                    padding: ${a("sm")} ${a("lg")} 0;
                    & h1 {
                        margin: ${a("xs")} 0 0;
                        font-family: ${l("font-display")};
                        font-weight: 600; font-size: 1.5rem; letter-spacing: -0.02em;
                    }
                }
                & .fprofile__username {
                    margin: 1px 0 0; color: ${l("text-muted")}; font-size: 0.8rem;
                }
                & .fprofile__identity {
                    margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem;
                    &:empty { display: none; }
                }
                & .fprofile__live {
                    ${S()}
                    margin-top: ${a("xs")};
                    padding: 2px ${a("sm")};
                    background: none; border: none;
                    font-family: inherit; font-size: 0.85rem; font-weight: 700;
                    color: ${l("accent")};
                    &.hidden { display: none; }
                }
                & .fprofile__stats {
                    display: flex;
                    padding: ${a("lg")} 0;
                }
                & .fprofile__stat {
                    flex: 1;
                    display: flex; flex-direction: column; gap: 1px;
                }
                /* The aggregates — the one place the full counts belong. They
                   include rounds the lists below will not show, by design. */
                & .fprofile__statnum {
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.5rem;
                    color: ${l("primary")};
                }
                & .fprofile__statlabel { font-size: 0.75rem; color: ${l("text-muted")}; }
            }

            & .fprofile__section {
                margin-bottom: ${a("xl")};
                & h2 {
                    margin: 0 0 ${a("sm")};
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }
            /* The aggregates above may say plenty — the list can still be
               empty, because only rounds shared with friends appear here. */
            & .fprofile__hint {
                margin: 0; color: ${l("text-muted")}; font-size: 0.85rem;
                &.hidden { display: none; }
            }

            & .fprofile__listcard {
                ${R()}
                overflow: hidden;
                &.hidden { display: none; }
            }
            ${ba()}
            & .fprofile__more {
                display: flex; align-items: center; gap: ${a("md")};
                width: 100%; min-height: 44px;
                padding: ${a("md")} ${a("lg")};
                background: none; border: none;
                font-family: inherit; font-size: 0.9rem; font-weight: 600;
                color: ${l("text")}; text-align: left; cursor: pointer;
                &:hover { background: ${l("hover-bg")}; }
                & > span:first-child { flex: 1; min-width: 0; }
            }
            & .fprofile__morecol {
                display: flex; flex-direction: column; gap: 1px;
            }
            & .fprofile__moresub {
                font-weight: 400; font-size: 0.8rem; color: ${l("text-muted")};
            }
            & .fprofile__chev {
                flex-shrink: 0;
                width: 0.45em; height: 0.45em;
                border-right: 2px solid ${l("accent")};
                border-bottom: 2px solid ${l("accent")};
                transform: rotate(-45deg);
            }
        }
    `;svc=this.inject(ts);activity=this.inject(tn);auth=this.inject(V);router=this.inject(q);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(C(()=>{const m=e.get();se(()=>{!m||!n()||(this.svc.setPlayer(m),this.svc.loadProfile(),this.activity.load())})}));const i=()=>this.svc.profile.get(),r=()=>(t.get()??"").trim()||"Friend",o=new T(()=>{const m=e.get();return m?Cl(this.activity.feed.get(),m):null}),d=()=>this.svc.unavailable.get(),c=()=>n()&&d()===null&&i()!==null,u=()=>n()&&d()===null&&i()===null,h=m=>this.router.navigate("/spectate",{query:{id:m,name:i()?.player.displayName??r()}}),f=this.wire(Fm,{back:{onclick:()=>this.router.navigate("/friends")},anon:{className:()=>n()?"fprofile__anon hidden":"fprofile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},pending:{className:()=>u()?"fprofile__pending":"fprofile__pending hidden"},pendingName:{textContent:()=>r()},state:{textContent:()=>this.svc.profileLoading.get()?"Loading…":this.svc.profileError.get()??""},retry:{className:()=>this.svc.profileError.get()!==null&&!this.svc.profileLoading.get()?"fprofile__retry":"fprofile__retry hidden",onclick:()=>{this.svc.loadProfile(!0)}},refusal:{className:()=>n()&&d()!==null?"fprofile__refusal":"fprofile__refusal hidden"},refusalName:{textContent:()=>r()},refusalTitle:{textContent:()=>{const m=d();return m?Ke[m].title:""}},refusalMsg:{textContent:()=>{const m=d();return m?Ke[m].message:""}},body:{className:()=>c()?"fprofile__body":"fprofile__body hidden"},...Te(()=>{const m=i();return m?m.player:{id:e.get()??"",avatarVersion:null,displayName:r(),username:null}}),name:{textContent:()=>i()?.player.displayName??""},username:{textContent:()=>{const m=i()?.player.username;return m?`@${m}`:""}},identity:{textContent:()=>{const m=i();return m?Hl(m.player.handicapIndex,m.player.homeClubName)??"":""}},live:{className:()=>o.get()?"fprofile__live":"fprofile__live hidden",textContent:()=>{const m=o.get();return m?Il(m):""},onclick:()=>{const m=o.get();m&&h(m.roundId)}},statRounds:()=>String(i()?.roundsTotal??""),statYear:()=>String(i()?.roundsThisYear??""),statCourses:()=>String(i()?.coursesTotal??""),recentEmpty:{className:()=>(i()?.recentRounds.length??0)===0?"fprofile__hint":"fprofile__hint hidden"},recentCard:{className:()=>(i()?.recentRounds.length??0)>0?"fprofile__listcard":"fprofile__listcard hidden"},seeAll:{onclick:()=>this.router.navigate("/friend-rounds",{query:{id:e.get()??"",name:i()?.player.displayName??r()}})},coursesLine:{textContent:()=>Al(i()?.coursesTotal??0)},coursesRow:{onclick:()=>this.router.navigate("/friend-courses",{query:{id:e.get()??"",name:i()?.player.displayName??r()}})}});return this.$each(this.ref(f,"recentList"),()=>i()?.recentRounds??[],(m,_,g)=>this.wireEl(ma,ga(m,h),g),m=>m.roundId),f}}const jm=b(`
    <div class="frounds">
        <button bind="back" class="frounds__back" type="button">Back to profile</button>

        <header class="frounds__head">
            <h1>Rounds</h1>
            <p bind="subtitle"></p>
        </header>

        <div bind="anon" class="frounds__anon">
            <p>This list lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="refusal" class="frounds__refusal">
            <p bind="refusalTitle" class="frounds__refusaltitle"></p>
            <p bind="refusalMsg" class="frounds__state"></p>
        </div>

        <p bind="state" class="frounds__state"></p>
        <button bind="retry" class="frounds__retry" type="button">Try again</button>
        <p bind="empty" class="frounds__state">No rounds are shared with you.</p>

        <div bind="listCard" class="frounds__listcard">
            <div bind="list"></div>
        </div>
        <button bind="more" class="frounds__more" type="button"></button>
        <p bind="moreError" class="frounds__state"></p>
    </div>
`);class Dm extends M{static styles=`
        .frounds {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .frounds__back {
                ${S()}
                margin-bottom: ${a("lg")};
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .frounds__head {
                margin-bottom: ${a("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.7rem; letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem; }
            }

            & .frounds__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${S()}
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                }
            }
            & .frounds__refusal.hidden { display: none; }
            & .frounds__refusaltitle { margin: 0; font-weight: 700; }
            & .frounds__state {
                margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
                &.hidden { display: none; }
            }
            & .frounds__retry {
                ${S()}
                margin-top: ${a("md")};
                padding: ${a("sm")} ${a("lg")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .frounds__listcard {
                ${R()}
                overflow: hidden;
                &.hidden { display: none; }
                & .fr-row:last-child { border-bottom: none; }
            }
            ${ba()}

            & .frounds__more {
                ${S()}
                display: block;
                margin: ${a("md")} auto 0;
                padding: ${a("sm")} ${a("xl")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
                &:disabled { opacity: 0.6; cursor: default; }
            }
        }
    `;svc=this.inject(ts);auth=this.inject(V);router=this.inject(q);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(C(()=>{const h=e.get();se(()=>{!h||!n()||(this.svc.setPlayer(h),this.svc.loadRounds())})}));const i=()=>this.svc.rounds.get(),r=()=>this.svc.unavailable.get(),o=()=>(t.get()??"").trim(),d=h=>this.router.navigate("/spectate",{query:{id:h,name:o()}}),c=()=>this.router.navigate("/friend",{query:{id:e.get()??"",name:o()}}),u=this.wire(jm,{back:{onclick:c},subtitle:{textContent:()=>{const h=o();return h?`Rounds ${h} has shared with friends.`:"Rounds shared with friends."}},refusal:{className:()=>r()!==null?"frounds__refusal":"frounds__refusal hidden"},refusalTitle:{textContent:()=>{const h=r();return h?Ke[h].title:""}},refusalMsg:{textContent:()=>{const h=r();return h?Ke[h].message:""}},anon:{className:()=>n()?"frounds__anon hidden":"frounds__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:`/friend-rounds?id=${e.get()??""}&name=${encodeURIComponent(t.get()??"")}`}})},state:{textContent:()=>r()!==null||!n()?"":this.svc.roundsLoading.get()?"Loading…":i().rounds.length===0?this.svc.roundsError.get()??"":""},retry:{className:()=>r()===null&&this.svc.roundsError.get()!==null&&i().rounds.length===0&&!this.svc.roundsLoading.get()?"frounds__retry":"frounds__retry hidden",onclick:()=>{this.svc.loadRounds(!0)}},empty:{className:()=>r()===null&&this.svc.roundsLoaded.get()&&i().rounds.length===0&&this.svc.roundsError.get()===null?"frounds__state":"frounds__state hidden"},listCard:{className:()=>r()===null&&i().rounds.length>0?"frounds__listcard":"frounds__listcard hidden"},more:{className:()=>r()===null&&pr(i())&&i().rounds.length>0?"frounds__more":"frounds__more hidden",disabled:()=>this.svc.loadingMore.get(),textContent:()=>this.svc.loadingMore.get()?"Loading…":"Show more rounds",onclick:()=>{this.svc.loadMoreRounds()}},moreError:{textContent:()=>i().rounds.length>0?this.svc.roundsError.get()??"":""}});return this.$each(this.ref(u,"list"),()=>r()===null?i().rounds:[],(h,f,m)=>this.wireEl(ma,ga(h,d),m),h=>h.roundId),u}}const qm=b(`
    <div class="fcourses">
        <button bind="back" class="fcourses__back" type="button">Back to profile</button>

        <header class="fcourses__head">
            <h1>Courses</h1>
            <p bind="subtitle"></p>
        </header>

        <div bind="anon" class="fcourses__anon">
            <p>This list lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="refusal" class="fcourses__refusal">
            <p bind="refusalTitle" class="fcourses__refusaltitle"></p>
            <p bind="refusalMsg" class="fcourses__state"></p>
        </div>

        <p bind="state" class="fcourses__state"></p>
        <button bind="retry" class="fcourses__retry" type="button">Try again</button>
        <p bind="empty" class="fcourses__state">No courses to show — no rounds are shared with you.</p>

        <div bind="listCard" class="fcourses__listcard">
            <div bind="list"></div>
        </div>
        <p bind="truncated" class="fcourses__state">Showing the courses played most recently — the full list is longer.</p>
    </div>
`),Vm=b(`
    <div class="fcourse-row">
        <span bind="name" class="fcourse-row__name"></span>
        <span bind="facts" class="fcourse-row__facts"></span>
    </div>
`);class Um extends M{static styles=`
        .fcourses {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .fcourses__back {
                ${S()}
                margin-bottom: ${a("lg")};
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .fcourses__head {
                margin-bottom: ${a("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.7rem; letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem; }
            }

            & .fcourses__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${S()}
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                }
            }
            & .fcourses__refusal.hidden { display: none; }
            & .fcourses__refusaltitle { margin: 0; font-weight: 700; }
            & .fcourses__state {
                margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
                &.hidden { display: none; }
            }
            & .fcourses__retry {
                ${S()}
                margin-top: ${a("md")};
                padding: ${a("sm")} ${a("lg")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .fcourses__listcard {
                ${R()}
                overflow: hidden;
                margin-bottom: ${a("sm")};
                &.hidden { display: none; }
            }
            & .fcourse-row {
                display: flex; flex-direction: column; gap: 1px;
                padding: ${a("md")} ${a("lg")};
                border-bottom: 1px solid ${l("border")};
                &:last-child { border-bottom: none; }

                & .fcourse-row__name { font-weight: 600; font-size: 1rem; }
                & .fcourse-row__facts { color: ${l("text-muted")}; font-size: 0.8rem; }
            }
        }
    `;svc=this.inject(ts);auth=this.inject(V);router=this.inject(q);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(C(()=>{const c=e.get();se(()=>{!c||!n()||(this.svc.setPlayer(c),this.svc.loadCourses())})}));const i=()=>this.svc.unavailable.get(),r=()=>i()===null?this.svc.courses.get():[],o=()=>(t.get()??"").trim(),d=this.wire(qm,{back:{onclick:()=>this.router.navigate("/friend",{query:{id:e.get()??"",name:o()}})},subtitle:{textContent:()=>{const c=o();return c?`Where ${c} has played the rounds they share.`:"Where the rounds they share were played."}},refusal:{className:()=>i()!==null?"fcourses__refusal":"fcourses__refusal hidden"},refusalTitle:{textContent:()=>{const c=i();return c?Ke[c].title:""}},refusalMsg:{textContent:()=>{const c=i();return c?Ke[c].message:""}},anon:{className:()=>n()?"fcourses__anon hidden":"fcourses__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:`/friend-courses?id=${e.get()??""}&name=${encodeURIComponent(o())}`}})},state:{textContent:()=>i()!==null||!n()?"":this.svc.coursesLoading.get()?"Loading…":this.svc.coursesError.get()??""},retry:{className:()=>i()===null&&this.svc.coursesError.get()!==null&&!this.svc.coursesLoading.get()?"fcourses__retry":"fcourses__retry hidden",onclick:()=>{this.svc.loadCourses(!0)}},empty:{className:()=>i()===null&&this.svc.coursesLoaded.get()&&r().length===0&&this.svc.coursesError.get()===null?"fcourses__state":"fcourses__state hidden"},listCard:{className:()=>r().length>0?"fcourses__listcard":"fcourses__listcard hidden"},truncated:{className:()=>i()===null&&this.svc.coursesHasMore.get()&&r().length>0?"fcourses__state":"fcourses__state hidden"}});return this.$each(this.ref(d,"list"),r,(c,u,h)=>this.wireEl(Vm,{name:()=>c.courseName??"Course",facts:()=>Ml(c,Fe)},h),c=>c.courseId),d}}function Km(s,e,t){const n=ft(e);if(n){const d=Bi(s);return d?`Watching · ${d} ${n}`:`Watching · ${n}`}const i=Bi(s)??"this",r=ft(t),o=r?` at ${r}`:"";return`Watching · ${i} round${o}`}function Wm(s,e,t,n){const i=ft(s)===null?null:ft(e),r=n!==null?`${n} holes`:null;return[i,r,t==="complete"?"Finished":t==="not_started"?"Not started":null].filter(c=>c!==null).join(" · ")||null}const Ym="You're watching this round. Only its players can enter scores.",Ai={forbidden:{title:"Round not available",message:"This round is no longer shared with you."},not_found:{title:"Round not found",message:"This round doesn't exist anymore."}};function Bi(s){const e=ft(s);return e?e.toLowerCase().endsWith("s")?`${e}'`:`${e}'s`:null}function ft(s){return(s??"").trim()||null}const Xm=b(`
    <div class="spectate">
        <button bind="back" class="spectate__back" type="button">Back</button>

        <div bind="anon" class="spectate__anon">
            <p>Watching a round lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="refusal" class="spectate__refusal">
            <p bind="refusalTitle" class="spectate__refusaltitle"></p>
            <p bind="refusalMsg" class="spectate__state"></p>
        </div>

        <p bind="state" class="spectate__state"></p>
        <button bind="retry" class="spectate__retry" type="button">Try again</button>

        <div bind="body" class="spectate__body">
            <header class="spectate__head">
                <div class="spectate__titlerow">
                    <h1 bind="title"></h1>
                    <span bind="status" class="spectate__status"></span>
                </div>
                <p bind="subtitle" class="spectate__subtitle"></p>
                <p bind="date" class="spectate__date"></p>
            </header>

            <div bind="board" class="lb"></div>

            <p class="spectate__note">${Ym}</p>
        </div>
    </div>
`);class Qm extends M{static styles=`
        .spectate {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .spectate__back {
                ${S()}
                margin-bottom: ${a("lg")};
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .spectate__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${S()}
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                }
            }
            & .spectate__refusal.hidden { display: none; }
            & .spectate__refusaltitle { margin: 0; font-weight: 700; }
            & .spectate__state {
                margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
            }
            & .spectate__retry {
                ${S()}
                margin-top: ${a("md")};
                padding: ${a("sm")} ${a("lg")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .spectate__body.hidden { display: none; }

            & .spectate__head { margin-bottom: ${a("sm")}; }
            & .spectate__titlerow {
                display: flex; align-items: baseline; gap: ${a("md")};
                justify-content: space-between;
                & h1 {
                    margin: 0;
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.35rem; letter-spacing: -0.02em;
                    min-width: 0;
                }
            }
            & .spectate__status {
                font-size: 0.7rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em;
                border-radius: ${l("radius-pill")};
                padding: 2px 10px; flex-shrink: 0;
                &.s-active { background: ${l("accent-soft")}; color: ${l("accent")}; }
                &.s-complete, &.s-not_started {
                    background: ${l("surface-sunken")}; color: ${l("text-muted")};
                }
                &:empty { display: none; }
            }
            & .spectate__subtitle {
                margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
            }
            & .spectate__date {
                margin: 2px 0 0; color: ${l("text-muted")}; font-size: 0.85rem;
                &:empty { display: none; }
            }

            & .spectate__slot-head {
                margin: ${a("xl")} 0 ${a("sm")};
                font-family: ${l("font-display")};
                font-weight: 600; font-size: 1.1rem;
            }

            & .spectate__note {
                margin: ${a("xl")} 0 0;
                color: ${l("text-muted")}; font-size: 0.85rem;
                text-align: center;
            }
        }
        ${yn.styles}
    `;svc=this.inject(gr);auth=this.inject(V);router=this.inject(q);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(C(()=>{const c=e.get();se(()=>{!c||!n()||(this.svc.setRound(c),this.svc.load())})}));const i=()=>this.svc.view.get(),r=()=>this.svc.unavailable.get(),o=()=>(t.get()??"").trim()||null;return this.wire(Xm,{back:{onclick:()=>{window.history.length>1?window.history.back():this.router.navigate("/")}},anon:{className:()=>n()?"spectate__anon hidden":"spectate__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:`/spectate?id=${e.get()??""}&name=${encodeURIComponent(o()??"")}`}})},refusal:{className:()=>n()&&r()!==null?"spectate__refusal":"spectate__refusal hidden"},refusalTitle:{textContent:()=>{const c=r();return c?Ai[c].title:""}},refusalMsg:{textContent:()=>{const c=r();return c?Ai[c].message:""}},state:{textContent:()=>r()!==null||!n()?"":this.svc.loading.get()&&i()===null?"Loading…":i()===null?this.svc.error.get()??"":""},retry:{className:()=>n()&&r()===null&&this.svc.error.get()!==null&&i()===null&&!this.svc.loading.get()?"spectate__retry":"spectate__retry hidden",onclick:()=>{this.svc.load(!0)}},body:{className:()=>n()&&r()===null&&i()!==null?"spectate__body":"spectate__body hidden"},title:{textContent:()=>{const c=i();return c?Km(o(),c.round.name,c.round.courseNameSnapshot):""}},status:{textContent:()=>{const c=i();return c&&c.status==="active"?"Live":""},className:()=>`spectate__status s-${i()?.status??""}`},subtitle:{textContent:()=>{const c=i();return c?Wm(c.round.name,c.round.courseNameSnapshot,c.status,c.round.playHoles.length||null)??"":""}},date:{textContent:()=>Fe(i()?.round.date??null)},board:{innerHTML:()=>this.renderBoards()}})}renderBoards(){const e=this.svc.view.get();if(!e)return"";const t=r=>this.svc.nameOf(r),n=r=>this.svc.groupLabelOf(r),i=e.result.slots;return i.length===0?'<div class="lb-empty">No formats in this round.</div>':i.map(r=>{const o=i.length>1?`<h2 class="spectate__slot-head">${Jm(r.formatLabel)}</h2>`:"",d=ea(r,t,n),c=ta(r.cards,e.result.routeSections,t),u=c?`<h3 class="lb-cards__head">Scorecard</h3>${c}`:"";return o+d+u}).join("")}}function Jm(s){return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}const Zm=b(`
    <div class="profile">
        <div bind="anon" class="profile__anon">
            <p>Your profile lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>
        <div bind="body" class="profile__body">
            <header class="profile__head">
                <div class="profile__ident">
                    ${Ee("profile__badge")}
                    <div class="profile__names">
                        <div bind="nameDisplay" class="profile__name-display">
                            <h1 bind="name"></h1>
                            <button bind="editName" class="profile__edit-name" type="button"
                                aria-label="Edit display name" title="Edit display name"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                        </div>
                        <form bind="nameForm" class="profile__name-form">
                            <input bind="nameInput" autocomplete="name" aria-label="Display name" />
                            <button bind="cancelName" type="button">Cancel</button>
                            <button bind="saveName" type="submit">Save</button>
                        </form>
                        <p bind="nameErr" class="profile__err"></p>
                        <p bind="username"></p>
                    </div>
                </div>
                <div class="profile__photo-actions">
                    <!-- The real control. Kept in the DOM (not display:none) so
                         the picker it opens has a live element to return to. -->
                    <input bind="photoFile" type="file" class="profile__file"
                           accept="image/jpeg,image/png,image/webp" />
                    <button bind="photoPick" type="button"></button>
                    <button bind="photoRemove" type="button" class="profile__photo-remove"></button>
                </div>
                <p bind="photoErr" class="profile__err"></p>
            </header>

            <!-- One card, three field rows. Home club leads: it is the fact
                 other players see next to your name, where gender and tee are
                 plumbing for which tee a round starts you on. -->
            <section class="profile__card">
                <div class="pfield">
                    <span class="pfield__label">Home club</span>
                    <div bind="club" class="pfield__control"></div>
                    <p class="pfield__hint">Shown next to your name when someone searches for you — how they tell you from the other John Smith.</p>
                    <p bind="clubErr" class="profile__err"></p>
                </div>
                <div class="profile__rule"></div>
                <!-- Every option is one or two characters, so label and track
                     share a row (design-guidelines §2 "size to content"). -->
                <div class="pfield pfield--inline">
                    <span class="pfield__label">Gender</span>
                    <div bind="gender" class="pfield__seg"></div>
                    <p class="pfield__hint">Used for tee ratings — set once and it locks in "Add me" during round setup.</p>
                    <p bind="genderErr" class="profile__err"></p>
                </div>
                <div class="profile__rule"></div>
                <div class="pfield">
                    <span class="pfield__label">Preferred tee
                        ${Kr("teeRoleInfo","How preferred tee works")}</span>
                    <div bind="teeRole" class="pfield__control"></div>
                    <p bind="teeRoleHint" class="pfield__hint"></p>
                    <p bind="teeRoleExplain" class="pfield__hint profile__tee-explain"></p>
                    <p bind="teeRoleErr" class="profile__err"></p>
                </div>
            </section>

            <!-- Index and history are one subject: the number, then the chain
                 of saves that produced it. A separate "Handicap history"
                 heading said nothing the rows do not. -->
            <section class="profile__card">
                <div class="pfield">
                    <span class="pfield__label">Handicap index</span>
                    <div class="profile__hcp-row">
                        <span bind="hcp" class="profile__hcp"></span>
                        <form bind="form" class="profile__edit">
                            <input bind="index" inputmode="decimal" placeholder="e.g. 18.4" />
                            <button type="submit" bind="save">Save</button>
                        </form>
                    </div>
                    <p class="pfield__hint">Maintained by you — each save is recorded below with its effective date.</p>
                </div>
                <p bind="saveErr" class="profile__err"></p>
                <div class="profile__rule"></div>
                <div bind="historyEmpty" class="profile__empty">No entries yet — save an index to start the chain.</div>
                <div bind="history" class="profile__history"></div>
            </section>

            <!-- Last on the page, as on iOS (ProfileView.swift:157-158 orders
                 historySection then statsSection): the facts above are what the
                 profile IS, this is a preference about a different screen. -->
            <section class="profile__section profile__stats">
                <h2>Statistics</h2>
                <div class="profile__card">
                    <!-- The way in to /stats. Above the switches because it is
                         what the section is FOR — the toggles below decide what
                         the dashboard will have to show next time. -->
                    <button bind="toStats" class="statlink" type="button">
                        <span class="statlink__text">
                            <span class="statlink__title">Your statistics</span>
                            <span class="statlink__hint">Fairways, greens, putting and scoring over a window of rounds.</span>
                        </span>
                        <span class="statlink__chev" aria-hidden="true"></span>
                    </button>
                    <div bind="statlinkRule" class="statrow__rule"></div>
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
`),eg=b(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`),tg=b(`
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
`);class sg extends M{static styles=`
        .profile {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .profile__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${S()}
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                }
            }

            & .profile__body.hidden { display: none; }

            & .profile__head {
                margin-bottom: ${a("xl")};

                & .profile__ident { display: flex; align-items: center; gap: ${a("lg")}; }
                & .profile__names { min-width: 0; }

                & .profile__name-display {
                    display: flex; align-items: flex-start;
                }
                & .profile__name-display.hidden, & .profile__name-form.hidden { display: none; }
                & .profile__edit-name {
                    ${S()}
                    display: grid; place-items: center;
                    flex: 0 0 28px;
                    width: 28px; height: 28px; margin: 0 0 0 2px; padding: 0;
                    color: ${l("text-muted")}; background: transparent;
                    border-color: transparent;
                    &:hover { color: ${l("text")}; background: ${l("hover-bg")}; }
                    &:disabled { opacity: 0.5; cursor: default; }
                    & svg { width: 18px; height: 18px; }
                }
                & .profile__name-form {
                    display: flex; align-items: center; gap: ${a("xs")};
                    max-width: 100%;
                    & input {
                        ${re()}
                        width: min(100%, 250px);
                        padding: ${a("sm")} ${a("md")};
                        font: 600 1rem ${l("font-display")};
                    }
                    & button {
                        ${S()}
                        padding: ${a("sm")} ${a("md")};
                        font-family: inherit; font-size: 0.85rem; font-weight: 700;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                    & button[type='submit'] {
                        background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")};
                    }
                }

                & .profile__badge {
                    ${Le(72,"1.5rem")}
                    background: ${l("accent-soft")};
                    color: ${l("accent")};
                }

                & .profile__photo-actions {
                    display: flex; align-items: center; gap: ${a("sm")};
                    margin-top: ${a("md")};

                    /* Off-screen rather than hidden: display:none makes the
                       element unfocusable, and Safari will not open a file
                       picker for a scripted click on one. */
                    & .profile__file {
                        position: absolute;
                        width: 1px; height: 1px;
                        opacity: 0; pointer-events: none;
                    }

                    & button {
                        ${S()}
                        padding: ${a("sm")} ${a("md")};
                        font-family: inherit; font-size: 0.85rem; font-weight: 700;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                    /* Destructive, so it does not get the same weight as
                       Change — a mis-tap here costs the photo. */
                    & .profile__photo-remove {
                        background: none;
                        color: ${l("error")};
                        border-color: ${l("border")};
                        &.hidden { display: none; }
                    }
                }

                & .profile__err {
                    margin: ${a("sm")} 0 0; font-size: 0.85rem; color: ${l("error")};
                    &:empty { display: none; }
                }

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
                ${R()}

                /* One fact per row: label, control, then the muted line that
                   explains the CURRENT selection (design-guidelines §3).
                   Sentence case, not the old uppercase micro-caps: three of
                   those stacked in one card read as three card headers. */
                & .pfield {
                    display: flex; flex-direction: column; gap: ${a("sm")};

                    & .pfield__label {
                        display: inline-flex; align-items: center; gap: ${a("xs")};
                        font-size: 0.95rem; font-weight: 600; color: ${l("text")};
                    }
                    & .pfield__control { & .ui-select { display: block; width: 100%; } }
                    & .pfield__hint {
                        margin: 0; font-size: 0.8rem; line-height: 1.4; color: ${l("text-muted")};
                        &:empty { display: none; }
                    }
                }
                /* Short options only: label left, track right, hint spanning
                   underneath both. */
                & .pfield--inline {
                    flex-direction: row; align-items: center; flex-wrap: wrap;
                    justify-content: space-between;
                    & .pfield__hint { flex-basis: 100%; }
                }

                /* Track segmented control — the same anatomy as
                   .fslot__seg in create.component.ts, and the same reason:
                   the selection reads from ELEVATION (a raised pill on a
                   sunken track), never from a solid primary fill, which is
                   reserved for primary actions (design-guidelines §2).
                   Deliberately NOT btn() — btn() emits the full-bleed slab
                   sizing this replaces. */
                & .pfield__seg {
                    display: inline-flex; gap: 2px;
                    padding: 3px; border: 1px solid ${l("border")};
                    border-radius: ${l("radius-pill")}; background: ${l("surface-sunken")};
                    & button {
                        appearance: none; border: 1px solid transparent; background: none;
                        padding: ${a("xs")} ${a("md")}; border-radius: ${l("radius-pill")};
                        font-family: inherit; font-weight: 500; font-size: 0.85rem;
                        color: ${l("text-muted")}; cursor: pointer; white-space: nowrap;
                        &:hover { color: ${l("text")}; }
                        &.on {
                            background: ${l("surface")}; border-color: ${l("border")};
                            color: ${l("text")}; font-weight: 700;
                        }
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }

                /* Hairline between rows of the same card. */
                & .profile__rule {
                    height: 1px; margin: ${a("lg")} 0;
                    background: ${l("border")};
                }

                & .profile__hcp-row {
                    display: flex; align-items: center; gap: ${a("md")};
                }
                & .profile__hcp {
                    font-family: ${l("font-display")};
                    font-weight: 700; font-size: 2rem;
                    font-variant-numeric: tabular-nums;
                    color: ${l("text")};
                }
                & .profile__edit {
                    display: flex; gap: ${a("sm")}; flex: 1; justify-content: flex-end;
                    & input { ${re()} width: 90px; padding: ${a("md")}; font-size: 1rem; text-align: center; }
                    & button {
                        ${S()}
                        padding: ${a("md")} ${a("lg")}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700;
                        background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
                & .profile__err {
                    margin: ${a("sm")} 0 0; font-size: 0.85rem; color: ${l("error")};
                    &:empty { display: none; }
                }

                /* The long-form answer behind the ⓘ. Closed by default: the
                   hint line above it already names the live selection. */
                & .profile__tee-explain.hidden { display: none; }
            }

            /* Statistics: the master switch, a hairline, then the six modules
               INDENTED under it — they are not six more profile facts, they are
               the contents of the row above and dead while it is off. */
            & .profile__statmods {
                display: flex;
                flex-direction: column;
                gap: ${a("md")};
                padding-left: ${a("md")};
            }

            & .statrow {
                display: flex;
                align-items: flex-start;
                gap: ${a("md")};
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
                    border-radius: ${l("radius-pill")};
                    background: ${l("border")};
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
                        background: ${l("primary")};
                        &::after { transform: translateX(20px); }
                    }
                }
                /* Takes the slack so the switch sits hard against the trailing
                   edge, as the label/control split does on iOS. */
                & .statrow__text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                & .statrow__head {
                    display: flex; align-items: baseline; gap: ${a("sm")};
                    flex-wrap: wrap;
                }
                & .statrow__title { font-size: 1rem; font-weight: 600; color: ${l("text")}; }
                /* The unmet dependency, in words — "Needs Putting". The row is
                   locked either way; this is the half that says which switch to
                   move to get it back. */
                & .statrow__ann {
                    font-size: 0.8rem; color: ${l("text-muted")};
                    &:empty { display: none; }
                }
                & .statrow__hint { font-size: 0.8rem; color: ${l("text-muted")}; }
            }

            & .statrow__rule {
                height: 1px;
                margin: ${a("md")} 0;
                background: ${l("border")};
                &.hidden { display: none; }
            }

            /* The dashboard link. A row, not a button-looking control: it goes
               somewhere, and the chevron is the only affordance it needs. */
            & .statlink {
                ${S()}
                display: flex;
                align-items: center;
                gap: ${a("md")};
                width: 100%;
                padding: 0;
                font-family: inherit;
                text-align: left;
                background: transparent;
                border: none;
                border-radius: 0;

                &.hidden { display: none; }

                & .statlink__text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                & .statlink__title { font-size: 1rem; font-weight: 600; color: ${l("text")}; }
                & .statlink__hint { font-size: 0.8rem; color: ${l("text-muted")}; }
                & .statlink__chev {
                    flex-shrink: 0;
                    width: 0; height: 0;
                    border-top: 5px solid transparent;
                    border-bottom: 5px solid transparent;
                    border-left: 6px solid ${l("text-muted")};
                }
            }

            /* A section is a heading plus its card; without this the card's own
               bottom margin was the only thing separating one section from the
               next heading, and the last one had nothing at all under it. */
            & .profile__section {
                margin-bottom: ${a("xl")};

                & h2 {
                    margin: 0 0 ${a("sm")};
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .profile__empty {
                color: ${l("text-muted")}; font-size: 0.9rem;
                &.hidden { display: none; }
            }

            /* The chain is ONE card — the card is the handicap card the rows
               belong to, so the rows carry no chrome of their own and are
               separated by a hairline instead. */
            & .profile__history { display: flex; flex-direction: column; }

            & .hcp-entry {
                display: flex; align-items: baseline; gap: ${a("md")};
                padding: ${a("sm")} 0;

                & + & { border-top: 1px solid ${l("border")}; }

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
        }
        ${Wr}
    `;svc=this.inject(Ie);auth=this.inject(V);router=this.inject(q);indexDraft=new p("");localErr=new p("");nameDraft=new p("");nameEditing=new p(!1);nameErr=new p("");teeRoleInfoOpen=new p(!1);render(){this.auth.currentUser.get()&&this.svc.load();const e=()=>this.auth.currentUser.get()!==null;let t=null,n=null;const i=this.wire(Zm,{anon:{className:()=>e()?"profile__anon hidden":"profile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/profile"}})},body:{className:()=>e()?"profile__body":"profile__body hidden"},...Te(()=>{const h=this.svc.player.get();return{id:h?.id??"",avatarVersion:h?.avatarVersion??null,displayName:h?.displayName,username:h?.username}}),photoFile:{onchange:h=>{const f=h.target,m=f.files?.[0];f.value="",m&&this.svc.saveAvatar(m)}},photoPick:{textContent:()=>this.svc.avatarSaving.get()?"Saving…":this.svc.player.get()?.avatarVersion?"Change photo":"Add photo",disabled:()=>this.svc.avatarSaving.get(),onclick:()=>t?.click()},photoRemove:{textContent:()=>"Remove",className:()=>this.svc.player.get()?.avatarVersion?"profile__photo-remove":"profile__photo-remove hidden",disabled:()=>this.svc.avatarSaving.get(),onclick:()=>{this.svc.removeAvatar()}},photoErr:{textContent:()=>this.svc.avatarError.get()?.message??""},nameDisplay:{className:()=>this.nameEditing.get()?"profile__name-display hidden":"profile__name-display"},name:()=>this.svc.player.get()?.displayName??"…",editName:{disabled:()=>this.svc.saving.get(),onclick:()=>{this.nameDraft.set(this.svc.player.get()?.displayName??""),this.nameErr.set(""),this.nameEditing.set(!0),queueMicrotask(()=>n?.focus())}},nameForm:{className:()=>this.nameEditing.get()?"profile__name-form":"profile__name-form hidden",onsubmit:async h=>{h.preventDefault();const f=this.nameDraft.get().trim();if(!f){this.nameErr.set("Enter a display name.");return}this.nameErr.set(""),await this.svc.saveDisplayName(f)&&this.nameEditing.set(!1)}},nameInput:{value:()=>this.nameDraft.get(),disabled:()=>this.svc.saving.get(),oninput:h=>this.nameDraft.set(h.target.value)},cancelName:{disabled:()=>this.svc.saving.get(),onclick:()=>{this.nameEditing.set(!1),this.nameErr.set("")}},saveName:{disabled:()=>this.svc.saving.get()||this.nameDraft.get().trim()==="",textContent:()=>this.svc.saving.get()?"Saving…":"Save"},nameErr:{textContent:()=>this.nameErr.get()||this.saveErrFor("name")},username:()=>{const h=this.svc.player.get();return h?`@${h.username}`:""},hcp:()=>{const h=this.svc.player.get()?.handicapIndex;return h==null?"–":h<0?`+${(-h).toFixed(1)}`:h.toFixed(1)},index:{value:()=>this.indexDraft.get(),oninput:h=>this.indexDraft.set(h.target.value)},save:{disabled:()=>this.svc.saving.get()||this.indexDraft.get().trim()==="",textContent:()=>this.svc.saving.get()?"Saving…":"Save"},form:{onsubmit:async h=>{h.preventDefault(),this.localErr.set("");const f=_e(this.indexDraft.get());if(f===null||f<-10||f>54){this.localErr.set("Enter an index between +10 and 54 (use “+” for a plus handicap).");return}await this.svc.saveIndex(f)&&this.indexDraft.set("")}},saveErr:{textContent:()=>this.localErr.get()||this.saveErrFor("index")},teeRoleInfo:{"aria-expanded":()=>String(this.teeRoleInfoOpen.get()),onclick:()=>this.teeRoleInfoOpen.set(!this.teeRoleInfoOpen.get())},teeRoleHint:{textContent:()=>{const h=this.svc.player.get()?.preferredTeeRoleKey??null;return h===null?"Rounds start you on the course default tee.":`Rounds start you on the course’s ${this.svc.teeRoles.get().find(m=>m.roleKey===h)?.displayName??h} tee when it has one.`}},teeRoleExplain:{textContent:()=>"Pick the tee type you normally play. It pre-fills your own gender’s round tee only when the selected course has a matching tee. Otherwise the course default applies. The organiser can change the round defaults, and any player’s tee can still be overridden.",className:()=>this.teeRoleInfoOpen.get()?"pfield__hint profile__tee-explain":"pfield__hint profile__tee-explain hidden"},clubErr:{textContent:()=>this.saveErrFor("club")},genderErr:{textContent:()=>this.saveErrFor("gender")},teeRoleErr:{textContent:()=>this.saveErrFor("tee")},toStats:{className:()=>this.svc.hasRecordedStats.get()?"statlink":"statlink hidden",onclick:()=>this.router.navigate("/stats")},statlinkRule:{className:()=>this.svc.hasRecordedStats.get()?"statrow__rule":"statrow__rule hidden"},masterTitle:()=>Jo,masterHint:()=>Zo,master:{checked:()=>this.svc.statsConfig.get().enabled,disabled:()=>this.statsBusy(),onchange:h=>{this.saveStats(h,(f,m)=>nl(f,m),f=>f.enabled)}},statsErr:{textContent:()=>this.svc.statsError.get()?.message||""},historyEmpty:{className:()=>this.svc.history.get().length===0?"profile__empty":"profile__empty hidden"}});this.$each(this.ref(i,"history"),this.svc.history,(h,f,m)=>this.wireEl(eg,{index:()=>h.handicapIndex.toFixed(1),source:()=>h.source,date:()=>h.effectiveDate},m),h=>h.id),this.$each(this.ref(i,"statModules"),()=>[...nr],(h,f,m)=>{const _=()=>this.svc.statsConfig.get(),g=()=>el(_(),h);return this.wireEl(tg,{row:{className:()=>g()?"statrow statrow--locked":"statrow"},title:()=>ir(h),ann:()=>tl(_(),h)??"",hint:()=>Qo(h),chk:{checked:()=>Mt(_(),h),disabled:()=>g()||this.statsBusy(),onchange:v=>{this.saveStats(v,(k,N)=>sl(k,h,N),k=>Mt(k,h))}}},m)},h=>h);const r=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(i,"gender"),()=>r,(h,f,m)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>h.label,className:()=>this.svc.player.get()?.gender===h.value?"on":"",disabled:()=>this.svc.saving.get(),onclick:()=>{this.svc.saveGender(h.value)}}},m),h=>h.label);const o=new p(this.svc.player.get()?.preferredTeeRoleKey??"");this.track(C(()=>o.set(this.svc.player.get()?.preferredTeeRoleKey??""))),this.track(C(()=>{const h=o.get();queueMicrotask(()=>{h!==(this.svc.player.get()?.preferredTeeRoleKey??"")&&this.svc.savePreferredTeeRole(h===""?null:h)})}));const d=new pe({value:o,options:{get:()=>[{value:"",label:"No preference"},...this.svc.teeRoles.get().map(h=>({value:h.roleKey,label:h.displayName}))]},placeholder:"No preference",disabled:{get:()=>this.svc.saving.get()}});d.mount(this.ref(i,"teeRole")),this.track(()=>d.destroy());const c=new p(this.svc.player.get()?.homeClubId??"");this.track(C(()=>c.set(this.svc.player.get()?.homeClubId??""))),this.track(C(()=>{const h=c.get();queueMicrotask(()=>{h!==(this.svc.player.get()?.homeClubId??"")&&this.svc.saveHomeClub(h===""?null:h)})}));const u=new pe({value:c,options:{get:()=>[{value:"",label:"No home club"},...this.svc.clubs.get().map(h=>({value:h.id,label:h.name}))]},placeholder:"No home club",disabled:{get:()=>this.svc.saving.get()}});return u.mount(this.ref(i,"club")),this.track(()=>u.destroy()),t=this.ref(i,"photoFile"),n=this.ref(i,"nameInput"),i}saveErrFor(e){return this.svc.saveTarget.get()!==e?"":this.svc.saveError.get()?.message||""}statsBusy(){return this.svc.statsSaving.get()||this.svc.saving.get()}async saveStats(e,t,n){const i=e.target;await this.svc.saveStatsConfig(t(this.svc.statsConfig.get(),i.checked)),i.checked=n(this.svc.statsConfig.get())}}function X(s,e){return s>0?`Measured over ${ae(s,e)}.`:null}function xe(s){return s===null?null:`Measured ${s}.`}function ng(s){const e=Tu(s);return e===null?null:`Your penalty doubles: ${e}.`}function D(...s){return s.filter(e=>e!==null&&e!=="").join(" ")}function j(s,e,t){return{id:s,title:e,body:t}}function ig(s){return s.penaltiesRecordedHoles<=0?null:is([{d:s.penaltiesPerRound.d,unit:$e},{d:s.penaltiesRecordedHoles,unit:Z}])}function rg(s,e,t){switch(s){case"tee":{const n=e.tee;return n?[j("teeFan","Where your tee shots finish",D($.teeFan,X(n.teeRecorded,Z))),j("vsParByTee","Average vs par, by where the tee shot finished",D($.vsParByTee,xe(vu(n.vsParByTee)))),j("troubleTax","Trouble tax",D($.troubleTax,xe(du(n.vsParByTee)))),j("recovery","Recovery",D($.recovery,X(n.recovery.d,Z))),j("penalties","Penalties",D($.penalties,xe(ig(n)))),j("penaltyTax","Penalty tax",D($.penaltyTax,xe(fu(n.vsParByPenalty))))]:[]}case"approach":{const n=e.approach;return n?[j("greenMiss","Where you miss the green",D($.greenMiss,X(n.greenMissRecorded,Z))),j("proximity","Proximity with GIR",D($.proximityProxy,X(n.girFirstPuttMix.inside_1m.d,ks))),j("birdieConversion","Birdie conversion",D($.birdieConversion,X(n.birdieConversion.d,ks))),j("hardChipShare","Hard misses",D($.hardChipShare,X(n.hardChipShare.d,Z))),j("costOfMissedGreen","Cost of a missed green",D($.costOfMissedGreen,xe(wu(n.costOfMissedGreen)))),j("missedGreenTax","Missed-green tax",D($.missedGreenTax,xe(pu(n.costOfMissedGreen))))]:[]}case"putting":{const n=e.putting;return n?[j("firstPuttSpread","First putt, all holes",D($.firstPuttSpread,X(n.firstPuttSpread.inside_1m.d,Z))),j("ladder","Holed on the first putt",D($.ladderBaseline,$.ladderCost,`Measured against the ${ct(t.cohort)} reference — change it under “${$.filterBaseline}” in Filters.`)),j("threePutt","Three or more putts",D($.threePutt,$.longThreePutt,X(n.threePutt.d,Z))),j("puttsPerGir","Putts per green hit",D($.puttsPerGir,X(n.puttsPerGirHole.d,ks))),j("puttsAfterMissedGreen","Putts after a missed green",D($.puttsAfterMissedGreen,X(n.puttsAfterMissedGreen.d,Z))),j("puttsByPar","Putts per hole, by par",D($.puttsByPar,xe(Xn(n.puttsPerHoleByPar))))]:[]}case"shortGame":{const n=e.shortGame;if(!n)return[];const i=n.scramble.standard.d+n.scramble.hard.d+n.scramble.bunker.d;return[j("missMix",$.missMixHead,D($.missMix,X(i,Z))),j("scrambling","Scrambling",D($.scrambling,X(i,Z))),j("sandSave","Sand save",D($.sandSave,X(n.sandSave.d,Z))),j("extraShortGameStrokes","Extra short-game shots",D($.extraShortGameStrokes,X(n.shortGameStrokesRecorded,Z))),j("chipOutcomes","After the chip",D($.chipOutcomes,$.multiChip,X(i,Z))),j("missCost","Average vs par, by how hard the miss was",D($.missCost,X(n.missCost.standard.d+n.missCost.hard.d+n.missCost.bunker.d,Z))),j("chipInside2m","Chipped to inside 2 m",D($.conversionInside2m,X(n.conversionInside2m.d,Z))),j("savedInside2m","Saved when inside 2 m",D($.savedInside2m,X(n.savedInside2m.overall.d,Z))),j("chipIns","Chip-ins",$.chipIns)]}case"scoring":{const n=e.scoring;return n?[j("vsPar","Average vs par",D($.avgVsParByPar,xe(Xn(n.avgVsParByParGroup)))),j("doubles","Doubles or worse",D($.doubleBogeyPlus,X(n.doubleBogeyPlusPerRound.d,$e))),...n.doubleBogeyPlusHoles>0?[j("doubleCauses",$.doubleCausesHead,D($.doubleCauses,$.doubleCausesOrder,X(n.doubleBogeyPlusHoles,Z),$.doubleCausesLongGame,$.doubleCausesUnattributed,$.doubleCausesPenalty,ng(n.penaltyDoubleSources)))]:[],j("bounceBack","Bounce-back",D($.bounceBack,X(n.bounceBack.d,Z)))]:[]}case null:return[]}}const ag=b(`
    <section bind="panel" class="panel">
        <div class="panel__headrow">
            <button bind="head" class="panel__head" type="button" aria-expanded="false">
                <span class="panel__text">
                    <span bind="title" class="panel__title"></span>
                    <span bind="headline" class="panel__headline"></span>
                </span>
                <span bind="chev" class="panel__chev" aria-hidden="true"></span>
            </button>
            <span bind="infoRow" class="panel__inforow">
                ${ls}
            </span>
        </div>
        <div bind="body" class="panel__body">
            <div bind="blocks" class="panel__blocks"></div>
        </div>
    </section>
`),og=b('<h3 bind="text" class="block__subhead"></h3>'),lg=b(`
    <div class="block block--columns" aria-hidden="true">
        <span class="block__title"></span>
        <span class="block__bar"></span>
        <span bind="c0" class="block__colhead"></span>
        <span bind="c1" class="block__colhead"></span>
    </div>
`),dg=b(`
    <div class="block block--split">
        <span bind="bar" class="block__splitbar"></span>
        <span bind="legend" class="block__legend"></span>
    </div>
`),cg=b(`
    <div class="block block--bar">
        <span bind="title" class="block__title"></span>
        <span bind="bar" class="block__bar"></span>
        <span bind="value" class="block__value"></span>
    </div>
`),ug=b(`
    <div class="block block--bar block--bar-sub">
        <span bind="title" class="block__title"></span>
        <span bind="bar" class="block__bar"></span>
        <span bind="value" class="block__value"></span>
    </div>
`),hg=b(`
    <div bind="row" class="block block--bar" role="img">
        <span bind="title" class="block__title"></span>
        <span bind="bar" class="block__bar"></span>
        <span bind="value" class="block__value"></span>
        <span bind="cost" class="block__cost"></span>
    </div>
`),pg=b(`
    <div class="block block--figure">
        <div class="block__text">
            <span bind="title" class="block__title"></span>
            <span bind="hint" class="block__hint"></span>
        </div>
        <span bind="value" class="block__value"></span>
    </div>
`),fg=b(`
    <div class="block block--compass">
        <span bind="chart" class="block__compass"></span>
        <span bind="text" class="block__chart-text"></span>
    </div>
`),mg=b(`
    <div class="block block--fan">
        <span bind="chart" class="block__fan"></span>
        <span bind="text" class="block__chart-text"></span>
    </div>
`),gg=b(`
    <div class="statspanels">
        <div bind="panels" class="statspanels__list"></div>
${bt}
    </div>
`);class ya extends M{static styles=`
${ds}
        .statspanels {
            & .statspanels__list { display: flex; flex-direction: column; gap: ${a("sm")}; }

            & .panel {
                ${R()}
                overflow: hidden;
                &.hidden { display: none; }

                & .panel__headrow { display: flex; align-items: center; }
                & .panel__head {
                    ${S()}
                    flex: 1; min-width: 0;
                    display: flex; align-items: center; gap: ${a("md")};
                    width: 100%;
                    padding: ${a("md")} ${a("lg")};
                    font-family: inherit; text-align: left;
                    background: transparent; border: none; border-radius: 0;
                }
                & .panel__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .panel__title { font-weight: 600; font-size: 1rem; }
                & .panel__headline {
                    color: ${l("text-muted")}; font-size: 0.82rem;
                    &:empty { display: none; }
                }
                & .panel__chev {
                    flex-shrink: 0; width: 0; height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-top: 6px solid ${l("text-muted")};
                    transition: transform 0.15s ease;
                }
                & .panel__head[aria-expanded='false'] .panel__chev { transform: rotate(-90deg); }

                & .panel__body {
                    display: flex; flex-direction: column; gap: ${a("sm")};
                    padding: 0 ${a("lg")} ${a("lg")};
                    &.hidden { display: none; }
                }
                & .panel__blocks { display: flex; flex-direction: column; gap: ${a("sm")}; }
                & .panel__inforow {
                    flex: none; display: flex; align-items: center;
                    padding-right: ${a("lg")};
                    &.hidden { display: none; }
                }
            }

            & .block__subhead {
                margin: ${a("sm")} 0 0;
                font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${l("text-muted")};
            }
            & .block { display: flex; align-items: center; gap: ${a("sm")}; }
            & .block--split { flex-direction: column; align-items: stretch; gap: ${a("xs")}; }
            & .block__splitbar { display: block; & svg { width: 100%; display: block; } }
            & .block__legend {
                display: flex; flex-wrap: wrap; gap: ${a("md")};
                font-size: 0.8rem;
                & .legend__key {
                    display: inline-flex; align-items: center; gap: 6px;
                }
                & .legend__swatch {
                    width: 10px; height: 10px; flex-shrink: 0;
                    border-radius: 2px;
                }
                & .legend__value {
                    color: ${l("text-muted")};
                    font-variant-numeric: tabular-nums;
                }
            }
            /* ONE geometry for every rate row on every card (owner ruling,
               2026-08-02). The track and the value column are pinned constants
               shared with the dashboard's score-type rows, so the bars line up
               down the whole screen instead of drifting a card at a time. */
            /* Two lines, then clamp — NOT one line with an ellipsis. At 375 px
               the flex column is around 110 px wide and the longest row titles
               ("Three-putts from over 8 m", "More than one from sand") are
               simply longer than that. Truncating them mid-word loses the fact
               the row is about; wrapping costs a few pixels of height and
               matches how the iOS twin lays the same titles out. */
            & .block__title {
                flex: 1; min-width: 0; font-size: 0.9rem;
                overflow: hidden;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                overflow-wrap: anywhere;
            }
            & .block__bar {
                width: ${ra}px; flex: none;
                & svg { width: 100%; display: block; }
            }
            & .block__value {
                width: ${Ws}px; flex: none; text-align: right;
                font-size: 0.9rem; font-weight: 700;
                font-variant-numeric: tabular-nums;
                &.block__value--absent { font-weight: 400; color: ${l("text-muted")}; }
            }
            /* A mechanism row under its phase group: the title steps in and
               quietens, the value drops its weight so the group totals stay
               the headline — the bar and value columns do NOT move, keeping
               the one shared geometry. */
            & .block--bar-sub {
                & .block__title { padding-left: ${a("md")}; font-size: 0.85rem; color: ${l("text-muted")}; }
                & .block__value { font-weight: 400; }
            }
            /* Quieter than the value beside it, deliberately: Holed is the
               row's headline reading and Cost is the gloss on it. Same size
               as the other secondary numbers on the screen. */
            & .block__cost {
                width: ${hi}px; flex: none; text-align: right;
                font-size: 0.78rem; font-variant-numeric: tabular-nums;
                color: ${l("text-muted")};
            }
            & .block--columns {
                & .block__colhead {
                    flex: none; text-align: right;
                    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em;
                    text-transform: uppercase; color: ${l("text-muted")};
                }
                & .block__colhead:nth-child(3) { width: ${Ws}px; }
                & .block__colhead:nth-child(4) { width: ${hi}px; }
            }
            & .block--compass, & .block--fan {
                flex-direction: column; align-items: stretch; gap: ${a("xs")};
            }
            & .block__compass {
                display: block; align-self: center;
                & svg { display: block; }
            }
            & .block__fan { display: block; & svg { width: 100%; display: block; } }
            & .block__chart-text {
                font-size: 0.8rem; color: ${l("text-muted")};
                font-variant-numeric: tabular-nums;
            }
            & .block--figure {
                align-items: flex-start;
                /* A figure has no bar, so its value is free to be as wide as the
                   number needs — the pinned column is for rows that carry a
                   track beside it. */
                & .block__value { width: auto; flex: 0 1 auto; }
                & .block__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .block__hint {
                    font-size: 0.76rem; color: ${l("text-muted")};
                    &:empty { display: none; }
                }
            }
        }
    `;expanded=new p([]);openInfo=new p(null);colors=hs;render(){const e=()=>this.props.model(),t=this.wire(gg,{infoSheet:{className:()=>this.openInfo.get()!==null?"stats-info":"stats-info hidden",onclick:n=>{n.target===n.currentTarget&&this.openInfo.set(null)}},infoTitle:()=>{const n=this.openInfo.get();return n===null?"":ws(n)},infoDone:{onclick:()=>this.openInfo.set(null)}});return this.$each(this.ref(t,"panels"),()=>[...Kc],(n,i,r)=>{const o=()=>this.expanded.get().includes(n),d=this.wireEl(ag,{panel:{className:()=>e()[n]?"panel":"panel hidden"},head:{"aria-expanded":()=>String(o()),onclick:()=>this.togglePanel(n)},title:()=>ws(n),headline:()=>gf(n,e())??"",body:{className:()=>o()?"panel__body":"panel__body hidden"},infoRow:{className:()=>o()&&this.infoCards(n).length>0?"panel__inforow":"panel__inforow hidden"},infoTrigger:{textContent:()=>$.prioritiesInfo,"aria-label":()=>`${$.prioritiesInfo}: ${ws(n)}`,onclick:()=>this.openInfo.set(n)}},r);return this.$each(this.ref(d,"blocks"),()=>yi(n,e()),(c,u,h)=>this.renderBlock(n,c,h),c=>c.id),d},n=>n),this.$each(this.ref(t,"infoCards"),()=>this.infoCards(this.openInfo.get()),(n,i,r)=>this.wireEl(yt,{ctitle:()=>(this.infoCardNow(n.id)??n).title,ctext:()=>(this.infoCardNow(n.id)??n).body},r),n=>n.id),t}infoCards(e){return rg(e,this.props.model(),this.props.baseline())}infoCardNow(e){return this.infoCards(this.openInfo.get()).find(t=>t.id===e)}renderBlock(e,t,n){switch(t.kind){case"subhead":return this.wireEl(og,{text:()=>t.text},n);case"columns":return this.wireEl(lg,{c0:()=>t.cells[0]??"",c1:()=>t.cells[1]??""},n);case"split":{const i=()=>this.blockNow(e,t.id)??t;return this.wireEl(dg,{bar:{innerHTML:()=>{const r=i();return r.kind!=="split"?"":Dp(r.segments.map(o=>({id:o.id,share:o.share??0,color:this.segmentColor(o.tone)})),this.colors)}},legend:{innerHTML:()=>{const r=i();return r.kind!=="split"?"":r.segments.map(o=>`<span class="legend__key"><span class="legend__swatch" style="background:${this.segmentColor(o.tone)}"></span><span>${o.title}</span><span class="legend__value">${o.value??$.noValue}</span></span>`).join("")}}},n)}case"bar":return this.wireEl(t.sub?ug:cg,{title:()=>t.title,bar:{innerHTML:()=>{const i=this.blockNow(e,t.id)??t;return i.kind!=="bar"||i.share===null?"":la(i.share,this.colors)}},value:this.valueBinding(e,t.id,()=>t.value,$.noValue)},n);case"rung":{const i=()=>{const r=this.blockNow(e,t.id);return r&&r.kind==="rung"?r:t};return this.wireEl(hg,{row:{"aria-label":()=>{const r=i();return mf({title:r.title,value:r.value,cost:r.cost})}},title:()=>t.title,bar:{innerHTML:()=>{const r=i();return Zp(r.made,r.baseline,this.colors)}},value:this.valueBinding(e,t.id,()=>t.value,$.noValue),cost:()=>i().cost},n)}case"figure":return this.wireEl(pg,{title:()=>t.title,hint:()=>{const i=this.blockNow(e,t.id)??t;return(i.kind==="figure"?i.hint:t.hint)??""},value:this.valueBinding(e,t.id,()=>t.value)},n);case"compass":return this.wireEl(fg,{chart:{innerHTML:()=>{const i=this.blockNow(e,t.id)??t;return i.kind!=="compass"?"":of(i.sectors,i.labels,this.colors)}},text:()=>{const i=this.blockNow(e,t.id)??t;return i.kind==="compass"?i.text:t.text}},n);case"fan":return this.wireEl(mg,{chart:{innerHTML:()=>{const i=this.blockNow(e,t.id)??t;return i.kind!=="fan"?"":hf(i.columns,this.toneColors(),this.colors)}},text:()=>{const i=this.blockNow(e,t.id)??t;return i.kind==="fan"?i.text:t.text}},n)}}toneColors(){return{fairway:this.segmentColor("fairway"),inplay:this.segmentColor("inplay"),trouble:this.segmentColor("trouble")}}valueBinding(e,t,n,i=$.notRecorded){const r=()=>{const o=this.blockNow(e,t);return o&&"value"in o?o.value:n()};return{textContent:()=>r()??i,className:()=>r()===null?"block__value block__value--absent":"block__value"}}segmentColor(e){switch(e){case"fairway":return this.colors.gain;case"inplay":return this.colors.neutral;case"trouble":return this.colors.loss}}togglePanel(e){const t=this.expanded.get();this.expanded.set(t.includes(e)?t.filter(n=>n!==e):[...t,e])}blockNow(e,t){return yi(e,this.props.model()).find(n=>n.id===t)}}const bg=b(`
    <div class="stats">
        <div bind="anon" class="stats__anon">
            <p>Your statistics live behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>

        <div bind="body" class="stats__body">
            <header class="stats__head">
                <h1>Your statistics</h1>
                <p bind="intro"></p>
            </header>

            <section class="stats__window">
                <div bind="picker" class="stats__picker"></div>
                <div class="stats__windowbar">
                    <span bind="sample" class="stats__sample"></span>
                    <button bind="filterToggle" class="stats__filterbtn" type="button"
                        aria-expanded="false">Filter</button>
                </div>
                <p bind="status" class="stats__status"></p>
                <p bind="err" class="stats__err"></p>
            </section>

            <section bind="filterPanel" class="stats__filter">
                <div class="stats__filterrow">
                    <span class="stats__filterlabel">Dates</span>
                    <div class="stats__dates">
                        <label class="stats__date">
                            <span>From</span>
                            <input bind="from" type="date" />
                        </label>
                        <label class="stats__date">
                            <span>To</span>
                            <input bind="to" type="date" />
                        </label>
                    </div>
                </div>
                <div class="stats__filterrow">
                    <span class="stats__filterlabel">Venue</span>
                    <div bind="venues" class="stats__chips"></div>
                </div>
                <div class="stats__filterrow">
                    <span class="stats__filterlabel">Round type</span>
                    <div bind="roundTypes" class="stats__chips"></div>
                </div>
                <div class="stats__filterrow">
                    <span class="stats__filterlabel">Courses</span>
                    <div bind="courses" class="stats__courses"></div>
                </div>
                <button bind="clearFilter" class="stats__clear" type="button"></button>

                <div class="stats__filterrow stats__filterrow--baseline">
                    <span class="stats__filterlabel" bind="sgLabel"></span>
                    <p bind="sgWhat" class="stats__filterhint"></p>
                    <div bind="sgPicker" class="stats__picker"></div>
                    <p bind="sgHint" class="stats__filterhint"></p>
                </div>
            </section>

            <div bind="empty" class="stats__empty"></div>

            <section bind="resultsSec" class="stats__section">
                <h2></h2>
                <p bind="resultsSub" class="stats__hint"></p>
                <div bind="resultsCard" class="results">
                    <div bind="resultTiles" class="results__tiles"></div>
                    <p bind="histHead" class="results__subhead"></p>
                    <div bind="resultHist" class="results__hist"></div>
                </div>
            </section>

            <section bind="prioritiesSec" class="stats__section">
                <div class="stats__sechead">
                    <h2></h2>
                    ${ls}
                </div>
                <p bind="prioritiesHint" class="stats__hint"></p>
                <div bind="priorities" class="priorities"></div>
            </section>

            <section bind="trendsSec" class="stats__section">
                <h2></h2>
                <p bind="trendsHint" class="stats__hint"></p>
                <div bind="trends" class="stats__trends"></div>
            </section>

            <div bind="panels" class="stats__panels"></div>

            <section bind="roundsSec" class="stats__section">
                <h2></h2>
                <p bind="roundsHint" class="stats__hint"></p>
                <p bind="pickHint" class="stats__hint"></p>
                <div bind="rounds" class="stats__rounds"></div>
            </section>
        </div>
${bt}
    </div>
`),zi=b(`
    <button bind="chip" class="stats__chip" type="button" aria-pressed="false"></button>
`),yg=b(`
    <label class="stats__course">
        <input bind="chk" type="checkbox" />
        <span bind="name" class="stats__coursename"></span>
        <span bind="count" class="stats__coursecount"></span>
    </label>
`),_g=b(`
    <div bind="tile" class="rtile">
        <span bind="value" class="rtile__value"></span>
        <span bind="label" class="rtile__label"></span>
        <span bind="qualifier" class="rtile__qualifier"></span>
    </div>
`),vg=b(`
    <div class="stype">
        <span bind="title" class="stype__title"></span>
        <span bind="bar" class="stype__bar"></span>
        <span bind="value" class="stype__value"></span>
    </div>
`),wg=b(`
    <div class="priority">
        <span bind="title" class="priority__title"></span>
        <span bind="chart" class="priority__chart"></span>
        <div class="priority__figures">
            <span bind="value" class="priority__value"></span>
            <span bind="sample" class="priority__sample"></span>
        </div>
    </div>
`),xg=b(`
    <div class="trend">
        <span bind="title" class="trend__title"></span>
        <span bind="spark" class="trend__spark"></span>
        <span bind="headline" class="trend__headline"></span>
        <span bind="sample" class="trend__sample"></span>
    </div>
`),kg=b(`
    <div class="statsround">
        <label bind="pickWrap" class="statsround__pick">
            <input bind="pick" type="checkbox" />
        </label>
        <button bind="open" class="statsround__open" type="button">
            <span class="statsround__who">
                <span bind="label" class="statsround__label"></span>
                <span bind="subtitle" class="statsround__subtitle"></span>
            </span>
            <span bind="strip" class="statsround__strip"></span>
            <span bind="vspar" class="statsround__vspar"></span>
        </button>
    </div>
`);class $g extends M{static styles=`
        .stats {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .stats__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};
                &.hidden { display: none; }

                & button {
                    ${S()}
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                }
            }

            & .stats__body.hidden { display: none; }

            & .stats__head {
                margin-bottom: ${a("lg")};
                & h1 {
                    margin: 0;
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem; }
            }

            & .stats__window { margin-bottom: ${a("lg")}; }
            & .stats__picker { & .ui-select { display: block; width: 100%; } }

            & .stats__windowbar {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${a("md")}; margin-top: ${a("sm")};
            }
            & .stats__sample {
                color: ${l("text-muted")}; font-size: 0.85rem;
                font-variant-numeric: tabular-nums;
            }
            & .stats__filterbtn {
                ${S()}
                flex-shrink: 0;
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
                &[aria-expanded='true'] {
                    background: ${l("primary")}; color: ${l("primary-text")};
                    border-color: ${l("primary")};
                }
            }

            & .stats__status {
                margin: ${a("sm")} 0 0; font-size: 0.82rem; color: ${l("text-muted")};
                &:empty { display: none; }
            }
            & .stats__err {
                margin: ${a("sm")} 0 0; font-size: 0.85rem; color: ${l("error")};
                &:empty { display: none; }
            }

            /* The custom window's criteria. Hidden by default: it is a
               refinement of the picker above it, not a second picker. */
            & .stats__filter {
                ${R()}
                display: flex; flex-direction: column; gap: ${a("md")};
                padding: ${a("lg")};
                margin-bottom: ${a("lg")};
                &.hidden { display: none; }
            }
            & .stats__filterrow { display: flex; flex-direction: column; gap: ${a("xs")}; }
            & .stats__filterlabel {
                font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${l("text-muted")};
            }
            /* The baseline sits BELOW the Clear button, behind a hairline: it is
               not filter criteria, and clearing the filter must not look like it
               resets the cohort too. */
            & .stats__filterrow--baseline {
                border-top: 1px solid ${l("border")};
                padding-top: ${a("md")};
            }
            & .stats__filterhint {
                margin: 0;
                font-size: 0.78rem; line-height: 1.35; color: ${l("text-muted")};
            }
            & .stats__dates { display: flex; gap: ${a("md")}; }
            & .stats__date {
                flex: 1; display: flex; flex-direction: column; gap: 2px;
                font-size: 0.8rem; color: ${l("text-muted")};
                & input {
                    ${re()}
                    width: 100%;
                    font-family: inherit; font-size: 0.9rem;
                }
            }
            & .stats__chips { display: flex; flex-wrap: wrap; gap: ${a("xs")}; }
            & .stats__chip {
                ${S()}
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
                border-radius: ${l("radius-pill")};
                &[aria-pressed='true'] {
                    background: ${l("primary")}; color: ${l("primary-text")};
                    border-color: ${l("primary")};
                }
            }
            & .stats__courses {
                display: flex; flex-direction: column; gap: ${a("xs")};
                max-height: 220px; overflow-y: auto;
            }
            & .stats__course {
                display: flex; align-items: baseline; gap: ${a("sm")};
                font-size: 0.9rem; cursor: pointer;
                & .stats__coursename { flex: 1; }
                & .stats__coursecount {
                    color: ${l("text-muted")}; font-size: 0.8rem;
                    font-variant-numeric: tabular-nums;
                }
            }
            & .stats__clear {
                ${S()}
                align-self: flex-start;
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .stats__empty {
                color: ${l("text-muted")}; font-size: 0.9rem; padding: ${a("lg")} 0;
                &:empty { display: none; }
            }

            & .stats__section {
                margin-bottom: ${a("xl")};
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${a("xs")};
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
                /* Outranks the same reset in SG_INFO_STYLES, which this nested
                   rule would otherwise beat and leave the flex row unbalanced. */
                & .stats__sechead h2 { margin-bottom: 0; }
            }
            & .stats__hint {
                margin: 0 0 ${a("md")}; font-size: 0.82rem; color: ${l("text-muted")};
                &:empty { display: none; }
            }

            /* ONE card for the whole section: these figures are one answer to
               one question, and a card each would make the reader choose which
               of four equal boxes to read first. */
            & .results {
                ${R()}
                display: flex; flex-direction: column; gap: ${a("md")};
                padding: ${a("lg")};
                &.hidden { display: none; }
            }
            & .results__tiles {
                display: grid; grid-template-columns: repeat(2, 1fr); gap: ${a("md")};
            }
            & .rtile {
                display: flex; flex-direction: column; gap: 2px; min-width: 0;
                & .rtile__value {
                    font-weight: 700; font-size: 1.3rem;
                    font-variant-numeric: tabular-nums;
                }
                /* Both stacked lines are short by construction — a two-word
                   label and a strokes annotation — so they stay on one line
                   each. Letting them wrap gave the half-width tiles ragged
                   two-line breaks that read as a layout fault. */
                & .rtile__label {
                    font-size: 0.82rem; color: ${l("text-muted")}; white-space: nowrap;
                }
                & .rtile__qualifier {
                    font-size: 0.72rem; color: ${l("text-muted")}; white-space: nowrap;
                    &:empty { display: none; }
                }
            }
            /* The hero owns the row: the number IS the answer, and two equal
               tiles beside it would make the reader choose which to read. */
            & .rtile--hero {
                grid-column: 1 / -1;
                & .rtile__value { font-size: 2.1rem; line-height: 1.1; }
                /* Full width, and its qualifier is the only long one on the
                   card ("over 51 holes, scaled to 18") — it may wrap. */
                & .rtile__qualifier { white-space: normal; }
            }
            & .results__subhead {
                margin: 0; font-size: 0.72rem; font-weight: 700;
                letter-spacing: 0.06em; text-transform: uppercase;
                color: ${l("text-muted")};
                &:empty { display: none; }
            }
            & .results__hist { display: flex; flex-direction: column; gap: ${a("xs")}; }
            & .stype {
                /* Gap sm, matching the module-card rate row: with the track and
                   the value column both pinned, the gap no longer has to carry
                   the separation, and md here made these rows sit visibly
                   looser than the identical rows one card down. */
                display: flex; align-items: center; gap: ${a("sm")};
                & .stype__title { flex: 1; min-width: 0; font-size: 0.85rem; }
                /* The SAME track and value column as every module-card rate row
                   — these two used to be 84 and 56 by hand, and the 4px drift
                   was visible wherever the two sections met. */
                & .stype__bar {
                    width: ${ra}px; flex: none;
                    & svg { width: 100%; display: block; }
                }
                & .stype__value {
                    width: ${Ws}px; flex: none; text-align: right;
                    font-size: 0.85rem; font-variant-numeric: tabular-nums;
                }
            }

            /* ONE card, exactly like Results above: the five terms are one
               answer to one question ("what is costing me shots?"), and five
               separate cards made the reader pick which of five equal boxes to
               read first — when the ORDER already answered that. */
            & .priorities {
                ${R()}
                display: flex; flex-direction: column; gap: ${a("md")};
                padding: ${a("lg")};
            }

            & .priority {
                display: flex; align-items: center; gap: ${a("md")};

                & .priority__title { flex: 1; min-width: 0; font-weight: 600; font-size: 0.98rem; }
                & .priority__chart { width: 84px; flex-shrink: 0; & svg { width: 100%; display: block; } }
                & .priority__figures {
                    width: 92px; flex-shrink: 0;
                    display: flex; flex-direction: column; align-items: flex-end;
                }
                & .priority__value {
                    font-weight: 700; font-size: 0.95rem;
                    font-variant-numeric: tabular-nums;
                }
                & .priority__sample {
                    color: ${l("text-muted")}; font-size: 0.72rem; text-align: right;
                }
            }

            /* Tiles rather than rows: a sparkline needs width more than the
               label does, and four of them fit two-up on a phone. */
            & .stats__trends {
                display: grid; grid-template-columns: repeat(2, 1fr); gap: ${a("sm")};
            }
            & .trend {
                ${R()}
                display: flex; flex-direction: column; gap: 2px;
                padding: ${a("md")};
                & .trend__title { font-size: 0.82rem; color: ${l("text-muted")}; }
                & .trend__spark { display: block; & svg { width: 100%; display: block; } }
                & .trend__headline {
                    font-weight: 700; font-size: 1.05rem;
                    font-variant-numeric: tabular-nums;
                }
                & .trend__sample { font-size: 0.72rem; color: ${l("text-muted")}; }
            }

            /* The five module cards live in StatsPanelsComponent — the per-round
               screen embeds the same component, so their CSS travels with it. */
            & .stats__panels { margin-bottom: ${a("xl")}; }

            & .stats__rounds { display: flex; flex-direction: column; gap: ${a("xs")}; }
            & .statsround {
                ${R()}
                display: flex; align-items: center; gap: ${a("md")};
                padding: ${a("sm")} ${a("lg")};

                & .statsround__pick {
                    flex-shrink: 0;
                    &.hidden { display: none; }
                }
                & .statsround__open {
                    ${S()}
                    flex: 1; min-width: 0;
                    display: flex; align-items: center; gap: ${a("md")};
                    padding: 0;
                    font-family: inherit; text-align: left;
                    background: transparent; border: none; border-radius: 0;
                }
                & .statsround__who { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .statsround__label {
                    font-weight: 600; font-size: 0.95rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .statsround__subtitle {
                    color: ${l("text-muted")}; font-size: 0.76rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .statsround__strip { width: 76px; flex-shrink: 0; & svg { width: 100%; display: block; } }
                & .statsround__vspar {
                    width: 44px; flex-shrink: 0; text-align: right;
                    font-weight: 700; font-size: 0.9rem;
                    font-variant-numeric: tabular-nums;
                }
            }
        }

${ds}
    `;svc=this.inject(Be);auth=this.inject(V);router=this.inject(q);filterOpen=new p(!1);prioritiesInfoOpen=new p(!1);colors=hs;render(){const e=()=>this.auth.currentUser.get()!==null;e()&&(this.svc.load(),this.svc.loadHandicap());const t=()=>this.svc.model.get(),n=()=>this.svc.preset.get()==="custom",i=this.wire(bg,{anon:{className:()=>e()?"stats__anon hidden":"stats__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/stats"}})},body:{className:()=>e()?"stats__body":"stats__body hidden"},intro:()=>$.intro,sample:()=>this.sampleMarker(),filterToggle:{"aria-expanded":()=>String(this.filterOpen.get()),onclick:()=>this.filterOpen.set(!this.filterOpen.get())},status:()=>this.statusLine(),err:()=>this.svc.error.get()?.message??"",filterPanel:{className:()=>this.filterOpen.get()?"stats__filter":"stats__filter hidden"},from:{value:()=>this.svc.filter.get().from??"",oninput:r=>this.setBound("from",r.target.value)},to:{value:()=>this.svc.filter.get().to??"",oninput:r=>this.setBound("to",r.target.value)},clearFilter:{textContent:()=>$.filterClear,onclick:()=>this.svc.clearFilter()},sgLabel:()=>$.filterBaseline,sgWhat:()=>$.filterBaselineHint,sgHint:()=>Gc(this.svc.sgChoice.get(),this.svc.handicapIndex.get()),empty:()=>this.emptyLine(),resultsSec:{className:()=>t().results!==null?"stats__section":"stats__section hidden"},resultsSub:()=>$f(t().results),resultsCard:{className:()=>Es(t().results).length===0&&Ct(t().results).length===0?"results hidden":"results"},histHead:()=>Ct(t().results).length===0?"":$.scoreTypesHead,prioritiesSec:{className:()=>t().priorities.length>0?"stats__section":"stats__section hidden"},prioritiesHint:()=>$.prioritiesHint,infoTrigger:{textContent:()=>$.prioritiesInfo,onclick:()=>this.prioritiesInfoOpen.set(!0)},infoSheet:{className:()=>this.prioritiesInfoOpen.get()?"stats-info":"stats-info hidden",onclick:r=>{r.target===r.currentTarget&&this.prioritiesInfoOpen.set(!1)}},infoTitle:()=>ye.title,infoDone:{onclick:()=>this.prioritiesInfoOpen.set(!1)},trendsSec:{className:()=>t().trends.length>0?"stats__section":"stats__section hidden"},trendsHint:()=>$.trendsHint,roundsSec:{className:()=>t().rounds.length>0?"stats__section":"stats__section hidden"},roundsHint:()=>$.roundsHint,pickHint:()=>n()?$.filterRoundsHint:""});return this.setHeading(i,"resultsSec",$.resultsHeading),this.setHeading(i,"prioritiesSec",$.priorities),this.setHeading(i,"trendsSec",$.trends),this.setHeading(i,"roundsSec",$.roundsHeading),this.mountPicker(i),this.mountBaselinePicker(i),this.mountFilterLists(i),this.$each(this.ref(i,"resultTiles"),()=>Es(t().results),(r,o,d)=>this.wireEl(_g,{tile:{className:()=>(this.tileNow(r.id)??r).hero?"rtile rtile--hero":"rtile"},value:{textContent:()=>(this.tileNow(r.id)??r).value},label:{textContent:()=>(this.tileNow(r.id)??r).label},qualifier:{textContent:()=>(this.tileNow(r.id)??r).qualifier??""}},d),r=>r.id),this.$each(this.ref(i,"resultHist"),()=>Ct(t().results),(r,o,d)=>this.wireEl(vg,{title:()=>r.title,bar:{innerHTML:()=>la((this.histNow(r.id)??r).share,this.colors)},value:{textContent:()=>(this.histNow(r.id)??r).value}},d),r=>r.id),this.$each(this.ref(i,"priorities"),()=>t().priorities,(r,o,d)=>this.wireEl(wg,{title:()=>as(r.component),chart:{innerHTML:()=>{const c=this.priorityNow(r.component);return c?.per18===null||c===void 0?"":aa(c.per18,su(t().priorities),this.colors)}},value:{textContent:()=>{const c=this.priorityNow(r.component);return c&&c.per18!==null?we(c.per18):$.notEnoughData}},sample:{textContent:()=>{const c=this.priorityNow(r.component);return c&&c.per18===null?If(c.roundsInWindow):""}}},d),r=>r.component),this.$each(this.ref(i,"infoCards"),()=>Yt({attributed:t().waterfall.coverage.attributed,holesScored:t().waterfall.coverage.holesScored,windowRounds:t().rounds.length,rowsPer18:t().priorities.map(r=>r.per18),penaltySource:Wt(t().totals),baseline:this.svc.sgInfo.get()}),(r,o,d)=>this.wireEl(yt,{ctitle:()=>(this.sgCardNow(r.id)??r).title,ctext:()=>(this.sgCardNow(r.id)??r).body},d),r=>r.id),this.$each(this.ref(i,"trends"),()=>t().trends,(r,o,d)=>this.wireEl(xg,{title:()=>r.title,spark:{innerHTML:()=>{const c=this.trendNow(r.id)??r;return Wp(c.points,c.kind,this.colors)}},headline:{textContent:()=>{const c=this.trendNow(r.id)??r;return Sg(c)}},sample:{textContent:()=>{const c=this.trendNow(r.id)??r;return ae(c.points.length,$e)}}},d),r=>r.id),this.spawn(ya,this.ref(i,"panels"),{model:t,baseline:()=>this.svc.sgInfo.get()}),this.$each(this.ref(i,"rounds"),()=>t().rounds,(r,o,d)=>this.wireEl(kg,{open:{onclick:()=>this.router.navigate("/round-stats",{query:{id:r.id}}),"aria-label":()=>`${_i(r)} — hole by hole`},label:()=>_i(r),subtitle:()=>Tg(r),pickWrap:{className:()=>n()?"statsround__pick":"statsround__pick hidden"},pick:{checked:()=>!this.svc.filter.get().excludedRoundIds.includes(r.id),onchange:c=>this.svc.applyFilter(_d(this.svc.filter.get(),r.id,c.target.checked))},strip:{innerHTML:()=>{const c=this.roundNow(r.id)??r;return Qp(c.waterfall,Ar(t().rounds.map(u=>u.waterfall)),this.colors)}},vspar:{textContent:()=>{const c=this.roundNow(r.id)??r;return c.vsPar===null?"":rs(c.vsPar)}}},d),r=>r.id),i}mountPicker(e){const t=new p(this.svc.preset.get());this.track(C(()=>t.set(this.svc.preset.get()))),this.track(C(()=>{const r=t.get();queueMicrotask(()=>{r!==this.svc.preset.get()&&this.svc.select(r)})}));const n=r=>({value:r,label:`${zt(r)} — ${gd(r)}`}),i=new pe({value:t,options:[{value:"__recent",label:"Recent form",disabled:!0},n("last5"),n("last10"),n("last20"),{value:"__all",label:"Everything",disabled:!0},n("thisYear"),n("all"),{value:"__custom",label:"Built by hand",disabled:!0},n("custom")],placeholder:zt("last10")});i.mount(this.ref(e,"picker")),this.track(()=>i.destroy())}mountBaselinePicker(e){const t=new p(this.svc.sgChoice.get());this.track(C(()=>t.set(this.svc.sgChoice.get()))),this.track(C(()=>{const i=t.get();queueMicrotask(()=>{i!==this.svc.sgChoice.get()&&this.svc.selectSgBaseline(i)})}));const n=new pe({value:t,options:Or.map(i=>({value:i,label:Wn(i)})),placeholder:Wn("auto")});n.mount(this.ref(e,"sgPicker")),this.track(()=>n.destroy())}mountFilterLists(e){const t=["outdoor","indoor"];this.$each(this.ref(e,"venues"),()=>t,(i,r,o)=>this.wireEl(zi,{chip:{textContent:()=>Cu(i),"aria-pressed":()=>String(this.svc.filter.get().venueTypes.includes(i)),onclick:()=>this.svc.applyFilter(vs(this.svc.filter.get(),"venueTypes",i))}},o),i=>i);const n=["full_18","front_9","back_9","custom_holes"];this.$each(this.ref(e,"roundTypes"),()=>n,(i,r,o)=>this.wireEl(zi,{chip:{textContent:()=>Iu(i),"aria-pressed":()=>String(this.svc.filter.get().roundTypes.includes(i)),onclick:()=>this.svc.applyFilter(vs(this.svc.filter.get(),"roundTypes",i))}},o),i=>i),this.$each(this.ref(e,"courses"),()=>this.svc.courses.get(),(i,r,o)=>this.wireEl(yg,{name:()=>i.name,count:()=>ae(i.roundCount,$e),chk:{checked:()=>this.svc.filter.get().courseIds.includes(i.id),onchange:()=>this.svc.applyFilter(vs(this.svc.filter.get(),"courseIds",i.id))}},o),i=>i.id)}setBound(e,t){this.svc.applyFilter({...this.svc.filter.get(),[e]:t===""?null:t})}priorityNow(e){return this.svc.model.get().priorities.find(t=>t.component===e)}trendNow(e){return this.svc.model.get().trends.find(t=>t.id===e)}roundNow(e){return this.svc.model.get().rounds.find(t=>t.id===e)}tileNow(e){return Es(this.svc.model.get().results).find(t=>t.id===e)}histNow(e){return Ct(this.svc.model.get().results).find(t=>t.id===e)}sgCardNow(e){const t=this.svc.model.get();return Yt({attributed:t.waterfall.coverage.attributed,holesScored:t.waterfall.coverage.holesScored,windowRounds:t.rounds.length,rowsPer18:t.priorities.map(n=>n.per18),penaltySource:Wt(t.totals),baseline:this.svc.sgInfo.get()}).find(n=>n.id===e)}setHeading(e,t,n){const i=this.ref(e,t).querySelector("h2");i&&(i.textContent=n)}sampleMarker(){const e=this.svc.windowRounds.get().length,t=this.svc.roundsWithStats.get()??this.svc.loadedCount(),n=t<=e?ae(e,$e):`${ve(e,0)} of ${ae(t,$e)}`,i=this.svc.model.get().statCaptureRounds;return e===0||i>=e?n:`${n} · stat capture on ${ve(i,0)}`}statusLine(){const e=this.svc.extendError.get();return e?`${$.extendProblemPrefix}${e.message}`:this.svc.extending.get()?$.extending:this.svc.budgetSpent()?$.budgetSpent:this.svc.loading.get()?$.loading:""}emptyLine(){return!this.svc.loaded.get()||this.svc.error.get()?"":this.svc.overFiltered.get()?$.windowEmpty:this.svc.loadedCount()===0?$.noStats:""}}function Sg(s){const e=s.points[s.points.length-1];return e===void 0?"":s.kind==="percentage"?`${Math.round(e*100)}%`:we(e)}function Tg(s){const e=[jr(s.date)];return s.courseName&&e.push(s.courseName),e.push(`${ve(s.holeCount,0)} holes`),e.join(" · ")}const Pg=b(`
    <div class="roundstats">
        <button bind="back" class="roundstats__back" type="button">Back to statistics</button>
        <p bind="finishKicker" class="roundstats__kicker hidden">Round finished</p>

        <p bind="state" class="roundstats__state"></p>

        <div bind="body" class="roundstats__body hidden">
            <header class="roundstats__head">
                <h1 bind="title"></h1>
                <p bind="subtitle"></p>
                <p bind="score" class="roundstats__score"></p>
            </header>

            <section bind="stripSec" class="roundstats__section">
                <h2></h2>
                <div bind="strip" class="roundstats__strip"></div>
                <div bind="detail" class="holedetail">
                    <p bind="detailTitle" class="holedetail__title"></p>
                    <div bind="detailLines" class="holedetail__lines"></div>
                    <p bind="detailEmpty" class="holedetail__empty"></p>
                </div>
            </section>

            <section class="roundstats__section">
                <div class="stats__sechead">
                    <h2 bind="wfHeading"></h2>
                    ${ls}
                </div>
                <p bind="wfHint" class="roundstats__hint"></p>
                <div bind="deltas" class="roundstats__deltas"></div>
            </section>

            <div bind="panels" class="roundstats__panels"></div>

            <section class="roundstats__section">
                <h2 bind="legendHeading"></h2>
                <ul bind="legend" class="roundstats__legend"></ul>
            </section>
        </div>

        <button bind="finishClose" class="roundstats__closebtn hidden" type="button">Close</button>
${bt}
    </div>
`),Cg=b(`
    <button bind="cell" class="cell" type="button" aria-pressed="false">
        <span bind="hole" class="cell__hole"></span>
        <span bind="score" class="cell__score"></span>
        <span class="cell__glyphs">
            <span bind="tee" class="cell__tee"></span>
            <span bind="gir" class="cell__gir"></span>
            <span bind="putts" class="cell__putts"></span>
            <span bind="pen" class="cell__pen">⚑</span>
        </span>
    </button>
`),Ig=b(`
    <div class="holedetail__line">
        <span bind="label" class="holedetail__label"></span>
        <span bind="value" class="holedetail__value"></span>
    </div>
`),Eg=b(`
    <div class="delta">
        <div class="delta__text">
            <span bind="title" class="delta__title"></span>
            <span bind="sentence" class="delta__sentence"></span>
        </div>
        <span bind="value" class="delta__value"></span>
        <span bind="bar" class="delta__bar"></span>
    </div>
`),Rg=b('<li bind="text" class="roundstats__legenditem"></li>');function Ng(){const s=[];for(const[e,t]of Object.entries(gn))t.fill!==void 0&&s.push(`& .cell--${e} { background: ${t.fill}; color: #fff; border-color: transparent;`+(t.boxy?" border-radius: 3px;":"")+" }");return s.join(`
            `)}class Og extends M{static styles=`
        .roundstats {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .roundstats__back {
                ${S()}
                margin-bottom: ${a("lg")};
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
                &.hidden { display: none; }
            }

            /* Finish-flow mode (\`?finish=1\`): the screen is the last stage of
               the round's closing ceremony, so the dashboard back link stands
               down and a kicker + bottom Close home take its place. */
            & .roundstats__kicker {
                margin: 0 0 ${a("lg")};
                font-size: 0.78rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em;
                color: ${l("accent")};
                &.hidden { display: none; }
            }
            & .roundstats__closebtn {
                ${S()}
                width: 100%;
                min-height: 52px;
                margin-top: ${a("xl")};
                font-family: inherit; font-size: 1rem; font-weight: 700;
                background: ${l("primary")};
                color: ${l("primary-text")};
                border: none;
                &.hidden { display: none; }
            }

            & .roundstats__state {
                margin: 0; color: ${l("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
            }

            & .roundstats__body.hidden { display: none; }

            & .roundstats__head {
                margin-bottom: ${a("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.9rem; }
                & .roundstats__score {
                    color: ${l("text")};
                    font-size: 1.1rem; font-weight: 700;
                    font-variant-numeric: tabular-nums;
                    &:empty { display: none; }
                }
            }

            & .roundstats__section {
                margin-bottom: ${a("xl")};
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${a("md")};
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
                /* Outranks the same reset in SG_INFO_STYLES, which this nested
                   rule would otherwise beat and leave the flex row unbalanced. */
                & .stats__sechead h2 { margin-bottom: 0; }
            }
            & .roundstats__subhead {
                margin: ${a("lg")} 0 ${a("sm")};
                font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${l("text-muted")};
                &:empty { display: none; }
            }
            & .roundstats__hint {
                margin: ${a("xs")} 0 0; font-size: 0.82rem; color: ${l("text-muted")};
            }

            /* A wrapping grid rather than a scroller: eighteen cells fit three
               rows of six on the narrowest phone, and a horizontal scroller
               hides half the round behind a gesture. */
            & .roundstats__strip {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: ${a("xs")};
            }
            & .cell {
                ${S()}
                display: flex; flex-direction: column; align-items: center; gap: 1px;
                padding: ${a("xs")} 2px;
                font-family: inherit;
                background: ${l("surface-sunken")};
                border: 1px solid ${l("border")};
                border-radius: ${l("radius-sm")};

                &[aria-pressed='true'] { outline: 2px solid ${l("primary")}; outline-offset: 1px; }

                & .cell__hole { font-size: 0.62rem; opacity: 0.75; }
                & .cell__score {
                    font-size: 1rem; font-weight: 700;
                    font-variant-numeric: tabular-nums;
                }
                & .cell__glyphs {
                    display: flex; align-items: center; gap: 3px;
                    min-height: 9px;
                    font-size: 0.6rem; line-height: 1;
                }
                /* Tee dot and GIR ring are 7px marks; the putt count is a
                   digit; the penalty is a flag character. Each is hidden by an
                   empty/absent modifier rather than rendered as a placeholder. */
                & .cell__tee {
                    width: 7px; height: 7px; border-radius: 50%;
                    &.cell__tee--absent { display: none; }
                }
                & .cell__gir {
                    width: 7px; height: 7px; border-radius: 50%;
                    border: 1.5px solid currentColor;
                    &.cell__gir--hit { background: currentColor; }
                    &.cell__gir--absent { display: none; }
                }
                & .cell__putts {
                    font-variant-numeric: tabular-nums;
                    &:empty { display: none; }
                }
                & .cell__pen.cell__pen--absent { display: none; }
            }
            ${Ng()}

            & .holedetail {
                ${R()}
                margin-top: ${a("md")};
                padding: ${a("md")} ${a("lg")};
                &.hidden { display: none; }

                & .holedetail__title { margin: 0 0 ${a("xs")}; font-weight: 700; font-size: 0.95rem; }
                & .holedetail__lines { display: flex; flex-direction: column; gap: 2px; }
                & .holedetail__line { display: flex; justify-content: space-between; gap: ${a("md")}; }
                & .holedetail__label { color: ${l("text-muted")}; font-size: 0.85rem; }
                & .holedetail__value {
                    font-size: 0.85rem; font-weight: 600;
                    font-variant-numeric: tabular-nums;
                }
                & .holedetail__empty {
                    margin: 0; color: ${l("text-muted")}; font-size: 0.85rem;
                    &:empty { display: none; }
                }
            }

            & .roundstats__deltas { display: flex; flex-direction: column; gap: ${a("sm")}; }
            & .delta {
                ${R()}
                display: flex; align-items: center; gap: ${a("md")};
                padding: ${a("md")} ${a("lg")};

                & .delta__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .delta__title { font-weight: 600; font-size: 0.98rem; }
                & .delta__sentence {
                    color: ${l("text-muted")}; font-size: 0.8rem;
                    &:empty { display: none; }
                }
                & .delta__value {
                    font-weight: 700; font-variant-numeric: tabular-nums;
                    flex-shrink: 0;
                }
                & .delta__bar { width: 84px; flex-shrink: 0; & svg { width: 100%; display: block; } }
            }

            & .roundstats__panels { margin-bottom: ${a("xl")}; }

            & .roundstats__legend {
                margin: 0; padding: 0; list-style: none;
                display: flex; flex-direction: column; gap: ${a("xs")};
                color: ${l("text-muted")}; font-size: 0.82rem;
            }
        }

${ds}
    `;svc=this.inject(pt);auth=this.inject(V);router=this.inject(q);colors=hs;openHole=new p(null);infoOpen=new p(!1);render(){const e=this.router.query("id"),t=()=>this.svc.model.get(),n=()=>this.svc.phase.get()==="ready"&&t()!==null;this.track(C(()=>{const d=e.get();se(()=>{this.openHole.set(null),d&&this.svc.load(d)})}));const i=this.router.query("finish"),r=()=>i.get()==="1",o=this.wire(Pg,{back:{className:()=>r()?"roundstats__back hidden":"roundstats__back",onclick:()=>this.router.navigate("/stats")},finishKicker:{className:()=>r()?"roundstats__kicker":"roundstats__kicker hidden"},finishClose:{className:()=>r()?"roundstats__closebtn":"roundstats__closebtn hidden",onclick:()=>this.router.navigate("/")},state:()=>this.stateLine(),body:{className:()=>n()?"roundstats__body":"roundstats__body hidden"},title:()=>t()===null?"":di(t()),subtitle:()=>this.subtitle(),score:()=>{const d=t();return d===null?"":da(d.strokes,d.vsPar)??""},stripSec:{className:()=>(t()?.cells.length??0)>0?"roundstats__section":"roundstats__section hidden"},wfHeading:()=>te.waterfallHeading,wfHint:()=>te.waterfallHint,infoTrigger:{textContent:()=>$.prioritiesInfo,onclick:()=>this.infoOpen.set(!0)},infoSheet:{className:()=>this.infoOpen.get()?"stats-info":"stats-info hidden",onclick:d=>{d.target===d.currentTarget&&this.infoOpen.set(!1)}},infoTitle:()=>ye.title,infoDone:{onclick:()=>this.infoOpen.set(!1)},legendHeading:()=>te.legendHeading,detail:{className:()=>this.selected()===null?"holedetail hidden":"holedetail"},detailTitle:()=>{const d=this.selected();return d===null?"":Nf(d)},detailEmpty:()=>{const d=this.selected();return d===null?"":vn(d).length===0?te.nothingRecordedOnHole:""}});return this.setHeading(o,"stripSec",te.holeStripHeading),this.$each(this.ref(o,"strip"),()=>t()?.cells??[],(d,c,u)=>this.wireEl(Cg,{cell:{className:()=>{const h=this.cellNow(d.id)??d;return h.marker===null?"cell":`cell cell--${h.marker}`},"aria-pressed":()=>String(this.openHole.get()===d.id),"aria-label":()=>wi(this.cellNow(d.id)??d),title:()=>wi(this.cellNow(d.id)??d),onclick:()=>this.openHole.set(this.openHole.get()===d.id?null:d.id)},hole:()=>String((this.cellNow(d.id)??d).holeNumber),score:()=>Of(this.cellNow(d.id)??d),tee:{className:()=>(this.cellNow(d.id)??d).tee===null?"cell__tee cell__tee--absent":"cell__tee",style:()=>{const h=this.cellNow(d.id)??d;return h.tee===null?"":`background:${this.teeColor(h.tee)}`}},gir:{className:()=>{const h=this.cellNow(d.id)??d;return h.gir===null?"cell__gir cell__gir--absent":h.gir?"cell__gir cell__gir--hit":"cell__gir"}},putts:()=>{const h=this.cellNow(d.id)??d;return h.putts===null?"":String(h.putts)},pen:{className:()=>Op(this.cellNow(d.id)??d)?"cell__pen":"cell__pen cell__pen--absent"}},u),d=>d.id),this.$each(this.ref(o,"detailLines"),()=>Lf(this.selected()),(d,c,u)=>this.wireEl(Ig,{label:()=>d.label,value:()=>d.value},u),d=>d.key),this.$each(this.ref(o,"deltas"),()=>{const d=t();return d===null?[]:he.filter(c=>Ye(d.waterfall,c)!==null)},(d,c,u)=>this.wireEl(Eg,{title:()=>as(d),sentence:()=>{const h=t();if(h===null||h.deltas===null)return"";const f=ln(h.deltas,d);return f===null?"":ca(f,h.windowCount)},value:{textContent:()=>{const h=this.componentValue(d);return h===null?"":we(h)},style:()=>{const h=this.componentValue(d);return h===null?"":`color:${Qe(cs(h),this.colors)}`}},bar:{innerHTML:()=>{const h=t(),f=this.componentValue(d);return h===null||f===null?"":aa(f,Ar([h.waterfall]),this.colors)}}},u),d=>d),this.$each(this.ref(o,"infoCards"),()=>{const d=t();return d===null?[]:Yt({attributed:d.waterfall.coverage.attributed,holesScored:d.waterfall.coverage.holesScored,windowRounds:0,rowsPer18:he.map(c=>Pe(d.waterfall,c)),penaltySource:Wt(d.panels.totals),baseline:this.svc.sgInfo.get()})},(d,c,u)=>this.wireEl(yt,{ctitle:()=>d.title,ctext:()=>d.body},u),d=>d.id),this.spawn(ya,this.ref(o,"panels"),{model:()=>t()?.panels??Mr,baseline:()=>this.svc.sgInfo.get()}),this.$each(this.ref(o,"legend"),()=>[te.legendTee,te.legendGir,te.legendPutts,te.legendPenalty,te.legendAbsence],(d,c,u)=>this.wireEl(Rg,{text:()=>d},u),d=>d),o}cellNow(e){return this.svc.model.get()?.cells.find(t=>t.id===e)}selected(){const e=this.openHole.get();return e===null?null:this.cellNow(e)??null}teeColor(e){switch(e){case"fairway":return this.colors.gain;case"in_play":return this.colors.neutral;case"trouble":return this.colors.loss}}componentValue(e){const t=this.svc.model.get();return t===null?null:Ye(t.waterfall,e)}subtitle(){const e=this.svc.model.get();return e===null?"":Rf({...e,title:di(e)})}stateLine(){if(this.auth.currentUser.get()===null)return te.notSignedIn;switch(this.svc.phase.get()){case"loading":case"idle":return te.loading;case"notFound":return te.noStatsInRound;case"notAuthorized":return te.notSignedIn;case"failed":return`${te.failedPrefix}${this.svc.failure.get()??""}`;case"ready":return this.svc.model.get()?.cells.length===0?te.noHoleStrip:""}}setHeading(e,t,n){const i=this.ref(e,t).querySelector("h2");i&&(i.textContent=n)}}const Hg=b(`
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
`),Mg=b(`
    <div class="stat">
        <span bind="value" class="stat__value"></span>
        <span bind="label" class="stat__label"></span>
    </div>
`),Ag=b(`
    <button bind="row" type="button" class="admin-row">
        <div class="admin-row__top">
            <span bind="course" class="admin-row__title"></span>
            <span bind="visibility" class="admin-chip"></span>
            <span bind="status" class="admin-chip"></span>
        </div>
        <div class="admin-row__sub">
            <span bind="who"></span>
        </div>
        <div class="admin-row__sub admin-row__meta">
            <span bind="meta"></span>
        </div>
    </button>
`),Bg=b(`
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
`),zg={not_started:"Not started",active:"Playing",complete:"Done"},Lg={private:"Private",friends:"Friends",link:"Link"};function Fg(s){const e=[`${s.participants.length} players`,`${s.scoreEventCount} scores`];return s.lastEventAt?e.push(`last ${s.lastEventAt.replace("T"," ").slice(0,16)}`):e.push("never played"),e.join(" · ")}function Gg(s){const e=[`@${s.username}`,`${s.roundCount} rounds`];return s.lastRoundDate&&e.push(`last ${s.lastRoundDate}`),s.handicapIndex!==null&&e.push(`hcp ${s.handicapIndex}`),s.deletedAt&&e.push("DELETED"),e.join(" · ")}class jg extends M{static styles=`
        .admin {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .admin__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${l("text-muted")};
                cursor: pointer; padding: ${a("xs")} 0; margin-bottom: ${a("md")};
            }

            & .admin__title {
                margin: 0 0 ${a("lg")};
                font-family: ${l("font-display")};
                font-weight: 600; font-size: 1.8rem; letter-spacing: -0.02em;
                color: ${l("text")};
            }

            & .admin__denied {
                color: ${l("text-muted")}; font-size: 0.9rem;
                &.hidden { display: none; }
                & code {
                    display: block; margin-top: ${a("xs")};
                    font-size: 0.8rem; word-break: break-all;
                }
            }
            & .admin__denied-hint { color: ${l("text-muted")}; }
            & .admin__body.hidden { display: none; }

            & .admin__stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
                gap: ${a("sm")};
                margin-bottom: ${a("lg")};

                & .stat {
                    ${R({})}
                    display: flex; flex-direction: column; gap: 2px;
                    padding: ${a("sm")} ${a("md")};

                    & .stat__value {
                        font-family: ${l("font-display")};
                        font-size: 1.4rem; font-weight: 700; color: ${l("text")};
                    }
                    & .stat__label {
                        font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em;
                        text-transform: uppercase; color: ${l("text-muted")};
                    }
                }
            }

            & .admin__tabs {
                display: flex; gap: ${a("sm")}; margin-bottom: ${a("md")};

                & button {
                    ${S()}
                    flex: 1;
                    padding: ${a("sm")} ${a("md")};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
                    background: ${l("surface-sunken")}; color: ${l("text-muted")};
                    border: none; cursor: pointer;

                    &.active { background: ${l("primary")}; color: ${l("primary-text")}; }
                }
            }

            & .admin__loading {
                color: ${l("text-muted")}; font-size: 0.9rem; padding: ${a("lg")} 0;
                &.hidden { display: none; }
            }

            & .admin__list {
                display: flex; flex-direction: column; gap: ${a("sm")};
                &.hidden { display: none; }
            }

            & .admin-row {
                ${R({hover:!0})}
                display: flex; flex-direction: column; gap: ${a("xs")};
                width: 100%; text-align: left; font-family: inherit;
                padding: ${a("md")} ${a("lg")};
                cursor: pointer;

                &.admin-row--static { cursor: default; }

                & .admin-row__top {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: ${a("sm")};
                }

                & .admin-row__title {
                    font-weight: 700; font-size: 1rem; color: ${l("text")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }

                & .admin-row__sub {
                    font-size: 0.8rem; color: ${l("text-muted")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .admin-row__meta { font-variant-numeric: tabular-nums; }

                & .admin-row__actions {
                    display: flex; justify-content: flex-end; margin-top: ${a("xs")};
                    & button {
                        ${S()}
                        padding: ${a("xs")} ${a("md")};
                        font-family: inherit; font-size: 0.75rem; font-weight: 700;
                        background: ${l("surface-sunken")}; color: ${l("text-muted")};
                        border: none; cursor: pointer;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
            }

            & .admin-chip {
                flex-shrink: 0;
                font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.08em; border-radius: ${l("radius-pill")};
                padding: 2px 10px;
                background: ${l("surface-sunken")}; color: ${l("text-muted")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(br);auth=this.inject(V);router=this.inject(q);tab=new p("rounds");grantOpen=new p(!1);grantTarget=new p(null);mutating=new p(!1);denied=new T(()=>this.auth.currentUser.get()===null||!this.svc.isSuperAdmin());render(){this.svc.loadRoles().then(()=>{this.svc.isSuperAdmin()&&this.svc.load()});const e=this.wire(Hg,{back:{onclick:()=>this.router.navigate("/")},denied:{className:()=>this.denied.get()?"admin__denied":"admin__denied hidden"},body:{className:()=>this.denied.get()?"admin__body hidden":"admin__body"},loading:{className:()=>this.svc.loading.get()?"admin__loading":"admin__loading hidden"},tabRounds:{className:()=>this.tab.get()==="rounds"?"active":"",onclick:()=>this.tab.set("rounds")},tabPlayers:{className:()=>this.tab.get()==="players"?"active":"",onclick:()=>this.tab.set("players")},roundList:{className:()=>this.tab.get()==="rounds"?"admin__list":"admin__list hidden"},playerList:{className:()=>this.tab.get()==="players"?"admin__list":"admin__list hidden"}}),t=new T(()=>{const n=this.svc.stats.get();return n?[{key:"rounds",label:"Rounds",value:n.rounds},{key:"active",label:"Playing",value:n.roundsActive},{key:"week",label:"Last 7d",value:n.roundsLast7Days},{key:"players",label:"Players",value:n.players},{key:"guests",label:"Guests",value:n.guests},{key:"scores",label:"Scores",value:n.scoreEvents}]:[]});return this.$each(this.ref(e,"stats"),t,(n,i,r)=>this.wireEl(Mg,{value:()=>String(n.value),label:()=>n.label},r),n=>n.key),this.$each(this.ref(e,"roundList"),this.svc.rounds,(n,i,r)=>this.wireEl(Ag,{row:{disabled:()=>n.shareToken===null,onclick:()=>{n.shareToken&&this.router.navigate("/round",{query:{token:n.shareToken}})}},course:()=>n.courseName??"Unknown course",visibility:()=>Lg[n.visibility],status:()=>zg[n.status],who:()=>{const o=n.creatorName?`by ${n.creatorName}`:"by a guest",d=n.participants.join(", ");return d?`${o} — ${d}`:o},meta:()=>`${n.date} · ${Fg(n)}`},r),n=>n.roundId),this.$each(this.ref(e,"playerList"),this.svc.players,(n,i,r)=>this.wireEl(Bg,{name:()=>n.displayName,roleChip:()=>n.roles.includes("super_admin")?"admin":"",meta:()=>Gg(n),toggle:{textContent:()=>n.roles.includes("super_admin")?"Revoke admin":"Make admin",disabled:()=>this.mutating.get(),onclick:()=>{this.grantTarget.set(n),this.grantOpen.set(!0)}}},r),n=>n.playerId),this.spawn(oe,this.ref(e,"confirmHost"),{open:this.grantOpen,title:()=>this.grantTarget.get()?.roles.includes("super_admin")?"Revoke admin?":"Make admin?",message:()=>{const n=this.grantTarget.get();return n?n.roles.includes("super_admin")?`Remove the super admin role from ${n.displayName}?`:`Give ${n.displayName} the super admin role? They will be able to see every player's rounds.`:""},confirmLabel:"Confirm",cancelLabel:"Cancel",onconfirm:()=>{const n=this.grantTarget.get();n&&this.toggleAdmin(n)}}),e}async toggleAdmin(e){this.mutating.set(!0);try{const t={playerId:e.playerId,role:"super_admin"};e.roles.includes("super_admin")?await w.admin.adminRevokeRole(t):await w.admin.adminGrantRole(t),await this.svc.load(!0)}finally{this.mutating.set(!1)}}}function Dg(s,e){return s?e!==null&&s.ownerPlayerId===e?!0:s.rounds.some(t=>typeof t.shareToken=="string"):!1}class je{list=new p([]);listLoading=new p(!1);listError=new p(null);listLoaded=new p(!1);detail=new p(null);detailId=new p(null);detailLoading=new p(!1);detailError=new p(null);participants=new p([]);board=new p(null);boardRefusal=new p(null);boardLoading=new p(!1);results=new p(null);resultsRefusal=new p(null);mutating=new p(!1);mutateError=new p(null);async loadList(e=!1){if(!e&&(this.listLoaded.get()||this.listLoading.get()))return;const t=await F(this.listLoading,this.listError,()=>w.competitions.list());t&&(this.list.set(t),this.listLoaded.set(!0))}async loadDetail(e,t=!1){if(!t&&this.detailId.get()===e&&this.detail.get()!==null&&!this.detailLoading.get()||this.detailLoading.get()&&this.detailId.get()===e)return;this.detailId.set(e);const n=await F(this.detailLoading,this.detailError,()=>Promise.all([w.competitions.get({id:e}),w.competitions.participants({competitionId:e})]));if(!n)return;const[i,r]=n;this.detailId.get()===e&&(this.detail.set(i),this.participants.set(r),await this.loadBoard(e),i.lifecycle==="finalized"&&await this.loadResults(e))}async loadBoard(e){this.boardLoading.set(!0);try{const t=await w.competitions.leaderboard({id:e});t.ok?(this.board.set(t.value),this.boardRefusal.set(null)):(this.board.set(null),this.boardRefusal.set(t.refusal.message))}catch{this.board.set(null),this.boardRefusal.set(null)}finally{this.boardLoading.set(!1)}}async loadResults(e){try{const t=await w.competitions.results({id:e});t.ok?(this.results.set(t.value),this.resultsRefusal.set(null)):(this.results.set(null),this.resultsRefusal.set(t.refusal.message))}catch{this.results.set(null)}}async create(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await w.competitions.create({name:e});return this.list.set([t,...this.list.get()]),t}catch(t){return this.mutateError.set(Me(t)),null}finally{this.mutating.set(!1)}}transition(e,t){return this.mutate(()=>w.competitions.transition({id:e,to:t}),()=>this.loadDetail(e,!0))}updateConfig(e){return this.mutate(()=>w.competitions.update(e),()=>this.loadDetail(e.id,!0))}async addPlayer(e,t,n){return this.rosterMutate(e,()=>w.competitions.addParticipant({competitionId:e,playerId:t,category:n}))}async addGuest(e,t,n){this.mutating.set(!0),this.mutateError.set(null);let i;try{i=(await w.guestPlayers.create(t)).id}catch(r){return this.mutating.set(!1),this.mutateError.set(Me(r)),Me(r)}return this.mutating.set(!1),this.rosterMutate(e,()=>w.competitions.addParticipant({competitionId:e,guestPlayerId:i,category:n}))}removeParticipant(e,t){return this.rosterMutate(e,()=>w.competitions.removeParticipant({participantId:t}))}withdrawParticipant(e,t){return this.rosterMutate(e,()=>w.competitions.withdrawParticipant({participantId:t}))}async createRound(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await w.competitions.createRound(e);if(t.ok)return await this.loadDetail(e.id,!0),{ok:!0,shareToken:t.shareToken};const n="refusal"in t?t.refusal.message:t.diagnostics.map(i=>i.message).join(" · ");return this.mutateError.set(n),{ok:!1,message:n}}catch(t){const n=Me(t);return this.mutateError.set(n),{ok:!1,message:n}}finally{this.mutating.set(!1)}}async applyCut(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await w.competitions.applyCut({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const n=Me(t);return this.mutateError.set(n),{ok:!1,message:n}}finally{this.mutating.set(!1)}}async finalize(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await w.competitions.finalize({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const n=Me(t);return this.mutateError.set(n),{ok:!1,message:n}}finally{this.mutating.set(!1)}}clear(){this.list.set([]),this.listLoaded.set(!1),this.detail.set(null),this.detailId.set(null),this.participants.set([]),this.board.set(null),this.boardRefusal.set(null),this.results.set(null),this.resultsRefusal.set(null),this.listError.set(null),this.detailError.set(null),this.mutateError.set(null)}async mutate(e,t){this.mutating.set(!0),this.mutateError.set(null);try{const n=await e();return n.ok?(await t(),null):(this.mutateError.set(n.refusal.message),n.refusal.message)}catch(n){const i=Me(n);return this.mutateError.set(i),i}finally{this.mutating.set(!1)}}rosterMutate(e,t){return this.mutate(t,async()=>{const n=await w.competitions.participants({competitionId:e});this.participants.set(n)})}}function Me(s){return s&&typeof s=="object"&&"message"in s&&typeof s.message=="string"?s.message:"Something went wrong. Try again."}function _a(s){switch(s){case"draft":return"Draft";case"setup":return"Setup";case"active":return"Live";case"finalized":return"Finalized"}}function va(s){return`comp-chip comp-chip--${s}`}function Ms(s){switch(s){case"draft":return{to:"setup",label:"Open setup"};case"setup":return{to:"active",label:"Start competition"};default:return null}}function Xs(s){return s==="draft"||s==="setup"}function qg(s){return s==="setup"||s==="active"}const Vg=b(`
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
`),Ug=b(`
    <button bind="row" type="button" class="comp-row">
        <span bind="name" class="comp-row__name"></span>
        <span bind="chip"></span>
    </button>
`);class Kg extends M{static styles=`
        .comps {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .comps__head {
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

            & .comps__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${S()}
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                }
            }
            & .comps__body.hidden { display: none; }

            & .comps__create {
                display: flex;
                gap: ${a("sm")};
                margin-bottom: ${a("md")};
                & input { ${re()} flex: 1; padding: ${a("md")}; font-size: 1rem; }
                & button {
                    ${S()}
                    padding: ${a("md")} ${a("lg")};
                    font-family: inherit; font-size: 0.95rem; font-weight: 700;
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
            & .comps__err {
                margin: 0 0 ${a("md")}; font-size: 0.85rem; color: ${l("error")};
                &:empty { display: none; }
            }

            & .comps__loading, & .comps__empty {
                color: ${l("text-muted")}; font-size: 0.9rem; padding: ${a("lg")} 0;
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
                ${R({hover:!0})}
                cursor: pointer;

                & .comp-row__name {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${l("text")};
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
                border-radius: ${l("radius-pill")};
                padding: 2px 10px;
                background: ${l("surface-sunken")};
                color: ${l("text-muted")};

                &.comp-chip--setup { background: ${l("accent-soft")}; color: ${l("accent")}; }
                &.comp-chip--active { background: ${l("primary")}; color: ${l("primary-text")}; }
                &.comp-chip--finalized { background: ${l("accent")}; color: ${l("topbar-bg")}; }
            }
        }
    `;svc=this.inject(je);auth=this.inject(V);router=this.inject(q);loggedIn=new T(()=>this.auth.currentUser.get()!==null);nameDraft=new p("");render(){this.loggedIn.get()&&this.svc.loadList();const e=this.wire(Vg,{anon:{className:()=>this.loggedIn.get()?"comps__anon hidden":"comps__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/competitions"}})},body:{className:()=>this.loggedIn.get()?"comps__body":"comps__body hidden"},nameInput:{value:()=>this.nameDraft.get(),oninput:t=>this.nameDraft.set(t.target.value)},createBtn:{disabled:()=>this.svc.mutating.get()||this.nameDraft.get().trim()==="",textContent:()=>this.svc.mutating.get()?"Creating…":"Create"},createForm:{onsubmit:async t=>{t.preventDefault();const n=this.nameDraft.get().trim();if(n==="")return;const i=await this.svc.create(n);i&&(this.nameDraft.set(""),this.router.navigate("/competition",{query:{id:i.id}}))}},createErr:{textContent:()=>this.svc.mutateError.get()??""},loading:{className:()=>this.svc.listLoading.get()&&!this.svc.listLoaded.get()?"comps__loading":"comps__loading hidden"},empty:{className:()=>this.svc.listLoaded.get()&&this.svc.list.get().length===0?"comps__empty":"comps__empty hidden"}});return this.$each(this.ref(e,"list"),this.svc.list,(t,n,i)=>this.wireEl(Ug,{row:{onclick:()=>this.router.navigate("/competition",{query:{id:t.id}})},name:()=>t.name,chip:{textContent:()=>_a(t.lifecycle),className:()=>va(t.lifecycle)}},i),t=>t.id),e}}class Wg{loading=new p(!1);error=new p(null);descriptors=new p([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await F(this.loading,this.error,()=>w.setup.aggregations());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=be()){const n=typeof e=="string"?this.byId(e):e;return n?n.labels?.[t]??n.labels?.en??n.label:typeof e=="string"?e:""}}function Yg(s,e){const t={};for(const n of s){const i=e[n.key];t[n.key]=i!=null?String(i):String(n.default)}return t}function Xg(s,e){const t={};for(const n of s){const i=e[n.key]??String(n.default);t[n.key]=n.kind==="integer"?Number.parseInt(i,10)||Number(n.default):i}return t}class _t{competitions=Y.get(je);formats=Y.get(We);aggregations=Y.get(Wg);friends=Y.get(es);profile=Y.get(Ie);auth=Y.get(V);router=Y.get(q);id=this.router.query("id");admin=new T(()=>Dg(this.competitions.detail.get(),this.profile.player.get()?.id??null));lifecycle=new T(()=>this.competitions.detail.get()?.lifecycle??"draft");editingSetup=new p(!1);nameDraft=new p("");slotDraft=new p([]);aggregationStrategy=new p("");aggregationValues=new p({});startListDraft=new p("single_group");courseDraft=new p("");teeDraft=new p("");cutAfterDraft=new p("");cutTypeDraft=new p("");cutValueDraft=new p("");formatPickDraft=new p("");guestNameDraft=new p("");guestGenderDraft=new p("M");guestHcpDraft=new p("");roundCourseDraft=new p("");roundDateDraft=new p("");courses=new p([]);tees=new p([]);resultSetIndex=new p(0);cutOutcome=new p(null);cutConfirmOpen=new p(!1);finalizeConfirmOpen=new p(!1);coursesLoaded=!1;enter(){this.editingSetup.set(!1),this.nameDraft.set(""),this.slotDraft.set([]),this.aggregationStrategy.set(""),this.aggregationValues.set({}),this.startListDraft.set("single_group"),this.courseDraft.set(""),this.teeDraft.set(""),this.tees.set([]),this.cutAfterDraft.set(""),this.cutTypeDraft.set(""),this.cutValueDraft.set(""),this.formatPickDraft.set(""),this.guestNameDraft.set(""),this.guestGenderDraft.set("M"),this.guestHcpDraft.set(""),this.roundCourseDraft.set(""),this.roundDateDraft.set(""),this.resultSetIndex.set(0),this.cutOutcome.set(null),this.cutConfirmOpen.set(!1),this.finalizeConfirmOpen.set(!1)}initialize(){this.auth.currentUser.get()&&(this.profile.load(),this.friends.load()),this.formats.load(),this.aggregations.load(),this.loadCourses()}loadCourses(){this.coursesLoaded||(this.coursesLoaded=!0,w.courses.list().then(e=>this.courses.set(e)).catch(()=>{this.coursesLoaded=!1}))}async loadTees(e){if(!e){this.tees.set([]);return}try{this.tees.set(await w.tees.listByCourse({courseId:e}))}catch{this.tees.set([])}}selectAggregation(e){this.applyAggregation(e,{})}applyAggregation(e,t){this.aggregationStrategy.set(e);const n=this.aggregations.byId(e)?.configFields??[];this.aggregationValues.set(Yg(n,t))}setAggregationValue(e,t){this.aggregationValues.set({...this.aggregationValues.get(),[e]:t})}seedSetupEditor(){const e=this.competitions.detail.get();if(!e)return;this.nameDraft.set(e.name);const t=e.defaultConfig;this.slotDraft.set((t?.slots??[]).map(o=>o.formatId)),this.startListDraft.set(t?.startList??"single_group"),this.teeDraft.set(t?.fallbackTee?.teeId??"");const n=e.aggregation,i=n?.strategyId??this.aggregations.descriptors.get()[0]?.id??"";this.applyAggregation(i,n?.config??{});const r=e.cutRules;this.cutAfterDraft.set(r?.afterRound!==void 0?String(r.afterRound):""),this.cutTypeDraft.set(r?.cutType??""),this.cutValueDraft.set(r?.cutValue!==void 0?String(r.cutValue):""),this.formatPickDraft.set(this.formats.descriptors.get()[0]?.id??""),this.editingSetup.set(!0)}async saveSetup(){const e=this.id.get()??"",t=this.slotDraft.get().map(_=>({formatId:_})),n=this.teeDraft.get(),i=t.length>0?{slots:t,startList:this.startListDraft.get(),...n?{fallbackTee:{teeId:n}}:{}}:void 0,r=this.aggregationStrategy.get(),o=this.aggregations.byId(r)?.configFields??[],d=r?{strategyId:r,config:Xg(o,this.aggregationValues.get())}:void 0,c=Number.parseInt(this.cutAfterDraft.get(),10),u=Number.parseInt(this.cutValueDraft.get(),10),h=this.cutTypeDraft.get(),f=h&&Number.isFinite(c)&&Number.isFinite(u)?{afterRound:c,cutType:h,cutValue:u}:void 0;await this.competitions.updateConfig({id:e,name:this.nameDraft.get().trim()||void 0,...i?{defaultConfig:i}:{},...d?{aggregation:d}:{},...f?{cutRules:f}:{}})===null&&this.editingSetup.set(!1)}async addGuest(){const e=this.guestNameDraft.get().trim();if(!e)return;const t=_e(this.guestHcpDraft.get());await this.competitions.addGuest(this.id.get()??"",{displayName:e,gender:this.guestGenderDraft.get(),handicapIndex:t},null)===null&&(this.guestNameDraft.set(""),this.guestHcpDraft.set(""))}async createRound(){const e=this.roundCourseDraft.get()||this.courseDraft.get(),t=this.roundDateDraft.get();if(!e||!t)return this.competitions.mutateError.set("Pick a course and a date for the round."),null;const n=await this.competitions.createRound({id:this.id.get()??"",courseId:e,playedAt:t});return n.ok?n.shareToken:null}}const Qg=b(`
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
`),Jg=b(`
    <div class="cd__slot">
        <span bind="label"></span>
        <button bind="remove" type="button" aria-label="Remove">×</button>
    </div>
`),Et=b('<option bind="option"></option>'),Zg=b(`
    <label class="cd__field">
        <span bind="label"></span>
        <select bind="select"></select>
        <input bind="integer" inputmode="numeric" />
    </label>
`);class eb extends M{competitions=this.inject(je);state=this.inject(_t);render(){const e=()=>this.competitions.detail.get(),t=this.wire(Qg,{root:{className:()=>this.state.admin.get()&&Xs(this.state.lifecycle.get())?"cd__section cd__setup":"cd__section cd__setup hidden"},toggle:{textContent:()=>this.state.editingSetup.get()?"Close":"Edit",onclick:()=>{this.state.editingSetup.get()?this.state.editingSetup.set(!1):this.state.seedSetupEditor()}},summary:{className:()=>this.state.editingSetup.get()?"cd__summary hidden":"cd__summary"},summaryFormats:{textContent:()=>{const r=e()?.defaultConfig?.slots??[];return r.length?r.map(o=>this.state.formats.labelOf(o.formatId)??o.formatId).join(", "):"none set"},className:()=>(e()?.defaultConfig?.slots.length??0)===0?"cd__muted-em":""},summaryScoring:{textContent:()=>{const r=e()?.aggregation;return r?this.state.aggregations.labelOf(r.strategyId):"default (chosen automatically)"},className:()=>e()?.aggregation?"":"cd__muted-em"},form:{className:()=>this.state.editingSetup.get()?"cd__form":"cd__form hidden"},name:{value:()=>this.state.nameDraft.get(),oninput:r=>this.state.nameDraft.set(r.target.value)},formatPick:{value:()=>this.state.formatPickDraft.get(),onchange:r=>this.state.formatPickDraft.set(r.target.value)},addSlot:{onclick:()=>{const r=this.state.formatPickDraft.get()||this.state.formats.descriptors.get()[0]?.id;r&&this.state.slotDraft.set([...this.state.slotDraft.get(),r])}},aggregationPick:{value:()=>this.state.aggregationStrategy.get(),onchange:r=>this.state.selectAggregation(r.target.value)},aggregationDescription:()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.description??"",course:{value:()=>this.state.courseDraft.get(),onchange:r=>{const o=r.target.value;this.state.courseDraft.set(o),this.state.teeDraft.set(""),this.state.loadTees(o)}},tee:{value:()=>this.state.teeDraft.get(),onchange:r=>this.state.teeDraft.set(r.target.value)},startList:{value:()=>this.state.startListDraft.get(),onchange:r=>this.state.startListDraft.set(r.target.value)},cutAfter:{value:()=>this.state.cutAfterDraft.get(),oninput:r=>this.state.cutAfterDraft.set(r.target.value)},cutType:{value:()=>this.state.cutTypeDraft.get(),onchange:r=>this.state.cutTypeDraft.set(r.target.value)},cutValue:{value:()=>this.state.cutValueDraft.get(),oninput:r=>this.state.cutValueDraft.set(r.target.value)},save:{disabled:()=>this.competitions.mutating.get(),textContent:()=>this.competitions.mutating.get()?"Saving…":"Save setup",onclick:()=>{this.state.saveSetup()}},cancel:{onclick:()=>this.state.editingSetup.set(!1)}});this.$each(this.ref(t,"slots"),this.state.slotDraft,(r,o,d)=>this.wireEl(Jg,{label:()=>`Slot ${o+1}: ${this.state.formats.labelOf(r)??r}`,remove:{onclick:()=>this.state.slotDraft.set(this.state.slotDraft.get().filter((c,u)=>u!==o))}},d),(r,o)=>`${o}:${r}`),this.$each(this.ref(t,"formatPick"),this.state.formats.descriptors,(r,o,d)=>this.wireEl(Et,{option:{value:()=>r.id,textContent:()=>this.state.formats.labelOf(r)??r.id}},d),r=>r.id),this.$each(this.ref(t,"aggregationPick"),this.state.aggregations.descriptors,(r,o,d)=>this.wireEl(Et,{option:{value:()=>r.id,textContent:()=>this.state.aggregations.labelOf(r)}},d),r=>r.id);const n=new T(()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.configFields??[]);this.$each(this.ref(t,"aggregationFields"),n,(r,o,d)=>this.configField(r,d),r=>r.key);const i=(r,o)=>this.wireEl(Et,{option:{value:()=>r.id,textContent:()=>r.name}},o);return this.$each(this.ref(t,"course"),this.state.courses,(r,o,d)=>i(r,d),r=>r.id),this.$each(this.ref(t,"tee"),this.state.tees,(r,o,d)=>i(r,d),r=>r.id),t}configField(e,t){const n=this.wireEl(Zg,{label:()=>e.label,select:{className:()=>e.kind==="select"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),onchange:o=>this.state.setAggregationValue(e.key,o.target.value)},integer:{className:()=>e.kind==="integer"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),oninput:o=>this.state.setAggregationValue(e.key,o.target.value)}},t),i=n.querySelector("select"),r=new T(()=>e.kind==="select"?e.options:[]);return this.$each(i,r,(o,d,c)=>this.wireEl(Et,{option:{value:()=>o.value,textContent:()=>o.label}},c),o=>o.value),n}}const tb=b(`
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
`),sb=b(`
    <div class="cd__rosterrow">
        <span bind="name" class="cd__rname"></span>
        <span bind="category" class="cd__rcat"></span>
        <span bind="status" class="cd__rout"></span>
        <button bind="withdraw" class="cd__ract" type="button">Withdraw</button>
        <button bind="remove" class="cd__ract cd__ract--danger" type="button">Remove</button>
    </div>
`),nb=b('<button bind="chip" class="cd__friendchip" type="button"></button>');class ib extends M{competitions=this.inject(je);state=this.inject(_t);render(){const e=()=>this.state.id.get()??"",t=this.wire(tb,{count:()=>{const n=this.competitions.participants.get().length;return n===0?"":String(n)},empty:{className:()=>this.competitions.participants.get().length===0?"cd__empty":"cd__empty hidden"},add:{className:()=>this.state.admin.get()&&Xs(this.state.lifecycle.get())?"cd__rosteradd":"cd__rosteradd hidden"},guestForm:{onsubmit:n=>{n.preventDefault(),this.state.addGuest()}},guestName:{value:()=>this.state.guestNameDraft.get(),oninput:n=>this.state.guestNameDraft.set(n.target.value)},guestGender:{value:()=>this.state.guestGenderDraft.get(),onchange:n=>this.state.guestGenderDraft.set(n.target.value)},guestHcp:{value:()=>this.state.guestHcpDraft.get(),oninput:n=>this.state.guestHcpDraft.set(n.target.value)},addGuest:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"roster"),this.competitions.participants,(n,i,r)=>this.wireEl(sb,{name:()=>n.displayNameSnapshot,category:{textContent:()=>n.category??"",className:()=>n.category?"cd__rcat":"cd__rcat hidden"},status:{textContent:()=>n.withdrawnAt?"Withdrawn":n.cutAfterRound!==null?`Cut R${n.cutAfterRound}`:"",className:()=>n.withdrawnAt||n.cutAfterRound!==null?"cd__rout":"cd__rout hidden"},withdraw:{className:()=>this.state.admin.get()&&!n.withdrawnAt?"cd__ract":"cd__ract hidden",onclick:()=>{this.competitions.withdrawParticipant(e(),n.id)}},remove:{className:()=>this.state.admin.get()&&Xs(this.state.lifecycle.get())?"cd__ract cd__ract--danger":"cd__ract cd__ract--danger hidden",onclick:()=>{this.competitions.removeParticipant(e(),n.id)}}},r),n=>JSON.stringify({id:n.id,name:n.displayNameSnapshot,category:n.category,withdrawnAt:n.withdrawnAt,cutAfterRound:n.cutAfterRound})),this.$each(this.ref(t,"friends"),this.state.friends.friends,(n,i,r)=>this.wireEl(nb,{chip:{textContent:()=>n.displayName,disabled:()=>this.competitions.mutating.get()||this.competitions.participants.get().some(o=>o.playerId===n.id),onclick:()=>{this.competitions.addPlayer(e(),n.id,null)}}},r),n=>n.id),t}}const rb={not_started:"Not started",active:"Live",complete:"Finished"},ab=b(`
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
`),ob=b(`
    <button bind="row" class="cd__roundrow" type="button">
        <span bind="number" class="cd__rnum"></span>
        <span bind="meta" class="cd__rmeta"></span>
        <span bind="status" class="cd__rstatus"></span>
    </button>
`),lb=b('<option bind="option"></option>');class db extends M{competitions=this.inject(je);state=this.inject(_t);router=this.inject(q);render(){const e=new T(()=>this.competitions.detail.get()?.rounds??[]),t=this.wire(ab,{empty:{className:()=>e.get().length===0?"cd__empty":"cd__empty hidden"},form:{className:()=>this.state.admin.get()&&qg(this.state.lifecycle.get())?"cd__addround":"cd__addround hidden",onsubmit:n=>{n.preventDefault(),this.createRound()}},course:{value:()=>this.state.roundCourseDraft.get(),onchange:n=>this.state.roundCourseDraft.set(n.target.value)},date:{value:()=>this.state.roundDateDraft.get(),oninput:n=>this.state.roundDateDraft.set(n.target.value)},add:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"course"),this.state.courses,(n,i,r)=>this.wireEl(lb,{option:{value:()=>n.id,textContent:()=>n.name}},r),n=>n.id),this.$each(this.ref(t,"rounds"),e,(n,i,r)=>this.wireEl(ob,{row:{disabled:()=>!n.shareToken,onclick:()=>{n.shareToken&&this.router.navigate("/round",{query:{token:n.shareToken}})}},number:()=>`Round ${n.roundNumber}`,meta:()=>[n.courseNameSnapshot,n.date].filter(Boolean).join(" · ")||(n.shareToken?"Open":"View-only"),status:{textContent:()=>rb[n.status]??n.status,className:()=>`cd__rstatus s-${n.status}`}},r),n=>JSON.stringify({id:n.id,status:n.status,shareToken:n.shareToken,courseName:n.courseNameSnapshot,date:n.date})),t}async createRound(){const e=await this.state.createRound();e&&this.router.navigate("/round",{query:{token:e}})}}function cb(s,e,t){return JSON.stringify({entry:s,points:e,columns:t})}function ub(s){return s.rounds.filter(e=>e.value!==null).map(e=>({text:String(e.value),dropped:e.status==="dropped"}))}const hb=b(`
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
`),pb=b('<button bind="button" type="button"></button>'),fb=b('<th bind="cell"></th>'),mb=b('<tr bind="row"></tr>'),gb=b('<td bind="cell"><span bind="value"></span></td>'),bb=b(`
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
`),yb=b('<span bind="part"><span bind="separator"></span><span bind="value"></span></span>');class _b extends M{competitions=this.inject(je);state=this.inject(_t);render(){const e=new T(()=>{if(this.state.lifecycle.get()!=="finalized")return(this.competitions.board.get()?.view.entries??[]).map(f=>({entry:f,points:null}));const u=this.competitions.results.get()?.resultSets??[],h=Math.min(this.state.resultSetIndex.get(),u.length-1);return(u[h]?.entries??[]).map(f=>({entry:f.entry,points:f.points}))}),t=new T(()=>{const u=this.competitions.board.get()?.view.rounds??[];if(u.length>0)return u;const h=new Set;for(const f of e.get())for(const m of f.entry.rounds)h.add(m.roundNumber);return[...h].sort((f,m)=>f-m).map(f=>({roundNumber:f,postCut:!1}))}),n=()=>this.state.lifecycle.get()==="finalized",i=()=>n()?(this.competitions.results.get()?.resultSets.length??0)>0:this.competitions.board.get()!==null,r=()=>this.state.cutOutcome.get(),o=u=>u.length===0?"—":u.map(h=>h.displayName).join(", "),d=this.wire(hb,{admin:{className:()=>this.state.admin.get()&&this.state.lifecycle.get()==="active"?"cd__section cd__admin":"cd__section cd__admin hidden"},cutOutcome:{className:()=>r()?"cd__cutoutcome":"cd__cutoutcome hidden"},advancedLabel:()=>`Advanced (${r()?.advanced.length??0}):`,advanced:()=>o(r()?.advanced??[]),cutLabel:()=>`Cut (${r()?.cut.length??0}):`,cut:()=>o(r()?.cut??[]),applyCut:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.cutConfirmOpen.set(!0)},finalize:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.finalizeConfirmOpen.set(!0)},title:()=>n()?"Official results":"Leaderboard",board:{className:()=>n()?"cd__board cb cb--official":"cd__board"},official:{textContent:()=>{const u=this.competitions.results.get()?.finalizedAt.slice(0,10)??"";return n()&&u?`Official results · finalized ${u}`:""},className:()=>n()?"cd__official-banner":"cd__official-banner hidden"},boardHead:{className:()=>n()?"cb-head hidden":"cb-head"},metric:()=>this.competitions.board.get()?.view.metricLabel??"",operator:()=>{const u=this.competitions.board.get();return u?u.view.operator.kind==="best_n"?`Best ${u.view.operator.n} of ${u.view.rounds.length}`:"Total across rounds":""},defaulted:{className:()=>this.competitions.board.get()?.defaulted?"cb-head__hint":"cb-head__hint hidden"},empty:{className:()=>i()&&e.get().length===0?"cb-empty":"cb-empty hidden"},table:{className:()=>i()&&e.get().length>0?"cb":"cb hidden"},refusal:{textContent:()=>n()?this.competitions.resultsRefusal.get()??"":this.competitions.board.get()===null?this.competitions.boardRefusal.get()??"":""}}),c=new T(()=>[{text:"#",className:"cb-pos"},{text:"Player",className:"cb-who"},...t.get().map((u,h,f)=>({text:`R${u.roundNumber}`,className:`cb-c${u.postCut&&!f.slice(0,h).some(m=>m.postCut)?" cb-c--divider":""}`})),{text:"Total",className:"cb-total"},...n()?[{text:"Pts",className:"cb-points"}]:[]]);return this.$each(this.ref(d,"headers"),c,(u,h,f)=>this.wireEl(fb,{cell:{textContent:()=>u.text,className:()=>u.className}},f),u=>`${u.text}:${u.className}`),this.$each(this.ref(d,"rows"),e,(u,h,f)=>this.boardRow(u,t.get(),f),u=>cb(u.entry,u.points,t.get())),this.$each(this.ref(d,"switcher"),new T(()=>n()?this.competitions.results.get()?.resultSets??[]:[]),(u,h,f)=>this.wireEl(pb,{button:{textContent:()=>u.scoringType.toUpperCase(),className:()=>this.state.resultSetIndex.get()===h?"on":"",onclick:()=>this.state.resultSetIndex.set(h)}},f),u=>u.scoringType),this.spawn(oe,this.ref(d,"cutConfirm"),{open:this.state.cutConfirmOpen,title:"Apply cut?",message:"This evaluates the configured cut against the current aggregate and marks who advances. Cut players are left out of later rounds.",confirmLabel:"Apply cut",cancelLabel:"Cancel",onconfirm:async()=>{const u=await this.competitions.applyCut(this.state.id.get()??"");u.ok&&this.state.cutOutcome.set(u.outcome)}}),this.spawn(oe,this.ref(d,"finalizeConfirm"),{open:this.state.finalizeConfirmOpen,title:"Finalize competition?",message:"Finalizing freezes the official results and locks the competition. This cannot be undone.",confirmLabel:"Finalize",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.competitions.finalize(this.state.id.get()??"")}}),d}boardRow(e,t,n){const i=e.entry,r=i.withdrawn||i.cutAfterRound!==null,o=["cb-row"];i.withdrawn?o.push("cb-row--withdrawn"):i.cutAfterRound!==null?o.push("cb-row--cut"):i.position===1&&o.push("cb-row--lead"),i.incomplete&&o.push("cb-row--incomplete");const d=t.findIndex(f=>f.postCut),c=new Map(i.rounds.map(f=>[f.roundNumber,f])),u=[{kind:"position",text:r?"—":String(i.position)},{kind:"who",entry:i},...t.map((f,m)=>({kind:"round",cell:c.get(f.roundNumber)??null,divider:m===d})),{kind:"total",text:i.total===null?"—":String(i.total)},...e.points===null?[]:[{kind:"points",text:String(e.points)}]],h=this.wireEl(mb,{row:{className:()=>o.join(" ")}},n);return this.$each(h,new T(()=>u),(f,m,_)=>this.boardCell(f,_),(f,m)=>m),h}boardCell(e,t){if(e.kind==="who")return this.whoCell(e.entry,t);const n=e.kind==="position"?"cb-pos":e.kind==="total"?"cb-total":e.kind==="points"?"cb-points":`cb-c cb-c--${e.cell?.status??"missing"}${e.divider?" cb-c--divider":""}`,i=e.kind==="round"?e.cell?.value===null||!e.cell?"—":String(e.cell.value):e.text;return this.wireEl(gb,{cell:{className:()=>n},value:{textContent:()=>i,className:()=>e.kind==="round"&&e.cell?.status==="dropped"?"cb-struck":""}},t)}whoCell(e,t){const n=e.withdrawn?"WD":e.cutAfterRound!==null?`Cut R${e.cutAfterRound}`:"",i=ub(e),r=this.wireEl(bb,{cell:{},name:()=>e.displayName,category:{textContent:()=>e.category??"",className:()=>e.category?"cb-tag cb-cat":"cb-tag cb-cat hidden"},status:{textContent:()=>n,className:()=>n?"cb-tag cb-tag--out":"cb-tag cb-tag--out hidden"},equals:{className:()=>i.length===0?"hidden":""},total:()=>e.total===null?"—":String(e.total)},t);return this.$each(r.querySelector('[bind="parts"]'),new T(()=>i),(o,d,c)=>this.wireEl(yb,{separator:()=>d===0?"":" + ",value:{textContent:()=>o.text,className:()=>o.dropped?"cb-struck":""}},c),(o,d)=>d),r}}const vb=b(`
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
`);class wb extends M{static styles=`
        .cd {
            padding: ${a("lg")} ${a("lg")} ${a("2xl")};
            & .hidden { display: none !important; }
            & .cd__muted-em { font-style: italic; }
            & .cb-struck { text-decoration: line-through; opacity: 0.8; }

            & .cd__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 700; color: ${l("accent")};
                cursor: pointer; padding: 0 0 ${a("md")};
            }
            & .cd__loading, & .cd__loaderr {
                color: ${l("text-muted")}; padding: ${a("lg")} 0;
                &.hidden { display: none; }
            }
            & .cd__loaderr { color: ${l("error")}; }
            & .cd__body.hidden { display: none; }

            & .cd__head { margin-bottom: ${a("md")}; }
            & .cd__titlerow { display: flex; align-items: center; gap: ${a("md")}; }
            & .cd__head h1 {
                margin: 0; font-family: ${l("font-display")}; font-weight: 600;
                font-size: 1.7rem; letter-spacing: -0.02em;
            }
            & .cd__owner { margin: ${a("xs")} 0 0; color: ${l("text-muted")}; font-size: 0.85rem; }

            & .comp-chip {
                flex-shrink: 0; font-size: 0.7rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em;
                border-radius: ${l("radius-pill")}; padding: 2px 10px;
                background: ${l("surface-sunken")}; color: ${l("text-muted")};
                &.comp-chip--setup { background: ${l("accent-soft")}; color: ${l("accent")}; }
                &.comp-chip--active { background: ${l("primary")}; color: ${l("primary-text")}; }
                &.comp-chip--finalized { background: ${l("accent")}; color: ${l("topbar-bg")}; }
            }

            & .cd__err {
                margin: 0 0 ${a("md")}; font-size: 0.85rem; color: ${l("error")};
                &:empty { display: none; }
            }

            & .cd__transition {
                margin-bottom: ${a("lg")};
                &.hidden { display: none; }
                & button {
                    ${S()}
                    padding: ${a("md")} ${a("lg")}; font-family: inherit;
                    font-size: 0.95rem; font-weight: 700;
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
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
                    margin: 0; font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
                & .cd__count { color: ${l("text-muted")}; font-size: 0.85rem; }
            }
            & .cd__linkbtn {
                margin-left: auto; background: none; border: none; font-family: inherit;
                font-size: 0.85rem; font-weight: 700; color: ${l("accent")}; cursor: pointer;
            }
            & .cd__summary {
                ${R()} padding: ${a("md")} ${a("lg")};
                font-size: 0.85rem; color: ${l("text-muted")}; line-height: 1.5;
                &.hidden { display: none; }
            }
            & .cd__empty { color: ${l("text-muted")}; font-size: 0.9rem; padding: ${a("sm")} 0;
                &.hidden { display: none; } &:empty { display: none; } }

            & .cd__form {
                ${R()} padding: ${a("lg")};
                display: flex; flex-direction: column; gap: ${a("md")};
                &.hidden { display: none; }
                & .cd__field { display: flex; flex-direction: column; gap: ${a("xs")};
                    & > span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                        letter-spacing: 0.05em; color: ${l("text-muted")}; }
                    & input, & select { ${re()} padding: ${a("sm")} ${a("md")}; font-size: 0.95rem; }
                }
                & .cd__aggdesc { margin: 0; font-size: 0.8rem; color: ${l("text-muted")}; &:empty { display: none; } }
                & .cd__aggfields { display: flex; flex-direction: column; gap: ${a("md")}; &:empty { display: none; } }
                & .cd__cutrow, & .cd__addrow { display: flex; gap: ${a("sm")}; }
                & .cd__cutrow input { width: 33%; }
                & .cd__addrow select { flex: 1; }
                & .cd__slots { display: flex; flex-direction: column; gap: ${a("xs")}; }
                & .cd__formactions { display: flex; align-items: center; gap: ${a("md")}; margin-top: ${a("sm")}; }
                & button[bind="addSlot"], & button[bind="saveSetup"] {
                    ${S()}
                    padding: ${a("sm")} ${a("md")}; font-family: inherit; font-weight: 700;
                    background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                }
            }
            & .cd__slot {
                display: flex; align-items: center; justify-content: space-between;
                padding: ${a("xs")} ${a("sm")}; background: ${l("surface-sunken")};
                border-radius: ${l("radius-sm")}; font-size: 0.9rem; font-weight: 600;
                & button { background: none; border: none; color: ${l("error")}; cursor: pointer; font-size: 1.1rem; }
            }

            & .cd__roster { display: flex; flex-direction: column; gap: ${a("xs")}; margin-bottom: ${a("md")}; }
            & .cd__rosterrow {
                display: flex; align-items: center; gap: ${a("sm")};
                padding: ${a("sm")} ${a("md")}; ${R()}
                & .cd__rname { font-weight: 700; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                & .cd__rcat, & .cd__rout {
                    font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
                    border-radius: ${l("radius-pill")}; padding: 1px 8px;
                }
                & .cd__rcat { background: ${l("accent-soft")}; color: ${l("accent")}; }
                & .cd__rout { background: ${l("surface-sunken")}; color: ${l("text-muted")}; }
                & .cd__ract { background: none; border: none; cursor: pointer; color: ${l("text-muted")};
                    font-size: 0.75rem; font-weight: 700; }
                & .cd__ract--danger { color: ${l("error")}; }
            }
            & .cd__rosteradd, & .cd__addround { &.hidden { display: none; } }
            & .cd__sublabel { display: block; font-size: 0.75rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.05em; color: ${l("text-muted")};
                margin: ${a("md")} 0 ${a("xs")}; }
            & .cd__friendpick { display: flex; flex-wrap: wrap; gap: ${a("xs")}; }
            & .cd__friendchip {
                ${S()}
                padding: ${a("xs")} ${a("md")}; font-family: inherit;
                font-size: 0.85rem; font-weight: 600; cursor: pointer;
                &:disabled { opacity: 0.4; }
            }
            & .cd__guestrow, & .cd__addroundrow { display: flex; gap: ${a("sm")}; }
            & .cd__guestrow input, & .cd__addroundrow input, & .cd__addroundrow select {
                ${re()}
                padding: ${a("sm")} ${a("md")}; font-size: 0.9rem; min-width: 0; }
            & .cd__guestrow input[bind="guestName"] { flex: 1; }
            & .cd__guestrow input[bind="guestHcp"] { width: 4.5rem; }
            & .cd__guestrow select { width: 3.5rem; }
            & .cd__addroundrow select { flex: 1; }
            & .cd__guestrow button, & .cd__addroundrow button {
                ${S()}
                padding: ${a("sm")} ${a("md")}; font-family: inherit; font-weight: 700;
                background: ${l("primary")}; color: ${l("primary-text")}; border: none; }

            & .cd__rounds { display: flex; flex-direction: column; gap: ${a("xs")}; }
            & .cd__roundrow {
                display: flex; align-items: center; gap: ${a("md")};
                padding: ${a("md")} ${a("lg")}; ${R({hover:!0})}
                text-align: left; font-family: inherit; width: 100%; cursor: pointer;
                &:disabled { cursor: default; opacity: 0.75; }
                & .cd__rnum { font-weight: 700; }
                & .cd__rmeta { color: ${l("text-muted")}; font-size: 0.85rem; flex: 1; }
                & .cd__rstatus {
                    font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.06em; border-radius: ${l("radius-pill")}; padding: 2px 10px;
                    background: ${l("surface-sunken")}; color: ${l("text-muted")};
                    &.s-active { background: ${l("accent-soft")}; color: ${l("accent")}; }
                }
            }

            & .cd__admin.hidden { display: none; }
            & .cd__adminbtns { display: flex; gap: ${a("md")}; }
            & .cd__adminbtns button {
                ${S()}
                padding: ${a("md")} ${a("lg")}; font-family: inherit; font-weight: 700;
            }
            & .cd__cutbtn { background: ${l("accent-soft")}; color: ${l("accent")}; border-color: ${l("accent")}; }
            & .cd__finalbtn { background: ${l("error")}; color: #fff; border: none; }
            & .cd__adminnote { margin: ${a("sm")} 0 0; font-size: 0.8rem; color: ${l("text-muted")}; }
            & .cd__cutoutcome { &:empty { display: none; } margin-bottom: ${a("md")}; font-size: 0.85rem;
                ${R()} padding: ${a("md")} ${a("lg")}; }
            & .cd__cutoutcome .cd__cutgrp { margin-bottom: ${a("xs")}; }
            & .cd__cutoutcome strong { color: ${l("text")}; }

            & .cd__setswitch { display: flex; gap: ${a("xs")}; margin-bottom: ${a("sm")};
                &:empty { display: none; }
                & button {
                    ${S()}
                    padding: ${a("xs")} ${a("md")}; font-family: inherit;
                    font-size: 0.85rem; font-weight: 700; cursor: pointer;
                    &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
                }
            }

            /* --- aggregated / official board --- */
            & .cd__board { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            & .cd__official-banner {
                ${R()} padding: ${a("sm")} ${a("lg")}; margin-bottom: ${a("sm")};
                background: ${l("accent-soft")}; color: ${l("accent")};
                font-weight: 700; font-size: 0.85rem;
                border-color: ${l("accent")};
            }
            & .cb-head { display: flex; align-items: baseline; gap: ${a("sm")}; margin-bottom: ${a("sm")}; }
            & .cb-head__title { margin: 0; font-family: ${l("font-display")}; font-weight: 600; font-size: 1rem; }
            & .cb-head__op, & .cb-head__hint { font-size: 0.75rem; color: ${l("text-muted")}; }
            & .cb-empty { color: ${l("text-muted")}; padding: ${a("md")} 0; }
            & table.cb {
                width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums;
            }
            & .cb.cb--official { box-shadow: inset 0 0 0 2px ${l("accent")}; border-radius: ${l("radius")}; }
            & .cb thead th {
                font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em;
                color: ${l("text-muted")}; font-weight: 700; padding: ${a("xs")} ${a("sm")};
                border-bottom: 1px solid ${l("border")}; text-align: center;
            }
            & .cb th.cb-who, & .cb td.cb-who { text-align: left; }
            & .cb tbody td { padding: ${a("sm")}; border-bottom: 1px solid ${l("border")};
                text-align: center; font-size: 0.9rem; }
            & .cb .cb-pos { width: 2rem; color: ${l("text-muted")}; font-weight: 700; }
            & .cb .cb-who { min-width: 0; }
            & .cb .cb-who__line { display: flex; align-items: baseline; gap: ${a("xs")}; min-width: 0; }
            & .cb .cb-name { font-weight: 700; font-family: ${l("font-display")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
            & .cb .cb-arith { font-size: 0.72rem; color: ${l("text-muted")}; margin-top: 1px;
                font-variant-numeric: tabular-nums; }
            & .cb .cb-arith s { opacity: 0.7; }
            & .cb .cb-arith__total { font-weight: 700; color: ${l("text")}; }
            & .cb .cb-tag { font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.05em; border-radius: ${l("radius-pill")}; padding: 1px 7px; flex-shrink: 0; }
            & .cb .cb-cat { background: ${l("accent-soft")}; color: ${l("accent")}; }
            & .cb .cb-tag--out { background: ${l("surface-sunken")}; color: ${l("text-muted")}; }
            & .cb .cb-c--dropped { color: ${l("text-muted")}; }
            & .cb .cb-c--dropped s { opacity: 0.8; }
            & .cb .cb-c--missing, & .cb .cb-c--cut { color: ${l("text-muted")}; }
            & .cb .cb-c--divider { border-left: 2px solid ${l("accent")}; }
            & .cb .cb-total { font-weight: 800; font-size: 1rem; }
            & .cb .cb-points { font-weight: 800; color: ${l("accent")}; }
            & .cb tr.cb-row--lead td { background: ${l("accent-soft")}; }
            & .cb tr.cb-row--cut td, & .cb tr.cb-row--withdrawn td {
                color: ${l("text-muted")}; background: ${l("surface-sunken")}; opacity: 0.85; }
        }
    `;competitions=this.inject(je);state=this.inject(_t);router=this.inject(q);render(){const e=()=>this.competitions.detail.get();this.track(C(()=>{const n=this.state.id.get();n&&se(()=>{this.state.enter(),this.competitions.loadDetail(n)})})),this.state.initialize();const t=this.wire(vb,{back:{onclick:()=>this.router.navigate("/competitions")},loading:{className:()=>this.competitions.detailLoading.get()&&e()===null?"cd__loading":"cd__loading hidden"},loadErr:{textContent:()=>this.competitions.detailError.get()?.message??"",className:()=>this.competitions.detailError.get()?"cd__loaderr":"cd__loaderr hidden"},body:{className:()=>e()?"cd__body":"cd__body hidden"},name:()=>e()?.name??"",chip:{textContent:()=>_a(this.state.lifecycle.get()),className:()=>va(this.state.lifecycle.get())},ownerLine:{textContent:()=>this.state.admin.get()?"You administer this competition.":"Read-only view."},mutateErr:{textContent:()=>this.competitions.mutateError.get()??""},transitionRow:{className:()=>this.state.admin.get()&&Ms(this.state.lifecycle.get())?"cd__transition":"cd__transition hidden"},transitionBtn:{textContent:()=>Ms(this.state.lifecycle.get())?.label??"",disabled:()=>this.competitions.mutating.get(),onclick:()=>{const n=Ms(this.state.lifecycle.get()),i=this.state.id.get();n&&i&&this.competitions.transition(i,n.to)}}});return this.spawn(eb,this.ref(t,"setup")),this.spawn(ib,this.ref(t,"roster")),this.spawn(db,this.ref(t,"rounds")),this.spawn(_b,this.ref(t,"results")),t}}const xb=b(`
    <div class="app-shell">
        <header bind="header" class="app-shell__header">
            <div bind="account"></div>
        </header>
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class kb extends M{static styles=`
        .app-shell {
            display: grid;
            grid-template-rows: auto 1fr auto;
            height: 100vh;
            height: 100dvh;
            max-width: 560px;
            margin: 0 auto;
            background: ${l("bg")};

            /* The account slot. Its popover is absolutely positioned inside the
               menu component, so the header must not clip or under-stack it. */
            & .app-shell__header {
                grid-row: 1;
                position: relative;
                z-index: 20;
                display: flex;
                justify-content: flex-end;
                padding: ${a("md")} ${a("lg")} 0;

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
    `;router=this.inject(q);render(){const e=this.wire(xb,{header:{className:()=>en(this.router.route.get())?"app-shell__header":"app-shell__header hidden"}});return this.spawn(Uu,this.ref(e,"account")),this.spawn(Xo,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":Zn,"/history":dh,"/round":sm,"/create":Rm,"/login":Mm,"/friends":Lm,"/friend":Gm,"/friend-rounds":Dm,"/friend-courses":Um,"/spectate":Qm,"/profile":sg,"/stats":$g,"/round-stats":Og,"/admin":jg,...sr.competitions?{"/competitions":Kg,"/competition":wb}:{}},Zn),e}}class $b extends V{constructor(e){super(),this.client=e}client;async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await this.client.login(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await this.client.me()),this.error.set(null)}catch(e){e instanceof Q&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await this.client.logout(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof Q&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logoutEverywhere(){this.loading.set(!0);try{const e=await this.client.logoutAll();return this.currentUser.set(null),this.error.set(null),e.revoked}catch(e){return e instanceof Q&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"}),null}finally{this.loading.set(!1)}}}Y.get(Ga);const Li=Y.get(q);Y.set(V,new $b(fa));const Fi=Y.get(V);await Va(kb,"#app",{hot:void 0,onInit:async()=>{await Fi.load(),Fi.currentUser.get()&&Li.route.get()==="/login"&&Li.navigate("/",!0)}});export{As as A,M as C,q as R,p as S,Ga as T,y as a,dt as b,T as c,Na as d,C as e,Ra as n,F as r,b as t};
