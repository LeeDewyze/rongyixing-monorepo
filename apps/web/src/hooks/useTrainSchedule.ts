import { useQuery } from "@tanstack/react-query";
import type { TrainScheduleParams } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export function useTrainSchedule(params: TrainScheduleParams | null) {
  return useQuery({
    queryKey: ["train", "schedule", params],
    queryFn: () => getApi().train.getSchedule(params!),
    enabled: Boolean(params?.Date && params.TrainCode),
    staleTime: 60_000,
  });
}
