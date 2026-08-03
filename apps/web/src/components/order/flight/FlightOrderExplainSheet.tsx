import {
  FareRuleSectionList,
  FareRulesBottomSheet,
} from "@/components/flight/flight-fare-rule-presentation";
import { parseFlightOrderExplain } from "@/lib/flight-order-explain";

interface FlightOrderExplainSheetProps {
  open: boolean;
  explain?: string;
  onClose: () => void;
}

export function FlightOrderExplainSheet({ open, explain, onClose }: FlightOrderExplainSheetProps) {
  const structuredRules = parseFlightOrderExplain(explain);
  const plainText = explain?.trim();

  return (
    <FareRulesBottomSheet
      open={open}
      title="退改签说明"
      titleId="flight-order-explain-title"
      onClose={onClose}
    >
      {structuredRules ? (
        <FareRuleSectionList rules={structuredRules} />
      ) : plainText ? (
        <div className="rounded-xl bg-[#F8F9FC] px-3.5 py-3 ring-1 ring-[#EEF1F6]">
          <p className="whitespace-pre-wrap text-[13px] leading-[1.65] text-[#666666]">{plainText}</p>
        </div>
      ) : (
        <p className="py-8 text-center text-[13px] text-[#999999]">暂无退改签政策信息</p>
      )}
    </FareRulesBottomSheet>
  );
}
