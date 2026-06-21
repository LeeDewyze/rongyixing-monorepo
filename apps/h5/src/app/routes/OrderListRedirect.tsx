import { Navigate, useLocation } from "react-router-dom";

interface OrderListRedirectProps {
  to: string;
}

/** Preserves query string when redirecting legacy order list paths. */
export function OrderListRedirect({ to }: OrderListRedirectProps) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}
