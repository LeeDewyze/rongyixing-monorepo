import type { IResponse } from "@ryx/shared-types";
import { TMC_METHODS, successResponse } from "@ryx/api";

import { MOCK_WORKBENCH_LOAD } from "../fixtures/workbench.js";

export function createTmcMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [TMC_METHODS.WORKBENCH_LOAD]: () => successResponse(MOCK_WORKBENCH_LOAD),
    [TMC_METHODS.HOME_GETACCOUNTWAITINGTASKS]: () =>
      successResponse({ DataCount: 0 }),
  };
}
