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
}

export interface CreateRequestEntityOptions {
  getTicket?: () => string | null;
  getDomain?: () => string | null;
  getLanguage?: () => string;
  token?: string;
}

/** Build a beeant-style RequestEntity payload (without Sign). */
export function createRequestEntity(
  method: string,
  data?: unknown,
  options: CreateRequestEntityOptions = {},
): RequestEntityFields {
  const ticket = options.getTicket?.() ?? "";
  return {
    Method: method,
    Data: data,
    Timestamp: getTimestamp(),
    Token: options.token ?? "",
    Ticket: ticket,
    Domain: options.getDomain?.() ?? "",
    Language: options.getLanguage?.() ?? "zh-CN",
  };
}

export function toFormFields(
  req: RequestEntityFields,
  sign: string,
): Record<string, string> {
  const fields: Record<string, string> = {
    Method: req.Method,
    Timestamp: String(req.Timestamp ?? getTimestamp()),
    Sign: sign,
    "x-requested-with": "XMLHttpRequest",
  };

  const dataStr = serializeData(req.Data);
  if (dataStr) {
    fields.Data = dataStr;
  }
  if (req.Token) {
    fields.Token = req.Token;
  }
  if (req.Ticket) {
    fields.Ticket = req.Ticket;
  }
  if (req.TicketName) {
    fields.TicketName = req.TicketName;
  }
  if (req.Domain) {
    fields.Domain = req.Domain;
  }
  if (req.Language) {
    fields.Language = req.Language;
  }
  if (req.Version) {
    fields.Version = req.Version;
  }

  return fields;
}

export function encodeFormBody(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}
