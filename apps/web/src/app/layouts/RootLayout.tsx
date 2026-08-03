import { Outlet, useLocation } from "react-router-dom";

import { FlightListTimeoutDialogHost } from "@/components/flight/FlightListTimeoutDialogHost";
import { PageHeaderProvider, PageHeaderSlot } from "@/components/layout";
import { WebShell } from "@/components/WebShell";

export function RootLayout() {
  const location = useLocation();

  return (
    <PageHeaderProvider>
      <WebShell>
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <PageHeaderSlot />
          <div className="min-h-0 flex-1 overflow-hidden">
            <Outlet key={location.pathname} />
          </div>
          <FlightListTimeoutDialogHost />
        </div>
      </WebShell>
    </PageHeaderProvider>
  );
}
