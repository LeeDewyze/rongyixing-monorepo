import { OrderListTabId, type OrderFlightListItem } from "@ryx/shared-types";
import { describe, expect, it } from "vitest";

import {
  getOrderActions,
  getOrderStatusStyle,
  getTicketStatusStyle,
  shouldGrayPrice,
} from "./order-status";

describe("getOrderStatusStyle", () => {
  it("maps primary status colors", () => {
    expect(getOrderStatusStyle("待付款").color).toBe("#FF4D4F");
    expect(getOrderStatusStyle("待出行").color).toBe("#FF9500");
    expect(getOrderStatusStyle("交易完成").color).toBe("#52C41A");
    expect(getOrderStatusStyle("已取消").color).toBe("#9CA3AF");
  });
});

describe("getTicketStatusStyle", () => {
  it("maps ticket sub-status colors", () => {
    expect(getTicketStatusStyle("待出票").color).toBe("#FF4D4F");
    expect(getTicketStatusStyle("已出票").color).toBe("#52C41A");
    expect(getTicketStatusStyle("已退票").color).toBe("#9CA3AF");
  });
});

describe("shouldGrayPrice", () => {
  it("returns true for cancelled orders", () => {
    const item: OrderFlightListItem = {
      tabId: OrderListTabId.Flight,
      OrderId: "1",
      Status: "Cancelled",
      StatusName: "已取消",
      RouteTitle: "A",
      DepartTime: "t",
      PassengerNames: "p",
    };
    expect(shouldGrayPrice(item)).toBe(true);
  });

  it("returns false for active orders", () => {
    const item: OrderFlightListItem = {
      tabId: OrderListTabId.Flight,
      OrderId: "2",
      Status: "WaitPay",
      StatusName: "待付款",
      RouteTitle: "A",
      DepartTime: "t",
      PassengerNames: "p",
    };
    expect(shouldGrayPrice(item)).toBe(false);
  });
});

describe("getOrderActions", () => {
  it("returns actions from item", () => {
    const item: OrderFlightListItem = {
      tabId: OrderListTabId.Flight,
      OrderId: "3",
      Status: "WaitPay",
      StatusName: "待付款",
      RouteTitle: "A",
      DepartTime: "t",
      PassengerNames: "p",
      Actions: [
        { kind: "cancel", label: "取消" },
        { kind: "pay", label: "支付" },
      ],
    };
    expect(getOrderActions(item)).toHaveLength(2);
    expect(getOrderActions(item)[0]?.kind).toBe("cancel");
  });

  it("returns empty array when no actions", () => {
    const item: OrderFlightListItem = {
      tabId: OrderListTabId.Flight,
      OrderId: "4",
      Status: "Cancelled",
      StatusName: "已取消",
      RouteTitle: "A",
      DepartTime: "t",
      PassengerNames: "p",
    };
    expect(getOrderActions(item)).toEqual([]);
  });
});
