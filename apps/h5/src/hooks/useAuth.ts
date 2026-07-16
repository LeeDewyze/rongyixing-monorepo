import { useMutation } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { getDeviceId, getDeviceName } from "@/lib/request-context";
import { saveLoginResult, setWebSocketUrl } from "@/lib/session";

async function loadWebSocketUrlAfterLogin(mode: string, ticket?: string) {
  if (mode === "mock" || !ticket) return;
  const ws = await getApi().identity.getWebSocketUrl();
  if (!ws?.Url) {
    throw new Error("GetWebSocketUrl returned empty Url");
  }
  setWebSocketUrl(ws.Url);
}

export function usePasswordLogin() {
  return useMutation({
    mutationFn: async (params: { Name: string; Password: string }) => {
      const mode = getApiMode();
      if (import.meta.env.DEV && mode === "mock") {
        console.info(
          "[ryx] mock login — no HTTP request; switch DEV menu to Test/Proxy for real API",
        );
      }
      const api = getApi();
      const result = await api.authProxy.login({
        Name: params.Name,
        Password: params.Password,
        Device: getDeviceId(),
        DeviceName: getDeviceName(),
      });

      // Save ticket before /Home/Proxy so GetWebSocketUrl can read it.
      saveLoginResult(result);
      await loadWebSocketUrlAfterLogin(mode, result.Ticket);

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
      await loadWebSocketUrlAfterLogin(mode, result.Ticket);

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

export function useDeviceLogin() {
  return useMutation({
    mutationFn: (deviceId: string) => getApi().authProxy.deviceLogin({ Device: deviceId }),
    onSuccess: (data) => saveLoginResult(data),
  });
}
