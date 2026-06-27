import type { TrainScheduleStop } from "@ryx/shared-types";

import { FareRulesBottomSheet } from "@/components/flight/flight-fare-rule-presentation";

import { TrainScheduleTable } from "./TrainScheduleTable";

interface TrainScheduleSheetProps {
  open: boolean;
  title?: string;
  loading?: boolean;
  error?: string | null;
  stops?: TrainScheduleStop[];
  fromStation?: string;
  toStation?: string;
  onClose: () => void;
}

export function TrainScheduleSheet({
  open,
  title = "经停站",
  loading = false,
  error = null,
  stops = [],
  fromStation,
  toStation,
  onClose,
}: TrainScheduleSheetProps) {
  return (
    <FareRulesBottomSheet
      open={open}
      title={title}
      titleId="train-schedule-title"
      onClose={onClose}
    >
      <TrainScheduleTable
        stops={stops}
        loading={loading}
        error={error}
        fromStation={fromStation}
        toStation={toStation}
      />
    </FareRulesBottomSheet>
  );
}
