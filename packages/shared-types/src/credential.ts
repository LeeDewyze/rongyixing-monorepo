import { CredentialType } from "./passenger.js";

/** Credential form entry mode — maps to Legacy API branches. */
export type CredentialFormMode = "external" | "staff" | "self";

export interface CredentialFormValues {
  Id?: string;
  Type: number;
  Name: string;
  Number: string;
  Mobile?: string;
  Gender?: string;
  Birthday?: string;
  ExpirationDate?: string;
  StaffId?: string;
  AccountId?: string;
  /** Round-trip from list; defaults to Adult when absent. Not shown in form UI. */
  PassengerType?: number;
  /** Passport English name fields (legacy member-credential-management). */
  Surname?: string;
  Givenname?: string;
}

export interface CredentialPayload extends CredentialFormValues {
  CredentialsType?: number;
  IsRyx?: boolean;
}

export interface StaffCredentialsParams {
  AccountId: string;
  OrderPassengerId?: string;
}

export interface TmcInfo {
  AllowAddingNonTmcUser?: boolean;
  Id?: string;
  Name?: string;
}

export const CREDENTIAL_TYPE_LABELS: Record<number, string> = {
  [CredentialType.IdCard]: "身份证",
  [CredentialType.Passport]: "护照",
  [CredentialType.HmPass]: "港澳通行证",
  [CredentialType.TwPass]: "台湾通行证",
  [CredentialType.Taiwan]: "台胞证",
  [CredentialType.HvPass]: "回乡证",
  [CredentialType.TaiwanEp]: "入台证",
  [CredentialType.Other]: "其他",
  [CredentialType.ResidencePermit]: "港澳台居民居住证",
  [CredentialType.AlienPermanentResidenceIdCard]: "外国人永久居留身份证",
  [CredentialType.MilitaryCard]: "军人证",
};

/** Common credential types shown in the picker form. */
export const CREDENTIAL_TYPE_OPTIONS = [
  CredentialType.IdCard,
  CredentialType.Passport,
  CredentialType.HmPass,
  CredentialType.TwPass,
  CredentialType.Taiwan,
  CredentialType.HvPass,
  CredentialType.ResidencePermit,
  CredentialType.Other,
] as const;

/**
 * Legacy `member-credential-management` identity types:
 * IdCard(1), Passport(2), HvPass(6), Taiwan(5), AlienPermanentResidenceIdCard(10).
 */
export const LEGACY_MEMBER_CREDENTIAL_TYPE_OPTIONS = [
  CredentialType.IdCard,
  CredentialType.Passport,
  CredentialType.HvPass,
  CredentialType.Taiwan,
  CredentialType.AlienPermanentResidenceIdCard,
] as const;

export function isIdCardType(type: number): boolean {
  return type === CredentialType.IdCard;
}

/** Legacy PassengerType.Adult — used in booking flows, not credential CRUD. */
export const PASSENGER_TYPE_ADULT = 1;

export enum PassengerType {
  Adult = 1,
  Children = 2,
  Baby = 3,
  Student = 4,
  Soldier = 5,
}

export const PASSENGER_TYPE_LABELS: Record<number, string> = {
  [PassengerType.Adult]: "成人",
  [PassengerType.Children]: "儿童",
  [PassengerType.Baby]: "婴儿",
  [PassengerType.Student]: "学生",
  [PassengerType.Soldier]: "军人",
};

/**
 * Legacy `Passenger-Add/Modify` body — exact `noEmAddCredentials` MemberCredential spread.
 * Test env reference: `member-api.rtesp.com/Passenger/Add` (no PassengerType / CredentialsType on add).
 */
export interface ExternalPassengerApiPayload {
  Id?: string;
  Gender: string;
  Type: number;
  CredentialsType?: number;
  Number: string;
  Name: string;
  Mobile?: string;
  Country: string;
  IssueCountry: string;
  showCountry?: { Code: string; Name: string };
  showIssueCountry?: { Code: string; Name: string };
  Birthday?: string;
  ExpirationDate?: string;
  Surname?: string;
  Givenname?: string;
  isAdd?: boolean;
  isNotTypeIdCard?: boolean;
  isTypePassport?: boolean;
}

/** Legacy `Credentials-Add/Modify` — MemberCredential only, no PassengerType. */
export interface StaffCredentialApiPayload {
  Id?: string;
  StaffId?: string;
  Gender: string;
  Type: number;
  CredentialsType?: number;
  Number: string;
  Name: string;
  Surname?: string;
  Givenname?: string;
  Mobile?: string;
  Country: string;
  IssueCountry: string;
  Birthday?: string;
  ExpirationDate?: string;
  IsRyx?: boolean;
}

/** @deprecated Prefer ExternalPassengerApiPayload or StaffCredentialApiPayload */
export type MemberCredentialApiPayload = ExternalPassengerApiPayload;
