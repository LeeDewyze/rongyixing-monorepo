import { FareRulesBottomSheet } from "@/components/flight/flight-fare-rule-presentation";

interface TrainOrderExplainSheetProps {
  open: boolean;
  explain?: string;
  onClose: () => void;
}

export function TrainOrderExplainSheet({ open, explain, onClose }: TrainOrderExplainSheetProps) {
  const plainText = explain?.trim();

  return (
    <FareRulesBottomSheet
      open={open}
      title="退改签说明"
      titleId="train-order-explain-title"
      onClose={onClose}
    >
      {plainText ? (
        <div className="rounded-xl bg-[#F8F9FC] px-3.5 py-3 ring-1 ring-[#EEF1F6]">
          <p className="whitespace-pre-wrap text-[13px] leading-[1.65] text-[#666666]">{plainText}</p>
        </div>
      ) : (
        <p className="py-8 text-center text-[13px] text-[#999999]">暂无退改签政策信息</p>
      )}
    </FareRulesBottomSheet>
  );
}
