import type { FlightPassengerBookSnapshot, PassengerBookInfo } from "@ryx/shared-types";

import { createBookInfo } from "@/lib/passenger-select-logic";

export function passengerBookInfoFromFlightExchangeSnapshot(
  snapshot: FlightPassengerBookSnapshot,
): PassengerBookInfo {
  return {
    ...createBookInfo(snapshot.passenger, snapshot.credential, snapshot.isNotWhitelist),
    id: snapshot.clientId,
  };
}
