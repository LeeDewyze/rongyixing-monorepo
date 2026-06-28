import type {
  GetTravelUrlParams,
  GetTravelUrlResult,
  StaffDto,
  TravelFormListParams,
  TravelFormListResponse,
  TravelUrlRow,
} from "@ryx/shared-types";

import { TRAVEL_FLOW_METHODS } from "../methods/travel-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

function mapTravelUrlRows(rows: TravelUrlRow[]): TravelFormListResponse {
  const travelForms = rows.map((row) => ({
    Id: row.TravelFormId ?? row.TravelNumber ?? "",
    TravelNumber: row.TravelNumber,
    Title: row.Subject ?? row.OrganizationName,
    StartDate: row.StartDate,
    EndDate: row.EndDate,
    Status: row.StatusType ?? row.Status,
    StatusName: row.Status,
    Destination: row.Trips?.[0],
  }));

  return {
    TravelForms: travelForms.filter((form) => Boolean(form.Id)),
    TotalCount: travelForms.length,
  };
}

export interface TravelApi {
  /** ryx: TmcApiBookUrl-Home-GetTravelUrl */
  getTravelUrl(params?: GetTravelUrlParams): Promise<GetTravelUrlResult>;
  /** ryx default: maps GetTravelUrl rows to TravelFormDto list */
  getTravelForms(params?: TravelFormListParams): Promise<TravelFormListResponse>;
  /** jyx-only: FeatureRonglvUrl-jyx-GetTravelForms */
  getTravelFormsJyx(params?: TravelFormListParams): Promise<TravelFormListResponse>;
  getStaff(staffId?: string): Promise<StaffDto>;
}

export function createTravelApi(proxy: ProxyClient): TravelApi {
  return {
    getTravelUrl(params = {}) {
      return proxy.send<GetTravelUrlResult>({
        method: TRAVEL_FLOW_METHODS.GET_TRAVEL_URL,
        data: {
          staffNumber: params.staffNumber ?? null,
          staffOutNumber: params.staffOutNumber ?? null,
          name: params.name ?? null,
          travelType: params.travelType ?? null,
          outNumberName: params.outNumberName ?? "TravelNumber",
        },
      });
    },

    async getTravelForms(params = {}) {
      const result = await this.getTravelUrl({
        staffNumber: null,
        staffOutNumber: null,
        name: null,
        travelType: params.travelType ?? "Hotel",
      });
      const rows = result.value?.Data ?? [];
      return mapTravelUrlRows(rows);
    },

    getTravelFormsJyx(params = {}) {
      return proxy.send<TravelFormListResponse>({
        method: TRAVEL_FLOW_METHODS.JYX_GET_TRAVEL_FORMS,
        data: params,
      });
    },

    getStaff(staffId?: string) {
      return proxy.send<StaffDto>({
        method: TRAVEL_FLOW_METHODS.STAFF_GET,
        data: staffId ? { Id: staffId } : undefined,
        requestFields: { forceRefresh: true },
      });
    },
  };
}
