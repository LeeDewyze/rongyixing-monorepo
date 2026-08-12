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
  return prepareWorkflowSrcdoc(withTicket, origin);
}
