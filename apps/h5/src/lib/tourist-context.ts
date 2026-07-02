import type { ProxySendOptions } from "@ryx/shared-types";
import { TMC_METHODS } from "@ryx/api";

export interface TouristContext {
  TouristTmcId: string;
  TouristMmsId: string;
}

export interface TouristContextSender {
  send<TRes = unknown>(options: ProxySendOptions): Promise<TRes>;
}

export interface ResolveTouristContextOptions {
  appId: string;
  sender: TouristContextSender;
  search?: string;
}

export interface SendWithTouristContextOptions extends ResolveTouristContextOptions {
  request: ProxySendOptions;
}

const TOURIST_TMC_QUERY_KEYS = [
  "TouristTmcId",
  "touristTmcId",
  "TouristTmcid",
  "TouristtmcId",
  "touristtmcId",
  "touristtmcid",
] as const;

const TOURIST_MMS_QUERY_KEYS = [
  "TouristMmsId",
  "TouristmmsId",
  "Touristmmsid",
  "touristmmsId",
  "touristMmsid",
  "touristmmsid",
] as const;

const TMC_ID_FIELD_KEYS = ["tmcId", "TmcId", "tmcid", "TMCId"] as const;

let touristContextPromise: Promise<TouristContext> | null = null;

function readQueryParams(search?: string): URLSearchParams {
  if (search != null) {
    return new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  }
  return new URLSearchParams(globalThis.location?.search ?? "");
}

function firstQueryValue(params: URLSearchParams, keys: readonly string[]): string {
  for (const key of keys) {
    const value = params.get(key)?.trim();
    if (value) return value;
  }
  return "";
}

function normalizeContextValue(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeTouristContext(
  value: Partial<TouristContext> | Record<string, unknown> | null | undefined,
): TouristContext | null {
  const tmcId = normalizeContextValue(value?.TouristTmcId);
  const mmsId = normalizeContextValue(value?.TouristMmsId);
  if (!tmcId || !mmsId || tmcId === "0" || mmsId === "0") {
    return null;
  }
  return {
    TouristTmcId: tmcId,
    TouristMmsId: mmsId,
  };
}

export function readTouristContextFromSearch(search?: string): TouristContext | null {
  const params = readQueryParams(search);
  return normalizeTouristContext({
    TouristTmcId: firstQueryValue(params, TOURIST_TMC_QUERY_KEYS),
    TouristMmsId: firstQueryValue(params, TOURIST_MMS_QUERY_KEYS),
  });
}

async function fetchTouristContext(
  sender: TouristContextSender,
  appId: string,
): Promise<TouristContext | null> {
  const response = await sender.send<Partial<TouristContext>>({
    method: TMC_METHODS.HOME_TOURIST,
    data: { AppId: appId },
    requestFields: {
      IsRedirctLogin: false,
      IsRedirctNoAuthorize: false,
    },
  });
  return normalizeTouristContext(response);
}

export function clearTouristContextCache(): void {
  touristContextPromise = null;
}

export function isTouristMethod(method: string): boolean {
  return method.startsWith("TmcTourist");
}

export async function resolveTouristContext({
  appId,
  sender,
  search,
}: ResolveTouristContextOptions): Promise<TouristContext> {
  const fromQuery = readTouristContextFromSearch(search);
  if (fromQuery) {
    return fromQuery;
  }

  if (!touristContextPromise) {
    touristContextPromise = fetchTouristContext(sender, appId).then((context) => {
      const queryOverride = readTouristContextFromSearch(search);
      const resolved = queryOverride ?? context;
      if (!resolved) {
        throw new Error("Tourist context missing TouristTmcId or TouristMmsId");
      }
      return resolved;
    });
  }

  try {
    return await touristContextPromise;
  } catch (error) {
    touristContextPromise = null;
    throw error;
  }
}

function stripTmcIdFields(fields: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
  const next = { ...fields };
  for (const key of TMC_ID_FIELD_KEYS) {
    delete next[key];
  }
  return next;
}

function injectDataTmcId(data: unknown, tmcId: string): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }
  const next = { ...(data as Record<string, unknown>) };
  for (const key of TMC_ID_FIELD_KEYS) {
    delete next[key];
  }
  next.TmcId = tmcId;
  return next;
}

export function withTouristContext(
  options: ProxySendOptions,
  context: TouristContext,
): ProxySendOptions {
  return {
    ...options,
    data: injectDataTmcId(options.data, context.TouristTmcId),
    requestFields: {
      ...stripTmcIdFields(options.requestFields ?? {}),
      TmcId: context.TouristTmcId,
      MmsId: context.TouristMmsId,
    },
  };
}

export async function sendWithTouristContext<TRes = unknown>({
  appId,
  sender,
  search,
  request,
}: SendWithTouristContextOptions): Promise<TRes> {
  if (!isTouristMethod(request.method)) {
    throw new Error(`Tourist context can only be used with TmcTourist methods: ${request.method}`);
  }
  const context = await resolveTouristContext({ appId, sender, search });
  return sender.send<TRes>(withTouristContext(request, context));
}
