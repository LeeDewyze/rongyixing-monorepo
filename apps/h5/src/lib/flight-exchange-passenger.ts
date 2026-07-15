import type {
  FlightOrderTicket,
  PassengerBookInfo,
  PassengerCredential,
  StaffPassenger,
} from "@ryx/shared-types";

export function passengerBookInfoFromFlightTicket(
  ticket: FlightOrderTicket,
): PassengerBookInfo | null {
  const traveler = ticket.Traveler;
  const name = traveler?.Name?.trim();
  if (!name) return null;

  const baseId = ticket.Id || ticket.Key || name;
  const number = traveler?.CredentialNumber?.trim() ?? "";
  const credentialId = number ? `${baseId}:${number}` : baseId;
  const credentialTypeName = traveler?.CredentialType?.trim() || undefined;
  const mobile = traveler?.Mobile?.trim() || undefined;

  const credential: PassengerCredential = {
    Id: credentialId,
    AccountId: baseId,
    Name: name,
    Mobile: mobile,
    Number: number || undefined,
    HideNumber: number || undefined,
    TypeName: credentialTypeName,
    CredentialsTypeName: credentialTypeName,
  };
  const passenger: StaffPassenger = {
    Id: baseId,
    AccountId: baseId,
    Name: name,
    Mobile: mobile,
    Number: number || undefined,
    HideNumber: number || undefined,
    CredentialsTypeName: credentialTypeName,
    Credentials: [credential],
  };

  return {
    id: credentialId,
    passenger,
    credential,
  };
}
