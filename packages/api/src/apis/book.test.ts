import { describe, expect, it, vi } from "vitest";

import { createBookApi } from "./book.js";

describe("createBookApi", () => {
  it("uses TMC Home-CheckPay by default", async () => {
    const send = vi.fn().mockResolvedValue(true);
    const api = createBookApi({ send } as never);

    await api.checkPay("trade-1");

    expect(send).toHaveBeenCalledWith({
      method: "TmcApiBookUrl-Home-CheckPay",
      data: { OrderId: "trade-1" },
    });
  });

  it("uses tourist product CheckPay when channel is tourist", async () => {
    const send = vi.fn().mockResolvedValue({ Result: true });
    const api = createBookApi({ send } as never);

    await expect(
      api.checkPay({ orderId: "trade-2", channel: "tourist", productType: "Hotel" }),
    ).resolves.toBe(true);

    expect(send).toHaveBeenCalledWith({
      method: "TmcTouristBookUrl-Hotel-CheckPay",
      data: { OrderId: "trade-2" },
    });
  });

  it("uses tourist country method when channel is tourist", async () => {
    const send = vi.fn().mockResolvedValue([{ Code: "CN", Name: "中国" }]);
    const api = createBookApi({ send } as never);

    await expect(api.getCountries({ channel: "tourist" })).resolves.toEqual([
      { Code: "CN", Name: "中国" },
    ]);

    expect(send).toHaveBeenCalledWith({
      method: "TmcTouristBookUrl-Home-Country",
      data: {},
    });
  });
});
