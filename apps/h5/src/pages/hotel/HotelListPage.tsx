import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@ryx/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ryx/ui/components/ui/card";

import { useHotelList } from "@/hooks/useHotelList";
import { usePageHeader } from "@/components/layout";
import { formatApiError } from "@/lib/formatApiError";

export function HotelListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const cityCode = searchParams.get("cityCode") ?? "";
  const cityName = searchParams.get("cityName") ?? cityCode;
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";

  const hasParams = Boolean(cityCode && checkIn && checkOut);

  useEffect(() => {
    if (!hasParams) navigate("/hotel", { replace: true });
  }, [hasParams, navigate]);

  const { data, isLoading, error } = useHotelList(
    hasParams
      ? { CityCode: cityCode, CityName: cityName, CheckInDate: checkIn, CheckOutDate: checkOut }
      : {},
  );

  if (!hasParams) return null;

  const hotels = data?.Hotels ?? [];

  usePageHeader({
    title: cityName,
    subtitle: `${checkIn} → ${checkOut} 共${hotels.length}家酒店`,
    showBack: true,
  });

  return (
    <div className="space-y-4 p-4 pb-20">
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link to="/hotel">修改</Link>
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
      {error ? <p className="text-sm text-destructive">{formatApiError(error)}</p> : null}

      {!isLoading && !error && hotels.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无酒店</p>
      ) : null}

      {hotels.map((hotel) => (
        <Card key={hotel.HotelId}>
          <CardHeader>
            <CardTitle className="text-base">{hotel.HotelName}</CardTitle>
            <CardDescription>{hotel.Address}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-lg font-semibold text-primary">
              ¥{hotel.MinPrice ?? "-"}起
            </span>
            <Button asChild size="sm">
              <Link
                to={`/hotel/${hotel.HotelId}?checkIn=${checkIn}&checkOut=${checkOut}&cityCode=${cityCode}`}
              >
                查看详情
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
