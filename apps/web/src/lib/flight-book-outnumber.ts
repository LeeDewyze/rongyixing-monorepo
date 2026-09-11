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
import { getTicket } from "@/lib/session";
import {
  fetchMyTravelApplicationPickerItems,
  type TravelFormTripHint,
} from "@/lib/travel-form-list";
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
  accountId: string;
  travelType: TravelUrlTravelType;
}): FlightOutNumberField {
  const { travelNumber, required, canSelect, hintMap, staff, accountId, travelType } = input;
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
    accountId,
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

function normalizeTripDate(value?: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? trimmed;
}

function formatTripDateRange(start?: string, end?: string): string {
  const from = normalizeTripDate(start);
  const to = normalizeTripDate(end);
  if (from && to && to !== from) return `${from} ~ ${to}`;
  return from || to;
}

export interface TravelUrlTripDisplay {
  route: string;
  date: string;
}

/** Split a flattened "北京 → 杭州  2026-09-21 ~ 2026-09-22" trip string. */
function splitEmbeddedTrip(value: string): TravelUrlTripDisplay | null {
  const match = value.match(/^(.*?)\s+(\d{4}-\d{2}-\d{2}(?:\s*~\s*\d{4}-\d{2}-\d{2})?)$/);
  if (!match) return null;
  return { route: match[1]!.trim(), date: match[2]!.replace(/\s+/g, " ") };
}

export function formatTravelUrlRowTripItems(row: TravelUrlRow): TravelUrlTripDisplay[] {
  const dingItems = (row.DingTalkTravels ?? [])
    .map((trip) => ({
      route: [trip.Departure, trip.Arrival].filter(Boolean).join(" → "),
      date: formatTripDateRange(trip.StartTime, trip.EndTime),
    }))
    .filter((item) => item.route || item.date);
  if (dingItems.length) return dingItems;

  const trips = normalizeTravelUrlTrips(row.Trips);
  const sharedDate = formatTripDateRange(row.StartDate, row.EndDate);
  if (trips.length) {
    return trips.map((trip) => splitEmbeddedTrip(trip) ?? { route: trip, date: sharedDate });
  }

  return sharedDate ? [{ route: "", date: sharedDate }] : [];
}

/** Drop the generic form title so only a real travel reason remains. */
export function formatTravelUrlRowReason(subject?: string): string {
  const value = subject?.trim() ?? "";
  if (!value) return "";
  const stripped = value.replace(/^出差申请(?:\s*[·•、]\s*)?/, "").trim();
  return stripped === "出差申请" ? "" : stripped;
}

export function unwrapTravelUrlRows(result: unknown): TravelUrlRow[] {
  if (!result || typeof result !== "object") return [];
  if (Array.isArray(result)) return result as TravelUrlRow[];

  const record = result as Record<string, unknown>;
  const candidates: unknown[] = [
    record.value,
    record.Data,
    record.data,
    record.Result,
    record.result,
  ];
  for (const candidate of candidates) {
    const rows = unwrapTravelUrlRowsFromValue(candidate);
    if (rows.length) return rows;
  }
  return [];
}

function unwrapTravelUrlRowsFromValue(value: unknown): TravelUrlRow[] {
  if (Array.isArray(value)) return value as TravelUrlRow[];
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const nested = record.Data ?? record.data;
  if (Array.isArray(nested)) return nested as TravelUrlRow[];
  return [];
}

/** Legacy hotel/flight book page sends `credential.Account.Id`. */
function resolveOutNumberAccountId(passenger: PassengerBookInfo, staff?: FlightInitStaff): string {
  if (passenger.credential.AccountId) return String(passenger.credential.AccountId);
  const fromPassenger =
    "AccountId" in passenger.passenger ? passenger.passenger.AccountId : undefined;
  if (fromPassenger) return String(fromPassenger);
  return staff?.Account?.Id != null ? String(staff.Account.Id) : "";
}

export function buildPassengerOutNumberFields(input: {
  passenger: PassengerBookInfo;
  staff?: FlightInitStaff;
  init?: FlightInitBookResponse;
  travelNumber?: string;
  travelMode?: HomeTravelMode;
  travelType?: TravelUrlTravelType;
}): FlightOutNumberField[] {
  const { passenger, staff, init, travelNumber, travelMode, travelType = "Flight" } = input;
  const accountId = resolveOutNumberAccountId(passenger, staff);
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
        accountId,
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
          accountId,
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
          accountId,
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
      accountId,
      travelType,
    };
  });
}

/** Legacy sends null, not "", for unknown staff identifiers. */
function nullableParam(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

export async function fetchTravelUrlOptions(field: FlightOutNumberField): Promise<TravelUrlRow[]> {
  if (!field.canSelect) return [];
  const staffNumber = nullableParam(field.staffNumber) ?? nullableParam(field.staffOutNumber);
  const params: GetTravelUrlParams = {
    staffNumber,
    staffOutNumber: nullableParam(field.staffOutNumber),
    // Empty name is sent as null so the TMC forward does not treat "" as a keyword filter.
    name: nullableParam(field.value ?? undefined),
    travelType: field.travelType ?? "Flight",
    outNumberName: field.key,
    ...(field.accountId ? { accountId: field.accountId } : {}),
  };
  const result = await getApi().travel.getTravelUrl(params);
  const rows = unwrapTravelUrlRows(result);
  if (rows.length) return rows;
  return fetchApplicationTravelUrlRows();
}

function isApprovedTravelForm(statusName?: string): boolean {
  return /审批通过/.test(statusName?.trim() ?? "");
}

function toTravelUrlRowFromApplication(item: {
  id: string;
  number?: string;
  name: string;
  statusName?: string;
  trips?: TravelFormTripHint[];
}): TravelUrlRow {
  const hints = item.trips ?? [];
  const routes = hints
    .map((hint) => [hint.fromCity, hint.toCity].filter(Boolean).join(" → "))
    .filter(Boolean);
  const startDate = hints.find((trip) => trip.startDate)?.startDate;
  const endDate = [...hints].reverse().find((trip) => trip.endDate)?.endDate;
  const dingTalkTravels = hints
    .map((hint) => ({
      ...(hint.fromCity ? { Departure: hint.fromCity } : {}),
      ...(hint.toCity ? { Arrival: hint.toCity } : {}),
      ...(hint.startDate ? { StartTime: hint.startDate } : {}),
      ...(hint.endDate ? { EndTime: hint.endDate } : {}),
    }))
    .filter((trip) => trip.Departure || trip.Arrival || trip.StartTime);

  return {
    TravelFormId: item.id,
    TravelNumber: item.number,
    Subject: item.name,
    Status: item.statusName,
    ...(startDate ? { StartDate: startDate } : {}),
    ...(endDate ? { EndDate: endDate } : {}),
    ...(routes.length ? { Trips: routes } : {}),
    ...(dingTalkTravels.length ? { DingTalkTravels: dingTalkTravels } : {}),
  };
}

/** TMC GetTravelUrl is often empty even when 我的申请 has usable travel numbers. */
async function fetchApplicationTravelUrlRows(): Promise<TravelUrlRow[]> {
  const ticket = getTicket();
  if (!ticket) return [];
  try {
    const items = await fetchMyTravelApplicationPickerItems(ticket);
    return items
      .filter((item) => Boolean(item.number?.trim()) && isApprovedTravelForm(item.statusName))
      .map(toTravelUrlRowFromApplication);
  } catch {
    return [];
  }
}

export function filterTravelUrlRows(rows: TravelUrlRow[], keyword: string): TravelUrlRow[] {
  const key = keyword.trim().toLowerCase();
  if (!key) return rows;
  return rows.filter((row) => buildTravelUrlRowSearchText(row).includes(key));
}

export function resolveOutNumberValueFromTravelUrlRow(row: TravelUrlRow): string {
  return String(row.TravelNumber ?? "").trim();
}

/** Prefill from Initialize.TravelFrom, then passenger.travelNumber (legacy getTravelFormNumber). */
export function resolvePrefillTravelNumber(
  init?: FlightInitBookResponse,
  passenger?: PassengerBookInfo,
): string {
  const fromInit = init?.TravelFrom?.TravelNumber?.trim() ?? "";
  if (fromInit) return fromInit;
  if (passenger && "travelNumber" in passenger.passenger && passenger.passenger.travelNumber) {
    return String(passenger.passenger.travelNumber).trim();
  }
  return "";
}

/** Legacy book page: auto-fill TravelNumber only when GetTravelUrl returns exactly one row. */
export function pickSoleTravelUrlNumber(rows: TravelUrlRow[]): string {
  if (rows.length !== 1) return "";
  return resolveOutNumberValueFromTravelUrlRow(rows[0]!);
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
