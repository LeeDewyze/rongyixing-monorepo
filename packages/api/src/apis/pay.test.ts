import { describe, expect, it, vi } from "vitest";

import { createPayApi } from "./pay.js";

describe("createPayApi", () => {
  it("uses tourist order pay methods when channel is tourist", async () => {
    const send = vi.fn().mockResolvedValue({});
    const api = createPayApi({ send } as never);

    await api.getTotalPayAmount({ channel: "tourist", ProductType: "Flight", OrderId: "ord-1" });
    await api.getOrderPays({ channel: "tourist", OrderId: "ord-1" });

    expect(send).toHaveBeenNthCalledWith(1, {
      method: "TmcTouristOrderUrl-Pay-GetTotalPayAmount",
      data: { Channel: "App", OrderId: "ord-1", Key: "" },
    });
    expect(send).toHaveBeenNthCalledWith(2, {
      method: "TmcTouristOrderUrl-Order-GetOrderPays",
      data: { OrderId: "ord-1" },
    });
  });

  it("uses tourist hotel pay create/process special methods", async () => {
    const send = vi.fn().mockResolvedValue({});
    const api = createPayApi({ send } as never);

    await api.create({
      channel: "tourist",
      ProductType: "Hotel",
      OrderId: "ord-2",
      PayType: "wechat",
    });
    await api.process({
      channel: "tourist",
      ProductType: "Hotel",
      OutTradeNo: "pay-1",
      Type: "wechat",
    });

    expect(send).toHaveBeenNthCalledWith(1, {
      method: "TmcTouristHotelUrl-Pay-Create",
      data: {
        Channel: "App",
        Type: "3",
        OrderId: "ord-2",
        IsApp: false,
        CreateType: "Mobile",
        DataType: "json",
      },
    });
    expect(send).toHaveBeenNthCalledWith(2, {
      method: "TmcTouristHotelUrl-Pay-Process",
      data: { OutTradeNo: "pay-1", Type: "3" },
    });
  });
});
