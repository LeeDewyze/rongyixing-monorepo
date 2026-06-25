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
      className="overflow-hidden rounded-xl ring-1 ring-[#EEF1F6]"
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
