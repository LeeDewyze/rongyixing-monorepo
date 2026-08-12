/** ryx GetTravelUrl travel type (beeant IGetTravelUrlTravelType). */
export type TravelUrlTravelType = "Flight" | "Hotel" | "Train";

/** Params for TmcApiBookUrl-Home-GetTravelUrl (ryx). */
export interface GetTravelUrlParams {
  staffNumber?: string | null;
  staffOutNumber?: string | null;
  name?: string | null;
  travelType?: TravelUrlTravelType | null;
  outNumberName?: string;
}

/** DingTalk itinerary segment in GetTravelUrl rows (legacy TravelUrlInfo). */
export interface DingTalkTravelRow {
  StartTime?: string;
  EndTime?: string;
  Departure?: string;
  Arrival?: string;
  Vehicle?: string;
  SingleOrReturn?: string;
}

/** Row in GetTravelUrl response (TravelResponseDto / TravelUrlInfo subset). */
export interface TravelUrlRow {
  TravelFormId?: string;
  TravelNumber?: string;
  Subject?: string;
  StartDate?: string;
  EndDate?: string;
  Status?: string;
  StatusType?: string;
  OrganizationName?: string;
  Trips?: string[] | string;
  Partner?: string;
  DingTalkTravels?: DingTalkTravelRow[];
  Passengers?: unknown[];
}

/** Raw GetTravelUrl proxy response (ryx). */
export interface GetTravelUrlResult {
  key?: string;
  value?: {
    Data?: TravelUrlRow[] | null;
    Message?: string;
  };
}

export interface TravelFormDto {
  Id: string;
  TravelNumber?: string;
  Title?: string;
  StartDate?: string;
  EndDate?: string;
  Status?: string;
  StatusName?: string;
  Destination?: string;
}

export interface TravelFormListParams {
  PageIndex?: number;
  PageSize?: number;
  Status?: string;
  /** ryx: passed to GetTravelUrl; default Hotel */
  travelType?: TravelUrlTravelType;
}

export interface TravelFormListResponse {
  TravelForms: TravelFormDto[];
  TotalCount?: number;
}

export interface StaffDto {
  Id: string;
  AccountId?: string;
  Account?: { Id?: string };
  Name: string;
  Nickname?: string;
  Mobile?: string;
  Department?: string;
  OrganizationName?: string;
  OrganizationCode?: string;
  CostCenterCode?: string;
  CostCenterName?: string;
  /** Legacy `StaffBookType` — 1 / Self = self book. */
  BookType?: number | string;
  BookTypeName?: string;
  /** Legacy staff travel policy used by flight/train/hotel business booking. */
  Policy?: Record<string, unknown> | null;
}
