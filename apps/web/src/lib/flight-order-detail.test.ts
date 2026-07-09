import { describe, expect, it } from "vitest";

import {
  shouldShowFlightFooter,
  suppressFlightFooterActions,
  suppressFlightTicketActions,
} from "@/lib/flight-order-detail";

describe("flight order local action suppression", () => {
  it("hides footer after cancel succeeds locally", () => {
    const actions = { showPay: true, showCancel: true, smsAction: "none" as const };
    const ticket = { Id: "T1", Key: "k1", Trips: [], Actions: { showRefund: true } };

    expect(
      shouldShowFlightFooter(
        suppressFlightFooterActions(actions),
        120,
        suppressFlightTicketActions(ticket),
      ),
    ).toBe(false);
  });
});
