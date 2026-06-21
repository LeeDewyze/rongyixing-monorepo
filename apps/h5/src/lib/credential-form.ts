import type { CredentialFormMode, CredentialFormValues, MemberPassenger } from "@ryx/shared-types";
import {
  CredentialType,
  LEGACY_MEMBER_CREDENTIAL_TYPE_OPTIONS,
  PASSENGER_TYPE_ADULT,
  credentialTypeValue,
  isIdCardType,
  memberToCredential,
  type ExternalPassengerApiPayload,
  type StaffCredentialApiPayload,
} from "@ryx/shared-types";

import { normalizeCredentialName, validateCredentialName } from "./credential-name";

/** Legacy `member-credential-management` onAddCredential defaults. */
const LEGACY_CN_COUNTRY = {
  showIssueCountry: { Code: "CN", Name: "中国" },
  showCountry: { Code: "CN", Name: "中国" },
};

/** Legacy `calendarService.getFormatedDate` on non-iOS — `YYYY-MM-DD`. */
function formatCredentialDate(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim();
}

function sharedCredentialFields(values: CredentialFormValues, type: number, idCard: boolean) {
  const number = values.Number.trim();
  return {
    Gender: values.Gender ?? "M",
    Type: type,
    Number: number,
    Name: normalizeCredentialName(values.Name),
    Country: "CN",
    IssueCountry: "CN",
    ...(idCard
      ? {}
      : {
          Birthday: formatCredentialDate(values.Birthday),
          ExpirationDate: formatCredentialDate(values.ExpirationDate),
        }),
  };
}

/**
 * Build Legacy `Passenger-Add/Modify` payload.
 * Matches test env curl: `member-api.rtesp.com/Passenger/Add` + `noEmAddCredentials` spread.
 * @see beeant `member.service.ts` → `noEmAddCredentials` / `member-credential-management` noEmSave
 */
export function toExternalPassengerApiPayload(
  values: CredentialFormValues,
  isModify = false,
): ExternalPassengerApiPayload {
  const type = values.Type;
  const idCard = isIdCardType(type);
  const payload: ExternalPassengerApiPayload = {
    Gender: values.Gender ?? "M",
    Type: type,
    IssueCountry: "CN",
    ...LEGACY_CN_COUNTRY,
    Country: "CN",
    Number: values.Number.trim(),
    Mobile: values.Mobile?.trim() ?? "",
    Name: normalizeCredentialName(values.Name),
    isNotTypeIdCard: !idCard,
    isTypePassport: type === CredentialType.Passport,
    Surname: "",
    Givenname: "",
  };

  if (!idCard) {
    payload.Birthday = formatCredentialDate(values.Birthday);
    payload.ExpirationDate = formatCredentialDate(values.ExpirationDate);
  }

  if (isModify) {
    payload.CredentialsType = type;
    if (values.Id) payload.Id = values.Id;
  } else {
    payload.isAdd = true;
  }

  return payload;
}

/** Build Legacy `Credentials-Add/Modify` payload (staff other credentials). */
export function toStaffCredentialApiPayload(
  values: CredentialFormValues,
  isModify = false,
): StaffCredentialApiPayload {
  const type = values.Type;
  const idCard = isIdCardType(type);
  const payload: StaffCredentialApiPayload = {
    ...sharedCredentialFields(values, type, idCard),
    Mobile: values.Mobile?.trim() ?? "",
    StaffId: values.StaffId,
  };
  if (isModify) payload.CredentialsType = type;
  if (isModify && values.Id) payload.Id = values.Id;
  return payload;
}

export function emptyCredentialForm(staffId?: string): CredentialFormValues {
  return {
    Type: CredentialType.IdCard,
    Name: "",
    Number: "",
    Mobile: "",
    Gender: "M",
    Birthday: "",
    ExpirationDate: "",
    PassengerType: PASSENGER_TYPE_ADULT,
    StaffId: staffId,
  };
}

export function credentialFormFromPassenger(
  passenger: MemberPassenger,
  staffId?: string,
): CredentialFormValues {
  const cred = memberToCredential(passenger);
  return {
    Id: passenger.Id,
    Type: credentialTypeValue(cred) || CredentialType.IdCard,
    Name: passenger.Name,
    Number: cred.Number ?? "",
    Mobile: passenger.Mobile ?? "",
    Gender: passenger.Gender ?? "M",
    PassengerType:
      typeof passenger.PassengerType === "number"
        ? passenger.PassengerType
        : PASSENGER_TYPE_ADULT,
    StaffId: staffId,
    AccountId: passenger.Id,
  };
}

export function credentialFormFromCredential(
  credential: {
    Id: string;
    Name?: string;
    Number?: string;
    Mobile?: string;
    Type?: number | string;
    CredentialsType?: number | string;
  },
  staffId?: string,
): CredentialFormValues {
  const rawType = credential.CredentialsType ?? credential.Type;
  const type =
    typeof rawType === "string" ? Number(rawType) || CredentialType.IdCard : Number(rawType) || CredentialType.IdCard;
  return {
    Id: credential.Id,
    Type: type,
    Name: credential.Name ?? "",
    Number: credential.Number ?? "",
    Mobile: credential.Mobile ?? "",
    Gender: "M",
    PassengerType: PASSENGER_TYPE_ADULT,
    StaffId: staffId,
  };
}

export function validateCredentialForm(
  values: CredentialFormValues,
  mode: CredentialFormMode,
): string | null {
  const nameError = validateCredentialName(values.Name, values.Type);
  if (nameError) return nameError;
  if (!values.Number.trim()) return "请输入证件号码";
  if (mode === "external" && !values.Mobile?.trim()) return "请输入手机号";

  if (!isIdCardType(values.Type)) {
    if (!values.ExpirationDate?.trim()) return "请输入证件有效期";
    if (!values.Birthday?.trim()) return "请输入出生日期";
  }

  return null;
}

export function toCredentialPayload(
  values: CredentialFormValues,
  isModify = false,
): ExternalPassengerApiPayload {
  return toExternalPassengerApiPayload(values, isModify);
}

export function buildCredentialReturnPath(returnTo: string, forType?: number): string {
  const params = new URLSearchParams();
  if (forType != null) params.set("forType", String(forType));
  params.set("returnTo", returnTo);
  return `/passenger/select?${params.toString()}`;
}

export { LEGACY_MEMBER_CREDENTIAL_TYPE_OPTIONS };
