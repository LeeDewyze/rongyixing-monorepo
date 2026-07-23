import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { WEB_MAIN_PADDING_CLASS } from "@/components/WebShell";
import { CityPickerDialog } from "@/components/search/CityPickerDialog";
import { WebBusinessPanel } from "@/components/home/WebBusinessPanel";
import { WebHomeNoticeStrip } from "@/components/home/WebHomeNoticeStrip";
import { WebFlightSearchPanel } from "@/components/home/WebFlightSearchPanel";
import {
  WebHomeTopCard,
  type HomeProductId,
  type HomeTravelMode,
} from "@/components/home/WebHomeTopCard";
import { WebHotelSearchPanel } from "@/components/home/WebHotelSearchPanel";
import { WebTrainSearchPanel } from "@/components/home/WebTrainSearchPanel";
import { useHomeBanners } from "@/hooks/useHomeBanners";
import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { useFlightSearchForm } from "@/hooks/useFlightSearchForm";
import { useHotelSearchForm } from "@/hooks/useHotelSearchForm";
import { useTrainSearchForm } from "@/hooks/useTrainSearchForm";
import { CITY_HISTORY_KEYS } from "@/lib/city-picker";
import { onHomeBannerJump } from "@/lib/core-jump";
import { flightCityPickerAdapter } from "@/lib/flight-city-picker";
import { FLIGHT_CITY_SEARCH_PLACEHOLDER } from "@/lib/flight-search";
import { formatApiError } from "@/lib/formatApiError";
import { resolveHotelCityByLocation } from "@/lib/geolocation";
import { buildHomeProductSearch, parseHomeProduct } from "@/lib/home-params";
import { loadHomeTravelMode, saveHomeTravelMode } from "@/lib/flight-travel-mode";
import { displayHotelCity, hotelCityPickerAdapter } from "@/lib/hotel-search";
import { trainStationPickerAdapter } from "@/lib/train-search";

function SearchPanelError({ error }: { error: unknown }) {
  return <p className="text-center text-sm text-destructive">{formatApiError(error)}</p>;
}

export function WebHomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [travelMode, setTravelMode] = useState<HomeTravelMode>(() => loadHomeTravelMode());
  const [activeProduct, setActiveProduct] = useState<HomeProductId>(() =>
    parseHomeProduct(searchParams),
  );
  const [keyword, setKeyword] = useState("");
  const [hotelLocationLoading, setHotelLocationLoading] = useState(false);
  const [hotelLocationError, setHotelLocationError] = useState<string | null>(null);

  const hotelForm = useHotelSearchForm();
  const trainForm = useTrainSearchForm();
  const flightForm = useFlightSearchForm();
  const bannerQuery = useHomeBanners();
  const { data: notices = [] } = useQuery({
    queryKey: ["home", "notices"],
    queryFn: () => getApi().notice.getList({ PageIndex: 0, PageSize: 20 }),
    enabled: getApiMode() !== "mock",
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    setActiveProduct(parseHomeProduct(searchParams));
  }, [searchParams]);

  function handleProductChange(product: HomeProductId) {
    setActiveProduct(product);
    setSearchParams(buildHomeProductSearch(product), { replace: true });
  }

  function handleHotelSearch() {
    if (hotelForm.validate()) return;
    navigate(`/hotel/list?${hotelForm.buildSearchParams(keyword).toString()}`);
  }

  function handleTrainSearch() {
    if (trainForm.validate()) return;
    navigate(`/train/list?${trainForm.buildSearchParams().toString()}`);
  }

  function handleFlightSearch() {
    if (flightForm.validate()) return;
    navigate(`/flight/list?${flightForm.buildSearchParams().toString()}`);
  }

  async function handleHotelLocation() {
    if (hotelLocationLoading) return;
    setHotelLocationError(null);
    setHotelLocationLoading(true);
    try {
      const result = await resolveHotelCityByLocation();
      const cityName = result.cityName?.trim();
      const matched =
        (result.city
          ? (hotelForm.cities.find((city) => city.Code === result.city?.Code) ??
            hotelForm.cities.find((city) => city.Name === result.city?.Name))
          : null) ??
        (cityName
          ? hotelForm.cities.find(
              (city) =>
                city.Name === cityName ||
                city.Nickname === cityName ||
                cityName.includes(city.Name) ||
                city.Name.includes(cityName),
            )
          : null) ??
        result.city;
      if (matched) {
        hotelForm.selectCity(matched);
        if (result.position && result.addressText) {
          hotelForm.setMyPosition({
            lat: result.position.lat,
            lng: result.position.lng,
            text: result.addressText,
          });
          setKeyword("");
        } else {
          hotelForm.clearMyPosition();
        }
        return;
      }
      setHotelLocationError("已获取位置，但未匹配到酒店城市");
    } catch {
      setHotelLocationError("定位失败，请重试");
    } finally {
      setHotelLocationLoading(false);
    }
  }

  function handleHotelKeywordChange(value: string) {
    setKeyword(value);
    if (hotelForm.myPosition && value.trim() !== hotelForm.myPosition.text) {
      hotelForm.clearMyPosition();
    }
  }

  function handleHotelCitySelect(city: (typeof hotelForm.cities)[number]) {
    hotelForm.selectCity(city);
    setKeyword("");
  }

  function handleTrainStationSelect(station: (typeof trainForm.stations)[number]) {
    if (trainForm.picker === "from") trainForm.setFromStation(station);
    if (trainForm.picker === "to") trainForm.setToStation(station);
  }

  function renderSearchPanel() {
    if (activeProduct === "flight") {
      return (
        <>
          {flightForm.error ? <SearchPanelError error={flightForm.error} /> : null}
          <WebFlightSearchPanel
            fromCity={flightForm.fromCity}
            toCity={flightForm.toCity}
            date={flightForm.date}
            validationError={flightForm.validationError || undefined}
            onSelectFrom={() => flightForm.setPicker("from")}
            onSelectTo={() => flightForm.setPicker("to")}
            onSwap={flightForm.swapCities}
            onDateChange={flightForm.setDate}
            onSearch={handleFlightSearch}
          />
        </>
      );
    }
    if (activeProduct === "hotel") {
      return (
        <>
          {hotelForm.error ? <SearchPanelError error={hotelForm.error} /> : null}
          <WebHotelSearchPanel
            city={hotelForm.city}
            cityLabel={hotelForm.myPosition?.text ?? displayHotelCity(hotelForm.city)}
            keyword={keyword}
            checkIn={hotelForm.checkIn}
            checkOut={hotelForm.checkOut}
            validationError={hotelForm.validationError || undefined}
            onCitySelect={() => hotelForm.setPicker("city")}
            onKeywordChange={handleHotelKeywordChange}
            onCheckInChange={hotelForm.setCheckIn}
            onCheckOutChange={hotelForm.setCheckOut}
            onSearch={handleHotelSearch}
            onMyLocationClick={() => void handleHotelLocation()}
            myLocationLoading={hotelLocationLoading}
          />
        </>
      );
    }
    return (
      <>
        {trainForm.error ? <SearchPanelError error={trainForm.error} /> : null}
        <WebTrainSearchPanel
          fromStation={trainForm.fromStation}
          toStation={trainForm.toStation}
          date={trainForm.date}
          validationError={trainForm.validationError || undefined}
          onSelectFrom={() => trainForm.setPicker("from")}
          onSelectTo={() => trainForm.setPicker("to")}
          onSwap={trainForm.swapStations}
          onDateChange={trainForm.setDate}
          onSearch={handleTrainSearch}
        />
      </>
    );
  }

  return (
    <div className={`h-full w-full overflow-y-auto overscroll-y-contain ${WEB_MAIN_PADDING_CLASS}`}>
      <WebHomeTopCard
        travelMode={travelMode}
        activeProduct={activeProduct}
        bannerSlides={bannerQuery.data}
        bannerLoading={bannerQuery.isLoading}
        onBannerClick={(slide) => {
          if (!slide.banner) return;
          void onHomeBannerJump(navigate, {
            Url: slide.banner.Url,
            Name: slide.banner.Name ?? slide.banner.Title,
            Title: slide.banner.Title,
          });
        }}
        onTravelModeChange={(mode) => {
          setTravelMode(mode);
          saveHomeTravelMode(mode);
        }}
        onProductChange={handleProductChange}
        searchPanel={renderSearchPanel()}
        notice={
          <WebHomeNoticeStrip
            notices={notices}
            onClick={() => navigate("/notice?bulletinType=agentNotice")}
          />
        }
      />

      {travelMode === "business" ? <WebBusinessPanel /> : null}

      {hotelLocationError ? (
        <p className="mt-2 text-center text-sm text-destructive" role="alert">
          {hotelLocationError}
        </p>
      ) : null}

      <CityPickerDialog
        open={flightForm.picker === "from"}
        items={flightForm.airports}
        title="选择出发城市"
        historyKey={CITY_HISTORY_KEYS.flight}
        searchPlaceholder={FLIGHT_CITY_SEARCH_PLACEHOLDER}
        hotTitle="热门城市"
        historyTitle="历史记录"
        showCodeInSearch
        showCodeInBrowse
        hotGridColumns={3}
        onClose={() => flightForm.setPicker(null)}
        onSelect={flightForm.setFromCity}
        {...flightCityPickerAdapter}
      />

      <CityPickerDialog
        open={flightForm.picker === "to"}
        items={flightForm.airports}
        title="选择到达城市"
        historyKey={CITY_HISTORY_KEYS.flight}
        searchPlaceholder={FLIGHT_CITY_SEARCH_PLACEHOLDER}
        hotTitle="热门城市"
        historyTitle="历史记录"
        showCodeInSearch
        showCodeInBrowse
        hotGridColumns={3}
        onClose={() => flightForm.setPicker(null)}
        onSelect={flightForm.setToCity}
        {...flightCityPickerAdapter}
      />

      <CityPickerDialog
        open={hotelForm.picker === "city"}
        items={hotelForm.cities}
        title="选择酒店城市"
        historyKey={CITY_HISTORY_KEYS.hotel}
        searchPlaceholder="搜索城市名称"
        hotTitle="热门城市"
        historyTitle="历史记录"
        hotGridColumns={3}
        onClose={() => hotelForm.setPicker(null)}
        onSelect={handleHotelCitySelect}
        {...hotelCityPickerAdapter}
      />

      <CityPickerDialog
        open={trainForm.picker !== null}
        items={trainForm.stations}
        title={trainForm.picker === "from" ? "选择出发城市" : "选择到达城市"}
        historyKey={CITY_HISTORY_KEYS.train}
        searchPlaceholder="搜索城市或车站名称"
        hotTitle="热门火车站"
        historyTitle="历史记录"
        onClose={() => trainForm.setPicker(null)}
        onSelect={handleTrainStationSelect}
        {...trainStationPickerAdapter}
      />
    </div>
  );
}
