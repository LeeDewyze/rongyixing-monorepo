import { BOOK_METHODS } from "./book.js";
import { HOTEL_METHODS } from "./hotel.js";
import { ORDER_METHODS } from "./order.js";

/** Curated S2 hotel flow Methods (not overwritten by extract-methods). */
export const HOTEL_FLOW_METHODS = {
  LIST: HOTEL_METHODS.HOME_LIST,
  DETAIL: HOTEL_METHODS.HOME_DETAIL,
  POLICY: HOTEL_METHODS.HOME_POLICY,
  INIT: BOOK_METHODS.HOTEL_INITIALIZE,
  BOOK: BOOK_METHODS.HOTEL_BOOK,
  ORDER_DETAIL: ORDER_METHODS.ORDER_DETAIL_27,
  CANCEL_HOTEL: ORDER_METHODS.ORDER_CANCELORDERHOTEL,
  GET_ORDER_PAYS: ORDER_METHODS.ORDER_GETORDERPAYS,
  /** Default param in beeant; not always picked up by extract-methods. */
  PAY_CREATE: "TmcApiOrderUrl-Pay-Create",
} as const;

export type HotelFlowMethod =
  (typeof HOTEL_FLOW_METHODS)[keyof typeof HOTEL_FLOW_METHODS];
