import type { Trafficline } from "@ryx/shared-types";

import { displayTrafficlineBrowseName, displayTrafficlineSearchName } from "@/lib/flight-search";

/** Flight city picker adapter — matches h5 FlightCityPicker. */
export const flightCityPickerAdapter = {
  getId: (city: Trafficline) => city.Id,
  getCode: (city: Trafficline) => city.Code,
  getName: (city: Trafficline) => displayTrafficlineBrowseName(city),
  getSearchName: (city: Trafficline) => displayTrafficlineSearchName(city),
  getPinyin: (city: Trafficline) => city.Pinyin,
  getCityName: (city: Trafficline) => city.CityName,
  getIsHot: (city: Trafficline) => Boolean(city.IsHot),
  getIsDeprecated: (city: Trafficline) =>
    Boolean(city.IsDeprecated) ||
    city.Name === "北京南苑" ||
    city.Nickname === "北京南苑" ||
    city.CityName === "北京南苑",
  getSequence: (city: Trafficline) => city.Sequence,
  getFirstLetter: (city: Trafficline) => {
    const letter = city.FirstLetter ?? city.Initial;
    if (letter) return letter.charAt(0).toUpperCase();
    return undefined;
  },
  getSearchValues: (city: Trafficline) =>
    [
      city.Code,
      city.Name,
      city.Nickname,
      city.CityName,
      city.Pinyin,
      city.Initial,
      city.AirportCityCode,
    ].filter(Boolean) as string[],
};
