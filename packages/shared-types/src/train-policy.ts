/** Legacy TrainSeatType enum — aligned with @ear/models TrainSeatType. */
export enum TrainSeatType {
  NoSeat = 1,
  HardSeat = 2,
  SoftSeat = 3,
  HardBerthUp = 4,
  HardBerth = 5,
  HardBerthDown = 6,
  SoftBerthUp = 7,
  SoftBerth = 8,
  HighGradeSoftBerth = 9,
  SecondClassSeat = 10,
  FirstClassSeat = 11,
  SpecialSeat = 12,
  BusinessSeat = 13,
  BusinessBerthUp = 14,
  BusinessBerthDown = 15,
  Other = 16,
  FirstClassBerth = 17,
  FirstClassBerthDown = 18,
  SecondClassBerth = 19,
  SecondClassBerthMiddle = 20,
  SecondClassBerthDown = 21,
}

/** Policy button colors aligned with legacy train list. */
export type TrainPolicyColor = "success" | "warning" | "danger" | "secondary";

export interface TrainBookPolicy {
  TrainNo?: string;
  SeatType?: number;
  IsAllowBook?: boolean;
  IsForceBook?: boolean;
  Rules?: string[];
  Descriptions?: string[];
  color?: TrainPolicyColor;
}

export interface TrainPolicyPassengerResult {
  PassengerKey?: string;
  TrainPolicies?: TrainBookPolicy[];
}

export type TrainPolicyResponse = TrainPolicyPassengerResult[];

/** Legacy Home-Policy request body. */
export interface TrainPolicyParams {
  Passengers: string;
  Trains: string;
  TravelFromId?: string;
}

/** Seat types that support A/B/C/D/F picker on book page. */
export const TRAIN_SELECTABLE_SEAT_TYPES: readonly TrainSeatType[] = [
  TrainSeatType.SecondClassSeat,
  TrainSeatType.FirstClassSeat,
  TrainSeatType.BusinessSeat,
  TrainSeatType.SpecialSeat,
];

export function canSelectTrainSeatType(seatType: number | undefined): boolean {
  if (seatType == null) return false;
  return TRAIN_SELECTABLE_SEAT_TYPES.includes(seatType as TrainSeatType);
}
