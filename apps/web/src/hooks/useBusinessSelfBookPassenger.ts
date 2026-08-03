import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CredentialType,
  staffPrimaryCredential,
  type PassengerBookInfo,
  type PassengerCredential,
  type ProductType,
  type StaffDto,
  type StaffPassenger,
} from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { useIdentity } from "@/hooks/useIdentity";
import { createBookInfo } from "@/lib/passenger-select-logic";
import { usePassengerSelection } from "@/hooks/usePassenger";
import {
  clearAutoSelfBookSelectionIfMatches,
  markAutoSelfBookSelection,
} from "@/lib/passenger-selection";
import {
  BOOKING_PERMISSION_STAFF_QUERY_KEY,
  bookingPermissionSelfCredentialsQueryKey,
  isSelfBookTypeValue,
  present,
} from "@/lib/booking-permission-preload";

function staffDtoToPassenger(
  staff: StaffDto,
  identity?: { Id?: string; Name?: string },
): StaffPassenger {
  const legacyAccount = (staff as StaffDto & { Account?: { Id?: string } }).Account;
  const accountId = present(staff.AccountId) ?? present(legacyAccount?.Id) ?? present(identity?.Id);
  const staffId = present(staff.Id) ?? accountId ?? "";
  const staffName = present(staff.Name) ?? present(identity?.Name) ?? "";
  return {
    Id: staffId,
    AccountId: accountId ?? staffId,
    Name: staffName,
    Mobile: staff.Mobile,
    OrgName: staff.OrganizationName ?? staff.Department,
    Credentials: [],
    Policy: staff.Policy,
  };
}

function credentialType(credential: PassengerCredential): string {
  return String(credential.Type ?? credential.CredentialsType ?? "");
}

function pickSelfCredential(
  credentials: PassengerCredential[] | undefined,
  staffPassenger: StaffPassenger,
): PassengerCredential {
  const credential =
    credentials?.find((item) => credentialType(item) === String(CredentialType.IdCard)) ??
    credentials?.[0];
  return credential ?? staffPrimaryCredential(staffPassenger);
}

function isSameSinglePassenger(selected: PassengerBookInfo[], selfPassenger: PassengerBookInfo) {
  if (selected.length !== 1) return false;
  const current = selected[0];
  return (
    String(current?.id ?? "") === String(selfPassenger.id) &&
    String(current?.credential?.Id ?? "") === String(selfPassenger.credential.Id ?? "")
  );
}

function matchesCurrentStaff(staff: StaffPassenger, accountId: string): boolean {
  return String(staff.AccountId ?? staff.Id) === accountId;
}

function hasTravelPolicy(policy: StaffDto["Policy"] | undefined): boolean {
  return Boolean(policy && Object.keys(policy).length > 0);
}

/**
 * Legacy StaffBookType.Self only applies to business/TMC booking.
 * When enabled, it mirrors legacy initSelfBookTypeBookInfos by making the current staff
 * the sole selected passenger so policy and book APIs receive a passenger context.
 */
export function useBusinessSelfBookPassenger(forType: ProductType, enabled: boolean) {
  const { selected, setSelected } = usePassengerSelection(forType);
  const identityQuery = useIdentity();

  const staffQuery = useQuery({
    queryKey: BOOKING_PERMISSION_STAFF_QUERY_KEY,
    queryFn: () => getApi().travel.getStaff(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const staff = staffQuery.data;
  const isSelfBookOnly = enabled && isSelfBookTypeValue(staff?.BookType);
  const staffPassenger = useMemo(
    () => (staff ? staffDtoToPassenger(staff, identityQuery.data) : null),
    [identityQuery.data, staff],
  );
  const accountId = present(staffPassenger?.AccountId) ?? present(staffPassenger?.Id);
  const policyStaffQuery = useQuery({
    queryKey: ["booking-permission", "self-policy-staff", accountId],
    queryFn: async () => {
      const result = await getApi().passenger.getStaffList({
        Name: staffPassenger?.Name,
        PageIndex: 0,
        PageSize: 20,
      });
      return result.Staffs.find((item) => matchesCurrentStaff(item, accountId!)) ?? null;
    },
    enabled: isSelfBookOnly && Boolean(accountId) && !hasTravelPolicy(staff?.Policy),
    staleTime: 5 * 60 * 1000,
  });

  const credentialsQuery = useQuery({
    queryKey: bookingPermissionSelfCredentialsQueryKey(accountId),
    queryFn: () => getApi().passenger.getStaffCredentials({ AccountId: accountId! }),
    enabled: isSelfBookOnly && Boolean(accountId),
    staleTime: 5 * 60 * 1000,
  });

  const selfPassenger = useMemo(() => {
    if (!isSelfBookOnly || !staffPassenger || !accountId) return null;
    const policyStaff = policyStaffQuery.data;
    return createBookInfo(
      {
        ...staffPassenger,
        Credentials: credentialsQuery.data ?? [],
        Policy: policyStaff?.Policy ?? staffPassenger.Policy,
      },
      pickSelfCredential(credentialsQuery.data, staffPassenger),
    );
  }, [accountId, credentialsQuery.data, isSelfBookOnly, policyStaffQuery.data, staffPassenger]);

  useEffect(() => {
    if (!isSelfBookOnly || !selfPassenger) return;
    markAutoSelfBookSelection(forType, selfPassenger);
    if (isSameSinglePassenger(selected, selfPassenger)) return;
    setSelected([selfPassenger]);
  }, [forType, isSelfBookOnly, selected, selfPassenger, setSelected]);

  useEffect(() => {
    if (!enabled || staffQuery.isLoading || !staff || isSelfBookOnly) return;
    clearAutoSelfBookSelectionIfMatches(forType, selected);
  }, [enabled, forType, isSelfBookOnly, selected, staff, staffQuery.isLoading]);

  return {
    selected,
    setSelected,
    passengers: isSelfBookOnly && selfPassenger ? [selfPassenger] : selected,
    isSelfBookOnly,
    isLoading:
      staffQuery.isLoading ||
      (isSelfBookOnly && !accountId && identityQuery.isLoading) ||
      (isSelfBookOnly && (credentialsQuery.isLoading || policyStaffQuery.isLoading)),
    staff,
    selfPassenger,
    policyStaff: policyStaffQuery.data,
  };
}
