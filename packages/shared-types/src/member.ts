export interface MemberPassenger {
  Id: string;
  Name: string;
  Mobile?: string;
  CredentialNo?: string;
  CredentialType?: string;
  CredentialTypeName?: string;
  IsSelf?: boolean;
  travelFormId?: string;
}

export interface PassengerListParams {
  Name?: string;
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
}
