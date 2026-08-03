import type {
  FlightInitStaff,
  PassengerBookInfo,
  TrainBookPolicy,
  TrainInitBookResponse,
} from "@ryx/shared-types";

import {
  FLIGHT_APPROVAL_APPROVER,
  FLIGHT_APPROVAL_EXCEED_APPROVER,
  FLIGHT_APPROVAL_EXCEED_FREE,
  FLIGHT_APPROVAL_FREE,
  FLIGHT_APPROVAL_NONE,
  groupStaffApprovers,
  type GroupedApproverLevel,
} from "@/lib/flight-book-approval";
import type { TrainPassengerBookForm } from "@/lib/train-book";

export {
  FLIGHT_APPROVAL_NONE as TRAIN_APPROVAL_NONE,
  FLIGHT_APPROVAL_FREE as TRAIN_APPROVAL_FREE,
  FLIGHT_APPROVAL_APPROVER as TRAIN_APPROVAL_APPROVER,
  FLIGHT_APPROVAL_EXCEED_FREE as TRAIN_APPROVAL_EXCEED_FREE,
  FLIGHT_APPROVAL_EXCEED_APPROVER as TRAIN_APPROVAL_EXCEED_APPROVER,
  groupStaffApprovers,
  type GroupedApproverLevel,
};

export function resolveTrainApprovalType(init?: TrainInitBookResponse): number | undefined {
  const tmc = init?.Tmc as { TrainApprovalType?: number } | undefined;
  return tmc?.TrainApprovalType;
}

/** Legacy `TmcService.isShowApprove("Train", hasRules)`. */
export function shouldShowTrainApproveNode(
  init?: TrainInitBookResponse,
  policy?: TrainBookPolicy,
): boolean {
  const approvalType = resolveTrainApprovalType(init);
  if (!approvalType || approvalType === FLIGHT_APPROVAL_NONE) return false;
  if (approvalType === FLIGHT_APPROVAL_APPROVER) return true;
  if (approvalType === FLIGHT_APPROVAL_EXCEED_APPROVER && Boolean(policy?.Rules?.length)) {
    return true;
  }
  return false;
}

/** Legacy `isAllowSelectApprove` on `tmc-train-book.base.page.ts`. */
export function shouldAllowSelectTrainApprover(input: {
  init?: TrainInitBookResponse;
  policy?: TrainBookPolicy;
  staff?: FlightInitStaff;
  passenger?: PassengerBookInfo;
  isExchangeBook?: boolean;
}): boolean {
  const { init, policy, staff, passenger, isExchangeBook } = input;
  if (isExchangeBook) return false;

  const approvalType = resolveTrainApprovalType(init);
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

export function shouldShowTrainApproverPicker(input: {
  init?: TrainInitBookResponse;
  policy?: TrainBookPolicy;
  staff?: FlightInitStaff;
  passenger?: PassengerBookInfo;
  isExchangeBook?: boolean;
}): boolean {
  return shouldAllowSelectTrainApprover(input);
}

export function shouldShowTrainSkipApprove(input: {
  init?: TrainInitBookResponse;
  policy?: TrainBookPolicy;
  staff?: FlightInitStaff;
  passenger?: PassengerBookInfo;
  isExchangeBook?: boolean;
}): boolean {
  const { init, policy, isExchangeBook, ...approverInput } = input;
  if (isExchangeBook || !init?.isSkipApprove) return false;
  return (
    shouldShowTrainApproveNode(init, policy) ||
    shouldAllowSelectTrainApprover({ ...approverInput, init, policy, isExchangeBook })
  );
}

export function validatePassengerTrainApprover(input: {
  form: TrainPassengerBookForm;
  showPicker: boolean;
}): string | null {
  const { form, showPicker } = input;
  if (!showPicker || form.isSkipApprove) return null;
  if (!form.approvalId) return "请选择审批人";
  return null;
}

/** Legacy submit sets ApprovalId to selected id or `"0"`. */
export function resolveTrainPassengerApprovalId(input: {
  form?: TrainPassengerBookForm;
  showPicker: boolean;
}): string {
  const { form, showPicker } = input;
  if (!showPicker || form?.isSkipApprove) return "0";
  return form?.approvalId?.trim() || "0";
}
