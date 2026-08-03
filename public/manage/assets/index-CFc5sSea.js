(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function r(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function n(s){if(s.ep)return;s.ep=!0;const a=r(s);fetch(s.href,a)}})();const Te="modulepreload",Ce=function(t){return"/tapscore/manage/"+t},re={},Oe=function(e,r,n){let s=Promise.resolve();if(r&&r.length>0){let p=function(m){return Promise.all(m.map(g=>Promise.resolve(g).then(b=>({status:"fulfilled",value:b}),b=>({status:"rejected",reason:b}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),l=i?.nonce||i?.getAttribute("nonce");s=p(r.map(m=>{if(m=Ce(m),m in re)return;re[m]=!0;const g=m.endsWith(".css"),b=g?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${m}"]${b}`))return;const y=document.createElement("link");if(y.rel=g?"stylesheet":Te,g||(y.as="script"),y.crossOrigin="",y.href=m,l&&y.setAttribute("nonce",l),document.head.appendChild(y),g)return new Promise((S,z)=>{y.addEventListener("load",S),y.addEventListener("error",()=>z(new Error(`Unable to preload CSS for ${m}`)))})}))}function a(i){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=i,window.dispatchEvent(l),!l.defaultPrevented)throw i}return s.then(i=>{for(const l of i||[])l.status==="rejected"&&a(l.reason);return e().catch(a)})},H="/tapscore/manage/".replace(/\/+$/,""),X=H+"/api",F={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},Pe=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function Le(t,e){const r={};for(const[n,s]of Pe)if(n in t)for(const a of s)a in t||(r[a]=`var(--${n})`);return{...e,...r,...t}}const de=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],Re={thin:"1px",medium:"3px",thick:"5px"};function ce(t){const e=t.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":Re[e.toLowerCase()]??e}function je(){return de.map(t=>{const e=ce(F[t]);return`@property --${t}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const le={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},ue={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},Ae={...ue,"done-opacity":"0.35"},ze={...le,...ue,...F,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},Ie={...le,...Ae,...F,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class De{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const r of[...e])r.disposed||(this.batching?this.pending.add(r):r.run())}runTracked(e,r){if(e.disposed)return;he(e);const n=this.tracking;this.tracking=e;try{r()}finally{this.tracking=n}}untrack(e){const r=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=r}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const r=[...this.pending];this.pending.clear();for(const n of r)n.disposed||n.run()}}}const T=new De;function he(t){for(const e of t.deps)e.delete(t);t.deps.clear()}class v{constructor(e){this.subs=new Set,this.val=e}get(){return T.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,T.notify(this.subs))}update(e){this.set(e(this.val))}}class q{constructor(e){this.subs=new Set,this.val=void 0;const r=this,n={run(){T.runTracked(n,()=>{const s=e();Object.is(r.val,s)||(r.val=s,T.notify(r.subs))})},deps:new Set};n.run()}get(){return T.subscribe(this.subs),this.val}peek(){return this.val}}function x(t){const e={run(){T.runTracked(e,t)},deps:new Set};return e.run(),()=>{e.disposed=!0,he(e)}}function U(t){T.batch(t)}function _(t){return T.untrack(t)}class Me{constructor(){this.instances=new Map}get(e){let r=this.instances.get(e);return r||(r=new e,this.instances.set(e,r)),r}set(e,r){this.instances.set(e,r)}reset(){this.instances.clear()}}const P=new Me,R=H;function J(t){return R?t===R?"/":t.startsWith(R+"/")?t.slice(R.length):t:t}function Ne(t){return R+t}class K{constructor(){this.route=new v(J(location.pathname??"/")),this.search=new v(location.search??""),window.addEventListener("popstate",()=>U(()=>{this.route.set(J(location.pathname)),this.search.set(location.search)}))}navigate(e,r){const n=typeof r=="boolean"?{replace:r}:r??{},s=e.indexOf("#"),a=s>=0?e.slice(s):"",i=s>=0?e.slice(0,s):e,l=i.indexOf("?"),p=l>=0?i.slice(0,l):i,m=l>=0?i.slice(l+1):"",g=n.query!==void 0?qe(n.query):m?"?"+m:"",b=Ne(p)+g+a;(n.replace?history.replaceState:history.pushState).call(history,null,"",b),U(()=>{this.route.set(p),this.search.set(g)})}back(){history.back()}link(e,r="active"){const n=e.split("#")[0].split("?")[0];return{onclick:s=>{s.preventDefault(),this.navigate(e)},className:()=>{const s=this.route.get();return s===n||s.startsWith(n+"/")?r:""}}}params(e){const r=e.split("/");return new q(()=>{const n=this.route.get().split("/"),s={};for(const[a,i]of r.entries())i.startsWith(":")&&(s[i.slice(1)]=n[a]??"");return s})}query(e){return new q(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new q(()=>{const e={};for(const[r,n]of new URLSearchParams(this.search.get()))e[r]=n;return e})}}function qe(t){const e=new URLSearchParams;for(const[n,s]of Object.entries(t))s==null||s===""||e.set(n,String(s));const r=e.toString();return r?"?"+r:""}function Ge(t){return e=>t[e]}const Be="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",ne="data-basics-global";function Ue(){if(document.head.querySelector(`style[${ne}]`))return;const t=document.createElement("style");t.setAttribute(ne,""),t.textContent=je()+Be,document.head.appendChild(t)}function We(t,e){Ue();const r=new Set(de),n=(a,i,l)=>{const p=Object.entries(a).map(([m,g])=>`--${m}:${r.has(m)?ce(g):g}`).join(";");return`${i}{color-scheme:${l};${p}}`},s=document.createElement("style");return s.textContent=n(t,'[data-theme="light"]',"light")+n(e,'[data-theme="dark"]',"dark"),document.head.appendChild(s),a=>`var(--${a})`}const se="basics-js-theme";class fe{constructor(){this.dark=new v(!1);const e=localStorage.getItem(se),r=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":r),x(()=>{const n=this.dark.get();document.documentElement.setAttribute("data-theme",n?"dark":"light"),localStorage.setItem(se,n?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function w(t){const e=document.createElement("template");return e.innerHTML=t,e}function He(t,e){let r;for(const n of Object.keys(e))t.startsWith(n+"/")&&(!r||n.length>r.length)&&(r=n);return r?e[r]:void 0}const ae=new Set;class ${constructor(e={}){this.props=e,this.disposers=[],this.children=[];const r=this.constructor;if(r.styles&&!ae.has(r)){ae.add(r);const n=document.createElement("style");n.textContent=r.styles,document.head.appendChild(n)}}onMount(){}onDestroy(){}inject(e){return P.get(e)}track(e){this.disposers.push(e)}ref(e,r){return e.querySelector(`[bind="${r}"]`)}spawn(e,r,...n){const s=_(()=>{const a=new e(n[0]);return a.mount(r),a});return this.children.push(s),s}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){_(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,r,n){const s=n??(i=>this.track(i)),a=e.content.cloneNode(!0);for(const i of a.querySelectorAll("[bind]")){const l=r[i.getAttribute("bind")];if(l)if(typeof l=="function")s(x(()=>{const p=l();i instanceof HTMLInputElement||i instanceof HTMLTextAreaElement?i.value=String(p):i.textContent=String(p)}));else for(const[p,m]of Object.entries(l)){const g=p.includes("-");p.startsWith("on")&&typeof m=="function"?i.addEventListener(p.slice(2),m):typeof m=="function"?s(x(()=>{const b=m();g?i.setAttribute(p,String(b)):i[p]=b})):g?i.setAttribute(p,String(m)):i[p]=m}}return a}wireEl(e,r,n){return this.wire(e,r,n).firstElementChild}slot(e,r){const n=this.props[e];if(n==null)return!1;const s=this.ref(r,e);return s?(typeof n=="string"?s.textContent=n:typeof n=="function"&&n.prototype instanceof $?this.spawn(n,s):typeof n=="function"&&n(s,{spawn:(a,i,...l)=>this.spawn(a,i,...l),track:a=>this.track(a)}),!0):!1}$each(e,r,n,s=(a,i)=>i){const a=typeof r=="function"?r:()=>r.get(),i=new Map,l=new Map;this.track(()=>{for(const p of l.values())p.forEach(m=>m());l.clear()}),this.track(x(()=>{const p=a(),m=new Map;for(const[b,y]of p.entries()){const S=s(y,b);if(i.has(S))m.set(S,i.get(S));else{const z=[];m.set(S,_(()=>n(y,b,Ee=>z.push(Ee)))),l.set(S,z)}}for(const[b,y]of i)m.has(b)||(y.remove(),_(()=>l.get(b)?.forEach(S=>S())),l.delete(b));let g=e.firstChild;for(const b of m.values())b===g?g=g.nextSibling:e.insertBefore(b,g);i.clear();for(const[b,y]of m)i.set(b,y)}))}$condition(e,r,n,s){let a=null;this.track(x(()=>{a&&(a.remove(),a=null);const i=r.get();a=_(()=>i?n():s?.()??null),a&&e.appendChild(a)}))}$swap(e,r,n,s){let a=null;this.track(x(()=>{if(a){const p=a;a=null,_(()=>p.destroy())}e.textContent="";const i=r.get(),l=n[i]??He(i,n)??s;l&&(a=_(()=>{const p=new l;return p.mount(e),p}))})),this.track(()=>a?.destroy())}}const W=new Set;function Fe(t){return W.add(t),()=>W.delete(t)}function Ke(){for(const t of Array.from(W)){W.delete(t);try{t()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function Ye(t,e,r){const n=document.querySelector(e);n.textContent="";const s=P.get(K);let a=null,i=!1,l=null,p=!!r?.hot?.data.hmr;const m=async g=>{a&&(a.destroy(),a=null,n.textContent=""),g?(l||(l=(await Oe(()=>import("./obs-shell.component-m0B2l4Ec.js"),[])).ObsShellComponent),a=_(()=>new l)):(!p&&r?.onInit&&(await r.onInit(),p=!0),a=_(()=>new t)),_(()=>a.mount(n)),i=g};await m(J(location.pathname).startsWith("/_obs")),x(()=>{const g=s.route.get().startsWith("/_obs");g!==i&&m(g)}),r?.hot&&(r.hot.data.hmr=!0,r.hot.dispose(()=>{try{a?.destroy()}catch(g){console.error("[startApp] the root component threw while disposing",g)}if(a=null,Ke(),r.onDispose)try{r.onDispose()}catch(g){console.error("[startApp] onDispose threw",g)}}),r.hot.accept())}class k extends Error{constructor(e,r,n,s){super(r),this.status=e,this.details=n,this.traceId=s,this.name="ApiError"}}const Qe=10,G=[];let B=[],j=null;function Ve(t){G.push(t),G.length>Qe&&G.shift()}function me(t,e,r){const n={code:t,message:e,url:typeof location<"u"?location.href:"",context:[...G],timestamp:new Date().toISOString()};r!==void 0&&(n.traceId=r),B.push(n),Xe()}function Xe(){j||(j=setTimeout(ge,5e3))}function ge(){if(j&&(clearTimeout(j),j=null),B.length===0)return;const t=B;B=[];for(const e of t){const r=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${X}/_obs/errors`,new Blob([r],{type:"application/json"})):typeof fetch<"u"&&fetch(`${X}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:r}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&ge()});const Je=3e4,Ze=2,I=new Map,pe=new WeakMap;function et(t){if(t instanceof k)return t.traceId;if(t!=null&&typeof t=="object")return pe.get(t)}async function u(t){if(t.method==="GET"){const e=I.get(t.url);if(e)return e;const r=oe(t,Ze);return I.set(t.url,r),r.then(()=>I.delete(t.url),()=>I.delete(t.url)),r}return oe(t,0)}async function oe(t,e){const r=t.timeout??Je;let n;for(let s=0;s<=e;s++){const a=crypto.randomUUID();try{return await rt(tt(t,a),r)}catch(i){if(n=i,!(i instanceof k)&&i!=null&&typeof i=="object"&&pe.set(i,a),i instanceof k||s===e)break;await new Promise(l=>setTimeout(l,1e3*2**s))}}throw n}async function tt(t,e){const r={"X-Trace-Id":e},n={method:t.method,headers:r};t.body!==void 0&&(r["Content-Type"]="application/json",n.body=JSON.stringify(t.body));const s=await fetch(t.url,n),a=s.headers.get("x-trace-id")??e;if(Ve({type:"api",detail:`${t.method} ${t.url}`,timestamp:new Date().toISOString()}),!s.ok){const i=await s.json().catch(()=>({error:s.statusText}));throw new k(s.status,i.error??s.statusText,i.details,a)}return s.json()}function rt(t,e){let r;const n=new Promise((s,a)=>{r=setTimeout(()=>a(new Error("Request timeout")),e)});return Promise.race([t,n]).finally(()=>clearTimeout(r))}const Z=new Set;let Y=!1;function nt(t){return Z.add(t),()=>{Z.delete(t)}}function st(){if(!Y){Y=!0;try{for(const t of[...Z])try{t()}catch(e){try{me("session-listener",at(e))}catch{}}}finally{Y=!1}}}function at(t){try{if(t instanceof Error){const e=t.message;if(typeof e=="string")return e}return String(t)}catch{return"listener threw a value that could not be described"}}async function D(t,e,r,n={}){U(()=>{t.set(!0),e.set(null)});try{const s=await r();return t.set(!1),s}catch(s){const a=ot(s);U(()=>{t.set(!1),e.set(a)}),me(a.code,a.message,et(s)),a.code==="auth"&&n.sessionExpiry!==!1&&st();return}}function ot(t){return t instanceof k?t.status===401?{code:"auth",message:"Unauthorized"}:t.status===409?{code:"conflict",message:"Data has changed — please try again"}:t.status===400?{code:"validation",message:t.message}:t.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:t instanceof Error?t.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const Q={sessionExpiry:!1};function it(t){return{me:()=>u({method:"GET",url:`${t}/auth/me`}),login:e=>u({method:"POST",url:`${t}/auth/login`,body:e}),logout:()=>u({method:"POST",url:`${t}/auth/logout`,body:{}}),logoutAll:()=>u({method:"POST",url:`${t}/auth/logout-all`,body:{}})}}class C{constructor(){this.api=it(X),this.currentUser=new v(null),this.loading=new v(!1),this.error=new v(null),this.offSessionExpired=nt(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=Fe(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await D(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,r){const n=await D(this.loading,this.error,()=>this.api.login({username:e,password:r}),Q);return n?(this.currentUser.set(n),!0):!1}async logout(){await D(this.loading,this.error,()=>this.api.logout(),Q);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}async logoutEverywhere(){const e=await D(this.loading,this.error,()=>this.api.logoutAll(),Q),r=this.error.get();return(!r||r.code==="auth")&&this.currentUser.set(null),e?.revoked??null}}const be={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},dt={...be,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},ct={...be,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"};function ye(t,e={}){const r=t==="light"?dt:ct,n=t==="light"?ze:Ie;return Le({...r,...e},n)}const ve={"manage-page-pad":"var(--space-4)","manage-page-pad-wide":"var(--space-6)","manage-stack-gap":"var(--space-3)","manage-section-gap":"var(--space-5)","manage-touch-target":"44px","manage-table-bg":"var(--surface)","manage-table-radius":"var(--radius)","manage-table-border":"var(--border)","manage-table-header-bg":"var(--surface-sunken)","manage-table-header-fg":"var(--text-muted)","manage-table-header-border":"var(--border-strong)","manage-table-header-pad-y":"var(--space-2)","manage-table-header-pad-x":"var(--space-3)","manage-table-cell-pad-y":"var(--space-3)","manage-table-cell-pad-x":"var(--space-3)","manage-table-row-border":"var(--border)","manage-table-row-hover-bg":"var(--hover-bg)","manage-table-card-gap":"var(--space-2)","manage-sidebar-width":"232px","manage-content-max":"1120px"},we=t=>({"manage-chrome-bg":"var(--topbar-bg)","manage-chrome-fg":t,"manage-chrome-fg-muted":"color-mix(in srgb, var(--manage-chrome-fg) 66%, transparent)","manage-chrome-border":"color-mix(in srgb, var(--manage-chrome-fg) 14%, transparent)","manage-chrome-hover-bg":"color-mix(in srgb, var(--manage-chrome-fg) 9%, transparent)","manage-chrome-active-bg":"color-mix(in srgb, var(--manage-chrome-fg) 16%, transparent)","manage-scrim":"color-mix(in srgb, var(--topbar-bg) 62%, transparent)"}),$e=ye("light",{...ve,...we("var(--primary-text)")}),_e=ye("dark",{...ve,...we("var(--text)")}),o=We($e,_e);function lt(){const t=document.querySelector('meta[name="theme-color"]');if(!t)return;const e=P.get(fe);x(()=>{const n=(e.dark.get()?_e:$e)["topbar-bg"];n&&t.setAttribute("content",n)})}const E="/tapscore/manage/".replace(/\/+$/,"").replace(/\/manage$/,"")+"/api";function xe(t,e){return u({method:"POST",url:`${E}/auth/login`,body:{username:t,password:e}})}function ut(){return u({method:"GET",url:`${E}/auth/me`})}function ht(){return u({method:"POST",url:`${E}/auth/logout`,body:{}})}function ft(){return u({method:"POST",url:`${E}/auth/logout-all`,body:{}})}class mt extends C{async login(e,r){this.loading.set(!0);try{return this.currentUser.set(await xe(e,r)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await ut()),this.error.set(null)}catch(e){e instanceof k&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await ht(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof k&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logoutEverywhere(){this.loading.set(!0);try{const e=await ft();return this.currentUser.set(null),this.error.set(null),e.revoked}catch(e){return e instanceof k&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"}),null}finally{this.loading.set(!1)}}}function gt(t){return{async list(){return u({method:"GET",url:`${t}/clubs`})},async get(e){const r=new URLSearchParams;for(const[s,a]of Object.entries(e))a!==void 0&&r.set(s,String(a));const n=r.toString();return u({method:"GET",url:`${t}/clubs/get${n?"?"+n:""}`})},async create(e){return u({method:"POST",url:`${t}/clubs`,body:e})},async update(e){return u({method:"POST",url:`${t}/clubs/update`,body:e})},async remove(e){return u({method:"DELETE",url:`${t}/clubs/${e.id}`})}}}function pt(t){return{async list(){return u({method:"GET",url:`${t}/courses`})},async listByClub(e){const r=new URLSearchParams;for(const[s,a]of Object.entries(e))a!==void 0&&r.set(s,String(a));const n=r.toString();return u({method:"GET",url:`${t}/courses/by-club${n?"?"+n:""}`})},async get(e){const r=new URLSearchParams;for(const[s,a]of Object.entries(e))a!==void 0&&r.set(s,String(a));const n=r.toString();return u({method:"GET",url:`${t}/courses/get${n?"?"+n:""}`})},async teeRoleCatalog(){return u({method:"GET",url:`${t}/courses/tee-roles/catalog`})},async teeRoles(e){const r=new URLSearchParams;for(const[s,a]of Object.entries(e))a!==void 0&&r.set(s,String(a));const n=r.toString();return u({method:"GET",url:`${t}/courses/tee-roles${n?"?"+n:""}`})},async create(e){return u({method:"POST",url:`${t}/courses`,body:e})},async update(e){return u({method:"POST",url:`${t}/courses/update`,body:e})},async updateHole(e){return u({method:"POST",url:`${t}/courses/holes/update`,body:e})},async setTeeRole(e){return u({method:"POST",url:`${t}/courses/tee-roles`,body:e})},async clearTeeRole(e){return u({method:"DELETE",url:`${t}/courses/tee-roles/${e.courseId}/${e.roleKey}/${e.gender}`})},async validate(e){const r=new URLSearchParams;for(const[s,a]of Object.entries(e))a!==void 0&&r.set(s,String(a));const n=r.toString();return u({method:"GET",url:`${t}/courses/validate${n?"?"+n:""}`})},async remove(e){return u({method:"DELETE",url:`${t}/courses/${e.id}`})}}}function bt(t){return{async listByCourse(e){const r=new URLSearchParams;for(const[s,a]of Object.entries(e))a!==void 0&&r.set(s,String(a));const n=r.toString();return u({method:"GET",url:`${t}/tees/by-course${n?"?"+n:""}`})},async get(e){const r=new URLSearchParams;for(const[s,a]of Object.entries(e))a!==void 0&&r.set(s,String(a));const n=r.toString();return u({method:"GET",url:`${t}/tees/get${n?"?"+n:""}`})},async create(e){return u({method:"POST",url:`${t}/tees`,body:e})},async update(e){return u({method:"POST",url:`${t}/tees/update`,body:e})},async remove(e){return u({method:"DELETE",url:`${t}/tees/${e.id}`})}}}function yt(t){return{async myRoles(){return u({method:"GET",url:`${t}/me/roles`})},async adminStats(){return u({method:"GET",url:`${t}/admin/stats`})},async adminRounds(e){const r=new URLSearchParams;for(const[s,a]of Object.entries(e))a!==void 0&&r.set(s,String(a));const n=r.toString();return u({method:"GET",url:`${t}/admin/rounds${n?"?"+n:""}`})},async adminPlayers(){return u({method:"GET",url:`${t}/admin/players`})},async adminGrantRole(e){return u({method:"POST",url:`${t}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return u({method:"POST",url:`${t}/admin/roles/revoke`,body:e})}}}const vt={clubs:gt(E),courses:pt(E),tees:bt(E),admin:yt(E)};class L{roles=new v([]);loaded=new v(!1);error=new v(null);inflight=null;isSuperAdmin(){return this.has("super_admin")}canManageCourses(){return this.isSuperAdmin()||this.has("course_admin")}has(e){return this.roles.get().some(r=>r.role===e&&r.scopeType===null)}load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.error.set(null);try{this.roles.set(await vt.admin.myRoles())}catch(r){this.roles.set([]),r instanceof k&&r.status===401||(this.error.set("Cannot reach the server."),this.inflight=null)}finally{this.loaded.set(!0)}})(),this.inflight)}clear(){this.roles.set([]),this.loaded.set(!1),this.error.set(null),this.inflight=null}}const h=t=>`var(--${t})`,d=(t,e)=>`var(--${t}, ${e})`,c=t=>{const e=F[t];if(e===void 0)throw new Error(`unknown control token: --${t}`);return e},f=Ge({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),M=t=>`
    background: ${d(`btn-${t}-bg`,c(`btn-${t}-bg`))};
    color: ${d(`btn-${t}-fg`,c(`btn-${t}-fg`))};
    border-color: ${d(`btn-${t}-border`,c(`btn-${t}-border`))};
    box-shadow: ${d(`btn-${t}-shadow`,c(`btn-${t}-shadow`))};
    &:hover {
        background: ${d(`btn-${t}-bg-hover`,c(`btn-${t}-bg-hover`))};
        color: ${d(`btn-${t}-fg-hover`,c(`btn-${t}-fg-hover`))};
        border-color: ${d(`btn-${t}-border-hover`,c(`btn-${t}-border-hover`))};
    }`,ke=`
    background: ${d("btn-disabled-bg",c("btn-disabled-bg"))};
    color: ${d("btn-disabled-fg",c("btn-disabled-fg"))};
    border-color: ${d("btn-disabled-border",c("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${d("btn-disabled-opacity",c("btn-disabled-opacity"))};
    cursor: not-allowed;`,wt={primary:M("primary"),secondary:M("secondary"),ghost:M("ghost"),danger:M("danger"),disabled:ke},O=(t=d("btn-radius",c("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${d("btn-border-width",c("btn-border-width"))} solid transparent;
    border-radius: ${t};
    padding: ${d("btn-padding-y",c("btn-padding-y"))} ${d("btn-padding-x",c("btn-padding-x"))};
    font-family: ${h("font-ui")};
    font-size: ${d("btn-font-size",c("btn-font-size"))};
    line-height: ${d("btn-line-height",c("btn-line-height"))};
    font-weight: ${d("btn-font-weight",c("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${h("dur-fast")} ${h("ease-standard")},
        border-color ${h("dur-fast")} ${h("ease-standard")},
        color ${h("dur-fast")} ${h("ease-standard")},
        box-shadow ${h("dur-fast")} ${h("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${d("btn-focus-ring-width",c("btn-focus-ring-width"))} ${d("btn-focus-ring",c("btn-focus-ring"))};
    }
    ${wt[e]}
    &:disabled {${ke}}
`,$t=`max(${d("field-border-width",c("field-border-width"))}, ${d("field-rule-width",c("field-rule-width"))})`,N=(t,e)=>`
    border-top-color: ${t};
    border-right-color: ${t};
    border-left-color: ${t};
    border-bottom-color: ${e};`,_t=()=>`
    border-style: solid;
    border-top-width: ${d("field-border-width",c("field-border-width"))};
    border-right-width: ${d("field-border-width",c("field-border-width"))};
    border-left-width: ${d("field-border-width",c("field-border-width"))};
    border-bottom-width: ${$t};
    ${N(d("field-border",c("field-border")),d("field-rule",c("field-rule")))}
    border-radius: ${d("field-radius",c("field-radius"))};
    padding: ${d("field-padding-y",c("field-padding-y"))} ${d("field-padding-x",c("field-padding-x"))};
    background: ${d("field-bg",c("field-bg"))};
    color: ${h("text")};
    font-family: ${h("font-ui")};
    font-size: ${d("field-font-size",c("field-font-size"))};
    line-height: ${d("field-line-height",c("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${h("dur-fast")} ${h("ease-standard")},
        box-shadow ${h("dur-fast")} ${h("ease-standard")},
        background ${h("dur-fast")} ${h("ease-standard")};
    &::placeholder { color: ${h("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${N(d("field-focus-border",c("field-focus-border")),d("field-focus-border",c("field-focus-border")))}
        background: ${d("field-bg-focus",c("field-bg-focus"))};
        box-shadow: 0 0 0 ${d("field-focus-ring-width",c("field-focus-ring-width"))} ${d("field-focus-ring",c("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${N(d("field-invalid-border",c("field-invalid-border")),d("field-invalid-rule",c("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${N(d("field-invalid-border",c("field-invalid-border")),d("field-invalid-rule",c("field-invalid-rule")))}
        background: ${d("field-bg-focus",c("field-bg-focus"))};
        box-shadow: 0 0 0 ${d("field-focus-ring-width",c("field-focus-ring-width"))} ${d("field-invalid-ring",c("field-invalid-ring"))};
    }
`,xt=()=>`
    display: block;
    font-family: ${h("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${h("text-muted")};
`,ee=t=>`
    background: ${h("surface")};
    border: 1px solid ${h("border")};
    border-radius: ${h("radius-md")};
    box-shadow: ${h("shadow-1")};
    ${t?.hover?`
    transition:
        box-shadow ${h("dur-base")} ${h("ease-standard")},
        border-color ${h("dur-base")} ${h("ease-standard")};
    &:hover { box-shadow: ${h("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${xt()}
        margin: 0 0 ${f("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${h("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${h("text")};
    }
    & .ui-card__meta {
        margin: ${f("xs")} 0 0 0;
        font-family: ${h("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${h("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${f("md")};
        font-family: ${h("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${h("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;class te{crumbs=new v([]);set(e){this.crumbs.set(e)}}const kt=w(`
    <section class="mcourses">
        <h1 class="mcourses__title">Courses</h1>
        <p class="mcourses__lead">Clubs, courses, holes, tees and tee roles — the shared golf catalog every round is built from.</p>
        <div class="mcourses__panel">
            <p class="mcourses__panel-title">Coming in M1</p>
            <ul class="mcourses__list">
                <li>Clubs — list, search, create, edit, delete</li>
                <li>Courses — per club, with a readiness badge</li>
                <li>Holes — par and stroke index per hole</li>
                <li>Tees — lengths and ratings per gender</li>
                <li>Tee roles — which tee a Club or Tournament round plays from</li>
            </ul>
        </div>
    </section>
`);class St extends ${static styles=`
        .mcourses {
            display: flex;
            flex-direction: column;
            gap: ${f("md")};

            & .mcourses__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${o("text")};
            }

            & .mcourses__lead {
                margin: 0;
                max-width: 60ch;
                color: ${o("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mcourses__panel {
                ${ee({})}
                margin-top: ${o("manage-stack-gap")};
                padding: ${o("manage-page-pad")};

                & .mcourses__panel-title {
                    margin: 0 0 ${f("sm")};
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: ${o("text-muted")};
                }

                & .mcourses__list {
                    margin: 0;
                    padding-left: ${f("lg")};
                    display: flex;
                    flex-direction: column;
                    gap: ${f("xs")};
                    color: ${o("text")};
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
            }
        }
    `;crumbs=this.inject(te);render(){return this.wire(kt,{})}onMount(){this.crumbs.set([{label:"Courses"}])}}const Et=[{id:"courses",label:"Courses",path:"/courses",routes:{"/courses":St},unlocked:t=>t.canManageCourses()}];function A(t){return Et.filter(e=>e.unlocked(t))}function Tt(t){const e={};for(const r of A(t))Object.assign(e,r.routes);return e}const Ct=900,Ot=`(min-width: ${Ct}px)`,Pt=w(`
    <nav class="mnav" aria-label="Sections">
        <ul bind="list" class="mnav__list"></ul>
    </nav>
`),Lt=w(`
    <li class="mnav__item">
        <a bind="link" class="mnav__link"><span bind="label"></span></a>
    </li>
`);class ie extends ${static styles=`
        .mnav {
            & .mnav__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            & .mnav__link {
                display: flex;
                align-items: center;
                /* The touch-target floor is a MINIMUM, not a target size: the
                   density in this app comes from spacing, never from a
                   smaller hit area (spec §2.5). */
                min-height: ${o("manage-touch-target")};
                padding: 0 ${f("md")};
                border-radius: ${o("radius-sm")};
                color: ${o("manage-chrome-fg-muted")};
                font-size: 0.95rem;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;

                &:hover {
                    background: ${o("manage-chrome-hover-bg")};
                    color: ${o("manage-chrome-fg")};
                }

                &:focus-visible {
                    outline: 2px solid ${o("manage-chrome-fg")};
                    outline-offset: -2px;
                }

                /* Elevation, not saturation — design-guidelines §2. */
                &.mnav__link--active {
                    background: ${o("manage-chrome-active-bg")};
                    color: ${o("manage-chrome-fg")};
                    font-weight: 700;
                }
            }
        }
    `;router=this.inject(K);roles=this.inject(L);render(){const e=this.wire(Pt,{});return this.$each(this.ref(e,"list"),()=>A(this.roles),(r,n,s)=>this.wireEl(Lt,{link:{href:H+r.path,className:()=>{const a=this.router.route.get();return a===r.path||a.startsWith(r.path+"/")?"mnav__link mnav__link--active":"mnav__link"},"aria-current":()=>{const a=this.router.route.get();return a===r.path||a.startsWith(r.path+"/")?"page":"false"},onclick:a=>{const i=a;i.metaKey||i.ctrlKey||i.shiftKey||i.button!==0||(a.preventDefault(),this.router.navigate(r.path),this.props.onNavigate?.())}},label:()=>r.label},s),r=>r.id),e}}const Rt=w(`
    <section class="mnf">
        <h1 class="mnf__title">Nothing here</h1>
        <p class="mnf__body">That address does not match anything in Tapscore Manage.</p>
        <button bind="home" class="mnf__home" type="button"></button>
    </section>
`);class jt extends ${static styles=`
        .mnf {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: ${f("md")};

            & .mnf__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-size: 1.5rem;
                font-weight: 600;
                color: ${o("text")};
            }

            & .mnf__body {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.95rem;
            }

            & .mnf__home {
                ${O()}
                min-height: ${o("manage-touch-target")};
                padding: 0 ${f("lg")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                cursor: pointer;

                &.hidden { display: none; }
            }
        }
    `;router=this.inject(K);roles=this.inject(L);crumbs=this.inject(te);onMount(){this.crumbs.set([])}render(){const e=A(this.roles)[0];return this.wire(Rt,{home:{className:()=>e?"mnf__home":"mnf__home hidden",textContent:()=>e?`Go to ${e.label}`:"",onclick:()=>{e&&this.router.navigate(e.path,!0)}}})}}const At=w(`
    <div class="mshell">
        <header class="mshell__topbar">
            <button bind="menu" class="mshell__menu" type="button" aria-controls="manage-drawer">Menu</button>
            <span class="mshell__wordmark">Tapscore <b>Manage</b></span>
        </header>

        <aside class="mshell__sidebar">
            <div class="mshell__brand">
                <span class="mshell__wordmark">Tapscore <b>Manage</b></span>
            </div>
            <div bind="sidebarNav" class="mshell__navhost"></div>
            <div bind="sidebarIdentity" class="mshell__identity"></div>
        </aside>

        <div bind="scrim" class="mshell__scrim"></div>

        <aside bind="drawer" id="manage-drawer" class="mshell__drawer" aria-label="Sections">
            <div class="mshell__brand">
                <span class="mshell__wordmark">Tapscore <b>Manage</b></span>
                <button bind="close" class="mshell__close" type="button">Close</button>
            </div>
            <div bind="drawerNav" class="mshell__navhost"></div>
            <div bind="drawerIdentity" class="mshell__identity"></div>
        </aside>

        <main class="mshell__main">
            <nav bind="crumbs" class="mshell__crumbs" aria-label="Breadcrumb"></nav>
            <div bind="outlet" class="mshell__outlet"></div>
        </main>
    </div>
`),zt=w(`
    <li class="mshell__crumb">
        <span bind="sep" class="mshell__crumb-sep">/</span>
        <a bind="link" class="mshell__crumb-link"></a>
        <span bind="current" class="mshell__crumb-current" aria-current="page"></span>
    </li>
`),It=w(`
    <div class="mshell__identity-inner">
        <span bind="who" class="mshell__who"></span>
        <button bind="signout" class="mshell__signout" type="button">Sign out</button>
    </div>
`);class Dt extends ${static styles=`
        .mshell {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            min-height: 100vh;
            min-height: 100dvh;
            background: ${o("bg")};

            /* ─── Chrome, shared by top bar, sidebar and drawer ─── */

            & .mshell__wordmark {
                font-family: ${o("font-display")};
                font-size: 1.05rem;
                font-weight: 400;
                letter-spacing: -0.01em;
                color: ${o("manage-chrome-fg")};
                white-space: nowrap;

                & b { font-weight: 700; }
            }

            & .mshell__brand {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${f("sm")};
                min-height: ${o("manage-touch-target")};
                padding: 0 ${f("md")};
                margin-bottom: ${o("manage-stack-gap")};
            }

            /* Inset from the chrome's edges so the active item's pill reads as
               a raised shape sitting ON the sidebar, rather than as a band
               bleeding off both sides of it. */
            & .mshell__navhost {
                flex: 1;
                padding: 0 ${f("sm")};
            }

            & .mshell__identity {
                border-top: 1px solid ${o("manage-chrome-border")};
                padding-top: ${o("manage-stack-gap")};
                margin-top: ${o("manage-stack-gap")};

                & .mshell__identity-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: ${f("sm")};
                    padding: 0 ${f("md")};
                }

                & .mshell__who {
                    color: ${o("manage-chrome-fg-muted")};
                    font-size: 0.8rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }

                & .mshell__signout {
                    ${O(void 0,"ghost")}
                    min-height: ${o("manage-touch-target")};
                    padding: 0 ${f("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    /* The recipe's tiers are drawn for the PAGE surface; on the
                       ink chrome they would paint a cream slab. Shape, sizing
                       and states come from the recipe, the skin from the chrome
                       tokens — overrides after the recipe, per ADR-005. */
                    background: transparent;
                    color: ${o("manage-chrome-fg")};
                    border-color: ${o("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${o("manage-chrome-hover-bg")};
                        color: ${o("manage-chrome-fg")};
                        border-color: ${o("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${o("manage-chrome-fg")};
                        outline-offset: 2px;
                    }
                }
            }

            /* ─── Narrow: top bar + drawer ─── */

            & .mshell__topbar {
                grid-row: 1;
                display: flex;
                align-items: center;
                gap: ${f("md")};
                padding: 0 ${o("manage-page-pad")};
                padding-top: env(safe-area-inset-top);
                min-height: calc(${o("manage-touch-target")} + ${f("md")});
                background: ${o("manage-chrome-bg")};

                & .mshell__menu {
                    ${O(void 0,"ghost")}
                    min-height: ${o("manage-touch-target")};
                    min-width: ${o("manage-touch-target")};
                    padding: 0 ${f("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    /* Same reasoning as the sign-out button above: recipe for
                       shape, chrome tokens for skin. The label is the word
                       "Menu" and not a hamburger glyph on purpose — a glyph has
                       no accessible name and this control opens the app's whole
                       navigation (docs/design-guidelines.md §4). */
                    background: transparent;
                    color: ${o("manage-chrome-fg")};
                    border-color: ${o("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${o("manage-chrome-hover-bg")};
                        color: ${o("manage-chrome-fg")};
                        border-color: ${o("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${o("manage-chrome-fg")};
                        outline-offset: 2px;
                    }
                }
            }

            & .mshell__scrim {
                position: fixed;
                inset: 0;
                z-index: 30;
                background: ${o("manage-scrim")};
                opacity: 0;
                pointer-events: none;
                transition: opacity 160ms ease;

                &.open { opacity: 1; pointer-events: auto; }
            }

            & .mshell__drawer {
                position: fixed;
                top: 0;
                left: 0;
                bottom: 0;
                z-index: 40;
                display: flex;
                flex-direction: column;
                width: min(84vw, calc(${o("manage-sidebar-width")} + ${f("2xl")}));
                padding: ${o("manage-page-pad")} 0;
                padding-top: calc(${o("manage-page-pad")} + env(safe-area-inset-top));
                background: ${o("manage-chrome-bg")};
                /* The shadow disappears against a near-black page in dark
                   scheme, so a hairline carries the drawer's edge there. */
                border-right: 1px solid ${o("manage-chrome-border")};
                box-shadow: ${o("shadow-elevated")};
                transform: translateX(-100%);
                transition: transform 180ms ease;

                &.open { transform: translateX(0); }

                & .mshell__close {
                    ${O(void 0,"ghost")}
                    min-height: ${o("manage-touch-target")};
                    padding: 0 ${f("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    background: transparent;
                    color: ${o("manage-chrome-fg")};
                    border-color: ${o("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${o("manage-chrome-hover-bg")};
                        color: ${o("manage-chrome-fg")};
                        border-color: ${o("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${o("manage-chrome-fg")};
                        outline-offset: 2px;
                    }
                }
            }

            /* The sidebar does not exist below the breakpoint — hidden rather
               than reflowed, because the drawer holds the same nav and two
               copies in the tab order is a bug you only find with a keyboard. */
            & .mshell__sidebar { display: none; }

            /* ─── Content ─── */

            & .mshell__main {
                grid-row: 2;
                min-width: 0;
                padding: ${o("manage-page-pad")};
                padding-bottom: calc(${o("manage-section-gap")} + env(safe-area-inset-bottom));
            }

            & .mshell__crumbs {
                min-height: 1.25rem;
                margin-bottom: ${o("manage-stack-gap")};

                & ol {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: ${f("xs")};
                    font-size: 0.8rem;
                }

                & .mshell__crumb {
                    display: flex;
                    align-items: center;
                    gap: ${f("xs")};
                }

                & .mshell__crumb-sep {
                    color: ${o("text-muted")};
                    &.hidden { display: none; }
                }

                & .mshell__crumb-link {
                    color: ${o("text-muted")};
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;

                    &:hover { color: ${o("text")}; text-decoration: underline; }
                    &.hidden { display: none; }
                }

                & .mshell__crumb-current {
                    color: ${o("text")};
                    font-weight: 700;
                    &.hidden { display: none; }
                }
            }

            & .mshell__outlet {
                max-width: ${o("manage-content-max")};
            }

            /* ─── Wide: persistent sidebar, no top bar, no drawer ─── */

            @media ${Ot} {
                grid-template-columns: ${o("manage-sidebar-width")} 1fr;
                grid-template-rows: 1fr;

                & .mshell__topbar { display: none; }
                & .mshell__drawer,
                & .mshell__scrim { display: none; }

                & .mshell__sidebar {
                    grid-column: 1;
                    grid-row: 1;
                    display: flex;
                    flex-direction: column;
                    position: sticky;
                    top: 0;
                    align-self: start;
                    height: 100vh;
                    height: 100dvh;
                    overflow-y: auto;
                    padding: ${o("manage-page-pad-wide")} 0;
                    background: ${o("manage-chrome-bg")};
                }

                & .mshell__main {
                    grid-column: 2;
                    grid-row: 1;
                    padding: ${o("manage-page-pad-wide")};
                }
            }

            @media (prefers-reduced-motion: reduce) {
                & .mshell__scrim,
                & .mshell__drawer { transition: none; }
            }
        }
    `;router=this.inject(K);auth=this.inject(C);roles=this.inject(L);breadcrumbs=this.inject(te);drawerOpen=new v(!1);render(){const e=A(this.roles)[0];e&&this.router.route.get()==="/"&&this.router.navigate(e.path,!0);const r=this.wire(At,{menu:{onclick:()=>this.drawerOpen.set(!0),"aria-expanded":()=>String(this.drawerOpen.get())},close:{onclick:()=>this.drawerOpen.set(!1)},scrim:{className:()=>this.drawerOpen.get()?"mshell__scrim open":"mshell__scrim",onclick:()=>this.drawerOpen.set(!1)},drawer:{className:()=>this.drawerOpen.get()?"mshell__drawer open":"mshell__drawer",inert:()=>!this.drawerOpen.get()}});return this.spawn(ie,this.ref(r,"sidebarNav")),this.spawn(ie,this.ref(r,"drawerNav"),{onNavigate:()=>this.drawerOpen.set(!1)}),this.identity(this.ref(r,"sidebarIdentity")),this.identity(this.ref(r,"drawerIdentity")),this.crumbs(this.ref(r,"crumbs")),this.$swap(this.ref(r,"outlet"),this.router.route,Tt(this.roles),jt),r}onMount(){this.track(x(()=>{this.router.route.get(),this.drawerOpen.set(!1)}));const e=r=>{r.key==="Escape"&&this.drawerOpen.get()&&this.drawerOpen.set(!1)};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}identity(e){e.appendChild(this.wire(It,{who:()=>{const r=this.auth.currentUser.get();return r?`Signed in as ${r.username}`:""},signout:{onclick:()=>{this.drawerOpen.set(!1),this.auth.logout()}}}))}crumbs(e){const r=document.createElement("ol");e.appendChild(r),this.$each(r,()=>this.breadcrumbs.crumbs.get(),(n,s,a)=>this.wireEl(zt,{sep:{className:()=>s===0?"mshell__crumb-sep hidden":"mshell__crumb-sep"},link:{className:()=>n.path?"mshell__crumb-link":"mshell__crumb-link hidden",href:n.path?H+n.path:"",textContent:()=>n.path?n.label:"",onclick:i=>{const l=i;l.metaKey||l.ctrlKey||l.shiftKey||l.button!==0||(i.preventDefault(),n.path&&this.router.navigate(n.path))}},current:{className:()=>n.path?"mshell__crumb-current hidden":"mshell__crumb-current",textContent:()=>n.path?"":n.label}},a),(n,s)=>`${s}:${n.label}`)}}const V="Something went wrong on our end. Try again in a moment.";function Mt(t,e){const r=(t.details??[]).map(s=>s.path),n=s=>r.some(a=>a===`/${s}`);return n("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":n("username")?"Enter your username.":n("displayName")?"Enter a display name.":n("handicapIndex")?"Handicap index must be a number (or leave it empty).":n("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function Nt(t,e){if(t instanceof k)switch(t.status){case 400:return Mt(t,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":V;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return t.status>=500?V:"That request could not be completed."}return t instanceof Error&&t.message==="Request timeout"?"That took too long. Check your connection and try again.":t instanceof Error?"Cannot reach the server. Check your connection and try again.":V}const qt=w(`
    <div class="msignin">
        <form bind="form" class="msignin__panel">
            <div class="msignin__brand">Tapscore <b>Manage</b></div>
            <p class="msignin__lead">Sign in with your Tapscore account.</p>
            <div bind="error" class="msignin__error"></div>
            <label class="msignin__field">
                <span>Username</span>
                <input bind="username" type="text" autocomplete="username" autocapitalize="none" autofocus />
            </label>
            <label class="msignin__field">
                <span>Password</span>
                <input bind="password" type="password" autocomplete="current-password" />
            </label>
            <button bind="submit" class="msignin__submit" type="submit">Sign in</button>
        </form>
    </div>
`);class Gt extends ${static styles=`
        .msignin {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${o("manage-page-pad")};

            & .msignin__panel {
                ${ee({})}
                display: flex;
                flex-direction: column;
                gap: ${f("md")};
                width: 100%;
                max-width: 22rem;
                padding: ${o("manage-page-pad-wide")};

                &[inert] { opacity: 0.6; }
            }

            & .msignin__brand {
                font-family: ${o("font-display")};
                font-size: 1.5rem;
                font-weight: 400;
                letter-spacing: -0.01em;
                color: ${o("text")};

                & b { font-weight: 700; }
            }

            & .msignin__lead {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.9rem;
            }

            & .msignin__error {
                display: none;
                color: ${o("error")};
                font-size: 0.85rem;
                line-height: 1.4;

                &.show { display: block; }
            }

            & .msignin__field {
                display: flex;
                flex-direction: column;
                gap: ${f("xs")};

                & span {
                    color: ${o("text-muted")};
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                & input {
                    ${_t()}
                    min-height: ${o("manage-touch-target")};
                    padding: 0 ${f("md")};
                    font-family: inherit;
                    font-size: 1rem;
                }
            }

            & .msignin__submit {
                ${O(void 0,"primary")}
                min-height: ${o("manage-touch-target")};
                margin-top: ${f("xs")};
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
            }
        }
    `;auth=this.inject(C);roles=this.inject(L);username="";password="";busy=new v(!1);formError=new v("");render(){return this.wire(qt,{form:{inert:()=>this.busy.get(),onsubmit:async e=>{e.preventDefault(),await this.submit()}},error:{className:()=>this.formError.get()?"msignin__error show":"msignin__error",textContent:()=>this.formError.get()},username:{oninput:e=>{this.username=e.target.value}},password:{oninput:e=>{this.password=e.target.value}},submit:{textContent:()=>this.busy.get()?"Signing in…":"Sign in"}})}async submit(){if(this.formError.set(""),!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const e=await xe(this.username.trim(),this.password);this.roles.clear(),this.auth.error.set(null),this.auth.currentUser.set(e)}catch(e){this.formError.set(Nt(e,"login")),this.busy.set(!1)}}}const Bt=w(`
    <div class="mdenied">
        <div class="mdenied__panel">
            <h1 class="mdenied__title">No access to Manage</h1>
            <p class="mdenied__body">Tapscore Manage administers the shared golf catalog — clubs, courses, tees and tee roles. Your account holds no management role, so there is nothing here for it yet.</p>
            <p class="mdenied__hint">An operator with shell access to the server grants one:</p>
            <code bind="command" class="mdenied__command"></code>
            <div class="mdenied__foot">
                <span bind="who" class="mdenied__who"></span>
                <button bind="signout" class="mdenied__signout" type="button">Sign out</button>
            </div>
        </div>
    </div>
`);class Ut extends ${static styles=`
        .mdenied {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${o("manage-page-pad")};

            & .mdenied__panel {
                ${ee({})}
                display: flex;
                flex-direction: column;
                gap: ${f("md")};
                width: 100%;
                max-width: 30rem;
                padding: ${o("manage-page-pad-wide")};
            }

            & .mdenied__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-size: 1.5rem;
                font-weight: 600;
                letter-spacing: -0.01em;
                color: ${o("text")};
            }

            & .mdenied__body {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mdenied__hint {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.85rem;
            }

            & .mdenied__command {
                display: block;
                padding: ${f("sm")} ${f("md")};
                border-radius: ${o("radius-sm")};
                background: ${o("surface-sunken")};
                border: 1px solid ${o("border")};
                color: ${o("text")};
                font-size: 0.8rem;
                line-height: 1.5;
                word-break: break-all;
            }

            & .mdenied__foot {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${f("md")};
                border-top: 1px solid ${o("border")};
                padding-top: ${f("md")};

                & .mdenied__who {
                    color: ${o("text-muted")};
                    font-size: 0.8rem;
                }

                & .mdenied__signout {
                    ${O()}
                    min-height: ${o("manage-touch-target")};
                    padding: 0 ${f("lg")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                }
            }
        }
    `;auth=this.inject(C);render(){return this.wire(Bt,{command:()=>`bun run grant:role grant ${this.auth.currentUser.get()?.username??"<username>"} super_admin`,who:()=>{const e=this.auth.currentUser.get();return e?`Signed in as ${e.username}`:""},signout:{onclick:()=>{this.auth.logout()}}})}}const Wt=w(`
    <div class="mboot">
        <p class="mboot__line">Loading…</p>
    </div>
`),Ht=w(`
    <div class="mboot">
        <h1 class="mboot__title">Cannot reach the server</h1>
        <p class="mboot__line">Tapscore Manage could not check what you are allowed to manage.</p>
        <button bind="retry" class="mboot__retry" type="button">Try again</button>
    </div>
`),Se=`
    .mboot {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: ${f("md")};
        min-height: 100vh;
        min-height: 100dvh;
        padding: ${o("manage-page-pad")};
        text-align: center;

        & .mboot__title {
            margin: 0;
            font-family: ${o("font-display")};
            font-size: 1.5rem;
            font-weight: 600;
            color: ${o("text")};
        }

        & .mboot__line {
            margin: 0;
            max-width: 44ch;
            color: ${o("text-muted")};
            font-size: 0.95rem;
            line-height: 1.5;
        }

        & .mboot__retry {
            ${O()}
            min-height: ${o("manage-touch-target")};
            padding: 0 ${f("lg")};
            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
        }
    }
`;class Ft extends ${static styles=Se;render(){return this.wire(Wt,{})}}class Kt extends ${static styles=Se;roles=this.inject(L);auth=this.inject(C);render(){return this.wire(Ht,{retry:{onclick:()=>{this.auth.load(),this.roles.load(!0)}}})}}const Yt=w('<div bind="gate" class="mapp"></div>');class Qt extends ${static styles=`
        .mapp { min-height: 100vh; min-height: 100dvh; }
    `;auth=this.inject(C);roles=this.inject(L);gate=new q(()=>this.auth.loading.get()?"loading":this.auth.currentUser.get()===null?this.auth.error.get()?"failed":"signed-out":this.roles.error.get()?"failed":this.roles.loaded.get()?A(this.roles).length>0?"ready":"denied":"loading");render(){const e=this.wire(Yt,{});return this.track(x(()=>{this.auth.currentUser.get()?this.roles.load():this.roles.clear()})),this.$swap(this.ref(e,"gate"),this.gate,{loading:Ft,failed:Kt,"signed-out":Gt,denied:Ut,ready:Dt}),e}}P.get(fe);lt();P.set(C,new mt);const Vt=P.get(C);await Ye(Qt,"#app",{hot:void 0,onInit:async()=>{await Vt.load()}});export{X as A,$ as C,K as R,v as S,fe as T,u as a,U as b,q as c,Ie as d,x as e,ze as n,D as r,w as t};
