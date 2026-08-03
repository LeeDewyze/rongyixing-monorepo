import type {
  FlightBookPolicy,
  FlightInitBookResponse,
  FlightInitStaff,
  FlightInitStaffApprover,
  FlightPassengerBookForm,
  PassengerBookInfo,
} from "@ryx/shared-types";

/** Legacy `TmcApprovalType` — matches `@ear/models` enum values. */
export const FLIGHT_APPROVAL_NONE = 1;
export const FLIGHT_APPROVAL_FREE = 2;
export const FLIGHT_APPROVAL_APPROVER = 3;
export const FLIGHT_APPROVAL_EXCEED_FREE = 4;
export const FLIGHT_APPROVAL_EXCEED_APPROVER = 5;

export interface GroupedApproverLevel {
  tag: string;
  type?: number;
  approvers: FlightInitStaffApprover[];
}

export function groupStaffApprovers(staff?: FlightInitStaff): GroupedApproverLevel[] {
  const approvers = staff?.Approvers ?? [];
  if (!approvers.length) return [];

  const grouped = new Map<string, FlightInitStaffApprover[]>();
  for (const approver of approvers) {
    const tag = approver.Tag ?? "1";
    const list = grouped.get(tag) ?? [];
    list.push(approver);
    grouped.set(tag, list);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([tag, items]) => ({
      tag,
      type: items[0]?.Type,
      approvers: items,
    }));
}

export function resolveFlightApprovalType(init?: FlightInitBookResponse): number | undefined {
  const tmc = init?.Tmc as { FlightApprovalType?: number } | undefined;
  return tmc?.FlightApprovalType;
}

/** Legacy `TmcService.isShowApprove("Flight", hasRules)`. */
export function shouldShowApproveNode(
  init?: FlightInitBookResponse,
  policy?: FlightBookPolicy,
): boolean {
  const approvalType = resolveFlightApprovalType(init);
  if (!approvalType || approvalType === FLIGHT_APPROVAL_NONE) return false;
  if (approvalType === FLIGHT_APPROVAL_APPROVER) return true;
  if (approvalType === FLIGHT_APPROVAL_EXCEED_APPROVER && Boolean(policy?.Rules?.length)) {
    return true;
  }
  return false;
}

/** Legacy `isAllowSelectApprove` on `tmc-flight-book_ryx.base.page.ts`. */
export function shouldAllowSelectApprover(input: {
  init?: FlightInitBookResponse;
  policy?: FlightBookPolicy;
  staff?: FlightInitStaff;
  passenger?: PassengerBookInfo;
}): boolean {
  const { init, policy, staff, passenger } = input;
  const approvalType = resolveFlightApprovalType(init);
  const hasRules = Boolean(policy?.Rules?.length);

  if (
    passenger?.isNotWhitelist &&
    (approvalType === FLIGHT_APPROVAL_EXCEED_APPROVER ||
      approvalType === FLIGHT_APPROVAL_EXCEED_FREE)
  ) {
    return false;
  }

  if (!approvalType || approvalType === FLIGHT_APPROVAL_NONE) return false;
  if (!staff) return true;

  if (approvalType === FLIGHT_APPROVAL_FREE) return true;

  if (
    (!staff.Approvers || staff.Approvers.length === 0) &&
    approvalType === FLIGHT_APPROVAL_APPROVER
  ) {
    return true;
  }

  if (approvalType === FLIGHT_APPROVAL_EXCEED_FREE && hasRules) return true;

  if (
    (!staff.Approvers || staff.Approvers.length === 0) &&
    approvalType === FLIGHT_APPROVAL_EXCEED_APPROVER &&
    hasRules
  ) {
    return true;
  }

  return false;
}

/**
 * Legacy 出差信息 title `*ngIf` on `tmc-flight-book_ryx.page.html`, plus outnumber-only
 * cases where fields render inside the expanded panel without a title.
 */
export function shouldShowTravelSection(input: {
  policy?: FlightBookPolicy;
  expenseTypes?: FlightInitBookResponse["ExpenseTypes"];
  staff?: FlightInitStaff;
  init?: FlightInitBookResponse;
  outNumberFieldCount: number;
  passenger?: PassengerBookInfo;
}): boolean {
  const { policy, expenseTypes, staff, init, outNumberFieldCount, passenger } = input;
  const hasRules = Boolean(policy?.Rules?.length);
  const hasExpense = Boolean(expenseTypes?.length);
  const hasApprovers = Boolean(staff?.Approvers?.length);
  const hasOutNumbers = outNumberFieldCount > 0;
  const isShowApproveNode = shouldShowApproveNode(init, policy);
  const isAllowSelectApprove = shouldAllowSelectApprover({ init, policy, staff, passenger });

  const legacyTitleVisible =
    (hasRules && !passenger?.isNotWhitelist) ||
    hasExpense ||
    (isShowApproveNode && hasApprovers) ||
    isAllowSelectApprove;

  return legacyTitleVisible || hasOutNumbers;
}

export function shouldShowApproverPicker(input: {
  init?: FlightInitBookResponse;
  policy?: FlightBookPolicy;
  staff?: FlightInitStaff;
  passenger?: PassengerBookInfo;
}): boolean {
  return shouldAllowSelectApprover(input);
}

export function validatePassengerApprover(input: {
  form: FlightPassengerBookForm;
  showPicker: boolean;
}): string | null {
  const { form, showPicker } = input;
  if (!showPicker || form.isSkipApprove) return null;
  if (!form.approvalId) return "请选择审批人";
  return null;
}

export function parseSearchApprovalOption(option: {
  Text: string;
  Value: string;
}): { accountId: string; name: string } | null {
  const accountId = option.Value?.trim();
  if (!accountId) return null;
  const name = option.Text?.split("|")[0]?.trim() || option.Text?.trim() || accountId;
  return { accountId, name };
}
