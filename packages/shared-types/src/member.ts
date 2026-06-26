export interface MemberPassenger {
  Id: string;
  Name: string;
  Mobile?: string;
  CredentialNo?: string;
  CredentialType?: string | number;
  CredentialTypeName?: string;
  /** Legacy Passenger-List fields */
  CredentialsType?: number | string;
  CredentialsTypeName?: string;
  Number?: string;
  HideNumber?: string;
  HideCredentialsNumber?: string;
  PassengerType?: number;
  PassengerTypeName?: string;
  IsSelf?: boolean;
  travelFormId?: string;
  travelNumber?: string;
  Policy?: Record<string, unknown>;
  /** Legacy passenger gender (M/F). */
  Gender?: string;
}

export interface PassengerListParams {
  Name?: string;
  Mobile?: string;
  PageIndex?: number;
  PageSize?: number;
}

export interface PassengerListResponse {
  Passengers: MemberPassenger[];
  TotalCount?: number;
}

export interface MemberProfile {
  Id: string;
  Name: string;
  Mobile?: string;
  Email?: string;
  /** Legacy Member-Get organization code. */
  OrganizationCode?: string;
  /** Legacy `StaffBookType` — 1 = self book. */
  BookType?: number;
}
