import type { TrainScheduleStop } from "@ryx/shared-types";

import { FareRulesBottomSheet } from "@/components/flight/flight-fare-rule-presentation";
import { formatScheduleClock } from "@/lib/train-schedule";

interface TrainScheduleSheetProps {
  open: boolean;
  title?: string;
  loading?: boolean;
  error?: string | null;
  stops?: TrainScheduleStop[];
  onClose: () => void;
}

export function TrainScheduleSheet({
  open,
  title = "经停站",
  loading = false,
  error = null,
  stops = [],
  onClose,
}: TrainScheduleSheetProps) {
  return (
    <FareRulesBottomSheet open={open} title={title} titleId="train-schedule-title" onClose={onClose}>
      {loading ? (
        <p className="py-8 text-center text-[13px] text-[#999999]">加载中…</p>
      ) : error ? (
        <p className="py-8 text-center text-[13px] text-[#FF4D4F]">{error}</p>
      ) : stops.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-[#999999]">暂无经停站信息</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-[#EEF1F6]">
          <div className="grid grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] gap-2 border-b border-[#F0F2F5] bg-[#F8F9FC] px-3 py-2 text-[11px] text-[#999999]">
            <span>车站</span>
            <span className="text-center">到达</span>
            <span className="text-center">发车</span>
            <span className="text-center">停留</span>
          </div>
          {stops.map((stop, index) => (
            <div
              key={`${stop.StationName ?? "stop"}-${index}`}
              className="grid grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] gap-2 border-b border-[#F5F6F9] px-3 py-2.5 text-[13px] last:border-b-0"
            >
              <span className="truncate text-[#333333]">{stop.StationName ?? "—"}</span>
              <span className="text-center tabular-nums text-[#666666]">
                {formatScheduleClock(stop.ArriveTime)}
              </span>
              <span className="text-center tabular-nums text-[#666666]">
                {formatScheduleClock(stop.DepartTime)}
              </span>
              <span className="text-center text-[#999999]">{stop.StopoverTime ?? "—"}</span>
            </div>
          ))}
        </div>
      )}
    </FareRulesBottomSheet>
  );
}
