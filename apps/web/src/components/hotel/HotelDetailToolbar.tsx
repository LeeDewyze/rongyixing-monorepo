import { Link } from "react-router-dom";

interface HotelDetailToolbarProps {
  passengerCount: number;
  passengerHref: string;
  canFilterPolicy: boolean;
  selfBookOnly?: boolean;
  onOpenPolicyFilter: () => void;
}

export function HotelDetailToolbar({
  passengerCount,
  passengerHref,
  canFilterPolicy,
  selfBookOnly = false,
  onOpenPolicyFilter,
}: HotelDetailToolbarProps) {
  return (
    <div className="mx-3 mt-3 flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
      {selfBookOnly ? (
        <span className="text-[14px] font-medium text-brand-primary">差旅标准</span>
      ) : (
        <Link
          to={passengerHref}
          className="relative inline-flex items-center gap-2 text-[14px] text-brand-primary"
        >
          <span>添加旅客</span>
          {passengerCount > 0 ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-[#E72932] text-[11px] font-medium text-white">
              {passengerCount}
            </span>
          ) : null}
        </Link>
      )}

      <button
        type="button"
        disabled={!canFilterPolicy}
        onClick={onOpenPolicyFilter}
        className="text-[14px] text-brand-primary disabled:text-[#CCCCCC]"
      >
        过滤差标
      </button>
    </div>
  );
}
