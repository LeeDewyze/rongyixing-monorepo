import { Outlet, useLocation } from "react-router-dom";

import { FlightListTimeoutDialogHost } from "@/components/flight/FlightListTimeoutDialogHost";
import { H5Shell } from "@/components/H5Shell";
import { PageHeaderProvider, PageHeaderSlot } from "@/components/layout";

export function RootLayout() {
  const location = useLocation();

  return (
    <PageHeaderProvider>
      <H5Shell header={<PageHeaderSlot />}>
        <Outlet key={location.pathname} />
        <FlightListTimeoutDialogHost />
      </H5Shell>
    </PageHeaderProvider>
  );
}
