import { describe, expect, it } from "vitest";

import { togglePassengerSeatSelection } from "./TrainBookSeatPicker";

describe("togglePassengerSeatSelection", () => {
  it("selects and switches a seat for one passenger", () => {
    expect(togglePassengerSeatSelection([], 0, 1, "A")).toEqual(["A"]);
    expect(togglePassengerSeatSelection(["A"], 0, 1, "B")).toEqual(["B"]);
    expect(togglePassengerSeatSelection(["A"], 0, 1, "A")).toEqual([""]);
  });

  it("keeps one seat preference per passenger row", () => {
    expect(togglePassengerSeatSelection([], 0, 2, "A")).toEqual(["A", ""]);
    expect(togglePassengerSeatSelection(["A", ""], 1, 2, "C")).toEqual(["A", "C"]);
    expect(togglePassengerSeatSelection(["A", "C"], 0, 2, "B")).toEqual(["B", "C"]);
    expect(togglePassengerSeatSelection(["A", "C"], 1, 2, "C")).toEqual(["A", ""]);
  });
});
