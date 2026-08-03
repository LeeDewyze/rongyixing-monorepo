import { useSyncExternalStore } from "react";

import { FlightListTimeoutDialog } from "@/components/flight/FlightListTimeoutDialog";
import {
  confirmFlightListTimeoutDialog,
  getFlightListTimeoutDialogOpen,
  subscribeFlightListTimeoutDialog,
} from "@/lib/flight-list-timeout-dialog";

/** Single app-wide instance of the flight list stale-price dialog. */
export function FlightListTimeoutDialogHost() {
  const open = useSyncExternalStore(
    subscribeFlightListTimeoutDialog,
    getFlightListTimeoutDialogOpen,
    getFlightListTimeoutDialogOpen,
  );

  return (
    <FlightListTimeoutDialog open={open} onConfirm={confirmFlightListTimeoutDialog} />
  );
}
