import type {
  MemberPassenger,
  PassengerListParams,
  PassengerListResponse,
  StaffListParams,
  StaffListResponse,
} from "@ryx/shared-types";

import { PASSENGER_FLOW_METHODS } from "../methods/passenger-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface PassengerApi {
  getStaffList(params?: StaffListParams): Promise<StaffListResponse>;
  getPassengerList(params?: PassengerListParams): Promise<PassengerListResponse>;
  addPassenger(passenger: Omit<MemberPassenger, "Id">): Promise<MemberPassenger>;
  removePassenger(id: string): Promise<boolean>;
}

export function createPassengerApi(proxy: ProxyClient): PassengerApi {
  return {
    getStaffList(params = {}) {
      return proxy.send<StaffListResponse>({
        method: PASSENGER_FLOW_METHODS.STAFF_LIST,
        data: { IsRyx: true, ...params },
      });
    },
    getPassengerList(params = {}) {
      return proxy.send<PassengerListResponse>({
        method: PASSENGER_FLOW_METHODS.PASSENGER_LIST,
        data: params,
      });
    },
    addPassenger(passenger) {
      return proxy.send<MemberPassenger>({
        method: PASSENGER_FLOW_METHODS.PASSENGER_ADD,
        data: passenger,
      });
    },
    removePassenger(id) {
      return proxy.send<boolean>({
        method: PASSENGER_FLOW_METHODS.PASSENGER_REMOVE,
        data: { Id: id },
      });
    },
  };
}
