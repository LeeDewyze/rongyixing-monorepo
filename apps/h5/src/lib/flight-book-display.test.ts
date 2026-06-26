import { describe, expect, it } from "vitest";

import { formatFlightBookDuration, formatFlightBookRouteSubtitle } from "./flight-book-display";

describe("formatFlightBookDuration", () => {
  it("converts compact duration labels to Chinese", () => {
    expect(formatFlightBookDuration("2h10m")).toBe("2小时10分钟");
    expect(formatFlightBookDuration("飞2h30m")).toBe("2小时30分钟");
  });

  it("keeps Chinese duration labels", () => {
    expect(formatFlightBookDuration("12小时5分")).toBe("12小时5分钟");
    expect(formatFlightBookDuration("12小时5分钟")).toBe("12小时5分钟");
  });
});

describe("formatFlightBookRouteSubtitle", () => {
  it("formats date, weekday and duration", () => {
    expect(formatFlightBookRouteSubtitle("2026-06-10T08:00:00", "12h5m")).toBe(
      "2026-06-10周三 12小时5分钟",
    );
  });

  it("strips leading 飞 from duration label", () => {
    expect(formatFlightBookRouteSubtitle("2026-06-23T20:50:00", "飞2h30m")).toBe(
      "2026-06-23周二 2小时30分钟",
    );
  });
});
