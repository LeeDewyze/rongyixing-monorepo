import { describe, expect, it } from "vitest";

import { formatPolicyAlertDisplayMessage } from "./HotelPolicyAlertDialog";

describe("formatPolicyAlertDisplayMessage", () => {
  it("keeps legacy comma-joined Name(id);rule copy on one line", () => {
    expect(
      formatPolicyAlertDisplayMessage(
        "申晓杰(410928********5121);违反座位类型,SUN/XUE(EB6862294);违反座位类型，超标不可预订",
      ),
    ).toBe("申晓杰(410928********5121);违反座位类型,SUN/XUE(EB6862294);违反座位类型，超标不可预订");
  });

  it("converts legacy train Name;credential;rule chunks", () => {
    expect(
      formatPolicyAlertDisplayMessage(
        "申晓杰;410928********5121;违反座位类型,SUN/XUE;EB6862294;违反座位类型，超标不可预订",
      ),
    ).toBe("申晓杰(410928********5121);违反座位类型,SUN/XUE(EB6862294);违反座位类型，超标不可预订");
  });
});
