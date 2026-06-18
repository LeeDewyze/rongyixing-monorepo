import { Outlet } from "react-router-dom";

import { WebShell } from "@/components/WebShell";

export function RootLayout() {
  return (
    <WebShell>
      <Outlet />
    </WebShell>
  );
}
