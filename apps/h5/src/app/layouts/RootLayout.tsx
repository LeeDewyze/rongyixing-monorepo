import { Outlet } from "react-router-dom";

import { DevMenu } from "@/components/DevMenu";
import { H5Shell } from "@/components/H5Shell";

export function RootLayout() {
  return (
    <H5Shell>
      <Outlet />
      <DevMenu />
    </H5Shell>
  );
}
