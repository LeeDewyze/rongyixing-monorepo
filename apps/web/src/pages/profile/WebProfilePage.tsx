import { ProfilePadHeaderCard } from "@/components/profile/ProfilePadHeaderCard";
import { ProfilePadShortcutGrid } from "@/components/profile/ProfilePadShortcutGrid";
import { WEB_MAIN_PADDING_CLASS } from "@/components/WebShell";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { useAccountBalance, useMessageCount } from "@/hooks/useAccount";
import { formatApiError } from "@/lib/formatApiError";
import { getLoginUserName } from "@/lib/session";

/** Top sky band only — page body stays #F5F6F9 per 我的tab mockup. */
const PROFILE_TOP_GRADIENT =
  "linear-gradient(180deg, #8EC8FF 0%, #B8DBFF 38%, #E1EEFC 72%, rgba(245, 246, 249, 0) 100%)";

export function WebProfilePage() {
  const { data: profile, isLoading, error } = useMemberProfile();
  const { data: balance } = useAccountBalance();
  const { data: messageCount } = useMessageCount();

  if (isLoading) {
    return (
      <div className={`flex h-full items-center justify-center ${WEB_MAIN_PADDING_CLASS}`}>
        <p className="text-sm text-[#666666]">加载中…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`flex h-full items-center justify-center ${WEB_MAIN_PADDING_CLASS}`}>
        <p className="text-sm text-destructive">{formatApiError(error ?? new Error("加载失败"))}</p>
      </div>
    );
  }

  const displayName = getLoginUserName() ?? profile.Name;

  return (
    <div
      className={`relative h-full w-full overflow-y-auto overscroll-y-contain bg-[#F5F6F9] ${WEB_MAIN_PADDING_CLASS}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(240px,32vh)]"
        style={{ background: PROFILE_TOP_GRADIENT }}
      />
      <div className="relative mx-auto w-full max-w-[1280px]">
        <ProfilePadHeaderCard
          profile={profile}
          displayName={displayName}
          balance={balance}
          messageCount={messageCount}
        />
        <ProfilePadShortcutGrid />
      </div>
    </div>
  );
}
