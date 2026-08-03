import { describe, expect, it } from "vitest";
import type { FlightOrderTicket } from "@ryx/shared-types";

import { passengerBookInfoFromFlightTicket } from "./flight-exchange-passenger";

describe("passengerBookInfoFromFlightTicket", () => {
  it("uses traveler account id instead of ticket id for exchange passenger identity", () => {
    const passenger = passengerBookInfoFromFlightTicket({
      Id: "TICKET-1",
      Key: "k1",
      Trips: [],
      Traveler: {
        Id: "PASSENGER-1",
        AccountId: "21600000000391",
        Name: "孙雪",
        Mobile: "18910943089",
        CredentialTypeCode: 1,
        CredentialType: "身份证",
        CredentialNumber: "411521198811171528",
        CredentialHideNumber: "411521********1528",
      },
    } satisfies FlightOrderTicket);

    expect(passenger?.passenger.Id).toBe("21600000000391");
    expect((passenger?.passenger as { AccountId?: string } | undefined)?.AccountId).toBe(
      "21600000000391",
    );
    expect(passenger?.credential.AccountId).toBe("21600000000391");
    expect(passenger?.credential.Number).toBe("411521198811171528");
    expect(passenger?.credential.HideNumber).toBe("411521********1528");
    expect(passenger?.credential.Type).toBe(1);
    expect(passenger?.credential.CredentialsType).toBe(1);
    expect(passenger?.credential.TypeName).toBe("身份证");
    expect(passenger?.id).toBe("flight-exchange-21600000000391");
  });

  it("falls back to traveler id, never the flight ticket id", () => {
    const passenger = passengerBookInfoFromFlightTicket({
      Id: "21600000000391",
      Key: "24d4e5410e424f7aaa6b0463468558a4",
      Trips: [],
      Traveler: {
        Id: "21600000001121",
        Name: "孙雪",
        Mobile: "18910943089",
        CredentialNumber: "411521********1528",
      },
    } satisfies FlightOrderTicket);

    expect(passenger?.passenger.Id).toBe("21600000001121");
    expect(passenger?.credential.AccountId).toBe("21600000001121");
    expect(passenger?.id).toBe("flight-exchange-21600000001121");
  });

  it("returns null when ticket detail has no passenger identity", () => {
    const passenger = passengerBookInfoFromFlightTicket({
      Id: "21600000000391",
      Key: "24d4e5410e424f7aaa6b0463468558a4",
      Trips: [],
      Traveler: {
        Name: "孙雪",
      },
    } satisfies FlightOrderTicket);

    expect(passenger).toBeNull();
  });
});
