import type { FlightBookPolicy } from "@ryx/shared-types";

import {
  formatPolicyDescriptions,
  formatPolicyRules,
  isSpringAirlineReminder,
  policyHasViolation,
} from "@/lib/flight-book-policy";

interface FlightBookPolicyBannerProps {
  policy?: FlightBookPolicy;
  airline?: string;
}

export function FlightBookPolicyBanner({ policy, airline }: FlightBookPolicyBannerProps) {
  const descriptions = formatPolicyDescriptions(policy);
  const rules = formatPolicyRules(policy);
  const showSpringTip = isSpringAirlineReminder(airline);

  if (!showSpringTip && !descriptions && !policyHasViolation(policy)) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-xl bg-white px-3 py-3">
      {showSpringTip ? (
        <p className="text-[13px] text-[#2468f7]">
          温馨提醒：无论何种原因航班延误或取消，春秋航空不提供任何补偿。
        </p>
      ) : null}

      {descriptions ? (
        <p className="text-[13px] text-[#666666]">{descriptions}</p>
      ) : null}

      {policyHasViolation(policy) ? (
        <div className="text-[13px] text-[#ff8d1a]">
          <span>超标：</span>
          <span>{rules}</span>
        </div>
      ) : null}
    </div>
  );
}
