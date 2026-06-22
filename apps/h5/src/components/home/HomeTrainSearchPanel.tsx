import { useRef } from "react";
import type { TrainStation } from "@ryx/shared-types";

import { formatHotelDateShort, relativeDayLabel, todayDateString } from "@/lib/date-search";
import { displayStationName } from "@/lib/train-search";
import { HOME_ASSETS } from "@/config/home-assets";

const HOME_PANEL_PRIMARY_TEXT =
  "text-[17px] font-medium leading-none tracking-normal text-[#010101] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const HOME_PANEL_SECONDARY_TEXT =
  "text-[14px] font-[400] leading-[100%] tracking-[0] text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

interface HomeTrainSearchPanelProps {
  fromStation: TrainStation;
  toStation: TrainStation;
  date: string;
  validationError?: string;
  onSelectFrom: () => void;
  onSelectTo: () => void;
  onSwap: () => void;
  onDateChange: (date: string) => void;
  onSearch: () => void;
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

export function HomeTrainSearchPanel({
  fromStation,
  toStation,
  date,
  validationError,
  onSelectFrom,
  onSelectTo,
  onSwap,
  onDateChange,
  onSearch,
}: HomeTrainSearchPanelProps) {
  const dateRef = useRef<HTMLInputElement>(null);
  const minDate = todayDateString();

  return (
    <div className="mx-3 rounded-lg bg-white px-3 pb-4 pt-3">
      <div className="flex h-12 items-center gap-2 rounded-lg bg-[#F5F6F9] px-3">
        <button
          type="button"
          className={`min-w-0 flex-1 truncate text-left ${HOME_PANEL_PRIMARY_TEXT}`}
          onClick={onSelectFrom}
        >
          {displayStationName(fromStation)}
        </button>
        <SwapStationsIcon onSwap={onSwap} />
        <button
          type="button"
          className={`min-w-0 flex-1 truncate text-right ${HOME_PANEL_PRIMARY_TEXT}`}
          onClick={onSelectTo}
        >
          {displayStationName(toStation)}
        </button>
      </div>

      <div className="mt-2 flex h-12 items-center rounded-lg bg-[#F5F6F9] px-3">
        <button
          type="button"
          className="flex items-center gap-1 text-left"
          onClick={() => dateRef.current?.showPicker?.()}
        >
          {/* formatHotelDateShort is generic M月D日 formatting, reused from hotel home panel */}
          <span className={HOME_PANEL_PRIMARY_TEXT}>{formatHotelDateShort(date)}</span>
          <span className={HOME_PANEL_SECONDARY_TEXT}>{relativeDayLabel(date)}</span>
        </button>
        <input
          ref={dateRef}
          type="date"
          className="sr-only"
          tabIndex={-1}
          value={date}
          min={minDate}
          onChange={(event) => onDateChange(event.target.value)}
        />
      </div>

      {validationError ? (
        <p className="pt-2 text-center text-sm text-destructive">{validationError}</p>
      ) : null}

      <button
        type="button"
        className="mt-4 flex h-10 w-full items-center justify-center rounded-[24px] text-[17px] font-medium text-white active:opacity-90"
        style={{
          background: "linear-gradient(270deg, #2768FA 0%, #33A1F9 100%)",
          boxShadow: "0px 2px 16px 0px rgba(175, 175, 175, 0.2)",
        }}
        onClick={onSearch}
      >
        火车票查询
      </button>
    </div>
  );
}
