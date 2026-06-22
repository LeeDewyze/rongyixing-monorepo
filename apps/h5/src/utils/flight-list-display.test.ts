import { describe, expect, it } from "vitest";

import {
  formatArrivalDateBadge,
  formatCabinsDepartTitle,
  formatFlightLocationLabel,
  formatFlightMealLabel,
  formatFlightMetaDuration,
} from "./flight-list-display";

describe("flight-list-display cabins helpers", () => {
  it("formats depart title", () => {
    expect(formatCabinsDepartTitle("2026-01-05T22:05:00")).toBe("1月05日 周一出发");
  });

  it("formats location label", () => {
    expect(formatFlightLocationLabel("上海", "浦东国际机场", "T2")).toBe("上海·浦东T2");
  });

  it("shows arrival cross-day badge", () => {
    expect(formatArrivalDateBadge("2026-01-05T22:05:00", "2026-01-06T00:30:00")).toBe(
      "1月06日",
    );
  });

  it("formats meal and duration meta", () => {
    expect(formatFlightMealLabel("R")).toBe("有小食");
    expect(formatFlightMetaDuration("2h25m")).toBe("飞2h25m");
  });
});
