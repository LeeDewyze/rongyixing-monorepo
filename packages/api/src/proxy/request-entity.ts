import { serializeData } from "./sign.js";

/** UTC+8 unix timestamp in seconds (matches beeant AppHelper.getTimestamp). */
export function getTimestamp(): number {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const cnMs = utcMs + 8 * 3_600_000;
  return Math.floor(cnMs / 1000);
}

export interface RequestEntityFields {
  Method: string;
  Data?: unknown;
  Timestamp?: number;
  Token?: string;
  Ticket?: string;
  TicketName?: string;
  Domain?: string;
  Language?: string;
  Version?: string;
  Url?: string;
  IsForward?: boolean;
  Timeout?: number;
  IsShowLoading?: boolean;
  [key: string]: unknown;
}

export interface CreateRequestEntityOptions {
  getTicket?: () => string | null;
  getTicketName?: () => string;
  getDomain?: () => string | null;
  getLanguage?: () => string;
  getExtraFields?: () => Record<string, string>;
  token?: string;
}

/** Build a beeant-style RequestEntity payload (without Sign). */
export function createRequestEntity(
  method: string,
  data?: unknown,
  options: CreateRequestEntityOptions = {},
): RequestEntityFields {
  const ticketName = options.getTicketName?.() ?? "ticket";
  const ticket = options.getTicket?.() ?? "";

  const req: RequestEntityFields = {
    Method: method,
    Data: data,
    Timestamp: getTimestamp(),
    Token: options.token ?? "",
    Language: options.getLanguage?.() ?? "cn",
    Domain: options.getDomain?.() ?? "",
    Ticket: ticket,
    TicketName: ticketName,
  };

  const extras = options.getExtraFields?.() ?? {};
  for (const [key, value] of Object.entries(extras)) {
    if (value) {
      req[key] = value;
    }
  }

  if (ticketName !== "ticket") {
    req[ticketName] = ticket;
    req.Ticket = "";
  } else {
    req.TicketName = "";
  }

  return req;
}

const SKIP_FORM_KEYS = new Set([
  "Data",
  "Url",
  "IsForward",
  "Timeout",
  "LoadingMsg",
  /** Handled explicitly above; must not leak via the generic req loop */
  "Token",
  "Sign",
]);

export interface ToFormFieldsOptions {
  includeSign?: boolean;
  includeToken?: boolean;
  /** Override serialized Data for the form body (sign may use a different encoding). */
  formData?: string;
}

export function toFormFields(
  req: RequestEntityFields,
  sign: string,
  options: ToFormFieldsOptions = {},
): Record<string, string> {
  const includeSign = options.includeSign !== false;
  const includeToken = options.includeToken !== false;

  const fields: Record<string, string> = {
    Method: req.Method,
    Timestamp: String(req.Timestamp ?? getTimestamp()),
    Language: String(req.Language ?? "cn"),
    Ticket: String(req.Ticket ?? ""),
    TicketName: String(req.TicketName ?? ""),
    Domain: String(req.Domain ?? ""),
    "x-requested-with": "XMLHttpRequest",
  };

  if (includeSign) {
    fields.Sign = sign;
  }

  const dataStr = options.formData ?? serializeData(req.Data);
  if (dataStr) {
    fields.Data = dataStr;
  }
  if (req.Token && includeToken) {
    fields.Token = req.Token;
  }
  if (req.Version) {
    fields.Version = String(req.Version);
  }

  for (const [key, value] of Object.entries(req)) {
    if (SKIP_FORM_KEYS.has(key) || key in fields || value === undefined || value === null) {
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      fields[key] = String(value);
    }
  }

  return fields;
}

export function encodeFormBody(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}

const UNSIGNED_FORM_SKIP = new Set(["Url", "Token", "Sign"]);

/**
 * Beeant identity.service getWebSocketUrl / checkTicket unsigned POST body.
 * Mirrors: Object.keys(req).map(k => `${k}=${req[k]}`).join("&")
 * Objects coerce to "[object Object]" (not JSON.stringify).
 */
export function buildUnsignedFormBody(req: RequestEntityFields): string {
  const parts: string[] = [];
  for (const key of Object.keys(req)) {
    if (UNSIGNED_FORM_SKIP.has(key)) {
      continue;
    }
    const value = req[key];
    if (value === undefined || value === null) {
      continue;
    }
    parts.push(`${key}=${value as string | number | boolean}`);
  }
  parts.push("x-requested-with=XMLHttpRequest");
  return parts.join("&");
}
