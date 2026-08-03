import type { FlightExchangeInfo, PassengerBookInfo, ProductChannel } from "@ryx/shared-types";

// Exchange context only. If later pages need the traveler, write it through
// passenger-selection so normal flight flow reads ryx_passenger_selection_1.
const STORAGE_KEY = "ryx_flight_exchange_session";
export const FLIGHT_EXCHANGE_SESSION_EVENT = "ryx-flight-exchange-session-change";

export interface FlightExchangeSession {
  ticketId: string;
  orderId?: string;
  exchangeInfo: FlightExchangeInfo;
  /** Original-ticket passenger snapshot; not the current selection source. */
  passengers?: PassengerBookInfo[];
  startedAt: number;
}

function notifyChange(): void {
  window.dispatchEvent(new CustomEvent(FLIGHT_EXCHANGE_SESSION_EVENT));
}

export function loadFlightExchangeSession(): FlightExchangeSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FlightExchangeSession;
    if (!parsed?.ticketId || !parsed.exchangeInfo) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveFlightExchangeSession(session: FlightExchangeSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  notifyChange();
}

export function clearFlightExchangeSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

export function isFlightExchangeListActive(
  searchParams: URLSearchParams,
  session: FlightExchangeSession | null,
): boolean {
  return (
    searchParams.get("exchange") === "1" &&
    Boolean(session?.ticketId ?? searchParams.get("ticketId"))
  );
}

export function syncFlightExchangeSessionForListUrl(
  searchParams: URLSearchParams,
): FlightExchangeSession | null {
  if (searchParams.get("exchange") !== "1") {
    if (loadFlightExchangeSession()) {
      clearFlightExchangeSession();
    }
    return null;
  }

  const session = loadFlightExchangeSession();
  if (session) return session;

  const ticketId = searchParams.get("ticketId") ?? "";
  if (!ticketId) return null;

  const fallback: FlightExchangeSession = {
    ticketId,
    exchangeInfo: {
      TicketId: ticketId,
      Date: searchParams.get("date") ?? undefined,
      FromCode: searchParams.get("fromCode") ?? undefined,
      ToCode: searchParams.get("toCode") ?? undefined,
      FromName: searchParams.get("fromName") ?? undefined,
      ToName: searchParams.get("toName") ?? undefined,
      FromAsAirport: searchParams.get("fromAsAirport") === "true",
      ToAsAirport: searchParams.get("toAsAirport") === "true",
      BookType: searchParams.get("bookType") ?? undefined,
    },
    startedAt: Date.now(),
  };
  saveFlightExchangeSession(fallback);
  return fallback;
}

export function buildFlightExchangeListPath(
  info: FlightExchangeInfo,
  channel?: ProductChannel,
): string {
  const params = new URLSearchParams();
  if (info.Date) params.set("date", info.Date.slice(0, 10));
  if (info.FromCode) params.set("fromCode", info.FromCode);
  if (info.ToCode) params.set("toCode", info.ToCode);
  if (info.FromName) params.set("fromName", info.FromName);
  if (info.ToName) params.set("toName", info.ToName);
  if (typeof info.FromAsAirport === "boolean") {
    params.set("fromAsAirport", String(info.FromAsAirport));
  }
  if (typeof info.ToAsAirport === "boolean") {
    params.set("toAsAirport", String(info.ToAsAirport));
  }
  if (info.TicketId) params.set("ticketId", info.TicketId);
  if (info.BookType != null) params.set("bookType", String(info.BookType));
  if (channel) params.set("channel", channel);
  params.set("exchange", "1");
  return `/flight/list?${params.toString()}`;
}
