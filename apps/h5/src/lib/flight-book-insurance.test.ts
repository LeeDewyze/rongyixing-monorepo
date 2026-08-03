import { describe, expect, it } from "vitest";
import type { FlightPassengerBookForm, PassengerBookInfo } from "@ryx/shared-types";

import {
  formatInsuranceDetailLines,
  isMandatoryFlightInsurance,
  resolveForcedInsuranceProductId,
  validatePassengerInsuranceSelection,
} from "./flight-book-insurance";

const passenger: PassengerBookInfo = {
  id: "p1",
  passenger: {
    Id: "p1",
    Name: "张三",
    AccountId: "acc-1",
    Policy: { FlightForceInsuranceId: "ins-1" },
  },
  credential: { Id: "c1", Name: "张三", CredentialsType: 1 },
};

const form: FlightPassengerBookForm = {
  passengerId: "p1",
  mobileOptions: [],
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
  expenseType: "",
  illegalReason: "",
  otherIllegalReason: "",
  selectedInsuranceId: "",
  outNumbers: {},
  approvalId: "",
  selectedApproverName: "",
  isSkipApprove: false,
};

describe("formatInsuranceDetailLines", () => {
  it("splits detail by newline", () => {
    expect(formatInsuranceDetailLines("第一行\n第二行")).toEqual(["第一行", "第二行"]);
  });
});

describe("mandatory insurance", () => {
  it("detects mandatory insurance from passenger policy and tmc flag", () => {
    expect(isMandatoryFlightInsurance(passenger, { MandatoryBuyInsurance: true })).toBe(true);
    expect(isMandatoryFlightInsurance(passenger, { MandatoryBuyInsurance: false })).toBe(false);
  });

  it("resolves forced insurance product id", () => {
    expect(
      resolveForcedInsuranceProductId(
        passenger,
        [{ Id: "ins-1", Name: "航空意外险", Price: "30" }],
        { MandatoryBuyInsurance: true },
      ),
    ).toBe("ins-1");
  });

  it("requires forced insurance on submit", () => {
    expect(
      validatePassengerInsuranceSelection({
        passenger,
        form: { ...form, selectedInsuranceId: "" },
        products: [{ Id: "ins-1", Name: "航空意外险", Price: "30" }],
        init: { Tmc: { MandatoryBuyInsurance: true, FlightHasInsurance: true } },
        tmcHasInsurance: true,
      }),
    ).toBe("张三 须购买指定保险");
  });
});
