import type { FlightFare } from "@ryx/shared-types";

import {
  FareRuleCabinSummaryCard,
  FareRuleSection,
  FareRulesBottomSheet,
} from "@/components/flight/flight-fare-rule-presentation";
import {
  fareBaggageText,
  formatCabinInfoLine,
  formatFareSalesPrice,
  prepareFlightFareForDisplay,
  prepareFlightFareRulesForSheet,
} from "@/lib/flight-detail";

interface FlightFareRulesSheetProps {
  open: boolean;
  fare: FlightFare | null;
  onClose: () => void;
}

export function FlightFareRulesSheet({ open, fare, onClose }: FlightFareRulesSheetProps) {
  if (!open || !fare) return null;

  const cabin = prepareFlightFareForDisplay(fare);
  const rules = prepareFlightFareRulesForSheet(fare);
  const cabinLine = formatCabinInfoLine(fare);
  const baggage = fareBaggageText(fare);
  const price = formatFareSalesPrice(cabin.SalesPrice);
  const visibleRules = rules.filter(
    (rule) => Boolean(rule.Description?.trim()) || Boolean(rule.Details?.length),
  );
  const baggageOnlyRules = visibleRules.filter((rule) => {
    const name = rule.Name?.trim() ?? "";
    return name.includes("行李") || name.includes("托运");
  });
  const policyRules = visibleRules.filter((rule) => !baggageOnlyRules.includes(rule));
  const showBaggageInSummary = Boolean(baggage) && baggageOnlyRules.length === 0;

  return (
    <FareRulesBottomSheet
      open={open}
      title="退改签详情"
      titleId="flight-fare-rules-title"
      onClose={onClose}
    >
      {visibleRules.length === 0 && !cabinLine && !baggage ? (
        <p className="py-8 text-center text-[13px] text-[#999999]">暂无退改签政策信息</p>
      ) : (
        <div className="space-y-2.5">
          {cabinLine ? (
            <FareRuleCabinSummaryCard
              cabinLine={cabinLine}
              price={price || undefined}
              baggage={showBaggageInSummary ? baggage : undefined}
              isAgreement={cabin.IsAgreement}
            />
          ) : null}

          {policyRules.map((rule, index) => (
            <FareRuleSection key={`${rule.Name ?? "rule"}-${index}`} rule={rule} />
          ))}

          {baggageOnlyRules.map((rule, index) => (
            <FareRuleSection key={`baggage-${rule.Name ?? "rule"}-${index}`} rule={rule} />
          ))}
        </div>
      )}
    </FareRulesBottomSheet>
  );
}
