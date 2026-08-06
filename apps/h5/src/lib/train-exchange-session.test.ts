import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearTrainExchangeSession,
  isTrainExchangeListActive,
  saveTrainExchangeSession,
  syncTrainExchangeSessionForListUrl,
  type TrainExchangeSession,
} from "./train-exchange-session";

const SESSION: TrainExchangeSession = {
  ticketId: "t1",
  exchangeInfo: {
    TicketId: "t1",
    Date: "2026-07-10",
    FromStation: "BJP",
    ToStation: "SHH",
  },
  startedAt: Date.now(),
};

function params(exchange?: string) {
  const search = new URLSearchParams({ date: "2026-07-10", fromCode: "BJP", toCode: "SHH" });
  if (exchange) search.set("exchange", exchange);
  return search;
}

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  });
  vi.stubGlobal("window", {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal(
    "CustomEvent",
    class CustomEvent {
      type: string;

      constructor(type: string) {
        this.type = type;
      }
    },
  );
});

afterEach(() => {
  clearTrainExchangeSession();
  vi.unstubAllGlobals();
});

describe("isTrainExchangeListActive", () => {
  it("is false without exchange URL flag", () => {
    expect(isTrainExchangeListActive(params(), SESSION)).toBe(false);
  });

  it("is false with exchange flag but no session", () => {
    expect(isTrainExchangeListActive(params("1"), null)).toBe(false);
  });

  it("is true only when exchange flag and session both exist", () => {
    expect(isTrainExchangeListActive(params("1"), SESSION)).toBe(true);
  });
});

describe("syncTrainExchangeSessionForListUrl", () => {
  it("clears stale session on normal train list URL", () => {
    saveTrainExchangeSession(SESSION);
    expect(syncTrainExchangeSessionForListUrl(params())).toBeNull();
    expect(syncTrainExchangeSessionForListUrl(params())).toBeNull();
  });

  it("keeps session when exchange URL is active", () => {
    saveTrainExchangeSession(SESSION);
    const synced = syncTrainExchangeSessionForListUrl(params("1"));
    expect(synced?.ticketId).toBe("t1");
  });
});
