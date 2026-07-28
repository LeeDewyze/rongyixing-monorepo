import { describe, expect, it } from "vitest";

import {
  filterVisibleHomeProducts,
  hasHomeProductBookRight,
  normalizeRegionType,
} from "./region-type.js";

describe("normalizeRegionType", () => {
  it("maps legacy boolean flags", () => {
    expect(
      normalizeRegionType({
        HasFlight: true,
        HasTrain: false,
        HasHotel: true,
        HasInternationalHotel: false,
      }),
    ).toMatchObject({
      HasFlight: true,
      HasTrain: false,
      HasHotel: true,
    });
  });

  it("unwraps Data envelope", () => {
    expect(
      normalizeRegionType({
        Data: { HasFlight: true, HasTrain: true, HasHotel: true },
      })?.HasFlight,
    ).toBe(true);
  });
});

describe("hasHomeProductBookRight", () => {
  const region = {
    HasFlight: true,
    HasInternationalFlight: false,
    HasTrain: false,
    HasHotel: true,
    HasInternationalHotel: false,
    HasGP: false,
    HasCar: false,
    HasRentalCar: false,
  };

  it("uses HasHotel for the domestic hotel product", () => {
    expect(hasHomeProductBookRight(region, "hotel")).toBe(true);
    expect(
      hasHomeProductBookRight({ ...region, HasHotel: false, HasInternationalHotel: true }, "hotel"),
    ).toBe(false);
  });

  it("denies train when HasTrain is false", () => {
    expect(hasHomeProductBookRight(region, "train")).toBe(false);
  });

  it("defaults to visible before region is loaded", () => {
    expect(hasHomeProductBookRight(undefined, "train")).toBe(true);
  });

  it("denies products when region payload is missing", () => {
    expect(hasHomeProductBookRight(null, "train")).toBe(false);
  });
});

describe("filterVisibleHomeProducts", () => {
  it("returns only permitted products in order", () => {
    expect(
      filterVisibleHomeProducts({
        HasFlight: true,
        HasInternationalFlight: false,
        HasTrain: true,
        HasHotel: false,
        HasInternationalHotel: false,
        HasGP: false,
        HasCar: false,
        HasRentalCar: false,
      }),
    ).toEqual(["flight", "train"]);
  });
});
