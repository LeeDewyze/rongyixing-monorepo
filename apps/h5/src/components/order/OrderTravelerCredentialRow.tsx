import { inferCredentialTypeLabelFromMaskedNumber } from "@ryx/shared-types";

import {
  HOTEL_ORDER_ROW_LABEL,
  HOTEL_ORDER_ROW_VALUE,
} from "@/components/hotel/hotel-detail-chrome";
import { normalizeTravelerCredentialTypeLabel } from "@/lib/hotel-order-detail";

interface OrderTravelerCredentialRowProps {
  label?: string;
  number?: string;
  type?: string;
}

export function OrderTravelerCredentialRow({
  label = "证件号码",
  number,
  type,
}: OrderTravelerCredentialRowProps) {
  const typeLabel =
    normalizeTravelerCredentialTypeLabel(type) ?? inferCredentialTypeLabelFromMaskedNumber(number);

  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className={`shrink-0 ${HOTEL_ORDER_ROW_LABEL}`}>{label}</span>
      {!number?.trim() ? (
        <span className={`min-w-0 ${HOTEL_ORDER_ROW_VALUE}`} />
      ) : (
        <span
          className={`flex min-w-0 flex-1 items-center justify-end gap-2 ${HOTEL_ORDER_ROW_VALUE}`}
        >
          <span className="min-w-0 break-all text-right">{number}</span>
          {typeLabel ? <span className="shrink-0 whitespace-nowrap">{typeLabel}</span> : null}
        </span>
      )}
    </div>
  );
}
