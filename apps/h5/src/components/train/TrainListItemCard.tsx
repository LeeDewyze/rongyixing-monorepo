import type { TrainItem } from "@ryx/shared-types";

import trainRouteArrow from "@/assets/train/route-arrow.png";
import {
  formatTrainClock,
  formatTrainDuration,
  getTrainArrivalDayTip,
  minSeatCount,
  shouldShowScarceTrainBadge,
} from "@/utils/train-list";

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
  expanded: boolean;
  onToggle: () => void;
  onBookAttempt: () => void;
}

function TrainRouteMiddle({ trainCode }: { trainCode: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <img
        src={trainRouteArrow}
        alt=""
        width={56}
        height={12}
        className="h-3 w-14 shrink-0 object-contain"
        aria-hidden
      />
      <span className={TRAIN_CODE_CLASS}>{trainCode}</span>
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
  expanded,
  onToggle,
  onBookAttempt,
}: TrainListItemCardProps) {
  const isLowest = Boolean(train.isLowestPrice);
  const priceColor = isLowest ? "text-[#16a34a]" : "text-[#FF383C]";
  const arrivalDayTip = getTrainArrivalDayTip(train);
  const durationLabel = formatTrainDuration(train);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative z-0 w-full overflow-hidden rounded-lg text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition active:scale-[0.99] ${expanded ? "" : "min-h-[96px]"} ${
        isLowest
          ? "bg-white bg-[linear-gradient(184.36deg,#D7FFF0_5.34%,#FFFFFF_98.28%)] bg-[length:100%_48px] bg-top bg-no-repeat"
          : "bg-white"
      }`}
    >
      {isLowest ? <LowestPriceBadge /> : null}

      <div className={`relative z-[1] px-3 pb-2 ${isLowest ? "pt-[26px]" : "pt-4"}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <div className="flex shrink-0 flex-col gap-2">
              <p className={TRAIN_TIME_CLASS}>{formatTrainClock(train.StartTime)}</p>
              <p className={TRAIN_STATION_CLASS}>{train.FromStation}</p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-0.5 px-2.5">
              {durationLabel ? (
                <span className={TRAIN_DURATION_CLASS}>{durationLabel}</span>
              ) : (
                <span className="h-3" aria-hidden />
              )}
              <TrainRouteMiddle trainCode={train.TrainCode} />
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

        <TrainSeatRow seats={train.Seats ?? []} expanded={expanded} onBookAttempt={onBookAttempt} />
      </div>
    </button>
  );
}
