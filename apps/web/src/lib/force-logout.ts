import { stripAppBasePath, withAppBasePath } from "@/lib/base-path";
import { showAppAlertDialog } from "@/lib/app-confirm-dialog";
import { clearSession, getTicket } from "@/lib/session";
import { queryClient } from "@/lib/query";

export const PREVENT_AUTO_LOGIN_KEY = "ryx_prevent_auto_login";

let isForcingLogout = false;

export interface ForceLogoutOptions {
  message?: string;
  preventAutoLogin?: boolean;
}

export function isForceLogoutInProgress(): boolean {
  return isForcingLogout;
}

export function isPreventAutoLogin(): boolean {
  return sessionStorage.getItem(PREVENT_AUTO_LOGIN_KEY) === "1";
}

export function clearPreventAutoLogin(): void {
  sessionStorage.removeItem(PREVENT_AUTO_LOGIN_KEY);
}

export async function performForceLogout(options: ForceLogoutOptions = {}): Promise<void> {
  if (isForcingLogout) return;
  isForcingLogout = true;

  const { stopSessionGuard } = await import("@/lib/session-guard");
  stopSessionGuard();

  // Nothing to tear down; release the flag so a later login can be guarded again.
  if (!getTicket()) {
    isForcingLogout = false;
    return;
  }

  if (options.preventAutoLogin) {
    sessionStorage.setItem(PREVENT_AUTO_LOGIN_KEY, "1");
  }

  const path = `${window.location.pathname}${window.location.search}`;
  const routerPath = stripAppBasePath(path);
  const onLoginPage = routerPath.startsWith("/login");

  if (!onLoginPage) {
    await showAppAlertDialog(options.message || "登录已失效，请重新登录");
  }

  const { resetApi } = await import("@/lib/api");
  clearSession();
  queryClient.clear();
  resetApi();

  // Only a redirect unloads the page, so every other path must release the flag.
  if (onLoginPage) {
    isForcingLogout = false;
    return;
  }

  const returnTo = encodeURIComponent(path);
  window.location.replace(
    withAppBasePath(`/login/password?preventAutoLogin=1&returnTo=${returnTo}`),
  );
}
