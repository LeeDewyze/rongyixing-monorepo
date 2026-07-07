import { describe, expect, it } from "vitest";

import { formatFlightTime, normalizeFlightSegments, resolveFlightSegmentId } from "./flight-list";

describe("formatFlightTime", () => {
  it("extracts HH:mm from ISO datetime", () => {
    expect(formatFlightTime("2026-06-23T20:50:00")).toBe("20:50");
    expect(formatFlightTime("2026-01-05T22:05:00")).toBe("22:05");
  });

  it("extracts HH:mm from space-separated datetime", () => {
    expect(formatFlightTime("2026-06-23 20:50:00")).toBe("20:50");
  });

  it("returns time-only strings unchanged", () => {
    expect(formatFlightTime("22:20")).toBe("22:20");
  });

  it("returns placeholder for empty value", () => {
    expect(formatFlightTime(undefined)).toBe("--:--");
  });
});

describe("normalizeFlightSegments", () => {
  it("assigns Id from FlightNos when FlightViews segment has no Id", () => {
    const segments = normalizeFlightSegments({
      FlightViews: [
        {
          Price: "500",
          Data: "detail-key-abc",
          FlightNos: "SC7954SC7615",
          BookType: 2,
          Segment: {
            Id: "",
            Number: "SC7954",
            FlightNumber: "SC7954",
            TakeoffTime: "2026-06-22T23:00:00",
            ArrivalTime: "2026-06-23T09:00:00",
            IsTransfer: true,
          },
        },
      ],
    });
    expect(segments).toHaveLength(1);
    expect(segments[0]?.Id).toBe("SC7954SC7615");
    expect(segments[0]?.DetailKey).toBe("detail-key-abc");
    expect(segments[0]?.BookType).toBe(2);
  });

  it("resolveFlightSegmentId falls back to detailKey", () => {
    expect(
      resolveFlightSegmentId({
        Id: "",
        Number: "KN5977",
        TakeoffTime: "2026-06-23T20:50:00",
        ArrivalTime: "2026-06-23T22:55:00",
        DetailKey: "dk-kn",
      }),
    ).toBe("dk-kn");
  });
});
