export type LegacyRecord = Record<string, unknown>;

export function asRecord(value: unknown): LegacyRecord | null {
  return value && typeof value === "object" ? (value as LegacyRecord) : null;
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function readString(value: unknown): string {
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

export function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

export function parseVariablesObj(
  record: LegacyRecord | null | undefined,
): LegacyRecord | undefined {
  if (!record) {
    return undefined;
  }
  if (asRecord(record.VariablesObj)) {
    return record.VariablesObj as LegacyRecord;
  }
  const variables = record.Variables;
  if (typeof variables === "string" && variables.trim()) {
    try {
      return JSON.parse(variables) as LegacyRecord;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function formatDateOnly(value: unknown): string {
  const text = readString(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

export function formatDateTime(value: unknown): string {
  const text = readString(value);
  return text.includes("T") ? text.replace("T", " ").replace(/\.\d+Z?$/, "") : text;
}

export function extractPayload(data: unknown): LegacyRecord {
  const root = asRecord(data);
  if (!root) {
    return {};
  }
  if (root.Order != null || Array.isArray(root.Histories)) {
    return root;
  }
  const nested = asRecord(root.Data);
  return nested ?? root;
}
