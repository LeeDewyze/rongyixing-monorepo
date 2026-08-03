import { describe, expect, it } from "vitest";

import { normalizeApiConfigSetting } from "./api-config.js";

describe("normalizeApiConfigSetting", () => {
  it("unwraps IResponse envelope from /Home/Setting", () => {
    const setting = normalizeApiConfigSetting({
      Status: true,
      Code: "Success",
      Message: "",
      Data: {
        Token: "abc-token",
        LoginUrl: "https://ronglv-feature.rongtrip.cn/Jyx/LoginByRyx",
        Urls: { ApiLoginUrl: "https://login-api.rongtrip.cn" },
      },
    });

    expect(setting.Token).toBe("abc-token");
    expect(setting.LoginUrl).toBe("https://ronglv-feature.rongtrip.cn/Jyx/LoginByRyx");
    expect(setting.Urls.ApiLoginUrl).toBe("https://login-api.rongtrip.cn");
  });
});
