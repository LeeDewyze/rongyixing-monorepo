import { describe, expect, it } from "vitest";

import {
  filterHotelPersonalPayTypeOptions,
  HOTEL_PAY_TYPE_COMPANY,
  HOTEL_PAY_TYPE_PERSON,
  parseHotelPayTypeOptions,
} from "@/lib/hotel-book-pay";

describe("parseHotelPayTypeOptions", () => {
  it("filters real-time debit and credit pay types from initialize PayTypes", () => {
    expect(
      parseHotelPayTypeOptions({
        "1": "公付",
        "2": "个付（请在20分钟内完成支付）",
        "3": "实时扣款",
        "4": "信用付",
      }),
    ).toEqual([
      { value: HOTEL_PAY_TYPE_COMPANY, label: "公付" },
      { value: HOTEL_PAY_TYPE_PERSON, label: "个付（请在20分钟内完成支付）" },
    ]);
  });

  it("keeps only personal pay for tourist hotel book", () => {
    expect(
      filterHotelPersonalPayTypeOptions([
        { value: HOTEL_PAY_TYPE_COMPANY, label: "公付" },
        { value: HOTEL_PAY_TYPE_PERSON, label: "个付（请在20分钟内完成支付）" },
      ]),
    ).toEqual([{ value: HOTEL_PAY_TYPE_PERSON, label: "个付（请在20分钟内完成支付）" }]);
  });

  it("falls back to personal pay when initialize does not include it", () => {
    expect(filterHotelPersonalPayTypeOptions([{ value: HOTEL_PAY_TYPE_COMPANY, label: "公付" }]))
      .toEqual([{ value: HOTEL_PAY_TYPE_PERSON, label: "个付（请在20分钟内完成支付）" }]);
  });
});
