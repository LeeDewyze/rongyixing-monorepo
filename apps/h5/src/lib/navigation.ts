import type { NavigateFunction, NavigateOptions } from "react-router-dom";

function historyIndex(): number | null {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  return typeof idx === "number" ? idx : null;
}

/** True when the browser history stack has a prior in-app entry to pop. */
export function canNavigateBack(): boolean {
  const idx = historyIndex();
  return idx !== null ? idx > 0 : window.history.length > 1;
}

/**
 * Mobile-style back: pop one history entry when possible, otherwise open fallback.
 * Avoids pushing parent URLs onto the stack (which breaks `navigate(-1)` on the parent page).
 */
export function navigateBack(
  navigate: NavigateFunction,
  fallback: string,
  options?: NavigateOptions,
): void {
  if (canNavigateBack()) {
    navigate(-1);
    return;
  }
  navigate(fallback, { replace: true, ...options });
}
