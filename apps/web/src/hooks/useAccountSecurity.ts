import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ModifyPasswordParams } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export function useModifyPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: ModifyPasswordParams) => getApi().accountSecurity.modifyPassword(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["account", "home-summary"] });
    },
  });
}

export function useMobileSecurity() {
  const queryClient = useQueryClient();

  const load = useMutation({
    mutationFn: () => getApi().accountSecurity.loadMobile(),
  });

  const sendCode = useMutation({
    mutationFn: (mobile: string) => getApi().accountSecurity.sendMobileCode({ Mobile: mobile }),
  });

  const submit = useMutation({
    mutationFn: (params: { Mobile: string; Code: string }) =>
      getApi().accountSecurity.submitMobileAction(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["account", "home-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["member", "profile"] });
    },
  });

  return { load, sendCode, submit };
}

export function useEmailSecurity() {
  const queryClient = useQueryClient();

  const load = useMutation({
    mutationFn: () => getApi().accountSecurity.loadEmail(),
  });

  const sendCode = useMutation({
    mutationFn: (email: string) => getApi().accountSecurity.sendEmailCode({ Email: email }),
  });

  const submit = useMutation({
    mutationFn: (params: { Email: string; Code: string }) =>
      getApi().accountSecurity.submitEmailAction(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["account", "home-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["member", "profile"] });
    },
  });

  return { load, sendCode, submit };
}
