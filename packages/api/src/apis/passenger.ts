import type {
  ExternalPassengerApiPayload,
  MemberPassenger,
  PassengerCredential,
  PassengerListParams,
  PassengerListResponse,
  StaffCredentialApiPayload,
  StaffCredentialsParams,
  StaffListParams,
  StaffListResponse,
  StaffPassenger,
} from "@ryx/shared-types";

import { PASSENGER_FLOW_METHODS } from "../methods/passenger-flow.js";
import { TMC_METHODS } from "../methods/tmc.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface PassengerApi {
  getStaffList(params?: StaffListParams): Promise<StaffListResponse>;
  getPassengerList(params?: PassengerListParams): Promise<PassengerListResponse>;
  getCredentials(accountId: string): Promise<PassengerCredential[]>;
  getStaffCredentials(params: StaffCredentialsParams): Promise<PassengerCredential[]>;
  addPassenger(payload: ExternalPassengerApiPayload): Promise<MemberPassenger | string>;
  modifyPassenger(payload: ExternalPassengerApiPayload): Promise<MemberPassenger>;
  removePassenger(id: string): Promise<boolean>;
  addStaffCredential(payload: StaffCredentialApiPayload): Promise<string>;
  modifyStaffCredential(payload: StaffCredentialApiPayload): Promise<unknown>;
  removeStaffCredential(payload: StaffCredentialApiPayload): Promise<boolean>;
}

/** Legacy Staff-List returns `Data` as StaffEntity[]; mock uses `{ Staffs, TotalCount }`. */
function normalizeStaffListResponse(
  res: StaffPassenger[] | StaffListResponse | null | undefined,
): StaffListResponse {
  if (!res) return { Staffs: [] };
  if (Array.isArray(res)) return { Staffs: res };
  return {
    Staffs: res.Staffs ?? [],
    TotalCount: res.TotalCount,
  };
}

/** Legacy Passenger-List returns `Data` as PassengerEntity[]; mock uses `{ Passengers, TotalCount }`. */
function normalizeExternalPassenger(raw: MemberPassenger): MemberPassenger {
  return {
    ...raw,
    CredentialNo: raw.CredentialNo ?? raw.Number,
    CredentialType: raw.CredentialType ?? raw.CredentialsType,
    CredentialTypeName: raw.CredentialTypeName ?? raw.CredentialsTypeName,
    HideNumber: raw.HideNumber ?? raw.HideCredentialsNumber,
  };
}

function normalizePassengerListResponse(
  res: MemberPassenger[] | PassengerListResponse | null | undefined,
): PassengerListResponse {
  if (!res) return { Passengers: [] };
  if (Array.isArray(res)) {
    return { Passengers: res.map(normalizeExternalPassenger) };
  }
  return {
    Passengers: (res.Passengers ?? []).map(normalizeExternalPassenger),
    TotalCount: res.TotalCount,
  };
}

function normalizeStaffCredentials(
  res: PassengerCredential[] | null | undefined,
): PassengerCredential[] {
  return res ?? [];
}

function normalizeCredentialsList(
  res:
    | PassengerCredential[]
    | { Credentials?: PassengerCredential[] }
    | null
    | undefined,
): PassengerCredential[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  return res.Credentials ?? [];
}

export function createPassengerApi(proxy: ProxyClient): PassengerApi {
  return {
    async getStaffList(params = {}) {
      const res = await proxy.send<StaffPassenger[] | StaffListResponse>({
        method: PASSENGER_FLOW_METHODS.STAFF_LIST,
        data: { IsRyx: true, ...params },
      });
      return normalizeStaffListResponse(res);
    },
    async getPassengerList(params = {}) {
      const res = await proxy.send<MemberPassenger[] | PassengerListResponse>({
        method: PASSENGER_FLOW_METHODS.PASSENGER_LIST,
        data: params,
      });
      return normalizePassengerListResponse(res);
    },
    async getCredentials(accountId) {
      const res = await proxy.send<PassengerCredential[] | { Credentials?: PassengerCredential[] }>({
        method: TMC_METHODS.CREDENTIALS_LIST,
        data: { accountId },
      });
      return normalizeCredentialsList(res);
    },
    async getStaffCredentials(params) {
      const res = await proxy.send<PassengerCredential[]>({
        method: TMC_METHODS.STAFF_CREDENTIALS,
        data: params,
      });
      return normalizeStaffCredentials(res);
    },
    async addPassenger(payload) {
      const { Id: _id, ...rest } = payload;
      return proxy.send<MemberPassenger | string>({
        method: PASSENGER_FLOW_METHODS.PASSENGER_ADD,
        data: rest,
      });
    },
    modifyPassenger(payload) {
      return proxy.send<MemberPassenger>({
        method: PASSENGER_FLOW_METHODS.PASSENGER_MODIFY,
        data: payload,
      });
    },
    removePassenger(id) {
      return proxy.send<boolean>({
        method: PASSENGER_FLOW_METHODS.PASSENGER_REMOVE,
        data: { Id: id },
      });
    },
    async addStaffCredential(payload) {
      const { Id: _id, ...rest } = payload;
      return proxy.send<string>({
        method: TMC_METHODS.CREDENTIALS_ADD,
        data: { IsRyx: true, ...rest },
      });
    },
    modifyStaffCredential(payload) {
      return proxy.send({
        method: TMC_METHODS.CREDENTIALS_MODIFY,
        data: { IsRyx: true, ...payload },
      });
    },
    removeStaffCredential(payload) {
      return proxy.send<boolean>({
        method: TMC_METHODS.CREDENTIALS_REMOVE,
        data: payload,
      });
    },
  };
}
