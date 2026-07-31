import { useMutation } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { preloadBusinessBookingPermission } from "@/lib/booking-permission-preload";
import { queryClient } from "@/lib/query";
import { getDeviceId, getDeviceName } from "@/lib/request-context";
import { startSessionGuard } from "@/lib/session-guard";
import { saveLoginResult, setWebSocketUrl } from "@/lib/session";

async function loadWebSocketUrlAfterLogin(mode: string, ticket?: string) {
  if (mode === "mock" || !ticket) return;
  try {
    const ws = await getApi().identity.getWebSocketUrl();
    if (ws?.Url) {
      setWebSocketUrl(ws.Url);
    } else {
      console.warn("[ryx] GetWebSocketUrl returned empty Url");
    }
  } catch (error) {
    console.warn("[ryx] failed to load websocket url after login", error);
  }
}

function startSessionGuardAfterLogin(mode: string): void {
  if (mode === "mock") return;
  startSessionGuard();
}

function loadWebSocketUrlInBackground(mode: string, ticket?: string): void {
  void loadWebSocketUrlAfterLogin(mode, ticket);
}

export function usePasswordLogin() {
  return useMutation({
    mutationFn: async (params: { Name: string; Password: string }) => {
      const mode = getApiMode();
      if (import.meta.env.DEV && mode === "mock") {
        console.info("[ryx] mock login — no HTTP request; set VITE_API_MODE=proxy for real API");
      }
      const api = getApi();
      const result = await api.authProxy.login({
        Name: params.Name,
        Password: params.Password,
        Device: getDeviceId(),
        DeviceName: getDeviceName(),
      });

      saveLoginResult(result);
      await preloadBusinessBookingPermission(queryClient, { reset: true });
      startSessionGuardAfterLogin(mode);
      loadWebSocketUrlInBackground(mode, result.Ticket);

      return result;
    },
  });
}

export function useMobileLogin() {
  return useMutation({
    mutationFn: async (params: { Mobile: string; Code: string }) => {
      const mode = getApiMode();
      const result = await getApi().authProxy.mobileLogin({
        Mobile: params.Mobile,
        Code: params.Code,
        Device: getDeviceId(),
      });

      saveLoginResult(result);
      await preloadBusinessBookingPermission(queryClient, { reset: true });
      startSessionGuardAfterLogin(mode);
      loadWebSocketUrlInBackground(mode, result.Ticket);

      return result;
    },
  });
}

export function useSendLoginCode() {
  return useMutation({
    mutationFn: async (mobile: string) => {
      if (getApiMode() === "mock") return true;
      return getApi().gateway.sendLoginMobileCode({ Mobile: mobile });
    },
  });
}
