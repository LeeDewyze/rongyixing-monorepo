import { Navigate, Outlet, useLocation } from "react-router-dom";

import { BookingRouteHandoffHost } from "@/components/BookingRouteHandoffHost";
import { buildLoginPath, isAuthenticated } from "@/lib/auth";

/** Redirect unauthenticated users to password login with returnTo. */
export function RequireAuth() {
  const location = useLocation();

  if (!isAuthenticated()) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={buildLoginPath(returnTo)} replace />;
  }

  return (
    <>
      <BookingRouteHandoffHost />
      <Outlet />
    </>
  );
}
