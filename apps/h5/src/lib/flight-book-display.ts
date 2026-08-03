import { parseLocalDate } from "@/lib/date-search";

/** Normalize fly-time labels to Chinese, e.g. `2h10m` → `2小时10分钟`. */
export function formatFlightBookDuration(flyTimeName: string | undefined): string {
  const raw = (flyTimeName ?? "").replace(/^飞/, "").trim();
  if (!raw) return "";
  if (/小时|分/.test(raw)) {
    if (/分钟/.test(raw)) return raw;
    return raw.replace(/分$/u, "分钟");
  }
  return raw.replace(/h/gi, "小时").replace(/m/gi, "分钟");
}

/** Book page route subtitle, e.g. `2026-06-10周四 12小时5分钟`. */
export function formatFlightBookRouteSubtitle(
  takeoffTime: string | undefined,
  flyTimeName: string | undefined,
): string {
  const date = takeoffTime?.slice(0, 10) ?? "";
  const d = parseLocalDate(date);
  const duration = formatFlightBookDuration(flyTimeName);
  if (!d) return duration;
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${date}周${week}${duration ? ` ${duration}` : ""}`;
}
