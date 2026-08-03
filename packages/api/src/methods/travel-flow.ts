import { BOOK_METHODS } from "./book.js";
import { ORDER_METHODS } from "./order.js";
import { TRAVEL_METHODS } from "./travel.js";

/** Curated S5 travel form Methods. */
export const TRAVEL_FLOW_METHODS = {
  /** ryx: hotel/flight/train booking travel number lookup */
  GET_TRAVEL_URL: BOOK_METHODS.HOME_GETTRAVELURL,
  /** jyx-only */
  JYX_GET_TRAVEL_FORMS: TRAVEL_METHODS.JYX_GETTRAVELFORMS,
  JYX_SAVE_TRAVEL_FORMS: TRAVEL_METHODS.JYX_SAVETRAVELFORMS,
  TRAVEL_LIST: ORDER_METHODS.TRAVEL_LIST,
  STAFF_GET: TRAVEL_METHODS.STAFF_GET,
} as const;

export type TravelFlowMethod =
  (typeof TRAVEL_FLOW_METHODS)[keyof typeof TRAVEL_FLOW_METHODS];
