import { describe, expect, it } from "vitest";

import { buildFlightExchangeListPath } from "./flight-exchange-session";

describe("buildFlightExchangeListPath", () => {
  it("keeps tourist channel through the exchange list route", () => {
    const href = buildFlightExchangeListPath(
      {
        TicketId: "21600000000391",
        Date: "2026-07-15T00:00:00",
        FromCode: "BJS",
        ToCode: "SHA",
        FromName: "北京",
        ToName: "上海",
        BookType: 2,
      },
      "tourist",
    );
    const params = new URLSearchParams(href.split("?")[1]);

    expect(params.get("exchange")).toBe("1");
    expect(params.get("ticketId")).toBe("21600000000391");
    expect(params.get("channel")).toBe("tourist");
  });
});
