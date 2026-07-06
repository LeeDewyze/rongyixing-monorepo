import { getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";

/** Whether the app may access authenticated routes (mock mode skips ticket check). */
export function isAuthenticated(): boolean {
  return getApiMode() === "mock" || Boolean(getTicket());
}

export function buildLoginPath(returnTo?: string): string {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("/login")) {
    return "/login/password";
  }
  return `/login/password?returnTo=${encodeURIComponent(returnTo)}`;
}
