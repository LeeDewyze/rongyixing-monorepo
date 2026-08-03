import { Navigate, useParams, useSearchParams } from "react-router-dom";

/** Booking pay entry — unified with order pay route. */
export function TrainPayPage() {
  const { orderId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  return <Navigate to={`/orders/train/${orderId}/pay${qs ? `?${qs}` : ""}`} replace />;
}
