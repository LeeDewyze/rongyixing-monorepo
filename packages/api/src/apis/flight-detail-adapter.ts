import type {
  FlightDetailResult,
  FlightFare,
  FlightFareBasic,
  FlightFareRule,
} from "@ryx/shared-types";

function parseVariablesObject(value: unknown): Record<string, unknown> | undefined {
  let current: unknown = value;
  for (let depth = 0; depth < 2; depth += 1) {
    if (!current) return undefined;
    if (typeof current === "object") return current as Record<string, unknown>;
    if (typeof current !== "string") return undefined;
    try {
      current = JSON.parse(current) as unknown;
    } catch {
      return undefined;
    }
  }
  return typeof current === "object" && current != null
    ? (current as Record<string, unknown>)
    : undefined;
}

/** Legacy `CabintypePipe` — `initDetailResult` fills missing `CabinTypeName`. */
export function formatCabinTypeName(cabinType: number | string | undefined): string {
  switch (Number(cabinType)) {
    case 1:
      return "经济舱";
    case 2:
      return "公务舱";
    case 4:
      return "头等舱";
    case 8:
      return "高端经济舱";
    case 16:
      return "折扣公务舱";
    case 32:
      return "折扣头等舱";
    case 64:
      return "超级头等舱";
    case 128:
      return "豪华公务舱";
    default:
      return typeof cabinType === "string" && cabinType ? cabinType : "";
  }
}

export function normalizeEntityKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeEntityKeys(item));
  }
  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(record)) {
    const nextKey = key.charAt(0).toUpperCase() + key.slice(1);
    normalized[nextKey] = normalizeEntityKeys(nested);
  }
  return normalized;
}

/** Unwrap Home-Detail payload and normalize camelCase keys to Legacy PascalCase. */
export function adaptFlightDetailResponse(raw: unknown): FlightDetailResult {
  let payload = raw;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload) as unknown;
    } catch {
      return {};
    }
  }
  if (!payload || typeof payload !== "object") return {};

  const normalized = normalizeEntityKeys(payload) as Record<string, unknown>;
  if (Array.isArray(normalized.FlightFares) || Array.isArray(normalized.FlightSegments)) {
    return normalized as FlightDetailResult;
  }

  const nestedData = normalized.Data;
  if (nestedData && typeof nestedData === "object") {
    const inner = normalizeEntityKeys(nestedData) as FlightDetailResult;
    if (Array.isArray(inner.FlightFares) || Array.isArray(inner.FlightSegments)) {
      return inner;
    }
  }

  const nested = normalized.Result;
  if (nested && typeof nested === "object") {
    const result = normalizeEntityKeys(nested) as FlightDetailResult;
    if (Array.isArray(result.FlightFares) || Array.isArray(result.FlightSegments)) {
      return result;
    }
  }

  return normalized as FlightDetailResult;
}

function enrichFlightFareRules(rules: FlightFareRule[] | undefined): FlightFareRule[] | undefined {
  if (!rules?.length) return rules;

  return rules.map((rule) => {
    let variablesObj =
      typeof rule.Variables === "object" && rule.Variables
        ? (rule.Variables as Record<string, unknown>)
        : parseVariablesObject(rule.Variables);
    variablesObj = variablesObj ?? parseVariablesObject(rule.VariablesObj);

    if (variablesObj) {
      variablesObj = {
        ...variablesObj,
        Details: Object.keys(variablesObj)
          .sort()
          .map((name) => ({ name, value: variablesObj![name] })),
      };
    }

    return {
      ...rule,
      VariablesObj: variablesObj ?? rule.VariablesObj,
    };
  });
}

function enrichFlightFareBasics(
  basics: FlightFareBasic[] | undefined,
  fare: FlightFare,
): FlightFareBasic[] | undefined {
  if (!basics?.length) return basics;

  return basics.map((basic) => ({
    ...basic,
    CabinTypeName: basic.CabinTypeName || formatCabinTypeName(basic.CabinType) || undefined,
    Discount: basic.Discount ?? fare.Discount,
    Count: basic.Count ?? fare.Count,
  }));
}

export function resolveCheckedBaggage(fare: FlightFare): string | undefined {
  for (const rule of fare.FlightFareRules ?? []) {
    if (rule.Name !== "托运行李额" && rule.Name !== "免费行李额") continue;
    const description = rule.Description?.trim();
    if (description) return description;
  }
  return undefined;
}

/**
 * Port of Legacy `TmcFlightService.initDetailResult` fare processing (ryx).
 * Parses Variables / rules and enriches `FlightFareBasics.CabinTypeName`.
 */
export function applyLegacyInitDetailResult(fare: FlightFare): FlightFare {
  let variablesObj: Record<string, unknown> | undefined;
  if (typeof fare.Variables === "string") {
    try {
      variablesObj = JSON.parse(fare.Variables) as Record<string, unknown>;
    } catch {
      variablesObj = parseVariablesObject(fare.Variables);
    }
  } else if (fare.Variables && typeof fare.Variables === "object") {
    variablesObj = fare.Variables as Record<string, unknown>;
  } else {
    variablesObj = parseVariablesObject(fare.VariablesObj);
  }

  const baggage = resolveCheckedBaggage(fare);
  if (baggage) {
    variablesObj = { ...(variablesObj ?? {}), Baggage: baggage };
  }

  if (fare.Explain && variablesObj && !variablesObj.Explain) {
    variablesObj = { ...variablesObj, Explain: fare.Explain };
  }

  const flightFareBasics = enrichFlightFareBasics(fare.FlightFareBasics, fare);
  const resolvedCount =
    fare.Count ??
    flightFareBasics?.find((basic) => basic.Count != null && basic.Count !== "")?.Count;

  return {
    ...fare,
    FlightNumber:
      fare.FlightNumber ||
      (typeof variablesObj?.FlightNumber === "string" ? variablesObj.FlightNumber : "") ||
      "",
    Count: resolvedCount,
    VariablesObj: variablesObj ?? fare.VariablesObj,
    Variables: variablesObj ?? fare.Variables,
    FlightFareRules: enrichFlightFareRules(fare.FlightFareRules) ?? fare.FlightFareRules,
    FlightFareBasics: flightFareBasics ?? fare.FlightFareBasics,
  };
}

export function normalizeFlightDetailResult(result: FlightDetailResult): FlightDetailResult {
  return {
    ...result,
    FlightFares: result.FlightFares?.map(applyLegacyInitDetailResult),
    FlightSegments: result.FlightSegments,
  };
}

export function normalizeFlightDetailResponse(raw: unknown): FlightDetailResult {
  return normalizeFlightDetailResult(adaptFlightDetailResponse(raw));
}

/**
 * Legacy `replaceOldFlightSegmentInfo`: Cabins from Home-Detail `FlightFares`
 * where `FlightNumber.includes(segment.Number)`.
 */
export function selectCabinsForSegment(
  result: FlightDetailResult,
  flightNumber: string,
): FlightFare[] {
  const fares = result.FlightFares ?? [];
  if (!fares.length) return [];
  const upper = flightNumber.toUpperCase();
  const prepared = fares.map(applyLegacyInitDetailResult);
  const matched = prepared.filter((fare) =>
    (fare.FlightNumber ?? "").toUpperCase().includes(upper),
  );
  return matched.length ? matched : prepared;
}
