import type { TrainItem, TrainOrderTrip, TrainScheduleParams } from "@ryx/shared-types";

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
  if (!value?.trim()) return "—";
  const trimmed = value.trim();
  const timePart = trimmed.includes("T")
    ? trimmed.split("T")[1]?.slice(0, 5)
    : trimmed.length >= 5
      ? trimmed.slice(-5)
      : trimmed;
  return timePart ?? "—";
}
