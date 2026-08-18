import { useCallback, useEffect, useState } from "react";
import type { TrainStation } from "@ryx/shared-types";
import { useQuery } from "@tanstack/react-query";
import { readResourceCache, writeResourceCache } from "@ryx/api";

import { getApi } from "@/lib/api";
import {
  buildTrainListSearchParams,
  loadDefaultTrainSearchForm,
  persistTrainStations,
  persistTrainSearchDate,
  stationFromQuery,
  validateTrainSearch,
} from "@/lib/train-search";

export type TrainStationPickerTarget = "from" | "to" | null;

export interface TrainSearchQueryInitial {
  fromCode: string;
  toCode: string;
  fromName?: string;
  toName?: string;
  date: string;
}

const TRAIN_STATION_CACHE_KEY = "ryx:web:resource:train-stations:v1";
const RESOURCE_STALE_TIME = 24 * 60 * 60 * 1000;
const RESOURCE_GC_TIME = 7 * 24 * 60 * 60 * 1000;

export function useTrainStations(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const cached = readResourceCache<TrainStation[]>(TRAIN_STATION_CACHE_KEY);
  return useQuery({
    queryKey: ["train", "stations"],
    queryFn: async () => {
      const stations = await getApi().train.getStations();
      writeResourceCache(TRAIN_STATION_CACHE_KEY, stations);
      return stations;
    },
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    staleTime: RESOURCE_STALE_TIME,
    gcTime: RESOURCE_GC_TIME,
    enabled,
  });
}

export function useTrainSearchForm(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { data: stations = [], isLoading, error } = useTrainStations({ enabled });
  const defaults = loadDefaultTrainSearchForm();

  const [fromStation, setFromStation] = useState<TrainStation>(defaults.fromStation);
  const [toStation, setToStation] = useState<TrainStation>(defaults.toStation);
  const [date, setDate] = useState(defaults.date);
  const [picker, setPicker] = useState<TrainStationPickerTarget>(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    persistTrainStations(fromStation, toStation);
  }, [fromStation, toStation]);

  useEffect(() => {
    persistTrainSearchDate(date);
  }, [date]);

  const resetFromQuery = useCallback(
    (initial: TrainSearchQueryInitial) => {
      if (!stations.length) return;
      setFromStation(stationFromQuery(stations, initial.fromCode, initial.fromName));
      setToStation(stationFromQuery(stations, initial.toCode, initial.toName));
      setDate(initial.date);
      setValidationError("");
      setPicker(null);
    },
    [stations],
  );

  const swapStations = useCallback(() => {
    setFromStation(toStation);
    setToStation(fromStation);
  }, [fromStation, toStation]);

  const validate = useCallback((): string | null => {
    const message = validateTrainSearch(fromStation, toStation);
    setValidationError(message ?? "");
    return message;
  }, [fromStation, toStation]);

  const buildSearchParams = useCallback(() => {
    return buildTrainListSearchParams({ fromStation, toStation, date });
  }, [fromStation, toStation, date]);

  return {
    stations,
    isLoading,
    error,
    fromStation,
    toStation,
    date,
    picker,
    validationError,
    setFromStation,
    setToStation,
    setDate,
    setPicker,
    setValidationError,
    swapStations,
    resetFromQuery,
    validate,
    buildSearchParams,
  };
}

export type TrainSearchForm = ReturnType<typeof useTrainSearchForm>;

export function useTrainList(
  params: {
    channel?: "tmc" | "tourist";
    Date: string;
    FromStation: string;
    ToStation: string;
    FromName?: string;
    ToName?: string;
  } | null,
) {
  return useQuery({
    queryKey: ["train", "list", params],
    queryFn: () => getApi().train.searchTrains(params!),
    enabled: Boolean(params?.Date && params?.FromStation && params?.ToStation),
  });
}
