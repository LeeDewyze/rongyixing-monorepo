export interface ResourceCacheRecord<T> {
  data: T;
  updatedAt: number;
}

export function readResourceCache<T>(
  key: string,
  storage: Pick<Storage, "getItem"> = globalThis.localStorage,
): ResourceCacheRecord<T> | null {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const record = JSON.parse(raw) as ResourceCacheRecord<T>;
    if (!record || typeof record.updatedAt !== "number" || !("data" in record)) {
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export function writeResourceCache<T>(
  key: string,
  data: T,
  storage: Pick<Storage, "setItem"> = globalThis.localStorage,
  updatedAt = Date.now(),
): void {
  try {
    storage?.setItem(key, JSON.stringify({ data, updatedAt } satisfies ResourceCacheRecord<T>));
  } catch {
    // Ignore unavailable storage and quota errors.
  }
}
