import type {
  HotelOrderActionFlags,
  HotelOrderBillLine,
  HotelOrderDetail,
  HotelOrderHistory,
  HotelOrderRoom,
} from "@ryx/shared-types";
import { CREDENTIAL_TYPE_LABELS } from "@ryx/shared-types";

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

const CREDENTIAL_TYPE_ENUM_LABELS: Record<string, string> = {
  IdCard: "身份证",
  Passport: "护照",
  HmPass: "港澳通行证",
  TwPass: "台湾通行证",
  Taiwan: "台胞证",
  HvPass: "回乡证",
  TaiwanEp: "入台证",
  Other: "其他",
  ResidencePermit: "港澳台居民居住证",
  AlienPermanentResidenceIdCard: "外国人永久居留身份证",
  MilitaryCard: "军人证",
};

export function normalizeTravelerCredentialTypeLabel(type?: string): string | undefined {
  const trimmed = type?.trim();
  if (!trimmed) return undefined;
  if (trimmed === "身份证") return trimmed;

  const typeCode = Number(trimmed);
  if (!Number.isNaN(typeCode) && CREDENTIAL_TYPE_LABELS[typeCode]) {
    return CREDENTIAL_TYPE_LABELS[typeCode];
  }

  return CREDENTIAL_TYPE_ENUM_LABELS[trimmed] ?? trimmed;
}

export function shouldShowTravelerCredentialType(type?: string): boolean {
  return Boolean(normalizeTravelerCredentialTypeLabel(type));
}

export function formatTravelerCredentialDisplay(number?: string, typeName?: string): string {
  if (!number) return "—";
  const label = normalizeTravelerCredentialTypeLabel(typeName);
  if (shouldShowTravelerCredentialType(typeName) && label) {
    return `${number} ${label}`;
  }
  return number;
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
