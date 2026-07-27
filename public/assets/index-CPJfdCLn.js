(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();const gs="modulepreload",bs=function(r){return"/tapscore/"+r},et={},ys=function(e,t,s){let n=Promise.resolve();if(t&&t.length>0){let c=function(u){return Promise.all(u.map(f=>Promise.resolve(f).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),d=l?.nonce||l?.getAttribute("nonce");n=c(t.map(u=>{if(u=bs(u),u in et)return;et[u]=!0;const f=u.endsWith(".css"),m=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${m}`))return;const h=document.createElement("link");if(h.rel=f?"stylesheet":gs,f||(h.as="script"),h.crossOrigin="",h.href=u,d&&h.setAttribute("nonce",d),document.head.appendChild(h),f)return new Promise((v,b)=>{h.addEventListener("load",v),h.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${u}`)))})}))}function i(l){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=l,window.dispatchEvent(d),!d.defaultPrevented)throw l}return n.then(l=>{for(const d of l||[])d.status==="rejected"&&i(d.reason);return e().catch(i)})},zt="/tapscore/".replace(/\/+$/,""),De=zt+"/api",Ce={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},_s=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function tt(r,e){const t={};for(const[s,n]of _s)if(s in r)for(const i of n)i in r||(t[i]=`var(--${s})`);return{...e,...t,...r}}const Ot=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],vs={thin:"1px",medium:"3px",thick:"5px"};function jt(r){const e=r.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":vs[e.toLowerCase()]??e}function ws(){return Ot.map(r=>{const e=jt(Ce[r]);return`@property --${r}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const Rt={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Lt={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},xs={...Lt,"done-opacity":"0.35"},$s={...Rt,...Lt,...Ce,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},ks={...Rt,...xs,...Ce,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class Ss{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;Dt(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.disposed||s.run()}}}const Y=new Ss;function Dt(r){for(const e of r.deps)e.delete(r);r.deps.clear()}class p{constructor(e){this.subs=new Set,this.val=e}get(){return Y.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,Y.notify(this.subs))}update(e){this.set(e(this.val))}}class k{constructor(e){this.subs=new Set,this.val=void 0;const t=this,s={run(){Y.runTracked(s,()=>{const n=e();Object.is(t.val,n)||(t.val=n,Y.notify(t.subs))})},deps:new Set};s.run()}get(){return Y.subscribe(this.subs),this.val}peek(){return this.val}}function N(r){const e={run(){Y.runTracked(e,r)},deps:new Set};return e.run(),()=>{e.disposed=!0,Dt(e)}}function ue(r){Y.batch(r)}function B(r){return Y.untrack(r)}class Cs{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const D=new Cs,ae=zt;function Ae(r){return ae?r===ae?"/":r.startsWith(ae+"/")?r.slice(ae.length):r:r}function Ts(r){return ae+r}class R{constructor(){this.route=new p(Ae(location.pathname??"/")),this.search=new p(location.search??""),window.addEventListener("popstate",()=>ue(()=>{this.route.set(Ae(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},n=e.indexOf("#"),i=n>=0?e.slice(n):"",l=n>=0?e.slice(0,n):e,d=l.indexOf("?"),c=d>=0?l.slice(0,d):l,u=d>=0?l.slice(d+1):"",f=s.query!==void 0?Is(s.query):u?"?"+u:"",m=Ts(c)+f+i;(s.replace?history.replaceState:history.pushState).call(history,null,"",m),ue(()=>{this.route.set(c),this.search.set(f)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:n=>{n.preventDefault(),this.navigate(e)},className:()=>{const n=this.route.get();return n===s||n.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new k(()=>{const s=this.route.get().split("/"),n={};for(const[i,l]of t.entries())l.startsWith(":")&&(n[l.slice(1)]=s[i]??"");return n})}query(e){return new k(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new k(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function Is(r){const e=new URLSearchParams;for(const[s,n]of Object.entries(r))n==null||n===""||e.set(s,String(n));const t=e.toString();return t?"?"+t:""}function Es(r){return e=>r[e]}const Ns="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",st="data-basics-global";function Ps(){if(document.head.querySelector(`style[${st}]`))return;const r=document.createElement("style");r.setAttribute(st,""),r.textContent=ws()+Ns,document.head.appendChild(r)}function zs(r,e){Ps();const t=new Set(Ot),s=(i,l,d)=>{const c=Object.entries(i).map(([u,f])=>`--${u}:${t.has(u)?jt(f):f}`).join(";");return`${l}{color-scheme:${d};${c}}`},n=document.createElement("style");return n.textContent=s(r,'[data-theme="light"]',"light")+s(e,'[data-theme="dark"]',"dark"),document.head.appendChild(n),i=>`var(--${i})`}const nt="basics-js-theme";class Os{constructor(){this.dark=new p(!1);const e=localStorage.getItem(nt),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),N(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(nt,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function y(r){const e=document.createElement("template");return e.innerHTML=r,e}function js(r,e){let t;for(const s of Object.keys(e))r.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const it=new Set;class P{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!it.has(t)){it.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return D.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const n=B(()=>{const i=new e(s[0]);return i.mount(t),i});return this.children.push(n),n}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){B(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,s){const n=s??(l=>this.track(l)),i=e.content.cloneNode(!0);for(const l of i.querySelectorAll("[bind]")){const d=t[l.getAttribute("bind")];if(d)if(typeof d=="function")n(N(()=>{const c=d();l instanceof HTMLInputElement||l instanceof HTMLTextAreaElement?l.value=String(c):l.textContent=String(c)}));else for(const[c,u]of Object.entries(d)){const f=c.includes("-");c.startsWith("on")&&typeof u=="function"?l.addEventListener(c.slice(2),u):typeof u=="function"?n(N(()=>{const m=u();f?l.setAttribute(c,String(m)):l[c]=m})):f?l.setAttribute(c,String(u)):l[c]=u}}return i}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const n=this.ref(t,e);return n?(typeof s=="string"?n.textContent=s:typeof s=="function"&&s.prototype instanceof P?this.spawn(s,n):typeof s=="function"&&s(n,{spawn:(i,l,...d)=>this.spawn(i,l,...d),track:i=>this.track(i)}),!0):!1}$each(e,t,s,n=(i,l)=>l){const i=typeof t=="function"?t:()=>t.get(),l=new Map,d=new Map;this.track(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),this.track(N(()=>{const c=i(),u=new Map;for(const[m,h]of c.entries()){const v=n(h,m);if(l.has(v))u.set(v,l.get(v));else{const b=[];u.set(v,B(()=>s(h,m,I=>b.push(I)))),d.set(v,b)}}for(const[m,h]of l)u.has(m)||(h.remove(),B(()=>d.get(m)?.forEach(v=>v())),d.delete(m));let f=e.firstChild;for(const m of u.values())m===f?f=f.nextSibling:e.insertBefore(m,f);l.clear();for(const[m,h]of u)l.set(m,h)}))}$condition(e,t,s,n){let i=null;this.track(N(()=>{i&&(i.remove(),i=null);const l=t.get();i=B(()=>l?s():n?.()??null),i&&e.appendChild(i)}))}$swap(e,t,s,n){let i=null;this.track(N(()=>{if(i){const c=i;i=null,B(()=>c.destroy())}e.textContent="";const l=t.get(),d=s[l]??js(l,s)??n;d&&(i=B(()=>{const c=new d;return c.mount(e),c}))})),this.track(()=>i?.destroy())}}const Se=new Set;function Rs(r){return Se.add(r),()=>Se.delete(r)}function Ls(){for(const r of Array.from(Se)){Se.delete(r);try{r()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function Ds(r,e,t){const s=document.querySelector(e);s.textContent="";const n=D.get(R);let i=null,l=!1,d=null,c=!!t?.hot?.data.hmr;const u=async f=>{i&&(i.destroy(),i=null,s.textContent=""),f?(d||(d=(await ys(()=>import("./obs-shell.component-Cbvov4yw.js"),[])).ObsShellComponent),i=B(()=>new d)):(!c&&t?.onInit&&(await t.onInit(),c=!0),i=B(()=>new r)),B(()=>i.mount(s)),l=f};await u(Ae(location.pathname).startsWith("/_obs")),N(()=>{const f=n.route.get().startsWith("/_obs");f!==l&&u(f)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{i?.destroy()}catch(f){console.error("[startApp] the root component threw while disposing",f)}if(i=null,Ls(),t.onDispose)try{t.onDispose()}catch(f){console.error("[startApp] onDispose threw",f)}}),t.hot.accept())}class G extends Error{constructor(e,t,s,n){super(t),this.status=e,this.details=s,this.traceId=n,this.name="ApiError"}}const As=10,we=[];let xe=[],le=null;function Hs(r){we.push(r),we.length>As&&we.shift()}function At(r,e,t){const s={code:r,message:e,url:typeof location<"u"?location.href:"",context:[...we],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),xe.push(s),Ms()}function Ms(){le||(le=setTimeout(Ht,5e3))}function Ht(){if(le&&(clearTimeout(le),le=null),xe.length===0)return;const r=xe;xe=[];for(const e of r){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${De}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${De}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Ht()});const Fs=3e4,Bs=2,fe=new Map,Mt=new WeakMap;function Gs(r){if(r instanceof G)return r.traceId;if(r!=null&&typeof r=="object")return Mt.get(r)}async function g(r){if(r.method==="GET"){const e=fe.get(r.url);if(e)return e;const t=rt(r,Bs);return fe.set(r.url,t),t.then(()=>fe.delete(r.url),()=>fe.delete(r.url)),t}return rt(r,0)}async function rt(r,e){const t=r.timeout??Fs;let s;for(let n=0;n<=e;n++){const i=crypto.randomUUID();try{return await Ks(qs(r,i),t)}catch(l){if(s=l,!(l instanceof G)&&l!=null&&typeof l=="object"&&Mt.set(l,i),l instanceof G||n===e)break;await new Promise(d=>setTimeout(d,1e3*2**n))}}throw s}async function qs(r,e){const t={"X-Trace-Id":e},s={method:r.method,headers:t};r.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(r.body));const n=await fetch(r.url,s),i=n.headers.get("x-trace-id")??e;if(Hs({type:"api",detail:`${r.method} ${r.url}`,timestamp:new Date().toISOString()}),!n.ok){const l=await n.json().catch(()=>({error:n.statusText}));throw new G(n.status,l.error??n.statusText,l.details,i)}return n.json()}function Ks(r,e){let t;const s=new Promise((n,i)=>{t=setTimeout(()=>i(new Error("Request timeout")),e)});return Promise.race([r,s]).finally(()=>clearTimeout(t))}const He=new Set;let Pe=!1;function Vs(r){return He.add(r),()=>{He.delete(r)}}function Us(){if(!Pe){Pe=!0;try{for(const r of[...He])try{r()}catch(e){try{At("session-listener",Ws(e))}catch{}}}finally{Pe=!1}}}function Ws(r){try{if(r instanceof Error){const e=r.message;if(typeof e=="string")return e}return String(r)}catch{return"listener threw a value that could not be described"}}async function j(r,e,t,s={}){ue(()=>{r.set(!0),e.set(null)});try{const n=await t();return r.set(!1),n}catch(n){const i=Ys(n);ue(()=>{r.set(!1),e.set(i)}),At(i.code,i.message,Gs(n)),i.code==="auth"&&s.sessionExpiry!==!1&&Us();return}}function Ys(r){return r instanceof G?r.status===401?{code:"auth",message:"Unauthorized"}:r.status===409?{code:"conflict",message:"Data has changed — please try again"}:r.status===400?{code:"validation",message:r.message}:r.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:r instanceof Error?r.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const ot={sessionExpiry:!1};function Qs(r){return{me:()=>g({method:"GET",url:`${r}/auth/me`}),login:e=>g({method:"POST",url:`${r}/auth/login`,body:e}),logout:()=>g({method:"POST",url:`${r}/auth/logout`,body:{}})}}class A{constructor(){this.api=Qs(De),this.currentUser=new p(null),this.loading=new p(!1),this.error=new p(null),this.offSessionExpired=Vs(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=Rs(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await j(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await j(this.loading,this.error,()=>this.api.login({username:e,password:t}),ot);return s?(this.currentUser.set(s),!0):!1}async logout(){await j(this.loading,this.error,()=>this.api.logout(),ot);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const at={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},o=zs(tt({...at,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},$s),tt({...at,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"},ks)),T=r=>`var(--${r})`,x=(r,e)=>`var(--${r}, ${e})`,$=r=>{const e=Ce[r];if(e===void 0)throw new Error(`unknown control token: --${r}`);return e},a=Es({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),ge=r=>`
    background: ${x(`btn-${r}-bg`,$(`btn-${r}-bg`))};
    color: ${x(`btn-${r}-fg`,$(`btn-${r}-fg`))};
    border-color: ${x(`btn-${r}-border`,$(`btn-${r}-border`))};
    box-shadow: ${x(`btn-${r}-shadow`,$(`btn-${r}-shadow`))};
    &:hover {
        background: ${x(`btn-${r}-bg-hover`,$(`btn-${r}-bg-hover`))};
        color: ${x(`btn-${r}-fg-hover`,$(`btn-${r}-fg-hover`))};
        border-color: ${x(`btn-${r}-border-hover`,$(`btn-${r}-border-hover`))};
    }`,Ft=`
    background: ${x("btn-disabled-bg",$("btn-disabled-bg"))};
    color: ${x("btn-disabled-fg",$("btn-disabled-fg"))};
    border-color: ${x("btn-disabled-border",$("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${x("btn-disabled-opacity",$("btn-disabled-opacity"))};
    cursor: not-allowed;`,Xs={primary:ge("primary"),secondary:ge("secondary"),ghost:ge("ghost"),danger:ge("danger"),disabled:Ft},S=(r=x("btn-radius",$("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${x("btn-border-width",$("btn-border-width"))} solid transparent;
    border-radius: ${r};
    padding: ${x("btn-padding-y",$("btn-padding-y"))} ${x("btn-padding-x",$("btn-padding-x"))};
    font-family: ${T("font-ui")};
    font-size: ${x("btn-font-size",$("btn-font-size"))};
    line-height: ${x("btn-line-height",$("btn-line-height"))};
    font-weight: ${x("btn-font-weight",$("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${T("dur-fast")} ${T("ease-standard")},
        border-color ${T("dur-fast")} ${T("ease-standard")},
        color ${T("dur-fast")} ${T("ease-standard")},
        box-shadow ${T("dur-fast")} ${T("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${x("btn-focus-ring-width",$("btn-focus-ring-width"))} ${x("btn-focus-ring",$("btn-focus-ring"))};
    }
    ${Xs[e]}
    &:disabled {${Ft}}
`,Js=`max(${x("field-border-width",$("field-border-width"))}, ${x("field-rule-width",$("field-rule-width"))})`,be=(r,e)=>`
    border-top-color: ${r};
    border-right-color: ${r};
    border-left-color: ${r};
    border-bottom-color: ${e};`,q=()=>`
    border-style: solid;
    border-top-width: ${x("field-border-width",$("field-border-width"))};
    border-right-width: ${x("field-border-width",$("field-border-width"))};
    border-left-width: ${x("field-border-width",$("field-border-width"))};
    border-bottom-width: ${Js};
    ${be(x("field-border",$("field-border")),x("field-rule",$("field-rule")))}
    border-radius: ${x("field-radius",$("field-radius"))};
    padding: ${x("field-padding-y",$("field-padding-y"))} ${x("field-padding-x",$("field-padding-x"))};
    background: ${x("field-bg",$("field-bg"))};
    color: ${T("text")};
    font-family: ${T("font-ui")};
    font-size: ${x("field-font-size",$("field-font-size"))};
    line-height: ${x("field-line-height",$("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${T("dur-fast")} ${T("ease-standard")},
        box-shadow ${T("dur-fast")} ${T("ease-standard")},
        background ${T("dur-fast")} ${T("ease-standard")};
    &::placeholder { color: ${T("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${be(x("field-focus-border",$("field-focus-border")),x("field-focus-border",$("field-focus-border")))}
        background: ${x("field-bg-focus",$("field-bg-focus"))};
        box-shadow: 0 0 0 ${x("field-focus-ring-width",$("field-focus-ring-width"))} ${x("field-focus-ring",$("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${be(x("field-invalid-border",$("field-invalid-border")),x("field-invalid-rule",$("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${be(x("field-invalid-border",$("field-invalid-border")),x("field-invalid-rule",$("field-invalid-rule")))}
        background: ${x("field-bg-focus",$("field-bg-focus"))};
        box-shadow: 0 0 0 ${x("field-focus-ring-width",$("field-focus-ring-width"))} ${x("field-invalid-ring",$("field-invalid-ring"))};
    }
`,Zs=()=>`
    display: block;
    font-family: ${T("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${T("text-muted")};
`,O=r=>`
    background: ${T("surface")};
    border: 1px solid ${T("border")};
    border-radius: ${T("radius-md")};
    box-shadow: ${T("shadow-1")};
    ${r?.hover?`
    transition:
        box-shadow ${T("dur-base")} ${T("ease-standard")},
        border-color ${T("dur-base")} ${T("ease-standard")};
    &:hover { box-shadow: ${T("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${Zs()}
        margin: 0 0 ${a("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${T("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${T("text")};
    }
    & .ui-card__meta {
        margin: ${a("xs")} 0 0 0;
        font-family: ${T("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${T("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${a("md")};
        font-family: ${T("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${T("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;function en(r){return{async me(){return g({method:"GET",url:`${r}/players/me`})},async register(e){return g({method:"POST",url:`${r}/players/register`,body:e})},async updateHandicap(e){return g({method:"POST",url:`${r}/players/me/handicap`,body:e})},async myHandicapHistory(){return g({method:"GET",url:`${r}/players/me/handicap-history`})},async updateProfile(e){return g({method:"POST",url:`${r}/players/me/profile`,body:e})},async search(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/players/search${s?"?"+s:""}`})}}}function tn(r){return{async list(){return g({method:"GET",url:`${r}/friends`})},async add(e){return g({method:"POST",url:`${r}/friends`,body:e})},async remove(e){return g({method:"DELETE",url:`${r}/friends/${e.friendId}`})}}}function sn(r){return{async list(){return g({method:"GET",url:`${r}/clubs`})},async get(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/clubs/get${s?"?"+s:""}`})},async create(e){return g({method:"POST",url:`${r}/clubs`,body:e})},async update(e){return g({method:"POST",url:`${r}/clubs/update`,body:e})},async remove(e){return g({method:"DELETE",url:`${r}/clubs/${e.id}`})}}}function nn(r){return{async list(){return g({method:"GET",url:`${r}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/courses/by-club${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/courses/get${s?"?"+s:""}`})},async create(e){return g({method:"POST",url:`${r}/courses`,body:e})},async update(e){return g({method:"POST",url:`${r}/courses/update`,body:e})},async updateHole(e){return g({method:"POST",url:`${r}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/courses/validate${s?"?"+s:""}`})},async remove(e){return g({method:"DELETE",url:`${r}/courses/${e.id}`})}}}function rn(r){return{async listByCourse(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/tees/by-course${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/tees/get${s?"?"+s:""}`})},async create(e){return g({method:"POST",url:`${r}/tees`,body:e})},async update(e){return g({method:"POST",url:`${r}/tees/update`,body:e})},async remove(e){return g({method:"DELETE",url:`${r}/tees/${e.id}`})}}}function on(r){return{async create(e){return g({method:"POST",url:`${r}/guest-players`,body:e})}}}function an(r){return{async latest(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/handicap/latest${s?"?"+s:""}`})},async history(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/handicap/history${s?"?"+s:""}`})},async record(e){return g({method:"POST",url:`${r}/handicap/record`,body:e})}}}function ln(r){return{async list(){return g({method:"GET",url:`${r}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/rounds/balls${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/rounds/get${s?"?"+s:""}`})},async create(e){return g({method:"POST",url:`${r}/rounds`,body:e})},async createFromDraft(e){return g({method:"POST",url:`${r}/rounds/from-draft`,body:e})},async update(e){return g({method:"POST",url:`${r}/rounds/update`,body:e})},async remove(e){return g({method:"DELETE",url:`${r}/rounds/${e.id}`})}}}function dn(r){return{async listByRound(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/score-events/by-round${s?"?"+s:""}`})},async append(e){return g({method:"POST",url:`${r}/score-events`,body:e})}}}function cn(r){return{async forBall(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/scorecards/for-ball${s?"?"+s:""}`})},async forRound(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/scorecards/for-round${s?"?"+s:""}`})}}}function un(r){return{async forRound(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/leaderboards/for-round${s?"?"+s:""}`})}}}function hn(r){return{async create(e){return g({method:"POST",url:`${r}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/friendly-rounds/by-token${s?"?"+s:""}`})},async balls(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/friendly-rounds/balls${s?"?"+s:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/friendly-rounds/scorecard${s?"?"+s:""}`})},async result(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/friendly-rounds/result${s?"?"+s:""}`})},async score(e){return g({method:"POST",url:`${r}/friendly-rounds/score`,body:e})},async setup(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/friendly-rounds/setup${s?"?"+s:""}`})},async editSetup(e){return g({method:"POST",url:`${r}/friendly-rounds/setup`,body:e})},async remove(e){return g({method:"DELETE",url:`${r}/friendly-rounds/${e.token}`})},async finish(e){return g({method:"POST",url:`${r}/friendly-rounds/finish`,body:e})},async reopen(e){return g({method:"POST",url:`${r}/friendly-rounds/reopen`,body:e})},async join(e){return g({method:"POST",url:`${r}/friendly-rounds/join`,body:e})},async leave(e){return g({method:"POST",url:`${r}/friendly-rounds/leave`,body:e})},async claimGuest(e){return g({method:"POST",url:`${r}/friendly-rounds/claim-guest`,body:e})},async claimSeat(e){return g({method:"POST",url:`${r}/friendly-rounds/claim-seat`,body:e})},async releaseSeat(e){return g({method:"POST",url:`${r}/friendly-rounds/release-seat`,body:e})}}}function pn(r){return{async myRounds(){return g({method:"GET",url:`${r}/dashboard/my-rounds`})}}}function mn(r){return{async clubs(){return g({method:"GET",url:`${r}/setup/clubs`})},async courses(){return g({method:"GET",url:`${r}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/setup/tees/by-course${s?"?"+s:""}`})},async formats(){return g({method:"GET",url:`${r}/setup/formats`})},async aggregations(){return g({method:"GET",url:`${r}/setup/aggregations`})}}}function fn(r){return{async get(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/competitions/get${s?"?"+s:""}`})},async participants(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/competitions/participants${s?"?"+s:""}`})},async leaderboard(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[i,l]of Object.entries(e))!t.has(i)&&l!==void 0&&s.set(i,String(l));const n=s.toString();return g({method:"GET",url:`${r}/competitions/${e.id}/leaderboard${n?"?"+n:""}`})},async results(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[i,l]of Object.entries(e))!t.has(i)&&l!==void 0&&s.set(i,String(l));const n=s.toString();return g({method:"GET",url:`${r}/competitions/${e.id}/results${n?"?"+n:""}`})},async list(){return g({method:"GET",url:`${r}/competitions`})},async create(e){return g({method:"POST",url:`${r}/competitions`,body:e})},async update(e){return g({method:"POST",url:`${r}/competitions/update`,body:e})},async transition(e){return g({method:"POST",url:`${r}/competitions/transition`,body:e})},async createRound(e){const t=new Set(["id"]),s={};for(const[n,i]of Object.entries(e))t.has(n)||(s[n]=i);return g({method:"POST",url:`${r}/competitions/${e.id}/rounds`,body:s})},async applyCut(e){const t=new Set(["id"]),s={};for(const[n,i]of Object.entries(e))t.has(n)||(s[n]=i);return g({method:"POST",url:`${r}/competitions/${e.id}/cut`,body:s})},async finalize(e){const t=new Set(["id"]),s={};for(const[n,i]of Object.entries(e))t.has(n)||(s[n]=i);return g({method:"POST",url:`${r}/competitions/${e.id}/finalize`,body:s})},async addParticipant(e){return g({method:"POST",url:`${r}/competitions/participants/add`,body:e})},async removeParticipant(e){return g({method:"POST",url:`${r}/competitions/participants/remove`,body:e})},async withdrawParticipant(e){return g({method:"POST",url:`${r}/competitions/participants/withdraw`,body:e})}}}function gn(r){return{async myRoles(){return g({method:"GET",url:`${r}/me/roles`})},async adminStats(){return g({method:"GET",url:`${r}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[n,i]of Object.entries(e))i!==void 0&&t.set(n,String(i));const s=t.toString();return g({method:"GET",url:`${r}/admin/rounds${s?"?"+s:""}`})},async adminPlayers(){return g({method:"GET",url:`${r}/admin/players`})},async adminGrantRole(e){return g({method:"POST",url:`${r}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return g({method:"POST",url:`${r}/admin/roles/revoke`,body:e})}}}const L="/tapscore/".replace(/\/+$/,"")+"/api",_={players:en(L),friends:tn(L),clubs:sn(L),courses:nn(L),tees:rn(L),guestPlayers:on(L),handicap:an(L),rounds:ln(L),scoreEvents:dn(L),scorecards:cn(L),leaderboards:un(L),friendlyRounds:hn(L),dashboard:pn(L),setup:mn(L),competitions:fn(L),admin:gn(L)};function bn(r){return[...r.played?["Played"]:[],...r.created?["Created"]:[]].join(" · ")}function yn(r,e){const t=new Map;for(const s of e)t.set(s.round.id,{round:s.round,token:s.friendlyRound.shareToken,played:!1,created:!0});for(const s of r){const n=t.get(s.round.id);n?n.played=!0:t.set(s.round.id,{round:s.round,token:s.shareToken,played:!0,created:!1})}return[...t.values()].sort((s,n)=>n.round.date.localeCompare(s.round.date)||s.round.id.localeCompare(n.round.id))}function _n(r,e){return r.filter(t=>t.played&&!t.created&&!e.has(t.round.id)).slice().sort((t,s)=>s.round.date.localeCompare(t.round.date)||t.round.id.localeCompare(s.round.id))}function lt(r,e){return r.some(t=>t.round.id===e)?r.filter(t=>t.round.id!==e):r}const Bt="tapscore.seen-rounds.v1",vn=500;function Te(){try{return typeof localStorage<"u"?localStorage:null}catch{return null}}function Ge(r=Te()){if(!r)return[];let e;try{e=r.getItem(Bt)}catch{return[]}if(!e)return[];try{const t=JSON.parse(e);return Array.isArray(t)?t.filter(s=>typeof s=="string"):[]}catch{return[]}}function dt(r=Te()){return new Set(Ge(r))}function Gt(r,e){try{r.setItem(Bt,JSON.stringify(e))}catch{}}function wn(r,e=Te()){if(!e)return[];const t=Ge(e).filter(n=>n!==r),s=[r,...t].slice(0,vn);return Gt(e,s),s}function qt(r,e=Te()){if(!e)return[];const t=Ge(e),s=t.filter(n=>n!==r);return s.length!==t.length&&Gt(e,s),s}const Kt="tapscore.device-rounds.v1",xn=50;function qe(){try{return typeof localStorage<"u"?localStorage:null}catch{return null}}function Ke(r=qe()){if(!r)return[];let e;try{e=r.getItem(Kt)}catch{return[]}if(!e)return[];try{const t=JSON.parse(e);return Array.isArray(t)?t.filter($n):[]}catch{return[]}}function $n(r){if(typeof r!="object"||r===null)return!1;const e=r;return typeof e.token=="string"&&typeof e.courseName=="string"&&(e.status==="not_started"||e.status==="active"||e.status==="complete")&&typeof e.lastSeenAt=="string"}function Vt(r,e){try{r.setItem(Kt,JSON.stringify(e))}catch{}}function $e(r,e=qe()){if(!e)return[];const t=Ke(e).filter(n=>n.token!==r.token),s=[r,...t].slice(0,xn);return Vt(e,s),s}function Ut(r,e=qe()){if(!e)return[];const t=Ke(e),s=t.filter(n=>n.token!==r);return s.length!==t.length&&Vt(e,s),s}class Ve{mine=new p(null);mineLoading=new p(!1);mineError=new p(null);myRounds=new k(()=>{const e=this.mine.get();return e?yn(e.produced,e.created):[]});deviceRounds=new p([]);seenIds=new p(dt());newRounds=new k(()=>_n(this.myRounds.get(),this.seenIds.get()));async loadMine(){this.seenIds.set(dt());const e=await j(this.mineLoading,this.mineError,()=>_.dashboard.myRounds());e&&this.mine.set(e)}loadDevice(){this.deviceRounds.set(Ke())}async remove(e,t){try{await _.friendlyRounds.remove({token:e})}catch{return!1}const s=this.mine.get();return s&&this.mine.set({produced:lt(s.produced,t),created:lt(s.created,t)}),this.deviceRounds.set(Ut(e)),qt(t),!0}}const kn={DEV:!1};function Sn(r,e){return r===void 0||r===""?e:r!=="0"&&r.toLowerCase()!=="false"}const ct=kn??{},Wt={competitions:Sn(ct.VITE_FEATURE_COMPETITIONS,!!ct.DEV)},Cn=y(`
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
`);class Tn extends P{static styles=`
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
    `;router=this.inject(R);auth=this.inject(A);landing=this.inject(Ve);newCount=new k(()=>this.auth.currentUser.get()?this.landing.newRounds.get().length:0);render(){const e=this.wire(Cn,{root:{className:()=>{const t=this.router.route.get();return!this.auth.currentUser.get()||t==="/login"||t==="/round"?"tabbar hidden":"tabbar"}},homeLink:this.router.link("/"),badge:{textContent:()=>{const t=this.newCount.get();return t===0?"":String(t)},className:()=>this.newCount.get()===0?"tabbar__badge":"tabbar__badge show"},friendsLink:this.router.link("/friends"),compsLink:this.router.link("/competitions"),profileLink:this.router.link("/profile")});return Wt.competitions||this.ref(e,"compsLink").remove(),e}}const Xe=class Xe extends P{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(N(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};Xe.styles=`
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
    `;let Me=Xe;const C=r=>`var(--${r})`,Je=class Je extends P{render(){const e=document.createElement("div"),t=(c,u)=>{typeof u=="function"?this.track(N(()=>{c.textContent=u()})):c.textContent=u};this.spawn(Me,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const s=document.createElement("h2");s.className="ui-confirm__title",t(s,this.props.title??"Confirm"),this.dialogEl.appendChild(s);const n=document.createElement("p");n.className="ui-confirm__message",t(n,this.props.message),this.dialogEl.appendChild(n);const i=document.createElement("div");i.className="ui-confirm__actions";const l=document.createElement("button");l.className="ui-confirm__btn ui-confirm__btn--cancel",t(l,this.props.cancelLabel??"Cancel"),l.addEventListener("click",c=>{c.stopPropagation(),this.handleCancel()}),i.appendChild(l);const d=document.createElement("button");return d.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(d,this.props.confirmLabel??"Confirm"),d.addEventListener("click",c=>{c.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),i.appendChild(d),this.dialogEl.appendChild(i),this.dialogEl.addEventListener("click",c=>c.stopPropagation()),e.appendChild(this.dialogEl),this.track(N(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};Je.styles=`
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
    `;let V=Je;class Ue{roles=new p([]);rolesLoaded=!1;loading=new p(!1);error=new p(null);stats=new p(null);rounds=new p([]);players=new p([]);isSuperAdmin(){return this.roles.get().some(e=>e.role==="super_admin"&&e.scopeType===null)}async loadRoles(e=!1){if(!(!e&&this.rolesLoaded)){this.rolesLoaded=!0;try{this.roles.set(await _.admin.myRoles())}catch{this.roles.set([])}}}clear(){this.roles.set([]),this.rolesLoaded=!1,this.stats.set(null),this.rounds.set([]),this.players.set([]),this.error.set(null)}async load(e=!1){if(!e&&this.stats.get()!==null)return;const t=await j(this.loading,this.error,()=>Promise.all([_.admin.adminStats(),_.admin.adminRounds({limit:100}),_.admin.adminPlayers()]));if(!t)return;const[s,n,i]=t;this.stats.set(s),this.rounds.set(n),this.players.set(i)}}function In(r){const e=typeof navigator<"u"?navigator.language:void 0;return typeof e=="string"&&e.toLowerCase().startsWith("sv")?"sv":"en"}function ie(){return In()}const ke=10;class he{loading=new p(!1);error=new p(null);descriptors=new p([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await j(this.loading,this.error,()=>_.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=ie()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:s.teamSize?.min??2,max:s.teamSize?.max??2},...s.teamCount?{teamCount:s.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}configLabelOf(e,t=ie()){return e.labels?.[t]??e.labels?.en??""}presets(e=ie()){return this.descriptors.get().filter(s=>s.preset).sort((s,n)=>{const i=s.preset?.rank??Number.POSITIVE_INFINITY,l=n.preset?.rank??Number.POSITIVE_INFINITY;return i!==l?i-l:(this.labelOf(s,e)??s.id).localeCompare(this.labelOf(n,e)??n.id)})}taglineOf(e,t=ie()){const n=(typeof e=="string"?this.byId(e):e)?.preset?.tagline;return n?.[t]??n?.en??""}playableShape(e){const t=e.requirements.balls;if(t.ballMode==="team")return{count:this.ballCountOf(t.slotBallCount),size:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const s=t.slotTeamGrouping??{},n=s.teamCount??{};return{count:{min:n.min??2,...n.max!==void 0?{max:n.max}:{}},size:{min:s.teamSize?.min??2,max:s.teamSize?.max??2}}}if(t.slotBallCount){const s=this.acceptsSideSubjects(e);return{count:this.ballCountOf(t.slotBallCount),size:{min:1,max:s?ke:1}}}return{count:{min:1},size:{min:1,max:1}}}ballCountOf(e){return{min:e?.min??2,...e?.max!==void 0?{max:e.max}:{}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}acceptsSideSubjects(e){const t=typeof e=="string"?this.byId(e):e;return!t||this.classify(t).kind==="team_grouping"?!1:(t.requirements.scoreEntry?.metadata?.length??0)===0}}function Yt(r){const e=D.get(he);return e.load(),e.labelOf(r.formatId)??`${r.scoringMode} · ${r.teamShape}`}function En(r){return r.map(e=>({key:e.round.id,token:e.token,roundId:e.round.id,courseName:e.round.courseNameSnapshot??"",status:e.round.status,completedAt:e.round.completedAt,lastActivityAt:e.round.date,roleLabel:bn(e)||null,date:e.round.date,formats:e.round.formatSlots.map(Yt).join(" · ")}))}function Nn(r){return r.map(e=>({key:e.token,token:e.token,roundId:null,courseName:e.courseName,status:e.status,completedAt:e.completedAt??null,lastActivityAt:e.lastSeenAt,roleLabel:null,date:null,formats:null}))}const de={fromMyRounds:En,fromDeviceRounds:Nn},Pn=14,zn=1440*60*1e3;function oe(r,e){return e(r)}function On(r,e,t,s=Pn){const n=e-s*zn,i=[],l=[];for(const d of r){const c=oe(d,t);if(c.status==="complete"){const u=c.completedAt?Date.parse(c.completedAt):NaN;(Number.isNaN(u)||u>=n)&&l.push(d)}else i.push(d)}return i.sort((d,c)=>ut(oe(d,t).lastActivityAt,oe(c,t).lastActivityAt)),l.sort((d,c)=>ut(oe(d,t).completedAt,oe(c,t).completedAt)),{ongoing:i,finished:l}}function ut(r,e){const t=r?Date.parse(r):NaN,s=e?Date.parse(e):NaN,n=Number.isNaN(t)?Number.NEGATIVE_INFINITY:t,i=Number.isNaN(s)?Number.NEGATIVE_INFINITY:s;return n===i?0:i-n}const jn=y(`
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
`),Rn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',Ln=y(`
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
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${Rn}</button>
    </div>
`),Qt={not_started:"Not started",active:"Live",complete:"Finished"};class ht extends P{static styles=`
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
                ${S()}
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
                ${O({hover:!0})}

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

            /* Operator shortcut, super admins only. Sits under "See all rounds"
               as its cross-player counterpart; the gate is the server. */
            & .landing__admin {
                display: block;
                margin: ${a("xs")} auto 0;
                padding: ${a("sm")} ${a("lg")};
                background: none;
                border: none;
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 700;
                color: ${o("text-muted")};
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
    `;svc=this.inject(Ve);auth=this.inject(A);admins=this.inject(Ue);router=this.inject(R);loggedIn=new k(()=>this.auth.currentUser.get()!==null);rows=new k(()=>this.loggedIn.get()?de.fromMyRounds(this.svc.myRounds.get()):de.fromDeviceRounds(this.svc.deviceRounds.get()));parts=new k(()=>On(this.rows.get(),Date.now(),e=>e));ongoing=new k(()=>this.parts.get().ongoing);finished=new k(()=>this.parts.get().finished);newRows=new k(()=>this.loggedIn.get()?de.fromMyRounds(this.svc.newRounds.get()):[]);deleteOpen=new p(!1);deleteTarget=new p(null);askDelete(e,t,s){this.deleteTarget.set({token:e,roundId:t,name:s}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?(this.svc.loadMine(),this.admins.loadRoles()):this.svc.loadDevice();const e=()=>this.rows.get().length>0,t=this.wire(jn,{createBtn:{onclick:()=>this.router.navigate("/create")},signin:{className:()=>this.loggedIn.get()?"landing__signin hidden":"landing__signin",onclick:()=>this.router.navigate("/login")},history:{className:()=>e()?"landing__history":"landing__history hidden",onclick:()=>this.router.navigate("/history")},admin:{className:()=>this.admins.isSuperAdmin()?"landing__admin":"landing__admin hidden",onclick:()=>this.router.navigate("/admin")},newSection:{className:()=>this.newRows.get().length>0?"landing__section-block landing__new":"landing__section-block landing__new hidden"},newCount:()=>{const n=this.newRows.get().length;return n===0?"":String(n)},ongoingSection:{className:()=>this.ongoing.get().length>0?"landing__section-block":"landing__section-block hidden"},ongoingCount:()=>{const n=this.ongoing.get().length;return n===0?"":String(n)},finishedSection:{className:()=>this.finished.get().length>0?"landing__section-block":"landing__section-block hidden"},finishedCount:()=>{const n=this.finished.get().length;return n===0?"":String(n)},empty:{className:()=>e()?"landing__empty hidden":"landing__empty"}});this.$each(this.ref(t,"newList"),this.newRows,(n,i,l)=>this.roundRow(n,l),n=>n.key),this.$each(this.ref(t,"ongoingList"),this.ongoing,(n,i,l)=>this.roundRow(n,l),n=>n.key),this.$each(this.ref(t,"finishedList"),this.finished,(n,i,l)=>this.roundRow(n,l),n=>n.key),this.spawn(V,this.ref(t,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const n=this.deleteTarget.get();return`Delete ${n?`“${n.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const n=this.deleteTarget.get();n&&this.svc.remove(n.token,n.roundId)}});const s=n=>{n.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",s),this.track(()=>window.removeEventListener("keydown",s)),t}roundRow(e,t){return this.wireEl(Ln,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},course:()=>e.courseName||"Round",role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>Qt[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>e.date??"",formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",e.courseName||"this round")}}},t)}}function Dn(r){return[...r].sort((e,t)=>{const s=pt(e),n=pt(t);return n!==s?n-s:e.key.localeCompare(t.key)})}function pt(r){const e=r.completedAt??r.lastActivityAt,t=e?Date.parse(e):NaN;return Number.isNaN(t)?Number.NEGATIVE_INFINITY:t}const An=y(`
    <div class="history">
        <button bind="back" class="history__back" type="button">← Home</button>
        <h1 class="history__title">All rounds</h1>
        <div bind="empty" class="history__empty">No rounds yet — create one to tee off.</div>
        <div bind="list" class="history__list"></div>
        <div bind="confirmHost"></div>
    </div>
`),Hn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',Mn=y(`
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
        <button bind="del" type="button" class="round-row__del" aria-label="Delete round">${Hn}</button>
    </div>
`);class Fn extends P{static styles=`
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
                ${O({hover:!0})}

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
    `;svc=this.inject(Ve);auth=this.inject(A);router=this.inject(R);loggedIn=new k(()=>this.auth.currentUser.get()!==null);rows=new k(()=>Dn(this.loggedIn.get()?de.fromMyRounds(this.svc.myRounds.get()):de.fromDeviceRounds(this.svc.deviceRounds.get())));deleteOpen=new p(!1);deleteTarget=new p(null);askDelete(e,t,s){this.deleteTarget.set({token:e,roundId:t,name:s}),this.deleteOpen.set(!0)}render(){this.loggedIn.get()?this.svc.loadMine():this.svc.loadDevice();const e=this.wire(An,{back:{onclick:()=>this.router.navigate("/")},empty:{className:()=>this.rows.get().length===0?"history__empty":"history__empty hidden"}});this.$each(this.ref(e,"list"),this.rows,(s,n,i)=>this.roundRow(s,i),s=>s.key),this.spawn(V,this.ref(e,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const s=this.deleteTarget.get();return`Delete ${s?`“${s.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const s=this.deleteTarget.get();s&&this.svc.remove(s.token,s.roundId)}});const t=s=>{s.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1)};return window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t)),e}roundRow(e,t){return this.wireEl(Mn,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},course:()=>e.courseName||"Round",role:{textContent:()=>e.roleLabel??"",className:()=>e.roleLabel?"round-row__role":"round-row__role hidden"},status:{textContent:()=>Qt[e.status]??e.status,className:()=>`round-row__status s-${e.status}`},date:()=>e.date??"",formats:()=>e.formats??"",del:{className:()=>e.token===null?"round-row__del hidden":"round-row__del",onclick:()=>{e.token!==null&&this.askDelete(e.token,e.roundId??"",e.courseName||"this round")}}},t)}}function Xt(r){return r.handicapIndex*(r.slope/113)+(r.courseRating-r.par)}function Bn(r){return Math.round(Xt(r))}function Gn(r,e,t){const s=t;if(s<=0)return 0;if(r>=0){const c=Math.floor(r/s),u=r-c*s;return c+(e>=1&&e<=u?1:0)}const n=-r,i=Math.floor(n/s),l=n-i*s,d=i+(e>s-l?1:0);return d===0?0:-d}const qn=180,mt=4,Kn=12;function re(r,e){return e<=0?0:Math.max(0,Math.min(e-1,r))}function Vn(r){const{dragDistance:e,velocity:t,itemWidth:s}=r;if(Math.abs(e)<Kn)return 0;const n=e+t*qn,i=Math.round(-n/s);return Math.max(-mt,Math.min(mt,i))}const ft="tapscore:pending-scores:v1",Un=336*60*60*1e3,gt=200;function Wn(){try{return globalThis.localStorage??null}catch{return null}}function Yn(r){if(typeof r!="object"||r===null)return!1;const e=r;return typeof e.token=="string"&&typeof e.ballId=="string"&&typeof e.playHoleId=="string"&&(typeof e.strokes=="number"||e.strokes===null)&&(e.eventType==="score_entered"||e.eventType==="score_cleared")&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class Qn{entries=[];storage;constructor(e=Wn(),t=Date.now()){this.storage=e,this.entries=this.load();const s=this.applyHygiene(t);s.length!==this.entries.length&&(this.entries=s,this.persist())}enqueue(e){const t=this.entries.findIndex(s=>s.token===e.token&&s.ballId===e.ballId&&s.playHoleId===e.playHoleId);t>=0?this.entries[t]=e:this.entries.push(e),this.entries=this.applyHygiene(e.queuedAt),this.persist()}remove(e){const t=this.entries.filter(s=>s.clientEventId!==e);t.length!==this.entries.length&&(this.entries=t,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(s=>e-s.queuedAt<=Un);return t.length>gt?t.slice(t.length-gt):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(ft);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(Yn):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(ft,JSON.stringify(this.entries))}catch{}}}const Xn=["1st","2nd","3rd","4th","5th","6th","7th","8th"],J=(r,e)=>`${r}|${e}`;function Jt(r){return r.players.map(e=>e.displayName).join(" & ")||r.label||"Ball"}function Jn(r,e,t){return r?!(r.minPar!==void 0&&e<r.minPar||r.maxPar!==void 0&&e>r.maxPar||r.pars&&!r.pars.includes(e)||r.holes&&!r.holes.includes(t)):!0}class se{constructor(e=new Qn){this.queue=e}queue;loading=new p(!1);error=new p(null);friendlyRound=new p(null);round=new p(null);startList=new p(null);balls=new p([]);scorecards=new p([]);cells=new p(new Map);result=new p(null);resultLoading=new p(!1);resultError=new p(null);resultCursor=null;holeIdx=new p(0);groupIdx=new p(0);keypadOpen=new p(!1);selectedSlot=new p(null);token=null;loadSeq=0;resultSeq=0;flushing=!1;pendingSlotIndex=null;async loadByToken(e,t){const s=e!==this.token;this.token=e;const n=++this.loadSeq;s&&this.resetForNewToken(t),D.get(he).load();const i=await j(this.loading,this.error,()=>_.friendlyRounds.byToken({token:e}));if(!i||n!==this.loadSeq||e!==this.token)return;if(this.friendlyRound.set(i.friendlyRound),this.round.set(i.round),this.startList.set(i.startList),$e({token:e,courseName:i.round.courseNameSnapshot??"",status:i.round.status,completedAt:i.round.completedAt,lastSeenAt:new Date().toISOString()}),D.get(A).currentUser.get()&&wn(i.round.id),this.pendingSlotIndex!==null){const u=i.round.formatSlots[this.pendingSlotIndex]?.slotDefId??null;this.pendingSlotIndex=null,u!==null&&this.selectedSlot.set(u)}const[l,d]=await Promise.all([_.friendlyRounds.balls({token:e}).catch(()=>[]),_.friendlyRounds.scorecard({token:e}).catch(()=>[])]);n!==this.loadSeq||e!==this.token||(this.cells.set(new Map),this.scorecards.set(d),this.balls.set(l),await this.flushPending())}deleting=new p(!1);async deleteRound(){const e=this.token;if(!e||this.deleting.get())return!1;this.deleting.set(!0);try{await _.friendlyRounds.remove({token:e}),Ut(e);const t=this.round.get()?.id;return t&&qt(t),!0}catch{return!1}finally{this.deleting.set(!1)}}finishing=new p(!1);async finishRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await _.friendlyRounds.finish({token:e}),s=this.round.get();return e===this.token&&s&&(this.round.set({...s,status:t.status,completedAt:t.completedAt}),$e({token:e,courseName:s.courseNameSnapshot??"",status:t.status,completedAt:t.completedAt,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async reopenRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await _.friendlyRounds.reopen({token:e}),s=this.round.get();return e===this.token&&s&&(this.round.set({...s,status:t.status,completedAt:null}),$e({token:e,courseName:s.courseNameSnapshot??"",status:t.status,completedAt:null,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async loadResult(){const e=this.token;if(!e)return;const t=++this.resultSeq,s=await j(this.resultLoading,this.resultError,()=>_.friendlyRounds.result({token:e}));t!==this.resultSeq||e!==this.token||s&&(this.resultCursor=s.cursor,s.unchanged||this.result.set(s.result))}async pollResult(){const e=this.token;if(!e)return;const t=++this.resultSeq;let s;try{s=await _.friendlyRounds.result({token:e,...this.resultCursor!==null?{cursor:this.resultCursor}:{}})}catch{return}t!==this.resultSeq||e!==this.token||(this.resultCursor=s.cursor,s.unchanged||this.result.set(s.result))}ballNameById=new k(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,Jt(t));for(const t of this.result.get()?.slots??[])for(const s of t.subjectLabels??[])e.set(s.ballId,s.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}isPending(e){return this.balls.get().find(t=>t.id===e)?.pending===!0}groupLabelByBallId=new k(()=>{const e=new Map,t=this.groups();return t.length<2||t.forEach((s,n)=>{for(const i of s.ballIds)e.set(i,`Group ${n+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}selectedSlotDefId(){const e=this.round.get()?.formatSlots??[];if(e.length===0)return null;const t=this.selectedSlot.get();return t!==null&&e.some(s=>s.slotDefId===t)?t:e[0]?.slotDefId??null}selectSlot(e){this.selectedSlot.set(e)}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return re(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),s=t?.playHoles.find(l=>l.id===e);if(!t||!s)return"";const n=t.playHoles.filter(l=>l.courseHoleNumber===s.courseHoleNumber).sort((l,d)=>l.ordinal-d.ordinal);if(n.length===1)return`${s.courseHoleNumber}`;const i=n.findIndex(l=>l.id===e);return`${s.courseHoleNumber} (${Xn[i]??`${i+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(re(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(re(this.holeIndex()+1,this.playedOrder().length))}strokesFor(e,t){const s=this.cells.get().get(J(e,t));return s?s.strokes:this.scorecards.get().find(l=>l.ballId===e)?.holes.find(l=>l.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(J(e,t))?.status??null}strokesHintFor(e,t){const s=this.round.get();if(!s)return null;const n=this.balls.get().find(m=>m.id===e);if(!n||n.pending)return null;const i=this.selectedSlotDefId(),d=(n.slots.find(m=>m.slotDefId===i)??n.slots[0])?.playingHandicap;if(d==null)return null;const c=this.playHoleById(t);if(!c)return null;const u=n.players[0]?.teeName??null,f=c.tees.find(m=>m.teeName===u)?.strokeIndex??c.baseStrokeIndex;return Gn(d,f,s.routeSi.allocationCycleSize)}metadataFor(e,t,s){const n=this.cells.get().get(J(e,t));return n&&n.metadata!==void 0?n.metadata?.[s]:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.metadata?.[s]}metadataInputs(){const e=D.get(he),t=this.round.get()?.formatSlots??[],s=[],n=new Set;for(const i of t){const l=e.byId(i.formatId)?.requirements.scoreEntry?.metadata??[];for(const d of l)n.has(d.key)||(n.add(d.key),s.push(d))}return s}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>Jn(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,s,n){const i=J(e,t),l=crypto.randomUUID();this.patchCell(i,{strokes:s,metadata:n,status:"saving",clientEventId:l});const d=this.token;d&&(this.enqueue(d,e,t,s,n,l),await this.post(d,e,t,s,n,l))}async retry(e,t){const s=J(e,t),n=this.cells.get().get(s);if(!n)return;this.patchCell(s,{...n,status:"saving"});const i=this.token;i&&(this.enqueue(i,e,t,n.strokes,n.metadata,n.clientEventId),await this.post(i,e,t,n.strokes,n.metadata,n.clientEventId))}async flushPending(){const e=this.token;if(!(!e||this.flushing)){this.flushing=!0;try{for(const t of this.queue.entriesFor(e)){if(e!==this.token)return;this.patchCell(J(t.ballId,t.playHoleId),{strokes:t.strokes,metadata:t.metadata,status:"saving",clientEventId:t.clientEventId}),await this.post(e,t.ballId,t.playHoleId,t.strokes,t.metadata,t.clientEventId)}}finally{this.flushing=!1}}}enqueue(e,t,s,n,i,l){this.queue.enqueue({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:l,...i!==void 0?{metadata:i}:{},queuedAt:Date.now()})}async post(e,t,s,n,i,l){const d=J(t,s);try{await _.friendlyRounds.score({token:e,ballId:t,playHoleId:s,strokes:n,eventType:n===null?"score_cleared":"score_entered",clientEventId:l,...i!=null?{metadata:i}:{}}),this.queue.remove(l);const c=this.cells.get().get(d);c&&c.clientEventId===l&&this.patchCell(d,{...c,status:"saved"});const u=this.round.get();e===this.token&&u&&u.status==="not_started"&&this.round.set({...u,status:"active"})}catch{const c=this.cells.get().get(d);c&&c.clientEventId===l&&this.patchCell(d,{...c,status:"error"})}}patchCell(e,t){const s=new Map(this.cells.get());s.set(e,t),this.cells.set(s)}resetForNewToken(e){this.resultSeq++,this.resultCursor=null,this.friendlyRound.set(null),this.round.set(null),this.startList.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(e?.holeIdx??0),this.groupIdx.set(e?.groupIdx??0),this.keypadOpen.set(!1);const t=e?.selectedSlot;this.pendingSlotIndex=null,typeof t=="string"?this.selectedSlot.set(t):typeof t=="number"?(this.pendingSlotIndex=t,this.selectedSlot.set(null)):this.selectedSlot.set(null)}}const Z=60,bt=8,Fe=4,Zn=Array.from({length:Fe*2+1},(r,e)=>e-Fe),ei="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",ti=y(`
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
`),si=y(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),yt=y(`
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
`),ni=y(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),_t=y(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),ii=y(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`);class ri extends P{static styles=`
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
            right: ${bt}px;
            width: ${Z*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-Fe*Z}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${Z}px;
            width: ${Z}px;
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

            & .se-row__scores { display: flex; align-items: center; padding-right: ${bt}px; flex-shrink: 0; }
            & .se-row__slot { width: ${Z}px; display: flex; align-items: center; justify-content: center; }
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
    `;svc=this.inject(se);holeIdx=this.svc.holeIdx;modalOpen=this.svc.keypadOpen;currentBallIdx=new p(0);holeCompleteOnEntry=!1;extendedOpen=new p(!1);extendedScore=new p(10);statsOpen=new p(!1);pendingMeta=new p({});lastMetaKey=null;toastMsg=new p(null);dragOffset=new p(0);transitioning=new p(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new k(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[re(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(s=>[s.id,s]));return e.ballIds.map(s=>t.get(s)).filter(s=>!!s)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>Jt(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);hintText=(e,t)=>{const s=this.svc.strokesHintFor(e,t);return s===null?null:s===0?"0":s>0?`-${s}`:`+${-s}`};toParValue=e=>{let t=0,s=0,n=!1;for(const i of this.playedOrder()){const l=this.svc.strokesFor(e.id,i.playHoleId);l!==null&&l>0&&(t+=l,s+=this.parFor(i.playHoleId),n=!0)}return n?t-s:null};toParText=e=>{const t=this.toParValue(e);return t===null?"–":t===0?"E":t>0?`+${t}`:`${t}`};toParClass=e=>{const t=this.toParValue(e);return`se-row__topar ${t===null||t===0?"even":t<0?"under":"over"}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const s=e-t;return s<=-4||s>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(s)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer),this.modalOpen.set(!1)}),this.track(N(()=>{const i=this.ballsInGroup().length;i>0&&this.currentBallIdx.get()>=i&&this.currentBallIdx.set(0)}));const e=this.wire(ti,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1)}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const i=this.currentHole();return i?`Hole ${this.occLabel(i.playHoleId)} · Par ${this.parFor(i.playHoleId)}`:""},modalPrev:{onclick:()=>this.stepHole(-1),disabled:()=>!this.svc.canPrevHole()},modalNext:{onclick:()=>this.stepHole(1),disabled:()=>!this.svc.canNextHole()},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>this.statsOpen.set(!1)},statsHole:()=>{const i=this.currentHole();return i?`Hole ${this.occLabel(i.playHoleId)} · Par ${this.parFor(i.playHoleId)}`:""},statsTitle:()=>{const i=this.ballsInGroup()[this.currentBallIdx.get()];return i?this.ballName(i):""},statsScore:()=>{const i=this.ballsInGroup()[this.currentBallIdx.get()],l=this.currentHole();return!i||!l?"":this.displayScore(this.svc.strokesFor(i.id,l.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.holeCompleteOnEntry||this.advance()}}}),t=this.ref(e,"viewport"),s=this.ref(e,"track");this.bindCarouselPointer(t,s),this.track(N(()=>{s.style.transition=this.transitioning.get()?ei:"none",s.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(s,new k(()=>Zn),(i,l,d)=>this.holeItem(i,d),i=>i),this.$each(this.ref(e,"rows"),new k(()=>{const i=this.playedOrder(),l=this.holeIndex(),d=i[l];if(!d)return[];const c=l>0?i[l-1].playHoleId:null;return this.ballsInGroup().map(u=>({ball:u,ph:d.playHoleId,prevPh:c}))}),(i,l,d)=>this.playerRow(i.ball,i.ph,i.prevPh,d),i=>`${i.ball.id}|${i.ph}`),this.$each(this.ref(e,"modalList"),new k(()=>this.ballsInGroup()),(i,l,d)=>this.modalRow(i,l,d),i=>i.id);const n=this.ref(e,"keys");for(const i of[1,2,3,4,5,6,7,8,9])n.appendChild(this.numberKey(i));return n.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),n.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),n.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(e,"statsBody"),new k(()=>this.metaInputs()),(i,l,d)=>this.metaChip(i,d),i=>i.key),this.track(N(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null;return}const i=this.ballsInGroup()[this.currentBallIdx.get()],l=this.currentHole();if(!i||!l)return;const d=`${i.id}|${l.playHoleId}`;if(d===this.lastMetaKey)return;this.lastMetaKey=d;const c={};for(const u of this.metaInputs())c[u.key]=this.svc.metadataFor(i.id,l.playHoleId,u.key)===!0;this.pendingMeta.set(c)})),e}holeItem(e,t){return this.wireEl(si,{item:{className:()=>{const s=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${s?" gone":""}`}},hnum:{textContent:()=>{const s=this.occAtOffset(e);return s?this.occLabel(s.playHoleId):""}},hpar:{textContent:()=>{const s=this.occAtOffset(e);return s?`Par ${this.parFor(s.playHoleId)}`:""}}},t)}playerRow(e,t,s,n){return e.pending?this.wireEl(yt,{name:{textContent:this.ballName(e),className:"se-row__name se-row__name--pending"},topar:{textContent:"open seat",className:"se-row__topar"},prev:{textContent:""},cval:{textContent:"–"},circle:{className:"se-row__circle empty se-row__circle--pending"}},n):this.wireEl(yt,{name:{textContent:this.ballName(e)},topar:{textContent:()=>this.toParText(e),className:()=>this.toParClass(e)},prev:{textContent:()=>s?this.displayScore(this.svc.strokesFor(e.id,s)):""},cval:{textContent:()=>{const i=this.svc.strokesFor(e.id,t);return i!==null?this.displayScore(i):this.hintText(e.id,t)??"–"}},circle:{className:()=>this.svc.strokesFor(e.id,t)!==null?"se-row__circle":this.hintText(e.id,t)!==null?"se-row__circle empty hint":"se-row__circle empty",onclick:()=>this.openModalForBall(e.id)}},n)}modalRow(e,t,s){const n=e.pending?"Open seat — claim to score":e.players.length>1?`Team · CH ${e.courseHandicap}`:`CH ${e.players[0]?.courseHandicap??e.courseHandicap}`;return this.wireEl(ni,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.currentBallIdx.set(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:n},mval:{textContent:()=>{const i=this.currentHole();if(!i)return"–";const l=this.svc.strokesFor(e.id,i.playHoleId);return l!==null?this.displayScore(l):this.hintText(e.id,i.playHoleId)??"–"},className:()=>{const i=this.currentHole();return!!i&&this.svc.strokesFor(e.id,i.playHoleId)===null&&!!i&&this.hintText(e.id,i.playHoleId)!==null?"se-mrow__val se-mrow__val--hint":"se-mrow__val"}}},s)}numberKey(e){return this.wireEl(_t,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,s,n){return this.wireEl(_t,{key:{className:s,onclick:n},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(s=>s.id===e);this.currentBallIdx.set(t<0?0:t),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.noteHoleEntered(),this.modalOpen.set(!0)}noteHoleEntered(){const e=this.currentHole(),t=this.ballsInGroup().filter(s=>!s.pending);this.holeCompleteOnEntry=!!e&&t.length>0&&t.every(s=>this.svc.strokesFor(s.id,e.playHoleId)!==null)}stepHole(e){this.advanceTimer&&(clearTimeout(this.advanceTimer),this.advanceTimer=null),this.extendedOpen.set(!1),this.statsOpen.set(!1),e<0?this.svc.prevHole():this.svc.nextHole(),this.currentBallIdx.set(0),this.noteHoleEntered()}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){const t=this.ballsInGroup(),s=this.currentHole(),n=t[this.currentBallIdx.get()];if(!s||!n)return;if(n.pending){this.holeCompleteOnEntry||this.advance();return}const i=e===null?void 0:this.metaSnapshot();this.svc.setScore(n.id,s.playHoleId,e,i),e!==null&&e>0&&this.metaInputs().length>0?this.statsOpen.set(!0):this.holeCompleteOnEntry||this.advance()}hasMoreUnscored=()=>{const e=this.ballsInGroup(),t=this.currentHole();if(!t)return!1;const s=this.currentBallIdx.get();return e.some((n,i)=>i!==s&&this.svc.strokesFor(n.id,t.playHoleId)===null)};metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),s={};for(const n of e)s[n.key]=t[n.key]===!0;return s}setMeta(e,t){const s=this.pendingMeta.get();this.pendingMeta.set({...s,[e]:t});const n=this.ballsInGroup()[this.currentBallIdx.get()],i=this.currentHole();if(!n||!i)return;const l=this.svc.strokesFor(n.id,i.playHoleId);l!==null&&this.svc.setScore(n.id,i.playHoleId,l,this.metaSnapshot())}metaChip(e,t){return this.wireEl(ii,{glabel:{textContent:e.label},miss:{className:()=>this.pendingMeta.get()[e.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(e.key,!1)},hit:{className:()=>this.pendingMeta.get()[e.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(e.key,!0)}},t)}advance(){const e=this.ballsInGroup(),t=this.currentHole();if(!t)return;const s=c=>this.svc.strokesFor(e[c].id,t.playHoleId)!==null,n=this.currentBallIdx.get();for(let c=n+1;c<e.length;c++)if(!s(c))return this.currentBallIdx.set(c);for(let c=0;c<n;c++)if(!s(c))return this.currentBallIdx.set(c);const i=this.playedOrder();if(this.holeIndex()>=i.length-1){this.flash("Round complete"),this.modalOpen.set(!1);return}this.flash(`Hole ${this.occLabel(t.playHoleId)} done`);const d=t.playHoleId;this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===d&&(this.holeIdx.set(re(this.holeIndex()+1,this.playedOrder().length)),this.currentBallIdx.set(0),this.noteHoleEntered())},700)}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*Z),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(re(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",n=>{n.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",n=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:n.pointerId,startX:n.clientX,startY:n.clientY,lastX:n.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(n.pointerId))}),e.addEventListener("pointermove",n=>{const i=this.ptr;if(!i||i.id!==n.pointerId)return;const l=n.clientX-i.startX,d=n.clientY-i.startY;if(!i.horiz){if(Math.abs(d)>Math.abs(l)&&Math.abs(d)>8||Math.abs(l)<=8)return;i.horiz=!0}const c=Date.now(),u=Math.max(1,c-i.lastTime);i.velocity=(n.clientX-i.lastX)/u,i.lastX=n.clientX,i.lastTime=c,this.dragOffset.set(l)});const s=n=>{const i=this.ptr;if(!i||i.id!==n.pointerId)return;const l=n.clientX-i.startX,d=i.horiz;if(this.ptr=null,e.releasePointerCapture?.(n.pointerId),!d){this.dragOffset.set(0);return}this.snap(Vn({dragDistance:l,velocity:i.velocity,itemWidth:Z}))};e.addEventListener("pointerup",s),e.addEventListener("pointercancel",n=>{!this.ptr||this.ptr.id!==n.pointerId||(this.ptr=null,e.releasePointerCapture?.(n.pointerId),this.snap(0))})}}const Zt=()=>null;function z(r){return String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function oi(r,e){const t=[...r].sort((i,l)=>i.canonicalOrdinal-l.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(i=>i.playHoleId))}];const s=[...e].sort((i,l)=>i.fromCanonicalOrdinal-l.fromCanonicalOrdinal),n=[];for(const i of s){const l=t.filter(d=>d.canonicalOrdinal>=i.fromCanonicalOrdinal&&d.canonicalOrdinal<=i.toCanonicalOrdinal);l.length!==0&&n.push({label:i.label,holes:l,playHoleIds:new Set(l.map(d=>d.playHoleId))})}return n}function ai(r){return r.kind==="si"?"lb-c-si":r.kind==="given"?"lb-c-given":r.kind==="status"?"lb-c-status":r.kind==="category"?"lb-c-cat":""}function li(r){const e=[r.kind==="category"?"lb-r-cat":`lb-r-${r.kind}`];return(r.kind==="si"||r.kind==="given")&&e.push("lb-r-dim"),r.team&&e.push(`lb-team-${r.team}`),e.join(" ")}function di(r){return r&&r.marker?r.marker.template:null}function ci(r){const e=r?.marker?.tone;return e==="success"||e==="warning"||e==="danger"?` lb-mark-tone--${e}`:""}function ui(r,e){const t=r.cells.filter(s=>e.has(s.playHoleId));if(r.aggregate==="sum"){const s=t.map(n=>n.value).filter(n=>n!==null);return s.length===0?"—":String(s.reduce((n,i)=>n+i,0))}if(r.aggregate==="last"){for(let s=t.length-1;s>=0;s--){const n=t[s].value;if(n!==null)return Number.isInteger(n)?String(n):n.toFixed(1)}return"—"}return"—"}function hi(r){return r.filter(e=>!(e.startsWith("slot #")||/^CH -?\d/.test(e)||/^PH -?\d/.test(e)))}function We(r,e,t,s){const n=oi(r.holes,e),i=I=>{const H=`<tr><th class="lb-rowlabel">Hole</th>${I.holes.map(E=>`<th>${z(E.occurrenceLabel)}</th>`).join("")}<th class="lb-sum">${z(I.label)}</th></tr>`,F=r.rows.map(E=>{const M=new Map(E.cells.map(X=>[X.playHoleId,X])),W=X=>E.emphasis?`<strong>${X}</strong>`:X,ds=I.holes.map(X=>{const K=M.get(X.playHoleId),hs=K?.title?` title="${z(K.title)}"`:"",Ee=W(z(K?.display??"")),Ze=di(K),ps=ci(K),Ne=K?.marker?.label,ms=Ne?` title="${z(Ne)}" aria-label="${z(Ne)}"`:"";let me;if(Ze){const fs=K?.team?` lb-mark-fill--${K.team}`:"";me=`<span class="lb-mark lb-mark--${Ze}${ps}${fs}"${ms}>${Ee}</span>`}else K?.team?me=`<span class="lb-pill lb-pill--${K.team}">${Ee}</span>`:me=Ee;return`<td class="${ai(E)}"${hs}>${me}</td>`}).join(""),cs=`<td class="lb-sum">${W(ui(E,I.playHoleIds))}</td>`,us=E.subjectBallId?z(t(E.subjectBallId))+(E.label?" "+z(E.label):""):z(E.label);return`<tr class="${li(E)}"><th class="lb-rowlabel">${us}</th>${ds}${cs}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${H}</thead><tbody>${F}</tbody></table></div>`},l=n.map(I=>i(I)).join(""),d=r.title.groups.map(I=>I.map(H=>z(t(H))).join(" & ")).filter(Boolean).join(r.title.joiner),c=s.mode==="verification"?r.subtitleFacts:hi(r.subtitleFacts),u=c.length?`<div class="lb-card__sub">${c.map(z).join(" · ")}</div>`:"",f=s.mode==="verification"&&r.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${r.footnotes.map(I=>`<span class="lb-card__note">${z(I)}</span>`).join("")}</div>`:"",m=s.mode==="verification"&&r.caption?`<p class="lb-card__caption">${z(r.caption)}</p>`:"",h=r.totals.length?`<ul class="lb-card__totals">${r.totals.map(I=>`<li>${z(I.label)} = <strong>${I.value??"—"}</strong></li>`).join("")}</ul>`:"",v=d?`<header class="lb-card__head"><h4>${d}</h4>${u}</header>`:u;return`<article class="${s.cardModifier?`lb-card ${s.cardModifier}`:"lb-card"}">
  ${v}
  ${l}
  ${f}${m}${h}
</article>`}function pi(r,e,t,s){return We(r,e,t,s)}function mi(r,e,t,s){return We(r,e,t,{...s,cardModifier:"lb-card--compact-match"})}function fi(r,e,t,s){return We(r,e,t,{...s,cardModifier:"lb-card--category-matrix"})}function gi(r,e){const t=new Set(r.map(e));return t.size!==1?null:[...t][0]??null}function bi(r){return r===0?"E":r>0?`+${r}`:`−${Math.abs(r)}`}function yi(r,e){return e==="high"?-r:r}function _i(r,e){if(r===void 0)return'<td class="lb-rank__pace"></td>';const t=yi(r,e);return`<td class="lb-rank__pace lb-rank__pace--${t===0?"even":t>0?"over":"under"}">${z(bi(t))}</td>`}function vi(r,e,t=Zt){const s=r.entries.some(d=>d.paceDelta!==void 0),n=r.entries.map(d=>{const c=gi(d.ballIds,t),u=c?` <span class="lb-rank__group">${z(c)}</span>`:"";return`<tr class="${d.position===1?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${d.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${z(d.ballIds.map(e).join(" & "))}</span>${u}</span></td>
  <td class="lb-rank__total">${d.total??"—"}</td>${s?`
  ${_i(d.paceDelta,r.direction)}`:""}
  <td class="lb-rank__thru">${d.holesPlayed}</td>
</tr>`}).join(""),i=s?`
      <col class="lb-rank__col-pace">`:"",l=s?'<th class="lb-rank__pace">Pace</th>':"";return`<div class="lb-section">
  <h4 class="lb-section__title">${z(r.metricLabel)}</h4>
  <table class="lb-rank">
    <colgroup>
      <col class="lb-rank__col-pos">
      <col class="lb-rank__col-who">
      <col class="lb-rank__col-total">${i}
      <col class="lb-rank__col-thru">
    </colgroup>
    <thead><tr><th class="lb-rank__pos">#</th><th class="lb-rank__who">Player</th><th class="lb-rank__total">Total</th>${l}<th class="lb-rank__thru">Thru</th></tr></thead>
    <tbody>${n}</tbody>
  </table>
</div>`}function wi(r,e){const t=r.matches.map(s=>{const n=z(s.sideA.ballIds.map(e).join(" & ")),i=z(s.sideB.ballIds.map(e).join(" & ")),l=s.magnitude===0?"AS":`${s.magnitude} UP`,d=s.finished?"Final":`thru ${s.thru}`,c=s.leader==="a"?" lb-mp__team--lead":"",u=s.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${c}">${n}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${z(l)}</span><span class="lb-mp__status">${z(d)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${u}">${i}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${z(r.title)}</h4>${t}
</div>`}const xi={ranked:vi,match_summary:(r,e)=>wi(r,e)},$i={"default-score-grid":pi,"compact-match-grid":mi,"category-matrix-grid":fi};function ki(r){return r.componentId??"default-score-grid"}function Si(r){return`<div class="lb-diag">Unrenderable result section <code>${z(r)}</code> — no generic view yet. Results are not hidden.</div>`}function Ci(r){return`<div class="lb-diag">Unsupported score-grid component <code>${z(r)}</code> — no generic view yet. Results are not hidden.</div>`}function Ti(r,e,t){const s=xi[r.kind];return s?s(r,e,t):Si(r.kind)}function Ii(r,e,t,s){const n=ki(r),i=$i[n];return i?i(r,e,t,s):Ci(n)}function Ei(r,e,t=Zt){return r.leaderboard.length===0&&r.cards.length===0?`<div class="lb-empty">No scores entered yet for ${z(r.formatLabel)}.</div>`:r.leaderboard.map(n=>Ti(n,e,t)).join("")||`<div class="lb-empty">No leaderboard metric for ${z(r.formatLabel)}.</div>`}function Ni(r,e,t,s={}){if(r.cards.length===0)return"";const n=s.mode??"product";return r.cards.map(i=>Ii(i,e,t,{mode:n})).join(`
`)}const Pi=y(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class zi extends P{static styles=`
        .lb {
            /* Horizontal gutters come from the host panel (.round-view__main
               already pads lg) — padding here would double-indent every
               section relative to the page header and waste table width. */
            padding: ${a("lg")} 0 ${a("2xl")};

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
                ${O()}
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
                ${O()}
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
            /* Score marker shapes (presentation vocabulary), Golf Gamebook
               idiom: FILLED circles for under-par scores, FILLED squares for
               over-par, white number, colour encodes magnitude (red −1,
               orange −2, yellow −3+/HIO; light blue +1, dark blue +2 or
               worse). The marker's label carries the golf meaning; these
               class names stay presentation-only. */
            & .lb-mark {
                display: inline-flex; align-items: center; justify-content: center;
                box-sizing: border-box; width: 1.7em; height: 1.7em; line-height: 1;
                /* Digits sit high in their line box, so nudge down to optically centre. */
                padding-top: 0.12em; vertical-align: middle;
                border-radius: 999px; font-weight: 700;
            }
            /* Outline pill forms (badge/dot) keep currentColor + tone tints. */
            & .lb-mark--badge {
                width: auto; min-width: 1.8em;
                padding-left: 0.45em; padding-right: 0.45em;
                border: 2px solid currentColor;
            }
            & .lb-mark--badge.lb-mark-tone--success { color: #267348; }
            & .lb-mark--badge.lb-mark-tone--warning { color: #946200; }
            & .lb-mark--badge.lb-mark-tone--danger { color: #9b332a; }
            /* Filled forms — declared after the tone rules so white text wins. */
            & .lb-mark--ring { background: #d63b2f; color: #fff; }
            & .lb-mark--double_ring { background: #e0862c; color: #fff; }
            & .lb-mark--diamond { background: #e0b41f; color: #fff; }
            & .lb-mark--square,
            & .lb-mark--double_square,
            & .lb-mark--box_badge { border-radius: 3px; }
            & .lb-mark--square { background: #5b9bd5; color: #fff; }
            & .lb-mark--double_square,
            & .lb-mark--box_badge { background: #1f4e79; color: #fff; }
            /* Deciding ball whose score is decorated: the marker's own shape gets
               the team fill — white number and white outline on the team colour.
               Declared AFTER the shape fills so the team colour wins. The white
               border + outer box-shadow halo are load-bearing: without them a
               filled bonus ring is indistinguishable from the plain standing
               pill (the score-to-par shapes above carry no outline). */
            & .lb-mark-fill--a, & .lb-mark-fill--b { border: 2px solid #fff; }
            & .lb-mark--double_ring.lb-mark-fill--a,
            & .lb-mark--double_ring.lb-mark-fill--b { border-width: 3px; border-style: double; }
            & .lb-mark-fill--a { background: #c2452f; color: #fff; box-shadow: 0 0 0 2.5px #c2452f; }
            & .lb-mark-fill--b { background: #2c6cae; color: #fff; box-shadow: 0 0 0 2.5px #2c6cae; }
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
    `;svc=this.inject(se);slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots(),t=this.svc.selectedSlotDefId();return e.find(s=>s.slotDefId===t)??e[0]??null};render(){return this.wire(Pi,{status:{className:()=>{const t=this.svc.resultLoading.get(),s=this.svc.result.get()===null;return t||s?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody()}})}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const s=c=>{const u=this.svc.nameOf(c);return this.svc.isPending(c)?`${u} (open seat)`:u},i=Ei(t,s,c=>this.svc.groupLabelOf(c)),l=Ni(t,e.routeSections,s),d=l?`<h3 class="lb-cards__head">Scorecard</h3>${l}`:"";return i+d}}function Oi(r,e){if(!e)return[];const t=[],s=new Set;for(const n of r)for(const i of n.players){if(i.playerId===e)return[];i.guestPlayerId===null||s.has(i.guestPlayerId)||(s.add(i.guestPlayerId),t.push({guestPlayerId:i.guestPlayerId,displayName:i.displayName}))}return t}const ji=y(`
    <div bind="root" class="claim-card hidden">
        <span class="claim-card__label">Played here as a guest?</span>
        <p class="claim-card__hint">Claim your scores — the round lands on your profile's card.</p>
        <div bind="rows" class="claim-card__rows"></div>
        <p bind="err" class="claim-card__err"></p>
    </div>
`),Ri=y(`
    <div class="claim-card__row">
        <span bind="name" class="claim-card__name"></span>
        <button bind="claim" class="claim-card__btn" type="button">This is me</button>
    </div>
`);class Li extends P{static styles=`
        .claim-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${O()}
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
                ${S()}
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
    `;svc=this.inject(se);auth=this.inject(A);router=this.inject(R);tokenQ=this.router.query("token");claiming=new p(!1);error=new p("");claimable(){return Oi(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async claim(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.claiming.set(!0);try{await _.friendlyRounds.claimGuest({token:t,guestPlayerId:e}),await this.svc.loadByToken(t)}catch(s){this.error.set(s instanceof G&&s.status===409?"Already claimed — or you already play in this round under your account.":s instanceof G&&s.status===404?"That guest is no longer claimable on this round.":"Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}render(){const e=this.wire(ji,{root:{className:()=>this.claimable().length>0?"claim-card":"claim-card hidden"},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.claimable(),(t,s,n)=>this.wireEl(Ri,{name:()=>t.displayName,claim:{disabled:()=>this.claiming.get(),onclick:()=>{this.claim(t.guestPlayerId)}}},n),t=>t.guestPlayerId),e}}function ze(r){return typeof r=="object"&&r!==null&&typeof r.get=="function"}const w=r=>`var(--${r})`,vt="http://www.w3.org/2000/svg";function Di(){const r=document.createElementNS(vt,"svg");r.setAttribute("width","12"),r.setAttribute("height","8"),r.setAttribute("viewBox","0 0 12 8"),r.setAttribute("fill","none"),r.setAttribute("aria-hidden","true"),r.setAttribute("focusable","false");const e=document.createElementNS(vt,"path");return e.setAttribute("d","M1 1.5 6 6.5 11 1.5"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","1.5"),e.setAttribute("stroke-linecap","round"),e.setAttribute("stroke-linejoin","round"),e.setAttribute("fill","none"),r.appendChild(e),r}const ce=class ce extends P{constructor(){super(...arguments),this.uid=`ui-select-${ce.seq++}`,this.open=new p(!1),this.highlightIndex=new p(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}get isMulti(){return this.props.multiple===!0}get multi(){return this.props}get single(){return this.props}currentOptions(){return ze(this.props.options)?this.props.options.get():this.props.options}selectedValues(){if(this.isMulti)return this.multi.values.get();const e=this.single.value.get();return e?[e]:[]}placeholderText(){const e=this.props.placeholder;return(typeof e=="function"?e():e)??""}formatCount(e){return this.multi.countLabel?this.multi.countLabel(e):String(e)}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50,s=this.isMulti;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const n=document.createElement("span");n.className="ui-select__trigger-label",this.triggerEl.appendChild(n);const i=document.createElement("span");i.className="ui-select__chevron",i.appendChild(Di()),i.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(i),this.triggerEl.addEventListener("click",d=>{d.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",d=>{this.handleTriggerKeydown(d)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",d=>{this.handleDropdownKeydown(d)}),this.listEl=document.createElement("div"),this.listEl.className="ui-select__list",this.listEl.setAttribute("role","listbox"),s&&this.listEl.setAttribute("aria-multiselectable","true"),this.dropdownEl.appendChild(this.listEl),s&&(this.countEl=document.createElement("div"),this.countEl.className="ui-select__count",this.countEl.setAttribute("role","status"),this.countEl.setAttribute("aria-live","polite"),this.dropdownEl.appendChild(this.countEl)),e.appendChild(this.dropdownEl);const l=d=>{this.optionEls=[],this.listEl.textContent="";for(let c=0;c<d.length;c++){const u=d[c],f=document.createElement("button");if(f.className=s?"ui-select__option ui-select__option--multi":"ui-select__option",f.setAttribute("type","button"),f.id=`${this.uid}-opt-${c}`,u.disabled){f.classList.add("ui-select__option--header"),f.disabled=!0,f.setAttribute("role","presentation"),f.setAttribute("aria-disabled","true");const h=document.createElement("span");h.className="ui-select__option-label",h.textContent=u.label,f.appendChild(h),this.listEl.appendChild(f),this.optionEls.push(f);continue}if(f.setAttribute("role","option"),s){const h=document.createElement("span");h.className="ui-select__checkbox",h.setAttribute("aria-hidden","true"),f.appendChild(h)}if(u.icon){const h=document.createElement("span");h.className="ui-select__option-icon",h.textContent=u.icon,f.appendChild(h)}const m=document.createElement("span");if(m.className="ui-select__option-label",m.textContent=u.label,f.appendChild(m),!s){const h=document.createElement("span");h.className="ui-select__check",h.setAttribute("aria-hidden","true"),f.appendChild(h)}f.addEventListener("click",h=>{h.stopPropagation(),this.chooseOption(u.value)}),f.addEventListener("mouseenter",()=>{this.highlightIndex.set(c)}),this.listEl.appendChild(f),this.optionEls.push(f)}};return ze(this.props.options)?this.track(N(()=>{l(this.currentOptions())})):l(this.props.options),this.track(N(()=>{const d=this.currentOptions(),c=this.selectedValues();if(s){const u=c.length;if(u>0)n.textContent=this.formatCount(u),this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const f=this.placeholderText();n.textContent=f,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!f)}this.countEl&&(this.countEl.textContent=this.formatCount(u))}else{const u=this.single.value.get(),f=d.find(m=>m.value===u);if(f)n.textContent=f.icon?`${f.icon} ${f.label}`:f.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const m=this.placeholderText();n.textContent=m,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!m)}}for(let u=0;u<d.length;u++){const f=this.optionEls[u];if(!f||d[u].disabled)continue;const m=c.includes(d[u].value);f.setAttribute("aria-selected",String(m)),f.classList.toggle("ui-select__option--selected",m);const h=f.querySelector(".ui-select__check");h&&(h.textContent=m?"✓":"");const v=f.querySelector(".ui-select__checkbox");v&&(v.textContent=m?"✓":"")}})),this.track(N(()=>{const d=this.open.get();this.dropdownEl.classList.toggle("open",d),i.classList.toggle("ui-select__chevron--open",d),this.triggerEl.setAttribute("aria-expanded",String(d)),d?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),d&&B(()=>{const c=this.currentOptions(),u=this.selectedValues(),f=c.findIndex(h=>!h.disabled&&u.includes(h.value)),m=c.findIndex(h=>!h.disabled);this.highlightIndex.set(f>=0?f:m)})})),this.track(N(()=>{const d=this.highlightIndex.get();for(let c=0;c<this.optionEls.length;c++)this.optionEls[c].classList.toggle("ui-select__option--highlighted",c===d);d>=0&&this.optionEls[d]&&(this.triggerEl.setAttribute("aria-activedescendant",`${this.uid}-opt-${d}`),this.optionEls[d].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(ze(this.props.disabled)?this.track(N(()=>{const d=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",d),this.triggerEl.disabled=d})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}chooseOption(e){if(this.isMulti){const t=this.multi.values.get();this.multi.values.set(t.includes(e)?t.filter(s=>s!==e):[...t,e]);return}ue(()=>{this.single.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}commitHighlighted(){const e=this.highlightIndex.get(),t=this.currentOptions();e>=0&&e<t.length&&!t[e].disabled&&this.chooseOption(t[e].value)}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.open.get()?this.commitHighlighted():this.open.set(!0);break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":e.preventDefault(),this.commitHighlighted();break;case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=this.currentOptions();if(t.length===0||!t.some(n=>!n.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};ce.styles=`
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
    `,ce.seq=0;let U=ce;function Ai(r){if(!r)return{visible:!1,selfAllowed:!1,guestAllowed:!1,blockedMessage:null};const e=r.seats.length>0,t=r.claimedSeats.some(i=>i.viewerMayRelease),s=r.viewer.claimSeat.allowed,n=r.viewer.claimSeatAsGuest.allowed;return{visible:e||t,selfAllowed:e&&s,guestAllowed:e&&n,blockedMessage:e&&!s&&!n?r.viewer.claimSeat.message??r.viewer.claimSeatAsGuest.message??"Claiming seats is not available on this round.":null}}function Hi(r,e){const t=[];if(r.groupId!==null&&e.length>0){const s=e.findIndex(n=>n.id===r.groupId);if(s>=0){t.push(`Group ${s+1}`);const n=e[s].startTime;n.includes(":")&&t.push(n)}}return r.category!==null&&t.push(r.category),t.join(" · ")}function Mi(r){return(r?.claimedSeats??[]).filter(e=>e.viewerMayRelease)}const Fi=y(`
    <div bind="root" class="seat-card hidden">
        <span class="seat-card__label">Who's playing?</span>
        <p bind="hint" class="seat-card__hint">This round has open seats — claim one to score.</p>
        <p bind="blocked" class="seat-card__blocked hidden"></p>
        <div bind="rows" class="seat-card__rows"></div>
        <div bind="releaseRows" class="seat-card__rows"></div>
        <p bind="err" class="seat-card__err"></p>
    </div>
`),Bi=y(`
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
`),Gi=y(`
    <div class="seat-card__release">
        <span class="seat-card__who">
            <span bind="name" class="seat-card__name"></span>
            <span bind="context" class="seat-card__context"></span>
        </span>
        <button bind="release" class="seat-card__btn seat-card__btn--ghost" type="button">Not me — release</button>
    </div>
`);class qi extends P{static styles=`
        .seat-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${O()}
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
                ${S()}
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
    `;svc=this.inject(se);auth=this.inject(A);router=this.inject(R);tokenQ=this.router.query("token");claiming=new p(!1);error=new p("");diagnostics=new p([]);expandedSeat=new p(null);teeId=new p("");tees=new p([]);loadedForCourseId=null;guestName=new p("");guestHcp=new p("");guestGender=new p("M");state(){return Ai(this.svc.startList.get())}ensureTeesLoaded(){if(!this.state().visible)return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,_.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}toggleSeat(e){this.diagnostics.set([]),this.error.set(""),this.expandedSeat.set(this.expandedSeat.get()===e?null:e)}guestHcpValue(){const e=Number.parseFloat(this.guestHcp.get().replace(",","."));return Number.isFinite(e)?e:null}async claim(e,t,s){const n=this.tokenQ.get(),i=this.teeId.get();if(!(!n||!i||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const l=await _.friendlyRounds.claimSeat({token:n,seatId:e,identity:t,teeId:i,clientEventId:s});l.ok?(this.expandedSeat.set(null),this.guestName.set(""),this.guestHcp.set(""),await this.svc.loadByToken(n)):this.diagnostics.set(l.diagnostics)}catch{this.error.set("Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}async claimSelf(e){const t=this.auth.currentUser.get()?.id??"anon";await this.claim(e,{kind:"self"},`claim-seat:${e}:${t}:${this.teeId.get()}`)}async claimGuest(e){const t=this.guestName.get().trim(),s=this.guestHcpValue();!t||s===null||await this.claim(e,{kind:"guest",name:t,handicapIndex:s,gender:this.guestGender.get()==="F"?"F":"M"},crypto.randomUUID())}async release(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const s=await _.friendlyRounds.releaseSeat({token:t,seatId:e,clientEventId:crypto.randomUUID()});s.ok?await this.svc.loadByToken(t):this.diagnostics.set(s.diagnostics)}catch{this.error.set("Could not release right now. Try again.")}finally{this.claiming.set(!1)}}}seatRow(e,t){const s=()=>this.expandedSeat.get()===e.seatId&&this.state().blockedMessage===null,n=this.wireEl(Bi,{label:()=>e.label,context:()=>Hi(e,this.svc.groups()),toggle:{textContent:()=>this.expandedSeat.get()===e.seatId?"Close":"Claim",disabled:()=>this.state().blockedMessage!==null,onclick:()=>this.toggleSeat(e.seatId)},form:{className:()=>s()?"seat-card__form":"seat-card__form hidden"},selfBtn:{className:()=>this.state().selfAllowed?"seat-card__btn seat-card__btn--wide":"seat-card__btn seat-card__btn--wide hidden",disabled:()=>this.claiming.get()||!this.teeId.get(),onclick:()=>{this.claimSelf(e.seatId)}},guestBox:{className:()=>this.state().guestAllowed?"seat-card__guest":"seat-card__guest hidden"},guestName:{oninput:d=>this.guestName.set(d.target.value)},guestHcp:{oninput:d=>this.guestHcp.set(d.target.value)},guestBtn:{disabled:()=>this.claiming.get()||!this.teeId.get()||this.guestName.get().trim()===""||this.guestHcpValue()===null,onclick:()=>{this.claimGuest(e.seatId)}},diag:{className:()=>this.diagnostics.get().length>0?"seat-card__diag":"seat-card__diag hidden",textContent:()=>this.diagnostics.get().map(d=>d.message).join(" · ")}},t),i=new U({value:this.teeId,options:{get:()=>this.tees.get().map(d=>({value:d.id,label:d.name}))},placeholder:"Tee"});i.mount(this.ref(n,"teeHost")),t(()=>i.destroy());const l=new U({value:this.guestGender,options:{get:()=>[{value:"M",label:"Men’s tee rating"},{value:"F",label:"Women’s tee rating"}]},placeholder:"Rating"});return l.mount(this.ref(n,"genderHost")),t(()=>l.destroy()),n}render(){this.track(N(()=>this.ensureTeesLoaded()));const e=this.wire(Fi,{root:{className:()=>this.state().visible?"seat-card":"seat-card hidden"},hint:{className:()=>(this.svc.startList.get()?.seats.length??0)>0&&this.state().blockedMessage===null?"seat-card__hint":"seat-card__hint hidden"},blocked:{className:()=>this.state().blockedMessage!==null?"seat-card__blocked":"seat-card__blocked hidden",textContent:()=>this.state().blockedMessage??""},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.svc.startList.get()?.seats??[],(t,s,n)=>this.seatRow(t,n),t=>t.seatId),this.$each(this.ref(e,"releaseRows"),()=>Mi(this.svc.startList.get()),(t,s,n)=>this.wireEl(Gi,{name:()=>t.displayName,context:()=>`holds “${t.seatLabel}”`,release:{disabled:()=>this.claiming.get(),onclick:()=>{this.release(t.seatId)}}},n),t=>t.seatId),e}}function Ki(r,e,t){if(!e||t!=="not_started")return!1;for(const s of r)for(const n of s.players)if(n.playerId===e)return!1;return!0}function Vi(r){if(!r)return{visible:!1,blockedMessage:null};const e=r.viewer.join;return e.allowed?{visible:!0,blockedMessage:null}:e.code==="window_not_open"||e.code==="window_closed"?{visible:!0,blockedMessage:e.message??"Sign-up is closed right now."}:{visible:!1,blockedMessage:null}}const wt="new";function Ui(r,e=!0){const t=r.map((n,i)=>{const l=n.ballIds.length,d=[`Group ${i+1}`];return n.startTime.includes(":")&&d.push(n.startTime),{value:n.id,label:`${d.join(" · ")} — ${l} of ${n.capacity}`,disabled:l>=n.capacity}}),s=t.find(n=>!n.disabled);return e&&t.push({value:wt,label:"Start a new group",disabled:!1}),{options:t,defaultValue:s?.value??(e?wt:"")}}const Wi=y(`
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
`);class Yi extends P{static styles=`
        .join-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${O()}
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
                ${S()}
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
    `;svc=this.inject(se);auth=this.inject(A);router=this.inject(R);tokenQ=this.router.query("token");joining=new p(!1);error=new p("");diagnostics=new p([]);teeId=new p("");tees=new p([]);loadedForCourseId=null;groupChoice=new p("");policyState(){return Vi(this.svc.startList.get())}eligible(){return this.policyState().visible&&Ki(this.svc.balls.get(),this.auth.currentUser.get()?.id??null,this.svc.round.get()?.status??null)}ensureTeesLoaded(){if(!this.eligible())return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,_.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}needsProfileUpdate(){return this.diagnostics.get().some(e=>e.code==="missing_gender"||e.code==="missing_handicap_index")}async join(){const e=this.tokenQ.get(),t=this.teeId.get();if(!(!e||!t||this.joining.get())){this.error.set(""),this.diagnostics.set([]),this.joining.set(!0);try{const s=this.groupChoice.get(),n=await _.friendlyRounds.join({token:e,teeId:t,...s?{groupChoice:s}:{}});n.ok?await this.svc.loadByToken(e):this.diagnostics.set(n.diagnostics)}catch(s){this.error.set(s instanceof G&&s.status===409?s.message??"You already play in this round, or it has already started.":"Could not join right now. Try again.")}finally{this.joining.set(!1)}}}render(){this.track(N(()=>this.ensureTeesLoaded()));const e=new k(()=>Ui(this.svc.groups(),this.svc.startList.get()?.viewer.createGroup.allowed??!0));this.track(N(()=>{const i=e.get(),l=this.groupChoice.get();(!l||!i.options.some(d=>d.value===l&&!d.disabled))&&this.groupChoice.set(i.defaultValue)}));const t=this.wire(Wi,{root:{className:()=>this.eligible()?"join-card":"join-card hidden"},blocked:{className:()=>this.policyState().blockedMessage!==null?"join-card__blocked":"join-card__blocked hidden",textContent:()=>this.policyState().blockedMessage??""},groupRow:{className:()=>this.svc.groups().length>0&&this.policyState().blockedMessage===null?"join-card__group":"join-card__group hidden"},row:{className:()=>this.policyState().blockedMessage===null?"join-card__row":"join-card__row hidden"},join:{disabled:()=>this.joining.get()||!this.teeId.get(),onclick:()=>{this.join()}},diag:{className:()=>this.diagnostics.get().length>0?"join-card__diag":"join-card__diag hidden"},diagText:{textContent:()=>this.diagnostics.get().map(i=>i.message).join(" · ")},profileLink:{className:()=>this.needsProfileUpdate()?"join-card__profile-link":"join-card__profile-link hidden",onclick:()=>this.router.navigate("/profile")},err:{textContent:()=>this.error.get()}}),s=new U({value:this.teeId,options:{get:()=>this.tees.get().map(i=>({value:i.id,label:i.name}))},placeholder:"Tee"});s.mount(this.ref(t,"teeHost")),this.track(()=>s.destroy());const n=new U({value:this.groupChoice,options:{get:()=>e.get().options},placeholder:"Group"});return n.mount(this.ref(t,"groupHost")),this.track(()=>n.destroy()),t}}const Qi=y(`
    <div bind="root" class="edit-card hidden">
        <div class="edit-card__text">
            <span class="edit-card__label">Round setup</span>
            <p class="edit-card__hint">Change tees, add a format, adjust groups — scored balls are preserved.</p>
        </div>
        <button bind="edit" class="edit-card__btn" type="button">Edit round</button>
    </div>
`);class Xi extends P{static styles=`
        .edit-card {
            margin-top: ${a("lg")};
            padding: ${a("lg")};
            ${O()}
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
                ${S()}
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
    `;router=this.inject(R);tokenQ=this.router.query("token");editable=new p(!1);render(){const e=this.tokenQ.get();return e&&_.friendlyRounds.setup({token:e}).then(t=>this.editable.set(t.editable===!0)).catch(()=>this.editable.set(!1)),this.wire(Qi,{root:{className:()=>this.editable.get()?"edit-card":"edit-card hidden"},edit:{onclick:()=>{const t=this.tokenQ.get();t&&this.router.navigate("/create",{query:{token:t}})}}})}}function Ji(r,e){if(!e)return!1;for(const t of r)for(const s of t.players)if(s.playerId===e)return!0;return!1}const Zi=y(`
    <div bind="root" class="leave-card hidden">
        <button bind="leaveBtn" class="leave-card__btn" type="button">Remove me from this round</button>
        <p bind="diag" class="leave-card__diag"></p>
        <p bind="err" class="leave-card__err"></p>
        <div bind="confirmHost"></div>
    </div>
`);class er extends P{static styles=`
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
    `;svc=this.inject(se);auth=this.inject(A);router=this.inject(R);tokenQ=this.router.query("token");open=new p(!1);leaving=new p(!1);error=new p("");diagnostics=new p([]);eligible(){return Ji(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async leave(){const e=this.tokenQ.get();if(!(!e||this.leaving.get())){this.error.set(""),this.diagnostics.set([]),this.leaving.set(!0);try{const t=await _.friendlyRounds.leave({token:e});t.ok?await this.svc.loadByToken(e):this.diagnostics.set(t.diagnostics)}catch{this.error.set("Could not remove you right now. Try again.")}finally{this.leaving.set(!1)}}}render(){const e=this.wire(Zi,{root:{className:()=>this.eligible()?"leave-card":"leave-card hidden"},leaveBtn:{onclick:()=>this.open.set(!0),disabled:()=>this.leaving.get()},diag:{textContent:()=>this.diagnostics.get().map(t=>t.message).join(" · ")},err:{textContent:()=>this.error.get()}});return this.spawn(V,this.ref(e,"confirmHost"),{open:this.open,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.leave()}}),e}}function tr(r){return!(r.tab!=="leaderboard"||!r.pageVisible||r.status==="complete")}const sr=2e4;function nr(r){if(!(r===null||r===""))return/^\d+$/.test(r)?Number(r):r}const ir=y(`
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
`),rr=y('<button bind="pill" class="round-view__fmt" type="button"></button>'),or=y('<button bind="pill" class="round-view__grp" type="button"></button>');class ar extends P{static styles=`
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
                ${O()}
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
                    ${q()}
                    flex: 1;
                    font-size: 0.8rem;
                    color: ${o("text-muted")};
                }
                & .round-view__copy {
                    ${S()}
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
    `;svc=this.inject(se);router=this.inject(R);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new p(this.initPos.tab);pageVisible=new p(!document.hidden);hasRound=new k(()=>this.svc.round.get()!==null);hasScoring=new k(()=>this.svc.balls.get().length>0);deleteOpen=new p(!1);finishOpen=new p(!1);isComplete=new k(()=>this.svc.round.get()?.status==="complete");shareUrl=new k(()=>{const e=this.tokenQ.get(),t="/tapscore/".replace(/\/+$/,"");return e?`${location.origin}${t}/round?token=${e}`:""});render(){this.track(N(()=>{const d=this.tokenQ.get();d&&this.svc.loadByToken(d,this.initPos).then(()=>{this.tab.get()==="leaderboard"&&this.svc.loadResult()})}));const e=()=>{this.svc.flushPending()};window.addEventListener("online",e),this.track(()=>window.removeEventListener("online",e));const t=()=>this.pageVisible.set(!document.hidden);document.addEventListener("visibilitychange",t),this.track(()=>document.removeEventListener("visibilitychange",t));let s=null;this.track(N(()=>{const d=tr({tab:this.tab.get(),pageVisible:this.pageVisible.get(),status:this.svc.round.get()?.status??null});d&&s===null?s=setInterval(()=>{this.svc.pollResult()},sr):!d&&s!==null&&(clearInterval(s),s=null)})),this.track(()=>{s!==null&&clearInterval(s)}),this.track(N(()=>{const d=this.tab.get(),c=this.svc.selectedSlotDefId(),u=this.svc.holeIdx.get();if(this.router.route.get()!=="/round"||!this.hasRound.get())return;const f=this.tokenQ.get();if(!f)return;const m={token:f};d==="leaderboard"&&(m.tab="board");const h=this.svc.round.get()?.formatSlots[0]?.slotDefId??null;c&&c!==h&&(m.slot=c),u>0&&(m.hole=u+1),this.router.navigate(this.router.route.get(),{replace:!0,query:m})}));const n={not_started:"Not started",active:"Live",complete:"Finished"},i=this.wire(ir,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},course:()=>this.svc.round.get()?.courseNameSnapshot??"Round",status:()=>{const d=this.svc.round.get()?.status??"not_started";return n[d]??d},date:()=>this.svc.round.get()?.date??"",route:()=>{const d=this.svc.round.get();return d?`${d.playHoles.length} holes`:""},scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},groupTabs:{className:()=>this.svc.groups().length>1?"round-view__groups":"round-view__groups hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},finishBtn:{textContent:()=>this.isComplete.get()?"Reopen round":"Finish round",onclick:()=>this.finishOpen.set(!0),disabled:()=>this.svc.finishing.get()},deleteBtn:{onclick:()=>this.deleteOpen.set(!0),disabled:()=>this.svc.deleting.get()},dock:{className:()=>this.hasRound.get()&&!this.svc.keypadOpen.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const d=this.svc.currentPlayedHole();return d?this.svc.occLabel(d.playHoleId):""},holeSi:()=>{const d=this.svc.currentPlayHole()?.baseStrokeIndex;return d!=null?String(d):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});this.$each(this.ref(i,"groupTabs"),new k(()=>this.svc.groups()),(d,c,u)=>this.groupPill(c,u),d=>d.id),this.$each(this.ref(i,"formats"),new k(()=>this.svc.round.get()?.formatSlots??[]),(d,c,u)=>this.slotPill(d,c,u),d=>d.slotDefId),this.spawn(ri,this.ref(i,"scoring")),this.spawn(zi,this.ref(i,"leaderboard")),this.spawn(qi,this.ref(i,"seats")),this.spawn(Xi,this.ref(i,"edit")),this.spawn(Li,this.ref(i,"claim")),this.spawn(Yi,this.ref(i,"join")),this.spawn(er,this.ref(i,"leave")),this.spawn(V,this.ref(i,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:"This permanently removes the round and all its scores for everyone. This can't be undone.",confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.svc.deleteRound().then(d=>{d&&this.router.navigate("/")})}}),this.spawn(V,this.ref(i,"finishConfirmHost"),{open:this.finishOpen,title:"Finish or reopen round",message:()=>this.isComplete.get()?"Reopen this round? It'll move back to your ongoing rounds.":"Finish this round? It'll move to your finished rounds. You can still edit or reopen it any time.",cancelLabel:"Cancel",onconfirm:()=>{this.isComplete.get()?this.svc.reopenRound():this.svc.finishRound()}});const l=d=>{d.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1),d.key==="Escape"&&this.finishOpen.get()&&this.finishOpen.set(!1)};return window.addEventListener("keydown",l),this.track(()=>window.removeEventListener("keydown",l)),i}readUrlPosition(){const e=new URLSearchParams(location.search),t=e.get("slot"),s=Number(e.get("hole"));return{tab:e.get("tab")==="board"?"leaderboard":"score",selectedSlot:nr(t),holeIdx:Number.isFinite(s)&&s>0?s-1:0}}groupPill(e,t){return this.wireEl(or,{pill:{textContent:()=>{const s=this.svc.groups()[e];if(!s)return`Group ${e+1}`;const n=[`Group ${e+1}`];s.startTime.includes(":")&&n.push(s.startTime);const i=this.svc.playHoleById(s.startPlayHoleId)?.courseHoleNumber;return i!==void 0&&s.startOrdinal!==1&&n.push(`H${i}`),n.join(" · ")},className:()=>this.svc.groupIdx.get()===e?"round-view__grp active":"round-view__grp",onclick:()=>this.svc.groupIdx.set(e)}},t)}slotPill(e,t,s){return this.wireEl(rr,{pill:{textContent:()=>Yt(e),className:()=>this.tab.get()==="leaderboard"&&this.svc.selectedSlotDefId()===e.slotDefId?"round-view__fmt active":"round-view__fmt",onclick:()=>{this.svc.selectSlot(e.slotDefId),this.tab.get()!=="leaderboard"&&(this.tab.set("leaderboard"),this.svc.loadResult())}}},s)}}function Q(r){const e=r.trim().replace(",",".");if(e==="")return null;const t=e.startsWith("+"),s=Number.parseFloat(t?e.slice(1):e);return Number.isFinite(s)?t?-s:s:null}function es(r){return r<0?`+${String(-r)}`:String(r)}function lr(r){if(!r)return null;const e=/^slots\[slot-(\d+)\]/.exec(r);return e?Number(e[1]):null}function dr(r){if(!r)return null;const e=/^formats\[(\d+)\]/.exec(r);return e?Number(e[1]):null}function ts(r){return dr(r.path)??lr(r.path)}function cr(r,e){return r.filter(t=>ts(t)===e)}function ur(r){return r.filter(e=>!e.path?.startsWith("producers")&&!e.path?.startsWith("playingGroups")&&e.path!=="route"&&ts(e)===null)}function ee(r){return`${r} ${r===1?"player":"players"}`}function ye(r,e){const t=r.formatId?e(r.formatId)??r.formatId:null,s=r.teamLabel;switch(r.code){case"team_size_above_max":if(t&&s&&r.actual!==void 0&&r.allowedMax!==void 0)return`${s} has ${ee(r.actual)} — ${t} allows at most ${r.allowedMax} per team.`;break;case"team_size_below_min":if(t&&s&&r.actual!==void 0&&r.allowedMin!==void 0)return`${s} has ${ee(r.actual)} — ${t} needs at least ${r.allowedMin} per team.`;break;case"empty_team_grouping":if(t&&s)return`${s} has no players — add at least one, or remove the team.`;break;case"team_count_above_max":if(t&&r.actual!==void 0&&r.allowedMax!==void 0)return`${r.actual} teams — ${t} allows at most ${r.allowedMax}.`;break;case"team_count_below_min":if(t&&r.actual!==void 0&&r.allowedMin!==void 0)return`${r.actual} teams — ${t} needs at least ${r.allowedMin}.`;break;case"slot_ball_count_above_max":if(t&&r.actual!==void 0&&r.allowedMax!==void 0)return`${ee(r.actual)} in ${t} — it scores at most ${r.allowedMax}.`;break;case"slot_ball_count_below_min":if(t&&r.actual!==void 0&&r.allowedMin!==void 0)return`${ee(r.actual)} in ${t} — it needs at least ${r.allowedMin}.`;break;case"slot_ball_count_not_multiple":if(t&&r.actual!==void 0)return`${t} pairs its balls, so it needs an even number — ${ee(r.actual)} won't pair up.`;break;case"missing_team_grouping":if(t)return`${t} compares teams — under Teams, group the players into “Separate balls (a side)” teams, then tick them under “Scores”.`;break;case"ball_mode_violation":if(t&&r.actual!==void 0)return r.actual>1?`${t} is played with everyone on their own ball — a “One combined ball” team can’t play it. Use a “Separate balls (a side)” team instead.`:`${t} is played on one shared team ball — under Teams, group the players into a “One combined ball” team, then tick that team instead of the individual players.`;break;case"producer_count_violation":if(t&&r.actual!==void 0&&r.allowedMin!==void 0&&r.allowedMax!==void 0){if(r.allowedMax===1&&r.actual>1)return`${t} is played with everyone on their own ball — a “One combined ball” team can’t play it. Use a “Separate balls (a side)” team instead.`;const n=r.allowedMin===r.allowedMax?`exactly ${ee(r.allowedMin)}`:`${r.allowedMin}–${r.allowedMax} players`;return`A ball in ${t} has ${ee(r.actual)} — it needs ${n} per ball.`}break;case"producer_has_scores":return r.message;case"scored_ball_orphaned":return r.message;case"edit_locked_course_route":return"Scores have already been recorded — the course and route are locked for this round.";case"round_complete":return"This round is complete — its setup can no longer be edited.";case"not_editable":return"This round can no longer be edited."}return r.message}function hr(r){return r?r.type==="flat"?String(r.pct):r.bands.length>0?String(r.bands[0].pct):"100":"100"}function pr(r){const e={};if(!r||typeof r!="object")return e;for(const[t,s]of Object.entries(r))typeof s=="string"&&(e[t]=s);return e}function mr(r){const e=r.roundType;if(e==="full_18"||e==="front_9"||e==="back_9")return{preset:e,startHole:fr(r)};const t=(r.route?.playHoles??[]).map(l=>l.courseHoleNumber),s=t[0]??1,n=new Set(t);return{preset:t.length<=9&&[...n].every(l=>l<=9)?"front_9":t.length<=9&&[...n].every(l=>l>=10)?"back_9":"full_18",startHole:s}}function fr(r){return r.roundType==="back_9"?10:1}function gr(r,e=()=>""){let t=1,s=1,n=1,i=1;const l=new Map,d=r.producers.map(b=>{const I=t++;l.set(b.producerDefId,I);const H=b.playerRef.kind==="guest";return{key:I,name:e(b.producerDefId),handicapIndex:es(b.handicapIndex),gender:b.gender??"M",teeId:b.teeId,producerDefId:b.producerDefId,...H?{guestPlayerId:b.playerRef.id}:{playerId:b.playerRef.id,genderKnown:b.gender!=null}}}),c=new Map;(r.teams??[]).forEach(b=>{c.set(b.id,s++)});const u=(r.teams??[]).map(b=>{const I=c.get(b.id),H={},F={};for(const E of b.members)if("producerDefId"in E){const M=l.get(E.producerDefId);M!==void 0&&(H[M]=String(E.allowancePct))}else{const M=c.get(E.teamId);M!==void 0&&(F[M]=!0)}return{key:I,kind:b.kind??"single_ball",formation:b.formation??"scramble",pctByPlayer:H,memberTeams:F,autoCreated:!1}}),f=(r.playingGroups??[]).map(b=>{const I={};for(const H of b.members){const F=l.get(H);F!==void 0&&(I[F]=!0)}return{key:n++,startTime:b.startTime??"",startHole:b.startHole??null,members:I}}),m=r.formats.map(b=>{const I={},H={},F=b.subjects;if(F){const E=new Set;for(const M of F)if(M.kind==="player"){const W=l.get(M.producerDefId);W!==void 0&&E.add(W)}else{const W=c.get(M.teamId);W!==void 0&&(H[W]=!0)}for(const M of d)I[M.key]=E.has(M.key)}return{key:i++,formatId:b.formatId,allowancePct:hr(b.allowanceConfig),subjectPlayers:I,subjectTeams:H,config:pr(b.formatConfig)}}),{preset:h,startHole:v}=mr(r);return{courseId:r.courseId,preset:h,startHole:v,players:d,teams:u,groups:f,formatSlots:m,nextKey:t,nextTeamKey:s,nextGroupKey:n,nextSlotKey:i}}const br=["scramble","greensomes","foursomes","custom"],_e=2,yr="ABCDEFGH",_r={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class vr{loading=new p(!1);error=new p(null);courses=new p([]);tees=new p([]);courseId=new p("");preset=new p("full_18");startHole=new p(1);players=new p([]);teams=new p([]);groups=new p([]);formatSlots=new p([]);picked=new p([]);customOpen=new p(!1);submitting=new p(!1);diagnostics=new p([]);submitError=new p(null);editToken=new p(null);hasScores=new p(!1);editStatus=new p(null);editBlockedReason=new p(null);editPlayedAt=null;catalog=D.get(he);nextKey=1;nextSlotKey=1;nextTeamKey=1;nextGroupKey=1;nextPickKey=1;reset(){this.courses.set([]),this.tees.set([]),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.groups.set([]),this.formatSlots.set([]),this.picked.set([]),this.customOpen.set(!1),this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.editToken.set(null),this.hasScores.set(!1),this.editStatus.set(null),this.editBlockedReason.set(null),this.editPlayedAt=null,this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1,this.nextGroupKey=1,this.nextPickKey=1}async load(){this.catalog.load().then(()=>this.ensureDefaultGame());const e=await j(this.loading,this.error,()=>_.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}async loadForEdit(e){this.reset(),this.editToken.set(e),await this.catalog.load();const t=await j(this.loading,this.error,()=>_.friendlyRounds.setup({token:e}));if(!t)return;if(this.editStatus.set(t.status),!t.editable){this.editBlockedReason.set(t.reason);return}if(t.draft.producers.some(c=>"placeholder"in c)){this.editBlockedReason.set("has_open_seats");return}this.hasScores.set(t.hasScores),this.editPlayedAt=t.draft.playedAt;const s=await j(this.loading,this.error,()=>_.setup.courses());s&&this.courses.set(s);const n=await j(this.loading,this.error,()=>_.setup.teesByCourse({courseId:t.draft.courseId}));this.tees.set(n??[]);const i=await j(this.loading,this.error,()=>_.friendlyRounds.balls({token:e})),l=new Map;for(const c of i??[])for(const u of c.players)l.set(u.producerDefId,u.displayName);const d=gr(t.draft,c=>l.get(c)??"");this.courseId.set(d.courseId),this.preset.set(d.preset),this.startHole.set(d.startHole),this.players.set(d.players),this.teams.set(d.teams),this.groups.set(d.groups),this.formatSlots.set(d.formatSlots),this.picked.set([]),this.customOpen.set(!0),this.nextKey=d.nextKey,this.nextTeamKey=d.nextTeamKey,this.nextGroupKey=d.nextGroupKey,this.nextSlotKey=d.nextSlotKey}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const s=await j(this.loading,this.error,()=>_.setup.teesByCourse({courseId:e}))??[];this.tees.set(s);const n=new Set(s.map(l=>l.id)),i=s[0]?.id??"";this.players.set(this.players.get().map(l=>({...l,teeId:n.has(l.teeId)?l.teeId:i}))),this.players.get().length===0&&this.addPlayer()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}]),this.syncGamesToRoster()}addMe(e){this.addFriend(e)}addFriend(e){if(this.hasPlayer(e.id))return;const t=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:e.displayName,handicapIndex:e.handicapIndex===null?"":es(e.handicapIndex),gender:e.gender??"M",genderKnown:e.gender!=null,teeId:t,playerId:e.id}]),this.syncGamesToRoster()}hasPlayer(e){return this.players.get().some(t=>t.playerId===e)}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e)),this.groups.set(this.groups.get().map(t=>{if(t.members[e]===void 0)return t;const s={...t.members};return delete s[e],{...t,members:s}})),this.syncGamesToRoster()}patchPlayer(e,t){this.players.set(this.players.get().map(s=>s.key===e?{...s,...t}:s))}ensureDefaultGame(){if(this.editToken.get()||this.formatSlots.get().length>0||this.picked.get().length>0||this.catalog.byId("stableford_individual")&&(this.pickGame("stableford_individual"),this.formatSlots.get().length>0))return;const e=this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",s={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{},config:this.defaultConfigFor(t)};this.formatSlots.set([...this.formatSlots.get(),s])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}defaultConfigFor(e){return{...this.catalog.byId(e)?.defaults.formatConfig??{}}}setSlotConfig(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{config:{...n.config,[t]:s}})}slotConfigValue(e,t){return this.slotByKey(e)?.config[t.key]??t.default}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(s=>s.key===e?{...s,...t}:s))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t,config:this.defaultConfigFor(t)})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return yr[e]??`T${e+1}`}presetGames(){return this.catalog.presets()}shapeOfGame(e){const t=this.catalog.byId(e);return t?this.catalog.playableShape(t):null}isIndividualShape(e){return e.size.max===1&&e.count.max===void 0}isIndividualGame(e){const t=this.shapeOfGame(e);return t?this.isIndividualShape(t):!1}minPlayersFor(e){const t=this.shapeOfGame(e);return!t||this.isIndividualShape(t)?0:t.count.min*t.size.min}gameFits(e){return this.players.get().length>=this.minPlayersFor(e)}gameNeedsText(e){const t=this.minPlayersFor(e),s=Math.max(0,t-this.players.get().length);return`Needs ${t} players — add ${s} more.`}gameShapeText(e){const t=this.shapeOfGame(e);if(!t)return"";if(this.isIndividualShape(t))return"Everyone plays their own ball";const s=t.count.max===t.count.min?`${t.count.min} balls`:`${t.count.min}+ balls`,n=t.size.max===1?"one player each":t.size.min===t.size.max?`${t.size.min} players each`:t.size.min===1?"each a player or a team":`${t.size.min}–${t.size.max} players each`;return`${s} · ${n}`}isGamePicked(e){return this.picked.get().some(t=>t.formatId===e)}pickedByKey(e){return this.picked.get().find(t=>t.key===e)??null}gameLabel(e){return this.catalog.labelOf(e)??e}toggleGame(e){const t=this.picked.get().find(s=>s.formatId===e);t?this.unpickGame(t.key):this.pickGame(e)}pickGame(e){const t=this.shapeOfGame(e);if(!t||this.isGamePicked(e)||!this.gameFits(e))return;const s=this.isIndividualShape(t)?null:this.adoptableTeams(t),n=s?{key:this.nextPickKey++,formatId:e,ballCount:s.length,ballByPlayer:this.assignmentFromTeams(s),ballTeams:Object.fromEntries(s.map((i,l)=>[l,i.key]))}:{key:this.nextPickKey++,formatId:e,ballCount:this.isIndividualShape(t)?0:t.count.min,ballByPlayer:this.defaultAssignment(t,this.isIndividualShape(t)?0:t.count.min),ballTeams:{}};this.picked.set([...this.picked.get(),n]),this.regenerateGame(n)}adoptableTeams(e){const t=this.teams.get().filter(n=>n.kind==="multi_ball");if(t.length===0||t.length<e.count.min||e.count.max!==void 0&&t.length>e.count.max)return null;const s=new Set;for(const n of t){const i=this.teamMemberCount(n.key);if(i<e.size.min||i>e.size.max)return null;for(const l of Object.keys(n.pctByPlayer)){if(s.has(Number(l)))return null;s.add(Number(l))}}return t}assignmentFromTeams(e){const t={};for(const s of this.players.get()){const n=e.findIndex(i=>i.pctByPlayer[s.key]!==void 0);n>=0&&(t[s.key]=n)}return t}unpickGame(e){this.picked.set(this.picked.get().filter(t=>t.key!==e)),this.formatSlots.set(this.formatSlots.get().filter(t=>t.gameKey!==e)),this.collectUnreferencedTeams()}collectUnreferencedTeams(){const e=new Set;for(const s of this.formatSlots.get())for(const[n,i]of Object.entries(s.subjectTeams))i&&e.add(Number(n));for(const s of this.picked.get())for(const n of Object.values(s.ballTeams))e.add(n);const t=this.teams.get().filter(s=>!s.autoCreated||e.has(s.key));t.length!==this.teams.get().length&&this.teams.set(t)}defaultAssignment(e,t){const s={};if(t<=0)return s;const n=this.players.get(),i=n.length%t===0?n.length/t:e.size.min,l=Math.max(1,Math.min(i,e.size.max));let d=0;for(let c=0;c<t&&d<n.length;c++)for(let u=0;u<l&&d<n.length;u++,d++)s[n[d].key]=c;return s}gameBalls(e){const t=this.pickedByKey(e);return t?Array.from({length:t.ballCount},(s,n)=>n):[]}ballOf(e,t){const s=this.pickedByKey(e)?.ballByPlayer[t];return s===void 0?null:s}assignBall(e,t,s){const n=this.pickedByKey(e);if(!n)return;const i={...n.ballByPlayer};s===null?delete i[t]:i[t]=s,this.applyGameEdit({...n,ballByPlayer:i})}applyGameEdit(e){this.picked.set(this.picked.get().map(t=>t.key===e.key?e:t)),this.regenerateGame(e),this.syncGamesFromTeams(e.key)}syncGamesFromTeams(e){const t=new Map(this.teams.get().map(i=>[i.key,i])),s=[],n=this.picked.get().map(i=>{if(i.key===e)return i;const l={...i.ballByPlayer};let d=!1;for(const[u,f]of Object.entries(i.ballTeams)){const m=t.get(f);if(!m)continue;const h=Number(u);for(const[v,b]of Object.entries(l)){const I=Number(v);b===h&&m.pctByPlayer[I]===void 0&&(delete l[I],d=!0)}for(const v of Object.keys(m.pctByPlayer)){const b=Number(v);l[b]!==h&&(l[b]=h,d=!0)}}if(!d)return i;const c={...i,ballByPlayer:l};return s.push(c),c});this.picked.set(n);for(const i of s)this.regenerateGame(i)}forkGame(e){const t=this.pickedByKey(e);if(!t)return;const s=this.teams.get(),n={},i=[];let l=-1;for(const[c,u]of Object.entries(t.ballTeams)){const f=s.findIndex(h=>h.key===u);if(f<0)continue;const m=s[f];i.push({...m,key:this.nextTeamKey++,pctByPlayer:{...m.pctByPlayer},memberTeams:{...m.memberTeams},autoCreated:!0}),n[Number(c)]=i.at(-1).key,f>l&&(l=f)}this.teams.set([...s.slice(0,l+1),...i,...s.slice(l+1)]);const d={...t,ballTeams:n};this.picked.set(this.picked.get().map(c=>c.key===e?d:c)),this.regenerateGame(d)}canAddBall(e){const t=this.pickedByKey(e);if(!t||t.ballCount===0)return!1;const s=this.shapeOfGame(t.formatId);return!!s&&(s.count.max===void 0||t.ballCount<s.count.max)}addBall(e){const t=this.pickedByKey(e);!t||!this.canAddBall(e)||this.applyGameEdit({...t,ballCount:t.ballCount+1})}slotForGame(e){return this.formatSlots.get().find(t=>t.gameKey===e)??null}ballMembers(e,t){const s=this.pickedByKey(e);return s?this.players.get().filter(n=>s.ballByPlayer[n.key]===t):[]}sittingOut(e){const t=this.pickedByKey(e);return!t||t.ballCount===0?[]:this.players.get().filter(s=>t.ballByPlayer[s.key]===void 0)}regenerateGame(e){const t=this.shapeOfGame(e.formatId);if(!t)return;const s=this.players.get(),n={},i={},l=[];let d=this.teams.get();for(let m=0;m<e.ballCount;m++){const h=s.filter(E=>e.ballByPlayer[E.key]===m),v=e.ballTeams[m];if(h.length===0){v!==void 0&&(i[m]=v);continue}if(h.length===1&&t.size.min===1){n[h[0].key]=!0,v!==void 0&&(i[m]=v);continue}const b=d.find(E=>E.key===e.ballTeams[m]),I=Object.fromEntries(h.map(E=>[E.key,b?.pctByPlayer[E.key]??"100"]));if(b){d=d.map(E=>E.key===b.key?{...E,kind:"multi_ball",pctByPlayer:I}:E),i[m]=b.key,l.push(b.key);continue}const H={key:this.nextTeamKey++,kind:"multi_ball",formation:"custom",pctByPlayer:I,memberTeams:{},autoCreated:!0},F=this.lastTeamIndexOf(d,i,e);d=[...d.slice(0,F+1),H,...d.slice(F+1)],i[m]=H.key,l.push(H.key)}if(e.ballCount>0)for(const m of s)n[m.key]===void 0&&(n[m.key]=!1);this.teams.set(d),this.picked.set(this.picked.get().map(m=>m.key===e.key?{...m,ballTeams:i}:m));const c=this.formatSlots.get(),u=c.find(m=>m.gameKey===e.key),f={key:u?.key??this.nextSlotKey++,formatId:e.formatId,allowancePct:u?.allowancePct??"100",subjectPlayers:n,subjectTeams:Object.fromEntries(l.map(m=>[m,!0])),config:u?.config??this.defaultConfigFor(e.formatId),gameKey:e.key};this.formatSlots.set(u?c.map(m=>m.key===f.key?f:m):[...c,f]),this.collectUnreferencedTeams()}lastTeamIndexOf(e,t,s){const n=new Set([...Object.values(t),...Object.values(s.ballTeams)]);let i=e.length-1;for(const[l,d]of e.entries())n.has(d.key)&&(i=l);return i}syncGamesToRoster(){const e=this.players.get(),t=new Set(e.map(n=>n.key)),s=this.picked.get().map(n=>{if(n.ballCount===0)return n;const i=this.shapeOfGame(n.formatId)?.size.min??1,l={};for(const[d,c]of Object.entries(n.ballByPlayer))t.has(Number(d))&&c<n.ballCount&&(l[Number(d)]=c);for(const d of e)if(l[d.key]===void 0){for(let c=0;c<n.ballCount;c++)if(Object.values(l).filter(f=>f===c).length<i){l[d.key]=c;break}}return{...n,ballByPlayer:l}});this.picked.set(s);for(const n of s)this.regenerateGame(n);this.syncGamesFromTeams(-1)}gameWarnings(e){const t=this.pickedByKey(e),s=t?this.shapeOfGame(t.formatId):null;if(!t||!s)return[];const n=this.gameLabel(t.formatId);if(!this.gameFits(t.formatId))return[`${n}: ${this.gameNeedsText(t.formatId)}`];const i=[];for(let l=0;l<t.ballCount;l++){const d=this.ballMembers(e,l).length,c=`${n} ball ${this.teamLetter(l)}`;if(d<s.size.min){const u=s.size.min-d;i.push(`${c} needs ${u} more player${u===1?"":"s"}.`)}else d>s.size.max&&i.push(`${c} takes at most ${s.size.max}.`)}return i}gameSummary(e){const t=this.pickedByKey(e);if(!t)return"";const s=i=>i.name.trim()||"Player",n=[];if(t.ballCount===0)n.push("everyone");else{const i=[];for(let d=0;d<t.ballCount;d++){const c=this.ballMembers(e,d);c.length>0&&i.push(c.map(s).join(" & "))}n.push(i.join(" vs "));const l=this.sittingOut(e);l.length>0&&n.push(`${l.map(s).join(", ")} sitting out`)}return n.push(`${this.slotForGame(e)?.allowancePct??"100"}% allowance`),n.filter(i=>i!=="").join(" · ")}teamsOfGame(e){const t=this.pickedByKey(e);if(!t)return[];const s=this.slotForGame(e)?.subjectTeams??{},n=[];for(let i=0;i<t.ballCount;i++){const l=this.teamByKey(t.ballTeams[i]??-1);l&&s[l.key]&&n.push(l)}return n}gameSharedWith(e){const t=new Set(this.teamsOfGame(e).map(i=>i.key));if(t.size===0)return[];const s=this.slotForGame(e)?.key,n=[];for(const i of this.formatSlots.get()){if(i.key===s)continue;Object.entries(i.subjectTeams).some(([d,c])=>c&&t.has(Number(d)))&&n.push(this.gameLabel(i.formatId))}return n}gameSharesSides(e){return this.gameSharedWith(e).length>0}gameSidesText(e){const t=this.pickedByKey(e);if(!t||this.teamsOfGame(e).length===0)return"";const s=this.slotForGame(e)?.subjectTeams??{},n=[];for(let d=0;d<t.ballCount;d++){const c=this.teamByKey(t.ballTeams[d]??-1);if(c&&s[c.key]){n.push(this.teamLabel(c));continue}const u=this.ballMembers(e,d);u.length>0&&n.push(u.map(f=>f.name.trim()||"Player").join(" & "))}const i=n.join(" vs "),l=this.gameSharedWith(e);return l.length===0?`Sides: ${i}.`:`Sides: ${i} — shared with ${this.joinLabels(l)}.`}joinLabels(e){return e.length<=1?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`}adjustGame(e){this.gameSharesSides(e)&&this.forkGame(e);const t=new Set(Object.values(this.pickedByKey(e)?.ballTeams??{}));this.teams.set(this.teams.get().map(s=>t.has(s.key)?{...s,autoCreated:!1}:s)),this.formatSlots.set(this.formatSlots.get().map(s=>s.gameKey===e?{...s,gameKey:void 0}:s)),this.picked.set(this.picked.get().filter(s=>s.key!==e)),this.customOpen.set(!0)}addCustomGame(){this.customOpen.set(!0);const e=new Set(this.formatSlots.get().map(s=>s.formatId)),t=this.catalog.descriptors.get().find(s=>!e.has(s.id));this.addFormatSlot(t?.id)}showFlexible(){return this.customOpen.get()||this.customSlots().length>0||this.customTeams().length>0}customSlots(){return this.formatSlots.get().filter(e=>e.gameKey===void 0)}customTeams(){const e=this.cardOwnedTeamKeys();return this.teams.get().filter(t=>!e.has(t.key))}cardOwnedTeamKeys(){const e=new Set;for(const t of this.picked.get())for(const s of Object.values(t.ballTeams))e.add(s);return e}slotIndex(e){return this.formatSlots.get().findIndex(t=>t.key===e)}formations=br;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{},autoCreated:!1}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,kind:t,memberTeams:t==="single_ball"?{}:s.memberTeams}:s)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,s){const n=this.teamByKey(e);if(!n||n.kind!=="multi_ball"||t===e)return;const i={...n.memberTeams};if(s){if(this.teamMemberCount(e)>=ke)return;i[t]=!0}else delete i[t];this.teams.set(this.teams.get().map(l=>l.key===e?{...l,memberTeams:i}:l))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(s=>t.memberTeams[Number(s)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{let t=!1;const s={...e.subjectTeams};for(const n of this.teams.get())s[n.key]===!0&&!this.teamKindFitsFormat(e.formatId,n.kind)&&(delete s[n.key],t=!0);return t?{...e,subjectTeams:s}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}teamKindFitsFormat(e,t){return this.isSideFormat(e)?t==="multi_ball":t==="single_ball"||this.catalog.acceptsSideSubjects(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const s={...t.memberTeams};return delete s[e],{...t,memberTeams:s}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const s={...t.subjectTeams};return delete s[e],{...t,subjectTeams:s}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.teams.get().findIndex(s=>s.key===e.key);return`Team ${this.teamLetter(Math.max(0,t))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(s=>s.key===e?{...s,formation:t}:s))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,s){const n=this.teamByKey(e);if(!n)return;const i={...n.pctByPlayer};if(s){if(i[t]!==void 0||this.teamMemberCount(e)>=ke)return;i[t]=i[t]??"100"}else delete i[t];this.teams.set(this.teams.get().map(l=>l.key===e?{...l,pctByPlayer:i}:l))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=ke}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let s=0;for(const n of this.players.get()){const i=t.pctByPlayer[n.key];if(i===void 0)continue;const l=this.derivedCH(n);if(!l)return null;s+=this.parsePct(i)*l.ch/100}return Math.round(s)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<_e)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=_e;let s=t;for(const n of this.teams.get())e.memberTeams[n.key]===!0&&n.kind==="single_ball"&&Object.keys(n.pctByPlayer).length>=_e&&s++;return s>=_e}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,s){const n=this.teamByKey(e);!n||n.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(i=>i.key===e?{...i,pctByPlayer:{...i.pctByPlayer,[t]:s}}:i))}groupsEnabled(){return this.groups.get().length>0}splitIntoGroups(){if(this.groupsEnabled())return;const e={};for(const t of this.players.get())e[t.key]=!0;this.groups.set([{key:this.nextGroupKey++,startTime:"",startHole:null,members:e},{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}clearGroups(){this.groups.set([])}addGroup(){this.groupsEnabled()&&this.groups.set([...this.groups.get(),{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}removeGroup(e){const t=this.groups.get().filter(s=>s.key!==e);this.groups.set(t.length>1?t:[])}groupByKey(e){return this.groups.get().find(t=>t.key===e)??null}groupLabel(e){const t=this.groups.get().findIndex(s=>s.key===e.key);return`Group ${Math.max(0,t)+1}`}groupMemberIn(e,t){return this.groupByKey(e)?.members[t]===!0}setGroupMember(e,t,s){this.groups.set(this.groups.get().map(n=>{const i=n.key===e,l=n.members[t]===!0;if(i&&s&&!l)return{...n,members:{...n.members,[t]:!0}};if(l&&(!i||!s)){const d={...n.members};return delete d[t],{...n,members:d}}return n}))}setGroupStartTime(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startTime:t}:s))}setGroupStartHole(e,t){this.groups.set(this.groups.get().map(s=>s.key===e?{...s,startHole:t}:s))}groupSize(e){const t=this.groupByKey(e);return t?this.players.get().filter(s=>t.members[s.key]===!0).length:0}ungroupedPlayers(){if(!this.groupsEnabled())return[];const e=new Set;for(const t of this.groups.get())for(const s of Object.keys(t.members))t.members[Number(s)]&&e.add(Number(s));return this.players.get().filter(t=>!e.has(t.key))}crossGroupTeamWarnings(){if(!this.groupsEnabled())return[];const e=new Map;this.groups.get().forEach((s,n)=>{for(const i of Object.keys(s.members))s.members[Number(i)]&&e.set(Number(i),n)});const t=[];for(const s of this.teams.get()){if(s.kind!=="single_ball"||!this.isTeamLive(s))continue;const n=new Set;for(const i of Object.keys(s.pctByPlayer)){const l=e.get(Number(i));l!==void 0&&n.add(l)}n.size>1&&t.push(`${this.teamLabel(s)} plays one combined ball, but its players are in different groups — keep them in the same group.`)}return t}buildGroups(e,t){return this.groups.get().map(s=>({members:e.filter(n=>s.members[n.key]===!0).map(n=>t.get(n.key)),...s.startTime.trim()!==""?{startTime:s.startTime.trim()}:{},...s.startHole!==null?{startHole:s.startHole}:{}})).filter(s=>s.members.length>0)}diagnosticsForGroups(){return this.diagnostics.get().filter(e=>e.path?.startsWith("playingGroups"))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectPlayers:{...n.subjectPlayers,[t]:s}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,s){const n=this.slotByKey(e);n&&this.patchFormatSlot(e,{subjectTeams:{...n.subjectTeams,[t]:s}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return _r[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,s)=>t-s);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1),this.groups.set(this.groups.get().map(s=>s.startHole!==null&&!t.includes(s.startHole)?{...s,startHole:null}:s))}derivedCH(e){const t=Q(e.handicapIndex);if(t===null)return null;const s=this.teeById(e.teeId);if(!s)return null;const n=s.ratings.find(l=>l.gender===e.gender);if(!n)return null;const i={handicapIndex:t,slope:n.slope,courseRating:n.courseRating,par:n.par};return{ch:Bn(i),raw:Xt(i),rating:n,teeName:s.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}humanizedRoster(){return this.diagnostics.get().filter(e=>e.path==="producers").map(e=>ye(e,t=>this.catalog.labelOf(t)))}humanizedRoute(){return this.diagnostics.get().filter(e=>e.path==="route").map(e=>ye(e,t=>this.catalog.labelOf(t)))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const s of this.formatSlots.get()){for(const n of e)s.subjectPlayers[n.key]!==!1&&t.add(n.key);for(const n of this.teams.get())if(s.subjectTeams[n.key]===!0)for(const i of e)n.pctByPlayer[i.key]!==void 0&&t.add(i.key)}return e.filter(s=>!t.has(s.key))}diagnosticsForFormat(e){return cr(this.diagnostics.get(),e)}humanizedForFormat(e){return this.diagnosticsForFormat(e).map(t=>ye(t,s=>this.catalog.labelOf(s)))}generalDiagnostics(){return ur(this.diagnostics.get())}humanizedGeneral(){return this.generalDiagnostics().map(e=>ye(e,t=>this.catalog.labelOf(t)))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const s=this.liveTeamKeySet(),n=[];for(const i of this.teams.get()){if(!s.has(i.key))continue;const l=e.filter(d=>i.pctByPlayer[d.key]!==void 0).map(d=>({producerDefId:t.get(d.key),allowancePct:this.parsePct(i.pctByPlayer[d.key])}));if(i.kind==="multi_ball")for(const d of this.teams.get())i.memberTeams[d.key]===!0&&d.key!==i.key&&d.kind==="single_ball"&&s.has(d.key)&&l.push({teamId:String(d.key)});n.push({id:String(i.key),label:this.teamLabel(i),formation:i.formation,kind:i.kind,members:l})}return n}buildFormats(e,t){const s=this.liveTeamKeySet();return this.formatSlots.get().map(n=>{const i=this.isSideFormat(n.formatId),l=[];if(!i)for(const d of e)n.subjectPlayers[d.key]!==!1&&l.push({kind:"player",producerDefId:t.get(d.key)});for(const d of this.teams.get())n.subjectTeams[d.key]===!0&&s.has(d.key)&&this.teamKindFitsFormat(n.formatId,d.kind)&&l.push({kind:"team",teamId:String(d.key)});return{formatId:n.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(n.allowancePct)},subjects:l,...Object.keys(n.config).length>0?{formatConfig:{...n.config}}:{}}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),s=e.indexOf(t);return s<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(s),...e.slice(0,s)].map(i=>({courseHoleNumber:i})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}slotSubjectCount(e){const t=this.liveTeamKeySet(),s=this.isSideFormat(e.formatId);let n=0;if(!s)for(const i of this.players.get())e.subjectPlayers[i.key]!==!1&&n++;for(const i of this.teams.get())e.subjectTeams[i.key]===!0&&t.has(i.key)&&this.teamKindFitsFormat(e.formatId,i.kind)&&n++;return n}noSubjectsMessage(e){const t=this.catalog.labelOf(e.formatId)??e.formatId;if(e.gameKey!==void 0)return`${t} has nobody playing — put players on a ball above.`;if(!this.isSideFormat(e.formatId))return`${t} has nothing to score — tick at least one player or team under “Scores”.`;const s=this.teams.get();if(s.some(d=>d.kind==="multi_ball"&&this.isTeamLive(d)))return`${t} has no teams ticked — tick the teams it plays under “Scores”.`;if(s.some(d=>d.kind==="single_ball"&&this.isTeamLive(d)))return`${t} is played between teams whose players play their own balls — a “One combined ball” team doesn’t fit. Under Teams, switch the team to “Separate balls (a side)”, then tick it under “Scores”.`;const n=this.catalog.classifyId(e.formatId),i=n?.teamCount?.min!==void 0&&n.teamCount.min===n.teamCount.max?`${n.teamCount.min} teams`:n?.teamCount?.min!==void 0?`at least ${n.teamCount.min} teams`:"teams",l=n&&n.teamSize.min===n.teamSize.max?` of ${n.teamSize.min} players`:"";return`${t} is a team game — under Teams, create ${i}${l} with kind “Separate balls (a side)”, add the players, then tick the teams under “Scores”.`}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];if(e.forEach((n,i)=>{n.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${i}].name`}),Q(n.handicapIndex)===null&&t.push({code:"missing_index",message:"Handicap index required",path:`producers[${i}].handicapIndex`}),n.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${i}].teeId`})}),this.formatSlots.get().forEach((n,i)=>{this.slotSubjectCount(n)===0&&t.push({code:"no_subjects",message:this.noSubjectsMessage(n),path:`formats[${i}]`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};const s=this.editToken.get();this.submitting.set(!0);try{const n=new Map;e.forEach((h,v)=>{n.set(h.key,h.producerDefId??(s?`p-${h.key}`:`p${v+1}`))});const i=[];for(const h of e){const v=Q(h.handicapIndex),b=h.playerId?{kind:"player",id:h.playerId}:h.guestPlayerId?{kind:"guest",id:h.guestPlayerId}:{kind:"guest",id:(await _.guestPlayers.create({displayName:h.name.trim(),gender:h.gender,handicapIndex:v})).id};i.push({producerDefId:n.get(h.key),playerRef:b,handicapIndex:v,gender:h.gender,teeId:h.teeId})}const{roundType:l,route:d}=this.buildRoute(),c=this.buildTeams(e,n),u=this.buildGroups(e,n),f={courseId:this.courseId.get(),playedAt:this.editPlayedAt??new Date().toISOString().slice(0,10),roundType:l,...d?{route:d}:{},producers:i,...c.length>0?{teams:c}:{},formats:this.buildFormats(e,n),...u.length>0?{playingGroups:u}:{}};if(s){const h=await _.friendlyRounds.editSetup({token:s,draft:f});return h.ok?{ok:!0,token:s}:(this.diagnostics.set(h.diagnostics),{ok:!1})}const m=await _.friendlyRounds.create({draft:f});return m.ok?($e({token:m.friendlyRound.shareToken,courseName:m.round.courseNameSnapshot??"",status:m.round.status,completedAt:m.round.completedAt,lastSeenAt:new Date().toISOString()}),{ok:!0,token:m.friendlyRound.shareToken}):(this.diagnostics.set(m.diagnostics),{ok:!1})}catch(n){return this.submitError.set(n instanceof G?n.message==="Validation failed"?["The server could not read this setup — this should not happen, please report it.",...(n.details??[]).slice(0,3).map(i=>`${i.path}: ${i.message}`)].join(`
`):n.message:s?"Could not save the round. Try again.":"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}class Ye{loading=new p(!1);error=new p(null);player=new p(null);history=new p([]);clubs=new p([]);saving=new p(!1);saveError=new p(null);async load(e=!1){if(!e&&(this.player.get()!==null||this.loading.get()))return;const t=await j(this.loading,this.error,()=>Promise.all([_.players.me(),_.players.myHandicapHistory(),_.clubs.list()]));if(!t)return;const[s,n,i]=t;this.player.set(s),this.history.set(n),this.clubs.set(i)}clear(){this.player.set(null),this.history.set([]),this.error.set(null),this.saveError.set(null)}async saveIndex(e){return await j(this.saving,this.saveError,()=>_.players.updateHandicap({handicapIndex:e}))?(await this.load(!0),!0):!1}async saveGender(e){const t=await j(this.saving,this.saveError,()=>_.players.updateProfile({gender:e}));return t?(this.player.set(t),!0):!1}async saveHomeClub(e){const t=await j(this.saving,this.saveError,()=>_.players.updateProfile({homeClubId:e}));return t?(this.player.set(t),!0):!1}homeClubName(){const e=this.player.get()?.homeClubId;return e?this.clubs.get().find(t=>t.id===e)?.name??null:null}}function Oe(r,e){return r.displayName.localeCompare(e.displayName,"sv",{sensitivity:"base"})}function Qe(r,e="frecency"){return e==="alpha"?[...r].sort(Oe):[...r].sort((t,s)=>{const n=t.frecency,i=s.frecency,l=n>0,d=i>0;if(l!==d)return l?-1:1;if(!l)return Oe(t,s);if(i!==n)return i-n;const c=t.lastPlayedAt?Date.parse(t.lastPlayedAt):NaN,u=s.lastPlayedAt?Date.parse(s.lastPlayedAt):NaN,f=Number.isNaN(c)?Number.NEGATIVE_INFINITY:c,m=Number.isNaN(u)?Number.NEGATIVE_INFINITY:u;return m!==f?m-f:Oe(t,s)})}const wr=1440*60*1e3;function xr(r,e){if(!r)return null;const t=Date.parse(r),s=Date.parse(e);if(Number.isNaN(t)||Number.isNaN(s))return null;const n=Math.floor((s-t)/wr);if(n<=0)return"today";if(n===1)return"yesterday";if(n<7)return`${n} days ago`;if(n<14)return"last week";if(n<30)return`${Math.floor(n/7)} weeks ago`;if(n<60)return"last month";if(n<365)return`${Math.floor(n/30)} months ago`;const i=Math.floor(n/365);return i===1?"last year":`${i} years ago`}function $r(r,e){if(r.sharedRoundCount<=0)return"never played";const t=xr(r.lastPlayedAt,e),s=`played ${r.sharedRoundCount}×`;return t?`${s}, ${t}`:s}const ss=2;function xt(r){return r.trim().length>=ss}function ns(r){return Qe(r,"frecency")}function kr(r,e){return ns([...r.filter(t=>t.id!==e.id),e])}function Sr(r,e){return r.filter(t=>t.id!==e)}function $t(r,e,t){return r.map(s=>s.id===e?{...s,isFriend:t}:s)}function Cr(r,e,t=()=>{},s=300){let n=0,i;return l=>{const d=l.trim(),c=++n;if(i!==void 0&&clearTimeout(i),i=void 0,d.length<ss){e(d,[]);return}i=setTimeout(()=>{r(d).then(u=>{c===n&&e(d,u)},u=>{c===n&&t(d,u)})},s)}}const is="tapscore.friends.sort.v1";function rs(){try{return typeof localStorage<"u"?localStorage:null}catch{return null}}function Tr(r=rs()){if(!r)return"frecency";let e;try{e=r.getItem(is)}catch{return"frecency"}return e==="alpha"?"alpha":"frecency"}function Ir(r,e=rs()){if(e)try{e.setItem(is,r)}catch{}}class Ie{loading=new p(!1);error=new p(null);friends=new p([]);loaded=new p(!1);sortMode=new p(Tr());query=new p("");searching=new p(!1);searchError=new p(null);results=new p([]);resultsFor=new p("");mutating=new p(!1);mutateError=new p(null);runSearch=Cr(e=>_.players.search({q:e}),(e,t)=>{this.searching.set(!1),this.results.set(t),this.resultsFor.set(e)},(e,t)=>{this.searching.set(!1),this.results.set([]),this.resultsFor.set(e),this.searchError.set({code:"network",message:t instanceof Error?t.message:"Search failed. Try again."})});async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;const t=await j(this.loading,this.error,()=>_.friends.list());t&&(this.friends.set(ns(t)),this.loaded.set(!0))}setQuery(e){this.query.set(e),this.searchError.set(null),this.searching.set(e.trim().length>=2),this.runSearch(e)}async add(e){await j(this.mutating,this.mutateError,()=>_.friends.add({friendId:e.id}))&&(this.friends.set(kr(this.friends.get(),{id:e.id,username:e.username,displayName:e.displayName,gender:e.gender,handicapIndex:e.handicapIndex,homeClubName:e.homeClubName,sharedRoundCount:0,lastPlayedAt:null,frecency:0})),this.results.set($t(this.results.get(),e.id,!0)))}setSortMode(e){this.sortMode.set(e),Ir(e)}async remove(e){await j(this.mutating,this.mutateError,()=>_.friends.remove({friendId:e}))&&(this.friends.set(Sr(this.friends.get(),e)),this.results.set($t(this.results.get(),e,!1)))}clear(){this.friends.set([]),this.loaded.set(!1),this.query.set(""),this.results.set([]),this.resultsFor.set(""),this.error.set(null),this.searchError.set(null),this.mutateError.set(null),this.searching.set(!1)}}const Er=["full_18","front_9","back_9"],je=()=>ie()==="sv"?",":".",Nr=y(`
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
`),kt=y(`
    <button bind="key" class="hcp-key" type="button">
        <span bind="num" class="hcp-key__num"></span>
        <span bind="lbl" class="hcp-key__lbl"></span>
    </button>
`),Pr=y(`
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
`),zr=y(`
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
`),Or=y(`
    <div class="fslot__group">
        <span bind="label" class="fslot__label"></span>
        <div bind="options" class="fslot__seg"></div>
    </div>
`),jr=y(`
    <button bind="opt" type="button"></button>
`),St=y(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),Rr=y(`
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
`),Lr=y(`
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
`),Dr=y(`
    <button bind="row" type="button" class="frow">
        <span bind="name" class="frow__name"></span>
        <span bind="username" class="frow__username"></span>
        <span bind="hcp" class="frow__hcp"></span>
    </button>
`),Ct=y(`
    <button bind="card" class="gcard" type="button">
        <span bind="name" class="gcard__name"></span>
        <span bind="tag" class="gcard__tag"></span>
        <span bind="shape" class="gcard__shape"></span>
    </button>
`),Ar=y(`
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
`),Hr=y(`
    <div class="grow">
        <span bind="name" class="grow__name"></span>
        <div bind="seg" class="fslot__seg"></div>
    </div>
`),Tt=y(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`);class Mr extends P{static styles=`
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
                &.hidden { display: none; }
                & h2 {
                    margin: 0 0 ${a("sm")}; font-family: ${o("font-display")};
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
                    ${S()}
                    flex: 1; padding: ${a("md")} 0;
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
                padding: ${a("md")}; ${O()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .player__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .player__name { ${q()} flex: 1; padding: ${a("md")}; font-size: 1rem; }
                & .player__remove {
                    ${S()}
                    width: 38px; height: 38px; flex-shrink: 0;
                    font-size: 1rem; color: ${o("text-muted")};
                }
                & .player__fields { display: flex; gap: ${a("sm")}; align-items: stretch; }
                & .player__index { ${q()} flex: 1; min-width: 0; padding: ${a("md")}; font-size: 1rem; }
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
                ${S()}
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")};
                font-family: inherit; font-weight: 700; font-size: 0.95rem;
            }
            & .setup__add.hidden { display: none; }

            & .setup__friends {
                margin-top: ${a("sm")}; padding: ${a("sm")}; ${O()}
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
                padding: ${a("md")}; ${O()}
                display: flex; flex-direction: column; gap: ${a("sm")};

                & .fslot__top { display: flex; gap: ${a("sm")}; align-items: center; }
                & .fslot__teamname { flex: 1; min-width: 0; font-weight: 700; font-size: 0.95rem; }
                & .fslot__teammeta {
                    margin: ${a("xs")} 0 0; font-size: 0.78rem; color: ${o("text-muted")};
                    &:empty { display: none; }
                }
                & .fslot__format { flex: 1; min-width: 0; font-size: 1rem; }
                & .fslot__remove {
                    ${S()}
                    width: 38px; height: 38px; flex-shrink: 0;
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
                /* The knob host is a pass-through: its children must sit in the
                   card's own column, or an empty host (the formats declaring no
                   knobs — most of them) would still take a gap. */
                & .fslot__configs { display: contents; }
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
                        & input { ${q()} width: 56px; padding: ${a("xs")} ${a("sm")}; font-size: 0.95rem; }
                    }
                }

                & .fslot__seg {
                    display: flex; gap: ${a("xs")};
                    & button {
                        ${S()}
                        flex: 1; padding: ${a("sm")} 0;
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
                    display: flex; align-items: center; gap: ${a("sm")};
                    & .grow__name { flex: 1; min-width: 0; font-size: 0.9rem; }
                    & .fslot__seg { flex: 0 0 auto; & button { min-width: 44px; flex: 0 0 auto; padding: ${a("sm")}; } }
                }
                & .gaddball {
                    ${S()}
                    align-self: flex-start; margin-top: ${a("xs")};
                    padding: ${a("xs")} ${a("sm")};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }
                & .gsummary {
                    margin: 0; padding-top: ${a("xs")}; border-top: 1px solid ${o("border")};
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
                    ${S()}
                    align-self: flex-start; padding: ${a("xs")} ${a("sm")};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }

                & .grp__start {
                    display: flex; gap: ${a("sm")}; align-items: stretch;
                    & .grp__time { ${q()} flex: 1; min-width: 0; padding: ${a("sm")} ${a("md")}; font-size: 1rem; font-family: inherit; }
                    & .grp__hole { flex: 1; min-width: 0; font-size: 1rem; }
                }
            }

            & .setup__create {
                ${S()}
                width: 100%; padding: ${a("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit;
                background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                box-shadow: ${o("shadow-elevated")};
                &:hover { background: ${o("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            & .setup__cancel {
                ${S()}
                width: 100%; margin-top: ${a("md")}; padding: ${a("md")};
                background: none; font-family: inherit; font-weight: 600; font-size: 0.95rem;
                color: ${o("text-muted")};
                &.hidden { display: none; }
            }

            & .setup__blocked {
                padding: ${a("lg")}; ${O()}
                background: ${o("surface-sunken")}; color: ${o("text-muted")};
                font-size: 0.95rem; margin-bottom: ${a("xl")};
                &.hidden { display: none; }
            }

            & .setup__locknote {
                margin: ${a("sm")} 0 0; font-size: 0.8rem; color: ${o("text-muted")};
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
                padding: ${a("sm")} ${a("md")} calc(${a("xl")} + env(safe-area-inset-bottom));
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
            }
            & .hcp__head { display: flex; align-items: center; gap: ${a("md")}; padding: ${a("sm")} ${a("xs")} ${a("md")}; }
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
            & .hcp__bs { ${S()} width: 44px; height: 44px; flex-shrink: 0; font-size: 1.1rem; }
            & .hcp__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
            & .hcp-key {
                ${S()}
                height: 52px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: ${o("font-display")}; font-weight: 700; font-size: 1.2rem;

                & .hcp-key__lbl { font-size: 0.62rem; font-weight: 600; color: ${o("text-muted")}; &:empty { display: none; } }
                &.on {
                    background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")};
                    & .hcp-key__lbl { color: ${o("primary-text")}; }
                }
            }
            & .hcp__actions { display: flex; gap: ${a("sm")}; margin-top: ${a("md")}; }
            & .hcp__cancel { ${S()} flex: 1; padding: ${a("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem; }
            & .hcp__ok {
                ${S()}
                flex: 2; padding: ${a("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem;
                background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")};
                &:hover { background: ${o("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;svc=this.inject(vr);router=this.inject(R);auth=this.inject(A);profile=this.inject(Ye);friends=this.inject(Ie);pickerOpen=new p(!1);hcpPadFor=new p(null);hcpDraft=new p("");render(){const e=this.router.query("token").get(),t=!!e;this.pickerOpen.set(!1),this.hcpPadFor.set(null),t?this.svc.loadForEdit(e):(this.svc.reset(),this.svc.load()),this.auth.currentUser.get()&&(this.profile.load(),this.friends.load());const s=()=>t&&this.svc.editBlockedReason.get()!==null,n=()=>t&&this.svc.hasScores.get(),i=()=>this.profile.player.get(),l=()=>{const h=i();return this.auth.currentUser.get()!==null&&h!==null&&!this.svc.hasPlayer(h.id)},d=this.wire(Nr,{root:{className:()=>s()?"setup setup--blocked":"setup"},back:{textContent:()=>t?"← Back to round":"← Home",onclick:()=>t&&e?this.router.navigate("/round",{query:{token:e}}):this.router.navigate("/")},title:{textContent:()=>t?"Edit round":"New round"},subtitle:{textContent:()=>t?"Change the setup — scored balls are preserved.":"No sign-in required."},blocked:{className:()=>s()?"setup__blocked":"setup__blocked hidden",textContent:()=>this.svc.editBlockedReason.get()==="round_complete"?"This round is complete — its setup can no longer be edited.":this.svc.editBlockedReason.get()==="no_stored_draft"?"This round didn't come from the setup wizard, so it can't be edited here.":this.svc.editBlockedReason.get()==="has_open_seats"?"This round has open seats waiting to be claimed — the wizard cannot edit it yet.":""},lockNote:{className:()=>n()?"setup__locknote":"setup__locknote hidden"},routeErr:{textContent:()=>this.svc.humanizedRoute().join(`
`)},rosterErr:{textContent:()=>this.svc.humanizedRoster().join(`
`)},cancel:{className:()=>t?"setup__cancel":"setup__cancel hidden",onclick:()=>e&&this.router.navigate("/round",{query:{token:e}})},addPlayer:{onclick:()=>this.svc.addPlayer()},addMe:{className:()=>l()?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>`+ Add me (${i()?.displayName??""})`,onclick:()=>{const h=i();h&&this.svc.addMe({id:h.id,displayName:h.displayName,handicapIndex:h.handicapIndex,gender:h.gender})}},addFriends:{className:()=>this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>this.pickerOpen.get()?"− From friends":"+ From friends",onclick:()=>this.pickerOpen.set(!this.pickerOpen.get())},friendPicker:{className:()=>this.pickerOpen.get()&&this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__friends":"setup__friends hidden"},teamsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},formatsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},addTeam:{onclick:()=>this.svc.addTeam()},splitGroups:{className:()=>this.svc.groupsEnabled()?"setup__add hidden":"setup__add",onclick:()=>this.svc.splitIntoGroups()},addGroup:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.addGroup()},clearGroups:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.clearGroups()},groupNote:{textContent:()=>{const h=this.svc.ungroupedPlayers();return h.length===0?"":`${h.map(b=>b.name.trim()||"A player").join(", ")} ${h.length>1?"aren't":"isn't"} in a group yet — every player needs one.`}},groupWarn:{textContent:()=>[...this.svc.crossGroupTeamWarnings(),...this.svc.diagnosticsForGroups().map(h=>h.message)].join(`
`)},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const h=this.svc.playersInNoFormat();return h.length===0?"":`Heads up: ${h.map(b=>b.name.trim()||"A player").join(", ")} ${h.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.humanizedGeneral(),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?t?"Saving…":"Creating…":t?"Save changes":"Create round",onclick:async()=>{const h=await this.svc.submit();h.ok&&this.router.navigate("/round",{query:{token:h.token}})}},hcpPad:{className:()=>this.hcpPadFor.get()!==null?"hcp":"hcp hidden"},hcpBackdrop:{onclick:()=>this.hcpPadFor.set(null)},hcpName:{textContent:()=>this.hcpPlayer()?.name?.trim()||"Player"},hcpCh:{textContent:()=>{const h=this.hcpPlayer();if(!h)return"";const v=this.svc.derivedCH({...h,handicapIndex:this.hcpDraft.get()});return v?`Course handicap ${v.ch} · ${v.teeName}`:"WHS index — “+” means a plus handicap."}},hcpVal:{className:()=>this.hcpDraft.get()?"hcp__val":"hcp__val empty",textContent:()=>this.hcpDraft.get()||"HCP index"},hcpBack:{onclick:()=>this.hcpDraft.set(this.hcpDraft.get().slice(0,-1))},hcpCancel:{onclick:()=>this.hcpPadFor.set(null)},hcpOk:{disabled:()=>this.hcpDraft.get()!==""&&Q(this.hcpDraft.get())===null,onclick:()=>this.hcpCommit()}}),c=this.ref(d,"hcpKeys");for(const h of["1","2","3","4","5","6","7","8","9"])c.appendChild(this.hcpKey(h,"",()=>this.hcpAppendDigit(h)));c.appendChild(this.wireEl(kt,{key:{className:()=>this.hcpDraft.get().startsWith("+")?"hcp-key on":"hcp-key",onclick:()=>this.hcpTogglePlus()},num:{textContent:"+"},lbl:{textContent:"plus hcp"}})),c.appendChild(this.hcpKey("0","",()=>this.hcpAppendDigit("0"))),c.appendChild(this.hcpKey(je(),"",()=>this.hcpAppendSep()));const u=h=>{if(this.hcpPadFor.get()!==null){if(h.key>="0"&&h.key<="9")this.hcpAppendDigit(h.key);else if(h.key===","||h.key===".")this.hcpAppendSep();else if(h.key==="+"||h.key==="-")this.hcpTogglePlus();else if(h.key==="Backspace")this.hcpDraft.set(this.hcpDraft.get().slice(0,-1));else if(h.key==="Enter")this.hcpCommit();else if(h.key==="Escape")this.hcpPadFor.set(null);else return;h.preventDefault()}};document.addEventListener("keydown",u),this.track(()=>document.removeEventListener("keydown",u));const f=this.ref(d,"hcpPad");document.body.appendChild(f),this.track(()=>f.remove()),this.$each(this.ref(d,"presets"),()=>Er,(h,v,b)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(h),className:()=>this.svc.preset.get()===h?"on":"",disabled:()=>n(),onclick:()=>{n()||this.svc.setPreset(h)}}},b),h=>h);const m=h=>this.track(h);return this.mountSelect(this.ref(d,"course"),m,{value:this.bound(m,()=>this.svc.courseId.get(),h=>{h&&h!==this.svc.courseId.get()&&this.svc.selectCourse(h)}),options:{get:()=>{const h=[];let v="";for(const b of this.svc.courses.get())b.clubName!==v&&(h.push({value:`__club:${b.clubName}`,label:b.clubName,disabled:!0}),v=b.clubName),h.push({value:b.id,label:b.name});return h}},placeholder:"Select a course",disabled:{get:()=>n()}}),this.mountSelect(this.ref(d,"startHole"),m,{value:this.bound(m,()=>String(this.svc.startHole.get()),h=>this.svc.startHole.set(Number(h))),options:{get:()=>this.svc.startHoleOptions().map(h=>({value:String(h),label:String(h)}))},disabled:{get:()=>n()}}),this.$each(this.ref(d,"friendRows"),()=>Qe(this.friends.friends.get().filter(h=>!this.svc.hasPlayer(h.id)),"frecency"),(h,v,b)=>this.wireEl(Dr,{row:{onclick:()=>this.svc.addFriend({id:h.id,displayName:h.displayName,handicapIndex:h.handicapIndex,gender:h.gender})},name:()=>h.displayName,username:()=>`@${h.username}`,hcp:()=>h.handicapIndex===null?"–":h.handicapIndex.toFixed(1)},b),h=>h.id),this.$each(this.ref(d,"players"),this.svc.players,(h,v,b)=>this.playerRow(h.key,b),h=>h.key),this.$each(this.ref(d,"cards"),()=>[...this.svc.presetGames().map(h=>h.id),"__custom"],(h,v,b)=>h==="__custom"?this.wireEl(Ct,{card:{className:()=>"gcard gcard--custom",onclick:()=>this.svc.addCustomGame()},name:{textContent:"+ Custom game"},tag:{textContent:"Anything the cards don't cover — teams and formats by hand."},shape:{textContent:""}},b):this.gameCard(h,b),h=>h),this.$each(this.ref(d,"games"),this.svc.picked,(h,v,b)=>this.gamePanel(h.key,b),h=>h.key),this.$each(this.ref(d,"teams"),()=>this.svc.customTeams(),(h,v,b)=>this.teamCard(h.key,b),h=>h.key),this.$each(this.ref(d,"groups"),this.svc.groups,(h,v,b)=>this.groupCard(h.key,b),h=>h.key),this.$each(this.ref(d,"formats"),()=>this.svc.customSlots(),(h,v,b)=>this.formatCard(h.key,b),h=>h.key),d}mountSelect(e,t,s){const n=new U(s);n.mount(e),t(()=>n.destroy())}bound(e,t,s){const n=new p(t());return e(N(()=>n.set(t()))),e(N(()=>{const i=n.get();queueMicrotask(()=>s(i))})),n}eachInto(e,t,s,n,i){const l=new Map,d=new Map;t(()=>{for(const c of d.values())c.forEach(u=>u());d.clear()}),t(N(()=>{const c=s(),u=new Map;for(const[m,h]of c.entries()){const v=i(h,m);if(l.has(v))u.set(v,l.get(v));else{const b=[];u.set(v,n(h,m,I=>b.push(I))),d.set(v,b)}}for(const[m,h]of l)u.has(m)||(h.remove(),d.get(m)?.forEach(v=>v()),d.delete(m));let f=e.firstChild;for(const m of u.values())m===f?f=f.nextSibling:e.insertBefore(m,f);l.clear();for(const[m,h]of u)l.set(m,h)}))}gameCard(e,t){const s=()=>this.svc.gameFits(e);return this.wireEl(Ct,{card:{className:()=>this.svc.isGamePicked(e)?"gcard on":"gcard",disabled:()=>!s(),onclick:()=>this.svc.toggleGame(e)},name:{textContent:()=>this.svc.gameLabel(e)},tag:{textContent:()=>s()?this.svc.catalog.taglineOf(e):this.svc.gameNeedsText(e)},shape:{textContent:()=>s()?this.svc.gameShapeText(e):""}},t)}gamePanel(e,t){const s=()=>this.svc.pickedByKey(e),n=()=>this.svc.slotForGame(e),i=()=>s()?.formatId??"",l=()=>(s()?.ballCount??0)>0,d=this.wireEl(Ar,{title:{textContent:()=>this.svc.gameLabel(i())},remove:{onclick:()=>this.svc.unpickGame(e)},desc:{textContent:()=>this.svc.catalog.byId(i())?.description??""},allowance:{value:n()?.allowancePct??"100",oninput:c=>{const u=n();u&&this.svc.setSlotAllowance(u.key,c.target.value)}},ballGroup:{hidden:()=>!l()},addBall:{className:()=>this.svc.canAddBall(e)?"gaddball":"gaddball hidden",onclick:()=>this.svc.addBall(e)},err:{textContent:()=>{const c=n();return[...this.svc.gameWarnings(e),...c?this.svc.humanizedForFormat(this.svc.slotIndex(c.key)):[]].join(" · ")}},sides:{textContent:()=>this.svc.gameSidesText(e)},fork:{className:()=>this.svc.gameSharesSides(e)?"gadjust":"gadjust hidden",onclick:()=>this.svc.forkGame(e)},summary:{textContent:()=>this.svc.gameSummary(e)},adjust:{onclick:()=>this.svc.adjustGame(e)}},t);return this.eachInto(this.ref(d,"configFields"),t,()=>this.svc.catalog.byId(i())?.configFields??[],(c,u,f)=>{const m=n();if(m)return this.configField(m.key,c,f);const h=document.createElement("div");return h.className="fslot__configs",h},c=>`${i()}:${c.key}`),this.eachInto(this.ref(d,"ballRows"),t,()=>l()?this.svc.players.get():[],(c,u,f)=>this.ballRow(e,c.key,f),c=>c.key),d}ballRow(e,t,s){const n=this.wireEl(Hr,{name:{textContent:()=>this.svc.players.get().find(i=>i.key===t)?.name?.trim()||"Player"}},s);return this.eachInto(this.ref(n,"seg"),s,()=>[...this.svc.gameBalls(e),null],(i,l,d)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>i===null?"–":this.svc.teamLetter(i),className:()=>this.svc.ballOf(e,t)===i?"on":"",onclick:()=>this.svc.assignBall(e,t,i)}},d),i=>String(i)),n}formatCard(e,t){const s=()=>this.svc.slotByKey(e),n=()=>s()?.formatId??"",i=this.wireEl(zr,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(n())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:d=>this.svc.setSlotAllowance(e,d.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(n())?"applied to each side member’s ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.humanizedForFormat(this.svc.slotIndex(e)).join(" · ")}},t);this.mountSelect(this.ref(i,"format"),t,{value:this.bound(t,()=>n(),d=>{d&&d!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,d)}),options:{get:()=>this.svc.catalog.descriptors.get().map(d=>({value:d.id,label:this.svc.catalog.labelOf(d)??d.label}))}}),this.eachInto(this.ref(i,"configFields"),t,()=>this.svc.catalog.byId(n())?.configFields??[],(d,c,u)=>this.configField(e,d,u),d=>`${n()}:${d.key}`);const l=()=>{const d=this.svc.isSideFormat(n()),c=[];d||c.push(...this.svc.players.get().map(u=>({kind:"player",subKey:u.key})));for(const u of this.svc.customTeams())this.svc.teamKindFitsFormat(n(),u.kind)&&c.push({kind:"team",subKey:u.key});return c};return this.eachInto(this.ref(i,"subjectRows"),t,l,(d,c,u)=>this.subjectRow(e,d.kind,d.subKey,u),d=>`${d.kind}${d.subKey}`),i}configField(e,t,s){const n=this.wireEl(Or,{label:{textContent:()=>this.svc.catalog.configLabelOf(t)}},s);return this.eachInto(this.ref(n,"options"),s,()=>t.options,(i,l,d)=>this.wireEl(jr,{opt:{textContent:()=>this.svc.catalog.configLabelOf(i),className:()=>this.svc.slotConfigValue(e,t)===i.value?"on":"",onclick:()=>this.svc.setSlotConfig(e,t.key,i.value)}},d),i=>i.value),n}subjectRow(e,t,s,n){const i=()=>{if(t==="player")return this.svc.players.get().find(u=>u.key===s)?.name?.trim()||"Player";const c=this.svc.teamByKey(s);return c?`${this.svc.teamLabel(c)} (${c.kind==="multi_ball"?"side":"team"})`:"Team"},l=()=>t==="player"?this.svc.subjectPlayerIn(e,s):this.svc.subjectTeamIn(e,s),d=c=>t==="player"?this.svc.setSubjectPlayer(e,s,c):this.svc.setSubjectTeam(e,s,c);return this.wireEl(St,{chk:{checked:()=>l(),onchange:c=>d(c.target.checked)},name:{textContent:()=>i()}},n)}groupCard(e,t){const s=this.wireEl(Lr,{remove:{onclick:()=>this.svc.removeGroup(e)},groupName:{textContent:()=>{const n=this.svc.groupByKey(e);return n?this.svc.groupLabel(n):"Group"}},time:{value:this.svc.groupByKey(e)?.startTime??"",oninput:n=>this.svc.setGroupStartTime(e,n.target.value)},meta:{textContent:()=>{const n=this.svc.groupSize(e);return n===0?"Tick the players who walk with this group.":`${n} player${n===1?"":"s"}`}}},t);return this.mountSelect(this.ref(s,"hole"),t,{value:this.bound(t,()=>{const n=this.svc.groupByKey(e)?.startHole;return n==null?"":String(n)},n=>this.svc.setGroupStartHole(e,n===""?null:Number(n))),options:{get:()=>[{value:"",label:"First hole"},...this.svc.startHoleOptions().map(n=>({value:String(n),label:`Hole ${n}`}))]}}),this.eachInto(this.ref(s,"memberRows"),t,()=>this.svc.players.get(),(n,i,l)=>this.groupMemberRow(e,n.key,l),n=>n.key),s}groupMemberRow(e,t,s){return this.wireEl(St,{chk:{checked:()=>this.svc.groupMemberIn(e,t),onchange:n=>this.svc.setGroupMember(e,t,n.target.checked)},name:{textContent:()=>this.svc.players.get().find(n=>n.key===t)?.name?.trim()||"Player"}},s)}teamCard(e,t){const s=()=>this.svc.teamKindOf(e)==="multi_ball",n=this.wireEl(Rr,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const i=this.svc.teamByKey(e);return i?this.svc.teamLabel(i):"Team"}},compGroup:{hidden:()=>s()},membersLabel:{textContent:()=>s()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const i=this.svc.teamSize(e);if(i===0)return s()?"Tick at least 2 members — a side needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(i<2)return"Add one more member — a team needs at least 2.";if(s())return`${i} balls · a side (scored together by a side format)`;const l=this.svc.teamBallCh(e);return l===null?`${i} players`:`${i} players · plays off CH ${l}`}}},t);return this.mountSelect(this.ref(n,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),i=>this.svc.setTeamKind(e,i==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"One combined ball"},{value:"multi_ball",label:"Separate balls (a side)"}]}}),this.mountSelect(this.ref(n,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",i=>this.svc.setTeamFormation(e,i)),options:{get:()=>this.svc.formations.map(i=>({value:i,label:i[0].toUpperCase()+i.slice(1)}))}}),this.eachInto(this.ref(n,"memberRows"),t,()=>{const i=this.svc.players.get().map(l=>({kind:"player",mKey:l.key}));if(s())for(const l of this.svc.eligibleNestedTeams(e))i.push({kind:"team",mKey:l.key});return i},(i,l,d)=>i.kind==="player"?this.teamMemberRow(e,i.mKey,d):this.teamNestedRow(e,i.mKey,d),i=>`${i.kind}${i.mKey}`),n}teamNestedRow(e,t,s){const n=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(Tt,{chk:{checked:()=>n(),disabled:()=>!n()&&this.svc.teamAtMaxSize(e),onchange:i=>this.svc.setTeamMemberTeam(e,t,i.target.checked)},name:{textContent:()=>{const i=this.svc.teamByKey(t);return i?`${this.svc.teamLabel(i)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},s)}teamMemberRow(e,t,s){const n=()=>this.svc.players.get().find(l=>l.key===t)??null,i=()=>this.svc.teamMemberIn(e,t);return this.wireEl(Tt,{chk:{checked:()=>i(),disabled:()=>!i()&&this.svc.teamAtMaxSize(e),onchange:l=>this.svc.setTeamMember(e,t,l.target.checked)},name:{textContent:()=>n()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!i()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:l=>this.svc.setTeamPct(e,t,l.target.value)}},s)}hcpPlayer(){const e=this.hcpPadFor.get();return e===null?null:this.svc.players.get().find(t=>t.key===e)??null}openHcpPad(e){this.hcpDraft.set(this.svc.players.get().find(t=>t.key===e)?.handicapIndex??""),this.hcpPadFor.set(e)}hcpAppendDigit(e){const t=this.hcpDraft.get(),[s,n]=t.replace("+","").split(/[.,]/);if(n!==void 0){if(n.length>=1)return}else if(s.length>=2)return;this.hcpDraft.set(t+e)}hcpAppendSep(){const e=this.hcpDraft.get();/[.,]/.test(e)||this.hcpDraft.set(e.replace("+","")===""?`${e}0${je()}`:e+je())}hcpTogglePlus(){const e=this.hcpDraft.get();this.hcpDraft.set(e.startsWith("+")?e.slice(1):`+${e.replace("-","")}`)}hcpCommit(){const e=this.hcpPadFor.get();e!==null&&(this.hcpDraft.get()!==""&&Q(this.hcpDraft.get())===null||(this.svc.patchPlayer(e,{handicapIndex:this.hcpDraft.get()}),this.hcpPadFor.set(null)))}hcpKey(e,t,s){return this.wireEl(kt,{key:{onclick:s},num:{textContent:e},lbl:{textContent:t}})}playerRow(e,t){const s=()=>this.svc.players.get().find(l=>l.key===e)??null,n=()=>this.svc.players.get().findIndex(l=>l.key===e),i=this.wireEl(Pr,{name:{value:s()?.name??"",readOnly:()=>!!s()?.playerId,oninput:l=>this.svc.patchPlayer(e,{name:l.target.value})},index:{value:()=>s()?.handicapIndex??"",onclick:()=>this.openHcpPad(e),onfocus:l=>{l.target.blur(),this.openHcpPad(e)}},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const l=s();if(!l)return"";const d=this.svc.derivedCH(l);if(!d)return"";const c=d.rating;return`Course handicap ${d.ch}  ·  ${l.handicapIndex} × ${c.slope}/113 + (${c.courseRating} − ${c.par}) = ${d.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(n()).map(l=>l.message).join(" · ")}},t);return this.mountSelect(this.ref(i,"gender"),t,{value:this.bound(t,()=>s()?.gender??"M",l=>this.svc.patchPlayer(e,{gender:l})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]},disabled:{get:()=>s()?.genderKnown===!0}}),this.mountSelect(this.ref(i,"tee"),t,{value:this.bound(t,()=>s()?.teeId??"",l=>this.svc.patchPlayer(e,{teeId:l})),options:{get:()=>this.svc.tees.get().map(l=>({value:l.id,label:l.name}))},placeholder:"Tee"}),i}}function os(r,e){return g({method:"POST",url:`${L}/auth/login`,body:{username:r,password:e}})}function Fr(){return g({method:"GET",url:`${L}/auth/me`})}function Br(){return g({method:"POST",url:`${L}/auth/logout`,body:{}})}const Re="Something went wrong on our end. Try again in a moment.";function Gr(r,e){const t=(r.details??[]).map(n=>n.path),s=n=>t.some(i=>i===`/${n}`);return s("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":s("username")?"Enter your username.":s("displayName")?"Enter a display name.":s("handicapIndex")?"Handicap index must be a number (or leave it empty).":s("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function It(r,e){if(r instanceof G)switch(r.status){case 400:return Gr(r,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":Re;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return r.status>=500?Re:"That request could not be completed."}return r instanceof Error&&r.message==="Request timeout"?"That took too long. Check your connection and try again.":r instanceof Error?"Cannot reach the server. Check your connection and try again.":Re}const qr=y(`
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
`);class Kr extends P{static styles=`
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
                    ${q()}
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
                        ${S()}
                        padding: ${a("sm")} ${a("lg")};
                        font-size: 0.9rem;
                        font-weight: 700;
                        &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
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
    `;auth=this.inject(A);router=this.inject(R);nextQ=this.router.query("next");mode=new p("login");busy=new p(!1);formError=new p("");username="";password="";displayName="";hcp="";gender=new p(null);clubs=new p([]);homeClubId=new p("");clubsRequested=!1;async loadClubs(){if(!this.clubsRequested){this.clubsRequested=!0;try{this.clubs.set(await _.setup.clubs())}catch{}}}destination(e){const t=this.nextQ.get();return t&&t.startsWith("/")?t:e}async submit(){if(this.formError.set(""),this.mode.get()==="login"){if(!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const s=await os(this.username.trim(),this.password);this.auth.currentUser.set(s),this.auth.error.set(null),this.router.navigate(this.destination("/"),!0)}catch(s){this.formError.set(It(s,"login"))}finally{this.busy.set(!1)}return}const e=this.hcp.trim(),t=e===""?null:Q(e);if(e!==""&&t===null){this.formError.set("Handicap index must be a number (or leave it empty).");return}if(this.password.length<8){this.formError.set("Password must be at least 8 characters.");return}if(!this.username.trim()||!this.displayName.trim()){this.formError.set("Username and display name are required.");return}this.busy.set(!0);try{const s=await _.players.register({username:this.username.trim(),password:this.password,displayName:this.displayName.trim(),handicapIndex:t,gender:this.gender.get(),homeClubId:this.homeClubId.get()||null});this.auth.currentUser.set({id:s.id,username:s.username}),this.router.navigate(this.destination("/"),!0)}catch(s){this.formError.set(It(s,"register"))}finally{this.busy.set(!1)}}render(){const e=()=>this.mode.get()==="register",t=()=>this.auth.loading.get()||this.busy.get(),s=this.wire(qr,{root:{inert:()=>t()},error:{className:()=>this.formError.get()?"error show":"error",textContent:()=>this.formError.get()},form:{onsubmit:async l=>{l.preventDefault(),await this.submit()}},username:{oninput:l=>{this.username=l.target.value}},password:{autocomplete:()=>e()?"new-password":"current-password",oninput:l=>{this.password=l.target.value}},registerFields:{className:()=>e()?"login__register":"login__register hidden"},displayName:{oninput:l=>{this.displayName=l.target.value}},hcp:{oninput:l=>{this.hcp=l.target.value}},submit:{textContent:()=>t()?e()?"Creating account…":"Signing in…":e()?"Create account":"Sign in"},toggle:{textContent:()=>e()?"Have an account? Sign in":"New here? Create an account",onclick:()=>{this.formError.set(""),this.auth.error.set(null);const l=!e();this.mode.set(l?"register":"login"),l&&this.loadClubs()}}}),n=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(s,"gender"),()=>n,(l,d,c)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>l.label,className:()=>this.gender.get()===l.value?"on":"",onclick:()=>this.gender.set(l.value)}},c),l=>l.label);const i=new U({value:this.homeClubId,options:{get:()=>[{value:"",label:"No home club"},...this.clubs.get().map(l=>({value:l.id,label:l.name}))]},placeholder:"No home club"});return i.mount(this.ref(s,"club")),this.track(()=>i.destroy()),s}}const Vr=y(`
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
`),Ur=y(`
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
`),Wr=y(`
    <div class="friend-row">
        <span bind="initials" class="friend-row__badge"></span>
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="subtitle" class="friend-row__subtitle"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="remove" class="friend-row__remove" type="button" aria-label="Remove friend">✕</button>
    </div>
`);function Et(r){return r.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0].toUpperCase()).join("")}class Yr extends P{static styles=`
        .friends {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .friends__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${o("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${S()}
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
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
                    ${S()}
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
                ${q()}
                width: 100%;
                padding: ${a("md")} ${a("lg")};
                font-size: 1rem;
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
                ${O()}

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
                    ${S()}
                    flex-shrink: 0; padding: ${a("sm")} ${a("lg")};
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
                    ${S()}
                    width: 34px; height: 34px; flex-shrink: 0;
                    font-size: 0.9rem; color: ${o("text-muted")};
                }
            }
        }
    `;svc=this.inject(Ie);auth=this.inject(A);router=this.inject(R);render(){const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.load();const t=this.wire(Vr,{anon:{className:()=>e()?"friends__anon hidden":"friends__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},body:{className:()=>e()?"friends__body":"friends__body hidden"},search:{value:()=>this.svc.query.get(),oninput:n=>this.svc.setQuery(n.target.value)},searchHint:{textContent:()=>{const n=this.svc.query.get().trim();return n.length>0&&!xt(n)?"Type at least 2 characters.":this.svc.searching.get()?"Searching…":""}},searchErr:{textContent:()=>this.svc.searchError.get()?.message??""},resultsEmpty:{className:()=>{const n=this.svc.query.get().trim();return xt(n)&&!this.svc.searching.get()&&this.svc.searchError.get()===null&&this.svc.resultsFor.get()===n&&this.svc.results.get().length===0?"friends__empty":"friends__empty hidden"}},friendsEmpty:{className:()=>this.svc.loaded.get()&&this.svc.friends.get().length===0?"friends__empty":"friends__empty hidden"},sortToggle:{className:()=>this.svc.friends.get().length>0?"friends__sort":"friends__sort hidden"},sortFrecency:{"aria-pressed":()=>String(this.svc.sortMode.get()==="frecency"),onclick:()=>this.svc.setSortMode("frecency")},sortAlpha:{"aria-pressed":()=>String(this.svc.sortMode.get()==="alpha"),onclick:()=>this.svc.setSortMode("alpha")}});this.$each(this.ref(t,"results"),this.svc.results,(n,i,l)=>this.wireEl(Ur,{initials:()=>Et(n.displayName),name:()=>n.displayName,username:()=>n.homeClubName?`@${n.username} · ${n.homeClubName}`:`@${n.username}`,hcp:()=>n.handicapIndex===null?"–":n.handicapIndex.toFixed(1),add:{className:()=>this.isFriendNow(n.id)?"friend-row__add hidden":"friend-row__add",disabled:()=>this.svc.mutating.get(),onclick:()=>{const d=this.svc.results.get().find(c=>c.id===n.id);d&&!d.isFriend&&this.svc.add(d)}},added:{className:()=>this.isFriendNow(n.id)?"friend-row__added":"friend-row__added hidden"}},l),n=>n.id);const s=new Date().toISOString();return this.$each(this.ref(t,"friends"),()=>Qe(this.svc.friends.get(),this.svc.sortMode.get()),(n,i,l)=>this.wireEl(Wr,{initials:()=>Et(n.displayName),name:()=>n.displayName,subtitle:()=>{const d=this.svc.friends.get().find(c=>c.id===n.id)??n;return $r(d,s)},hcp:()=>n.handicapIndex===null?"–":n.handicapIndex.toFixed(1),remove:{disabled:()=>this.svc.mutating.get(),onclick:()=>{this.svc.remove(n.id)}}},l),n=>n.id),t}isFriendNow(e){return this.svc.results.get().find(t=>t.id===e)?.isFriend===!0}}const Qr=y(`
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
`),Xr=y(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`);class Jr extends P{static styles=`
        .profile {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .profile__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${o("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${S()}
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
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
                ${O()}

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
                    & input { ${q()} width: 90px; padding: ${a("md")}; font-size: 1rem; text-align: center; }
                    & button {
                        ${S()}
                        padding: ${a("md")} ${a("lg")}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700;
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
                        ${S()}
                        flex: 1;
                        padding: ${a("sm")} 0;
                        font-family: inherit;
                        font-size: 0.9rem;
                        font-weight: 700;
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
                ${O()}

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

            /* Only rendered for a super admin — the entry point to /admin. */
            & .profile__admin {
                display: block;
                width: 100%;
                margin-top: ${a("xl")};
                padding: ${a("md")} ${a("lg")};
                background: ${o("surface-sunken")};
                border: none; border-radius: ${o("radius")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                color: ${o("text")};
                cursor: pointer;

                &.hidden { display: none; }
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
    `;svc=this.inject(Ye);friends=this.inject(Ie);admins=this.inject(Ue);auth=this.inject(A);router=this.inject(R);indexDraft=new p("");localErr=new p("");render(){this.auth.currentUser.get()&&(this.svc.load(),this.admins.loadRoles());const e=()=>this.auth.currentUser.get()!==null,t=this.wire(Qr,{anon:{className:()=>e()?"profile__anon hidden":"profile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/profile"}})},body:{className:()=>e()?"profile__body":"profile__body hidden"},name:()=>this.svc.player.get()?.displayName??"…",username:()=>{const l=this.svc.player.get();return l?`@${l.username}`:""},hcp:()=>{const l=this.svc.player.get()?.handicapIndex;return l==null?"–":l<0?`+${(-l).toFixed(1)}`:l.toFixed(1)},index:{value:()=>this.indexDraft.get(),oninput:l=>this.indexDraft.set(l.target.value)},save:{disabled:()=>this.svc.saving.get()||this.indexDraft.get().trim()==="",textContent:()=>this.svc.saving.get()?"Saving…":"Save"},form:{onsubmit:async l=>{l.preventDefault(),this.localErr.set("");const d=Q(this.indexDraft.get());if(d===null||d<-10||d>54){this.localErr.set("Enter an index between +10 and 54 (use “+” for a plus handicap).");return}await this.svc.saveIndex(d)&&this.indexDraft.set("")}},saveErr:{textContent:()=>this.localErr.get()||this.svc.saveError.get()?.message||""},genderErr:{textContent:()=>this.svc.saveError.get()?.message||""},clubErr:{textContent:()=>this.svc.saveError.get()?.message||""},historyEmpty:{className:()=>this.svc.history.get().length===0?"profile__empty":"profile__empty hidden"},admin:{className:()=>this.admins.isSuperAdmin()?"profile__admin":"profile__admin hidden",onclick:()=>this.router.navigate("/admin")},signout:{onclick:async()=>{await this.auth.logout(),this.svc.clear(),this.friends.clear(),this.admins.clear(),this.router.navigate("/")}}});this.$each(this.ref(t,"history"),this.svc.history,(l,d,c)=>this.wireEl(Xr,{index:()=>l.handicapIndex.toFixed(1),source:()=>l.source,date:()=>l.effectiveDate},c),l=>l.id);const s=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(t,"gender"),()=>s,(l,d,c)=>this.wireEl(y('<button bind="b" type="button"></button>'),{b:{textContent:()=>l.label,className:()=>this.svc.player.get()?.gender===l.value?"on":"",disabled:()=>this.svc.saving.get(),onclick:()=>{this.svc.saveGender(l.value)}}},c),l=>l.label);const n=new p(this.svc.player.get()?.homeClubId??"");this.track(N(()=>n.set(this.svc.player.get()?.homeClubId??""))),this.track(N(()=>{const l=n.get();queueMicrotask(()=>{l!==(this.svc.player.get()?.homeClubId??"")&&this.svc.saveHomeClub(l===""?null:l)})}));const i=new U({value:n,options:{get:()=>[{value:"",label:"No home club"},...this.svc.clubs.get().map(l=>({value:l.id,label:l.name}))]},placeholder:"No home club",disabled:{get:()=>this.svc.saving.get()}});return i.mount(this.ref(t,"club")),this.track(()=>i.destroy()),t}}const Zr=y(`
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
`),eo=y(`
    <div class="stat">
        <span bind="value" class="stat__value"></span>
        <span bind="label" class="stat__label"></span>
    </div>
`),to=y(`
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
`),so=y(`
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
`),no={not_started:"Not started",active:"Playing",complete:"Done"};function io(r){const e=[`${r.participants.length} players`,`${r.scoreEventCount} scores`];return r.lastEventAt?e.push(`last ${r.lastEventAt.replace("T"," ").slice(0,16)}`):e.push("never played"),e.join(" · ")}function ro(r){const e=[`@${r.username}`,`${r.roundCount} rounds`];return r.lastRoundDate&&e.push(`last ${r.lastRoundDate}`),r.handicapIndex!==null&&e.push(`hcp ${r.handicapIndex}`),r.deletedAt&&e.push("DELETED"),e.join(" · ")}class oo extends P{static styles=`
        .admin {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .admin__back {
                background: none; border: none; font-family: inherit;
                font-size: 0.9rem; font-weight: 600; color: ${o("text-muted")};
                cursor: pointer; padding: ${a("xs")} 0; margin-bottom: ${a("md")};
            }

            & .admin__title {
                margin: 0 0 ${a("lg")};
                font-family: ${o("font-display")};
                font-weight: 600; font-size: 1.8rem; letter-spacing: -0.02em;
                color: ${o("text")};
            }

            & .admin__denied {
                color: ${o("text-muted")}; font-size: 0.9rem;
                &.hidden { display: none; }
                & code {
                    display: block; margin-top: ${a("xs")};
                    font-size: 0.8rem; word-break: break-all;
                }
            }
            & .admin__denied-hint { color: ${o("text-muted")}; }
            & .admin__body.hidden { display: none; }

            & .admin__stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
                gap: ${a("sm")};
                margin-bottom: ${a("lg")};

                & .stat {
                    ${O({})}
                    display: flex; flex-direction: column; gap: 2px;
                    padding: ${a("sm")} ${a("md")};

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
                display: flex; gap: ${a("sm")}; margin-bottom: ${a("md")};

                & button {
                    ${S()}
                    flex: 1;
                    padding: ${a("sm")} ${a("md")};
                    font-family: inherit; font-size: 0.9rem; font-weight: 700;
                    background: ${o("surface-sunken")}; color: ${o("text-muted")};
                    border: none; cursor: pointer;

                    &.active { background: ${o("primary")}; color: ${o("primary-text")}; }
                }
            }

            & .admin__loading {
                color: ${o("text-muted")}; font-size: 0.9rem; padding: ${a("lg")} 0;
                &.hidden { display: none; }
            }

            & .admin__list {
                display: flex; flex-direction: column; gap: ${a("sm")};
                &.hidden { display: none; }
            }

            & .admin-row {
                ${O({hover:!0})}
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
                    font-weight: 700; font-size: 1rem; color: ${o("text")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }

                & .admin-row__sub {
                    font-size: 0.8rem; color: ${o("text-muted")};
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .admin-row__meta { font-variant-numeric: tabular-nums; }

                & .admin-row__actions {
                    display: flex; justify-content: flex-end; margin-top: ${a("xs")};
                    & button {
                        ${S()}
                        padding: ${a("xs")} ${a("md")};
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
    `;svc=this.inject(Ue);auth=this.inject(A);router=this.inject(R);tab=new p("rounds");grantOpen=new p(!1);grantTarget=new p(null);mutating=new p(!1);denied=new k(()=>this.auth.currentUser.get()===null||!this.svc.isSuperAdmin());render(){this.svc.loadRoles().then(()=>{this.svc.isSuperAdmin()&&this.svc.load()});const e=this.wire(Zr,{back:{onclick:()=>this.router.navigate("/")},denied:{className:()=>this.denied.get()?"admin__denied":"admin__denied hidden"},body:{className:()=>this.denied.get()?"admin__body hidden":"admin__body"},loading:{className:()=>this.svc.loading.get()?"admin__loading":"admin__loading hidden"},tabRounds:{className:()=>this.tab.get()==="rounds"?"active":"",onclick:()=>this.tab.set("rounds")},tabPlayers:{className:()=>this.tab.get()==="players"?"active":"",onclick:()=>this.tab.set("players")},roundList:{className:()=>this.tab.get()==="rounds"?"admin__list":"admin__list hidden"},playerList:{className:()=>this.tab.get()==="players"?"admin__list":"admin__list hidden"}}),t=new k(()=>{const s=this.svc.stats.get();return s?[{key:"rounds",label:"Rounds",value:s.rounds},{key:"active",label:"Playing",value:s.roundsActive},{key:"week",label:"Last 7d",value:s.roundsLast7Days},{key:"players",label:"Players",value:s.players},{key:"guests",label:"Guests",value:s.guests},{key:"scores",label:"Scores",value:s.scoreEvents}]:[]});return this.$each(this.ref(e,"stats"),t,(s,n,i)=>this.wireEl(eo,{value:()=>String(s.value),label:()=>s.label},i),s=>s.key),this.$each(this.ref(e,"roundList"),this.svc.rounds,(s,n,i)=>this.wireEl(to,{row:{disabled:()=>s.shareToken===null,onclick:()=>{s.shareToken&&this.router.navigate("/round",{query:{token:s.shareToken}})}},course:()=>s.courseName??"Unknown course",status:()=>no[s.status],who:()=>{const l=s.creatorName?`by ${s.creatorName}`:"by a guest",d=s.participants.join(", ");return d?`${l} — ${d}`:l},meta:()=>`${s.date} · ${io(s)}`},i),s=>s.roundId),this.$each(this.ref(e,"playerList"),this.svc.players,(s,n,i)=>this.wireEl(so,{name:()=>s.displayName,roleChip:()=>s.roles.includes("super_admin")?"admin":"",meta:()=>ro(s),toggle:{textContent:()=>s.roles.includes("super_admin")?"Revoke admin":"Make admin",disabled:()=>this.mutating.get(),onclick:()=>{this.grantTarget.set(s),this.grantOpen.set(!0)}}},i),s=>s.playerId),this.spawn(V,this.ref(e,"confirmHost"),{open:this.grantOpen,title:()=>this.grantTarget.get()?.roles.includes("super_admin")?"Revoke admin?":"Make admin?",message:()=>{const s=this.grantTarget.get();return s?s.roles.includes("super_admin")?`Remove the super admin role from ${s.displayName}?`:`Give ${s.displayName} the super admin role? They will be able to see every player's rounds.`:""},confirmLabel:"Confirm",cancelLabel:"Cancel",onconfirm:()=>{const s=this.grantTarget.get();s&&this.toggleAdmin(s)}}),e}async toggleAdmin(e){this.mutating.set(!0);try{const t={playerId:e.playerId,role:"super_admin"};e.roles.includes("super_admin")?await _.admin.adminRevokeRole(t):await _.admin.adminGrantRole(t),await this.svc.load(!0)}finally{this.mutating.set(!1)}}}function ao(r,e){return r?e!==null&&r.ownerPlayerId===e?!0:r.rounds.some(t=>typeof t.shareToken=="string"):!1}class ne{list=new p([]);listLoading=new p(!1);listError=new p(null);listLoaded=new p(!1);detail=new p(null);detailId=new p(null);detailLoading=new p(!1);detailError=new p(null);participants=new p([]);board=new p(null);boardRefusal=new p(null);boardLoading=new p(!1);results=new p(null);resultsRefusal=new p(null);mutating=new p(!1);mutateError=new p(null);async loadList(e=!1){if(!e&&(this.listLoaded.get()||this.listLoading.get()))return;const t=await j(this.listLoading,this.listError,()=>_.competitions.list());t&&(this.list.set(t),this.listLoaded.set(!0))}async loadDetail(e,t=!1){if(!t&&this.detailId.get()===e&&this.detail.get()!==null&&!this.detailLoading.get()||this.detailLoading.get()&&this.detailId.get()===e)return;this.detailId.set(e);const s=await j(this.detailLoading,this.detailError,()=>Promise.all([_.competitions.get({id:e}),_.competitions.participants({competitionId:e})]));if(!s)return;const[n,i]=s;this.detailId.get()===e&&(this.detail.set(n),this.participants.set(i),await this.loadBoard(e),n.lifecycle==="finalized"&&await this.loadResults(e))}async loadBoard(e){this.boardLoading.set(!0);try{const t=await _.competitions.leaderboard({id:e});t.ok?(this.board.set(t.value),this.boardRefusal.set(null)):(this.board.set(null),this.boardRefusal.set(t.refusal.message))}catch{this.board.set(null),this.boardRefusal.set(null)}finally{this.boardLoading.set(!1)}}async loadResults(e){try{const t=await _.competitions.results({id:e});t.ok?(this.results.set(t.value),this.resultsRefusal.set(null)):(this.results.set(null),this.resultsRefusal.set(t.refusal.message))}catch{this.results.set(null)}}async create(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await _.competitions.create({name:e});return this.list.set([t,...this.list.get()]),t}catch(t){return this.mutateError.set(te(t)),null}finally{this.mutating.set(!1)}}transition(e,t){return this.mutate(()=>_.competitions.transition({id:e,to:t}),()=>this.loadDetail(e,!0))}updateConfig(e){return this.mutate(()=>_.competitions.update(e),()=>this.loadDetail(e.id,!0))}async addPlayer(e,t,s){return this.rosterMutate(e,()=>_.competitions.addParticipant({competitionId:e,playerId:t,category:s}))}async addGuest(e,t,s){this.mutating.set(!0),this.mutateError.set(null);let n;try{n=(await _.guestPlayers.create(t)).id}catch(i){return this.mutating.set(!1),this.mutateError.set(te(i)),te(i)}return this.mutating.set(!1),this.rosterMutate(e,()=>_.competitions.addParticipant({competitionId:e,guestPlayerId:n,category:s}))}removeParticipant(e,t){return this.rosterMutate(e,()=>_.competitions.removeParticipant({participantId:t}))}withdrawParticipant(e,t){return this.rosterMutate(e,()=>_.competitions.withdrawParticipant({participantId:t}))}async createRound(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await _.competitions.createRound(e);if(t.ok)return await this.loadDetail(e.id,!0),{ok:!0,shareToken:t.shareToken};const s="refusal"in t?t.refusal.message:t.diagnostics.map(n=>n.message).join(" · ");return this.mutateError.set(s),{ok:!1,message:s}}catch(t){const s=te(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}async applyCut(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await _.competitions.applyCut({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const s=te(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}async finalize(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await _.competitions.finalize({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const s=te(t);return this.mutateError.set(s),{ok:!1,message:s}}finally{this.mutating.set(!1)}}clear(){this.list.set([]),this.listLoaded.set(!1),this.detail.set(null),this.detailId.set(null),this.participants.set([]),this.board.set(null),this.boardRefusal.set(null),this.results.set(null),this.resultsRefusal.set(null),this.listError.set(null),this.detailError.set(null),this.mutateError.set(null)}async mutate(e,t){this.mutating.set(!0),this.mutateError.set(null);try{const s=await e();return s.ok?(await t(),null):(this.mutateError.set(s.refusal.message),s.refusal.message)}catch(s){const n=te(s);return this.mutateError.set(n),n}finally{this.mutating.set(!1)}}rosterMutate(e,t){return this.mutate(t,async()=>{const s=await _.competitions.participants({competitionId:e});this.participants.set(s)})}}function te(r){return r&&typeof r=="object"&&"message"in r&&typeof r.message=="string"?r.message:"Something went wrong. Try again."}function as(r){switch(r){case"draft":return"Draft";case"setup":return"Setup";case"active":return"Live";case"finalized":return"Finalized"}}function ls(r){return`comp-chip comp-chip--${r}`}function Le(r){switch(r){case"draft":return{to:"setup",label:"Open setup"};case"setup":return{to:"active",label:"Start competition"};default:return null}}function Be(r){return r==="draft"||r==="setup"}function lo(r){return r==="setup"||r==="active"}const co=y(`
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
`),uo=y(`
    <button bind="row" type="button" class="comp-row">
        <span bind="name" class="comp-row__name"></span>
        <span bind="chip"></span>
    </button>
`);class ho extends P{static styles=`
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
                    ${S()}
                    margin-top: ${a("md")};
                    padding: ${a("md")} ${a("xl")};
                    font-family: inherit; font-size: 1rem; font-weight: 700;
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
                }
            }
            & .comps__body.hidden { display: none; }

            & .comps__create {
                display: flex;
                gap: ${a("sm")};
                margin-bottom: ${a("md")};
                & input { ${q()} flex: 1; padding: ${a("md")}; font-size: 1rem; }
                & button {
                    ${S()}
                    padding: ${a("md")} ${a("lg")};
                    font-family: inherit; font-size: 0.95rem; font-weight: 700;
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
                ${O({hover:!0})}
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
    `;svc=this.inject(ne);auth=this.inject(A);router=this.inject(R);loggedIn=new k(()=>this.auth.currentUser.get()!==null);nameDraft=new p("");render(){this.loggedIn.get()&&this.svc.loadList();const e=this.wire(co,{anon:{className:()=>this.loggedIn.get()?"comps__anon hidden":"comps__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/competitions"}})},body:{className:()=>this.loggedIn.get()?"comps__body":"comps__body hidden"},nameInput:{value:()=>this.nameDraft.get(),oninput:t=>this.nameDraft.set(t.target.value)},createBtn:{disabled:()=>this.svc.mutating.get()||this.nameDraft.get().trim()==="",textContent:()=>this.svc.mutating.get()?"Creating…":"Create"},createForm:{onsubmit:async t=>{t.preventDefault();const s=this.nameDraft.get().trim();if(s==="")return;const n=await this.svc.create(s);n&&(this.nameDraft.set(""),this.router.navigate("/competition",{query:{id:n.id}}))}},createErr:{textContent:()=>this.svc.mutateError.get()??""},loading:{className:()=>this.svc.listLoading.get()&&!this.svc.listLoaded.get()?"comps__loading":"comps__loading hidden"},empty:{className:()=>this.svc.listLoaded.get()&&this.svc.list.get().length===0?"comps__empty":"comps__empty hidden"}});return this.$each(this.ref(e,"list"),this.svc.list,(t,s,n)=>this.wireEl(uo,{row:{onclick:()=>this.router.navigate("/competition",{query:{id:t.id}})},name:()=>t.name,chip:{textContent:()=>as(t.lifecycle),className:()=>ls(t.lifecycle)}},n),t=>t.id),e}}class po{loading=new p(!1);error=new p(null);descriptors=new p([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await j(this.loading,this.error,()=>_.setup.aggregations());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=ie()){const s=typeof e=="string"?this.byId(e):e;return s?s.labels?.[t]??s.labels?.en??s.label:typeof e=="string"?e:""}}function mo(r,e){const t={};for(const s of r){const n=e[s.key];t[s.key]=n!=null?String(n):String(s.default)}return t}function fo(r,e){const t={};for(const s of r){const n=e[s.key]??String(s.default);t[s.key]=s.kind==="integer"?Number.parseInt(n,10)||Number(s.default):n}return t}class pe{competitions=D.get(ne);formats=D.get(he);aggregations=D.get(po);friends=D.get(Ie);profile=D.get(Ye);auth=D.get(A);router=D.get(R);id=this.router.query("id");admin=new k(()=>ao(this.competitions.detail.get(),this.profile.player.get()?.id??null));lifecycle=new k(()=>this.competitions.detail.get()?.lifecycle??"draft");editingSetup=new p(!1);nameDraft=new p("");slotDraft=new p([]);aggregationStrategy=new p("");aggregationValues=new p({});startListDraft=new p("single_group");courseDraft=new p("");teeDraft=new p("");cutAfterDraft=new p("");cutTypeDraft=new p("");cutValueDraft=new p("");formatPickDraft=new p("");guestNameDraft=new p("");guestGenderDraft=new p("M");guestHcpDraft=new p("");roundCourseDraft=new p("");roundDateDraft=new p("");courses=new p([]);tees=new p([]);resultSetIndex=new p(0);cutOutcome=new p(null);cutConfirmOpen=new p(!1);finalizeConfirmOpen=new p(!1);coursesLoaded=!1;enter(){this.editingSetup.set(!1),this.nameDraft.set(""),this.slotDraft.set([]),this.aggregationStrategy.set(""),this.aggregationValues.set({}),this.startListDraft.set("single_group"),this.courseDraft.set(""),this.teeDraft.set(""),this.tees.set([]),this.cutAfterDraft.set(""),this.cutTypeDraft.set(""),this.cutValueDraft.set(""),this.formatPickDraft.set(""),this.guestNameDraft.set(""),this.guestGenderDraft.set("M"),this.guestHcpDraft.set(""),this.roundCourseDraft.set(""),this.roundDateDraft.set(""),this.resultSetIndex.set(0),this.cutOutcome.set(null),this.cutConfirmOpen.set(!1),this.finalizeConfirmOpen.set(!1)}initialize(){this.auth.currentUser.get()&&(this.profile.load(),this.friends.load()),this.formats.load(),this.aggregations.load(),this.loadCourses()}loadCourses(){this.coursesLoaded||(this.coursesLoaded=!0,_.courses.list().then(e=>this.courses.set(e)).catch(()=>{this.coursesLoaded=!1}))}async loadTees(e){if(!e){this.tees.set([]);return}try{this.tees.set(await _.tees.listByCourse({courseId:e}))}catch{this.tees.set([])}}selectAggregation(e){this.applyAggregation(e,{})}applyAggregation(e,t){this.aggregationStrategy.set(e);const s=this.aggregations.byId(e)?.configFields??[];this.aggregationValues.set(mo(s,t))}setAggregationValue(e,t){this.aggregationValues.set({...this.aggregationValues.get(),[e]:t})}seedSetupEditor(){const e=this.competitions.detail.get();if(!e)return;this.nameDraft.set(e.name);const t=e.defaultConfig;this.slotDraft.set((t?.slots??[]).map(l=>l.formatId)),this.startListDraft.set(t?.startList??"single_group"),this.teeDraft.set(t?.fallbackTee?.teeId??"");const s=e.aggregation,n=s?.strategyId??this.aggregations.descriptors.get()[0]?.id??"";this.applyAggregation(n,s?.config??{});const i=e.cutRules;this.cutAfterDraft.set(i?.afterRound!==void 0?String(i.afterRound):""),this.cutTypeDraft.set(i?.cutType??""),this.cutValueDraft.set(i?.cutValue!==void 0?String(i.cutValue):""),this.formatPickDraft.set(this.formats.descriptors.get()[0]?.id??""),this.editingSetup.set(!0)}async saveSetup(){const e=this.id.get()??"",t=this.slotDraft.get().map(v=>({formatId:v})),s=this.teeDraft.get(),n=t.length>0?{slots:t,startList:this.startListDraft.get(),...s?{fallbackTee:{teeId:s}}:{}}:void 0,i=this.aggregationStrategy.get(),l=this.aggregations.byId(i)?.configFields??[],d=i?{strategyId:i,config:fo(l,this.aggregationValues.get())}:void 0,c=Number.parseInt(this.cutAfterDraft.get(),10),u=Number.parseInt(this.cutValueDraft.get(),10),f=this.cutTypeDraft.get(),m=f&&Number.isFinite(c)&&Number.isFinite(u)?{afterRound:c,cutType:f,cutValue:u}:void 0;await this.competitions.updateConfig({id:e,name:this.nameDraft.get().trim()||void 0,...n?{defaultConfig:n}:{},...d?{aggregation:d}:{},...m?{cutRules:m}:{}})===null&&this.editingSetup.set(!1)}async addGuest(){const e=this.guestNameDraft.get().trim();if(!e)return;const t=Q(this.guestHcpDraft.get());await this.competitions.addGuest(this.id.get()??"",{displayName:e,gender:this.guestGenderDraft.get(),handicapIndex:t},null)===null&&(this.guestNameDraft.set(""),this.guestHcpDraft.set(""))}async createRound(){const e=this.roundCourseDraft.get()||this.courseDraft.get(),t=this.roundDateDraft.get();if(!e||!t)return this.competitions.mutateError.set("Pick a course and a date for the round."),null;const s=await this.competitions.createRound({id:this.id.get()??"",courseId:e,playedAt:t});return s.ok?s.shareToken:null}}const go=y(`
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
`),bo=y(`
    <div class="cd__slot">
        <span bind="label"></span>
        <button bind="remove" type="button" aria-label="Remove">×</button>
    </div>
`),ve=y('<option bind="option"></option>'),yo=y(`
    <label class="cd__field">
        <span bind="label"></span>
        <select bind="select"></select>
        <input bind="integer" inputmode="numeric" />
    </label>
`);class _o extends P{competitions=this.inject(ne);state=this.inject(pe);render(){const e=()=>this.competitions.detail.get(),t=this.wire(go,{root:{className:()=>this.state.admin.get()&&Be(this.state.lifecycle.get())?"cd__section cd__setup":"cd__section cd__setup hidden"},toggle:{textContent:()=>this.state.editingSetup.get()?"Close":"Edit",onclick:()=>{this.state.editingSetup.get()?this.state.editingSetup.set(!1):this.state.seedSetupEditor()}},summary:{className:()=>this.state.editingSetup.get()?"cd__summary hidden":"cd__summary"},summaryFormats:{textContent:()=>{const i=e()?.defaultConfig?.slots??[];return i.length?i.map(l=>this.state.formats.labelOf(l.formatId)??l.formatId).join(", "):"none set"},className:()=>(e()?.defaultConfig?.slots.length??0)===0?"cd__muted-em":""},summaryScoring:{textContent:()=>{const i=e()?.aggregation;return i?this.state.aggregations.labelOf(i.strategyId):"default (chosen automatically)"},className:()=>e()?.aggregation?"":"cd__muted-em"},form:{className:()=>this.state.editingSetup.get()?"cd__form":"cd__form hidden"},name:{value:()=>this.state.nameDraft.get(),oninput:i=>this.state.nameDraft.set(i.target.value)},formatPick:{value:()=>this.state.formatPickDraft.get(),onchange:i=>this.state.formatPickDraft.set(i.target.value)},addSlot:{onclick:()=>{const i=this.state.formatPickDraft.get()||this.state.formats.descriptors.get()[0]?.id;i&&this.state.slotDraft.set([...this.state.slotDraft.get(),i])}},aggregationPick:{value:()=>this.state.aggregationStrategy.get(),onchange:i=>this.state.selectAggregation(i.target.value)},aggregationDescription:()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.description??"",course:{value:()=>this.state.courseDraft.get(),onchange:i=>{const l=i.target.value;this.state.courseDraft.set(l),this.state.teeDraft.set(""),this.state.loadTees(l)}},tee:{value:()=>this.state.teeDraft.get(),onchange:i=>this.state.teeDraft.set(i.target.value)},startList:{value:()=>this.state.startListDraft.get(),onchange:i=>this.state.startListDraft.set(i.target.value)},cutAfter:{value:()=>this.state.cutAfterDraft.get(),oninput:i=>this.state.cutAfterDraft.set(i.target.value)},cutType:{value:()=>this.state.cutTypeDraft.get(),onchange:i=>this.state.cutTypeDraft.set(i.target.value)},cutValue:{value:()=>this.state.cutValueDraft.get(),oninput:i=>this.state.cutValueDraft.set(i.target.value)},save:{disabled:()=>this.competitions.mutating.get(),textContent:()=>this.competitions.mutating.get()?"Saving…":"Save setup",onclick:()=>{this.state.saveSetup()}},cancel:{onclick:()=>this.state.editingSetup.set(!1)}});this.$each(this.ref(t,"slots"),this.state.slotDraft,(i,l,d)=>this.wireEl(bo,{label:()=>`Slot ${l+1}: ${this.state.formats.labelOf(i)??i}`,remove:{onclick:()=>this.state.slotDraft.set(this.state.slotDraft.get().filter((c,u)=>u!==l))}},d),(i,l)=>`${l}:${i}`),this.$each(this.ref(t,"formatPick"),this.state.formats.descriptors,(i,l,d)=>this.wireEl(ve,{option:{value:()=>i.id,textContent:()=>this.state.formats.labelOf(i)??i.id}},d),i=>i.id),this.$each(this.ref(t,"aggregationPick"),this.state.aggregations.descriptors,(i,l,d)=>this.wireEl(ve,{option:{value:()=>i.id,textContent:()=>this.state.aggregations.labelOf(i)}},d),i=>i.id);const s=new k(()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.configFields??[]);this.$each(this.ref(t,"aggregationFields"),s,(i,l,d)=>this.configField(i,d),i=>i.key);const n=(i,l)=>this.wireEl(ve,{option:{value:()=>i.id,textContent:()=>i.name}},l);return this.$each(this.ref(t,"course"),this.state.courses,(i,l,d)=>n(i,d),i=>i.id),this.$each(this.ref(t,"tee"),this.state.tees,(i,l,d)=>n(i,d),i=>i.id),t}configField(e,t){const s=this.wireEl(yo,{label:()=>e.label,select:{className:()=>e.kind==="select"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),onchange:l=>this.state.setAggregationValue(e.key,l.target.value)},integer:{className:()=>e.kind==="integer"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),oninput:l=>this.state.setAggregationValue(e.key,l.target.value)}},t),n=s.querySelector("select"),i=new k(()=>e.kind==="select"?e.options:[]);return this.$each(n,i,(l,d,c)=>this.wireEl(ve,{option:{value:()=>l.value,textContent:()=>l.label}},c),l=>l.value),s}}const vo=y(`
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
`),wo=y(`
    <div class="cd__rosterrow">
        <span bind="name" class="cd__rname"></span>
        <span bind="category" class="cd__rcat"></span>
        <span bind="status" class="cd__rout"></span>
        <button bind="withdraw" class="cd__ract" type="button">Withdraw</button>
        <button bind="remove" class="cd__ract cd__ract--danger" type="button">Remove</button>
    </div>
`),xo=y('<button bind="chip" class="cd__friendchip" type="button"></button>');class $o extends P{competitions=this.inject(ne);state=this.inject(pe);render(){const e=()=>this.state.id.get()??"",t=this.wire(vo,{count:()=>{const s=this.competitions.participants.get().length;return s===0?"":String(s)},empty:{className:()=>this.competitions.participants.get().length===0?"cd__empty":"cd__empty hidden"},add:{className:()=>this.state.admin.get()&&Be(this.state.lifecycle.get())?"cd__rosteradd":"cd__rosteradd hidden"},guestForm:{onsubmit:s=>{s.preventDefault(),this.state.addGuest()}},guestName:{value:()=>this.state.guestNameDraft.get(),oninput:s=>this.state.guestNameDraft.set(s.target.value)},guestGender:{value:()=>this.state.guestGenderDraft.get(),onchange:s=>this.state.guestGenderDraft.set(s.target.value)},guestHcp:{value:()=>this.state.guestHcpDraft.get(),oninput:s=>this.state.guestHcpDraft.set(s.target.value)},addGuest:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"roster"),this.competitions.participants,(s,n,i)=>this.wireEl(wo,{name:()=>s.displayNameSnapshot,category:{textContent:()=>s.category??"",className:()=>s.category?"cd__rcat":"cd__rcat hidden"},status:{textContent:()=>s.withdrawnAt?"Withdrawn":s.cutAfterRound!==null?`Cut R${s.cutAfterRound}`:"",className:()=>s.withdrawnAt||s.cutAfterRound!==null?"cd__rout":"cd__rout hidden"},withdraw:{className:()=>this.state.admin.get()&&!s.withdrawnAt?"cd__ract":"cd__ract hidden",onclick:()=>{this.competitions.withdrawParticipant(e(),s.id)}},remove:{className:()=>this.state.admin.get()&&Be(this.state.lifecycle.get())?"cd__ract cd__ract--danger":"cd__ract cd__ract--danger hidden",onclick:()=>{this.competitions.removeParticipant(e(),s.id)}}},i),s=>JSON.stringify({id:s.id,name:s.displayNameSnapshot,category:s.category,withdrawnAt:s.withdrawnAt,cutAfterRound:s.cutAfterRound})),this.$each(this.ref(t,"friends"),this.state.friends.friends,(s,n,i)=>this.wireEl(xo,{chip:{textContent:()=>s.displayName,disabled:()=>this.competitions.mutating.get()||this.competitions.participants.get().some(l=>l.playerId===s.id),onclick:()=>{this.competitions.addPlayer(e(),s.id,null)}}},i),s=>s.id),t}}const ko={not_started:"Not started",active:"Live",complete:"Finished"},So=y(`
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
`),Co=y(`
    <button bind="row" class="cd__roundrow" type="button">
        <span bind="number" class="cd__rnum"></span>
        <span bind="meta" class="cd__rmeta"></span>
        <span bind="status" class="cd__rstatus"></span>
    </button>
`),To=y('<option bind="option"></option>');class Io extends P{competitions=this.inject(ne);state=this.inject(pe);router=this.inject(R);render(){const e=new k(()=>this.competitions.detail.get()?.rounds??[]),t=this.wire(So,{empty:{className:()=>e.get().length===0?"cd__empty":"cd__empty hidden"},form:{className:()=>this.state.admin.get()&&lo(this.state.lifecycle.get())?"cd__addround":"cd__addround hidden",onsubmit:s=>{s.preventDefault(),this.createRound()}},course:{value:()=>this.state.roundCourseDraft.get(),onchange:s=>this.state.roundCourseDraft.set(s.target.value)},date:{value:()=>this.state.roundDateDraft.get(),oninput:s=>this.state.roundDateDraft.set(s.target.value)},add:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"course"),this.state.courses,(s,n,i)=>this.wireEl(To,{option:{value:()=>s.id,textContent:()=>s.name}},i),s=>s.id),this.$each(this.ref(t,"rounds"),e,(s,n,i)=>this.wireEl(Co,{row:{disabled:()=>!s.shareToken,onclick:()=>{s.shareToken&&this.router.navigate("/round",{query:{token:s.shareToken}})}},number:()=>`Round ${s.roundNumber}`,meta:()=>[s.courseNameSnapshot,s.date].filter(Boolean).join(" · ")||(s.shareToken?"Open":"View-only"),status:{textContent:()=>ko[s.status]??s.status,className:()=>`cd__rstatus s-${s.status}`}},i),s=>JSON.stringify({id:s.id,status:s.status,shareToken:s.shareToken,courseName:s.courseNameSnapshot,date:s.date})),t}async createRound(){const e=await this.state.createRound();e&&this.router.navigate("/round",{query:{token:e}})}}function Eo(r,e,t){return JSON.stringify({entry:r,points:e,columns:t})}function No(r){return r.rounds.filter(e=>e.value!==null).map(e=>({text:String(e.value),dropped:e.status==="dropped"}))}const Po=y(`
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
`),zo=y('<button bind="button" type="button"></button>'),Oo=y('<th bind="cell"></th>'),jo=y('<tr bind="row"></tr>'),Ro=y('<td bind="cell"><span bind="value"></span></td>'),Lo=y(`
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
`),Do=y('<span bind="part"><span bind="separator"></span><span bind="value"></span></span>');class Ao extends P{competitions=this.inject(ne);state=this.inject(pe);render(){const e=new k(()=>{if(this.state.lifecycle.get()!=="finalized")return(this.competitions.board.get()?.view.entries??[]).map(m=>({entry:m,points:null}));const u=this.competitions.results.get()?.resultSets??[],f=Math.min(this.state.resultSetIndex.get(),u.length-1);return(u[f]?.entries??[]).map(m=>({entry:m.entry,points:m.points}))}),t=new k(()=>{const u=this.competitions.board.get()?.view.rounds??[];if(u.length>0)return u;const f=new Set;for(const m of e.get())for(const h of m.entry.rounds)f.add(h.roundNumber);return[...f].sort((m,h)=>m-h).map(m=>({roundNumber:m,postCut:!1}))}),s=()=>this.state.lifecycle.get()==="finalized",n=()=>s()?(this.competitions.results.get()?.resultSets.length??0)>0:this.competitions.board.get()!==null,i=()=>this.state.cutOutcome.get(),l=u=>u.length===0?"—":u.map(f=>f.displayName).join(", "),d=this.wire(Po,{admin:{className:()=>this.state.admin.get()&&this.state.lifecycle.get()==="active"?"cd__section cd__admin":"cd__section cd__admin hidden"},cutOutcome:{className:()=>i()?"cd__cutoutcome":"cd__cutoutcome hidden"},advancedLabel:()=>`Advanced (${i()?.advanced.length??0}):`,advanced:()=>l(i()?.advanced??[]),cutLabel:()=>`Cut (${i()?.cut.length??0}):`,cut:()=>l(i()?.cut??[]),applyCut:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.cutConfirmOpen.set(!0)},finalize:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.finalizeConfirmOpen.set(!0)},title:()=>s()?"Official results":"Leaderboard",board:{className:()=>s()?"cd__board cb cb--official":"cd__board"},official:{textContent:()=>{const u=this.competitions.results.get()?.finalizedAt.slice(0,10)??"";return s()&&u?`Official results · finalized ${u}`:""},className:()=>s()?"cd__official-banner":"cd__official-banner hidden"},boardHead:{className:()=>s()?"cb-head hidden":"cb-head"},metric:()=>this.competitions.board.get()?.view.metricLabel??"",operator:()=>{const u=this.competitions.board.get();return u?u.view.operator.kind==="best_n"?`Best ${u.view.operator.n} of ${u.view.rounds.length}`:"Total across rounds":""},defaulted:{className:()=>this.competitions.board.get()?.defaulted?"cb-head__hint":"cb-head__hint hidden"},empty:{className:()=>n()&&e.get().length===0?"cb-empty":"cb-empty hidden"},table:{className:()=>n()&&e.get().length>0?"cb":"cb hidden"},refusal:{textContent:()=>s()?this.competitions.resultsRefusal.get()??"":this.competitions.board.get()===null?this.competitions.boardRefusal.get()??"":""}}),c=new k(()=>[{text:"#",className:"cb-pos"},{text:"Player",className:"cb-who"},...t.get().map((u,f,m)=>({text:`R${u.roundNumber}`,className:`cb-c${u.postCut&&!m.slice(0,f).some(h=>h.postCut)?" cb-c--divider":""}`})),{text:"Total",className:"cb-total"},...s()?[{text:"Pts",className:"cb-points"}]:[]]);return this.$each(this.ref(d,"headers"),c,(u,f,m)=>this.wireEl(Oo,{cell:{textContent:()=>u.text,className:()=>u.className}},m),u=>`${u.text}:${u.className}`),this.$each(this.ref(d,"rows"),e,(u,f,m)=>this.boardRow(u,t.get(),m),u=>Eo(u.entry,u.points,t.get())),this.$each(this.ref(d,"switcher"),new k(()=>s()?this.competitions.results.get()?.resultSets??[]:[]),(u,f,m)=>this.wireEl(zo,{button:{textContent:()=>u.scoringType.toUpperCase(),className:()=>this.state.resultSetIndex.get()===f?"on":"",onclick:()=>this.state.resultSetIndex.set(f)}},m),u=>u.scoringType),this.spawn(V,this.ref(d,"cutConfirm"),{open:this.state.cutConfirmOpen,title:"Apply cut?",message:"This evaluates the configured cut against the current aggregate and marks who advances. Cut players are left out of later rounds.",confirmLabel:"Apply cut",cancelLabel:"Cancel",onconfirm:async()=>{const u=await this.competitions.applyCut(this.state.id.get()??"");u.ok&&this.state.cutOutcome.set(u.outcome)}}),this.spawn(V,this.ref(d,"finalizeConfirm"),{open:this.state.finalizeConfirmOpen,title:"Finalize competition?",message:"Finalizing freezes the official results and locks the competition. This cannot be undone.",confirmLabel:"Finalize",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.competitions.finalize(this.state.id.get()??"")}}),d}boardRow(e,t,s){const n=e.entry,i=n.withdrawn||n.cutAfterRound!==null,l=["cb-row"];n.withdrawn?l.push("cb-row--withdrawn"):n.cutAfterRound!==null?l.push("cb-row--cut"):n.position===1&&l.push("cb-row--lead"),n.incomplete&&l.push("cb-row--incomplete");const d=t.findIndex(m=>m.postCut),c=new Map(n.rounds.map(m=>[m.roundNumber,m])),u=[{kind:"position",text:i?"—":String(n.position)},{kind:"who",entry:n},...t.map((m,h)=>({kind:"round",cell:c.get(m.roundNumber)??null,divider:h===d})),{kind:"total",text:n.total===null?"—":String(n.total)},...e.points===null?[]:[{kind:"points",text:String(e.points)}]],f=this.wireEl(jo,{row:{className:()=>l.join(" ")}},s);return this.$each(f,new k(()=>u),(m,h,v)=>this.boardCell(m,v),(m,h)=>h),f}boardCell(e,t){if(e.kind==="who")return this.whoCell(e.entry,t);const s=e.kind==="position"?"cb-pos":e.kind==="total"?"cb-total":e.kind==="points"?"cb-points":`cb-c cb-c--${e.cell?.status??"missing"}${e.divider?" cb-c--divider":""}`,n=e.kind==="round"?e.cell?.value===null||!e.cell?"—":String(e.cell.value):e.text;return this.wireEl(Ro,{cell:{className:()=>s},value:{textContent:()=>n,className:()=>e.kind==="round"&&e.cell?.status==="dropped"?"cb-struck":""}},t)}whoCell(e,t){const s=e.withdrawn?"WD":e.cutAfterRound!==null?`Cut R${e.cutAfterRound}`:"",n=No(e),i=this.wireEl(Lo,{cell:{},name:()=>e.displayName,category:{textContent:()=>e.category??"",className:()=>e.category?"cb-tag cb-cat":"cb-tag cb-cat hidden"},status:{textContent:()=>s,className:()=>s?"cb-tag cb-tag--out":"cb-tag cb-tag--out hidden"},equals:{className:()=>n.length===0?"hidden":""},total:()=>e.total===null?"—":String(e.total)},t);return this.$each(i.querySelector('[bind="parts"]'),new k(()=>n),(l,d,c)=>this.wireEl(Do,{separator:()=>d===0?"":" + ",value:{textContent:()=>l.text,className:()=>l.dropped?"cb-struck":""}},c),(l,d)=>d),i}}const Ho=y(`
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
`);class Mo extends P{static styles=`
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
                    ${S()}
                    padding: ${a("md")} ${a("lg")}; font-family: inherit;
                    font-size: 0.95rem; font-weight: 700;
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
                ${O()} padding: ${a("md")} ${a("lg")};
                font-size: 0.85rem; color: ${o("text-muted")}; line-height: 1.5;
                &.hidden { display: none; }
            }
            & .cd__empty { color: ${o("text-muted")}; font-size: 0.9rem; padding: ${a("sm")} 0;
                &.hidden { display: none; } &:empty { display: none; } }

            & .cd__form {
                ${O()} padding: ${a("lg")};
                display: flex; flex-direction: column; gap: ${a("md")};
                &.hidden { display: none; }
                & .cd__field { display: flex; flex-direction: column; gap: ${a("xs")};
                    & > span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                        letter-spacing: 0.05em; color: ${o("text-muted")}; }
                    & input, & select { ${q()} padding: ${a("sm")} ${a("md")}; font-size: 0.95rem; }
                }
                & .cd__aggdesc { margin: 0; font-size: 0.8rem; color: ${o("text-muted")}; &:empty { display: none; } }
                & .cd__aggfields { display: flex; flex-direction: column; gap: ${a("md")}; &:empty { display: none; } }
                & .cd__cutrow, & .cd__addrow { display: flex; gap: ${a("sm")}; }
                & .cd__cutrow input { width: 33%; }
                & .cd__addrow select { flex: 1; }
                & .cd__slots { display: flex; flex-direction: column; gap: ${a("xs")}; }
                & .cd__formactions { display: flex; align-items: center; gap: ${a("md")}; margin-top: ${a("sm")}; }
                & button[bind="addSlot"], & button[bind="saveSetup"] {
                    ${S()}
                    padding: ${a("sm")} ${a("md")}; font-family: inherit; font-weight: 700;
                    background: ${o("primary")}; color: ${o("primary-text")}; border: none;
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
                padding: ${a("sm")} ${a("md")}; ${O()}
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
                ${S()}
                padding: ${a("xs")} ${a("md")}; font-family: inherit;
                font-size: 0.85rem; font-weight: 600; cursor: pointer;
                &:disabled { opacity: 0.4; }
            }
            & .cd__guestrow, & .cd__addroundrow { display: flex; gap: ${a("sm")}; }
            & .cd__guestrow input, & .cd__addroundrow input, & .cd__addroundrow select {
                ${q()}
                padding: ${a("sm")} ${a("md")}; font-size: 0.9rem; min-width: 0; }
            & .cd__guestrow input[bind="guestName"] { flex: 1; }
            & .cd__guestrow input[bind="guestHcp"] { width: 4.5rem; }
            & .cd__guestrow select { width: 3.5rem; }
            & .cd__addroundrow select { flex: 1; }
            & .cd__guestrow button, & .cd__addroundrow button {
                ${S()}
                padding: ${a("sm")} ${a("md")}; font-family: inherit; font-weight: 700;
                background: ${o("primary")}; color: ${o("primary-text")}; border: none; }

            & .cd__rounds { display: flex; flex-direction: column; gap: ${a("xs")}; }
            & .cd__roundrow {
                display: flex; align-items: center; gap: ${a("md")};
                padding: ${a("md")} ${a("lg")}; ${O({hover:!0})}
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
                ${S()}
                padding: ${a("md")} ${a("lg")}; font-family: inherit; font-weight: 700;
            }
            & .cd__cutbtn { background: ${o("accent-soft")}; color: ${o("accent")}; border-color: ${o("accent")}; }
            & .cd__finalbtn { background: ${o("error")}; color: #fff; border: none; }
            & .cd__adminnote { margin: ${a("sm")} 0 0; font-size: 0.8rem; color: ${o("text-muted")}; }
            & .cd__cutoutcome { &:empty { display: none; } margin-bottom: ${a("md")}; font-size: 0.85rem;
                ${O()} padding: ${a("md")} ${a("lg")}; }
            & .cd__cutoutcome .cd__cutgrp { margin-bottom: ${a("xs")}; }
            & .cd__cutoutcome strong { color: ${o("text")}; }

            & .cd__setswitch { display: flex; gap: ${a("xs")}; margin-bottom: ${a("sm")};
                &:empty { display: none; }
                & button {
                    ${S()}
                    padding: ${a("xs")} ${a("md")}; font-family: inherit;
                    font-size: 0.85rem; font-weight: 700; cursor: pointer;
                    &.on { background: ${o("primary")}; color: ${o("primary-text")}; border-color: ${o("primary")}; }
                }
            }

            /* --- aggregated / official board --- */
            & .cd__board { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            & .cd__official-banner {
                ${O()} padding: ${a("sm")} ${a("lg")}; margin-bottom: ${a("sm")};
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
    `;competitions=this.inject(ne);state=this.inject(pe);router=this.inject(R);render(){const e=()=>this.competitions.detail.get();this.track(N(()=>{const s=this.state.id.get();s&&B(()=>{this.state.enter(),this.competitions.loadDetail(s)})})),this.state.initialize();const t=this.wire(Ho,{back:{onclick:()=>this.router.navigate("/competitions")},loading:{className:()=>this.competitions.detailLoading.get()&&e()===null?"cd__loading":"cd__loading hidden"},loadErr:{textContent:()=>this.competitions.detailError.get()?.message??"",className:()=>this.competitions.detailError.get()?"cd__loaderr":"cd__loaderr hidden"},body:{className:()=>e()?"cd__body":"cd__body hidden"},name:()=>e()?.name??"",chip:{textContent:()=>as(this.state.lifecycle.get()),className:()=>ls(this.state.lifecycle.get())},ownerLine:{textContent:()=>this.state.admin.get()?"You administer this competition.":"Read-only view."},mutateErr:{textContent:()=>this.competitions.mutateError.get()??""},transitionRow:{className:()=>this.state.admin.get()&&Le(this.state.lifecycle.get())?"cd__transition":"cd__transition hidden"},transitionBtn:{textContent:()=>Le(this.state.lifecycle.get())?.label??"",disabled:()=>this.competitions.mutating.get(),onclick:()=>{const s=Le(this.state.lifecycle.get()),n=this.state.id.get();s&&n&&this.competitions.transition(n,s.to)}}});return this.spawn(_o,this.ref(t,"setup")),this.spawn($o,this.ref(t,"roster")),this.spawn(Io,this.ref(t,"rounds")),this.spawn(Ao,this.ref(t,"results")),t}}const Fo=y(`
    <div class="app-shell">
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class Bo extends P{static styles=`
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
    `;router=this.inject(R);render(){const e=this.wire(Fo,{});return this.spawn(Tn,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":ht,"/history":Fn,"/round":ar,"/create":Mr,"/login":Kr,"/friends":Yr,"/profile":Jr,"/admin":oo,...Wt.competitions?{"/competitions":ho,"/competition":Mo}:{}},ht),e}}class Go extends A{async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await os(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await Fr()),this.error.set(null)}catch(e){e instanceof G&&e.status===401?this.error.set(null):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await Br(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof G&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}}D.get(Os);const Nt=D.get(R);D.set(A,new Go);const Pt=D.get(A);await Ds(Bo,"#app",{hot:void 0,onInit:async()=>{await Pt.load(),Pt.currentUser.get()&&Nt.route.get()==="/login"&&Nt.navigate("/",!0)}});export{De as A,P as C,R,p as S,Os as T,g as a,ue as b,k as c,ks as d,N as e,$s as n,j as r,y as t};
