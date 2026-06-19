import { Link, useParams } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ryx/ui/components/ui/card";

import { useHotelDetail } from "@/hooks/useHotelList";

const CHECK_IN = "2026-06-20";
const CHECK_OUT = "2026-06-21";

export function HotelDetailPage() {
  const { hotelId = "" } = useParams();
  const { data, isLoading, error } = useHotelDetail(hotelId, CHECK_IN, CHECK_OUT);

  if (isLoading) return <p className="p-4 text-muted-foreground">加载中…</p>;
  if (error) {
    return (
      <p className="p-4 text-destructive">
        {error instanceof Error ? error.message : "加载失败"}
      </p>
    );
  }
  if (!data) return <p className="p-4">酒店不存在</p>;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">{data.HotelName}</h1>
      <p className="text-sm text-muted-foreground">{data.Address}</p>
      <p className="text-sm">
        {CHECK_IN} → {CHECK_OUT}
      </p>

      {(data.Rooms ?? []).map((room) => (
        <Card key={room.RoomId}>
          <CardHeader>
            <CardTitle className="text-base">{room.RoomName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {room.Plans.map((plan) => (
              <div
                key={plan.PlanId}
                className="flex items-center justify-between gap-2 border-b pb-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{plan.PlanName}</p>
                  <p className="text-xs text-muted-foreground">{plan.CancelPolicy}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold text-primary">¥{plan.Price}</span>
                  <Button asChild size="sm">
                    <Link
                      to={`/hotel/${hotelId}/book?planId=${plan.PlanId}&checkIn=${CHECK_IN}&checkOut=${CHECK_OUT}`}
                    >
                      预订
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
