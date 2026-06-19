import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ryx/ui/components/ui/card";
import type { HotelBookPassenger } from "@ryx/shared-types";

import {
  useHotelInitBook,
  useHotelSubmitBook,
  usePassengerList,
  useTravelForms,
} from "@/hooks/useHotelBook";

export function HotelBookPage() {
  const { hotelId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get("planId") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";

  const { data: passengersData } = usePassengerList();
  const { data: travelFormsData } = useTravelForms("Hotel");
  const initBook = useHotelInitBook();
  const submitBook = useHotelSubmitBook();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [travelFormId, setTravelFormId] = useState("");

  const passengers = passengersData?.Passengers ?? [];
  const travelForms = travelFormsData?.TravelForms ?? [];

  const selectedPassengers: HotelBookPassenger[] = useMemo(
    () =>
      passengers
        .filter((p) => selectedIds.includes(p.Id))
        .map((p) => ({
          Name: p.Name,
          Mobile: p.Mobile,
          CredentialNo: p.CredentialNo,
          CredentialType: p.CredentialType,
          travelFormId: p.travelFormId,
        })),
    [passengers, selectedIds],
  );

  function togglePassenger(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

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

  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-xl font-bold">填写订单</h1>
      <p className="text-sm text-muted-foreground">
        {checkIn} → {checkOut}
      </p>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">选择入住人</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {passengers.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无常旅客</p>
          ) : (
            passengers.map((p) => (
              <label
                key={p.Id}
                className="flex cursor-pointer items-center gap-3 rounded-md border p-3"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(p.Id)}
                  onChange={() => togglePassenger(p.Id)}
                />
                <span>
                  {p.Name}
                  {p.Mobile ? ` · ${p.Mobile}` : ""}
                </span>
              </label>
            ))
          )}
        </CardContent>
      </Card>

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
