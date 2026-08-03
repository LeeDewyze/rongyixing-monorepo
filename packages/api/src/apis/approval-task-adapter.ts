import type { ApprovalTask, WorkflowNotify } from "@ryx/shared-types";

type LegacyRecord = Record<string, unknown>;

function asRecord(value: unknown): LegacyRecord | null {
  return value && typeof value === "object" ? (value as LegacyRecord) : null;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function parseVariables(value: unknown): LegacyRecord {
  if (asRecord(value)) return value as LegacyRecord;
  if (typeof value === "string" && value.trim()) {
    try {
      return JSON.parse(value) as LegacyRecord;
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeExpiredTime(value: unknown): string {
  const text = readString(value);
  if (!text || text.startsWith("1800")) return "";
  return text.length >= 19 ? text.slice(0, 19) : text;
}

export function normalizeApprovalTask(raw: unknown): ApprovalTask {
  const row = asRecord(raw) ?? {};
  const variables = parseVariables(row.Variables);
  const handleUrl = readString(row.HandleUrl) || readString(variables.TaskUrl);
  if (handleUrl) {
    variables.TaskUrl = handleUrl;
  }

  return {
    id: readString(row.Id),
    name: readString(row.Name),
    status: row.Status as string | number | undefined,
    statusName: readString(row.StatusName) || readString(row.Status),
    remark: readString(row.Remark),
    level: readString(row.Level),
    number: readString(row.Number),
    expiredTime: normalizeExpiredTime(row.ExpiredTime),
    tag: readString(row.Tag),
    handleUrl: handleUrl || undefined,
    url: readString(row.Url) || handleUrl || undefined,
    isOverdue: Boolean(row.IsOverdue),
  };
}

export function normalizeApprovalTaskList(raw: unknown): ApprovalTask[] {
  const row = asRecord(raw);
  const list = row?.Data ?? raw;
  return asArray<unknown>(list).map(normalizeApprovalTask).filter((task) => Boolean(task.id));
}

export function normalizeWorkflowNotify(raw: unknown): WorkflowNotify {
  const row = asRecord(raw) ?? {};
  return {
    id: readString(row.Id),
    title: readString(row.Title),
    isRead: row.IsRead as string | boolean | undefined,
    url: readString(row.Url) || undefined,
  };
}

export function normalizeWorkflowNotifyList(raw: unknown): WorkflowNotify[] {
  const row = asRecord(raw);
  const list = row?.Data ?? raw;
  return asArray<unknown>(list).map(normalizeWorkflowNotify).filter((item) => Boolean(item.id));
}

export function normalizeWaitingTaskCount(raw: unknown): number {
  const row = asRecord(raw);
  if (!row) return 0;
  const count = row.DataCount ?? row.dataCount;
  return typeof count === "number" ? count : Number(count) || 0;
}
