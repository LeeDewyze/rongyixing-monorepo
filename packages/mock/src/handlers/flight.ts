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
      successResponse([
        {
          PassengerKey: "acc-1",
          FlightPolicies: [
            {
              Id: "fare-1",
              FlightNo: "KN5977",
              Rules: ["超出经济舱标准"],
              Descriptions: ["建议选择更低价格舱位"],
              color: "warning",
              IsAllowBook: true,
            },
          ],
        },
      ]),
    [BOOK_METHODS.FLIGHT_INITIALIZE]: (data) => {
      const params = data as { Passengers?: { FlightCabin?: { SalesPrice?: string }; ClientId?: string }[] };
      const unit = Number(params?.Passengers?.[0]?.FlightCabin?.SalesPrice ?? 680);
      const count = params?.Passengers?.length ?? 1;
      const clientId = params?.Passengers?.[0]?.ClientId ?? "acc-1";
      return successResponse({
        OrderAmount: unit * count,
        ServiceFees: { [clientId]: 10 },
        PayTypes: { "1": "公付", "2": "个付" },
        IllegalReasons: ["陪同领导", "临时出差"],
        ExpenseTypes: [{ Id: "1", Name: "机票", Tag: "flight" }],
        Insurances: {
          [clientId]: [
            {
              Id: "ins-1",
              Name: "航空意外险",
              Price: "30",
              Detail: "最高保额 100 万\n承保飞行期间意外身故/伤残",
              DetailUrl: "https://example.com/insurance/flight-accident",
            },
            { Id: "ins-2", Name: "综合出行险", Price: "50", Detail: "含延误保障" },
          ],
        },
        Staffs: [
          {
            Account: { Id: clientId, Mobile: "13800138000", Email: "test@example.com" },
            Organization: { Code: "A001", Name: "技术部" },
            CostCenter: { Code: "CC", Name: "默认" },
            Number: "10001",
            OutNumber: "S123456",
            Approvers: [{ Name: "王审批", Type: 1, Tag: "1" }],
          },
        ],
        OutNumbers: {
          TravelNumber: ["TR2026001"],
        },
        TmcServices: [
          { Id: "agent-1", Name: "默认服务商" },
          { Id: "agent-2", Name: "备用服务商" },
        ],
        isSkipApprove: false,
        Tmc: {
          IsShowServiceFee: true,
          IsDisplayNotifyLanguage: true,
          FlightHoldMinute: 20,
          FlightHasInsurance: true,
          MandatoryBuyInsurance: true,
          IsNeedIllegalReason: true,
          FlightApprovalType: 4,
          OutNumberNameArray: ["TravelNumber", "StaffNumber"],
          OutNumberRequiryNameArray: ["TravelNumber"],
          GetTravelUrl: true,
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
        IsCheckPay: true,
      });
    },
    [BOOK_METHODS.HOME_CHECKPAY]: () => successResponse(true),
    [BOOK_METHODS.HOME_SEARCHAPPROVALS]: (data) => {
      const params = data as { name?: string };
      const keyword = (params.name ?? "").trim();
      const items = [
        { Text: "王审批|wang@example.com|10001", Value: "acc-approver-1" },
        { Text: "李审批|li@example.com|10002", Value: "acc-approver-2" },
      ];
      if (!keyword) return successResponse(items);
      return successResponse(items.filter((item) => item.Text.includes(keyword)));
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
