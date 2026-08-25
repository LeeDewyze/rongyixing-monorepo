import type { NavigateFunction } from "react-router-dom";

export interface OpenExternalHttpHost {
  userAgent: string;
  title?: string;
  navigate: (to: string) => void;
  openInNewTab: (url: string) => void;
}

/** Mobile WebViews treat target=_blank as a same-view navigation and break SPA back. */
export function shouldEmbedExternalHttp(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod/i.test(userAgent);
}

export function buildEmbeddedOpenUrl(url: string, title = "详情"): string {
  const params = new URLSearchParams({ url, title });
  return `/open-url?${params.toString()}`;
}

export function openExternalHttp(url: string, host: OpenExternalHttpHost): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  const title = host.title?.trim() || "详情";
  if (shouldEmbedExternalHttp(host.userAgent)) {
    host.navigate(buildEmbeddedOpenUrl(trimmed, title));
    return true;
  }

  host.openInNewTab(trimmed);
  return true;
}

export function openExternalHttpFromBrowser(
  url: string,
  title: string,
  navigate: NavigateFunction,
): boolean {
  return openExternalHttp(url, {
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    title,
    navigate,
    openInNewTab(href) {
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    },
  });
}
