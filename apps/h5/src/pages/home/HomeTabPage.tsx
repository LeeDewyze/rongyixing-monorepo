import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProductType } from "@ryx/shared-types";

import { FlightCityPickerHostFromForm } from "@/components/flight/common";
import { HomeBusinessPanel } from "@/components/home/HomeBusinessPanel";
import { HomeFlightSearchPanel } from "@/components/home/HomeFlightSearchPanel";
import { HomeNoticeStrip } from "@/components/home/HomeNoticeStrip";
import { HomeProductTabPointer } from "@/components/home/HomeProductTabPointer";
import { HomeSearchPanelLoading } from "@/components/home/HomeProductsLoading";
import {
  HomeHeroSection,
  type HomeProductId,
  type HomeTravelMode,
} from "@/components/home/HomeHeroSection";
import { HomeHotelSearchPanel } from "@/components/home/HomeHotelSearchPanel";
import { HomeTrainSearchPanel } from "@/components/home/HomeTrainSearchPanel";
import { CityPicker } from "@/components/search";
import { PageToast } from "@/components/layout/PageToast";
import { useHomeBanners } from "@/hooks/useHomeBanners";
import { useTravelApplyVisible } from "@/hooks/useTravelApplyVisible";
import { useVisibleHomeProducts } from "@/hooks/useVisibleHomeProducts";
import { onHomeBannerJump } from "@/lib/core-jump";
import { useFlightSearchForm } from "@/hooks/useFlightSearchForm";
import { useHotelSearchForm } from "@/hooks/useHotelSearchForm";
import { useTrainSearchForm } from "@/hooks/useTrainSearchForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { formatApiError } from "@/lib/formatApiError";
import { buildHomeProductSearch, parseHomeProduct } from "@/lib/home-params";
import { CITY_HISTORY_KEYS, displayHotelCity, hotelCityPickerAdapter } from "@/lib/hotel-search";
import { resolveHotelCityByLocation } from "@/lib/geolocation";
import { saveHomeTravelMode } from "@/lib/flight-travel-mode";
import { clearPassengerSelection } from "@/lib/passenger-selection";
import { trainStationPickerAdapter } from "@/lib/train-search";
import { preloadHomeRouteChunks } from "@/lib/route-preload";

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
  const [travelMode, setTravelMode] = useState<HomeTravelMode>("business");
  const [activeProduct, setActiveProduct] = useState<HomeProductId>(() =>
    parseHomeProduct(searchParams),
  );
  const [keyword, setKeyword] = useState("");
  const [hotelLocationLoading, setHotelLocationLoading] = useState(false);
  const [hotelLocationError, setHotelLocationError] = useState<string | null>(null);
  const hotelForm = useHotelSearchForm();
  const trainForm = useTrainSearchForm();
  const flightForm = useFlightSearchForm();
  const apiMode = getApiMode();
  const queryClient = useQueryClient();
  const bannerQuery = useHomeBanners();
  const { products: visibleProducts, isLoading: productsLoading } =
    useVisibleHomeProducts(travelMode);
  const showProductsLoading = productsLoading && visibleProducts.length === 0;
  const travelApplyVisible = useTravelApplyVisible(travelMode);
  const { data: notices = [] } = useQuery({
    queryKey: ["home", "notices"],
    queryFn: () => getApi().notice.getList({ PageIndex: 0, PageSize: 20 }),
    enabled: apiMode !== "mock",
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    saveHomeTravelMode("business");
  }, []);

  useEffect(() => {
    if (showProductsLoading || !visibleProducts.includes(activeProduct)) return;
    preloadHomeRouteChunks(activeProduct);
  }, [activeProduct, showProductsLoading, visibleProducts]);

  useEffect(() => {
    setActiveProduct(parseHomeProduct(searchParams));
  }, [searchParams]);

  useEffect(() => {
    if (visibleProducts.length === 0) return;
    if (!visibleProducts.includes(activeProduct)) {
      const next = visibleProducts[0]!;
      setActiveProduct(next);
      setSearchParams(buildHomeProductSearch(next), { replace: true });
    }
  }, [activeProduct, setSearchParams, visibleProducts]);

  function handleProductChange(product: HomeProductId) {
    setActiveProduct(product);
    setSearchParams(buildHomeProductSearch(product), { replace: true });
  }

  function handleHotelSearch() {
    if (hotelForm.validate()) return;
    clearPassengerSelection(ProductType.Hotel);
    navigate(`/hotel/list?${hotelForm.buildSearchParams(keyword).toString()}`);
  }

  function handleTrainSearch() {
    if (trainForm.validate()) return;
    clearPassengerSelection(ProductType.Train);
    navigate(`/train/list?${trainForm.buildSearchParams().toString()}`);
  }

  function handleFlightSearch() {
    if (flightForm.validate()) return;
    clearPassengerSelection(ProductType.Flight);
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

  return (
    <div className="min-h-full bg-[#F5F6F9] pb-2">
      <HomeHeroSection
        travelMode={travelMode}
        activeProduct={activeProduct}
        visibleProducts={visibleProducts}
        bannerSlides={bannerQuery.data}
        bannerLoading={bannerQuery.isLoading}
        productsLoading={showProductsLoading}
        onBannerClick={(slide) => {
          if (!slide.banner) return;
          void onHomeBannerJump(navigate, {
            Url: slide.banner.Url,
            Name: slide.banner.Name ?? slide.banner.Title,
            Title: slide.banner.Title,
          });
        }}
        notice={
          <HomeNoticeStrip
            notices={notices}
            onClick={() => navigate("/notice?bulletinType=agentNotice")}
          />
        }
        onTravelModeChange={(mode) => {
          setTravelMode(mode);
          saveHomeTravelMode(mode);
          if (mode === "personal") {
            void queryClient.invalidateQueries({
              queryKey: ["home", "visible-products", "personal"],
            });
          }
        }}
        onProductChange={handleProductChange}
      />

      {showProductsLoading ? <HomeSearchPanelLoading /> : null}

      {!showProductsLoading && activeProduct === "flight" && visibleProducts.includes("flight") ? (
        <div className="relative">
          <HomeProductTabPointer product={activeProduct} visibleProducts={visibleProducts} />
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

      {!showProductsLoading && activeProduct === "hotel" && visibleProducts.includes("hotel") ? (
        <div className="relative">
          <HomeProductTabPointer product={activeProduct} visibleProducts={visibleProducts} />
          {hotelForm.error ? <HomeSearchPanelError error={hotelForm.error} /> : null}
          <HomeHotelSearchPanel
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
        </div>
      ) : null}

      {!showProductsLoading && activeProduct === "train" && visibleProducts.includes("train") ? (
        <div className="relative">
          <HomeProductTabPointer product={activeProduct} visibleProducts={visibleProducts} />
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

      {travelMode === "business" && travelApplyVisible ? <HomeBusinessPanel /> : null}

      <PageToast message={hotelLocationError} tone="error" />

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
        onSelect={handleHotelCitySelect}
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
