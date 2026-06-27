import type {
  AccountHomeSummary,
  AccountSettingsItemsResponse,
  SettingsMenuItem,
} from "@ryx/shared-types";

import { adaptAccountSettingsItems } from "./account-settings-adapter.js";
import { ACCOUNT_FLOW_METHODS } from "../methods/account-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface AccountApi {
  getSettingsMenu(): Promise<SettingsMenuItem[]>;
  getHomeSummary(): Promise<AccountHomeSummary>;
  logout(): Promise<boolean>;
}

export function createAccountApi(proxy: ProxyClient): AccountApi {
  return {
    async getSettingsMenu() {
      const res = await proxy.send<AccountSettingsItemsResponse>({
        method: ACCOUNT_FLOW_METHODS.HOME_GETITEMS,
        data: {},
      });
      return adaptAccountSettingsItems(res?.Items);
    },
    getHomeSummary() {
      return proxy.send<AccountHomeSummary>({
        method: ACCOUNT_FLOW_METHODS.HOME_GET,
        data: {},
      });
    },
    logout() {
      return proxy.send<boolean>({
        method: ACCOUNT_FLOW_METHODS.HOME_LOGOUT,
        data: {},
      });
    },
  };
}
