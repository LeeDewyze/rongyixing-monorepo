import{r as p,j as i,i as x,w as b,Q as v}from"./index-BWyVlPBB.js";function w(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function y(e,r={}){try{const t=new URL(e),n=r.pageOrigin??"";return!n||t.origin===n?e:r.useDevProxy?`${r.devProxyPrefix??"/legal-doc"}${t.pathname}${t.search}${t.hash}`:e}catch{return e}}function U(e,r){const t=new URL(r).origin,n=`<base href="${w(r)}">`,a=`<script>
(function () {
  var docOrigin = ${JSON.stringify(t)};
  document.addEventListener(
    "click",
    function (event) {
      var el = event.target;
      while (el && el.tagName !== "A") el = el.parentElement;
      if (!el || !el.href) return;
      try {
        var url = new URL(el.href);
        if (url.origin !== docOrigin) {
          event.preventDefault();
          window.open(el.href, "_blank", "noopener,noreferrer");
        }
      } catch (_error) {}
    },
    true,
  );
})();
<\/script>`,s=`${n}${a}`;return/<head[^>]*>/i.test(e)?e.replace(/<head[^>]*>/i,l=>`${l}${s}`):/<html[^>]*>/i.test(e)?e.replace(/<html[^>]*>/i,l=>`${l}<head>${s}</head>`):`<!DOCTYPE html><html><head>${s}</head><body>${e}</body></html>`}async function A(e,r={}){const t=y(e,r);try{const n=await fetch(t);if(!n.ok)throw new Error(`HTTP ${n.status}`);const a=await n.text(),s=U(a,e),l=new Blob([s],{type:"text/html;charset=utf-8"});return URL.createObjectURL(l)}catch{return e}}const L="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox";function N({open:e,title:r,url:t,onClose:n}){const[a,s]=p.useState(""),[l,u]=p.useState(!1),c=p.useRef(null);if(p.useEffect(()=>{if(!e||!t){s(""),u(!1);return}let f=!1;return u(!0),A(t,{pageOrigin:window.location.origin,useDevProxy:!1}).then(o=>{if(f){o.startsWith("blob:")&&URL.revokeObjectURL(o);return}c.current&&(URL.revokeObjectURL(c.current),c.current=null),o.startsWith("blob:")&&(c.current=o),s(o),u(!1)}),()=>{f=!0,c.current&&(URL.revokeObjectURL(c.current),c.current=null)}},[e,t]),!e||!t)return null;const d=a.startsWith("blob:");return i.jsx("div",{className:"absolute inset-0 z-[60] flex flex-col",children:i.jsxs("div",{className:"legal-document-sheet-panel ryx-viewport-min flex flex-col bg-[#F5F6F9]",children:[i.jsx("div",{className:"shrink-0 bg-gradient-to-b from-brand-header-start to-brand-header-end pt-[env(safe-area-inset-top)]",children:i.jsxs("div",{className:"flex items-center px-1 pb-2 pt-1",children:[i.jsx("button",{type:"button",className:"flex h-11 w-10 shrink-0 items-center justify-center text-[26px] font-light leading-none text-white active:opacity-70","aria-label":"返回",onClick:n,children:"‹"}),i.jsx("h1",{className:"min-w-0 flex-1 truncate text-center text-[17px] font-medium text-white",children:r}),i.jsx("span",{className:"w-10 shrink-0"})]})}),l?i.jsx("div",{className:"flex min-h-0 flex-1 items-center justify-center text-sm text-[#8A94A6]",children:"加载中…"}):i.jsx("iframe",{title:r,src:a||void 0,className:"min-h-0 w-full flex-1 border-0 bg-white",sandbox:d?L:void 0})]})})}const $="010-89630300";function h(e){return e.replace(/\/+$/,"")}function g(){const e="https://app.rongtrip.cn".trim();return e?h(e):"https://app.rongtrip.cn"}function j(e){const r=(e==null?void 0:e.envAppBaseUrl)??g();try{const t=new URL(r).hostname;return t.startsWith("app.")?t.slice(4):t}catch{return v()}}function O(e,r){try{const{protocol:t}=new URL(r);return`${t}//app.${e}`}catch{return`http://app.${e}`}}function m(e={}){var n;if((n=e.clientAppUrl)!=null&&n.trim())return h(e.clientAppUrl.trim());const r=e.legacyAppDomain??j(e),t=e.envAppBaseUrl??g();return O(r,t)}function P(e={}){return`${m(e)}/ryxuseragreement.html`}function B(e={}){return`${m(e)}/privacy/ryx/privacy.html`}function E(){var r,t;const e=x().proxy.getApiConfig();return{mobileHomeUrl:(r=e==null?void 0:e.Urls)==null?void 0:r.MobileHomeUrl,clientAppUrl:(t=e==null?void 0:e.Urls)==null?void 0:t.ClientAppUrl}}function k(e=$,r="",t){var a;const n=e.trim()||r.trim();return n||(((a=t==null?void 0:t.Telephone)==null?void 0:a.trim())??"")}function C(e){if(!e.trim()){b("请联系贵公司客服！");return}window.location.href=`tel:${e.trim()}`}export{N as L,B as a,E as c,C as d,P as g,k as r};
