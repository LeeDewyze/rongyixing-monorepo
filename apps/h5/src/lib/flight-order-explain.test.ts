import { describe, expect, it } from "vitest";

import { parseFlightOrderExplain } from "./flight-order-explain";

const SAMPLE_EXPLAIN = `退票费
2026年06月19日 16:30前 ￥33/人
2026年06月23日 16:30前 ￥66/人
改期费
2026年06月19日 16:30前 ￥17/人
托运行李额
1件,每件23KG,体积不超过40*60*100cm
签转条件
不得签转`;

describe("parseFlightOrderExplain", () => {
  it("parses structured explain text into fare rule rows", () => {
    const sections = parseFlightOrderExplain(SAMPLE_EXPLAIN);
    expect(sections).toHaveLength(4);
    expect(sections?.[0]).toMatchObject({
      Name: "退票费",
      Details: [
        { name: "2026年06月19日 16:30前", value: "￥33/人" },
        { name: "2026年06月23日 16:30前", value: "￥66/人" },
      ],
    });
    expect(sections?.[2]).toMatchObject({
      Name: "托运行李额",
      Description: "1件,每件23KG,体积不超过40*60*100cm",
    });
  });

  it("returns null for unstructured explain text", () => {
    expect(parseFlightOrderExplain("退票：起飞前2小时前收取票面价20%手续费")).toBeNull();
    expect(parseFlightOrderExplain("")).toBeNull();
  });
});
