import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { getApi, resetApi } from "@/lib/api";
import { clearSession } from "@/lib/session";

export async function accountDeletionMutationFn(): Promise<void> {
  await getApi().account.logout();
}

export function applyAccountDeletionSuccess(deps: {
  navigate: ReturnType<typeof useNavigate>;
  queryClient: ReturnType<typeof useQueryClient>;
}): void {
  clearSession();
  deps.queryClient.clear();
  resetApi();
  deps.navigate("/login/password", { replace: true });
}

export function useAccountDeletion() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountDeletionMutationFn,
    onSuccess: () => {
      applyAccountDeletionSuccess({ navigate, queryClient });
    },
  });
}
