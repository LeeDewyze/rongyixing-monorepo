import type { MemberProfile, PassengerBookInfo } from "@ryx/shared-types";

/** Legacy `StaffBookType.Self`. */
export const STAFF_BOOK_TYPE_SELF = 1;

export interface IdentityLike {
  Id?: string;
}

export function isSelfBookType(input: {
  memberProfile?: MemberProfile | null;
  identity?: IdentityLike | null;
  passengers?: PassengerBookInfo[];
}): boolean {
  const { memberProfile, identity, passengers } = input;
  if (memberProfile?.BookType === STAFF_BOOK_TYPE_SELF) {
    return true;
  }

  if (passengers?.length === 1) {
    const passenger = passengers[0];
    const accountId =
      "AccountId" in passenger.passenger && passenger.passenger.AccountId
        ? String(passenger.passenger.AccountId)
        : String(passenger.id);
    const identityId = String(identity?.Id ?? memberProfile?.Id ?? "");
    if (accountId && identityId && accountId === identityId) {
      return true;
    }
    if ("IsSelf" in passenger.passenger && passenger.passenger.IsSelf === true) {
      return true;
    }
  }

  return false;
}

export function resolveDefaultPolicyFilterPassengerId(
  passengers: PassengerBookInfo[],
  isSelf: boolean,
): string | null {
  if (passengers.length === 0) return null;
  if (isSelf || passengers.length === 1) {
    return passengers[0]?.id ?? null;
  }
  return passengers[0]?.id ?? null;
}
