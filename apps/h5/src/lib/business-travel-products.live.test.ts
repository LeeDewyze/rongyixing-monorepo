import { describe, expect, it } from "vitest";

import { fetchLiveToken, liveProxyLogin, liveProxyRequest } from "./live-test-proxy";

type LiveResponse<T> = {
  Status?: boolean;
  Code?: string;
  Message?: string | null;
  Data?: T;
};

function flightCount(data: unknown): number {
  const payload = data as {
    FlightViews?: unknown[];
    Result?: { FlightSegments?: unknown[] };
  } | null;
  return payload?.FlightViews?.length ?? payload?.Result?.FlightSegments?.length ?? 0;
}

function hotelListCount(data: unknown): number {
  const payload = data as { HotelDayPrices?: unknown[]; Hotels?: unknown[] } | null;
  return payload?.HotelDayPrices?.length ?? payload?.Hotels?.length ?? 0;
}

describe("business travel products live (staging)", () => {
  it(
    "searches TMC flight, train and hotel products without tourist context",
    async () => {
      const token = await fetchLiveToken();
      const ticket = await liveProxyLogin(token, "business-products-live");
      const date = "2026-07-05";

      const flight = await liveProxyRequest<LiveResponse<unknown>>(
        token,
        "TmcApiFlightUrl-Home-Index",
        {
          Date: date,
          FromCode: "BJS",
          ToCode: "SHA",
          FromAsAirport: false,
          ToAsAirport: false,
        },
        { ticket, requestFields: { Version: "2.0", RequestTimeout: 60 } },
      );

      const train = await liveProxyRequest<LiveResponse<unknown[]>>(
        token,
        "TmcApiTrainUrl-Home-Search",
        {
          Date: date,
          FromStation: "BJP",
          ToStation: "SHH",
          FromName: "北京",
          ToName: "上海",
          TrainCode: "",
        },
        { ticket, requestFields: { Version: "1.0", RequestTimeout: 60 } },
      );

      const hotelKeyword = await liveProxyRequest<LiveResponse<unknown[]>>(
        token,
        "TmcApiHotelUrl-Home-SearchHotel",
        {
          PageIndex: 0,
          CityName: "北京",
          CityCode: "1101",
          Keyword: "北京商大春公寓",
        },
        { ticket },
      );

      const hotelList = await liveProxyRequest<LiveResponse<unknown>>(
        token,
        "TmcApiHotelUrl-Home-List",
        {
          PageIndex: 0,
          PageSize: 10,
          CityName: "北京",
          CityCode: "1101",
          BeginDate: date,
          EndDate: "2026-07-06",
        },
        { ticket },
      );

      console.log(
        "business products result:",
        JSON.stringify({
          flightCount: flightCount(flight.Data),
          trainCount: train.Data?.length ?? 0,
          hotelKeywordCount: hotelKeyword.Data?.length ?? 0,
          hotelListCount: hotelListCount(hotelList.Data),
        }),
      );

      expect(flight.Status).toBe(true);
      expect(flight.Code).toBe("Success");
      expect(flightCount(flight.Data)).toBeGreaterThan(0);

      expect(train.Status).toBe(true);
      expect(train.Code).toBe("Success");
      expect(train.Data?.length ?? 0).toBeGreaterThan(0);

      expect(hotelKeyword.Status).toBe(true);
      expect(hotelKeyword.Code).toBe("Success");
      expect(hotelKeyword.Data?.length ?? 0).toBeGreaterThan(0);

      expect(hotelList.Status).toBe(true);
      expect(hotelList.Code).toBe("Success");
      expect(hotelListCount(hotelList.Data)).toBeGreaterThan(0);
    },
    60_000,
  );
});
