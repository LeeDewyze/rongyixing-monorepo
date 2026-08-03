import type { ReactNode } from "react";

import { FlightBookExpandableSummaryCard } from "@/components/flight/FlightBookExpandableSummaryCard";

interface HotelBookRoomCardProps {
  passengerName: string;
  credentialSubtitle: string;
  expanded: boolean;
  onToggleExpand: () => void;
  credentialSwitchAction?: ReactNode;
  children?: ReactNode;
}

export function HotelBookRoomCard({
  passengerName,
  credentialSubtitle,
  expanded,
  onToggleExpand,
  credentialSwitchAction,
  children,
}: HotelBookRoomCardProps) {
  return (
    <FlightBookExpandableSummaryCard
      surface="plain"
      className="overflow-hidden rounded-xl bg-[#F8FAFF] ring-1 ring-[#DCE8FF]"
      name={passengerName}
      subtitle={credentialSubtitle}
      expanded={expanded}
      onToggleExpanded={onToggleExpand}
      footerAction={credentialSwitchAction}
    >
      {children}
    </FlightBookExpandableSummaryCard>
  );
}
