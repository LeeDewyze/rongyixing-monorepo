import type {
  BookCostCenterOption,
  BookOrganizationOption,
  SearchApprovalOption,
  SearchLinkmanOption,
} from "@ryx/shared-types";

import { BOOK_METHODS } from "../methods/book.js";
import { TMC_METHODS } from "../methods/tmc.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface BookApi {
  searchLinkman(name: string): Promise<SearchLinkmanOption[]>;
  searchApprovals(params: { name: string; PageIndex?: number; PageSize?: number }): Promise<SearchApprovalOption[]>;
  getOrganizations(): Promise<BookOrganizationOption[]>;
  getCostCenter(name: string): Promise<BookCostCenterOption[]>;
  getCountries(params?: { channel?: "tmc" | "tourist" }): Promise<unknown[]>;
  checkPay(
    input:
      | string
      | {
          orderId: string;
          channel?: "tmc" | "tourist";
          productType?: "Flight" | "Train" | "Hotel";
        },
  ): Promise<boolean>;
}

function resolveCheckPayInput(input: Parameters<BookApi["checkPay"]>[0]): {
  orderId: string;
  method: string;
} {
  if (typeof input === "string") {
    return { orderId: input, method: BOOK_METHODS.HOME_CHECKPAY };
  }
  if (input.channel === "tourist" && input.productType) {
    return {
      orderId: input.orderId,
      method: `TmcTouristBookUrl-${input.productType}-CheckPay`,
    };
  }
  return { orderId: input.orderId, method: BOOK_METHODS.HOME_CHECKPAY };
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
    async getCountries(params = {}) {
      const result = await proxy.send<unknown[] | { Countries?: unknown[] }>({
        method: params.channel === "tourist" ? BOOK_METHODS.HOME_COUNTRY : TMC_METHODS.AGENT_COUNTRY,
        data: {},
      });
      if (Array.isArray(result)) return result;
      return result?.Countries ?? [];
    },
    async checkPay(input) {
      const { orderId, method } = resolveCheckPayInput(input);
      const result = await proxy.send<boolean | { Result?: boolean }>({
        method,
        data: { OrderId: orderId },
      });
      if (typeof result === "boolean") return result;
      return Boolean(result?.Result);
    },
  };
}
