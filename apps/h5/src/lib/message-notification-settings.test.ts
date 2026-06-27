import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadMessageNotificationPreferences,
  saveOtherPushMessageEnabled,
  savePersonalPushMessageEnabled,
} from "./message-notification-settings";

describe("message-notification-settings", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      },
    });
  });

  it("defaults both toggles to off", () => {
    expect(loadMessageNotificationPreferences()).toEqual({
      otherMessagesEnabled: false,
      personalRecommendationEnabled: false,
    });
  });

  it("persists legacy storage keys", () => {
    saveOtherPushMessageEnabled(true);
    savePersonalPushMessageEnabled(true);
    expect(loadMessageNotificationPreferences()).toEqual({
      otherMessagesEnabled: true,
      personalRecommendationEnabled: true,
    });
    expect(localStorage.getItem("_key_is_stop_AccountMessageSetting")).toBe("true");
    expect(localStorage.getItem("_key_is_stop_PersonOn_AccountMessageSetting")).toBe("true");
  });
});
