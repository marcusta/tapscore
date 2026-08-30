(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();const Rs="modulepreload",zs=function(n){return"/tapscore/manage/"+n},ut={},Ds=function(e,t,s){let i=Promise.resolve();if(t&&t.length>0){let c=function(d){return Promise.all(d.map(h=>Promise.resolve(h).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),l=a?.nonce||a?.getAttribute("nonce");i=c(t.map(d=>{if(d=zs(d),d in ut)return;ut[d]=!0;const h=d.endsWith(".css"),p=h?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${p}`))return;const g=document.createElement("link");if(g.rel=h?"stylesheet":Rs,h||(g.as="script"),g.crossOrigin="",g.href=d,l&&g.setAttribute("nonce",l),document.head.appendChild(g),h)return new Promise((_,T)=>{g.addEventListener("load",_),g.addEventListener("error",()=>T(new Error(`Unable to preload CSS for ${d}`)))})}))}function o(a){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=a,window.dispatchEvent(l),!l.defaultPrevented)throw a}return i.then(a=>{for(const l of a||[])l.status==="rejected"&&o(l.reason);return e().catch(o)})},ne="/tapscore/manage/".replace(/\/+$/,""),Ke=ne+"/api",Hs=10,Ie=[];let Se=[],de=null;function Fs(n){Ie.push(n),Ie.length>Hs&&Ie.shift()}function ge(n,e,t){const s={code:n,message:e,url:typeof location<"u"?location.href:"",context:[...Ie],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),Se.push(s),Ms()}function Ms(){de||(de=setTimeout(jt,5e3))}function jt(){if(de&&(clearTimeout(de),de=null),Se.length===0)return;const n=Se;Se=[];for(const e of n){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${Ke}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${Ke}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&jt()});const W=0,mt=1,he=2,Ps=1e5;class js{constructor(){this.tracking=null,this.batchDepth=0,this.flushing=!1,this.queue=[]}subscribe(e){const t=this.tracking;t&&(e.subs.add(t),t.sources.set(e,e.version))}notify(e){for(const t of e)this.mark(t,he);this.batchDepth===0&&!this.flushing&&this.flush()}mark(e,t){if(e.disposed||e.state>=t)return;const s=e.state===W;if(e.state=t,!!s){if(e.run)this.queue.push(e);else if(e.subs)for(const i of e.subs)this.mark(i,mt)}}settle(e){if(e.state===mt){for(const[t,s]of e.sources)if(t.refresh?.(),t.version!==s){e.state=he;return}e.state=W}}runTracked(e,t){if(e.disposed)return;qt(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batchDepth++;try{e()}finally{this.batchDepth--,this.batchDepth===0&&!this.flushing&&this.flush()}}flush(){this.flushing=!0;let e=0;try{for(;this.queue.length;){if(++e>Ps)throw this.queue.length=0,new Error("[effect] flush did not converge: an effect keeps writing a signal it reads");const t=this.queue.shift();if(t.disposed){t.state=W;continue}try{if(this.settle(t),t.state!==he)continue;t.state=W,t.run()}catch(s){t.state=W,qs(s)}}}finally{this.flushing=!1}}}const H=new js;function qt(n){for(const e of n.sources.keys())e.subs.delete(n);n.sources.clear()}function qs(n){console.error("[effect] an effect threw",n);const e=n instanceof Error?n.message:String(n);ge("effect",e)}class m{constructor(e){this.src={subs:new Set,version:0},this.val=e}get(){return H.subscribe(this.src),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,this.src.version++,H.notify(this.src.subs))}update(e){this.set(e(this.val))}}class F{constructor(e){this.val=void 0;const t=this,s={state:he,sources:new Map,subs:new Set,version:0,refresh(){H.settle(s),s.state===he&&(H.runTracked(s,()=>{const i=e();Object.is(t.val,i)||(t.val=i,s.version++)}),s.state=W)}};this.node=s,s.refresh()}get(){return this.node.refresh(),H.subscribe(this.node),this.val}peek(){return this.node.refresh(),this.val}}function b(n){const e={state:W,sources:new Map,run(){H.runTracked(e,n)}};return H.runTracked(e,n),()=>{e.disposed=!0,qt(e)}}function te(n){H.batch(n)}function S(n){return H.untrack(n)}class Us{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const U=new Us,ce=ne;function We(n){return ce?n===ce?"/":n.startsWith(ce+"/")?n.slice(ce.length):n:n}function Bs(n){return ce+n}class B{constructor(){this.route=new m(We(location.pathname??"/")),this.search=new m(location.search??""),window.addEventListener("popstate",()=>te(()=>{this.route.set(We(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},i=e.indexOf("#"),o=i>=0?e.slice(i):"",a=i>=0?e.slice(0,i):e,l=a.indexOf("?"),c=l>=0?a.slice(0,l):a,d=l>=0?a.slice(l+1):"",h=s.query!==void 0?Ks(s.query):d?"?"+d:"",p=Bs(c)+h+o;(s.replace?history.replaceState:history.pushState).call(history,null,"",p),te(()=>{this.route.set(c),this.search.set(h)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:i=>{i.preventDefault(),this.navigate(e)},className:()=>{const i=this.route.get();return i===s||i.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new F(()=>{const s=this.route.get().split("/"),i={};for(const[o,a]of t.entries())a.startsWith(":")&&(i[a.slice(1)]=s[o]??"");return i})}query(e){return new F(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new F(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function Ks(n){const e=new URLSearchParams;for(const[s,i]of Object.entries(n))i==null||i===""||e.set(s,String(i));const t=e.toString();return t?"?"+t:""}const De={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","confirm-btn-min-height":"44px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},Ws=[["radius",["field-radius","btn-radius","radius-md"]],["border",["field-border","field-rule","btn-secondary-border","btn-disabled-border"]],["input-bg",["field-bg","field-bg-focus"]],["btn-bg",["btn-secondary-bg","btn-disabled-bg"]],["btn-hover",["btn-secondary-bg-hover"]],["primary",["btn-primary-bg","btn-primary-border","btn-primary-bg-hover","btn-primary-border-hover","field-focus-border"]],["primary-text",["btn-primary-fg","btn-primary-fg-hover"]],["hover-bg",["btn-ghost-bg-hover"]],["error",["field-invalid-border","field-invalid-rule"]],["shadow",["shadow-1"]],["shadow-elevated",["shadow-2","shadow-3"]]];function Gs(n,e){const t={};for(const[s,i]of Ws)if(s in n)for(const o of i)o in n||(t[o]=`var(--${s})`);return{...e,...t,...n}}const Ut=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],Vs={thin:"1px",medium:"3px",thick:"5px"};function Bt(n){const e=n.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":Vs[e.toLowerCase()]??e}function Ys(){return Ut.map(n=>{const e=Bt(De[n]);return`@property --${n}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const Kt={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Wt={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},Qs={...Wt,"done-opacity":"0.35"},Xs={...Kt,...Wt,...De,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},Js={...Kt,...Qs,...De,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};function Zs(n){return e=>n[e]}const en="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",pt="data-basics-global";function tn(){if(document.head.querySelector(`style[${pt}]`))return;const n=document.createElement("style");n.setAttribute(pt,""),n.textContent=Ys()+en,document.head.appendChild(n)}function sn(n,e){tn();const t=new Set(Ut),s=(o,a,l)=>{const c=Object.entries(o).map(([d,h])=>`--${d}:${t.has(d)?Bt(h):h}`).join(";");return`${a}{color-scheme:${l};${c}}`},i=document.createElement("style");return i.textContent=s(n,'[data-theme="light"]',"light")+s(e,'[data-theme="dark"]',"dark"),document.head.appendChild(i),o=>`var(--${o})`}const gt="basics-js-theme";class Gt{constructor(){this.dark=new m(!1);const e=localStorage.getItem(gt),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),b(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(gt,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function C(n){const e=document.createElement("template");return e.innerHTML=n,e}function nn(n,e){let t;for(const s of Object.keys(e))n.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const ft=new Set;class E{constructor(e={}){this.props=e,this.disposers=[],this.children=[],this.abortCtrl=null;const t=this.constructor;if(t.styles&&!ft.has(t)){ft.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return U.get(e)}get signal(){return this.abortCtrl||(this.abortCtrl=new AbortController),this.abortCtrl.signal}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}mix(e,...t){const s={track:i=>this.track(i),signal:this.signal};for(const i of t)i(e,s)}spawn(e,t,...s){const i=S(()=>{const o=new e(s[0]);return o.mount(t),o});return this.children.push(i),i}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){S(()=>{this.abortCtrl?.abort(),this.abortCtrl=null,this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,s){const i=s??(c=>this.track(c)),o=e.content.cloneNode(!0);let a=null;const l={track:i,get signal(){return a||(a=new AbortController,i(()=>a.abort())),a.signal}};for(const c of o.querySelectorAll("[bind]")){const d=t[c.getAttribute("bind")];if(d)if(typeof d=="function")i(b(()=>{const h=d();c instanceof HTMLInputElement||c instanceof HTMLTextAreaElement?c.value=String(h):c.textContent=String(h)}));else for(const[h,p]of Object.entries(d)){if(h==="mix"){for(const _ of p)_(c,l);continue}const g=h.includes("-");if(h.startsWith("on")&&typeof p=="function"){let _=null;i(()=>_?.abort()),c.addEventListener(h.slice(2),T=>{_?.abort(),_=new AbortController,p(T,_.signal)})}else typeof p=="function"?i(b(()=>{const _=p();g?c.setAttribute(h,String(_)):c[h]=_})):g?c.setAttribute(h,String(p)):c[h]=p}}return o}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const i=this.ref(t,e);return i?(typeof s=="string"?i.textContent=s:typeof s=="function"&&s.prototype instanceof E?this.spawn(s,i):typeof s=="function"&&s(i,{spawn:(o,a,...l)=>this.spawn(o,a,...l),track:o=>this.track(o)}),!0):!1}$each(e,t,s,i=(o,a)=>a){const o=typeof t=="function"?t:()=>t.get(),a=new Map,l=new Map;this.track(()=>{for(const c of l.values())c.forEach(d=>d());l.clear()}),this.track(b(()=>{const c=o(),d=new Map;for(const[p,g]of c.entries()){const _=i(g,p);if(a.has(_))d.set(_,a.get(_));else{const T=[];d.set(_,S(()=>s(g,p,L=>T.push(L)))),l.set(_,T)}}for(const[p,g]of a)d.has(p)||(g.remove(),S(()=>l.get(p)?.forEach(_=>_())),l.delete(p));let h=e.firstChild;for(const p of d.values())p===h?h=h.nextSibling:e.insertBefore(p,h);a.clear();for(const[p,g]of d)a.set(p,g)}))}$condition(e,t,s,i){let o=null;this.track(b(()=>{o&&(o.remove(),o=null);const a=t.get();o=S(()=>a?s():i?.()??null),o&&e.appendChild(o)}))}$swap(e,t,s,i){let o=null;this.track(b(()=>{if(o){const c=o;o=null,S(()=>c.destroy())}e.textContent="";const a=t.get(),l=s[a]??nn(a,s)??i;l&&(o=S(()=>{const c=new l;return c.mount(e),c}))})),this.track(()=>o?.destroy())}}const Le=new Set;function rn(n){return Le.add(n),()=>Le.delete(n)}function on(){for(const n of Array.from(Le)){Le.delete(n);try{n()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function an(n,e,t){const s=document.querySelector(e);s.textContent="";const i=U.get(B);let o=null,a=!1,l=null,c=!!t?.hot?.data.hmr;const d=async h=>{o&&(o.destroy(),o=null,s.textContent=""),h?(l||(l=(await Ds(()=>import("./obs-shell.component-BFY2GG7R.js"),[])).ObsShellComponent),o=S(()=>new l)):(!c&&t?.onInit&&(await t.onInit(),c=!0),o=S(()=>new n)),S(()=>o.mount(s)),a=h};await d(We(location.pathname).startsWith("/_obs")),b(()=>{const h=i.route.get().startsWith("/_obs");h!==a&&d(h)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{o?.destroy()}catch(h){console.error("[startApp] the root component threw while disposing",h)}if(o=null,on(),t.onDispose)try{t.onDispose()}catch(h){console.error("[startApp] onDispose threw",h)}}),t.hot.accept())}class O extends Error{constructor(e,t,s,i,o){super(t),this.status=e,this.details=s,this.traceId=i,this.detail=o,this.name="ApiError"}}const ln=3e4,cn=2,xe=new Map,Vt=new WeakMap;function Ge(n){if(n instanceof O)return n.traceId;if(n!=null&&typeof n=="object")return Vt.get(n)}async function v(n){if(n.method==="GET"){const e=xe.get(n.url);if(e)return e;const t=bt(n,cn);return xe.set(n.url,t),t.then(()=>xe.delete(n.url),()=>xe.delete(n.url)),t}return bt(n,0)}async function bt(n,e){const t=n.timeout??ln;let s;for(let i=0;i<=e;i++){const o=crypto.randomUUID();try{return await hn(dn(n,o),t)}catch(a){if(s=a,!(a instanceof O)&&a!=null&&typeof a=="object"&&Vt.set(a,o),a instanceof O||i===e)break;await new Promise(l=>setTimeout(l,1e3*2**i))}}throw s}async function dn(n,e){const t={"X-Trace-Id":e},s={method:n.method,headers:t};n.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(n.body));const i=await fetch(n.url,s),o=i.headers.get("x-trace-id")??e;if(Fs({type:"api",detail:`${n.method} ${n.url}`,timestamp:new Date().toISOString()}),!i.ok){const a=await i.json().catch(()=>({error:i.statusText}));throw new O(i.status,a.error??i.statusText,a.details,o,a.detail)}return i.json()}function hn(n,e){let t;const s=new Promise((i,o)=>{t=setTimeout(()=>o(new Error("Request timeout")),e)});return Promise.race([n,s]).finally(()=>clearTimeout(t))}const Ve=new Set;let Fe=!1;function un(n){return Ve.add(n),()=>{Ve.delete(n)}}function it(){if(!Fe){Fe=!0;try{for(const n of[...Ve])try{n()}catch(e){try{ge("session-listener",mn(e))}catch{}}}finally{Fe=!1}}}function mn(n){try{if(n instanceof Error){const e=n.message;if(typeof e=="string")return e}return String(n)}catch{return"listener threw a value that could not be described"}}async function ke(n,e,t,s={}){te(()=>{n.set(!0),e.set(null)});try{const i=await t();return n.set(!1),i}catch(i){const o=pn(i);te(()=>{n.set(!1),e.set(o)}),ge(o.code,o.message,Ge(i)),o.code==="auth"&&s.sessionExpiry!==!1&&it();return}}function pn(n){return n instanceof O?n.status===401?{code:"auth",message:"Unauthorized"}:n.status===409?{code:"conflict",message:"Data has changed — please try again"}:n.status===400?{code:"validation",message:n.message}:n.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:n instanceof Error?n.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const Me={sessionExpiry:!1};function gn(n){return{me:()=>v({method:"GET",url:`${n}/auth/me`}),login:e=>v({method:"POST",url:`${n}/auth/login`,body:e}),logout:()=>v({method:"POST",url:`${n}/auth/logout`,body:{}}),logoutAll:()=>v({method:"POST",url:`${n}/auth/logout-all`,body:{}})}}class K{constructor(){this.api=gn(Ke),this.currentUser=new m(null),this.loading=new m(!1),this.error=new m(null),this.offSessionExpired=un(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=rn(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await ke(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await ke(this.loading,this.error,()=>this.api.login({username:e,password:t}),Me);return s?(this.currentUser.set(s),!0):!1}async logout(){await ke(this.loading,this.error,()=>this.api.logout(),Me);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}async logoutEverywhere(){const e=await ke(this.loading,this.error,()=>this.api.logoutAll(),Me),t=this.error.get();return(!t||t.code==="auth")&&this.currentUser.set(null),e?.revoked??null}}const Yt={radius:"12px","radius-pill":"999px","radius-sm":"6px","font-display":"'Fraunces', Georgia, serif",shadow:"0 1px 2px rgba(30, 53, 38, 0.08)","shadow-elevated":"0 4px 16px rgba(30, 53, 38, 0.14)"},fn={...Yt,bg:"#f2eee2",surface:"#fbf9f1","surface-sunken":"#e9e4d4","surface-2":"#e9e4d4",primary:"#2c5e3f","primary-text":"#f7f4ea","btn-bg":"#fbf9f1","btn-hover":"#efeada",text:"#1e3526","text-muted":"#6b7a6e",border:"#d8d2bf","border-strong":"#b3ab92","topbar-bg":"#1e3526","active-bg":"#1e3526","active-text":"#f7f4ea","hover-bg":"#ece7d7","input-bg":"#ffffff",accent:"#b08d3e","accent-soft":"#f0e6cd","accent-strong":"#2c5e3f","on-accent":"#f7f4ea",danger:"#a0463c","danger-strong":"#7f352d","on-danger":"#f7f4ea",error:"#a0463c","under-par":"#a0463c","over-par":"#345b8a","hole-bar":"#e6a23f","hole-bar-text":"#3a2a0d"},bn={...Yt,bg:"#15231a",surface:"#1d2f22","surface-sunken":"#101b14","surface-2":"#101b14",primary:"#5d9b75","primary-text":"#0f1a13","btn-bg":"#24392b","btn-hover":"#2e4836",text:"#e6e1d2","text-muted":"#8da093",border:"#33493a","border-strong":"#4d6653","topbar-bg":"#0f1a13","active-bg":"#5d9b75","active-text":"#0f1a13","hover-bg":"#273c2e","input-bg":"#101b14",accent:"#cfa84f","accent-soft":"#3a3320","accent-strong":"#5d9b75","on-accent":"#0f1a13",danger:"#d48a82","danger-strong":"#e0a49d","on-danger":"#15231a",error:"#d48a82","under-par":"#d48a82","over-par":"#8db2e0","hole-bar":"#c08a35","hole-bar-text":"#160f04",shadow:"0 1px 2px rgba(0, 0, 0, 0.3)","shadow-elevated":"0 4px 16px rgba(0, 0, 0, 0.4)"};function Qt(n,e={}){const t=n==="light"?fn:bn,s=n==="light"?Xs:Js;return Gs({...t,...e},s)}const Xt={"manage-page-pad":"var(--space-4)","manage-page-pad-wide":"var(--space-6)","manage-stack-gap":"var(--space-3)","manage-section-gap":"var(--space-5)","manage-touch-target":"44px","manage-table-bg":"var(--surface)","manage-table-radius":"var(--radius)","manage-table-border":"var(--border)","manage-table-header-bg":"var(--surface-sunken)","manage-table-header-fg":"var(--text-muted)","manage-table-header-border":"var(--border-strong)","manage-table-header-pad-y":"var(--space-2)","manage-table-header-pad-x":"var(--space-3)","manage-table-cell-pad-y":"var(--space-3)","manage-table-cell-pad-x":"var(--space-3)","manage-table-row-border":"var(--border)","manage-table-row-hover-bg":"var(--hover-bg)","manage-table-row-editing-bg":"var(--accent-soft)","manage-table-card-gap":"var(--space-2)","btn-danger-bg":"transparent","btn-danger-fg":"var(--danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger)","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger)","manage-sidebar-width":"232px","manage-content-max":"1120px"},Jt=n=>({"manage-chrome-bg":"var(--topbar-bg)","manage-chrome-fg":n,"manage-chrome-fg-muted":"color-mix(in srgb, var(--manage-chrome-fg) 66%, transparent)","manage-chrome-border":"color-mix(in srgb, var(--manage-chrome-fg) 14%, transparent)","manage-chrome-hover-bg":"color-mix(in srgb, var(--manage-chrome-fg) 9%, transparent)","manage-chrome-active-bg":"color-mix(in srgb, var(--manage-chrome-fg) 16%, transparent)","manage-scrim":"color-mix(in srgb, var(--topbar-bg) 62%, transparent)"}),Zt=Qt("light",{...Xt,...Jt("var(--primary-text)")}),es=Qt("dark",{...Xt,...Jt("var(--text)")}),r=sn(Zt,es);function _n(){const n=document.querySelector('meta[name="theme-color"]');if(!n)return;const e=U.get(Gt);b(()=>{const s=(e.dark.get()?es:Zt)["topbar-bg"];s&&n.setAttribute("content",s)})}class yn extends K{constructor(e){super(),this.client=e}client;async login(e,t){this.loading.set(!0);try{return this.currentUser.set(await this.client.login(e,t)),this.error.set(null),!0}catch{return this.error.set({message:"Sign-in failed.",code:"auth"}),!1}finally{this.loading.set(!1)}}async load(){this.loading.set(!0);try{this.currentUser.set(await this.client.me()),this.error.set(null)}catch(e){e instanceof O&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logout(){this.loading.set(!0);try{await this.client.logout(),this.currentUser.set(null),this.error.set(null)}catch(e){e instanceof O&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"})}finally{this.loading.set(!1)}}async logoutEverywhere(){this.loading.set(!0);try{const e=await this.client.logoutAll();return this.currentUser.set(null),this.error.set(null),e.revoked}catch(e){return e instanceof O&&e.status===401?(this.currentUser.set(null),this.error.set(null)):this.error.set({message:"Cannot reach the server.",code:"network"}),null}finally{this.loading.set(!1)}}}function wn(n){return{login:(e,t)=>v({method:"POST",url:`${n}/auth/login`,body:{username:e,password:t}}),me:()=>v({method:"GET",url:`${n}/auth/me`}),logout:()=>v({method:"POST",url:`${n}/auth/logout`,body:{}}),logoutAll:()=>v({method:"POST",url:`${n}/auth/logout-all`,body:{}})}}const J="/tapscore/manage/".replace(/\/+$/,"").replace(/\/manage$/,"")+"/api",ts=wn(J);function vn(n){return{async list(){return v({method:"GET",url:`${n}/clubs`})},async get(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const s=t.toString();return v({method:"GET",url:`${n}/clubs/get${s?"?"+s:""}`})},async create(e){return v({method:"POST",url:`${n}/clubs`,body:e})},async update(e){return v({method:"POST",url:`${n}/clubs/update`,body:e})},async remove(e){return v({method:"DELETE",url:`${n}/clubs/${e.id}`})}}}function $n(n){return{async list(){return v({method:"GET",url:`${n}/courses`})},async listByClub(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const s=t.toString();return v({method:"GET",url:`${n}/courses/by-club${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const s=t.toString();return v({method:"GET",url:`${n}/courses/get${s?"?"+s:""}`})},async teeRoleCatalog(){return v({method:"GET",url:`${n}/courses/tee-roles/catalog`})},async teeRoles(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const s=t.toString();return v({method:"GET",url:`${n}/courses/tee-roles${s?"?"+s:""}`})},async create(e){return v({method:"POST",url:`${n}/courses`,body:e})},async update(e){return v({method:"POST",url:`${n}/courses/update`,body:e})},async updateHole(e){return v({method:"POST",url:`${n}/courses/holes/update`,body:e})},async setTeeRole(e){return v({method:"POST",url:`${n}/courses/tee-roles`,body:e})},async clearTeeRole(e){return v({method:"DELETE",url:`${n}/courses/tee-roles/${e.courseId}/${e.roleKey}/${e.gender}`})},async validate(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const s=t.toString();return v({method:"GET",url:`${n}/courses/validate${s?"?"+s:""}`})},async remove(e){return v({method:"DELETE",url:`${n}/courses/${e.id}`})}}}function xn(n){return{async listByCourse(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const s=t.toString();return v({method:"GET",url:`${n}/tees/by-course${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const s=t.toString();return v({method:"GET",url:`${n}/tees/get${s?"?"+s:""}`})},async create(e){return v({method:"POST",url:`${n}/tees`,body:e})},async update(e){return v({method:"POST",url:`${n}/tees/update`,body:e})},async remove(e){return v({method:"DELETE",url:`${n}/tees/${e.id}`})}}}function kn(n){return{async listByCourse(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const s=t.toString();return v({method:"GET",url:`${n}/course-route-templates${s?"?"+s:""}`})},async get(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const s=t.toString();return v({method:"GET",url:`${n}/course-route-templates/get${s?"?"+s:""}`})},async validate(e){return v({method:"POST",url:`${n}/course-route-templates/validate`,body:e})},async create(e){return v({method:"POST",url:`${n}/course-route-templates`,body:e})},async update(e){return v({method:"POST",url:`${n}/course-route-templates/update`,body:e})},async remove(e){return v({method:"DELETE",url:`${n}/course-route-templates/${e.id}`})}}}function En(n){return{async myRoles(){return v({method:"GET",url:`${n}/me/roles`})},async adminStats(){return v({method:"GET",url:`${n}/admin/stats`})},async adminRounds(e){const t=new URLSearchParams;for(const[i,o]of Object.entries(e))o!==void 0&&t.set(i,String(o));const s=t.toString();return v({method:"GET",url:`${n}/admin/rounds${s?"?"+s:""}`})},async adminPlayers(){return v({method:"GET",url:`${n}/admin/players`})},async adminGrantRole(e){return v({method:"POST",url:`${n}/admin/roles/grant`,body:e})},async adminRevokeRole(e){return v({method:"POST",url:`${n}/admin/roles/revoke`,body:e})}}}const I={clubs:vn(J),courses:$n(J),tees:xn(J),courseRouteTemplates:kn(J),admin:En(J)};class ie{roles=new m([]);loaded=new m(!1);error=new m(null);inflight=null;isSuperAdmin(){return this.has("super_admin")}canManageCourses(){return this.isSuperAdmin()||this.has("course_admin")}has(e){return this.roles.get().some(t=>t.role===e&&t.scopeType===null)}load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.error.set(null);try{this.roles.set(await I.admin.myRoles())}catch(t){this.roles.set([]),t instanceof O&&t.status===401?it():(this.error.set("Cannot reach the server."),this.inflight=null)}finally{this.loaded.set(!0)}})(),this.inflight)}clear(){this.roles.set([]),this.loaded.set(!1),this.error.set(null),this.inflight=null}}const ct=class ct extends E{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(b(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};ct.styles=`
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
    `;let Ye=ct;const $=n=>`var(--${n})`,y=(n,e)=>`var(--${n}, ${e})`,w=n=>{const e=De[n];if(e===void 0)throw new Error(`unknown control token: --${n}`);return e},Cn=n=>y(n,w(n)),u=Zs({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),Ee=n=>`
    background: ${y(`btn-${n}-bg`,w(`btn-${n}-bg`))};
    color: ${y(`btn-${n}-fg`,w(`btn-${n}-fg`))};
    border-color: ${y(`btn-${n}-border`,w(`btn-${n}-border`))};
    box-shadow: ${y(`btn-${n}-shadow`,w(`btn-${n}-shadow`))};
    &:hover {
        background: ${y(`btn-${n}-bg-hover`,w(`btn-${n}-bg-hover`))};
        color: ${y(`btn-${n}-fg-hover`,w(`btn-${n}-fg-hover`))};
        border-color: ${y(`btn-${n}-border-hover`,w(`btn-${n}-border-hover`))};
    }`,ss=`
    background: ${y("btn-disabled-bg",w("btn-disabled-bg"))};
    color: ${y("btn-disabled-fg",w("btn-disabled-fg"))};
    border-color: ${y("btn-disabled-border",w("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${y("btn-disabled-opacity",w("btn-disabled-opacity"))};
    cursor: not-allowed;`,Tn={primary:Ee("primary"),secondary:Ee("secondary"),ghost:Ee("ghost"),danger:Ee("danger"),disabled:ss},k=(n=y("btn-radius",w("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${y("btn-border-width",w("btn-border-width"))} solid transparent;
    border-radius: ${n};
    padding: ${y("btn-padding-y",w("btn-padding-y"))} ${y("btn-padding-x",w("btn-padding-x"))};
    font-family: ${$("font-ui")};
    font-size: ${y("btn-font-size",w("btn-font-size"))};
    line-height: ${y("btn-line-height",w("btn-line-height"))};
    font-weight: ${y("btn-font-weight",w("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${$("dur-fast")} ${$("ease-standard")},
        border-color ${$("dur-fast")} ${$("ease-standard")},
        color ${$("dur-fast")} ${$("ease-standard")},
        box-shadow ${$("dur-fast")} ${$("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${y("btn-focus-ring-width",w("btn-focus-ring-width"))} ${y("btn-focus-ring",w("btn-focus-ring"))};
    }
    ${Tn[e]}
    &:disabled {${ss}}
`,Nn=`max(${y("field-border-width",w("field-border-width"))}, ${y("field-rule-width",w("field-rule-width"))})`,Ce=(n,e)=>`
    border-top-color: ${n};
    border-right-color: ${n};
    border-left-color: ${n};
    border-bottom-color: ${e};`,ns=()=>`
    border-style: solid;
    border-top-width: ${y("field-border-width",w("field-border-width"))};
    border-right-width: ${y("field-border-width",w("field-border-width"))};
    border-left-width: ${y("field-border-width",w("field-border-width"))};
    border-bottom-width: ${Nn};
    ${Ce(y("field-border",w("field-border")),y("field-rule",w("field-rule")))}
    border-radius: ${y("field-radius",w("field-radius"))};
    padding: ${y("field-padding-y",w("field-padding-y"))} ${y("field-padding-x",w("field-padding-x"))};
    background: ${y("field-bg",w("field-bg"))};
    color: ${$("text")};
    font-family: ${$("font-ui")};
    font-size: ${y("field-font-size",w("field-font-size"))};
    line-height: ${y("field-line-height",w("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${$("dur-fast")} ${$("ease-standard")},
        box-shadow ${$("dur-fast")} ${$("ease-standard")},
        background ${$("dur-fast")} ${$("ease-standard")};
    &::placeholder { color: ${$("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${Ce(y("field-focus-border",w("field-focus-border")),y("field-focus-border",w("field-focus-border")))}
        background: ${y("field-bg-focus",w("field-bg-focus"))};
        box-shadow: 0 0 0 ${y("field-focus-ring-width",w("field-focus-ring-width"))} ${y("field-focus-ring",w("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${Ce(y("field-invalid-border",w("field-invalid-border")),y("field-invalid-rule",w("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${Ce(y("field-invalid-border",w("field-invalid-border")),y("field-invalid-rule",w("field-invalid-rule")))}
        background: ${y("field-bg-focus",w("field-bg-focus"))};
        box-shadow: 0 0 0 ${y("field-focus-ring-width",w("field-focus-ring-width"))} ${y("field-invalid-ring",w("field-invalid-ring"))};
    }
`,is=()=>`
    display: block;
    font-family: ${$("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${$("text-muted")};
`,In=()=>`
    display: block;
    font-family: ${$("font-ui")};
    font-size: 13px;
    line-height: 20px;
    color: ${$("danger")};
`,M=n=>`
    background: ${$("surface")};
    border: 1px solid ${$("border")};
    border-radius: ${$("radius-md")};
    box-shadow: ${$("shadow-1")};
    ${n?.hover?`
    transition:
        box-shadow ${$("dur-base")} ${$("ease-standard")},
        border-color ${$("dur-base")} ${$("ease-standard")};
    &:hover { box-shadow: ${$("shadow-2")}; }`:""}
    & .ui-card__eyebrow {
        ${is()}
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
`,x=n=>`var(--${n})`;let Sn=0;const dt=class dt extends E{constructor(){super(...arguments),this.returnFocusTo=null,this.wasOpen=!1}render(){const e=document.createElement("div"),t=(d,h)=>{typeof h=="function"?this.track(b(()=>{d.textContent=h()})):d.textContent=h};this.spawn(Ye,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200",this.dialogEl.setAttribute("role","dialog"),this.dialogEl.setAttribute("aria-modal","true"),this.dialogEl.setAttribute("tabindex","-1");const s=`ui-confirm-${++Sn}`,i=document.createElement("h2");i.className="ui-confirm__title",i.id=`${s}-title`,t(i,this.props.title??"Confirm"),this.dialogEl.setAttribute("aria-labelledby",i.id),this.dialogEl.appendChild(i);const o=document.createElement("p");o.className="ui-confirm__message",o.id=`${s}-message`,t(o,this.props.message),this.dialogEl.setAttribute("aria-describedby",o.id),this.dialogEl.appendChild(o);const a=document.createElement("div");a.className="ui-confirm__actions";const l=document.createElement("button");l.className="ui-confirm__btn ui-confirm__btn--cancel",t(l,this.props.cancelLabel??"Cancel"),l.addEventListener("click",d=>{d.stopPropagation(),this.handleCancel()}),a.appendChild(l),this.cancelEl=l;const c=document.createElement("button");return c.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(c,this.props.confirmLabel??"Confirm"),c.addEventListener("click",d=>{d.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),a.appendChild(c),this.confirmEl=c,this.dialogEl.appendChild(a),this.dialogEl.addEventListener("click",d=>d.stopPropagation()),this.dialogEl.addEventListener("keydown",d=>this.onKeydown(d)),e.appendChild(this.dialogEl),this.track(b(()=>{const d=this.props.open.get();d&&this.dialogEl.removeAttribute("inert"),this.dialogEl.classList.toggle("open",d),d||this.dialogEl.setAttribute("inert",""),d!==this.wasOpen&&(this.wasOpen=d,d?this.captureFocus():this.restoreFocus())})),e}onMount(){this.props.open.get()&&!this.dialogEl.contains(document.activeElement)&&this.captureFocus()}captureFocus(){const e=document.activeElement;this.returnFocusTo=e instanceof HTMLElement?e:null,this.cancelEl.focus()}restoreFocus(){const e=this.returnFocusTo;this.returnFocusTo=null,e&&e.isConnected&&e.focus()}onKeydown(e){if(!this.props.open.get())return;if(e.key==="Escape"){e.preventDefault(),e.stopPropagation(),this.handleCancel();return}if(e.key!=="Tab")return;const t=this.cancelEl,s=this.confirmEl,i=document.activeElement;e.shiftKey&&(i===t||i===this.dialogEl)?(e.preventDefault(),s.focus()):!e.shiftKey&&i===s&&(e.preventDefault(),t.focus())}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}onDestroy(){this.wasOpen&&this.restoreFocus()}};dt.styles=`
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
            min-height: ${Cn("confirm-btn-min-height")};
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
    `;let X=dt;class be{crumbs=new m([]);set(e){this.crumbs.set(e)}}function Ln(n,e){return`${e}:${n.label}:${n.path??""}`}const N=n=>`var(--${n})`,ht=class ht extends E{render(){const e=document.createElement("div");e.className="ui-empty-state";const t=a=>typeof a=="function"?a():a,s=(a,l)=>{typeof l=="function"?this.track(b(()=>{a.textContent=t(l)})):a.textContent=l};if(this.props.ornament!==!1){const a=document.createElement("div");a.className="ui-empty-state__ornament",a.setAttribute("aria-hidden","true"),e.appendChild(a)}const i=document.createElement(`h${this.props.headingLevel??3}`);if(i.className="ui-empty-state__heading",s(i,this.props.heading),e.appendChild(i),this.props.body!==void 0){const a=document.createElement("p");a.className="ui-empty-state__body",s(a,this.props.body),e.appendChild(a)}const o=this.props.action;if(o){const a=document.createElement("button");a.className="ui-empty-state__action",a.setAttribute("type","button"),o.ariaLabel&&a.setAttribute("aria-label",o.ariaLabel),s(a,o.label),a.addEventListener("click",()=>o.onclick()),e.appendChild(a)}return e}};ht.styles=`
        .ui-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: ${N("space-3")};
            padding: ${N("space-7")} ${N("space-5")};
        }
        /* The brass ornament: a hairline rule, nothing more. No illustration. */
        .ui-empty-state__ornament {
            width: ${N("space-8")};
            height: 1px;
            background: ${N("brass-line")};
            margin-bottom: ${N("space-2")};
        }
        .ui-empty-state__heading {
            margin: 0;
            font-family: ${N("font-display")};
            font-weight: 500;
            font-size: 1.25rem;
            line-height: 1.4;
            color: ${N("text")};
        }
        .ui-empty-state__body {
            margin: 0;
            max-width: 48ch;
            font-family: ${N("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.6;
            color: ${N("text-muted")};
        }
        .ui-empty-state__action {
            margin-top: ${N("space-2")};
            padding: ${N("space-2")} ${N("space-4")};
            border: 1px solid ${N("accent")};
            border-radius: ${N("radius-sm")};
            background: ${N("accent")};
            color: ${N("on-accent")};
            font-family: ${N("font-ui")};
            font-size: 0.875rem;
            font-weight: 600;
            line-height: 1.5;
            cursor: pointer;
            transition: background ${N("dur-fast")} ${N("ease-standard")},
                        border-color ${N("dur-fast")} ${N("ease-standard")};
        }
        .ui-empty-state__action:hover {
            background: ${N("accent-strong")};
            border-color: ${N("accent-strong")};
        }
        .ui-empty-state__action:focus-visible {
            outline: 2px solid ${N("accent")};
            outline-offset: 2px;
        }
    `;let Qe=ht;const An=900,On=`(min-width: ${An}px)`,rs=660,os=`(min-width: ${rs}px)`,as=`(max-width: ${rs-.02}px)`;function Rn(n){const e=new m(!1),t=typeof globalThis.matchMedia=="function"?globalThis.matchMedia(n):null;if(!t)return{value:e,dispose:()=>{}};e.set(t.matches);const s=i=>e.set(i.matches);return t.addEventListener("change",s),{value:e,dispose:()=>t.removeEventListener("change",s)}}const _t="__actions";function q(n,e={}){const t=document.createElement("button");return t.type="button",t.className=e.variant==="primary"?"mtable__btn mtable__btn--primary":"mtable__btn",t.textContent=n,e.onclick&&t.addEventListener("click",e.onclick),t}function zn(n){return typeof n=="object"&&n!==null&&typeof n.get=="function"}function yt(n,e,t){if(n.textContent="",e instanceof HTMLElement){n.appendChild(e);return}if(e==null||e===""){const s=document.createElement("span");s.className="mtable__empty-cell",s.textContent=t,n.appendChild(s);return}n.appendChild(document.createTextNode(String(e)))}class re extends E{static styles=`
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
    `;static seq=0;uid=`mtable-${re.seq++}`;rowData=new Map;render(){const e=document.createElement("div");e.className="mtable-wrap";const t=document.createElement("table");t.className="mtable",t.setAttribute("role","table");const s=document.createElement("caption");s.className=this.props.captionHidden?"mtable__caption mtable__caption--hidden":"mtable__caption",s.id=`${this.uid}-caption`,s.textContent=this.props.caption,t.appendChild(s),t.setAttribute("aria-labelledby",s.id),t.appendChild(this.head());const i=document.createElement("tbody");if(i.className="mtable__body",i.setAttribute("role","rowgroup"),t.appendChild(i),e.appendChild(t),this.$each(i,()=>this.readRows(),(o,a,l)=>this.renderRow(o,l),o=>this.props.rowKey(o)),this.props.empty){const o=document.createElement("div");o.className="mtable__empty",this.spawn(Qe,o,this.props.empty),e.appendChild(o),this.track(b(()=>{const a=this.rowsValue().length===0;o.hidden=!a,t.hidden=a}))}return this.layout(e),e}layout(e){let t=this.props.narrow;if(!t){const i=Rn(as);this.track(i.dispose),t=i.value}const s=this.props.stacked!==!1;this.track(b(()=>{e.setAttribute("data-layout",s&&t.get()?"stacked":"columns")}))}head(){const e=document.createElement("thead");e.className="mtable__head",e.setAttribute("role","rowgroup");const t=document.createElement("tr");t.className="mtable__tr",t.setAttribute("role","row");for(const s of this.props.columns)t.appendChild(this.th(s.key,s.header));return this.hasActionsColumn()&&t.appendChild(this.th(_t,this.props.actionsHeader??"Actions",!0)),e.appendChild(t),e}th(e,t,s=!1){const i=document.createElement("th");if(i.className="mtable__th",i.setAttribute("role","columnheader"),i.setAttribute("scope","col"),i.setAttribute("data-key",e),s){const o=document.createElement("span");o.className="mtable__th-label--hidden",o.textContent=t,i.appendChild(o)}else i.textContent=t;return i}hasActionsColumn(){return this.props.actions!==void 0||this.props.edit!==void 0}rowsValue(){return zn(this.props.rows)?this.props.rows.get():this.props.rows}readRows(){const e=this.rowsValue();return S(()=>{const t=new Set;for(const s of e){const i=this.props.rowKey(s);t.add(i);const o=this.rowData.get(i);o?o.set(s):this.rowData.set(i,new m(s))}for(const s of[...this.rowData.keys()])t.has(s)||this.rowData.delete(s)}),e}signalFor(e){const t=this.props.rowKey(e);let s=this.rowData.get(t);return s||(s=new m(e),this.rowData.set(t,s)),s}renderRow(e,t){const s=this.props.rowKey(e),i={key:s},o=this.signalFor(e),a=this.props.edit,l=this.props.emptyCell??"—",c=()=>a?a.controller.key.get()===s:!1,d=document.createElement("tr");d.className="mtable__tr",d.setAttribute("role","row"),d.setAttribute("data-row-key",s);for(const h of this.props.columns){const p=document.createElement("td");if(p.className=`mtable__td mtable__td--${h.type??"text"}`,p.setAttribute("role","cell"),p.setAttribute("data-key",h.key),h.stackedLabel!==!1){const _=document.createElement("span");_.className="mtable__stacked-label",_.setAttribute("aria-hidden","true"),_.textContent=h.header,p.appendChild(_)}const g=document.createElement("div");g.className="mtable__cell",p.appendChild(g),t(b(()=>{if(c()&&h.editCell){const _=o.peek();yt(g,S(()=>h.editCell(_,i)),l)}else{const _=o.get();yt(g,S(()=>h.cell(_,i)),l)}})),d.appendChild(p)}return this.hasActionsColumn()&&d.appendChild(this.actionsCell(i,o,c,t)),a&&(t(b(()=>{d.classList.toggle("mtable__tr--editing",c())})),t(b(()=>{a.controller.isSaving(s)?d.setAttribute("aria-busy","true"):d.removeAttribute("aria-busy")})),this.editKeys(d,s,o,t),a.autoFocus!==!1&&this.autoFocus(d,c,t)),d}actionsCell(e,t,s,i){const o=this.props.edit,a=document.createElement("td");a.className="mtable__td mtable__td--actions",a.setAttribute("role","cell"),a.setAttribute("data-key",_t);const l=document.createElement("div");l.className="mtable__actions",a.appendChild(l);let c=null,d=null;if(o){c=q(o.saveLabel??"Save",{variant:"primary",onclick:()=>o.oncommit(t.peek())}),d=q(o.cancelLabel??"Cancel",{onclick:()=>{o.controller.cancel(),o.oncancel?.(t.peek())}}),i(b(()=>{const p=o.controller.isSaving(e.key);c.disabled=p,d.disabled=p}));const h=document.createElement("p");h.className="mtable__status",h.setAttribute("role","status"),h.setAttribute("aria-live","polite"),(o.statusHost??a).appendChild(h),i(()=>h.remove()),i(b(()=>{const p=o.controller.errorFor(e.key),g=o.controller.isSaving(e.key);h.textContent=p??(g?o.savingLabel??"Saving…":""),h.className=p?"mtable__status mtable__status--error":"mtable__status",h.hidden=!p&&!g,p&&typeof h.scrollIntoView=="function"&&h.scrollIntoView({block:"nearest"})}))}return i(b(()=>{if(s()&&o){l.textContent="",l.append(c,d);return}const h=t.get(),p=S(()=>this.props.actions?.(h,e));l.textContent="",Array.isArray(p)?l.append(...p):p instanceof HTMLElement?l.appendChild(p):p!=null&&p!==""&&l.appendChild(document.createTextNode(String(p)))})),a}editKeys(e,t,s,i){const o=this.props.edit,a=l=>{if(o.controller.key.peek()===t){if(l.key==="Enter"){if(l.target?.tagName==="TEXTAREA"||(l.preventDefault(),o.controller.phase.peek()==="saving"))return;o.oncommit(s.peek());return}l.key==="Escape"&&(l.preventDefault(),l.stopPropagation(),o.controller.cancel(),o.oncancel?.(s.peek()))}};e.addEventListener("keydown",a),i(()=>e.removeEventListener("keydown",a))}autoFocus(e,t,s){let i=!1,o=!0;s(()=>{o=!1}),s(b(()=>{const a=t();a&&!i&&queueMicrotask(()=>{if(!o||!t())return;const l=e.querySelector('input:not([type="hidden"]), select, textarea');l&&(l.focus(),l instanceof HTMLInputElement&&typeof l.select=="function"&&l.select())}),i=a}))}}function _e(n){return{open:n.open,title:n.title,message:n.consequence,confirmLabel:n.confirmLabel,cancelLabel:n.cancelLabel??"Cancel",danger:!0,onconfirm:n.onconfirm,oncancel:n.oncancel}}function oe(n,e){const t=s=>{s.key!=="Escape"||!n.get()||(n.set(!1),e?.())};return document.addEventListener("keydown",t),()=>document.removeEventListener("keydown",t)}const Ae=()=>`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${r("manage-stack-gap")} ${u("lg")};
    align-items: start;

    & .mform__field--full {
        grid-column: 1 / -1;
    }

    @media ${os} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
`,ye=()=>`
    display: flex;
    flex-direction: column;
    gap: ${u("xs")};
    min-width: 0;
`,we=()=>`
    ${is()}
`,ae=()=>`
    ${ns()}
    width: 100%;
    min-height: ${r("manage-touch-target")};
`,se=()=>`
    color: ${r("text-muted")};
    font-size: 0.8rem;
    line-height: 1.4;
`,ue=()=>`
    ${In()}
`,ls=()=>`
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
`,Dn=()=>`
    overflow-x: auto;
    background: ${r("manage-table-bg")};
    border: 1px solid ${r("manage-table-border")};
    border-radius: ${r("manage-table-radius")};
    /* Momentum scrolling on touch, and a scrollbar that does not eat a row. */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
`,Hn="You no longer have permission to change the course catalog. Ask an administrator to grant you the course_admin role.";function R(n,e){if(!(n instanceof O))return ge(Fn(n),Mn(n),Ge(n)),e;if(n.status===401)return it(),"Your session expired. Sign in again to continue.";if(n.status===403)return Hn;if(n.status>=400&&n.status<500){if(!n.details?.length)return n.message;const t=n.details.map(s=>`${s.path.replace(/^\//,"")} — ${s.message}`).join("; ");return`${n.message}: ${t}`}return ge("server",`${n.status} ${n.message}`,Ge(n)),e}function Fn(n){return n instanceof Error?n.message==="Request timeout"?"timeout":"network":"unknown"}function Mn(n){return n instanceof Error?n.message:String(n)}function cs(){return{name:"",location:"",logoUrl:""}}function Pn(n){return{name:n.name,location:n.location??"",logoUrl:n.logoUrl??""}}function ds(n){const e={};n.name.trim()===""&&(e.name="A club needs a name. Enter one before saving.");const t=n.logoUrl.trim();return t!==""&&!jn(t)&&(e.logoUrl="Enter a full web address starting with https://, or leave this empty."),e}function hs(n){return Object.keys(n).length>0}function wt(n){return{name:n.name.trim(),location:n.location.trim()||null,logoUrl:n.logoUrl.trim()||null}}function us(n,e){const t=e===0?"It has no courses.":e===1?"It has 1 course.":`It has ${e} courses.`;return`${n} leaves the catalog. ${t} Rounds already played keep their own copy of the course data, so no scorecard changes.`}const ms="The club is removed from the catalog.";function jn(n){try{const e=new URL(n);return e.protocol==="http:"||e.protocol==="https:"}catch{return!1}}function qn(n,e){const t=e.trim().toLowerCase().split(/\s+/).filter(s=>s!=="");return t.length===0?n:n.filter(s=>{const i=`${s.name} ${s.location??""}`.toLowerCase();return t.every(o=>i.includes(o))})}class He{clubs=new m([]);loading=new m(!1);error=new m(null);loaded=new m(!1);query=new m("");visible=new F(()=>qn(this.clubs.get(),this.query.get()));inflight=null;load(e=!1){return!e&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{this.clubs.set(await I.clubs.list())}catch(t){this.error.set(R(t,"Could not load the clubs. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.clubs.get().find(t=>t.id===e)??null}async create(e){return this.write(()=>I.clubs.create(wt(e)),"Could not create the club. Check your connection and try again.")}async update(e,t){return this.write(()=>I.clubs.update({id:e,...wt(t)}),"Could not save the club. Check your connection and try again.")}async remove(e){return this.write(()=>I.clubs.remove({id:e}),"Could not delete the club. Check your connection and try again.")}async write(e,t){try{await e()}catch(s){return{ok:!1,message:R(s,t)}}return await this.load(!0),{ok:!0}}}const Un=C(`
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
`);class ps extends E{static styles=`
        .mclubfields {
            ${Ae()}

            & .mclubfields__field {
                ${ye()}
            }

            & .mclubfields__label {
                ${we()}
            }

            & .mclubfields__control {
                ${ae()}
            }

            & .mclubfields__hint {
                ${se()}
                margin: 0;
            }

            & .mclubfields__error {
                ${ue()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;draft=new m(cs());inputs={};render(){const e={name:`${this.props.idPrefix}-name`,location:`${this.props.idPrefix}-location`,logoUrl:`${this.props.idPrefix}-logo`},t={name:`${e.name}-error`,logoUrl:`${e.logoUrl}-error`},s={location:`${e.location}-hint`,logoUrl:`${e.logoUrl}-hint`},i=()=>this.props.busy?.get()??!1,o=this.wire(Un,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:i,oninput:a=>this.patch("name",a)},nameError:{id:t.name,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},locationLabel:{htmlFor:e.location},location:{id:e.location,"aria-describedby":s.location,disabled:i,oninput:a=>this.patch("location",a)},locationHint:{id:s.location},logoLabel:{htmlFor:e.logoUrl},logoUrl:{id:e.logoUrl,"aria-invalid":()=>String(this.props.errors.get().logoUrl!==void 0),disabled:i,oninput:a=>this.patch("logoUrl",a)},logoHint:{id:s.logoUrl},logoError:{id:t.logoUrl,textContent:()=>this.props.errors.get().logoUrl??"",hidden:()=>this.props.errors.get().logoUrl===void 0}});return this.inputs={name:this.ref(o,"name"),location:this.ref(o,"location"),logoUrl:this.ref(o,"logoUrl")},this.track(b(()=>{vt(this.inputs.name,this.props.errors.get().name?[t.name]:[])})),this.track(b(()=>{const a=[s.logoUrl];this.props.errors.get().logoUrl&&a.push(t.logoUrl),vt(this.inputs.logoUrl,a)})),o}seed(e){this.draft.set({...e});for(const t of["name","location","logoUrl"]){const s=this.inputs[t];s&&(s.value=e[t])}}focusFirst(){this.inputs.name?.focus()}focusInvalid(e){for(const t of["name","logoUrl"]){if(e[t]===void 0)continue;const s=this.inputs[t];return s?(s.focus(),!0):!1}return!1}patch(e,t){const s=t.target.value;this.draft.update(i=>({...i,[e]:s}))}}function vt(n,e){e.length===0?n.removeAttribute("aria-describedby"):n.setAttribute("aria-describedby",e.join(" "))}const P="/courses",rt="/courses/clubs",Bn=`${rt}/:id`;function Oe(n){return`${rt}/${n}`}const ot="/courses/course",Kn=`${ot}/:clubId/:courseId`;function Wn(n,e){return`${ot}/${n}/${e}`}const Gn=C(`
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
`);class Vn extends E{static styles=`
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
                ${ye()}
                max-width: 28rem;
            }

            & .mclubs__search-label {
                ${we()}
            }

            & .mclubs__search-input {
                ${ae()}
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
    `;router=this.inject(B);crumbs=this.inject(be);clubs=this.inject(He);createOpen=new m(!1);createBusy=new m(!1);createErrors=new m({});createFailure=new m(null);deleteOpen=new m(!1);deleteTarget=new m(null);deleteFailure=new m(null);deletingId=new m(null);fields=null;searchInput=null;actionEffects=new Map;columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>this.nameLink(e)},{key:"location",header:"Location",cell:e=>e.location},{key:"courses",header:"Courses",type:"numeric",cell:e=>e.courseCount}];render(){const e=this.wire(Gn,{new:{onclick:()=>this.openCreate()},searchLabel:{htmlFor:"manage-clubs-search"},search:{id:"manage-clubs-search",oninput:t=>this.clubs.query.set(t.target.value)},searchNote:{textContent:()=>this.searchNote(),hidden:()=>this.searchNote()===""},createPanel:{hidden:()=>!this.createOpen.get(),onsubmit:t=>{t.preventDefault(),this.create()}},createError:{textContent:()=>this.createFailure.get()??"",hidden:()=>this.createFailure.get()===null},createSubmit:{textContent:()=>this.createBusy.get()?"Creating…":"Create club",disabled:()=>this.createBusy.get()},createCancel:{disabled:()=>this.createBusy.get(),onclick:()=>this.closeCreate()},loadError:{textContent:()=>this.clubs.error.get()??"",hidden:()=>this.clubs.error.get()===null},retry:{hidden:()=>this.clubs.error.get()===null,onclick:()=>{this.clubs.load(!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading clubs…",hidden:()=>this.clubs.loaded.get()}});return this.searchInput=this.ref(e,"search"),this.fields=this.spawn(ps,this.ref(e,"createFields"),{idPrefix:"manage-club-new",errors:this.createErrors,busy:this.createBusy}),this.spawn(re,this.ref(e,"tableHost"),{columns:this.columns,rows:this.clubs.visible,rowKey:t=>t.id,caption:"Clubs",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Club actions",empty:{heading:()=>this.filtering()?"No clubs match that search":"No clubs yet",body:()=>this.filtering()?"Try a shorter search, or clear it to see every club.":"A club is the top of the catalog: create one, then add its courses.",action:{label:()=>this.filtering()?"Clear search":"New club",onclick:()=>this.filtering()?this.clearSearch():this.openCreate()}}}),this.spawn(X,this.ref(e,"confirmHost"),_e({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this club?"},consequence:()=>this.deleteConsequence(),confirmLabel:"Delete club",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(oe(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.crumbs.set([{label:"Clubs"}]),this.clubs.load();const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.createOpen.get()||this.closeCreate())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}nameLink(e){const t=document.createElement("a");return t.className="mclubs__link",t.href=ne+Oe(e.id),t.textContent=e.name,t.addEventListener("click",s=>{s.metaKey||s.ctrlKey||s.shiftKey||s.button!==0||(s.preventDefault(),this.router.navigate(Oe(e.id)))}),t}rowActions(e){const t=q("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,b(()=>{const s=this.deletingId.get();t.textContent=s===e.id?"Deleting…":"Delete",t.disabled=s!==null})),[t]}filtering(){return this.clubs.query.get().trim()!==""}clearSearch(){this.clubs.query.set(""),this.searchInput&&(this.searchInput.value="",this.searchInput.focus())}searchNote(){if(!this.filtering())return"";const e=this.clubs.visible.get().length,t=this.clubs.clubs.get().length;return`Showing ${e} of ${t} clubs.`}openCreate(){this.resetCreate(),this.createOpen.set(!0),this.fields?.focusFirst()}closeCreate(){this.createOpen.set(!1),this.resetCreate()}resetCreate(){this.createErrors.set({}),this.createFailure.set(null),this.fields?.seed(cs())}async create(){if(this.createBusy.get()||!this.fields)return;const e=this.fields.draft.get(),t=ds(e);if(this.createErrors.set(t),hs(t)){this.createFailure.set(null),this.fields.focusInvalid(t);return}this.createBusy.set(!0),this.createFailure.set(null);const s=await this.clubs.create(e);if(this.createBusy.set(!1),!s.ok){this.createFailure.set(s.message);return}this.closeCreate()}deleteConsequence(){const e=this.deleteTarget.get();return e?us(e.name,e.courseCount):ms}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.clubs.remove(e.id);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}const Yn="Could not save. Check your connection and try again.";class fe{key=new m(null);phase=new m("idle");error=new m(null);begin(e){this.phase.get()!=="saving"&&(this.key.set(e),this.phase.set("editing"),this.error.set(null))}cancel(){this.phase.get()!=="saving"&&(this.key.set(null),this.phase.set("idle"),this.error.set(null))}async commit(e){if(this.key.get()===null||this.phase.get()==="saving")return!1;this.phase.set("saving"),this.error.set(null);let t;try{t=await e()}catch{t={ok:!1,message:Yn}}return t.ok?(this.key.set(null),this.phase.set("idle"),this.error.set(null),!0):(this.phase.set("failed"),this.error.set(t.message),!1)}fail(e){this.key.get()!==null&&(this.phase.set("failed"),this.error.set(e))}isEditing(e){return this.key.get()===e}isSaving(e){return this.key.get()===e&&this.phase.get()==="saving"}errorFor(e){return this.key.get()===e&&this.phase.get()==="failed"?this.error.get():null}}const $t=[9,18],Xe="Paste as latitude, longitude — e.g. 57.7089, 11.9746. Use a dot for decimals";function gs(){return{name:"",holeCount:18,coordinates:""}}function Qn(n){return{name:n.name,holeCount:n.holeCount===9?9:18,coordinates:fs(n.latitude,n.longitude)}}function fs(n,e){return n===null||e===null?"":`${Ct(n)}, ${Ct(e)}`}function bs(n){const e=n.trim();if(e==="")return{ok:!0,position:{latitude:null,longitude:null}};const t=(e.includes(",")?e.split(","):e.split(/\s+/)).map(o=>o.trim()).filter(o=>o!=="");if(t.length!==2)return{ok:!1,message:Xe};const[s,i]=t.map(ti);return s===null||i===null?{ok:!1,message:Xe}:{ok:!0,position:{latitude:s,longitude:i}}}function Xn(n){const e={};n.name.trim()===""&&(e.name="A course needs a name. Enter one before saving.");const t=bs(n.coordinates);return t.ok||(e.coordinates=t.message),e}function Jn(n){return Object.keys(n).length>0}function xt(n){const e=bs(n.coordinates),t=e.ok?e.position:{latitude:null,longitude:null};return{name:n.name.trim(),holeCount:n.holeCount,latitude:t.latitude,longitude:t.longitude}}function Zn(n){return`${n} leaves the catalog, and its holes, tees and tee-role settings go with it. Rounds already played keep their own copy of the course data, so no scorecard changes.`}const ei="The course is removed from the catalog, along with its holes and tees.";function kt(n){const e=n.issues.filter(s=>s.severity==="error").length;if(!n.ok||e>0)return{status:"issues",count:Math.max(e,1)};const t=n.issues.length;return t>0?{status:"warnings",count:t}:{status:"ready"}}function _s(n){switch(n.status){case"checking":return"Checking…";case"ready":return"Ready";case"warnings":return Et(n.count,"warning","warnings");case"issues":return Et(n.count,"issue","issues");case"unknown":return"Not checked"}}function ys(n){switch(n.status){case"ready":return"ready";case"warnings":return"warn";case"issues":return"error";default:return"muted"}}function Et(n,e,t){return`${n} ${n===1?e:t}`}function ti(n){if(!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(n))return null;const e=Number(n);return Number.isFinite(e)?e:null}function Ct(n){return String(Number(n.toFixed(6)))}const Pe={status:"checking"};class ve{clubId=new m(null);courses=new m([]);readiness=new m({});validations=new m({});loading=new m(!1);error=new m(null);loaded=new m(!1);rows=new F(()=>{const e=this.readiness.get();return this.courses.get().map(t=>({...t,readiness:e[t.id]??Pe}))});clubs=U.get(He);inflight=null;load(e,t=!1){return this.clubId.get()!==e&&(this.clubId.set(e),this.courses.set([]),this.readiness.set({}),this.validations.set({}),this.loaded.set(!1),this.inflight=null),!t&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{const s=await I.courses.listByClub({clubId:e});if(this.clubId.get()!==e)return;this.courses.set(s),this.checkReadiness(s)}catch(s){this.error.set(R(s,"Could not load the courses. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.courses.get().find(t=>t.id===e)??null}async create(e,t){const{name:s,holeCount:i,latitude:o,longitude:a}=xt(t);return this.write(()=>I.courses.create({clubId:e,name:s,holeCount:i,latitude:o,longitude:a}),"Could not create the course. Check your connection and try again.",!0)}async update(e,t){const{name:s,holeCount:i,latitude:o,longitude:a}=xt(t);return this.write(()=>I.courses.update({id:e,name:s,holeCount:i,latitude:o,longitude:a}),"Could not save the course. Check your connection and try again.",!1)}async remove(e){return this.write(()=>I.courses.remove({id:e}),"Could not delete the course. Check your connection and try again.",!0)}async saveHole(e,t,s){return this.writeCourse(()=>I.courses.updateHole({courseId:e,holeNumber:t,...s}),"Could not save the hole. Check your connection and try again.")}async saveHoles(e,t,s){return this.writeCourse(()=>I.courses.update({id:e,holes:t}),s??"Could not save the holes. Check your connection and try again.")}async refreshReadiness(e){if(!this.holds(e))return;this.publish(e,Pe,null);let t;try{t=await I.courses.validate({id:e})}catch{this.publish(e,{status:"unknown"},null);return}this.holds(e)&&this.publish(e,kt(t),t)}holds(e){return this.courses.peek().some(t=>t.id===e)}async writeCourse(e,t){let s;try{s=await e()}catch(i){return{ok:!1,message:R(i,t)}}return this.applyCourse(s),this.refreshReadiness(s.id),{ok:!0}}applyCourse(e){this.holds(e.id)&&this.courses.update(t=>t.map(s=>s.id===e.id?{...s,...e}:s))}async write(e,t,s){try{await e()}catch(o){return{ok:!1,message:R(o,t)}}const i=this.clubId.get();return await Promise.all([i===null?Promise.resolve():this.load(i,!0),s?this.clubs.load(!0):Promise.resolve()]),{ok:!0}}checkReadiness(e){this.readiness.set(Object.fromEntries(e.map(t=>[t.id,Pe]))),this.validations.set({});for(const t of e)(async()=>{let s=null,i;try{s=await I.courses.validate({id:t.id}),i=kt(s)}catch{i={status:"unknown"}}this.holds(t.id)&&this.publish(t.id,i,s)})()}publish(e,t,s){this.readiness.update(i=>({...i,[e]:t})),this.validations.update(i=>{if(s===null){if(!(e in i))return i;const o={...i};return delete o[e],o}return{...i,[e]:s}})}}const si=C(`
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
`);class ni extends E{static styles=`
        .mcoursefields {
            ${Ae()}

            & .mcoursefields__field {
                ${ye()}
            }

            & .mcoursefields__label {
                ${we()}
            }

            & .mcoursefields__control {
                ${ae()}
            }

            & .mcoursefields__seg {
                ${ls()}
            }

            & .mcoursefields__hint {
                ${se()}
                margin: 0;
            }

            & .mcoursefields__error {
                ${ue()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;draft=new m(gs());nameInput=null;coordsInput=null;holeButtons=[];render(){const e={name:`${this.props.idPrefix}-name`,holes:`${this.props.idPrefix}-holes`,coordinates:`${this.props.idPrefix}-coords`},t={name:`${e.name}-error`,coordinates:`${e.coordinates}-error`},s={holes:`${e.holes}-hint`,coordinates:`${e.coordinates}-hint`},i=()=>this.props.busy?.get()??!1,o=this.wire(si,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:i,oninput:l=>this.patch({name:l.target.value})},nameError:{id:t.name,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},holesLabel:{id:`${e.holes}-label`},holes:{id:e.holes,"aria-labelledby":`${e.holes}-label`,"aria-describedby":s.holes},holesHint:{id:s.holes,textContent:"Changing this only changes the count — finish the new holes in the holes editor; readiness flags the gap until then.",hidden:()=>!(this.props.existing?.get()??!1)},coordsLabel:{htmlFor:e.coordinates},coordinates:{id:e.coordinates,"aria-invalid":()=>String(this.props.errors.get().coordinates!==void 0),disabled:i,oninput:l=>this.patch({coordinates:l.target.value})},coordsHint:{id:s.coordinates,textContent:`${Xe}. Optional; clear the field to remove the position.`},coordsError:{id:t.coordinates,textContent:()=>this.props.errors.get().coordinates??"",hidden:()=>this.props.errors.get().coordinates===void 0}});this.nameInput=this.ref(o,"name"),this.coordsInput=this.ref(o,"coordinates");const a=this.ref(o,"holes");return this.holeButtons=$t.map(l=>{const c=document.createElement("button");return c.type="button",c.textContent=String(l),c.addEventListener("click",()=>this.patch({holeCount:l})),a.appendChild(c),c}),this.track(b(()=>{const l=this.draft.get().holeCount,c=i();this.holeButtons.forEach((d,h)=>{d.setAttribute("aria-pressed",String($t[h]===l)),d.disabled=c})})),this.track(b(()=>{Tt(this.nameInput,this.props.errors.get().name?[t.name]:[])})),this.track(b(()=>{const l=[s.coordinates];this.props.errors.get().coordinates&&l.push(t.coordinates),Tt(this.coordsInput,l)})),o}seed(e){this.draft.set({...e}),this.nameInput&&(this.nameInput.value=e.name),this.coordsInput&&(this.coordsInput.value=e.coordinates)}focusFirst(){this.nameInput?.focus()}focusInvalid(e){return e.name!==void 0&&this.nameInput?(this.nameInput.focus(),!0):e.coordinates!==void 0&&this.coordsInput?(this.coordsInput.focus(),!0):!1}patch(e){this.draft.update(t=>({...t,...e}))}}function Tt(n,e){e.length===0?n.removeAttribute("aria-describedby"):n.setAttribute("aria-describedby",e.join(" "))}const Te="__new",ii=C(`
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
`);class ri extends E{static styles=`
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
    `;router=this.inject(B);courses=this.inject(ve);editor=new fe;errors=new m({});deleteOpen=new m(!1);deleteTarget=new m(null);deleteFailure=new m(null);deletingId=new m(null);fields=null;actionEffects=new Map;columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>this.nameLink(e)},{key:"holes",header:"Holes",type:"numeric",cell:e=>e.holeCount},{key:"tees",header:"Tees",type:"numeric",cell:e=>e.teeCount},{key:"position",header:"Position",cell:e=>{const t=fs(e.latitude,e.longitude);if(t!=="")return t;const s=document.createElement("span");return s.className="mcourses__muted",s.textContent="Not set",s}},{key:"readiness",header:"Readiness",cell:e=>this.badge(e)}];render(){const e=this.wire(ii,{new:{disabled:()=>this.editing()||this.deletingId.get()!==null,onclick:()=>this.openCreate()},panel:{hidden:()=>!this.editing(),onsubmit:t=>{t.preventDefault(),this.submit()}},panelTitle:{textContent:()=>this.panelTitle()},panelError:{textContent:()=>this.panelError()??"",hidden:()=>this.panelError()===null},submit:{textContent:()=>this.submitLabel(),disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.closePanel()},loadError:{textContent:()=>this.courses.error.get()??"",hidden:()=>this.courses.error.get()===null},retry:{hidden:()=>this.courses.error.get()===null,onclick:()=>{this.courses.load(this.props.clubId,!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading courses…",hidden:()=>this.courses.loaded.get()}});return this.fields=this.spawn(ni,this.ref(e,"fieldsHost"),{idPrefix:"manage-course",errors:this.errors,busy:{get:()=>this.saving()},existing:{get:()=>this.editing()&&!this.creating()}}),this.spawn(re,this.ref(e,"tableHost"),{columns:this.columns,rows:this.courses.rows,rowKey:t=>t.id,caption:"Courses",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Course actions",empty:{heading:"No courses yet",body:"Add the club’s first course, then set its holes and tees.",action:{label:"New course",onclick:()=>this.openCreate()}}}),this.spawn(X,this.ref(e,"confirmHost"),_e({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this course?"},consequence:()=>{const t=this.deleteTarget.get();return t?Zn(t.name):ei},confirmLabel:"Delete course",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(oe(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.courses.load(this.props.clubId);const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.editing()||this.saving()||this.closePanel())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}editing(){return this.editor.key.get()!==null}creating(){return this.editor.key.get()===Te}saving(){const e=this.editor.key.get();return e!==null&&this.editor.isSaving(e)}panelTitle(){if(this.creating())return"New course";const e=this.openCourse();return e?`Edit ${e.name}`:"Edit course"}submitLabel(){return this.creating()?this.saving()?"Creating…":"Create course":this.saving()?"Saving…":"Save course"}panelError(){const e=this.editor.key.get();return e===null?null:this.editor.errorFor(e)}openCourse(){const e=this.editor.key.get();return e===null||e===Te?null:this.courses.rows.get().find(t=>t.id===e)??null}openCreate(){this.saving()||(this.errors.set({}),this.editor.begin(Te),this.fields?.seed(gs()),this.fields?.focusFirst())}openEdit(e){this.saving()||(this.errors.set({}),this.editor.begin(e.id),this.fields?.seed(Qn(e)),this.fields?.focusFirst())}closePanel(){this.editor.cancel(),this.errors.set({})}async submit(){if(!this.fields||this.saving())return;const e=this.editor.key.get();if(e===null)return;this.deleteFailure.set(null);const t=this.fields.draft.get(),s=Xn(t);if(this.errors.set(s),Jn(s)){this.fields.focusInvalid(s);return}await this.editor.commit(()=>e===Te?this.courses.create(this.props.clubId,t):this.courses.update(e,t))}nameLink(e){const t=Wn(this.props.clubId,e.id),s=document.createElement("a");return s.className="mcourses__link",s.href=ne+t,s.textContent=e.name,s.addEventListener("click",i=>{i.metaKey||i.ctrlKey||i.shiftKey||i.button!==0||(i.preventDefault(),this.router.navigate(t))}),s}badge(e){const t=document.createElement("span");return t.className=`mcourses__badge mcourses__badge--${ys(e.readiness)}`,t.textContent=_s(e.readiness),t}rowActions(e){const t=q("Edit",{onclick:()=>this.openEdit(e)}),s=q("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,b(()=>{const i=this.deletingId.get(),o=i!==null||this.editing();s.textContent=i===e.id?"Deleting…":"Delete",s.disabled=o,t.disabled=o})),[t,s]}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.courses.remove(e.id);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}const oi=C(`
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
`);class ai extends E{static styles=`
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
    `;router=this.inject(B);crumbs=this.inject(be);clubs=this.inject(He);params=this.router.params(Bn);editor=new fe;errors=new m({});deleteOpen=new m(!1);deleteFailure=new m(null);deleting=new m(!1);fields=null;render(){const e=this.wire(oi,{loadingNote:{textContent:"Loading club…",hidden:()=>this.clubs.loaded.get()},loadError:{textContent:()=>this.clubs.error.get()??"",hidden:()=>this.clubs.error.get()===null},retry:{hidden:()=>this.clubs.error.get()===null,onclick:()=>{this.clubs.load(!0)}},missing:{hidden:()=>!this.clubs.loaded.get()||this.clubs.error.get()!==null||this.club()!==null},backMissing:{onclick:()=>this.router.navigate(P)},body:{hidden:()=>this.club()===null},title:()=>this.club()?.name??"",subtitle:()=>this.courseSummary(),remove:{textContent:()=>this.deleting.get()?"Deleting…":"Delete club",disabled:()=>this.editing()||this.deleting.get(),onclick:()=>{this.deleteFailure.set(null),this.deleteOpen.set(!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},edit:{hidden:()=>this.editing(),disabled:()=>this.deleting.get(),onclick:()=>this.beginEdit()},facts:{hidden:()=>this.editing()},factName:()=>this.club()?.name??"",factLocation:()=>this.club()?.location??"Not recorded",factLogo:()=>this.club()?.logoUrl??"Not recorded",form:{hidden:()=>!this.editing(),onsubmit:s=>{s.preventDefault(),this.save()}},saveError:{textContent:()=>this.editor.errorFor(this.clubId())??"",hidden:()=>this.editor.errorFor(this.clubId())===null},save:{textContent:()=>this.saving()?"Saving…":"Save",disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.cancelEdit()}});this.fields=this.spawn(ps,this.ref(e,"fieldsHost"),{idPrefix:"manage-club-edit",errors:this.errors,busy:{get:()=>this.saving()}});const t=this.clubId();return t!==""&&this.spawn(ri,this.ref(e,"coursesHost"),{clubId:t}),this.spawn(X,this.ref(e,"confirmHost"),_e({open:this.deleteOpen,title:()=>{const s=this.club();return s?`Delete ${s.name}?`:"Delete this club?"},consequence:()=>this.deleteConsequence(),confirmLabel:"Delete club",onconfirm:()=>{this.remove()}})),this.track(oe(this.deleteOpen)),e}onMount(){this.clubs.load(),this.track(b(()=>{const e=this.club();this.crumbs.set([{label:"Clubs",path:P},{label:e?.name??"Club"}])})),this.clubId()===""&&this.router.navigate(P,!0)}clubId(){return this.params.get().id}club(){const e=this.clubId();return e===""?null:this.clubs.byId(e)}editing(){return this.editor.isEditing(this.clubId())}saving(){return this.editor.isSaving(this.clubId())}courseSummary(){const e=this.club();return e?e.courseCount===0?"No courses yet.":e.courseCount===1?"1 course.":`${e.courseCount} courses.`:""}beginEdit(){const e=this.club();e&&(this.errors.set({}),this.editor.begin(e.id),this.fields?.seed(Pn(e)),this.fields?.focusFirst())}cancelEdit(){this.editor.cancel(),this.errors.set({})}save(){const e=this.club();if(!e||!this.fields||this.saving())return;const t=this.fields.draft.get(),s=ds(t);if(this.errors.set(s),hs(s)){this.fields.focusInvalid(s);return}this.editor.commit(()=>this.clubs.update(e.id,t))}deleteConsequence(){const e=this.club();return e?us(e.name,e.courseCount):ms}async remove(){const e=this.club();if(!(!e||this.deleting.get())){this.deleteFailure.set(null),this.deleting.set(!0);try{const t=await this.clubs.remove(e.id);if(!t.ok){this.deleteFailure.set(t.message);return}this.router.navigate(P,!0)}finally{this.deleting.set(!1)}}}}function Nt(n){return{par:String(n.par),strokeIndex:String(n.strokeIndex)}}function Je(){return{par:"",strokeIndex:""}}function ws(n,e){const t=At(n.par);if(t===null||t<1)return{ok:!1,message:"Par is a whole number of strokes — 3, 4 or 5 on nearly every hole. Enter one and save again."};const s=At(n.strokeIndex);return s===null||s<1||s>e?{ok:!1,message:`Stroke index runs from 1 to ${e}, one number per hole. Enter one in that range and save again.`}:{ok:!0,par:t,strokeIndex:s}}function li(n,e){const t=n.filter(l=>l.holeNumber>=1&&l.holeNumber<=e),s=(l,c)=>t.filter(d=>d.holeNumber>=l&&d.holeNumber<=c),i=(l,c)=>s(l,c).reduce((d,h)=>d+h.par,0),o=(l,c)=>s(l,c).length===0?null:i(l,c),a=e>9;return{front:a?o(1,9):null,back:a?o(10,e):null,split:a,total:i(1,e),counted:t.length,expected:e,extra:n.length-t.length}}function It(n){return n===null?"—":String(n)}function St(n){const e=[],t=n.expected-n.counted;return t>0&&e.push(`Counted over the ${n.counted} ${Y(n.counted)} that have values — ${t} of the course’s ${n.expected} ${Y(n.expected)} ${t===1?"has":"have"} no row yet.`),n.extra>0&&e.push(`${Q(V(n.extra,"hole row","hole rows"))} sit beyond hole ${n.expected} and ${n.extra===1?"is":"are"} not counted.`),e.length>0?e.join(" "):null}function Re(n,e){const t=new Set(n.map(i=>i.holeNumber)),s=[];for(let i=1;i<=e;i+=1)t.has(i)||s.push(i);return s}function at(n,e){const t=new Set(n.map(i=>i.strokeIndex)),s=[];for(let i=1;i<=e;i+=1)t.has(i)||s.push(i);return s}function ci(n,e,t){const s=lt(n,t);if(s.length>0)return{ok:!1,message:`This course also has ${V(s.length,"hole row","hole rows")} beyond hole ${t}. Remove those rows in the panel below, or set the hole count to match the course on the club page — adding holes cannot resolve either.`};const i=[...n];for(const l of Re(n,t)){const c=e.get(l)??Je(),d=ws(c,t);if(!d.ok)return{ok:!1,message:`Hole ${l}: ${fi(d.message)}`};i.push({holeNumber:l,par:d.par,strokeIndex:d.strokeIndex})}const o=vs(i);if(o){const c=n.some(d=>d.holeNumber===o.holes[0])&&n.some(d=>d.holeNumber===o.holes[1])?"Change one of them in the grid above first.":"Give the new hole one of the free numbers.";return{ok:!1,message:`Holes ${o.holes[0]} and ${o.holes[1]} would both have stroke index ${o.strokeIndex}. Every hole needs its own number from 1 to ${t}. ${c}`}}const a=at(i,t);return a.length>0?{ok:!1,message:`Stroke ${a.length===1?"index":"indices"} ${ee(a)} would be left unused. Every number from 1 to ${t} has to appear exactly once.`}:{ok:!0,holes:[...i].sort((l,c)=>l.holeNumber-c.holeNumber)}}function lt(n,e){return n.filter(t=>t.holeNumber<1||t.holeNumber>e).sort((t,s)=>t.holeNumber-s.holeNumber)}function Lt(n,e){const t=lt(n,e);if(t.length===0)return{ok:!1,message:"This course has no hole rows beyond its hole count."};const s=n.filter(c=>c.holeNumber>=1&&c.holeNumber<=e).sort((c,d)=>c.holeNumber-d.holeNumber),i=Re(s,e);if(i.length>0)return{ok:!1,message:`${Q(Y(i.length))} ${ee(i)} ${i.length===1?"has":"have"} no row either, so removing these would leave the course incomplete. Add the missing ${Y(i.length)} first.`};const o=s.filter(c=>c.strokeIndex<1||c.strokeIndex>e);if(o.length>0)return{ok:!1,message:`${Q(Y(o.length))} ${ee(o.map(c=>c.holeNumber))} still ${o.length===1?"has a stroke index":"have stroke indices"} above ${e}. A ${e}-hole course hands out stroke indices 1 to ${e}, so give ${o.length===1?"it":"them"} a number in that range in the grid above, then remove these rows.`};const a=vs(s);if(a)return{ok:!1,message:`Holes ${a.holes[0]} and ${a.holes[1]} both have stroke index ${a.strokeIndex}. Every one of the course’s ${e} holes needs its own number from 1 to ${e}. Change one of them in the grid above, then remove these rows.`};const l=at(s,e);return l.length>0?{ok:!1,message:`Stroke ${l.length===1?"index":"indices"} ${ee(l)} ${l.length===1?"is":"are"} not assigned to any of the course’s ${e} holes. Hand ${l.length===1?"it":"them"} out in the grid above, then remove these rows.`}:{ok:!0,holes:s,removed:t}}function di(n){return`Hole ${n.holeNumber} — par ${n.par}, stroke index ${n.strokeIndex}`}function hi(n,e){if(n.length===0)return"";const t=n.map(s=>s.holeNumber);return`This course is set to ${e} holes, but ${V(n.length,"row","rows")} beyond that ${n.length===1?"is":"are"} still stored — ${Y(t.length)} ${ee(t)}. A hole-count change leaves them behind on purpose, because the par and stroke index on them are real numbers somebody typed. They count towards nothing, and the course check reports them until they are gone.`}function ui(n,e,t){const s=n.map(i=>i.holeNumber);return`${Q(Y(s.length))} ${ee(s)} — and the par and stroke index stored on ${s.length===1?"it":"them"} — are deleted from ${e}. The course keeps its ${t} holes. This cannot be undone.`}function vs(n){const e=new Map;for(const t of[...n].sort((s,i)=>s.holeNumber-i.holeNumber)){const s=e.get(t.strokeIndex);if(s!==void 0)return{strokeIndex:t.strokeIndex,holes:[s,t.holeNumber]};e.set(t.strokeIndex,t.holeNumber)}return null}function mi(n,e){return n.issues.map((t,s)=>({key:`${s}:${t.code}:${t.message}`,severity:t.severity,severityLabel:t.severity==="error"?"Problem":"Warning",explanation:pi(t.code,e),detail:t.message}))}function pi(n,e){switch(n){case"missing_holes":return"These holes have no par or stroke index yet, so the course is not complete. Add them below.";case"unexpected_holes":return`The course is set to ${e} holes, but rows exist past that. Remove them in the panel below, or change the hole count on the club page if the course really has them.`;case"duplicate_stroke_index":return"Two holes share a stroke index. Handicap strokes are handed out in stroke-index order, so each hole needs its own number.";case"missing_stroke_indices":return`Some numbers between 1 and ${e} are not assigned to any hole. Every one of them has to appear exactly once.`;case"stroke_index_out_of_range":return`A stroke index outside 1 to ${e} cannot be resolved when a round hands out strokes.`;case"unusual_par":return"A par outside 3 to 6 is unusual, not wrong. It saves as it is — worth a second look.";default:return"The course check reported this."}}function gi(n,e,t){if(n.status==="checking")return"Checking the course…";if(n.status==="unknown"||e===null)return"The course check did not run, so nothing here is confirmed. It runs again after the next save.";const s=e.issues.filter(o=>o.severity==="error").length,i=e.issues.length-s;return s===0&&i===0?`Nothing to fix — every hole has a par, and the stroke indices run 1 to ${t}, once each.`:s===0?`${Q(V(i,"warning","warnings"))}, nothing that blocks play.`:i===0?`${Q(V(s,"problem","problems"))} to fix.`:`${Q(V(s,"problem","problems"))} to fix, and ${V(i,"warning","warnings")}.`}function V(n,e,t){return`${n} ${n===1?e:t}`}function Y(n){return n===1?"hole":"holes"}function ee(n){return n.length<=2?n.join(" and "):`${n.slice(0,-1).join(", ")} and ${n[n.length-1]}`}function Q(n){return n.charAt(0).toUpperCase()+n.slice(1)}function fi(n){return n.charAt(0).toLowerCase()+n.slice(1)}function At(n){const e=n.trim();if(!/^\d+$/.test(e))return null;const t=Number(e);return Number.isSafeInteger(t)?t:null}const le="__fill";function Ot(n,e){return`Hole ${n.holeNumber} — ${e}`}const bi=C(`
    <section class="mholes">
        <header class="mholes__heading">
            <h2 class="mholes__title">Holes</h2>
            <p class="mholes__lead">Par and stroke index, one hole per row. Stroke index 1 is the hardest hole — it is where the first handicap stroke falls. Enter saves a row and opens the next hole, so a full card can be typed straight through.</p>
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
`);class _i extends E{static styles=`
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
                ${ae()}
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
                ${ye()}
            }

            & .mholes__field-label {
                ${we()}
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
    `;courses=this.inject(ve);editor=new fe;draft=Je();advanceFrom=null;fillEditor=new fe;fillDrafts=new Map;fillHost=null;trimOpen=new m(!1);trimming=new m(!1);trimError=new m(null);actionEffects=new Map;columns=[{key:"hole",header:"Hole",type:"numeric",stackedLabel:!1,cell:e=>e.holeNumber},{key:"par",header:"Par",type:"numeric",cell:e=>e.par,editCell:e=>this.numberInput({label:`Par, hole ${e.holeNumber}`,value:this.draft.par,oninput:t=>{this.draft.par=t},onenter:()=>{this.advanceFrom=e.holeNumber}})},{key:"strokeIndex",header:"Stroke index",type:"numeric",cell:e=>e.strokeIndex,editCell:e=>this.numberInput({label:`Stroke index, hole ${e.holeNumber}`,value:this.draft.strokeIndex,oninput:t=>{this.draft.strokeIndex=t},onenter:()=>{this.advanceFrom=e.holeNumber}})}];render(){const e=this.wire(bi,{frontItem:{hidden:()=>!this.summary().split},frontPar:{textContent:()=>It(this.summary().front)},backItem:{hidden:()=>!this.summary().split},backPar:{textContent:()=>It(this.summary().back)},totalPar:{textContent:()=>String(this.summary().total)},summaryNote:{textContent:()=>St(this.summary())??"",hidden:()=>St(this.summary())===null},checkBadge:{textContent:()=>_s(this.readiness()),className:()=>`mholes__badge mholes__badge--${ys(this.readiness())}`},checkStatus:{textContent:()=>gi(this.readiness(),this.validation(),this.holeCount())},fill:{hidden:()=>this.missing().length===0},fillLead:{textContent:()=>this.fillLead()},fillOpen:{hidden:()=>this.filling(),disabled:()=>this.busy(),onclick:()=>this.openFill()},fillForm:{hidden:()=>!this.filling(),onsubmit:s=>{s.preventDefault(),this.saveFill()}},fillFree:{textContent:()=>this.freeNote()},fillError:{textContent:()=>this.fillEditor.errorFor(le)??"",hidden:()=>this.fillEditor.errorFor(le)===null},fillSave:{textContent:()=>this.fillSaving()?"Adding…":"Add holes",disabled:()=>this.busy()},fillCancel:{disabled:()=>this.fillSaving(),onclick:()=>this.closeFill()},trim:{hidden:()=>this.extras().length===0},trimLead:{textContent:()=>hi(this.extras(),this.holeCount())},trimBlocked:{textContent:()=>this.trimBlocker()??"",hidden:()=>this.trimBlocker()===null},trimOpen:{textContent:()=>this.trimLabel(),disabled:()=>this.busy()||this.trimBlocker()!==null,onclick:()=>this.trimOpen.set(!0)},trimError:{textContent:()=>this.trimError.get()??"",hidden:()=>this.trimError.get()===null}}),t=new F(()=>[...this.course()?.holes??[]].sort((s,i)=>s.holeNumber-i.holeNumber));return this.spawn(re,this.ref(e,"tableHost"),{columns:this.columns,rows:t,rowKey:s=>String(s.holeNumber),caption:"Holes",captionHidden:!0,stacked:!1,actions:s=>this.rowActions(s),actionsHeader:"Hole actions",empty:{heading:"No holes yet",body:"This course has no hole rows. Add them below, one par and one stroke index per hole."},edit:{controller:this.editor,oncommit:s=>{this.saveRow(s)},saveLabel:"Save",savingLabel:"Saving…",statusHost:this.ref(e,"rowStatus")}}),this.fillHost=this.ref(e,"fillRows"),this.$each(this.ref(e,"issues"),()=>this.issues(),s=>this.issueItem(s),s=>s.key),this.$each(this.ref(e,"trimLoss"),()=>this.extras(),s=>this.lossItem(s),s=>`${s.holeNumber}:${s.par}:${s.strokeIndex}`),this.spawn(X,this.ref(e,"confirmHost"),_e({open:this.trimOpen,title:()=>{const s=this.extras();return s.length===1?`Remove hole ${s[0].holeNumber}?`:`Remove ${s.length} hole rows?`},consequence:()=>ui(this.extras(),this.course()?.name??"this course",this.holeCount()),confirmLabel:()=>this.extras().length===1?"Remove hole row":"Remove hole rows",onconfirm:()=>{this.trim()}})),this.track(oe(this.trimOpen)),this.track(()=>{for(const s of this.actionEffects.values())s();this.actionEffects.clear()}),e}course(){return this.courses.byId(this.props.courseId)}holeCount(){return this.course()?.holeCount??0}summary(){return li(this.course()?.holes??[],this.holeCount())}readiness(){return this.courses.readiness.get()[this.props.courseId]??{status:"checking"}}validation(){return this.courses.validations.get()[this.props.courseId]??null}issues(){const e=this.validation();return e?mi(e,this.holeCount()):[]}missing(){return Re(this.course()?.holes??[],this.holeCount())}extras(){return lt(this.course()?.holes??[],this.holeCount())}rowActions(e){const t=String(e.holeNumber),s=q("Edit",{onclick:()=>{this.draft=Nt(e),this.editor.begin(t)}});return this.actionEffects.get(t)?.(),this.actionEffects.set(t,b(()=>{s.disabled=this.editor.key.get()!==null||this.busy()})),s}async saveRow(e){const t=this.advanceFrom===e.holeNumber;this.advanceFrom=null;const s=this.course();if(!s)return;if(this.fillSaving()){this.editor.fail("The missing holes are still being added. Wait for that to finish, then save this hole again.");return}if(this.trimming.peek()){this.editor.fail("The extra hole rows are still being removed. Wait for that to finish, then save this hole again.");return}const i=ws(this.draft,s.holeCount);if(!i.ok){this.editor.fail(Ot(e,i.message));return}if(await this.editor.commit(async()=>{const a=await this.courses.saveHole(s.id,e.holeNumber,{par:i.par,strokeIndex:i.strokeIndex});return a.ok?a:{ok:!1,message:Ot(e,a.message)}})&&t){const l=[...this.course()?.holes??[]].sort((c,d)=>c.holeNumber-d.holeNumber).find(c=>c.holeNumber>e.holeNumber);l&&(this.draft=Nt(l),this.editor.begin(String(l.holeNumber)))}}issueItem(e){const t=document.createElement("li");t.className=`mholes__issue mholes__issue--${e.severity}`;const s=document.createElement("span");s.className="mholes__issue-severity",s.textContent=e.severityLabel;const i=document.createElement("p");i.className="mholes__issue-text",i.textContent=e.explanation;const o=document.createElement("p");return o.className="mholes__issue-detail",o.textContent=e.detail,t.append(s,i,o),t}filling(){return this.fillEditor.key.get()===le}fillSaving(){return this.fillEditor.isSaving(le)}busy(){return this.editor.phase.get()==="saving"||this.fillSaving()||this.trimming.get()}fillLead(){const e=this.missing();return e.length===0?"":`${e.length===1?"Hole":"Holes"} ${Rt(e)} ${e.length===1?"has":"have"} no row on this course, so the course is incomplete until ${e.length===1?"it is":"they are"} filled in. Enter the real par and stroke index for each — nothing is guessed for you, because an invented par ends up on somebody’s scorecard.`}freeNote(){const e=at(this.course()?.holes??[],this.holeCount());return e.length===0?"":`Stroke ${e.length===1?"index":"indices"} still free: ${Rt(e)}. Each of them has to end up on exactly one hole.`}openFill(){const e=this.course(),t=this.fillHost;if(!(!e||!t||this.busy())){this.fillDrafts.clear(),t.textContent="";for(const s of Re(e.holes,e.holeCount)){const i=Je();this.fillDrafts.set(s,i),t.appendChild(this.fillRow(s,i))}this.fillEditor.begin(le),t.querySelector("input")?.focus()}}fillRow(e,t){const s=document.createElement("div");s.className="mholes__fill-row";const i=document.createElement("span");return i.className="mholes__fill-hole",i.textContent=`Hole ${e}`,s.appendChild(i),s.appendChild(this.fillField(`manage-hole-${e}-par`,"Par",t.par,o=>{t.par=o})),s.appendChild(this.fillField(`manage-hole-${e}-si`,"Stroke index",t.strokeIndex,o=>{t.strokeIndex=o})),s}fillField(e,t,s,i){const o=document.createElement("div");o.className="mholes__field";const a=document.createElement("label");a.className="mholes__field-label",a.htmlFor=e,a.textContent=t;const l=this.numberInput({label:t,value:s,oninput:i});return l.id=e,l.removeAttribute("aria-label"),o.append(a,l),o}closeFill(){this.fillEditor.cancel(),this.fillEditor.key.get()===null&&(this.fillDrafts.clear(),this.fillHost&&(this.fillHost.textContent=""))}async saveFill(){const e=this.course();if(!e||this.fillSaving())return;if(this.editor.phase.peek()==="saving"){this.fillEditor.fail("A hole is still saving. Wait for it to finish, then add these holes again.");return}const t=ci(e.holes,this.fillDrafts,e.holeCount);if(!t.ok){this.fillEditor.fail(t.message);return}await this.fillEditor.commit(()=>this.courses.saveHoles(e.id,t.holes,"Could not add the holes. Check your connection and try again."))&&(this.fillDrafts.clear(),this.fillHost&&(this.fillHost.textContent=""))}lossItem(e){const t=document.createElement("li");return t.className="mholes__loss-item",t.textContent=di(e),t}trimLabel(){const e=this.extras();return this.trimming.get()?"Removing…":e.length===1?`Remove hole ${e[0].holeNumber}`:`Remove these ${e.length} hole rows`}trimBlocker(){const e=this.course();if(!e)return null;const t=Lt(e.holes,e.holeCount);return t.ok?null:t.message}async trim(){const e=this.course();if(!e||this.busy()||this.trimming.get())return;const t=Lt(e.holes,e.holeCount);if(!t.ok){this.trimError.set(t.message);return}this.trimError.set(null),this.trimming.set(!0);try{const s=await this.courses.saveHoles(e.id,t.holes,"Could not remove the hole rows. Check your connection and try again.");s.ok||this.trimError.set(s.message)}finally{this.trimming.set(!1)}}numberInput(e){const t=document.createElement("input");return t.type="text",t.inputMode="numeric",t.autocomplete="off",t.className="mholes__input",t.value=e.value,t.setAttribute("aria-label",e.label),t.addEventListener("input",()=>e.oninput(t.value)),e.onenter&&t.addEventListener("keydown",s=>{s.key==="Enter"&&e.onenter()}),t}}function Rt(n){return n.length<=2?n.join(" and "):`${n.slice(0,-1).join(", ")} and ${n[n.length-1]}`}const yi=new Set(["courses","home_club_players","rounds","route_templates","tee_role_mappings"]);function wi(n){if(!(n instanceof O)||n.status!==409)return null;const e=n.detail;if(typeof e!="object"||e===null)return null;const{code:t,blockers:s}=e;return typeof t!="string"||!Array.isArray(s)||!s.every(vi)?null:{code:t,blockers:s}}function vi(n){if(typeof n!="object"||n===null)return!1;const{kind:e,count:t,items:s}=n;return typeof e=="string"&&yi.has(e)&&typeof t=="number"&&(s===void 0||Array.isArray(s)&&s.every(i=>typeof i=="string"))}const j=["M","F"];function A(n){return n==="M"?"Men":"Women"}const $i=["Vit","Gul","Blå","Röd","Orange","Svart","White","Yellow","Blue","Red","Black"],xi="The colour this tee is known by — Gul, Blå, Röd. A hex value like #ffd400 also works";function $s(n){return{name:"",colour:"",lengths:xs(n),ratings:{M:Ze(),F:Ze()}}}function ki(n,e){const t=new Map(n.holeLengths.map(s=>[s.holeNumber,s]));return{name:n.name,colour:n.colour??"",lengths:xs(e).map(s=>{const i=t.get(s.holeNumber);return i?{holeNumber:s.holeNumber,lengthM:Z(i.lengthM),strokeIndexOverride:i.strokeIndexOverride===null?"":Z(i.strokeIndexOverride)}:s}),ratings:{M:zt(n,"M"),F:zt(n,"F")}}}function zt(n,e){const t=n.ratings.find(s=>s.gender===e);return t?{rated:!0,courseRating:Z(t.courseRating),slope:Z(t.slope),par:Z(t.par),totalLengthM:Z(t.totalLengthM)}:Ze()}function Ze(){return{rated:!1,courseRating:"",slope:"",par:"",totalLengthM:""}}function xs(n){return Array.from({length:Math.max(n,0)},(e,t)=>({holeNumber:t+1,lengthM:"",strokeIndexOverride:""}))}function Ei(n,e){const t={};n.name.trim()===""&&(t.name="A tee needs a name. Enter one before saving.");const s=[];let i=null;for(const l of n.lengths){const c=l.lengthM.trim();if(c!==""&&Ns(c)===null){s.push(l.holeNumber),i??=`Hole ${l.holeNumber}: a length is metres as a number, e.g. 342. Leave it blank if the hole is not measured from this tee.`;continue}const d=l.strokeIndexOverride.trim();d!==""&&!zi(d,e)&&(s.push(l.holeNumber),i??=`Hole ${l.holeNumber}: a stroke-index override is a whole number from 1 to ${e}. Leave it blank to use the course's own stroke index.`)}i!==null&&(t.lengths=i,t.badHoles=s);const o={},a={};for(const l of j){const c=Ci(n.ratings[l],l);c!==null&&(o[l]=c.message,a[l]=c.field)}return Object.keys(o).length>0&&(t.ratings=o,t.ratingFields=a),t}function Ci(n,e){if(!n.rated)return null;const t=G.filter(i=>!i.optional&&n[i.key].trim()==="");if(t.length>0)return{message:`${A(e)}: fill in ${Di(t.map(i=>i.label))}, or set this tee to not rated for ${A(e).toLowerCase()}.`,field:t[0].key};const s=G.filter(i=>{const o=n[i.key].trim();return i.optional&&o===""?!1:i.whole?!Ri(o):Is(o)===null});if(s.length>0){const i=s[0];return{message:i.whole?`${A(e)}: ${i.label.toLowerCase()} is a whole number, e.g. ${i.example}.`:`${A(e)}: ${i.label.toLowerCase()} is a number, e.g. ${i.example}.`,field:i.key}}return null}const G=[{key:"courseRating",label:"Course rating",whole:!1,example:"71.4"},{key:"slope",label:"Slope",whole:!0,example:"132"},{key:"par",label:"Par",whole:!0,example:"72"},{key:"totalLengthM",label:"Total length (m)",whole:!0,example:"5812",optional:!0}];function Ti(n){return Object.keys(n).length>0}function Dt(n){const e=[];for(const i of n.lengths){const o=Ns(i.lengthM.trim());if(o===null)continue;const a=i.strokeIndexOverride.trim();e.push({holeNumber:i.holeNumber,lengthM:o,strokeIndexOverride:a===""?null:Number(a)})}const t=[];for(const i of j){const o=n.ratings[i];if(!o.rated)continue;const a=o.totalLengthM.trim();t.push({gender:i,courseRating:Is(o.courseRating.trim())??NaN,slope:Number(o.slope.trim()),par:Number(o.par.trim()),totalLengthM:a===""?0:Number(a)})}const s=n.colour.trim();return{name:n.name.trim(),colour:s===""?null:s,holeLengths:e,ratings:t}}function Ni(n){const e=j.filter(t=>n.ratings.some(s=>s.gender===t));return e.length===0?"Not rated":e.map(A).join(", ")}function Ii(n){const e=j.map(s=>({gender:s,rating:n.ratings.find(i=>i.gender===s)})).filter(s=>s.rating!==void 0&&s.rating.totalLengthM>0);if(e.length>0)return e.map(s=>`${A(s.gender)} ${me(s.rating.totalLengthM)}`).join(", ");const t=n.holeLengths.reduce((s,i)=>s+i.lengthM,0);return t>0?`${me(t)} measured`:""}function Si(n){return n.holeLengths.length}function me(n){return`${Math.round(n)} m`}function ks(n){if(n===null)return null;const e=n.trim();return/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(e)?e:Cs[e.toLocaleLowerCase("sv-SE")]??null}function Es(n){const e=n.trim(),t=Li(e);return(t===null?null:et.get(t))??e}function Li(n){if(!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(n))return null;const e=n.slice(1).toLowerCase();return`#${e.length===3?[...e].map(t=>t+t).join(""):e}`}const et=new Map,Cs={vit:"#f5f5f5",white:"#f5f5f5",gul:"#ffd400",yellow:"#ffd400",blå:"#2a6fd4",bla:"#2a6fd4",blue:"#2a6fd4",röd:"#d4332a",rod:"#d4332a",red:"#d4332a",orange:"#e8830c",svart:"#1c1c1c",black:"#1c1c1c",grön:"#2f8f4e",green:"#2f8f4e",guld:"#c8a44a",gold:"#c8a44a"};for(const[n,e]of Object.entries(Cs))et.has(e)||et.set(e,n.charAt(0).toUpperCase()+n.slice(1));function Ai(n){return`${n} leaves this course, and its hole lengths and ratings go with it. Rounds already played keep their own copy of the tee, so no scorecard changes.`}const Oi="The tee is removed from this course, along with its hole lengths and ratings.";function Ts(n){return/^\d+,\d+$/.test(n)?n.replace(",","."):n}function Ns(n){const e=Ts(n);if(!/^\d+(\.\d+)?$/.test(e))return null;const t=Number(e);return Number.isFinite(t)&&t>0?t:null}function Is(n){const e=Ts(n);if(!/^\d+(\.\d+)?$/.test(e))return null;const t=Number(e);return Number.isFinite(t)?t:null}function Ri(n){return/^\d+$/.test(n)}function zi(n,e){if(!/^\d+$/.test(n))return!1;const t=Number(n);return t>=1&&t<=e}function Z(n){return String(Number(n.toFixed(3)))}function Di(n){const e=n.map(t=>t.toLowerCase());return e.length===1?e[0]:`${e.slice(0,-1).join(", ")} and ${e[e.length-1]}`}class Ss{courseId=new m(null);tees=new m([]);loading=new m(!1);error=new m(null);loaded=new m(!1);courses=U.get(ve);inflight=null;load(e,t=!1){return this.courseId.get()!==e&&(this.courseId.set(e),this.tees.set([]),this.loaded.set(!1),this.inflight=null),!t&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{const s=await I.tees.listByCourse({courseId:e});if(this.courseId.get()!==e)return;this.tees.set(s)}catch(s){this.error.set(R(s,"Could not load the tees. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}byId(e){return this.tees.get().find(t=>t.id===e)??null}async create(e,t,s){const{name:i,colour:o,holeLengths:a,ratings:l}=Dt(s);return this.write(()=>I.tees.create({courseId:e,name:i,colour:o,holeLengths:a,ratings:l}),"Could not create the tee. Check your connection and try again.",t)}async update(e,t){const{name:s,colour:i,holeLengths:o,ratings:a}=Dt(t);return this.write(()=>I.tees.update({id:e,name:s,colour:i,holeLengths:o,ratings:a}),"Could not save the tee. Check your connection and try again.",null)}async remove(e,t){return this.write(()=>I.tees.remove({id:e}),"Could not delete the tee. Check your connection and try again.",t)}async write(e,t,s){try{await e()}catch(o){return{ok:!1,message:R(o,t),code:wi(o)?.code}}const i=this.courseId.get();return await Promise.all([i===null?Promise.resolve():this.load(i,!0),s===null?Promise.resolve():this.courses.load(s,!0)]),{ok:!0}}}const Hi=C(`
    <div class="mtlen">
        <div class="mtlen__head">
            <span bind="label" class="mtlen__title">Hole lengths</span>
            <p bind="hint" class="mtlen__hint"></p>
        </div>
        <div bind="box" class="mtlen__box"></div>
        <p bind="summary" class="mtlen__summary" role="status" aria-live="polite"></p>
        <p bind="error" class="mtlen__error" role="alert"></p>
    </div>
`);class Fi extends E{static styles=`
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
                ${se()}
                margin: 0;
            }

            & .mtlen__box {
                ${Dn()}
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
                ${ae()}
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
                ${se()}
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
    `;lengths=new m([]);box=null;lengthInputs=new Map;siInputs=new Map;render(){const e=this.wire(Hi,{label:{id:`${this.props.idPrefix}-lengths-label`},hint:{textContent:"Metres per hole. Leave a hole blank if this tee is not measured for it. A stroke-index override replaces the course’s own index for this tee only — leave it blank to use the course’s."},summary:{textContent:()=>this.summary()},error:{textContent:()=>this.props.errors.get().lengths??"",hidden:()=>this.props.errors.get().lengths===void 0}});return this.box=this.ref(e,"box"),this.track(b(()=>{const t=this.props.holeCount.get();this.build(t)})),this.track(b(()=>{const t=new Set(this.props.errors.get().badHoles??[]);for(const[s,i]of this.lengthInputs)i.setAttribute("aria-invalid",String(t.has(s)));for(const[s,i]of this.siInputs)i.setAttribute("aria-invalid",String(t.has(s)))})),this.track(b(()=>{const t=this.props.busy?.get()??!1;for(const s of this.lengthInputs.values())s.disabled=t;for(const s of this.siInputs.values())s.disabled=t})),e}seed(e){this.lengths.set(e.map(t=>({...t}))),this.apply()}focusFirst(){const e=this.lengthInputs.get(1)??[...this.lengthInputs.values()][0];return e?(e.focus(),e.select(),!0):!1}focusInvalid(e){const t=e.badHoles?.[0];if(t===void 0)return!1;const s=this.lengthInputs.get(t)??this.siInputs.get(t);return s?(s.focus(),s.select(),!0):!1}build(e){const t=this.box;if(!t||(t.textContent="",this.lengthInputs.clear(),this.siInputs.clear(),e<=0))return;const s=Array.from({length:e},(c,d)=>d+1),i=document.createElement("table");i.className="mtlen__grid",i.setAttribute("aria-labelledby",`${this.props.idPrefix}-lengths-label`);const o=document.createElement("thead"),a=document.createElement("tr");a.appendChild(je("th","mtlen__hole mtlen__rowhead mtlen__corner","Hole"));for(const c of s){const d=je("th","mtlen__hole",String(c));d.setAttribute("scope","col"),d.id=this.holeHeaderId(c),a.appendChild(d)}o.appendChild(a),i.appendChild(o);const l=document.createElement("tbody");l.appendChild(this.inputRow("Length (m)",s,"decimal",this.lengthInputs,(c,d)=>this.patch(c,{lengthM:d}))),l.appendChild(this.inputRow("SI override",s,"numeric",this.siInputs,(c,d)=>this.patch(c,{strokeIndexOverride:d}))),i.appendChild(l),t.appendChild(i),this.apply()}inputRow(e,t,s,i,o){const a=document.createElement("tr"),l=je("th","mtlen__cell mtlen__rowhead",e);l.setAttribute("scope","row"),a.appendChild(l);for(const c of t){const d=document.createElement("td");d.className="mtlen__cell";const h=document.createElement("input");h.type="text",h.className="mtlen__input",h.inputMode=s,h.autocomplete="off",h.setAttribute("aria-label",`${e}, hole ${c}`),h.addEventListener("input",()=>o(c,h.value)),i.set(c,h),d.appendChild(h),a.appendChild(d)}return a}apply(){const e=new Map(this.lengths.peek().map(t=>[t.holeNumber,t]));for(const[t,s]of this.lengthInputs)s.value=e.get(t)?.lengthM??"";for(const[t,s]of this.siInputs)s.value=e.get(t)?.strokeIndexOverride??""}patch(e,t){this.lengths.update(s=>{const i=s.findIndex(a=>a.holeNumber===e);if(i===-1)return[...s,{holeNumber:e,lengthM:"",strokeIndexOverride:"",...t}].sort((a,l)=>a.holeNumber-l.holeNumber);const o=[...s];return o[i]={...o[i],...t},o})}holeHeaderId(e){return`${this.props.idPrefix}-hole-${e}`}summary(){const e=this.lengths.get(),t=this.props.holeCount.get();if(t<=0)return"";const s=e.filter(l=>Ht(l.lengthM)!==null);if(s.length===0)return"No holes measured yet.";const i=(l,c)=>s.filter(d=>d.holeNumber>=l&&d.holeNumber<=c).reduce((d,h)=>d+(Ht(h.lengthM)??0),0),o=i(1,t),a=[];return t>9&&a.push(`Out ${me(i(1,9))}`,`In ${me(i(10,t))}`),a.push(`Total ${me(o)}`),a.push(s.length===t?`all ${t} holes measured`:`${s.length} of ${t} holes measured`),a.join(" · ")}}function je(n,e,t){const s=document.createElement(n);return s.className=e,s.textContent=t,s}function Ht(n){const e=n.trim();if(!/^\d+(\.\d+)?$/.test(e))return null;const t=Number(e);return Number.isFinite(t)&&t>0?t:null}const Mi=C(`
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
        <p bind="ratingsFailure" class="mteefields__conflict" role="alert"></p>

        <div bind="lengthsHost"></div>
    </div>
`);class Pi extends E{static styles=`
        .mteefields {
            display: flex;
            flex-direction: column;
            gap: ${r("manage-stack-gap")};
            min-width: 0;

            & .mteefields__grid {
                ${Ae()}
            }

            & .mteefields__field {
                ${ye()}
            }

            & .mteefields__label {
                ${we()}
            }

            & .mteefields__control {
                ${ae()}
            }

            & .mteefields__hint {
                ${se()}
                margin: 0;
            }

            & .mteefields__error {
                ${ue()}
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

            /* The server's rating refusal, under the two tracks it is about. */
            & .mteefields__conflict {
                ${ue()}
                margin: 0;

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
                ${ls()}
            }

            & .mtrating__figures {
                ${Ae()}

                &[hidden] { display: none; }
            }

            /* The worded annotation that stands in for the figures — muted, in
               words, never a symbol (design-guidelines §4). */
            & .mtrating__absent {
                ${se()}
                margin: 0;

                &[hidden] { display: none; }
            }

            & .mtrating__error {
                ${ue()}
                margin: 0;

                &[hidden] { display: none; }
            }
        }
    `;parts=new m(Ft($s(0)));nameInput=null;colourInput=null;ratingInputs=new Map;grid=null;render(){const e={name:`${this.props.idPrefix}-name`,colour:`${this.props.idPrefix}-colour`,colours:`${this.props.idPrefix}-colour-options`},t=()=>this.props.busy?.get()??!1,s=this.wire(Mi,{nameLabel:{htmlFor:e.name},name:{id:e.name,"aria-invalid":()=>String(this.props.errors.get().name!==void 0),disabled:t,oninput:l=>this.patch({name:l.target.value})},nameError:{id:`${e.name}-error`,textContent:()=>this.props.errors.get().name??"",hidden:()=>this.props.errors.get().name===void 0},colourLabel:{htmlFor:e.colour},colour:{id:e.colour,"aria-describedby":`${e.colour}-hint`,disabled:t,oninput:l=>this.patch({colour:l.target.value})},colours:{id:e.colours},colourHint:{id:`${e.colour}-hint`,textContent:`${xi}. Optional`},ratingsFailure:{textContent:()=>this.props.ratingsFailure?.get()??"",hidden:()=>(this.props.ratingsFailure?.get()??null)===null}});this.nameInput=this.ref(s,"name"),this.colourInput=this.ref(s,"colour"),this.colourInput.setAttribute("list",e.colours);const i=this.ref(s,"colours");for(const l of $i){const c=document.createElement("option");c.value=l,i.appendChild(c)}const o=this.ref(s,"swatch");this.track(b(()=>{const l=ks(this.parts.get().colour);o.hidden=l===null,o.style.backgroundColor=l??""}));const a=this.ref(s,"ratingsHost");for(const l of j)a.appendChild(this.ratingBlock(l,t));return this.grid=this.spawn(Fi,this.ref(s,"lengthsHost"),{idPrefix:this.props.idPrefix,errors:this.props.errors,busy:{get:t},holeCount:this.props.holeCount}),s}ratingBlock(e,t){const s=document.createElement("section");s.className="mtrating";const i=document.createElement("div");i.className="mtrating__head";const o=document.createElement("h4");o.className="mtrating__title",o.id=`${this.props.idPrefix}-${e}-title`,o.textContent=`${A(e)}’s rating`,i.appendChild(o);const a=document.createElement("div");a.className="mtrating__seg",a.setAttribute("role","group"),a.setAttribute("aria-labelledby",o.id);const l=[{label:"Rated",rated:!0},{label:"Not rated",rated:!1}],c=l.map(_=>{const T=document.createElement("button");return T.type="button",T.textContent=_.label,T.addEventListener("click",()=>this.setRated(e,_.rated)),a.appendChild(T),T});i.appendChild(a),s.appendChild(i);const d=document.createElement("div");d.className="mtrating__figures";for(const _ of G){const T=document.createElement("div");T.className="mteefields__field";const L=`${this.props.idPrefix}-${e}-${_.key}`,z=document.createElement("label");z.className="mteefields__label",z.htmlFor=L,z.textContent=_.label,T.appendChild(z);const D=document.createElement("input");D.type="text",D.className="mteefields__control",D.id=L,D.autocomplete="off",D.inputMode=_.whole?"numeric":"decimal",D.addEventListener("input",()=>this.patchRating(e,{[_.key]:D.value})),this.ratingInputs.set(`${e}:${_.key}`,D),T.appendChild(D),d.appendChild(T)}s.appendChild(d);const h=document.createElement("p");h.className="mtrating__absent";const p=A(e).toLowerCase();h.textContent=`No ${p}’s rating. The tee is not offered for ${p}, and rounds cannot use it for a ${e==="M"?"man":"woman"}’s handicap. If a tee role on this course still assigns this tee to ${p}, saving is refused until you clear that assignment under Tee roles.`,s.appendChild(h);const g=document.createElement("p");return g.className="mtrating__error",g.setAttribute("role","alert"),s.appendChild(g),this.track(b(()=>{const _=this.parts.get().ratings[e].rated,T=t();c.forEach((L,z)=>{L.setAttribute("aria-pressed",String(l[z].rated===_)),L.disabled=T}),d.hidden=!_,h.hidden=_;for(const L of G){const z=this.ratingInputs.get(`${e}:${L.key}`);z&&(z.disabled=T)}})),this.track(b(()=>{const _=this.props.errors.get().ratings?.[e];g.textContent=_??"",g.hidden=_===void 0;for(const T of G){const L=this.ratingInputs.get(`${e}:${T.key}`);L&&L.setAttribute("aria-invalid",String(_!==void 0))}})),s}current(){const e=this.parts.peek();return{name:e.name,colour:e.colour,ratings:{M:{...e.ratings.M},F:{...e.ratings.F}},lengths:(this.grid?.lengths.peek()??[]).map(t=>({...t}))}}seed(e){this.parts.set(Ft(e)),this.nameInput&&(this.nameInput.value=e.name),this.colourInput&&(this.colourInput.value=e.colour);for(const t of j)for(const s of G){const i=this.ratingInputs.get(`${t}:${s.key}`);i&&(i.value=e.ratings[t][s.key])}this.grid?.seed(e.lengths)}focusFirst(){this.nameInput?.focus()}focusInvalid(e){if(e.name!==void 0&&this.nameInput)return this.nameInput.focus(),!0;for(const t of j){if(e.ratings?.[t]===void 0)continue;const s=e.ratingFields?.[t]??G[0].key,i=this.ratingInputs.get(`${t}:${s}`);if(i)return i.focus(),i.select(),!0}return this.grid?.focusInvalid(e)??!1}patch(e){this.parts.update(t=>({...t,...e}))}setRated(e,t){this.parts.update(s=>({...s,ratings:{...s.ratings,[e]:{...s.ratings[e],rated:t}}}))}patchRating(e,t){this.parts.update(s=>({...s,ratings:{...s.ratings,[e]:{...s.ratings[e],...t}}}))}}function Ft(n){return{name:n.name,colour:n.colour,ratings:{M:{...n.ratings.M},F:{...n.ratings.F}}}}const Ne="__new",ji="tee_rating_removal_blocked",qi=C(`
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
`);class Ui extends E{static styles=`
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
    `;tees=this.inject(Ss);courses=this.inject(ve);editor=new fe;errors=new m({});ratingConflict=new m(null);deleteOpen=new m(!1);deleteTarget=new m(null);deleteFailure=new m(null);deletingId=new m(null);fields=null;actionEffects=new Map;rows=new F(()=>{const e=this.holeCount();return this.tees.tees.get().map(t=>({...t,courseHoleCount:e}))});columns=[{key:"name",header:"Name",stackedLabel:!1,cell:e=>e.name},{key:"colour",header:"Colour",cell:e=>this.colourCell(e)},{key:"rated",header:"Rated for",cell:e=>Ni(e)},{key:"length",header:"Total length",cell:e=>{const t=Ii(e);return t!==""?t:this.muted("Not measured")}},{key:"holes",header:"Holes measured",type:"numeric",cell:e=>`${Si(e)} of ${e.courseHoleCount}`}];render(){const e=this.wire(qi,{new:{disabled:()=>this.editing()||this.deletingId.get()!==null,onclick:()=>this.openCreate()},panel:{hidden:()=>!this.editing(),onsubmit:t=>{t.preventDefault(),this.submit()}},panelTitle:{textContent:()=>this.panelTitle()},panelError:{textContent:()=>this.panelError()??"",hidden:()=>this.panelError()===null},submit:{textContent:()=>this.submitLabel(),disabled:()=>this.saving()},cancel:{disabled:()=>this.saving(),onclick:()=>this.closePanel()},loadError:{textContent:()=>this.tees.error.get()??"",hidden:()=>this.tees.error.get()===null},retry:{hidden:()=>this.tees.error.get()===null,onclick:()=>{this.tees.load(this.props.courseId,!0)}},deleteError:{textContent:()=>this.deleteFailure.get()??"",hidden:()=>this.deleteFailure.get()===null},loadingNote:{textContent:"Loading tees…",hidden:()=>this.tees.loaded.get()}});return this.fields=this.spawn(Pi,this.ref(e,"fieldsHost"),{idPrefix:"manage-tee",errors:this.errors,busy:{get:()=>this.saving()},holeCount:{get:()=>this.holeCount()},ratingsFailure:this.ratingConflict}),this.spawn(re,this.ref(e,"tableHost"),{columns:this.columns,rows:this.rows,rowKey:t=>t.id,caption:"Tees",captionHidden:!0,actions:t=>this.rowActions(t),actionsHeader:"Tee actions",empty:{heading:"No tees yet",body:"Add the tees this course is played from, then give each one its hole lengths and ratings.",action:{label:"New tee",onclick:()=>this.openCreate()}}}),this.spawn(X,this.ref(e,"confirmHost"),_e({open:this.deleteOpen,title:()=>{const t=this.deleteTarget.get();return t?`Delete ${t.name}?`:"Delete this tee?"},consequence:()=>{const t=this.deleteTarget.get();return t?Ai(t.name):Oi},confirmLabel:"Delete tee",onconfirm:()=>{this.remove()},oncancel:()=>this.deleteTarget.set(null)})),this.track(oe(this.deleteOpen,()=>this.deleteTarget.set(null))),this.track(()=>{for(const t of this.actionEffects.values())t();this.actionEffects.clear()}),e}onMount(){this.tees.load(this.props.courseId),this.courses.load(this.props.clubId);const e=t=>{t.key==="Escape"&&(this.deleteOpen.get()||!this.editing()||this.saving()||this.closePanel())};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}holeCount(){return this.courses.byId(this.props.courseId)?.holeCount??0}editing(){return this.editor.key.get()!==null}creating(){return this.editor.key.get()===Ne}saving(){const e=this.editor.key.get();return e!==null&&this.editor.isSaving(e)}panelTitle(){if(this.creating())return"New tee";const e=this.openTee();return e?`Edit ${e.name}`:"Edit tee"}submitLabel(){return this.creating()?this.saving()?"Creating…":"Create tee":this.saving()?"Saving…":"Save tee"}panelError(){if(this.ratingConflict.get()!==null)return null;const e=this.editor.key.get();if(e===null)return null;const t=this.editor.errorFor(e);if(t!==null)return t;const s=this.errors.get(),i=(s.name!==void 0?1:0)+(s.lengths!==void 0?1:0)+Object.keys(s.ratings??{}).length;return i===0?null:i===1?"Nothing was saved — fix the field marked above.":"Nothing was saved — fix the fields marked above."}openTee(){const e=this.editor.key.get();return e===null||e===Ne?null:this.tees.tees.get().find(t=>t.id===e)??null}openCreate(){this.saving()||(this.clearMessages(),this.editor.begin(Ne),this.fields?.seed($s(this.holeCount())),this.fields?.focusFirst())}openEdit(e){this.saving()||(this.clearMessages(),this.editor.begin(e.id),this.fields?.seed(ki(e,this.holeCount())),this.fields?.focusFirst())}closePanel(){this.editor.cancel(),this.clearMessages()}clearMessages(){this.errors.set({}),this.ratingConflict.set(null)}async submit(){if(!this.fields||this.saving())return;const e=this.editor.key.get();if(e===null)return;this.ratingConflict.set(null);const t=this.fields.current(),s=Ei(t,this.holeCount());if(this.errors.set(s),Ti(s)){this.fields.focusInvalid(s);return}await this.editor.commit(async()=>{const i=e===Ne?await this.tees.create(this.props.courseId,this.props.clubId,t):await this.tees.update(e,t);return!i.ok&&i.code===ji&&this.ratingConflict.set(i.message),i})}colourCell(e){if(e.colour===null||e.colour.trim()==="")return this.muted("Not set");const t=document.createElement("span");t.className="mtees__colour";const s=ks(e.colour);if(s!==null){const o=document.createElement("span");o.className="mtees__swatch",o.setAttribute("aria-hidden","true"),o.style.backgroundColor=s,t.appendChild(o)}const i=document.createElement("span");return i.textContent=Es(e.colour),i.textContent!==e.colour.trim()&&(t.title=e.colour.trim()),t.appendChild(i),t}muted(e){const t=document.createElement("span");return t.className="mtees__muted",t.textContent=e,t}rowActions(e){const t=q("Edit",{onclick:()=>this.openEdit(e)}),s=q("Delete",{onclick:()=>{this.deleteFailure.set(null),this.deleteTarget.set(e),this.deleteOpen.set(!0)}});return this.actionEffects.get(e.id)?.(),this.actionEffects.set(e.id,b(()=>{const i=this.deletingId.get(),o=i!==null||this.editing();s.textContent=i===e.id?"Deleting…":"Delete",s.disabled=o,t.disabled=o})),[t,s]}async remove(){const e=this.deleteTarget.get();if(!(!e||this.deletingId.get()!==null)){this.deleteFailure.set(null),this.deletingId.set(e.id);try{const t=await this.tees.remove(e.id,this.props.clubId);t.ok||this.deleteFailure.set(`${e.name} — ${t.message}`)}finally{this.deletingId.set(null),this.deleteTarget.set(null)}}}}function Bi(n,e,t){return(s,i)=>{const o=a=>{const l=a.target;s.contains(l)||e()};i.track(b(()=>{n.get()?document.addEventListener("pointerdown",o,!0):document.removeEventListener("pointerdown",o,!0)})),i.track(()=>document.removeEventListener("pointerdown",o,!0))}}function qe(n){return typeof n=="object"&&n!==null&&typeof n.get=="function"}const f=n=>`var(--${n})`,Mt="http://www.w3.org/2000/svg";function Ki(){const n=document.createElementNS(Mt,"svg");n.setAttribute("width","12"),n.setAttribute("height","8"),n.setAttribute("viewBox","0 0 12 8"),n.setAttribute("fill","none"),n.setAttribute("aria-hidden","true"),n.setAttribute("focusable","false");const e=document.createElementNS(Mt,"path");return e.setAttribute("d","M1 1.5 6 6.5 11 1.5"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","1.5"),e.setAttribute("stroke-linecap","round"),e.setAttribute("stroke-linejoin","round"),e.setAttribute("fill","none"),n.appendChild(e),n}const pe=class pe extends E{constructor(){super(...arguments),this.uid=`ui-select-${pe.seq++}`,this.open=new m(!1),this.highlightIndex=new m(-1),this.query=new m(""),this.optionEls=[]}get isMulti(){return this.props.multiple===!0}get multi(){return this.props}get single(){return this.props}currentOptions(){return qe(this.props.options)?this.props.options.get():this.props.options}visibleOptions(){const e=this.currentOptions();if(!this.props.searchable)return e;const t=this.query.get().trim().toLowerCase();if(t==="")return e;const s=[];let i=null;for(const o of e){if(o.disabled){i=o;continue}o.label.toLowerCase().includes(t)&&(i&&(s.push(i),i=null),s.push(o))}return s}selectedValues(){if(this.isMulti)return this.multi.values.get();const e=this.single.value.get();return e?[e]:[]}placeholderText(){const e=this.props.placeholder;return(typeof e=="function"?e():e)??""}formatCount(e){return this.multi.countLabel?this.multi.countLabel(e):String(e)}searchPlaceholderText(){const e=this.props.searchPlaceholder;return(typeof e=="function"?e():e)??""}setQuery(e){te(()=>{this.query.set(e),this.highlightIndex.set(this.visibleOptions().findIndex(t=>!t.disabled))})}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e,this.mix(e,Bi(this.open,()=>this.open.set(!1)));const t=this.props.zIndex??50,s=this.isMulti;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const i=document.createElement("span");i.className="ui-select__trigger-label",this.triggerEl.appendChild(i);const o=document.createElement("span");if(o.className="ui-select__chevron",o.appendChild(Ki()),o.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(o),this.triggerEl.addEventListener("click",l=>{l.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",l=>{this.handleTriggerKeydown(l)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",l=>{this.handleDropdownKeydown(l)}),this.props.searchable){const l=document.createElement("div");l.className="ui-select__search";const c=document.createElement("input");c.className="ui-select__search-input",c.type="text",c.setAttribute("aria-autocomplete","list"),c.addEventListener("input",()=>{this.setQuery(c.value)}),c.addEventListener("keydown",d=>{["ArrowDown","ArrowUp","Enter","Escape","Tab"].includes(d.key)||d.stopPropagation()}),l.appendChild(c),this.searchEl=c,this.dropdownEl.appendChild(l)}this.listEl=document.createElement("div"),this.listEl.className="ui-select__list",this.listEl.setAttribute("role","listbox"),s&&this.listEl.setAttribute("aria-multiselectable","true"),this.dropdownEl.appendChild(this.listEl),s&&(this.countEl=document.createElement("div"),this.countEl.className="ui-select__count",this.countEl.setAttribute("role","status"),this.countEl.setAttribute("aria-live","polite"),this.dropdownEl.appendChild(this.countEl)),e.appendChild(this.dropdownEl);const a=l=>{this.optionEls=[],this.listEl.textContent="";for(let c=0;c<l.length;c++){const d=l[c],h=document.createElement("button");if(h.className=s?"ui-select__option ui-select__option--multi":"ui-select__option",h.setAttribute("type","button"),h.id=`${this.uid}-opt-${c}`,d.disabled){h.classList.add("ui-select__option--header"),h.disabled=!0,h.setAttribute("role","presentation"),h.setAttribute("aria-disabled","true");const g=document.createElement("span");g.className="ui-select__option-label",g.textContent=d.label,h.appendChild(g),this.listEl.appendChild(h),this.optionEls.push(h);continue}if(h.setAttribute("role","option"),s){const g=document.createElement("span");g.className="ui-select__checkbox",g.setAttribute("aria-hidden","true"),h.appendChild(g)}if(d.icon){const g=document.createElement("span");g.className="ui-select__option-icon",g.textContent=d.icon,h.appendChild(g)}const p=document.createElement("span");if(p.className="ui-select__option-label",p.textContent=d.label,h.appendChild(p),!s){const g=document.createElement("span");g.className="ui-select__check",g.setAttribute("aria-hidden","true"),h.appendChild(g)}h.addEventListener("click",g=>{g.stopPropagation(),this.chooseOption(d.value)}),h.addEventListener("mouseenter",()=>{this.highlightIndex.set(c)}),this.listEl.appendChild(h),this.optionEls.push(h)}S(()=>{const c=this.highlightIndex.get();c>=0&&this.optionEls[c]&&this.optionEls[c].classList.add("ui-select__option--highlighted")})};return qe(this.props.options)||this.props.searchable?this.track(b(()=>{a(this.visibleOptions())})):a(this.props.options),this.searchEl&&this.track(b(()=>{const l=this.searchPlaceholderText();this.searchEl.placeholder=l,this.searchEl.setAttribute("aria-label",l)})),this.track(b(()=>{const l=this.currentOptions(),c=this.selectedValues();if(s){const h=c.length;if(h>0)i.textContent=this.formatCount(h),this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const p=this.placeholderText();i.textContent=p,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!p)}this.countEl&&(this.countEl.textContent=this.formatCount(h))}else{const h=this.single.value.get(),p=l.find(g=>g.value===h);if(p)i.textContent=p.icon?`${p.icon} ${p.label}`:p.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const g=this.placeholderText();i.textContent=g,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!g)}}const d=this.visibleOptions();for(let h=0;h<d.length;h++){const p=this.optionEls[h];if(!p||d[h].disabled)continue;const g=c.includes(d[h].value);p.setAttribute("aria-selected",String(g)),p.classList.toggle("ui-select__option--selected",g);const _=p.querySelector(".ui-select__check");_&&(_.textContent=g?"✓":"");const T=p.querySelector(".ui-select__checkbox");T&&(T.textContent=g?"✓":"")}})),this.track(b(()=>{const l=this.open.get();this.dropdownEl.classList.toggle("open",l),o.classList.toggle("ui-select__chevron--open",l),this.triggerEl.setAttribute("aria-expanded",String(l)),l?S(()=>{const c=this.visibleOptions(),d=this.selectedValues(),h=c.findIndex(g=>!g.disabled&&d.includes(g.value)),p=c.findIndex(g=>!g.disabled);this.highlightIndex.set(h>=0?h:p)}):this.searchEl&&S(()=>{this.searchEl.value="",this.query.set("")})})),this.track(b(()=>{const l=this.highlightIndex.get();for(let c=0;c<this.optionEls.length;c++)this.optionEls[c].classList.toggle("ui-select__option--highlighted",c===l);l>=0&&this.optionEls[l]&&(this.triggerEl.setAttribute("aria-activedescendant",`${this.uid}-opt-${l}`),this.optionEls[l].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(qe(this.props.disabled)?this.track(b(()=>{const l=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",l),this.triggerEl.disabled=l})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}chooseOption(e){if(this.isMulti){const t=this.multi.values.get();this.multi.values.set(t.includes(e)?t.filter(s=>s!==e):[...t,e]);return}te(()=>{this.single.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}commitHighlighted(){const e=this.highlightIndex.get(),t=this.visibleOptions();e>=0&&e<t.length&&!t[e].disabled&&this.chooseOption(t[e].value)}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.open.get()?this.commitHighlighted():this.open.set(!0);break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break;default:if(this.props.searchable&&e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault(),this.open.get()||this.open.set(!0);const t=this.query.get()+e.key;this.searchEl&&(this.searchEl.value=t,this.searchEl.focus()),this.setQuery(t)}break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":e.preventDefault(),this.commitHighlighted();break;case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=this.visibleOptions();if(t.length===0||!t.some(i=>!i.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}};pe.styles=`
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
        /* Filter field pinned above the scrolling list (searchable mode).
           Recessed like the trigger, separated from the list by a hairline. */
        .ui-select__search {
            padding: 6px;
            border-bottom: 1px solid ${f("border")};
        }
        .ui-select__search-input {
            width: 100%;
            padding: 6px 10px;
            border: 1px solid ${f("border")};
            border-radius: ${f("radius-sm")};
            background: ${f("bg")};
            color: ${f("text")};
            font-family: ${f("font-ui")};
            font-size: 0.875rem;
            line-height: 1.5;
        }
        .ui-select__search-input:focus-visible {
            outline: none;
            border-color: ${f("accent")};
            box-shadow: 0 0 0 3px ${f("accent-soft")};
        }
        .ui-select__search-input::placeholder {
            color: ${f("text-muted")};
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
    `,pe.seq=0;let tt=pe;function Wi(n,e){return`<button bind="${n}" class="minfo-dot" type="button" aria-expanded="false" aria-label="${Gi(e)}"><span aria-hidden="true">i</span></button>`}function Gi(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}const Vi=`
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
        }`,Ue={svart:0,black:0,vit:1,white:1,gul:2,yellow:2,blå:3,bla:3,blue:3,röd:4,rod:4,red:4,orange:5};function st(n){const e=n.name.trim().toLocaleLowerCase("sv-SE"),t=n.colour?.trim().toLocaleLowerCase("sv-SE")??"",s=e.split(/\s+/)[0]??"",i=Ue[e]??Ue[s]??Ue[t];if(i!==void 0)return{kind:"colour",rank:i};const o=/^(\d+(?:[.,]\d+)?)\s*(?:m)?$/i.exec(e);return o?{kind:"numeric",length:Number(o[1].replace(",","."))}:{kind:"other"}}function Yi(n){return n.map((e,t)=>({tee:e,index:t,classification:st(e)})).sort((e,t)=>{const s={numeric:0,colour:1,other:2};return e.classification.kind!==t.classification.kind?s[e.classification.kind]-s[t.classification.kind]:e.classification.kind==="numeric"&&t.classification.kind==="numeric"?t.classification.length-e.classification.length||e.index-t.index:e.classification.kind==="colour"&&t.classification.kind==="colour"?e.classification.rank-t.classification.rank||e.index-t.index:e.tee.name.localeCompare(t.tee.name,"sv-SE",{sensitivity:"base"})||e.index-t.index}).map(({tee:e})=>e)}function Ls(n,e){return n.ratings.some(t=>t.gender===e)}function Qi(n,e,t,s){const i=e.find(a=>a.roleKey===t&&a.gender===s)?.teeId,o=n.find(a=>a.id===i);return o&&Ls(o,s)?o:null}function Xi(n,e,t,s=null){const i=[s,"club"].filter((c,d,h)=>!!c&&h.indexOf(c)===d);for(const c of i){const d=Qi(n,e,c,t);if(d)return d.id}const o=t==="M"?2:4,a=Yi(n.filter(c=>Ls(c,t))),l=a.find(c=>{const d=st(c);return d.kind==="colour"&&d.rank===o});return l?l.id:a.length===0?"":a.every(c=>st(c).kind==="numeric")&&t==="M"?a[0].id:a.at(-1).id}const ze="",As="Not set";function Ji(n,e){return n.filter(t=>t.ratings.some(s=>s.gender===e))}function Zi(n){const e=n.colour?.trim()??"";if(e==="")return n.name;const t=Es(e);return t.toLocaleLowerCase("sv-SE")===n.name.trim().toLocaleLowerCase("sv-SE")?n.name:`${n.name} · ${t}`}function er(n,e){return[{value:ze,label:As},...Ji(n,e).map(t=>({value:t.id,label:Zi(t)}))]}function nt(n,e,t){return n.find(s=>s.roleKey===e&&s.gender===t)?.teeId??ze}function tr(n,e,t,s){const i=Xi(n,e,s,t),o=n.find(a=>a.id===i);return o?nt(e,t,s)===o.id?{via:"role",teeName:o.name}:nt(e,"club",s)===o.id?{via:"club",teeName:o.name}:{via:"convention",teeName:o.name}:{via:"none"}}function sr(n,e){return n.includes("no rating for the mapped gender")?`That tee has no rating for ${A(e).toLowerCase()} any more, so it cannot be chosen here. Rate it above, or pick another tee.`:n.includes("must belong to the mapped course")?"That tee is no longer one of this course’s tees. Reload the page to see the tees as they stand.":n}function nr(n,e,t){const s=`A ${n.displayName} / ${A(e)} round`;switch(t.via){case"role":return`${s} plays from ${t.teeName} today.`;case"club":return`${s} plays from ${t.teeName} today, taken from the Club row because this row is empty.`;case"convention":return`${s} plays from ${t.teeName} today, picked by tee name because no row above applies.`;case"none":return`${s} has no tee to start from — no tee on this course is rated for ${A(e).toLowerCase()}.`}}class ir{catalog=new m([]);courseId=new m(null);mappings=new m([]);loading=new m(!1);error=new m(null);loaded=new m(!1);inflight=null;catalogFetched=!1;load(e,t=!1){return this.courseId.get()!==e&&(this.courseId.set(e),this.mappings.set([]),this.loaded.set(!1),this.inflight=null),!t&&this.inflight?this.inflight:(this.inflight=(async()=>{this.loading.set(!0),this.error.set(null);try{const[s,i]=await Promise.all([this.catalogFetched?Promise.resolve(this.catalog.get()):I.courses.teeRoleCatalog(),I.courses.teeRoles({courseId:e})]);if(this.catalog.set(s),this.catalogFetched=!0,this.courseId.get()!==e)return;this.mappings.set(i)}catch(s){this.error.set(R(s,"Could not load the tee roles. Check your connection and try again.")),this.inflight=null}finally{this.loading.set(!1),this.loaded.set(!0)}})(),this.inflight)}mappedTeeId(e,t){return nt(this.mappings.get(),e,t)}async setRole(e,t,s){const i=this.courseId.get();return i===null?{ok:!1,message:"No course is loaded."}:this.write(()=>I.courses.setTeeRole({courseId:i,roleKey:e,gender:t,teeId:s}),"Could not save the tee role. Check your connection and try again.")}async clearRole(e,t){const s=this.courseId.get();return s===null?{ok:!1,message:"No course is loaded."}:this.write(()=>I.courses.clearTeeRole({courseId:s,roleKey:e,gender:t}),"Could not clear the tee role. Check your connection and try again.")}async write(e,t){try{await e()}catch(i){return{ok:!1,message:R(i,t)}}const s=this.courseId.get();return s!==null&&await this.load(s,!0),{ok:!0}}}const rr=C(`
    <section class="mroles">
        <header class="mroles__head">
            <div class="mroles__heading">
                <div class="mroles__title-line">
                    <h2 class="mroles__title">Tee roles</h2>
                    ${Wi("infoDot","How tee roles are used")}
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
`),or=C(`
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
`),ar=C('<li bind="line" class="mroles__resolution"></li>');class lr extends E{static styles=`
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
            @media ${os} {
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
            @media ${as} {
                & .mrole {
                    gap: ${u("md")};
                }
            }
        }
        ${Vi}
    `;tees=this.inject(Ss);roles=this.inject(ir);infoOpen=new m(!1);roleGenders=new F(()=>this.roles.catalog.get().flatMap(e=>j.map(t=>({key:`${e.roleKey}:${t}`,role:e,gender:t}))));section=null;render(){const e=this.wire(rr,{infoDot:{onclick:()=>this.infoOpen.set(!this.infoOpen.get()),"aria-expanded":()=>this.infoOpen.get()?"true":"false"},info:{hidden:()=>!this.infoOpen.get()},infoClose:{onclick:()=>this.infoOpen.set(!1)},loadError:{textContent:()=>this.roles.error.get()??"",hidden:()=>this.roles.error.get()===null},retry:{hidden:()=>this.roles.error.get()===null,onclick:()=>{this.roles.load(this.props.courseId,!0)}},loadingNote:{textContent:"Loading tee roles…",hidden:()=>this.roles.loaded.get()},noTees:{textContent:"No tee on this course carries a rating yet, so there is nothing to point a role at. Add a tee with a rating above and it will appear in these lists.",hidden:()=>!this.settled()||this.hasRatedTee()},grid:{hidden:()=>!this.roles.loaded.get()||this.roles.catalog.get().length===0}});return this.$each(this.ref(e,"resolutions"),this.roleGenders,(t,s,i)=>this.wireEl(ar,{line:()=>this.sentenceFor(t.role,t.gender)},i),t=>t.key),this.$each(this.ref(e,"rows"),this.roles.catalog,(t,s,i)=>this.roleRow(t,i),t=>t.roleKey),this.section=e.firstElementChild,e}onMount(){const{courseId:e}=this.props;this.tees.load(e),this.roles.load(e),this.track(oe(this.infoOpen));const t=s=>{if(!this.infoOpen.get())return;const i=s.target;i instanceof Node&&this.section?.contains(i)||this.infoOpen.set(!1)};document.addEventListener("pointerdown",t,!0),this.track(()=>document.removeEventListener("pointerdown",t,!0)),this.watchTeeRatings(e)}watchTeeRatings(e){let t=null;this.track(b(()=>{if(!this.tees.loaded.get())return;const s=cr(this.tees.tees.get());if(t===null||s===t){t=s;return}t=s,this.roles.load(e,!0)}))}roleRow(e,t){const s=this.cell(e.roleKey,"M",t),i=this.cell(e.roleKey,"F",t),o=this.wireEl(or,{name:()=>e.displayName,menBusy:{textContent:()=>s.busy.get(),hidden:()=>s.busy.get()===""},menError:{textContent:()=>s.error.get()??"",hidden:()=>s.error.get()===null},womenBusy:{textContent:()=>i.busy.get(),hidden:()=>i.busy.get()===""},womenError:{textContent:()=>i.error.get()??"",hidden:()=>i.error.get()===null}},t);return this.mountSelect(this.ref(o,"men"),s,e,"M",t),this.mountSelect(this.ref(o,"women"),i,e,"F",t),o}mountSelect(e,t,s,i,o){const a=new tt({value:t.value,options:{get:()=>er(this.tees.tees.get(),i)},placeholder:As,disabled:{get:()=>t.busy.get()!==""}});a.mount(e),o(()=>a.destroy()),e.querySelector(".ui-select__trigger")?.setAttribute("aria-label",`${s.displayName}, ${A(i)}`)}cell(e,t,s){const i=new m(this.roles.mappedTeeId(e,t)),o=new m(""),a=new m(null);let l=i.get();s(b(()=>{const d=this.roles.mappedTeeId(e,t);l=d,i.set(d),a.set(null)}));const c=async d=>{o.set(d===ze?"Clearing…":"Saving…"),a.set(null);const h=d===ze?await this.roles.clearRole(e,t):await this.roles.setRole(e,t,d);if(o.set(""),h.ok)return;const p=this.roles.mappedTeeId(e,t);a.set(sr(h.message,t)),l=p,i.set(p)};return s(b(()=>{const d=i.get();d!==l&&queueMicrotask(()=>{i.get()===d&&d!==l&&c(d)})})),{value:i,busy:o,error:a}}sentenceFor(e,t){return nr(e,t,tr(this.tees.tees.get(),this.roles.mappings.get(),e.roleKey,t))}settled(){return this.roles.loaded.get()&&this.tees.loaded.get()}hasRatedTee(){return this.tees.tees.get().some(e=>e.ratings.length>0)}}function cr(n){return n.map(e=>`${e.id}:${e.ratings.map(t=>t.gender).sort().join("")}`).join("|")}const dr=C(`
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
`),hr=C(`
    <li class="mroute">
        <span bind="name" class="mroute__name"></span>
        <span bind="meta" class="mroute__meta"></span>
    </li>
`);class ur extends E{static styles=`
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
    `;templates=new m([]);error=new m(null);loaded=new m(!1);render(){const e=this.wire(dr,{loadError:{textContent:()=>this.error.get()??"",hidden:()=>this.error.get()===null},retry:{hidden:()=>this.error.get()===null,onclick:()=>{this.load()}},loadingNote:{textContent:"Loading routes…",hidden:()=>this.loaded.get()},empty:{textContent:"No routes saved for this course yet. Rounds play all of its holes.",hidden:()=>!this.loaded.get()||this.error.get()!==null||this.rows().length>0},list:{hidden:()=>this.rows().length===0},deferred:{textContent:"Routes are authored elsewhere for now — this list is read-only, and a route cannot be added or changed here.",hidden:()=>!this.loaded.get()||this.error.get()!==null}});return this.$each(this.ref(e,"list"),()=>this.rows(),(t,s,i)=>this.wireEl(hr,{name:{textContent:()=>t.name},meta:{textContent:()=>pr(t)}},i),t=>t.id),e}onMount(){this.load()}rows(){return this.templates.get()}async load(){const e=this.props.courseId;this.error.set(null),this.loaded.set(!1);try{const t=await I.courseRouteTemplates.listByCourse({courseId:e});this.templates.set(mr(t))}catch(t){this.error.set(R(t,"Could not load the routes. Check your connection and try again."))}finally{this.loaded.set(!0)}}}function mr(n){return[...n].sort((e,t)=>t.updatedAt.localeCompare(e.updatedAt))}function pr(n){const e=n.route.playHoles.length,t=gr(n.updatedAt),s=`${e} ${e===1?"hole":"holes"}`;return t===""?s:`${s} · Updated ${t}`}function gr(n,e=typeof navigator>"u"?"en":navigator.language){const t=new Date(n);return Number.isNaN(t.getTime())?"":new Intl.DateTimeFormat(e,{dateStyle:"medium"}).format(t)}const fr=C(`
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
`);class br extends E{static styles=`
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
    `;router=this.inject(B);crumbs=this.inject(be);clubs=this.inject(He);courses=this.inject(ve);params=this.router.params(Kn);render(){const e=this.wire(fr,{loadingNote:{textContent:"Loading course…",hidden:()=>this.settled()},loadError:{textContent:()=>this.courses.error.get()??"",hidden:()=>this.courses.error.get()===null},retry:{hidden:()=>this.courses.error.get()===null,onclick:()=>{this.courses.load(this.clubId(),!0)}},missing:{hidden:()=>!this.settled()||this.courses.error.get()!==null||this.course()!==null},backMissing:{onclick:()=>this.backToClub()},body:{hidden:()=>this.course()===null},title:()=>this.course()?.name??"",subtitle:()=>this.summary(),back:{onclick:()=>this.backToClub()}}),t=this.courseId();return t!==""&&(this.spawn(_i,this.ref(e,"holesHost"),{courseId:t}),this.spawn(Ui,this.ref(e,"teesHost"),{clubId:this.clubId(),courseId:t}),this.spawn(lr,this.ref(e,"teeRolesHost"),{courseId:t}),this.spawn(ur,this.ref(e,"routesHost"),{courseId:t})),e}onMount(){const e=this.clubId();if(e===""||this.courseId()===""){this.router.navigate(P,!0);return}this.clubs.load(),this.courses.load(e),this.track(b(()=>{this.crumbs.set([{label:"Clubs",path:P},{label:this.clubs.byId(e)?.name??"Club",path:Oe(e)},{label:this.course()?.name??"Course"}])}))}clubId(){return this.params.get().clubId}courseId(){return this.params.get().courseId}course(){const e=this.courseId();return e===""?null:this.courses.byId(e)}settled(){return this.courses.loaded.get()}summary(){const e=this.course();if(!e)return"";const t=this.clubs.byId(this.clubId()),s=`${e.holeCount} holes`;return t?`${s} at ${t.name}.`:`${s}.`}backToClub(){this.router.navigate(Oe(this.clubId()))}}const _r=[{id:"courses",label:"Courses",path:P,routes:{[P]:Vn,[rt]:ai,[ot]:br},unlocked:n=>n.canManageCourses()}];function $e(n){return _r.filter(e=>e.unlocked(n))}function yr(n){const e={};for(const t of $e(n))Object.assign(e,t.routes);return e}const wr=C(`
    <nav class="mnav" aria-label="Sections">
        <ul bind="list" class="mnav__list"></ul>
    </nav>
`),vr=C(`
    <li class="mnav__item">
        <a bind="link" class="mnav__link"><span bind="label"></span></a>
    </li>
`);class Pt extends E{static styles=`
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
    `;router=this.inject(B);roles=this.inject(ie);render(){const e=this.wire(wr,{});return this.$each(this.ref(e,"list"),()=>$e(this.roles),(t,s,i)=>this.wireEl(vr,{link:{href:ne+t.path,className:()=>{const o=this.router.route.get();return o===t.path||o.startsWith(t.path+"/")?"mnav__link mnav__link--active":"mnav__link"},"aria-current":()=>{const o=this.router.route.get();return o===t.path||o.startsWith(t.path+"/")?"page":"false"},onclick:o=>{const a=o;a.metaKey||a.ctrlKey||a.shiftKey||a.button!==0||(o.preventDefault(),this.router.navigate(t.path),this.props.onNavigate?.())}},label:()=>t.label},i),t=>t.id),e}}const $r=C(`
    <section class="mnf">
        <h1 class="mnf__title">Nothing here</h1>
        <p class="mnf__body">That address does not match anything in Tapscore Manage.</p>
        <button bind="home" class="mnf__home" type="button"></button>
    </section>
`);class xr extends E{static styles=`
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
    `;router=this.inject(B);roles=this.inject(ie);crumbs=this.inject(be);onMount(){this.crumbs.set([])}render(){const e=$e(this.roles)[0];return this.wire($r,{home:{className:()=>e?"mnf__home":"mnf__home hidden",textContent:()=>e?`Go to ${e.label}`:"",onclick:()=>{e&&this.router.navigate(e.path,!0)}}})}}const kr=C(`
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
`),Er=C(`
    <li class="mshell__crumb">
        <span bind="sep" class="mshell__crumb-sep">/</span>
        <a bind="link" class="mshell__crumb-link"></a>
        <span bind="current" class="mshell__crumb-current" aria-current="page"></span>
    </li>
`),Cr=C(`
    <div class="mshell__identity-inner">
        <span bind="who" class="mshell__who"></span>
        <button bind="signout" class="mshell__signout" type="button">Sign out</button>
    </div>
`);class Tr extends E{static styles=`
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

            @media ${On} {
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
    `;router=this.inject(B);auth=this.inject(K);roles=this.inject(ie);breadcrumbs=this.inject(be);drawerOpen=new m(!1);render(){const e=$e(this.roles)[0];e&&this.router.route.get()==="/"&&this.router.navigate(e.path,!0);const t=this.wire(kr,{menu:{onclick:()=>this.drawerOpen.set(!0),"aria-expanded":()=>String(this.drawerOpen.get())},close:{onclick:()=>this.drawerOpen.set(!1)},scrim:{className:()=>this.drawerOpen.get()?"mshell__scrim open":"mshell__scrim",onclick:()=>this.drawerOpen.set(!1)},drawer:{className:()=>this.drawerOpen.get()?"mshell__drawer open":"mshell__drawer",inert:()=>!this.drawerOpen.get()}});return this.spawn(Pt,this.ref(t,"sidebarNav")),this.spawn(Pt,this.ref(t,"drawerNav"),{onNavigate:()=>this.drawerOpen.set(!1)}),this.identity(this.ref(t,"sidebarIdentity")),this.identity(this.ref(t,"drawerIdentity")),this.crumbs(this.ref(t,"crumbs")),this.$swap(this.ref(t,"outlet"),this.router.route,yr(this.roles),xr),t}onMount(){this.track(b(()=>{this.router.route.get(),this.drawerOpen.set(!1)}));const e=t=>{t.key==="Escape"&&this.drawerOpen.get()&&this.drawerOpen.set(!1)};document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e))}identity(e){e.appendChild(this.wire(Cr,{who:()=>{const t=this.auth.currentUser.get();return t?`Signed in as ${t.username}`:""},signout:{onclick:()=>{this.drawerOpen.set(!1),this.auth.logout()}}}))}crumbs(e){const t=document.createElement("ol");e.appendChild(t),this.$each(t,()=>this.breadcrumbs.crumbs.get(),(s,i,o)=>this.wireEl(Er,{sep:{className:()=>i===0?"mshell__crumb-sep hidden":"mshell__crumb-sep"},link:{className:()=>s.path?"mshell__crumb-link":"mshell__crumb-link hidden",href:s.path?ne+s.path:"",textContent:()=>s.path?s.label:"",onclick:a=>{const l=a;l.metaKey||l.ctrlKey||l.shiftKey||l.button!==0||(a.preventDefault(),s.path&&this.router.navigate(s.path))}},current:{className:()=>s.path?"mshell__crumb-current hidden":"mshell__crumb-current",textContent:()=>s.path?"":s.label}},o),Ln)}}const Be="Something went wrong on our end. Try again in a moment.";function Nr(n,e){const t=(n.details??[]).map(i=>i.path),s=i=>t.some(o=>o===`/${i}`);return s("password")?e==="register"?"Password must be at least 8 characters.":"Enter your password.":s("username")?"Enter your username.":s("displayName")?"Enter a display name.":s("handicapIndex")?"Handicap index must be a number (or leave it empty).":s("homeClubId")?'Pick a home club from the list, or leave it as "No home club".':e==="register"?"Check the details above and try again.":"Enter your username and password."}function Ir(n,e){if(n instanceof O)switch(n.status){case 400:return Nr(n,e);case 401:return"Wrong username or password.";case 404:return"That club is no longer available — pick another home club.";case 409:return e==="register"?"That username is taken. Pick another one.":Be;case 429:return"Too many sign-in attempts. Wait a minute, then try again.";default:return n.status>=500?Be:"That request could not be completed."}return n instanceof Error&&n.message==="Request timeout"?"That took too long. Check your connection and try again.":n instanceof Error?"Cannot reach the server. Check your connection and try again.":Be}const Sr=C(`
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
`);class Lr extends E{static styles=`
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
                    ${ns()}
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
    `;auth=this.inject(K);roles=this.inject(ie);username="";password="";busy=new m(!1);formError=new m("");render(){return this.wire(Sr,{form:{inert:()=>this.busy.get(),onsubmit:async e=>{e.preventDefault(),await this.submit()}},error:{className:()=>this.formError.get()?"msignin__error show":"msignin__error",textContent:()=>this.formError.get()},username:{oninput:e=>{this.username=e.target.value}},password:{oninput:e=>{this.password=e.target.value}},submit:{textContent:()=>this.busy.get()?"Signing in…":"Sign in"}})}async submit(){if(this.formError.set(""),!this.username.trim()||this.password===""){this.formError.set("Enter your username and password.");return}this.busy.set(!0);try{const e=await ts.login(this.username.trim(),this.password);this.roles.clear(),this.auth.error.set(null),this.auth.currentUser.set(e)}catch(e){this.formError.set(Ir(e,"login")),this.busy.set(!1)}}}const Ar=C(`
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
`);class Or extends E{static styles=`
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
    `;auth=this.inject(K);render(){return this.wire(Ar,{command:()=>`bun run grant:role grant ${this.auth.currentUser.get()?.username??"<username>"} super_admin`,who:()=>{const e=this.auth.currentUser.get();return e?`Signed in as ${e.username}`:""},signout:{onclick:()=>{this.auth.logout()}}})}}const Rr=C(`
    <div class="mboot">
        <p class="mboot__line">Loading…</p>
    </div>
`),zr=C(`
    <div class="mboot">
        <h1 class="mboot__title">Cannot reach the server</h1>
        <p class="mboot__line">Tapscore Manage could not check what you are allowed to manage.</p>
        <button bind="retry" class="mboot__retry" type="button">Try again</button>
    </div>
`),Os=`
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
`;class Dr extends E{static styles=Os;render(){return this.wire(Rr,{})}}class Hr extends E{static styles=Os;roles=this.inject(ie);auth=this.inject(K);render(){return this.wire(zr,{retry:{onclick:()=>{this.auth.load(),this.roles.load(!0)}}})}}const Fr=C('<div bind="gate" class="mapp"></div>');class Mr extends E{static styles=`
        .mapp { min-height: 100vh; min-height: 100dvh; }
    `;auth=this.inject(K);roles=this.inject(ie);gate=new F(()=>this.auth.loading.get()?"loading":this.auth.currentUser.get()===null?this.auth.error.get()?"failed":"signed-out":this.roles.error.get()?"failed":this.roles.loaded.get()?$e(this.roles).length>0?"ready":"denied":"loading");render(){const e=this.wire(Fr,{});return this.track(b(()=>{this.auth.currentUser.get()?this.roles.load():this.roles.clear()})),this.$swap(this.ref(e,"gate"),this.gate,{loading:Dr,failed:Hr,"signed-out":Lr,denied:Or,ready:Tr}),e}}U.get(Gt);_n();U.set(K,new yn(ts));const Pr=U.get(K);await an(Mr,"#app",{hot:void 0,onInit:async()=>{await Pr.load()}});export{Ke as A,E as C,B as R,m as S,Gt as T,v as a,te as b,F as c,Js as d,b as e,Xs as n,ke as r,C as t};
