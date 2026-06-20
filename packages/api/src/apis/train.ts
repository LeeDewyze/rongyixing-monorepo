import type {
  TrainSearchParams,
  TrainSearchResponse,
  TrainStation,
  TrainStationResourceResponse,
} from "@ryx/shared-types";

import { TRAIN_FLOW_METHODS } from "../methods/train-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface TrainApi {
  getStations(): Promise<TrainStation[]>;
  searchTrains(params: TrainSearchParams): Promise<TrainSearchResponse>;
}

function normalizeTrainStations(
  res: TrainStation[] | TrainStationResourceResponse | null | undefined,
): TrainStation[] {
  if (Array.isArray(res)) return res;
  return res?.Trafficlines ?? res?.TrafficLines ?? [];
}

export function createTrainApi(proxy: ProxyClient): TrainApi {
  return {
    async getStations() {
      const res = await proxy.send<TrainStation[] | TrainStationResourceResponse>({
        method: TRAIN_FLOW_METHODS.RESOURCE_STATION,
        data: {},
      });
      return normalizeTrainStations(res);
    },
    searchTrains(params) {
      return proxy.send<TrainSearchResponse>({
        method: TRAIN_FLOW_METHODS.HOME_SEARCH,
        data: {
          Date: params.Date,
          FromStation: params.FromStation,
          ToStation: params.ToStation,
        },
      });
    },
  };
}
