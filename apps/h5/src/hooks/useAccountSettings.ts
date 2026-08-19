import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { getApi, resetApi } from "@/lib/api";
import { clearSession, getTicket } from "@/lib/session";
import { getTicketName } from "@/lib/request-context";
import { stopSessionGuard } from "@/lib/session-guard";

export async function logoutMutationFn(): Promise<void> {
  // Legacy account-setting uses LoginService.logout() → ApiLoginUrl-Home-Logout only.
  const ticket = getTicket();
  if (!ticket) return;
  await getApi().authProxy.logout({ ticket, ticketName: getTicketName() });
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
      resetApi({ clearConfigCache: false });
      navigate("/login/password", { replace: true });
    },
  });
}
