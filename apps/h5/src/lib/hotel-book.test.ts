import { describe, expect, it } from "vitest";
import type { HotelRoom, HotelRoomPlan, PassengerBookInfo } from "@ryx/shared-types";

import type { HotelBookSelection } from "@/lib/hotel-book-session";
import {
  HOTEL_PAYMENT_PREPAY,
  HOTEL_PAYMENT_SELF_PAY,
  HOTEL_WARM_REMINDER_BOOKING_DEFAULT,
  buildHotelInitBookDto,
  buildHotelInitRoomPlan,
  buildHotelOrderBookDto,
  prepareHotelBookSubmitDto,
  buildHotelWarmReminderParagraphs,
  buildHotelWarmReminderSections,
  buildHotelPassengerOutNumberFieldsMap,
  resolveHotelRoomPlanRulesDesc,
  calcHotelNights,
  createEmptyHotelCreditCardForm,
  createHotelPassengerBookForm,
  findHotelInitStaff,
  mergeHotelInitStaffIntoForm,
  resolveHotelArrivalTimeOptions,
  resolveHotelShowCreditCard,
  validateHotelBookForms,
} from "@/lib/hotel-book";

const room: HotelRoom = {
  RoomId: "R001",
  RoomName: "大床房",
  Plans: [],
};

const plan: HotelRoomPlan = {
  PlanId: "P001",
  LegacyId: "10001",
  PlanName: "含早",
  Price: 398,
  TotalAmount: 398,
  Number: "N1",
  SupplierNumber: "SUP-1",
  SupplierType: 1,
  BeginDate: "2026-06-20",
  EndDate: "2026-06-21",
  PaymentType: HOTEL_PAYMENT_PREPAY,
  Breakfast: "含早",
  VariablesObj: {
    ArrivalTime: ["2026-06-20 14:00", "2026-06-20 18:00"],
    RoomRateRule: "不可取消",
  },
  RoomPlanPrices: [{ Date: "2026-06-20", Price: 398 }],
};

const selection: HotelBookSelection = {
  hotelId: "H10001",
  hotelName: "测试酒店",
  checkIn: "2026-06-20",
  checkOut: "2026-06-21",
  cityCode: "010",
  room,
  plan,
  selectedAt: Date.now(),
};

const passengers: PassengerBookInfo[] = [
  {
    id: "p1",
    passenger: {
      Id: "staff1",
      AccountId: "acc1",
      Name: "张三",
      Mobile: "13800000000",
    },
    credential: {
      Id: "cred1",
      AccountId: "acc1",
      Name: "张三",
      Mobile: "13800000000",
      Number: "410928199001015121",
      Type: 1,
    },
  },
];

describe("buildHotelInitRoomPlan", () => {
  it("maps legacy room plan fields from session snapshot", () => {
    const dto = buildHotelInitRoomPlan(plan, room);
    expect(dto.Id).toBe("10001");
    expect(dto.Name).toBe("含早");
    expect(dto.TotalAmount).toBe(398);
    expect(dto.SupplierNumber).toBe("SUP-1");
    expect(dto.BeginDate).toBe("2026-06-20T00:00:00");
    expect(dto.Room?.Id).toBe("R001");
    expect(dto.Room?.Name).toBe("大床房");
    expect(dto.IsPrepay).toBe(true);
    expect(dto.Variables).toContain("ArrivalTime");
    expect(dto.RoomPlanPrices).toHaveLength(1);
  });

  it("embeds hotel metadata when selection is provided", () => {
    const dto = buildHotelInitRoomPlan(plan, room, {
      ...selection,
      hotelAddress: "测试地址",
      hotelPhone: "010-12345678",
    });
    expect(dto.Room?.Hotel).toMatchObject({
      Id: "H10001",
      Name: "测试酒店",
      Address: "测试地址",
      Phone: "010-12345678",
      CityCode: "010",
    });
  });

  it("uses legacy wire snapshot when LegacyWire is present", () => {
    const legacyPlan: HotelRoomPlan = {
      ...plan,
      LegacyWire: {
        Id: "0",
        Name: "含早（预付）",
        TotalAmount: 398,
        SupplierNumber: "RM_TEST_SUPPLIER_KEY",
        SupplierType: "Dttrip",
        BookCode: "book-code",
        BookType: 13,
        Key: "legacy-key",
        Variables: JSON.stringify(plan.VariablesObj),
        RoomPlanRules: [{ Description: "不可取消", Type: 300 }],
        RoomPlanPrices: [{ Date: "2026-06-20T00:00:00", Price: 398, Breakfast: 2 }],
      },
    };
    const dto = buildHotelInitRoomPlan(legacyPlan, room, selection);
    expect(dto.Id).toBe("0");
    expect(dto.SupplierNumber).toBe("RM_TEST_SUPPLIER_KEY");
    expect(dto.Key).toBe("legacy-key");
    expect(dto.RoomPlanRules?.[0]).toMatchObject({ Type: 300 });
  });
});

describe("buildHotelInitBookDto", () => {
  it("builds initialize payload with client id and room plan", () => {
    const dto = buildHotelInitBookDto({ selection, passengers });
    expect(dto.Passengers).toHaveLength(1);
    expect(dto.Passengers[0]?.ClientId).toBe("acc1");
    expect(dto.Passengers[0]?.RoomPlan.Name).toBe("含早");
    expect(dto.Passengers[0]?.OrderHotelType).toBe(1);
  });

  it("includes AgentId when provided", () => {
    const dto = buildHotelInitBookDto({ selection, passengers, agentId: "agent1" });
    expect(dto.AgentId).toBe("agent1");
  });

  it("omits travel form fields in personal mode", () => {
    const dto = buildHotelInitBookDto({
      selection,
      passengers,
      travelFormId: "tf-001",
      travelMode: "personal",
    });
    expect(dto.TravelFormId).toBeUndefined();
    expect(dto.Passengers[0]?.travelFormId).toBeUndefined();
    expect(dto.Passengers[0]?.travelNumber).toBeUndefined();
  });
});

describe("buildHotelOrderBookDto", () => {
  it("fills submit fields from forms and contacts", () => {
    const forms = {
      p1: {
        ...createHotelPassengerBookForm(passengers[0]!, "2026-06-20 14:00"),
        illegalReason: "出差紧急",
        expenseTypeId: "1",
        approvalId: "ap1",
        approvalName: "审批人甲",
      },
    };

    const dto = buildHotelOrderBookDto({
      selection,
      passengers,
      forms,
      travelPayType: 1,
      globalArrivalTime: "2026-06-20 14:00",
      globalNotifyLanguage: "cn",
      creditCard: {
        ...createEmptyHotelCreditCardForm(),
        cardNumber: "4111111111111111",
        holderName: "张三",
        expireDate: "12/28",
        cvv: "123",
      },
      authorizedContacts: [
        {
          accountId: "link1",
          name: "李四",
          mobile: "13900000000",
          email: "a@b.com",
          notifyLanguage: "cn",
        },
      ],
    });

    const passenger = dto.Passengers[0];
    expect(passenger?.CheckinTime).toBe("2026-06-20 14:00");
    expect(passenger?.IllegalReason).toBe("出差紧急");
    expect(passenger?.ExpenseType).toBe("1");
    expect(passenger?.ApprovalId).toBe("ap1");
    expect(passenger?.OrderCard?.CardNumber).toBe("4111111111111111");
    expect(dto.Linkmans).toHaveLength(1);
    expect(dto.Channel).toBe("客户H5");
    expect(dto.TravelPayType).toBe(1);
    expect(passenger?.CustomerName).toBe("张三");
    expect(passenger?.TravelType).toBeDefined();
  });

  it("coerces ApprovalId to number via prepareHotelBookSubmitDto", () => {
    const forms = {
      p1: {
        ...createHotelPassengerBookForm(passengers[0]!, "2026-06-20 14:00"),
        approvalId: "ap1",
      },
    };

    const prepared = prepareHotelBookSubmitDto(
      buildHotelOrderBookDto({
        selection,
        passengers,
        forms,
        travelPayType: 1,
        globalArrivalTime: "2026-06-20 14:00",
      }),
    );

    expect(prepared.Passengers[0]?.ApprovalId).toBe("ap1");
  });

  it("coerces numeric ApprovalId to number", () => {
    const forms = {
      p1: {
        ...createHotelPassengerBookForm(passengers[0]!, "2026-06-20 14:00"),
        approvalId: "12345",
      },
    };

    const prepared = prepareHotelBookSubmitDto(
      buildHotelOrderBookDto({
        selection,
        passengers,
        forms,
        travelPayType: 1,
        globalArrivalTime: "2026-06-20 14:00",
      }),
    );

    expect(prepared.Passengers[0]?.ApprovalId).toBe(12345);
  });

  it("reuses RoomPlan from initDto on book submit", () => {
    const initDto = buildHotelInitBookDto({ selection, passengers });
    const initRoomPlan = initDto.Passengers[0]?.RoomPlan;
    const forms = {
      p1: createHotelPassengerBookForm(passengers[0]!, "2026-06-20 14:00"),
    };

    const bookDto = buildHotelOrderBookDto({
      selection,
      passengers,
      forms,
      travelPayType: 1,
      globalArrivalTime: "2026-06-20 14:00",
      initDto,
    });

    expect(bookDto.Passengers[0]?.RoomPlan).toEqual(initRoomPlan);
  });

  it("omits travel form fields in personal mode", () => {
    const forms = {
      p1: {
        ...createHotelPassengerBookForm(passengers[0]!, "2026-06-20 14:00"),
        outNumbers: { TravelNumber: "TR-001" },
      },
    };

    const dto = buildHotelOrderBookDto({
      selection,
      passengers,
      forms,
      travelFormId: "tf-001",
      travelMode: "personal",
    });

    expect(dto.TravelFormId).toBeUndefined();
    expect(dto.Passengers[0]?.travelFormId).toBeUndefined();
    expect(dto.Passengers[0]?.travelNumber).toBeUndefined();
    expect(dto.Passengers[0]?.OutNumbers).toBeNull();
    expect(dto.Passengers[0]?.TravelType).toBe(2);
  });

  it("strips business fields and restores legacy tourist hotel book payload", () => {
    const forms = {
      p1: {
        ...createHotelPassengerBookForm(passengers[0]!, "2026-06-20 14:00"),
        approvalId: "approval-1",
        illegalReason: "超标",
        expenseTypeId: "expense-1",
        costCenter: { code: "CC", name: "成本中心" },
        organization: { code: "ORG", name: "组织" },
        outNumbers: { TravelNumber: "TN-001" },
      },
    };
    const initDto = buildHotelInitBookDto({
      selection,
      passengers,
      travelMode: "personal",
      channel: "tourist",
    });
    const roomPlan = initDto.Passengers[0]!.RoomPlan;
    roomPlan.VariablesObj = {
      ...(roomPlan.VariablesObj ?? {}),
      RoomPlanUniqueId: "room-plan-key",
      IsSelfPayAmount: true,
    };
    roomPlan.Variables = JSON.stringify(roomPlan.VariablesObj);

    const prepared = prepareHotelBookSubmitDto(
      buildHotelOrderBookDto({
        selection,
        passengers,
        forms,
        travelMode: "personal",
        channel: "tourist",
        travelPayType: 2,
        globalArrivalTime: "2026-06-20 14:00",
        initDto,
        init: {
          RoomPlans: [
            {
              PassengerClientId: "acc1",
              GuaranteeStartTime: "9999-12-31 23:59",
              GuaranteeEndTime: "9999-12-31 23:59",
            },
          ],
        },
      }),
    );

    const passenger = prepared.Passengers[0]!;
    const variables = JSON.parse(passenger.RoomPlan.Variables ?? "{}") as Record<string, unknown>;

    expect(prepared).toMatchObject({
      channel: "tourist",
      Channel: "客户H5",
      IsFromOffline: false,
    });
    expect(prepared.TravelFormId).toBeUndefined();
    expect(prepared.TravelPayType).toBeUndefined();
    expect(prepared.Linkmans).toBeUndefined();
    expect(passenger.ClientId).toBeUndefined();
    expect(passenger.RoomCount).toBe(1);
    expect(passenger.CheckinTime).toBe("2026-06-20 14:00");
    expect(passenger.CustomerName).toBe("张三");
    expect(passenger.CustomerCredentials).toBe("410928199001015121");
    expect(passenger.CustomerCredentialsType).toBe("1");
    expect(passenger.Credentials).toEqual({
      Name: "张三",
      Number: "410928199001015121",
      Type: 1,
    });
    expect(passenger.TravelPayType).toBeUndefined();
    expect(passenger.TravelType).toBeUndefined();
    expect(passenger.ApprovalId).toBeUndefined();
    expect(passenger.CostCenterCode).toBeUndefined();
    expect(passenger.OrganizationCode).toBeUndefined();
    expect(passenger.OutNumbers).toBeUndefined();
    expect(variables.IsSelfPayAmount).toBe(false);
    expect(variables.GuaranteeStartTime).toBe("9999-12-31 23:59");
    expect(variables.GuaranteeEndTime).toBe("9999-12-31 23:59");
    expect(passenger.RoomPlan.VariablesObj?.IsSelfPayAmount).toBe(false);
    expect(passenger.RoomPlan.SupplierNumber).toBe("SUP-1");
  });
});

describe("resolveHotelArrivalTimeOptions", () => {
  it("generates 30-minute slots from 14:00 to next-day 06:00", () => {
    const options = resolveHotelArrivalTimeOptions(selection, "2026-06-26");
    expect(options[0]).toBe("2026-06-26 14:00");
    expect(options).toContain("2026-06-26 23:30");
    expect(options).toContain("2026-06-27 00:00");
    expect(options.at(-1)).toBe("2026-06-27 06:00");
  });
});

describe("resolveHotelShowCreditCard", () => {
  it("shows for self-pay late arrival", () => {
    const selfPaySelection = {
      ...selection,
      plan: { ...plan, PaymentType: HOTEL_PAYMENT_SELF_PAY },
    };
    expect(resolveHotelShowCreditCard(selfPaySelection, "2026-06-20 18:00")).toBe(true);
    expect(resolveHotelShowCreditCard(selfPaySelection, "2026-06-20 14:00")).toBe(false);
  });
});

describe("buildHotelPassengerOutNumberFieldsMap", () => {
  const selfBookPassenger: PassengerBookInfo = {
    id: "p-sun",
    passenger: { Id: "370000000267", AccountId: "68050000000037", Name: "孙雪" },
    credential: {
      Id: "cred-sun",
      AccountId: "68050000000037",
      Name: "孙雪",
      Number: "411521198811171528",
      Type: 1,
    },
  };
  const initStaff = {
    Id: "370000000267",
    Name: "孙雪",
    Number: "113",
    OutNumber: "",
    Account: { Id: 68050000000037, Mobile: "18910943089" },
  };

  it("builds a selectable required TravelNumber from Initialize Tmc", () => {
    const fields = buildHotelPassengerOutNumberFieldsMap({
      passengers: [selfBookPassenger],
      staffs: [initStaff],
      travelMode: "business",
      init: {
        Tmc: {
          OutNumberNameArray: ["TravelNumber"],
          OutNumberRequiryNameArray: ["TravelNumber"],
          GetTravelUrl:
            "PresentationTmcApiForwardUrl/TravelForm/GetTravelForms?tmcid=10365&IsShowBeforeApproval=true",
        },
      },
    });
    const field = fields["p-sun"]?.[0];
    expect(field?.key).toBe("TravelNumber");
    expect(field?.required).toBe(true);
    expect(field?.canSelect).toBe(true);
    expect(field?.staffNumber).toBe("113");
    expect(field?.travelType).toBe("Hotel");
  });

  it("prefills TravelNumber from Initialize.TravelFrom", () => {
    const fields = buildHotelPassengerOutNumberFieldsMap({
      passengers: [selfBookPassenger],
      staffs: [initStaff],
      travelMode: "business",
      init: {
        TravelFrom: { TravelNumber: "Travel202608141132303157173" },
        Tmc: {
          OutNumberNameArray: ["TravelNumber"],
          GetTravelUrl: "https://example.com/travel",
        },
      },
    });
    const field = fields["p-sun"]?.[0];
    expect(field?.value).toBe("Travel202608141132303157173");
    expect(field?.canSelect).toBe(false);
  });
});

describe("createHotelPassengerBookForm contacts", () => {
  const selfBookPassenger: PassengerBookInfo = {
    id: "p-sun",
    passenger: { Id: "370000000267", AccountId: "68050000000037", Name: "孙雪" },
    credential: {
      Id: "cred-sun",
      AccountId: "68050000000037",
      Name: "孙雪",
      Number: "411521198811171528",
      Type: 1,
    },
  };
  const initStaff = {
    Id: "370000000267",
    Name: "孙雪",
    Account: { Id: 68050000000037, Mobile: "18910943089", Email: "" },
    Organization: { Code: "A002", Name: "差旅事业部" },
  };

  it("prefills the staff account mobile from Initialize when the credential has none", () => {
    const form = createHotelPassengerBookForm(selfBookPassenger, "2026-09-15 14:00", initStaff);
    expect(form.mobileOptions).toEqual([{ value: "18910943089", checked: true }]);
  });

  it("matches Initialize staff by Account.Id, not Staff.Id", () => {
    expect(findHotelInitStaff(selfBookPassenger, [initStaff])?.Account?.Mobile).toBe("18910943089");
  });

  it("fills an empty form after Initialize staff arrives", () => {
    const empty = createHotelPassengerBookForm(selfBookPassenger, "2026-09-15 14:00");
    expect(empty.mobileOptions).toEqual([]);

    const merged = mergeHotelInitStaffIntoForm(empty, selfBookPassenger, initStaff);
    expect(merged.mobileOptions).toEqual([{ value: "18910943089", checked: true }]);
  });
});

describe("validateHotelBookForms", () => {
  it("requires arrival time", () => {
    const forms = { p1: createHotelPassengerBookForm(passengers[0]!, "") };
    expect(validateHotelBookForms({ passengers, forms, arrivalTime: "" })).toBe("请选择到店时间");
  });

  it("requires approver when configured", () => {
    const forms = { p1: createHotelPassengerBookForm(passengers[0]!, "2026-06-20 14:00") };
    expect(
      validateHotelBookForms({
        passengers,
        forms,
        arrivalTime: "2026-06-20 14:00",
        requiresApprover: true,
      }),
    ).toBe("请选择审批人");
  });
});

describe("resolveHotelRoomPlanRulesDesc", () => {
  it("joins legacy RoomPlanRules descriptions", () => {
    expect(
      resolveHotelRoomPlanRulesDesc({
        RoomPlanRules: [{ Description: "入住前18:00可免费取消" }],
      }),
    ).toBe("入住前18:00可免费取消");
  });

  it("falls back to RoomRateRule and CancelPolicy", () => {
    expect(
      resolveHotelRoomPlanRulesDesc({
        VariablesObj: { RoomRateRule: "不可取消" },
        CancelPolicy: "限时取消",
      }),
    ).toBe("不可取消");
  });
});

describe("buildHotelWarmReminderParagraphs", () => {
  it("returns legacy warranty copy without cancel policy", () => {
    expect(buildHotelWarmReminderParagraphs()).toEqual([HOTEL_WARM_REMINDER_BOOKING_DEFAULT]);
  });
});

describe("buildHotelWarmReminderSections", () => {
  it("splits legacy warm-reminder copy into booking and payment sections only", () => {
    const sections = buildHotelWarmReminderSections();

    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({
      id: "booking",
      title: "预订提示",
    });
    expect(sections[0]?.content).toContain("确认结果以短信");
    expect(sections[1]).toMatchObject({
      id: "payment",
      title: "在线支付说明",
    });
    expect(sections[1]?.content).toContain("原路退还");
  });
});

describe("calcHotelNights", () => {
  it("counts nights between check-in and check-out", () => {
    expect(calcHotelNights("2026-06-20", "2026-06-22")).toBe(2);
  });
});
