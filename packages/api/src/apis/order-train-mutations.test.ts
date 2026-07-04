import { describe, expect, it, vi } from "vitest";

import { createOrderApi } from "./order.js";

describe("train order mutations", () => {
  it("cancelTrain sends legacy Id-only payload", async () => {
    const send = vi.fn().mockResolvedValue(true);
    const api = createOrderApi({ send } as never);

    await api.cancelTrain({ OrderId: "20760000000204", Channel: "客户H5" });

    expect(send).toHaveBeenCalledWith({
      method: "TmcApiOrderUrl-Order-CancelTrain",
      data: { Id: "20760000000204" },
    });
  });

  it("issueTrain sends legacy Id-only payload", async () => {
    const send = vi.fn().mockResolvedValue(true);
    const api = createOrderApi({ send } as never);

    await api.issueTrain({ OrderId: "20760000000204", Channel: "客户H5" });

    expect(send).toHaveBeenCalledWith({
      method: "TmcApiOrderUrl-Order-IssueTrain",
      data: { Id: "20760000000204" },
    });
  });

  it("uses tourist order methods when channel is tourist", async () => {
    const send = vi.fn().mockResolvedValue(true);
    const api = createOrderApi({ send } as never);

    await api.cancelTrain({ channel: "tourist", OrderId: "20760000000204", Channel: "客户H5" });
    await api.issueTrain({ channel: "tourist", OrderId: "20760000000204" });
    await api.abolishTrainTicket({
      channel: "tourist",
      OrderId: "20760000000204",
      TicketId: "20760000000258",
      Tag: "train",
      Channel: "客户H5",
    });
    await api.refundTrain({
      channel: "tourist",
      OrderId: "20760000000204",
      TicketId: "20760000000258",
      Channel: "客户H5",
    });
    await api.cancelHotel({
      channel: "tourist",
      OrderId: "20760000000205",
      OrderHotelId: "hotel-1",
    });

    expect(send).toHaveBeenNthCalledWith(1, {
      method: "TmcTouristOrderUrl-Order-CancelTrain",
      data: { Id: "20760000000204" },
    });
    expect(send).toHaveBeenNthCalledWith(2, {
      method: "TmcTouristOrderUrl-Order-IssueTrain",
      data: { Id: "20760000000204" },
    });
    expect(send).toHaveBeenNthCalledWith(3, {
      method: "TmcTouristOrderUrl-Order-AbolishTicket",
      data: {
        OrderId: "20760000000204",
        TicketId: "20760000000258",
        Tag: "train",
        Channel: "客户H5",
      },
    });
    expect(send).toHaveBeenNthCalledWith(4, {
      method: "TmcTouristTrainUrl-Home-Refund",
      data: { TicketId: "20760000000258" },
    });
    expect(send).toHaveBeenNthCalledWith(5, {
      method: "TmcTouristOrderUrl-Order-CancelOrderHotel",
      data: { OrderId: "20760000000205", OrderHotelId: "hotel-1" },
    });
  });
});
