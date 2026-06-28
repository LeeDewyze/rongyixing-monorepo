import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { FlightCityPickerHostFromForm } from "@/components/flight/common";
import { HomeBusinessPanel } from "@/components/home/HomeBusinessPanel";
import { HomeFlightSearchPanel } from "@/components/home/HomeFlightSearchPanel";
import { HomeNoticeStrip } from "@/components/home/HomeNoticeStrip";
import { HomeProductTabPointer } from "@/components/home/HomeProductTabPointer";
import {
  HomeHeroSection,
  type HomeProductId,
  type HomeTravelMode,
} from "@/components/home/HomeHeroSection";
import { HomeHotelSearchPanel } from "@/components/home/HomeHotelSearchPanel";
import { HomeTrainSearchPanel } from "@/components/home/HomeTrainSearchPanel";
import { HomeRecentTripPanel } from "@/components/home/HomeRecentTripPanel";
import { CityPicker } from "@/components/search";
import { PageToast } from "@/components/layout/PageToast";
import { useFlightSearchForm } from "@/hooks/useFlightSearchForm";
import { useHotelSearchForm } from "@/hooks/useHotelSearchForm";
import { useTrainSearchForm } from "@/hooks/useTrainSearchForm";
import { useQuery } from "@tanstack/react-query";
import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { formatApiError } from "@/lib/formatApiError";
import { buildHomeProductSearch, parseHomeProduct } from "@/lib/home-params";
import { CITY_HISTORY_KEYS, hotelCityPickerAdapter } from "@/lib/hotel-search";
import { resolveHotelCityByLocation } from "@/lib/geolocation";
import { loadHomeTravelMode, saveHomeTravelMode } from "@/lib/flight-travel-mode";
import { trainStationPickerAdapter } from "@/lib/train-search";

function HomeSearchPanelError({ error }: { error: unknown }) {
  return (
    <div className="mx-3 mt-2 rounded-lg bg-white px-3 py-3 text-center">
      <p className="text-sm text-destructive">{formatApiError(error)}</p>
    </div>
  );
}

export function HomeTabPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [travelMode, setTravelMode] = useState<HomeTravelMode>(() => loadHomeTravelMode());
  const [activeProduct, setActiveProduct] = useState<HomeProductId>(() =>
    parseHomeProduct(searchParams),
  );
  const [keyword, setKeyword] = useState("");
  const [hotelLocationLoading, setHotelLocationLoading] = useState(false);
  const [hotelLocationFeedback, setHotelLocationFeedback] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const hotelLocationFeedbackTimer = useRef<number | null>(null);
  const hotelForm = useHotelSearchForm();
  const trainForm = useTrainSearchForm();
  const flightForm = useFlightSearchForm();
  const apiMode = getApiMode();
  const { data: notices = [] } = useQuery({
    queryKey: ["home", "notices"],
    queryFn: () => getApi().notice.getList({ PageIndex: 0, PageSize: 20 }),
    enabled: apiMode !== "mock",
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    setActiveProduct(parseHomeProduct(searchParams));
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (hotelLocationFeedbackTimer.current != null) {
        window.clearTimeout(hotelLocationFeedbackTimer.current);
      }
    };
  }, []);

  function handleProductChange(product: HomeProductId) {
    setActiveProduct(product);
    setSearchParams(buildHomeProductSearch(product), { replace: true });
  }

  function handleHotelSearch() {
    if (hotelForm.validate()) return;
    const params = hotelForm.buildSearchParams();
    const trimmed = keyword.trim();
    if (trimmed) params.set("keyword", trimmed);
    navigate(`/hotel/list?${params.toString()}`);
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
    if (hotelLocationFeedbackTimer.current != null) {
      window.clearTimeout(hotelLocationFeedbackTimer.current);
      hotelLocationFeedbackTimer.current = null;
    }
    setHotelLocationFeedback(null);
    setHotelLocationLoading(true);
    try {
      const result = await resolveHotelCityByLocation();
      const cityName = result.cityName?.trim();
      const matched =
        (result.city
          ? hotelForm.cities.find((city) => city.Code === result.city?.Code) ??
            hotelForm.cities.find((city) => city.Name === result.city?.Name)
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
        hotelForm.setCity(matched);
        setHotelLocationFeedback({ tone: "success", text: `已定位到 ${matched.Name}` });
        hotelLocationFeedbackTimer.current = window.setTimeout(() => {
          setHotelLocationFeedback(null);
          hotelLocationFeedbackTimer.current = null;
        }, 2500);
        return;
      }
      setHotelLocationFeedback({ tone: "error", text: "已获取位置，但未匹配到酒店城市" });
    } catch {
      setHotelLocationFeedback({ tone: "error", text: "定位失败，请重试" });
    } finally {
      setHotelLocationLoading(false);
    }
  }

  function handleTrainStationSelect(station: (typeof trainForm.stations)[number]) {
    if (trainForm.picker === "from") trainForm.setFromStation(station);
    if (trainForm.picker === "to") trainForm.setToStation(station);
  }

  return (
    <div className="min-h-full bg-[#F5F6F9] pb-2">
      <HomeHeroSection
        travelMode={travelMode}
        activeProduct={activeProduct}
        notice={
          <HomeNoticeStrip
            notices={notices}
            onClick={() => navigate("/notice?bulletinType=agentNotice")}
          />
        }
        onTravelModeChange={(mode) => {
          setTravelMode(mode);
          saveHomeTravelMode(mode);
        }}
        onProductChange={handleProductChange}
      />

      {activeProduct === "flight" ? (
        <div className="relative">
          <HomeProductTabPointer product={activeProduct} />
          {flightForm.error ? <HomeSearchPanelError error={flightForm.error} /> : null}
          <HomeFlightSearchPanel
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
        </div>
      ) : null}

      {activeProduct === "hotel" ? (
        <div className="relative">
          <HomeProductTabPointer product={activeProduct} />
          {hotelForm.error ? <HomeSearchPanelError error={hotelForm.error} /> : null}
          <HomeHotelSearchPanel
            city={hotelForm.city}
            keyword={keyword}
            checkIn={hotelForm.checkIn}
            checkOut={hotelForm.checkOut}
            validationError={hotelForm.validationError || undefined}
            onCitySelect={() => hotelForm.setPicker("city")}
            onKeywordChange={setKeyword}
            onCheckInChange={hotelForm.setCheckIn}
            onCheckOutChange={hotelForm.setCheckOut}
            onSearch={handleHotelSearch}
            onMyLocationClick={() => void handleHotelLocation()}
            myLocationLoading={hotelLocationLoading}
            myLocationFeedback={hotelLocationFeedback}
          />
        </div>
      ) : null}

      {activeProduct === "train" ? (
        <div className="relative">
          <HomeProductTabPointer product={activeProduct} />
          {trainForm.error ? <HomeSearchPanelError error={trainForm.error} /> : null}
          <HomeTrainSearchPanel
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
        </div>
      ) : null}

      {travelMode === "business" ? <HomeBusinessPanel /> : null}
      <HomeRecentTripPanel />

      <PageToast
        message={hotelLocationFeedback?.text ?? null}
        tone={hotelLocationFeedback?.tone ?? "error"}
      />

      <FlightCityPickerHostFromForm form={flightForm} />

      <CityPicker
        open={hotelForm.picker === "city"}
        items={hotelForm.cities}
        title="选择酒店城市"
        historyKey={CITY_HISTORY_KEYS.hotel}
        searchPlaceholder="搜索城市名称"
        hotTitle="热门城市"
        historyTitle="历史记录"
        hotGridColumns={3}
        onClose={() => hotelForm.setPicker(null)}
        onSelect={hotelForm.setCity}
        {...hotelCityPickerAdapter}
      />

      <CityPicker
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
