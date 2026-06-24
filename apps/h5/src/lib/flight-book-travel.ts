import type {
  FlightBookPolicy,
  FlightInitBookResponse,
  FlightOutNumberField,
  FlightPassengerBookForm,
  PassengerBookInfo,
} from "@ryx/shared-types";

import { validatePassengerOutNumbers } from "@/lib/flight-book-outnumber";
import { validatePassengerApprover } from "@/lib/flight-book-approval";

export function filterFlightExpenseTypes(
  expenseTypes: FlightInitBookResponse["ExpenseTypes"],
): NonNullable<FlightInitBookResponse["ExpenseTypes"]> {
  if (!expenseTypes?.length) return [];
  const flightTagged = expenseTypes.filter((item) => !item.Tag || item.Tag === "flight");
  return flightTagged.length ? flightTagged : expenseTypes;
}

export function resolveDefaultExpenseType(
  expenseTypes: FlightInitBookResponse["ExpenseTypes"],
): string {
  const filtered = filterFlightExpenseTypes(expenseTypes);
  return filtered[0]?.Name ?? "";
}

/**
 * Legacy `initCombineInfosShowApproveInfo` — shared 出差信息 anchor passenger.
 * Non-whitelist: last guest; otherwise last selected passenger.
 */
export function resolvePrimaryTravelPassenger(
  passengers: PassengerBookInfo[],
): PassengerBookInfo | undefined {
  if (!passengers.length) return undefined;
  const notWhitelist = passengers.filter((p) => p.isNotWhitelist);
  if (notWhitelist.length) return notWhitelist[notWhitelist.length - 1];
  return passengers[passengers.length - 1];
}

/** Which passenger form holds shared travel fields for book/validation. */
export function resolveTravelFormPassengerId(
  passenger: PassengerBookInfo,
  passengers: PassengerBookInfo[],
): string {
  const primary = resolvePrimaryTravelPassenger(passengers);
  return primary?.id ?? passenger.id;
}

export function shouldRequireIllegalReason(input: {
  policy?: FlightBookPolicy;
  init?: FlightInitBookResponse;
  isNotWhitelist?: boolean;
}): boolean {
  const { policy, init, isNotWhitelist } = input;
  if (isNotWhitelist) return false;
  if (!policy?.Rules?.length) return false;
  const tmc = init?.Tmc as { IsNeedIllegalReason?: boolean } | undefined;
  return Boolean(tmc?.IsNeedIllegalReason ?? true);
}

export function validatePassengerTravelInfo(input: {
  passenger: PassengerBookInfo;
  form: FlightPassengerBookForm;
  policy?: FlightBookPolicy;
  init?: FlightInitBookResponse;
  outNumberFields: FlightOutNumberField[];
  showApproverPicker: boolean;
}): string | null {
  const { form, policy, init, outNumberFields, showApproverPicker } = input;

  if (shouldRequireIllegalReason({ policy, init })) {
    const reason = (form.otherIllegalReason || form.illegalReason || "").trim();
    if (!reason) return "请填写超标原因";
  }

  const outNumberError = validatePassengerOutNumbers(outNumberFields, form.outNumbers);
  if (outNumberError) return outNumberError;

  const approverError = validatePassengerApprover({ form, showPicker: showApproverPicker });
  if (approverError) return approverError;

  return null;
}

export function validateAllPassengerTravelInfo(input: {
  passengers: PassengerBookInfo[];
  forms: Record<string, FlightPassengerBookForm>;
  policy?: FlightBookPolicy;
  policyByPassenger?: Record<string, FlightBookPolicy | undefined>;
  init?: FlightInitBookResponse;
  outNumberFieldsByPassenger: Record<string, FlightOutNumberField[]>;
  showApproverPickerByPassenger: Record<string, boolean>;
}): string | null {
  const primary = resolvePrimaryTravelPassenger(input.passengers);
  const targets = primary ? [primary] : input.passengers;

  for (const passenger of targets) {
    const form = input.forms[passenger.id];
    if (!form) continue;
    const error = validatePassengerTravelInfo({
      passenger,
      form,
      policy: input.policyByPassenger?.[passenger.id] ?? input.policy,
      init: input.init,
      outNumberFields: input.outNumberFieldsByPassenger[passenger.id] ?? [],
      showApproverPicker: input.showApproverPickerByPassenger[passenger.id] ?? false,
    });
    if (error) return error;
  }
  return null;
}
