import type { IResponse } from "@ryx/shared-types";
import { APPROVAL_FLOW_METHODS, successResponse } from "@ryx/api";

import {
  MOCK_ORDER_APPROVAL_TASKS,
  MOCK_WAITING_TASK_COUNT,
  MOCK_WORKFLOW_HISTORY,
  MOCK_WORKFLOW_NOTIFIES,
} from "../fixtures/approval.js";

type PagedRequest = {
  PageIndex?: number;
  Type?: number;
};

export function createApprovalMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [APPROVAL_FLOW_METHODS.ORDER_TASK_LIST]: (data) => {
      const req = (data ?? {}) as PagedRequest;
      const tasks =
        req.Type === 2
          ? MOCK_ORDER_APPROVAL_TASKS.map((task) => ({
              ...task,
              id: `${task.id}-done`,
              statusName: "已审批",
            }))
          : MOCK_ORDER_APPROVAL_TASKS;
      return successResponse(tasks);
    },
    [APPROVAL_FLOW_METHODS.WORKFLOW_TASK_LIST]: () =>
      successResponse(MOCK_ORDER_APPROVAL_TASKS),
    [APPROVAL_FLOW_METHODS.WORKFLOW_HISTORY_LIST]: () =>
      successResponse(MOCK_WORKFLOW_HISTORY),
    [APPROVAL_FLOW_METHODS.WORKFLOW_NOTIFY_LIST]: () =>
      successResponse(MOCK_WORKFLOW_NOTIFIES),
    [APPROVAL_FLOW_METHODS.WAITING_TASK_COUNT]: () =>
      successResponse({ DataCount: MOCK_WAITING_TASK_COUNT }),
  };
}
