import { describe, expect, it } from "vitest";
import type { FlightPassengerBookSnapshot } from "@ryx/shared-types";

import { passengerBookInfoFromFlightExchangeSnapshot } from "./flight-exchange-passenger";

describe("passengerBookInfoFromFlightExchangeSnapshot", () => {
  it("keeps the passenger and credential identity returned by exchange initialize", () => {
    const passenger = passengerBookInfoFromFlightExchangeSnapshot({
      clientId: "flight-exchange-74690000000031",
      passenger: {
        Id: "PASSENGER-1",
        AccountId: "74690000000031",
        Name: "孙雪",
        Mobile: "18910943089",
        CredentialsType: 1,
        CredentialsTypeName: "身份证",
        Credentials: [],
      },
      credential: {
        Id: "CRED-1",
        AccountId: "74690000000031",
        Name: "孙雪",
        Mobile: "18910943089",
        Type: 1,
        TypeName: "身份证",
        CredentialsType: 1,
        CredentialsTypeName: "身份证",
        Number: "411521198811171528",
        HideNumber: "411521********1528",
      },
    } satisfies FlightPassengerBookSnapshot);

    expect(passenger.passenger.Id).toBe("PASSENGER-1");
    expect((passenger.passenger as { AccountId?: string }).AccountId).toBe("74690000000031");
    expect(passenger.credential.AccountId).toBe("74690000000031");
    expect(passenger.credential.Number).toBe("411521198811171528");
    expect(passenger.credential.HideNumber).toBe("411521********1528");
    expect(passenger.credential.Type).toBe(1);
    expect(passenger.credential.CredentialsType).toBe(1);
    expect(passenger.credential.TypeName).toBe("身份证");
    expect(passenger.id).toBe("flight-exchange-74690000000031");
  });
});
