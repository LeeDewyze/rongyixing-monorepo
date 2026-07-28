import type {
  FlightOrderTicket,
  PassengerBookInfo,
  PassengerCredential,
  StaffPassenger,
} from "@ryx/shared-types";
import { maskCredentialNumber } from "@ryx/shared-types";

export function passengerBookInfoFromFlightTicket(
  ticket: FlightOrderTicket,
): PassengerBookInfo | null {
  const traveler = ticket.Traveler;
  const name = traveler?.Name?.trim();
  if (!name) return null;

  // Exchange initialize must use the passenger/account identity. Falling back to
  // OrderFlightTicket.Id makes legacy treat the passenger as the ticket itself.
  const baseId = traveler?.AccountId?.trim() || traveler?.Id?.trim();
  if (!baseId) return null;
  const number = traveler?.CredentialNumber?.trim() ?? "";
  const hideNumber =
    traveler?.CredentialHideNumber?.trim() || (number ? maskCredentialNumber(number) : undefined);
  const credentialId = number ? `${baseId}:${number}` : baseId;
  const clientId = `flight-exchange-${baseId}`;
  const credentialType = traveler?.CredentialTypeCode;
  const credentialTypeName = traveler?.CredentialType?.trim() || undefined;
  const mobile = traveler?.Mobile?.trim() || undefined;

  const credential: PassengerCredential = {
    Id: credentialId,
    AccountId: baseId,
    Name: name,
    Mobile: mobile,
    Number: number || undefined,
    HideNumber: hideNumber,
    Type: credentialType,
    CredentialsType: credentialType,
    TypeName: credentialTypeName,
    CredentialsTypeName: credentialTypeName,
  };
  const passenger: StaffPassenger = {
    Id: baseId,
    AccountId: baseId,
    Name: name,
    Mobile: mobile,
    Number: number || undefined,
    HideNumber: hideNumber,
    CredentialsType: credentialType,
    CredentialsTypeName: credentialTypeName,
    Credentials: [credential],
  };

  return {
    id: clientId,
    passenger,
    credential,
  };
}
