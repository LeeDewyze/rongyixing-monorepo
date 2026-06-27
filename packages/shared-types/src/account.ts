/** Raw item from `ApiAccountUrl-Home-GetItems`. */
export interface AccountSettingsItem {
  Name: string;
  Url?: string;
  Type?: string;
  Value?: string;
  Route?: string;
}

export interface AccountSettingsItemsResponse {
  Items?: AccountSettingsItem[];
}

/** Summary from `ApiAccountUrl-Home-Get` (account security page). */
export interface AccountHomeSummary {
  Name?: string;
  Mobile?: string;
  HideMobile?: string;
  Email?: string;
  HideEmail?: string;
  HasPassword?: boolean;
}

export interface ModifyPasswordParams {
  OldPassword: string;
  NewPassword: string;
  SurePassword: string;
}

export interface LoginDeviceItem {
  Id: string;
  Name: string;
}

export interface RemoveLoginDeviceParams {
  Id: string;
}

export interface MobileSecurityLoad {
  Mobile?: string;
  HideMobile?: string;
}

export interface EmailSecurityLoad {
  Email?: string;
  HideEmail?: string;
}

export interface MobileSecuritySendCodeParams {
  Mobile: string;
}

export interface MobileSecurityActionParams {
  Mobile: string;
  Code: string;
}

export interface EmailSecuritySendCodeParams {
  Email: string;
}

export interface EmailSecurityActionParams {
  Email: string;
  Code: string;
}

export type SettingsMenuActionKind = "navigate" | "action" | "external" | "display";

export interface SettingsMenuItem {
  id: string;
  label: string;
  kind: SettingsMenuActionKind;
  value?: string;
  href?: string;
  route?: string;
}
