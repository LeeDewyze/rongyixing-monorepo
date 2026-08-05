import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { PassengerBookInfo, ProductType } from "@ryx/shared-types";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent } from "@ryx/ui/components/ui/card";

import { useBusinessSelfBookPassenger } from "@/hooks/useBusinessSelfBookPassenger";
import { isBusinessTravelMode, loadHomeTravelMode } from "@/lib/flight-travel-mode";
import { buildPassengerSelectPath } from "@/lib/passenger-selection";
import {
  resolveTravelPolicyRecord,
  TravelPolicyDialog,
} from "@/components/policy/TravelPolicyDialog";
import { credentialDisplayNumber, credentialDisplayType } from "@ryx/shared-types";

interface PassengerSelectEntryProps {
  forType: ProductType;
  returnTo: string;
  title?: string;
  emptyHint?: string;
  businessMode?: boolean;
}

/** Embeddable block: shows selected passengers and link to full select page. */
export function PassengerSelectEntry({
  forType,
  returnTo,
  title = "选择出行人",
  emptyHint = "请选择出行人",
  businessMode,
}: PassengerSelectEntryProps) {
  const [policyOpen, setPolicyOpen] = useState(false);
  const enabled = businessMode ?? isBusinessTravelMode(loadHomeTravelMode());
  const {
    passengers: selected,
    isSelfBookOnly,
    isLoading,
    selfPassenger,
    staff,
    policyStaff,
  } = useBusinessSelfBookPassenger(forType, enabled);
  const selectPath = buildPassengerSelectPath(forType, returnTo);
  const travelPolicy = useMemo(
    () =>
      resolveTravelPolicyRecord(selfPassenger?.passenger) ??
      resolveTravelPolicyRecord(policyStaff) ??
      resolveTravelPolicyRecord(staff),
    [policyStaff, selfPassenger, staff],
  );
  const policyPassengerName = selfPassenger?.credential.Name ?? selfPassenger?.passenger.Name;

  return (
    <>
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{title}</h2>
            {isSelfBookOnly ? (
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm font-medium text-brand-primary hover:bg-brand-primary/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-50"
                disabled={isLoading}
                onClick={() => setPolicyOpen(true)}
              >
                差旅标准
              </button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to={selectPath}>{selected.length > 0 ? "修改" : "去选择"}</Link>
              </Button>
            )}
          </div>

          {selected.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyHint}</p>
          ) : (
            <ul className="space-y-2">
              {selected.map((item: PassengerBookInfo) => (
                <li key={item.id} className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <span className="font-medium">{item.credential.Name}</span>
                  <span className="ml-2 text-muted-foreground">
                    {credentialDisplayType(item.credential)}{" "}
                    {credentialDisplayNumber(item.credential)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <TravelPolicyDialog
        open={policyOpen}
        passengerName={policyPassengerName}
        policy={travelPolicy}
        loading={isLoading}
        productType={forType}
        onClose={() => setPolicyOpen(false)}
      />
    </>
  );
}
