import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ryx/ui/components/ui/card";
import { ProductType, toHotelBookPassenger } from "@ryx/shared-types";

import { PassengerSelectEntry } from "@/components/passenger";
import { usePageHeader } from "@/components/layout";
import { useHotelInitBook, useHotelSubmitBook, useTravelForms } from "@/hooks/useHotelBook";
import { usePassengerSelection } from "@/hooks/usePassenger";

export function HotelBookPage() {
  const { hotelId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get("planId") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";

  const returnTo = `/hotel/${hotelId}/book?${searchParams.toString()}`;
  const { selected } = usePassengerSelection(ProductType.Hotel);
  const { data: travelFormsData } = useTravelForms("Hotel");
  const initBook = useHotelInitBook();
  const submitBook = useHotelSubmitBook();

  const [travelFormId, setTravelFormId] = useState("");

  const travelForms = travelFormsData?.TravelForms ?? [];

  const selectedPassengers = useMemo(
    () => selected.map(toHotelBookPassenger),
    [selected],
  );

  async function handleSubmit() {
    if (selectedPassengers.length === 0) return;

    await initBook.mutateAsync({
      HotelId: hotelId,
      PlanId: planId,
      CheckInDate: checkIn,
      CheckOutDate: checkOut,
      Passengers: selectedPassengers,
      TravelFormId: travelFormId || undefined,
    });

    const result = await submitBook.mutateAsync({
      HotelId: hotelId,
      PlanId: planId,
      CheckInDate: checkIn,
      CheckOutDate: checkOut,
      Passengers: selectedPassengers,
      ContactName: selectedPassengers[0]?.Name,
      ContactMobile: selectedPassengers[0]?.Mobile,
      TravelFormId: travelFormId || undefined,
    });

    navigate(`/hotel/result/${result.OrderId}`);
  }

  const isPending = initBook.isPending || submitBook.isPending;
  const error = initBook.error ?? submitBook.error;

  usePageHeader({
    title: "填写订单",
    subtitle: checkIn && checkOut ? `${checkIn} → ${checkOut}` : undefined,
    showBack: true,
  });

  return (
    <div className="space-y-4 p-4 pb-24">
      {travelForms.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">出差单（可选）</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={travelFormId}
              onChange={(e) => setTravelFormId(e.target.value)}
            >
              <option value="">不关联出差单（个人支付）</option>
              {travelForms.map((form) => (
                <option key={form.Id} value={form.Id}>
                  {form.TravelNumber ?? form.Id}
                  {form.Title ? ` · ${form.Title}` : ""}
                  {form.StartDate && form.EndDate
                    ? ` (${form.StartDate} ~ ${form.EndDate})`
                    : ""}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      ) : null}

      <PassengerSelectEntry
        forType={ProductType.Hotel}
        returnTo={returnTo}
        title="选择入住人"
        emptyHint="请选择入住人"
      />

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "提交失败"}
        </p>
      ) : null}

      <Button
        className="fixed bottom-4 left-4 right-4"
        disabled={selectedPassengers.length === 0 || isPending}
        onClick={() => void handleSubmit()}
      >
        {isPending ? "提交中…" : "提交订单"}
      </Button>
    </div>
  );
}
