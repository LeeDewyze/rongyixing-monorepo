import { describe, expect, it } from "vitest";

import {
  filterBillLinesForRoom,
  formatOrderBreakfastLabel,
  formatOrderDateTime,
} from "./hotel-order-detail.js";

describe("formatOrderBreakfastLabel", () => {
  it("matches legacy Breakfast>0 ? N份早餐 : 无早餐", () => {
    expect(formatOrderBreakfastLabel(0)).toBe("无早餐");
    expect(formatOrderBreakfastLabel("0")).toBe("无早餐");
    expect(formatOrderBreakfastLabel(2)).toBe("2份早餐");
    expect(formatOrderBreakfastLabel("2")).toBe("2份早餐");
  });

  it("keeps descriptive breakfast text", () => {
    expect(formatOrderBreakfastLabel("含双早")).toBe("含双早");
    expect(formatOrderBreakfastLabel("不含早")).toBe("无早餐");
  });
});

describe("formatOrderDateTime", () => {
  it("drops seconds from datetime strings", () => {
    expect(formatOrderDateTime("2026-06-25 14:25:58")).toBe("2026-06-25 14:25");
    expect(formatOrderDateTime("2026-06-25T14:25:58")).toBe("2026-06-25 14:25");
  });
});

describe("filterBillLinesForRoom", () => {
  const items = [
    { Key: "k1", Name: "Day1", Amount: 100, Tag: "Hotel" },
    { Key: "k1", Name: "Day2", Amount: 120, Tag: "Hotel" },
    { Key: "k1", Name: "提前离店", Amount: -50, Tag: "Hotel" },
    { Key: "k1", Name: "Fee", Amount: 10, Tag: "HotelOnlineFee" },
    { Key: "k2", Name: "Other room", Amount: 200, Tag: "Hotel" },
  ];

  it("filters by room key and service fee flag", () => {
    const lines = filterBillLinesForRoom(items, "k1", false);
    expect(lines.map((line) => line.Name)).toEqual(["Day1", "Day2"]);
  });

  it("includes service fees when enabled", () => {
    const feeItems = [
      { Key: "k1", Name: "Day1", Amount: 100, Tag: "Hotel" },
      { Key: "k1", Name: "Day2", Amount: 120, Tag: "Hotel" },
      { Key: "k1", Name: "Fee", Amount: 10, Tag: "HotelOnlineFee" },
    ];
    const lines = filterBillLinesForRoom(feeItems, "k1", true);
    expect(lines.map((line) => line.Name)).toEqual(["Day1", "Day2", "Fee"]);
  });

  it("truncates at first negative non-cancel line", () => {
    const withNegative = [
      { Key: "k1", Name: "Day1", Amount: 100, Tag: "Hotel" },
      { Key: "k1", Name: "adjust", Amount: -30, Tag: "Hotel" },
      { Key: "k1", Name: "Day2", Amount: 120, Tag: "Hotel" },
    ];
    expect(filterBillLinesForRoom(withNegative, "k1", true)).toEqual([withNegative[0]]);
  });

  it("returns empty when marker is first item", () => {
    const lines = filterBillLinesForRoom(
      [{ Key: "k1", Name: "adjust", Amount: -1, Tag: "Hotel" }],
      "k1",
      true,
    );
    expect(lines).toEqual([]);
  });

  it("keeps cancel negative lines without truncating", () => {
    const lines = filterBillLinesForRoom(
      [
        { Key: "k1", Name: "Day1", Amount: 100, Tag: "Hotel" },
        { Key: "k1", Name: "订单取消", Amount: -100, Tag: "Hotel" },
      ],
      "k1",
      true,
    );
    expect(lines).toHaveLength(2);
  });
});
