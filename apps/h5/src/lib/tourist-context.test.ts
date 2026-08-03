import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProxySendOptions } from "@ryx/shared-types";

import {
  clearTouristContextCache,
  readTouristContextFromSearch,
  resolveTouristContext,
  sendWithTouristContext,
  withTouristContext,
  type TouristContextSender,
} from "./tourist-context";

describe("tourist-context", () => {
  beforeEach(() => {
    clearTouristContextCache();
  });

  it("reads tourist ids from URL query aliases", () => {
    expect(
      readTouristContextFromSearch("?touristTmcId=tmc-1&Touristmmsid=mms-1"),
    ).toEqual({
      TouristTmcId: "tmc-1",
      TouristMmsId: "mms-1",
    });
  });

  it("does not fetch Home-Tourist when query already has ids", async () => {
    const sender: TouristContextSender = {
      send: vi.fn(),
    };

    await expect(
      resolveTouristContext({
        appId: "app",
        sender,
        search: "?TouristTmcId=tmc-q&TouristMmsId=mms-q",
      }),
    ).resolves.toEqual({
      TouristTmcId: "tmc-q",
      TouristMmsId: "mms-q",
    });
    expect(sender.send).not.toHaveBeenCalled();
  });

  it("fetches Home-Tourist when query ids are missing", async () => {
    let captured: ProxySendOptions | undefined;
    const sender: TouristContextSender = {
      send: vi.fn(async (options: ProxySendOptions) => {
        captured = options;
        return {
          TouristTmcId: "tmc-api",
          TouristMmsId: "mms-api",
        } as never;
      }) as TouristContextSender["send"],
    };

    await expect(
      resolveTouristContext({
        appId: "com.test.app",
        sender,
        search: "",
      }),
    ).resolves.toEqual({
      TouristTmcId: "tmc-api",
      TouristMmsId: "mms-api",
    });

    expect(captured).toMatchObject({
      method: "TmcApiHomeUrl-Home-Tourist",
      data: { AppId: "com.test.app" },
      requestFields: {
        IsRedirctLogin: false,
        IsRedirctNoAuthorize: false,
      },
    });
  });

  it("normalizes numeric Home-Tourist ids from real API", async () => {
    const sender: TouristContextSender = {
      send: vi.fn(async () => ({
        TouristTmcId: 10001,
        TouristMmsId: 1,
      }) as never) as TouristContextSender["send"],
    };

    await expect(
      resolveTouristContext({
        appId: "com.test.app",
        sender,
        search: "",
      }),
    ).resolves.toEqual({
      TouristTmcId: "10001",
      TouristMmsId: "1",
    });
  });

  it("injects tourist ids into top-level request fields and Data.TmcId", () => {
    const request = withTouristContext(
      {
        method: "TmcTouristFlightUrl-Home-Index",
        data: {
          Date: "2026-07-01",
          TmcId: "business-tmc",
          FromCode: "BJS",
        },
        requestFields: {
          TmcId: "business-tmc",
          forceRefresh: true,
        },
      },
      {
        TouristTmcId: "tourist-tmc",
        TouristMmsId: "tourist-mms",
      },
    );

    expect(request.requestFields).toEqual({
      forceRefresh: true,
      TmcId: "tourist-tmc",
      MmsId: "tourist-mms",
    });
    expect(request.data).toEqual({
      Date: "2026-07-01",
      FromCode: "BJS",
      TmcId: "tourist-tmc",
    });
  });

  it("fails instead of falling back to TMC channel when context is incomplete", async () => {
    const sender: TouristContextSender = {
      send: vi.fn(async () => ({
        TouristTmcId: "tmc-api",
        TouristMmsId: "",
      }) as never) as TouristContextSender["send"],
    };

    await expect(
      resolveTouristContext({
        appId: "app",
        sender,
        search: "",
      }),
    ).rejects.toThrow("Tourist context missing TouristTmcId or TouristMmsId");
  });

  it("sends tourist methods with injected context", async () => {
    const sent: ProxySendOptions[] = [];
    const sender: TouristContextSender = {
      send: vi.fn(async (options: ProxySendOptions) => {
        sent.push(options);
        if (options.method === "TmcApiHomeUrl-Home-Tourist") {
          return {
            TouristTmcId: "tmc-api",
            TouristMmsId: "mms-api",
          } as never;
        }
        return { ok: true } as never;
      }) as TouristContextSender["send"],
    };

    await expect(
      sendWithTouristContext({
        appId: "app",
        sender,
        search: "",
        request: {
          method: "TmcTouristHotelUrl-Home-List",
          data: { CityCode: "1101" },
        },
      }),
    ).resolves.toEqual({ ok: true });

    expect(sent[1]).toMatchObject({
      method: "TmcTouristHotelUrl-Home-List",
      requestFields: {
        TmcId: "tmc-api",
        MmsId: "mms-api",
      },
      data: {
        CityCode: "1101",
        TmcId: "tmc-api",
      },
    });
  });

  it("rejects non-tourist methods in tourist sender wrapper", async () => {
    const sender: TouristContextSender = {
      send: vi.fn(),
    };

    await expect(
      sendWithTouristContext({
        appId: "app",
        sender,
        search: "?TouristTmcId=tmc-q&TouristMmsId=mms-q",
        request: {
          method: "TmcApiHotelUrl-Home-List",
          data: {},
        },
      }),
    ).rejects.toThrow("Tourist context can only be used with TmcTourist methods");
    expect(sender.send).not.toHaveBeenCalled();
  });
});
