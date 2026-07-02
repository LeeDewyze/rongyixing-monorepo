import { describe, expect, it } from "vitest";

import {
  buildTravelApplyBody,
  defaultTravelApplySegment,
  defaultTravelApplyTraveler,
  fetchTravelApplyMeta,
  submitTravelApply,
  type TravelApplyFormValues,
} from "./travel-apply";
import { fetchLiveToken, liveProxyLogin } from "./live-test-proxy";

describe("travel apply live (staging)", () => {
  it(
    "submits multi-traveler multi-segment form for T18610773065",
    async () => {
      const token = await fetchLiveToken();
      const ticket = await liveProxyLogin(token, "travel-apply-live");
      const meta = await fetchTravelApplyMeta(ticket);

      expect(meta.staffOptions.length).toBeGreaterThan(0);
      expect(meta.cities.length).toBeGreaterThan(0);

      const secondStaff =
        meta.staffOptions.find((item) => item.value !== meta.defaultAccount.value) ??
        meta.staffOptions[1] ??
        meta.defaultAccount;

      const segmentA = defaultTravelApplySegment(meta.cities);
      const segmentB = {
        ...defaultTravelApplySegment(meta.cities),
        fromCity: segmentA.toCity,
        toCity: meta.cities.find((city) => city.value !== segmentA.toCity.value) ?? segmentA.fromCity,
      };

      const values: TravelApplyFormValues = {
        travelTypes: [meta.travelTypes[0]?.value ?? "国内机票"],
        reason: `H5多人多行程联调-${Date.now()}`,
        travelers: [
          defaultTravelApplyTraveler(meta.defaultAccount),
          { account: secondStaff },
        ],
        segments: [segmentA, segmentB],
      };

      const body = buildTravelApplyBody(meta, values);
      expect(body.get("FormDetails[6].SlaveRow")).toBe("0");
      expect(body.get("FormDetails[8].SlaveRow")).toBe("1");
      expect(body.get("FormTimes[2].SlaveRow")).toBe("1");

      const result = await submitTravelApply(meta, values);
      console.log("submit result:", JSON.stringify(result));

      expect(result.Status).toBe(true);
      expect(result.Data?.Id).toBeTruthy();
    },
    60_000,
  );
});
