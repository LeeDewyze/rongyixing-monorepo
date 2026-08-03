import { useEffect, useState } from "react";

import type { TrainItem } from "@ryx/shared-types";

import trainRouteArrow from "@/assets/train/route-arrow.png";
import { useTrainSchedule } from "@/hooks/useTrainSchedule";
import { buildTrainScheduleParamsFromItem } from "@/lib/train-schedule";
import {
  formatTrainClock,
  formatTrainDuration,
  getTrainArrivalDayTip,
  hasAvailableTrainSeats,
} from "@/utils/train-list";

import { TrainScheduleTable } from "./TrainScheduleTable";
import { TrainSeatPreview, TrainSeatRow } from "./TrainSeatRow";

const FONT = "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const TRAIN_TIME_CLASS = `whitespace-nowrap text-[24px] font-[500] not-italic leading-[100%] tracking-[0] text-[#010101] ${FONT}`;

const TRAIN_STATION_CLASS = `truncate text-[16px] font-[400] not-italic leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

const TRAIN_DURATION_CLASS = `text-[11px] font-normal leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

const TRAIN_CODE_CLASS = `text-[11px] font-normal leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

const TRAIN_DAY_OFFSET_CLASS = `ml-1 whitespace-nowrap text-[16px] font-[400] not-italic leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

const TRAIN_PRICE_CLASS = `whitespace-nowrap text-[24px] font-[500] not-italic leading-none tracking-[0] ${FONT}`;

const TRAIN_PRICE_COLOR_LOWEST = "text-[#34C759]";

const TRAIN_PRICE_COLOR_DEFAULT = "text-[#FF383C]";

const TRAIN_CARD_GRID_CLASS =
  "grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_auto] items-center gap-x-5 pc:gap-x-6";

const TRAIN_ROUTE_ROW_CLASS = "flex items-center gap-x-3 pl-2 pc:gap-x-4 pc:pl-3";

const TRAIN_ROUTE_DEPART_COL_CLASS = "w-[4.5rem] shrink-0 pc:w-[5rem]";

const TRAIN_ROUTE_ARROW_COL_CLASS = "w-[5rem] shrink-0 pc:w-[5.5rem]";

const TRAIN_ROUTE_ARRIVE_COL_CLASS = "w-[5.25rem] shrink-0 pc:w-[5.75rem] -ml-1 pc:-ml-2";

const DIRECT_LOWEST_GRADIENT_STYLE = {
  background:
    "linear-gradient(180deg, #D7FFF0 0%, rgba(215, 255, 240, 0.72) 38%, rgba(215, 255, 240, 0.28) 62%, rgba(215, 255, 240, 0.06) 82%, transparent 100%)",
};

function LowestPriceGradient() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-14 rounded-t-lg"
      style={DIRECT_LOWEST_GRADIENT_STYLE}
      aria-hidden
    />
  );
}

function LowestPriceBadge() {
  return (
    <span
      className={`absolute left-0 top-0 z-[2] flex h-5 min-w-[56px] items-center justify-center rounded-tl-lg bg-[#34C759] px-2 text-[11px] font-normal leading-none tracking-[0] text-white ${FONT}`}
    >
      价格最低
    </span>
  );
}

interface TrainListItemCardProps {
  train: TrainItem;
  searchDate: string;
  expanded: boolean;
  isAgent?: boolean;
  policyChecked?: boolean;
  onToggle: () => void;
  onBookAttempt: (seat: import("@ryx/shared-types").TrainSeat) => void;
}

function TrainScheduleCaret({ open }: { open: boolean }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 14 14"
      className={`block shrink-0 text-[#999999] ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M4 5.25L7 9.25L10 5.25H4Z" fill="currentColor" />
    </svg>
  );
}

function TrainRouteMiddle({
  trainCode,
  durationLabel,
  scheduleOpen,
  onToggleSchedule,
}: {
  trainCode: string;
  durationLabel?: string | null;
  scheduleOpen: boolean;
  onToggleSchedule: () => void;
}) {
  return (
    <div
      className={`flex flex-col items-start justify-center gap-0.5 ${TRAIN_ROUTE_ARROW_COL_CLASS}`}
    >
      {durationLabel ? (
        <span className={TRAIN_DURATION_CLASS}>{durationLabel}</span>
      ) : (
        <span className="h-3" aria-hidden />
      )}
      <img
        src={trainRouteArrow}
        alt=""
        width={56}
        height={12}
        className="h-3 w-12 shrink-0 object-contain object-left"
        aria-hidden
      />
      <button
        type="button"
        className={`inline-flex items-center justify-center gap-px ${TRAIN_CODE_CLASS}`}
        aria-expanded={scheduleOpen}
        onClick={(event) => {
          event.stopPropagation();
          onToggleSchedule();
        }}
      >
        <span className="leading-[11px]">{trainCode}</span>
        <TrainScheduleCaret open={scheduleOpen} />
      </button>
    </div>
  );
}

function BookActionChip() {
  return (
    <span
      className={`inline-flex h-10 w-[120px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-l from-[#2768FA] to-[#33A1F9] text-[14px] font-medium leading-none text-white shadow-[0_2px_8px_rgba(39,104,250,0.24)] ${FONT}`}
      aria-hidden
    >
      订票
    </span>
  );
}

export function TrainListItemCard({
  train,
  searchDate,
  expanded,
  isAgent = false,
  policyChecked = true,
  onToggle,
  onBookAttempt,
}: TrainListItemCardProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleFetchEnabled, setScheduleFetchEnabled] = useState(false);
  const scheduleParams = scheduleFetchEnabled
    ? buildTrainScheduleParamsFromItem(train, searchDate)
    : null;
  const scheduleQuery = useTrainSchedule(scheduleParams);

  useEffect(() => {
    if (!scheduleFetchEnabled) return;
    if (scheduleQuery.isLoading || scheduleQuery.isFetching) return;
    if (!scheduleQuery.isFetched) return;
    setScheduleOpen(true);
  }, [
    scheduleFetchEnabled,
    scheduleQuery.isLoading,
    scheduleQuery.isFetching,
    scheduleQuery.isFetched,
  ]);

  const isLowest = Boolean(train.isLowestPrice);
  const priceColor = isLowest ? TRAIN_PRICE_COLOR_LOWEST : TRAIN_PRICE_COLOR_DEFAULT;
  const arrivalDayTip = getTrainArrivalDayTip(train);
  const durationLabel = formatTrainDuration(train);
  const canExpand = hasAvailableTrainSeats(train.Seats);

  function handleScheduleToggle() {
    if (scheduleOpen) {
      setScheduleOpen(false);
      setScheduleFetchEnabled(false);
      return;
    }

    if (scheduleFetchEnabled) {
      setScheduleFetchEnabled(false);
      return;
    }

    if (expanded) {
      onToggle();
    }
    setScheduleFetchEnabled(true);
  }

  function handleCardClick() {
    if (scheduleOpen || scheduleFetchEnabled) {
      setScheduleOpen(false);
      setScheduleFetchEnabled(false);
      if (canExpand && !expanded) {
        onToggle();
      }
      return;
    }
    if (!canExpand && !expanded) return;
    onToggle();
  }

  const cardRadiusClass = isLowest ? "rounded-lg" : "rounded-xl";
  const contentPadding = isLowest ? "py-4 pl-4 pr-4 pt-7" : "p-4";

  return (
    <div
      className={`relative z-0 min-h-[100px] w-full overflow-hidden bg-white text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03] transition hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
        canExpand || expanded || scheduleOpen || scheduleFetchEnabled ? "active:scale-[0.995]" : ""
      } ${cardRadiusClass}`}
    >
      {isLowest ? <LowestPriceGradient /> : null}
      {isLowest ? <LowestPriceBadge /> : null}

      <div
        role="button"
        tabIndex={canExpand || expanded || scheduleOpen ? 0 : -1}
        onClick={handleCardClick}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          handleCardClick();
        }}
        className={`relative z-[1] ${contentPadding} ${canExpand || expanded || scheduleOpen ? "cursor-pointer" : ""}`}
      >
        <div className={TRAIN_CARD_GRID_CLASS}>
          <div className={TRAIN_ROUTE_ROW_CLASS}>
            <div className={`flex flex-col items-start gap-1 ${TRAIN_ROUTE_DEPART_COL_CLASS}`}>
              <p className={TRAIN_TIME_CLASS}>{formatTrainClock(train.StartTime)}</p>
              <p className={`w-full ${TRAIN_STATION_CLASS}`}>{train.FromStation}</p>
            </div>

            <TrainRouteMiddle
              trainCode={train.TrainCode}
              durationLabel={durationLabel}
              scheduleOpen={scheduleOpen}
              onToggleSchedule={handleScheduleToggle}
            />

            <div className={`flex flex-col items-start gap-1 ${TRAIN_ROUTE_ARRIVE_COL_CLASS}`}>
              <p className={TRAIN_TIME_CLASS}>
                {formatTrainClock(train.ArrivalTime)}
                {arrivalDayTip ? (
                  <span className={TRAIN_DAY_OFFSET_CLASS}>{arrivalDayTip}</span>
                ) : null}
              </p>
              <p className={`w-full ${TRAIN_STATION_CLASS}`}>{train.ToStation}</p>
            </div>
          </div>

          <div className="min-w-0 -ml-4 pc:-ml-5">
            {!expanded ? <TrainSeatPreview seats={train.Seats ?? []} layout="inline" /> : null}
          </div>

          <div className="flex items-center justify-end gap-3 pc:gap-4">
            <p className={`${TRAIN_PRICE_CLASS} ${priceColor}`}>¥{train.LowestPrice ?? 0}</p>
            <BookActionChip />
          </div>
        </div>

        {expanded ? (
          <TrainSeatRow
            seats={train.Seats ?? []}
            expanded
            isAgent={isAgent}
            policyChecked={policyChecked}
            onBookAttempt={onBookAttempt}
          />
        ) : null}
      </div>

      {scheduleOpen ? (
        <div className="train-schedule-panel border-t border-[#F0F2F5] pb-3 pt-2">
          <TrainScheduleTable
            stops={scheduleQuery.data?.Stops}
            fromStation={train.FromStation}
            toStation={train.ToStation}
          />
        </div>
      ) : null}
    </div>
  );
}
