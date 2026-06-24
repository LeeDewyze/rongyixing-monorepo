import { useEffect, useState } from "react";
import type { TrainStation } from "@ryx/shared-types";

import { CalendarPickerSheet } from "@/components/calendar/CalendarPickerSheet";
import { CityPicker } from "@/components/search/CityPicker";
import { useTrainSearchForm } from "@/hooks/useTrainSearchForm";
import type { TrainSearchQueryInitial } from "@/hooks/useTrainSearchForm";
import { HOME_ASSETS } from "@/config/home-assets";
import { TRAIN_CALENDAR_CONFIG } from "@/lib/calendar-picker";
import { CITY_HISTORY_KEYS } from "@/lib/city-picker";
import { formatHotelDateShort, relativeDayLabel } from "@/lib/date-search";
import { displayStationName, trainStationPickerAdapter } from "@/lib/train-search";

import "./train-modify-search-sheet.css";

const SHEET_ANIMATION_MS = 320;

const FONT = "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const PRIMARY_TEXT = `text-[17px] font-medium leading-none tracking-normal text-[#333333] ${FONT}`;

const SECONDARY_TEXT = `text-[14px] font-normal leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

interface TrainModifySearchSheetProps {
  open: boolean;
  headerTop: number;
  initial: TrainSearchQueryInitial;
  onClose: () => void;
  onSearch: (params: URLSearchParams) => void;
}

function SwapStationsIcon({ onSwap }: { onSwap: () => void }) {
  return (
    <button
      type="button"
      aria-label="交换出发站和到达站"
      className="train-modify-search-sheet__swap"
      onClick={onSwap}
    >
      <img
        src={HOME_ASSETS.products.train.swapStations}
        alt=""
        width={27}
        height={24}
        className="block h-6 w-[27px] object-contain"
        aria-hidden
      />
    </button>
  );
}

/** Top dropdown panel to modify stations/date on train list page. */
export function TrainModifySearchSheet({
  open,
  headerTop,
  initial,
  onClose,
  onSearch,
}: TrainModifySearchSheetProps) {
  const form = useTrainSearchForm({ enabled: open });
  const { stations, resetFromQuery } = form;
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) setRendered(true);
  }, [open]);

  useEffect(() => {
    if (!rendered) return;

    if (open) {
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timer = window.setTimeout(() => setRendered(false), SHEET_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [open, rendered]);

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

  if (!rendered) return null;

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
      <div
        className={`train-modify-search-sheet${visible ? " train-modify-search-sheet--visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="修改城市"
      >
        <button
          type="button"
          className="train-modify-search-sheet__backdrop"
          style={{ top: headerTop }}
          aria-label="关闭修改城市"
          onClick={onClose}
        />

        <div className="train-modify-search-sheet__panel-wrap" style={{ top: headerTop }}>
          <div className="train-modify-search-sheet__panel">
            <div className="train-modify-search-sheet__panel-inner">
              <div className="train-modify-search-sheet__field">
                <button
                  type="button"
                  className={`train-modify-search-sheet__field-button text-left ${PRIMARY_TEXT}`}
                  onClick={() => form.setPicker("from")}
                >
                  {displayStationName(form.fromStation)}
                </button>
                <SwapStationsIcon onSwap={form.swapStations} />
                <button
                  type="button"
                  className={`train-modify-search-sheet__field-button text-right ${PRIMARY_TEXT}`}
                  onClick={() => form.setPicker("to")}
                >
                  {displayStationName(form.toStation)}
                </button>
              </div>

              <button
                type="button"
                className="train-modify-search-sheet__date-row"
                onClick={() => setCalendarOpen(true)}
              >
                <span className={PRIMARY_TEXT}>{formatHotelDateShort(form.date)}</span>
                <span className={`ml-1.5 ${SECONDARY_TEXT}`}>{relativeDayLabel(form.date)}</span>
              </button>

              {form.validationError ? (
                <p className={`pt-2 text-center text-sm text-destructive ${FONT}`}>
                  {form.validationError}
                </p>
              ) : null}

              <button
                type="button"
                className={`train-modify-search-sheet__search ${FONT}`}
                onClick={handleSubmit}
              >
                搜索
              </button>
            </div>
          </div>
        </div>
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
