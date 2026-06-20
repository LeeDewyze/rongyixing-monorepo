import { useNavigate } from "react-router-dom";
import { ProductType } from "@ryx/shared-types";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent } from "@ryx/ui/components/ui/card";

import {
  CityPicker,
  CitySingleField,
  DateRangeField,
  SearchPageLayout,
  SearchPassengerButton,
} from "@/components/search";
import { useHotelSearchForm } from "@/hooks/useHotelSearchForm";
import { formatApiError } from "@/lib/formatApiError";
import {
  CITY_HISTORY_KEYS,
  displayHotelCity,
  hotelCityPickerAdapter,
} from "@/lib/hotel-search";

export function HotelSearchPage() {
  const navigate = useNavigate();
  const form = useHotelSearchForm();

  function handleSearch() {
    if (form.validate()) return;
    navigate(`/hotel/list?${form.buildSearchParams().toString()}`);
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
      theme="amber"
      headerRight={<SearchPassengerButton forType={ProductType.Hotel} returnTo="/hotel" />}
    >
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="space-y-4 p-4">
          <CitySingleField
            label={displayHotelCity(form.city)}
            onSelect={() => form.setPicker("city")}
          />
          <DateRangeField
            checkIn={form.checkIn}
            checkOut={form.checkOut}
            onCheckInChange={form.setCheckIn}
            onCheckOutChange={form.setCheckOut}
          />
          {form.validationError ? (
            <p className="text-center text-sm text-destructive">{form.validationError}</p>
          ) : null}
          <Button className="h-11 w-full text-base" onClick={handleSearch}>
            查找房源
          </Button>
        </CardContent>
      </Card>

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
    </SearchPageLayout>
  );
}
