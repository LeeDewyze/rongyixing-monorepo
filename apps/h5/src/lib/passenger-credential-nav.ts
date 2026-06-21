import type { MemberPassenger, PassengerCredential, ProductType } from "@ryx/shared-types";

export function buildPassengerSelectReturnPath(forType: ProductType, returnTo: string): string {
  const params = new URLSearchParams({
    forType: String(forType),
    returnTo,
  });
  return `/passenger/select?${params.toString()}`;
}

interface CredentialNavParams {
  mode: "external" | "staff";
  returnTo: string;
  forType: ProductType;
  addNew?: boolean;
  staffId?: string;
  passenger?: MemberPassenger;
  credential?: PassengerCredential;
}

export function buildCredentialPagePath({
  mode,
  returnTo,
  forType,
  addNew,
  staffId,
}: CredentialNavParams): string {
  const params = new URLSearchParams({
    mode,
    returnTo,
    forType: String(forType),
  });
  if (addNew) params.set("addNew", "1");
  if (staffId) params.set("staffId", staffId);
  return `/passenger/credential?${params.toString()}`;
}

export function credentialNavigationState(params: CredentialNavParams) {
  return {
    passenger: params.passenger,
    credential: params.credential,
    staffId: params.staffId,
  };
}
