import { describe, expect, it } from "vitest";

import {
  fetchLiveToken,
  liveProxyLogin,
  liveProxyRequest,
  LIVE_TEST_APP_ID,
} from "./live-test-proxy";

describe("private travel train live (staging)", () => {
  it(
    "searches tourist train list with TouristTmcId/TouristMmsId",
    async () => {
      const token = await fetchLiveToken();
      const ticket = await liveProxyLogin(token, "private-train-live");

      const tourist = await liveProxyRequest<{
        Status?: boolean;
        Data?: { TouristTmcId?: string | number; TouristMmsId?: string | number };
      }>(token, "TmcApiHomeUrl-Home-Tourist", { AppId: LIVE_TEST_APP_ID }, { ticket });
      const touristTmcId = tourist.Data?.TouristTmcId;
      const touristMmsId = tourist.Data?.TouristMmsId;
      expect(tourist.Status).toBe(true);
      expect(touristTmcId).toBeTruthy();
      expect(touristMmsId).toBeTruthy();

      const trainResult = await liveProxyRequest<{
        Status?: boolean;
        Code?: string;
        Message?: string;
        Data?: unknown[];
      }>(
        token,
        "TmcTouristTrainUrl-Home-Search",
        {
          Date: "2026-07-05",
          FromStation: "BJP",
          ToStation: "SHH",
          FromName: "北京",
          ToName: "上海",
          TrainCode: "",
          TmcId: touristTmcId,
        },
        {
          ticket,
          requestFields: {
            TmcId: touristTmcId!,
            MmsId: touristMmsId!,
            Version: "1.0",
            RequestTimeout: 60,
          },
        },
      );

      console.log(
        "private train search result:",
        JSON.stringify({
          Status: trainResult.Status,
          Code: trainResult.Code,
          Count: trainResult.Data?.length ?? 0,
        }),
      );

      expect(trainResult.Status).toBe(true);
      expect(trainResult.Code).toBe("Success");
      expect(trainResult.Data?.length ?? 0).toBeGreaterThan(0);
    },
    60_000,
  );
});
