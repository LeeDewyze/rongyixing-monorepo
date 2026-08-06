import { describe, expect, it } from "vitest";

import {
  enrichExchangePassengerContact,
  passengerBookInfoFromExchangeSnapshot,
} from "./train-exchange-passenger";

describe("enrichExchangePassengerContact", () => {
  it("keeps exchange passenger account id for policy matching", () => {
    const passenger = passengerBookInfoFromExchangeSnapshot({
      clientId: "cred-1",
      passenger: { Id: "p1", AccountId: "acc-1", Name: "孙雪" },
      credential: { Id: "cred-1", AccountId: "acc-1", Name: "孙雪" },
    });

    expect("AccountId" in passenger.passenger ? passenger.passenger.AccountId : undefined).toBe(
      "acc-1",
    );
    expect(passenger.credential.AccountId).toBe("acc-1");
  });

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
