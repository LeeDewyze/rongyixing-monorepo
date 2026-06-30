import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductType } from "@ryx/shared-types";

import { HotelSearchCard } from "@/components/hotel/HotelSearchCard";
import { CityPicker, SearchPageLayout, SearchPassengerButton } from "@/components/search";
import { useHotelSearchForm } from "@/hooks/useHotelSearchForm";
import { formatApiError } from "@/lib/formatApiError";
import { CITY_HISTORY_KEYS, hotelCityPickerAdapter } from "@/lib/hotel-search";

export function HotelSearchPage() {
  const navigate = useNavigate();
  const form = useHotelSearchForm();
  const [keyword, setKeyword] = useState("");

  function handleSearch() {
    if (form.validate()) return;
    const params = form.buildSearchParams();
    const trimmed = keyword.trim();
    if (trimmed) params.set("keyword", trimmed);
    navigate(`/hotel/list?${params.toString()}`);
  }

  function handleKeywordSelect() {
    if (form.validate()) return;
    const params = form.buildSearchParams();
    const trimmed = keyword.trim();
    if (trimmed) params.set("keyword", trimmed);
    navigate(`/hotel/keyword?${params.toString()}`);
  }

  if (form.isLoading) {
    return <p className="p-4 text-muted-foreground">加载中…</p>;
  }

  if (form.error) {
    return <p className="p-4 text-destructive">{formatApiError(form.error)}</p>;
  }

  return (
    <SearchPageLayout
      title="酒店"
      subtitle="因公出行 · 国内酒店"
      theme="sky"
      headerRight={<SearchPassengerButton forType={ProductType.Hotel} returnTo="/hotel" />}
    >
      <HotelSearchCard
        city={form.city}
        keyword={keyword}
        checkIn={form.checkIn}
        checkOut={form.checkOut}
        validationError={form.validationError || undefined}
        onCitySelect={() => form.setPicker("city")}
        onKeywordSelect={handleKeywordSelect}
        onKeywordChange={setKeyword}
        onKeywordClear={() => setKeyword("")}
        onCheckInChange={form.setCheckIn}
        onCheckOutChange={form.setCheckOut}
        onSearch={handleSearch}
      />

      <CityPicker
        open={form.picker === "city"}
        items={form.cities}
        title="选择酒店城市"
        historyKey={CITY_HISTORY_KEYS.hotel}
        searchPlaceholder="搜索城市名称"
        hotTitle="热门城市"
        historyTitle="历史记录"
        hotGridColumns={3}
        tone="form"
        onClose={() => form.setPicker(null)}
        onSelect={form.setCity}
        {...hotelCityPickerAdapter}
      />
    </SearchPageLayout>
  );
}
