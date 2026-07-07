import { describe, expect, it } from "vitest";

import { togglePassengerSeatSelection, toggleTrainSeatPreference } from "./TrainBookSeatPicker";

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

describe("toggleTrainSeatPreference", () => {
  it("uses a shared legacy preference pool capped by passenger count", () => {
    expect(toggleTrainSeatPreference([], "1A", 2)).toEqual(["1A"]);
    expect(toggleTrainSeatPreference(["1A"], "2F", 2)).toEqual(["1A", "2F"]);
    expect(toggleTrainSeatPreference(["1A", "2F"], "2F", 2)).toEqual(["1A"]);
  });

  it("replaces the latest selected preference when the pool is full", () => {
    expect(toggleTrainSeatPreference(["1A", "2F"], "1C", 2)).toEqual(["1A", "1C"]);
  });
});
