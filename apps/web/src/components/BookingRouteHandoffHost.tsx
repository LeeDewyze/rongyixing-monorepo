import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ProductType } from "@ryx/shared-types";

import { clearFlightBookSelection } from "@/lib/flight-book-session";
import { clearFlightExchangeSession } from "@/lib/flight-exchange-session";
import { clearHotelBookSelection } from "@/lib/hotel-book-session";
import { clearPassengerSelection } from "@/lib/passenger-selection";
import { clearTrainBookSelection } from "@/lib/train-book-session";
import { clearTrainExchangeSession } from "@/lib/train-exchange-session";
import { stripAppBasePath } from "@/lib/base-path";

type BookingProduct = "flight" | "hotel" | "train";

interface BookingRouteHandoff {
  product: BookingProduct;
  target: string;
  clearExchangeSession?: boolean;
}

interface RouteState {
  bookingHandoff?: BookingRouteHandoff;
}

function currentPath(location: ReturnType<typeof useLocation>): string {
  return stripAppBasePath(`${location.pathname}${location.search}`);
}

export function BookingRouteHandoffHost() {
  const location = useLocation();
  const handledHandoffRef = useRef<string | null>(null);

  useEffect(() => {
    const state = location.state as RouteState | null;
    const handoff = state?.bookingHandoff;
    if (!handoff || handoff.target !== currentPath(location)) return;

    const handoffKey = `${location.key}:${handoff.product}:${handoff.target}`;
    if (handledHandoffRef.current === handoffKey) return;
    handledHandoffRef.current = handoffKey;

    if (handoff.product === "flight") {
      clearFlightBookSelection();
      clearPassengerSelection(ProductType.Flight);
      if (handoff.clearExchangeSession) clearFlightExchangeSession();
    } else if (handoff.product === "hotel") {
      clearHotelBookSelection();
      clearPassengerSelection(ProductType.Hotel);
    } else {
      clearTrainBookSelection();
      clearPassengerSelection(ProductType.Train);
      if (handoff.clearExchangeSession) clearTrainExchangeSession();
    }

    console.info("[ryx] booking route handoff completed", {
      product: handoff.product,
      target: handoff.target,
    });
  }, [location]);

  return null;
}
