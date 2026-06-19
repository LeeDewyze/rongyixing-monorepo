/** Identity entity from ApiHomeUrl-Identity-Get. */
export interface IdentityDto {
  Ticket: string;
  Id: string;
  Name: string;
  IsShareTicket?: boolean;
  Numbers?: Record<string, string>;
  Token?: string;
}

export interface DeviceLoginParams {
  Device?: string;
  Token?: string;
}

export interface PasswordLoginParams {
  Name: string;
  Password: string;
  Device?: string;
}

export interface MobileLoginParams {
  Mobile: string;
  Code: string;
  Device?: string;
}

export interface LoginResultDto {
  Ticket: string;
  Id: string;
  Name: string;
  Token?: string;
}
