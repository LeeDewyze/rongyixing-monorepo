import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MemberProfile, StaffDto } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import {
  bookingPermissionStaffQueryKey,
  preloadBusinessStaffPermission,
} from "@/lib/booking-permission-preload";
import { queryClient } from "@/lib/query";
import { getTicket } from "@/lib/session";

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
  const ticket = getTicket();
  const staffQuery = useQuery({
    queryKey: bookingPermissionStaffQueryKey(ticket),
    queryFn: async () =>
      queryClient.getQueryData<StaffDto>(bookingPermissionStaffQueryKey(ticket)) ?? null,
    enabled: false,
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    void preloadBusinessStaffPermission(queryClient, { preloadCredentials: false });
  }, [ticket]);

  const profileQuery = useQuery({
    queryKey: ["member", "profile-center"],
    queryFn: () => getApi().member.getProfile(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });

  return {
    ...profileQuery,
    data: profileQuery.data
      ? mergeProfile(profileQuery.data, staffQuery.data ?? null)
      : undefined,
  };
}
