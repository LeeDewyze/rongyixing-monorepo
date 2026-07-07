import type { Trafficline } from "@ryx/shared-types";

import { CityPicker } from "@/components/search/CityPicker";
import { CITY_HISTORY_KEYS } from "@/lib/city-picker";
import {
  displayTrafficlineBrowseName,
  displayTrafficlineSearchName,
} from "@/lib/flight-search";

const flightCityAdapter = {
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

interface FlightCityPickerProps {
  open: boolean;
  cities: Trafficline[];
  title: string;
  onClose: () => void;
  onSelect: (city: Trafficline) => void;
}

/** Domestic city picker — legacy tmc-flight-search with isShowAirports=false, isShow3Code=true. */
export function FlightCityPicker({
  open,
  cities,
  title,
  onClose,
  onSelect,
}: FlightCityPickerProps) {
  return (
    <CityPicker
      open={open}
      items={cities}
      title={title}
      historyKey={CITY_HISTORY_KEYS.flight}
      onClose={onClose}
      onSelect={onSelect}
      searchPlaceholder="搜索城市或车站名称"
      hotTitle="热门城市"
      historyTitle="历史记录"
      showCodeInSearch
      showCodeInBrowse
      hotGridColumns={3}
      {...flightCityAdapter}
    />
  );
}
