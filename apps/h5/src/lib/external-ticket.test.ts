import { describe, expect, it } from "vitest";

import {
  resolveDingTalkBindingPath,
  resolveTicketEntryTargetPath,
  shouldBootstrapExternalTicket,
  shouldUsePageTicketDirectly,
} from "./external-ticket";

describe("shouldBootstrapExternalTicket", () => {
  it("allows RYB ticket exchange only in OneMessage user agent", () => {
    const url = new URL("https://app.rongtrip.cn/www/index.html?ticket=external-ticket");

    expect(shouldBootstrapExternalTicket(url, "Mozilla/5.0 OneMessage")).toBe(true);
    expect(shouldBootstrapExternalTicket(url, "Mozilla/5.0 Chrome")).toBe(false);
    expect(shouldUsePageTicketDirectly(url, "Mozilla/5.0 Chrome")).toBe(true);
    expect(shouldUsePageTicketDirectly(url, "Mozilla/5.0 OneMessage")).toBe(false);
  });

  it("ignores empty-like ticket values", () => {
    expect(
      shouldBootstrapExternalTicket(
        new URL("https://app.rongtrip.cn/www/index.html?ticket=null"),
        "OneMessage",
      ),
    ).toBe(false);
    expect(
      shouldBootstrapExternalTicket(
        new URL("https://app.rongtrip.cn/www/index.html?ticket=undefined"),
        "OneMessage",
      ),
    ).toBe(false);
  });

  it("does not hijack DingTalk ticket flows", () => {
    expect(
      shouldBootstrapExternalTicket(
        new URL("https://app.rongtrip.cn/www/index.html?ticket=t&path=account-dingtalk"),
        "OneMessage",
      ),
    ).toBe(false);
    expect(
      shouldUsePageTicketDirectly(
        new URL("https://app.rongtrip.cn/www/index.html?ticket=t&path=account-dingtalk"),
        "OneMessage",
      ),
    ).toBe(true);
    expect(
      shouldBootstrapExternalTicket(
        new URL("https://app.rongtrip.cn/www/index.html?ticket=t&dingtalkcode=code"),
        "OneMessage",
      ),
    ).toBe(false);
    expect(
      shouldUsePageTicketDirectly(
        new URL("https://app.rongtrip.cn/www/index.html?ticket=t&dingtalkcode=code"),
        "OneMessage",
      ),
    ).toBe(true);
  });

  it("reads a custom ticketName callback parameter", () => {
    const url = new URL(
      "https://app.rongtrip.cn/www/index.html?ticketName=auth&auth=t&path=account-dingtalk&DingTalkCode=code",
    );

    expect(shouldUsePageTicketDirectly(url, "Mozilla/5.0 Chrome")).toBe(true);
    expect(shouldBootstrapExternalTicket(url, "Mozilla/5.0 OneMessage")).toBe(false);
  });

  it("always resolves a DingTalk callback to the binding page", () => {
    const url = new URL(
      "https://app.rongtrip.cn/www/index.html?path=account-dingtalk&DingTalkCode=code&returnTo=%2Forders",
    );

    expect(resolveDingTalkBindingPath(url)).toBe(
      "/settings/dingtalk?path=account-dingtalk&DingTalkCode=code",
    );
  });

  it("always sends ticket entries to home regardless of caller URL", () => {
    const urls = [
      "https://app.rongtrip.cn/www/index.html?wechatopenid=&ticketname=ticket&root=www&ticket=t",
      "https://app.rongtrip.cn/www/index.html?ticket=t&path=tabs_ryx/tab-tmc-home_ryx",
      "https://app.rongtrip.cn/www/flight/list?ticket=t&returnTo=%2Forders",
      "https://app.rongtrip.cn/www/index.html?ticket=t&path=account-dingtalk",
    ];

    for (const value of urls) {
      expect(resolveTicketEntryTargetPath(new URL(value))).toBe("/home");
    }
  });
});
