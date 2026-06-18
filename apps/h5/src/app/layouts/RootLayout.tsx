import { Outlet } from "react-router-dom";

import { H5Shell } from "@/components/H5Shell";

export function RootLayout() {
  return (
    <H5Shell>
      <Outlet />
    </H5Shell>
  );
}
