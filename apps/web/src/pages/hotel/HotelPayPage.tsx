import { Navigate, useParams, useSearchParams } from "react-router-dom";

/** Booking pay entry — unified with order pay route. */
export function HotelPayPage() {
  const { orderId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  return <Navigate to={`/orders/hotel/${orderId}/pay${qs ? `?${qs}` : ""}`} replace />;
}
