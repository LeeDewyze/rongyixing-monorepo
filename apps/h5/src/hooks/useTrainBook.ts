import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TrainBookParams, TrainInitBookParams, TrainPolicyParams } from "@ryx/shared-types";

import { getApiMode } from "@/lib/env";
import {
  TRAIN_BOOK_SELECTION_EVENT,
  loadTrainBookSelection,
  type TrainBookSelection,
} from "@/lib/train-book-session";
import { getApi } from "@/lib/api";

async function ensureBookApiReady(): Promise<void> {
  const api = getApi();
  if (getApiMode() !== "mock" && !api.proxy.getApiConfig()?.Token) {
    await api.proxy.loadApiConfig();
  }
}

export function useTrainBookSelection() {
  const [selection, setSelectionState] = useState<TrainBookSelection | null>(() =>
    loadTrainBookSelection(),
  );

  useEffect(() => {
    function sync() {
      setSelectionState(loadTrainBookSelection());
    }
    window.addEventListener(TRAIN_BOOK_SELECTION_EVENT, sync);
    return () => window.removeEventListener(TRAIN_BOOK_SELECTION_EVENT, sync);
  }, []);

  const reload = useCallback(() => {
    setSelectionState(loadTrainBookSelection());
  }, []);

  return { selection, reload };
}

export function useTrainPolicy(params: TrainPolicyParams | null) {
  return useQuery({
    queryKey: ["train", "policy", params],
    queryFn: () => getApi().train.getPolicy(params!),
    enabled: Boolean(params?.Passengers && params.Trains),
    staleTime: 0,
    retry: false,
  });
}

export function useTrainInitBook(params: TrainInitBookParams | null) {
  return useQuery({
    queryKey: ["train", "initBook", params],
    queryFn: async () => {
      await ensureBookApiReady();
      return getApi().train.initializeBook(params!);
    },
    enabled: Boolean(params?.Passengers?.length),
    staleTime: 0,
    retry: false,
  });
}

export function useTrainSubmitBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: TrainBookParams) => {
      await ensureBookApiReady();
      return getApi().train.submitBook(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useTrainSubmitExchangeBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: TrainBookParams) => {
      await ensureBookApiReady();
      return getApi().train.submitExchangeBook(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}
