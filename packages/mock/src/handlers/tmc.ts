import type { IResponse } from "@ryx/shared-types";
import { TMC_METHODS, successResponse } from "@ryx/api";

import { MOCK_HOME_BANNERS } from "../fixtures/home-banners.js";
import { MOCK_WORKBENCH_LOAD } from "../fixtures/workbench.js";

export function createTmcMockHandlers(): Record<string, (data: unknown) => IResponse<unknown>> {
  return {
    [TMC_METHODS.WORKBENCH_LOAD]: () => successResponse(MOCK_WORKBENCH_LOAD),
    [TMC_METHODS.BANNER_LIST]: () => successResponse(MOCK_HOME_BANNERS),
    [TMC_METHODS.NOTICE_LIST]: () =>
      successResponse([
        {
          Id: 40000000003,
          Title: "123",
          InsertTime: "2022-08-19T17:49:37",
          Url: "",
        },
        {
          Id: 40000000005,
          Title: "火车票改签优化",
          InsertTime: "2025-05-06T09:43:26",
          Url: "",
        },
      ]),
    [TMC_METHODS.NOTICE_DETAIL]: (data) => {
      const params = data as { NoticeId?: string | number };
      const id = params?.NoticeId ?? 40000000003;
      return successResponse({
        Id: id,
        Title: id === 40000000005 ? "火车票改签优化" : "123",
        InsertTime: "2025-05-06T09:43:26",
        Url: "",
      });
    },
    [TMC_METHODS.HOME_GETACCOUNTWAITINGTASKS]: () => successResponse({ DataCount: 0 }),
    [TMC_METHODS.TMC_GETTMCDATA]: () => successResponse({ Telephone: "400-000-0000" }),
  };
}
