import { parseLocalDate } from "@/lib/date-search";

/** Book page route subtitle, e.g. `2026-06-10 周四 12小时5分钟`. */
export function formatFlightBookRouteSubtitle(
  takeoffTime: string | undefined,
  flyTimeName: string | undefined,
): string {
  const date = takeoffTime?.slice(0, 10) ?? "";
  const d = parseLocalDate(date);
  const duration = (flyTimeName ?? "").replace(/^飞/, "").trim();
  if (!d) return duration;
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${date} 周${week}${duration ? ` ${duration}` : ""}`;
}
