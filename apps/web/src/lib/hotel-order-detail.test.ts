import { describe, expect, it } from "vitest";

import { shouldShowFooter, suppressHotelFooterActions } from "@/lib/hotel-order-detail";

describe("hotel order local action suppression", () => {
  it("hides footer after cancel succeeds locally", () => {
    expect(
      shouldShowFooter(
        suppressHotelFooterActions({
          showPay: true,
          showCancel: true,
          smsAction: "sendCode",
        }),
      ),
    ).toBe(false);
  });
});
