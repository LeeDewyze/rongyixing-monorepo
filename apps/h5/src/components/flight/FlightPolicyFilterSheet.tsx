import type { PassengerBookInfo } from "@ryx/shared-types";

import { PolicyFilterSheet } from "@/components/policy/PolicyFilterSheet";

interface FlightPolicyFilterSheetProps {
  open: boolean;
  passengers: PassengerBookInfo[];
  showAllSelected: boolean;
  selectedPassengerId: string | null;
  onClose: () => void;
  onConfirm: (passengerId: string | null) => void;
}

export function FlightPolicyFilterSheet({
  open,
  passengers,
  showAllSelected,
  selectedPassengerId,
  onClose,
  onConfirm,
}: FlightPolicyFilterSheetProps) {
  return (
    <PolicyFilterSheet
      open={open}
      passengers={passengers}
      showAllSelected={showAllSelected}
      selectedPassengerId={selectedPassengerId}
      description="选择查看全部舱位，或按旅客差旅标准筛选"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
