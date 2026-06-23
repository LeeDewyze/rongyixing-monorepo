import type { IResponse } from "@ryx/shared-types";
import { BOOK_METHODS, FLIGHT_FLOW_METHODS, successResponse } from "@ryx/api";

import { createMockFlightDetail, createMockFlightList, MOCK_AIRPORTS } from "../fixtures/flight.js";
import { createMockOrderDetail } from "../fixtures/order.js";

export function createFlightMockHandlers(): Record<string, (data: unknown) => IResponse<unknown>> {
  return {
    [FLIGHT_FLOW_METHODS.RESOURCE_AIRPORT]: () =>
      successResponse({
        Trafficlines: MOCK_AIRPORTS,
        LastUpdateTime: Date.now(),
      }),
    [FLIGHT_FLOW_METHODS.HOME_INDEX]: (data) => {
      const params = data as {
        FromCode?: string;
        ToCode?: string;
        Date?: string;
      };
      return successResponse(createMockFlightList(params));
    },
    [FLIGHT_FLOW_METHODS.HOME_DETAIL]: (data) => {
      const params = data as {
        FlightNumber?: string;
        FromCode?: string;
        ToCode?: string;
        Date?: string;
      };
      return successResponse(createMockFlightDetail(params));
    },
    [FLIGHT_FLOW_METHODS.HOME_POLICY]: () =>
      successResponse({
        IsIllegal: false,
        Policies: ["符合差旅标准"],
      }),
    [BOOK_METHODS.FLIGHT_INITIALIZE]: (data) => {
      const params = data as { Passengers?: { FlightCabin?: { SalesPrice?: string }; ClientId?: string }[] };
      const unit = Number(params?.Passengers?.[0]?.FlightCabin?.SalesPrice ?? 680);
      const count = params?.Passengers?.length ?? 1;
      const clientId = params?.Passengers?.[0]?.ClientId ?? "acc-1";
      return successResponse({
        OrderAmount: unit * count,
        ServiceFees: { [clientId]: 10 },
        PayTypes: { "1": "公付", "2": "个付" },
        IllegalReasons: [],
        ExpenseTypes: [{ Id: "1", Name: "机票", Tag: "flight" }],
        Staffs: [
          {
            Account: { Id: clientId, Mobile: "13800138000", Email: "test@example.com" },
            Organization: { Code: "A001", Name: "技术部" },
            CostCenter: { Code: "CC", Name: "默认" },
          },
        ],
        Tmc: {
          IsShowServiceFee: true,
          IsDisplayNotifyLanguage: true,
          FlightHoldMinute: 20,
        },
      });
    },
    [BOOK_METHODS.FLIGHT_BOOK]: () => {
      const orderId = `FLT${Date.now()}`;
      const order = createMockOrderDetail(orderId);
      return successResponse({
        OrderId: orderId,
        OrderNumber: order.OrderNumber,
        TradeNo: orderId,
        HasTasks: false,
        IsCheckPay: false,
      });
    },
    [BOOK_METHODS.HOME_SEARCHLINKMAN]: (data) => {
      const params = data as { name?: string };
      const keyword = (params.name ?? "").trim();
      const items = [
        { Text: "李四", Value: "lisi@example.com|13900139000|acc-link-2" },
        { Text: "王五", Value: "wangwu@example.com|13700137000|acc-link-3" },
      ];
      if (!keyword) return successResponse(items);
      return successResponse(
        items.filter((item) => item.Text.includes(keyword) || keyword.includes(item.Text[0] ?? "")),
      );
    },
    [BOOK_METHODS.HOME_GETORGANIZATIONS]: () =>
      successResponse([
        { Id: "org-1", Code: "A001", Name: "技术部" },
        { Id: "org-2", Code: "A002", Name: "产品部", ParentId: "root" },
      ]),
    [BOOK_METHODS.HOME_GETCOSTCENTER]: (data) => {
      const params = data as { name?: string };
      const keyword = (params.name ?? "").trim();
      const items = [
        { Text: "CC-默认", Value: "CC" },
        { Text: "CC2-研发", Value: "CC2" },
      ];
      if (!keyword) return successResponse(items);
      return successResponse(items.filter((item) => item.Text.includes(keyword)));
    },
  };
}
