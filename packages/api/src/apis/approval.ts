import type {
  ApprovalTask,
  ApprovalTaskListParams,
  OrderApprovalTaskParams,
  WorkflowNotify,
} from "@ryx/shared-types";

import {
  normalizeApprovalTaskList,
  normalizeWaitingTaskCount,
  normalizeWorkflowNotifyList,
} from "./approval-task-adapter.js";
import { APPROVAL_FLOW_METHODS } from "../methods/approval-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

function buildPagedPayload(params: ApprovalTaskListParams) {
  return {
    Name: params.name ?? "",
    PageSize: params.pageSize ?? 20,
    PageIndex: params.pageIndex,
  };
}

export interface ApprovalApi {
  getOrderTasks(params: OrderApprovalTaskParams): Promise<ApprovalTask[]>;
  getWorkflowTasks(params: ApprovalTaskListParams): Promise<ApprovalTask[]>;
  getWorkflowHistory(params: ApprovalTaskListParams): Promise<ApprovalTask[]>;
  getWorkflowNotifies(params: ApprovalTaskListParams): Promise<WorkflowNotify[]>;
  getWaitingTaskCount(): Promise<number>;
}

export function createApprovalApi(proxy: ProxyClient): ApprovalApi {
  return {
    async getOrderTasks(params) {
      const raw = await proxy.send<unknown>({
        method: APPROVAL_FLOW_METHODS.ORDER_TASK_LIST,
        data: {
          ...buildPagedPayload(params),
          Type: params.type,
        },
      });
      return normalizeApprovalTaskList(raw);
    },

    async getWorkflowTasks(params) {
      const raw = await proxy.send<unknown>({
        method: APPROVAL_FLOW_METHODS.WORKFLOW_TASK_LIST,
        data: buildPagedPayload(params),
      });
      return normalizeApprovalTaskList(raw);
    },

    async getWorkflowHistory(params) {
      const raw = await proxy.send<unknown>({
        method: APPROVAL_FLOW_METHODS.WORKFLOW_HISTORY_LIST,
        data: buildPagedPayload(params),
      });
      return normalizeApprovalTaskList(raw);
    },

    async getWorkflowNotifies(params) {
      const raw = await proxy.send<unknown>({
        method: APPROVAL_FLOW_METHODS.WORKFLOW_NOTIFY_LIST,
        data: buildPagedPayload(params),
      });
      return normalizeWorkflowNotifyList(raw);
    },

    async getWaitingTaskCount() {
      const raw = await proxy.send<unknown>({
        method: APPROVAL_FLOW_METHODS.WAITING_TASK_COUNT,
        data: {},
      });
      return normalizeWaitingTaskCount(raw);
    },
  };
}
