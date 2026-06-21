import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import type { CredentialFormValues } from "@ryx/shared-types";
import {
  toExternalPassengerApiPayload,
  toStaffCredentialApiPayload,
} from "@/lib/credential-form";

function invalidatePassengerLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["passenger"] });
}

export function useSaveExternalCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: CredentialFormValues) => {
      const isModify = Boolean(values.Id);
      const payload = toExternalPassengerApiPayload(values, isModify);
      if (isModify) {
        return getApi().passenger.modifyPassenger(payload);
      }
      return getApi().passenger.addPassenger(payload);
    },
    onSuccess: () => invalidatePassengerLists(queryClient),
  });
}

export function useSaveStaffCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: CredentialFormValues) => {
      const isModify = Boolean(values.Id);
      const payload = toStaffCredentialApiPayload(values, isModify);
      if (isModify) {
        return getApi().passenger.modifyStaffCredential(payload);
      }
      return getApi().passenger.addStaffCredential(payload);
    },
    onSuccess: () => invalidatePassengerLists(queryClient),
  });
}

export function useRemoveExternalPassenger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().passenger.removePassenger(id),
    onSuccess: () => invalidatePassengerLists(queryClient),
  });
}

export function useRemoveStaffCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CredentialFormValues) => {
      const payload = toStaffCredentialApiPayload(values, true);
      return getApi().passenger.removeStaffCredential(payload);
    },
    onSuccess: () => invalidatePassengerLists(queryClient),
  });
}
