import { useNavigate } from "react-router-dom";
import { ProductType } from "@ryx/shared-types";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent } from "@ryx/ui/components/ui/card";

import {
  CityPairField,
  CityPicker,
  DateField,
  SearchPageLayout,
  SearchPassengerButton,
} from "@/components/search";
import { useTrainSearchForm } from "@/hooks/useTrainSearchForm";
import { formatApiError } from "@/lib/formatApiError";
import {
  CITY_HISTORY_KEYS,
  displayStationName,
  trainStationPickerAdapter,
} from "@/lib/train-search";

export function TrainSearchPage() {
  const navigate = useNavigate();
  const form = useTrainSearchForm();

  function handleSearch() {
    if (form.validate()) return;
    navigate(`/train/list?${form.buildSearchParams().toString()}`);
  }

  if (form.isLoading) {
    return <p className="p-4 text-muted-foreground">加载中…</p>;
  }

  if (form.error) {
    return <p className="p-4 text-destructive">{formatApiError(form.error)}</p>;
  }

  function handleSelect(station: (typeof form.stations)[number]) {
    if (form.picker === "from") form.setFromStation(station);
    if (form.picker === "to") form.setToStation(station);
  }

  return (
    <SearchPageLayout
      title="火车票"
      subtitle="因公出行 · 国内列车"
      theme="emerald"
      headerRight={<SearchPassengerButton forType={ProductType.Train} returnTo="/train" />}
    >
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="space-y-5 p-4">
          <CityPairField
            fromLabel={displayStationName(form.fromStation)}
            toLabel={displayStationName(form.toStation)}
            fromPlaceholder="出发站"
            toPlaceholder="到达站"
            swapping={form.swapping}
            onSelectFrom={() => form.setPicker("from")}
            onSelectTo={() => form.setPicker("to")}
            onSwap={form.swapStations}
          />
          <DateField value={form.date} onChange={form.setDate} label="出发日期" />
          {form.validationError ? (
            <p className="text-center text-sm text-destructive">{form.validationError}</p>
          ) : null}
          <Button className="h-11 w-full text-base" onClick={handleSearch}>
            查询车次
          </Button>
        </CardContent>
      </Card>

      <CityPicker
        open={form.picker !== null}
        items={form.stations}
        title={form.picker === "from" ? "选择出发城市" : "选择到达城市"}
        historyKey={CITY_HISTORY_KEYS.train}
        searchPlaceholder="搜索城市或车站名称"
        hotTitle="热门火车站"
        historyTitle="历史记录"
        onClose={() => form.setPicker(null)}
        onSelect={handleSelect}
        {...trainStationPickerAdapter}
      />
    </SearchPageLayout>
  );
}
