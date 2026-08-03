import { describe, expect, it } from "vitest";
import type { FlightInitStaff, PassengerBookInfo } from "@ryx/shared-types";

import {
  createPassengerBookForm,
  findInitStaffForPassenger,
  resolvePassengerFormMobile,
  validatePassengerBookForms,
} from "./flight-book-passenger-form";

const passenger: PassengerBookInfo = {
  id: "p1",
  passenger: { Id: "p1", Name: "申晓杰", AccountId: "76190000000007" },
  credential: {
    Id: "c1",
    Name: "申晓杰",
    Mobile: "19528280621",
    Number: "S123456745",
    CredentialsType: 2,
    CredentialsTypeName: "回乡证",
  },
};

const staff: FlightInitStaff = {
  Account: { Id: "76190000000007", Mobile: "19528280621", Email: "" },
  Organization: { Code: "A001", Name: "技术部" },
  CostCenter: { Code: "CC", Name: "默认" },
};

describe("createPassengerBookForm", () => {
  it("prefills mobile, org and cost center from Initialize Staffs", () => {
    const form = createPassengerBookForm(passenger, staff);
    expect(form.mobileOptions).toEqual([{ value: "19528280621", checked: true }]);
    expect(form.organization).toEqual({ code: "A001", name: "技术部" });
    expect(form.costCenter).toEqual({ code: "CC", name: "默认" });
  });
});

describe("findInitStaffForPassenger", () => {
  it("matches staff by account id", () => {
    expect(findInitStaffForPassenger(passenger, [staff])?.Name).toBeUndefined();
    expect(findInitStaffForPassenger(passenger, [staff])?.Organization?.Name).toBe("技术部");
  });
});

describe("validatePassengerBookForms", () => {
  it("requires mobile", () => {
    const form = createPassengerBookForm(passenger, staff);
    form.mobileOptions = [];
    form.otherMobile = "";
    expect(validatePassengerBookForms([passenger], { p1: form })).toMatch(/联系电话不能为空/);
    form.otherMobile = "13800138000";
    expect(validatePassengerBookForms([passenger], { p1: form })).toBeNull();
    expect(resolvePassengerFormMobile(form)).toBe("13800138000");
  });
});
