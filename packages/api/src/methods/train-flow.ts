import { TRAIN_METHODS } from "./train.js";
import { TMC_METHODS } from "./tmc.js";

export const TRAIN_FLOW_METHODS = {
  RESOURCE_STATION: TMC_METHODS.RESOURCE_TRAINSTATION,
  HOME_SEARCH: TRAIN_METHODS.HOME_SEARCH,
} as const;

export type TrainFlowMethod =
  (typeof TRAIN_FLOW_METHODS)[keyof typeof TRAIN_FLOW_METHODS];
