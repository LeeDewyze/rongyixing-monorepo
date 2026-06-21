import type { MemberProfile } from "@ryx/shared-types";

import { PROFILE_ASSETS } from "@/config/profile-assets";

/** Figma 23:2495 — sky-blue header fade into page background. */
const PROFILE_PAGE_GRADIENT =
  "linear-gradient(180deg, #8EC8FF 0%, #B8DBFF 38%, #E1EEFC 72%, #F5F6F9 100%)";

function ProfileAvatar() {
  return (
    <img
      src={PROFILE_ASSETS.defaultAvatar}
      alt=""
      className="box-border size-[72px] shrink-0 rounded-full border border-white object-cover"
      aria-hidden
    />
  );
}

function BuildingIcon() {
  return (
    <img
      src={PROFILE_ASSETS.orgBuilding}
      alt=""
      className="size-5 shrink-0 object-contain"
      aria-hidden
    />
  );
}

function PersonalCenterButton() {
  return (
    <button
      type="button"
      className="flex h-6 w-[88px] shrink-0 items-center justify-center gap-1 rounded border-none bg-[#2768FA66] text-[14px] font-normal leading-none tracking-normal text-white [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]"
      aria-label="个人中心（即将上线）"
    >
      个人中心
      <img
        src={PROFILE_ASSETS.personalCenterChevron}
        alt=""
        className="size-4 shrink-0 object-contain"
        aria-hidden
      />
    </button>
  );
}

interface ProfileHeaderProps {
  profile: MemberProfile;
  displayName: string;
}

export function ProfileHeader({ profile, displayName }: ProfileHeaderProps) {
  const orgCode = profile.OrganizationCode ?? profile.Id;

  return (
    <header className="px-3 pb-14 pt-10" style={{ background: PROFILE_PAGE_GRADIENT }}>
      <div className="flex items-center gap-3">
        <ProfileAvatar />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-[18px] font-semibold leading-[25px] text-[#010101]">
              {displayName}
            </p>
            <PersonalCenterButton />
          </div>
          <p className="mt-2 flex items-center gap-1 text-[14px] font-normal leading-none tracking-normal text-[#2768FA] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
            <BuildingIcon />
            <span>组织编码：{orgCode}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
