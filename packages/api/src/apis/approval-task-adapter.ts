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

/** Legacy workflow `Number` is an internal id; travel tasks use 差旅单号 / TravelNumber. */
function isInternalWorkflowNumber(value: string): boolean {
  return /^[0-9a-f]{32}$/i.test(value.trim());
}

function isNumericEntityId(value: string): boolean {
  return /^\d{10,}$/.test(value.trim());
}

function isTravelDisplayNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isInternalWorkflowNumber(trimmed)) return false;
  if (isNumericEntityId(trimmed)) return false;
  return true;
}

function resolveTaskNumber(row: LegacyRecord, variables: LegacyRecord): string {
  const tag = readString(row.Tag);

  if (tag === "TravelForm" || tag === "Travel") {
    const travelNumber =
      readString(row.TravelNumber) ||
      readString(row.travelNumber) ||
      readString(variables.TravelNumber) ||
      readString(variables.travelNumber) ||
      readString(row.OutNumber) ||
      readString(variables.OutNumber) ||
      readString(row.Number);
    return isTravelDisplayNumber(travelNumber) ? travelNumber : "";
  }

  const orderId = readString(row.OrderId) || readString(variables.OrderId);
  if (orderId) return orderId;

  const consumerId = readString(row.ConsumerId) || readString(variables.ConsumerId);
  const workflowNumber = readString(row.Number);
  if (consumerId) return consumerId;
  return !isInternalWorkflowNumber(workflowNumber) ? workflowNumber : "";
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
    number: resolveTaskNumber(row, variables) || undefined,
    consumerId:
      readString(row.ConsumerId) ||
      readString(row.consumerId) ||
      readString(variables.ConsumerId) ||
      readString(variables.consumerId) ||
      undefined,
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
  return asArray<unknown>(list)
    .map(normalizeApprovalTask)
    .filter((task) => Boolean(task.id));
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
  return asArray<unknown>(list)
    .map(normalizeWorkflowNotify)
    .filter((item) => Boolean(item.id));
}

export function normalizeWaitingTaskCount(raw: unknown): number {
  const row = asRecord(raw);
  if (!row) return 0;
  const count = row.DataCount ?? row.dataCount;
  return typeof count === "number" ? count : Number(count) || 0;
}
