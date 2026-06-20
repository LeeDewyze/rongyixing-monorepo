export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${dateStr.slice(5).replace("-", "月")}日 周${week}`;
}

export function formatDayChip(dateStr: string): { weekday: string; label: string } {
  const d = new Date(`${dateStr}T00:00:00`);
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return {
    weekday,
    label: `${dateStr.slice(5).replace("-", "/")}`,
  };
}

export function buildDateRange(startDate: string, days = 14): string[] {
  const start = new Date(`${startDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const base = start < today ? today : start;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T00:00:00`).getTime();
  const b = new Date(`${checkOut}T00:00:00`).getTime();
  const nights = Math.round((b - a) / 86400000);
  return nights > 0 ? nights : 1;
}
