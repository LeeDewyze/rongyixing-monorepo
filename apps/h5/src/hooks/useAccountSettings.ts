import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { getApi, resetApi } from "@/lib/api";
import { clearSession } from "@/lib/session";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const api = getApi();
      let accountFailed = false;
      let authFailed = false;

      try {
        await api.account.logout();
      } catch {
        accountFailed = true;
      }

      try {
        await api.authProxy.logout();
      } catch {
        authFailed = true;
      }

      return { accountFailed, authFailed };
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
      resetApi();
      navigate("/login/password", { replace: true });
    },
  });
}
