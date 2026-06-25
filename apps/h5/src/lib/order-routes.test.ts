import { OrderListTabId } from "@ryx/shared-types";
import { describe, expect, it } from "vitest";

import { getOrderDetailPath, getOrderPayPath, getOrderResultPath } from "./order-routes";

describe("order-routes", () => {
  const flightItem = {
    tabId: OrderListTabId.Flight,
    OrderId: "ORD-FLT-001",
    Status: "WaitPay",
    StatusName: "待付款",
    RouteTitle: "CZ8879 北京—上海",
    DepartTime: "2023-08-09 20:23:23",
    PassengerNames: "张三",
  };

  it("routes flight detail and pay paths", () => {
    expect(getOrderDetailPath(flightItem)).toBe("/orders/flight/ORD-FLT-001");
    expect(getOrderPayPath(flightItem)).toBe("/flight/pay/ORD-FLT-001");
    expect(getOrderResultPath("Flight", "ORD-FLT-001")).toBe("/flight/result/ORD-FLT-001");
  });
});
