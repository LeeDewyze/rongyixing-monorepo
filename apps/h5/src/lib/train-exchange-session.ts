import type { TrainExchangeInfo } from "@ryx/shared-types";

const STORAGE_KEY = "ryx_train_exchange_session";
export const TRAIN_EXCHANGE_SESSION_EVENT = "ryx-train-exchange-session-change";

export interface TrainExchangeSession {
  ticketId: string;
  orderId?: string;
  exchangeInfo: TrainExchangeInfo;
  startedAt: number;
}

function notifyChange(): void {
  window.dispatchEvent(new CustomEvent(TRAIN_EXCHANGE_SESSION_EVENT));
}

export function loadTrainExchangeSession(): TrainExchangeSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrainExchangeSession;
    if (!parsed?.ticketId || !parsed.exchangeInfo) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveTrainExchangeSession(session: TrainExchangeSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  notifyChange();
}

export function clearTrainExchangeSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

export function buildTrainExchangeListPath(info: TrainExchangeInfo): string {
  const params = new URLSearchParams();
  if (info.Date) {
    params.set("date", info.Date.slice(0, 10));
  }
  if (info.FromStation) {
    params.set("fromCode", info.FromStation);
  }
  if (info.ToStation) {
    params.set("toCode", info.ToStation);
  }
  if (info.FromStationName) {
    params.set("fromName", info.FromStationName);
  }
  if (info.ToStationName) {
    params.set("toName", info.ToStationName);
  }
  params.set("exchange", "1");
  return `/train/list?${params.toString()}`;
}
