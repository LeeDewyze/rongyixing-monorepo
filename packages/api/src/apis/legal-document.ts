export interface LegalDocumentFetchOptions {
  pageOrigin?: string;
  /** When true, rewrite cross-origin legal URLs to a same-origin dev proxy path. */
  useDevProxy?: boolean;
  devProxyPrefix?: string;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Rewrite cross-origin legal doc URLs to a same-origin dev proxy for fetch. */
export function toFetchableLegalDocumentUrl(
  documentUrl: string,
  options: LegalDocumentFetchOptions = {},
): string {
  try {
    const parsed = new URL(documentUrl);
    const pageOrigin = options.pageOrigin ?? "";
    if (!pageOrigin || parsed.origin === pageOrigin) {
      return documentUrl;
    }
    if (options.useDevProxy) {
      const prefix = options.devProxyPrefix ?? "/legal-doc";
      return `${prefix}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return documentUrl;
  } catch {
    return documentUrl;
  }
}

/**
 * Inject base URL and a click interceptor so external links open in a new tab
 * instead of navigating the iframe (sites like aboutcookies.org block framing).
 */
export function injectLegalDocumentInterceptors(html: string, documentUrl: string): string {
  const documentOrigin = new URL(documentUrl).origin;
  const baseTag = `<base href="${escapeHtmlAttribute(documentUrl)}">`;
  const script = `<script>
(function () {
  var docOrigin = ${JSON.stringify(documentOrigin)};
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
</script>`;
  const injection = `${baseTag}${script}`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${injection}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, (match) => `${match}<head>${injection}</head>`);
  }
  return `<!DOCTYPE html><html><head>${injection}</head><body>${html}</body></html>`;
}

export async function loadLegalDocumentIframeSrc(
  documentUrl: string,
  options: LegalDocumentFetchOptions = {},
): Promise<string> {
  const fetchUrl = toFetchableLegalDocumentUrl(documentUrl, options);
  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    const prepared = injectLegalDocumentInterceptors(html, documentUrl);
    const blob = new Blob([prepared], { type: "text/html;charset=utf-8" });
    return URL.createObjectURL(blob);
  } catch {
    return documentUrl;
  }
}
