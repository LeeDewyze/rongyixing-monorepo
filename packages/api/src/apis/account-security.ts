import type {
  EmailSecurityActionParams,
  EmailSecurityLoad,
  EmailSecuritySendCodeParams,
  LoginDeviceItem,
  MobileSecurityActionParams,
  MobileSecurityLoad,
  MobileSecuritySendCodeParams,
  ModifyPasswordParams,
  RemoveLoginDeviceParams,
} from "@ryx/shared-types";

import { PASSWORD_FLOW_METHODS } from "../methods/password-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface AccountSecurityApi {
  modifyPassword(params: ModifyPasswordParams): Promise<boolean>;
  loadMobile(): Promise<MobileSecurityLoad>;
  sendMobileCode(params: MobileSecuritySendCodeParams): Promise<boolean>;
  submitMobileAction(params: MobileSecurityActionParams): Promise<boolean>;
  loadEmail(): Promise<EmailSecurityLoad>;
  sendEmailCode(params: EmailSecuritySendCodeParams): Promise<boolean>;
  submitEmailAction(params: EmailSecurityActionParams): Promise<boolean>;
  listDevices(): Promise<LoginDeviceItem[]>;
  removeDevice(params: RemoveLoginDeviceParams): Promise<boolean>;
}

export function createAccountSecurityApi(proxy: ProxyClient): AccountSecurityApi {
  return {
    modifyPassword(params) {
      return proxy.send<boolean>({
        method: PASSWORD_FLOW_METHODS.PASSWORD_MODIFY,
        data: params,
      });
    },
    loadMobile() {
      return proxy.send<MobileSecurityLoad>({
        method: PASSWORD_FLOW_METHODS.MOBILE_LOAD,
        data: {},
      });
    },
    sendMobileCode(params) {
      return proxy.send<boolean>({
        method: PASSWORD_FLOW_METHODS.MOBILE_SENDCODE,
        data: params,
      });
    },
    submitMobileAction(params) {
      return proxy.send<boolean>({
        method: PASSWORD_FLOW_METHODS.MOBILE_ACTION,
        data: params,
      });
    },
    loadEmail() {
      return proxy.send<EmailSecurityLoad>({
        method: PASSWORD_FLOW_METHODS.EMAIL_LOAD,
        data: {},
      });
    },
    sendEmailCode(params) {
      return proxy.send<boolean>({
        method: PASSWORD_FLOW_METHODS.EMAIL_SENDCODE,
        data: params,
      });
    },
    submitEmailAction(params) {
      return proxy.send<boolean>({
        method: PASSWORD_FLOW_METHODS.EMAIL_ACTION,
        data: params,
      });
    },
    listDevices() {
      return proxy.send<LoginDeviceItem[]>({
        method: PASSWORD_FLOW_METHODS.DEVICE_LIST,
        data: {},
      });
    },
    removeDevice(params) {
      return proxy.send<boolean>({
        method: PASSWORD_FLOW_METHODS.DEVICE_REMOVE,
        data: params,
        isShowLoading: true,
      });
    },
  };
}
