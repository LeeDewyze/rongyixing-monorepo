import { Link } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ryx/ui/components/ui/card";

import { usePageHeader } from "@/components/layout";
import example from "@/content/example.json";
import { getApiMode, getAppName } from "@/lib/env";

export function HomePage() {
  usePageHeader({ title: getAppName(), showBack: false });

  return (
    <div className="space-y-6 p-4">
      <p className="text-muted-foreground">
        Touch-first mobile experience · API {getApiMode()}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>{example.title}</CardTitle>
          <CardDescription>{example.body}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link to="/hotel">酒店预订</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/flight">机票预订</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/train">火车票预订</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">登录</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
