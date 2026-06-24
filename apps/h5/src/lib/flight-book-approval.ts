import type {
  FlightBookPolicy,
  FlightInitBookResponse,
  FlightInitStaff,
  FlightInitStaffApprover,
  FlightPassengerBookForm,
  PassengerBookInfo,
} from "@ryx/shared-types";

/** Legacy `TmcApprovalType` subset used on book page. */
export const FLIGHT_APPROVAL_EXCEED_POLICY = 2;
export const FLIGHT_APPROVAL_EXCEED_FREE = 3;
export const FLIGHT_APPROVAL_EXCEED_APPROVER = 4;

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

export function shouldShowTravelSection(input: {
  policy?: FlightBookPolicy;
  expenseTypes?: FlightInitBookResponse["ExpenseTypes"];
  staff?: FlightInitStaff;
  init?: FlightInitBookResponse;
  outNumberFieldCount: number;
}): boolean {
  const { policy, expenseTypes, staff, init, outNumberFieldCount } = input;
  const hasRules = Boolean(policy?.Rules?.length);
  const hasExpense = Boolean(expenseTypes?.length);
  const hasApprovers = Boolean(staff?.Approvers?.length);
  const hasOutNumbers = outNumberFieldCount > 0;
  const approvalType = resolveFlightApprovalType(init);
  const allowSelect =
    approvalType === FLIGHT_APPROVAL_EXCEED_FREE ||
    approvalType === FLIGHT_APPROVAL_EXCEED_APPROVER;

  return hasRules || hasExpense || hasOutNumbers || hasApprovers || allowSelect;
}

export function shouldShowApproverPicker(input: {
  init?: FlightInitBookResponse;
  policy?: FlightBookPolicy;
  staff?: FlightInitStaff;
}): boolean {
  const { init, policy, staff } = input;
  const approvalType = resolveFlightApprovalType(init);
  const hasRules = Boolean(policy?.Rules?.length);
  const hasApprovers = Boolean(staff?.Approvers?.length);

  if (approvalType === FLIGHT_APPROVAL_EXCEED_FREE && hasRules) return true;
  if (approvalType === FLIGHT_APPROVAL_EXCEED_APPROVER && hasRules) return true;
  if (!hasApprovers && approvalType !== FLIGHT_APPROVAL_EXCEED_POLICY) return true;
  return false;
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
