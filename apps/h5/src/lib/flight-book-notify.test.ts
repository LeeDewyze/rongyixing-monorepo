import { describe, expect, it } from "vitest";

import {
  FLIGHT_NOTIFY_LANGUAGE_DEFAULT,
  formatFlightNotifyLanguage,
  isValidFlightNotifyLanguage,
} from "./flight-book-notify";

describe("flight-book-notify", () => {
  it("formats notify language labels", () => {
    expect(formatFlightNotifyLanguage("cn")).toBe("中文");
    expect(formatFlightNotifyLanguage("en")).toBe("英文");
    expect(formatFlightNotifyLanguage("")).toBe("不发");
  });

  it("validates notify language codes", () => {
    expect(isValidFlightNotifyLanguage("cn")).toBe(true);
    expect(isValidFlightNotifyLanguage("jp")).toBe(false);
    expect(FLIGHT_NOTIFY_LANGUAGE_DEFAULT).toBe("cn");
  });
});
