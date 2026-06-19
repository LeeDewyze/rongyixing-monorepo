import type {
  MemberProfile,
  MemberPassenger,
  PassengerListParams,
  PassengerListResponse,
} from "@ryx/shared-types";

import { MEMBER_FLOW_METHODS } from "../methods/member-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface MemberApi {
  getProfile(): Promise<MemberProfile>;
  getPassengerList(params?: PassengerListParams): Promise<PassengerListResponse>;
  addPassenger(passenger: Omit<MemberPassenger, "Id">): Promise<MemberPassenger>;
}

export function createMemberApi(proxy: ProxyClient): MemberApi {
  return {
    getProfile() {
      return proxy.send<MemberProfile>({
        method: MEMBER_FLOW_METHODS.MEMBER_GET,
        data: {},
      });
    },
    getPassengerList(params = {}) {
      return proxy.send<PassengerListResponse>({
        method: MEMBER_FLOW_METHODS.PASSENGER_LIST,
        data: params,
      });
    },
    addPassenger(passenger) {
      return proxy.send<MemberPassenger>({
        method: MEMBER_FLOW_METHODS.PASSENGER_ADD,
        data: passenger,
      });
    },
  };
}
