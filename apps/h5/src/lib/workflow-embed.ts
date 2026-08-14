import { getWorkflowHost, isWorkflowUrl, resolveWorkflowUrl } from "@/lib/workflow-site";

export function isWorkflowEmbedUrl(url: string): boolean {
  try {
    const resolved = resolveWorkflowUrl(url);
    return isWorkflowUrl(resolved) && new URL(resolved).hostname === getWorkflowHost();
  } catch {
    return false;
  }
}

function isTruthyWorkflowFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return Boolean(value);
}

function normalizeWorkflowMessage(data: unknown): Record<string, unknown> | null {
  if (!data) return null;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof data === "object") {
    return data as Record<string, unknown>;
  }
  return null;
}

/** Legacy shell + workflow task.js — close embed when workflow signals completion. */
export function isWorkflowBackMessage(data: unknown): boolean {
  const msg = normalizeWorkflowMessage(data);
  if (!msg || typeof msg.type !== "string") {
    return false;
  }

  const type = msg.type;
  if (type === "windowclose") {
    return true;
  }

  const shouldGoBack =
    isTruthyWorkflowFlag(msg.isBack) ||
    isTruthyWorkflowFlag(msg.payload) ||
    isTruthyWorkflowFlag(msg.data);

  if (type === "back" || type === "appCheckGoBack" || type === "appCheckCanBack") {
    return shouldGoBack;
  }

  return false;
}

/** srcdoc loses `window.location.search`; shim common workflow query helpers. */
export function injectWorkflowIframeQueryShim(html: string, search: string): string {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const shim = `<script type="text/javascript">
(function () {
  var __wfSearch = ${JSON.stringify(query)};
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
</script>`;

  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>${shim}`);
  }
  return `${shim}${html}`;
}

/**
 * FormTask/Handle calls alert("保存成功") then reload — no parent postMessage.
 * Replace native alert (window-centered) with an in-iframe dialog and notify parent on success.
 */
export function injectWorkflowEmbedBridge(html: string): string {
  const bridge = `<script type="text/javascript">
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
</script>`;

  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>${bridge}`);
  }
  return `${bridge}${html}`;
}

/** Legacy Form/Detail and FormTask/Handle — detail.js FormNote/List needs window.ticket in srcdoc embeds. */
export function injectWorkflowPageTicket(html: string, ticket: string): string {
  if (!ticket || /window\.ticket\s*=/.test(html)) {
    return html;
  }

  const ticketLine = `window.ticket = ${JSON.stringify(ticket)};`;
  const headScript = `<script type="text/javascript">${ticketLine}</script>`;
  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>${headScript}`);
  }

  const formNumberMatch = html.match(/window\.FormNumber\s*=\s*"[^"]*";/);
  if (formNumberMatch) {
    return html.replace(formNumberMatch[0], `${formNumberMatch[0]}\n        ${ticketLine}`);
  }

  return html.replace(
    '<script type="text/javascript" src="/js/detail.js">',
    `<script type="text/javascript">${ticketLine}</script>\n    <script type="text/javascript" src="/js/detail.js">`,
  );
}

/** Same-origin dev proxy path for workflow HTML fetches (avoids CORS / third-party cookie issues). */
export function resolveWorkflowEmbedFetchUrl(resolved: string): string {
  if (!import.meta.env.DEV) {
    return resolved;
  }
  try {
    const parsed = new URL(resolved);
    if (!parsed.hostname.startsWith("workflow.")) {
      return resolved;
    }
    return `/workflow-embed${parsed.pathname}${parsed.search}`;
  } catch {
    return resolved;
  }
}

/**
 * Form/Detail with opentype=iframe often sets html/body to height:100% + overflow:hidden
 * so the native WebView can scroll. Inside our iframe that clips content at 日志.
 * Grow the document instead and let the parent wrapper scroll (iOS cannot scroll iframes).
 */
export function injectWorkflowEmbedScroll(html: string): string {
  const inject = `<style data-ryx-embed-scroll="true">
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
</script>`;
  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>${inject}`);
  }
  return `${inject}${html}`;
}

/** srcdoc iframe needs base href so /js/* assets resolve against the workflow site. */
export function prepareWorkflowSrcdoc(html: string, origin: string): string {
  const baseTag = `<base href="${origin.replace(/\/$/, "")}/">`;
  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>${baseTag}`);
  }
  return `${baseTag}${html}`;
}

export async function fetchWorkflowEmbedSrcdoc(url: string): Promise<string | undefined> {
  const resolved = resolveWorkflowUrl(url);
  let parsed: URL;
  try {
    parsed = new URL(resolved);
  } catch {
    return undefined;
  }

  if (!isWorkflowUrl(resolved) || parsed.hostname !== getWorkflowHost()) {
    return undefined;
  }

  const ticket = parsed.searchParams.get("ticket") ?? "";
  if (!ticket) {
    return undefined;
  }

  const response = await fetch(resolveWorkflowEmbedFetchUrl(resolved));
  if (!response.ok) {
    throw new Error(`workflow embed fetch failed: HTTP ${response.status}`);
  }

  const html = await response.text();
  const origin = `${parsed.protocol}//${parsed.host}`;
  const query = parsed.search.startsWith("?") ? parsed.search.slice(1) : parsed.search;
  const withQueryShim = injectWorkflowIframeQueryShim(html, query);
  const withBridge = injectWorkflowEmbedBridge(withQueryShim);
  const withTicket = injectWorkflowPageTicket(withBridge, ticket);
  const withScroll = injectWorkflowEmbedScroll(withTicket);
  return prepareWorkflowSrcdoc(withScroll, origin);
}
