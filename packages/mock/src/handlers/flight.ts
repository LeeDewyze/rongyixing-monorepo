import type { IResponse } from "@ryx/shared-types";
import { successResponse, TMC_METHODS } from "@ryx/api";

import { MOCK_DOMESTIC_AIRPORTS } from "../fixtures/flight.js";

export function createFlightMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [TMC_METHODS.RESOURCE_AIRPORT]: () =>
      successResponse({
        Trafficlines: MOCK_DOMESTIC_AIRPORTS,
        LastUpdateTime: Date.now(),
      }),
  };
}
