import type { AccountCard } from "@ryx/shared-types";

export const MOCK_ACCOUNT_CARDS: AccountCard[] = [
  {
    Id: "bank-card-1",
    Tag: "Bank",
    Name: "中国建设银行",
    Number: "6227003320123456789",
    Variables: JSON.stringify({
      BankOutlets: "北京朝阳支行",
      Cardholder: "姜茗豪",
    }),
  },
  {
    Id: "bank-card-2",
    Tag: "Bank",
    Name: "招商银行",
    Number: "6214830212345678",
    Variables: JSON.stringify({
      BankOutlets: "上海静安支行",
      Cardholder: "SUN/XUE",
    }),
  },
];
