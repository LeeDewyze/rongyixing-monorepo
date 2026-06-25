import type { ApprovalTask, WorkflowNotify } from "@ryx/shared-types";

export const MOCK_ORDER_APPROVAL_TASKS: ApprovalTask[] = [
  {
    id: "task-pending-001",
    name: "【机票】张三 · 北京—上海",
    statusName: "待审批",
    number: "ORD-FLT-MOCK-001",
    handleUrl: "https://example.com/approval/flight",
    tag: "Flight",
  },
  {
    id: "task-pending-002",
    name: "【酒店】李四 · 北京中关村",
    statusName: "待审批",
    number: "ORD-HTL-MOCK-002",
    handleUrl: "https://example.com/approval/hotel",
    tag: "Hotel",
  },
];

export const MOCK_WORKFLOW_HISTORY: ApprovalTask[] = [
  {
    id: "wf-history-001",
    name: "出差申请 · 王五",
    statusName: "已通过",
    url: "https://example.com/workflow/history/001",
    expiredTime: "2026-06-20 18:00:00",
  },
];

export const MOCK_WORKFLOW_NOTIFIES: WorkflowNotify[] = [
  {
    id: "wf-notify-001",
    title: "抄送：出差申请审批完成",
    isRead: "false",
    url: "https://example.com/workflow/notify/001",
  },
];

export const MOCK_WAITING_TASK_COUNT = 2;
