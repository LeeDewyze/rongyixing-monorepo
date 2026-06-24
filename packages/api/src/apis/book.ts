import type {
  BookCostCenterOption,
  BookOrganizationOption,
  SearchApprovalOption,
  SearchLinkmanOption,
} from "@ryx/shared-types";

import { BOOK_METHODS } from "../methods/book.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface BookApi {
  searchLinkman(name: string): Promise<SearchLinkmanOption[]>;
  searchApprovals(params: { name: string; PageIndex?: number; PageSize?: number }): Promise<SearchApprovalOption[]>;
  getOrganizations(): Promise<BookOrganizationOption[]>;
  getCostCenter(name: string): Promise<BookCostCenterOption[]>;
  checkPay(orderId: string): Promise<boolean>;
}

export function createBookApi(proxy: ProxyClient): BookApi {
  return {
    searchLinkman(name) {
      return proxy.send<SearchLinkmanOption[]>({
        method: BOOK_METHODS.HOME_SEARCHLINKMAN,
        data: { name },
      });
    },
    searchApprovals(params) {
      return proxy.send<SearchApprovalOption[]>({
        method: BOOK_METHODS.HOME_SEARCHAPPROVALS,
        data: {
          name: params.name,
          PageIndex: params.PageIndex ?? 1,
          PageSize: params.PageSize ?? 20,
        },
      });
    },
    getOrganizations() {
      return proxy.send<BookOrganizationOption[]>({
        method: BOOK_METHODS.HOME_GETORGANIZATIONS,
        data: {},
      });
    },
    getCostCenter(name) {
      return proxy.send<BookCostCenterOption[]>({
        method: BOOK_METHODS.HOME_GETCOSTCENTER,
        data: { name },
      });
    },
    async checkPay(orderId) {
      const result = await proxy.send<boolean | { Result?: boolean }>({
        method: BOOK_METHODS.HOME_CHECKPAY,
        data: { OrderId: orderId },
      });
      if (typeof result === "boolean") return result;
      return Boolean(result?.Result);
    },
  };
}
