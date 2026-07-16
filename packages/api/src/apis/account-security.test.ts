import { describe, expect, it, vi } from "vitest";

import { PASSWORD_FLOW_METHODS } from "../methods/password-flow.js";
import { createAccountSecurityApi } from "./account-security.js";

describe("createAccountSecurityApi forgot password", () => {
  it("checks account with legacy Home Action Check", async () => {
    const send = vi.fn().mockResolvedValue({ ValidTypes: [] });
    const api = createAccountSecurityApi({ send } as never);

    await api.checkForgotPasswordAccount({ Name: "user01" });

    expect(send).toHaveBeenCalledWith({
      method: PASSWORD_FLOW_METHODS.HOME_ACTION,
      data: { Name: "user01", Action: "Check" },
      isShowLoading: true,
    });
  });

  it("sends forgot password code with legacy Home SendCode", async () => {
    const send = vi.fn().mockResolvedValue({ SendInterval: 60 });
    const api = createAccountSecurityApi({ send } as never);

    await api.sendForgotPasswordCode({ Name: "user01", ValidateType: "Mobile" });

    expect(send).toHaveBeenCalledWith({
      method: PASSWORD_FLOW_METHODS.HOME_SENDCODE,
      data: { Name: "user01", ValidateType: "Mobile" },
      isShowLoading: true,
    });
  });

  it("validates code with legacy Home Action Valid", async () => {
    const send = vi.fn().mockResolvedValue(true);
    const api = createAccountSecurityApi({ send } as never);

    await api.validateForgotPasswordCode({
      Name: "user01",
      ValidateType: "Email",
      ValidateValue: "123456",
    });

    expect(send).toHaveBeenCalledWith({
      method: PASSWORD_FLOW_METHODS.HOME_ACTION,
      data: {
        Name: "user01",
        ValidateType: "Email",
        ValidateValue: "123456",
        Action: "Valid",
      },
      isShowLoading: true,
    });
  });

  it("resets password with legacy Home Action Reset", async () => {
    const send = vi.fn().mockResolvedValue(true);
    const api = createAccountSecurityApi({ send } as never);

    await api.resetForgotPassword({
      Name: "user01",
      Password: "Aa123456",
      SurePassword: "Aa123456",
    });

    expect(send).toHaveBeenCalledWith({
      method: PASSWORD_FLOW_METHODS.HOME_ACTION,
      data: {
        Name: "user01",
        Password: "Aa123456",
        SurePassword: "Aa123456",
        Action: "Reset",
      },
      isShowLoading: true,
    });
  });
});
