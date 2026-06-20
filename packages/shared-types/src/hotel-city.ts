/** Domestic hotel city from Resource-DomesticHotelCity. */
export interface HotelCity {
  Code: string;
  Name: string;
  Nickname?: string;
  Pinyin?: string;
  Initial?: string;
  FirstLetter?: string;
  IsHot?: boolean;
  Sequence?: number;
}

/** Response from TmcApiHomeUrl-Resource-DomesticHotelCity. */
export interface HotelCityResourceResponse {
  Trafficlines?: HotelCity[];
  TrafficLines?: HotelCity[];
  HotelCities?: HotelCity[];
}
