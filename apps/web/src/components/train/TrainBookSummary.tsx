import { useState } from "react";

import trainRouteArrow from "@/assets/train/route-arrow.png";
import summaryRouteArrow from "@/assets/flight/summary-route-arrow.png";
import { SummaryCollapseButton } from "@/components/book/SummaryCollapseButton";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import type { TrainBookSelection } from "@/lib/train-book-session";
import { formatSeatPriceLabel, formatTrainClock, formatTrainDuration } from "@/utils/train-list";

interface TrainBookSummaryProps {
  selection: TrainBookSelection;
}

export function TrainBookSummary({ selection }: TrainBookSummaryProps) {
  const [expanded, setExpanded] = useState(true);
  const { train, seat, searchParams } = selection;
  const dateLabel = searchParams.Date;
  const durationLabel = formatTrainDuration(train);
  const departureTime = formatTrainClock(train.StartTime);
  const arrivalTime = formatTrainClock(train.ArrivalTime);
  const priceLabel = formatSeatPriceLabel(seat.Price ?? 0);

  return (
    <div className={`px-3 pb-3 pt-2 ${HOTEL_DETAIL_FONT}`}>
      <div
        className="rounded-lg px-3.5 pb-3 pt-3"
        style={{
          background: "linear-gradient(270deg, #2768FA 0%, #33A1F9 100%)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-white">
            <div className="flex items-center gap-3 text-[17px] font-medium leading-none tracking-normal">
              <span>{train.FromStation}</span>
              <img
                src={summaryRouteArrow}
                alt=""
                width={20}
                height={17}
                className="h-[17px] w-5 shrink-0 object-contain"
                aria-hidden
              />
              <span>{train.ToStation}</span>
            </div>
            <p className="mt-3 flex items-center gap-4 text-[14px] font-normal leading-none tracking-normal text-white">
              <span>{[dateLabel, departureTime].filter(Boolean).join(" ")}</span>
              {train.TrainCode ? <span>{train.TrainCode}</span> : null}
            </p>
          </div>
          <SummaryCollapseButton
            expanded={expanded}
            detailLabel="车次详情"
            onToggle={() => setExpanded((value) => !value)}
          />
        </div>

        {expanded ? (
          <div className="mt-3 h-16 rounded-[8px] bg-[#FFFFFF] px-3">
            <div className="grid h-full grid-cols-[minmax(0,1fr)_7.5rem_minmax(0,1fr)] items-center gap-x-2">
              <div className="min-w-0">
                <p className="text-[16px] font-medium leading-[100%] tracking-[0] text-[#010101]">
                  {departureTime}
                </p>
                <p className="mt-1 truncate text-[14px] font-normal leading-[100%] tracking-[0] text-[#666666]">
                  {train.FromStation}
                </p>
              </div>

              <div className="text-center">
                {durationLabel ? (
                  <p className="text-[12px] leading-[100%] tracking-[0] text-[#999999]">
                    {durationLabel}
                  </p>
                ) : null}
                <div className="mt-1 flex items-center justify-center">
                  <img
                    src={trainRouteArrow}
                    alt=""
                    width={56}
                    height={12}
                    className="h-3 w-14 shrink-0 object-contain"
                    aria-hidden
                  />
                </div>
                {train.TrainCode ? (
                  <p className="mt-1 text-[11px] font-normal leading-[100%] tracking-[0] text-[#666666]">
                    {train.TrainCode}
                  </p>
                ) : null}
              </div>

              <div className="min-w-0 text-right">
                <p className="text-[16px] font-medium leading-[100%] tracking-[0] text-[#010101]">
                  {arrivalTime}
                </p>
                <p className="mt-1 truncate text-[14px] font-normal leading-[100%] tracking-[0] text-[#666666]">
                  {train.ToStation}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <p className="mt-2 text-[14px] font-normal leading-[100%] tracking-[0] text-[#FFFFFF]">
          {seat.SeatTypeName}: ¥{priceLabel}
        </p>
      </div>
    </div>
  );
}
