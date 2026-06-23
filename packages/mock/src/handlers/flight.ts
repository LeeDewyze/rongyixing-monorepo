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
      const params = data as { Passengers?: { FlightCabin?: { SalesPrice?: string } }[] };
      const unit = Number(params?.Passengers?.[0]?.FlightCabin?.SalesPrice ?? 680);
      const count = params?.Passengers?.length ?? 1;
      return successResponse({
        OrderAmount: unit * count,
        ServiceFees: {},
        IllegalReasons: [],
        ExpenseTypes: [{ Id: "1", Name: "机票", Tag: "flight" }],
        Staffs: [],
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
  };
}
