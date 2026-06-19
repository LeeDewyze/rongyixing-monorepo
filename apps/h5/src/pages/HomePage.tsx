import { Link } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ryx/ui/components/ui/card";

import example from "@/content/example.json";
import { getApiMode } from "@/lib/env";
import { getAppName } from "@/lib/env";

export function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{getAppName()}</h1>
        <p className="mt-2 text-muted-foreground">
          Touch-first mobile experience · API {getApiMode()}
        </p>
      </div>

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
            <Link to="/login">登录</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
