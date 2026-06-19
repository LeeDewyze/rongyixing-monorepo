import type { IResponse } from "@ryx/shared-types";
import { MEMBER_FLOW_METHODS, successResponse } from "@ryx/api";

import {
  MOCK_MEMBER_PROFILE,
  MOCK_PASSENGER_LIST,
  MOCK_PASSENGERS,
} from "../fixtures/member.js";

export function createMemberMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [MEMBER_FLOW_METHODS.MEMBER_GET]: () => successResponse(MOCK_MEMBER_PROFILE),
    [MEMBER_FLOW_METHODS.PASSENGER_LIST]: () =>
      successResponse(MOCK_PASSENGER_LIST),
    [MEMBER_FLOW_METHODS.PASSENGER_ADD]: (data) => {
      const params = data as { Name?: string };
      return successResponse({
        Id: `P${Date.now()}`,
        Name: params?.Name ?? "新入住人",
        ...params,
      });
    },
    [MEMBER_FLOW_METHODS.PASSENGER_MODIFY]: (data) => successResponse(data),
    [MEMBER_FLOW_METHODS.PASSENGER_REMOVE]: () => successResponse(true),
  };
}

export { MOCK_PASSENGERS };
