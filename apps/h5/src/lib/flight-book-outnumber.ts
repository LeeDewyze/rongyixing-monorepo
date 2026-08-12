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
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function hasTruthyTravelUrl(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized !== "" && normalized !== "null" && normalized !== "undefined";
  }
  return Boolean(value);
}

/** Merge top-level Tmc fields with legacy Variables JSON from Initialize. */
export function resolveTmcBookingConfig(
  tmc: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!tmc) return {};
  const variables = tmc.Variables;
  if (typeof variables === "string" && variables.trim()) {
    try {
      return { ...(JSON.parse(variables) as Record<string, unknown>), ...tmc };
    } catch {
      return tmc;
    }
  }
  if (variables && typeof variables === "object") {
    return { ...(variables as Record<string, unknown>), ...tmc };
  }
  return tmc;
}

function buildDefaultTravelNumberField(input: {
  travelNumber?: string;
  required: boolean;
  canSelect: boolean;
  hintMap: Record<string, string[]>;
  staff?: FlightInitStaff;
  travelType: TravelUrlTravelType;
}): FlightOutNumberField {
  const { travelNumber, required, canSelect, hintMap, staff, travelType } = input;
  return {
    key: "TravelNumber",
    label: "TravelNumber",
    value: travelNumber?.trim() ?? "",
    required,
    isTravelNumber: true,
    canSelect: canSelect,
    labelDataList: hintMap.TravelNumber ?? [],
    staffNumber: staff?.Number ?? "",
    staffOutNumber: staff?.OutNumber ?? "",
    travelType,
  };
}

export function formatTravelOutNumberLabel(field: FlightOutNumberField): string {
  if (field.isTravelNumber || field.key === "TravelNumber") {
    return "出差审批单";
  }
  return field.label;
}

export function isTravelOutNumberField(field: FlightOutNumberField): boolean {
  return field.isTravelNumber || field.key === "TravelNumber";
}

function normalizeTravelUrlTrips(value: TravelUrlRow["Trips"]): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

/** Collect searchable text from a GetTravelUrl row (legacy client-side filter fields). */
export function buildTravelUrlRowSearchText(row: TravelUrlRow): string {
  const parts: string[] = [];
  if (row.TravelNumber?.trim()) parts.push(row.TravelNumber.trim());
  if (row.Subject?.trim()) parts.push(row.Subject.trim());
  if (row.OrganizationName?.trim()) parts.push(row.OrganizationName.trim());
  if (row.Partner?.trim()) parts.push(row.Partner.trim());
  if (row.StartDate?.trim()) parts.push(row.StartDate.trim());
  if (row.EndDate?.trim()) parts.push(row.EndDate.trim());
  parts.push(...normalizeTravelUrlTrips(row.Trips));
  for (const trip of row.DingTalkTravels ?? []) {
    if (trip.StartTime?.trim()) parts.push(trip.StartTime.trim());
    if (trip.EndTime?.trim()) parts.push(trip.EndTime.trim());
    if (trip.Departure?.trim()) parts.push(trip.Departure.trim());
    if (trip.Arrival?.trim()) parts.push(trip.Arrival.trim());
    if (trip.Vehicle?.trim()) parts.push(trip.Vehicle.trim());
    if (trip.SingleOrReturn?.trim()) parts.push(trip.SingleOrReturn.trim());
  }
  return parts.join(" ").toLowerCase();
}

export function formatTravelUrlRowSubtitle(row: TravelUrlRow): string {
  const parts: string[] = [];
  if (row.Subject?.trim()) parts.push(row.Subject.trim());
  if (row.StartDate || row.EndDate) {
    parts.push([row.StartDate, row.EndDate].filter(Boolean).join(" ~ "));
  }
  const trips = normalizeTravelUrlTrips(row.Trips);
  if (trips.length) parts.push(trips.join(" / "));
  for (const trip of row.DingTalkTravels ?? []) {
    const route = [trip.Departure, trip.Arrival].filter(Boolean).join("-");
    const meta = [route, trip.Vehicle, trip.SingleOrReturn].filter(Boolean).join(" ");
    if (meta.trim()) parts.push(meta.trim());
  }
  if (row.Partner?.trim()) parts.push(`出行人：${row.Partner.trim()}`);
  return parts.join(" · ");
}

export function unwrapTravelUrlRows(result: unknown): TravelUrlRow[] {
  if (!result || typeof result !== "object") return [];
  if (Array.isArray(result)) return result as TravelUrlRow[];

  const record = result as Record<string, unknown>;
  const nestedValue = record.value;
  if (nestedValue && typeof nestedValue === "object") {
    const data = (nestedValue as Record<string, unknown>).Data;
    if (Array.isArray(data)) return data as TravelUrlRow[];
  }
  const directData = record.Data;
  if (Array.isArray(directData)) return directData as TravelUrlRow[];
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
  const tmc = resolveTmcBookingConfig(init?.Tmc as Record<string, unknown> | undefined);
  const labels =
    parseTmcStringArray(tmc.OutNumberNameArray) || parseTmcStringArray(tmc.OutNumberName);
  const requiredLabels =
    parseTmcStringArray(tmc.OutNumberRequiryNameArray) ||
    parseTmcStringArray(tmc.OutNumberRequiryName);
  const hintMap = init?.OutNumbers ?? {};

  const prefilledTravelNumber = travelNumber?.trim() ?? "";
  const businessMode = isBusinessTravelMode(travelMode);
  const travelFormEnabled = shouldEnableTravelForm(
    travelMode,
    hasTruthyTravelUrl(tmc.GetTravelUrl) || hasTruthyTravelUrl(tmc.CheckTravelUrl),
  );
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
    if (prefilledTravelNumber) {
      return [
        buildDefaultTravelNumberField({
          travelNumber: prefilledTravelNumber,
          required: requiredLabels.includes("TravelNumber") || requiredLabels.includes("出差单号"),
          canSelect: canSelectFromTravelUrl,
          hintMap,
          staff,
          travelType,
        }),
      ];
    }
    if (travelFormEnabled) {
      return [
        buildDefaultTravelNumberField({
          required: requiredLabels.includes("TravelNumber") || requiredLabels.includes("出差单号"),
          canSelect: true,
          hintMap,
          staff,
          travelType,
        }),
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
      canSelect: isTravelNumber ? canSelectFromTravelUrl : false,
      labelDataList: hintMap[key] ?? hintMap[label] ?? [],
      staffNumber: staff?.Number ?? "",
      staffOutNumber: staff?.OutNumber ?? "",
      travelType,
    };
  });
}

export async function fetchTravelUrlOptions(field: FlightOutNumberField): Promise<TravelUrlRow[]> {
  if (!field.canSelect) return [];
  const params: GetTravelUrlParams = {
    staffNumber: field.staffNumber ?? null,
    staffOutNumber: field.staffOutNumber ?? null,
    name: field.label,
    travelType: field.travelType ?? "Flight",
    outNumberName: field.key,
  };
  const result = await getApi().travel.getTravelUrl(params);
  return unwrapTravelUrlRows(result);
}

export function filterTravelUrlRows(rows: TravelUrlRow[], keyword: string): TravelUrlRow[] {
  const key = keyword.trim().toLowerCase();
  if (!key) return rows;
  return rows.filter((row) => buildTravelUrlRowSearchText(row).includes(key));
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
    if (!value) return `${formatTravelOutNumberLabel(field)}必填`;
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
