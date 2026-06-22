import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ryx/ui/components/ui/card";

import { useTrainList } from "@/hooks/useTrainSearchForm";
import { usePageHeader } from "@/components/layout";
import { formatApiError } from "@/lib/formatApiError";

export function TrainListPage() {
  const [searchParams] = useSearchParams();

  const params = {
    Date: searchParams.get("date") ?? "",
    FromStation: searchParams.get("fromCode") ?? "",
    ToStation: searchParams.get("toCode") ?? "",
    FromName: searchParams.get("fromName") ?? undefined,
    ToName: searchParams.get("toName") ?? undefined,
  };

  const fromName = params.FromName ?? params.FromStation;
  const toName = params.ToName ?? params.ToStation;

  const { data, isLoading, error } = useTrainList(
    params.Date && params.FromStation && params.ToStation ? params : null,
  );

  const trains = data?.Trains ?? [];

  usePageHeader({
    title: `${fromName} - ${toName}`,
    subtitle: `${params.Date} 共${trains.length}个车次`,
    showBack: true,
  });

  return (
    <div className="space-y-4 p-4 pb-20">
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link to="/home?product=train">修改</Link>
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">加载中…</p> : null}
      {error ? <p className="text-sm text-destructive">{formatApiError(error)}</p> : null}

      {!isLoading && !error && trains.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无车次</p>
      ) : null}

      {trains.map((train) => (
        <Card key={train.Id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{train.TrainCode}</CardTitle>
            <CardDescription>{train.Duration}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm">
              <p>
                {train.StartTime?.slice(-5)} → {train.ArrivalTime?.slice(-5)}
              </p>
              <p className="text-muted-foreground">
                {train.FromStation} — {train.ToStation}
              </p>
            </div>
            <span className="text-lg font-semibold text-primary">
              ¥{train.LowestPrice ?? "-"}起
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
