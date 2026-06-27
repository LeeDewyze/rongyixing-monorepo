import type { TrainOrderTicket, TrainOrderTrip } from "@ryx/shared-types";

const SEAT_LETTER_IN_NAME_PATTERN = /(\d+)([A-F])号?/i;
const TRAILING_SEAT_LETTER_PATTERN = /([A-F])$/i;

export interface TrainOrderSeatSource {
  trip?: TrainOrderTrip;
  ticket?: Pick<TrainOrderTicket, "SeatTypeName" | "Detail">;
}

function isSeatSource(
  value: TrainOrderTrip | TrainOrderSeatSource | undefined,
): value is TrainOrderSeatSource {
  return value != null && ("trip" in value || "ticket" in value);
}

function normalizeSeatSource(source?: TrainOrderTrip | TrainOrderSeatSource): TrainOrderSeatSource {
  if (!source) return {};
  if (isSeatSource(source)) return source;
  return { trip: source };
}

function isNumericSeatTypeLabel(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

/** Seat class label for order detail (e.g. 二等座). */
export function formatTrainOrderSeatTypeLabel(
  source?: TrainOrderTrip | TrainOrderSeatSource,
): string | undefined {
  const { trip, ticket } = normalizeSeatSource(source);

  const ticketTypeName = ticket?.SeatTypeName?.trim();
  if (ticketTypeName && !isNumericSeatTypeLabel(ticketTypeName)) {
    return ticketTypeName;
  }

  const tripTypeName = trip?.SeatTypeName?.trim();
  if (tripTypeName && !isNumericSeatTypeLabel(tripTypeName)) {
    return tripTypeName;
  }

  const seatName = trip?.SeatName?.trim();
  if (!seatName) return undefined;

  const tokens = seatName.split(/\s+/).filter(Boolean);
  const typeToken = tokens.find((token) => /座|卧|铺/.test(token));
  return typeToken ?? seatName;
}

/** Seat letter from assigned coach seat (e.g. 001A → A, 06车01A号 → A). */
export function resolveTrainOrderSeatLetter(
  source?: TrainOrderTrip | TrainOrderSeatSource,
): string | undefined {
  const { trip, ticket } = normalizeSeatSource(source);

  const detail = ticket?.Detail?.trim();
  if (detail) {
    const fromDetail =
      detail.match(SEAT_LETTER_IN_NAME_PATTERN) ?? detail.match(/(\d+)([A-F])(?:号)?/i);
    if (fromDetail) {
      return fromDetail[fromDetail.length - 1].toUpperCase();
    }
  }

  const seatNo = trip?.SeatNo?.trim();
  if (seatNo) {
    const trailing = seatNo.match(TRAILING_SEAT_LETTER_PATTERN);
    if (trailing) return trailing[1].toUpperCase();
  }

  const seatName = trip?.SeatName?.trim();
  if (!seatName) return undefined;

  const named = seatName.match(SEAT_LETTER_IN_NAME_PATTERN) ?? seatName.match(/([A-F])号/i);
  if (named) {
    return named[named.length - 1].toUpperCase();
  }

  return undefined;
}

/** Assigned coach/seat text — ticket Detail is shown as returned by the API. */
export function formatTrainOrderSeatAssignment(
  source?: TrainOrderTrip | TrainOrderSeatSource,
): string | undefined {
  const { trip, ticket } = normalizeSeatSource(source);

  const detail = ticket?.Detail?.trim();
  if (detail) return detail;

  const parts: string[] = [];

  const coachNo = trip?.CoachNo?.trim();
  if (coachNo) {
    parts.push(`${coachNo}车`);
  }

  const seatNo = trip?.SeatNo?.trim();
  if (seatNo) {
    parts.push(seatNo);
    return parts.join("");
  }

  const seatName = trip?.SeatName?.trim();
  if (seatName) {
    const named = seatName.match(SEAT_LETTER_IN_NAME_PATTERN);
    if (named) {
      parts.push(`${named[1]}${named[2].toUpperCase()}号`);
      return parts.join("");
    }
  }

  return parts.length > 0 ? parts.join("") : undefined;
}
