import { describe, expect, it } from "vitest";

import { stripFlightOrderBookDto } from "./flight-book-adapter.js";

describe("stripFlightOrderBookDto", () => {
  it("strips heavy segment and cabin fields", () => {
    const dto = {
      Passengers: [
        {
          ClientId: "acc-1",
          FlightSegments: [
            {
              Id: "seg-1",
              Number: "KN5977",
              TakeoffTime: "2026-06-15T08:00:00",
              ArrivalTime: "2026-06-15T10:30:00",
              detailResultForVerify: { FlightFares: [] },
              flightListResult: { Result: {} },
            },
          ],
          FlightCabin: {
            Code: "Z",
            SalesPrice: "680",
            Variables: { Baggage: "20KG" },
            FlightFareBasics: [{ CabinCode: "Z", flightAndTaxFeesInfos: [{ fee: 1 }] }],
          },
          Policy: {
            FlightDescription: "desc",
            Setting: { x: 1 },
          },
        },
      ],
    };

    const stripped = stripFlightOrderBookDto(dto);
    const segment = stripped.Passengers[0]?.FlightSegments?.[0] as Record<string, unknown>;
    const cabin = stripped.Passengers[0]?.FlightCabin as Record<string, unknown>;
    const policy = stripped.Passengers[0]?.Policy as Record<string, unknown>;

    expect(segment.detailResultForVerify).toBeUndefined();
    expect(segment.flightListResult).toBeNull();
    expect(cabin.Variables).toBeNull();
    expect(cabin.FlightFareBasics?.[0]).not.toHaveProperty("flightAndTaxFeesInfos");
    expect(policy.FlightDescription).toBeNull();
    expect(policy.Setting).toBeNull();
  });
});
