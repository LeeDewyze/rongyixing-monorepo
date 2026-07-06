import { useMutation } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { getDeviceId, getDeviceName } from "@/lib/request-context";
import { saveLoginResult, setWebSocketUrl } from "@/lib/session";

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

      if (mode !== "mock" && result.Ticket) {
        const ws = await api.identity.getWebSocketUrl();
        if (!ws?.Url) {
          throw new Error("GetWebSocketUrl returned empty Url");
        }
        setWebSocketUrl(ws.Url);
      }

      return result;
    },
  });
}
