import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApi } from "@/lib/api";

const LOGIN_DEVICES_QUERY_KEY = ["account", "login-devices"] as const;

export function useLoginDevices() {
  return useQuery({
    queryKey: LOGIN_DEVICES_QUERY_KEY,
    queryFn: () => getApi().accountSecurity.listDevices(),
  });
}

export function useRemoveLoginDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().accountSecurity.removeDevice({ Id: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LOGIN_DEVICES_QUERY_KEY });
    },
  });
}
