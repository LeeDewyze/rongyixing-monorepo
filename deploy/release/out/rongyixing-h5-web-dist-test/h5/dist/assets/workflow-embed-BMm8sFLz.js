import{ap as i,aq as s,ar as c}from"./routes-BcNDnxzp.js";function x(e){try{const t=i(e);return s(t)&&new URL(t).hostname===c()}catch{return!1}}function a(e){if(e===!0||e===1)return!0;if(typeof e=="string"){const t=e.trim().toLowerCase();return t==="true"||t==="1"||t==="yes"}return!!e}function w(e){if(!e)return null;if(typeof e=="string")try{const t=JSON.parse(e);return typeof t=="object"&&t!==null?t:null}catch{return null}return typeof e=="object"?e:null}function v(e){const t=w(e);if(!t||typeof t.type!="string")return!1;const r=t.type;if(r==="windowclose")return!0;const o=a(t.isBack)||a(t.payload)||a(t.data);return r==="back"||r==="appCheckGoBack"||r==="appCheckCanBack"?o:!1}function g(e,t){const r=t.startsWith("?")?t.slice(1):t,o=`<script type="text/javascript">
(function () {
  var __wfSearch = ${JSON.stringify(r)};
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
<\/script>`;return e.includes("<head>")?e.replace("<head>",`<head>${o}`):`${o}${e}`}function m(e){const t=`<script type="text/javascript">
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
<\/script>`;return e.includes("<head>")?e.replace("<head>",`<head>${t}`):`${t}${e}`}function h(e,t){if(!t||/window\.ticket\s*=/.test(e))return e;const r=`window.ticket = ${JSON.stringify(t)};`,o=`<script type="text/javascript">${r}<\/script>`;if(e.includes("<head>"))return e.replace("<head>",`<head>${o}`);const n=e.match(/window\.FormNumber\s*=\s*"[^"]*";/);return n?e.replace(n[0],`${n[0]}
        ${r}`):e.replace('<script type="text/javascript" src="/js/detail.js">',`<script type="text/javascript">${r}<\/script>
    <script type="text/javascript" src="/js/detail.js">`)}function b(e,t){const r=`<base href="${t.replace(/\/$/,"")}/">`;return e.includes("<head>")?e.replace("<head>",`<head>${r}`):`${r}${e}`}async function _(e){const t=i(e);let r;try{r=new URL(t)}catch{return}if(!s(t)||r.hostname!==c())return;const o=r.searchParams.get("ticket")??"";if(!o)return;const n=await fetch(t);if(!n.ok)throw new Error(`workflow embed fetch failed: HTTP ${n.status}`);const l=await n.text(),d=`${r.protocol}//${r.host}`,f=r.search.startsWith("?")?r.search.slice(1):r.search,u=g(l,f),p=m(u),y=h(p,o);return b(y,d)}export{v as a,_ as f,x as i};
