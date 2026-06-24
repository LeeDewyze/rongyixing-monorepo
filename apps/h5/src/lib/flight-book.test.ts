import { describe, expect, it, vi } from "vitest";
import type { FlightDetailResult, FlightFare, FlightSegment, PassengerBookInfo } from "@ryx/shared-types";

import {
  buildPolicyRulesMap,
  prepareFlightCabinDto,
  serializeFlightsForPolicy,
} from "./flight-book-cabin";
import {
  buildFlightInitBookDto,
  buildFlightOrderBookDto,
  buildSubmitCredentials,
  resolveFlightBookBillBreakdown,
  resolveFlightBookDisplayAmount,
  resolveFlightBookOrderId,
  resolveFlightTicketNoticeRules,
} from "./flight-book";
import type { FlightBookSelection } from "./flight-book-session";

const segment: FlightSegment = {
  Id: "seg-1",
  Number: "KN5977",
  TakeoffTime: "2026-06-15T08:00:00",
  ArrivalTime: "2026-06-15T10:30:00",
};

const fare: FlightFare = {
  Code: "Z",
  Key: "fare-z",
  SalesPrice: "680",
  FlightFareRules: [{ Name: "退改", Description: "不可退" }],
};

const selection: FlightBookSelection = {
  flightId: "seg-1",
  cabinsQuery: {
    date: "2026-06-15",
    fromCode: "PEK",
    toCode: "SHA",
    fromName: "北京",
    toName: "上海",
    fromAsAirport: true,
    toAsAirport: true,
    flightNumber: "KN5977",
    fromAirport: "PEK",
    toAirport: "SHA",
    takeoffTime: "2026-06-15T08:00:00",
    arrivalTime: "2026-06-15T10:30:00",
    detailKey: "key-1",
    bookType: "1",
    airlineName: "联航",
    flyTimeName: "2h30m",
    fromAirportName: "首都",
    toAirportName: "虹桥",
    fromTerminal: "T2",
    toTerminal: "T2",
    planeTypeDescribe: "波音737",
    meal: "有餐",
    airlineSrc: "",
  },
  segment,
  fare,
  priceSnapshotAt: Date.now(),
  selectedAt: Date.now(),
};

const passengers: PassengerBookInfo[] = [
  {
    id: "c1",
    passenger: { Id: "p1", Name: "张三", AccountId: "acc-1", travelNumber: "TN001" },
    credential: {
      Id: "c1",
      Name: "张三",
      Mobile: "13800138000",
      Number: "110101199001011234",
      CredentialsType: 1,
    },
  },
];

describe("buildPolicyRulesMap", () => {
  it("maps each rule to a uuid key", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-1" });
    expect(buildPolicyRulesMap(["超标"])).toEqual({ "uuid-1": "超标" });
    vi.unstubAllGlobals();
  });
});

describe("prepareFlightCabinDto", () => {
  it("prefers flightPolicy cabin metadata but keeps full detail fare basics", () => {
    const cabin = prepareFlightCabinDto({
      flightPolicy: {
        Rules: ["超标"],
        Cabin: { Code: "Y", Key: "policy-y", SalesPrice: "999" },
      },
      fare,
      withPolicyRules: true,
    });
    expect(cabin.Code).toBe("Y");
    expect(cabin.Key).toBe("policy-y");
    expect(Object.values(cabin.Rules ?? {})[0]).toBe("超标");
  });

  it("clears Rules on book path (Legacy fillBookPassengers)", () => {
    const cabin = prepareFlightCabinDto({
      flightPolicy: {
        Rules: ["超标"],
        Cabin: { Code: "Y", Key: "policy-y", SalesPrice: "999" },
      },
      fare,
      withPolicyRules: false,
    });
    expect(cabin.Rules).toBeNull();
  });

  it("reconciles cabin key from detail snapshot on submit", () => {
    const detailSnapshot: FlightDetailResult = {
      FlightFares: [{ Key: "fare-z", Code: "Z", SalesPrice: "680", Tax: "50" }],
    };
    const cabin = prepareFlightCabinDto({
      flightPolicy: { Cabin: { Code: "Z", Key: "fare-z", SalesPrice: "680" } },
      fare,
      detailSnapshot,
      reconcileWithDetail: true,
    });
    expect(cabin.Key).toBe("fare-z");
    expect(cabin.Tax).toBe("50");
  });
});

describe("serializeFlightsForPolicy", () => {
  it("strips heavy list fields like legacy Home-Policy", () => {
    const json = serializeFlightsForPolicy({
      Result: {
        FlightSegments: [
          {
            ...segment,
            detailResult: { FlightFares: [] },
            Cabins: [{ Code: "Y", FlightFareBasics: [{ CabinCode: "Y", flightAndTaxFeesInfos: [{ x: 1 }] }] }],
          },
        ],
        FlightFares: [{ Code: "Y", FlightFareBasics: [{ CabinCode: "Y", flightAndTaxFeesInfos: [{ x: 1 }] }] }],
      },
    });
    const parsed = JSON.parse(json) as {
      FlightSegments: Array<Record<string, unknown>>;
      FlightFares: Array<{ FlightFareBasics?: Array<Record<string, unknown>> }>;
    };
    expect(parsed.FlightSegments[0]?.detailResult).toBeNull();
    expect(parsed.FlightSegments[0]?.transferSegments).toBeNull();
    expect(parsed.FlightFares[0]?.FlightFareBasics?.[0]?.flightAndTaxFeesInfos).toBeNull();
  });
});

describe("buildFlightInitBookDto", () => {
  it("builds minimal initialize payload without empty org/cost fields", () => {
    const dto = buildFlightInitBookDto({ selection, passengers });
    expect(dto.Passengers).toHaveLength(1);
    expect(dto.Passengers[0]?.ClientId).toBe("acc-1");
    expect(dto.Passengers[0]?.FlightSegments?.[0]?.Number).toBe("KN5977");
    expect(dto.Passengers[0]?.FlightCabin?.Code).toBe("Z");
    expect(dto.Passengers[0]?.CostCenterCode).toBeUndefined();
    expect(dto.Passengers[0]?.OrganizationName).toBeUndefined();
    expect(dto.Passengers[0]?.TravelPayType).toBeUndefined();
    expect(dto.Passengers[0]?.travelNumber).toBe("TN001");
    expect(dto.TravelPayType).toBeUndefined();
  });

  it("uses flightPolicy cabin and uuid rules on initialize", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-policy" });
    const dto = buildFlightInitBookDto({
      selection: {
        ...selection,
        detailSnapshot: {
          FlightFares: [
            {
              Id: "policy-fare-id",
              Key: "fare-y",
              Code: "Y",
              SalesPrice: "999",
              Tax: "50",
              FlightFareBasics: [{ CabinCode: "Y", Count: 4 }],
            },
          ],
          FlightSegments: [{ Id: "seg-detail", Number: "KN5977", FlightNumber: "KN5977" }],
        },
        flightPolicy: {
          Id: "policy-fare-id",
          Rules: ["超标"],
          Descriptions: ["提示"],
          Cabin: { Code: "Y", SalesPrice: "999" },
        },
      },
      passengers,
    });
    expect(dto.Passengers[0]?.FlightCabin?.Code).toBe("Y");
    expect(dto.Passengers[0]?.FlightCabin?.Tax).toBe("50");
    expect(dto.Passengers[0]?.FlightCabin?.FlightFareBasics?.[0]?.Count).toBe(4);
    expect(dto.Passengers[0]?.FlightCabin?.Rules).toEqual({ "uuid-policy": "超标" });
    expect(dto.Passengers[0]?.FlightSegments?.[0]?.Id).toBe("seg-detail");
    expect(dto.Passengers[0]?.FlightSegments?.[0]?.DetailKey).toBeUndefined();
    expect(dto.Passengers[0]?.FlightSegments?.[0]?.BookType).toBeUndefined();
    vi.unstubAllGlobals();
  });

  it("omits AgentId when not selected", () => {
    const dto = buildFlightInitBookDto({ selection, passengers, agentId: "" });
    expect(dto.AgentId).toBeUndefined();
  });
});

describe("buildFlightOrderBookDto", () => {
  it("builds passengers with segment and policy cabin", () => {
    const dto = buildFlightOrderBookDto({
      selection: {
        ...selection,
        flightPolicy: { Cabin: { Code: "Y", Key: "fare-y", SalesPrice: "700" } },
      },
      passengers,
    });
    expect(dto.Passengers).toHaveLength(1);
    expect(dto.Passengers[0]?.ClientId).toBe("acc-1");
    expect(dto.Passengers[0]?.FlightSegments?.[0]?.Number).toBe("KN5977");
    expect(dto.Passengers[0]?.FlightCabin?.Code).toBe("Y");
    expect(dto.Passengers[0]?.FlightCabin?.Rules).toBeNull();
    expect(dto.Passengers[0]?.TravelType).toBe(1);
    expect(dto.Passengers[0]?.InsuranceProducts).toEqual([]);
    expect(dto.Passengers[0]?.CostCenterCode).toBeUndefined();
  });

  it("sets travel pay type only on dto and zero on passengers", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      travelPayType: 2,
    });
    expect(dto.TravelPayType).toBe(2);
    expect(dto.Passengers[0]?.TravelPayType).toBe(0);
  });

  it("sets MessageLang on each passenger for Book API (Legacy combindInfo.notifyLanguage)", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers: [passengers[0]!, { ...passengers[0]!, id: "c2" }],
      messageLang: "en",
    });
    expect(dto.Passengers[0]?.MessageLang).toBe("en");
    expect(dto.Passengers[1]?.MessageLang).toBe("en");
  });

  it("allows empty MessageLang for 不发", () => {
    const dto = buildFlightOrderBookDto({ selection, passengers, messageLang: "" });
    expect(dto.Passengers[0]?.MessageLang).toBe("");
  });

  it("prefers other cost center fields over picker values on book", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      passengerForms: {
        c1: {
          passengerId: "c1",
          mobileOptions: [{ value: "13800138000", checked: true }],
          emailOptions: [],
          otherMobile: "",
          otherEmail: "",
          organization: { code: "", name: "" },
          otherOrganizationName: "",
          costCenter: { code: "CC-PICK", name: "Picker" },
          otherCostCenterName: "手填名称",
          otherCostCenterCode: "CC-MANUAL",
          expanded: false,
          showTravelDetail: false,
          expenseType: "",
          illegalReason: "",
          otherIllegalReason: "",
          selectedInsuranceId: "",
          outNumbers: {},
          approvalId: "",
          selectedApproverName: "",
          isSkipApprove: false,
        },
      },
    });
    expect(dto.Passengers[0]?.CostCenterCode).toBe("CC-MANUAL");
    expect(dto.Passengers[0]?.CostCenterName).toBe("手填名称");
  });

  it("uses picker cost center when other fields are empty", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      passengerForms: {
        c1: {
          passengerId: "c1",
          mobileOptions: [{ value: "13800138000", checked: true }],
          emailOptions: [],
          otherMobile: "",
          otherEmail: "",
          organization: { code: "", name: "" },
          otherOrganizationName: "",
          costCenter: { code: "CC-PICK", name: "Picker" },
          otherCostCenterName: "",
          otherCostCenterCode: "",
          expanded: false,
          showTravelDetail: false,
          expenseType: "",
          illegalReason: "",
          otherIllegalReason: "",
          selectedInsuranceId: "",
          outNumbers: {},
          approvalId: "",
          selectedApproverName: "",
          isSkipApprove: false,
        },
      },
    });
    expect(dto.Passengers[0]?.CostCenterCode).toBe("CC-PICK");
    expect(dto.Passengers[0]?.CostCenterName).toBe("Picker");
  });

  it("clears OrganizationCode when other department name is used", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      passengerForms: {
        c1: {
          passengerId: "c1",
          mobileOptions: [{ value: "13800138000", checked: true }],
          emailOptions: [],
          otherMobile: "",
          otherEmail: "",
          organization: { code: "ORG-1", name: "研发部" },
          otherOrganizationName: "临时部门",
          costCenter: { code: "", name: "" },
          otherCostCenterName: "",
          otherCostCenterCode: "",
          expanded: false,
          showTravelDetail: false,
          expenseType: "",
          illegalReason: "",
          otherIllegalReason: "",
          selectedInsuranceId: "",
          outNumbers: {},
          approvalId: "",
          selectedApproverName: "",
          isSkipApprove: false,
        },
      },
    });
    expect(dto.Passengers[0]?.OrganizationName).toBe("临时部门");
    expect(dto.Passengers[0]?.OrganizationCode).toBe("");
  });

  it("applies primary passenger travel form to all passengers on book", () => {
    const sharedForm = {
      passengerId: "c2",
      mobileOptions: [{ value: "13800138001", checked: true }],
      emailOptions: [],
      otherMobile: "",
      otherEmail: "",
      organization: { code: "", name: "" },
      otherOrganizationName: "",
      costCenter: { code: "", name: "" },
      otherCostCenterName: "",
      otherCostCenterCode: "",
      expanded: false,
      showTravelDetail: false,
      expenseType: "差旅费",
      illegalReason: "",
      otherIllegalReason: "",
      selectedInsuranceId: "",
      outNumbers: { TravelNumber: "TN-SHARED" },
      approvalId: "ap-1",
      selectedApproverName: "王五",
      isSkipApprove: false,
    };
    const dto = buildFlightOrderBookDto({
      selection,
      passengers: [passengers[0]!, { ...passengers[0]!, id: "c2" }],
      passengerForms: {
        c1: {
          ...sharedForm,
          passengerId: "c1",
          mobileOptions: [{ value: "13800138000", checked: true }],
          outNumbers: {},
          expenseType: "",
          approvalId: "",
        },
        c2: sharedForm,
      },
    });
    expect(dto.Passengers[0]?.OutNumbers).toEqual({ TravelNumber: "TN-SHARED" });
    expect(dto.Passengers[1]?.OutNumbers).toEqual({ TravelNumber: "TN-SHARED" });
    expect(dto.Passengers[0]?.ExpenseType).toBe("差旅费");
    expect(dto.Passengers[1]?.ExpenseType).toBe("差旅费");
    expect(dto.Passengers[0]?.ApprovalId).toBe("ap-1");
    expect(dto.Passengers[1]?.ApprovalId).toBe("ap-1");
  });

  it("adds channel on submit dto", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      channel: "客户H5",
    });
    expect(dto.Channel).toBe("客户H5");
  });

  it("sets offline flags from isSave like Legacy bookFlight(isSave)", () => {
    const normal = buildFlightOrderBookDto({ selection, passengers });
    expect(normal.IsFromOffline).toBe(false);
    expect(normal.IsForbidAutoIssue).toBe(false);

    const saved = buildFlightOrderBookDto({ selection, passengers, isSave: true });
    expect(saved.IsFromOffline).toBe(true);
    expect(saved.IsForbidAutoIssue).toBe(true);
  });

  it("uses authorized contacts as linkmans when provided", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      authorizedContacts: [
        {
          accountId: "acc-2",
          name: "李四",
          mobile: "13900139000",
          notifyLanguage: "cn",
        },
      ],
    });
    expect(dto.Linkmans).toEqual([
      {
        Id: "acc-2",
        Name: "李四",
        Mobile: "13900139000",
        Email: undefined,
        MessageLang: "cn",
      },
    ]);
  });

  it("merges travel number into out numbers", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      travelNumber: "TF-001",
    });
    expect(dto.Passengers[0]?.OutNumbers).toEqual({ TravelNumber: "TF-001" });
  });

  it("aligns legacy empty card/ticket fields and explicit illegal strings", () => {
    const dto = buildFlightOrderBookDto({ selection, passengers });
    const passenger = dto.Passengers[0];
    expect(passenger?.CardName).toBe("");
    expect(passenger?.CardNumber).toBe("");
    expect(passenger?.TicketNum).toBe("");
    expect(passenger?.Email).toBe("");
    expect(passenger?.IllegalPolicy).toBe("");
    expect(passenger?.IllegalReason).toBe("");
  });

  it("uses per-passenger policy cabin on book", () => {
    const dto = buildFlightOrderBookDto({
      selection: {
        ...selection,
        flightPolicy: { Cabin: { Code: "Y", Key: "fare-y", SalesPrice: "700" } },
        flightPoliciesByPassengerId: {
          c1: { Cabin: { Code: "Z", Key: "fare-z", SalesPrice: "680" } },
        },
      },
      passengers,
    });
    expect(dto.Passengers[0]?.FlightCabin?.Code).toBe("Z");
  });

  it("respects personal travel type from session", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      travelType: 2,
    });
    expect(dto.Passengers[0]?.TravelType).toBe(2);
  });
});

describe("buildSubmitCredentials", () => {
  it("spreads full credential with account and policy like legacy vmCredential", () => {
    const creds = buildSubmitCredentials(passengers[0]!, "acc-1");
    expect(creds.Id).toBe("c1");
    expect(creds.Name).toBe("张三");
    expect(creds.AccountId).toBe("acc-1");
    expect(creds.checked).toBe(true);
    expect(creds.CredentialsInfo).toBe("张三|110101199001011234");
  });
});

describe("resolveFlightTicketNoticeRules", () => {
  it("maps FlightRule entries to notice list", () => {
    expect(
      resolveFlightTicketNoticeRules({
        FlightRule: {
          机票预订须知: "https://example.com/booking",
        },
      }),
    ).toEqual([{ key: "机票预订须知", url: "https://example.com/booking" }]);
  });
});

describe("resolveFlightBookDisplayAmount", () => {
  it("includes ticket, tax lines and service fee per passenger", () => {
    const taxedFare: FlightFare = {
      ...fare,
      SalesPrice: "360",
      FlightFareBasics: [
        {
          FlightTaxs: [
            { Name: "机场建设费", Tax: 50 },
            { Name: "燃油费", Tax: 170 },
          ],
        },
      ],
    };
    const taxedSelection = { ...selection, fare: taxedFare };
    expect(
      resolveFlightBookDisplayAmount(taxedSelection, passengers, { "acc-1": 10 }),
    ).toBe(590);
  });

  it("multiplies base fare by passenger count", () => {
    expect(resolveFlightBookDisplayAmount(selection, passengers)).toBe(680);
    expect(
      resolveFlightBookDisplayAmount(selection, [passengers[0]!, passengers[0]!]),
    ).toBe(1360);
  });
});

describe("resolveFlightBookBillBreakdown", () => {
  it("builds per-passenger lines with route and taxes", () => {
    const taxedFare: FlightFare = {
      ...fare,
      SalesPrice: "360",
      FlightFareBasics: [
        {
          FlightTaxs: [
            { Name: "机场建设费", Tax: 50 },
            { Name: "燃油费", Tax: 170 },
          ],
        },
      ],
    };
    const taxedSelection: FlightBookSelection = {
      ...selection,
      segment: { ...segment, FromCityName: "北京", ToCityName: "上海" },
      fare: taxedFare,
    };
    const breakdown = resolveFlightBookBillBreakdown({
      selection: taxedSelection,
      passengers,
      serviceFees: { "acc-1": 10 },
    });
    expect(breakdown.passengers[0]).toMatchObject({
      passengerName: "张三",
      fromCity: "北京",
      toCity: "上海",
      ticketPrice: 360,
      flightRouteLabel: "KN5977北京--上海",
      serviceFee: 10,
      subtotal: 590,
    });
    expect(breakdown.passengers[0]?.taxLines).toHaveLength(2);
    expect(breakdown.total).toBe(590);
  });
});

describe("resolveFlightBookOrderId", () => {
  it("prefers TradeNo over OrderId", () => {
    expect(resolveFlightBookOrderId({ TradeNo: "T1", OrderId: "O1" })).toBe("T1");
  });

  it("falls back to OrderId", () => {
    expect(resolveFlightBookOrderId({ OrderId: "O1" })).toBe("O1");
  });
});
