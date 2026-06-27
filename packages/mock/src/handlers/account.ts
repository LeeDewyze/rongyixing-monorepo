import type { IResponse } from "@ryx/shared-types";
import { ACCOUNT_FLOW_METHODS, PASSWORD_FLOW_METHODS, successResponse } from "@ryx/api";

import {
  MOCK_ACCOUNT_HOME_SUMMARY,
  MOCK_ACCOUNT_SETTINGS_ITEMS,
  MOCK_LOGIN_DEVICES,
} from "../fixtures/account.js";

export function createAccountMockHandlers(): Record<string, (data: unknown) => IResponse<unknown>> {
  let mobile = MOCK_ACCOUNT_HOME_SUMMARY.Mobile ?? "";
  let email = MOCK_ACCOUNT_HOME_SUMMARY.Email ?? "";
  let devices = [...MOCK_LOGIN_DEVICES];

  return {
    [ACCOUNT_FLOW_METHODS.HOME_GETITEMS]: () => successResponse(MOCK_ACCOUNT_SETTINGS_ITEMS),
    [ACCOUNT_FLOW_METHODS.HOME_GET]: () =>
      successResponse({
        ...MOCK_ACCOUNT_HOME_SUMMARY,
        Mobile: mobile,
        HideMobile: mobile.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
        Email: email,
        HideEmail: email.replace(/^(.).+(@.+)$/, "$1***$2"),
      }),
    [ACCOUNT_FLOW_METHODS.HOME_LOGOUT]: () => successResponse(true),
    [PASSWORD_FLOW_METHODS.PASSWORD_MODIFY]: (data) => {
      const params = data as {
        OldPassword?: string;
        NewPassword?: string;
        SurePassword?: string;
      };
      if (!params.OldPassword || !params.NewPassword || !params.SurePassword) {
        return { Status: false, Code: "VALIDATE", Message: "请填写完整密码信息", Data: null };
      }
      if (params.NewPassword !== params.SurePassword) {
        return { Status: false, Code: "VALIDATE", Message: "两次输入的新密码不一致", Data: null };
      }
      if (params.OldPassword === "wrong") {
        return { Status: false, Code: "VALIDATE", Message: "原密码不正确", Data: null };
      }
      return successResponse(true);
    },
    [PASSWORD_FLOW_METHODS.MOBILE_LOAD]: () =>
      successResponse({
        Mobile: mobile,
        HideMobile: mobile.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
      }),
    [PASSWORD_FLOW_METHODS.MOBILE_SENDCODE]: () => successResponse(true),
    [PASSWORD_FLOW_METHODS.MOBILE_ACTION]: (data) => {
      const params = data as { Mobile?: string; Code?: string };
      if (!params.Mobile || params.Code !== "123456") {
        return { Status: false, Code: "VALIDATE", Message: "验证码错误", Data: null };
      }
      mobile = params.Mobile;
      return successResponse(true);
    },
    [PASSWORD_FLOW_METHODS.EMAIL_LOAD]: () =>
      successResponse({
        Email: email,
        HideEmail: email.replace(/^(.).+(@.+)$/, "$1***$2"),
      }),
    [PASSWORD_FLOW_METHODS.EMAIL_SENDCODE]: () => successResponse(true),
    [PASSWORD_FLOW_METHODS.EMAIL_ACTION]: (data) => {
      const params = data as { Email?: string; Code?: string };
      if (!params.Email || params.Code !== "123456") {
        return { Status: false, Code: "VALIDATE", Message: "验证码错误", Data: null };
      }
      email = params.Email;
      return successResponse(true);
    },
    [PASSWORD_FLOW_METHODS.DEVICE_LIST]: () => successResponse(devices),
    [PASSWORD_FLOW_METHODS.DEVICE_REMOVE]: (data) => {
      const params = data as { Id?: string };
      if (!params.Id) {
        return { Status: false, Code: "VALIDATE", Message: "请选择设备", Data: null };
      }
      devices = devices.filter((device) => device.Id !== params.Id);
      return successResponse(true);
    },
  };
}
