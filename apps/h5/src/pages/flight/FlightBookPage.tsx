import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductType } from "@ryx/shared-types";

import { FlightBookBillSheet } from "@/components/flight/FlightBookBillSheet";
import { FlightBookFooter } from "@/components/flight/FlightBookFooter";
import { FlightBookPassengers } from "@/components/flight/FlightBookPassengers";
import { FlightBookPayTypes } from "@/components/flight/FlightBookPayTypes";
import { FlightBookSummary } from "@/components/flight/FlightBookSummary";
import { FlightCabinsHeader } from "@/components/flight/FlightCabinsHeader";
import { FlightFareRulesSheet } from "@/components/flight/FlightFareRulesSheet";
import { usePageHeader } from "@/components/layout";
import { FLIGHT_CABINS_HEADER_BG } from "@/config/flight-cabins";
import {
  useFlightBookSelection,
  useFlightInitBook,
  useFlightSubmitBook,
} from "@/hooks/useFlightBook";
import { usePassengerSelection } from "@/hooks/usePassenger";
import {
  buildFlightOrderBookDto,
  resolveFlightBookDisplayAmount,
  resolveFlightBookOrderId,
} from "@/lib/flight-book";
import {
  parseFlightPayTypeOptions,
  resolveDefaultFlightPayType,
  resolveFlightHoldMinutes,
} from "@/lib/flight-book-pay";
import { buildCabinsHref, clearFlightBookSelection } from "@/lib/flight-book-session";
import { isFlightListTimedOut } from "@/lib/flight-list-refresh";
import { formatApiError } from "@/lib/formatApiError";
import { clearPassengerSelection } from "@/lib/passenger-selection";

export function FlightBookPage() {
  const navigate = useNavigate();
  const { selection } = useFlightBookSelection();
  const { selected } = usePassengerSelection(ProductType.Flight);
  const submitBook = useFlightSubmitBook();

  const [travelPayType, setTravelPayType] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  const returnTo = "/flight/book";

  const initParams = useMemo(() => {
    if (!selection || selected.length === 0) return null;
    return buildFlightOrderBookDto({
      selection,
      passengers: selected,
    });
  }, [selection, selected]);

  const initBook = useFlightInitBook(initParams);

  const payOptions = useMemo(
    () => parseFlightPayTypeOptions(initBook.data?.PayTypes),
    [initBook.data?.PayTypes],
  );

  const resolvedPayType = travelPayType ?? resolveDefaultFlightPayType(payOptions);
  const personHoldMinutes = resolveFlightHoldMinutes(initBook.data);

  useEffect(() => {
    if (!selection) {
      navigate("/flight/list", { replace: true });
    }
  }, [navigate, selection]);

  useEffect(() => {
    if (travelPayType != null || !payOptions.length) return;
    setTravelPayType(resolveDefaultFlightPayType(payOptions));
  }, [payOptions, travelPayType]);

  usePageHeader({ visible: false });

  if (!selection) {
    return null;
  }

  const timedOut = isFlightListTimedOut(selection.priceSnapshotAt);
  const orderAmount = resolveFlightBookDisplayAmount(selection, selected.length);
  const unitPrice = Number(selection.fare.SalesPrice ?? selection.fare.TicketPrice ?? 0);
  const isPending = initBook.isFetching || submitBook.isPending;
  const error = initBook.error ?? submitBook.error;

  function handleBack() {
    navigate(buildCabinsHref(selection));
  }

  async function handleSubmit() {
    if (!selection || selected.length === 0 || !initParams || !agreed) return;
    if (timedOut) {
      window.alert("您的停留时间过长，价格信息可能发生变动，请重新查询");
      navigate(buildCabinsHref(selection));
      return;
    }

    const first = selected[0]?.credential;
    const bookDto = buildFlightOrderBookDto({
      selection,
      passengers: selected,
      travelPayType: resolvedPayType,
      linkman: first?.Name
        ? { name: first.Name, mobile: first.Mobile ?? "" }
        : undefined,
    });

    const result = await submitBook.mutateAsync(bookDto);
    const orderId = resolveFlightBookOrderId(result);
    clearFlightBookSelection();
    clearPassengerSelection(ProductType.Flight);
    navigate("/orders", {
      replace: true,
      state: orderId ? { bookedOrderId: orderId, product: "flight" } : undefined,
    });
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f2f4f8] pb-[calc(8.75rem+env(safe-area-inset-bottom))]">
      <div
        className="sticky top-0 z-20 shrink-0 pt-[env(safe-area-inset-top)]"
        style={{
          backgroundColor: FLIGHT_CABINS_HEADER_BG,
          backgroundImage:
            "linear-gradient(180deg, #8fc5ff 0%, #cfe3ff 58%, #f2f4f8 100%)",
        }}
      >
        <FlightCabinsHeader title="填写订单" onBack={handleBack} />
        <FlightBookSummary selection={selection} onShowRules={() => setRulesOpen(true)} />
      </div>

      <div className="space-y-3 px-3 py-3">
        <FlightBookPassengers returnTo={returnTo} />

        {initBook.isFetching ? (
          <p className="text-center text-[13px] text-[#808080]">正在初始化订单…</p>
        ) : (
          <FlightBookPayTypes
            options={payOptions}
            value={resolvedPayType}
            personHoldMinutes={personHoldMinutes}
            onChange={setTravelPayType}
          />
        )}

        {timedOut ? (
          <p className="text-[13px] text-[#ff8d1a]">
            价格信息可能已过期，提交前请返回舱位页重新查询。
          </p>
        ) : null}

        {error ? (
          <p className="text-[13px] text-destructive">{formatApiError(error)}</p>
        ) : null}
      </div>

      <FlightBookFooter
        amount={orderAmount}
        agreed={agreed}
        pending={isPending}
        disabled={selected.length === 0 || isPending || initBook.isError}
        onAgreedChange={setAgreed}
        onShowBill={() => setBillOpen(true)}
        onSubmit={() => void handleSubmit()}
      />

      <FlightFareRulesSheet
        open={rulesOpen}
        fare={selection.fare}
        onClose={() => setRulesOpen(false)}
      />

      <FlightBookBillSheet
        open={billOpen}
        unitPrice={unitPrice}
        passengerCount={selected.length}
        onClose={() => setBillOpen(false)}
      />
    </div>
  );
}
