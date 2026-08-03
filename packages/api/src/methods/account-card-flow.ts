/** Curated account-card flow Methods (legacy Add/Modify uses a ternary and is not extracted). */
export const ACCOUNT_CARD_FLOW_METHODS = {
  ACCOUNTCARD_ADD: "ApiAccountUrl-AccountCard-Add",
  ACCOUNTCARD_LIST: "ApiAccountUrl-AccountCard-List",
  ACCOUNTCARD_MODIFY: "ApiAccountUrl-AccountCard-Modify",
  ACCOUNTCARD_REMOVE: "ApiAccountUrl-AccountCard-Remove",
} as const;

export type AccountCardFlowMethod =
  (typeof ACCOUNT_CARD_FLOW_METHODS)[keyof typeof ACCOUNT_CARD_FLOW_METHODS];
