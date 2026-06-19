import { useMutation } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { saveLoginResult } from "@/lib/session";

export function usePasswordLogin() {
  return useMutation({
    mutationFn: (params: { Name: string; Password: string }) =>
      getApi().authProxy.login(params),
    onSuccess: (data) => saveLoginResult(data),
  });
}

export function useMobileLogin() {
  return useMutation({
    mutationFn: (params: { Mobile: string; Code: string }) =>
      getApi().authProxy.mobileLogin(params),
    onSuccess: (data) => saveLoginResult(data),
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
    mutationFn: (deviceId: string) =>
      getApi().authProxy.deviceLogin({ Device: deviceId }),
    onSuccess: (data) => saveLoginResult(data),
  });
}
