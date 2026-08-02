(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const d of r.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&n(d)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const ca="modulepreload",ua=function(s){return"/tapscore/"+s},xn={},ha=function(e,t,n){let i=Promise.resolve();if(t&&t.length>0){let c=function(u){return Promise.all(u.map(p=>Promise.resolve(p).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const d=document.querySelector("meta[property=csp-nonce]"),o=d?.nonce||d?.getAttribute("nonce");i=c(t.map(u=>{if(u=ua(u),u in xn)return;xn[u]=!0;const p=u.endsWith(".css"),m=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${m}`))return;const h=document.createElement("link");if(h.rel=p?"stylesheet":ca,p||(h.as="script"),h.crossOrigin="",h.href=u,o&&h.setAttribute("nonce",o),document.head.appendChild(h),p)return new Promise((g,v)=>{h.addEventListener("load",g),h.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${u}`)))})}))}function r(d){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=d,window.dispatchEvent(o),!o.defaultPrevented)throw d}return i.then(d=>{for(const o of d||[])o.status==="rejected"&&r(o.reason);return e().catch(r)})},Mi="/tapscore/".replace(/\/+$/,""),As=Mi+"/api",Yt={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},pa=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function Ai(s,e){const t={};for(const[n,i]of pa)if(n in s)for(const r of i)r in s||(t[r]=`var(--${n})`);return{...e,...t,...s}}const zi=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],fa={thin:"1px",medium:"3px",thick:"5px"};function Li(s){const e=s.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":fa[e.toLowerCase()]??e}function ma(){return zi.map(s=>{const e=Li(Yt[s]);return`@property --${s}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const Bi={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Fi={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},ga={...Fi,"done-opacity":"0.35"},ba={...Bi,...Fi,...Yt,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},_a={...Bi,...ga,...Yt,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class ya{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;Gi(e);const n=this.tracking;this.tracking=e;try{t()}finally{this.tracking=n}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const n of t)n.disposed||n.run()}}}const $e=new ya;function Gi(s){for(const e of s.deps)e.delete(s);s.deps.clear()}class f{constructor(e){this.subs=new Set,this.val=e}get(){return $e.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,$e.notify(this.subs))}update(e){this.set(e(this.val))}}class k{constructor(e){this.subs=new Set,this.val=void 0;const t=this,n={run(){$e.runTracked(n,()=>{const i=e();Object.is(t.val,i)||(t.val=i,$e.notify(t.subs))})},deps:new Set};n.run()}get(){return $e.subscribe(this.subs),this.val}peek(){return this.val}}function C(s){const e={run(){$e.runTracked(e,s)},deps:new Set};return e.run(),()=>{e.disposed=!0,Gi(e)}}function ot(s){$e.batch(s)}function te(s){return $e.untrack(s)}class va{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const U=new va,Qe=Mi;function zs(s){return Qe?s===Qe?"/":s.startsWith(Qe+"/")?s.slice(Qe.length):s:s}function wa(s){return Qe+s}class G{constructor(){this.route=new f(zs(location.pathname??"/")),this.search=new f(location.search??""),window.addEventListener("popstate",()=>ot(()=>{this.route.set(zs(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const n=typeof t=="boolean"?{replace:t}:t??{},i=e.indexOf("#"),r=i>=0?e.slice(i):"",d=i>=0?e.slice(0,i):e,o=d.indexOf("?"),c=o>=0?d.slice(0,o):d,u=o>=0?d.slice(o+1):"",p=n.query!==void 0?xa(n.query):u?"?"+u:"",m=wa(c)+p+r;(n.replace?history.replaceState:history.pushState).call(history,null,"",m),ot(()=>{this.route.set(c),this.search.set(p)})}back(){history.back()}link(e,t="active"){const n=e.split("#")[0].split("?")[0];return{onclick:i=>{i.preventDefault(),this.navigate(e)},className:()=>{const i=this.route.get();return i===n||i.startsWith(n+"/")?t:""}}}params(e){const t=e.split("/");return new k(()=>{const n=this.route.get().split("/"),i={};for(const[r,d]of t.entries())d.startsWith(":")&&(i[d.slice(1)]=n[r]??"");return i})}query(e){return new k(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new k(()=>{const e={};for(const[t,n]of new URLSearchParams(this.search.get()))e[t]=n;return e})}}function xa(s){const e=new URLSearchParams;for(const[n,i]of Object.entries(s))i==null||i===""||e.set(n,String(i));const t=e.toString();return t?"?"+t:""}function $a(s){return e=>s[e]}const ka="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",$n="data-basics-global";function Sa(){if(document.head.querySelector(`style[${$n}]`))return;const s=document.createElement("style");s.setAttribute($n,""),s.textContent=ma()+ka,document.head.appendChild(s)}function Ta(s,e){Sa();const t=new Set(zi),n=(r,d,o)=>{const c=Object.entries(r).map(([u,p])=>`--${u}:${t.has(u)?Li(p):p}`).join(";");return`${d}{color-scheme:${o};${c}}`},i=document.createElement("style");return i.textContent=n(s,'[data-theme="light"]',"light")+n(e,'[data-theme="dark"]',"dark"),document.head.appendChild(i),r=>`var(--${r})`}const kn="basics-js-theme";class Pa{constructor(){this.dark=new f(!1);const e=localStorage.getItem(kn),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),C(()=>{const n=this.dark.get();document.documentElement.setAttribute("data-theme",n?"dark":"light"),localStorage.setItem(kn,n?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function b(s){const e=document.createElement("template");return e.innerHTML=s,e}function Ca(s,e){let t;for(const n of Object.keys(e))s.startsWith(n+"/")&&(!t||n.length>t.length)&&(t=n);return t?e[t]:void 0}const Sn=new Set;class M{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!Sn.has(t)){Sn.add(t);const n=document.createElement("style");n.textContent=t.styles,document.head.appendChild(n)}}onMount(){}onDestroy(){}inject(e){return U.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...n){const i=te(()=>{const r=new e(n[0]);return r.mount(t),r});return this.children.push(i),i}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){te(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,n){const i=n??(d=>this.track(d)),r=e.content.cloneNode(!0);for(const d of r.querySelectorAll("[bind]")){const o=t[d.getAttribute("bind")];if(o)if(typeof o=="function")i(C(()=>{const c=o();d instanceof HTMLInputElement||d instanceof HTMLTextAreaElement?d.value=String(c):d.textContent=String(c)}));else for(const[c,u]of Object.entries(o)){const p=c.includes("-");c.startsWith("on")&&typeof u=="function"?d.addEventListener(c.slice(2),u):typeof u=="function"?i(C(()=>{const m=u();p?d.setAttribute(c,String(m)):d[c]=m})):p?d.setAttribute(c,String(u)):d[c]=u}}return r}wireEl(e,t,n){return this.wire(e,t,n).firstElementChild}slot(e,t){const n=this.props[e];if(n==null)return!1;const i=this.ref(t,e);return i?(typeof n=="string"?i.textContent=n:typeof n=="function"&&n.prototype instanceof M?this.spawn(n,i):typeof n=="function"&&n(i,{spawn:(r,d,...o)=>this.spawn(r,d,...o),track:r=>this.track(r)}),!0):!1}$each(e,t,n,i=(r,d)=>d){const r=typeof t=="function"?t:()=>t.get(),d=new Map,o=new Map;this.track(()=>{for(const c of o.values())c.forEach(u=>u());o.clear()}),this.track(C(()=>{const c=r(),u=new Map;for(const[m,h]of c.entries()){const g=i(h,m);if(d.has(g))u.set(g,d.get(g));else{const v=[];u.set(g,te(()=>n(h,m,w=>v.push(w)))),o.set(g,v)}}for(const[m,h]of d)u.has(m)||(h.remove(),te(()=>o.get(m)?.forEach(g=>g())),o.delete(m));let p=e.firstChild;for(const m of u.values())m===p?p=p.nextSibling:e.insertBefore(m,p);d.clear();for(const[m,h]of u)d.set(m,h)}))}$condition(e,t,n,i){let r=null;this.track(C(()=>{r&&(r.remove(),r=null);const d=t.get();r=te(()=>d?n():i?.()??null),r&&e.appendChild(r)}))}$swap(e,t,n,i){let r=null;this.track(C(()=>{if(r){const c=r;r=null,te(()=>c.destroy())}e.textContent="";const d=t.get(),o=n[d]??Ca(d,n)??i;o&&(r=te(()=>{const c=new o;return c.mount(e),c}))})),this.track(()=>r?.destroy())}}const Ot=new Set;function Ia(s){return Ot.add(s),()=>Ot.delete(s)}function Ea(){for(const s of Array.from(Ot)){Ot.delete(s);try{s()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function Ra(s,e,t){const n=document.querySelector(e);n.textContent="";const i=U.get(G);let r=null,d=!1,o=null,c=!!t?.hot?.data.hmr;const u=async p=>{r&&(r.destroy(),r=null,n.textContent=""),p?(o||(o=(await ha(()=>import("./obs-shell.component-CxPWP7C4.js"),[])).ObsShellComponent),r=te(()=>new o)):(!c&&t?.onInit&&(await t.onInit(),c=!0),r=te(()=>new s)),te(()=>r.mount(n)),d=p};await u(zs(location.pathname).startsWith("/_obs")),C(()=>{const p=i.route.get().startsWith("/_obs");p!==d&&u(p)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{r?.destroy()}catch(p){console.error("[startApp] the root component threw while disposing",p)}if(r=null,Ea(),t.onDispose)try{t.onDispose()}catch(p){console.error("[startApp] onDispose threw",p)}}),t.hot.accept())}class Y extends Error{constructor(e,t,n,i){super(t),this.status=e,this.details=n,this.traceId=i,this.name="ApiError"}}const Na=10,Et=[];let Rt=[],nt=null;function Oa(s){Et.push(s),Et.length>Na&&Et.shift()}function ji(s,e,t){const n={code:s,message:e,url:typeof location<"u"?location.href:"",context:[...Et],timestamp:new Date().toISOString()};t!==void 0&&(n.traceId=t),Rt.push(n),Ha()}function Ha(){nt||(nt=setTimeout(Di,5e3))}function Di(){if(nt&&(clearTimeout(nt),nt=null),Rt.length===0)return;const s=Rt;Rt=[];for(const e of s){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${As}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${As}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Di()});const Ma=3e4,Aa=2,yt=new Map,qi=new WeakMap;function za(s){if(s instanceof Y)return s.traceId;if(s!=null&&typeof s=="object")return qi.get(s)}async function _(s){if(s.method==="GET"){const e=yt.get(s.url);if(e)return e;const t=Tn(s,Aa);return yt.set(s.url,t),t.then(()=>yt.delete(s.url),()=>yt.delete(s.url)),t}return Tn(s,0)}async function Tn(s,e){const t=s.timeout??Ma;let n;for(let i=0;i<=e;i++){const r=crypto.randomUUID();try{return await Ba(La(s,r),t)}catch(d){if(n=d,!(d instanceof Y)&&d!=null&&typeof d=="object"&&qi.set(d,r),d instanceof Y||i===e)break;await new Promise(o=>setTimeout(o,1e3*2**i))}}throw n}async function La(s,e){const t={"X-Trace-Id":e},n={method:s.method,headers:t};s.body!==void 0&&(t["Content-Type"]="application/json",n.body=JSON.stringify(s.body));const i=await fetch(s.url,n),r=i.headers.get("x-trace-id")??e;if(Oa({type:"api",detail:`${s.method} ${s.url}`,timestamp:new Date().toISOString()}),!i.ok){const d=await i.json().catch(()=>({error:i.statusText}));throw new Y(i.status,d.error??i.statusText,d.details,r)}return i.json()}function Ba(s,e){let t;const n=new Promise((i,r)=>{t=setTimeout(()=>r(new Error("Request timeout")),e)});return Promise.race([s,n]).finally(()=>clearTimeout(t))}const Ls=new Set;let hs=!1;function Fa(s){return Ls.add(s),()=>{Ls.delete(s)}}function Vi(){if(!hs){hs=!0;try{for(const s of[...Ls])try{s()}catch(e){try{ji("session-listener",Ga(e))}catch{}}}finally{hs=!1}}}function Ga(s){try{if(s instanceof Error){const e=s.message;if(typeof e=="string")return e}return String(s)}catch{return"listener threw a value that could not be described"}}async function F(s,e,t,n={}){ot(()=>{s.set(!0),e.set(null)});try{const i=await t();return s.set(!1),i}catch(i){const r=ja(i);ot(()=>{s.set(!1),e.set(r)}),ji(r.code,r.message,za(i)),r.code==="auth"&&n.sessionExpiry!==!1&&Vi();return}}function ja(s){return s instanceof Y?s.status===401?{code:"auth",message:"Unauthorized"}:s.status===409?{code:"conflict",message:"Data has changed — please try again"}:s.status===400?{code:"validation",message:s.message}:s.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:s instanceof Error?s.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const ps={sessionExpiry:!1};function Da(s){return{me:()=>_({method:"GET",url:`${s}/auth/me`}),login:e=>_({method:"POST",url:`${s}/auth/login`,body:e}),logout:()=>_({method:"POST",url:`${s}/auth/logout`,body:{}}),logoutAll:()=>_({method:"POST",url:`${s}/auth/logout-all`,body:{}})}}class D{constructor(){this.api=Da(As),this.currentUser=new f(null),this.loading=new f(!1),this.error=new f(null),this.offSessionExpired=Fa(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=Ia(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await F(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const n=await F(this.loading,this.error,()=>this.api.login({username:e,password:t}),ps);return n?(this.currentUser.set(n),!0):!1}async logout(){await F(this.loading,this.error,()=>this.api.logout(),ps);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}async logoutEverywhere(){const e=await F(this.loading,this.error,()=>this.api.logoutAll(),ps),t=this.error.get();return(!t||t.code==="auth")&&this.currentUser.set(null),e?.revoked??null}}const Ui={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},qa={...Ui,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},Va={...Ui,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"},Ua=Ai(qa,ba),Ka=Ai(Va,_a),l=Ta(Ua,Ka),L=s=>`var(--${s})`,I=(s,e)=>`var(--${s}, ${e})`,E=s=>{const e=Yt[s];if(e===void 0)throw new Error(`unknown control token: --${s}`);return e},a=$a({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),vt=s=>`
    background: ${I(`btn-${s}-bg`,E(`btn-${s}-bg`))};
    color: ${I(`btn-${s}-fg`,E(`btn-${s}-fg`))};
    border-color: ${I(`btn-${s}-border`,E(`btn-${s}-border`))};
    box-shadow: ${I(`btn-${s}-shadow`,E(`btn-${s}-shadow`))};
    &:hover {
        background: ${I(`btn-${s}-bg-hover`,E(`btn-${s}-bg-hover`))};
        color: ${I(`btn-${s}-fg-hover`,E(`btn-${s}-fg-hover`))};
        border-color: ${I(`btn-${s}-border-hover`,E(`btn-${s}-border-hover`))};
    }`,Ki=`
    background: ${I("btn-disabled-bg",E("btn-disabled-bg"))};
    color: ${I("btn-disabled-fg",E("btn-disabled-fg"))};
    border-color: ${I("btn-disabled-border",E("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${I("btn-disabled-opacity",E("btn-disabled-opacity"))};
    cursor: not-allowed;`,Wa={primary:vt("primary"),secondary:vt("secondary"),ghost:vt("ghost"),danger:vt("danger"),disabled:Ki},$=(s=I("btn-radius",E("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${I("btn-border-width",E("btn-border-width"))} solid transparent;
    border-radius: ${s};
    padding: ${I("btn-padding-y",E("btn-padding-y"))} ${I("btn-padding-x",E("btn-padding-x"))};
    font-family: ${L("font-ui")};
    font-size: ${I("btn-font-size",E("btn-font-size"))};
    line-height: ${I("btn-line-height",E("btn-line-height"))};
    font-weight: ${I("btn-font-weight",E("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${L("dur-fast")} ${L("ease-standard")},
        border-color ${L("dur-fast")} ${L("ease-standard")},
        color ${L("dur-fast")} ${L("ease-standard")},
        box-shadow ${L("dur-fast")} ${L("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${I("btn-focus-ring-width",E("btn-focus-ring-width"))} ${I("btn-focus-ring",E("btn-focus-ring"))};
    }
    ${Wa[e]}
    &:disabled {${Ki}}
`,Ya=`max(${I("field-border-width",E("field-border-width"))}, ${I("field-rule-width",E("field-rule-width"))})`,wt=(s,e)=>`
    border-top-color: ${s};
    border-right-color: ${s};
    border-left-color: ${s};
    border-bottom-color: ${e};`,ae=()=>`
    border-style: solid;
    border-top-width: ${I("field-border-width",E("field-border-width"))};
    border-right-width: ${I("field-border-width",E("field-border-width"))};
    border-left-width: ${I("field-border-width",E("field-border-width"))};
    border-bottom-width: ${Ya};
    ${wt(I("field-border",E("field-border")),I("field-rule",E("field-rule")))}
    border-radius: ${I("field-radius",E("field-radius"))};
    padding: ${I("field-padding-y",E("field-padding-y"))} ${I("field-padding-x",E("field-padding-x"))};
    background: ${I("field-bg",E("field-bg"))};
    color: ${L("text")};
    font-family: ${L("font-ui")};
    font-size: ${I("field-font-size",E("field-font-size"))};
    line-height: ${I("field-line-height",E("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${L("dur-fast")} ${L("ease-standard")},
        box-shadow ${L("dur-fast")} ${L("ease-standard")},
        background ${L("dur-fast")} ${L("ease-standard")};
    &::placeholder { color: ${L("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${wt(I("field-focus-border",E("field-focus-border")),I("field-focus-border",E("field-focus-border")))}
        background: ${I("field-bg-focus",E("field-bg-focus"))};
        box-shadow: 0 0 0 ${I("field-focus-ring-width",E("field-focus-ring-width"))} ${I("field-focus-ring",E("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${wt(I("field-invalid-border",E("field-invalid-border")),I("field-invalid-rule",E("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${wt(I("field-invalid-border",E("field-invalid-border")),I("field-invalid-rule",E("field-invalid-rule")))}
        background: ${I("field-bg-focus",E("field-bg-focus"))};
        box-shadow: 0 0 0 ${I("field-focus-ring-width",E("field-focus-ring-width"))} ${I("field-invalid-ring",E("field-invalid-ring"))};
    }
`,Xa=()=>`
    display: block;
    font-family: ${L("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${L("text-muted")};
`,R=s=>`
    background: ${L("surface")};
    border: 1px solid ${L("border")};
    border-radius: ${L("radius-md")};
    box-shadow: ${L("shadow-1")};
    ${s?.hover?`
    transition:
        box-shadow ${L("dur-base")} ${L("ease-standard")},
        border-color ${L("dur-base")} ${L("ease-standard")};
    &:hover { box-shadow: ${L("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${Xa()}
        margin: 0 0 ${a("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${L("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${L("text")};
    }
    & .ui-card__meta {
        margin: ${a("xs")} 0 0 0;
        font-family: ${L("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${L("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${a("md")};
        font-family: ${L("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${L("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;function Qa(s){return{async me(){return _({method:"GET",url:`${s}/players/me`})},async register(e){return _({method:"POST",url:`${s}/players/register`,body:e})},async updateHandicap(e){return _({method:"POST",url:`${s}/players/me/handicap`,body:e})},async confirmHandicap(){return _({method:"POST",url:`${s}/players/me/handicap/confirm`,body:{}})},async myHandicapHistory(){return _({method:"GET",url:`${s}/players/me/handicap-history`})},async updateProfile(e){return _({method:"POST",url:`${s}/players/me/profile`,body:e})},async search(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/players/search${n?"?"+n:""}`})}}}function Ja(s){return{async list(){return _({method:"GET",url:`${s}/friends`})},async add(e){return _({method:"POST",url:`${s}/friends`,body:e})},async remove(e){return _({method:"DELETE",url:`${s}/friends/${e.friendId}`})}}}function Za(s){return{async list(){return _({method:"GET",url:`${s}/clubs`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/clubs/get${n?"?"+n:""}`})},async create(e){return _({method:"POST",url:`${s}/clubs`,body:e})},async update(e){return _({method:"POST",url:`${s}/clubs/update`,body:e})},async remove(e){return _({method:"DELETE",url:`${s}/clubs/${e.id}`})}}}function eo(s){return{async list(){return _({method:"GET",url:`${s}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/courses/by-club${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/courses/get${n?"?"+n:""}`})},async create(e){return _({method:"POST",url:`${s}/courses`,body:e})},async update(e){return _({method:"POST",url:`${s}/courses/update`,body:e})},async updateHole(e){return _({method:"POST",url:`${s}/courses/holes/update`,body:e})},async validate(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/courses/validate${n?"?"+n:""}`})},async remove(e){return _({method:"DELETE",url:`${s}/courses/${e.id}`})}}}function to(s){return{async listByCourse(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/tees/by-course${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/tees/get${n?"?"+n:""}`})},async create(e){return _({method:"POST",url:`${s}/tees`,body:e})},async update(e){return _({method:"POST",url:`${s}/tees/update`,body:e})},async remove(e){return _({method:"DELETE",url:`${s}/tees/${e.id}`})}}}function so(s){return{async create(e){return _({method:"POST",url:`${s}/guest-players`,body:e})}}}function no(s){return{async latest(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/handicap/latest${n?"?"+n:""}`})},async history(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/handicap/history${n?"?"+n:""}`})},async record(e){return _({method:"POST",url:`${s}/handicap/record`,body:e})}}}function io(s){return{async list(){return _({method:"GET",url:`${s}/rounds`})},async balls(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/rounds/balls${n?"?"+n:""}`})},async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/rounds/get${n?"?"+n:""}`})},async create(e){return _({method:"POST",url:`${s}/rounds`,body:e})},async createFromDraft(e){return _({method:"POST",url:`${s}/rounds/from-draft`,body:e})},async update(e){return _({method:"POST",url:`${s}/rounds/update`,body:e})},async remove(e){return _({method:"DELETE",url:`${s}/rounds/${e.id}`})}}}function ro(s){return{async listByRound(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/score-events/by-round${n?"?"+n:""}`})},async append(e){return _({method:"POST",url:`${s}/score-events`,body:e})}}}function ao(s){return{async forBall(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/scorecards/for-ball${n?"?"+n:""}`})},async forRound(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/scorecards/for-round${n?"?"+n:""}`})}}}function oo(s){return{async forRound(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/leaderboards/for-round${n?"?"+n:""}`})}}}function lo(s){return{async create(e){return _({method:"POST",url:`${s}/friendly-rounds`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/friendly-rounds/by-token${n?"?"+n:""}`})},async balls(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/friendly-rounds/balls${n?"?"+n:""}`})},async scorecard(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/friendly-rounds/scorecard${n?"?"+n:""}`})},async result(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/friendly-rounds/result${n?"?"+n:""}`})},async score(e){return _({method:"POST",url:`${s}/friendly-rounds/score`,body:e})},async setup(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/friendly-rounds/setup${n?"?"+n:""}`})},async editSetup(e){return _({method:"POST",url:`${s}/friendly-rounds/setup`,body:e})},async remove(e){return _({method:"DELETE",url:`${s}/friendly-rounds/${e.token}`})},async finish(e){return _({method:"POST",url:`${s}/friendly-rounds/finish`,body:e})},async reopen(e){return _({method:"POST",url:`${s}/friendly-rounds/reopen`,body:e})},async setVisibility(e){return _({method:"POST",url:`${s}/friendly-rounds/visibility`,body:e})},async join(e){return _({method:"POST",url:`${s}/friendly-rounds/join`,body:e})},async leave(e){return _({method:"POST",url:`${s}/friendly-rounds/leave`,body:e})},async claimGuest(e){return _({method:"POST",url:`${s}/friendly-rounds/claim-guest`,body:e})},async renameGuest(e){return _({method:"POST",url:`${s}/friendly-rounds/rename-guest`,body:e})},async claimSeat(e){return _({method:"POST",url:`${s}/friendly-rounds/claim-seat`,body:e})},async releaseSeat(e){return _({method:"POST",url:`${s}/friendly-rounds/release-seat`,body:e})}}}function co(s){return{async myRounds(){return _({method:"GET",url:`${s}/dashboard/my-rounds`})},async friendsActivity(){return _({method:"GET",url:`${s}/dashboard/friends-activity`})}}}function uo(s){return{async clubs(){return _({method:"GET",url:`${s}/setup/clubs`})},async courses(){return _({method:"GET",url:`${s}/setup/courses`})},async teesByCourse(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/setup/tees/by-course${n?"?"+n:""}`})},async formats(){return _({method:"GET",url:`${s}/setup/formats`})},async aggregations(){return _({method:"GET",url:`${s}/setup/aggregations`})},async formations(){return _({method:"GET",url:`${s}/setup/formations`})}}}function ho(s){return{async get(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/competitions/get${n?"?"+n:""}`})},async participants(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/competitions/participants${n?"?"+n:""}`})},async leaderboard(e){const t=new Set(["id"]),n=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&n.set(r,String(d));const i=n.toString();return _({method:"GET",url:`${s}/competitions/${e.id}/leaderboard${i?"?"+i:""}`})},async results(e){const t=new Set(["id"]),n=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&n.set(r,String(d));const i=n.toString();return _({method:"GET",url:`${s}/competitions/${e.id}/results${i?"?"+i:""}`})},async list(){return _({method:"GET",url:`${s}/competitions`})},async create(e){return _({method:"POST",url:`${s}/competitions`,body:e})},async update(e){return _({method:"POST",url:`${s}/competitions/update`,body:e})},async transition(e){return _({method:"POST",url:`${s}/competitions/transition`,body:e})},async createRound(e){const t=new Set(["id"]),n={};for(const[i,r]of Object.entries(e))t.has(i)||(n[i]=r);return _({method:"POST",url:`${s}/competitions/${e.id}/rounds`,body:n})},async applyCut(e){const t=new Set(["id"]),n={};for(const[i,r]of Object.entries(e))t.has(i)||(n[i]=r);return _({method:"POST",url:`${s}/competitions/${e.id}/cut`,body:n})},async finalize(e){const t=new Set(["id"]),n={};for(const[i,r]of Object.entries(e))t.has(i)||(n[i]=r);return _({method:"POST",url:`${s}/competitions/${e.id}/finalize`,body:n})},async addParticipant(e){return _({method:"POST",url:`${s}/competitions/participants/add`,body:e})},async removeParticipant(e){return _({method:"POST",url:`${s}/competitions/participants/remove`,body:e})},async withdrawParticipant(e){return _({method:"POST",url:`${s}/competitions/participants/withdraw`,body:e})}}}function po(s){return{async myRoles(){return _({method:"GET",url:`${s}/me/roles`})},async adminStats(){return _({method:"GET",url:`${s}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/admin/rounds${n?"?"+n:""}`})},async adminPlayers(){return _({method:"GET",url:`${s}/admin/players`})},async adminGrantRole(e){return _({method:"POST",url:`${s}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return _({method:"POST",url:`${s}/admin/roles/revoke`,body:e})}}}function fo(s){return{async myConfig(){return _({method:"GET",url:`${s}/players/me/stats-config`})},async putMyConfig(e){return _({method:"PUT",url:`${s}/players/me/stats-config`,body:e})},async myStats(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/players/me/stats${n?"?"+n:""}`})},async myRoundStats(e){const t=new Set(["roundId"]),n=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&n.set(r,String(d));const i=n.toString();return _({method:"GET",url:`${s}/players/me/rounds/${e.roundId}/stats${i?"?"+i:""}`})},async appendEvents(e){return _({method:"POST",url:`${s}/friendly-rounds/stat-events`,body:e})},async byToken(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/friendly-rounds/stats${n?"?"+n:""}`})},async configsByToken(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const n=t.toString();return _({method:"GET",url:`${s}/friendly-rounds/stats-configs${n?"?"+n:""}`})}}}function mo(s){return{async profile(e){const t=new Set(["playerId"]),n=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&n.set(r,String(d));const i=n.toString();return _({method:"GET",url:`${s}/friends/${e.playerId}/profile${i?"?"+i:""}`})},async rounds(e){const t=new Set(["playerId"]),n=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&n.set(r,String(d));const i=n.toString();return _({method:"GET",url:`${s}/friends/${e.playerId}/rounds${i?"?"+i:""}`})},async courses(e){const t=new Set(["playerId"]),n=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&n.set(r,String(d));const i=n.toString();return _({method:"GET",url:`${s}/friends/${e.playerId}/courses${i?"?"+i:""}`})}}}function go(s){return{async round(e){const t=new Set(["roundId"]),n=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&n.set(r,String(d));const i=n.toString();return _({method:"GET",url:`${s}/spectate/rounds/${e.roundId}${i?"?"+i:""}`})}}}const q="/tapscore/".replace(/\/+$/,"")+"/api",y={players:Qa(q),friends:Ja(q),clubs:Za(q),courses:eo(q),tees:to(q),guestPlayers:so(q),handicap:no(q),rounds:io(q),scoreEvents:ro(q),scorecards:ao(q),leaderboards:oo(q),friendlyRounds:lo(q),dashboard:co(q),setup:uo(q),competitions:ho(q),admin:po(q),playerStats:fo(q),friendProfile:mo(q),spectate:go(q)};function bo(s){return[...s.played?["Played"]:[],...s.created?["Created"]:[]].join(" · ")}function _o(s,e){const t=new Map;for(const n of e)t.set(n.round.id,{round:n.round,token:n.friendlyRound.shareToken,holesPlayed:null,played:!1,created:!0});for(const n of s){const i=t.get(n.round.id);i?(i.played=!0,i.holesPlayed=n.progress?.holesPlayed??null):t.set(n.round.id,{round:n.round,token:n.shareToken,holesPlayed:n.progress?.holesPlayed??null,played:!0,created:!1})}return[...t.values()].sort((n,i)=>(i.round.lastActivityAt??"").localeCompare(n.round.lastActivityAt??"")||i.round.date.localeCompare(n.round.date)||n.round.id.localeCompare(i.round.id))}function yo(s,e){return s.filter(t=>t.played&&!t.created&&!e.has(t.round.id)).slice().sort((t,n)=>n.round.date.localeCompare(t.round.date)||t.round.id.localeCompare(n.round.id))}function xt(s,e){return s.some(t=>t.round.id===e)?s.filter(t=>t.round.id!==e):s}function X(){try{return globalThis.localStorage??null}catch{return null}}function We(s,e,t){return{read(n=X()){if(!n)return e.empty;let i;try{i=n.getItem(s)}catch{return e.empty}if(!i)return e.empty;try{return e.decode(i)}catch{return e.empty}},write(n,i=X()){if(!i)return e.empty;const r=t!==void 0&&Array.isArray(n)?n.slice(0,t):n;try{i.setItem(s,e.encode(r))}catch{}return r}}}function Xs(s){return{decode(e){const t=JSON.parse(e);return Array.isArray(t)?t.filter(s):[]},encode:e=>JSON.stringify(e),get empty(){return[]}}}const vo=500,Qs=We("tapscore.seen-rounds.v1",Xs(s=>typeof s=="string"),vo);function Xt(s=X()){return Qs.read(s)}function fs(s=X()){return new Set(Xt(s))}function wo(s,e=X()){return Xt(e).includes(s)}function xo(s,e=X()){if(!e)return[];const t=Xt(e).filter(n=>n!==s);return Qs.write([s,...t],e)}function Wi(s,e=X()){if(!e)return[];const t=Xt(e),n=t.filter(i=>i!==s);return n.length!==t.length&&Qs.write(n,e),n}const $o=50,Js=We("tapscore.device-rounds.v1",Xs(ko),$o);function Qt(s=X()){return Js.read(s)}function ko(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.courseName=="string"&&(e.status==="not_started"||e.status==="active"||e.status==="complete")&&typeof e.lastSeenAt=="string"}function Je(s,e=X()){if(!e)return[];const t=Qt(e).filter(n=>n.token!==s.token);return Js.write([s,...t],e)}function Yi(s,e=X()){if(!e)return[];const t=Qt(e),n=t.filter(i=>i.token!==s);return n.length!==t.length&&Js.write(n,e),n}class Jt{mine=new f(null);mineLoading=new f(!1);mineError=new f(null);myRounds=new k(()=>{const e=this.mine.get();return e?_o(e.produced,e.created):[]});deviceRounds=new f([]);seenIds=new f(fs());newRounds=new k(()=>yo(this.myRounds.get(),this.seenIds.get()));async loadMine(){this.seenIds.set(fs());const e=await F(this.mineLoading,this.mineError,()=>y.dashboard.myRounds());e&&this.mine.set(e)}loadDevice(){this.deviceRounds.set(Qt())}clear(){this.mine.set(null),this.mineError.set(null),this.mineLoading.set(!1),this.seenIds.set(fs()),this.loadDevice()}async remove(e,t){try{await y.friendlyRounds.remove({token:e})}catch(i){if(!(i instanceof Y)||i.status!==404)return!1}const n=this.mine.get();return n&&this.mine.set({produced:xt(n.produced,t),created:xt(n.created,t)}),this.deviceRounds.set(Yi(e)),Wi(t),!0}async leave(e,t){try{const i=await y.friendlyRounds.leave({token:e});if(!i.ok)return{ok:!1,message:i.diagnostics.map(r=>r.message).join(" · ")}}catch{return{ok:!1,message:"Could not remove you right now. Try again."}}const n=this.mine.get();return n&&this.mine.set({produced:xt(n.produced,t),created:xt(n.created,t)}),{ok:!0}}}const So={DEV:!1};function To(s,e){return s===void 0||s===""?e:s!=="0"&&s.toLowerCase()!=="false"}const Pn=So??{},Xi={competitions:To(Pn.VITE_FEATURE_COMPETITIONS,!!Pn.DEV)},Po='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v10h12V10"/><path d="M10 20v-5.5h4V20"/></svg>',Co='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M3.5 20c.5-3.5 2.7-5.5 5.5-5.5s5 2 5.5 5.5"/><circle cx="16.5" cy="9.5" r="2.8"/><path d="M16.8 14.6c2.2.4 3.5 2 3.9 4.9"/></svg>',Io='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v3a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5v2a3 3 0 0 0 3 3"/><path d="M16 5h3v2a3 3 0 0 1-3 3"/><path d="M10 12.5V15h4v-2.5"/><path d="M9 20h6"/><path d="M12 15v5"/></svg>';function Eo(s){const e=[{key:"home",label:"Home",href:"/",icon:Po},{key:"friends",label:"Friends",href:"/friends",icon:Co}];return s.competitions&&e.push({key:"comps",label:"Comps",href:"/competitions",icon:Io}),e}const Ro=["/login","/round"];function Zs(s){return!Ro.includes(s)}function Cn(s,e){return e&&Zs(s)}function No(s){return Zs(s)&&s!=="/create"}const Oo=b(`
    <div class="dock" bind="root">
        <button bind="play" class="dock__play" type="button">Play golf</button>
        <nav class="tabbar" bind="bar">
            <div bind="left" class="tabbar__side"></div>
            <span class="tabbar__gap" aria-hidden="true"></span>
            <div bind="right" class="tabbar__side"></div>
        </nav>
    </div>
`),Ho=b(`
    <a bind="link">
        <span class="tabbar__icon">
            <span bind="icon" class="tabbar__glyph"></span>
            <span bind="badge" class="tabbar__badge"></span>
        </span>
        <span bind="label"></span>
    </a>
`);class Mo extends M{static styles=`
        .dock {
            /* The pill is positioned against this box, so it can hang over the
               bar's top edge without either side guessing the other's height. */
            position: relative;

            & .dock__play {
                ${$(l("radius-pill"))}
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
    `;router=this.inject(G);auth=this.inject(D);landing=this.inject(Jt);newCount=new k(()=>this.auth.currentUser.get()?this.landing.newRounds.get().length:0);render(){const e=this.wire(Oo,{bar:{className:()=>Cn(this.router.route.get(),this.auth.currentUser.get()!==null)?"tabbar":"tabbar hidden"},play:{className:()=>{const r=this.router.route.get();return No(r)?Cn(r,this.auth.currentUser.get()!==null)?"dock__play":"dock__play dock__play--floating":"dock__play hidden"},onclick:()=>this.router.navigate("/create")}}),t=Eo(Xi),n=Math.ceil(t.length/2),i=(r,d)=>this.wireEl(Ho,{link:{...this.router.link(r.href),href:r.href},icon:{innerHTML:()=>r.icon},label:()=>r.label,badge:{textContent:()=>{if(r.key!=="home")return"";const o=this.newCount.get();return o===0?"":String(o)},className:()=>(r.key==="home"?this.newCount.get():0)===0?"tabbar__badge":"tabbar__badge show"}},d);return this.$each(this.ref(e,"left"),()=>t.slice(0,n),(r,d,o)=>i(r,o),r=>r.key),this.$each(this.ref(e,"right"),()=>t.slice(n),(r,d,o)=>i(r,o),r=>r.key),e}}const Qi=["tee","approach","putting","shortGame","penalties","recovery"],Nt={enabled:!1,tee:!1,approach:!1,putting:!1,shortGame:!1,penalties:!1,recovery:!1};function Ji(s){switch(s){case"tee":return"Tee shots";case"approach":return"Greens in regulation";case"putting":return"Putting";case"shortGame":return"Short game";case"penalties":return"Penalties";case"recovery":return"Recovery"}}function Ao(s){switch(s){case"tee":return"Fairway, in play or trouble — asked on par 4s and 5s.";case"approach":return"Did the ball hit the green in regulation.";case"putting":return"How long the first putt was, and how many you took.";case"shortGame":return"Standard or hard, asked only when you missed the green.";case"penalties":return"How many penalty strokes the hole cost you.";case"recovery":return"Whether the recovery shot got you back in play."}}const zo="Track statistics",Lo="Adds a few taps per hole while you score — turn it off any time, your picks are kept.";function Zi(s){switch(s){case"shortGame":return"putting";case"recovery":return"tee";default:return null}}function Ht(s,e){return s[e]}function Bo(s,e){if(!s.enabled)return!0;const t=Zi(e);return t===null?!1:!Ht(s,t)}function Fo(s,e){if(!s.enabled)return null;const t=Zi(e);return t===null||Ht(s,t)?null:`Needs ${Ji(t)}`}function Go(s,e,t){return Do({...s,[e]:t})}function jo(s,e){return{...s,enabled:e}}function Do(s){const e={...s};return e.putting||(e.shortGame=!1),e.tee||(e.recovery=!1),e}function ms(s){const e={...Nt,enabled:s.enabled};for(const t of Qi)e[t]=s[t];return e}function qo(s){return s.avatarVersion?`${q}/players/${encodeURIComponent(s.id)}/avatar?v=${s.avatarVersion}`:null}function Vo(s,e){const t=(s??"").trim().split(/\s+/).filter(i=>i.length>0);if(t.length>=2)return($t(t[0])+$t(t[t.length-1])).toUpperCase();if(t.length===1)return $t(t[0]).toUpperCase();const n=(e??"").trim();return n.length>0?$t(n).toUpperCase():"•"}function $t(s){return[...s][0]??""}const kt=512,Uo=2*1024*1024;function Ko(s,e){const t=Math.min(s,e);return{sx:Math.round((s-t)/2),sy:Math.round((e-t)/2),size:t}}const Wo=.85;class Ze extends Error{}async function Yo(s){let e;try{e=await createImageBitmap(s)}catch{throw new Ze("That image could not be read. Try a JPEG or PNG.")}try{const{sx:t,sy:n,size:i}=Ko(e.width,e.height),r=document.createElement("canvas");r.width=kt,r.height=kt;const d=r.getContext("2d");if(!d)throw new Ze("This browser cannot process images.");d.drawImage(e,t,n,i,i,0,0,kt,kt);const o=await new Promise(c=>r.toBlob(c,"image/jpeg",Wo));if(!o)throw new Ze("That image could not be processed.");if(o.size>Uo)throw new Ze("That image is too large.");return o}finally{e.close()}}async function Xo(s){const e=await fetch(`${q}/players/me/avatar`,{method:"PUT",headers:{"Content-Type":s.type||"application/octet-stream"},body:s});if(!e.ok)throw await er(e);return await e.json()}async function Qo(){const s=await fetch(`${q}/players/me/avatar`,{method:"DELETE"});if(!s.ok)throw await er(s)}async function er(s){const e=await s.json().catch(()=>({})),t=s.status===413?400:s.status;return new Y(t,Jo(e.error,s.status))}function Jo(s,e){return s==="too_large"||e===413?"That image is too large.":s==="unsupported_type"?"That file is not a JPEG, PNG or WebP image.":s==="empty"?"That image was empty.":s??"Photo upload failed."}class Ce{loading=new f(!1);error=new f(null);player=new f(null);history=new f([]);clubs=new f([]);saving=new f(!1);saveError=new f(null);statsConfig=new f(Nt);statsSaving=new f(!1);statsError=new f(null);hasRecordedStats=new f(!1);avatarSaving=new f(!1);avatarError=new f(null);async load(e=!1){if(!e&&(this.player.get()!==null||this.loading.get()))return;const t=await F(this.loading,this.error,()=>Promise.all([y.players.me(),y.players.myHandicapHistory(),y.clubs.list(),y.playerStats.myConfig().catch(()=>null),y.playerStats.myStats({limit:1}).catch(()=>null)]));if(!t)return;const[n,i,r,d,o]=t;this.player.set(n),this.history.set(i),this.clubs.set(r),this.statsConfig.set(d?ms(d):Nt),this.hasRecordedStats.set((o?.rounds.length??0)>0)}clear(){this.player.set(null),this.history.set([]),this.error.set(null),this.saveError.set(null),this.statsConfig.set(Nt),this.statsError.set(null),this.hasRecordedStats.set(!1),this.avatarError.set(null)}async saveIndex(e){return await F(this.saving,this.saveError,()=>y.players.updateHandicap({handicapIndex:e}))?(await this.load(!0),!0):!1}async confirmHandicap(){const e=await F(this.saving,this.saveError,()=>y.players.confirmHandicap());return e?(this.player.set(e),!0):!1}async saveGender(e){const t=await F(this.saving,this.saveError,()=>y.players.updateProfile({gender:e}));return t?(this.player.set(t),!0):!1}async saveHomeClub(e){const t=await F(this.saving,this.saveError,()=>y.players.updateProfile({homeClubId:e}));return t?(this.player.set(t),!0):!1}async saveStatsConfig(e){if(this.statsSaving.get()||this.saving.get())return!1;const t=await F(this.statsSaving,this.statsError,()=>y.playerStats.putMyConfig(ms(e)));return t?(this.statsConfig.set(ms(t)),!0):!1}async saveAvatar(e){this.avatarError.set(null);let t;try{t=await Yo(e)}catch(i){return this.avatarError.set({code:"validation",message:i instanceof Ze?i.message:"That image could not be prepared."}),!1}const n=await F(this.avatarSaving,this.avatarError,()=>Xo(t));return n?(this.patchAvatarVersion(n.avatarVersion),!0):!1}async removeAvatar(){return await F(this.avatarSaving,this.avatarError,()=>Qo().then(()=>!0))?(this.patchAvatarVersion(null),!0):!1}patchAvatarVersion(e){const t=this.player.get();t&&this.player.set({...t,avatarVersion:e})}homeClubName(){const e=this.player.get()?.homeClubId;return e?this.clubs.get().find(t=>t.id===e)?.name??null:null}}function St(s){const e=[],t=[];for(const n of s)(n.isMutual?e:t).push(n);return{mutual:e,addedByMe:t}}function gs(s,e){return s.displayName.localeCompare(e.displayName,"sv",{sensitivity:"base"})}function Mt(s,e="frecency"){return e==="alpha"?[...s].sort(gs):[...s].sort((t,n)=>{const i=t.frecency,r=n.frecency,d=i>0,o=r>0;if(d!==o)return d?-1:1;if(!d)return gs(t,n);if(r!==i)return r-i;const c=t.lastPlayedAt?Date.parse(t.lastPlayedAt):NaN,u=n.lastPlayedAt?Date.parse(n.lastPlayedAt):NaN,p=Number.isNaN(c)?Number.NEGATIVE_INFINITY:c,m=Number.isNaN(u)?Number.NEGATIVE_INFINITY:u;return m!==p?m-p:gs(t,n)})}const Zo=1440*60*1e3;function el(s,e){if(!s)return null;const t=Date.parse(s),n=Date.parse(e);if(Number.isNaN(t)||Number.isNaN(n))return null;const i=Math.floor((n-t)/Zo);if(i<=0)return"today";if(i===1)return"yesterday";if(i<7)return`${i} days ago`;if(i<14)return"last week";if(i<30)return`${Math.floor(i/7)} weeks ago`;if(i<60)return"last month";if(i<365)return`${Math.floor(i/30)} months ago`;const r=Math.floor(i/365);return r===1?"last year":`${r} years ago`}function tl(s,e){if(s.sharedRoundCount<=0)return"never played";const t=el(s.lastPlayedAt,e),n=`played ${s.sharedRoundCount}×`;return t?`${n}, ${t}`:n}function sl(s){return s.isMutual?null:"hasn't added you back"}const tr=2;function In(s){return s.trim().length>=tr}function sr(s){return Mt(s,"frecency")}function nl(s,e){return sr([...s.filter(t=>t.id!==e.id),e])}function il(s,e){return s.filter(t=>t.id!==e)}function En(s,e,t){return s.map(n=>n.id===e?{...n,isFriend:t}:n)}function rl(s,e,t=()=>{},n=300){let i=0,r;return d=>{const o=d.trim(),c=++i;if(r!==void 0&&clearTimeout(r),r=void 0,o.length<tr){e(o,[]);return}r=setTimeout(()=>{s(o).then(u=>{c===i&&e(o,u)},u=>{c===i&&t(o,u)})},n)}}const nr=We("tapscore.friends.sort.v1",{decode:s=>s==="alpha"?"alpha":"frecency",encode:s=>s,empty:"frecency"});function al(s=X()){return nr.read(s)}function ol(s,e=X()){nr.write(s,e)}class Zt{loading=new f(!1);error=new f(null);friends=new f([]);loaded=new f(!1);sortMode=new f(al());query=new f("");searching=new f(!1);searchError=new f(null);results=new f([]);resultsFor=new f("");mutating=new f(!1);mutateError=new f(null);runSearch=rl(e=>y.players.search({q:e}),(e,t)=>{this.searching.set(!1),this.results.set(t),this.resultsFor.set(e)},(e,t)=>{this.searching.set(!1),this.results.set([]),this.resultsFor.set(e),this.searchError.set({code:"network",message:t instanceof Error?t.message:"Search failed. Try again."})});async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;const t=await F(this.loading,this.error,()=>y.friends.list());t&&(this.friends.set(sr(t)),this.loaded.set(!0))}setQuery(e){this.query.set(e),this.searchError.set(null),this.searching.set(e.trim().length>=2),this.runSearch(e)}async add(e){await F(this.mutating,this.mutateError,()=>y.friends.add({friendId:e.id}))&&(this.friends.set(nl(this.friends.get(),{id:e.id,username:e.username,displayName:e.displayName,gender:e.gender,handicapIndex:e.handicapIndex,homeClubName:e.homeClubName,avatarVersion:e.avatarVersion,sharedRoundCount:0,lastPlayedAt:null,frecency:0,isMutual:!1})),this.results.set(En(this.results.get(),e.id,!0)))}setSortMode(e){this.sortMode.set(e),ol(e)}async remove(e){await F(this.mutating,this.mutateError,()=>y.friends.remove({friendId:e}))&&(this.friends.set(il(this.friends.get(),e)),this.results.set(En(this.results.get(),e,!1)))}clear(){this.friends.set([]),this.loaded.set(!1),this.query.set(""),this.results.set([]),this.resultsFor.set(""),this.error.set(null),this.searchError.set(null),this.mutateError.set(null),this.searching.set(!1)}}class en{feed=new f(null);loading=new f(!1);loaded=!1;async load(e=!1){if(!(!e&&(this.loaded||this.loading.get()))){this.loading.set(!0);try{this.feed.set(await y.dashboard.friendsActivity()),this.loaded=!0}catch{this.feed.set(null)}finally{this.loading.set(!1)}}}clear(){this.feed.set(null),this.loaded=!1,this.loading.set(!1)}}function et(s,e){return s instanceof Y&&s.status===401?(Vi(),"Your session expired — sign in again."):e}function At(s){return s===0?"E":s>0?`+${s}`:`${s}`}function ll(s){return s.holesPlayed<=0?"Teeing off":s.scoreToPar===null?`Thru ${s.holesPlayed}`:`Thru ${s.holesPlayed} · ${At(s.scoreToPar)}`}function ir(s){const e=s[0];if(!e)return null;const t=s.length-1;return t>0?`${e.displayName} + ${t}`:e.displayName}function rr(s){return(s.courseName??"").trim()||null}function dl(s){const e=[];for(const t of s){const n=t.friends[0],i=ir(t.friends);!n||!i||e.push({roundId:t.roundId,playerId:n.playerId,avatarVersion:n.avatarVersion,displayName:n.displayName,title:i,courseName:rr(t),progress:ll(n)})}return e}function cl(s){const e=s.courseName?` at ${s.courseName}`:"";return`${s.title}${e}, live, ${s.progress}. Watch.`}function ul(s){const e=new Set;for(const t of s)for(const n of t.friends)e.add(n.playerId);return e.size===0?null:e.size===1?"1 friend on the course":`${e.size} friends on the course`}function hl(s,e){if(!s)return null;for(const t of s.live){const n=t.friends.find(i=>i.playerId===e);if(n)return{roundId:t.roundId,holesPlayed:n.holesPlayed,scoreToPar:n.scoreToPar}}return null}function pl(s){return s.holesPlayed<=0?"On the course now · Teeing off":s.scoreToPar===null?`On the course now · Thru ${s.holesPlayed}`:`On the course now · Thru ${s.holesPlayed} · ${At(s.scoreToPar)}`}function fl(s){const e=[];for(const t of s){const n=t.friends[0],i=ir(t.friends);!n||!i||e.push({roundId:t.roundId,friendLabel:i,playerId:n.playerId,avatarVersion:n.avatarVersion,displayName:n.displayName,title:rr(t)??"A round",date:t.date,formatIds:t.formatIds??[]})}return e}function ar(s){if(s instanceof Y){if(s.status===403)return"forbidden";if(s.status===404)return"not_found"}return null}const Ve={forbidden:{title:"Profile not available",message:"This profile is no longer shared with you."},not_found:{title:"Player not found",message:"This player doesn't exist anymore."}};function ml(s){const e=(s.name??"").trim();return e||(s.courseName??"").trim()||"Round"}function gl(s,e){const t=e(s.date),n=(s.name??"").trim(),i=(s.courseName??"").trim();return n&&i?`${t} · ${i}`:t}function bl(s){const e=s.holesPlayed;switch(s.status){case"not_started":return"Not started";case"active":return e<=0?"Teeing off":s.scoreToPar===null?`Thru ${e}`:`Thru ${e} · ${At(s.scoreToPar)}`;case"complete":{if(e<=0)return"Finished";const t=e<s.holeCount?`Thru ${e}`:"Finished";return s.scoreToPar===null?t:`${t} · ${At(s.scoreToPar)}`}}}function _l(s,e){const t=[];s!==null&&t.push(`Hcp ${s.toFixed(1)}`);const n=(e??"").trim();return n&&t.push(n),t.length>0?t.join(" · "):null}function yl(s,e){return`${s.roundsPlayed===1?"1 round":`${s.roundsPlayed} rounds`} · last played ${e(s.lastPlayedAt)}`}function vl(s){return s===1?"1 course played":`${s} courses played`}const bs={rounds:[],nextCursor:null,hasMore:!1};function Rn(s,e){const t=new Set(s.rounds.map(n=>n.roundId));return{rounds:[...s.rounds,...e.rounds.filter(n=>!t.has(n.roundId))],nextCursor:e.nextCursor,hasMore:e.hasMore}}function or(s){return s.hasMore&&s.nextCursor!==null}class es{playerId=new f(null);unavailable=new f(null);profile=new f(null);profileLoading=new f(!1);profileError=new f(null);profileLoaded=!1;rounds=new f(bs);roundsLoaded=new f(!1);roundsLoading=new f(!1);loadingMore=new f(!1);roundsError=new f(null);roundsGeneration=0;courses=new f([]);coursesHasMore=new f(!1);coursesLoaded=new f(!1);coursesLoading=new f(!1);coursesError=new f(null);setPlayer(e){this.playerId.get()!==e&&(this.playerId.set(e),this.resetData())}async loadProfile(e=!1){const t=this.playerId.get();if(t&&!(!e&&(this.profileLoaded||this.profileLoading.get()))){this.profileLoading.set(!0),this.profileError.set(null);try{const n=await y.friendProfile.profile({playerId:t});if(this.playerId.get()!==t)return;this.profile.set(n),this.profileLoaded=!0,this.unavailable.set(null)}catch(n){if(this.playerId.get()!==t)return;this.refuseOr(n,()=>this.profileError.set(et(n,"Couldn't load this profile.")))}finally{this.playerId.get()===t&&this.profileLoading.set(!1)}}}async loadRounds(e=!1){const t=this.playerId.get();if(!t||!e&&(this.roundsLoaded.get()||this.roundsLoading.get()))return;this.roundsGeneration+=1;const n=this.roundsGeneration;this.roundsLoading.set(!0),this.roundsError.set(null);try{const i=await y.friendProfile.rounds({playerId:t});if(n!==this.roundsGeneration)return;this.rounds.set(Rn(bs,i)),this.roundsLoaded.set(!0),this.unavailable.set(null)}catch(i){if(n!==this.roundsGeneration)return;this.refuseOr(i,()=>this.roundsError.set(et(i,"Couldn't load these rounds.")))}finally{n===this.roundsGeneration&&this.roundsLoading.set(!1)}}async loadMoreRounds(){const e=this.playerId.get(),t=this.rounds.get();if(!e||!this.roundsLoaded.get()||!or(t)||this.loadingMore.get()||this.roundsLoading.get())return;const n=this.roundsGeneration;this.loadingMore.set(!0),this.roundsError.set(null);try{const i=await y.friendProfile.rounds({playerId:e,cursor:t.nextCursor??void 0});if(n!==this.roundsGeneration)return;this.rounds.set(Rn(this.rounds.get(),i))}catch(i){if(n!==this.roundsGeneration)return;this.refuseOr(i,()=>this.roundsError.set(et(i,"Couldn't load more rounds.")))}finally{n===this.roundsGeneration&&this.loadingMore.set(!1)}}async loadCourses(e=!1){const t=this.playerId.get();if(t&&!(!e&&(this.coursesLoaded.get()||this.coursesLoading.get()))){this.coursesLoading.set(!0),this.coursesError.set(null);try{const n=await y.friendProfile.courses({playerId:t});if(this.playerId.get()!==t)return;this.courses.set(n.courses),this.coursesHasMore.set(n.hasMore),this.coursesLoaded.set(!0),this.unavailable.set(null)}catch(n){if(this.playerId.get()!==t)return;this.refuseOr(n,()=>this.coursesError.set(et(n,"Couldn't load these courses.")))}finally{this.playerId.get()===t&&this.coursesLoading.set(!1)}}}clear(){this.playerId.set(null),this.resetData()}refuseOr(e,t){const n=ar(e);if(n){this.unavailable.set(n),this.resetData(!0);return}t()}resetData(e=!1){e||this.unavailable.set(null),this.profile.set(null),this.profileLoaded=!1,this.profileLoading.set(!1),this.profileError.set(null),this.rounds.set(bs),this.roundsGeneration+=1,this.roundsLoaded.set(!1),this.roundsLoading.set(!1),this.loadingMore.set(!1),this.roundsError.set(null),this.courses.set([]),this.coursesHasMore.set(!1),this.coursesLoaded.set(!1),this.coursesLoading.set(!1),this.coursesError.set(null)}}function lr(s){return s.handicapIndex*(s.slope/113)+(s.courseRating-s.par)}function wl(s){return Math.round(lr(s))}function xl(s,e,t){const n=t;if(n<=0)return 0;if(s>=0){const c=Math.floor(s/n),u=s-c*n;return c+(e>=1&&e<=u?1:0)}const i=-s,r=Math.floor(i/n),d=i-r*n,o=r+(e>n-d?1:0);return o===0?0:-o}function $l(s){const e=typeof navigator<"u"?navigator.language:void 0;return typeof e=="string"&&e.toLowerCase().startsWith("sv")?"sv":"en"}function _e(){return $l()}const Me=10;class Ue{loading=new f(!1);error=new f(null);descriptors=new f([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await F(this.loading,this.error,()=>y.setup.formats());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=_e()){const n=typeof e=="string"?this.byId(e):e;return n?n.labels?.[t]??n.labels?.en??n.label:null}classify(e){const t=e.requirements.balls;if(t.ballMode==="team")return{kind:"team_ball",teamSize:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const n=t.slotTeamGrouping??{};return{kind:"team_grouping",teamSize:{min:n.teamSize?.min??2,max:n.teamSize?.max??2},...n.teamCount?{teamCount:n.teamCount}:{}}}return{kind:"individual",teamSize:{min:1,max:1}}}configLabelOf(e,t=_e()){return e.labels?.[t]??e.labels?.en??""}configHintOf(e,t=_e()){return e.hint?.[t]??e.hint?.en??""}configFieldIsInline(e,t=_e()){return e.options.length>2||e.options.some(n=>this.configHintOf(n,t))?!1:e.options.every(n=>this.configLabelOf(n,t).length<=12)}presets(e=_e()){return this.descriptors.get().filter(n=>n.preset).sort((n,i)=>{const r=n.preset?.rank??Number.POSITIVE_INFINITY,d=i.preset?.rank??Number.POSITIVE_INFINITY;return r!==d?r-d:(this.labelOf(n,e)??n.id).localeCompare(this.labelOf(i,e)??i.id)})}taglineOf(e,t=_e()){const i=(typeof e=="string"?this.byId(e):e)?.preset?.tagline;return i?.[t]??i?.en??""}playableShape(e){const t=e.requirements.balls;if(t.ballMode==="team")return{count:this.ballCountOf(t.slotBallCount),size:{...t.producerCount}};if(t.requiresSlotTeamGrouping){const n=t.slotTeamGrouping??{},i=n.teamCount??{};return{count:{min:i.min??2,...i.max!==void 0?{max:i.max}:{}},size:{min:n.teamSize?.min??2,max:n.teamSize?.max??2}}}if(t.slotBallCount){const n=this.acceptsSideSubjects(e);return{count:this.ballCountOf(t.slotBallCount),size:{min:1,max:n?Me:1}}}return{count:{min:1},size:{min:1,max:1}}}ballCountOf(e){return{min:e?.min??2,...e?.max!==void 0?{max:e.max}:{}}}classifyId(e){const t=this.byId(e);return t?this.classify(t):null}needsTeams(e){const t=this.classifyId(e);return!!t&&t.kind!=="individual"}isSideFormat(e){return this.classifyId(e)?.kind==="team_grouping"}acceptsSideSubjects(e){const t=typeof e=="string"?this.byId(e):e;return!t||this.classify(t).kind==="team_grouping"?!1:(t.requirements.scoreEntry?.metadata?.length??0)===0}}const Nn=["scramble","foursomes","greensomes"];class kl{loading=new f(!1);error=new f(null);descriptors=new f([]);inFlight=null;loaded=!1;async load(){if(!this.loaded){if(this.inFlight)return this.inFlight;if(typeof y.setup?.formations=="function")return this.inFlight=(async()=>{const e=await F(this.loading,this.error,()=>y.setup.formations());e&&(this.descriptors.set(e),this.loaded=!0)})().finally(()=>{this.inFlight=null}),this.inFlight}}available(){return this.descriptors.get().length>0}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}ids(){return new Set(this.descriptors.get().map(e=>e.id))}chips(){const e=this.descriptors.get(),t=n=>{const i=Nn.indexOf(n);return i===-1?Nn.length:i};return[...e].sort((n,i)=>t(n.id)-t(i.id))}labelOf(e,t=_e()){const n=this.byId(e);return n?n.labels?.[t]??n.labels?.en??n.id:e}sizeOf(e){return this.byId(e)?.size??null}fits(e,t){const n=this.sizeOf(e);return n?t>=n.min&&t<=n.max:!0}allowances(e,t){const n=this.byId(e)?.allowancesBySize?.[String(t)];return n&&n.length===t?n:null}}const Sl=180,On=4,Tl=12;function je(s,e){return e<=0?0:Math.max(0,Math.min(e-1,s))}function Pl(s){const{dragDistance:e,velocity:t,itemWidth:n}=s;if(Math.abs(e)<Tl)return 0;const i=e+t*Sl,r=Math.round(-i/n);return Math.max(-On,Math.min(On,r))}const Hn="tapscore:pending-scores:v1",Cl=336*60*60*1e3,Mn=200;function Il(){try{return globalThis.localStorage??null}catch{return null}}function El(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.ballId=="string"&&typeof e.playHoleId=="string"&&(typeof e.strokes=="number"||e.strokes===null)&&(e.eventType==="score_entered"||e.eventType==="score_cleared")&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class Rl{entries=[];storage;constructor(e=Il(),t=Date.now()){this.storage=e,this.entries=this.load();const n=this.applyHygiene(t);n.length!==this.entries.length&&(this.entries=n,this.persist())}enqueue(e){const t=this.entries.findIndex(n=>n.token===e.token&&n.ballId===e.ballId&&n.playHoleId===e.playHoleId);t>=0?this.entries[t]=e:this.entries.push(e),this.entries=this.applyHygiene(e.queuedAt),this.persist()}remove(e){const t=this.entries.filter(n=>n.clientEventId!==e);t.length!==this.entries.length&&(this.entries=t,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(n=>e-n.queuedAt<=Cl);return t.length>Mn?t.slice(t.length-Mn):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(Hn);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(El):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(Hn,JSON.stringify(this.entries))}catch{}}}const xe=["tee_result","tee_miss_dir","recovery_ok","gir","green_miss_dir","short_game_difficulty","short_game_strokes","first_putt","putts","penalties","penalty_source"],Nl={minPar:4},Ol={tee_result:"Tee shot",tee_miss_dir:"Which side",recovery_ok:"Recovery",gir:"Green in regulation",green_miss_dir:"Missed where",short_game_difficulty:"Short game",short_game_strokes:"Shots to the green",first_putt:"First putt",putts:"Putts",penalties:"Penalties",penalty_source:"Penalty on"},Hl={tee_result:{kind:"segments",options:[{value:"fairway",label:"Fairway"},{value:"in_play",label:"In play"},{value:"trouble",label:"Trouble"}]},tee_miss_dir:{kind:"segments",options:[{value:"left",label:"Left"},{value:"right",label:"Right"}]},gir:{kind:"segments",options:[{value:"0",label:"Miss"},{value:"1",label:"Hit"}]},green_miss_dir:{kind:"segments",options:[{value:"long",label:"Long"},{value:"short",label:"Short"},{value:"left",label:"Left"},{value:"right",label:"Right"}]},first_putt:{kind:"segments",options:[{value:"inside_1m",label:"< 1m"},{value:"1_to_2m",label:"1–2m"},{value:"2_to_4m",label:"2–4m"},{value:"4_to_8m",label:"4–8m"},{value:"over_8m",label:"> 8m"}]},short_game_difficulty:{kind:"segments",options:[{value:"standard",label:"Standard"},{value:"hard",label:"Hard"},{value:"bunker",label:"Bunker"}]},short_game_strokes:{kind:"stepper",min:1,max:5},recovery_ok:{kind:"segments",options:[{value:"0",label:"No"},{value:"1",label:"Yes"}]},putts:{kind:"stepper",min:0,max:3},penalties:{kind:"stepper",min:0,max:null},penalty_source:{kind:"segments",options:[{value:"tee",label:"Tee shot"},{value:"approach",label:"Approach"},{value:"short_or_green",label:"Around the green"}]}};function Bs(s){return Ol[s]}function An(s){return Hl[s]}function Ml(s,e){return e!==null&&s>=e?`${s}+`:`${s}`}function dr(s,e,t){return s?!(s.minPar!=null&&e<s.minPar||s.maxPar!=null&&e>s.maxPar||s.pars!=null&&!s.pars.includes(e)||s.holes!=null&&!s.holes.includes(t)):!0}function Al(s,e,t){return e!==null&&e>0&&t!==null&&t>=0&&s>0}function zl(s,e,t){return e-t<=s-2?"1":"0"}function Fs(s){if(s.girIsLocked)return{state:"manual"};const e=s.isAnswered("gir");if(s.visibility("gir")!=="visible")return e?{state:"persisted"}:{state:"idle"};const t=s.derivedGir();if(t===null)return e?{state:"persisted"}:{state:"idle"};if(!e)return{state:"pending",derived:t};const n=s.value("gir");return n===t?{state:"persisted"}:{state:"disagree",derived:t,stored:n}}class Ll{modules;par;holeNumber;persistedMap;draft=new Map;girLocked=!1;strokes=null;constructor(e,t,n,i={},r=new Map){this.modules=e,this.par=t,this.holeNumber=n,this.persistedMap=zn(i),this.draft=new Map(r),this.prune()}refresh(e,t,n){const i=this.signature();return this.modules=e,this.persistedMap=zn(t),this.strokes=n,this.prune(),this.signature()!==i}setScore(e){this.strokes=e}get girIsLocked(){return this.girLocked}derivedGir(){const e=this.intValue("putts");return e===0&&this.value("first_putt")!==null||!Al(this.par,this.strokes,e)?null:zl(this.par,this.strokes,e)}materialiseDerivedGir(){const e=Fs(this);return e.state!=="pending"?!1:(this.record("gir",e.derived),this.prune(),!0)}signature(){let e="";for(const t of xe)e+=`${t}:${this.visibility(t)}:${this.value(t)??""};`;return e+=`gir-derived:${Fs(this).state};`,e}get prompts(){const e=[];for(const t of xe)this.isVisible(t)&&e.push({key:t,label:Bs(t),control:An(t)});return e}get isEmpty(){return this.prompts.length===0}visibility(e){switch(e){case"tee_result":return this.modules.tee&&dr(Nl,this.par,this.holeNumber)?"visible":"unreadable";case"tee_miss_dir":return!this.modules.tee||this.visibility("tee_result")!=="visible"?"unreadable":this.value("tee_result")==="in_play"||this.value("tee_result")==="trouble"?"visible":"contradicted";case"recovery_ok":return!this.modules.recovery||this.visibility("tee_result")!=="visible"?"unreadable":this.value("tee_result")==="trouble"?"visible":"contradicted";case"gir":return this.modules.approach?"visible":"unreadable";case"green_miss_dir":return!this.modules.approach||this.visibility("gir")!=="visible"?"unreadable":this.value("gir")==="0"?"visible":"contradicted";case"short_game_difficulty":return!this.modules.shortGame||this.visibility("gir")!=="visible"?"unreadable":this.value("gir")==="0"?"visible":"contradicted";case"short_game_strokes":return!this.modules.shortGame||this.visibility("gir")!=="visible"?"unreadable":this.value("gir")==="0"?"visible":"contradicted";case"first_putt":case"putts":return this.modules.putting?"visible":"unreadable";case"penalties":return this.modules.penalties?"visible":"unreadable";case"penalty_source":return!this.modules.penalties||this.visibility("penalties")!=="visible"?"unreadable":(this.intValue("penalties")??0)>=1?"visible":"contradicted"}}isVisible(e){return this.visibility(e)==="visible"}value(e){const t=this.draft.get(e);return t===void 0?this.persistedMap.get(e)??null:"set"in t?t.set:null}intValue(e){const t=this.value(e);if(t===null)return null;const n=Number.parseInt(t,10);return Number.isNaN(n)?null:n}isAnswered(e){return this.value(e)!==null}answer(e,t){this.isVisible(e)&&(e==="gir"&&(this.girLocked=!0),this.record(e,t),this.prune())}step(e,t){const n=An(e);if(!this.isVisible(e)||n.kind!=="stepper")return;let i=(this.intValue(e)??n.min)+t;i<n.min&&(i=n.min),n.max!==null&&i>n.max&&(i=n.max),this.record(e,String(i)),this.prune()}record(e,t){if(t!==null){this.persistedMap.get(e)===t?this.draft.delete(e):this.draft.set(e,{set:t});return}this.persistedMap.get(e)===void 0?this.draft.delete(e):this.draft.set(e,{cleared:!0})}prune(){for(let e=0;e<xe.length;e++){let t=!1;for(const n of xe){const i=this.draft.get(n),r=this.visibility(n);r!=="visible"&&(r==="contradicted"?this.record(n,null):this.draft.delete(n),Bl(i,this.draft.get(n))||(t=!0))}if(!t)return}}get batch(){const e=[];for(const t of xe){const n=this.draft.get(t);n!==void 0&&e.push({key:t,value:"set"in n?n.set:null})}return e}commitDraft(){for(const[e,t]of this.draft)"set"in t?this.persistedMap.set(e,t.set):this.persistedMap.delete(e);this.draft.clear()}}function Bl(s,e){return s===void 0||e===void 0?s===e:"set"in s?"set"in e&&s.set===e.set:!("set"in e)}function zn(s){if(s instanceof Map)return new Map(s);const e=new Map;for(const t of xe){const n=s[t];n!==void 0&&e.set(t,n)}return e}const Ln="tapscore:pending-stat-events:v1",Fl=336*60*60*1e3,Bn=500;function Gl(){try{return globalThis.localStorage??null}catch{return null}}function jl(){try{return crypto.randomUUID()}catch{return`stat-${Date.now()}-${Math.random().toString(36).slice(2)}`}}function Dl(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.playHoleId=="string"&&typeof e.playerId=="string"&&typeof e.key=="string"&&xe.includes(e.key)&&(typeof e.value=="string"||e.value===null)&&typeof e.clientEventId=="string"&&typeof e.queuedAt=="number"}class ql{entries=[];storage;makeId;constructor(e=Gl(),t=Date.now(),n=jl){this.storage=e,this.makeId=n,this.entries=this.load();const i=this.applyHygiene(t);i.length!==this.entries.length&&(this.entries=i,this.persist())}enqueueBatch(e,t,n,i,r=Date.now()){if(i.length===0)return[];const d=[];for(const o of i){const c={token:e,playHoleId:t,playerId:n,key:o.key,value:o.value,clientEventId:this.makeId(),queuedAt:r},u=this.entries.findIndex(p=>p.token===e&&p.playHoleId===t&&p.playerId===n&&p.key===o.key);u>=0?this.entries[u]=c:this.entries.push(c),d.push(c)}return this.entries=this.applyHygiene(r),this.persist(),d}ack(e){if(e.length===0)return;const t=new Set(e),n=this.entries.filter(i=>!t.has(i.clientEventId));n.length!==this.entries.length&&(this.entries=n,this.persist())}entriesFor(e){return this.entries.filter(t=>t.token===e)}size(){return this.entries.length}applyHygiene(e){const t=this.entries.filter(n=>e-n.queuedAt<=Fl);return t.length>Bn?t.slice(t.length-Bn):t}load(){if(!this.storage)return[];try{const e=this.storage.getItem(Ln);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(Dl):[]}catch{return[]}}persist(){if(this.storage)try{this.storage.setItem(Ln,JSON.stringify(this.entries))}catch{}}}const Vl=50;function Ul(s){if(typeof s!="object"||s===null)return!1;const e=s;return typeof e.token=="string"&&typeof e.cursor=="string"}const tn=We("tapscore.result-cursors.v1",Xs(Ul),Vl);function sn(s=X()){return tn.read(s)}function Kl(s,e=X()){return sn(e).find(t=>t.token===s)?.cursor??null}function Wl(s,e,t=X()){if(!t)return[];const n=sn(t).filter(i=>i.token!==s);return tn.write([{token:s,cursor:e},...n],t)}function Yl(s,e=X()){if(!e)return[];const t=sn(e),n=t.filter(i=>i.token!==s);return n.length!==t.length&&tn.write(n,e),n}const Xl=["1st","2nd","3rd","4th","5th","6th","7th","8th"],Ee=(s,e)=>`${s}|${e}`;function nn(s){return s.players.map(e=>e.displayName).join(" & ")||s.label||"Ball"}function Ql(s,e,t){return dr(s,e,t)}function _s(s,e){return`${s.playHoleId}:${s.playerId}:${e}`}function Jl(s){const e=new Map;return s.teeResult!==null&&e.set("tee_result",s.teeResult),s.teeMissDir!==null&&e.set("tee_miss_dir",s.teeMissDir),s.recoveryOk!==null&&e.set("recovery_ok",s.recoveryOk?"1":"0"),s.gir!==null&&e.set("gir",s.gir?"1":"0"),s.greenMissDir!==null&&e.set("green_miss_dir",s.greenMissDir),s.shortGameDifficulty!==null&&e.set("short_game_difficulty",s.shortGameDifficulty),s.shortGameStrokes!==null&&e.set("short_game_strokes",String(s.shortGameStrokes)),s.firstPutt!==null&&e.set("first_putt",s.firstPutt),s.putts!==null&&e.set("putts",String(s.putts)),s.penalties!==null&&e.set("penalties",String(s.penalties)),s.penaltySource!==null&&e.set("penalty_source",s.penaltySource),e}function Zl(s){const e=s?.status;return typeof e!="number"||e<400||e>=500?!1:e!==401&&e!==408&&e!==429}class be{constructor(e=new Rl,t=new ql){this.queue=e,this.statQueue=t}queue;statQueue;loading=new f(!1);error=new f(null);friendlyRound=new f(null);round=new f(null);startList=new f(null);balls=new f([]);firstOpen=new f(!1);firstOpenRoundId=null;scorecards=new f([]);cells=new f(new Map);statModules=new f(new Map);statRows=new f([]);statRev=new f(0);statRevN=0;statLocal=new Map;statConfirmedAt=new Map;statStep=null;statCell=null;statPosting=!1;result=new f(null);resultLoading=new f(!1);resultError=new f(null);resultCursor=null;holeIdx=new f(0);groupIdx=new f(0);keypadOpen=new f(!1);finishFlowOpen=new f(!1);selectedSlot=new f(null);token=null;loadSeq=0;resultSeq=0;quietSeq=0;scorecardSeq=0;flushing=!1;pendingSlotIndex=null;async loadByToken(e,t){const n=e!==this.token;this.token=e;const i=++this.loadSeq;n&&this.resetForNewToken(t),U.get(Ue).load();const r=await F(this.loading,this.error,()=>y.friendlyRounds.byToken({token:e}));if(!r||i!==this.loadSeq||e!==this.token)return;if(this.friendlyRound.set(r.friendlyRound),this.round.set(r.round),this.startList.set(r.startList),Je({token:e,courseName:r.round.courseNameSnapshot??"",name:r.round.name,date:r.round.date,status:r.round.status,completedAt:r.round.completedAt,lastSeenAt:new Date().toISOString()}),this.firstOpenRoundId!==r.round.id&&(this.firstOpenRoundId=r.round.id,this.firstOpen.set(!wo(r.round.id))),U.get(D).currentUser.get()&&xo(r.round.id),this.pendingSlotIndex!==null){const m=r.round.formatSlots[this.pendingSlotIndex]?.slotDefId??null;this.pendingSlotIndex=null,m!==null&&this.selectedSlot.set(m)}const[d,o,c,u]=await Promise.all([y.friendlyRounds.balls({token:e}).catch(()=>[]),y.friendlyRounds.scorecard({token:e}).catch(()=>[]),y.playerStats.configsByToken({token:e}).catch(()=>null),y.playerStats.byToken({token:e}).catch(()=>null)]);i!==this.loadSeq||e!==this.token||(this.flushStats(),c&&this.statModules.set(new Map(c.map(p=>[p.playerId,p.modules]))),u&&(this.statRows.set(u),this.dropConfirmedStatLocals(i)),this.cells.set(new Map),this.scorecards.set(o),this.balls.set(d),n&&t?.holeIdx===void 0&&r.round.status==="active"&&this.holeIdx.set(this.firstIncompleteHoleIndex()),await this.flushPending(),await this.flushPendingStats(),this.refreshStatStep())}deleting=new f(!1);async deleteRound(){const e=this.token;if(!e||this.deleting.get())return!1;this.deleting.set(!0);try{await y.friendlyRounds.remove({token:e}),Yi(e);const t=this.round.get()?.id;return t&&Wi(t),Yl(e),!0}catch{return!1}finally{this.deleting.set(!1)}}finishing=new f(!1);async finishRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await y.friendlyRounds.finish({token:e}),n=this.round.get();return e===this.token&&n&&(this.round.set({...n,status:t.status,completedAt:t.completedAt}),Je({token:e,courseName:n.courseNameSnapshot??"",name:n.name,date:n.date,status:t.status,completedAt:t.completedAt,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async reopenRound(){const e=this.token;if(!e||this.finishing.get())return null;this.finishing.set(!0);try{const t=await y.friendlyRounds.reopen({token:e}),n=this.round.get();return e===this.token&&n&&(this.round.set({...n,status:t.status,completedAt:null}),Je({token:e,courseName:n.courseNameSnapshot??"",name:n.name,date:n.date,status:t.status,completedAt:null,lastSeenAt:new Date().toISOString()})),{status:t.status}}catch{return null}finally{this.finishing.set(!1)}}async loadResult(){const e=this.token;if(!e)return;const t=++this.resultSeq,n=await F(this.resultLoading,this.resultError,()=>y.friendlyRounds.result({token:e}));t!==this.resultSeq||e!==this.token||n&&(this.setResultCursor(e,n.cursor),n.unchanged||this.result.set(n.result))}async refreshScorecard(){const e=this.token;if(!e)return;const t=++this.scorecardSeq,n=this.loadSeq;let i;try{i=await y.friendlyRounds.scorecard({token:e})}catch{return}t!==this.scorecardSeq||n!==this.loadSeq||e!==this.token||this.scorecards.set(i)}async refreshRound(){const e=this.token;if(!e)return;const t=++this.quietSeq,n=this.loadSeq,i=()=>t!==this.quietSeq||n!==this.loadSeq||e!==this.token;try{const r=await y.friendlyRounds.byToken({token:e});if(i())return;this.friendlyRound.set(r.friendlyRound),this.round.set(r.round),this.startList.set(r.startList);const d=await y.friendlyRounds.balls({token:e}).catch(()=>null);if(d===null||i())return;this.balls.set(d)}catch{}}async refreshAll(e){if(this.token){if(e?.feedWillReconnect){await this.refreshRound();return}await Promise.all([this.refreshRound(),this.pollResult(),this.refreshScorecard()])}}persistedCursor(e=this.token){return e?Kl(e):null}setResultCursor(e,t){const n=t!==null&&t!==this.resultCursor;this.resultCursor=t,n&&Wl(e,t)}async pollResult(){const e=this.token;if(!e)return;const t=++this.resultSeq;let n;try{n=await y.friendlyRounds.result({token:e,...this.resultCursor!==null?{cursor:this.resultCursor}:{}})}catch{return}t!==this.resultSeq||e!==this.token||(this.setResultCursor(e,n.cursor),n.unchanged||this.result.set(n.result))}onLiveResultEvent(e){const t=this.token,n=this.round.get();if(t&&n&&e.status!==n.status){const i=e.status==="complete"?new Date().toISOString():null;this.round.set({...n,status:e.status,completedAt:i}),Je({token:t,courseName:n.courseNameSnapshot??"",name:n.name,date:n.date,status:e.status,completedAt:i,lastSeenAt:new Date().toISOString()})}this.pollResult(),this.refreshScorecard()}ballNameById=new k(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,nn(t));for(const t of this.result.get()?.slots??[])for(const n of t.subjectLabels??[])e.set(n.ballId,n.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}isPending(e){return this.balls.get().find(t=>t.id===e)?.pending===!0}groupLabelByBallId=new k(()=>{const e=new Map,t=this.groups();return t.length<2||t.forEach((n,i)=>{for(const r of n.ballIds)e.set(r,`Group ${i+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}selectedSlotDefId(){const e=this.round.get()?.formatSlots??[];if(e.length===0)return null;const t=this.selectedSlot.get();return t!==null&&e.some(n=>n.slotDefId===t)?t:e[0]?.slotDefId??null}selectSlot(e){this.selectedSlot.set(e)}presentedSlot(e){const t=this.selectedSlotDefId();return e.slots.find(n=>n.slotDefId===t)??e.slots[0]}effectivePlayingHandicap(e){const t=this.presentedSlot(e);return t?.handicapDerivation?.effectivePh??t?.playingHandicap??null}slotStandingFor(e){const t=this.selectedSlotDefId(),n=this.result.get()?.slots.find(r=>r.slotDefId===t);if(!n)return null;const i=r=>r.includes(e.id)||r.some(d=>n.subjectLabels?.some(o=>o.ballId===d&&o.memberBallIds.includes(e.id))??!1);for(const r of n.leaderboard){if(r.kind==="ranked"){const d=r.entries.find(o=>i(o.ballIds));if(!d)continue;return d.total===null?null:d.paceDelta!==void 0?{kind:"pace",delta:r.direction==="high"?-d.paceDelta:d.paceDelta}:{kind:"total",total:d.total}}if(r.kind==="match_summary"){const d=r.matches.find(u=>i(u.sideA.ballIds)||i(u.sideB.ballIds));if(!d)continue;if(d.thru===0&&!d.finished)return null;const o=i(d.sideA.ballIds)?"a":"b";if(d.leader===null||d.magnitude===0)return{kind:"match",text:"AS",tone:"even"};const c=d.leader===o;return{kind:"match",text:`${d.magnitude} ${c?"UP":"DN"}`,tone:c?"under":"over"}}}return null}groups(){return this.round.get()?.playingGroups??[]}group(){const e=this.groups();return e[this.groupIdx.get()]??e[0]??null}playedOrder(){return this.group()?.playedOrder??[]}holeIndex(){return je(this.holeIdx.get(),this.playedOrder().length)}currentPlayedHole(){return this.playedOrder()[this.holeIndex()]??null}playHoleById(e){return this.round.get()?.playHoles.find(t=>t.id===e)??null}currentPlayHole(){const e=this.currentPlayedHole();return e?this.playHoleById(e.playHoleId):null}parFor(e){return(e?this.playHoleById(e)?.par:null)??4}occLabel(e){const t=this.round.get(),n=t?.playHoles.find(d=>d.id===e);if(!t||!n)return"";const i=t.playHoles.filter(d=>d.courseHoleNumber===n.courseHoleNumber).sort((d,o)=>d.ordinal-o.ordinal);if(i.length===1)return`${n.courseHoleNumber}`;const r=i.findIndex(d=>d.id===e);return`${n.courseHoleNumber} (${Xl[r]??`${r+1}th`})`}canPrevHole(){return this.holeIndex()>0}canNextHole(){return this.holeIndex()<this.playedOrder().length-1}prevHole(){this.holeIdx.set(je(this.holeIndex()-1,this.playedOrder().length))}nextHole(){this.holeIdx.set(je(this.holeIndex()+1,this.playedOrder().length))}firstIncompleteHoleIndex(){const e=this.group();if(!e)return 0;const t=this.balls.get().filter(r=>e.ballIds.includes(r.id)&&!r.pending);if(t.length===0)return 0;const n=new Map(this.scorecards.get().map(r=>[r.ballId,r])),i=e.playedOrder.findIndex(r=>t.some(d=>{const o=n.get(d.id)?.holes.find(c=>c.playHoleId===r.playHoleId);return o?.strokes===null||o===void 0}));return i===-1?0:i}strokesFor(e,t){const n=this.cells.get().get(Ee(e,t));return n?n.strokes:this.scorecards.get().find(d=>d.ballId===e)?.holes.find(d=>d.playHoleId===t)?.strokes??null}statusFor(e,t){return this.cells.get().get(Ee(e,t))?.status??null}strokesHintFor(e,t){const n=this.round.get();if(!n)return null;const i=this.balls.get().find(u=>u.id===e);if(!i||i.pending)return null;const r=this.effectivePlayingHandicap(i);if(r==null)return null;const d=this.playHoleById(t);if(!d)return null;const o=i.players[0]?.teeName??null,c=d.tees.find(u=>u.teeName===o)?.strokeIndex??d.baseStrokeIndex;return xl(r,c,n.routeSi.allocationCycleSize)}statSubject(e){if(e.pending||e.players.length!==1)return null;const t=e.players[0];return!t||t.pending||t.playerId===null?null:this.statModules.get().has(t.playerId)?t.playerId:null}statPrompts(){return this.statRev.get(),this.statStep?.prompts??[]}statValue(e){return this.statRev.get(),this.statStep?.value(e)??null}statStepperValue(e,t){return this.statRev.get(),this.statStep?.intValue(e)??t}statIsAnswered(e){return this.statRev.get(),this.statStep?.isAnswered(e)===!0}answerStat(e,t){this.statStep&&(this.statStep.answer(e,t),this.bumpStatRev())}stepStat(e,t){this.statStep&&(this.statStep.step(e,t),this.bumpStatRev())}seedStatStep(e){const t=this.statCell;if(e!==null&&t!==null&&e.playerId===t.playerId&&e.playHoleId===t.playHoleId){this.refreshStatStep();return}this.closeStatStep(),this.setStatCell(e,e?this.makeStatStep(e):null)}refreshStatStep(){const e=this.statCell;if(!e){this.statStep!==null&&this.setStatCell(null,null);return}const t=this.statModules.get().get(e.playerId);if(!this.statStep||!t){this.setStatCell(e,this.makeStatStep(e));return}this.statStep.refresh(t,this.persistedStats(e),this.strokesForCell(e))&&this.bumpStatRev()}strokesForCell(e){const t=this.balls.get().find(n=>this.statSubject(n)===e.playerId);return t?this.strokesFor(t.id,e.playHoleId):null}statGirState(){return this.statRev.get(),this.statStep?Fs(this.statStep):{state:"idle"}}setStatCell(e,t){const n=t===null?null:e;this.statCell===n&&this.statStep===t||(this.statCell=n,this.statStep=t,this.bumpStatRev())}bumpStatRev(){this.statRev.set(++this.statRevN)}makeStatStep(e){const t=this.statModules.get().get(e.playerId),n=this.playHoleById(e.playHoleId);if(!t||!n)return null;const i=new Ll(t,n.par,n.courseHoleNumber,this.persistedStats(e));return i.setScore(this.strokesForCell(e)),i}persistedStats(e){const t=this.statRows.get().find(i=>i.playHoleId===e.playHoleId&&i.playerId===e.playerId),n=t?Jl(t):new Map;for(const i of xe){const r=_s(e,i);if(!this.statLocal.has(r))continue;const d=this.statLocal.get(r)??null;d===null?n.delete(i):n.set(i,d)}return n}closeStatStep(){return this.statStep?.materialiseDerivedGir()&&this.bumpStatRev(),this.flushStats()}flushStats(){const e=this.statCell,t=this.statStep,n=this.token;if(!e||!t||!n)return!1;const i=t.batch;if(i.length===0)return!1;t.commitDraft(),this.bumpStatRev();for(const r of i)this.writeStatLocal(e,r.key,r.value);return this.statQueue.enqueueBatch(n,e.playHoleId,e.playerId,i),this.postStats(n),!0}writeStatLocal(e,t,n){const i=_s(e,t);this.statLocal.set(i,n),this.statConfirmedAt.delete(i)}confirmStatLocals(e){for(const t of e){const n=_s({playerId:t.playerId,playHoleId:t.playHoleId},t.key);this.statConfirmedAt.set(n,this.loadSeq)}}dropConfirmedStatLocals(e){for(const[t,n]of[...this.statConfirmedAt])e<=n||(this.statLocal.delete(t),this.statConfirmedAt.delete(t))}async flushPendingStats(){const e=this.token;if(e){for(const t of this.statQueue.entriesFor(e))this.writeStatLocal({playerId:t.playerId,playHoleId:t.playHoleId},t.key,t.value);await this.postStats(e)}}async postStats(e){if(!this.statPosting){this.statPosting=!0;try{for(;;){const t=this.statQueue.entriesFor(e);if(t.length===0)return;const n=await this.sendStatEvents(e,t);if(n==="later")return;if(n==="ok"||t.length===1){this.settleStatEvents(t);continue}for(const i of t){if(await this.sendStatEvents(e,[i])==="later")return;this.settleStatEvents([i])}}}finally{this.statPosting=!1}}}async sendStatEvents(e,t){try{return await y.playerStats.appendEvents({token:e,items:t.map(n=>({playHoleId:n.playHoleId,playerId:n.playerId,key:n.key,value:n.value,clientEventId:n.clientEventId}))}),"ok"}catch(n){return Zl(n)?"refused":"later"}}settleStatEvents(e){this.statQueue.ack(e.map(t=>t.clientEventId)),this.confirmStatLocals(e)}metadataFor(e,t,n){const i=this.cells.get().get(Ee(e,t));return i&&i.metadata!==void 0?i.metadata?.[n]:this.scorecards.get().find(o=>o.ballId===e)?.holes.find(o=>o.playHoleId===t)?.metadata?.[n]}metadataInputs(){const e=U.get(Ue),t=this.round.get()?.formatSlots??[],n=[],i=new Set;for(const r of t){const d=e.byId(r.formatId)?.requirements.scoreEntry?.metadata??[];for(const o of d)i.has(o.key)||(i.add(o.key),n.push(o))}return n}metadataInputsForHole(e){return e?this.metadataInputs().filter(t=>Ql(t.appliesWhen,e.par,e.courseHoleNumber)):[]}async setScore(e,t,n,i){const r=Ee(e,t),d=crypto.randomUUID();this.patchCell(r,{strokes:n,metadata:i,status:"saving",clientEventId:d});const o=this.token;o&&(this.enqueue(o,e,t,n,i,d),await this.post(o,e,t,n,i,d))}async retry(e,t){const n=Ee(e,t),i=this.cells.get().get(n);if(!i)return;this.patchCell(n,{...i,status:"saving"});const r=this.token;r&&(this.enqueue(r,e,t,i.strokes,i.metadata,i.clientEventId),await this.post(r,e,t,i.strokes,i.metadata,i.clientEventId))}async flushPending(){const e=this.token;if(!(!e||this.flushing)){this.flushing=!0;try{for(const t of this.queue.entriesFor(e)){if(e!==this.token)return;this.patchCell(Ee(t.ballId,t.playHoleId),{strokes:t.strokes,metadata:t.metadata,status:"saving",clientEventId:t.clientEventId}),await this.post(e,t.ballId,t.playHoleId,t.strokes,t.metadata,t.clientEventId)}}finally{this.flushing=!1}}}enqueue(e,t,n,i,r,d){this.queue.enqueue({token:e,ballId:t,playHoleId:n,strokes:i,eventType:i===null?"score_cleared":"score_entered",clientEventId:d,...r!==void 0?{metadata:r}:{},queuedAt:Date.now()})}async post(e,t,n,i,r,d){const o=Ee(t,n);try{await y.friendlyRounds.score({token:e,ballId:t,playHoleId:n,strokes:i,eventType:i===null?"score_cleared":"score_entered",clientEventId:d,...r!=null?{metadata:r}:{}}),this.queue.remove(d);const c=this.cells.get().get(o);c&&c.clientEventId===d&&this.patchCell(o,{...c,status:"saved"});const u=this.round.get();e===this.token&&u&&u.status==="not_started"&&this.round.set({...u,status:"active"})}catch{const c=this.cells.get().get(o);c&&c.clientEventId===d&&this.patchCell(o,{...c,status:"error"})}}patchCell(e,t){const n=new Map(this.cells.get());n.set(e,t),this.cells.set(n)}resetForNewToken(e){this.resultSeq++,this.resultCursor=null,this.friendlyRound.set(null),this.round.set(null),this.startList.set(null),this.balls.set([]),this.scorecards.set([]),this.cells.set(new Map),this.result.set(null),this.resultError.set(null),this.holeIdx.set(e?.holeIdx??0),this.groupIdx.set(e?.groupIdx??0),this.keypadOpen.set(!1),this.finishFlowOpen.set(!1),this.statModules.set(new Map),this.statRows.set([]),this.statLocal.clear(),this.statConfirmedAt.clear(),this.statStep=null,this.statCell=null,this.bumpStatRev();const t=e?.selectedSlot;this.pendingSlotIndex=null,typeof t=="string"?this.selectedSlot.set(t):typeof t=="number"?(this.pendingSlotIndex=t,this.selectedSlot.set(null)):this.selectedSlot.set(null)}}class cr{roundId=new f(null);view=new f(null);balls=new f([]);loading=new f(!1);error=new f(null);unavailable=new f(null);loaded=!1;setRound(e){this.roundId.get()!==e&&(this.roundId.set(e),this.reset())}async load(e=!1){const t=this.roundId.get();if(t&&!(!e&&(this.loaded||this.loading.get()))){this.loading.set(!0),this.error.set(null);try{const n=await y.spectate.round({roundId:t});if(this.roundId.get()!==t)return;this.view.set(n),this.loaded=!0,this.unavailable.set(null),await this.loadBalls(t)}catch(n){if(this.roundId.get()!==t)return;const i=ar(n);i?(this.unavailable.set(i),this.view.set(null),this.balls.set([]),this.loaded=!1):this.error.set(et(n,"Couldn't load this round."))}finally{this.roundId.get()===t&&this.loading.set(!1)}}}async loadBalls(e){try{const t=await y.rounds.balls({roundId:e});this.roundId.get()===e&&this.balls.set(t)}catch{}}ballNameById=new k(()=>{const e=new Map;for(const t of this.balls.get())e.set(t.id,nn(t));for(const t of this.view.get()?.result.slots??[])for(const n of t.subjectLabels??[])e.set(n.ballId,n.label);return e});nameOf(e){return this.ballNameById.get().get(e)??e}groupLabelByBallId=new k(()=>{const e=new Map,t=this.view.get()?.round.playingGroups??[];return t.length<2||t.forEach((n,i)=>{for(const r of n.ballIds)e.set(r,`Group ${i+1}`)}),e});groupLabelOf(e){return this.groupLabelByBallId.get().get(e)??null}clear(){this.roundId.set(null),this.reset()}reset(){this.view.set(null),this.balls.set([]),this.loaded=!1,this.loading.set(!1),this.error.set(null),this.unavailable.set(null)}}class ur{roles=new f([]);rolesPromise=null;loading=new f(!1);error=new f(null);stats=new f(null);rounds=new f([]);players=new f([]);isSuperAdmin(){return this.roles.get().some(e=>e.role==="super_admin"&&e.scopeType===null)}loadRoles(e=!1){return!e&&this.rolesPromise?this.rolesPromise:(this.rolesPromise=(async()=>{try{this.roles.set(await y.admin.myRoles())}catch{this.roles.set([])}})(),this.rolesPromise)}clear(){this.roles.set([]),this.rolesPromise=null,this.stats.set(null),this.rounds.set([]),this.players.set([]),this.error.set(null)}async load(e=!1){if(!e&&this.stats.get()!==null)return;const t=await F(this.loading,this.error,()=>Promise.all([y.admin.adminStats(),y.admin.adminRounds({limit:100}),y.admin.adminPlayers()]));if(!t)return;const[n,i,r]=t;this.stats.set(n),this.rounds.set(i),this.players.set(r)}}const ed=["last5","last10","last20","thisYear","all","custom"];function zt(s){switch(s){case"last5":return"Last 5 rounds";case"last10":return"Last 10 rounds";case"last20":return"Last 20 rounds";case"thisYear":return"This year";case"all":return"All rounds";case"custom":return"Custom"}}function td(s){switch(s){case"last5":return"Your five most recent rounds with stats";case"last10":return"Enough rounds for percentages to settle";case"last20":return"A season's worth of form";case"thisYear":return"Every round dated this calendar year";case"all":return"Everything you have ever recorded";case"custom":return"Pick dates, courses and rounds by hand"}}function rn(s){switch(s){case"last5":return 5;case"last10":return 10;case"last20":return 20;default:return null}}const it={from:null,to:null,courseIds:[],venueTypes:[],roundTypes:[],excludedRoundIds:[]};function sd(s){return s.from===null&&s.to===null&&s.courseIds.length===0&&s.venueTypes.length===0&&s.roundTypes.length===0&&s.excludedRoundIds.length===0}function nd(s,e){return!(s.from!==null&&e.date<s.from||s.to!==null&&e.date>s.to||s.courseIds.length>0&&!s.courseIds.includes(e.courseId)||s.venueTypes.length>0&&!s.venueTypes.includes(e.venueType)||s.roundTypes.length>0&&!s.roundTypes.includes(e.roundType)||s.excludedRoundIds.includes(e.roundId))}function ys(s,e,t){const n=s[e],i=n.includes(t)?n.filter(r=>r!==t):[...n,t];return{...s,[e]:i}}function id(s,e,t){const n=s.excludedRoundIds.includes(e);return t===!n?s:{...s,excludedRoundIds:t?s.excludedRoundIds.filter(i=>i!==e):[...s.excludedRoundIds,e]}}function ts(s){return[...s].sort((e,t)=>e.date===t.date?e.roundId>t.roundId?-1:e.roundId<t.roundId?1:0:e.date>t.date?-1:1)}function hr(s){return`${s.getFullYear()}-`}function pr(s,e,t,n){const i=ts(t);switch(s){case"last5":case"last10":case"last20":{const r=rn(s);return r===null?i:i.slice(0,r)}case"thisYear":{const r=hr(n);return i.filter(d=>d.date.startsWith(r))}case"all":return i;case"custom":return i.filter(r=>nd(e,r))}}function fr(s){const{preset:e,filter:t,loaded:n,hasMore:i,now:r}=s;if(!i)return!1;switch(e){case"last5":case"last10":case"last20":{const d=rn(e);return d===null?!1:n.length<d}case"thisYear":{const d=`${hr(r)}01-01`;return!n.some(o=>o.date<d)}case"all":return!0;case"custom":{if(sd(t))return!1;if(t.from===null)return!0;const d=t.from;return!n.some(o=>o.date<d)}}}const rd="Unnamed course";function ad(s){const e=new Map,t=new Map;for(const n of s)e.set(n.courseId,(e.get(n.courseId)??0)+1),!t.has(n.courseId)&&n.courseName&&t.set(n.courseId,n.courseName);return[...e.keys()].map(n=>({id:n,name:t.get(n)??rd,roundCount:e.get(n)??0})).sort((n,i)=>{const r=n.name.localeCompare(i.name,void 0,{sensitivity:"base"});return r!==0?r:n.id<i.id?-1:n.id>i.id?1:0})}const Lt="last10";function od(s){return ed.includes(s)}const mr=We("tapscore.stats.window.v1",{decode:s=>od(s)?s:Lt,encode:s=>s,empty:Lt});function Gs(s=X()){return mr.read(s)}function Fn(s,e=X()){mr.write(s,e)}function x(s,e){return{value:e===0?null:s/e,n:s,d:e}}const ld=5;function dd(s,e=ld){return s.d===0?"absent":s.d>=e?"percentage":"fraction"}const Bt=Object.freeze({teeRecorded:0,fairwayHits:0,inPlayHits:0,troubleCount:0,teeMissRecorded:0,teeMissLeft:0,teeMissRight:0,teeTroubleLeft:0,teeTroubleRight:0,girRecorded:0,girHits:0,greenMissRecorded:0,greenMissLong:0,greenMissShort:0,greenMissLeft:0,greenMissRight:0,firstPuttRecorded:0,firstPuttInside1m:0,firstPutt1To2m:0,firstPutt2To4m:0,firstPutt4To8m:0,firstPuttOver8m:0,firstPuttInside1mResolved:0,firstPutt1To2mResolved:0,firstPutt2To4mResolved:0,firstPutt4To8mResolved:0,firstPuttOver8mResolved:0,onePuttInside1m:0,onePutt1To2m:0,onePutt2To4m:0,onePutt4To8m:0,onePuttOver8m:0,puttsRecorded:0,puttsTotal:0,threePutts:0,threePuttsFromOver8m:0,scrambleAttemptsStandard:0,scrambleSuccessesStandard:0,scrambleAttemptsHard:0,scrambleSuccessesHard:0,scrambleFirstPuttStandard:0,scrambleInside2mStandard:0,scrambleFirstPuttHard:0,scrambleInside2mHard:0,scrambleHoledStandard:0,scrambleHoledHard:0,scrambleAttemptsBunker:0,scrambleSuccessesBunker:0,scrambleFirstPuttBunker:0,scrambleInside2mBunker:0,scrambleHoledBunker:0,shortGameStrokesRecorded:0,shortGameStrokesEffective:0,shortGameStrokesEffectiveStandard:0,shortGameStrokesEffectiveHard:0,shortGameStrokesEffectiveBunker:0,holesMultiChip:0,holesMultiChipBunker:0,penaltiesRecorded:0,penaltiesTotal:0,recoveryAttempts:0,recoverySuccesses:0,penaltySourceRecorded:0,penaltiesTee:0,penaltiesApproach:0,penaltiesShort:0,holesScored:0,strokesTotal:0,parTotal:0,holesScoredPar3:0,strokesPar3:0,holesScoredPar4:0,strokesPar4:0,holesScoredPar5:0,strokesPar5:0,holesEagleOrBetter:0,holesBirdie:0,holesPar:0,holesBogey:0,doubleBogeyPlus:0,girHolesScored:0,birdiesOnGir:0,bounceBackOpportunities:0,bounceBackSuccesses:0,holesScoredFairway:0,strokesVsParFairway:0,holesScoredInPlay:0,strokesVsParInPlay:0,holesScoredTrouble:0,strokesVsParTrouble:0,girRecordedFairway:0,girHitsFairway:0,girRecordedInPlay:0,girHitsInPlay:0,girRecordedTrouble:0,girHitsTrouble:0,girFirstPuttRecorded:0,girFirstPuttInside1m:0,girFirstPutt1To2m:0,girFirstPutt2To4m:0,girFirstPutt4To8m:0,girFirstPuttOver8m:0,puttsRecordedGir:0,puttsTotalGir:0,puttsTotalInside1mResolved:0,puttsTotal1To2mResolved:0,puttsTotal2To4mResolved:0,puttsTotal4To8mResolved:0,puttsTotalOver8mResolved:0,strokesVsParGirHit:0,holesScoredGirMiss:0,strokesVsParGirMiss:0,girRecordedPar3:0,girHitsPar3:0,girRecordedPar4:0,girHitsPar4:0,girRecordedPar5:0,girHitsPar5:0,holesZeroPutt:0,holesOnePutt:0,holesTwoPutt:0,puttsRecordedPar3:0,puttsTotalPar3:0,puttsRecordedPar4:0,puttsTotalPar4:0,puttsRecordedPar5:0,puttsTotalPar5:0,holesWithPenalty:0,holesScoredPenalty:0,strokesVsParPenalty:0,holesScoredPenaltyFree:0,strokesVsParPenaltyFree:0,teeRecordedPar4:0,fairwayHitsPar4:0,inPlayHitsPar4:0,troubleCountPar4:0,teeRecordedPar5:0,fairwayHitsPar5:0,inPlayHitsPar5:0,troubleCountPar5:0,attHolesPar3Gir:0,attHolesPar3Miss:0,attHolesPar45Gir:0,attHolesPar45Miss:0,attStrokes:0,attPutts:0,attPenalties:0,attFairwayPar4:0,attInPlayPar4:0,attTroublePar4:0,attFairwayPar5:0,attInPlayPar5:0,attTroublePar5:0,attGirFirstPuttInside1m:0,attGirFirstPutt1To2m:0,attGirFirstPutt2To4m:0,attGirFirstPutt4To8m:0,attGirFirstPuttOver8m:0,attGirHoled:0,attMissStandard:0,attMissHard:0,attChipInside2mStandard:0,attChipOutside2mStandard:0,attChipHoledStandard:0,attChipInside2mHard:0,attChipOutside2mHard:0,attChipHoledHard:0,attMissBunker:0,attChipInside2mBunker:0,attChipOutside2mBunker:0,attChipHoledBunker:0,attSgStrokesEffectiveStandard:0,attSgStrokesEffectiveHard:0,attSgStrokesEffectiveBunker:0});function cd(s,e){return{teeRecorded:s.teeRecorded+e.teeRecorded,fairwayHits:s.fairwayHits+e.fairwayHits,inPlayHits:s.inPlayHits+e.inPlayHits,troubleCount:s.troubleCount+e.troubleCount,teeMissRecorded:s.teeMissRecorded+e.teeMissRecorded,teeMissLeft:s.teeMissLeft+e.teeMissLeft,teeMissRight:s.teeMissRight+e.teeMissRight,teeTroubleLeft:s.teeTroubleLeft+e.teeTroubleLeft,teeTroubleRight:s.teeTroubleRight+e.teeTroubleRight,girRecorded:s.girRecorded+e.girRecorded,girHits:s.girHits+e.girHits,greenMissRecorded:s.greenMissRecorded+e.greenMissRecorded,greenMissLong:s.greenMissLong+e.greenMissLong,greenMissShort:s.greenMissShort+e.greenMissShort,greenMissLeft:s.greenMissLeft+e.greenMissLeft,greenMissRight:s.greenMissRight+e.greenMissRight,firstPuttRecorded:s.firstPuttRecorded+e.firstPuttRecorded,firstPuttInside1m:s.firstPuttInside1m+e.firstPuttInside1m,firstPutt1To2m:s.firstPutt1To2m+e.firstPutt1To2m,firstPutt2To4m:s.firstPutt2To4m+e.firstPutt2To4m,firstPutt4To8m:s.firstPutt4To8m+e.firstPutt4To8m,firstPuttOver8m:s.firstPuttOver8m+e.firstPuttOver8m,firstPuttInside1mResolved:s.firstPuttInside1mResolved+e.firstPuttInside1mResolved,firstPutt1To2mResolved:s.firstPutt1To2mResolved+e.firstPutt1To2mResolved,firstPutt2To4mResolved:s.firstPutt2To4mResolved+e.firstPutt2To4mResolved,firstPutt4To8mResolved:s.firstPutt4To8mResolved+e.firstPutt4To8mResolved,firstPuttOver8mResolved:s.firstPuttOver8mResolved+e.firstPuttOver8mResolved,onePuttInside1m:s.onePuttInside1m+e.onePuttInside1m,onePutt1To2m:s.onePutt1To2m+e.onePutt1To2m,onePutt2To4m:s.onePutt2To4m+e.onePutt2To4m,onePutt4To8m:s.onePutt4To8m+e.onePutt4To8m,onePuttOver8m:s.onePuttOver8m+e.onePuttOver8m,puttsRecorded:s.puttsRecorded+e.puttsRecorded,puttsTotal:s.puttsTotal+e.puttsTotal,threePutts:s.threePutts+e.threePutts,threePuttsFromOver8m:s.threePuttsFromOver8m+e.threePuttsFromOver8m,scrambleAttemptsStandard:s.scrambleAttemptsStandard+e.scrambleAttemptsStandard,scrambleSuccessesStandard:s.scrambleSuccessesStandard+e.scrambleSuccessesStandard,scrambleAttemptsHard:s.scrambleAttemptsHard+e.scrambleAttemptsHard,scrambleSuccessesHard:s.scrambleSuccessesHard+e.scrambleSuccessesHard,scrambleFirstPuttStandard:s.scrambleFirstPuttStandard+e.scrambleFirstPuttStandard,scrambleInside2mStandard:s.scrambleInside2mStandard+e.scrambleInside2mStandard,scrambleFirstPuttHard:s.scrambleFirstPuttHard+e.scrambleFirstPuttHard,scrambleInside2mHard:s.scrambleInside2mHard+e.scrambleInside2mHard,scrambleHoledStandard:s.scrambleHoledStandard+e.scrambleHoledStandard,scrambleHoledHard:s.scrambleHoledHard+e.scrambleHoledHard,scrambleAttemptsBunker:s.scrambleAttemptsBunker+e.scrambleAttemptsBunker,scrambleSuccessesBunker:s.scrambleSuccessesBunker+e.scrambleSuccessesBunker,scrambleFirstPuttBunker:s.scrambleFirstPuttBunker+e.scrambleFirstPuttBunker,scrambleInside2mBunker:s.scrambleInside2mBunker+e.scrambleInside2mBunker,scrambleHoledBunker:s.scrambleHoledBunker+e.scrambleHoledBunker,shortGameStrokesRecorded:s.shortGameStrokesRecorded+e.shortGameStrokesRecorded,shortGameStrokesEffective:s.shortGameStrokesEffective+e.shortGameStrokesEffective,shortGameStrokesEffectiveStandard:s.shortGameStrokesEffectiveStandard+e.shortGameStrokesEffectiveStandard,shortGameStrokesEffectiveHard:s.shortGameStrokesEffectiveHard+e.shortGameStrokesEffectiveHard,shortGameStrokesEffectiveBunker:s.shortGameStrokesEffectiveBunker+e.shortGameStrokesEffectiveBunker,holesMultiChip:s.holesMultiChip+e.holesMultiChip,holesMultiChipBunker:s.holesMultiChipBunker+e.holesMultiChipBunker,penaltiesRecorded:s.penaltiesRecorded+e.penaltiesRecorded,penaltiesTotal:s.penaltiesTotal+e.penaltiesTotal,recoveryAttempts:s.recoveryAttempts+e.recoveryAttempts,recoverySuccesses:s.recoverySuccesses+e.recoverySuccesses,penaltySourceRecorded:s.penaltySourceRecorded+e.penaltySourceRecorded,penaltiesTee:s.penaltiesTee+e.penaltiesTee,penaltiesApproach:s.penaltiesApproach+e.penaltiesApproach,penaltiesShort:s.penaltiesShort+e.penaltiesShort,holesScored:s.holesScored+e.holesScored,strokesTotal:s.strokesTotal+e.strokesTotal,parTotal:s.parTotal+e.parTotal,holesScoredPar3:s.holesScoredPar3+e.holesScoredPar3,strokesPar3:s.strokesPar3+e.strokesPar3,holesScoredPar4:s.holesScoredPar4+e.holesScoredPar4,strokesPar4:s.strokesPar4+e.strokesPar4,holesScoredPar5:s.holesScoredPar5+e.holesScoredPar5,strokesPar5:s.strokesPar5+e.strokesPar5,holesEagleOrBetter:s.holesEagleOrBetter+e.holesEagleOrBetter,holesBirdie:s.holesBirdie+e.holesBirdie,holesPar:s.holesPar+e.holesPar,holesBogey:s.holesBogey+e.holesBogey,doubleBogeyPlus:s.doubleBogeyPlus+e.doubleBogeyPlus,girHolesScored:s.girHolesScored+e.girHolesScored,birdiesOnGir:s.birdiesOnGir+e.birdiesOnGir,bounceBackOpportunities:s.bounceBackOpportunities+e.bounceBackOpportunities,bounceBackSuccesses:s.bounceBackSuccesses+e.bounceBackSuccesses,holesScoredFairway:s.holesScoredFairway+e.holesScoredFairway,strokesVsParFairway:s.strokesVsParFairway+e.strokesVsParFairway,holesScoredInPlay:s.holesScoredInPlay+e.holesScoredInPlay,strokesVsParInPlay:s.strokesVsParInPlay+e.strokesVsParInPlay,holesScoredTrouble:s.holesScoredTrouble+e.holesScoredTrouble,strokesVsParTrouble:s.strokesVsParTrouble+e.strokesVsParTrouble,girRecordedFairway:s.girRecordedFairway+e.girRecordedFairway,girHitsFairway:s.girHitsFairway+e.girHitsFairway,girRecordedInPlay:s.girRecordedInPlay+e.girRecordedInPlay,girHitsInPlay:s.girHitsInPlay+e.girHitsInPlay,girRecordedTrouble:s.girRecordedTrouble+e.girRecordedTrouble,girHitsTrouble:s.girHitsTrouble+e.girHitsTrouble,girFirstPuttRecorded:s.girFirstPuttRecorded+e.girFirstPuttRecorded,girFirstPuttInside1m:s.girFirstPuttInside1m+e.girFirstPuttInside1m,girFirstPutt1To2m:s.girFirstPutt1To2m+e.girFirstPutt1To2m,girFirstPutt2To4m:s.girFirstPutt2To4m+e.girFirstPutt2To4m,girFirstPutt4To8m:s.girFirstPutt4To8m+e.girFirstPutt4To8m,girFirstPuttOver8m:s.girFirstPuttOver8m+e.girFirstPuttOver8m,puttsRecordedGir:s.puttsRecordedGir+e.puttsRecordedGir,puttsTotalGir:s.puttsTotalGir+e.puttsTotalGir,puttsTotalInside1mResolved:s.puttsTotalInside1mResolved+e.puttsTotalInside1mResolved,puttsTotal1To2mResolved:s.puttsTotal1To2mResolved+e.puttsTotal1To2mResolved,puttsTotal2To4mResolved:s.puttsTotal2To4mResolved+e.puttsTotal2To4mResolved,puttsTotal4To8mResolved:s.puttsTotal4To8mResolved+e.puttsTotal4To8mResolved,puttsTotalOver8mResolved:s.puttsTotalOver8mResolved+e.puttsTotalOver8mResolved,strokesVsParGirHit:s.strokesVsParGirHit+e.strokesVsParGirHit,holesScoredGirMiss:s.holesScoredGirMiss+e.holesScoredGirMiss,strokesVsParGirMiss:s.strokesVsParGirMiss+e.strokesVsParGirMiss,girRecordedPar3:s.girRecordedPar3+e.girRecordedPar3,girHitsPar3:s.girHitsPar3+e.girHitsPar3,girRecordedPar4:s.girRecordedPar4+e.girRecordedPar4,girHitsPar4:s.girHitsPar4+e.girHitsPar4,girRecordedPar5:s.girRecordedPar5+e.girRecordedPar5,girHitsPar5:s.girHitsPar5+e.girHitsPar5,holesZeroPutt:s.holesZeroPutt+e.holesZeroPutt,holesOnePutt:s.holesOnePutt+e.holesOnePutt,holesTwoPutt:s.holesTwoPutt+e.holesTwoPutt,puttsRecordedPar3:s.puttsRecordedPar3+e.puttsRecordedPar3,puttsTotalPar3:s.puttsTotalPar3+e.puttsTotalPar3,puttsRecordedPar4:s.puttsRecordedPar4+e.puttsRecordedPar4,puttsTotalPar4:s.puttsTotalPar4+e.puttsTotalPar4,puttsRecordedPar5:s.puttsRecordedPar5+e.puttsRecordedPar5,puttsTotalPar5:s.puttsTotalPar5+e.puttsTotalPar5,holesWithPenalty:s.holesWithPenalty+e.holesWithPenalty,holesScoredPenalty:s.holesScoredPenalty+e.holesScoredPenalty,strokesVsParPenalty:s.strokesVsParPenalty+e.strokesVsParPenalty,holesScoredPenaltyFree:s.holesScoredPenaltyFree+e.holesScoredPenaltyFree,strokesVsParPenaltyFree:s.strokesVsParPenaltyFree+e.strokesVsParPenaltyFree,teeRecordedPar4:s.teeRecordedPar4+e.teeRecordedPar4,fairwayHitsPar4:s.fairwayHitsPar4+e.fairwayHitsPar4,inPlayHitsPar4:s.inPlayHitsPar4+e.inPlayHitsPar4,troubleCountPar4:s.troubleCountPar4+e.troubleCountPar4,teeRecordedPar5:s.teeRecordedPar5+e.teeRecordedPar5,fairwayHitsPar5:s.fairwayHitsPar5+e.fairwayHitsPar5,inPlayHitsPar5:s.inPlayHitsPar5+e.inPlayHitsPar5,troubleCountPar5:s.troubleCountPar5+e.troubleCountPar5,attHolesPar3Gir:s.attHolesPar3Gir+e.attHolesPar3Gir,attHolesPar3Miss:s.attHolesPar3Miss+e.attHolesPar3Miss,attHolesPar45Gir:s.attHolesPar45Gir+e.attHolesPar45Gir,attHolesPar45Miss:s.attHolesPar45Miss+e.attHolesPar45Miss,attStrokes:s.attStrokes+e.attStrokes,attPutts:s.attPutts+e.attPutts,attPenalties:s.attPenalties+e.attPenalties,attFairwayPar4:s.attFairwayPar4+e.attFairwayPar4,attInPlayPar4:s.attInPlayPar4+e.attInPlayPar4,attTroublePar4:s.attTroublePar4+e.attTroublePar4,attFairwayPar5:s.attFairwayPar5+e.attFairwayPar5,attInPlayPar5:s.attInPlayPar5+e.attInPlayPar5,attTroublePar5:s.attTroublePar5+e.attTroublePar5,attGirFirstPuttInside1m:s.attGirFirstPuttInside1m+e.attGirFirstPuttInside1m,attGirFirstPutt1To2m:s.attGirFirstPutt1To2m+e.attGirFirstPutt1To2m,attGirFirstPutt2To4m:s.attGirFirstPutt2To4m+e.attGirFirstPutt2To4m,attGirFirstPutt4To8m:s.attGirFirstPutt4To8m+e.attGirFirstPutt4To8m,attGirFirstPuttOver8m:s.attGirFirstPuttOver8m+e.attGirFirstPuttOver8m,attGirHoled:s.attGirHoled+e.attGirHoled,attMissStandard:s.attMissStandard+e.attMissStandard,attMissHard:s.attMissHard+e.attMissHard,attChipInside2mStandard:s.attChipInside2mStandard+e.attChipInside2mStandard,attChipOutside2mStandard:s.attChipOutside2mStandard+e.attChipOutside2mStandard,attChipHoledStandard:s.attChipHoledStandard+e.attChipHoledStandard,attChipInside2mHard:s.attChipInside2mHard+e.attChipInside2mHard,attChipOutside2mHard:s.attChipOutside2mHard+e.attChipOutside2mHard,attChipHoledHard:s.attChipHoledHard+e.attChipHoledHard,attMissBunker:s.attMissBunker+e.attMissBunker,attChipInside2mBunker:s.attChipInside2mBunker+e.attChipInside2mBunker,attChipOutside2mBunker:s.attChipOutside2mBunker+e.attChipOutside2mBunker,attChipHoledBunker:s.attChipHoledBunker+e.attChipHoledBunker,attSgStrokesEffectiveStandard:s.attSgStrokesEffectiveStandard+e.attSgStrokesEffectiveStandard,attSgStrokesEffectiveHard:s.attSgStrokesEffectiveHard+e.attSgStrokesEffectiveHard,attSgStrokesEffectiveBunker:s.attSgStrokesEffectiveBunker+e.attSgStrokesEffectiveBunker}}function ud(s){let e=Bt;for(const t of s)e=cd(e,t);return e}const ze=["inside_1m","1_to_2m","2_to_4m","4_to_8m","over_8m"];function ss(s,e){switch(e){case"inside_1m":return s.firstPuttInside1mResolved;case"1_to_2m":return s.firstPutt1To2mResolved;case"2_to_4m":return s.firstPutt2To4mResolved;case"4_to_8m":return s.firstPutt4To8mResolved;case"over_8m":return s.firstPuttOver8mResolved}}function hd(s,e){switch(e){case"inside_1m":return s.puttsTotalInside1mResolved;case"1_to_2m":return s.puttsTotal1To2mResolved;case"2_to_4m":return s.puttsTotal2To4mResolved;case"4_to_8m":return s.puttsTotal4To8mResolved;case"over_8m":return s.puttsTotalOver8mResolved}}function pd(s,e){switch(e){case"inside_1m":return s.onePuttInside1m;case"1_to_2m":return s.onePutt1To2m;case"2_to_4m":return s.onePutt2To4m;case"4_to_8m":return s.onePutt4To8m;case"over_8m":return s.onePuttOver8m}}function fd(s,e){switch(e){case"inside_1m":return s.girFirstPuttInside1m;case"1_to_2m":return s.girFirstPutt1To2m;case"2_to_4m":return s.girFirstPutt2To4m;case"4_to_8m":return s.girFirstPutt4To8m;case"over_8m":return s.girFirstPuttOver8m}}function gr(s){return x(s.fairwayHits,s.teeRecorded)}function md(s){return x(s.troubleCount,s.teeRecorded)}function gd(s){return x(s.holesScoredPenalty,s.holesScored)}function bd(s){return{penalty:x(s.strokesVsParPenalty,s.holesScoredPenalty),clean:x(s.strokesVsParPenaltyFree,s.holesScoredPenaltyFree)}}function _d(s){const e=s.strokesVsParPenalty*s.holesScoredPenaltyFree-s.strokesVsParPenaltyFree*s.holesScoredPenalty;return x(e,s.holesScoredPenalty*s.holesScoredPenaltyFree)}function yd(s){return x(s.recoverySuccesses,s.recoveryAttempts)}function vd(s,e){return x(s.penaltiesTotal,e)}function wd(s){return{fairway:x(s.strokesVsParFairway,s.holesScoredFairway),inPlay:x(s.strokesVsParInPlay,s.holesScoredInPlay),trouble:x(s.strokesVsParTrouble,s.holesScoredTrouble)}}function xd(s){const e=s.strokesVsParTrouble*s.holesScoredFairway-s.strokesVsParFairway*s.holesScoredTrouble;return x(e,s.holesScoredTrouble*s.holesScoredFairway)}function br(s){return x(s.girHits,s.girRecorded)}function $d(s){return{fairway:x(s.girHitsFairway,s.girRecordedFairway),inPlay:x(s.girHitsInPlay,s.girRecordedInPlay),trouble:x(s.girHitsTrouble,s.girRecordedTrouble)}}function kd(s){return{par3:x(s.girHitsPar3,s.girRecordedPar3),par4:x(s.girHitsPar4,s.girRecordedPar4),par5:x(s.girHitsPar5,s.girRecordedPar5)}}function Sd(s){const e=x(s.strokesVsParGirHit,s.girHolesScored),t=x(s.strokesVsParGirMiss,s.holesScoredGirMiss),n=s.strokesVsParGirMiss*s.girHolesScored-s.strokesVsParGirHit*s.holesScoredGirMiss;return{hit:e,miss:t,delta:x(n,s.holesScoredGirMiss*s.girHolesScored)}}function Td(s,e){return x(fd(s,e),s.girFirstPuttRecorded)}function Pd(s){let e=0;for(const t of ze)e+=ss(s,t);return e}function Cd(s,e){return x(ss(s,e),Pd(s))}function Id(s){return x(s.birdiesOnGir,s.girHolesScored)}function Ed(s){return x(s.scrambleAttemptsHard,s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker)}function Rd(s){const e=s.greenMissRecorded;return{long:x(s.greenMissLong,e),short:x(s.greenMissShort,e),left:x(s.greenMissLeft,e),right:x(s.greenMissRight,e)}}function Nd(s){return{left:x(s.teeMissLeft,s.teeMissRecorded),right:x(s.teeMissRight,s.teeMissRecorded),troubleLeft:x(s.teeTroubleLeft,s.teeMissLeft),troubleRight:x(s.teeTroubleRight,s.teeMissRight)}}function Od(s){const e=s.penaltySourceRecorded;return{tee:x(s.penaltiesTee,e),approach:x(s.penaltiesApproach,e),short:x(s.penaltiesShort,e)}}function Hd(s,e){return x(pd(s,e),ss(s,e))}function Md(s){return x(s.threePutts,s.puttsRecorded)}function Ad(s){const e=s.puttsRecorded;return{zero:x(s.holesZeroPutt,e),one:x(s.holesOnePutt,e),two:x(s.holesTwoPutt,e),threePlus:x(s.threePutts,e)}}function zd(s){return{par3:x(s.puttsTotalPar3,s.puttsRecordedPar3),par4:x(s.puttsTotalPar4,s.puttsRecordedPar4),par5:x(s.puttsTotalPar5,s.puttsRecordedPar5)}}function Ld(s){return x(s.threePuttsFromOver8m,s.firstPuttOver8mResolved)}function Bd(s){return x(s.puttsTotalGir,s.puttsRecordedGir)}function Fd(s){const e=Math.max(0,s.puttsTotal-s.puttsTotalGir),t=Math.max(0,s.puttsRecorded-s.puttsRecordedGir);return x(e,t)}function _r(s){return{standard:x(s.scrambleSuccessesStandard,s.scrambleAttemptsStandard),hard:x(s.scrambleSuccessesHard,s.scrambleAttemptsHard),bunker:x(s.scrambleSuccessesBunker,s.scrambleAttemptsBunker),overall:x(s.scrambleSuccessesStandard+s.scrambleSuccessesHard+s.scrambleSuccessesBunker,s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker)}}function Gd(s){return x(s.scrambleSuccessesBunker,s.scrambleAttemptsBunker)}function jd(s){return x(s.holesMultiChip,s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker)}function Dd(s){return x(s.holesMultiChipBunker,s.scrambleAttemptsBunker)}function qd(s){return s.shortGameStrokesEffective-(s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker)}function Vd(s){return{standard:x(s.scrambleInside2mStandard,s.scrambleFirstPuttStandard),hard:x(s.scrambleInside2mHard,s.scrambleFirstPuttHard),bunker:x(s.scrambleInside2mBunker,s.scrambleFirstPuttBunker),overall:x(s.scrambleInside2mStandard+s.scrambleInside2mHard+s.scrambleInside2mBunker,s.scrambleFirstPuttStandard+s.scrambleFirstPuttHard+s.scrambleFirstPuttBunker)}}function Ud(s){return{par3:x(s.strokesPar3-3*s.holesScoredPar3,s.holesScoredPar3),par4:x(s.strokesPar4-4*s.holesScoredPar4,s.holesScoredPar4),par5:x(s.strokesPar5-5*s.holesScoredPar5,s.holesScoredPar5)}}function Kd(s,e){return x(s.doubleBogeyPlus,e)}function Wd(s){return x(s.bounceBackSuccesses,s.bounceBackOpportunities)}const Yd=["eagleOrBetter","birdie","par","bogey","doubleBogeyPlus"],Xd=18;function Qd(s){let e=0,t=0,n=0;const i={eagleOrBetter:0,birdie:0,par:0,bogey:0,doubleBogeyPlus:0},r=new Map;for(const c of s){const u=c.measures;t+=u.holesScored,i.eagleOrBetter+=u.holesEagleOrBetter,i.birdie+=u.holesBirdie,i.par+=u.holesPar,i.bogey+=u.holesBogey,i.doubleBogeyPlus+=u.doubleBogeyPlus,u.holesScored>0&&(e+=1,n+=u.strokesTotal-u.parTotal);let p=r.get(c.holeCount);if(p||(p={holeCount:c.holeCount,rounds:0,completeRounds:0,best:null},r.set(c.holeCount,p)),p.rounds+=1,!(c.holeCount>0&&u.holesScored===c.holeCount))continue;p.completeRounds+=1;const h=u.strokesTotal-u.parTotal;(p.best===null||h<p.best.vsPar)&&(p.best={vsPar:h,strokes:u.strokesTotal})}const d=[...r.values()].sort((c,u)=>u.holeCount-c.holeCount);let o=0;for(const c of d)o+=c.rounds*c.holeCount;return{rounds:s.length,scoredRounds:e,holesScored:t,holesExpected:o,lengths:d,avgVsParPer18:x(n*Xd,t),scoreTypeCounts:i}}const yr=Object.freeze({inside_1m:1.05,"1_to_2m":1.45,"2_to_4m":1.85,"4_to_8m":2.1,over_8m:2.4}),vr=Object.freeze({inside2m:1.25,outside2m:2.12}),wr=Object.freeze({standard:1.7,hard:2.1,bunker:1.95}),xr=Object.freeze({version:"v1-provisional",calibratedAt:null,eHole:Object.freeze({3:3.6,4:4.7,5:5.5}),eAfterTee:Object.freeze({4:Object.freeze({fairway:3.45,in_play:3.8,trouble:4.35}),5:Object.freeze({fairway:4.25,in_play:4.6,trouble:5.15})}),rowCounts:Object.freeze({eHole:Object.freeze({3:0,4:0,5:0}),eAfterTee:Object.freeze({4:Object.freeze({fairway:0,in_play:0,trouble:0}),5:Object.freeze({fairway:0,in_play:0,trouble:0})})})}),Jd=["scratch","hcp5","hcp12","hcp20"];function an(s){return s===null?"hcp12":s<2.5?"scratch":s<8.5?"hcp5":s<16?"hcp12":"hcp20"}function Zd(s){return Math.round(4*s.eHole[3]+10*s.eHole[4]+4*s.eHole[5])}const ec=Object.freeze({version:"v1-provisional-scratch",calibratedAt:null,eHole:Object.freeze({3:3.25,4:4.15,5:4.85}),eAfterTee:Object.freeze({4:Object.freeze({fairway:2.95,in_play:3.25,trouble:3.7}),5:Object.freeze({fairway:3.65,in_play:3.95,trouble:4.4})}),rowCounts:Object.freeze({eHole:Object.freeze({3:0,4:0,5:0}),eAfterTee:Object.freeze({4:Object.freeze({fairway:0,in_play:0,trouble:0}),5:Object.freeze({fairway:0,in_play:0,trouble:0})})})}),tc=Object.freeze({version:"v1-provisional-hcp5",calibratedAt:null,eHole:Object.freeze({3:3.4,4:4.45,5:5.1}),eAfterTee:Object.freeze({4:Object.freeze({fairway:3.2,in_play:3.6,trouble:4.05}),5:Object.freeze({fairway:3.9,in_play:4.25,trouble:4.55})}),rowCounts:Object.freeze({eHole:Object.freeze({3:0,4:0,5:0}),eAfterTee:Object.freeze({4:Object.freeze({fairway:0,in_play:0,trouble:0}),5:Object.freeze({fairway:0,in_play:0,trouble:0})})})}),sc=Object.freeze({version:"v1-provisional-hcp20",calibratedAt:null,eHole:Object.freeze({3:3.9,4:5.1,5:5.9}),eAfterTee:Object.freeze({4:Object.freeze({fairway:3.85,in_play:4.2,trouble:4.85}),5:Object.freeze({fairway:4.65,in_play:5,trouble:5.65})}),rowCounts:Object.freeze({eHole:Object.freeze({3:0,4:0,5:0}),eAfterTee:Object.freeze({4:Object.freeze({fairway:0,in_play:0,trouble:0}),5:Object.freeze({fairway:0,in_play:0,trouble:0})})})}),nc=Object.freeze({inside_1m:1.02,"1_to_2m":1.35,"2_to_4m":1.72,"4_to_8m":1.95,over_8m:2.2}),ic=Object.freeze({inside_1m:1.03,"1_to_2m":1.4,"2_to_4m":1.78,"4_to_8m":2.02,over_8m:2.3}),rc=Object.freeze({inside_1m:1.08,"1_to_2m":1.5,"2_to_4m":1.92,"4_to_8m":2.2,over_8m:2.55}),ac=Object.freeze({inside2m:1.19,outside2m:1.96}),oc=Object.freeze({inside2m:1.22,outside2m:2.03}),lc=Object.freeze({inside2m:1.29,outside2m:2.22}),dc=Object.freeze({standard:1.55,hard:1.9,bunker:1.75}),cc=Object.freeze({standard:1.62,hard:2,bunker:1.85}),uc=Object.freeze({standard:1.8,hard:2.25,bunker:2.08}),ft=Object.freeze({scratch:Object.freeze({tables:ec,expected:nc,chipOutcome:ac,chipBaseline:dc}),hcp5:Object.freeze({tables:tc,expected:ic,chipOutcome:oc,chipBaseline:cc}),hcp12:Object.freeze({tables:xr,expected:yr,chipOutcome:vr,chipBaseline:wr}),hcp20:Object.freeze({tables:sc,expected:rc,chipOutcome:lc,chipBaseline:uc})}),mt=ft.hcp12,ue=["tee","approach","shortGame","putting","penalties"];function $r(s,e=xr,t=yr,n=vr,i=wr){const r=s.attHolesPar3Gir+s.attHolesPar3Miss,d=s.attFairwayPar4+s.attInPlayPar4+s.attTroublePar4,o=s.attFairwayPar5+s.attInPlayPar5+s.attTroublePar5,c=r+d+o,u={attributed:c,holesScored:s.holesScored};if(c===0)return{tee:null,approach:null,shortGame:null,putting:null,penalties:null,total:null,coverage:u};const p=d+o,m=s.attSgStrokesEffectiveStandard+s.attSgStrokesEffectiveHard+s.attSgStrokesEffectiveBunker,h=s.attMissStandard+s.attMissHard+s.attMissBunker,g=r*e.eHole[3]+d*e.eHole[4]+o*e.eHole[5],w=s.attFairwayPar4*e.eAfterTee[4].fairway+s.attInPlayPar4*e.eAfterTee[4].in_play+s.attTroublePar4*e.eAfterTee[4].trouble+s.attFairwayPar5*e.eAfterTee[5].fairway+s.attInPlayPar5*e.eAfterTee[5].in_play+s.attTroublePar5*e.eAfterTee[5].trouble+r*e.eHole[3],T=s.attGirFirstPuttInside1m*t.inside_1m+s.attGirFirstPutt1To2m*t["1_to_2m"]+s.attGirFirstPutt2To4m*t["2_to_4m"]+s.attGirFirstPutt4To8m*t["4_to_8m"]+s.attGirFirstPuttOver8m*t.over_8m,N=(s.attChipInside2mStandard+s.attChipInside2mHard+s.attChipInside2mBunker)*n.inside2m+(s.attChipOutside2mStandard+s.attChipOutside2mHard+s.attChipOutside2mBunker)*n.outside2m,z=s.attMissStandard*i.standard+s.attMissHard*i.hard+s.attMissBunker*i.bunker,V=s.attMissStandard*(1+i.standard)+s.attMissHard*(1+i.hard)+s.attMissBunker*(1+i.bunker),O=s.attFairwayPar4*(1+e.eAfterTee[4].fairway-e.eHole[4])+s.attInPlayPar4*(1+e.eAfterTee[4].in_play-e.eHole[4])+s.attTroublePar4*(1+e.eAfterTee[4].trouble-e.eHole[4])+s.attFairwayPar5*(1+e.eAfterTee[5].fairway-e.eHole[5])+s.attInPlayPar5*(1+e.eAfterTee[5].in_play-e.eHole[5])+s.attTroublePar5*(1+e.eAfterTee[5].trouble-e.eHole[5]),J=s.attStrokes-s.attPutts-s.attPenalties-p-m+T+V-w,de=m-h+N-z,ce=s.attPutts-(T+N),la=s.attPenalties,da=s.attStrokes-g;return{tee:O,approach:J,shortGame:de,putting:ce,penalties:la,total:da,coverage:u}}function Ft(s,e=mt){return $r(s,e.tables,e.expected,e.chipOutcome,e.chipBaseline)}const kr=9;function Se(s,e){return Sr(s,Ke(s,e))}function Gn(s){return Sr(s,s.total)}function Sr(s,e){return e===null||s.coverage.attributed<kr?null:e*18/s.coverage.attributed}function Ke(s,e){switch(e){case"tee":return s.tee;case"approach":return s.approach;case"shortGame":return s.shortGame;case"putting":return s.putting;case"penalties":return s.penalties}}function Tr(s,e){const t=n=>jn(Se(s,n),e.map(i=>Se(i,n)));return{tee:t("tee"),approach:t("approach"),shortGame:t("shortGame"),putting:t("putting"),penalties:t("penalties"),total:jn(Gn(s),e.map(Gn))}}function on(s,e){switch(e){case"tee":return s.tee;case"approach":return s.approach;case"shortGame":return s.shortGame;case"putting":return s.putting;case"penalties":return s.penalties}}function ln(s){let e=0,t=0;for(const n of s)n!==null&&(e+=n,t+=1);return t===0?null:e/t}function jn(s,e){if(s===null)return null;const t=ln(e);return t===null?null:s-t}function hc(s){return s.penalties}const Dn=1,pc=2,fc=.75,mc=4,gc=3,bc=12,_c=5,yc=2,vc=10,qn=.35;function wc(s,e,t,n){const i=Tr(e,t),r=[];let d=0;const o=(T,N)=>{r.push({line:T,magnitude:N,order:d++})};let c=null,u=null;for(const T of ue){const N=on(i,T);N!==null&&((c===null||N<c.delta)&&(c={component:T,delta:N}),(u===null||N>u.delta)&&(u={component:T,delta:N}))}c!==null&&c.delta<=-Dn&&o({id:"component_best_vs_baseline",params:{component:c.component,delta:c.delta}},Math.abs(c.delta)),u!==null&&u.delta>=Dn&&o({id:"component_worst_vs_baseline",params:{component:u.component,delta:u.delta}},Math.abs(u.delta));const p=ln(t.map(hc)),m=e.penalties;p!==null&&m!==null&&m>=p+pc&&o({id:"penalties_spike",params:{penalties:m,baseline:p}},0),s.teeMissRecorded>=vc&&s.teeMissLeft>=qn*s.teeMissRecorded&&s.teeMissRight>=qn*s.teeMissRecorded&&o({id:"two_way_miss",params:{left:s.teeMissLeft,right:s.teeMissRight,recorded:s.teeMissRecorded}},0),s.scrambleAttemptsHard>=gc&&s.scrambleSuccessesHard===s.scrambleAttemptsHard&&o({id:"hard_scramble_streak",params:{successes:s.scrambleSuccessesHard,attempts:s.scrambleAttemptsHard}},0);const h=s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker,g=s.scrambleSuccessesStandard+s.scrambleSuccessesHard+s.scrambleSuccessesBunker;h>=mc&&g>=fc*h&&o({id:"scramble_streak",params:{successes:g,attempts:h}},0),s.threePutts===0&&s.puttsTotal>=bc&&o({id:"three_putt_free",params:{putts:s.puttsTotal,holes:s.puttsRecorded}},0);const v=Se(e,"putting"),w=t.map(T=>Se(T,"putting")).filter(T=>T!==null);return v!==null&&w.length>=_c&&w.every(T=>v<T)&&o({id:"best_putting_round",params:{putting:v,rounds:w.length}},0),s.bounceBackOpportunities>=yc&&s.bounceBackSuccesses===s.bounceBackOpportunities&&o({id:"bounce_back_perfect",params:{opportunities:s.bounceBackOpportunities,successes:s.bounceBackSuccesses}},0),r.sort((T,N)=>N.magnitude-T.magnitude||T.order-N.order),r.slice(0,Math.max(0,n)).map(T=>T.line)}const Pr=["auto",...Jd],js="auto";function lt(s){switch(s){case"scratch":return"Scratch";case"hcp5":return"5 handicap";case"hcp12":return"12 handicap";case"hcp20":return"20+ handicap"}}function Vn(s){return s==="auto"?"Match my handicap":lt(s)}function xc(s,e){return s!=="auto"?`About ${Zd(ft[s].tables)} shots on a par 72.`:e===null?`No handicap on your profile yet, so this uses the ${lt("hcp12")} reference.`:`Your ${dn(e)} handicap puts you on the ${lt(an(e))} reference.`}function dn(s){return s<0?`+${(-s).toFixed(1)}`:s.toFixed(1)}function cn(s,e){return s==="auto"?an(e):s}const $c=Object.freeze({cohort:an(null),choice:js,handicapIndex:null});function kc(s,e){return{cohort:cn(s,e),choice:s,handicapIndex:e}}function Sc(s){return Pr.includes(s)}const Cr=We("tapscore.stats.sgBaseline.v1",{decode:s=>Sc(s)?s:js,encode:s=>s,empty:js});function Ds(s=X()){return Cr.read(s)}function Tc(s,e=X()){Cr.write(s,e)}const Un=Object.freeze(Object.keys(Bt));function Pc(s){if(typeof s!="object"||s===null)return[...Un];const e=s;return Un.filter(t=>typeof e[t]!="number")}function Gt(s){if(s.length===0)return null;const e=Pc(s[0].measures);if(e.length===0)return null;const t=e.slice(0,3).join(", "),n=e.length>3?` and ${e.length-3} more`:"";return`The server sent stats this app does not understand (missing ${t}${n}).`}const Cc=["tee","approach","putting","shortGame","scoring"];function vs(s){switch(s){case"tee":return"Off the tee";case"approach":return"Approach";case"putting":return"Putting";case"shortGame":return"Short game";case"scoring":return"Scoring"}}const Ic=3,Ir={rounds:[],totals:Bt,waterfall:$r(Bt),priorities:[],trends:[],tee:null,approach:null,putting:null,shortGame:null,scoring:null,results:null};function un(s,e=mt){const t=ts(s);if(t.length===0)return Ir;const n=ud(t.map(d=>d.measures)),i=t.map(d=>Ft(d.measures,e)),r=t.length;return{rounds:t.map((d,o)=>{const c=i[o];return{id:d.roundId,date:d.date,courseName:d.courseName,name:d.name,holeCount:d.holeCount,strokes:d.measures.holesScored===0?null:d.measures.strokesTotal,vsPar:d.measures.holesScored===0?null:d.measures.strokesTotal-d.measures.parTotal,waterfall:c}}),totals:n,waterfall:Ft(n,e),priorities:Ec(i),trends:Rc(t,e),tee:Nc(n,r),approach:Oc(n),putting:Hc(n,e),shortGame:Mc(n),scoring:Ac(n,r),results:Qd(t)}}function Ec(s){const e=ue.map(n=>{const i=s.map(r=>Se(r,n));return{component:n,per18:ln(i),roundsCovered:i.filter(r=>r!==null).length,roundsInWindow:s.length}}),t=n=>ue.indexOf(n);return e.sort((n,i)=>n.per18!==null&&i.per18!==null?n.per18===i.per18?t(n.component)-t(i.component):i.per18-n.per18:n.per18!==null?-1:i.per18!==null?1:t(n.component)-t(i.component))}function ws(s){return dd(s)==="percentage"?s.value:null}function Rc(s,e=mt){const t=[...s].reverse(),n=(i,r,d,o)=>{const c=[];for(const u of t){const p=o(u.measures);p!==null&&c.push(p)}return c.length>=Ic?{id:i,title:r,kind:d,points:c}:null};return[n("fairway","Fairways","percentage",i=>ws(gr(i))),n("gir","Greens","percentage",i=>ws(br(i))),n("putting","Putting","strokesLost",i=>Se(Ft(i,e),"putting")),n("scramble","Scrambling","percentage",i=>ws(_r(i).overall))].filter(i=>i!==null)}function Nc(s,e){return s.teeRecorded<=0?null:{fairway:gr(s),inPlayOnly:x(s.inPlayHits-s.fairwayHits,s.teeRecorded),trouble:md(s),troubleTax:xd(s),vsParByTee:wd(s),recovery:yd(s),teeMiss:Nd(s),teeMissRecorded:s.teeMissRecorded,teeFan:{leftInPlay:Math.max(0,s.teeMissLeft-s.teeTroubleLeft),leftTrouble:s.teeTroubleLeft,fairway:s.fairwayHits,rightInPlay:Math.max(0,s.teeMissRight-s.teeTroubleRight),rightTrouble:s.teeTroubleRight},teeRecorded:s.teeRecorded,penaltiesPerRound:vd(s,e),penaltiesRecordedHoles:s.penaltiesRecorded,penaltyHoleShare:gd(s),penaltyTax:_d(s),vsParByPenalty:bd(s),penaltySource:Od(s),penaltySourceRecorded:s.penaltySourceRecorded,penaltiesTee:s.penaltiesTee,penaltiesApproach:s.penaltiesApproach,penaltiesShort:s.penaltiesShort}}function Oc(s){if(s.girRecorded<=0)return null;const e={};for(const t of ze)e[t]=Td(s,t);return{gir:br(s),girByTee:$d(s),girFirstPuttMix:e,birdieConversion:Id(s),hardChipShare:Ed(s),girByPar:kd(s),greenMiss:Rd(s),greenMissRecorded:s.greenMissRecorded,greenMissCounts:{long:s.greenMissLong,short:s.greenMissShort,left:s.greenMissLeft,right:s.greenMissRight},costOfMissedGreen:Sd(s)}}function Hc(s,e){if(s.puttsRecorded<=0&&s.firstPuttRecorded<=0)return null;const t={};for(const n of ze)t[n]=Cd(s,n);return{ladder:ze.map(n=>{const i=ss(s,n),r=e.expected[n];return{bucket:n,made:Hd(s,n),baseline:Math.max(0,2-r),cost:i>0?hd(s,n)-i*r:null}}),firstPuttSpread:t,threePutt:Md(s),threePuttsFromOver8m:Ld(s),puttsPerGirHole:Bd(s),puttsAfterMissedGreen:Fd(s),puttDistribution:Ad(s),puttsPerHoleByPar:zd(s)}}function Mc(s){if(s.scrambleAttemptsStandard+s.scrambleAttemptsHard+s.scrambleAttemptsBunker<=0)return null;const t=s.onePuttInside1m+s.onePutt1To2m,n=s.firstPuttInside1mResolved+s.firstPutt1To2mResolved;return{scramble:_r(s),chipInside2m:Vd(s),conversionInside2m:x(t,n),chipIns:{standard:s.scrambleHoledStandard,hard:s.scrambleHoledHard,bunker:s.scrambleHoledBunker,overall:s.scrambleHoledStandard+s.scrambleHoledHard+s.scrambleHoledBunker},sandSave:Gd(s),scrambleAttemptsBunker:s.scrambleAttemptsBunker,multiChip:jd(s),multiChipBunker:Dd(s),extraShortGameStrokes:qd(s),shortGameStrokesRecorded:s.shortGameStrokesRecorded}}function Ac(s,e){return s.holesScored<=0?null:{avgVsParByParGroup:Ud(s),doubleBogeyPlusPerRound:Kd(s,e),bounceBack:Wd(s)}}function Er(s){let e=0;for(const t of s)for(const n of ue){const i=Ke(t,n);i!==null&&(e=Math.max(e,Math.abs(i)))}return e}function zc(s){let e=0;for(const t of s)t.per18!==null&&(e=Math.max(e,Math.abs(t.per18)));return e}function hn(s){const e=U.get(Ue);return e.load(),e.labelOf(s.formatId)??`${s.scoringMode} · ${s.teamShape}`}function Lc(s){const e=U.get(Ue);return e.load(),e.labelOf(s)??s}function Bc(s){return s.map(e=>({key:e.round.id,token:e.token,roundId:e.round.id,name:e.round.name,courseName:e.round.courseNameSnapshot??"",status:e.round.status,completedAt:e.round.completedAt,lastActivityAt:e.round.lastActivityAt??e.round.date,holesPlayed:e.holesPlayed,roleLabel:bo(e)||null,created:e.created,played:e.played,date:e.round.date,formats:e.round.formatSlots.map(hn).join(" · ")}))}function Fc(s){return s.map(e=>({key:e.token,token:e.token,roundId:null,name:e.name??null,courseName:e.courseName,status:e.status,completedAt:e.completedAt??null,lastActivityAt:e.lastSeenAt,holesPlayed:null,roleLabel:null,created:!1,played:!1,date:e.date??null,formats:null}))}function dt(s){const e=(s.name??"").trim();return e||s.courseName||"Round"}function jt(s){return s.courseName?dt(s)===s.courseName?null:s.courseName:null}function Be(s,e=typeof navigator>"u"?"en":navigator.language){return s?/^\d{4}-\d{2}-\d{2}$/.test(s)?new Intl.DateTimeFormat(e,{dateStyle:"medium",timeZone:"UTC"}).format(new Date(`${s}T12:00:00Z`)):s:""}const rt={fromMyRounds:Bc,fromDeviceRounds:Fc},Rr="—";function he(s){return s.d<=0||s.value===null?null:`${Math.round(s.value*100)}%`}function Gc(s){return s.d<=0?null:`${ie(s.n)} of ${ie(s.d)}`}function xs(s){const e=he(s);if(e===null)return null;const t=Gc(s);return t===null?e:`${e} (${t})`}function ct(s,e=2,t=!1){return s.d<=0||s.value===null?null:t?we(s.value,e):Te(s.value,e)}function ns(s){return{one:s,many:`${s}s`}}const me=ns("round"),W=ns("hole"),De=ns("green");function jc(s,e){return s.d<=0?null:`over ${se(s.d,e)}`}function le(s,e){const t=ct(s,e.decimals??2,e.signed??!1);if(t===null)return null;const n=e.label?`${t} ${e.label}`:t,i=jc(s,e.unit);return i===null?n:`${n} (${i})`}const Dc={one:"hole from trouble",many:"holes from trouble"},qc={one:"from the fairway",many:"from the fairway"};function Vc(s){const e=s.trouble.d,t=s.fairway.d;return e<=0||t<=0?null:`over ${se(e,Dc)} vs ${se(t,qc)}`}function Nr(s,e,t,n){return s.d<=0||t.d<=0?null:`over ${se(s.d,e)} vs ${se(t.d,n)}`}const Uc={one:"hole with the green missed",many:"holes with the green missed"},Kc={one:"green hit",many:"greens hit"},Wc={one:"hole with a penalty",many:"holes with a penalty"},Yc={one:"without",many:"without"},Xc=ns("penalty hole");function Qc(s){return Nr(s.miss,Uc,s.hit,Kc)}function Jc(s){return Nr(s.penalty,Wc,s.clean,Yc)}function ie(s){return s===Math.round(s)?String(Math.round(s)):Te(s,1)}function se(s,e){return`${ie(s)} ${s===1?e.one:e.many}`}function Te(s,e=1){return s.toFixed(e)}function we(s,e=1){const t=10**e,n=Math.round(s*t)/t;if(n===0)return Te(0,e);const i=Te(Math.abs(n),e);return n>0?`+${i}`:`−${i}`}function Zc(s){return s===null?Rr:we(s,1)}function eu(s){return`${we(s)} per 18`}function is(s){return s===0?"E":we(s,s===Math.round(s)?0:1)}function rs(s){switch(s){case"tee":return"Tee";case"approach":return"Approach";case"shortGame":return"Short game";case"putting":return"Putting";case"penalties":return"Penalties"}}function $s(s){switch(s){case"inside_1m":return"Inside 1 m";case"1_to_2m":return"1–2 m";case"2_to_4m":return"2–4 m";case"4_to_8m":return"4–8 m";case"over_8m":return"Over 8 m"}}function tu(s){return s==="indoor"?"Indoor":"Outdoor"}function su(s){switch(s){case"full_18":return"18 holes";case"front_9":return"Front 9";case"back_9":return"Back 9";case"custom_holes":return"Custom holes"}}function Or(s){return Be(s)}const Hr="Statistics",nu="All statistics →";function iu(s){return s==="custom"?Lt:s}function ru(s,e,t){return rn(s)!==null||!t?zt(s):`${zt(s)} — newest ${e}`}function au(s){return x(s.strokesTotal-s.parTotal,s.holesScored)}function ou(s){const e=[],t=au(s.totals),n=ct(t,2,!0);n!==null&&e.push({id:"vsPar",value:n,label:"Vs par per hole"});const i=s.tee,r=i===null?null:he(i.fairway);r!==null&&e.push({id:"fairways",value:r,label:"Fairways hit"});const d=s.approach,o=d===null?null:he(d.gir);return o!==null&&e.push({id:"gir",value:o,label:"Greens in regulation"}),e}function lu(s){const e=s.priorities.find(t=>t.per18!==null);return!e||e.per18===null||e.per18<=0?null:`Costing you most: ${rs(e.component)}`}function du(s){const e=iu(s.preset),t=pr(e,it,s.rows,s.now);if(t.length===0)return null;const n=un(t,s.bundle??mt),i=ou(n);if(i.length===0)return null;const r=fr({preset:e,filter:it,loaded:s.rows,hasMore:s.hasMore,now:s.now});return{windowLabel:ru(e,t.length,r),tiles:i,priorityLine:lu(n)}}function cu(s){const e=s.tiles.map(n=>`${n.label} ${n.value}`),t=[`${Hr}, ${s.windowLabel}`,...e];return s.priorityLine!==null&&t.push(s.priorityLine),t.push("Opens your statistics"),t.join(". ")}class as{static PAGE_SIZE=20;rows=new f(null);hasMore=new f(!1);preset=new f(Gs());sgChoice=new f(Ds());profile=U.get(Ce);loaded=!1;loading=!1;card=new k(()=>{const e=this.rows.get();if(e===null)return null;const t=cn(this.sgChoice.get(),this.profile.player.get()?.handicapIndex??null);return du({rows:e,preset:this.preset.get(),hasMore:this.hasMore.get(),now:new Date,bundle:ft[t]})});refreshPreset(){this.preset.set(Gs()),this.sgChoice.set(Ds())}async load(e=!1){if(!(!e&&(this.loaded||this.loading))){this.loading=!0;try{const t=await y.playerStats.myStats({limit:as.PAGE_SIZE});if(Gt(t.rounds)!==null)return;this.rows.set(t.rounds),this.hasMore.set(t.nextCursor!==null),this.loaded=!0}catch(t){t instanceof Y&&t.status===401&&(this.rows.set(null),this.hasMore.set(!1),this.loaded=!0)}finally{this.loading=!1}}}clear(){this.rows.set(null),this.hasMore.set(!1),this.loaded=!1,this.loading=!1}}const vn=class vn extends M{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(C(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};vn.styles=`
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
    `;let qs=vn;const A=s=>`var(--${s})`,wn=class wn extends M{render(){const e=document.createElement("div"),t=(c,u)=>{typeof u=="function"?this.track(C(()=>{c.textContent=u()})):c.textContent=u};this.spawn(qs,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const n=document.createElement("h2");n.className="ui-confirm__title",t(n,this.props.title??"Confirm"),this.dialogEl.appendChild(n);const i=document.createElement("p");i.className="ui-confirm__message",t(i,this.props.message),this.dialogEl.appendChild(i);const r=document.createElement("div");r.className="ui-confirm__actions";const d=document.createElement("button");d.className="ui-confirm__btn ui-confirm__btn--cancel",t(d,this.props.cancelLabel??"Cancel"),d.addEventListener("click",c=>{c.stopPropagation(),this.handleCancel()}),r.appendChild(d);const o=document.createElement("button");return o.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(o,this.props.confirmLabel??"Confirm"),o.addEventListener("click",c=>{c.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),r.appendChild(o),this.dialogEl.appendChild(r),this.dialogEl.addEventListener("click",c=>c.stopPropagation()),e.appendChild(this.dialogEl),this.track(C(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};wn.styles=`
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
         */
        .ui-confirm__btn {
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
    `;let oe=wn;async function uu(s,e={}){e.everywhere?await s.auth.logoutEverywhere():await s.auth.logout(),s.profile.clear(),s.friends.clear(),s.activity.clear(),s.friendProfile.clear(),s.spectate.clear(),s.admins.clear(),s.homeStats.clear(),s.landing.clear(),s.navigate("/")}const hu="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";function Ie(s="avatar"){return`<span class="${s}">
            <img bind="avatarPhoto" class="avatar__photo" alt="" />
            <span bind="avatarInitials" class="avatar__initials"></span>
        </span>`}function ke(s){const e=()=>qo(s());return{avatarPhoto:{src:()=>e()??hu,className:()=>e()?"avatar__photo":"avatar__photo hidden"},avatarInitials:{textContent:()=>{const t=s();return Vo(t.displayName,t.username)},className:()=>e()?"avatar__initials hidden":"avatar__initials"}}}function Le(s,e="0.85rem"){return`
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
    `}function pu(s){if(!s.signedIn)return[];const e=[{kind:"identity",displayName:(s.displayName??"").trim()||(s.username??"").trim()||"Signed in",username:(s.username??"").trim()},{kind:"profile",label:"Profile"}];return s.isSuperAdmin&&e.push({kind:"admin",label:"Admin"}),e.push({kind:"signout",label:"Sign out"}),e.push({kind:"signout-all",label:"Sign out everywhere"}),e}function fu(s){return pu(s).map(e=>e.kind)}function Kn(s){return s.signedIn?"avatar":"signin"}const mu=b(`
    <div class="acct" bind="root">
        <button bind="signin" class="acct__signin" type="button">Sign in</button>
        <button bind="avatar" class="acct__avatar" type="button" aria-label="Account">
            ${Ie("acct__badge")}
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
`);class gu extends M{static styles=`
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
    `;auth=this.inject(D);profile=this.inject(Ce);friends=this.inject(Zt);activity=this.inject(en);friendProfile=this.inject(es);spectate=this.inject(cr);admins=this.inject(ur);homeStats=this.inject(as);landing=this.inject(Jt);router=this.inject(G);open=new f(!1);state=new k(()=>({signedIn:this.auth.currentUser.get()!==null,displayName:this.profile.player.get()?.displayName??null,username:this.profile.player.get()?.username??this.auth.currentUser.get()?.username??null,isSuperAdmin:this.admins.isSuperAdmin()}));signOutAllOpen=new f(!1);has(e){return fu(this.state.get()).includes(e)}rowClass(e,t=""){const n=`acct__row${t}`;return this.has(e)?n:`${n} hidden`}async signOut(e={}){await uu({auth:this.auth,profile:this.profile,friends:this.friends,activity:this.activity,friendProfile:this.friendProfile,spectate:this.spectate,admins:this.admins,homeStats:this.homeStats,landing:this.landing,navigate:t=>this.router.navigate(t)},e)}render(){this.auth.currentUser.get()&&(this.profile.load(),this.admins.loadRoles());const e=this.wire(mu,{signin:{className:()=>Kn(this.state.get())==="signin"?"acct__signin":"acct__signin hidden",onclick:()=>{this.open.set(!1),this.router.navigate("/login")}},...ke(()=>{const u=this.profile.player.get();return{id:u?.id??"",avatarVersion:u?.avatarVersion??null,displayName:this.state.get().displayName,username:this.state.get().username}}),avatar:{className:()=>Kn(this.state.get())==="avatar"?"acct__avatar":"acct__avatar hidden","aria-expanded":()=>this.open.get()?"true":"false",onclick:()=>this.open.set(!this.open.get())},menu:{className:()=>this.open.get()&&this.has("identity")?"acct__menu":"acct__menu hidden"},idName:()=>{const u=this.state.get();return(u.displayName??"").trim()||(u.username??"").trim()||"Signed in"},idUser:()=>{const u=(this.state.get().username??"").trim();return u===""?"":`@${u}`},profile:{className:()=>this.rowClass("profile"),onclick:()=>{this.open.set(!1),this.router.navigate("/profile")}},admin:{className:()=>this.rowClass("admin"),onclick:()=>{this.open.set(!1),this.router.navigate("/admin")}},signout:{className:()=>this.rowClass("signout"," acct__row--quiet"),onclick:()=>{this.open.set(!1),this.signOut()}},signoutAll:{className:()=>this.rowClass("signout-all"," acct__row--quiet"),onclick:()=>{this.open.set(!1),this.signOutAllOpen.set(!0)}}});this.spawn(oe,this.ref(e,"confirmHost"),{open:this.signOutAllOpen,title:"Sign out everywhere?",message:"Every device signed in to this account is signed out, including this one. Rounds and scores are untouched — you can sign back in with your password.",confirmLabel:"Sign out everywhere",cancelLabel:"Cancel",onconfirm:()=>{this.signOut({everywhere:!0})}});const t=this.ref(e,"root"),n=e.querySelector('[bind="avatar"]'),i=u=>{u.key==="Escape"&&this.open.get()&&(this.open.set(!1),n?.focus())},r=u=>{if(!this.open.get())return;const p=u.target;p instanceof Node&&t.contains(p)||this.open.set(!1)};let d=!1;const o=()=>{d||(d=!0,window.addEventListener("keydown",i),document.addEventListener("pointerdown",r,!0))},c=()=>{d&&(d=!1,window.removeEventListener("keydown",i),document.removeEventListener("pointerdown",r,!0))};return this.track(C(()=>{this.open.get()?o():c()})),this.track(c),e}}function qe(s){return s.token===null?null:s.created?"delete":s.played?"leave":null}function Mr(s){return s==="delete"?"Delete round":"Remove me from this round"}const bu=14,_u=1440*60*1e3;function Xe(s,e){return e(s)}function yu(s,e,t,n=bu){const i=e-n*_u,r=[],d=[];for(const o of s){const c=Xe(o,t);if(c.status==="complete"){const u=c.completedAt?Date.parse(c.completedAt):NaN;(Number.isNaN(u)||u>=i)&&d.push(o)}else r.push(o)}return r.sort((o,c)=>Wn(Xe(o,t).lastActivityAt,Xe(c,t).lastActivityAt)),d.sort((o,c)=>Wn(Xe(o,t).completedAt,Xe(c,t).completedAt)),{ongoing:r,finished:d}}function Wn(s,e){const t=s?Date.parse(s):NaN,n=e?Date.parse(e):NaN,i=Number.isNaN(t)?Number.NEGATIVE_INFINITY:t,r=Number.isNaN(n)?Number.NEGATIVE_INFINITY:n;return i===r?0:r-i}const vu=3,Ar=4;function ks(s){return s==null||!Number.isFinite(s)?null:`HCP ${dn(s)}`}function zr(s){return s>Ar}function wu(s){return s.rows===0||s.finished>0?!1:!zr(s.ongoing)}function xu(s){return s.rows===0}const $u=b(`
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
            ${Ie("landing__identity-badge")}
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
`),ku='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',pn=`
    <span bind="title" class="round-summary__title"></span>
    <span bind="course" class="round-summary__course"></span>
    <span class="round-summary__bottom">
        <span bind="date"></span>
        <span bind="progress" class="round-summary__progress"></span>
    </span>
    <span bind="formats" class="round-summary__formats"></span>
`,Su=b(`
    <div class="round-row">
        <button bind="row" type="button" class="round-summary round-row__main">${pn}</button>
        <div bind="actions" class="round-row__actions">
            <button bind="menuButton" type="button" class="round-row__menu-button" aria-label="Round actions" aria-haspopup="true" aria-expanded="false">${ku}</button>
            <div bind="menu" class="round-row__menu" role="group" aria-label="Round actions">
                <button bind="action" type="button" class="round-row__menu-action"></button>
            </div>
        </div>
    </div>
`),Tu=b(`
    <button bind="chip" type="button" class="outnow-chip">
        <span class="outnow-chip__badge-wrap">
            ${Ie("outnow-chip__badge")}
            <span class="outnow-chip__dot" aria-hidden="true"></span>
        </span>
        <span class="outnow-chip__text">
            <span bind="who" class="outnow-chip__who"></span>
            <span bind="line" class="outnow-chip__line"></span>
        </span>
    </button>
`),Pu=b(`
    <span class="stat-tile">
        <span bind="value" class="stat-tile__value"></span>
        <span bind="label" class="stat-tile__label"></span>
    </span>
`),Cu=b(`
    <button bind="row" type="button" class="round-summary recent-row">
        ${Ie("recent-row__avatar")}
        <span class="recent-row__content">${pn}</span>
    </button>
`);class Yn extends M{static styles=`
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
    `;svc=this.inject(Jt);profile=this.inject(Ce);activity=this.inject(en);homeStats=this.inject(as);auth=this.inject(D);router=this.inject(G);loggedIn=new k(()=>this.auth.currentUser.get()!==null);rows=new k(()=>this.loggedIn.get()?rt.fromMyRounds(this.svc.myRounds.get()):rt.fromDeviceRounds(this.svc.deviceRounds.get()));parts=new k(()=>yu(this.rows.get(),Date.now(),e=>e));ongoing=new k(()=>this.parts.get().ongoing);finished=new k(()=>this.parts.get().finished);ongoingShown=new k(()=>this.ongoing.get().slice(0,Ar));finishedShown=new k(()=>this.finished.get().slice(0,vu));counts=new k(()=>({rows:this.rows.get().length,ongoing:this.ongoing.get().length,finished:this.finished.get().length}));newRows=new k(()=>this.loggedIn.get()?rt.fromMyRounds(this.svc.newRounds.get()):[]);chips=new k(()=>this.loggedIn.get()?dl(this.activity.feed.get()?.live??[]):[]);recents=new k(()=>this.loggedIn.get()?fl(this.activity.feed.get()?.recent??[]):[]);statsCard=new k(()=>this.loggedIn.get()?this.homeStats.card.get():null);statsTiles=new k(()=>this.statsCard.get()?.tiles??[]);deleteOpen=new f(!1);leaveOpen=new f(!1);actionTarget=new f(null);actionError=new f("");openRoundMenu=new f(null);askAction(e,t,n,i){this.openRoundMenu.set(null),this.actionError.set(""),this.actionTarget.set({token:t,roundId:n,name:i,action:e}),e==="delete"?this.deleteOpen.set(!0):this.leaveOpen.set(!0)}render(){this.loggedIn.get()?(this.svc.loadMine(),this.profile.load(),this.activity.load(),this.homeStats.refreshPreset(),this.homeStats.load(!0)):this.svc.loadDevice();const e=this.wire($u,{head:{className:()=>this.loggedIn.get()?"landing__head hidden":"landing__head"},identity:{className:()=>this.loggedIn.get()?"landing__identity":"landing__identity hidden","aria-label":()=>{const r=this.identityName(),d=ks(this.profile.player.get()?.handicapIndex);return d?`${r}, ${d}`:r},onclick:()=>this.router.navigate("/profile")},...ke(()=>{const r=this.profile.player.get();return{id:r?.id??"",avatarVersion:r?.avatarVersion??null,displayName:r?.displayName??null,username:r?.username??this.auth.currentUser.get()?.username??null}}),identityName:()=>this.identityName(),identityHcp:{textContent:()=>ks(this.profile.player.get()?.handicapIndex)??"",className:()=>ks(this.profile.player.get()?.handicapIndex)===null?"landing__identity-hcp hidden":"landing__identity-hcp"},history:{className:()=>wu(this.counts.get())?"landing__history":"landing__history hidden",onclick:()=>this.router.navigate("/history")},outNowSection:{className:()=>this.chips.get().length>0?"landing__section-block landing__outnow":"landing__section-block landing__outnow hidden"},outNowContext:()=>ul(this.activity.feed.get()?.live??[])??"",recentlySection:{className:()=>this.recents.get().length>0?"landing__section-block landing__recently":"landing__section-block landing__recently hidden"},newSection:{className:()=>this.newRows.get().length>0?"landing__section-block landing__new":"landing__section-block landing__new hidden"},newCount:()=>{const r=this.newRows.get().length;return r===0?"":String(r)},ongoingSection:{className:()=>this.ongoing.get().length>0?"landing__section-block landing__ongoing":"landing__section-block landing__ongoing hidden"},ongoingCount:()=>{const r=this.ongoing.get().length;return r===0?"":String(r)},ongoingMore:{className:()=>zr(this.counts.get().ongoing)?"landing__ongoing-foot":"landing__ongoing-foot hidden","aria-label":()=>"Show all ongoing rounds",onclick:()=>this.router.navigate("/history")},finishedSection:{className:()=>this.finished.get().length>0?"landing__section-block landing__finished":"landing__section-block landing__finished hidden"},finishedCount:()=>{const r=this.finished.get().length;return r===0?"":String(r)},finishedAll:{"aria-label":()=>"All rounds",onclick:()=>this.router.navigate("/history")},stats:{className:()=>this.statsCard.get()===null?"landing__stats hidden":"landing__stats","aria-label":()=>{const r=this.statsCard.get();return r===null?"":cu(r)},onclick:()=>this.router.navigate("/stats")},statsWindow:()=>this.statsCard.get()?.windowLabel??"",statsPriority:{textContent:()=>this.statsCard.get()?.priorityLine??"",className:()=>this.statsCard.get()?.priorityLine?"landing__stats-priority":"landing__stats-priority hidden"},statsTitle:()=>Hr,statsFoot:()=>nu,empty:{className:()=>xu(this.counts.get())?"landing__empty":"landing__empty hidden"},actionError:{textContent:()=>this.actionError.get()}});this.$each(this.ref(e,"outNowList"),this.chips,(r,d,o)=>this.wireEl(Tu,{chip:{"aria-label":()=>cl(r),onclick:()=>this.router.navigate("/spectate",{query:{id:r.roundId,name:r.displayName}})},...ke(()=>{const c=this.chips.get().find(u=>u.roundId===r.roundId)??r;return{id:c.playerId,avatarVersion:c.avatarVersion,displayName:c.displayName}}),who:()=>r.title,line:()=>r.progress},o),r=>r.roundId),this.$each(this.ref(e,"recentlyList"),this.recents,(r,d,o)=>this.wireEl(Cu,{row:{onclick:()=>this.router.navigate("/spectate",{query:{id:r.roundId,name:r.displayName}})},...ke(()=>({id:r.playerId,avatarVersion:r.avatarVersion,displayName:r.displayName})),title:()=>r.friendLabel,course:{textContent:()=>r.title,className:()=>r.title?"round-summary__course":"round-summary__course hidden"},date:()=>Be(r.date),progress:{textContent:"",className:"round-summary__progress hidden"},formats:{textContent:()=>(r.formatIds??[]).map(Lc).join(" · "),className:()=>(r.formatIds??[]).length>0?"round-summary__formats":"round-summary__formats hidden"}},o),r=>r.roundId),this.$each(this.ref(e,"newList"),this.newRows,(r,d,o)=>this.roundRow(r,o),r=>r.key),this.$each(this.ref(e,"ongoingList"),this.ongoingShown,(r,d,o)=>this.roundRow(r,o,!0),r=>r.key),this.$each(this.ref(e,"finishedList"),this.finishedShown,(r,d,o)=>this.roundRow(r,o),r=>r.key),this.$each(this.ref(e,"statsTiles"),this.statsTiles,(r,d,o)=>this.wireEl(Pu,{value:()=>r.value,label:()=>r.label},o),r=>`${r.id}:${r.value}`),this.spawn(oe,this.ref(e,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const r=this.actionTarget.get();return`Delete ${r?`“${r.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const r=this.actionTarget.get();r&&this.svc.remove(r.token,r.roundId).then(d=>{d||this.actionError.set("Could not delete the round. Try again.")})}}),this.spawn(oe,this.ref(e,"confirmHost"),{open:this.leaveOpen,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const r=this.actionTarget.get();r&&this.svc.leave(r.token,r.roundId).then(d=>{d.ok||this.actionError.set(d.message)})}});const t=r=>{r.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1),r.key==="Escape"&&this.leaveOpen.get()&&this.leaveOpen.set(!1),r.key==="Escape"&&this.openRoundMenu.get()!==null&&this.openRoundMenu.set(null)};window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t));const n=this.ref(e,"root"),i=r=>{if(this.openRoundMenu.get()===null)return;const d=r.target;d instanceof Node&&n.contains(d)||this.openRoundMenu.set(null)};return document.addEventListener("pointerdown",i,!0),this.track(()=>document.removeEventListener("pointerdown",i,!0)),e}identityName(){const e=this.profile.player.get(),t=(e?.displayName??"").trim();if(t!=="")return t;const n=(e?.username??this.auth.currentUser.get()?.username??"").trim();return n===""?"Signed in":n}roundRow(e,t,n=!1){return this.wireEl(Su,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},title:()=>dt(e),course:{textContent:()=>jt(e)??"",className:()=>jt(e)?"round-summary__course":"round-summary__course hidden"},date:()=>Be(e.date),progress:{textContent:()=>n&&e.holesPlayed&&e.holesPlayed>0?`Thru ${e.holesPlayed}`:"",className:()=>n&&e.holesPlayed&&e.holesPlayed>0?"round-summary__progress":"round-summary__progress hidden"},formats:{textContent:()=>e.formats??"",className:()=>e.formats?"round-summary__formats":"round-summary__formats hidden"},actions:{className:()=>qe(e)===null?"round-row__actions hidden":"round-row__actions"},menuButton:{"aria-expanded":()=>this.openRoundMenu.get()===e.key?"true":"false",onclick:()=>this.openRoundMenu.set(this.openRoundMenu.get()===e.key?null:e.key)},menu:{className:()=>this.openRoundMenu.get()===e.key?"round-row__menu":"round-row__menu hidden"},action:{textContent:()=>{const i=qe(e);return i?Mr(i):""},onclick:()=>{const i=qe(e);!i||e.token===null||this.askAction(i,e.token,e.roundId??"",dt(e))}}},t)}}function Iu(s){return[...s].sort((e,t)=>{const n=Xn(e),i=Xn(t);return i!==n?i-n:e.key.localeCompare(t.key)})}function Xn(s){const e=s.completedAt??s.lastActivityAt,t=e?Date.parse(e):NaN;return Number.isNaN(t)?Number.NEGATIVE_INFINITY:t}const Eu=b(`
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
`),Ru='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',Nu=b(`
    <div class="round-row">
        <button bind="row" type="button" class="round-summary round-row__main">${pn}</button>
        <div bind="actions" class="round-row__actions">
            <button bind="menuButton" type="button" class="round-row__menu-button" aria-label="Round actions" aria-haspopup="true" aria-expanded="false">${Ru}</button>
            <div bind="menu" class="round-row__menu" role="group" aria-label="Round actions">
                <button bind="action" type="button" class="round-row__menu-action"></button>
            </div>
        </div>
    </div>
`);class Ou extends M{static styles=`
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
    `;svc=this.inject(Jt);auth=this.inject(D);router=this.inject(G);loggedIn=new k(()=>this.auth.currentUser.get()!==null);rows=new k(()=>Iu(this.loggedIn.get()?rt.fromMyRounds(this.svc.myRounds.get()):rt.fromDeviceRounds(this.svc.deviceRounds.get())));ongoingRows=new k(()=>this.rows.get().filter(e=>e.status!=="complete"));finishedRows=new k(()=>this.rows.get().filter(e=>e.status==="complete"));deleteOpen=new f(!1);leaveOpen=new f(!1);actionTarget=new f(null);actionError=new f("");openRoundMenu=new f(null);askAction(e,t,n,i){this.openRoundMenu.set(null),this.actionError.set(""),this.actionTarget.set({token:t,roundId:n,name:i,action:e}),e==="delete"?this.deleteOpen.set(!0):this.leaveOpen.set(!0)}render(){this.loggedIn.get()?this.svc.loadMine():this.svc.loadDevice();const e=this.wire(Eu,{back:{onclick:()=>this.router.navigate("/")},actionError:{textContent:()=>this.actionError.get()},empty:{className:()=>this.rows.get().length===0?"history__empty":"history__empty hidden"},sections:{className:()=>this.rows.get().length===0?"history__sections hidden":"history__sections"},ongoingSection:{className:()=>this.ongoingRows.get().length===0?"history__section history__ongoing hidden":"history__section history__ongoing"},ongoingCount:()=>String(this.ongoingRows.get().length),finishedSection:{className:()=>this.finishedRows.get().length===0?"history__section history__finished hidden":"history__section history__finished"},finishedCount:()=>String(this.finishedRows.get().length)});this.$each(this.ref(e,"ongoingList"),this.ongoingRows,(r,d,o)=>this.roundRow(r,o,!0),r=>r.key),this.$each(this.ref(e,"finishedList"),this.finishedRows,(r,d,o)=>this.roundRow(r,o),r=>r.key),this.spawn(oe,this.ref(e,"confirmHost"),{open:this.deleteOpen,title:"Delete round?",message:()=>{const r=this.actionTarget.get();return`Delete ${r?`“${r.name}”`:"this round"}? This permanently removes it and all its scores for everyone. This can't be undone.`},confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const r=this.actionTarget.get();r&&this.svc.remove(r.token,r.roundId).then(d=>{d||this.actionError.set("Could not delete the round. Try again.")})}}),this.spawn(oe,this.ref(e,"confirmHost"),{open:this.leaveOpen,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const r=this.actionTarget.get();r&&this.svc.leave(r.token,r.roundId).then(d=>{d.ok||this.actionError.set(d.message)})}});const t=r=>{r.key==="Escape"&&this.deleteOpen.get()&&this.deleteOpen.set(!1),r.key==="Escape"&&this.leaveOpen.get()&&this.leaveOpen.set(!1),r.key==="Escape"&&this.openRoundMenu.get()!==null&&this.openRoundMenu.set(null)};window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t));const n=this.ref(e,"root"),i=r=>{if(this.openRoundMenu.get()===null)return;const d=r.target;d instanceof Node&&n.contains(d)||this.openRoundMenu.set(null)};return document.addEventListener("pointerdown",i,!0),this.track(()=>document.removeEventListener("pointerdown",i,!0)),e}roundRow(e,t,n=!1){return this.wireEl(Nu,{row:{disabled:()=>e.token===null,onclick:()=>{e.token!==null&&this.router.navigate("/round",{query:{token:e.token}})}},title:()=>dt(e),course:{textContent:()=>jt(e)??"",className:()=>jt(e)?"round-summary__course":"round-summary__course hidden"},date:()=>Be(e.date),progress:{textContent:()=>n&&e.holesPlayed&&e.holesPlayed>0?`Thru ${e.holesPlayed}`:"",className:()=>n&&e.holesPlayed&&e.holesPlayed>0?"round-summary__progress":"round-summary__progress hidden"},formats:{textContent:()=>e.formats??"",className:()=>e.formats?"round-summary__formats":"round-summary__formats hidden"},actions:{className:()=>qe(e)===null?"round-row__actions hidden":"round-row__actions"},menuButton:{"aria-expanded":()=>this.openRoundMenu.get()===e.key?"true":"false",onclick:()=>this.openRoundMenu.set(this.openRoundMenu.get()===e.key?null:e.key)},menu:{className:()=>this.openRoundMenu.get()===e.key?"round-row__menu":"round-row__menu hidden"},action:{textContent:()=>{const i=qe(e);return i?Mr(i):""},onclick:()=>{const i=qe(e);!i||e.token===null||this.askAction(i,e.token,e.roundId??"",dt(e))}}},t)}}const Hu=700;function Mu(s){if(!s.currentHole)return!1;const e=s.balls.filter(t=>!t.pending);return e.length>0&&e.every(t=>t.scored)}function Au(s){return s.currentHole?s.balls.some((e,t)=>t!==s.currentBallIndex&&!e.scored):!1}function Ss(s){const e=s.currentHole;if(!e)return{kind:"noop"};const t=s.balls,n=s.currentBallIndex;for(let i=n+1;i<t.length;i++)if(!t[i].scored)return{kind:"moveToBall",ballIndex:i};for(let i=0;i<n;i++)if(!t[i].scored)return{kind:"moveToBall",ballIndex:i};return s.holeIndex>=s.holeCount-1?{kind:"roundComplete",toast:"Round complete"}:{kind:"holeComplete",toast:`Hole ${e.label} done`,fromHoleId:e.id,toHoleIndex:s.holeIndex+1,delayMs:Hu}}function zu(s,e){const t=s.currentHole;if(e.kind==="statsDone")return s.holeCompleteOnEntry?{write:null,move:{kind:"stay"}}:{write:null,move:Ss(s)};const n=s.balls[s.currentBallIndex];if(!t||!n)return{write:null,move:{kind:"noop"}};if(n.pending)return s.holeCompleteOnEntry?{write:null,move:{kind:"stay"}}:{write:null,move:Ss(s)};const i={ballIndex:s.currentBallIndex,holeId:t.id,value:e.value,withMetadata:e.value!==null};return e.value!==null&&e.value>0&&s.collectsStats?{write:i,move:{kind:"openStats"}}:s.holeCompleteOnEntry?{write:i,move:{kind:"stay"}}:{write:i,move:Ss(s)}}const Lu={tee_result:"Fairway means the ball finished on the short grass. In play is anywhere you can still play a normal shot. Trouble is anywhere you have to recover from: deep rough, trees, sand, a lost ball.",tee_miss_dir:"Which side the ball finished, looking down the hole from the tee. Only asked when the drive left the fairway. Over a few rounds this is what separates a one-way miss from a two-way one.",recovery_ok:"Did the very next shot get you back to a normal position: fairway, green, or a clear approach? Say yes even if the hole still ended badly. This is about the recovery shot, not the score.",gir:"Hit means the ball was on the putting surface with at least two shots left for par: the first shot on a par 3, the second on a par 4, the third on a par 5. The fringe is a miss.",green_miss_dir:"Which way you missed, seen from where you played the approach. Long is past the flag, short is in front of it. Left and right are exactly that.",short_game_difficulty:"Standard is a clean lie with green to work with. Hard is anything that takes the shot away from you: long grass, short-sided, downhill, an awkward stance. Bunker is sand, whatever the lie.",short_game_strokes:"How many shots it took to get from off the green onto it. One is the normal answer and is already filled in — only change it if you needed more.",first_putt:"How far the first putt was, in metres. If you holed out from off the green there was no first putt, so leave this alone and set putts to 0.",putts:"Putts taken on the green, counting the one that went in. 0 means you were never on the green with a putter.",penalties:"Penalty strokes added on this hole: out of bounds, a lost ball, an unplayable lie, water. Count strokes, not incidents.",penalty_source:"Which shot cost you the stroke. If a hole cost you more than one, pick the shot that did the most damage."};function Bu(s){return Lu[s]}const Ge={explainerTrigger:"What these mean",explainerTitle:"What these mean",girPending:"Will be filled in from your score when you close this.",girDisagreeMiss:"Your score says this green was missed. Tap to change it, or leave it.",girDisagreeHit:"Your score says this green was hit. Tap to change it, or leave it.",girPendingAria:"Green in regulation, not answered, will be filled in from your score"},gt=`
        <div bind="infoSheet" class="stats-info hidden">
            <div class="stats-info__panel">
                <div class="stats-info__head">
                    <span bind="infoTitle" class="stats-info__title"></span>
                    <button bind="infoDone" class="stats-info__done" type="button">Done</button>
                </div>
                <div bind="infoCards" class="stats-info__cards"></div>
            </div>
        </div>`,bt=b(`
    <div class="stats-info__card">
        <span bind="ctitle" class="stats-info__card-title"></span>
        <span bind="ctext" class="stats-info__card-text"></span>
    </div>
`),os='<button bind="infoTrigger" class="stats__info" type="button"></button>',ls=`
        /* A ghost link, quiet enough that it never competes with the section
           title it sits beside. */
        .stats__info {
            ${$()}
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
                ${$()}
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
`,Re=60,Qn=8,Vs=4,Fu=Array.from({length:Vs*2+1},(s,e)=>e-Vs),Gu="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",ju=b(`
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
                ${gt}
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
`),Du=b(`
    <div bind="item" class="se-hole">
        <span bind="hnum" class="se-hole__num"></span>
        <span bind="hpar" class="se-hole__par"></span>
    </div>
`),Jn=b(`
    <div class="se-row">
        <div class="se-row__who">
            <span bind="name" class="se-row__name"></span>
            <span class="se-row__hcpline">
                <span bind="hcp" class="se-row__hcp"></span>
                <button bind="hcpInfo" class="se-row__hcpinfo hidden" type="button" aria-label="How this handicap was calculated">i</button>
            </span>
        </div>
        <span bind="topar" class="se-row__topar"></span>
        <div class="se-row__scores">
            <span class="se-row__slot"><span bind="prev" class="se-row__prev"></span></span>
            <span class="se-row__slot"><button bind="circle" class="se-row__circle" type="button"><span bind="cval"></span></button></span>
        </div>
    </div>
`),qu=b(`
    <button bind="mrow" class="se-mrow" type="button">
        <div class="se-mrow__who">
            <span bind="mname" class="se-mrow__name"></span>
            <span bind="mhcp" class="se-mrow__hcp"></span>
        </div>
        <div bind="mcircle" class="se-mrow__circle"><span bind="mval"></span></div>
    </button>
`),Vu=b(`
    <div class="se-hcp__card">
        <div class="se-hcp__card-body">
            <span bind="ctitle" class="se-hcp__card-title"></span>
            <span bind="ctext" class="se-hcp__card-text"></span>
            <span bind="cmath" class="se-hcp__card-math"></span>
        </div>
        <span bind="cresult" class="se-hcp__card-result"></span>
    </div>
`),Zn=b(`
    <button bind="key" class="se-key" type="button">
        <span bind="num" class="se-key__num"></span>
        <span bind="lbl" class="se-key__lbl"></span>
    </button>
`),Uu=b(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__seg">
            <button bind="miss" class="se-seg" type="button">Miss</button>
            <button bind="hit" class="se-seg" type="button">Hit</button>
        </div>
    </div>
`),Ku=b(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div bind="seg" class="se-stats__seg"></div>
        <span bind="gnote" class="se-stats__note hidden"></span>
    </div>
`),Wu=b('<button bind="btn" class="se-seg" type="button"></button>'),Yu=b(`
    <div class="se-stats__group">
        <span bind="glabel" class="se-stats__group-label"></span>
        <div class="se-stats__step">
            <button bind="minus" class="se-stats__step-btn" type="button">−</button>
            <span bind="val" class="se-stats__step-val"></span>
            <button bind="plus" class="se-stats__step-btn" type="button">+</button>
        </div>
    </div>
`),Xu=b('<div bind="rule" class="se-stats__rule"></div>');class Qu extends M{static styles=`
        .se {
            margin-top: ${a("xl")};
            &.hidden { display: none; }
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
            right: ${Qn}px;
            width: ${Re*2}px;
            overflow: hidden;
        }
        .se__track {
            position: absolute;
            top: 0;
            bottom: 0;
            right: ${-Vs*Re}px;
            display: flex;
            align-items: center;
            will-change: transform;
        }
        .se-hole {
            flex: 0 0 ${Re}px;
            width: ${Re}px;
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
            /* The ⓘ behind the handicap: a caption-sized ringed "i" with
               thumb room — the row around it is not a control on the web
               (only the circle is), so it needs no propagation guard. */
            & .se-row__hcpinfo {
                flex: none;
                width: 22px; height: 22px; padding: 0;
                display: inline-flex; align-items: center; justify-content: center;
                background: none; cursor: pointer;
                border: 1px solid ${l("border")}; border-radius: 999px;
                color: ${l("text-muted")};
                font-size: 0.65rem; font-style: italic; font-family: serif;
                line-height: 1;
                transform: scale(0.72); transform-origin: center;
                &.hidden { display: none; }
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

            & .se-row__scores { display: flex; align-items: center; padding-right: ${Qn}px; flex-shrink: 0; }
            & .se-row__slot { width: ${Re}px; display: flex; align-items: center; justify-content: center; }
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
    `;svc=this.inject(be);holeIdx=this.svc.holeIdx;modalOpen=this.svc.keypadOpen;currentBallIdx=new f(0);holeCompleteOnEntry=!1;extendedOpen=new f(!1);extendedScore=new f(10);statsOpen=new f(!1);explainOpen=new f(!1);pendingMeta=new f({});lastMetaKey=null;toastMsg=new f(null);hcpInfoBallId=new f(null);dragOffset=new f(0);transitioning=new f(!1);ptr=null;pendingSteps=null;settleTimer=null;advanceTimer=null;flashTimer=null;hasScoring=new k(()=>this.svc.balls.get().length>0);group=()=>this.svc.group();playedOrder=()=>this.svc.playedOrder();holeIndex=()=>this.svc.holeIndex();currentHole=()=>this.svc.currentPlayedHole();occAtOffset=e=>{const t=this.playedOrder();return t[je(this.holeIndex()+e,t.length)]??null};ballsInGroup=()=>{const e=this.group();if(!e)return[];const t=new Map(this.svc.balls.get().map(n=>[n.id,n]));return e.ballIds.map(n=>t.get(n)).filter(n=>!!n)};parFor=e=>this.svc.parFor(e);occLabel=e=>this.svc.occLabel(e);ballName=e=>nn(e);metaInputs=()=>this.svc.metadataInputsForHole(this.svc.currentPlayHole()).filter(e=>e.kind==="boolean");displayScore=e=>e===null?"–":String(e);hintText=(e,t)=>{const n=this.svc.strokesHintFor(e,t);return n===null?null:n===0?"0":n>0?`-${n}`:`+${-n}`};toParValue=e=>{let t=0,n=0,i=!1;for(const r of this.playedOrder()){const d=this.svc.strokesFor(e.id,r.playHoleId);d!==null&&d>0&&(t+=d,n+=this.parFor(r.playHoleId),i=!0)}return i?t-n:null};hcpLine=e=>{const t=this.ballsInGroup().find(d=>d.id===e);if(!t||t.pending)return null;const n=t.players.length>1?t.courseHandicap:t.players[0]?.courseHandicap??t.courseHandicap;if(n===null)return null;const i=t.players.length>1?`Team · HCP ${n}`:`HCP ${n}`,r=this.svc.effectivePlayingHandicap(t);return r!==null&&r!==n?`${i} → ${r}`:i};rowDerivation=e=>{const t=this.ballsInGroup().find(n=>n.id===e);return!t||t.pending?null:this.svc.presentedSlot(t)?.handicapDerivation??null};selectedFormatLabel=()=>{const e=this.svc.round.get()?.formatSlots.find(t=>t.slotDefId===this.svc.selectedSlotDefId());return e?hn(e):null};hcpCards=e=>{const t=this.selectedFormatLabel(),n=[];for(const i of e.steps)switch(i.kind){case"course_handicap":{const r=i.handicapIndex!==null&&i.slope!==null&&i.courseRating!==null&&i.par!==null,d=i.teeName?`the ${i.teeName} tees`:"these tees";n.push({title:`Course handicap · ${i.producerLabel}`,text:r?`Exact handicap ${i.handicapIndex}, adjusted for the difficulty of ${d}.`:`The handicap ${i.producerLabel} plays this course off.`,math:r?`${i.handicapIndex} × ${i.slope} ÷ 113 + (${i.courseRating} − ${i.par}), rounded — the World Handicap System formula.`:null,result:i.result});break}case"team_combination":n.push({title:"Team handicap",text:"The team plays off a share of each member's handicap.",math:`${i.parts.map(r=>`${r.pct}% of ${r.producerLabel}'s ${r.ch}`).join(" + ")}, rounded.`,result:i.result});break;case"allowance":i.pct!==100&&n.push({title:"Allowance",text:`${t??"This format"} is played at ${i.pct}% handicap.`,math:null,result:i.result});break;case"match_delta":n.push(i.ownPh===i.lowestPh?{title:"Match difference",text:"Lowest handicap in the match — plays off scratch, and the others get the difference.",math:null,result:i.result}:{title:"Match difference",text:"In match formats only the difference matters: the lowest ball plays off 0, this ball gets the rest.",math:`${i.ownPh} − ${i.lowestPh} = ${i.result}.`,result:i.result});break}return n};figureText=e=>{const t=this.svc.slotStandingFor(e);if(t===null){const n=this.toParValue(e);return n===null?"–":n===0?"E":n>0?`+${n}`:`${n}`}switch(t.kind){case"pace":{const n=t.delta;return n===0?"E":n>0?`+${n}`:`${n}`}case"total":return String(t.total);case"match":return t.text}};figureClass=e=>{const t=this.svc.slotStandingFor(e);let n,i=!1;if(t===null){const r=this.toParValue(e);n=r===null||r===0?"even":r<0?"under":"over"}else t.kind==="pace"?n=t.delta===0?"even":t.delta<0?"under":"over":t.kind==="total"?n="even":(n=t.tone,i=!0);return`se-row__topar ${n}${i?" se-row__topar--match":""}`};scoreLabel=(e,t)=>{if(e===1)return"HIO";const n=e-t;return n<=-4||n>=5?"OTHER":{"-3":"ALBA","-2":"EAGLE","-1":"BIRDIE",0:"PAR",1:"BOGEY",2:"DOUBLE",3:"TRIPLE",4:"QUAD"}[String(n)]??""};render(){this.track(()=>{this.advanceTimer&&clearTimeout(this.advanceTimer),this.flashTimer&&clearTimeout(this.flashTimer),this.settleTimer&&clearTimeout(this.settleTimer),this.modalOpen.set(!1)}),this.track(C(()=>{const o=this.ballsInGroup().length;o>0&&this.currentBallIdx.get()>=o&&this.selectBall(0)}));const e=this.wire(ju,{root:{className:()=>this.hasScoring.get()?"se":"se hidden"},close:{onclick:()=>{this.statsOpen.set(!1),this.modalOpen.set(!1),this.svc.closeStatStep()}},modal:{className:()=>this.modalOpen.get()?"se-modal":"se-modal hidden"},modalTitle:()=>{const o=this.currentHole();return o?`Hole ${this.occLabel(o.playHoleId)} · Par ${this.parFor(o.playHoleId)}`:""},modalPrev:{onclick:()=>this.stepHole(-1),disabled:()=>!this.svc.canPrevHole()},modalNext:{onclick:()=>this.stepHole(1),disabled:()=>!this.svc.canNextHole()},extended:{className:()=>this.extendedOpen.get()?"se-pad__ext":"se-pad__ext hidden"},extVal:()=>String(this.extendedScore.get()),extMinus:{onclick:()=>this.extendedScore.set(Math.max(10,this.extendedScore.get()-1))},extPlus:{onclick:()=>this.extendedScore.set(this.extendedScore.get()+1)},extCancel:{onclick:()=>this.extendedOpen.set(!1)},extOk:{onclick:()=>{this.extendedOpen.set(!1),this.commit(this.extendedScore.get())}},toast:{className:()=>this.toastMsg.get()?"se-toast":"se-toast hidden",textContent:()=>this.toastMsg.get()??""},hcpModal:{className:()=>this.hcpInfoBallId.get()!==null?"se-hcp":"se-hcp hidden",onclick:o=>{o.target===o.currentTarget&&this.hcpInfoBallId.set(null)}},hcpClose:{onclick:()=>this.hcpInfoBallId.set(null)},hcpTitle:()=>{const o=this.hcpInfoBallId.get(),c=o?this.ballsInGroup().find(u=>u.id===o):null;return c?this.ballName(c):""},hcpFormat:()=>this.selectedFormatLabel()??"",hcpEff:()=>{const o=this.hcpInfoBallId.get(),c=o?this.rowDerivation(o):null;return c?String(c.effectivePh):""},stats:{className:()=>this.statsOpen.get()?"se-stats":"se-stats hidden"},statsBack:{onclick:()=>{this.statsOpen.set(!1),this.explainOpen.set(!1),this.svc.closeStatStep()}},statExplain:{textContent:Ge.explainerTrigger,onclick:()=>this.explainOpen.set(!0)},infoSheet:{className:()=>this.explainOpen.get()?"stats-info":"stats-info hidden",onclick:o=>{o.target===o.currentTarget&&this.explainOpen.set(!1)}},infoTitle:{textContent:Ge.explainerTitle},infoDone:{onclick:()=>this.explainOpen.set(!1)},statsHole:()=>{const o=this.currentHole();return o?`Hole ${this.occLabel(o.playHoleId)} · Par ${this.parFor(o.playHoleId)}`:""},statsTitle:()=>{const o=this.ballsInGroup()[this.currentBallIdx.get()];return o?this.ballName(o):""},statsScore:()=>{const o=this.ballsInGroup()[this.currentBallIdx.get()],c=this.currentHole();return!o||!c?"":this.displayScore(this.svc.strokesFor(o.id,c.playHoleId))},statsNext:{textContent:()=>this.hasMoreUnscored()?"Next ›":"Done ›",onclick:()=>{this.statsOpen.set(!1),this.explainOpen.set(!1),this.svc.closeStatStep(),this.apply({kind:"statsDone"})}}}),t=this.ref(e,"viewport"),n=this.ref(e,"track");this.bindCarouselPointer(t,n),this.track(C(()=>{n.style.transition=this.transitioning.get()?Gu:"none",n.style.transform=`translateX(${this.dragOffset.get()}px)`})),this.$each(n,new k(()=>Fu),(o,c,u)=>this.holeItem(o,u),o=>o),this.$each(this.ref(e,"rows"),new k(()=>{const o=this.playedOrder(),c=this.holeIndex(),u=o[c];if(!u)return[];const p=c>0?o[c-1].playHoleId:null;return this.ballsInGroup().map(m=>({ball:m,ph:u.playHoleId,prevPh:p}))}),(o,c,u)=>this.playerRow(o.ball,o.ph,o.prevPh,u),o=>`${o.ball.id}|${o.ph}|${o.ball.pending}`),this.$each(this.ref(e,"hcpSteps"),new k(()=>{const o=this.hcpInfoBallId.get(),c=o?this.rowDerivation(o):null;return c?this.hcpCards(c):[]}),(o,c,u)=>this.wireEl(Vu,{ctitle:{textContent:o.title},ctext:{textContent:o.text},cmath:{textContent:o.math??"",hidden:o.math===null},cresult:{textContent:String(o.result)}},u),(o,c)=>`${c}|${o.title}|${o.result}`),this.$each(this.ref(e,"modalList"),new k(()=>this.ballsInGroup()),(o,c,u)=>this.modalRow(o,c,u),o=>o.id);const i=this.ref(e,"keys");for(const o of[1,2,3,4,5,6,7,8,9])i.appendChild(this.numberKey(o));i.appendChild(this.specialKey("10+","","se-key",()=>this.openExtended())),i.appendChild(this.specialKey("✕","clear","se-key clear",()=>this.commit(null))),i.appendChild(this.specialKey("0","pick up","se-key muted",()=>this.commit(0))),this.$each(this.ref(e,"statsBody"),new k(()=>this.statBodyRows()),(o,c,u)=>this.statBodyRow(o,u),o=>o.key),this.$each(this.ref(e,"infoCards"),new k(()=>this.statExplainerCards()),(o,c,u)=>this.wireEl(bt,{ctitle:{textContent:o.title},ctext:{textContent:o.text}},u),o=>o.key),this.track(C(()=>{if(!this.modalOpen.get()){this.lastMetaKey=null,this.svc.seedStatStep(null);return}const o=this.ballsInGroup()[this.currentBallIdx.get()],c=this.currentHole();if(!o||!c)return;this.seedStatStepForCursor();const u=`${o.id}|${c.playHoleId}`;if(u===this.lastMetaKey)return;this.lastMetaKey=u;const p={};for(const m of this.metaInputs())p[m.key]=this.svc.metadataFor(o.id,c.playHoleId,m.key)===!0;this.pendingMeta.set(p)}));const r=()=>{document.visibilityState==="hidden"&&this.svc.flushStats()},d=()=>this.svc.flushStats();return document.addEventListener("visibilitychange",r),window.addEventListener("pagehide",d),this.track(()=>{document.removeEventListener("visibilitychange",r),window.removeEventListener("pagehide",d),this.svc.closeStatStep()}),e}holeItem(e,t){return this.wireEl(Du,{item:{className:()=>{const n=e===-1&&this.holeIndex()<=0;return`se-hole${e===0?" active":""}${n?" gone":""}`}},hnum:{textContent:()=>{const n=this.occAtOffset(e);return n?this.occLabel(n.playHoleId):""}},hpar:{textContent:()=>{const n=this.occAtOffset(e);return n?`Par ${this.parFor(n.playHoleId)}`:""}}},t)}playerRow(e,t,n,i){return e.pending?this.wireEl(Jn,{name:{textContent:this.ballName(e),className:"se-row__name se-row__name--pending"},hcp:{textContent:"open seat"},topar:{textContent:"",className:"se-row__topar"},prev:{textContent:""},cval:{textContent:"–"},circle:{className:"se-row__circle empty se-row__circle--pending"}},i):this.wireEl(Jn,{name:{textContent:this.ballName(e)},hcp:{textContent:()=>this.hcpLine(e.id)??"",hidden:()=>this.hcpLine(e.id)===null},hcpInfo:{className:()=>this.rowDerivation(e.id)!==null?"se-row__hcpinfo":"se-row__hcpinfo hidden",onclick:()=>this.hcpInfoBallId.set(e.id)},topar:{textContent:()=>this.figureText(e),className:()=>this.figureClass(e)},prev:{textContent:()=>n?this.displayScore(this.svc.strokesFor(e.id,n)):""},cval:{textContent:()=>{const r=this.svc.strokesFor(e.id,t);return r!==null?this.displayScore(r):this.hintText(e.id,t)??"–"}},circle:{className:()=>this.svc.strokesFor(e.id,t)!==null?"se-row__circle":this.hintText(e.id,t)!==null?"se-row__circle empty hint":"se-row__circle empty",onclick:()=>this.openModalForBall(e.id)}},i)}modalRow(e,t,n){const i=()=>{if(e.pending)return"Open seat — claim to score";const r=e.players.length>1?e.courseHandicap:e.players[0]?.courseHandicap??e.courseHandicap,d=r===null?"–":String(r),o=e.players.length>1?`Team · HCP ${d}`:`HCP ${d}`,c=this.svc.effectivePlayingHandicap(e);return r!==null&&c!==null&&c!==r?`${o} → ${c}`:o};return this.wireEl(qu,{mrow:{className:()=>this.currentBallIdx.get()===t?"se-mrow sel":"se-mrow",onclick:()=>this.selectBall(t)},mname:{textContent:this.ballName(e)},mhcp:{textContent:i},mval:{textContent:()=>{const r=this.currentHole();if(!r)return"–";const d=this.svc.strokesFor(e.id,r.playHoleId);return d!==null?this.displayScore(d):this.hintText(e.id,r.playHoleId)??"–"},className:()=>{const r=this.currentHole();return!!r&&this.svc.strokesFor(e.id,r.playHoleId)===null&&!!r&&this.hintText(e.id,r.playHoleId)!==null?"se-mrow__val se-mrow__val--hint":"se-mrow__val"}}},n)}numberKey(e){return this.wireEl(Zn,{key:{className:()=>{const t=this.currentHole();return(t?e===this.parFor(t.playHoleId):!1)?"se-key par":"se-key"},onclick:()=>this.commit(e)},num:{textContent:String(e)},lbl:{textContent:()=>{const t=this.currentHole();return t?this.scoreLabel(e,this.parFor(t.playHoleId)):""}}})}specialKey(e,t,n,i){return this.wireEl(Zn,{key:{className:n,onclick:i},num:{textContent:e},lbl:{textContent:t}})}openModalForBall(e){const t=this.ballsInGroup().findIndex(n=>n.id===e);this.selectBall(t<0?0:t),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.noteHoleEntered(),this.modalOpen.set(!0)}selectBall(e){this.currentBallIdx.set(e),this.seedStatStepForCursor()}seedStatStepForCursor(){const e=this.ballsInGroup()[this.currentBallIdx.get()],t=this.currentHole(),n=e?this.svc.statSubject(e):null;this.svc.seedStatStep(n&&t?{playerId:n,playHoleId:t.playHoleId}:null)}advanceState(){const e=this.currentHole();return{balls:this.ballsInGroup().map(t=>({pending:!!t.pending,scored:!!e&&this.svc.strokesFor(t.id,e.playHoleId)!==null})),currentBallIndex:this.currentBallIdx.get(),currentHole:e?{id:e.playHoleId,label:this.occLabel(e.playHoleId)}:null,holeIndex:this.holeIndex(),holeCount:this.playedOrder().length,holeCompleteOnEntry:this.holeCompleteOnEntry,collectsStats:this.metaInputs().length>0||this.svc.statPrompts().length>0}}noteHoleEntered(){this.holeCompleteOnEntry=Mu(this.advanceState())}stepHole(e){this.advanceTimer&&(clearTimeout(this.advanceTimer),this.advanceTimer=null),this.extendedOpen.set(!1),this.statsOpen.set(!1),this.svc.closeStatStep(),e<0?this.svc.prevHole():this.svc.nextHole(),this.selectBall(0),this.noteHoleEntered()}openExtended(){this.extendedScore.set(10),this.extendedOpen.set(!0)}commit(e){this.apply({kind:"score",value:e})}apply(e){this.execute(zu(this.advanceState(),e))}execute(e){const t=e.write;if(t){const i=this.ballsInGroup()[t.ballIndex];i&&this.svc.setScore(i.id,t.holeId,t.value,t.withMetadata?this.metaSnapshot():void 0)}const n=e.move;switch(n.kind){case"noop":case"stay":return;case"moveToBall":this.selectBall(n.ballIndex);return;case"openStats":this.statsOpen.set(!0);return;case"roundComplete":this.modalOpen.set(!1),this.svc.finishFlowOpen.set(!0);return;case"holeComplete":{this.flash(n.toast),this.advanceTimer&&clearTimeout(this.advanceTimer),this.advanceTimer=setTimeout(()=>{this.advanceTimer=null,this.currentHole()?.playHoleId===n.fromHoleId&&(this.holeIdx.set(je(n.toHoleIndex,this.playedOrder().length)),this.selectBall(0),this.noteHoleEntered())},n.delayMs);return}}}hasMoreUnscored=()=>{const e=this.currentHole();return Au({balls:this.ballsInGroup().map(t=>({pending:!!t.pending,scored:!!e&&this.svc.strokesFor(t.id,e.playHoleId)!==null})),currentBallIndex:this.currentBallIdx.get(),currentHole:e?{id:e.playHoleId}:null})};metaSnapshot(){const e=this.metaInputs();if(e.length===0)return;const t=this.pendingMeta.get(),n={};for(const i of e)n[i.key]=t[i.key]===!0;return n}setMeta(e,t){const n=this.pendingMeta.get();this.pendingMeta.set({...n,[e]:t});const i=this.ballsInGroup()[this.currentBallIdx.get()],r=this.currentHole();if(!i||!r)return;const d=this.svc.strokesFor(i.id,r.playHoleId);d!==null&&this.svc.setScore(i.id,r.playHoleId,d,this.metaSnapshot())}metaChip(e,t){return this.wireEl(Uu,{glabel:{textContent:e.label},miss:{className:()=>this.pendingMeta.get()[e.key]?"se-seg":"se-seg on-miss",onclick:()=>this.setMeta(e.key,!1)},hit:{className:()=>this.pendingMeta.get()[e.key]?"se-seg on-hit":"se-seg",onclick:()=>this.setMeta(e.key,!0)}},t)}metaInputsForStep=()=>{const e=new Set(this.svc.statPrompts().map(t=>t.key));return this.metaInputs().filter(t=>!e.has(t.key))};statBodyRows=()=>{const e=this.metaInputsForStep(),t=this.svc.statPrompts(),n=e.map(i=>({kind:"meta",key:`meta:${i.key}`,input:i}));e.length>0&&t.length>0&&n.push({kind:"rule",key:"rule"});for(const i of t)n.push({kind:"stat",key:`stat:${i.key}`,prompt:i});return n};statBodyRow(e,t){return e.kind==="meta"?this.metaChip(e.input,t):e.kind==="rule"?this.wireEl(Xu,{},t):e.prompt.control.kind==="segments"?this.statSegments(e.prompt,t):this.statStepper(e.prompt,t)}statSegments(e,t){const n=e.control,i=n.kind==="segments"?n.options:[],r=i.length>=4?" tight":"",d=this.wireEl(Ku,{glabel:{textContent:e.label},gnote:{textContent:()=>e.key==="gir"?this.girNote():"",className:()=>e.key==="gir"&&this.girNote()!==""?`se-stats__note${this.svc.statGirState().state==="disagree"?" warn":""}`:"se-stats__note hidden"},seg:{role:"group","aria-label":()=>e.key==="gir"?this.girAria():e.label}},t),o=this.ref(d,"seg");for(const c of i){const u=this.wireEl(Wu,{btn:{textContent:c.label,className:()=>`se-seg${r}${this.svc.statValue(e.key)===c.value?" on-neutral":""}`,onclick:()=>this.answerStat(e.key,this.svc.statValue(e.key)===c.value?null:c.value)}},t);o?.appendChild(u)}return d}statStepper(e,t){const n=e.control,i=n.kind==="stepper"?n.min:0,r=n.kind==="stepper"?n.max:null;return this.wireEl(Yu,{glabel:{textContent:e.label},minus:{onclick:()=>this.stepStat(e.key,-1),"aria-label":`Fewer ${e.label}`},plus:{onclick:()=>this.stepStat(e.key,1),"aria-label":`More ${e.label}`},val:{textContent:()=>Ml(this.svc.statStepperValue(e.key,i),r),className:()=>this.svc.statIsAnswered(e.key)?"se-stats__step-val":"se-stats__step-val unanswered","aria-label":()=>this.svc.statIsAnswered(e.key)?`${e.label} ${this.svc.statStepperValue(e.key,i)}`:`${e.label} not answered`}},t)}girNote(){const e=this.svc.statGirState();return e.state==="pending"?Ge.girPending:e.state==="disagree"?e.derived==="1"?Ge.girDisagreeHit:Ge.girDisagreeMiss:""}girAria(){const e=this.svc.statGirState();return e.state==="pending"?Ge.girPendingAria:e.state==="disagree"?`${Bs("gir")}, ${e.stored==="1"?"Hit":"Miss"}, your score disagrees`:Bs("gir")}statExplainerCards(){return this.svc.statPrompts().map(e=>({key:e.key,title:e.label,text:Bu(e.key)}))}answerStat(e,t){this.svc.answerStat(e,t),this.mirrorStatToMeta(e)}stepStat(e,t){this.svc.stepStat(e,t),this.mirrorStatToMeta(e)}mirrorStatToMeta(e){if(!this.metaInputs().some(n=>n.key===e))return;const t=this.svc.statValue(e);t!==null&&this.setMeta(e,t==="1")}flash(e){this.toastMsg.set(e),this.flashTimer&&clearTimeout(this.flashTimer),this.flashTimer=setTimeout(()=>{this.flashTimer=null,this.toastMsg.get()===e&&this.toastMsg.set(null)},1100)}snap(e){this.pendingSteps=e,this.transitioning.set(!0),this.dragOffset.set(-e*Re),this.settleTimer&&clearTimeout(this.settleTimer),this.settleTimer=setTimeout(()=>this.finishSettle(),420)}finishSettle(){if(this.pendingSteps===null)return;const e=this.pendingSteps;this.pendingSteps=null,this.settleTimer&&(clearTimeout(this.settleTimer),this.settleTimer=null),this.transitioning.set(!1),e!==0&&this.holeIdx.set(je(this.holeIndex()+e,this.playedOrder().length)),this.dragOffset.set(0)}bindCarouselPointer(e,t){t.addEventListener("transitionend",i=>{i.propertyName==="transform"&&this.finishSettle()}),e.addEventListener("pointerdown",i=>{this.ptr||this.transitioning.get()||this.playedOrder().length<=1||(this.ptr={id:i.pointerId,startX:i.clientX,startY:i.clientY,lastX:i.clientX,lastTime:Date.now(),velocity:0,horiz:!1},this.dragOffset.set(0),e.setPointerCapture?.(i.pointerId))}),e.addEventListener("pointermove",i=>{const r=this.ptr;if(!r||r.id!==i.pointerId)return;const d=i.clientX-r.startX,o=i.clientY-r.startY;if(!r.horiz){if(Math.abs(o)>Math.abs(d)&&Math.abs(o)>8||Math.abs(d)<=8)return;r.horiz=!0}const c=Date.now(),u=Math.max(1,c-r.lastTime);r.velocity=(i.clientX-r.lastX)/u,r.lastX=i.clientX,r.lastTime=c,this.dragOffset.set(d)});const n=i=>{const r=this.ptr;if(!r||r.id!==i.pointerId)return;const d=i.clientX-r.startX,o=r.horiz;if(this.ptr=null,e.releasePointerCapture?.(i.pointerId),!o){this.dragOffset.set(0);return}this.snap(Pl({dragDistance:d,velocity:r.velocity,itemWidth:Re}))};e.addEventListener("pointerup",n),e.addEventListener("pointercancel",i=>{!this.ptr||this.ptr.id!==i.pointerId||(this.ptr=null,e.releasePointerCapture?.(i.pointerId),this.snap(0))})}}function Ju(s,e){const t=[...s].sort((r,d)=>r.canonicalOrdinal-d.canonicalOrdinal);if(e.length===0)return[{label:"TOT",holes:t,playHoleIds:new Set(t.map(r=>r.playHoleId))}];const n=[...e].sort((r,d)=>r.fromCanonicalOrdinal-d.fromCanonicalOrdinal),i=[];for(const r of n){const d=t.filter(o=>o.canonicalOrdinal>=r.fromCanonicalOrdinal&&o.canonicalOrdinal<=r.toCanonicalOrdinal);d.length!==0&&i.push({label:r.label,holes:d,playHoleIds:new Set(d.map(o=>o.playHoleId))})}return i}function Lr(s,e){const t=s.cells.filter(n=>e.has(n.playHoleId));if(s.aggregate==="sum"){const n=t.map(i=>i.value).filter(i=>i!==null);return n.length===0?"—":String(n.reduce((i,r)=>i+r,0))}if(s.aggregate==="last"){for(let n=t.length-1;n>=0;n--){const i=t[n].value;if(i!==null)return Number.isInteger(i)?String(i):i.toFixed(1)}return"—"}return"—"}function Zu(s,e){if(s.aggregate==="sum"){const t=s.cells.map(n=>n.value).filter(n=>n!==null);return t.length===0?"—":String(t.reduce((n,i)=>n+i,0))}if(s.aggregate==="last"){const t=e[e.length-1];return t?Lr(s,t.playHoleIds):"—"}return"—"}function eh(s){const e=s?.marker;if(e){const t=e.tone;return{kind:"marker",template:e.template,tone:t==="success"||t==="warning"||t==="danger"?t:null,label:e.label?e.label:null,teamFill:s?.team??null}}return s?.team?{kind:"pill",team:s.team}:{kind:"plain"}}function th(s){return s.filter(e=>!(e.startsWith("slot #")||/^HCP -?\d/.test(e)||/^PH -?\d/.test(e)))}const Dt=" & ";function Br(s){return s.componentId??"default-score-grid"}function fn(s,e,t,n={}){const i=Ju(s.holes,e),r=n.mode??"product",d=s.rows.map(o=>{const c=new Map(o.cells.map(u=>[u.playHoleId,u]));return{kind:o.kind,emphasis:o.emphasis===!0,team:o.team??null,subjectName:o.subjectBallId?t(o.subjectBallId):null,labelText:o.label,groups:i.map(u=>({cells:u.holes.map(p=>{const m=c.get(p.playHoleId);return{text:m?.display??"",title:m?.title?m.title:null,decoration:eh(m)}}),subtotal:Lr(o,u.playHoleIds)})),total:Zu(o,i)}});return{componentId:Br(s),subjectBallIds:[...s.subjectBallIds],title:{groups:s.title.groups.map(o=>o.map(c=>t(c))),joiner:s.title.joiner,nameJoiner:Dt},subtitleFacts:r==="verification"?[...s.subtitleFacts]:th(s.subtitleFacts),footnotes:[...s.footnotes],caption:s.caption??null,totals:s.totals.map(o=>({label:o.label,value:String(o.value??"—")})),columnGroups:i.map(o=>({label:o.label,columns:o.holes.map(c=>({label:c.occurrenceLabel}))})),hasTotalColumn:i.length>1,rows:d}}function Ts(s){return[...new Set(s)].sort().join("\0")}function sh(s,e){const t=new Map;e.forEach((i,r)=>{if(i.ballIds.length===0)return;const d=Ts(i.ballIds);t.set(d,t.has(d)?null:r)});const n=new Map;for(const i of s){if(i.subjectBallIds.length===0)continue;const r=Ts(i.subjectBallIds);n.set(r,(n.get(r)??0)+1)}return s.map(i=>{if(i.subjectBallIds.length===0)return{kind:"standalone"};const r=Ts(i.subjectBallIds);if((n.get(r)??0)!==1)return{kind:"standalone"};const d=t.get(r);return d==null?{kind:"standalone"}:{kind:"attached",entryIndex:d}})}function nh(s,e){const t=new Set(s.map(e));return t.size!==1?null:[...t][0]??null}function ih(s,e){if(s===void 0)return null;const t=e==="high"?-s:s;return{text:t===0?"E":t>0?`+${t}`:`−${Math.abs(t)}`,tone:t===0?"even":t>0?"over":"under"}}const rh=()=>null;function ah(s,e,t=rh){return{kind:"ranked",metricLabel:s.metricLabel,hasPace:s.entries.some(n=>n.paceDelta!==void 0),entries:s.entries.map(n=>({position:n.position,lead:n.position===1,name:n.ballIds.map(e).join(Dt),group:nh(n.ballIds,t),total:String(n.total??"—"),holesPlayed:n.holesPlayed,pace:ih(n.paceDelta,s.direction)}))}}function oh(s,e){return{kind:"match_summary",title:s.title,matches:s.matches.map(t=>({sideAName:t.sideA.ballIds.map(e).join(Dt),sideBName:t.sideB.ballIds.map(e).join(Dt),leader:t.leader,standing:t.magnitude===0?"AS":`${t.magnitude} UP`,status:t.finished?"Final":`thru ${t.thru}`}))}}function Us(s,e){return[s,...[...new Set(e)].sort()].join("|")}const lh=new Map;function dh(s){const e=s.cards??[],t=(s.leaderboard??[]).find(d=>d.kind==="ranked")??null;if(!t)return{rankedSection:null,slotDefId:s.slotDefId,attached:lh,standalone:[...e]};const n=sh(e,t.entries),i=new Map,r=[];return e.forEach((d,o)=>{const c=n[o],u=c?.kind==="attached"?t.entries[c.entryIndex]:void 0;if(!u){r.push(d);return}i.set(Us(s.slotDefId,u.ballIds),d)}),{rankedSection:t,slotDefId:s.slotDefId,attached:i,standalone:r}}class ch{open=new Set;isOpen(e){return this.open.has(e)}toggle(e){return this.set(e,!this.open.has(e))}set(e,t){return t?this.open.add(e):this.open.delete(e),t}keys(){return[...this.open].sort()}retain(e){const t=new Set(e);for(const n of[...this.open])t.has(n)||this.open.delete(n)}}const mn={ring:{meaning:"a single-unit decided result",fill:"#d63b2f",visual:"red filled circle — the Gamebook birdie mark (score to par −1)"},double_ring:{meaning:"a two-unit decided result; more emphatic than a ring",fill:"#e0862c",teamFillBorder:"border-width: 3px; border-style: double;",visual:"orange filled circle (score to par −2); doubled white border when team-filled"},diamond:{meaning:"a rare / high-magnitude decided result — the strongest form",fill:"#e0b41f",visual:"yellow filled circle — hole-in-one / albatross territory"},dot:{meaning:"a lightweight per-hole flag where a full ring would be too heavy",visual:"the bare base shape (no fill, no border) — inherits cell colour"},badge:{meaning:"a labelled status needing short text or a number, not just a shape",rule:["width: auto; min-width: 1.8em;","padding-left: 0.45em; padding-right: 0.45em;","border: 2px solid currentColor;"],tones:{success:"#267348",warning:"#946200",danger:"#9b332a"},visual:"outline pill in the tone colour, text inside"},square:{meaning:"a one-step negative score relation",fill:"#5b9bd5",boxy:!0,visual:"light-blue filled square (score to par +1)"},double_square:{meaning:"a stronger negative score relation",fill:"#1f4e79",boxy:!0,visual:"dark-blue filled square (score to par +2)"},box_badge:{meaning:"an angular labelled state that must not read as a round marker",fill:"#1f4e79",boxy:!0,visual:"dark-blue filled square carrying its value (+3 or worse)"}};function ut(s){return`lb-mark--${s}`}const tt=()=>Object.entries(mn);function Fr(s){return s.join(`
            `)}function Ps(s,e){return s.map((t,n)=>`& .${ut(t)}${n===s.length-1?` { ${e} }`:","}`)}function uh(){const s=[];s.push("/* Outline forms keep currentColor + tone tints. */");for(const[r,d]of tt())if(!(!d.rule&&!d.tones)){if(d.rule){s.push(`& .${ut(r)} {`);for(const o of d.rule)s.push(`    ${o}`);s.push("}")}for(const[o,c]of Object.entries(d.tones??{}))s.push(`& .${ut(r)}.lb-mark-tone--${o} { color: ${c}; }`)}s.push("/* Filled forms — declared after the tone rules so white text wins. */");const e=tt().filter(([,r])=>r.boxy).map(([r])=>r),t=[],n=new Set;for(const[r,d]of tt()){if(d.fill===void 0||n.has(r))continue;const o=tt().filter(([,c])=>c.fill===d.fill).map(([c])=>c);for(const c of o)n.add(c);t.push({fill:d.fill,ids:o})}let i=-1;if(e.length>0){const r=t.findIndex(d=>d.ids.some(o=>mn[o].boxy));i=r===-1?t.length:r}return t.forEach((r,d)=>{d===i&&s.push(...Ps(e,"border-radius: 3px;")),s.push(...Ps(r.ids,`background: ${r.fill}; color: #fff;`))}),i===t.length&&s.push(...Ps(e,"border-radius: 3px;")),Fr(s)}function hh(){const s=[];for(const[e,t]of tt()){if(!t.teamFillBorder)continue;const n=ut(e);s.push(`& .${n}.lb-mark-fill--a,`,`& .${n}.lb-mark-fill--b { ${t.teamFillBorder} }`)}return Fr(s)}const Gr=()=>null;function B(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ph(s){return s.kind==="si"?"lb-c-si":s.kind==="given"?"lb-c-given":s.kind==="status"?"lb-c-status":s.kind==="category"?"lb-c-cat":""}function fh(s){const e=[s.kind==="category"?"lb-r-cat":`lb-r-${s.kind}`];return(s.kind==="si"||s.kind==="given")&&e.push("lb-r-dim"),s.team&&e.push(`lb-team-${s.team}`),e.join(" ")}function mh(s,e,t){const n=s.title!==null?` title="${B(s.title)}"`:"",i=t(B(s.text)),r=s.decoration;let d;if(r.kind==="marker"){const o=r.tone?` lb-mark-tone--${r.tone}`:"",c=r.teamFill?` lb-mark-fill--${r.teamFill}`:"",u=r.label!==null?` title="${B(r.label)}" aria-label="${B(r.label)}"`:"";d=`<span class="lb-mark ${ut(r.template)}${o}${c}"${u}>${i}</span>`}else r.kind==="pill"?d=`<span class="lb-pill lb-pill--${r.team}">${i}</span>`:d=i;return`<td class="${ph(e)}"${n}>${d}</td>`}function gn(s,e){const t=m=>{const h=s.columnGroups[m],g=`<tr><th class="lb-rowlabel">Hole</th>${h.columns.map(w=>`<th>${B(w.label)}</th>`).join("")}<th class="lb-sum">${B(h.label)}</th></tr>`,v=s.rows.map(w=>{const T=J=>w.emphasis?`<strong>${J}</strong>`:J,N=w.groups[m],z=N.cells.map(J=>mh(J,w,T)).join(""),V=`<td class="lb-sum">${T(N.subtotal)}</td>`,O=w.subjectName!==null?B(w.subjectName)+(w.labelText?" "+B(w.labelText):""):B(w.labelText);return`<tr class="${fh(w)}"><th class="lb-rowlabel">${O}</th>${z}${V}</tr>`}).join("");return`<div class="lb-card__scroll"><table class="lb-grid"><thead>${g}</thead><tbody>${v}</tbody></table></div>`},n=s.columnGroups.map((m,h)=>t(h)).join(""),i=s.title.groups.map(m=>m.map(h=>B(h)).join(s.title.nameJoiner)).filter(Boolean).join(s.title.joiner),r=s.subtitleFacts.length?`<div class="lb-card__sub">${s.subtitleFacts.map(B).join(" · ")}</div>`:"",d=e.mode==="verification"&&s.footnotes.length?`<div class="lb-card__notes"><span class="lb-card__notes-label">Points breakdown</span>${s.footnotes.map(m=>`<span class="lb-card__note">${B(m)}</span>`).join("")}</div>`:"",o=e.mode==="verification"&&s.caption?`<p class="lb-card__caption">${B(s.caption)}</p>`:"",c=s.totals.length?`<ul class="lb-card__totals">${s.totals.map(m=>`<li>${B(m.label)} = <strong>${m.value}</strong></li>`).join("")}</ul>`:"",u=i?`<header class="lb-card__head"><h4>${i}</h4>${r}</header>`:r;return`<article class="${e.cardModifier?`lb-card ${e.cardModifier}`:"lb-card"}">
  ${u}
  ${n}
  ${d}${o}${c}
</article>`}function gh(s,e,t,n){return gn(fn(s,e,t,n),n)}function bh(s,e,t,n){return gn(fn(s,e,t,n),{...n,cardModifier:"lb-card--compact-match"})}function _h(s,e,t,n){return gn(fn(s,e,t,n),{...n,cardModifier:"lb-card--category-matrix"})}function yh(s){return s.pace===null?'<td class="lb-rank__pace"></td>':`<td class="lb-rank__pace lb-rank__pace--${s.pace.tone}">${B(s.pace.text)}</td>`}function vh(s){return`lb-panel-${s.replace(/[^a-zA-Z0-9_-]+/g,"-")}`}function wh(s,e,t=Gr,n=null){const i=ah(s,e,t),r=i.hasPace,d=n!==null,o=(r?5:4)+(d?1:0),c=i.entries.map((g,v)=>{const w=g.group?` <span class="lb-rank__group">${B(g.group)}</span>`:"",T=`
  <td class="lb-rank__total">${g.total}</td>${r?`
  ${yh(g)}`:""}
  <td class="lb-rank__thru">${g.holesPlayed}</td>`,N=s.entries[v],z=n&&N?n.plan.attached.get(Us(n.plan.slotDefId,N.ballIds)):void 0;if(!n)return`<tr class="${g.lead?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${g.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${B(g.name)}</span>${w}</span></td>${T}
</tr>`;if(!N||!z)return`<tr class="${g.lead?"lb-rank__lead":""}">
  <td class="lb-rank__pos">${g.position}</td>
  <td class="lb-rank__who"><span class="lb-rank__whobox"><span class="lb-rank__name">${B(g.name)}</span>${w}</span></td>${T}
  <td class="lb-rank__disclosure"></td>
</tr>`;const V=Us(n.plan.slotDefId,N.ballIds),O=n.isOpen(V),J=vh(V),de=jr(z,n.routeSections,e,{mode:n.mode??"product"}),ce=["lb-rank__row--expandable"];return g.lead&&ce.push("lb-rank__lead"),O&&ce.push("lb-rank__row--open"),`<tr class="${ce.join(" ")}" data-expand-key="${B(V)}">
  <td class="lb-rank__pos">${g.position}</td>
  <td class="lb-rank__who"><button type="button" class="lb-rank__toggle" aria-expanded="${O}" aria-controls="${B(J)}"><span class="lb-rank__whobox"><span class="lb-rank__name">${B(g.name)}</span>${w}</span></button></td>${T}
  <td class="lb-rank__disclosure"><span class="lb-rank__chev" aria-hidden="true"></span></td>
</tr>
<tr class="lb-rank__panel${O?" lb-rank__panel--open":""}" data-panel-key="${B(V)}">
  <td class="lb-rank__panelcell" colspan="${o}"><div class="lb-rank__panelwrap" id="${B(J)}"><div class="lb-rank__panelbox">${de}</div></div></td>
</tr>`}).join(""),u=r?`
      <col class="lb-rank__col-pace">`:"",p=r?'<th class="lb-rank__pace">Pace</th>':"",m=d?`
      <col class="lb-rank__col-disclosure">`:"",h=d?'<th class="lb-rank__disclosure" aria-label="Scorecard"></th>':"";return`<div class="lb-section">
  <h4 class="lb-section__title">${B(i.metricLabel)}</h4>
  <table class="lb-rank">
    <colgroup>
      <col class="lb-rank__col-pos">
      <col class="lb-rank__col-who">
      <col class="lb-rank__col-total">${u}
      <col class="lb-rank__col-thru">${m}
    </colgroup>
    <thead><tr><th class="lb-rank__pos">#</th><th class="lb-rank__who">Player</th><th class="lb-rank__total">Total</th>${p}<th class="lb-rank__thru">Thru</th>${h}</tr></thead>
    <tbody>${c}</tbody>
  </table>
</div>`}function xh(s,e){const t=oh(s,e),n=t.matches.map(i=>{const r=i.leader==="a"?" lb-mp__team--lead":"",d=i.leader==="b"?" lb-mp__team--lead":"";return`<div class="lb-mp">
    <div class="lb-mp__team lb-mp__team--a${r}">${B(i.sideAName)}</div>
    <div class="lb-mp__center"><span class="lb-mp__standing">${B(i.standing)}</span><span class="lb-mp__status">${B(i.status)}</span></div>
    <div class="lb-mp__team lb-mp__team--b${d}">${B(i.sideBName)}</div>
  </div>`}).join("");return`<div class="lb-section">
  <h4 class="lb-section__title">${B(t.title)}</h4>${n}
</div>`}const $h={ranked:wh,match_summary:(s,e)=>xh(s,e)},kh={"default-score-grid":gh,"compact-match-grid":bh,"category-matrix-grid":_h};function Sh(s){return`<div class="lb-diag">Unrenderable result section <code>${B(s)}</code> — no generic view yet. Results are not hidden.</div>`}function Th(s){return`<div class="lb-diag">Unsupported score-grid component <code>${B(s)}</code> — no generic view yet. Results are not hidden.</div>`}function Ph(s,e,t,n=null){const i=$h[s.kind];return i?i(s,e,t,n):Sh(s.kind)}function jr(s,e,t,n){const i=Br(s),r=kh[i];return r?r(s,e,t,n):Th(i)}function Dr(s,e,t=Gr,n=null){return s.leaderboard.length===0&&s.cards.length===0?`<div class="lb-empty">No scores entered yet for ${B(s.formatLabel)}.</div>`:s.leaderboard.map(r=>Ph(r,e,t,n&&r===n.plan.rankedSection?n:null)).join("")||`<div class="lb-empty">No leaderboard metric for ${B(s.formatLabel)}.</div>`}function qr(s,e,t,n={}){if(s.length===0)return"";const i=n.mode??"product";return s.map(r=>jr(r,e,t,{mode:i})).join(`
`)}const Ch=b(`
    <div bind="root" class="lb">
        <div bind="status" class="lb__status hidden"></div>
        <div bind="body" class="lb__body"></div>
    </div>
`);class bn extends M{static styles=`
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
            ${uh()}
            /* Deciding ball whose score is decorated: the marker's own shape gets
               the team fill — white number and white outline on the team colour.
               Declared AFTER the shape fills so the team colour wins. The white
               border + outer box-shadow halo are load-bearing: without them a
               filled bonus ring is indistinguishable from the plain standing
               pill (the score-to-par shapes above carry no outline). */
            & .lb-mark-fill--a, & .lb-mark-fill--b { border: 2px solid #fff; }
            ${hh()}
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
    `;svc=this.inject(be);expansion=new ch;slots=()=>this.svc.result.get()?.slots??[];currentSlot=()=>{const e=this.slots(),t=this.svc.selectedSlotDefId();return e.find(n=>n.slotDefId===t)??e[0]??null};render(){return this.wire(Ch,{status:{className:()=>{const t=this.svc.resultLoading.get(),n=this.svc.result.get()===null;return t||n?"lb__status":"lb__status hidden"},textContent:()=>this.svc.resultLoading.get()?"Loading results…":"No results yet."},body:{innerHTML:()=>this.renderBody(),onclick:t=>this.onBodyClick(t),onkeydown:t=>this.onBodyKeydown(t)}})}rowFor(e){return e.target?.closest?.("tr[data-expand-key]")??null}onBodyClick(e){const t=this.rowFor(e);if(!t||(window.getSelection?.()?.toString()??"")!=="")return;const n=t.getAttribute("data-expand-key")??"";this.applyOpen(t,this.expansion.toggle(n))}onBodyKeydown(e){if(e.key!=="Escape")return;const t=this.rowFor(e);if(!t)return;const n=t.getAttribute("data-expand-key")??"";this.expansion.isOpen(n)&&(this.applyOpen(t,this.expansion.set(n,!1)),t.querySelector(".lb-rank__toggle")?.focus(),e.stopPropagation())}applyOpen(e,t){e.classList.toggle("lb-rank__row--open",t),e.querySelector(".lb-rank__toggle")?.setAttribute("aria-expanded",String(t));const n=e.nextElementSibling;n?.classList.contains("lb-rank__panel")&&n.classList.toggle("lb-rank__panel--open",t)}renderBody(){const e=this.svc.result.get();if(!e)return"";const t=this.currentSlot();if(!t)return'<div class="lb-empty">No formats in this round.</div>';const n=u=>{const p=this.svc.nameOf(u);return this.svc.isPending(u)?`${p} (open seat)`:p},i=u=>this.svc.groupLabelOf(u),r=dh(t);this.expansion.retain(r.attached.keys());const d=Dr(t,n,i,{plan:r,routeSections:e.routeSections,isOpen:u=>this.expansion.isOpen(u)}),o=qr(r.standalone,e.routeSections,n),c=o?`<h3 class="lb-cards__head">Scorecard</h3>${o}`:"";return d+c}}function Ih(s,e){if(!e)return[];const t=[],n=new Set;for(const i of s)for(const r of i.players){if(r.playerId===e)return[];r.guestPlayerId===null||n.has(r.guestPlayerId)||(n.add(r.guestPlayerId),t.push({guestPlayerId:r.guestPlayerId,displayName:r.displayName}))}return t}const Eh=b(`
    <div bind="root" class="claim-card hidden">
        <span class="claim-card__label">Played here as a guest?</span>
        <p class="claim-card__hint">Claim your scores — the round lands on your profile's card.</p>
        <div bind="rows" class="claim-card__rows"></div>
        <p bind="err" class="claim-card__err"></p>
    </div>
`),Rh=b(`
    <div class="claim-card__row">
        <span bind="name" class="claim-card__name"></span>
        <button bind="claim" class="claim-card__btn" type="button">This is me</button>
    </div>
`);class Nh extends M{static styles=`
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
                ${$()}
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
    `;svc=this.inject(be);auth=this.inject(D);router=this.inject(G);tokenQ=this.router.query("token");claiming=new f(!1);error=new f("");claimable(){return Ih(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}async claim(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.claiming.set(!0);try{await y.friendlyRounds.claimGuest({token:t,guestPlayerId:e}),await this.svc.loadByToken(t)}catch(n){this.error.set(n instanceof Y&&n.status===409?"Already claimed — or you already play in this round under your account.":n instanceof Y&&n.status===404?"That guest is no longer claimable on this round.":"Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}render(){const e=this.wire(Eh,{root:{className:()=>this.claimable().length>0?"claim-card":"claim-card hidden"},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.claimable(),(t,n,i)=>this.wireEl(Rh,{name:()=>t.displayName,claim:{disabled:()=>this.claiming.get(),onclick:()=>{this.claim(t.guestPlayerId)}}},i),t=>t.guestPlayerId),e}}function Cs(s){return typeof s=="object"&&s!==null&&typeof s.get=="function"}const P=s=>`var(--${s})`,ei="http://www.w3.org/2000/svg";function Oh(){const s=document.createElementNS(ei,"svg");s.setAttribute("width","12"),s.setAttribute("height","8"),s.setAttribute("viewBox","0 0 12 8"),s.setAttribute("fill","none"),s.setAttribute("aria-hidden","true"),s.setAttribute("focusable","false");const e=document.createElementNS(ei,"path");return e.setAttribute("d","M1 1.5 6 6.5 11 1.5"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","1.5"),e.setAttribute("stroke-linecap","round"),e.setAttribute("stroke-linejoin","round"),e.setAttribute("fill","none"),s.appendChild(e),s}const at=class at extends M{constructor(){super(...arguments),this.uid=`ui-select-${at.seq++}`,this.open=new f(!1),this.highlightIndex=new f(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}get isMulti(){return this.props.multiple===!0}get multi(){return this.props}get single(){return this.props}currentOptions(){return Cs(this.props.options)?this.props.options.get():this.props.options}selectedValues(){if(this.isMulti)return this.multi.values.get();const e=this.single.value.get();return e?[e]:[]}placeholderText(){const e=this.props.placeholder;return(typeof e=="function"?e():e)??""}formatCount(e){return this.multi.countLabel?this.multi.countLabel(e):String(e)}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50,n=this.isMulti;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const i=document.createElement("span");i.className="ui-select__trigger-label",this.triggerEl.appendChild(i);const r=document.createElement("span");r.className="ui-select__chevron",r.appendChild(Oh()),r.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(r),this.triggerEl.addEventListener("click",o=>{o.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",o=>{this.handleTriggerKeydown(o)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",o=>{this.handleDropdownKeydown(o)}),this.listEl=document.createElement("div"),this.listEl.className="ui-select__list",this.listEl.setAttribute("role","listbox"),n&&this.listEl.setAttribute("aria-multiselectable","true"),this.dropdownEl.appendChild(this.listEl),n&&(this.countEl=document.createElement("div"),this.countEl.className="ui-select__count",this.countEl.setAttribute("role","status"),this.countEl.setAttribute("aria-live","polite"),this.dropdownEl.appendChild(this.countEl)),e.appendChild(this.dropdownEl);const d=o=>{this.optionEls=[],this.listEl.textContent="";for(let c=0;c<o.length;c++){const u=o[c],p=document.createElement("button");if(p.className=n?"ui-select__option ui-select__option--multi":"ui-select__option",p.setAttribute("type","button"),p.id=`${this.uid}-opt-${c}`,u.disabled){p.classList.add("ui-select__option--header"),p.disabled=!0,p.setAttribute("role","presentation"),p.setAttribute("aria-disabled","true");const h=document.createElement("span");h.className="ui-select__option-label",h.textContent=u.label,p.appendChild(h),this.listEl.appendChild(p),this.optionEls.push(p);continue}if(p.setAttribute("role","option"),n){const h=document.createElement("span");h.className="ui-select__checkbox",h.setAttribute("aria-hidden","true"),p.appendChild(h)}if(u.icon){const h=document.createElement("span");h.className="ui-select__option-icon",h.textContent=u.icon,p.appendChild(h)}const m=document.createElement("span");if(m.className="ui-select__option-label",m.textContent=u.label,p.appendChild(m),!n){const h=document.createElement("span");h.className="ui-select__check",h.setAttribute("aria-hidden","true"),p.appendChild(h)}p.addEventListener("click",h=>{h.stopPropagation(),this.chooseOption(u.value)}),p.addEventListener("mouseenter",()=>{this.highlightIndex.set(c)}),this.listEl.appendChild(p),this.optionEls.push(p)}};return Cs(this.props.options)?this.track(C(()=>{d(this.currentOptions())})):d(this.props.options),this.track(C(()=>{const o=this.currentOptions(),c=this.selectedValues();if(n){const u=c.length;if(u>0)i.textContent=this.formatCount(u),this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const p=this.placeholderText();i.textContent=p,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!p)}this.countEl&&(this.countEl.textContent=this.formatCount(u))}else{const u=this.single.value.get(),p=o.find(m=>m.value===u);if(p)i.textContent=p.icon?`${p.icon} ${p.label}`:p.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const m=this.placeholderText();i.textContent=m,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!m)}}for(let u=0;u<o.length;u++){const p=this.optionEls[u];if(!p||o[u].disabled)continue;const m=c.includes(o[u].value);p.setAttribute("aria-selected",String(m)),p.classList.toggle("ui-select__option--selected",m);const h=p.querySelector(".ui-select__check");h&&(h.textContent=m?"✓":"");const g=p.querySelector(".ui-select__checkbox");g&&(g.textContent=m?"✓":"")}})),this.track(C(()=>{const o=this.open.get();this.dropdownEl.classList.toggle("open",o),r.classList.toggle("ui-select__chevron--open",o),this.triggerEl.setAttribute("aria-expanded",String(o)),o?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),o&&te(()=>{const c=this.currentOptions(),u=this.selectedValues(),p=c.findIndex(h=>!h.disabled&&u.includes(h.value)),m=c.findIndex(h=>!h.disabled);this.highlightIndex.set(p>=0?p:m)})})),this.track(C(()=>{const o=this.highlightIndex.get();for(let c=0;c<this.optionEls.length;c++)this.optionEls[c].classList.toggle("ui-select__option--highlighted",c===o);o>=0&&this.optionEls[o]&&(this.triggerEl.setAttribute("aria-activedescendant",`${this.uid}-opt-${o}`),this.optionEls[o].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(Cs(this.props.disabled)?this.track(C(()=>{const o=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",o),this.triggerEl.disabled=o})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}chooseOption(e){if(this.isMulti){const t=this.multi.values.get();this.multi.values.set(t.includes(e)?t.filter(n=>n!==e):[...t,e]);return}ot(()=>{this.single.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}commitHighlighted(){const e=this.highlightIndex.get(),t=this.currentOptions();e>=0&&e<t.length&&!t[e].disabled&&this.chooseOption(t[e].value)}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.open.get()?this.commitHighlighted():this.open.set(!0);break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":e.preventDefault(),this.commitHighlighted();break;case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=this.currentOptions();if(t.length===0||!t.some(i=>!i.disabled))return;let n=this.highlightIndex.get();do n+=e,n<0&&(n=t.length-1),n>=t.length&&(n=0);while(t[n].disabled);this.highlightIndex.set(n)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};at.styles=`
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
    `,at.seq=0;let pe=at;function Hh(s){if(!s)return{visible:!1,selfAllowed:!1,guestAllowed:!1,blockedMessage:null};const e=s.seats.length>0,t=s.claimedSeats.some(r=>r.viewerMayRelease),n=s.viewer.claimSeat.allowed,i=s.viewer.claimSeatAsGuest.allowed;return{visible:e||t,selfAllowed:e&&n,guestAllowed:e&&i,blockedMessage:e&&!n&&!i?s.viewer.claimSeat.message??s.viewer.claimSeatAsGuest.message??"Claiming seats is not available on this round.":null}}function Mh(s,e){const t=[];if(s.groupId!==null&&e.length>0){const n=e.findIndex(i=>i.id===s.groupId);if(n>=0){t.push(`Group ${n+1}`);const i=e[n].startTime;i.includes(":")&&t.push(i)}}return s.category!==null&&t.push(s.category),t.join(" · ")}function Ah(s){return(s?.claimedSeats??[]).filter(e=>e.viewerMayRelease)}const zh=b(`
    <div bind="root" class="seat-card hidden">
        <span class="seat-card__label">Who's playing?</span>
        <p bind="hint" class="seat-card__hint">This round has open seats — claim one to score.</p>
        <p bind="blocked" class="seat-card__blocked hidden"></p>
        <div bind="rows" class="seat-card__rows"></div>
        <div bind="releaseRows" class="seat-card__rows"></div>
        <p bind="err" class="seat-card__err"></p>
    </div>
`),Lh=b(`
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
`),Bh=b(`
    <div class="seat-card__release">
        <span class="seat-card__who">
            <span bind="name" class="seat-card__name"></span>
            <span bind="context" class="seat-card__context"></span>
        </span>
        <button bind="release" class="seat-card__btn seat-card__btn--ghost" type="button">Not me — release</button>
    </div>
`);class Fh extends M{static styles=`
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
                ${$()}
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
    `;svc=this.inject(be);auth=this.inject(D);router=this.inject(G);tokenQ=this.router.query("token");claiming=new f(!1);error=new f("");diagnostics=new f([]);expandedSeat=new f(null);teeId=new f("");tees=new f([]);loadedForCourseId=null;guestName=new f("");guestHcp=new f("");guestGender=new f("M");state(){return Hh(this.svc.startList.get())}ensureTeesLoaded(){if(!this.state().visible)return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,y.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}toggleSeat(e){this.diagnostics.set([]),this.error.set(""),this.expandedSeat.set(this.expandedSeat.get()===e?null:e)}guestHcpValue(){const e=Number.parseFloat(this.guestHcp.get().replace(",","."));return Number.isFinite(e)?e:null}async claim(e,t,n){const i=this.tokenQ.get(),r=this.teeId.get();if(!(!i||!r||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const d=await y.friendlyRounds.claimSeat({token:i,seatId:e,identity:t,teeId:r,clientEventId:n});d.ok?(this.expandedSeat.set(null),this.guestName.set(""),this.guestHcp.set(""),await this.svc.loadByToken(i)):this.diagnostics.set(d.diagnostics)}catch{this.error.set("Could not claim right now. Try again.")}finally{this.claiming.set(!1)}}}async claimSelf(e){const t=this.auth.currentUser.get()?.id??"anon";await this.claim(e,{kind:"self"},`claim-seat:${e}:${t}:${this.teeId.get()}`)}async claimGuest(e){const t=this.guestName.get().trim(),n=this.guestHcpValue();!t||n===null||await this.claim(e,{kind:"guest",name:t,handicapIndex:n,gender:this.guestGender.get()==="F"?"F":"M"},crypto.randomUUID())}async release(e){const t=this.tokenQ.get();if(!(!t||this.claiming.get())){this.error.set(""),this.diagnostics.set([]),this.claiming.set(!0);try{const n=await y.friendlyRounds.releaseSeat({token:t,seatId:e,clientEventId:crypto.randomUUID()});n.ok?await this.svc.loadByToken(t):this.diagnostics.set(n.diagnostics)}catch{this.error.set("Could not release right now. Try again.")}finally{this.claiming.set(!1)}}}seatRow(e,t){const n=()=>this.expandedSeat.get()===e.seatId&&this.state().blockedMessage===null,i=this.wireEl(Lh,{label:()=>e.label,context:()=>Mh(e,this.svc.groups()),toggle:{textContent:()=>this.expandedSeat.get()===e.seatId?"Close":"Claim",disabled:()=>this.state().blockedMessage!==null,onclick:()=>this.toggleSeat(e.seatId)},form:{className:()=>n()?"seat-card__form":"seat-card__form hidden"},selfBtn:{className:()=>this.state().selfAllowed?"seat-card__btn seat-card__btn--wide":"seat-card__btn seat-card__btn--wide hidden",disabled:()=>this.claiming.get()||!this.teeId.get(),onclick:()=>{this.claimSelf(e.seatId)}},guestBox:{className:()=>this.state().guestAllowed?"seat-card__guest":"seat-card__guest hidden"},guestName:{oninput:o=>this.guestName.set(o.target.value)},guestHcp:{oninput:o=>this.guestHcp.set(o.target.value)},guestBtn:{disabled:()=>this.claiming.get()||!this.teeId.get()||this.guestName.get().trim()===""||this.guestHcpValue()===null,onclick:()=>{this.claimGuest(e.seatId)}},diag:{className:()=>this.diagnostics.get().length>0?"seat-card__diag":"seat-card__diag hidden",textContent:()=>this.diagnostics.get().map(o=>o.message).join(" · ")}},t),r=new pe({value:this.teeId,options:{get:()=>this.tees.get().map(o=>({value:o.id,label:o.name}))},placeholder:"Tee"});r.mount(this.ref(i,"teeHost")),t(()=>r.destroy());const d=new pe({value:this.guestGender,options:{get:()=>[{value:"M",label:"Men’s tee rating"},{value:"F",label:"Women’s tee rating"}]},placeholder:"Rating"});return d.mount(this.ref(i,"genderHost")),t(()=>d.destroy()),i}render(){this.track(C(()=>this.ensureTeesLoaded()));const e=this.wire(zh,{root:{className:()=>this.state().visible?"seat-card":"seat-card hidden"},hint:{className:()=>(this.svc.startList.get()?.seats.length??0)>0&&this.state().blockedMessage===null?"seat-card__hint":"seat-card__hint hidden"},blocked:{className:()=>this.state().blockedMessage!==null?"seat-card__blocked":"seat-card__blocked hidden",textContent:()=>this.state().blockedMessage??""},err:{textContent:()=>this.error.get()}});return this.$each(this.ref(e,"rows"),()=>this.svc.startList.get()?.seats??[],(t,n,i)=>this.seatRow(t,i),t=>t.seatId),this.$each(this.ref(e,"releaseRows"),()=>Ah(this.svc.startList.get()),(t,n,i)=>this.wireEl(Bh,{name:()=>t.displayName,context:()=>`holds “${t.seatLabel}”`,release:{disabled:()=>this.claiming.get(),onclick:()=>{this.release(t.seatId)}}},i),t=>t.seatId),e}}function Gh(s,e,t){if(!e||t!=="not_started")return!1;for(const n of s)for(const i of n.players)if(i.playerId===e)return!1;return!0}function jh(s){if(!s)return{visible:!1,blockedMessage:null};const e=s.viewer.join;return e.allowed?{visible:!0,blockedMessage:null}:e.code==="window_not_open"||e.code==="window_closed"?{visible:!0,blockedMessage:e.message??"Sign-up is closed right now."}:{visible:!1,blockedMessage:null}}const ti="new";function Dh(s,e=!0){const t=s.map((i,r)=>{const d=i.ballIds.length,o=[`Group ${r+1}`];return i.startTime.includes(":")&&o.push(i.startTime),{value:i.id,label:`${o.join(" · ")} — ${d} of ${i.capacity}`,disabled:d>=i.capacity}}),n=t.find(i=>!i.disabled);return e&&t.push({value:ti,label:"Start a new group",disabled:!1}),{options:t,defaultValue:n?.value??(e?ti:"")}}const qh=b(`
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
`);class Vh extends M{static styles=`
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
                ${$()}
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
    `;svc=this.inject(be);auth=this.inject(D);router=this.inject(G);tokenQ=this.router.query("token");joining=new f(!1);error=new f("");diagnostics=new f([]);teeId=new f("");tees=new f([]);loadedForCourseId=null;groupChoice=new f("");policyState(){return jh(this.svc.startList.get())}eligible(){return this.policyState().visible&&Gh(this.svc.balls.get(),this.auth.currentUser.get()?.id??null,this.svc.round.get()?.status??null)}ensureTeesLoaded(){if(!this.eligible())return;const e=this.svc.round.get()?.courseId;!e||e===this.loadedForCourseId||(this.loadedForCourseId=e,y.setup.teesByCourse({courseId:e}).then(t=>{this.tees.set(t),!this.teeId.get()&&t[0]&&this.teeId.set(t[0].id)}).catch(()=>{this.loadedForCourseId=null}))}needsProfileUpdate(){return this.diagnostics.get().some(e=>e.code==="missing_gender"||e.code==="missing_handicap_index")}async join(){const e=this.tokenQ.get(),t=this.teeId.get();if(!(!e||!t||this.joining.get())){this.error.set(""),this.diagnostics.set([]),this.joining.set(!0);try{const n=this.groupChoice.get(),i=await y.friendlyRounds.join({token:e,teeId:t,...n?{groupChoice:n}:{}});i.ok?await this.svc.loadByToken(e):this.diagnostics.set(i.diagnostics)}catch(n){this.error.set(n instanceof Y&&n.status===409?n.message??"You already play in this round, or it has already started.":"Could not join right now. Try again.")}finally{this.joining.set(!1)}}}render(){this.track(C(()=>this.ensureTeesLoaded()));const e=new k(()=>Dh(this.svc.groups(),this.svc.startList.get()?.viewer.createGroup.allowed??!0));this.track(C(()=>{const r=e.get(),d=this.groupChoice.get();(!d||!r.options.some(o=>o.value===d&&!o.disabled))&&this.groupChoice.set(r.defaultValue)}));const t=this.wire(qh,{root:{className:()=>this.eligible()?"join-card":"join-card hidden"},blocked:{className:()=>this.policyState().blockedMessage!==null?"join-card__blocked":"join-card__blocked hidden",textContent:()=>this.policyState().blockedMessage??""},groupRow:{className:()=>this.svc.groups().length>0&&this.policyState().blockedMessage===null?"join-card__group":"join-card__group hidden"},row:{className:()=>this.policyState().blockedMessage===null?"join-card__row":"join-card__row hidden"},join:{disabled:()=>this.joining.get()||!this.teeId.get(),onclick:()=>{this.join()}},diag:{className:()=>this.diagnostics.get().length>0?"join-card__diag":"join-card__diag hidden"},diagText:{textContent:()=>this.diagnostics.get().map(r=>r.message).join(" · ")},profileLink:{className:()=>this.needsProfileUpdate()?"join-card__profile-link":"join-card__profile-link hidden",onclick:()=>this.router.navigate("/profile")},err:{textContent:()=>this.error.get()}}),n=new pe({value:this.teeId,options:{get:()=>this.tees.get().map(r=>({value:r.id,label:r.name}))},placeholder:"Tee"});n.mount(this.ref(t,"teeHost")),this.track(()=>n.destroy());const i=new pe({value:this.groupChoice,options:{get:()=>e.get().options},placeholder:"Group"});return i.mount(this.ref(t,"groupHost")),this.track(()=>i.destroy()),t}}const si=1440*60*1e3;function Uh(s,e){if(s===null)return!0;const t=new Date(s).getTime();return!Number.isFinite(t)||t-e>si?!0:e-t>=si}function Kh(s,e){if(!e)return!1;for(const t of s)for(const n of t.players)if(n.playerId===e)return!0;return!1}function Wh(s){const e={visible:!1,index:null};return s.settled||!s.profileLoaded||!s.firstOpen||!Kh(s.balls,s.playerId)||!Uh(s.handicapConfirmedAt,s.now)?e:{visible:!0,index:s.handicapIndex}}function ve(s){const e=s.trim().replace(",",".");if(e==="")return null;const t=e.startsWith("+"),n=Number.parseFloat(t?e.slice(1):e);return Number.isFinite(n)?t?-n:n:null}function qt(s){return s<0?`+${String(-s)}`:String(s)}const Yh=b(`
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
`);class Xh extends M{static styles=`
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
                ${ae()}
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
                ${$()}
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
                ${$()}
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
    `;svc=this.inject(be);auth=this.inject(D);profile=this.inject(Ce);settled=new f(!1);editing=new f(!1);text=new f("");busy=new f(!1);error=new f("");state(){const e=this.profile.player.get();return Wh({playerId:this.auth.currentUser.get()?.id??null,balls:this.svc.balls.get(),firstOpen:this.svc.firstOpen.get(),handicapConfirmedAt:e?.handicapConfirmedAt??null,handicapIndex:e?.handicapIndex??null,profileLoaded:e!==null,settled:this.settled.get(),now:Date.now()})}ensureProfileLoaded(){this.settled.get()||this.svc.firstOpen.get()&&this.auth.currentUser.get()&&this.svc.balls.get().length&&this.profile.load()}async confirm(){if(this.busy.get())return;this.error.set(""),this.busy.set(!0);const e=await this.profile.confirmHandicap();this.busy.set(!1),e?this.settled.set(!0):this.error.set("Could not save that right now. Try again.")}startEdit(){const e=this.profile.player.get()?.handicapIndex??null;this.text.set(e===null?"":qt(e)),this.error.set(""),this.editing.set(!0)}async save(){if(this.busy.get())return;const e=ve(this.text.get());if(e===null){this.error.set("Enter a handicap index, e.g. 18.4 or +2.4.");return}this.error.set(""),this.busy.set(!0);const t=await this.profile.saveIndex(e);this.busy.set(!1),t?(this.editing.set(!1),this.settled.set(!0)):this.error.set("Could not save that right now. Try again.")}render(){return this.track(C(()=>this.ensureProfileLoaded())),this.wire(Yh,{root:{className:()=>this.state().visible?"hcp-checkin":"hcp-checkin hidden"},ask:{className:()=>this.editing.get()?"hcp-checkin__ask hidden":"hcp-checkin__ask"},question:{textContent:()=>{const e=this.state().index;return e===null?"No handicap set — add one?":`Handicap ${qt(e)} — still right?`}},confirm:{textContent:()=>this.state().index===null?"Not now":"Yes",disabled:()=>this.busy.get(),onclick:()=>{this.confirm()}},edit:{textContent:()=>this.state().index===null?"Add":"Update",disabled:()=>this.busy.get(),onclick:()=>this.startEdit()},editor:{className:()=>this.editing.get()?"hcp-checkin__editor":"hcp-checkin__editor hidden"},field:{value:()=>this.text.get(),oninput:e=>this.text.set(e.target.value)},save:{disabled:()=>this.busy.get(),onclick:()=>{this.save()}},cancel:{disabled:()=>this.busy.get(),onclick:()=>this.editing.set(!1)},err:{textContent:()=>this.error.get()}})}}function Qh(s,e){if(!e)return!1;for(const t of s)for(const n of t.players)if(n.playerId===e)return!0;return!1}const Jh=b(`
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
`);class Zh extends M{static styles=`
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
    `;svc=this.inject(be);auth=this.inject(D);router=this.inject(G);tokenQ=this.router.query("token");editable=new f(!1);deleteOpen=new f(!1);finishOpen=new f(!1);finishAsReopen=new f(!1);leaveOpen=new f(!1);leaving=new f(!1);error=new f("");diagnostics=new f([]);isComplete(){return this.svc.round.get()?.status==="complete"}canLeave(){return Qh(this.svc.balls.get(),this.auth.currentUser.get()?.id??null)}canDelete(){const e=this.auth.currentUser.get()?.id??null;return e!==null&&this.svc.friendlyRound.get()?.creatorPlayerId===e}clear(){this.error.set(""),this.diagnostics.set([])}async leave(){const e=this.tokenQ.get();if(!(!e||this.leaving.get())){this.clear(),this.leaving.set(!0);try{const t=await y.friendlyRounds.leave({token:e});t.ok?await this.svc.loadByToken(e):this.diagnostics.set(t.diagnostics)}catch{this.error.set("Could not remove you right now. Try again.")}finally{this.leaving.set(!1)}}}render(){this.track(C(()=>{const r=this.tokenQ.get();this.editable.set(!1),r&&y.friendlyRounds.setup({token:r}).then(d=>{this.tokenQ.get()===r&&this.editable.set(d.editable===!0)}).catch(()=>{})})),this.track(C(()=>{this.props.open.get()&&this.clear()}));const e=this.wire(Jh,{root:{className:()=>this.props.open.get()?"rmanage":"rmanage hidden"},backdrop:{onclick:()=>this.props.open.set(!1)},close:{onclick:()=>this.props.open.set(!1)},editRow:{className:()=>this.editable.get()?"rmanage__row":"rmanage__row hidden",onclick:()=>{const r=this.tokenQ.get();r&&(this.props.open.set(!1),this.router.navigate("/create",{query:{token:r}}))}},leaveRow:{className:()=>this.canLeave()?"rmanage__row rmanage__row--danger":"rmanage__row rmanage__row--danger hidden",onclick:()=>this.leaveOpen.set(!0),disabled:()=>this.leaving.get()},finishRow:{onclick:()=>{this.finishAsReopen.set(this.isComplete()),this.finishOpen.set(!0)},disabled:()=>this.svc.finishing.get()},finishTitle:()=>this.isComplete()?"Reopen round":"Finish round",finishSub:()=>this.isComplete()?"Move it back to your ongoing rounds.":"Move it to your finished rounds. Nothing is locked.",deleteRow:{className:()=>this.canDelete()?"rmanage__row rmanage__row--danger":"rmanage__row rmanage__row--danger hidden",onclick:()=>this.deleteOpen.set(!0),disabled:()=>this.svc.deleting.get()},diag:{textContent:()=>this.diagnostics.get().map(r=>r.message).join(" · ")},err:{textContent:()=>this.error.get()}});this.spawn(oe,this.ref(e,"deleteConfirmHost"),{open:this.deleteOpen,title:"Delete round?",message:"This permanently removes the round and all its scores for everyone. This can't be undone.",confirmLabel:"Delete",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.clear(),this.svc.deleteRound().then(r=>{r?this.router.navigate("/"):this.error.set("Could not delete the round. Try again.")})}}),this.spawn(oe,this.ref(e,"finishConfirmHost"),{open:this.finishOpen,title:()=>this.finishAsReopen.get()?"Reopen this round?":"Finish this round?",message:()=>this.finishAsReopen.get()?"It'll move back to your ongoing rounds.":"It'll move to your finished rounds. You can still edit or reopen it any time.",confirmLabel:()=>this.finishAsReopen.get()?"Reopen round":"Finish round",cancelLabel:"Cancel",onconfirm:()=>{this.clear(),(this.finishAsReopen.get()?this.svc.reopenRound():this.svc.finishRound()).then(d=>{d||this.error.set("Could not update the round. Try again.")})}}),this.spawn(oe,this.ref(e,"leaveConfirmHost"),{open:this.leaveOpen,title:"Remove yourself from this round?",message:"Your scores here will be deleted. Everyone else's stay, and the round keeps going without you.",confirmLabel:"Remove me",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.leave()}});let t=null;const n=this.ref(e,"close");this.track(C(()=>{this.props.open.get()?(t=document.activeElement instanceof HTMLElement?document.activeElement:null,queueMicrotask(()=>n.focus())):t&&(t.focus(),t=null)}));const i=r=>{if(r.key==="Escape"){if(this.deleteOpen.get())return void this.deleteOpen.set(!1);if(this.finishOpen.get())return void this.finishOpen.set(!1);if(this.leaveOpen.get())return void this.leaveOpen.set(!1);this.props.open.get()&&this.props.open.set(!1)}};return window.addEventListener("keydown",i),this.track(()=>window.removeEventListener("keydown",i)),e}}function ep(s){const{balls:e,groups:t,strokesFor:n}=s,i=new Set(e.filter(d=>!d.pending).map(d=>d.id));let r=0;for(const d of t)for(const o of d.ballIds)if(i.has(o))for(const c of d.playedOrder)n(o,c.playHoleId)===null&&r++;return r}function tp(s){return s<=0?null:s===1?"1 score is still missing.":`${s} scores are still missing.`}function sp(s,e,t=!0){if(s===null||e===null||s<=0)return null;const n=s-e;return n===0?null:s===1&&t||n<=-3?"diamond":n===-2?"double_ring":n===-1?"ring":n===1?"square":n===2?"double_square":"box_badge"}function np(s){const e=s.par,t=s.score,n=t===0,i=n?null:t,r=s.stats;return{id:s.playHoleId,ordinal:s.ordinal,holeNumber:s.courseHoleNumber,par:e,lengthM:s.lengthM,strokes:i,isPickedUp:n,vsPar:i===null?null:i-e,marker:sp(i,e),tee:r.teeResult,gir:r.gir,putts:r.putts,firstPutt:r.firstPutt,shortGame:r.shortGameDifficulty,penalties:r.penalties,recoveryOk:r.recoveryOk}}function ip(s){return(s.penalties??0)>0}const Ks=10,rp=3;function ap(s){const{round:e,holes:t,history:n,windowSize:i=Ks,insightLimit:r=rp,bundle:d=mt}=s,o=un([e],d),c=o.waterfall,p=op(e,n,i).map(h=>Ft(h.measures,d)),m=o.rounds[0];return{roundId:e.roundId,date:e.date,courseName:e.courseName,name:e.name,holeCount:e.holeCount,strokes:m?.strokes??null,vsPar:m?.vsPar??null,cells:[...t].sort((h,g)=>h.ordinal-g.ordinal).map(np),panels:o,waterfall:c,deltas:p.length===0?null:Tr(c,p),windowCount:p.length,insights:wc(e.measures,c,p,r)}}function op(s,e,t){const n=e.filter(d=>d.roundId!==s.roundId);n.push(s);const i=ts(n),r=i.findIndex(d=>d.roundId===s.roundId);return r===-1?[]:i.slice(r+1,r+1+Math.max(0,t))}function ni(s,e,t){const n=ts(s),i=n.findIndex(r=>r.roundId===e);return i===-1?!1:n.length-(i+1)>=t}function ii(s){const e=(s.name??"").trim();if(e!=="")return e;const t=(s.courseName??"").trim();return t===""?"Round":t}function Vr(s){const{signedInPlayerId:e,statConfigPlayerIds:t,statRows:n,holesUnscored:i}=s;return e===null||e===""?{reason:"notSignedIn",playerId:null}:t.has(e)?n.some(d=>d.playerId===e&&lp(d))?i!==0?{reason:"roundUnfinished",playerId:null}:{reason:"eligible",playerId:e}:{reason:"noStatsRecorded",playerId:null}:{reason:"noStatsConfigured",playerId:null}}function lp(s){return s.teeResult!==null||s.gir!==null||s.firstPutt!==null||s.putts!==null||s.shortGameDifficulty!==null||s.penalties!==null||s.recoveryOk!==null}function Ur(s){const{playerId:e,balls:t,groups:n,strokesFor:i}=s,r=t.find(o=>o.players.some(c=>c.playerId===e));if(!r)return null;const d=n.find(o=>o.ballIds.includes(r.id));return d?d.playedOrder.filter(o=>i(r.id,o.playHoleId)===null).length:null}function Kr(s,e=typeof navigator>"u"?"en":navigator.language){const t=(s?.name??"").trim();if(t)return t;const n=s?.date??"";return/^\d{4}-\d{2}-\d{2}$/.test(n)?new Intl.DateTimeFormat(e,{dateStyle:"medium",timeZone:"UTC"}).format(new Date(`${n}T12:00:00Z`)):n||"Round"}const dp=b(`
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
`);class cp extends M{static styles=`
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
                ${$()}
                width: 100%;
                min-height: 52px;
                font-family: inherit; font-size: 1rem; font-weight: 700;
                background: ${l("primary")};
                color: ${l("primary-text")};
                border: none;
            }
            & .ffl__back {
                ${$()}
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
    `;svc=this.inject(be);auth=this.inject(D);router=this.inject(G);stage=new f("prompt");error=new f("");render(){this.track(C(()=>{this.svc.finishFlowOpen.get()&&(this.stage.set("prompt"),this.error.set(""))}));const e=this.wire(dp,{root:{className:()=>this.svc.finishFlowOpen.get()?"ffl":"ffl hidden"},prompt:{className:()=>this.stage.get()==="prompt"?"ffl__prompt":"ffl__prompt hidden"},board:{className:()=>this.stage.get()==="board"?"ffl__board":"ffl__board hidden"},roundName:()=>this.roundLine(),boardRound:()=>this.roundLine(),missing:()=>tp(this.missingCount())??"",err:()=>this.error.get(),finishBtn:{onclick:()=>{this.finish()},disabled:()=>this.svc.finishing.get()},backBtn:{onclick:()=>this.svc.finishFlowOpen.set(!1)},nextBtn:{textContent:()=>this.statsEligible()?"View stats":"Close",onclick:()=>this.leave()}});this.spawn(bn,this.ref(e,"leaderboard"));const t=n=>{n.key==="Escape"&&this.svc.finishFlowOpen.get()&&this.stage.get()==="prompt"&&this.svc.finishFlowOpen.set(!1)};return window.addEventListener("keydown",t),this.track(()=>window.removeEventListener("keydown",t)),e}roundLine(){const e=this.svc.round.get();if(e===null)return"";const t=Kr(e),n=(e.courseNameSnapshot??"").trim();return n!==""&&n!==t?`${t} · ${n}`:t}missingCount(){return ep({balls:this.svc.balls.get(),groups:this.svc.groups(),strokesFor:(e,t)=>this.svc.strokesFor(e,t)})}async finish(){if(this.error.set(""),await this.svc.finishRound()===null){this.error.set("Could not finish the round. Try again.");return}this.stage.set("board"),this.svc.loadResult()}statsEligible(){return Vr({signedInPlayerId:this.auth.currentUser.get()?.id??null,statConfigPlayerIds:new Set(this.svc.statModules.get().keys()),statRows:this.svc.statRows.get(),holesUnscored:Ur({playerId:this.auth.currentUser.get()?.id??"",balls:this.svc.balls.get(),groups:this.svc.groups(),strokesFor:(e,t)=>this.svc.strokesFor(e,t)})}).reason==="eligible"}leave(){const e=this.svc.round.get()?.id??null,t=this.statsEligible();this.svc.finishFlowOpen.set(!1),t&&e!==null?this.router.navigate("/round-stats",{query:{id:e,finish:"1"}}):this.router.navigate("/")}}class Ae{static PAGE_SIZE=50;static MAX_PAGES=40;loading=new f(!1);error=new f(null);loaded=new f(!1);loadedRounds=new f([]);roundsWithStats=new f(null);hasMore=new f(!1);preset=new f(Gs());filter=new f(it);sgChoice=new f(Ds());profile=U.get(Ce);handicapIndex=new k(()=>this.profile.player.get()?.handicapIndex??null);sgCohort=new k(()=>cn(this.sgChoice.get(),this.handicapIndex.get()));sgBundle=new k(()=>ft[this.sgCohort.get()]);sgInfo=new k(()=>kc(this.sgChoice.get(),this.handicapIndex.get()));extending=new f(!1);extendError=new f(null);pagesFetched=0;cursor=null;windowRounds=new k(()=>pr(this.preset.get(),this.filter.get(),this.loadedRounds.get(),new Date));model=new k(()=>un(this.windowRounds.get(),this.sgBundle.get()));courses=new k(()=>ad(this.loadedRounds.get()));overFiltered=new k(()=>this.loadedRounds.get().length>0&&this.windowRounds.get().length===0);async load(e=!1){if(!e&&(this.loaded.get()||this.loading.get()))return;this.pagesFetched=0,this.cursor=null,this.extendError.set(null);const t=await F(this.loading,this.error,()=>y.playerStats.myStats({limit:Ae.PAGE_SIZE}));if(!t)return;const n=Gt(t.rounds);if(n!==null){this.error.set({code:"server",message:n});return}this.pagesFetched=1,this.roundsWithStats.set(t.roundsWithStats),this.loadedRounds.set(t.rounds),this.cursor=t.nextCursor,this.hasMore.set(t.nextCursor!==null),this.loaded.set(!0),await this.extendIfNeeded()}select(e){this.preset.set(e),Fn(e),this.extendIfNeeded()}selectSgBaseline(e){this.sgChoice.set(e),Tc(e)}async loadHandicap(){await this.profile.load()}applyFilter(e){this.filter.set(e),this.preset.set("custom"),Fn("custom"),this.extendIfNeeded()}clearFilter(){this.filter.set(it),this.select(Lt)}async extendIfNeeded(){if(!(this.extending.get()||this.loading.get())){this.extendError.set(null),this.extending.set(!0);try{for(;this.cursor!==null&&this.pagesFetched<Ae.MAX_PAGES&&fr({preset:this.preset.get(),filter:this.filter.get(),loaded:this.loadedRounds.get(),hasMore:this.hasMore.get(),now:new Date});){const e=this.cursor;let t;try{t=await y.playerStats.myStats({limit:Ae.PAGE_SIZE,cursor:e})}catch{this.extendError.set({code:"network",message:"Could not load older rounds."});return}const n=Gt(t.rounds);if(n!==null){this.extendError.set({code:"server",message:n});return}this.pagesFetched+=1,this.appendRounds(t.rounds),this.cursor=t.nextCursor,this.hasMore.set(t.nextCursor!==null)}}finally{this.extending.set(!1)}}}budgetSpent(){return this.pagesFetched>=Ae.MAX_PAGES&&this.hasMore.get()}loadedCount(){return this.loadedRounds.get().length}clear(){this.loadedRounds.set([]),this.roundsWithStats.set(null),this.hasMore.set(!1),this.loaded.set(!1),this.error.set(null),this.extendError.set(null),this.filter.set(it),this.pagesFetched=0,this.cursor=null}appendRounds(e){const t=new Set(this.loadedRounds.get().map(i=>i.roundId)),n=e.filter(i=>!t.has(i.roundId));n.length!==0&&this.loadedRounds.set([...this.loadedRounds.get(),...n])}}class ht{static PAGE_SIZE=50;static MAX_PAGES=8;phase=new f("idle");failure=new f(null);roundId=new f(null);holes=new f([]);round=new f(null);history=new f([]);dashboard=U.get(Ae);inFlight=null;sgInfo=this.dashboard.sgInfo;model=new k(()=>{const e=this.round.get();return e===null?null:ap({round:e,holes:this.holes.get(),history:this.history.get(),bundle:this.dashboard.sgBundle.get()})});async load(e,t=!1){if(!t&&(this.roundId.get()===e||this.inFlight===e))return;this.dashboard.loadHandicap(),this.inFlight=e,this.phase.set("loading"),this.failure.set(null),this.roundId.set(null),this.holes.set([]),this.round.set(null),this.history.set([]);let n;try{n=await y.playerStats.myRoundStats({roundId:e})}catch(d){if(this.inFlight!==e)return;this.inFlight=null,this.phase.set(ri(d)),this.failure.set(ai(d));return}if(this.inFlight!==e)return;let i;try{i=await this.walkHistory(e)}catch(d){if(this.inFlight!==e)return;this.inFlight=null,this.phase.set(ri(d)),this.failure.set(ai(d));return}if(this.inFlight!==e)return;this.inFlight=null;const r=i.find(d=>d.roundId===e)??null;if(r===null){this.phase.set("notFound");return}this.roundId.set(e),this.holes.set(n),this.round.set(r),this.history.set(i.filter(d=>d.roundId!==e)),this.phase.set("ready")}async walkHistory(e){const t=[],n=new Set,i=d=>{for(const o of d)n.has(o.roundId)||(n.add(o.roundId),t.push(o))};if(i(this.dashboard.loadedRounds.get()),ni(t,e,Ks))return t;let r=null;for(let d=0;d<ht.MAX_PAGES;d++){const o=await y.playerStats.myStats({limit:ht.PAGE_SIZE,cursor:r??void 0}),c=Gt(o.rounds);if(c!==null)throw new Error(c);if(i(o.rounds),ni(t,e,Ks)||o.nextCursor===null)return t;r=o.nextCursor}return t}clear(){this.roundId.set(null),this.holes.set([]),this.round.set(null),this.history.set([]),this.phase.set("idle"),this.failure.set(null),this.inFlight=null}}function ri(s){if(s instanceof Y){if(s.status===401||s.status===403)return"notAuthorized";if(s.status===404)return"notFound"}return"failed"}function ai(s){return s instanceof Y&&(s.status===404||s.status===401||s.status===403)?null:s instanceof Error?s.message:"Something went wrong."}const re=100,Wr=88,Ws=56,oi=56;function ds(s){return s>0?"loss":s<0?"gain":"zero"}function Ye(s,e){switch(s){case"gain":return e.gain;case"loss":return e.loss;case"zero":return e.zero;case"neutral":return e.neutral}}function H(s){return String(Math.round(s*1e3)/1e3)}function cs(s){return s<0?0:s>1?1:s}function Pe(s,e){return`<svg class="chart" viewBox="0 0 ${re} ${H(s)}" preserveAspectRatio="none" style="height:${H(s)}px" aria-hidden="true" focusable="false">${e}</svg>`}function _n(s,e,t,n=1){return`<path d="M${H(s)} 0 L${H(s)} ${H(e)}" stroke="${t}" stroke-width="${H(n)}" vector-effect="non-scaling-stroke" fill="none"/>`}function ge(s,e,t,n,i){return`<rect x="${H(s)}" y="${H(e)}" width="${H(t)}" height="${H(n)}" fill="${i}"/>`}const up=1;function hp(s,e){const t=re/2,n=ds(s);if(!(e>0))return{zeroX:t,bar:null,tone:n};const i=Math.min(1,Math.abs(s)/e),r=Math.max(s===0?0:up,t*i);return{zeroX:t,bar:{x:s>=0?t:t-r,width:r},tone:n}}function Yr(s,e,t,n=10){const i=hp(s,e),r=i.bar&&i.bar.width>0?ge(i.bar.x,0,i.bar.width,n,Ye(i.tone,t)):"";return Pe(n,[ge(0,0,re,n,t.track),r,_n(i.zeroX,n,t.rule)].join(""))}function pp(s){const e=[];let t=0;for(const n of s){const i=re*cs(n.share);e.push({id:n.id,x:t,width:i,color:n.color}),t+=i}return e}function fp(s,e,t=12){const n=pp(s).filter(i=>i.width>0).map(i=>ge(i.x,0,i.width,t,i.color)).join("");return Pe(t,ge(0,0,re,t,e.track)+n)}const li=2,mp=1e-4;function gp(s,e=34){if(s.length===0)return[];const t=Math.min(...s),i=Math.max(...s)-t,r=li,d=Math.max(0,e-li*2);return s.map((o,c)=>({x:s.length===1?re/2:c/(s.length-1)*re,y:i===0?e/2:r+d-(o-t)/i*d}))}function bp(s){return s.map((e,t)=>`${t===0?"M":"L"}${H(e.x)} ${H(e.y)}`).join(" ")}function _p(s,e){const t=s[0],n=s[s.length-1];if(t===void 0||n===void 0)return"neutral";const i=n-t;return Math.abs(i)<=mp?"neutral":(e==="percentage"?i>0:i<0)?"gain":"loss"}function yp(s,e,t,n=34){const i=gp(s,n);if(i.length===0)return Pe(n,"");const r=Ye(_p(s,e),t),d=`<path d="${bp(i)}" fill="none" stroke="${r}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`,o=i[i.length-1],c=`<path d="M${H(o.x)} ${H(o.y)} L${H(o.x)} ${H(o.y)}" stroke="${r}" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke" fill="none"/>`;return Pe(n,d+c)}const vp=.5;function wp(s,e,t=12){const n=re/2,i=ue.length-1,r=Math.max(1,(t-i)/ue.length),d=[];return ue.forEach((o,c)=>{const u=Ke(s,o);if(u===null||!(e>0))return;const p=Math.max(u===0?0:vp,n*Math.min(1,Math.abs(u)/e));d.push({component:o,x:u>=0?n:n-p,y:c*(r+1),width:p,height:r,tone:ds(u)})}),d}function xp(s,e,t,n=12){const i=wp(s,e,n).filter(r=>r.width>0).map(r=>ge(r.x,r.y,r.width,r.height,Ye(r.tone,t))).join("");return Pe(n,_n(re/2,n,t.rule)+i)}const Xr=1,di=.02;function $p(s,e){const t=e>0?re*Math.min(1,e):null;if(s===null)return{bar:null,tickX:t};const n=cs(s),i=e<=0?"neutral":s>e+di?"gain":s<e-di?"loss":"neutral";return{bar:{width:Math.max(Xr,re*n),tone:i},tickX:t}}function kp(s,e,t,n=10){const i=$p(s,e),r=i.bar?ge(0,0,i.bar.width,n,Ye(i.bar.tone,t)):"",d=i.tickX===null?"":_n(i.tickX,n,t.rule,2);return Pe(n,ge(0,0,re,n,t.track)+r+d)}function Sp(s){return s===null?null:Math.max(Xr,re*cs(s))}function Qr(s,e,t=e.neutral,n=8){const i=Sp(s),r=i===null?"":ge(0,0,i,n,t);return Pe(n,ge(0,0,re,n,e.track)+r)}const ci=100,Vt=50,Tp=16,Tt=22,ui=44,Pp=3,Cp=33,Ip={long:{from:315,to:405},right:{from:45,to:135},short:{from:135,to:225},left:{from:225,to:315}};function st(s,e){const t=(s-90)*Math.PI/180;return{x:Vt+e*Math.cos(t),y:Vt+e*Math.sin(t)}}function hi(s,e,t,n){const i=e-s>180?1:0,r=st(s,n),d=st(e,n),o=st(e,t),c=st(s,t);return`M${H(r.x)} ${H(r.y)} A${H(n)} ${H(n)} 0 ${i} 1 ${H(d.x)} ${H(d.y)} L${H(o.x)} ${H(o.y)} A${H(t)} ${H(t)} 0 ${i} 0 ${H(c.x)} ${H(c.y)} Z`}function Ep(s){const e=Math.max(s.long,s.short,s.left,s.right),t=Pp/2,n=[];for(const i of["long","right","short","left"]){const r=Ip[i],d=r.from+t,o=r.to-t,c=e>0?cs(s[i]/e):0,u=Tt+(ui-Tt)*c,p=st((r.from+r.to)/2,Cp);n.push({id:i,trackPath:hi(d,o,Tt,ui),valuePath:hi(d,o,Tt,u),labelX:p.x,labelY:p.y})}return n}function Rp(s,e,t,n=132){const i=s.map(r=>`<path d="${r.trackPath}" fill="${t.track}"/>`).join("")+s.map(r=>`<path d="${r.valuePath}" fill="${t.neutral}"/>`).join("")+`<circle cx="${H(Vt)}" cy="${H(Vt)}" r="${H(Tp)}" fill="${t.track}"/>`+s.map(r=>`<text x="${H(r.labelX)}" y="${H(r.labelY)}" fill="${t.rule}" font-size="7" text-anchor="middle" dominant-baseline="middle">${e[r.id]}</text>`).join("");return`<svg class="chart chart--compass" viewBox="0 0 ${ci} ${ci}" preserveAspectRatio="xMidYMid meet" style="width:${H(n)}px;height:${H(n)}px" aria-hidden="true" focusable="false">${i}</svg>`}const Np=60,Ut=58,Op=2,Hp={left:{x:6,width:24},centre:{x:38,width:24},right:{x:70,width:24}};function Mp(s,e){const t=Ut-Op,n=d=>e>0?d/e*t:0,i=[],r=(d,o)=>{const c=Hp[d];let u=Ut;for(const p of o){const m=n(p.count);u-=m,i.push({id:p.id,column:d,tone:p.tone,x:c.x,y:u,width:c.width,height:m})}};return r("left",[{id:"left-inplay",tone:"inplay",count:s.leftInPlay},{id:"left-trouble",tone:"trouble",count:s.leftTrouble}]),r("centre",[{id:"fairway",tone:"fairway",count:s.fairway}]),r("right",[{id:"right-inplay",tone:"inplay",count:s.rightInPlay},{id:"right-trouble",tone:"trouble",count:s.rightTrouble}]),i}function Ap(s,e,t){const n=s.filter(i=>i.height>0).map(i=>ge(i.x,i.y,i.width,i.height,e[i.tone])).join("")+`<path d="M0 ${H(Ut)} L${H(re)} ${H(Ut)}" stroke="${t.rule}" stroke-width="1" vector-effect="non-scaling-stroke" fill="none"/>`;return Pe(Np,n)}const us={gain:l("accent-strong"),loss:l("danger"),zero:l("border-strong"),neutral:l("accent"),track:l("surface-sunken"),rule:l("border")},S={intro:"Every window is added up on this device from the rounds you have recorded.",loading:"Adding up your rounds…",noStats:"No rounds with statistics yet. Turn statistics on in your profile and they start filling in as you score.",windowEmpty:"No rounds match this window. Widen the filter, or clear it to go back to your last 10 rounds.",extending:"Loading more history…",extendProblemPrefix:"Showing the rounds loaded so far — fetching older ones failed: ",budgetSpent:"Showing the most recent rounds — this window stops short of your whole history.",notEnoughData:"Not enough data",notRecorded:"Not recorded",priorities:"Practice priorities",prioritiesHint:"Where your shots go, worst first. Positive costs you shots.",prioritiesInfo:"How this works",trends:"Trends",trendsHint:"Oldest round on the left. A round with no reading is skipped, never plotted as zero.",roundsHeading:"Rounds in this window",roundsHint:"Each strip is that round’s five terms, on one shared scale.",filterClear:"Clear filter",filterRoundsHint:"Uncheck a round below to leave it out of a custom window.",filterBaseline:"Compared to",filterBaselineHint:"Which player the strokes-gained rows measure you against. It does not change which rounds are in the window.",troubleTax:"Extra strokes per hole when the tee shot finds trouble, against your own fairway holes.",recovery:"Holes where the shot after trouble got you back in play.",penalties:"Penalty strokes per round.",noValue:Rr,proximityProxy:"How far the first putt was on greens you hit — a stand-in for approach proximity, which the app does not measure directly.",birdieConversion:"Greens hit that became a birdie or better.",ladderBaseline:"The tick is the make rate your reference expects from that distance. For the two longest bands it sits at zero: the reference expects two putts from there, so any make is ahead of it.",ladderCost:"Cost is how many strokes this distance has cost you across the window, against the reference you picked. Plus means it cost you shots; minus means you gained them.",missedGreenTax:"The difference between what a hole costs you with the green hit and with it missed.",threePutt:"Holes with three putts or more.",longThreePutt:"Three-putts that started from over 8 m.",puttsPerGir:"Putts taken on holes where you hit the green.",conversionInside2m:"First putts from inside 2 m that went in — across every hole, not only chipped ones. The app records no chip-and-hole cross-tab.",chipIns:"Short-game shots that went in without a putt.",vsParByTee:"What each kind of tee shot actually cost you, per hole. The trouble tax below is the difference between the last row and the first.",firstPuttSpread:"Where the first putt was on every hole you recorded one — not only the greens you hit.",puttsAfterMissedGreen:"Putts taken on holes where you missed the green.",hardChipShare:"How often a missed green left a hard chip or pitch rather than a standard one.",greenMissHead:"Where you miss the green",greenMiss:"Recorded misses only. Long is past the flag, short is in front of it.",teeFanHead:"Where your tee shots finish",teeFan:"Side is recorded whenever the drive left the fairway. The darker block is trouble.",sandSave:"Missed greens from a bunker where you still got up and down.",multiChip:"Missed greens that took more than one shot to reach the green. Holes where you did not count are treated as one.",multiChipBunker:"Bunker holes that took more than one shot to get out.",extraShortGameStrokes:"Short-game shots beyond one per missed green, across this window.",penaltySourceInfoTitle:"Where the penalties came from",resultsHeading:"Results",scoreTypesHead:"Holes by score",doubleBogeyPlus:"Holes at double bogey or worse, per round.",bounceBack:"Holes after a bogey or worse that came back at par or better."};function j(s,e,t){return{kind:"bar",id:s,title:e,share:t.value,value:he(t)}}function K(s,e,t,n=null){return{kind:"figure",id:s,title:e,value:t,hint:n}}const zp=["Holed","Cost"];function Lp(s){const e=s.value===null?S.notRecorded:`${s.value} holed`;if(s.cost===S.noValue)return`${s.title}, ${e}, ${S.notRecorded}`;const t=s.cost.replace(/^[+\u2212]/,"");return s.cost.startsWith("+")?`${s.title}, ${e}, ${t} strokes lost`:s.cost.startsWith("−")?`${s.title}, ${e}, ${t} strokes gained`:`${s.title}, ${e}, level`}function Bp(s,e){switch(s){case"tee":{const t=e.tee&&xs(e.tee.fairway);return t?`Fairways ${t}`:null}case"approach":{const t=e.approach&&xs(e.approach.gir);return t?`Greens in regulation ${t}`:null}case"putting":return e.putting?le(e.putting.puttsPerGirHole,{unit:De,label:"putts per green hit"}):null;case"shortGame":{const t=e.shortGame&&xs(e.shortGame.scramble.overall);return t?`Scrambling ${t}`:null}case"scoring":return e.scoring?le(e.scoring.doubleBogeyPlusPerRound,{unit:me,label:"doubles or worse per round"}):null}}function Fp(s){return K("troubleTax","Trouble tax",ct(s.troubleTax,2,!0),null)}function Is(s){return le(s,{unit:W,signed:!0})}function Gp(s){const e={long:s.greenMiss.long.value??0,short:s.greenMiss.short.value??0,left:s.greenMiss.left.value??0,right:s.greenMiss.right.value??0},t=i=>he(i)??"",n=(i,r)=>`${i} ${he(r)??S.notRecorded}`;return{kind:"compass",id:"greenMiss",sectors:Ep(e),labels:{long:t(s.greenMiss.long),short:t(s.greenMiss.short),left:t(s.greenMiss.left),right:t(s.greenMiss.right)},text:[n("Long",s.greenMiss.long),n("Short",s.greenMiss.short),n("Left",s.greenMiss.left),n("Right",s.greenMiss.right)].join(" · "),recorded:s.greenMissRecorded}}function jp(s){const e=s.teeFan;return{kind:"fan",id:"teeFan",columns:Mp(e,s.teeRecorded),text:[`Left ${ie(e.leftInPlay+e.leftTrouble)}`,`Fairway ${ie(e.fairway)}`,`Right ${ie(e.rightInPlay+e.rightTrouble)}`].join(" · "),recorded:s.teeRecorded}}function Dp(s){return s.vsParByTee.fairway.d>0||s.vsParByTee.inPlay.d>0||s.vsParByTee.trouble.d>0}function pi(s,e){switch(s){case"tee":{const t=e.tee;return t?[{kind:"split",id:"teeSplit",segments:[{id:"fairway",title:"Fairway",tone:"fairway",share:t.fairway.value,value:he(t.fairway)},{id:"inPlay",title:"In play",tone:"inplay",share:t.inPlayOnly.value,value:he(t.inPlayOnly)},{id:"trouble",title:"Trouble",tone:"trouble",share:t.trouble.value,value:he(t.trouble)}]},...t.teeMissRecorded>0?[{kind:"subhead",id:"teeFanHead",text:S.teeFanHead},jp(t)]:[],...Dp(t)?[{kind:"subhead",id:"vsParByTeeHead",text:"Average vs par, by where the tee shot finished"},K("vsParFairway","From the fairway",Is(t.vsParByTee.fairway)),K("vsParInPlay","From in play",Is(t.vsParByTee.inPlay)),K("vsParTrouble","From trouble",Is(t.vsParByTee.trouble))]:[],Fp(t),j("recovery","Recovery",t.recovery),...t.penaltiesRecordedHoles>0?[K("penalties","Penalties",le(t.penaltiesPerRound,{unit:me})),j("penaltyHoleShare","Holes with a penalty",t.penaltyHoleShare),K("penaltyTax","Penalty tax",ct(t.penaltyTax,2,!0))]:[]]:[]}case"approach":{const t=e.approach;return t?[...t.greenMissRecorded>0?[{kind:"subhead",id:"greenMissHead",text:S.greenMissHead},Gp(t)]:[],{kind:"subhead",id:"girByTee",text:"Greens hit, by where the tee shot finished"},j("girFairway","From the fairway",t.girByTee.fairway),j("girInPlay","From in play",t.girByTee.inPlay),j("girTrouble","From trouble",t.girByTee.trouble),{kind:"subhead",id:"girByParHead",text:"Greens hit, by par"},j("girPar3","Par 3",t.girByPar.par3),j("girPar4","Par 4",t.girByPar.par4),j("girPar5","Par 5",t.girByPar.par5),{kind:"subhead",id:"mixHead",text:"Proximity with GIR"},...ze.map(n=>j(`mix-${n}`,$s(n),t.girFirstPuttMix[n])),j("birdieConversion","Birdie conversion",t.birdieConversion),...t.hardChipShare.d>0?[j("hardChipShare","Hard misses",t.hardChipShare)]:[],...t.costOfMissedGreen.hit.d>0||t.costOfMissedGreen.miss.d>0?[{kind:"subhead",id:"missedGreenHead",text:"Cost of a missed green"},K("vsParGreenHit","Green hit",le(t.costOfMissedGreen.hit,{unit:De,signed:!0})),K("vsParGreenMissed","Green missed",le(t.costOfMissedGreen.miss,{unit:W,signed:!0})),K("missedGreenTax","Missed-green tax",ct(t.costOfMissedGreen.delta,2,!0))]:[]]:[]}case"putting":{const t=e.putting;return t?[...t.firstPuttSpread[ze[0]].d>0?[{kind:"subhead",id:"firstPuttHead",text:"First putt, all holes"},...ze.map(n=>j(`spread-${n}`,$s(n),t.firstPuttSpread[n]))]:[],{kind:"subhead",id:"ladderHead",text:"Holed on the first putt"},{kind:"columns",id:"ladderCols",cells:[...zp]},...t.ladder.map(n=>({kind:"rung",id:`rung-${n.bucket}`,title:$s(n.bucket),made:n.made.value,baseline:n.baseline,value:he(n.made),cost:Zc(n.cost)})),...t.puttDistribution.zero.d>0?[{kind:"subhead",id:"puttCountHead",text:"Holes by putts"},j("putts-zero","No putts",t.puttDistribution.zero),j("putts-one","One putt",t.puttDistribution.one),j("putts-two","Two putts",t.puttDistribution.two),j("putts-threePlus","Three or more",t.puttDistribution.threePlus)]:[],j("longThreePutt","Three-putts from over 8 m",t.threePuttsFromOver8m),K("puttsPerGir","Putts per green hit",le(t.puttsPerGirHole,{unit:De})),...t.puttsAfterMissedGreen.d>0?[K("puttsAfterMissedGreen","Putts after a missed green",le(t.puttsAfterMissedGreen,{unit:W}))]:[],...t.puttDistribution.zero.d>0?[{kind:"subhead",id:"puttsByParHead",text:"Putts per hole, by par"},K("puttsPar3","Par 3",le(t.puttsPerHoleByPar.par3,{unit:W})),K("puttsPar4","Par 4",le(t.puttsPerHoleByPar.par4,{unit:W})),K("puttsPar5","Par 5",le(t.puttsPerHoleByPar.par5,{unit:W}))]:[]]:[]}case"shortGame":{const t=e.shortGame;return t?[{kind:"subhead",id:"scrambleHead",text:"Scrambling"},j("scrambleStandard","Standard",t.scramble.standard),j("scrambleHard","Hard",t.scramble.hard),...t.scrambleAttemptsBunker>0?[j("scrambleBunker","Bunker",t.scramble.bunker)]:[],...t.scrambleAttemptsBunker>0?[j("sandSave","Sand save",t.sandSave)]:[],...t.shortGameStrokesRecorded>0?[j("multiChipBunker","More than one from sand",t.multiChipBunker),K("extraShortGameStrokes","Extra short-game shots",String(t.extraShortGameStrokes)),j("multiChip","More than one chip",t.multiChip)]:[],{kind:"subhead",id:"chipHead",text:"Chipped to inside 2 m"},j("chipStandard","Standard",t.chipInside2m.standard),j("chipHard","Hard",t.chipInside2m.hard),...t.scrambleAttemptsBunker>0?[j("chipBunker","Bunker",t.chipInside2m.bunker)]:[],j("conversionInside2m","Holed from inside 2 m",t.conversionInside2m),{kind:"subhead",id:"chipInsHead",text:"Chip-ins"},K("chipInsStandard","Standard",ie(t.chipIns.standard)),K("chipInsHard","Hard",ie(t.chipIns.hard)),...t.scrambleAttemptsBunker>0?[K("chipInsBunker","Bunker",ie(t.chipIns.bunker))]:[]]:[]}case"scoring":{const t=e.scoring;if(!t)return[];const n=i=>le(i,{unit:W,signed:!0});return[{kind:"subhead",id:"vsParHead",text:"Average vs par"},K("par3","Par 3",n(t.avgVsParByParGroup.par3)),K("par4","Par 4",n(t.avgVsParByParGroup.par4)),K("par5","Par 5",n(t.avgVsParByParGroup.par5)),K("doubles","Doubles or worse",le(t.doubleBogeyPlusPerRound,{unit:me})),j("bounceBack","Bounce-back",t.bounceBack)]}}}function qp(s){if(!s||s.rounds===0)return"";const e=se(s.rounds,me),t=s.lengths[0];if(s.lengths.length===1&&t)return`${e} — ${se(t.holeCount,W)}`;const n=s.lengths.map(i=>`${ie(i.rounds)} × ${se(i.holeCount,W)}`).join(", ");return`${e} — ${n}`}function Vp(s){return s===18?"Best 18":s===9?"Best 9":`Best ${ie(s)} holes`}const Up=18;function Kp(s){const e=s.lengths.some(i=>i.holeCount!==Up),t=s.holesScored!==s.holesExpected;if(!e&&!t)return null;const n=`over ${se(s.holesScored,W)}`;return e?`${n}, scaled to 18`:n}function Es(s){if(!s)return[];const e=[];s.avgVsParPer18.value!==null&&e.push({id:"avgVsPar",label:"Average vs par",value:we(s.avgVsParPer18.value,1),qualifier:Kp(s),hero:!0});for(const t of s.lengths){const n=t.best;n&&e.push({id:`best-${t.holeCount}`,label:Vp(t.holeCount),value:is(n.vsPar),qualifier:`${ie(n.strokes)} strokes`,hero:!1})}return e}function Wp(s){switch(s){case"eagleOrBetter":return"Eagle or better";case"birdie":return"Birdie";case"par":return"Par";case"bogey":return"Bogey";case"doubleBogeyPlus":return"Doubles or worse"}}function Pt(s){if(!s||s.holesScored===0)return[];const e=s.holesScored;return Yd.map(t=>{const n=s.scoreTypeCounts[t];return{id:t,title:Wp(t),share:x(n,e).value,value:he(x(n,e))??S.noValue}})}function Yp(s){return s===1?"This round has no data for it.":`None of these ${s} rounds has data for it.`}function fi(s){const e=(s.name??"").trim();return e||(s.courseName??"").trim()||"Round"}const ye={title:"How practice priorities work",holesCounted(s){const{attributed:e,holesScored:t,windowRounds:n}=s,i=n===0?"this round’s ":"your ";return e===0?`None of ${n===0?"this round’s":"your"} ${t} holes has the full set of answers yet, so there is nothing to show. A hole counts once it has a tee answer, a green answer and a putt answer.`:e===t?`All ${t} of ${n===0?"this round’s":"your"} holes could be fully attributed.`:`${e} of ${i}${t} holes could be fully attributed — the others are missing a tee, green or putt answer, so they are left out of every row rather than guessed at.`},fiveRows(){return"Each row is what that part of your game cost you against the Tapscore reference baseline v1 — a strokes gained-style method, worked out from the answers you tap rather than from shot distances. The five rows add up to your score against the baseline exactly; there is no leftover row."},baseline(s,e){const t=s?.baseline??$c,n=e===void 0?ft[t.cohort].tables.calibratedAt:e,i=`under “${S.filterBaseline}” in Filters`,r=lt(t.cohort),d=t.choice!=="auto"?`Measured against the ${r} reference — you picked this ${i}.`:t.handicapIndex===null?`Measured against the ${r} reference — no handicap on your profile yet. Change it ${i}.`:`Measured against the ${r} reference — matched to your ${dn(t.handicapIndex)} handicap. Change it ${i}.`,o="Each tier is one set of expected scores per hole and per lie.";return n===null?`${d} ${o} The tiers are still provisional, so treat the order of the rows as the reading and the sizes as rough.`:`${d} ${o} This tier was frozen on ${n}. Everyone on this reference is measured against the same table, so your rows can be compared with each other and with your own earlier rounds.`},per18(){return`Rows are scaled to 18 attributed holes, so a nine and an eighteen sit on the same scale. A round with fewer than ${kr} attributed holes is left out of the comparison entirely.`},total(s){const e=Xp(s.rowsPer18);if(e===null)return null;const t=we(e);return s.windowRounds===0?`The five rows add up to ${t} strokes against the baseline.`:s.windowRounds===1?`Over this round the five rows add up to ${t} strokes against the baseline.`:`Over these ${s.windowRounds} rounds the five rows add up to ${t} strokes against the baseline.`},penaltySource(s){const e=s.penaltySource;return e===void 0||e.recorded<=0?null:`Of ${se(e.recorded,Xc)} you labelled, ${ie(e.tee)} came off the tee, ${ie(e.approach)} on the approach and ${ie(e.short)} around the green.`}};function Xp(s){if(s.length===0)return null;let e=0;for(const t of s){if(t===null)return null;e+=t}return e}function Kt(s){return{recorded:s.penaltySourceRecorded,tee:s.penaltiesTee,approach:s.penaltiesApproach,short:s.penaltiesShort}}function Wt(s){const e=[{id:"holes",title:"Holes counted",body:ye.holesCounted(s)},{id:"rows",title:"The five rows",body:ye.fiveRows()},{id:"baseline",title:"The baseline",body:ye.baseline(s)},{id:"per18",title:"Per 18 holes",body:ye.per18()}],t=ye.total(s);t!==null&&e.push({id:"total",title:"The total",body:t});const n=ye.penaltySource(s);return n!==null&&e.push({id:"penaltySource",title:S.penaltySourceInfoTitle,body:n}),e}const ee={loading:"Reading the round…",noStatsInRound:"No statistics of your own in this round. Only the player whose card carried them can see them.",notSignedIn:"Sign in to see your own statistics for a round.",failedPrefix:"Could not read the round: ",holeStripHeading:"Hole by hole",waterfallHeading:"Where the round went",legendHeading:"Reading the strip",nothingRecordedOnHole:"Nothing was recorded on this hole.",noHoleStrip:"No hole-by-hole detail for this round.",waterfallHint:"Strokes lost against a fixed baseline. Positive costs you shots.",legendTee:"Dot — where the tee shot finished: green fairway, brass in play, terracotta trouble.",legendGir:"Ring — green in regulation: filled hit, hollow missed.",legendPutts:"Number — putts taken on the hole.",legendPenalty:"Flag — a penalty stroke.",legendAbsence:"Anything you did not record is left out: an empty row is a hole nobody answered, not a hole answered no."},mi={title:"Your round",seeWholeRound:"See the whole round"};function Qp(s){const e=[Or(s.date)],t=(s.courseName??"").trim();return t!==""&&t!==s.title&&e.push(t),e.push(s.holeCount===1?"1 hole":`${s.holeCount} holes`),e.join(" · ")}function Jr(s,e){return s===null?null:e===null?String(s):`${s} (${is(e)})`}function Jp(s){let e=`Hole ${s.holeNumber} · par ${s.par}`;return s.lengthM!==null&&(e+=` · ${s.lengthM} m`),e}function Zp(s){return s.strokes!==null?String(s.strokes):s.isPickedUp?"–":"·"}function ef(s){return s.isPickedUp?"Picked up":s.strokes===null?null:s.vsPar===null?String(s.strokes):`${s.strokes} (${is(s.vsPar)})`}function tf(s){switch(s){case"fairway":return"Fairway";case"in_play":return"In play";case"trouble":return"Trouble"}}function sf(s){switch(s){case"inside_1m":return"Inside 1 m";case"1_to_2m":return"1–2 m";case"2_to_4m":return"2–4 m";case"4_to_8m":return"4–8 m";case"over_8m":return"Over 8 m";case"inside_2m":return"Inside 2 m";case"2_to_6m":return"2–6 m";case"over_6m":return"Over 6 m"}}function nf(s){return s==="hard"?"Hard chip or pitch":"Standard chip or pitch"}function rf(s){switch(s){case"ring":return"Birdie";case"double_ring":return"Eagle";case"diamond":return"Albatross or hole in one";case"square":return"Bogey";case"double_square":return"Double bogey";case"box_badge":return"Triple bogey or worse"}}function yn(s){const e=[],t=ef(s);return t!==null&&e.push({label:"Score",value:t}),s.tee!==null&&e.push({label:"Tee shot",value:tf(s.tee)}),s.gir!==null&&e.push({label:"Green in regulation",value:s.gir?"Hit":"Missed"}),s.putts!==null&&e.push({label:"Putts",value:s.putts===1?"1 putt":`${s.putts} putts`}),s.firstPutt!==null&&e.push({label:"First putt",value:sf(s.firstPutt)}),s.shortGame!==null&&e.push({label:"Short game",value:nf(s.shortGame)}),s.recoveryOk!==null&&e.push({label:"Recovery",value:s.recoveryOk?"Back in play":"Still in trouble"}),s.penalties!==null&&e.push({label:"Penalties",value:s.penalties===0?"None":s.penalties===1?"1 stroke":`${s.penalties} strokes`}),e}function af(s){return s===null?[]:yn(s).map(e=>({...e,key:`${s.id}:${e.label}`}))}function gi(s){const e=[`Hole ${s.holeNumber}`,`par ${s.par}`];s.isPickedUp?e.push("picked up"):s.strokes!==null?(e.push(s.strokes===1?"1 stroke":`${s.strokes} strokes`),s.marker!==null&&e.push(rf(s.marker).toLowerCase())):e.push("no score");for(const t of yn(s))t.label!=="Score"&&e.push(`${t.label.toLowerCase()} ${t.value.toLowerCase()}`);return`${e.join(", ")}.`}function Zr(s,e){const t=e===1?"round":`last ${e} rounds`;if(Math.abs(s)<.05)return e===1?"The same as your previous round.":`The same as your ${t}.`;const n=s>0?"worse":"better",i=Te(Math.abs(s),1);return e===1?`${i} ${n} than your previous round.`:`${i} ${n} than your ${t}.`}function bi(s){switch(s){case"tee":return"Your tee shots";case"approach":return"Your approach play";case"shortGame":return"Your short game";case"putting":return"Putting";case"penalties":return"Penalties"}}function Rs(s,e=1){return typeof s=="number"?Te(Math.abs(s),e):""}function Ne(s){return typeof s=="number"?String(Math.round(s)):""}function _i(s){return typeof s=="string"?s:"tee"}function of(s){const e=s.params;switch(s.id){case"component_best_vs_baseline":return`${bi(_i(e.component))} was ${Rs(e.delta)} strokes better than your recent rounds.`;case"component_worst_vs_baseline":return`${bi(_i(e.component))} cost you ${Rs(e.delta)} strokes more than your recent rounds.`;case"penalties_spike":{const t=typeof e.penalties=="number"?Math.round(e.penalties):0;return`${t===1?"1 penalty stroke":`${t} penalty strokes`}, against ${Rs(e.baseline)} in a normal round.`}case"two_way_miss":return`Your tee misses are split ${Ne(e.left)} left and ${Ne(e.right)} right of ${Ne(e.recorded)} — you are missing both ways.`;case"scramble_streak":return`You saved par ${Ne(e.successes)} of the ${Ne(e.attempts)} times you missed the green.`;case"hard_scramble_streak":return`You saved par from all ${Ne(e.attempts)} of the hard spots you were in.`;case"three_putt_free":return`No three-putts — ${Ne(e.putts)} putts across the round.`;case"best_putting_round":{const t=typeof e.rounds=="number"?Math.round(e.rounds):0;return t===1?"Your best putting of the last round.":`Your best putting of the last ${t} rounds.`}case"bounce_back_perfect":{const t=typeof e.opportunities=="number"?Math.round(e.opportunities):0;return t===1?"You came straight back after your dropped shot.":`You came straight back after all ${t} of your dropped shots.`}}}const lf=b(`
    <section bind="story" class="story hidden">
        <div class="story__head">
            <span bind="title" class="story__title"></span>
            <span bind="score" class="story__score"></span>
        </div>
        <ul bind="values" class="story__values"></ul>
        <div class="story__hintrow">
            <p bind="hint" class="story__hint"></p>
            ${os}
        </div>
        <ul bind="lines" class="story__lines"></ul>
        <button bind="open" class="story__open" type="button"></button>
${gt}
    </section>
`),df=b('<li bind="text" class="story__line"></li>'),cf=b(`
    <li class="story__value">
        <span bind="label" class="story__valuelabel"></span>
        <span bind="amount" class="story__valueamount"></span>
    </li>
`);class uf extends M{static styles=`
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
                ${$()}
                align-self: flex-start;
                padding: ${a("xs")} ${a("md")};
                font-family: inherit; font-size: 0.82rem; font-weight: 700;
            }
        }

${ls}
    `;round=this.inject(be);stats=this.inject(ht);auth=this.inject(D);router=this.inject(G);colors=us;infoOpen=new f(!1);render(){this.track(C(()=>{const i=this.eligibleRoundId();te(()=>{i!==null&&this.stats.load(i).catch(()=>{})})}));const e=()=>this.shows()?this.stats.model.get():null,t=this.wire(lf,{story:{className:()=>this.shows()?"story":"story hidden"},title:()=>mi.title,score:()=>{const i=e();return i===null?"":Jr(i.strokes,i.vsPar)??""},hint:()=>e()===null?"":this.hint(),infoTrigger:{textContent:()=>S.prioritiesInfo,onclick:()=>this.infoOpen.set(!0)},infoSheet:{className:()=>this.infoOpen.get()?"stats-info":"stats-info hidden",onclick:i=>{i.target===i.currentTarget&&this.infoOpen.set(!1)}},infoTitle:()=>ye.title,infoDone:{onclick:()=>this.infoOpen.set(!1)},open:{textContent:()=>mi.seeWholeRound,onclick:()=>{const i=this.stats.roundId.get();i!==null&&this.router.navigate("/round-stats",{query:{id:i}})}}}),n=i=>{const r=e();return r===null?null:Ke(r.waterfall,i)};return this.$each(this.ref(t,"values"),()=>e()===null?[]:[...ue],(i,r,d)=>this.wireEl(cf,{label:()=>rs(i),amount:{textContent:()=>{const o=n(i);return o===null?S.notRecorded:we(o)},className:()=>n(i)===null?"story__valueamount story__valueamount--absent":"story__valueamount",style:()=>{const o=n(i);return o===null?"":`color:${Ye(ds(o),this.colors)}`}}},d),i=>i),this.$each(this.ref(t,"infoCards"),()=>{const i=e();return i===null?[]:Wt({attributed:i.waterfall.coverage.attributed,holesScored:i.waterfall.coverage.holesScored,windowRounds:0,rowsPer18:ue.map(r=>Se(i.waterfall,r)),penaltySource:Kt(i.panels.totals),baseline:this.stats.sgInfo.get()})},(i,r,d)=>this.wireEl(bt,{ctitle:()=>i.title,ctext:()=>i.body},d),i=>i.id),this.$each(this.ref(t,"lines"),()=>e()?.insights??[],(i,r,d)=>this.wireEl(df,{text:()=>of(i)},d),i=>i.id),t}eligibleRoundId(){const e=this.round.round.get();return e===null?null:Vr({signedInPlayerId:this.auth.currentUser.get()?.id??null,statConfigPlayerIds:new Set(this.round.statModules.get().keys()),statRows:this.round.statRows.get(),holesUnscored:Ur({playerId:this.auth.currentUser.get()?.id??"",balls:this.round.balls.get(),groups:this.round.groups(),strokesFor:(n,i)=>this.round.strokesFor(n,i)})}).reason==="eligible"?e.id:null}shows(){const e=this.eligibleRoundId();return e===null?!1:this.stats.phase.get()==="ready"&&this.stats.roundId.get()===e}hint(){const e=this.stats.model.get();if(e===null)return"";if(e.deltas===null)return ee.waterfallHint;let t=null;for(const n of ue){const i=on(e.deltas,n);i!==null&&(t===null||Math.abs(i)>Math.abs(t))&&(t=i)}return t===null?ee.waterfallHint:Zr(t,e.windowCount)}}function yi(s){return!(!s.pageVisible||s.status==="complete")}function hf(s,e){return e&&!s}const pf=2,vi=3,ff=75e3;function mf(s,e=null){const t=new URLSearchParams({token:s});return e!==null&&t.set("since",e),`${q}/friendly-rounds/events?${t.toString()}`}function gf(s){if(typeof s!="object"||s===null)return!1;const e=s;return e.latestEventId!==null&&typeof e.latestEventId!="string"?!1:e.status==="not_started"||e.status==="active"||e.status==="complete"}function bf(s){const e=s.eventSourceFactory??(z=>new EventSource(z)),t=s.setTimer??((z,V)=>setTimeout(z,V)),n=s.clearTimer??(z=>clearTimeout(z)),i=s.livenessTimeoutMs??ff,r=s.isPageVisible??(()=>typeof document>"u"||!document.hidden);let d=!1,o=0,c=null,u=null,p=s.since??null;const m=()=>{u!==null&&(n(u),u=null)},h=()=>{m(),u=t(T,i)},g=()=>{c!==null&&(c.onopen=null,c.onmessage=null,c.onerror=null,c.close(),c=null)},v=()=>{d=!0,m(),g()},w=()=>{if(g(),++o>=vi){v(),s.onDegrade();return}N()};function T(){if(!d){if(!r()){h();return}w()}}function N(){if(d)return;let z;try{z=e(mf(s.token,p))}catch{v(),s.onDegrade();return}c=z,z.onopen=()=>{o=0},z.onmessage=V=>{if(d||c!==z)return;h();let O;try{O=JSON.parse(V.data)}catch{return}gf(O)&&(O.latestEventId!==null&&(p=O.latestEventId),s.onEvent({latestEventId:O.latestEventId,status:O.status}))},z.onerror=()=>{d||c!==z||(z.readyState===pf||++o>=vi)&&(v(),s.onDegrade())},h()}return N(),{stop:()=>{d||v()}}}const _f=2e4;function yf(s){if(!(s===null||s===""))return/^\d+$/.test(s)?Number(s):s}const vf=b(`
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
`),wf=b('<button bind="pill" class="round-view__fmt" type="button"></button>'),xf=b('<button bind="pill" class="round-view__grp" type="button"></button>');class $f extends M{static styles=`
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
                    ${ae()}
                    flex: 1;
                    font-size: 0.8rem;
                    color: ${l("text-muted")};
                }
                & .round-view__copy {
                    ${$()}
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
    `;svc=this.inject(be);router=this.inject(G);tokenQ=this.router.query("token");initPos=this.readUrlPosition();tab=new f(this.initPos.tab);pageVisible=new f(!document.hidden);hasRound=new k(()=>this.svc.round.get()!==null);hasScoring=new k(()=>this.svc.balls.get().length>0);manageOpen=new f(!1);shareUrl=new k(()=>{const e=this.tokenQ.get(),t="/tapscore/".replace(/\/+$/,"");return e?`${location.origin}${t}/round?token=${e}`:""});render(){this.track(C(()=>{const m=this.tokenQ.get();m&&this.svc.loadByToken(m,this.initPos).then(()=>{this.svc.loadResult()})}));const e=()=>{this.svc.flushPending()};window.addEventListener("online",e),this.track(()=>window.removeEventListener("online",e));let t=null,n=null,i=null,r=!1;const d=m=>!r&&yi({pageVisible:m,status:this.svc.round.get()?.status??null}),o=()=>{const m=!document.hidden,h=hf(this.pageVisible.get(),m),g=d(m);this.pageVisible.set(m),h&&this.tokenQ.get()&&this.svc.refreshAll({feedWillReconnect:g})};document.addEventListener("visibilitychange",o),this.track(()=>document.removeEventListener("visibilitychange",o));const c=()=>{i!==null&&(clearInterval(i),i=null)},u=()=>{i===null&&(i=setInterval(()=>{this.svc.pollResult(),this.svc.refreshScorecard()},_f))};this.track(C(()=>{const m=this.tokenQ.get()||null,h=yi({pageVisible:this.pageVisible.get(),status:this.svc.round.get()?.status??null});if(n!==m&&(t?.stop(),t=null,n=null,c(),r=!1),!h){t?.stop(),t=null,n=null,c(),r=!1;return}if(r){u();return}if(t===null&&m){n=m;try{const g=bf({token:m,since:this.svc.persistedCursor(m),onEvent:v=>this.svc.onLiveResultEvent(v),onDegrade:()=>{t=null,r=!0,u()}});r||(t=g)}catch{t=null,r=!0,u()}}})),this.track(()=>{t?.stop(),t=null,n=null,c()}),this.track(C(()=>{const m=this.tab.get(),h=this.svc.selectedSlotDefId(),g=this.svc.holeIdx.get();if(this.router.route.get()!=="/round"||!this.hasRound.get())return;const v=this.tokenQ.get();if(!v)return;const w={token:v};m==="leaderboard"&&(w.tab="board");const T=this.svc.round.get()?.formatSlots[0]?.slotDefId??null;h&&h!==T&&(w.slot=h),g>0&&(w.hole=g+1),this.router.navigate(this.router.route.get(),{replace:!0,query:w})}));const p=this.wire(vf,{back:{onclick:()=>this.router.navigate("/")},notfound:{className:()=>!this.hasRound.get()&&!this.svc.loading.get()?"round-view__notfound":"round-view__notfound hidden"},body:{className:()=>this.hasRound.get()?"round-view__body":"round-view__body hidden"},title:()=>Kr(this.svc.round.get()),course:()=>this.svc.round.get()?.courseNameSnapshot??"",scorePanel:{className:()=>this.tab.get()==="score"?"round-view__panel":"round-view__panel hidden"},groupTabs:{className:()=>this.svc.groups().length>1?"round-view__groups":"round-view__groups hidden"},lbPanel:{className:()=>this.tab.get()==="leaderboard"?"round-view__panel":"round-view__panel hidden"},shareUrl:{value:()=>this.shareUrl.get()},copy:{onclick:()=>{navigator.clipboard?.writeText(this.shareUrl.get())}},manageBtn:{className:()=>this.hasRound.get()?"round-view__manage":"round-view__manage hidden",onclick:()=>this.manageOpen.set(!0)},dock:{className:()=>this.hasRound.get()&&!this.svc.keypadOpen.get()?"round-view__dock":"round-view__dock hidden"},holebar:{className:()=>this.tab.get()==="score"&&this.hasScoring.get()?"round-hole":"round-hole hidden"},holePar:()=>String(this.svc.parFor(this.svc.currentPlayedHole()?.playHoleId??null)),holeNum:()=>{const m=this.svc.currentPlayedHole();return m?this.svc.occLabel(m.playHoleId):""},holeSi:()=>{const m=this.svc.currentPlayHole()?.baseStrokeIndex;return m!=null?String(m):"–"},holePrev:{onclick:()=>this.svc.prevHole(),disabled:()=>!this.svc.canPrevHole()},holeNext:{onclick:()=>this.svc.nextHole(),disabled:()=>!this.svc.canNextHole()},tabScore:{className:()=>this.tab.get()==="score"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>this.tab.set("score")},tabBoard:{className:()=>this.tab.get()==="leaderboard"?"round-tabs__tab active":"round-tabs__tab",onclick:()=>{this.tab.set("leaderboard"),this.svc.loadResult()}}});return this.$each(this.ref(p,"groupTabs"),new k(()=>this.svc.groups()),(m,h,g)=>this.groupPill(h,g),m=>m.id),this.$each(this.ref(p,"formats"),new k(()=>this.svc.round.get()?.formatSlots??[]),(m,h,g)=>this.slotPill(m,h,g),m=>m.slotDefId),this.spawn(Xh,this.ref(p,"hcpCheckin")),this.spawn(Qu,this.ref(p,"scoring")),this.spawn(uf,this.ref(p,"story")),this.spawn(bn,this.ref(p,"leaderboard")),this.spawn(Fh,this.ref(p,"seats")),this.spawn(Nh,this.ref(p,"claim")),this.spawn(Vh,this.ref(p,"join")),this.spawn(Zh,this.ref(p,"manageHost"),{open:this.manageOpen}),this.spawn(cp,this.ref(p,"finishHost")),p}readUrlPosition(){const e=new URLSearchParams(location.search),t=e.get("slot"),n=Number(e.get("hole"));return{tab:e.get("tab")==="board"?"leaderboard":"score",selectedSlot:yf(t),holeIdx:Number.isFinite(n)&&n>0?n-1:void 0}}groupPill(e,t){return this.wireEl(xf,{pill:{textContent:()=>{const n=this.svc.groups()[e];if(!n)return`Group ${e+1}`;const i=[`Group ${e+1}`];n.startTime.includes(":")&&i.push(n.startTime);const r=this.svc.playHoleById(n.startPlayHoleId)?.courseHoleNumber;return r!==void 0&&n.startOrdinal!==1&&i.push(`H${r}`),i.join(" · ")},className:()=>this.svc.groupIdx.get()===e?"round-view__grp active":"round-view__grp",onclick:()=>this.svc.groupIdx.set(e)}},t)}slotPill(e,t,n){return this.wireEl(wf,{pill:{textContent:()=>hn(e),className:()=>this.svc.selectedSlotDefId()===e.slotDefId?"round-view__fmt active":"round-view__fmt",onclick:()=>this.svc.selectSlot(e.slotDefId)}},n)}}function ea(s){return s.formatIndex??s.slotIndex??null}function kf(s,e){return s.filter(t=>ea(t)===e)}function Sf(s){return s.filter(e=>!e.path?.startsWith("producers")&&!e.path?.startsWith("playingGroups")&&e.path!=="route"&&ea(e)===null)}function Oe(s){return`${s} ${s===1?"player":"players"}`}function Ct(s,e){const t=s.formatId?e(s.formatId)??s.formatId:null,n=s.teamLabel;switch(s.code){case"team_size_above_max":if(t&&n&&s.actual!==void 0&&s.allowedMax!==void 0)return`${n} has ${Oe(s.actual)} — ${t} allows at most ${s.allowedMax} per team.`;break;case"team_size_below_min":if(t&&n&&s.actual!==void 0&&s.allowedMin!==void 0)return`${n} has ${Oe(s.actual)} — ${t} needs at least ${s.allowedMin} per team.`;break;case"empty_team_grouping":if(t&&n)return`${n} has no players — add at least one, or remove the team.`;break;case"team_count_above_max":if(t&&s.actual!==void 0&&s.allowedMax!==void 0)return`${s.actual} teams — ${t} allows at most ${s.allowedMax}.`;break;case"team_count_below_min":if(t&&s.actual!==void 0&&s.allowedMin!==void 0)return`${s.actual} teams — ${t} needs at least ${s.allowedMin}.`;break;case"slot_ball_count_above_max":if(t&&s.actual!==void 0&&s.allowedMax!==void 0)return`${Oe(s.actual)} in ${t} — it scores at most ${s.allowedMax}.`;break;case"slot_ball_count_below_min":if(t&&s.actual!==void 0&&s.allowedMin!==void 0)return`${Oe(s.actual)} in ${t} — it needs at least ${s.allowedMin}.`;break;case"slot_ball_count_not_multiple":if(t&&s.actual!==void 0)return`${t} pairs its balls, so it needs an even number — ${Oe(s.actual)} won't pair up.`;break;case"missing_team_grouping":if(t)return`${t} compares teams — under Teams, group the players into “Own ball each, scored together as a team” teams, then tick them under “Scores”.`;break;case"ball_mode_violation":if(t&&s.actual!==void 0)return s.actual>1?`${t} is played with everyone on their own ball — a team sharing one ball can’t play it. Use an “Own ball each, scored together as a team” team instead.`:`${t} is played on one shared team ball — under Teams, group the players into a “Share one ball” team, then tick that team instead of the individual players.`;break;case"producer_count_violation":if(t&&s.actual!==void 0&&s.allowedMin!==void 0&&s.allowedMax!==void 0){if(s.allowedMax===1&&s.actual>1)return`${t} is played with everyone on their own ball — a team sharing one ball can’t play it. Use an “Own ball each, scored together as a team” team instead.`;const i=s.allowedMin===s.allowedMax?`exactly ${Oe(s.allowedMin)}`:`${s.allowedMin}–${s.allowedMax} players`;return`A ball in ${t} has ${Oe(s.actual)} — it needs ${i} per ball.`}break;case"producer_has_scores":return s.message;case"scored_ball_orphaned":return s.message;case"edit_locked_course_route":return"Scores have already been recorded — the course and route are locked for this round.";case"round_complete":return"This round is complete — its setup can no longer be edited.";case"not_editable":return"This round can no longer be edited."}return s.message}function Tf(s){return s?s.type==="flat"?String(s.pct):s.bands.length>0?String(s.bands[0].pct):"100":"100"}function Pf(s){const e={};if(!s||typeof s!="object")return e;for(const[t,n]of Object.entries(s))typeof n=="string"&&(e[t]=n);return e}function Cf(s){const e=s.roundType;if(e==="full_18"||e==="front_9"||e==="back_9")return{preset:e,startHole:If(s)};const t=(s.route?.playHoles??[]).map(d=>d.courseHoleNumber),n=t[0]??1,i=new Set(t);return{preset:t.length<=9&&[...i].every(d=>d<=9)?"front_9":t.length<=9&&[...i].every(d=>d>=10)?"back_9":"full_18",startHole:n}}function If(s){return s.roundType==="back_9"?10:1}function Ef(s,e=()=>"",t=new Set){let n=1,i=1,r=1,d=1;const o=new Map,c=s.producers.map(w=>{const T=n++;o.set(w.producerDefId,T);const N=w.playerRef.kind==="guest";return{key:T,name:e(w.producerDefId),handicapIndex:qt(w.handicapIndex),gender:w.gender??"M",teeId:w.teeId,producerDefId:w.producerDefId,...N?{guestPlayerId:w.playerRef.id,guestOriginalName:e(w.producerDefId)}:{playerId:w.playerRef.id,genderKnown:w.gender!=null}}}),u=new Map;(s.teams??[]).forEach(w=>{u.set(w.id,i++)});const p=(s.teams??[]).map(w=>{const T=u.get(w.id),N={},z={},V=[];for(const de of w.members)if("producerDefId"in de){const ce=o.get(de.producerDefId);ce!==void 0&&(N[ce]=String(de.allowancePct),V.push(ce))}else{const ce=u.get(de.teamId);ce!==void 0&&(z[ce]=!0)}const O=w.kind??"single_ball",J=O==="single_ball"&&w.formation!==void 0&&t.has(w.formation)&&Object.keys(z).length===0&&V.length>=2;return{key:T,kind:O,formation:w.formation??"scramble",pctByPlayer:N,memberTeams:z,autoCreated:!1,...J?{section:!0,customized:!0,memberOrder:V,pctTextByPlayer:{}}:{}}}),m=(s.playingGroups??[]).map(w=>{const T={};for(const N of w.members){const z=o.get(N);z!==void 0&&(T[z]=!0)}return{key:r++,startTime:w.startTime??"",startHole:w.startHole??null,members:T}}),h=s.formats.map(w=>{const T={},N={},z=w.subjects;if(z){const V=new Set;for(const O of z)if(O.kind==="player"){const J=o.get(O.producerDefId);J!==void 0&&V.add(J)}else{const J=u.get(O.teamId);J!==void 0&&(N[J]=!0)}for(const O of c)T[O.key]=V.has(O.key)}for(const V of u.values())N[V]===void 0&&(N[V]=!1);return{key:d++,formatId:w.formatId,allowancePct:Tf(w.allowanceConfig),subjectPlayers:T,subjectTeams:N,config:Pf(w.formatConfig)}}),{preset:g,startHole:v}=Cf(s);return{courseId:s.courseId,preset:g,startHole:v,players:c,teams:p,groups:m,formatSlots:h,nextKey:n,nextTeamKey:i,nextGroupKey:r,nextSlotKey:d}}function Rf(s){return s.toLowerCase().startsWith("sv")?"Spel":"Game"}function Nf(s,e){return new Intl.DateTimeFormat(e,{dateStyle:"medium"}).format(s)}function Of(s=new Date,e=typeof navigator>"u"?"en":navigator.language,t=[]){const n=`${Rf(e)} ${Nf(s,e)}`,i=new Set(t.map(r=>r.trim().toLowerCase()).filter(r=>r.length>0));if(!i.has(n.toLowerCase()))return n;for(let r=2;r<=99;r++){const d=`${n} (${r})`;if(!i.has(d.toLowerCase()))return d}return n}const Hf=["scramble","greensomes","foursomes","custom"],fe=2,Mf="ABCDEFGH";function wi(s){if(s===void 0)return null;const e=s.trim().replace(",",".");if(e==="")return null;const t=Number(e);return Number.isFinite(t)?Math.min(100,Math.max(0,t)):null}function Af(s,e){return s.length===e.length&&s.every((t,n)=>t===e[n])}function xi(s,e){const t=Object.keys(s),n=Object.keys(e);return t.length===n.length&&t.every(i=>s[Number(i)]===e[Number(i)])}const zf={full_18:"Full 18",front_9:"Front 9",back_9:"Back 9"};class Lf{loading=new f(!1);error=new f(null);courses=new f([]);tees=new f([]);roundName=new f("");courseId=new f("");preset=new f("full_18");startHole=new f(1);players=new f([]);teams=new f([]);groups=new f([]);formatSlots=new f([]);picked=new f([]);customOpen=new f(!1);submitting=new f(!1);diagnostics=new f([]);submitError=new f(null);editToken=new f(null);hasScores=new f(!1);editStatus=new f(null);editBlockedReason=new f(null);editPlayedAt=null;catalog=U.get(Ue);formationCatalog=U.get(kl);ballTeamsOpen=new f(!1);ballTeamNotices=new f({});lastFormation=null;nextKey=1;nextSlotKey=1;nextTeamKey=1;nextGroupKey=1;nextPickKey=1;reset(){this.courses.set([]),this.tees.set([]),this.roundName.set(""),this.courseId.set(""),this.preset.set("full_18"),this.startHole.set(1),this.players.set([]),this.teams.set([]),this.groups.set([]),this.formatSlots.set([]),this.picked.set([]),this.customOpen.set(!1),this.ballTeamsOpen.set(!1),this.ballTeamNotices.set({}),this.lastFormation=null,this.diagnostics.set([]),this.submitError.set(null),this.submitting.set(!1),this.error.set(null),this.editToken.set(null),this.hasScores.set(!1),this.editStatus.set(null),this.editBlockedReason.set(null),this.editPlayedAt=null,this.nextKey=1,this.nextSlotKey=1,this.nextTeamKey=1,this.nextGroupKey=1,this.nextPickKey=1}async load(){this.seedDefaultName(),this.catalog.load().then(()=>this.ensureDefaultGame()),this.formationCatalog.load();const e=await F(this.loading,this.error,()=>y.setup.courses());e&&(this.courses.set(e),!this.courseId.get()&&e.length>0&&await this.selectCourse(e[0].id))}seedDefaultName(e=new Date){if(this.roundName.get()!=="")return;const t=Qt().map(n=>n.name??"").filter(n=>n!=="");this.roundName.set(Of(e,void 0,t))}async loadForEdit(e){this.reset(),this.editToken.set(e),await this.catalog.load(),await this.formationCatalog.load();const t=await F(this.loading,this.error,()=>y.friendlyRounds.setup({token:e}));if(!t)return;if(this.editStatus.set(t.status),!t.editable){this.editBlockedReason.set(t.reason);return}if(t.draft.producers.some(c=>"placeholder"in c)){this.editBlockedReason.set("has_open_seats");return}this.hasScores.set(t.hasScores),this.editPlayedAt=t.draft.playedAt,this.roundName.set(t.draft.name??"");const n=await F(this.loading,this.error,()=>y.setup.courses());n&&this.courses.set(n);const i=await F(this.loading,this.error,()=>y.setup.teesByCourse({courseId:t.draft.courseId}));this.tees.set(i??[]);const r=await F(this.loading,this.error,()=>y.friendlyRounds.balls({token:e})),d=new Map;for(const c of r??[])for(const u of c.players)d.set(u.producerDefId,u.displayName);const o=Ef(t.draft,c=>d.get(c)??"",this.formationCatalog.ids());this.courseId.set(o.courseId),this.preset.set(o.preset),this.startHole.set(o.startHole),this.players.set(o.players),this.teams.set(o.teams),this.groups.set(o.groups),this.formatSlots.set(o.formatSlots),this.picked.set([]),this.customOpen.set(!0),this.nextKey=o.nextKey,this.nextTeamKey=o.nextTeamKey,this.nextGroupKey=o.nextGroupKey,this.nextSlotKey=o.nextSlotKey}async selectCourse(e){this.courseId.set(e),this.preset.set("full_18"),this.startHole.set(1);const n=await F(this.loading,this.error,()=>y.setup.teesByCourse({courseId:e}))??[];this.tees.set(n);const i=new Set(n.map(d=>d.id)),r=n[0]?.id??"";this.players.set(this.players.get().map(d=>({...d,teeId:i.has(d.teeId)?d.teeId:r}))),this.players.get().length===0&&this.addPlayer(),this.reseedBallTeams()}addPlayer(){const e=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:"",handicapIndex:"",gender:"M",teeId:e}]),this.syncGamesToRoster()}addMe(e){this.addFriend(e)}addFriend(e){if(this.hasPlayer(e.id))return;const t=this.tees.get()[0]?.id??"";this.players.set([...this.players.get(),{key:this.nextKey++,name:e.displayName,handicapIndex:e.handicapIndex===null?"":qt(e.handicapIndex),gender:e.gender??"M",genderKnown:e.gender!=null,teeId:t,playerId:e.id}]),this.syncGamesToRoster()}seedSelf(e){if(this.editToken.get()!==null)return;const t=this.players.get();if(!(t.length>1)){if(t.length===1){const n=t[0];if(n.playerId!=null||n.name.trim()!=="")return;this.players.set([])}this.addFriend(e)}}hasPlayer(e){return this.players.get().some(t=>t.playerId===e)}removePlayer(e){this.players.set(this.players.get().filter(t=>t.key!==e)),this.groups.set(this.groups.get().map(t=>{if(t.members[e]===void 0)return t;const n={...t.members};return delete n[e],{...t,members:n}})),this.reseedBallTeams(),this.syncGamesToRoster(),this.syncGamesToBallUnits()}patchPlayer(e,t){this.players.set(this.players.get().map(n=>n.key===e?{...n,...t}:n)),this.reseedBallTeams()}ensureDefaultGame(){if(this.editToken.get()||this.formatSlots.get().length>0||this.picked.get().length>0||this.catalog.byId("stableford_individual")&&(this.pickGame("stableford_individual"),this.formatSlots.get().length>0))return;const e=this.catalog.descriptors.get()[0];e&&this.addFormatSlot(e.id)}addFormatSlot(e){const t=e??this.catalog.byId("stableford_individual")?.id??this.catalog.descriptors.get()[0]?.id??"",n={key:this.nextSlotKey++,formatId:t,allowancePct:"100",subjectPlayers:{},subjectTeams:{},config:this.defaultConfigFor(t)};this.formatSlots.set([...this.formatSlots.get(),n])}setSlotAllowance(e,t){this.patchFormatSlot(e,{allowancePct:t})}defaultConfigFor(e){return{...this.catalog.byId(e)?.defaults.formatConfig??{}}}setSlotConfig(e,t,n){const i=this.slotByKey(e);i&&this.patchFormatSlot(e,{config:{...i.config,[t]:n}})}slotConfigValue(e,t){return this.slotByKey(e)?.config[t.key]??t.default}removeFormatSlot(e){this.formatSlots.set(this.formatSlots.get().filter(t=>t.key!==e))}patchFormatSlot(e,t){this.formatSlots.set(this.formatSlots.get().map(n=>n.key===e?{...n,...t}:n))}setSlotFormat(e,t){this.patchFormatSlot(e,{formatId:t,config:this.defaultConfigFor(t)})}slotByKey(e){return this.formatSlots.get().find(t=>t.key===e)??null}teamLetter(e){return Mf[e]??`T${e+1}`}presetGames(){return this.catalog.presets()}shapeOfGame(e){const t=this.catalog.byId(e);return t?this.catalog.playableShape(t):null}isIndividualShape(e){return e.size.max===1&&e.count.max===void 0}isIndividualGame(e){const t=this.shapeOfGame(e);return t?this.isIndividualShape(t):!1}minPlayersFor(e){const t=this.shapeOfGame(e);return!t||this.isIndividualShape(t)?0:t.count.min*t.size.min}fitOf(e){const t=this.shapeOfGame(e),n=this.players.get().length;return!t||this.isIndividualShape(t)||this.liveSectionTeams().length===0?{unitJudged:!1,available:n,min:this.minPlayersFor(e),noun:"players",sharing:0}:this.isSideFormat(e)?{unitJudged:!0,available:this.soloPlayers().length,min:t.count.min*t.size.min,noun:"players on their own balls",sharing:this.sharedBallPlayerCount()}:{unitJudged:!0,available:this.ballUnits().length,min:t.count.min,noun:"balls",sharing:0}}gameFits(e){const t=this.fitOf(e);return t.available>=t.min}gameNeedsText(e){const t=this.fitOf(e);if(!t.unitJudged){const i=Math.max(0,t.min-t.available);return`Needs ${t.min} players — add ${i} more.`}const n=t.sharing>0?` — ${t.sharing} ${t.sharing===1?"is":"are"} sharing balls`:"";return`Needs at least ${t.min} ${t.noun}${n}.`}gameShapeText(e){const t=this.shapeOfGame(e);if(!t)return"";if(this.isIndividualShape(t))return"Everyone plays their own ball";const n=t.count.max===t.count.min?`${t.count.min} balls`:`${t.count.min}+ balls`,i=t.size.max===1?"one player each":t.size.min===t.size.max?`${t.size.min} players each`:t.size.min===1?"each a player or a team":`${t.size.min}–${t.size.max} players each`;return`${n} · ${i}`}isGamePicked(e){return this.picked.get().some(t=>t.formatId===e)}pickedByKey(e){return this.picked.get().find(t=>t.key===e)??null}gameLabel(e){return this.catalog.labelOf(e)??e}toggleGame(e){const t=this.picked.get().find(n=>n.formatId===e);t?this.unpickGame(t.key):this.pickGame(e)}pickGame(e){const t=this.shapeOfGame(e);if(!t||this.isGamePicked(e)||!this.gameFits(e))return;const n=this.unitAssignment(e,t);if(n){const d={key:this.nextPickKey++,formatId:e,...n};this.picked.set([...this.picked.get(),d]),this.regenerateGame(d);return}const i=this.isIndividualShape(t)?null:this.adoptableTeams(t),r=i?{key:this.nextPickKey++,formatId:e,ballCount:i.length,ballByPlayer:this.assignmentFromTeams(i),ballTeams:Object.fromEntries(i.map((d,o)=>[o,d.key]))}:{key:this.nextPickKey++,formatId:e,ballCount:this.isIndividualShape(t)?0:t.count.min,ballByPlayer:this.defaultAssignment(t,this.isIndividualShape(t)?0:t.count.min),ballTeams:{}};this.picked.set([...this.picked.get(),r]),this.regenerateGame(r)}adoptableTeams(e){const t=this.teams.get().filter(i=>i.kind==="multi_ball");if(t.length===0||t.length<e.count.min||e.count.max!==void 0&&t.length>e.count.max)return null;const n=new Set;for(const i of t){const r=this.teamMemberCount(i.key);if(r<e.size.min||r>e.size.max)return null;for(const d of Object.keys(i.pctByPlayer)){if(n.has(Number(d)))return null;n.add(Number(d))}}return t}assignmentFromTeams(e){const t={};for(const n of this.players.get()){const i=e.findIndex(r=>r.pctByPlayer[n.key]!==void 0);i>=0&&(t[n.key]=i)}return t}unpickGame(e){this.picked.set(this.picked.get().filter(t=>t.key!==e)),this.formatSlots.set(this.formatSlots.get().filter(t=>t.gameKey!==e)),this.collectUnreferencedTeams()}collectUnreferencedTeams(){const e=new Set;for(const n of this.formatSlots.get())for(const[i,r]of Object.entries(n.subjectTeams))r&&e.add(Number(i));for(const n of this.picked.get())for(const i of Object.values(n.ballTeams))e.add(i);const t=this.teams.get().filter(n=>!n.autoCreated||e.has(n.key));t.length!==this.teams.get().length&&this.teams.set(t)}defaultAssignment(e,t,n=this.players.get()){const i={};if(t<=0)return i;const r=n.length%t===0?n.length/t:e.size.min,d=Math.max(1,Math.min(r,e.size.max));let o=0;for(let c=0;c<t&&o<n.length;c++)for(let u=0;u<d&&o<n.length;u++,o++)i[n[o].key]=c;return i}gameBalls(e){const t=this.pickedByKey(e);return t?Array.from({length:t.ballCount},(n,i)=>i):[]}ballOf(e,t){const n=this.pickedByKey(e)?.ballByPlayer[t];return n===void 0?null:n}assignBall(e,t,n){const i=this.pickedByKey(e);if(!i)return;const r={...i.ballByPlayer},d=this.liveSectionTeams().find(c=>c.pctByPlayer[t]!==void 0),o=d?this.ballTeamMemberKeys(d):[t];for(const c of o)n===null?delete r[c]:r[c]=n;this.applyGameEdit({...i,ballByPlayer:r})}applyGameEdit(e){this.picked.set(this.picked.get().map(t=>t.key===e.key?e:t)),this.regenerateGame(e),this.syncGamesFromTeams(e.key)}syncGamesFromTeams(e){const t=new Map(this.teams.get().map(r=>[r.key,r])),n=[],i=this.picked.get().map(r=>{if(r.key===e)return r;const d={...r.ballByPlayer};let o=!1;for(const[u,p]of Object.entries(r.ballTeams)){const m=t.get(p);if(!m)continue;const h=Number(u);for(const[g,v]of Object.entries(d)){const w=Number(g);v===h&&m.pctByPlayer[w]===void 0&&(delete d[w],o=!0)}for(const g of Object.keys(m.pctByPlayer)){const v=Number(g);d[v]!==h&&(d[v]=h,o=!0)}}if(!o)return r;const c={...r,ballByPlayer:d};return n.push(c),c});this.picked.set(i);for(const r of n)this.regenerateGame(r)}forkGame(e){const t=this.pickedByKey(e);if(!t)return;const n=this.teams.get(),i={},r=[];let d=-1;for(const[c,u]of Object.entries(t.ballTeams)){const p=n.findIndex(h=>h.key===u);if(p<0)continue;const m=n[p];if(this.isSectionTeam(m)){i[Number(c)]=m.key;continue}r.push({...m,key:this.nextTeamKey++,pctByPlayer:{...m.pctByPlayer},memberTeams:{...m.memberTeams},autoCreated:!0}),i[Number(c)]=r.at(-1).key,p>d&&(d=p)}this.teams.set([...n.slice(0,d+1),...r,...n.slice(d+1)]);const o={...t,ballTeams:i};this.picked.set(this.picked.get().map(c=>c.key===e?o:c)),this.regenerateGame(o)}canAddBall(e){const t=this.pickedByKey(e);if(!t||t.ballCount===0)return!1;const n=this.shapeOfGame(t.formatId);return!!n&&(n.count.max===void 0||t.ballCount<n.count.max)}addBall(e){const t=this.pickedByKey(e);!t||!this.canAddBall(e)||this.applyGameEdit({...t,ballCount:t.ballCount+1})}slotForGame(e){return this.formatSlots.get().find(t=>t.gameKey===e)??null}ballMembers(e,t){const n=this.pickedByKey(e);return n?this.players.get().filter(i=>n.ballByPlayer[i.key]===t):[]}sittingOut(e){const t=this.pickedByKey(e);return!t||t.ballCount===0?[]:this.players.get().filter(n=>t.ballByPlayer[n.key]===void 0)}regenerateGame(e){const t=this.shapeOfGame(e.formatId);if(!t)return;const n=this.players.get(),i={},r={},d=[];let o=this.teams.get();for(let h=0;h<e.ballCount;h++){const g=n.filter(O=>e.ballByPlayer[O.key]===h),v=e.ballTeams[h];if(g.length===0){v!==void 0&&(r[h]=v);continue}if(g.length===1&&t.size.min===1){i[g[0].key]=!0,v!==void 0&&(r[h]=v);continue}const w=o.find(O=>O.key===e.ballTeams[h]);if(w&&this.isSectionTeam(w)){const O=this.ballTeamMemberKeys(w);if(O.length===g.length&&g.every(de=>O.includes(de.key))){r[h]=w.key,d.push(w.key);for(const de of O)i[de]=!1;continue}}const T=w&&!this.isSectionTeam(w)?w:void 0,N=Object.fromEntries(g.map(O=>[O.key,T?.pctByPlayer[O.key]??"100"]));if(T){o=o.map(O=>O.key===T.key?{...O,kind:"multi_ball",pctByPlayer:N}:O),r[h]=T.key,d.push(T.key);continue}const z={key:this.nextTeamKey++,kind:"multi_ball",formation:"custom",pctByPlayer:N,memberTeams:{},autoCreated:!0},V=this.lastTeamIndexOf(o,r,e);o=[...o.slice(0,V+1),z,...o.slice(V+1)],r[h]=z.key,d.push(z.key)}if(e.ballCount>0)for(const h of n)i[h.key]===void 0&&(i[h.key]=!1);else if(!this.isSideFormat(e.formatId))for(const h of o){if(!this.isSectionTeam(h))continue;const g=this.ballTeamMemberKeys(h);if(!(g.length<fe)&&this.teamKindFitsFormat(e.formatId,h.kind)){d.push(h.key);for(const v of g)i[v]=!1}}this.teams.set(o),this.picked.set(this.picked.get().map(h=>h.key===e.key?{...h,ballTeams:r}:h));const c=Object.fromEntries(d.map(h=>[h,!0]));for(const h of this.liveSectionTeams())c[h.key]===void 0&&(c[h.key]=!1);const u=this.formatSlots.get(),p=u.find(h=>h.gameKey===e.key),m={key:p?.key??this.nextSlotKey++,formatId:e.formatId,allowancePct:p?.allowancePct??"100",subjectPlayers:i,subjectTeams:c,config:p?.config??this.defaultConfigFor(e.formatId),gameKey:e.key};this.formatSlots.set(p?u.map(h=>h.key===m.key?m:h):[...u,m]),this.collectUnreferencedTeams()}lastTeamIndexOf(e,t,n){const i=new Set([...Object.values(t),...Object.values(n.ballTeams)]);let r=e.length-1;for(const[d,o]of e.entries())i.has(o.key)&&(r=d);return r}syncGamesToRoster(){const e=this.players.get(),t=new Set(e.map(i=>i.key)),n=this.picked.get().map(i=>{if(i.ballCount===0)return i;const r=this.shapeOfGame(i.formatId)?.size.min??1,d={};for(const[o,c]of Object.entries(i.ballByPlayer))t.has(Number(o))&&c<i.ballCount&&(d[Number(o)]=c);for(const o of e)if(d[o.key]===void 0){for(let c=0;c<i.ballCount;c++)if(Object.values(d).filter(p=>p===c).length<r){d[o.key]=c;break}}return{...i,ballByPlayer:d}});this.picked.set(n);for(const i of n)this.regenerateGame(i);this.syncGamesFromTeams(-1)}gameWarnings(e){const t=this.pickedByKey(e),n=t?this.shapeOfGame(t.formatId):null;if(!t||!n)return[];const i=this.gameLabel(t.formatId);if(!this.gameFits(t.formatId))return[`${i}: ${this.gameNeedsText(t.formatId)}`];const r=[];for(let d=0;d<t.ballCount;d++){const o=this.ballMembers(e,d).length,c=`${i} ball ${this.teamLetter(d)}`;if(o<n.size.min){const u=n.size.min-o;r.push(`${c} needs ${u} more player${u===1?"":"s"}.`)}else o>n.size.max&&r.push(`${c} takes at most ${n.size.max}.`)}return r}gameSummary(e){const t=this.pickedByKey(e);if(!t)return"";const n=r=>r.name.trim()||"Player",i=[];if(t.ballCount===0)i.push("everyone");else{const r=[];for(let o=0;o<t.ballCount;o++){const c=this.ballMembers(e,o);c.length>0&&r.push(c.map(n).join(" & "))}i.push(r.join(" vs "));const d=this.sittingOut(e);d.length>0&&i.push(`${d.map(n).join(", ")} sitting out`)}return i.push(`${this.slotForGame(e)?.allowancePct??"100"}% allowance`),i.filter(r=>r!=="").join(" · ")}teamsOfGame(e){const t=this.pickedByKey(e);if(!t)return[];const n=this.slotForGame(e)?.subjectTeams??{},i=[];for(let r=0;r<t.ballCount;r++){const d=this.teamByKey(t.ballTeams[r]??-1);d&&n[d.key]&&i.push(d)}return i}gameSharedWith(e){const t=new Set(this.teamsOfGame(e).filter(r=>!this.isSectionTeam(r)).map(r=>r.key));if(t.size===0)return[];const n=this.slotForGame(e)?.key,i=[];for(const r of this.formatSlots.get()){if(r.key===n)continue;Object.entries(r.subjectTeams).some(([o,c])=>c&&t.has(Number(o)))&&i.push(this.gameLabel(r.formatId))}return i}gameSharesSides(e){return this.gameSharedWith(e).length>0}gameSidesText(e){const t=this.pickedByKey(e);if(!t||this.teamsOfGame(e).length===0)return"";const n=this.slotForGame(e)?.subjectTeams??{},i=[];for(let o=0;o<t.ballCount;o++){const c=this.teamByKey(t.ballTeams[o]??-1);if(c&&n[c.key]){i.push(this.teamLabel(c));continue}const u=this.ballMembers(e,o);u.length>0&&i.push(u.map(p=>p.name.trim()||"Player").join(" & "))}const r=i.join(" vs "),d=this.gameSharedWith(e);return d.length===0?`Sides: ${r}.`:`Sides: ${r} — shared with ${this.joinLabels(d)}.`}joinLabels(e){return e.length<=1?e.join(""):`${e.slice(0,-1).join(", ")} and ${e.at(-1)}`}adjustGame(e){this.gameSharesSides(e)&&this.forkGame(e);const t=new Set(Object.values(this.pickedByKey(e)?.ballTeams??{}));this.teams.set(this.teams.get().map(n=>t.has(n.key)?{...n,autoCreated:!1}:n)),this.formatSlots.set(this.formatSlots.get().map(n=>n.gameKey===e?{...n,gameKey:void 0}:n)),this.picked.set(this.picked.get().filter(n=>n.key!==e)),this.customOpen.set(!0)}addCustomGame(){this.customOpen.set(!0);const e=new Set(this.formatSlots.get().map(n=>n.formatId)),t=this.catalog.descriptors.get().find(n=>!e.has(n.id));this.addFormatSlot(t?.id)}showFlexible(){return this.customOpen.get()||this.customSlots().length>0||this.customTeams().length>0}customSlots(){return this.formatSlots.get().filter(e=>e.gameKey===void 0)}customTeams(){const e=this.cardOwnedTeamKeys();return this.teams.get().filter(t=>!e.has(t.key)&&!this.isSectionTeam(t))}cardOwnedTeamKeys(){const e=new Set;for(const t of this.picked.get())for(const n of Object.values(t.ballTeams))e.add(n);return e}slotIndex(e){return this.formatSlots.get().findIndex(t=>t.key===e)}ballTeamsAvailable(){return this.formationCatalog.available()}ballTeamsExpanded(){return this.ballTeamsOpen.get()||this.sectionTeams().length>0}openBallTeams(){this.ballTeamsOpen.set(!0),this.sectionTeams().length===0&&this.addBallTeam()}isSectionTeam(e){return e.section===!0}sectionTeams(){return this.teams.get().filter(e=>this.isSectionTeam(e))}liveSectionTeams(){return this.sectionTeams().filter(e=>this.ballTeamMemberKeys(e).length>=fe)}ballTeamMemberKeys(e){return(e.memberOrder??Object.keys(e.pctByPlayer).map(Number)).filter(n=>e.pctByPlayer[n]!==void 0)}ballTeamMembers(e){const t=this.teamByKey(e);if(!t)return[];const n=new Map(this.players.get().map(i=>[i.key,i]));return this.ballTeamMemberKeys(t).map(i=>n.get(i)).filter(i=>i!==void 0)}formationChips(){return this.formationCatalog.chips()}formationLabel(e){return this.formationCatalog.labelOf(e)}addBallTeam(){const e=this.formationChips()[0]?.id??"scramble";this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:this.lastFormation??e,pctByPlayer:{},memberTeams:{},autoCreated:!1,section:!0,memberOrder:[],pctTextByPlayer:{}}]),this.ballTeamsOpen.set(!0)}removeBallTeam(e){const t=this.teamByKey(e);!t||!this.isSectionTeam(t)||(this.removeTeam(e),this.clearBallTeamNotice(e),this.sectionTeams().length===0&&this.ballTeamsOpen.set(!1),this.syncGamesToBallUnits())}ballTeamFormation(e){return this.teamByKey(e)?.formation??"scramble"}setBallTeamFormation(e,t){const n=this.teamByKey(e);if(!n||!this.isSectionTeam(n))return;const i=this.ballTeamMemberKeys(n).length;if(i>0&&!this.formationCatalog.fits(t,i)){this.setBallTeamNotice(e,`${this.formationLabel(t)} ${this.formationBoundsText(t)} — this team has ${i}.`);return}this.lastFormation=t,this.clearBallTeamNotice(e),this.teams.set(this.teams.get().map(r=>r.key===e?{...r,formation:t}:r)),this.reseedBallTeams()}ballTeamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}ballTeamCandidates(e){const t=new Set;for(const n of this.sectionTeams())if(n.key!==e)for(const i of this.ballTeamMemberKeys(n))t.add(i);return this.players.get().filter(n=>!t.has(n.key))}setBallTeamMember(e,t,n){const i=this.teamByKey(e);if(!i||!this.isSectionTeam(i))return;const r=this.ballTeamMemberKeys(i);if(n){if(r.includes(t))return;const u=Math.min(this.formationCatalog.sizeOf(i.formation)?.max??Me,Me);if(r.length>=u){this.setBallTeamNotice(e,`${this.formationLabel(i.formation)} ${this.formationBoundsText(i.formation)} — remove someone first.`);return}}const d={...i.pctByPlayer},o={...i.pctTextByPlayer??{}};let c;n?(d[t]=this.tailAllowance(i.formation,r.length+1),c=[...r,t]):(delete d[t],delete o[t],c=r.filter(u=>u!==t)),this.clearBallTeamNotice(e),this.teams.set(this.teams.get().map(u=>u.key===e?{...u,pctByPlayer:d,pctTextByPlayer:o,memberOrder:c}:u)),this.reseedBallTeams(),this.syncGamesToBallUnits()}tailAllowance(e,t){const n=this.formationCatalog.allowances(e,t);if(n)return String(n[t-1]??n.at(-1)??0);const i=Object.values(this.formationCatalog.byId(e)?.allowancesBySize??{}).map(r=>r.at(-1)).filter(r=>r!==void 0);return i.length>0?String(Math.min(...i)):"100"}ballTeamPctText(e,t){const n=this.teamByKey(e);return n?n.pctTextByPlayer?.[t]??n.pctByPlayer[t]??"":""}setBallTeamPct(e,t,n){const i=this.teamByKey(e);!i||!this.isSectionTeam(i)||i.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(r=>r.key===e?{...r,customized:!0,pctTextByPlayer:{...r.pctTextByPlayer??{},[t]:n}}:r))}ballTeamLabel(e){const t=this.teamByKey(e);return t&&this.ballTeamMemberKeys(t).length>=fe?this.teamLabel(t):"New team"}ballTeamCount(){return this.liveSectionTeams().length}sharedBallPlayerCount(){return this.liveSectionTeams().reduce((e,t)=>e+this.ballTeamMemberKeys(t).length,0)}ballTeamSummary(e){const t=this.ballTeamMembers(e);if(t.length<fe)return"";const i=[t.map(d=>d.name.trim()||"Player").join(" + "),this.formationLabel(this.ballTeamFormation(e)),"plays one ball"],r=this.teamBallCh(e);return r!==null&&i.push(`HCP ${r}`),i.join(" · ")}ballTeamHint(e){const t=this.teamByKey(e);if(!t)return"";const n=fe-this.ballTeamMemberKeys(t).length;return n<=0?"":`Pick ${n} more player${n===1?"":"s"} — a shared ball needs at least ${fe}.`}ballTeamNotice(e){return this.ballTeamNotices.get()[e]??""}setBallTeamNotice(e,t){this.ballTeamNotices.set({...this.ballTeamNotices.get(),[e]:t})}clearBallTeamNotice(e){if(this.ballTeamNotices.get()[e]===void 0)return;const t={...this.ballTeamNotices.get()};delete t[e],this.ballTeamNotices.set(t)}formationBoundsText(e){const t=this.formationCatalog.sizeOf(e);return t?t.min===t.max?`is played by exactly ${t.min}`:`takes ${t.min}–${t.max} players`:`takes up to ${Me} players`}reseedBallTeams(){const e=this.teams.get();if(!e.some(r=>this.isSectionTeam(r)))return;const t=new Set(this.players.get().map(r=>r.key));let n=!1;const i=e.map(r=>{if(!this.isSectionTeam(r))return r;const d=this.ballTeamMemberKeys(r).filter(m=>t.has(m)),o=r.customized?d:this.sortBySeeding(d),c=this.formationCatalog.allowances(r.formation,o.length),u={},p={};return o.forEach((m,h)=>{const g=String(c?.[h]??100);u[m]=r.customized?r.pctByPlayer[m]??g:g;const v=r.pctTextByPlayer?.[m];r.customized&&v!==void 0&&(p[m]=v)}),Af(o,this.ballTeamMemberKeys(r))&&xi(u,r.pctByPlayer)&&xi(p,r.pctTextByPlayer??{})?r:(n=!0,{...r,memberOrder:o,pctByPlayer:u,pctTextByPlayer:p})});n&&this.teams.set(i)}sortBySeeding(e){const t=this.players.get(),n=i=>{const r=t.findIndex(c=>c.key===i),d=r>=0?t[r]:null,o=d?this.derivedCH(d):null;return o?[0,o.ch,r]:[1,0,r]};return[...e].sort((i,r)=>{const d=n(i),o=n(r);return d[0]-o[0]||d[1]-o[1]||d[2]-o[2]})}ballUnits(){const e=new Map;for(const i of this.liveSectionTeams())for(const r of this.ballTeamMemberKeys(i))e.set(r,i);const t=[],n=new Set;for(const i of this.players.get()){const r=e.get(i.key);if(!r){t.push({teamKey:null,members:[i.key]});continue}n.has(r.key)||(n.add(r.key),t.push({teamKey:r.key,members:this.ballTeamMemberKeys(r)}))}return t}soloPlayers(){const e=new Set;for(const t of this.liveSectionTeams())for(const n of this.ballTeamMemberKeys(t))e.add(n);return this.players.get().filter(t=>!e.has(t.key))}unitAssignment(e,t){if(this.liveSectionTeams().length===0||this.isIndividualShape(t))return null;if(this.isSideFormat(e)){if(this.adoptableTeams(t))return null;const c=this.soloPlayers();return{ballCount:t.count.min,ballByPlayer:this.defaultAssignment(t,t.count.min,c),ballTeams:{}}}const n=this.ballUnits(),i=t.count.max??n.length;let r=n;if(n.length>i){const c=n.filter(p=>p.teamKey!==null);let u=Math.max(0,i-c.length);r=n.filter(p=>p.teamKey!==null?!0:u===0?!1:(u--,!0)),r.length>i&&(r=r.slice(0,i))}const d={},o={};return r.forEach((c,u)=>{for(const p of c.members)d[p]=u;c.teamKey!==null&&(o[u]=c.teamKey)}),{ballCount:r.length,ballByPlayer:d,ballTeams:o}}syncGamesToBallUnits(){const e=this.picked.get();if(e.length===0)return;const t=e.map(n=>{const i=this.shapeOfGame(n.formatId);if(!i||n.ballCount===0)return n;const r=this.unitAssignment(n.formatId,i);if(!r){const d={};for(const[o,c]of Object.entries(n.ballTeams))this.teamByKey(c)&&(d[Number(o)]=c);return{...n,ballTeams:d}}return{...n,...r}});this.picked.set(t);for(const n of t)this.regenerateGame(n)}allowanceOf(e,t){if(!this.isSectionTeam(e))return this.parsePct(e.pctByPlayer[t]??"");const n=wi(e.pctTextByPlayer?.[t]);return n!==null?n:wi(e.pctByPlayer[t])??100}formations=Hf;addTeam(){this.teams.set([...this.teams.get(),{key:this.nextTeamKey++,kind:"single_ball",formation:"scramble",pctByPlayer:{},memberTeams:{},autoCreated:!1}])}teamKindOf(e){return this.teamByKey(e)?.kind??"single_ball"}setTeamKind(e,t){this.teams.set(this.teams.get().map(n=>n.key===e?{...n,kind:t,memberTeams:t==="single_ball"?{}:n.memberTeams}:n)),this.pruneStaleTeamSubjects()}eligibleNestedTeams(e){return this.teams.get().filter(t=>t.key!==e&&t.kind==="single_ball")}teamHasTeamMember(e,t){return this.teamByKey(e)?.memberTeams[t]===!0}setTeamMemberTeam(e,t,n){const i=this.teamByKey(e);if(!i||i.kind!=="multi_ball"||t===e)return;const r={...i.memberTeams};if(n){if(this.teamMemberCount(e)>=Me)return;r[t]=!0}else delete r[t];this.teams.set(this.teams.get().map(d=>d.key===e?{...d,memberTeams:r}:d))}teamMemberCount(e){const t=this.teamByKey(e);return t?Object.keys(t.pctByPlayer).length+Object.keys(t.memberTeams).filter(n=>t.memberTeams[Number(n)]).length:0}pruneStaleTeamSubjects(){this.formatSlots.set(this.formatSlots.get().map(e=>{let t=!1;const n={...e.subjectTeams};for(const i of this.teams.get())n[i.key]===!0&&!this.teamKindFitsFormat(e.formatId,i.kind)&&(delete n[i.key],t=!0);return t?{...e,subjectTeams:n}:e}))}isSideFormat(e){return this.catalog.isSideFormat(e)}teamKindFitsFormat(e,t){return this.isSideFormat(e)?t==="multi_ball":t==="single_ball"||this.catalog.acceptsSideSubjects(e)}removeTeam(e){this.teams.set(this.teams.get().filter(t=>t.key!==e).map(t=>{if(t.memberTeams[e]===void 0)return t;const n={...t.memberTeams};return delete n[e],{...t,memberTeams:n}})),this.formatSlots.set(this.formatSlots.get().map(t=>{if(t.subjectTeams[e]===void 0)return t;const n={...t.subjectTeams};return delete n[e],{...t,subjectTeams:n}}))}teamByKey(e){return this.teams.get().find(t=>t.key===e)??null}teamLabel(e){const t=this.liveTeamKeySet(),i=this.teams.get().filter(r=>r.key===e.key||t.has(r.key)).findIndex(r=>r.key===e.key);return`Team ${this.teamLetter(Math.max(0,i))}`}setTeamFormation(e,t){this.teams.set(this.teams.get().map(n=>n.key===e?{...n,formation:t}:n))}teamMemberIn(e,t){return this.teamByKey(e)?.pctByPlayer[t]!==void 0}setTeamMember(e,t,n){const i=this.teamByKey(e);if(!i)return;const r={...i.pctByPlayer};if(n){if(r[t]!==void 0||this.teamMemberCount(e)>=Me)return;r[t]=r[t]??"100"}else delete r[t];this.teams.set(this.teams.get().map(d=>d.key===e?{...d,pctByPlayer:r}:d))}teamSize(e){return this.teamMemberCount(e)}teamAtMaxSize(e){return this.teamSize(e)>=Me}teamBallCh(e){const t=this.teamByKey(e);if(!t)return null;let n=0;for(const i of this.players.get()){if(t.pctByPlayer[i.key]===void 0)continue;const r=this.derivedCH(i);if(!r)return null;n+=this.allowanceOf(t,i.key)*r.ch/100}return Math.round(n)}teamsBelowMin(){return this.teams.get().filter(e=>this.teamMemberCount(e.key)>0&&this.teamMemberCount(e.key)<fe)}isTeamLive(e){const t=Object.keys(e.pctByPlayer).length;if(e.kind==="single_ball")return t>=fe;let n=t;for(const i of this.teams.get())e.memberTeams[i.key]===!0&&i.kind==="single_ball"&&Object.keys(i.pctByPlayer).length>=fe&&n++;return n>=fe}liveTeamKeySet(){return new Set(this.teams.get().filter(e=>this.isTeamLive(e)).map(e=>e.key))}setTeamPct(e,t,n){const i=this.teamByKey(e);!i||i.pctByPlayer[t]===void 0||this.teams.set(this.teams.get().map(r=>r.key===e?{...r,pctByPlayer:{...r.pctByPlayer,[t]:n}}:r))}groupsEnabled(){return this.groups.get().length>0}splitIntoGroups(){if(this.groupsEnabled())return;const e={};for(const t of this.players.get())e[t.key]=!0;this.groups.set([{key:this.nextGroupKey++,startTime:"",startHole:null,members:e},{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}clearGroups(){this.groups.set([])}addGroup(){this.groupsEnabled()&&this.groups.set([...this.groups.get(),{key:this.nextGroupKey++,startTime:"",startHole:null,members:{}}])}removeGroup(e){const t=this.groups.get().filter(n=>n.key!==e);this.groups.set(t.length>1?t:[])}groupByKey(e){return this.groups.get().find(t=>t.key===e)??null}groupLabel(e){const t=this.groups.get().findIndex(n=>n.key===e.key);return`Group ${Math.max(0,t)+1}`}groupMemberIn(e,t){return this.groupByKey(e)?.members[t]===!0}setGroupMember(e,t,n){this.groups.set(this.groups.get().map(i=>{const r=i.key===e,d=i.members[t]===!0;if(r&&n&&!d)return{...i,members:{...i.members,[t]:!0}};if(d&&(!r||!n)){const o={...i.members};return delete o[t],{...i,members:o}}return i}))}setGroupStartTime(e,t){this.groups.set(this.groups.get().map(n=>n.key===e?{...n,startTime:t}:n))}setGroupStartHole(e,t){this.groups.set(this.groups.get().map(n=>n.key===e?{...n,startHole:t}:n))}groupSize(e){const t=this.groupByKey(e);return t?this.players.get().filter(n=>t.members[n.key]===!0).length:0}ungroupedPlayers(){if(!this.groupsEnabled())return[];const e=new Set;for(const t of this.groups.get())for(const n of Object.keys(t.members))t.members[Number(n)]&&e.add(Number(n));return this.players.get().filter(t=>!e.has(t.key))}crossGroupTeamWarnings(){if(!this.groupsEnabled())return[];const e=new Map;this.groups.get().forEach((n,i)=>{for(const r of Object.keys(n.members))n.members[Number(r)]&&e.set(Number(r),i)});const t=[];for(const n of this.teams.get()){if(n.kind!=="single_ball"||!this.isTeamLive(n))continue;const i=new Set;for(const r of Object.keys(n.pctByPlayer)){const d=e.get(Number(r));d!==void 0&&i.add(d)}i.size>1&&t.push(`${this.teamLabel(n)} plays one combined ball, but its players are in different groups — keep them in the same group.`)}return t}buildGroups(e,t){return this.groups.get().map(n=>({members:e.filter(i=>n.members[i.key]===!0).map(i=>t.get(i.key)),...n.startTime.trim()!==""?{startTime:n.startTime.trim()}:{},...n.startHole!==null?{startHole:n.startHole}:{}})).filter(n=>n.members.length>0)}diagnosticsForGroups(){return this.diagnostics.get().filter(e=>e.path?.startsWith("playingGroups"))}subjectPlayerIn(e,t){return this.slotByKey(e)?.subjectPlayers[t]!==!1}setSubjectPlayer(e,t,n){const i=this.slotByKey(e);i&&this.patchFormatSlot(e,{subjectPlayers:{...i.subjectPlayers,[t]:n}})}subjectTeamIn(e,t){return this.slotByKey(e)?.subjectTeams[t]===!0}setSubjectTeam(e,t,n){const i=this.slotByKey(e);i&&this.patchFormatSlot(e,{subjectTeams:{...i.subjectTeams,[t]:n}})}selectedCourse(){return this.courses.get().find(e=>e.id===this.courseId.get())??null}teeById(e){return this.tees.get().find(t=>t.id===e)??null}presetLabel(e){return zf[e]}presetHoles(){const e=(this.selectedCourse()?.holes??[]).map(t=>t.holeNumber).sort((t,n)=>t-n);switch(this.preset.get()){case"front_9":return e.filter(t=>t<=9);case"back_9":return e.filter(t=>t>=10);default:return e}}startHoleOptions(){return this.presetHoles()}setPreset(e){this.preset.set(e);const t=this.presetHoles();t.includes(this.startHole.get())||this.startHole.set(t[0]??1),this.groups.set(this.groups.get().map(n=>n.startHole!==null&&!t.includes(n.startHole)?{...n,startHole:null}:n))}derivedCH(e){const t=ve(e.handicapIndex);if(t===null)return null;const n=this.teeById(e.teeId);if(!n)return null;const i=n.ratings.find(d=>d.gender===e.gender);if(!i)return null;const r={handicapIndex:t,slope:i.slope,courseRating:i.courseRating,par:i.par};return{ch:wl(r),raw:lr(r),rating:i,teeName:n.name}}diagnosticsForPlayer(e){return this.diagnostics.get().filter(t=>t.path?.startsWith(`producers[${e}]`))}humanizedRoster(){return this.diagnostics.get().filter(e=>e.path==="producers").map(e=>Ct(e,t=>this.catalog.labelOf(t)))}humanizedRoute(){return this.diagnostics.get().filter(e=>e.path==="route").map(e=>Ct(e,t=>this.catalog.labelOf(t)))}playersInNoFormat(){const e=this.players.get(),t=new Set;for(const n of this.formatSlots.get()){const i=this.slotTeamSubjectKeys(n),r=this.slotSuppressedPlayerKeys(n);for(const d of e)n.subjectPlayers[d.key]!==!1&&!r.has(d.key)&&t.add(d.key);for(const d of this.teams.get())if(i.has(d.key))for(const o of e)d.pctByPlayer[o.key]!==void 0&&t.add(o.key)}return e.filter(n=>!t.has(n.key))}diagnosticsForFormat(e){return kf(this.diagnostics.get(),e)}humanizedForFormat(e){return this.diagnosticsForFormat(e).map(t=>Ct(t,n=>this.catalog.labelOf(n)))}generalDiagnostics(){return Sf(this.diagnostics.get())}humanizedGeneral(){return this.generalDiagnostics().map(e=>Ct(e,t=>this.catalog.labelOf(t)))}parsePct(e){const t=Number.parseInt(e,10);return Number.isFinite(t)?t:100}buildTeams(e,t){const n=this.liveTeamKeySet(),i=[];for(const r of this.teams.get()){if(!n.has(r.key))continue;const o=(this.isSectionTeam(r)?this.ballTeamMembers(r.key):e.filter(c=>r.pctByPlayer[c.key]!==void 0)).map(c=>({producerDefId:t.get(c.key),allowancePct:this.allowanceOf(r,c.key)}));if(r.kind==="multi_ball")for(const c of this.teams.get())r.memberTeams[c.key]===!0&&c.key!==r.key&&c.kind==="single_ball"&&n.has(c.key)&&o.push({teamId:String(c.key)});i.push({id:String(r.key),label:this.teamLabel(r),formation:r.formation,kind:r.kind,members:o})}return i}buildFormats(e,t){return this.formatSlots.get().map(n=>{const i=this.isSideFormat(n.formatId),r=this.slotTeamSubjectKeys(n),d=this.slotSuppressedPlayerKeys(n),o=[];if(!i)for(const c of e)n.subjectPlayers[c.key]!==!1&&!d.has(c.key)&&o.push({kind:"player",producerDefId:t.get(c.key)});for(const c of this.teams.get())r.has(c.key)&&o.push({kind:"team",teamId:String(c.key)});return{formatId:n.formatId,allowanceConfig:{type:"flat",pct:this.parsePct(n.allowancePct)},subjects:o,...Object.keys(n.config).length>0?{formatConfig:{...n.config}}:{}}})}buildRoute(){const e=this.presetHoles(),t=this.startHole.get(),n=e.indexOf(t);return n<=0?{roundType:this.preset.get()}:{roundType:"custom_holes",route:{playHoles:[...e.slice(n),...e.slice(0,n)].map(r=>({courseHoleNumber:r})),routeHandicapPolicy:{type:"explicit",postingEligible:!1}}}}slotSubjectCount(e){const t=this.isSideFormat(e.formatId),n=this.slotSuppressedPlayerKeys(e);let i=this.slotTeamSubjectKeys(e).size;if(!t)for(const r of this.players.get())e.subjectPlayers[r.key]!==!1&&!n.has(r.key)&&i++;return i}slotTeamSubjectKeys(e){const t=this.liveTeamKeySet(),n=new Set;for(const i of this.teams.get()){if(!t.has(i.key)||!this.teamKindFitsFormat(e.formatId,i.kind))continue;const r=e.subjectTeams[i.key];if(r===!0){n.add(i.key);continue}r===void 0&&this.isSectionTeam(i)&&!this.isSideFormat(e.formatId)&&n.add(i.key)}return n}slotSuppressedPlayerKeys(e){const t=new Set;for(const n of this.slotTeamSubjectKeys(e)){const i=this.teamByKey(n);if(!(!i||!this.isSectionTeam(i)))for(const r of this.ballTeamMemberKeys(i))t.add(r)}return t}noSubjectsMessage(e){const t=this.catalog.labelOf(e.formatId)??e.formatId;if(e.gameKey!==void 0)return`${t} has nobody playing — put players on a ball above.`;if(!this.isSideFormat(e.formatId))return`${t} has nothing to score — tick at least one player or team under “Scores”.`;const n=this.teams.get();if(n.some(o=>o.kind==="multi_ball"&&this.isTeamLive(o)))return`${t} has no teams ticked — tick the teams it plays under “Scores”.`;if(n.some(o=>o.kind==="single_ball"&&this.isTeamLive(o)))return`${t} is played between teams whose players play their own balls — a team that shares one ball doesn’t fit. Under Teams, switch the team to “Own ball each, scored together as a team”, then tick it under “Scores”.`;const i=this.catalog.classifyId(e.formatId),r=i?.teamCount?.min!==void 0&&i.teamCount.min===i.teamCount.max?`${i.teamCount.min} teams`:i?.teamCount?.min!==void 0?`at least ${i.teamCount.min} teams`:"teams",d=i&&i.teamSize.min===i.teamSize.max?` of ${i.teamSize.min} players`:"";return`${t} is a team game — under Teams, create ${r}${d} with kind “Own ball each, scored together as a team”, add the players, then tick the teams under “Scores”.`}async submit(){this.diagnostics.set([]),this.submitError.set(null);const e=this.players.get();if(!this.courseId.get())return this.submitError.set("Pick a course first."),{ok:!1};if(e.length===0)return this.submitError.set("Add at least one player."),{ok:!1};if(this.formatSlots.get().length===0)return this.submitError.set("Add at least one format."),{ok:!1};const t=[];e.forEach((i,r)=>{i.name.trim()||t.push({code:"missing_name",message:"Name required",path:`producers[${r}].name`}),ve(i.handicapIndex)===null&&t.push({code:"missing_index",message:"Handicap index required",path:`producers[${r}].handicapIndex`}),i.teeId||t.push({code:"missing_tee",message:"Pick a tee",path:`producers[${r}].teeId`})});for(const i of this.liveSectionTeams()){const r=this.ballTeamMemberKeys(i).length,d=this.formationLabel(i.formation),o=this.ballTeamLabel(i.key);if(this.formationCatalog.byId(i.formation)){if(!this.formationCatalog.fits(i.formation,r)){t.push({code:"ball_team_size",message:`${o} has ${r} players sharing a ball, but ${d} ${this.formationBoundsText(i.formation)}. Change the formation or the team.`,path:"teams"});continue}!i.customized&&this.formationCatalog.allowances(i.formation,r)===null&&t.push({code:"ball_team_no_recipe",message:`${o} is a ${r}-player ${d}, and there is no standard handicap allowance for that. Type a % for each player, or put them on their own balls.`,path:"teams"})}}if(this.formatSlots.get().forEach((i,r)=>{this.slotSubjectCount(i)===0&&t.push({code:"no_subjects",message:this.noSubjectsMessage(i),formatIndex:r,path:`formats[${r}]`})}),t.length>0)return this.diagnostics.set(t),{ok:!1};const n=this.editToken.get();this.submitting.set(!0);try{const i=new Map;e.forEach((g,v)=>{i.set(g.key,g.producerDefId??(n?`p-${g.key}`:`p${v+1}`))});const r=[];for(const g of e){const v=ve(g.handicapIndex),w=g.playerId?{kind:"player",id:g.playerId}:g.guestPlayerId?{kind:"guest",id:g.guestPlayerId}:{kind:"guest",id:(await y.guestPlayers.create({displayName:g.name.trim(),gender:g.gender,handicapIndex:v})).id};r.push({producerDefId:i.get(g.key),playerRef:w,handicapIndex:v,gender:g.gender,teeId:g.teeId})}const{roundType:d,route:o}=this.buildRoute(),c=this.buildTeams(e,i),u=this.buildGroups(e,i),p=this.roundName.get().trim(),m={courseId:this.courseId.get(),playedAt:this.editPlayedAt??new Date().toISOString().slice(0,10),...p?{name:p}:{},roundType:d,...o?{route:o}:{},producers:r,...c.length>0?{teams:c}:{},formats:this.buildFormats(e,i),...u.length>0?{playingGroups:u}:{}};if(n){for(const v of e){const w=v.name.trim();!v.guestPlayerId||v.guestOriginalName===void 0||w!==v.guestOriginalName&&(await y.friendlyRounds.renameGuest({token:n,guestPlayerId:v.guestPlayerId,displayName:w}),this.players.set(this.players.get().map(T=>T.key===v.key?{...T,guestOriginalName:w}:T)))}const g=await y.friendlyRounds.editSetup({token:n,draft:m});return g.ok?{ok:!0,token:n}:(this.diagnostics.set(g.diagnostics),{ok:!1})}const h=await y.friendlyRounds.create({draft:m});return h.ok?(Je({token:h.friendlyRound.shareToken,courseName:h.round.courseNameSnapshot??"",name:h.round.name,date:h.round.date,status:h.round.status,completedAt:h.round.completedAt,lastSeenAt:new Date().toISOString()}),{ok:!0,token:h.friendlyRound.shareToken}):(this.diagnostics.set(h.diagnostics),{ok:!1})}catch(i){return this.submitError.set(i instanceof Y?i.message==="Validation failed"?["The server could not read this setup — this should not happen, please report it.",...(i.details??[]).slice(0,3).map(r=>`${r.path}: ${r.message}`)].join(`
`):i.message:n?"Could not save the round. Try again.":"Could not create the round. Try again."),{ok:!1}}finally{this.submitting.set(!1)}}}const Bf=["full_18","front_9","back_9"],Ns=()=>_e()==="sv"?",":".",Ff=b(`
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
`),$i=b(`
    <button bind="key" class="hcp-key" type="button">
        <span bind="num" class="hcp-key__num"></span>
        <span bind="lbl" class="hcp-key__lbl"></span>
    </button>
`),Gf=b(`
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
`),jf=b(`
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
`),Df=b(`
    <div class="fslot__group fslot__knob">
        <span bind="label" class="fslot__label"></span>
        <div bind="options" class="fslot__seg"></div>
        <p bind="hint" class="fslot__hint"></p>
    </div>
`),ki=b(`
    <button bind="opt" type="button"></button>
`),Si=b(`
    <label class="irow">
        <input bind="chk" type="checkbox" class="irow__chk" />
        <span bind="name" class="irow__name"></span>
    </label>
`),qf=b(`
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
`),Vf=b(`
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
`),Uf=b(`
    <button bind="row" type="button" class="frow">
        <span bind="name" class="frow__name"></span>
        <span bind="username" class="frow__username"></span>
        <span bind="hcp" class="frow__hcp"></span>
    </button>
`),Ti=b(`
    <button bind="card" class="gcard" type="button">
        <span bind="name" class="gcard__name"></span>
        <span bind="tag" class="gcard__tag"></span>
        <span bind="shape" class="gcard__shape"></span>
    </button>
`),Kf=b(`
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
`),Wf=b(`
    <div class="grow">
        <span bind="name" class="grow__name"></span>
        <div bind="seg" class="fslot__seg"></div>
    </div>
`),Pi=b(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="numeric" /><span>%</span></span>
    </div>
`),Yf=b(`
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
`),Xf=b(`
    <div class="mrow">
        <label class="mrow__pick">
            <input bind="chk" type="checkbox" class="irow__chk" />
            <span bind="name" class="irow__name"></span>
        </label>
        <span bind="pctWrap" class="mrow__pct"><input bind="pct" inputmode="decimal" /><span>% of HCP</span></span>
    </div>
`);class Qf extends M{static styles=`
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
                ${$()}
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
                ${ae()}
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

            & .setup__seg {
                display: flex; gap: ${a("sm")}; margin-bottom: ${a("md")};
                & button {
                    ${$()}
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
                & .player__name { ${ae()} flex: 1; padding: ${a("md")}; font-size: 1rem; }
                & .player__remove {
                    ${$()}
                    width: 38px; height: 38px; flex-shrink: 0;
                    font-size: 1rem; color: ${l("text-muted")};
                }
                & .player__fields { display: flex; gap: ${a("sm")}; align-items: stretch; }
                & .player__index { ${ae()} flex: 1; min-width: 0; padding: ${a("md")}; font-size: 1rem; }
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
                ${$()}
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
                    ${$()}
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
                        & input { ${ae()} width: 56px; padding: ${a("xs")} ${a("sm")}; font-size: 0.95rem; }
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
                    ${$()}
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
                    ${$()}
                    align-self: flex-start; padding: ${a("xs")} ${a("sm")};
                    font-family: inherit; font-weight: 600; font-size: 0.8rem;
                    &.hidden { display: none; }
                }

                & .grp__start {
                    display: flex; gap: ${a("sm")}; align-items: stretch;
                    & .grp__time { ${ae()} flex: 1; min-width: 0; padding: ${a("sm")} ${a("md")}; font-size: 1rem; font-family: inherit; }
                    & .grp__hole { flex: 1; min-width: 0; font-size: 1rem; }
                }
            }

            & .setup__create {
                ${$()}
                width: 100%; padding: ${a("lg")}; font-size: 1.15rem; font-weight: 700;
                font-family: inherit;
                background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                box-shadow: ${l("shadow-elevated")};
                &:hover { background: ${l("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }

            & .setup__cancel {
                ${$()}
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
            & .hcp__bs { ${$()} width: 44px; height: 44px; flex-shrink: 0; font-size: 1.1rem; }
            & .hcp__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
            & .hcp-key {
                ${$()}
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
            & .hcp__cancel { ${$()} flex: 1; padding: ${a("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem; }
            & .hcp__ok {
                ${$()}
                flex: 2; padding: ${a("md")}; font-family: inherit; font-weight: 700; font-size: 0.95rem;
                background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")};
                &:hover { background: ${l("primary")}; }
                &:disabled { opacity: 0.5; cursor: default; }
            }
        }
    `;svc=this.inject(Lf);router=this.inject(G);auth=this.inject(D);profile=this.inject(Ce);friends=this.inject(Zt);pickerOpen=new f(!1);hcpPadFor=new f(null);hcpDraft=new f("");render(){const e=this.router.query("token").get(),t=!!e;this.pickerOpen.set(!1),this.hcpPadFor.set(null),t?this.svc.loadForEdit(e):(this.svc.reset(),this.svc.load()),this.auth.currentUser.get()&&(this.profile.load().then(()=>{if(t)return;const h=this.profile.player.get();h&&this.svc.seedSelf({id:h.id,displayName:h.displayName,handicapIndex:h.handicapIndex,gender:h.gender})}),this.friends.load());const n=()=>t&&this.svc.editBlockedReason.get()!==null,i=()=>t&&this.svc.hasScores.get(),r=()=>this.profile.player.get(),d=()=>{const h=r();return this.auth.currentUser.get()!==null&&h!==null&&!this.svc.hasPlayer(h.id)},o=this.wire(Ff,{root:{className:()=>n()?"setup setup--blocked":"setup"},back:{textContent:()=>t?"← Back to round":"← Home",onclick:()=>t&&e?this.router.navigate("/round",{query:{token:e}}):this.router.navigate("/")},title:{textContent:()=>t?"Edit round":"New round"},subtitle:{textContent:()=>t?"Change the setup — scored balls are preserved.":"No sign-in required."},blocked:{className:()=>n()?"setup__blocked":"setup__blocked hidden",textContent:()=>this.svc.editBlockedReason.get()==="round_complete"?"This round is complete — its setup can no longer be edited.":this.svc.editBlockedReason.get()==="no_stored_draft"?"This round didn't come from the setup wizard, so it can't be edited here.":this.svc.editBlockedReason.get()==="has_open_seats"?"This round has open seats waiting to be claimed — the wizard cannot edit it yet.":""},roundName:{value:()=>this.svc.roundName.get(),oninput:h=>this.svc.roundName.set(h.target.value)},lockNote:{className:()=>i()?"setup__locknote":"setup__locknote hidden"},routeErr:{textContent:()=>this.svc.humanizedRoute().join(`
`)},rosterErr:{textContent:()=>this.svc.humanizedRoster().join(`
`)},cancel:{className:()=>t?"setup__cancel":"setup__cancel hidden",onclick:()=>e&&this.router.navigate("/round",{query:{token:e}})},addPlayer:{onclick:()=>this.svc.addPlayer()},addMe:{className:()=>d()?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>`+ Add me (${r()?.displayName??""})`,onclick:()=>{const h=r();h&&this.svc.addMe({id:h.id,displayName:h.displayName,handicapIndex:h.handicapIndex,gender:h.gender})}},addFriends:{className:()=>this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__add setup__addme":"setup__add setup__addme hidden",textContent:()=>this.pickerOpen.get()?"− From friends":"+ From friends",onclick:()=>this.pickerOpen.set(!this.pickerOpen.get())},friendPicker:{className:()=>this.pickerOpen.get()&&this.auth.currentUser.get()!==null&&this.friends.friends.get().length>0?"setup__friends":"setup__friends hidden"},ballTeamsSection:{className:()=>this.svc.ballTeamsAvailable()?"setup__section":"setup__section hidden"},ballPitch:{className:()=>this.svc.ballTeamsExpanded()?"bteams__pitch hidden":"bteams__pitch"},ballOpen:{className:()=>this.svc.ballTeamsExpanded()?"bteams":"bteams hidden"},ballHeading:{textContent:()=>{const h=this.svc.ballTeamCount();return h===0?"Sharing a ball":`Sharing a ball · ${h} team${h===1?"":"s"}`}},openBallTeams:{onclick:()=>this.svc.openBallTeams()},addBallTeam:{onclick:()=>this.svc.addBallTeam()},teamsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},formatsSection:{className:()=>this.svc.showFlexible()?"setup__section":"setup__section hidden"},addTeam:{onclick:()=>this.svc.addTeam()},splitGroups:{className:()=>this.svc.groupsEnabled()?"setup__add hidden":"setup__add",onclick:()=>this.svc.splitIntoGroups()},addGroup:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.addGroup()},clearGroups:{className:()=>this.svc.groupsEnabled()?"setup__add":"setup__add hidden",onclick:()=>this.svc.clearGroups()},groupNote:{textContent:()=>{const h=this.svc.ungroupedPlayers();return h.length===0?"":`${h.map(v=>v.name.trim()||"A player").join(", ")} ${h.length>1?"aren't":"isn't"} in a group yet — every player needs one.`}},groupWarn:{textContent:()=>[...this.svc.crossGroupTeamWarnings(),...this.svc.diagnosticsForGroups().map(h=>h.message)].join(`
`)},addFormat:{onclick:()=>this.svc.addFormatSlot()},formatNote:{textContent:()=>{const h=this.svc.playersInNoFormat();return h.length===0?"":`Heads up: ${h.map(v=>v.name.trim()||"A player").join(", ")} ${h.length>1?"aren't":"isn't"} in any format yet — they won't be scored.`}},banner:{textContent:()=>[...this.svc.humanizedGeneral(),...this.svc.submitError.get()?[this.svc.submitError.get()]:[]].join(`
`)},create:{disabled:()=>this.svc.submitting.get(),textContent:()=>this.svc.submitting.get()?t?"Saving…":"Creating…":t?"Save changes":"Create round",onclick:async()=>{const h=await this.svc.submit();h.ok&&this.router.navigate("/round",{query:{token:h.token}})}},hcpPad:{className:()=>this.hcpPadFor.get()!==null?"hcp":"hcp hidden"},hcpBackdrop:{onclick:()=>this.hcpPadFor.set(null)},hcpName:{textContent:()=>this.hcpPlayer()?.name?.trim()||"Player"},hcpCh:{textContent:()=>{const h=this.hcpPlayer();if(!h)return"";const g=this.svc.derivedCH({...h,handicapIndex:this.hcpDraft.get()});return g?`Course handicap ${g.ch} · ${g.teeName}`:"WHS index — “+” means a plus handicap."}},hcpVal:{className:()=>this.hcpDraft.get()?"hcp__val":"hcp__val empty",textContent:()=>this.hcpDraft.get()||"HCP index"},hcpBack:{onclick:()=>this.hcpDraft.set(this.hcpDraft.get().slice(0,-1))},hcpCancel:{onclick:()=>this.hcpPadFor.set(null)},hcpOk:{disabled:()=>this.hcpDraft.get()!==""&&ve(this.hcpDraft.get())===null,onclick:()=>this.hcpCommit()}}),c=this.ref(o,"hcpKeys");for(const h of["1","2","3","4","5","6","7","8","9"])c.appendChild(this.hcpKey(h,"",()=>this.hcpAppendDigit(h)));c.appendChild(this.wireEl($i,{key:{className:()=>this.hcpDraft.get().startsWith("+")?"hcp-key on":"hcp-key",onclick:()=>this.hcpTogglePlus()},num:{textContent:"+"},lbl:{textContent:"plus hcp"}})),c.appendChild(this.hcpKey("0","",()=>this.hcpAppendDigit("0"))),c.appendChild(this.hcpKey(Ns(),"",()=>this.hcpAppendSep()));const u=h=>{if(this.hcpPadFor.get()!==null){if(h.key>="0"&&h.key<="9")this.hcpAppendDigit(h.key);else if(h.key===","||h.key===".")this.hcpAppendSep();else if(h.key==="+"||h.key==="-")this.hcpTogglePlus();else if(h.key==="Backspace")this.hcpDraft.set(this.hcpDraft.get().slice(0,-1));else if(h.key==="Enter")this.hcpCommit();else if(h.key==="Escape")this.hcpPadFor.set(null);else return;h.preventDefault()}};document.addEventListener("keydown",u),this.track(()=>document.removeEventListener("keydown",u));const p=this.ref(o,"hcpPad");document.body.appendChild(p),this.track(()=>p.remove()),this.$each(this.ref(o,"presets"),()=>Bf,(h,g,v)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>this.svc.presetLabel(h),className:()=>this.svc.preset.get()===h?"on":"",disabled:()=>i(),onclick:()=>{i()||this.svc.setPreset(h)}}},v),h=>h);const m=h=>this.track(h);return this.mountSelect(this.ref(o,"course"),m,{value:this.bound(m,()=>this.svc.courseId.get(),h=>{h&&h!==this.svc.courseId.get()&&this.svc.selectCourse(h)}),options:{get:()=>{const h=[];let g="";for(const v of this.svc.courses.get())v.clubName!==g&&(h.push({value:`__club:${v.clubName}`,label:v.clubName,disabled:!0}),g=v.clubName),h.push({value:v.id,label:v.name});return h}},placeholder:"Select a course",disabled:{get:()=>i()}}),this.mountSelect(this.ref(o,"startHole"),m,{value:this.bound(m,()=>String(this.svc.startHole.get()),h=>this.svc.startHole.set(Number(h))),options:{get:()=>this.svc.startHoleOptions().map(h=>({value:String(h),label:String(h)}))},disabled:{get:()=>i()}}),this.$each(this.ref(o,"friendRows"),()=>Mt(this.friends.friends.get().filter(h=>!this.svc.hasPlayer(h.id)),"frecency"),(h,g,v)=>this.wireEl(Uf,{row:{onclick:()=>this.svc.addFriend({id:h.id,displayName:h.displayName,handicapIndex:h.handicapIndex,gender:h.gender})},name:()=>h.displayName,username:()=>`@${h.username}`,hcp:()=>h.handicapIndex===null?"–":h.handicapIndex.toFixed(1)},v),h=>h.id),this.$each(this.ref(o,"players"),this.svc.players,(h,g,v)=>this.playerRow(h.key,v),h=>h.key),this.$each(this.ref(o,"cards"),()=>[...this.svc.presetGames().map(h=>h.id),"__custom"],(h,g,v)=>h==="__custom"?this.wireEl(Ti,{card:{className:()=>"gcard gcard--custom",onclick:()=>this.svc.addCustomGame()},name:{textContent:"+ Custom game"},tag:{textContent:"Anything the cards don't cover — teams and formats by hand."},shape:{textContent:""}},v):this.gameCard(h,v),h=>h),this.$each(this.ref(o,"games"),this.svc.picked,(h,g,v)=>this.gamePanel(h.key,v),h=>h.key),this.$each(this.ref(o,"teams"),()=>this.svc.customTeams(),(h,g,v)=>this.teamCard(h.key,v),h=>h.key),this.$each(this.ref(o,"ballTeams"),()=>this.svc.sectionTeams(),(h,g,v)=>this.ballTeamCard(h.key,v),h=>h.key),this.$each(this.ref(o,"groups"),this.svc.groups,(h,g,v)=>this.groupCard(h.key,v),h=>h.key),this.$each(this.ref(o,"formats"),()=>this.svc.customSlots(),(h,g,v)=>this.formatCard(h.key,v),h=>h.key),o}mountSelect(e,t,n){const i=new pe(n);i.mount(e),t(()=>i.destroy())}bound(e,t,n){const i=new f(t());return e(C(()=>i.set(t()))),e(C(()=>{const r=i.get();queueMicrotask(()=>n(r))})),i}eachInto(e,t,n,i,r){const d=new Map,o=new Map;t(()=>{for(const c of o.values())c.forEach(u=>u());o.clear()}),t(C(()=>{const c=n(),u=new Map;for(const[m,h]of c.entries()){const g=r(h,m);if(d.has(g))u.set(g,d.get(g));else{const v=[];u.set(g,i(h,m,w=>v.push(w))),o.set(g,v)}}for(const[m,h]of d)u.has(m)||(h.remove(),o.get(m)?.forEach(g=>g()),o.delete(m));let p=e.firstChild;for(const m of u.values())m===p?p=p.nextSibling:e.insertBefore(m,p);d.clear();for(const[m,h]of u)d.set(m,h)}))}gameCard(e,t){const n=()=>this.svc.gameFits(e);return this.wireEl(Ti,{card:{className:()=>this.svc.isGamePicked(e)?"gcard on":"gcard",disabled:()=>!n(),onclick:()=>this.svc.toggleGame(e)},name:{textContent:()=>this.svc.gameLabel(e)},tag:{textContent:()=>n()?this.svc.catalog.taglineOf(e):this.svc.gameNeedsText(e)},shape:{textContent:()=>n()?this.svc.gameShapeText(e):""}},t)}gamePanel(e,t){const n=()=>this.svc.pickedByKey(e),i=()=>this.svc.slotForGame(e),r=()=>n()?.formatId??"",d=()=>(n()?.ballCount??0)>0,o=this.wireEl(Kf,{title:{textContent:()=>this.svc.gameLabel(r())},remove:{onclick:()=>this.svc.unpickGame(e)},desc:{textContent:()=>this.svc.catalog.byId(r())?.description??""},allowance:{value:i()?.allowancePct??"100",oninput:c=>{const u=i();u&&this.svc.setSlotAllowance(u.key,c.target.value)}},ballGroup:{hidden:()=>!d()},addBall:{className:()=>this.svc.canAddBall(e)?"gaddball":"gaddball hidden",onclick:()=>this.svc.addBall(e)},err:{textContent:()=>{const c=i();return[...this.svc.gameWarnings(e),...c?this.svc.humanizedForFormat(this.svc.slotIndex(c.key)):[]].join(" · ")}},sides:{textContent:()=>this.svc.gameSidesText(e)},fork:{className:()=>this.svc.gameSharesSides(e)?"gadjust":"gadjust hidden",onclick:()=>this.svc.forkGame(e)},summary:{textContent:()=>this.svc.gameSummary(e)},adjust:{onclick:()=>this.svc.adjustGame(e)}},t);return this.eachInto(this.ref(o,"configFields"),t,()=>this.svc.catalog.byId(r())?.configFields??[],(c,u,p)=>this.configField(()=>i()?.key??null,c,p),c=>`${r()}:${c.key}`),this.eachInto(this.ref(o,"ballRows"),t,()=>d()?this.svc.players.get():[],(c,u,p)=>this.ballRow(e,c.key,p),c=>c.key),o}ballRow(e,t,n){const i=this.wireEl(Wf,{name:{textContent:()=>this.svc.players.get().find(r=>r.key===t)?.name?.trim()||"Player"}},n);return this.eachInto(this.ref(i,"seg"),n,()=>[...this.svc.gameBalls(e),null],(r,d,o)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>r===null?"–":this.svc.teamLetter(r),className:()=>this.svc.ballOf(e,t)===r?"on":"",onclick:()=>this.svc.assignBall(e,t,r)}},o),r=>String(r)),i}formatCard(e,t){const n=()=>this.svc.slotByKey(e),i=()=>n()?.formatId??"",r=this.wireEl(jf,{remove:{onclick:()=>this.svc.removeFormatSlot(e)},desc:{textContent:()=>this.svc.catalog.byId(i())?.description??""},allowance:{value:this.svc.slotByKey(e)?.allowancePct??"100",oninput:o=>this.svc.setSlotAllowance(e,o.target.value)},allowanceHint:{textContent:()=>this.svc.isSideFormat(i())?"applied to each member’s own ball":"of each player’s course handicap"},err:{textContent:()=>this.svc.humanizedForFormat(this.svc.slotIndex(e)).join(" · ")}},t);this.mountSelect(this.ref(r,"format"),t,{value:this.bound(t,()=>i(),o=>{o&&o!==this.svc.slotByKey(e)?.formatId&&this.svc.setSlotFormat(e,o)}),options:{get:()=>this.svc.catalog.descriptors.get().map(o=>({value:o.id,label:this.svc.catalog.labelOf(o)??o.label}))}}),this.eachInto(this.ref(r,"configFields"),t,()=>this.svc.catalog.byId(i())?.configFields??[],(o,c,u)=>this.configField(()=>e,o,u),o=>`${i()}:${o.key}`);const d=()=>{const o=this.svc.isSideFormat(i()),c=[];o||c.push(...this.svc.players.get().map(u=>({kind:"player",subKey:u.key})));for(const u of this.svc.customTeams())this.svc.teamKindFitsFormat(i(),u.kind)&&c.push({kind:"team",subKey:u.key});return c};return this.eachInto(this.ref(r,"subjectRows"),t,d,(o,c,u)=>this.subjectRow(e,o.kind,o.subKey,u),o=>`${o.kind}${o.subKey}`),r}configField(e,t,n){const i=()=>{const o=e();return o===null?t.default:this.svc.slotConfigValue(o,t)},r=()=>{const o=i(),c=t.options.find(u=>u.value===o);return c?this.svc.catalog.configHintOf(c):""},d=this.wireEl(Df,{label:{textContent:()=>this.svc.catalog.configLabelOf(t)},hint:{textContent:r}},n);return this.svc.catalog.configFieldIsInline(t)&&d.classList.add("fslot__knob--inline"),this.eachInto(this.ref(d,"options"),n,()=>t.options,(o,c,u)=>this.wireEl(ki,{opt:{textContent:()=>this.svc.catalog.configLabelOf(o),className:()=>i()===o.value?"on":"",onclick:()=>{const p=e();p!==null&&this.svc.setSlotConfig(p,t.key,o.value)}}},u),o=>o.value),d}subjectRow(e,t,n,i){const r=()=>{if(t==="player")return this.svc.players.get().find(u=>u.key===n)?.name?.trim()||"Player";const c=this.svc.teamByKey(n);return c?`${this.svc.teamLabel(c)} (${c.kind==="multi_ball"?"own balls":"one ball"})`:"Team"},d=()=>t==="player"?this.svc.subjectPlayerIn(e,n):this.svc.subjectTeamIn(e,n),o=c=>t==="player"?this.svc.setSubjectPlayer(e,n,c):this.svc.setSubjectTeam(e,n,c);return this.wireEl(Si,{chk:{checked:()=>d(),onchange:c=>o(c.target.checked)},name:{textContent:()=>r()}},i)}groupCard(e,t){const n=this.wireEl(Vf,{remove:{onclick:()=>this.svc.removeGroup(e)},groupName:{textContent:()=>{const i=this.svc.groupByKey(e);return i?this.svc.groupLabel(i):"Group"}},time:{value:this.svc.groupByKey(e)?.startTime??"",oninput:i=>this.svc.setGroupStartTime(e,i.target.value)},meta:{textContent:()=>{const i=this.svc.groupSize(e);return i===0?"Tick the players who walk with this group.":`${i} player${i===1?"":"s"}`}}},t);return this.mountSelect(this.ref(n,"hole"),t,{value:this.bound(t,()=>{const i=this.svc.groupByKey(e)?.startHole;return i==null?"":String(i)},i=>this.svc.setGroupStartHole(e,i===""?null:Number(i))),options:{get:()=>[{value:"",label:"First hole"},...this.svc.startHoleOptions().map(i=>({value:String(i),label:`Hole ${i}`}))]}}),this.eachInto(this.ref(n,"memberRows"),t,()=>this.svc.players.get(),(i,r,d)=>this.groupMemberRow(e,i.key,d),i=>i.key),n}groupMemberRow(e,t,n){return this.wireEl(Si,{chk:{checked:()=>this.svc.groupMemberIn(e,t),onchange:i=>this.svc.setGroupMember(e,t,i.target.checked)},name:{textContent:()=>this.svc.players.get().find(i=>i.key===t)?.name?.trim()||"Player"}},n)}teamCard(e,t){const n=()=>this.svc.teamKindOf(e)==="multi_ball",i=this.wireEl(qf,{remove:{onclick:()=>this.svc.removeTeam(e)},teamName:{textContent:()=>{const r=this.svc.teamByKey(e);return r?this.svc.teamLabel(r):"Team"}},compGroup:{hidden:()=>n()},membersLabel:{textContent:()=>n()?"Members (each a ball)":"Members & allowance"},teamMeta:{textContent:()=>{const r=this.svc.teamSize(e);if(r===0)return n()?"Tick at least 2 members — a team scored together needs ≥2 balls.":"Tick at least 2 players to form a team ball.";if(r<2)return"Add one more member — a team needs at least 2.";if(n())return`${r} balls · own ball each, scored together as a team`;const d=this.svc.teamBallCh(e);return d===null?`${r} players`:`${r} players · plays off HCP ${d}`}}},t);return this.mountSelect(this.ref(i,"kindSel"),t,{value:this.bound(t,()=>this.svc.teamKindOf(e),r=>this.svc.setTeamKind(e,r==="multi_ball"?"multi_ball":"single_ball")),options:{get:()=>[{value:"single_ball",label:"Share one ball (scramble, foursomes)"},{value:"multi_ball",label:"Own ball each, scored together as a team"}]}}),this.mountSelect(this.ref(i,"formation"),t,{value:this.bound(t,()=>this.svc.teamByKey(e)?.formation??"scramble",r=>this.svc.setTeamFormation(e,r)),options:{get:()=>this.svc.formations.map(r=>({value:r,label:r[0].toUpperCase()+r.slice(1)}))}}),this.eachInto(this.ref(i,"memberRows"),t,()=>{const r=this.svc.players.get().map(d=>({kind:"player",mKey:d.key}));if(n())for(const d of this.svc.eligibleNestedTeams(e))r.push({kind:"team",mKey:d.key});return r},(r,d,o)=>r.kind==="player"?this.teamMemberRow(e,r.mKey,o):this.teamNestedRow(e,r.mKey,o),r=>`${r.kind}${r.mKey}`),i}teamNestedRow(e,t,n){const i=()=>this.svc.teamHasTeamMember(e,t);return this.wireEl(Pi,{chk:{checked:()=>i(),disabled:()=>!i()&&this.svc.teamAtMaxSize(e),onchange:r=>this.svc.setTeamMemberTeam(e,t,r.target.checked)},name:{textContent:()=>{const r=this.svc.teamByKey(t);return r?`${this.svc.teamLabel(r)} (combined ball)`:"Team"}},pctWrap:{hidden:()=>!0},pct:{value:"100",oninput:()=>{}}},n)}teamMemberRow(e,t,n){const i=()=>this.svc.players.get().find(d=>d.key===t)??null,r=()=>this.svc.teamMemberIn(e,t);return this.wireEl(Pi,{chk:{checked:()=>r(),disabled:()=>!r()&&this.svc.teamAtMaxSize(e),onchange:d=>this.svc.setTeamMember(e,t,d.target.checked)},name:{textContent:()=>i()?.name?.trim()||"Player"},pctWrap:{hidden:()=>!r()||this.svc.teamKindOf(e)==="multi_ball"},pct:{value:this.svc.teamByKey(e)?.pctByPlayer[t]??"100",oninput:d=>this.svc.setTeamPct(e,t,d.target.value)}},n)}ballTeamCard(e,t){const n=this.wireEl(Yf,{remove:{onclick:()=>this.svc.removeBallTeam(e)},teamName:{textContent:()=>this.svc.ballTeamLabel(e)},notice:{textContent:()=>this.svc.ballTeamNotice(e),hidden:()=>this.svc.ballTeamNotice(e)===""},summary:{textContent:()=>this.svc.ballTeamSummary(e)||this.svc.ballTeamHint(e)}},t);return this.eachInto(this.ref(n,"formations"),t,()=>this.svc.formationChips(),(i,r,d)=>this.wireEl(ki,{opt:{textContent:()=>this.svc.formationLabel(i.id),className:()=>this.svc.ballTeamFormation(e)===i.id?"on":"",onclick:()=>this.svc.setBallTeamFormation(e,i.id)}},d),i=>i.id),this.eachInto(this.ref(n,"memberRows"),t,()=>this.svc.ballTeamCandidates(e),(i,r,d)=>this.ballMemberRow(e,i.key,d),i=>i.key),n}ballMemberRow(e,t,n){const i=()=>this.svc.ballTeamMemberIn(e,t);return this.wireEl(Xf,{chk:{checked:()=>i(),onchange:r=>this.svc.setBallTeamMember(e,t,r.target.checked)},name:{textContent:()=>this.svc.players.get().find(r=>r.key===t)?.name?.trim()||"Player"},pctWrap:{hidden:()=>!i()},pct:{value:()=>this.svc.ballTeamPctText(e,t),oninput:r=>this.svc.setBallTeamPct(e,t,r.target.value)}},n)}hcpPlayer(){const e=this.hcpPadFor.get();return e===null?null:this.svc.players.get().find(t=>t.key===e)??null}openHcpPad(e){this.hcpDraft.set(this.svc.players.get().find(t=>t.key===e)?.handicapIndex??""),this.hcpPadFor.set(e)}hcpAppendDigit(e){const t=this.hcpDraft.get(),[n,i]=t.replace("+","").split(/[.,]/);if(i!==void 0){if(i.length>=1)return}else if(n.length>=2)return;this.hcpDraft.set(t+e)}hcpAppendSep(){const e=this.hcpDraft.get();/[.,]/.test(e)||this.hcpDraft.set(e.replace("+","")===""?`${e}0${Ns()}`:e+Ns())}hcpTogglePlus(){const e=this.hcpDraft.get();this.hcpDraft.set(e.startsWith("+")?e.slice(1):`+${e.replace("-","")}`)}hcpCommit(){const e=this.hcpPadFor.get();e!==null&&(this.hcpDraft.get()!==""&&ve(this.hcpDraft.get())===null||(this.svc.patchPlayer(e,{handicapIndex:this.hcpDraft.get()}),this.hcpPadFor.set(null)))}hcpKey(e,t,n){return this.wireEl($i,{key:{onclick:n},num:{textContent:e},lbl:{textContent:t}})}playerRow(e,t){const n=()=>this.svc.players.get().find(d=>d.key===e)??null,i=()=>this.svc.players.get().findIndex(d=>d.key===e),r=this.wireEl(Gf,{name:{value:n()?.name??"",readOnly:()=>!!n()?.playerId,oninput:d=>this.svc.patchPlayer(e,{name:d.target.value})},index:{value:()=>n()?.handicapIndex??"",onclick:()=>this.openHcpPad(e),onfocus:d=>{d.target.blur(),this.openHcpPad(e)}},remove:{onclick:()=>this.svc.removePlayer(e)},ch:{textContent:()=>{const d=n();if(!d)return"";const o=this.svc.derivedCH(d);if(!o)return"";const c=o.rating;return`Course handicap ${o.ch}  ·  ${d.handicapIndex} × ${c.slope}/113 + (${c.courseRating} − ${c.par}) = ${o.raw.toFixed(1)}`}},err:{textContent:()=>this.svc.diagnosticsForPlayer(i()).map(d=>d.message).join(" · ")}},t);return this.mountSelect(this.ref(r,"gender"),t,{value:this.bound(t,()=>n()?.gender??"M",d=>this.svc.patchPlayer(e,{gender:d})),options:{get:()=>[{value:"M",label:"M"},{value:"F",label:"F"}]},disabled:{get:()=>n()?.genderKnown===!0}}),this.mountSelect(this.ref(r,"tee"),t,{value:this.bound(t,()=>n()?.teeId??"",d=>this.svc.patchPlayer(e,{teeId:d})),options:{get:()=>this.svc.tees.get().map(d=>({value:d.id,label:d.name}))},placeholder:"Tee"}),r}}function ta(s,e){return _({method:"POST",url:`${q}/auth/login`,body:{username:s,password:e}})}function Jf(){return _({method:"GET",url:`${q}/auth/me`})}function Zf(){return _({method:"POST",url:`${q}/auth/logout`,body:{}})}function em(){return _({method:"POST",url:`${q}/auth/logout-all`,body:{}})}const Os="Something went wrong on our end. Try again in a moment.";function tm(s,e){const t=(s.details??[]).map(i=>i.path),n=i=>t.some(r=>r===`/${i}`);return n("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":n("username")?"Enter your username.":n("displayName")?"Enter a display name.":n("handicapIndex")?"Handicap index must be a number (or leave it empty).":n("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function Ci(s,e){if(s instanceof Y)switch(s.status){case 400:return tm(s,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":Os;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return s.status>=500?Os:"That request could not be completed."}return s instanceof Error&&s.message==="Request timeout"?"That took too long. Check your connection and try again.":s instanceof Error?"Cannot reach the server. Check your connection and try again.":Os}const sm=b(`
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
`);class nm extends M{static styles=`
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
                    ${ae()}
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
                        ${$()}
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
                    ${$()}
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
    `;auth=this.inject(D);router=this.inject(G);nextQ=this.router.query("next");mode=new f("login");busy=new f(!1);formError=new f("");username="";password="";displayName="";hcp="";gender=new f(null);clubs=new f([]);homeClubId=new f("");clubsRequested=!1;async loadClubs(){if(!this.clubsRequested){this.clubsRequested=!0;try{this.clubs.set(await y.setup.clubs())}catch{}}}destination(e){const t=this.nextQ.get();return t&&t.startsWith("/")?t:e}async submit(){if(this.formError.set(""),this.mode.get()==="login"){if(!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const n=await ta(this.username.trim(),this.password);this.auth.currentUser.set(n),this.auth.error.set(null),this.router.navigate(this.destination("/"),!0)}catch(n){this.formError.set(Ci(n,"login"))}finally{this.busy.set(!1)}return}const e=this.hcp.trim(),t=e===""?null:ve(e);if(e!==""&&t===null){this.formError.set("Handicap index must be a number (or leave it empty).");return}if(this.password.length<8){this.formError.set("Password must be at least 8 characters.");return}if(!this.username.trim()||!this.displayName.trim()){this.formError.set("Username and display name are required.");return}this.busy.set(!0);try{const n=await y.players.register({username:this.username.trim(),password:this.password,displayName:this.displayName.trim(),handicapIndex:t,gender:this.gender.get(),homeClubId:this.homeClubId.get()||null});this.auth.currentUser.set({id:n.id,username:n.username}),this.router.navigate(this.destination("/"),!0)}catch(n){this.formError.set(Ci(n,"register"))}finally{this.busy.set(!1)}}render(){const e=()=>this.mode.get()==="register",t=()=>this.auth.loading.get()||this.busy.get(),n=this.wire(sm,{root:{inert:()=>t()},error:{className:()=>this.formError.get()?"error show":"error",textContent:()=>this.formError.get()},form:{onsubmit:async d=>{d.preventDefault(),await this.submit()}},username:{oninput:d=>{this.username=d.target.value}},password:{autocomplete:()=>e()?"new-password":"current-password",oninput:d=>{this.password=d.target.value}},registerFields:{className:()=>e()?"login__register":"login__register hidden"},displayName:{oninput:d=>{this.displayName=d.target.value}},hcp:{oninput:d=>{this.hcp=d.target.value}},submit:{textContent:()=>t()?e()?"Creating account…":"Signing in…":e()?"Create account":"Sign in"},toggle:{textContent:()=>e()?"Have an account? Sign in":"New here? Create an account",onclick:()=>{this.formError.set(""),this.auth.error.set(null);const d=!e();this.mode.set(d?"register":"login"),d&&this.loadClubs()}}}),i=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(n,"gender"),()=>i,(d,o,c)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>d.label,className:()=>this.gender.get()===d.value?"on":"",onclick:()=>this.gender.set(d.value)}},c),d=>d.label);const r=new pe({value:this.homeClubId,options:{get:()=>[{value:"",label:"No home club"},...this.clubs.get().map(d=>({value:d.id,label:d.name}))]},placeholder:"No home club"});return r.mount(this.ref(n,"club")),this.track(()=>r.destroy()),n}}const im=b(`
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
`),rm='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8.5" cy="7.5" r="3.25"/><path d="M2.5 20c.5-3.5 2.7-5.5 6-5.5 2.7 0 5.1 1.8 5.8 4.5"/><circle cx="17.5" cy="16.5" r="4.25"/><path d="M15.5 16.5h4"/></svg>',am=b(`
    <div class="friend-row">
        ${Ie("friend-row__badge")}
        <span class="friend-row__who">
            <span bind="name" class="friend-row__name"></span>
            <span bind="username" class="friend-row__username"></span>
        </span>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="add" class="friend-row__add" type="button">Add</button>
        <span bind="added" class="friend-row__added">✓ Added</span>
    </div>
`),Ii=b(`
    <div class="friend-row">
        <button bind="open" type="button" class="friend-row__main">
            ${Ie("friend-row__badge")}
            <span class="friend-row__who">
                <span bind="name" class="friend-row__name"></span>
                <span bind="subtitle" class="friend-row__subtitle"></span>
                <span bind="connection" class="friend-row__connection"></span>
            </span>
        </button>
        <span bind="hcp" class="friend-row__hcp"></span>
        <button bind="remove" class="friend-row__remove" type="button" aria-label="Remove friend">${rm}</button>
    </div>
`);class om extends M{static styles=`
        .friends {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .friends__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${$()}
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
                    ${$()}
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
                ${ae()}
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
                & .friend-row__subtitle,
                & .friend-row__connection {
                    color: ${l("text-muted")}; font-size: 0.8rem;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                & .friend-row__subtitle:empty,
                & .friend-row__connection:empty { display: none; }
                & .friend-row__hcp {
                    font-weight: 700; flex-shrink: 0;
                    color: ${l("accent")}; background: ${l("accent-soft")};
                    border-radius: ${l("radius-pill")};
                    padding: 2px 10px; font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                }
                & .friend-row__add {
                    ${$()}
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
                    ${$()}
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
    `;svc=this.inject(Zt);auth=this.inject(D);router=this.inject(G);removeOpen=new f(!1);removeTarget=new f(null);render(){const e=()=>this.auth.currentUser.get()!==null;e()&&this.svc.load();const t=this.wire(im,{anon:{className:()=>e()?"friends__anon hidden":"friends__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},body:{className:()=>e()?"friends__body":"friends__body hidden"},search:{value:()=>this.svc.query.get(),oninput:r=>this.svc.setQuery(r.target.value)},searchHint:{textContent:()=>{const r=this.svc.query.get().trim();return r.length>0&&!In(r)?"Type at least 2 characters.":this.svc.searching.get()?"Searching…":""}},searchErr:{textContent:()=>this.svc.searchError.get()?.message??""},resultsEmpty:{className:()=>{const r=this.svc.query.get().trim();return In(r)&&!this.svc.searching.get()&&this.svc.searchError.get()===null&&this.svc.resultsFor.get()===r&&this.svc.results.get().length===0?"friends__empty":"friends__empty hidden"}},friendsEmpty:{className:()=>this.svc.loaded.get()&&St(this.svc.friends.get()).mutual.length===0?"friends__empty":"friends__empty hidden"},connectionsSection:{className:()=>St(this.svc.friends.get()).addedByMe.length>0?"friends__section":"friends__section hidden"},sortToggle:{className:()=>this.svc.friends.get().length>0?"friends__sort":"friends__sort hidden"},sortFrecency:{"aria-pressed":()=>String(this.svc.sortMode.get()==="frecency"),onclick:()=>this.svc.setSortMode("frecency")},sortAlpha:{"aria-pressed":()=>String(this.svc.sortMode.get()==="alpha"),onclick:()=>this.svc.setSortMode("alpha")}});this.$each(this.ref(t,"results"),this.svc.results,(r,d,o)=>this.wireEl(am,{...ke(()=>this.svc.results.get().find(c=>c.id===r.id)??r),name:()=>r.displayName,username:()=>r.homeClubName?`@${r.username} · ${r.homeClubName}`:`@${r.username}`,hcp:()=>r.handicapIndex===null?"–":r.handicapIndex.toFixed(1),add:{className:()=>this.isFriendNow(r.id)?"friend-row__add hidden":"friend-row__add",disabled:()=>this.svc.mutating.get(),onclick:()=>{const c=this.svc.results.get().find(u=>u.id===r.id);c&&!c.isFriend&&this.svc.add(c)}},added:{className:()=>this.isFriendNow(r.id)?"friend-row__added":"friend-row__added hidden"}},o),r=>r.id);const n=new Date().toISOString();this.$each(this.ref(t,"friends"),()=>Mt(St(this.svc.friends.get()).mutual,this.svc.sortMode.get()),(r,d,o)=>this.wireEl(Ii,this.friendRowBindings(r,n),o),r=>r.id),this.$each(this.ref(t,"connections"),()=>Mt(St(this.svc.friends.get()).addedByMe,this.svc.sortMode.get()),(r,d,o)=>this.wireEl(Ii,this.friendRowBindings(r,n),o),r=>r.id),this.spawn(oe,this.ref(t,"removeConfirmHost"),{open:this.removeOpen,title:()=>{const r=this.removeTarget.get();return r?`Remove ${r.displayName} from friends?`:"Remove friend?"},message:()=>{const r=this.removeTarget.get();return r?`${r.displayName} will disappear from your friends list. You can add them again later.`:"They will disappear from your friends list. You can add them again later."},confirmLabel:"Remove friend",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{const r=this.removeTarget.get();r&&this.svc.remove(r.id)}});const i=r=>{r.key==="Escape"&&this.removeOpen.get()&&this.removeOpen.set(!1)};return window.addEventListener("keydown",i),this.track(()=>window.removeEventListener("keydown",i)),t}liveFriend(e){return this.svc.friends.get().find(t=>t.id===e.id)??e}askRemove(e){const t=this.liveFriend(e);this.removeTarget.set({id:t.id,displayName:t.displayName}),this.removeOpen.set(!0)}friendRowBindings(e,t){return{...ke(()=>this.svc.friends.get().find(n=>n.id===e.id)??e),open:{disabled:()=>!this.liveFriend(e).isMutual,onclick:()=>{const n=this.liveFriend(e);n.isMutual&&this.router.navigate("/friend",{query:{id:e.id,name:n.displayName}})}},name:()=>e.displayName,subtitle:()=>tl(this.liveFriend(e),t),connection:()=>sl(this.liveFriend(e))??"",hcp:()=>e.handicapIndex===null?"–":e.handicapIndex.toFixed(1),remove:{"aria-label":()=>`Remove ${this.liveFriend(e).displayName} from friends`,title:()=>`Remove ${this.liveFriend(e).displayName} from friends`,disabled:()=>this.svc.mutating.get()||this.removeOpen.get(),onclick:()=>this.askRemove(e)}}}isFriendNow(e){return this.svc.results.get().find(t=>t.id===e)?.isFriend===!0}}const sa=b(`
    <button bind="row" type="button" class="fr-row">
        <span class="fr-row__text">
            <span bind="title" class="fr-row__title"></span>
            <span bind="subtitle" class="fr-row__subtitle"></span>
        </span>
        <span bind="progress" class="fr-row__progress"></span>
    </button>
`);function na(s,e){return{row:{onclick:()=>e(s.roundId)},title:()=>ml(s),subtitle:()=>gl(s,Be),progress:()=>bl(s)}}function ia(){return`
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
    `}const lm=b(`
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
                ${Ie("fprofile__avatar")}
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
`);class dm extends M{static styles=`
        .fprofile {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .fprofile__back {
                ${$()}
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
                    ${$()}
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
                ${$()}
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
                    ${$()}
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
            ${ia()}
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
    `;svc=this.inject(es);activity=this.inject(en);auth=this.inject(D);router=this.inject(G);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(C(()=>{const h=e.get();te(()=>{!h||!n()||(this.svc.setPlayer(h),this.svc.loadProfile(),this.activity.load())})}));const i=()=>this.svc.profile.get(),r=()=>(t.get()??"").trim()||"Friend",d=new k(()=>{const h=e.get();return h?hl(this.activity.feed.get(),h):null}),o=()=>this.svc.unavailable.get(),c=()=>n()&&o()===null&&i()!==null,u=()=>n()&&o()===null&&i()===null,p=h=>this.router.navigate("/spectate",{query:{id:h,name:i()?.player.displayName??r()}}),m=this.wire(lm,{back:{onclick:()=>this.router.navigate("/friends")},anon:{className:()=>n()?"fprofile__anon hidden":"fprofile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/friends"}})},pending:{className:()=>u()?"fprofile__pending":"fprofile__pending hidden"},pendingName:{textContent:()=>r()},state:{textContent:()=>this.svc.profileLoading.get()?"Loading…":this.svc.profileError.get()??""},retry:{className:()=>this.svc.profileError.get()!==null&&!this.svc.profileLoading.get()?"fprofile__retry":"fprofile__retry hidden",onclick:()=>{this.svc.loadProfile(!0)}},refusal:{className:()=>n()&&o()!==null?"fprofile__refusal":"fprofile__refusal hidden"},refusalName:{textContent:()=>r()},refusalTitle:{textContent:()=>{const h=o();return h?Ve[h].title:""}},refusalMsg:{textContent:()=>{const h=o();return h?Ve[h].message:""}},body:{className:()=>c()?"fprofile__body":"fprofile__body hidden"},...ke(()=>{const h=i();return h?h.player:{id:e.get()??"",avatarVersion:null,displayName:r(),username:null}}),name:{textContent:()=>i()?.player.displayName??""},username:{textContent:()=>{const h=i()?.player.username;return h?`@${h}`:""}},identity:{textContent:()=>{const h=i();return h?_l(h.player.handicapIndex,h.player.homeClubName)??"":""}},live:{className:()=>d.get()?"fprofile__live":"fprofile__live hidden",textContent:()=>{const h=d.get();return h?pl(h):""},onclick:()=>{const h=d.get();h&&p(h.roundId)}},statRounds:()=>String(i()?.roundsTotal??""),statYear:()=>String(i()?.roundsThisYear??""),statCourses:()=>String(i()?.coursesTotal??""),recentEmpty:{className:()=>(i()?.recentRounds.length??0)===0?"fprofile__hint":"fprofile__hint hidden"},recentCard:{className:()=>(i()?.recentRounds.length??0)>0?"fprofile__listcard":"fprofile__listcard hidden"},seeAll:{onclick:()=>this.router.navigate("/friend-rounds",{query:{id:e.get()??"",name:i()?.player.displayName??r()}})},coursesLine:{textContent:()=>vl(i()?.coursesTotal??0)},coursesRow:{onclick:()=>this.router.navigate("/friend-courses",{query:{id:e.get()??"",name:i()?.player.displayName??r()}})}});return this.$each(this.ref(m,"recentList"),()=>i()?.recentRounds??[],(h,g,v)=>this.wireEl(sa,na(h,p),v),h=>h.roundId),m}}const cm=b(`
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
`);class um extends M{static styles=`
        .frounds {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .frounds__back {
                ${$()}
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
                    ${$()}
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
                ${$()}
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
            ${ia()}

            & .frounds__more {
                ${$()}
                display: block;
                margin: ${a("md")} auto 0;
                padding: ${a("sm")} ${a("xl")};
                font-family: inherit; font-size: 0.9rem; font-weight: 700;
                &.hidden { display: none; }
                &:disabled { opacity: 0.6; cursor: default; }
            }
        }
    `;svc=this.inject(es);auth=this.inject(D);router=this.inject(G);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(C(()=>{const p=e.get();te(()=>{!p||!n()||(this.svc.setPlayer(p),this.svc.loadRounds())})}));const i=()=>this.svc.rounds.get(),r=()=>this.svc.unavailable.get(),d=()=>(t.get()??"").trim(),o=p=>this.router.navigate("/spectate",{query:{id:p,name:d()}}),c=()=>this.router.navigate("/friend",{query:{id:e.get()??"",name:d()}}),u=this.wire(cm,{back:{onclick:c},subtitle:{textContent:()=>{const p=d();return p?`Rounds ${p} has shared with friends.`:"Rounds shared with friends."}},refusal:{className:()=>r()!==null?"frounds__refusal":"frounds__refusal hidden"},refusalTitle:{textContent:()=>{const p=r();return p?Ve[p].title:""}},refusalMsg:{textContent:()=>{const p=r();return p?Ve[p].message:""}},anon:{className:()=>n()?"frounds__anon hidden":"frounds__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:`/friend-rounds?id=${e.get()??""}&name=${encodeURIComponent(t.get()??"")}`}})},state:{textContent:()=>r()!==null||!n()?"":this.svc.roundsLoading.get()?"Loading…":i().rounds.length===0?this.svc.roundsError.get()??"":""},retry:{className:()=>r()===null&&this.svc.roundsError.get()!==null&&i().rounds.length===0&&!this.svc.roundsLoading.get()?"frounds__retry":"frounds__retry hidden",onclick:()=>{this.svc.loadRounds(!0)}},empty:{className:()=>r()===null&&this.svc.roundsLoaded.get()&&i().rounds.length===0&&this.svc.roundsError.get()===null?"frounds__state":"frounds__state hidden"},listCard:{className:()=>r()===null&&i().rounds.length>0?"frounds__listcard":"frounds__listcard hidden"},more:{className:()=>r()===null&&or(i())&&i().rounds.length>0?"frounds__more":"frounds__more hidden",disabled:()=>this.svc.loadingMore.get(),textContent:()=>this.svc.loadingMore.get()?"Loading…":"Show more rounds",onclick:()=>{this.svc.loadMoreRounds()}},moreError:{textContent:()=>i().rounds.length>0?this.svc.roundsError.get()??"":""}});return this.$each(this.ref(u,"list"),()=>r()===null?i().rounds:[],(p,m,h)=>this.wireEl(sa,na(p,o),h),p=>p.roundId),u}}const hm=b(`
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
`),pm=b(`
    <div class="fcourse-row">
        <span bind="name" class="fcourse-row__name"></span>
        <span bind="facts" class="fcourse-row__facts"></span>
    </div>
`);class fm extends M{static styles=`
        .fcourses {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .fcourses__back {
                ${$()}
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
                    ${$()}
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
                ${$()}
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
    `;svc=this.inject(es);auth=this.inject(D);router=this.inject(G);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(C(()=>{const c=e.get();te(()=>{!c||!n()||(this.svc.setPlayer(c),this.svc.loadCourses())})}));const i=()=>this.svc.unavailable.get(),r=()=>i()===null?this.svc.courses.get():[],d=()=>(t.get()??"").trim(),o=this.wire(hm,{back:{onclick:()=>this.router.navigate("/friend",{query:{id:e.get()??"",name:d()}})},subtitle:{textContent:()=>{const c=d();return c?`Where ${c} has played the rounds they share.`:"Where the rounds they share were played."}},refusal:{className:()=>i()!==null?"fcourses__refusal":"fcourses__refusal hidden"},refusalTitle:{textContent:()=>{const c=i();return c?Ve[c].title:""}},refusalMsg:{textContent:()=>{const c=i();return c?Ve[c].message:""}},anon:{className:()=>n()?"fcourses__anon hidden":"fcourses__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:`/friend-courses?id=${e.get()??""}&name=${encodeURIComponent(d())}`}})},state:{textContent:()=>i()!==null||!n()?"":this.svc.coursesLoading.get()?"Loading…":this.svc.coursesError.get()??""},retry:{className:()=>i()===null&&this.svc.coursesError.get()!==null&&!this.svc.coursesLoading.get()?"fcourses__retry":"fcourses__retry hidden",onclick:()=>{this.svc.loadCourses(!0)}},empty:{className:()=>i()===null&&this.svc.coursesLoaded.get()&&r().length===0&&this.svc.coursesError.get()===null?"fcourses__state":"fcourses__state hidden"},listCard:{className:()=>r().length>0?"fcourses__listcard":"fcourses__listcard hidden"},truncated:{className:()=>i()===null&&this.svc.coursesHasMore.get()&&r().length>0?"fcourses__state":"fcourses__state hidden"}});return this.$each(this.ref(o,"list"),r,(c,u,p)=>this.wireEl(pm,{name:()=>c.courseName??"Course",facts:()=>yl(c,Be)},p),c=>c.courseId),o}}function mm(s,e,t){const n=pt(e);if(n){const o=Ri(s);return o?`Watching · ${o} ${n}`:`Watching · ${n}`}const i=Ri(s)??"this",r=pt(t),d=r?` at ${r}`:"";return`Watching · ${i} round${d}`}function gm(s,e,t,n){const i=pt(s)===null?null:pt(e),r=n!==null?`${n} holes`:null;return[i,r,t==="complete"?"Finished":t==="not_started"?"Not started":null].filter(c=>c!==null).join(" · ")||null}const bm="You're watching this round. Only its players can enter scores.",Ei={forbidden:{title:"Round not available",message:"This round is no longer shared with you."},not_found:{title:"Round not found",message:"This round doesn't exist anymore."}};function Ri(s){const e=pt(s);return e?e.toLowerCase().endsWith("s")?`${e}'`:`${e}'s`:null}function pt(s){return(s??"").trim()||null}const _m=b(`
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

            <p class="spectate__note">${bm}</p>
        </div>
    </div>
`);class ym extends M{static styles=`
        .spectate {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .spectate__back {
                ${$()}
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
                    ${$()}
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
                ${$()}
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
        ${bn.styles}
    `;svc=this.inject(cr);auth=this.inject(D);router=this.inject(G);render(){const e=this.router.query("id"),t=this.router.query("name"),n=()=>this.auth.currentUser.get()!==null;this.track(C(()=>{const c=e.get();te(()=>{!c||!n()||(this.svc.setRound(c),this.svc.load())})}));const i=()=>this.svc.view.get(),r=()=>this.svc.unavailable.get(),d=()=>(t.get()??"").trim()||null;return this.wire(_m,{back:{onclick:()=>{window.history.length>1?window.history.back():this.router.navigate("/")}},anon:{className:()=>n()?"spectate__anon hidden":"spectate__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:`/spectate?id=${e.get()??""}&name=${encodeURIComponent(d()??"")}`}})},refusal:{className:()=>n()&&r()!==null?"spectate__refusal":"spectate__refusal hidden"},refusalTitle:{textContent:()=>{const c=r();return c?Ei[c].title:""}},refusalMsg:{textContent:()=>{const c=r();return c?Ei[c].message:""}},state:{textContent:()=>r()!==null||!n()?"":this.svc.loading.get()&&i()===null?"Loading…":i()===null?this.svc.error.get()??"":""},retry:{className:()=>n()&&r()===null&&this.svc.error.get()!==null&&i()===null&&!this.svc.loading.get()?"spectate__retry":"spectate__retry hidden",onclick:()=>{this.svc.load(!0)}},body:{className:()=>n()&&r()===null&&i()!==null?"spectate__body":"spectate__body hidden"},title:{textContent:()=>{const c=i();return c?mm(d(),c.round.name,c.round.courseNameSnapshot):""}},status:{textContent:()=>{const c=i();return c&&c.status==="active"?"Live":""},className:()=>`spectate__status s-${i()?.status??""}`},subtitle:{textContent:()=>{const c=i();return c?gm(c.round.name,c.round.courseNameSnapshot,c.status,c.round.playHoles.length||null)??"":""}},date:{textContent:()=>Be(i()?.round.date??null)},board:{innerHTML:()=>this.renderBoards()}})}renderBoards(){const e=this.svc.view.get();if(!e)return"";const t=r=>this.svc.nameOf(r),n=r=>this.svc.groupLabelOf(r),i=e.result.slots;return i.length===0?'<div class="lb-empty">No formats in this round.</div>':i.map(r=>{const d=i.length>1?`<h2 class="spectate__slot-head">${vm(r.formatLabel)}</h2>`:"",o=Dr(r,t,n),c=qr(r.cards,e.result.routeSections,t),u=c?`<h3 class="lb-cards__head">Scorecard</h3>${c}`:"";return d+o+u}).join("")}}function vm(s){return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}const wm=b(`
    <div class="profile">
        <div bind="anon" class="profile__anon">
            <p>Your profile lives behind the optional sign-in.</p>
            <button bind="toLogin" type="button">Sign in</button>
        </div>
        <div bind="body" class="profile__body">
            <header class="profile__head">
                <div class="profile__ident">
                    ${Ie("profile__badge")}
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
`),xm=b(`
    <div class="hcp-entry">
        <span bind="index" class="hcp-entry__index"></span>
        <span bind="source" class="hcp-entry__source"></span>
        <span bind="date" class="hcp-entry__date"></span>
    </div>
`),$m=b(`
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
`);class km extends M{static styles=`
        .profile {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .profile__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};

                &.hidden { display: none; }

                & button {
                    ${$()}
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
                        ${$()}
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

                & .profile__label {
                    font-weight: 700; font-size: 0.8rem;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    color: ${l("text-muted")};
                }
                & .profile__hcp-row {
                    display: flex; align-items: center; gap: ${a("md")};
                    margin-top: ${a("sm")};
                }
                & .profile__hcp {
                    font-family: ${l("font-display")};
                    font-weight: 700; font-size: 2rem;
                    font-variant-numeric: tabular-nums;
                    color: ${l("text")};
                }
                & .profile__edit {
                    display: flex; gap: ${a("sm")}; flex: 1; justify-content: flex-end;
                    & input { ${ae()} width: 90px; padding: ${a("md")}; font-size: 1rem; text-align: center; }
                    & button {
                        ${$()}
                        padding: ${a("md")} ${a("lg")}; font-family: inherit;
                        font-size: 0.95rem; font-weight: 700;
                        background: ${l("primary")}; color: ${l("primary-text")}; border: none;
                        &:disabled { opacity: 0.5; cursor: default; }
                    }
                }
                & .profile__hint { margin: ${a("sm")} 0 0; font-size: 0.8rem; color: ${l("text-muted")}; }
                & .profile__err {
                    margin: ${a("sm")} 0 0; font-size: 0.85rem; color: ${l("error")};
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
                        ${$()}
                        flex: 1;
                        padding: ${a("sm")} 0;
                        font-family: inherit;
                        font-size: 0.9rem;
                        font-weight: 700;
                        &.on { background: ${l("primary")}; color: ${l("primary-text")}; border-color: ${l("primary")}; }
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
                ${$()}
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

            & .profile__section {
                & h2 {
                    margin: 0 0 ${a("sm")};
                    font-family: ${l("font-display")};
                    font-weight: 600; font-size: 1.2rem;
                }
            }

            & .profile__empty {
                color: ${l("text-muted")}; font-size: 0.9rem; padding: ${a("md")} 0;
                &.hidden { display: none; }
            }

            & .profile__history { display: flex; flex-direction: column; gap: ${a("sm")}; }

            & .hcp-entry {
                display: flex; align-items: baseline; gap: ${a("md")};
                padding: ${a("md")} ${a("lg")};
                ${R()}

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
    `;svc=this.inject(Ce);auth=this.inject(D);router=this.inject(G);indexDraft=new f("");localErr=new f("");render(){this.auth.currentUser.get()&&this.svc.load();const e=()=>this.auth.currentUser.get()!==null;let t=null;const n=this.wire(wm,{anon:{className:()=>e()?"profile__anon hidden":"profile__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/profile"}})},body:{className:()=>e()?"profile__body":"profile__body hidden"},...ke(()=>{const o=this.svc.player.get();return{id:o?.id??"",avatarVersion:o?.avatarVersion??null,displayName:o?.displayName,username:o?.username}}),photoFile:{onchange:o=>{const c=o.target,u=c.files?.[0];c.value="",u&&this.svc.saveAvatar(u)}},photoPick:{textContent:()=>this.svc.avatarSaving.get()?"Saving…":this.svc.player.get()?.avatarVersion?"Change photo":"Add photo",disabled:()=>this.svc.avatarSaving.get(),onclick:()=>t?.click()},photoRemove:{textContent:()=>"Remove",className:()=>this.svc.player.get()?.avatarVersion?"profile__photo-remove":"profile__photo-remove hidden",disabled:()=>this.svc.avatarSaving.get(),onclick:()=>{this.svc.removeAvatar()}},photoErr:{textContent:()=>this.svc.avatarError.get()?.message??""},name:()=>this.svc.player.get()?.displayName??"…",username:()=>{const o=this.svc.player.get();return o?`@${o.username}`:""},hcp:()=>{const o=this.svc.player.get()?.handicapIndex;return o==null?"–":o<0?`+${(-o).toFixed(1)}`:o.toFixed(1)},index:{value:()=>this.indexDraft.get(),oninput:o=>this.indexDraft.set(o.target.value)},save:{disabled:()=>this.svc.saving.get()||this.indexDraft.get().trim()==="",textContent:()=>this.svc.saving.get()?"Saving…":"Save"},form:{onsubmit:async o=>{o.preventDefault(),this.localErr.set("");const c=ve(this.indexDraft.get());if(c===null||c<-10||c>54){this.localErr.set("Enter an index between +10 and 54 (use “+” for a plus handicap).");return}await this.svc.saveIndex(c)&&this.indexDraft.set("")}},saveErr:{textContent:()=>this.localErr.get()||this.svc.saveError.get()?.message||""},genderErr:{textContent:()=>this.svc.saveError.get()?.message||""},clubErr:{textContent:()=>this.svc.saveError.get()?.message||""},toStats:{className:()=>this.svc.hasRecordedStats.get()?"statlink":"statlink hidden",onclick:()=>this.router.navigate("/stats")},statlinkRule:{className:()=>this.svc.hasRecordedStats.get()?"statrow__rule":"statrow__rule hidden"},masterTitle:()=>zo,masterHint:()=>Lo,master:{checked:()=>this.svc.statsConfig.get().enabled,disabled:()=>this.statsBusy(),onchange:o=>{this.saveStats(o,(c,u)=>jo(c,u),c=>c.enabled)}},statsErr:{textContent:()=>this.svc.statsError.get()?.message||""},historyEmpty:{className:()=>this.svc.history.get().length===0?"profile__empty":"profile__empty hidden"}});this.$each(this.ref(n,"history"),this.svc.history,(o,c,u)=>this.wireEl(xm,{index:()=>o.handicapIndex.toFixed(1),source:()=>o.source,date:()=>o.effectiveDate},u),o=>o.id),this.$each(this.ref(n,"statModules"),()=>[...Qi],(o,c,u)=>{const p=()=>this.svc.statsConfig.get(),m=()=>Bo(p(),o);return this.wireEl($m,{row:{className:()=>m()?"statrow statrow--locked":"statrow"},title:()=>Ji(o),ann:()=>Fo(p(),o)??"",hint:()=>Ao(o),chk:{checked:()=>Ht(p(),o),disabled:()=>m()||this.statsBusy(),onchange:h=>{this.saveStats(h,(g,v)=>Go(g,o,v),g=>Ht(g,o))}}},u)},o=>o);const i=[{value:"M",label:"M"},{value:"F",label:"F"},{value:null,label:"Not set"}];this.$each(this.ref(n,"gender"),()=>i,(o,c,u)=>this.wireEl(b('<button bind="b" type="button"></button>'),{b:{textContent:()=>o.label,className:()=>this.svc.player.get()?.gender===o.value?"on":"",disabled:()=>this.svc.saving.get(),onclick:()=>{this.svc.saveGender(o.value)}}},u),o=>o.label);const r=new f(this.svc.player.get()?.homeClubId??"");this.track(C(()=>r.set(this.svc.player.get()?.homeClubId??""))),this.track(C(()=>{const o=r.get();queueMicrotask(()=>{o!==(this.svc.player.get()?.homeClubId??"")&&this.svc.saveHomeClub(o===""?null:o)})}));const d=new pe({value:r,options:{get:()=>[{value:"",label:"No home club"},...this.svc.clubs.get().map(o=>({value:o.id,label:o.name}))]},placeholder:"No home club",disabled:{get:()=>this.svc.saving.get()}});return d.mount(this.ref(n,"club")),this.track(()=>d.destroy()),t=this.ref(n,"photoFile"),n}statsBusy(){return this.svc.statsSaving.get()||this.svc.saving.get()}async saveStats(e,t,n){const i=e.target;await this.svc.saveStatsConfig(t(this.svc.statsConfig.get(),i.checked)),i.checked=n(this.svc.statsConfig.get())}}function ne(s,e){return s>0?`Measured over ${se(s,e)}.`:null}function Hs(s){return s===null?null:`Measured ${s}.`}function Z(...s){return s.filter(e=>e!==null&&e!=="").join(" ")}function Q(s,e,t){return{id:s,title:e,body:t}}function Sm(s,e,t){switch(s){case"tee":{const n=e.tee;return n?[Q("teeFan","Where your tee shots finish",Z(S.teeFan,ne(n.teeRecorded,W))),Q("vsParByTee","What each tee shot cost",Z(S.vsParByTee,S.troubleTax,Hs(Vc(n.vsParByTee)))),Q("recovery","Recovery",Z(S.recovery,ne(n.recovery.d,W))),Q("penalties","Penalties",Z(S.penalties,ne(n.penaltiesRecordedHoles,W),Hs(Jc(n.vsParByPenalty))))]:[]}case"approach":{const n=e.approach;return n?[Q("greenMiss","Where you miss the green",Z(S.greenMiss,ne(n.greenMissRecorded,W))),Q("proximity","Proximity with GIR",Z(S.proximityProxy,ne(n.girFirstPuttMix.inside_1m.d,De))),Q("birdieConversion","Birdie conversion",Z(S.birdieConversion,ne(n.birdieConversion.d,De))),Q("hardChipShare","Hard misses",Z(S.hardChipShare,ne(n.hardChipShare.d,W))),Q("missedGreenTax","Cost of a missed green",Z(S.missedGreenTax,Hs(Qc(n.costOfMissedGreen))))]:[]}case"putting":{const n=e.putting;return n?[Q("firstPuttSpread","First putt, all holes",Z(S.firstPuttSpread,ne(n.firstPuttSpread.inside_1m.d,W))),Q("ladder","Holed on the first putt",Z(S.ladderBaseline,S.ladderCost,`Measured against the ${lt(t.cohort)} reference — change it under “${S.filterBaseline}” in Filters.`)),Q("threePutt","Three or more putts",Z(S.threePutt,S.longThreePutt,ne(n.threePutt.d,W))),Q("puttsPerGir","Putts per green hit",Z(S.puttsPerGir,ne(n.puttsPerGirHole.d,De))),Q("puttsAfterMissedGreen","Putts after a missed green",Z(S.puttsAfterMissedGreen,ne(n.puttsAfterMissedGreen.d,W)))]:[]}case"shortGame":{const n=e.shortGame;if(!n)return[];const i=n.scramble.standard.d+n.scramble.hard.d+n.scramble.bunker.d;return[Q("scrambling","Scrambling",Z(S.sandSave,S.multiChip,S.multiChipBunker,S.extraShortGameStrokes,ne(i,W))),Q("chipInside2m","Chipped to inside 2 m",Z(S.conversionInside2m,ne(n.conversionInside2m.d,W))),Q("chipIns","Chip-ins",S.chipIns)]}case"scoring":{const n=e.scoring;return n?[Q("doubles","Doubles or worse",Z(S.doubleBogeyPlus,ne(n.doubleBogeyPlusPerRound.d,me))),Q("bounceBack","Bounce-back",Z(S.bounceBack,ne(n.bounceBack.d,W)))]:[]}case null:return[]}}const Tm=b(`
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
                ${os}
            </span>
        </div>
        <div bind="body" class="panel__body">
            <div bind="blocks" class="panel__blocks"></div>
        </div>
    </section>
`),Pm=b('<h3 bind="text" class="block__subhead"></h3>'),Cm=b(`
    <div class="block block--columns" aria-hidden="true">
        <span class="block__title"></span>
        <span class="block__bar"></span>
        <span bind="c0" class="block__colhead"></span>
        <span bind="c1" class="block__colhead"></span>
    </div>
`),Im=b(`
    <div class="block block--split">
        <span bind="bar" class="block__splitbar"></span>
        <span bind="legend" class="block__legend"></span>
    </div>
`),Em=b(`
    <div class="block block--bar">
        <span bind="title" class="block__title"></span>
        <span bind="bar" class="block__bar"></span>
        <span bind="value" class="block__value"></span>
    </div>
`),Rm=b(`
    <div bind="row" class="block block--bar" role="img">
        <span bind="title" class="block__title"></span>
        <span bind="bar" class="block__bar"></span>
        <span bind="value" class="block__value"></span>
        <span bind="cost" class="block__cost"></span>
    </div>
`),Nm=b(`
    <div class="block block--figure">
        <div class="block__text">
            <span bind="title" class="block__title"></span>
            <span bind="hint" class="block__hint"></span>
        </div>
        <span bind="value" class="block__value"></span>
    </div>
`),Om=b(`
    <div class="block block--compass">
        <span bind="chart" class="block__compass"></span>
        <span bind="text" class="block__chart-text"></span>
    </div>
`),Hm=b(`
    <div class="block block--fan">
        <span bind="chart" class="block__fan"></span>
        <span bind="text" class="block__chart-text"></span>
    </div>
`),Mm=b(`
    <div class="statspanels">
        <div bind="panels" class="statspanels__list"></div>
${gt}
    </div>
`);class ra extends M{static styles=`
${ls}
        .statspanels {
            & .statspanels__list { display: flex; flex-direction: column; gap: ${a("sm")}; }

            & .panel {
                ${R()}
                overflow: hidden;
                &.hidden { display: none; }

                & .panel__headrow { display: flex; align-items: center; }
                & .panel__head {
                    ${$()}
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
                width: ${Wr}px; flex: none;
                & svg { width: 100%; display: block; }
            }
            & .block__value {
                width: ${Ws}px; flex: none; text-align: right;
                font-size: 0.9rem; font-weight: 700;
                font-variant-numeric: tabular-nums;
                &.block__value--absent { font-weight: 400; color: ${l("text-muted")}; }
            }
            /* Quieter than the value beside it, deliberately: Holed is the
               row's headline reading and Cost is the gloss on it. Same size
               as the other secondary numbers on the screen. */
            & .block__cost {
                width: ${oi}px; flex: none; text-align: right;
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
                & .block__colhead:nth-child(4) { width: ${oi}px; }
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
    `;expanded=new f([]);openInfo=new f(null);colors=us;render(){const e=()=>this.props.model(),t=this.wire(Mm,{infoSheet:{className:()=>this.openInfo.get()!==null?"stats-info":"stats-info hidden",onclick:n=>{n.target===n.currentTarget&&this.openInfo.set(null)}},infoTitle:()=>{const n=this.openInfo.get();return n===null?"":vs(n)},infoDone:{onclick:()=>this.openInfo.set(null)}});return this.$each(this.ref(t,"panels"),()=>[...Cc],(n,i,r)=>{const d=()=>this.expanded.get().includes(n),o=this.wireEl(Tm,{panel:{className:()=>e()[n]?"panel":"panel hidden"},head:{"aria-expanded":()=>String(d()),onclick:()=>this.togglePanel(n)},title:()=>vs(n),headline:()=>Bp(n,e())??"",body:{className:()=>d()?"panel__body":"panel__body hidden"},infoRow:{className:()=>d()&&this.infoCards(n).length>0?"panel__inforow":"panel__inforow hidden"},infoTrigger:{textContent:()=>S.prioritiesInfo,"aria-label":()=>`${S.prioritiesInfo}: ${vs(n)}`,onclick:()=>this.openInfo.set(n)}},r);return this.$each(this.ref(o,"blocks"),()=>pi(n,e()),(c,u,p)=>this.renderBlock(n,c,p),c=>c.id),o},n=>n),this.$each(this.ref(t,"infoCards"),()=>this.infoCards(this.openInfo.get()),(n,i,r)=>this.wireEl(bt,{ctitle:()=>(this.infoCardNow(n.id)??n).title,ctext:()=>(this.infoCardNow(n.id)??n).body},r),n=>n.id),t}infoCards(e){return Sm(e,this.props.model(),this.props.baseline())}infoCardNow(e){return this.infoCards(this.openInfo.get()).find(t=>t.id===e)}renderBlock(e,t,n){switch(t.kind){case"subhead":return this.wireEl(Pm,{text:()=>t.text},n);case"columns":return this.wireEl(Cm,{c0:()=>t.cells[0]??"",c1:()=>t.cells[1]??""},n);case"split":{const i=()=>this.blockNow(e,t.id)??t;return this.wireEl(Im,{bar:{innerHTML:()=>{const r=i();return r.kind!=="split"?"":fp(r.segments.map(d=>({id:d.id,share:d.share??0,color:this.segmentColor(d.tone)})),this.colors)}},legend:{innerHTML:()=>{const r=i();return r.kind!=="split"?"":r.segments.map(d=>`<span class="legend__key"><span class="legend__swatch" style="background:${this.segmentColor(d.tone)}"></span><span>${d.title}</span><span class="legend__value">${d.value??S.noValue}</span></span>`).join("")}}},n)}case"bar":return this.wireEl(Em,{title:()=>t.title,bar:{innerHTML:()=>{const i=this.blockNow(e,t.id)??t;return i.kind!=="bar"||i.share===null?"":Qr(i.share,this.colors)}},value:this.valueBinding(e,t.id,()=>t.value,S.noValue)},n);case"rung":{const i=()=>{const r=this.blockNow(e,t.id);return r&&r.kind==="rung"?r:t};return this.wireEl(Rm,{row:{"aria-label":()=>{const r=i();return Lp({title:r.title,value:r.value,cost:r.cost})}},title:()=>t.title,bar:{innerHTML:()=>{const r=i();return kp(r.made,r.baseline,this.colors)}},value:this.valueBinding(e,t.id,()=>t.value,S.noValue),cost:()=>i().cost},n)}case"figure":return this.wireEl(Nm,{title:()=>t.title,hint:()=>{const i=this.blockNow(e,t.id)??t;return(i.kind==="figure"?i.hint:t.hint)??""},value:this.valueBinding(e,t.id,()=>t.value)},n);case"compass":return this.wireEl(Om,{chart:{innerHTML:()=>{const i=this.blockNow(e,t.id)??t;return i.kind!=="compass"?"":Rp(i.sectors,i.labels,this.colors)}},text:()=>{const i=this.blockNow(e,t.id)??t;return i.kind==="compass"?i.text:t.text}},n);case"fan":return this.wireEl(Hm,{chart:{innerHTML:()=>{const i=this.blockNow(e,t.id)??t;return i.kind!=="fan"?"":Ap(i.columns,this.toneColors(),this.colors)}},text:()=>{const i=this.blockNow(e,t.id)??t;return i.kind==="fan"?i.text:t.text}},n)}}toneColors(){return{fairway:this.segmentColor("fairway"),inplay:this.segmentColor("inplay"),trouble:this.segmentColor("trouble")}}valueBinding(e,t,n,i=S.notRecorded){const r=()=>{const d=this.blockNow(e,t);return d&&"value"in d?d.value:n()};return{textContent:()=>r()??i,className:()=>r()===null?"block__value block__value--absent":"block__value"}}segmentColor(e){switch(e){case"fairway":return this.colors.gain;case"inplay":return this.colors.neutral;case"trouble":return this.colors.loss}}togglePanel(e){const t=this.expanded.get();this.expanded.set(t.includes(e)?t.filter(n=>n!==e):[...t,e])}blockNow(e,t){return pi(e,this.props.model()).find(n=>n.id===t)}}const Am=b(`
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
                    ${os}
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
${gt}
    </div>
`),Ni=b(`
    <button bind="chip" class="stats__chip" type="button" aria-pressed="false"></button>
`),zm=b(`
    <label class="stats__course">
        <input bind="chk" type="checkbox" />
        <span bind="name" class="stats__coursename"></span>
        <span bind="count" class="stats__coursecount"></span>
    </label>
`),Lm=b(`
    <div bind="tile" class="rtile">
        <span bind="value" class="rtile__value"></span>
        <span bind="label" class="rtile__label"></span>
        <span bind="qualifier" class="rtile__qualifier"></span>
    </div>
`),Bm=b(`
    <div class="stype">
        <span bind="title" class="stype__title"></span>
        <span bind="bar" class="stype__bar"></span>
        <span bind="value" class="stype__value"></span>
    </div>
`),Fm=b(`
    <div class="priority">
        <span bind="title" class="priority__title"></span>
        <span bind="chart" class="priority__chart"></span>
        <div class="priority__figures">
            <span bind="value" class="priority__value"></span>
            <span bind="sample" class="priority__sample"></span>
        </div>
    </div>
`),Gm=b(`
    <div class="trend">
        <span bind="title" class="trend__title"></span>
        <span bind="spark" class="trend__spark"></span>
        <span bind="headline" class="trend__headline"></span>
        <span bind="sample" class="trend__sample"></span>
    </div>
`),jm=b(`
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
`);class Dm extends M{static styles=`
        .stats {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .stats__anon {
                text-align: center;
                padding: ${a("2xl")} 0;
                color: ${l("text-muted")};
                &.hidden { display: none; }

                & button {
                    ${$()}
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
                ${$()}
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
                    ${ae()}
                    width: 100%;
                    font-family: inherit; font-size: 0.9rem;
                }
            }
            & .stats__chips { display: flex; flex-wrap: wrap; gap: ${a("xs")}; }
            & .stats__chip {
                ${$()}
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
                ${$()}
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
                    width: ${Wr}px; flex: none;
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
                    ${$()}
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

${ls}
    `;svc=this.inject(Ae);auth=this.inject(D);router=this.inject(G);filterOpen=new f(!1);prioritiesInfoOpen=new f(!1);colors=us;render(){const e=()=>this.auth.currentUser.get()!==null;e()&&(this.svc.load(),this.svc.loadHandicap());const t=()=>this.svc.model.get(),n=()=>this.svc.preset.get()==="custom",i=this.wire(Am,{anon:{className:()=>e()?"stats__anon hidden":"stats__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/stats"}})},body:{className:()=>e()?"stats__body":"stats__body hidden"},intro:()=>S.intro,sample:()=>this.sampleMarker(),filterToggle:{"aria-expanded":()=>String(this.filterOpen.get()),onclick:()=>this.filterOpen.set(!this.filterOpen.get())},status:()=>this.statusLine(),err:()=>this.svc.error.get()?.message??"",filterPanel:{className:()=>this.filterOpen.get()?"stats__filter":"stats__filter hidden"},from:{value:()=>this.svc.filter.get().from??"",oninput:r=>this.setBound("from",r.target.value)},to:{value:()=>this.svc.filter.get().to??"",oninput:r=>this.setBound("to",r.target.value)},clearFilter:{textContent:()=>S.filterClear,onclick:()=>this.svc.clearFilter()},sgLabel:()=>S.filterBaseline,sgWhat:()=>S.filterBaselineHint,sgHint:()=>xc(this.svc.sgChoice.get(),this.svc.handicapIndex.get()),empty:()=>this.emptyLine(),resultsSec:{className:()=>t().results!==null?"stats__section":"stats__section hidden"},resultsSub:()=>qp(t().results),resultsCard:{className:()=>Es(t().results).length===0&&Pt(t().results).length===0?"results hidden":"results"},histHead:()=>Pt(t().results).length===0?"":S.scoreTypesHead,prioritiesSec:{className:()=>t().priorities.length>0?"stats__section":"stats__section hidden"},prioritiesHint:()=>S.prioritiesHint,infoTrigger:{textContent:()=>S.prioritiesInfo,onclick:()=>this.prioritiesInfoOpen.set(!0)},infoSheet:{className:()=>this.prioritiesInfoOpen.get()?"stats-info":"stats-info hidden",onclick:r=>{r.target===r.currentTarget&&this.prioritiesInfoOpen.set(!1)}},infoTitle:()=>ye.title,infoDone:{onclick:()=>this.prioritiesInfoOpen.set(!1)},trendsSec:{className:()=>t().trends.length>0?"stats__section":"stats__section hidden"},trendsHint:()=>S.trendsHint,roundsSec:{className:()=>t().rounds.length>0?"stats__section":"stats__section hidden"},roundsHint:()=>S.roundsHint,pickHint:()=>n()?S.filterRoundsHint:""});return this.setHeading(i,"resultsSec",S.resultsHeading),this.setHeading(i,"prioritiesSec",S.priorities),this.setHeading(i,"trendsSec",S.trends),this.setHeading(i,"roundsSec",S.roundsHeading),this.mountPicker(i),this.mountBaselinePicker(i),this.mountFilterLists(i),this.$each(this.ref(i,"resultTiles"),()=>Es(t().results),(r,d,o)=>this.wireEl(Lm,{tile:{className:()=>(this.tileNow(r.id)??r).hero?"rtile rtile--hero":"rtile"},value:{textContent:()=>(this.tileNow(r.id)??r).value},label:{textContent:()=>(this.tileNow(r.id)??r).label},qualifier:{textContent:()=>(this.tileNow(r.id)??r).qualifier??""}},o),r=>r.id),this.$each(this.ref(i,"resultHist"),()=>Pt(t().results),(r,d,o)=>this.wireEl(Bm,{title:()=>r.title,bar:{innerHTML:()=>Qr((this.histNow(r.id)??r).share,this.colors)},value:{textContent:()=>(this.histNow(r.id)??r).value}},o),r=>r.id),this.$each(this.ref(i,"priorities"),()=>t().priorities,(r,d,o)=>this.wireEl(Fm,{title:()=>rs(r.component),chart:{innerHTML:()=>{const c=this.priorityNow(r.component);return c?.per18===null||c===void 0?"":Yr(c.per18,zc(t().priorities),this.colors)}},value:{textContent:()=>{const c=this.priorityNow(r.component);return c&&c.per18!==null?eu(c.per18):S.notEnoughData}},sample:{textContent:()=>{const c=this.priorityNow(r.component);return c?c.per18===null?Yp(c.roundsInWindow):`over ${se(c.roundsCovered,me)}`:""}}},o),r=>r.component),this.$each(this.ref(i,"infoCards"),()=>Wt({attributed:t().waterfall.coverage.attributed,holesScored:t().waterfall.coverage.holesScored,windowRounds:t().rounds.length,rowsPer18:t().priorities.map(r=>r.per18),penaltySource:Kt(t().totals),baseline:this.svc.sgInfo.get()}),(r,d,o)=>this.wireEl(bt,{ctitle:()=>(this.sgCardNow(r.id)??r).title,ctext:()=>(this.sgCardNow(r.id)??r).body},o),r=>r.id),this.$each(this.ref(i,"trends"),()=>t().trends,(r,d,o)=>this.wireEl(Gm,{title:()=>r.title,spark:{innerHTML:()=>{const c=this.trendNow(r.id)??r;return yp(c.points,c.kind,this.colors)}},headline:{textContent:()=>{const c=this.trendNow(r.id)??r;return qm(c)}},sample:{textContent:()=>{const c=this.trendNow(r.id)??r;return se(c.points.length,me)}}},o),r=>r.id),this.spawn(ra,this.ref(i,"panels"),{model:t,baseline:()=>this.svc.sgInfo.get()}),this.$each(this.ref(i,"rounds"),()=>t().rounds,(r,d,o)=>this.wireEl(jm,{open:{onclick:()=>this.router.navigate("/round-stats",{query:{id:r.id}}),"aria-label":()=>`${fi(r)} — hole by hole`},label:()=>fi(r),subtitle:()=>Vm(r),pickWrap:{className:()=>n()?"statsround__pick":"statsround__pick hidden"},pick:{checked:()=>!this.svc.filter.get().excludedRoundIds.includes(r.id),onchange:c=>this.svc.applyFilter(id(this.svc.filter.get(),r.id,c.target.checked))},strip:{innerHTML:()=>{const c=this.roundNow(r.id)??r;return xp(c.waterfall,Er(t().rounds.map(u=>u.waterfall)),this.colors)}},vspar:{textContent:()=>{const c=this.roundNow(r.id)??r;return c.vsPar===null?"":is(c.vsPar)}}},o),r=>r.id),i}mountPicker(e){const t=new f(this.svc.preset.get());this.track(C(()=>t.set(this.svc.preset.get()))),this.track(C(()=>{const r=t.get();queueMicrotask(()=>{r!==this.svc.preset.get()&&this.svc.select(r)})}));const n=r=>({value:r,label:`${zt(r)} — ${td(r)}`}),i=new pe({value:t,options:[{value:"__recent",label:"Recent form",disabled:!0},n("last5"),n("last10"),n("last20"),{value:"__all",label:"Everything",disabled:!0},n("thisYear"),n("all"),{value:"__custom",label:"Built by hand",disabled:!0},n("custom")],placeholder:zt("last10")});i.mount(this.ref(e,"picker")),this.track(()=>i.destroy())}mountBaselinePicker(e){const t=new f(this.svc.sgChoice.get());this.track(C(()=>t.set(this.svc.sgChoice.get()))),this.track(C(()=>{const i=t.get();queueMicrotask(()=>{i!==this.svc.sgChoice.get()&&this.svc.selectSgBaseline(i)})}));const n=new pe({value:t,options:Pr.map(i=>({value:i,label:Vn(i)})),placeholder:Vn("auto")});n.mount(this.ref(e,"sgPicker")),this.track(()=>n.destroy())}mountFilterLists(e){const t=["outdoor","indoor"];this.$each(this.ref(e,"venues"),()=>t,(i,r,d)=>this.wireEl(Ni,{chip:{textContent:()=>tu(i),"aria-pressed":()=>String(this.svc.filter.get().venueTypes.includes(i)),onclick:()=>this.svc.applyFilter(ys(this.svc.filter.get(),"venueTypes",i))}},d),i=>i);const n=["full_18","front_9","back_9","custom_holes"];this.$each(this.ref(e,"roundTypes"),()=>n,(i,r,d)=>this.wireEl(Ni,{chip:{textContent:()=>su(i),"aria-pressed":()=>String(this.svc.filter.get().roundTypes.includes(i)),onclick:()=>this.svc.applyFilter(ys(this.svc.filter.get(),"roundTypes",i))}},d),i=>i),this.$each(this.ref(e,"courses"),()=>this.svc.courses.get(),(i,r,d)=>this.wireEl(zm,{name:()=>i.name,count:()=>se(i.roundCount,me),chk:{checked:()=>this.svc.filter.get().courseIds.includes(i.id),onchange:()=>this.svc.applyFilter(ys(this.svc.filter.get(),"courseIds",i.id))}},d),i=>i.id)}setBound(e,t){this.svc.applyFilter({...this.svc.filter.get(),[e]:t===""?null:t})}priorityNow(e){return this.svc.model.get().priorities.find(t=>t.component===e)}trendNow(e){return this.svc.model.get().trends.find(t=>t.id===e)}roundNow(e){return this.svc.model.get().rounds.find(t=>t.id===e)}tileNow(e){return Es(this.svc.model.get().results).find(t=>t.id===e)}histNow(e){return Pt(this.svc.model.get().results).find(t=>t.id===e)}sgCardNow(e){const t=this.svc.model.get();return Wt({attributed:t.waterfall.coverage.attributed,holesScored:t.waterfall.coverage.holesScored,windowRounds:t.rounds.length,rowsPer18:t.priorities.map(n=>n.per18),penaltySource:Kt(t.totals),baseline:this.svc.sgInfo.get()}).find(n=>n.id===e)}setHeading(e,t,n){const i=this.ref(e,t).querySelector("h2");i&&(i.textContent=n)}sampleMarker(){const e=this.svc.windowRounds.get().length,t=this.svc.roundsWithStats.get()??this.svc.loadedCount();return t<=e?se(e,me):`${Te(e,0)} of ${se(t,me)}`}statusLine(){const e=this.svc.extendError.get();return e?`${S.extendProblemPrefix}${e.message}`:this.svc.extending.get()?S.extending:this.svc.budgetSpent()?S.budgetSpent:this.svc.loading.get()?S.loading:""}emptyLine(){return!this.svc.loaded.get()||this.svc.error.get()?"":this.svc.overFiltered.get()?S.windowEmpty:this.svc.loadedCount()===0?S.noStats:""}}function qm(s){const e=s.points[s.points.length-1];return e===void 0?"":s.kind==="percentage"?`${Math.round(e*100)}%`:we(e)}function Vm(s){const e=[Or(s.date)];return s.courseName&&e.push(s.courseName),e.push(`${Te(s.holeCount,0)} holes`),e.join(" · ")}const Um=b(`
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
                    ${os}
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
${gt}
    </div>
`),Km=b(`
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
`),Wm=b(`
    <div class="holedetail__line">
        <span bind="label" class="holedetail__label"></span>
        <span bind="value" class="holedetail__value"></span>
    </div>
`),Ym=b(`
    <div class="delta">
        <div class="delta__text">
            <span bind="title" class="delta__title"></span>
            <span bind="sentence" class="delta__sentence"></span>
        </div>
        <span bind="value" class="delta__value"></span>
        <span bind="bar" class="delta__bar"></span>
    </div>
`),Xm=b('<li bind="text" class="roundstats__legenditem"></li>');function Qm(){const s=[];for(const[e,t]of Object.entries(mn))t.fill!==void 0&&s.push(`& .cell--${e} { background: ${t.fill}; color: #fff; border-color: transparent;`+(t.boxy?" border-radius: 3px;":"")+" }");return s.join(`
            `)}class Jm extends M{static styles=`
        .roundstats {
            padding: ${a("xl")} ${a("lg")} ${a("2xl")};

            & .roundstats__back {
                ${$()}
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
                ${$()}
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
                ${$()}
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
            ${Qm()}

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

${ls}
    `;svc=this.inject(ht);auth=this.inject(D);router=this.inject(G);colors=us;openHole=new f(null);infoOpen=new f(!1);render(){const e=this.router.query("id"),t=()=>this.svc.model.get(),n=()=>this.svc.phase.get()==="ready"&&t()!==null;this.track(C(()=>{const o=e.get();te(()=>{this.openHole.set(null),o&&this.svc.load(o)})}));const i=this.router.query("finish"),r=()=>i.get()==="1",d=this.wire(Um,{back:{className:()=>r()?"roundstats__back hidden":"roundstats__back",onclick:()=>this.router.navigate("/stats")},finishKicker:{className:()=>r()?"roundstats__kicker":"roundstats__kicker hidden"},finishClose:{className:()=>r()?"roundstats__closebtn":"roundstats__closebtn hidden",onclick:()=>this.router.navigate("/")},state:()=>this.stateLine(),body:{className:()=>n()?"roundstats__body":"roundstats__body hidden"},title:()=>t()===null?"":ii(t()),subtitle:()=>this.subtitle(),score:()=>{const o=t();return o===null?"":Jr(o.strokes,o.vsPar)??""},stripSec:{className:()=>(t()?.cells.length??0)>0?"roundstats__section":"roundstats__section hidden"},wfHeading:()=>ee.waterfallHeading,wfHint:()=>ee.waterfallHint,infoTrigger:{textContent:()=>S.prioritiesInfo,onclick:()=>this.infoOpen.set(!0)},infoSheet:{className:()=>this.infoOpen.get()?"stats-info":"stats-info hidden",onclick:o=>{o.target===o.currentTarget&&this.infoOpen.set(!1)}},infoTitle:()=>ye.title,infoDone:{onclick:()=>this.infoOpen.set(!1)},legendHeading:()=>ee.legendHeading,detail:{className:()=>this.selected()===null?"holedetail hidden":"holedetail"},detailTitle:()=>{const o=this.selected();return o===null?"":Jp(o)},detailEmpty:()=>{const o=this.selected();return o===null?"":yn(o).length===0?ee.nothingRecordedOnHole:""}});return this.setHeading(d,"stripSec",ee.holeStripHeading),this.$each(this.ref(d,"strip"),()=>t()?.cells??[],(o,c,u)=>this.wireEl(Km,{cell:{className:()=>{const p=this.cellNow(o.id)??o;return p.marker===null?"cell":`cell cell--${p.marker}`},"aria-pressed":()=>String(this.openHole.get()===o.id),"aria-label":()=>gi(this.cellNow(o.id)??o),title:()=>gi(this.cellNow(o.id)??o),onclick:()=>this.openHole.set(this.openHole.get()===o.id?null:o.id)},hole:()=>String((this.cellNow(o.id)??o).holeNumber),score:()=>Zp(this.cellNow(o.id)??o),tee:{className:()=>(this.cellNow(o.id)??o).tee===null?"cell__tee cell__tee--absent":"cell__tee",style:()=>{const p=this.cellNow(o.id)??o;return p.tee===null?"":`background:${this.teeColor(p.tee)}`}},gir:{className:()=>{const p=this.cellNow(o.id)??o;return p.gir===null?"cell__gir cell__gir--absent":p.gir?"cell__gir cell__gir--hit":"cell__gir"}},putts:()=>{const p=this.cellNow(o.id)??o;return p.putts===null?"":String(p.putts)},pen:{className:()=>ip(this.cellNow(o.id)??o)?"cell__pen":"cell__pen cell__pen--absent"}},u),o=>o.id),this.$each(this.ref(d,"detailLines"),()=>af(this.selected()),(o,c,u)=>this.wireEl(Wm,{label:()=>o.label,value:()=>o.value},u),o=>o.key),this.$each(this.ref(d,"deltas"),()=>{const o=t();return o===null?[]:ue.filter(c=>Ke(o.waterfall,c)!==null)},(o,c,u)=>this.wireEl(Ym,{title:()=>rs(o),sentence:()=>{const p=t();if(p===null||p.deltas===null)return"";const m=on(p.deltas,o);return m===null?"":Zr(m,p.windowCount)},value:{textContent:()=>{const p=this.componentValue(o);return p===null?"":we(p)},style:()=>{const p=this.componentValue(o);return p===null?"":`color:${Ye(ds(p),this.colors)}`}},bar:{innerHTML:()=>{const p=t(),m=this.componentValue(o);return p===null||m===null?"":Yr(m,Er([p.waterfall]),this.colors)}}},u),o=>o),this.$each(this.ref(d,"infoCards"),()=>{const o=t();return o===null?[]:Wt({attributed:o.waterfall.coverage.attributed,holesScored:o.waterfall.coverage.holesScored,windowRounds:0,rowsPer18:ue.map(c=>Se(o.waterfall,c)),penaltySource:Kt(o.panels.totals),baseline:this.svc.sgInfo.get()})},(o,c,u)=>this.wireEl(bt,{ctitle:()=>o.title,ctext:()=>o.body},u),o=>o.id),this.spawn(ra,this.ref(d,"panels"),{model:()=>t()?.panels??Ir,baseline:()=>this.svc.sgInfo.get()}),this.$each(this.ref(d,"legend"),()=>[ee.legendTee,ee.legendGir,ee.legendPutts,ee.legendPenalty,ee.legendAbsence],(o,c,u)=>this.wireEl(Xm,{text:()=>o},u),o=>o),d}cellNow(e){return this.svc.model.get()?.cells.find(t=>t.id===e)}selected(){const e=this.openHole.get();return e===null?null:this.cellNow(e)??null}teeColor(e){switch(e){case"fairway":return this.colors.gain;case"in_play":return this.colors.neutral;case"trouble":return this.colors.loss}}componentValue(e){const t=this.svc.model.get();return t===null?null:Ke(t.waterfall,e)}subtitle(){const e=this.svc.model.get();return e===null?"":Qp({...e,title:ii(e)})}stateLine(){if(this.auth.currentUser.get()===null)return ee.notSignedIn;switch(this.svc.phase.get()){case"loading":case"idle":return ee.loading;case"notFound":return ee.noStatsInRound;case"notAuthorized":return ee.notSignedIn;case"failed":return`${ee.failedPrefix}${this.svc.failure.get()??""}`;case"ready":return this.svc.model.get()?.cells.length===0?ee.noHoleStrip:""}}setHeading(e,t,n){const i=this.ref(e,t).querySelector("h2");i&&(i.textContent=n)}}const Zm=b(`
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
`),eg=b(`
    <div class="stat">
        <span bind="value" class="stat__value"></span>
        <span bind="label" class="stat__label"></span>
    </div>
`),tg=b(`
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
`),sg=b(`
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
`),ng={not_started:"Not started",active:"Playing",complete:"Done"},ig={private:"Private",friends:"Friends",link:"Link"};function rg(s){const e=[`${s.participants.length} players`,`${s.scoreEventCount} scores`];return s.lastEventAt?e.push(`last ${s.lastEventAt.replace("T"," ").slice(0,16)}`):e.push("never played"),e.join(" · ")}function ag(s){const e=[`@${s.username}`,`${s.roundCount} rounds`];return s.lastRoundDate&&e.push(`last ${s.lastRoundDate}`),s.handicapIndex!==null&&e.push(`hcp ${s.handicapIndex}`),s.deletedAt&&e.push("DELETED"),e.join(" · ")}class og extends M{static styles=`
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
                    ${$()}
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
                        ${$()}
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
    `;svc=this.inject(ur);auth=this.inject(D);router=this.inject(G);tab=new f("rounds");grantOpen=new f(!1);grantTarget=new f(null);mutating=new f(!1);denied=new k(()=>this.auth.currentUser.get()===null||!this.svc.isSuperAdmin());render(){this.svc.loadRoles().then(()=>{this.svc.isSuperAdmin()&&this.svc.load()});const e=this.wire(Zm,{back:{onclick:()=>this.router.navigate("/")},denied:{className:()=>this.denied.get()?"admin__denied":"admin__denied hidden"},body:{className:()=>this.denied.get()?"admin__body hidden":"admin__body"},loading:{className:()=>this.svc.loading.get()?"admin__loading":"admin__loading hidden"},tabRounds:{className:()=>this.tab.get()==="rounds"?"active":"",onclick:()=>this.tab.set("rounds")},tabPlayers:{className:()=>this.tab.get()==="players"?"active":"",onclick:()=>this.tab.set("players")},roundList:{className:()=>this.tab.get()==="rounds"?"admin__list":"admin__list hidden"},playerList:{className:()=>this.tab.get()==="players"?"admin__list":"admin__list hidden"}}),t=new k(()=>{const n=this.svc.stats.get();return n?[{key:"rounds",label:"Rounds",value:n.rounds},{key:"active",label:"Playing",value:n.roundsActive},{key:"week",label:"Last 7d",value:n.roundsLast7Days},{key:"players",label:"Players",value:n.players},{key:"guests",label:"Guests",value:n.guests},{key:"scores",label:"Scores",value:n.scoreEvents}]:[]});return this.$each(this.ref(e,"stats"),t,(n,i,r)=>this.wireEl(eg,{value:()=>String(n.value),label:()=>n.label},r),n=>n.key),this.$each(this.ref(e,"roundList"),this.svc.rounds,(n,i,r)=>this.wireEl(tg,{row:{disabled:()=>n.shareToken===null,onclick:()=>{n.shareToken&&this.router.navigate("/round",{query:{token:n.shareToken}})}},course:()=>n.courseName??"Unknown course",visibility:()=>ig[n.visibility],status:()=>ng[n.status],who:()=>{const d=n.creatorName?`by ${n.creatorName}`:"by a guest",o=n.participants.join(", ");return o?`${d} — ${o}`:d},meta:()=>`${n.date} · ${rg(n)}`},r),n=>n.roundId),this.$each(this.ref(e,"playerList"),this.svc.players,(n,i,r)=>this.wireEl(sg,{name:()=>n.displayName,roleChip:()=>n.roles.includes("super_admin")?"admin":"",meta:()=>ag(n),toggle:{textContent:()=>n.roles.includes("super_admin")?"Revoke admin":"Make admin",disabled:()=>this.mutating.get(),onclick:()=>{this.grantTarget.set(n),this.grantOpen.set(!0)}}},r),n=>n.playerId),this.spawn(oe,this.ref(e,"confirmHost"),{open:this.grantOpen,title:()=>this.grantTarget.get()?.roles.includes("super_admin")?"Revoke admin?":"Make admin?",message:()=>{const n=this.grantTarget.get();return n?n.roles.includes("super_admin")?`Remove the super admin role from ${n.displayName}?`:`Give ${n.displayName} the super admin role? They will be able to see every player's rounds.`:""},confirmLabel:"Confirm",cancelLabel:"Cancel",onconfirm:()=>{const n=this.grantTarget.get();n&&this.toggleAdmin(n)}}),e}async toggleAdmin(e){this.mutating.set(!0);try{const t={playerId:e.playerId,role:"super_admin"};e.roles.includes("super_admin")?await y.admin.adminRevokeRole(t):await y.admin.adminGrantRole(t),await this.svc.load(!0)}finally{this.mutating.set(!1)}}}function lg(s,e){return s?e!==null&&s.ownerPlayerId===e?!0:s.rounds.some(t=>typeof t.shareToken=="string"):!1}class Fe{list=new f([]);listLoading=new f(!1);listError=new f(null);listLoaded=new f(!1);detail=new f(null);detailId=new f(null);detailLoading=new f(!1);detailError=new f(null);participants=new f([]);board=new f(null);boardRefusal=new f(null);boardLoading=new f(!1);results=new f(null);resultsRefusal=new f(null);mutating=new f(!1);mutateError=new f(null);async loadList(e=!1){if(!e&&(this.listLoaded.get()||this.listLoading.get()))return;const t=await F(this.listLoading,this.listError,()=>y.competitions.list());t&&(this.list.set(t),this.listLoaded.set(!0))}async loadDetail(e,t=!1){if(!t&&this.detailId.get()===e&&this.detail.get()!==null&&!this.detailLoading.get()||this.detailLoading.get()&&this.detailId.get()===e)return;this.detailId.set(e);const n=await F(this.detailLoading,this.detailError,()=>Promise.all([y.competitions.get({id:e}),y.competitions.participants({competitionId:e})]));if(!n)return;const[i,r]=n;this.detailId.get()===e&&(this.detail.set(i),this.participants.set(r),await this.loadBoard(e),i.lifecycle==="finalized"&&await this.loadResults(e))}async loadBoard(e){this.boardLoading.set(!0);try{const t=await y.competitions.leaderboard({id:e});t.ok?(this.board.set(t.value),this.boardRefusal.set(null)):(this.board.set(null),this.boardRefusal.set(t.refusal.message))}catch{this.board.set(null),this.boardRefusal.set(null)}finally{this.boardLoading.set(!1)}}async loadResults(e){try{const t=await y.competitions.results({id:e});t.ok?(this.results.set(t.value),this.resultsRefusal.set(null)):(this.results.set(null),this.resultsRefusal.set(t.refusal.message))}catch{this.results.set(null)}}async create(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await y.competitions.create({name:e});return this.list.set([t,...this.list.get()]),t}catch(t){return this.mutateError.set(He(t)),null}finally{this.mutating.set(!1)}}transition(e,t){return this.mutate(()=>y.competitions.transition({id:e,to:t}),()=>this.loadDetail(e,!0))}updateConfig(e){return this.mutate(()=>y.competitions.update(e),()=>this.loadDetail(e.id,!0))}async addPlayer(e,t,n){return this.rosterMutate(e,()=>y.competitions.addParticipant({competitionId:e,playerId:t,category:n}))}async addGuest(e,t,n){this.mutating.set(!0),this.mutateError.set(null);let i;try{i=(await y.guestPlayers.create(t)).id}catch(r){return this.mutating.set(!1),this.mutateError.set(He(r)),He(r)}return this.mutating.set(!1),this.rosterMutate(e,()=>y.competitions.addParticipant({competitionId:e,guestPlayerId:i,category:n}))}removeParticipant(e,t){return this.rosterMutate(e,()=>y.competitions.removeParticipant({participantId:t}))}withdrawParticipant(e,t){return this.rosterMutate(e,()=>y.competitions.withdrawParticipant({participantId:t}))}async createRound(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await y.competitions.createRound(e);if(t.ok)return await this.loadDetail(e.id,!0),{ok:!0,shareToken:t.shareToken};const n="refusal"in t?t.refusal.message:t.diagnostics.map(i=>i.message).join(" · ");return this.mutateError.set(n),{ok:!1,message:n}}catch(t){const n=He(t);return this.mutateError.set(n),{ok:!1,message:n}}finally{this.mutating.set(!1)}}async applyCut(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await y.competitions.applyCut({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const n=He(t);return this.mutateError.set(n),{ok:!1,message:n}}finally{this.mutating.set(!1)}}async finalize(e){this.mutating.set(!0),this.mutateError.set(null);try{const t=await y.competitions.finalize({id:e});return t.ok?(await this.loadDetail(e,!0),{ok:!0,outcome:t.value}):(this.mutateError.set(t.refusal.message),{ok:!1,message:t.refusal.message})}catch(t){const n=He(t);return this.mutateError.set(n),{ok:!1,message:n}}finally{this.mutating.set(!1)}}clear(){this.list.set([]),this.listLoaded.set(!1),this.detail.set(null),this.detailId.set(null),this.participants.set([]),this.board.set(null),this.boardRefusal.set(null),this.results.set(null),this.resultsRefusal.set(null),this.listError.set(null),this.detailError.set(null),this.mutateError.set(null)}async mutate(e,t){this.mutating.set(!0),this.mutateError.set(null);try{const n=await e();return n.ok?(await t(),null):(this.mutateError.set(n.refusal.message),n.refusal.message)}catch(n){const i=He(n);return this.mutateError.set(i),i}finally{this.mutating.set(!1)}}rosterMutate(e,t){return this.mutate(t,async()=>{const n=await y.competitions.participants({competitionId:e});this.participants.set(n)})}}function He(s){return s&&typeof s=="object"&&"message"in s&&typeof s.message=="string"?s.message:"Something went wrong. Try again."}function aa(s){switch(s){case"draft":return"Draft";case"setup":return"Setup";case"active":return"Live";case"finalized":return"Finalized"}}function oa(s){return`comp-chip comp-chip--${s}`}function Ms(s){switch(s){case"draft":return{to:"setup",label:"Open setup"};case"setup":return{to:"active",label:"Start competition"};default:return null}}function Ys(s){return s==="draft"||s==="setup"}function dg(s){return s==="setup"||s==="active"}const cg=b(`
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
`),ug=b(`
    <button bind="row" type="button" class="comp-row">
        <span bind="name" class="comp-row__name"></span>
        <span bind="chip"></span>
    </button>
`);class hg extends M{static styles=`
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
                    ${$()}
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
                & input { ${ae()} flex: 1; padding: ${a("md")}; font-size: 1rem; }
                & button {
                    ${$()}
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
    `;svc=this.inject(Fe);auth=this.inject(D);router=this.inject(G);loggedIn=new k(()=>this.auth.currentUser.get()!==null);nameDraft=new f("");render(){this.loggedIn.get()&&this.svc.loadList();const e=this.wire(cg,{anon:{className:()=>this.loggedIn.get()?"comps__anon hidden":"comps__anon"},toLogin:{onclick:()=>this.router.navigate("/login",{query:{next:"/competitions"}})},body:{className:()=>this.loggedIn.get()?"comps__body":"comps__body hidden"},nameInput:{value:()=>this.nameDraft.get(),oninput:t=>this.nameDraft.set(t.target.value)},createBtn:{disabled:()=>this.svc.mutating.get()||this.nameDraft.get().trim()==="",textContent:()=>this.svc.mutating.get()?"Creating…":"Create"},createForm:{onsubmit:async t=>{t.preventDefault();const n=this.nameDraft.get().trim();if(n==="")return;const i=await this.svc.create(n);i&&(this.nameDraft.set(""),this.router.navigate("/competition",{query:{id:i.id}}))}},createErr:{textContent:()=>this.svc.mutateError.get()??""},loading:{className:()=>this.svc.listLoading.get()&&!this.svc.listLoaded.get()?"comps__loading":"comps__loading hidden"},empty:{className:()=>this.svc.listLoaded.get()&&this.svc.list.get().length===0?"comps__empty":"comps__empty hidden"}});return this.$each(this.ref(e,"list"),this.svc.list,(t,n,i)=>this.wireEl(ug,{row:{onclick:()=>this.router.navigate("/competition",{query:{id:t.id}})},name:()=>t.name,chip:{textContent:()=>aa(t.lifecycle),className:()=>oa(t.lifecycle)}},i),t=>t.id),e}}class pg{loading=new f(!1);error=new f(null);descriptors=new f([]);started=!1;async load(){if(this.started)return;this.started=!0;const e=await F(this.loading,this.error,()=>y.setup.aggregations());e?this.descriptors.set(e):this.started=!1}byId(e){return this.descriptors.get().find(t=>t.id===e)??null}labelOf(e,t=_e()){const n=typeof e=="string"?this.byId(e):e;return n?n.labels?.[t]??n.labels?.en??n.label:typeof e=="string"?e:""}}function fg(s,e){const t={};for(const n of s){const i=e[n.key];t[n.key]=i!=null?String(i):String(n.default)}return t}function mg(s,e){const t={};for(const n of s){const i=e[n.key]??String(n.default);t[n.key]=n.kind==="integer"?Number.parseInt(i,10)||Number(n.default):i}return t}class _t{competitions=U.get(Fe);formats=U.get(Ue);aggregations=U.get(pg);friends=U.get(Zt);profile=U.get(Ce);auth=U.get(D);router=U.get(G);id=this.router.query("id");admin=new k(()=>lg(this.competitions.detail.get(),this.profile.player.get()?.id??null));lifecycle=new k(()=>this.competitions.detail.get()?.lifecycle??"draft");editingSetup=new f(!1);nameDraft=new f("");slotDraft=new f([]);aggregationStrategy=new f("");aggregationValues=new f({});startListDraft=new f("single_group");courseDraft=new f("");teeDraft=new f("");cutAfterDraft=new f("");cutTypeDraft=new f("");cutValueDraft=new f("");formatPickDraft=new f("");guestNameDraft=new f("");guestGenderDraft=new f("M");guestHcpDraft=new f("");roundCourseDraft=new f("");roundDateDraft=new f("");courses=new f([]);tees=new f([]);resultSetIndex=new f(0);cutOutcome=new f(null);cutConfirmOpen=new f(!1);finalizeConfirmOpen=new f(!1);coursesLoaded=!1;enter(){this.editingSetup.set(!1),this.nameDraft.set(""),this.slotDraft.set([]),this.aggregationStrategy.set(""),this.aggregationValues.set({}),this.startListDraft.set("single_group"),this.courseDraft.set(""),this.teeDraft.set(""),this.tees.set([]),this.cutAfterDraft.set(""),this.cutTypeDraft.set(""),this.cutValueDraft.set(""),this.formatPickDraft.set(""),this.guestNameDraft.set(""),this.guestGenderDraft.set("M"),this.guestHcpDraft.set(""),this.roundCourseDraft.set(""),this.roundDateDraft.set(""),this.resultSetIndex.set(0),this.cutOutcome.set(null),this.cutConfirmOpen.set(!1),this.finalizeConfirmOpen.set(!1)}initialize(){this.auth.currentUser.get()&&(this.profile.load(),this.friends.load()),this.formats.load(),this.aggregations.load(),this.loadCourses()}loadCourses(){this.coursesLoaded||(this.coursesLoaded=!0,y.courses.list().then(e=>this.courses.set(e)).catch(()=>{this.coursesLoaded=!1}))}async loadTees(e){if(!e){this.tees.set([]);return}try{this.tees.set(await y.tees.listByCourse({courseId:e}))}catch{this.tees.set([])}}selectAggregation(e){this.applyAggregation(e,{})}applyAggregation(e,t){this.aggregationStrategy.set(e);const n=this.aggregations.byId(e)?.configFields??[];this.aggregationValues.set(fg(n,t))}setAggregationValue(e,t){this.aggregationValues.set({...this.aggregationValues.get(),[e]:t})}seedSetupEditor(){const e=this.competitions.detail.get();if(!e)return;this.nameDraft.set(e.name);const t=e.defaultConfig;this.slotDraft.set((t?.slots??[]).map(d=>d.formatId)),this.startListDraft.set(t?.startList??"single_group"),this.teeDraft.set(t?.fallbackTee?.teeId??"");const n=e.aggregation,i=n?.strategyId??this.aggregations.descriptors.get()[0]?.id??"";this.applyAggregation(i,n?.config??{});const r=e.cutRules;this.cutAfterDraft.set(r?.afterRound!==void 0?String(r.afterRound):""),this.cutTypeDraft.set(r?.cutType??""),this.cutValueDraft.set(r?.cutValue!==void 0?String(r.cutValue):""),this.formatPickDraft.set(this.formats.descriptors.get()[0]?.id??""),this.editingSetup.set(!0)}async saveSetup(){const e=this.id.get()??"",t=this.slotDraft.get().map(g=>({formatId:g})),n=this.teeDraft.get(),i=t.length>0?{slots:t,startList:this.startListDraft.get(),...n?{fallbackTee:{teeId:n}}:{}}:void 0,r=this.aggregationStrategy.get(),d=this.aggregations.byId(r)?.configFields??[],o=r?{strategyId:r,config:mg(d,this.aggregationValues.get())}:void 0,c=Number.parseInt(this.cutAfterDraft.get(),10),u=Number.parseInt(this.cutValueDraft.get(),10),p=this.cutTypeDraft.get(),m=p&&Number.isFinite(c)&&Number.isFinite(u)?{afterRound:c,cutType:p,cutValue:u}:void 0;await this.competitions.updateConfig({id:e,name:this.nameDraft.get().trim()||void 0,...i?{defaultConfig:i}:{},...o?{aggregation:o}:{},...m?{cutRules:m}:{}})===null&&this.editingSetup.set(!1)}async addGuest(){const e=this.guestNameDraft.get().trim();if(!e)return;const t=ve(this.guestHcpDraft.get());await this.competitions.addGuest(this.id.get()??"",{displayName:e,gender:this.guestGenderDraft.get(),handicapIndex:t},null)===null&&(this.guestNameDraft.set(""),this.guestHcpDraft.set(""))}async createRound(){const e=this.roundCourseDraft.get()||this.courseDraft.get(),t=this.roundDateDraft.get();if(!e||!t)return this.competitions.mutateError.set("Pick a course and a date for the round."),null;const n=await this.competitions.createRound({id:this.id.get()??"",courseId:e,playedAt:t});return n.ok?n.shareToken:null}}const gg=b(`
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
`),bg=b(`
    <div class="cd__slot">
        <span bind="label"></span>
        <button bind="remove" type="button" aria-label="Remove">×</button>
    </div>
`),It=b('<option bind="option"></option>'),_g=b(`
    <label class="cd__field">
        <span bind="label"></span>
        <select bind="select"></select>
        <input bind="integer" inputmode="numeric" />
    </label>
`);class yg extends M{competitions=this.inject(Fe);state=this.inject(_t);render(){const e=()=>this.competitions.detail.get(),t=this.wire(gg,{root:{className:()=>this.state.admin.get()&&Ys(this.state.lifecycle.get())?"cd__section cd__setup":"cd__section cd__setup hidden"},toggle:{textContent:()=>this.state.editingSetup.get()?"Close":"Edit",onclick:()=>{this.state.editingSetup.get()?this.state.editingSetup.set(!1):this.state.seedSetupEditor()}},summary:{className:()=>this.state.editingSetup.get()?"cd__summary hidden":"cd__summary"},summaryFormats:{textContent:()=>{const r=e()?.defaultConfig?.slots??[];return r.length?r.map(d=>this.state.formats.labelOf(d.formatId)??d.formatId).join(", "):"none set"},className:()=>(e()?.defaultConfig?.slots.length??0)===0?"cd__muted-em":""},summaryScoring:{textContent:()=>{const r=e()?.aggregation;return r?this.state.aggregations.labelOf(r.strategyId):"default (chosen automatically)"},className:()=>e()?.aggregation?"":"cd__muted-em"},form:{className:()=>this.state.editingSetup.get()?"cd__form":"cd__form hidden"},name:{value:()=>this.state.nameDraft.get(),oninput:r=>this.state.nameDraft.set(r.target.value)},formatPick:{value:()=>this.state.formatPickDraft.get(),onchange:r=>this.state.formatPickDraft.set(r.target.value)},addSlot:{onclick:()=>{const r=this.state.formatPickDraft.get()||this.state.formats.descriptors.get()[0]?.id;r&&this.state.slotDraft.set([...this.state.slotDraft.get(),r])}},aggregationPick:{value:()=>this.state.aggregationStrategy.get(),onchange:r=>this.state.selectAggregation(r.target.value)},aggregationDescription:()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.description??"",course:{value:()=>this.state.courseDraft.get(),onchange:r=>{const d=r.target.value;this.state.courseDraft.set(d),this.state.teeDraft.set(""),this.state.loadTees(d)}},tee:{value:()=>this.state.teeDraft.get(),onchange:r=>this.state.teeDraft.set(r.target.value)},startList:{value:()=>this.state.startListDraft.get(),onchange:r=>this.state.startListDraft.set(r.target.value)},cutAfter:{value:()=>this.state.cutAfterDraft.get(),oninput:r=>this.state.cutAfterDraft.set(r.target.value)},cutType:{value:()=>this.state.cutTypeDraft.get(),onchange:r=>this.state.cutTypeDraft.set(r.target.value)},cutValue:{value:()=>this.state.cutValueDraft.get(),oninput:r=>this.state.cutValueDraft.set(r.target.value)},save:{disabled:()=>this.competitions.mutating.get(),textContent:()=>this.competitions.mutating.get()?"Saving…":"Save setup",onclick:()=>{this.state.saveSetup()}},cancel:{onclick:()=>this.state.editingSetup.set(!1)}});this.$each(this.ref(t,"slots"),this.state.slotDraft,(r,d,o)=>this.wireEl(bg,{label:()=>`Slot ${d+1}: ${this.state.formats.labelOf(r)??r}`,remove:{onclick:()=>this.state.slotDraft.set(this.state.slotDraft.get().filter((c,u)=>u!==d))}},o),(r,d)=>`${d}:${r}`),this.$each(this.ref(t,"formatPick"),this.state.formats.descriptors,(r,d,o)=>this.wireEl(It,{option:{value:()=>r.id,textContent:()=>this.state.formats.labelOf(r)??r.id}},o),r=>r.id),this.$each(this.ref(t,"aggregationPick"),this.state.aggregations.descriptors,(r,d,o)=>this.wireEl(It,{option:{value:()=>r.id,textContent:()=>this.state.aggregations.labelOf(r)}},o),r=>r.id);const n=new k(()=>this.state.aggregations.byId(this.state.aggregationStrategy.get())?.configFields??[]);this.$each(this.ref(t,"aggregationFields"),n,(r,d,o)=>this.configField(r,o),r=>r.key);const i=(r,d)=>this.wireEl(It,{option:{value:()=>r.id,textContent:()=>r.name}},d);return this.$each(this.ref(t,"course"),this.state.courses,(r,d,o)=>i(r,o),r=>r.id),this.$each(this.ref(t,"tee"),this.state.tees,(r,d,o)=>i(r,o),r=>r.id),t}configField(e,t){const n=this.wireEl(_g,{label:()=>e.label,select:{className:()=>e.kind==="select"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),onchange:d=>this.state.setAggregationValue(e.key,d.target.value)},integer:{className:()=>e.kind==="integer"?"":"hidden",value:()=>this.state.aggregationValues.get()[e.key]??String(e.default),oninput:d=>this.state.setAggregationValue(e.key,d.target.value)}},t),i=n.querySelector("select"),r=new k(()=>e.kind==="select"?e.options:[]);return this.$each(i,r,(d,o,c)=>this.wireEl(It,{option:{value:()=>d.value,textContent:()=>d.label}},c),d=>d.value),n}}const vg=b(`
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
`),wg=b(`
    <div class="cd__rosterrow">
        <span bind="name" class="cd__rname"></span>
        <span bind="category" class="cd__rcat"></span>
        <span bind="status" class="cd__rout"></span>
        <button bind="withdraw" class="cd__ract" type="button">Withdraw</button>
        <button bind="remove" class="cd__ract cd__ract--danger" type="button">Remove</button>
    </div>
`),xg=b('<button bind="chip" class="cd__friendchip" type="button"></button>');class $g extends M{competitions=this.inject(Fe);state=this.inject(_t);render(){const e=()=>this.state.id.get()??"",t=this.wire(vg,{count:()=>{const n=this.competitions.participants.get().length;return n===0?"":String(n)},empty:{className:()=>this.competitions.participants.get().length===0?"cd__empty":"cd__empty hidden"},add:{className:()=>this.state.admin.get()&&Ys(this.state.lifecycle.get())?"cd__rosteradd":"cd__rosteradd hidden"},guestForm:{onsubmit:n=>{n.preventDefault(),this.state.addGuest()}},guestName:{value:()=>this.state.guestNameDraft.get(),oninput:n=>this.state.guestNameDraft.set(n.target.value)},guestGender:{value:()=>this.state.guestGenderDraft.get(),onchange:n=>this.state.guestGenderDraft.set(n.target.value)},guestHcp:{value:()=>this.state.guestHcpDraft.get(),oninput:n=>this.state.guestHcpDraft.set(n.target.value)},addGuest:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"roster"),this.competitions.participants,(n,i,r)=>this.wireEl(wg,{name:()=>n.displayNameSnapshot,category:{textContent:()=>n.category??"",className:()=>n.category?"cd__rcat":"cd__rcat hidden"},status:{textContent:()=>n.withdrawnAt?"Withdrawn":n.cutAfterRound!==null?`Cut R${n.cutAfterRound}`:"",className:()=>n.withdrawnAt||n.cutAfterRound!==null?"cd__rout":"cd__rout hidden"},withdraw:{className:()=>this.state.admin.get()&&!n.withdrawnAt?"cd__ract":"cd__ract hidden",onclick:()=>{this.competitions.withdrawParticipant(e(),n.id)}},remove:{className:()=>this.state.admin.get()&&Ys(this.state.lifecycle.get())?"cd__ract cd__ract--danger":"cd__ract cd__ract--danger hidden",onclick:()=>{this.competitions.removeParticipant(e(),n.id)}}},r),n=>JSON.stringify({id:n.id,name:n.displayNameSnapshot,category:n.category,withdrawnAt:n.withdrawnAt,cutAfterRound:n.cutAfterRound})),this.$each(this.ref(t,"friends"),this.state.friends.friends,(n,i,r)=>this.wireEl(xg,{chip:{textContent:()=>n.displayName,disabled:()=>this.competitions.mutating.get()||this.competitions.participants.get().some(d=>d.playerId===n.id),onclick:()=>{this.competitions.addPlayer(e(),n.id,null)}}},r),n=>n.id),t}}const kg={not_started:"Not started",active:"Live",complete:"Finished"},Sg=b(`
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
`),Tg=b(`
    <button bind="row" class="cd__roundrow" type="button">
        <span bind="number" class="cd__rnum"></span>
        <span bind="meta" class="cd__rmeta"></span>
        <span bind="status" class="cd__rstatus"></span>
    </button>
`),Pg=b('<option bind="option"></option>');class Cg extends M{competitions=this.inject(Fe);state=this.inject(_t);router=this.inject(G);render(){const e=new k(()=>this.competitions.detail.get()?.rounds??[]),t=this.wire(Sg,{empty:{className:()=>e.get().length===0?"cd__empty":"cd__empty hidden"},form:{className:()=>this.state.admin.get()&&dg(this.state.lifecycle.get())?"cd__addround":"cd__addround hidden",onsubmit:n=>{n.preventDefault(),this.createRound()}},course:{value:()=>this.state.roundCourseDraft.get(),onchange:n=>this.state.roundCourseDraft.set(n.target.value)},date:{value:()=>this.state.roundDateDraft.get(),oninput:n=>this.state.roundDateDraft.set(n.target.value)},add:{disabled:()=>this.competitions.mutating.get()}});return this.$each(this.ref(t,"course"),this.state.courses,(n,i,r)=>this.wireEl(Pg,{option:{value:()=>n.id,textContent:()=>n.name}},r),n=>n.id),this.$each(this.ref(t,"rounds"),e,(n,i,r)=>this.wireEl(Tg,{row:{disabled:()=>!n.shareToken,onclick:()=>{n.shareToken&&this.router.navigate("/round",{query:{token:n.shareToken}})}},number:()=>`Round ${n.roundNumber}`,meta:()=>[n.courseNameSnapshot,n.date].filter(Boolean).join(" · ")||(n.shareToken?"Open":"View-only"),status:{textContent:()=>kg[n.status]??n.status,className:()=>`cd__rstatus s-${n.status}`}},r),n=>JSON.stringify({id:n.id,status:n.status,shareToken:n.shareToken,courseName:n.courseNameSnapshot,date:n.date})),t}async createRound(){const e=await this.state.createRound();e&&this.router.navigate("/round",{query:{token:e}})}}function Ig(s,e,t){return JSON.stringify({entry:s,points:e,columns:t})}function Eg(s){return s.rounds.filter(e=>e.value!==null).map(e=>({text:String(e.value),dropped:e.status==="dropped"}))}const Rg=b(`
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
`),Ng=b('<button bind="button" type="button"></button>'),Og=b('<th bind="cell"></th>'),Hg=b('<tr bind="row"></tr>'),Mg=b('<td bind="cell"><span bind="value"></span></td>'),Ag=b(`
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
`),zg=b('<span bind="part"><span bind="separator"></span><span bind="value"></span></span>');class Lg extends M{competitions=this.inject(Fe);state=this.inject(_t);render(){const e=new k(()=>{if(this.state.lifecycle.get()!=="finalized")return(this.competitions.board.get()?.view.entries??[]).map(m=>({entry:m,points:null}));const u=this.competitions.results.get()?.resultSets??[],p=Math.min(this.state.resultSetIndex.get(),u.length-1);return(u[p]?.entries??[]).map(m=>({entry:m.entry,points:m.points}))}),t=new k(()=>{const u=this.competitions.board.get()?.view.rounds??[];if(u.length>0)return u;const p=new Set;for(const m of e.get())for(const h of m.entry.rounds)p.add(h.roundNumber);return[...p].sort((m,h)=>m-h).map(m=>({roundNumber:m,postCut:!1}))}),n=()=>this.state.lifecycle.get()==="finalized",i=()=>n()?(this.competitions.results.get()?.resultSets.length??0)>0:this.competitions.board.get()!==null,r=()=>this.state.cutOutcome.get(),d=u=>u.length===0?"—":u.map(p=>p.displayName).join(", "),o=this.wire(Rg,{admin:{className:()=>this.state.admin.get()&&this.state.lifecycle.get()==="active"?"cd__section cd__admin":"cd__section cd__admin hidden"},cutOutcome:{className:()=>r()?"cd__cutoutcome":"cd__cutoutcome hidden"},advancedLabel:()=>`Advanced (${r()?.advanced.length??0}):`,advanced:()=>d(r()?.advanced??[]),cutLabel:()=>`Cut (${r()?.cut.length??0}):`,cut:()=>d(r()?.cut??[]),applyCut:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.cutConfirmOpen.set(!0)},finalize:{disabled:()=>this.competitions.mutating.get(),onclick:()=>this.state.finalizeConfirmOpen.set(!0)},title:()=>n()?"Official results":"Leaderboard",board:{className:()=>n()?"cd__board cb cb--official":"cd__board"},official:{textContent:()=>{const u=this.competitions.results.get()?.finalizedAt.slice(0,10)??"";return n()&&u?`Official results · finalized ${u}`:""},className:()=>n()?"cd__official-banner":"cd__official-banner hidden"},boardHead:{className:()=>n()?"cb-head hidden":"cb-head"},metric:()=>this.competitions.board.get()?.view.metricLabel??"",operator:()=>{const u=this.competitions.board.get();return u?u.view.operator.kind==="best_n"?`Best ${u.view.operator.n} of ${u.view.rounds.length}`:"Total across rounds":""},defaulted:{className:()=>this.competitions.board.get()?.defaulted?"cb-head__hint":"cb-head__hint hidden"},empty:{className:()=>i()&&e.get().length===0?"cb-empty":"cb-empty hidden"},table:{className:()=>i()&&e.get().length>0?"cb":"cb hidden"},refusal:{textContent:()=>n()?this.competitions.resultsRefusal.get()??"":this.competitions.board.get()===null?this.competitions.boardRefusal.get()??"":""}}),c=new k(()=>[{text:"#",className:"cb-pos"},{text:"Player",className:"cb-who"},...t.get().map((u,p,m)=>({text:`R${u.roundNumber}`,className:`cb-c${u.postCut&&!m.slice(0,p).some(h=>h.postCut)?" cb-c--divider":""}`})),{text:"Total",className:"cb-total"},...n()?[{text:"Pts",className:"cb-points"}]:[]]);return this.$each(this.ref(o,"headers"),c,(u,p,m)=>this.wireEl(Og,{cell:{textContent:()=>u.text,className:()=>u.className}},m),u=>`${u.text}:${u.className}`),this.$each(this.ref(o,"rows"),e,(u,p,m)=>this.boardRow(u,t.get(),m),u=>Ig(u.entry,u.points,t.get())),this.$each(this.ref(o,"switcher"),new k(()=>n()?this.competitions.results.get()?.resultSets??[]:[]),(u,p,m)=>this.wireEl(Ng,{button:{textContent:()=>u.scoringType.toUpperCase(),className:()=>this.state.resultSetIndex.get()===p?"on":"",onclick:()=>this.state.resultSetIndex.set(p)}},m),u=>u.scoringType),this.spawn(oe,this.ref(o,"cutConfirm"),{open:this.state.cutConfirmOpen,title:"Apply cut?",message:"This evaluates the configured cut against the current aggregate and marks who advances. Cut players are left out of later rounds.",confirmLabel:"Apply cut",cancelLabel:"Cancel",onconfirm:async()=>{const u=await this.competitions.applyCut(this.state.id.get()??"");u.ok&&this.state.cutOutcome.set(u.outcome)}}),this.spawn(oe,this.ref(o,"finalizeConfirm"),{open:this.state.finalizeConfirmOpen,title:"Finalize competition?",message:"Finalizing freezes the official results and locks the competition. This cannot be undone.",confirmLabel:"Finalize",cancelLabel:"Cancel",danger:!0,onconfirm:()=>{this.competitions.finalize(this.state.id.get()??"")}}),o}boardRow(e,t,n){const i=e.entry,r=i.withdrawn||i.cutAfterRound!==null,d=["cb-row"];i.withdrawn?d.push("cb-row--withdrawn"):i.cutAfterRound!==null?d.push("cb-row--cut"):i.position===1&&d.push("cb-row--lead"),i.incomplete&&d.push("cb-row--incomplete");const o=t.findIndex(m=>m.postCut),c=new Map(i.rounds.map(m=>[m.roundNumber,m])),u=[{kind:"position",text:r?"—":String(i.position)},{kind:"who",entry:i},...t.map((m,h)=>({kind:"round",cell:c.get(m.roundNumber)??null,divider:h===o})),{kind:"total",text:i.total===null?"—":String(i.total)},...e.points===null?[]:[{kind:"points",text:String(e.points)}]],p=this.wireEl(Hg,{row:{className:()=>d.join(" ")}},n);return this.$each(p,new k(()=>u),(m,h,g)=>this.boardCell(m,g),(m,h)=>h),p}boardCell(e,t){if(e.kind==="who")return this.whoCell(e.entry,t);const n=e.kind==="position"?"cb-pos":e.kind==="total"?"cb-total":e.kind==="points"?"cb-points":`cb-c cb-c--${e.cell?.status??"missing"}${e.divider?" cb-c--divider":""}`,i=e.kind==="round"?e.cell?.value===null||!e.cell?"—":String(e.cell.value):e.text;return this.wireEl(Mg,{cell:{className:()=>n},value:{textContent:()=>i,className:()=>e.kind==="round"&&e.cell?.status==="dropped"?"cb-struck":""}},t)}whoCell(e,t){const n=e.withdrawn?"WD":e.cutAfterRound!==null?`Cut R${e.cutAfterRound}`:"",i=Eg(e),r=this.wireEl(Ag,{cell:{},name:()=>e.displayName,category:{textContent:()=>e.category??"",className:()=>e.category?"cb-tag cb-cat":"cb-tag cb-cat hidden"},status:{textContent:()=>n,className:()=>n?"cb-tag cb-tag--out":"cb-tag cb-tag--out hidden"},equals:{className:()=>i.length===0?"hidden":""},total:()=>e.total===null?"—":String(e.total)},t);return this.$each(r.querySelector('[bind="parts"]'),new k(()=>i),(d,o,c)=>this.wireEl(zg,{separator:()=>o===0?"":" + ",value:{textContent:()=>d.text,className:()=>d.dropped?"cb-struck":""}},c),(d,o)=>o),r}}const Bg=b(`
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
`);class Fg extends M{static styles=`
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
                    ${$()}
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
                    & input, & select { ${ae()} padding: ${a("sm")} ${a("md")}; font-size: 0.95rem; }
                }
                & .cd__aggdesc { margin: 0; font-size: 0.8rem; color: ${l("text-muted")}; &:empty { display: none; } }
                & .cd__aggfields { display: flex; flex-direction: column; gap: ${a("md")}; &:empty { display: none; } }
                & .cd__cutrow, & .cd__addrow { display: flex; gap: ${a("sm")}; }
                & .cd__cutrow input { width: 33%; }
                & .cd__addrow select { flex: 1; }
                & .cd__slots { display: flex; flex-direction: column; gap: ${a("xs")}; }
                & .cd__formactions { display: flex; align-items: center; gap: ${a("md")}; margin-top: ${a("sm")}; }
                & button[bind="addSlot"], & button[bind="saveSetup"] {
                    ${$()}
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
                ${$()}
                padding: ${a("xs")} ${a("md")}; font-family: inherit;
                font-size: 0.85rem; font-weight: 600; cursor: pointer;
                &:disabled { opacity: 0.4; }
            }
            & .cd__guestrow, & .cd__addroundrow { display: flex; gap: ${a("sm")}; }
            & .cd__guestrow input, & .cd__addroundrow input, & .cd__addroundrow select {
                ${ae()}
                padding: ${a("sm")} ${a("md")}; font-size: 0.9rem; min-width: 0; }
            & .cd__guestrow input[bind="guestName"] { flex: 1; }
            & .cd__guestrow input[bind="guestHcp"] { width: 4.5rem; }
            & .cd__guestrow select { width: 3.5rem; }
            & .cd__addroundrow select { flex: 1; }
            & .cd__guestrow button, & .cd__addroundrow button {
                ${$()}
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
                ${$()}
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
                    ${$()}
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
    `;competitions=this.inject(Fe);state=this.inject(_t);router=this.inject(G);render(){const e=()=>this.competitions.detail.get();this.track(C(()=>{const n=this.state.id.get();n&&te(()=>{this.state.enter(),this.competitions.loadDetail(n)})})),this.state.initialize();const t=this.wire(Bg,{back:{onclick:()=>this.router.navigate("/competitions")},loading:{className:()=>this.competitions.detailLoading.get()&&e()===null?"cd__loading":"cd__loading hidden"},loadErr:{textContent:()=>this.competitions.detailError.get()?.message??"",className:()=>this.competitions.detailError.get()?"cd__loaderr":"cd__loaderr hidden"},body:{className:()=>e()?"cd__body":"cd__body hidden"},name:()=>e()?.name??"",chip:{textContent:()=>aa(this.state.lifecycle.get()),className:()=>oa(this.state.lifecycle.get())},ownerLine:{textContent:()=>this.state.admin.get()?"You administer this competition.":"Read-only view."},mutateErr:{textContent:()=>this.competitions.mutateError.get()??""},transitionRow:{className:()=>this.state.admin.get()&&Ms(this.state.lifecycle.get())?"cd__transition":"cd__transition hidden"},transitionBtn:{textContent:()=>Ms(this.state.lifecycle.get())?.label??"",disabled:()=>this.competitions.mutating.get(),onclick:()=>{const n=Ms(this.state.lifecycle.get()),i=this.state.id.get();n&&i&&this.competitions.transition(i,n.to)}}});return this.spawn(yg,this.ref(t,"setup")),this.spawn($g,this.ref(t,"roster")),this.spawn(Cg,this.ref(t,"rounds")),this.spawn(Lg,this.ref(t,"results")),t}}const Gg=b(`
    <div class="app-shell">
        <header bind="header" class="app-shell__header">
            <div bind="account"></div>
        </header>
        <main bind="content" class="app-shell__content"></main>
        <div bind="nav" class="app-shell__nav"></div>
    </div>
`);class jg extends M{static styles=`
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
    `;router=this.inject(G);render(){const e=this.wire(Gg,{header:{className:()=>Zs(this.router.route.get())?"app-shell__header":"app-shell__header hidden"}});return this.spawn(gu,this.ref(e,"account")),this.spawn(Mo,this.ref(e,"nav")),this.$swap(this.ref(e,"content"),this.router.route,{"/":Yn,"/history":Ou,"/round":$f,"/create":Qf,"/login":nm,"/friends":om,"/friend":dm,"/friend-rounds":um,"/friend-courses":fm,"/spectate":ym,"/profile":km,"/stats":Dm,"/round-stats":Jm,"/admin":og,...Xi.competitions?{"/competitions":hg,"/competition":Fg}:{}},Yn),e}}class Dg extends D{async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await ta(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await Jf()),this.error.set(null)}catch(e){e instanceof Y&&e.status===401?this.error.set(null):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await Zf(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof Y&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logoutEverywhere(){this.loading.set(!0);try{const e=await em();return this.currentUser.set(null),this.error.set(null),e.revoked}catch(e){return e instanceof Y&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"}),null}finally{this.loading.set(!1)}}}U.get(Pa);const Oi=U.get(G);U.set(D,new Dg);const Hi=U.get(D);await Ra(jg,"#app",{hot:void 0,onInit:async()=>{await Hi.load(),Hi.currentUser.get()&&Oi.route.get()==="/login"&&Oi.navigate("/",!0)}});export{As as A,M as C,G as R,f as S,Pa as T,_ as a,ot as b,k as c,_a as d,C as e,ba as n,F as r,b as t};
