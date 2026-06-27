import type { HotelOrderRoom } from "@ryx/shared-types";

import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";
import { OrderTravelerCredentialRow } from "../OrderTravelerCredentialRow";
import { HotelOrderDetailRow } from "./HotelOrderDetailRow";

interface HotelOrderTravelerCardProps {
  room: HotelOrderRoom;
  hideViolation?: boolean;
}

function displayOrEmpty(value?: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "";
}

export function HotelOrderTravelerCard({
  room,
  hideViolation = false,
}: HotelOrderTravelerCardProps) {
  const traveler = room.Traveler;

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <h2 className={`mb-3 ${HOTEL_ORDER_SECTION_TITLE}`}>旅客信息</h2>

      <HotelOrderDetailRow
        label="姓名"
        value={displayOrEmpty(traveler?.Name ?? room.CustomerName)}
      />
      <OrderTravelerCredentialRow
        label="证件号码"
        number={traveler?.CredentialNumber}
        type={traveler?.CredentialType}
      />
      <HotelOrderDetailRow label="联系电话" value={displayOrEmpty(traveler?.Mobile)} />
      <HotelOrderDetailRow label="联系邮箱" value={displayOrEmpty(traveler?.Email)} />
      <HotelOrderDetailRow label="成本中心" value={displayOrEmpty(traveler?.CostCenterName)} />
      <HotelOrderDetailRow label="组织架构" value={displayOrEmpty(traveler?.OrganizationName)} />
      {traveler?.ExpenseType ? (
        <HotelOrderDetailRow label="费用类别" value={traveler.ExpenseType} />
      ) : null}
      {!hideViolation && traveler?.PolicyName ? (
        <HotelOrderDetailRow label="差旅政策" value={traveler.PolicyName} />
      ) : null}
      {!hideViolation && traveler?.IllegalReason ? (
        <HotelOrderDetailRow label="违规原因" value={traveler.IllegalReason} />
      ) : null}
      {traveler?.OtherGuestNames ? (
        <HotelOrderDetailRow label="其他入住人" value={traveler.OtherGuestNames} />
      ) : null}
      <HotelOrderDetailRow label="外部编号" value={displayOrEmpty(traveler?.OutNumbers)} />
    </section>
  );
}
