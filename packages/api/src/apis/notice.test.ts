import { describe, expect, it, vi } from "vitest";

import { TMC_METHODS } from "../methods/tmc.js";
import { createNoticeApi, normalizeNoticeDetail, normalizeNoticeList } from "./notice.js";

describe("normalizeNoticeList", () => {
  it("maps legacy notice rows with Title", () => {
    expect(
      normalizeNoticeList([
        { Id: 1, Title: "系统维护", InsertTime: "2026-01-01T00:00:00" },
        { Id: 2, title: "lowercase title" },
      ]),
    ).toEqual([
      { Id: 1, Title: "系统维护", InsertTime: "2026-01-01T00:00:00" },
      { Id: 2, Title: "lowercase title" },
    ]);
  });

  it("maps Description, Detail, and FullFileName on list rows", () => {
    expect(
      normalizeNoticeList([
        {
          Id: 3,
          Title: "t",
          Description: "summary",
          Detail: "<p>body</p>",
          FullFileName: "http://image.example/a.png",
        },
      ]),
    ).toEqual([
      {
        Id: 3,
        Title: "t",
        Description: "summary",
        Detail: "<p>body</p>",
        FullFileName: "http://image.example/a.png",
      },
    ]);
  });

  it("drops rows without title", () => {
    expect(normalizeNoticeList([{ Id: 3 }, { Id: 4, Title: "ok" }])).toEqual([
      { Id: 4, Title: "ok" },
    ]);
  });
});

describe("normalizeNoticeDetail", () => {
  it("allows detail without Title when Description is present", () => {
    expect(
      normalizeNoticeDetail({
        Id: 9,
        Description: "客服电话",
        Detail: "<p>正文</p>",
      }),
    ).toEqual({
      Id: 9,
      Title: "客服电话",
      Description: "客服电话",
      Detail: "<p>正文</p>",
    });
  });
});

describe("createNoticeApi", () => {
  it("uses proxy send with TmcApiHomeUrl notice list method", async () => {
    const send = vi
      .fn()
      .mockResolvedValue([
        { Id: 40000000005, Title: "火车票改签优化", InsertTime: "2025-05-06T09:43:26" },
      ]);
    const api = createNoticeApi({ send } as never);

    const list = await api.getList({ PageIndex: 0, PageSize: 20 });

    expect(send).toHaveBeenCalledWith({
      method: TMC_METHODS.NOTICE_LIST,
      data: { PageIndex: 0, PageSize: 20 },
    });
    expect(list).toHaveLength(1);
    expect(list[0]?.Title).toBe("火车票改签优化");
  });
});
