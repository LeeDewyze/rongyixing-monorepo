import type {
  HotelDetailResponse,
  HotelPolicyColor,
  HotelPolicyItem,
  HotelPolicyParams,
  HotelPolicyPassengerResult,
  HotelRoom,
  HotelRoomPlan,
  PassengerBookInfo,
} from "@ryx/shared-types";

function getPassengerAccountId(passenger: PassengerBookInfo): string {
  if ("AccountId" in passenger.passenger && passenger.passenger.AccountId) {
    return String(passenger.passenger.AccountId);
  }
  return String(passenger.passenger.Id ?? passenger.id);
}

type LegacyPolicyRoomPlan = {
  TotalAmount?: number;
  Number?: number;
  SupplierNumber?: number;
  BeginDate?: string;
  EndDate?: string;
  Room?: { Id: string };
  Id?: string;
  SupplierType?: number;
};

function getPlanUniqueId(plan: HotelRoomPlan): string {
  return plan.RoomPlanUniqueId ?? plan.PlanId;
}

/** Legacy Home-Policy RoomPlans JSON array (deduped by RoomPlanUniqueId). */
export function buildHotelPolicyRoomPlansPayload(
  detail: HotelDetailResponse,
): LegacyPolicyRoomPlan[] {
  const seen = new Set<string>();
  const result: LegacyPolicyRoomPlan[] = [];

  for (const room of detail.Rooms ?? []) {
    for (const plan of room.Plans) {
      const uniqueId = getPlanUniqueId(plan);
      if (seen.has(uniqueId)) continue;
      seen.add(uniqueId);

      const legacyId = plan.LegacyId;
      const idEmpty = !legacyId || legacyId === "0";
      const item: LegacyPolicyRoomPlan = {
        TotalAmount: plan.TotalAmount ?? plan.Price,
        Number: plan.Number,
        SupplierNumber: plan.SupplierNumber,
        BeginDate: detail.CheckInDate,
        EndDate: detail.CheckOutDate,
        Room: { Id: room.RoomId },
      };

      if (!idEmpty) {
        item.Id = legacyId;
      }
      if (idEmpty && plan.SupplierType != null) {
        item.SupplierType = plan.SupplierType;
      }
      if (plan.SupplierType === 4) {
        item.SupplierType = plan.SupplierType;
      }

      result.push(item);
    }
  }

  return result;
}

export function buildHotelPolicyParams(input: {
  detail: HotelDetailResponse;
  passengers: PassengerBookInfo[];
  cityCode: string;
}): HotelPolicyParams | null {
  const { detail, passengers, cityCode } = input;
  if (!cityCode || passengers.length === 0) return null;

  const accountIds = [
    ...new Set(
      passengers.map((item) => getPassengerAccountId(item)).filter((value) => Boolean(value)),
    ),
  ].join(",");

  if (!accountIds) return null;

  const travelFormIds = [
    ...new Set(
      passengers
        .map((item) => ("travelFormId" in item.passenger ? item.passenger.travelFormId : undefined))
        .filter((value): value is string => Boolean(value && String(value).trim())),
    ),
  ];

  return {
    RoomPlans: JSON.stringify(buildHotelPolicyRoomPlansPayload(detail)),
    Passengers: accountIds,
    CityCode: cityCode,
    TravelFromId: travelFormIds.length ? travelFormIds.join(",") : undefined,
  };
}

function resolvePolicyItemColor(policy: HotelPolicyItem, plan?: HotelRoomPlan): HotelPolicyColor {
  if (plan?.Number === 0) return "danger_full";
  if (policy.IsAllowBook === true) {
    return policy.Rules?.length ? "warning" : "success";
  }
  const rulesText = (policy.Rules ?? []).join("");
  if (/满|售罄|无房/.test(rulesText)) return "danger_full";
  if (/权限|无权限/.test(rulesText)) return "danger_nopermission";
  return "danger_disabled";
}

export function buildPolicyColorMap(input: {
  results: HotelPolicyPassengerResult[] | undefined;
  filterPassengerId: string | null;
  passengers: PassengerBookInfo[];
  detail: HotelDetailResponse;
}): Record<string, HotelPolicyColor> {
  const { results, filterPassengerId, passengers, detail } = input;
  if (!results?.length || passengers.length === 0) return {};

  const selectedPassenger = filterPassengerId
    ? passengers.find((item) => item.id === filterPassengerId)
    : passengers[0];
  const passengerKey = getPassengerAccountId(selectedPassenger ?? passengers[0]!);

  const entry =
    results.find((item) => String(item.PassengerKey ?? "") === passengerKey) ?? results[0];

  const planByUniqueId = new Map<string, HotelRoomPlan>();
  for (const room of detail.Rooms ?? []) {
    for (const plan of room.Plans) {
      planByUniqueId.set(getPlanUniqueId(plan), plan);
    }
  }

  const colors: Record<string, HotelPolicyColor> = {};
  for (const policy of entry?.HotelPolicies ?? []) {
    const uniqueId = policy.UniqueIdId;
    if (!uniqueId) continue;
    colors[uniqueId] = resolvePolicyItemColor(policy, planByUniqueId.get(uniqueId));
  }
  return colors;
}

export function resolvePlanPolicyColor(
  plan: HotelRoomPlan,
  colors: Record<string, HotelPolicyColor>,
): HotelPolicyColor | undefined {
  return colors[getPlanUniqueId(plan)];
}

export function isRoomFullyBooked(
  room: HotelRoom,
  colors: Record<string, HotelPolicyColor>,
): boolean {
  if (!room.Plans.length) return true;
  if (!Object.keys(colors).length) return false;
  return room.Plans.every(
    (plan: HotelRoomPlan) => resolvePlanPolicyColor(plan, colors) === "danger_full",
  );
}

/** Legacy agent override: agents may book unless fully sold out. */
export function isHotelPlanBookable(
  color: HotelPolicyColor | undefined,
  isAgent: boolean,
): boolean {
  if (isAgent) return color !== "danger_full";
  if (!color) return true;
  return color === "success" || color === "warning";
}

export function formatHotelPolicyBlockMessage(
  color: HotelPolicyColor | undefined,
  passengerName?: string,
  rules?: string[],
): string {
  const who = passengerName ? `${passengerName}：` : "";
  const ruleText = rules?.length ? rules.join("；") : "";
  switch (color) {
    case "danger_full":
      return `${who}该房型已满房，无法预订`;
    case "danger_nopermission":
      return `${who}无预订权限${ruleText ? `：${ruleText}` : ""}`;
    case "danger_disabled":
      return `${who}不符合差旅标准${ruleText ? `：${ruleText}` : ""}`;
    default:
      return `${who}无法预订${ruleText ? `：${ruleText}` : ""}`;
  }
}

export function policyButtonClassName(color: HotelPolicyColor | undefined): string {
  switch (color) {
    case "success":
      return "bg-[#2768FA] text-white active:opacity-90";
    case "warning":
      return "bg-[#FF8C00] text-white active:opacity-90";
    case "danger_disabled":
    case "danger_full":
    case "danger_nopermission":
      return "bg-[#CCCCCC] text-white cursor-not-allowed";
    default:
      return "bg-[#2768FA] text-white active:opacity-90";
  }
}
