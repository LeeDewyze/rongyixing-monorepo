import type {
  MemberPassenger,
  PassengerBookInfo,
  PassengerCredential,
  ProductType,
  StaffPassenger,
} from "@ryx/shared-types";
import {
  blockedCredentialTypes,
  credentialKey,
  credentialTypeValue,
  maxPassengersForProduct,
  memberToCredential,
  staffPrimaryCredential,
} from "@ryx/shared-types";

export function isCredentialAllowed(
  credential: PassengerCredential,
  forType: ProductType,
): boolean {
  const blocked = blockedCredentialTypes(forType);
  if (!blocked.length) return true;
  return !blocked.includes(credentialTypeValue(credential));
}

/** Prefer full credential Number from staff/member payload when list rows only expose HideNumber. */
export function enrichCredentialWithFullNumber(
  passenger: StaffPassenger | MemberPassenger,
  credential: PassengerCredential,
): PassengerCredential {
  if (credential.Number?.trim()) return credential;

  if ("Credentials" in passenger && passenger.Credentials?.length) {
    const matched = passenger.Credentials.find((item) => item.Id === credential.Id);
    const fromList = matched?.Number?.trim();
    if (fromList) return { ...credential, Number: fromList };
  }

  if ("Number" in passenger) {
    const isPrimary = credential.Id === passenger.Id;
    const fromPassenger = passenger.Number?.trim();
    if (isPrimary && fromPassenger) return { ...credential, Number: fromPassenger };
  }

  const memberNumber =
    "CredentialNo" in passenger
      ? (passenger.CredentialNo?.trim() ?? passenger.Number?.trim())
      : undefined;
  if (memberNumber) return { ...credential, Number: memberNumber };

  return credential;
}

export function enrichPassengerBookInfo(info: PassengerBookInfo): PassengerBookInfo {
  const credential = enrichCredentialWithFullNumber(info.passenger, info.credential);
  if (credential === info.credential) return info;
  return { ...info, credential };
}

export function createBookInfo(
  passenger: StaffPassenger | MemberPassenger,
  credential: PassengerCredential,
  isNotWhitelist = false,
): PassengerBookInfo {
  return {
    id: credential.Id,
    passenger,
    credential: enrichCredentialWithFullNumber(passenger, credential),
    isNotWhitelist,
  };
}

function resolvePassengerAccountId(
  passenger: StaffPassenger | MemberPassenger,
): string | undefined {
  if ("AccountId" in passenger && passenger.AccountId) {
    return String(passenger.AccountId);
  }
  return undefined;
}

/** Swap ticket credential for an already-selected passenger (book page only). */
export function replacePassengerCredential(
  items: PassengerBookInfo[],
  target: PassengerBookInfo,
  credential: PassengerCredential,
): PassengerBookInfo[] {
  const targetAccountId = resolvePassengerAccountId(target.passenger);
  return items.map((item) => {
    const itemAccountId = resolvePassengerAccountId(item.passenger);
    const samePerson =
      targetAccountId && itemAccountId
        ? itemAccountId === targetAccountId
        : item.id === target.id;
    return samePerson ? createBookInfo(item.passenger, credential, item.isNotWhitelist) : item;
  });
}

export function toggleSelection(
  current: PassengerBookInfo[],
  info: PassengerBookInfo,
  checked: boolean,
  forType: ProductType,
): { items: PassengerBookInfo[]; error?: string } {
  const key = credentialKey(info.credential);

  if (!checked) {
    return {
      items: current.filter((i) => credentialKey(i.credential) !== key),
    };
  }

  if (!isCredentialAllowed(info.credential, forType)) {
    return { items: current, error: "当前产品不支持该证件类型" };
  }

  if (!info.credential.Number && !info.credential.HideNumber) {
    return { items: current, error: "请先维护证件信息" };
  }

  const max = maxPassengersForProduct(forType);
  const withoutSameAccount = current.filter((i) => {
    const accountId = info.credential.AccountId;
    if (!accountId) return true;
    const existingAccount =
      i.credential.AccountId ??
      ("AccountId" in i.passenger ? i.passenger.AccountId : undefined);
    return existingAccount !== accountId;
  });

  const deduped = withoutSameAccount.filter((i) => credentialKey(i.credential) !== key);

  if (deduped.length >= max) {
    return { items: current, error: `最多选择${max}位出行人` };
  }

  return { items: [...deduped, info] };
}

export function staffSelectableCredentials(
  staff: StaffPassenger,
  forType: ProductType,
): PassengerCredential[] {
  const primary = staffPrimaryCredential(staff);
  const others = staff.Credentials ?? [];
  return [primary, ...others].filter((c) => isCredentialAllowed(c, forType));
}

export function memberSelectableCredential(
  member: MemberPassenger,
  forType: ProductType,
): PassengerCredential | null {
  const c = memberToCredential(member);
  return isCredentialAllowed(c, forType) ? c : null;
}

export function isSelected(
  selected: PassengerBookInfo[],
  credential: PassengerCredential,
): boolean {
  const key = credentialKey(credential);
  return selected.some((i) => credentialKey(i.credential) === key);
}

/** Drop selection entries for a deleted external passenger or staff credential. */
export function removeDeletedFromSelection(
  current: PassengerBookInfo[],
  target: { passengerId?: string; credential?: PassengerCredential },
): PassengerBookInfo[] {
  if (target.credential) {
    const key = credentialKey(target.credential);
    return current.filter((i) => credentialKey(i.credential) !== key);
  }
  if (target.passengerId) {
    return current.filter((i) => {
      if (i.credential.Id === target.passengerId) return false;
      if ("Id" in i.passenger && i.passenger.Id === target.passengerId) return false;
      return true;
    });
  }
  return current;
}
