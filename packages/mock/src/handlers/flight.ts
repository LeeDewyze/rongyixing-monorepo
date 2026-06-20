import type { IResponse } from "@ryx/shared-types";
import { FLIGHT_FLOW_METHODS, successResponse } from "@ryx/api";

import {
  createMockFlightList,
  MOCK_AIRPORTS,
} from "../fixtures/flight.js";

export function createFlightMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [FLIGHT_FLOW_METHODS.RESOURCE_AIRPORT]: () =>
      successResponse({ Trafficlines: MOCK_AIRPORTS }),
    [FLIGHT_FLOW_METHODS.HOME_INDEX]: (data) => {
      const params = data as {
        FromCode?: string;
        ToCode?: string;
        Date?: string;
      };
      return successResponse(createMockFlightList(params));
    },
    [FLIGHT_FLOW_METHODS.HOME_POLICY]: () =>
      successResponse({
        IsIllegal: false,
        Policies: ["符合差旅标准"],
      }),
  };
}
