import { Button } from "@ryx/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ryx/ui/components/ui/card";

import example from "@/content/example.json";
import { BREAKPOINTS } from "@/config/site";
import { getAppName } from "@/lib/env";

export function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{getAppName()}</h1>
        <p className="mt-2 text-muted-foreground">
          Pad ({BREAKPOINTS.pad}px–{BREAKPOINTS.pc - 1}px) and PC (≥{BREAKPOINTS.pc}px)
          responsive layout.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{example.title}</CardTitle>
          <CardDescription>{example.body}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 pad:grid-cols-2 pc:grid-cols-3">
        {["Pad layout", "Touch friendly", "PC layout"].map((label) => (
          <div
            key={label}
            className="rounded-lg border bg-card p-4 text-sm pointer-coarse:min-h-11"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
