import { useState } from "react";
import type { SettingsMenuItem } from "@ryx/shared-types";
import { DEFAULT_SETTINGS_MENU } from "@ryx/api";
import { useNavigate } from "react-router-dom";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { usePageHeader } from "@/components/layout";
import {
  SettingsMenuCard,
  SettingsMenuRow,
  SETTINGS_MENU_CARD_CLASS,
} from "@/components/settings/SettingsMenuCard";
import { SettingsMenuIcon, settingsMenuIconForId } from "@/components/settings/SettingsMenuIcon";
import { SettingsPageChrome } from "@/components/settings/SettingsPageChrome";
import { SettingsSectionLabel } from "@/components/settings/SettingsSectionLabel";
import { useLogout } from "@/hooks/useAccountSettings";

const MENU_DESCRIPTIONS: Record<string, string> = {
  security: "手机号、密码与登录设备",
  notifications: "服务、活动与个性化推送",
};

export function SettingsPage() {
  const navigate = useNavigate();
  usePageHeader({ visible: false });
  const logout = useLogout();

  const [logoutOpen, setLogoutOpen] = useState(false);

  const menuItems = DEFAULT_SETTINGS_MENU;

  function handleMenuItem(item: SettingsMenuItem) {
    if (item.kind === "navigate" && item.route) {
      navigate(item.route);
    }
  }

  return (
    <SettingsPageChrome title="设置">
      <div className="-mt-1 flex flex-col gap-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1">
        <div>
          <SettingsSectionLabel>通用</SettingsSectionLabel>
          <SettingsMenuCard>
            {menuItems.map((item, index) => {
              const iconVariant = settingsMenuIconForId(item.id);
              return (
                <SettingsMenuRow
                  key={item.id}
                  label={item.label}
                  description={MENU_DESCRIPTIONS[item.id]}
                  icon={iconVariant ? <SettingsMenuIcon variant={iconVariant} /> : undefined}
                  showChevron
                  onClick={() => handleMenuItem(item)}
                  borderless={index === menuItems.length - 1}
                />
              );
            })}
          </SettingsMenuCard>
        </div>

        <div>
          <div className={SETTINGS_MENU_CARD_CLASS}>
            <button
              type="button"
              className="flex h-[52px] w-full items-center justify-center text-[16px] font-medium text-[#FF4D4F] transition-colors active:bg-[#FFF5F5]"
              onClick={() => setLogoutOpen(true)}
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title="退出登录"
        message="确定要退出当前账号吗？"
        confirmLabel="退出"
        variant="destructive"
        onConfirm={() => logout.mutate()}
        onCancel={() => setLogoutOpen(false)}
        loading={logout.isPending}
      />

      {logout.isError ? (
        <p className="px-4 pt-2 text-center text-[13px] text-[#999999]">
          服务端退出可能未完成，已清除本地登录状态
        </p>
      ) : null}
    </SettingsPageChrome>
  );
}
