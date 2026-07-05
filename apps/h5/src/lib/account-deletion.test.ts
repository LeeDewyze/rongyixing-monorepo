import { describe, expect, it } from "vitest";

import {
  ACCOUNT_DELETION_AGREEMENT_LABEL,
  ACCOUNT_DELETION_DIALOG_TITLE,
  ACCOUNT_DELETION_ENTRY_HINT,
  ACCOUNT_DELETION_ENTRY_LABEL,
  ACCOUNT_DELETION_RULES,
  ACCOUNT_DELETION_SUBTITLE,
  ACCOUNT_DELETION_TOAST_AGREEMENT_REQUIRED,
} from "./account-deletion";

describe("account-deletion copy", () => {
  it("exposes legacy-aligned entry labels", () => {
    expect(ACCOUNT_DELETION_ENTRY_LABEL).toBe("注销账号");
    expect(ACCOUNT_DELETION_ENTRY_HINT).toBe("注销后无法恢复，请谨慎操作");
  });

  it("exposes legacy-aligned page subtitle and rules", () => {
    expect(ACCOUNT_DELETION_SUBTITLE).toBe("账号注销后，将放弃以下资产和权益");
    expect(ACCOUNT_DELETION_RULES).toHaveLength(4);
    expect(ACCOUNT_DELETION_RULES[0]).toBe("当前帐号将无法登录");
    expect(ACCOUNT_DELETION_RULES[1]).toBe("无法查询当前账号所有的历史订单");
    expect(ACCOUNT_DELETION_RULES[2]).toBe('不再收到"融易行"应用的相关消息');
    expect(ACCOUNT_DELETION_RULES[3]).toBe("自愿放弃平台提供的会员权益");
  });

  it("exposes legacy-aligned agreement and dialog copy", () => {
    expect(ACCOUNT_DELETION_AGREEMENT_LABEL).toBe(
      "我已理解并同意以上规则，自愿放弃账号内的各类权益和资产",
    );
    expect(ACCOUNT_DELETION_TOAST_AGREEMENT_REQUIRED).toBe("请勾选注销规则");
    expect(ACCOUNT_DELETION_DIALOG_TITLE).toBe("确认注销？");
  });
});
