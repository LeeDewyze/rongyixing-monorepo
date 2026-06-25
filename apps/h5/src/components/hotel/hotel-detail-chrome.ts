/** Shared typography for hotel detail chrome (header + section tabs). */
export const HOTEL_DETAIL_FONT =
  "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

/** Sky-blue header gradient — aligned with hotel list page. */
export const HOTEL_HEADER_GRADIENT =
  "linear-gradient(180deg, #8EC8FF 0%, #B8DBFF 42%, #DCE9FA 78%, #EEF4FC 100%)";

/** Section card title on hotel order detail (16px / medium / #010101). */
export const HOTEL_ORDER_SECTION_TITLE = "text-[16px] font-medium leading-none text-[#010101]";

/** Detail row label on hotel order detail (14px / regular / #333333). */
export const HOTEL_ORDER_ROW_LABEL = `${HOTEL_DETAIL_FONT} text-[14px] font-normal leading-none tracking-normal text-[#333333]`;

/** Detail row value on hotel order detail (14px / regular / #666666). */
export const HOTEL_ORDER_ROW_VALUE = `${HOTEL_DETAIL_FONT} text-[14px] font-normal leading-none tracking-normal text-right text-[#666666]`;

/** Order amount on hotel order detail (14px / regular / #FF0000). */
export const HOTEL_ORDER_AMOUNT_VALUE = `${HOTEL_DETAIL_FONT} text-[14px] font-normal leading-none tracking-normal text-right text-[#FF0000]`;

/** Text link action on hotel order detail (12px / regular / #2768FA). */
export const HOTEL_ORDER_LINK_ACTION = `${HOTEL_DETAIL_FONT} text-[12px] font-normal leading-none tracking-normal text-right text-[#2768FA]`;

export const HOTEL_CHROME = {
  title: "#010101",
  action: "#2768FA",
  actionDisabled: "#9CA3AF",
  tabPanel: "#EEF4FC",
  tabTrack: "rgba(255,255,255,0.82)",
} as const;
