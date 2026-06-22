import type {
  TrainFilterCondition,
  TrainFilterOption,
  TrainItem,
  TrainSeat,
  TrainSortKind,
  TrainTypeFilter,
} from "@ryx/shared-types";

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

/** Legacy-aligned "+N天" tip when arrival is on a later calendar day. */
export function getTrainArrivalDayTip(train: TrainItem): string | null {
  const arriveDays = train.ArriveDays;
  if (typeof arriveDays === "number" && arriveDays > 0) {
    return `+${arriveDays}天`;
  }

  const startTs = train.StartTimeStamp ?? parseTrainTimestamp(train.StartTime);
  const arrivalTs = train.ArrivalTimeStamp ?? parseTrainTimestamp(train.ArrivalTime);
  if (!startTs || !arrivalTs) return null;

  const dayDiff = Math.round(
    (calendarDayIndex(arrivalTs) - calendarDayIndex(startTs)) / 86_400_000,
  );
  return dayDiff > 0 ? `+${dayDiff}天` : null;
}

export function parseDurationMinutes(duration?: string): number {
  if (!duration) return 0;
  const hourMatch = duration.match(/(\d+)\s*小时/);
  const minuteMatch = duration.match(/(\d+)\s*分/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  return hours * 60 + minutes;
}

export function enrichTrainItem(train: TrainItem): TrainItem {
  return {
    ...train,
    StartTimeStamp: train.StartTimeStamp ?? parseTrainTimestamp(train.StartTime),
    ArrivalTimeStamp: train.ArrivalTimeStamp ?? parseTrainTimestamp(train.ArrivalTime),
    DurationMinutes: train.DurationMinutes ?? parseDurationMinutes(train.Duration),
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

export function createInitialTrainFilter(): TrainFilterCondition {
  return {
    seatTypes: [],
    onlyHasTickets: false,
    departureTimeSpan: null,
  };
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
    const { lower, upper } = filter.departureTimeSpan;
    result = result.filter((train) => {
      const hour = new Date(parseTrainTimestamp(train.StartTime)).getHours();
      return hour >= lower && hour < upper;
    });
  }

  return result;
}

export function isTrainFilterActive(filter: TrainFilterCondition): boolean {
  return (
    filter.onlyHasTickets ||
    filter.departureTimeSpan !== null ||
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
      diff = (enrichedA.DurationMinutes ?? 0) - (enrichedB.DurationMinutes ?? 0);
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

export type SeatAvailabilityLabel = {
  text: string;
  scarce: boolean;
};

export function formatSeatAvailability(count?: number): SeatAvailabilityLabel {
  if (count === undefined || count <= 0) {
    return { text: "无票", scarce: false };
  }
  if (count <= 5) {
    return { text: `剩${count}张`, scarce: true };
  }
  return { text: "有票", scarce: false };
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
