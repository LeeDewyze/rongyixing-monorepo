import type { PassengerBookInfo } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { PolicyFilterSheet } from "@/components/policy/PolicyFilterSheet";

interface HotelPolicyFilterSheetProps {
  open: boolean;
  passengers: PassengerBookInfo[];
  /** True when「不过滤差标」is the active filter (distinct from unset passenger id). */
  showAllSelected: boolean;
  selectedPassengerId: string | null;
  onClose: () => void;
  onConfirm: (passengerId: string | null) => void;
}

export function HotelPolicyFilterSheet({
  open,
  passengers,
  showAllSelected,
  selectedPassengerId,
  onClose,
  onConfirm,
}: HotelPolicyFilterSheetProps) {
  return (
    <PolicyFilterSheet
      open={open}
      passengers={passengers}
      showAllSelected={showAllSelected}
      selectedPassengerId={selectedPassengerId}
      description="选择查看全部价格，或按旅客差旅标准筛选"
      fontClassName={HOTEL_DETAIL_FONT}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
