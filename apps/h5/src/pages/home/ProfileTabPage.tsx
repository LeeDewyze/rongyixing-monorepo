import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileMenuList } from "@/components/profile/ProfileMenuSection";
import { ProfileServiceGrid } from "@/components/profile/ProfileServiceGrid";
import { PROFILE_MENU_ITEMS } from "@/config/profile-menu";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { formatApiError } from "@/lib/formatApiError";
import { getLoginUserName } from "@/lib/session";

export function ProfileTabPage() {
  const { data: profile, isLoading, error } = useMemberProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F5F6F9] p-8">
        <p className="text-sm text-[#666666]">加载中…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F5F6F9] p-8">
        <p className="text-sm text-destructive">{formatApiError(error ?? new Error("加载失败"))}</p>
      </div>
    );
  }

  const displayName = getLoginUserName() ?? profile.Name;

  return (
    <div className="min-h-full bg-[#F5F6F9]">
      <ProfileHeader profile={profile} displayName={displayName} />
      <ProfileServiceGrid />
      <ProfileMenuList items={PROFILE_MENU_ITEMS} />
    </div>
  );
}
