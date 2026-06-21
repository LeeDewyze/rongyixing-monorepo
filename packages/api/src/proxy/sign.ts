import { md5 } from "js-md5";

/** Beeant Sign = md5(Data + Timestamp + Token). */
export function computeSign(data: string, timestamp: number, token: string): string {
  return md5(`${data}${timestamp}${token}`);
}

export function serializeData(data: unknown): string {
  if (data === undefined || data === null) {
    return "";
  }
  return typeof data === "string" ? data : JSON.stringify(data);
}

/**
 * Beeant unsigned /Home/Proxy posts (e.g. GetWebSocketUrl) coerce object Data
 * via default `toString()` → "[object Object]", not JSON.stringify.
 */
export function serializeFormData(data: unknown): string {
  if (data === undefined || data === null) {
    return "";
  }
  if (typeof data === "string") {
    return data;
  }
  if (typeof data === "object") {
    return String(data);
  }
  return String(data);
}
