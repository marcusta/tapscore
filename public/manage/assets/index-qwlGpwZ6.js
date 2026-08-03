(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();const ct="modulepreload",dt=function(n){return"/tapscore/manage/"+n},ye={},ut=function(e,t,r){let i=Promise.resolve();if(t&&t.length>0){let h=function(c){return Promise.all(c.map(u=>Promise.resolve(u).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),l=o?.nonce||o?.getAttribute("nonce");i=h(t.map(c=>{if(c=dt(c),c in ye)return;ye[c]=!0;const u=c.endsWith(".css"),m=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${m}`))return;const $=document.createElement("link");if($.rel=u?"stylesheet":ct,u||($.as="script"),$.crossOrigin="",$.href=c,l&&$.setAttribute("nonce",l),document.head.appendChild($),u)return new Promise((x,F)=>{$.addEventListener("load",x),$.addEventListener("error",()=>F(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(o){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=o,window.dispatchEvent(l),!l.defaultPrevented)throw o}return i.then(o=>{for(const l of o||[])l.status==="rejected"&&s(l.reason);return e().catch(s)})},M="/tapscore/manage/".replace(/\/+$/,""),ae=M+"/api",Z={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},ht=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function mt(n,e){const t={};for(const[r,i]of ht)if(r in n)for(const s of i)s in n||(t[s]=`var(--${r})`);return{...e,...t,...n}}const Ne=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],ft={thin:"1px",medium:"3px",thick:"5px"};function Ae(n){const e=n.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":ft[e.toLowerCase()]??e}function gt(){return Ne.map(n=>{const e=Ae(Z[n]);return`@property --${n}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const Oe={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Ie={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},pt={...Ie,"done-opacity":"0.35"},bt={...Oe,...Ie,...Z,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},yt={...Oe,...pt,...Z,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class _t{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;ze(e);const r=this.tracking;this.tracking=e;try{t()}finally{this.tracking=r}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const r of t)r.disposed||r.run()}}}const L=new _t;function ze(n){for(const e of n.deps)e.delete(n);n.deps.clear()}class b{constructor(e){this.subs=new Set,this.val=e}get(){return L.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,L.notify(this.subs))}update(e){this.set(e(this.val))}}class U{constructor(e){this.subs=new Set,this.val=void 0;const t=this,r={run(){L.runTracked(r,()=>{const i=e();Object.is(t.val,i)||(t.val=i,L.notify(t.subs))})},deps:new Set};r.run()}get(){return L.subscribe(this.subs),this.val}peek(){return this.val}}function w(n){const e={run(){L.runTracked(e,n)},deps:new Set};return e.run(),()=>{e.disposed=!0,ze(e)}}function V(n){L.batch(n)}function C(n){return L.untrack(n)}class wt{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const I=new wt,P=M;function ie(n){return P?n===P?"/":n.startsWith(P+"/")?n.slice(P.length):n:n}function vt(n){return P+n}class z{constructor(){this.route=new b(ie(location.pathname??"/")),this.search=new b(location.search??""),window.addEventListener("popstate",()=>V(()=>{this.route.set(ie(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const r=typeof t=="boolean"?{replace:t}:t??{},i=e.indexOf("#"),s=i>=0?e.slice(i):"",o=i>=0?e.slice(0,i):e,l=o.indexOf("?"),h=l>=0?o.slice(0,l):o,c=l>=0?o.slice(l+1):"",u=r.query!==void 0?$t(r.query):c?"?"+c:"",m=vt(h)+u+s;(r.replace?history.replaceState:history.pushState).call(history,null,"",m),V(()=>{this.route.set(h),this.search.set(u)})}back(){history.back()}link(e,t="active"){const r=e.split("#")[0].split("?")[0];return{onclick:i=>{i.preventDefault(),this.navigate(e)},className:()=>{const i=this.route.get();return i===r||i.startsWith(r+"/")?t:""}}}params(e){const t=e.split("/");return new U(()=>{const r=this.route.get().split("/"),i={};for(const[s,o]of t.entries())o.startsWith(":")&&(i[o.slice(1)]=r[s]??"");return i})}query(e){return new U(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new U(()=>{const e={};for(const[t,r]of new URLSearchParams(this.search.get()))e[t]=r;return e})}}function $t(n){const e=new URLSearchParams;for(const[r,i]of Object.entries(n))i==null||i===""||e.set(r,String(i));const t=e.toString();return t?"?"+t:""}function xt(n){return e=>n[e]}const kt="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",_e="data-basics-global";function Et(){if(document.head.querySelector(`style[${_e}]`))return;const n=document.createElement("style");n.setAttribute(_e,""),n.textContent=gt()+kt,document.head.appendChild(n)}function Ct(n,e){Et();const t=new Set(Ne),r=(s,o,l)=>{const h=Object.entries(s).map(([c,u])=>`--${c}:${t.has(c)?Ae(u):u}`).join(";");return`${o}{color-scheme:${l};${h}}`},i=document.createElement("style");return i.textContent=r(n,'[data-theme="light"]',"light")+r(e,'[data-theme="dark"]',"dark"),document.head.appendChild(i),s=>`var(--${s})`}const we="basics-js-theme";class De{constructor(){this.dark=new b(!1);const e=localStorage.getItem(we),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),w(()=>{const r=this.dark.get();document.documentElement.setAttribute("data-theme",r?"dark":"light"),localStorage.setItem(we,r?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function S(n){const e=document.createElement("template");return e.innerHTML=n,e}function St(n,e){let t;for(const r of Object.keys(e))n.startsWith(r+"/")&&(!t||r.length>t.length)&&(t=r);return t?e[t]:void 0}const ve=new Set;class k{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!ve.has(t)){ve.add(t);const r=document.createElement("style");r.textContent=t.styles,document.head.appendChild(r)}}onMount(){}onDestroy(){}inject(e){return I.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...r){const i=C(()=>{const s=new e(r[0]);return s.mount(t),s});return this.children.push(i),i}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){C(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,r){const i=r??(o=>this.track(o)),s=e.content.cloneNode(!0);for(const o of s.querySelectorAll("[bind]")){const l=t[o.getAttribute("bind")];if(l)if(typeof l=="function")i(w(()=>{const h=l();o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement?o.value=String(h):o.textContent=String(h)}));else for(const[h,c]of Object.entries(l)){const u=h.includes("-");h.startsWith("on")&&typeof c=="function"?o.addEventListener(h.slice(2),c):typeof c=="function"?i(w(()=>{const m=c();u?o.setAttribute(h,String(m)):o[h]=m})):u?o.setAttribute(h,String(c)):o[h]=c}}return s}wireEl(e,t,r){return this.wire(e,t,r).firstElementChild}slot(e,t){const r=this.props[e];if(r==null)return!1;const i=this.ref(t,e);return i?(typeof r=="string"?i.textContent=r:typeof r=="function"&&r.prototype instanceof k?this.spawn(r,i):typeof r=="function"&&r(i,{spawn:(s,o,...l)=>this.spawn(s,o,...l),track:s=>this.track(s)}),!0):!1}$each(e,t,r,i=(s,o)=>o){const s=typeof t=="function"?t:()=>t.get(),o=new Map,l=new Map;this.track(()=>{for(const h of l.values())h.forEach(c=>c());l.clear()}),this.track(w(()=>{const h=s(),c=new Map;for(const[m,$]of h.entries()){const x=i($,m);if(o.has(x))c.set(x,o.get(x));else{const F=[];c.set(x,C(()=>r($,m,lt=>F.push(lt)))),l.set(x,F)}}for(const[m,$]of o)c.has(m)||($.remove(),C(()=>l.get(m)?.forEach(x=>x())),l.delete(m));let u=e.firstChild;for(const m of c.values())m===u?u=u.nextSibling:e.insertBefore(m,u);o.clear();for(const[m,$]of c)o.set(m,$)}))}$condition(e,t,r,i){let s=null;this.track(w(()=>{s&&(s.remove(),s=null);const o=t.get();s=C(()=>o?r():i?.()??null),s&&e.appendChild(s)}))}$swap(e,t,r,i){let s=null;this.track(w(()=>{if(s){const h=s;s=null,C(()=>h.destroy())}e.textContent="";const o=t.get(),l=r[o]??St(o,r)??i;l&&(s=C(()=>{const h=new l;return h.mount(e),h}))})),this.track(()=>s?.destroy())}}const X=new Set;function Tt(n){return X.add(n),()=>X.delete(n)}function Lt(){for(const n of Array.from(X)){X.delete(n);try{n()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function Nt(n,e,t){const r=document.querySelector(e);r.textContent="";const i=I.get(z);let s=null,o=!1,l=null,h=!!t?.hot?.data.hmr;const c=async u=>{s&&(s.destroy(),s=null,r.textContent=""),u?(l||(l=(await ut(()=>import("./obs-shell.component-D28tROIw.js"),[])).ObsShellComponent),s=C(()=>new l)):(!h&&t?.onInit&&(await t.onInit(),h=!0),s=C(()=>new n)),C(()=>s.mount(r)),o=u};await c(ie(location.pathname).startsWith("/_obs")),w(()=>{const u=i.route.get().startsWith("/_obs");u!==o&&c(u)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{s?.destroy()}catch(u){console.error("[startApp] the root component threw while disposing",u)}if(s=null,Lt(),t.onDispose)try{t.onDispose()}catch(u){console.error("[startApp] onDispose threw",u)}}),t.hot.accept())}class T extends Error{constructor(e,t,r,i){super(t),this.status=e,this.details=r,this.traceId=i,this.name="ApiError"}}const At=10,K=[];let Y=[],j=null;function Ot(n){K.push(n),K.length>At&&K.shift()}function Q(n,e,t){const r={code:n,message:e,url:typeof location<"u"?location.href:"",context:[...K],timestamp:new Date().toISOString()};t!==void 0&&(r.traceId=t),Y.push(r),It()}function It(){j||(j=setTimeout(Pe,5e3))}function Pe(){if(j&&(clearTimeout(j),j=null),Y.length===0)return;const n=Y;Y=[];for(const e of n){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${ae}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${ae}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Pe()});const zt=3e4,Dt=2,B=new Map,Re=new WeakMap;function oe(n){if(n instanceof T)return n.traceId;if(n!=null&&typeof n=="object")return Re.get(n)}async function _(n){if(n.method==="GET"){const e=B.get(n.url);if(e)return e;const t=$e(n,Dt);return B.set(n.url,t),t.then(()=>B.delete(n.url),()=>B.delete(n.url)),t}return $e(n,0)}async function $e(n,e){const t=n.timeout??zt;let r;for(let i=0;i<=e;i++){const s=crypto.randomUUID();try{return await Rt(Pt(n,s),t)}catch(o){if(r=o,!(o instanceof T)&&o!=null&&typeof o=="object"&&Re.set(o,s),o instanceof T||i===e)break;await new Promise(l=>setTimeout(l,1e3*2**i))}}throw r}async function Pt(n,e){const t={"X-Trace-Id":e},r={method:n.method,headers:t};n.body!==void 0&&(t["Content-Type"]="application/json",r.body=JSON.stringify(n.body));const i=await fetch(n.url,r),s=i.headers.get("x-trace-id")??e;if(Ot({type:"api",detail:`${n.method} ${n.url}`,timestamp:new Date().toISOString()}),!i.ok){const o=await i.json().catch(()=>({error:i.statusText}));throw new T(i.status,o.error??i.statusText,o.details,s)}return i.json()}function Rt(n,e){let t;const r=new Promise((i,s)=>{t=setTimeout(()=>s(new Error("Request timeout")),e)});return Promise.race([n,r]).finally(()=>clearTimeout(t))}const le=new Set;let ne=!1;function Ut(n){return le.add(n),()=>{le.delete(n)}}function he(){if(!ne){ne=!0;try{for(const n of[...le])try{n()}catch(e){try{Q("session-listener",jt(e))}catch{}}}finally{ne=!1}}}function jt(n){try{if(n instanceof Error){const e=n.message;if(typeof e=="string")return e}return String(n)}catch{return"listener threw a value that could not be described"}}async function H(n,e,t,r={}){V(()=>{n.set(!0),e.set(null)});try{const i=await t();return n.set(!1),i}catch(i){const s=Mt(i);V(()=>{n.set(!1),e.set(s)}),Q(s.code,s.message,oe(i)),s.code==="auth"&&r.sessionExpiry!==!1&&he();return}}function Mt(n){return n instanceof T?n.status===401?{code:"auth",message:"Unauthorized"}:n.status===409?{code:"conflict",message:"Data has changed — please try again"}:n.status===400?{code:"validation",message:n.message}:n.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:n instanceof Error?n.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const re={sessionExpiry:!1};function qt(n){return{me:()=>_({method:"GET",url:`${n}/auth/me`}),login:e=>_({method:"POST",url:`${n}/auth/login`,body:e}),logout:()=>_({method:"POST",url:`${n}/auth/logout`,body:{}}),logoutAll:()=>_({method:"POST",url:`${n}/auth/logout-all`,body:{}})}}class N{constructor(){this.api=qt(ae),this.currentUser=new b(null),this.loading=new b(!1),this.error=new b(null),this.offSessionExpired=Ut(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=Tt(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await H(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const r=await H(this.loading,this.error,()=>this.api.login({username:e,password:t}),re);return r?(this.currentUser.set(r),!0):!1}async logout(){await H(this.loading,this.error,()=>this.api.logout(),re);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}async logoutEverywhere(){const e=await H(this.loading,this.error,()=>this.api.logoutAll(),re),t=this.error.get();return(!t||t.code==="auth")&&this.currentUser.set(null),e?.revoked??null}}const Ue={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},Ft={...Ue,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},Bt={...Ue,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"};function je(n,e={}){const t=n==="light"?Ft:Bt,r=n==="light"?bt:yt;return mt({...t,...e},r)}const Me={"manage-page-pad":"var(--space-4)","manage-page-pad-wide":"var(--space-6)","manage-stack-gap":"var(--space-3)","manage-section-gap":"var(--space-5)","manage-touch-target":"44px","manage-table-bg":"var(--surface)","manage-table-radius":"var(--radius)","manage-table-border":"var(--border)","manage-table-header-bg":"var(--surface-sunken)","manage-table-header-fg":"var(--text-muted)","manage-table-header-border":"var(--border-strong)","manage-table-header-pad-y":"var(--space-2)","manage-table-header-pad-x":"var(--space-3)","manage-table-cell-pad-y":"var(--space-3)","manage-table-cell-pad-x":"var(--space-3)","manage-table-row-border":"var(--border)","manage-table-row-hover-bg":"var(--hover-bg)","manage-table-row-editing-bg":"var(--accent-soft)","manage-table-card-gap":"var(--space-2)","btn-danger-bg":"transparent","btn-danger-fg":"var(--danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger)","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger)","manage-sidebar-width":"232px","manage-content-max":"1120px"},qe=n=>({"manage-chrome-bg":"var(--topbar-bg)","manage-chrome-fg":n,"manage-chrome-fg-muted":"color-mix(in srgb, var(--manage-chrome-fg) 66%, transparent)","manage-chrome-border":"color-mix(in srgb, var(--manage-chrome-fg) 14%, transparent)","manage-chrome-hover-bg":"color-mix(in srgb, var(--manage-chrome-fg) 9%, transparent)","manage-chrome-active-bg":"color-mix(in srgb, var(--manage-chrome-fg) 16%, transparent)","manage-scrim":"color-mix(in srgb, var(--topbar-bg) 62%, transparent)"}),Fe=je("light",{...Me,...qe("var(--primary-text)")}),Be=je("dark",{...Me,...qe("var(--text)")}),a=Ct(Fe,Be);function Ht(){const n=document.querySelector('meta[name="theme-color"]');if(!n)return;const e=I.get(De);w(()=>{const r=(e.dark.get()?Be:Fe)["topbar-bg"];r&&n.setAttribute("content",r)})}class Gt extends N{constructor(e){super(),this.client=e}client;async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await this.client.login(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await this.client.me()),this.error.set(null)}catch(e){e instanceof T&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await this.client.logout(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof T&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logoutEverywhere(){this.loading.set(!0);try{const e=await this.client.logoutAll();return this.currentUser.set(null),this.error.set(null),e.revoked}catch(e){return e instanceof T&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"}),null}finally{this.loading.set(!1)}}}function Wt(n){return{login:(e,t)=>_({method:"POST",url:`${n}/auth/login`,body:{username:e,password:t}}),me:()=>_({method:"GET",url:`${n}/auth/me`}),logout:()=>_({method:"POST",url:`${n}/auth/logout`,body:{}}),logoutAll:()=>_({method:"POST",url:`${n}/auth/logout-all`,body:{}})}}const R="/tapscore/manage/".replace(/\/+$/,"").replace(/\/manage$/,"")+"/api",He=Wt(R);function Kt(n){return{async list(){return _({method:"GET",url:`${n}/clubs`})},async get(e){const t=new URLSearchParams;for(const[i,s]of Object.entries(e))s!==void 0&&t.set(i,String(s));const r=t.toString();return _({method:"GET",url:`${n}/clubs/get${r?"?"+r:""}`})},async create(e){return _({method:"POST",url:`${n}/clubs`,body:e})},async update(e){return _({method:"POST",url:`${n}/clubs/update`,body:e})},async remove(e){return _({method:"DELETE",url:`${n}/clubs/${e.id}`})}}}function Yt(n){return{async list(){return _({method:"GET",url:`${n}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[i,s]of Object.entries(e))s!==void 0&&t.set(i,String(s));const r=t.toString();return _({method:"GET",url:`${n}/courses/by-club${r?"?"+r:""}`})},async get(e){const t=new URLSearchParams;for(const[i,s]of Object.entries(e))s!==void 0&&t.set(i,String(s));const r=t.toString();return _({method:"GET",url:`${n}/courses/get${r?"?"+r:""}`})},async teeRoleCatalog(){return _({method:"GET",url:`${n}/courses/tee-roles/catalog`})},async teeRoles(e){const t=new URLSearchParams;for(const[i,s]of Object.entries(e))s!==void 0&&t.set(i,String(s));const r=t.toString();return _({method:"GET",url:`${n}/courses/tee-roles${r?"?"+r:""}`})},async create(e){return _({method:"POST",url:`${n}/courses`,body:e})},async update(e){return _({method:"POST",url:`${n}/courses/update`,body:e})},async updateHole(e){return _({method:"POST",url:`${n}/courses/holes/update`,body:e})},async setTeeRole(e){return _({method:"POST",url:`${n}/courses/tee-roles`,body:e})},async clearTeeRole(e){return _({method:"DELETE",url:`${n}/courses/tee-roles/${e.courseId}/${e.roleKey}/${e.gender}`})},async validate(e){const t=new URLSearchParams;for(const[i,s]of Object.entries(e))s!==void 0&&t.set(i,String(s));const r=t.toString();return _({method:"GET",url:`${n}/courses/validate${r?"?"+r:""}`})},async remove(e){return _({method:"DELETE",url:`${n}/courses/${e.id}`})}}}function Vt(n){return{async listByCourse(e){const t=new URLSearchParams;for(const[i,s]of Object.entries(e))s!==void 0&&t.set(i,String(s));const r=t.toString();return _({method:"GET",url:`${n}/tees/by-course${r?"?"+r:""}`})},async get(e){const t=new URLSearchParams;for(const[i,s]of Object.entries(e))s!==void 0&&t.set(i,String(s));const r=t.toString();return _({method:"GET",url:`${n}/tees/get${r?"?"+r:""}`})},async create(e){return _({method:"POST",url:`${n}/tees`,body:e})},async update(e){return _({method:"POST",url:`${n}/tees/update`,body:e})},async remove(e){return _({method:"DELETE",url:`${n}/tees/${e.id}`})}}}function Xt(n){return{async myRoles(){return _({method:"GET",url:`${n}/me/roles`})},async adminStats(){return _({method:"GET",url:`${n}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[i,s]of Object.entries(e))s!==void 0&&t.set(i,String(s));const r=t.toString();return _({method:"GET",url:`${n}/admin/rounds${r?"?"+r:""}`})},async adminPlayers(){return _({method:"GET",url:`${n}/admin/players`})},async adminGrantRole(e){return _({method:"POST",url:`${n}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return _({method:"POST",url:`${n}/admin/roles/revoke`,body:e})}}}const A={clubs:Kt(R),courses:Yt(R),tees:Vt(R),admin:Xt(R)};class D{roles=new b([]);loaded=new b(!1);error=new b(null);inflight=null;isSuperAdmin(){return this.has("super_admin")}canManageCourses(){return this.isSuperAdmin()||this.has("course_admin")}has(e){return this.roles.get().some(t=>t.role===e&&t.scopeType===null)}load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.error.set(null);try{this.roles.set(await A.admin.myRoles())}catch(t){this.roles.set([]),t instanceof T&&t.status===401?he():(this.error.set("Cannot reach the server."),this.inflight=null)}finally{this.loaded.set(!0)}})(),this.inflight)}clear(){this.roles.set([]),this.loaded.set(!1),this.error.set(null),this.inflight=null}}const ge=class ge extends k{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(w(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};ge.styles=`
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
    `;let ce=ge;const y=n=>`var(--${n})`,pe=class pe extends k{render(){const e=document.createElement("div"),t=(h,c)=>{typeof c=="function"?this.track(w(()=>{h.textContent=c()})):h.textContent=c};this.spawn(ce,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const r=document.createElement("h2");r.className="ui-confirm__title",t(r,this.props.title??"Confirm"),this.dialogEl.appendChild(r);const i=document.createElement("p");i.className="ui-confirm__message",t(i,this.props.message),this.dialogEl.appendChild(i);const s=document.createElement("div");s.className="ui-confirm__actions";const o=document.createElement("button");o.className="ui-confirm__btn ui-confirm__btn--cancel",t(o,this.props.cancelLabel??"Cancel"),o.addEventListener("click",h=>{h.stopPropagation(),this.handleCancel()}),s.appendChild(o);const l=document.createElement("button");return l.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(l,this.props.confirmLabel??"Confirm"),l.addEventListener("click",h=>{h.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),s.appendChild(l),this.dialogEl.appendChild(s),this.dialogEl.addEventListener("click",h=>h.stopPropagation()),e.appendChild(this.dialogEl),this.track(w(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};pe.styles=`
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${y("surface")};
            border: 1px solid ${y("border")};
            border-radius: ${y("radius-md")};
            box-shadow: ${y("shadow-3")};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition:
                opacity ${y("dur-slow")} ${y("ease-standard")},
                transform ${y("dur-slow")} ${y("ease-standard")};
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
            font-family: ${y("font-display")};
            font-size: 1.25rem;
            font-weight: 500;
            line-height: 1.4;
            color: ${y("text")};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-family: ${y("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${y("text")};
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
            font-family: ${y("font-ui")};
            font-weight: 600;
            border: 1px solid transparent;
            border-radius: ${y("radius-sm")};
            cursor: pointer;
            transition:
                background ${y("dur-fast")} ${y("ease-standard")},
                border-color ${y("dur-fast")} ${y("ease-standard")},
                color ${y("dur-fast")} ${y("ease-standard")},
                box-shadow ${y("dur-fast")} ${y("ease-standard")};
        }
        .ui-confirm__btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px ${y("accent-soft")};
        }
        .ui-confirm__btn--cancel {
            background: transparent;
            color: ${y("text-muted")};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${y("accent-soft")};
            color: ${y("accent")};
        }
        .ui-confirm__btn--confirm {
            background: ${y("accent")};
            color: ${y("on-accent")};
            border-color: ${y("accent")};
            box-shadow: ${y("shadow-1")};
        }
        .ui-confirm__btn--confirm:hover {
            background: ${y("accent-strong")};
            border-color: ${y("accent-strong")};
        }
        /* Outline, filling only on hover — same reasoning as css.ts danger. */
        .ui-confirm__btn--danger {
            background: transparent;
            color: ${y("danger")};
            border-color: ${y("danger")};
        }
        .ui-confirm__btn--danger:hover {
            background: ${y("danger")};
            color: ${y("on-danger")};
        }
    `;let J=pe;const p=n=>`var(--${n})`,f=(n,e)=>`var(--${n}, ${e})`,g=n=>{const e=Z[n];if(e===void 0)throw new Error(`unknown control token: --${n}`);return e},d=xt({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),G=n=>`
    background: ${f(`btn-${n}-bg`,g(`btn-${n}-bg`))};
    color: ${f(`btn-${n}-fg`,g(`btn-${n}-fg`))};
    border-color: ${f(`btn-${n}-border`,g(`btn-${n}-border`))};
    box-shadow: ${f(`btn-${n}-shadow`,g(`btn-${n}-shadow`))};
    &:hover {
        background: ${f(`btn-${n}-bg-hover`,g(`btn-${n}-bg-hover`))};
        color: ${f(`btn-${n}-fg-hover`,g(`btn-${n}-fg-hover`))};
        border-color: ${f(`btn-${n}-border-hover`,g(`btn-${n}-border-hover`))};
    }`,Ge=`
    background: ${f("btn-disabled-bg",g("btn-disabled-bg"))};
    color: ${f("btn-disabled-fg",g("btn-disabled-fg"))};
    border-color: ${f("btn-disabled-border",g("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${f("btn-disabled-opacity",g("btn-disabled-opacity"))};
    cursor: not-allowed;`,Qt={primary:G("primary"),secondary:G("secondary"),ghost:G("ghost"),danger:G("danger"),disabled:Ge},E=(n=f("btn-radius",g("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${f("btn-border-width",g("btn-border-width"))} solid transparent;
    border-radius: ${n};
    padding: ${f("btn-padding-y",g("btn-padding-y"))} ${f("btn-padding-x",g("btn-padding-x"))};
    font-family: ${p("font-ui")};
    font-size: ${f("btn-font-size",g("btn-font-size"))};
    line-height: ${f("btn-line-height",g("btn-line-height"))};
    font-weight: ${f("btn-font-weight",g("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${p("dur-fast")} ${p("ease-standard")},
        border-color ${p("dur-fast")} ${p("ease-standard")},
        color ${p("dur-fast")} ${p("ease-standard")},
        box-shadow ${p("dur-fast")} ${p("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${f("btn-focus-ring-width",g("btn-focus-ring-width"))} ${f("btn-focus-ring",g("btn-focus-ring"))};
    }
    ${Qt[e]}
    &:disabled {${Ge}}
`,Jt=`max(${f("field-border-width",g("field-border-width"))}, ${f("field-rule-width",g("field-rule-width"))})`,W=(n,e)=>`
    border-top-color: ${n};
    border-right-color: ${n};
    border-left-color: ${n};
    border-bottom-color: ${e};`,We=()=>`
    border-style: solid;
    border-top-width: ${f("field-border-width",g("field-border-width"))};
    border-right-width: ${f("field-border-width",g("field-border-width"))};
    border-left-width: ${f("field-border-width",g("field-border-width"))};
    border-bottom-width: ${Jt};
    ${W(f("field-border",g("field-border")),f("field-rule",g("field-rule")))}
    border-radius: ${f("field-radius",g("field-radius"))};
    padding: ${f("field-padding-y",g("field-padding-y"))} ${f("field-padding-x",g("field-padding-x"))};
    background: ${f("field-bg",g("field-bg"))};
    color: ${p("text")};
    font-family: ${p("font-ui")};
    font-size: ${f("field-font-size",g("field-font-size"))};
    line-height: ${f("field-line-height",g("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${p("dur-fast")} ${p("ease-standard")},
        box-shadow ${p("dur-fast")} ${p("ease-standard")},
        background ${p("dur-fast")} ${p("ease-standard")};
    &::placeholder { color: ${p("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${W(f("field-focus-border",g("field-focus-border")),f("field-focus-border",g("field-focus-border")))}
        background: ${f("field-bg-focus",g("field-bg-focus"))};
        box-shadow: 0 0 0 ${f("field-focus-ring-width",g("field-focus-ring-width"))} ${f("field-focus-ring",g("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${W(f("field-invalid-border",g("field-invalid-border")),f("field-invalid-rule",g("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${W(f("field-invalid-border",g("field-invalid-border")),f("field-invalid-rule",g("field-invalid-rule")))}
        background: ${f("field-bg-focus",g("field-bg-focus"))};
        box-shadow: 0 0 0 ${f("field-focus-ring-width",g("field-focus-ring-width"))} ${f("field-invalid-ring",g("field-invalid-ring"))};
    }
`,Ke=()=>`
    display: block;
    font-family: ${p("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${p("text-muted")};
`,Zt=()=>`
    display: block;
    font-family: ${p("font-ui")};
    font-size: 13px;
    line-height: 20px;
    color: ${p("danger")};
`,ee=n=>`
    background: ${p("surface")};
    border: 1px solid ${p("border")};
    border-radius: ${p("radius-md")};
    box-shadow: ${p("shadow-1")};
    ${n?.hover?`
    transition:
        box-shadow ${p("dur-base")} ${p("ease-standard")},
        border-color ${p("dur-base")} ${p("ease-standard")};
    &:hover { box-shadow: ${p("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${Ke()}
        margin: 0 0 ${d("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${p("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${p("text")};
    }
    & .ui-card__meta {
        margin: ${d("xs")} 0 0 0;
        font-family: ${p("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${p("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${d("md")};
        font-family: ${p("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${p("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;class te{crumbs=new b([]);set(e){this.crumbs.set(e)}}const v=n=>`var(--${n})`,be=class be extends k{render(){const e=document.createElement("div");e.className="ui-empty-state";const t=o=>typeof o=="function"?o():o,r=(o,l)=>{typeof l=="function"?this.track(w(()=>{o.textContent=t(l)})):o.textContent=l};if(this.props.ornament!==!1){const o=document.createElement("div");o.className="ui-empty-state__ornament",o.setAttribute("aria-hidden","true"),e.appendChild(o)}const i=document.createElement(`h${this.props.headingLevel??3}`);if(i.className="ui-empty-state__heading",r(i,this.props.heading),e.appendChild(i),this.props.body!==void 0){const o=document.createElement("p");o.className="ui-empty-state__body",r(o,this.props.body),e.appendChild(o)}const s=this.props.action;if(s){const o=document.createElement("button");o.className="ui-empty-state__action",o.setAttribute("type","button"),s.ariaLabel&&o.setAttribute("aria-label",s.ariaLabel),r(o,s.label),o.addEventListener("click",()=>s.onclick()),e.appendChild(o)}return e}};be.styles=`
        .ui-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: ${v("space-3")};
            padding: ${v("space-7")} ${v("space-5")};
        }
        /* The brass ornament: a hairline rule, nothing more. No illustration. */
        .ui-empty-state__ornament {
            width: ${v("space-8")};
            height: 1px;
            background: ${v("brass-line")};
            margin-bottom: ${v("space-2")};
        }
        .ui-empty-state__heading {
            margin: 0;
            font-family: ${v("font-display")};
            font-weight: 500;
            font-size: 1.25rem;
            line-height: 1.4;
            color: ${v("text")};
        }
        .ui-empty-state__body {
            margin: 0;
            max-width: 48ch;
            font-family: ${v("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.6;
            color: ${v("text-muted")};
        }
        .ui-empty-state__action {
            margin-top: ${v("space-2")};
            padding: ${v("space-2")} ${v("space-4")};
            border: 1px solid ${v("accent")};
            border-radius: ${v("radius-sm")};
            background: ${v("accent")};
            color: ${v("on-accent")};
            font-family: ${v("font-ui")};
            font-size: 0.875rem;
            font-weight: 600;
            line-height: 1.5;
            cursor: pointer;
            transition: background ${v("dur-fast")} ${v("ease-standard")},
                        border-color ${v("dur-fast")} ${v("ease-standard")};
        }
        .ui-empty-state__action:hover {
            background: ${v("accent-strong")};
            border-color: ${v("accent-strong")};
        }
        .ui-empty-state__action:focus-visible {
            outline: 2px solid ${v("accent")};
            outline-offset: 2px;
        }
    `;let de=be;const en=900,tn=`(min-width: ${en}px)`,Ye=660,nn=`(min-width: ${Ye}px)`,rn=`(max-width: ${Ye-.02}px)`;function sn(n){const e=new b(!1),t=typeof globalThis.matchMedia=="function"?globalThis.matchMedia(n):null;if(!t)return{value:e,dispose:()=>{}};e.set(t.matches);const r=i=>e.set(i.matches);return t.addEventListener("change",r),{value:e,dispose:()=>t.removeEventListener("change",r)}}const xe="__actions";function ue(n,e={}){const t=document.createElement("button");return t.type="button",t.className=e.variant==="primary"?"mtable__btn mtable__btn--primary":"mtable__btn",t.textContent=n,e.onclick&&t.addEventListener("click",e.onclick),t}function an(n){return typeof n=="object"&&n!==null&&typeof n.get=="function"}function ke(n,e,t){if(n.textContent="",e instanceof HTMLElement){n.appendChild(e);return}if(e==null||e===""){const r=document.createElement("span");r.className="mtable__empty-cell",r.textContent=t,n.appendChild(r);return}n.appendChild(document.createTextNode(String(e)))}class me extends k{static styles=`
        .mtable-wrap {
            width: 100%;
            min-width: 0;

            & .mtable {
                width: 100%;
                border-collapse: collapse;
                /* Never the display serif in cells. */
                font-family: ${a("font-ui")};
                font-size: 0.875rem;
                line-height: 1.5;
                color: ${a("text")};

                /* The stacked arm sets display:block, which would otherwise
                   beat the UA's [hidden] rule and leave an empty grid showing
                   underneath the empty state. */
                &[hidden] { display: none; }
            }

            & .mtable__caption {
                /* Deliberately NOT display:block. A block child of a table gets
                   wrapped in an anonymous row group, and a table-header-group
                   always paints above every row group — so a block caption
                   lands UNDER the header row however early it sits in the DOM.
                   table-caption + caption-side keeps it on top. */
                caption-side: top;
                text-align: left;
                font-family: ${a("font-display")};
                font-size: 1.05rem;
                font-weight: 600;
                color: ${a("text")};
                padding: ${a("manage-table-cell-pad-y")} ${a("manage-table-cell-pad-x")} 0;
            }

            & .mtable__caption--hidden {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
            }

            & .mtable__th {
                background: ${a("manage-table-header-bg")};
                color: ${a("manage-table-header-fg")};
                border-bottom: 1px solid ${a("manage-table-header-border")};
                padding: ${a("manage-table-header-pad-y")} ${a("manage-table-header-pad-x")};
                text-align: left;
                /* Overline treatment, same as the framework table's — a Manage
                   header and a framework header should not be two designs. */
                font-family: ${a("font-ui")};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                white-space: nowrap;
            }

            /* Same treatment as .mtable__caption--hidden: off-screen for the
               eye, present for the accessibility tree. */
            & .mtable__th-label--hidden {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
            }

            & .mtable__td {
                padding: ${a("manage-table-cell-pad-y")} ${a("manage-table-cell-pad-x")};
                border-bottom: 1px solid ${a("manage-table-row-border")};
                vertical-align: middle;
                text-align: left;
                transition: background ${a("dur-fast")} ${a("ease-standard")};
            }

            & .mtable__td--numeric {
                font-variant-numeric: tabular-nums;
                white-space: nowrap;
            }

            & .mtable__cell { min-width: 0; }
            & .mtable__empty-cell { color: ${a("text-muted")}; }

            & .mtable__stacked-label { display: none; }

            & .mtable__actions {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: ${d("sm")};
            }

            & .mtable__btn {
                ${E()}
                min-height: ${a("manage-touch-target")};
                padding: 0 ${d("md")};
                font-size: 0.85rem;
                font-weight: 700;
            }

            & .mtable__btn--primary {
                ${E(void 0,"primary")}
                min-height: ${a("manage-touch-target")};
                padding: 0 ${d("md")};
                font-size: 0.85rem;
                font-weight: 700;
            }

            /* Worded, muted or danger — never a spinner glyph and never an
               emoji (docs/design-guidelines.md §4). */
            & .mtable__status {
                margin: ${d("xs")} 0 0;
                font-size: 0.8rem;
                line-height: 1.4;
                color: ${a("text-muted")};

                &[hidden] { display: none; }
                &.mtable__status--error { color: ${a("danger")}; font-weight: 600; }
            }

            & .mtable__empty {
                &[hidden] { display: none; }
            }

            /* ─── Wide: a real grid inside its own scroll box ─── */

            &[data-layout='columns'] {
                background: ${a("manage-table-bg")};
                border: 1px solid ${a("manage-table-border")};
                border-radius: ${a("manage-table-radius")};
                /* The wrapper is the scroll container, so a table too wide for
                   the content column scrolls HERE and the page body never
                   scrolls sideways. It also clips the header fill to the
                   radius, which a border-collapsed table cannot do itself. */
                overflow-x: auto;

                & .mtable__tr:last-child .mtable__td { border-bottom: none; }

                & .mtable__tr:not(.mtable__tr--editing):hover > .mtable__td {
                    background: ${a("manage-table-row-hover-bg")};
                }

                & .mtable__tr--editing > .mtable__td {
                    background: ${a("manage-table-row-editing-bg")};
                }

                & .mtable__td--actions {
                    width: 1%;
                    white-space: nowrap;

                    /* width:1% resolves to min-content, and a wrapping flex row
                       reads that as "one button per line". Side by side is the
                       point of a row's action bar; the stacked arm, which has
                       the full card width, keeps the wrap. */
                    & .mtable__actions { flex-wrap: nowrap; justify-content: flex-end; }

                    /* The cell's nowrap is meant for the BUTTON row. A server
                       message is a sentence: it must wrap, and it must be
                       allowed to be narrower than itself — otherwise one long
                       error sets this column's width, squeezes the data columns
                       and puts the whole table into horizontal scroll. */
                    & .mtable__status {
                        white-space: normal;
                        max-width: 32ch;
                        margin-left: auto;
                        text-align: right;
                    }
                }
            }

            /* ─── Narrow: one card per row ─── */

            &[data-layout='stacked'] {
                & .mtable,
                & .mtable__body,
                & .mtable__tr,
                & .mtable__td {
                    display: block;
                    width: 100%;
                }

                /* No thead to lose to here — the head is off-screen — so the
                   caption can be an ordinary block at the top of the stack. */
                & .mtable__caption:not(.mtable__caption--hidden) {
                    display: block;
                    padding: 0 0 ${d("sm")};
                }

                /* The head stays in the DOM — role="rowgroup" and the column
                   headers with it — but off-screen: every cell now carries its
                   own visible label, and a card of bare headings on top of the
                   list means nothing. */
                & .mtable__head {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip-path: inset(50%);
                    white-space: nowrap;
                }

                & .mtable__body {
                    display: flex;
                    flex-direction: column;
                    gap: ${a("manage-table-card-gap")};
                }

                & .mtable__tr {
                    background: ${a("manage-table-bg")};
                    border: 1px solid ${a("manage-table-border")};
                    border-radius: ${a("manage-table-radius")};
                    padding: ${a("manage-table-cell-pad-y")} ${a("manage-table-cell-pad-x")};
                }

                & .mtable__tr--editing {
                    background: ${a("manage-table-row-editing-bg")};
                }

                & .mtable__td {
                    padding: ${d("xs")} 0;
                    border-bottom: none;
                    white-space: normal;
                }

                & .mtable__stacked-label {
                    display: block;
                    font-family: ${a("font-ui")};
                    font-size: 0.6875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                    color: ${a("manage-table-header-fg")};
                    margin-bottom: 2px;
                }

                & .mtable__td--actions {
                    padding-top: ${a("manage-table-cell-pad-y")};

                    /* Direct children of the action bar, which is why the
                       actions prop takes buttons (or an array of them) and not
                       a wrapper element: a wrapper would be the flex item, and
                       the buttons inside it would keep their content width. */
                    & > .mtable__actions > .mtable__btn { flex: 1 1 auto; }
                }

                & .mtable__empty {
                    background: ${a("manage-table-bg")};
                    border: 1px solid ${a("manage-table-border")};
                    border-radius: ${a("manage-table-radius")};
                }
            }
        }
    `;static seq=0;uid=`mtable-${me.seq++}`;rowData=new Map;render(){const e=document.createElement("div");e.className="mtable-wrap";const t=document.createElement("table");t.className="mtable",t.setAttribute("role","table");const r=document.createElement("caption");r.className=this.props.captionHidden?"mtable__caption mtable__caption--hidden":"mtable__caption",r.id=`${this.uid}-caption`,r.textContent=this.props.caption,t.appendChild(r),t.setAttribute("aria-labelledby",r.id),t.appendChild(this.head());const i=document.createElement("tbody");if(i.className="mtable__body",i.setAttribute("role","rowgroup"),t.appendChild(i),e.appendChild(t),this.$each(i,()=>this.readRows(),(s,o,l)=>this.renderRow(s,l),s=>this.props.rowKey(s)),this.props.empty){const s=document.createElement("div");s.className="mtable__empty",this.spawn(de,s,this.props.empty),e.appendChild(s),this.track(w(()=>{const o=this.rowsValue().length===0;s.hidden=!o,t.hidden=o}))}return this.layout(e),e}layout(e){let t=this.props.narrow;if(!t){const i=sn(rn);this.track(i.dispose),t=i.value}const r=this.props.stacked!==!1;this.track(w(()=>{e.setAttribute("data-layout",r&&t.get()?"stacked":"columns")}))}head(){const e=document.createElement("thead");e.className="mtable__head",e.setAttribute("role","rowgroup");const t=document.createElement("tr");t.className="mtable__tr",t.setAttribute("role","row");for(const r of this.props.columns)t.appendChild(this.th(r.key,r.header));return this.hasActionsColumn()&&t.appendChild(this.th(xe,this.props.actionsHeader??"Actions",!0)),e.appendChild(t),e}th(e,t,r=!1){const i=document.createElement("th");if(i.className="mtable__th",i.setAttribute("role","columnheader"),i.setAttribute("scope","col"),i.setAttribute("data-key",e),r){const s=document.createElement("span");s.className="mtable__th-label--hidden",s.textContent=t,i.appendChild(s)}else i.textContent=t;return i}hasActionsColumn(){return this.props.actions!==void 0||this.props.edit!==void 0}rowsValue(){return an(this.props.rows)?this.props.rows.get():this.props.rows}readRows(){const e=this.rowsValue();return C(()=>{const t=new Set;for(const r of e){const i=this.props.rowKey(r);t.add(i);const s=this.rowData.get(i);s?s.set(r):this.rowData.set(i,new b(r))}for(const r of[...this.rowData.keys()])t.has(r)||this.rowData.delete(r)}),e}signalFor(e){const t=this.props.rowKey(e);let r=this.rowData.get(t);return r||(r=new b(e),this.rowData.set(t,r)),r}renderRow(e,t){const r=this.props.rowKey(e),i={key:r},s=this.signalFor(e),o=this.props.edit,l=this.props.emptyCell??"—",h=()=>o?o.controller.key.get()===r:!1,c=document.createElement("tr");c.className="mtable__tr",c.setAttribute("role","row"),c.setAttribute("data-row-key",r);for(const u of this.props.columns){const m=document.createElement("td");if(m.className=`mtable__td mtable__td--${u.type??"text"}`,m.setAttribute("role","cell"),m.setAttribute("data-key",u.key),u.stackedLabel!==!1){const x=document.createElement("span");x.className="mtable__stacked-label",x.setAttribute("aria-hidden","true"),x.textContent=u.header,m.appendChild(x)}const $=document.createElement("div");$.className="mtable__cell",m.appendChild($),t(w(()=>{if(h()&&u.editCell){const x=s.peek();ke($,C(()=>u.editCell(x,i)),l)}else{const x=s.get();ke($,C(()=>u.cell(x,i)),l)}})),c.appendChild(m)}return this.hasActionsColumn()&&c.appendChild(this.actionsCell(i,s,h,t)),o&&(t(w(()=>{c.classList.toggle("mtable__tr--editing",h())})),t(w(()=>{o.controller.isSaving(r)?c.setAttribute("aria-busy","true"):c.removeAttribute("aria-busy")})),this.editKeys(c,r,s,t),o.autoFocus!==!1&&this.autoFocus(c,h,t)),c}actionsCell(e,t,r,i){const s=this.props.edit,o=document.createElement("td");o.className="mtable__td mtable__td--actions",o.setAttribute("role","cell"),o.setAttribute("data-key",xe);const l=document.createElement("div");l.className="mtable__actions",o.appendChild(l);let h=null,c=null;if(s){h=ue(s.saveLabel??"Save",{variant:"primary",onclick:()=>s.oncommit(t.peek())}),c=ue(s.cancelLabel??"Cancel",{onclick:()=>{s.controller.cancel(),s.oncancel?.(t.peek())}}),i(w(()=>{const m=s.controller.isSaving(e.key);h.disabled=m,c.disabled=m}));const u=document.createElement("p");u.className="mtable__status",u.setAttribute("role","status"),u.setAttribute("aria-live","polite"),o.appendChild(u),i(w(()=>{const m=s.controller.errorFor(e.key),$=s.controller.isSaving(e.key);u.textContent=m??($?s.savingLabel??"Saving…":""),u.className=m?"mtable__status mtable__status--error":"mtable__status",u.hidden=!m&&!$}))}return i(w(()=>{if(r()&&s){l.textContent="",l.append(h,c);return}const u=t.get(),m=C(()=>this.props.actions?.(u,e));l.textContent="",Array.isArray(m)?l.append(...m):m instanceof HTMLElement?l.appendChild(m):m!=null&&m!==""&&l.appendChild(document.createTextNode(String(m)))})),o}editKeys(e,t,r,i){const s=this.props.edit,o=l=>{if(s.controller.key.peek()===t){if(l.key==="Enter"){if(l.target?.tagName==="TEXTAREA"||(l.preventDefault(),s.controller.phase.peek()==="saving"))return;s.oncommit(r.peek());return}l.key==="Escape"&&(l.preventDefault(),l.stopPropagation(),s.controller.cancel(),s.oncancel?.(r.peek()))}};e.addEventListener("keydown",o),i(()=>e.removeEventListener("keydown",o))}autoFocus(e,t,r){let i=!1,s=!0;r(()=>{s=!1}),r(w(()=>{const o=t();o&&!i&&queueMicrotask(()=>{if(!s||!t())return;const l=e.querySelector('input:not([type="hidden"]), select, textarea');l&&(l.focus(),l instanceof HTMLInputElement&&typeof l.select=="function"&&l.select())}),i=o}))}}function Ve(n){return{open:n.open,title:n.title,message:n.consequence,confirmLabel:n.confirmLabel,cancelLabel:n.cancelLabel??"Cancel",danger:!0,onconfirm:n.onconfirm,oncancel:n.oncancel}}function Xe(n,e){const t=r=>{r.key!=="Escape"||!n.get()||(n.set(!1),e?.())};return document.addEventListener("keydown",t),()=>document.removeEventListener("keydown",t)}const on=()=>`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${a("manage-stack-gap")} ${d("lg")};
    align-items: start;

    & .mform__field--full {
        grid-column: 1 / -1;
    }

    @media ${nn} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
`,Qe=()=>`
    display: flex;
    flex-direction: column;
    gap: ${d("xs")};
    min-width: 0;
`,Je=()=>`
    ${Ke()}
`,Ze=()=>`
    ${We()}
    width: 100%;
    min-height: ${a("manage-touch-target")};
`,ln=()=>`
    color: ${a("text-muted")};
    font-size: 0.8rem;
    line-height: 1.4;
`,cn=()=>`
    ${Zt()}
`,dn="You no longer have permission to change the course catalog. Ask an administrator to grant you the course_admin role.";function Ee(n,e){if(!(n instanceof T))return Q(un(n),hn(n),oe(n)),e;if(n.status===401)return he(),"Your session expired. Sign in again to continue.";if(n.status===403)return dn;if(n.status>=400&&n.status<500){if(!n.details?.length)return n.message;const t=n.details.map(r=>`${r.path.replace(/^\//,"")} — ${r.message}`).join("; ");return`${n.message}: ${t}`}return Q("server",`${n.status} ${n.message}`,oe(n)),e}function un(n){return n instanceof Error?n.message==="Request timeout"?"timeout":"network":"unknown"}function hn(n){return n instanceof Error?n.message:String(n)}function et(){return{name:"",location:"",logoUrl:""}}function mn(n){return{name:n.name,location:n.location??"",logoUrl:n.logoUrl??""}}function tt(n){const e={};n.name.trim()===""&&(e.name="A club needs a name. Enter one before saving.");const t=n.logoUrl.trim();return t!==""&&!fn(t)&&(e.logoUrl="Enter a full web address starting with https://, or leave this empty."),e}function nt(n){return Object.keys(n).length>0}function Ce(n){return{name:n.name.trim(),location:n.location.trim()||null,logoUrl:n.logoUrl.trim()||null}}function rt(n,e){const t=e===0?"It has no courses.":e===1?"It has 1 course.":`It has ${e} courses.`;return`${n} leaves the catalog. ${t} Rounds already played keep their own copy of the course data, so no scorecard changes.`}const st="The club is removed from the catalog.";function fn(n){try{const e=new URL(n);return e.protocol==="http:"||e.protocol==="https:"}catch{return!1}}function gn(n,e){const t=e.trim().toLowerCase().split(/\s+/).filter(r=>r!=="");return t.length===0?n:n.filter(r=>{const i=`${r.name} ${r.location??""}`.toLowerCase();return t.every(s=>i.includes(s))})}class at{clubs=new b([]);loading=new b(!1);error=new b(null);loaded=new b(!1);query=new b("");visible=new U(()=>gn(this.clubs.get(),this.query.get()));inflight=null;load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{const[t,r]=await Promise.all([A.clubs.list(),A.courses.list()]),i=new Map;for(const s of r)i.set(s.clubId,(i.get(s.clubId)??0)+1);this.clubs.set(t.map(s=>({...s,courseCount:i.get(s.id)??0})))}catch(t){this.error.set(Ee(t,"Could not load the clubs. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.clubs.get().find(t=>t.id===e)??null}async create(e){return this.write(()=>A.clubs.create(Ce(e)),"Could not create the club. Check your connection and try again.")}async update(e,t){return this.write(()=>A.clubs.update({id:e,...Ce(t)}),"Could not save the club. Check your connection and try again.")}async remove(e){return this.write(()=>A.clubs.remove({id:e}),"Could not delete the club. Check your connection and try again.")}async write(e,t){try{await e()}catch(r){return{ok:!1,message:Ee(r,t)}}return await this.load(!0),{ok:!0}}}const pn=S(`
    <div class="mclubfields">
        <div class="mclubfields__field">
            <label bind="nameLabel" class="mclubfields__label">Name</label>
            <!-- aria-required, NOT the required attribute: a natively required
                 field blocks the submit event entirely and replaces our worded
                 message with a browser bubble we cannot word or place. -->
            <input bind="name" class="mclubfields__control" type="text" autocomplete="off" aria-required="true">
            <p bind="nameError" class="mclubfields__error" role="alert"></p>
        </div>

        <div class="mclubfields__field">
            <label bind="locationLabel" class="mclubfields__label">Location</label>
            <input bind="location" class="mclubfields__control" type="text" autocomplete="off">
            <p bind="locationHint" class="mclubfields__hint">Town or area. Optional — it only helps people find the club in a list.</p>
        </div>

        <!-- mform__field--full is the class formGrid() publishes for a field
             that must span the row; a URL is exactly that case. -->
        <div class="mclubfields__field mform__field--full">
            <label bind="logoLabel" class="mclubfields__label">Logo URL</label>
            <!-- A text input with a url inputmode. type="url" would fail the
                 form's native validity check and swallow the submit, the same
                 way required does above; the keyboard hint is worth keeping. -->
            <input bind="logoUrl" class="mclubfields__control" type="text" autocomplete="off" inputmode="url">
            <p bind="logoHint" class="mclubfields__hint">A full web address to the club's logo image. Optional.</p>
            <p bind="logoError" class="mclubfields__error" role="alert"></p>
        </div>
    </div>
`);class it extends k{static styles=`
        .mclubfields {
            ${on()}

            & .mclubfields__field {
                ${Qe()}
            }

            & .mclubfields__label {
                ${Je()}
            }

            & .mclubfields__control {
                ${Ze()}
            }

            & .mclubfields__hint {
                ${ln()}
                margin: 0;
            }

            & .mclubfields__error {
                ${cn()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;draft=new b(et());inputs={};render(){const e={name:`${this.props.idPrefix}-name`,location:`${this.props.idPrefix}-location`,logoUrl:`${this.props.idPrefix}-logo`},t={name:`${e.name}-error`,logoUrl:`${e.logoUrl}-error`},r={location:`${e.location}-hint`,logoUrl:`${e.logoUrl}-hint`},i=()=>this.props.busy?.get()??!1,s=this.wire(pn,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:i,oninput:o=>this.patch("name",o)},nameError:{id:t.name,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},locationLabel:{htmlFor:e.location},location:{id:e.location,"aria-describedby":r.location,disabled:i,oninput:o=>this.patch("location",o)},locationHint:{id:r.location},logoLabel:{htmlFor:e.logoUrl},logoUrl:{id:e.logoUrl,"aria-invalid":()=>String(this.props.errors.get().logoUrl!==void 0),disabled:i,oninput:o=>this.patch("logoUrl",o)},logoHint:{id:r.logoUrl},logoError:{id:t.logoUrl,textContent:()=>this.props.errors.get().logoUrl??"",hidden:()=>this.props.errors.get().logoUrl===void 0}});return this.inputs={name:this.ref(s,"name"),location:this.ref(s,"location"),logoUrl:this.ref(s,"logoUrl")},this.track(w(()=>{Se(this.inputs.name,this.props.errors.get().name?[t.name]:[])})),this.track(w(()=>{const o=[r.logoUrl];this.props.errors.get().logoUrl&&o.push(t.logoUrl),Se(this.inputs.logoUrl,o)})),s}seed(e){this.draft.set({...e});for(const t of["name","location","logoUrl"]){const r=this.inputs[t];r&&(r.value=e[t])}}focusFirst(){this.inputs.name?.focus()}focusInvalid(e){for(const t of["name","logoUrl"]){if(e[t]===void 0)continue;const r=this.inputs[t];return r?(r.focus(),!0):!1}return!1}patch(e,t){const r=t.target.value;this.draft.update(i=>({...i,[e]:r}))}}function Se(n,e){e.length===0?n.removeAttribute("aria-describedby"):n.setAttribute("aria-describedby",e.join(" "))}const O="/courses",fe="/courses/clubs",bn=`${fe}/:id`;function Te(n){return`${fe}/${n}`}const yn=S(`
    <section class="mclubs">
        <header class="mclubs__head">
            <div class="mclubs__heading">
                <h1 class="mclubs__title">Clubs</h1>
                <p class="mclubs__lead">Every club in the catalog. A club holds the courses that rounds are played on.</p>
            </div>
            <button bind="new" class="mclubs__new" type="button">New club</button>
        </header>

        <div class="mclubs__search">
            <label bind="searchLabel" class="mclubs__search-label">Search</label>
            <input bind="search" class="mclubs__search-input" type="search" autocomplete="off" placeholder="Name or location">
            <!-- role=status: filtering changes the list without moving focus,
                 so the count is announced politely rather than only seen. -->
            <p bind="searchNote" class="mclubs__note" role="status" aria-live="polite"></p>
        </div>

        <form bind="createPanel" class="mclubs__panel">
            <h2 class="mclubs__panel-title">New club</h2>
            <div bind="createFields"></div>
            <p bind="createError" class="mclubs__error" role="alert"></p>
            <div class="mclubs__panel-actions">
                <button bind="createSubmit" class="mclubs__submit" type="submit">Create club</button>
                <button bind="createCancel" class="mclubs__secondary" type="button">Cancel</button>
            </div>
        </form>

        <p bind="loadError" class="mclubs__error" role="alert"></p>
        <button bind="retry" class="mclubs__secondary" type="button">Try again</button>
        <p bind="deleteError" class="mclubs__error" role="alert"></p>
        <p bind="loadingNote" class="mclubs__note" role="status" aria-live="polite"></p>

        <div bind="tableHost"></div>
        <div bind="confirmHost"></div>
    </section>
`);class _n extends k{static styles=`
        .mclubs {
            display: flex;
            flex-direction: column;
            gap: ${a("manage-stack-gap")};

            & .mclubs__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${d("md")};
            }

            & .mclubs__heading {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                min-width: 0;
            }

            & .mclubs__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${a("text")};
            }

            & .mclubs__lead {
                margin: 0;
                max-width: 60ch;
                color: ${a("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            /* The page's forward action — solid fill is earned here, and only
               here on this screen (docs/design-guidelines.md §2). */
            & .mclubs__new {
                ${E(void 0,"primary")}
                min-height: ${a("manage-touch-target")};
                padding: 0 ${d("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mclubs__search {
                ${Qe()}
                max-width: 28rem;
            }

            & .mclubs__search-label {
                ${Je()}
            }

            & .mclubs__search-input {
                ${Ze()}
            }

            & .mclubs__note {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.8rem;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclubs__error {
                margin: 0;
                color: ${a("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclubs__panel {
                ${ee({})}
                display: flex;
                flex-direction: column;
                gap: ${a("manage-stack-gap")};
                padding: ${a("manage-page-pad")};

                &[hidden] { display: none; }
            }

            & .mclubs__panel-title {
                margin: 0;
                font-family: ${a("font-display")};
                font-size: 1.15rem;
                font-weight: 600;
                color: ${a("text")};
            }

            & .mclubs__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${d("sm")};
            }

            & .mclubs__submit {
                ${E(void 0,"primary")}
                min-height: ${a("manage-touch-target")};
                padding: 0 ${d("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mclubs__secondary {
                ${E()}
                min-height: ${a("manage-touch-target")};
                padding: 0 ${d("lg")};
                font-size: 0.9rem;
                font-weight: 700;

                &[hidden] { display: none; }
            }

            & .mclubs__link {
                color: ${a("text")};
                font-weight: 700;
                text-decoration: none;

                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent-strong")}; outline-offset: 2px; }
            }
        }
    `;router=this.inject(z);crumbs=this.inject(te);clubs=this.inject(at);createOpen=new b(!1);createBusy=new b(!1);createErrors=new b({});createFailure=new b(null);deleteOpen=new b(!1);deleteTarget=new b(null);deleteFailure=new b(null);deletingId=new b(null);fields=null;searchInput=null;actionEffects=new Map;columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>this.nameLink(e)},{key:"location",header:"Location",cell:e=>e.location},{key:"courses",header:"Courses",type:"numeric",cell:e=>e.courseCount}];render(){const e=this.wire(yn,{new:{onclick:()=>this.openCreate()},searchLabel:{htmlFor:"manage-clubs-search"},search:{id:"manage-clubs-search",oninput:t=>this.clubs.query.set(t.target.value)},searchNote:{textContent:()=>this.searchNote(),hidden:()=>this.searchNote()===""},createPanel:{hidden:()=>!this.createOpen.get(),onsubmit:t=>{t.preventDefault(),this.create()}},createError:{textContent:()=>this.createFailure.get()??"",hidden:()=>this.createFailure.get()===null},createSubmit:{textContent:()=>this.createBusy.get()?"Creating…":"Create club",disabled:()=>this.createBusy.get()},createCancel:{disabled:()=>this.createBusy.get(),onclick:()=>this.closeCreate()},loadError:{textContent:()=>this.clubs.error.get()??"",hidden:()=>this.clubs.error.get()===null},retry:{hidden:()=>this.clubs.error.get()===null,onclick:()=>{this.clubs.load(!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading clubs…",hidden:()=>this.clubs.loaded.get()}});return this.searchInput=this.ref(e,"search"),this.fields=this.spawn(it,this.ref(e,"createFields"),{idPrefix:"manage-club-new",errors:this.createErrors,busy:this.createBusy}),this.spawn(me,this.ref(e,"tableHost"),{columns:this.columns,rows:this.clubs.visible,rowKey:t=>t.id,caption:"Clubs",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Club actions",empty:{heading:()=>this.filtering()?"No clubs match that search":"No clubs yet",body:()=>this.filtering()?"Try a shorter search, or clear it to see every club.":"A club is the top of the catalog: create one, then add its courses.",action:{label:()=>this.filtering()?"Clear search":"New club",onclick:()=>this.filtering()?this.clearSearch():this.openCreate()}}}),this.spawn(J,this.ref(e,"confirmHost"),Ve({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this club?"},consequence:()=>this.deleteConsequence(),confirmLabel:"Delete club",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(Xe(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.crumbs.set([{label:"Clubs"}]),this.clubs.load();const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.createOpen.get()||this.closeCreate())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}nameLink(e){const t=document.createElement("a");return t.className="mclubs__link",t.href=M+Te(e.id),t.textContent=e.name,t.addEventListener("click",r=>{r.metaKey||r.ctrlKey||r.shiftKey||r.button!==0||(r.preventDefault(),this.router.navigate(Te(e.id)))}),t}rowActions(e){const t=ue("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,w(()=>{const r=this.deletingId.get();t.textContent=r===e.id?"Deleting…":"Delete",t.disabled=r!==null})),[t]}filtering(){return this.clubs.query.get().trim()!==""}clearSearch(){this.clubs.query.set(""),this.searchInput&&(this.searchInput.value="",this.searchInput.focus())}searchNote(){if(!this.filtering())return"";const e=this.clubs.visible.get().length,t=this.clubs.clubs.get().length;return`Showing ${e} of ${t} clubs.`}openCreate(){this.resetCreate(),this.createOpen.set(!0),this.fields?.focusFirst()}closeCreate(){this.createOpen.set(!1),this.resetCreate()}resetCreate(){this.createErrors.set({}),this.createFailure.set(null),this.fields?.seed(et())}async create(){if(this.createBusy.get()||!this.fields)return;const e=this.fields.draft.get(),t=tt(e);if(this.createErrors.set(t),nt(t)){this.createFailure.set(null),this.fields.focusInvalid(t);return}this.createBusy.set(!0),this.createFailure.set(null);const r=await this.clubs.create(e);if(this.createBusy.set(!1),!r.ok){this.createFailure.set(r.message);return}this.closeCreate()}deleteConsequence(){const e=this.deleteTarget.get();return e?rt(e.name,e.courseCount):st}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.clubs.remove(e.id);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}const wn="Could not save. Check your connection and try again.";class vn{key=new b(null);phase=new b("idle");error=new b(null);begin(e){this.phase.get()!=="saving"&&(this.key.set(e),this.phase.set("editing"),this.error.set(null))}cancel(){this.phase.get()!=="saving"&&(this.key.set(null),this.phase.set("idle"),this.error.set(null))}async commit(e){if(this.key.get()===null||this.phase.get()==="saving")return!1;this.phase.set("saving"),this.error.set(null);let t;try{t=await e()}catch{t={ok:!1,message:wn}}return t.ok?(this.key.set(null),this.phase.set("idle"),this.error.set(null),!0):(this.phase.set("failed"),this.error.set(t.message),!1)}fail(e){this.key.get()!==null&&(this.phase.set("failed"),this.error.set(e))}isEditing(e){return this.key.get()===e}isSaving(e){return this.key.get()===e&&this.phase.get()==="saving"}errorFor(e){return this.key.get()===e&&this.phase.get()==="failed"?this.error.get():null}}const $n=S(`
    <section class="mclub">
        <!-- role=status: a polite live region, so "Loading club…" and its
             disappearance are announced instead of only being visible. -->
        <p bind="loadingNote" class="mclub__note" role="status" aria-live="polite"></p>

        <p bind="loadError" class="mclub__error" role="alert"></p>
        <button bind="retry" class="mclub__secondary" type="button">Try again</button>

        <div bind="missing" class="mclub__missing">
            <h1 class="mclub__title">Club not found</h1>
            <p class="mclub__lead">This club is not in the catalog. It may have been deleted since the link was made.</p>
            <button bind="backMissing" class="mclub__secondary" type="button">Back to clubs</button>
        </div>

        <div bind="body" class="mclub__body">
            <header class="mclub__head">
                <div class="mclub__heading">
                    <h1 bind="title" class="mclub__title"></h1>
                    <p bind="subtitle" class="mclub__lead"></p>
                </div>
                <button bind="remove" class="mclub__danger" type="button">Delete club</button>
            </header>

            <p bind="deleteError" class="mclub__error" role="alert"></p>

            <section class="mclub__panel">
                <div class="mclub__panel-head">
                    <h2 class="mclub__panel-title">Club details</h2>
                    <button bind="edit" class="mclub__secondary" type="button">Edit</button>
                </div>

                <dl bind="facts" class="mclub__facts">
                    <div class="mclub__fact">
                        <dt class="mclub__fact-key">Name</dt>
                        <dd bind="factName" class="mclub__fact-value"></dd>
                    </div>
                    <div class="mclub__fact">
                        <dt class="mclub__fact-key">Location</dt>
                        <dd bind="factLocation" class="mclub__fact-value"></dd>
                    </div>
                    <div class="mclub__fact">
                        <dt class="mclub__fact-key">Logo URL</dt>
                        <dd bind="factLogo" class="mclub__fact-value"></dd>
                    </div>
                </dl>

                <form bind="form" class="mclub__form">
                    <div bind="fieldsHost"></div>
                    <p bind="saveError" class="mclub__error" role="alert"></p>
                    <div class="mclub__panel-actions">
                        <button bind="save" class="mclub__primary" type="submit">Save</button>
                        <button bind="cancel" class="mclub__secondary" type="button">Cancel</button>
                    </div>
                </form>
            </section>

            <!--
                T5 MOUNT POINT — the club's course list (spec §3.3 + §3.3a) goes
                here: readiness badge from GET /courses/validate, create, edit
                name/hole-count/coordinates, delete with confirm. Spawn the
                course-list component into this host with the club id as a prop;
                the breadcrumb published below is already the trail it extends.
            -->
            <div bind="coursesHost" class="mclub__courses"></div>
        </div>

        <div bind="confirmHost"></div>
    </section>
`);class xn extends k{static styles=`
        .mclub {
            display: flex;
            flex-direction: column;
            gap: ${a("manage-stack-gap")};

            & .mclub__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${d("md")};
            }

            & .mclub__heading {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                min-width: 0;
            }

            & .mclub__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${a("text")};
            }

            & .mclub__lead {
                margin: 0;
                max-width: 60ch;
                color: ${a("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mclub__note {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.8rem;

                &[hidden] { display: none; }
            }

            & .mclub__error {
                margin: 0;
                color: ${a("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclub__missing,
            & .mclub__body {
                display: flex;
                flex-direction: column;
                gap: ${a("manage-stack-gap")};

                &[hidden] { display: none; }
            }

            & .mclub__panel {
                ${ee({})}
                display: flex;
                flex-direction: column;
                gap: ${a("manage-stack-gap")};
                padding: ${a("manage-page-pad")};
            }

            & .mclub__panel-head {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${d("sm")};
            }

            & .mclub__panel-title {
                margin: 0;
                font-family: ${a("font-display")};
                font-size: 1.15rem;
                font-weight: 600;
                color: ${a("text")};
            }

            & .mclub__facts {
                display: flex;
                flex-direction: column;
                gap: ${a("manage-stack-gap")};
                margin: 0;

                &[hidden] { display: none; }
            }

            & .mclub__fact {
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-width: 0;
            }

            & .mclub__fact-key {
                font-family: ${a("font-ui")};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${a("text-muted")};
            }

            & .mclub__fact-value {
                margin: 0;
                color: ${a("text")};
                font-size: 0.95rem;
                line-height: 1.5;
                overflow-wrap: anywhere;
            }

            & .mclub__form {
                display: flex;
                flex-direction: column;
                gap: ${a("manage-stack-gap")};

                &[hidden] { display: none; }
            }

            & .mclub__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${d("sm")};
            }

            & .mclub__primary {
                ${E(void 0,"primary")}
                min-height: ${a("manage-touch-target")};
                padding: 0 ${d("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mclub__secondary {
                ${E()}
                min-height: ${a("manage-touch-target")};
                padding: 0 ${d("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }

            /*
             * Destructive, and it says so in the button as well as in the
             * dialog it opens — terracotta is the danger family, never the
             * brass accent (AGENTS.md, "Theme and CSS").
             *
             * The outline-at-rest treatment is the THEME's, not this file's:
             * manage/theme.ts sets the --btn-danger-* family, so the recipe
             * tier below already renders it and no screen hand-rolls a skin
             * over btn(). Sizing only here, and after the recipe (ADR-005).
             */
            & .mclub__danger {
                ${E(void 0,"danger")}
                min-height: ${a("manage-touch-target")};
                padding: 0 ${d("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mclub__courses:empty { display: none; }
        }
    `;router=this.inject(z);crumbs=this.inject(te);clubs=this.inject(at);params=this.router.params(bn);editor=new vn;errors=new b({});deleteOpen=new b(!1);deleteFailure=new b(null);deleting=new b(!1);fields=null;render(){const e=this.wire($n,{loadingNote:{textContent:"Loading club…",hidden:()=>this.clubs.loaded.get()},loadError:{textContent:()=>this.clubs.error.get()??"",hidden:()=>this.clubs.error.get()===null},retry:{hidden:()=>this.clubs.error.get()===null,onclick:()=>{this.clubs.load(!0)}},missing:{hidden:()=>!this.clubs.loaded.get()||this.clubs.error.get()!==null||this.club()!==null},backMissing:{onclick:()=>this.router.navigate(O)},body:{hidden:()=>this.club()===null},title:()=>this.club()?.name??"",subtitle:()=>this.courseSummary(),remove:{textContent:()=>this.deleting.get()?"Deleting…":"Delete club",disabled:()=>this.editing()||this.deleting.get(),onclick:()=>{this.deleteFailure.set(null),this.deleteOpen.set(!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},edit:{hidden:()=>this.editing(),disabled:()=>this.deleting.get(),onclick:()=>this.beginEdit()},facts:{hidden:()=>this.editing()},factName:()=>this.club()?.name??"",factLocation:()=>this.club()?.location??"Not recorded",factLogo:()=>this.club()?.logoUrl??"Not recorded",form:{hidden:()=>!this.editing(),onsubmit:t=>{t.preventDefault(),this.save()}},saveError:{textContent:()=>this.editor.errorFor(this.clubId())??"",hidden:()=>this.editor.errorFor(this.clubId())===null},save:{textContent:()=>this.saving()?"Saving…":"Save",disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.cancelEdit()}});return this.fields=this.spawn(it,this.ref(e,"fieldsHost"),{idPrefix:"manage-club-edit",errors:this.errors,busy:{get:()=>this.saving()}}),this.spawn(J,this.ref(e,"confirmHost"),Ve({open:this.deleteOpen,title:()=>{const t=this.club();return t?`Delete ${t.name}?`:"Delete this club?"},consequence:()=>this.deleteConsequence(),confirmLabel:"Delete club",onconfirm:()=>{this.remove()}})),this.track(Xe(this.deleteOpen)),e}onMount(){this.clubs.load(),this.track(w(()=>{const e=this.club();this.crumbs.set([{label:"Clubs",path:O},{label:e?.name??"Club"}])})),this.clubId()===""&&this.router.navigate(O,!0)}clubId(){return this.params.get().id}club(){const e=this.clubId();return e===""?null:this.clubs.byId(e)}editing(){return this.editor.isEditing(this.clubId())}saving(){return this.editor.isSaving(this.clubId())}courseSummary(){const e=this.club();return e?e.courseCount===0?"No courses yet.":e.courseCount===1?"1 course.":`${e.courseCount} courses.`:""}beginEdit(){const e=this.club();e&&(this.errors.set({}),this.editor.begin(e.id),this.fields?.seed(mn(e)),this.fields?.focusFirst())}cancelEdit(){this.editor.cancel(),this.errors.set({})}save(){const e=this.club();if(!e||!this.fields||this.saving())return;const t=this.fields.draft.get(),r=tt(t);if(this.errors.set(r),nt(r)){this.fields.focusInvalid(r);return}this.editor.commit(()=>this.clubs.update(e.id,t))}deleteConsequence(){const e=this.club();return e?rt(e.name,e.courseCount):st}async remove(){const e=this.club();if(!(!e||this.deleting.get())){this.deleteFailure.set(null),this.deleting.set(!0);try{const t=await this.clubs.remove(e.id);if(!t.ok){this.deleteFailure.set(t.message);return}this.router.navigate(O,!0)}finally{this.deleting.set(!1)}}}}const kn=[{id:"courses",label:"Courses",path:O,routes:{[O]:_n,[fe]:xn},unlocked:n=>n.canManageCourses()}];function q(n){return kn.filter(e=>e.unlocked(n))}function En(n){const e={};for(const t of q(n))Object.assign(e,t.routes);return e}const Cn=S(`
    <nav class="mnav" aria-label="Sections">
        <ul bind="list" class="mnav__list"></ul>
    </nav>
`),Sn=S(`
    <li class="mnav__item">
        <a bind="link" class="mnav__link"><span bind="label"></span></a>
    </li>
`);class Le extends k{static styles=`
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
                min-height: ${a("manage-touch-target")};
                padding: 0 ${d("md")};
                border-radius: ${a("radius-sm")};
                color: ${a("manage-chrome-fg-muted")};
                font-size: 0.95rem;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;

                &:hover {
                    background: ${a("manage-chrome-hover-bg")};
                    color: ${a("manage-chrome-fg")};
                }

                &:focus-visible {
                    outline: 2px solid ${a("manage-chrome-fg")};
                    outline-offset: -2px;
                }

                /* Elevation, not saturation — design-guidelines §2. */
                &.mnav__link--active {
                    background: ${a("manage-chrome-active-bg")};
                    color: ${a("manage-chrome-fg")};
                    font-weight: 700;
                }
            }
        }
    `;router=this.inject(z);roles=this.inject(D);render(){const e=this.wire(Cn,{});return this.$each(this.ref(e,"list"),()=>q(this.roles),(t,r,i)=>this.wireEl(Sn,{link:{href:M+t.path,className:()=>{const s=this.router.route.get();return s===t.path||s.startsWith(t.path+"/")?"mnav__link mnav__link--active":"mnav__link"},"aria-current":()=>{const s=this.router.route.get();return s===t.path||s.startsWith(t.path+"/")?"page":"false"},onclick:s=>{const o=s;o.metaKey||o.ctrlKey||o.shiftKey||o.button!==0||(s.preventDefault(),this.router.navigate(t.path),this.props.onNavigate?.())}},label:()=>t.label},i),t=>t.id),e}}const Tn=S(`
    <section class="mnf">
        <h1 class="mnf__title">Nothing here</h1>
        <p class="mnf__body">That address does not match anything in Tapscore Manage.</p>
        <button bind="home" class="mnf__home" type="button"></button>
    </section>
`);class Ln extends k{static styles=`
        .mnf {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: ${d("md")};

            & .mnf__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-size: 1.5rem;
                font-weight: 600;
                color: ${a("text")};
            }

            & .mnf__body {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.95rem;
            }

            & .mnf__home {
                ${E()}
                min-height: ${a("manage-touch-target")};
                padding: 0 ${d("lg")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                cursor: pointer;

                &.hidden { display: none; }
            }
        }
    `;router=this.inject(z);roles=this.inject(D);crumbs=this.inject(te);onMount(){this.crumbs.set([])}render(){const e=q(this.roles)[0];return this.wire(Tn,{home:{className:()=>e?"mnf__home":"mnf__home hidden",textContent:()=>e?`Go to ${e.label}`:"",onclick:()=>{e&&this.router.navigate(e.path,!0)}}})}}const Nn=S(`
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
`),An=S(`
    <li class="mshell__crumb">
        <span bind="sep" class="mshell__crumb-sep">/</span>
        <a bind="link" class="mshell__crumb-link"></a>
        <span bind="current" class="mshell__crumb-current" aria-current="page"></span>
    </li>
`),On=S(`
    <div class="mshell__identity-inner">
        <span bind="who" class="mshell__who"></span>
        <button bind="signout" class="mshell__signout" type="button">Sign out</button>
    </div>
`);class In extends k{static styles=`
        .mshell {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            min-height: 100vh;
            min-height: 100dvh;
            background: ${a("bg")};

            /* ─── Chrome, shared by top bar, sidebar and drawer ─── */

            & .mshell__wordmark {
                font-family: ${a("font-display")};
                font-size: 1.05rem;
                font-weight: 400;
                letter-spacing: -0.01em;
                color: ${a("manage-chrome-fg")};
                white-space: nowrap;

                & b { font-weight: 700; }
            }

            & .mshell__brand {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${d("sm")};
                min-height: ${a("manage-touch-target")};
                padding: 0 ${d("md")};
                margin-bottom: ${a("manage-stack-gap")};
            }

            /* Inset from the chrome's edges so the active item's pill reads as
               a raised shape sitting ON the sidebar, rather than as a band
               bleeding off both sides of it. */
            & .mshell__navhost {
                flex: 1;
                padding: 0 ${d("sm")};
            }

            & .mshell__identity {
                border-top: 1px solid ${a("manage-chrome-border")};
                padding-top: ${a("manage-stack-gap")};
                margin-top: ${a("manage-stack-gap")};

                & .mshell__identity-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: ${d("sm")};
                    padding: 0 ${d("md")};
                }

                & .mshell__who {
                    color: ${a("manage-chrome-fg-muted")};
                    font-size: 0.8rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }

                & .mshell__signout {
                    ${E(void 0,"ghost")}
                    min-height: ${a("manage-touch-target")};
                    padding: 0 ${d("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    /* The recipe's tiers are drawn for the PAGE surface; on the
                       ink chrome they would paint a cream slab. Shape, sizing
                       and states come from the recipe, the skin from the chrome
                       tokens — overrides after the recipe, per ADR-005. */
                    background: transparent;
                    color: ${a("manage-chrome-fg")};
                    border-color: ${a("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${a("manage-chrome-hover-bg")};
                        color: ${a("manage-chrome-fg")};
                        border-color: ${a("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${a("manage-chrome-fg")};
                        outline-offset: 2px;
                    }
                }
            }

            /* ─── Narrow: top bar + drawer ─── */

            & .mshell__topbar {
                grid-row: 1;
                display: flex;
                align-items: center;
                gap: ${d("md")};
                padding: 0 ${a("manage-page-pad")};
                padding-top: env(safe-area-inset-top);
                min-height: calc(${a("manage-touch-target")} + ${d("md")});
                background: ${a("manage-chrome-bg")};

                & .mshell__menu {
                    ${E(void 0,"ghost")}
                    min-height: ${a("manage-touch-target")};
                    min-width: ${a("manage-touch-target")};
                    padding: 0 ${d("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    /* Same reasoning as the sign-out button above: recipe for
                       shape, chrome tokens for skin. The label is the word
                       "Menu" and not a hamburger glyph on purpose — a glyph has
                       no accessible name and this control opens the app's whole
                       navigation (docs/design-guidelines.md §4). */
                    background: transparent;
                    color: ${a("manage-chrome-fg")};
                    border-color: ${a("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${a("manage-chrome-hover-bg")};
                        color: ${a("manage-chrome-fg")};
                        border-color: ${a("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${a("manage-chrome-fg")};
                        outline-offset: 2px;
                    }
                }
            }

            & .mshell__scrim {
                position: fixed;
                inset: 0;
                z-index: 30;
                background: ${a("manage-scrim")};
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
                width: min(84vw, calc(${a("manage-sidebar-width")} + ${d("2xl")}));
                padding: ${a("manage-page-pad")} 0;
                padding-top: calc(${a("manage-page-pad")} + env(safe-area-inset-top));
                background: ${a("manage-chrome-bg")};
                /* The shadow disappears against a near-black page in dark
                   scheme, so a hairline carries the drawer's edge there. */
                border-right: 1px solid ${a("manage-chrome-border")};
                box-shadow: ${a("shadow-elevated")};
                transform: translateX(-100%);
                transition: transform 180ms ease;

                &.open { transform: translateX(0); }

                & .mshell__close {
                    ${E(void 0,"ghost")}
                    min-height: ${a("manage-touch-target")};
                    padding: 0 ${d("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    background: transparent;
                    color: ${a("manage-chrome-fg")};
                    border-color: ${a("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${a("manage-chrome-hover-bg")};
                        color: ${a("manage-chrome-fg")};
                        border-color: ${a("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${a("manage-chrome-fg")};
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
                padding: ${a("manage-page-pad")};
                padding-bottom: calc(${a("manage-section-gap")} + env(safe-area-inset-bottom));
            }

            & .mshell__crumbs {
                min-height: 1.25rem;
                margin-bottom: ${a("manage-stack-gap")};

                & ol {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: ${d("xs")};
                    font-size: 0.8rem;
                }

                & .mshell__crumb {
                    display: flex;
                    align-items: center;
                    gap: ${d("xs")};
                }

                & .mshell__crumb-sep {
                    color: ${a("text-muted")};
                    &.hidden { display: none; }
                }

                & .mshell__crumb-link {
                    color: ${a("text-muted")};
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;

                    &:hover { color: ${a("text")}; text-decoration: underline; }
                    &.hidden { display: none; }
                }

                & .mshell__crumb-current {
                    color: ${a("text")};
                    font-weight: 700;
                    &.hidden { display: none; }
                }
            }

            & .mshell__outlet {
                max-width: ${a("manage-content-max")};
            }

            /* ─── Wide: persistent sidebar, no top bar, no drawer ─── */

            @media ${tn} {
                grid-template-columns: ${a("manage-sidebar-width")} 1fr;
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
                    padding: ${a("manage-page-pad-wide")} 0;
                    background: ${a("manage-chrome-bg")};
                }

                & .mshell__main {
                    grid-column: 2;
                    grid-row: 1;
                    padding: ${a("manage-page-pad-wide")};
                }
            }

            @media (prefers-reduced-motion: reduce) {
                & .mshell__scrim,
                & .mshell__drawer { transition: none; }
            }
        }
    `;router=this.inject(z);auth=this.inject(N);roles=this.inject(D);breadcrumbs=this.inject(te);drawerOpen=new b(!1);render(){const e=q(this.roles)[0];e&&this.router.route.get()==="/"&&this.router.navigate(e.path,!0);const t=this.wire(Nn,{menu:{onclick:()=>this.drawerOpen.set(!0),"aria-expanded":()=>String(this.drawerOpen.get())},close:{onclick:()=>this.drawerOpen.set(!1)},scrim:{className:()=>this.drawerOpen.get()?"mshell__scrim open":"mshell__scrim",onclick:()=>this.drawerOpen.set(!1)},drawer:{className:()=>this.drawerOpen.get()?"mshell__drawer open":"mshell__drawer",inert:()=>!this.drawerOpen.get()}});return this.spawn(Le,this.ref(t,"sidebarNav")),this.spawn(Le,this.ref(t,"drawerNav"),{onNavigate:()=>this.drawerOpen.set(!1)}),this.identity(this.ref(t,"sidebarIdentity")),this.identity(this.ref(t,"drawerIdentity")),this.crumbs(this.ref(t,"crumbs")),this.$swap(this.ref(t,"outlet"),this.router.route,En(this.roles),Ln),t}onMount(){this.track(w(()=>{this.router.route.get(),this.drawerOpen.set(!1)}));const e=t=>{t.key==="Escape"&&this.drawerOpen.get()&&this.drawerOpen.set(!1)};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}identity(e){e.appendChild(this.wire(On,{who:()=>{const t=this.auth.currentUser.get();return t?`Signed in as ${t.username}`:""},signout:{onclick:()=>{this.drawerOpen.set(!1),this.auth.logout()}}}))}crumbs(e){const t=document.createElement("ol");e.appendChild(t),this.$each(t,()=>this.breadcrumbs.crumbs.get(),(r,i,s)=>this.wireEl(An,{sep:{className:()=>i===0?"mshell__crumb-sep hidden":"mshell__crumb-sep"},link:{className:()=>r.path?"mshell__crumb-link":"mshell__crumb-link hidden",href:r.path?M+r.path:"",textContent:()=>r.path?r.label:"",onclick:o=>{const l=o;l.metaKey||l.ctrlKey||l.shiftKey||l.button!==0||(o.preventDefault(),r.path&&this.router.navigate(r.path))}},current:{className:()=>r.path?"mshell__crumb-current hidden":"mshell__crumb-current",textContent:()=>r.path?"":r.label}},s),(r,i)=>`${i}:${r.label}`)}}const se="Something went wrong on our end. Try again in a moment.";function zn(n,e){const t=(n.details??[]).map(i=>i.path),r=i=>t.some(s=>s===`/${i}`);return r("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":r("username")?"Enter your username.":r("displayName")?"Enter a display name.":r("handicapIndex")?"Handicap index must be a number (or leave it empty).":r("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function Dn(n,e){if(n instanceof T)switch(n.status){case 400:return zn(n,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":se;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return n.status>=500?se:"That request could not be completed."}return n instanceof Error&&n.message==="Request timeout"?"That took too long. Check your connection and try again.":n instanceof Error?"Cannot reach the server. Check your connection and try again.":se}const Pn=S(`
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
`);class Rn extends k{static styles=`
        .msignin {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${a("manage-page-pad")};

            & .msignin__panel {
                ${ee({})}
                display: flex;
                flex-direction: column;
                gap: ${d("md")};
                width: 100%;
                max-width: 22rem;
                padding: ${a("manage-page-pad-wide")};

                &[inert] { opacity: 0.6; }
            }

            & .msignin__brand {
                font-family: ${a("font-display")};
                font-size: 1.5rem;
                font-weight: 400;
                letter-spacing: -0.01em;
                color: ${a("text")};

                & b { font-weight: 700; }
            }

            & .msignin__lead {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.9rem;
            }

            & .msignin__error {
                display: none;
                color: ${a("error")};
                font-size: 0.85rem;
                line-height: 1.4;

                &.show { display: block; }
            }

            & .msignin__field {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};

                & span {
                    color: ${a("text-muted")};
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                & input {
                    ${We()}
                    min-height: ${a("manage-touch-target")};
                    padding: 0 ${d("md")};
                    font-family: inherit;
                    font-size: 1rem;
                }
            }

            & .msignin__submit {
                ${E(void 0,"primary")}
                min-height: ${a("manage-touch-target")};
                margin-top: ${d("xs")};
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
            }
        }
    `;auth=this.inject(N);roles=this.inject(D);username="";password="";busy=new b(!1);formError=new b("");render(){return this.wire(Pn,{form:{inert:()=>this.busy.get(),onsubmit:async e=>{e.preventDefault(),await this.submit()}},error:{className:()=>this.formError.get()?"msignin__error show":"msignin__error",textContent:()=>this.formError.get()},username:{oninput:e=>{this.username=e.target.value}},password:{oninput:e=>{this.password=e.target.value}},submit:{textContent:()=>this.busy.get()?"Signing in…":"Sign in"}})}async submit(){if(this.formError.set(""),!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const e=await He.login(this.username.trim(),this.password);this.roles.clear(),this.auth.error.set(null),this.auth.currentUser.set(e)}catch(e){this.formError.set(Dn(e,"login")),this.busy.set(!1)}}}const Un=S(`
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
`);class jn extends k{static styles=`
        .mdenied {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${a("manage-page-pad")};

            & .mdenied__panel {
                ${ee({})}
                display: flex;
                flex-direction: column;
                gap: ${d("md")};
                width: 100%;
                max-width: 30rem;
                padding: ${a("manage-page-pad-wide")};
            }

            & .mdenied__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-size: 1.5rem;
                font-weight: 600;
                letter-spacing: -0.01em;
                color: ${a("text")};
            }

            & .mdenied__body {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mdenied__hint {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.85rem;
            }

            & .mdenied__command {
                display: block;
                padding: ${d("sm")} ${d("md")};
                border-radius: ${a("radius-sm")};
                background: ${a("surface-sunken")};
                border: 1px solid ${a("border")};
                color: ${a("text")};
                font-size: 0.8rem;
                line-height: 1.5;
                word-break: break-all;
            }

            & .mdenied__foot {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${d("md")};
                border-top: 1px solid ${a("border")};
                padding-top: ${d("md")};

                & .mdenied__who {
                    color: ${a("text-muted")};
                    font-size: 0.8rem;
                }

                & .mdenied__signout {
                    ${E()}
                    min-height: ${a("manage-touch-target")};
                    padding: 0 ${d("lg")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                }
            }
        }
    `;auth=this.inject(N);render(){return this.wire(Un,{command:()=>`bun run grant:role grant ${this.auth.currentUser.get()?.username??"<username>"} super_admin`,who:()=>{const e=this.auth.currentUser.get();return e?`Signed in as ${e.username}`:""},signout:{onclick:()=>{this.auth.logout()}}})}}const Mn=S(`
    <div class="mboot">
        <p class="mboot__line">Loading…</p>
    </div>
`),qn=S(`
    <div class="mboot">
        <h1 class="mboot__title">Cannot reach the server</h1>
        <p class="mboot__line">Tapscore Manage could not check what you are allowed to manage.</p>
        <button bind="retry" class="mboot__retry" type="button">Try again</button>
    </div>
`),ot=`
    .mboot {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: ${d("md")};
        min-height: 100vh;
        min-height: 100dvh;
        padding: ${a("manage-page-pad")};
        text-align: center;

        & .mboot__title {
            margin: 0;
            font-family: ${a("font-display")};
            font-size: 1.5rem;
            font-weight: 600;
            color: ${a("text")};
        }

        & .mboot__line {
            margin: 0;
            max-width: 44ch;
            color: ${a("text-muted")};
            font-size: 0.95rem;
            line-height: 1.5;
        }

        & .mboot__retry {
            ${E()}
            min-height: ${a("manage-touch-target")};
            padding: 0 ${d("lg")};
            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
        }
    }
`;class Fn extends k{static styles=ot;render(){return this.wire(Mn,{})}}class Bn extends k{static styles=ot;roles=this.inject(D);auth=this.inject(N);render(){return this.wire(qn,{retry:{onclick:()=>{this.auth.load(),this.roles.load(!0)}}})}}const Hn=S('<div bind="gate" class="mapp"></div>');class Gn extends k{static styles=`
        .mapp { min-height: 100vh; min-height: 100dvh; }
    `;auth=this.inject(N);roles=this.inject(D);gate=new U(()=>this.auth.loading.get()?"loading":this.auth.currentUser.get()===null?this.auth.error.get()?"failed":"signed-out":this.roles.error.get()?"failed":this.roles.loaded.get()?q(this.roles).length>0?"ready":"denied":"loading");render(){const e=this.wire(Hn,{});return this.track(w(()=>{this.auth.currentUser.get()?this.roles.load():this.roles.clear()})),this.$swap(this.ref(e,"gate"),this.gate,{loading:Fn,failed:Bn,"signed-out":Rn,denied:jn,ready:In}),e}}I.get(De);Ht();I.set(N,new Gt(He));const Wn=I.get(N);await Nt(Gn,"#app",{hot:void 0,onInit:async()=>{await Wn.load()}});export{ae as A,k as C,z as R,b as S,De as T,_ as a,V as b,U as c,yt as d,w as e,bt as n,H as r,S as t};
