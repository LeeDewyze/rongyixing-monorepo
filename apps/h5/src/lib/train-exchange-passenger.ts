import type {
  PassengerBookInfo,
  TrainPassengerBookSnapshot,
  TrainExchangeInfo,
} from "@ryx/shared-types";

import { createBookInfo } from "@/lib/passenger-select-logic";

export function passengerBookInfoFromExchangeSnapshot(
  snapshot: TrainPassengerBookSnapshot,
): PassengerBookInfo {
  return {
    ...createBookInfo(snapshot.passenger, snapshot.credential, snapshot.isNotWhitelist),
    id: snapshot.clientId,
  };
}

export function enrichExchangePassengerContact(
  passenger: PassengerBookInfo,
  exchangeInfo: TrainExchangeInfo,
): PassengerBookInfo {
  const passengerRecord = passenger.passenger as { Mobile?: string };
  const mobile =
    passenger.credential.Mobile?.trim() ||
    passengerRecord.Mobile?.trim() ||
    exchangeInfo.PassengerMobile?.trim();
  if (!mobile) return passenger;

  return {
    ...passenger,
    credential: {
      ...passenger.credential,
      Mobile: passenger.credential.Mobile ?? mobile,
    },
    passenger: {
      ...passenger.passenger,
      Mobile: passengerRecord.Mobile ?? mobile,
    },
  };
}
