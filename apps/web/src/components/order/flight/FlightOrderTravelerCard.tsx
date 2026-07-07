import type { FlightOrderTicket } from "@ryx/shared-types";
import { inferCredentialTypeLabelFromMaskedNumber } from "@ryx/shared-types";

import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";
import { normalizeTravelerCredentialTypeLabel } from "@/lib/hotel-order-detail";
import { OrderDetailInsetCell } from "@/components/order/OrderDetailInsetCell";

interface FlightOrderTravelerCardProps {
  ticket: FlightOrderTicket;
}

function formatPassengerName(ticket: FlightOrderTicket): string {
  const name = ticket.Traveler?.Name ?? "—";
  const typeName = ticket.PassengerTypeName;
  return typeName ? `${name}（${typeName}）` : name;
}

function displayOrEmpty(value?: string): string {
  return value?.trim() ?? "";
}

function formatCredentialValue(ticket: FlightOrderTicket) {
  const number = ticket.Traveler?.CredentialNumber?.trim();
  if (!number) return "";

  const typeLabel =
    normalizeTravelerCredentialTypeLabel(ticket.Traveler?.CredentialType) ??
    inferCredentialTypeLabelFromMaskedNumber(number);

  return (
    <span className="flex min-w-0 items-center justify-end gap-2">
      <span className="truncate">{number}</span>
      {typeLabel ? <span className="shrink-0 whitespace-nowrap">{typeLabel}</span> : null}
    </span>
  );
}

export function FlightOrderTravelerCard({ ticket }: FlightOrderTravelerCardProps) {
  const traveler = ticket.Traveler;

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <h2 className={`mb-3 ${HOTEL_ORDER_SECTION_TITLE}`}>旅客信息</h2>

      <div className="grid grid-cols-3 gap-3">
        <OrderDetailInsetCell label="旅客姓名" value={formatPassengerName(ticket)} />
        <OrderDetailInsetCell
          label="证件号码"
          value={formatCredentialValue(ticket)}
          multilineValue
        />
        <OrderDetailInsetCell label="联系电话" value={displayOrEmpty(traveler?.Mobile)} />
        <OrderDetailInsetCell label="联系邮箱" value={displayOrEmpty(traveler?.Email)} />
        <OrderDetailInsetCell label="成本中心" value={displayOrEmpty(traveler?.CostCenterName)} />
        <OrderDetailInsetCell label="组织架构" value={displayOrEmpty(traveler?.OrganizationName)} />
        <OrderDetailInsetCell label="费用类别" value={displayOrEmpty(traveler?.ExpenseType)} />
        <OrderDetailInsetCell label="违规内容" value={displayOrEmpty(traveler?.PolicyName)} />
        <OrderDetailInsetCell label="违规原因" value={displayOrEmpty(traveler?.IllegalReason)} />
      </div>
    </section>
  );
}
