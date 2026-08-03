import type {
  FlightInitBookResponse,
  FlightInitStaff,
  FlightOutNumberField,
  FlightPassengerBookForm,
  GetTravelUrlParams,
  PassengerBookInfo,
  TravelUrlTravelType,
  TravelUrlRow,
} from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { isBusinessTravelMode, shouldEnableTravelForm } from "@/lib/flight-travel-mode";
import type { HomeTravelMode } from "@/config/home-assets";

function parseTmcStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string" && raw.trim()) {
    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function buildPassengerOutNumberFields(input: {
  passenger: PassengerBookInfo;
  staff?: FlightInitStaff;
  init?: FlightInitBookResponse;
  travelNumber?: string;
  travelMode?: HomeTravelMode;
  travelType?: TravelUrlTravelType;
}): FlightOutNumberField[] {
  const { staff, init, travelNumber, travelMode, travelType = "Flight" } = input;
  const tmc = init?.Tmc as Record<string, unknown> | undefined;
  const labels =
    parseTmcStringArray(tmc?.OutNumberNameArray) ||
    parseTmcStringArray(tmc?.OutNumberName);
  const requiredLabels =
    parseTmcStringArray(tmc?.OutNumberRequiryNameArray) ||
    parseTmcStringArray(tmc?.OutNumberRequiryName);
  const hintMap = init?.OutNumbers ?? {};

  const prefilledTravelNumber = travelNumber?.trim() ?? "";
  const businessMode = isBusinessTravelMode(travelMode);
  const travelFormEnabled = shouldEnableTravelForm(travelMode, Boolean(tmc?.GetTravelUrl));
  const canSelectFromTravelUrl = travelFormEnabled && !prefilledTravelNumber;

  if (!businessMode) {
    const visibleLabels = labels.filter((label) => !/travel|出差/i.test(label));
    if (!visibleLabels.length) return [];
    return visibleLabels.map((label) => {
      const key = label.replace(/\s+/g, "");
      const prefilled =
        (key === "StaffNumber" ? staff?.Number : undefined) ||
        (key === "StaffOutNumber" ? staff?.OutNumber : undefined) ||
        "";

      return {
        key,
        label,
        value: String(prefilled ?? ""),
        required: requiredLabels.includes(label),
        isTravelNumber: false,
        canSelect: false,
        labelDataList: hintMap[key] ?? hintMap[label] ?? [],
        staffNumber: staff?.Number ?? "",
        staffOutNumber: staff?.OutNumber ?? "",
        travelType,
      };
    });
  }

  if (!labels.length) {
    if (travelNumber) {
      return [
        {
          key: "TravelNumber",
          label: "出差单号",
          value: travelNumber,
          required: true,
          isTravelNumber: true,
          canSelect: canSelectFromTravelUrl,
          labelDataList: hintMap.TravelNumber ?? [],
          staffNumber: staff?.Number ?? "",
          staffOutNumber: staff?.OutNumber ?? "",
          travelType,
        },
      ];
    }
    return [];
  }

  return labels.map((label) => {
    const key = label.replace(/\s+/g, "");
    const isTravelNumber = /travel|出差/i.test(label);
    const prefilled =
      (isTravelNumber && travelNumber) ||
      (key === "StaffNumber" ? staff?.Number : undefined) ||
      (key === "StaffOutNumber" ? staff?.OutNumber : undefined) ||
      "";

    return {
      key,
      label,
      value: String(prefilled ?? ""),
      required: requiredLabels.includes(label),
      isTravelNumber,
      canSelect: canSelectFromTravelUrl,
      labelDataList: hintMap[key] ?? hintMap[label] ?? [],
      staffNumber: staff?.Number ?? "",
      staffOutNumber: staff?.OutNumber ?? "",
      travelType,
    };
  });
}

export async function fetchTravelUrlOptions(
  field: FlightOutNumberField,
): Promise<TravelUrlRow[]> {
  if (!field.canSelect) return [];
  const params: GetTravelUrlParams = {
    staffNumber: field.staffNumber ?? null,
    staffOutNumber: field.staffOutNumber ?? null,
    name: field.label,
    travelType: field.travelType ?? "Flight",
    outNumberName: field.key,
  };
  const result = await getApi().travel.getTravelUrl(params);
  return result.value?.Data ?? [];
}

export function filterTravelUrlRows(rows: TravelUrlRow[], keyword: string): TravelUrlRow[] {
  const key = keyword.trim().toLowerCase();
  if (!key) return rows;
  return rows.filter((row) => {
    const travelNumber = row.TravelNumber?.toLowerCase() ?? "";
    const trips = (row.Trips ?? []).join("").toLowerCase();
    const subject = row.Subject?.toLowerCase() ?? "";
    return travelNumber.includes(key) || trips.includes(key) || subject.includes(key);
  });
}

export function resolveOutNumberValueFromTravelUrlRow(row: TravelUrlRow): string {
  return String(row.TravelNumber ?? "").trim();
}

export function validatePassengerOutNumbers(
  fields: FlightOutNumberField[],
  values: Record<string, string>,
): string | null {
  for (const field of fields) {
    if (!field.required) continue;
    const value = (values[field.key] ?? field.value ?? "").trim();
    if (!value) return `${field.label}必填`;
  }
  return null;
}

export function mergeOutNumberValues(
  form: FlightPassengerBookForm,
  fields: FlightOutNumberField[],
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const field of fields) {
    const value = (form.outNumbers[field.key] ?? field.value ?? "").trim();
    if (value) merged[field.key] = value;
  }
  for (const [key, value] of Object.entries(form.outNumbers)) {
    const trimmed = value.trim();
    if (trimmed && !merged[key]) merged[key] = trimmed;
  }
  return Object.keys(merged).length ? merged : {};
}
