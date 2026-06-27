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
  minSeatCount,
  shouldShowScarceTrainBadge,
} from "@/utils/train-list";

import { TrainScheduleTable } from "./TrainScheduleTable";
import { TrainSeatRow } from "./TrainSeatRow";

const TRAIN_TIME_CLASS =
  "text-[16px] font-medium leading-[100%] tracking-[0] text-brand-title [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const TRAIN_STATION_CLASS =
  "truncate text-[14px] font-normal leading-[100%] tracking-[0] text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const TRAIN_DURATION_CLASS =
  "text-[11px] font-normal leading-[100%] tracking-[0] text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const TRAIN_CODE_CLASS =
  "text-[11px] font-normal leading-[100%] tracking-[0] text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const TRAIN_DAY_TIP_CLASS =
  "absolute right-0 bottom-full mb-0.5 whitespace-nowrap text-[10px] font-normal leading-[100%] tracking-[0] text-brand-title [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const TRAIN_PRICE_CLASS =
  "text-[24px] font-medium leading-[100%] tracking-[0] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const TRAIN_SCARCE_BADGE_CLASS =
  "flex h-4 min-w-[36px] shrink-0 items-center justify-center whitespace-nowrap rounded border border-[#FF383C] bg-[#FF383C1A] px-1 text-[10px] font-normal leading-[100%] tracking-[0] text-[#FF383C] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

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
  durationLabel?: string;
  scheduleOpen: boolean;
  onToggleSchedule: () => void;
}) {
  return (
    <div className="flex w-full min-w-16 flex-col items-center gap-0.5">
      {durationLabel ? (
        <span className={TRAIN_DURATION_CLASS}>{durationLabel}</span>
      ) : (
        <span className="h-3" aria-hidden />
      )}
      <img
        src={trainRouteArrow}
        alt=""
        width={64}
        height={12}
        className="h-3 w-16 shrink-0 object-contain"
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

function LowestPriceBadge() {
  return (
    <span className="absolute left-0 top-0 flex h-4 min-w-[54px] items-center justify-center rounded-tl-lg bg-[#34C759] px-1.5 text-[10px] font-normal leading-[100%] tracking-[0] text-white [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
      价格最低
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
  const priceColor = isLowest ? "text-[#16a34a]" : "text-[#FF383C]";
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

  return (
    <div
      className={`relative z-0 w-full overflow-hidden rounded-lg text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition ${canExpand || expanded || scheduleOpen || scheduleFetchEnabled ? "active:scale-[0.99]" : ""} ${expanded || scheduleOpen ? "" : "min-h-[96px]"} ${
        isLowest
          ? "bg-white bg-[linear-gradient(184.36deg,#D7FFF0_5.34%,#FFFFFF_98.28%)] bg-[length:100%_48px] bg-top bg-no-repeat"
          : "bg-white"
      }`}
    >
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
        className={`relative z-[1] px-3 pb-2 ${isLowest ? "pt-[26px]" : "pt-4"} ${canExpand || expanded || scheduleOpen ? "cursor-pointer" : ""}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <div className="flex shrink-0 flex-col gap-2">
              <p className={TRAIN_TIME_CLASS}>{formatTrainClock(train.StartTime)}</p>
              <p className={TRAIN_STATION_CLASS}>{train.FromStation}</p>
            </div>

            <div className="flex shrink-0 flex-col items-center px-2.5">
              <TrainRouteMiddle
                trainCode={train.TrainCode}
                durationLabel={durationLabel}
                scheduleOpen={scheduleOpen}
                onToggleSchedule={handleScheduleToggle}
              />
            </div>

            <div className="flex shrink-0 flex-col gap-2">
              <div className="relative w-fit">
                <p className={TRAIN_TIME_CLASS}>{formatTrainClock(train.ArrivalTime)}</p>
                {arrivalDayTip ? (
                  <span className={TRAIN_DAY_TIP_CLASS}>{arrivalDayTip}</span>
                ) : null}
              </div>
              <p className={TRAIN_STATION_CLASS}>{train.ToStation}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-1 pl-1">
            {shouldShowScarceTrainBadge(train) ? (
              <span className={TRAIN_SCARCE_BADGE_CLASS}>剩{minSeatCount(train)}张</span>
            ) : null}
            <p className={`${TRAIN_PRICE_CLASS} ${priceColor}`}>¥{train.LowestPrice ?? 0}</p>
          </div>
        </div>

        <TrainSeatRow
          seats={train.Seats ?? []}
          expanded={expanded}
          isAgent={isAgent}
          policyChecked={policyChecked}
          onBookAttempt={onBookAttempt}
        />
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
