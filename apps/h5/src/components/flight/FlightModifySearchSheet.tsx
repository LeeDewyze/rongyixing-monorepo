import { useEffect, useState } from "react";

import { CalendarPickerSheet } from "@/components/calendar/CalendarPickerSheet";
import { FlightCityPickerHostFromForm } from "@/components/flight/common";
import { HOME_ASSETS } from "@/config/home-assets";
import { useFlightSearchForm } from "@/hooks/useFlightSearchForm";
import { FLIGHT_CALENDAR_CONFIG } from "@/lib/calendar-picker";
import { formatHotelDateShort, relativeDayLabel } from "@/lib/date-search";
import type { FlightSearchQueryInitial } from "@/lib/flight-search";
import { displayCityName } from "@/lib/flight-search";

import "../train/train-modify-search-sheet.css";

const SHEET_ANIMATION_MS = 320;

const FONT = "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const PRIMARY_TEXT = `text-[17px] font-medium leading-none tracking-normal text-[#333333] ${FONT}`;

const SECONDARY_TEXT = `text-[14px] font-normal leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

export type FlightModifySearchInitial = FlightSearchQueryInitial;

interface FlightModifySearchSheetProps {
  open: boolean;
  headerTop: number;
  initial: FlightModifySearchInitial;
  onClose: () => void;
  onSearch: (params: URLSearchParams) => void;
}

function SwapCitiesIcon({ onSwap }: { onSwap: () => void }) {
  return (
    <button
      type="button"
      aria-label="交换出发到达城市"
      className="train-modify-search-sheet__swap"
      onClick={onSwap}
    >
      <img
        src={HOME_ASSETS.products.flight.swapCities}
        alt=""
        width={27}
        height={24}
        className="block h-6 w-[27px] object-contain"
        aria-hidden
      />
    </button>
  );
}

/** Top dropdown panel to modify cities/date on flight list page. */
export function FlightModifySearchSheet({
  open,
  headerTop,
  initial,
  onClose,
  onSearch,
}: FlightModifySearchSheetProps) {
  const form = useFlightSearchForm({ enabled: open });
  const { airports, resetFromQuery } = form;
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
    if (!open || !airports.length) return;
    resetFromQuery(initial);
  }, [
    open,
    initial.fromCode,
    initial.toCode,
    initial.fromName,
    initial.toName,
    initial.date,
    initial.fromAsAirport,
    initial.toAsAirport,
    airports.length,
    resetFromQuery,
  ]);

  if (!rendered) return null;

  function handleSubmit() {
    if (form.validate()) return;
    onSearch(form.buildSearchParams());
    onClose();
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
                  {displayCityName(form.fromCity)}
                </button>
                <SwapCitiesIcon onSwap={form.swapCities} />
                <button
                  type="button"
                  className={`train-modify-search-sheet__field-button text-right ${PRIMARY_TEXT}`}
                  onClick={() => form.setPicker("to")}
                >
                  {displayCityName(form.toCity)}
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

      <FlightCityPickerHostFromForm form={form} />

      <CalendarPickerSheet
        open={calendarOpen}
        config={FLIGHT_CALENDAR_CONFIG}
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
