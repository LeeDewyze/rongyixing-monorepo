import type { IResponse } from "@ryx/shared-types";
import { PASSENGER_FLOW_METHODS, successResponse } from "@ryx/api";

import { MOCK_PASSENGER_LIST, MOCK_PASSENGERS } from "../fixtures/member.js";
import { filterMockStaff } from "../fixtures/passenger.js";

export function createPassengerMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [PASSENGER_FLOW_METHODS.STAFF_LIST]: (data) => {
      const params = data as {
        Name?: string;
        Mobile?: string;
        PageIndex?: number;
        PageSize?: number;
      };
      const keyword = params.Name ?? params.Mobile ?? "";
      const pageIndex = params.PageIndex ?? 0;
      const pageSize = params.PageSize ?? 20;
      return successResponse(filterMockStaff(keyword, pageIndex, pageSize));
    },
    [PASSENGER_FLOW_METHODS.PASSENGER_LIST]: (data) => {
      const params = data as { Name?: string; PageIndex?: number; PageSize?: number };
      const keyword = (params.Name ?? "").trim().toLowerCase();
      let passengers = MOCK_PASSENGERS;
      if (keyword) {
        passengers = passengers.filter(
          (p) =>
            p.Name.toLowerCase().includes(keyword) ||
            (p.Mobile ?? "").includes(keyword),
        );
      }
      const pageIndex = params.PageIndex ?? 0;
      const pageSize = params.PageSize ?? 20;
      const start = pageIndex * pageSize;
      const slice = passengers.slice(start, start + pageSize);
      return successResponse({
        Passengers: slice,
        TotalCount: passengers.length,
      });
    },
    [PASSENGER_FLOW_METHODS.PASSENGER_ADD]: (data) => {
      const body = data as Record<string, unknown>;
      return successResponse({
        ...body,
        Id: `P${Date.now()}`,
      });
    },
    [PASSENGER_FLOW_METHODS.PASSENGER_MODIFY]: (data) => successResponse(data),
    [PASSENGER_FLOW_METHODS.PASSENGER_REMOVE]: () => successResponse(true),
  };
}

export { MOCK_STAFF } from "../fixtures/passenger.js";
