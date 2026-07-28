import { Link } from "react-router-dom";
import type { MemberProfile } from "@ryx/shared-types";

import { PROFILE_ASSETS } from "@/config/profile-assets";

import { ProfileAvatar } from "./ProfileAvatar";

interface ProfilePadHeaderCardProps {
  profile: MemberProfile;
  displayName: string;
  balance?: number;
  messageCount?: number;
}

/** Pad/PC profile header — white card per docs/需求实施/pad-pc/我的tab/我的.png */
export function ProfilePadHeaderCard({
  profile,
  displayName,
  balance,
  messageCount,
}: ProfilePadHeaderCardProps) {
  const orgCode = profile.OrganizationCode ?? profile.Id;
  return (
    <section className="rounded-2xl bg-white px-5 py-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.03] pc:px-6 pc:py-6">
      <div className="flex items-center gap-4">
        <ProfileAvatar src={profile.HeadUrl} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[20px] font-semibold leading-tight text-[#333333] pc:text-[22px]">
            {displayName}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[14px] leading-none text-[#2768FA]">
            <img
              src={PROFILE_ASSETS.orgBuilding}
              alt=""
              className="size-5 shrink-0 object-contain"
              aria-hidden
            />
            <span className="truncate">组织编码：{orgCode}</span>
          </p>
          {(balance != null && balance > 0) || (messageCount != null && messageCount > 0) ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {balance != null && balance > 0 ? (
                <span className="text-xs text-[#666666]">
                  积分：<span className="font-medium text-[#5099fe]">{balance}</span>
                </span>
              ) : null}
              {messageCount != null && messageCount > 0 ? (
                <span className="text-xs text-[#666666]">
                  消息：
                  <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#ff4d4f] px-1.5 py-0.5 text-[11px] font-medium text-white">
                    {messageCount}
                  </span>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <Link
          to="/profile/center"
          className="flex h-8 w-[100px] shrink-0 items-center justify-center gap-1 rounded border-none bg-[#2768FA66] text-[14px] font-normal leading-none tracking-normal text-white transition-colors hover:bg-[#2768FA]/55 active:opacity-90 [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]"
          aria-label="个人中心"
        >
          个人中心
          <img
            src={PROFILE_ASSETS.personalCenterChevron}
            alt=""
            className="size-4 shrink-0 object-contain"
            aria-hidden
          />
        </Link>
      </div>
    </section>
  );
}
