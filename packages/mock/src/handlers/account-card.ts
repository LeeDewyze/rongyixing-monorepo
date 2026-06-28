import type { AccountCard, IResponse } from "@ryx/shared-types";
import { accountCardFormToPayload, accountCardToFormValues } from "@ryx/shared-types";
import { ACCOUNT_CARD_FLOW_METHODS, successResponse } from "@ryx/api";

import { MOCK_ACCOUNT_CARDS } from "../fixtures/account-card.js";

let accountCards = MOCK_ACCOUNT_CARDS.map((card) => ({ ...card }));

function validateCard(data: unknown): AccountCard | IResponse<null> {
  const card = data as AccountCard;
  const values = accountCardToFormValues(card);
  if (!values.Name) {
    return { Status: false, Code: "VALIDATE", Message: "请选择发卡银行", Data: null };
  }
  if (!values.Cardholder) {
    return { Status: false, Code: "VALIDATE", Message: "请填写持卡人姓名", Data: null };
  }
  if (!values.Number) {
    return { Status: false, Code: "VALIDATE", Message: "请填写卡号", Data: null };
  }
  return accountCardFormToPayload(values);
}

function isValidationError(card: AccountCard | IResponse<null>): card is IResponse<null> {
  return "Status" in card && card.Status === false;
}

export function createAccountCardMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [ACCOUNT_CARD_FLOW_METHODS.ACCOUNTCARD_LIST]: () => successResponse(accountCards),
    [ACCOUNT_CARD_FLOW_METHODS.ACCOUNTCARD_ADD]: (data) => {
      const card = validateCard(data);
      if (isValidationError(card)) return card;
      const saved = {
        ...card,
        Id: `bank-card-${Date.now()}`,
      };
      accountCards = [saved, ...accountCards];
      return successResponse(saved.Id);
    },
    [ACCOUNT_CARD_FLOW_METHODS.ACCOUNTCARD_MODIFY]: (data) => {
      const card = validateCard(data);
      if (isValidationError(card)) return card;
      if (!card.Id) {
        return { Status: false, Code: "VALIDATE", Message: "请选择银行卡", Data: null };
      }
      accountCards = accountCards.map((item) => (item.Id === card.Id ? card : item));
      return successResponse(card.Id);
    },
    [ACCOUNT_CARD_FLOW_METHODS.ACCOUNTCARD_REMOVE]: (data) => {
      const params = data as { Id?: string };
      if (!params.Id) {
        return { Status: false, Code: "VALIDATE", Message: "请选择银行卡", Data: null };
      }
      accountCards = accountCards.filter((card) => card.Id !== params.Id);
      return successResponse(true);
    },
  };
}
