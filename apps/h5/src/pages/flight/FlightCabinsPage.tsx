import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";

import { usePageHeader } from "@/components/layout";

/** Placeholder until Wave 5b (Home-Detail + cabins UI). */
export function FlightCabinsPage() {
  const { flightId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const listQuery = searchParams.toString();

  usePageHeader({ title: "舱位选择", showBack: true });

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        航班 {flightId} · 舱位页（`Home-Detail`）将在下一步迁移。
      </p>
      <Button asChild variant="outline">
        <Link to={listQuery ? `/flight/list?${listQuery}` : "/flight/list"}>
          返回列表
        </Link>
      </Button>
    </div>
  );
}
