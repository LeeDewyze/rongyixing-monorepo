import type {
  HotelOrderActionFlags,
  HotelOrderBillLine,
  HotelOrderDetail,
  HotelOrderHistory,
  HotelOrderRoom,
} from "@ryx/shared-types";

const DEFAULT_HOTEL_ACTIONS: HotelOrderActionFlags = {
  showPay: false,
  showCancel: false,
  smsAction: "none",
};

export type CoercedHotelOrderDetail = HotelOrderDetail & {
  Rooms: HotelOrderRoom[];
  BillItems: HotelOrderBillLine[];
  Histories: HotelOrderHistory[];
  Actions: HotelOrderActionFlags;
  ShowServiceFee: boolean;
};

export function coerceHotelOrderDetail(detail: HotelOrderDetail): CoercedHotelOrderDetail {
  return {
    ...detail,
    Rooms: detail.Rooms ?? [],
    BillItems: detail.BillItems ?? [],
    Histories: detail.Histories ?? [],
    Actions:
      detail.Actions ??
      ({
        ...DEFAULT_HOTEL_ACTIONS,
        showPay: Boolean(detail.isShowPayButton),
      } satisfies HotelOrderActionFlags),
    ShowServiceFee: detail.ShowServiceFee ?? true,
  };
}

export function formatHotelPaymentType(value?: string | number): string {
  const code = typeof value === "number" ? value : Number(value);
  if (code === 1) return "预付";
  if (code === 2) return "到店付";
  if (value == null || value === "") return "—";
  return String(value);
}

export function formatTravelPayType(value?: string): string {
  if (!value) return "—";
  return value;
}

/** Display order timestamps without seconds (legacy detail UI). */
export function formatOrderDateTime(value?: string): string {
  if (!value) return "—";
  const normalized = value.replace("T", " ").replace(/\.\d+Z?$/, "");
  return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
}

/** Legacy order detail: Breakfast>"0" ? N份早餐 : 无早餐 */
export function formatOrderBreakfastLabel(breakfast?: string | number): string {
  if (breakfast == null || breakfast === "") {
    return "无早餐";
  }

  const text = String(breakfast).trim();
  if (text === "0") {
    return "无早餐";
  }

  const count = Number(text);
  if (!Number.isNaN(count) && /^\d+(\.0+)?$/.test(text)) {
    return count > 0 ? `${count}份早餐` : "无早餐";
  }

  if (/无早|不含早|无早餐/.test(text)) {
    return "无早餐";
  }

  return text;
}

export function formatOrderRoomName(roomName?: string, breakfast?: string | number): string {
  const parts = [roomName, formatOrderBreakfastLabel(breakfast)].filter(Boolean);
  return parts.join(" ") || "—";
}

export function formatTravelerCredentialDisplay(number?: string, typeName?: string): string {
  if (!number) return "—";
  return typeName ? `${number} ${typeName}` : number;
}

export function computeStayNights(begin?: string, end?: string): number | undefined {
  if (!begin || !end) return undefined;
  const start = new Date(begin);
  const finish = new Date(end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(finish.getTime())) {
    return undefined;
  }
  const diff = Math.round((finish.getTime() - start.getTime()) / 86_400_000);
  return diff > 0 ? diff : undefined;
}

export function formatStayRange(begin?: string, end?: string, nights?: number): string {
  if (!begin || !end) return "—";
  const nightLabel = nights != null ? ` ${nights}晚` : "";
  return `${begin}至${end}${nightLabel}`;
}

export function formatActualStayRange(checkin?: string, checkout?: string): string {
  if (!checkin && !checkout) return "—";
  const inDate = checkin?.slice(0, 10) ?? "—";
  const outDate = checkout?.slice(0, 10) ?? "—";
  return `${inDate}至${outDate}`;
}

export function filterBillLinesForRoom(
  items: HotelOrderBillLine[] | undefined,
  roomKey: string,
  showServiceFee: boolean,
): HotelOrderBillLine[] {
  let lines = (items ?? []).filter((item) => item.Key === roomKey);
  if (!showServiceFee) {
    lines = lines.filter((item) => !item.Tag?.endsWith("Fee"));
  }

  const markerIndex = lines.findIndex((item) => item.Amount < 0 && !item.Name.includes("取消"));
  if (markerIndex >= 0) {
    lines = lines.slice(0, markerIndex);
  }

  return lines;
}

export function sumBillLines(lines: HotelOrderBillLine[]): number {
  return lines.reduce((sum, item) => sum + item.Amount, 0);
}

export function resolveFooterActions(detail: HotelOrderDetail): HotelOrderActionFlags {
  return coerceHotelOrderDetail(detail).Actions;
}

export function getCancelOrderHotelId(detail: HotelOrderDetail): string | undefined {
  const actions = detail.Actions;
  return actions?.cancelOrderHotelId ?? detail.Rooms?.[0]?.Id;
}

export function formatApprovalExpiredTime(value?: string): string {
  if (!value) return "—";
  if (value.startsWith("1800")) return "—";
  return value;
}

export function getSelectedRoom(
  detail: CoercedHotelOrderDetail,
  index: number,
): HotelOrderRoom | undefined {
  return detail.Rooms[index];
}

export function formatRoomLabel(index: number): string {
  return `房间${index + 1}`;
}

export function shouldShowFooter(actions: HotelOrderActionFlags): boolean {
  return actions.showPay || actions.showCancel || actions.smsAction !== "none";
}
