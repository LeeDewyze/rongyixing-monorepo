/** TMC order approval task (`TmcApiOrderUrl-Task-List`). */
export type OrderApprovalTaskType = 1 | 2;

export interface ApprovalTaskListParams {
  pageIndex: number;
  pageSize?: number;
  name?: string;
}

export interface OrderApprovalTaskParams extends ApprovalTaskListParams {
  /** Legacy TaskModel.Type: 1 = 待我审批, 2 = 已审任务 */
  type: OrderApprovalTaskType;
}

export interface ApprovalTask {
  id: string;
  name: string;
  status?: string | number;
  statusName?: string;
  remark?: string;
  level?: string;
  number?: string;
  expiredTime?: string;
  tag?: string;
  handleUrl?: string;
  url?: string;
  isOverdue?: boolean;
}

export interface WorkflowNotify {
  id: string;
  title: string;
  isRead?: string | boolean;
  url?: string;
}

export interface WaitingTaskCountResult {
  dataCount: number;
}
