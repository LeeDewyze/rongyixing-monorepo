import type { TrainStation } from "@ryx/shared-types";

import { CITY_HISTORY_KEYS } from "./city-picker";
import { todayDateString } from "./date-search";

export const TRAIN_STORAGE_FROM = "ryx_train_fromStation";
export const TRAIN_STORAGE_TO = "ryx_train_toStation";

export const DEFAULT_TRAIN_FROM: TrainStation = {
  Id: "1",
  Code: "BJP",
  Name: "北京",
  Nickname: "北京",
  IsHot: true,
};

export const DEFAULT_TRAIN_TO: TrainStation = {
  Id: "2",
  Code: "SHH",
  Name: "上海",
  Nickname: "上海",
  IsHot: true,
};

export function displayStationName(station: TrainStation) {
  return station.Nickname ?? station.Name;
}

export function loadStoredStation(key: string, fallback: TrainStation): TrainStation {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as TrainStation;
      if (parsed?.Code) return parsed;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function persistTrainStations(from: TrainStation, to: TrainStation) {
  localStorage.setItem(TRAIN_STORAGE_FROM, JSON.stringify(from));
  localStorage.setItem(TRAIN_STORAGE_TO, JSON.stringify(to));
}

export function loadDefaultTrainSearchForm() {
  return {
    fromStation: loadStoredStation(TRAIN_STORAGE_FROM, DEFAULT_TRAIN_FROM),
    toStation: loadStoredStation(TRAIN_STORAGE_TO, DEFAULT_TRAIN_TO),
    date: todayDateString(),
  };
}

export function buildTrainListSearchParams({
  fromStation,
  toStation,
  date,
}: {
  fromStation: TrainStation;
  toStation: TrainStation;
  date: string;
}): URLSearchParams {
  return new URLSearchParams({
    fromCode: fromStation.Code,
    toCode: toStation.Code,
    fromName: displayStationName(fromStation),
    toName: displayStationName(toStation),
    date,
  });
}

export function validateTrainSearch(
  fromStation: TrainStation | null | undefined,
  toStation: TrainStation | null | undefined,
): string | null {
  if (!fromStation?.Code) return "请选择出发站";
  if (!toStation?.Code) return "请选择到达站";
  if (fromStation.Code === toStation.Code) return "出发站和到达站不能相同";
  return null;
}

export function stationFromQuery(
  stations: TrainStation[],
  code: string,
  name?: string,
): TrainStation {
  const found = stations.find((s) => s.Code === code);
  if (found) return found;
  return { Id: code, Code: code, Name: name ?? code, Nickname: name ?? code };
}

export function toTrainPickerOptions(stations: TrainStation[]) {
  return stations.map((s) => ({
    id: s.Code,
    label: displayStationName(s),
    sublabel: s.Code,
    searchText: [s.Name, s.Nickname, s.Pinyin, s.Code].filter(Boolean).join(" "),
    hot: s.IsHot,
  }));
}

export const trainStationPickerAdapter = {
  getId: (station: TrainStation) => station.Id,
  getCode: (station: TrainStation) => station.Code,
  getName: (station: TrainStation) => displayStationName(station),
  getPinyin: (station: TrainStation) => station.Pinyin,
  getIsHot: (station: TrainStation) => Boolean(station.IsHot),
  getSearchValues: (station: TrainStation) =>
    [station.Code, station.Name, station.Nickname, station.Pinyin].filter(
      Boolean,
    ) as string[],
};

export { CITY_HISTORY_KEYS };
