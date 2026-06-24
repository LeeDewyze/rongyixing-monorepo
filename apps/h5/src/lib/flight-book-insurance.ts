import type {
  FlightInitBookResponse,
  FlightInsuranceProduct,
  FlightPassengerBookForm,
  PassengerBookInfo,
} from "@ryx/shared-types";

export interface FlightTmcInsuranceFlags {
  MandatoryBuyInsurance?: boolean;
  FlightHasInsurance?: boolean;
}

export function resolvePassengerFlightForceInsuranceId(
  passenger: PassengerBookInfo,
): string | undefined {
  if (
    "Policy" in passenger.passenger &&
    passenger.passenger.Policy &&
    typeof passenger.passenger.Policy === "object"
  ) {
    const policy = passenger.passenger.Policy as { FlightForceInsuranceId?: string | number };
    if (policy.FlightForceInsuranceId != null && String(policy.FlightForceInsuranceId).trim()) {
      return String(policy.FlightForceInsuranceId);
    }
  }
  return undefined;
}

export function isMandatoryFlightInsurance(
  passenger: PassengerBookInfo,
  tmc?: FlightTmcInsuranceFlags | Record<string, unknown>,
): boolean {
  if (!tmc || !("MandatoryBuyInsurance" in tmc) || !tmc.MandatoryBuyInsurance) {
    return false;
  }
  return Boolean(resolvePassengerFlightForceInsuranceId(passenger));
}

export function findInsuranceProductById(
  products: FlightInsuranceProduct[],
  productId: string,
): FlightInsuranceProduct | undefined {
  return products.find((item) => String(item.Id ?? "") === productId);
}

/** Legacy: pre-select `FlightForceInsuranceId` when mandatory buy is enabled. */
export function resolveForcedInsuranceProductId(
  passenger: PassengerBookInfo,
  products: FlightInsuranceProduct[],
  tmc?: FlightTmcInsuranceFlags | Record<string, unknown>,
): string | undefined {
  if (!isMandatoryFlightInsurance(passenger, tmc)) return undefined;
  const forceId = resolvePassengerFlightForceInsuranceId(passenger);
  if (!forceId) return undefined;
  const matched = findInsuranceProductById(products, forceId);
  return matched ? String(matched.Id ?? "") : undefined;
}

export function formatInsuranceDetailLines(detail?: string): string[] {
  if (!detail?.trim()) return [];
  return detail
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function validatePassengerInsuranceSelection(input: {
  passenger: PassengerBookInfo;
  form: FlightPassengerBookForm;
  products: FlightInsuranceProduct[];
  init?: FlightInitBookResponse;
  tmcHasInsurance: boolean;
}): string | null {
  const { passenger, form, products, init, tmcHasInsurance } = input;
  if (!tmcHasInsurance || products.length === 0) return null;

  const tmc = init?.Tmc as FlightTmcInsuranceFlags | undefined;
  if (!isMandatoryFlightInsurance(passenger, tmc)) return null;

  const forcedId = resolveForcedInsuranceProductId(passenger, products, tmc);
  const passengerName = passenger.credential.Name ?? passenger.passenger.Name ?? "乘机人";

  if (!forcedId) {
    return `${passengerName} 须购买指定保险，当前保险产品不可用，请联系客服`;
  }
  if (form.selectedInsuranceId !== forcedId) {
    return `${passengerName} 须购买指定保险`;
  }
  return null;
}

export function validateAllPassengerInsuranceSelections(input: {
  passengers: PassengerBookInfo[];
  forms: Record<string, FlightPassengerBookForm>;
  insurancesByPassenger: Record<string, FlightInsuranceProduct[]>;
  init?: FlightInitBookResponse;
  tmcHasInsurance: boolean;
}): string | null {
  for (const passenger of input.passengers) {
    const form = input.forms[passenger.id];
    if (!form) continue;
    const error = validatePassengerInsuranceSelection({
      passenger,
      form,
      products: input.insurancesByPassenger[passenger.id] ?? [],
      init: input.init,
      tmcHasInsurance: input.tmcHasInsurance,
    });
    if (error) return error;
  }
  return null;
}
