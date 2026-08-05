import { describe, expect, it } from "vitest";

import {
  formatHotelCancelRuleNotice,
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

describe("formatHotelCancelRuleNotice", () => {
  it("keeps the selected room plan cancellation rule", () => {
    expect(
      formatHotelCancelRuleNotice("您的订单一经确认，不可取消；未入住将收取全额房费。"),
    ).toBe("您的订单一经确认，不可取消；未入住将收取全额房费。");
  });

  it("omits empty cancellation rules", () => {
    expect(formatHotelCancelRuleNotice("   ")).toBeNull();
  });
});
