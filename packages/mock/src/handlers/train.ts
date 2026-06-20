import type { IResponse } from "@ryx/shared-types";
import { TRAIN_FLOW_METHODS, successResponse } from "@ryx/api";

import { createMockTrainList, MOCK_TRAIN_STATIONS } from "../fixtures/train.js";

export function createTrainMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [TRAIN_FLOW_METHODS.RESOURCE_STATION]: () => successResponse(MOCK_TRAIN_STATIONS),
    [TRAIN_FLOW_METHODS.HOME_SEARCH]: (data) => {
      const params = data as {
        Date?: string;
        FromStation?: string;
        ToStation?: string;
      };
      const from = MOCK_TRAIN_STATIONS.find((s) => s.Code === params.FromStation);
      const to = MOCK_TRAIN_STATIONS.find((s) => s.Code === params.ToStation);
      return successResponse({
        Trains: createMockTrainList({
          Date: params.Date ?? new Date().toISOString().slice(0, 10),
          FromStation: params.FromStation ?? "BJP",
          ToStation: params.ToStation ?? "SHH",
          FromName: from?.Name,
          ToName: to?.Name,
        }),
      });
    },
  };
}
