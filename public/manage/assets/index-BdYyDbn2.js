(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function t(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(a){if(a.ep)return;a.ep=!0;const s=t(a);fetch(a.href,s)}})();const Be="modulepreload",Ge=function(n){return"/tapscore/manage/"+n},ue={},He=function(e,t,r){let a=Promise.resolve();if(t&&t.length>0){let h=function(c){return Promise.all(c.map(d=>Promise.resolve(d).then(u=>({status:"fulfilled",value:u}),u=>({status:"rejected",reason:u}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),l=i?.nonce||i?.getAttribute("nonce");a=h(t.map(c=>{if(c=Ge(c),c in ue)return;ue[c]=!0;const d=c.endsWith(".css"),u=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${u}`))return;const _=document.createElement("link");if(_.rel=d?"stylesheet":Be,d||(_.as="script"),_.crossOrigin="",_.href=c,l&&_.setAttribute("nonce",l),document.head.appendChild(_),d)return new Promise((x,P)=>{_.addEventListener("load",x),_.addEventListener("error",()=>P(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(i){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=i,window.dispatchEvent(l),!l.defaultPrevented)throw i}return a.then(i=>{for(const l of i||[])l.status==="rejected"&&s(l.reason);return e().catch(s)})},V="/tapscore/manage/".replace(/\/+$/,""),ee=V+"/api",Y={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},Ue=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function We(n,e){const t={};for(const[r,a]of Ue)if(r in n)for(const s of a)s in n||(t[s]=`var(--${r})`);return{...e,...t,...n}}const ve=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],Ke={thin:"1px",medium:"3px",thick:"5px"};function _e(n){const e=n.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":Ke[e.toLowerCase()]??e}function Fe(){return ve.map(n=>{const e=_e(Y[n]);return`@property --${n}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const $e={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},xe={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},Ve={...xe,"done-opacity":"0.35"},Ye={...$e,...xe,...Y,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},Xe={...$e,...Ve,...Y,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class Qe{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;ke(e);const r=this.tracking;this.tracking=e;try{t()}finally{this.tracking=r}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const r of t)r.disposed||r.run()}}}const L=new Qe;function ke(n){for(const e of n.deps)e.delete(n);n.deps.clear()}class w{constructor(e){this.subs=new Set,this.val=e}get(){return L.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,L.notify(this.subs))}update(e){this.set(e(this.val))}}class G{constructor(e){this.subs=new Set,this.val=void 0;const t=this,r={run(){L.runTracked(r,()=>{const a=e();Object.is(t.val,a)||(t.val=a,L.notify(t.subs))})},deps:new Set};r.run()}get(){return L.subscribe(this.subs),this.val}peek(){return this.val}}function $(n){const e={run(){L.runTracked(e,n)},deps:new Set};return e.run(),()=>{e.disposed=!0,ke(e)}}function W(n){L.batch(n)}function E(n){return L.untrack(n)}class Je{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const N=new Je,D=V;function te(n){return D?n===D?"/":n.startsWith(D+"/")?n.slice(D.length):n:n}function Ze(n){return D+n}class X{constructor(){this.route=new w(te(location.pathname??"/")),this.search=new w(location.search??""),window.addEventListener("popstate",()=>W(()=>{this.route.set(te(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const r=typeof t=="boolean"?{replace:t}:t??{},a=e.indexOf("#"),s=a>=0?e.slice(a):"",i=a>=0?e.slice(0,a):e,l=i.indexOf("?"),h=l>=0?i.slice(0,l):i,c=l>=0?i.slice(l+1):"",d=r.query!==void 0?et(r.query):c?"?"+c:"",u=Ze(h)+d+s;(r.replace?history.replaceState:history.pushState).call(history,null,"",u),W(()=>{this.route.set(h),this.search.set(d)})}back(){history.back()}link(e,t="active"){const r=e.split("#")[0].split("?")[0];return{onclick:a=>{a.preventDefault(),this.navigate(e)},className:()=>{const a=this.route.get();return a===r||a.startsWith(r+"/")?t:""}}}params(e){const t=e.split("/");return new G(()=>{const r=this.route.get().split("/"),a={};for(const[s,i]of t.entries())i.startsWith(":")&&(a[i.slice(1)]=r[s]??"");return a})}query(e){return new G(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new G(()=>{const e={};for(const[t,r]of new URLSearchParams(this.search.get()))e[t]=r;return e})}}function et(n){const e=new URLSearchParams;for(const[r,a]of Object.entries(n))a==null||a===""||e.set(r,String(a));const t=e.toString();return t?"?"+t:""}function tt(n){return e=>n[e]}const nt="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",me="data-basics-global";function rt(){if(document.head.querySelector(`style[${me}]`))return;const n=document.createElement("style");n.setAttribute(me,""),n.textContent=Fe()+nt,document.head.appendChild(n)}function st(n,e){rt();const t=new Set(ve),r=(s,i,l)=>{const h=Object.entries(s).map(([c,d])=>`--${c}:${t.has(c)?_e(d):d}`).join(";");return`${i}{color-scheme:${l};${h}}`},a=document.createElement("style");return a.textContent=r(n,'[data-theme="light"]',"light")+r(e,'[data-theme="dark"]',"dark"),document.head.appendChild(a),s=>`var(--${s})`}const fe="basics-js-theme";class Ee{constructor(){this.dark=new w(!1);const e=localStorage.getItem(fe),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),$(()=>{const r=this.dark.get();document.documentElement.setAttribute("data-theme",r?"dark":"light"),localStorage.setItem(fe,r?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function S(n){const e=document.createElement("template");return e.innerHTML=n,e}function at(n,e){let t;for(const r of Object.keys(e))n.startsWith(r+"/")&&(!t||r.length>t.length)&&(t=r);return t?e[t]:void 0}const pe=new Set;class k{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!pe.has(t)){pe.add(t);const r=document.createElement("style");r.textContent=t.styles,document.head.appendChild(r)}}onMount(){}onDestroy(){}inject(e){return N.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...r){const a=E(()=>{const s=new e(r[0]);return s.mount(t),s});return this.children.push(a),a}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){E(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,r){const a=r??(i=>this.track(i)),s=e.content.cloneNode(!0);for(const i of s.querySelectorAll("[bind]")){const l=t[i.getAttribute("bind")];if(l)if(typeof l=="function")a($(()=>{const h=l();i instanceof HTMLInputElement||i instanceof HTMLTextAreaElement?i.value=String(h):i.textContent=String(h)}));else for(const[h,c]of Object.entries(l)){const d=h.includes("-");h.startsWith("on")&&typeof c=="function"?i.addEventListener(h.slice(2),c):typeof c=="function"?a($(()=>{const u=c();d?i.setAttribute(h,String(u)):i[h]=u})):d?i.setAttribute(h,String(c)):i[h]=c}}return s}wireEl(e,t,r){return this.wire(e,t,r).firstElementChild}slot(e,t){const r=this.props[e];if(r==null)return!1;const a=this.ref(t,e);return a?(typeof r=="string"?a.textContent=r:typeof r=="function"&&r.prototype instanceof k?this.spawn(r,a):typeof r=="function"&&r(a,{spawn:(s,i,...l)=>this.spawn(s,i,...l),track:s=>this.track(s)}),!0):!1}$each(e,t,r,a=(s,i)=>i){const s=typeof t=="function"?t:()=>t.get(),i=new Map,l=new Map;this.track(()=>{for(const h of l.values())h.forEach(c=>c());l.clear()}),this.track($(()=>{const h=s(),c=new Map;for(const[u,_]of h.entries()){const x=a(_,u);if(i.has(x))c.set(x,i.get(x));else{const P=[];c.set(x,E(()=>r(_,u,qe=>P.push(qe)))),l.set(x,P)}}for(const[u,_]of i)c.has(u)||(_.remove(),E(()=>l.get(u)?.forEach(x=>x())),l.delete(u));let d=e.firstChild;for(const u of c.values())u===d?d=d.nextSibling:e.insertBefore(u,d);i.clear();for(const[u,_]of c)i.set(u,_)}))}$condition(e,t,r,a){let s=null;this.track($(()=>{s&&(s.remove(),s=null);const i=t.get();s=E(()=>i?r():a?.()??null),s&&e.appendChild(s)}))}$swap(e,t,r,a){let s=null;this.track($(()=>{if(s){const h=s;s=null,E(()=>h.destroy())}e.textContent="";const i=t.get(),l=r[i]??at(i,r)??a;l&&(s=E(()=>{const h=new l;return h.mount(e),h}))})),this.track(()=>s?.destroy())}}const K=new Set;function ot(n){return K.add(n),()=>K.delete(n)}function it(){for(const n of Array.from(K)){K.delete(n);try{n()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function lt(n,e,t){const r=document.querySelector(e);r.textContent="";const a=N.get(X);let s=null,i=!1,l=null,h=!!t?.hot?.data.hmr;const c=async d=>{s&&(s.destroy(),s=null,r.textContent=""),d?(l||(l=(await He(()=>import("./obs-shell.component-BAONS1bv.js"),[])).ObsShellComponent),s=E(()=>new l)):(!h&&t?.onInit&&(await t.onInit(),h=!0),s=E(()=>new n)),E(()=>s.mount(r)),i=d};await c(te(location.pathname).startsWith("/_obs")),$(()=>{const d=a.route.get().startsWith("/_obs");d!==i&&c(d)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{s?.destroy()}catch(d){console.error("[startApp] the root component threw while disposing",d)}if(s=null,it(),t.onDispose)try{t.onDispose()}catch(d){console.error("[startApp] onDispose threw",d)}}),t.hot.accept())}class T extends Error{constructor(e,t,r,a){super(t),this.status=e,this.details=r,this.traceId=a,this.name="ApiError"}}const ct=10,H=[];let U=[],R=null;function dt(n){H.push(n),H.length>ct&&H.shift()}function Se(n,e,t){const r={code:n,message:e,url:typeof location<"u"?location.href:"",context:[...H],timestamp:new Date().toISOString()};t!==void 0&&(r.traceId=t),U.push(r),ht()}function ht(){R||(R=setTimeout(Te,5e3))}function Te(){if(R&&(clearTimeout(R),R=null),U.length===0)return;const n=U;U=[];for(const e of n){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${ee}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${ee}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Te()});const ut=3e4,mt=2,j=new Map,Ce=new WeakMap;function ft(n){if(n instanceof T)return n.traceId;if(n!=null&&typeof n=="object")return Ce.get(n)}async function b(n){if(n.method==="GET"){const e=j.get(n.url);if(e)return e;const t=ge(n,mt);return j.set(n.url,t),t.then(()=>j.delete(n.url),()=>j.delete(n.url)),t}return ge(n,0)}async function ge(n,e){const t=n.timeout??ut;let r;for(let a=0;a<=e;a++){const s=crypto.randomUUID();try{return await gt(pt(n,s),t)}catch(i){if(r=i,!(i instanceof T)&&i!=null&&typeof i=="object"&&Ce.set(i,s),i instanceof T||a===e)break;await new Promise(l=>setTimeout(l,1e3*2**a))}}throw r}async function pt(n,e){const t={"X-Trace-Id":e},r={method:n.method,headers:t};n.body!==void 0&&(t["Content-Type"]="application/json",r.body=JSON.stringify(n.body));const a=await fetch(n.url,r),s=a.headers.get("x-trace-id")??e;if(dt({type:"api",detail:`${n.method} ${n.url}`,timestamp:new Date().toISOString()}),!a.ok){const i=await a.json().catch(()=>({error:a.statusText}));throw new T(a.status,i.error??a.statusText,i.details,s)}return a.json()}function gt(n,e){let t;const r=new Promise((a,s)=>{t=setTimeout(()=>s(new Error("Request timeout")),e)});return Promise.race([n,r]).finally(()=>clearTimeout(t))}const ne=new Set;let Q=!1;function bt(n){return ne.add(n),()=>{ne.delete(n)}}function Le(){if(!Q){Q=!0;try{for(const n of[...ne])try{n()}catch(e){try{Se("session-listener",yt(e))}catch{}}}finally{Q=!1}}}function yt(n){try{if(n instanceof Error){const e=n.message;if(typeof e=="string")return e}return String(n)}catch{return"listener threw a value that could not be described"}}async function M(n,e,t,r={}){W(()=>{n.set(!0),e.set(null)});try{const a=await t();return n.set(!1),a}catch(a){const s=wt(a);W(()=>{n.set(!1),e.set(s)}),Se(s.code,s.message,ft(a)),s.code==="auth"&&r.sessionExpiry!==!1&&Le();return}}function wt(n){return n instanceof T?n.status===401?{code:"auth",message:"Unauthorized"}:n.status===409?{code:"conflict",message:"Data has changed — please try again"}:n.status===400?{code:"validation",message:n.message}:n.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:n instanceof Error?n.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const J={sessionExpiry:!1};function vt(n){return{me:()=>b({method:"GET",url:`${n}/auth/me`}),login:e=>b({method:"POST",url:`${n}/auth/login`,body:e}),logout:()=>b({method:"POST",url:`${n}/auth/logout`,body:{}}),logoutAll:()=>b({method:"POST",url:`${n}/auth/logout-all`,body:{}})}}class A{constructor(){this.api=vt(ee),this.currentUser=new w(null),this.loading=new w(!1),this.error=new w(null),this.offSessionExpired=bt(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=ot(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await M(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const r=await M(this.loading,this.error,()=>this.api.login({username:e,password:t}),J);return r?(this.currentUser.set(r),!0):!1}async logout(){await M(this.loading,this.error,()=>this.api.logout(),J);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}async logoutEverywhere(){const e=await M(this.loading,this.error,()=>this.api.logoutAll(),J),t=this.error.get();return(!t||t.code==="auth")&&this.currentUser.set(null),e?.revoked??null}}const Ae={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},_t={...Ae,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},$t={...Ae,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"};function Ne(n,e={}){const t=n==="light"?_t:$t,r=n==="light"?Ye:Xe;return We({...t,...e},r)}const Oe={"manage-page-pad":"var(--space-4)","manage-page-pad-wide":"var(--space-6)","manage-stack-gap":"var(--space-3)","manage-section-gap":"var(--space-5)","manage-touch-target":"44px","manage-table-bg":"var(--surface)","manage-table-radius":"var(--radius)","manage-table-border":"var(--border)","manage-table-header-bg":"var(--surface-sunken)","manage-table-header-fg":"var(--text-muted)","manage-table-header-border":"var(--border-strong)","manage-table-header-pad-y":"var(--space-2)","manage-table-header-pad-x":"var(--space-3)","manage-table-cell-pad-y":"var(--space-3)","manage-table-cell-pad-x":"var(--space-3)","manage-table-row-border":"var(--border)","manage-table-row-hover-bg":"var(--hover-bg)","manage-table-row-editing-bg":"var(--accent-soft)","manage-table-card-gap":"var(--space-2)","manage-sidebar-width":"232px","manage-content-max":"1120px"},De=n=>({"manage-chrome-bg":"var(--topbar-bg)","manage-chrome-fg":n,"manage-chrome-fg-muted":"color-mix(in srgb, var(--manage-chrome-fg) 66%, transparent)","manage-chrome-border":"color-mix(in srgb, var(--manage-chrome-fg) 14%, transparent)","manage-chrome-hover-bg":"color-mix(in srgb, var(--manage-chrome-fg) 9%, transparent)","manage-chrome-active-bg":"color-mix(in srgb, var(--manage-chrome-fg) 16%, transparent)","manage-scrim":"color-mix(in srgb, var(--topbar-bg) 62%, transparent)"}),ze=Ne("light",{...Oe,...De("var(--primary-text)")}),Re=Ne("dark",{...Oe,...De("var(--text)")}),o=st(ze,Re);function xt(){const n=document.querySelector('meta[name="theme-color"]');if(!n)return;const e=N.get(Ee);$(()=>{const r=(e.dark.get()?Re:ze)["topbar-bg"];r&&n.setAttribute("content",r)})}class kt extends A{constructor(e){super(),this.client=e}client;async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await this.client.login(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await this.client.me()),this.error.set(null)}catch(e){e instanceof T&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await this.client.logout(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof T&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logoutEverywhere(){this.loading.set(!0);try{const e=await this.client.logoutAll();return this.currentUser.set(null),this.error.set(null),e.revoked}catch(e){return e instanceof T&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"}),null}finally{this.loading.set(!1)}}}function Et(n){return{login:(e,t)=>b({method:"POST",url:`${n}/auth/login`,body:{username:e,password:t}}),me:()=>b({method:"GET",url:`${n}/auth/me`}),logout:()=>b({method:"POST",url:`${n}/auth/logout`,body:{}}),logoutAll:()=>b({method:"POST",url:`${n}/auth/logout-all`,body:{}})}}const z="/tapscore/manage/".replace(/\/+$/,"").replace(/\/manage$/,"")+"/api",Ie=Et(z);function St(n){return{async list(){return b({method:"GET",url:`${n}/clubs`})},async get(e){const t=new URLSearchParams;for(const[a,s]of Object.entries(e))s!==void 0&&t.set(a,String(s));const r=t.toString();return b({method:"GET",url:`${n}/clubs/get${r?"?"+r:""}`})},async create(e){return b({method:"POST",url:`${n}/clubs`,body:e})},async update(e){return b({method:"POST",url:`${n}/clubs/update`,body:e})},async remove(e){return b({method:"DELETE",url:`${n}/clubs/${e.id}`})}}}function Tt(n){return{async list(){return b({method:"GET",url:`${n}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[a,s]of Object.entries(e))s!==void 0&&t.set(a,String(s));const r=t.toString();return b({method:"GET",url:`${n}/courses/by-club${r?"?"+r:""}`})},async get(e){const t=new URLSearchParams;for(const[a,s]of Object.entries(e))s!==void 0&&t.set(a,String(s));const r=t.toString();return b({method:"GET",url:`${n}/courses/get${r?"?"+r:""}`})},async teeRoleCatalog(){return b({method:"GET",url:`${n}/courses/tee-roles/catalog`})},async teeRoles(e){const t=new URLSearchParams;for(const[a,s]of Object.entries(e))s!==void 0&&t.set(a,String(s));const r=t.toString();return b({method:"GET",url:`${n}/courses/tee-roles${r?"?"+r:""}`})},async create(e){return b({method:"POST",url:`${n}/courses`,body:e})},async update(e){return b({method:"POST",url:`${n}/courses/update`,body:e})},async updateHole(e){return b({method:"POST",url:`${n}/courses/holes/update`,body:e})},async setTeeRole(e){return b({method:"POST",url:`${n}/courses/tee-roles`,body:e})},async clearTeeRole(e){return b({method:"DELETE",url:`${n}/courses/tee-roles/${e.courseId}/${e.roleKey}/${e.gender}`})},async validate(e){const t=new URLSearchParams;for(const[a,s]of Object.entries(e))s!==void 0&&t.set(a,String(s));const r=t.toString();return b({method:"GET",url:`${n}/courses/validate${r?"?"+r:""}`})},async remove(e){return b({method:"DELETE",url:`${n}/courses/${e.id}`})}}}function Ct(n){return{async listByCourse(e){const t=new URLSearchParams;for(const[a,s]of Object.entries(e))s!==void 0&&t.set(a,String(s));const r=t.toString();return b({method:"GET",url:`${n}/tees/by-course${r?"?"+r:""}`})},async get(e){const t=new URLSearchParams;for(const[a,s]of Object.entries(e))s!==void 0&&t.set(a,String(s));const r=t.toString();return b({method:"GET",url:`${n}/tees/get${r?"?"+r:""}`})},async create(e){return b({method:"POST",url:`${n}/tees`,body:e})},async update(e){return b({method:"POST",url:`${n}/tees/update`,body:e})},async remove(e){return b({method:"DELETE",url:`${n}/tees/${e.id}`})}}}function Lt(n){return{async myRoles(){return b({method:"GET",url:`${n}/me/roles`})},async adminStats(){return b({method:"GET",url:`${n}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[a,s]of Object.entries(e))s!==void 0&&t.set(a,String(s));const r=t.toString();return b({method:"GET",url:`${n}/admin/rounds${r?"?"+r:""}`})},async adminPlayers(){return b({method:"GET",url:`${n}/admin/players`})},async adminGrantRole(e){return b({method:"POST",url:`${n}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return b({method:"POST",url:`${n}/admin/roles/revoke`,body:e})}}}const At={clubs:St(z),courses:Tt(z),tees:Ct(z),admin:Lt(z)};class O{roles=new w([]);loaded=new w(!1);error=new w(null);inflight=null;isSuperAdmin(){return this.has("super_admin")}canManageCourses(){return this.isSuperAdmin()||this.has("course_admin")}has(e){return this.roles.get().some(t=>t.role===e&&t.scopeType===null)}load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.error.set(null);try{this.roles.set(await At.admin.myRoles())}catch(t){this.roles.set([]),t instanceof T&&t.status===401?Le():(this.error.set("Cannot reach the server."),this.inflight=null)}finally{this.loaded.set(!0)}})(),this.inflight)}clear(){this.roles.set([]),this.loaded.set(!1),this.error.set(null),this.inflight=null}}const y=n=>`var(--${n})`,m=(n,e)=>`var(--${n}, ${e})`,f=n=>{const e=Y[n];if(e===void 0)throw new Error(`unknown control token: --${n}`);return e},p=tt({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),q=n=>`
    background: ${m(`btn-${n}-bg`,f(`btn-${n}-bg`))};
    color: ${m(`btn-${n}-fg`,f(`btn-${n}-fg`))};
    border-color: ${m(`btn-${n}-border`,f(`btn-${n}-border`))};
    box-shadow: ${m(`btn-${n}-shadow`,f(`btn-${n}-shadow`))};
    &:hover {
        background: ${m(`btn-${n}-bg-hover`,f(`btn-${n}-bg-hover`))};
        color: ${m(`btn-${n}-fg-hover`,f(`btn-${n}-fg-hover`))};
        border-color: ${m(`btn-${n}-border-hover`,f(`btn-${n}-border-hover`))};
    }`,Pe=`
    background: ${m("btn-disabled-bg",f("btn-disabled-bg"))};
    color: ${m("btn-disabled-fg",f("btn-disabled-fg"))};
    border-color: ${m("btn-disabled-border",f("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${m("btn-disabled-opacity",f("btn-disabled-opacity"))};
    cursor: not-allowed;`,Nt={primary:q("primary"),secondary:q("secondary"),ghost:q("ghost"),danger:q("danger"),disabled:Pe},C=(n=m("btn-radius",f("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${m("btn-border-width",f("btn-border-width"))} solid transparent;
    border-radius: ${n};
    padding: ${m("btn-padding-y",f("btn-padding-y"))} ${m("btn-padding-x",f("btn-padding-x"))};
    font-family: ${y("font-ui")};
    font-size: ${m("btn-font-size",f("btn-font-size"))};
    line-height: ${m("btn-line-height",f("btn-line-height"))};
    font-weight: ${m("btn-font-weight",f("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${y("dur-fast")} ${y("ease-standard")},
        border-color ${y("dur-fast")} ${y("ease-standard")},
        color ${y("dur-fast")} ${y("ease-standard")},
        box-shadow ${y("dur-fast")} ${y("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${m("btn-focus-ring-width",f("btn-focus-ring-width"))} ${m("btn-focus-ring",f("btn-focus-ring"))};
    }
    ${Nt[e]}
    &:disabled {${Pe}}
`,Ot=`max(${m("field-border-width",f("field-border-width"))}, ${m("field-rule-width",f("field-rule-width"))})`,B=(n,e)=>`
    border-top-color: ${n};
    border-right-color: ${n};
    border-left-color: ${n};
    border-bottom-color: ${e};`,je=()=>`
    border-style: solid;
    border-top-width: ${m("field-border-width",f("field-border-width"))};
    border-right-width: ${m("field-border-width",f("field-border-width"))};
    border-left-width: ${m("field-border-width",f("field-border-width"))};
    border-bottom-width: ${Ot};
    ${B(m("field-border",f("field-border")),m("field-rule",f("field-rule")))}
    border-radius: ${m("field-radius",f("field-radius"))};
    padding: ${m("field-padding-y",f("field-padding-y"))} ${m("field-padding-x",f("field-padding-x"))};
    background: ${m("field-bg",f("field-bg"))};
    color: ${y("text")};
    font-family: ${y("font-ui")};
    font-size: ${m("field-font-size",f("field-font-size"))};
    line-height: ${m("field-line-height",f("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${y("dur-fast")} ${y("ease-standard")},
        box-shadow ${y("dur-fast")} ${y("ease-standard")},
        background ${y("dur-fast")} ${y("ease-standard")};
    &::placeholder { color: ${y("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${B(m("field-focus-border",f("field-focus-border")),m("field-focus-border",f("field-focus-border")))}
        background: ${m("field-bg-focus",f("field-bg-focus"))};
        box-shadow: 0 0 0 ${m("field-focus-ring-width",f("field-focus-ring-width"))} ${m("field-focus-ring",f("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${B(m("field-invalid-border",f("field-invalid-border")),m("field-invalid-rule",f("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${B(m("field-invalid-border",f("field-invalid-border")),m("field-invalid-rule",f("field-invalid-rule")))}
        background: ${m("field-bg-focus",f("field-bg-focus"))};
        box-shadow: 0 0 0 ${m("field-focus-ring-width",f("field-focus-ring-width"))} ${m("field-invalid-ring",f("field-invalid-ring"))};
    }
`,Dt=()=>`
    display: block;
    font-family: ${y("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${y("text-muted")};
`,oe=n=>`
    background: ${y("surface")};
    border: 1px solid ${y("border")};
    border-radius: ${y("radius-md")};
    box-shadow: ${y("shadow-1")};
    ${n?.hover?`
    transition:
        box-shadow ${y("dur-base")} ${y("ease-standard")},
        border-color ${y("dur-base")} ${y("ease-standard")};
    &:hover { box-shadow: ${y("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${Dt()}
        margin: 0 0 ${p("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${y("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${y("text")};
    }
    & .ui-card__meta {
        margin: ${p("xs")} 0 0 0;
        font-family: ${y("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${y("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${p("md")};
        font-family: ${y("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${y("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;class ie{crumbs=new w([]);set(e){this.crumbs.set(e)}}const ce=class ce extends k{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track($(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};ce.styles=`
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
    `;let re=ce;const g=n=>`var(--${n})`,de=class de extends k{render(){const e=document.createElement("div"),t=(h,c)=>{typeof c=="function"?this.track($(()=>{h.textContent=c()})):h.textContent=c};this.spawn(re,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const r=document.createElement("h2");r.className="ui-confirm__title",t(r,this.props.title??"Confirm"),this.dialogEl.appendChild(r);const a=document.createElement("p");a.className="ui-confirm__message",t(a,this.props.message),this.dialogEl.appendChild(a);const s=document.createElement("div");s.className="ui-confirm__actions";const i=document.createElement("button");i.className="ui-confirm__btn ui-confirm__btn--cancel",t(i,this.props.cancelLabel??"Cancel"),i.addEventListener("click",h=>{h.stopPropagation(),this.handleCancel()}),s.appendChild(i);const l=document.createElement("button");return l.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(l,this.props.confirmLabel??"Confirm"),l.addEventListener("click",h=>{h.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),s.appendChild(l),this.dialogEl.appendChild(s),this.dialogEl.addEventListener("click",h=>h.stopPropagation()),e.appendChild(this.dialogEl),this.track($(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};de.styles=`
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${g("surface")};
            border: 1px solid ${g("border")};
            border-radius: ${g("radius-md")};
            box-shadow: ${g("shadow-3")};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition:
                opacity ${g("dur-slow")} ${g("ease-standard")},
                transform ${g("dur-slow")} ${g("ease-standard")};
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
            font-family: ${g("font-display")};
            font-size: 1.25rem;
            font-weight: 500;
            line-height: 1.4;
            color: ${g("text")};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-family: ${g("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${g("text")};
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
            font-family: ${g("font-ui")};
            font-weight: 600;
            border: 1px solid transparent;
            border-radius: ${g("radius-sm")};
            cursor: pointer;
            transition:
                background ${g("dur-fast")} ${g("ease-standard")},
                border-color ${g("dur-fast")} ${g("ease-standard")},
                color ${g("dur-fast")} ${g("ease-standard")},
                box-shadow ${g("dur-fast")} ${g("ease-standard")};
        }
        .ui-confirm__btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px ${g("accent-soft")};
        }
        .ui-confirm__btn--cancel {
            background: transparent;
            color: ${g("text-muted")};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${g("accent-soft")};
            color: ${g("accent")};
        }
        .ui-confirm__btn--confirm {
            background: ${g("accent")};
            color: ${g("on-accent")};
            border-color: ${g("accent")};
            box-shadow: ${g("shadow-1")};
        }
        .ui-confirm__btn--confirm:hover {
            background: ${g("accent-strong")};
            border-color: ${g("accent-strong")};
        }
        /* Outline, filling only on hover — same reasoning as css.ts danger. */
        .ui-confirm__btn--danger {
            background: transparent;
            color: ${g("danger")};
            border-color: ${g("danger")};
        }
        .ui-confirm__btn--danger:hover {
            background: ${g("danger")};
            color: ${g("on-danger")};
        }
    `;let se=de;const v=n=>`var(--${n})`,he=class he extends k{render(){const e=document.createElement("div");e.className="ui-empty-state";const t=i=>typeof i=="function"?i():i,r=(i,l)=>{typeof l=="function"?this.track($(()=>{i.textContent=t(l)})):i.textContent=l};if(this.props.ornament!==!1){const i=document.createElement("div");i.className="ui-empty-state__ornament",i.setAttribute("aria-hidden","true"),e.appendChild(i)}const a=document.createElement(`h${this.props.headingLevel??3}`);if(a.className="ui-empty-state__heading",r(a,this.props.heading),e.appendChild(a),this.props.body!==void 0){const i=document.createElement("p");i.className="ui-empty-state__body",r(i,this.props.body),e.appendChild(i)}const s=this.props.action;if(s){const i=document.createElement("button");i.className="ui-empty-state__action",i.setAttribute("type","button"),s.ariaLabel&&i.setAttribute("aria-label",s.ariaLabel),r(i,s.label),i.addEventListener("click",()=>s.onclick()),e.appendChild(i)}return e}};he.styles=`
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
    `;let ae=he;const zt=900,Rt=`(min-width: ${zt}px)`,It=660,Pt=`(max-width: ${It-.02}px)`;function jt(n){const e=new w(!1),t=typeof globalThis.matchMedia=="function"?globalThis.matchMedia(n):null;if(!t)return{value:e,dispose:()=>{}};e.set(t.matches);const r=a=>e.set(a.matches);return t.addEventListener("change",r),{value:e,dispose:()=>t.removeEventListener("change",r)}}const be="__actions";function F(n,e={}){const t=document.createElement("button");return t.type="button",t.className=e.variant==="primary"?"mtable__btn mtable__btn--primary":"mtable__btn",t.textContent=n,e.onclick&&t.addEventListener("click",e.onclick),t}function Mt(n){return typeof n=="object"&&n!==null&&typeof n.get=="function"}function ye(n,e,t){if(n.textContent="",e instanceof HTMLElement){n.appendChild(e);return}if(e==null||e===""){const r=document.createElement("span");r.className="mtable__empty-cell",r.textContent=t,n.appendChild(r);return}n.appendChild(document.createTextNode(String(e)))}class le extends k{static styles=`
        .mtable-wrap {
            width: 100%;
            min-width: 0;

            & .mtable {
                width: 100%;
                border-collapse: collapse;
                /* Never the display serif in cells. */
                font-family: ${o("font-ui")};
                font-size: 0.875rem;
                line-height: 1.5;
                color: ${o("text")};

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
                font-family: ${o("font-display")};
                font-size: 1.05rem;
                font-weight: 600;
                color: ${o("text")};
                padding: ${o("manage-table-cell-pad-y")} ${o("manage-table-cell-pad-x")} 0;
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
                background: ${o("manage-table-header-bg")};
                color: ${o("manage-table-header-fg")};
                border-bottom: 1px solid ${o("manage-table-header-border")};
                padding: ${o("manage-table-header-pad-y")} ${o("manage-table-header-pad-x")};
                text-align: left;
                /* Overline treatment, same as the framework table's — a Manage
                   header and a framework header should not be two designs. */
                font-family: ${o("font-ui")};
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                white-space: nowrap;
            }

            & .mtable__td {
                padding: ${o("manage-table-cell-pad-y")} ${o("manage-table-cell-pad-x")};
                border-bottom: 1px solid ${o("manage-table-row-border")};
                vertical-align: middle;
                text-align: left;
                transition: background ${o("dur-fast")} ${o("ease-standard")};
            }

            & .mtable__td--numeric {
                font-variant-numeric: tabular-nums;
                white-space: nowrap;
            }

            & .mtable__cell { min-width: 0; }
            & .mtable__empty-cell { color: ${o("text-muted")}; }

            & .mtable__stacked-label { display: none; }

            & .mtable__actions {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: ${p("sm")};
            }

            & .mtable__btn {
                ${C()}
                min-height: ${o("manage-touch-target")};
                padding: 0 ${p("md")};
                font-size: 0.85rem;
                font-weight: 700;
            }

            & .mtable__btn--primary {
                ${C(void 0,"primary")}
                min-height: ${o("manage-touch-target")};
                padding: 0 ${p("md")};
                font-size: 0.85rem;
                font-weight: 700;
            }

            /* Worded, muted or danger — never a spinner glyph and never an
               emoji (docs/design-guidelines.md §4). */
            & .mtable__status {
                margin: ${p("xs")} 0 0;
                font-size: 0.8rem;
                line-height: 1.4;
                color: ${o("text-muted")};

                &[hidden] { display: none; }
                &.mtable__status--error { color: ${o("danger")}; font-weight: 600; }
            }

            & .mtable__empty {
                &[hidden] { display: none; }
            }

            /* ─── Wide: a real grid inside its own scroll box ─── */

            &[data-layout='columns'] {
                background: ${o("manage-table-bg")};
                border: 1px solid ${o("manage-table-border")};
                border-radius: ${o("manage-table-radius")};
                /* The wrapper is the scroll container, so a table too wide for
                   the content column scrolls HERE and the page body never
                   scrolls sideways. It also clips the header fill to the
                   radius, which a border-collapsed table cannot do itself. */
                overflow-x: auto;

                & .mtable__tr:last-child .mtable__td { border-bottom: none; }

                & .mtable__tr:not(.mtable__tr--editing):hover > .mtable__td {
                    background: ${o("manage-table-row-hover-bg")};
                }

                & .mtable__tr--editing > .mtable__td {
                    background: ${o("manage-table-row-editing-bg")};
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
                    padding: 0 0 ${p("sm")};
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
                    gap: ${o("manage-table-card-gap")};
                }

                & .mtable__tr {
                    background: ${o("manage-table-bg")};
                    border: 1px solid ${o("manage-table-border")};
                    border-radius: ${o("manage-table-radius")};
                    padding: ${o("manage-table-cell-pad-y")} ${o("manage-table-cell-pad-x")};
                }

                & .mtable__tr--editing {
                    background: ${o("manage-table-row-editing-bg")};
                }

                & .mtable__td {
                    padding: ${p("xs")} 0;
                    border-bottom: none;
                    white-space: normal;
                }

                & .mtable__stacked-label {
                    display: block;
                    font-family: ${o("font-ui")};
                    font-size: 0.6875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                    color: ${o("manage-table-header-fg")};
                    margin-bottom: 2px;
                }

                & .mtable__td--actions {
                    padding-top: ${o("manage-table-cell-pad-y")};

                    /* Direct children of the action bar, which is why the
                       actions prop takes buttons (or an array of them) and not
                       a wrapper element: a wrapper would be the flex item, and
                       the buttons inside it would keep their content width. */
                    & > .mtable__actions > .mtable__btn { flex: 1 1 auto; }
                }

                & .mtable__empty {
                    background: ${o("manage-table-bg")};
                    border: 1px solid ${o("manage-table-border")};
                    border-radius: ${o("manage-table-radius")};
                }
            }
        }
    `;static seq=0;uid=`mtable-${le.seq++}`;rowData=new Map;render(){const e=document.createElement("div");e.className="mtable-wrap";const t=document.createElement("table");t.className="mtable",t.setAttribute("role","table");const r=document.createElement("caption");r.className=this.props.captionHidden?"mtable__caption mtable__caption--hidden":"mtable__caption",r.id=`${this.uid}-caption`,r.textContent=this.props.caption,t.appendChild(r),t.setAttribute("aria-labelledby",r.id),t.appendChild(this.head());const a=document.createElement("tbody");if(a.className="mtable__body",a.setAttribute("role","rowgroup"),t.appendChild(a),e.appendChild(t),this.$each(a,()=>this.readRows(),(s,i,l)=>this.renderRow(s,l),s=>this.props.rowKey(s)),this.props.empty){const s=document.createElement("div");s.className="mtable__empty",this.spawn(ae,s,this.props.empty),e.appendChild(s),this.track($(()=>{const i=this.rowsValue().length===0;s.hidden=!i,t.hidden=i}))}return this.layout(e),e}layout(e){let t=this.props.narrow;if(!t){const a=jt(Pt);this.track(a.dispose),t=a.value}const r=this.props.stacked!==!1;this.track($(()=>{e.setAttribute("data-layout",r&&t.get()?"stacked":"columns")}))}head(){const e=document.createElement("thead");e.className="mtable__head",e.setAttribute("role","rowgroup");const t=document.createElement("tr");t.className="mtable__tr",t.setAttribute("role","row");for(const r of this.props.columns)t.appendChild(this.th(r.key,r.header));return this.hasActionsColumn()&&t.appendChild(this.th(be,this.props.actionsHeader??"Actions")),e.appendChild(t),e}th(e,t){const r=document.createElement("th");return r.className="mtable__th",r.setAttribute("role","columnheader"),r.setAttribute("scope","col"),r.setAttribute("data-key",e),r.textContent=t,r}hasActionsColumn(){return this.props.actions!==void 0||this.props.edit!==void 0}rowsValue(){return Mt(this.props.rows)?this.props.rows.get():this.props.rows}readRows(){const e=this.rowsValue();return E(()=>{const t=new Set;for(const r of e){const a=this.props.rowKey(r);t.add(a);const s=this.rowData.get(a);s?s.set(r):this.rowData.set(a,new w(r))}for(const r of[...this.rowData.keys()])t.has(r)||this.rowData.delete(r)}),e}signalFor(e){const t=this.props.rowKey(e);let r=this.rowData.get(t);return r||(r=new w(e),this.rowData.set(t,r)),r}renderRow(e,t){const r=this.props.rowKey(e),a={key:r},s=this.signalFor(e),i=this.props.edit,l=this.props.emptyCell??"—",h=()=>i?i.controller.key.get()===r:!1,c=document.createElement("tr");c.className="mtable__tr",c.setAttribute("role","row"),c.setAttribute("data-row-key",r);for(const d of this.props.columns){const u=document.createElement("td");if(u.className=`mtable__td mtable__td--${d.type??"text"}`,u.setAttribute("role","cell"),u.setAttribute("data-key",d.key),d.stackedLabel!==!1){const x=document.createElement("span");x.className="mtable__stacked-label",x.setAttribute("aria-hidden","true"),x.textContent=d.header,u.appendChild(x)}const _=document.createElement("div");_.className="mtable__cell",u.appendChild(_),t($(()=>{if(h()&&d.editCell){const x=s.peek();ye(_,E(()=>d.editCell(x,a)),l)}else{const x=s.get();ye(_,E(()=>d.cell(x,a)),l)}})),c.appendChild(u)}return this.hasActionsColumn()&&c.appendChild(this.actionsCell(a,s,h,t)),i&&(t($(()=>{c.classList.toggle("mtable__tr--editing",h())})),t($(()=>{i.controller.isSaving(r)?c.setAttribute("aria-busy","true"):c.removeAttribute("aria-busy")})),this.editKeys(c,r,s,t),i.autoFocus!==!1&&this.autoFocus(c,h,t)),c}actionsCell(e,t,r,a){const s=this.props.edit,i=document.createElement("td");i.className="mtable__td mtable__td--actions",i.setAttribute("role","cell"),i.setAttribute("data-key",be);const l=document.createElement("div");l.className="mtable__actions",i.appendChild(l);let h=null,c=null;if(s){h=F(s.saveLabel??"Save",{variant:"primary",onclick:()=>s.oncommit(t.peek())}),c=F(s.cancelLabel??"Cancel",{onclick:()=>{s.controller.cancel(),s.oncancel?.(t.peek())}}),a($(()=>{const u=s.controller.isSaving(e.key);h.disabled=u,c.disabled=u}));const d=document.createElement("p");d.className="mtable__status",d.setAttribute("role","status"),d.setAttribute("aria-live","polite"),i.appendChild(d),a($(()=>{const u=s.controller.errorFor(e.key),_=s.controller.isSaving(e.key);d.textContent=u??(_?s.savingLabel??"Saving…":""),d.className=u?"mtable__status mtable__status--error":"mtable__status",d.hidden=!u&&!_}))}return a($(()=>{if(r()&&s){l.textContent="",l.append(h,c);return}const d=t.get(),u=E(()=>this.props.actions?.(d,e));l.textContent="",Array.isArray(u)?l.append(...u):u instanceof HTMLElement?l.appendChild(u):u!=null&&u!==""&&l.appendChild(document.createTextNode(String(u)))})),i}editKeys(e,t,r,a){const s=this.props.edit,i=l=>{if(s.controller.key.peek()===t){if(l.key==="Enter"){if(l.target?.tagName==="TEXTAREA"||(l.preventDefault(),s.controller.phase.peek()==="saving"))return;s.oncommit(r.peek());return}l.key==="Escape"&&(l.preventDefault(),l.stopPropagation(),s.controller.cancel(),s.oncancel?.(r.peek()))}};e.addEventListener("keydown",i),a(()=>e.removeEventListener("keydown",i))}autoFocus(e,t,r){let a=!1,s=!0;r(()=>{s=!1}),r($(()=>{const i=t();i&&!a&&queueMicrotask(()=>{if(!s||!t())return;const l=e.querySelector('input:not([type="hidden"]), select, textarea');l&&(l.focus(),l instanceof HTMLInputElement&&typeof l.select=="function"&&l.select())}),a=i}))}}const qt="Could not save. Check your connection and try again.";class Bt{key=new w(null);phase=new w("idle");error=new w(null);begin(e){this.phase.get()!=="saving"&&(this.key.set(e),this.phase.set("editing"),this.error.set(null))}cancel(){this.phase.get()!=="saving"&&(this.key.set(null),this.phase.set("idle"),this.error.set(null))}async commit(e){if(this.key.get()===null||this.phase.get()==="saving")return!1;this.phase.set("saving"),this.error.set(null);let t;try{t=await e()}catch{t={ok:!1,message:qt}}return t.ok?(this.key.set(null),this.phase.set("idle"),this.error.set(null),!0):(this.phase.set("failed"),this.error.set(t.message),!1)}fail(e){this.key.get()!==null&&(this.phase.set("failed"),this.error.set(e))}isEditing(e){return this.key.get()===e}isSaving(e){return this.key.get()===e&&this.phase.get()==="saving"}errorFor(e){return this.key.get()===e&&this.phase.get()==="failed"?this.error.get():null}}function Gt(n){return{open:n.open,title:n.title,message:n.consequence,confirmLabel:n.confirmLabel,cancelLabel:n.cancelLabel??"Cancel",danger:!0,onconfirm:n.onconfirm,oncancel:n.oncancel}}function Ht(n,e){const t=r=>{r.key!=="Escape"||!n.get()||n.set(!1)};return document.addEventListener("keydown",t),()=>document.removeEventListener("keydown",t)}const Ut=()=>`
    ${je()}
    width: 100%;
    min-height: ${o("manage-touch-target")};
`,Wt=[{id:"lgk",name:"Linköpings GK",location:"Linköping",courses:2},{id:"vkg",name:"Vreta Kloster GK",location:"Ljungsbro",courses:1},{id:"sig",name:"Sweden Indoor Golf",location:null,courses:4}],Kt=3e3,Ft=S(`
    <div class="mdemo">
        <p class="mdemo__title">Primitives preview — temporary, replaced in M1</p>
        <p class="mdemo__lead">
            Nothing here is saved anywhere. Edit a row, then refresh the list while the editor is
            open: the row is reused rather than rebuilt, so your half-typed value survives.
            <b>Refresh now</b> moves focus to the button itself — that is the click, not the table —
            so to see the caret survive, press <b>Refresh in 3 seconds</b>, click back into a field,
            and wait for it to land. Save a name of <b>fail</b> to see the per-row error.
        </p>
        <div class="mdemo__bar">
            <button bind="refresh" class="mdemo__btn" type="button">Refresh now</button>
            <button bind="refreshLater" class="mdemo__btn" type="button">Refresh in 3 seconds</button>
            <span bind="refreshNote" class="mdemo__note"></span>
        </div>
        <div bind="tableHost"></div>
        <div bind="confirmHost"></div>
    </div>
`);class Vt extends k{static styles=`
        .mdemo {
            display: flex;
            flex-direction: column;
            gap: ${o("manage-stack-gap")};
            margin-top: ${o("manage-section-gap")};

            & .mdemo__title {
                margin: 0;
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            & .mdemo__lead {
                margin: 0;
                max-width: 60ch;
                color: ${o("text-muted")};
                font-size: 0.95rem;
                line-height: 1.5;
            }

            & .mdemo__bar {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: ${p("md")};
            }

            & .mdemo__btn {
                ${C()}
                min-height: ${o("manage-touch-target")};
                padding: 0 ${p("md")};
                font-size: 0.85rem;
                font-weight: 700;
            }

            & .mdemo__note {
                color: ${o("text-muted")};
                font-size: 0.8rem;
            }

            & .mdemo__input {
                ${Ut()}
                font-size: 0.85rem;
            }
        }
    `;rows=new w(Wt);edit=new Bt;nameDraft=new w("");locationDraft=new w("");refreshes=new w(0);pending=new w(!1);deleteOpen=new w(!1);deleteTarget=new w(null);timer=null;columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>e.name,editCell:e=>this.textInput("Club name",this.nameDraft,e.name)},{key:"location",header:"Location",cell:e=>e.location,editCell:e=>this.textInput("Location",this.locationDraft,e.location??"")},{key:"courses",header:"Courses",type:"numeric",cell:e=>e.courses}];render(){const e=this.wire(Ft,{refresh:{onclick:()=>this.simulateRefresh()},refreshLater:{onclick:()=>this.scheduleRefresh()},refreshNote:()=>{if(this.pending.get())return"Refreshing in a moment — click into a field.";const t=this.refreshes.get();return t===0?"The list has not refreshed yet.":`Refreshed ${t} time(s).`}});return this.spawn(le,this.ref(e,"tableHost"),{columns:this.columns,rows:this.rows,rowKey:t=>t.id,caption:"Clubs (demo data)",empty:{heading:"No clubs left",body:"Everything in this preview is local — reload the page to get the fixture back."},actions:t=>this.rowActions(t),edit:{controller:this.edit,oncommit:t=>this.save(t),oncancel:()=>this.clearDrafts()}}),this.spawn(se,this.ref(e,"confirmHost"),Gt({open:this.deleteOpen,title:"Delete this club?",consequence:()=>{const t=this.deleteTarget.get(),r=t?t.name:"This club",a=t?t.courses:0;return`${r} and its ${a} course(s) disappear from the catalog. Nothing in this preview is really saved.`},confirmLabel:"Delete club",onconfirm:()=>this.remove()})),this.track(Ht(this.deleteOpen)),this.track(()=>this.clearTimer()),e}textInput(e,t,r){const a=document.createElement("input");return a.type="text",a.className="mdemo__input",a.setAttribute("aria-label",e),a.value=r,t.set(r),a.addEventListener("input",()=>t.set(a.value)),a}rowActions(e){return[F("Edit",{onclick:()=>this.edit.begin(e.id)}),F("Delete",{onclick:()=>{this.deleteTarget.set(e),this.deleteOpen.set(!0)}})]}save(e){const t=this.nameDraft.get().trim();if(!t){this.edit.fail("A club needs a name. Enter one before saving.");return}const r=this.locationDraft.get().trim();this.edit.commit(async()=>(await new Promise(a=>setTimeout(a,700)),t.toLowerCase()==="fail"?{ok:!1,message:"The server rejected that name: a club called “fail” already exists in this region, and club names have to be unique."}:(this.rows.update(a=>a.map(s=>s.id===e.id?{...s,name:t,location:r||null}:s)),this.clearDrafts(),{ok:!0})))}remove(){const e=this.deleteTarget.get();e&&(this.rows.update(t=>t.filter(r=>r.id!==e.id)),this.deleteTarget.set(null))}simulateRefresh(){this.rows.update(e=>e.map(t=>({...t,courses:t.courses+1}))),this.refreshes.update(e=>e+1)}scheduleRefresh(){this.clearTimer(),this.pending.set(!0),this.timer=setTimeout(()=>{this.timer=null,this.pending.set(!1),this.simulateRefresh()},Kt)}clearTimer(){this.timer!==null&&(clearTimeout(this.timer),this.timer=null)}clearDrafts(){this.nameDraft.set(""),this.locationDraft.set("")}}const Yt=S(`
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
        <div bind="demoHost"></div>
    </section>
`);class Xt extends k{static styles=`
        .mcourses {
            display: flex;
            flex-direction: column;
            gap: ${p("md")};

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
                ${oe({})}
                margin-top: ${o("manage-stack-gap")};
                padding: ${o("manage-page-pad")};

                & .mcourses__panel-title {
                    margin: 0 0 ${p("sm")};
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: ${o("text-muted")};
                }

                & .mcourses__list {
                    margin: 0;
                    padding-left: ${p("lg")};
                    display: flex;
                    flex-direction: column;
                    gap: ${p("xs")};
                    color: ${o("text")};
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
            }
        }
    `;crumbs=this.inject(ie);render(){const e=this.wire(Yt,{});return this.spawn(Vt,this.ref(e,"demoHost"),{}),e}onMount(){this.crumbs.set([{label:"Courses"}])}}const Qt=[{id:"courses",label:"Courses",path:"/courses",routes:{"/courses":Xt},unlocked:n=>n.canManageCourses()}];function I(n){return Qt.filter(e=>e.unlocked(n))}function Jt(n){const e={};for(const t of I(n))Object.assign(e,t.routes);return e}const Zt=S(`
    <nav class="mnav" aria-label="Sections">
        <ul bind="list" class="mnav__list"></ul>
    </nav>
`),en=S(`
    <li class="mnav__item">
        <a bind="link" class="mnav__link"><span bind="label"></span></a>
    </li>
`);class we extends k{static styles=`
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
                padding: 0 ${p("md")};
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
    `;router=this.inject(X);roles=this.inject(O);render(){const e=this.wire(Zt,{});return this.$each(this.ref(e,"list"),()=>I(this.roles),(t,r,a)=>this.wireEl(en,{link:{href:V+t.path,className:()=>{const s=this.router.route.get();return s===t.path||s.startsWith(t.path+"/")?"mnav__link mnav__link--active":"mnav__link"},"aria-current":()=>{const s=this.router.route.get();return s===t.path||s.startsWith(t.path+"/")?"page":"false"},onclick:s=>{const i=s;i.metaKey||i.ctrlKey||i.shiftKey||i.button!==0||(s.preventDefault(),this.router.navigate(t.path),this.props.onNavigate?.())}},label:()=>t.label},a),t=>t.id),e}}const tn=S(`
    <section class="mnf">
        <h1 class="mnf__title">Nothing here</h1>
        <p class="mnf__body">That address does not match anything in Tapscore Manage.</p>
        <button bind="home" class="mnf__home" type="button"></button>
    </section>
`);class nn extends k{static styles=`
        .mnf {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: ${p("md")};

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
                ${C()}
                min-height: ${o("manage-touch-target")};
                padding: 0 ${p("lg")};
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 700;
                cursor: pointer;

                &.hidden { display: none; }
            }
        }
    `;router=this.inject(X);roles=this.inject(O);crumbs=this.inject(ie);onMount(){this.crumbs.set([])}render(){const e=I(this.roles)[0];return this.wire(tn,{home:{className:()=>e?"mnf__home":"mnf__home hidden",textContent:()=>e?`Go to ${e.label}`:"",onclick:()=>{e&&this.router.navigate(e.path,!0)}}})}}const rn=S(`
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
`),sn=S(`
    <li class="mshell__crumb">
        <span bind="sep" class="mshell__crumb-sep">/</span>
        <a bind="link" class="mshell__crumb-link"></a>
        <span bind="current" class="mshell__crumb-current" aria-current="page"></span>
    </li>
`),an=S(`
    <div class="mshell__identity-inner">
        <span bind="who" class="mshell__who"></span>
        <button bind="signout" class="mshell__signout" type="button">Sign out</button>
    </div>
`);class on extends k{static styles=`
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
                gap: ${p("sm")};
                min-height: ${o("manage-touch-target")};
                padding: 0 ${p("md")};
                margin-bottom: ${o("manage-stack-gap")};
            }

            /* Inset from the chrome's edges so the active item's pill reads as
               a raised shape sitting ON the sidebar, rather than as a band
               bleeding off both sides of it. */
            & .mshell__navhost {
                flex: 1;
                padding: 0 ${p("sm")};
            }

            & .mshell__identity {
                border-top: 1px solid ${o("manage-chrome-border")};
                padding-top: ${o("manage-stack-gap")};
                margin-top: ${o("manage-stack-gap")};

                & .mshell__identity-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: ${p("sm")};
                    padding: 0 ${p("md")};
                }

                & .mshell__who {
                    color: ${o("manage-chrome-fg-muted")};
                    font-size: 0.8rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }

                & .mshell__signout {
                    ${C(void 0,"ghost")}
                    min-height: ${o("manage-touch-target")};
                    padding: 0 ${p("md")};
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
                gap: ${p("md")};
                padding: 0 ${o("manage-page-pad")};
                padding-top: env(safe-area-inset-top);
                min-height: calc(${o("manage-touch-target")} + ${p("md")});
                background: ${o("manage-chrome-bg")};

                & .mshell__menu {
                    ${C(void 0,"ghost")}
                    min-height: ${o("manage-touch-target")};
                    min-width: ${o("manage-touch-target")};
                    padding: 0 ${p("md")};
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
                width: min(84vw, calc(${o("manage-sidebar-width")} + ${p("2xl")}));
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
                    ${C(void 0,"ghost")}
                    min-height: ${o("manage-touch-target")};
                    padding: 0 ${p("md")};
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
                    gap: ${p("xs")};
                    font-size: 0.8rem;
                }

                & .mshell__crumb {
                    display: flex;
                    align-items: center;
                    gap: ${p("xs")};
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

            @media ${Rt} {
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
    `;router=this.inject(X);auth=this.inject(A);roles=this.inject(O);breadcrumbs=this.inject(ie);drawerOpen=new w(!1);render(){const e=I(this.roles)[0];e&&this.router.route.get()==="/"&&this.router.navigate(e.path,!0);const t=this.wire(rn,{menu:{onclick:()=>this.drawerOpen.set(!0),"aria-expanded":()=>String(this.drawerOpen.get())},close:{onclick:()=>this.drawerOpen.set(!1)},scrim:{className:()=>this.drawerOpen.get()?"mshell__scrim open":"mshell__scrim",onclick:()=>this.drawerOpen.set(!1)},drawer:{className:()=>this.drawerOpen.get()?"mshell__drawer open":"mshell__drawer",inert:()=>!this.drawerOpen.get()}});return this.spawn(we,this.ref(t,"sidebarNav")),this.spawn(we,this.ref(t,"drawerNav"),{onNavigate:()=>this.drawerOpen.set(!1)}),this.identity(this.ref(t,"sidebarIdentity")),this.identity(this.ref(t,"drawerIdentity")),this.crumbs(this.ref(t,"crumbs")),this.$swap(this.ref(t,"outlet"),this.router.route,Jt(this.roles),nn),t}onMount(){this.track($(()=>{this.router.route.get(),this.drawerOpen.set(!1)}));const e=t=>{t.key==="Escape"&&this.drawerOpen.get()&&this.drawerOpen.set(!1)};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}identity(e){e.appendChild(this.wire(an,{who:()=>{const t=this.auth.currentUser.get();return t?`Signed in as ${t.username}`:""},signout:{onclick:()=>{this.drawerOpen.set(!1),this.auth.logout()}}}))}crumbs(e){const t=document.createElement("ol");e.appendChild(t),this.$each(t,()=>this.breadcrumbs.crumbs.get(),(r,a,s)=>this.wireEl(sn,{sep:{className:()=>a===0?"mshell__crumb-sep hidden":"mshell__crumb-sep"},link:{className:()=>r.path?"mshell__crumb-link":"mshell__crumb-link hidden",href:r.path?V+r.path:"",textContent:()=>r.path?r.label:"",onclick:i=>{const l=i;l.metaKey||l.ctrlKey||l.shiftKey||l.button!==0||(i.preventDefault(),r.path&&this.router.navigate(r.path))}},current:{className:()=>r.path?"mshell__crumb-current hidden":"mshell__crumb-current",textContent:()=>r.path?"":r.label}},s),(r,a)=>`${a}:${r.label}`)}}const Z="Something went wrong on our end. Try again in a moment.";function ln(n,e){const t=(n.details??[]).map(a=>a.path),r=a=>t.some(s=>s===`/${a}`);return r("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":r("username")?"Enter your username.":r("displayName")?"Enter a display name.":r("handicapIndex")?"Handicap index must be a number (or leave it empty).":r("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function cn(n,e){if(n instanceof T)switch(n.status){case 400:return ln(n,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":Z;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return n.status>=500?Z:"That request could not be completed."}return n instanceof Error&&n.message==="Request timeout"?"That took too long. Check your connection and try again.":n instanceof Error?"Cannot reach the server. Check your connection and try again.":Z}const dn=S(`
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
`);class hn extends k{static styles=`
        .msignin {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${o("manage-page-pad")};

            & .msignin__panel {
                ${oe({})}
                display: flex;
                flex-direction: column;
                gap: ${p("md")};
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
                gap: ${p("xs")};

                & span {
                    color: ${o("text-muted")};
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                & input {
                    ${je()}
                    min-height: ${o("manage-touch-target")};
                    padding: 0 ${p("md")};
                    font-family: inherit;
                    font-size: 1rem;
                }
            }

            & .msignin__submit {
                ${C(void 0,"primary")}
                min-height: ${o("manage-touch-target")};
                margin-top: ${p("xs")};
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
            }
        }
    `;auth=this.inject(A);roles=this.inject(O);username="";password="";busy=new w(!1);formError=new w("");render(){return this.wire(dn,{form:{inert:()=>this.busy.get(),onsubmit:async e=>{e.preventDefault(),await this.submit()}},error:{className:()=>this.formError.get()?"msignin__error show":"msignin__error",textContent:()=>this.formError.get()},username:{oninput:e=>{this.username=e.target.value}},password:{oninput:e=>{this.password=e.target.value}},submit:{textContent:()=>this.busy.get()?"Signing in…":"Sign in"}})}async submit(){if(this.formError.set(""),!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const e=await Ie.login(this.username.trim(),this.password);this.roles.clear(),this.auth.error.set(null),this.auth.currentUser.set(e)}catch(e){this.formError.set(cn(e,"login")),this.busy.set(!1)}}}const un=S(`
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
`);class mn extends k{static styles=`
        .mdenied {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            min-height: 100dvh;
            padding: ${o("manage-page-pad")};

            & .mdenied__panel {
                ${oe({})}
                display: flex;
                flex-direction: column;
                gap: ${p("md")};
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
                padding: ${p("sm")} ${p("md")};
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
                gap: ${p("md")};
                border-top: 1px solid ${o("border")};
                padding-top: ${p("md")};

                & .mdenied__who {
                    color: ${o("text-muted")};
                    font-size: 0.8rem;
                }

                & .mdenied__signout {
                    ${C()}
                    min-height: ${o("manage-touch-target")};
                    padding: 0 ${p("lg")};
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                }
            }
        }
    `;auth=this.inject(A);render(){return this.wire(un,{command:()=>`bun run grant:role grant ${this.auth.currentUser.get()?.username??"<username>"} super_admin`,who:()=>{const e=this.auth.currentUser.get();return e?`Signed in as ${e.username}`:""},signout:{onclick:()=>{this.auth.logout()}}})}}const fn=S(`
    <div class="mboot">
        <p class="mboot__line">Loading…</p>
    </div>
`),pn=S(`
    <div class="mboot">
        <h1 class="mboot__title">Cannot reach the server</h1>
        <p class="mboot__line">Tapscore Manage could not check what you are allowed to manage.</p>
        <button bind="retry" class="mboot__retry" type="button">Try again</button>
    </div>
`),Me=`
    .mboot {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: ${p("md")};
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
            ${C()}
            min-height: ${o("manage-touch-target")};
            padding: 0 ${p("lg")};
            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
        }
    }
`;class gn extends k{static styles=Me;render(){return this.wire(fn,{})}}class bn extends k{static styles=Me;roles=this.inject(O);auth=this.inject(A);render(){return this.wire(pn,{retry:{onclick:()=>{this.auth.load(),this.roles.load(!0)}}})}}const yn=S('<div bind="gate" class="mapp"></div>');class wn extends k{static styles=`
        .mapp { min-height: 100vh; min-height: 100dvh; }
    `;auth=this.inject(A);roles=this.inject(O);gate=new G(()=>this.auth.loading.get()?"loading":this.auth.currentUser.get()===null?this.auth.error.get()?"failed":"signed-out":this.roles.error.get()?"failed":this.roles.loaded.get()?I(this.roles).length>0?"ready":"denied":"loading");render(){const e=this.wire(yn,{});return this.track($(()=>{this.auth.currentUser.get()?this.roles.load():this.roles.clear()})),this.$swap(this.ref(e,"gate"),this.gate,{loading:gn,failed:bn,"signed-out":hn,denied:mn,ready:on}),e}}N.get(Ee);xt();N.set(A,new kt(Ie));const vn=N.get(A);await lt(wn,"#app",{hot:void 0,onInit:async()=>{await vn.load()}});export{ee as A,k as C,X as R,w as S,Ee as T,b as a,W as b,G as c,Xe as d,$ as e,Ye as n,M as r,S as t};
