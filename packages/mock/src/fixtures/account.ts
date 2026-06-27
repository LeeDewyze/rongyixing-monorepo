import type { AccountHomeSummary, AccountSettingsItemsResponse } from "@ryx/shared-types";

export const MOCK_ACCOUNT_SETTINGS_ITEMS: AccountSettingsItemsResponse = {
  Items: [
    { Name: "账号与安全", Url: "account-security_ryx", Route: "account-security_ryx" },
    { Name: "消息通知", Type: "action", Url: "message-notification" },
  ],
};

export const MOCK_ACCOUNT_HOME_SUMMARY: AccountHomeSummary = {
  Name: "某某某",
  Mobile: "13800138000",
  HideMobile: "138****8000",
  Email: "demo@rongtrip.cn",
  HideEmail: "d***@rongtrip.cn",
  HasPassword: true,
};

export const MOCK_LOGIN_DEVICES = [
  { Id: "mock-device-h5", Name: "H5 Browser" },
  { Id: "mock-device-iphone", Name: "iPhone 15 Pro" },
  { Id: "mock-device-ipad", Name: "iPad Air" },
];
