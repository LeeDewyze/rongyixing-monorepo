import type {
  EmailSecurityActionParams,
  EmailSecurityLoad,
  EmailSecuritySendCodeParams,
  ForgotPasswordCheckParams,
  ForgotPasswordCheckResult,
  ForgotPasswordResetParams,
  ForgotPasswordSendCodeParams,
  ForgotPasswordSendCodeResult,
  ForgotPasswordValidateParams,
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
  checkForgotPasswordAccount(
    params: ForgotPasswordCheckParams,
  ): Promise<ForgotPasswordCheckResult>;
  sendForgotPasswordCode(
    params: ForgotPasswordSendCodeParams,
  ): Promise<ForgotPasswordSendCodeResult>;
  validateForgotPasswordCode(params: ForgotPasswordValidateParams): Promise<boolean>;
  resetForgotPassword(params: ForgotPasswordResetParams): Promise<boolean>;
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
    checkForgotPasswordAccount(params) {
      return proxy.send<ForgotPasswordCheckResult>({
        method: PASSWORD_FLOW_METHODS.HOME_ACTION,
        data: {
          Name: params.Name,
          Action: "Check",
        },
        isShowLoading: true,
      });
    },
    sendForgotPasswordCode(params) {
      return proxy.send<ForgotPasswordSendCodeResult>({
        method: PASSWORD_FLOW_METHODS.HOME_SENDCODE,
        data: {
          Name: params.Name,
          ValidateType: params.ValidateType,
        },
        isShowLoading: true,
      });
    },
    validateForgotPasswordCode(params) {
      return proxy.send<boolean>({
        method: PASSWORD_FLOW_METHODS.HOME_ACTION,
        data: {
          Name: params.Name,
          ValidateType: params.ValidateType,
          ValidateValue: params.ValidateValue,
          Action: "Valid",
        },
        isShowLoading: true,
      });
    },
    resetForgotPassword(params) {
      return proxy.send<boolean>({
        method: PASSWORD_FLOW_METHODS.HOME_ACTION,
        data: {
          Name: params.Name,
          Password: params.Password,
          SurePassword: params.SurePassword,
          Action: "Reset",
        },
        isShowLoading: true,
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
