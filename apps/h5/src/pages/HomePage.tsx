import { Button } from "@ryx/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ryx/ui/components/ui/card";

import example from "@/content/example.json";
import { getAppName } from "@/lib/env";

export function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{getAppName()}</h1>
        <p className="mt-2 text-muted-foreground">Touch-first mobile experience.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{example.title}</CardTitle>
          <CardDescription>{example.body}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button className="w-full">Get Started</Button>
          <Button variant="outline" className="w-full">
            Learn More
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
