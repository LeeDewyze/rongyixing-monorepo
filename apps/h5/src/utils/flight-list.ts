import type {
  FlightFilterCondition,
  FlightFilterOption,
  FlightListResult,
  FlightSegment,
} from "@ryx/shared-types";

export function parseFlightTimestamp(value: string): number {
  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T");
  const ts = Date.parse(normalized);
  return Number.isFinite(ts) ? ts : 0;
}

export function enrichSegment(seg: FlightSegment): FlightSegment {
  return {
    ...seg,
    Number: seg.Number || seg.FlightNumber || "",
    FlightNumber: seg.FlightNumber || seg.Number,
    TakeoffTimeStamp: seg.TakeoffTimeStamp ?? parseFlightTimestamp(seg.TakeoffTime),
    ArrivalTimeStamp: seg.ArrivalTimeStamp ?? parseFlightTimestamp(seg.ArrivalTime),
  };
}

/** Normalize Home-Index payload (FlightViews or Result.FlightSegments). */
export function normalizeFlightSegments(result: FlightListResult | undefined): FlightSegment[] {
  if (!result) return [];

  if (result.FlightViews?.length) {
    return result.FlightViews
      .map((view) => {
        const seg = view.Segment;
        if (!seg) return null;
        return enrichSegment({
          ...seg,
          LowestFare: seg.LowestFare ?? view.Price,
          Number: seg.Number || seg.FlightNumber || "",
        });
      })
      .filter((s): s is FlightSegment => Boolean(s));
  }

  return (result.Result?.FlightSegments ?? []).map(enrichSegment);
}

export function initLowestPriceSegments(segments: FlightSegment[]): FlightSegment[] {
  if (!segments.length) return [];
  const lowest = Math.min(...segments.map((s) => Number(s.LowestFare ?? Infinity)));
  return segments.map((seg) => ({
    ...seg,
    isLowestPrice: Number(seg.LowestFare) === lowest,
  }));
}

export function getDefaultSortedFlights(segments: FlightSegment[]): FlightSegment[] {
  const vm = initLowestPriceSegments(segments);
  const byTime = (a: FlightSegment, b: FlightSegment) => {
    const t1 = a.TakeoffTimeStamp ?? 0;
    const t2 = b.TakeoffTimeStamp ?? 0;
    if (t1 !== t2) return t1 - t2;
    return (a.ArrivalTimeStamp ?? 0) - (b.ArrivalTimeStamp ?? 0);
  };

  const transfers = vm.filter((it) => it.IsTransfer && !it.IsStop).sort(byTime);
  const stops = vm.filter((it) => it.IsStop && !it.IsTransfer);
  const stopLowestFare = stops.sort((a, b) => +a.LowestFare! - +b.LowestFare!)[0]?.LowestFare;
  const stopLowest = stops.filter((it) => it.LowestFare === stopLowestFare).sort(byTime);
  const stopOthers = stops.filter((it) => it.LowestFare !== stopLowestFare).sort(byTime);
  const direct = vm.filter((it) => !it.IsStop && !it.IsTransfer);
  const directLowest = direct.filter((it) => it.isLowestPrice).sort(byTime);
  const directOthers = direct.filter((it) => !it.isLowestPrice).sort(byTime);

  return [...directLowest, ...directOthers, ...stopLowest, ...stopOthers, ...transfers];
}

export function sortByPrice(segments: FlightSegment[], lowToHigh: boolean): FlightSegment[] {
  return [...segments].sort((a, b) => {
    const diff = +(a.LowestFare ?? 0) - +(b.LowestFare ?? 0);
    return lowToHigh ? diff : -diff;
  });
}

export function sortByTime(segments: FlightSegment[], earlyToLate: boolean): FlightSegment[] {
  return [...segments].sort((a, b) => {
    const diff = (a.TakeoffTimeStamp ?? 0) - (b.TakeoffTimeStamp ?? 0);
    if (diff !== 0) return earlyToLate ? diff : -diff;
    const arr = (a.ArrivalTimeStamp ?? 0) - (b.ArrivalTimeStamp ?? 0);
    return earlyToLate ? arr : -arr;
  });
}

export function createInitialFilter(): FlightFilterCondition {
  return {
    onlyDirect: false,
    isAgreement: false,
    airCompanies: [],
    fromAirports: [],
    toAirports: [],
    airTypes: [],
    takeOffTimeSpan: null,
  };
}

export function buildFilterOptions(segments: FlightSegment[]): FlightFilterCondition {
  const filter = createInitialFilter();
  const pushUnique = (
    list: FlightFilterOption[],
    item: FlightFilterOption,
  ) => {
    if (!list.some((x) => x.id === item.id)) list.push(item);
  };

  for (const s of segments) {
    if (s.Airline && s.AirlineName) {
      pushUnique(filter.airCompanies, {
        id: s.Airline,
        label: s.AirlineName,
        isChecked: false,
      });
    }
    if (s.FromAirport && s.FromAirportName) {
      pushUnique(filter.fromAirports, {
        id: s.FromAirport,
        label: s.FromAirportName,
        isChecked: false,
      });
    }
    if (s.ToAirport && s.ToAirportName) {
      pushUnique(filter.toAirports, {
        id: s.ToAirport,
        label: s.ToAirportName,
        isChecked: false,
      });
    }
    if (s.PlaneType) {
      pushUnique(filter.airTypes, {
        id: s.PlaneType,
        label: s.PlaneTypeDescribe || s.PlaneType,
        isChecked: false,
      });
    }
  }

  return filter;
}

function checkedIds(options: FlightFilterOption[]): string[] {
  return options.filter((o) => o.isChecked).map((o) => o.id);
}

export function applyFlightFilters(
  segments: FlightSegment[],
  filter: FlightFilterCondition,
): FlightSegment[] {
  let result = segments;

  if (filter.onlyDirect) {
    result = result.filter((s) => !s.IsTransfer && !s.IsStop);
  }
  if (filter.isAgreement) {
    result = result.filter((s) => s.IsAgreement);
  }

  const airlines = checkedIds(filter.airCompanies);
  if (airlines.length) {
    result = result.filter((s) => s.Airline && airlines.includes(s.Airline));
  }

  const fromAirports = checkedIds(filter.fromAirports);
  if (fromAirports.length) {
    result = result.filter((s) => s.FromAirport && fromAirports.includes(s.FromAirport));
  }

  const toAirports = checkedIds(filter.toAirports);
  if (toAirports.length) {
    result = result.filter((s) => s.ToAirport && toAirports.includes(s.ToAirport));
  }

  const airTypes = checkedIds(filter.airTypes);
  if (airTypes.length) {
    result = result.filter((s) => s.PlaneType && airTypes.includes(s.PlaneType));
  }

  if (filter.takeOffTimeSpan) {
    const { lower, upper } = filter.takeOffTimeSpan;
    result = result.filter((s) => {
      const hour = new Date(parseFlightTimestamp(s.TakeoffTime)).getHours();
      return hour >= lower && hour < upper;
    });
  }

  return result;
}

export function isFilterActive(filter: FlightFilterCondition): boolean {
  return (
    filter.onlyDirect ||
    filter.isAgreement ||
    filter.takeOffTimeSpan !== null ||
    filter.airCompanies.some((o) => o.isChecked) ||
    filter.fromAirports.some((o) => o.isChecked) ||
    filter.toAirports.some((o) => o.isChecked) ||
    filter.airTypes.some((o) => o.isChecked)
  );
}

export function formatFlightTime(value: string): string {
  const part = value.includes(" ") ? value.split(" ")[1] : value;
  return part?.slice(0, 5) ?? value;
}
