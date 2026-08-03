import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { getApi, resetApi } from "@/lib/api";
import { clearSession } from "@/lib/session";
import { stopSessionGuard } from "@/lib/session-guard";

export async function logoutMutationFn(): Promise<void> {
  // Legacy account-setting uses LoginService.logout() → ApiLoginUrl-Home-Logout only.
  await getApi().authProxy.logout();
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutMutationFn,
    onSettled: () => {
      stopSessionGuard();
      clearSession();
      queryClient.clear();
      resetApi();
      navigate("/login/password", { replace: true });
    },
  });
}
