import type {
  FlightBookPolicy,
  FlightDetailResult,
  FlightFare,
  FlightInsuranceProduct,
  FlightListResult,
  FlightSegment,
} from "@ryx/shared-types";

import type { FlightBookSelection } from "@/lib/flight-book-session";

function createRuleUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Legacy initializeBookDto — uuid keys mapped to rule strings. */
export function buildPolicyRulesMap(rules?: string[]): Record<string, string> | undefined {
  if (!rules?.length) return undefined;
  const map: Record<string, string> = {};
  for (const rule of rules) {
    map[createRuleUuid()] = rule;
  }
  return map;
}

export function resolvePolicyCabin(
  flightPolicy: FlightBookPolicy | undefined,
  fallbackFare: FlightFare,
): FlightFare {
  if (!flightPolicy?.Cabin) return { ...fallbackFare };
  const policyCabin = flightPolicy.Cabin;
  return {
    ...fallbackFare,
    ...policyCabin,
    FlightFareBasics: policyCabin.FlightFareBasics?.length
      ? policyCabin.FlightFareBasics
      : fallbackFare.FlightFareBasics,
    FlightFareRules: policyCabin.FlightFareRules?.length
      ? policyCabin.FlightFareRules
      : fallbackFare.FlightFareRules,
    Key: policyCabin.Key ?? fallbackFare.Key,
    Id: policyCabin.Id ?? flightPolicy.Id ?? fallbackFare.Id,
  };
}

/** Legacy init: full cabin from Home-Detail fare matched by policy Id, plus uuid Rules. */
export function resolveInitFareFromSelection(input: {
  fare: FlightFare;
  flightPolicy?: FlightBookPolicy;
  detailSnapshot?: FlightDetailResult;
}): FlightFare {
  const { fare, flightPolicy, detailSnapshot } = input;
  const policyFareId = flightPolicy?.Id ?? flightPolicy?.Cabin?.Id;
  const detailFare =
    policyFareId && detailSnapshot?.FlightFares?.length
      ? detailSnapshot.FlightFares.find(
          (item) => String(item.Id ?? "") === String(policyFareId),
        )
      : undefined;

  return detailFare ?? fare;
}

export function prepareInitFlightCabinDto(input: {
  flightPolicy?: FlightBookPolicy;
  fare: FlightFare;
  detailSnapshot?: FlightDetailResult;
}): FlightFare {
  const baseFare = resolveInitFareFromSelection(input);
  return prepareFlightCabinDto({
    flightPolicy: input.flightPolicy,
    fare: baseFare,
    detailSnapshot: input.detailSnapshot,
    reconcileWithDetail: true,
    withPolicyRules: true,
  });
}

export function resolveInitFlightSegments(input: {
  selection: FlightBookSelection;
}): FlightSegment[] {
  const { selection } = input;
  const flightNo = (
    selection.segment.Number ??
    selection.segment.FlightNumber ??
    selection.cabinsQuery.flightNumber ??
    ""
  ).toLowerCase();

  const fromDetail = selection.detailSnapshot?.FlightSegments?.filter(
    (segment) =>
      (segment.FlightNumber ?? segment.Number ?? "").toLowerCase() === flightNo,
  );

  const segments = fromDetail?.length ? fromDetail : [selection.segment];
  return segments.map((segment) => {
    const next: FlightSegment = {
      ...segment,
      Number: segment.Number ?? segment.FlightNumber,
      FlightNumber: segment.FlightNumber ?? segment.Number,
    };
    delete (next as { DetailKey?: unknown }).DetailKey;
    delete (next as { Data?: unknown }).Data;
    delete (next as { BookType?: unknown }).BookType;
    delete (next as { CabinCode?: unknown }).CabinCode;
    return next;
  });
}

export function prepareFlightCabinDto(input: {
  flightPolicy?: FlightBookPolicy;
  fare: FlightFare;
  detailSnapshot?: FlightDetailResult;
  insuranceProducts?: FlightInsuranceProduct[];
  reconcileWithDetail?: boolean;
  /** Initialize only — Legacy `initializeBookDto` uuid Rules. Book must stay false. */
  withPolicyRules?: boolean;
}): FlightFare {
  const {
    flightPolicy,
    fare,
    detailSnapshot,
    insuranceProducts,
    reconcileWithDetail,
    withPolicyRules = false,
  } = input;
  let cabin = resolvePolicyCabin(flightPolicy, fare);
  const rulesMap = withPolicyRules ? buildPolicyRulesMap(flightPolicy?.Rules) : undefined;
  if (rulesMap) {
    cabin = { ...cabin, Rules: rulesMap };
  }

  if (reconcileWithDetail && detailSnapshot?.FlightFares?.length) {
    const matched =
      (cabin.Key
        ? detailSnapshot.FlightFares.find((item) => item.Key === cabin.Key)
        : undefined) ??
      detailSnapshot.FlightFares.find(
        (item) =>
          item.Code === cabin.Code &&
          (!cabin.Id || !item.Id || String(item.Id) === String(cabin.Id)),
      );

    if (matched) {
      cabin = {
        ...matched,
        FlightFareBasics: matched.FlightFareBasics?.map((basic) => {
          const next = { ...basic, flightAndTaxFeesInfos: null as null };
          delete (next as { flightAndTaxFeesInfos?: unknown }).flightAndTaxFeesInfos;
          return next;
        }),
        Rules: withPolicyRules ? cabin.Rules : (null as unknown as undefined),
      };
    }
  }

  if (insuranceProducts?.length) {
    cabin = { ...cabin, InsuranceProducts: insuranceProducts };
  }

  if (!withPolicyRules) {
    cabin = { ...cabin, Rules: null as unknown as undefined };
  }

  return cabin;
}

/** Legacy `fillBookPassengers` — detail/policy cabin; Rules stays null (not Initialize uuid map). */
export function prepareBookFlightCabinDto(input: {
  flightPolicy?: FlightBookPolicy;
  fare: FlightFare;
  detailSnapshot?: FlightDetailResult;
  insuranceProducts?: FlightInsuranceProduct[];
  segment: FlightSegment;
}): FlightFare {
  const cabin = prepareFlightCabinDto({
    flightPolicy: input.flightPolicy,
    fare: input.fare,
    detailSnapshot: input.detailSnapshot,
    insuranceProducts: input.insuranceProducts,
    reconcileWithDetail: true,
    withPolicyRules: false,
  });
  return resolveFlightCabinCode(cabin, input.segment);
}

export function syncSegmentWithFlightCabin(
  segment: FlightSegment,
  cabin: FlightFare,
): FlightSegment {
  const next = { ...segment };
  const flightNumber = next.Number ?? next.FlightNumber ?? "";

  if (!next.CabinCode && cabin.CabinCodes && flightNumber) {
    next.CabinCode = cabin.CabinCodes[flightNumber];
  }
  if (!next.CabinCode && cabin.Code) {
    next.CabinCode = cabin.Code;
  }

  return next;
}

export function resolveFlightCabinCode(
  cabin: FlightFare,
  segment: FlightSegment,
): FlightFare {
  const flightNumber = segment.Number ?? segment.FlightNumber ?? "";
  if (cabin.Code || !cabin.CabinCodes || !flightNumber) {
    return cabin;
  }
  return { ...cabin, Code: cabin.CabinCodes[flightNumber] };
}

/** Legacy `getPolicyflightsAsync` — strip heavy fields before Home-Policy. */
export function serializeFlightsForPolicy(listResult: FlightListResult): string {
  const result = listResult.Result;
  if (!result) {
    return JSON.stringify(listResult);
  }

  const resultSegs = result.FlightSegments?.map((segment) => ({
    ...segment,
    totalSegments: null,
    flightListResult: null,
    detailResultForVerify: null,
    detailResult: null,
    Cabins: segment.Cabins?.map((cabin) => ({
      ...cabin,
      FlightFareBasics: cabin.FlightFareBasics?.map((basic) => ({
        ...basic,
        flightAndTaxFeesInfos: null,
      })),
    })),
    transferSegments: null,
  }));

  return JSON.stringify({
    ...result,
    flightResult: null,
    FlightFares: result.FlightFares?.map((fare) => ({
      ...fare,
      FlightFareBasics: fare.FlightFareBasics?.map((basic) => ({
        ...basic,
        flightAndTaxFeesInfos: null,
      })),
    })),
    FlightSegments: resultSegs,
  });
}

export function resolvePassengerTravelPolicy(
  passenger: import("@ryx/shared-types").PassengerBookInfo,
): Record<string, unknown> | undefined {
  if (
    "Policy" in passenger.passenger &&
    passenger.passenger.Policy &&
    typeof passenger.passenger.Policy === "object"
  ) {
    return passenger.passenger.Policy as Record<string, unknown>;
  }
  return undefined;
}

export function resolvePassengerTravelNumber(
  passenger: import("@ryx/shared-types").PassengerBookInfo,
): string | undefined {
  if ("travelNumber" in passenger.passenger && passenger.passenger.travelNumber) {
    return String(passenger.passenger.travelNumber);
  }
  return undefined;
}

/** Legacy `OrderTravelType.Business` */
export const FLIGHT_BOOK_TRAVEL_TYPE_BUSINESS = 1;

/** Legacy `OrderTravelType.Person` */
export const FLIGHT_BOOK_TRAVEL_TYPE_PERSONAL = 2;
