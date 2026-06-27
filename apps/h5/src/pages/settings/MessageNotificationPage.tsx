import { useState, type ReactNode } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { usePageHeader } from "@/components/layout";
import { SettingsMenuCard } from "@/components/settings/SettingsMenuCard";
import { SettingsPageChrome } from "@/components/settings/SettingsPageChrome";
import { SettingsSectionLabel } from "@/components/settings/SettingsSectionLabel";
import { SettingsSwitch } from "@/components/settings/SettingsSwitch";
import {
  loadMessageNotificationPreferences,
  saveOtherPushMessageEnabled,
  savePersonalPushMessageEnabled,
} from "@/lib/message-notification-settings";

function NotificationRow({
  title,
  description,
  trailing,
  borderless,
}: {
  title: string;
  description: string;
  trailing: ReactNode;
  borderless?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${borderless ? "" : "border-b border-[#EEF0F4]"}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[16px] text-[#1A1A1A]">{title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#8A94A6]">{description}</p>
      </div>
      <div className="shrink-0">{trailing}</div>
    </div>
  );
}

export function MessageNotificationPage() {
  usePageHeader({ visible: false });

  const initial = loadMessageNotificationPreferences();
  const [otherMessagesEnabled, setOtherMessagesEnabled] = useState(initial.otherMessagesEnabled);
  const [personalRecommendationEnabled, setPersonalRecommendationEnabled] = useState(
    initial.personalRecommendationEnabled,
  );
  const [savingKey, setSavingKey] = useState<"other" | "personal" | null>(null);

  function persist(
    key: "other" | "personal",
    enabled: boolean,
    setter: (value: boolean) => void,
    save: (value: boolean) => void,
  ) {
    setter(enabled);
    setSavingKey(key);
    save(enabled);
    window.setTimeout(() => setSavingKey(null), 300);
  }

  return (
    <SettingsPageChrome title="消息通知" backTo="/settings">
      <div
        className={`-mt-1 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1 ${HOTEL_DETAIL_FONT}`}
      >
        <SettingsSectionLabel>新消息通知</SettingsSectionLabel>
        <SettingsMenuCard>
          <NotificationRow
            title="服务信息"
            description="行程、订单、审批类信息"
            trailing={<span className="text-[14px] text-[#8A94A6]">默认开启</span>}
          />
          <NotificationRow
            title="其他消息"
            description="例如促销、精选优惠、活动类消息"
            trailing={
              <SettingsSwitch
                label="其他消息"
                checked={otherMessagesEnabled}
                disabled={savingKey === "other"}
                onChange={(enabled) =>
                  persist("other", enabled, setOtherMessagesEnabled, saveOtherPushMessageEnabled)
                }
              />
            }
          />
          <NotificationRow
            title="个性化推荐"
            description="定向消息推送、个性化消息推送"
            borderless
            trailing={
              <SettingsSwitch
                label="个性化推荐"
                checked={personalRecommendationEnabled}
                disabled={savingKey === "personal"}
                onChange={(enabled) =>
                  persist(
                    "personal",
                    enabled,
                    setPersonalRecommendationEnabled,
                    savePersonalPushMessageEnabled,
                  )
                }
              />
            }
          />
        </SettingsMenuCard>
      </div>
    </SettingsPageChrome>
  );
}
