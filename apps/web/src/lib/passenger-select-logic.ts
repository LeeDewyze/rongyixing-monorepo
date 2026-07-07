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

function credentialIdValue(id: PassengerCredential["Id"] | undefined): string {
  return id == null ? "" : String(id);
}

function credentialAccountIdValue(id: PassengerCredential["AccountId"] | undefined): string {
  return id == null ? "" : String(id);
}

function collectCredentialNumberTokens(credential: PassengerCredential): string[] {
  const tokens = new Set<string>();
  for (const value of [
    credential.Number,
    credential.HideNumber,
    credential.HideCredentialsNumber,
  ]) {
    const trimmed = value?.trim();
    if (trimmed) tokens.add(trimmed);
  }
  return [...tokens];
}

function identityDocumentNumbersMatch(left: string, right: string): boolean {
  if (left === right) return true;

  const leftDigits = left.replace(/\D/g, "");
  const rightDigits = right.replace(/\D/g, "");
  if (!leftDigits || !rightDigits) return false;
  if (leftDigits === rightDigits) return true;
  if (leftDigits.length < 8 || rightDigits.length < 8) return false;

  return (
    leftDigits.slice(0, 6) === rightDigits.slice(0, 6) &&
    leftDigits.slice(-4) === rightDigits.slice(-4)
  );
}

function credentialNumbersMatch(a: PassengerCredential, b: PassengerCredential): boolean {
  const tokensA = collectCredentialNumberTokens(a);
  const tokensB = collectCredentialNumberTokens(b);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  return tokensA.some((left) => tokensB.some((right) => identityDocumentNumbersMatch(left, right)));
}

/** Match credentials across list rows (HideNumber) and persisted selection (full Number). */
export function credentialsMatch(a: PassengerCredential, b: PassengerCredential): boolean {
  const idA = credentialIdValue(a.Id);
  const idB = credentialIdValue(b.Id);
  if (idA && idB && idA === idB) return true;

  // Document number is the strongest signal and survives persisted selections that lost
  // their type metadata, so match on it before the type guard (full vs masked forms).
  if (credentialNumbersMatch(a, b)) return true;

  const hideA = a.HideNumber ?? a.HideCredentialsNumber ?? "";
  const hideB = b.HideNumber ?? b.HideCredentialsNumber ?? "";
  if (hideA && hideB && hideA === hideB) return true;

  // Weaker account/key signals require matching type to avoid conflating one person's
  // multiple credentials (e.g. id card vs passport under the same account).
  if (credentialTypeValue(a) !== credentialTypeValue(b)) return false;

  const accountA = credentialAccountIdValue(a.AccountId);
  const accountB = credentialAccountIdValue(b.AccountId);
  if (accountA && accountB && accountA === accountB) return true;

  const keyA = credentialKey(a);
  const keyB = credentialKey(b);
  if (keyA && keyA === keyB && !keyA.startsWith(":")) return true;

  return false;
}

export function passengerMatchesStaff(item: PassengerBookInfo, staff: StaffPassenger): boolean {
  if ("Id" in item.passenger && item.passenger.Id === staff.Id) return true;
  if (credentialIdValue(item.credential.Id) === credentialIdValue(staff.Id)) return true;

  const staffAccount = credentialAccountIdValue(staff.AccountId ?? staff.Id);
  const itemAccount = credentialAccountIdValue(
    item.credential.AccountId ??
      ("AccountId" in item.passenger ? item.passenger.AccountId : undefined) ??
      ("Id" in item.passenger ? item.passenger.Id : undefined) ??
      item.id,
  );
  if (staffAccount && itemAccount && staffAccount === itemAccount) return true;

  const staffName = staff.Name?.trim();
  const itemName =
    item.credential.Name?.trim() ?? ("Name" in item.passenger ? item.passenger.Name?.trim() : "");
  return Boolean(
    staffName &&
      itemName &&
      staffName === itemName &&
      credentialNumbersMatch(item.credential, staffPrimaryCredential(staff)),
  );
}

export function passengerMatchesMember(item: PassengerBookInfo, member: MemberPassenger): boolean {
  if ("Id" in item.passenger && item.passenger.Id === member.Id) return true;
  if (item.credential.Id === member.Id) return true;

  const memberName = member.Name?.trim();
  const itemName =
    item.credential.Name?.trim() ?? ("Name" in item.passenger ? item.passenger.Name?.trim() : "");
  return Boolean(memberName && itemName && memberName === itemName);
}

function passengerBookInfoEquivalent(a: PassengerBookInfo, b: PassengerBookInfo): boolean {
  return credentialsMatch(a.credential, b.credential);
}

export function passengerSelectionEquivalent(
  left: PassengerBookInfo[],
  right: PassengerBookInfo[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => passengerBookInfoEquivalent(item, right[index]!));
}

/** Refresh persisted selection with current list rows so checkmarks stay in sync. */
export function reconcilePassengerSelectionWithLists(
  selected: PassengerBookInfo[],
  staffList: StaffPassenger[],
  externalList: MemberPassenger[],
  forType: ProductType,
): PassengerBookInfo[] {
  if (selected.length === 0) return selected;

  return selected.map((item) => {
    for (const staff of staffList) {
      if (!passengerMatchesStaff(item, staff)) continue;
      const credentials = staffSelectableCredentials(staff, forType);
      const match =
        credentials.find((credential) => credentialsMatch(credential, item.credential)) ??
        credentials.find(
          (credential) => credentialTypeValue(credential) === credentialTypeValue(item.credential),
        );
      if (match) {
        return createBookInfo(staff, match, item.isNotWhitelist);
      }
    }

    for (const member of externalList) {
      if (!passengerMatchesMember(item, member)) continue;
      const credential = memberSelectableCredential(member, forType);
      if (credential && credentialsMatch(credential, item.credential)) {
        return createBookInfo(member, credential, item.isNotWhitelist);
      }
    }

    return item;
  });
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
      targetAccountId && itemAccountId ? itemAccountId === targetAccountId : item.id === target.id;
    return samePerson ? createBookInfo(item.passenger, credential, item.isNotWhitelist) : item;
  });
}

export function toggleSelection(
  current: PassengerBookInfo[],
  info: PassengerBookInfo,
  checked: boolean,
  forType: ProductType,
): { items: PassengerBookInfo[]; error?: string } {
  if (!checked) {
    return {
      items: current.filter((i) => !credentialsMatch(i.credential, info.credential)),
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
      i.credential.AccountId ?? ("AccountId" in i.passenger ? i.passenger.AccountId : undefined);
    return existingAccount !== accountId;
  });

  const deduped = withoutSameAccount.filter(
    (i) => !credentialsMatch(i.credential, info.credential),
  );

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
  return selected.some((i) => credentialsMatch(i.credential, credential));
}

/** Drop selection entries for a deleted external passenger or staff credential. */
export function removeDeletedFromSelection(
  current: PassengerBookInfo[],
  target: { passengerId?: string; credential?: PassengerCredential },
): PassengerBookInfo[] {
  if (target.credential) {
    return current.filter((i) => !credentialsMatch(i.credential, target.credential!));
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
