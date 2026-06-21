import type { MemberPassenger } from "@ryx/shared-types";
import { CredentialType } from "@ryx/shared-types";

/** Mutable in-memory store for mock passenger CRUD. */
export let mockPassengers: MemberPassenger[] = [
  {
    Id: "P001",
    Name: "张三",
    Mobile: "13800138001",
    CredentialsType: CredentialType.IdCard,
    CredentialsTypeName: "身份证",
    Number: "110101199001011234",
    HideCredentialsNumber: "110***********1234",
    CredentialNo: "110101199001011234",
    CredentialType: CredentialType.IdCard,
    CredentialTypeName: "身份证",
    IsSelf: true,
  },
  {
    Id: "P002",
    Name: "李四",
    Mobile: "13800138002",
    CredentialsType: CredentialType.IdCard,
    CredentialsTypeName: "身份证",
    Number: "110101199002021234",
    HideCredentialsNumber: "110***********1234",
    CredentialNo: "110101199002021234",
    CredentialType: CredentialType.IdCard,
    CredentialTypeName: "身份证",
    IsSelf: false,
    travelFormId: "TF001",
  },
];

export function resetMockPassengers(): void {
  mockPassengers = structuredClone(mockPassengers);
}
