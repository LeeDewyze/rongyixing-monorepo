/** Legacy-compatible local storage keys from beeant `CoreHelper`. */
const OTHER_PUSH_MESSAGE_KEY = "_key_is_stop_AccountMessageSetting";
const PERSONAL_PUSH_MESSAGE_KEY = "_key_is_stop_PersonOn_AccountMessageSetting";

export interface MessageNotificationPreferences {
  otherMessagesEnabled: boolean;
  personalRecommendationEnabled: boolean;
}

function readBoolean(key: string): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return false;
    return raw === "true";
  } catch {
    return false;
  }
}

function writeBoolean(key: string, value: boolean): void {
  localStorage.setItem(key, String(value));
}

export function loadMessageNotificationPreferences(): MessageNotificationPreferences {
  return {
    otherMessagesEnabled: readBoolean(OTHER_PUSH_MESSAGE_KEY),
    personalRecommendationEnabled: readBoolean(PERSONAL_PUSH_MESSAGE_KEY),
  };
}

export function saveOtherPushMessageEnabled(enabled: boolean): void {
  writeBoolean(OTHER_PUSH_MESSAGE_KEY, enabled);
}

export function savePersonalPushMessageEnabled(enabled: boolean): void {
  writeBoolean(PERSONAL_PUSH_MESSAGE_KEY, enabled);
}

/** Used by home/workbench feeds to filter personalized promos when disabled. */
export function isPersonalPushMessageEnabled(): boolean {
  return readBoolean(PERSONAL_PUSH_MESSAGE_KEY);
}

export const PERSONAL_PUSH_FILTER_TAGS = [
  "个性推荐",
  "精品推荐",
  "定向推送",
  "优惠",
  "猜你喜欢",
  "专属推送",
  "定制",
  "好物推荐",
] as const;
