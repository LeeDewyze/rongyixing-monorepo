import type { HotelOrderHistory } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT, HOTEL_ORDER_SECTION_TITLE } from "@/components/hotel/hotel-detail-chrome";
import { formatApprovalExpiredTime } from "@/lib/hotel-order-detail";

interface HotelOrderApprovalSectionProps {
  histories: HotelOrderHistory[];
}

export function HotelOrderApprovalSection({ histories }: HotelOrderApprovalSectionProps) {
  if (histories.length === 0) {
    return null;
  }

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <h2 className={`mb-2 ${HOTEL_ORDER_SECTION_TITLE}`}>审批记录</h2>
      <div className="space-y-3">
        {histories.map((item, index) => (
          <div
            key={`${item.InsertTime ?? "history"}-${index}`}
            className="rounded-lg bg-[#F8FAFC] px-3 py-2.5"
          >
            {item.TypeName ? (
              <p className="text-[13px] font-medium text-brand-primary">{item.TypeName}</p>
            ) : null}
            <p className="mt-1 text-[14px] text-[#333333]">
              {[item.ApproverName, item.StatusName].filter(Boolean).join(" · ") || "—"}
            </p>
            <p className="mt-1 text-[12px] text-[#999999]">提交：{item.InsertTime ?? "—"}</p>
            <p className="text-[12px] text-[#999999]">
              截止：{formatApprovalExpiredTime(item.ExpiredTime)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
