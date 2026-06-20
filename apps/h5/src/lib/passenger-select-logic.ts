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

export function createBookInfo(
  passenger: StaffPassenger | MemberPassenger,
  credential: PassengerCredential,
  isNotWhitelist = false,
): PassengerBookInfo {
  return {
    id: credential.Id,
    passenger,
    credential,
    isNotWhitelist,
  };
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
