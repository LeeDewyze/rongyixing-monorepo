import { describe, expect, it } from "vitest";

import {
  enrichExchangePassengerContact,
  passengerBookInfoFromExchangeSnapshot,
} from "./train-exchange-passenger";

describe("enrichExchangePassengerContact", () => {
  it("fills missing mobile from exchange info", () => {
    const passenger = passengerBookInfoFromExchangeSnapshot({
      clientId: "p1",
      passenger: { Id: "p1", Name: "申晓杰" },
      credential: { Id: "p1", Name: "申晓杰" },
    });

    const enriched = enrichExchangePassengerContact(passenger, {
      PassengerMobile: "19528280621",
    });

    expect(enriched.credential.Mobile).toBe("19528280621");
  });
});
