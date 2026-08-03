(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();const Ns="modulepreload",Ss=function(s){return"/tapscore/manage/"+s},ct={},Is=function(e,t,n){let i=Promise.resolve();if(t&&t.length>0){let c=function(d){return Promise.all(d.map(h=>Promise.resolve(h).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),l=a?.nonce||a?.getAttribute("nonce");i=c(t.map(d=>{if(d=Ss(d),d in ct)return;ct[d]=!0;const h=d.endsWith(".css"),p=h?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${p}`))return;const g=document.createElement("link");if(g.rel=h?"stylesheet":Ns,h||(g.as="script"),g.crossOrigin="",g.href=d,l&&g.setAttribute("nonce",l),document.head.appendChild(g),h)return new Promise((v,S)=>{g.addEventListener("load",v),g.addEventListener("error",()=>S(new Error(`Unable to preload CSS for ${d}`)))})}))}function o(a){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=a,window.dispatchEvent(l),!l.defaultPrevented)throw a}return i.then(a=>{for(const l of a||[])l.status==="rejected"&&o(l.reason);return e().catch(o)})},te="/tapscore/manage/".replace(/\/+$/,""),Be=te+"/api",Re={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},Ls=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function As(s,e){const t={};for(const[n,i]of Ls)if(n in s)for(const o of i)o in s||(t[o]=`var(--${n})`);return{...e,...t,...s}}const Dt=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],Os={thin:"1px",medium:"3px",thick:"5px"};function Mt(s){const e=s.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":Os[e.toLowerCase()]??e}function Rs(){return Dt.map(s=>{const e=Mt(Re[s]);return`@property --${s}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const Pt={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Ft={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},zs={...Ft,"done-opacity":"0.35"},Hs={...Pt,...Ft,...Re,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},Ds={...Pt,...zs,...Re,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class Ms{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;jt(e);const n=this.tracking;this.tracking=e;try{t()}finally{this.tracking=n}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const n of t)n.disposed||n.run()}}}const F=new Ms;function jt(s){for(const e of s.deps)e.delete(s);s.deps.clear()}class m{constructor(e){this.subs=new Set,this.val=e}get(){return F.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,F.notify(this.subs))}update(e){this.set(e(this.val))}}class D{constructor(e){this.subs=new Set,this.val=void 0;const t=this,n={run(){F.runTracked(n,()=>{const i=e();Object.is(t.val,i)||(t.val=i,F.notify(t.subs))})},deps:new Set};n.run()}get(){return F.subscribe(this.subs),this.val}peek(){return this.val}}function b(s){const e={run(){F.runTracked(e,s)},deps:new Set};return e.run(),()=>{e.disposed=!0,jt(e)}}function he(s){F.batch(s)}function I(s){return F.untrack(s)}class Ps{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const B=new Ps,ae=te;function qe(s){return ae?s===ae?"/":s.startsWith(ae+"/")?s.slice(ae.length):s:s}function Fs(s){return ae+s}class q{constructor(){this.route=new m(qe(location.pathname??"/")),this.search=new m(location.search??""),window.addEventListener("popstate",()=>he(()=>{this.route.set(qe(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const n=typeof t=="boolean"?{replace:t}:t??{},i=e.indexOf("#"),o=i>=0?e.slice(i):"",a=i>=0?e.slice(0,i):e,l=a.indexOf("?"),c=l>=0?a.slice(0,l):a,d=l>=0?a.slice(l+1):"",h=n.query!==void 0?js(n.query):d?"?"+d:"",p=Fs(c)+h+o;(n.replace?history.replaceState:history.pushState).call(history,null,"",p),he(()=>{this.route.set(c),this.search.set(h)})}back(){history.back()}link(e,t="active"){const n=e.split("#")[0].split("?")[0];return{onclick:i=>{i.preventDefault(),this.navigate(e)},className:()=>{const i=this.route.get();return i===n||i.startsWith(n+"/")?t:""}}}params(e){const t=e.split("/");return new D(()=>{const n=this.route.get().split("/"),i={};for(const[o,a]of t.entries())a.startsWith(":")&&(i[a.slice(1)]=n[o]??"");return i})}query(e){return new D(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new D(()=>{const e={};for(const[t,n]of new URLSearchParams(this.search.get()))e[t]=n;return e})}}function js(s){const e=new URLSearchParams;for(const[n,i]of Object.entries(s))i==null||i===""||e.set(n,String(i));const t=e.toString();return t?"?"+t:""}function Us(s){return e=>s[e]}const Bs="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",ht="data-basics-global";function qs(){if(document.head.querySelector(`style[${ht}]`))return;const s=document.createElement("style");s.setAttribute(ht,""),s.textContent=Rs()+Bs,document.head.appendChild(s)}function Ks(s,e){qs();const t=new Set(Dt),n=(o,a,l)=>{const c=Object.entries(o).map(([d,h])=>`--${d}:${t.has(d)?Mt(h):h}`).join(";");return`${a}{color-scheme:${l};${c}}`},i=document.createElement("style");return i.textContent=n(s,'[data-theme="light"]',"light")+n(e,'[data-theme="dark"]',"dark"),document.head.appendChild(i),o=>`var(--${o})`}const ut="basics-js-theme";class Ut{constructor(){this.dark=new m(!1);const e=localStorage.getItem(ut),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),b(()=>{const n=this.dark.get();document.documentElement.setAttribute("data-theme",n?"dark":"light"),localStorage.setItem(ut,n?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function C(s){const e=document.createElement("template");return e.innerHTML=s,e}function Ws(s,e){let t;for(const n of Object.keys(e))s.startsWith(n+"/")&&(!t||n.length>t.length)&&(t=n);return t?e[t]:void 0}const mt=new Set;class E{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!mt.has(t)){mt.add(t);const n=document.createElement("style");n.textContent=t.styles,document.head.appendChild(n)}}onMount(){}onDestroy(){}inject(e){return B.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...n){const i=I(()=>{const o=new e(n[0]);return o.mount(t),o});return this.children.push(i),i}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){I(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,n){const i=n??(a=>this.track(a)),o=e.content.cloneNode(!0);for(const a of o.querySelectorAll("[bind]")){const l=t[a.getAttribute("bind")];if(l)if(typeof l=="function")i(b(()=>{const c=l();a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement?a.value=String(c):a.textContent=String(c)}));else for(const[c,d]of Object.entries(l)){const h=c.includes("-");c.startsWith("on")&&typeof d=="function"?a.addEventListener(c.slice(2),d):typeof d=="function"?i(b(()=>{const p=d();h?a.setAttribute(c,String(p)):a[c]=p})):h?a.setAttribute(c,String(d)):a[c]=d}}return o}wireEl(e,t,n){return this.wire(e,t,n).firstElementChild}slot(e,t){const n=this.props[e];if(n==null)return!1;const i=this.ref(t,e);return i?(typeof n=="string"?i.textContent=n:typeof n=="function"&&n.prototype instanceof E?this.spawn(n,i):typeof n=="function"&&n(i,{spawn:(o,a,...l)=>this.spawn(o,a,...l),track:o=>this.track(o)}),!0):!1}$each(e,t,n,i=(o,a)=>a){const o=typeof t=="function"?t:()=>t.get(),a=new Map,l=new Map;this.track(()=>{for(const c of l.values())c.forEach(d=>d());l.clear()}),this.track(b(()=>{const c=o(),d=new Map;for(const[p,g]of c.entries()){const v=i(g,p);if(a.has(v))d.set(v,a.get(v));else{const S=[];d.set(v,I(()=>n(g,p,L=>S.push(L)))),l.set(v,S)}}for(const[p,g]of a)d.has(p)||(g.remove(),I(()=>l.get(p)?.forEach(v=>v())),l.delete(p));let h=e.firstChild;for(const p of d.values())p===h?h=h.nextSibling:e.insertBefore(p,h);a.clear();for(const[p,g]of d)a.set(p,g)}))}$condition(e,t,n,i){let o=null;this.track(b(()=>{o&&(o.remove(),o=null);const a=t.get();o=I(()=>a?n():i?.()??null),o&&e.appendChild(o)}))}$swap(e,t,n,i){let o=null;this.track(b(()=>{if(o){const c=o;o=null,I(()=>c.destroy())}e.textContent="";const a=t.get(),l=n[a]??Ws(a,n)??i;l&&(o=I(()=>{const c=new l;return c.mount(e),c}))})),this.track(()=>o?.destroy())}}const Te=new Set;function Gs(s){return Te.add(s),()=>Te.delete(s)}function Vs(){for(const s of Array.from(Te)){Te.delete(s);try{s()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function Ys(s,e,t){const n=document.querySelector(e);n.textContent="";const i=B.get(q);let o=null,a=!1,l=null,c=!!t?.hot?.data.hmr;const d=async h=>{o&&(o.destroy(),o=null,n.textContent=""),h?(l||(l=(await Is(()=>import("./obs-shell.component-C3Hvzbvw.js"),[])).ObsShellComponent),o=I(()=>new l)):(!c&&t?.onInit&&(await t.onInit(),c=!0),o=I(()=>new s)),I(()=>o.mount(n)),a=h};await d(qe(location.pathname).startsWith("/_obs")),b(()=>{const h=i.route.get().startsWith("/_obs");h!==a&&d(h)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{o?.destroy()}catch(h){console.error("[startApp] the root component threw while disposing",h)}if(o=null,Vs(),t.onDispose)try{t.onDispose()}catch(h){console.error("[startApp] onDispose threw",h)}}),t.hot.accept())}class O extends Error{constructor(e,t,n,i){super(t),this.status=e,this.details=n,this.traceId=i,this.name="ApiError"}}const Xs=10,Ee=[];let Ce=[],le=null;function Qs(s){Ee.push(s),Ee.length>Xs&&Ee.shift()}function Ne(s,e,t){const n={code:s,message:e,url:typeof location<"u"?location.href:"",context:[...Ee],timestamp:new Date().toISOString()};t!==void 0&&(n.traceId=t),Ce.push(n),Js()}function Js(){le||(le=setTimeout(Bt,5e3))}function Bt(){if(le&&(clearTimeout(le),le=null),Ce.length===0)return;const s=Ce;Ce=[];for(const e of s){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${Be}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${Be}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Bt()});const Zs=3e4,en=2,ye=new Map,qt=new WeakMap;function Ke(s){if(s instanceof O)return s.traceId;if(s!=null&&typeof s=="object")return qt.get(s)}async function w(s){if(s.method==="GET"){const e=ye.get(s.url);if(e)return e;const t=pt(s,en);return ye.set(s.url,t),t.then(()=>ye.delete(s.url),()=>ye.delete(s.url)),t}return pt(s,0)}async function pt(s,e){const t=s.timeout??Zs;let n;for(let i=0;i<=e;i++){const o=crypto.randomUUID();try{return await sn(tn(s,o),t)}catch(a){if(n=a,!(a instanceof O)&&a!=null&&typeof a=="object"&&qt.set(a,o),a instanceof O||i===e)break;await new Promise(l=>setTimeout(l,1e3*2**i))}}throw n}async function tn(s,e){const t={"X-Trace-Id":e},n={method:s.method,headers:t};s.body!==void 0&&(t["Content-Type"]="application/json",n.body=JSON.stringify(s.body));const i=await fetch(s.url,n),o=i.headers.get("x-trace-id")??e;if(Qs({type:"api",detail:`${s.method} ${s.url}`,timestamp:new Date().toISOString()}),!i.ok){const a=await i.json().catch(()=>({error:i.statusText}));throw new O(i.status,a.error??i.statusText,a.details,o)}return i.json()}function sn(s,e){let t;const n=new Promise((i,o)=>{t=setTimeout(()=>o(new Error("Request timeout")),e)});return Promise.race([s,n]).finally(()=>clearTimeout(t))}const We=new Set;let He=!1;function nn(s){return We.add(s),()=>{We.delete(s)}}function st(){if(!He){He=!0;try{for(const s of[...We])try{s()}catch(e){try{Ne("session-listener",rn(e))}catch{}}}finally{He=!1}}}function rn(s){try{if(s instanceof Error){const e=s.message;if(typeof e=="string")return e}return String(s)}catch{return"listener threw a value that could not be described"}}async function we(s,e,t,n={}){he(()=>{s.set(!0),e.set(null)});try{const i=await t();return s.set(!1),i}catch(i){const o=on(i);he(()=>{s.set(!1),e.set(o)}),Ne(o.code,o.message,Ke(i)),o.code==="auth"&&n.sessionExpiry!==!1&&st();return}}function on(s){return s instanceof O?s.status===401?{code:"auth",message:"Unauthorized"}:s.status===409?{code:"conflict",message:"Data has changed — please try again"}:s.status===400?{code:"validation",message:s.message}:s.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:s instanceof Error?s.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const De={sessionExpiry:!1};function an(s){return{me:()=>w({method:"GET",url:`${s}/auth/me`}),login:e=>w({method:"POST",url:`${s}/auth/login`,body:e}),logout:()=>w({method:"POST",url:`${s}/auth/logout`,body:{}}),logoutAll:()=>w({method:"POST",url:`${s}/auth/logout-all`,body:{}})}}class K{constructor(){this.api=an(Be),this.currentUser=new m(null),this.loading=new m(!1),this.error=new m(null),this.offSessionExpired=nn(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=Gs(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await we(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const n=await we(this.loading,this.error,()=>this.api.login({username:e,password:t}),De);return n?(this.currentUser.set(n),!0):!1}async logout(){await we(this.loading,this.error,()=>this.api.logout(),De);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}async logoutEverywhere(){const e=await we(this.loading,this.error,()=>this.api.logoutAll(),De),t=this.error.get();return(!t||t.code==="auth")&&this.currentUser.set(null),e?.revoked??null}}const Kt={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},ln={...Kt,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},dn={...Kt,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"};function Wt(s,e={}){const t=s==="light"?ln:dn,n=s==="light"?Hs:Ds;return As({...t,...e},n)}const Gt={"manage-page-pad":"var(--space-4)","manage-page-pad-wide":"var(--space-6)","manage-stack-gap":"var(--space-3)","manage-section-gap":"var(--space-5)","manage-touch-target":"44px","manage-table-bg":"var(--surface)","manage-table-radius":"var(--radius)","manage-table-border":"var(--border)","manage-table-header-bg":"var(--surface-sunken)","manage-table-header-fg":"var(--text-muted)","manage-table-header-border":"var(--border-strong)","manage-table-header-pad-y":"var(--space-2)","manage-table-header-pad-x":"var(--space-3)","manage-table-cell-pad-y":"var(--space-3)","manage-table-cell-pad-x":"var(--space-3)","manage-table-row-border":"var(--border)","manage-table-row-hover-bg":"var(--hover-bg)","manage-table-row-editing-bg":"var(--accent-soft)","manage-table-card-gap":"var(--space-2)","btn-danger-bg":"transparent","btn-danger-fg":"var(--danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger)","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger)","manage-sidebar-width":"232px","manage-content-max":"1120px"},Vt=s=>({"manage-chrome-bg":"var(--topbar-bg)","manage-chrome-fg":s,"manage-chrome-fg-muted":"color-mix(in srgb, var(--manage-chrome-fg) 66%, transparent)","manage-chrome-border":"color-mix(in srgb, var(--manage-chrome-fg) 14%, transparent)","manage-chrome-hover-bg":"color-mix(in srgb, var(--manage-chrome-fg) 9%, transparent)","manage-chrome-active-bg":"color-mix(in srgb, var(--manage-chrome-fg) 16%, transparent)","manage-scrim":"color-mix(in srgb, var(--topbar-bg) 62%, transparent)"}),Yt=Wt("light",{...Gt,...Vt("var(--primary-text)")}),Xt=Wt("dark",{...Gt,...Vt("var(--text)")}),r=Ks(Yt,Xt);function cn(){const s=document.querySelector('meta[name="theme-color"]');if(!s)return;const e=B.get(Ut);b(()=>{const n=(e.dark.get()?Xt:Yt)["topbar-bg"];n&&s.setAttribute("content",n)})}class hn extends K{constructor(e){super(),this.client=e}client;async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await this.client.login(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await this.client.me()),this.error.set(null)}catch(e){e instanceof O&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await this.client.logout(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof O&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logoutEverywhere(){this.loading.set(!0);try{const e=await this.client.logoutAll();return this.currentUser.set(null),this.error.set(null),e.revoked}catch(e){return e instanceof O&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"}),null}finally{this.loading.set(!1)}}}function un(s){return{login:(e,t)=>w({method:"POST",url:`${s}/auth/login`,body:{username:e,password:t}}),me:()=>w({method:"GET",url:`${s}/auth/me`}),logout:()=>w({method:"POST",url:`${s}/auth/logout`,body:{}}),logoutAll:()=>w({method:"POST",url:`${s}/auth/logout-all`,body:{}})}}const Q="/tapscore/manage/".replace(/\/+$/,"").replace(/\/manage$/,"")+"/api",Qt=un(Q);function mn(s){return{async list(){return w({method:"GET",url:`${s}/clubs`})},async get(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return w({method:"GET",url:`${s}/clubs/get${n?"?"+n:""}`})},async create(e){return w({method:"POST",url:`${s}/clubs`,body:e})},async update(e){return w({method:"POST",url:`${s}/clubs/update`,body:e})},async remove(e){return w({method:"DELETE",url:`${s}/clubs/${e.id}`})}}}function pn(s){return{async list(){return w({method:"GET",url:`${s}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return w({method:"GET",url:`${s}/courses/by-club${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return w({method:"GET",url:`${s}/courses/get${n?"?"+n:""}`})},async teeRoleCatalog(){return w({method:"GET",url:`${s}/courses/tee-roles/catalog`})},async teeRoles(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return w({method:"GET",url:`${s}/courses/tee-roles${n?"?"+n:""}`})},async create(e){return w({method:"POST",url:`${s}/courses`,body:e})},async update(e){return w({method:"POST",url:`${s}/courses/update`,body:e})},async updateHole(e){return w({method:"POST",url:`${s}/courses/holes/update`,body:e})},async setTeeRole(e){return w({method:"POST",url:`${s}/courses/tee-roles`,body:e})},async clearTeeRole(e){return w({method:"DELETE",url:`${s}/courses/tee-roles/${e.courseId}/${e.roleKey}/${e.gender}`})},async validate(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return w({method:"GET",url:`${s}/courses/validate${n?"?"+n:""}`})},async remove(e){return w({method:"DELETE",url:`${s}/courses/${e.id}`})}}}function gn(s){return{async listByCourse(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return w({method:"GET",url:`${s}/tees/by-course${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return w({method:"GET",url:`${s}/tees/get${n?"?"+n:""}`})},async create(e){return w({method:"POST",url:`${s}/tees`,body:e})},async update(e){return w({method:"POST",url:`${s}/tees/update`,body:e})},async remove(e){return w({method:"DELETE",url:`${s}/tees/${e.id}`})}}}function fn(s){return{async listByCourse(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return w({method:"GET",url:`${s}/course-route-templates${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return w({method:"GET",url:`${s}/course-route-templates/get${n?"?"+n:""}`})},async validate(e){return w({method:"POST",url:`${s}/course-route-templates/validate`,body:e})},async create(e){return w({method:"POST",url:`${s}/course-route-templates`,body:e})},async update(e){return w({method:"POST",url:`${s}/course-route-templates/update`,body:e})},async remove(e){return w({method:"DELETE",url:`${s}/course-route-templates/${e.id}`})}}}function bn(s){return{async myRoles(){return w({method:"GET",url:`${s}/me/roles`})},async adminStats(){return w({method:"GET",url:`${s}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return w({method:"GET",url:`${s}/admin/rounds${n?"?"+n:""}`})},async adminPlayers(){return w({method:"GET",url:`${s}/admin/players`})},async adminGrantRole(e){return w({method:"POST",url:`${s}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return w({method:"POST",url:`${s}/admin/roles/revoke`,body:e})}}}const N={clubs:mn(Q),courses:pn(Q),tees:gn(Q),courseRouteTemplates:fn(Q),admin:bn(Q)};class se{roles=new m([]);loaded=new m(!1);error=new m(null);inflight=null;isSuperAdmin(){return this.has("super_admin")}canManageCourses(){return this.isSuperAdmin()||this.has("course_admin")}has(e){return this.roles.get().some(t=>t.role===e&&t.scopeType===null)}load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.error.set(null);try{this.roles.set(await N.admin.myRoles())}catch(t){this.roles.set([]),t instanceof O&&t.status===401?st():(this.error.set("Cannot reach the server."),this.inflight=null)}finally{this.loaded.set(!0)}})(),this.inflight)}clear(){this.roles.set([]),this.loaded.set(!1),this.error.set(null),this.inflight=null}}const at=class at extends E{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(b(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};at.styles=`
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
    `;let Ge=at;const x=s=>`var(--${s})`,lt=class lt extends E{render(){const e=document.createElement("div"),t=(c,d)=>{typeof d=="function"?this.track(b(()=>{c.textContent=d()})):c.textContent=d};this.spawn(Ge,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const n=document.createElement("h2");n.className="ui-confirm__title",t(n,this.props.title??"Confirm"),this.dialogEl.appendChild(n);const i=document.createElement("p");i.className="ui-confirm__message",t(i,this.props.message),this.dialogEl.appendChild(i);const o=document.createElement("div");o.className="ui-confirm__actions";const a=document.createElement("button");a.className="ui-confirm__btn ui-confirm__btn--cancel",t(a,this.props.cancelLabel??"Cancel"),a.addEventListener("click",c=>{c.stopPropagation(),this.handleCancel()}),o.appendChild(a);const l=document.createElement("button");return l.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(l,this.props.confirmLabel??"Confirm"),l.addEventListener("click",c=>{c.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),o.appendChild(l),this.dialogEl.appendChild(o),this.dialogEl.addEventListener("click",c=>c.stopPropagation()),e.appendChild(this.dialogEl),this.track(b(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};lt.styles=`
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${x("surface")};
            border: 1px solid ${x("border")};
            border-radius: ${x("radius-md")};
            box-shadow: ${x("shadow-3")};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition:
                opacity ${x("dur-slow")} ${x("ease-standard")},
                transform ${x("dur-slow")} ${x("ease-standard")};
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
            font-family: ${x("font-display")};
            font-size: 1.25rem;
            font-weight: 500;
            line-height: 1.4;
            color: ${x("text")};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-family: ${x("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${x("text")};
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
            font-family: ${x("font-ui")};
            font-weight: 600;
            border: 1px solid transparent;
            border-radius: ${x("radius-sm")};
            cursor: pointer;
            transition:
                background ${x("dur-fast")} ${x("ease-standard")},
                border-color ${x("dur-fast")} ${x("ease-standard")},
                color ${x("dur-fast")} ${x("ease-standard")},
                box-shadow ${x("dur-fast")} ${x("ease-standard")};
        }
        .ui-confirm__btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px ${x("accent-soft")};
        }
        .ui-confirm__btn--cancel {
            background: transparent;
            color: ${x("text-muted")};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${x("accent-soft")};
            color: ${x("accent")};
        }
        .ui-confirm__btn--confirm {
            background: ${x("accent")};
            color: ${x("on-accent")};
            border-color: ${x("accent")};
            box-shadow: ${x("shadow-1")};
        }
        .ui-confirm__btn--confirm:hover {
            background: ${x("accent-strong")};
            border-color: ${x("accent-strong")};
        }
        /* Outline, filling only on hover — same reasoning as css.ts danger. */
        .ui-confirm__btn--danger {
            background: transparent;
            color: ${x("danger")};
            border-color: ${x("danger")};
        }
        .ui-confirm__btn--danger:hover {
            background: ${x("danger")};
            color: ${x("on-danger")};
        }
    `;let X=lt;const $=s=>`var(--${s})`,_=(s,e)=>`var(--${s}, ${e})`,y=s=>{const e=Re[s];if(e===void 0)throw new Error(`unknown control token: --${s}`);return e},u=Us({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),ve=s=>`
    background: ${_(`btn-${s}-bg`,y(`btn-${s}-bg`))};
    color: ${_(`btn-${s}-fg`,y(`btn-${s}-fg`))};
    border-color: ${_(`btn-${s}-border`,y(`btn-${s}-border`))};
    box-shadow: ${_(`btn-${s}-shadow`,y(`btn-${s}-shadow`))};
    &:hover {
        background: ${_(`btn-${s}-bg-hover`,y(`btn-${s}-bg-hover`))};
        color: ${_(`btn-${s}-fg-hover`,y(`btn-${s}-fg-hover`))};
        border-color: ${_(`btn-${s}-border-hover`,y(`btn-${s}-border-hover`))};
    }`,Jt=`
    background: ${_("btn-disabled-bg",y("btn-disabled-bg"))};
    color: ${_("btn-disabled-fg",y("btn-disabled-fg"))};
    border-color: ${_("btn-disabled-border",y("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${_("btn-disabled-opacity",y("btn-disabled-opacity"))};
    cursor: not-allowed;`,_n={primary:ve("primary"),secondary:ve("secondary"),ghost:ve("ghost"),danger:ve("danger"),disabled:Jt},k=(s=_("btn-radius",y("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${_("btn-border-width",y("btn-border-width"))} solid transparent;
    border-radius: ${s};
    padding: ${_("btn-padding-y",y("btn-padding-y"))} ${_("btn-padding-x",y("btn-padding-x"))};
    font-family: ${$("font-ui")};
    font-size: ${_("btn-font-size",y("btn-font-size"))};
    line-height: ${_("btn-line-height",y("btn-line-height"))};
    font-weight: ${_("btn-font-weight",y("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${$("dur-fast")} ${$("ease-standard")},
        border-color ${$("dur-fast")} ${$("ease-standard")},
        color ${$("dur-fast")} ${$("ease-standard")},
        box-shadow ${$("dur-fast")} ${$("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${_("btn-focus-ring-width",y("btn-focus-ring-width"))} ${_("btn-focus-ring",y("btn-focus-ring"))};
    }
    ${_n[e]}
    &:disabled {${Jt}}
`,yn=`max(${_("field-border-width",y("field-border-width"))}, ${_("field-rule-width",y("field-rule-width"))})`,$e=(s,e)=>`
    border-top-color: ${s};
    border-right-color: ${s};
    border-left-color: ${s};
    border-bottom-color: ${e};`,Zt=()=>`
    border-style: solid;
    border-top-width: ${_("field-border-width",y("field-border-width"))};
    border-right-width: ${_("field-border-width",y("field-border-width"))};
    border-left-width: ${_("field-border-width",y("field-border-width"))};
    border-bottom-width: ${yn};
    ${$e(_("field-border",y("field-border")),_("field-rule",y("field-rule")))}
    border-radius: ${_("field-radius",y("field-radius"))};
    padding: ${_("field-padding-y",y("field-padding-y"))} ${_("field-padding-x",y("field-padding-x"))};
    background: ${_("field-bg",y("field-bg"))};
    color: ${$("text")};
    font-family: ${$("font-ui")};
    font-size: ${_("field-font-size",y("field-font-size"))};
    line-height: ${_("field-line-height",y("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${$("dur-fast")} ${$("ease-standard")},
        box-shadow ${$("dur-fast")} ${$("ease-standard")},
        background ${$("dur-fast")} ${$("ease-standard")};
    &::placeholder { color: ${$("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${$e(_("field-focus-border",y("field-focus-border")),_("field-focus-border",y("field-focus-border")))}
        background: ${_("field-bg-focus",y("field-bg-focus"))};
        box-shadow: 0 0 0 ${_("field-focus-ring-width",y("field-focus-ring-width"))} ${_("field-focus-ring",y("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${$e(_("field-invalid-border",y("field-invalid-border")),_("field-invalid-rule",y("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${$e(_("field-invalid-border",y("field-invalid-border")),_("field-invalid-rule",y("field-invalid-rule")))}
        background: ${_("field-bg-focus",y("field-bg-focus"))};
        box-shadow: 0 0 0 ${_("field-focus-ring-width",y("field-focus-ring-width"))} ${_("field-invalid-ring",y("field-invalid-ring"))};
    }
`,es=()=>`
    display: block;
    font-family: ${$("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${$("text-muted")};
`,wn=()=>`
    display: block;
    font-family: ${$("font-ui")};
    font-size: 13px;
    line-height: 20px;
    color: ${$("danger")};
`,M=s=>`
    background: ${$("surface")};
    border: 1px solid ${$("border")};
    border-radius: ${$("radius-md")};
    box-shadow: ${$("shadow-1")};
    ${s?.hover?`
    transition:
        box-shadow ${$("dur-base")} ${$("ease-standard")},
        border-color ${$("dur-base")} ${$("ease-standard")};
    &:hover { box-shadow: ${$("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${es()}
        margin: 0 0 ${u("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${$("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${$("text")};
    }
    & .ui-card__meta {
        margin: ${u("xs")} 0 0 0;
        font-family: ${$("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${$("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${u("md")};
        font-family: ${$("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${$("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;class me{crumbs=new m([]);set(e){this.crumbs.set(e)}}function vn(s,e){return`${e}:${s.label}:${s.path??""}`}const T=s=>`var(--${s})`,dt=class dt extends E{render(){const e=document.createElement("div");e.className="ui-empty-state";const t=a=>typeof a=="function"?a():a,n=(a,l)=>{typeof l=="function"?this.track(b(()=>{a.textContent=t(l)})):a.textContent=l};if(this.props.ornament!==!1){const a=document.createElement("div");a.className="ui-empty-state__ornament",a.setAttribute("aria-hidden","true"),e.appendChild(a)}const i=document.createElement(`h${this.props.headingLevel??3}`);if(i.className="ui-empty-state__heading",n(i,this.props.heading),e.appendChild(i),this.props.body!==void 0){const a=document.createElement("p");a.className="ui-empty-state__body",n(a,this.props.body),e.appendChild(a)}const o=this.props.action;if(o){const a=document.createElement("button");a.className="ui-empty-state__action",a.setAttribute("type","button"),o.ariaLabel&&a.setAttribute("aria-label",o.ariaLabel),n(a,o.label),a.addEventListener("click",()=>o.onclick()),e.appendChild(a)}return e}};dt.styles=`
        .ui-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: ${T("space-3")};
            padding: ${T("space-7")} ${T("space-5")};
        }
        /* The brass ornament: a hairline rule, nothing more. No illustration. */
        .ui-empty-state__ornament {
            width: ${T("space-8")};
            height: 1px;
            background: ${T("brass-line")};
            margin-bottom: ${T("space-2")};
        }
        .ui-empty-state__heading {
            margin: 0;
            font-family: ${T("font-display")};
            font-weight: 500;
            font-size: 1.25rem;
            line-height: 1.4;
            color: ${T("text")};
        }
        .ui-empty-state__body {
            margin: 0;
            max-width: 48ch;
            font-family: ${T("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.6;
            color: ${T("text-muted")};
        }
        .ui-empty-state__action {
            margin-top: ${T("space-2")};
            padding: ${T("space-2")} ${T("space-4")};
            border: 1px solid ${T("accent")};
            border-radius: ${T("radius-sm")};
            background: ${T("accent")};
            color: ${T("on-accent")};
            font-family: ${T("font-ui")};
            font-size: 0.875rem;
            font-weight: 600;
            line-height: 1.5;
            cursor: pointer;
            transition: background ${T("dur-fast")} ${T("ease-standard")},
                        border-color ${T("dur-fast")} ${T("ease-standard")};
        }
        .ui-empty-state__action:hover {
            background: ${T("accent-strong")};
            border-color: ${T("accent-strong")};
        }
        .ui-empty-state__action:focus-visible {
            outline: 2px solid ${T("accent")};
            outline-offset: 2px;
        }
    `;let Ve=dt;const $n=900,xn=`(min-width: ${$n}px)`,ts=660,ss=`(min-width: ${ts}px)`,ns=`(max-width: ${ts-.02}px)`;function kn(s){const e=new m(!1),t=typeof globalThis.matchMedia=="function"?globalThis.matchMedia(s):null;if(!t)return{value:e,dispose:()=>{}};e.set(t.matches);const n=i=>e.set(i.matches);return t.addEventListener("change",n),{value:e,dispose:()=>t.removeEventListener("change",n)}}const gt="__actions";function U(s,e={}){const t=document.createElement("button");return t.type="button",t.className=e.variant==="primary"?"mtable__btn mtable__btn--primary":"mtable__btn",t.textContent=s,e.onclick&&t.addEventListener("click",e.onclick),t}function En(s){return typeof s=="object"&&s!==null&&typeof s.get=="function"}function ft(s,e,t){if(s.textContent="",e instanceof HTMLElement){s.appendChild(e);return}if(e==null||e===""){const n=document.createElement("span");n.className="mtable__empty-cell",n.textContent=t,s.appendChild(n);return}s.appendChild(document.createTextNode(String(e)))}class ne extends E{static styles=`
        /* Worded, muted or danger — never a spinner glyph and never an emoji
           (docs/design-guidelines.md §4).

           Top-level rather than nested under \`.mtable-wrap\`, because
           \`edit.statusHost\` lets a screen host this element outside the table's
           box. The table still owns the look wherever it lands. */
        .mtable__status {
            margin: ${u("xs")} 0 0;
            font-size: 0.8rem;
            line-height: 1.4;
            color: ${r("text-muted")};

            &[hidden] { display: none; }
            &.mtable__status--error { color: ${r("danger")}; font-weight: 600; }
        }

        .mtable-wrap {
            width: 100%;
            min-width: 0;

            & .mtable {
                width: 100%;
                border-collapse: collapse;
                /* Never the display serif in cells. */
                font-family: ${r("font-ui")};
                font-size: 0.875rem;
                line-height: 1.5;
                color: ${r("text")};

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
                font-family: ${r("font-display")};
                font-size: 1.05rem;
                font-weight: 600;
                color: ${r("text")};
                padding: ${r("manage-table-cell-pad-y")} ${r("manage-table-cell-pad-x")} 0;
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
                background: ${r("manage-table-header-bg")};
                color: ${r("manage-table-header-fg")};
                border-bottom: 1px solid ${r("manage-table-header-border")};
                padding: ${r("manage-table-header-pad-y")} ${r("manage-table-header-pad-x")};
                text-align: left;
                /* Overline treatment, same as the framework table's — a Manage
                   header and a framework header should not be two designs. */
                font-family: ${r("font-ui")};
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
                padding: ${r("manage-table-cell-pad-y")} ${r("manage-table-cell-pad-x")};
                border-bottom: 1px solid ${r("manage-table-row-border")};
                vertical-align: middle;
                text-align: left;
                transition: background ${r("dur-fast")} ${r("ease-standard")};
            }

            & .mtable__td--numeric {
                font-variant-numeric: tabular-nums;
                white-space: nowrap;
            }

            & .mtable__cell { min-width: 0; }
            & .mtable__empty-cell { color: ${r("text-muted")}; }

            & .mtable__stacked-label { display: none; }

            & .mtable__actions {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: ${u("sm")};
            }

            & .mtable__btn {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("md")};
                font-size: 0.85rem;
                font-weight: 700;
            }

            & .mtable__btn--primary {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("md")};
                font-size: 0.85rem;
                font-weight: 700;
            }

            & .mtable__empty {
                &[hidden] { display: none; }
            }

            /* ─── Wide: a real grid inside its own scroll box ─── */

            &[data-layout='columns'] {
                background: ${r("manage-table-bg")};
                border: 1px solid ${r("manage-table-border")};
                border-radius: ${r("manage-table-radius")};
                /* The wrapper is the scroll container, so a table too wide for
                   the content column scrolls HERE and the page body never
                   scrolls sideways. It also clips the header fill to the
                   radius, which a border-collapsed table cannot do itself. */
                overflow-x: auto;

                & .mtable__tr:last-child .mtable__td { border-bottom: none; }

                & .mtable__tr:not(.mtable__tr--editing):hover > .mtable__td {
                    background: ${r("manage-table-row-hover-bg")};
                }

                & .mtable__tr--editing > .mtable__td {
                    background: ${r("manage-table-row-editing-bg")};
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
                    padding: 0 0 ${u("sm")};
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
                    gap: ${r("manage-table-card-gap")};
                }

                & .mtable__tr {
                    background: ${r("manage-table-bg")};
                    border: 1px solid ${r("manage-table-border")};
                    border-radius: ${r("manage-table-radius")};
                    padding: ${r("manage-table-cell-pad-y")} ${r("manage-table-cell-pad-x")};
                }

                & .mtable__tr--editing {
                    background: ${r("manage-table-row-editing-bg")};
                }

                & .mtable__td {
                    padding: ${u("xs")} 0;
                    border-bottom: none;
                    white-space: normal;
                }

                & .mtable__stacked-label {
                    display: block;
                    font-family: ${r("font-ui")};
                    font-size: 0.6875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                    color: ${r("manage-table-header-fg")};
                    margin-bottom: 2px;
                }

                & .mtable__td--actions {
                    padding-top: ${r("manage-table-cell-pad-y")};

                    /* Direct children of the action bar, which is why the
                       actions prop takes buttons (or an array of them) and not
                       a wrapper element: a wrapper would be the flex item, and
                       the buttons inside it would keep their content width. */
                    & > .mtable__actions > .mtable__btn { flex: 1 1 auto; }
                }

                & .mtable__empty {
                    background: ${r("manage-table-bg")};
                    border: 1px solid ${r("manage-table-border")};
                    border-radius: ${r("manage-table-radius")};
                }
            }
        }
    `;static seq=0;uid=`mtable-${ne.seq++}`;rowData=new Map;render(){const e=document.createElement("div");e.className="mtable-wrap";const t=document.createElement("table");t.className="mtable",t.setAttribute("role","table");const n=document.createElement("caption");n.className=this.props.captionHidden?"mtable__caption mtable__caption--hidden":"mtable__caption",n.id=`${this.uid}-caption`,n.textContent=this.props.caption,t.appendChild(n),t.setAttribute("aria-labelledby",n.id),t.appendChild(this.head());const i=document.createElement("tbody");if(i.className="mtable__body",i.setAttribute("role","rowgroup"),t.appendChild(i),e.appendChild(t),this.$each(i,()=>this.readRows(),(o,a,l)=>this.renderRow(o,l),o=>this.props.rowKey(o)),this.props.empty){const o=document.createElement("div");o.className="mtable__empty",this.spawn(Ve,o,this.props.empty),e.appendChild(o),this.track(b(()=>{const a=this.rowsValue().length===0;o.hidden=!a,t.hidden=a}))}return this.layout(e),e}layout(e){let t=this.props.narrow;if(!t){const i=kn(ns);this.track(i.dispose),t=i.value}const n=this.props.stacked!==!1;this.track(b(()=>{e.setAttribute("data-layout",n&&t.get()?"stacked":"columns")}))}head(){const e=document.createElement("thead");e.className="mtable__head",e.setAttribute("role","rowgroup");const t=document.createElement("tr");t.className="mtable__tr",t.setAttribute("role","row");for(const n of this.props.columns)t.appendChild(this.th(n.key,n.header));return this.hasActionsColumn()&&t.appendChild(this.th(gt,this.props.actionsHeader??"Actions",!0)),e.appendChild(t),e}th(e,t,n=!1){const i=document.createElement("th");if(i.className="mtable__th",i.setAttribute("role","columnheader"),i.setAttribute("scope","col"),i.setAttribute("data-key",e),n){const o=document.createElement("span");o.className="mtable__th-label--hidden",o.textContent=t,i.appendChild(o)}else i.textContent=t;return i}hasActionsColumn(){return this.props.actions!==void 0||this.props.edit!==void 0}rowsValue(){return En(this.props.rows)?this.props.rows.get():this.props.rows}readRows(){const e=this.rowsValue();return I(()=>{const t=new Set;for(const n of e){const i=this.props.rowKey(n);t.add(i);const o=this.rowData.get(i);o?o.set(n):this.rowData.set(i,new m(n))}for(const n of[...this.rowData.keys()])t.has(n)||this.rowData.delete(n)}),e}signalFor(e){const t=this.props.rowKey(e);let n=this.rowData.get(t);return n||(n=new m(e),this.rowData.set(t,n)),n}renderRow(e,t){const n=this.props.rowKey(e),i={key:n},o=this.signalFor(e),a=this.props.edit,l=this.props.emptyCell??"—",c=()=>a?a.controller.key.get()===n:!1,d=document.createElement("tr");d.className="mtable__tr",d.setAttribute("role","row"),d.setAttribute("data-row-key",n);for(const h of this.props.columns){const p=document.createElement("td");if(p.className=`mtable__td mtable__td--${h.type??"text"}`,p.setAttribute("role","cell"),p.setAttribute("data-key",h.key),h.stackedLabel!==!1){const v=document.createElement("span");v.className="mtable__stacked-label",v.setAttribute("aria-hidden","true"),v.textContent=h.header,p.appendChild(v)}const g=document.createElement("div");g.className="mtable__cell",p.appendChild(g),t(b(()=>{if(c()&&h.editCell){const v=o.peek();ft(g,I(()=>h.editCell(v,i)),l)}else{const v=o.get();ft(g,I(()=>h.cell(v,i)),l)}})),d.appendChild(p)}return this.hasActionsColumn()&&d.appendChild(this.actionsCell(i,o,c,t)),a&&(t(b(()=>{d.classList.toggle("mtable__tr--editing",c())})),t(b(()=>{a.controller.isSaving(n)?d.setAttribute("aria-busy","true"):d.removeAttribute("aria-busy")})),this.editKeys(d,n,o,t),a.autoFocus!==!1&&this.autoFocus(d,c,t)),d}actionsCell(e,t,n,i){const o=this.props.edit,a=document.createElement("td");a.className="mtable__td mtable__td--actions",a.setAttribute("role","cell"),a.setAttribute("data-key",gt);const l=document.createElement("div");l.className="mtable__actions",a.appendChild(l);let c=null,d=null;if(o){c=U(o.saveLabel??"Save",{variant:"primary",onclick:()=>o.oncommit(t.peek())}),d=U(o.cancelLabel??"Cancel",{onclick:()=>{o.controller.cancel(),o.oncancel?.(t.peek())}}),i(b(()=>{const p=o.controller.isSaving(e.key);c.disabled=p,d.disabled=p}));const h=document.createElement("p");h.className="mtable__status",h.setAttribute("role","status"),h.setAttribute("aria-live","polite"),(o.statusHost??a).appendChild(h),i(()=>h.remove()),i(b(()=>{const p=o.controller.errorFor(e.key),g=o.controller.isSaving(e.key);h.textContent=p??(g?o.savingLabel??"Saving…":""),h.className=p?"mtable__status mtable__status--error":"mtable__status",h.hidden=!p&&!g,p&&typeof h.scrollIntoView=="function"&&h.scrollIntoView({block:"nearest"})}))}return i(b(()=>{if(n()&&o){l.textContent="",l.append(c,d);return}const h=t.get(),p=I(()=>this.props.actions?.(h,e));l.textContent="",Array.isArray(p)?l.append(...p):p instanceof HTMLElement?l.appendChild(p):p!=null&&p!==""&&l.appendChild(document.createTextNode(String(p)))})),a}editKeys(e,t,n,i){const o=this.props.edit,a=l=>{if(o.controller.key.peek()===t){if(l.key==="Enter"){if(l.target?.tagName==="TEXTAREA"||(l.preventDefault(),o.controller.phase.peek()==="saving"))return;o.oncommit(n.peek());return}l.key==="Escape"&&(l.preventDefault(),l.stopPropagation(),o.controller.cancel(),o.oncancel?.(n.peek()))}};e.addEventListener("keydown",a),i(()=>e.removeEventListener("keydown",a))}autoFocus(e,t,n){let i=!1,o=!0;n(()=>{o=!1}),n(b(()=>{const a=t();a&&!i&&queueMicrotask(()=>{if(!o||!t())return;const l=e.querySelector('input:not([type="hidden"]), select, textarea');l&&(l.focus(),l instanceof HTMLInputElement&&typeof l.select=="function"&&l.select())}),i=a}))}}function pe(s){return{open:s.open,title:s.title,message:s.consequence,confirmLabel:s.confirmLabel,cancelLabel:s.cancelLabel??"Cancel",danger:!0,onconfirm:s.onconfirm,oncancel:s.oncancel}}function ie(s,e){const t=n=>{n.key!=="Escape"||!s.get()||(s.set(!1),e?.())};return document.addEventListener("keydown",t),()=>document.removeEventListener("keydown",t)}const Se=()=>`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${r("manage-stack-gap")} ${u("lg")};
    align-items: start;

    & .mform__field--full {
        grid-column: 1 / -1;
    }

    @media ${ss} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
`,ge=()=>`
    display: flex;
    flex-direction: column;
    gap: ${u("xs")};
    min-width: 0;
`,fe=()=>`
    ${es()}
`,re=()=>`
    ${Zt()}
    width: 100%;
    min-height: ${r("manage-touch-target")};
`,ee=()=>`
    color: ${r("text-muted")};
    font-size: 0.8rem;
    line-height: 1.4;
`,Ie=()=>`
    ${wn()}
`,is=()=>`
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    border: 1px solid ${r("border")};
    border-radius: ${r("radius-pill")};
    background: ${r("surface-sunken")};
    align-self: flex-start;

    & button {
        appearance: none;
        border: 1px solid transparent;
        background: none;
        min-height: ${r("manage-touch-target")};
        padding: 0 ${u("lg")};
        border-radius: ${r("radius-pill")};
        font-family: inherit;
        font-size: 0.9rem;
        font-weight: 500;
        color: ${r("text-muted")};
        cursor: pointer;
        white-space: nowrap;

        &:hover { color: ${r("text")}; }
        &:focus-visible { outline: 2px solid ${r("accent-strong")}; outline-offset: 2px; }

        /* The live option. \`aria-pressed\` is the state an assistive
           technology reads; this class is the same fact for the eye. */
        &[aria-pressed='true'] {
            background: ${r("surface")};
            border-color: ${r("border")};
            color: ${r("text")};
            font-weight: 700;
        }

        &:disabled { opacity: 0.5; cursor: default; }
    }
`,Cn=()=>`
    overflow-x: auto;
    background: ${r("manage-table-bg")};
    border: 1px solid ${r("manage-table-border")};
    border-radius: ${r("manage-table-radius")};
    /* Momentum scrolling on touch, and a scrollbar that does not eat a row. */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
`,Tn="You no longer have permission to change the course catalog. Ask an administrator to grant you the course_admin role.";function R(s,e){if(!(s instanceof O))return Ne(Nn(s),Sn(s),Ke(s)),e;if(s.status===401)return st(),"Your session expired. Sign in again to continue.";if(s.status===403)return Tn;if(s.status>=400&&s.status<500){if(!s.details?.length)return s.message;const t=s.details.map(n=>`${n.path.replace(/^\//,"")} — ${n.message}`).join("; ");return`${s.message}: ${t}`}return Ne("server",`${s.status} ${s.message}`,Ke(s)),e}function Nn(s){return s instanceof Error?s.message==="Request timeout"?"timeout":"network":"unknown"}function Sn(s){return s instanceof Error?s.message:String(s)}function rs(){return{name:"",location:"",logoUrl:""}}function In(s){return{name:s.name,location:s.location??"",logoUrl:s.logoUrl??""}}function os(s){const e={};s.name.trim()===""&&(e.name="A club needs a name. Enter one before saving.");const t=s.logoUrl.trim();return t!==""&&!Ln(t)&&(e.logoUrl="Enter a full web address starting with https://, or leave this empty."),e}function as(s){return Object.keys(s).length>0}function bt(s){return{name:s.name.trim(),location:s.location.trim()||null,logoUrl:s.logoUrl.trim()||null}}function ls(s,e){const t=e===0?"It has no courses.":e===1?"It has 1 course.":`It has ${e} courses.`;return`${s} leaves the catalog. ${t} Rounds already played keep their own copy of the course data, so no scorecard changes.`}const ds="The club is removed from the catalog.";function Ln(s){try{const e=new URL(s);return e.protocol==="http:"||e.protocol==="https:"}catch{return!1}}function An(s,e){const t=e.trim().toLowerCase().split(/\s+/).filter(n=>n!=="");return t.length===0?s:s.filter(n=>{const i=`${n.name} ${n.location??""}`.toLowerCase();return t.every(o=>i.includes(o))})}class ze{clubs=new m([]);loading=new m(!1);error=new m(null);loaded=new m(!1);query=new m("");visible=new D(()=>An(this.clubs.get(),this.query.get()));inflight=null;load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{this.clubs.set(await N.clubs.list())}catch(t){this.error.set(R(t,"Could not load the clubs. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.clubs.get().find(t=>t.id===e)??null}async create(e){return this.write(()=>N.clubs.create(bt(e)),"Could not create the club. Check your connection and try again.")}async update(e,t){return this.write(()=>N.clubs.update({id:e,...bt(t)}),"Could not save the club. Check your connection and try again.")}async remove(e){return this.write(()=>N.clubs.remove({id:e}),"Could not delete the club. Check your connection and try again.")}async write(e,t){try{await e()}catch(n){return{ok:!1,message:R(n,t)}}return await this.load(!0),{ok:!0}}}const On=C(`
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
`);class cs extends E{static styles=`
        .mclubfields {
            ${Se()}

            & .mclubfields__field {
                ${ge()}
            }

            & .mclubfields__label {
                ${fe()}
            }

            & .mclubfields__control {
                ${re()}
            }

            & .mclubfields__hint {
                ${ee()}
                margin: 0;
            }

            & .mclubfields__error {
                ${Ie()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;draft=new m(rs());inputs={};render(){const e={name:`${this.props.idPrefix}-name`,location:`${this.props.idPrefix}-location`,logoUrl:`${this.props.idPrefix}-logo`},t={name:`${e.name}-error`,logoUrl:`${e.logoUrl}-error`},n={location:`${e.location}-hint`,logoUrl:`${e.logoUrl}-hint`},i=()=>this.props.busy?.get()??!1,o=this.wire(On,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:i,oninput:a=>this.patch("name",a)},nameError:{id:t.name,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},locationLabel:{htmlFor:e.location},location:{id:e.location,"aria-describedby":n.location,disabled:i,oninput:a=>this.patch("location",a)},locationHint:{id:n.location},logoLabel:{htmlFor:e.logoUrl},logoUrl:{id:e.logoUrl,"aria-invalid":()=>String(this.props.errors.get().logoUrl!==void 0),disabled:i,oninput:a=>this.patch("logoUrl",a)},logoHint:{id:n.logoUrl},logoError:{id:t.logoUrl,textContent:()=>this.props.errors.get().logoUrl??"",hidden:()=>this.props.errors.get().logoUrl===void 0}});return this.inputs={name:this.ref(o,"name"),location:this.ref(o,"location"),logoUrl:this.ref(o,"logoUrl")},this.track(b(()=>{_t(this.inputs.name,this.props.errors.get().name?[t.name]:[])})),this.track(b(()=>{const a=[n.logoUrl];this.props.errors.get().logoUrl&&a.push(t.logoUrl),_t(this.inputs.logoUrl,a)})),o}seed(e){this.draft.set({...e});for(const t of["name","location","logoUrl"]){const n=this.inputs[t];n&&(n.value=e[t])}}focusFirst(){this.inputs.name?.focus()}focusInvalid(e){for(const t of["name","logoUrl"]){if(e[t]===void 0)continue;const n=this.inputs[t];return n?(n.focus(),!0):!1}return!1}patch(e,t){const n=t.target.value;this.draft.update(i=>({...i,[e]:n}))}}function _t(s,e){e.length===0?s.removeAttribute("aria-describedby"):s.setAttribute("aria-describedby",e.join(" "))}const P="/courses",nt="/courses/clubs",Rn=`${nt}/:id`;function Le(s){return`${nt}/${s}`}const it="/courses/course",zn=`${it}/:clubId/:courseId`;function Hn(s,e){return`${it}/${s}/${e}`}const Dn=C(`
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
`);class Mn extends E{static styles=`
        .mclubs {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};

            & .mclubs__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${u("md")};
            }

            & .mclubs__heading {
                display: flex;
                flex-direction: column;
                gap: ${u("xs")};
                min-width: 0;
            }

            & .mclubs__title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${r("text")};
            }

            & .mclubs__lead {
                margin: 0;
                max-width: 60ch;
                color: ${r("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            /* The page's forward action — solid fill is earned here, and only
               here on this screen (docs/design-guidelines.md §2). */
            & .mclubs__new {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mclubs__search {
                ${ge()}
                max-width: 28rem;
            }

            & .mclubs__search-label {
                ${fe()}
            }

            & .mclubs__search-input {
                ${re()}
            }

            & .mclubs__note {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.8rem;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclubs__error {
                margin: 0;
                color: ${r("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclubs__panel {
                ${M({})}
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};
                padding: ${r("manage-page-pad")};

                &[hidden] { display: none; }
            }

            & .mclubs__panel-title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.15rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mclubs__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${u("sm")};
            }

            & .mclubs__submit {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mclubs__secondary {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;

                &[hidden] { display: none; }
            }

            & .mclubs__link {
                color: ${r("text")};
                font-weight: 700;
                text-decoration: none;

                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${r("accent-strong")}; outline-offset: 2px; }
            }
        }
    `;router=this.inject(q);crumbs=this.inject(me);clubs=this.inject(ze);createOpen=new m(!1);createBusy=new m(!1);createErrors=new m({});createFailure=new m(null);deleteOpen=new m(!1);deleteTarget=new m(null);deleteFailure=new m(null);deletingId=new m(null);fields=null;searchInput=null;actionEffects=new Map;columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>this.nameLink(e)},{key:"location",header:"Location",cell:e=>e.location},{key:"courses",header:"Courses",type:"numeric",cell:e=>e.courseCount}];render(){const e=this.wire(Dn,{new:{onclick:()=>this.openCreate()},searchLabel:{htmlFor:"manage-clubs-search"},search:{id:"manage-clubs-search",oninput:t=>this.clubs.query.set(t.target.value)},searchNote:{textContent:()=>this.searchNote(),hidden:()=>this.searchNote()===""},createPanel:{hidden:()=>!this.createOpen.get(),onsubmit:t=>{t.preventDefault(),this.create()}},createError:{textContent:()=>this.createFailure.get()??"",hidden:()=>this.createFailure.get()===null},createSubmit:{textContent:()=>this.createBusy.get()?"Creating…":"Create club",disabled:()=>this.createBusy.get()},createCancel:{disabled:()=>this.createBusy.get(),onclick:()=>this.closeCreate()},loadError:{textContent:()=>this.clubs.error.get()??"",hidden:()=>this.clubs.error.get()===null},retry:{hidden:()=>this.clubs.error.get()===null,onclick:()=>{this.clubs.load(!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading clubs…",hidden:()=>this.clubs.loaded.get()}});return this.searchInput=this.ref(e,"search"),this.fields=this.spawn(cs,this.ref(e,"createFields"),{idPrefix:"manage-club-new",errors:this.createErrors,busy:this.createBusy}),this.spawn(ne,this.ref(e,"tableHost"),{columns:this.columns,rows:this.clubs.visible,rowKey:t=>t.id,caption:"Clubs",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Club actions",empty:{heading:()=>this.filtering()?"No clubs match that search":"No clubs yet",body:()=>this.filtering()?"Try a shorter search, or clear it to see every club.":"A club is the top of the catalog: create one, then add its courses.",action:{label:()=>this.filtering()?"Clear search":"New club",onclick:()=>this.filtering()?this.clearSearch():this.openCreate()}}}),this.spawn(X,this.ref(e,"confirmHost"),pe({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this club?"},consequence:()=>this.deleteConsequence(),confirmLabel:"Delete club",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(ie(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.crumbs.set([{label:"Clubs"}]),this.clubs.load();const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.createOpen.get()||this.closeCreate())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}nameLink(e){const t=document.createElement("a");return t.className="mclubs__link",t.href=te+Le(e.id),t.textContent=e.name,t.addEventListener("click",n=>{n.metaKey||n.ctrlKey||n.shiftKey||n.button!==0||(n.preventDefault(),this.router.navigate(Le(e.id)))}),t}rowActions(e){const t=U("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,b(()=>{const n=this.deletingId.get();t.textContent=n===e.id?"Deleting…":"Delete",t.disabled=n!==null})),[t]}filtering(){return this.clubs.query.get().trim()!==""}clearSearch(){this.clubs.query.set(""),this.searchInput&&(this.searchInput.value="",this.searchInput.focus())}searchNote(){if(!this.filtering())return"";const e=this.clubs.visible.get().length,t=this.clubs.clubs.get().length;return`Showing ${e} of ${t} clubs.`}openCreate(){this.resetCreate(),this.createOpen.set(!0),this.fields?.focusFirst()}closeCreate(){this.createOpen.set(!1),this.resetCreate()}resetCreate(){this.createErrors.set({}),this.createFailure.set(null),this.fields?.seed(rs())}async create(){if(this.createBusy.get()||!this.fields)return;const e=this.fields.draft.get(),t=os(e);if(this.createErrors.set(t),as(t)){this.createFailure.set(null),this.fields.focusInvalid(t);return}this.createBusy.set(!0),this.createFailure.set(null);const n=await this.clubs.create(e);if(this.createBusy.set(!1),!n.ok){this.createFailure.set(n.message);return}this.closeCreate()}deleteConsequence(){const e=this.deleteTarget.get();return e?ls(e.name,e.courseCount):ds}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.clubs.remove(e.id);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}const Pn="Could not save. Check your connection and try again.";class ue{key=new m(null);phase=new m("idle");error=new m(null);begin(e){this.phase.get()!=="saving"&&(this.key.set(e),this.phase.set("editing"),this.error.set(null))}cancel(){this.phase.get()!=="saving"&&(this.key.set(null),this.phase.set("idle"),this.error.set(null))}async commit(e){if(this.key.get()===null||this.phase.get()==="saving")return!1;this.phase.set("saving"),this.error.set(null);let t;try{t=await e()}catch{t={ok:!1,message:Pn}}return t.ok?(this.key.set(null),this.phase.set("idle"),this.error.set(null),!0):(this.phase.set("failed"),this.error.set(t.message),!1)}fail(e){this.key.get()!==null&&(this.phase.set("failed"),this.error.set(e))}isEditing(e){return this.key.get()===e}isSaving(e){return this.key.get()===e&&this.phase.get()==="saving"}errorFor(e){return this.key.get()===e&&this.phase.get()==="failed"?this.error.get():null}}const yt=[9,18],Ye="Paste as latitude, longitude — e.g. 57.7089, 11.9746. Use a dot for decimals";function hs(){return{name:"",holeCount:18,coordinates:""}}function Fn(s){return{name:s.name,holeCount:s.holeCount===9?9:18,coordinates:us(s.latitude,s.longitude)}}function us(s,e){return s===null||e===null?"":`${xt(s)}, ${xt(e)}`}function ms(s){const e=s.trim();if(e==="")return{ok:!0,position:{latitude:null,longitude:null}};const t=(e.includes(",")?e.split(","):e.split(/\s+/)).map(o=>o.trim()).filter(o=>o!=="");if(t.length!==2)return{ok:!1,message:Ye};const[n,i]=t.map(Kn);return n===null||i===null?{ok:!1,message:Ye}:{ok:!0,position:{latitude:n,longitude:i}}}function jn(s){const e={};s.name.trim()===""&&(e.name="A course needs a name. Enter one before saving.");const t=ms(s.coordinates);return t.ok||(e.coordinates=t.message),e}function Un(s){return Object.keys(s).length>0}function wt(s){const e=ms(s.coordinates),t=e.ok?e.position:{latitude:null,longitude:null};return{name:s.name.trim(),holeCount:s.holeCount,latitude:t.latitude,longitude:t.longitude}}function Bn(s){return`${s} leaves the catalog, and its holes, tees and tee-role settings go with it. Rounds already played keep their own copy of the course data, so no scorecard changes.`}const qn="The course is removed from the catalog, along with its holes and tees.";function vt(s){const e=s.issues.filter(n=>n.severity==="error").length;if(!s.ok||e>0)return{status:"issues",count:Math.max(e,1)};const t=s.issues.length;return t>0?{status:"warnings",count:t}:{status:"ready"}}function ps(s){switch(s.status){case"checking":return"Checking…";case"ready":return"Ready";case"warnings":return $t(s.count,"warning","warnings");case"issues":return $t(s.count,"issue","issues");case"unknown":return"Not checked"}}function gs(s){switch(s.status){case"ready":return"ready";case"warnings":return"warn";case"issues":return"error";default:return"muted"}}function $t(s,e,t){return`${s} ${s===1?e:t}`}function Kn(s){if(!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(s))return null;const e=Number(s);return Number.isFinite(e)?e:null}function xt(s){return String(Number(s.toFixed(6)))}const Me={status:"checking"};class be{clubId=new m(null);courses=new m([]);readiness=new m({});validations=new m({});loading=new m(!1);error=new m(null);loaded=new m(!1);rows=new D(()=>{const e=this.readiness.get();return this.courses.get().map(t=>({...t,readiness:e[t.id]??Me}))});clubs=B.get(ze);inflight=null;load(e,t=!1){return this.clubId.get()!==e&&(this.clubId.set(e),this.courses.set([]),this.readiness.set({}),this.validations.set({}),this.loaded.set(!1),this.inflight=null),!t&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{const n=await N.courses.listByClub({clubId:e});if(this.clubId.get()!==e)return;this.courses.set(n),this.checkReadiness(n)}catch(n){this.error.set(R(n,"Could not load the courses. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.courses.get().find(t=>t.id===e)??null}async create(e,t){const{name:n,holeCount:i,latitude:o,longitude:a}=wt(t);return this.write(()=>N.courses.create({clubId:e,name:n,holeCount:i,latitude:o,longitude:a}),"Could not create the course. Check your connection and try again.",!0)}async update(e,t){const{name:n,holeCount:i,latitude:o,longitude:a}=wt(t);return this.write(()=>N.courses.update({id:e,name:n,holeCount:i,latitude:o,longitude:a}),"Could not save the course. Check your connection and try again.",!1)}async remove(e){return this.write(()=>N.courses.remove({id:e}),"Could not delete the course. Check your connection and try again.",!0)}async saveHole(e,t,n){return this.writeCourse(()=>N.courses.updateHole({courseId:e,holeNumber:t,...n}),"Could not save the hole. Check your connection and try again.")}async saveHoles(e,t,n){return this.writeCourse(()=>N.courses.update({id:e,holes:t}),n??"Could not save the holes. Check your connection and try again.")}async refreshReadiness(e){if(!this.holds(e))return;this.publish(e,Me,null);let t;try{t=await N.courses.validate({id:e})}catch{this.publish(e,{status:"unknown"},null);return}this.holds(e)&&this.publish(e,vt(t),t)}holds(e){return this.courses.peek().some(t=>t.id===e)}async writeCourse(e,t){let n;try{n=await e()}catch(i){return{ok:!1,message:R(i,t)}}return this.applyCourse(n),this.refreshReadiness(n.id),{ok:!0}}applyCourse(e){this.holds(e.id)&&this.courses.update(t=>t.map(n=>n.id===e.id?{...n,...e}:n))}async write(e,t,n){try{await e()}catch(o){return{ok:!1,message:R(o,t)}}const i=this.clubId.get();return await Promise.all([i===null?Promise.resolve():this.load(i,!0),n?this.clubs.load(!0):Promise.resolve()]),{ok:!0}}checkReadiness(e){this.readiness.set(Object.fromEntries(e.map(t=>[t.id,Me]))),this.validations.set({});for(const t of e)(async()=>{let n=null,i;try{n=await N.courses.validate({id:t.id}),i=vt(n)}catch{i={status:"unknown"}}this.holds(t.id)&&this.publish(t.id,i,n)})()}publish(e,t,n){this.readiness.update(i=>({...i,[e]:t})),this.validations.update(i=>{if(n===null){if(!(e in i))return i;const o={...i};return delete o[e],o}return{...i,[e]:n}})}}const Wn=C(`
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
`);class Gn extends E{static styles=`
        .mcoursefields {
            ${Se()}

            & .mcoursefields__field {
                ${ge()}
            }

            & .mcoursefields__label {
                ${fe()}
            }

            & .mcoursefields__control {
                ${re()}
            }

            & .mcoursefields__seg {
                ${is()}
            }

            & .mcoursefields__hint {
                ${ee()}
                margin: 0;
            }

            & .mcoursefields__error {
                ${Ie()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;draft=new m(hs());nameInput=null;coordsInput=null;holeButtons=[];render(){const e={name:`${this.props.idPrefix}-name`,holes:`${this.props.idPrefix}-holes`,coordinates:`${this.props.idPrefix}-coords`},t={name:`${e.name}-error`,coordinates:`${e.coordinates}-error`},n={holes:`${e.holes}-hint`,coordinates:`${e.coordinates}-hint`},i=()=>this.props.busy?.get()??!1,o=this.wire(Wn,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:i,oninput:l=>this.patch({name:l.target.value})},nameError:{id:t.name,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},holesLabel:{id:`${e.holes}-label`},holes:{id:e.holes,"aria-labelledby":`${e.holes}-label`,"aria-describedby":n.holes},holesHint:{id:n.holes,textContent:"Changing this only changes the count — finish the new holes in the holes editor; readiness flags the gap until then.",hidden:()=>!(this.props.existing?.get()??!1)},coordsLabel:{htmlFor:e.coordinates},coordinates:{id:e.coordinates,"aria-invalid":()=>String(this.props.errors.get().coordinates!==void 0),disabled:i,oninput:l=>this.patch({coordinates:l.target.value})},coordsHint:{id:n.coordinates,textContent:`${Ye}. Optional; clear the field to remove the position.`},coordsError:{id:t.coordinates,textContent:()=>this.props.errors.get().coordinates??"",hidden:()=>this.props.errors.get().coordinates===void 0}});this.nameInput=this.ref(o,"name"),this.coordsInput=this.ref(o,"coordinates");const a=this.ref(o,"holes");return this.holeButtons=yt.map(l=>{const c=document.createElement("button");return c.type="button",c.textContent=String(l),c.addEventListener("click",()=>this.patch({holeCount:l})),a.appendChild(c),c}),this.track(b(()=>{const l=this.draft.get().holeCount,c=i();this.holeButtons.forEach((d,h)=>{d.setAttribute("aria-pressed",String(yt[h]===l)),d.disabled=c})})),this.track(b(()=>{kt(this.nameInput,this.props.errors.get().name?[t.name]:[])})),this.track(b(()=>{const l=[n.coordinates];this.props.errors.get().coordinates&&l.push(t.coordinates),kt(this.coordsInput,l)})),o}seed(e){this.draft.set({...e}),this.nameInput&&(this.nameInput.value=e.name),this.coordsInput&&(this.coordsInput.value=e.coordinates)}focusFirst(){this.nameInput?.focus()}focusInvalid(e){return e.name!==void 0&&this.nameInput?(this.nameInput.focus(),!0):e.coordinates!==void 0&&this.coordsInput?(this.coordsInput.focus(),!0):!1}patch(e){this.draft.update(t=>({...t,...e}))}}function kt(s,e){e.length===0?s.removeAttribute("aria-describedby"):s.setAttribute("aria-describedby",e.join(" "))}const xe="__new",Vn=C(`
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
`);class Yn extends E{static styles=`
        .mcourses {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};

            & .mcourses__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${u("md")};
            }

            & .mcourses__heading {
                display: flex;
                flex-direction: column;
                gap: ${u("xs")};
                min-width: 0;
            }

            & .mcourses__title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.35rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mcourses__lead {
                margin: 0;
                max-width: 60ch;
                color: ${r("text-muted")};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mcourses__new {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mcourses__note {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.8rem;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mcourses__error {
                margin: 0;
                color: ${r("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mcourses__panel {
                ${M({})}
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};
                padding: ${r("manage-page-pad")};

                &[hidden] { display: none; }
            }

            & .mcourses__panel-title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.1rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mcourses__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${u("sm")};
            }

            & .mcourses__submit {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mcourses__secondary {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;

                &[hidden] { display: none; }
            }

            & .mcourses__link {
                color: ${r("text")};
                font-weight: 700;
                text-decoration: none;

                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${r("accent-strong")}; outline-offset: 2px; }
            }

            /* The readiness badge. A worded pill, never a coloured dot — colour
               is the SECOND signal here and the text carries the state on its
               own (docs/design-guidelines.md §4). */
            & .mcourses__badge {
                display: inline-block;
                padding: 2px ${u("sm")};
                border: 1px solid ${r("border")};
                border-radius: ${r("radius-pill")};
                background: ${r("surface-sunken")};
                color: ${r("text-muted")};
                font-size: 0.78rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mcourses__badge--ready {
                border-color: ${r("accent-strong")};
                color: ${r("accent-strong")};
            }

            /* Brass: a warning is DECORATIVE emphasis, not a refusal. */
            & .mcourses__badge--warn {
                border-color: ${r("accent")};
                color: ${r("accent")};
            }

            & .mcourses__badge--error {
                border-color: ${r("danger")};
                color: ${r("danger")};
            }

            & .mcourses__muted { color: ${r("text-muted")}; }
        }
    `;router=this.inject(q);courses=this.inject(be);editor=new ue;errors=new m({});deleteOpen=new m(!1);deleteTarget=new m(null);deleteFailure=new m(null);deletingId=new m(null);fields=null;actionEffects=new Map;columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>this.nameLink(e)},{key:"holes",header:"Holes",type:"numeric",cell:e=>e.holeCount},{key:"tees",header:"Tees",type:"numeric",cell:e=>e.teeCount},{key:"position",header:"Position",cell:e=>{const t=us(e.latitude,e.longitude);if(t!=="")return t;const n=document.createElement("span");return n.className="mcourses__muted",n.textContent="Not set",n}},{key:"readiness",header:"Readiness",cell:e=>this.badge(e)}];render(){const e=this.wire(Vn,{new:{disabled:()=>this.editing()||this.deletingId.get()!==null,onclick:()=>this.openCreate()},panel:{hidden:()=>!this.editing(),onsubmit:t=>{t.preventDefault(),this.submit()}},panelTitle:{textContent:()=>this.panelTitle()},panelError:{textContent:()=>this.panelError()??"",hidden:()=>this.panelError()===null},submit:{textContent:()=>this.submitLabel(),disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.closePanel()},loadError:{textContent:()=>this.courses.error.get()??"",hidden:()=>this.courses.error.get()===null},retry:{hidden:()=>this.courses.error.get()===null,onclick:()=>{this.courses.load(this.props.clubId,!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading courses…",hidden:()=>this.courses.loaded.get()}});return this.fields=this.spawn(Gn,this.ref(e,"fieldsHost"),{idPrefix:"manage-course",errors:this.errors,busy:{get:()=>this.saving()},existing:{get:()=>this.editing()&&!this.creating()}}),this.spawn(ne,this.ref(e,"tableHost"),{columns:this.columns,rows:this.courses.rows,rowKey:t=>t.id,caption:"Courses",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Course actions",empty:{heading:"No courses yet",body:"Add the club’s first course, then set its holes and tees.",action:{label:"New course",onclick:()=>this.openCreate()}}}),this.spawn(X,this.ref(e,"confirmHost"),pe({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this course?"},consequence:()=>{const t=this.deleteTarget.get();return t?Bn(t.name):qn},confirmLabel:"Delete course",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(ie(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.courses.load(this.props.clubId);const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.editing()||this.saving()||this.closePanel())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}editing(){return this.editor.key.get()!==null}creating(){return this.editor.key.get()===xe}saving(){const e=this.editor.key.get();return e!==null&&this.editor.isSaving(e)}panelTitle(){if(this.creating())return"New course";const e=this.openCourse();return e?`Edit ${e.name}`:"Edit course"}submitLabel(){return this.creating()?this.saving()?"Creating…":"Create course":this.saving()?"Saving…":"Save course"}panelError(){const e=this.editor.key.get();return e===null?null:this.editor.errorFor(e)}openCourse(){const e=this.editor.key.get();return e===null||e===xe?null:this.courses.rows.get().find(t=>t.id===e)??null}openCreate(){this.saving()||(this.errors.set({}),this.editor.begin(xe),this.fields?.seed(hs()),this.fields?.focusFirst())}openEdit(e){this.saving()||(this.errors.set({}),this.editor.begin(e.id),this.fields?.seed(Fn(e)),this.fields?.focusFirst())}closePanel(){this.editor.cancel(),this.errors.set({})}async submit(){if(!this.fields||this.saving())return;const e=this.editor.key.get();if(e===null)return;this.deleteFailure.set(null);const t=this.fields.draft.get(),n=jn(t);if(this.errors.set(n),Un(n)){this.fields.focusInvalid(n);return}await this.editor.commit(()=>e===xe?this.courses.create(this.props.clubId,t):this.courses.update(e,t))}nameLink(e){const t=Hn(this.props.clubId,e.id),n=document.createElement("a");return n.className="mcourses__link",n.href=te+t,n.textContent=e.name,n.addEventListener("click",i=>{i.metaKey||i.ctrlKey||i.shiftKey||i.button!==0||(i.preventDefault(),this.router.navigate(t))}),n}badge(e){const t=document.createElement("span");return t.className=`mcourses__badge mcourses__badge--${gs(e.readiness)}`,t.textContent=ps(e.readiness),t}rowActions(e){const t=U("Edit",{onclick:()=>this.openEdit(e)}),n=U("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,b(()=>{const i=this.deletingId.get(),o=i!==null||this.editing();n.textContent=i===e.id?"Deleting…":"Delete",n.disabled=o,t.disabled=o})),[t,n]}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.courses.remove(e.id);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}const Xn=C(`
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
`);class Qn extends E{static styles=`
        .mclub {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};

            & .mclub__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${u("md")};
            }

            & .mclub__heading {
                display: flex;
                flex-direction: column;
                gap: ${u("xs")};
                min-width: 0;
            }

            & .mclub__title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${r("text")};
            }

            & .mclub__lead {
                margin: 0;
                max-width: 60ch;
                color: ${r("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mclub__note {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.8rem;

                &[hidden] { display: none; }
            }

            & .mclub__error {
                margin: 0;
                color: ${r("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mclub__missing,
            & .mclub__body {
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};

                &[hidden] { display: none; }
            }

            & .mclub__panel {
                ${M({})}
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};
                padding: ${r("manage-page-pad")};
            }

            & .mclub__panel-head {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${u("sm")};
            }

            & .mclub__panel-title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.15rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mclub__facts {
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};
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
                font-family: ${r("font-ui")};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${r("text-muted")};
            }

            & .mclub__fact-value {
                margin: 0;
                color: ${r("text")};
                font-size: 0.95rem;
                line-height: 1.5;
                overflow-wrap: anywhere;
            }

            & .mclub__form {
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};

                &[hidden] { display: none; }
            }

            & .mclub__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${u("sm")};
            }

            & .mclub__primary {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mclub__secondary {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
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
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mclub__courses:empty { display: none; }
        }
    `;router=this.inject(q);crumbs=this.inject(me);clubs=this.inject(ze);params=this.router.params(Rn);editor=new ue;errors=new m({});deleteOpen=new m(!1);deleteFailure=new m(null);deleting=new m(!1);fields=null;render(){const e=this.wire(Xn,{loadingNote:{textContent:"Loading club…",hidden:()=>this.clubs.loaded.get()},loadError:{textContent:()=>this.clubs.error.get()??"",hidden:()=>this.clubs.error.get()===null},retry:{hidden:()=>this.clubs.error.get()===null,onclick:()=>{this.clubs.load(!0)}},missing:{hidden:()=>!this.clubs.loaded.get()||this.clubs.error.get()!==null||this.club()!==null},backMissing:{onclick:()=>this.router.navigate(P)},body:{hidden:()=>this.club()===null},title:()=>this.club()?.name??"",subtitle:()=>this.courseSummary(),remove:{textContent:()=>this.deleting.get()?"Deleting…":"Delete club",disabled:()=>this.editing()||this.deleting.get(),onclick:()=>{this.deleteFailure.set(null),this.deleteOpen.set(!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},edit:{hidden:()=>this.editing(),disabled:()=>this.deleting.get(),onclick:()=>this.beginEdit()},facts:{hidden:()=>this.editing()},factName:()=>this.club()?.name??"",factLocation:()=>this.club()?.location??"Not recorded",factLogo:()=>this.club()?.logoUrl??"Not recorded",form:{hidden:()=>!this.editing(),onsubmit:n=>{n.preventDefault(),this.save()}},saveError:{textContent:()=>this.editor.errorFor(this.clubId())??"",hidden:()=>this.editor.errorFor(this.clubId())===null},save:{textContent:()=>this.saving()?"Saving…":"Save",disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.cancelEdit()}});this.fields=this.spawn(cs,this.ref(e,"fieldsHost"),{idPrefix:"manage-club-edit",errors:this.errors,busy:{get:()=>this.saving()}});const t=this.clubId();return t!==""&&this.spawn(Yn,this.ref(e,"coursesHost"),{clubId:t}),this.spawn(X,this.ref(e,"confirmHost"),pe({open:this.deleteOpen,title:()=>{const n=this.club();return n?`Delete ${n.name}?`:"Delete this club?"},consequence:()=>this.deleteConsequence(),confirmLabel:"Delete club",onconfirm:()=>{this.remove()}})),this.track(ie(this.deleteOpen)),e}onMount(){this.clubs.load(),this.track(b(()=>{const e=this.club();this.crumbs.set([{label:"Clubs",path:P},{label:e?.name??"Club"}])})),this.clubId()===""&&this.router.navigate(P,!0)}clubId(){return this.params.get().id}club(){const e=this.clubId();return e===""?null:this.clubs.byId(e)}editing(){return this.editor.isEditing(this.clubId())}saving(){return this.editor.isSaving(this.clubId())}courseSummary(){const e=this.club();return e?e.courseCount===0?"No courses yet.":e.courseCount===1?"1 course.":`${e.courseCount} courses.`:""}beginEdit(){const e=this.club();e&&(this.errors.set({}),this.editor.begin(e.id),this.fields?.seed(In(e)),this.fields?.focusFirst())}cancelEdit(){this.editor.cancel(),this.errors.set({})}save(){const e=this.club();if(!e||!this.fields||this.saving())return;const t=this.fields.draft.get(),n=os(t);if(this.errors.set(n),as(n)){this.fields.focusInvalid(n);return}this.editor.commit(()=>this.clubs.update(e.id,t))}deleteConsequence(){const e=this.club();return e?ls(e.name,e.courseCount):ds}async remove(){const e=this.club();if(!(!e||this.deleting.get())){this.deleteFailure.set(null),this.deleting.set(!0);try{const t=await this.clubs.remove(e.id);if(!t.ok){this.deleteFailure.set(t.message);return}this.router.navigate(P,!0)}finally{this.deleting.set(!1)}}}}function Jn(s){return{par:String(s.par),strokeIndex:String(s.strokeIndex)}}function Xe(){return{par:"",strokeIndex:""}}function fs(s,e){const t=Nt(s.par);if(t===null||t<1)return{ok:!1,message:"Par is a whole number of strokes — 3, 4 or 5 on nearly every hole. Enter one and save again."};const n=Nt(s.strokeIndex);return n===null||n<1||n>e?{ok:!1,message:`Stroke index runs from 1 to ${e}, one number per hole. Enter one in that range and save again.`}:{ok:!0,par:t,strokeIndex:n}}function Zn(s,e){const t=s.filter(l=>l.holeNumber>=1&&l.holeNumber<=e),n=(l,c)=>t.filter(d=>d.holeNumber>=l&&d.holeNumber<=c),i=(l,c)=>n(l,c).reduce((d,h)=>d+h.par,0),o=(l,c)=>n(l,c).length===0?null:i(l,c),a=e>9;return{front:a?o(1,9):null,back:a?o(10,e):null,split:a,total:i(1,e),counted:t.length,expected:e,extra:s.length-t.length}}function Et(s){return s===null?"—":String(s)}function Ct(s){const e=[],t=s.expected-s.counted;return t>0&&e.push(`Counted over the ${s.counted} ${V(s.counted)} that have values — ${t} of the course’s ${s.expected} ${V(s.expected)} ${t===1?"has":"have"} no row yet.`),s.extra>0&&e.push(`${Y(G(s.extra,"hole row","hole rows"))} sit beyond hole ${s.expected} and ${s.extra===1?"is":"are"} not counted.`),e.length>0?e.join(" "):null}function Ae(s,e){const t=new Set(s.map(i=>i.holeNumber)),n=[];for(let i=1;i<=e;i+=1)t.has(i)||n.push(i);return n}function rt(s,e){const t=new Set(s.map(i=>i.strokeIndex)),n=[];for(let i=1;i<=e;i+=1)t.has(i)||n.push(i);return n}function ei(s,e,t){const n=ot(s,t);if(n.length>0)return{ok:!1,message:`This course also has ${G(n.length,"hole row","hole rows")} beyond hole ${t}. Remove those rows in the panel below, or set the hole count to match the course on the club page — adding holes cannot resolve either.`};const i=[...s];for(const l of Ae(s,t)){const c=e.get(l)??Xe(),d=fs(c,t);if(!d.ok)return{ok:!1,message:`Hole ${l}: ${ai(d.message)}`};i.push({holeNumber:l,par:d.par,strokeIndex:d.strokeIndex})}const o=bs(i);if(o){const c=s.some(d=>d.holeNumber===o.holes[0])&&s.some(d=>d.holeNumber===o.holes[1])?"Change one of them in the grid above first.":"Give the new hole one of the free numbers.";return{ok:!1,message:`Holes ${o.holes[0]} and ${o.holes[1]} would both have stroke index ${o.strokeIndex}. Every hole needs its own number from 1 to ${t}. ${c}`}}const a=rt(i,t);return a.length>0?{ok:!1,message:`Stroke ${a.length===1?"index":"indices"} ${Z(a)} would be left unused. Every number from 1 to ${t} has to appear exactly once.`}:{ok:!0,holes:[...i].sort((l,c)=>l.holeNumber-c.holeNumber)}}function ot(s,e){return s.filter(t=>t.holeNumber<1||t.holeNumber>e).sort((t,n)=>t.holeNumber-n.holeNumber)}function Tt(s,e){const t=ot(s,e);if(t.length===0)return{ok:!1,message:"This course has no hole rows beyond its hole count."};const n=s.filter(c=>c.holeNumber>=1&&c.holeNumber<=e).sort((c,d)=>c.holeNumber-d.holeNumber),i=Ae(n,e);if(i.length>0)return{ok:!1,message:`${Y(V(i.length))} ${Z(i)} ${i.length===1?"has":"have"} no row either, so removing these would leave the course incomplete. Add the missing ${V(i.length)} first.`};const o=n.filter(c=>c.strokeIndex<1||c.strokeIndex>e);if(o.length>0)return{ok:!1,message:`${Y(V(o.length))} ${Z(o.map(c=>c.holeNumber))} still ${o.length===1?"has a stroke index":"have stroke indices"} above ${e}. A ${e}-hole course hands out stroke indices 1 to ${e}, so give ${o.length===1?"it":"them"} a number in that range in the grid above, then remove these rows.`};const a=bs(n);if(a)return{ok:!1,message:`Holes ${a.holes[0]} and ${a.holes[1]} both have stroke index ${a.strokeIndex}. Every one of the course’s ${e} holes needs its own number from 1 to ${e}. Change one of them in the grid above, then remove these rows.`};const l=rt(n,e);return l.length>0?{ok:!1,message:`Stroke ${l.length===1?"index":"indices"} ${Z(l)} ${l.length===1?"is":"are"} not assigned to any of the course’s ${e} holes. Hand ${l.length===1?"it":"them"} out in the grid above, then remove these rows.`}:{ok:!0,holes:n,removed:t}}function ti(s){return`Hole ${s.holeNumber} — par ${s.par}, stroke index ${s.strokeIndex}`}function si(s,e){if(s.length===0)return"";const t=s.map(n=>n.holeNumber);return`This course is set to ${e} holes, but ${G(s.length,"row","rows")} beyond that ${s.length===1?"is":"are"} still stored — ${V(t.length)} ${Z(t)}. A hole-count change leaves them behind on purpose, because the par and stroke index on them are real numbers somebody typed. They count towards nothing, and the course check reports them until they are gone.`}function ni(s,e,t){const n=s.map(i=>i.holeNumber);return`${Y(V(n.length))} ${Z(n)} — and the par and stroke index stored on ${n.length===1?"it":"them"} — are deleted from ${e}. The course keeps its ${t} holes. This cannot be undone.`}function bs(s){const e=new Map;for(const t of[...s].sort((n,i)=>n.holeNumber-i.holeNumber)){const n=e.get(t.strokeIndex);if(n!==void 0)return{strokeIndex:t.strokeIndex,holes:[n,t.holeNumber]};e.set(t.strokeIndex,t.holeNumber)}return null}function ii(s,e){return s.issues.map((t,n)=>({key:`${n}:${t.code}:${t.message}`,severity:t.severity,severityLabel:t.severity==="error"?"Problem":"Warning",explanation:ri(t.code,e),detail:t.message}))}function ri(s,e){switch(s){case"missing_holes":return"These holes have no par or stroke index yet, so the course is not complete. Add them below.";case"unexpected_holes":return`The course is set to ${e} holes, but rows exist past that. Remove them in the panel below, or change the hole count on the club page if the course really has them.`;case"duplicate_stroke_index":return"Two holes share a stroke index. Handicap strokes are handed out in stroke-index order, so each hole needs its own number.";case"missing_stroke_indices":return`Some numbers between 1 and ${e} are not assigned to any hole. Every one of them has to appear exactly once.`;case"stroke_index_out_of_range":return`A stroke index outside 1 to ${e} cannot be resolved when a round hands out strokes.`;case"unusual_par":return"A par outside 3 to 6 is unusual, not wrong. It saves as it is — worth a second look.";default:return"The course check reported this."}}function oi(s,e,t){if(s.status==="checking")return"Checking the course…";if(s.status==="unknown"||e===null)return"The course check did not run, so nothing here is confirmed. It runs again after the next save.";const n=e.issues.filter(o=>o.severity==="error").length,i=e.issues.length-n;return n===0&&i===0?`Nothing to fix — every hole has a par, and the stroke indices run 1 to ${t}, once each.`:n===0?`${Y(G(i,"warning","warnings"))}, nothing that blocks play.`:i===0?`${Y(G(n,"problem","problems"))} to fix.`:`${Y(G(n,"problem","problems"))} to fix, and ${G(i,"warning","warnings")}.`}function G(s,e,t){return`${s} ${s===1?e:t}`}function V(s){return s===1?"hole":"holes"}function Z(s){return s.length<=2?s.join(" and "):`${s.slice(0,-1).join(", ")} and ${s[s.length-1]}`}function Y(s){return s.charAt(0).toUpperCase()+s.slice(1)}function ai(s){return s.charAt(0).toLowerCase()+s.slice(1)}function Nt(s){const e=s.trim();if(!/^\d+$/.test(e))return null;const t=Number(e);return Number.isSafeInteger(t)?t:null}const oe="__fill";function St(s,e){return`Hole ${s.holeNumber} — ${e}`}const li=C(`
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

        <section bind="trim" class="mholes__panel">
            <h3 class="mholes__panel-title">Hole rows beyond the course’s count</h3>
            <p bind="trimLead" class="mholes__lead"></p>
            <ul bind="trimLoss" class="mholes__loss"></ul>
            <p bind="trimBlocked" class="mholes__note"></p>
            <button bind="trimOpen" class="mholes__danger" type="button"></button>
            <p bind="trimError" class="mholes__error" role="alert"></p>
        </section>

        <div bind="confirmHost"></div>
    </section>
`);class di extends E{static styles=`
        .mholes {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};

            & .mholes__heading {
                display: flex;
                flex-direction: column;
                gap: ${u("xs")};
                min-width: 0;
            }

            & .mholes__title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.35rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mholes__lead {
                margin: 0;
                max-width: 60ch;
                color: ${r("text-muted")};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mholes__note {
                margin: 0;
                max-width: 70ch;
                color: ${r("text-muted")};
                font-size: 0.85rem;
                line-height: 1.45;

                &[hidden] { display: none; }
            }

            & .mholes__error {
                margin: 0;
                max-width: 70ch;
                color: ${r("danger")};
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
                    background: ${r("surface")};
                    border-top: 1px solid ${r("manage-table-border")};
                    padding: ${u("sm")} 0;
                }

                & .mtable__status { text-align: left; margin: 0; }
            }

            /* The par figures. A definition list rather than three bare
               numbers: each figure says what it is beside the number, which is
               the difference between "36" and "Front nine 36". */
            & .mholes__summary {
                display: flex;
                flex-wrap: wrap;
                gap: ${u("lg")};
                margin: 0;
            }

            & .mholes__fact {
                display: flex;
                flex-direction: column;
                gap: 2px;

                &[hidden] { display: none; }
            }

            & .mholes__fact-key {
                font-family: ${r("font-ui")};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${r("text-muted")};
            }

            & .mholes__fact-value {
                margin: 0;
                font-size: 1.15rem;
                font-weight: 700;
                font-variant-numeric: tabular-nums;
                color: ${r("text")};
            }

            /* The per-cell editors. Sized to two digits so the grid stays
               narrow, with the Manage touch floor kept — density here comes
               from spacing, never from smaller hit areas (spec §2.5). */
            & .mholes__input {
                ${re()}
                width: 5rem;
                text-align: right;
                font-variant-numeric: tabular-nums;
            }

            & .mholes__panel {
                ${M({})}
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};
                padding: ${r("manage-page-pad")};
                align-items: flex-start;

                &[hidden] { display: none; }
            }

            & .mholes__panel-head {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: ${u("sm")};
            }

            & .mholes__panel-title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.1rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mholes__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${u("sm")};
            }

            /* Same worded pill as the club page's readiness column, so the two
               readings of one answer look like one answer. */
            & .mholes__badge {
                display: inline-block;
                padding: 2px ${u("sm")};
                border: 1px solid ${r("border")};
                border-radius: ${r("radius-pill")};
                background: ${r("surface-sunken")};
                color: ${r("text-muted")};
                font-size: 0.78rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mholes__badge--ready {
                border-color: ${r("accent-strong")};
                color: ${r("accent-strong")};
            }

            & .mholes__badge--warn {
                border-color: ${r("accent")};
                color: ${r("accent")};
            }

            & .mholes__badge--error {
                border-color: ${r("danger")};
                color: ${r("danger")};
            }

            & .mholes__issues {
                display: flex;
                flex-direction: column;
                gap: ${u("sm")};
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
                padding-left: ${u("md")};
                border-left: 3px solid ${r("border")};
            }

            & .mholes__issue--error { border-left-color: ${r("danger")}; }
            & .mholes__issue--warning { border-left-color: ${r("accent")}; }

            & .mholes__issue-severity {
                font-family: ${r("font-ui")};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${r("text-muted")};
            }

            & .mholes__issue--error .mholes__issue-severity { color: ${r("danger")}; }

            & .mholes__issue-text {
                margin: 0;
                color: ${r("text")};
                font-size: 0.9rem;
                line-height: 1.45;
            }

            & .mholes__issue-detail {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.85rem;
                line-height: 1.45;
            }

            & .mholes__fill {
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};
                width: 100%;

                &[hidden] { display: none; }
            }

            & .mholes__fill-rows {
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};
            }

            & .mholes__fill-row {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-end;
                gap: ${u("md")};
            }

            & .mholes__fill-hole {
                min-width: 5rem;
                font-family: ${r("font-ui")};
                font-size: 0.95rem;
                font-weight: 700;
                color: ${r("text")};
                /* Aligns with the controls beside it rather than with their
                   labels. */
                padding-bottom: 0.6rem;
            }

            & .mholes__field {
                ${ge()}
            }

            & .mholes__field-label {
                ${fe()}
            }

            & .mholes__primary {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mholes__secondary {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }

            /* Terracotta, the danger family — the same treatment the club
               page's Delete carries, from the theme's --btn-danger-* tokens
               rather than a skin hand-rolled here. Sizing after the recipe
               (ADR-005). */
            & .mholes__danger {
                ${k(void 0,"danger")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;
                white-space: nowrap;
            }

            /* What a trim deletes, listed row by row. Not a table: it is three
               facts about each row read once before a decision, and the widest
               of them is "stroke index 18". */
            & .mholes__loss {
                display: flex;
                flex-direction: column;
                gap: 2px;
                margin: 0;
                padding-left: ${u("md")};
                border-left: 3px solid ${r("danger")};
                list-style: none;

                &:empty { display: none; }
            }

            & .mholes__loss-item {
                margin: 0;
                color: ${r("text")};
                font-size: 0.9rem;
                font-variant-numeric: tabular-nums;
                line-height: 1.45;
            }
        }
    `;courses=this.inject(be);editor=new ue;draft=Xe();fillEditor=new ue;fillDrafts=new Map;fillHost=null;trimOpen=new m(!1);trimming=new m(!1);trimError=new m(null);actionEffects=new Map;columns=[{key:"hole",header:"Hole",type:"numeric",stackedLabel:!1,cell:e=>e.holeNumber},{key:"par",header:"Par",type:"numeric",cell:e=>e.par,editCell:e=>this.numberInput({label:`Par, hole ${e.holeNumber}`,value:this.draft.par,oninput:t=>{this.draft.par=t}})},{key:"strokeIndex",header:"Stroke index",type:"numeric",cell:e=>e.strokeIndex,editCell:e=>this.numberInput({label:`Stroke index, hole ${e.holeNumber}`,value:this.draft.strokeIndex,oninput:t=>{this.draft.strokeIndex=t}})}];render(){const e=this.wire(li,{frontItem:{hidden:()=>!this.summary().split},frontPar:{textContent:()=>Et(this.summary().front)},backItem:{hidden:()=>!this.summary().split},backPar:{textContent:()=>Et(this.summary().back)},totalPar:{textContent:()=>String(this.summary().total)},summaryNote:{textContent:()=>Ct(this.summary())??"",hidden:()=>Ct(this.summary())===null},checkBadge:{textContent:()=>ps(this.readiness()),className:()=>`mholes__badge mholes__badge--${gs(this.readiness())}`},checkStatus:{textContent:()=>oi(this.readiness(),this.validation(),this.holeCount())},fill:{hidden:()=>this.missing().length===0},fillLead:{textContent:()=>this.fillLead()},fillOpen:{hidden:()=>this.filling(),disabled:()=>this.busy(),onclick:()=>this.openFill()},fillForm:{hidden:()=>!this.filling(),onsubmit:n=>{n.preventDefault(),this.saveFill()}},fillFree:{textContent:()=>this.freeNote()},fillError:{textContent:()=>this.fillEditor.errorFor(oe)??"",hidden:()=>this.fillEditor.errorFor(oe)===null},fillSave:{textContent:()=>this.fillSaving()?"Adding…":"Add holes",disabled:()=>this.busy()},fillCancel:{disabled:()=>this.fillSaving(),onclick:()=>this.closeFill()},trim:{hidden:()=>this.extras().length===0},trimLead:{textContent:()=>si(this.extras(),this.holeCount())},trimBlocked:{textContent:()=>this.trimBlocker()??"",hidden:()=>this.trimBlocker()===null},trimOpen:{textContent:()=>this.trimLabel(),disabled:()=>this.busy()||this.trimBlocker()!==null,onclick:()=>this.trimOpen.set(!0)},trimError:{textContent:()=>this.trimError.get()??"",hidden:()=>this.trimError.get()===null}}),t=new D(()=>[...this.course()?.holes??[]].sort((n,i)=>n.holeNumber-i.holeNumber));return this.spawn(ne,this.ref(e,"tableHost"),{columns:this.columns,rows:t,rowKey:n=>String(n.holeNumber),caption:"Holes",captionHidden:!0,stacked:!1,actions:n=>this.rowActions(n),actionsHeader:"Hole actions",empty:{heading:"No holes yet",body:"This course has no hole rows. Add them below, one par and one stroke index per hole."},edit:{controller:this.editor,oncommit:n=>{this.saveRow(n)},saveLabel:"Save",savingLabel:"Saving…",statusHost:this.ref(e,"rowStatus")}}),this.fillHost=this.ref(e,"fillRows"),this.$each(this.ref(e,"issues"),()=>this.issues(),n=>this.issueItem(n),n=>n.key),this.$each(this.ref(e,"trimLoss"),()=>this.extras(),n=>this.lossItem(n),n=>`${n.holeNumber}:${n.par}:${n.strokeIndex}`),this.spawn(X,this.ref(e,"confirmHost"),pe({open:this.trimOpen,title:()=>{const n=this.extras();return n.length===1?`Remove hole ${n[0].holeNumber}?`:`Remove ${n.length} hole rows?`},consequence:()=>ni(this.extras(),this.course()?.name??"this course",this.holeCount()),confirmLabel:()=>this.extras().length===1?"Remove hole row":"Remove hole rows",onconfirm:()=>{this.trim()}})),this.track(ie(this.trimOpen)),this.track(()=>{for(const n of this.actionEffects.values())n();this.actionEffects.clear()}),e}course(){return this.courses.byId(this.props.courseId)}holeCount(){return this.course()?.holeCount??0}summary(){return Zn(this.course()?.holes??[],this.holeCount())}readiness(){return this.courses.readiness.get()[this.props.courseId]??{status:"checking"}}validation(){return this.courses.validations.get()[this.props.courseId]??null}issues(){const e=this.validation();return e?ii(e,this.holeCount()):[]}missing(){return Ae(this.course()?.holes??[],this.holeCount())}extras(){return ot(this.course()?.holes??[],this.holeCount())}rowActions(e){const t=String(e.holeNumber),n=U("Edit",{onclick:()=>{this.draft=Jn(e),this.editor.begin(t)}});return this.actionEffects.get(t)?.(),this.actionEffects.set(t,b(()=>{n.disabled=this.editor.key.get()!==null||this.busy()})),n}async saveRow(e){const t=this.course();if(!t)return;if(this.fillSaving()){this.editor.fail("The missing holes are still being added. Wait for that to finish, then save this hole again.");return}if(this.trimming.peek()){this.editor.fail("The extra hole rows are still being removed. Wait for that to finish, then save this hole again.");return}const n=fs(this.draft,t.holeCount);if(!n.ok){this.editor.fail(St(e,n.message));return}await this.editor.commit(async()=>{const i=await this.courses.saveHole(t.id,e.holeNumber,{par:n.par,strokeIndex:n.strokeIndex});return i.ok?i:{ok:!1,message:St(e,i.message)}})}issueItem(e){const t=document.createElement("li");t.className=`mholes__issue mholes__issue--${e.severity}`;const n=document.createElement("span");n.className="mholes__issue-severity",n.textContent=e.severityLabel;const i=document.createElement("p");i.className="mholes__issue-text",i.textContent=e.explanation;const o=document.createElement("p");return o.className="mholes__issue-detail",o.textContent=e.detail,t.append(n,i,o),t}filling(){return this.fillEditor.key.get()===oe}fillSaving(){return this.fillEditor.isSaving(oe)}busy(){return this.editor.phase.get()==="saving"||this.fillSaving()||this.trimming.get()}fillLead(){const e=this.missing();return e.length===0?"":`${e.length===1?"Hole":"Holes"} ${It(e)} ${e.length===1?"has":"have"} no row on this course, so the course is incomplete until ${e.length===1?"it is":"they are"} filled in. Enter the real par and stroke index for each — nothing is guessed for you, because an invented par ends up on somebody’s scorecard.`}freeNote(){const e=rt(this.course()?.holes??[],this.holeCount());return e.length===0?"":`Stroke ${e.length===1?"index":"indices"} still free: ${It(e)}. Each of them has to end up on exactly one hole.`}openFill(){const e=this.course(),t=this.fillHost;if(!(!e||!t||this.busy())){this.fillDrafts.clear(),t.textContent="";for(const n of Ae(e.holes,e.holeCount)){const i=Xe();this.fillDrafts.set(n,i),t.appendChild(this.fillRow(n,i))}this.fillEditor.begin(oe),t.querySelector("input")?.focus()}}fillRow(e,t){const n=document.createElement("div");n.className="mholes__fill-row";const i=document.createElement("span");return i.className="mholes__fill-hole",i.textContent=`Hole ${e}`,n.appendChild(i),n.appendChild(this.fillField(`manage-hole-${e}-par`,"Par",t.par,o=>{t.par=o})),n.appendChild(this.fillField(`manage-hole-${e}-si`,"Stroke index",t.strokeIndex,o=>{t.strokeIndex=o})),n}fillField(e,t,n,i){const o=document.createElement("div");o.className="mholes__field";const a=document.createElement("label");a.className="mholes__field-label",a.htmlFor=e,a.textContent=t;const l=this.numberInput({label:t,value:n,oninput:i});return l.id=e,l.removeAttribute("aria-label"),o.append(a,l),o}closeFill(){this.fillEditor.cancel(),this.fillEditor.key.get()===null&&(this.fillDrafts.clear(),this.fillHost&&(this.fillHost.textContent=""))}async saveFill(){const e=this.course();if(!e||this.fillSaving())return;if(this.editor.phase.peek()==="saving"){this.fillEditor.fail("A hole is still saving. Wait for it to finish, then add these holes again.");return}const t=ei(e.holes,this.fillDrafts,e.holeCount);if(!t.ok){this.fillEditor.fail(t.message);return}await this.fillEditor.commit(()=>this.courses.saveHoles(e.id,t.holes,"Could not add the holes. Check your connection and try again."))&&(this.fillDrafts.clear(),this.fillHost&&(this.fillHost.textContent=""))}lossItem(e){const t=document.createElement("li");return t.className="mholes__loss-item",t.textContent=ti(e),t}trimLabel(){const e=this.extras();return this.trimming.get()?"Removing…":e.length===1?`Remove hole ${e[0].holeNumber}`:`Remove these ${e.length} hole rows`}trimBlocker(){const e=this.course();if(!e)return null;const t=Tt(e.holes,e.holeCount);return t.ok?null:t.message}async trim(){const e=this.course();if(!e||this.busy()||this.trimming.get())return;const t=Tt(e.holes,e.holeCount);if(!t.ok){this.trimError.set(t.message);return}this.trimError.set(null),this.trimming.set(!0);try{const n=await this.courses.saveHoles(e.id,t.holes,"Could not remove the hole rows. Check your connection and try again.");n.ok||this.trimError.set(n.message)}finally{this.trimming.set(!1)}}numberInput(e){const t=document.createElement("input");return t.type="text",t.inputMode="numeric",t.autocomplete="off",t.className="mholes__input",t.value=e.value,t.setAttribute("aria-label",e.label),t.addEventListener("input",()=>e.oninput(t.value)),t}}function It(s){return s.length<=2?s.join(" and "):`${s.slice(0,-1).join(", ")} and ${s[s.length-1]}`}const j=["M","F"];function A(s){return s==="M"?"Men":"Women"}const ci=["Vit","Gul","Blå","Röd","Orange","Svart","White","Yellow","Blue","Red","Black"],hi="The colour this tee is known by — Gul, Blå, Röd. A hex value like #ffd400 also works";function _s(s){return{name:"",colour:"",lengths:ys(s),ratings:{M:Qe(),F:Qe()}}}function ui(s,e){const t=new Map(s.holeLengths.map(n=>[n.holeNumber,n]));return{name:s.name,colour:s.colour??"",lengths:ys(e).map(n=>{const i=t.get(n.holeNumber);return i?{holeNumber:n.holeNumber,lengthM:J(i.lengthM),strokeIndexOverride:i.strokeIndexOverride===null?"":J(i.strokeIndexOverride)}:n}),ratings:{M:Lt(s,"M"),F:Lt(s,"F")}}}function Lt(s,e){const t=s.ratings.find(n=>n.gender===e);return t?{rated:!0,courseRating:J(t.courseRating),slope:J(t.slope),par:J(t.par),totalLengthM:J(t.totalLengthM)}:Qe()}function Qe(){return{rated:!1,courseRating:"",slope:"",par:"",totalLengthM:""}}function ys(s){return Array.from({length:Math.max(s,0)},(e,t)=>({holeNumber:t+1,lengthM:"",strokeIndexOverride:""}))}function mi(s,e){const t={};s.name.trim()===""&&(t.name="A tee needs a name. Enter one before saving.");const n=[];let i=null;for(const a of s.lengths){const l=a.lengthM.trim();if(l!==""&&xs(l)===null){n.push(a.holeNumber),i??=`Hole ${a.holeNumber}: a length is metres as a number, e.g. 342. Leave it blank if the hole is not measured from this tee.`;continue}const c=a.strokeIndexOverride.trim();c!==""&&!ki(c,e)&&(n.push(a.holeNumber),i??=`Hole ${a.holeNumber}: a stroke-index override is a whole number from 1 to ${e}. Leave it blank to use the course's own stroke index.`)}i!==null&&(t.lengths=i,t.badHoles=n);const o={};for(const a of j){const l=pi(s.ratings[a],a);l!==null&&(o[a]=l)}return Object.keys(o).length>0&&(t.ratings=o),t}function pi(s,e){if(!s.rated)return null;const t=W.filter(i=>s[i.key].trim()==="").map(i=>i.label);if(t.length>0)return`${A(e)}: fill in ${Ei(t)}, or set this tee to not rated for ${A(e).toLowerCase()}.`;const n=W.filter(i=>i.whole?!xi(s[i.key].trim()):$i(s[i.key].trim())===null);if(n.length>0){const i=n[0];return i.whole?`${A(e)}: ${i.label.toLowerCase()} is a whole number, e.g. ${i.example}.`:`${A(e)}: ${i.label.toLowerCase()} is a number, e.g. ${i.example}. Use a dot for decimals.`}return null}const W=[{key:"courseRating",label:"Course rating",whole:!1,example:"71.4"},{key:"slope",label:"Slope",whole:!0,example:"132"},{key:"par",label:"Par",whole:!0,example:"72"},{key:"totalLengthM",label:"Total length (m)",whole:!0,example:"5812"}];function gi(s){return Object.keys(s).length>0}function At(s){const e=[];for(const i of s.lengths){const o=xs(i.lengthM.trim());if(o===null)continue;const a=i.strokeIndexOverride.trim();e.push({holeNumber:i.holeNumber,lengthM:o,strokeIndexOverride:a===""?null:Number(a)})}const t=[];for(const i of j){const o=s.ratings[i];o.rated&&t.push({gender:i,courseRating:Number(o.courseRating.trim()),slope:Number(o.slope.trim()),par:Number(o.par.trim()),totalLengthM:Number(o.totalLengthM.trim())})}const n=s.colour.trim();return{name:s.name.trim(),colour:n===""?null:n,holeLengths:e,ratings:t}}function fi(s){const e=j.filter(t=>s.ratings.some(n=>n.gender===t));return e.length===0?"Not rated":e.map(A).join(", ")}function bi(s){const e=j.map(n=>({gender:n,rating:s.ratings.find(i=>i.gender===n)})).filter(n=>n.rating!==void 0&&n.rating.totalLengthM>0);if(e.length>0)return e.map(n=>`${A(n.gender)} ${de(n.rating.totalLengthM)}`).join(", ");const t=s.holeLengths.reduce((n,i)=>n+i.lengthM,0);return t>0?`${de(t)} measured`:""}function _i(s){return s.holeLengths.length}function de(s){return`${Math.round(s)} m`}function ws(s){if(s===null)return null;const e=s.trim();return/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(e)?e:$s[e.toLocaleLowerCase("sv-SE")]??null}function vs(s){const e=s.trim(),t=yi(e);return(t===null?null:Je.get(t))??e}function yi(s){if(!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s))return null;const e=s.slice(1).toLowerCase();return`#${e.length===3?[...e].map(t=>t+t).join(""):e}`}const Je=new Map,$s={vit:"#f5f5f5",white:"#f5f5f5",gul:"#ffd400",yellow:"#ffd400",blå:"#2a6fd4",bla:"#2a6fd4",blue:"#2a6fd4",röd:"#d4332a",rod:"#d4332a",red:"#d4332a",orange:"#e8830c",svart:"#1c1c1c",black:"#1c1c1c",grön:"#2f8f4e",green:"#2f8f4e",guld:"#c8a44a",gold:"#c8a44a"};for(const[s,e]of Object.entries($s))Je.has(e)||Je.set(e,s.charAt(0).toUpperCase()+s.slice(1));function wi(s){return`${s} leaves this course, and its hole lengths and ratings go with it. Rounds already played keep their own copy of the tee, so no scorecard changes.`}const vi="The tee is removed from this course, along with its hole lengths and ratings.";function xs(s){if(!/^\d+(\.\d+)?$/.test(s))return null;const e=Number(s);return Number.isFinite(e)&&e>0?e:null}function $i(s){if(!/^\d+(\.\d+)?$/.test(s))return null;const e=Number(s);return Number.isFinite(e)?e:null}function xi(s){return/^\d+$/.test(s)}function ki(s,e){if(!/^\d+$/.test(s))return!1;const t=Number(s);return t>=1&&t<=e}function J(s){return String(Number(s.toFixed(3)))}function Ei(s){const e=s.map(t=>t.toLowerCase());return e.length===1?e[0]:`${e.slice(0,-1).join(", ")} and ${e[e.length-1]}`}class ks{courseId=new m(null);tees=new m([]);loading=new m(!1);error=new m(null);loaded=new m(!1);courses=B.get(be);inflight=null;load(e,t=!1){return this.courseId.get()!==e&&(this.courseId.set(e),this.tees.set([]),this.loaded.set(!1),this.inflight=null),!t&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{const n=await N.tees.listByCourse({courseId:e});if(this.courseId.get()!==e)return;this.tees.set(n)}catch(n){this.error.set(R(n,"Could not load the tees. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.tees.get().find(t=>t.id===e)??null}async create(e,t,n){const{name:i,colour:o,holeLengths:a,ratings:l}=At(n);return this.write(()=>N.tees.create({courseId:e,name:i,colour:o,holeLengths:a,ratings:l}),"Could not create the tee. Check your connection and try again.",t)}async update(e,t){const{name:n,colour:i,holeLengths:o,ratings:a}=At(t);return this.write(()=>N.tees.update({id:e,name:n,colour:i,holeLengths:o,ratings:a}),"Could not save the tee. Check your connection and try again.",null)}async remove(e,t){return this.write(()=>N.tees.remove({id:e}),"Could not delete the tee. Check your connection and try again.",t)}async write(e,t,n){try{await e()}catch(o){return{ok:!1,message:R(o,t)}}const i=this.courseId.get();return await Promise.all([i===null?Promise.resolve():this.load(i,!0),n===null?Promise.resolve():this.courses.load(n,!0)]),{ok:!0}}}const Ci=C(`
    <div class="mtlen">
        <div class="mtlen__head">
            <span bind="label" class="mtlen__title">Hole lengths</span>
            <p bind="hint" class="mtlen__hint"></p>
        </div>
        <div bind="box" class="mtlen__box"></div>
        <p bind="summary" class="mtlen__summary" role="status" aria-live="polite"></p>
        <p bind="error" class="mtlen__error" role="alert"></p>
    </div>
`);class Ti extends E{static styles=`
        .mtlen {
            display: flex;
            flex-direction: column;
            gap: ${u("xs")};
            min-width: 0;

            & .mtlen__head {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            & .mtlen__title {
                font-family: ${r("font-ui")};
                font-size: 0.8rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: ${r("text-muted")};
            }

            & .mtlen__hint {
                ${ee()}
                margin: 0;
            }

            & .mtlen__box {
                ${Cn()}
            }

            /* max-content, never 100%: a grid that shrinks to its box never
               scrolls, and the whole point of the box is that this one does. */
            & .mtlen__grid {
                border-collapse: collapse;
                min-width: max-content;
                font-family: ${r("font-ui")};
                font-size: 0.85rem;
                color: ${r("text")};
            }

            & .mtlen__cell {
                padding: ${u("xs")};
                border-bottom: 1px solid ${r("manage-table-row-border")};
                text-align: center;
                vertical-align: middle;
            }

            & .mtlen__grid tr:last-child .mtlen__cell { border-bottom: none; }

            & .mtlen__hole {
                font-variant-numeric: tabular-nums;
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.06em;
                color: ${r("manage-table-header-fg")};
                background: ${r("manage-table-header-bg")};
                border-bottom: 1px solid ${r("manage-table-header-border")};
                padding: ${u("xs")} ${u("sm")};
                min-width: 4.5rem;
            }

            /* Sticky so a grid scrolled to hole 14 still says which row is the
               length and which is the override. Above the cells it slides over,
               and opaque — a translucent label over a passing input is unreadable. */
            & .mtlen__rowhead {
                position: sticky;
                left: 0;
                z-index: 1;
                background: ${r("manage-table-header-bg")};
                color: ${r("manage-table-header-fg")};
                border-right: 1px solid ${r("manage-table-header-border")};
                text-align: left;
                white-space: nowrap;
                font-size: 0.75rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                padding: ${u("xs")} ${u("sm")};
            }

            & .mtlen__corner {
                border-bottom: 1px solid ${r("manage-table-header-border")};
            }

            & .mtlen__input {
                ${re()}
                width: 4.25rem;
                padding: 0 ${u("xs")};
                text-align: center;
                font-variant-numeric: tabular-nums;
            }

            /* The cell the message names. Colour is the SECOND signal — the
               worded error under the grid is the first (design-guidelines §4). */
            & .mtlen__input[aria-invalid='true'] {
                border-color: ${r("danger")};
            }

            & .mtlen__summary {
                ${ee()}
                margin: 0;
                font-variant-numeric: tabular-nums;
            }

            & .mtlen__error {
                margin: 0;
                color: ${r("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }
        }
    `;lengths=new m([]);box=null;lengthInputs=new Map;siInputs=new Map;render(){const e=this.wire(Ci,{label:{id:`${this.props.idPrefix}-lengths-label`},hint:{textContent:"Metres per hole. Leave a hole blank if this tee is not measured for it. A stroke-index override replaces the course’s own index for this tee only — leave it blank to use the course’s."},summary:{textContent:()=>this.summary()},error:{textContent:()=>this.props.errors.get().lengths??"",hidden:()=>this.props.errors.get().lengths===void 0}});return this.box=this.ref(e,"box"),this.track(b(()=>{const t=this.props.holeCount.get();this.build(t)})),this.track(b(()=>{const t=new Set(this.props.errors.get().badHoles??[]);for(const[n,i]of this.lengthInputs)i.setAttribute("aria-invalid",String(t.has(n)));for(const[n,i]of this.siInputs)i.setAttribute("aria-invalid",String(t.has(n)))})),this.track(b(()=>{const t=this.props.busy?.get()??!1;for(const n of this.lengthInputs.values())n.disabled=t;for(const n of this.siInputs.values())n.disabled=t})),e}seed(e){this.lengths.set(e.map(t=>({...t}))),this.apply()}focusFirst(){const e=this.lengthInputs.get(1)??[...this.lengthInputs.values()][0];return e?(e.focus(),e.select(),!0):!1}focusInvalid(e){const t=e.badHoles?.[0];if(t===void 0)return!1;const n=this.lengthInputs.get(t)??this.siInputs.get(t);return n?(n.focus(),n.select(),!0):!1}build(e){const t=this.box;if(!t||(t.textContent="",this.lengthInputs.clear(),this.siInputs.clear(),e<=0))return;const n=Array.from({length:e},(c,d)=>d+1),i=document.createElement("table");i.className="mtlen__grid",i.setAttribute("aria-labelledby",`${this.props.idPrefix}-lengths-label`);const o=document.createElement("thead"),a=document.createElement("tr");a.appendChild(Pe("th","mtlen__hole mtlen__rowhead mtlen__corner","Hole"));for(const c of n){const d=Pe("th","mtlen__hole",String(c));d.setAttribute("scope","col"),d.id=this.holeHeaderId(c),a.appendChild(d)}o.appendChild(a),i.appendChild(o);const l=document.createElement("tbody");l.appendChild(this.inputRow("Length (m)",n,"decimal",this.lengthInputs,(c,d)=>this.patch(c,{lengthM:d}))),l.appendChild(this.inputRow("SI override",n,"numeric",this.siInputs,(c,d)=>this.patch(c,{strokeIndexOverride:d}))),i.appendChild(l),t.appendChild(i),this.apply()}inputRow(e,t,n,i,o){const a=document.createElement("tr"),l=Pe("th","mtlen__cell mtlen__rowhead",e);l.setAttribute("scope","row"),a.appendChild(l);for(const c of t){const d=document.createElement("td");d.className="mtlen__cell";const h=document.createElement("input");h.type="text",h.className="mtlen__input",h.inputMode=n,h.autocomplete="off",h.setAttribute("aria-label",`${e}, hole ${c}`),h.addEventListener("input",()=>o(c,h.value)),i.set(c,h),d.appendChild(h),a.appendChild(d)}return a}apply(){const e=new Map(this.lengths.peek().map(t=>[t.holeNumber,t]));for(const[t,n]of this.lengthInputs)n.value=e.get(t)?.lengthM??"";for(const[t,n]of this.siInputs)n.value=e.get(t)?.strokeIndexOverride??""}patch(e,t){this.lengths.update(n=>{const i=n.findIndex(a=>a.holeNumber===e);if(i===-1)return[...n,{holeNumber:e,lengthM:"",strokeIndexOverride:"",...t}].sort((a,l)=>a.holeNumber-l.holeNumber);const o=[...n];return o[i]={...o[i],...t},o})}holeHeaderId(e){return`${this.props.idPrefix}-hole-${e}`}summary(){const e=this.lengths.get(),t=this.props.holeCount.get();if(t<=0)return"";const n=e.filter(l=>Ot(l.lengthM)!==null);if(n.length===0)return"No holes measured yet.";const i=(l,c)=>n.filter(d=>d.holeNumber>=l&&d.holeNumber<=c).reduce((d,h)=>d+(Ot(h.lengthM)??0),0),o=i(1,t),a=[];return t>9&&a.push(`Out ${de(i(1,9))}`,`In ${de(i(10,t))}`),a.push(`Total ${de(o)}`),a.push(n.length===t?`all ${t} holes measured`:`${n.length} of ${t} holes measured`),a.join(" · ")}}function Pe(s,e,t){const n=document.createElement(s);return n.className=e,n.textContent=t,n}function Ot(s){const e=s.trim();if(!/^\d+(\.\d+)?$/.test(e))return null;const t=Number(e);return Number.isFinite(t)&&t>0?t:null}const Ni=C(`
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
`);class Si extends E{static styles=`
        .mteefields {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};
            min-width: 0;

            & .mteefields__grid {
                ${Se()}
            }

            & .mteefields__field {
                ${ge()}
            }

            & .mteefields__label {
                ${fe()}
            }

            & .mteefields__control {
                ${re()}
            }

            & .mteefields__hint {
                ${ee()}
                margin: 0;
            }

            & .mteefields__error {
                ${Ie()}
                margin: 0;

                &[hidden] { display: none; }
            }

            & .mteefields__colour {
                display: flex;
                align-items: center;
                gap: ${u("sm")};
                min-width: 0;
            }

            /* Decoration only: the word beside it is what says which colour this
               is (design-guidelines §4), and an unrecognised value simply gets
               no swatch. */
            & .mteefields__swatch {
                flex: none;
                width: 1.5rem;
                height: 1.5rem;
                border-radius: ${r("radius-pill")};
                border: 1px solid ${r("border-strong")};
                background: ${r("surface-sunken")};

                &[hidden] { display: none; }
            }

            & .mteefields__ratings {
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};
            }

            & .mtrating {
                display: flex;
                flex-direction: column;
                gap: ${u("sm")};
                padding: ${u("md")};
                border: 1px solid ${r("manage-table-border")};
                border-radius: ${r("manage-table-radius")};
                background: ${r("manage-table-bg")};
            }

            & .mtrating__head {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${u("sm")};
            }

            & .mtrating__title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mtrating__seg {
                ${is()}
            }

            & .mtrating__figures {
                ${Se()}

                &[hidden] { display: none; }
            }

            /* The worded annotation that stands in for the figures — muted, in
               words, never a symbol (design-guidelines §4). */
            & .mtrating__absent {
                ${ee()}
                margin: 0;

                &[hidden] { display: none; }
            }

            & .mtrating__error {
                ${Ie()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;parts=new m(Rt(_s(0)));nameInput=null;colourInput=null;ratingInputs=new Map;grid=null;render(){const e={name:`${this.props.idPrefix}-name`,colour:`${this.props.idPrefix}-colour`,colours:`${this.props.idPrefix}-colour-options`},t=()=>this.props.busy?.get()??!1,n=this.wire(Ni,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:t,oninput:l=>this.patch({name:l.target.value})},nameError:{id:`${e.name}-error`,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},colourLabel:{htmlFor:e.colour},colour:{id:e.colour,"aria-describedby":`${e.colour}-hint`,disabled:t,oninput:l=>this.patch({colour:l.target.value})},colours:{id:e.colours},colourHint:{id:`${e.colour}-hint`,textContent:`${hi}. Optional`}});this.nameInput=this.ref(n,"name"),this.colourInput=this.ref(n,"colour"),this.colourInput.setAttribute("list",e.colours);const i=this.ref(n,"colours");for(const l of ci){const c=document.createElement("option");c.value=l,i.appendChild(c)}const o=this.ref(n,"swatch");this.track(b(()=>{const l=ws(this.parts.get().colour);o.hidden=l===null,o.style.backgroundColor=l??""}));const a=this.ref(n,"ratingsHost");for(const l of j)a.appendChild(this.ratingBlock(l,t));return this.grid=this.spawn(Ti,this.ref(n,"lengthsHost"),{idPrefix:this.props.idPrefix,errors:this.props.errors,busy:{get:t},holeCount:this.props.holeCount}),n}ratingBlock(e,t){const n=document.createElement("section");n.className="mtrating";const i=document.createElement("div");i.className="mtrating__head";const o=document.createElement("h4");o.className="mtrating__title",o.id=`${this.props.idPrefix}-${e}-title`,o.textContent=`${A(e)}’s rating`,i.appendChild(o);const a=document.createElement("div");a.className="mtrating__seg",a.setAttribute("role","group"),a.setAttribute("aria-labelledby",o.id);const l=[{label:"Rated",rated:!0},{label:"Not rated",rated:!1}],c=l.map(v=>{const S=document.createElement("button");return S.type="button",S.textContent=v.label,S.addEventListener("click",()=>this.setRated(e,v.rated)),a.appendChild(S),S});i.appendChild(a),n.appendChild(i);const d=document.createElement("div");d.className="mtrating__figures";for(const v of W){const S=document.createElement("div");S.className="mteefields__field";const L=`${this.props.idPrefix}-${e}-${v.key}`,z=document.createElement("label");z.className="mteefields__label",z.htmlFor=L,z.textContent=v.label,S.appendChild(z);const H=document.createElement("input");H.type="text",H.className="mteefields__control",H.id=L,H.autocomplete="off",H.inputMode=v.whole?"numeric":"decimal",H.addEventListener("input",()=>this.patchRating(e,{[v.key]:H.value})),this.ratingInputs.set(`${e}:${v.key}`,H),S.appendChild(H),d.appendChild(S)}n.appendChild(d);const h=document.createElement("p");h.className="mtrating__absent";const p=A(e).toLowerCase();h.textContent=`No ${p}’s rating. Saving removes any tee role on this course that assigns this tee to ${p} — that assignment is deleted, not hidden — so the tee is no longer offered for ${p}, and rounds cannot use it for a ${e==="M"?"man":"woman"}’s handicap.`,n.appendChild(h);const g=document.createElement("p");return g.className="mtrating__error",g.setAttribute("role","alert"),n.appendChild(g),this.track(b(()=>{const v=this.parts.get().ratings[e].rated,S=t();c.forEach((L,z)=>{L.setAttribute("aria-pressed",String(l[z].rated===v)),L.disabled=S}),d.hidden=!v,h.hidden=v;for(const L of W){const z=this.ratingInputs.get(`${e}:${L.key}`);z&&(z.disabled=S)}})),this.track(b(()=>{const v=this.props.errors.get().ratings?.[e];g.textContent=v??"",g.hidden=v===void 0;for(const S of W){const L=this.ratingInputs.get(`${e}:${S.key}`);L&&L.setAttribute("aria-invalid",String(v!==void 0))}})),n}current(){const e=this.parts.peek();return{name:e.name,colour:e.colour,ratings:{M:{...e.ratings.M},F:{...e.ratings.F}},lengths:(this.grid?.lengths.peek()??[]).map(t=>({...t}))}}seed(e){this.parts.set(Rt(e)),this.nameInput&&(this.nameInput.value=e.name),this.colourInput&&(this.colourInput.value=e.colour);for(const t of j)for(const n of W){const i=this.ratingInputs.get(`${t}:${n.key}`);i&&(i.value=e.ratings[t][n.key])}this.grid?.seed(e.lengths)}focusFirst(){this.nameInput?.focus()}focusInvalid(e){if(e.name!==void 0&&this.nameInput)return this.nameInput.focus(),!0;for(const t of j){if(e.ratings?.[t]===void 0)continue;const n=W.map(i=>this.ratingInputs.get(`${t}:${i.key}`)).find(i=>i!==void 0);if(n)return n.focus(),n.select(),!0}return this.grid?.focusInvalid(e)??!1}patch(e){this.parts.update(t=>({...t,...e}))}setRated(e,t){this.parts.update(n=>({...n,ratings:{...n.ratings,[e]:{...n.ratings[e],rated:t}}}))}patchRating(e,t){this.parts.update(n=>({...n,ratings:{...n.ratings,[e]:{...n.ratings[e],...t}}}))}}function Rt(s){return{name:s.name,colour:s.colour,ratings:{M:{...s.ratings.M},F:{...s.ratings.F}}}}const ke="__new",Ii=C(`
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
`);class Li extends E{static styles=`
        .mtees {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};
            min-width: 0;

            & .mtees__head {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${u("md")};
            }

            & .mtees__heading {
                display: flex;
                flex-direction: column;
                gap: ${u("xs")};
                min-width: 0;
            }

            & .mtees__title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.35rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mtees__lead {
                margin: 0;
                max-width: 60ch;
                color: ${r("text-muted")};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mtees__new {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mtees__note {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.8rem;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mtees__error {
                margin: 0;
                color: ${r("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mtees__panel {
                ${M({})}
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};
                padding: ${r("manage-page-pad")};
                /* The lengths grid inside scrolls itself; without this the panel
                   takes its width from the grid's content and the PAGE scrolls
                   sideways instead. */
                min-width: 0;

                &[hidden] { display: none; }
            }

            & .mtees__panel-title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.1rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mtees__panel-actions {
                display: flex;
                flex-wrap: wrap;
                gap: ${u("sm")};
            }

            & .mtees__submit {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mtees__secondary {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
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
                gap: ${u("xs")};
            }

            & .mtees__swatch {
                flex: none;
                width: 0.85rem;
                height: 0.85rem;
                border-radius: ${r("radius-pill")};
                border: 1px solid ${r("border-strong")};
            }

            & .mtees__muted { color: ${r("text-muted")}; }
        }
    `;tees=this.inject(ks);courses=this.inject(be);editor=new ue;errors=new m({});deleteOpen=new m(!1);deleteTarget=new m(null);deleteFailure=new m(null);deletingId=new m(null);fields=null;actionEffects=new Map;rows=new D(()=>{const e=this.holeCount();return this.tees.tees.get().map(t=>({...t,courseHoleCount:e}))});columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>e.name},{key:"colour",header:"Colour",cell:e=>this.colourCell(e)},{key:"rated",header:"Rated for",cell:e=>fi(e)},{key:"length",header:"Total length",cell:e=>{const t=bi(e);return t!==""?t:this.muted("Not measured")}},{key:"holes",header:"Holes measured",type:"numeric",cell:e=>`${_i(e)} of ${e.courseHoleCount}`}];render(){const e=this.wire(Ii,{new:{disabled:()=>this.editing()||this.deletingId.get()!==null,onclick:()=>this.openCreate()},panel:{hidden:()=>!this.editing(),onsubmit:t=>{t.preventDefault(),this.submit()}},panelTitle:{textContent:()=>this.panelTitle()},panelError:{textContent:()=>this.panelError()??"",hidden:()=>this.panelError()===null},submit:{textContent:()=>this.submitLabel(),disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.closePanel()},loadError:{textContent:()=>this.tees.error.get()??"",hidden:()=>this.tees.error.get()===null},retry:{hidden:()=>this.tees.error.get()===null,onclick:()=>{this.tees.load(this.props.courseId,!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading tees…",hidden:()=>this.tees.loaded.get()}});return this.fields=this.spawn(Si,this.ref(e,"fieldsHost"),{idPrefix:"manage-tee",errors:this.errors,busy:{get:()=>this.saving()},holeCount:{get:()=>this.holeCount()}}),this.spawn(ne,this.ref(e,"tableHost"),{columns:this.columns,rows:this.rows,rowKey:t=>t.id,caption:"Tees",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Tee actions",empty:{heading:"No tees yet",body:"Add the tees this course is played from, then give each one its hole lengths and ratings.",action:{label:"New tee",onclick:()=>this.openCreate()}}}),this.spawn(X,this.ref(e,"confirmHost"),pe({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this tee?"},consequence:()=>{const t=this.deleteTarget.get();return t?wi(t.name):vi},confirmLabel:"Delete tee",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(ie(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.tees.load(this.props.courseId),this.courses.load(this.props.clubId);const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.editing()||this.saving()||this.closePanel())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}holeCount(){return this.courses.byId(this.props.courseId)?.holeCount??0}editing(){return this.editor.key.get()!==null}creating(){return this.editor.key.get()===ke}saving(){const e=this.editor.key.get();return e!==null&&this.editor.isSaving(e)}panelTitle(){if(this.creating())return"New tee";const e=this.openTee();return e?`Edit ${e.name}`:"Edit tee"}submitLabel(){return this.creating()?this.saving()?"Creating…":"Create tee":this.saving()?"Saving…":"Save tee"}panelError(){const e=this.editor.key.get();return e===null?null:this.editor.errorFor(e)}openTee(){const e=this.editor.key.get();return e===null||e===ke?null:this.tees.tees.get().find(t=>t.id===e)??null}openCreate(){this.saving()||(this.errors.set({}),this.editor.begin(ke),this.fields?.seed(_s(this.holeCount())),this.fields?.focusFirst())}openEdit(e){this.saving()||(this.errors.set({}),this.editor.begin(e.id),this.fields?.seed(ui(e,this.holeCount())),this.fields?.focusFirst())}closePanel(){this.editor.cancel(),this.errors.set({})}async submit(){if(!this.fields||this.saving())return;const e=this.editor.key.get();if(e===null)return;const t=this.fields.current(),n=mi(t,this.holeCount());if(this.errors.set(n),gi(n)){this.fields.focusInvalid(n);return}await this.editor.commit(()=>e===ke?this.tees.create(this.props.courseId,this.props.clubId,t):this.tees.update(e,t))}colourCell(e){if(e.colour===null||e.colour.trim()==="")return this.muted("Not set");const t=document.createElement("span");t.className="mtees__colour";const n=ws(e.colour);if(n!==null){const o=document.createElement("span");o.className="mtees__swatch",o.setAttribute("aria-hidden","true"),o.style.backgroundColor=n,t.appendChild(o)}const i=document.createElement("span");return i.textContent=vs(e.colour),i.textContent!==e.colour.trim()&&(t.title=e.colour.trim()),t.appendChild(i),t}muted(e){const t=document.createElement("span");return t.className="mtees__muted",t.textContent=e,t}rowActions(e){const t=U("Edit",{onclick:()=>this.openEdit(e)}),n=U("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,b(()=>{const i=this.deletingId.get(),o=i!==null||this.editing();n.textContent=i===e.id?"Deleting…":"Delete",n.disabled=o,t.disabled=o})),[t,n]}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.tees.remove(e.id,this.props.clubId);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}function Fe(s){return typeof s=="object"&&s!==null&&typeof s.get=="function"}const f=s=>`var(--${s})`,zt="http://www.w3.org/2000/svg";function Ai(){const s=document.createElementNS(zt,"svg");s.setAttribute("width","12"),s.setAttribute("height","8"),s.setAttribute("viewBox","0 0 12 8"),s.setAttribute("fill","none"),s.setAttribute("aria-hidden","true"),s.setAttribute("focusable","false");const e=document.createElementNS(zt,"path");return e.setAttribute("d","M1 1.5 6 6.5 11 1.5"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","1.5"),e.setAttribute("stroke-linecap","round"),e.setAttribute("stroke-linejoin","round"),e.setAttribute("fill","none"),s.appendChild(e),s}const ce=class ce extends E{constructor(){super(...arguments),this.uid=`ui-select-${ce.seq++}`,this.open=new m(!1),this.highlightIndex=new m(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}get isMulti(){return this.props.multiple===!0}get multi(){return this.props}get single(){return this.props}currentOptions(){return Fe(this.props.options)?this.props.options.get():this.props.options}selectedValues(){if(this.isMulti)return this.multi.values.get();const e=this.single.value.get();return e?[e]:[]}placeholderText(){const e=this.props.placeholder;return(typeof e=="function"?e():e)??""}formatCount(e){return this.multi.countLabel?this.multi.countLabel(e):String(e)}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50,n=this.isMulti;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const i=document.createElement("span");i.className="ui-select__trigger-label",this.triggerEl.appendChild(i);const o=document.createElement("span");o.className="ui-select__chevron",o.appendChild(Ai()),o.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(o),this.triggerEl.addEventListener("click",l=>{l.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",l=>{this.handleTriggerKeydown(l)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",l=>{this.handleDropdownKeydown(l)}),this.listEl=document.createElement("div"),this.listEl.className="ui-select__list",this.listEl.setAttribute("role","listbox"),n&&this.listEl.setAttribute("aria-multiselectable","true"),this.dropdownEl.appendChild(this.listEl),n&&(this.countEl=document.createElement("div"),this.countEl.className="ui-select__count",this.countEl.setAttribute("role","status"),this.countEl.setAttribute("aria-live","polite"),this.dropdownEl.appendChild(this.countEl)),e.appendChild(this.dropdownEl);const a=l=>{this.optionEls=[],this.listEl.textContent="";for(let c=0;c<l.length;c++){const d=l[c],h=document.createElement("button");if(h.className=n?"ui-select__option ui-select__option--multi":"ui-select__option",h.setAttribute("type","button"),h.id=`${this.uid}-opt-${c}`,d.disabled){h.classList.add("ui-select__option--header"),h.disabled=!0,h.setAttribute("role","presentation"),h.setAttribute("aria-disabled","true");const g=document.createElement("span");g.className="ui-select__option-label",g.textContent=d.label,h.appendChild(g),this.listEl.appendChild(h),this.optionEls.push(h);continue}if(h.setAttribute("role","option"),n){const g=document.createElement("span");g.className="ui-select__checkbox",g.setAttribute("aria-hidden","true"),h.appendChild(g)}if(d.icon){const g=document.createElement("span");g.className="ui-select__option-icon",g.textContent=d.icon,h.appendChild(g)}const p=document.createElement("span");if(p.className="ui-select__option-label",p.textContent=d.label,h.appendChild(p),!n){const g=document.createElement("span");g.className="ui-select__check",g.setAttribute("aria-hidden","true"),h.appendChild(g)}h.addEventListener("click",g=>{g.stopPropagation(),this.chooseOption(d.value)}),h.addEventListener("mouseenter",()=>{this.highlightIndex.set(c)}),this.listEl.appendChild(h),this.optionEls.push(h)}};return Fe(this.props.options)?this.track(b(()=>{a(this.currentOptions())})):a(this.props.options),this.track(b(()=>{const l=this.currentOptions(),c=this.selectedValues();if(n){const d=c.length;if(d>0)i.textContent=this.formatCount(d),this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const h=this.placeholderText();i.textContent=h,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!h)}this.countEl&&(this.countEl.textContent=this.formatCount(d))}else{const d=this.single.value.get(),h=l.find(p=>p.value===d);if(h)i.textContent=h.icon?`${h.icon} ${h.label}`:h.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const p=this.placeholderText();i.textContent=p,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!p)}}for(let d=0;d<l.length;d++){const h=this.optionEls[d];if(!h||l[d].disabled)continue;const p=c.includes(l[d].value);h.setAttribute("aria-selected",String(p)),h.classList.toggle("ui-select__option--selected",p);const g=h.querySelector(".ui-select__check");g&&(g.textContent=p?"✓":"");const v=h.querySelector(".ui-select__checkbox");v&&(v.textContent=p?"✓":"")}})),this.track(b(()=>{const l=this.open.get();this.dropdownEl.classList.toggle("open",l),o.classList.toggle("ui-select__chevron--open",l),this.triggerEl.setAttribute("aria-expanded",String(l)),l?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),l&&I(()=>{const c=this.currentOptions(),d=this.selectedValues(),h=c.findIndex(g=>!g.disabled&&d.includes(g.value)),p=c.findIndex(g=>!g.disabled);this.highlightIndex.set(h>=0?h:p)})})),this.track(b(()=>{const l=this.highlightIndex.get();for(let c=0;c<this.optionEls.length;c++)this.optionEls[c].classList.toggle("ui-select__option--highlighted",c===l);l>=0&&this.optionEls[l]&&(this.triggerEl.setAttribute("aria-activedescendant",`${this.uid}-opt-${l}`),this.optionEls[l].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(Fe(this.props.disabled)?this.track(b(()=>{const l=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",l),this.triggerEl.disabled=l})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}chooseOption(e){if(this.isMulti){const t=this.multi.values.get();this.multi.values.set(t.includes(e)?t.filter(n=>n!==e):[...t,e]);return}he(()=>{this.single.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}commitHighlighted(){const e=this.highlightIndex.get(),t=this.currentOptions();e>=0&&e<t.length&&!t[e].disabled&&this.chooseOption(t[e].value)}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.open.get()?this.commitHighlighted():this.open.set(!0);break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":e.preventDefault(),this.commitHighlighted();break;case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=this.currentOptions();if(t.length===0||!t.some(i=>!i.disabled))return;let n=this.highlightIndex.get();do n+=e,n<0&&(n=t.length-1),n>=t.length&&(n=0);while(t[n].disabled);this.highlightIndex.set(n)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};ce.styles=`
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
            gap: ${f("space-2")};
            padding: 10px 34px 10px 12px;
            min-width: 160px;
            width: 100%;
            border: 1px solid ${f("border")};
            border-bottom: 2px solid ${f("border-strong")};
            border-radius: ${f("radius-sm")};
            background: ${f("bg")};
            color: ${f("text")};
            font-family: ${f("font-ui")};
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
            transition:
                border-color ${f("dur-fast")} ${f("ease-standard")},
                box-shadow ${f("dur-fast")} ${f("ease-standard")},
                background ${f("dur-fast")} ${f("ease-standard")};
        }
        .ui-select__trigger:focus-visible {
            outline: none;
            border-color: ${f("accent")};
            background: ${f("surface")};
            box-shadow: 0 0 0 3px ${f("accent-soft")};
        }
        .ui-select__trigger--placeholder {
            color: ${f("text-muted")};
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
            color: ${f("text-muted")};
            transition: transform ${f("dur-fast")} ${f("ease-standard")};
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
            background: ${f("surface")};
            border: 1px solid ${f("border")};
            border-radius: ${f("radius-md")};
            box-shadow: ${f("shadow-2")};
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity ${f("dur-base")} ${f("ease-standard")},
                        transform ${f("dur-base")} ${f("ease-standard")};
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
            gap: ${f("space-2")};
            padding: ${f("space-2")} ${f("space-3")};
            cursor: pointer;
            color: ${f("text")};
            font-family: ${f("font-ui")};
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
            background: ${f("surface-2")};
        }
        .ui-select__option--selected {
            color: ${f("accent-strong")};
            font-weight: 600;
        }
        /* Multi-select: selection is a checkbox plus an accent-tinted fill,
           never weight and colour alone. */
        .ui-select__option--multi.ui-select__option--selected {
            background: ${f("accent-soft")};
        }
        .ui-select__option--multi.ui-select__option--selected.ui-select__option--highlighted {
            background: ${f("accent-soft")};
            box-shadow: inset 2px 0 0 ${f("accent")};
        }
        .ui-select__checkbox {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            border: 1px solid ${f("border-strong")};
            border-radius: 3px;
            background: ${f("surface")};
            font-size: 0.625rem;
            line-height: 1;
            color: ${f("on-accent")};
        }
        .ui-select__option--selected .ui-select__checkbox {
            background: ${f("accent")};
            border-color: ${f("accent")};
        }
        .ui-select__option--header {
            cursor: default;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${f("text-muted")};
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
            color: ${f("accent-strong")};
        }
        .ui-select__count {
            padding: ${f("space-2")} ${f("space-3")};
            border-top: 1px solid ${f("border")};
            font-family: ${f("font-ui")};
            font-size: 0.75rem;
            font-weight: 600;
            color: ${f("text-muted")};
        }
    `,ce.seq=0;let Ze=ce;function Oi(s,e){return`<button bind="${s}" class="minfo-dot" type="button" aria-expanded="false" aria-label="${Ri(e)}"><span aria-hidden="true">i</span></button>`}function Ri(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}const zi=`
        .minfo-dot {
            position: relative;
            flex: none;
            appearance: none;
            width: 22px;
            height: 22px;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: none;
            cursor: pointer;
            border: 1px solid ${r("border")};
            border-radius: ${r("radius-pill")};
            color: ${r("text-muted")};
            font-size: 0.8rem;
            font-style: italic;
            font-family: serif;
            line-height: 1;

            &::after {
                content: '';
                position: absolute;
                inset: -11px;
            }

            &:hover { color: ${r("text")}; }

            &:focus-visible {
                outline: 2px solid ${r("accent-strong")};
                outline-offset: 2px;
            }
        }`,je={svart:0,black:0,vit:1,white:1,gul:2,yellow:2,blå:3,bla:3,blue:3,röd:4,rod:4,red:4,orange:5};function et(s){const e=s.name.trim().toLocaleLowerCase("sv-SE"),t=s.colour?.trim().toLocaleLowerCase("sv-SE")??"",n=e.split(/\s+/)[0]??"",i=je[e]??je[n]??je[t];if(i!==void 0)return{kind:"colour",rank:i};const o=/^(\d+(?:[.,]\d+)?)\s*(?:m)?$/i.exec(e);return o?{kind:"numeric",length:Number(o[1].replace(",","."))}:{kind:"other"}}function Hi(s){return s.map((e,t)=>({tee:e,index:t,classification:et(e)})).sort((e,t)=>{const n={numeric:0,colour:1,other:2};return e.classification.kind!==t.classification.kind?n[e.classification.kind]-n[t.classification.kind]:e.classification.kind==="numeric"&&t.classification.kind==="numeric"?t.classification.length-e.classification.length||e.index-t.index:e.classification.kind==="colour"&&t.classification.kind==="colour"?e.classification.rank-t.classification.rank||e.index-t.index:e.tee.name.localeCompare(t.tee.name,"sv-SE",{sensitivity:"base"})||e.index-t.index}).map(({tee:e})=>e)}function Es(s,e){return s.ratings.some(t=>t.gender===e)}function Di(s,e,t,n){const i=e.find(a=>a.roleKey===t&&a.gender===n)?.teeId,o=s.find(a=>a.id===i);return o&&Es(o,n)?o:null}function Mi(s,e,t,n=null){const i=[n,"club"].filter((c,d,h)=>!!c&&h.indexOf(c)===d);for(const c of i){const d=Di(s,e,c,t);if(d)return d.id}const o=t==="M"?2:4,a=Hi(s.filter(c=>Es(c,t))),l=a.find(c=>{const d=et(c);return d.kind==="colour"&&d.rank===o});return l?l.id:a.length===0?"":a.every(c=>et(c).kind==="numeric")&&t==="M"?a[0].id:a.at(-1).id}const Oe="",Cs="Not set";function Pi(s,e){return s.filter(t=>t.ratings.some(n=>n.gender===e))}function Fi(s){const e=s.colour?.trim()??"";if(e==="")return s.name;const t=vs(e);return t.toLocaleLowerCase("sv-SE")===s.name.trim().toLocaleLowerCase("sv-SE")?s.name:`${s.name} · ${t}`}function ji(s,e){return[{value:Oe,label:Cs},...Pi(s,e).map(t=>({value:t.id,label:Fi(t)}))]}function tt(s,e,t){return s.find(n=>n.roleKey===e&&n.gender===t)?.teeId??Oe}function Ui(s,e,t,n){const i=Mi(s,e,n,t),o=s.find(a=>a.id===i);return o?tt(e,t,n)===o.id?{via:"role",teeName:o.name}:tt(e,"club",n)===o.id?{via:"club",teeName:o.name}:{via:"convention",teeName:o.name}:{via:"none"}}function Bi(s,e){return s.includes("no rating for the mapped gender")?`That tee has no rating for ${A(e).toLowerCase()} any more, so it cannot be chosen here. Rate it above, or pick another tee.`:s.includes("must belong to the mapped course")?"That tee is no longer one of this course’s tees. Reload the page to see the tees as they stand.":s}function qi(s,e,t){const n=`A ${s.displayName} / ${A(e)} round`;switch(t.via){case"role":return`${n} plays from ${t.teeName} today.`;case"club":return`${n} plays from ${t.teeName} today, taken from the Club row because this row is empty.`;case"convention":return`${n} plays from ${t.teeName} today, picked by tee name because no row above applies.`;case"none":return`${n} has no tee to start from — no tee on this course is rated for ${A(e).toLowerCase()}.`}}class Ki{catalog=new m([]);courseId=new m(null);mappings=new m([]);loading=new m(!1);error=new m(null);loaded=new m(!1);inflight=null;catalogFetched=!1;load(e,t=!1){return this.courseId.get()!==e&&(this.courseId.set(e),this.mappings.set([]),this.loaded.set(!1),this.inflight=null),!t&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{const[n,i]=await Promise.all([this.catalogFetched?Promise.resolve(this.catalog.get()):N.courses.teeRoleCatalog(),N.courses.teeRoles({courseId:e})]);if(this.catalog.set(n),this.catalogFetched=!0,this.courseId.get()!==e)return;this.mappings.set(i)}catch(n){this.error.set(R(n,"Could not load the tee roles. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}mappedTeeId(e,t){return tt(this.mappings.get(),e,t)}async setRole(e,t,n){const i=this.courseId.get();return i===null?{ok:!1,message:"No course is loaded."}:this.write(()=>N.courses.setTeeRole({courseId:i,roleKey:e,gender:t,teeId:n}),"Could not save the tee role. Check your connection and try again.")}async clearRole(e,t){const n=this.courseId.get();return n===null?{ok:!1,message:"No course is loaded."}:this.write(()=>N.courses.clearTeeRole({courseId:n,roleKey:e,gender:t}),"Could not clear the tee role. Check your connection and try again.")}async write(e,t){try{await e()}catch(i){return{ok:!1,message:R(i,t)}}const n=this.courseId.get();return n!==null&&await this.load(n,!0),{ok:!0}}}const Wi=C(`
    <section class="mroles">
        <header class="mroles__head">
            <div class="mroles__heading">
                <div class="mroles__title-line">
                    <h2 class="mroles__title">Tee roles</h2>
                    ${Oi("infoDot","How tee roles are used")}
                </div>
                <p class="mroles__lead">Which tee a round starts from when it asks for a role. Only tees rated for that gender can be chosen.</p>
            </div>
        </header>

        <div bind="info" class="mroles__info">
            <p class="mroles__info-lead">Round setup asks this course for a role and a gender, follows it to a tee, and copies that tee’s rating onto the round. The copy is taken when the round starts, so changing a row here changes new rounds only — scorecards already played keep the tee they were played from.</p>
            <p class="mroles__info-head">As this course stands today</p>
            <ul bind="resolutions" class="mroles__resolutions"></ul>
            <button bind="infoClose" class="mroles__secondary" type="button">Close</button>
        </div>

        <p bind="loadError" class="mroles__error" role="alert"></p>
        <button bind="retry" class="mroles__secondary" type="button">Try again</button>
        <p bind="loadingNote" class="mroles__note" role="status" aria-live="polite"></p>
        <p bind="noTees" class="mroles__note"></p>

        <div bind="grid" class="mroles__grid">
            <div class="mroles__grid-head">
                <span>Role</span>
                <span>Men</span>
                <span>Women</span>
            </div>
            <div bind="rows" class="mroles__rows"></div>
        </div>
    </section>
`),Gi=C(`
    <div class="mrole">
        <div bind="name" class="mrole__name"></div>
        <div class="mrole__cell">
            <span class="mrole__cell-label">Men</span>
            <div bind="men" class="mrole__control"></div>
            <p bind="menBusy" class="mrole__busy" role="status" aria-live="polite"></p>
            <p bind="menError" class="mrole__cell-error" role="alert"></p>
        </div>
        <div class="mrole__cell">
            <span class="mrole__cell-label">Women</span>
            <div bind="women" class="mrole__control"></div>
            <p bind="womenBusy" class="mrole__busy" role="status" aria-live="polite"></p>
            <p bind="womenError" class="mrole__cell-error" role="alert"></p>
        </div>
    </div>
`),Vi=C('<li bind="line" class="mroles__resolution"></li>');class Yi extends E{static styles=`
        .mroles {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};
            min-width: 0;

            & .mroles__heading {
                display: flex;
                flex-direction: column;
                gap: ${u("xs")};
                min-width: 0;
            }

            & .mroles__title-line {
                display: flex;
                align-items: center;
                gap: ${u("sm")};
            }

            & .mroles__title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.35rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mroles__lead {
                margin: 0;
                max-width: 60ch;
                color: ${r("text-muted")};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mroles__note {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.85rem;
                line-height: 1.5;
                max-width: 60ch;

                &[hidden] { display: none; }
            }

            & .mroles__error {
                margin: 0;
                color: ${r("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mroles__secondary {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }

            /* The popover. An inline panel rather than a floating layer: this
               is a desk surface with room, the content is several sentences of
               live data, and a layer would have to solve clipping inside the
               course page's scroll container for no gain.

               It grows with roles × genders — six lines and ~530px today, ten
               at five roles — so it is capped and scrolls inside itself. The cap
               is what keeps the ⓘ that opened it, and the row the reader was
               looking at, on screen when the list gets long. */
            & .mroles__info {
                ${M()}
                display: flex;
                flex-direction: column;
                gap: ${u("sm")};
                padding: ${u("lg")};
                max-width: 70ch;
                max-height: min(60vh, 30rem);
                overflow-y: auto;
                overscroll-behavior: contain;

                &[hidden] { display: none; }
            }

            & .mroles__info-lead {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.9rem;
                line-height: 1.55;
            }

            & .mroles__info-head {
                margin: ${u("xs")} 0 0;
                color: ${r("text")};
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
            }

            & .mroles__resolutions {
                display: flex;
                flex-direction: column;
                gap: ${u("xs")};
                margin: 0;
                padding: 0;
                list-style: none;
            }

            & .mroles__resolution {
                color: ${r("text")};
                font-size: 0.9rem;
                line-height: 1.5;
            }

            & .mroles__grid {
                display: flex;
                flex-direction: column;
                min-width: 0;

                &[hidden] { display: none; }
            }

            & .mroles__rows {
                display: flex;
                flex-direction: column;
            }

            & .mroles__grid-head {
                display: none;
            }

            & .mrole {
                display: grid;
                grid-template-columns: 1fr;
                gap: ${u("sm")};
                padding: ${u("md")} 0;
                border-top: 1px solid ${r("border")};
                min-width: 0;
            }

            & .mrole__name {
                color: ${r("text")};
                font-size: 0.95rem;
                font-weight: 700;
            }

            & .mrole__cell {
                display: flex;
                flex-direction: column;
                gap: ${u("xs")};
                min-width: 0;
            }

            & .mrole__cell-label {
                color: ${r("text-muted")};
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
            }

            /* The framework select is inline-block by default and would shrink
               to its own minimum inside the grid column. */
            & .mrole__control .ui-select {
                display: block;
                width: 100%;
                min-width: 0;
            }

            & .mrole__control .ui-select__trigger {
                min-height: ${r("manage-touch-target")};
                min-width: 0;
            }

            & .mrole__busy {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.8rem;

                &[hidden] { display: none; }
            }

            & .mrole__cell-error {
                margin: 0;
                color: ${r("danger")};
                font-size: 0.8rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            /* Wide: real columns, with the gender said once in the header
               instead of twelve times in the cells. */
            @media ${ss} {
                & .mroles__grid-head {
                    display: grid;
                    grid-template-columns: minmax(120px, 0.8fr) minmax(0, 1fr) minmax(0, 1fr);
                    gap: ${u("md")};
                    padding: ${u("sm")} 0;
                    color: ${r("manage-table-header-fg")};
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                }

                & .mrole {
                    grid-template-columns: minmax(120px, 0.8fr) minmax(0, 1fr) minmax(0, 1fr);
                    gap: ${u("md")};
                    align-items: start;
                }

                & .mrole__name {
                    padding-top: ${u("sm")};
                }

                & .mrole__cell-label {
                    display: none;
                }
            }

            /* Narrow: the row becomes a stack, so each control says which
               gender it is for. */
            @media ${ns} {
                & .mrole {
                    gap: ${u("md")};
                }
            }
        }
        ${zi}
    `;tees=this.inject(ks);roles=this.inject(Ki);infoOpen=new m(!1);roleGenders=new D(()=>this.roles.catalog.get().flatMap(e=>j.map(t=>({key:`${e.roleKey}:${t}`,role:e,gender:t}))));section=null;render(){const e=this.wire(Wi,{infoDot:{onclick:()=>this.infoOpen.set(!this.infoOpen.get()),"aria-expanded":()=>this.infoOpen.get()?"true":"false"},info:{hidden:()=>!this.infoOpen.get()},infoClose:{onclick:()=>this.infoOpen.set(!1)},loadError:{textContent:()=>this.roles.error.get()??"",hidden:()=>this.roles.error.get()===null},retry:{hidden:()=>this.roles.error.get()===null,onclick:()=>{this.roles.load(this.props.courseId,!0)}},loadingNote:{textContent:"Loading tee roles…",hidden:()=>this.roles.loaded.get()},noTees:{textContent:"No tee on this course carries a rating yet, so there is nothing to point a role at. Add a tee with a rating above and it will appear in these lists.",hidden:()=>!this.settled()||this.hasRatedTee()},grid:{hidden:()=>!this.roles.loaded.get()||this.roles.catalog.get().length===0}});return this.$each(this.ref(e,"resolutions"),this.roleGenders,(t,n,i)=>this.wireEl(Vi,{line:()=>this.sentenceFor(t.role,t.gender)},i),t=>t.key),this.$each(this.ref(e,"rows"),this.roles.catalog,(t,n,i)=>this.roleRow(t,i),t=>t.roleKey),this.section=e.firstElementChild,e}onMount(){const{courseId:e}=this.props;this.tees.load(e),this.roles.load(e),this.track(ie(this.infoOpen));const t=n=>{if(!this.infoOpen.get())return;const i=n.target;i instanceof Node&&this.section?.contains(i)||this.infoOpen.set(!1)};document.addEventListener("pointerdown",t,!0),this.track(()=>document.removeEventListener("pointerdown",t,!0)),this.watchTeeRatings(e)}watchTeeRatings(e){let t=null;this.track(b(()=>{if(!this.tees.loaded.get())return;const n=Xi(this.tees.tees.get());if(t===null||n===t){t=n;return}t=n,this.roles.load(e,!0)}))}roleRow(e,t){const n=this.cell(e.roleKey,"M",t),i=this.cell(e.roleKey,"F",t),o=this.wireEl(Gi,{name:()=>e.displayName,menBusy:{textContent:()=>n.busy.get(),hidden:()=>n.busy.get()===""},menError:{textContent:()=>n.error.get()??"",hidden:()=>n.error.get()===null},womenBusy:{textContent:()=>i.busy.get(),hidden:()=>i.busy.get()===""},womenError:{textContent:()=>i.error.get()??"",hidden:()=>i.error.get()===null}},t);return this.mountSelect(this.ref(o,"men"),n,e,"M",t),this.mountSelect(this.ref(o,"women"),i,e,"F",t),o}mountSelect(e,t,n,i,o){const a=new Ze({value:t.value,options:{get:()=>ji(this.tees.tees.get(),i)},placeholder:Cs,disabled:{get:()=>t.busy.get()!==""}});a.mount(e),o(()=>a.destroy()),e.querySelector(".ui-select__trigger")?.setAttribute("aria-label",`${n.displayName}, ${A(i)}`)}cell(e,t,n){const i=new m(this.roles.mappedTeeId(e,t)),o=new m(""),a=new m(null);let l=i.get();n(b(()=>{const d=this.roles.mappedTeeId(e,t);l=d,i.set(d),a.set(null)}));const c=async d=>{o.set(d===Oe?"Clearing…":"Saving…"),a.set(null);const h=d===Oe?await this.roles.clearRole(e,t):await this.roles.setRole(e,t,d);if(o.set(""),h.ok)return;const p=this.roles.mappedTeeId(e,t);a.set(Bi(h.message,t)),l=p,i.set(p)};return n(b(()=>{const d=i.get();d!==l&&queueMicrotask(()=>{i.get()===d&&d!==l&&c(d)})})),{value:i,busy:o,error:a}}sentenceFor(e,t){return qi(e,t,Ui(this.tees.tees.get(),this.roles.mappings.get(),e.roleKey,t))}settled(){return this.roles.loaded.get()&&this.tees.loaded.get()}hasRatedTee(){return this.tees.tees.get().some(e=>e.ratings.length>0)}}function Xi(s){return s.map(e=>`${e.id}:${e.ratings.map(t=>t.gender).sort().join("")}`).join("|")}const Qi=C(`
    <section class="mroutes">
        <header class="mroutes__heading">
            <h2 class="mroutes__title">Routes</h2>
            <p class="mroutes__lead">Saved ways of playing this course — which holes, in which order. Rounds pick one of these instead of the whole course.</p>
        </header>

        <p bind="loadError" class="mroutes__error" role="alert"></p>
        <button bind="retry" class="mroutes__secondary" type="button">Try again</button>
        <p bind="loadingNote" class="mroutes__note" role="status" aria-live="polite"></p>
        <p bind="empty" class="mroutes__note"></p>

        <ul bind="list" class="mroutes__list"></ul>

        <p bind="deferred" class="mroutes__note"></p>
    </section>
`),Ji=C(`
    <li class="mroute">
        <span bind="name" class="mroute__name"></span>
        <span bind="meta" class="mroute__meta"></span>
    </li>
`);class Zi extends E{static styles=`
        .mroutes {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};
            min-width: 0;

            & .mroutes__heading {
                display: flex;
                flex-direction: column;
                gap: ${u("xs")};
                min-width: 0;
            }

            & .mroutes__title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.25rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mroutes__lead {
                margin: 0;
                max-width: 60ch;
                color: ${r("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mroutes__note {
                margin: 0;
                max-width: 60ch;
                color: ${r("text-muted")};
                font-size: 0.85rem;
                line-height: 1.5;

                &[hidden] { display: none; }
            }

            & .mroutes__error {
                margin: 0;
                color: ${r("danger")};
                font-size: 0.85rem;
                font-weight: 600;
                line-height: 1.4;

                &[hidden] { display: none; }
            }

            & .mroutes__list {
                ${M()}
                display: flex;
                flex-direction: column;
                gap: 0;
                margin: 0;
                padding: 0;
                list-style: none;

                &[hidden] { display: none; }
            }

            & .mroute {
                display: flex;
                flex-wrap: wrap;
                align-items: baseline;
                justify-content: space-between;
                gap: ${u("xs")} ${u("md")};
                padding: ${u("sm")} ${u("md")};
                min-width: 0;

                & + .mroute {
                    border-top: 1px solid ${r("border")};
                }
            }

            & .mroute__name {
                color: ${r("text")};
                font-size: 0.95rem;
                font-weight: 700;
                min-width: 0;
                overflow-wrap: anywhere;
            }

            & .mroute__meta {
                color: ${r("text-muted")};
                font-size: 0.85rem;
            }

            & .mroutes__secondary {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }
        }
    `;templates=new m([]);error=new m(null);loaded=new m(!1);render(){const e=this.wire(Qi,{loadError:{textContent:()=>this.error.get()??"",hidden:()=>this.error.get()===null},retry:{hidden:()=>this.error.get()===null,onclick:()=>{this.load()}},loadingNote:{textContent:"Loading routes…",hidden:()=>this.loaded.get()},empty:{textContent:"No routes saved for this course yet. Rounds play all of its holes.",hidden:()=>!this.loaded.get()||this.error.get()!==null||this.rows().length>0},list:{hidden:()=>this.rows().length===0},deferred:{textContent:"Routes are authored elsewhere for now — this list is read-only, and a route cannot be added or changed here.",hidden:()=>!this.loaded.get()||this.error.get()!==null}});return this.$each(this.ref(e,"list"),()=>this.rows(),(t,n,i)=>this.wireEl(Ji,{name:{textContent:()=>t.name},meta:{textContent:()=>tr(t)}},i),t=>t.id),e}onMount(){this.load()}rows(){return this.templates.get()}async load(){const e=this.props.courseId;this.error.set(null),this.loaded.set(!1);try{const t=await N.courseRouteTemplates.listByCourse({courseId:e});this.templates.set(er(t))}catch(t){this.error.set(R(t,"Could not load the routes. Check your connection and try again."))}finally{this.loaded.set(!0)}}}function er(s){return[...s].sort((e,t)=>t.updatedAt.localeCompare(e.updatedAt))}function tr(s){const e=s.route.playHoles.length,t=sr(s.updatedAt),n=`${e} ${e===1?"hole":"holes"}`;return t===""?n:`${n} · Updated ${t}`}function sr(s,e=typeof navigator>"u"?"en":navigator.language){const t=new Date(s);return Number.isNaN(t.getTime())?"":new Intl.DateTimeFormat(e,{dateStyle:"medium"}).format(t)}const nr=C(`
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

            <!-- The course's tees (spec §3.5). -->
            <div bind="teesHost" class="mcourse__section"></div>

            <!-- The tee-role matrix (spec §3.6). Below the tees deliberately:
                 a role points AT a tee, so the list it points into has to have
                 been read first. -->
            <div bind="teeRolesHost" class="mcourse__section"></div>

            <!-- The course's saved routes (spec §3.8), read-only. Last of the
                 four because it is the most derived: a route is written in
                 terms of the holes above it and can override a tee's lengths,
                 so it is read after both. -->
            <div bind="routesHost" class="mcourse__section"></div>

            <p class="mcourse__lead">The course’s name, hole count and position are edited on the club page.</p>
            <button bind="back" class="mcourse__secondary" type="button">Back to the club</button>
        </div>
    </section>
`);class ir extends E{static styles=`
        .mcourse {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};

            & .mcourse__heading {
                display: flex;
                flex-direction: column;
                gap: ${u("xs")};
                min-width: 0;
            }

            & .mcourse__title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.75rem;
                font-weight: 600;
                letter-spacing: -0.02em;
                color: ${r("text")};
            }

            & .mcourse__lead {
                margin: 0;
                max-width: 60ch;
                color: ${r("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mcourse__note {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.8rem;

                &[hidden] { display: none; }
            }

            & .mcourse__error {
                margin: 0;
                color: ${r("danger")};
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
                gap: ${r("manage-section-gap")};

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
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }
        }
    `;router=this.inject(q);crumbs=this.inject(me);clubs=this.inject(ze);courses=this.inject(be);params=this.router.params(zn);render(){const e=this.wire(nr,{loadingNote:{textContent:"Loading course…",hidden:()=>this.settled()},loadError:{textContent:()=>this.courses.error.get()??"",hidden:()=>this.courses.error.get()===null},retry:{hidden:()=>this.courses.error.get()===null,onclick:()=>{this.courses.load(this.clubId(),!0)}},missing:{hidden:()=>!this.settled()||this.courses.error.get()!==null||this.course()!==null},backMissing:{onclick:()=>this.backToClub()},body:{hidden:()=>this.course()===null},title:()=>this.course()?.name??"",subtitle:()=>this.summary(),back:{onclick:()=>this.backToClub()}}),t=this.courseId();return t!==""&&(this.spawn(di,this.ref(e,"holesHost"),{courseId:t}),this.spawn(Li,this.ref(e,"teesHost"),{clubId:this.clubId(),courseId:t}),this.spawn(Yi,this.ref(e,"teeRolesHost"),{courseId:t}),this.spawn(Zi,this.ref(e,"routesHost"),{courseId:t})),e}onMount(){const e=this.clubId();if(e===""||this.courseId()===""){this.router.navigate(P,!0);return}this.clubs.load(),this.courses.load(e),this.track(b(()=>{this.crumbs.set([{label:"Clubs",path:P},{label:this.clubs.byId(e)?.name??"Club",path:Le(e)},{label:this.course()?.name??"Course"}])}))}clubId(){return this.params.get().clubId}courseId(){return this.params.get().courseId}course(){const e=this.courseId();return e===""?null:this.courses.byId(e)}settled(){return this.courses.loaded.get()}summary(){const e=this.course();if(!e)return"";const t=this.clubs.byId(this.clubId()),n=`${e.holeCount} holes`;return t?`${n} at ${t.name}.`:`${n}.`}backToClub(){this.router.navigate(Le(this.clubId()))}}const rr=[{id:"courses",label:"Courses",path:P,routes:{[P]:Mn,[nt]:Qn,[it]:ir},unlocked:s=>s.canManageCourses()}];function _e(s){return rr.filter(e=>e.unlocked(s))}function or(s){const e={};for(const t of _e(s))Object.assign(e,t.routes);return e}const ar=C(`
    <nav class="mnav" aria-label="Sections">
        <ul bind="list" class="mnav__list"></ul>
    </nav>
`),lr=C(`
    <li class="mnav__item">
        <a bind="link" class="mnav__link"><span bind="label"></span></a>
    </li>
`);class Ht extends E{static styles=`
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
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("md")};
                border-radius: ${r("radius-sm")};
                color: ${r("manage-chrome-fg-muted")};
                font-size: 0.95rem;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;

                &:hover {
                    background: ${r("manage-chrome-hover-bg")};
                    color: ${r("manage-chrome-fg")};
                }

                &:focus-visible {
                    outline: 2px solid ${r("manage-chrome-fg")};
                    outline-offset: -2px;
                }

                /* Elevation, not saturation — design-guidelines §2. */
                &.mnav__link--active {
                    background: ${r("manage-chrome-active-bg")};
                    color: ${r("manage-chrome-fg")};
                    font-weight: 700;
                }
            }
        }
    `;router=this.inject(q);roles=this.inject(se);render(){const e=this.wire(ar,{});return this.$each(this.ref(e,"list"),()=>_e(this.roles),(t,n,i)=>this.wireEl(lr,{link:{href:te+t.path,className:()=>{const o=this.router.route.get();return o===t.path||o.startsWith(t.path+"/")?"mnav__link mnav__link--active":"mnav__link"},"aria-current":()=>{const o=this.router.route.get();return o===t.path||o.startsWith(t.path+"/")?"page":"false"},onclick:o=>{const a=o;a.metaKey||a.ctrlKey||a.shiftKey||a.button!==0||(o.preventDefault(),this.router.navigate(t.path),this.props.onNavigate?.())}},label:()=>t.label},i),t=>t.id),e}}const dr=C(`
    <section class="mnf">
        <h1 class="mnf__title">Nothing here</h1>
        <p class="mnf__body">That address does not match anything in Tapscore Manage.</p>
        <button bind="home" class="mnf__home" type="button"></button>
    </section>
`);class cr extends E{static styles=`
        .mnf {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: ${u("md")};

            & .mnf__title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.5rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mnf__body {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.95rem;
            }

            & .mnf__home {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("lg")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                cursor: pointer;

                &.hidden { display: none; }
            }
        }
    `;router=this.inject(q);roles=this.inject(se);crumbs=this.inject(me);onMount(){this.crumbs.set([])}render(){const e=_e(this.roles)[0];return this.wire(dr,{home:{className:()=>e?"mnf__home":"mnf__home hidden",textContent:()=>e?`Go to ${e.label}`:"",onclick:()=>{e&&this.router.navigate(e.path,!0)}}})}}const hr=C(`
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
`),ur=C(`
    <li class="mshell__crumb">
        <span bind="sep" class="mshell__crumb-sep">/</span>
        <a bind="link" class="mshell__crumb-link"></a>
        <span bind="current" class="mshell__crumb-current" aria-current="page"></span>
    </li>
`),mr=C(`
    <div class="mshell__identity-inner">
        <span bind="who" class="mshell__who"></span>
        <button bind="signout" class="mshell__signout" type="button">Sign out</button>
    </div>
`);class pr extends E{static styles=`
        .mshell {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            min-height: 100vh;
            min-height: 100dvh;
            background: ${r("bg")};

            /* ─── Chrome, shared by top bar, sidebar and drawer ─── */

            & .mshell__wordmark {
                font-family: ${r("font-display")};
                font-size: 1.05rem;
                font-weight: 400;
                letter-spacing: -0.01em;
                color: ${r("manage-chrome-fg")};
                white-space: nowrap;

                & b { font-weight: 700; }
            }

            & .mshell__brand {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${u("sm")};
                min-height: ${r("manage-touch-target")};
                padding: 0 ${u("md")};
                margin-bottom: ${r("manage-stack-gap")};
            }

            /* Inset from the chrome's edges so the active item's pill reads as
               a raised shape sitting ON the sidebar, rather than as a band
               bleeding off both sides of it. */
            & .mshell__navhost {
                flex: 1;
                padding: 0 ${u("sm")};
            }

            & .mshell__identity {
                border-top: 1px solid ${r("manage-chrome-border")};
                padding-top: ${r("manage-stack-gap")};
                margin-top: ${r("manage-stack-gap")};

                & .mshell__identity-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: ${u("sm")};
                    padding: 0 ${u("md")};
                }

                & .mshell__who {
                    color: ${r("manage-chrome-fg-muted")};
                    font-size: 0.8rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }

                & .mshell__signout {
                    ${k(void 0,"ghost")}
                    min-height: ${r("manage-touch-target")};
                    padding: 0 ${u("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    /* The recipe's tiers are drawn for the PAGE surface; on the
                       ink chrome they would paint a cream slab. Shape, sizing
                       and states come from the recipe, the skin from the chrome
                       tokens — overrides after the recipe, per ADR-005. */
                    background: transparent;
                    color: ${r("manage-chrome-fg")};
                    border-color: ${r("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${r("manage-chrome-hover-bg")};
                        color: ${r("manage-chrome-fg")};
                        border-color: ${r("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${r("manage-chrome-fg")};
                        outline-offset: 2px;
                    }
                }
            }

            /* ─── Narrow: top bar + drawer ─── */

            & .mshell__topbar {
                grid-row: 1;
                display: flex;
                align-items: center;
                gap: ${u("md")};
                padding: 0 ${r("manage-page-pad")};
                padding-top: env(safe-area-inset-top);
                min-height: calc(${r("manage-touch-target")} + ${u("md")});
                background: ${r("manage-chrome-bg")};

                & .mshell__menu {
                    ${k(void 0,"ghost")}
                    min-height: ${r("manage-touch-target")};
                    min-width: ${r("manage-touch-target")};
                    padding: 0 ${u("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    /* Same reasoning as the sign-out button above: recipe for
                       shape, chrome tokens for skin. The label is the word
                       "Menu" and not a hamburger glyph on purpose — a glyph has
                       no accessible name and this control opens the app's whole
                       navigation (docs/design-guidelines.md §4). */
                    background: transparent;
                    color: ${r("manage-chrome-fg")};
                    border-color: ${r("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${r("manage-chrome-hover-bg")};
                        color: ${r("manage-chrome-fg")};
                        border-color: ${r("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${r("manage-chrome-fg")};
                        outline-offset: 2px;
                    }
                }
            }

            & .mshell__scrim {
                position: fixed;
                inset: 0;
                z-index: 30;
                background: ${r("manage-scrim")};
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
                width: min(84vw, calc(${r("manage-sidebar-width")} + ${u("2xl")}));
                padding: ${r("manage-page-pad")} 0;
                padding-top: calc(${r("manage-page-pad")} + env(safe-area-inset-top));
                background: ${r("manage-chrome-bg")};
                /* The shadow disappears against a near-black page in dark
                   scheme, so a hairline carries the drawer's edge there. */
                border-right: 1px solid ${r("manage-chrome-border")};
                box-shadow: ${r("shadow-elevated")};
                transform: translateX(-100%);
                transition: transform 180ms ease;

                &.open { transform: translateX(0); }

                & .mshell__close {
                    ${k(void 0,"ghost")}
                    min-height: ${r("manage-touch-target")};
                    padding: 0 ${u("md")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    background: transparent;
                    color: ${r("manage-chrome-fg")};
                    border-color: ${r("manage-chrome-border")};
                    cursor: pointer;

                    &:hover {
                        background: ${r("manage-chrome-hover-bg")};
                        color: ${r("manage-chrome-fg")};
                        border-color: ${r("manage-chrome-border")};
                    }
                    &:focus-visible {
                        outline: 2px solid ${r("manage-chrome-fg")};
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
                padding: ${r("manage-page-pad")};
                padding-bottom: calc(${r("manage-section-gap")} + env(safe-area-inset-bottom));
            }

            & .mshell__crumbs {
                min-height: 1.25rem;
                margin-bottom: ${r("manage-stack-gap")};

                & ol {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: ${u("xs")};
                    font-size: 0.8rem;
                }

                & .mshell__crumb {
                    display: flex;
                    align-items: center;
                    gap: ${u("xs")};
                }

                & .mshell__crumb-sep {
                    color: ${r("text-muted")};
                    &.hidden { display: none; }
                }

                & .mshell__crumb-link {
                    color: ${r("text-muted")};
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;

                    &:hover { color: ${r("text")}; text-decoration: underline; }
                    &.hidden { display: none; }
                }

                & .mshell__crumb-current {
                    color: ${r("text")};
                    font-weight: 700;
                    &.hidden { display: none; }
                }
            }

            & .mshell__outlet {
                max-width: ${r("manage-content-max")};
            }

            /* ─── Wide: persistent sidebar, no top bar, no drawer ─── */

            @media ${xn} {
                grid-template-columns: ${r("manage-sidebar-width")} 1fr;
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
                    padding: ${r("manage-page-pad-wide")} 0;
                    background: ${r("manage-chrome-bg")};
                }

                & .mshell__main {
                    grid-column: 2;
                    grid-row: 1;
                    padding: ${r("manage-page-pad-wide")};
                }
            }

            @media (prefers-reduced-motion: reduce) {
                & .mshell__scrim,
                & .mshell__drawer { transition: none; }
            }
        }
    `;router=this.inject(q);auth=this.inject(K);roles=this.inject(se);breadcrumbs=this.inject(me);drawerOpen=new m(!1);render(){const e=_e(this.roles)[0];e&&this.router.route.get()==="/"&&this.router.navigate(e.path,!0);const t=this.wire(hr,{menu:{onclick:()=>this.drawerOpen.set(!0),"aria-expanded":()=>String(this.drawerOpen.get())},close:{onclick:()=>this.drawerOpen.set(!1)},scrim:{className:()=>this.drawerOpen.get()?"mshell__scrim open":"mshell__scrim",onclick:()=>this.drawerOpen.set(!1)},drawer:{className:()=>this.drawerOpen.get()?"mshell__drawer open":"mshell__drawer",inert:()=>!this.drawerOpen.get()}});return this.spawn(Ht,this.ref(t,"sidebarNav")),this.spawn(Ht,this.ref(t,"drawerNav"),{onNavigate:()=>this.drawerOpen.set(!1)}),this.identity(this.ref(t,"sidebarIdentity")),this.identity(this.ref(t,"drawerIdentity")),this.crumbs(this.ref(t,"crumbs")),this.$swap(this.ref(t,"outlet"),this.router.route,or(this.roles),cr),t}onMount(){this.track(b(()=>{this.router.route.get(),this.drawerOpen.set(!1)}));const e=t=>{t.key==="Escape"&&this.drawerOpen.get()&&this.drawerOpen.set(!1)};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}identity(e){e.appendChild(this.wire(mr,{who:()=>{const t=this.auth.currentUser.get();return t?`Signed in as ${t.username}`:""},signout:{onclick:()=>{this.drawerOpen.set(!1),this.auth.logout()}}}))}crumbs(e){const t=document.createElement("ol");e.appendChild(t),this.$each(t,()=>this.breadcrumbs.crumbs.get(),(n,i,o)=>this.wireEl(ur,{sep:{className:()=>i===0?"mshell__crumb-sep hidden":"mshell__crumb-sep"},link:{className:()=>n.path?"mshell__crumb-link":"mshell__crumb-link hidden",href:n.path?te+n.path:"",textContent:()=>n.path?n.label:"",onclick:a=>{const l=a;l.metaKey||l.ctrlKey||l.shiftKey||l.button!==0||(a.preventDefault(),n.path&&this.router.navigate(n.path))}},current:{className:()=>n.path?"mshell__crumb-current hidden":"mshell__crumb-current",textContent:()=>n.path?"":n.label}},o),vn)}}const Ue="Something went wrong on our end. Try again in a moment.";function gr(s,e){const t=(s.details??[]).map(i=>i.path),n=i=>t.some(o=>o===`/${i}`);return n("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":n("username")?"Enter your username.":n("displayName")?"Enter a display name.":n("handicapIndex")?"Handicap index must be a number (or leave it empty).":n("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function fr(s,e){if(s instanceof O)switch(s.status){case 400:return gr(s,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":Ue;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return s.status>=500?Ue:"That request could not be completed."}return s instanceof Error&&s.message==="Request timeout"?"That took too long. Check your connection and try again.":s instanceof Error?"Cannot reach the server. Check your connection and try again.":Ue}const br=C(`
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
`);class _r extends E{static styles=`
        .msignin {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${r("manage-page-pad")};

            & .msignin__panel {
                ${M({})}
                display: flex;
                flex-direction: column;
                gap: ${u("md")};
                width: 100%;
                max-width: 22rem;
                padding: ${r("manage-page-pad-wide")};

                &[inert] { opacity: 0.6; }
            }

            & .msignin__brand {
                font-family: ${r("font-display")};
                font-size: 1.5rem;
                font-weight: 400;
                letter-spacing: -0.01em;
                color: ${r("text")};

                & b { font-weight: 700; }
            }

            & .msignin__lead {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.9rem;
            }

            & .msignin__error {
                display: none;
                color: ${r("error")};
                font-size: 0.85rem;
                line-height: 1.4;

                &.show { display: block; }
            }

            & .msignin__field {
                display: flex;
                flex-direction: column;
                gap: ${u("xs")};

                & span {
                    color: ${r("text-muted")};
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                & input {
                    ${Zt()}
                    min-height: ${r("manage-touch-target")};
                    padding: 0 ${u("md")};
                    font-family: inherit;
                    font-size: 1rem;
                }
            }

            & .msignin__submit {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                margin-top: ${u("xs")};
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
            }
        }
    `;auth=this.inject(K);roles=this.inject(se);username="";password="";busy=new m(!1);formError=new m("");render(){return this.wire(br,{form:{inert:()=>this.busy.get(),onsubmit:async e=>{e.preventDefault(),await this.submit()}},error:{className:()=>this.formError.get()?"msignin__error show":"msignin__error",textContent:()=>this.formError.get()},username:{oninput:e=>{this.username=e.target.value}},password:{oninput:e=>{this.password=e.target.value}},submit:{textContent:()=>this.busy.get()?"Signing in…":"Sign in"}})}async submit(){if(this.formError.set(""),!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const e=await Qt.login(this.username.trim(),this.password);this.roles.clear(),this.auth.error.set(null),this.auth.currentUser.set(e)}catch(e){this.formError.set(fr(e,"login")),this.busy.set(!1)}}}const yr=C(`
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
`);class wr extends E{static styles=`
        .mdenied {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${r("manage-page-pad")};

            & .mdenied__panel {
                ${M({})}
                display: flex;
                flex-direction: column;
                gap: ${u("md")};
                width: 100%;
                max-width: 30rem;
                padding: ${r("manage-page-pad-wide")};
            }

            & .mdenied__title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.5rem;
                font-weight: 600;
                letter-spacing: -0.01em;
                color: ${r("text")};
            }

            & .mdenied__body {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mdenied__hint {
                margin: 0;
                color: ${r("text-muted")};
                font-size: 0.85rem;
            }

            & .mdenied__command {
                display: block;
                padding: ${u("sm")} ${u("md")};
                border-radius: ${r("radius-sm")};
                background: ${r("surface-sunken")};
                border: 1px solid ${r("border")};
                color: ${r("text")};
                font-size: 0.8rem;
                line-height: 1.5;
                word-break: break-all;
            }

            & .mdenied__foot {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: ${u("md")};
                border-top: 1px solid ${r("border")};
                padding-top: ${u("md")};

                & .mdenied__who {
                    color: ${r("text-muted")};
                    font-size: 0.8rem;
                }

                & .mdenied__signout {
                    ${k()}
                    min-height: ${r("manage-touch-target")};
                    padding: 0 ${u("lg")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                }
            }
        }
    `;auth=this.inject(K);render(){return this.wire(yr,{command:()=>`bun run grant:role grant ${this.auth.currentUser.get()?.username??"<username>"} super_admin`,who:()=>{const e=this.auth.currentUser.get();return e?`Signed in as ${e.username}`:""},signout:{onclick:()=>{this.auth.logout()}}})}}const vr=C(`
    <div class="mboot">
        <p class="mboot__line">Loading…</p>
    </div>
`),$r=C(`
    <div class="mboot">
        <h1 class="mboot__title">Cannot reach the server</h1>
        <p class="mboot__line">Tapscore Manage could not check what you are allowed to manage.</p>
        <button bind="retry" class="mboot__retry" type="button">Try again</button>
    </div>
`),Ts=`
    .mboot {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: ${u("md")};
        min-height: 100vh;
        min-height: 100dvh;
        padding: ${r("manage-page-pad")};
        text-align: center;

        & .mboot__title {
            margin: 0;
            font-family: ${r("font-display")};
            font-size: 1.5rem;
            font-weight: 600;
            color: ${r("text")};
        }

        & .mboot__line {
            margin: 0;
            max-width: 44ch;
            color: ${r("text-muted")};
            font-size: 0.95rem;
            line-height: 1.5;
        }

        & .mboot__retry {
            ${k()}
            min-height: ${r("manage-touch-target")};
            padding: 0 ${u("lg")};
            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
        }
    }
`;class xr extends E{static styles=Ts;render(){return this.wire(vr,{})}}class kr extends E{static styles=Ts;roles=this.inject(se);auth=this.inject(K);render(){return this.wire($r,{retry:{onclick:()=>{this.auth.load(),this.roles.load(!0)}}})}}const Er=C('<div bind="gate" class="mapp"></div>');class Cr extends E{static styles=`
        .mapp { min-height: 100vh; min-height: 100dvh; }
    `;auth=this.inject(K);roles=this.inject(se);gate=new D(()=>this.auth.loading.get()?"loading":this.auth.currentUser.get()===null?this.auth.error.get()?"failed":"signed-out":this.roles.error.get()?"failed":this.roles.loaded.get()?_e(this.roles).length>0?"ready":"denied":"loading");render(){const e=this.wire(Er,{});return this.track(b(()=>{this.auth.currentUser.get()?this.roles.load():this.roles.clear()})),this.$swap(this.ref(e,"gate"),this.gate,{loading:xr,failed:kr,"signed-out":_r,denied:wr,ready:pr}),e}}B.get(Ut);cn();B.set(K,new hn(Qt));const Tr=B.get(K);await Ys(Cr,"#app",{hot:void 0,onInit:async()=>{await Tr.load()}});export{Be as A,E as C,q as R,m as S,Ut as T,w as a,he as b,D as c,Ds as d,b as e,Hs as n,we as r,C as t};
