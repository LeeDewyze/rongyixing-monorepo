import{r as i,i as s,a as c}from"./workflow-site-NgStK2L5.js";function E(e){try{const t=i(e);return s(t)&&new URL(t).hostname===c()}catch{return!1}}function a(e){if(e===!0||e===1)return!0;if(typeof e=="string"){const t=e.trim().toLowerCase();return t==="true"||t==="1"||t==="yes"}return!!e}function w(e){if(!e)return null;if(typeof e=="string")try{const t=JSON.parse(e);return typeof t=="object"&&t!==null?t:null}catch{return null}return typeof e=="object"?e:null}function C(e){const t=w(e);if(!t||typeof t.type!="string")return!1;const o=t.type;if(o==="windowclose")return!0;const n=a(t.isBack)||a(t.payload)||a(t.data);return o==="back"||o==="appCheckGoBack"||o==="appCheckCanBack"?n:!1}function x(e,t){const o=t.startsWith("?")?t.slice(1):t,n=`<script type="text/javascript">
(function () {
  var __wfSearch = ${JSON.stringify(o)};
  function __wfGetParam(name) {
    try {
      return new URLSearchParams(__wfSearch).get(name) || "";
    } catch (e) {
      return "";
    }
  }
  ["getUrlParam", "getQueryString", "getQueryParam", "getUrlQueryString"].forEach(function (name) {
    if (typeof window[name] !== "function") {
      window[name] = __wfGetParam;
    }
  });
  var __wfTicket = __wfGetParam("ticket");
  if (__wfTicket) {
    window.ticket = __wfTicket;
  }
})();
<\/script>`;return e.includes("<head>")?e.replace("<head>",`<head>${n}`):`${n}${e}`}function h(e){const t=`<script type="text/javascript">
(function () {
  function notifyWorkflowComplete() {
    if (!window.parent || window.parent === window) return;
    try {
      window.parent.postMessage({ type: "windowclose" }, "*");
      window.parent.postMessage({ type: "appCheckGoBack", payload: true, isBack: true }, "*");
      window.parent.postMessage({ type: "back", isBack: true, payload: true }, "*");
    } catch (e) {}
  }
  function isSuccessMessage(message) {
    if (message == null) return false;
    var text = String(message);
    return text.indexOf("成功") >= 0 || text.toLowerCase().indexOf("success") >= 0;
  }
  function showEmbedAlert(message, onClose) {
    var text = message == null ? "" : String(message);
    var doc = document;
    var overlay = doc.createElement("div");
    overlay.setAttribute("data-ryx-embed-alert", "true");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;";
    var panel = doc.createElement("div");
    panel.style.cssText =
      "width:min(280px,100%);background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.18);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";
    var body = doc.createElement("div");
    body.style.cssText =
      "padding:28px 20px 20px;text-align:center;font-size:16px;line-height:1.5;color:#333;word-break:break-word;";
    body.textContent = text;
    var footer = doc.createElement("div");
    footer.style.cssText = "padding:0 20px 20px;display:flex;justify-content:center;";
    var button = doc.createElement("button");
    button.type = "button";
    button.textContent = "确定";
    button.style.cssText =
      "min-width:120px;height:40px;border:0;border-radius:8px;background:#2768fa;color:#fff;font-size:15px;font-weight:500;cursor:pointer;";
    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (typeof onClose === "function") onClose();
    }
    button.addEventListener("click", close);
    footer.appendChild(button);
    panel.appendChild(body);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    (doc.body || doc.documentElement).appendChild(overlay);
  }
  function blockEmbedNavigation() {
    return window.__ryxEmbedAwaitingClose === true;
  }
  function patchLocationReload() {
    try {
      var descriptor = Object.getOwnPropertyDescriptor(Location.prototype, "reload");
      if (!descriptor || typeof descriptor.value !== "function") return false;
      var nativeReload = descriptor.value;
      Object.defineProperty(Location.prototype, "reload", {
        configurable: true,
        writable: true,
        value: function ryxEmbedReload() {
          if (blockEmbedNavigation()) return;
          return nativeReload.apply(this, arguments);
        },
      });
      return true;
    } catch (e) {
      return false;
    }
  }
  var reloadPatched = patchLocationReload();
  window.alert = function (message) {
    var text = message == null ? "" : String(message);
    var success = isSuccessMessage(text);
    if (success) {
      window.__ryxEmbedAwaitingClose = true;
      try {
        if (window.layer && typeof window.layer.closeAll === "function") {
          window.layer.closeAll("loading");
        }
      } catch (e) {}
    }
    showEmbedAlert(text, function () {
      if (success) {
        notifyWorkflowComplete();
        window.__ryxEmbedAwaitingClose = false;
      }
    });
    if (success && !reloadPatched) {
      throw new Error("RYX_EMBED_SUCCESS_ALERT");
    }
  };
  function hookLayerObject(layer) {
    if (!layer || layer.__ryxEmbedHooked) return;
    if (typeof layer.alert === "function") {
      var originalAlert = layer.alert;
      layer.alert = function (content, options, yes) {
        if (isSuccessMessage(content)) {
          window.__ryxEmbedAwaitingClose = true;
          var opts = options && typeof options === "object" ? options : {};
          return originalAlert.call(layer, content, opts, function (index) {
            notifyWorkflowComplete();
            window.__ryxEmbedAwaitingClose = false;
            if (typeof yes === "function") yes(index);
          });
        }
        return originalAlert.apply(layer, arguments);
      };
    }
    if (typeof layer.msg === "function") {
      var originalMsg = layer.msg;
      layer.msg = function (content, options, end) {
        var result = originalMsg.apply(layer, arguments);
        if (isSuccessMessage(content) && typeof end === "function") {
          var nativeEnd = end;
          end = function () {
            notifyWorkflowComplete();
            return nativeEnd.apply(this, arguments);
          };
        }
        return result;
      };
    }
    layer.__ryxEmbedHooked = true;
  }
  hookLayerObject(window.layer);
  var layerCheck = window.setInterval(function () {
    hookLayerObject(window.layer);
  }, 200);
  window.setTimeout(function () {
    window.clearInterval(layerCheck);
  }, 15000);
})();
<\/script>`;return e.includes("<head>")?e.replace("<head>",`<head>${t}`):`${t}${e}`}function b(e,t){if(!t||/window\.ticket\s*=/.test(e))return e;const o=`window.ticket = ${JSON.stringify(t)};`,n=`<script type="text/javascript">${o}<\/script>`;if(e.includes("<head>"))return e.replace("<head>",`<head>${n}`);const r=e.match(/window\.FormNumber\s*=\s*"[^"]*";/);return r?e.replace(r[0],`${r[0]}
        ${o}`):e.replace('<script type="text/javascript" src="/js/detail.js">',`<script type="text/javascript">${o}<\/script>
    <script type="text/javascript" src="/js/detail.js">`)}function g(e){const t=`<style data-ryx-embed-scroll="true">
html, body {
  height: auto !important;
  min-height: 100% !important;
  max-height: none !important;
  overflow-x: hidden !important;
  overflow-y: visible !important;
}
:has(> [task="tasktab"]):not(:has(> [tasktap])) {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0 !important;
  width: 100% !important;
  box-sizing: border-box !important;
  padding: 0 4px !important;
  border: 0 !important;
  border-bottom: 1px solid #f0f2f5 !important;
  background: #fff !important;
}
[task="tasktab"] {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  float: none !important;
  width: auto !important;
  min-width: 4.5rem;
  height: 40px !important;
  margin: 0 12px 0 0 !important;
  padding: 0 2px !important;
  flex: 0 0 auto;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  font-size: 14px !important;
  line-height: 40px !important;
  color: #666 !important;
  white-space: nowrap !important;
  writing-mode: horizontal-tb !important;
}
[task="tasktab"].tab-select,
[task="tasktab"].tabselect,
[task="tasktab"][class*="tab-select"] {
  color: #2768fa !important;
  font-weight: 500 !important;
  border: 0 !important;
  border-bottom: 2px solid #2768fa !important;
  background: transparent !important;
}
[tasktap] {
  float: none !important;
  clear: both;
  width: 100%;
}
.taskinfo,
[task="detail"] {
  display: none !important;
}
</style>
<script data-ryx-embed-scroll="true">
(function () {
  var openNode = null;
  function unlock(el) {
    if (!el || !el.style) return;
    el.style.setProperty("height", "auto", "important");
    el.style.setProperty("max-height", "none", "important");
    el.style.setProperty("overflow-y", "visible", "important");
  }
  function run() {
    unlock(document.documentElement);
    unlock(document.body);
  }
  function infos() {
    return document.querySelectorAll(".taskinfo, [task=detail]");
  }
  function parentDoc() {
    try {
      if (window.parent && window.parent !== window && window.parent.document) {
        return window.parent.document;
      }
    } catch (e) {}
    return document;
  }
  function closeModal() {
    openNode = null;
    var doc = parentDoc();
    var existing = doc.querySelector("[data-ryx-taskinfo-modal]");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }
  function openModal(info, node) {
    if (openNode === node) {
      closeModal();
      return;
    }
    closeModal();
    openNode = node;
    var doc = parentDoc();
    var overlay = doc.createElement("div");
    overlay.setAttribute("data-ryx-taskinfo-modal", "true");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;";
    var panel = doc.createElement("div");
    panel.style.cssText =
      "width:min(340px,100%);max-height:80vh;min-height:0;display:flex;flex-direction:column;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.18);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";
    var header = doc.createElement("div");
    header.style.cssText =
      "flex:0 0 auto;padding:16px 16px 8px;font-size:16px;font-weight:600;color:#222;text-align:center;";
    header.textContent = "审批详情";
    var body = doc.createElement("div");
    body.setAttribute("data-ryx-taskinfo-body", "true");
    body.style.cssText =
      "flex:1 1 auto;min-height:0;max-height:calc(80vh - 120px);overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;padding:4px 16px 8px;font-size:14px;line-height:1.6;color:#333;word-break:break-word;white-space:normal;";
    body.innerHTML = info.innerHTML;
    var style = doc.createElement("style");
    style.textContent =
      "[data-ryx-taskinfo-body] label,[data-ryx-taskinfo-body] .info-row{display:block;margin:0 0 10px;white-space:normal;word-break:break-word;font-size:14px;line-height:1.55;color:#333;}";
    var footer = doc.createElement("div");
    footer.style.cssText = "flex:0 0 auto;padding:8px 16px 16px;display:flex;justify-content:center;";
    var button = doc.createElement("button");
    button.type = "button";
    button.textContent = "关闭";
    button.style.cssText =
      "min-width:120px;height:40px;border:0;border-radius:8px;background:#2768fa;color:#fff;font-size:15px;font-weight:500;cursor:pointer;";
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      closeModal();
    });
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeModal();
    });
    footer.appendChild(button);
    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    overlay.appendChild(style);
    overlay.appendChild(panel);
    (doc.body || doc.documentElement).appendChild(overlay);
  }
  document.addEventListener(
    "click",
    function (event) {
      var node = event.target.closest && event.target.closest(".formdetail-task");
      if (!node) return;
      var next = node.nextElementSibling;
      var info =
        next && (next.classList.contains("taskinfo") || next.getAttribute("task") === "detail")
          ? next
          : infos()[Array.prototype.indexOf.call(document.querySelectorAll(".formdetail-task"), node)];
      if (!info) return;
      event.preventDefault();
      event.stopPropagation();
      openModal(info, node);
    },
    true,
  );
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  window.addEventListener("load", run);
})();
<\/script>`;return e.includes("<head>")?e.replace("<head>",`<head>${t}`):`${t}${e}`}function v(e,t){const o=`<base href="${t.replace(/\/$/,"")}/">`;return e.includes("<head>")?e.replace("<head>",`<head>${o}`):`${o}${e}`}async function S(e){const t=i(e);let o;try{o=new URL(t)}catch{return}if(!s(t)||o.hostname!==c())return;const n=o.searchParams.get("ticket")??"";if(!n)return;const r=await fetch(t);if(!r.ok)throw new Error(`workflow embed fetch failed: HTTP ${r.status}`);const l=await r.text(),d=`${o.protocol}//${o.host}`,p=o.search.startsWith("?")?o.search.slice(1):o.search,f=x(l,p),u=h(f),y=b(u,n),m=g(y);return v(m,d)}export{C as a,S as f,E as i};
