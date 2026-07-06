import type { TrainOrderTicket } from "@ryx/shared-types";

import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";
import { OrderTravelerCredentialRow } from "../OrderTravelerCredentialRow";
import { HotelOrderDetailRow } from "../hotel/HotelOrderDetailRow";

interface TrainOrderTravelerCardProps {
  ticket: TrainOrderTicket;
}

function formatPassengerName(ticket: TrainOrderTicket): string {
  const name = ticket.Traveler?.Name ?? "—";
  const typeName = ticket.PassengerTypeName;
  return typeName ? `${name}（${typeName}）` : name;
}

function displayOrEmpty(value?: string): string {
  return value?.trim() ?? "";
}

export function TrainOrderTravelerCard({ ticket }: TrainOrderTravelerCardProps) {
  const traveler = ticket.Traveler;

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <h2 className={`mb-3 ${HOTEL_ORDER_SECTION_TITLE}`}>旅客信息</h2>

      <HotelOrderDetailRow label="旅客姓名" value={formatPassengerName(ticket)} />
      <OrderTravelerCredentialRow
        number={traveler?.CredentialNumber}
        type={traveler?.CredentialType}
      />
      <HotelOrderDetailRow label="联系电话" value={displayOrEmpty(traveler?.Mobile)} />
      <HotelOrderDetailRow label="联系邮箱" value={displayOrEmpty(traveler?.Email)} />
      <HotelOrderDetailRow label="成本中心" value={displayOrEmpty(traveler?.CostCenterName)} />
      <HotelOrderDetailRow label="组织架构" value={displayOrEmpty(traveler?.OrganizationName)} />
      <HotelOrderDetailRow label="费用类别" value={displayOrEmpty(traveler?.ExpenseType)} />
      <HotelOrderDetailRow label="违规内容" value={displayOrEmpty(traveler?.PolicyName)} />
      <HotelOrderDetailRow label="违规原因" value={displayOrEmpty(traveler?.IllegalReason)} />
    </section>
  );
}
