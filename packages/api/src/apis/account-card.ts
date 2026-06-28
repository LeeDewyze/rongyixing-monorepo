import type { AccountCard, AccountCardListParams } from "@ryx/shared-types";
import { normalizeAccountCard } from "@ryx/shared-types";

import { ACCOUNT_CARD_FLOW_METHODS } from "../methods/account-card-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface AccountCardApi {
  list(params?: AccountCardListParams): Promise<AccountCard[]>;
  save(card: AccountCard): Promise<string | AccountCard>;
  remove(id: string): Promise<string | boolean>;
}

function normalizeAccountCardList(
  res: AccountCard[] | { Cards?: AccountCard[]; Items?: AccountCard[] } | null | undefined,
): AccountCard[] {
  if (!res) return [];
  if (Array.isArray(res)) return res.map(normalizeAccountCard);
  return (res.Cards ?? res.Items ?? []).map(normalizeAccountCard);
}

export function createAccountCardApi(proxy: ProxyClient): AccountCardApi {
  return {
    async list(params = {}) {
      const res = await proxy.send<AccountCard[] | { Cards?: AccountCard[]; Items?: AccountCard[] }>({
        method: ACCOUNT_CARD_FLOW_METHODS.ACCOUNTCARD_LIST,
        data: { PageSize: 50, Tag: "", ...params },
      });
      return normalizeAccountCardList(res);
    },
    save(card) {
      return proxy.send<string | AccountCard>({
        method: card.Id
          ? ACCOUNT_CARD_FLOW_METHODS.ACCOUNTCARD_MODIFY
          : ACCOUNT_CARD_FLOW_METHODS.ACCOUNTCARD_ADD,
        data: { ...card, Tag: "Bank" },
      });
    },
    remove(id) {
      return proxy.send<string | boolean>({
        method: ACCOUNT_CARD_FLOW_METHODS.ACCOUNTCARD_REMOVE,
        data: { Id: id },
      });
    },
  };
}
