import type { MemberPassenger } from "@ryx/shared-types";

export const MOCK_PASSENGERS: MemberPassenger[] = [
  {
    Id: "P001",
    Name: "张三",
    Mobile: "13800138001",
    CredentialNo: "110101199001011234",
    CredentialType: "IdCard",
    CredentialTypeName: "身份证",
    IsSelf: true,
  },
  {
    Id: "P002",
    Name: "李四",
    Mobile: "13800138002",
    CredentialNo: "110101199002021234",
    CredentialType: "IdCard",
    CredentialTypeName: "身份证",
    IsSelf: false,
    travelFormId: "TF001",
  },
];

export const MOCK_MEMBER_PROFILE = {
  Id: "10001",
  Name: "某某某",
  Mobile: "13800138000",
  Email: "demo@rongtrip.cn",
  OrganizationCode: "12344555",
};

export const MOCK_PASSENGER_LIST = {
  Passengers: MOCK_PASSENGERS,
  TotalCount: MOCK_PASSENGERS.length,
};
