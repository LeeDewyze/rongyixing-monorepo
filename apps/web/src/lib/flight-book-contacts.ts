import type { FlightAuthorizedContact, SearchLinkmanOption } from "@ryx/shared-types";

import { FLIGHT_NOTIFY_LANGUAGE_DEFAULT } from "./flight-book-notify";

/** Legacy SearchLinkman `Value`: `email|mobile|accountId` (email may be empty). */
export function parseSearchLinkmanOption(
  item: SearchLinkmanOption,
): FlightAuthorizedContact | null {
  const raw = item.Value?.trim();
  if (!raw?.includes("|")) return null;

  const parts = raw.split("|").map((part) => part.trim());
  if (parts.length < 2) return null;

  const accountId = parts.at(-1);
  if (!accountId) return null;

  let email = "";
  let mobile = "";
  if (parts.length >= 3) {
    email = parts.slice(0, -2).join("|");
    mobile = parts.at(-2) ?? "";
  } else {
    mobile = parts[0] ?? "";
  }

  return {
    accountId,
    name: item.Text?.trim() || accountId,
    email: email || undefined,
    mobile: mobile || undefined,
    notifyLanguage: FLIGHT_NOTIFY_LANGUAGE_DEFAULT,
  };
}

export function authorizedContactNotifyTarget(accountId: string): string {
  return `auth:${accountId}`;
}

export function isAuthorizedContactNotifyTarget(target: string): boolean {
  return target.startsWith("auth:");
}

export function accountIdFromNotifyTarget(target: string): string {
  return target.slice("auth:".length);
}

export function buildAuthorizedLinkmans(
  contacts: FlightAuthorizedContact[],
): import("@ryx/shared-types").FlightBookLinkmanDto[] {
  return contacts.map((contact) => ({
    Id: contact.accountId,
    Name: contact.name.trim(),
    Mobile: contact.mobile?.trim() || undefined,
    Email: contact.email?.trim() || undefined,
    MessageLang: contact.notifyLanguage ?? FLIGHT_NOTIFY_LANGUAGE_DEFAULT,
  }));
}

/** Legacy `fillBookLinkmans` validation — returns user-facing error or null. */
export function validateAuthorizedContacts(contacts: FlightAuthorizedContact[]): string | null {
  for (let index = 0; index < contacts.length; index += 1) {
    const contact = contacts[index];
    const order = index + 1;
    if (!contact?.accountId) {
      return `第${order}个联系人信息不能为空`;
    }
    if (!contact.name?.trim()) {
      return `第${order}个联系人信息Name不能为空`;
    }
    if (!contact.mobile?.trim() && !contact.email?.trim()) {
      return `第${order}个联系人信息Mobile不能为空`;
    }
    const lang = contact.notifyLanguage ?? FLIGHT_NOTIFY_LANGUAGE_DEFAULT;
    if (lang !== "" && lang !== "cn" && lang !== "en") {
      return `第${order}个联系人通知语言不正确`;
    }
  }
  return null;
}
