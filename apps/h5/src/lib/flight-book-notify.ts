/** Legacy notify language codes on `MessageLang`. */
export type FlightNotifyLanguage = "" | "cn" | "en";

export const FLIGHT_NOTIFY_LANGUAGE_DEFAULT: FlightNotifyLanguage = "cn";

export const FLIGHT_NOTIFY_LANGUAGE_OPTIONS: {
  value: FlightNotifyLanguage;
  label: string;
}[] = [
  { value: "", label: "不发" },
  { value: "cn", label: "中文" },
  { value: "en", label: "英文" },
];

export function formatFlightNotifyLanguage(value: FlightNotifyLanguage): string {
  return FLIGHT_NOTIFY_LANGUAGE_OPTIONS.find((item) => item.value === value)?.label ?? "中文";
}

export function isValidFlightNotifyLanguage(value: string): value is FlightNotifyLanguage {
  return value === "" || value === "cn" || value === "en";
}
