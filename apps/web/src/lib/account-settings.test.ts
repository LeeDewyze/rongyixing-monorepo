import { describe, expect, it } from "vitest";

import {
  formatVerificationError,
  validateEmailAddress,
  validateMobileNumber,
  validatePasswordChange,
  validateVerificationCode,
} from "./account-settings";

describe("account-settings validation", () => {
  it("validates password change", () => {
    const validPassword = "Temp12345678";
    expect(
      validatePasswordChange({
        oldPassword: "Old123!@",
        newPassword: validPassword,
        confirmPassword: validPassword,
      }),
    ).toBeNull();
    expect(
      validatePasswordChange({
        oldPassword: "",
        newPassword: validPassword,
        confirmPassword: validPassword,
      }),
    ).toBe("请输入原密码");
    expect(
      validatePasswordChange({
        oldPassword: "Old123!@",
        newPassword: "abc123",
        confirmPassword: "abc123",
      }),
    ).toBe("密码需为8-20位，数字和英文的组合，不含空格");
    expect(
      validatePasswordChange({
        oldPassword: "Old123!@",
        newPassword: validPassword,
        confirmPassword: "Diff12345",
      }),
    ).toBe("两次输入的新密码不一致");
  });

  it("validates mobile and email", () => {
    expect(validateMobileNumber("13800138000")).toBeNull();
    expect(validateMobileNumber("123")).toBe("请输入正确的手机号");
    expect(validateEmailAddress("a@b.com")).toBeNull();
    expect(validateEmailAddress("bad")).toBe("请输入正确的邮箱");
    expect(validateVerificationCode("123456")).toBeNull();
    expect(validateVerificationCode("")).toBe("请输入验证码");
  });

  it("maps generic verification API failures to friendly copy", () => {
    expect(formatVerificationError(new Error("Request failed"))).toBe("验证码错误，请重新输入");
    expect(formatVerificationError(new Error("请求失败"))).toBe("验证码错误，请重新输入");
  });
});
