/** Product type for passenger selection (matches legacy FlightHotelTrainType). */
export enum ProductType {
  Flight = 1,
  Hotel = 2,
  Train = 3,
  HotelInternational = 4,
  InternationalFlight = 5,
  RentalCar = 6,
}

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  [ProductType.Flight]: "机票",
  [ProductType.Hotel]: "酒店",
  [ProductType.Train]: "火车",
  [ProductType.HotelInternational]: "国际酒店",
  [ProductType.InternationalFlight]: "国际机票",
  [ProductType.RentalCar]: "租车",
};

/** Legacy credential type codes. */
export enum CredentialType {
  IdCard = 1,
  Passport = 2,
  HmPass = 3,
  TwPass = 4,
  Taiwan = 5,
  HvPass = 6,
  TaiwanEp = 7,
  Other = 8,
  ResidencePermit = 9,
  AlienPermanentResidenceIdCard = 10,
  MilitaryCard = 11,
}

export interface PassengerCredential {
  Id: string;
  AccountId?: string;
  Name: string;
  Mobile?: string;
  OrgName?: string;
  Type?: number | string;
  TypeName?: string;
  CredentialsType?: number | string;
  CredentialsTypeName?: string;
  Number?: string;
  HideNumber?: string;
  HideCredentialsNumber?: string;
}

export interface StaffPassenger {
  Id: string;
  AccountId?: string;
  Name: string;
  Mobile?: string;
  OrgName?: string;
  CredentialsType?: number | string;
  CredentialsTypeName?: string;
  Number?: string;
  HideNumber?: string;
  Credentials?: PassengerCredential[];
}

export interface StaffListParams {
  Name?: string;
  Mobile?: string;
  PageIndex?: number;
  PageSize?: number;
  IsRyx?: boolean;
}

export interface StaffListResponse {
  Staffs: StaffPassenger[];
  TotalCount?: number;
}

/** Selected passenger + credential for booking flows. */
export interface PassengerBookInfo {
  id: string;
  passenger: StaffPassenger | import("./member.js").MemberPassenger;
  credential: PassengerCredential;
  isNotWhitelist?: boolean;
}

export function parseProductType(value: string | null | undefined): ProductType {
  const n = Number(value);
  if (n === ProductType.Flight) return ProductType.Flight;
  if (n === ProductType.Hotel) return ProductType.Hotel;
  if (n === ProductType.Train) return ProductType.Train;
  if (n === ProductType.HotelInternational) return ProductType.HotelInternational;
  if (n === ProductType.InternationalFlight) return ProductType.InternationalFlight;
  if (n === ProductType.RentalCar) return ProductType.RentalCar;
  return ProductType.Flight;
}

export function maxPassengersForProduct(type: ProductType): number {
  switch (type) {
    case ProductType.Hotel:
    case ProductType.HotelInternational:
      return 3;
    case ProductType.Train:
      return 5;
    case ProductType.Flight:
    case ProductType.InternationalFlight:
      return 9;
    default:
      return 9;
  }
}

/** Credential types hidden per product (legacy filteredCredentialsTypes). */
export function blockedCredentialTypes(type: ProductType): number[] {
  switch (type) {
    case ProductType.Flight:
      return [
        CredentialType.HmPass,
        CredentialType.TwPass,
        CredentialType.TaiwanEp,
        CredentialType.ResidencePermit,
      ];
    case ProductType.Train:
      return [CredentialType.HmPass, CredentialType.TwPass, CredentialType.TaiwanEp];
    case ProductType.InternationalFlight:
    case ProductType.HotelInternational:
      return [CredentialType.IdCard];
    default:
      return [];
  }
}

export function credentialTypeValue(c: PassengerCredential): number {
  const raw = c.CredentialsType ?? c.Type;
  return typeof raw === "string" ? Number(raw) || 0 : Number(raw) || 0;
}

export function credentialDisplayType(c: PassengerCredential): string {
  return c.CredentialsTypeName ?? c.TypeName ?? "证件";
}

export function credentialDisplayNumber(c: PassengerCredential): string {
  return c.HideNumber ?? c.HideCredentialsNumber ?? c.Number ?? "";
}

/** Legacy CredentialsEntity.getHideNumber — mask middle digits for alert/UI display. */
export function maskCredentialNumber(number: string): string {
  const nu = number.trim();
  if (!nu) return "";
  if (nu.length < 8) {
    return `${nu.substring(0, 3)}****${nu.substring(7)}`;
  }
  if (nu.length >= 18) {
    return `${nu.substring(0, 6)}********${nu.substring(14)}`;
  }
  return nu;
}

export function credentialKey(c: PassengerCredential): string {
  return `${c.Number ?? ""}:${credentialTypeValue(c)}`;
}

export function staffPrimaryCredential(staff: StaffPassenger): PassengerCredential {
  return {
    Id: staff.Id,
    AccountId: staff.AccountId ?? staff.Id,
    Name: staff.Name,
    Mobile: staff.Mobile,
    OrgName: staff.OrgName,
    Type: staff.CredentialsType,
    TypeName: staff.CredentialsTypeName,
    CredentialsType: staff.CredentialsType,
    CredentialsTypeName: staff.CredentialsTypeName,
    Number: staff.Number,
    HideNumber: staff.HideNumber,
  };
}

export function memberToCredential(p: import("./member.js").MemberPassenger): PassengerCredential {
  const credType = p.CredentialsType ?? p.CredentialType;
  const credTypeName = p.CredentialsTypeName ?? p.CredentialTypeName;
  const number = p.Number ?? p.CredentialNo;
  const hideNumber =
    p.HideCredentialsNumber ??
    p.HideNumber ??
    (number ? `${number.slice(0, 3)}****${number.slice(-4)}` : "");

  return {
    Id: p.Id,
    Name: p.Name,
    Mobile: p.Mobile,
    Type: credType,
    TypeName: credTypeName,
    CredentialsType: credType,
    CredentialsTypeName: credTypeName,
    Number: number,
    HideNumber: hideNumber,
  };
}

export function toHotelBookPassenger(info: PassengerBookInfo): import("./hotel.js").HotelBookPassenger {
  const c = info.credential;
  return {
    Name: c.Name,
    Mobile: c.Mobile,
    CredentialNo: c.Number,
    CredentialType: String(c.CredentialsType ?? c.Type ?? ""),
    travelFormId:
      "travelFormId" in info.passenger ? info.passenger.travelFormId : undefined,
  };
}
