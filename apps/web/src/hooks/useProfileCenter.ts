import { useQuery } from "@tanstack/react-query";
import type { MemberProfile, StaffDto } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export interface ProfileCenterInfo extends MemberProfile {
  staff?: StaffDto | null;
}

function mergeProfile(member: MemberProfile, staff: StaffDto | null): ProfileCenterInfo {
  return {
    ...member,
    RealName: member.RealName || staff?.Nickname || staff?.Name || member.Name,
    Mobile: member.Mobile || staff?.Mobile,
    OrganizationCode: member.OrganizationCode || staff?.OrganizationCode,
    OrganizationName: member.OrganizationName || staff?.OrganizationName || staff?.Department,
    CostCenterCode: member.CostCenterCode || staff?.CostCenterCode,
    CostCenterName: member.CostCenterName || staff?.CostCenterName,
    BookType: member.BookType ?? staff?.BookType,
    BookTypeName: member.BookTypeName || staff?.BookTypeName,
    staff,
  };
}

export function useProfileCenter() {
  return useQuery({
    queryKey: ["member", "profile-center"],
    queryFn: async () => {
      const member = await getApi().member.getProfile();
      const staff = await getApi().travel.getStaff("").catch(() => null);
      return mergeProfile(member, staff);
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
