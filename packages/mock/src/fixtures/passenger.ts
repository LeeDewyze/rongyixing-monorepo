import type { StaffPassenger } from "@ryx/shared-types";
import { CredentialType } from "@ryx/shared-types";

export const MOCK_STAFF: StaffPassenger[] = [
  {
    Id: "S001",
    AccountId: "S001",
    Name: "王五",
    Mobile: "13900139001",
    OrgName: "研发部",
    CredentialsType: CredentialType.IdCard,
    CredentialsTypeName: "身份证",
    Number: "110101199005051234",
    HideNumber: "110***********1234",
    Credentials: [
      {
        Id: "C001-P",
        AccountId: "S001",
        Name: "王五",
        Mobile: "13900139001",
        CredentialsType: CredentialType.Passport,
        CredentialsTypeName: "护照",
        Type: CredentialType.Passport,
        TypeName: "护照",
        Number: "E12345678",
        HideNumber: "E****5678",
      },
    ],
  },
  {
    Id: "S002",
    AccountId: "S002",
    Name: "赵六",
    Mobile: "13900139002",
    OrgName: "市场部",
    CredentialsType: CredentialType.IdCard,
    CredentialsTypeName: "身份证",
    Number: "110101199006061234",
    HideNumber: "110***********1234",
    Credentials: [],
  },
  {
    Id: "S003",
    AccountId: "S003",
    Name: "孙七",
    Mobile: "13900139003",
    OrgName: "财务部",
    CredentialsType: CredentialType.IdCard,
    CredentialsTypeName: "身份证",
    Number: "110101199007071234",
    HideNumber: "110***********1234",
    Credentials: [],
  },
];

export function filterMockStaff(
  keyword: string,
  pageIndex: number,
  pageSize: number,
): { Staffs: StaffPassenger[]; TotalCount: number } {
  const q = keyword.trim().toLowerCase();
  let list = MOCK_STAFF;
  if (q) {
    list = list.filter(
      (s) =>
        s.Name.toLowerCase().includes(q) ||
        (s.Mobile ?? "").includes(q),
    );
  }
  const start = pageIndex * pageSize;
  const slice = list.slice(start, start + pageSize);
  return { Staffs: slice, TotalCount: list.length };
}
