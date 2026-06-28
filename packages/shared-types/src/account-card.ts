export interface AccountCardVariables {
  BankOutlets?: string;
  Cardholder?: string;
}

export interface AccountCard {
  Id?: string;
  Tag?: string;
  Name: string;
  Number: string;
  Description?: string;
  Variables?: string | AccountCardVariables;
  VariablesObj?: AccountCardVariables;
}

export interface AccountCardListParams {
  PageIndex?: number;
  PageSize?: number;
  Tag?: string;
}

export interface AccountCardFormValues {
  Id?: string;
  Name: string;
  Number: string;
  BankOutlets: string;
  Cardholder: string;
}

export const BANK_NAME_OPTIONS = [
  "中国工商银行",
  "中国农业银行",
  "中国银行",
  "中国建设银行",
  "交通银行",
  "招商银行",
] as const;

export function parseAccountCardVariables(card: AccountCard): AccountCardVariables {
  if (card.VariablesObj) return card.VariablesObj;
  if (!card.Variables) return {};
  if (typeof card.Variables === "object") return card.Variables;
  try {
    const parsed = JSON.parse(card.Variables) as AccountCardVariables;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function normalizeAccountCard(card: AccountCard): AccountCard {
  const VariablesObj = parseAccountCardVariables(card);
  return {
    ...card,
    VariablesObj,
    Variables: typeof card.Variables === "string" ? card.Variables : JSON.stringify(VariablesObj),
  };
}

export function maskBankCardNumber(number: string): string {
  const trimmed = number.replace(/\s+/g, "");
  if (trimmed.length <= 8) return trimmed;
  return `${trimmed.slice(0, 4)} **** **** ${trimmed.slice(-4)}`;
}

export function accountCardToFormValues(card?: AccountCard | null): AccountCardFormValues {
  const variables = card ? parseAccountCardVariables(card) : {};
  return {
    Id: card?.Id,
    Name: card?.Name ?? "",
    Number: card?.Number ?? "",
    BankOutlets: variables.BankOutlets ?? "",
    Cardholder: variables.Cardholder ?? "",
  };
}

export function accountCardFormToPayload(values: AccountCardFormValues): AccountCard {
  const variables: AccountCardVariables = {
    BankOutlets: values.BankOutlets.trim(),
    Cardholder: values.Cardholder.trim(),
  };
  return {
    Id: values.Id,
    Tag: "Bank",
    Name: values.Name.trim(),
    Number: values.Number.replace(/\s+/g, ""),
    Variables: JSON.stringify(variables),
    VariablesObj: variables,
  };
}
