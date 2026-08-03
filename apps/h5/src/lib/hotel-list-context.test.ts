// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PassengerBookInfo } from "@ryx/shared-types";

import {
  readStaffCityCode,
  resolveHotelListPassengerIds,
  shouldShowHotelFreeStayTip,
} from "./hotel-list-context";

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

function passenger(input: {
  id: string;
  passengerAccountId?: string;
  credentialAccountId?: string;
}): PassengerBookInfo {
  return {
    id: input.id,
    passenger: {
      Id: `staff-${input.id}`,
      AccountId: input.passengerAccountId,
      Name: "测试乘客",
      Credentials: [],
    },
    credential: {
      Id: `cred-${input.id}`,
      AccountId: input.credentialAccountId,
      Name: "测试乘客",
      CredentialsType: 1,
      Number: "110101199001011234",
    },
  };
}

describe("hotel-list-context", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  it("collects unique passenger account ids with credential fallback", () => {
    expect(
      resolveHotelListPassengerIds([
        passenger({ id: "p1", passengerAccountId: "acc-1", credentialAccountId: "cred-1" }),
        passenger({ id: "p2", passengerAccountId: "acc-1", credentialAccountId: "cred-2" }),
        passenger({ id: "p3", credentialAccountId: "cred-3" }),
      ]),
    ).toBe("acc-1,cred-3");
  });

  it("reads staff city code from legacy-compatible localStorage keys", () => {
    localStorage.setItem("StaffCityCode", " 027 ");
    expect(readStaffCityCode()).toBe("027");
  });

  it("shows free stay tip only when enabled and not agent hotel type", () => {
    expect(
      shouldShowHotelFreeStayTip({
        tmc: { AllowHotelOutPolicySelfPay: true },
        hotelType: "Normal",
      }),
    ).toBe(true);
    expect(
      shouldShowHotelFreeStayTip({
        tmc: { AllowHotelExceedSelfPay: true },
        hotelType: "Tmc",
      }),
    ).toBe(true);
    expect(
      shouldShowHotelFreeStayTip({
        tmc: { AllowHotelOutPolicySelfPay: true },
        hotelType: "Agent",
      }),
    ).toBe(false);
  });
});

