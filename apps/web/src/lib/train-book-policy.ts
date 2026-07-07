import type {
  PassengerBookInfo,
  TrainBookPolicy,
  TrainItem,
  TrainPolicyColor,
  TrainPolicyParams,
  TrainPolicyPassengerResult,
  TrainSeat,
} from "@ryx/shared-types";
import { TrainSeatType, credentialTypeValue, maskCredentialNumber } from "@ryx/shared-types";
import { CredentialType } from "@ryx/shared-types";
import { buildTrainPolicyTrainsPayload } from "@ryx/api";

export function resolvePassengerAccountId(passenger: PassengerBookInfo): string {
  const fromPassenger =
    "AccountId" in passenger.passenger && passenger.passenger.AccountId
      ? String(passenger.passenger.AccountId)
      : "";
  const fromCredential = passenger.credential.AccountId
    ? String(passenger.credential.AccountId)
    : "";
  return fromPassenger || fromCredential || String(passenger.id);
}

const BERTH_POLICY_GROUPS: Record<number, number> = {
  [TrainSeatType.HardBerthUp]: TrainSeatType.HardBerth,
  [TrainSeatType.HardBerth]: TrainSeatType.HardBerth,
  [TrainSeatType.HardBerthDown]: TrainSeatType.HardBerth,
  [TrainSeatType.SoftBerthUp]: TrainSeatType.SoftBerth,
  [TrainSeatType.SoftBerth]: TrainSeatType.SoftBerth,
  [TrainSeatType.BusinessBerthUp]: TrainSeatType.BusinessBerthDown,
  [TrainSeatType.BusinessBerthDown]: TrainSeatType.BusinessBerthDown,
  [TrainSeatType.FirstClassBerth]: TrainSeatType.FirstClassBerth,
  [TrainSeatType.FirstClassBerthDown]: TrainSeatType.FirstClassBerth,
  [TrainSeatType.SecondClassBerth]: TrainSeatType.SecondClassBerth,
  [TrainSeatType.SecondClassBerthMiddle]: TrainSeatType.SecondClassBerth,
  [TrainSeatType.SecondClassBerthDown]: TrainSeatType.SecondClassBerth,
};

/** Normalize berth tier SeatType for policy lookup. */
export function resolvePolicySeatType(seat: TrainSeat): number | undefined {
  if (seat.SeatType != null) {
    return BERTH_POLICY_GROUPS[seat.SeatType] ?? seat.SeatType;
  }
  const name = seat.SeatTypeName?.replace(/[上中下]$/, "").trim();
  if (!name) return undefined;
  const map: Record<string, number> = {
    无座: TrainSeatType.NoSeat,
    硬座: TrainSeatType.HardSeat,
    软座: TrainSeatType.SoftSeat,
    硬卧: TrainSeatType.HardBerth,
    软卧: TrainSeatType.SoftBerth,
    高级软卧: TrainSeatType.HighGradeSoftBerth,
    二等座: TrainSeatType.SecondClassSeat,
    一等座: TrainSeatType.FirstClassSeat,
    特等座: TrainSeatType.SpecialSeat,
    商务座: TrainSeatType.BusinessSeat,
    动卧: TrainSeatType.BusinessBerthDown,
    一等卧: TrainSeatType.FirstClassBerth,
    二等卧: TrainSeatType.SecondClassBerth,
  };
  return map[name];
}

export function coercePolicyIsAllowBook(policy: TrainBookPolicy | undefined): boolean {
  if (!policy) return true;
  if (policy.IsAllowBook === false) return false;
  return true;
}

function resolvePolicyItemColor(policy: TrainBookPolicy): TrainPolicyColor {
  if (!coercePolicyIsAllowBook(policy)) return "danger";
  // Legacy only uses Rules (not Descriptions) for warning color.
  if (policy.Rules?.length) return "warning";
  return "success";
}

/**
 * Legacy train policy seat match (`tmc-train.service.ts:280-282`):
 *   `p.TrainNo == train.TrainNo && p.SeatType == seat.SeatType`
 * Uses loose equality (`==`) like legacy.
 */
export function matchesTrainPolicySeat(
  policy: Pick<TrainBookPolicy, "TrainNo" | "SeatType">,
  train: TrainItem,
  seat: TrainSeat,
): boolean {
  if (policy.SeatType == null || seat.SeatType == null) return false;

  const trainNo = train.TrainNo;
  if (!trainNo) return false;

  return policy.TrainNo == trainNo && policy.SeatType == seat.SeatType;
}

function findSeatPolicy(
  policies: TrainBookPolicy[] | undefined,
  train: TrainItem,
  seat: TrainSeat,
): TrainBookPolicy | undefined {
  if (!policies?.length) return undefined;

  return policies.find((policy) => matchesTrainPolicySeat(policy, train, seat));
}

function findPassengerPolicyEntry(
  results: TrainPolicyPassengerResult[] | undefined,
  passengers: PassengerBookInfo[],
  filterPassengerId: string | null | undefined,
): TrainPolicyPassengerResult | undefined {
  if (!results?.length) return undefined;
  if (filterPassengerId) {
    const passenger = passengers.find((item) => item.id === filterPassengerId);
    if (!passenger) return undefined;
    const accountId = resolvePassengerAccountId(passenger);
    return results.find((entry) => entry.PassengerKey == accountId);
  }
  const primary = passengers[0];
  if (!primary) return undefined;
  const accountId = resolvePassengerAccountId(primary);
  return results.find((entry) => entry.PassengerKey == accountId);
}

export function applyTrainPolicyColors(
  trains: TrainItem[],
  policyResults: TrainPolicyPassengerResult[] | undefined,
  passengers: PassengerBookInfo[],
  filterPassengerId?: string | null,
): TrainItem[] {
  const entry = findPassengerPolicyEntry(policyResults, passengers, filterPassengerId);

  return trains.map((train) => ({
    ...train,
    Seats: (train.Seats ?? []).map((seat) => {
      const policy = findSeatPolicy(entry?.TrainPolicies, train, seat);
      const policyColor: TrainPolicyColor = policy ? resolvePolicyItemColor(policy) : "secondary";
      return {
        ...seat,
        policy,
        policyColor,
      };
    }),
  }));
}

export function isTrainSeatBookable(
  color: TrainPolicyColor | undefined,
  isAgent: boolean,
  policyChecked = true,
): boolean {
  if (!policyChecked) return false;
  if (!color) return false;
  // Legacy: agents may proceed when IsAllowBook is false (bookInfo kept); non-agents blocked.
  if (color === "danger" && !isAgent) return false;
  return (
    color === "success" ||
    color === "warning" ||
    color === "secondary" ||
    (color === "danger" && isAgent)
  );
}

export function trainPolicyButtonClassName(color: TrainPolicyColor | undefined): string {
  switch (color) {
    case "success":
      return "bg-[#34C759] text-white active:opacity-90";
    case "warning":
      return "bg-[#FF8C00] text-white active:opacity-90";
    case "danger":
      return "bg-[#EF4444] text-white active:opacity-90";
    case "secondary":
    default:
      return "bg-brand-header-start text-white active:opacity-90";
  }
}

function formatPassengerCredentialForAlert(passenger: PassengerBookInfo): string {
  const credential = passenger.credential;
  const number = credential.Number?.trim();
  if (number) {
    if (credentialTypeValue(credential) === CredentialType.IdCard) {
      return maskCredentialNumber(number);
    }
    return number;
  }
  return credential.HideNumber?.trim() ?? credential.HideCredentialsNumber?.trim() ?? "";
}

export function buildTrainPolicyExceedAlertMessage(
  _train: TrainItem,
  seat: TrainSeat,
  passengers: PassengerBookInfo[],
  isAgent = false,
): string {
  const rules = seat.policy?.Rules?.filter(Boolean) ?? [];
  const ruleText = rules.length ? rules.join("；") : "违反差旅标准";
  const chunks = passengers.map((passenger) => {
    const credential = formatPassengerCredentialForAlert(passenger);
    const name = passenger.credential.Name ?? "";
    const identity = credential ? `(${credential})` : "";
    return `${name}${identity};${ruleText}`;
  });
  const prefix = chunks.join(",");
  return isAgent ? `超标:${prefix}` : `${prefix}，超标不可预订`;
}

export function buildTrainPolicyParams(input: {
  trains: TrainItem[];
  passengers: PassengerBookInfo[];
  travelFormId?: string;
}): TrainPolicyParams | null {
  const { trains, passengers, travelFormId } = input;
  if (!trains.length || !passengers.length) return null;

  const accountIds = passengers
    .map((passenger) => resolvePassengerAccountId(passenger))
    .filter(Boolean);

  const uniqueIds = Array.from(new Set(accountIds));
  if (!uniqueIds.length) return null;

  const travelFormIds = passengers
    .map((item) => ("travelFormId" in item.passenger ? item.passenger.travelFormId : undefined))
    .filter((id): id is string => Boolean(id?.trim()));

  const payload = buildTrainPolicyTrainsPayload(trains);

  return {
    Passengers: uniqueIds.join(","),
    Trains: JSON.stringify(payload),
    TravelFromId:
      travelFormId ??
      (travelFormIds.length ? Array.from(new Set(travelFormIds)).join(",") : undefined),
  };
}

export function findSeatPolicyForPassenger(
  policyResults: TrainPolicyPassengerResult[] | undefined,
  passengers: PassengerBookInfo[],
  train: TrainItem,
  seat: TrainSeat,
  passengerId: string,
): TrainBookPolicy | undefined {
  const passenger = passengers.find((item) => item.id === passengerId);
  if (!passenger) return undefined;
  const accountId = resolvePassengerAccountId(passenger);
  const entry = policyResults?.find((item) => item.PassengerKey === accountId);
  return findSeatPolicy(entry?.TrainPolicies, train, seat);
}
