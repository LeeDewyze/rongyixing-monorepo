import { describe, expect, it } from "vitest";

import {
  formatHotelCheckInOutNoticeLine,
  splitHotelBookingNoticeParagraphs,
} from "@/components/hotel/HotelBookNoticeSheet";

describe("splitHotelBookingNoticeParagraphs", () => {
  it("splits semicolon-separated booking notices", () => {
    expect(
      splitHotelBookingNoticeParagraphs("接待大陆客人；2019年7月1日起不再提供牙刷。"),
    ).toEqual(["接待大陆客人", "2019年7月1日起不再提供牙刷。"]);
  });
});

describe("formatHotelCheckInOutNoticeLine", () => {
  it("formats legacy check-in/out as a single line", () => {
    expect(
      formatHotelCheckInOutNoticeLine("入住时间：15:00以后 离店时间：12:00以前"),
    ).toEqual({
      line: "入住时间：15:00以后 离店时间：12:00以前",
    });
  });

  it("returns null for empty input", () => {
    expect(formatHotelCheckInOutNoticeLine(undefined)).toBeNull();
  });
});
