import type { OrderContact } from "@ryx/shared-types";

import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";

import { HotelOrderDetailRow } from "../hotel/HotelOrderDetailRow";

interface FlightOrderContactCardProps {
  contact?: OrderContact;
}

function displayOrEmpty(value?: string): string {
  return value?.trim() ?? "";
}

export function FlightOrderContactCard({ contact }: FlightOrderContactCardProps) {
  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <h2 className={`mb-3 ${HOTEL_ORDER_SECTION_TITLE}`}>联系人信息</h2>

      <HotelOrderDetailRow label="姓名" value={displayOrEmpty(contact?.Name)} />
      <HotelOrderDetailRow label="邮箱" value={displayOrEmpty(contact?.Email)} />
      <HotelOrderDetailRow label="电话" value={displayOrEmpty(contact?.Mobile)} />
    </section>
  );
}
