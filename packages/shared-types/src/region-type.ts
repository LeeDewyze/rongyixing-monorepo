/** Legacy `IRegionType` from TmcApiHomeUrl-Home-GetRegionType. */
export interface RegionType {
  HasFlight: boolean;
  HasInternationalFlight: boolean;
  HasTrain: boolean;
  HasHotel: boolean;
  HasInternationalHotel: boolean;
  HasGP: boolean;
  HasCar: boolean;
  HasRentalCar: boolean;
}

export type HomeBookProduct = "flight" | "train" | "hotel";
