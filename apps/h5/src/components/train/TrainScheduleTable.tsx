import type { TrainScheduleStop } from "@ryx/shared-types";

import {
  formatScheduleDisplayTime,
  formatScheduleStayTime,
  isScheduleRowActive,
} from "@/lib/train-schedule";

import "./train-schedule-table.css";

interface TrainScheduleTableProps {
  stops?: TrainScheduleStop[];
  loading?: boolean;
  error?: string | null;
  fromStation?: string;
  toStation?: string;
  showHeader?: boolean;
}

function ScheduleStationIcon({ active }: { active: boolean }) {
  return (
    <span
      className={`train-schedule__icon ${
        active ? "train-schedule__icon--active" : "train-schedule__icon--inactive"
      }`}
      aria-hidden
    />
  );
}

function TrainScheduleHeader() {
  return (
    <div className="train-schedule__header">
      <span className="train-schedule__header-cell train-schedule__header-station">站名</span>
      <span className="train-schedule__header-cell">到达时间</span>
      <span className="train-schedule__header-cell">出发时间</span>
      <span className="train-schedule__header-cell">停留时间</span>
    </div>
  );
}

export function TrainScheduleTable({
  stops = [],
  loading = false,
  fromStation,
  toStation,
  showHeader = true,
}: TrainScheduleTableProps) {
  if (loading) {
    return (
      <div className="train-schedule train-schedule--state">
        <p className="train-schedule__message">加载中…</p>
      </div>
    );
  }

  return (
    <div className="train-schedule">
      {showHeader ? <TrainScheduleHeader /> : null}

      {stops.length > 0 ? (
        <div className="train-schedule__body">
          {stops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === stops.length - 1;
            const isActive = isScheduleRowActive(stop, fromStation, toStation);

            return (
              <div
                key={`${stop.StationName ?? "stop"}-${index}`}
                className={`train-schedule__row${isActive ? " train-schedule__row--active" : ""}`}
              >
                <div className="train-schedule__station">
                  <div
                    className={`train-schedule__timeline${isFirst ? " train-schedule__timeline--first" : ""}${isLast ? " train-schedule__timeline--last" : ""}`}
                    aria-hidden
                  >
                    <ScheduleStationIcon active={isActive} />
                  </div>
                  <span className="train-schedule__station-name truncate">
                    {stop.StationName ?? ""}
                  </span>
                </div>
                <span className="train-schedule__cell tabular-nums">
                  {formatScheduleDisplayTime(stop.ArriveTime)}
                </span>
                <span className="train-schedule__cell tabular-nums">
                  {formatScheduleDisplayTime(stop.DepartTime)}
                </span>
                <span className="train-schedule__cell">
                  {formatScheduleStayTime(stop.StopoverTime)}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
