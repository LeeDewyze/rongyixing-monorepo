import type {
  BookCostCenterOption,
  BookOrganizationOption,
  SearchLinkmanOption,
} from "@ryx/shared-types";

import { BOOK_METHODS } from "../methods/book.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface BookApi {
  searchLinkman(name: string): Promise<SearchLinkmanOption[]>;
  getOrganizations(): Promise<BookOrganizationOption[]>;
  getCostCenter(name: string): Promise<BookCostCenterOption[]>;
}

export function createBookApi(proxy: ProxyClient): BookApi {
  return {
    searchLinkman(name) {
      return proxy.send<SearchLinkmanOption[]>({
        method: BOOK_METHODS.HOME_SEARCHLINKMAN,
        data: { name },
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
  };
}
