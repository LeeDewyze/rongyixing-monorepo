import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { FlightCityPickerHostFromForm } from "@/components/flight/common";
import { HomeBusinessPanel } from "@/components/home/HomeBusinessPanel";
import { HomeFlightSearchPanel } from "@/components/home/HomeFlightSearchPanel";
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
import { useFlightSearchForm } from "@/hooks/useFlightSearchForm";
import { useHotelSearchForm } from "@/hooks/useHotelSearchForm";
import { useTrainSearchForm } from "@/hooks/useTrainSearchForm";
import { formatApiError } from "@/lib/formatApiError";
import { buildHomeProductSearch, parseHomeProduct } from "@/lib/home-params";
import { CITY_HISTORY_KEYS, hotelCityPickerAdapter } from "@/lib/hotel-search";
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
  const hotelForm = useHotelSearchForm();
  const trainForm = useTrainSearchForm();
  const flightForm = useFlightSearchForm();

  useEffect(() => {
    setActiveProduct(parseHomeProduct(searchParams));
  }, [searchParams]);

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

  function handleTrainStationSelect(station: (typeof trainForm.stations)[number]) {
    if (trainForm.picker === "from") trainForm.setFromStation(station);
    if (trainForm.picker === "to") trainForm.setToStation(station);
  }

  return (
    <div className="min-h-full bg-[#F5F6F9] pb-2">
      <HomeHeroSection
        travelMode={travelMode}
        activeProduct={activeProduct}
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
