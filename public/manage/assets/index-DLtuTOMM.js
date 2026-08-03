(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(r){if(r.ep)return;r.ep=!0;const o=t(r);fetch(r.href,o)}})();const ds="modulepreload",cs=function(s){return"/tapscore/manage/"+s},Je={},hs=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let h=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),l=a?.nonce||a?.getAttribute("nonce");r=h(t.map(d=>{if(d=cs(d),d in Je)return;Je[d]=!0;const u=d.endsWith(".css"),f=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${f}`))return;const $=document.createElement("link");if($.rel=u?"stylesheet":ds,u||($.as="script"),$.crossOrigin="",$.href=d,l&&$.setAttribute("nonce",l),document.head.appendChild($),u)return new Promise((v,N)=>{$.addEventListener("load",v),$.addEventListener("error",()=>N(new Error(`Unable to preload CSS for ${d}`)))})}))}function o(a){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=a,window.dispatchEvent(l),!l.defaultPrevented)throw a}return r.then(a=>{for(const l of a||[])l.status==="rejected"&&o(l.reason);return e().catch(o)})},X="/tapscore/manage/".replace(/\/+$/,""),He=X+"/api",Ee={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},us=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function ms(s,e){const t={};for(const[n,r]of us)if(n in s)for(const o of r)o in s||(t[o]=`var(--${n})`);return{...e,...t,...s}}const kt=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],fs={thin:"1px",medium:"3px",thick:"5px"};function Ct(s){const e=s.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":fs[e.toLowerCase()]??e}function ps(){return kt.map(s=>{const e=Ct(Ee[s]);return`@property --${s}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const Et={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Nt={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},gs={...Nt,"done-opacity":"0.35"},bs={...Et,...Nt,...Ee,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},_s={...Et,...gs,...Ee,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class ys{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;St(e);const n=this.tracking;this.tracking=e;try{t()}finally{this.tracking=n}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const n of t)n.disposed||n.run()}}}const D=new ys;function St(s){for(const e of s.deps)e.delete(s);s.deps.clear()}class m{constructor(e){this.subs=new Set,this.val=e}get(){return D.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,D.notify(this.subs))}update(e){this.set(e(this.val))}}class R{constructor(e){this.subs=new Set,this.val=void 0;const t=this,n={run(){D.runTracked(n,()=>{const r=e();Object.is(t.val,r)||(t.val=r,D.notify(t.subs))})},deps:new Set};n.run()}get(){return D.subscribe(this.subs),this.val}peek(){return this.val}}function b(s){const e={run(){D.runTracked(e,s)},deps:new Set};return e.run(),()=>{e.disposed=!0,St(e)}}function we(s){D.batch(s)}function I(s){return D.untrack(s)}class ws{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const F=new ws,te=X;function De(s){return te?s===te?"/":s.startsWith(te+"/")?s.slice(te.length):s:s}function vs(s){return te+s}class M{constructor(){this.route=new m(De(location.pathname??"/")),this.search=new m(location.search??""),window.addEventListener("popstate",()=>we(()=>{this.route.set(De(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const n=typeof t=="boolean"?{replace:t}:t??{},r=e.indexOf("#"),o=r>=0?e.slice(r):"",a=r>=0?e.slice(0,r):e,l=a.indexOf("?"),h=l>=0?a.slice(0,l):a,d=l>=0?a.slice(l+1):"",u=n.query!==void 0?$s(n.query):d?"?"+d:"",f=vs(h)+u+o;(n.replace?history.replaceState:history.pushState).call(history,null,"",f),we(()=>{this.route.set(h),this.search.set(u)})}back(){history.back()}link(e,t="active"){const n=e.split("#")[0].split("?")[0];return{onclick:r=>{r.preventDefault(),this.navigate(e)},className:()=>{const r=this.route.get();return r===n||r.startsWith(n+"/")?t:""}}}params(e){const t=e.split("/");return new R(()=>{const n=this.route.get().split("/"),r={};for(const[o,a]of t.entries())a.startsWith(":")&&(r[a.slice(1)]=n[o]??"");return r})}query(e){return new R(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new R(()=>{const e={};for(const[t,n]of new URLSearchParams(this.search.get()))e[t]=n;return e})}}function $s(s){const e=new URLSearchParams;for(const[n,r]of Object.entries(s))r==null||r===""||e.set(n,String(r));const t=e.toString();return t?"?"+t:""}function xs(s){return e=>s[e]}const ks="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",Ze="data-basics-global";function Cs(){if(document.head.querySelector(`style[${Ze}]`))return;const s=document.createElement("style");s.setAttribute(Ze,""),s.textContent=ps()+ks,document.head.appendChild(s)}function Es(s,e){Cs();const t=new Set(kt),n=(o,a,l)=>{const h=Object.entries(o).map(([d,u])=>`--${d}:${t.has(d)?Ct(u):u}`).join(";");return`${a}{color-scheme:${l};${h}}`},r=document.createElement("style");return r.textContent=n(s,'[data-theme="light"]',"light")+n(e,'[data-theme="dark"]',"dark"),document.head.appendChild(r),o=>`var(--${o})`}const et="basics-js-theme";class It{constructor(){this.dark=new m(!1);const e=localStorage.getItem(et),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),b(()=>{const n=this.dark.get();document.documentElement.setAttribute("data-theme",n?"dark":"light"),localStorage.setItem(et,n?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function E(s){const e=document.createElement("template");return e.innerHTML=s,e}function Ns(s,e){let t;for(const n of Object.keys(e))s.startsWith(n+"/")&&(!t||n.length>t.length)&&(t=n);return t?e[t]:void 0}const tt=new Set;class C{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!tt.has(t)){tt.add(t);const n=document.createElement("style");n.textContent=t.styles,document.head.appendChild(n)}}onMount(){}onDestroy(){}inject(e){return F.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...n){const r=I(()=>{const o=new e(n[0]);return o.mount(t),o});return this.children.push(r),r}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){I(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,n){const r=n??(a=>this.track(a)),o=e.content.cloneNode(!0);for(const a of o.querySelectorAll("[bind]")){const l=t[a.getAttribute("bind")];if(l)if(typeof l=="function")r(b(()=>{const h=l();a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement?a.value=String(h):a.textContent=String(h)}));else for(const[h,d]of Object.entries(l)){const u=h.includes("-");h.startsWith("on")&&typeof d=="function"?a.addEventListener(h.slice(2),d):typeof d=="function"?r(b(()=>{const f=d();u?a.setAttribute(h,String(f)):a[h]=f})):u?a.setAttribute(h,String(d)):a[h]=d}}return o}wireEl(e,t,n){return this.wire(e,t,n).firstElementChild}slot(e,t){const n=this.props[e];if(n==null)return!1;const r=this.ref(t,e);return r?(typeof n=="string"?r.textContent=n:typeof n=="function"&&n.prototype instanceof C?this.spawn(n,r):typeof n=="function"&&n(r,{spawn:(o,a,...l)=>this.spawn(o,a,...l),track:o=>this.track(o)}),!0):!1}$each(e,t,n,r=(o,a)=>a){const o=typeof t=="function"?t:()=>t.get(),a=new Map,l=new Map;this.track(()=>{for(const h of l.values())h.forEach(d=>d());l.clear()}),this.track(b(()=>{const h=o(),d=new Map;for(const[f,$]of h.entries()){const v=r($,f);if(a.has(v))d.set(v,a.get(v));else{const N=[];d.set(v,I(()=>n($,f,T=>N.push(T)))),l.set(v,N)}}for(const[f,$]of a)d.has(f)||($.remove(),I(()=>l.get(f)?.forEach(v=>v())),l.delete(f));let u=e.firstChild;for(const f of d.values())f===u?u=u.nextSibling:e.insertBefore(f,u);a.clear();for(const[f,$]of d)a.set(f,$)}))}$condition(e,t,n,r){let o=null;this.track(b(()=>{o&&(o.remove(),o=null);const a=t.get();o=I(()=>a?n():r?.()??null),o&&e.appendChild(o)}))}$swap(e,t,n,r){let o=null;this.track(b(()=>{if(o){const h=o;o=null,I(()=>h.destroy())}e.textContent="";const a=t.get(),l=n[a]??Ns(a,n)??r;l&&(o=I(()=>{const h=new l;return h.mount(e),h}))})),this.track(()=>o?.destroy())}}const ve=new Set;function Ss(s){return ve.add(s),()=>ve.delete(s)}function Is(){for(const s of Array.from(ve)){ve.delete(s);try{s()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function Ts(s,e,t){const n=document.querySelector(e);n.textContent="";const r=F.get(M);let o=null,a=!1,l=null,h=!!t?.hot?.data.hmr;const d=async u=>{o&&(o.destroy(),o=null,n.textContent=""),u?(l||(l=(await hs(()=>import("./obs-shell.component-C2kqWfkr.js"),[])).ObsShellComponent),o=I(()=>new l)):(!h&&t?.onInit&&(await t.onInit(),h=!0),o=I(()=>new s)),I(()=>o.mount(n)),a=u};await d(De(location.pathname).startsWith("/_obs")),b(()=>{const u=r.route.get().startsWith("/_obs");u!==a&&d(u)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{o?.destroy()}catch(u){console.error("[startApp] the root component threw while disposing",u)}if(o=null,Is(),t.onDispose)try{t.onDispose()}catch(u){console.error("[startApp] onDispose threw",u)}}),t.hot.accept())}class L extends Error{constructor(e,t,n,r){super(t),this.status=e,this.details=n,this.traceId=r,this.name="ApiError"}}const Ls=10,be=[];let _e=[],ne=null;function As(s){be.push(s),be.length>Ls&&be.shift()}function $e(s,e,t){const n={code:s,message:e,url:typeof location<"u"?location.href:"",context:[...be],timestamp:new Date().toISOString()};t!==void 0&&(n.traceId=t),_e.push(n),Os()}function Os(){ne||(ne=setTimeout(Tt,5e3))}function Tt(){if(ne&&(clearTimeout(ne),ne=null),_e.length===0)return;const s=_e;_e=[];for(const e of s){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${He}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${He}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Tt()});const zs=3e4,Hs=2,he=new Map,Lt=new WeakMap;function Re(s){if(s instanceof L)return s.traceId;if(s!=null&&typeof s=="object")return Lt.get(s)}async function w(s){if(s.method==="GET"){const e=he.get(s.url);if(e)return e;const t=st(s,Hs);return he.set(s.url,t),t.then(()=>he.delete(s.url),()=>he.delete(s.url)),t}return st(s,0)}async function st(s,e){const t=s.timeout??zs;let n;for(let r=0;r<=e;r++){const o=crypto.randomUUID();try{return await Rs(Ds(s,o),t)}catch(a){if(n=a,!(a instanceof L)&&a!=null&&typeof a=="object"&&Lt.set(a,o),a instanceof L||r===e)break;await new Promise(l=>setTimeout(l,1e3*2**r))}}throw n}async function Ds(s,e){const t={"X-Trace-Id":e},n={method:s.method,headers:t};s.body!==void 0&&(t["Content-Type"]="application/json",n.body=JSON.stringify(s.body));const r=await fetch(s.url,n),o=r.headers.get("x-trace-id")??e;if(As({type:"api",detail:`${s.method} ${s.url}`,timestamp:new Date().toISOString()}),!r.ok){const a=await r.json().catch(()=>({error:r.statusText}));throw new L(r.status,a.error??r.statusText,a.details,o)}return r.json()}function Rs(s,e){let t;const n=new Promise((r,o)=>{t=setTimeout(()=>o(new Error("Request timeout")),e)});return Promise.race([s,n]).finally(()=>clearTimeout(t))}const Pe=new Set;let Te=!1;function Ps(s){return Pe.add(s),()=>{Pe.delete(s)}}function Ge(){if(!Te){Te=!0;try{for(const s of[...Pe])try{s()}catch(e){try{$e("session-listener",Fs(e))}catch{}}}finally{Te=!1}}}function Fs(s){try{if(s instanceof Error){const e=s.message;if(typeof e=="string")return e}return String(s)}catch{return"listener threw a value that could not be described"}}async function ue(s,e,t,n={}){we(()=>{s.set(!0),e.set(null)});try{const r=await t();return s.set(!1),r}catch(r){const o=Ms(r);we(()=>{s.set(!1),e.set(o)}),$e(o.code,o.message,Re(r)),o.code==="auth"&&n.sessionExpiry!==!1&&Ge();return}}function Ms(s){return s instanceof L?s.status===401?{code:"auth",message:"Unauthorized"}:s.status===409?{code:"conflict",message:"Data has changed — please try again"}:s.status===400?{code:"validation",message:s.message}:s.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:s instanceof Error?s.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const Le={sessionExpiry:!1};function js(s){return{me:()=>w({method:"GET",url:`${s}/auth/me`}),login:e=>w({method:"POST",url:`${s}/auth/login`,body:e}),logout:()=>w({method:"POST",url:`${s}/auth/logout`,body:{}}),logoutAll:()=>w({method:"POST",url:`${s}/auth/logout-all`,body:{}})}}class j{constructor(){this.api=js(He),this.currentUser=new m(null),this.loading=new m(!1),this.error=new m(null),this.offSessionExpired=Ps(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=Ss(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await ue(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const n=await ue(this.loading,this.error,()=>this.api.login({username:e,password:t}),Le);return n?(this.currentUser.set(n),!0):!1}async logout(){await ue(this.loading,this.error,()=>this.api.logout(),Le);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}async logoutEverywhere(){const e=await ue(this.loading,this.error,()=>this.api.logoutAll(),Le),t=this.error.get();return(!t||t.code==="auth")&&this.currentUser.set(null),e?.revoked??null}}const At={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},Us={...At,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},qs={...At,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"};function Ot(s,e={}){const t=s==="light"?Us:qs,n=s==="light"?bs:_s;return ms({...t,...e},n)}const zt={"manage-page-pad":"var(--space-4)","manage-page-pad-wide":"var(--space-6)","manage-stack-gap":"var(--space-3)","manage-section-gap":"var(--space-5)","manage-touch-target":"44px","manage-table-bg":"var(--surface)","manage-table-radius":"var(--radius)","manage-table-border":"var(--border)","manage-table-header-bg":"var(--surface-sunken)","manage-table-header-fg":"var(--text-muted)","manage-table-header-border":"var(--border-strong)","manage-table-header-pad-y":"var(--space-2)","manage-table-header-pad-x":"var(--space-3)","manage-table-cell-pad-y":"var(--space-3)","manage-table-cell-pad-x":"var(--space-3)","manage-table-row-border":"var(--border)","manage-table-row-hover-bg":"var(--hover-bg)","manage-table-row-editing-bg":"var(--accent-soft)","manage-table-card-gap":"var(--space-2)","btn-danger-bg":"transparent","btn-danger-fg":"var(--danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger)","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger)","manage-sidebar-width":"232px","manage-content-max":"1120px"},Ht=s=>({"manage-chrome-bg":"var(--topbar-bg)","manage-chrome-fg":s,"manage-chrome-fg-muted":"color-mix(in srgb, var(--manage-chrome-fg) 66%, transparent)","manage-chrome-border":"color-mix(in srgb, var(--manage-chrome-fg) 14%, transparent)","manage-chrome-hover-bg":"color-mix(in srgb, var(--manage-chrome-fg) 9%, transparent)","manage-chrome-active-bg":"color-mix(in srgb, var(--manage-chrome-fg) 16%, transparent)","manage-scrim":"color-mix(in srgb, var(--topbar-bg) 62%, transparent)"}),Dt=Ot("light",{...zt,...Ht("var(--primary-text)")}),Rt=Ot("dark",{...zt,...Ht("var(--text)")}),i=Es(Dt,Rt);function Bs(){const s=document.querySelector('meta[name="theme-color"]');if(!s)return;const e=F.get(It);b(()=>{const n=(e.dark.get()?Rt:Dt)["topbar-bg"];n&&s.setAttribute("content",n)})}class Ws extends j{constructor(e){super(),this.client=e}client;async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await this.client.login(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await this.client.me()),this.error.set(null)}catch(e){e instanceof L&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await this.client.logout(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof L&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logoutEverywhere(){this.loading.set(!0);try{const e=await this.client.logoutAll();return this.currentUser.set(null),this.error.set(null),e.revoked}catch(e){return e instanceof L&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"}),null}finally{this.loading.set(!1)}}}function Gs(s){return{login:(e,t)=>w({method:"POST",url:`${s}/auth/login`,body:{username:e,password:t}}),me:()=>w({method:"GET",url:`${s}/auth/me`}),logout:()=>w({method:"POST",url:`${s}/auth/logout`,body:{}}),logoutAll:()=>w({method:"POST",url:`${s}/auth/logout-all`,body:{}})}}const se="/tapscore/manage/".replace(/\/+$/,"").replace(/\/manage$/,"")+"/api",Pt=Gs(se);function Ks(s){return{async list(){return w({method:"GET",url:`${s}/clubs`})},async get(e){const t=new URLSearchParams;for(const[r,o]of Object.entries(e))o!==void 0&&t.set(r,String(o));const n=t.toString();return w({method:"GET",url:`${s}/clubs/get${n?"?"+n:""}`})},async create(e){return w({method:"POST",url:`${s}/clubs`,body:e})},async update(e){return w({method:"POST",url:`${s}/clubs/update`,body:e})},async remove(e){return w({method:"DELETE",url:`${s}/clubs/${e.id}`})}}}function Ys(s){return{async list(){return w({method:"GET",url:`${s}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[r,o]of Object.entries(e))o!==void 0&&t.set(r,String(o));const n=t.toString();return w({method:"GET",url:`${s}/courses/by-club${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[r,o]of Object.entries(e))o!==void 0&&t.set(r,String(o));const n=t.toString();return w({method:"GET",url:`${s}/courses/get${n?"?"+n:""}`})},async teeRoleCatalog(){return w({method:"GET",url:`${s}/courses/tee-roles/catalog`})},async teeRoles(e){const t=new URLSearchParams;for(const[r,o]of Object.entries(e))o!==void 0&&t.set(r,String(o));const n=t.toString();return w({method:"GET",url:`${s}/courses/tee-roles${n?"?"+n:""}`})},async create(e){return w({method:"POST",url:`${s}/courses`,body:e})},async update(e){return w({method:"POST",url:`${s}/courses/update`,body:e})},async updateHole(e){return w({method:"POST",url:`${s}/courses/holes/update`,body:e})},async setTeeRole(e){return w({method:"POST",url:`${s}/courses/tee-roles`,body:e})},async clearTeeRole(e){return w({method:"DELETE",url:`${s}/courses/tee-roles/${e.courseId}/${e.roleKey}/${e.gender}`})},async validate(e){const t=new URLSearchParams;for(const[r,o]of Object.entries(e))o!==void 0&&t.set(r,String(o));const n=t.toString();return w({method:"GET",url:`${s}/courses/validate${n?"?"+n:""}`})},async remove(e){return w({method:"DELETE",url:`${s}/courses/${e.id}`})}}}function Vs(s){return{async listByCourse(e){const t=new URLSearchParams;for(const[r,o]of Object.entries(e))o!==void 0&&t.set(r,String(o));const n=t.toString();return w({method:"GET",url:`${s}/tees/by-course${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[r,o]of Object.entries(e))o!==void 0&&t.set(r,String(o));const n=t.toString();return w({method:"GET",url:`${s}/tees/get${n?"?"+n:""}`})},async create(e){return w({method:"POST",url:`${s}/tees`,body:e})},async update(e){return w({method:"POST",url:`${s}/tees/update`,body:e})},async remove(e){return w({method:"DELETE",url:`${s}/tees/${e.id}`})}}}function Xs(s){return{async myRoles(){return w({method:"GET",url:`${s}/me/roles`})},async adminStats(){return w({method:"GET",url:`${s}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[r,o]of Object.entries(e))o!==void 0&&t.set(r,String(o));const n=t.toString();return w({method:"GET",url:`${s}/admin/rounds${n?"?"+n:""}`})},async adminPlayers(){return w({method:"GET",url:`${s}/admin/players`})},async adminGrantRole(e){return w({method:"POST",url:`${s}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return w({method:"POST",url:`${s}/admin/roles/revoke`,body:e})}}}const S={clubs:Ks(se),courses:Ys(se),tees:Vs(se),admin:Xs(se)};class Q{roles=new m([]);loaded=new m(!1);error=new m(null);inflight=null;isSuperAdmin(){return this.has("super_admin")}canManageCourses(){return this.isSuperAdmin()||this.has("course_admin")}has(e){return this.roles.get().some(t=>t.role===e&&t.scopeType===null)}load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.error.set(null);try{this.roles.set(await S.admin.myRoles())}catch(t){this.roles.set([]),t instanceof L&&t.status===401?Ge():(this.error.set("Cannot reach the server."),this.inflight=null)}finally{this.loaded.set(!0)}})(),this.inflight)}clear(){this.roles.set([]),this.loaded.set(!1),this.error.set(null),this.inflight=null}}const Ve=class Ve extends C{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(b(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};Ve.styles=`
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
    `;let Fe=Ve;const y=s=>`var(--${s})`,Xe=class Xe extends C{render(){const e=document.createElement("div"),t=(h,d)=>{typeof d=="function"?this.track(b(()=>{h.textContent=d()})):h.textContent=d};this.spawn(Fe,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const n=document.createElement("h2");n.className="ui-confirm__title",t(n,this.props.title??"Confirm"),this.dialogEl.appendChild(n);const r=document.createElement("p");r.className="ui-confirm__message",t(r,this.props.message),this.dialogEl.appendChild(r);const o=document.createElement("div");o.className="ui-confirm__actions";const a=document.createElement("button");a.className="ui-confirm__btn ui-confirm__btn--cancel",t(a,this.props.cancelLabel??"Cancel"),a.addEventListener("click",h=>{h.stopPropagation(),this.handleCancel()}),o.appendChild(a);const l=document.createElement("button");return l.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(l,this.props.confirmLabel??"Confirm"),l.addEventListener("click",h=>{h.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),o.appendChild(l),this.dialogEl.appendChild(o),this.dialogEl.addEventListener("click",h=>h.stopPropagation()),e.appendChild(this.dialogEl),this.track(b(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};Xe.styles=`
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
    `;let Y=Xe;const _=s=>`var(--${s})`,p=(s,e)=>`var(--${s}, ${e})`,g=s=>{const e=Ee[s];if(e===void 0)throw new Error(`unknown control token: --${s}`);return e},c=xs({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),me=s=>`
    background: ${p(`btn-${s}-bg`,g(`btn-${s}-bg`))};
    color: ${p(`btn-${s}-fg`,g(`btn-${s}-fg`))};
    border-color: ${p(`btn-${s}-border`,g(`btn-${s}-border`))};
    box-shadow: ${p(`btn-${s}-shadow`,g(`btn-${s}-shadow`))};
    &:hover {
        background: ${p(`btn-${s}-bg-hover`,g(`btn-${s}-bg-hover`))};
        color: ${p(`btn-${s}-fg-hover`,g(`btn-${s}-fg-hover`))};
        border-color: ${p(`btn-${s}-border-hover`,g(`btn-${s}-border-hover`))};
    }`,Ft=`
    background: ${p("btn-disabled-bg",g("btn-disabled-bg"))};
    color: ${p("btn-disabled-fg",g("btn-disabled-fg"))};
    border-color: ${p("btn-disabled-border",g("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${p("btn-disabled-opacity",g("btn-disabled-opacity"))};
    cursor: not-allowed;`,Qs={primary:me("primary"),secondary:me("secondary"),ghost:me("ghost"),danger:me("danger"),disabled:Ft},k=(s=p("btn-radius",g("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${p("btn-border-width",g("btn-border-width"))} solid transparent;
    border-radius: ${s};
    padding: ${p("btn-padding-y",g("btn-padding-y"))} ${p("btn-padding-x",g("btn-padding-x"))};
    font-family: ${_("font-ui")};
    font-size: ${p("btn-font-size",g("btn-font-size"))};
    line-height: ${p("btn-line-height",g("btn-line-height"))};
    font-weight: ${p("btn-font-weight",g("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${_("dur-fast")} ${_("ease-standard")},
        border-color ${_("dur-fast")} ${_("ease-standard")},
        color ${_("dur-fast")} ${_("ease-standard")},
        box-shadow ${_("dur-fast")} ${_("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${p("btn-focus-ring-width",g("btn-focus-ring-width"))} ${p("btn-focus-ring",g("btn-focus-ring"))};
    }
    ${Qs[e]}
    &:disabled {${Ft}}
`,Js=`max(${p("field-border-width",g("field-border-width"))}, ${p("field-rule-width",g("field-rule-width"))})`,fe=(s,e)=>`
    border-top-color: ${s};
    border-right-color: ${s};
    border-left-color: ${s};
    border-bottom-color: ${e};`,Mt=()=>`
    border-style: solid;
    border-top-width: ${p("field-border-width",g("field-border-width"))};
    border-right-width: ${p("field-border-width",g("field-border-width"))};
    border-left-width: ${p("field-border-width",g("field-border-width"))};
    border-bottom-width: ${Js};
    ${fe(p("field-border",g("field-border")),p("field-rule",g("field-rule")))}
    border-radius: ${p("field-radius",g("field-radius"))};
    padding: ${p("field-padding-y",g("field-padding-y"))} ${p("field-padding-x",g("field-padding-x"))};
    background: ${p("field-bg",g("field-bg"))};
    color: ${_("text")};
    font-family: ${_("font-ui")};
    font-size: ${p("field-font-size",g("field-font-size"))};
    line-height: ${p("field-line-height",g("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${_("dur-fast")} ${_("ease-standard")},
        box-shadow ${_("dur-fast")} ${_("ease-standard")},
        background ${_("dur-fast")} ${_("ease-standard")};
    &::placeholder { color: ${_("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${fe(p("field-focus-border",g("field-focus-border")),p("field-focus-border",g("field-focus-border")))}
        background: ${p("field-bg-focus",g("field-bg-focus"))};
        box-shadow: 0 0 0 ${p("field-focus-ring-width",g("field-focus-ring-width"))} ${p("field-focus-ring",g("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${fe(p("field-invalid-border",g("field-invalid-border")),p("field-invalid-rule",g("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${fe(p("field-invalid-border",g("field-invalid-border")),p("field-invalid-rule",g("field-invalid-rule")))}
        background: ${p("field-bg-focus",g("field-bg-focus"))};
        box-shadow: 0 0 0 ${p("field-focus-ring-width",g("field-focus-ring-width"))} ${p("field-invalid-ring",g("field-invalid-ring"))};
    }
`,jt=()=>`
    display: block;
    font-family: ${_("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${_("text-muted")};
`,Zs=()=>`
    display: block;
    font-family: ${_("font-ui")};
    font-size: 13px;
    line-height: 20px;
    color: ${_("danger")};
`,W=s=>`
    background: ${_("surface")};
    border: 1px solid ${_("border")};
    border-radius: ${_("radius-md")};
    box-shadow: ${_("shadow-1")};
    ${s?.hover?`
    transition:
        box-shadow ${_("dur-base")} ${_("ease-standard")},
        border-color ${_("dur-base")} ${_("ease-standard")};
    &:hover { box-shadow: ${_("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${jt()}
        margin: 0 0 ${c("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${_("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${_("text")};
    }
    & .ui-card__meta {
        margin: ${c("xs")} 0 0 0;
        font-family: ${_("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${_("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${c("md")};
        font-family: ${_("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${_("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;class oe{crumbs=new m([]);set(e){this.crumbs.set(e)}}const x=s=>`var(--${s})`,Qe=class Qe extends C{render(){const e=document.createElement("div");e.className="ui-empty-state";const t=a=>typeof a=="function"?a():a,n=(a,l)=>{typeof l=="function"?this.track(b(()=>{a.textContent=t(l)})):a.textContent=l};if(this.props.ornament!==!1){const a=document.createElement("div");a.className="ui-empty-state__ornament",a.setAttribute("aria-hidden","true"),e.appendChild(a)}const r=document.createElement(`h${this.props.headingLevel??3}`);if(r.className="ui-empty-state__heading",n(r,this.props.heading),e.appendChild(r),this.props.body!==void 0){const a=document.createElement("p");a.className="ui-empty-state__body",n(a,this.props.body),e.appendChild(a)}const o=this.props.action;if(o){const a=document.createElement("button");a.className="ui-empty-state__action",a.setAttribute("type","button"),o.ariaLabel&&a.setAttribute("aria-label",o.ariaLabel),n(a,o.label),a.addEventListener("click",()=>o.onclick()),e.appendChild(a)}return e}};Qe.styles=`
        .ui-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: ${x("space-3")};
            padding: ${x("space-7")} ${x("space-5")};
        }
        /* The brass ornament: a hairline rule, nothing more. No illustration. */
        .ui-empty-state__ornament {
            width: ${x("space-8")};
            height: 1px;
            background: ${x("brass-line")};
            margin-bottom: ${x("space-2")};
        }
        .ui-empty-state__heading {
            margin: 0;
            font-family: ${x("font-display")};
            font-weight: 500;
            font-size: 1.25rem;
            line-height: 1.4;
            color: ${x("text")};
        }
        .ui-empty-state__body {
            margin: 0;
            max-width: 48ch;
            font-family: ${x("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.6;
            color: ${x("text-muted")};
        }
        .ui-empty-state__action {
            margin-top: ${x("space-2")};
            padding: ${x("space-2")} ${x("space-4")};
            border: 1px solid ${x("accent")};
            border-radius: ${x("radius-sm")};
            background: ${x("accent")};
            color: ${x("on-accent")};
            font-family: ${x("font-ui")};
            font-size: 0.875rem;
            font-weight: 600;
            line-height: 1.5;
            cursor: pointer;
            transition: background ${x("dur-fast")} ${x("ease-standard")},
                        border-color ${x("dur-fast")} ${x("ease-standard")};
        }
        .ui-empty-state__action:hover {
            background: ${x("accent-strong")};
            border-color: ${x("accent-strong")};
        }
        .ui-empty-state__action:focus-visible {
            outline: 2px solid ${x("accent")};
            outline-offset: 2px;
        }
    `;let Me=Qe;const en=900,tn=`(min-width: ${en}px)`,Ut=660,sn=`(min-width: ${Ut}px)`,nn=`(max-width: ${Ut-.02}px)`;function rn(s){const e=new m(!1),t=typeof globalThis.matchMedia=="function"?globalThis.matchMedia(s):null;if(!t)return{value:e,dispose:()=>{}};e.set(t.matches);const n=r=>e.set(r.matches);return t.addEventListener("change",n),{value:e,dispose:()=>t.removeEventListener("change",n)}}const nt="__actions";function P(s,e={}){const t=document.createElement("button");return t.type="button",t.className=e.variant==="primary"?"mtable__btn mtable__btn--primary":"mtable__btn",t.textContent=s,e.onclick&&t.addEventListener("click",e.onclick),t}function on(s){return typeof s=="object"&&s!==null&&typeof s.get=="function"}function rt(s,e,t){if(s.textContent="",e instanceof HTMLElement){s.appendChild(e);return}if(e==null||e===""){const n=document.createElement("span");n.className="mtable__empty-cell",n.textContent=t,s.appendChild(n);return}s.appendChild(document.createTextNode(String(e)))}class J extends C{static styles=`
        /* Worded, muted or danger — never a spinner glyph and never an emoji
           (docs/design-guidelines.md §4).

           Top-level rather than nested under \`.mtable-wrap\`, because
           \`edit.statusHost\` lets a screen host this element outside the table's
           box. The table still owns the look wherever it lands. */
        .mtable__status {
            margin: ${c("xs")} 0 0;
            font-size: 0.8rem;
            line-height: 1.4;
            color: ${i("text-muted")};

            &[hidden] { display: none; }
            &.mtable__status--error { color: ${i("danger")}; font-weight: 600; }
        }

        .mtable-wrap {
            width: 100%;
            min-width: 0;

            & .mtable {
                width: 100%;
                border-collapse: collapse;
                /* Never the display serif in cells. */
                font-family: ${i("font-ui")};
                font-size: 0.875rem;
                line-height: 1.5;
                color: ${i("text")};

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
                font-family: ${i("font-display")};
                font-size: 1.05rem;
                font-weight: 600;
                color: ${i("text")};
                padding: ${i("manage-table-cell-pad-y")} ${i("manage-table-cell-pad-x")} 0;
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
                background: ${i("manage-table-header-bg")};
                color: ${i("manage-table-header-fg")};
                border-bottom: 1px solid ${i("manage-table-header-border")};
                padding: ${i("manage-table-header-pad-y")} ${i("manage-table-header-pad-x")};
                text-align: left;
                /* Overline treatment, same as the framework table's — a Manage
                   header and a framework header should not be two designs. */
                font-family: ${i("font-ui")};
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
                padding: ${i("manage-table-cell-pad-y")} ${i("manage-table-cell-pad-x")};
                border-bottom: 1px solid ${i("manage-table-row-border")};
                vertical-align: middle;
                text-align: left;
                transition: background ${i("dur-fast")} ${i("ease-standard")};
            }

            & .mtable__td--numeric {
                font-variant-numeric: tabular-nums;
                white-space: nowrap;
            }

            & .mtable__cell { min-width: 0; }
            & .mtable__empty-cell { color: ${i("text-muted")}; }

            & .mtable__stacked-label { display: none; }

            & .mtable__actions {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: ${c("sm")};
            }

            & .mtable__btn {
                ${k()}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("md")};
                font-size: 0.85rem;
                font-weight: 700;
            }

            & .mtable__btn--primary {
                ${k(void 0,"primary")}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("md")};
                font-size: 0.85rem;
                font-weight: 700;
            }

            & .mtable__empty {
                &[hidden] { display: none; }
            }

            /* ─── Wide: a real grid inside its own scroll box ─── */

            &[data-layout='columns'] {
                background: ${i("manage-table-bg")};
                border: 1px solid ${i("manage-table-border")};
                border-radius: ${i("manage-table-radius")};
                /* The wrapper is the scroll container, so a table too wide for
                   the content column scrolls HERE and the page body never
                   scrolls sideways. It also clips the header fill to the
                   radius, which a border-collapsed table cannot do itself. */
                overflow-x: auto;

                & .mtable__tr:last-child .mtable__td { border-bottom: none; }

                & .mtable__tr:not(.mtable__tr--editing):hover > .mtable__td {
                    background: ${i("manage-table-row-hover-bg")};
                }

                & .mtable__tr--editing > .mtable__td {
                    background: ${i("manage-table-row-editing-bg")};
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
                    padding: 0 0 ${c("sm")};
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
                    gap: ${i("manage-table-card-gap")};
                }

                & .mtable__tr {
                    background: ${i("manage-table-bg")};
                    border: 1px solid ${i("manage-table-border")};
                    border-radius: ${i("manage-table-radius")};
                    padding: ${i("manage-table-cell-pad-y")} ${i("manage-table-cell-pad-x")};
                }

                & .mtable__tr--editing {
                    background: ${i("manage-table-row-editing-bg")};
                }

                & .mtable__td {
                    padding: ${c("xs")} 0;
                    border-bottom: none;
                    white-space: normal;
                }

                & .mtable__stacked-label {
                    display: block;
                    font-family: ${i("font-ui")};
                    font-size: 0.6875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                    color: ${i("manage-table-header-fg")};
                    margin-bottom: 2px;
                }

                & .mtable__td--actions {
                    padding-top: ${i("manage-table-cell-pad-y")};

                    /* Direct children of the action bar, which is why the
                       actions prop takes buttons (or an array of them) and not
                       a wrapper element: a wrapper would be the flex item, and
                       the buttons inside it would keep their content width. */
                    & > .mtable__actions > .mtable__btn { flex: 1 1 auto; }
                }

                & .mtable__empty {
                    background: ${i("manage-table-bg")};
                    border: 1px solid ${i("manage-table-border")};
                    border-radius: ${i("manage-table-radius")};
                }
            }
        }
    `;static seq=0;uid=`mtable-${J.seq++}`;rowData=new Map;render(){const e=document.createElement("div");e.className="mtable-wrap";const t=document.createElement("table");t.className="mtable",t.setAttribute("role","table");const n=document.createElement("caption");n.className=this.props.captionHidden?"mtable__caption mtable__caption--hidden":"mtable__caption",n.id=`${this.uid}-caption`,n.textContent=this.props.caption,t.appendChild(n),t.setAttribute("aria-labelledby",n.id),t.appendChild(this.head());const r=document.createElement("tbody");if(r.className="mtable__body",r.setAttribute("role","rowgroup"),t.appendChild(r),e.appendChild(t),this.$each(r,()=>this.readRows(),(o,a,l)=>this.renderRow(o,l),o=>this.props.rowKey(o)),this.props.empty){const o=document.createElement("div");o.className="mtable__empty",this.spawn(Me,o,this.props.empty),e.appendChild(o),this.track(b(()=>{const a=this.rowsValue().length===0;o.hidden=!a,t.hidden=a}))}return this.layout(e),e}layout(e){let t=this.props.narrow;if(!t){const r=rn(nn);this.track(r.dispose),t=r.value}const n=this.props.stacked!==!1;this.track(b(()=>{e.setAttribute("data-layout",n&&t.get()?"stacked":"columns")}))}head(){const e=document.createElement("thead");e.className="mtable__head",e.setAttribute("role","rowgroup");const t=document.createElement("tr");t.className="mtable__tr",t.setAttribute("role","row");for(const n of this.props.columns)t.appendChild(this.th(n.key,n.header));return this.hasActionsColumn()&&t.appendChild(this.th(nt,this.props.actionsHeader??"Actions",!0)),e.appendChild(t),e}th(e,t,n=!1){const r=document.createElement("th");if(r.className="mtable__th",r.setAttribute("role","columnheader"),r.setAttribute("scope","col"),r.setAttribute("data-key",e),n){const o=document.createElement("span");o.className="mtable__th-label--hidden",o.textContent=t,r.appendChild(o)}else r.textContent=t;return r}hasActionsColumn(){return this.props.actions!==void 0||this.props.edit!==void 0}rowsValue(){return on(this.props.rows)?this.props.rows.get():this.props.rows}readRows(){const e=this.rowsValue();return I(()=>{const t=new Set;for(const n of e){const r=this.props.rowKey(n);t.add(r);const o=this.rowData.get(r);o?o.set(n):this.rowData.set(r,new m(n))}for(const n of[...this.rowData.keys()])t.has(n)||this.rowData.delete(n)}),e}signalFor(e){const t=this.props.rowKey(e);let n=this.rowData.get(t);return n||(n=new m(e),this.rowData.set(t,n)),n}renderRow(e,t){const n=this.props.rowKey(e),r={key:n},o=this.signalFor(e),a=this.props.edit,l=this.props.emptyCell??"—",h=()=>a?a.controller.key.get()===n:!1,d=document.createElement("tr");d.className="mtable__tr",d.setAttribute("role","row"),d.setAttribute("data-row-key",n);for(const u of this.props.columns){const f=document.createElement("td");if(f.className=`mtable__td mtable__td--${u.type??"text"}`,f.setAttribute("role","cell"),f.setAttribute("data-key",u.key),u.stackedLabel!==!1){const v=document.createElement("span");v.className="mtable__stacked-label",v.setAttribute("aria-hidden","true"),v.textContent=u.header,f.appendChild(v)}const $=document.createElement("div");$.className="mtable__cell",f.appendChild($),t(b(()=>{if(h()&&u.editCell){const v=o.peek();rt($,I(()=>u.editCell(v,r)),l)}else{const v=o.get();rt($,I(()=>u.cell(v,r)),l)}})),d.appendChild(f)}return this.hasActionsColumn()&&d.appendChild(this.actionsCell(r,o,h,t)),a&&(t(b(()=>{d.classList.toggle("mtable__tr--editing",h())})),t(b(()=>{a.controller.isSaving(n)?d.setAttribute("aria-busy","true"):d.removeAttribute("aria-busy")})),this.editKeys(d,n,o,t),a.autoFocus!==!1&&this.autoFocus(d,h,t)),d}actionsCell(e,t,n,r){const o=this.props.edit,a=document.createElement("td");a.className="mtable__td mtable__td--actions",a.setAttribute("role","cell"),a.setAttribute("data-key",nt);const l=document.createElement("div");l.className="mtable__actions",a.appendChild(l);let h=null,d=null;if(o){h=P(o.saveLabel??"Save",{variant:"primary",onclick:()=>o.oncommit(t.peek())}),d=P(o.cancelLabel??"Cancel",{onclick:()=>{o.controller.cancel(),o.oncancel?.(t.peek())}}),r(b(()=>{const f=o.controller.isSaving(e.key);h.disabled=f,d.disabled=f}));const u=document.createElement("p");u.className="mtable__status",u.setAttribute("role","status"),u.setAttribute("aria-live","polite"),(o.statusHost??a).appendChild(u),r(()=>u.remove()),r(b(()=>{const f=o.controller.errorFor(e.key),$=o.controller.isSaving(e.key);u.textContent=f??($?o.savingLabel??"Saving…":""),u.className=f?"mtable__status mtable__status--error":"mtable__status",u.hidden=!f&&!$}))}return r(b(()=>{if(n()&&o){l.textContent="",l.append(h,d);return}const u=t.get(),f=I(()=>this.props.actions?.(u,e));l.textContent="",Array.isArray(f)?l.append(...f):f instanceof HTMLElement?l.appendChild(f):f!=null&&f!==""&&l.appendChild(document.createTextNode(String(f)))})),a}editKeys(e,t,n,r){const o=this.props.edit,a=l=>{if(o.controller.key.peek()===t){if(l.key==="Enter"){if(l.target?.tagName==="TEXTAREA"||(l.preventDefault(),o.controller.phase.peek()==="saving"))return;o.oncommit(n.peek());return}l.key==="Escape"&&(l.preventDefault(),l.stopPropagation(),o.controller.cancel(),o.oncancel?.(n.peek()))}};e.addEventListener("keydown",a),r(()=>e.removeEventListener("keydown",a))}autoFocus(e,t,n){let r=!1,o=!0;n(()=>{o=!1}),n(b(()=>{const a=t();a&&!r&&queueMicrotask(()=>{if(!o||!t())return;const l=e.querySelector('input:not([type="hidden"]), select, textarea');l&&(l.focus(),l instanceof HTMLInputElement&&typeof l.select=="function"&&l.select())}),r=a}))}}function Ne(s){return{open:s.open,title:s.title,message:s.consequence,confirmLabel:s.confirmLabel,cancelLabel:s.cancelLabel??"Cancel",danger:!0,onconfirm:s.onconfirm,oncancel:s.oncancel}}function Se(s,e){const t=n=>{n.key!=="Escape"||!s.get()||(s.set(!1),e?.())};return document.addEventListener("keydown",t),()=>document.removeEventListener("keydown",t)}const xe=()=>`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${i("manage-stack-gap")} ${c("lg")};
    align-items: start;

    & .mform__field--full {
        grid-column: 1 / -1;
    }

    @media ${sn} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
`,ae=()=>`
    display: flex;
    flex-direction: column;
    gap: ${c("xs")};
    min-width: 0;
`,le=()=>`
    ${jt()}
`,Z=()=>`
    ${Mt()}
    width: 100%;
    min-height: ${i("manage-touch-target")};
`,V=()=>`
    color: ${i("text-muted")};
    font-size: 0.8rem;
    line-height: 1.4;
`,ke=()=>`
    ${Zs()}
`,qt=()=>`
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    border: 1px solid ${i("border")};
    border-radius: ${i("radius-pill")};
    background: ${i("surface-sunken")};
    align-self: flex-start;

    & button {
        appearance: none;
        border: 1px solid transparent;
        background: none;
        min-height: ${i("manage-touch-target")};
        padding: 0 ${c("lg")};
        border-radius: ${i("radius-pill")};
        font-family: inherit;
        font-size: 0.9rem;
        font-weight: 500;
        color: ${i("text-muted")};
        cursor: pointer;
        white-space: nowrap;

        &:hover { color: ${i("text")}; }
        &:focus-visible { outline: 2px solid ${i("accent-strong")}; outline-offset: 2px; }

        /* The live option. \`aria-pressed\` is the state an assistive
           technology reads; this class is the same fact for the eye. */
        &[aria-pressed='true'] {
            background: ${i("surface")};
            border-color: ${i("border")};
            color: ${i("text")};
            font-weight: 700;
        }

        &:disabled { opacity: 0.5; cursor: default; }
    }
`,an=()=>`
    overflow-x: auto;
    background: ${i("manage-table-bg")};
    border: 1px solid ${i("manage-table-border")};
    border-radius: ${i("manage-table-radius")};
    /* Momentum scrolling on touch, and a scrollbar that does not eat a row. */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
`,ln="You no longer have permission to change the course catalog. Ask an administrator to grant you the course_admin role.";function q(s,e){if(!(s instanceof L))return $e(dn(s),cn(s),Re(s)),e;if(s.status===401)return Ge(),"Your session expired. Sign in again to continue.";if(s.status===403)return ln;if(s.status>=400&&s.status<500){if(!s.details?.length)return s.message;const t=s.details.map(n=>`${n.path.replace(/^\//,"")} — ${n.message}`).join("; ");return`${s.message}: ${t}`}return $e("server",`${s.status} ${s.message}`,Re(s)),e}function dn(s){return s instanceof Error?s.message==="Request timeout"?"timeout":"network":"unknown"}function cn(s){return s instanceof Error?s.message:String(s)}function Bt(){return{name:"",location:"",logoUrl:""}}function hn(s){return{name:s.name,location:s.location??"",logoUrl:s.logoUrl??""}}function Wt(s){const e={};s.name.trim()===""&&(e.name="A club needs a name. Enter one before saving.");const t=s.logoUrl.trim();return t!==""&&!un(t)&&(e.logoUrl="Enter a full web address starting with https://, or leave this empty."),e}function Gt(s){return Object.keys(s).length>0}function it(s){return{name:s.name.trim(),location:s.location.trim()||null,logoUrl:s.logoUrl.trim()||null}}function Kt(s,e){const t=e===0?"It has no courses.":e===1?"It has 1 course.":`It has ${e} courses.`;return`${s} leaves the catalog. ${t} Rounds already played keep their own copy of the course data, so no scorecard changes.`}const Yt="The club is removed from the catalog.";function un(s){try{const e=new URL(s);return e.protocol==="http:"||e.protocol==="https:"}catch{return!1}}function mn(s,e){const t=e.trim().toLowerCase().split(/\s+/).filter(n=>n!=="");return t.length===0?s:s.filter(n=>{const r=`${n.name} ${n.location??""}`.toLowerCase();return t.every(o=>r.includes(o))})}class Ie{clubs=new m([]);loading=new m(!1);error=new m(null);loaded=new m(!1);query=new m("");visible=new R(()=>mn(this.clubs.get(),this.query.get()));inflight=null;load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{this.clubs.set(await S.clubs.list())}catch(t){this.error.set(q(t,"Could not load the clubs. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.clubs.get().find(t=>t.id===e)??null}async create(e){return this.write(()=>S.clubs.create(it(e)),"Could not create the club. Check your connection and try again.")}async update(e,t){return this.write(()=>S.clubs.update({id:e,...it(t)}),"Could not save the club. Check your connection and try again.")}async remove(e){return this.write(()=>S.clubs.remove({id:e}),"Could not delete the club. Check your connection and try again.")}async write(e,t){try{await e()}catch(n){return{ok:!1,message:q(n,t)}}return await this.load(!0),{ok:!0}}}const fn=E(`
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
`);class Vt extends C{static styles=`
        .mclubfields {
            ${xe()}

            & .mclubfields__field {
                ${ae()}
            }

            & .mclubfields__label {
                ${le()}
            }

            & .mclubfields__control {
                ${Z()}
            }

            & .mclubfields__hint {
                ${V()}
                margin: 0;
            }

            & .mclubfields__error {
                ${ke()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;draft=new m(Bt());inputs={};render(){const e={name:`${this.props.idPrefix}-name`,location:`${this.props.idPrefix}-location`,logoUrl:`${this.props.idPrefix}-logo`},t={name:`${e.name}-error`,logoUrl:`${e.logoUrl}-error`},n={location:`${e.location}-hint`,logoUrl:`${e.logoUrl}-hint`},r=()=>this.props.busy?.get()??!1,o=this.wire(fn,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:r,oninput:a=>this.patch("name",a)},nameError:{id:t.name,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},locationLabel:{htmlFor:e.location},location:{id:e.location,"aria-describedby":n.location,disabled:r,oninput:a=>this.patch("location",a)},locationHint:{id:n.location},logoLabel:{htmlFor:e.logoUrl},logoUrl:{id:e.logoUrl,"aria-invalid":()=>String(this.props.errors.get().logoUrl!==void 0),disabled:r,oninput:a=>this.patch("logoUrl",a)},logoHint:{id:n.logoUrl},logoError:{id:t.logoUrl,textContent:()=>this.props.errors.get().logoUrl??"",hidden:()=>this.props.errors.get().logoUrl===void 0}});return this.inputs={name:this.ref(o,"name"),location:this.ref(o,"location"),logoUrl:this.ref(o,"logoUrl")},this.track(b(()=>{ot(this.inputs.name,this.props.errors.get().name?[t.name]:[])})),this.track(b(()=>{const a=[n.logoUrl];this.props.errors.get().logoUrl&&a.push(t.logoUrl),ot(this.inputs.logoUrl,a)})),o}seed(e){this.draft.set({...e});for(const t of["name","location","logoUrl"]){const n=this.inputs[t];n&&(n.value=e[t])}}focusFirst(){this.inputs.name?.focus()}focusInvalid(e){for(const t of["name","logoUrl"]){if(e[t]===void 0)continue;const n=this.inputs[t];return n?(n.focus(),!0):!1}return!1}patch(e,t){const n=t.target.value;this.draft.update(r=>({...r,[e]:n}))}}function ot(s,e){e.length===0?s.removeAttribute("aria-describedby"):s.setAttribute("aria-describedby",e.join(" "))}const z="/courses",Ke="/courses/clubs",pn=`${Ke}/:id`;function Ce(s){return`${Ke}/${s}`}const Ye="/courses/course",gn=`${Ye}/:clubId/:courseId`;function bn(s,e){return`${Ye}/${s}/${e}`}const _n=E(`
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
`);class yn extends C{static styles=`
        .mclubs {
            display: flex;
            flex-direction: column;
            gap: ${i("manage-stack-gap")};

            & .mclubs__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${c("md")};
            }

            & .mclubs__heading {
                display: flex;
                flex-direction: column;
                gap: ${c("xs")};
                min-width: 0;
            }

            & .mclubs__title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${i("text")};
            }

            & .mclubs__lead {
                margin: 0;
                max-width: 60ch;
                color: ${i("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            /* The page's forward action — solid fill is earned here, and only
               here on this screen (docs/design-guidelines.md §2). */
            & .mclubs__new {
                ${k(void 0,"primary")}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mclubs__search {
                ${ae()}
                max-width: 28rem;
            }

            & .mclubs__search-label {
                ${le()}
            }

            & .mclubs__search-input {
                ${Z()}
            }

            & .mclubs__note {
                margin: 0;
                color: ${i("text-muted")};
                font-size: 0.8rem;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclubs__error {
                margin: 0;
                color: ${i("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclubs__panel {
                ${W({})}
                display: flex;
                flex-direction: column;
                gap: ${i("manage-stack-gap")};
                padding: ${i("manage-page-pad")};

                &[hidden] { display: none; }
            }

            & .mclubs__panel-title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.15rem;
                font-weight: 600;
                color: ${i("text")};
            }

            & .mclubs__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${c("sm")};
            }

            & .mclubs__submit {
                ${k(void 0,"primary")}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mclubs__secondary {
                ${k()}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;

                &[hidden] { display: none; }
            }

            & .mclubs__link {
                color: ${i("text")};
                font-weight: 700;
                text-decoration: none;

                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${i("accent-strong")}; outline-offset: 2px; }
            }
        }
    `;router=this.inject(M);crumbs=this.inject(oe);clubs=this.inject(Ie);createOpen=new m(!1);createBusy=new m(!1);createErrors=new m({});createFailure=new m(null);deleteOpen=new m(!1);deleteTarget=new m(null);deleteFailure=new m(null);deletingId=new m(null);fields=null;searchInput=null;actionEffects=new Map;columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>this.nameLink(e)},{key:"location",header:"Location",cell:e=>e.location},{key:"courses",header:"Courses",type:"numeric",cell:e=>e.courseCount}];render(){const e=this.wire(_n,{new:{onclick:()=>this.openCreate()},searchLabel:{htmlFor:"manage-clubs-search"},search:{id:"manage-clubs-search",oninput:t=>this.clubs.query.set(t.target.value)},searchNote:{textContent:()=>this.searchNote(),hidden:()=>this.searchNote()===""},createPanel:{hidden:()=>!this.createOpen.get(),onsubmit:t=>{t.preventDefault(),this.create()}},createError:{textContent:()=>this.createFailure.get()??"",hidden:()=>this.createFailure.get()===null},createSubmit:{textContent:()=>this.createBusy.get()?"Creating…":"Create club",disabled:()=>this.createBusy.get()},createCancel:{disabled:()=>this.createBusy.get(),onclick:()=>this.closeCreate()},loadError:{textContent:()=>this.clubs.error.get()??"",hidden:()=>this.clubs.error.get()===null},retry:{hidden:()=>this.clubs.error.get()===null,onclick:()=>{this.clubs.load(!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading clubs…",hidden:()=>this.clubs.loaded.get()}});return this.searchInput=this.ref(e,"search"),this.fields=this.spawn(Vt,this.ref(e,"createFields"),{idPrefix:"manage-club-new",errors:this.createErrors,busy:this.createBusy}),this.spawn(J,this.ref(e,"tableHost"),{columns:this.columns,rows:this.clubs.visible,rowKey:t=>t.id,caption:"Clubs",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Club actions",empty:{heading:()=>this.filtering()?"No clubs match that search":"No clubs yet",body:()=>this.filtering()?"Try a shorter search, or clear it to see every club.":"A club is the top of the catalog: create one, then add its courses.",action:{label:()=>this.filtering()?"Clear search":"New club",onclick:()=>this.filtering()?this.clearSearch():this.openCreate()}}}),this.spawn(Y,this.ref(e,"confirmHost"),Ne({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this club?"},consequence:()=>this.deleteConsequence(),confirmLabel:"Delete club",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(Se(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.crumbs.set([{label:"Clubs"}]),this.clubs.load();const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.createOpen.get()||this.closeCreate())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}nameLink(e){const t=document.createElement("a");return t.className="mclubs__link",t.href=X+Ce(e.id),t.textContent=e.name,t.addEventListener("click",n=>{n.metaKey||n.ctrlKey||n.shiftKey||n.button!==0||(n.preventDefault(),this.router.navigate(Ce(e.id)))}),t}rowActions(e){const t=P("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,b(()=>{const n=this.deletingId.get();t.textContent=n===e.id?"Deleting…":"Delete",t.disabled=n!==null})),[t]}filtering(){return this.clubs.query.get().trim()!==""}clearSearch(){this.clubs.query.set(""),this.searchInput&&(this.searchInput.value="",this.searchInput.focus())}searchNote(){if(!this.filtering())return"";const e=this.clubs.visible.get().length,t=this.clubs.clubs.get().length;return`Showing ${e} of ${t} clubs.`}openCreate(){this.resetCreate(),this.createOpen.set(!0),this.fields?.focusFirst()}closeCreate(){this.createOpen.set(!1),this.resetCreate()}resetCreate(){this.createErrors.set({}),this.createFailure.set(null),this.fields?.seed(Bt())}async create(){if(this.createBusy.get()||!this.fields)return;const e=this.fields.draft.get(),t=Wt(e);if(this.createErrors.set(t),Gt(t)){this.createFailure.set(null),this.fields.focusInvalid(t);return}this.createBusy.set(!0),this.createFailure.set(null);const n=await this.clubs.create(e);if(this.createBusy.set(!1),!n.ok){this.createFailure.set(n.message);return}this.closeCreate()}deleteConsequence(){const e=this.deleteTarget.get();return e?Kt(e.name,e.courseCount):Yt}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.clubs.remove(e.id);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}const wn="Could not save. Check your connection and try again.";class ie{key=new m(null);phase=new m("idle");error=new m(null);begin(e){this.phase.get()!=="saving"&&(this.key.set(e),this.phase.set("editing"),this.error.set(null))}cancel(){this.phase.get()!=="saving"&&(this.key.set(null),this.phase.set("idle"),this.error.set(null))}async commit(e){if(this.key.get()===null||this.phase.get()==="saving")return!1;this.phase.set("saving"),this.error.set(null);let t;try{t=await e()}catch{t={ok:!1,message:wn}}return t.ok?(this.key.set(null),this.phase.set("idle"),this.error.set(null),!0):(this.phase.set("failed"),this.error.set(t.message),!1)}fail(e){this.key.get()!==null&&(this.phase.set("failed"),this.error.set(e))}isEditing(e){return this.key.get()===e}isSaving(e){return this.key.get()===e&&this.phase.get()==="saving"}errorFor(e){return this.key.get()===e&&this.phase.get()==="failed"?this.error.get():null}}const at=[9,18],je="Paste as latitude, longitude — e.g. 57.7089, 11.9746. Use a dot for decimals";function Xt(){return{name:"",holeCount:18,coordinates:""}}function vn(s){return{name:s.name,holeCount:s.holeCount===9?9:18,coordinates:Qt(s.latitude,s.longitude)}}function Qt(s,e){return s===null||e===null?"":`${ht(s)}, ${ht(e)}`}function Jt(s){const e=s.trim();if(e==="")return{ok:!0,position:{latitude:null,longitude:null}};const t=(e.includes(",")?e.split(","):e.split(/\s+/)).map(o=>o.trim()).filter(o=>o!=="");if(t.length!==2)return{ok:!1,message:je};const[n,r]=t.map(En);return n===null||r===null?{ok:!1,message:je}:{ok:!0,position:{latitude:n,longitude:r}}}function $n(s){const e={};s.name.trim()===""&&(e.name="A course needs a name. Enter one before saving.");const t=Jt(s.coordinates);return t.ok||(e.coordinates=t.message),e}function xn(s){return Object.keys(s).length>0}function lt(s){const e=Jt(s.coordinates),t=e.ok?e.position:{latitude:null,longitude:null};return{name:s.name.trim(),holeCount:s.holeCount,latitude:t.latitude,longitude:t.longitude}}function kn(s){return`${s} leaves the catalog, and its holes, tees and tee-role settings go with it. Rounds already played keep their own copy of the course data, so no scorecard changes.`}const Cn="The course is removed from the catalog, along with its holes and tees.";function dt(s){const e=s.issues.filter(n=>n.severity==="error").length;if(!s.ok||e>0)return{status:"issues",count:Math.max(e,1)};const t=s.issues.length;return t>0?{status:"warnings",count:t}:{status:"ready"}}function Zt(s){switch(s.status){case"checking":return"Checking…";case"ready":return"Ready";case"warnings":return ct(s.count,"warning","warnings");case"issues":return ct(s.count,"issue","issues");case"unknown":return"Not checked"}}function es(s){switch(s.status){case"ready":return"ready";case"warnings":return"warn";case"issues":return"error";default:return"muted"}}function ct(s,e,t){return`${s} ${s===1?e:t}`}function En(s){if(!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(s))return null;const e=Number(s);return Number.isFinite(e)?e:null}function ht(s){return String(Number(s.toFixed(6)))}const Ae={status:"checking"};class de{clubId=new m(null);courses=new m([]);readiness=new m({});validations=new m({});loading=new m(!1);error=new m(null);loaded=new m(!1);rows=new R(()=>{const e=this.readiness.get();return this.courses.get().map(t=>({...t,readiness:e[t.id]??Ae}))});clubs=F.get(Ie);inflight=null;load(e,t=!1){return this.clubId.get()!==e&&(this.clubId.set(e),this.courses.set([]),this.readiness.set({}),this.validations.set({}),this.loaded.set(!1),this.inflight=null),!t&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{const n=await S.courses.listByClub({clubId:e});if(this.clubId.get()!==e)return;this.courses.set(n),this.checkReadiness(n)}catch(n){this.error.set(q(n,"Could not load the courses. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.courses.get().find(t=>t.id===e)??null}async create(e,t){const{name:n,holeCount:r,latitude:o,longitude:a}=lt(t);return this.write(()=>S.courses.create({clubId:e,name:n,holeCount:r,latitude:o,longitude:a}),"Could not create the course. Check your connection and try again.",!0)}async update(e,t){const{name:n,holeCount:r,latitude:o,longitude:a}=lt(t);return this.write(()=>S.courses.update({id:e,name:n,holeCount:r,latitude:o,longitude:a}),"Could not save the course. Check your connection and try again.",!1)}async remove(e){return this.write(()=>S.courses.remove({id:e}),"Could not delete the course. Check your connection and try again.",!0)}async saveHole(e,t,n){return this.writeCourse(()=>S.courses.updateHole({courseId:e,holeNumber:t,...n}),"Could not save the hole. Check your connection and try again.")}async saveHoles(e,t){return this.writeCourse(()=>S.courses.update({id:e,holes:t}),"Could not add the holes. Check your connection and try again.")}async refreshReadiness(e){if(!this.holds(e))return;this.publish(e,Ae,null);let t;try{t=await S.courses.validate({id:e})}catch{this.publish(e,{status:"unknown"},null);return}this.holds(e)&&this.publish(e,dt(t),t)}holds(e){return this.courses.peek().some(t=>t.id===e)}async writeCourse(e,t){let n;try{n=await e()}catch(r){return{ok:!1,message:q(r,t)}}return this.applyCourse(n),this.refreshReadiness(n.id),{ok:!0}}applyCourse(e){this.holds(e.id)&&this.courses.update(t=>t.map(n=>n.id===e.id?{...n,...e}:n))}async write(e,t,n){try{await e()}catch(o){return{ok:!1,message:q(o,t)}}const r=this.clubId.get();return await Promise.all([r===null?Promise.resolve():this.load(r,!0),n?this.clubs.load(!0):Promise.resolve()]),{ok:!0}}checkReadiness(e){this.readiness.set(Object.fromEntries(e.map(t=>[t.id,Ae]))),this.validations.set({});for(const t of e)(async()=>{let n=null,r;try{n=await S.courses.validate({id:t.id}),r=dt(n)}catch{r={status:"unknown"}}this.holds(t.id)&&this.publish(t.id,r,n)})()}publish(e,t,n){this.readiness.update(r=>({...r,[e]:t})),this.validations.update(r=>{if(n===null){if(!(e in r))return r;const o={...r};return delete o[e],o}return{...r,[e]:n}})}}const Nn=E(`
    <div class="mcoursefields">
        <div class="mcoursefields__field">
            <label bind="nameLabel" class="mcoursefields__label">Name</label>
            <!-- aria-required, NOT the required attribute: a natively required
                 field blocks the submit event and replaces our worded message
                 with a browser bubble we cannot word or place. -->
            <input bind="name" class="mcoursefields__control" type="text" autocomplete="off" aria-required="true">
            <p bind="nameError" class="mcoursefields__error" role="alert"></p>
        </div>

        <div class="mcoursefields__field">
            <span bind="holesLabel" class="mcoursefields__label">Holes</span>
            <!-- role=group + aria-pressed rather than a radiogroup: each option
                 is an ordinary button in the tab order, which is what a two-way
                 track behaves like everywhere else in this app. -->
            <div bind="holes" class="mcoursefields__seg" role="group"></div>
            <!-- The truth, not a promise: the server changes only the stored
                 count (CourseService.update touches course_holes solely when a
                 holes payload rides along), so hole data has to be finished in
                 the holes editor and readiness flags the mismatch until then. -->
            <p bind="holesHint" class="mcoursefields__hint"></p>
        </div>

        <div class="mcoursefields__field mform__field--full">
            <label bind="coordsLabel" class="mcoursefields__label">Coordinates</label>
            <input bind="coordinates" class="mcoursefields__control" type="text" autocomplete="off" inputmode="text">
            <p bind="coordsHint" class="mcoursefields__hint"></p>
            <p bind="coordsError" class="mcoursefields__error" role="alert"></p>
        </div>
    </div>
`);class Sn extends C{static styles=`
        .mcoursefields {
            ${xe()}

            & .mcoursefields__field {
                ${ae()}
            }

            & .mcoursefields__label {
                ${le()}
            }

            & .mcoursefields__control {
                ${Z()}
            }

            & .mcoursefields__seg {
                ${qt()}
            }

            & .mcoursefields__hint {
                ${V()}
                margin: 0;
            }

            & .mcoursefields__error {
                ${ke()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;draft=new m(Xt());nameInput=null;coordsInput=null;holeButtons=[];render(){const e={name:`${this.props.idPrefix}-name`,holes:`${this.props.idPrefix}-holes`,coordinates:`${this.props.idPrefix}-coords`},t={name:`${e.name}-error`,coordinates:`${e.coordinates}-error`},n={holes:`${e.holes}-hint`,coordinates:`${e.coordinates}-hint`},r=()=>this.props.busy?.get()??!1,o=this.wire(Nn,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:r,oninput:l=>this.patch({name:l.target.value})},nameError:{id:t.name,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},holesLabel:{id:`${e.holes}-label`},holes:{id:e.holes,"aria-labelledby":`${e.holes}-label`,"aria-describedby":n.holes},holesHint:{id:n.holes,textContent:"Changing this only changes the count — finish the new holes in the holes editor; readiness flags the gap until then.",hidden:()=>!(this.props.existing?.get()??!1)},coordsLabel:{htmlFor:e.coordinates},coordinates:{id:e.coordinates,"aria-invalid":()=>String(this.props.errors.get().coordinates!==void 0),disabled:r,oninput:l=>this.patch({coordinates:l.target.value})},coordsHint:{id:n.coordinates,textContent:`${je}. Optional; clear the field to remove the position.`},coordsError:{id:t.coordinates,textContent:()=>this.props.errors.get().coordinates??"",hidden:()=>this.props.errors.get().coordinates===void 0}});this.nameInput=this.ref(o,"name"),this.coordsInput=this.ref(o,"coordinates");const a=this.ref(o,"holes");return this.holeButtons=at.map(l=>{const h=document.createElement("button");return h.type="button",h.textContent=String(l),h.addEventListener("click",()=>this.patch({holeCount:l})),a.appendChild(h),h}),this.track(b(()=>{const l=this.draft.get().holeCount,h=r();this.holeButtons.forEach((d,u)=>{d.setAttribute("aria-pressed",String(at[u]===l)),d.disabled=h})})),this.track(b(()=>{ut(this.nameInput,this.props.errors.get().name?[t.name]:[])})),this.track(b(()=>{const l=[n.coordinates];this.props.errors.get().coordinates&&l.push(t.coordinates),ut(this.coordsInput,l)})),o}seed(e){this.draft.set({...e}),this.nameInput&&(this.nameInput.value=e.name),this.coordsInput&&(this.coordsInput.value=e.coordinates)}focusFirst(){this.nameInput?.focus()}focusInvalid(e){return e.name!==void 0&&this.nameInput?(this.nameInput.focus(),!0):e.coordinates!==void 0&&this.coordsInput?(this.coordsInput.focus(),!0):!1}patch(e){this.draft.update(t=>({...t,...e}))}}function ut(s,e){e.length===0?s.removeAttribute("aria-describedby"):s.setAttribute("aria-describedby",e.join(" "))}const pe="__new",In=E(`
    <section class="mcourses">
        <header class="mcourses__head">
            <div class="mcourses__heading">
                <h2 class="mcourses__title">Courses</h2>
                <p class="mcourses__lead">The courses rounds are played on at this club.</p>
            </div>
            <button bind="new" class="mcourses__new" type="button">New course</button>
        </header>

        <form bind="panel" class="mcourses__panel">
            <h3 bind="panelTitle" class="mcourses__panel-title"></h3>
            <div bind="fieldsHost"></div>
            <p bind="panelError" class="mcourses__error" role="alert"></p>
            <div class="mcourses__panel-actions">
                <button bind="submit" class="mcourses__submit" type="submit"></button>
                <button bind="cancel" class="mcourses__secondary" type="button">Cancel</button>
            </div>
        </form>

        <p bind="loadError" class="mcourses__error" role="alert"></p>
        <button bind="retry" class="mcourses__secondary" type="button">Try again</button>
        <p bind="deleteError" class="mcourses__error" role="alert"></p>
        <p bind="loadingNote" class="mcourses__note" role="status" aria-live="polite"></p>

        <div bind="tableHost"></div>
        <div bind="confirmHost"></div>
    </section>
`);class Tn extends C{static styles=`
        .mcourses {
            display: flex;
            flex-direction: column;
            gap: ${i("manage-stack-gap")};

            & .mcourses__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${c("md")};
            }

            & .mcourses__heading {
                display: flex;
                flex-direction: column;
                gap: ${c("xs")};
                min-width: 0;
            }

            & .mcourses__title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.35rem;
                font-weight: 600;
                color: ${i("text")};
            }

            & .mcourses__lead {
                margin: 0;
                max-width: 60ch;
                color: ${i("text-muted")};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mcourses__new {
                ${k(void 0,"primary")}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mcourses__note {
                margin: 0;
                color: ${i("text-muted")};
                font-size: 0.8rem;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mcourses__error {
                margin: 0;
                color: ${i("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mcourses__panel {
                ${W({})}
                display: flex;
                flex-direction: column;
                gap: ${i("manage-stack-gap")};
                padding: ${i("manage-page-pad")};

                &[hidden] { display: none; }
            }

            & .mcourses__panel-title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.1rem;
                font-weight: 600;
                color: ${i("text")};
            }

            & .mcourses__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${c("sm")};
            }

            & .mcourses__submit {
                ${k(void 0,"primary")}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mcourses__secondary {
                ${k()}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;

                &[hidden] { display: none; }
            }

            & .mcourses__link {
                color: ${i("text")};
                font-weight: 700;
                text-decoration: none;

                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${i("accent-strong")}; outline-offset: 2px; }
            }

            /* The readiness badge. A worded pill, never a coloured dot — colour
               is the SECOND signal here and the text carries the state on its
               own (docs/design-guidelines.md §4). */
            & .mcourses__badge {
                display: inline-block;
                padding: 2px ${c("sm")};
                border: 1px solid ${i("border")};
                border-radius: ${i("radius-pill")};
                background: ${i("surface-sunken")};
                color: ${i("text-muted")};
                font-size: 0.78rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mcourses__badge--ready {
                border-color: ${i("accent-strong")};
                color: ${i("accent-strong")};
            }

            /* Brass: a warning is DECORATIVE emphasis, not a refusal. */
            & .mcourses__badge--warn {
                border-color: ${i("accent")};
                color: ${i("accent")};
            }

            & .mcourses__badge--error {
                border-color: ${i("danger")};
                color: ${i("danger")};
            }

            & .mcourses__muted { color: ${i("text-muted")}; }
        }
    `;router=this.inject(M);courses=this.inject(de);editor=new ie;errors=new m({});deleteOpen=new m(!1);deleteTarget=new m(null);deleteFailure=new m(null);deletingId=new m(null);fields=null;actionEffects=new Map;columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>this.nameLink(e)},{key:"holes",header:"Holes",type:"numeric",cell:e=>e.holeCount},{key:"tees",header:"Tees",type:"numeric",cell:e=>e.teeCount},{key:"position",header:"Position",cell:e=>{const t=Qt(e.latitude,e.longitude);if(t!=="")return t;const n=document.createElement("span");return n.className="mcourses__muted",n.textContent="Not set",n}},{key:"readiness",header:"Readiness",cell:e=>this.badge(e)}];render(){const e=this.wire(In,{new:{disabled:()=>this.editing()||this.deletingId.get()!==null,onclick:()=>this.openCreate()},panel:{hidden:()=>!this.editing(),onsubmit:t=>{t.preventDefault(),this.submit()}},panelTitle:{textContent:()=>this.panelTitle()},panelError:{textContent:()=>this.panelError()??"",hidden:()=>this.panelError()===null},submit:{textContent:()=>this.submitLabel(),disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.closePanel()},loadError:{textContent:()=>this.courses.error.get()??"",hidden:()=>this.courses.error.get()===null},retry:{hidden:()=>this.courses.error.get()===null,onclick:()=>{this.courses.load(this.props.clubId,!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading courses…",hidden:()=>this.courses.loaded.get()}});return this.fields=this.spawn(Sn,this.ref(e,"fieldsHost"),{idPrefix:"manage-course",errors:this.errors,busy:{get:()=>this.saving()},existing:{get:()=>this.editing()&&!this.creating()}}),this.spawn(J,this.ref(e,"tableHost"),{columns:this.columns,rows:this.courses.rows,rowKey:t=>t.id,caption:"Courses",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Course actions",empty:{heading:"No courses yet",body:"Add the club’s first course, then set its holes and tees.",action:{label:"New course",onclick:()=>this.openCreate()}}}),this.spawn(Y,this.ref(e,"confirmHost"),Ne({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this course?"},consequence:()=>{const t=this.deleteTarget.get();return t?kn(t.name):Cn},confirmLabel:"Delete course",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(Se(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.courses.load(this.props.clubId);const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.editing()||this.saving()||this.closePanel())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}editing(){return this.editor.key.get()!==null}creating(){return this.editor.key.get()===pe}saving(){const e=this.editor.key.get();return e!==null&&this.editor.isSaving(e)}panelTitle(){if(this.creating())return"New course";const e=this.openCourse();return e?`Edit ${e.name}`:"Edit course"}submitLabel(){return this.creating()?this.saving()?"Creating…":"Create course":this.saving()?"Saving…":"Save course"}panelError(){const e=this.editor.key.get();return e===null?null:this.editor.errorFor(e)}openCourse(){const e=this.editor.key.get();return e===null||e===pe?null:this.courses.rows.get().find(t=>t.id===e)??null}openCreate(){this.saving()||(this.errors.set({}),this.editor.begin(pe),this.fields?.seed(Xt()),this.fields?.focusFirst())}openEdit(e){this.saving()||(this.errors.set({}),this.editor.begin(e.id),this.fields?.seed(vn(e)),this.fields?.focusFirst())}closePanel(){this.editor.cancel(),this.errors.set({})}async submit(){if(!this.fields||this.saving())return;const e=this.editor.key.get();if(e===null)return;const t=this.fields.draft.get(),n=$n(t);if(this.errors.set(n),xn(n)){this.fields.focusInvalid(n);return}await this.editor.commit(()=>e===pe?this.courses.create(this.props.clubId,t):this.courses.update(e,t))}nameLink(e){const t=bn(this.props.clubId,e.id),n=document.createElement("a");return n.className="mcourses__link",n.href=X+t,n.textContent=e.name,n.addEventListener("click",r=>{r.metaKey||r.ctrlKey||r.shiftKey||r.button!==0||(r.preventDefault(),this.router.navigate(t))}),n}badge(e){const t=document.createElement("span");return t.className=`mcourses__badge mcourses__badge--${es(e.readiness)}`,t.textContent=Zt(e.readiness),t}rowActions(e){const t=P("Edit",{onclick:()=>this.openEdit(e)}),n=P("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,b(()=>{const r=this.deletingId.get(),o=r!==null||this.editing();n.textContent=r===e.id?"Deleting…":"Delete",n.disabled=o,t.disabled=o})),[t,n]}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.courses.remove(e.id);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}const Ln=E(`
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

            <!-- The club's courses (spec §3.3 + §3.3a). A component taking the
                 club id as a prop, spawned below; it publishes no breadcrumb of
                 its own, because the trail this page sets is already its. -->
            <div bind="coursesHost" class="mclub__courses"></div>
        </div>

        <div bind="confirmHost"></div>
    </section>
`);class An extends C{static styles=`
        .mclub {
            display: flex;
            flex-direction: column;
            gap: ${i("manage-stack-gap")};

            & .mclub__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${c("md")};
            }

            & .mclub__heading {
                display: flex;
                flex-direction: column;
                gap: ${c("xs")};
                min-width: 0;
            }

            & .mclub__title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${i("text")};
            }

            & .mclub__lead {
                margin: 0;
                max-width: 60ch;
                color: ${i("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mclub__note {
                margin: 0;
                color: ${i("text-muted")};
                font-size: 0.8rem;

                &[hidden] { display: none; }
            }

            & .mclub__error {
                margin: 0;
                color: ${i("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclub__missing,
            & .mclub__body {
                display: flex;
                flex-direction: column;
                gap: ${i("manage-stack-gap")};

                &[hidden] { display: none; }
            }

            & .mclub__panel {
                ${W({})}
                display: flex;
                flex-direction: column;
                gap: ${i("manage-stack-gap")};
                padding: ${i("manage-page-pad")};
            }

            & .mclub__panel-head {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${c("sm")};
            }

            & .mclub__panel-title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.15rem;
                font-weight: 600;
                color: ${i("text")};
            }

            & .mclub__facts {
                display: flex;
                flex-direction: column;
                gap: ${i("manage-stack-gap")};
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
                font-family: ${i("font-ui")};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${i("text-muted")};
            }

            & .mclub__fact-value {
                margin: 0;
                color: ${i("text")};
                font-size: 0.95rem;
                line-height: 1.5;
                overflow-wrap: anywhere;
            }

            & .mclub__form {
                display: flex;
                flex-direction: column;
                gap: ${i("manage-stack-gap")};

                &[hidden] { display: none; }
            }

            & .mclub__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${c("sm")};
            }

            & .mclub__primary {
                ${k(void 0,"primary")}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mclub__secondary {
                ${k()}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
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
                ${k(void 0,"danger")}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mclub__courses:empty { display: none; }
        }
    `;router=this.inject(M);crumbs=this.inject(oe);clubs=this.inject(Ie);params=this.router.params(pn);editor=new ie;errors=new m({});deleteOpen=new m(!1);deleteFailure=new m(null);deleting=new m(!1);fields=null;render(){const e=this.wire(Ln,{loadingNote:{textContent:"Loading club…",hidden:()=>this.clubs.loaded.get()},loadError:{textContent:()=>this.clubs.error.get()??"",hidden:()=>this.clubs.error.get()===null},retry:{hidden:()=>this.clubs.error.get()===null,onclick:()=>{this.clubs.load(!0)}},missing:{hidden:()=>!this.clubs.loaded.get()||this.clubs.error.get()!==null||this.club()!==null},backMissing:{onclick:()=>this.router.navigate(z)},body:{hidden:()=>this.club()===null},title:()=>this.club()?.name??"",subtitle:()=>this.courseSummary(),remove:{textContent:()=>this.deleting.get()?"Deleting…":"Delete club",disabled:()=>this.editing()||this.deleting.get(),onclick:()=>{this.deleteFailure.set(null),this.deleteOpen.set(!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},edit:{hidden:()=>this.editing(),disabled:()=>this.deleting.get(),onclick:()=>this.beginEdit()},facts:{hidden:()=>this.editing()},factName:()=>this.club()?.name??"",factLocation:()=>this.club()?.location??"Not recorded",factLogo:()=>this.club()?.logoUrl??"Not recorded",form:{hidden:()=>!this.editing(),onsubmit:n=>{n.preventDefault(),this.save()}},saveError:{textContent:()=>this.editor.errorFor(this.clubId())??"",hidden:()=>this.editor.errorFor(this.clubId())===null},save:{textContent:()=>this.saving()?"Saving…":"Save",disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.cancelEdit()}});this.fields=this.spawn(Vt,this.ref(e,"fieldsHost"),{idPrefix:"manage-club-edit",errors:this.errors,busy:{get:()=>this.saving()}});const t=this.clubId();return t!==""&&this.spawn(Tn,this.ref(e,"coursesHost"),{clubId:t}),this.spawn(Y,this.ref(e,"confirmHost"),Ne({open:this.deleteOpen,title:()=>{const n=this.club();return n?`Delete ${n.name}?`:"Delete this club?"},consequence:()=>this.deleteConsequence(),confirmLabel:"Delete club",onconfirm:()=>{this.remove()}})),this.track(Se(this.deleteOpen)),e}onMount(){this.clubs.load(),this.track(b(()=>{const e=this.club();this.crumbs.set([{label:"Clubs",path:z},{label:e?.name??"Club"}])})),this.clubId()===""&&this.router.navigate(z,!0)}clubId(){return this.params.get().id}club(){const e=this.clubId();return e===""?null:this.clubs.byId(e)}editing(){return this.editor.isEditing(this.clubId())}saving(){return this.editor.isSaving(this.clubId())}courseSummary(){const e=this.club();return e?e.courseCount===0?"No courses yet.":e.courseCount===1?"1 course.":`${e.courseCount} courses.`:""}beginEdit(){const e=this.club();e&&(this.errors.set({}),this.editor.begin(e.id),this.fields?.seed(hn(e)),this.fields?.focusFirst())}cancelEdit(){this.editor.cancel(),this.errors.set({})}save(){const e=this.club();if(!e||!this.fields||this.saving())return;const t=this.fields.draft.get(),n=Wt(t);if(this.errors.set(n),Gt(n)){this.fields.focusInvalid(n);return}this.editor.commit(()=>this.clubs.update(e.id,t))}deleteConsequence(){const e=this.club();return e?Kt(e.name,e.courseCount):Yt}async remove(){const e=this.club();if(!(!e||this.deleting.get())){this.deleteFailure.set(null),this.deleting.set(!0);try{const t=await this.clubs.remove(e.id);if(!t.ok){this.deleteFailure.set(t.message);return}this.router.navigate(z,!0)}finally{this.deleting.set(!1)}}}}function On(s){return{par:String(s.par),strokeIndex:String(s.strokeIndex)}}function Ue(){return{par:"",strokeIndex:""}}function ts(s,e){const t=gt(s.par);if(t===null||t<1)return{ok:!1,message:"Par is a whole number of strokes — 3, 4 or 5 on nearly every hole. Enter one and save again."};const n=gt(s.strokeIndex);return n===null||n<1||n>e?{ok:!1,message:`Stroke index runs from 1 to ${e}, one number per hole. Enter one in that range and save again.`}:{ok:!0,par:t,strokeIndex:n}}function zn(s,e){const t=s.filter(l=>l.holeNumber>=1&&l.holeNumber<=e),n=(l,h)=>t.filter(d=>d.holeNumber>=l&&d.holeNumber<=h),r=(l,h)=>n(l,h).reduce((d,u)=>d+u.par,0),o=(l,h)=>n(l,h).length===0?null:r(l,h),a=e>9;return{front:a?o(1,9):null,back:a?o(10,e):null,split:a,total:r(1,e),counted:t.length,expected:e,extra:s.length-t.length}}function mt(s){return s===null?"—":String(s)}function ft(s){const e=[],t=s.expected-s.counted;return t>0&&e.push(`Counted over the ${s.counted} ${pt(s.counted)} that have values — ${t} of the course’s ${s.expected} ${pt(s.expected)} ${t===1?"has":"have"} no row yet.`),s.extra>0&&e.push(`${ye(G(s.extra,"hole row","hole rows"))} sit beyond hole ${s.expected} and ${s.extra===1?"is":"are"} not counted.`),e.length>0?e.join(" "):null}function qe(s,e){const t=new Set(s.map(r=>r.holeNumber)),n=[];for(let r=1;r<=e;r+=1)t.has(r)||n.push(r);return n}function ss(s,e){const t=new Set(s.map(r=>r.strokeIndex)),n=[];for(let r=1;r<=e;r+=1)t.has(r)||n.push(r);return n}function Hn(s,e,t){const n=s.filter(l=>l.holeNumber<1||l.holeNumber>t);if(n.length>0)return{ok:!1,message:`This course also has ${G(n.length,"hole row","hole rows")} beyond hole ${t}. Set the hole count to match the course on the club page first — adding holes cannot resolve that.`};const r=[...s];for(const l of qe(s,t)){const h=e.get(l)??Ue(),d=ts(h,t);if(!d.ok)return{ok:!1,message:`Hole ${l}: ${jn(d.message)}`};r.push({holeNumber:l,par:d.par,strokeIndex:d.strokeIndex})}const o=Dn(r);if(o){const h=s.some(d=>d.holeNumber===o.holes[0])&&s.some(d=>d.holeNumber===o.holes[1])?"Change one of them in the grid above first.":"Give the new hole one of the free numbers.";return{ok:!1,message:`Holes ${o.holes[0]} and ${o.holes[1]} would both have stroke index ${o.strokeIndex}. Every hole needs its own number from 1 to ${t}. ${h}`}}const a=ss(r,t);return a.length>0?{ok:!1,message:`Stroke ${a.length===1?"index":"indices"} ${Mn(a)} would be left unused. Every number from 1 to ${t} has to appear exactly once.`}:{ok:!0,holes:[...r].sort((l,h)=>l.holeNumber-h.holeNumber)}}function Dn(s){const e=new Map;for(const t of[...s].sort((n,r)=>n.holeNumber-r.holeNumber)){const n=e.get(t.strokeIndex);if(n!==void 0)return{strokeIndex:t.strokeIndex,holes:[n,t.holeNumber]};e.set(t.strokeIndex,t.holeNumber)}return null}function Rn(s,e){return s.issues.map((t,n)=>({key:`${n}:${t.code}:${t.message}`,severity:t.severity,severityLabel:t.severity==="error"?"Problem":"Warning",explanation:Pn(t.code,e),detail:t.message}))}function Pn(s,e){switch(s){case"missing_holes":return"These holes have no par or stroke index yet, so the course is not complete. Add them below.";case"unexpected_holes":return`The course is set to ${e} holes, but rows exist past that. Change the hole count on the club page if the course really has them.`;case"duplicate_stroke_index":return"Two holes share a stroke index. Handicap strokes are handed out in stroke-index order, so each hole needs its own number.";case"missing_stroke_indices":return`Some numbers between 1 and ${e} are not assigned to any hole. Every one of them has to appear exactly once.`;case"stroke_index_out_of_range":return`A stroke index outside 1 to ${e} cannot be resolved when a round hands out strokes.`;case"unusual_par":return"A par outside 3 to 6 is unusual, not wrong. It saves as it is — worth a second look.";default:return"The course check reported this."}}function Fn(s,e,t){if(s.status==="checking")return"Checking the course…";if(s.status==="unknown"||e===null)return"The course check did not run, so nothing here is confirmed. It runs again after the next save.";const n=e.issues.filter(o=>o.severity==="error").length,r=e.issues.length-n;return n===0&&r===0?`Nothing to fix — every hole has a par, and the stroke indices run 1 to ${t}, once each.`:n===0?`${ye(G(r,"warning","warnings"))}, nothing that blocks play.`:r===0?`${ye(G(n,"problem","problems"))} to fix.`:`${ye(G(n,"problem","problems"))} to fix, and ${G(r,"warning","warnings")}.`}function G(s,e,t){return`${s} ${s===1?e:t}`}function pt(s){return s===1?"hole":"holes"}function Mn(s){return s.length<=2?s.join(" and "):`${s.slice(0,-1).join(", ")} and ${s[s.length-1]}`}function ye(s){return s.charAt(0).toUpperCase()+s.slice(1)}function jn(s){return s.charAt(0).toLowerCase()+s.slice(1)}function gt(s){const e=s.trim();if(!/^\d+$/.test(e))return null;const t=Number(e);return Number.isSafeInteger(t)?t:null}const ee="__fill";function bt(s,e){return`Hole ${s.holeNumber} — ${e}`}const Un=E(`
    <section class="mholes">
        <header class="mholes__heading">
            <h2 class="mholes__title">Holes</h2>
            <p class="mholes__lead">Par and stroke index, one hole per row. Stroke index 1 is the hardest hole — it is where the first handicap stroke falls.</p>
        </header>

        <dl class="mholes__summary">
            <div bind="frontItem" class="mholes__fact">
                <dt class="mholes__fact-key">Front nine</dt>
                <dd bind="frontPar" class="mholes__fact-value"></dd>
            </div>
            <div bind="backItem" class="mholes__fact">
                <dt class="mholes__fact-key">Back nine</dt>
                <dd bind="backPar" class="mholes__fact-value"></dd>
            </div>
            <div class="mholes__fact">
                <dt class="mholes__fact-key">Total par</dt>
                <dd bind="totalPar" class="mholes__fact-value"></dd>
            </div>
        </dl>
        <p bind="summaryNote" class="mholes__note"></p>

        <div bind="tableHost"></div>
        <div bind="rowStatus" class="mholes__row-status"></div>

        <section class="mholes__panel">
            <div class="mholes__panel-head">
                <h3 class="mholes__panel-title">Course check</h3>
                <span bind="checkBadge" class="mholes__badge"></span>
            </div>
            <p bind="checkStatus" class="mholes__note" role="status" aria-live="polite"></p>
            <ul bind="issues" class="mholes__issues"></ul>
        </section>

        <section bind="fill" class="mholes__panel">
            <h3 class="mholes__panel-title">Holes with no values yet</h3>
            <p bind="fillLead" class="mholes__lead"></p>
            <button bind="fillOpen" class="mholes__secondary" type="button">Add these holes</button>

            <form bind="fillForm" class="mholes__fill">
                <p bind="fillFree" class="mholes__note"></p>
                <div bind="fillRows" class="mholes__fill-rows"></div>
                <p bind="fillError" class="mholes__error" role="alert"></p>
                <div class="mholes__panel-actions">
                    <button bind="fillSave" class="mholes__primary" type="submit"></button>
                    <button bind="fillCancel" class="mholes__secondary" type="button">Cancel</button>
                </div>
            </form>
        </section>
    </section>
`);class qn extends C{static styles=`
        .mholes {
            display: flex;
            flex-direction: column;
            gap: ${i("manage-stack-gap")};

            & .mholes__heading {
                display: flex;
                flex-direction: column;
                gap: ${c("xs")};
                min-width: 0;
            }

            & .mholes__title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.35rem;
                font-weight: 600;
                color: ${i("text")};
            }

            & .mholes__lead {
                margin: 0;
                max-width: 60ch;
                color: ${i("text-muted")};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mholes__note {
                margin: 0;
                max-width: 70ch;
                color: ${i("text-muted")};
                font-size: 0.85rem;
                line-height: 1.45;

                &[hidden] { display: none; }
            }

            & .mholes__error {
                margin: 0;
                max-width: 70ch;
                color: ${i("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.45;

                &[hidden] { display: none; }
            }

            /* Where the grid's row status lines land — see statusHost in
               manage/ui/table.component.ts.

               This grid is the stacked:false exception: it keeps real
               columns at 375px and scrolls them sideways inside the table's own
               box. Left in the action cell, a refused save renders in a column
               that starts past that box's right edge, and Enter-to-save does
               not scroll — so the one sentence saying WHY the save was refused
               arrives as a stack of letter fragments. Out here it is full
               width at every size, and no horizontal scroll can reach it.

               It sits BELOW the grid, so a message appearing pushes the panels
               down rather than moving the row under the finger that just
               pressed Save. Every row parks its (hidden) status line here; at
               most one is ever visible, because one editor is open at a time.

               Sticky, because eighteen rows are taller than a phone: a message
               anchored under the last row is one a user editing hole 3 would
               have to go looking for. Stuck to the bottom edge it is on screen
               for the whole length of the grid, and it settles into its own
               place in the flow once the end of the grid is reached. */
            & .mholes__row-status {
                display: flex;
                flex-direction: column;
                max-width: 70ch;
                position: sticky;
                bottom: 0;
                z-index: 1;

                /* Only a VISIBLE message earns the bar. An empty container has
                   to stay invisible, or it would draw a rule across the page
                   at all times. */
                &:has(> .mtable__status:not([hidden])) {
                    background: ${i("surface")};
                    border-top: 1px solid ${i("manage-table-border")};
                    padding: ${c("sm")} 0;
                }

                & .mtable__status { text-align: left; margin: 0; }
            }

            /* The par figures. A definition list rather than three bare
               numbers: each figure says what it is beside the number, which is
               the difference between "36" and "Front nine 36". */
            & .mholes__summary {
                display: flex;
                flex-wrap: wrap;
                gap: ${c("lg")};
                margin: 0;
            }

            & .mholes__fact {
                display: flex;
                flex-direction: column;
                gap: 2px;

                &[hidden] { display: none; }
            }

            & .mholes__fact-key {
                font-family: ${i("font-ui")};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${i("text-muted")};
            }

            & .mholes__fact-value {
                margin: 0;
                font-size: 1.15rem;
                font-weight: 700;
                font-variant-numeric: tabular-nums;
                color: ${i("text")};
            }

            /* The per-cell editors. Sized to two digits so the grid stays
               narrow, with the Manage touch floor kept — density here comes
               from spacing, never from smaller hit areas (spec §2.5). */
            & .mholes__input {
                ${Z()}
                width: 5rem;
                text-align: right;
                font-variant-numeric: tabular-nums;
            }

            & .mholes__panel {
                ${W({})}
                display: flex;
                flex-direction: column;
                gap: ${i("manage-stack-gap")};
                padding: ${i("manage-page-pad")};
                align-items: flex-start;

                &[hidden] { display: none; }
            }

            & .mholes__panel-head {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: ${c("sm")};
            }

            & .mholes__panel-title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.1rem;
                font-weight: 600;
                color: ${i("text")};
            }

            & .mholes__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${c("sm")};
            }

            /* Same worded pill as the club page's readiness column, so the two
               readings of one answer look like one answer. */
            & .mholes__badge {
                display: inline-block;
                padding: 2px ${c("sm")};
                border: 1px solid ${i("border")};
                border-radius: ${i("radius-pill")};
                background: ${i("surface-sunken")};
                color: ${i("text-muted")};
                font-size: 0.78rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mholes__badge--ready {
                border-color: ${i("accent-strong")};
                color: ${i("accent-strong")};
            }

            & .mholes__badge--warn {
                border-color: ${i("accent")};
                color: ${i("accent")};
            }

            & .mholes__badge--error {
                border-color: ${i("danger")};
                color: ${i("danger")};
            }

            & .mholes__issues {
                display: flex;
                flex-direction: column;
                gap: ${c("sm")};
                margin: 0;
                padding: 0;
                list-style: none;

                &:empty { display: none; }
            }

            & .mholes__issue {
                display: flex;
                flex-direction: column;
                gap: 2px;
                max-width: 70ch;
                padding-left: ${c("md")};
                border-left: 3px solid ${i("border")};
            }

            & .mholes__issue--error { border-left-color: ${i("danger")}; }
            & .mholes__issue--warning { border-left-color: ${i("accent")}; }

            & .mholes__issue-severity {
                font-family: ${i("font-ui")};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${i("text-muted")};
            }

            & .mholes__issue--error .mholes__issue-severity { color: ${i("danger")}; }

            & .mholes__issue-text {
                margin: 0;
                color: ${i("text")};
                font-size: 0.9rem;
                line-height: 1.45;
            }

            & .mholes__issue-detail {
                margin: 0;
                color: ${i("text-muted")};
                font-size: 0.85rem;
                line-height: 1.45;
            }

            & .mholes__fill {
                display: flex;
                flex-direction: column;
                gap: ${i("manage-stack-gap")};
                width: 100%;

                &[hidden] { display: none; }
            }

            & .mholes__fill-rows {
                display: flex;
                flex-direction: column;
                gap: ${i("manage-stack-gap")};
            }

            & .mholes__fill-row {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-end;
                gap: ${c("md")};
            }

            & .mholes__fill-hole {
                min-width: 5rem;
                font-family: ${i("font-ui")};
                font-size: 0.95rem;
                font-weight: 700;
                color: ${i("text")};
                /* Aligns with the controls beside it rather than with their
                   labels. */
                padding-bottom: 0.6rem;
            }

            & .mholes__field {
                ${ae()}
            }

            & .mholes__field-label {
                ${le()}
            }

            & .mholes__primary {
                ${k(void 0,"primary")}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mholes__secondary {
                ${k()}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }
        }
    `;courses=this.inject(de);editor=new ie;draft=Ue();fillEditor=new ie;fillDrafts=new Map;fillHost=null;actionEffects=new Map;columns=[{key:"hole",header:"Hole",type:"numeric",stackedLabel:!1,cell:e=>e.holeNumber},{key:"par",header:"Par",type:"numeric",cell:e=>e.par,editCell:e=>this.numberInput({label:`Par, hole ${e.holeNumber}`,value:this.draft.par,oninput:t=>{this.draft.par=t}})},{key:"strokeIndex",header:"Stroke index",type:"numeric",cell:e=>e.strokeIndex,editCell:e=>this.numberInput({label:`Stroke index, hole ${e.holeNumber}`,value:this.draft.strokeIndex,oninput:t=>{this.draft.strokeIndex=t}})}];render(){const e=this.wire(Un,{frontItem:{hidden:()=>!this.summary().split},frontPar:{textContent:()=>mt(this.summary().front)},backItem:{hidden:()=>!this.summary().split},backPar:{textContent:()=>mt(this.summary().back)},totalPar:{textContent:()=>String(this.summary().total)},summaryNote:{textContent:()=>ft(this.summary())??"",hidden:()=>ft(this.summary())===null},checkBadge:{textContent:()=>Zt(this.readiness()),className:()=>`mholes__badge mholes__badge--${es(this.readiness())}`},checkStatus:{textContent:()=>Fn(this.readiness(),this.validation(),this.holeCount())},fill:{hidden:()=>this.missing().length===0},fillLead:{textContent:()=>this.fillLead()},fillOpen:{hidden:()=>this.filling(),disabled:()=>this.busy(),onclick:()=>this.openFill()},fillForm:{hidden:()=>!this.filling(),onsubmit:n=>{n.preventDefault(),this.saveFill()}},fillFree:{textContent:()=>this.freeNote()},fillError:{textContent:()=>this.fillEditor.errorFor(ee)??"",hidden:()=>this.fillEditor.errorFor(ee)===null},fillSave:{textContent:()=>this.fillSaving()?"Adding…":"Add holes",disabled:()=>this.busy()},fillCancel:{disabled:()=>this.fillSaving(),onclick:()=>this.closeFill()}}),t=new R(()=>[...this.course()?.holes??[]].sort((n,r)=>n.holeNumber-r.holeNumber));return this.spawn(J,this.ref(e,"tableHost"),{columns:this.columns,rows:t,rowKey:n=>String(n.holeNumber),caption:"Holes",captionHidden:!0,stacked:!1,actions:n=>this.rowActions(n),actionsHeader:"Hole actions",empty:{heading:"No holes yet",body:"This course has no hole rows. Add them below, one par and one stroke index per hole."},edit:{controller:this.editor,oncommit:n=>{this.saveRow(n)},saveLabel:"Save",savingLabel:"Saving…",statusHost:this.ref(e,"rowStatus")}}),this.fillHost=this.ref(e,"fillRows"),this.$each(this.ref(e,"issues"),()=>this.issues(),n=>this.issueItem(n),n=>n.key),this.track(()=>{for(const n of this.actionEffects.values())n();this.actionEffects.clear()}),e}course(){return this.courses.byId(this.props.courseId)}holeCount(){return this.course()?.holeCount??0}summary(){return zn(this.course()?.holes??[],this.holeCount())}readiness(){return this.courses.readiness.get()[this.props.courseId]??{status:"checking"}}validation(){return this.courses.validations.get()[this.props.courseId]??null}issues(){const e=this.validation();return e?Rn(e,this.holeCount()):[]}missing(){return qe(this.course()?.holes??[],this.holeCount())}rowActions(e){const t=String(e.holeNumber),n=P("Edit",{onclick:()=>{this.draft=On(e),this.editor.begin(t)}});return this.actionEffects.get(t)?.(),this.actionEffects.set(t,b(()=>{n.disabled=this.editor.key.get()!==null||this.busy()})),n}async saveRow(e){const t=this.course();if(!t)return;if(this.fillSaving()){this.editor.fail("The missing holes are still being added. Wait for that to finish, then save this hole again.");return}const n=ts(this.draft,t.holeCount);if(!n.ok){this.editor.fail(bt(e,n.message));return}await this.editor.commit(async()=>{const r=await this.courses.saveHole(t.id,e.holeNumber,{par:n.par,strokeIndex:n.strokeIndex});return r.ok?r:{ok:!1,message:bt(e,r.message)}})}issueItem(e){const t=document.createElement("li");t.className=`mholes__issue mholes__issue--${e.severity}`;const n=document.createElement("span");n.className="mholes__issue-severity",n.textContent=e.severityLabel;const r=document.createElement("p");r.className="mholes__issue-text",r.textContent=e.explanation;const o=document.createElement("p");return o.className="mholes__issue-detail",o.textContent=e.detail,t.append(n,r,o),t}filling(){return this.fillEditor.key.get()===ee}fillSaving(){return this.fillEditor.isSaving(ee)}busy(){return this.editor.phase.get()==="saving"||this.fillSaving()}fillLead(){const e=this.missing();return e.length===0?"":`${e.length===1?"Hole":"Holes"} ${_t(e)} ${e.length===1?"has":"have"} no row on this course, so the course is incomplete until ${e.length===1?"it is":"they are"} filled in. Enter the real par and stroke index for each — nothing is guessed for you, because an invented par ends up on somebody’s scorecard.`}freeNote(){const e=ss(this.course()?.holes??[],this.holeCount());return e.length===0?"":`Stroke ${e.length===1?"index":"indices"} still free: ${_t(e)}. Each of them has to end up on exactly one hole.`}openFill(){const e=this.course(),t=this.fillHost;if(!(!e||!t||this.busy())){this.fillDrafts.clear(),t.textContent="";for(const n of qe(e.holes,e.holeCount)){const r=Ue();this.fillDrafts.set(n,r),t.appendChild(this.fillRow(n,r))}this.fillEditor.begin(ee),t.querySelector("input")?.focus()}}fillRow(e,t){const n=document.createElement("div");n.className="mholes__fill-row";const r=document.createElement("span");return r.className="mholes__fill-hole",r.textContent=`Hole ${e}`,n.appendChild(r),n.appendChild(this.fillField(`manage-hole-${e}-par`,"Par",t.par,o=>{t.par=o})),n.appendChild(this.fillField(`manage-hole-${e}-si`,"Stroke index",t.strokeIndex,o=>{t.strokeIndex=o})),n}fillField(e,t,n,r){const o=document.createElement("div");o.className="mholes__field";const a=document.createElement("label");a.className="mholes__field-label",a.htmlFor=e,a.textContent=t;const l=this.numberInput({label:t,value:n,oninput:r});return l.id=e,l.removeAttribute("aria-label"),o.append(a,l),o}closeFill(){this.fillEditor.cancel(),this.fillEditor.key.get()===null&&(this.fillDrafts.clear(),this.fillHost&&(this.fillHost.textContent=""))}async saveFill(){const e=this.course();if(!e||this.fillSaving())return;if(this.editor.phase.peek()==="saving"){this.fillEditor.fail("A hole is still saving. Wait for it to finish, then add these holes again.");return}const t=Hn(e.holes,this.fillDrafts,e.holeCount);if(!t.ok){this.fillEditor.fail(t.message);return}await this.fillEditor.commit(()=>this.courses.saveHoles(e.id,t.holes))&&(this.fillDrafts.clear(),this.fillHost&&(this.fillHost.textContent=""))}numberInput(e){const t=document.createElement("input");return t.type="text",t.inputMode="numeric",t.autocomplete="off",t.className="mholes__input",t.value=e.value,t.setAttribute("aria-label",e.label),t.addEventListener("input",()=>e.oninput(t.value)),t}}function _t(s){return s.length<=2?s.join(" and "):`${s.slice(0,-1).join(", ")} and ${s[s.length-1]}`}const B=["M","F"];function H(s){return s==="M"?"Men":"Women"}const Bn=["Vit","Gul","Blå","Röd","Orange","Svart","White","Yellow","Blue","Red","Black"],Wn="The colour this tee is known by — Gul, Blå, Röd. A hex value like #ffd400 also works";function ns(s){return{name:"",colour:"",lengths:rs(s),ratings:{M:Be(),F:Be()}}}function Gn(s,e){const t=new Map(s.holeLengths.map(n=>[n.holeNumber,n]));return{name:s.name,colour:s.colour??"",lengths:rs(e).map(n=>{const r=t.get(n.holeNumber);return r?{holeNumber:n.holeNumber,lengthM:K(r.lengthM),strokeIndexOverride:r.strokeIndexOverride===null?"":K(r.strokeIndexOverride)}:n}),ratings:{M:yt(s,"M"),F:yt(s,"F")}}}function yt(s,e){const t=s.ratings.find(n=>n.gender===e);return t?{rated:!0,courseRating:K(t.courseRating),slope:K(t.slope),par:K(t.par),totalLengthM:K(t.totalLengthM)}:Be()}function Be(){return{rated:!1,courseRating:"",slope:"",par:"",totalLengthM:""}}function rs(s){return Array.from({length:Math.max(s,0)},(e,t)=>({holeNumber:t+1,lengthM:"",strokeIndexOverride:""}))}function Kn(s,e){const t={};s.name.trim()===""&&(t.name="A tee needs a name. Enter one before saving.");const n=[];let r=null;for(const a of s.lengths){const l=a.lengthM.trim();if(l!==""&&as(l)===null){n.push(a.holeNumber),r??=`Hole ${a.holeNumber}: a length is metres as a number, e.g. 342. Leave it blank if the hole is not measured from this tee.`;continue}const h=a.strokeIndexOverride.trim();h!==""&&!ir(h,e)&&(n.push(a.holeNumber),r??=`Hole ${a.holeNumber}: a stroke-index override is a whole number from 1 to ${e}. Leave it blank to use the course's own stroke index.`)}r!==null&&(t.lengths=r,t.badHoles=n);const o={};for(const a of B){const l=Yn(s.ratings[a],a);l!==null&&(o[a]=l)}return Object.keys(o).length>0&&(t.ratings=o),t}function Yn(s,e){if(!s.rated)return null;const t=U.filter(r=>s[r.key].trim()==="").map(r=>r.label);if(t.length>0)return`${H(e)}: fill in ${or(t)}, or set this tee to not rated for ${H(e).toLowerCase()}.`;const n=U.filter(r=>r.whole?!rr(s[r.key].trim()):nr(s[r.key].trim())===null);if(n.length>0){const r=n[0];return r.whole?`${H(e)}: ${r.label.toLowerCase()} is a whole number, e.g. ${r.example}.`:`${H(e)}: ${r.label.toLowerCase()} is a number, e.g. ${r.example}. Use a dot for decimals.`}return null}const U=[{key:"courseRating",label:"Course rating",whole:!1,example:"71.4"},{key:"slope",label:"Slope",whole:!0,example:"132"},{key:"par",label:"Par",whole:!0,example:"72"},{key:"totalLengthM",label:"Total length (m)",whole:!0,example:"5812"}];function Vn(s){return Object.keys(s).length>0}function wt(s){const e=[];for(const r of s.lengths){const o=as(r.lengthM.trim());if(o===null)continue;const a=r.strokeIndexOverride.trim();e.push({holeNumber:r.holeNumber,lengthM:o,strokeIndexOverride:a===""?null:Number(a)})}const t=[];for(const r of B){const o=s.ratings[r];o.rated&&t.push({gender:r,courseRating:Number(o.courseRating.trim()),slope:Number(o.slope.trim()),par:Number(o.par.trim()),totalLengthM:Number(o.totalLengthM.trim())})}const n=s.colour.trim();return{name:s.name.trim(),colour:n===""?null:n,holeLengths:e,ratings:t}}function Xn(s){const e=B.filter(t=>s.ratings.some(n=>n.gender===t));return e.length===0?"Not rated":e.map(H).join(", ")}function Qn(s){const e=B.map(n=>({gender:n,rating:s.ratings.find(r=>r.gender===n)})).filter(n=>n.rating!==void 0&&n.rating.totalLengthM>0);if(e.length>0)return e.map(n=>`${H(n.gender)} ${re(n.rating.totalLengthM)}`).join(", ");const t=s.holeLengths.reduce((n,r)=>n+r.lengthM,0);return t>0?`${re(t)} measured`:""}function Jn(s){return s.holeLengths.length}function re(s){return`${Math.round(s)} m`}function is(s){if(s===null)return null;const e=s.trim();return/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(e)?e:os[e.toLocaleLowerCase("sv-SE")]??null}function Zn(s){const e=s.trim(),t=er(e);return(t===null?null:We.get(t))??e}function er(s){if(!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s))return null;const e=s.slice(1).toLowerCase();return`#${e.length===3?[...e].map(t=>t+t).join(""):e}`}const We=new Map,os={vit:"#f5f5f5",white:"#f5f5f5",gul:"#ffd400",yellow:"#ffd400",blå:"#2a6fd4",bla:"#2a6fd4",blue:"#2a6fd4",röd:"#d4332a",rod:"#d4332a",red:"#d4332a",orange:"#e8830c",svart:"#1c1c1c",black:"#1c1c1c",grön:"#2f8f4e",green:"#2f8f4e",guld:"#c8a44a",gold:"#c8a44a"};for(const[s,e]of Object.entries(os))We.has(e)||We.set(e,s.charAt(0).toUpperCase()+s.slice(1));function tr(s){return`${s} leaves this course, and its hole lengths and ratings go with it. Rounds already played keep their own copy of the tee, so no scorecard changes.`}const sr="The tee is removed from this course, along with its hole lengths and ratings.";function as(s){if(!/^\d+(\.\d+)?$/.test(s))return null;const e=Number(s);return Number.isFinite(e)&&e>0?e:null}function nr(s){if(!/^\d+(\.\d+)?$/.test(s))return null;const e=Number(s);return Number.isFinite(e)?e:null}function rr(s){return/^\d+$/.test(s)}function ir(s,e){if(!/^\d+$/.test(s))return!1;const t=Number(s);return t>=1&&t<=e}function K(s){return String(Number(s.toFixed(3)))}function or(s){const e=s.map(t=>t.toLowerCase());return e.length===1?e[0]:`${e.slice(0,-1).join(", ")} and ${e[e.length-1]}`}class ar{courseId=new m(null);tees=new m([]);loading=new m(!1);error=new m(null);loaded=new m(!1);courses=F.get(de);inflight=null;load(e,t=!1){return this.courseId.get()!==e&&(this.courseId.set(e),this.tees.set([]),this.loaded.set(!1),this.inflight=null),!t&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{const n=await S.tees.listByCourse({courseId:e});if(this.courseId.get()!==e)return;this.tees.set(n)}catch(n){this.error.set(q(n,"Could not load the tees. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.tees.get().find(t=>t.id===e)??null}async create(e,t,n){const{name:r,colour:o,holeLengths:a,ratings:l}=wt(n);return this.write(()=>S.tees.create({courseId:e,name:r,colour:o,holeLengths:a,ratings:l}),"Could not create the tee. Check your connection and try again.",t)}async update(e,t){const{name:n,colour:r,holeLengths:o,ratings:a}=wt(t);return this.write(()=>S.tees.update({id:e,name:n,colour:r,holeLengths:o,ratings:a}),"Could not save the tee. Check your connection and try again.",null)}async remove(e,t){return this.write(()=>S.tees.remove({id:e}),"Could not delete the tee. Check your connection and try again.",t)}async write(e,t,n){try{await e()}catch(o){return{ok:!1,message:q(o,t)}}const r=this.courseId.get();return await Promise.all([r===null?Promise.resolve():this.load(r,!0),n===null?Promise.resolve():this.courses.load(n,!0)]),{ok:!0}}}const lr=E(`
    <div class="mtlen">
        <div class="mtlen__head">
            <span bind="label" class="mtlen__title">Hole lengths</span>
            <p bind="hint" class="mtlen__hint"></p>
        </div>
        <div bind="box" class="mtlen__box"></div>
        <p bind="summary" class="mtlen__summary" role="status" aria-live="polite"></p>
        <p bind="error" class="mtlen__error" role="alert"></p>
    </div>
`);class dr extends C{static styles=`
        .mtlen {
            display: flex;
            flex-direction: column;
            gap: ${c("xs")};
            min-width: 0;

            & .mtlen__head {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            & .mtlen__title {
                font-family: ${i("font-ui")};
                font-size: 0.8rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: ${i("text-muted")};
            }

            & .mtlen__hint {
                ${V()}
                margin: 0;
            }

            & .mtlen__box {
                ${an()}
            }

            /* max-content, never 100%: a grid that shrinks to its box never
               scrolls, and the whole point of the box is that this one does. */
            & .mtlen__grid {
                border-collapse: collapse;
                min-width: max-content;
                font-family: ${i("font-ui")};
                font-size: 0.85rem;
                color: ${i("text")};
            }

            & .mtlen__cell {
                padding: ${c("xs")};
                border-bottom: 1px solid ${i("manage-table-row-border")};
                text-align: center;
                vertical-align: middle;
            }

            & .mtlen__grid tr:last-child .mtlen__cell { border-bottom: none; }

            & .mtlen__hole {
                font-variant-numeric: tabular-nums;
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.06em;
                color: ${i("manage-table-header-fg")};
                background: ${i("manage-table-header-bg")};
                border-bottom: 1px solid ${i("manage-table-header-border")};
                padding: ${c("xs")} ${c("sm")};
                min-width: 4.5rem;
            }

            /* Sticky so a grid scrolled to hole 14 still says which row is the
               length and which is the override. Above the cells it slides over,
               and opaque — a translucent label over a passing input is unreadable. */
            & .mtlen__rowhead {
                position: sticky;
                left: 0;
                z-index: 1;
                background: ${i("manage-table-header-bg")};
                color: ${i("manage-table-header-fg")};
                border-right: 1px solid ${i("manage-table-header-border")};
                text-align: left;
                white-space: nowrap;
                font-size: 0.75rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                padding: ${c("xs")} ${c("sm")};
            }

            & .mtlen__corner {
                border-bottom: 1px solid ${i("manage-table-header-border")};
            }

            & .mtlen__input {
                ${Z()}
                width: 4.25rem;
                padding: 0 ${c("xs")};
                text-align: center;
                font-variant-numeric: tabular-nums;
            }

            /* The cell the message names. Colour is the SECOND signal — the
               worded error under the grid is the first (design-guidelines §4). */
            & .mtlen__input[aria-invalid='true'] {
                border-color: ${i("danger")};
            }

            & .mtlen__summary {
                ${V()}
                margin: 0;
                font-variant-numeric: tabular-nums;
            }

            & .mtlen__error {
                margin: 0;
                color: ${i("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }
        }
    `;lengths=new m([]);box=null;lengthInputs=new Map;siInputs=new Map;render(){const e=this.wire(lr,{label:{id:`${this.props.idPrefix}-lengths-label`},hint:{textContent:"Metres per hole. Leave a hole blank if this tee is not measured for it. A stroke-index override replaces the course’s own index for this tee only — leave it blank to use the course’s."},summary:{textContent:()=>this.summary()},error:{textContent:()=>this.props.errors.get().lengths??"",hidden:()=>this.props.errors.get().lengths===void 0}});return this.box=this.ref(e,"box"),this.track(b(()=>{const t=this.props.holeCount.get();this.build(t)})),this.track(b(()=>{const t=new Set(this.props.errors.get().badHoles??[]);for(const[n,r]of this.lengthInputs)r.setAttribute("aria-invalid",String(t.has(n)));for(const[n,r]of this.siInputs)r.setAttribute("aria-invalid",String(t.has(n)))})),this.track(b(()=>{const t=this.props.busy?.get()??!1;for(const n of this.lengthInputs.values())n.disabled=t;for(const n of this.siInputs.values())n.disabled=t})),e}seed(e){this.lengths.set(e.map(t=>({...t}))),this.apply()}focusFirst(){const e=this.lengthInputs.get(1)??[...this.lengthInputs.values()][0];return e?(e.focus(),e.select(),!0):!1}focusInvalid(e){const t=e.badHoles?.[0];if(t===void 0)return!1;const n=this.lengthInputs.get(t)??this.siInputs.get(t);return n?(n.focus(),n.select(),!0):!1}build(e){const t=this.box;if(!t||(t.textContent="",this.lengthInputs.clear(),this.siInputs.clear(),e<=0))return;const n=Array.from({length:e},(h,d)=>d+1),r=document.createElement("table");r.className="mtlen__grid",r.setAttribute("aria-labelledby",`${this.props.idPrefix}-lengths-label`);const o=document.createElement("thead"),a=document.createElement("tr");a.appendChild(Oe("th","mtlen__hole mtlen__rowhead mtlen__corner","Hole"));for(const h of n){const d=Oe("th","mtlen__hole",String(h));d.setAttribute("scope","col"),d.id=this.holeHeaderId(h),a.appendChild(d)}o.appendChild(a),r.appendChild(o);const l=document.createElement("tbody");l.appendChild(this.inputRow("Length (m)",n,"decimal",this.lengthInputs,(h,d)=>this.patch(h,{lengthM:d}))),l.appendChild(this.inputRow("SI override",n,"numeric",this.siInputs,(h,d)=>this.patch(h,{strokeIndexOverride:d}))),r.appendChild(l),t.appendChild(r),this.apply()}inputRow(e,t,n,r,o){const a=document.createElement("tr"),l=Oe("th","mtlen__cell mtlen__rowhead",e);l.setAttribute("scope","row"),a.appendChild(l);for(const h of t){const d=document.createElement("td");d.className="mtlen__cell";const u=document.createElement("input");u.type="text",u.className="mtlen__input",u.inputMode=n,u.autocomplete="off",u.setAttribute("aria-label",`${e}, hole ${h}`),u.addEventListener("input",()=>o(h,u.value)),r.set(h,u),d.appendChild(u),a.appendChild(d)}return a}apply(){const e=new Map(this.lengths.peek().map(t=>[t.holeNumber,t]));for(const[t,n]of this.lengthInputs)n.value=e.get(t)?.lengthM??"";for(const[t,n]of this.siInputs)n.value=e.get(t)?.strokeIndexOverride??""}patch(e,t){this.lengths.update(n=>{const r=n.findIndex(a=>a.holeNumber===e);if(r===-1)return[...n,{holeNumber:e,lengthM:"",strokeIndexOverride:"",...t}].sort((a,l)=>a.holeNumber-l.holeNumber);const o=[...n];return o[r]={...o[r],...t},o})}holeHeaderId(e){return`${this.props.idPrefix}-hole-${e}`}summary(){const e=this.lengths.get(),t=this.props.holeCount.get();if(t<=0)return"";const n=e.filter(l=>vt(l.lengthM)!==null);if(n.length===0)return"No holes measured yet.";const r=(l,h)=>n.filter(d=>d.holeNumber>=l&&d.holeNumber<=h).reduce((d,u)=>d+(vt(u.lengthM)??0),0),o=r(1,t),a=[];return t>9&&a.push(`Out ${re(r(1,9))}`,`In ${re(r(10,t))}`),a.push(`Total ${re(o)}`),a.push(n.length===t?`all ${t} holes measured`:`${n.length} of ${t} holes measured`),a.join(" · ")}}function Oe(s,e,t){const n=document.createElement(s);return n.className=e,n.textContent=t,n}function vt(s){const e=s.trim();if(!/^\d+(\.\d+)?$/.test(e))return null;const t=Number(e);return Number.isFinite(t)&&t>0?t:null}const cr=E(`
    <div class="mteefields">
        <div class="mteefields__grid">
            <div class="mteefields__field">
                <label bind="nameLabel" class="mteefields__label">Name</label>
                <!-- aria-required, NOT the required attribute: a natively required
                     field blocks the submit event and replaces our worded message
                     with a browser bubble we cannot word or place. -->
                <input bind="name" class="mteefields__control" type="text" autocomplete="off" aria-required="true">
                <p bind="nameError" class="mteefields__error" role="alert"></p>
            </div>

            <div class="mteefields__field">
                <label bind="colourLabel" class="mteefields__label">Colour</label>
                <div class="mteefields__colour">
                    <input bind="colour" class="mteefields__control" type="text" autocomplete="off" list="">
                    <span bind="swatch" class="mteefields__swatch" aria-hidden="true"></span>
                </div>
                <datalist bind="colours"></datalist>
                <p bind="colourHint" class="mteefields__hint"></p>
            </div>
        </div>

        <div bind="ratingsHost" class="mteefields__ratings"></div>

        <div bind="lengthsHost"></div>
    </div>
`);class hr extends C{static styles=`
        .mteefields {
            display: flex;
            flex-direction: column;
            gap: ${i("manage-stack-gap")};
            min-width: 0;

            & .mteefields__grid {
                ${xe()}
            }

            & .mteefields__field {
                ${ae()}
            }

            & .mteefields__label {
                ${le()}
            }

            & .mteefields__control {
                ${Z()}
            }

            & .mteefields__hint {
                ${V()}
                margin: 0;
            }

            & .mteefields__error {
                ${ke()}
                margin: 0;

                &[hidden] { display: none; }
            }

            & .mteefields__colour {
                display: flex;
                align-items: center;
                gap: ${c("sm")};
                min-width: 0;
            }

            /* Decoration only: the word beside it is what says which colour this
               is (design-guidelines §4), and an unrecognised value simply gets
               no swatch. */
            & .mteefields__swatch {
                flex: none;
                width: 1.5rem;
                height: 1.5rem;
                border-radius: ${i("radius-pill")};
                border: 1px solid ${i("border-strong")};
                background: ${i("surface-sunken")};

                &[hidden] { display: none; }
            }

            & .mteefields__ratings {
                display: flex;
                flex-direction: column;
                gap: ${i("manage-stack-gap")};
            }

            & .mtrating {
                display: flex;
                flex-direction: column;
                gap: ${c("sm")};
                padding: ${c("md")};
                border: 1px solid ${i("manage-table-border")};
                border-radius: ${i("manage-table-radius")};
                background: ${i("manage-table-bg")};
            }

            & .mtrating__head {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${c("sm")};
            }

            & .mtrating__title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1rem;
                font-weight: 600;
                color: ${i("text")};
            }

            & .mtrating__seg {
                ${qt()}
            }

            & .mtrating__figures {
                ${xe()}

                &[hidden] { display: none; }
            }

            /* The worded annotation that stands in for the figures — muted, in
               words, never a symbol (design-guidelines §4). */
            & .mtrating__absent {
                ${V()}
                margin: 0;

                &[hidden] { display: none; }
            }

            & .mtrating__error {
                ${ke()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;parts=new m($t(ns(0)));nameInput=null;colourInput=null;ratingInputs=new Map;grid=null;render(){const e={name:`${this.props.idPrefix}-name`,colour:`${this.props.idPrefix}-colour`,colours:`${this.props.idPrefix}-colour-options`},t=()=>this.props.busy?.get()??!1,n=this.wire(cr,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:t,oninput:l=>this.patch({name:l.target.value})},nameError:{id:`${e.name}-error`,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},colourLabel:{htmlFor:e.colour},colour:{id:e.colour,"aria-describedby":`${e.colour}-hint`,disabled:t,oninput:l=>this.patch({colour:l.target.value})},colours:{id:e.colours},colourHint:{id:`${e.colour}-hint`,textContent:`${Wn}. Optional`}});this.nameInput=this.ref(n,"name"),this.colourInput=this.ref(n,"colour"),this.colourInput.setAttribute("list",e.colours);const r=this.ref(n,"colours");for(const l of Bn){const h=document.createElement("option");h.value=l,r.appendChild(h)}const o=this.ref(n,"swatch");this.track(b(()=>{const l=is(this.parts.get().colour);o.hidden=l===null,o.style.backgroundColor=l??""}));const a=this.ref(n,"ratingsHost");for(const l of B)a.appendChild(this.ratingBlock(l,t));return this.grid=this.spawn(dr,this.ref(n,"lengthsHost"),{idPrefix:this.props.idPrefix,errors:this.props.errors,busy:{get:t},holeCount:this.props.holeCount}),n}ratingBlock(e,t){const n=document.createElement("section");n.className="mtrating";const r=document.createElement("div");r.className="mtrating__head";const o=document.createElement("h4");o.className="mtrating__title",o.id=`${this.props.idPrefix}-${e}-title`,o.textContent=`${H(e)}’s rating`,r.appendChild(o);const a=document.createElement("div");a.className="mtrating__seg",a.setAttribute("role","group"),a.setAttribute("aria-labelledby",o.id);const l=[{label:"Rated",rated:!0},{label:"Not rated",rated:!1}],h=l.map(v=>{const N=document.createElement("button");return N.type="button",N.textContent=v.label,N.addEventListener("click",()=>this.setRated(e,v.rated)),a.appendChild(N),N});r.appendChild(a),n.appendChild(r);const d=document.createElement("div");d.className="mtrating__figures";for(const v of U){const N=document.createElement("div");N.className="mteefields__field";const T=`${this.props.idPrefix}-${e}-${v.key}`,A=document.createElement("label");A.className="mteefields__label",A.htmlFor=T,A.textContent=v.label,N.appendChild(A);const O=document.createElement("input");O.type="text",O.className="mteefields__control",O.id=T,O.autocomplete="off",O.inputMode=v.whole?"numeric":"decimal",O.addEventListener("input",()=>this.patchRating(e,{[v.key]:O.value})),this.ratingInputs.set(`${e}:${v.key}`,O),N.appendChild(O),d.appendChild(N)}n.appendChild(d);const u=document.createElement("p");u.className="mtrating__absent";const f=H(e).toLowerCase();u.textContent=`No ${f}’s rating. Saving removes any tee role on this course that assigns this tee to ${f} — that assignment is deleted, not hidden — so the tee is no longer offered for ${f}, and rounds cannot use it for a ${e==="M"?"man":"woman"}’s handicap.`,n.appendChild(u);const $=document.createElement("p");return $.className="mtrating__error",$.setAttribute("role","alert"),n.appendChild($),this.track(b(()=>{const v=this.parts.get().ratings[e].rated,N=t();h.forEach((T,A)=>{T.setAttribute("aria-pressed",String(l[A].rated===v)),T.disabled=N}),d.hidden=!v,u.hidden=v;for(const T of U){const A=this.ratingInputs.get(`${e}:${T.key}`);A&&(A.disabled=N)}})),this.track(b(()=>{const v=this.props.errors.get().ratings?.[e];$.textContent=v??"",$.hidden=v===void 0;for(const N of U){const T=this.ratingInputs.get(`${e}:${N.key}`);T&&T.setAttribute("aria-invalid",String(v!==void 0))}})),n}current(){const e=this.parts.peek();return{name:e.name,colour:e.colour,ratings:{M:{...e.ratings.M},F:{...e.ratings.F}},lengths:(this.grid?.lengths.peek()??[]).map(t=>({...t}))}}seed(e){this.parts.set($t(e)),this.nameInput&&(this.nameInput.value=e.name),this.colourInput&&(this.colourInput.value=e.colour);for(const t of B)for(const n of U){const r=this.ratingInputs.get(`${t}:${n.key}`);r&&(r.value=e.ratings[t][n.key])}this.grid?.seed(e.lengths)}focusFirst(){this.nameInput?.focus()}focusInvalid(e){if(e.name!==void 0&&this.nameInput)return this.nameInput.focus(),!0;for(const t of B){if(e.ratings?.[t]===void 0)continue;const n=U.map(r=>this.ratingInputs.get(`${t}:${r.key}`)).find(r=>r!==void 0);if(n)return n.focus(),n.select(),!0}return this.grid?.focusInvalid(e)??!1}patch(e){this.parts.update(t=>({...t,...e}))}setRated(e,t){this.parts.update(n=>({...n,ratings:{...n.ratings,[e]:{...n.ratings[e],rated:t}}}))}patchRating(e,t){this.parts.update(n=>({...n,ratings:{...n.ratings,[e]:{...n.ratings[e],...t}}}))}}function $t(s){return{name:s.name,colour:s.colour,ratings:{M:{...s.ratings.M},F:{...s.ratings.F}}}}const ge="__new",ur=E(`
    <section class="mtees">
        <header class="mtees__head">
            <div class="mtees__heading">
                <h2 class="mtees__title">Tees</h2>
                <p class="mtees__lead">The tees this course is played from, with their hole lengths and ratings.</p>
            </div>
            <button bind="new" class="mtees__new" type="button">New tee</button>
        </header>

        <form bind="panel" class="mtees__panel">
            <h3 bind="panelTitle" class="mtees__panel-title"></h3>
            <div bind="fieldsHost"></div>
            <p bind="panelError" class="mtees__error" role="alert"></p>
            <div class="mtees__panel-actions">
                <button bind="submit" class="mtees__submit" type="submit"></button>
                <button bind="cancel" class="mtees__secondary" type="button">Cancel</button>
            </div>
        </form>

        <p bind="loadError" class="mtees__error" role="alert"></p>
        <button bind="retry" class="mtees__secondary" type="button">Try again</button>
        <p bind="deleteError" class="mtees__error" role="alert"></p>
        <p bind="loadingNote" class="mtees__note" role="status" aria-live="polite"></p>

        <div bind="tableHost"></div>
        <div bind="confirmHost"></div>
    </section>
`);class mr extends C{static styles=`
        .mtees {
            display: flex;
            flex-direction: column;
            gap: ${i("manage-stack-gap")};
            min-width: 0;

            & .mtees__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${c("md")};
            }

            & .mtees__heading {
                display: flex;
                flex-direction: column;
                gap: ${c("xs")};
                min-width: 0;
            }

            & .mtees__title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.35rem;
                font-weight: 600;
                color: ${i("text")};
            }

            & .mtees__lead {
                margin: 0;
                max-width: 60ch;
                color: ${i("text-muted")};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mtees__new {
                ${k(void 0,"primary")}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mtees__note {
                margin: 0;
                color: ${i("text-muted")};
                font-size: 0.8rem;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mtees__error {
                margin: 0;
                color: ${i("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mtees__panel {
                ${W({})}
                display: flex;
                flex-direction: column;
                gap: ${i("manage-stack-gap")};
                padding: ${i("manage-page-pad")};
                /* The lengths grid inside scrolls itself; without this the panel
                   takes its width from the grid's content and the PAGE scrolls
                   sideways instead. */
                min-width: 0;

                &[hidden] { display: none; }
            }

            & .mtees__panel-title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.1rem;
                font-weight: 600;
                color: ${i("text")};
            }

            & .mtees__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${c("sm")};
            }

            & .mtees__submit {
                ${k(void 0,"primary")}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mtees__secondary {
                ${k()}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;

                &[hidden] { display: none; }
            }

            /* The colour cell: the WORD, with a swatch in front of it when the
               stored value is one we can paint. The swatch never appears alone —
               a colour named only by a colour is unreadable to anyone who cannot
               tell those two greens apart (docs/design-guidelines.md §4). */
            & .mtees__colour {
                display: inline-flex;
                align-items: center;
                gap: ${c("xs")};
            }

            & .mtees__swatch {
                flex: none;
                width: 0.85rem;
                height: 0.85rem;
                border-radius: ${i("radius-pill")};
                border: 1px solid ${i("border-strong")};
            }

            & .mtees__muted { color: ${i("text-muted")}; }
        }
    `;tees=this.inject(ar);courses=this.inject(de);editor=new ie;errors=new m({});deleteOpen=new m(!1);deleteTarget=new m(null);deleteFailure=new m(null);deletingId=new m(null);fields=null;actionEffects=new Map;rows=new R(()=>{const e=this.holeCount();return this.tees.tees.get().map(t=>({...t,courseHoleCount:e}))});columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>e.name},{key:"colour",header:"Colour",cell:e=>this.colourCell(e)},{key:"rated",header:"Rated for",cell:e=>Xn(e)},{key:"length",header:"Total length",cell:e=>{const t=Qn(e);return t!==""?t:this.muted("Not measured")}},{key:"holes",header:"Holes measured",type:"numeric",cell:e=>`${Jn(e)} of ${e.courseHoleCount}`}];render(){const e=this.wire(ur,{new:{disabled:()=>this.editing()||this.deletingId.get()!==null,onclick:()=>this.openCreate()},panel:{hidden:()=>!this.editing(),onsubmit:t=>{t.preventDefault(),this.submit()}},panelTitle:{textContent:()=>this.panelTitle()},panelError:{textContent:()=>this.panelError()??"",hidden:()=>this.panelError()===null},submit:{textContent:()=>this.submitLabel(),disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.closePanel()},loadError:{textContent:()=>this.tees.error.get()??"",hidden:()=>this.tees.error.get()===null},retry:{hidden:()=>this.tees.error.get()===null,onclick:()=>{this.tees.load(this.props.courseId,!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading tees…",hidden:()=>this.tees.loaded.get()}});return this.fields=this.spawn(hr,this.ref(e,"fieldsHost"),{idPrefix:"manage-tee",errors:this.errors,busy:{get:()=>this.saving()},holeCount:{get:()=>this.holeCount()}}),this.spawn(J,this.ref(e,"tableHost"),{columns:this.columns,rows:this.rows,rowKey:t=>t.id,caption:"Tees",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Tee actions",empty:{heading:"No tees yet",body:"Add the tees this course is played from, then give each one its hole lengths and ratings.",action:{label:"New tee",onclick:()=>this.openCreate()}}}),this.spawn(Y,this.ref(e,"confirmHost"),Ne({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this tee?"},consequence:()=>{const t=this.deleteTarget.get();return t?tr(t.name):sr},confirmLabel:"Delete tee",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(Se(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.tees.load(this.props.courseId),this.courses.load(this.props.clubId);const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.editing()||this.saving()||this.closePanel())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}holeCount(){return this.courses.byId(this.props.courseId)?.holeCount??0}editing(){return this.editor.key.get()!==null}creating(){return this.editor.key.get()===ge}saving(){const e=this.editor.key.get();return e!==null&&this.editor.isSaving(e)}panelTitle(){if(this.creating())return"New tee";const e=this.openTee();return e?`Edit ${e.name}`:"Edit tee"}submitLabel(){return this.creating()?this.saving()?"Creating…":"Create tee":this.saving()?"Saving…":"Save tee"}panelError(){const e=this.editor.key.get();return e===null?null:this.editor.errorFor(e)}openTee(){const e=this.editor.key.get();return e===null||e===ge?null:this.tees.tees.get().find(t=>t.id===e)??null}openCreate(){this.saving()||(this.errors.set({}),this.editor.begin(ge),this.fields?.seed(ns(this.holeCount())),this.fields?.focusFirst())}openEdit(e){this.saving()||(this.errors.set({}),this.editor.begin(e.id),this.fields?.seed(Gn(e,this.holeCount())),this.fields?.focusFirst())}closePanel(){this.editor.cancel(),this.errors.set({})}async submit(){if(!this.fields||this.saving())return;const e=this.editor.key.get();if(e===null)return;const t=this.fields.current(),n=Kn(t,this.holeCount());if(this.errors.set(n),Vn(n)){this.fields.focusInvalid(n);return}await this.editor.commit(()=>e===ge?this.tees.create(this.props.courseId,this.props.clubId,t):this.tees.update(e,t))}colourCell(e){if(e.colour===null||e.colour.trim()==="")return this.muted("Not set");const t=document.createElement("span");t.className="mtees__colour";const n=is(e.colour);if(n!==null){const o=document.createElement("span");o.className="mtees__swatch",o.setAttribute("aria-hidden","true"),o.style.backgroundColor=n,t.appendChild(o)}const r=document.createElement("span");return r.textContent=Zn(e.colour),r.textContent!==e.colour.trim()&&(t.title=e.colour.trim()),t.appendChild(r),t}muted(e){const t=document.createElement("span");return t.className="mtees__muted",t.textContent=e,t}rowActions(e){const t=P("Edit",{onclick:()=>this.openEdit(e)}),n=P("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,b(()=>{const r=this.deletingId.get(),o=r!==null||this.editing();n.textContent=r===e.id?"Deleting…":"Delete",n.disabled=o,t.disabled=o})),[t,n]}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.tees.remove(e.id,this.props.clubId);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}const fr=E(`
    <section class="mcourse">
        <p bind="loadingNote" class="mcourse__note" role="status" aria-live="polite"></p>

        <p bind="loadError" class="mcourse__error" role="alert"></p>
        <button bind="retry" class="mcourse__secondary" type="button">Try again</button>

        <div bind="missing" class="mcourse__body">
            <h1 class="mcourse__title">Course not found</h1>
            <p class="mcourse__lead">This course is not in the catalog. It may have been deleted since the link was made.</p>
            <button bind="backMissing" class="mcourse__secondary" type="button">Back to the club</button>
        </div>

        <div bind="body" class="mcourse__body">
            <header class="mcourse__heading">
                <h1 bind="title" class="mcourse__title"></h1>
                <p bind="subtitle" class="mcourse__lead"></p>
            </header>

            <!-- The course's holes (spec §3.4). A component taking the course
                 id as a prop, spawned below; it publishes no breadcrumb of its
                 own, because the trail this page sets is already its. -->
            <div bind="holesHost" class="mcourse__section"></div>

            <!-- T7 (spec §3.5) mounts the tees editor here. -->
            <div bind="teesHost" class="mcourse__section"></div>

            <!-- T8 (spec §3.6) mounts the tee-role matrix here. -->
            <div bind="teeRolesHost" class="mcourse__section"></div>

            <p class="mcourse__lead">The course’s name, hole count and position are edited on the club page.</p>
            <button bind="back" class="mcourse__secondary" type="button">Back to the club</button>
        </div>
    </section>
`);class pr extends C{static styles=`
        .mcourse {
            display: flex;
            flex-direction: column;
            gap: ${i("manage-stack-gap")};

            & .mcourse__heading {
                display: flex;
                flex-direction: column;
                gap: ${c("xs")};
                min-width: 0;
            }

            & .mcourse__title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${i("text")};
            }

            & .mcourse__lead {
                margin: 0;
                max-width: 60ch;
                color: ${i("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mcourse__note {
                margin: 0;
                color: ${i("text-muted")};
                font-size: 0.8rem;

                &[hidden] { display: none; }
            }

            & .mcourse__error {
                margin: 0;
                color: ${i("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            /* Stacked sections — holes, then tees, then tee roles — with the
               wider section gap between them, because each one is a heading
               with its own grid under it and not another paragraph. */
            & .mcourse__body {
                display: flex;
                flex-direction: column;
                gap: ${i("manage-section-gap")};

                &[hidden] { display: none; }
            }

            /* An unfilled mount host must not spend a gap: the flex gap applies
               to empty children too, so T7's and T8's hosts would push the page
               apart before either exists. */
            & .mcourse__section {
                min-width: 0;

                &:empty { display: none; }
            }

            & .mcourse__secondary {
                ${k()}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }
        }
    `;router=this.inject(M);crumbs=this.inject(oe);clubs=this.inject(Ie);courses=this.inject(de);params=this.router.params(gn);render(){const e=this.wire(fr,{loadingNote:{textContent:"Loading course…",hidden:()=>this.settled()},loadError:{textContent:()=>this.courses.error.get()??"",hidden:()=>this.courses.error.get()===null},retry:{hidden:()=>this.courses.error.get()===null,onclick:()=>{this.courses.load(this.clubId(),!0)}},missing:{hidden:()=>!this.settled()||this.courses.error.get()!==null||this.course()!==null},backMissing:{onclick:()=>this.backToClub()},body:{hidden:()=>this.course()===null},title:()=>this.course()?.name??"",subtitle:()=>this.summary(),back:{onclick:()=>this.backToClub()}}),t=this.courseId();return t!==""&&(this.spawn(qn,this.ref(e,"holesHost"),{courseId:t}),this.spawn(mr,this.ref(e,"teesHost"),{clubId:this.clubId(),courseId:t})),e}onMount(){const e=this.clubId();if(e===""||this.courseId()===""){this.router.navigate(z,!0);return}this.clubs.load(),this.courses.load(e),this.track(b(()=>{this.crumbs.set([{label:"Clubs",path:z},{label:this.clubs.byId(e)?.name??"Club",path:Ce(e)},{label:this.course()?.name??"Course"}])}))}clubId(){return this.params.get().clubId}courseId(){return this.params.get().courseId}course(){const e=this.courseId();return e===""?null:this.courses.byId(e)}settled(){return this.courses.loaded.get()}summary(){const e=this.course();if(!e)return"";const t=this.clubs.byId(this.clubId()),n=`${e.holeCount} holes`;return t?`${n} at ${t.name}.`:`${n}.`}backToClub(){this.router.navigate(Ce(this.clubId()))}}const gr=[{id:"courses",label:"Courses",path:z,routes:{[z]:yn,[Ke]:An,[Ye]:pr},unlocked:s=>s.canManageCourses()}];function ce(s){return gr.filter(e=>e.unlocked(s))}function br(s){const e={};for(const t of ce(s))Object.assign(e,t.routes);return e}const _r=E(`
    <nav class="mnav" aria-label="Sections">
        <ul bind="list" class="mnav__list"></ul>
    </nav>
`),yr=E(`
    <li class="mnav__item">
        <a bind="link" class="mnav__link"><span bind="label"></span></a>
    </li>
`);class xt extends C{static styles=`
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
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("md")};
                border-radius: ${i("radius-sm")};
                color: ${i("manage-chrome-fg-muted")};
                font-size: 0.95rem;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;

                &:hover {
                    background: ${i("manage-chrome-hover-bg")};
                    color: ${i("manage-chrome-fg")};
                }

                &:focus-visible {
                    outline: 2px solid ${i("manage-chrome-fg")};
                    outline-offset: -2px;
                }

                /* Elevation, not saturation — design-guidelines §2. */
                &.mnav__link--active {
                    background: ${i("manage-chrome-active-bg")};
                    color: ${i("manage-chrome-fg")};
                    font-weight: 700;
                }
            }
        }
    `;router=this.inject(M);roles=this.inject(Q);render(){const e=this.wire(_r,{});return this.$each(this.ref(e,"list"),()=>ce(this.roles),(t,n,r)=>this.wireEl(yr,{link:{href:X+t.path,className:()=>{const o=this.router.route.get();return o===t.path||o.startsWith(t.path+"/")?"mnav__link mnav__link--active":"mnav__link"},"aria-current":()=>{const o=this.router.route.get();return o===t.path||o.startsWith(t.path+"/")?"page":"false"},onclick:o=>{const a=o;a.metaKey||a.ctrlKey||a.shiftKey||a.button!==0||(o.preventDefault(),this.router.navigate(t.path),this.props.onNavigate?.())}},label:()=>t.label},r),t=>t.id),e}}const wr=E(`
    <section class="mnf">
        <h1 class="mnf__title">Nothing here</h1>
        <p class="mnf__body">That address does not match anything in Tapscore Manage.</p>
        <button bind="home" class="mnf__home" type="button"></button>
    </section>
`);class vr extends C{static styles=`
        .mnf {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: ${c("md")};

            & .mnf__title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.5rem;
                font-weight: 600;
                color: ${i("text")};
            }

            & .mnf__body {
                margin: 0;
                color: ${i("text-muted")};
                font-size: 0.95rem;
            }

            & .mnf__home {
                ${k()}
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                cursor: pointer;

                &.hidden { display: none; }
            }
        }
    `;router=this.inject(M);roles=this.inject(Q);crumbs=this.inject(oe);onMount(){this.crumbs.set([])}render(){const e=ce(this.roles)[0];return this.wire(wr,{home:{className:()=>e?"mnf__home":"mnf__home hidden",textContent:()=>e?`Go to ${e.label}`:"",onclick:()=>{e&&this.router.navigate(e.path,!0)}}})}}const $r=E(`
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
`),xr=E(`
    <li class="mshell__crumb">
        <span bind="sep" class="mshell__crumb-sep">/</span>
        <a bind="link" class="mshell__crumb-link"></a>
        <span bind="current" class="mshell__crumb-current" aria-current="page"></span>
    </li>
`),kr=E(`
    <div class="mshell__identity-inner">
        <span bind="who" class="mshell__who"></span>
        <button bind="signout" class="mshell__signout" type="button">Sign out</button>
    </div>
`);class Cr extends C{static styles=`
        .mshell {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            min-height: 100vh;
            min-height: 100dvh;
            background: ${i("bg")};

            /* ─── Chrome, shared by top bar, sidebar and drawer ─── */

            & .mshell__wordmark {
                font-family: ${i("font-display")};
                font-size: 1.05rem;
                font-weight: 400;
                letter-spacing: -0.01em;
                color: ${i("manage-chrome-fg")};
                white-space: nowrap;

                & b { font-weight: 700; }
            }

            & .mshell__brand {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${c("sm")};
                min-height: ${i("manage-touch-target")};
                padding: 0 ${c("md")};
                margin-bottom: ${i("manage-stack-gap")};
            }

            /* Inset from the chrome's edges so the active item's pill reads as
               a raised shape sitting ON the sidebar, rather than as a band
               bleeding off both sides of it. */
            & .mshell__navhost {
                flex: 1;
                padding: 0 ${c("sm")};
            }

            & .mshell__identity {
                border-top: 1px solid ${i("manage-chrome-border")};
                padding-top: ${i("manage-stack-gap")};
                margin-top: ${i("manage-stack-gap")};

                & .mshell__identity-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: ${c("sm")};
                    padding: 0 ${c("md")};
                }

                & .mshell__who {
                    color: ${i("manage-chrome-fg-muted")};
                    font-size: 0.8rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }

                & .mshell__signout {
                    ${k(void 0,"ghost")}
                    min-height: ${i("manage-touch-target")};
                    padding: 0 ${c("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    /* The recipe's tiers are drawn for the PAGE surface; on the
                       ink chrome they would paint a cream slab. Shape, sizing
                       and states come from the recipe, the skin from the chrome
                       tokens — overrides after the recipe, per ADR-005. */
                    background: transparent;
                    color: ${i("manage-chrome-fg")};
                    border-color: ${i("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${i("manage-chrome-hover-bg")};
                        color: ${i("manage-chrome-fg")};
                        border-color: ${i("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${i("manage-chrome-fg")};
                        outline-offset: 2px;
                    }
                }
            }

            /* ─── Narrow: top bar + drawer ─── */

            & .mshell__topbar {
                grid-row: 1;
                display: flex;
                align-items: center;
                gap: ${c("md")};
                padding: 0 ${i("manage-page-pad")};
                padding-top: env(safe-area-inset-top);
                min-height: calc(${i("manage-touch-target")} + ${c("md")});
                background: ${i("manage-chrome-bg")};

                & .mshell__menu {
                    ${k(void 0,"ghost")}
                    min-height: ${i("manage-touch-target")};
                    min-width: ${i("manage-touch-target")};
                    padding: 0 ${c("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    /* Same reasoning as the sign-out button above: recipe for
                       shape, chrome tokens for skin. The label is the word
                       "Menu" and not a hamburger glyph on purpose — a glyph has
                       no accessible name and this control opens the app's whole
                       navigation (docs/design-guidelines.md §4). */
                    background: transparent;
                    color: ${i("manage-chrome-fg")};
                    border-color: ${i("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${i("manage-chrome-hover-bg")};
                        color: ${i("manage-chrome-fg")};
                        border-color: ${i("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${i("manage-chrome-fg")};
                        outline-offset: 2px;
                    }
                }
            }

            & .mshell__scrim {
                position: fixed;
                inset: 0;
                z-index: 30;
                background: ${i("manage-scrim")};
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
                width: min(84vw, calc(${i("manage-sidebar-width")} + ${c("2xl")}));
                padding: ${i("manage-page-pad")} 0;
                padding-top: calc(${i("manage-page-pad")} + env(safe-area-inset-top));
                background: ${i("manage-chrome-bg")};
                /* The shadow disappears against a near-black page in dark
                   scheme, so a hairline carries the drawer's edge there. */
                border-right: 1px solid ${i("manage-chrome-border")};
                box-shadow: ${i("shadow-elevated")};
                transform: translateX(-100%);
                transition: transform 180ms ease;

                &.open { transform: translateX(0); }

                & .mshell__close {
                    ${k(void 0,"ghost")}
                    min-height: ${i("manage-touch-target")};
                    padding: 0 ${c("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    background: transparent;
                    color: ${i("manage-chrome-fg")};
                    border-color: ${i("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${i("manage-chrome-hover-bg")};
                        color: ${i("manage-chrome-fg")};
                        border-color: ${i("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${i("manage-chrome-fg")};
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
                padding: ${i("manage-page-pad")};
                padding-bottom: calc(${i("manage-section-gap")} + env(safe-area-inset-bottom));
            }

            & .mshell__crumbs {
                min-height: 1.25rem;
                margin-bottom: ${i("manage-stack-gap")};

                & ol {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: ${c("xs")};
                    font-size: 0.8rem;
                }

                & .mshell__crumb {
                    display: flex;
                    align-items: center;
                    gap: ${c("xs")};
                }

                & .mshell__crumb-sep {
                    color: ${i("text-muted")};
                    &.hidden { display: none; }
                }

                & .mshell__crumb-link {
                    color: ${i("text-muted")};
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;

                    &:hover { color: ${i("text")}; text-decoration: underline; }
                    &.hidden { display: none; }
                }

                & .mshell__crumb-current {
                    color: ${i("text")};
                    font-weight: 700;
                    &.hidden { display: none; }
                }
            }

            & .mshell__outlet {
                max-width: ${i("manage-content-max")};
            }

            /* ─── Wide: persistent sidebar, no top bar, no drawer ─── */

            @media ${tn} {
                grid-template-columns: ${i("manage-sidebar-width")} 1fr;
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
                    padding: ${i("manage-page-pad-wide")} 0;
                    background: ${i("manage-chrome-bg")};
                }

                & .mshell__main {
                    grid-column: 2;
                    grid-row: 1;
                    padding: ${i("manage-page-pad-wide")};
                }
            }

            @media (prefers-reduced-motion: reduce) {
                & .mshell__scrim,
                & .mshell__drawer { transition: none; }
            }
        }
    `;router=this.inject(M);auth=this.inject(j);roles=this.inject(Q);breadcrumbs=this.inject(oe);drawerOpen=new m(!1);render(){const e=ce(this.roles)[0];e&&this.router.route.get()==="/"&&this.router.navigate(e.path,!0);const t=this.wire($r,{menu:{onclick:()=>this.drawerOpen.set(!0),"aria-expanded":()=>String(this.drawerOpen.get())},close:{onclick:()=>this.drawerOpen.set(!1)},scrim:{className:()=>this.drawerOpen.get()?"mshell__scrim open":"mshell__scrim",onclick:()=>this.drawerOpen.set(!1)},drawer:{className:()=>this.drawerOpen.get()?"mshell__drawer open":"mshell__drawer",inert:()=>!this.drawerOpen.get()}});return this.spawn(xt,this.ref(t,"sidebarNav")),this.spawn(xt,this.ref(t,"drawerNav"),{onNavigate:()=>this.drawerOpen.set(!1)}),this.identity(this.ref(t,"sidebarIdentity")),this.identity(this.ref(t,"drawerIdentity")),this.crumbs(this.ref(t,"crumbs")),this.$swap(this.ref(t,"outlet"),this.router.route,br(this.roles),vr),t}onMount(){this.track(b(()=>{this.router.route.get(),this.drawerOpen.set(!1)}));const e=t=>{t.key==="Escape"&&this.drawerOpen.get()&&this.drawerOpen.set(!1)};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}identity(e){e.appendChild(this.wire(kr,{who:()=>{const t=this.auth.currentUser.get();return t?`Signed in as ${t.username}`:""},signout:{onclick:()=>{this.drawerOpen.set(!1),this.auth.logout()}}}))}crumbs(e){const t=document.createElement("ol");e.appendChild(t),this.$each(t,()=>this.breadcrumbs.crumbs.get(),(n,r,o)=>this.wireEl(xr,{sep:{className:()=>r===0?"mshell__crumb-sep hidden":"mshell__crumb-sep"},link:{className:()=>n.path?"mshell__crumb-link":"mshell__crumb-link hidden",href:n.path?X+n.path:"",textContent:()=>n.path?n.label:"",onclick:a=>{const l=a;l.metaKey||l.ctrlKey||l.shiftKey||l.button!==0||(a.preventDefault(),n.path&&this.router.navigate(n.path))}},current:{className:()=>n.path?"mshell__crumb-current hidden":"mshell__crumb-current",textContent:()=>n.path?"":n.label}},o),(n,r)=>`${r}:${n.label}`)}}const ze="Something went wrong on our end. Try again in a moment.";function Er(s,e){const t=(s.details??[]).map(r=>r.path),n=r=>t.some(o=>o===`/${r}`);return n("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":n("username")?"Enter your username.":n("displayName")?"Enter a display name.":n("handicapIndex")?"Handicap index must be a number (or leave it empty).":n("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function Nr(s,e){if(s instanceof L)switch(s.status){case 400:return Er(s,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":ze;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return s.status>=500?ze:"That request could not be completed."}return s instanceof Error&&s.message==="Request timeout"?"That took too long. Check your connection and try again.":s instanceof Error?"Cannot reach the server. Check your connection and try again.":ze}const Sr=E(`
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
`);class Ir extends C{static styles=`
        .msignin {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${i("manage-page-pad")};

            & .msignin__panel {
                ${W({})}
                display: flex;
                flex-direction: column;
                gap: ${c("md")};
                width: 100%;
                max-width: 22rem;
                padding: ${i("manage-page-pad-wide")};

                &[inert] { opacity: 0.6; }
            }

            & .msignin__brand {
                font-family: ${i("font-display")};
                font-size: 1.5rem;
                font-weight: 400;
                letter-spacing: -0.01em;
                color: ${i("text")};

                & b { font-weight: 700; }
            }

            & .msignin__lead {
                margin: 0;
                color: ${i("text-muted")};
                font-size: 0.9rem;
            }

            & .msignin__error {
                display: none;
                color: ${i("error")};
                font-size: 0.85rem;
                line-height: 1.4;

                &.show { display: block; }
            }

            & .msignin__field {
                display: flex;
                flex-direction: column;
                gap: ${c("xs")};

                & span {
                    color: ${i("text-muted")};
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                & input {
                    ${Mt()}
                    min-height: ${i("manage-touch-target")};
                    padding: 0 ${c("md")};
                    font-family: inherit;
                    font-size: 1rem;
                }
            }

            & .msignin__submit {
                ${k(void 0,"primary")}
                min-height: ${i("manage-touch-target")};
                margin-top: ${c("xs")};
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
            }
        }
    `;auth=this.inject(j);roles=this.inject(Q);username="";password="";busy=new m(!1);formError=new m("");render(){return this.wire(Sr,{form:{inert:()=>this.busy.get(),onsubmit:async e=>{e.preventDefault(),await this.submit()}},error:{className:()=>this.formError.get()?"msignin__error show":"msignin__error",textContent:()=>this.formError.get()},username:{oninput:e=>{this.username=e.target.value}},password:{oninput:e=>{this.password=e.target.value}},submit:{textContent:()=>this.busy.get()?"Signing in…":"Sign in"}})}async submit(){if(this.formError.set(""),!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const e=await Pt.login(this.username.trim(),this.password);this.roles.clear(),this.auth.error.set(null),this.auth.currentUser.set(e)}catch(e){this.formError.set(Nr(e,"login")),this.busy.set(!1)}}}const Tr=E(`
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
`);class Lr extends C{static styles=`
        .mdenied {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${i("manage-page-pad")};

            & .mdenied__panel {
                ${W({})}
                display: flex;
                flex-direction: column;
                gap: ${c("md")};
                width: 100%;
                max-width: 30rem;
                padding: ${i("manage-page-pad-wide")};
            }

            & .mdenied__title {
                margin: 0;
                font-family: ${i("font-display")};
                font-size: 1.5rem;
                font-weight: 600;
                letter-spacing: -0.01em;
                color: ${i("text")};
            }

            & .mdenied__body {
                margin: 0;
                color: ${i("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mdenied__hint {
                margin: 0;
                color: ${i("text-muted")};
                font-size: 0.85rem;
            }

            & .mdenied__command {
                display: block;
                padding: ${c("sm")} ${c("md")};
                border-radius: ${i("radius-sm")};
                background: ${i("surface-sunken")};
                border: 1px solid ${i("border")};
                color: ${i("text")};
                font-size: 0.8rem;
                line-height: 1.5;
                word-break: break-all;
            }

            & .mdenied__foot {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${c("md")};
                border-top: 1px solid ${i("border")};
                padding-top: ${c("md")};

                & .mdenied__who {
                    color: ${i("text-muted")};
                    font-size: 0.8rem;
                }

                & .mdenied__signout {
                    ${k()}
                    min-height: ${i("manage-touch-target")};
                    padding: 0 ${c("lg")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                }
            }
        }
    `;auth=this.inject(j);render(){return this.wire(Tr,{command:()=>`bun run grant:role grant ${this.auth.currentUser.get()?.username??"<username>"} super_admin`,who:()=>{const e=this.auth.currentUser.get();return e?`Signed in as ${e.username}`:""},signout:{onclick:()=>{this.auth.logout()}}})}}const Ar=E(`
    <div class="mboot">
        <p class="mboot__line">Loading…</p>
    </div>
`),Or=E(`
    <div class="mboot">
        <h1 class="mboot__title">Cannot reach the server</h1>
        <p class="mboot__line">Tapscore Manage could not check what you are allowed to manage.</p>
        <button bind="retry" class="mboot__retry" type="button">Try again</button>
    </div>
`),ls=`
    .mboot {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: ${c("md")};
        min-height: 100vh;
        min-height: 100dvh;
        padding: ${i("manage-page-pad")};
        text-align: center;

        & .mboot__title {
            margin: 0;
            font-family: ${i("font-display")};
            font-size: 1.5rem;
            font-weight: 600;
            color: ${i("text")};
        }

        & .mboot__line {
            margin: 0;
            max-width: 44ch;
            color: ${i("text-muted")};
            font-size: 0.95rem;
            line-height: 1.5;
        }

        & .mboot__retry {
            ${k()}
            min-height: ${i("manage-touch-target")};
            padding: 0 ${c("lg")};
            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
        }
    }
`;class zr extends C{static styles=ls;render(){return this.wire(Ar,{})}}class Hr extends C{static styles=ls;roles=this.inject(Q);auth=this.inject(j);render(){return this.wire(Or,{retry:{onclick:()=>{this.auth.load(),this.roles.load(!0)}}})}}const Dr=E('<div bind="gate" class="mapp"></div>');class Rr extends C{static styles=`
        .mapp { min-height: 100vh; min-height: 100dvh; }
    `;auth=this.inject(j);roles=this.inject(Q);gate=new R(()=>this.auth.loading.get()?"loading":this.auth.currentUser.get()===null?this.auth.error.get()?"failed":"signed-out":this.roles.error.get()?"failed":this.roles.loaded.get()?ce(this.roles).length>0?"ready":"denied":"loading");render(){const e=this.wire(Dr,{});return this.track(b(()=>{this.auth.currentUser.get()?this.roles.load():this.roles.clear()})),this.$swap(this.ref(e,"gate"),this.gate,{loading:zr,failed:Hr,"signed-out":Ir,denied:Lr,ready:Cr}),e}}F.get(It);Bs();F.set(j,new Ws(Pt));const Pr=F.get(j);await Ts(Rr,"#app",{hot:void 0,onInit:async()=>{await Pr.load()}});export{He as A,C,M as R,m as S,It as T,w as a,we as b,R as c,_s as d,b as e,bs as n,ue as r,E as t};
