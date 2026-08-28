import { afterEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => {
  const process = vi.fn();
  return {
    process,
    getApi: vi.fn(() => ({
      pay: { process },
    })),
  };
});

vi.mock("@/lib/api", () => ({
  getApi: apiMocks.getApi,
}));

import {
  bootstrapWechatPayResultCallback,
  clearPendingPayContext,
  PENDING_PAY_CONTEXT_TTL_MS,
  savePendingPayContext,
} from "./pay-result-callback";

function createStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
  };
}

function stubBrowser(href: string, sessionStorage: ReturnType<typeof createStorageMock>) {
  const url = new URL(href);
  const replaceState = vi.fn();
  vi.stubGlobal("sessionStorage", sessionStorage);
  vi.stubGlobal("window", {
    location: {
      href,
      search: url.search,
      pathname: url.pathname,
      hash: url.hash,
    },
    history: { state: null, replaceState },
  });
  return { replaceState };
}

describe("savePendingPayContext / clearPendingPayContext", () => {
  it("round-trips the pending pay context", () => {
    const storage = createStorageMock();
    vi.stubGlobal("sessionStorage", storage);
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    savePendingPayContext({ payType: "Wechatpay", channel: "tourist", productType: "Flight" });
    expect(JSON.parse(storage.setItem.mock.calls[0][1])).toEqual({
      payType: "Wechatpay",
      channel: "tourist",
      productType: "Flight",
      createdAt: 1_000_000,
    });
    clearPendingPayContext();
    expect(storage.removeItem).toHaveBeenCalledWith("ryx_pending_pay_context");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});

describe("bootstrapWechatPayResultCallback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    apiMocks.getApi.mockClear();
    apiMocks.process.mockReset();
  });

  it("returns false when no pay-result marker is present", async () => {
    const storage = createStorageMock();
    stubBrowser("https://web.ryx.com/orders?ticket=t1", storage);
    await expect(bootstrapWechatPayResultCallback()).resolves.toBe(false);
    expect(apiMocks.process).not.toHaveBeenCalled();
  });

  it("confirms with the saved tourist context and cleans up", async () => {
    const storage = createStorageMock();
    apiMocks.process.mockResolvedValue({ Success: true });
    storage.setItem(
      "ryx_pending_pay_context",
      JSON.stringify({
        payType: "Wechatpay",
        channel: "tourist",
        productType: "Flight",
        createdAt: Date.now(),
      }),
    );
    const { replaceState } = stubBrowser(
      "https://web.ryx.com/orders?wechatPayResultNumber=PAY-1&ticket=t1",
      storage,
    );
    await expect(bootstrapWechatPayResultCallback()).resolves.toBe(true);
    expect(apiMocks.process).toHaveBeenCalledWith({
      OutTradeNo: "PAY-1",
      Type: "Wechatpay",
      channel: "tourist",
      ProductType: "Flight",
    });
    expect(storage.removeItem).toHaveBeenCalledWith("ryx_pending_pay_context");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/orders?ticket=t1");
  });

  it("falls back to WeChat Type 3 when no context was saved", async () => {
    const storage = createStorageMock();
    apiMocks.process.mockResolvedValue({ Success: true });
    stubBrowser(
      "https://web.ryx.com/orders?wechatPayResultNumber=PAY-2&ticket=t1",
      storage,
    );
    await expect(bootstrapWechatPayResultCallback()).resolves.toBe(true);
    expect(apiMocks.process).toHaveBeenCalledWith({
      OutTradeNo: "PAY-2",
      Type: "3",
    });
  });

  it("keeps the marker when confirmation throws so a refresh can retry", async () => {
    const storage = createStorageMock();
    apiMocks.process.mockRejectedValue(new Error("boom"));
    storage.setItem(
      "ryx_pending_pay_context",
      JSON.stringify({ payType: "3", createdAt: Date.now() }),
    );
    const { replaceState } = stubBrowser(
      "https://web.ryx.com/orders?wechatPayResultNumber=PAY-3",
      storage,
    );
    await expect(bootstrapWechatPayResultCallback()).resolves.toBe(true);
    expect(replaceState).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalledWith("ryx_pending_pay_context");
  });

  it("keeps the marker when the server reports failure", async () => {
    const storage = createStorageMock();
    apiMocks.process.mockResolvedValue({ Success: false, Message: "订单不存在" });
    storage.setItem(
      "ryx_pending_pay_context",
      JSON.stringify({ payType: "3", createdAt: Date.now() }),
    );
    const { replaceState } = stubBrowser(
      "https://web.ryx.com/orders?wechatPayResultNumber=PAY-4",
      storage,
    );
    await expect(bootstrapWechatPayResultCallback()).resolves.toBe(true);
    expect(replaceState).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalledWith("ryx_pending_pay_context");
  });

  it("clears a pending context after fifteen minutes", async () => {
    const storage = createStorageMock();
    apiMocks.process.mockResolvedValue({ Success: true });
    storage.setItem(
      "ryx_pending_pay_context",
      JSON.stringify({ payType: "3", createdAt: 1_000_000 }),
    );
    vi.spyOn(Date, "now").mockReturnValue(1_000_000 + PENDING_PAY_CONTEXT_TTL_MS);
    stubBrowser("https://web.ryx.com/orders?wechatPayResultNumber=PAY-5", storage);

    await expect(bootstrapWechatPayResultCallback()).resolves.toBe(true);
    expect(storage.removeItem).toHaveBeenCalledWith("ryx_pending_pay_context");
    expect(apiMocks.process).toHaveBeenCalledWith({
      OutTradeNo: "PAY-5",
      Type: "3",
    });
  });
});
