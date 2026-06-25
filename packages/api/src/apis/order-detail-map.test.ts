import { describe, expect, it } from "vitest";

import { normalizeOrderDetailResponse } from "./order-detail-map.js";

describe("normalizeOrderDetailResponse", () => {
  it("maps legacy flight order detail", () => {
    const detail = normalizeOrderDetailResponse({
      Id: "ORD-1",
      Status: "WaitPay",
      StatusName: "待付款",
      TotalAmount: 680,
      Variables: JSON.stringify({ isPay: true }),
      OrderFlightTickets: [
        {
          StatusName: "待出票",
          OrderFlightTrips: [
            {
              FlightNumber: "KN5977",
              FromCityName: "北京",
              ToCityName: "上海",
              TakeoffTime: "2026-06-23T08:30:00",
              OrderFlightTicket: { Passenger: { Name: "张三" } },
            },
          ],
        },
      ],
    });

    expect(detail).toMatchObject({
      OrderId: "ORD-1",
      ProductType: "Flight",
      RouteTitle: "KN5977 北京—上海",
      PassengerNames: "张三",
      isShowPayButton: true,
      TotalAmount: 680,
    });
  });

  it("passes through normalized detail", () => {
    const normalized = {
      OrderId: "FLT-1",
      ProductType: "Flight" as const,
      RouteTitle: "MU5101 上海—广州",
    };
    expect(normalizeOrderDetailResponse(normalized)).toEqual(normalized);
  });
});
