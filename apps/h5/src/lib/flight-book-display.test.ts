import { describe, expect, it } from "vitest";

import { formatFlightBookRouteSubtitle } from "./flight-book-display";

describe("formatFlightBookRouteSubtitle", () => {
  it("formats date, weekday and duration", () => {
    expect(formatFlightBookRouteSubtitle("2026-06-10T08:00:00", "12h5m")).toBe(
      "2026-06-10 周三 12h5m",
    );
  });

  it("strips leading 飞 from duration label", () => {
    expect(formatFlightBookRouteSubtitle("2026-06-23T20:50:00", "飞2h30m")).toBe(
      "2026-06-23 周二 2h30m",
    );
  });
});
