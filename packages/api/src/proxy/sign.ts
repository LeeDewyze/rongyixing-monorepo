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
