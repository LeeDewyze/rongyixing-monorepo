import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { HomeBusinessPanel } from "@/components/home/HomeBusinessPanel";
import { HomeProductTabPointer } from "@/components/home/HomeProductTabPointer";
import {
  HomeHeroSection,
  type HomeProductId,
  type HomeTravelMode,
} from "@/components/home/HomeHeroSection";
import { HomeHotelSearchPanel } from "@/components/home/HomeHotelSearchPanel";
import { HomeRecentTripPanel } from "@/components/home/HomeRecentTripPanel";
import { CityPicker } from "@/components/search";
import { useHotelSearchForm } from "@/hooks/useHotelSearchForm";
import { formatApiError } from "@/lib/formatApiError";
import { CITY_HISTORY_KEYS, hotelCityPickerAdapter } from "@/lib/hotel-search";

export function HomeTabPage() {
  const navigate = useNavigate();
  const [travelMode, setTravelMode] = useState<HomeTravelMode>("business");
  const [activeProduct, setActiveProduct] = useState<HomeProductId>("hotel");
  const [keyword, setKeyword] = useState("");
  const form = useHotelSearchForm();

  function handleProductChange(product: HomeProductId) {
    setActiveProduct(product);
    if (product === "flight") {
      navigate("/flight");
      return;
    }
    if (product === "train") {
      navigate("/train");
    }
  }

  function handleSearch() {
    if (form.validate()) return;
    const params = form.buildSearchParams();
    const trimmed = keyword.trim();
    if (trimmed) params.set("keyword", trimmed);
    navigate(`/hotel/list?${params.toString()}`);
  }

  if (form.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F5F6F9] p-8">
        <p className="text-sm text-[#666666]">加载中…</p>
      </div>
    );
  }

  if (form.error) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F5F6F9] p-8">
        <p className="text-sm text-destructive">{formatApiError(form.error)}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F5F6F9] pb-2">
      <HomeHeroSection
        travelMode={travelMode}
        activeProduct={activeProduct}
        onTravelModeChange={setTravelMode}
        onProductChange={handleProductChange}
      />

      {activeProduct === "hotel" ? (
        <div className="relative">
          <HomeProductTabPointer product={activeProduct} />
          <HomeHotelSearchPanel
            city={form.city}
            keyword={keyword}
            checkIn={form.checkIn}
            checkOut={form.checkOut}
            validationError={form.validationError || undefined}
            onCitySelect={() => form.setPicker("city")}
            onKeywordChange={setKeyword}
            onCheckInChange={form.setCheckIn}
            onCheckOutChange={form.setCheckOut}
            onSearch={handleSearch}
          />
        </div>
      ) : null}

      {travelMode === "business" ? <HomeBusinessPanel /> : null}
      <HomeRecentTripPanel />

      <CityPicker
        open={form.picker === "city"}
        items={form.cities}
        title="选择酒店城市"
        historyKey={CITY_HISTORY_KEYS.hotel}
        searchPlaceholder="搜索城市名称"
        hotTitle="热门城市"
        historyTitle="历史记录"
        hotGridColumns={3}
        onClose={() => form.setPicker(null)}
        onSelect={form.setCity}
        {...hotelCityPickerAdapter}
      />
    </div>
  );
}
