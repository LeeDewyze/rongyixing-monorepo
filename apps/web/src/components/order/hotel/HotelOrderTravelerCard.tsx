import type { HotelOrderRoom } from "@ryx/shared-types";
import { inferCredentialTypeLabelFromMaskedNumber } from "@ryx/shared-types";

import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";
import { OrderDetailInsetCell } from "@/components/order/OrderDetailInsetCell";
import { normalizeTravelerCredentialTypeLabel } from "@/lib/hotel-order-detail";

interface HotelOrderTravelerCardProps {
  room: HotelOrderRoom;
  hideViolation?: boolean;
}

function displayOrEmpty(value?: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "";
}

function formatCredentialValue(room: HotelOrderRoom) {
  const number =
    room.Traveler?.CredentialHideNumber?.trim() ?? room.Traveler?.CredentialNumber?.trim();
  if (!number) return "";

  const typeLabel =
    normalizeTravelerCredentialTypeLabel(room.Traveler?.CredentialType) ??
    inferCredentialTypeLabelFromMaskedNumber(number);

  return (
    <span className="flex min-w-0 items-center justify-end gap-2">
      <span className="truncate">{number}</span>
      {typeLabel ? <span className="shrink-0 whitespace-nowrap">{typeLabel}</span> : null}
    </span>
  );
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

      <div className="grid grid-cols-3 gap-3">
        <OrderDetailInsetCell
          label="姓名"
          value={displayOrEmpty(traveler?.Name ?? room.CustomerName)}
        />
        <OrderDetailInsetCell label="证件号码" value={formatCredentialValue(room)} multilineValue />
        <OrderDetailInsetCell label="联系电话" value={displayOrEmpty(traveler?.Mobile)} />
        <OrderDetailInsetCell label="联系邮箱" value={displayOrEmpty(traveler?.Email)} />
        <OrderDetailInsetCell label="成本中心" value={displayOrEmpty(traveler?.CostCenterName)} />
        <OrderDetailInsetCell label="组织架构" value={displayOrEmpty(traveler?.OrganizationName)} />
        {traveler?.ExpenseType ? (
          <OrderDetailInsetCell label="费用类别" value={traveler.ExpenseType} />
        ) : null}
        {!hideViolation && traveler?.PolicyName ? (
          <OrderDetailInsetCell label="差旅政策" value={traveler.PolicyName} multilineValue />
        ) : null}
        {!hideViolation && traveler?.IllegalReason ? (
          <OrderDetailInsetCell label="违规原因" value={traveler.IllegalReason} multilineValue />
        ) : null}
        {traveler?.OtherGuestNames ? (
          <OrderDetailInsetCell
            label="其他入住人"
            value={traveler.OtherGuestNames}
            multilineValue
          />
        ) : null}
        <OrderDetailInsetCell label="外部编号" value={displayOrEmpty(traveler?.OutNumbers)} />
      </div>
    </section>
  );
}
