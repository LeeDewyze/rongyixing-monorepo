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
  Number?: number | string;
  SupplierNumber?: number | string;
  BeginDate?: string;
  EndDate?: string;
  Room?: { Id: string | number };
  Id?: string;
  SupplierType?: number | string;
};

/** Legacy Home-Policy uses plan BeginDate/EndDate with time suffix when present. */
export function toLegacyPolicyDate(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (trimmed.includes("T")) return trimmed;
  return `${trimmed}T00:00:00`;
}

function toLegacyPolicyRoomId(roomId: string): string | number {
  const numeric = Number(roomId);
  if (Number.isFinite(numeric) && String(numeric) === roomId) {
    return numeric;
  }
  return roomId;
}

function toLegacyPolicyNumber(value: number | string | undefined): string | number {
  if (value == null || value === "") return "";
  return value;
}

function toLegacyPolicySupplierNumber(value: number | string | undefined): string {
  if (value == null || value === "") return "";
  return String(value);
}

function getPlanUniqueId(plan: HotelRoomPlan): string | undefined {
  const id = plan.RoomPlanUniqueId?.trim();
  return id || undefined;
}

/**
 * Legacy ryx match:
 *   it.UniqueIdId == getRoomPlanUniqueId(plan)
 * where getRoomPlanUniqueId reads `plan.Variables.RoomPlanUniqueId`.
 * No transformation, no SupplierNumber concat.
 */
export function policyItemMatchesPlanUniqueId(
  policy: HotelPolicyItem,
  planUniqueId: string,
): boolean {
  if (!planUniqueId) return false;
  const uniqueIdId = policy.UniqueIdId?.trim();
  if (!uniqueIdId) return false;
  return uniqueIdId == planUniqueId;
}

/** Legacy filterPassengerPolicy uses passenger AccountId as PassengerKey. */
export function resolveFilterPassengerAccountId(
  passengers: PassengerBookInfo[],
  filterPassengerId: string | null | undefined,
): string | undefined {
  if (filterPassengerId == null) return undefined;
  const selectedPassenger = passengers.find((item) => item.id === filterPassengerId);
  if (!selectedPassenger) return undefined;
  const accountId = getPassengerAccountId(selectedPassenger);
  return accountId || undefined;
}

function buildUnfilteredDisplayColorMap(
  detail: HotelDetailResponse,
): Record<string, HotelPolicyColor> {
  const colors: Record<string, HotelPolicyColor> = {};
  for (const room of detail.Rooms ?? []) {
    for (const plan of room.Plans) {
      const uniqueId = getPlanUniqueId(plan);
      if (!uniqueId) continue;
      colors[uniqueId] = "success";
    }
  }
  return colors;
}

function resolvePassengerPlanPolicyColor(
  plan: HotelRoomPlan,
  entry: HotelPolicyPassengerResult | undefined,
): HotelPolicyColor {
  const uniqueId = getPlanUniqueId(plan);
  if (!uniqueId) return "success";

  if (!entry) {
    return isPlanFull(plan) ? "danger_full" : "success";
  }

  const policy = entry.HotelPolicies?.find((item) => policyItemMatchesPlanUniqueId(item, uniqueId));
  if (policy) {
    return resolvePolicyItemColor(policy, plan);
  }

  return isPlanFull(plan) ? "danger_full" : "success";
}

const POLICY_COLOR_STRICTNESS: Record<HotelPolicyColor, number> = {
  success: 1,
  warning: 2,
  danger_disabled: 3,
  danger_nopermission: 4,
  danger_full: 5,
};

/** Strictest policy color across passengers — used when validating book clicks. */
export function resolvePlanBookingPolicyColor(
  plan: HotelRoomPlan,
  results: HotelPolicyPassengerResult[] | undefined,
  passengers: PassengerBookInfo[],
): HotelPolicyColor | undefined {
  const uniqueId = getPlanUniqueId(plan);
  if (!uniqueId) return undefined;
  if (!passengers.length) return undefined;

  let strictest: HotelPolicyColor | undefined;
  for (const passenger of passengers) {
    const accountId = getPassengerAccountId(passenger);
    const entry = results?.find((item) => String(item.PassengerKey ?? "") == accountId);
    const color = resolvePassengerPlanPolicyColor(plan, entry);
    if (!strictest || POLICY_COLOR_STRICTNESS[color] > POLICY_COLOR_STRICTNESS[strictest]) {
      strictest = color;
    }
  }
  return strictest;
}

function findPolicyEntry(
  results: HotelPolicyPassengerResult[],
  passengers: PassengerBookInfo[],
  filterPassengerId: string | null,
): HotelPolicyPassengerResult | undefined {
  const accountId = resolveFilterPassengerAccountId(passengers, filterPassengerId);
  if (!accountId) return undefined;
  return results.find((item) => String(item.PassengerKey ?? "") == accountId);
}

function getFullHouseOrCanBook(plan: HotelRoomPlan): string | undefined {
  const value = plan.VariablesObj?.FullHouseOrCanBook;
  return value != null ? String(value) : undefined;
}

/** Legacy TmcHotelRyxService.isFull — VariablesObj.FullHouseOrCanBook contains "full". */
function isPlanFull(plan: HotelRoomPlan): boolean {
  const value = getFullHouseOrCanBook(plan);
  return Boolean(value && value.toLowerCase().includes("full"));
}

/** Legacy TmcHotelRyxService.isNoPermission — FullHouseOrCanBook contains "nopermission". */
function isPlanNoPermission(plan: HotelRoomPlan): boolean {
  const value = getFullHouseOrCanBook(plan);
  return Boolean(value && value.toLowerCase().includes("nopermission"));
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
      if (!uniqueId || seen.has(uniqueId)) continue;
      seen.add(uniqueId);

      const legacyId = plan.LegacyId;
      const idEmpty = !legacyId || legacyId === "0";
      const item: LegacyPolicyRoomPlan = {
        TotalAmount: plan.TotalAmount ?? plan.Price,
        Number: toLegacyPolicyNumber(plan.Number),
        SupplierNumber: toLegacyPolicySupplierNumber(plan.SupplierNumber),
        BeginDate: toLegacyPolicyDate(plan.BeginDate ?? detail.CheckInDate),
        EndDate: toLegacyPolicyDate(plan.EndDate ?? detail.CheckOutDate),
        Room: { Id: toLegacyPolicyRoomId(room.RoomId) },
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

/**
 * Legacy API may return IsAllowBook as a string "false"/"true" or numeric 0/1
 * instead of a native boolean.  JS treats the string `"false"` as truthy,
 * so we must coerce before checking.
 */
function isAllowedByPolicy(policy: HotelPolicyItem): boolean {
  const raw = policy.IsAllowBook;
  if (raw === false || raw === 0 || raw === "0" || raw === "false" || raw === "False") {
    return false;
  }
  if (raw === true || raw === 1 || raw === "1" || raw === "true" || raw === "True") {
    return true;
  }
  // absent / null / other → treat as allowed (legacy default)
  return true;
}

/** Legacy filterPassengerPolicy color resolution per plan policy row. */
function resolvePolicyItemColor(policy: HotelPolicyItem, plan: HotelRoomPlan): HotelPolicyColor {
  let color: HotelPolicyColor;
  if (isAllowedByPolicy(policy)) {
    color = policy.Rules?.length ? "warning" : "success";
  } else {
    color = "danger_disabled";
  }
  if (isPlanFull(plan)) {
    color = "danger_full";
  }
  if (isPlanNoPermission(plan)) {
    color = "danger_nopermission";
  }
  return color;
}

export function buildPolicyColorMap(input: {
  results: HotelPolicyPassengerResult[] | undefined;
  filterPassengerId: string | null;
  passengers: PassengerBookInfo[];
  detail: HotelDetailResponse;
}): Record<string, HotelPolicyColor> {
  const { results, filterPassengerId, passengers, detail } = input;
  if (passengers.length === 0) return {};

  // Legacy 不过滤差标: filterPassengerPolicy("") → no PassengerKey match → all success.
  if (filterPassengerId === null) {
    return buildUnfilteredDisplayColorMap(detail);
  }

  if (!results?.length) {
    return buildUnfilteredDisplayColorMap(detail);
  }

  const entry = findPolicyEntry(results, passengers, filterPassengerId);
  const colors: Record<string, HotelPolicyColor> = {};

  if (!entry) {
    return buildUnfilteredDisplayColorMap(detail);
  }

  for (const room of detail.Rooms ?? []) {
    for (const plan of room.Plans) {
      const uniqueId = getPlanUniqueId(plan);
      if (!uniqueId) continue;
      const policy = entry.HotelPolicies?.find((item) =>
        policyItemMatchesPlanUniqueId(item, uniqueId),
      );
      if (policy) {
        colors[uniqueId] = resolvePolicyItemColor(policy, plan);
      }
    }
  }

  // API often returns only restricted plans; omitted rows are bookable.
  for (const room of detail.Rooms ?? []) {
    for (const plan of room.Plans) {
      const uniqueId = getPlanUniqueId(plan);
      if (!uniqueId || colors[uniqueId]) continue;
      colors[uniqueId] = isPlanFull(plan) ? "danger_full" : "success";
    }
  }

  return colors;
}

export function resolvePlanPolicyColor(
  plan: HotelRoomPlan,
  colors: Record<string, HotelPolicyColor>,
): HotelPolicyColor | undefined {
  const uniqueId = getPlanUniqueId(plan);
  if (!uniqueId) return undefined;
  return colors[uniqueId];
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
  policyChecked = true,
): boolean {
  if (!policyChecked) return false;
  if (isAgent) return color !== "danger_full";
  if (!color) return false;
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

export interface HotelPlanBookButtonPresentation {
  topLabel: string;
  bottomLabel: string;
  shellClass: string;
  topClass: string;
  bottomClass: string;
  topLabelClass: string;
  disabled: boolean;
  priceClass: string;
}

/** Legacy HotelPaymentType labels (Prepay / SelfPay / Settle). */
export function getHotelPlanPayTypeLabel(plan: HotelRoomPlan): string {
  const paymentType = plan.PaymentType;
  if (paymentType === 2) return "到店付";
  if (paymentType === 4) return "月结";
  if (paymentType === 1) return "预付";

  const vars = plan.VariablesObj;
  const fromVars = vars?.PayType ?? vars?.PaymentType ?? vars?.PayTypeName;
  if (fromVars != null && String(fromVars).trim()) return String(fromVars);
  if (plan.PlanName.includes("到店付") || plan.PlanName.includes("现付")) return "到店付";
  if (plan.PlanName.includes("月结")) return "月结";
  if (plan.PlanName.includes("预付")) return "预付";
  return "预付";
}

function blockedBottomLabel(payTypeLabel: string, isAgent: boolean): string {
  return isAgent ? payTypeLabel : "不可预订";
}

/** Legacy room-plan-item book button labels and colors. */
export function getHotelPlanBookButtonPresentation(
  policyColor: HotelPolicyColor | undefined,
  bookable: boolean,
  payTypeLabel: string,
  isAgent = false,
): HotelPlanBookButtonPresentation {
  if (policyColor === "danger_full") {
    return {
      topLabel: "满房",
      bottomLabel: "",
      shellClass: "border-[#EF4444]",
      topClass: "bg-[#EF4444] text-white",
      bottomClass: "bg-white text-[#EF4444]",
      topLabelClass: "text-[13px] font-semibold",
      disabled: true,
      priceClass: "text-[#EF4444] opacity-70",
    };
  }

  if (policyColor === "danger_disabled") {
    return {
      topLabel: "超标",
      bottomLabel: blockedBottomLabel(payTypeLabel, isAgent),
      shellClass: "border-[#EF4444]",
      topClass: "bg-[#EF4444] text-white",
      bottomClass: "bg-white text-[#EF4444]",
      topLabelClass: "text-[13px] font-semibold",
      disabled: !isAgent,
      priceClass: "text-[#EF4444] opacity-70",
    };
  }

  if (policyColor === "danger_nopermission") {
    return {
      topLabel: "无权限",
      bottomLabel: blockedBottomLabel(payTypeLabel, isAgent),
      shellClass: "border-[#EF4444]",
      topClass: "bg-[#EF4444] text-white",
      bottomClass: "bg-white text-[#EF4444]",
      topLabelClass: "text-[12px] font-semibold",
      disabled: !isAgent,
      priceClass: "text-[#EF4444] opacity-70",
    };
  }

  if (!bookable) {
    return {
      topLabel: "不可预订",
      bottomLabel: "",
      shellClass: "border-[#CCCCCC]",
      topClass: "bg-[#CCCCCC] text-white",
      bottomClass: "bg-white text-[#9CA3AF]",
      topLabelClass: "text-[11px] font-semibold",
      disabled: true,
      priceClass: "text-[#9CA3AF]",
    };
  }

  if (policyColor === "warning") {
    return {
      topLabel: "违规预订",
      bottomLabel: payTypeLabel,
      shellClass: "border-[#FF8C00]",
      topClass: "bg-[#FF8C00] text-white",
      bottomClass: "bg-white text-[#FF8C00]",
      topLabelClass: "text-[11px] font-semibold leading-tight",
      disabled: false,
      priceClass: "text-[#FF8C00]",
    };
  }

  return {
    topLabel: "预订",
    bottomLabel: payTypeLabel,
    shellClass: "border-[#22C55E]",
    topClass: "bg-[#22C55E] text-white",
    bottomClass: "bg-white text-[#2768FA]",
    topLabelClass: "text-[13px] font-semibold",
    disabled: false,
    priceClass: "text-[#2768FA]",
  };
}
