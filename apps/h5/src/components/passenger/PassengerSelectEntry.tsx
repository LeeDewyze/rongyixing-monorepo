import { Link } from "react-router-dom";
import type { PassengerBookInfo, ProductType } from "@ryx/shared-types";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent } from "@ryx/ui/components/ui/card";

import { usePassengerSelection } from "@/hooks/usePassenger";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";
import { credentialDisplayNumber, credentialDisplayType } from "@ryx/shared-types";

interface PassengerSelectEntryProps {
  forType: ProductType;
  returnTo: string;
  title?: string;
  emptyHint?: string;
}

/** Embeddable block: shows selected passengers and link to full select page. */
export function PassengerSelectEntry({
  forType,
  returnTo,
  title = "选择出行人",
  emptyHint = "请选择出行人",
}: PassengerSelectEntryProps) {
  const { selected } = usePassengerSelection(forType);
  const selectPath = buildPassengerSelectPath(forType, returnTo);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button asChild variant="outline" size="sm">
            <Link to={selectPath}>{selected.length > 0 ? "修改" : "去选择"}</Link>
          </Button>
        </div>

        {selected.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          <ul className="space-y-2">
            {selected.map((item: PassengerBookInfo) => (
              <li
                key={item.id}
                className="rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="font-medium">{item.credential.Name}</span>
                <span className="ml-2 text-muted-foreground">
                  {credentialDisplayType(item.credential)} {credentialDisplayNumber(item.credential)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
