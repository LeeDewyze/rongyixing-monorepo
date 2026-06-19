import type { GetTravelUrlResult, IResponse } from "@ryx/shared-types";
import { TRAVEL_FLOW_METHODS, successResponse } from "@ryx/api";

import {
  MOCK_STAFF,
  MOCK_TRAVEL_FORM_LIST,
  MOCK_TRAVEL_URL_RESULT,
} from "../fixtures/travel.js";

export function createTravelMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [TRAVEL_FLOW_METHODS.GET_TRAVEL_URL]: () =>
      successResponse(MOCK_TRAVEL_URL_RESULT satisfies GetTravelUrlResult),
    [TRAVEL_FLOW_METHODS.JYX_GET_TRAVEL_FORMS]: () =>
      successResponse(MOCK_TRAVEL_FORM_LIST),
    [TRAVEL_FLOW_METHODS.JYX_SAVE_TRAVEL_FORMS]: (data) => successResponse(data),
    [TRAVEL_FLOW_METHODS.TRAVEL_LIST]: () =>
      successResponse({ Travels: [], TotalCount: 0 }),
    [TRAVEL_FLOW_METHODS.STAFF_GET]: () => successResponse(MOCK_STAFF),
  };
}
