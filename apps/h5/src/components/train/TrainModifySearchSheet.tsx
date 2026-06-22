import { useEffect, useState } from "react";
import type { TrainStation } from "@ryx/shared-types";
import { Button } from "@ryx/ui/components/ui/button";

import { CalendarPickerSheet } from "@/components/calendar/CalendarPickerSheet";
import { CityPicker } from "@/components/search/CityPicker";
import { useTrainSearchForm } from "@/hooks/useTrainSearchForm";
import type { TrainSearchQueryInitial } from "@/hooks/useTrainSearchForm";
import { TRAIN_CALENDAR_CONFIG } from "@/lib/calendar-picker";
import { CITY_HISTORY_KEYS } from "@/lib/city-picker";
import { formatHotelDateShort, relativeDayLabel } from "@/lib/date-search";
import { formatApiError } from "@/lib/formatApiError";
import { displayStationName, trainStationPickerAdapter } from "@/lib/train-search";
import { HOME_ASSETS } from "@/config/home-assets";

interface TrainModifySearchSheetProps {
  open: boolean;
  initial: TrainSearchQueryInitial;
  onClose: () => void;
  onSearch: (params: URLSearchParams) => void;
}

function SwapStationsIcon({ onSwap }: { onSwap: () => void }) {
  return (
    <button
      type="button"
      aria-label="交换出发站和到达站"
      className="flex shrink-0 items-center justify-center"
      onClick={onSwap}
    >
      <img
        src={HOME_ASSETS.products.train.swapStations}
        alt=""
        width={27}
        height={24}
        className="block h-6 w-[27.32px] object-contain"
        aria-hidden
      />
    </button>
  );
}

/** Full-screen overlay to modify stations/date on train list page. */
export function TrainModifySearchSheet({
  open,
  initial,
  onClose,
  onSearch,
}: TrainModifySearchSheetProps) {
  const form = useTrainSearchForm({ enabled: open });
  const { stations, resetFromQuery } = form;
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!open || !stations.length) return;
    resetFromQuery(initial);
  }, [
    open,
    initial.fromCode,
    initial.toCode,
    initial.fromName,
    initial.toName,
    initial.date,
    stations.length,
    resetFromQuery,
  ]);

  if (!open) return null;

  function handleSubmit() {
    if (form.validate()) return;
    onSearch(form.buildSearchParams());
    onClose();
  }

  function handleStationSelect(station: TrainStation) {
    if (form.picker === "from") {
      form.setFromStation(station);
    } else if (form.picker === "to") {
      form.setToStation(station);
    }
    form.setPicker(null);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            返回
          </Button>
          <h2 className="flex-1 text-center text-base font-semibold">修改查询</h2>
          <span className="w-12" />
        </header>

        {form.isLoading && <p className="p-4 text-sm text-muted-foreground">加载车站数据…</p>}

        {form.error && <p className="p-4 text-sm text-destructive">{formatApiError(form.error)}</p>}

        {!form.isLoading && !form.error && (
          <div className="flex flex-1 flex-col p-4">
            <div className="flex h-12 items-center gap-2 rounded-lg bg-[#F5F6F9] px-3">
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left text-[17px] font-medium text-[#010101]"
                onClick={() => form.setPicker("from")}
              >
                {displayStationName(form.fromStation)}
              </button>
              <SwapStationsIcon onSwap={form.swapStations} />
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-right text-[17px] font-medium text-[#010101]"
                onClick={() => form.setPicker("to")}
              >
                {displayStationName(form.toStation)}
              </button>
            </div>

            <button
              type="button"
              className="mt-3 flex h-12 w-full items-center rounded-lg bg-[#F5F6F9] px-3 text-left active:opacity-90"
              onClick={() => setCalendarOpen(true)}
            >
              <span className="text-[17px] font-medium text-[#010101]">
                {formatHotelDateShort(form.date)}
              </span>
              <span className="ml-1 text-[14px] text-[#666666]">{relativeDayLabel(form.date)}</span>
            </button>

            {form.validationError ? (
              <p className="pt-2 text-center text-sm text-destructive">{form.validationError}</p>
            ) : null}

            <Button className="mt-auto h-11 w-full text-base" onClick={handleSubmit}>
              搜索
            </Button>
          </div>
        )}
      </div>

      <CityPicker
        open={form.picker !== null}
        items={form.stations}
        title={form.picker === "from" ? "选择出发站" : "选择到达站"}
        historyKey={CITY_HISTORY_KEYS.train}
        searchPlaceholder="搜索城市或车站名称"
        hotTitle="热门火车站"
        historyTitle="历史记录"
        onClose={() => form.setPicker(null)}
        onSelect={handleStationSelect}
        {...trainStationPickerAdapter}
      />

      <CalendarPickerSheet
        open={calendarOpen}
        config={TRAIN_CALENDAR_CONFIG}
        startDate={form.date}
        endDate={form.date}
        onClose={() => setCalendarOpen(false)}
        onConfirm={(selected) => {
          form.setDate(selected);
          setCalendarOpen(false);
        }}
      />
    </>
  );
}
