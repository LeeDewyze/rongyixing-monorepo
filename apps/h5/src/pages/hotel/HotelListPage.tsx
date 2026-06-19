import { Link } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ryx/ui/components/ui/card";

import { useHotelList } from "@/hooks/useHotelList";

export function HotelListPage() {
  const { data, isLoading, error } = useHotelList({ CityCode: "010" });

  if (isLoading) {
    return <p className="p-4 text-muted-foreground">加载中…</p>;
  }

  if (error) {
    return (
      <p className="p-4 text-destructive">
        {error instanceof Error ? error.message : "加载失败"}
      </p>
    );
  }

  const hotels = data?.Hotels ?? [];

  if (hotels.length === 0) {
    return <p className="p-4 text-muted-foreground">暂无酒店</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">酒店列表</h1>
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
              <Link to={`/hotel/${hotel.HotelId}`}>查看详情</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
