import type {
  TrainFilterCondition,
  TrainFilterOption,
  TrainItem,
  TrainSeat,
  TrainSortKind,
  TrainSortTab,
  TrainDurationSortMode,
  TrainPriceSortMode,
  TrainTypeFilter,
} from "@ryx/shared-types";
import { parseTrainDurationMinutes, parseTravelTimeMinutes } from "@ryx/shared-types";

export function parseTrainTimestamp(value: string): number {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const ts = Date.parse(normalized);
  return Number.isFinite(ts) ? ts : 0;
}

export function formatTrainClock(value: string): string {
  const timeMatch = value.match(/(?:T|\s)(\d{2}:\d{2})/);
  if (timeMatch?.[1]) return timeMatch[1];
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return value;
}

function calendarDayIndex(timestamp: number): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function resolveTrainCalendarDayDiff(
  startTime?: string,
  arrivalTime?: string,
  arriveDays?: number,
): number {
  if (typeof arriveDays === "number" && arriveDays > 0) {
    return arriveDays;
  }
  if (!startTime || !arrivalTime) return 0;

  const startTs = parseTrainTimestamp(startTime);
  const arrivalTs = parseTrainTimestamp(arrivalTime);
  if (!startTs || !arrivalTs) return 0;

  const calendarDiff = Math.round(
    (calendarDayIndex(arrivalTs) - calendarDayIndex(startTs)) / 86_400_000,
  );
  if (calendarDiff > 0) return calendarDiff;

  const startClock = parseTimeToMinutes(startTime);
  const arrivalClock = parseTimeToMinutes(arrivalTime);
  if (startClock !== null && arrivalClock !== null && arrivalClock <= startClock) {
    return 1;
  }

  return 0;
}

/** Legacy-aligned "+N天" tip when arrival is on a later calendar day. */
export function getTrainArrivalDayTipFromTimes(
  startTime?: string,
  arrivalTime?: string,
  options?: { arriveDays?: number; runTime?: string },
): string | null {
  let dayDiff = resolveTrainCalendarDayDiff(startTime, arrivalTime, options?.arriveDays);

  if (options?.runTime) {
    const durationMin = parseDurationMinutes(options.runTime);
    const startTs = parseTrainTimestamp(startTime ?? "");
    if (startTs && durationMin > 0) {
      const inferredDiff = Math.max(
        0,
        Math.round(
          (calendarDayIndex(startTs + durationMin * 60_000) - calendarDayIndex(startTs)) /
            86_400_000,
        ),
      );
      dayDiff = Math.max(dayDiff, inferredDiff);
    }
  }

  return dayDiff > 0 ? `+${dayDiff}天` : null;
}

/** Legacy-aligned "+N天" tip when arrival is on a later calendar day. */
export function getTrainArrivalDayTip(train: TrainItem): string | null {
  return getTrainArrivalDayTipFromTimes(train.StartTime, train.ArrivalTime, {
    arriveDays: train.ArriveDays,
    runTime: train.TravelTime,
  });
}

/** Compact date label for train trip timelines, e.g. `6月27日`. */
export function formatTrainTripDateLabel(value?: string): string | null {
  const datePart = value?.slice(0, 10);
  if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const month = Number(datePart.slice(5, 7));
  const day = datePart.slice(8, 10);
  return `${month}月${day}日`;
}

export function getTrainTripArrivalDayTip(trip: {
  StartTime?: string;
  ArrivalTime?: string;
  RunTime?: string;
}): string | null {
  return getTrainArrivalDayTipFromTimes(trip.StartTime, trip.ArrivalTime, {
    runTime: trip.RunTime,
  });
}

export function resolveTrainTripArrivalDateLabel(trip: {
  StartTime?: string;
  ArrivalTime?: string;
  RunTime?: string;
}): string | null {
  if (!getTrainTripArrivalDayTip(trip)) return null;

  const depDate = trip.StartTime?.slice(0, 10);
  const arrDate = trip.ArrivalTime?.slice(0, 10);
  if (arrDate && depDate && arrDate !== depDate) {
    return formatTrainTripDateLabel(trip.ArrivalTime);
  }

  const startTs = parseTrainTimestamp(trip.StartTime ?? "");
  const durationMin = trip.RunTime ? parseDurationMinutes(trip.RunTime) : 0;
  if (startTs && durationMin > 0) {
    const arrivalTs = startTs + durationMin * 60_000;
    const d = new Date(arrivalTs);
    return `${d.getMonth() + 1}月${String(d.getDate()).padStart(2, "0")}日`;
  }

  return formatTrainTripDateLabel(trip.ArrivalTime);
}

export function parseDurationMinutes(duration?: unknown): number {
  return parseTrainDurationMinutes(duration);
}

/** Legacy list label: "6时10分", "20时0分", or "45分" when under one hour. */
export function formatTrainDurationMinutes(totalMinutes: number): string | null {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return null;
  const minutes = Math.round(totalMinutes);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}分`;
  return `${hours}时${mins}分`;
}

export function formatTrainDuration(train: TrainItem): string | null {
  return formatTrainDurationMinutes(getTrainTravelMinutes(train));
}

function parseTimeToMinutes(value: string): number | null {
  const match = value.match(/(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function durationMinutesFromTimestamps(train: TrainItem): number | undefined {
  const startTs = train.StartTimeStamp ?? parseTrainTimestamp(train.StartTime);
  let arrivalTs = train.ArrivalTimeStamp ?? parseTrainTimestamp(train.ArrivalTime);

  if (startTs && arrivalTs) {
    if (typeof train.ArriveDays === "number" && train.ArriveDays > 0) {
      arrivalTs += train.ArriveDays * 86_400_000;
    } else if (arrivalTs <= startTs) {
      arrivalTs += 86_400_000;
    }
    const minutes = Math.round((arrivalTs - startTs) / 60_000);
    if (minutes > 0) return minutes;
  }

  // Fallback: parse "HH:MM" time strings directly (API may omit date prefix)
  const startMinutes = parseTimeToMinutes(train.StartTime);
  const arrivalMinutes = parseTimeToMinutes(train.ArrivalTime);
  if (startMinutes !== null && arrivalMinutes !== null) {
    if (typeof train.ArriveDays === "number" && train.ArriveDays > 0) {
      return arrivalMinutes + train.ArriveDays * 1440 - startMinutes;
    }
    if (arrivalMinutes <= startMinutes) {
      return arrivalMinutes + 1440 - startMinutes;
    }
    return arrivalMinutes - startMinutes;
  }

  return undefined;
}

/** Legacy TravelTime minutes used for duration sorting. */
export function getTrainTravelMinutes(train: TrainItem): number {
  const travelTime = parseTravelTimeMinutes(train.TravelTime);
  if (travelTime !== undefined) return travelTime;
  if (typeof train.DurationMinutes === "number" && train.DurationMinutes > 0) {
    return train.DurationMinutes;
  }
  const parsed = parseTrainDurationMinutes(train.Duration);
  if (parsed > 0) return parsed;
  return durationMinutesFromTimestamps(train) ?? 0;
}

export function enrichTrainItem(train: TrainItem): TrainItem {
  const startTs = train.StartTimeStamp ?? parseTrainTimestamp(train.StartTime);
  const arrivalTs = train.ArrivalTimeStamp ?? parseTrainTimestamp(train.ArrivalTime);
  const withTimestamps = { ...train, StartTimeStamp: startTs, ArrivalTimeStamp: arrivalTs };

  return {
    ...withTimestamps,
    DurationMinutes: getTrainTravelMinutes(withTimestamps),
  };
}

export function isHighSpeedTrain(code: string): boolean {
  const prefix = code.trim().charAt(0).toUpperCase();
  return prefix === "G" || prefix === "D" || prefix === "C";
}

export function isRegularTrain(code: string): boolean {
  const prefix = code.trim().charAt(0).toUpperCase();
  return prefix === "K" || prefix === "T" || prefix === "Z" || prefix === "Y";
}

export function applyTrainTypeFilter(trains: TrainItem[], mode: TrainTypeFilter): TrainItem[] {
  if (mode === "highSpeed") {
    return trains.filter((t) => isHighSpeedTrain(t.TrainCode));
  }
  if (mode === "regular") {
    return trains.filter((t) => isRegularTrain(t.TrainCode));
  }
  return trains;
}

export const TRAIN_FILTER_TIME_SPANS = [
  { label: "00:00-12:00", value: { lower: 0, upper: 12 } },
  { label: "12:00-18:00", value: { lower: 12, upper: 18 } },
  { label: "18:00-00:00", value: { lower: 18, upper: 24 } },
] as const;

export function createInitialTrainFilter(): TrainFilterCondition {
  return {
    seatTypes: [],
    onlyHasTickets: false,
    departureTimeSpan: null,
    arrivalTimeSpan: null,
  };
}

export function toggleTrainTimeSpan(
  current: { lower: number; upper: number } | null,
  span: { lower: number; upper: number },
): { lower: number; upper: number } | null {
  if (current?.lower === span.lower && current?.upper === span.upper) {
    return null;
  }
  return span;
}

export function resetTrainFilterDraft(filter: TrainFilterCondition): TrainFilterCondition {
  return {
    ...filter,
    onlyHasTickets: false,
    departureTimeSpan: null,
    arrivalTimeSpan: null,
    seatTypes: filter.seatTypes.map((option) => ({ ...option, isChecked: false })),
  };
}

function matchesTimeSpan(time: string, span: { lower: number; upper: number }): boolean {
  const ts = parseTrainTimestamp(time);
  if (!ts) return false;
  const date = new Date(ts);
  const hour = date.getHours();
  const minute = date.getMinutes();
  return span.lower <= hour && (hour < span.upper || (hour === span.upper && minute <= 0));
}

export function buildFilterOptions(trains: TrainItem[]): TrainFilterCondition {
  const filter = createInitialTrainFilter();
  const seen = new Set<string>();

  for (const train of trains) {
    for (const seat of train.Seats ?? []) {
      const name = seat.SeatTypeName?.trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      filter.seatTypes.push({ id: name, label: name, isChecked: false });
    }
  }

  return filter;
}

function checkedIds(options: TrainFilterOption[]): string[] {
  return options.filter((o) => o.isChecked).map((o) => o.id);
}

function seatHasTickets(seat: TrainSeat): boolean {
  const count = seat.Count;
  return count === undefined || count > 0;
}

export function applyTrainFilters(trains: TrainItem[], filter: TrainFilterCondition): TrainItem[] {
  let result = trains;

  const seatTypes = checkedIds(filter.seatTypes);
  if (seatTypes.length) {
    result = result.filter((train) =>
      (train.Seats ?? []).some(
        (seat) =>
          seat.SeatTypeName && seatTypes.includes(seat.SeatTypeName) && seatHasTickets(seat),
      ),
    );
  }

  if (filter.onlyHasTickets) {
    result = result.filter((train) => (train.Seats ?? []).some((seat) => seatHasTickets(seat)));
  }

  if (filter.departureTimeSpan) {
    const span = filter.departureTimeSpan;
    result = result.filter((train) => matchesTimeSpan(train.StartTime, span));
  }

  if (filter.arrivalTimeSpan) {
    const span = filter.arrivalTimeSpan;
    result = result.filter((train) => matchesTimeSpan(train.ArrivalTime, span));
  }

  return result;
}

export function isTrainFilterActive(filter: TrainFilterCondition): boolean {
  return (
    filter.onlyHasTickets ||
    filter.departureTimeSpan !== null ||
    filter.arrivalTimeSpan !== null ||
    filter.seatTypes.some((o: TrainFilterOption) => o.isChecked)
  );
}

export function getDefaultSortedTrains(trains: TrainItem[]): TrainItem[] {
  return [...trains].sort((a, b) => {
    const enrichedA = enrichTrainItem(a);
    const enrichedB = enrichTrainItem(b);
    const depDiff = (enrichedA.StartTimeStamp ?? 0) - (enrichedB.StartTimeStamp ?? 0);
    if (depDiff !== 0) return depDiff;
    return (enrichedA.ArrivalTimeStamp ?? 0) - (enrichedB.ArrivalTimeStamp ?? 0);
  });
}

/** Restore legacy initSortTrains order by train id. */
export function reorderTrainsByIds(trains: TrainItem[], orderedIds: string[]): TrainItem[] {
  const rank = new Map(orderedIds.map((id, index) => [id, index]));
  return [...trains].sort(
    (a, b) =>
      (rank.get(a.Id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.Id) ?? Number.MAX_SAFE_INTEGER),
  );
}

export interface TrainListOrderState {
  activeTab: TrainSortTab;
  durationSortMode: TrainDurationSortMode;
  timeEarlyToLate: boolean;
  priceSortMode: TrainPriceSortMode;
}

/** Resolve list order for toolbar tabs. */
export function resolveTrainListOrder(
  trains: TrainItem[],
  state: TrainListOrderState,
): TrainItem[] {
  if (state.activeTab === "duration" && state.durationSortMode === "short") {
    return sortTrains(trains, "duration", true);
  }
  if (state.activeTab === "duration" && state.durationSortMode === "long") {
    return sortTrains(trains, "duration", false);
  }
  if (state.activeTab === "time") {
    return sortTrains(trains, "time", state.timeEarlyToLate);
  }
  if (state.activeTab === "price" && state.priceSortMode === "low") {
    return sortTrains(trains, "price", true);
  }
  if (state.activeTab === "price" && state.priceSortMode === "high") {
    return sortTrains(trains, "price", false);
  }
  return getDefaultSortedTrains(trains);
}

export function sortTrains(
  trains: TrainItem[],
  kind: TrainSortKind,
  ascending: boolean,
): TrainItem[] {
  return [...trains].sort((a, b) => {
    const enrichedA = enrichTrainItem(a);
    const enrichedB = enrichTrainItem(b);
    let diff = 0;

    if (kind === "duration") {
      diff = getTrainTravelMinutes(enrichedA) - getTrainTravelMinutes(enrichedB);
      if (diff === 0) {
        diff = (enrichedA.StartTimeStamp ?? 0) - (enrichedB.StartTimeStamp ?? 0);
      }
    } else if (kind === "time") {
      diff = (enrichedA.StartTimeStamp ?? 0) - (enrichedB.StartTimeStamp ?? 0);
      if (diff === 0) {
        diff = (enrichedA.ArrivalTimeStamp ?? 0) - (enrichedB.ArrivalTimeStamp ?? 0);
      }
    } else {
      diff = (a.LowestPrice ?? Infinity) - (b.LowestPrice ?? Infinity);
    }

    return ascending ? diff : -diff;
  });
}

export function markLowestPrice(trains: TrainItem[]): TrainItem[] {
  if (!trains.length) return [];
  const lowest = Math.min(...trains.map((t) => t.LowestPrice ?? Infinity));
  return trains.map((train) => ({
    ...train,
    isLowestPrice: Number(train.LowestPrice) === lowest,
  }));
}

/** Stable React key: index + route fields (API ids may duplicate). */
export function getTrainListItemKey(train: TrainItem, index: number): string {
  return [
    index,
    train.Id,
    train.TrainCode,
    train.FromStation,
    train.ToStation,
    train.StartTime,
    train.ArrivalTime,
  ].join("|");
}

export type SeatAvailabilityLabel = {
  text: string;
  scarce: boolean;
};

const SEAT_TYPE_ALIASES: Record<string, string> = {
  硬: "硬座",
  软: "软座",
};

/** Legacy list shows full seat type names (e.g. 硬座, not 硬). */
export function formatSeatTypeDisplayName(name?: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  return SEAT_TYPE_ALIASES[trimmed] ?? trimmed;
}

/** Expanded seat row uses shorter labels (e.g. 二等座 → 二等). */
export function formatSeatTypeShortName(name?: string): string {
  const full = formatSeatTypeDisplayName(name);
  if (full.endsWith("座") && full.length > 2) {
    return full.slice(0, -1);
  }
  return full;
}

export function formatSeatPriceLabel(price?: number): string {
  if (price === undefined) return "0";
  return Number.isInteger(price) ? String(price) : String(price);
}

/** Discount badge such as 9.7折 when sales price is below ticket price. */
export function formatSeatDiscountRate(salesPrice?: number, ticketPrice?: number): string | null {
  if (salesPrice === undefined || ticketPrice === undefined || ticketPrice <= 0) {
    return null;
  }
  if (salesPrice >= ticketPrice) return null;
  const rate = Math.round((salesPrice / ticketPrice) * 100) / 10;
  return `${rate}折`;
}

/** Whether seat is a sleeper type that may expose berth prices. */
export function isSleeperSeat(seat: TrainSeat): boolean {
  const name = formatSeatTypeDisplayName(seat.SeatTypeName);
  return name.includes("卧") || (seat.BedInfos?.length ?? 0) > 0;
}

export const COLLAPSED_SEAT_PREVIEW_LIMIT = 4;

export function formatSeatAvailability(count?: number): SeatAvailabilityLabel {
  if (count === undefined || count <= 0) {
    return { text: "无票", scarce: false };
  }
  if (count <= 5) {
    return { text: `剩${count}张`, scarce: true };
  }
  return { text: "有票", scarce: false };
}

/** Expanded seat row availability: 无票 / 剩N张 / N张 / 有票. */
export function formatExpandedSeatAvailability(count?: number): SeatAvailabilityLabel {
  if (count === undefined || count <= 0) {
    return { text: "无票", scarce: false };
  }
  if (count > 20) {
    return { text: "有票", scarce: false };
  }
  if (count <= 5) {
    return { text: `剩${count}张`, scarce: true };
  }
  return { text: `${count}张`, scarce: false };
}

/** Whether a seat has remaining inventory for list/book UI (Count > 0). */
export function isTrainSeatAvailable(seat: TrainSeat): boolean {
  return (seat.Count ?? 0) > 0;
}

export function hasAvailableTrainSeats(seats: TrainSeat[] | undefined): boolean {
  return (seats ?? []).some(isTrainSeatAvailable);
}

export function filterAvailableTrainSeats(seats: TrainSeat[]): TrainSeat[] {
  return seats.filter(isTrainSeatAvailable);
}

export function minSeatCount(train: TrainItem): number | undefined {
  const counts = (train.Seats ?? [])
    .map((seat) => seat.Count)
    .filter((count): count is number => count !== undefined && count > 0);
  if (!counts.length) return undefined;
  return Math.min(...counts);
}

export function shouldShowScarceTrainBadge(train: TrainItem): boolean {
  const min = minSeatCount(train);
  return min !== undefined && min >= 1 && min <= 5;
}

export function mergeTrainFilterChecks(
  current: TrainFilterCondition,
  next: TrainFilterCondition,
): TrainFilterCondition {
  return {
    onlyHasTickets: current.onlyHasTickets,
    departureTimeSpan: current.departureTimeSpan,
    arrivalTimeSpan: current.arrivalTimeSpan,
    seatTypes: next.seatTypes.map((option: TrainFilterOption) => ({
      ...option,
      isChecked:
        current.seatTypes.find((item: TrainFilterOption) => item.id === option.id)?.isChecked ??
        false,
    })),
  };
}

export function normalizeTrains(trains: TrainItem[] | undefined): TrainItem[] {
  return (trains ?? []).map(enrichTrainItem);
}
