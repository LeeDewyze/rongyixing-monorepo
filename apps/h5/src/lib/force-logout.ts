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

function buildLoginRedirectPath(options: ForceLogoutOptions): string {
  if (options.preventAutoLogin) {
    return "/login/password?preventAutoLogin=1";
  }
  return "/login/password";
}

export async function performForceLogout(options: ForceLogoutOptions = {}): Promise<void> {
  if (isForcingLogout) return;
  isForcingLogout = true;

  const { stopSessionGuard } = await import("@/lib/session-guard");
  stopSessionGuard();

  const path = `${window.location.pathname}${window.location.search}`;
  const routerPath = stripAppBasePath(path);
  const onLoginPage = routerPath.startsWith("/login");
  const hadTicket = Boolean(getTicket());

  if (options.preventAutoLogin) {
    sessionStorage.setItem(PREVENT_AUTO_LOGIN_KEY, "1");
  }

  if (!onLoginPage && hadTicket) {
    await showAppAlertDialog(options.message || "登录已失效，请重新登录");
  }

  if (hadTicket) {
    const { resetApi } = await import("@/lib/api");
    clearSession();
    queryClient.clear();
    resetApi({ clearConfigCache: false });
  }

  if (onLoginPage) {
    isForcingLogout = false;
    return;
  }

  window.location.replace(withAppBasePath(buildLoginRedirectPath(options)));
}
