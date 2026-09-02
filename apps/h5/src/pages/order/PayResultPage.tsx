import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { readPendingPayContext } from "@/lib/pay-result-callback";
import { getOrderResultPath } from "@/lib/order-routes";

const PRODUCT_TYPES = new Set(["Flight", "Train", "Hotel"]);

export function PayResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const context = readPendingPayContext();
    const orderId = searchParams.get("orderId") || context?.orderId;
    const productType = searchParams.get("productType") || context?.productType;
    const channel = searchParams.get("channel") || context?.channel;
    if (!orderId || !productType || !PRODUCT_TYPES.has(productType)) {
      navigate("/home/orders", { replace: true });
      return;
    }
    const query = channel ? `?channel=${encodeURIComponent(channel)}` : "";
    navigate(
      `${getOrderResultPath(productType as "Flight" | "Train" | "Hotel", orderId)}${query}`,
      {
        replace: true,
      },
    );
  }, [navigate, searchParams]);

  return (
    <div className="ryx-viewport-min flex items-center justify-center bg-[#F5F6F9] text-sm text-[#666666]">
      支付结果确认中…
    </div>
  );
}
