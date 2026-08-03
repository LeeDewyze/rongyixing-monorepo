/** Traffic line resource row (airport / train station / hotel city). */
export interface TrafficlineDto {
  Id?: string;
  Code: string;
  Name?: string;
  Nickname?: string;
  CityName?: string;
  Pinyin?: string;
  FirstLetter?: string;
  IsHot?: boolean;
  Tag?: string;
  Sequence?: number;
}

export interface AirportResourceParams {
  LastUpdateTime?: number;
}

export interface AirportResourceResponse {
  Trafficlines?: TrafficlineDto[];
  LastUpdateTime?: number;
}
