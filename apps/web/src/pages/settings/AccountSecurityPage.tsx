import { useNavigate } from "react-router-dom";

import { usePageHeader } from "@/components/layout";
import { SettingsMenuCard, SettingsMenuRow } from "@/components/settings/SettingsMenuCard";
import { SettingsMenuIcon } from "@/components/settings/SettingsMenuIcon";
import { SettingsPageChrome } from "@/components/settings/SettingsPageChrome";
import { SettingsSectionLabel } from "@/components/settings/SettingsSectionLabel";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { useDingTalkBindings } from "@/hooks/useDingTalk";
import { isDingTalkContainer } from "@/lib/dingtalk";

function displayMobile(mobile?: string): string {
  return mobile?.trim() || "未绑定";
}

export function AccountSecurityPage() {
  const navigate = useNavigate();
  usePageHeader({ visible: false });
  const profileQuery = useMemberProfile();
  const dingTalkSupported = isDingTalkContainer();
  const dingTalkBindings = useDingTalkBindings(dingTalkSupported);

  const profile = profileQuery.data;

  return (
    <SettingsPageChrome title="账户安全" backTo="/settings">
      <div className="-mt-1 space-y-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1">
        <div>
          <SettingsSectionLabel>账户</SettingsSectionLabel>
          <SettingsMenuCard>
            <SettingsMenuRow
              label="绑定手机"
              icon={<SettingsMenuIcon variant="phone" />}
              value={profileQuery.isLoading ? "…" : displayMobile(profile?.Mobile)}
              onClick={() => navigate("/settings/mobile")}
            />
            <SettingsMenuRow
              label="登录密码"
              icon={<SettingsMenuIcon variant="password" />}
              value="修改"
              valueTone="primary"
              onClick={() => navigate("/settings/password")}
              borderless
            />
          </SettingsMenuCard>
        </div>

        <div>
          {dingTalkSupported ? (
            <>
              <SettingsSectionLabel>第三方账号</SettingsSectionLabel>
              <SettingsMenuCard>
                <SettingsMenuRow
                  label="钉钉账号"
                  icon={<SettingsMenuIcon variant="dingtalk" />}
                  value={
                    dingTalkBindings.isLoading
                      ? "…"
                      : dingTalkBindings.data?.length
                        ? `已绑定 ${dingTalkBindings.data.length} 个`
                        : "未绑定"
                  }
                  valueTone={dingTalkBindings.data?.length ? "primary" : "default"}
                  onClick={() => navigate("/settings/dingtalk")}
                  borderless
                />
              </SettingsMenuCard>
            </>
          ) : null}
        </div>

        <div>
          <SettingsSectionLabel>安全</SettingsSectionLabel>
          <SettingsMenuCard>
            <SettingsMenuRow
              label="登录历史"
              icon={<SettingsMenuIcon variant="history" />}
              value="登录设备管理"
              onClick={() => navigate("/settings/devices")}
            />
            <SettingsMenuRow
              label="注销账号"
              icon={<SettingsMenuIcon variant="accountDelete" />}
              value="注销后无法恢复，请谨慎操作"
              valueTone="hint"
              onClick={() => navigate("/settings/account-deletion")}
              borderless
            />
          </SettingsMenuCard>
        </div>
      </div>
    </SettingsPageChrome>
  );
}
