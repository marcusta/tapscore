(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const Wi="modulepreload",Yi=function(s){return"/tapscore/"+s},Is={},Qi=function(e,t,n){let i=Promise.resolve();if(t&&t.length>0){let c=function(u){return Promise.all(u.map(f=>Promise.resolve(f).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),d=l?.nonce||l?.getAttribute("nonce");i=c(t.map(u=>{if(u=Yi(u),u in Is)return;Is[u]=!0;const f=u.endsWith(".css"),m=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${m}`))return;const h=document.createElement("link");if(h.rel=f?"stylesheet":Wi,f||(h.as="script"),h.crossOrigin="",h.href=u,d&&h.setAttribute("nonce",d),document.head.appendChild(h),f)return new Promise((b,g)=>{h.addEventListener("load",b),h.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${u}`)))})}))}function r(l){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=l,window.dispatchEvent(d),!d.defaultPrevented)throw l}return i.then(l=>{for(const d of l||[])d.status==="rejected"&&r(d.reason);return e().catch(r)})},Cn="/tapscore/".replace(/\/+$/,""),Yt=Cn+"/api",yt={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},Xi=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function En(s,e){const t={};for(const[n,i]of Xi)if(n in s)for(const r of i)r in s||(t[r]=`var(--${n})`);return{...e,...t,...s}}const Nn=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],Ji={thin:"1px",medium:"3px",thick:"5px"};function Rn(s){const e=s.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":Ji[e.toLowerCase()]??e}function Zi(){return Nn.map(s=>{const e=Rn(yt[s]);return`@property --${s}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const On={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},zn={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},er={...zn,"done-opacity":"0.35"},tr={...On,...zn,...yt,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},sr={...On,...er,...yt,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class nr{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;Ln(e);const n=this.tracking;this.tracking=e;try{t()}finally{this.tracking=n}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const n of t)n.disposed||n.run()}}}const ce=new nr;function Ln(s){for(const e of s.deps)e.delete(s);s.deps.clear()}class p{constructor(e){this.subs=new Set,this.val=e}get(){return ce.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,ce.notify(this.subs))}update(e){this.set(e(this.val))}}class ${constructor(e){this.subs=new Set,this.val=void 0;const t=this,n={run(){ce.runTracked(n,()=>{const i=e();Object.is(t.val,i)||(t.val=i,ce.notify(t.subs))})},deps:new Set};n.run()}get(){return ce.subscribe(this.subs),this.val}peek(){return this.val}}function I(s){const e={run(){ce.runTracked(e,s)},deps:new Set};return e.run(),()=>{e.disposed=!0,Ln(e)}}function qe(s){ce.batch(s)}function U(s){return ce.untrack(s)}class ir{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const G=new ir,Le=Cn;function Qt(s){return Le?s===Le?"/":s.startsWith(Le+"/")?s.slice(Le.length):s:s}function rr(s){return Le+s}class M{constructor(){this.route=new p(Qt(location.pathname??"/")),this.search=new p(location.search??""),window.addEventListener("popstate",()=>qe(()=>{this.route.set(Qt(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const n=typeof t=="boolean"?{replace:t}:t??{},i=e.indexOf("#"),r=i>=0?e.slice(i):"",l=i>=0?e.slice(0,i):e,d=l.indexOf("?"),c=d>=0?l.slice(0,d):l,u=d>=0?l.slice(d+1):"",f=n.query!==void 0?or(n.query):u?"?"+u:"",m=rr(c)+f+r;(n.replace?history.replaceState:history.pushState).call(history,null,"",m),qe(()=>{this.route.set(c),this.search.set(f)})}back(){history.back()}link(e,t="active"){const n=e.split("#")[0].split("?")[0];return{onclick:i=>{i.preventDefault(),this.navigate(e)},className:()=>{const i=this.route.get();return i===n||i.startsWith(n+"/")?t:""}}}params(e){const t=e.split("/");return new $(()=>{const n=this.route.get().split("/"),i={};for(const[r,l]of t.entries())l.startsWith(":")&&(i[l.slice(1)]=n[r]??"");return i})}query(e){return new $(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new $(()=>{const e={};for(const[t,n]of new URLSearchParams(this.search.get()))e[t]=n;return e})}}function or(s){const e=new URLSearchParams;for(const[n,i]of Object.entries(s))i==null||i===""||e.set(n,String(i));const t=e.toString();return t?"?"+t:""}function ar(s){return e=>s[e]}const lr="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",Ps="data-basics-global";function dr(){if(document.head.querySelector(`style[${Ps}]`))return;const s=document.createElement("style");s.setAttribute(Ps,""),s.textContent=Zi()+lr,document.head.appendChild(s)}function cr(s,e){dr();const t=new Set(Nn),n=(r,l,d)=>{const c=Object.entries(r).map(([u,f])=>`--${u}:${t.has(u)?Rn(f):f}`).join(";");return`${l}{color-scheme:${d};${c}}`},i=document.createElement("style");return i.textContent=n(s,'[data-theme="light"]',"light")+n(e,'[data-theme="dark"]',"dark"),document.head.appendChild(i),r=>`var(--${r})`}const Cs="basics-js-theme";class ur{constructor(){this.dark=new p(!1);const e=localStorage.getItem(Cs),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),I(()=>{const n=this.dark.get();document.documentElement.setAttribute("data-theme",n?"dark":"light"),localStorage.setItem(Cs,n?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function _(s){const e=document.createElement("template");return e.innerHTML=s,e}function hr(s,e){let t;for(const n of Object.keys(e))s.startsWith(n+"/")&&(!t||n.length>t.length)&&(t=n);return t?e[t]:void 0}const Es=new Set;class E{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!Es.has(t)){Es.add(t);const n=document.createElement("style");n.textContent=t.styles,document.head.appendChild(n)}}onMount(){}onDestroy(){}inject(e){return G.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...n){const i=U(()=>{const r=new e(n[0]);return r.mount(t),r});return this.children.push(i),i}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){U(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,n){const i=n??(l=>this.track(l)),r=e.content.cloneNode(!0);for(const l of r.querySelectorAll("[bind]")){const d=t[l.getAttribute("bind")];if(d)if(typeof d=="function")i(I(()=>{const c=d();l instanceof HTMLInputElement||l instanceof HTMLTextAreaElement?l.value=String(c):l.textContent=String(c)}));else for(const[c,u]of Object.entries(d)){const f=c.includes("-");c.startsWith("on")&&typeof u=="function"?l.addEventListener(c.slice(2),u):typeof u=="function"?i(I(()=>{const m=u();f?l.setAttribute(c,String(m)):l[c]=m})):f?l.setAttribute(c,String(u)):l[c]=u}}return r}wireEl(e,t,n){return this.wire(e,t,n).firstElementChild}slot(e,t){const n=this.props[e];if(n==null)return!1;const i=this.ref(t,e);return i?(typeof n=="string"?i.textContent=n:typeof n=="function"&&n.prototype instanceof E?this.spawn(n,i):typeof n=="function"&&n(i,{spawn:(r,l,...d)=>this.spawn(r,l,...d),track:r=>this.track(r)}),!0):!1}$each(e,t,n,i=(r,l)=>l){const r=typeof t=="function"?t:()=>t.get(),l=new Map,d=new Map;this.track(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),this.track(I(()=>{const c=r(),u=new Map;for(const[m,h]of c.entries()){const b=i(h,m);if(l.has(b))u.set(b,l.get(b));else{const g=[];u.set(b,U(()=>n(h,m,x=>g.push(x)))),d.set(b,g)}}for(const[m,h]of l)u.has(m)||(h.remove(),U(()=>d.get(m)?.forEach(b=>b())),d.delete(m));let f=e.firstChild;for(const m of u.values())m===f?f=f.nextSibling:e.insertBefore(m,f);l.clear();for(const[m,h]of u)l.set(m,h)}))}$condition(e,t,n,i){let r=null;this.track(I(()=>{r&&(r.remove(),r=null);const l=t.get();r=U(()=>l?n():i?.()??null),r&&e.appendChild(r)}))}$swap(e,t,n,i){let r=null;this.track(I(()=>{if(r){const c=r;r=null,U(()=>c.destroy())}e.textContent="";const l=t.get(),d=n[l]??hr(l,n)??i;d&&(r=U(()=>{const c=new d;return c.mount(e),c}))})),this.track(()=>r?.destroy())}}const pt=new Set;function pr(s){return pt.add(s),()=>pt.delete(s)}function fr(){for(const s of Array.from(pt)){pt.delete(s);try{s()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function mr(s,e,t){const n=document.querySelector(e);n.textContent="";const i=G.get(M);let r=null,l=!1,d=null,c=!!t?.hot?.data.hmr;const u=async f=>{r&&(r.destroy(),r=null,n.textContent=""),f?(d||(d=(await Qi(()=>import("./obs-shell.component-C-pel8Ew.js"),[])).ObsShellComponent),r=U(()=>new d)):(!c&&t?.onInit&&(await t.onInit(),c=!0),r=U(()=>new s)),U(()=>r.mount(n)),l=f};await u(Qt(location.pathname).startsWith("/_obs")),I(()=>{const f=i.route.get().startsWith("/_obs");f!==l&&u(f)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{r?.destroy()}catch(f){console.error("[startApp] the root component threw while disposing",f)}if(r=null,fr(),t.onDispose)try{t.onDispose()}catch(f){console.error("[startApp] onDispose threw",f)}}),t.hot.accept())}class K extends Error{constructor(e,t,n,i){super(t),this.status=e,this.details=n,this.traceId=i,this.name="ApiError"}}const gr=10,dt=[];let ct=[],De=null;function br(s){dt.push(s),dt.length>gr&&dt.shift()}function Hn(s,e,t){const n={code:s,message:e,url:typeof location<"u"?location.href:"",context:[...dt],timestamp:new Date().toISOString()};t!==void 0&&(n.traceId=t),ct.push(n),_r()}function _r(){De||(De=setTimeout(An,5e3))}function An(){if(De&&(clearTimeout(De),De=null),ct.length===0)return;const s=ct;ct=[];for(const e of s){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${Yt}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${Yt}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&An()});const yr=3e4,vr=2,tt=new Map,Mn=new WeakMap;function wr(s){if(s instanceof K)return s.traceId;if(s!=null&&typeof s=="object")return Mn.get(s)}async function y(s){if(s.method==="GET"){const e=tt.get(s.url);if(e)return e;const t=Ns(s,vr);return tt.set(s.url,t),t.then(()=>tt.delete(s.url),()=>tt.delete(s.url)),t}return Ns(s,0)}async function Ns(s,e){const t=s.timeout??yr;let n;for(let i=0;i<=e;i++){const r=crypto.randomUUID();try{return await $r(xr(s,r),t)}catch(l){if(n=l,!(l instanceof K)&&l!=null&&typeof l=="object"&&Mn.set(l,r),l instanceof K||i===e)break;await new Promise(d=>setTimeout(d,1e3*2**i))}}throw n}async function xr(s,e){const t={"X-Trace-Id":e},n={method:s.method,headers:t};s.body!==void 0&&(t["Content-Type"]="application/json",n.body=JSON.stringify(s.body));const i=await fetch(s.url,n),r=i.headers.get("x-trace-id")??e;if(br({type:"api",detail:`${s.method} ${s.url}`,timestamp:new Date().toISOString()}),!i.ok){const l=await i.json().catch(()=>({error:i.statusText}));throw new K(i.status,l.error??i.statusText,l.details,r)}return i.json()}function $r(s,e){let t;const n=new Promise((i,r)=>{t=setTimeout(()=>r(new Error("Request timeout")),e)});return Promise.race([s,n]).finally(()=>clearTimeout(t))}const Xt=new Set;let Et=!1;function kr(s){return Xt.add(s),()=>{Xt.delete(s)}}function Fn(){if(!Et){Et=!0;try{for(const s of[...Xt])try{s()}catch(e){try{Hn("session-listener",Sr(e))}catch{}}}finally{Et=!1}}}function Sr(s){try{if(s instanceof Error){const e=s.message;if(typeof e=="string")return e}return String(s)}catch{return"listener threw a value that could not be described"}}async function A(s,e,t,n={}){qe(()=>{s.set(!0),e.set(null)});try{const i=await t();return s.set(!1),i}catch(i){const r=Tr(i);qe(()=>{s.set(!1),e.set(r)}),Hn(r.code,r.message,wr(i)),r.code==="auth"&&n.sessionExpiry!==!1&&Fn();return}}function Tr(s){return s instanceof K?s.status===401?{code:"auth",message:"Unauthorized"}:s.status===409?{code:"conflict",message:"Data has changed — please try again"}:s.status===400?{code:"validation",message:s.message}:s.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:s instanceof Error?s.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const Nt={sessionExpiry:!1};function Ir(s){return{me:()=>y({method:"GET",url:`${s}/auth/me`}),login:e=>y({method:"POST",url:`${s}/auth/login`,body:e}),logout:()=>y({method:"POST",url:`${s}/auth/logout`,body:{}}),logoutAll:()=>y({method:"POST",url:`${s}/auth/logout-all`,body:{}})}}class j{constructor(){this.api=Ir(Yt),this.currentUser=new p(null),this.loading=new p(!1),this.error=new p(null),this.offSessionExpired=kr(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=pr(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await A(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const n=await A(this.loading,this.error,()=>this.api.login({username:e,password:t}),Nt);return n?(this.currentUser.set(n),!0):!1}async logout(){await A(this.loading,this.error,()=>this.api.logout(),Nt);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}async logoutEverywhere(){const e=await A(this.loading,this.error,()=>this.api.logoutAll(),Nt),t=this.error.get();return(!t||t.code==="auth")&&this.currentUser.set(null),e?.revoked??null}}const jn={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},Pr={...jn,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},Cr={...jn,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"},Er=En(Pr,tr),Nr=En(Cr,sr),a=cr(Er,Nr),R=s=>`var(--${s})`,S=(s,e)=>`var(--${s}, ${e})`,T=s=>{const e=yt[s];if(e===void 0)throw new Error(`unknown control token: --${s}`);return e},o=ar({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),st=s=>`
    background: ${S(`btn-${s}-bg`,T(`btn-${s}-bg`))};
    color: ${S(`btn-${s}-fg`,T(`btn-${s}-fg`))};
    border-color: ${S(`btn-${s}-border`,T(`btn-${s}-border`))};
    box-shadow: ${S(`btn-${s}-shadow`,T(`btn-${s}-shadow`))};
    &:hover {
        background: ${S(`btn-${s}-bg-hover`,T(`btn-${s}-bg-hover`))};
        color: ${S(`btn-${s}-fg-hover`,T(`btn-${s}-fg-hover`))};
        border-color: ${S(`btn-${s}-border-hover`,T(`btn-${s}-border-hover`))};
    }`,Dn=`
    background: ${S("btn-disabled-bg",T("btn-disabled-bg"))};
    color: ${S("btn-disabled-fg",T("btn-disabled-fg"))};
    border-color: ${S("btn-disabled-border",T("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${S("btn-disabled-opacity",T("btn-disabled-opacity"))};
    cursor: not-allowed;`,Rr={primary:st("primary"),secondary:st("secondary"),ghost:st("ghost"),danger:st("danger"),disabled:Dn},w=(s=S("btn-radius",T("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${S("btn-border-width",T("btn-border-width"))} solid transparent;
    border-radius: ${s};
    padding: ${S("btn-padding-y",T("btn-padding-y"))} ${S("btn-padding-x",T("btn-padding-x"))};
    font-family: ${R("font-ui")};
    font-size: ${S("btn-font-size",T("btn-font-size"))};
    line-height: ${S("btn-line-height",T("btn-line-height"))};
    font-weight: ${S("btn-font-weight",T("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${R("dur-fast")} ${R("ease-standard")},
        border-color ${R("dur-fast")} ${R("ease-standard")},
        color ${R("dur-fast")} ${R("ease-standard")},
        box-shadow ${R("dur-fast")} ${R("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${S("btn-focus-ring-width",T("btn-focus-ring-width"))} ${S("btn-focus-ring",T("btn-focus-ring"))};
    }
    ${Rr[e]}
    &:disabled {${Dn}}
`,Or=`max(${S("field-border-width",T("field-border-width"))}, ${S("field-rule-width",T("field-rule-width"))})`,nt=(s,e)=>`
    border-top-color: ${s};
    border-right-color: ${s};
    border-left-color: ${s};
    border-bottom-color: ${e};`,X=()=>`
    border-style: solid;
    border-top-width: ${S("field-border-width",T("field-border-width"))};
    border-right-width: ${S("field-border-width",T("field-border-width"))};
    border-left-width: ${S("field-border-width",T("field-border-width"))};
    border-bottom-width: ${Or};
    ${nt(S("field-border",T("field-border")),S("field-rule",T("field-rule")))}
    border-radius: ${S("field-radius",T("field-radius"))};
    padding: ${S("field-padding-y",T("field-padding-y"))} ${S("field-padding-x",T("field-padding-x"))};
    background: ${S("field-bg",T("field-bg"))};
    color: ${R("text")};
    font-family: ${R("font-ui")};
    font-size: ${S("field-font-size",T("field-font-size"))};
    line-height: ${S("field-line-height",T("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${R("dur-fast")} ${R("ease-standard")},
        box-shadow ${R("dur-fast")} ${R("ease-standard")},
        background ${R("dur-fast")} ${R("ease-standard")};
    &::placeholder { color: ${R("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${nt(S("field-focus-border",T("field-focus-border")),S("field-focus-border",T("field-focus-border")))}
        background: ${S("field-bg-focus",T("field-bg-focus"))};
        box-shadow: 0 0 0 ${S("field-focus-ring-width",T("field-focus-ring-width"))} ${S("field-focus-ring",T("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${nt(S("field-invalid-border",T("field-invalid-border")),S("field-invalid-rule",T("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${nt(S("field-invalid-border",T("field-invalid-border")),S("field-invalid-rule",T("field-invalid-rule")))}
        background: ${S("field-bg-focus",T("field-bg-focus"))};
        box-shadow: 0 0 0 ${S("field-focus-ring-width",T("field-focus-ring-width"))} ${S("field-invalid-ring",T("field-invalid-ring"))};
    }
`,zr=()=>`
    display: block;
    font-family: ${R("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${R("text-muted")};
`,C=s=>`
    background: ${R("surface")};
    border: 1px solid ${R("border")};
    border-radius: ${R("radius-md")};
    box-shadow: ${R("shadow-1")};
    ${s?.hover?`
    transition:
        box-shadow ${R("dur-base")} ${R("ease-standard")},
        border-color ${R("dur-base")} ${R("ease-standard")};
    &:hover { box-shadow: ${R("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${zr()}
        margin: 0 0 ${o("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${R("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${R("text")};
    }
    & .ui-card__meta {
        margin: ${o("xs")} 0 0 0;
        font-family: ${R("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${R("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${o("md")};
        font-family: ${R("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${R("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;function Lr(s){return{async me(){return y({method:"GET",url:`${s}/players/me`})},async register(e){return y({method:"POST",url:`${s}/players/register`,body:e})},async updateHandicap(e){return y({method:"POST",url:`${s}/players/me/handicap`,body:e})},async confirmHandicap(){return y({method:"POST",url:`${s}/players/me/handicap/confirm`,body:{}})},async myHandicapHistory(){return y({method:"GET",url:`${s}/players/me/handicap-history`})},async updateProfile(e){return y({method:"POST",url:`${s}/players/me/profile`,body:e})},async search(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/players/search${n?"?"+n:""}`})}}}function Hr(s){return{async list(){return y({method:"GET",url:`${s}/friends`})},async add(e){return y({method:"POST",url:`${s}/friends`,body:e})},async remove(e){return y({method:"DELETE",url:`${s}/friends/${e.friendId}`})}}}function Ar(s){return{async list(){return y({method:"GET",url:`${s}/clubs`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/clubs/get${n?"?"+n:""}`})},async create(e){return y({method:"POST",url:`${s}/clubs`,body:e})},async update(e){return y({method:"POST",url:`${s}/clubs/update`,body:e})},async remove(e){return y({method:"DELETE",url:`${s}/clubs/${e.id}`})}}}function Mr(s){return{async list(){return y({method:"GET",url:`${s}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/courses/by-club${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/courses/get${n?"?"+n:""}`})},async create(e){return y({method:"POST",url:`${s}/courses`,body:e})},async update(e){return y({method:"POST",url:`${s}/courses/update`,body:e})},async updateHole(e){return y({method:"POST",url:`${s}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/courses/validate${n?"?"+n:""}`})},async remove(e){return y({method:"DELETE",url:`${s}/courses/${e.id}`})}}}function Fr(s){return{async listByCourse(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/tees/by-course${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/tees/get${n?"?"+n:""}`})},async create(e){return y({method:"POST",url:`${s}/tees`,body:e})},async update(e){return y({method:"POST",url:`${s}/tees/update`,body:e})},async remove(e){return y({method:"DELETE",url:`${s}/tees/${e.id}`})}}}function jr(s){return{async create(e){return y({method:"POST",url:`${s}/guest-players`,body:e})}}}function Dr(s){return{async latest(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/handicap/latest${n?"?"+n:""}`})},async history(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/handicap/history${n?"?"+n:""}`})},async record(e){return y({method:"POST",url:`${s}/handicap/record`,body:e})}}}function Br(s){return{async list(){return y({method:"GET",url:`${s}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/rounds/balls${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/rounds/get${n?"?"+n:""}`})},async create(e){return y({method:"POST",url:`${s}/rounds`,body:e})},async createFromDraft(e){return y({method:"POST",url:`${s}/rounds/from-draft`,body:e})},async update(e){return y({method:"POST",url:`${s}/rounds/update`,body:e})},async remove(e){return y({method:"DELETE",url:`${s}/rounds/${e.id}`})}}}function Gr(s){return{async listByRound(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/score-events/by-round${n?"?"+n:""}`})},async append(e){return y({method:"POST",url:`${s}/score-events`,body:e})}}}function qr(s){return{async forBall(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/scorecards/for-ball${n?"?"+n:""}`})},async forRound(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/scorecards/for-round${n?"?"+n:""}`})}}}function Vr(s){return{async forRound(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/leaderboards/for-round${n?"?"+n:""}`})}}}function Ur(s){return{async create(e){return y({method:"POST",url:`${s}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/by-token${n?"?"+n:""}`})},async balls(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/balls${n?"?"+n:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/scorecard${n?"?"+n:""}`})},async result(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/result${n?"?"+n:""}`})},async score(e){return y({method:"POST",url:`${s}/friendly-rounds/score`,body:e})},async setup(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/setup${n?"?"+n:""}`})},async editSetup(e){return y({method:"POST",url:`${s}/friendly-rounds/setup`,body:e})},async remove(e){return y({method:"DELETE",url:`${s}/friendly-rounds/${e.token}`})},async finish(e){return y({method:"POST",url:`${s}/friendly-rounds/finish`,body:e})},async reopen(e){return y({method:"POST",url:`${s}/friendly-rounds/reopen`,body:e})},async setVisibility(e){return y({method:"POST",url:`${s}/friendly-rounds/visibility`,body:e})},async join(e){return y({method:"POST",url:`${s}/friendly-rounds/join`,body:e})},async leave(e){return y({method:"POST",url:`${s}/friendly-rounds/leave`,body:e})},async claimGuest(e){return y({method:"POST",url:`${s}/friendly-rounds/claim-guest`,body:e})},async renameGuest(e){return y({method:"POST",url:`${s}/friendly-rounds/rename-guest`,body:e})},async claimSeat(e){return y({method:"POST",url:`${s}/friendly-rounds/claim-seat`,body:e})},async releaseSeat(e){return y({method:"POST",url:`${s}/friendly-rounds/release-seat`,body:e})}}}function Kr(s){return{async myRounds(){return y({method:"GET",url:`${s}/dashboard/my-rounds`})},async friendsActivity(){return y({method:"GET",url:`${s}/dashboard/friends-activity`})}}}function Wr(s){return{async clubs(){return y({method:"GET",url:`${s}/setup/clubs`})},async courses(){return y({method:"GET",url:`${s}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/setup/tees/by-course${n?"?"+n:""}`})},async formats(){return y({method:"GET",url:`${s}/setup/formats`})},async aggregations(){return y({method:"GET",url:`${s}/setup/aggregations`})}}}function Yr(s){return{async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/competitions/get${n?"?"+n:""}`})},async participants(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/competitions/participants${n?"?"+n:""}`})},async leaderboard(e){const t=new Set(["id"]),n=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&n.set(r,String(l));const i=n.toString();return y({method:"GET",url:`${s}/competitions/${e.id}/leaderboard${i?"?"+i:""}`})},async results(e){const t=new Set(["id"]),n=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&n.set(r,String(l));const i=n.toString();return y({method:"GET",url:`${s}/competitions/${e.id}/results${i?"?"+i:""}`})},async list(){return y({method:"GET",url:`${s}/competitions`})},async create(e){return y({method:"POST",url:`${s}/competitions`,body:e})},async update(e){return y({method:"POST",url:`${s}/competitions/update`,body:e})},async transition(e){return y({method:"POST",url:`${s}/competitions/transition`,body:e})},async createRound(e){const t=new Set(["id"]),n={};for(const[i,r]of Object.entries(e))t.has(i)||(n[i]=r);return y({method:"POST",url:`${s}/competitions/${e.id}/rounds`,body:n})},async applyCut(e){const t=new Set(["id"]),n={};for(const[i,r]of Object.entries(e))t.has(i)||(n[i]=r);return y({method:"POST",url:`${s}/competitions/${e.id}/cut`,body:n})},async finalize(e){const t=new Set(["id"]),n={};for(const[i,r]of Object.entries(e))t.has(i)||(n[i]=r);return y({method:"POST",url:`${s}/competitions/${e.id}/finalize`,body:n})},async addParticipant(e){return y({method:"POST",url:`${s}/competitions/participants/add`,body:e})},async removeParticipant(e){return y({method:"POST",url:`${s}/competitions/participants/remove`,body:e})},async withdrawParticipant(e){return y({method:"POST",url:`${s}/competitions/participants/withdraw`,body:e})}}}function Qr(s){return{async myRoles(){return y({method:"GET",url:`${s}/me/roles`})},async adminStats(){return y({method:"GET",url:`${s}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/admin/rounds${n?"?"+n:""}`})},async adminPlayers(){return y({method:"GET",url:`${s}/admin/players`})},async adminGrantRole(e){return y({method:"POST",url:`${s}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return y({method:"POST",url:`${s}/admin/roles/revoke`,body:e})}}}function Xr(s){return{async myConfig(){return y({method:"GET",url:`${s}/players/me/stats-config`})},async putMyConfig(e){return y({method:"PUT",url:`${s}/players/me/stats-config`,body:e})},async myStats(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/players/me/stats${n?"?"+n:""}`})},async myRoundStats(e){const t=new Set(["roundId"]),n=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&n.set(r,String(l));const i=n.toString();return y({method:"GET",url:`${s}/players/me/rounds/${e.roundId}/stats${i?"?"+i:""}`})},async appendEvents(e){return y({method:"POST",url:`${s}/friendly-rounds/stat-events`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/stats${n?"?"+n:""}`})},async configsByToken(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return y({method:"GET",url:`${s}/friendly-rounds/stats-configs${n?"?"+n:""}`})}}}function Jr(s){return{async profile(e){const t=new Set(["playerId"]),n=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&n.set(r,String(l));const i=n.toString();return y({method:"GET",url:`${s}/friends/${e.playerId}/profile${i?"?"+i:""}`})},async rounds(e){const t=new Set(["playerId"]),n=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&n.set(r,String(l));const i=n.toString();return y({method:"GET",url:`${s}/friends/${e.playerId}/rounds${i?"?"+i:""}`})},async courses(e){const t=new Set(["playerId"]),n=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&n.set(r,String(l));const i=n.toString();return y({method:"GET",url:`${s}/friends/${e.playerId}/courses${i?"?"+i:""}`})}}}function Zr(s){return{async round(e){const t=new Set(["roundId"]),n=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&n.set(r,String(l));const i=n.toString();return y({method:"GET",url:`${s}/spectate/rounds/${e.roundId}${i?"?"+i:""}`})}}}const F="/tapscore/".replace(/\/+$/,"")+"/api",v={players:Lr(F),friends:Hr(F),clubs:Ar(F),courses:Mr(F),tees:Fr(F),guestPlayers:jr(F),handicap:Dr(F),rounds:Br(F),scoreEvents:Gr(F),scorecards:qr(F),leaderboards:Vr(F),friendlyRounds:Ur(F),dashboard:Kr(F),setup:Wr(F),competitions:Yr(F),admin:Qr(F),playerStats:Xr(F),friendProfile:Jr(F),spectate:Zr(F)};function eo(s){return[...s.played?["Played"]:[],...s.created?["Created"]:[]].join(" · ")}function to(s,e){const t=new Map;for(const n of e)t.set(n.round.id,{round:n.round,token:n.friendlyRound.shareToken,played:!1,created:!0});for(const n of s){const i=t.get(n.round.id);i?i.played=!0:t.set(n.round.id,{round:n.round,token:n.shareToken,played:!0,created:!1})}return[...t.values()].sort((n,i)=>i.round.date.localeCompare(n.round.date)||n.round.id.localeCompare(i.round.id))}function so(s,e){return s.filter(t=>t.played&&!t.created&&!e.has(t.round.id)).slice().sort((t,n)=>n.round.date.localeCompare(t.round.date)||t.round.id.localeCompare(n.round.id))}function Rs(s,e){return s.some(t=>t.round.id===e)?s.filter(t=>t.round.id!==e):s}function W(){try{return globalThis.localStorage??null}catch{return null}}function Xe(s,e,t){return{read(n=W()){if(!n)return e.empty;let i;try{i=n.getItem(s)}catch{return e.empty}if(!i)return e.empty;try{return e.decode(i)}catch{return e.empty}},write(n,i=W()){if(!i)return e.empty;const r=t!==void 0&&Array.isArray(n)?n.slice(0,t):n;try{i.setItem(s,e.encode(r))}catch{}return r}}}function os(s){return{decode(e){const t=JSON.parse(e);return Array.isArray(t)?t.filter(s):[]},encode:e=>JSON.stringify(e),get empty(){return[]}}}const no=500,as=Xe("tapscore.seen-rounds.v1",os(s=>typeof s=="string"),no);function vt(s=W()){return as.read(s)}function Rt(s=W()){return new Set(vt(s))}function io(s,e=W()){return vt(e).includes(s)}function ro(s,e=W()){if(!e)return[];const t=vt(e).filter(n=>n!==s);return as.write([s,...t],e)}function Bn(s,e=W()){if(!e)return[];const t=vt(e),n=t.filter(i=>i!==s);return n.length!==t.length&&as.write(n,e),n}const oo=50,ls=Xe("tapscore.device-rounds.v1",os(ao),oo);function wt(s=W()){return ls.read(s)}function ao(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.courseName=="string"&&(e.status==="not_started"||e.status==="active"||e.status==="complete")&&typeof e.lastSeenAt=="string"}function He(s,e=W()){if(!e)return[];const t=wt(e).filter(n=>n.token!==s.token);return ls.write([s,...t],e)}function Gn(s,e=W()){if(!e)return[];const t=wt(e),n=t.filter(i=>i.token!==s);return n.length!==t.length&&ls.write(n,e),n}class xt{mine=new p(null);mineLoading=new p(!1);mineError=new p(null);myRounds=new $(()=>{const e=this.mine.get();return e?to(e.produced,e.created):[]});deviceRounds=new p([]);seenIds=new p(Rt());newRounds=new $(()=>so(this.myRounds.get(),this.seenIds.get()));async loadMine(){this.seenIds.set(Rt());const e=await A(this.mineLoading,this.mineError,()=>v.dashboard.myRounds());e&&this.mine.set(e)}loadDevice(){this.deviceRounds.set(wt())}clear(){this.mine.set(null),this.mineError.set(null),this.mineLoading.set(!1),this.seenIds.set(Rt()),this.loadDevice()}async remove(e,t){try{await v.friendlyRounds.remove({token:e})}catch{return!1}const n=this.mine.get();return n&&this.mine.set({produced:Rs(n.produced,t),created:Rs(n.created,t)}),this.deviceRounds.set(Gn(e)),Bn(t),!0}}const lo={DEV:!1};function co(s,e){return s===void 0||s===""?e:s!=="0"&&s.toLowerCase()!=="false"}const Os=lo??{},qn={competitions:co(Os.VITE_FEATURE_COMPETITIONS,!!Os.DEV)},uo='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v10h12V10"/><path d="M10 20v-5.5h4V20"/></svg>',ho='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M3.5 20c.5-3.5 2.7-5.5 5.5-5.5s5 2 5.5 5.5"/><circle cx="16.5" cy="9.5" r="2.8"/><path d="M16.8 14.6c2.2.4 3.5 2 3.9 4.9"/></svg>',po='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v3a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5v2a3 3 0 0 0 3 3"/><path d="M16 5h3v2a3 3 0 0 1-3 3"/><path d="M10 12.5V15h4v-2.5"/><path d="M9 20h6"/><path d="M12 15v5"/></svg>';function fo(s){const e=[{key:"home",label:"Home",href:"/",icon:uo},{key:"friends",label:"Friends",href:"/friends",icon:ho}];return s.competitions&&e.push({key:"comps",label:"Comps",href:"/competitions",icon:po}),e}const mo=["/login","/round"];function Vn(s){return!mo.includes(s)}function go(s,e){return e&&Vn(s)}const bo=_(`
    <nav class="tabbar" bind="root"></nav>
`),_o=_(`
    <a bind="link">
        <span class="tabbar__icon">
            <span bind="icon" class="tabbar__glyph"></span>
            <span bind="badge" class="tabbar__badge"></span>
        </span>
        <span bind="label"></span>
    </a>
`);class yo extends E{static styles=`
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
                padding: ${o("sm")} 0 ${o("md")};
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
    `;router=this.inject(M);auth=this.inject(j);landing=this.inject(xt);newCount=new $(()=>this.auth.currentUser.get()?this.landing.newRounds.get().length:0);render(){const e=this.wire(bo,{root:{className:()=>go(this.router.route.get(),this.auth.currentUser.get()!==null)?"tabbar":"tabbar hidden"}}),t=fo(qn);return this.$each(this.ref(e,"root"),()=>t,(n,i,r)=>this.wireEl(_o,{link:{...this.router.link(n.href),href:n.href},icon:{innerHTML:()=>n.icon},label:()=>n.label,badge:{textContent:()=>{if(n.key!=="home")return"";const l=this.newCount.get();return l===0?"":String(l)},className:()=>(n.key==="home"?this.newCount.get():0)===0?"tabbar__badge":"tabbar__badge show"}},r),n=>n.key),e}}const Un=["tee","approach","putting","shortGame","penalties","recovery"],ut={enabled:!1,tee:!1,approach:!1,putting:!1,shortGame:!1,penalties:!1,recovery:!1};function Kn(s){switch(s){case"tee":return"Tee shots";case"approach":return"Greens in regulation";case"putting":return"Putting";case"shortGame":return"Short game";case"penalties":return"Penalties";case"recovery":return"Recovery"}}function vo(s){switch(s){case"tee":return"Fairway, in play or trouble — asked on par 4s and 5s.";case"approach":return"Did the ball hit the green in regulation.";case"putting":return"How long the first putt was, and how many you took.";case"shortGame":return"Standard or hard, asked only when you missed the green.";case"penalties":return"How many penalty strokes the hole cost you.";case"recovery":return"Whether the recovery shot got you back in play."}}const wo="Track statistics",xo="Adds a few taps per hole while you score — turn it off any time, your picks are kept.";function Wn(s){switch(s){case"shortGame":return"putting";case"recovery":return"tee";default:return null}}function ft(s,e){return s[e]}function $o(s,e){if(!s.enabled)return!0;const t=Wn(e);return t===null?!1:!ft(s,t)}function ko(s,e){if(!s.enabled)return null;const t=Wn(e);return t===null||ft(s,t)?null:`Needs ${Kn(t)}`}function So(s,e,t){return Io({...s,[e]:t})}function To(s,e){return{...s,enabled:e}}function Io(s){const e={...s};return e.putting||(e.shortGame=!1),e.tee||(e.recovery=!1),e}function Ot(s){const e={...ut,enabled:s.enabled};for(const t of Un)e[t]=s[t];return e}function Po(s){return s.avatarVersion?`${F}/players/${encodeURIComponent(s.id)}/avatar?v=${s.avatarVersion}`:null}function Co(s,e){const t=(s??"").trim().split(/\s+/).filter(i=>i.length>0);if(t.length>=2)return(it(t[0])+it(t[t.length-1])).toUpperCase();if(t.length===1)return it(t[0]).toUpperCase();const n=(e??"").trim();return n.length>0?it(n).toUpperCase():"•"}function it(s){return[...s][0]??""}const rt=512,Eo=2*1024*1024;function No(s,e){const t=Math.min(s,e);return{sx:Math.round((s-t)/2),sy:Math.round((e-t)/2),size:t}}const Ro=.85;class Ae extends Error{}async function Oo(s){let e;try{e=await createImageBitmap(s)}catch{throw new Ae("That image could not be read. Try a JPEG or PNG.")}try{const{sx:t,sy:n,size:i}=No(e.width,e.height),r=document.createElement("canvas");r.width=rt,r.height=rt;const l=r.getContext("2d");if(!l)throw new Ae("This browser cannot process images.");l.drawImage(e,t,n,i,i,0,0,rt,rt);const d=await new Promise(c=>r.toBlob(c,"image/jpeg",Ro));if(!d)throw new Ae("That image could not be processed.");if(d.size>Eo)throw new Ae("That image is too large.");return d}finally{e.close()}}async function zo(s){const e=await fetch(`${F}/players/me/avatar`,{method:"PUT",headers:{"Content-Type":s.type||"application/octet-stream"},body:s});if(!e.ok)throw await Yn(e);return await e.json()}async function Lo(){const s=await fetch(`${F}/players/me/avatar`,{method:"DELETE"});if(!s.ok)throw await Yn(s)}async function Yn(s){const e=await s.json().catch(()=>({})),t=s.status===413?400:s.status;return new K(t,Ho(e.error,s.status))}function Ho(s,e){return s==="too_large"||e===413?"That image is too large.":s==="unsupported_type"?"That file is not a JPEG, PNG or WebP image.":s==="empty"?"That image was empty.":s??"Photo upload failed."}class Je{loading=new p(!1);error=new p(null);player=new p(null);history=new p([]);clubs=new p([]);saving=new p(!1);saveError=new p(null);statsConfig=new p(ut);statsSaving=new p(!1);statsError=new p(null);hasRecordedStats=new p(!1);avatarSaving=new p(!1);avatarError=new p(null);async load(e=!1){if(!e&&(this.player.get()!==null||this.loading.get()))return;const t=await A(this.loading,this.error,()=>Promise.all([v.players.me(),v.players.myHandicapHistory(),v.clubs.list(),v.playerStats.myConfig().catch(()=>null),v.playerStats.myStats({limit:1}).catch(()=>null)]));if(!t)return;const[n,i,r,l,d]=t;this.player.set(n),this.history.set(i),this.clubs.set(r),this.statsConfig.set(l?Ot(l):ut),this.hasRecordedStats.set((d?.rounds.length??0)>0)}clear(){this.player.set(null),this.history.set([]),this.error.set(null),this.saveError.set(null),this.statsConfig.set(ut),this.statsError.set(null),this.hasRecordedStats.set(!1),this.avatarError.set(null)}async saveIndex(e){return await A(this.saving,this.saveError,()=>v.players.updateHandicap({handicapIndex:e}))?(await this.load(!0),!0):!1}async confirmHandicap(){const e=await A(this.saving,this.saveError,()=>v.players.confirmHandicap());return e?(this.player.set(e),!0):!1}async saveGender(e){const t=await A(this.saving,this.saveError,()=>v.players.updateProfile({gender:e}));return t?(this.player.set(t),!0):!1}async saveHomeClub(e){const t=await A(this.saving,this.saveError,()=>v.players.updateProfile({homeClubId:e}));return t?(this.player.set(t),!0):!1}async saveStatsConfig(e){if(this.statsSaving.get()||this.saving.get())return!1;const t=await A(this.statsSaving,this.statsError,()=>v.playerStats.putMyConfig(Ot(e)));return t?(this.statsConfig.set(Ot(t)),!0):!1}async saveAvatar(e){this.avatarError.set(null);let t;try{t=await Oo(e)}catch(i){return this.avatarError.set({code:"validation",message:i instanceof Ae?i.message:"That image could not be prepared."}),!1}const n=await A(this.avatarSaving,this.avatarError,()=>zo(t));return n?(this.patchAvatarVersion(n.avatarVersion),!0):!1}async removeAvatar(){return await A(this.avatarSaving,this.avatarError,()=>Lo().then(()=>!0))?(this.patchAvatarVersion(null),!0):!1}patchAvatarVersion(e){const t=this.player.get();t&&this.player.set({...t,avatarVersion:e})}homeClubName(){const e=this.player.get()?.homeClubId;return e?this.clubs.get().find(t=>t.id===e)?.name??null:null}}function zt(s,e){return s.displayName.localeCompare(e.displayName,"sv",{sensitivity:"base"})}function ds(s,e="frecency"){return e==="alpha"?[...s].sort(zt):[...s].sort((t,n)=>{const i=t.frecency,r=n.frecency,l=i>0,d=r>0;if(l!==d)return l?-1:1;if(!l)return zt(t,n);if(r!==i)return r-i;const c=t.lastPlayedAt?Date.parse(t.lastPlayedAt):NaN,u=n.lastPlayedAt?Date.parse(n.lastPlayedAt):NaN,f=Number.isNaN(c)?Number.NEGATIVE_INFINITY:c,m=Number.isNaN(u)?Number.NEGATIVE_INFINITY:u;return m!==f?m-f:zt(t,n)})}const Ao=1440*60*1e3;function Mo(s,e){if(!s)return null;const t=Date.parse(s),n=Date.parse(e);if(Number.isNaN(t)||Number.isNaN(n))return null;const i=Math.floor((n-t)/Ao);if(i<=0)return"today";if(i===1)return"yesterday";if(i<7)return`${i} days ago`;if(i<14)return"last week";if(i<30)return`${Math.floor(i/7)} weeks ago`;if(i<60)return"last month";if(i<365)return`${Math.floor(i/30)} months ago`;const r=Math.floor(i/365);return r===1?"last year":`${r} years ago`}function Fo(s,e){if(s.sharedRoundCount<=0)return"never played";const t=Mo(s.lastPlayedAt,e),n=`played ${s.sharedRoundCount}×`;return t?`${n}, ${t}`:n}const Qn=2;function zs(s){return s.trim().length>=Qn}function Xn(s){return ds(s,"frecency")}function jo(s,e){return Xn([...s.filter(t=>t.id!==e.id),e])}function Do(s,e){return s.filter(t=>t.id!==e)}function Ls(s,e,t){return s.map(n=>n.id===e?{...n,isFriend:t}:n)}function Bo(s,e,t=()=>{},n=300){let i=0,r;return l=>{const d=l.trim(),c=++i;if(r!==void 0&&clearTimeout(r),r=void 0,d.length<Qn){e(d,[]);return}r=setTimeout(()=>{s(d).then(u=>{c===i&&e(d,u)},u=>{c===i&&t(d,u)})},n)}}const Jn=Xe("tapscore.friends.sort.v1",{decode:s=>s==="alpha"?"alpha":"frecency",encode:s=>s,empty:"frecency"});function Go(s=W()){return Jn.read(s)}function qo(s,e=W()){Jn.write(s,e)}class $t{loading=new p(!1);error=new p(null);friends=new p([]);loaded=new p(!1);sortMode=new p(Go());query=new p("");searching=new p(!1);searchError=new p(null);results=new p([]);resultsFor=new p("");mutating=new p(!1);mutateError=new p(null);runSearch=Bo(e=>v.players.search({q:e}),(e,t)=>{this.searching.set(!1),this.results.set(t),this.resultsFor.set(e)},(e,t)=>{this.searching.set(!1),this.results.set([]),this.resultsFor.set(e),this.searchError.set({code:"network",message:t instanceof Error?t.message:"Search failed. Try again."})});async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;const t=await A(this.loading,this.error,()=>v.friends.list());t&&(this.friends.set(Xn(t)),this.loaded.set(!0))}setQuery(e){this.query.set(e),this.searchError.set(null),this.searching.set(e.trim().length>=2),this.runSearch(e)}async add(e){await A(this.mutating,this.mutateError,()=>v.friends.add({friendId:e.id}))&&(this.friends.set(jo(this.friends.get(),{id:e.id,username:e.username,displayName:e.displayName,gender:e.gender,handicapIndex:e.handicapIndex,homeClubName:e.homeClubName,avatarVersion:e.avatarVersion,sharedRoundCount:0,lastPlayedAt:null,frecency:0,isMutual:!1})),this.results.set(Ls(this.results.get(),e.id,!0)))}setSortMode(e){this.sortMode.set(e),qo(e)}async remove(e){await A(this.mutating,this.mutateError,()=>v.friends.remove({friendId:e}))&&(this.friends.set(Do(this.friends.get(),e)),this.results.set(Ls(this.results.get(),e,!1)))}clear(){this.friends.set([]),this.loaded.set(!1),this.query.set(""),this.results.set([]),this.resultsFor.set(""),this.error.set(null),this.searchError.set(null),this.mutateError.set(null),this.searching.set(!1)}}class cs{feed=new p(null);loading=new p(!1);loaded=!1;async load(e=!1){if(!(!e&&(this.loaded||this.loading.get()))){this.loading.set(!0);try{this.feed.set(await v.dashboard.friendsActivity()),this.loaded=!0}catch{this.feed.set(null)}finally{this.loading.set(!1)}}}clear(){this.feed.set(null),this.loaded=!1,this.loading.set(!1)}}function Me(s,e){return s instanceof K&&s.status===401?(Fn(),"Your session expired — sign in again."):e}function mt(s){return s===0?"E":s>0?`+${s}`:`${s}`}function Vo(s){return s.holesPlayed<=0?"Teeing off":s.scoreToPar===null?`Thru ${s.holesPlayed}`:`Thru ${s.holesPlayed} · ${mt(s.scoreToPar)}`}function Zn(s){const e=s[0];if(!e)return null;const t=s.length-1;return t>0?`${e.displayName} + ${t}`:e.displayName}function ei(s){return(s.courseName??"").trim()||null}function Uo(s){const e=[];for(const t of s){const n=t.friends[0],i=Zn(t.friends);!n||!i||e.push({roundId:t.roundId,playerId:n.playerId,avatarVersion:n.avatarVersion,displayName:n.displayName,title:i,courseName:ei(t),progress:Vo(n)})}return e}function Ko(s){const e=s.courseName?` at ${s.courseName}`:"";return`${s.title}${e}, live, ${s.progress}. Watch.`}function Wo(s){const e=new Set;for(const t of s)for(const n of t.friends)e.add(n.playerId);return e.size===0?null:e.size===1?"1 friend on the course":`${e.size} friends on the course`}function Yo(s,e){if(!s)return null;for(const t of s.live){const n=t.friends.find(i=>i.playerId===e);if(n)return{roundId:t.roundId,holesPlayed:n.holesPlayed,scoreToPar:n.scoreToPar}}return null}function Qo(s){return s.holesPlayed<=0?"On the course now · Teeing off":s.scoreToPar===null?`On the course now · Thru ${s.holesPlayed}`:`On the course now · Thru ${s.holesPlayed} · ${mt(s.scoreToPar)}`}function Xo(s){const e=[];for(const t of s){const n=t.friends[0],i=Zn(t.friends);!n||!i||e.push({roundId:t.roundId,friendLabel:i,displayName:n.displayName,title:ei(t)??"A round",date:t.date})}return e}function ti(s){if(s instanceof K){if(s.status===403)return"forbidden";if(s.status===404)return"not_found"}return null}const Se={forbidden:{title:"Profile not available",message:"This profile is no longer shared with you."},not_found:{title:"Player not found",message:"This player doesn't exist anymore."}};function Jo(s){const e=(s.name??"").trim();return e||(s.courseName??"").trim()||"Round"}function Zo(s,e){const t=e(s.date),n=(s.name??"").trim(),i=(s.courseName??"").trim();return n&&i?`${t} · ${i}`:t}function ea(s){const e=s.holesPlayed;switch(s.status){case"not_started":return"Not started";case"active":return e<=0?"Teeing off":s.scoreToPar===null?`Thru ${e}`:`Thru ${e} · ${mt(s.scoreToPar)}`;case"complete":{if(e<=0)return"Finished";const t=e<s.holeCount?`Thru ${e}`:"Finished";return s.scoreToPar===null?t:`${t} · ${mt(s.scoreToPar)}`}}}function ta(s,e){const t=[];s!==null&&t.push(`Hcp ${s.toFixed(1)}`);const n=(e??"").trim();return n&&t.push(n),t.length>0?t.join(" · "):null}function sa(s,e){return`${s.roundsPlayed===1?"1 round":`${s.roundsPlayed} rounds`} · last played ${e(s.lastPlayedAt)}`}function na(s){return s===1?"1 course played":`${s} courses played`}const Lt={rounds:[],nextCursor:null,hasMore:!1};function Hs(s,e){const t=new Set(s.rounds.map(n=>n.roundId));return{rounds:[...s.rounds,...e.rounds.filter(n=>!t.has(n.roundId))],nextCursor:e.nextCursor,hasMore:e.hasMore}}function si(s){return s.hasMore&&s.nextCursor!==null}class kt{playerId=new p(null);unavailable=new p(null);profile=new p(null);profileLoading=new p(!1);profileError=new p(null);profileLoaded=!1;rounds=new p(Lt);roundsLoaded=new p(!1);roundsLoading=new p(!1);loadingMore=new p(!1);roundsError=new p(null);roundsGeneration=0;courses=new p([]);coursesHasMore=new p(!1);coursesLoaded=new p(!1);coursesLoading=new p(!1);coursesError=new p(null);setPlayer(e){this.playerId.get()!==e&&(this.playerId.set(e),this.resetData())}async loadProfile(e=!1){const t=this.playerId.get();if(t&&!(!e&&(this.profileLoaded||this.profileLoading.get()))){this.profileLoading.set(!0),this.profileError.set(null);try{const n=await v.friendProfile.profile({playerId:t});if(this.playerId.get()!==t)return;this.profile.set(n),this.profileLoaded=!0,this.unavailable.set(null)}catch(n){if(this.playerId.get()!==t)return;this.refuseOr(n,()=>this.profileError.set(Me(n,"Couldn't load this profile.")))}finally{this.playerId.get()===t&&this.profileLoading.set(!1)}}}async loadRounds(e=!1){const t=this.playerId.get();if(!t||!e&&(this.roundsLoaded.get()||this.roundsLoading.get()))return;this.roundsGeneration+=1;const n=this.roundsGeneration;this.roundsLoading.set(!0),this.roundsError.set(null);try{const i=await v.friendProfile.rounds({playerId:t});if(n!==this.roundsGeneration)return;this.rounds.set(Hs(Lt,i)),this.roundsLoaded.set(!0),this.unavailable.set(null)}catch(i){if(n!==this.roundsGeneration)return;this.refuseOr(i,()=>this.roundsError.set(Me(i,"Couldn't load these rounds.")))}finally{n===this.roundsGeneration&&this.roundsLoading.set(!1)}}async loadMoreRounds(){const e=this.playerId.get(),t=this.rounds.get();if(!e||!this.roundsLoaded.get()||!si(t)||this.loadingMore.get()||this.roundsLoading.get())return;const n=this.roundsGeneration;this.loadingMore.set(!0),this.roundsError.set(null);try{const i=await v.friendProfile.rounds({playerId:e,cursor:t.nextCursor??void 0});if(n!==this.roundsGeneration)return;this.rounds.set(Hs(this.rounds.get(),i))}catch(i){if(n!==this.roundsGeneration)return;this.refuseOr(i,()=>this.roundsError.set(Me(i,"Couldn't load more rounds.")))}finally{n===this.roundsGeneration&&this.loadingMore.set(!1)}}async loadCourses(e=!1){const t=this.playerId.get();if(t&&!(!e&&(this.coursesLoaded.get()||this.coursesLoading.get()))){this.coursesLoading.set(!0),this.coursesError.set(null);try{const n=await v.friendProfile.courses({playerId:t});if(this.playerId.get()!==t)return;this.courses.set(n.courses),this.coursesHasMore.set(n.hasMore),this.coursesLoaded.set(!0),this.unavailable.set(null)}catch(n){if(this.playerId.get()!==t)return;this.refuseOr(n,()=>this.coursesError.set(Me(n,"Couldn't load these courses.")))}finally{this.playerId.get()===t&&this.coursesLoading.set(!1)}}}clear(){this.playerId.set(null),this.resetData()}refuseOr(e,t){const n=ti(e);if(n){this.unavailable.set(n),this.resetData(!0);return}t()}resetData(e=!1){e||this.unavailable.set(null),this.profile.set(null),this.profileLoaded=!1,this.profileLoading.set(!1),this.profileError.set(null),this.rounds.set(Lt),this.roundsGeneration+=1,this.roundsLoaded.set(!1),this.roundsLoading.set(!1),this.loadingMore.set(!1),this.roundsError.set(null),this.courses.set([]),this.coursesHasMore.set(!1),this.coursesLoaded.set(!1),this.coursesLoading.set(!1),this.coursesError.set(null)}}function ni(s){return s.handicapIndex*(s.slope/113)+(s.courseRating-s.par)}function ia(s){return Math.round(ni(s))}function ra(s,e,t){const n=t;if(n<=0)return 0;if(s>=0){const c=Math.floor(s/n),u=s-c*n;return c+(e>=1&&e<=u?1:0)}const i=-s,r=Math.floor(i/n),l=i-r*n,d=r+(e>n-l?1:0);return d===0?0:-d}function oa(s){const e=typeof navigator<"u"?navigator.language:void 0;return typeof e=="string"&&e.toLowerCase().startsWith("sv")?"sv":"en"}function we(){return oa()}const ht=10;class Ve{loading=new p(!1);error=new p(null);descriptors=new p([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await A(this.loading,this.error,()=>v.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=we()){const n=typeof e=="string"?this.byId(e):e;return n?n.labels?.[t]??n.labels?.en??n.label:null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const n=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:n.teamSize?.min??2,max:n.teamSize?.max??2},...n.teamCount?{teamCount:n.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}configLabelOf(e,t=we()){return e.labels?.[t]??e.labels?.en??""}presets(e=we()){return this.descriptors.get().filter(n=>n.preset).sort((n,i)=>{const r=n.preset?.rank??Number.POSITIVE_INFINITY,l=i.preset?.rank??Number.POSITIVE_INFINITY;return r!==l?r-l:(this.labelOf(n,e)??n.id).localeCompare(this.labelOf(i,e)??i.id)})}taglineOf(e,t=we()){const i=(typeof e=="string"?this.byId(e):e)?.preset?.tagline;return i?.[t]??i?.en??""}playableShape(e){const t=e.requirements.balls;if(t.ballMode==="team")return{count:this.ballCountOf(t.slotBallCount),size:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const n=t.slotTeamGrouping??{},i=n.teamCount??{};return{count:{min:i.min??2,...i.max!==void 0?{max:i.max}:{}},size:{min:n.teamSize?.min??2,max:n.teamSize?.max??2}}}if(t.slotBallCount){const n=this.acceptsSideSubjects(e);return{count:this.ballCountOf(t.slotBallCount),size:{min:1,max:n?ht:1}}}return{count:{min:1},size:{min:1,max:1}}}ballCountOf(e){return{min:e?.min??2,...e?.max!==void 0?{max:e.max}:{}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}acceptsSideSubjects(e){const t=typeof e=="string"?this.byId(e):e;return!t||this.classify(t).kind==="team_grouping"?!1:(t.requirements.scoreEntry?.metadata?.length??0)===0}}const aa=180,As=4,la=12;function ke(s,e){return e<=0?0:Math.max(0,Math.min(e-1,s))}function da(s){const{dragDistance:e,velocity:t,itemWidth:n}=s;if(Math.abs(e)<la)return 0;const i=e+t*aa,r=Math.round(-i/n);return Math.max(-As,Math.min(As,r))}const Ms="tapscore:pending-scores:v1",ca=336*60*60*1e3,Fs=200;function ua(){try{return globalThis.localStorage??null}catch{return null}}function ha(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.ballId=="string"&&typeof e.playHoleId=="string"&&(typeof e.strokes=="number"||e.strokes===null)&&(e.eventType==="score_entered"||e.eventType==="score_cleared")&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class pa{entries=[];storage;constructor(e=ua(),t=Date.now()){this.storage=e,this.entries=this.load();const n=this.applyHygiene(t);n.length!==this.entries.length&&(this.entries=n,this.persist())}enqueue(e){const t=this.entries.findIndex(n=>n.token===e.token&&n.ballId===e.ballId&&n.playHoleId===e.playHoleId);t>=0?this.entries[t]=e:this.entries.push(e),this.entries=this.applyHygiene(e.queuedAt),this.persist()}remove(e){const t=this.entries.filter(n=>n.clientEventId!==e);t.length!==this.entries.length&&(this.entries=t,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(n=>e-n.queuedAt<=ca);return t.length>Fs?t.slice(t.length-Fs):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(Ms);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(ha):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(Ms,JSON.stringify(this.entries))}catch{}}}const le=["tee_result","recovery_ok","gir","short_game_difficulty","first_putt","putts","penalties"],fa={minPar:4},ma={tee_result:"Tee shot",recovery_ok:"Recovery",gir:"Green in regulation",short_game_difficulty:"Short game",first_putt:"First putt",putts:"Putts",penalties:"Penalties"},ga={tee_result:{kind:"segments",options:[{value:"fairway",label:"Fairway"},{value:"in_play",label:"In play"},{value:"trouble",label:"Trouble"}]},gir:{kind:"segments",options:[{value:"0",label:"Miss"},{value:"1",label:"Hit"}]},first_putt:{kind:"segments",options:[{value:"inside_1m",label:"< 1m"},{value:"1_to_2m",label:"1–2m"},{value:"2_to_4m",label:"2–4m"},{value:"4_to_8m",label:"4–8m"},{value:"over_8m",label:"> 8m"}]},short_game_difficulty:{kind:"segments",options:[{value:"standard",label:"Standard"},{value:"hard",label:"Hard"}]},recovery_ok:{kind:"segments",options:[{value:"0",label:"No"},{value:"1",label:"Yes"}]},putts:{kind:"stepper",min:0,max:3},penalties:{kind:"stepper",min:0,max:null}};function ba(s){return ma[s]}function js(s){return ga[s]}function _a(s,e){return e!==null&&s>=e?`${s}+`:`${s}`}function ii(s,e,t){return s?!(s.minPar!=null&&e<s.minPar||s.maxPar!=null&&e>s.maxPar||s.pars!=null&&!s.pars.includes(e)||s.holes!=null&&!s.holes.includes(t)):!0}class ya{modules;par;holeNumber;persistedMap;draft=new Map;constructor(e,t,n,i={},r=new Map){this.modules=e,this.par=t,this.holeNumber=n,this.persistedMap=Ds(i),this.draft=new Map(r),this.prune()}refresh(e,t){const n=this.signature();return this.modules=e,this.persistedMap=Ds(t),this.prune(),this.signature()!==n}signature(){let e="";for(const t of le)e+=`${t}:${this.visibility(t)}:${this.value(t)??""};`;return e}get prompts(){const e=[];for(const t of le)this.isVisible(t)&&e.push({key:t,label:ba(t),control:js(t)});return e}get isEmpty(){return this.prompts.length===0}visibility(e){switch(e){case"tee_result":return this.modules.tee&&ii(fa,this.par,this.holeNumber)?"visible":"unreadable";case"recovery_ok":return!this.modules.recovery||this.visibility("tee_result")!=="visible"?"unreadable":this.value("tee_result")==="trouble"?"visible":"contradicted";case"gir":return this.modules.approach?"visible":"unreadable";case"short_game_difficulty":return!this.modules.shortGame||this.visibility("gir")!=="visible"?"unreadable":this.value("gir")==="0"?"visible":"contradicted";case"first_putt":case"putts":return this.modules.putting?"visible":"unreadable";case"penalties":return this.modules.penalties?"visible":"unreadable"}}isVisible(e){return this.visibility(e)==="visible"}value(e){const t=this.draft.get(e);return t===void 0?this.persistedMap.get(e)??null:"set"in t?t.set:null}intValue(e){const t=this.value(e);if(t===null)return null;const n=Number.parseInt(t,10);return Number.isNaN(n)?null:n}isAnswered(e){return this.value(e)!==null}answer(e,t){this.isVisible(e)&&(this.record(e,t),this.prune())}step(e,t){const n=js(e);if(!this.isVisible(e)||n.kind!=="stepper")return;let i=(this.intValue(e)??n.min)+t;i<n.min&&(i=n.min),n.max!==null&&i>n.max&&(i=n.max),this.record(e,String(i)),this.prune()}record(e,t){if(t!==null){this.persistedMap.get(e)===t?this.draft.delete(e):this.draft.set(e,{set:t});return}this.persistedMap.get(e)===void 0?this.draft.delete(e):this.draft.set(e,{cleared:!0})}prune(){for(let e=0;e<le.length;e++){let t=!1;for(const n of le){const i=this.draft.get(n),r=this.visibility(n);r!=="visible"&&(r==="contradicted"?this.record(n,null):this.draft.delete(n),va(i,this.draft.get(n))||(t=!0))}if(!t)return}}get batch(){const e=[];for(const t of le){const n=this.draft.get(t);n!==void 0&&e.push({key:t,value:"set"in n?n.set:null})}return e}commitDraft(){for(const[e,t]of this.draft)"set"in t?this.persistedMap.set(e,t.set):this.persistedMap.delete(e);this.draft.clear()}}function va(s,e){return s===void 0||e===void 0?s===e:"set"in s?"set"in e&&s.set===e.set:!("set"in e)}function Ds(s){if(s instanceof Map)return new Map(s);const e=new Map;for(const t of le){const n=s[t];n!==void 0&&e.set(t,n)}return e}const Bs="tapscore:pending-stat-events:v1",wa=336*60*60*1e3,Gs=500;function xa(){try{return globalThis.localStorage??null}catch{return null}}function $a(){try{return crypto.randomUUID()}catch{return`stat-${Date.now()}-${Math.random().toString(36).slice(2)}`}}function ka(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.playHoleId=="string"&&typeof e.playerId=="string"&&typeof e.key=="string"&&le.includes(e.key)&&(typeof e.value=="string"||e.value===null)&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class Sa{entries=[];storage;makeId;constructor(e=xa(),t=Date.now(),n=$a){this.storage=e,this.makeId=n,this.entries=this.load();const i=this.applyHygiene(t);i.length!==this.entries.length&&(this.entries=i,this.persist())}enqueueBatch(e,t,n,i,r=Date.now()){if(i.length===0)return[];const l=[];for(const d of i){const c={token:e,playHoleId:t,playerId:n,key:d.key,value:d.value,clientEventId:this.makeId(),queuedAt:r},u=this.entries.findIndex(f=>f.token===e&&f.playHoleId===t&&f.playerId===n&&f.key===d.key);u>=0?this.entries[u]=c:this.entries.push(c),l.push(c)}return this.entries=this.applyHygiene(r),this.persist(),l}ack(e){if(e.length===0)return;const t=new Set(e),n=this.entries.filter(i=>!t.has(i.clientEventId));n.length!==this.entries.length&&(this.entries=n,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(n=>e-n.queuedAt<=wa);return t.length>Gs?t.slice(t.length-Gs):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(Bs);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(ka):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(Bs,JSON.stringify(this.entries))}catch{}}}const Ta=50;function Ia(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.cursor=="string"}const us=Xe("tapscore.result-cursors.v1",os(Ia),Ta);function hs(s=W()){return us.read(s)}function Pa(s,e=W()){return hs(e).find(t=>t.token===s)?.cursor??null}function Ca(s,e,t=W()){if(!t)return[];const n=hs(t).filter(i=>i.token!==s);return us.write([{token:s,cursor:e},...n],t)}function Ea(s,e=W()){if(!e)return[];const t=hs(e),n=t.filter(i=>i.token!==s);return n.length!==t.length&&us.write(n,e),n}const Na=["1st","2nd","3rd","4th","5th","6th","7th","8th"],pe=(s,e)=>`${s}|${e}`;function ps(s){return s.players.map(e=>e.displayName).join(" & ")||s.label||"Ball"}function Ra(s,e,t){return ii(s,e,t)}function Ht(s,e){return`${s.playHoleId}:${s.playerId}:${e}`}function Oa(s){const e=new Map;return s.teeResult!==null&&e.set("tee_result",s.teeResult),s.recoveryOk!==null&&e.set("recovery_ok",s.recoveryOk?"1":"0"),s.gir!==null&&e.set("gir",s.gir?"1":"0"),s.shortGameDifficulty!==null&&e.set("short_game_difficulty",s.shortGameDifficulty),s.firstPutt!==null&&e.set("first_putt",s.firstPutt),s.putts!==null&&e.set("putts",String(s.putts)),s.penalties!==null&&e.set("penalties",String(s.penalties)),e}function za(s){const e=s?.status;return typeof e!="number"||e<400||e>=500?!1:e!==401&&e!==408&&e!==429}class oe{constructor(e=new pa,t=new Sa){this.queue=e,this.statQueue=t}queue;statQueue;loading=new p(!1);error=new p(null);friendlyRound=new p(null);round=new p(null);startList=new p(null);balls=new p([]);firstOpen=new p(!1);firstOpenRoundId=null;scorecards=new p([]);cells=new p(new Map);statModules=new p(new Map);statRows=new p([]);statRev=new p(0);statRevN=0;statLocal=new Map;statConfirmedAt=new Map;statStep=null;statCell=null;statPosting=!1;result=new p(null);resultLoading=new p(!1);resultError=new p(null);resultCursor=null;holeIdx=new p(0);groupIdx=new p(0);keypadOpen=new p(!1);selectedSlot=new p(null);token=null;loadSeq=0;resultSeq=0;quietSeq=0;scorecardSeq=0;flushing=!1;pendingSlotIndex=null;async loadByToken(e,t){const n=e!==this.token;this.token=e;const i=++this.loadSeq;n&&this.resetForNewToken(t),G.get(Ve).load();const r=await A(this.loading,this.error,()=>v.friendlyRounds.byToken({token:e}));if(!r||i!==this.loadSeq||e!==this.token)return;if(this.friendlyRound.set(r.friendlyRound),this.round.set(r.round),this.startList.set(r.startList),He({token:e,courseName:r.round.courseNameSnapshot??"",name:r.round.name,date:r.round.date,status:r.round.status,completedAt:r.round.completedAt,lastSeenAt:new Date().toISOString()}),this.firstOpenRoundId!==r.round.id&&(this.firstOpenRoundId=r.round.id,this.firstOpen.set(!io(r.round.id))),G.get(j).currentUser.get()&&ro(r.round.id),this.pendingSlotIndex!==null){const m=r.round.formatSlots[this.pendingSlotIndex]?.slotDefId??null;this.pendingSlotIndex=null,m!==null&&this.selectedSlot.set(m)}const[l,d,c,u]=await Promise.all([v.friendlyRounds.balls({token:e}).catch(()=>[]),v.friendlyRounds.scorecard({token:e}).catch(()=>[]),v.playerStats.configsByToken({token:e}).catch(()=>null),v.playerStats.byToken({token:e}).catch(()=>null)]);i!==this.loadSeq||e!==this.token||(this.flushStats(),c&&this.statModules.set(new Map(c.map(f=>[f.playerId,f.modules]))),u&&(this.statRows.set(u),this.dropConfirmedStatLocals(i)),this.cells.set(new Map),this.scorecards.set(d),this.balls.set(l),await this.flushPending(),await this.flushPendingStats(),this.refreshStatStep())}deleting=new p(!1);async deleteRound(){const e=this.token;if(!e||this.deleting.get())return!1;this.deleting.set(!0);try{await v.friendlyRounds.remove({token:e}),Gn(e);const t=this.round.get()?.id;return t&&Bn(t),Ea(e),!0}catch{return!1}finally{this.deleting.set(!1)}}finishing=new p(!1);async finishRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await v.friendlyRounds.finish({token:e}),n=this.round.get();return e===this.token&&n&&(this.round.set({...n,status:t.status,completedAt:t.completedAt}),He({token:e,courseName:n.courseNameSnapshot??"",name:n.name,date:n.date,status:t.status,completedAt:t.completedAt,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async reopenRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await v.friendlyRounds.reopen({token:e}),n=this.round.get();return e===this.token&&n&&(this.round.set({...n,status:t.status,completedAt:null}),He({token:e,courseName:n.courseNameSnapshot??"",name:n.name,date:n.date,status:t.status,completedAt:null,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async loadResult(){const e=this.token;if(!e)return;const t=++this.resultSeq,n=await A(this.resultLoading,this.resultError,()=>v.friendlyRounds.result({token:e}));t!==this.resultSeq||e!==this.token||n&&(this.setResultCursor(e,n.cursor),n.unchanged||this.result.set(n.result))}async refreshScorecard(){const e=this.token;if(!e)return;const t=++this.scorecardSeq,n=this.loadSeq;let i;try{i=await v.friendlyRounds.scorecard({token:e})}catch{return}t!==this.scorecardSeq||n!==this.loadSeq||e!==this.token||this.scorecards.set(i)}async refreshRound(){const e=this.token;if(!e)return;const t=++this.quietSeq,n=this.loadSeq,i=()=>t!==this.quietSeq||n!==this.loadSeq||e!==this.token;try{const r=await v.friendlyRounds.byToken({token:e});if(i())return;this.friendlyRound.set(r.friendlyRound),this.round.set(r.round),this.startList.set(r.startList);const l=await v.friendlyRounds.balls({token:e}).catch(()=>null);if(l===null||i())return;this.balls.set(l)}catch{}}async refreshAll(e){if(this.token){if(e?.feedWillReconnect){await this.refreshRound();return}await Promise.all([this.refreshRound(),this.pollResult(),this.refreshScorecard()])}}persistedCursor(e=this.token){return e?Pa(e):null}setResultCursor(e,t){const n=t!==null&&t!==this.resultCursor;this.resultCursor=t,n&&Ca(e,t)}async pollResult(){const e=this.token;if(!e)return;const t=++this.resultSeq;let n;try{n=await v.friendlyRounds.result({token:e,...this.resultCursor!==null?{cursor:this.resultCursor}:{}})}catch{return}t!==this.resultSeq||e!==this.token||(this.setResultCursor(e,n.cursor),n.unchanged||this.result.set(n.result))}onLiveResultEvent(e){const t=this.token,n=this.round.get();if(t&&n&&e.status!==n.status){const i=e.status==="complete"?new Date().toISOString():null;this.round.set({...n,status:e.status,completedAt:i}),He({token:t,courseName:n.courseNameSnapshot??"",name:n.name,date:n.date,status:e.status,completedAt:i,lastSeenAt:new Date().toISOString()})}this.pollResult(),this.refreshScorecard()}ballNameById=new $(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,ps(t));for(const t of this.result.get()?.slots??[])for(const n of t.subjectLabels??[])e.set(n.ballId,n.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}isPending(e){return this.balls.get().find(t=>t.id===e)?.pending===!0}groupLabelByBallId=new $(()=>{const e=new Map,t=this.groups();return t.length<2||t.forEach((n,i)=>{for(const r of n.ballIds)e.set(r,`Group ${i+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}selectedSlotDefId(){const e=this.round.get()?.formatSlots??[];if(e.length===0)return null;const t=this.selectedSlot.get();return t!==null&&e.some(n=>n.slotDefId===t)?t:e[0]?.slotDefId??null}selectSlot(e){this.selectedSlot.set(e)}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return ke(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),n=t?.playHoles.find(l=>l.id===e);if(!t||!n)return"";const i=t.playHoles.filter(l=>l.courseHoleNumber===n.courseHoleNumber).sort((l,d)=>l.ordinal-d.ordinal);if(i.length===1)return`${n.courseHoleNumber}`;const r=i.findIndex(l=>l.id===e);return`${n.courseHoleNumber} (${Na[r]??`${r+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(ke(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(ke(this.holeIndex()+1,this.playedOrder().length))}strokesFor(e,t){const n=this.cells.get().get(pe(e,t));return n?n.strokes:this.scorecards.get().find(l=>l.ballId===e)?.holes.find(l=>l.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(pe(e,t))?.status??null}strokesHintFor(e,t){const n=this.round.get();if(!n)return null;const i=this.balls.get().find(m=>m.id===e);if(!i||i.pending)return null;const r=this.selectedSlotDefId(),d=(i.slots.find(m=>m.slotDefId===r)??i.slots[0])?.playingHandicap;if(d==null)return null;const c=this.playHoleById(t);if(!c)return null;const u=i.players[0]?.teeName??null,f=c.tees.find(m=>m.teeName===u)?.strokeIndex??c.baseStrokeIndex;return ra(d,f,n.routeSi.allocationCycleSize)}statSubject(e){if(e.pending||e.players.length!==1)return null;const t=e.players[0];return!t||t.pending||t.playerId===null?null:this.statModules.get().has(t.playerId)?t.playerId:null}statPrompts(){return this.statRev.get(),this.statStep?.prompts??[]}statValue(e){return this.statRev.get(),this.statStep?.value(e)??null}statStepperValue(e,t){return this.statRev.get(),this.statStep?.intValue(e)??t}statIsAnswered(e){return this.statRev.get(),this.statStep?.isAnswered(e)===!0}answerStat(e,t){this.statStep&&(this.statStep.answer(e,t),this.bumpStatRev())}stepStat(e,t){this.statStep&&(this.statStep.step(e,t),this.bumpStatRev())}seedStatStep(e){const t=this.statCell;if(e!==null&&t!==null&&e.playerId===t.playerId&&e.playHoleId===t.playHoleId){this.refreshStatStep();return}this.flushStats(),this.setStatCell(e,e?this.makeStatStep(e):null)}refreshStatStep(){const e=this.statCell;if(!e){this.statStep!==null&&this.setStatCell(null,null);return}const t=this.statModules.get().get(e.playerId);if(!this.statStep||!t){this.setStatCell(e,this.makeStatStep(e));return}this.statStep.refresh(t,this.persistedStats(e))&&this.bumpStatRev()}setStatCell(e,t){const n=t===null?null:e;this.statCell===n&&this.statStep===t||(this.statCell=n,this.statStep=t,this.bumpStatRev())}bumpStatRev(){this.statRev.set(++this.statRevN)}makeStatStep(e){const t=this.statModules.get().get(e.playerId),n=this.playHoleById(e.playHoleId);return!t||!n?null:new ya(t,n.par,n.courseHoleNumber,this.persistedStats(e))}persistedStats(e){const t=this.statRows.get().find(i=>i.playHoleId===e.playHoleId&&i.playerId===e.playerId),n=t?Oa(t):new Map;for(const i of le){const r=Ht(e,i);if(!this.statLocal.has(r))continue;const l=this.statLocal.get(r)??null;l===null?n.delete(i):n.set(i,l)}return n}flushStats(){const e=this.statCell,t=this.statStep,n=this.token;if(!e||!t||!n)return!1;const i=t.batch;if(i.length===0)return!1;t.commitDraft(),this.bumpStatRev();for(const r of i)this.writeStatLocal(e,r.key,r.value);return this.statQueue.enqueueBatch(n,e.playHoleId,e.playerId,i),this.postStats(n),!0}writeStatLocal(e,t,n){const i=Ht(e,t);this.statLocal.set(i,n),this.statConfirmedAt.delete(i)}confirmStatLocals(e){for(const t of e){const n=Ht({playerId:t.playerId,playHoleId:t.playHoleId},t.key);this.statConfirmedAt.set(n,this.loadSeq)}}dropConfirmedStatLocals(e){for(const[t,n]of[...this.statConfirmedAt])e<=n||(this.statLocal.delete(t),this.statConfirmedAt.delete(t))}async flushPendingStats(){const e=this.token;if(e){for(const t of this.statQueue.entriesFor(e))this.writeStatLocal({playerId:t.playerId,playHoleId:t.playHoleId},t.key,t.value);await this.postStats(e)}}async postStats(e){if(!this.statPosting){this.statPosting=!0;try{for(;;){const t=this.statQueue.entriesFor(e);if(t.length===0)return;const n=await this.sendStatEvents(e,t);if(n==="later")return;if(n==="ok"||t.length===1){this.settleStatEvents(t);continue}for(const i of t){if(await this.sendStatEvents(e,[i])==="later")return;this.settleStatEvents([i])}}}finally{this.statPosting=!1}}}async sendStatEvents(e,t){try{return await v.playerStats.appendEvents({token:e,items:t.map(n=>({playHoleId:n.playHoleId,playerId:n.playerId,key:n.key,value:n.value,clientEventId:n.clientEventId}))}),"ok"}catch(n){return za(n)?"refused":"later"}}settleStatEvents(e){this.statQueue.ack(e.map(t=>t.clientEventId)),this.confirmStatLocals(e)}metadataFor(e,t,n){const i=this.cells.get().get(pe(e,t));return i&&i.metadata!==void 0?i.metadata?.[n]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[n]}metadataInputs(){const e=G.get(Ve),t=this.round.get()?.formatSlots??[],n=[],i=new Set;for(const r of t){const l=e.byId(r.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of l)i.has(d.key)||(i.add(d.key),n.push(d))}return n}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>Ra(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,n,i){const r=pe(e,t),l=crypto.randomUUID();this.patchCell(r,{strokes:n,metadata:i,status:"saving",clientEventId:l});const d=this.token;d&&(this.enqueue(d,e,t,n,i,l),await this.post(d,e,t,n,i,l))}async retry(e,t){const n=pe(e,t),i=this.cells.get().get(n);if(!i)return;this.patchCell(n,{...i,status:"saving"});const r=this.token;r&&(this.enqueue(r,e,t,i.strokes,i.metadata,i.clientEventId),await this.post(r,e,t,i.strokes,i.metadata,i.clientEventId))}async flushPending(){const e=this.token;if(!(!e||this.flushing)){this.flushing=!0;try{for(const t of this.queue.entriesFor(e)){if(e!==this.token)return;this.patchCell(pe(t.ballId,t.playHoleId),{strokes:t.strokes,metadata:t.metadata,status:"saving",clientEventId:t.clientEventId}),await this.post(e,t.ballId,t.playHoleId,t.strokes,t.metadata,t.clientEventId)}}finally{this.flushing=!1}}}enqueue(e,t,n,i,r,l){this.queue.enqueue({token:e,ballId:t,playHoleId:n,strokes:i,eventType:i===null?"score_cleared":"score_entered",clientEventId:l,...r!==void 0?{metadata:r}:{},queuedAt:Date.now()})}async post(e,t,n,i,r,l){const d=pe(t,n);try{await v.friendlyRounds.score({token:e,ballId:t,playHoleId:n,strokes:i,eventType:i===null?"score_cleared":"score_entered",clientEventId:l,...r!=null?{metadata:r}:{}}),this.queue.remove(l);const c=this.cells.get().get(d);c&&c.clientEventId===l&&this.patchCell(d,{...c,status:"saved"});const u=this.round.get();e===this.token&&u&&u.status==="not_started"&&this.round.set({...u,status:"active"})}catch{const c=this.cells.get().get(d);c&&c.clientEventId===l&&this.patchCell(d,{...c,status:"error"})}}patchCell(e,t){const n=new Map(this.cells.get());n.set(e,t),this.cells.set(n)}resetForNewToken(e){this.resultSeq++,this.resultCursor=null,this.friendlyRound.set(null),this.round.set(null),this.startList.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(e?.holeIdx??0),this.groupIdx.set(e?.groupIdx??0),this.keypadOpen.set(!1),this.statModules.set(new Map),this.statRows.set([]),this.statLocal.clear(),this.statConfirmedAt.clear(),this.statStep=null,this.statCell=null,this.bumpStatRev();const t=e?.selectedSlot;this.pendingSlotIndex=null,typeof t=="string"?this.selectedSlot.set(t):typeof t=="number"?(this.pendingSlotIndex=t,this.selectedSlot.set(null)):this.selectedSlot.set(null)}}class ri{roundId=new p(null);view=new p(null);balls=new p([]);loading=new p(!1);error=new p(null);unavailable=new p(null);loaded=!1;setRound(e){this.roundId.get()!==e&&(this.roundId.set(e),this.reset())}async load(e=!1){const t=this.roundId.get();if(t&&!(!e&&(this.loaded||this.loading.get()))){this.loading.set(!0),this.error.set(null);try{const n=await v.spectate.round({roundId:t});if(this.roundId.get()!==t)return;this.view.set(n),this.loaded=!0,this.unavailable.set(null),await this.loadBalls(t)}catch(n){if(this.roundId.get()!==t)return;const i=ti(n);i?(this.unavailable.set(i),this.view.set(null),this.balls.set([]),this.loaded=!1):this.error.set(Me(n,"Couldn't load this round."))}finally{this.roundId.get()===t&&this.loading.set(!1)}}}async loadBalls(e){try{const t=await v.rounds.balls({roundId:e});this.roundId.get()===e&&this.balls.set(t)}catch{}}ballNameById=new $(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,ps(t));for(const t of this.view.get()?.result.slots??[])for(const n of t.subjectLabels??[])e.set(n.ballId,n.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}groupLabelByBallId=new $(()=>{const e=new Map,t=this.view.get()?.round.playingGroups??[];return t.length<2||t.forEach((n,i)=>{for(const r of n.ballIds)e.set(r,`Group ${i+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}clear(){this.roundId.set(null),this.reset()}reset(){this.view.set(null),this.balls.set([]),this.loaded=!1,this.loading.set(!1),this.error.set(null),this.unavailable.set(null)}}class oi{roles=new p([]);rolesLoaded=!1;loading=new p(!1);error=new p(null);stats=new p(null);rounds=new p([]);players=new p([]);isSuperAdmin(){return this.roles.get().some(e=>e.role==="super_admin"&&e.scopeType===null)}async loadRoles(e=!1){if(!(!e&&this.rolesLoaded)){this.rolesLoaded=!0;try{this.roles.set(await v.admin.myRoles())}catch{this.roles.set([])}}}clear(){this.roles.set([]),this.rolesLoaded=!1,this.stats.set(null),this.rounds.set([]),this.players.set([]),this.error.set(null)}async load(e=!1){if(!e&&this.stats.get()!==null)return;const t=await A(this.loading,this.error,()=>Promise.all([v.admin.adminStats(),v.admin.adminRounds({limit:100}),v.admin.adminPlayers()]));if(!t)return;const[n,i,r]=t;this.stats.set(n),this.rounds.set(i),this.players.set(r)}}const Ss=class Ss extends E{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(I(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};Ss.styles=`
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
    `;let Jt=Ss;const N=s=>`var(--${s})`,Ts=class Ts extends E{render(){const e=document.createElement("div"),t=(c,u)=>{typeof u=="function"?this.track(I(()=>{c.textContent=u()})):c.textContent=u};this.spawn(Jt,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const n=document.createElement("h2");n.className="ui-confirm__title",t(n,this.props.title??"Confirm"),this.dialogEl.appendChild(n);const i=document.createElement("p");i.className="ui-confirm__message",t(i,this.props.message),this.dialogEl.appendChild(i);const r=document.createElement("div");r.className="ui-confirm__actions";const l=document.createElement("button");l.className="ui-confirm__btn ui-confirm__btn--cancel",t(l,this.props.cancelLabel??"Cancel"),l.addEventListener("click",c=>{c.stopPropagation(),this.handleCancel()}),r.appendChild(l);const d=document.createElement("button");return d.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(d,this.props.confirmLabel??"Confirm"),d.addEventListener("click",c=>{c.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),r.appendChild(d),this.dialogEl.appendChild(r),this.dialogEl.addEventListener("click",c=>c.stopPropagation()),e.appendChild(this.dialogEl),this.track(I(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};Ts.styles=`
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${N("surface")};
            border: 1px solid ${N("border")};
            border-radius: ${N("radius-md")};
            box-shadow: ${N("shadow-3")};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition:
                opacity ${N("dur-slow")} ${N("ease-standard")},
                transform ${N("dur-slow")} ${N("ease-standard")};
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
            font-family: ${N("font-display")};
            font-size: 1.25rem;
            font-weight: 500;
            line-height: 1.4;
            color: ${N("text")};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-family: ${N("font-ui")};
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
            font-family: ${N("font-ui")};
            font-weight: 600;
            border: 1px solid transparent;
            border-radius: ${N("radius-sm")};
            cursor: pointer;
            transition:
                background ${N("dur-fast")} ${N("ease-standard")},
                border-color ${N("dur-fast")} ${N("ease-standard")},
                color ${N("dur-fast")} ${N("ease-standard")},
                box-shadow ${N("dur-fast")} ${N("ease-standard")};
        }
        .ui-confirm__btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px ${N("accent-soft")};
        }
        .ui-confirm__btn--cancel {
            background: transparent;
            color: ${N("text-muted")};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${N("accent-soft")};
            color: ${N("accent")};
        }
        .ui-confirm__btn--confirm {
            background: ${N("accent")};
            color: ${N("on-accent")};
            border-color: ${N("accent")};
            box-shadow: ${N("shadow-1")};
        }
        .ui-confirm__btn--confirm:hover {
            background: ${N("accent-strong")};
            border-color: ${N("accent-strong")};
        }
        /* Outline, filling only on hover — same reasoning as css.ts danger. */
        .ui-confirm__btn--danger {
            background: transparent;
            color: ${N("danger")};
            border-color: ${N("danger")};
        }
        .ui-confirm__btn--danger:hover {
            background: ${N("danger")};
            color: ${N("on-danger")};
        }
    `;let Z=Ts;async function La(s,e={}){e.everywhere?await s.auth.logoutEverywhere():await s.auth.logout(),s.profile.clear(),s.friends.clear(),s.activity.clear(),s.friendProfile.clear(),s.spectate.clear(),s.admins.clear(),s.landing.clear(),s.navigate("/")}const Ha="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";function Ce(s="avatar"){return`<span class="${s}">
            <img bind="avatarPhoto" class="avatar__photo" alt="" />
            <span bind="avatarInitials" class="avatar__initials"></span>
        </span>`}function Te(s){const e=()=>Po(s());return{avatarPhoto:{src:()=>e()??Ha,className:()=>e()?"avatar__photo":"avatar__photo hidden"},avatarInitials:{textContent:()=>{const t=s();return Co(t.displayName,t.username)},className:()=>e()?"avatar__initials hidden":"avatar__initials"}}}function Ze(s,e="0.85rem"){return`
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
    `}function Aa(s){if(!s.signedIn)return[];const e=[{kind:"identity",displayName:(s.displayName??"").trim()||(s.username??"").trim()||"Signed in",username:(s.username??"").trim()},{kind:"profile",label:"Profile"}];return s.isSuperAdmin&&e.push({kind:"admin",label:"Admin"}),e.push({kind:"signout",label:"Sign out"}),e.push({kind:"signout-all",label:"Sign out everywhere"}),e}function Ma(s){return Aa(s).map(e=>e.kind)}function qs(s){return s.signedIn?"avatar":"signin"}const Fa=_(`
    <div class="acct" bind="root">
        <button bind="signin" class="acct__signin" type="button">Sign in</button>
        <button bind="avatar" class="acct__avatar" type="button" aria-label="Account">
            ${Ce("acct__badge")}
        </button>
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
                <button bind="signoutAll" class="acct__row acct__row--quiet" type="button">Sign out everywhere</button>
            </div>
        </div>
        <div bind="confirmHost"></div>
    </div>
`);class ja extends E{static styles=`
        .acct {
            position: relative;
            display: flex;
            justify-content: flex-end;

            & .acct__signin {
                padding: ${o("xs")} ${o("md")};
                background: none;
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-pill")};
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 700;
                color: ${a("text")};
                cursor: pointer;

                &:hover { background: ${a("hover-bg")}; }
                &.hidden { display: none; }
            }

            & .acct__avatar {
                display: flex;
                padding: 0;
                background: none;
                border: none;
                border-radius: ${a("radius-pill")};
                cursor: pointer;
                box-shadow: ${a("shadow")};

                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
                &.hidden { display: none; }

                & .acct__badge {
                    ${Ze(38,"0.9rem")}
                    background: ${a("primary")};
                    color: ${a("primary-text")};
                    font-family: inherit;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                }
            }

            & .acct__menu {
                position: absolute;
                top: calc(100% + ${o("xs")});
                right: 0;
                z-index: 20;
                min-width: 208px;
                padding: ${o("xs")};
                background: ${a("surface")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius")};
                box-shadow: ${a("shadow-elevated")};
                text-align: left;

                &.hidden { display: none; }

                & .acct__identity {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    padding: ${o("sm")} ${o("md")} ${o("md")};
                    border-bottom: 1px solid ${a("border")};
                    margin-bottom: ${o("xs")};

                    & .acct__identity-label {
                        font-size: 0.68rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        color: ${a("text-muted")};
                    }
                    & .acct__identity-name {
                        font-weight: 700;
                        font-size: 0.98rem;
                        color: ${a("text")};
                    }
                    & .acct__identity-user {
                        font-size: 0.82rem;
                        color: ${a("text-muted")};
                        &:empty { display: none; }
                    }
                }

                & .acct__row {
                    display: block;
                    width: 100%;
                    padding: ${o("sm")} ${o("md")};
                    background: none;
                    border: none;
                    border-radius: ${a("radius-sm")};
                    text-align: left;
                    font-family: inherit;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: ${a("text")};
                    cursor: pointer;

                    &:hover { background: ${a("hover-bg")}; }
                    &.acct__row--quiet { color: ${a("text-muted")}; }
                    &.hidden { display: none; }
                }
            }
        }
    `;auth=this.inject(j);profile=this.inject(Je);friends=this.inject($t);activity=this.inject(cs);friendProfile=this.inject(kt);spectate=this.inject(ri);admins=this.inject(oi);landing=this.inject(xt);router=this.inject(M);open=new p(!1);state=new $(()=>({signedIn:this.auth.currentUser.get()!==null,displayName:this.profile.player.get()?.displayName??null,username:this.profile.player.get()?.username??this.auth.currentUser.get()?.username??null,isSuperAdmin:this.admins.isSuperAdmin()}));signOutAllOpen=new p(!1);has(e){return Ma(this.state.get()).includes(e)}rowClass(e,t=""){const n=`acct__row${t}`;return this.has(e)?n:`${n} hidden`}async signOut(e={}){await La({auth:this.auth,profile:this.profile,friends:this.friends,activity:this.activity,friendProfile:this.friendProfile,spectate:this.spectate,admins:this.admins,landing:this.landing,navigate:t=>this.router.navigate(t)},e)}render(){this.auth.currentUser.get()&&(this.profile.load(),this.admins.loadRoles());const e=this.wire(Fa,{signin:{className:()=>qs(this.state.get())==="signin"?"acct__signin":"acct__signin hidden",onclick:()=>{this.open.set(!1),this.router.navigate("/login")}},...Te(()=>{const u=this.profile.player.get();return{id:u?.id??"",avatarVersion:u?.avatarVersion??null,displayName:this.state.get().displayName,username:this.state.get().username}}),avatar:{className:()=>qs(this.state.get())==="avatar"?"acct__avatar":"acct__avatar hidden","aria-expanded":()=>this.open.get()?"true":"false",onclick:()=>this.open.set(!this.open.get())},menu:{className:()=>this.open.get()&&this.has("identity")?"acct__menu":"acct__menu hidden"},idName:()=>{const u=this.state.get();return(u.displayName??"").trim()||(u.username??"").trim()||"Signed in"},idUser:()=>{const u=(this.state.get().username??"").trim();return u===""?"":`@${u}`},profile:{className:()=>this.rowClass("profile"),onclick:()=>{this.open.set(!1),this.router.navigate("/profile")}},admin:{className:()=>this.rowClass("admin"),onclick:()=>{this.open.set(!1),this.router.navigate("/admin")}},signout:{className:()=>this.rowClass("signout"," acct__row--quiet"),onclick:()=>{this.open.set(!1),this.signOut()}},signoutAll:{className:()=>this.rowClass("signout-all"," acct__row--quiet"),onclick:()=>{this.open.set(!1),this.signOutAllOpen.set(!0)}}});this.spawn(Z,this.ref(e,"confirmHost"),{open:this.signOutAllOpen,title:"Sign out everywhere?",message:"Every device signed in to this account is signed out, including this one. Rounds and scores are untouched — you can sign back in with your password.",confirmLabel:"Sign out everywhere",cancelLabel:"Cancel",onconfirm:()=>{this.signOut({everywhere:!0})}});const t=this.ref(e,"root"),n=e.querySelector('[bind="avatar"]'),i=u=>{u.key==="Escape"&&this.open.get()&&(this.open.set(!1),n?.focus())},r=u=>{if(!this.open.get())return;const f=u.target;f instanceof Node&&t.contains(f)||this.open.set(!1)};let l=!1;const d=()=>{l||(l=!0,window.addEventListener("keydown",i),document.addEventListener("pointerdown",r,!0))},c=()=>{l&&(l=!1,window.removeEventListener("keydown",i),document.removeEventListener("pointerdown",r,!0))};return this.track(I(()=>{this.open.get()?d():c()})),this.track(c),e}}function ai(s){const e=G.get(Ve);return e.load(),e.labelOf(s.formatId)??`${s.scoringMode} · ${s.teamShape}`}function Da(s){return s.map(e=>({key:e.round.id,token:e.token,roundId:e.round.id,name:e.round.name,courseName:e.round.courseNameSnapshot??"",status:e.round.status,completedAt:e.round.completedAt,lastActivityAt:e.round.date,roleLabel:eo(e)||null,date:e.round.date,formats:e.round.formatSlots.map(ai).join(" · ")}))}function Ba(s){return s.map(e=>({key:e.token,token:e.token,roundId:null,name:e.name??null,courseName:e.courseName,status:e.status,completedAt:e.completedAt??null,lastActivityAt:e.lastSeenAt,roleLabel:null,date:e.date??null,formats:null}))}function Ue(s){const e=(s.name??"").trim();return e||s.courseName||"Round"}function gt(s){return s.courseName?Ue(s)===s.courseName?null:s.courseName:null}function _e(s,e=typeof navigator>"u"?"en":navigator.language){return s?/^\d{4}-\d{2}-\d{2}$/.test(s)?new Intl.DateTimeFormat(e,{dateStyle:"medium",timeZone:"UTC"}).format(new Date(`${s}T12:00:00Z`)):s:""}const Be={fromMyRounds:Da,fromDeviceRounds:Ba},Ga=14,qa=1440*60*1e3;function Oe(s,e){return e(s)}function Va(s,e,t,n=Ga){const i=e-n*qa,r=[],l=[];for(const d of s){const c=Oe(d,t);if(c.status==="complete"){const u=c.completedAt?Date.parse(c.completedAt):NaN;(Number.isNaN(u)||u>=i)&&l.push(d)}else r.push(d)}return r.sort((d,c)=>Vs(Oe(d,t).lastActivityAt,Oe(c,t).lastActivityAt)),l.sort((d,c)=>Vs(Oe(d,t).completedAt,Oe(c,t).completedAt)),{ongoing:r,finished:l}}function Vs(s,e){const t=s?Date.parse(s):NaN,n=e?Date.parse(e):NaN,i=Number.isNaN(t)?Number.NEGATIVE_INFINITY:t,r=Number.isNaN(n)?Number.NEGATIVE_INFINITY:n;return i===r?0:r-i}const Ua=_(`
    <div class="landing">
        <header class="landing__head">
            <div class="landing__flag">⛳</div>
            <h1>tapscore</h1>
            <p>Scores, settled on the green. No sign-in needed.</p>
        </header>
        <button bind="createBtn" class="landing__create" type="button">
            <span class="landing__create-plus">+</span> Create round
        </button>

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

        <!-- "From your friends", not "Recently": the screen already has a
             "Recently finished" section for YOUR rounds, and two headings one
             word apart with nothing saying whose is a coin-flip. -->
        <div bind="recentlySection" class="landing__section-block landing__recently">
            <div class="landing__section">
                <span class="landing__section-title">From your friends</span>
            </div>
            <div bind="recentlyList" class="landing__list"></div>
        </div>

        <button bind="history" class="landing__history" type="button">See all rounds →</button>
        <div bind="confirmHost"></div>
    </div>
`),Ka='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',Wa=_(`
    <div class="round-row">
        <button bind="row" type="button" class="round-row__main">
            <div class="round-row__top">
                <span bind="title" class="round-row__title"></span>
                <span bind="role" class="round-row__role"></span>
                <span bind="status" class="round-row__status"></span>
            </div>
            <span bind="course" class="round-row__course"></span>
            <div class="round-row__bottom">
                <span bind="date"></span>
                <span bind="formats" class="round-row__formats"></span>
            </div>
        </button>
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${Ka}</button>
    </div>
`),Ya=_(`
    <button bind="chip" type="button" class="outnow-chip">
        <span class="outnow-chip__badge-wrap">
            ${Ce("outnow-chip__badge")}
            <span class="outnow-chip__dot" aria-hidden="true"></span>
        </span>
        <span class="outnow-chip__text">
            <span bind="who" class="outnow-chip__who"></span>
            <span bind="line" class="outnow-chip__line"></span>
        </span>
    </button>
`),Qa=_(`
    <button bind="row" type="button" class="recent-row">
        <span class="recent-row__text">
            <span bind="who" class="recent-row__who"></span>
            <span bind="what" class="recent-row__what"></span>
        </span>
        <span bind="when" class="recent-row__when"></span>
    </button>
`),li={not_started:"Not started",active:"Live",complete:"Finished"};class Us extends E{static styles=`
        .landing {
            /* The account surface is in the app shell's header, above this
               screen — the landing hosts nothing account-shaped itself. */
            padding: ${o("lg")} ${o("lg")} ${o("2xl")};

            & .landing__head {
                text-align: center;
                margin-bottom: ${o("xl")};

                & .landing__flag { font-size: 2.2rem; line-height: 1; }
                & h1 {
                    margin: ${o("xs")} 0 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2.2rem;
                    letter-spacing: -0.02em;
                    color: ${a("text")};
                }
                & p {
                    margin: ${o("xs")} 0 0;
                    color: ${a("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .landing__create {
                ${w()}
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: ${o("sm")};
                padding: ${o("lg")};
                margin-bottom: ${o("xl")};
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
                margin-bottom: ${o("xl")};
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
                background: ${a("accent")};
                flex-shrink: 0; align-self: center;
            }
            & .landing__outnow-title { font-size: 0.9rem; color: ${a("text-muted")}; }
            & .landing__outnow-chips {
                display: flex; gap: ${o("sm")};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                /* Chips scroll to the screen edge instead of stopping short
                   of it and looking clipped. */
                margin: 0 -${o("lg")};
                padding: 2px ${o("lg")};
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }
            }
            & .outnow-chip {
                ${C({hover:!0})}
                display: flex; align-items: center; gap: ${o("sm")};
                flex-shrink: 0; max-width: 85%;
                padding: ${o("sm")} ${o("md")};
                font-family: inherit; text-align: left; cursor: pointer;

                & .outnow-chip__badge-wrap { position: relative; flex-shrink: 0; }
                & .outnow-chip__badge {
                    ${Ze(36,"0.8rem")}
                    background: ${a("primary")}; color: ${a("primary-text")};
                }
                /* The live marker rides the avatar: the chip is already
                   "who + how far", and a third text fragment is a wall of
                   words at four chips wide. No animation — motion in the
                   corner of the eye on every app open is worse than none. */
                & .outnow-chip__dot {
                    position: absolute; right: -1px; bottom: -1px;
                    width: 10px; height: 10px; border-radius: 50%;
                    background: ${a("accent")};
                    border: 2px solid ${a("surface")};
                }
                & .outnow-chip__text {
                    display: flex; flex-direction: column; gap: 1px; min-width: 0;
                }
                & .outnow-chip__who {
                    font-weight: 600; font-size: 0.95rem; color: ${a("text")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .outnow-chip__line {
                    font-weight: 600; font-size: 0.8rem; color: ${a("accent")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
            }

            /* "Recently" — the feed's retrospective half, kept quiet: muted
               rows at the bottom, below the viewer's own rounds. */
            & .recent-row {
                ${C({hover:!0})}
                display: flex; align-items: center; gap: ${o("md")};
                width: 100%;
                padding: ${o("sm")} ${o("lg")};
                font-family: inherit; text-align: left; cursor: pointer;

                & .recent-row__text {
                    flex: 1; min-width: 0;
                    display: flex; flex-direction: column; gap: 1px;
                }
                & .recent-row__who { font-weight: 600; font-size: 0.9rem; color: ${a("text")}; }
                & .recent-row__what {
                    color: ${a("text-muted")}; font-size: 0.8rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .recent-row__when {
                    flex-shrink: 0; color: ${a("text-muted")}; font-size: 0.8rem;
                }
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
                gap: ${o("sm")};
                margin-bottom: ${o("sm")};

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
                padding: ${o("lg")} 0;

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
                gap: ${o("sm")};
            }

            & .round-row {
                display: flex;
                align-items: stretch;
                ${C({hover:!0})}

                & .round-row__main {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${o("xs")};
                    padding: ${o("md")} 0 ${o("md")} ${o("lg")};
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
                    gap: ${o("md")};
                }
                /* Three sizes, one hierarchy: what the round is CALLED, then
                   where it was played, then when. An unnamed round is headed
                   by its course and the sub-title hides. */
                & .round-row__title {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${a("text")};
                }
                & .round-row__course {
                    color: ${a("text-muted")};
                    font-size: 0.9rem;

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
                    gap: ${o("md")};
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
                margin: ${o("sm")} auto 0;
                padding: ${o("sm")} ${o("lg")};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                color: ${a("accent")};
                cursor: pointer;

                &.hidden { display: none; }
            }

        }

        /* App-level accessibility override for the framework confirm dialog. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;svc=this.inject(xt);activity=this.inject(cs);auth=this.inject(j);router=this.inject(M);loggedIn=new $(()=>this.auth.currentUser.get()!==null);rows=new $(()=>this.loggedIn.get()?Be.fromMyRounds(this.svc.myRounds.get()):Be.fromDeviceRounds(this.svc.deviceRounds.get()));parts=new $(()=>Va(this.rows.get(),Date.now(),e=>e));ongoing=new $(()=>this.parts.get().ongoing);finished=new $(()=>this.parts.get().finished);newRows=new $(()=>this.loggedIn.get()?Be.fromMyRounds(this.svc.newRounds.get()):[]);chips=new $(()=>this.loggedIn.get()?Uo(this.activity.feed.get()?.live??[]):[]);recents=new $(()=>this.loggedIn.get()?Xo(this.activity.feed.get()?.recent??[]):[]);deleteOpen=new p(!1);deleteTarget=new p(null);askDelete(e,t,n){this.deleteTarget.set({token:e,roundId:t,name:n}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?(this.svc.loadMine(),this.activity.load()):this.svc.loadDevice();const e=()=>this.rows.get().length>0,t=this.wire(Ua,{createBtn:{onclick:()=>this.router.navigate("/create")},history:{className:()=>e()?"landing__history":"landing__history hidden",onclick:()=>this.router.navigate("/history")},outNowSection:{className:()=>this.chips.get().length>0?"landing__section-block landing__outnow":"landing__section-block landing__outnow hidden"},outNowContext:()=>Wo(this.activity.feed.get()?.live??[])??"",recentlySection:{className:()=>this.recents.get().length>0?"landing__section-block landing__recently":"landing__section-block landing__recently hidden"},newSection:{className:()=>this.newRows.get().length>0?"landing__section-block landing__new":"landing__section-block landing__new hidden"},newCount:()=>{const i=this.newRows.get().length;return i===0?"":String(i)},ongoingSection:{className:()=>this.ongoing.get().length>0?"landing__section-block":"landing__section-block hidden"},ongoingCount:()=>{const i=this.ongoing.get().length;return i===0?"":String(i)},finishedSection:{className:()=>this.finished.get().length>0?"landing__section-block":"landing__section-block hidden"},finishedCount:()=>{const i=this.finished.get().length;return i===0?"":String(i)},empty:{className:()=>e()?"landing__empty hidden":"landing__empty"}});this.$each(this.ref(t,"outNowList"),this.chips,(i,r,l)=>this.wireEl(Ya,{chip:{"aria-label":()=>Ko(i),onclick:()=>this.router.navigate("/spectate",{query:{id:i.roundId,name:i.displayName}})},...Te(()=>{const d=this.chips.get().find(c=>c.roundId===i.roundId)??i;return{id:d.playerId,avatarVersion:d.avatarVersion,displayName:d.displayName}}),who:()=>i.title,line:()=>i.progress},l),i=>i.roundId),this.$each(this.ref(t,"recentlyList"),this.recents,(i,r,l)=>this.wireEl(Qa,{row:{onclick:()=>this.router.navigate("/spectate",{query:{id:i.roundId,name:i.displayName}})},who:()=>i.friendLabel,what:()=>i.title,when:()=>_e(i.date)},l),i=>i.roundId),this.$each(this.ref(t,"newList"),this.newRows,(i,r,l)=>this.roundRow(i,l),i=>i.key),this.$each(this.ref(t,"ongoingList"),this.ongoing,(i,r,l)=>this.roundRow(i,l),i=>i.key),this.$each(this.ref(t,"finishedList"),this.finished,(i,r,l)=>this.roundRow(i,l),i=>i.key),this.spawn(Z,this.ref(t,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const i=this.deleteTarget.get();return`Delete ${i?`“${i.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const i=this.deleteTarget.get();i&&this.svc.remove(i.token,i.roundId)}});const n=i=>{i.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",n),this.track(()=>window.removeEventListener("keydown",n)),t}roundRow(e,t){return this.wireEl(Wa,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},title:()=>Ue(e),course:{textContent:()=>gt(e)??"",className:()=>gt(e)?"round-row__course":"round-row__course hidden"},role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>li[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>_e(e.date),formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",Ue(e))}}},t)}}function Xa(s){return[...s].sort((e,t)=>{const n=Ks(e),i=Ks(t);return i!==n?i-n:e.key.localeCompare(t.key)})}function Ks(s){const e=s.completedAt??s.lastActivityAt,t=e?Date.parse(e):NaN;return Number.isNaN(t)?Number.NEGATIVE_INFINITY:t}const Ja=_(`
    <div class="history">
        <button bind="back" class="history__back" type="button">← Home</button>
        <h1 class="history__title">All rounds</h1>
        <div bind="empty" class="history__empty">No rounds yet — create one to tee off.</div>
        <div bind="list" class="history__list"></div>
        <div bind="confirmHost"></div>
    </div>
`),Za='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',el=_(`
    <div class="round-row">
        <button bind="row" type="button" class="round-row__main">
            <div class="round-row__top">
                <span bind="title" class="round-row__title"></span>
                <span bind="role" class="round-row__role"></span>
                <span bind="status" class="round-row__status"></span>
            </div>
            <span bind="course" class="round-row__course"></span>
            <div class="round-row__bottom">
                <span bind="date"></span>
                <span bind="formats" class="round-row__formats"></span>
            </div>
        </button>
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${Za}</button>
    </div>
`);class tl extends E{static styles=`
        .history {
            padding: ${o("xl")} ${o("lg")} ${o("2xl")};

            & .history__back {
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 600;
                color: ${a("text-muted")};
                cursor: pointer;
                padding: ${o("xs")} 0;
                margin-bottom: ${o("md")};
            }

            & .history__title {
                margin: 0 0 ${o("lg")};
                font-family: ${a("font-display")};
                font-weight: 600;
                font-size: 1.8rem;
                letter-spacing: -0.02em;
                color: ${a("text")};
            }

            & .history__empty {
                color: ${a("text-muted")};
                font-size: 0.9rem;
                padding: ${o("lg")} 0;
                &.hidden { display: none; }
            }

            & .history__list {
                display: flex;
                flex-direction: column;
                gap: ${o("sm")};
            }

            & .round-row {
                display: flex;
                align-items: stretch;
                ${C({hover:!0})}

                & .round-row__main {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: ${o("xs")};
                    padding: ${o("md")} 0 ${o("md")} ${o("lg")};
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
                    gap: ${o("md")};
                }
                /* Same three-tier hierarchy as the landing: what the round is
                   CALLED, then where it was played, then when. */
                & .round-row__title {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: ${a("text")};
                }
                & .round-row__course {
                    color: ${a("text-muted")};
                    font-size: 0.9rem;

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
                    gap: ${o("md")};
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
    `;svc=this.inject(xt);auth=this.inject(j);router=this.inject(M);loggedIn=new $(()=>this.auth.currentUser.get()!==null);rows=new $(()=>Xa(this.loggedIn.get()?Be.fromMyRounds(this.svc.myRounds.get()):Be.fromDeviceRounds(this.svc.deviceRounds.get())));deleteOpen=new p(!1);deleteTarget=new p(null);askDelete(e,t,n){this.deleteTarget.set({token:e,roundId:t,name:n}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?this.svc.loadMine():this.svc.loadDevice();const e=this.wire(Ja,{back:{onclick:()=>this.router.navigate("/")},empty:{className:()=>this.rows.get().length===0?"history__empty":"history__empty hidden"}});this.$each(this.ref(e,"list"),this.rows,(n,i,r)=>this.roundRow(n,r),n=>n.key),this.spawn(Z,this.ref(e,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const n=this.deleteTarget.get();return`Delete ${n?`“${n.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const n=this.deleteTarget.get();n&&this.svc.remove(n.token,n.roundId)}});const t=n=>{n.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t)),e}roundRow(e,t){return this.wireEl(el,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},title:()=>Ue(e),course:{textContent:()=>gt(e)??"",className:()=>gt(e)?"round-row__course":"round-row__course hidden"},role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>li[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>_e(e.date),formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",Ue(e))}}},t)}}const sl=700;function nl(s){if(!s.currentHole)return!1;const e=s.balls.filter(t=>!t.pending);return e.length>0&&e.every(t=>t.scored)}function il(s){return s.currentHole?s.balls.some((e,t)=>t!==s.currentBallIndex&&!e.scored):!1}function At(s){const e=s.currentHole;if(!e)return{kind:"noop"};const t=s.balls,n=s.currentBallIndex;for(let i=n+1;i<t.length;i++)if(!t[i].scored)return{kind:"moveToBall",ballIndex:i};for(let i=0;i<n;i++)if(!t[i].scored)return{kind:"moveToBall",ballIndex:i};return s.holeIndex>=s.holeCount-1?{kind:"roundComplete",toast:"Round complete"}:{kind:"holeComplete",toast:`Hole ${e.label} done`,fromHoleId:e.id,toHoleIndex:s.holeIndex+1,delayMs:sl}}function rl(s,e){const t=s.currentHole;if(e.kind==="statsDone")return s.holeCompleteOnEntry?{write:null,move:{kind:"stay"}}:{write:null,move:At(s)};const n=s.balls[s.currentBallIndex];if(!t||!n)return{write:null,move:{kind:"noop"}};if(n.pending)return s.holeCompleteOnEntry?{write:null,move:{kind:"stay"}}:{write:null,move:At(s)};const i={ballIndex:s.currentBallIndex,holeId:t.id,value:e.value,withMetadata:e.value!==null};return e.value!==null&&e.value>0&&s.collectsStats?{write:i,move:{kind:"openStats"}}:s.holeCompleteOnEntry?{write:i,move:{kind:"stay"}}:{write:i,move:At(s)}}const fe=60,Ws=8,Zt=4,ol=Array.from({length:Zt*2+1},(s,e)=>e-Zt),al="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",ll=_(`
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
`),dl=_(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),Ys=_(`
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
`),cl=_(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),Qs=_(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),ul=_(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`),hl=_(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div bind="seg" class="se-stats__seg"></div>
    </div>
`),pl=_('<button bind="btn" class="se-seg" type="button"></button>'),fl=_(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__step">
            <button bind="minus" class="se-stats__step-btn" type="button">−</button>
            <span bind="val" class="se-stats__step-val"></span>
            <button bind="plus" class="se-stats__step-btn" type="button">+</button>
        </div>
    </div>
`),ml=_('<div bind="rule" class="se-stats__rule"></div>');class gl extends E{static styles=`
        .se {
            margin-top: ${o("xl")};
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
            right: ${Ws}px;
            width: ${fe*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-Zt*fe}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${fe}px;
            width: ${fe}px;
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
            margin-top: ${o("sm")};
            border-top: 1px solid ${a("border")};
        }
        .se-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${o("md")};
            padding: ${o("md")} 0;
            border-bottom: 1px solid ${a("border")};

            /* The name block takes the slack so the to-par sits right up
               against the fixed-width score columns; min-width:0 is what lets
               a long name ellipsis instead of pushing the numbers off-row. */
            & .se-row__who { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 auto; }
            & .se-row__name {
                font-family: ${a("font-display")};
                font-weight: 600;
                font-size: 1.05rem;
                color: ${a("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            /* What the ball plays off, quiet under the name (same chain as the
               keypad list rows). Absent — not blanked — when there is no
               handicap to state. */
            & .se-row__hcp {
                font-size: 0.75rem;
                color: ${a("text-muted")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            /* Gamebook puts the running to-par where the eye lands: its own
               column between the name and the scores, in the display face at
               score size, tinted by tone. */
            & .se-row__topar {
                flex-shrink: 0;
                text-align: right;
                font-family: ${a("font-display")};
                font-weight: 700;
                font-size: 1.35rem;
                font-variant-numeric: tabular-nums;
            }

            & .se-row__scores { display: flex; align-items: center; padding-right: ${Ws}px; flex-shrink: 0; }
            & .se-row__slot { width: ${fe}px; display: flex; align-items: center; justify-content: center; }
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
            padding: ${o("md")} ${o("lg")};
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
            padding: ${o("lg")};
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

        .se-pad { position: relative; padding: ${o("sm")} ${o("sm")} ${o("xl")}; background: #1c1c1e; }
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
                padding: ${o("md")} ${o("lg")};
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
                display: flex; align-items: center; justify-content: center; gap: ${o("md")};
                padding: ${o("lg")} ${o("lg")} ${o("sm")};
            }
            & .se-stats__name { font-family: ${a("font-display")}; font-weight: 700; font-size: 1.4rem; }
            & .se-stats__score {
                /* content-box, so the 8px sides ADD to the 44px minimum the way
                   iOS stacks them — .frame(minWidth: 44) then .padding(.horizontal)
                   outside it (ScoreKeypadView.swift:581-583). Under the app's
                   border-box default a one-digit score collapses to 44x44 and
                   reads as a circle instead of a capsule. */
                box-sizing: content-box;
                min-width: 44px; height: 44px; padding: 0 8px; border-radius: 999px;
                display: inline-flex; align-items: center; justify-content: center;
                background: ${a("primary")}; color: #fff;
                font-family: ${a("font-display")}; font-weight: 700; font-size: 1.3rem;
                font-variant-numeric: tabular-nums;
            }

            & .se-stats__body {
                flex: 1; overflow-y: auto;
                display: flex; flex-direction: column; gap: ${o("xl")};
                padding: ${o("lg")} ${o("lg")} ${o("xl")};
                align-content: flex-start;
            }

            /* Each metadata category is its own labeled group. */
            & .se-stats__group { display: flex; flex-direction: column; gap: ${o("sm")}; }
            & .se-stats__group-label {
                text-align: center;
                font-family: ${a("font-display")}; font-weight: 700; font-size: 1.05rem;
                color: rgba(255, 255, 255, 0.92);
            }
            & .se-stats__seg { display: flex; gap: ${o("sm")}; justify-content: center; }

            /* Hairline between the format's own toggles (what the round needs to
               score) and the player's own stats (what they asked to track). */
            & .se-stats__rule {
                height: 1px; background: rgba(255, 255, 255, 0.08);
                margin: 0 ${o("xl")};
            }

            /* Stepper prompts (putts, penalties): the 10+ pad's round ± at a
               slightly smaller size, sharing its palette. */
            & .se-stats__step {
                display: flex; align-items: center; justify-content: center; gap: ${o("xl")};
            }
            & .se-stats__step-btn {
                width: 52px; height: 52px; border-radius: 999px; border: none; cursor: pointer;
                background: #2a2a2a; color: #fff; font-size: 1.6rem; line-height: 1;
                font-family: inherit;
                &:active { background: #3a3a3a; }
            }
            & .se-stats__step-val {
                width: 72px; text-align: center;
                font-family: ${a("font-display")}; font-weight: 700; font-size: 2.1rem;
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
                &.on-hit { background: ${a("primary")}; border-color: ${a("primary")}; color: #fff; }
                &.on-miss { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.45); color: #fff; }
                /* Selected STAT segment: neutral, not green — a stat is an
                   observation, and the plate should not congratulate or scold
                   one. Same paint as on-miss, different meaning. */
                &.on-neutral { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.45); color: #fff; }
                /* Four or five options (first putt) have to fit a 375px plate. */
                &.tight { padding: 18px 4px; font-size: 0.9rem; }
            }

            & .se-stats__foot {
                padding: ${o("md")} ${o("lg")} ${o("xl")};
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
            padding: ${o("sm")} ${o("sm")} ${o("xl")};
            &.hidden { display: none; }

            & .se-pad__ext-row { flex: 1; display: flex; align-items: center; justify-content: center; gap: ${o("xl")}; }
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
            padding: ${o("md")} ${o("xl")}; border-radius: ${a("radius")};
            box-shadow: ${a("shadow-elevated")};
            &.hidden { display: none; }
        }
    `;svc=this.inject(oe);holeIdx=this.svc.holeIdx;modalOpen=this.svc.keypadOpen;currentBallIdx=new p(0);holeCompleteOnEntry=!1;extendedOpen=new p(!1);extendedScore=new p(10);statsOpen=new p(!1);pendingMeta=new p({});lastMetaKey=null;toastMsg=new p(null);dragOffset=new p(0);transitioning=new p(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new $(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[ke(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(n=>[n.id,n]));return e.ballIds.map(n=>t.get(n)).filter(n=>!!n)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>ps(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);hintText=(e,t)=>{const n=this.svc.strokesHintFor(e,t);return n===null?null:n===0?"0":n>0?`-${n}`:`+${-n}`};toParValue=e=>{let t=0,n=0,i=!1;for(const r of this.playedOrder()){const l=this.svc.strokesFor(e.id,r.playHoleId);l!==null&&l>0&&(t+=l,n+=this.parFor(r.playHoleId),i=!0)}return i?t-n:null};hcpLine=e=>{const t=this.ballsInGroup().find(i=>i.id===e);if(!t||t.pending)return null;const n=t.players.length>1?t.courseHandicap:t.players[0]?.courseHandicap??t.courseHandicap;return n===null?null:t.players.length>1?`Team · HCP ${n}`:`HCP ${n}`};toParText=e=>{const t=this.toParValue(e);return t===null?"–":t===0?"E":t>0?`+${t}`:`${t}`};toParClass=e=>{const t=this.toParValue(e);return`se-row__topar ${t===null||t===0?"even":t<0?"under":"over"}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const n=e-t;return n<=-4||n>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(n)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer),this.modalOpen.set(!1)}),this.track(I(()=>{const d=this.ballsInGroup().length;d>0&&this.currentBallIdx.get()>=d&&this.selectBall(0)}));const e=this.wire(ll,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1),this.svc.flushStats()}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const d=this.currentHole();return d?`Hole ${this.occLabel(d.playHoleId)} · Par ${this.parFor(d.playHoleId)}`:""},modalPrev:{onclick:()=>this.stepHole(-1),disabled:()=>!this.svc.canPrevHole()},modalNext:{onclick:()=>this.stepHole(1),disabled:()=>!this.svc.canNextHole()},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>{this.statsOpen.set(!1),this.svc.flushStats()}},statsHole:()=>{const d=this.currentHole();return d?`Hole ${this.occLabel(d.playHoleId)} · Par ${this.parFor(d.playHoleId)}`:""},statsTitle:()=>{const d=this.ballsInGroup()[this.currentBallIdx.get()];return d?this.ballName(d):""},statsScore:()=>{const d=this.ballsInGroup()[this.currentBallIdx.get()],c=this.currentHole();return!d||!c?"":this.displayScore(this.svc.strokesFor(d.id,c.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.svc.flushStats(),this.apply({kind:"statsDone"})}}}),t=this.ref(e,"viewport"),n=this.ref(e,"track");this.bindCarouselPointer(t,n),this.track(I(()=>{n.style.transition=this.transitioning.get()?al:"none",n.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(n,new $(()=>ol),(d,c,u)=>this.holeItem(d,u),d=>d),this.$each(this.ref(e,"rows"),new $(()=>{const d=this.playedOrder(),c=this.holeIndex(),u=d[c];if(!u)return[];const f=c>0?d[c-1].playHoleId:null;return this.ballsInGroup().map(m=>({ball:m,ph:u.playHoleId,prevPh:f}))}),(d,c,u)=>this.playerRow(d.ball,d.ph,d.prevPh,u),d=>`${d.ball.id}|${d.ph}|${d.ball.pending}`),this.$each(this.ref(e,"modalList"),new $(()=>this.ballsInGroup()),(d,c,u)=>this.modalRow(d,c,u),d=>d.id);const i=this.ref(e,"keys");for(const d of[1,2,3,4,5,6,7,8,9])i.appendChild(this.numberKey(d));i.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),i.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),i.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(e,"statsBody"),new $(()=>this.statBodyRows()),(d,c,u)=>this.statBodyRow(d,u),d=>d.key),this.track(I(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null,this.svc.seedStatStep(null);return}const d=this.ballsInGroup()[this.currentBallIdx.get()],c=this.currentHole();if(!d||!c)return;this.seedStatStepForCursor();const u=`${d.id}|${c.playHoleId}`;if(u===this.lastMetaKey)return;this.lastMetaKey=u;const f={};for(const m of this.metaInputs())f[m.key]=this.svc.metadataFor(d.id,c.playHoleId,m.key)===!0;this.pendingMeta.set(f)}));const r=()=>{document.visibilityState==="hidden"&&this.svc.flushStats()},l=()=>this.svc.flushStats();return document.addEventListener("visibilitychange",r),window.addEventListener("pagehide",l),this.track(()=>{document.removeEventListener("visibilitychange",r),window.removeEventListener("pagehide",l),this.svc.flushStats()}),e}holeItem(e,t){return this.wireEl(dl,{item:{className:()=>{const n=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${n?" gone":""}`}},hnum:{textContent:()=>{const n=this.occAtOffset(e);return n?this.occLabel(n.playHoleId):""}},hpar:{textContent:()=>{const n=this.occAtOffset(e);return n?`Par ${this.parFor(n.playHoleId)}`:""}}},t)}playerRow(e,t,n,i){return e.pending?this.wireEl(Ys,{name:{textContent:this.ballName(e),className:"se-row__name se-row__name--pending"},hcp:{textContent:"open seat"},topar:{textContent:"",className:"se-row__topar"},prev:{textContent:""},cval:{textContent:"–"},circle:{className:"se-row__circle empty se-row__circle--pending"}},i):this.wireEl(Ys,{name:{textContent:this.ballName(e)},hcp:{textContent:()=>this.hcpLine(e.id)??"",hidden:()=>this.hcpLine(e.id)===null},topar:{textContent:()=>this.toParText(e),className:()=>this.toParClass(e)},prev:{textContent:()=>n?this.displayScore(this.svc.strokesFor(e.id,n)):""},cval:{textContent:()=>{const r=this.svc.strokesFor(e.id,t);return r!==null?this.displayScore(r):this.hintText(e.id,t)??"–"}},circle:{className:()=>this.svc.strokesFor(e.id,t)!==null?"se-row__circle":this.hintText(e.id,t)!==null?"se-row__circle empty hint":"se-row__circle empty",onclick:()=>this.openModalForBall(e.id)}},i)}modalRow(e,t,n){const i=e.players.length>1?e.courseHandicap:e.players[0]?.courseHandicap??e.courseHandicap,r=i===null?"–":String(i),l=e.pending?"Open seat — claim to score":e.players.length>1?`Team · HCP ${r}`:`HCP ${r}`;return this.wireEl(cl,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.selectBall(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:l},mval:{textContent:()=>{const d=this.currentHole();if(!d)return"–";const c=this.svc.strokesFor(e.id,d.playHoleId);return c!==null?this.displayScore(c):this.hintText(e.id,d.playHoleId)??"–"},className:()=>{const d=this.currentHole();return!!d&&this.svc.strokesFor(e.id,d.playHoleId)===null&&!!d&&this.hintText(e.id,d.playHoleId)!==null?"se-mrow__val se-mrow__val--hint":"se-mrow__val"}}},n)}numberKey(e){return this.wireEl(Qs,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,n,i){return this.wireEl(Qs,{key:{className:n,onclick:i},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(n=>n.id===e);this.selectBall(t<0?0:t),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.noteHoleEntered(),this.modalOpen.set(!0)}selectBall(e){this.currentBallIdx.set(e),this.seedStatStepForCursor()}seedStatStepForCursor(){const e=this.ballsInGroup()[this.currentBallIdx.get()],t=this.currentHole(),n=e?this.svc.statSubject(e):null;this.svc.seedStatStep(n&&t?{playerId:n,playHoleId:t.playHoleId}:null)}advanceState(){const e=this.currentHole();return{balls:this.ballsInGroup().map(t=>({pending:!!t.pending,scored:!!e&&this.svc.strokesFor(t.id,e.playHoleId)!==null})),currentBallIndex:this.currentBallIdx.get(),currentHole:e?{id:e.playHoleId,label:this.occLabel(e.playHoleId)}:null,holeIndex:this.holeIndex(),holeCount:this.playedOrder().length,holeCompleteOnEntry:this.holeCompleteOnEntry,collectsStats:this.metaInputs().length>0||this.svc.statPrompts().length>0}}noteHoleEntered(){this.holeCompleteOnEntry=nl(this.advanceState())}stepHole(e){this.advanceTimer&&(clearTimeout(this.advanceTimer),this.advanceTimer=null),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.svc.flushStats(),e<0?this.svc.prevHole():this.svc.nextHole(),this.selectBall(0),this.noteHoleEntered()}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){this.apply({kind:"score",value:e})}apply(e){this.execute(rl(this.advanceState(),e))}execute(e){const t=e.write;if(t){const i=this.ballsInGroup()[t.ballIndex];i&&this.svc.setScore(i.id,t.holeId,t.value,t.withMetadata?this.metaSnapshot():void 0)}const n=e.move;switch(n.kind){case"noop":case"stay":return;case"moveToBall":this.selectBall(n.ballIndex);return;case"openStats":this.statsOpen.set(!0);return;case"roundComplete":this.flash(n.toast),this.modalOpen.set(!1);return;case"holeComplete":{this.flash(n.toast),this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===n.fromHoleId&&(this.holeIdx.set(ke(n.toHoleIndex,this.playedOrder().length)),this.selectBall(0),this.noteHoleEntered())},n.delayMs);return}}}hasMoreUnscored=()=>{const e=this.currentHole();return il({balls:this.ballsInGroup().map(t=>({pending:!!t.pending,scored:!!e&&this.svc.strokesFor(t.id,e.playHoleId)!==null})),currentBallIndex:this.currentBallIdx.get(),currentHole:e?{id:e.playHoleId}:null})};metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),n={};for(const i of e)n[i.key]=t[i.key]===!0;return n}setMeta(e,t){const n=this.pendingMeta.get();this.pendingMeta.set({...n,[e]:t});const i=this.ballsInGroup()[this.currentBallIdx.get()],r=this.currentHole();if(!i||!r)return;const l=this.svc.strokesFor(i.id,r.playHoleId);l!==null&&this.svc.setScore(i.id,r.playHoleId,l,this.metaSnapshot())}metaChip(e,t){return this.wireEl(ul,{glabel:{textContent:e.label},miss:{className:()=>this.pendingMeta.get()[e.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(e.key,!1)},hit:{className:()=>this.pendingMeta.get()[e.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(e.key,!0)}},t)}metaInputsForStep=()=>{const e=new Set(this.svc.statPrompts().map(t=>t.key));return this.metaInputs().filter(t=>!e.has(t.key))};statBodyRows=()=>{const e=this.metaInputsForStep(),t=this.svc.statPrompts(),n=e.map(i=>({kind:"meta",key:`meta:${i.key}`,input:i}));e.length>0&&t.length>0&&n.push({kind:"rule",key:"rule"});for(const i of t)n.push({kind:"stat",key:`stat:${i.key}`,prompt:i});return n};statBodyRow(e,t){return e.kind==="meta"?this.metaChip(e.input,t):e.kind==="rule"?this.wireEl(ml,{},t):e.prompt.control.kind==="segments"?this.statSegments(e.prompt,t):this.statStepper(e.prompt,t)}statSegments(e,t){const n=e.control,i=n.kind==="segments"?n.options:[],r=i.length>=4?" tight":"",l=this.wireEl(hl,{glabel:{textContent:e.label}},t),d=this.ref(l,"seg");for(const c of i){const u=this.wireEl(pl,{btn:{textContent:c.label,className:()=>`se-seg${r}${this.svc.statValue(e.key)===c.value?" on-neutral":""}`,onclick:()=>this.answerStat(e.key,this.svc.statValue(e.key)===c.value?null:c.value)}},t);d?.appendChild(u)}return l}statStepper(e,t){const n=e.control,i=n.kind==="stepper"?n.min:0,r=n.kind==="stepper"?n.max:null;return this.wireEl(fl,{glabel:{textContent:e.label},minus:{onclick:()=>this.stepStat(e.key,-1),"aria-label":`Fewer ${e.label}`},plus:{onclick:()=>this.stepStat(e.key,1),"aria-label":`More ${e.label}`},val:{textContent:()=>_a(this.svc.statStepperValue(e.key,i),r),className:()=>this.svc.statIsAnswered(e.key)?"se-stats__step-val":"se-stats__step-val unanswered","aria-label":()=>this.svc.statIsAnswered(e.key)?`${e.label} ${this.svc.statStepperValue(e.key,i)}`:`${e.label} not answered`}},t)}answerStat(e,t){this.svc.answerStat(e,t),this.mirrorStatToMeta(e)}stepStat(e,t){this.svc.stepStat(e,t),this.mirrorStatToMeta(e)}mirrorStatToMeta(e){if(!this.metaInputs().some(n=>n.key===e))return;const t=this.svc.statValue(e);t!==null&&this.setMeta(e,t==="1")}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*fe),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(ke(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",i=>{i.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",i=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:i.pointerId,startX:i.clientX,startY:i.clientY,lastX:i.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(i.pointerId))}),e.addEventListener("pointermove",i=>{const r=this.ptr;if(!r||r.id!==i.pointerId)return;const l=i.clientX-r.startX,d=i.clientY-r.startY;if(!r.horiz){if(Math.abs(d)>Math.abs(l)&&Math.abs(d)>8||Math.abs(l)<=8)return;r.horiz=!0}const c=Date.now(),u=Math.max(1,c-r.lastTime);r.velocity=(i.clientX-r.lastX)/u,r.lastX=i.clientX,r.lastTime=c,this.dragOffset.set(l)});const n=i=>{const r=this.ptr;if(!r||r.id!==i.pointerId)return;const l=i.clientX-r.startX,d=r.horiz;if(this.ptr=null,e.releasePointerCapture?.(i.pointerId),!d){this.dragOffset.set(0);return}this.snap(da({dragDistance:l,velocity:r.velocity,itemWidth:fe}))};e.addEventListener("pointerup",n),e.addEventListener("pointercancel",i=>{!this.ptr||this.ptr.id!==i.pointerId||(this.ptr=null,e.releasePointerCapture?.(i.pointerId),this.snap(0))})}}function bl(s,e){const t=[...s].sort((r,l)=>r.canonicalOrdinal-l.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(r=>r.playHoleId))}];const n=[...e].sort((r,l)=>r.fromCanonicalOrdinal-l.fromCanonicalOrdinal),i=[];for(const r of n){const l=t.filter(d=>d.canonicalOrdinal>=r.fromCanonicalOrdinal&&d.canonicalOrdinal<=r.toCanonicalOrdinal);l.length!==0&&i.push({label:r.label,holes:l,playHoleIds:new Set(l.map(d=>d.playHoleId))})}return i}function di(s,e){const t=s.cells.filter(n=>e.has(n.playHoleId));if(s.aggregate==="sum"){const n=t.map(i=>i.value).filter(i=>i!==null);return n.length===0?"—":String(n.reduce((i,r)=>i+r,0))}if(s.aggregate==="last"){for(let n=t.length-1;n>=0;n--){const i=t[n].value;if(i!==null)return Number.isInteger(i)?String(i):i.toFixed(1)}return"—"}return"—"}function _l(s,e){if(s.aggregate==="sum"){const t=s.cells.map(n=>n.value).filter(n=>n!==null);return t.length===0?"—":String(t.reduce((n,i)=>n+i,0))}if(s.aggregate==="last"){const t=e[e.length-1];return t?di(s,t.playHoleIds):"—"}return"—"}function yl(s){const e=s?.marker;if(e){const t=e.tone;return{kind:"marker",template:e.template,tone:t==="success"||t==="warning"||t==="danger"?t:null,label:e.label?e.label:null,teamFill:s?.team??null}}return s?.team?{kind:"pill",team:s.team}:{kind:"plain"}}function vl(s){return s.filter(e=>!(e.startsWith("slot #")||/^HCP -?\d/.test(e)||/^PH -?\d/.test(e)))}const bt=" & ";function ci(s){return s.componentId??"default-score-grid"}function fs(s,e,t,n={}){const i=bl(s.holes,e),r=n.mode??"product",l=s.rows.map(d=>{const c=new Map(d.cells.map(u=>[u.playHoleId,u]));return{kind:d.kind,emphasis:d.emphasis===!0,team:d.team??null,subjectName:d.subjectBallId?t(d.subjectBallId):null,labelText:d.label,groups:i.map(u=>({cells:u.holes.map(f=>{const m=c.get(f.playHoleId);return{text:m?.display??"",title:m?.title?m.title:null,decoration:yl(m)}}),subtotal:di(d,u.playHoleIds)})),total:_l(d,i)}});return{componentId:ci(s),subjectBallIds:[...s.subjectBallIds],title:{groups:s.title.groups.map(d=>d.map(c=>t(c))),joiner:s.title.joiner,nameJoiner:bt},subtitleFacts:r==="verification"?[...s.subtitleFacts]:vl(s.subtitleFacts),footnotes:[...s.footnotes],caption:s.caption??null,totals:s.totals.map(d=>({label:d.label,value:String(d.value??"—")})),columnGroups:i.map(d=>({label:d.label,columns:d.holes.map(c=>({label:c.occurrenceLabel}))})),hasTotalColumn:i.length>1,rows:l}}function Mt(s){return[...new Set(s)].sort().join("\0")}function wl(s,e){const t=new Map;e.forEach((i,r)=>{if(i.ballIds.length===0)return;const l=Mt(i.ballIds);t.set(l,t.has(l)?null:r)});const n=new Map;for(const i of s){if(i.subjectBallIds.length===0)continue;const r=Mt(i.subjectBallIds);n.set(r,(n.get(r)??0)+1)}return s.map(i=>{if(i.subjectBallIds.length===0)return{kind:"standalone"};const r=Mt(i.subjectBallIds);if((n.get(r)??0)!==1)return{kind:"standalone"};const l=t.get(r);return l==null?{kind:"standalone"}:{kind:"attached",entryIndex:l}})}function xl(s,e){const t=new Set(s.map(e));return t.size!==1?null:[...t][0]??null}function $l(s,e){if(s===void 0)return null;const t=e==="high"?-s:s;return{text:t===0?"E":t>0?`+${t}`:`−${Math.abs(t)}`,tone:t===0?"even":t>0?"over":"under"}}const kl=()=>null;function Sl(s,e,t=kl){return{kind:"ranked",metricLabel:s.metricLabel,hasPace:s.entries.some(n=>n.paceDelta!==void 0),entries:s.entries.map(n=>({position:n.position,lead:n.position===1,name:n.ballIds.map(e).join(bt),group:xl(n.ballIds,t),total:String(n.total??"—"),holesPlayed:n.holesPlayed,pace:$l(n.paceDelta,s.direction)}))}}function Tl(s,e){return{kind:"match_summary",title:s.title,matches:s.matches.map(t=>({sideAName:t.sideA.ballIds.map(e).join(bt),sideBName:t.sideB.ballIds.map(e).join(bt),leader:t.leader,standing:t.magnitude===0?"AS":`${t.magnitude} UP`,status:t.finished?"Final":`thru ${t.thru}`}))}}function es(s,e){return[s,...[...new Set(e)].sort()].join("|")}const Il=new Map;function Pl(s){const e=s.cards??[],t=(s.leaderboard??[]).find(l=>l.kind==="ranked")??null;if(!t)return{rankedSection:null,slotDefId:s.slotDefId,attached:Il,standalone:[...e]};const n=wl(e,t.entries),i=new Map,r=[];return e.forEach((l,d)=>{const c=n[d],u=c?.kind==="attached"?t.entries[c.entryIndex]:void 0;if(!u){r.push(l);return}i.set(es(s.slotDefId,u.ballIds),l)}),{rankedSection:t,slotDefId:s.slotDefId,attached:i,standalone:r}}class Cl{open=new Set;isOpen(e){return this.open.has(e)}toggle(e){return this.set(e,!this.open.has(e))}set(e,t){return t?this.open.add(e):this.open.delete(e),t}keys(){return[...this.open].sort()}retain(e){const t=new Set(e);for(const n of[...this.open])t.has(n)||this.open.delete(n)}}const ms={ring:{meaning:"a single-unit decided result",fill:"#d63b2f",visual:"red filled circle — the Gamebook birdie mark (score to par −1)"},double_ring:{meaning:"a two-unit decided result; more emphatic than a ring",fill:"#e0862c",teamFillBorder:"border-width: 3px; border-style: double;",visual:"orange filled circle (score to par −2); doubled white border when team-filled"},diamond:{meaning:"a rare / high-magnitude decided result — the strongest form",fill:"#e0b41f",visual:"yellow filled circle — hole-in-one / albatross territory"},dot:{meaning:"a lightweight per-hole flag where a full ring would be too heavy",visual:"the bare base shape (no fill, no border) — inherits cell colour"},badge:{meaning:"a labelled status needing short text or a number, not just a shape",rule:["width: auto; min-width: 1.8em;","padding-left: 0.45em; padding-right: 0.45em;","border: 2px solid currentColor;"],tones:{success:"#267348",warning:"#946200",danger:"#9b332a"},visual:"outline pill in the tone colour, text inside"},square:{meaning:"a one-step negative score relation",fill:"#5b9bd5",boxy:!0,visual:"light-blue filled square (score to par +1)"},double_square:{meaning:"a stronger negative score relation",fill:"#1f4e79",boxy:!0,visual:"dark-blue filled square (score to par +2)"},box_badge:{meaning:"an angular labelled state that must not read as a round marker",fill:"#1f4e79",boxy:!0,visual:"dark-blue filled square carrying its value (+3 or worse)"}};function Ke(s){return`lb-mark--${s}`}const Fe=()=>Object.entries(ms);function ui(s){return s.join(`
            `)}function Ft(s,e){return s.map((t,n)=>`& .${Ke(t)}${n===s.length-1?` { ${e} }`:","}`)}function El(){const s=[];s.push("/* Outline forms keep currentColor + tone tints. */");for(const[r,l]of Fe())if(!(!l.rule&&!l.tones)){if(l.rule){s.push(`& .${Ke(r)} {`);for(const d of l.rule)s.push(`    ${d}`);s.push("}")}for(const[d,c]of Object.entries(l.tones??{}))s.push(`& .${Ke(r)}.lb-mark-tone--${d} { color: ${c}; }`)}s.push("/* Filled forms — declared after the tone rules so white text wins. */");const e=Fe().filter(([,r])=>r.boxy).map(([r])=>r),t=[],n=new Set;for(const[r,l]of Fe()){if(l.fill===void 0||n.has(r))continue;const d=Fe().filter(([,c])=>c.fill===l.fill).map(([c])=>c);for(const c of d)n.add(c);t.push({fill:l.fill,ids:d})}let i=-1;if(e.length>0){const r=t.findIndex(l=>l.ids.some(d=>ms[d].boxy));i=r===-1?t.length:r}return t.forEach((r,l)=>{l===i&&s.push(...Ft(e,"border-radius: 3px;")),s.push(...Ft(r.ids,`background: ${r.fill}; color: #fff;`))}),i===t.length&&s.push(...Ft(e,"border-radius: 3px;")),ui(s)}function Nl(){const s=[];for(const[e,t]of Fe()){if(!t.teamFillBorder)continue;const n=Ke(e);s.push(`& .${n}.lb-mark-fill--a,`,`& .${n}.lb-mark-fill--b { ${t.teamFillBorder} }`)}return ui(s)}const hi=()=>null;function L(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Rl(s){return s.kind==="si"?"lb-c-si":s.kind==="given"?"lb-c-given":s.kind==="status"?"lb-c-status":s.kind==="category"?"lb-c-cat":""}function Ol(s){const e=[s.kind==="category"?"lb-r-cat":`lb-r-${s.kind}`];return(s.kind==="si"||s.kind==="given")&&e.push("lb-r-dim"),s.team&&e.push(`lb-team-${s.team}`),e.join(" ")}function zl(s,e,t){const n=s.title!==null?` title="${L(s.title)}"`:"",i=t(L(s.text)),r=s.decoration;let l;if(r.kind==="marker"){const d=r.tone?` lb-mark-tone--${r.tone}`:"",c=r.teamFill?` lb-mark-fill--${r.teamFill}`:"",u=r.label!==null?` title="${L(r.label)}" aria-label="${L(r.label)}"`:"";l=`<span class="lb-mark ${Ke(r.template)}${d}${c}"${u}>${i}</span>`}else r.kind==="pill"?l=`<span class="lb-pill lb-pill--${r.team}">${i}</span>`:l=i;return`<td class="${Rl(e)}"${n}>${l}</td>`}function gs(s,e){const t=m=>{const h=s.columnGroups[m],b=`<tr><th class="lb-rowlabel">Hole</th>${h.columns.map(x=>`<th>${L(x.label)}</th>`).join("")}<th class="lb-sum">${L(h.label)}</th></tr>`,g=s.rows.map(x=>{const O=he=>x.emphasis?`<strong>${he}</strong>`:he,D=x.groups[m],P=D.cells.map(he=>zl(he,x,O)).join(""),B=`<td class="lb-sum">${O(D.subtotal)}</td>`,q=x.subjectName!==null?L(x.subjectName)+(x.labelText?" "+L(x.labelText):""):L(x.labelText);return`<tr class="${Ol(x)}"><th class="lb-rowlabel">${q}</th>${P}${B}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${b}</thead><tbody>${g}</tbody></table></div>`},n=s.columnGroups.map((m,h)=>t(h)).join(""),i=s.title.groups.map(m=>m.map(h=>L(h)).join(s.title.nameJoiner)).filter(Boolean).join(s.title.joiner),r=s.subtitleFacts.length?`<div class="lb-card__sub">${s.subtitleFacts.map(L).join(" · ")}</div>`:"",l=e.mode==="verification"&&s.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${s.footnotes.map(m=>`<span class="lb-card__note">${L(m)}</span>`).join("")}</div>`:"",d=e.mode==="verification"&&s.caption?`<p class="lb-card__caption">${L(s.caption)}</p>`:"",c=s.totals.length?`<ul class="lb-card__totals">${s.totals.map(m=>`<li>${L(m.label)} = <strong>${m.value}</strong></li>`).join("")}</ul>`:"",u=i?`<header class="lb-card__head"><h4>${i}</h4>${r}</header>`:r;return`<article class="${e.cardModifier?`lb-card ${e.cardModifier}`:"lb-card"}">
  ${u}
  ${n}
  ${l}${d}${c}
</article>`}function Ll(s,e,t,n){return gs(fs(s,e,t,n),n)}function Hl(s,e,t,n){return gs(fs(s,e,t,n),{...n,cardModifier:"lb-card--compact-match"})}function Al(s,e,t,n){return gs(fs(s,e,t,n),{...n,cardModifier:"lb-card--category-matrix"})}function Ml(s){return s.pace===null?'<td class="lb-rank__pace"></td>':`<td class="lb-rank__pace lb-rank__pace--${s.pace.tone}">${L(s.pace.text)}</td>`}function Fl(s){return`lb-panel-${s.replace(/[^a-zA-Z0-9_-]+/g,"-")}`}function jl(s,e,t=hi,n=null){const i=Sl(s,e,t),r=i.hasPace,l=n!==null,d=(r?5:4)+(l?1:0),c=i.entries.map((b,g)=>{const x=b.group?` <span class="lb-rank__group">${L(b.group)}</span>`:"",O=`
  <td class="lb-rank__total">${b.total}</td>${r?`
  ${Ml(b)}`:""}
  <td class="lb-rank__thru">${b.holesPlayed}</td>`,D=s.entries[g],P=n&&D?n.plan.attached.get(es(n.plan.slotDefId,D.ballIds)):void 0;if(!n)return`<tr class="${b.lead?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${b.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${L(b.name)}</span>${x}</span></td>${O}
</tr>`;if(!D||!P)return`<tr class="${b.lead?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${b.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${L(b.name)}</span>${x}</span></td>${O}
  <td class="lb-rank__disclosure"></td>
</tr>`;const B=es(n.plan.slotDefId,D.ballIds),q=n.isOpen(B),he=Fl(B),Ki=pi(P,n.routeSections,e,{mode:n.mode??"product"}),Ct=["lb-rank__row--expandable"];return b.lead&&Ct.push("lb-rank__lead"),q&&Ct.push("lb-rank__row--open"),`<tr class="${Ct.join(" ")}" data-expand-key="${L(B)}">
  <td class="lb-rank__pos">${b.position}</td>
  <td class="lb-rank__who"><button type="button" class="lb-rank__toggle" aria-expanded="${q}" aria-controls="${L(he)}"><span class="lb-rank__whobox"><span class="lb-rank__name">${L(b.name)}</span>${x}</span></button></td>${O}
  <td class="lb-rank__disclosure"><span class="lb-rank__chev" aria-hidden="true"></span></td>
</tr>
<tr class="lb-rank__panel${q?" lb-rank__panel--open":""}" data-panel-key="${L(B)}">
  <td class="lb-rank__panelcell" colspan="${d}"><div class="lb-rank__panelwrap" id="${L(he)}"><div class="lb-rank__panelbox">${Ki}</div></div></td>
</tr>`}).join(""),u=r?`
      <col class="lb-rank__col-pace">`:"",f=r?'<th class="lb-rank__pace">Pace</th>':"",m=l?`
      <col class="lb-rank__col-disclosure">`:"",h=l?'<th class="lb-rank__disclosure" aria-label="Scorecard"></th>':"";return`<div class="lb-section">
  <h4 class="lb-section__title">${L(i.metricLabel)}</h4>
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
</div>`}function Dl(s,e){const t=Tl(s,e),n=t.matches.map(i=>{const r=i.leader==="a"?" lb-mp__team--lead":"",l=i.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${r}">${L(i.sideAName)}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${L(i.standing)}</span><span class="lb-mp__status">${L(i.status)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${l}">${L(i.sideBName)}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${L(t.title)}</h4>${n}
</div>`}const Bl={ranked:jl,match_summary:(s,e)=>Dl(s,e)},Gl={"default-score-grid":Ll,"compact-match-grid":Hl,"category-matrix-grid":Al};function ql(s){return`<div class="lb-diag">Unrenderable result section <code>${L(s)}</code> — no generic view yet. Results are not hidden.</div>`}function Vl(s){return`<div class="lb-diag">Unsupported score-grid component <code>${L(s)}</code> — no generic view yet. Results are not hidden.</div>`}function Ul(s,e,t,n=null){const i=Bl[s.kind];return i?i(s,e,t,n):ql(s.kind)}function pi(s,e,t,n){const i=ci(s),r=Gl[i];return r?r(s,e,t,n):Vl(i)}function fi(s,e,t=hi,n=null){return s.leaderboard.length===0&&s.cards.length===0?`<div class="lb-empty">No scores entered yet for ${L(s.formatLabel)}.</div>`:s.leaderboard.map(r=>Ul(r,e,t,n&&r===n.plan.rankedSection?n:null)).join("")||`<div class="lb-empty">No leaderboard metric for ${L(s.formatLabel)}.</div>`}function mi(s,e,t,n={}){if(s.length===0)return"";const i=n.mode??"product";return s.map(r=>pi(r,e,t,{mode:i})).join(`
`)}const Kl=_(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class gi extends E{static styles=`
        .lb {
            /* Horizontal gutters come from the host panel (.round-view__main
               already pads lg) — padding here would double-indent every
               section relative to the page header and waste table width. */
            padding: ${o("lg")} 0 ${o("2xl")};

            & .lb__status {
                color: ${a("text-muted")};
                padding: ${o("xl")} 0;
                text-align: center;
                &.hidden { display: none; }
            }

            & .lb-empty {
                color: ${a("text-muted")};
                padding: ${o("xl")} 0;
                text-align: center;
            }
            & .lb-diag {
                ${C()}
                padding: ${o("md")} ${o("lg")};
                color: ${a("error")};
                font-size: 0.85rem;
                margin-bottom: ${o("md")};
                & code { font-family: ui-monospace, monospace; }
            }

            /* Ranked metric + match-summary sections. */
            & .lb-section { margin-bottom: ${o("xl")}; }
            & .lb-section__title {
                margin: 0 0 ${o("sm")};
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
                color: ${a("text-muted")};
                font-weight: 700;
                line-height: 1;
                padding: 0 ${o("sm")};
                border-bottom: 1px solid ${a("border")};
            }
            & .lb-rank tbody td {
                height: 2.25rem;
                padding: 0 ${o("sm")};
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
                margin-left: ${o("xs")};
                flex: none;
                white-space: nowrap;
            }
            & .lb-rank__thru { text-align: right; color: ${a("text-muted")}; }

            /* --- Gamebook expansion: a ranked row whose scorecard folds under it.
               The row is tappable anywhere; the button inside the name cell is
               the real control (aria-expanded / aria-controls). The chevron has
               its own final column so it aligns at the board's right edge. */
            & .lb-rank__row--expandable { cursor: pointer; }
            & .lb-rank__toggle {
                display: flex;
                align-items: baseline;
                gap: ${o("xs")};
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
                outline: 2px solid ${a("accent")};
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
                border-right: 2px solid ${a("text-muted")};
                border-bottom: 2px solid ${a("text-muted")};
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
                border-bottom: 1px solid ${a("border")};
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
                background: ${a("surface-sunken")};
                border-radius: 0;
                margin: 0;
                padding: ${o("sm")} ${o("sm")} ${o("md")};
            }
            & .lb-rank__panelbox .lb-card__head h4 { display: none; }
            & .lb-rank__panelbox .lb-grid .lb-rowlabel { background: ${a("surface-sunken")}; }
            @media (prefers-reduced-motion: reduce) {
                & .lb-rank__panelwrap,
                & .lb-rank__chev { transition: none; }
            }
            & .lb-rank__lead td { background: ${a("accent-soft")}; }
            & .lb-rank__lead .lb-rank__pos { color: ${a("accent")}; }

            /* Structured match panel: two team blocks + a centre standing. */
            & .lb-mp {
                display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch;
                border: 1px solid ${a("border")}; border-radius: 10px; overflow: hidden;
                margin-top: ${o("sm")};
            }
            & .lb-mp__team {
                padding: ${o("sm")} ${o("md")}; font-weight: 700; font-size: 0.9rem;
                display: flex; align-items: center;
            }
            & .lb-mp__team--a { color: #c2452f; }
            & .lb-mp__team--b { color: #2c6cae; justify-content: flex-end; text-align: right; }
            & .lb-mp__team--a.lb-mp__team--lead { background: #c2452f; color: #fff; }
            & .lb-mp__team--b.lb-mp__team--lead { background: #2c6cae; color: #fff; }
            & .lb-mp__center {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                padding: ${o("xs")} ${o("md")}; gap: 1px;
            }
            & .lb-mp__standing { font-size: 1.25rem; font-weight: 800; line-height: 1; }
            & .lb-mp__status { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.04em; color: ${a("text-muted")}; }

            /* Format-aware scorecard cards. */
            & .lb-cards__head {
                margin: ${o("xl")} 0 ${o("md")};
                font-family: ${a("font-display")};
                font-weight: 600;
                font-size: 1.1rem;
                color: ${a("text")};
            }
            & .lb-card {
                ${C()}
                padding: ${o("md")};
                margin-bottom: ${o("lg")};
            }
            & .lb-card--compact-match {
                border-color: color-mix(in srgb, ${a("accent")} 28%, ${a("border")});
                padding-top: ${o("sm")};
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
            & .lb-card__head { margin-bottom: ${o("sm")}; }
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
            & .lb-card__scroll + .lb-card__scroll { margin-top: ${o("sm")}; }
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
            /* The final cell carries a short route-section label (OUT / IN / TOT),
               not arbitrary content. It may safely paint beyond its tight cell
               instead of inheriting the generic header ellipsis. */
            & .lb-grid thead .lb-sum { overflow: visible; text-overflow: clip; }
            & .lb-grid .lb-rowlabel {
                text-align: left;
                width: 6em;
                position: sticky;
                left: 0;
                background: ${a("surface")};
                font-weight: 600;
                color: ${a("text")};
            }
            /* Route section labels such as OUT must fit whole; the shared cell
               padding otherwise leaves too little usable width and ellipsizes it. */
            & .lb-grid .lb-sum { width: 3em; font-weight: 700; background: ${a("surface-sunken")}; }
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
            ${El()}
            /* Deciding ball whose score is decorated: the marker's own shape gets
               the team fill — white number and white outline on the team colour.
               Declared AFTER the shape fills so the team colour wins. The white
               border + outer box-shadow halo are load-bearing: without them a
               filled bonus ring is indistinguishable from the plain standing
               pill (the score-to-par shapes above carry no outline). */
            & .lb-mark-fill--a, & .lb-mark-fill--b { border: 2px solid #fff; }
            ${Nl()}
            & .lb-mark-fill--a { background: #c2452f; color: #fff; box-shadow: 0 0 0 2.5px #c2452f; }
            & .lb-mark-fill--b { background: #2c6cae; color: #fff; box-shadow: 0 0 0 2.5px #2c6cae; }
            & .lb-card__caption { margin: ${o("sm")} 0 0; font-size: 0.72rem; font-style: italic; color: ${a("text-muted")}; }
            & .lb-card__notes { margin: ${o("sm")} 0 0; font-size: 0.72rem; color: ${a("text-muted")}; }
            & .lb-card__notes-label {
                display: block; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.04em; font-size: 0.68rem; margin-bottom: 2px;
            }
            & .lb-card__note { display: block; }
            & .lb-card__totals {
                list-style: none; margin: ${o("sm")} 0 0; padding: 0;
                display: flex; flex-wrap: wrap; gap: ${o("md")};
                font-size: 0.85rem; color: ${a("text")};
            }
        }
    `;svc=this.inject(oe);expansion=new Cl;slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots(),t=this.svc.selectedSlotDefId();return e.find(n=>n.slotDefId===t)??e[0]??null};render(){return this.wire(Kl,{status:{className:()=>{const t=this.svc.resultLoading.get(),n=this.svc.result.get()===null;return t||n?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody(),onclick:t=>this.onBodyClick(t),onkeydown:t=>this.onBodyKeydown(t)}})}rowFor(e){return e.target?.closest?.("tr[data-expand-key]")??null}onBodyClick(e){const t=this.rowFor(e);if(!t||(window.getSelection?.()?.toString()??"")!=="")return;const n=t.getAttribute("data-expand-key")??"";this.applyOpen(t,this.expansion.toggle(n))}onBodyKeydown(e){if(e.key!=="Escape")return;const t=this.rowFor(e);if(!t)return;const n=t.getAttribute("data-expand-key")??"";this.expansion.isOpen(n)&&(this.applyOpen(t,this.expansion.set(n,!1)),t.querySelector(".lb-rank__toggle")?.focus(),e.stopPropagation())}applyOpen(e,t){e.classList.toggle("lb-rank__row--open",t),e.querySelector(".lb-rank__toggle")?.setAttribute("aria-expanded",String(t));const n=e.nextElementSibling;n?.classList.contains("lb-rank__panel")&&n.classList.toggle("lb-rank__panel--open",t)}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const n=u=>{const f=this.svc.nameOf(u);return this.svc.isPending(u)?`${f} (open seat)`:f},i=u=>this.svc.groupLabelOf(u),r=Pl(t);this.expansion.retain(r.attached.keys());const l=fi(t,n,i,{plan:r,routeSections:e.routeSections,isOpen:u=>this.expansion.isOpen(u)}),d=mi(r.standalone,e.routeSections,n),c=d?`<h3 class="lb-cards__head">Scorecard</h3>${d}`:"";return l+c}}function Wl(s,e){if(!e)return[];const t=[],n=new Set;for(const i of s)for(const r of i.players){if(r.playerId===e)return[];r.guestPlayerId===null||n.has(r.guestPlayerId)||(n.add(r.guestPlayerId),t.push({guestPlayerId:r.guestPlayerId,displayName:r.displayName}))}return t}const Yl=_(`
    <div bind="root" class="claim-card hidden">
        <span class="claim-card__label">Played here as a guest?</span>
        <p class="claim-card__hint">Claim your scores — the round lands on your profile's card.</p>
        <div bind="rows" class="claim-card__rows"></div>
        <p bind="err" class="claim-card__err"></p>
    </div>
`),Ql=_(`
    <div class="claim-card__row">
        <span bind="name" class="claim-card__name"></span>
        <button bind="claim" class="claim-card__btn" type="button">This is me</button>
    </div>
`);class Xl extends E{static styles=`
        .claim-card {
            margin-top: ${o("lg")};
            padding: ${o("lg")};
            ${C()}
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
                margin: ${o("sm")} 0 0;
                font-size: 0.8rem;
                color: ${a("text-muted")};
            }
            & .claim-card__rows {
                display: flex;
                flex-direction: column;
                gap: ${o("sm")};
                margin-top: ${o("md")};
            }
            & .claim-card__row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${o("md")};
            }
            & .claim-card__name { font-weight: 600; font-size: 0.95rem; }
            & .claim-card__btn {
                ${w()}
                padding: ${o("sm")} ${o("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${a("primary")};
                color: ${a("primary-text")};
                border: none;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .claim-card__err {
                margin: ${o("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(oe);auth=this.inject(j);router=this.inject(M);tokenQ=this.router.query("token");claiming=new p(!1);error=new p("");claimable(){return Wl(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async claim(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.claiming.set(!0);try{await v.friendlyRounds.claimGuest({token:t,guestPlayerId:e}),await this.svc.loadByToken(t)}catch(n){this.error.set(n instanceof K&&n.status===409?"Already claimed — or you already play in this round under your account.":n instanceof K&&n.status===404?"That guest is no longer claimable on this round.":"Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}render(){const e=this.wire(Yl,{root:{className:()=>this.claimable().length>0?"claim-card":"claim-card hidden"},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.claimable(),(t,n,i)=>this.wireEl(Ql,{name:()=>t.displayName,claim:{disabled:()=>this.claiming.get(),onclick:()=>{this.claim(t.guestPlayerId)}}},i),t=>t.guestPlayerId),e}}function jt(s){return typeof s=="object"&&s!==null&&typeof s.get=="function"}const k=s=>`var(--${s})`,Xs="http://www.w3.org/2000/svg";function Jl(){const s=document.createElementNS(Xs,"svg");s.setAttribute("width","12"),s.setAttribute("height","8"),s.setAttribute("viewBox","0 0 12 8"),s.setAttribute("fill","none"),s.setAttribute("aria-hidden","true"),s.setAttribute("focusable","false");const e=document.createElementNS(Xs,"path");return e.setAttribute("d","M1 1.5 6 6.5 11 1.5"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","1.5"),e.setAttribute("stroke-linecap","round"),e.setAttribute("stroke-linejoin","round"),e.setAttribute("fill","none"),s.appendChild(e),s}const Ge=class Ge extends E{constructor(){super(...arguments),this.uid=`ui-select-${Ge.seq++}`,this.open=new p(!1),this.highlightIndex=new p(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}get isMulti(){return this.props.multiple===!0}get multi(){return this.props}get single(){return this.props}currentOptions(){return jt(this.props.options)?this.props.options.get():this.props.options}selectedValues(){if(this.isMulti)return this.multi.values.get();const e=this.single.value.get();return e?[e]:[]}placeholderText(){const e=this.props.placeholder;return(typeof e=="function"?e():e)??""}formatCount(e){return this.multi.countLabel?this.multi.countLabel(e):String(e)}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50,n=this.isMulti;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const i=document.createElement("span");i.className="ui-select__trigger-label",this.triggerEl.appendChild(i);const r=document.createElement("span");r.className="ui-select__chevron",r.appendChild(Jl()),r.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(r),this.triggerEl.addEventListener("click",d=>{d.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",d=>{this.handleTriggerKeydown(d)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",d=>{this.handleDropdownKeydown(d)}),this.listEl=document.createElement("div"),this.listEl.className="ui-select__list",this.listEl.setAttribute("role","listbox"),n&&this.listEl.setAttribute("aria-multiselectable","true"),this.dropdownEl.appendChild(this.listEl),n&&(this.countEl=document.createElement("div"),this.countEl.className="ui-select__count",this.countEl.setAttribute("role","status"),this.countEl.setAttribute("aria-live","polite"),this.dropdownEl.appendChild(this.countEl)),e.appendChild(this.dropdownEl);const l=d=>{this.optionEls=[],this.listEl.textContent="";for(let c=0;c<d.length;c++){const u=d[c],f=document.createElement("button");if(f.className=n?"ui-select__option ui-select__option--multi":"ui-select__option",f.setAttribute("type","button"),f.id=`${this.uid}-opt-${c}`,u.disabled){f.classList.add("ui-select__option--header"),f.disabled=!0,f.setAttribute("role","presentation"),f.setAttribute("aria-disabled","true");const h=document.createElement("span");h.className="ui-select__option-label",h.textContent=u.label,f.appendChild(h),this.listEl.appendChild(f),this.optionEls.push(f);continue}if(f.setAttribute("role","option"),n){const h=document.createElement("span");h.className="ui-select__checkbox",h.setAttribute("aria-hidden","true"),f.appendChild(h)}if(u.icon){const h=document.createElement("span");h.className="ui-select__option-icon",h.textContent=u.icon,f.appendChild(h)}const m=document.createElement("span");if(m.className="ui-select__option-label",m.textContent=u.label,f.appendChild(m),!n){const h=document.createElement("span");h.className="ui-select__check",h.setAttribute("aria-hidden","true"),f.appendChild(h)}f.addEventListener("click",h=>{h.stopPropagation(),this.chooseOption(u.value)}),f.addEventListener("mouseenter",()=>{this.highlightIndex.set(c)}),this.listEl.appendChild(f),this.optionEls.push(f)}};return jt(this.props.options)?this.track(I(()=>{l(this.currentOptions())})):l(this.props.options),this.track(I(()=>{const d=this.currentOptions(),c=this.selectedValues();if(n){const u=c.length;if(u>0)i.textContent=this.formatCount(u),this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const f=this.placeholderText();i.textContent=f,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!f)}this.countEl&&(this.countEl.textContent=this.formatCount(u))}else{const u=this.single.value.get(),f=d.find(m=>m.value===u);if(f)i.textContent=f.icon?`${f.icon} ${f.label}`:f.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const m=this.placeholderText();i.textContent=m,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!m)}}for(let u=0;u<d.length;u++){const f=this.optionEls[u];if(!f||d[u].disabled)continue;const m=c.includes(d[u].value);f.setAttribute("aria-selected",String(m)),f.classList.toggle("ui-select__option--selected",m);const h=f.querySelector(".ui-select__check");h&&(h.textContent=m?"✓":"");const b=f.querySelector(".ui-select__checkbox");b&&(b.textContent=m?"✓":"")}})),this.track(I(()=>{const d=this.open.get();this.dropdownEl.classList.toggle("open",d),r.classList.toggle("ui-select__chevron--open",d),this.triggerEl.setAttribute("aria-expanded",String(d)),d?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),d&&U(()=>{const c=this.currentOptions(),u=this.selectedValues(),f=c.findIndex(h=>!h.disabled&&u.includes(h.value)),m=c.findIndex(h=>!h.disabled);this.highlightIndex.set(f>=0?f:m)})})),this.track(I(()=>{const d=this.highlightIndex.get();for(let c=0;c<this.optionEls.length;c++)this.optionEls[c].classList.toggle("ui-select__option--highlighted",c===d);d>=0&&this.optionEls[d]&&(this.triggerEl.setAttribute("aria-activedescendant",`${this.uid}-opt-${d}`),this.optionEls[d].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(jt(this.props.disabled)?this.track(I(()=>{const d=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",d),this.triggerEl.disabled=d})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}chooseOption(e){if(this.isMulti){const t=this.multi.values.get();this.multi.values.set(t.includes(e)?t.filter(n=>n!==e):[...t,e]);return}qe(()=>{this.single.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}commitHighlighted(){const e=this.highlightIndex.get(),t=this.currentOptions();e>=0&&e<t.length&&!t[e].disabled&&this.chooseOption(t[e].value)}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.open.get()?this.commitHighlighted():this.open.set(!0);break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":e.preventDefault(),this.commitHighlighted();break;case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=this.currentOptions();if(t.length===0||!t.some(i=>!i.disabled))return;let n=this.highlightIndex.get();do n+=e,n<0&&(n=t.length-1),n>=t.length&&(n=0);while(t[n].disabled);this.highlightIndex.set(n)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};Ge.styles=`
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
            gap: ${k("space-2")};
            padding: 10px 34px 10px 12px;
            min-width: 160px;
            width: 100%;
            border: 1px solid ${k("border")};
            border-bottom: 2px solid ${k("border-strong")};
            border-radius: ${k("radius-sm")};
            background: ${k("bg")};
            color: ${k("text")};
            font-family: ${k("font-ui")};
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
            transition:
                border-color ${k("dur-fast")} ${k("ease-standard")},
                box-shadow ${k("dur-fast")} ${k("ease-standard")},
                background ${k("dur-fast")} ${k("ease-standard")};
        }
        .ui-select__trigger:focus-visible {
            outline: none;
            border-color: ${k("accent")};
            background: ${k("surface")};
            box-shadow: 0 0 0 3px ${k("accent-soft")};
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
            color: ${k("text-muted")};
            transition: transform ${k("dur-fast")} ${k("ease-standard")};
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
            background: ${k("surface")};
            border: 1px solid ${k("border")};
            border-radius: ${k("radius-md")};
            box-shadow: ${k("shadow-2")};
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity ${k("dur-base")} ${k("ease-standard")},
                        transform ${k("dur-base")} ${k("ease-standard")};
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
            gap: ${k("space-2")};
            padding: ${k("space-2")} ${k("space-3")};
            cursor: pointer;
            color: ${k("text")};
            font-family: ${k("font-ui")};
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
            background: ${k("surface-2")};
        }
        .ui-select__option--selected {
            color: ${k("accent-strong")};
            font-weight: 600;
        }
        /* Multi-select: selection is a checkbox plus an accent-tinted fill,
           never weight and colour alone. */
        .ui-select__option--multi.ui-select__option--selected {
            background: ${k("accent-soft")};
        }
        .ui-select__option--multi.ui-select__option--selected.ui-select__option--highlighted {
            background: ${k("accent-soft")};
            box-shadow: inset 2px 0 0 ${k("accent")};
        }
        .ui-select__checkbox {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            border: 1px solid ${k("border-strong")};
            border-radius: 3px;
            background: ${k("surface")};
            font-size: 0.625rem;
            line-height: 1;
            color: ${k("on-accent")};
        }
        .ui-select__option--selected .ui-select__checkbox {
            background: ${k("accent")};
            border-color: ${k("accent")};
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
            color: ${k("accent-strong")};
        }
        .ui-select__count {
            padding: ${k("space-2")} ${k("space-3")};
            border-top: 1px solid ${k("border")};
            font-family: ${k("font-ui")};
            font-size: 0.75rem;
            font-weight: 600;
            color: ${k("text-muted")};
        }
    `,Ge.seq=0;let te=Ge;function Zl(s){if(!s)return{visible:!1,selfAllowed:!1,guestAllowed:!1,blockedMessage:null};const e=s.seats.length>0,t=s.claimedSeats.some(r=>r.viewerMayRelease),n=s.viewer.claimSeat.allowed,i=s.viewer.claimSeatAsGuest.allowed;return{visible:e||t,selfAllowed:e&&n,guestAllowed:e&&i,blockedMessage:e&&!n&&!i?s.viewer.claimSeat.message??s.viewer.claimSeatAsGuest.message??"Claiming seats is not available on this round.":null}}function ed(s,e){const t=[];if(s.groupId!==null&&e.length>0){const n=e.findIndex(i=>i.id===s.groupId);if(n>=0){t.push(`Group ${n+1}`);const i=e[n].startTime;i.includes(":")&&t.push(i)}}return s.category!==null&&t.push(s.category),t.join(" · ")}function td(s){return(s?.claimedSeats??[]).filter(e=>e.viewerMayRelease)}const sd=_(`
    <div bind="root" class="seat-card hidden">
        <span class="seat-card__label">Who's playing?</span>
        <p bind="hint" class="seat-card__hint">This round has open seats — claim one to score.</p>
        <p bind="blocked" class="seat-card__blocked hidden"></p>
        <div bind="rows" class="seat-card__rows"></div>
        <div bind="releaseRows" class="seat-card__rows"></div>
        <p bind="err" class="seat-card__err"></p>
    </div>
`),nd=_(`
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
`),id=_(`
    <div class="seat-card__release">
        <span class="seat-card__who">
            <span bind="name" class="seat-card__name"></span>
            <span bind="context" class="seat-card__context"></span>
        </span>
        <button bind="release" class="seat-card__btn seat-card__btn--ghost" type="button">Not me — release</button>
    </div>
`);class rd extends E{static styles=`
        .seat-card {
            margin-top: ${o("lg")};
            padding: ${o("lg")};
            ${C()}
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
                margin: ${o("sm")} 0 0;
                font-size: 0.8rem;
                color: ${a("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__blocked {
                margin: ${o("md")} 0 0;
                font-size: 0.85rem;
                color: ${a("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__rows {
                display: flex;
                flex-direction: column;
                gap: ${o("sm")};
                margin-top: ${o("md")};
                &:empty { display: none; }
            }
            & .seat-card__seat {
                padding: ${o("sm")} 0;
                border-bottom: 1px solid ${a("border")};
                &:last-child { border-bottom: 0; padding-bottom: 0; }
            }
            & .seat-card__head, & .seat-card__release {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${o("md")};
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
                ${w()}
                padding: ${o("sm")} ${o("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${a("primary")};
                color: ${a("primary-text")};
                border: none;
                flex-shrink: 0;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .seat-card__btn--wide { width: 100%; margin-top: ${o("sm")}; }
            & .seat-card__btn--ghost {
                background: transparent;
                color: ${a("accent")};
                border: 1px solid ${a("border")};
                font-weight: 600;
            }
            & .seat-card__form {
                margin-top: ${o("md")};
                &.hidden { display: none; }
            }
            & .seat-card__guest {
                margin-top: ${o("sm")};
                display: flex;
                flex-direction: column;
                gap: ${o("sm")};
                &.hidden { display: none; }
            }
            & .seat-card__guest-row {
                display: flex;
                gap: ${o("sm")};
                align-items: center;
            }
            & .seat-card__input {
                width: 100%;
                padding: ${o("sm")};
                font: inherit;
                font-size: 0.9rem;
                border: 1px solid ${a("border")};
                border-radius: 8px;
                background: ${a("surface")};
                color: ${a("text")};
            }
            & .seat-card__input--hcp { width: 6rem; flex-shrink: 0; }
            & .seat-card__gender { flex: 1; }
            & .seat-card__tee { margin-bottom: ${o("sm")}; }
            & .seat-card__diag {
                margin: ${o("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("text-muted")};
                &.hidden { display: none; }
            }
            & .seat-card__err {
                margin: ${o("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(oe);auth=this.inject(j);router=this.inject(M);tokenQ=this.router.query("token");claiming=new p(!1);error=new p("");diagnostics=new p([]);expandedSeat=new p(null);teeId=new p("");tees=new p([]);loadedForCourseId=null;guestName=new p("");guestHcp=new p("");guestGender=new p("M");state(){return Zl(this.svc.startList.get())}ensureTeesLoaded(){if(!this.state().visible)return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,v.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}toggleSeat(e){this.diagnostics.set([]),this.error.set(""),this.expandedSeat.set(this.expandedSeat.get()===e?null:e)}guestHcpValue(){const e=Number.parseFloat(this.guestHcp.get().replace(",","."));return Number.isFinite(e)?e:null}async claim(e,t,n){const i=this.tokenQ.get(),r=this.teeId.get();if(!(!i||!r||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const l=await v.friendlyRounds.claimSeat({token:i,seatId:e,identity:t,teeId:r,clientEventId:n});l.ok?(this.expandedSeat.set(null),this.guestName.set(""),this.guestHcp.set(""),await this.svc.loadByToken(i)):this.diagnostics.set(l.diagnostics)}catch{this.error.set("Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}async claimSelf(e){const t=this.auth.currentUser.get()?.id??"anon";await this.claim(e,{kind:"self"},`claim-seat:${e}:${t}:${this.teeId.get()}`)}async claimGuest(e){const t=this.guestName.get().trim(),n=this.guestHcpValue();!t||n===null||await this.claim(e,{kind:"guest",name:t,handicapIndex:n,gender:this.guestGender.get()==="F"?"F":"M"},crypto.randomUUID())}async release(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const n=await v.friendlyRounds.releaseSeat({token:t,seatId:e,clientEventId:crypto.randomUUID()});n.ok?await this.svc.loadByToken(t):this.diagnostics.set(n.diagnostics)}catch{this.error.set("Could not release right now. Try again.")}finally{this.claiming.set(!1)}}}seatRow(e,t){const n=()=>this.expandedSeat.get()===e.seatId&&this.state().blockedMessage===null,i=this.wireEl(nd,{label:()=>e.label,context:()=>ed(e,this.svc.groups()),toggle:{textContent:()=>this.expandedSeat.get()===e.seatId?"Close":"Claim",disabled:()=>this.state().blockedMessage!==null,onclick:()=>this.toggleSeat(e.seatId)},form:{className:()=>n()?"seat-card__form":"seat-card__form hidden"},selfBtn:{className:()=>this.state().selfAllowed?"seat-card__btn seat-card__btn--wide":"seat-card__btn seat-card__btn--wide hidden",disabled:()=>this.claiming.get()||!this.teeId.get(),onclick:()=>{this.claimSelf(e.seatId)}},guestBox:{className:()=>this.state().guestAllowed?"seat-card__guest":"seat-card__guest hidden"},guestName:{oninput:d=>this.guestName.set(d.target.value)},guestHcp:{oninput:d=>this.guestHcp.set(d.target.value)},guestBtn:{disabled:()=>this.claiming.get()||!this.teeId.get()||this.guestName.get().trim()===""||this.guestHcpValue()===null,onclick:()=>{this.claimGuest(e.seatId)}},diag:{className:()=>this.diagnostics.get().length>0?"seat-card__diag":"seat-card__diag hidden",textContent:()=>this.diagnostics.get().map(d=>d.message).join(" · ")}},t),r=new te({value:this.teeId,options:{get:()=>this.tees.get().map(d=>({value:d.id,label:d.name}))},placeholder:"Tee"});r.mount(this.ref(i,"teeHost")),t(()=>r.destroy());const l=new te({value:this.guestGender,options:{get:()=>[{value:"M",label:"Men’s tee rating"},{value:"F",label:"Women’s tee rating"}]},placeholder:"Rating"});return l.mount(this.ref(i,"genderHost")),t(()=>l.destroy()),i}render(){this.track(I(()=>this.ensureTeesLoaded()));const e=this.wire(sd,{root:{className:()=>this.state().visible?"seat-card":"seat-card hidden"},hint:{className:()=>(this.svc.startList.get()?.seats.length??0)>0&&this.state().blockedMessage===null?"seat-card__hint":"seat-card__hint hidden"},blocked:{className:()=>this.state().blockedMessage!==null?"seat-card__blocked":"seat-card__blocked hidden",textContent:()=>this.state().blockedMessage??""},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.svc.startList.get()?.seats??[],(t,n,i)=>this.seatRow(t,i),t=>t.seatId),this.$each(this.ref(e,"releaseRows"),()=>td(this.svc.startList.get()),(t,n,i)=>this.wireEl(id,{name:()=>t.displayName,context:()=>`holds “${t.seatLabel}”`,release:{disabled:()=>this.claiming.get(),onclick:()=>{this.release(t.seatId)}}},i),t=>t.seatId),e}}function od(s,e,t){if(!e||t!=="not_started")return!1;for(const n of s)for(const i of n.players)if(i.playerId===e)return!1;return!0}function ad(s){if(!s)return{visible:!1,blockedMessage:null};const e=s.viewer.join;return e.allowed?{visible:!0,blockedMessage:null}:e.code==="window_not_open"||e.code==="window_closed"?{visible:!0,blockedMessage:e.message??"Sign-up is closed right now."}:{visible:!1,blockedMessage:null}}const Js="new";function ld(s,e=!0){const t=s.map((i,r)=>{const l=i.ballIds.length,d=[`Group ${r+1}`];return i.startTime.includes(":")&&d.push(i.startTime),{value:i.id,label:`${d.join(" · ")} — ${l} of ${i.capacity}`,disabled:l>=i.capacity}}),n=t.find(i=>!i.disabled);return e&&t.push({value:Js,label:"Start a new group",disabled:!1}),{options:t,defaultValue:n?.value??(e?Js:"")}}const dd=_(`
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
`);class cd extends E{static styles=`
        .join-card {
            margin-top: ${o("lg")};
            padding: ${o("lg")};
            ${C()}
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
                margin: ${o("sm")} 0 0;
                font-size: 0.8rem;
                color: ${a("text-muted")};
            }
            & .join-card__blocked {
                margin: ${o("md")} 0 0;
                font-size: 0.85rem;
                color: ${a("text-muted")};
                &.hidden { display: none; }
            }
            & .join-card__group {
                margin-top: ${o("md")};
                &.hidden { display: none; }
            }
            & .join-card__group-label {
                display: block;
                font-size: 0.8rem;
                color: ${a("text-muted")};
                margin-bottom: ${o("xs")};
            }
            & .join-card__row {
                display: flex;
                align-items: center;
                gap: ${o("md")};
                margin-top: ${o("md")};
                &.hidden { display: none; }
            }
            & .join-card__tee { flex: 1; }
            & .join-card__btn {
                ${w()}
                padding: ${o("sm")} ${o("lg")};
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
                margin: ${o("sm")} 0 0;
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
                margin: ${o("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(oe);auth=this.inject(j);router=this.inject(M);tokenQ=this.router.query("token");joining=new p(!1);error=new p("");diagnostics=new p([]);teeId=new p("");tees=new p([]);loadedForCourseId=null;groupChoice=new p("");policyState(){return ad(this.svc.startList.get())}eligible(){return this.policyState().visible&&od(this.svc.balls.get(),this.auth.currentUser.get()?.id??null,this.svc.round.get()?.status??null)}ensureTeesLoaded(){if(!this.eligible())return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,v.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}needsProfileUpdate(){return this.diagnostics.get().some(e=>e.code==="missing_gender"||e.code==="missing_handicap_index")}async join(){const e=this.tokenQ.get(),t=this.teeId.get();if(!(!e||!t||this.joining.get())){this.error.set(""),this.diagnostics.set([]),this.joining.set(!0);try{const n=this.groupChoice.get(),i=await v.friendlyRounds.join({token:e,teeId:t,...n?{groupChoice:n}:{}});i.ok?await this.svc.loadByToken(e):this.diagnostics.set(i.diagnostics)}catch(n){this.error.set(n instanceof K&&n.status===409?n.message??"You already play in this round, or it has already started.":"Could not join right now. Try again.")}finally{this.joining.set(!1)}}}render(){this.track(I(()=>this.ensureTeesLoaded()));const e=new $(()=>ld(this.svc.groups(),this.svc.startList.get()?.viewer.createGroup.allowed??!0));this.track(I(()=>{const r=e.get(),l=this.groupChoice.get();(!l||!r.options.some(d=>d.value===l&&!d.disabled))&&this.groupChoice.set(r.defaultValue)}));const t=this.wire(dd,{root:{className:()=>this.eligible()?"join-card":"join-card hidden"},blocked:{className:()=>this.policyState().blockedMessage!==null?"join-card__blocked":"join-card__blocked hidden",textContent:()=>this.policyState().blockedMessage??""},groupRow:{className:()=>this.svc.groups().length>0&&this.policyState().blockedMessage===null?"join-card__group":"join-card__group hidden"},row:{className:()=>this.policyState().blockedMessage===null?"join-card__row":"join-card__row hidden"},join:{disabled:()=>this.joining.get()||!this.teeId.get(),onclick:()=>{this.join()}},diag:{className:()=>this.diagnostics.get().length>0?"join-card__diag":"join-card__diag hidden"},diagText:{textContent:()=>this.diagnostics.get().map(r=>r.message).join(" · ")},profileLink:{className:()=>this.needsProfileUpdate()?"join-card__profile-link":"join-card__profile-link hidden",onclick:()=>this.router.navigate("/profile")},err:{textContent:()=>this.error.get()}}),n=new te({value:this.teeId,options:{get:()=>this.tees.get().map(r=>({value:r.id,label:r.name}))},placeholder:"Tee"});n.mount(this.ref(t,"teeHost")),this.track(()=>n.destroy());const i=new te({value:this.groupChoice,options:{get:()=>e.get().options},placeholder:"Group"});return i.mount(this.ref(t,"groupHost")),this.track(()=>i.destroy()),t}}const Zs=1440*60*1e3;function ud(s,e){if(s===null)return!0;const t=new Date(s).getTime();return!Number.isFinite(t)||t-e>Zs?!0:e-t>=Zs}function hd(s,e){if(!e)return!1;for(const t of s)for(const n of t.players)if(n.playerId===e)return!0;return!1}function pd(s){const e={visible:!1,index:null};return s.settled||!s.profileLoaded||!s.firstOpen||!hd(s.balls,s.playerId)||!ud(s.handicapConfirmedAt,s.now)?e:{visible:!0,index:s.handicapIndex}}function ie(s){const e=s.trim().replace(",",".");if(e==="")return null;const t=e.startsWith("+"),n=Number.parseFloat(t?e.slice(1):e);return Number.isFinite(n)?t?-n:n:null}function _t(s){return s<0?`+${String(-s)}`:String(s)}const fd=_(`
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
`);class md extends E{static styles=`
        .hcp-checkin {
            margin-bottom: ${o("lg")};
            padding: ${o("md")} ${o("lg")};
            ${C()}
            background: ${a("surface-sunken")};

            &.hidden { display: none; }

            & .hcp-checkin__ask {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${o("md")};
                flex-wrap: wrap;
                &.hidden { display: none; }
            }
            & .hcp-checkin__question {
                font-size: 0.9rem;
                color: ${a("text")};
            }
            & .hcp-checkin__actions {
                display: flex;
                align-items: center;
                gap: ${o("sm")};
                flex-shrink: 0;
            }
            & .hcp-checkin__editor {
                &.hidden { display: none; }
            }
            & .hcp-checkin__label {
                display: block;
                font-size: 0.8rem;
                color: ${a("text-muted")};
                margin-bottom: ${o("xs")};
            }
            & .hcp-checkin__row {
                display: flex;
                align-items: center;
                gap: ${o("sm")};
            }
            & .hcp-checkin__field {
                ${X()}
                flex: 1;
                min-width: 0;
                font-family: inherit;
            }
            & .hcp-checkin__hint {
                margin: ${o("xs")} 0 0;
                font-size: 0.78rem;
                color: ${a("text-muted")};
            }
            & .hcp-checkin__btn {
                ${w()}
                padding: ${o("sm")} ${o("lg")};
                font-family: inherit;
                font-weight: 700;
                font-size: 0.85rem;
                background: ${a("primary")};
                color: ${a("primary-text")};
                border: none;
                flex-shrink: 0;
                &:disabled { opacity: 0.5; cursor: default; }
            }
            & .hcp-checkin__btn--ghost {
                ${w()}
                padding: ${o("sm")} ${o("lg")};
                font-weight: 700;
                font-size: 0.85rem;
                background: transparent;
                color: ${a("text-muted")};
                border: 1px solid ${a("border")};
            }
            & .hcp-checkin__err {
                margin: ${o("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("error")};
                &:empty { display: none; }
            }
        }
    `;svc=this.inject(oe);auth=this.inject(j);profile=this.inject(Je);settled=new p(!1);editing=new p(!1);text=new p("");busy=new p(!1);error=new p("");state(){const e=this.profile.player.get();return pd({playerId:this.auth.currentUser.get()?.id??null,balls:this.svc.balls.get(),firstOpen:this.svc.firstOpen.get(),handicapConfirmedAt:e?.handicapConfirmedAt??null,handicapIndex:e?.handicapIndex??null,profileLoaded:e!==null,settled:this.settled.get(),now:Date.now()})}ensureProfileLoaded(){this.settled.get()||this.svc.firstOpen.get()&&this.auth.currentUser.get()&&this.svc.balls.get().length&&this.profile.load()}async confirm(){if(this.busy.get())return;this.error.set(""),this.busy.set(!0);const e=await this.profile.confirmHandicap();this.busy.set(!1),e?this.settled.set(!0):this.error.set("Could not save that right now. Try again.")}startEdit(){const e=this.profile.player.get()?.handicapIndex??null;this.text.set(e===null?"":_t(e)),this.error.set(""),this.editing.set(!0)}async save(){if(this.busy.get())return;const e=ie(this.text.get());if(e===null){this.error.set("Enter a handicap index, e.g. 18.4 or +2.4.");return}this.error.set(""),this.busy.set(!0);const t=await this.profile.saveIndex(e);this.busy.set(!1),t?(this.editing.set(!1),this.settled.set(!0)):this.error.set("Could not save that right now. Try again.")}render(){return this.track(I(()=>this.ensureProfileLoaded())),this.wire(fd,{root:{className:()=>this.state().visible?"hcp-checkin":"hcp-checkin hidden"},ask:{className:()=>this.editing.get()?"hcp-checkin__ask hidden":"hcp-checkin__ask"},question:{textContent:()=>{const e=this.state().index;return e===null?"No handicap set — add one?":`Handicap ${_t(e)} — still right?`}},confirm:{textContent:()=>this.state().index===null?"Not now":"Yes",disabled:()=>this.busy.get(),onclick:()=>{this.confirm()}},edit:{textContent:()=>this.state().index===null?"Add":"Update",disabled:()=>this.busy.get(),onclick:()=>this.startEdit()},editor:{className:()=>this.editing.get()?"hcp-checkin__editor":"hcp-checkin__editor hidden"},field:{value:()=>this.text.get(),oninput:e=>this.text.set(e.target.value)},save:{disabled:()=>this.busy.get(),onclick:()=>{this.save()}},cancel:{disabled:()=>this.busy.get(),onclick:()=>this.editing.set(!1)},err:{textContent:()=>this.error.get()}})}}function gd(s,e){if(!e)return!1;for(const t of s)for(const n of t.players)if(n.playerId===e)return!0;return!1}const bd=_(`
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
`);class _d extends E{static styles=`
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
                background: ${a("surface")};
                border-top-left-radius: 16px; border-top-right-radius: 16px;
                /* Clear the iOS home indicator; harmless zero elsewhere. */
                padding: ${o("sm")} ${o("lg")} calc(${o("xl")} + env(safe-area-inset-bottom));
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
            }

            & .rmanage__head {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${o("md")};
                padding: ${o("sm")} 0 ${o("md")};
            }
            & .rmanage__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 600; font-size: 1.25rem;
                color: ${a("text")};
            }
            & .rmanage__close {
                min-height: 44px;
                padding: 0 ${o("md")};
                background: none; border: none;
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                color: ${a("text-muted")};
                cursor: pointer;
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .rmanage__row {
                display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
                width: 100%;
                min-height: 44px;
                margin-top: ${o("sm")};
                padding: ${o("md")};
                text-align: left;
                background: none;
                border: 1px solid ${a("border")};
                border-radius: ${a("radius")};
                font-family: inherit;
                color: ${a("text")};
                cursor: pointer;

                &.hidden { display: none; }
                &:hover, &:active { border-color: ${a("text-muted")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
                &:disabled { opacity: 0.5; cursor: default; }

                & .rmanage__row-title { font-size: 0.95rem; font-weight: 700; }
                & .rmanage__row-sub { font-size: 0.8rem; font-weight: 400; color: ${a("text-muted")}; }
            }

            /* Danger rows read in the terracotta family — a quiet ghost, never
               a filled CTA (same treatment the old delete/leave buttons had). */
            & .rmanage__row--danger {
                color: ${a("danger")};
                &:hover, &:active { border-color: ${a("danger")}; }
                &:focus-visible { outline-color: ${a("danger")}; }
            }

            & .rmanage__diag {
                margin: ${o("md")} 0 0;
                font-size: 0.85rem;
                color: ${a("text-muted")};
                &:empty { display: none; }
            }
            & .rmanage__err {
                margin: ${o("sm")} 0 0;
                font-size: 0.85rem;
                color: ${a("danger")};
                &:empty { display: none; }
            }
        }

        /* App-level accessibility override for the framework confirm dialogs
           this sheet spawns. */
        @media (prefers-reduced-motion: reduce) {
            .ui-confirm { transition: none; }
        }
    `;svc=this.inject(oe);auth=this.inject(j);router=this.inject(M);tokenQ=this.router.query("token");editable=new p(!1);deleteOpen=new p(!1);finishOpen=new p(!1);finishAsReopen=new p(!1);leaveOpen=new p(!1);leaving=new p(!1);error=new p("");diagnostics=new p([]);isComplete(){return this.svc.round.get()?.status==="complete"}canLeave(){return gd(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}clear(){this.error.set(""),this.diagnostics.set([])}async leave(){const e=this.tokenQ.get();if(!(!e||this.leaving.get())){this.clear(),this.leaving.set(!0);try{const t=await v.friendlyRounds.leave({token:e});t.ok?await this.svc.loadByToken(e):this.diagnostics.set(t.diagnostics)}catch{this.error.set("Could not remove you right now. Try again.")}finally{this.leaving.set(!1)}}}render(){this.track(I(()=>{const r=this.tokenQ.get();this.editable.set(!1),r&&v.friendlyRounds.setup({token:r}).then(l=>{this.tokenQ.get()===r&&this.editable.set(l.editable===!0)}).catch(()=>{})})),this.track(I(()=>{this.props.open.get()&&this.clear()}));const e=this.wire(bd,{root:{className:()=>this.props.open.get()?"rmanage":"rmanage hidden"},backdrop:{onclick:()=>this.props.open.set(!1)},close:{onclick:()=>this.props.open.set(!1)},editRow:{className:()=>this.editable.get()?"rmanage__row":"rmanage__row hidden",onclick:()=>{const r=this.tokenQ.get();r&&(this.props.open.set(!1),this.router.navigate("/create",{query:{token:r}}))}},leaveRow:{className:()=>this.canLeave()?"rmanage__row rmanage__row--danger":"rmanage__row rmanage__row--danger hidden",onclick:()=>this.leaveOpen.set(!0),disabled:()=>this.leaving.get()},finishRow:{onclick:()=>{this.finishAsReopen.set(this.isComplete()),this.finishOpen.set(!0)},disabled:()=>this.svc.finishing.get()},finishTitle:()=>this.isComplete()?"Reopen round":"Finish round",finishSub:()=>this.isComplete()?"Move it back to your ongoing rounds.":"Move it to your finished rounds. Nothing is locked.",deleteRow:{onclick:()=>this.deleteOpen.set(!0),disabled:()=>this.svc.deleting.get()},diag:{textContent:()=>this.diagnostics.get().map(r=>r.message).join(" · ")},err:{textContent:()=>this.error.get()}});this.spawn(Z,this.ref(e,"deleteConfirmHost"),{open:this.deleteOpen,title:"Delete round?",message:"This permanently removes the round and all its scores for everyone. This can't be undone.",confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.clear(),this.svc.deleteRound().then(r=>{r?this.router.navigate("/"):this.error.set("Could not delete the round. Try again.")})}}),this.spawn(Z,this.ref(e,"finishConfirmHost"),{open:this.finishOpen,title:()=>this.finishAsReopen.get()?"Reopen this round?":"Finish this round?",message:()=>this.finishAsReopen.get()?"It'll move back to your ongoing rounds.":"It'll move to your finished rounds. You can still edit or reopen it any time.",confirmLabel:()=>this.finishAsReopen.get()?"Reopen round":"Finish round",cancelLabel:"Cancel",onconfirm:()=>{this.clear(),(this.finishAsReopen.get()?this.svc.reopenRound():this.svc.finishRound()).then(l=>{l||this.error.set("Could not update the round. Try again.")})}}),this.spawn(Z,this.ref(e,"leaveConfirmHost"),{open:this.leaveOpen,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.leave()}});let t=null;const n=this.ref(e,"close");this.track(I(()=>{this.props.open.get()?(t=document.activeElement instanceof HTMLElement?document.activeElement:null,queueMicrotask(()=>n.focus())):t&&(t.focus(),t=null)}));const i=r=>{if(r.key==="Escape"){if(this.deleteOpen.get())return void this.deleteOpen.set(!1);if(this.finishOpen.get())return void this.finishOpen.set(!1);if(this.leaveOpen.get())return void this.leaveOpen.set(!1);this.props.open.get()&&this.props.open.set(!1)}};return window.addEventListener("keydown",i),this.track(()=>window.removeEventListener("keydown",i)),e}}const yd=["last5","last10","last20","thisYear","all","custom"];function en(s){switch(s){case"last5":return"Last 5 rounds";case"last10":return"Last 10 rounds";case"last20":return"Last 20 rounds";case"thisYear":return"This year";case"all":return"All rounds";case"custom":return"Custom"}}function vd(s){switch(s){case"last5":return"Your five most recent rounds with stats";case"last10":return"Enough rounds for percentages to settle";case"last20":return"A season's worth of form";case"thisYear":return"Every round dated this calendar year";case"all":return"Everything you have ever recorded";case"custom":return"Pick dates, courses and rounds by hand"}}function bi(s){switch(s){case"last5":return 5;case"last10":return 10;case"last20":return 20;default:return null}}const Dt={from:null,to:null,courseIds:[],venueTypes:[],roundTypes:[],excludedRoundIds:[]};function wd(s){return s.from===null&&s.to===null&&s.courseIds.length===0&&s.venueTypes.length===0&&s.roundTypes.length===0&&s.excludedRoundIds.length===0}function xd(s,e){return!(s.from!==null&&e.date<s.from||s.to!==null&&e.date>s.to||s.courseIds.length>0&&!s.courseIds.includes(e.courseId)||s.venueTypes.length>0&&!s.venueTypes.includes(e.venueType)||s.roundTypes.length>0&&!s.roundTypes.includes(e.roundType)||s.excludedRoundIds.includes(e.roundId))}function Bt(s,e,t){const n=s[e],i=n.includes(t)?n.filter(r=>r!==t):[...n,t];return{...s,[e]:i}}function $d(s,e,t){const n=s.excludedRoundIds.includes(e);return t===!n?s:{...s,excludedRoundIds:t?s.excludedRoundIds.filter(i=>i!==e):[...s.excludedRoundIds,e]}}function St(s){return[...s].sort((e,t)=>e.date===t.date?e.roundId>t.roundId?-1:e.roundId<t.roundId?1:0:e.date>t.date?-1:1)}function _i(s){return`${s.getFullYear()}-`}function kd(s,e,t,n){const i=St(t);switch(s){case"last5":case"last10":case"last20":{const r=bi(s);return r===null?i:i.slice(0,r)}case"thisYear":{const r=_i(n);return i.filter(l=>l.date.startsWith(r))}case"all":return i;case"custom":return i.filter(r=>xd(e,r))}}function Sd(s){const{preset:e,filter:t,loaded:n,hasMore:i,now:r}=s;if(!i)return!1;switch(e){case"last5":case"last10":case"last20":{const l=bi(e);return l===null?!1:n.length<l}case"thisYear":{const l=`${_i(r)}01-01`;return!n.some(d=>d.date<l)}case"all":return!0;case"custom":{if(wd(t))return!1;if(t.from===null)return!0;const l=t.from;return!n.some(d=>d.date<l)}}}const Td="Unnamed course";function Id(s){const e=new Map,t=new Map;for(const n of s)e.set(n.courseId,(e.get(n.courseId)??0)+1),!t.has(n.courseId)&&n.courseName&&t.set(n.courseId,n.courseName);return[...e.keys()].map(n=>({id:n,name:t.get(n)??Td,roundCount:e.get(n)??0})).sort((n,i)=>{const r=n.name.localeCompare(i.name,void 0,{sensitivity:"base"});return r!==0?r:n.id<i.id?-1:n.id>i.id?1:0})}const ts="last10";function Pd(s){return yd.includes(s)}const yi=Xe("tapscore.stats.window.v1",{decode:s=>Pd(s)?s:ts,encode:s=>s,empty:ts});function Cd(s=W()){return yi.read(s)}function tn(s,e=W()){yi.write(s,e)}function H(s,e){return{value:e===0?null:s/e,n:s,d:e}}const ss=5;function Ee(s,e=ss){return s.d===0?"absent":s.d>=e?"percentage":"fraction"}const ns=Object.freeze({teeRecorded:0,fairwayHits:0,inPlayHits:0,troubleCount:0,girRecorded:0,girHits:0,firstPuttRecorded:0,firstPuttInside1m:0,firstPutt1To2m:0,firstPutt2To4m:0,firstPutt4To8m:0,firstPuttOver8m:0,firstPuttInside1mResolved:0,firstPutt1To2mResolved:0,firstPutt2To4mResolved:0,firstPutt4To8mResolved:0,firstPuttOver8mResolved:0,onePuttInside1m:0,onePutt1To2m:0,onePutt2To4m:0,onePutt4To8m:0,onePuttOver8m:0,puttsRecorded:0,puttsTotal:0,threePutts:0,threePuttsFromOver8m:0,scrambleAttemptsStandard:0,scrambleSuccessesStandard:0,scrambleAttemptsHard:0,scrambleSuccessesHard:0,scrambleFirstPuttStandard:0,scrambleInside2mStandard:0,scrambleFirstPuttHard:0,scrambleInside2mHard:0,scrambleHoledStandard:0,scrambleHoledHard:0,penaltiesRecorded:0,penaltiesTotal:0,recoveryAttempts:0,recoverySuccesses:0,holesScored:0,strokesTotal:0,parTotal:0,holesScoredPar3:0,strokesPar3:0,holesScoredPar4:0,strokesPar4:0,holesScoredPar5:0,strokesPar5:0,doubleBogeyPlus:0,girHolesScored:0,birdiesOnGir:0,bounceBackOpportunities:0,bounceBackSuccesses:0,holesScoredFairway:0,strokesVsParFairway:0,holesScoredInPlay:0,strokesVsParInPlay:0,holesScoredTrouble:0,strokesVsParTrouble:0,girRecordedFairway:0,girHitsFairway:0,girRecordedInPlay:0,girHitsInPlay:0,girRecordedTrouble:0,girHitsTrouble:0,girFirstPuttRecorded:0,girFirstPuttInside1m:0,girFirstPutt1To2m:0,girFirstPutt2To4m:0,girFirstPutt4To8m:0,girFirstPuttOver8m:0,puttsRecordedGir:0,puttsTotalGir:0,puttsTotalInside1mResolved:0,puttsTotal1To2mResolved:0,puttsTotal2To4mResolved:0,puttsTotal4To8mResolved:0,puttsTotalOver8mResolved:0});function Ed(s,e){return{teeRecorded:s.teeRecorded+e.teeRecorded,fairwayHits:s.fairwayHits+e.fairwayHits,inPlayHits:s.inPlayHits+e.inPlayHits,troubleCount:s.troubleCount+e.troubleCount,girRecorded:s.girRecorded+e.girRecorded,girHits:s.girHits+e.girHits,firstPuttRecorded:s.firstPuttRecorded+e.firstPuttRecorded,firstPuttInside1m:s.firstPuttInside1m+e.firstPuttInside1m,firstPutt1To2m:s.firstPutt1To2m+e.firstPutt1To2m,firstPutt2To4m:s.firstPutt2To4m+e.firstPutt2To4m,firstPutt4To8m:s.firstPutt4To8m+e.firstPutt4To8m,firstPuttOver8m:s.firstPuttOver8m+e.firstPuttOver8m,firstPuttInside1mResolved:s.firstPuttInside1mResolved+e.firstPuttInside1mResolved,firstPutt1To2mResolved:s.firstPutt1To2mResolved+e.firstPutt1To2mResolved,firstPutt2To4mResolved:s.firstPutt2To4mResolved+e.firstPutt2To4mResolved,firstPutt4To8mResolved:s.firstPutt4To8mResolved+e.firstPutt4To8mResolved,firstPuttOver8mResolved:s.firstPuttOver8mResolved+e.firstPuttOver8mResolved,onePuttInside1m:s.onePuttInside1m+e.onePuttInside1m,onePutt1To2m:s.onePutt1To2m+e.onePutt1To2m,onePutt2To4m:s.onePutt2To4m+e.onePutt2To4m,onePutt4To8m:s.onePutt4To8m+e.onePutt4To8m,onePuttOver8m:s.onePuttOver8m+e.onePuttOver8m,puttsRecorded:s.puttsRecorded+e.puttsRecorded,puttsTotal:s.puttsTotal+e.puttsTotal,threePutts:s.threePutts+e.threePutts,threePuttsFromOver8m:s.threePuttsFromOver8m+e.threePuttsFromOver8m,scrambleAttemptsStandard:s.scrambleAttemptsStandard+e.scrambleAttemptsStandard,scrambleSuccessesStandard:s.scrambleSuccessesStandard+e.scrambleSuccessesStandard,scrambleAttemptsHard:s.scrambleAttemptsHard+e.scrambleAttemptsHard,scrambleSuccessesHard:s.scrambleSuccessesHard+e.scrambleSuccessesHard,scrambleFirstPuttStandard:s.scrambleFirstPuttStandard+e.scrambleFirstPuttStandard,scrambleInside2mStandard:s.scrambleInside2mStandard+e.scrambleInside2mStandard,scrambleFirstPuttHard:s.scrambleFirstPuttHard+e.scrambleFirstPuttHard,scrambleInside2mHard:s.scrambleInside2mHard+e.scrambleInside2mHard,scrambleHoledStandard:s.scrambleHoledStandard+e.scrambleHoledStandard,scrambleHoledHard:s.scrambleHoledHard+e.scrambleHoledHard,penaltiesRecorded:s.penaltiesRecorded+e.penaltiesRecorded,penaltiesTotal:s.penaltiesTotal+e.penaltiesTotal,recoveryAttempts:s.recoveryAttempts+e.recoveryAttempts,recoverySuccesses:s.recoverySuccesses+e.recoverySuccesses,holesScored:s.holesScored+e.holesScored,strokesTotal:s.strokesTotal+e.strokesTotal,parTotal:s.parTotal+e.parTotal,holesScoredPar3:s.holesScoredPar3+e.holesScoredPar3,strokesPar3:s.strokesPar3+e.strokesPar3,holesScoredPar4:s.holesScoredPar4+e.holesScoredPar4,strokesPar4:s.strokesPar4+e.strokesPar4,holesScoredPar5:s.holesScoredPar5+e.holesScoredPar5,strokesPar5:s.strokesPar5+e.strokesPar5,doubleBogeyPlus:s.doubleBogeyPlus+e.doubleBogeyPlus,girHolesScored:s.girHolesScored+e.girHolesScored,birdiesOnGir:s.birdiesOnGir+e.birdiesOnGir,bounceBackOpportunities:s.bounceBackOpportunities+e.bounceBackOpportunities,bounceBackSuccesses:s.bounceBackSuccesses+e.bounceBackSuccesses,holesScoredFairway:s.holesScoredFairway+e.holesScoredFairway,strokesVsParFairway:s.strokesVsParFairway+e.strokesVsParFairway,holesScoredInPlay:s.holesScoredInPlay+e.holesScoredInPlay,strokesVsParInPlay:s.strokesVsParInPlay+e.strokesVsParInPlay,holesScoredTrouble:s.holesScoredTrouble+e.holesScoredTrouble,strokesVsParTrouble:s.strokesVsParTrouble+e.strokesVsParTrouble,girRecordedFairway:s.girRecordedFairway+e.girRecordedFairway,girHitsFairway:s.girHitsFairway+e.girHitsFairway,girRecordedInPlay:s.girRecordedInPlay+e.girRecordedInPlay,girHitsInPlay:s.girHitsInPlay+e.girHitsInPlay,girRecordedTrouble:s.girRecordedTrouble+e.girRecordedTrouble,girHitsTrouble:s.girHitsTrouble+e.girHitsTrouble,girFirstPuttRecorded:s.girFirstPuttRecorded+e.girFirstPuttRecorded,girFirstPuttInside1m:s.girFirstPuttInside1m+e.girFirstPuttInside1m,girFirstPutt1To2m:s.girFirstPutt1To2m+e.girFirstPutt1To2m,girFirstPutt2To4m:s.girFirstPutt2To4m+e.girFirstPutt2To4m,girFirstPutt4To8m:s.girFirstPutt4To8m+e.girFirstPutt4To8m,girFirstPuttOver8m:s.girFirstPuttOver8m+e.girFirstPuttOver8m,puttsRecordedGir:s.puttsRecordedGir+e.puttsRecordedGir,puttsTotalGir:s.puttsTotalGir+e.puttsTotalGir,puttsTotalInside1mResolved:s.puttsTotalInside1mResolved+e.puttsTotalInside1mResolved,puttsTotal1To2mResolved:s.puttsTotal1To2mResolved+e.puttsTotal1To2mResolved,puttsTotal2To4mResolved:s.puttsTotal2To4mResolved+e.puttsTotal2To4mResolved,puttsTotal4To8mResolved:s.puttsTotal4To8mResolved+e.puttsTotal4To8mResolved,puttsTotalOver8mResolved:s.puttsTotalOver8mResolved+e.puttsTotalOver8mResolved}}function Nd(s){let e=ns;for(const t of s)e=Ed(e,t);return e}const Tt=["inside_1m","1_to_2m","2_to_4m","4_to_8m","over_8m"];function vi(s,e){switch(e){case"inside_1m":return s.firstPuttInside1mResolved;case"1_to_2m":return s.firstPutt1To2mResolved;case"2_to_4m":return s.firstPutt2To4mResolved;case"4_to_8m":return s.firstPutt4To8mResolved;case"over_8m":return s.firstPuttOver8mResolved}}function Rd(s,e){switch(e){case"inside_1m":return s.puttsTotalInside1mResolved;case"1_to_2m":return s.puttsTotal1To2mResolved;case"2_to_4m":return s.puttsTotal2To4mResolved;case"4_to_8m":return s.puttsTotal4To8mResolved;case"over_8m":return s.puttsTotalOver8mResolved}}function Od(s,e){switch(e){case"inside_1m":return s.onePuttInside1m;case"1_to_2m":return s.onePutt1To2m;case"2_to_4m":return s.onePutt2To4m;case"4_to_8m":return s.onePutt4To8m;case"over_8m":return s.onePuttOver8m}}function zd(s,e){switch(e){case"inside_1m":return s.girFirstPuttInside1m;case"1_to_2m":return s.girFirstPutt1To2m;case"2_to_4m":return s.girFirstPutt2To4m;case"4_to_8m":return s.girFirstPutt4To8m;case"over_8m":return s.girFirstPuttOver8m}}function wi(s){return H(s.fairwayHits,s.teeRecorded)}function Ld(s){return H(s.troubleCount,s.teeRecorded)}function Hd(s){return H(s.recoverySuccesses,s.recoveryAttempts)}function Ad(s,e){return H(s.penaltiesTotal,e)}function Md(s){return{fairway:H(s.strokesVsParFairway,s.holesScoredFairway),inPlay:H(s.strokesVsParInPlay,s.holesScoredInPlay),trouble:H(s.strokesVsParTrouble,s.holesScoredTrouble)}}function Fd(s){const e=s.strokesVsParTrouble*s.holesScoredFairway-s.strokesVsParFairway*s.holesScoredTrouble;return H(e,s.holesScoredTrouble*s.holesScoredFairway)}function xi(s){return H(s.girHits,s.girRecorded)}function jd(s){return{fairway:H(s.girHitsFairway,s.girRecordedFairway),inPlay:H(s.girHitsInPlay,s.girRecordedInPlay),trouble:H(s.girHitsTrouble,s.girRecordedTrouble)}}function Dd(s,e){return H(zd(s,e),s.girFirstPuttRecorded)}function Bd(s){return H(s.birdiesOnGir,s.girHolesScored)}function Gd(s,e){return H(Od(s,e),vi(s,e))}function qd(s){return H(s.threePutts,s.puttsRecorded)}function Vd(s){return H(s.threePuttsFromOver8m,s.firstPuttOver8mResolved)}function Ud(s){return H(s.puttsTotalGir,s.puttsRecordedGir)}function $i(s){return{standard:H(s.scrambleSuccessesStandard,s.scrambleAttemptsStandard),hard:H(s.scrambleSuccessesHard,s.scrambleAttemptsHard),overall:H(s.scrambleSuccessesStandard+s.scrambleSuccessesHard,s.scrambleAttemptsStandard+s.scrambleAttemptsHard)}}function Kd(s){return{standard:H(s.scrambleInside2mStandard,s.scrambleFirstPuttStandard),hard:H(s.scrambleInside2mHard,s.scrambleFirstPuttHard),overall:H(s.scrambleInside2mStandard+s.scrambleInside2mHard,s.scrambleFirstPuttStandard+s.scrambleFirstPuttHard)}}function Wd(s){return{par3:H(s.strokesPar3-3*s.holesScoredPar3,s.holesScoredPar3),par4:H(s.strokesPar4-4*s.holesScoredPar4,s.holesScoredPar4),par5:H(s.strokesPar5-5*s.holesScoredPar5,s.holesScoredPar5)}}function Yd(s,e){return H(s.doubleBogeyPlus,e)}function Qd(s){return H(s.bounceBackSuccesses,s.bounceBackOpportunities)}const ki=Object.freeze({inside_1m:1.05,"1_to_2m":1.45,"2_to_4m":1.85,"4_to_8m":2.1,over_8m:2.4}),Xd=1.85,Jd=Object.freeze({inside2m:1.25,outside2m:2.12}),ee=["putting","shortGame","penalties","longGame"],Zd=.8;function We(s,e=ki,t=Jd,n=Xd){let i=0,r=0,l=0;for(const P of Tt){const B=vi(s,P);i+=B,r+=Rd(s,P),l+=B*e[P]}const d=i===0?null:r-l,c=s.scrambleInside2mStandard+s.scrambleInside2mHard,u=s.scrambleFirstPuttStandard+s.scrambleFirstPuttHard,f=Math.max(0,u-c),m=s.scrambleHoledStandard+s.scrambleHoledHard,h=u===0&&m===0?null:c*(t.inside2m-n)+f*(t.outside2m-n)+m*(1-(1+n)),b=s.penaltiesTotal,g=s.holesScored===0?null:s.strokesTotal-s.parTotal,x={holesScored:s.holesScored,puttsRecorded:s.puttsRecorded},O=s.puttsRecorded>=Zd*s.holesScored,D=g===null||d===null||h===null||!O?null:g-d-h-b;return{putting:d,shortGame:h,penalties:b,longGame:D,total:g,coverage:x}}function Ie(s,e){switch(e){case"putting":return s.putting;case"shortGame":return s.shortGame;case"penalties":return s.penalties;case"longGame":return s.longGame}}function Si(s,e){return{putting:ze(s.putting,e.map(Ti)),shortGame:ze(s.shortGame,e.map(ec)),penalties:ze(s.penalties,e.map(Ii)),longGame:ze(s.longGame,e.map(tc)),total:ze(s.total,e.map(sc))}}function bs(s,e){switch(e){case"putting":return s.putting;case"shortGame":return s.shortGame;case"penalties":return s.penalties;case"longGame":return s.longGame}}function _s(s){let e=0,t=0;for(const n of s)n!==null&&(e+=n,t+=1);return t===0?null:e/t}function ze(s,e){if(s===null)return null;const t=_s(e);return t===null?null:s-t}function Ti(s){return s.putting}function ec(s){return s.shortGame}function Ii(s){return s.penalties}function tc(s){return s.longGame}function sc(s){return s.total}const sn=1,nc=2,ic=.75,rc=4,oc=12,ac=5,lc=2;function dc(s,e,t,n){const i=Si(e,t),r=[];let l=0;const d=(g,x)=>{r.push({line:g,magnitude:x,order:l++})};let c=null,u=null;for(const g of ee){const x=bs(i,g);x!==null&&((c===null||x<c.delta)&&(c={component:g,delta:x}),(u===null||x>u.delta)&&(u={component:g,delta:x}))}c!==null&&c.delta<=-sn&&d({id:"component_best_vs_baseline",params:{component:c.component,delta:c.delta}},Math.abs(c.delta)),u!==null&&u.delta>=sn&&d({id:"component_worst_vs_baseline",params:{component:u.component,delta:u.delta}},Math.abs(u.delta));const f=_s(t.map(Ii));f!==null&&s.penaltiesTotal>=f+nc&&d({id:"penalties_spike",params:{penalties:s.penaltiesTotal,baseline:f}},0);const m=s.scrambleAttemptsStandard+s.scrambleAttemptsHard,h=s.scrambleSuccessesStandard+s.scrambleSuccessesHard;m>=rc&&h>=ic*m&&d({id:"scramble_streak",params:{successes:h,attempts:m}},0),s.threePutts===0&&s.puttsTotal>=oc&&d({id:"three_putt_free",params:{putts:s.puttsTotal,holes:s.puttsRecorded}},0);const b=t.map(Ti).filter(g=>g!==null);return e.putting!==null&&b.length>=ac&&b.every(g=>e.putting<g)&&d({id:"best_putting_round",params:{putting:e.putting,rounds:b.length}},0),s.bounceBackOpportunities>=lc&&s.bounceBackSuccesses===s.bounceBackOpportunities&&d({id:"bounce_back_perfect",params:{opportunities:s.bounceBackOpportunities,successes:s.bounceBackSuccesses}},0),r.sort((g,x)=>x.magnitude-g.magnitude||g.order-x.order),r.slice(0,Math.max(0,n)).map(g=>g.line)}const cc=["tee","approach","putting","shortGame","scoring"];function uc(s){switch(s){case"tee":return"Off the tee";case"approach":return"Approach";case"putting":return"Putting";case"shortGame":return"Short game";case"scoring":return"Scoring"}}const hc=3,Pi={rounds:[],totals:ns,waterfall:We(ns),priorities:[],trends:[],tee:null,approach:null,putting:null,shortGame:null,scoring:null};function Ci(s){const e=St(s);if(e.length===0)return Pi;const t=Nd(e.map(r=>r.measures)),n=e.map(r=>We(r.measures)),i=e.length;return{rounds:e.map((r,l)=>{const d=n[l];return{id:r.roundId,date:r.date,courseName:r.courseName,name:r.name,holeCount:r.holeCount,strokes:r.measures.holesScored===0?null:r.measures.strokesTotal,vsPar:d.total,waterfall:d}}),totals:t,waterfall:We(t),priorities:pc(n),trends:fc(e),tee:mc(t,i),approach:gc(t),putting:bc(t),shortGame:_c(t),scoring:yc(t,i)}}function pc(s){const e=ee.map(n=>{const i=s.map(r=>Ie(r,n));return{component:n,perRound:_s(i),roundsCovered:i.filter(r=>r!==null).length,roundsInWindow:s.length}}),t=n=>ee.indexOf(n);return e.sort((n,i)=>n.perRound!==null&&i.perRound!==null?n.perRound===i.perRound?t(n.component)-t(i.component):i.perRound-n.perRound:n.perRound!==null?-1:i.perRound!==null?1:t(n.component)-t(i.component))}function Gt(s){return Ee(s)==="percentage"?s.value:null}function fc(s){const e=[...s].reverse(),t=(n,i,r,l)=>{const d=[];for(const c of e){const u=l(c.measures);u!==null&&d.push(u)}return d.length>=hc?{id:n,title:i,kind:r,points:d}:null};return[t("fairway","Fairways","percentage",n=>Gt(wi(n))),t("gir","Greens","percentage",n=>Gt(xi(n))),t("putting","Putting","strokesLost",n=>We(n).putting),t("scramble","Scrambling","percentage",n=>Gt($i(n).overall))].filter(n=>n!==null)}function mc(s,e){return s.teeRecorded<=0?null:{fairway:wi(s),inPlayOnly:H(s.inPlayHits-s.fairwayHits,s.teeRecorded),trouble:Ld(s),troubleTax:Fd(s),vsParByTee:Md(s),recovery:Hd(s),penaltiesPerRound:Ad(s,e)}}function gc(s){if(s.girRecorded<=0)return null;const e={};for(const t of Tt)e[t]=Dd(s,t);return{gir:xi(s),girByTee:jd(s),girFirstPuttMix:e,birdieConversion:Bd(s)}}function bc(s){return s.puttsRecorded<=0&&s.firstPuttRecorded<=0?null:{ladder:Tt.map(e=>({bucket:e,made:Gd(s,e),baseline:Math.max(0,2-ki[e])})),threePutt:qd(s),threePuttsFromOver8m:Vd(s),puttsPerGirHole:Ud(s)}}function _c(s){if(s.scrambleAttemptsStandard+s.scrambleAttemptsHard<=0)return null;const t=s.onePuttInside1m+s.onePutt1To2m,n=s.firstPuttInside1mResolved+s.firstPutt1To2mResolved;return{scramble:$i(s),chipInside2m:Kd(s),conversionInside2m:H(t,n),chipIns:s.scrambleHoledStandard+s.scrambleHoledHard}}function yc(s,e){return s.holesScored<=0?null:{avgVsParByParGroup:Wd(s),doubleBogeyPlusPerRound:Yd(s,e),bounceBack:Qd(s)}}function Ei(s){let e=0;for(const t of s)for(const n of ee){const i=Ie(t,n);i!==null&&(e=Math.max(e,Math.abs(i)))}return e}function vc(s){let e=0;for(const t of s)t.perRound!==null&&(e=Math.max(e,Math.abs(t.perRound)));return e}class be{static PAGE_SIZE=50;static MAX_PAGES=40;loading=new p(!1);error=new p(null);loaded=new p(!1);loadedRounds=new p([]);roundsWithStats=new p(null);hasMore=new p(!1);preset=new p(Cd());filter=new p(Dt);extending=new p(!1);extendError=new p(null);pagesFetched=0;cursor=null;windowRounds=new $(()=>kd(this.preset.get(),this.filter.get(),this.loadedRounds.get(),new Date));model=new $(()=>Ci(this.windowRounds.get()));courses=new $(()=>Id(this.loadedRounds.get()));overFiltered=new $(()=>this.loadedRounds.get().length>0&&this.windowRounds.get().length===0);async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;this.pagesFetched=0,this.cursor=null,this.extendError.set(null);const t=await A(this.loading,this.error,()=>v.playerStats.myStats({limit:be.PAGE_SIZE}));t&&(this.pagesFetched=1,this.roundsWithStats.set(t.roundsWithStats),this.loadedRounds.set(t.rounds),this.cursor=t.nextCursor,this.hasMore.set(t.nextCursor!==null),this.loaded.set(!0),await this.extendIfNeeded())}select(e){this.preset.set(e),tn(e),this.extendIfNeeded()}applyFilter(e){this.filter.set(e),this.preset.set("custom"),tn("custom"),this.extendIfNeeded()}clearFilter(){this.filter.set(Dt),this.select(ts)}async extendIfNeeded(){if(!(this.extending.get()||this.loading.get())){this.extendError.set(null),this.extending.set(!0);try{for(;this.cursor!==null&&this.pagesFetched<be.MAX_PAGES&&Sd({preset:this.preset.get(),filter:this.filter.get(),loaded:this.loadedRounds.get(),hasMore:this.hasMore.get(),now:new Date});){const e=this.cursor;let t;try{t=await v.playerStats.myStats({limit:be.PAGE_SIZE,cursor:e})}catch{this.extendError.set({code:"network",message:"Could not load older rounds."});return}this.pagesFetched+=1,this.appendRounds(t.rounds),this.cursor=t.nextCursor,this.hasMore.set(t.nextCursor!==null)}}finally{this.extending.set(!1)}}}budgetSpent(){return this.pagesFetched>=be.MAX_PAGES&&this.hasMore.get()}loadedCount(){return this.loadedRounds.get().length}clear(){this.loadedRounds.set([]),this.roundsWithStats.set(null),this.hasMore.set(!1),this.loaded.set(!1),this.error.set(null),this.extendError.set(null),this.filter.set(Dt),this.pagesFetched=0,this.cursor=null}appendRounds(e){const t=new Set(this.loadedRounds.get().map(i=>i.roundId)),n=e.filter(i=>!t.has(i.roundId));n.length!==0&&this.loadedRounds.set([...this.loadedRounds.get(),...n])}}function wc(s,e,t=!0){if(s===null||e===null||s<=0)return null;const n=s-e;return n===0?null:s===1&&t||n<=-3?"diamond":n===-2?"double_ring":n===-1?"ring":n===1?"square":n===2?"double_square":"box_badge"}function xc(s){const e=s.par,t=s.score,n=t===0,i=n?null:t,r=s.stats;return{id:s.playHoleId,ordinal:s.ordinal,holeNumber:s.courseHoleNumber,par:e,lengthM:s.lengthM,strokes:i,isPickedUp:n,vsPar:i===null?null:i-e,marker:wc(i,e),tee:r.teeResult,gir:r.gir,putts:r.putts,firstPutt:r.firstPutt,shortGame:r.shortGameDifficulty,penalties:r.penalties,recoveryOk:r.recoveryOk}}function $c(s){return(s.penalties??0)>0}const is=10,kc=3;function Sc(s){const{round:e,holes:t,history:n,windowSize:i=is,insightLimit:r=kc}=s,l=Ci([e]),d=l.waterfall,u=Tc(e,n,i).map(m=>We(m.measures)),f=l.rounds[0];return{roundId:e.roundId,date:e.date,courseName:e.courseName,name:e.name,holeCount:e.holeCount,strokes:f?.strokes??null,vsPar:f?.vsPar??null,cells:[...t].sort((m,h)=>m.ordinal-h.ordinal).map(xc),panels:l,waterfall:d,deltas:u.length===0?null:Si(d,u),windowCount:u.length,insights:dc(e.measures,d,u,r)}}function Tc(s,e,t){const n=e.filter(l=>l.roundId!==s.roundId);n.push(s);const i=St(n),r=i.findIndex(l=>l.roundId===s.roundId);return r===-1?[]:i.slice(r+1,r+1+Math.max(0,t))}function nn(s,e,t){const n=St(s),i=n.findIndex(r=>r.roundId===e);return i===-1?!1:n.length-(i+1)>=t}function rn(s){const e=(s.name??"").trim();if(e!=="")return e;const t=(s.courseName??"").trim();return t===""?"Round":t}function Ic(s){const{signedInPlayerId:e,statConfigPlayerIds:t,statRows:n,holesUnscored:i}=s;return e===null||e===""?{reason:"notSignedIn",playerId:null}:t.has(e)?n.some(l=>l.playerId===e&&Pc(l))?i!==0?{reason:"roundUnfinished",playerId:null}:{reason:"eligible",playerId:e}:{reason:"noStatsRecorded",playerId:null}:{reason:"noStatsConfigured",playerId:null}}function Pc(s){return s.teeResult!==null||s.gir!==null||s.firstPutt!==null||s.putts!==null||s.shortGameDifficulty!==null||s.penalties!==null||s.recoveryOk!==null}function Cc(s){const{playerId:e,balls:t,groups:n,strokesFor:i}=s,r=t.find(d=>d.players.some(c=>c.playerId===e));if(!r)return null;const l=n.find(d=>d.ballIds.includes(r.id));return l?l.playedOrder.filter(d=>i(r.id,d.playHoleId)===null).length:null}class Ye{static PAGE_SIZE=50;static MAX_PAGES=8;phase=new p("idle");failure=new p(null);roundId=new p(null);holes=new p([]);round=new p(null);history=new p([]);dashboard=G.get(be);inFlight=null;model=new $(()=>{const e=this.round.get();return e===null?null:Sc({round:e,holes:this.holes.get(),history:this.history.get()})});async load(e,t=!1){if(!t&&(this.roundId.get()===e||this.inFlight===e))return;this.inFlight=e,this.phase.set("loading"),this.failure.set(null),this.roundId.set(null),this.holes.set([]),this.round.set(null),this.history.set([]);let n;try{n=await v.playerStats.myRoundStats({roundId:e})}catch(l){if(this.inFlight!==e)return;this.inFlight=null,this.phase.set(on(l)),this.failure.set(an(l));return}if(this.inFlight!==e)return;let i;try{i=await this.walkHistory(e)}catch(l){if(this.inFlight!==e)return;this.inFlight=null,this.phase.set(on(l)),this.failure.set(an(l));return}if(this.inFlight!==e)return;this.inFlight=null;const r=i.find(l=>l.roundId===e)??null;if(r===null){this.phase.set("notFound");return}this.roundId.set(e),this.holes.set(n),this.round.set(r),this.history.set(i.filter(l=>l.roundId!==e)),this.phase.set("ready")}async walkHistory(e){const t=[],n=new Set,i=l=>{for(const d of l)n.has(d.roundId)||(n.add(d.roundId),t.push(d))};if(i(this.dashboard.loadedRounds.get()),nn(t,e,is))return t;let r=null;for(let l=0;l<Ye.MAX_PAGES;l++){const d=await v.playerStats.myStats({limit:Ye.PAGE_SIZE,cursor:r??void 0});if(i(d.rounds),nn(t,e,is)||d.nextCursor===null)return t;r=d.nextCursor}return t}clear(){this.roundId.set(null),this.holes.set([]),this.round.set(null),this.history.set([]),this.phase.set("idle"),this.failure.set(null),this.inFlight=null}}function on(s){if(s instanceof K){if(s.status===401||s.status===403)return"notAuthorized";if(s.status===404)return"notFound"}return"failed"}function an(s){return s instanceof K&&(s.status===404||s.status===401||s.status===403)?null:s instanceof Error?s.message:"Something went wrong."}const J=100;function It(s){return s>0?"loss":s<0?"gain":"zero"}function Ne(s,e){switch(s){case"gain":return e.gain;case"loss":return e.loss;case"zero":return e.zero;case"neutral":return e.neutral}}function Y(s){return String(Math.round(s*1e3)/1e3)}function ys(s){return s<0?0:s>1?1:s}function ye(s,e){return`<svg class="chart" viewBox="0 0 ${J} ${Y(s)}" preserveAspectRatio="none" style="height:${Y(s)}px" aria-hidden="true" focusable="false">${e}</svg>`}function vs(s,e,t,n=1){return`<path d="M${Y(s)} 0 L${Y(s)} ${Y(e)}" stroke="${t}" stroke-width="${Y(n)}" vector-effect="non-scaling-stroke" fill="none"/>`}function re(s,e,t,n,i){return`<rect x="${Y(s)}" y="${Y(e)}" width="${Y(t)}" height="${Y(n)}" fill="${i}"/>`}const Ec=1;function Nc(s,e){const t=J/2,n=It(s);if(!(e>0))return{zeroX:t,bar:null,tone:n};const i=Math.min(1,Math.abs(s)/e),r=Math.max(s===0?0:Ec,t*i);return{zeroX:t,bar:{x:s>=0?t:t-r,width:r},tone:n}}function Ni(s,e,t,n=10){const i=Nc(s,e),r=i.bar&&i.bar.width>0?re(i.bar.x,0,i.bar.width,n,Ne(i.tone,t)):"";return ye(n,[re(0,0,J,n,t.track),r,vs(i.zeroX,n,t.rule)].join(""))}function Rc(s){const e=[];let t=0;for(const n of s){const i=J*ys(n.share);e.push({id:n.id,x:t,width:i,color:n.color}),t+=i}return e}function Oc(s,e,t=12){const n=Rc(s).filter(i=>i.width>0).map(i=>re(i.x,0,i.width,t,i.color)).join("");return ye(t,re(0,0,J,t,e.track)+n)}const ln=2,zc=1e-4;function Lc(s,e=34){if(s.length===0)return[];const t=Math.min(...s),i=Math.max(...s)-t,r=ln,l=Math.max(0,e-ln*2);return s.map((d,c)=>({x:s.length===1?J/2:c/(s.length-1)*J,y:i===0?e/2:r+l-(d-t)/i*l}))}function Hc(s){return s.map((e,t)=>`${t===0?"M":"L"}${Y(e.x)} ${Y(e.y)}`).join(" ")}function Ac(s,e){const t=s[0],n=s[s.length-1];if(t===void 0||n===void 0)return"neutral";const i=n-t;return Math.abs(i)<=zc?"neutral":(e==="percentage"?i>0:i<0)?"gain":"loss"}function Mc(s,e,t,n=34){const i=Lc(s,n);if(i.length===0)return ye(n,"");const r=Ne(Ac(s,e),t),l=`<path d="${Hc(i)}" fill="none" stroke="${r}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`,d=i[i.length-1],c=`<path d="M${Y(d.x)} ${Y(d.y)} L${Y(d.x)} ${Y(d.y)}" stroke="${r}" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke" fill="none"/>`;return ye(n,l+c)}const Fc=.5;function jc(s,e,t=8){const n=J/2,i=ee.length-1,r=Math.max(1,(t-i)/ee.length),l=[];return ee.forEach((d,c)=>{const u=Ie(s,d);if(u===null||!(e>0))return;const f=Math.max(u===0?0:Fc,n*Math.min(1,Math.abs(u)/e));l.push({component:d,x:u>=0?n:n-f,y:c*(r+1),width:f,height:r,tone:It(u)})}),l}function Dc(s,e,t,n=8){const i=jc(s,e,n).filter(r=>r.width>0).map(r=>re(r.x,r.y,r.width,r.height,Ne(r.tone,t))).join("");return ye(n,vs(J/2,n,t.rule)+i)}const Ri=1,dn=.02;function Bc(s,e){const t=e>0?J*Math.min(1,e):null;if(s===null)return{bar:null,tickX:t};const n=ys(s),i=e<=0?"neutral":s>e+dn?"gain":s<e-dn?"loss":"neutral";return{bar:{width:Math.max(Ri,J*n),tone:i},tickX:t}}function Gc(s,e,t,n=10){const i=Bc(s,e),r=i.bar?re(0,0,i.bar.width,n,Ne(i.bar.tone,t)):"",l=i.tickX===null?"":vs(i.tickX,n,t.rule,2);return ye(n,re(0,0,J,n,t.track)+r+l)}function qc(s){return s===null?null:Math.max(Ri,J*ys(s))}function Vc(s,e,t=e.neutral,n=8){const i=qc(s),r=i===null?"":re(0,0,i,n,t);return ye(n,re(0,0,J,n,e.track)+r)}const Pt={gain:a("accent-strong"),loss:a("danger"),zero:a("border-strong"),neutral:a("accent"),track:a("surface-sunken"),rule:a("border")};function xe(s){switch(Ee(s)){case"absent":return null;case"fraction":return`${Pe(s.n)} of ${Pe(s.d)}`;case"percentage":return s.value===null?null:`${Math.round(s.value*100)}%`}}function Uc(s){return Ee(s)!=="percentage"?null:`${Pe(s.n)} of ${Pe(s.d)}`}function se(s){const e=xe(s);if(e===null)return null;const t=Uc(s);return t===null?e:`${e} (${t})`}function Oi(s,e=2,t=!1){return Ee(s)==="absent"||s.value===null?null:t?Re(s.value,e):ue(s.value,e)}function ws(s){return{one:s,many:`${s}s`}}const de=ws("round"),Kc=ws("hole"),zi=ws("green"),Li="thin sample";function Wc(s,e){switch(Ee(s)){case"absent":return null;case"fraction":return`over ${ne(s.d,e)} — ${Li}`;case"percentage":return`over ${ne(s.d,e)}`}}function $e(s,e){const t=Oi(s,e.decimals??2,e.signed??!1);if(t===null)return null;const n=e.label?`${t} ${e.label}`:t,i=Wc(s,e.unit);return i===null?n:`${n} (${i})`}const Yc={one:"hole from trouble",many:"holes from trouble"},Qc={one:"from the fairway",many:"from the fairway"};function Xc(s){const e=s.trouble.d,t=s.fairway.d;if(e<=0||t<=0)return null;const n=`over ${ne(e,Yc)} vs ${ne(t,Qc)}`;return e<ss||t<ss?`${n} — ${Li}`:n}function Jc(s){return Ee(s)==="fraction"}function Pe(s){return s===Math.round(s)?String(Math.round(s)):ue(s,1)}function ne(s,e){return`${Pe(s)} ${s===1?e.one:e.many}`}function ue(s,e=1){return s.toFixed(e)}function Re(s,e=1){const t=10**e,n=Math.round(s*t)/t;if(n===0)return ue(0,e);const i=ue(Math.abs(n),e);return n>0?`+${i}`:`−${i}`}function Zc(s){return`${Re(s)}/round`}function xs(s){return s===0?"E":Re(s,s===Math.round(s)?0:1)}function $s(s){switch(s){case"putting":return"Putting";case"shortGame":return"Short game";case"penalties":return"Penalties";case"longGame":return"Long game"}}function eu(s){switch(s){case"putting":return"Putts taken vs expected from where you started";case"shortGame":return"Chips and pitches vs an average short-game shot";case"penalties":return"Strokes added by penalties";case"longGame":return"Tee shots and approaches — what the rest did not explain"}}function cn(s){switch(s){case"inside_1m":return"Inside 1 m";case"1_to_2m":return"1–2 m";case"2_to_4m":return"2–4 m";case"4_to_8m":return"4–8 m";case"over_8m":return"Over 8 m"}}function tu(s){return s==="indoor"?"Indoor":"Outdoor"}function su(s){switch(s){case"full_18":return"18 holes";case"front_9":return"Front 9";case"back_9":return"Back 9";case"custom_holes":return"Custom holes"}}function Hi(s){return _e(s)}const z={intro:"Every window is added up on this device from the rounds you have recorded.",loading:"Adding up your rounds…",noStats:"No rounds with statistics yet. Turn statistics on in your profile and they start filling in as you score.",windowEmpty:"No rounds match this window. Widen the filter, or clear it to go back to your last 10 rounds.",extending:"Loading more history…",extendProblemPrefix:"Showing the rounds loaded so far — fetching older ones failed: ",budgetSpent:"Showing the most recent rounds — this window stops short of your whole history.",notEnoughData:"Not enough data",notRecorded:"Not recorded",priorities:"Practice priorities",prioritiesHint:"Strokes lost per round against a fixed baseline, worst first. Positive costs you shots.",trends:"Trends",trendsHint:"Oldest round on the left. A round with no reading is skipped, never plotted as zero.",roundsHeading:"Rounds in this window",roundsHint:"Each strip is that round’s four waterfall terms, on one shared scale.",filterClear:"Clear filter",filterRoundsHint:"Uncheck a round below to leave it out of a custom window.",troubleTax:"Extra strokes per hole when the tee shot finds trouble, against your own fairway holes.",recovery:"Holes where the shot after trouble got you back in play.",penalties:"Penalty strokes per round.",proximityProxy:"How far the first putt was on greens you hit — a stand-in for approach proximity, which the app does not measure directly.",birdieConversion:"Greens hit that became a birdie or better.",ladderBaseline:"The tick is the make rate the expected-putts table implies. For 4–8 m and over 8 m it sits at zero: the table expects two putts from there, so any make is ahead of it.",threePutt:"Holes with three putts or more.",longThreePutt:"Three-putts that started from over 8 m.",puttsPerGir:"Putts taken on holes where you hit the green.",conversionInside2m:"First putts from inside 2 m that went in — across every hole, not only chipped ones. The app records no chip-and-hole cross-tab.",chipIns:"Short-game shots that went in without a putt.",doubleBogeyPlus:"Holes at double bogey or worse, per round.",bounceBack:"Holes after a bogey or worse that came back at par or better."};function je(s){return Jc(s)?null:s.value}function ae(s,e,t){return{kind:"bar",id:s,title:e,share:je(t),value:xe(t)}}function Q(s,e,t,n=null){return{kind:"figure",id:s,title:e,value:t,hint:n}}function nu(s,e){switch(s){case"tee":{const t=e.tee&&se(e.tee.fairway);return t?`Fairways ${t}`:null}case"approach":{const t=e.approach&&se(e.approach.gir);return t?`Greens in regulation ${t}`:null}case"putting":return e.putting?$e(e.putting.puttsPerGirHole,{unit:zi,label:"putts per green hit"}):null;case"shortGame":{const t=e.shortGame&&se(e.shortGame.scramble.overall);return t?`Scrambling ${t}`:null}case"scoring":return e.scoring?$e(e.scoring.doubleBogeyPlusPerRound,{unit:de,label:"doubles or worse per round"}):null}}function iu(s){const e=Xc(s.vsParByTee),t=e?`${z.troubleTax} Measured ${e}.`:z.troubleTax;return Q("troubleTax","Trouble tax",Oi(s.troubleTax,2,!0),t)}function un(s,e){switch(s){case"tee":{const t=e.tee;return t?[{kind:"split",id:"teeSplit",segments:[{id:"fairway",title:"Fairway",tone:"fairway",share:je(t.fairway),value:xe(t.fairway)},{id:"inPlay",title:"In play",tone:"inplay",share:je(t.inPlayOnly),value:xe(t.inPlayOnly)},{id:"trouble",title:"Trouble",tone:"trouble",share:je(t.trouble),value:xe(t.trouble)}]},iu(t),Q("recovery","Recovery",se(t.recovery),z.recovery),Q("penalties","Penalties",$e(t.penaltiesPerRound,{unit:de}),z.penalties)]:[]}case"approach":{const t=e.approach;return t?[{kind:"subhead",id:"girByTee",text:"Greens hit, by where the tee shot finished"},ae("girFairway","From the fairway",t.girByTee.fairway),ae("girInPlay","From in play",t.girByTee.inPlay),ae("girTrouble","From trouble",t.girByTee.trouble),{kind:"subhead",id:"mixHead",text:"First putt on greens hit"},{kind:"note",id:"mixNote",text:z.proximityProxy},...Tt.map(n=>ae(`mix-${n}`,cn(n),t.girFirstPuttMix[n])),Q("birdieConversion","Birdie conversion",se(t.birdieConversion),z.birdieConversion)]:[]}case"putting":{const t=e.putting;return t?[{kind:"subhead",id:"ladderHead",text:"Holed on the first putt"},{kind:"note",id:"ladderNote",text:z.ladderBaseline},...t.ladder.map(n=>({kind:"rung",id:`rung-${n.bucket}`,title:cn(n.bucket),made:je(n.made),baseline:n.baseline,value:xe(n.made)})),Q("threePutt","Three-putts",se(t.threePutt),z.threePutt),Q("longThreePutt","Three-putts from over 8 m",se(t.threePuttsFromOver8m),z.longThreePutt),Q("puttsPerGir","Putts per green hit",$e(t.puttsPerGirHole,{unit:zi}),z.puttsPerGir)]:[]}case"shortGame":{const t=e.shortGame;return t?[{kind:"subhead",id:"scrambleHead",text:"Scrambling"},ae("scrambleStandard","Standard",t.scramble.standard),ae("scrambleHard","Hard",t.scramble.hard),{kind:"subhead",id:"chipHead",text:"Chipped to inside 2 m"},ae("chipStandard","Standard",t.chipInside2m.standard),ae("chipHard","Hard",t.chipInside2m.hard),Q("conversionInside2m","Holed from inside 2 m",se(t.conversionInside2m),z.conversionInside2m),Q("chipIns","Chip-ins",Pe(t.chipIns),z.chipIns)]:[]}case"scoring":{const t=e.scoring;if(!t)return[];const n=i=>$e(i,{unit:Kc,signed:!0});return[{kind:"subhead",id:"vsParHead",text:"Average vs par"},Q("par3","Par 3",n(t.avgVsParByParGroup.par3)),Q("par4","Par 4",n(t.avgVsParByParGroup.par4)),Q("par5","Par 5",n(t.avgVsParByParGroup.par5)),Q("doubles","Doubles or worse",$e(t.doubleBogeyPlusPerRound,{unit:de}),z.doubleBogeyPlus),Q("bounceBack","Bounce-back",se(t.bounceBack),z.bounceBack)]}}}function ru(s){return s===1?"This round has no data for it.":`None of these ${s} rounds has data for it.`}function hn(s){const e=(s.name??"").trim();return e||(s.courseName??"").trim()||"Round"}const V={loading:"Reading the round…",noStatsInRound:"No statistics of your own in this round. Only the player whose card carried them can see them.",notSignedIn:"Sign in to see your own statistics for a round.",failedPrefix:"Could not read the round: ",holeStripHeading:"Hole by hole",waterfallHeading:"Where the round went",legendHeading:"Reading the strip",nothingRecordedOnHole:"Nothing was recorded on this hole.",noHoleStrip:"No hole-by-hole detail for this round.",waterfallHint:"Strokes lost against a fixed baseline. Positive costs you shots.",legendTee:"Dot — where the tee shot finished: green fairway, brass in play, terracotta trouble.",legendGir:"Ring — green in regulation: filled hit, hollow missed.",legendPutts:"Number — putts taken on the hole.",legendPenalty:"Flag — a penalty stroke.",legendAbsence:"Anything you did not record is left out: an empty row is a hole nobody answered, not a hole answered no."},pn={title:"Your round",seeWholeRound:"See the whole round"};function ou(s){const e=[Hi(s.date)],t=(s.courseName??"").trim();return t!==""&&t!==s.title&&e.push(t),e.push(s.holeCount===1?"1 hole":`${s.holeCount} holes`),e.join(" · ")}function Ai(s,e){return s===null?null:e===null?String(s):`${s} (${xs(e)})`}function au(s){let e=`Hole ${s.holeNumber} · par ${s.par}`;return s.lengthM!==null&&(e+=` · ${s.lengthM} m`),e}function lu(s){return s.strokes!==null?String(s.strokes):s.isPickedUp?"–":"·"}function du(s){return s.isPickedUp?"Picked up":s.strokes===null?null:s.vsPar===null?String(s.strokes):`${s.strokes} (${xs(s.vsPar)})`}function cu(s){switch(s){case"fairway":return"Fairway";case"in_play":return"In play";case"trouble":return"Trouble"}}function uu(s){switch(s){case"inside_1m":return"Inside 1 m";case"1_to_2m":return"1–2 m";case"2_to_4m":return"2–4 m";case"4_to_8m":return"4–8 m";case"over_8m":return"Over 8 m";case"inside_2m":return"Inside 2 m";case"2_to_6m":return"2–6 m";case"over_6m":return"Over 6 m"}}function hu(s){return s==="hard"?"Hard chip or pitch":"Standard chip or pitch"}function pu(s){switch(s){case"ring":return"Birdie";case"double_ring":return"Eagle";case"diamond":return"Albatross or hole in one";case"square":return"Bogey";case"double_square":return"Double bogey";case"box_badge":return"Triple bogey or worse"}}function ks(s){const e=[],t=du(s);return t!==null&&e.push({label:"Score",value:t}),s.tee!==null&&e.push({label:"Tee shot",value:cu(s.tee)}),s.gir!==null&&e.push({label:"Green in regulation",value:s.gir?"Hit":"Missed"}),s.putts!==null&&e.push({label:"Putts",value:s.putts===1?"1 putt":`${s.putts} putts`}),s.firstPutt!==null&&e.push({label:"First putt",value:uu(s.firstPutt)}),s.shortGame!==null&&e.push({label:"Short game",value:hu(s.shortGame)}),s.recoveryOk!==null&&e.push({label:"Recovery",value:s.recoveryOk?"Back in play":"Still in trouble"}),s.penalties!==null&&e.push({label:"Penalties",value:s.penalties===0?"None":s.penalties===1?"1 stroke":`${s.penalties} strokes`}),e}function fu(s){return s===null?[]:ks(s).map(e=>({...e,key:`${s.id}:${e.label}`}))}function fn(s){const e=[`Hole ${s.holeNumber}`,`par ${s.par}`];s.isPickedUp?e.push("picked up"):s.strokes!==null?(e.push(s.strokes===1?"1 stroke":`${s.strokes} strokes`),s.marker!==null&&e.push(pu(s.marker).toLowerCase())):e.push("no score");for(const t of ks(s))t.label!=="Score"&&e.push(`${t.label.toLowerCase()} ${t.value.toLowerCase()}`);return`${e.join(", ")}.`}function Mi(s,e){const t=e===1?"round":`last ${e} rounds`;if(Math.abs(s)<.05)return e===1?"The same as your previous round.":`The same as your ${t}.`;const n=s>0?"worse":"better",i=ue(Math.abs(s),1);return e===1?`${i} ${n} than your previous round.`:`${i} ${n} than your ${t}.`}function mn(s){switch(s){case"putting":return"Putting";case"shortGame":return"Your short game";case"penalties":return"Penalties";case"longGame":return"Tee to green"}}function qt(s,e=1){return typeof s=="number"?ue(Math.abs(s),e):""}function Vt(s){return typeof s=="number"?String(Math.round(s)):""}function gn(s){return typeof s=="string"?s:"longGame"}function mu(s){const e=s.params;switch(s.id){case"component_best_vs_baseline":return`${mn(gn(e.component))} was ${qt(e.delta)} strokes better than your recent rounds.`;case"component_worst_vs_baseline":return`${mn(gn(e.component))} cost you ${qt(e.delta)} strokes more than your recent rounds.`;case"penalties_spike":{const t=typeof e.penalties=="number"?Math.round(e.penalties):0;return`${t===1?"1 penalty stroke":`${t} penalty strokes`}, against ${qt(e.baseline)} in a normal round.`}case"scramble_streak":return`You saved par ${Vt(e.successes)} of the ${Vt(e.attempts)} times you missed the green.`;case"three_putt_free":return`No three-putts — ${Vt(e.putts)} putts across the round.`;case"best_putting_round":{const t=typeof e.rounds=="number"?Math.round(e.rounds):0;return t===1?"Your best putting of the last round.":`Your best putting of the last ${t} rounds.`}case"bounce_back_perfect":{const t=typeof e.opportunities=="number"?Math.round(e.opportunities):0;return t===1?"You came straight back after your dropped shot.":`You came straight back after all ${t} of your dropped shots.`}}}const gu=_(`
    <section bind="story" class="story hidden">
        <div class="story__head">
            <span bind="title" class="story__title"></span>
            <span bind="score" class="story__score"></span>
        </div>
        <ul bind="values" class="story__values"></ul>
        <p bind="hint" class="story__hint"></p>
        <ul bind="lines" class="story__lines"></ul>
        <button bind="open" class="story__open" type="button"></button>
    </section>
`),bu=_('<li bind="text" class="story__line"></li>'),_u=_(`
    <li class="story__value">
        <span bind="label" class="story__valuelabel"></span>
        <span bind="amount" class="story__valueamount"></span>
    </li>
`);class yu extends E{static styles=`
        .story {
            ${C()}
            display: flex; flex-direction: column; gap: ${o("sm")};
            padding: ${o("lg")};
            margin-bottom: ${o("lg")};

            &.hidden { display: none; }

            & .story__head {
                display: flex; align-items: baseline; justify-content: space-between;
                gap: ${o("md")};
            }
            & .story__title {
                font-family: ${a("font-display")};
                font-weight: 600; font-size: 1.1rem;
            }
            & .story__score {
                font-weight: 700; font-size: 1.1rem;
                font-variant-numeric: tabular-nums;
                &:empty { display: none; }
            }
            /* The four terms, stated in text. Two-up on a phone, tabular
               numerals so the signs line up. (There used to be an aria-hidden
               waterfall strip above — stretched to card width it read as a
               broken divider, and the rows already say everything it drew.) */
            & .story__values {
                margin: 0; padding: 0; list-style: none;
                display: grid; grid-template-columns: repeat(2, 1fr);
                gap: 2px ${o("md")};
                &:empty { display: none; }
            }
            & .story__value {
                display: flex; align-items: baseline; justify-content: space-between;
                gap: ${o("sm")};
            }
            & .story__valuelabel { font-size: 0.8rem; color: ${a("text-muted")}; }
            & .story__valueamount {
                font-size: 0.85rem; font-weight: 700;
                font-variant-numeric: tabular-nums;
                &.story__valueamount--absent {
                    font-weight: 400; font-size: 0.78rem; color: ${a("text-muted")};
                }
            }
            & .story__hint { margin: 0; font-size: 0.78rem; color: ${a("text-muted")}; }
            & .story__lines {
                margin: 0; padding: 0; list-style: none;
                display: flex; flex-direction: column; gap: ${o("xs")};
                &:empty { display: none; }
            }
            & .story__line { font-size: 0.9rem; }
            & .story__open {
                ${w()}
                align-self: flex-start;
                padding: ${o("xs")} ${o("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }
        }
    `;round=this.inject(oe);stats=this.inject(Ye);auth=this.inject(j);router=this.inject(M);colors=Pt;render(){this.track(I(()=>{const i=this.eligibleRoundId();U(()=>{i!==null&&this.stats.load(i).catch(()=>{})})}));const e=()=>this.shows()?this.stats.model.get():null,t=this.wire(gu,{story:{className:()=>this.shows()?"story":"story hidden"},title:()=>pn.title,score:()=>{const i=e();return i===null?"":Ai(i.strokes,i.vsPar)??""},hint:()=>e()===null?"":this.hint(),open:{textContent:()=>pn.seeWholeRound,onclick:()=>{const i=this.stats.roundId.get();i!==null&&this.router.navigate("/round-stats",{query:{id:i}})}}}),n=i=>{const r=e();return r===null?null:Ie(r.waterfall,i)};return this.$each(this.ref(t,"values"),()=>e()===null?[]:[...ee],(i,r,l)=>this.wireEl(_u,{label:()=>$s(i),amount:{textContent:()=>{const d=n(i);return d===null?z.notRecorded:Re(d)},className:()=>n(i)===null?"story__valueamount story__valueamount--absent":"story__valueamount",style:()=>{const d=n(i);return d===null?"":`color:${Ne(It(d),this.colors)}`}}},l),i=>i),this.$each(this.ref(t,"lines"),()=>e()?.insights??[],(i,r,l)=>this.wireEl(bu,{text:()=>mu(i)},l),i=>i.id),t}eligibleRoundId(){const e=this.round.round.get();return e===null?null:Ic({signedInPlayerId:this.auth.currentUser.get()?.id??null,statConfigPlayerIds:new Set(this.round.statModules.get().keys()),statRows:this.round.statRows.get(),holesUnscored:Cc({playerId:this.auth.currentUser.get()?.id??"",balls:this.round.balls.get(),groups:this.round.groups(),strokesFor:(n,i)=>this.round.strokesFor(n,i)})}).reason==="eligible"?e.id:null}shows(){const e=this.eligibleRoundId();return e===null?!1:this.stats.phase.get()==="ready"&&this.stats.roundId.get()===e}hint(){const e=this.stats.model.get();if(e===null)return"";if(e.deltas===null)return V.waterfallHint;let t=null;for(const n of ee){const i=bs(e.deltas,n);i!==null&&(t===null||Math.abs(i)>Math.abs(t))&&(t=i)}return t===null?V.waterfallHint:Mi(t,e.windowCount)}}function vu(s,e=typeof navigator>"u"?"en":navigator.language){const t=(s?.name??"").trim();if(t)return t;const n=s?.date??"";return/^\d{4}-\d{2}-\d{2}$/.test(n)?new Intl.DateTimeFormat(e,{dateStyle:"medium",timeZone:"UTC"}).format(new Date(`${n}T12:00:00Z`)):n||"Round"}function bn(s){return!(!s.pageVisible||s.status==="complete")}function wu(s,e){return e&&!s}const xu=2,_n=3,$u=75e3;function ku(s,e=null){const t=new URLSearchParams({token:s});return e!==null&&t.set("since",e),`${F}/friendly-rounds/events?${t.toString()}`}function Su(s){if(typeof s!="object"||s===null)return!1;const e=s;return e.latestEventId!==null&&typeof e.latestEventId!="string"?!1:e.status==="not_started"||e.status==="active"||e.status==="complete"}function Tu(s){const e=s.eventSourceFactory??(P=>new EventSource(P)),t=s.setTimer??((P,B)=>setTimeout(P,B)),n=s.clearTimer??(P=>clearTimeout(P)),i=s.livenessTimeoutMs??$u,r=s.isPageVisible??(()=>typeof document>"u"||!document.hidden);let l=!1,d=0,c=null,u=null,f=s.since??null;const m=()=>{u!==null&&(n(u),u=null)},h=()=>{m(),u=t(O,i)},b=()=>{c!==null&&(c.onopen=null,c.onmessage=null,c.onerror=null,c.close(),c=null)},g=()=>{l=!0,m(),b()},x=()=>{if(b(),++d>=_n){g(),s.onDegrade();return}D()};function O(){if(!l){if(!r()){h();return}x()}}function D(){if(l)return;let P;try{P=e(ku(s.token,f))}catch{g(),s.onDegrade();return}c=P,P.onopen=()=>{d=0},P.onmessage=B=>{if(l||c!==P)return;h();let q;try{q=JSON.parse(B.data)}catch{return}Su(q)&&(q.latestEventId!==null&&(f=q.latestEventId),s.onEvent({latestEventId:q.latestEventId,status:q.status}))},P.onerror=()=>{l||c!==P||(P.readyState===xu||++d>=_n)&&(g(),s.onDegrade())},h()}return D(),{stop:()=>{l||g()}}}const Iu=2e4;function Pu(s){if(!(s===null||s===""))return/^\d+$/.test(s)?Number(s):s}const Cu=_(`
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
                        <span bind="status" class="round-view__status"></span>
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
`),Eu=_('<button bind="pill" class="round-view__fmt" type="button"></button>'),Nu=_('<button bind="pill" class="round-view__grp" type="button"></button>');class Ru extends E{static styles=`
        .round-view {
            height: 100%;
            display: flex;
            flex-direction: column;

            & .round-view__main {
                flex: 1;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                padding: ${o("lg")} ${o("lg")} ${o("2xl")};
            }

            & .round-view__back {
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 600;
                color: ${a("text-muted")};
                cursor: pointer;
                padding: ${o("xs")} 0;
                margin-bottom: ${o("md")};
            }

            & .round-view__notfound {
                color: ${a("text-muted")};
                padding: ${o("xl")} 0;

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
                gap: ${o("md")};

                & .round-view__titles {
                    min-width: 0;
                }

                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 1.2rem;
                    letter-spacing: -0.02em;
                    color: ${a("text")};
                }

                /* The COURSE, and nothing else. The date is in the round list
                   (and, for a round that kept its default name, in the title
                   itself); the hole count is in the dock at the bottom of this
                   very screen. */
                & .round-view__course {
                    display: block;
                    color: ${a("text-muted")};
                    font-size: 0.8rem;
                }
            }

            /* Header chrome: the status badge and the "⋯" manage affordance,
               which is the single entry point to every round-level management
               action (edit / leave / finish / delete). It lives HERE, not in
               the score panel, so it is reachable from both tabs. */
            & .round-view__chrome {
                display: flex;
                align-items: center;
                gap: ${o("xs")};
                flex-shrink: 0;
            }

            & .round-view__manage {
                &.hidden { display: none; }
                width: 44px;
                height: 44px;
                flex-shrink: 0;
                background: none;
                border: none;
                border-radius: ${a("radius-pill")};
                font-family: inherit;
                font-size: 1.5rem;
                line-height: 1;
                color: ${a("text-muted")};
                cursor: pointer;

                &:hover, &:active { background: ${a("surface-sunken")}; color: ${a("text")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
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

            & .round-view__formats {
                margin-top: ${o("lg")};
                display: flex;
                gap: ${o("sm")};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: ${o("xs")};
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
                    padding: ${o("sm")} ${o("lg")};
                    cursor: pointer;
                    white-space: nowrap;
                    &.active { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                }
            }

            /* Playing-group selector (Phase 3.5) — shown only when the round
               has 2+ groups; scopes the score carousel to one group's balls
               and its rotated itinerary. */
            & .round-view__groups {
                margin-top: ${o("md")};
                display: flex;
                gap: ${o("sm")};
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: ${o("xs")};
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
                    padding: ${o("sm")} ${o("lg")};
                    cursor: pointer;
                    white-space: nowrap;
                    font-variant-numeric: tabular-nums;
                    &.active { background: ${a("accent")}; color: ${a("primary-text")}; border-color: ${a("accent")}; }
                }
            }

            & .round-view__share {
                margin-top: ${o("2xl")};
                padding: ${o("lg")};
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
                    gap: ${o("sm")};
                    margin-top: ${o("sm")};
                }
                & .round-view__share-url {
                    ${X()}
                    flex: 1;
                    font-size: 0.8rem;
                    color: ${a("text-muted")};
                }
                & .round-view__copy {
                    ${w()}
                    padding: 0 ${o("lg")};
                    font-weight: 700;
                    background: ${a("primary")};
                    color: ${a("primary-text")};
                    border: none;
                }
                & .round-view__share-hint {
                    margin: ${o("sm")} 0 0;
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
            gap: ${o("md")};
            background: ${a("hole-bar")};
            color: ${a("hole-bar-text")};
            padding: ${o("sm")} ${o("lg")};

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

            & .round-hole__stats { display: flex; gap: ${o("2xl")}; }
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
                padding: ${o("sm")} 0 ${o("md")};
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
    `;svc=this.inject(oe);router=this.inject(M);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new p(this.initPos.tab);pageVisible=new p(!document.hidden);hasRound=new $(()=>this.svc.round.get()!==null);hasScoring=new $(()=>this.svc.balls.get().length>0);manageOpen=new p(!1);shareUrl=new $(()=>{const e=this.tokenQ.get(),t="/tapscore/".replace(/\/+$/,"");return e?`${location.origin}${t}/round?token=${e}`:""});render(){this.track(I(()=>{const h=this.tokenQ.get();h&&this.svc.loadByToken(h,this.initPos).then(()=>{this.tab.get()==="leaderboard"&&this.svc.loadResult()})}));const e=()=>{this.svc.flushPending()};window.addEventListener("online",e),this.track(()=>window.removeEventListener("online",e));let t=null,n=null,i=null,r=!1;const l=h=>!r&&bn({pageVisible:h,status:this.svc.round.get()?.status??null}),d=()=>{const h=!document.hidden,b=wu(this.pageVisible.get(),h),g=l(h);this.pageVisible.set(h),b&&this.tokenQ.get()&&this.svc.refreshAll({feedWillReconnect:g})};document.addEventListener("visibilitychange",d),this.track(()=>document.removeEventListener("visibilitychange",d));const c=()=>{i!==null&&(clearInterval(i),i=null)},u=()=>{i===null&&(i=setInterval(()=>{this.svc.pollResult(),this.svc.refreshScorecard()},Iu))};this.track(I(()=>{const h=this.tokenQ.get()||null,b=bn({pageVisible:this.pageVisible.get(),status:this.svc.round.get()?.status??null});if(n!==h&&(t?.stop(),t=null,n=null,c(),r=!1),!b){t?.stop(),t=null,n=null,c(),r=!1;return}if(r){u();return}if(t===null&&h){n=h;try{const g=Tu({token:h,since:this.svc.persistedCursor(h),onEvent:x=>this.svc.onLiveResultEvent(x),onDegrade:()=>{t=null,r=!0,u()}});r||(t=g)}catch{t=null,r=!0,u()}}})),this.track(()=>{t?.stop(),t=null,n=null,c()}),this.track(I(()=>{const h=this.tab.get(),b=this.svc.selectedSlotDefId(),g=this.svc.holeIdx.get();if(this.router.route.get()!=="/round"||!this.hasRound.get())return;const x=this.tokenQ.get();if(!x)return;const O={token:x};h==="leaderboard"&&(O.tab="board");const D=this.svc.round.get()?.formatSlots[0]?.slotDefId??null;b&&b!==D&&(O.slot=b),g>0&&(O.hole=g+1),this.router.navigate(this.router.route.get(),{replace:!0,query:O})}));const f={not_started:"Not started",active:"Live",complete:"Finished"},m=this.wire(Cu,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},title:()=>vu(this.svc.round.get()),course:()=>this.svc.round.get()?.courseNameSnapshot??"",status:()=>{const h=this.svc.round.get()?.status??"not_started";return f[h]??h},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},groupTabs:{className:()=>this.svc.groups().length>1?"round-view__groups":"round-view__groups hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},manageBtn:{className:()=>this.hasRound.get()?"round-view__manage":"round-view__manage hidden",onclick:()=>this.manageOpen.set(!0)},dock:{className:()=>this.hasRound.get()&&!this.svc.keypadOpen.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const h=this.svc.currentPlayedHole();return h?this.svc.occLabel(h.playHoleId):""},holeSi:()=>{const h=this.svc.currentPlayHole()?.baseStrokeIndex;return h!=null?String(h):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});return this.$each(this.ref(m,"groupTabs"),new $(()=>this.svc.groups()),(h,b,g)=>this.groupPill(b,g),h=>h.id),this.$each(this.ref(m,"formats"),new $(()=>this.svc.round.get()?.formatSlots??[]),(h,b,g)=>this.slotPill(h,b,g),h=>h.slotDefId),this.spawn(md,this.ref(m,"hcpCheckin")),this.spawn(gl,this.ref(m,"scoring")),this.spawn(yu,this.ref(m,"story")),this.spawn(gi,this.ref(m,"leaderboard")),this.spawn(rd,this.ref(m,"seats")),this.spawn(Xl,this.ref(m,"claim")),this.spawn(cd,this.ref(m,"join")),this.spawn(_d,this.ref(m,"manageHost"),{open:this.manageOpen}),m}readUrlPosition(){const e=new URLSearchParams(location.search),t=e.get("slot"),n=Number(e.get("hole"));return{tab:e.get("tab")==="board"?"leaderboard":"score",selectedSlot:Pu(t),holeIdx:Number.isFinite(n)&&n>0?n-1:0}}groupPill(e,t){return this.wireEl(Nu,{pill:{textContent:()=>{const n=this.svc.groups()[e];if(!n)return`Group ${e+1}`;const i=[`Group ${e+1}`];n.startTime.includes(":")&&i.push(n.startTime);const r=this.svc.playHoleById(n.startPlayHoleId)?.courseHoleNumber;return r!==void 0&&n.startOrdinal!==1&&i.push(`H${r}`),i.join(" · ")},className:()=>this.svc.groupIdx.get()===e?"round-view__grp active":"round-view__grp",onclick:()=>this.svc.groupIdx.set(e)}},t)}slotPill(e,t,n){return this.wireEl(Eu,{pill:{textContent:()=>ai(e),className:()=>this.tab.get()==="leaderboard"&&this.svc.selectedSlotDefId()===e.slotDefId?"round-view__fmt active":"round-view__fmt",onclick:()=>{this.svc.selectSlot(e.slotDefId),this.tab.get()!=="leaderboard"&&(this.tab.set("leaderboard"),this.svc.loadResult())}}},n)}}function Fi(s){return s.formatIndex??s.slotIndex??null}function Ou(s,e){return s.filter(t=>Fi(t)===e)}function zu(s){return s.filter(e=>!e.path?.startsWith("producers")&&!e.path?.startsWith("playingGroups")&&e.path!=="route"&&Fi(e)===null)}function me(s){return`${s} ${s===1?"player":"players"}`}function ot(s,e){const t=s.formatId?e(s.formatId)??s.formatId:null,n=s.teamLabel;switch(s.code){case"team_size_above_max":if(t&&n&&s.actual!==void 0&&s.allowedMax!==void 0)return`${n} has ${me(s.actual)} — ${t} allows at most ${s.allowedMax} per team.`;break;case"team_size_below_min":if(t&&n&&s.actual!==void 0&&s.allowedMin!==void 0)return`${n} has ${me(s.actual)} — ${t} needs at least ${s.allowedMin} per team.`;break;case"empty_team_grouping":if(t&&n)return`${n} has no players — add at least one, or remove the team.`;break;case"team_count_above_max":if(t&&s.actual!==void 0&&s.allowedMax!==void 0)return`${s.actual} teams — ${t} allows at most ${s.allowedMax}.`;break;case"team_count_below_min":if(t&&s.actual!==void 0&&s.allowedMin!==void 0)return`${s.actual} teams — ${t} needs at least ${s.allowedMin}.`;break;case"slot_ball_count_above_max":if(t&&s.actual!==void 0&&s.allowedMax!==void 0)return`${me(s.actual)} in ${t} — it scores at most ${s.allowedMax}.`;break;case"slot_ball_count_below_min":if(t&&s.actual!==void 0&&s.allowedMin!==void 0)return`${me(s.actual)} in ${t} — it needs at least ${s.allowedMin}.`;break;case"slot_ball_count_not_multiple":if(t&&s.actual!==void 0)return`${t} pairs its balls, so it needs an even number — ${me(s.actual)} won't pair up.`;break;case"missing_team_grouping":if(t)return`${t} compares teams — under Teams, group the players into “Separate balls (a side)” teams, then tick them under “Scores”.`;break;case"ball_mode_violation":if(t&&s.actual!==void 0)return s.actual>1?`${t} is played with everyone on their own ball — a “One combined ball” team can’t play it. Use a “Separate balls (a side)” team instead.`:`${t} is played on one shared team ball — under Teams, group the players into a “One combined ball” team, then tick that team instead of the individual players.`;break;case"producer_count_violation":if(t&&s.actual!==void 0&&s.allowedMin!==void 0&&s.allowedMax!==void 0){if(s.allowedMax===1&&s.actual>1)return`${t} is played with everyone on their own ball — a “One combined ball” team can’t play it. Use a “Separate balls (a side)” team instead.`;const i=s.allowedMin===s.allowedMax?`exactly ${me(s.allowedMin)}`:`${s.allowedMin}–${s.allowedMax} players`;return`A ball in ${t} has ${me(s.actual)} — it needs ${i} per ball.`}break;case"producer_has_scores":return s.message;case"scored_ball_orphaned":return s.message;case"edit_locked_course_route":return"Scores have already been recorded — the course and route are locked for this round.";case"round_complete":return"This round is complete — its setup can no longer be edited.";case"not_editable":return"This round can no longer be edited."}return s.message}function Lu(s){return s?s.type==="flat"?String(s.pct):s.bands.length>0?String(s.bands[0].pct):"100":"100"}function Hu(s){const e={};if(!s||typeof s!="object")return e;for(const[t,n]of Object.entries(s))typeof n=="string"&&(e[t]=n);return e}function Au(s){const e=s.roundType;if(e==="full_18"||e==="front_9"||e==="back_9")return{preset:e,startHole:Mu(s)};const t=(s.route?.playHoles??[]).map(l=>l.courseHoleNumber),n=t[0]??1,i=new Set(t);return{preset:t.length<=9&&[...i].every(l=>l<=9)?"front_9":t.length<=9&&[...i].every(l=>l>=10)?"back_9":"full_18",startHole:n}}function Mu(s){return s.roundType==="back_9"?10:1}function Fu(s,e=()=>""){let t=1,n=1,i=1,r=1;const l=new Map,d=s.producers.map(g=>{const x=t++;l.set(g.producerDefId,x);const O=g.playerRef.kind==="guest";return{key:x,name:e(g.producerDefId),handicapIndex:_t(g.handicapIndex),gender:g.gender??"M",teeId:g.teeId,producerDefId:g.producerDefId,...O?{guestPlayerId:g.playerRef.id,guestOriginalName:e(g.producerDefId)}:{playerId:g.playerRef.id,genderKnown:g.gender!=null}}}),c=new Map;(s.teams??[]).forEach(g=>{c.set(g.id,n++)});const u=(s.teams??[]).map(g=>{const x=c.get(g.id),O={},D={};for(const P of g.members)if("producerDefId"in P){const B=l.get(P.producerDefId);B!==void 0&&(O[B]=String(P.allowancePct))}else{const B=c.get(P.teamId);B!==void 0&&(D[B]=!0)}return{key:x,kind:g.kind??"single_ball",formation:g.formation??"scramble",pctByPlayer:O,memberTeams:D,autoCreated:!1}}),f=(s.playingGroups??[]).map(g=>{const x={};for(const O of g.members){const D=l.get(O);D!==void 0&&(x[D]=!0)}return{key:i++,startTime:g.startTime??"",startHole:g.startHole??null,members:x}}),m=s.formats.map(g=>{const x={},O={},D=g.subjects;if(D){const P=new Set;for(const B of D)if(B.kind==="player"){const q=l.get(B.producerDefId);q!==void 0&&P.add(q)}else{const q=c.get(B.teamId);q!==void 0&&(O[q]=!0)}for(const B of d)x[B.key]=P.has(B.key)}return{key:r++,formatId:g.formatId,allowancePct:Lu(g.allowanceConfig),subjectPlayers:x,subjectTeams:O,config:Hu(g.formatConfig)}}),{preset:h,startHole:b}=Au(s);return{courseId:s.courseId,preset:h,startHole:b,players:d,teams:u,groups:f,formatSlots:m,nextKey:t,nextTeamKey:n,nextGroupKey:i,nextSlotKey:r}}function ju(s){return s.toLowerCase().startsWith("sv")?"Spel":"Game"}function Du(s,e){return new Intl.DateTimeFormat(e,{dateStyle:"medium"}).format(s)}function Bu(s=new Date,e=typeof navigator>"u"?"en":navigator.language,t=[]){const n=`${ju(e)} ${Du(s,e)}`,i=new Set(t.map(r=>r.trim().toLowerCase()).filter(r=>r.length>0));if(!i.has(n.toLowerCase()))return n;for(let r=2;r<=99;r++){const l=`${n} (${r})`;if(!i.has(l.toLowerCase()))return l}return n}const Gu=["scramble","greensomes","foursomes","custom"],at=2,qu="ABCDEFGH",Vu={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class Uu{loading=new p(!1);error=new p(null);courses=new p([]);tees=new p([]);roundName=new p("");courseId=new p("");preset=new p("full_18");startHole=new p(1);players=new p([]);teams=new p([]);groups=new p([]);formatSlots=new p([]);picked=new p([]);customOpen=new p(!1);submitting=new p(!1);diagnostics=new p([]);submitError=new p(null);editToken=new p(null);hasScores=new p(!1);editStatus=new p(null);editBlockedReason=new p(null);editPlayedAt=null;catalog=G.get(Ve);nextKey=1;nextSlotKey=1;nextTeamKey=1;nextGroupKey=1;nextPickKey=1;reset(){this.courses.set([]),this.tees.set([]),this.roundName.set(""),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.groups.set([]),this.formatSlots.set([]),this.picked.set([]),this.customOpen.set(!1),this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.editToken.set(null),this.hasScores.set(!1),this.editStatus.set(null),this.editBlockedReason.set(null),this.editPlayedAt=null,this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1,this.nextGroupKey=1,this.nextPickKey=1}async load(){this.seedDefaultName(),this.catalog.load().then(()=>this.ensureDefaultGame());const e=await A(this.loading,this.error,()=>v.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}seedDefaultName(e=new Date){if(this.roundName.get()!=="")return;const t=wt().map(n=>n.name??"").filter(n=>n!=="");this.roundName.set(Bu(e,void 0,t))}async loadForEdit(e){this.reset(),this.editToken.set(e),await this.catalog.load();const t=await A(this.loading,this.error,()=>v.friendlyRounds.setup({token:e}));if(!t)return;if(this.editStatus.set(t.status),!t.editable){this.editBlockedReason.set(t.reason);return}if(t.draft.producers.some(c=>"placeholder"in c)){this.editBlockedReason.set("has_open_seats");return}this.hasScores.set(t.hasScores),this.editPlayedAt=t.draft.playedAt,this.roundName.set(t.draft.name??"");const n=await A(this.loading,this.error,()=>v.setup.courses());n&&this.courses.set(n);const i=await A(this.loading,this.error,()=>v.setup.teesByCourse({courseId:t.draft.courseId}));this.tees.set(i??[]);const r=await A(this.loading,this.error,()=>v.friendlyRounds.balls({token:e})),l=new Map;for(const c of r??[])for(const u of c.players)l.set(u.producerDefId,u.displayName);const d=Fu(t.draft,c=>l.get(c)??"");this.courseId.set(d.courseId),this.preset.set(d.preset),this.startHole.set(d.startHole),this.players.set(d.players),this.teams.set(d.teams),this.groups.set(d.groups),this.formatSlots.set(d.formatSlots),this.picked.set([]),this.customOpen.set(!0),this.nextKey=d.nextKey,this.nextTeamKey=d.nextTeamKey,this.nextGroupKey=d.nextGroupKey,this.nextSlotKey=d.nextSlotKey}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const n=await A(this.loading,this.error,()=>v.setup.teesByCourse({courseId:e}))??[];this.tees.set(n);const i=new Set(n.map(l=>l.id)),r=n[0]?.id??"";this.players.set(this.players.get().map(l=>({...l,teeId:i.has(l.teeId)?l.teeId:r}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}]),this.syncGamesToRoster()}addMe(e){this.addFriend(e)}addFriend(e){if(this.hasPlayer(e.id))return;const t=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:e.displayName,handicapIndex:e.handicapIndex===null?"":_t(e.handicapIndex),gender:e.gender??"M",genderKnown:e.gender!=null,teeId:t,playerId:e.id}]),this.syncGamesToRoster()}hasPlayer(e){return this.players.get().some(t=>t.playerId===e)}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e)),this.groups.set(this.groups.get().map(t=>{if(t.members[e]===void 0)return t;const n={...t.members};return delete n[e],{...t,members:n}})),this.syncGamesToRoster()}patchPlayer(e,t){this.players.set(this.players.get().map(n=>n.key===e?{...n,...t}:n))}ensureDefaultGame(){if(this.editToken.get()||this.formatSlots.get().length>0||this.picked.get().length>0||this.catalog.byId("stableford_individual")&&(this.pickGame("stableford_individual"),this.formatSlots.get().length>0))return;const e=this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",n={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{},config:this.defaultConfigFor(t)};this.formatSlots.set([...this.formatSlots.get(),n])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}defaultConfigFor(e){return{...this.catalog.byId(e)?.defaults.formatConfig??{}}}setSlotConfig(e,t,n){const i=this.slotByKey(e);i&&this.patchFormatSlot(e,{config:{...i.config,[t]:n}})}slotConfigValue(e,t){return this.slotByKey(e)?.config[t.key]??t.default}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(n=>n.key===e?{...n,...t}:n))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t,config:this.defaultConfigFor(t)})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return qu[e]??`T${e+1}`}presetGames(){return this.catalog.presets()}shapeOfGame(e){const t=this.catalog.byId(e);return t?this.catalog.playableShape(t):null}isIndividualShape(e){return e.size.max===1&&e.count.max===void 0}isIndividualGame(e){const t=this.shapeOfGame(e);return t?this.isIndividualShape(t):!1}minPlayersFor(e){const t=this.shapeOfGame(e);return!t||this.isIndividualShape(t)?0:t.count.min*t.size.min}gameFits(e){return this.players.get().length>=this.minPlayersFor(e)}gameNeedsText(e){const t=this.minPlayersFor(e),n=Math.max(0,t-this.players.get().length);return`Needs ${t} players — add ${n} more.`}gameShapeText(e){const t=this.shapeOfGame(e);if(!t)return"";if(this.isIndividualShape(t))return"Everyone plays their own ball";const n=t.count.max===t.count.min?`${t.count.min} balls`:`${t.count.min}+ balls`,i=t.size.max===1?"one player each":t.size.min===t.size.max?`${t.size.min} players each`:t.size.min===1?"each a player or a team":`${t.size.min}–${t.size.max} players each`;return`${n} · ${i}`}isGamePicked(e){return this.picked.get().some(t=>t.formatId===e)}pickedByKey(e){return this.picked.get().find(t=>t.key===e)??null}gameLabel(e){return this.catalog.labelOf(e)??e}toggleGame(e){const t=this.picked.get().find(n=>n.formatId===e);t?this.unpickGame(t.key):this.pickGame(e)}pickGame(e){const t=this.shapeOfGame(e);if(!t||this.isGamePicked(e)||!this.gameFits(e))return;const n=this.isIndividualShape(t)?null:this.adoptableTeams(t),i=n?{key:this.nextPickKey++,formatId:e,ballCount:n.length,ballByPlayer:this.assignmentFromTeams(n),ballTeams:Object.fromEntries(n.map((r,l)=>[l,r.key]))}:{key:this.nextPickKey++,formatId:e,ballCount:this.isIndividualShape(t)?0:t.count.min,ballByPlayer:this.defaultAssignment(t,this.isIndividualShape(t)?0:t.count.min),ballTeams:{}};this.picked.set([...this.picked.get(),i]),this.regenerateGame(i)}adoptableTeams(e){const t=this.teams.get().filter(i=>i.kind==="multi_ball");if(t.length===0||t.length<e.count.min||e.count.max!==void 0&&t.length>e.count.max)return null;const n=new Set;for(const i of t){const r=this.teamMemberCount(i.key);if(r<e.size.min||r>e.size.max)return null;for(const l of Object.keys(i.pctByPlayer)){if(n.has(Number(l)))return null;n.add(Number(l))}}return t}assignmentFromTeams(e){const t={};for(const n of this.players.get()){const i=e.findIndex(r=>r.pctByPlayer[n.key]!==void 0);i>=0&&(t[n.key]=i)}return t}unpickGame(e){this.picked.set(this.picked.get().filter(t=>t.key!==e)),this.formatSlots.set(this.formatSlots.get().filter(t=>t.gameKey!==e)),this.collectUnreferencedTeams()}collectUnreferencedTeams(){const e=new Set;for(const n of this.formatSlots.get())for(const[i,r]of Object.entries(n.subjectTeams))r&&e.add(Number(i));for(const n of this.picked.get())for(const i of Object.values(n.ballTeams))e.add(i);const t=this.teams.get().filter(n=>!n.autoCreated||e.has(n.key));t.length!==this.teams.get().length&&this.teams.set(t)}defaultAssignment(e,t){const n={};if(t<=0)return n;const i=this.players.get(),r=i.length%t===0?i.length/t:e.size.min,l=Math.max(1,Math.min(r,e.size.max));let d=0;for(let c=0;c<t&&d<i.length;c++)for(let u=0;u<l&&d<i.length;u++,d++)n[i[d].key]=c;return n}gameBalls(e){const t=this.pickedByKey(e);return t?Array.from({length:t.ballCount},(n,i)=>i):[]}ballOf(e,t){const n=this.pickedByKey(e)?.ballByPlayer[t];return n===void 0?null:n}assignBall(e,t,n){const i=this.pickedByKey(e);if(!i)return;const r={...i.ballByPlayer};n===null?delete r[t]:r[t]=n,this.applyGameEdit({...i,ballByPlayer:r})}applyGameEdit(e){this.picked.set(this.picked.get().map(t=>t.key===e.key?e:t)),this.regenerateGame(e),this.syncGamesFromTeams(e.key)}syncGamesFromTeams(e){const t=new Map(this.teams.get().map(r=>[r.key,r])),n=[],i=this.picked.get().map(r=>{if(r.key===e)return r;const l={...r.ballByPlayer};let d=!1;for(const[u,f]of Object.entries(r.ballTeams)){const m=t.get(f);if(!m)continue;const h=Number(u);for(const[b,g]of Object.entries(l)){const x=Number(b);g===h&&m.pctByPlayer[x]===void 0&&(delete l[x],d=!0)}for(const b of Object.keys(m.pctByPlayer)){const g=Number(b);l[g]!==h&&(l[g]=h,d=!0)}}if(!d)return r;const c={...r,ballByPlayer:l};return n.push(c),c});this.picked.set(i);for(const r of n)this.regenerateGame(r)}forkGame(e){const t=this.pickedByKey(e);if(!t)return;const n=this.teams.get(),i={},r=[];let l=-1;for(const[c,u]of Object.entries(t.ballTeams)){const f=n.findIndex(h=>h.key===u);if(f<0)continue;const m=n[f];r.push({...m,key:this.nextTeamKey++,pctByPlayer:{...m.pctByPlayer},memberTeams:{...m.memberTeams},autoCreated:!0}),i[Number(c)]=r.at(-1).key,f>l&&(l=f)}this.teams.set([...n.slice(0,l+1),...r,...n.slice(l+1)]);const d={...t,ballTeams:i};this.picked.set(this.picked.get().map(c=>c.key===e?d:c)),this.regenerateGame(d)}canAddBall(e){const t=this.pickedByKey(e);if(!t||t.ballCount===0)return!1;const n=this.shapeOfGame(t.formatId);return!!n&&(n.count.max===void 0||t.ballCount<n.count.max)}addBall(e){const t=this.pickedByKey(e);!t||!this.canAddBall(e)||this.applyGameEdit({...t,ballCount:t.ballCount+1})}slotForGame(e){return this.formatSlots.get().find(t=>t.gameKey===e)??null}ballMembers(e,t){const n=this.pickedByKey(e);return n?this.players.get().filter(i=>n.ballByPlayer[i.key]===t):[]}sittingOut(e){const t=this.pickedByKey(e);return!t||t.ballCount===0?[]:this.players.get().filter(n=>t.ballByPlayer[n.key]===void 0)}regenerateGame(e){const t=this.shapeOfGame(e.formatId);if(!t)return;const n=this.players.get(),i={},r={},l=[];let d=this.teams.get();for(let m=0;m<e.ballCount;m++){const h=n.filter(P=>e.ballByPlayer[P.key]===m),b=e.ballTeams[m];if(h.length===0){b!==void 0&&(r[m]=b);continue}if(h.length===1&&t.size.min===1){i[h[0].key]=!0,b!==void 0&&(r[m]=b);continue}const g=d.find(P=>P.key===e.ballTeams[m]),x=Object.fromEntries(h.map(P=>[P.key,g?.pctByPlayer[P.key]??"100"]));if(g){d=d.map(P=>P.key===g.key?{...P,kind:"multi_ball",pctByPlayer:x}:P),r[m]=g.key,l.push(g.key);continue}const O={key:this.nextTeamKey++,kind:"multi_ball",formation:"custom",pctByPlayer:x,memberTeams:{},autoCreated:!0},D=this.lastTeamIndexOf(d,r,e);d=[...d.slice(0,D+1),O,...d.slice(D+1)],r[m]=O.key,l.push(O.key)}if(e.ballCount>0)for(const m of n)i[m.key]===void 0&&(i[m.key]=!1);this.teams.set(d),this.picked.set(this.picked.get().map(m=>m.key===e.key?{...m,ballTeams:r}:m));const c=this.formatSlots.get(),u=c.find(m=>m.gameKey===e.key),f={key:u?.key??this.nextSlotKey++,formatId:e.formatId,allowancePct:u?.allowancePct??"100",subjectPlayers:i,subjectTeams:Object.fromEntries(l.map(m=>[m,!0])),config:u?.config??this.defaultConfigFor(e.formatId),gameKey:e.key};this.formatSlots.set(u?c.map(m=>m.key===f.key?f:m):[...c,f]),this.collectUnreferencedTeams()}lastTeamIndexOf(e,t,n){const i=new Set([...Object.values(t),...Object.values(n.ballTeams)]);let r=e.length-1;for(const[l,d]of e.entries())i.has(d.key)&&(r=l);return r}syncGamesToRoster(){const e=this.players.get(),t=new Set(e.map(i=>i.key)),n=this.picked.get().map(i=>{if(i.ballCount===0)return i;const r=this.shapeOfGame(i.formatId)?.size.min??1,l={};for(const[d,c]of Object.entries(i.ballByPlayer))t.has(Number(d))&&c<i.ballCount&&(l[Number(d)]=c);for(const d of e)if(l[d.key]===void 0){for(let c=0;c<i.ballCount;c++)if(Object.values(l).filter(f=>f===c).length<r){l[d.key]=c;break}}return{...i,ballByPlayer:l}});this.picked.set(n);for(const i of n)this.regenerateGame(i);this.syncGamesFromTeams(-1)}gameWarnings(e){const t=this.pickedByKey(e),n=t?this.shapeOfGame(t.formatId):null;if(!t||!n)return[];const i=this.gameLabel(t.formatId);if(!this.gameFits(t.formatId))return[`${i}: ${this.gameNeedsText(t.formatId)}`];const r=[];for(let l=0;l<t.ballCount;l++){const d=this.ballMembers(e,l).length,c=`${i} ball ${this.teamLetter(l)}`;if(d<n.size.min){const u=n.size.min-d;r.push(`${c} needs ${u} more player${u===1?"":"s"}.`)}else d>n.size.max&&r.push(`${c} takes at most ${n.size.max}.`)}return r}gameSummary(e){const t=this.pickedByKey(e);if(!t)return"";const n=r=>r.name.trim()||"Player",i=[];if(t.ballCount===0)i.push("everyone");else{const r=[];for(let d=0;d<t.ballCount;d++){const c=this.ballMembers(e,d);c.length>0&&r.push(c.map(n).join(" & "))}i.push(r.join(" vs "));const l=this.sittingOut(e);l.length>0&&i.push(`${l.map(n).join(", ")} sitting out`)}return i.push(`${this.slotForGame(e)?.allowancePct??"100"}% allowance`),i.filter(r=>r!=="").join(" · ")}teamsOfGame(e){const t=this.pickedByKey(e);if(!t)return[];const n=this.slotForGame(e)?.subjectTeams??{},i=[];for(let r=0;r<t.ballCount;r++){const l=this.teamByKey(t.ballTeams[r]??-1);l&&n[l.key]&&i.push(l)}return i}gameSharedWith(e){const t=new Set(this.teamsOfGame(e).map(r=>r.key));if(t.size===0)return[];const n=this.slotForGame(e)?.key,i=[];for(const r of this.formatSlots.get()){if(r.key===n)continue;Object.entries(r.subjectTeams).some(([d,c])=>c&&t.has(Number(d)))&&i.push(this.gameLabel(r.formatId))}return i}gameSharesSides(e){return this.gameSharedWith(e).length>0}gameSidesText(e){const t=this.pickedByKey(e);if(!t||this.teamsOfGame(e).length===0)return"";const n=this.slotForGame(e)?.subjectTeams??{},i=[];for(let d=0;d<t.ballCount;d++){const c=this.teamByKey(t.ballTeams[d]??-1);if(c&&n[c.key]){i.push(this.teamLabel(c));continue}const u=this.ballMembers(e,d);u.length>0&&i.push(u.map(f=>f.name.trim()||"Player").join(" & "))}const r=i.join(" vs "),l=this.gameSharedWith(e);return l.length===0?`Sides: ${r}.`:`Sides: ${r} — shared with ${this.joinLabels(l)}.`}joinLabels(e){return e.length<=1?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`}adjustGame(e){this.gameSharesSides(e)&&this.forkGame(e);const t=new Set(Object.values(this.pickedByKey(e)?.ballTeams??{}));this.teams.set(this.teams.get().map(n=>t.has(n.key)?{...n,autoCreated:!1}:n)),this.formatSlots.set(this.formatSlots.get().map(n=>n.gameKey===e?{...n,gameKey:void 0}:n)),this.picked.set(this.picked.get().filter(n=>n.key!==e)),this.customOpen.set(!0)}addCustomGame(){this.customOpen.set(!0);const e=new Set(this.formatSlots.get().map(n=>n.formatId)),t=this.catalog.descriptors.get().find(n=>!e.has(n.id));this.addFormatSlot(t?.id)}showFlexible(){return this.customOpen.get()||this.customSlots().length>0||this.customTeams().length>0}customSlots(){return this.formatSlots.get().filter(e=>e.gameKey===void 0)}customTeams(){const e=this.cardOwnedTeamKeys();return this.teams.get().filter(t=>!e.has(t.key))}cardOwnedTeamKeys(){const e=new Set;for(const t of this.picked.get())for(const n of Object.values(t.ballTeams))e.add(n);return e}slotIndex(e){return this.formatSlots.get().findIndex(t=>t.key===e)}formations=Gu;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{},autoCreated:!1}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(n=>n.key===e?{...n,kind:t,memberTeams:t==="single_ball"?{}:n.memberTeams}:n)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,n){const i=this.teamByKey(e);if(!i||i.kind!=="multi_ball"||t===e)return;const r={...i.memberTeams};if(n){if(this.teamMemberCount(e)>=ht)return;r[t]=!0}else delete r[t];this.teams.set(this.teams.get().map(l=>l.key===e?{...l,memberTeams:r}:l))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(n=>t.memberTeams[Number(n)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{let t=!1;const n={...e.subjectTeams};for(const i of this.teams.get())n[i.key]===!0&&!this.teamKindFitsFormat(e.formatId,i.kind)&&(delete n[i.key],t=!0);return t?{...e,subjectTeams:n}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}teamKindFitsFormat(e,t){return this.isSideFormat(e)?t==="multi_ball":t==="single_ball"||this.catalog.acceptsSideSubjects(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const n={...t.memberTeams};return delete n[e],{...t,memberTeams:n}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const n={...t.subjectTeams};return delete n[e],{...t,subjectTeams:n}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.teams.get().findIndex(n=>n.key===e.key);return`Team ${this.teamLetter(Math.max(0,t))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(n=>n.key===e?{...n,formation:t}:n))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,n){const i=this.teamByKey(e);if(!i)return;const r={...i.pctByPlayer};if(n){if(r[t]!==void 0||this.teamMemberCount(e)>=ht)return;r[t]=r[t]??"100"}else delete r[t];this.teams.set(this.teams.get().map(l=>l.key===e?{...l,pctByPlayer:r}:l))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=ht}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let n=0;for(const i of this.players.get()){const r=t.pctByPlayer[i.key];if(r===void 0)continue;const l=this.derivedCH(i);if(!l)return null;n+=this.parsePct(r)*l.ch/100}return Math.round(n)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<at)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=at;let n=t;for(const i of this.teams.get())e.memberTeams[i.key]===!0&&i.kind==="single_ball"&&Object.keys(i.pctByPlayer).length>=at&&n++;return n>=at}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,n){const i=this.teamByKey(e);!i||i.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(r=>r.key===e?{...r,pctByPlayer:{...r.pctByPlayer,[t]:n}}:r))}groupsEnabled(){return this.groups.get().length>0}splitIntoGroups(){if(this.groupsEnabled())return;const e={};for(const t of this.players.get())e[t.key]=!0;this.groups.set([{key:this.nextGroupKey++,startTime:"",startHole:null,members:e},{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}clearGroups(){this.groups.set([])}addGroup(){this.groupsEnabled()&&this.groups.set([...this.groups.get(),{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}removeGroup(e){const t=this.groups.get().filter(n=>n.key!==e);this.groups.set(t.length>1?t:[])}groupByKey(e){return this.groups.get().find(t=>t.key===e)??null}groupLabel(e){const t=this.groups.get().findIndex(n=>n.key===e.key);return`Group ${Math.max(0,t)+1}`}groupMemberIn(e,t){return this.groupByKey(e)?.members[t]===!0}setGroupMember(e,t,n){this.groups.set(this.groups.get().map(i=>{const r=i.key===e,l=i.members[t]===!0;if(r&&n&&!l)return{...i,members:{...i.members,[t]:!0}};if(l&&(!r||!n)){const d={...i.members};return delete d[t],{...i,members:d}}return i}))}setGroupStartTime(e,t){this.groups.set(this.groups.get().map(n=>n.key===e?{...n,startTime:t}:n))}setGroupStartHole(e,t){this.groups.set(this.groups.get().map(n=>n.key===e?{...n,startHole:t}:n))}groupSize(e){const t=this.groupByKey(e);return t?this.players.get().filter(n=>t.members[n.key]===!0).length:0}ungroupedPlayers(){if(!this.groupsEnabled())return[];const e=new Set;for(const t of this.groups.get())for(const n of Object.keys(t.members))t.members[Number(n)]&&e.add(Number(n));return this.players.get().filter(t=>!e.has(t.key))}crossGroupTeamWarnings(){if(!this.groupsEnabled())return[];const e=new Map;this.groups.get().forEach((n,i)=>{for(const r of Object.keys(n.members))n.members[Number(r)]&&e.set(Number(r),i)});const t=[];for(const n of this.teams.get()){if(n.kind!=="single_ball"||!this.isTeamLive(n))continue;const i=new Set;for(const r of Object.keys(n.pctByPlayer)){const l=e.get(Number(r));l!==void 0&&i.add(l)}i.size>1&&t.push(`${this.teamLabel(n)} plays one combined ball, but its players are in different groups — keep them in the same group.`)}return t}buildGroups(e,t){return this.groups.get().map(n=>({members:e.filter(i=>n.members[i.key]===!0).map(i=>t.get(i.key)),...n.startTime.trim()!==""?{startTime:n.startTime.trim()}:{},...n.startHole!==null?{startHole:n.startHole}:{}})).filter(n=>n.members.length>0)}diagnosticsForGroups(){return this.diagnostics.get().filter(e=>e.path?.startsWith("playingGroups"))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,n){const i=this.slotByKey(e);i&&this.patchFormatSlot(e,{subjectPlayers:{...i.subjectPlayers,[t]:n}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,n){const i=this.slotByKey(e);i&&this.patchFormatSlot(e,{subjectTeams:{...i.subjectTeams,[t]:n}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return Vu[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,n)=>t-n);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1),this.groups.set(this.groups.get().map(n=>n.startHole!==null&&!t.includes(n.startHole)?{...n,startHole:null}:n))}derivedCH(e){const t=ie(e.handicapIndex);if(t===null)return null;const n=this.teeById(e.teeId);if(!n)return null;const i=n.ratings.find(l=>l.gender===e.gender);if(!i)return null;const r={handicapIndex:t,slope:i.slope,courseRating:i.courseRating,par:i.par};return{ch:ia(r),raw:ni(r),rating:i,teeName:n.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}humanizedRoster(){return this.diagnostics.get().filter(e=>e.path==="producers").map(e=>ot(e,t=>this.catalog.labelOf(t)))}humanizedRoute(){return this.diagnostics.get().filter(e=>e.path==="route").map(e=>ot(e,t=>this.catalog.labelOf(t)))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const n of this.formatSlots.get()){for(const i of e)n.subjectPlayers[i.key]!==!1&&t.add(i.key);for(const i of this.teams.get())if(n.subjectTeams[i.key]===!0)for(const r of e)i.pctByPlayer[r.key]!==void 0&&t.add(r.key)}return e.filter(n=>!t.has(n.key))}diagnosticsForFormat(e){return Ou(this.diagnostics.get(),e)}humanizedForFormat(e){return this.diagnosticsForFormat(e).map(t=>ot(t,n=>this.catalog.labelOf(n)))}generalDiagnostics(){return zu(this.diagnostics.get())}humanizedGeneral(){return this.generalDiagnostics().map(e=>ot(e,t=>this.catalog.labelOf(t)))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const n=this.liveTeamKeySet(),i=[];for(const r of this.teams.get()){if(!n.has(r.key))continue;const l=e.filter(d=>r.pctByPlayer[d.key]!==void 0).map(d=>({producerDefId:t.get(d.key),allowancePct:this.parsePct(r.pctByPlayer[d.key])}));if(r.kind==="multi_ball")for(const d of this.teams.get())r.memberTeams[d.key]===!0&&d.key!==r.key&&d.kind==="single_ball"&&n.has(d.key)&&l.push({teamId:String(d.key)});i.push({id:String(r.key),label:this.teamLabel(r),formation:r.formation,kind:r.kind,members:l})}return i}buildFormats(e,t){const n=this.liveTeamKeySet();return this.formatSlots.get().map(i=>{const r=this.isSideFormat(i.formatId),l=[];if(!r)for(const d of e)i.subjectPlayers[d.key]!==!1&&l.push({kind:"player",producerDefId:t.get(d.key)});for(const d of this.teams.get())i.subjectTeams[d.key]===!0&&n.has(d.key)&&this.teamKindFitsFormat(i.formatId,d.kind)&&l.push({kind:"team",teamId:String(d.key)});return{formatId:i.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(i.allowancePct)},subjects:l,...Object.keys(i.config).length>0?{formatConfig:{...i.config}}:{}}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),n=e.indexOf(t);return n<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(n),...e.slice(0,n)].map(r=>({courseHoleNumber:r})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}slotSubjectCount(e){const t=this.liveTeamKeySet(),n=this.isSideFormat(e.formatId);let i=0;if(!n)for(const r of this.players.get())e.subjectPlayers[r.key]!==!1&&i++;for(const r of this.teams.get())e.subjectTeams[r.key]===!0&&t.has(r.key)&&this.teamKindFitsFormat(e.formatId,r.kind)&&i++;return i}noSubjectsMessage(e){const t=this.catalog.labelOf(e.formatId)??e.formatId;if(e.gameKey!==void 0)return`${t} has nobody playing — put players on a ball above.`;if(!this.isSideFormat(e.formatId))return`${t} has nothing to score — tick at least one player or team under “Scores”.`;const n=this.teams.get();if(n.some(d=>d.kind==="multi_ball"&&this.isTeamLive(d)))return`${t} has no teams ticked — tick the teams it plays under “Scores”.`;if(n.some(d=>d.kind==="single_ball"&&this.isTeamLive(d)))return`${t} is played between teams whose players play their own balls — a “One combined ball” team doesn’t fit. Under Teams, switch the team to “Separate balls (a side)”, then tick it under “Scores”.`;const i=this.catalog.classifyId(e.formatId),r=i?.teamCount?.min!==void 0&&i.teamCount.min===i.teamCount.max?`${i.teamCount.min} teams`:i?.teamCount?.min!==void 0?`at least ${i.teamCount.min} teams`:"teams",l=i&&i.teamSize.min===i.teamSize.max?` of ${i.teamSize.min} players`:"";return`${t} is a team game — under Teams, create ${r}${l} with kind “Separate balls (a side)”, add the players, then tick the teams under “Scores”.`}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];if(e.forEach((i,r)=>{i.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${r}].name`}),ie(i.handicapIndex)===null&&t.push({code:"missing_index",message:"Handicap index required",path:`producers[${r}].handicapIndex`}),i.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${r}].teeId`})}),this.formatSlots.get().forEach((i,r)=>{this.slotSubjectCount(i)===0&&t.push({code:"no_subjects",message:this.noSubjectsMessage(i),formatIndex:r,path:`formats[${r}]`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};const n=this.editToken.get();this.submitting.set(!0);try{const i=new Map;e.forEach((b,g)=>{i.set(b.key,b.producerDefId??(n?`p-${b.key}`:`p${g+1}`))});const r=[];for(const b of e){const g=ie(b.handicapIndex),x=b.playerId?{kind:"player",id:b.playerId}:b.guestPlayerId?{kind:"guest",id:b.guestPlayerId}:{kind:"guest",id:(await v.guestPlayers.create({displayName:b.name.trim(),gender:b.gender,handicapIndex:g})).id};r.push({producerDefId:i.get(b.key),playerRef:x,handicapIndex:g,gender:b.gender,teeId:b.teeId})}const{roundType:l,route:d}=this.buildRoute(),c=this.buildTeams(e,i),u=this.buildGroups(e,i),f=this.roundName.get().trim(),m={courseId:this.courseId.get(),playedAt:this.editPlayedAt??new Date().toISOString().slice(0,10),...f?{name:f}:{},roundType:l,...d?{route:d}:{},producers:r,...c.length>0?{teams:c}:{},formats:this.buildFormats(e,i),...u.length>0?{playingGroups:u}:{}};if(n){for(const g of e){const x=g.name.trim();!g.guestPlayerId||g.guestOriginalName===void 0||x!==g.guestOriginalName&&(await v.friendlyRounds.renameGuest({token:n,guestPlayerId:g.guestPlayerId,displayName:x}),this.players.set(this.players.get().map(O=>O.key===g.key?{...O,guestOriginalName:x}:O)))}const b=await v.friendlyRounds.editSetup({token:n,draft:m});return b.ok?{ok:!0,token:n}:(this.diagnostics.set(b.diagnostics),{ok:!1})}const h=await v.friendlyRounds.create({draft:m});return h.ok?(He({token:h.friendlyRound.shareToken,courseName:h.round.courseNameSnapshot??"",name:h.round.name,date:h.round.date,status:h.round.status,completedAt:h.round.completedAt,lastSeenAt:new Date().toISOString()}),{ok:!0,token:h.friendlyRound.shareToken}):(this.diagnostics.set(h.diagnostics),{ok:!1})}catch(i){return this.submitError.set(i instanceof K?i.message==="Validation failed"?["The server could not read this setup — this should not happen, please report it.",...(i.details??[]).slice(0,3).map(r=>`${r.path}: ${r.message}`)].join(`
`):i.message:n?"Could not save the round. Try again.":"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}const Ku=["full_18","front_9","back_9"],Ut=()=>we()==="sv"?",":".",Wu=_(`
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
`),yn=_(`
    <button bind="key" class="hcp-key" type="button">
        <span bind="num" class="hcp-key__num"></span>
        <span bind="lbl" class="hcp-key__lbl"></span>
    </button>
`),Yu=_(`
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
`),Qu=_(`
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
`),Xu=_(`
    <div class="fslot__group">
        <span bind="label" class="fslot__label"></span>
        <div bind="options" class="fslot__seg"></div>
    </div>
`),Ju=_(`
    <button bind="opt" type="button"></button>
`),vn=_(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),Zu=_(`
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
`),eh=_(`
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
`),th=_(`
    <button bind="row" type="button" class="frow">
        <span bind="name" class="frow__name"></span>
        <span bind="username" class="frow__username"></span>
        <span bind="hcp" class="frow__hcp"></span>
    </button>
`),wn=_(`
    <button bind="card" class="gcard" type="button">
        <span bind="name" class="gcard__name"></span>
        <span bind="tag" class="gcard__tag"></span>
        <span bind="shape" class="gcard__shape"></span>
    </button>
`),sh=_(`
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
`),nh=_(`
    <div class="grow">
        <span bind="name" class="grow__name"></span>
        <div bind="seg" class="fslot__seg"></div>
    </div>
`),xn=_(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class ih extends E{static styles=`
        .setup {
            padding: ${o("lg")} ${o("lg")} ${o("2xl")};

            /* Not-editable (complete / no stored draft): only the head + blocked
               note + back button remain; the form body is removed. */
            &.setup--blocked > .setup__section,
            &.setup--blocked > .setup__banner,
            &.setup--blocked > .setup__create,
            &.setup--blocked > .setup__cancel { display: none; }

            & .setup__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${a("text-muted")};
                cursor: pointer; padding: ${o("xs")} 0; margin-bottom: ${o("md")};
            }

            & .setup__head {
                margin-bottom: ${o("xl")};
                & h1 {
                    margin: 0; font-family: ${a("font-display")}; font-weight: 600;
                    font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
            }

            & .setup__section {
                margin-bottom: ${o("xl")};
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${o("sm")}; font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            /* The game cards (format-templates §4). Two per row on a phone; the
               "+ Custom game" card spans the full width as the last one. */
            & .setup__cards {
                display: grid; grid-template-columns: 1fr 1fr; gap: ${o("sm")};
                margin-bottom: ${o("md")};
            }
            & .gcard {
                ${w()}
                display: flex; flex-direction: column; gap: 2px; text-align: left;
                padding: ${o("md")}; font-family: inherit; cursor: pointer;
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

            & .setup__name {
                ${X()}
                width: 100%;
                padding: ${o("md")};
                font-size: 1rem;
                font-family: inherit;
            }

            & .setup__hint { margin: 0 0 ${o("md")}; color: ${a("text-muted")}; font-size: 0.82rem; }

            & .setup__note {
                margin: ${o("sm")} 0 0; font-size: 0.82rem; color: ${a("text-muted")};
                &:empty { display: none; }
            }

            & .setup__warn {
                margin: ${o("sm")} 0 0; font-size: 0.82rem; color: ${a("error")};
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
                display: flex; gap: ${o("sm")}; margin-bottom: ${o("md")};
                & button {
                    ${w()}
                    flex: 1; padding: ${o("md")} 0;
                    font-family: inherit; font-weight: 700; font-size: 0.9rem;
                    &.on { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                }
            }

            & .setup__startrow {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${o("md")}; font-size: 0.9rem; color: ${a("text-muted")};
            }

            & .setup__players { display: flex; flex-direction: column; gap: ${o("md")}; }

            & .player {
                padding: ${o("md")}; ${C()}
                display: flex; flex-direction: column; gap: ${o("sm")};

                & .player__top { display: flex; gap: ${o("sm")}; align-items: center; }
                & .player__name { ${X()} flex: 1; padding: ${o("md")}; font-size: 1rem; }
                & .player__remove {
                    ${w()}
                    width: 38px; height: 38px; flex-shrink: 0;
                    font-size: 1rem; color: ${a("text-muted")};
                }
                & .player__fields { display: flex; gap: ${o("sm")}; align-items: stretch; }
                & .player__index { ${X()} flex: 1; min-width: 0; padding: ${o("md")}; font-size: 1rem; }
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
                ${w()}
                width: 100%; margin-top: ${o("md")}; padding: ${o("md")};
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }
            & .setup__add.hidden { display: none; }

            & .setup__friends {
                margin-top: ${o("sm")}; padding: ${o("sm")}; ${C()}
                &.hidden { display: none; }

                & .setup__friendrows { display: flex; flex-direction: column; }
                & .setup__hint { margin: ${o("xs")} ${o("sm")}; }
                & .setup__friendrows:not(:empty) + .setup__hint { display: none; }

                & .frow {
                    display: flex; align-items: baseline; gap: ${o("sm")};
                    width: 100%; padding: ${o("md")} ${o("sm")};
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
                color: ${a("error")}; font-size: 0.875rem; margin-bottom: ${o("md")};
                white-space: pre-line;
                &:empty { display: none; }
            }

            & .setup__fslots { display: flex; flex-direction: column; gap: ${o("md")}; }

            & .fslot {
                padding: ${o("md")}; ${C()}
                display: flex; flex-direction: column; gap: ${o("sm")};

                & .fslot__top { display: flex; gap: ${o("sm")}; align-items: center; }
                & .fslot__teamname { flex: 1; min-width: 0; font-weight: 700; font-size: 0.95rem; }
                & .fslot__teammeta {
                    margin: ${o("xs")} 0 0; font-size: 0.78rem; color: ${a("text-muted")};
                    &:empty { display: none; }
                }
                & .fslot__format { flex: 1; min-width: 0; font-size: 1rem; }
                & .fslot__remove {
                    ${w()}
                    width: 38px; height: 38px; flex-shrink: 0;
                    font-size: 1rem; color: ${a("text-muted")};
                }
                & .fslot__desc {
                    margin: 0; font-size: 0.8rem; color: ${a("text-muted")};
                    &:empty { display: none; }
                }

                & .fslot__group {
                    display: flex; flex-direction: column; gap: ${o("xs")};
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

                & .fslot__teamrows { display: flex; flex-direction: column; gap: ${o("xs")}; }
                & .trow {
                    display: flex; align-items: center; justify-content: space-between; gap: ${o("sm")};
                    & .trow__name { font-size: 0.9rem; }
                    & .trow__team { width: 96px; flex-shrink: 0; font-size: 0.95rem; }
                }

                & .irow {
                    display: flex; align-items: center; gap: ${o("sm")};
                    font-size: 0.9rem; cursor: pointer;
                    & .irow__chk { width: 18px; height: 18px; flex-shrink: 0; accent-color: ${a("primary")}; }
                }

                & .mrow {
                    display: flex; align-items: center; justify-content: space-between; gap: ${o("sm")};
                    & .mrow__pick { display: flex; align-items: center; gap: ${o("sm")}; font-size: 0.9rem; cursor: pointer; }
                    & .mrow__pct {
                        display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
                        font-size: 0.85rem; color: ${a("text-muted")};
                        &[hidden] { display: none; }
                        & input { ${X()} width: 56px; padding: ${o("xs")} ${o("sm")}; font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${o("xs")};
                    & button {
                        ${w()}
                        flex: 1; padding: ${o("sm")} 0;
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
                    display: flex; align-items: center; gap: ${o("sm")};
                    & .grow__name { flex: 1; min-width: 0; font-size: 0.9rem; }
                    & .fslot__seg { flex: 0 0 auto; & button { min-width: 44px; flex: 0 0 auto; padding: ${o("sm")}; } }
                }
                & .gaddball {
                    ${w()}
                    align-self: flex-start; margin-top: ${o("xs")};
                    padding: ${o("xs")} ${o("sm")};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }
                & .gsummary {
                    margin: 0; padding-top: ${o("xs")}; border-top: 1px solid ${a("border")};
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
                    ${w()}
                    align-self: flex-start; padding: ${o("xs")} ${o("sm")};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }

                & .grp__start {
                    display: flex; gap: ${o("sm")}; align-items: stretch;
                    & .grp__time { ${X()} flex: 1; min-width: 0; padding: ${o("sm")} ${o("md")}; font-size: 1rem; font-family: inherit; }
                    & .grp__hole { flex: 1; min-width: 0; font-size: 1rem; }
                }
            }

            & .setup__create {
                ${w()}
                width: 100%; padding: ${o("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit;
                background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                box-shadow: ${a("shadow-elevated")};
                &:hover { background: ${a("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            & .setup__cancel {
                ${w()}
                width: 100%; margin-top: ${o("md")}; padding: ${o("md")};
                background: none; font-family: inherit; font-weight: 600; font-size: 0.95rem;
                color: ${a("text-muted")};
                &.hidden { display: none; }
            }

            & .setup__blocked {
                padding: ${o("lg")}; ${C()}
                background: ${a("surface-sunken")}; color: ${a("text-muted")};
                font-size: 0.95rem; margin-bottom: ${o("xl")};
                &.hidden { display: none; }
            }

            & .setup__locknote {
                margin: ${o("sm")} 0 0; font-size: 0.8rem; color: ${a("text-muted")};
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
                padding: ${o("sm")} ${o("md")} calc(${o("xl")} + env(safe-area-inset-bottom));
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
            }
            & .hcp__head { display: flex; align-items: center; gap: ${o("md")}; padding: ${o("sm")} ${o("xs")} ${o("md")}; }
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
            & .hcp__bs { ${w()} width: 44px; height: 44px; flex-shrink: 0; font-size: 1.1rem; }
            & .hcp__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
            & .hcp-key {
                ${w()}
                height: 52px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: ${a("font-display")}; font-weight: 700; font-size: 1.2rem;

                & .hcp-key__lbl { font-size: 0.62rem; font-weight: 600; color: ${a("text-muted")}; &:empty { display: none; } }
                &.on {
                    background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")};
                    & .hcp-key__lbl { color: ${a("primary-text")}; }
                }
            }
            & .hcp__actions { display: flex; gap: ${o("sm")}; margin-top: ${o("md")}; }
            & .hcp__cancel { ${w()} flex: 1; padding: ${o("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem; }
            & .hcp__ok {
                ${w()}
                flex: 2; padding: ${o("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem;
                background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")};
                &:hover { background: ${a("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;svc=this.inject(Uu);router=this.inject(M);auth=this.inject(j);profile=this.inject(Je);friends=this.inject($t);pickerOpen=new p(!1);hcpPadFor=new p(null);hcpDraft=new p("");render(){const e=this.router.query("token").get(),t=!!e;this.pickerOpen.set(!1),this.hcpPadFor.set(null),t?this.svc.loadForEdit(e):(this.svc.reset(),this.svc.load()),this.auth.currentUser.get()&&(this.profile.load(),this.friends.load());const n=()=>t&&this.svc.editBlockedReason.get()!==null,i=()=>t&&this.svc.hasScores.get(),r=()=>this.profile.player.get(),l=()=>{const h=r();return this.auth.currentUser.get()!==null&&h!==null&&!this.svc.hasPlayer(h.id)},d=this.wire(Wu,{root:{className:()=>n()?"setup setup--blocked":"setup"},back:{textContent:()=>t?"← Back to round":"← Home",onclick:()=>t&&e?this.router.navigate("/round",{query:{token:e}}):this.router.navigate("/")},title:{textContent:()=>t?"Edit round":"New round"},subtitle:{textContent:()=>t?"Change the setup — scored balls are preserved.":"No sign-in required."},blocked:{className:()=>n()?"setup__blocked":"setup__blocked hidden",textContent:()=>this.svc.editBlockedReason.get()==="round_complete"?"This round is complete — its setup can no longer be edited.":this.svc.editBlockedReason.get()==="no_stored_draft"?"This round didn't come from the setup wizard, so it can't be edited here.":this.svc.editBlockedReason.get()==="has_open_seats"?"This round has open seats waiting to be claimed — the wizard cannot edit it yet.":""},roundName:{value:()=>this.svc.roundName.get(),oninput:h=>this.svc.roundName.set(h.target.value)},lockNote:{className:()=>i()?"setup__locknote":"setup__locknote hidden"},routeErr:{textContent:()=>this.svc.humanizedRoute().join(`
`)},rosterErr:{textContent:()=>this.svc.humanizedRoster().join(`
`)},cancel:{className:()=>t?"setup__cancel":"setup__cancel hidden",onclick:()=>e&&this.router.navigate("/round",{query:{token:e}})},addPlayer:{onclick:()=>this.svc.addPlayer()},addMe:{className:()=>l()?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>`+ Add me (${r()?.displayName??""})`,onclick:()=>{const h=r();h&&this.svc.addMe({id:h.id,displayName:h.displayName,handicapIndex:h.handicapIndex,gender:h.gender})}},addFriends:{className:()=>this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>this.pickerOpen.get()?"− From friends":"+ From friends",onclick:()=>this.pickerOpen.set(!this.pickerOpen.get())},friendPicker:{className:()=>this.pickerOpen.get()&&this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__friends":"setup__friends hidden"},teamsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},formatsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},addTeam:{onclick:()=>this.svc.addTeam()},splitGroups:{className:()=>this.svc.groupsEnabled()?"setup__add hidden":"setup__add",onclick:()=>this.svc.splitIntoGroups()},addGroup:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.addGroup()},clearGroups:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.clearGroups()},groupNote:{textContent:()=>{const h=this.svc.ungroupedPlayers();return h.length===0?"":`${h.map(g=>g.name.trim()||"A player").join(", ")} ${h.length>1?"aren't":"isn't"} in a group yet — every player needs one.`}},groupWarn:{textContent:()=>[...this.svc.crossGroupTeamWarnings(),...this.svc.diagnosticsForGroups().map(h=>h.message)].join(`
`)},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const h=this.svc.playersInNoFormat();return h.length===0?"":`Heads up: ${h.map(g=>g.name.trim()||"A player").join(", ")} ${h.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.humanizedGeneral(),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?t?"Saving…":"Creating…":t?"Save changes":"Create round",onclick:async()=>{const h=await this.svc.submit();h.ok&&this.router.navigate("/round",{query:{token:h.token}})}},hcpPad:{className:()=>this.hcpPadFor.get()!==null?"hcp":"hcp hidden"},hcpBackdrop:{onclick:()=>this.hcpPadFor.set(null)},hcpName:{textContent:()=>this.hcpPlayer()?.name?.trim()||"Player"},hcpCh:{textContent:()=>{const h=this.hcpPlayer();if(!h)return"";const b=this.svc.derivedCH({...h,handicapIndex:this.hcpDraft.get()});return b?`Course handicap ${b.ch} · ${b.teeName}`:"WHS index — “+” means a plus handicap."}},hcpVal:{className:()=>this.hcpDraft.get()?"hcp__val":"hcp__val empty",textContent:()=>this.hcpDraft.get()||"HCP index"},hcpBack:{onclick:()=>this.hcpDraft.set(this.hcpDraft.get().slice(0,-1))},hcpCancel:{onclick:()=>this.hcpPadFor.set(null)},hcpOk:{disabled:()=>this.hcpDraft.get()!==""&&ie(this.hcpDraft.get())===null,onclick:()=>this.hcpCommit()}}),c=this.ref(d,"hcpKeys");for(const h of["1","2","3","4","5","6","7","8","9"])c.appendChild(this.hcpKey(h,"",()=>this.hcpAppendDigit(h)));c.appendChild(this.wireEl(yn,{key:{className:()=>this.hcpDraft.get().startsWith("+")?"hcp-key on":"hcp-key",onclick:()=>this.hcpTogglePlus()},num:{textContent:"+"},lbl:{textContent:"plus hcp"}})),c.appendChild(this.hcpKey("0","",()=>this.hcpAppendDigit("0"))),c.appendChild(this.hcpKey(Ut(),"",()=>this.hcpAppendSep()));const u=h=>{if(this.hcpPadFor.get()!==null){if(h.key>="0"&&h.key<="9")this.hcpAppendDigit(h.key);else if(h.key===","||h.key===".")this.hcpAppendSep();else if(h.key==="+"||h.key==="-")this.hcpTogglePlus();else if(h.key==="Backspace")this.hcpDraft.set(this.hcpDraft.get().slice(0,-1));else if(h.key==="Enter")this.hcpCommit();else if(h.key==="Escape")this.hcpPadFor.set(null);else return;h.preventDefault()}};document.addEventListener("keydown",u),this.track(()=>document.removeEventListener("keydown",u));const f=this.ref(d,"hcpPad");document.body.appendChild(f),this.track(()=>f.remove()),this.$each(this.ref(d,"presets"),()=>Ku,(h,b,g)=>this.wireEl(_('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(h),className:()=>this.svc.preset.get()===h?"on":"",disabled:()=>i(),onclick:()=>{i()||this.svc.setPreset(h)}}},g),h=>h);const m=h=>this.track(h);return this.mountSelect(this.ref(d,"course"),m,{value:this.bound(m,()=>this.svc.courseId.get(),h=>{h&&h!==this.svc.courseId.get()&&this.svc.selectCourse(h)}),options:{get:()=>{const h=[];let b="";for(const g of this.svc.courses.get())g.clubName!==b&&(h.push({value:`__club:${g.clubName}`,label:g.clubName,disabled:!0}),b=g.clubName),h.push({value:g.id,label:g.name});return h}},placeholder:"Select a course",disabled:{get:()=>i()}}),this.mountSelect(this.ref(d,"startHole"),m,{value:this.bound(m,()=>String(this.svc.startHole.get()),h=>this.svc.startHole.set(Number(h))),options:{get:()=>this.svc.startHoleOptions().map(h=>({value:String(h),label:String(h)}))},disabled:{get:()=>i()}}),this.$each(this.ref(d,"friendRows"),()=>ds(this.friends.friends.get().filter(h=>!this.svc.hasPlayer(h.id)),"frecency"),(h,b,g)=>this.wireEl(th,{row:{onclick:()=>this.svc.addFriend({id:h.id,displayName:h.displayName,handicapIndex:h.handicapIndex,gender:h.gender})},name:()=>h.displayName,username:()=>`@${h.username}`,hcp:()=>h.handicapIndex===null?"–":h.handicapIndex.toFixed(1)},g),h=>h.id),this.$each(this.ref(d,"players"),this.svc.players,(h,b,g)=>this.playerRow(h.key,g),h=>h.key),this.$each(this.ref(d,"cards"),()=>[...this.svc.presetGames().map(h=>h.id),"__custom"],(h,b,g)=>h==="__custom"?this.wireEl(wn,{card:{className:()=>"gcard gcard--custom",onclick:()=>this.svc.addCustomGame()},name:{textContent:"+ Custom game"},tag:{textContent:"Anything the cards don't cover — teams and formats by hand."},shape:{textContent:""}},g):this.gameCard(h,g),h=>h),this.$each(this.ref(d,"games"),this.svc.picked,(h,b,g)=>this.gamePanel(h.key,g),h=>h.key),this.$each(this.ref(d,"teams"),()=>this.svc.customTeams(),(h,b,g)=>this.teamCard(h.key,g),h=>h.key),this.$each(this.ref(d,"groups"),this.svc.groups,(h,b,g)=>this.groupCard(h.key,g),h=>h.key),this.$each(this.ref(d,"formats"),()=>this.svc.customSlots(),(h,b,g)=>this.formatCard(h.key,g),h=>h.key),d}mountSelect(e,t,n){const i=new te(n);i.mount(e),t(()=>i.destroy())}bound(e,t,n){const i=new p(t());return e(I(()=>i.set(t()))),e(I(()=>{const r=i.get();queueMicrotask(()=>n(r))})),i}eachInto(e,t,n,i,r){const l=new Map,d=new Map;t(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),t(I(()=>{const c=n(),u=new Map;for(const[m,h]of c.entries()){const b=r(h,m);if(l.has(b))u.set(b,l.get(b));else{const g=[];u.set(b,i(h,m,x=>g.push(x))),d.set(b,g)}}for(const[m,h]of l)u.has(m)||(h.remove(),d.get(m)?.forEach(b=>b()),d.delete(m));let f=e.firstChild;for(const m of u.values())m===f?f=f.nextSibling:e.insertBefore(m,f);l.clear();for(const[m,h]of u)l.set(m,h)}))}gameCard(e,t){const n=()=>this.svc.gameFits(e);return this.wireEl(wn,{card:{className:()=>this.svc.isGamePicked(e)?"gcard on":"gcard",disabled:()=>!n(),onclick:()=>this.svc.toggleGame(e)},name:{textContent:()=>this.svc.gameLabel(e)},tag:{textContent:()=>n()?this.svc.catalog.taglineOf(e):this.svc.gameNeedsText(e)},shape:{textContent:()=>n()?this.svc.gameShapeText(e):""}},t)}gamePanel(e,t){const n=()=>this.svc.pickedByKey(e),i=()=>this.svc.slotForGame(e),r=()=>n()?.formatId??"",l=()=>(n()?.ballCount??0)>0,d=this.wireEl(sh,{title:{textContent:()=>this.svc.gameLabel(r())},remove:{onclick:()=>this.svc.unpickGame(e)},desc:{textContent:()=>this.svc.catalog.byId(r())?.description??""},allowance:{value:i()?.allowancePct??"100",oninput:c=>{const u=i();u&&this.svc.setSlotAllowance(u.key,c.target.value)}},ballGroup:{hidden:()=>!l()},addBall:{className:()=>this.svc.canAddBall(e)?"gaddball":"gaddball hidden",onclick:()=>this.svc.addBall(e)},err:{textContent:()=>{const c=i();return[...this.svc.gameWarnings(e),...c?this.svc.humanizedForFormat(this.svc.slotIndex(c.key)):[]].join(" · ")}},sides:{textContent:()=>this.svc.gameSidesText(e)},fork:{className:()=>this.svc.gameSharesSides(e)?"gadjust":"gadjust hidden",onclick:()=>this.svc.forkGame(e)},summary:{textContent:()=>this.svc.gameSummary(e)},adjust:{onclick:()=>this.svc.adjustGame(e)}},t);return this.eachInto(this.ref(d,"configFields"),t,()=>this.svc.catalog.byId(r())?.configFields??[],(c,u,f)=>{const m=i();if(m)return this.configField(m.key,c,f);const h=document.createElement("div");return h.className="fslot__configs",h},c=>`${r()}:${c.key}`),this.eachInto(this.ref(d,"ballRows"),t,()=>l()?this.svc.players.get():[],(c,u,f)=>this.ballRow(e,c.key,f),c=>c.key),d}ballRow(e,t,n){const i=this.wireEl(nh,{name:{textContent:()=>this.svc.players.get().find(r=>r.key===t)?.name?.trim()||"Player"}},n);return this.eachInto(this.ref(i,"seg"),n,()=>[...this.svc.gameBalls(e),null],(r,l,d)=>this.wireEl(_('<button bind="b" type="button"></button>'),{b:{textContent:()=>r===null?"–":this.svc.teamLetter(r),className:()=>this.svc.ballOf(e,t)===r?"on":"",onclick:()=>this.svc.assignBall(e,t,r)}},d),r=>String(r)),i}formatCard(e,t){const n=()=>this.svc.slotByKey(e),i=()=>n()?.formatId??"",r=this.wireEl(Qu,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(i())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:d=>this.svc.setSlotAllowance(e,d.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(i())?"applied to each side member’s ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.humanizedForFormat(this.svc.slotIndex(e)).join(" · ")}},t);this.mountSelect(this.ref(r,"format"),t,{value:this.bound(t,()=>i(),d=>{d&&d!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,d)}),options:{get:()=>this.svc.catalog.descriptors.get().map(d=>({value:d.id,label:this.svc.catalog.labelOf(d)??d.label}))}}),this.eachInto(this.ref(r,"configFields"),t,()=>this.svc.catalog.byId(i())?.configFields??[],(d,c,u)=>this.configField(e,d,u),d=>`${i()}:${d.key}`);const l=()=>{const d=this.svc.isSideFormat(i()),c=[];d||c.push(...this.svc.players.get().map(u=>({kind:"player",subKey:u.key})));for(const u of this.svc.customTeams())this.svc.teamKindFitsFormat(i(),u.kind)&&c.push({kind:"team",subKey:u.key});return c};return this.eachInto(this.ref(r,"subjectRows"),t,l,(d,c,u)=>this.subjectRow(e,d.kind,d.subKey,u),d=>`${d.kind}${d.subKey}`),r}configField(e,t,n){const i=this.wireEl(Xu,{label:{textContent:()=>this.svc.catalog.configLabelOf(t)}},n);return this.eachInto(this.ref(i,"options"),n,()=>t.options,(r,l,d)=>this.wireEl(Ju,{opt:{textContent:()=>this.svc.catalog.configLabelOf(r),className:()=>this.svc.slotConfigValue(e,t)===r.value?"on":"",onclick:()=>this.svc.setSlotConfig(e,t.key,r.value)}},d),r=>r.value),i}subjectRow(e,t,n,i){const r=()=>{if(t==="player")return this.svc.players.get().find(u=>u.key===n)?.name?.trim()||"Player";const c=this.svc.teamByKey(n);return c?`${this.svc.teamLabel(c)} (${c.kind==="multi_ball"?"side":"team"})`:"Team"},l=()=>t==="player"?this.svc.subjectPlayerIn(e,n):this.svc.subjectTeamIn(e,n),d=c=>t==="player"?this.svc.setSubjectPlayer(e,n,c):this.svc.setSubjectTeam(e,n,c);return this.wireEl(vn,{chk:{checked:()=>l(),onchange:c=>d(c.target.checked)},name:{textContent:()=>r()}},i)}groupCard(e,t){const n=this.wireEl(eh,{remove:{onclick:()=>this.svc.removeGroup(e)},groupName:{textContent:()=>{const i=this.svc.groupByKey(e);return i?this.svc.groupLabel(i):"Group"}},time:{value:this.svc.groupByKey(e)?.startTime??"",oninput:i=>this.svc.setGroupStartTime(e,i.target.value)},meta:{textContent:()=>{const i=this.svc.groupSize(e);return i===0?"Tick the players who walk with this group.":`${i} player${i===1?"":"s"}`}}},t);return this.mountSelect(this.ref(n,"hole"),t,{value:this.bound(t,()=>{const i=this.svc.groupByKey(e)?.startHole;return i==null?"":String(i)},i=>this.svc.setGroupStartHole(e,i===""?null:Number(i))),options:{get:()=>[{value:"",label:"First hole"},...this.svc.startHoleOptions().map(i=>({value:String(i),label:`Hole ${i}`}))]}}),this.eachInto(this.ref(n,"memberRows"),t,()=>this.svc.players.get(),(i,r,l)=>this.groupMemberRow(e,i.key,l),i=>i.key),n}groupMemberRow(e,t,n){return this.wireEl(vn,{chk:{checked:()=>this.svc.groupMemberIn(e,t),onchange:i=>this.svc.setGroupMember(e,t,i.target.checked)},name:{textContent:()=>this.svc.players.get().find(i=>i.key===t)?.name?.trim()||"Player"}},n)}teamCard(e,t){const n=()=>this.svc.teamKindOf(e)==="multi_ball",i=this.wireEl(Zu,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const r=this.svc.teamByKey(e);return r?this.svc.teamLabel(r):"Team"}},compGroup:{hidden:()=>n()},membersLabel:{textContent:()=>n()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const r=this.svc.teamSize(e);if(r===0)return n()?"Tick at least 2 members — a side needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(r<2)return"Add one more member — a team needs at least 2.";if(n())return`${r} balls · a side (scored together by a side format)`;const l=this.svc.teamBallCh(e);return l===null?`${r} players`:`${r} players · plays off HCP ${l}`}}},t);return this.mountSelect(this.ref(i,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),r=>this.svc.setTeamKind(e,r==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"One combined ball"},{value:"multi_ball",label:"Separate balls (a side)"}]}}),this.mountSelect(this.ref(i,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",r=>this.svc.setTeamFormation(e,r)),options:{get:()=>this.svc.formations.map(r=>({value:r,label:r[0].toUpperCase()+r.slice(1)}))}}),this.eachInto(this.ref(i,"memberRows"),t,()=>{const r=this.svc.players.get().map(l=>({kind:"player",mKey:l.key}));if(n())for(const l of this.svc.eligibleNestedTeams(e))r.push({kind:"team",mKey:l.key});return r},(r,l,d)=>r.kind==="player"?this.teamMemberRow(e,r.mKey,d):this.teamNestedRow(e,r.mKey,d),r=>`${r.kind}${r.mKey}`),i}teamNestedRow(e,t,n){const i=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(xn,{chk:{checked:()=>i(),disabled:()=>!i()&&this.svc.teamAtMaxSize(e),onchange:r=>this.svc.setTeamMemberTeam(e,t,r.target.checked)},name:{textContent:()=>{const r=this.svc.teamByKey(t);return r?`${this.svc.teamLabel(r)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},n)}teamMemberRow(e,t,n){const i=()=>this.svc.players.get().find(l=>l.key===t)??null,r=()=>this.svc.teamMemberIn(e,t);return this.wireEl(xn,{chk:{checked:()=>r(),disabled:()=>!r()&&this.svc.teamAtMaxSize(e),onchange:l=>this.svc.setTeamMember(e,t,l.target.checked)},name:{textContent:()=>i()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!r()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:l=>this.svc.setTeamPct(e,t,l.target.value)}},n)}hcpPlayer(){const e=this.hcpPadFor.get();return e===null?null:this.svc.players.get().find(t=>t.key===e)??null}openHcpPad(e){this.hcpDraft.set(this.svc.players.get().find(t=>t.key===e)?.handicapIndex??""),this.hcpPadFor.set(e)}hcpAppendDigit(e){const t=this.hcpDraft.get(),[n,i]=t.replace("+","").split(/[.,]/);if(i!==void 0){if(i.length>=1)return}else if(n.length>=2)return;this.hcpDraft.set(t+e)}hcpAppendSep(){const e=this.hcpDraft.get();/[.,]/.test(e)||this.hcpDraft.set(e.replace("+","")===""?`${e}0${Ut()}`:e+Ut())}hcpTogglePlus(){const e=this.hcpDraft.get();this.hcpDraft.set(e.startsWith("+")?e.slice(1):`+${e.replace("-","")}`)}hcpCommit(){const e=this.hcpPadFor.get();e!==null&&(this.hcpDraft.get()!==""&&ie(this.hcpDraft.get())===null||(this.svc.patchPlayer(e,{handicapIndex:this.hcpDraft.get()}),this.hcpPadFor.set(null)))}hcpKey(e,t,n){return this.wireEl(yn,{key:{onclick:n},num:{textContent:e},lbl:{textContent:t}})}playerRow(e,t){const n=()=>this.svc.players.get().find(l=>l.key===e)??null,i=()=>this.svc.players.get().findIndex(l=>l.key===e),r=this.wireEl(Yu,{name:{value:n()?.name??"",readOnly:()=>!!n()?.playerId,oninput:l=>this.svc.patchPlayer(e,{name:l.target.value})},index:{value:()=>n()?.handicapIndex??"",onclick:()=>this.openHcpPad(e),onfocus:l=>{l.target.blur(),this.openHcpPad(e)}},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const l=n();if(!l)return"";const d=this.svc.derivedCH(l);if(!d)return"";const c=d.rating;return`Course handicap ${d.ch}  ·  ${l.handicapIndex} × ${c.slope}/113 + (${c.courseRating} − ${c.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(i()).map(l=>l.message).join(" · ")}},t);return this.mountSelect(this.ref(r,"gender"),t,{value:this.bound(t,()=>n()?.gender??"M",l=>this.svc.patchPlayer(e,{gender:l})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]},disabled:{get:()=>n()?.genderKnown===!0}}),this.mountSelect(this.ref(r,"tee"),t,{value:this.bound(t,()=>n()?.teeId??"",l=>this.svc.patchPlayer(e,{teeId:l})),options:{get:()=>this.svc.tees.get().map(l=>({value:l.id,label:l.name}))},placeholder:"Tee"}),r}}function ji(s,e){return y({method:"POST",url:`${F}/auth/login`,body:{username:s,password:e}})}function rh(){return y({method:"GET",url:`${F}/auth/me`})}function oh(){return y({method:"POST",url:`${F}/auth/logout`,body:{}})}function ah(){return y({method:"POST",url:`${F}/auth/logout-all`,body:{}})}const Kt="Something went wrong on our end. Try again in a moment.";function lh(s,e){const t=(s.details??[]).map(i=>i.path),n=i=>t.some(r=>r===`/${i}`);return n("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":n("username")?"Enter your username.":n("displayName")?"Enter a display name.":n("handicapIndex")?"Handicap index must be a number (or leave it empty).":n("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function $n(s,e){if(s instanceof K)switch(s.status){case 400:return lh(s,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":Kt;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return s.status>=500?Kt:"That request could not be completed."}return s instanceof Error&&s.message==="Request timeout"?"That took too long. Check your connection and try again.":s instanceof Error?"Cannot reach the server. Check your connection and try again.":Kt}const dh=_(`
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
`);class ch extends E{static styles=`
        .login {
            max-width: 340px;
            margin: 0 auto;
            padding: 14vh ${o("xl")} 0;

            &[inert] { opacity: 0.6; }

            & .login__hero {
                text-align: center;
                margin-bottom: ${o("2xl")};

                & .login__flag { font-size: 2.2rem; }

                & h1 {
                    margin: ${o("sm")} 0 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2.4rem;
                    letter-spacing: -0.02em;
                    color: ${a("text")};
                }

                & p {
                    margin: ${o("xs")} 0 0;
                    color: ${a("text-muted")};
                    font-size: 0.9rem;
                }
            }

            & .error {
                display: none;
                padding: ${o("sm")} ${o("md")};
                margin-bottom: ${o("md")};
                color: ${a("error")};
                font-size: 0.875rem;
                text-align: center;
            }
            & .error.show { display: block; }

            & .login__form {
                display: flex;
                flex-direction: column;
                gap: ${o("md")};

                & input {
                    ${X()}
                    padding: ${o("md")} ${o("lg")};
                    font-size: 1rem;
                }

                & .login__register {
                    display: flex;
                    flex-direction: column;
                    gap: ${o("md")};
                    &.hidden { display: none; }
                }

                & .login__genderrow,
                & .login__clubrow {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: ${o("md")};
                    font-size: 0.85rem;
                    color: ${a("text-muted")};
                }

                /* Club names are long ("Linköpings Golfklubb") and naming the
                   club IS the point of the field, so it gets its own line
                   rather than sharing one with the label and ellipsing. */
                & .login__clubrow {
                    flex-direction: column;
                    align-items: stretch;
                    gap: ${o("xs")};
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
                    gap: ${o("xs")};

                    & button {
                        ${w()}
                        padding: ${o("sm")} ${o("lg")};
                        font-size: 0.9rem;
                        font-weight: 700;
                        &.on { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                    }
                }

                /* Direct child only: the submit button. The gender segment and
                   the home-club select bring their own button styling, and a
                   descendant selector here would paint both solid primary. */
                & > button {
                    ${w()}
                    padding: ${o("md")} ${o("lg")};
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
                margin: ${o("xl")} auto 0;
                padding: ${o("sm")} ${o("lg")};
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
    `;auth=this.inject(j);router=this.inject(M);nextQ=this.router.query("next");mode=new p("login");busy=new p(!1);formError=new p("");username="";password="";displayName="";hcp="";gender=new p(null);clubs=new p([]);homeClubId=new p("");clubsRequested=!1;async loadClubs(){if(!this.clubsRequested){this.clubsRequested=!0;try{this.clubs.set(await v.setup.clubs())}catch{}}}destination(e){const t=this.nextQ.get();return t&&t.startsWith("/")?t:e}async submit(){if(this.formError.set(""),this.mode.get()==="login"){if(!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const n=await ji(this.username.trim(),this.password);this.auth.currentUser.set(n),this.auth.error.set(null),this.router.navigate(this.destination("/"),!0)}catch(n){this.formError.set($n(n,"login"))}finally{this.busy.set(!1)}return}const e=this.hcp.trim(),t=e===""?null:ie(e);if(e!==""&&t===null){this.formError.set("Handicap index must be a number (or leave it empty).");return}if(this.password.length<8){this.formError.set("Password must be at least 8 characters.");return}if(!this.username.trim()||!this.displayName.trim()){this.formError.set("Username and display name are required.");return}this.busy.set(!0);try{const n=await v.players.register({username:this.username.trim(),password:this.password,displayName:this.displayName.trim(),handicapIndex:t,gender:this.gender.get(),homeClubId:this.homeClubId.get()||null});this.auth.currentUser.set({id:n.id,username:n.username}),this.router.navigate(this.destination("/"),!0)}catch(n){this.formError.set($n(n,"register"))}finally{this.busy.set(!1)}}render(){const e=()=>this.mode.get()==="register",t=()=>this.auth.loading.get()||this.busy.get(),n=this.wire(dh,{root:{inert:()=>t()},error:{className:()=>this.formError.get()?"error show":"error",textContent:()=>this.formError.get()},form:{onsubmit:async l=>{l.preventDefault(),await this.submit()}},username:{oninput:l=>{this.username=l.target.value}},password:{autocomplete:()=>e()?"new-password":"current-password",oninput:l=>{this.password=l.target.value}},registerFields:{className:()=>e()?"login__register":"login__register hidden"},displayName:{oninput:l=>{this.displayName=l.target.value}},hcp:{oninput:l=>{this.hcp=l.target.value}},submit:{textContent:()=>t()?e()?"Creating account…":"Signing in…":e()?"Create account":"Sign in"},toggle:{textContent:()=>e()?"Have an account? Sign in":"New here? Create an account",onclick:()=>{this.formError.set(""),this.auth.error.set(null);const l=!e();this.mode.set(l?"register":"login"),l&&this.loadClubs()}}}),i=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(n,"gender"),()=>i,(l,d,c)=>this.wireEl(_('<button bind="b" type="button"></button>'),{b:{textContent:()=>l.label,className:()=>this.gender.get()===l.value?"on":"",onclick:()=>this.gender.set(l.value)}},c),l=>l.label);const r=new te({value:this.homeClubId,options:{get:()=>[{value:"",label:"No home club"},...this.clubs.get().map(l=>({value:l.id,label:l.name}))]},placeholder:"No home club"});return r.mount(this.ref(n,"club")),this.track(()=>r.destroy()),n}}const uh=_(`
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
`),hh=_(`
    <div class="friend-row">
        ${Ce("friend-row__badge")}
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="username" class="friend-row__username"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="add" class="friend-row__add" type="button">Add</button>
        <span bind="added" class="friend-row__added">✓ Friend</span>
    </div>
`),ph=_(`
    <div class="friend-row">
        <button bind="open" type="button" class="friend-row__main">
            ${Ce("friend-row__badge")}
            <span class="friend-row__who">
                <span bind="name" class="friend-row__name"></span>
                <span bind="subtitle" class="friend-row__subtitle"></span>
            </span>
        </button>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="remove" class="friend-row__remove" type="button" aria-label="Remove friend">✕</button>
    </div>
`);class fh extends E{static styles=`
        .friends {
            padding: ${o("xl")} ${o("lg")} ${o("2xl")};

            & .friends__anon {
                text-align: center;
                padding: ${o("2xl")} 0;
                color: ${a("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${w()}
                    margin-top: ${o("md")};
                    padding: ${o("md")} ${o("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }

            & .friends__body.hidden { display: none; }

            & .friends__head {
                margin-bottom: ${o("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
            }

            & .friends__section {
                margin-bottom: ${o("xl")};
                & h2 {
                    margin: 0 0 ${o("sm")};
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .friends__sechead {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${o("md")};
                & h2 { margin: 0; }
            }

            & .friends__sort {
                display: inline-flex; flex-shrink: 0;
                border: 1px solid ${a("border")}; border-radius: ${a("radius-pill")};
                overflow: hidden;
                &.hidden { display: none; }

                & .friends__sortbtn {
                    ${w()}
                    font-family: inherit; font-size: 0.78rem; font-weight: 700;
                    padding: ${o("xs")} ${o("md")};
                    background: transparent; color: ${a("text-muted")};
                    border: none; border-radius: 0;

                    &[aria-pressed='true'] {
                        background: ${a("primary")}; color: ${a("primary-text")};
                    }
                }
            }

            & .friends__search {
                ${X()}
                width: 100%;
                padding: ${o("md")} ${o("lg")};
                font-size: 1rem;
            }

            & .friends__hint {
                margin: ${o("sm")} 0 0; font-size: 0.82rem; color: ${a("text-muted")};
                &:empty { display: none; }
            }
            & .friends__err {
                margin: ${o("sm")} 0 0; font-size: 0.85rem; color: ${a("error")};
                &:empty { display: none; }
            }

            & .friends__empty {
                color: ${a("text-muted")}; font-size: 0.9rem; padding: ${o("md")} 0;
                &.hidden { display: none; }
            }

            & .friends__list {
                display: flex; flex-direction: column; gap: ${o("sm")};
                margin-top: ${o("md")};
                &:empty { display: none; }
            }

            & .friend-row {
                display: flex; align-items: center; gap: ${o("md")};
                padding: ${o("md")} ${o("lg")};
                ${C()}

                /* Pointer affordance for the tappable (mutual) rows — the
                   disabled one-way rows keep the flat card. */
                &:has(.friend-row__main:not(:disabled):hover) {
                    background: ${a("hover-bg")};
                }

                & .friend-row__main {
                    flex: 1; min-width: 0;
                    display: flex; align-items: center; gap: ${o("md")};
                    padding: 0; margin: 0;
                    background: none; border: none;
                    font-family: inherit; font-size: inherit; color: inherit;
                    text-align: left; cursor: pointer;
                    &:disabled { cursor: default; }
                }
                & .friend-row__badge {
                    ${Ze(40)}
                    background: ${a("primary")}; color: ${a("primary-text")};
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
                    ${w()}
                    flex-shrink: 0; padding: ${o("sm")} ${o("lg")};
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
                    ${w()}
                    width: 34px; height: 34px; flex-shrink: 0;
                    font-size: 0.9rem; color: ${a("text-muted")};
                }
            }
        }
    `;svc=this.inject($t);auth=this.inject(j);router=this.inject(M);render(){const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.load();const t=this.wire(uh,{anon:{className:()=>e()?"friends__anon hidden":"friends__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},body:{className:()=>e()?"friends__body":"friends__body hidden"},search:{value:()=>this.svc.query.get(),oninput:i=>this.svc.setQuery(i.target.value)},searchHint:{textContent:()=>{const i=this.svc.query.get().trim();return i.length>0&&!zs(i)?"Type at least 2 characters.":this.svc.searching.get()?"Searching…":""}},searchErr:{textContent:()=>this.svc.searchError.get()?.message??""},resultsEmpty:{className:()=>{const i=this.svc.query.get().trim();return zs(i)&&!this.svc.searching.get()&&this.svc.searchError.get()===null&&this.svc.resultsFor.get()===i&&this.svc.results.get().length===0?"friends__empty":"friends__empty hidden"}},friendsEmpty:{className:()=>this.svc.loaded.get()&&this.svc.friends.get().length===0?"friends__empty":"friends__empty hidden"},sortToggle:{className:()=>this.svc.friends.get().length>0?"friends__sort":"friends__sort hidden"},sortFrecency:{"aria-pressed":()=>String(this.svc.sortMode.get()==="frecency"),onclick:()=>this.svc.setSortMode("frecency")},sortAlpha:{"aria-pressed":()=>String(this.svc.sortMode.get()==="alpha"),onclick:()=>this.svc.setSortMode("alpha")}});this.$each(this.ref(t,"results"),this.svc.results,(i,r,l)=>this.wireEl(hh,{...Te(()=>this.svc.results.get().find(d=>d.id===i.id)??i),name:()=>i.displayName,username:()=>i.homeClubName?`@${i.username} · ${i.homeClubName}`:`@${i.username}`,hcp:()=>i.handicapIndex===null?"–":i.handicapIndex.toFixed(1),add:{className:()=>this.isFriendNow(i.id)?"friend-row__add hidden":"friend-row__add",disabled:()=>this.svc.mutating.get(),onclick:()=>{const d=this.svc.results.get().find(c=>c.id===i.id);d&&!d.isFriend&&this.svc.add(d)}},added:{className:()=>this.isFriendNow(i.id)?"friend-row__added":"friend-row__added hidden"}},l),i=>i.id);const n=new Date().toISOString();return this.$each(this.ref(t,"friends"),()=>ds(this.svc.friends.get(),this.svc.sortMode.get()),(i,r,l)=>this.wireEl(ph,{...Te(()=>this.svc.friends.get().find(d=>d.id===i.id)??i),open:{disabled:()=>!this.liveFriend(i).isMutual,onclick:()=>{const d=this.liveFriend(i);d.isMutual&&this.router.navigate("/friend",{query:{id:i.id,name:d.displayName}})}},name:()=>i.displayName,subtitle:()=>{const d=this.svc.friends.get().find(c=>c.id===i.id)??i;return Fo(d,n)},hcp:()=>i.handicapIndex===null?"–":i.handicapIndex.toFixed(1),remove:{disabled:()=>this.svc.mutating.get(),onclick:()=>{this.svc.remove(i.id)}}},l),i=>i.id),t}liveFriend(e){return this.svc.friends.get().find(t=>t.id===e.id)??e}isFriendNow(e){return this.svc.results.get().find(t=>t.id===e)?.isFriend===!0}}const Di=_(`
    <button bind="row" type="button" class="fr-row">
        <span class="fr-row__text">
            <span bind="title" class="fr-row__title"></span>
            <span bind="subtitle" class="fr-row__subtitle"></span>
        </span>
        <span bind="progress" class="fr-row__progress"></span>
    </button>
`);function Bi(s,e){return{row:{onclick:()=>e(s.roundId)},title:()=>Jo(s),subtitle:()=>Zo(s,_e),progress:()=>ea(s)}}function Gi(){return`
        & .fr-row {
            display: flex; align-items: center; gap: ${o("md")};
            width: 100%;
            padding: ${o("md")} ${o("lg")};
            background: none; border: none; border-bottom: 1px solid ${a("border")};
            font-family: inherit; text-align: left; cursor: pointer;

            &:hover { background: ${a("hover-bg")}; }

            & .fr-row__text {
                flex: 1; min-width: 0;
                display: flex; flex-direction: column; gap: 1px;
            }
            & .fr-row__title {
                font-weight: 600; font-size: 1rem; color: ${a("text")};
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .fr-row__subtitle {
                color: ${a("text-muted")}; font-size: 0.8rem;
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            & .fr-row__progress {
                flex-shrink: 0; font-size: 0.85rem; font-weight: 700;
                color: ${a("accent")};
            }
        }
    `}const mh=_(`
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
                ${Ce("fprofile__avatar")}
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
`);class gh extends E{static styles=`
        .fprofile {
            padding: ${o("xl")} ${o("lg")} ${o("2xl")};

            & .fprofile__back {
                ${w()}
                margin-bottom: ${o("lg")};
                padding: ${o("xs")} ${o("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .fprofile__anon {
                text-align: center;
                padding: ${o("2xl")} 0;
                color: ${a("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${w()}
                    margin-top: ${o("md")};
                    padding: ${o("md")} ${o("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }

            & .fprofile__pending.hidden, & .fprofile__refusal.hidden { display: none; }
            & .fprofile__pendingname {
                margin: 0 0 ${o("sm")};
                font-family: ${a("font-display")};
                font-weight: 600; font-size: 1.7rem; letter-spacing: -0.02em;
            }
            & .fprofile__refusaltitle { margin: 0; font-weight: 700; }
            & .fprofile__state {
                margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
            }
            & .fprofile__retry {
                ${w()}
                margin-top: ${o("md")};
                padding: ${o("sm")} ${o("lg")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .fprofile__body.hidden { display: none; }

            /* The header is the screen's one moment of ceremony: a soft accent
               band behind a large centered avatar — the portrait straddles the
               band the way a clubhouse portrait hangs over the wainscot. */
            & .fprofile__card {
                ${C()}
                overflow: hidden;
                text-align: center;
                margin-bottom: ${o("xl")};

                & .fprofile__band {
                    height: 72px;
                    background: ${a("accent-soft")};
                }
                & .fprofile__avatar {
                    ${Ze(96,"2rem")}
                    margin: -48px auto 0;
                    background: ${a("primary")}; color: ${a("primary-text")};
                    border: 3px solid ${a("surface")};
                }
                & .fprofile__who {
                    padding: ${o("sm")} ${o("lg")} 0;
                    & h1 {
                        margin: ${o("xs")} 0 0;
                        font-family: ${a("font-display")};
                        font-weight: 600; font-size: 1.5rem; letter-spacing: -0.02em;
                    }
                }
                & .fprofile__username {
                    margin: 1px 0 0; color: ${a("text-muted")}; font-size: 0.8rem;
                }
                & .fprofile__identity {
                    margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem;
                    &:empty { display: none; }
                }
                & .fprofile__live {
                    ${w()}
                    margin-top: ${o("xs")};
                    padding: 2px ${o("sm")};
                    background: none; border: none;
                    font-family: inherit; font-size: 0.85rem; font-weight: 700;
                    color: ${a("accent")};
                    &.hidden { display: none; }
                }
                & .fprofile__stats {
                    display: flex;
                    padding: ${o("lg")} 0;
                }
                & .fprofile__stat {
                    flex: 1;
                    display: flex; flex-direction: column; gap: 1px;
                }
                /* The aggregates — the one place the full counts belong. They
                   include rounds the lists below will not show, by design. */
                & .fprofile__statnum {
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.5rem;
                    color: ${a("primary")};
                }
                & .fprofile__statlabel { font-size: 0.75rem; color: ${a("text-muted")}; }
            }

            & .fprofile__section {
                margin-bottom: ${o("xl")};
                & h2 {
                    margin: 0 0 ${o("sm")};
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }
            /* The aggregates above may say plenty — the list can still be
               empty, because only rounds shared with friends appear here. */
            & .fprofile__hint {
                margin: 0; color: ${a("text-muted")}; font-size: 0.85rem;
                &.hidden { display: none; }
            }

            & .fprofile__listcard {
                ${C()}
                overflow: hidden;
                &.hidden { display: none; }
            }
            ${Gi()}
            & .fprofile__more {
                display: flex; align-items: center; gap: ${o("md")};
                width: 100%; min-height: 44px;
                padding: ${o("md")} ${o("lg")};
                background: none; border: none;
                font-family: inherit; font-size: 0.9rem; font-weight: 600;
                color: ${a("text")}; text-align: left; cursor: pointer;
                &:hover { background: ${a("hover-bg")}; }
                & > span:first-child { flex: 1; min-width: 0; }
            }
            & .fprofile__morecol {
                display: flex; flex-direction: column; gap: 1px;
            }
            & .fprofile__moresub {
                font-weight: 400; font-size: 0.8rem; color: ${a("text-muted")};
            }
            & .fprofile__chev {
                flex-shrink: 0;
                width: 0.45em; height: 0.45em;
                border-right: 2px solid ${a("accent")};
                border-bottom: 2px solid ${a("accent")};
                transform: rotate(-45deg);
            }
        }
    `;svc=this.inject(kt);activity=this.inject(cs);auth=this.inject(j);router=this.inject(M);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(I(()=>{const h=e.get();U(()=>{!h||!n()||(this.svc.setPlayer(h),this.svc.loadProfile(),this.activity.load())})}));const i=()=>this.svc.profile.get(),r=()=>(t.get()??"").trim()||"Friend",l=new $(()=>{const h=e.get();return h?Yo(this.activity.feed.get(),h):null}),d=()=>this.svc.unavailable.get(),c=()=>n()&&d()===null&&i()!==null,u=()=>n()&&d()===null&&i()===null,f=h=>this.router.navigate("/spectate",{query:{id:h,name:i()?.player.displayName??r()}}),m=this.wire(mh,{back:{onclick:()=>this.router.navigate("/friends")},anon:{className:()=>n()?"fprofile__anon hidden":"fprofile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},pending:{className:()=>u()?"fprofile__pending":"fprofile__pending hidden"},pendingName:{textContent:()=>r()},state:{textContent:()=>this.svc.profileLoading.get()?"Loading…":this.svc.profileError.get()??""},retry:{className:()=>this.svc.profileError.get()!==null&&!this.svc.profileLoading.get()?"fprofile__retry":"fprofile__retry hidden",onclick:()=>{this.svc.loadProfile(!0)}},refusal:{className:()=>n()&&d()!==null?"fprofile__refusal":"fprofile__refusal hidden"},refusalName:{textContent:()=>r()},refusalTitle:{textContent:()=>{const h=d();return h?Se[h].title:""}},refusalMsg:{textContent:()=>{const h=d();return h?Se[h].message:""}},body:{className:()=>c()?"fprofile__body":"fprofile__body hidden"},...Te(()=>{const h=i();return h?h.player:{id:e.get()??"",avatarVersion:null,displayName:r(),username:null}}),name:{textContent:()=>i()?.player.displayName??""},username:{textContent:()=>{const h=i()?.player.username;return h?`@${h}`:""}},identity:{textContent:()=>{const h=i();return h?ta(h.player.handicapIndex,h.player.homeClubName)??"":""}},live:{className:()=>l.get()?"fprofile__live":"fprofile__live hidden",textContent:()=>{const h=l.get();return h?Qo(h):""},onclick:()=>{const h=l.get();h&&f(h.roundId)}},statRounds:()=>String(i()?.roundsTotal??""),statYear:()=>String(i()?.roundsThisYear??""),statCourses:()=>String(i()?.coursesTotal??""),recentEmpty:{className:()=>(i()?.recentRounds.length??0)===0?"fprofile__hint":"fprofile__hint hidden"},recentCard:{className:()=>(i()?.recentRounds.length??0)>0?"fprofile__listcard":"fprofile__listcard hidden"},seeAll:{onclick:()=>this.router.navigate("/friend-rounds",{query:{id:e.get()??"",name:i()?.player.displayName??r()}})},coursesLine:{textContent:()=>na(i()?.coursesTotal??0)},coursesRow:{onclick:()=>this.router.navigate("/friend-courses",{query:{id:e.get()??"",name:i()?.player.displayName??r()}})}});return this.$each(this.ref(m,"recentList"),()=>i()?.recentRounds??[],(h,b,g)=>this.wireEl(Di,Bi(h,f),g),h=>h.roundId),m}}const bh=_(`
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
`);class _h extends E{static styles=`
        .frounds {
            padding: ${o("xl")} ${o("lg")} ${o("2xl")};

            & .frounds__back {
                ${w()}
                margin-bottom: ${o("lg")};
                padding: ${o("xs")} ${o("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .frounds__head {
                margin-bottom: ${o("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.7rem; letter-spacing: -0.02em;
                }
                & p { margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
            }

            & .frounds__anon {
                text-align: center;
                padding: ${o("2xl")} 0;
                color: ${a("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${w()}
                    margin-top: ${o("md")};
                    padding: ${o("md")} ${o("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }
            & .frounds__refusal.hidden { display: none; }
            & .frounds__refusaltitle { margin: 0; font-weight: 700; }
            & .frounds__state {
                margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
                &.hidden { display: none; }
            }
            & .frounds__retry {
                ${w()}
                margin-top: ${o("md")};
                padding: ${o("sm")} ${o("lg")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .frounds__listcard {
                ${C()}
                overflow: hidden;
                &.hidden { display: none; }
                & .fr-row:last-child { border-bottom: none; }
            }
            ${Gi()}

            & .frounds__more {
                ${w()}
                display: block;
                margin: ${o("md")} auto 0;
                padding: ${o("sm")} ${o("xl")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
                &:disabled { opacity: 0.6; cursor: default; }
            }
        }
    `;svc=this.inject(kt);auth=this.inject(j);router=this.inject(M);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(I(()=>{const f=e.get();U(()=>{!f||!n()||(this.svc.setPlayer(f),this.svc.loadRounds())})}));const i=()=>this.svc.rounds.get(),r=()=>this.svc.unavailable.get(),l=()=>(t.get()??"").trim(),d=f=>this.router.navigate("/spectate",{query:{id:f,name:l()}}),c=()=>this.router.navigate("/friend",{query:{id:e.get()??"",name:l()}}),u=this.wire(bh,{back:{onclick:c},subtitle:{textContent:()=>{const f=l();return f?`Rounds ${f} has shared with friends.`:"Rounds shared with friends."}},refusal:{className:()=>r()!==null?"frounds__refusal":"frounds__refusal hidden"},refusalTitle:{textContent:()=>{const f=r();return f?Se[f].title:""}},refusalMsg:{textContent:()=>{const f=r();return f?Se[f].message:""}},anon:{className:()=>n()?"frounds__anon hidden":"frounds__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:`/friend-rounds?id=${e.get()??""}&name=${encodeURIComponent(t.get()??"")}`}})},state:{textContent:()=>r()!==null||!n()?"":this.svc.roundsLoading.get()?"Loading…":i().rounds.length===0?this.svc.roundsError.get()??"":""},retry:{className:()=>r()===null&&this.svc.roundsError.get()!==null&&i().rounds.length===0&&!this.svc.roundsLoading.get()?"frounds__retry":"frounds__retry hidden",onclick:()=>{this.svc.loadRounds(!0)}},empty:{className:()=>r()===null&&this.svc.roundsLoaded.get()&&i().rounds.length===0&&this.svc.roundsError.get()===null?"frounds__state":"frounds__state hidden"},listCard:{className:()=>r()===null&&i().rounds.length>0?"frounds__listcard":"frounds__listcard hidden"},more:{className:()=>r()===null&&si(i())&&i().rounds.length>0?"frounds__more":"frounds__more hidden",disabled:()=>this.svc.loadingMore.get(),textContent:()=>this.svc.loadingMore.get()?"Loading…":"Show more rounds",onclick:()=>{this.svc.loadMoreRounds()}},moreError:{textContent:()=>i().rounds.length>0?this.svc.roundsError.get()??"":""}});return this.$each(this.ref(u,"list"),()=>r()===null?i().rounds:[],(f,m,h)=>this.wireEl(Di,Bi(f,d),h),f=>f.roundId),u}}const yh=_(`
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
`),vh=_(`
    <div class="fcourse-row">
        <span bind="name" class="fcourse-row__name"></span>
        <span bind="facts" class="fcourse-row__facts"></span>
    </div>
`);class wh extends E{static styles=`
        .fcourses {
            padding: ${o("xl")} ${o("lg")} ${o("2xl")};

            & .fcourses__back {
                ${w()}
                margin-bottom: ${o("lg")};
                padding: ${o("xs")} ${o("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .fcourses__head {
                margin-bottom: ${o("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.7rem; letter-spacing: -0.02em;
                }
                & p { margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
            }

            & .fcourses__anon {
                text-align: center;
                padding: ${o("2xl")} 0;
                color: ${a("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${w()}
                    margin-top: ${o("md")};
                    padding: ${o("md")} ${o("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }
            & .fcourses__refusal.hidden { display: none; }
            & .fcourses__refusaltitle { margin: 0; font-weight: 700; }
            & .fcourses__state {
                margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
                &.hidden { display: none; }
            }
            & .fcourses__retry {
                ${w()}
                margin-top: ${o("md")};
                padding: ${o("sm")} ${o("lg")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .fcourses__listcard {
                ${C()}
                overflow: hidden;
                margin-bottom: ${o("sm")};
                &.hidden { display: none; }
            }
            & .fcourse-row {
                display: flex; flex-direction: column; gap: 1px;
                padding: ${o("md")} ${o("lg")};
                border-bottom: 1px solid ${a("border")};
                &:last-child { border-bottom: none; }

                & .fcourse-row__name { font-weight: 600; font-size: 1rem; }
                & .fcourse-row__facts { color: ${a("text-muted")}; font-size: 0.8rem; }
            }
        }
    `;svc=this.inject(kt);auth=this.inject(j);router=this.inject(M);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(I(()=>{const c=e.get();U(()=>{!c||!n()||(this.svc.setPlayer(c),this.svc.loadCourses())})}));const i=()=>this.svc.unavailable.get(),r=()=>i()===null?this.svc.courses.get():[],l=()=>(t.get()??"").trim(),d=this.wire(yh,{back:{onclick:()=>this.router.navigate("/friend",{query:{id:e.get()??"",name:l()}})},subtitle:{textContent:()=>{const c=l();return c?`Where ${c} has played the rounds they share.`:"Where the rounds they share were played."}},refusal:{className:()=>i()!==null?"fcourses__refusal":"fcourses__refusal hidden"},refusalTitle:{textContent:()=>{const c=i();return c?Se[c].title:""}},refusalMsg:{textContent:()=>{const c=i();return c?Se[c].message:""}},anon:{className:()=>n()?"fcourses__anon hidden":"fcourses__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:`/friend-courses?id=${e.get()??""}&name=${encodeURIComponent(l())}`}})},state:{textContent:()=>i()!==null||!n()?"":this.svc.coursesLoading.get()?"Loading…":this.svc.coursesError.get()??""},retry:{className:()=>i()===null&&this.svc.coursesError.get()!==null&&!this.svc.coursesLoading.get()?"fcourses__retry":"fcourses__retry hidden",onclick:()=>{this.svc.loadCourses(!0)}},empty:{className:()=>i()===null&&this.svc.coursesLoaded.get()&&r().length===0&&this.svc.coursesError.get()===null?"fcourses__state":"fcourses__state hidden"},listCard:{className:()=>r().length>0?"fcourses__listcard":"fcourses__listcard hidden"},truncated:{className:()=>i()===null&&this.svc.coursesHasMore.get()&&r().length>0?"fcourses__state":"fcourses__state hidden"}});return this.$each(this.ref(d,"list"),r,(c,u,f)=>this.wireEl(vh,{name:()=>c.courseName??"Course",facts:()=>sa(c,_e)},f),c=>c.courseId),d}}function xh(s,e,t){const n=Qe(e);if(n){const d=Sn(s);return d?`Watching · ${d} ${n}`:`Watching · ${n}`}const i=Sn(s)??"this",r=Qe(t),l=r?` at ${r}`:"";return`Watching · ${i} round${l}`}function $h(s,e,t,n){const i=Qe(s)===null?null:Qe(e),r=n!==null?`${n} holes`:null;return[i,r,t==="complete"?"Finished":t==="not_started"?"Not started":null].filter(c=>c!==null).join(" · ")||null}const kh="You're watching this round. Only its players can enter scores.",kn={forbidden:{title:"Round not available",message:"This round is no longer shared with you."},not_found:{title:"Round not found",message:"This round doesn't exist anymore."}};function Sn(s){const e=Qe(s);return e?e.toLowerCase().endsWith("s")?`${e}'`:`${e}'s`:null}function Qe(s){return(s??"").trim()||null}const Sh=_(`
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

            <p class="spectate__note">${kh}</p>
        </div>
    </div>
`);class Th extends E{static styles=`
        .spectate {
            padding: ${o("xl")} ${o("lg")} ${o("2xl")};

            & .spectate__back {
                ${w()}
                margin-bottom: ${o("lg")};
                padding: ${o("xs")} ${o("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .spectate__anon {
                text-align: center;
                padding: ${o("2xl")} 0;
                color: ${a("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${w()}
                    margin-top: ${o("md")};
                    padding: ${o("md")} ${o("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }
            & .spectate__refusal.hidden { display: none; }
            & .spectate__refusaltitle { margin: 0; font-weight: 700; }
            & .spectate__state {
                margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
            }
            & .spectate__retry {
                ${w()}
                margin-top: ${o("md")};
                padding: ${o("sm")} ${o("lg")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
            }

            & .spectate__body.hidden { display: none; }

            & .spectate__head { margin-bottom: ${o("sm")}; }
            & .spectate__titlerow {
                display: flex; align-items: baseline; gap: ${o("md")};
                justify-content: space-between;
                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.35rem; letter-spacing: -0.02em;
                    min-width: 0;
                }
            }
            & .spectate__status {
                font-size: 0.7rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.08em;
                border-radius: ${a("radius-pill")};
                padding: 2px 10px; flex-shrink: 0;
                &.s-active { background: ${a("accent-soft")}; color: ${a("accent")}; }
                &.s-complete, &.s-not_started {
                    background: ${a("surface-sunken")}; color: ${a("text-muted")};
                }
                &:empty { display: none; }
            }
            & .spectate__subtitle {
                margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
            }
            & .spectate__date {
                margin: 2px 0 0; color: ${a("text-muted")}; font-size: 0.85rem;
                &:empty { display: none; }
            }

            & .spectate__slot-head {
                margin: ${o("xl")} 0 ${o("sm")};
                font-family: ${a("font-display")};
                font-weight: 600; font-size: 1.1rem;
            }

            & .spectate__note {
                margin: ${o("xl")} 0 0;
                color: ${a("text-muted")}; font-size: 0.85rem;
                text-align: center;
            }
        }
        ${gi.styles}
    `;svc=this.inject(ri);auth=this.inject(j);router=this.inject(M);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(I(()=>{const c=e.get();U(()=>{!c||!n()||(this.svc.setRound(c),this.svc.load())})}));const i=()=>this.svc.view.get(),r=()=>this.svc.unavailable.get(),l=()=>(t.get()??"").trim()||null;return this.wire(Sh,{back:{onclick:()=>{window.history.length>1?window.history.back():this.router.navigate("/")}},anon:{className:()=>n()?"spectate__anon hidden":"spectate__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:`/spectate?id=${e.get()??""}&name=${encodeURIComponent(l()??"")}`}})},refusal:{className:()=>n()&&r()!==null?"spectate__refusal":"spectate__refusal hidden"},refusalTitle:{textContent:()=>{const c=r();return c?kn[c].title:""}},refusalMsg:{textContent:()=>{const c=r();return c?kn[c].message:""}},state:{textContent:()=>r()!==null||!n()?"":this.svc.loading.get()&&i()===null?"Loading…":i()===null?this.svc.error.get()??"":""},retry:{className:()=>n()&&r()===null&&this.svc.error.get()!==null&&i()===null&&!this.svc.loading.get()?"spectate__retry":"spectate__retry hidden",onclick:()=>{this.svc.load(!0)}},body:{className:()=>n()&&r()===null&&i()!==null?"spectate__body":"spectate__body hidden"},title:{textContent:()=>{const c=i();return c?xh(l(),c.round.name,c.round.courseNameSnapshot):""}},status:{textContent:()=>{const c=i();return c&&c.status==="active"?"Live":""},className:()=>`spectate__status s-${i()?.status??""}`},subtitle:{textContent:()=>{const c=i();return c?$h(c.round.name,c.round.courseNameSnapshot,c.status,c.round.playHoles.length||null)??"":""}},date:{textContent:()=>_e(i()?.round.date??null)},board:{innerHTML:()=>this.renderBoards()}})}renderBoards(){const e=this.svc.view.get();if(!e)return"";const t=r=>this.svc.nameOf(r),n=r=>this.svc.groupLabelOf(r),i=e.result.slots;return i.length===0?'<div class="lb-empty">No formats in this round.</div>':i.map(r=>{const l=i.length>1?`<h2 class="spectate__slot-head">${Ih(r.formatLabel)}</h2>`:"",d=fi(r,t,n),c=mi(r.cards,e.result.routeSections,t),u=c?`<h3 class="lb-cards__head">Scorecard</h3>${c}`:"";return l+d+u}).join("")}}function Ih(s){return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}const Ph=_(`
    <div class="profile">
        <div bind="anon" class="profile__anon">
            <p>Your profile lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>
        <div bind="body" class="profile__body">
            <header class="profile__head">
                <div class="profile__ident">
                    ${Ce("profile__badge")}
                    <div class="profile__names">
                        <h1 bind="name"></h1>
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
`),Ch=_(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`),Eh=_(`
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
`);class Nh extends E{static styles=`
        .profile {
            padding: ${o("xl")} ${o("lg")} ${o("2xl")};

            & .profile__anon {
                text-align: center;
                padding: ${o("2xl")} 0;
                color: ${a("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${w()}
                    margin-top: ${o("md")};
                    padding: ${o("md")} ${o("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }

            & .profile__body.hidden { display: none; }

            & .profile__head {
                margin-bottom: ${o("xl")};

                & .profile__ident { display: flex; align-items: center; gap: ${o("lg")}; }
                & .profile__names { min-width: 0; }

                & .profile__badge {
                    ${Ze(72,"1.5rem")}
                    background: ${a("accent-soft")};
                    color: ${a("accent")};
                }

                & .profile__photo-actions {
                    display: flex; align-items: center; gap: ${o("sm")};
                    margin-top: ${o("md")};

                    /* Off-screen rather than hidden: display:none makes the
                       element unfocusable, and Safari will not open a file
                       picker for a scripted click on one. */
                    & .profile__file {
                        position: absolute;
                        width: 1px; height: 1px;
                        opacity: 0; pointer-events: none;
                    }

                    & button {
                        ${w()}
                        padding: ${o("sm")} ${o("md")};
                        font-family: inherit; font-size: 0.85rem; font-weight: 700;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                    /* Destructive, so it does not get the same weight as
                       Change — a mis-tap here costs the photo. */
                    & .profile__photo-remove {
                        background: none;
                        color: ${a("error")};
                        border-color: ${a("border")};
                        &.hidden { display: none; }
                    }
                }

                & .profile__err {
                    margin: ${o("sm")} 0 0; font-size: 0.85rem; color: ${a("error")};
                    &:empty { display: none; }
                }

                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
            }

            & .profile__card {
                padding: ${o("lg")};
                margin-bottom: ${o("xl")};
                ${C()}

                & .profile__label {
                    font-weight: 700; font-size: 0.8rem;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    color: ${a("text-muted")};
                }
                & .profile__hcp-row {
                    display: flex; align-items: center; gap: ${o("md")};
                    margin-top: ${o("sm")};
                }
                & .profile__hcp {
                    font-family: ${a("font-display")};
                    font-weight: 700; font-size: 2rem;
                    font-variant-numeric: tabular-nums;
                    color: ${a("text")};
                }
                & .profile__edit {
                    display: flex; gap: ${o("sm")}; flex: 1; justify-content: flex-end;
                    & input { ${X()} width: 90px; padding: ${o("md")}; font-size: 1rem; text-align: center; }
                    & button {
                        ${w()}
                        padding: ${o("md")} ${o("lg")}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700;
                        background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
                & .profile__hint { margin: ${o("sm")} 0 0; font-size: 0.8rem; color: ${a("text-muted")}; }
                & .profile__err {
                    margin: ${o("sm")} 0 0; font-size: 0.85rem; color: ${a("error")};
                    &:empty { display: none; }
                }

                & .profile__club {
                    margin-top: ${o("sm")};
                    & .ui-select { display: block; width: 100%; }
                }

                & .profile__gender-row { margin-top: ${o("sm")}; }
                & .profile__genderseg {
                    display: flex;
                    gap: ${o("xs")};

                    & button {
                        ${w()}
                        flex: 1;
                        padding: ${o("sm")} 0;
                        font-family: inherit;
                        font-size: 0.9rem;
                        font-weight: 700;
                        &.on { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
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
                gap: ${o("md")};
                padding-left: ${o("md")};
            }

            & .statrow {
                display: flex;
                align-items: flex-start;
                gap: ${o("md")};
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
                    border-radius: ${a("radius-pill")};
                    background: ${a("border")};
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
                        background: ${a("primary")};
                        &::after { transform: translateX(20px); }
                    }
                }
                /* Takes the slack so the switch sits hard against the trailing
                   edge, as the label/control split does on iOS. */
                & .statrow__text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                & .statrow__head {
                    display: flex; align-items: baseline; gap: ${o("sm")};
                    flex-wrap: wrap;
                }
                & .statrow__title { font-size: 1rem; font-weight: 600; color: ${a("text")}; }
                /* The unmet dependency, in words — "Needs Putting". The row is
                   locked either way; this is the half that says which switch to
                   move to get it back. */
                & .statrow__ann {
                    font-size: 0.8rem; color: ${a("text-muted")};
                    &:empty { display: none; }
                }
                & .statrow__hint { font-size: 0.8rem; color: ${a("text-muted")}; }
            }

            & .statrow__rule {
                height: 1px;
                margin: ${o("md")} 0;
                background: ${a("border")};
                &.hidden { display: none; }
            }

            /* The dashboard link. A row, not a button-looking control: it goes
               somewhere, and the chevron is the only affordance it needs. */
            & .statlink {
                ${w()}
                display: flex;
                align-items: center;
                gap: ${o("md")};
                width: 100%;
                padding: 0;
                font-family: inherit;
                text-align: left;
                background: transparent;
                border: none;
                border-radius: 0;

                &.hidden { display: none; }

                & .statlink__text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                & .statlink__title { font-size: 1rem; font-weight: 600; color: ${a("text")}; }
                & .statlink__hint { font-size: 0.8rem; color: ${a("text-muted")}; }
                & .statlink__chev {
                    flex-shrink: 0;
                    width: 0; height: 0;
                    border-top: 5px solid transparent;
                    border-bottom: 5px solid transparent;
                    border-left: 6px solid ${a("text-muted")};
                }
            }

            & .profile__section {
                & h2 {
                    margin: 0 0 ${o("sm")};
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .profile__empty {
                color: ${a("text-muted")}; font-size: 0.9rem; padding: ${o("md")} 0;
                &.hidden { display: none; }
            }

            & .profile__history { display: flex; flex-direction: column; gap: ${o("sm")}; }

            & .hcp-entry {
                display: flex; align-items: baseline; gap: ${o("md")};
                padding: ${o("md")} ${o("lg")};
                ${C()}

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
        }
    `;svc=this.inject(Je);auth=this.inject(j);router=this.inject(M);indexDraft=new p("");localErr=new p("");render(){this.auth.currentUser.get()&&this.svc.load();const e=()=>this.auth.currentUser.get()!==null;let t=null;const n=this.wire(Ph,{anon:{className:()=>e()?"profile__anon hidden":"profile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/profile"}})},body:{className:()=>e()?"profile__body":"profile__body hidden"},...Te(()=>{const d=this.svc.player.get();return{id:d?.id??"",avatarVersion:d?.avatarVersion??null,displayName:d?.displayName,username:d?.username}}),photoFile:{onchange:d=>{const c=d.target,u=c.files?.[0];c.value="",u&&this.svc.saveAvatar(u)}},photoPick:{textContent:()=>this.svc.avatarSaving.get()?"Saving…":this.svc.player.get()?.avatarVersion?"Change photo":"Add photo",disabled:()=>this.svc.avatarSaving.get(),onclick:()=>t?.click()},photoRemove:{textContent:()=>"Remove",className:()=>this.svc.player.get()?.avatarVersion?"profile__photo-remove":"profile__photo-remove hidden",disabled:()=>this.svc.avatarSaving.get(),onclick:()=>{this.svc.removeAvatar()}},photoErr:{textContent:()=>this.svc.avatarError.get()?.message??""},name:()=>this.svc.player.get()?.displayName??"…",username:()=>{const d=this.svc.player.get();return d?`@${d.username}`:""},hcp:()=>{const d=this.svc.player.get()?.handicapIndex;return d==null?"–":d<0?`+${(-d).toFixed(1)}`:d.toFixed(1)},index:{value:()=>this.indexDraft.get(),oninput:d=>this.indexDraft.set(d.target.value)},save:{disabled:()=>this.svc.saving.get()||this.indexDraft.get().trim()==="",textContent:()=>this.svc.saving.get()?"Saving…":"Save"},form:{onsubmit:async d=>{d.preventDefault(),this.localErr.set("");const c=ie(this.indexDraft.get());if(c===null||c<-10||c>54){this.localErr.set("Enter an index between +10 and 54 (use “+” for a plus handicap).");return}await this.svc.saveIndex(c)&&this.indexDraft.set("")}},saveErr:{textContent:()=>this.localErr.get()||this.svc.saveError.get()?.message||""},genderErr:{textContent:()=>this.svc.saveError.get()?.message||""},clubErr:{textContent:()=>this.svc.saveError.get()?.message||""},toStats:{className:()=>this.svc.hasRecordedStats.get()?"statlink":"statlink hidden",onclick:()=>this.router.navigate("/stats")},statlinkRule:{className:()=>this.svc.hasRecordedStats.get()?"statrow__rule":"statrow__rule hidden"},masterTitle:()=>wo,masterHint:()=>xo,master:{checked:()=>this.svc.statsConfig.get().enabled,disabled:()=>this.statsBusy(),onchange:d=>{this.saveStats(d,(c,u)=>To(c,u),c=>c.enabled)}},statsErr:{textContent:()=>this.svc.statsError.get()?.message||""},historyEmpty:{className:()=>this.svc.history.get().length===0?"profile__empty":"profile__empty hidden"}});this.$each(this.ref(n,"history"),this.svc.history,(d,c,u)=>this.wireEl(Ch,{index:()=>d.handicapIndex.toFixed(1),source:()=>d.source,date:()=>d.effectiveDate},u),d=>d.id),this.$each(this.ref(n,"statModules"),()=>[...Un],(d,c,u)=>{const f=()=>this.svc.statsConfig.get(),m=()=>$o(f(),d);return this.wireEl(Eh,{row:{className:()=>m()?"statrow statrow--locked":"statrow"},title:()=>Kn(d),ann:()=>ko(f(),d)??"",hint:()=>vo(d),chk:{checked:()=>ft(f(),d),disabled:()=>m()||this.statsBusy(),onchange:h=>{this.saveStats(h,(b,g)=>So(b,d,g),b=>ft(b,d))}}},u)},d=>d);const i=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(n,"gender"),()=>i,(d,c,u)=>this.wireEl(_('<button bind="b" type="button"></button>'),{b:{textContent:()=>d.label,className:()=>this.svc.player.get()?.gender===d.value?"on":"",disabled:()=>this.svc.saving.get(),onclick:()=>{this.svc.saveGender(d.value)}}},u),d=>d.label);const r=new p(this.svc.player.get()?.homeClubId??"");this.track(I(()=>r.set(this.svc.player.get()?.homeClubId??""))),this.track(I(()=>{const d=r.get();queueMicrotask(()=>{d!==(this.svc.player.get()?.homeClubId??"")&&this.svc.saveHomeClub(d===""?null:d)})}));const l=new te({value:r,options:{get:()=>[{value:"",label:"No home club"},...this.svc.clubs.get().map(d=>({value:d.id,label:d.name}))]},placeholder:"No home club",disabled:{get:()=>this.svc.saving.get()}});return l.mount(this.ref(n,"club")),this.track(()=>l.destroy()),t=this.ref(n,"photoFile"),n}statsBusy(){return this.svc.statsSaving.get()||this.svc.saving.get()}async saveStats(e,t,n){const i=e.target;await this.svc.saveStatsConfig(t(this.svc.statsConfig.get(),i.checked)),i.checked=n(this.svc.statsConfig.get())}}const Rh=_(`
    <section bind="panel" class="panel">
        <button bind="head" class="panel__head" type="button" aria-expanded="false">
            <span class="panel__text">
                <span bind="title" class="panel__title"></span>
                <span bind="headline" class="panel__headline"></span>
            </span>
            <span bind="chev" class="panel__chev" aria-hidden="true"></span>
        </button>
        <div bind="body" class="panel__body"></div>
    </section>
`),Oh=_('<h3 bind="text" class="block__subhead"></h3>'),zh=_('<p bind="text" class="block__note"></p>'),Lh=_(`
    <div class="block block--split">
        <span bind="bar" class="block__splitbar"></span>
        <span bind="legend" class="block__legend"></span>
    </div>
`),Hh=_(`
    <div class="block block--bar">
        <span bind="title" class="block__title"></span>
        <span bind="bar" class="block__bar"></span>
        <span bind="value" class="block__value"></span>
    </div>
`),Ah=_(`
    <div class="block block--bar">
        <span bind="title" class="block__title"></span>
        <span bind="bar" class="block__bar"></span>
        <span bind="value" class="block__value"></span>
    </div>
`),Mh=_(`
    <div class="block block--figure">
        <div class="block__text">
            <span bind="title" class="block__title"></span>
            <span bind="hint" class="block__hint"></span>
        </div>
        <span bind="value" class="block__value"></span>
    </div>
`),Fh=_('<div bind="panels" class="statspanels"></div>');class qi extends E{static styles=`
        .statspanels {
            display: flex; flex-direction: column; gap: ${o("sm")};

            & .panel {
                ${C()}
                overflow: hidden;
                &.hidden { display: none; }

                & .panel__head {
                    ${w()}
                    display: flex; align-items: center; gap: ${o("md")};
                    width: 100%;
                    padding: ${o("md")} ${o("lg")};
                    font-family: inherit; text-align: left;
                    background: transparent; border: none; border-radius: 0;
                }
                & .panel__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .panel__title { font-weight: 600; font-size: 1rem; }
                & .panel__headline {
                    color: ${a("text-muted")}; font-size: 0.82rem;
                    &:empty { display: none; }
                }
                & .panel__chev {
                    flex-shrink: 0; width: 0; height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-top: 6px solid ${a("text-muted")};
                    transition: transform 0.15s ease;
                }
                & .panel__head[aria-expanded='false'] .panel__chev { transform: rotate(-90deg); }

                & .panel__body {
                    display: flex; flex-direction: column; gap: ${o("sm")};
                    padding: 0 ${o("lg")} ${o("lg")};
                    &.hidden { display: none; }
                }
            }

            & .block__subhead {
                margin: ${o("sm")} 0 0;
                font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${a("text-muted")};
            }
            & .block__note { margin: 0; font-size: 0.78rem; color: ${a("text-muted")}; }
            & .block { display: flex; align-items: center; gap: ${o("md")}; }
            & .block--split { flex-direction: column; align-items: stretch; gap: ${o("xs")}; }
            & .block__splitbar { display: block; & svg { width: 100%; display: block; } }
            & .block__legend {
                display: flex; flex-wrap: wrap; gap: ${o("md")};
                font-size: 0.8rem;
                & .legend__key {
                    display: inline-flex; align-items: center; gap: 6px;
                }
                & .legend__swatch {
                    width: 10px; height: 10px; flex-shrink: 0;
                    border-radius: 2px;
                }
                & .legend__value {
                    color: ${a("text-muted")};
                    font-variant-numeric: tabular-nums;
                }
            }
            & .block__title { flex: 1; min-width: 0; font-size: 0.9rem; }
            & .block__bar { width: 90px; flex-shrink: 0; & svg { width: 100%; display: block; } }
            & .block__value {
                flex-shrink: 0; text-align: right;
                font-size: 0.9rem; font-weight: 700;
                font-variant-numeric: tabular-nums;
                &.block__value--absent { font-weight: 400; color: ${a("text-muted")}; }
            }
            & .block--figure {
                align-items: flex-start;
                & .block__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .block__hint {
                    font-size: 0.76rem; color: ${a("text-muted")};
                    &:empty { display: none; }
                }
            }
        }
    `;expanded=new p([]);colors=Pt;render(){const e=this.wire(Fh,{}),t=()=>this.props.model();return this.$each(this.ref(e,"panels"),()=>[...cc],(n,i,r)=>{const l=()=>this.expanded.get().includes(n),d=this.wireEl(Rh,{panel:{className:()=>t()[n]?"panel":"panel hidden"},head:{"aria-expanded":()=>String(l()),onclick:()=>this.togglePanel(n)},title:()=>uc(n),headline:()=>nu(n,t())??"",body:{className:()=>l()?"panel__body":"panel__body hidden"}},r);return this.$each(this.ref(d,"body"),()=>un(n,t()),(c,u,f)=>this.renderBlock(n,c,f),c=>c.id),d},n=>n),e}renderBlock(e,t,n){switch(t.kind){case"subhead":return this.wireEl(Oh,{text:()=>t.text},n);case"note":return this.wireEl(zh,{text:()=>t.text},n);case"split":{const i=()=>this.blockNow(e,t.id)??t;return this.wireEl(Lh,{bar:{innerHTML:()=>{const r=i();return r.kind!=="split"?"":Oc(r.segments.map(l=>({id:l.id,share:l.share??0,color:this.segmentColor(l.tone)})),this.colors)}},legend:{innerHTML:()=>{const r=i();return r.kind!=="split"?"":r.segments.map(l=>`<span class="legend__key"><span class="legend__swatch" style="background:${this.segmentColor(l.tone)}"></span><span>${l.title}</span><span class="legend__value">${l.value??z.notRecorded}</span></span>`).join("")}}},n)}case"bar":return this.wireEl(Hh,{title:()=>t.title,bar:{innerHTML:()=>{const i=this.blockNow(e,t.id)??t;return i.kind!=="bar"||i.share===null?"":Vc(i.share,this.colors)}},value:this.valueBinding(e,t.id,()=>t.value)},n);case"rung":return this.wireEl(Ah,{title:()=>t.title,bar:{innerHTML:()=>{const i=this.blockNow(e,t.id)??t;return i.kind!=="rung"?"":Gc(i.made,i.baseline,this.colors)}},value:this.valueBinding(e,t.id,()=>t.value)},n);case"figure":return this.wireEl(Mh,{title:()=>t.title,hint:()=>{const i=this.blockNow(e,t.id)??t;return(i.kind==="figure"?i.hint:t.hint)??""},value:this.valueBinding(e,t.id,()=>t.value)},n)}}valueBinding(e,t,n){const i=()=>{const r=this.blockNow(e,t);return r&&"value"in r?r.value:n()};return{textContent:()=>i()??z.notRecorded,className:()=>i()===null?"block__value block__value--absent":"block__value"}}segmentColor(e){switch(e){case"fairway":return this.colors.gain;case"inplay":return this.colors.neutral;case"trouble":return this.colors.loss}}togglePanel(e){const t=this.expanded.get();this.expanded.set(t.includes(e)?t.filter(n=>n!==e):[...t,e])}blockNow(e,t){return un(e,this.props.model()).find(n=>n.id===t)}}const jh=_(`
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
            </section>

            <div bind="empty" class="stats__empty"></div>

            <section bind="prioritiesSec" class="stats__section">
                <h2></h2>
                <p bind="prioritiesHint" class="stats__hint"></p>
                <div bind="priorities" class="stats__priorities"></div>
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
    </div>
`),Tn=_(`
    <button bind="chip" class="stats__chip" type="button" aria-pressed="false"></button>
`),Dh=_(`
    <label class="stats__course">
        <input bind="chk" type="checkbox" />
        <span bind="name" class="stats__coursename"></span>
        <span bind="count" class="stats__coursecount"></span>
    </label>
`),Bh=_(`
    <div class="priority">
        <div class="priority__text">
            <span bind="title" class="priority__title"></span>
            <span bind="subtitle" class="priority__subtitle"></span>
        </div>
        <span bind="chart" class="priority__chart"></span>
        <div class="priority__figures">
            <span bind="value" class="priority__value"></span>
            <span bind="sample" class="priority__sample"></span>
        </div>
    </div>
`),Gh=_(`
    <div class="trend">
        <span bind="title" class="trend__title"></span>
        <span bind="spark" class="trend__spark"></span>
        <span bind="headline" class="trend__headline"></span>
        <span bind="sample" class="trend__sample"></span>
    </div>
`),qh=_(`
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
`);class Vh extends E{static styles=`
        .stats {
            padding: ${o("xl")} ${o("lg")} ${o("2xl")};

            & .stats__anon {
                text-align: center;
                padding: ${o("2xl")} 0;
                color: ${a("text-muted")};
                &.hidden { display: none; }

                & button {
                    ${w()}
                    margin-top: ${o("md")};
                    padding: ${o("md")} ${o("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }

            & .stats__body.hidden { display: none; }

            & .stats__head {
                margin-bottom: ${o("lg")};
                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
            }

            & .stats__window { margin-bottom: ${o("lg")}; }
            & .stats__picker { & .ui-select { display: block; width: 100%; } }

            & .stats__windowbar {
                display: flex; align-items: center; justify-content: space-between;
                gap: ${o("md")}; margin-top: ${o("sm")};
            }
            & .stats__sample {
                color: ${a("text-muted")}; font-size: 0.85rem;
                font-variant-numeric: tabular-nums;
            }
            & .stats__filterbtn {
                ${w()}
                flex-shrink: 0;
                padding: ${o("xs")} ${o("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
                &[aria-expanded='true'] {
                    background: ${a("primary")}; color: ${a("primary-text")};
                    border-color: ${a("primary")};
                }
            }

            & .stats__status {
                margin: ${o("sm")} 0 0; font-size: 0.82rem; color: ${a("text-muted")};
                &:empty { display: none; }
            }
            & .stats__err {
                margin: ${o("sm")} 0 0; font-size: 0.85rem; color: ${a("error")};
                &:empty { display: none; }
            }

            /* The custom window's criteria. Hidden by default: it is a
               refinement of the picker above it, not a second picker. */
            & .stats__filter {
                ${C()}
                display: flex; flex-direction: column; gap: ${o("md")};
                padding: ${o("lg")};
                margin-bottom: ${o("lg")};
                &.hidden { display: none; }
            }
            & .stats__filterrow { display: flex; flex-direction: column; gap: ${o("xs")}; }
            & .stats__filterlabel {
                font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${a("text-muted")};
            }
            & .stats__dates { display: flex; gap: ${o("md")}; }
            & .stats__date {
                flex: 1; display: flex; flex-direction: column; gap: 2px;
                font-size: 0.8rem; color: ${a("text-muted")};
                & input {
                    ${X()}
                    width: 100%;
                    font-family: inherit; font-size: 0.9rem;
                }
            }
            & .stats__chips { display: flex; flex-wrap: wrap; gap: ${o("xs")}; }
            & .stats__chip {
                ${w()}
                padding: ${o("xs")} ${o("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
                border-radius: ${a("radius-pill")};
                &[aria-pressed='true'] {
                    background: ${a("primary")}; color: ${a("primary-text")};
                    border-color: ${a("primary")};
                }
            }
            & .stats__courses {
                display: flex; flex-direction: column; gap: ${o("xs")};
                max-height: 220px; overflow-y: auto;
            }
            & .stats__course {
                display: flex; align-items: baseline; gap: ${o("sm")};
                font-size: 0.9rem; cursor: pointer;
                & .stats__coursename { flex: 1; }
                & .stats__coursecount {
                    color: ${a("text-muted")}; font-size: 0.8rem;
                    font-variant-numeric: tabular-nums;
                }
            }
            & .stats__clear {
                ${w()}
                align-self: flex-start;
                padding: ${o("xs")} ${o("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .stats__empty {
                color: ${a("text-muted")}; font-size: 0.9rem; padding: ${o("lg")} 0;
                &:empty { display: none; }
            }

            & .stats__section {
                margin-bottom: ${o("xl")};
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${o("xs")};
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }
            & .stats__hint {
                margin: 0 0 ${o("md")}; font-size: 0.82rem; color: ${a("text-muted")};
                &:empty { display: none; }
            }

            & .stats__priorities { display: flex; flex-direction: column; gap: ${o("sm")}; }

            & .priority {
                ${C()}
                display: flex; align-items: center; gap: ${o("md")};
                padding: ${o("md")} ${o("lg")};

                & .priority__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .priority__title { font-weight: 600; font-size: 0.98rem; }
                & .priority__subtitle { color: ${a("text-muted")}; font-size: 0.78rem; }
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
                    color: ${a("text-muted")}; font-size: 0.72rem; text-align: right;
                }
            }

            /* Tiles rather than rows: a sparkline needs width more than the
               label does, and four of them fit two-up on a phone. */
            & .stats__trends {
                display: grid; grid-template-columns: repeat(2, 1fr); gap: ${o("sm")};
            }
            & .trend {
                ${C()}
                display: flex; flex-direction: column; gap: 2px;
                padding: ${o("md")};
                & .trend__title { font-size: 0.82rem; color: ${a("text-muted")}; }
                & .trend__spark { display: block; & svg { width: 100%; display: block; } }
                & .trend__headline {
                    font-weight: 700; font-size: 1.05rem;
                    font-variant-numeric: tabular-nums;
                }
                & .trend__sample { font-size: 0.72rem; color: ${a("text-muted")}; }
            }

            /* The five module cards live in StatsPanelsComponent — the per-round
               screen embeds the same component, so their CSS travels with it. */
            & .stats__panels { margin-bottom: ${o("xl")}; }

            & .stats__rounds { display: flex; flex-direction: column; gap: ${o("xs")}; }
            & .statsround {
                ${C()}
                display: flex; align-items: center; gap: ${o("md")};
                padding: ${o("sm")} ${o("lg")};

                & .statsround__pick {
                    flex-shrink: 0;
                    &.hidden { display: none; }
                }
                & .statsround__open {
                    ${w()}
                    flex: 1; min-width: 0;
                    display: flex; align-items: center; gap: ${o("md")};
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
                    color: ${a("text-muted")}; font-size: 0.76rem;
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
    `;svc=this.inject(be);auth=this.inject(j);router=this.inject(M);filterOpen=new p(!1);colors=Pt;render(){const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.load();const t=()=>this.svc.model.get(),n=()=>this.svc.preset.get()==="custom",i=this.wire(jh,{anon:{className:()=>e()?"stats__anon hidden":"stats__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/stats"}})},body:{className:()=>e()?"stats__body":"stats__body hidden"},intro:()=>z.intro,sample:()=>this.sampleMarker(),filterToggle:{"aria-expanded":()=>String(this.filterOpen.get()),onclick:()=>this.filterOpen.set(!this.filterOpen.get())},status:()=>this.statusLine(),err:()=>this.svc.error.get()?.message??"",filterPanel:{className:()=>this.filterOpen.get()?"stats__filter":"stats__filter hidden"},from:{value:()=>this.svc.filter.get().from??"",oninput:r=>this.setBound("from",r.target.value)},to:{value:()=>this.svc.filter.get().to??"",oninput:r=>this.setBound("to",r.target.value)},clearFilter:{textContent:()=>z.filterClear,onclick:()=>this.svc.clearFilter()},empty:()=>this.emptyLine(),prioritiesSec:{className:()=>t().priorities.length>0?"stats__section":"stats__section hidden"},prioritiesHint:()=>z.prioritiesHint,trendsSec:{className:()=>t().trends.length>0?"stats__section":"stats__section hidden"},trendsHint:()=>z.trendsHint,roundsSec:{className:()=>t().rounds.length>0?"stats__section":"stats__section hidden"},roundsHint:()=>z.roundsHint,pickHint:()=>n()?z.filterRoundsHint:""});return this.setHeading(i,"prioritiesSec",z.priorities),this.setHeading(i,"trendsSec",z.trends),this.setHeading(i,"roundsSec",z.roundsHeading),this.mountPicker(i),this.mountFilterLists(i),this.$each(this.ref(i,"priorities"),()=>t().priorities,(r,l,d)=>this.wireEl(Bh,{title:()=>$s(r.component),subtitle:()=>eu(r.component),chart:{innerHTML:()=>{const c=this.priorityNow(r.component);return c?.perRound===null||c===void 0?"":Ni(c.perRound,vc(t().priorities),this.colors)}},value:{textContent:()=>{const c=this.priorityNow(r.component);return c&&c.perRound!==null?Zc(c.perRound):z.notEnoughData}},sample:{textContent:()=>{const c=this.priorityNow(r.component);return c?c.perRound===null?ru(c.roundsInWindow):`over ${ne(c.roundsCovered,de)}`:""}}},d),r=>r.component),this.$each(this.ref(i,"trends"),()=>t().trends,(r,l,d)=>this.wireEl(Gh,{title:()=>r.title,spark:{innerHTML:()=>{const c=this.trendNow(r.id)??r;return Mc(c.points,c.kind,this.colors)}},headline:{textContent:()=>{const c=this.trendNow(r.id)??r;return Uh(c)}},sample:{textContent:()=>{const c=this.trendNow(r.id)??r;return ne(c.points.length,de)}}},d),r=>r.id),this.spawn(qi,this.ref(i,"panels"),{model:t}),this.$each(this.ref(i,"rounds"),()=>t().rounds,(r,l,d)=>this.wireEl(qh,{open:{onclick:()=>this.router.navigate("/round-stats",{query:{id:r.id}}),"aria-label":()=>`${hn(r)} — hole by hole`},label:()=>hn(r),subtitle:()=>Kh(r),pickWrap:{className:()=>n()?"statsround__pick":"statsround__pick hidden"},pick:{checked:()=>!this.svc.filter.get().excludedRoundIds.includes(r.id),onchange:c=>this.svc.applyFilter($d(this.svc.filter.get(),r.id,c.target.checked))},strip:{innerHTML:()=>{const c=this.roundNow(r.id)??r;return Dc(c.waterfall,Ei(t().rounds.map(u=>u.waterfall)),this.colors)}},vspar:{textContent:()=>{const c=this.roundNow(r.id)??r;return c.vsPar===null?"":xs(c.vsPar)}}},d),r=>r.id),i}mountPicker(e){const t=new p(this.svc.preset.get());this.track(I(()=>t.set(this.svc.preset.get()))),this.track(I(()=>{const r=t.get();queueMicrotask(()=>{r!==this.svc.preset.get()&&this.svc.select(r)})}));const n=r=>({value:r,label:`${en(r)} — ${vd(r)}`}),i=new te({value:t,options:[{value:"__recent",label:"Recent form",disabled:!0},n("last5"),n("last10"),n("last20"),{value:"__all",label:"Everything",disabled:!0},n("thisYear"),n("all"),{value:"__custom",label:"Built by hand",disabled:!0},n("custom")],placeholder:en("last10")});i.mount(this.ref(e,"picker")),this.track(()=>i.destroy())}mountFilterLists(e){const t=["outdoor","indoor"];this.$each(this.ref(e,"venues"),()=>t,(i,r,l)=>this.wireEl(Tn,{chip:{textContent:()=>tu(i),"aria-pressed":()=>String(this.svc.filter.get().venueTypes.includes(i)),onclick:()=>this.svc.applyFilter(Bt(this.svc.filter.get(),"venueTypes",i))}},l),i=>i);const n=["full_18","front_9","back_9","custom_holes"];this.$each(this.ref(e,"roundTypes"),()=>n,(i,r,l)=>this.wireEl(Tn,{chip:{textContent:()=>su(i),"aria-pressed":()=>String(this.svc.filter.get().roundTypes.includes(i)),onclick:()=>this.svc.applyFilter(Bt(this.svc.filter.get(),"roundTypes",i))}},l),i=>i),this.$each(this.ref(e,"courses"),()=>this.svc.courses.get(),(i,r,l)=>this.wireEl(Dh,{name:()=>i.name,count:()=>ne(i.roundCount,de),chk:{checked:()=>this.svc.filter.get().courseIds.includes(i.id),onchange:()=>this.svc.applyFilter(Bt(this.svc.filter.get(),"courseIds",i.id))}},l),i=>i.id)}setBound(e,t){this.svc.applyFilter({...this.svc.filter.get(),[e]:t===""?null:t})}priorityNow(e){return this.svc.model.get().priorities.find(t=>t.component===e)}trendNow(e){return this.svc.model.get().trends.find(t=>t.id===e)}roundNow(e){return this.svc.model.get().rounds.find(t=>t.id===e)}setHeading(e,t,n){const i=this.ref(e,t).querySelector("h2");i&&(i.textContent=n)}sampleMarker(){const e=this.svc.windowRounds.get().length,t=this.svc.roundsWithStats.get()??this.svc.loadedCount();return t<=e?ne(e,de):`${ue(e,0)} of ${ne(t,de)}`}statusLine(){const e=this.svc.extendError.get();return e?`${z.extendProblemPrefix}${e.message}`:this.svc.extending.get()?z.extending:this.svc.budgetSpent()?z.budgetSpent:this.svc.loading.get()?z.loading:""}emptyLine(){return!this.svc.loaded.get()||this.svc.error.get()?"":this.svc.overFiltered.get()?z.windowEmpty:this.svc.loadedCount()===0?z.noStats:""}}function Uh(s){const e=s.points[s.points.length-1];return e===void 0?"":s.kind==="percentage"?`${Math.round(e*100)}%`:Re(e)}function Kh(s){const e=[Hi(s.date)];return s.courseName&&e.push(s.courseName),e.push(`${ue(s.holeCount,0)} holes`),e.join(" · ")}const Wh=_(`
    <div class="roundstats">
        <button bind="back" class="roundstats__back" type="button">Back to statistics</button>

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
                <h2 bind="wfHeading"></h2>
                <p bind="wfHint" class="roundstats__hint"></p>
                <div bind="deltas" class="roundstats__deltas"></div>
            </section>

            <div bind="panels" class="roundstats__panels"></div>

            <section class="roundstats__section">
                <h2 bind="legendHeading"></h2>
                <ul bind="legend" class="roundstats__legend"></ul>
            </section>
        </div>
    </div>
`),Yh=_(`
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
`),Qh=_(`
    <div class="holedetail__line">
        <span bind="label" class="holedetail__label"></span>
        <span bind="value" class="holedetail__value"></span>
    </div>
`),Xh=_(`
    <div class="delta">
        <div class="delta__text">
            <span bind="title" class="delta__title"></span>
            <span bind="sentence" class="delta__sentence"></span>
        </div>
        <span bind="value" class="delta__value"></span>
        <span bind="bar" class="delta__bar"></span>
    </div>
`),Jh=_('<li bind="text" class="roundstats__legenditem"></li>');function Zh(){const s=[];for(const[e,t]of Object.entries(ms))t.fill!==void 0&&s.push(`& .cell--${e} { background: ${t.fill}; color: #fff; border-color: transparent;`+(t.boxy?" border-radius: 3px;":"")+" }");return s.join(`
            `)}class ep extends E{static styles=`
        .roundstats {
            padding: ${o("xl")} ${o("lg")} ${o("2xl")};

            & .roundstats__back {
                ${w()}
                margin-bottom: ${o("lg")};
                padding: ${o("xs")} ${o("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }

            & .roundstats__state {
                margin: 0; color: ${a("text-muted")}; font-size: 0.9rem;
                &:empty { display: none; }
            }

            & .roundstats__body.hidden { display: none; }

            & .roundstats__head {
                margin-bottom: ${o("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 2rem; letter-spacing: -0.02em;
                }
                & p { margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
                & .roundstats__score {
                    color: ${a("text")};
                    font-size: 1.1rem; font-weight: 700;
                    font-variant-numeric: tabular-nums;
                    &:empty { display: none; }
                }
            }

            & .roundstats__section {
                margin-bottom: ${o("xl")};
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${o("md")};
                    font-family: ${a("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }
            & .roundstats__subhead {
                margin: ${o("lg")} 0 ${o("sm")};
                font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
                text-transform: uppercase; color: ${a("text-muted")};
                &:empty { display: none; }
            }
            & .roundstats__hint {
                margin: ${o("xs")} 0 0; font-size: 0.82rem; color: ${a("text-muted")};
            }

            /* A wrapping grid rather than a scroller: eighteen cells fit three
               rows of six on the narrowest phone, and a horizontal scroller
               hides half the round behind a gesture. */
            & .roundstats__strip {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: ${o("xs")};
            }
            & .cell {
                ${w()}
                display: flex; flex-direction: column; align-items: center; gap: 1px;
                padding: ${o("xs")} 2px;
                font-family: inherit;
                background: ${a("surface-sunken")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-sm")};

                &[aria-pressed='true'] { outline: 2px solid ${a("primary")}; outline-offset: 1px; }

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
            ${Zh()}

            & .holedetail {
                ${C()}
                margin-top: ${o("md")};
                padding: ${o("md")} ${o("lg")};
                &.hidden { display: none; }

                & .holedetail__title { margin: 0 0 ${o("xs")}; font-weight: 700; font-size: 0.95rem; }
                & .holedetail__lines { display: flex; flex-direction: column; gap: 2px; }
                & .holedetail__line { display: flex; justify-content: space-between; gap: ${o("md")}; }
                & .holedetail__label { color: ${a("text-muted")}; font-size: 0.85rem; }
                & .holedetail__value {
                    font-size: 0.85rem; font-weight: 600;
                    font-variant-numeric: tabular-nums;
                }
                & .holedetail__empty {
                    margin: 0; color: ${a("text-muted")}; font-size: 0.85rem;
                    &:empty { display: none; }
                }
            }

            & .roundstats__deltas { display: flex; flex-direction: column; gap: ${o("sm")}; }
            & .delta {
                ${C()}
                display: flex; align-items: center; gap: ${o("md")};
                padding: ${o("md")} ${o("lg")};

                & .delta__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
                & .delta__title { font-weight: 600; font-size: 0.98rem; }
                & .delta__sentence {
                    color: ${a("text-muted")}; font-size: 0.8rem;
                    &:empty { display: none; }
                }
                & .delta__value {
                    font-weight: 700; font-variant-numeric: tabular-nums;
                    flex-shrink: 0;
                }
                & .delta__bar { width: 84px; flex-shrink: 0; & svg { width: 100%; display: block; } }
            }

            & .roundstats__panels { margin-bottom: ${o("xl")}; }

            & .roundstats__legend {
                margin: 0; padding: 0; list-style: none;
                display: flex; flex-direction: column; gap: ${o("xs")};
                color: ${a("text-muted")}; font-size: 0.82rem;
            }
        }
    `;svc=this.inject(Ye);auth=this.inject(j);router=this.inject(M);colors=Pt;openHole=new p(null);render(){const e=this.router.query("id"),t=()=>this.svc.model.get(),n=()=>this.svc.phase.get()==="ready"&&t()!==null;this.track(I(()=>{const r=e.get();U(()=>{this.openHole.set(null),r&&this.svc.load(r)})}));const i=this.wire(Wh,{back:{onclick:()=>this.router.navigate("/stats")},state:()=>this.stateLine(),body:{className:()=>n()?"roundstats__body":"roundstats__body hidden"},title:()=>t()===null?"":rn(t()),subtitle:()=>this.subtitle(),score:()=>{const r=t();return r===null?"":Ai(r.strokes,r.vsPar)??""},stripSec:{className:()=>(t()?.cells.length??0)>0?"roundstats__section":"roundstats__section hidden"},wfHeading:()=>V.waterfallHeading,wfHint:()=>V.waterfallHint,legendHeading:()=>V.legendHeading,detail:{className:()=>this.selected()===null?"holedetail hidden":"holedetail"},detailTitle:()=>{const r=this.selected();return r===null?"":au(r)},detailEmpty:()=>{const r=this.selected();return r===null?"":ks(r).length===0?V.nothingRecordedOnHole:""}});return this.setHeading(i,"stripSec",V.holeStripHeading),this.$each(this.ref(i,"strip"),()=>t()?.cells??[],(r,l,d)=>this.wireEl(Yh,{cell:{className:()=>{const c=this.cellNow(r.id)??r;return c.marker===null?"cell":`cell cell--${c.marker}`},"aria-pressed":()=>String(this.openHole.get()===r.id),"aria-label":()=>fn(this.cellNow(r.id)??r),title:()=>fn(this.cellNow(r.id)??r),onclick:()=>this.openHole.set(this.openHole.get()===r.id?null:r.id)},hole:()=>String((this.cellNow(r.id)??r).holeNumber),score:()=>lu(this.cellNow(r.id)??r),tee:{className:()=>(this.cellNow(r.id)??r).tee===null?"cell__tee cell__tee--absent":"cell__tee",style:()=>{const c=this.cellNow(r.id)??r;return c.tee===null?"":`background:${this.teeColor(c.tee)}`}},gir:{className:()=>{const c=this.cellNow(r.id)??r;return c.gir===null?"cell__gir cell__gir--absent":c.gir?"cell__gir cell__gir--hit":"cell__gir"}},putts:()=>{const c=this.cellNow(r.id)??r;return c.putts===null?"":String(c.putts)},pen:{className:()=>$c(this.cellNow(r.id)??r)?"cell__pen":"cell__pen cell__pen--absent"}},d),r=>r.id),this.$each(this.ref(i,"detailLines"),()=>fu(this.selected()),(r,l,d)=>this.wireEl(Qh,{label:()=>r.label,value:()=>r.value},d),r=>r.key),this.$each(this.ref(i,"deltas"),()=>{const r=t();return r===null?[]:ee.filter(l=>Ie(r.waterfall,l)!==null)},(r,l,d)=>this.wireEl(Xh,{title:()=>$s(r),sentence:()=>{const c=t();if(c===null||c.deltas===null)return"";const u=bs(c.deltas,r);return u===null?"":Mi(u,c.windowCount)},value:{textContent:()=>{const c=this.componentValue(r);return c===null?"":Re(c)},style:()=>{const c=this.componentValue(r);return c===null?"":`color:${Ne(It(c),this.colors)}`}},bar:{innerHTML:()=>{const c=t(),u=this.componentValue(r);return c===null||u===null?"":Ni(u,Ei([c.waterfall]),this.colors)}}},d),r=>r),this.spawn(qi,this.ref(i,"panels"),{model:()=>t()?.panels??Pi}),this.$each(this.ref(i,"legend"),()=>[V.legendTee,V.legendGir,V.legendPutts,V.legendPenalty,V.legendAbsence],(r,l,d)=>this.wireEl(Jh,{text:()=>r},d),r=>r),i}cellNow(e){return this.svc.model.get()?.cells.find(t=>t.id===e)}selected(){const e=this.openHole.get();return e===null?null:this.cellNow(e)??null}teeColor(e){switch(e){case"fairway":return this.colors.gain;case"in_play":return this.colors.neutral;case"trouble":return this.colors.loss}}componentValue(e){const t=this.svc.model.get();return t===null?null:Ie(t.waterfall,e)}subtitle(){const e=this.svc.model.get();return e===null?"":ou({...e,title:rn(e)})}stateLine(){if(this.auth.currentUser.get()===null)return V.notSignedIn;switch(this.svc.phase.get()){case"loading":case"idle":return V.loading;case"notFound":return V.noStatsInRound;case"notAuthorized":return V.notSignedIn;case"failed":return`${V.failedPrefix}${this.svc.failure.get()??""}`;case"ready":return this.svc.model.get()?.cells.length===0?V.noHoleStrip:""}}setHeading(e,t,n){const i=this.ref(e,t).querySelector("h2");i&&(i.textContent=n)}}const tp=_(`
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
`),sp=_(`
    <div class="stat">
        <span bind="value" class="stat__value"></span>
        <span bind="label" class="stat__label"></span>
    </div>
`),np=_(`
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
`),ip=_(`
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
`),rp={not_started:"Not started",active:"Playing",complete:"Done"};function op(s){const e=[`${s.participants.length} players`,`${s.scoreEventCount} scores`];return s.lastEventAt?e.push(`last ${s.lastEventAt.replace("T"," ").slice(0,16)}`):e.push("never played"),e.join(" · ")}function ap(s){const e=[`@${s.username}`,`${s.roundCount} rounds`];return s.lastRoundDate&&e.push(`last ${s.lastRoundDate}`),s.handicapIndex!==null&&e.push(`hcp ${s.handicapIndex}`),s.deletedAt&&e.push("DELETED"),e.join(" · ")}class lp extends E{static styles=`
        .admin {
            padding: ${o("xl")} ${o("lg")} ${o("2xl")};

            & .admin__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${a("text-muted")};
                cursor: pointer; padding: ${o("xs")} 0; margin-bottom: ${o("md")};
            }

            & .admin__title {
                margin: 0 0 ${o("lg")};
                font-family: ${a("font-display")};
                font-weight: 600; font-size: 1.8rem; letter-spacing: -0.02em;
                color: ${a("text")};
            }

            & .admin__denied {
                color: ${a("text-muted")}; font-size: 0.9rem;
                &.hidden { display: none; }
                & code {
                    display: block; margin-top: ${o("xs")};
                    font-size: 0.8rem; word-break: break-all;
                }
            }
            & .admin__denied-hint { color: ${a("text-muted")}; }
            & .admin__body.hidden { display: none; }

            & .admin__stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
                gap: ${o("sm")};
                margin-bottom: ${o("lg")};

                & .stat {
                    ${C({})}
                    display: flex; flex-direction: column; gap: 2px;
                    padding: ${o("sm")} ${o("md")};

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
                display: flex; gap: ${o("sm")}; margin-bottom: ${o("md")};

                & button {
                    ${w()}
                    flex: 1;
                    padding: ${o("sm")} ${o("md")};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
                    background: ${a("surface-sunken")}; color: ${a("text-muted")};
                    border: none; cursor: pointer;

                    &.active { background: ${a("primary")}; color: ${a("primary-text")}; }
                }
            }

            & .admin__loading {
                color: ${a("text-muted")}; font-size: 0.9rem; padding: ${o("lg")} 0;
                &.hidden { display: none; }
            }

            & .admin__list {
                display: flex; flex-direction: column; gap: ${o("sm")};
                &.hidden { display: none; }
            }

            & .admin-row {
                ${C({hover:!0})}
                display: flex; flex-direction: column; gap: ${o("xs")};
                width: 100%; text-align: left; font-family: inherit;
                padding: ${o("md")} ${o("lg")};
                cursor: pointer;

                &.admin-row--static { cursor: default; }

                & .admin-row__top {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: ${o("sm")};
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
                    display: flex; justify-content: flex-end; margin-top: ${o("xs")};
                    & button {
                        ${w()}
                        padding: ${o("xs")} ${o("md")};
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
    `;svc=this.inject(oi);auth=this.inject(j);router=this.inject(M);tab=new p("rounds");grantOpen=new p(!1);grantTarget=new p(null);mutating=new p(!1);denied=new $(()=>this.auth.currentUser.get()===null||!this.svc.isSuperAdmin());render(){this.svc.loadRoles().then(()=>{this.svc.isSuperAdmin()&&this.svc.load()});const e=this.wire(tp,{back:{onclick:()=>this.router.navigate("/")},denied:{className:()=>this.denied.get()?"admin__denied":"admin__denied hidden"},body:{className:()=>this.denied.get()?"admin__body hidden":"admin__body"},loading:{className:()=>this.svc.loading.get()?"admin__loading":"admin__loading hidden"},tabRounds:{className:()=>this.tab.get()==="rounds"?"active":"",onclick:()=>this.tab.set("rounds")},tabPlayers:{className:()=>this.tab.get()==="players"?"active":"",onclick:()=>this.tab.set("players")},roundList:{className:()=>this.tab.get()==="rounds"?"admin__list":"admin__list hidden"},playerList:{className:()=>this.tab.get()==="players"?"admin__list":"admin__list hidden"}}),t=new $(()=>{const n=this.svc.stats.get();return n?[{key:"rounds",label:"Rounds",value:n.rounds},{key:"active",label:"Playing",value:n.roundsActive},{key:"week",label:"Last 7d",value:n.roundsLast7Days},{key:"players",label:"Players",value:n.players},{key:"guests",label:"Guests",value:n.guests},{key:"scores",label:"Scores",value:n.scoreEvents}]:[]});return this.$each(this.ref(e,"stats"),t,(n,i,r)=>this.wireEl(sp,{value:()=>String(n.value),label:()=>n.label},r),n=>n.key),this.$each(this.ref(e,"roundList"),this.svc.rounds,(n,i,r)=>this.wireEl(np,{row:{disabled:()=>n.shareToken===null,onclick:()=>{n.shareToken&&this.router.navigate("/round",{query:{token:n.shareToken}})}},course:()=>n.courseName??"Unknown course",status:()=>rp[n.status],who:()=>{const l=n.creatorName?`by ${n.creatorName}`:"by a guest",d=n.participants.join(", ");return d?`${l} — ${d}`:l},meta:()=>`${n.date} · ${op(n)}`},r),n=>n.roundId),this.$each(this.ref(e,"playerList"),this.svc.players,(n,i,r)=>this.wireEl(ip,{name:()=>n.displayName,roleChip:()=>n.roles.includes("super_admin")?"admin":"",meta:()=>ap(n),toggle:{textContent:()=>n.roles.includes("super_admin")?"Revoke admin":"Make admin",disabled:()=>this.mutating.get(),onclick:()=>{this.grantTarget.set(n),this.grantOpen.set(!0)}}},r),n=>n.playerId),this.spawn(Z,this.ref(e,"confirmHost"),{open:this.grantOpen,title:()=>this.grantTarget.get()?.roles.includes("super_admin")?"Revoke admin?":"Make admin?",message:()=>{const n=this.grantTarget.get();return n?n.roles.includes("super_admin")?`Remove the super admin role from ${n.displayName}?`:`Give ${n.displayName} the super admin role? They will be able to see every player's rounds.`:""},confirmLabel:"Confirm",cancelLabel:"Cancel",onconfirm:()=>{const n=this.grantTarget.get();n&&this.toggleAdmin(n)}}),e}async toggleAdmin(e){this.mutating.set(!0);try{const t={playerId:e.playerId,role:"super_admin"};e.roles.includes("super_admin")?await v.admin.adminRevokeRole(t):await v.admin.adminGrantRole(t),await this.svc.load(!0)}finally{this.mutating.set(!1)}}}function dp(s,e){return s?e!==null&&s.ownerPlayerId===e?!0:s.rounds.some(t=>typeof t.shareToken=="string"):!1}class ve{list=new p([]);listLoading=new p(!1);listError=new p(null);listLoaded=new p(!1);detail=new p(null);detailId=new p(null);detailLoading=new p(!1);detailError=new p(null);participants=new p([]);board=new p(null);boardRefusal=new p(null);boardLoading=new p(!1);results=new p(null);resultsRefusal=new p(null);mutating=new p(!1);mutateError=new p(null);async loadList(e=!1){if(!e&&(this.listLoaded.get()||this.listLoading.get()))return;const t=await A(this.listLoading,this.listError,()=>v.competitions.list());t&&(this.list.set(t),this.listLoaded.set(!0))}async loadDetail(e,t=!1){if(!t&&this.detailId.get()===e&&this.detail.get()!==null&&!this.detailLoading.get()||this.detailLoading.get()&&this.detailId.get()===e)return;this.detailId.set(e);const n=await A(this.detailLoading,this.detailError,()=>Promise.all([v.competitions.get({id:e}),v.competitions.participants({competitionId:e})]));if(!n)return;const[i,r]=n;this.detailId.get()===e&&(this.detail.set(i),this.participants.set(r),await this.loadBoard(e),i.lifecycle==="finalized"&&await this.loadResults(e))}async loadBoard(e){this.boardLoading.set(!0);try{const t=await v.competitions.leaderboard({id:e});t.ok?(this.board.set(t.value),this.boardRefusal.set(null)):(this.board.set(null),this.boardRefusal.set(t.refusal.message))}catch{this.board.set(null),this.boardRefusal.set(null)}finally{this.boardLoading.set(!1)}}async loadResults(e){try{const t=await v.competitions.results({id:e});t.ok?(this.results.set(t.value),this.resultsRefusal.set(null)):(this.results.set(null),this.resultsRefusal.set(t.refusal.message))}catch{this.results.set(null)}}async create(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.create({name:e});return this.list.set([t,...this.list.get()]),t}catch(t){return this.mutateError.set(ge(t)),null}finally{this.mutating.set(!1)}}transition(e,t){return this.mutate(()=>v.competitions.transition({id:e,to:t}),()=>this.loadDetail(e,!0))}updateConfig(e){return this.mutate(()=>v.competitions.update(e),()=>this.loadDetail(e.id,!0))}async addPlayer(e,t,n){return this.rosterMutate(e,()=>v.competitions.addParticipant({competitionId:e,playerId:t,category:n}))}async addGuest(e,t,n){this.mutating.set(!0),this.mutateError.set(null);let i;try{i=(await v.guestPlayers.create(t)).id}catch(r){return this.mutating.set(!1),this.mutateError.set(ge(r)),ge(r)}return this.mutating.set(!1),this.rosterMutate(e,()=>v.competitions.addParticipant({competitionId:e,guestPlayerId:i,category:n}))}removeParticipant(e,t){return this.rosterMutate(e,()=>v.competitions.removeParticipant({participantId:t}))}withdrawParticipant(e,t){return this.rosterMutate(e,()=>v.competitions.withdrawParticipant({participantId:t}))}async createRound(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.createRound(e);if(t.ok)return await this.loadDetail(e.id,!0),{ok:!0,shareToken:t.shareToken};const n="refusal"in t?t.refusal.message:t.diagnostics.map(i=>i.message).join(" · ");return this.mutateError.set(n),{ok:!1,message:n}}catch(t){const n=ge(t);return this.mutateError.set(n),{ok:!1,message:n}}finally{this.mutating.set(!1)}}async applyCut(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.applyCut({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const n=ge(t);return this.mutateError.set(n),{ok:!1,message:n}}finally{this.mutating.set(!1)}}async finalize(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await v.competitions.finalize({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const n=ge(t);return this.mutateError.set(n),{ok:!1,message:n}}finally{this.mutating.set(!1)}}clear(){this.list.set([]),this.listLoaded.set(!1),this.detail.set(null),this.detailId.set(null),this.participants.set([]),this.board.set(null),this.boardRefusal.set(null),this.results.set(null),this.resultsRefusal.set(null),this.listError.set(null),this.detailError.set(null),this.mutateError.set(null)}async mutate(e,t){this.mutating.set(!0),this.mutateError.set(null);try{const n=await e();return n.ok?(await t(),null):(this.mutateError.set(n.refusal.message),n.refusal.message)}catch(n){const i=ge(n);return this.mutateError.set(i),i}finally{this.mutating.set(!1)}}rosterMutate(e,t){return this.mutate(t,async()=>{const n=await v.competitions.participants({competitionId:e});this.participants.set(n)})}}function ge(s){return s&&typeof s=="object"&&"message"in s&&typeof s.message=="string"?s.message:"Something went wrong. Try again."}function Vi(s){switch(s){case"draft":return"Draft";case"setup":return"Setup";case"active":return"Live";case"finalized":return"Finalized"}}function Ui(s){return`comp-chip comp-chip--${s}`}function Wt(s){switch(s){case"draft":return{to:"setup",label:"Open setup"};case"setup":return{to:"active",label:"Start competition"};default:return null}}function rs(s){return s==="draft"||s==="setup"}function cp(s){return s==="setup"||s==="active"}const up=_(`
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
`),hp=_(`
    <button bind="row" type="button" class="comp-row">
        <span bind="name" class="comp-row__name"></span>
        <span bind="chip"></span>
    </button>
`);class pp extends E{static styles=`
        .comps {
            padding: ${o("xl")} ${o("lg")} ${o("2xl")};

            & .comps__head {
                margin-bottom: ${o("xl")};
                & h1 {
                    margin: 0;
                    font-family: ${a("font-display")};
                    font-weight: 600;
                    font-size: 2rem;
                    letter-spacing: -0.02em;
                }
                & p { margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.9rem; }
            }

            & .comps__anon {
                text-align: center;
                padding: ${o("2xl")} 0;
                color: ${a("text-muted")};
                &.hidden { display: none; }
                & button {
                    ${w()}
                    margin-top: ${o("md")};
                    padding: ${o("md")} ${o("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }
            & .comps__body.hidden { display: none; }

            & .comps__create {
                display: flex;
                gap: ${o("sm")};
                margin-bottom: ${o("md")};
                & input { ${X()} flex: 1; padding: ${o("md")}; font-size: 1rem; }
                & button {
                    ${w()}
                    padding: ${o("md")} ${o("lg")};
                    font-family: inherit; font-size: 0.95rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                    &:disabled { opacity: 0.5; cursor: default; }
                }
            }
            & .comps__err {
                margin: 0 0 ${o("md")}; font-size: 0.85rem; color: ${a("error")};
                &:empty { display: none; }
            }

            & .comps__loading, & .comps__empty {
                color: ${a("text-muted")}; font-size: 0.9rem; padding: ${o("lg")} 0;
                &.hidden { display: none; }
            }

            & .comps__list { display: flex; flex-direction: column; gap: ${o("sm")}; }

            & .comp-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${o("md")};
                padding: ${o("md")} ${o("lg")};
                text-align: left;
                font-family: inherit;
                width: 100%;
                ${C({hover:!0})}
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
    `;svc=this.inject(ve);auth=this.inject(j);router=this.inject(M);loggedIn=new $(()=>this.auth.currentUser.get()!==null);nameDraft=new p("");render(){this.loggedIn.get()&&this.svc.loadList();const e=this.wire(up,{anon:{className:()=>this.loggedIn.get()?"comps__anon hidden":"comps__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/competitions"}})},body:{className:()=>this.loggedIn.get()?"comps__body":"comps__body hidden"},nameInput:{value:()=>this.nameDraft.get(),oninput:t=>this.nameDraft.set(t.target.value)},createBtn:{disabled:()=>this.svc.mutating.get()||this.nameDraft.get().trim()==="",textContent:()=>this.svc.mutating.get()?"Creating…":"Create"},createForm:{onsubmit:async t=>{t.preventDefault();const n=this.nameDraft.get().trim();if(n==="")return;const i=await this.svc.create(n);i&&(this.nameDraft.set(""),this.router.navigate("/competition",{query:{id:i.id}}))}},createErr:{textContent:()=>this.svc.mutateError.get()??""},loading:{className:()=>this.svc.listLoading.get()&&!this.svc.listLoaded.get()?"comps__loading":"comps__loading hidden"},empty:{className:()=>this.svc.listLoaded.get()&&this.svc.list.get().length===0?"comps__empty":"comps__empty hidden"}});return this.$each(this.ref(e,"list"),this.svc.list,(t,n,i)=>this.wireEl(hp,{row:{onclick:()=>this.router.navigate("/competition",{query:{id:t.id}})},name:()=>t.name,chip:{textContent:()=>Vi(t.lifecycle),className:()=>Ui(t.lifecycle)}},i),t=>t.id),e}}class fp{loading=new p(!1);error=new p(null);descriptors=new p([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await A(this.loading,this.error,()=>v.setup.aggregations());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=we()){const n=typeof e=="string"?this.byId(e):e;return n?n.labels?.[t]??n.labels?.en??n.label:typeof e=="string"?e:""}}function mp(s,e){const t={};for(const n of s){const i=e[n.key];t[n.key]=i!=null?String(i):String(n.default)}return t}function gp(s,e){const t={};for(const n of s){const i=e[n.key]??String(n.default);t[n.key]=n.kind==="integer"?Number.parseInt(i,10)||Number(n.default):i}return t}class et{competitions=G.get(ve);formats=G.get(Ve);aggregations=G.get(fp);friends=G.get($t);profile=G.get(Je);auth=G.get(j);router=G.get(M);id=this.router.query("id");admin=new $(()=>dp(this.competitions.detail.get(),this.profile.player.get()?.id??null));lifecycle=new $(()=>this.competitions.detail.get()?.lifecycle??"draft");editingSetup=new p(!1);nameDraft=new p("");slotDraft=new p([]);aggregationStrategy=new p("");aggregationValues=new p({});startListDraft=new p("single_group");courseDraft=new p("");teeDraft=new p("");cutAfterDraft=new p("");cutTypeDraft=new p("");cutValueDraft=new p("");formatPickDraft=new p("");guestNameDraft=new p("");guestGenderDraft=new p("M");guestHcpDraft=new p("");roundCourseDraft=new p("");roundDateDraft=new p("");courses=new p([]);tees=new p([]);resultSetIndex=new p(0);cutOutcome=new p(null);cutConfirmOpen=new p(!1);finalizeConfirmOpen=new p(!1);coursesLoaded=!1;enter(){this.editingSetup.set(!1),this.nameDraft.set(""),this.slotDraft.set([]),this.aggregationStrategy.set(""),this.aggregationValues.set({}),this.startListDraft.set("single_group"),this.courseDraft.set(""),this.teeDraft.set(""),this.tees.set([]),this.cutAfterDraft.set(""),this.cutTypeDraft.set(""),this.cutValueDraft.set(""),this.formatPickDraft.set(""),this.guestNameDraft.set(""),this.guestGenderDraft.set("M"),this.guestHcpDraft.set(""),this.roundCourseDraft.set(""),this.roundDateDraft.set(""),this.resultSetIndex.set(0),this.cutOutcome.set(null),this.cutConfirmOpen.set(!1),this.finalizeConfirmOpen.set(!1)}initialize(){this.auth.currentUser.get()&&(this.profile.load(),this.friends.load()),this.formats.load(),this.aggregations.load(),this.loadCourses()}loadCourses(){this.coursesLoaded||(this.coursesLoaded=!0,v.courses.list().then(e=>this.courses.set(e)).catch(()=>{this.coursesLoaded=!1}))}async loadTees(e){if(!e){this.tees.set([]);return}try{this.tees.set(await v.tees.listByCourse({courseId:e}))}catch{this.tees.set([])}}selectAggregation(e){this.applyAggregation(e,{})}applyAggregation(e,t){this.aggregationStrategy.set(e);const n=this.aggregations.byId(e)?.configFields??[];this.aggregationValues.set(mp(n,t))}setAggregationValue(e,t){this.aggregationValues.set({...this.aggregationValues.get(),[e]:t})}seedSetupEditor(){const e=this.competitions.detail.get();if(!e)return;this.nameDraft.set(e.name);const t=e.defaultConfig;this.slotDraft.set((t?.slots??[]).map(l=>l.formatId)),this.startListDraft.set(t?.startList??"single_group"),this.teeDraft.set(t?.fallbackTee?.teeId??"");const n=e.aggregation,i=n?.strategyId??this.aggregations.descriptors.get()[0]?.id??"";this.applyAggregation(i,n?.config??{});const r=e.cutRules;this.cutAfterDraft.set(r?.afterRound!==void 0?String(r.afterRound):""),this.cutTypeDraft.set(r?.cutType??""),this.cutValueDraft.set(r?.cutValue!==void 0?String(r.cutValue):""),this.formatPickDraft.set(this.formats.descriptors.get()[0]?.id??""),this.editingSetup.set(!0)}async saveSetup(){const e=this.id.get()??"",t=this.slotDraft.get().map(b=>({formatId:b})),n=this.teeDraft.get(),i=t.length>0?{slots:t,startList:this.startListDraft.get(),...n?{fallbackTee:{teeId:n}}:{}}:void 0,r=this.aggregationStrategy.get(),l=this.aggregations.byId(r)?.configFields??[],d=r?{strategyId:r,config:gp(l,this.aggregationValues.get())}:void 0,c=Number.parseInt(this.cutAfterDraft.get(),10),u=Number.parseInt(this.cutValueDraft.get(),10),f=this.cutTypeDraft.get(),m=f&&Number.isFinite(c)&&Number.isFinite(u)?{afterRound:c,cutType:f,cutValue:u}:void 0;await this.competitions.updateConfig({id:e,name:this.nameDraft.get().trim()||void 0,...i?{defaultConfig:i}:{},...d?{aggregation:d}:{},...m?{cutRules:m}:{}})===null&&this.editingSetup.set(!1)}async addGuest(){const e=this.guestNameDraft.get().trim();if(!e)return;const t=ie(this.guestHcpDraft.get());await this.competitions.addGuest(this.id.get()??"",{displayName:e,gender:this.guestGenderDraft.get(),handicapIndex:t},null)===null&&(this.guestNameDraft.set(""),this.guestHcpDraft.set(""))}async createRound(){const e=this.roundCourseDraft.get()||this.courseDraft.get(),t=this.roundDateDraft.get();if(!e||!t)return this.competitions.mutateError.set("Pick a course and a date for the round."),null;const n=await this.competitions.createRound({id:this.id.get()??"",courseId:e,playedAt:t});return n.ok?n.shareToken:null}}const bp=_(`
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
`),_p=_(`
    <div class="cd__slot">
        <span bind="label"></span>
        <button bind="remove" type="button" aria-label="Remove">×</button>
    </div>
`),lt=_('<option bind="option"></option>'),yp=_(`
    <label class="cd__field">
        <span bind="label"></span>
        <select bind="select"></select>
        <input bind="integer" inputmode="numeric" />
    </label>
`);class vp extends E{competitions=this.inject(ve);state=this.inject(et);render(){const e=()=>this.competitions.detail.get(),t=this.wire(bp,{root:{className:()=>this.state.admin.get()&&rs(this.state.lifecycle.get())?"cd__section cd__setup":"cd__section cd__setup hidden"},toggle:{textContent:()=>this.state.editingSetup.get()?"Close":"Edit",onclick:()=>{this.state.editingSetup.get()?this.state.editingSetup.set(!1):this.state.seedSetupEditor()}},summary:{className:()=>this.state.editingSetup.get()?"cd__summary hidden":"cd__summary"},summaryFormats:{textContent:()=>{const r=e()?.defaultConfig?.slots??[];return r.length?r.map(l=>this.state.formats.labelOf(l.formatId)??l.formatId).join(", "):"none set"},className:()=>(e()?.defaultConfig?.slots.length??0)===0?"cd__muted-em":""},summaryScoring:{textContent:()=>{const r=e()?.aggregation;return r?this.state.aggregations.labelOf(r.strategyId):"default (chosen automatically)"},className:()=>e()?.aggregation?"":"cd__muted-em"},form:{className:()=>this.state.editingSetup.get()?"cd__form":"cd__form hidden"},name:{value:()=>this.state.nameDraft.get(),oninput:r=>this.state.nameDraft.set(r.target.value)},formatPick:{value:()=>this.state.formatPickDraft.get(),onchange:r=>this.state.formatPickDraft.set(r.target.value)},addSlot:{onclick:()=>{const r=this.state.formatPickDraft.get()||this.state.formats.descriptors.get()[0]?.id;r&&this.state.slotDraft.set([...this.state.slotDraft.get(),r])}},aggregationPick:{value:()=>this.state.aggregationStrategy.get(),onchange:r=>this.state.selectAggregation(r.target.value)},aggregationDescription:()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.description??"",course:{value:()=>this.state.courseDraft.get(),onchange:r=>{const l=r.target.value;this.state.courseDraft.set(l),this.state.teeDraft.set(""),this.state.loadTees(l)}},tee:{value:()=>this.state.teeDraft.get(),onchange:r=>this.state.teeDraft.set(r.target.value)},startList:{value:()=>this.state.startListDraft.get(),onchange:r=>this.state.startListDraft.set(r.target.value)},cutAfter:{value:()=>this.state.cutAfterDraft.get(),oninput:r=>this.state.cutAfterDraft.set(r.target.value)},cutType:{value:()=>this.state.cutTypeDraft.get(),onchange:r=>this.state.cutTypeDraft.set(r.target.value)},cutValue:{value:()=>this.state.cutValueDraft.get(),oninput:r=>this.state.cutValueDraft.set(r.target.value)},save:{disabled:()=>this.competitions.mutating.get(),textContent:()=>this.competitions.mutating.get()?"Saving…":"Save setup",onclick:()=>{this.state.saveSetup()}},cancel:{onclick:()=>this.state.editingSetup.set(!1)}});this.$each(this.ref(t,"slots"),this.state.slotDraft,(r,l,d)=>this.wireEl(_p,{label:()=>`Slot ${l+1}: ${this.state.formats.labelOf(r)??r}`,remove:{onclick:()=>this.state.slotDraft.set(this.state.slotDraft.get().filter((c,u)=>u!==l))}},d),(r,l)=>`${l}:${r}`),this.$each(this.ref(t,"formatPick"),this.state.formats.descriptors,(r,l,d)=>this.wireEl(lt,{option:{value:()=>r.id,textContent:()=>this.state.formats.labelOf(r)??r.id}},d),r=>r.id),this.$each(this.ref(t,"aggregationPick"),this.state.aggregations.descriptors,(r,l,d)=>this.wireEl(lt,{option:{value:()=>r.id,textContent:()=>this.state.aggregations.labelOf(r)}},d),r=>r.id);const n=new $(()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.configFields??[]);this.$each(this.ref(t,"aggregationFields"),n,(r,l,d)=>this.configField(r,d),r=>r.key);const i=(r,l)=>this.wireEl(lt,{option:{value:()=>r.id,textContent:()=>r.name}},l);return this.$each(this.ref(t,"course"),this.state.courses,(r,l,d)=>i(r,d),r=>r.id),this.$each(this.ref(t,"tee"),this.state.tees,(r,l,d)=>i(r,d),r=>r.id),t}configField(e,t){const n=this.wireEl(yp,{label:()=>e.label,select:{className:()=>e.kind==="select"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),onchange:l=>this.state.setAggregationValue(e.key,l.target.value)},integer:{className:()=>e.kind==="integer"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),oninput:l=>this.state.setAggregationValue(e.key,l.target.value)}},t),i=n.querySelector("select"),r=new $(()=>e.kind==="select"?e.options:[]);return this.$each(i,r,(l,d,c)=>this.wireEl(lt,{option:{value:()=>l.value,textContent:()=>l.label}},c),l=>l.value),n}}const wp=_(`
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
`),xp=_(`
    <div class="cd__rosterrow">
        <span bind="name" class="cd__rname"></span>
        <span bind="category" class="cd__rcat"></span>
        <span bind="status" class="cd__rout"></span>
        <button bind="withdraw" class="cd__ract" type="button">Withdraw</button>
        <button bind="remove" class="cd__ract cd__ract--danger" type="button">Remove</button>
    </div>
`),$p=_('<button bind="chip" class="cd__friendchip" type="button"></button>');class kp extends E{competitions=this.inject(ve);state=this.inject(et);render(){const e=()=>this.state.id.get()??"",t=this.wire(wp,{count:()=>{const n=this.competitions.participants.get().length;return n===0?"":String(n)},empty:{className:()=>this.competitions.participants.get().length===0?"cd__empty":"cd__empty hidden"},add:{className:()=>this.state.admin.get()&&rs(this.state.lifecycle.get())?"cd__rosteradd":"cd__rosteradd hidden"},guestForm:{onsubmit:n=>{n.preventDefault(),this.state.addGuest()}},guestName:{value:()=>this.state.guestNameDraft.get(),oninput:n=>this.state.guestNameDraft.set(n.target.value)},guestGender:{value:()=>this.state.guestGenderDraft.get(),onchange:n=>this.state.guestGenderDraft.set(n.target.value)},guestHcp:{value:()=>this.state.guestHcpDraft.get(),oninput:n=>this.state.guestHcpDraft.set(n.target.value)},addGuest:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"roster"),this.competitions.participants,(n,i,r)=>this.wireEl(xp,{name:()=>n.displayNameSnapshot,category:{textContent:()=>n.category??"",className:()=>n.category?"cd__rcat":"cd__rcat hidden"},status:{textContent:()=>n.withdrawnAt?"Withdrawn":n.cutAfterRound!==null?`Cut R${n.cutAfterRound}`:"",className:()=>n.withdrawnAt||n.cutAfterRound!==null?"cd__rout":"cd__rout hidden"},withdraw:{className:()=>this.state.admin.get()&&!n.withdrawnAt?"cd__ract":"cd__ract hidden",onclick:()=>{this.competitions.withdrawParticipant(e(),n.id)}},remove:{className:()=>this.state.admin.get()&&rs(this.state.lifecycle.get())?"cd__ract cd__ract--danger":"cd__ract cd__ract--danger hidden",onclick:()=>{this.competitions.removeParticipant(e(),n.id)}}},r),n=>JSON.stringify({id:n.id,name:n.displayNameSnapshot,category:n.category,withdrawnAt:n.withdrawnAt,cutAfterRound:n.cutAfterRound})),this.$each(this.ref(t,"friends"),this.state.friends.friends,(n,i,r)=>this.wireEl($p,{chip:{textContent:()=>n.displayName,disabled:()=>this.competitions.mutating.get()||this.competitions.participants.get().some(l=>l.playerId===n.id),onclick:()=>{this.competitions.addPlayer(e(),n.id,null)}}},r),n=>n.id),t}}const Sp={not_started:"Not started",active:"Live",complete:"Finished"},Tp=_(`
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
`),Ip=_(`
    <button bind="row" class="cd__roundrow" type="button">
        <span bind="number" class="cd__rnum"></span>
        <span bind="meta" class="cd__rmeta"></span>
        <span bind="status" class="cd__rstatus"></span>
    </button>
`),Pp=_('<option bind="option"></option>');class Cp extends E{competitions=this.inject(ve);state=this.inject(et);router=this.inject(M);render(){const e=new $(()=>this.competitions.detail.get()?.rounds??[]),t=this.wire(Tp,{empty:{className:()=>e.get().length===0?"cd__empty":"cd__empty hidden"},form:{className:()=>this.state.admin.get()&&cp(this.state.lifecycle.get())?"cd__addround":"cd__addround hidden",onsubmit:n=>{n.preventDefault(),this.createRound()}},course:{value:()=>this.state.roundCourseDraft.get(),onchange:n=>this.state.roundCourseDraft.set(n.target.value)},date:{value:()=>this.state.roundDateDraft.get(),oninput:n=>this.state.roundDateDraft.set(n.target.value)},add:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"course"),this.state.courses,(n,i,r)=>this.wireEl(Pp,{option:{value:()=>n.id,textContent:()=>n.name}},r),n=>n.id),this.$each(this.ref(t,"rounds"),e,(n,i,r)=>this.wireEl(Ip,{row:{disabled:()=>!n.shareToken,onclick:()=>{n.shareToken&&this.router.navigate("/round",{query:{token:n.shareToken}})}},number:()=>`Round ${n.roundNumber}`,meta:()=>[n.courseNameSnapshot,n.date].filter(Boolean).join(" · ")||(n.shareToken?"Open":"View-only"),status:{textContent:()=>Sp[n.status]??n.status,className:()=>`cd__rstatus s-${n.status}`}},r),n=>JSON.stringify({id:n.id,status:n.status,shareToken:n.shareToken,courseName:n.courseNameSnapshot,date:n.date})),t}async createRound(){const e=await this.state.createRound();e&&this.router.navigate("/round",{query:{token:e}})}}function Ep(s,e,t){return JSON.stringify({entry:s,points:e,columns:t})}function Np(s){return s.rounds.filter(e=>e.value!==null).map(e=>({text:String(e.value),dropped:e.status==="dropped"}))}const Rp=_(`
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
`),Op=_('<button bind="button" type="button"></button>'),zp=_('<th bind="cell"></th>'),Lp=_('<tr bind="row"></tr>'),Hp=_('<td bind="cell"><span bind="value"></span></td>'),Ap=_(`
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
`),Mp=_('<span bind="part"><span bind="separator"></span><span bind="value"></span></span>');class Fp extends E{competitions=this.inject(ve);state=this.inject(et);render(){const e=new $(()=>{if(this.state.lifecycle.get()!=="finalized")return(this.competitions.board.get()?.view.entries??[]).map(m=>({entry:m,points:null}));const u=this.competitions.results.get()?.resultSets??[],f=Math.min(this.state.resultSetIndex.get(),u.length-1);return(u[f]?.entries??[]).map(m=>({entry:m.entry,points:m.points}))}),t=new $(()=>{const u=this.competitions.board.get()?.view.rounds??[];if(u.length>0)return u;const f=new Set;for(const m of e.get())for(const h of m.entry.rounds)f.add(h.roundNumber);return[...f].sort((m,h)=>m-h).map(m=>({roundNumber:m,postCut:!1}))}),n=()=>this.state.lifecycle.get()==="finalized",i=()=>n()?(this.competitions.results.get()?.resultSets.length??0)>0:this.competitions.board.get()!==null,r=()=>this.state.cutOutcome.get(),l=u=>u.length===0?"—":u.map(f=>f.displayName).join(", "),d=this.wire(Rp,{admin:{className:()=>this.state.admin.get()&&this.state.lifecycle.get()==="active"?"cd__section cd__admin":"cd__section cd__admin hidden"},cutOutcome:{className:()=>r()?"cd__cutoutcome":"cd__cutoutcome hidden"},advancedLabel:()=>`Advanced (${r()?.advanced.length??0}):`,advanced:()=>l(r()?.advanced??[]),cutLabel:()=>`Cut (${r()?.cut.length??0}):`,cut:()=>l(r()?.cut??[]),applyCut:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.cutConfirmOpen.set(!0)},finalize:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.finalizeConfirmOpen.set(!0)},title:()=>n()?"Official results":"Leaderboard",board:{className:()=>n()?"cd__board cb cb--official":"cd__board"},official:{textContent:()=>{const u=this.competitions.results.get()?.finalizedAt.slice(0,10)??"";return n()&&u?`Official results · finalized ${u}`:""},className:()=>n()?"cd__official-banner":"cd__official-banner hidden"},boardHead:{className:()=>n()?"cb-head hidden":"cb-head"},metric:()=>this.competitions.board.get()?.view.metricLabel??"",operator:()=>{const u=this.competitions.board.get();return u?u.view.operator.kind==="best_n"?`Best ${u.view.operator.n} of ${u.view.rounds.length}`:"Total across rounds":""},defaulted:{className:()=>this.competitions.board.get()?.defaulted?"cb-head__hint":"cb-head__hint hidden"},empty:{className:()=>i()&&e.get().length===0?"cb-empty":"cb-empty hidden"},table:{className:()=>i()&&e.get().length>0?"cb":"cb hidden"},refusal:{textContent:()=>n()?this.competitions.resultsRefusal.get()??"":this.competitions.board.get()===null?this.competitions.boardRefusal.get()??"":""}}),c=new $(()=>[{text:"#",className:"cb-pos"},{text:"Player",className:"cb-who"},...t.get().map((u,f,m)=>({text:`R${u.roundNumber}`,className:`cb-c${u.postCut&&!m.slice(0,f).some(h=>h.postCut)?" cb-c--divider":""}`})),{text:"Total",className:"cb-total"},...n()?[{text:"Pts",className:"cb-points"}]:[]]);return this.$each(this.ref(d,"headers"),c,(u,f,m)=>this.wireEl(zp,{cell:{textContent:()=>u.text,className:()=>u.className}},m),u=>`${u.text}:${u.className}`),this.$each(this.ref(d,"rows"),e,(u,f,m)=>this.boardRow(u,t.get(),m),u=>Ep(u.entry,u.points,t.get())),this.$each(this.ref(d,"switcher"),new $(()=>n()?this.competitions.results.get()?.resultSets??[]:[]),(u,f,m)=>this.wireEl(Op,{button:{textContent:()=>u.scoringType.toUpperCase(),className:()=>this.state.resultSetIndex.get()===f?"on":"",onclick:()=>this.state.resultSetIndex.set(f)}},m),u=>u.scoringType),this.spawn(Z,this.ref(d,"cutConfirm"),{open:this.state.cutConfirmOpen,title:"Apply cut?",message:"This evaluates the configured cut against the current aggregate and marks who advances. Cut players are left out of later rounds.",confirmLabel:"Apply cut",cancelLabel:"Cancel",onconfirm:async()=>{const u=await this.competitions.applyCut(this.state.id.get()??"");u.ok&&this.state.cutOutcome.set(u.outcome)}}),this.spawn(Z,this.ref(d,"finalizeConfirm"),{open:this.state.finalizeConfirmOpen,title:"Finalize competition?",message:"Finalizing freezes the official results and locks the competition. This cannot be undone.",confirmLabel:"Finalize",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.competitions.finalize(this.state.id.get()??"")}}),d}boardRow(e,t,n){const i=e.entry,r=i.withdrawn||i.cutAfterRound!==null,l=["cb-row"];i.withdrawn?l.push("cb-row--withdrawn"):i.cutAfterRound!==null?l.push("cb-row--cut"):i.position===1&&l.push("cb-row--lead"),i.incomplete&&l.push("cb-row--incomplete");const d=t.findIndex(m=>m.postCut),c=new Map(i.rounds.map(m=>[m.roundNumber,m])),u=[{kind:"position",text:r?"—":String(i.position)},{kind:"who",entry:i},...t.map((m,h)=>({kind:"round",cell:c.get(m.roundNumber)??null,divider:h===d})),{kind:"total",text:i.total===null?"—":String(i.total)},...e.points===null?[]:[{kind:"points",text:String(e.points)}]],f=this.wireEl(Lp,{row:{className:()=>l.join(" ")}},n);return this.$each(f,new $(()=>u),(m,h,b)=>this.boardCell(m,b),(m,h)=>h),f}boardCell(e,t){if(e.kind==="who")return this.whoCell(e.entry,t);const n=e.kind==="position"?"cb-pos":e.kind==="total"?"cb-total":e.kind==="points"?"cb-points":`cb-c cb-c--${e.cell?.status??"missing"}${e.divider?" cb-c--divider":""}`,i=e.kind==="round"?e.cell?.value===null||!e.cell?"—":String(e.cell.value):e.text;return this.wireEl(Hp,{cell:{className:()=>n},value:{textContent:()=>i,className:()=>e.kind==="round"&&e.cell?.status==="dropped"?"cb-struck":""}},t)}whoCell(e,t){const n=e.withdrawn?"WD":e.cutAfterRound!==null?`Cut R${e.cutAfterRound}`:"",i=Np(e),r=this.wireEl(Ap,{cell:{},name:()=>e.displayName,category:{textContent:()=>e.category??"",className:()=>e.category?"cb-tag cb-cat":"cb-tag cb-cat hidden"},status:{textContent:()=>n,className:()=>n?"cb-tag cb-tag--out":"cb-tag cb-tag--out hidden"},equals:{className:()=>i.length===0?"hidden":""},total:()=>e.total===null?"—":String(e.total)},t);return this.$each(r.querySelector('[bind="parts"]'),new $(()=>i),(l,d,c)=>this.wireEl(Mp,{separator:()=>d===0?"":" + ",value:{textContent:()=>l.text,className:()=>l.dropped?"cb-struck":""}},c),(l,d)=>d),r}}const jp=_(`
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
`);class Dp extends E{static styles=`
        .cd {
            padding: ${o("lg")} ${o("lg")} ${o("2xl")};
            & .hidden { display: none !important; }
            & .cd__muted-em { font-style: italic; }
            & .cb-struck { text-decoration: line-through; opacity: 0.8; }

            & .cd__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 700; color: ${a("accent")};
                cursor: pointer; padding: 0 0 ${o("md")};
            }
            & .cd__loading, & .cd__loaderr {
                color: ${a("text-muted")}; padding: ${o("lg")} 0;
                &.hidden { display: none; }
            }
            & .cd__loaderr { color: ${a("error")}; }
            & .cd__body.hidden { display: none; }

            & .cd__head { margin-bottom: ${o("md")}; }
            & .cd__titlerow { display: flex; align-items: center; gap: ${o("md")}; }
            & .cd__head h1 {
                margin: 0; font-family: ${a("font-display")}; font-weight: 600;
                font-size: 1.7rem; letter-spacing: -0.02em;
            }
            & .cd__owner { margin: ${o("xs")} 0 0; color: ${a("text-muted")}; font-size: 0.85rem; }

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
                margin: 0 0 ${o("md")}; font-size: 0.85rem; color: ${a("error")};
                &:empty { display: none; }
            }

            & .cd__transition {
                margin-bottom: ${o("lg")};
                &.hidden { display: none; }
                & button {
                    ${w()}
                    padding: ${o("md")} ${o("lg")}; font-family: inherit;
                    font-size: 0.95rem; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                    &:disabled { opacity: 0.5; }
                }
            }

            & .cd__section {
                margin-bottom: ${o("xl")};
                &.hidden { display: none; }
            }
            & .cd__section-head {
                display: flex; align-items: baseline; gap: ${o("sm")};
                margin-bottom: ${o("sm")};
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
                ${C()} padding: ${o("md")} ${o("lg")};
                font-size: 0.85rem; color: ${a("text-muted")}; line-height: 1.5;
                &.hidden { display: none; }
            }
            & .cd__empty { color: ${a("text-muted")}; font-size: 0.9rem; padding: ${o("sm")} 0;
                &.hidden { display: none; } &:empty { display: none; } }

            & .cd__form {
                ${C()} padding: ${o("lg")};
                display: flex; flex-direction: column; gap: ${o("md")};
                &.hidden { display: none; }
                & .cd__field { display: flex; flex-direction: column; gap: ${o("xs")};
                    & > span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                        letter-spacing: 0.05em; color: ${a("text-muted")}; }
                    & input, & select { ${X()} padding: ${o("sm")} ${o("md")}; font-size: 0.95rem; }
                }
                & .cd__aggdesc { margin: 0; font-size: 0.8rem; color: ${a("text-muted")}; &:empty { display: none; } }
                & .cd__aggfields { display: flex; flex-direction: column; gap: ${o("md")}; &:empty { display: none; } }
                & .cd__cutrow, & .cd__addrow { display: flex; gap: ${o("sm")}; }
                & .cd__cutrow input { width: 33%; }
                & .cd__addrow select { flex: 1; }
                & .cd__slots { display: flex; flex-direction: column; gap: ${o("xs")}; }
                & .cd__formactions { display: flex; align-items: center; gap: ${o("md")}; margin-top: ${o("sm")}; }
                & button[bind="addSlot"], & button[bind="saveSetup"] {
                    ${w()}
                    padding: ${o("sm")} ${o("md")}; font-family: inherit; font-weight: 700;
                    background: ${a("primary")}; color: ${a("primary-text")}; border: none;
                }
            }
            & .cd__slot {
                display: flex; align-items: center; justify-content: space-between;
                padding: ${o("xs")} ${o("sm")}; background: ${a("surface-sunken")};
                border-radius: ${a("radius-sm")}; font-size: 0.9rem; font-weight: 600;
                & button { background: none; border: none; color: ${a("error")}; cursor: pointer; font-size: 1.1rem; }
            }

            & .cd__roster { display: flex; flex-direction: column; gap: ${o("xs")}; margin-bottom: ${o("md")}; }
            & .cd__rosterrow {
                display: flex; align-items: center; gap: ${o("sm")};
                padding: ${o("sm")} ${o("md")}; ${C()}
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
                margin: ${o("md")} 0 ${o("xs")}; }
            & .cd__friendpick { display: flex; flex-wrap: wrap; gap: ${o("xs")}; }
            & .cd__friendchip {
                ${w()}
                padding: ${o("xs")} ${o("md")}; font-family: inherit;
                font-size: 0.85rem; font-weight: 600; cursor: pointer;
                &:disabled { opacity: 0.4; }
            }
            & .cd__guestrow, & .cd__addroundrow { display: flex; gap: ${o("sm")}; }
            & .cd__guestrow input, & .cd__addroundrow input, & .cd__addroundrow select {
                ${X()}
                padding: ${o("sm")} ${o("md")}; font-size: 0.9rem; min-width: 0; }
            & .cd__guestrow input[bind="guestName"] { flex: 1; }
            & .cd__guestrow input[bind="guestHcp"] { width: 4.5rem; }
            & .cd__guestrow select { width: 3.5rem; }
            & .cd__addroundrow select { flex: 1; }
            & .cd__guestrow button, & .cd__addroundrow button {
                ${w()}
                padding: ${o("sm")} ${o("md")}; font-family: inherit; font-weight: 700;
                background: ${a("primary")}; color: ${a("primary-text")}; border: none; }

            & .cd__rounds { display: flex; flex-direction: column; gap: ${o("xs")}; }
            & .cd__roundrow {
                display: flex; align-items: center; gap: ${o("md")};
                padding: ${o("md")} ${o("lg")}; ${C({hover:!0})}
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
            & .cd__adminbtns { display: flex; gap: ${o("md")}; }
            & .cd__adminbtns button {
                ${w()}
                padding: ${o("md")} ${o("lg")}; font-family: inherit; font-weight: 700;
            }
            & .cd__cutbtn { background: ${a("accent-soft")}; color: ${a("accent")}; border-color: ${a("accent")}; }
            & .cd__finalbtn { background: ${a("error")}; color: #fff; border: none; }
            & .cd__adminnote { margin: ${o("sm")} 0 0; font-size: 0.8rem; color: ${a("text-muted")}; }
            & .cd__cutoutcome { &:empty { display: none; } margin-bottom: ${o("md")}; font-size: 0.85rem;
                ${C()} padding: ${o("md")} ${o("lg")}; }
            & .cd__cutoutcome .cd__cutgrp { margin-bottom: ${o("xs")}; }
            & .cd__cutoutcome strong { color: ${a("text")}; }

            & .cd__setswitch { display: flex; gap: ${o("xs")}; margin-bottom: ${o("sm")};
                &:empty { display: none; }
                & button {
                    ${w()}
                    padding: ${o("xs")} ${o("md")}; font-family: inherit;
                    font-size: 0.85rem; font-weight: 700; cursor: pointer;
                    &.on { background: ${a("primary")}; color: ${a("primary-text")}; border-color: ${a("primary")}; }
                }
            }

            /* --- aggregated / official board --- */
            & .cd__board { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            & .cd__official-banner {
                ${C()} padding: ${o("sm")} ${o("lg")}; margin-bottom: ${o("sm")};
                background: ${a("accent-soft")}; color: ${a("accent")};
                font-weight: 700; font-size: 0.85rem;
                border-color: ${a("accent")};
            }
            & .cb-head { display: flex; align-items: baseline; gap: ${o("sm")}; margin-bottom: ${o("sm")}; }
            & .cb-head__title { margin: 0; font-family: ${a("font-display")}; font-weight: 600; font-size: 1rem; }
            & .cb-head__op, & .cb-head__hint { font-size: 0.75rem; color: ${a("text-muted")}; }
            & .cb-empty { color: ${a("text-muted")}; padding: ${o("md")} 0; }
            & table.cb {
                width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums;
            }
            & .cb.cb--official { box-shadow: inset 0 0 0 2px ${a("accent")}; border-radius: ${a("radius")}; }
            & .cb thead th {
                font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em;
                color: ${a("text-muted")}; font-weight: 700; padding: ${o("xs")} ${o("sm")};
                border-bottom: 1px solid ${a("border")}; text-align: center;
            }
            & .cb th.cb-who, & .cb td.cb-who { text-align: left; }
            & .cb tbody td { padding: ${o("sm")}; border-bottom: 1px solid ${a("border")};
                text-align: center; font-size: 0.9rem; }
            & .cb .cb-pos { width: 2rem; color: ${a("text-muted")}; font-weight: 700; }
            & .cb .cb-who { min-width: 0; }
            & .cb .cb-who__line { display: flex; align-items: baseline; gap: ${o("xs")}; min-width: 0; }
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
    `;competitions=this.inject(ve);state=this.inject(et);router=this.inject(M);render(){const e=()=>this.competitions.detail.get();this.track(I(()=>{const n=this.state.id.get();n&&U(()=>{this.state.enter(),this.competitions.loadDetail(n)})})),this.state.initialize();const t=this.wire(jp,{back:{onclick:()=>this.router.navigate("/competitions")},loading:{className:()=>this.competitions.detailLoading.get()&&e()===null?"cd__loading":"cd__loading hidden"},loadErr:{textContent:()=>this.competitions.detailError.get()?.message??"",className:()=>this.competitions.detailError.get()?"cd__loaderr":"cd__loaderr hidden"},body:{className:()=>e()?"cd__body":"cd__body hidden"},name:()=>e()?.name??"",chip:{textContent:()=>Vi(this.state.lifecycle.get()),className:()=>Ui(this.state.lifecycle.get())},ownerLine:{textContent:()=>this.state.admin.get()?"You administer this competition.":"Read-only view."},mutateErr:{textContent:()=>this.competitions.mutateError.get()??""},transitionRow:{className:()=>this.state.admin.get()&&Wt(this.state.lifecycle.get())?"cd__transition":"cd__transition hidden"},transitionBtn:{textContent:()=>Wt(this.state.lifecycle.get())?.label??"",disabled:()=>this.competitions.mutating.get(),onclick:()=>{const n=Wt(this.state.lifecycle.get()),i=this.state.id.get();n&&i&&this.competitions.transition(i,n.to)}}});return this.spawn(vp,this.ref(t,"setup")),this.spawn(kp,this.ref(t,"roster")),this.spawn(Cp,this.ref(t,"rounds")),this.spawn(Fp,this.ref(t,"results")),t}}const Bp=_(`
    <div class="app-shell">
        <header bind="header" class="app-shell__header">
            <div bind="account"></div>
        </header>
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class Gp extends E{static styles=`
        .app-shell {
            display: grid;
            grid-template-rows: auto 1fr auto;
            height: 100vh;
            height: 100dvh;
            max-width: 560px;
            margin: 0 auto;
            background: ${a("bg")};

            /* The account slot. Its popover is absolutely positioned inside the
               menu component, so the header must not clip or under-stack it. */
            & .app-shell__header {
                grid-row: 1;
                position: relative;
                z-index: 20;
                display: flex;
                justify-content: flex-end;
                padding: ${o("md")} ${o("lg")} 0;

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
    `;router=this.inject(M);render(){const e=this.wire(Bp,{header:{className:()=>Vn(this.router.route.get())?"app-shell__header":"app-shell__header hidden"}});return this.spawn(ja,this.ref(e,"account")),this.spawn(yo,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":Us,"/history":tl,"/round":Ru,"/create":ih,"/login":ch,"/friends":fh,"/friend":gh,"/friend-rounds":_h,"/friend-courses":wh,"/spectate":Th,"/profile":Nh,"/stats":Vh,"/round-stats":ep,"/admin":lp,...qn.competitions?{"/competitions":pp,"/competition":Dp}:{}},Us),e}}class qp extends j{async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await ji(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await rh()),this.error.set(null)}catch(e){e instanceof K&&e.status===401?this.error.set(null):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await oh(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof K&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logoutEverywhere(){this.loading.set(!0);try{const e=await ah();return this.currentUser.set(null),this.error.set(null),e.revoked}catch(e){return e instanceof K&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"}),null}finally{this.loading.set(!1)}}}G.get(ur);const In=G.get(M);G.set(j,new qp);const Pn=G.get(j);await mr(Gp,"#app",{hot:void 0,onInit:async()=>{await Pn.load(),Pn.currentUser.get()&&In.route.get()==="/login"&&In.navigate("/",!0)}});export{Yt as A,E as C,M as R,p as S,ur as T,y as a,qe as b,$ as c,sr as d,I as e,tr as n,A as r,_ as t};
