(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();const Ct="modulepreload",Tt=function(s){return"/tapscore/manage/"+s},Le={},St=function(e,t,n){let i=Promise.resolve();if(t&&t.length>0){let u=function(d){return Promise.all(d.map(h=>Promise.resolve(h).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),l=a?.nonce||a?.getAttribute("nonce");i=u(t.map(d=>{if(d=Tt(d),d in Le)return;Le[d]=!0;const h=d.endsWith(".css"),g=h?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${g}`))return;const $=document.createElement("link");if($.rel=h?"stylesheet":Ct,h||($.as="script"),$.crossOrigin="",$.href=d,l&&$.setAttribute("nonce",l),document.head.appendChild($),h)return new Promise((E,G)=>{$.addEventListener("load",E),$.addEventListener("error",()=>G(new Error(`Unable to preload CSS for ${d}`)))})}))}function o(a){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=a,window.dispatchEvent(l),!l.defaultPrevented)throw a}return i.then(a=>{for(const l of a||[])l.status==="rejected"&&o(l.reason);return e().catch(o)})},P="/tapscore/manage/".replace(/\/+$/,""),ue=P+"/api",ie={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},Lt=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function It(s,e){const t={};for(const[n,i]of Lt)if(n in s)for(const o of i)o in s||(t[o]=`var(--${n})`);return{...e,...t,...s}}const Ke=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],Nt={thin:"1px",medium:"3px",thick:"5px"};function Ge(s){const e=s.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":Nt[e.toLowerCase()]??e}function Ot(){return Ke.map(s=>{const e=Ge(ie[s]);return`@property --${s}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const We={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Ye={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},At={...Ye,"done-opacity":"0.35"},zt={...We,...Ye,...ie,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},Dt={...We,...At,...ie,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class Pt{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;Ve(e);const n=this.tracking;this.tracking=e;try{t()}finally{this.tracking=n}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const n of t)n.disposed||n.run()}}}const N=new Pt;function Ve(s){for(const e of s.deps)e.delete(s);s.deps.clear()}class m{constructor(e){this.subs=new Set,this.val=e}get(){return N.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,N.notify(this.subs))}update(e){this.set(e(this.val))}}class D{constructor(e){this.subs=new Set,this.val=void 0;const t=this,n={run(){N.runTracked(n,()=>{const i=e();Object.is(t.val,i)||(t.val=i,N.notify(t.subs))})},deps:new Set};n.run()}get(){return N.subscribe(this.subs),this.val}peek(){return this.val}}function w(s){const e={run(){N.runTracked(e,s)},deps:new Set};return e.run(),()=>{e.disposed=!0,Ve(e)}}function ee(s){N.batch(s)}function T(s){return N.untrack(s)}class Rt{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const z=new Rt,U=P;function he(s){return U?s===U?"/":s.startsWith(U+"/")?s.slice(U.length):s:s}function jt(s){return U+s}class O{constructor(){this.route=new m(he(location.pathname??"/")),this.search=new m(location.search??""),window.addEventListener("popstate",()=>ee(()=>{this.route.set(he(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const n=typeof t=="boolean"?{replace:t}:t??{},i=e.indexOf("#"),o=i>=0?e.slice(i):"",a=i>=0?e.slice(0,i):e,l=a.indexOf("?"),u=l>=0?a.slice(0,l):a,d=l>=0?a.slice(l+1):"",h=n.query!==void 0?Ut(n.query):d?"?"+d:"",g=jt(u)+h+o;(n.replace?history.replaceState:history.pushState).call(history,null,"",g),ee(()=>{this.route.set(u),this.search.set(h)})}back(){history.back()}link(e,t="active"){const n=e.split("#")[0].split("?")[0];return{onclick:i=>{i.preventDefault(),this.navigate(e)},className:()=>{const i=this.route.get();return i===n||i.startsWith(n+"/")?t:""}}}params(e){const t=e.split("/");return new D(()=>{const n=this.route.get().split("/"),i={};for(const[o,a]of t.entries())a.startsWith(":")&&(i[a.slice(1)]=n[o]??"");return i})}query(e){return new D(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new D(()=>{const e={};for(const[t,n]of new URLSearchParams(this.search.get()))e[t]=n;return e})}}function Ut(s){const e=new URLSearchParams;for(const[n,i]of Object.entries(s))i==null||i===""||e.set(n,String(i));const t=e.toString();return t?"?"+t:""}function Ft(s){return e=>s[e]}const Mt="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",Ie="data-basics-global";function qt(){if(document.head.querySelector(`style[${Ie}]`))return;const s=document.createElement("style");s.setAttribute(Ie,""),s.textContent=Ot()+Mt,document.head.appendChild(s)}function Ht(s,e){qt();const t=new Set(Ke),n=(o,a,l)=>{const u=Object.entries(o).map(([d,h])=>`--${d}:${t.has(d)?Ge(h):h}`).join(";");return`${a}{color-scheme:${l};${u}}`},i=document.createElement("style");return i.textContent=n(s,'[data-theme="light"]',"light")+n(e,'[data-theme="dark"]',"dark"),document.head.appendChild(i),o=>`var(--${o})`}const Ne="basics-js-theme";class Xe{constructor(){this.dark=new m(!1);const e=localStorage.getItem(Ne),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),w(()=>{const n=this.dark.get();document.documentElement.setAttribute("data-theme",n?"dark":"light"),localStorage.setItem(Ne,n?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function C(s){const e=document.createElement("template");return e.innerHTML=s,e}function Bt(s,e){let t;for(const n of Object.keys(e))s.startsWith(n+"/")&&(!t||n.length>t.length)&&(t=n);return t?e[t]:void 0}const Oe=new Set;class x{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!Oe.has(t)){Oe.add(t);const n=document.createElement("style");n.textContent=t.styles,document.head.appendChild(n)}}onMount(){}onDestroy(){}inject(e){return z.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...n){const i=T(()=>{const o=new e(n[0]);return o.mount(t),o});return this.children.push(i),i}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){T(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,n){const i=n??(a=>this.track(a)),o=e.content.cloneNode(!0);for(const a of o.querySelectorAll("[bind]")){const l=t[a.getAttribute("bind")];if(l)if(typeof l=="function")i(w(()=>{const u=l();a instanceof HTMLInputElement||a instanceof HTMLTextAreaElement?a.value=String(u):a.textContent=String(u)}));else for(const[u,d]of Object.entries(l)){const h=u.includes("-");u.startsWith("on")&&typeof d=="function"?a.addEventListener(u.slice(2),d):typeof d=="function"?i(w(()=>{const g=d();h?a.setAttribute(u,String(g)):a[u]=g})):h?a.setAttribute(u,String(d)):a[u]=d}}return o}wireEl(e,t,n){return this.wire(e,t,n).firstElementChild}slot(e,t){const n=this.props[e];if(n==null)return!1;const i=this.ref(t,e);return i?(typeof n=="string"?i.textContent=n:typeof n=="function"&&n.prototype instanceof x?this.spawn(n,i):typeof n=="function"&&n(i,{spawn:(o,a,...l)=>this.spawn(o,a,...l),track:o=>this.track(o)}),!0):!1}$each(e,t,n,i=(o,a)=>a){const o=typeof t=="function"?t:()=>t.get(),a=new Map,l=new Map;this.track(()=>{for(const u of l.values())u.forEach(d=>d());l.clear()}),this.track(w(()=>{const u=o(),d=new Map;for(const[g,$]of u.entries()){const E=i($,g);if(a.has(E))d.set(E,a.get(E));else{const G=[];d.set(E,T(()=>n($,g,Et=>G.push(Et)))),l.set(E,G)}}for(const[g,$]of a)d.has(g)||($.remove(),T(()=>l.get(g)?.forEach(E=>E())),l.delete(g));let h=e.firstChild;for(const g of d.values())g===h?h=h.nextSibling:e.insertBefore(g,h);a.clear();for(const[g,$]of d)a.set(g,$)}))}$condition(e,t,n,i){let o=null;this.track(w(()=>{o&&(o.remove(),o=null);const a=t.get();o=T(()=>a?n():i?.()??null),o&&e.appendChild(o)}))}$swap(e,t,n,i){let o=null;this.track(w(()=>{if(o){const u=o;o=null,T(()=>u.destroy())}e.textContent="";const a=t.get(),l=n[a]??Bt(a,n)??i;l&&(o=T(()=>{const u=new l;return u.mount(e),u}))})),this.track(()=>o?.destroy())}}const te=new Set;function Kt(s){return te.add(s),()=>te.delete(s)}function Gt(){for(const s of Array.from(te)){te.delete(s);try{s()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function Wt(s,e,t){const n=document.querySelector(e);n.textContent="";const i=z.get(O);let o=null,a=!1,l=null,u=!!t?.hot?.data.hmr;const d=async h=>{o&&(o.destroy(),o=null,n.textContent=""),h?(l||(l=(await St(()=>import("./obs-shell.component-DGC3n2ch.js"),[])).ObsShellComponent),o=T(()=>new l)):(!u&&t?.onInit&&(await t.onInit(),u=!0),o=T(()=>new s)),T(()=>o.mount(n)),a=h};await d(he(location.pathname).startsWith("/_obs")),w(()=>{const h=i.route.get().startsWith("/_obs");h!==a&&d(h)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{o?.destroy()}catch(h){console.error("[startApp] the root component threw while disposing",h)}if(o=null,Gt(),t.onDispose)try{t.onDispose()}catch(h){console.error("[startApp] onDispose threw",h)}}),t.hot.accept())}class S extends Error{constructor(e,t,n,i){super(t),this.status=e,this.details=n,this.traceId=i,this.name="ApiError"}}const Yt=10,J=[];let Z=[],M=null;function Vt(s){J.push(s),J.length>Yt&&J.shift()}function se(s,e,t){const n={code:s,message:e,url:typeof location<"u"?location.href:"",context:[...J],timestamp:new Date().toISOString()};t!==void 0&&(n.traceId=t),Z.push(n),Xt()}function Xt(){M||(M=setTimeout(Qe,5e3))}function Qe(){if(M&&(clearTimeout(M),M=null),Z.length===0)return;const s=Z;Z=[];for(const e of s){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${ue}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${ue}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Qe()});const Qt=3e4,Jt=2,W=new Map,Je=new WeakMap;function me(s){if(s instanceof S)return s.traceId;if(s!=null&&typeof s=="object")return Je.get(s)}async function _(s){if(s.method==="GET"){const e=W.get(s.url);if(e)return e;const t=Ae(s,Jt);return W.set(s.url,t),t.then(()=>W.delete(s.url),()=>W.delete(s.url)),t}return Ae(s,0)}async function Ae(s,e){const t=s.timeout??Qt;let n;for(let i=0;i<=e;i++){const o=crypto.randomUUID();try{return await es(Zt(s,o),t)}catch(a){if(n=a,!(a instanceof S)&&a!=null&&typeof a=="object"&&Je.set(a,o),a instanceof S||i===e)break;await new Promise(l=>setTimeout(l,1e3*2**i))}}throw n}async function Zt(s,e){const t={"X-Trace-Id":e},n={method:s.method,headers:t};s.body!==void 0&&(t["Content-Type"]="application/json",n.body=JSON.stringify(s.body));const i=await fetch(s.url,n),o=i.headers.get("x-trace-id")??e;if(Vt({type:"api",detail:`${s.method} ${s.url}`,timestamp:new Date().toISOString()}),!i.ok){const a=await i.json().catch(()=>({error:i.statusText}));throw new S(i.status,a.error??i.statusText,a.details,o)}return i.json()}function es(s,e){let t;const n=new Promise((i,o)=>{t=setTimeout(()=>o(new Error("Request timeout")),e)});return Promise.race([s,n]).finally(()=>clearTimeout(t))}const ge=new Set;let le=!1;function ts(s){return ge.add(s),()=>{ge.delete(s)}}function ye(){if(!le){le=!0;try{for(const s of[...ge])try{s()}catch(e){try{se("session-listener",ss(e))}catch{}}}finally{le=!1}}}function ss(s){try{if(s instanceof Error){const e=s.message;if(typeof e=="string")return e}return String(s)}catch{return"listener threw a value that could not be described"}}async function Y(s,e,t,n={}){ee(()=>{s.set(!0),e.set(null)});try{const i=await t();return s.set(!1),i}catch(i){const o=ns(i);ee(()=>{s.set(!1),e.set(o)}),se(o.code,o.message,me(i)),o.code==="auth"&&n.sessionExpiry!==!1&&ye();return}}function ns(s){return s instanceof S?s.status===401?{code:"auth",message:"Unauthorized"}:s.status===409?{code:"conflict",message:"Data has changed — please try again"}:s.status===400?{code:"validation",message:s.message}:s.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:s instanceof Error?s.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const ce={sessionExpiry:!1};function rs(s){return{me:()=>_({method:"GET",url:`${s}/auth/me`}),login:e=>_({method:"POST",url:`${s}/auth/login`,body:e}),logout:()=>_({method:"POST",url:`${s}/auth/logout`,body:{}}),logoutAll:()=>_({method:"POST",url:`${s}/auth/logout-all`,body:{}})}}class A{constructor(){this.api=rs(ue),this.currentUser=new m(null),this.loading=new m(!1),this.error=new m(null),this.offSessionExpired=ts(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=Kt(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await Y(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const n=await Y(this.loading,this.error,()=>this.api.login({username:e,password:t}),ce);return n?(this.currentUser.set(n),!0):!1}async logout(){await Y(this.loading,this.error,()=>this.api.logout(),ce);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}async logoutEverywhere(){const e=await Y(this.loading,this.error,()=>this.api.logoutAll(),ce),t=this.error.get();return(!t||t.code==="auth")&&this.currentUser.set(null),e?.revoked??null}}const Ze={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},is={...Ze,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},os={...Ze,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"};function et(s,e={}){const t=s==="light"?is:os,n=s==="light"?zt:Dt;return It({...t,...e},n)}const tt={"manage-page-pad":"var(--space-4)","manage-page-pad-wide":"var(--space-6)","manage-stack-gap":"var(--space-3)","manage-section-gap":"var(--space-5)","manage-touch-target":"44px","manage-table-bg":"var(--surface)","manage-table-radius":"var(--radius)","manage-table-border":"var(--border)","manage-table-header-bg":"var(--surface-sunken)","manage-table-header-fg":"var(--text-muted)","manage-table-header-border":"var(--border-strong)","manage-table-header-pad-y":"var(--space-2)","manage-table-header-pad-x":"var(--space-3)","manage-table-cell-pad-y":"var(--space-3)","manage-table-cell-pad-x":"var(--space-3)","manage-table-row-border":"var(--border)","manage-table-row-hover-bg":"var(--hover-bg)","manage-table-row-editing-bg":"var(--accent-soft)","manage-table-card-gap":"var(--space-2)","btn-danger-bg":"transparent","btn-danger-fg":"var(--danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger)","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger)","manage-sidebar-width":"232px","manage-content-max":"1120px"},st=s=>({"manage-chrome-bg":"var(--topbar-bg)","manage-chrome-fg":s,"manage-chrome-fg-muted":"color-mix(in srgb, var(--manage-chrome-fg) 66%, transparent)","manage-chrome-border":"color-mix(in srgb, var(--manage-chrome-fg) 14%, transparent)","manage-chrome-hover-bg":"color-mix(in srgb, var(--manage-chrome-fg) 9%, transparent)","manage-chrome-active-bg":"color-mix(in srgb, var(--manage-chrome-fg) 16%, transparent)","manage-scrim":"color-mix(in srgb, var(--topbar-bg) 62%, transparent)"}),nt=et("light",{...tt,...st("var(--primary-text)")}),rt=et("dark",{...tt,...st("var(--text)")}),r=Ht(nt,rt);function as(){const s=document.querySelector('meta[name="theme-color"]');if(!s)return;const e=z.get(Xe);w(()=>{const n=(e.dark.get()?rt:nt)["topbar-bg"];n&&s.setAttribute("content",n)})}class ls extends A{constructor(e){super(),this.client=e}client;async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await this.client.login(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await this.client.me()),this.error.set(null)}catch(e){e instanceof S&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await this.client.logout(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof S&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logoutEverywhere(){this.loading.set(!0);try{const e=await this.client.logoutAll();return this.currentUser.set(null),this.error.set(null),e.revoked}catch(e){return e instanceof S&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"}),null}finally{this.loading.set(!1)}}}function cs(s){return{login:(e,t)=>_({method:"POST",url:`${s}/auth/login`,body:{username:e,password:t}}),me:()=>_({method:"GET",url:`${s}/auth/me`}),logout:()=>_({method:"POST",url:`${s}/auth/logout`,body:{}}),logoutAll:()=>_({method:"POST",url:`${s}/auth/logout-all`,body:{}})}}const F="/tapscore/manage/".replace(/\/+$/,"").replace(/\/manage$/,"")+"/api",it=cs(F);function ds(s){return{async list(){return _({method:"GET",url:`${s}/clubs`})},async get(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return _({method:"GET",url:`${s}/clubs/get${n?"?"+n:""}`})},async create(e){return _({method:"POST",url:`${s}/clubs`,body:e})},async update(e){return _({method:"POST",url:`${s}/clubs/update`,body:e})},async remove(e){return _({method:"DELETE",url:`${s}/clubs/${e.id}`})}}}function us(s){return{async list(){return _({method:"GET",url:`${s}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return _({method:"GET",url:`${s}/courses/by-club${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return _({method:"GET",url:`${s}/courses/get${n?"?"+n:""}`})},async teeRoleCatalog(){return _({method:"GET",url:`${s}/courses/tee-roles/catalog`})},async teeRoles(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return _({method:"GET",url:`${s}/courses/tee-roles${n?"?"+n:""}`})},async create(e){return _({method:"POST",url:`${s}/courses`,body:e})},async update(e){return _({method:"POST",url:`${s}/courses/update`,body:e})},async updateHole(e){return _({method:"POST",url:`${s}/courses/holes/update`,body:e})},async setTeeRole(e){return _({method:"POST",url:`${s}/courses/tee-roles`,body:e})},async clearTeeRole(e){return _({method:"DELETE",url:`${s}/courses/tee-roles/${e.courseId}/${e.roleKey}/${e.gender}`})},async validate(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return _({method:"GET",url:`${s}/courses/validate${n?"?"+n:""}`})},async remove(e){return _({method:"DELETE",url:`${s}/courses/${e.id}`})}}}function hs(s){return{async listByCourse(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return _({method:"GET",url:`${s}/tees/by-course${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return _({method:"GET",url:`${s}/tees/get${n?"?"+n:""}`})},async create(e){return _({method:"POST",url:`${s}/tees`,body:e})},async update(e){return _({method:"POST",url:`${s}/tees/update`,body:e})},async remove(e){return _({method:"DELETE",url:`${s}/tees/${e.id}`})}}}function ms(s){return{async myRoles(){return _({method:"GET",url:`${s}/me/roles`})},async adminStats(){return _({method:"GET",url:`${s}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const n=t.toString();return _({method:"GET",url:`${s}/admin/rounds${n?"?"+n:""}`})},async adminPlayers(){return _({method:"GET",url:`${s}/admin/players`})},async adminGrantRole(e){return _({method:"POST",url:`${s}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return _({method:"POST",url:`${s}/admin/roles/revoke`,body:e})}}}const L={clubs:ds(F),courses:us(F),tees:hs(F),admin:ms(F)};class R{roles=new m([]);loaded=new m(!1);error=new m(null);inflight=null;isSuperAdmin(){return this.has("super_admin")}canManageCourses(){return this.isSuperAdmin()||this.has("course_admin")}has(e){return this.roles.get().some(t=>t.role===e&&t.scopeType===null)}load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.error.set(null);try{this.roles.set(await L.admin.myRoles())}catch(t){this.roles.set([]),t instanceof S&&t.status===401?ye():(this.error.set("Cannot reach the server."),this.inflight=null)}finally{this.loaded.set(!0)}})(),this.inflight)}clear(){this.roles.set([]),this.loaded.set(!1),this.error.set(null),this.inflight=null}}const Ce=class Ce extends x{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(w(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};Ce.styles=`
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
    `;let fe=Ce;const y=s=>`var(--${s})`,Te=class Te extends x{render(){const e=document.createElement("div"),t=(u,d)=>{typeof d=="function"?this.track(w(()=>{u.textContent=d()})):u.textContent=d};this.spawn(fe,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const n=document.createElement("h2");n.className="ui-confirm__title",t(n,this.props.title??"Confirm"),this.dialogEl.appendChild(n);const i=document.createElement("p");i.className="ui-confirm__message",t(i,this.props.message),this.dialogEl.appendChild(i);const o=document.createElement("div");o.className="ui-confirm__actions";const a=document.createElement("button");a.className="ui-confirm__btn ui-confirm__btn--cancel",t(a,this.props.cancelLabel??"Cancel"),a.addEventListener("click",u=>{u.stopPropagation(),this.handleCancel()}),o.appendChild(a);const l=document.createElement("button");return l.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(l,this.props.confirmLabel??"Confirm"),l.addEventListener("click",u=>{u.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),o.appendChild(l),this.dialogEl.appendChild(o),this.dialogEl.addEventListener("click",u=>u.stopPropagation()),e.appendChild(this.dialogEl),this.track(w(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};Te.styles=`
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
    `;let q=Te;const b=s=>`var(--${s})`,f=(s,e)=>`var(--${s}, ${e})`,p=s=>{const e=ie[s];if(e===void 0)throw new Error(`unknown control token: --${s}`);return e},c=Ft({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),V=s=>`
    background: ${f(`btn-${s}-bg`,p(`btn-${s}-bg`))};
    color: ${f(`btn-${s}-fg`,p(`btn-${s}-fg`))};
    border-color: ${f(`btn-${s}-border`,p(`btn-${s}-border`))};
    box-shadow: ${f(`btn-${s}-shadow`,p(`btn-${s}-shadow`))};
    &:hover {
        background: ${f(`btn-${s}-bg-hover`,p(`btn-${s}-bg-hover`))};
        color: ${f(`btn-${s}-fg-hover`,p(`btn-${s}-fg-hover`))};
        border-color: ${f(`btn-${s}-border-hover`,p(`btn-${s}-border-hover`))};
    }`,ot=`
    background: ${f("btn-disabled-bg",p("btn-disabled-bg"))};
    color: ${f("btn-disabled-fg",p("btn-disabled-fg"))};
    border-color: ${f("btn-disabled-border",p("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${f("btn-disabled-opacity",p("btn-disabled-opacity"))};
    cursor: not-allowed;`,gs={primary:V("primary"),secondary:V("secondary"),ghost:V("ghost"),danger:V("danger"),disabled:ot},k=(s=f("btn-radius",p("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${f("btn-border-width",p("btn-border-width"))} solid transparent;
    border-radius: ${s};
    padding: ${f("btn-padding-y",p("btn-padding-y"))} ${f("btn-padding-x",p("btn-padding-x"))};
    font-family: ${b("font-ui")};
    font-size: ${f("btn-font-size",p("btn-font-size"))};
    line-height: ${f("btn-line-height",p("btn-line-height"))};
    font-weight: ${f("btn-font-weight",p("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${b("dur-fast")} ${b("ease-standard")},
        border-color ${b("dur-fast")} ${b("ease-standard")},
        color ${b("dur-fast")} ${b("ease-standard")},
        box-shadow ${b("dur-fast")} ${b("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${f("btn-focus-ring-width",p("btn-focus-ring-width"))} ${f("btn-focus-ring",p("btn-focus-ring"))};
    }
    ${gs[e]}
    &:disabled {${ot}}
`,fs=`max(${f("field-border-width",p("field-border-width"))}, ${f("field-rule-width",p("field-rule-width"))})`,X=(s,e)=>`
    border-top-color: ${s};
    border-right-color: ${s};
    border-left-color: ${s};
    border-bottom-color: ${e};`,at=()=>`
    border-style: solid;
    border-top-width: ${f("field-border-width",p("field-border-width"))};
    border-right-width: ${f("field-border-width",p("field-border-width"))};
    border-left-width: ${f("field-border-width",p("field-border-width"))};
    border-bottom-width: ${fs};
    ${X(f("field-border",p("field-border")),f("field-rule",p("field-rule")))}
    border-radius: ${f("field-radius",p("field-radius"))};
    padding: ${f("field-padding-y",p("field-padding-y"))} ${f("field-padding-x",p("field-padding-x"))};
    background: ${f("field-bg",p("field-bg"))};
    color: ${b("text")};
    font-family: ${b("font-ui")};
    font-size: ${f("field-font-size",p("field-font-size"))};
    line-height: ${f("field-line-height",p("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${b("dur-fast")} ${b("ease-standard")},
        box-shadow ${b("dur-fast")} ${b("ease-standard")},
        background ${b("dur-fast")} ${b("ease-standard")};
    &::placeholder { color: ${b("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${X(f("field-focus-border",p("field-focus-border")),f("field-focus-border",p("field-focus-border")))}
        background: ${f("field-bg-focus",p("field-bg-focus"))};
        box-shadow: 0 0 0 ${f("field-focus-ring-width",p("field-focus-ring-width"))} ${f("field-focus-ring",p("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${X(f("field-invalid-border",p("field-invalid-border")),f("field-invalid-rule",p("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${X(f("field-invalid-border",p("field-invalid-border")),f("field-invalid-rule",p("field-invalid-rule")))}
        background: ${f("field-bg-focus",p("field-bg-focus"))};
        box-shadow: 0 0 0 ${f("field-focus-ring-width",p("field-focus-ring-width"))} ${f("field-invalid-ring",p("field-invalid-ring"))};
    }
`,lt=()=>`
    display: block;
    font-family: ${b("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${b("text-muted")};
`,ps=()=>`
    display: block;
    font-family: ${b("font-ui")};
    font-size: 13px;
    line-height: 20px;
    color: ${b("danger")};
`,j=s=>`
    background: ${b("surface")};
    border: 1px solid ${b("border")};
    border-radius: ${b("radius-md")};
    box-shadow: ${b("shadow-1")};
    ${s?.hover?`
    transition:
        box-shadow ${b("dur-base")} ${b("ease-standard")},
        border-color ${b("dur-base")} ${b("ease-standard")};
    &:hover { box-shadow: ${b("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${lt()}
        margin: 0 0 ${c("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${b("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${b("text")};
    }
    & .ui-card__meta {
        margin: ${c("xs")} 0 0 0;
        font-family: ${b("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${b("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${c("md")};
        font-family: ${b("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${b("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;class B{crumbs=new m([]);set(e){this.crumbs.set(e)}}const v=s=>`var(--${s})`,Se=class Se extends x{render(){const e=document.createElement("div");e.className="ui-empty-state";const t=a=>typeof a=="function"?a():a,n=(a,l)=>{typeof l=="function"?this.track(w(()=>{a.textContent=t(l)})):a.textContent=l};if(this.props.ornament!==!1){const a=document.createElement("div");a.className="ui-empty-state__ornament",a.setAttribute("aria-hidden","true"),e.appendChild(a)}const i=document.createElement(`h${this.props.headingLevel??3}`);if(i.className="ui-empty-state__heading",n(i,this.props.heading),e.appendChild(i),this.props.body!==void 0){const a=document.createElement("p");a.className="ui-empty-state__body",n(a,this.props.body),e.appendChild(a)}const o=this.props.action;if(o){const a=document.createElement("button");a.className="ui-empty-state__action",a.setAttribute("type","button"),o.ariaLabel&&a.setAttribute("aria-label",o.ariaLabel),n(a,o.label),a.addEventListener("click",()=>o.onclick()),e.appendChild(a)}return e}};Se.styles=`
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
    `;let pe=Se;const bs=900,ys=`(min-width: ${bs}px)`,ct=660,_s=`(min-width: ${ct}px)`,ws=`(max-width: ${ct-.02}px)`;function vs(s){const e=new m(!1),t=typeof globalThis.matchMedia=="function"?globalThis.matchMedia(s):null;if(!t)return{value:e,dispose:()=>{}};e.set(t.matches);const n=i=>e.set(i.matches);return t.addEventListener("change",n),{value:e,dispose:()=>t.removeEventListener("change",n)}}const ze="__actions";function H(s,e={}){const t=document.createElement("button");return t.type="button",t.className=e.variant==="primary"?"mtable__btn mtable__btn--primary":"mtable__btn",t.textContent=s,e.onclick&&t.addEventListener("click",e.onclick),t}function $s(s){return typeof s=="object"&&s!==null&&typeof s.get=="function"}function De(s,e,t){if(s.textContent="",e instanceof HTMLElement){s.appendChild(e);return}if(e==null||e===""){const n=document.createElement("span");n.className="mtable__empty-cell",n.textContent=t,s.appendChild(n);return}s.appendChild(document.createTextNode(String(e)))}class oe extends x{static styles=`
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
                gap: ${c("sm")};
            }

            & .mtable__btn {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${c("md")};
                font-size: 0.85rem;
                font-weight: 700;
            }

            & .mtable__btn--primary {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${c("md")};
                font-size: 0.85rem;
                font-weight: 700;
            }

            /* Worded, muted or danger — never a spinner glyph and never an
               emoji (docs/design-guidelines.md §4). */
            & .mtable__status {
                margin: ${c("xs")} 0 0;
                font-size: 0.8rem;
                line-height: 1.4;
                color: ${r("text-muted")};

                &[hidden] { display: none; }
                &.mtable__status--error { color: ${r("danger")}; font-weight: 600; }
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
                    padding: ${c("xs")} 0;
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
    `;static seq=0;uid=`mtable-${oe.seq++}`;rowData=new Map;render(){const e=document.createElement("div");e.className="mtable-wrap";const t=document.createElement("table");t.className="mtable",t.setAttribute("role","table");const n=document.createElement("caption");n.className=this.props.captionHidden?"mtable__caption mtable__caption--hidden":"mtable__caption",n.id=`${this.uid}-caption`,n.textContent=this.props.caption,t.appendChild(n),t.setAttribute("aria-labelledby",n.id),t.appendChild(this.head());const i=document.createElement("tbody");if(i.className="mtable__body",i.setAttribute("role","rowgroup"),t.appendChild(i),e.appendChild(t),this.$each(i,()=>this.readRows(),(o,a,l)=>this.renderRow(o,l),o=>this.props.rowKey(o)),this.props.empty){const o=document.createElement("div");o.className="mtable__empty",this.spawn(pe,o,this.props.empty),e.appendChild(o),this.track(w(()=>{const a=this.rowsValue().length===0;o.hidden=!a,t.hidden=a}))}return this.layout(e),e}layout(e){let t=this.props.narrow;if(!t){const i=vs(ws);this.track(i.dispose),t=i.value}const n=this.props.stacked!==!1;this.track(w(()=>{e.setAttribute("data-layout",n&&t.get()?"stacked":"columns")}))}head(){const e=document.createElement("thead");e.className="mtable__head",e.setAttribute("role","rowgroup");const t=document.createElement("tr");t.className="mtable__tr",t.setAttribute("role","row");for(const n of this.props.columns)t.appendChild(this.th(n.key,n.header));return this.hasActionsColumn()&&t.appendChild(this.th(ze,this.props.actionsHeader??"Actions",!0)),e.appendChild(t),e}th(e,t,n=!1){const i=document.createElement("th");if(i.className="mtable__th",i.setAttribute("role","columnheader"),i.setAttribute("scope","col"),i.setAttribute("data-key",e),n){const o=document.createElement("span");o.className="mtable__th-label--hidden",o.textContent=t,i.appendChild(o)}else i.textContent=t;return i}hasActionsColumn(){return this.props.actions!==void 0||this.props.edit!==void 0}rowsValue(){return $s(this.props.rows)?this.props.rows.get():this.props.rows}readRows(){const e=this.rowsValue();return T(()=>{const t=new Set;for(const n of e){const i=this.props.rowKey(n);t.add(i);const o=this.rowData.get(i);o?o.set(n):this.rowData.set(i,new m(n))}for(const n of[...this.rowData.keys()])t.has(n)||this.rowData.delete(n)}),e}signalFor(e){const t=this.props.rowKey(e);let n=this.rowData.get(t);return n||(n=new m(e),this.rowData.set(t,n)),n}renderRow(e,t){const n=this.props.rowKey(e),i={key:n},o=this.signalFor(e),a=this.props.edit,l=this.props.emptyCell??"—",u=()=>a?a.controller.key.get()===n:!1,d=document.createElement("tr");d.className="mtable__tr",d.setAttribute("role","row"),d.setAttribute("data-row-key",n);for(const h of this.props.columns){const g=document.createElement("td");if(g.className=`mtable__td mtable__td--${h.type??"text"}`,g.setAttribute("role","cell"),g.setAttribute("data-key",h.key),h.stackedLabel!==!1){const E=document.createElement("span");E.className="mtable__stacked-label",E.setAttribute("aria-hidden","true"),E.textContent=h.header,g.appendChild(E)}const $=document.createElement("div");$.className="mtable__cell",g.appendChild($),t(w(()=>{if(u()&&h.editCell){const E=o.peek();De($,T(()=>h.editCell(E,i)),l)}else{const E=o.get();De($,T(()=>h.cell(E,i)),l)}})),d.appendChild(g)}return this.hasActionsColumn()&&d.appendChild(this.actionsCell(i,o,u,t)),a&&(t(w(()=>{d.classList.toggle("mtable__tr--editing",u())})),t(w(()=>{a.controller.isSaving(n)?d.setAttribute("aria-busy","true"):d.removeAttribute("aria-busy")})),this.editKeys(d,n,o,t),a.autoFocus!==!1&&this.autoFocus(d,u,t)),d}actionsCell(e,t,n,i){const o=this.props.edit,a=document.createElement("td");a.className="mtable__td mtable__td--actions",a.setAttribute("role","cell"),a.setAttribute("data-key",ze);const l=document.createElement("div");l.className="mtable__actions",a.appendChild(l);let u=null,d=null;if(o){u=H(o.saveLabel??"Save",{variant:"primary",onclick:()=>o.oncommit(t.peek())}),d=H(o.cancelLabel??"Cancel",{onclick:()=>{o.controller.cancel(),o.oncancel?.(t.peek())}}),i(w(()=>{const g=o.controller.isSaving(e.key);u.disabled=g,d.disabled=g}));const h=document.createElement("p");h.className="mtable__status",h.setAttribute("role","status"),h.setAttribute("aria-live","polite"),a.appendChild(h),i(w(()=>{const g=o.controller.errorFor(e.key),$=o.controller.isSaving(e.key);h.textContent=g??($?o.savingLabel??"Saving…":""),h.className=g?"mtable__status mtable__status--error":"mtable__status",h.hidden=!g&&!$}))}return i(w(()=>{if(n()&&o){l.textContent="",l.append(u,d);return}const h=t.get(),g=T(()=>this.props.actions?.(h,e));l.textContent="",Array.isArray(g)?l.append(...g):g instanceof HTMLElement?l.appendChild(g):g!=null&&g!==""&&l.appendChild(document.createTextNode(String(g)))})),a}editKeys(e,t,n,i){const o=this.props.edit,a=l=>{if(o.controller.key.peek()===t){if(l.key==="Enter"){if(l.target?.tagName==="TEXTAREA"||(l.preventDefault(),o.controller.phase.peek()==="saving"))return;o.oncommit(n.peek());return}l.key==="Escape"&&(l.preventDefault(),l.stopPropagation(),o.controller.cancel(),o.oncancel?.(n.peek()))}};e.addEventListener("keydown",a),i(()=>e.removeEventListener("keydown",a))}autoFocus(e,t,n){let i=!1,o=!0;n(()=>{o=!1}),n(w(()=>{const a=t();a&&!i&&queueMicrotask(()=>{if(!o||!t())return;const l=e.querySelector('input:not([type="hidden"]), select, textarea');l&&(l.focus(),l instanceof HTMLInputElement&&typeof l.select=="function"&&l.select())}),i=a}))}}function _e(s){return{open:s.open,title:s.title,message:s.consequence,confirmLabel:s.confirmLabel,cancelLabel:s.cancelLabel??"Cancel",danger:!0,onconfirm:s.onconfirm,oncancel:s.oncancel}}function we(s,e){const t=n=>{n.key!=="Escape"||!s.get()||(s.set(!1),e?.())};return document.addEventListener("keydown",t),()=>document.removeEventListener("keydown",t)}const dt=()=>`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${r("manage-stack-gap")} ${c("lg")};
    align-items: start;

    & .mform__field--full {
        grid-column: 1 / -1;
    }

    @media ${_s} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
`,ve=()=>`
    display: flex;
    flex-direction: column;
    gap: ${c("xs")};
    min-width: 0;
`,$e=()=>`
    ${lt()}
`,xe=()=>`
    ${at()}
    width: 100%;
    min-height: ${r("manage-touch-target")};
`,ut=()=>`
    color: ${r("text-muted")};
    font-size: 0.8rem;
    line-height: 1.4;
`,ht=()=>`
    ${ps()}
`,xs=()=>`
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
        padding: 0 ${c("lg")};
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
`,ks="You no longer have permission to change the course catalog. Ask an administrator to grant you the course_admin role.";function ne(s,e){if(!(s instanceof S))return se(Es(s),Cs(s),me(s)),e;if(s.status===401)return ye(),"Your session expired. Sign in again to continue.";if(s.status===403)return ks;if(s.status>=400&&s.status<500){if(!s.details?.length)return s.message;const t=s.details.map(n=>`${n.path.replace(/^\//,"")} — ${n.message}`).join("; ");return`${s.message}: ${t}`}return se("server",`${s.status} ${s.message}`,me(s)),e}function Es(s){return s instanceof Error?s.message==="Request timeout"?"timeout":"network":"unknown"}function Cs(s){return s instanceof Error?s.message:String(s)}function mt(){return{name:"",location:"",logoUrl:""}}function Ts(s){return{name:s.name,location:s.location??"",logoUrl:s.logoUrl??""}}function gt(s){const e={};s.name.trim()===""&&(e.name="A club needs a name. Enter one before saving.");const t=s.logoUrl.trim();return t!==""&&!Ss(t)&&(e.logoUrl="Enter a full web address starting with https://, or leave this empty."),e}function ft(s){return Object.keys(s).length>0}function Pe(s){return{name:s.name.trim(),location:s.location.trim()||null,logoUrl:s.logoUrl.trim()||null}}function pt(s,e){const t=e===0?"It has no courses.":e===1?"It has 1 course.":`It has ${e} courses.`;return`${s} leaves the catalog. ${t} Rounds already played keep their own copy of the course data, so no scorecard changes.`}const bt="The club is removed from the catalog.";function Ss(s){try{const e=new URL(s);return e.protocol==="http:"||e.protocol==="https:"}catch{return!1}}function Ls(s,e){const t=e.trim().toLowerCase().split(/\s+/).filter(n=>n!=="");return t.length===0?s:s.filter(n=>{const i=`${n.name} ${n.location??""}`.toLowerCase();return t.every(o=>i.includes(o))})}class ae{clubs=new m([]);loading=new m(!1);error=new m(null);loaded=new m(!1);query=new m("");visible=new D(()=>Ls(this.clubs.get(),this.query.get()));inflight=null;load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{this.clubs.set(await L.clubs.list())}catch(t){this.error.set(ne(t,"Could not load the clubs. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.clubs.get().find(t=>t.id===e)??null}async create(e){return this.write(()=>L.clubs.create(Pe(e)),"Could not create the club. Check your connection and try again.")}async update(e,t){return this.write(()=>L.clubs.update({id:e,...Pe(t)}),"Could not save the club. Check your connection and try again.")}async remove(e){return this.write(()=>L.clubs.remove({id:e}),"Could not delete the club. Check your connection and try again.")}async write(e,t){try{await e()}catch(n){return{ok:!1,message:ne(n,t)}}return await this.load(!0),{ok:!0}}}const Is=C(`
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
`);class yt extends x{static styles=`
        .mclubfields {
            ${dt()}

            & .mclubfields__field {
                ${ve()}
            }

            & .mclubfields__label {
                ${$e()}
            }

            & .mclubfields__control {
                ${xe()}
            }

            & .mclubfields__hint {
                ${ut()}
                margin: 0;
            }

            & .mclubfields__error {
                ${ht()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;draft=new m(mt());inputs={};render(){const e={name:`${this.props.idPrefix}-name`,location:`${this.props.idPrefix}-location`,logoUrl:`${this.props.idPrefix}-logo`},t={name:`${e.name}-error`,logoUrl:`${e.logoUrl}-error`},n={location:`${e.location}-hint`,logoUrl:`${e.logoUrl}-hint`},i=()=>this.props.busy?.get()??!1,o=this.wire(Is,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:i,oninput:a=>this.patch("name",a)},nameError:{id:t.name,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},locationLabel:{htmlFor:e.location},location:{id:e.location,"aria-describedby":n.location,disabled:i,oninput:a=>this.patch("location",a)},locationHint:{id:n.location},logoLabel:{htmlFor:e.logoUrl},logoUrl:{id:e.logoUrl,"aria-invalid":()=>String(this.props.errors.get().logoUrl!==void 0),disabled:i,oninput:a=>this.patch("logoUrl",a)},logoHint:{id:n.logoUrl},logoError:{id:t.logoUrl,textContent:()=>this.props.errors.get().logoUrl??"",hidden:()=>this.props.errors.get().logoUrl===void 0}});return this.inputs={name:this.ref(o,"name"),location:this.ref(o,"location"),logoUrl:this.ref(o,"logoUrl")},this.track(w(()=>{Re(this.inputs.name,this.props.errors.get().name?[t.name]:[])})),this.track(w(()=>{const a=[n.logoUrl];this.props.errors.get().logoUrl&&a.push(t.logoUrl),Re(this.inputs.logoUrl,a)})),o}seed(e){this.draft.set({...e});for(const t of["name","location","logoUrl"]){const n=this.inputs[t];n&&(n.value=e[t])}}focusFirst(){this.inputs.name?.focus()}focusInvalid(e){for(const t of["name","logoUrl"]){if(e[t]===void 0)continue;const n=this.inputs[t];return n?(n.focus(),!0):!1}return!1}patch(e,t){const n=t.target.value;this.draft.update(i=>({...i,[e]:n}))}}function Re(s,e){e.length===0?s.removeAttribute("aria-describedby"):s.setAttribute("aria-describedby",e.join(" "))}const I="/courses",ke="/courses/clubs",Ns=`${ke}/:id`;function re(s){return`${ke}/${s}`}const Ee="/courses/course",Os=`${Ee}/:clubId/:courseId`;function As(s,e){return`${Ee}/${s}/${e}`}const zs=C(`
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
`);class Ds extends x{static styles=`
        .mclubs {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};

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
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mclubs__search {
                ${ve()}
                max-width: 28rem;
            }

            & .mclubs__search-label {
                ${$e()}
            }

            & .mclubs__search-input {
                ${xe()}
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
                ${j({})}
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
                gap: ${c("sm")};
            }

            & .mclubs__submit {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mclubs__secondary {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${c("lg")};
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
    `;router=this.inject(O);crumbs=this.inject(B);clubs=this.inject(ae);createOpen=new m(!1);createBusy=new m(!1);createErrors=new m({});createFailure=new m(null);deleteOpen=new m(!1);deleteTarget=new m(null);deleteFailure=new m(null);deletingId=new m(null);fields=null;searchInput=null;actionEffects=new Map;columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>this.nameLink(e)},{key:"location",header:"Location",cell:e=>e.location},{key:"courses",header:"Courses",type:"numeric",cell:e=>e.courseCount}];render(){const e=this.wire(zs,{new:{onclick:()=>this.openCreate()},searchLabel:{htmlFor:"manage-clubs-search"},search:{id:"manage-clubs-search",oninput:t=>this.clubs.query.set(t.target.value)},searchNote:{textContent:()=>this.searchNote(),hidden:()=>this.searchNote()===""},createPanel:{hidden:()=>!this.createOpen.get(),onsubmit:t=>{t.preventDefault(),this.create()}},createError:{textContent:()=>this.createFailure.get()??"",hidden:()=>this.createFailure.get()===null},createSubmit:{textContent:()=>this.createBusy.get()?"Creating…":"Create club",disabled:()=>this.createBusy.get()},createCancel:{disabled:()=>this.createBusy.get(),onclick:()=>this.closeCreate()},loadError:{textContent:()=>this.clubs.error.get()??"",hidden:()=>this.clubs.error.get()===null},retry:{hidden:()=>this.clubs.error.get()===null,onclick:()=>{this.clubs.load(!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading clubs…",hidden:()=>this.clubs.loaded.get()}});return this.searchInput=this.ref(e,"search"),this.fields=this.spawn(yt,this.ref(e,"createFields"),{idPrefix:"manage-club-new",errors:this.createErrors,busy:this.createBusy}),this.spawn(oe,this.ref(e,"tableHost"),{columns:this.columns,rows:this.clubs.visible,rowKey:t=>t.id,caption:"Clubs",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Club actions",empty:{heading:()=>this.filtering()?"No clubs match that search":"No clubs yet",body:()=>this.filtering()?"Try a shorter search, or clear it to see every club.":"A club is the top of the catalog: create one, then add its courses.",action:{label:()=>this.filtering()?"Clear search":"New club",onclick:()=>this.filtering()?this.clearSearch():this.openCreate()}}}),this.spawn(q,this.ref(e,"confirmHost"),_e({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this club?"},consequence:()=>this.deleteConsequence(),confirmLabel:"Delete club",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(we(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.crumbs.set([{label:"Clubs"}]),this.clubs.load();const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.createOpen.get()||this.closeCreate())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}nameLink(e){const t=document.createElement("a");return t.className="mclubs__link",t.href=P+re(e.id),t.textContent=e.name,t.addEventListener("click",n=>{n.metaKey||n.ctrlKey||n.shiftKey||n.button!==0||(n.preventDefault(),this.router.navigate(re(e.id)))}),t}rowActions(e){const t=H("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,w(()=>{const n=this.deletingId.get();t.textContent=n===e.id?"Deleting…":"Delete",t.disabled=n!==null})),[t]}filtering(){return this.clubs.query.get().trim()!==""}clearSearch(){this.clubs.query.set(""),this.searchInput&&(this.searchInput.value="",this.searchInput.focus())}searchNote(){if(!this.filtering())return"";const e=this.clubs.visible.get().length,t=this.clubs.clubs.get().length;return`Showing ${e} of ${t} clubs.`}openCreate(){this.resetCreate(),this.createOpen.set(!0),this.fields?.focusFirst()}closeCreate(){this.createOpen.set(!1),this.resetCreate()}resetCreate(){this.createErrors.set({}),this.createFailure.set(null),this.fields?.seed(mt())}async create(){if(this.createBusy.get()||!this.fields)return;const e=this.fields.draft.get(),t=gt(e);if(this.createErrors.set(t),ft(t)){this.createFailure.set(null),this.fields.focusInvalid(t);return}this.createBusy.set(!0),this.createFailure.set(null);const n=await this.clubs.create(e);if(this.createBusy.set(!1),!n.ok){this.createFailure.set(n.message);return}this.closeCreate()}deleteConsequence(){const e=this.deleteTarget.get();return e?pt(e.name,e.courseCount):bt}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.clubs.remove(e.id);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}const Ps="Could not save. Check your connection and try again.";class _t{key=new m(null);phase=new m("idle");error=new m(null);begin(e){this.phase.get()!=="saving"&&(this.key.set(e),this.phase.set("editing"),this.error.set(null))}cancel(){this.phase.get()!=="saving"&&(this.key.set(null),this.phase.set("idle"),this.error.set(null))}async commit(e){if(this.key.get()===null||this.phase.get()==="saving")return!1;this.phase.set("saving"),this.error.set(null);let t;try{t=await e()}catch{t={ok:!1,message:Ps}}return t.ok?(this.key.set(null),this.phase.set("idle"),this.error.set(null),!0):(this.phase.set("failed"),this.error.set(t.message),!1)}fail(e){this.key.get()!==null&&(this.phase.set("failed"),this.error.set(e))}isEditing(e){return this.key.get()===e}isSaving(e){return this.key.get()===e&&this.phase.get()==="saving"}errorFor(e){return this.key.get()===e&&this.phase.get()==="failed"?this.error.get():null}}const je=[9,18],be="Paste as latitude, longitude — e.g. 57.7089, 11.9746. Use a dot for decimals";function wt(){return{name:"",holeCount:18,coordinates:""}}function Rs(s){return{name:s.name,holeCount:s.holeCount===9?9:18,coordinates:vt(s.latitude,s.longitude)}}function vt(s,e){return s===null||e===null?"":`${Me(s)}, ${Me(e)}`}function $t(s){const e=s.trim();if(e==="")return{ok:!0,position:{latitude:null,longitude:null}};const t=(e.includes(",")?e.split(","):e.split(/\s+/)).map(o=>o.trim()).filter(o=>o!=="");if(t.length!==2)return{ok:!1,message:be};const[n,i]=t.map(Ks);return n===null||i===null?{ok:!1,message:be}:{ok:!0,position:{latitude:n,longitude:i}}}function js(s){const e={};s.name.trim()===""&&(e.name="A course needs a name. Enter one before saving.");const t=$t(s.coordinates);return t.ok||(e.coordinates=t.message),e}function Us(s){return Object.keys(s).length>0}function Ue(s){const e=$t(s.coordinates),t=e.ok?e.position:{latitude:null,longitude:null};return{name:s.name.trim(),holeCount:s.holeCount,latitude:t.latitude,longitude:t.longitude}}function Fs(s){return`${s} leaves the catalog, and its holes, tees and tee-role settings go with it. Rounds already played keep their own copy of the course data, so no scorecard changes.`}const Ms="The course is removed from the catalog, along with its holes and tees.";function qs(s){const e=s.issues.filter(n=>n.severity==="error").length;if(!s.ok||e>0)return{status:"issues",count:Math.max(e,1)};const t=s.issues.length;return t>0?{status:"warnings",count:t}:{status:"ready"}}function Hs(s){switch(s.status){case"checking":return"Checking…";case"ready":return"Ready";case"warnings":return Fe(s.count,"warning","warnings");case"issues":return Fe(s.count,"issue","issues");case"unknown":return"Not checked"}}function Bs(s){switch(s.status){case"ready":return"ready";case"warnings":return"warn";case"issues":return"error";default:return"muted"}}function Fe(s,e,t){return`${s} ${s===1?e:t}`}function Ks(s){if(!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(s))return null;const e=Number(s);return Number.isFinite(e)?e:null}function Me(s){return String(Number(s.toFixed(6)))}const qe={status:"checking"};class xt{clubId=new m(null);courses=new m([]);readiness=new m({});loading=new m(!1);error=new m(null);loaded=new m(!1);rows=new D(()=>{const e=this.readiness.get();return this.courses.get().map(t=>({...t,readiness:e[t.id]??qe}))});clubs=z.get(ae);inflight=null;load(e,t=!1){return this.clubId.get()!==e&&(this.clubId.set(e),this.courses.set([]),this.readiness.set({}),this.loaded.set(!1),this.inflight=null),!t&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{const n=await L.courses.listByClub({clubId:e});if(this.clubId.get()!==e)return;this.courses.set(n),this.checkReadiness(n)}catch(n){this.error.set(ne(n,"Could not load the courses. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.courses.get().find(t=>t.id===e)??null}async create(e,t){const{name:n,holeCount:i,latitude:o,longitude:a}=Ue(t);return this.write(()=>L.courses.create({clubId:e,name:n,holeCount:i,latitude:o,longitude:a}),"Could not create the course. Check your connection and try again.",!0)}async update(e,t){const{name:n,holeCount:i,latitude:o,longitude:a}=Ue(t);return this.write(()=>L.courses.update({id:e,name:n,holeCount:i,latitude:o,longitude:a}),"Could not save the course. Check your connection and try again.",!1)}async remove(e){return this.write(()=>L.courses.remove({id:e}),"Could not delete the course. Check your connection and try again.",!0)}async write(e,t,n){try{await e()}catch(o){return{ok:!1,message:ne(o,t)}}const i=this.clubId.get();return await Promise.all([i===null?Promise.resolve():this.load(i,!0),n?this.clubs.load(!0):Promise.resolve()]),{ok:!0}}checkReadiness(e){this.readiness.set(Object.fromEntries(e.map(t=>[t.id,qe])));for(const t of e)(async()=>{let n;try{n=qs(await L.courses.validate({id:t.id}))}catch{n={status:"unknown"}}this.courses.peek().some(i=>i.id===t.id)&&this.readiness.update(i=>({...i,[t.id]:n}))})()}}const Gs=C(`
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
`);class Ws extends x{static styles=`
        .mcoursefields {
            ${dt()}

            & .mcoursefields__field {
                ${ve()}
            }

            & .mcoursefields__label {
                ${$e()}
            }

            & .mcoursefields__control {
                ${xe()}
            }

            & .mcoursefields__seg {
                ${xs()}
            }

            & .mcoursefields__hint {
                ${ut()}
                margin: 0;
            }

            & .mcoursefields__error {
                ${ht()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;draft=new m(wt());nameInput=null;coordsInput=null;holeButtons=[];render(){const e={name:`${this.props.idPrefix}-name`,holes:`${this.props.idPrefix}-holes`,coordinates:`${this.props.idPrefix}-coords`},t={name:`${e.name}-error`,coordinates:`${e.coordinates}-error`},n={holes:`${e.holes}-hint`,coordinates:`${e.coordinates}-hint`},i=()=>this.props.busy?.get()??!1,o=this.wire(Gs,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:i,oninput:l=>this.patch({name:l.target.value})},nameError:{id:t.name,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},holesLabel:{id:`${e.holes}-label`},holes:{id:e.holes,"aria-labelledby":`${e.holes}-label`,"aria-describedby":n.holes},holesHint:{id:n.holes,textContent:"Changing this only changes the count — finish the new holes in the holes editor; readiness flags the gap until then.",hidden:()=>!(this.props.existing?.get()??!1)},coordsLabel:{htmlFor:e.coordinates},coordinates:{id:e.coordinates,"aria-invalid":()=>String(this.props.errors.get().coordinates!==void 0),disabled:i,oninput:l=>this.patch({coordinates:l.target.value})},coordsHint:{id:n.coordinates,textContent:`${be}. Optional; clear the field to remove the position.`},coordsError:{id:t.coordinates,textContent:()=>this.props.errors.get().coordinates??"",hidden:()=>this.props.errors.get().coordinates===void 0}});this.nameInput=this.ref(o,"name"),this.coordsInput=this.ref(o,"coordinates");const a=this.ref(o,"holes");return this.holeButtons=je.map(l=>{const u=document.createElement("button");return u.type="button",u.textContent=String(l),u.addEventListener("click",()=>this.patch({holeCount:l})),a.appendChild(u),u}),this.track(w(()=>{const l=this.draft.get().holeCount,u=i();this.holeButtons.forEach((d,h)=>{d.setAttribute("aria-pressed",String(je[h]===l)),d.disabled=u})})),this.track(w(()=>{He(this.nameInput,this.props.errors.get().name?[t.name]:[])})),this.track(w(()=>{const l=[n.coordinates];this.props.errors.get().coordinates&&l.push(t.coordinates),He(this.coordsInput,l)})),o}seed(e){this.draft.set({...e}),this.nameInput&&(this.nameInput.value=e.name),this.coordsInput&&(this.coordsInput.value=e.coordinates)}focusFirst(){this.nameInput?.focus()}focusInvalid(e){return e.name!==void 0&&this.nameInput?(this.nameInput.focus(),!0):e.coordinates!==void 0&&this.coordsInput?(this.coordsInput.focus(),!0):!1}patch(e){this.draft.update(t=>({...t,...e}))}}function He(s,e){e.length===0?s.removeAttribute("aria-describedby"):s.setAttribute("aria-describedby",e.join(" "))}const Q="__new",Ys=C(`
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
`);class Vs extends x{static styles=`
        .mcourses {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};

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
                padding: 0 ${c("lg")};
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
                ${j({})}
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
                gap: ${c("sm")};
            }

            & .mcourses__submit {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mcourses__secondary {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${c("lg")};
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
                padding: 2px ${c("sm")};
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
    `;router=this.inject(O);courses=this.inject(xt);editor=new _t;errors=new m({});deleteOpen=new m(!1);deleteTarget=new m(null);deleteFailure=new m(null);deletingId=new m(null);fields=null;actionEffects=new Map;columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>this.nameLink(e)},{key:"holes",header:"Holes",type:"numeric",cell:e=>e.holeCount},{key:"position",header:"Position",cell:e=>{const t=vt(e.latitude,e.longitude);if(t!=="")return t;const n=document.createElement("span");return n.className="mcourses__muted",n.textContent="Not set",n}},{key:"readiness",header:"Readiness",cell:e=>this.badge(e)}];render(){const e=this.wire(Ys,{new:{disabled:()=>this.editing()||this.deletingId.get()!==null,onclick:()=>this.openCreate()},panel:{hidden:()=>!this.editing(),onsubmit:t=>{t.preventDefault(),this.submit()}},panelTitle:{textContent:()=>this.panelTitle()},panelError:{textContent:()=>this.panelError()??"",hidden:()=>this.panelError()===null},submit:{textContent:()=>this.submitLabel(),disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.closePanel()},loadError:{textContent:()=>this.courses.error.get()??"",hidden:()=>this.courses.error.get()===null},retry:{hidden:()=>this.courses.error.get()===null,onclick:()=>{this.courses.load(this.props.clubId,!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading courses…",hidden:()=>this.courses.loaded.get()}});return this.fields=this.spawn(Ws,this.ref(e,"fieldsHost"),{idPrefix:"manage-course",errors:this.errors,busy:{get:()=>this.saving()},existing:{get:()=>this.editing()&&!this.creating()}}),this.spawn(oe,this.ref(e,"tableHost"),{columns:this.columns,rows:this.courses.rows,rowKey:t=>t.id,caption:"Courses",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Course actions",empty:{heading:"No courses yet",body:"Add the club’s first course, then set its holes and tees.",action:{label:"New course",onclick:()=>this.openCreate()}}}),this.spawn(q,this.ref(e,"confirmHost"),_e({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this course?"},consequence:()=>{const t=this.deleteTarget.get();return t?Fs(t.name):Ms},confirmLabel:"Delete course",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(we(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.courses.load(this.props.clubId);const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.editing()||this.saving()||this.closePanel())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}editing(){return this.editor.key.get()!==null}creating(){return this.editor.key.get()===Q}saving(){const e=this.editor.key.get();return e!==null&&this.editor.isSaving(e)}panelTitle(){if(this.creating())return"New course";const e=this.openCourse();return e?`Edit ${e.name}`:"Edit course"}submitLabel(){return this.creating()?this.saving()?"Creating…":"Create course":this.saving()?"Saving…":"Save course"}panelError(){const e=this.editor.key.get();return e===null?null:this.editor.errorFor(e)}openCourse(){const e=this.editor.key.get();return e===null||e===Q?null:this.courses.rows.get().find(t=>t.id===e)??null}openCreate(){this.saving()||(this.errors.set({}),this.editor.begin(Q),this.fields?.seed(wt()),this.fields?.focusFirst())}openEdit(e){this.saving()||(this.errors.set({}),this.editor.begin(e.id),this.fields?.seed(Rs(e)),this.fields?.focusFirst())}closePanel(){this.editor.cancel(),this.errors.set({})}async submit(){if(!this.fields||this.saving())return;const e=this.editor.key.get();if(e===null)return;const t=this.fields.draft.get(),n=js(t);if(this.errors.set(n),Us(n)){this.fields.focusInvalid(n);return}await this.editor.commit(()=>e===Q?this.courses.create(this.props.clubId,t):this.courses.update(e,t))}nameLink(e){const t=As(this.props.clubId,e.id),n=document.createElement("a");return n.className="mcourses__link",n.href=P+t,n.textContent=e.name,n.addEventListener("click",i=>{i.metaKey||i.ctrlKey||i.shiftKey||i.button!==0||(i.preventDefault(),this.router.navigate(t))}),n}badge(e){const t=document.createElement("span");return t.className=`mcourses__badge mcourses__badge--${Bs(e.readiness)}`,t.textContent=Hs(e.readiness),t}rowActions(e){const t=H("Edit",{onclick:()=>this.openEdit(e)}),n=H("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,w(()=>{const i=this.deletingId.get(),o=i!==null||this.editing();n.textContent=i===e.id?"Deleting…":"Delete",n.disabled=o,t.disabled=o})),[t,n]}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.courses.remove(e.id);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}const Xs=C(`
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
`);class Qs extends x{static styles=`
        .mclub {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};

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
                ${j({})}
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
                gap: ${c("sm")};
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
                gap: ${c("sm")};
            }

            & .mclub__primary {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
            }

            & .mclub__secondary {
                ${k()}
                min-height: ${r("manage-touch-target")};
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
                min-height: ${r("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
            }

            & .mclub__courses:empty { display: none; }
        }
    `;router=this.inject(O);crumbs=this.inject(B);clubs=this.inject(ae);params=this.router.params(Ns);editor=new _t;errors=new m({});deleteOpen=new m(!1);deleteFailure=new m(null);deleting=new m(!1);fields=null;render(){const e=this.wire(Xs,{loadingNote:{textContent:"Loading club…",hidden:()=>this.clubs.loaded.get()},loadError:{textContent:()=>this.clubs.error.get()??"",hidden:()=>this.clubs.error.get()===null},retry:{hidden:()=>this.clubs.error.get()===null,onclick:()=>{this.clubs.load(!0)}},missing:{hidden:()=>!this.clubs.loaded.get()||this.clubs.error.get()!==null||this.club()!==null},backMissing:{onclick:()=>this.router.navigate(I)},body:{hidden:()=>this.club()===null},title:()=>this.club()?.name??"",subtitle:()=>this.courseSummary(),remove:{textContent:()=>this.deleting.get()?"Deleting…":"Delete club",disabled:()=>this.editing()||this.deleting.get(),onclick:()=>{this.deleteFailure.set(null),this.deleteOpen.set(!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},edit:{hidden:()=>this.editing(),disabled:()=>this.deleting.get(),onclick:()=>this.beginEdit()},facts:{hidden:()=>this.editing()},factName:()=>this.club()?.name??"",factLocation:()=>this.club()?.location??"Not recorded",factLogo:()=>this.club()?.logoUrl??"Not recorded",form:{hidden:()=>!this.editing(),onsubmit:n=>{n.preventDefault(),this.save()}},saveError:{textContent:()=>this.editor.errorFor(this.clubId())??"",hidden:()=>this.editor.errorFor(this.clubId())===null},save:{textContent:()=>this.saving()?"Saving…":"Save",disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.cancelEdit()}});this.fields=this.spawn(yt,this.ref(e,"fieldsHost"),{idPrefix:"manage-club-edit",errors:this.errors,busy:{get:()=>this.saving()}});const t=this.clubId();return t!==""&&this.spawn(Vs,this.ref(e,"coursesHost"),{clubId:t}),this.spawn(q,this.ref(e,"confirmHost"),_e({open:this.deleteOpen,title:()=>{const n=this.club();return n?`Delete ${n.name}?`:"Delete this club?"},consequence:()=>this.deleteConsequence(),confirmLabel:"Delete club",onconfirm:()=>{this.remove()}})),this.track(we(this.deleteOpen)),e}onMount(){this.clubs.load(),this.track(w(()=>{const e=this.club();this.crumbs.set([{label:"Clubs",path:I},{label:e?.name??"Club"}])})),this.clubId()===""&&this.router.navigate(I,!0)}clubId(){return this.params.get().id}club(){const e=this.clubId();return e===""?null:this.clubs.byId(e)}editing(){return this.editor.isEditing(this.clubId())}saving(){return this.editor.isSaving(this.clubId())}courseSummary(){const e=this.club();return e?e.courseCount===0?"No courses yet.":e.courseCount===1?"1 course.":`${e.courseCount} courses.`:""}beginEdit(){const e=this.club();e&&(this.errors.set({}),this.editor.begin(e.id),this.fields?.seed(Ts(e)),this.fields?.focusFirst())}cancelEdit(){this.editor.cancel(),this.errors.set({})}save(){const e=this.club();if(!e||!this.fields||this.saving())return;const t=this.fields.draft.get(),n=gt(t);if(this.errors.set(n),ft(n)){this.fields.focusInvalid(n);return}this.editor.commit(()=>this.clubs.update(e.id,t))}deleteConsequence(){const e=this.club();return e?pt(e.name,e.courseCount):bt}async remove(){const e=this.club();if(!(!e||this.deleting.get())){this.deleteFailure.set(null),this.deleting.set(!0);try{const t=await this.clubs.remove(e.id);if(!t.ok){this.deleteFailure.set(t.message);return}this.router.navigate(I,!0)}finally{this.deleting.set(!1)}}}}const Js=C(`
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

            <section class="mcourse__panel">
                <h2 class="mcourse__panel-title">Holes, tees and tee roles</h2>
                <p class="mcourse__lead">Holes, tees and tee roles arrive in the next slice. Until then, the course’s name, hole count and position are edited on the club page.</p>
                <button bind="back" class="mcourse__secondary" type="button">Back to the club</button>
            </section>
        </div>
    </section>
`);class Zs extends x{static styles=`
        .mcourse {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};

            & .mcourse__heading {
                display: flex;
                flex-direction: column;
                gap: ${c("xs")};
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

            & .mcourse__body {
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};

                &[hidden] { display: none; }
            }

            & .mcourse__panel {
                ${j({})}
                display: flex;
                flex-direction: column;
                gap: ${r("manage-stack-gap")};
                padding: ${r("manage-page-pad")};
                align-items: flex-start;
            }

            & .mcourse__panel-title {
                margin: 0;
                font-family: ${r("font-display")};
                font-size: 1.15rem;
                font-weight: 600;
                color: ${r("text")};
            }

            & .mcourse__secondary {
                ${k()}
                min-height: ${r("manage-touch-target")};
                padding: 0 ${c("lg")};
                font-size: 0.9rem;
                font-weight: 700;
                align-self: flex-start;

                &[hidden] { display: none; }
            }
        }
    `;router=this.inject(O);crumbs=this.inject(B);clubs=this.inject(ae);courses=this.inject(xt);params=this.router.params(Os);render(){return this.wire(Js,{loadingNote:{textContent:"Loading course…",hidden:()=>this.settled()},loadError:{textContent:()=>this.courses.error.get()??"",hidden:()=>this.courses.error.get()===null},retry:{hidden:()=>this.courses.error.get()===null,onclick:()=>{this.courses.load(this.clubId(),!0)}},missing:{hidden:()=>!this.settled()||this.courses.error.get()!==null||this.course()!==null},backMissing:{onclick:()=>this.backToClub()},body:{hidden:()=>this.course()===null},title:()=>this.course()?.name??"",subtitle:()=>this.summary(),back:{onclick:()=>this.backToClub()}})}onMount(){const e=this.clubId();if(e===""||this.courseId()===""){this.router.navigate(I,!0);return}this.clubs.load(),this.courses.load(e),this.track(w(()=>{this.crumbs.set([{label:"Clubs",path:I},{label:this.clubs.byId(e)?.name??"Club",path:re(e)},{label:this.course()?.name??"Course"}])}))}clubId(){return this.params.get().clubId}courseId(){return this.params.get().courseId}course(){const e=this.courseId();return e===""?null:this.courses.byId(e)}settled(){return this.courses.loaded.get()}summary(){const e=this.course();if(!e)return"";const t=this.clubs.byId(this.clubId()),n=`${e.holeCount} holes`;return t?`${n} at ${t.name}.`:`${n}.`}backToClub(){this.router.navigate(re(this.clubId()))}}const en=[{id:"courses",label:"Courses",path:I,routes:{[I]:Ds,[ke]:Qs,[Ee]:Zs},unlocked:s=>s.canManageCourses()}];function K(s){return en.filter(e=>e.unlocked(s))}function tn(s){const e={};for(const t of K(s))Object.assign(e,t.routes);return e}const sn=C(`
    <nav class="mnav" aria-label="Sections">
        <ul bind="list" class="mnav__list"></ul>
    </nav>
`),nn=C(`
    <li class="mnav__item">
        <a bind="link" class="mnav__link"><span bind="label"></span></a>
    </li>
`);class Be extends x{static styles=`
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
                padding: 0 ${c("md")};
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
    `;router=this.inject(O);roles=this.inject(R);render(){const e=this.wire(sn,{});return this.$each(this.ref(e,"list"),()=>K(this.roles),(t,n,i)=>this.wireEl(nn,{link:{href:P+t.path,className:()=>{const o=this.router.route.get();return o===t.path||o.startsWith(t.path+"/")?"mnav__link mnav__link--active":"mnav__link"},"aria-current":()=>{const o=this.router.route.get();return o===t.path||o.startsWith(t.path+"/")?"page":"false"},onclick:o=>{const a=o;a.metaKey||a.ctrlKey||a.shiftKey||a.button!==0||(o.preventDefault(),this.router.navigate(t.path),this.props.onNavigate?.())}},label:()=>t.label},i),t=>t.id),e}}const rn=C(`
    <section class="mnf">
        <h1 class="mnf__title">Nothing here</h1>
        <p class="mnf__body">That address does not match anything in Tapscore Manage.</p>
        <button bind="home" class="mnf__home" type="button"></button>
    </section>
`);class on extends x{static styles=`
        .mnf {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: ${c("md")};

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
                padding: 0 ${c("lg")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                cursor: pointer;

                &.hidden { display: none; }
            }
        }
    `;router=this.inject(O);roles=this.inject(R);crumbs=this.inject(B);onMount(){this.crumbs.set([])}render(){const e=K(this.roles)[0];return this.wire(rn,{home:{className:()=>e?"mnf__home":"mnf__home hidden",textContent:()=>e?`Go to ${e.label}`:"",onclick:()=>{e&&this.router.navigate(e.path,!0)}}})}}const an=C(`
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
`),ln=C(`
    <li class="mshell__crumb">
        <span bind="sep" class="mshell__crumb-sep">/</span>
        <a bind="link" class="mshell__crumb-link"></a>
        <span bind="current" class="mshell__crumb-current" aria-current="page"></span>
    </li>
`),cn=C(`
    <div class="mshell__identity-inner">
        <span bind="who" class="mshell__who"></span>
        <button bind="signout" class="mshell__signout" type="button">Sign out</button>
    </div>
`);class dn extends x{static styles=`
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
                gap: ${c("sm")};
                min-height: ${r("manage-touch-target")};
                padding: 0 ${c("md")};
                margin-bottom: ${r("manage-stack-gap")};
            }

            /* Inset from the chrome's edges so the active item's pill reads as
               a raised shape sitting ON the sidebar, rather than as a band
               bleeding off both sides of it. */
            & .mshell__navhost {
                flex: 1;
                padding: 0 ${c("sm")};
            }

            & .mshell__identity {
                border-top: 1px solid ${r("manage-chrome-border")};
                padding-top: ${r("manage-stack-gap")};
                margin-top: ${r("manage-stack-gap")};

                & .mshell__identity-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: ${c("sm")};
                    padding: 0 ${c("md")};
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
                    padding: 0 ${c("md")};
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
                gap: ${c("md")};
                padding: 0 ${r("manage-page-pad")};
                padding-top: env(safe-area-inset-top);
                min-height: calc(${r("manage-touch-target")} + ${c("md")});
                background: ${r("manage-chrome-bg")};

                & .mshell__menu {
                    ${k(void 0,"ghost")}
                    min-height: ${r("manage-touch-target")};
                    min-width: ${r("manage-touch-target")};
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
                width: min(84vw, calc(${r("manage-sidebar-width")} + ${c("2xl")}));
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
                    padding: 0 ${c("md")};
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
                    gap: ${c("xs")};
                    font-size: 0.8rem;
                }

                & .mshell__crumb {
                    display: flex;
                    align-items: center;
                    gap: ${c("xs")};
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

            @media ${ys} {
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
    `;router=this.inject(O);auth=this.inject(A);roles=this.inject(R);breadcrumbs=this.inject(B);drawerOpen=new m(!1);render(){const e=K(this.roles)[0];e&&this.router.route.get()==="/"&&this.router.navigate(e.path,!0);const t=this.wire(an,{menu:{onclick:()=>this.drawerOpen.set(!0),"aria-expanded":()=>String(this.drawerOpen.get())},close:{onclick:()=>this.drawerOpen.set(!1)},scrim:{className:()=>this.drawerOpen.get()?"mshell__scrim open":"mshell__scrim",onclick:()=>this.drawerOpen.set(!1)},drawer:{className:()=>this.drawerOpen.get()?"mshell__drawer open":"mshell__drawer",inert:()=>!this.drawerOpen.get()}});return this.spawn(Be,this.ref(t,"sidebarNav")),this.spawn(Be,this.ref(t,"drawerNav"),{onNavigate:()=>this.drawerOpen.set(!1)}),this.identity(this.ref(t,"sidebarIdentity")),this.identity(this.ref(t,"drawerIdentity")),this.crumbs(this.ref(t,"crumbs")),this.$swap(this.ref(t,"outlet"),this.router.route,tn(this.roles),on),t}onMount(){this.track(w(()=>{this.router.route.get(),this.drawerOpen.set(!1)}));const e=t=>{t.key==="Escape"&&this.drawerOpen.get()&&this.drawerOpen.set(!1)};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}identity(e){e.appendChild(this.wire(cn,{who:()=>{const t=this.auth.currentUser.get();return t?`Signed in as ${t.username}`:""},signout:{onclick:()=>{this.drawerOpen.set(!1),this.auth.logout()}}}))}crumbs(e){const t=document.createElement("ol");e.appendChild(t),this.$each(t,()=>this.breadcrumbs.crumbs.get(),(n,i,o)=>this.wireEl(ln,{sep:{className:()=>i===0?"mshell__crumb-sep hidden":"mshell__crumb-sep"},link:{className:()=>n.path?"mshell__crumb-link":"mshell__crumb-link hidden",href:n.path?P+n.path:"",textContent:()=>n.path?n.label:"",onclick:a=>{const l=a;l.metaKey||l.ctrlKey||l.shiftKey||l.button!==0||(a.preventDefault(),n.path&&this.router.navigate(n.path))}},current:{className:()=>n.path?"mshell__crumb-current hidden":"mshell__crumb-current",textContent:()=>n.path?"":n.label}},o),(n,i)=>`${i}:${n.label}`)}}const de="Something went wrong on our end. Try again in a moment.";function un(s,e){const t=(s.details??[]).map(i=>i.path),n=i=>t.some(o=>o===`/${i}`);return n("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":n("username")?"Enter your username.":n("displayName")?"Enter a display name.":n("handicapIndex")?"Handicap index must be a number (or leave it empty).":n("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function hn(s,e){if(s instanceof S)switch(s.status){case 400:return un(s,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":de;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return s.status>=500?de:"That request could not be completed."}return s instanceof Error&&s.message==="Request timeout"?"That took too long. Check your connection and try again.":s instanceof Error?"Cannot reach the server. Check your connection and try again.":de}const mn=C(`
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
`);class gn extends x{static styles=`
        .msignin {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${r("manage-page-pad")};

            & .msignin__panel {
                ${j({})}
                display: flex;
                flex-direction: column;
                gap: ${c("md")};
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
                gap: ${c("xs")};

                & span {
                    color: ${r("text-muted")};
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                & input {
                    ${at()}
                    min-height: ${r("manage-touch-target")};
                    padding: 0 ${c("md")};
                    font-family: inherit;
                    font-size: 1rem;
                }
            }

            & .msignin__submit {
                ${k(void 0,"primary")}
                min-height: ${r("manage-touch-target")};
                margin-top: ${c("xs")};
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
            }
        }
    `;auth=this.inject(A);roles=this.inject(R);username="";password="";busy=new m(!1);formError=new m("");render(){return this.wire(mn,{form:{inert:()=>this.busy.get(),onsubmit:async e=>{e.preventDefault(),await this.submit()}},error:{className:()=>this.formError.get()?"msignin__error show":"msignin__error",textContent:()=>this.formError.get()},username:{oninput:e=>{this.username=e.target.value}},password:{oninput:e=>{this.password=e.target.value}},submit:{textContent:()=>this.busy.get()?"Signing in…":"Sign in"}})}async submit(){if(this.formError.set(""),!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const e=await it.login(this.username.trim(),this.password);this.roles.clear(),this.auth.error.set(null),this.auth.currentUser.set(e)}catch(e){this.formError.set(hn(e,"login")),this.busy.set(!1)}}}const fn=C(`
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
`);class pn extends x{static styles=`
        .mdenied {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${r("manage-page-pad")};

            & .mdenied__panel {
                ${j({})}
                display: flex;
                flex-direction: column;
                gap: ${c("md")};
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
                padding: ${c("sm")} ${c("md")};
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
                gap: ${c("md")};
                border-top: 1px solid ${r("border")};
                padding-top: ${c("md")};

                & .mdenied__who {
                    color: ${r("text-muted")};
                    font-size: 0.8rem;
                }

                & .mdenied__signout {
                    ${k()}
                    min-height: ${r("manage-touch-target")};
                    padding: 0 ${c("lg")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                }
            }
        }
    `;auth=this.inject(A);render(){return this.wire(fn,{command:()=>`bun run grant:role grant ${this.auth.currentUser.get()?.username??"<username>"} super_admin`,who:()=>{const e=this.auth.currentUser.get();return e?`Signed in as ${e.username}`:""},signout:{onclick:()=>{this.auth.logout()}}})}}const bn=C(`
    <div class="mboot">
        <p class="mboot__line">Loading…</p>
    </div>
`),yn=C(`
    <div class="mboot">
        <h1 class="mboot__title">Cannot reach the server</h1>
        <p class="mboot__line">Tapscore Manage could not check what you are allowed to manage.</p>
        <button bind="retry" class="mboot__retry" type="button">Try again</button>
    </div>
`),kt=`
    .mboot {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: ${c("md")};
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
            padding: 0 ${c("lg")};
            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
        }
    }
`;class _n extends x{static styles=kt;render(){return this.wire(bn,{})}}class wn extends x{static styles=kt;roles=this.inject(R);auth=this.inject(A);render(){return this.wire(yn,{retry:{onclick:()=>{this.auth.load(),this.roles.load(!0)}}})}}const vn=C('<div bind="gate" class="mapp"></div>');class $n extends x{static styles=`
        .mapp { min-height: 100vh; min-height: 100dvh; }
    `;auth=this.inject(A);roles=this.inject(R);gate=new D(()=>this.auth.loading.get()?"loading":this.auth.currentUser.get()===null?this.auth.error.get()?"failed":"signed-out":this.roles.error.get()?"failed":this.roles.loaded.get()?K(this.roles).length>0?"ready":"denied":"loading");render(){const e=this.wire(vn,{});return this.track(w(()=>{this.auth.currentUser.get()?this.roles.load():this.roles.clear()})),this.$swap(this.ref(e,"gate"),this.gate,{loading:_n,failed:wn,"signed-out":gn,denied:pn,ready:dn}),e}}z.get(Xe);as();z.set(A,new ls(it));const xn=z.get(A);await Wt($n,"#app",{hot:void 0,onInit:async()=>{await xn.load()}});export{ue as A,x as C,O as R,m as S,Xe as T,_ as a,ee as b,D as c,Dt as d,w as e,zt as n,Y as r,C as t};
