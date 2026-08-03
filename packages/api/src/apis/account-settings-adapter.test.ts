import { describe, expect, it } from "vitest";

import { adaptAccountSettingsItems, DEFAULT_SETTINGS_MENU } from "./account-settings-adapter.js";

describe("adaptAccountSettingsItems", () => {
  it("maps security and notification items", () => {
    const items = adaptAccountSettingsItems([
      { Name: "账号与安全", Url: "account-security_ryx" },
      { Name: "消息通知", Url: "message-notification" },
      { Name: "退出登录", Url: "logout" },
    ]);

    expect(items).toEqual([
      { id: "security", label: "账号与安全", kind: "navigate", route: "/settings/security" },
      {
        id: "notifications",
        label: "消息通知",
        kind: "navigate",
        route: "/settings/notifications",
      },
    ]);
  });

  it("falls back to defaults when empty", () => {
    expect(adaptAccountSettingsItems([])).toEqual(DEFAULT_SETTINGS_MENU);
    expect(adaptAccountSettingsItems(undefined)).toEqual(DEFAULT_SETTINGS_MENU);
  });
});
