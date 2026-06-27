import type {
  TrainItem,
  TrainOrderTrip,
  TrainScheduleParams,
  TrainScheduleStop,
} from "@ryx/shared-types";

/** Legacy ryx: row active when stop matches train FromStationName or ToStationName. */
export function isScheduleRowActive(
  stop: TrainScheduleStop,
  fromStation?: string,
  toStation?: string,
): boolean {
  const from = fromStation?.trim();
  const to = toStation?.trim();
  const name = stop.StationName?.trim();
  if (!from || !to || !name) return false;
  return name === from || name === to;
}

/** Legacy ryx displays API time strings without extra formatting. */
export function formatScheduleDisplayTime(value?: string): string {
  return value?.trim() ?? "";
}

/** Legacy StayTime column — show API value as-is. */
export function formatScheduleStayTime(value?: string): string {
  return value?.trim() ?? "";
}

export function buildTrainScheduleParamsFromItem(
  train: TrainItem,
  date: string,
): TrainScheduleParams {
  return {
    Date: date.slice(0, 10),
    TrainCode: train.TrainCode,
    TrainNo: train.TrainNo,
    FromStation: train.FromStationCode ?? train.FromStation,
    ToStation: train.ToStationCode ?? train.ToStation,
  };
}

export function buildTrainScheduleParamsFromTrip(
  trip: TrainOrderTrip,
  date?: string,
): TrainScheduleParams | null {
  if (!trip.TrainCode) return null;
  return {
    Date: (date ?? trip.StartTime ?? "").slice(0, 10),
    TrainCode: trip.TrainCode,
    FromStation: trip.FromStationName,
    ToStation: trip.ToStationName,
  };
}

export function formatScheduleClock(value?: string): string {
  if (!value?.trim()) return "";
  const trimmed = value.trim();

  const clockMatch = trimmed.match(/(\d{1,2}:\d{2})(?::\d{2})?$/);
  if (clockMatch) {
    const [hours, minutes] = clockMatch[1].split(":");
    return `${hours.padStart(2, "0")}:${minutes}`;
  }

  if (trimmed.includes("T")) {
    const timePart = trimmed.split("T")[1]?.slice(0, 5);
    return timePart ?? "—";
  }

  return trimmed.length >= 5 ? trimmed.slice(-5) : trimmed;
}
